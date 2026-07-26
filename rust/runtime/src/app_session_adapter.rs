use std::collections::BTreeMap;

use vo_app_runtime::{
    AppSession, EndpointChannelBinding, SurfaceDescriptor, SurfaceHandle, SurfaceInputPolicy,
    SurfaceKind, ViewHandle,
};
use vogui_protocol::v2::UiRootId;

use crate::app_runtime_bridge::{AppRuntimeUiLane, AppRuntimeUiLaneError, UiSurfaceControlAction};
use crate::command::UiCommand;
use crate::reload::ReloadPhase;
use crate::{PresentationBatch, ReloadRollback, RootDetach, UiReturn, UiSession, UiSessionError};

const MAX_FRAMEWORK_RETURNS_PER_SAFE_POINT: usize = 256;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HostedUiError {
    Ui(UiSessionError),
    Lane(AppRuntimeUiLaneError),
    AppSession(String),
}

impl From<UiSessionError> for HostedUiError {
    fn from(error: UiSessionError) -> Self {
        Self::Ui(error)
    }
}

impl From<AppRuntimeUiLaneError> for HostedUiError {
    fn from(error: AppRuntimeUiLaneError) -> Self {
        Self::Lane(error)
    }
}

struct HostedRootBinding {
    surface: SurfaceHandle,
    view: ViewHandle,
    z_order: i32,
    input: SurfaceInputPolicy,
    detached: Option<RootDetach>,
    staged_presentation: Option<PresentationBatch>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HostedUiSafePoint {
    pub processed_returns: Vec<UiReturn>,
    pub held_returns: usize,
    pub reload_rollback: Option<ReloadRollback>,
    pub published_presentations: Vec<(UiRootId, u64)>,
    pub published_command: Option<u64>,
}

pub struct HostedUiSession {
    ui: UiSession,
    lane: AppRuntimeUiLane,
    staged_command: Option<UiCommand>,
    roots: BTreeMap<UiRootId, HostedRootBinding>,
}

impl HostedUiSession {
    pub fn open(session: &AppSession, ui: UiSession) -> Result<Self, HostedUiError> {
        let lane = AppRuntimeUiLane::open(session, ui.id())?;
        Ok(Self {
            ui,
            lane,
            staged_command: None,
            roots: BTreeMap::new(),
        })
    }

    pub const fn ui(&self) -> &UiSession {
        &self.ui
    }

    pub fn ui_mut(&mut self) -> &mut UiSession {
        &mut self.ui
    }

    pub const fn framework_binding(&self) -> EndpointChannelBinding {
        self.lane.binding()
    }

    pub fn service_framework_lane(
        &mut self,
        session: &AppSession,
        now_millis: u64,
    ) -> Result<HostedUiSafePoint, HostedUiError> {
        let mut processed_returns = Vec::new();
        let mut held_returns = 0;
        let mut reload_rollback = self.ui.service_reload_deadline_and_restore(now_millis)?;

        for _ in 0..MAX_FRAMEWORK_RETURNS_PER_SAFE_POINT {
            let Some(item) = self.lane.poll_return(session)? else {
                break;
            };
            if self.ui.reload_phase() == ReloadPhase::Idle {
                self.ui.queue_return(item)?;
                let processed = self
                    .ui
                    .process_next_return()?
                    .expect("the return queued at this safe point remains available");
                processed_returns.push(processed);
            } else {
                let rollback = self.ui.queue_return_during_reload(item, now_millis)?;
                if let Some(rollback) = rollback {
                    reload_rollback = Some(rollback);
                    held_returns = 0;
                } else {
                    held_returns += 1;
                }
            }
        }

        if reload_rollback.is_some() {
            while processed_returns.len() < MAX_FRAMEWORK_RETURNS_PER_SAFE_POINT {
                let Some(item) = self.ui.process_next_return()? else {
                    break;
                };
                processed_returns.push(item);
            }
        }

        let roots = self.roots.keys().copied().collect::<Vec<_>>();
        let mut published_presentations = Vec::new();
        for root in roots {
            let needs_presentation = self
                .roots
                .get(&root)
                .expect("root identity came from the live hosted root map")
                .staged_presentation
                .is_none();
            if needs_presentation {
                let next = self.ui.poll_presentation(root)?;
                self.roots
                    .get_mut(&root)
                    .expect("root remains live during the serial safe point")
                    .staged_presentation = next;
            }
            let binding = self
                .roots
                .get_mut(&root)
                .expect("root remains live during the serial safe point");
            let Some(batch) = binding.staged_presentation.as_ref() else {
                continue;
            };
            self.lane.publish(session, batch)?;
            let revision = batch.revision();
            binding.staged_presentation = None;
            published_presentations.push((root, revision));
        }

        if self.staged_command.is_none() {
            self.staged_command = self.ui.poll_command();
        }
        let published_command = if let Some(command) = self.staged_command.as_ref() {
            self.lane.publish_command(session, command)?;
            let command_id = command.command_id;
            self.staged_command = None;
            Some(command_id)
        } else {
            None
        };

        Ok(HostedUiSafePoint {
            processed_returns,
            held_returns,
            reload_rollback,
            published_presentations,
            published_command,
        })
    }

    pub fn attach_root(
        &mut self,
        session: &AppSession,
        view: ViewHandle,
        z_order: i32,
        input: SurfaceInputPolicy,
    ) -> Result<(UiRootId, SurfaceHandle), HostedUiError> {
        let window = session
            .host_view_window(view)
            .map_err(HostedUiError::AppSession)?;
        let surface = session
            .attach_host_surface(SurfaceDescriptor {
                view,
                kind: SurfaceKind::Ui,
                z_order,
                input,
                accepts_text: true,
                geometry: vo_app_runtime::SurfaceGeometry::default(),
            })
            .map_err(HostedUiError::AppSession)?;
        match self.ui.attach_root() {
            Ok(root) => {
                let ui_root_epoch = self.ui.root_epoch(root)?;
                if let Err(error) = self.lane.publish_surface_control(
                    session,
                    UiSurfaceControlAction::Attach,
                    root,
                    ui_root_epoch,
                    self.ui.app_code_epoch(),
                    window,
                    view,
                    surface,
                    z_order,
                    browser_input_policy(input),
                ) {
                    let ui_rollback = self.ui.detach_root(root);
                    let app_rollback = session.close_host_surface(surface);
                    return Err(HostedUiError::AppSession(format!(
                        "Vogui SurfaceControl attach failed with {error:?}; ui rollback={ui_rollback:?}; app rollback={app_rollback:?}"
                    )));
                }
                self.roots.insert(
                    root,
                    HostedRootBinding {
                        surface,
                        view,
                        z_order,
                        input,
                        detached: None,
                        staged_presentation: None,
                    },
                );
                Ok((root, surface))
            }
            Err(error) => {
                session.close_host_surface(surface).map_err(|rollback| {
                    HostedUiError::AppSession(format!(
                        "Vogui root attach failed with {error:?}; App Surface rollback failed: {rollback}"
                    ))
                })?;
                Err(HostedUiError::Ui(error))
            }
        }
    }

    pub fn detach_root(
        &mut self,
        session: &AppSession,
        root: UiRootId,
    ) -> Result<RootDetach, HostedUiError> {
        let ui_root_epoch = self.ui.root_epoch(root)?;
        let app_code_epoch = self.ui.app_code_epoch();
        let (surface, view, z_order, input) = {
            let binding = self
                .roots
                .get(&root)
                .ok_or(HostedUiError::Ui(UiSessionError::InvalidRoot))?;
            (
                binding.surface,
                binding.view,
                binding.z_order,
                binding.input,
            )
        };
        let window = session
            .host_view_window(view)
            .map_err(HostedUiError::AppSession)?;
        let binding = self
            .roots
            .get_mut(&root)
            .ok_or(HostedUiError::Ui(UiSessionError::InvalidRoot))?;
        if binding.detached.is_none() {
            binding.detached = Some(self.ui.detach_root(root)?);
        }
        self.lane.publish_surface_control(
            session,
            UiSurfaceControlAction::Detach,
            root,
            ui_root_epoch,
            app_code_epoch,
            window,
            view,
            surface,
            z_order,
            browser_input_policy(input),
        )?;
        session
            .close_host_surface(surface)
            .map_err(HostedUiError::AppSession)?;
        let detached = binding
            .detached
            .take()
            .expect("Vogui detach result remains staged until App Surface close succeeds");
        self.roots.remove(&root);
        Ok(detached)
    }

    pub fn shutdown(
        mut self,
        session: &AppSession,
    ) -> Result<Vec<(UiRootId, RootDetach)>, HostedUiError> {
        let roots = self.roots.keys().copied().collect::<Vec<_>>();
        let mut detached = Vec::with_capacity(roots.len());
        for root in roots {
            detached.push((root, self.detach_root(session, root)?));
        }
        Ok(detached)
    }
}

const fn browser_input_policy(input: SurfaceInputPolicy) -> u8 {
    match input {
        SurfaceInputPolicy::Observe | SurfaceInputPolicy::Passthrough => 3,
        SurfaceInputPolicy::Interactive => 2,
        SurfaceInputPolicy::Exclusive => 1,
    }
}
