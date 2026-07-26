export interface Handle {
  readonly index: number;
  readonly generation: number;
}

export interface DomRendererIdentity {
  readonly session: Handle;
  readonly root: Handle;
  readonly uiRootEpoch: number;
  readonly appCodeEpoch: bigint;
  readonly rendererGeneration: Handle;
}

export type DomMountMode = "shadow" | "light";

export type DomNodeKind =
  | { readonly kind: "element"; readonly tag: PortableTag }
  | { readonly kind: "text"; readonly text: string };

export type PortableTag =
  | "div"
  | "span"
  | "p"
  | "button"
  | "a"
  | "input"
  | "textarea"
  | "label"
  | "form"
  | "img"
  | "ul"
  | "ol"
  | "li"
  | "table"
  | "thead"
  | "tbody"
  | "tr"
  | "th"
  | "td"
  | "dialog"
  | "progress"
  | "select"
  | "option"
  | "nav"
  | "section"
  | "menu";

export type DomProperty =
  | { readonly field: "text"; readonly value: string }
  | { readonly field: "inputType"; readonly value: "text" | "password" | "checkbox" | "range" }
  | { readonly field: "value"; readonly value: string; readonly acknowledgedEditSequence: bigint }
  | { readonly field: "checked"; readonly value: boolean }
  | { readonly field: "disabled"; readonly value: boolean }
  | { readonly field: "readOnly"; readonly value: boolean }
  | { readonly field: "required"; readonly value: boolean }
  | { readonly field: "multiple"; readonly value: boolean }
  | { readonly field: "hidden"; readonly value: boolean }
  | { readonly field: "inert"; readonly value: boolean }
  | { readonly field: "open"; readonly value: boolean }
  | { readonly field: "href"; readonly value: string }
  | { readonly field: "alt"; readonly value: string }
  | { readonly field: "title"; readonly value: string }
  | { readonly field: "placeholder"; readonly value: string }
  | { readonly field: "name"; readonly value: string }
  | { readonly field: "number"; readonly name: "min" | "max" | "step" | "value"; readonly value: number }
  | { readonly field: "progressNumber"; readonly name: "value" | "max"; readonly value: number }
  | { readonly field: "tabIndex"; readonly value: number }
  | { readonly field: "role"; readonly value: string }
  | { readonly field: "ariaLabel"; readonly value: string }
  | { readonly field: "ariaDescription"; readonly value: string }
  | { readonly field: "ariaState"; readonly name: string; readonly value: string }
  | { readonly field: "className"; readonly value: string }
  | { readonly field: "styleToken"; readonly name: string; readonly value: string }
  | { readonly field: "nativeStyleToken"; readonly name: string; readonly value: string }
  | { readonly field: "dataToken"; readonly name: string; readonly source: string; readonly value: string }
  | { readonly field: "resourceUrl"; readonly value: string };

export type DomMutation =
  | {
      readonly kind: "create";
      readonly node: Handle;
      readonly parent?: Handle;
      readonly index: number;
    }
  | { readonly kind: "remove"; readonly node: Handle }
  | {
      readonly kind: "move";
      readonly node: Handle;
      readonly parent?: Handle;
      readonly index: number;
    }
  | { readonly kind: "setKind"; readonly node: Handle; readonly nodeKind: DomNodeKind }
  | { readonly kind: "setProperties"; readonly node: Handle; readonly properties: readonly DomProperty[] }
  | {
      readonly kind: "bindRef";
      readonly node: Handle;
      readonly ref: Handle;
      readonly bindingGeneration: number;
    }
  | { readonly kind: "unbindRef"; readonly ref: Handle }
  | {
      readonly kind: "bindEvent";
      readonly node: Handle;
      readonly eventType: DomEventType;
      readonly token: Handle;
      readonly policy: DomEventPolicy;
    }
  | { readonly kind: "unbindEvent"; readonly token: Handle }
  | {
      readonly kind: "attachResource";
      readonly node: Handle;
      readonly resource: Handle;
      readonly sourceRevision: bigint;
    }
  | { readonly kind: "detachResource"; readonly node: Handle; readonly resource: Handle };

export interface DomResourcePublicationChunk {
  readonly identity: DomRendererIdentity;
  readonly commitRevision: bigint;
  readonly sequence: bigint;
  readonly resource: Handle;
  readonly sourceRevision: bigint;
  readonly resourceKind: number;
  readonly contentHash: Uint8Array;
  readonly totalBytes: number;
  readonly metadataBytes: number;
  readonly offset: number;
  readonly final: boolean;
  readonly metadata: Uint8Array;
  readonly bytes: Uint8Array;
}

export interface DomPatchBatch {
  readonly identity: DomRendererIdentity;
  readonly baseRevision: bigint;
  readonly newRevision: bigint;
  readonly replacement: boolean;
  readonly mutations: readonly DomMutation[];
}

export interface DomInteractiveHitRegion {
  readonly xMilli: number;
  readonly yMilli: number;
  readonly widthMilli: number;
  readonly heightMilli: number;
  readonly input: "opaque";
}

export type DomEventType =
  | "press"
  | "textEdit"
  | "keyDown"
  | "keyUp"
  | "focusIn"
  | "focusOut"
  | "pointerDown"
  | "pointerUp"
  | "pointerMove"
  | "pointerCancel"
  | "wheel"
  | "contextMenu"
  | "submit"
  | "change"
  | "dragEnter"
  | "dragOver"
  | "dragLeave"
  | "drop"
  | "input"
  | "dismiss"
  | "select"
  | "toggle"
  | "open"
  | "close"
  | "compositionStart"
  | "compositionUpdate"
  | "compositionCommit"
  | "compositionCancel";

export interface DomEventPolicy {
  readonly preventDefault: boolean;
  readonly stopPropagation: boolean;
  readonly passive: boolean;
  readonly once: boolean;
}

export type DomEventPayload =
  | { readonly kind: "press" }
  | {
      readonly kind: "textEdit";
      readonly editSequence: bigint;
      readonly text: string;
      readonly selectionStartUtf8: number;
      readonly selectionEndUtf8: number;
      readonly composing: boolean;
    }
  | {
      readonly kind: "key";
      readonly physical: string;
      readonly logical: string;
      readonly repeat: boolean;
      readonly alt: boolean;
      readonly control: boolean;
      readonly meta: boolean;
      readonly shift: boolean;
    }
  | { readonly kind: "focus"; readonly focused: boolean; readonly relatedNode?: Handle }
  | {
      readonly kind: "pointer";
      readonly pointerId: number;
      readonly pointerType: string;
      readonly xMilli: number;
      readonly yMilli: number;
      readonly button: number;
      readonly buttons: number;
    }
  | { readonly kind: "drag"; readonly mimeTypes: readonly string[]; readonly xMilli: number; readonly yMilli: number };

export interface DelegatedDomEvent {
  readonly root: Handle;
  readonly rendererGeneration: Handle;
  readonly appliedRevision: bigint;
  readonly node: Handle;
  readonly token: Handle;
  readonly sequence: bigint;
  readonly type: DomEventType;
  readonly payload: DomEventPayload;
}

export interface DomRendererLimits {
  readonly maxNodes: number;
  readonly maxMutations: number;
  readonly maxPropertiesPerNode: number;
  readonly maxStringBytes: number;
  readonly maxPendingCommands?: number;
  readonly maxFutureRevisionWindow?: bigint;
}

export type DomRendererHealth = "healthy" | "poisoned" | "closed";

export interface DomApplyResult {
  readonly revision: bigint;
  readonly replacementRequested: boolean;
}

export type DomCommandKind =
  | { readonly kind: "focus"; readonly preventScroll: boolean }
  | { readonly kind: "blur" }
  | { readonly kind: "scrollIntoView"; readonly block: ScrollLogicalPosition; readonly inline: ScrollLogicalPosition }
  | { readonly kind: "measure" }
  | { readonly kind: "setSelection"; readonly startUtf8: number; readonly endUtf8: number }
  | { readonly kind: "cancelComposition" }
  | {
      readonly kind: "beginAnimation";
      readonly animationKey: string;
      readonly animationRoot: Handle;
      readonly animationNode: Handle;
      readonly property: number;
      readonly curve: 1 | 2 | 3;
      readonly values: readonly { readonly offset: number; readonly valueMilli: bigint }[];
      readonly fromMilli: bigint;
      readonly toMilli: bigint;
      readonly durationMillis: bigint;
      readonly delayMillis: bigint;
      readonly easing: number;
    }
  | {
      readonly kind: "cancelAnimation";
      readonly animationKey: string;
      readonly animationRoot: Handle;
      readonly animationNode: Handle;
    }
  | { readonly kind: "unsupported"; readonly name: string; readonly payload: Uint8Array };

export interface DomCommand {
  readonly identity: DomRendererIdentity;
  readonly requestId: bigint;
  readonly sequence: bigint;
  readonly deadlineMillis: bigint;
  readonly minAppliedRevision: bigint;
  readonly target: Handle;
  readonly expectedBindingGeneration: number;
  readonly command: DomCommandKind;
}

export type DomCommandOutcome =
  | { readonly kind: "executed" }
  | {
      readonly kind: "measured";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly layoutRevision: bigint;
    }
  | { readonly kind: "staleBinding" }
  | { readonly kind: "deadlineExpired" }
  | { readonly kind: "futureRevision" }
  | { readonly kind: "capacity" }
  | { readonly kind: "unsupported" }
  | { readonly kind: "rendererUnavailable" };

export interface DomCommandResult {
  readonly requestId: bigint;
  readonly sequence: bigint;
  readonly appliedRevision: bigint;
  readonly target: Handle;
  readonly bindingGeneration: number;
  readonly outcome: DomCommandOutcome;
}

export type DomReturn =
  | {
      readonly kind: "applyAck";
      readonly root: Handle;
      readonly rendererGeneration: Handle;
      readonly appliedRevision: bigint;
    }
  | { readonly kind: "event"; readonly event: DelegatedDomEvent }
  | { readonly kind: "commandResult"; readonly result: DomCommandResult };

interface MirrorNode {
  parent?: string;
  children: string[];
  nodeKind?: DomNodeKind;
  properties: readonly DomProperty[];
}

interface StagedPatch {
  mirror: Map<string, MirrorNode>;
  treeRoot?: string;
  refs: Map<string, StagedRefBinding>;
  events: Map<string, EventBinding>;
  resources: Map<string, StagedResourceBinding>;
}

interface StagedResourceBinding {
  readonly nodeKey: string;
  readonly resource: Handle;
  readonly sourceRevision: bigint;
}

interface ResourceAssembly {
  readonly sourceRevision: bigint;
  readonly resourceKind: number;
  readonly contentHash: Uint8Array;
  readonly totalBytes: number;
  readonly metadataBytes: number;
  metadata: Uint8Array;
  chunks: ArrayBuffer[];
  received: number;
}

interface ResourceResidency {
  readonly sourceRevision: bigint;
  readonly resourceKind: number;
  readonly url: string;
  readonly metadata: Uint8Array;
  readonly bytes?: Uint8Array;
  readonly fontFace?: FontFace;
}

interface StagedRefBinding {
  nodeKey: string;
  bindingGeneration: number;
}

interface RefBinding extends StagedRefBinding {
  node: Node;
}

interface EventBinding {
  nodeKey: string;
  eventType: DomEventType;
  token: Handle;
  policy: DomEventPolicy;
}

interface DomInputState {
  nextEditSequence: bigint;
  editSequences: Map<string, bigint>;
  composing: Set<string>;
}

interface ActiveDomAnimation {
  readonly animation: Animation;
  readonly command: DomCommand;
  timeoutId?: number;
}

const encoder = new TextEncoder();
const portableStateStyleSheet = `
[data-vogui-node]:hover {
  color: var(--vogui-hover-color, var(--vogui-color, revert)) !important;
  background-color: var(--vogui-hover-background-color, var(--vogui-background-color, revert)) !important;
  border-color: var(--vogui-hover-border-color, var(--vogui-border-color, revert)) !important;
  border-width: var(--vogui-hover-border-width, var(--vogui-border-width, revert)) !important;
  border-radius: var(--vogui-hover-border-radius, var(--vogui-border-radius, revert)) !important;
  opacity: var(--vogui-hover-opacity, var(--vogui-opacity, revert)) !important;
  cursor: var(--vogui-hover-cursor, var(--vogui-cursor, revert)) !important;
  font-family: var(--vogui-hover-font-family, var(--vogui-font-family, revert)) !important;
  font-size: var(--vogui-hover-font-size, var(--vogui-font-size, revert)) !important;
  font-weight: var(--vogui-hover-font-weight, var(--vogui-font-weight, revert)) !important;
  line-height: var(--vogui-hover-line-height, var(--vogui-line-height, revert)) !important;
  direction: var(--vogui-hover-direction, var(--vogui-direction, revert)) !important;
}
[data-vogui-node]:focus-visible {
  color: var(--vogui-focus-color, var(--vogui-color, revert)) !important;
  background-color: var(--vogui-focus-background-color, var(--vogui-background-color, revert)) !important;
  border-color: var(--vogui-focus-border-color, var(--vogui-border-color, revert)) !important;
  border-width: var(--vogui-focus-border-width, var(--vogui-border-width, revert)) !important;
  border-radius: var(--vogui-focus-border-radius, var(--vogui-border-radius, revert)) !important;
  opacity: var(--vogui-focus-opacity, var(--vogui-opacity, revert)) !important;
  cursor: var(--vogui-focus-cursor, var(--vogui-cursor, revert)) !important;
}
[data-vogui-node]:active {
  color: var(--vogui-pressed-color, var(--vogui-color, revert)) !important;
  background-color: var(--vogui-pressed-background-color, var(--vogui-background-color, revert)) !important;
  border-color: var(--vogui-pressed-border-color, var(--vogui-border-color, revert)) !important;
  border-width: var(--vogui-pressed-border-width, var(--vogui-border-width, revert)) !important;
  border-radius: var(--vogui-pressed-border-radius, var(--vogui-border-radius, revert)) !important;
  opacity: var(--vogui-pressed-opacity, var(--vogui-opacity, revert)) !important;
  cursor: var(--vogui-pressed-cursor, var(--vogui-cursor, revert)) !important;
}
[data-vogui-node]:disabled,
[data-vogui-node][aria-disabled="true"] {
  color: var(--vogui-disabled-color, var(--vogui-color, revert)) !important;
  background-color: var(--vogui-disabled-background-color, var(--vogui-background-color, revert)) !important;
  border-color: var(--vogui-disabled-border-color, var(--vogui-border-color, revert)) !important;
  border-width: var(--vogui-disabled-border-width, var(--vogui-border-width, revert)) !important;
  border-radius: var(--vogui-disabled-border-radius, var(--vogui-border-radius, revert)) !important;
  opacity: var(--vogui-disabled-opacity, var(--vogui-opacity, revert)) !important;
  cursor: var(--vogui-disabled-cursor, var(--vogui-cursor, revert)) !important;
}
`;

export class DomRenderer {
  readonly #identity: DomRendererIdentity;
  readonly #host: HTMLElement;
  readonly #mount: ShadowRoot | HTMLElement;
  readonly #limits: DomRendererLimits;
  readonly #abort = new AbortController();
  readonly #nodeTable = new Map<string, Node>();
  readonly #refTable = new Map<string, RefBinding>();
  readonly #eventsByToken = new Map<string, EventBinding>();
  readonly #eventByNodeType = new Map<string, string>();
  readonly #observers = new Set<{ disconnect(): void }>();
  readonly #resourceReleases = new Set<() => void>();
  readonly #resourceBindings = new Map<string, StagedResourceBinding>();
  readonly #resourceAssemblies = new Map<string, ResourceAssembly>();
  readonly #resourceResidencies = new Map<string, ResourceResidency>();
  readonly #portalNodes = new Set<Node>();
  readonly #returnSink: (item: DomReturn) => void;
  readonly #nowMillis: () => bigint;
  readonly #input: DomInputState = {
    nextEditSequence: 1n,
    editSequences: new Map(),
    composing: new Set(),
  };
  readonly #pendingCommands = new Map<bigint, DomCommand>();
  readonly #pendingCommandDeadlines = new Map<bigint, ReturnType<typeof setTimeout>>();
  readonly #animations = new Map<string, ActiveDomAnimation>();
  #mirror = new Map<string, MirrorNode>();
  #treeRoot: string | undefined;
  #appliedRevision = 0n;
  #lastCommandSequence = 0n;
  #nextEventSequence = 1n;
  #health: DomRendererHealth = "healthy";

  constructor(
    host: HTMLElement,
    mode: DomMountMode,
    identity: DomRendererIdentity,
    limits: DomRendererLimits,
    returnSink: (item: DomReturn) => void,
    nowMillis: () => bigint = () => BigInt(Date.now()),
  ) {
    validateIdentity(identity);
    validateLimits(limits);
    this.#identity = identity;
    this.#host = host;
    this.#limits = limits;
    this.#returnSink = returnSink;
    this.#nowMillis = nowMillis;
    this.#mount =
      mode === "shadow"
        ? host.shadowRoot ?? host.attachShadow({ mode: "open" })
        : host;
    installPortableStateStyles(this.#mount);
    this.#installDelegation();
  }

  get appliedRevision(): bigint {
    return this.#appliedRevision;
  }

  get health(): DomRendererHealth {
    return this.#health;
  }

  interactiveHitRegions(): readonly DomInteractiveHitRegion[] {
    this.#assertHealthy();
    const hostBounds = this.#host.getBoundingClientRect();
    const nodeKeys = new Set(
      [...this.#eventsByToken.values()].map((binding) => binding.nodeKey),
    );
    const regions: DomInteractiveHitRegion[] = [];
    for (const key of nodeKeys) {
      const node = this.#nodeTable.get(key);
      if (!(node instanceof Element)) continue;
      for (const bounds of node.getClientRects()) {
        if (bounds.width <= 0 || bounds.height <= 0) continue;
        regions.push(Object.freeze({
          xMilli: domMilli(bounds.left - hostBounds.left),
          yMilli: domMilli(bounds.top - hostBounds.top),
          widthMilli: domExtentMilli(bounds.width),
          heightMilli: domExtentMilli(bounds.height),
          input: "opaque",
        }));
      }
    }
    return Object.freeze(regions);
  }

  hasModalInteraction(): boolean {
    this.#assertHealthy();
    for (const node of this.#nodeTable.values()) {
      if (!(node instanceof Element)) continue;
      if (
        (node instanceof HTMLDialogElement && node.open)
        || node.getAttribute("aria-modal") === "true"
      ) {
        const bounds = node.getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0) return true;
      }
    }
    return false;
  }

  apply(batch: DomPatchBatch): DomApplyResult {
    if (this.#health !== "healthy") {
      throw new Error(`DOM renderer is ${this.#health}`);
    }
    this.#validateBatchIdentity(batch);
    const staged = this.#validateAndStage(batch);
    try {
      if (batch.replacement) {
        this.#applyReplacement(batch, staged);
      } else {
        this.#applyMutations(batch.mutations);
      }
    } catch (cause) {
      this.#poison(cause);
      return { revision: this.#appliedRevision, replacementRequested: true };
    }
    this.#mirror = staged.mirror;
    this.#treeRoot = staged.treeRoot;
    this.#appliedRevision = batch.newRevision;
    this.#resourceBindings.clear();
    for (const [key, binding] of staged.resources) this.#resourceBindings.set(key, binding);
    this.#refreshResourceBindings();
    this.#cancelOrphanedAnimations();
    this.#returnSink({
      kind: "applyAck",
      root: this.#identity.root,
      rendererGeneration: this.#identity.rendererGeneration,
      appliedRevision: batch.newRevision,
    });
    this.#drainCommands();
    return { revision: batch.newRevision, replacementRequested: false };
  }

  submitCommand(command: DomCommand): void {
    if (this.#health !== "healthy") {
      this.#emitCommand(command, { kind: "rendererUnavailable" });
      return;
    }
    this.#validateCommandIdentity(command);
    if (command.sequence <= this.#lastCommandSequence) throw new Error("command sequence regression");
    this.#lastCommandSequence = command.sequence;
    if (command.deadlineMillis <= this.#nowMillis()) {
      this.#emitCommand(command, { kind: "deadlineExpired" });
      return;
    }
    const futureWindow = this.#limits.maxFutureRevisionWindow ?? 1024n;
    if (command.minAppliedRevision > this.#appliedRevision + futureWindow) {
      this.#emitCommand(command, { kind: "futureRevision" });
      return;
    }
    if (command.minAppliedRevision > this.#appliedRevision) {
      if (this.#pendingCommands.size >= (this.#limits.maxPendingCommands ?? 256)) {
        this.#emitCommand(command, { kind: "capacity" });
        return;
      }
      this.#pendingCommands.set(command.sequence, command);
      this.#armPendingCommandDeadline(command);
      return;
    }
    this.#executeCommand(command);
  }

  registerObserver(observer: { disconnect(): void }): void {
    this.#assertHealthy();
    this.#observers.add(observer);
  }

  registerResourceRelease(release: () => void): void {
    this.#assertHealthy();
    this.#resourceReleases.add(release);
  }

  publishResource(chunk: DomResourcePublicationChunk): void {
    this.#assertHealthy();
    this.#validateResourceIdentity(chunk);
    if (
      chunk.sourceRevision === 0n
      || chunk.resourceKind < 1
      || chunk.resourceKind > 6
      || chunk.contentHash.byteLength !== 32
      || chunk.totalBytes <= 0
      || chunk.offset < 0
      || chunk.offset + chunk.bytes.byteLength > chunk.totalBytes
    ) {
      throw new Error("invalid resource publication chunk");
    }
    const key = handleKey(chunk.resource);
    const current = this.#resourceResidencies.get(key);
    if (current !== undefined && current.sourceRevision >= chunk.sourceRevision) return;
    let assembly = this.#resourceAssemblies.get(key);
    if (assembly === undefined || assembly.sourceRevision !== chunk.sourceRevision) {
      if (chunk.offset !== 0 || chunk.metadata.byteLength !== chunk.metadataBytes) {
        throw new Error("resource publication must start at offset zero");
      }
      assembly = {
        sourceRevision: chunk.sourceRevision,
        resourceKind: chunk.resourceKind,
        contentHash: new Uint8Array(chunk.contentHash),
        totalBytes: chunk.totalBytes,
        metadataBytes: chunk.metadataBytes,
        metadata: new Uint8Array(chunk.metadata),
        chunks: [],
        received: 0,
      };
      this.#resourceAssemblies.set(key, assembly);
    }
    if (
      assembly.received !== chunk.offset
      || assembly.totalBytes !== chunk.totalBytes
      || assembly.metadataBytes !== chunk.metadataBytes
      || assembly.resourceKind !== chunk.resourceKind
    ) {
      throw new Error("resource publication chunk sequence mismatch");
    }
    const copied = new Uint8Array(chunk.bytes.byteLength);
    copied.set(chunk.bytes);
    assembly.chunks.push(copied.buffer);
    assembly.received += chunk.bytes.byteLength;
    if (!chunk.final) return;
    if (assembly.received !== assembly.totalBytes) {
      throw new Error("incomplete resource publication");
    }
    const old = this.#resourceResidencies.get(key);
    if (old !== undefined) this.#releaseResourceResidency(old);
    const bytes = joinResourceChunks(assembly.chunks, assembly.totalBytes);
    const url = URL.createObjectURL(new Blob(assembly.chunks, {
      type: resourceMimeType(assembly.resourceKind),
    }));
    const residency: ResourceResidency = {
      sourceRevision: assembly.sourceRevision,
      resourceKind: assembly.resourceKind,
      url,
      metadata: assembly.metadata,
      ...(assembly.resourceKind === 5 ? { bytes } : {}),
      ...(assembly.resourceKind === 2
        ? { fontFace: installFontResidency(key, assembly.sourceRevision, url, assembly.metadata) }
        : {}),
    };
    this.#resourceResidencies.set(key, residency);
    this.#resourceAssemblies.delete(key);
    this.#refreshResourceBindings();
  }

  retireResource(
    identity: DomRendererIdentity,
    commitRevision: bigint,
    resource: Handle,
    sourceRevision: bigint,
  ): void {
    this.#assertHealthy();
    this.#validateResourceIdentity({
      identity,
      commitRevision,
      sequence: 1n,
      resource,
      sourceRevision,
      resourceKind: 1,
      contentHash: new Uint8Array(32),
      totalBytes: 1,
      metadataBytes: 0,
      offset: 0,
      final: true,
      metadata: new Uint8Array(),
      bytes: new Uint8Array(1),
    });
    if (
      [...this.#resourceBindings.values()].some(
        (binding) => sameHandle(binding.resource, resource)
          && binding.sourceRevision <= sourceRevision,
      )
    ) {
      throw new Error("cannot retire a bound resource");
    }
    const key = handleKey(resource);
    const residency = this.#resourceResidencies.get(key);
    if (residency !== undefined && residency.sourceRevision <= sourceRevision) {
      this.#releaseResourceResidency(residency);
      this.#resourceResidencies.delete(key);
    }
    this.#resourceAssemblies.delete(key);
  }

  registerPortal(node: Node): void {
    this.#assertHealthy();
    this.#portalNodes.add(node);
  }

  close(): void {
    if (this.#health === "closed") return;
    this.#health = "closed";
    this.#abort.abort();
    for (const observer of this.#observers) observer.disconnect();
    for (const release of this.#resourceReleases) release();
    for (const portal of this.#portalNodes) portal.parentNode?.removeChild(portal);
    this.#observers.clear();
    this.#resourceReleases.clear();
    for (const residency of this.#resourceResidencies.values()) {
      this.#releaseResourceResidency(residency);
    }
    this.#resourceBindings.clear();
    this.#resourceAssemblies.clear();
    this.#resourceResidencies.clear();
    this.#portalNodes.clear();
    this.#nodeTable.clear();
    this.#refTable.clear();
    this.#eventsByToken.clear();
    this.#eventByNodeType.clear();
    for (const command of this.#pendingCommands.values()) {
      this.#emitCommand(command, { kind: "rendererUnavailable" });
    }
    this.#pendingCommands.clear();
    this.#clearPendingCommandDeadlines();
    for (const active of this.#animations.values()) {
      if (active.timeoutId !== undefined) clearTimeout(active.timeoutId);
      active.animation.cancel();
      this.#emitCommand(active.command, { kind: "rendererUnavailable" });
    }
    this.#animations.clear();
    this.#mirror.clear();
    this.#input.editSequences.clear();
    this.#input.composing.clear();
    this.#mount.replaceChildren();
  }

  #validateBatchIdentity(batch: DomPatchBatch): void {
    if (!sameHandle(batch.identity.session, this.#identity.session)) throw new Error("wrong session");
    if (!sameHandle(batch.identity.root, this.#identity.root)) throw new Error("wrong root");
    if (batch.identity.uiRootEpoch !== this.#identity.uiRootEpoch) throw new Error("stale root epoch");
    if (batch.identity.appCodeEpoch !== this.#identity.appCodeEpoch) throw new Error("stale app epoch");
    if (!sameHandle(batch.identity.rendererGeneration, this.#identity.rendererGeneration)) {
      throw new Error("stale renderer generation");
    }
    if (batch.replacement ? batch.baseRevision !== 0n : batch.baseRevision !== this.#appliedRevision) {
      throw new Error("base revision mismatch");
    }
    if (batch.newRevision <= 0n || batch.newRevision < batch.baseRevision) {
      throw new Error("invalid revision");
    }
  }

  #validateResourceIdentity(chunk: DomResourcePublicationChunk): void {
    if (!sameHandle(chunk.identity.session, this.#identity.session)) throw new Error("wrong resource session");
    if (!sameHandle(chunk.identity.root, this.#identity.root)) throw new Error("wrong resource root");
    if (chunk.identity.uiRootEpoch !== this.#identity.uiRootEpoch) throw new Error("stale resource root epoch");
    if (chunk.identity.appCodeEpoch !== this.#identity.appCodeEpoch) throw new Error("stale resource app epoch");
    if (!sameHandle(chunk.identity.rendererGeneration, this.#identity.rendererGeneration)) {
      throw new Error("stale resource renderer generation");
    }
    if (chunk.commitRevision > this.#appliedRevision) {
      throw new Error("resource publication precedes its UI revision");
    }
  }

  #refreshResourceBindings(): void {
    for (const binding of this.#resourceBindings.values()) {
      const residency = this.#resourceResidencies.get(handleKey(binding.resource));
      if (residency === undefined || residency.sourceRevision < binding.sourceRevision) continue;
      const node = this.#nodeTable.get(binding.nodeKey);
      if (node instanceof HTMLImageElement) {
        node.src = residency.url;
      } else if (node instanceof HTMLElement && residency.resourceKind === 2) {
        node.style.fontFamily = residency.fontFace?.family ?? "";
      } else if (node instanceof HTMLElement && residency.resourceKind === 4) {
        node.style.cursor = `url("${residency.url}"), auto`;
      } else if (node instanceof Text && residency.resourceKind === 5 && residency.bytes !== undefined) {
        node.data = new TextDecoder("utf-8", { fatal: true }).decode(residency.bytes);
      }
    }
  }

  #releaseResourceResidency(residency: ResourceResidency): void {
    if (residency.fontFace !== undefined) {
      document.fonts.delete(residency.fontFace);
    }
    URL.revokeObjectURL(residency.url);
  }

  #validateAndStage(batch: DomPatchBatch): StagedPatch {
    if (batch.mutations.length > this.#limits.maxMutations) throw new Error("mutation capacity");
    const mirror = batch.replacement ? new Map<string, MirrorNode>() : cloneMirror(this.#mirror);
    const refs = batch.replacement
      ? new Map<string, StagedRefBinding>()
      : new Map(
          [...this.#refTable].map(([key, binding]) => [
            key,
            { nodeKey: binding.nodeKey, bindingGeneration: binding.bindingGeneration },
          ]),
        );
    const events = batch.replacement
      ? new Map<string, EventBinding>()
      : new Map([...this.#eventsByToken].map(([key, binding]) => [key, cloneEventBinding(binding)]));
    const resources = batch.replacement
      ? new Map<string, StagedResourceBinding>()
      : new Map(this.#resourceBindings);
    let treeRoot = batch.replacement ? undefined : this.#treeRoot;
    let strings = 0;
    for (const mutation of batch.mutations) {
      strings += mutationStringBytes(mutation);
      if (strings > this.#limits.maxStringBytes) throw new Error("string capacity");
      treeRoot = applyMirrorMutation(mirror, treeRoot, mutation, this.#limits);
      applyStagedRefMutation(refs, mutation);
      applyStagedEventMutation(events, mutation);
      applyStagedResourceMutation(resources, mutation);
    }
    if (mirror.size > this.#limits.maxNodes) throw new Error("node capacity");
    validateMirrorTree(mirror, treeRoot);
    for (const binding of refs.values()) {
      if (!mirror.has(binding.nodeKey)) throw new Error("ref bound to missing node");
    }
    const eventPairs = new Set<string>();
    for (const binding of events.values()) {
      if (!mirror.has(binding.nodeKey)) throw new Error("event bound to missing node");
      const pair = nodeEventKey(binding.nodeKey, binding.eventType);
      if (eventPairs.has(pair)) throw new Error("duplicate node event binding");
      eventPairs.add(pair);
    }
    for (const binding of resources.values()) {
      if (!mirror.has(binding.nodeKey)) throw new Error("resource bound to missing node");
    }
    return { mirror, ...(treeRoot === undefined ? {} : { treeRoot }), refs, events, resources };
  }

  #applyReplacement(batch: DomPatchBatch, staged: StagedPatch): void {
    const fragment = document.createDocumentFragment();
    const detached = new Map<string, Node>();
    const detachedRefs = new Map<string, RefBinding>();
    const detachedEvents = new Map<string, EventBinding>();
    const detachedEventPairs = new Map<string, string>();
    for (const mutation of batch.mutations) {
      applyDomMutation(
        mutation,
        detached,
        detachedRefs,
        detachedEvents,
        detachedEventPairs,
        fragment,
        this.#input,
      );
    }
    const root = staged.treeRoot === undefined ? undefined : detached.get(staged.treeRoot);
    if (root === undefined) throw new Error("replacement root missing");
    this.#mount.replaceChildren(root);
    this.#nodeTable.clear();
    for (const [key, value] of detached) this.#nodeTable.set(key, value);
    this.#refTable.clear();
    for (const [key, value] of detachedRefs) this.#refTable.set(key, value);
    this.#eventsByToken.clear();
    this.#eventByNodeType.clear();
    for (const [key, value] of detachedEvents) this.#eventsByToken.set(key, value);
    for (const [key, value] of detachedEventPairs) this.#eventByNodeType.set(key, value);
    this.#pruneInputState();
  }

  #applyMutations(mutations: readonly DomMutation[]): void {
    const previousProperties = new Map(
      [...this.#mirror].map(([key, record]) => [key, record.properties] as const),
    );
    for (const mutation of mutations) {
      const key = "node" in mutation ? handleKey(mutation.node) : "";
      applyDomMutation(
        mutation,
        this.#nodeTable,
        this.#refTable,
        this.#eventsByToken,
        this.#eventByNodeType,
        this.#mount,
        this.#input,
        previousProperties.get(key) ?? [],
      );
      if (mutation.kind === "create") previousProperties.set(key, []);
      if (mutation.kind === "remove") previousProperties.delete(key);
      if (mutation.kind === "setProperties") {
        previousProperties.set(key, mutation.properties);
      }
    }
    this.#pruneInputState();
  }

  #installDelegation(): void {
    const types = [
      "click",
      "input",
      "change",
      "keydown",
      "keyup",
      "focusin",
      "focusout",
      "pointerdown",
      "pointerup",
      "pointermove",
      "pointercancel",
      "wheel",
      "contextmenu",
      "submit",
      "compositionstart",
      "compositionupdate",
      "compositionend",
      "dragenter",
      "dragover",
      "dragleave",
      "drop",
    ];
    for (const type of types) {
      this.#mount.addEventListener(
        type,
        (event) => {
          if (this.#health !== "healthy") return;
          if (event instanceof KeyboardEvent && type === "keydown") {
            applyPortableRovingFocus(event);
          }
          const eventTypes = delegatedEventTypes(type, event);
          if (eventTypes.length === 0) return;
          const match = this.#findEventBinding(event.composedPath(), eventTypes);
          if (match === undefined) return;
          const { encoded, binding } = match;
          const eventType = binding.eventType;
          if (type === "input") {
            this.#input.editSequences.set(encoded, this.#input.nextEditSequence);
            this.#input.nextEditSequence += 1n;
          } else if (type === "compositionstart") {
            this.#input.composing.add(encoded);
          } else if (type === "compositionend") {
            this.#input.composing.delete(encoded);
          }
          if (binding.policy.preventDefault && !binding.policy.passive) event.preventDefault();
          if (binding.policy.stopPropagation) event.stopPropagation();
          const payload = eventPayload(eventType, event, encoded, this.#input);
          this.#returnSink({
            kind: "event",
            event: {
              root: this.#identity.root,
              rendererGeneration: this.#identity.rendererGeneration,
              appliedRevision: this.#appliedRevision,
              node: parseKey(encoded),
              token: binding.token,
              sequence: this.#nextEventSequence,
              type: eventType,
              payload,
            },
          });
          this.#nextEventSequence += 1n;
          if (binding.policy.once) this.#unbindEvent(handleKey(binding.token));
        },
        { signal: this.#abort.signal },
      );
    }
  }

  #findEventBinding(
    path: readonly EventTarget[],
    eventTypes: readonly DomEventType[],
  ): { encoded: string; binding: EventBinding } | undefined {
    for (const entry of path) {
      if (!(entry instanceof Element)) continue;
      const encoded = entry.getAttribute("data-vogui-node");
      if (encoded === null) continue;
      for (const eventType of eventTypes) {
        const tokenKey = this.#eventByNodeType.get(nodeEventKey(encoded, eventType));
        if (tokenKey === undefined) continue;
        const binding = this.#eventsByToken.get(tokenKey);
        if (binding !== undefined) return { encoded, binding };
      }
    }
    return undefined;
  }

  #unbindEvent(tokenKey: string): void {
    const binding = this.#eventsByToken.get(tokenKey);
    if (binding === undefined) return;
    this.#eventsByToken.delete(tokenKey);
    this.#eventByNodeType.delete(nodeEventKey(binding.nodeKey, binding.eventType));
  }

  #validateCommandIdentity(command: DomCommand): void {
    if (!sameHandle(command.identity.session, this.#identity.session)) throw new Error("wrong command session");
    if (!sameHandle(command.identity.root, this.#identity.root)) throw new Error("wrong command root");
    if (command.identity.uiRootEpoch !== this.#identity.uiRootEpoch) throw new Error("stale command root epoch");
    if (command.identity.appCodeEpoch !== this.#identity.appCodeEpoch) throw new Error("stale command app epoch");
    if (!sameHandle(command.identity.rendererGeneration, this.#identity.rendererGeneration)) {
      throw new Error("stale command renderer generation");
    }
    validateHandle(command.target);
    validateGeneration(command.expectedBindingGeneration, "binding generation");
    if (command.requestId <= 0n || command.sequence <= 0n || command.minAppliedRevision < 0n) {
      throw new Error("invalid command");
    }
  }

  #drainCommands(): void {
    const ready = [...this.#pendingCommands.values()]
      .filter((command) => command.minAppliedRevision <= this.#appliedRevision)
      .sort((left, right) => (left.sequence < right.sequence ? -1 : left.sequence > right.sequence ? 1 : 0));
    for (const command of ready) {
      this.#pendingCommands.delete(command.sequence);
      this.#clearPendingCommandDeadline(command.sequence);
      if (command.deadlineMillis <= this.#nowMillis()) {
        this.#emitCommand(command, { kind: "deadlineExpired" });
      } else {
        this.#executeCommand(command);
      }
    }
  }

  #executeCommand(command: DomCommand): void {
    const binding = this.#refTable.get(handleKey(command.target));
    if (
      binding === undefined ||
      binding.bindingGeneration !== command.expectedBindingGeneration ||
      !binding.node.isConnected
    ) {
      this.#emitCommand(command, { kind: "staleBinding" });
      return;
    }
    const element = binding.node instanceof HTMLElement ? binding.node : undefined;
    switch (command.command.kind) {
      case "focus":
        if (element === undefined) return this.#emitCommand(command, { kind: "unsupported" });
        element.focus({ preventScroll: command.command.preventScroll });
        this.#emitCommand(command, { kind: "executed" });
        break;
      case "blur":
        if (element === undefined) return this.#emitCommand(command, { kind: "unsupported" });
        element.blur();
        this.#emitCommand(command, { kind: "executed" });
        break;
      case "scrollIntoView":
        if (element === undefined) return this.#emitCommand(command, { kind: "unsupported" });
        element.scrollIntoView({
          block: command.command.block,
          inline: command.command.inline,
        });
        this.#emitCommand(command, { kind: "executed" });
        break;
      case "measure": {
        if (element === undefined) return this.#emitCommand(command, { kind: "unsupported" });
        const rect = element.getBoundingClientRect();
        this.#emitCommand(command, {
          kind: "measured",
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          layoutRevision: this.#appliedRevision,
        });
        break;
      }
      case "setSelection": {
        if (!(binding.node instanceof HTMLInputElement || binding.node instanceof HTMLTextAreaElement)) {
          return this.#emitCommand(command, { kind: "unsupported" });
        }
        const start = utf8OffsetToUtf16(binding.node.value, command.command.startUtf8);
        const end = utf8OffsetToUtf16(binding.node.value, command.command.endUtf8);
        binding.node.setSelectionRange(start, end);
        this.#emitCommand(command, { kind: "executed" });
        break;
      }
      case "cancelComposition":
        this.#input.composing.delete(binding.nodeKey);
        if (element !== undefined) element.blur();
        if (element !== undefined) element.focus();
        this.#emitCommand(command, { kind: "executed" });
        break;
      case "beginAnimation": {
        if (element === undefined || typeof element.animate !== "function") {
          return this.#emitCommand(command, { kind: "unsupported" });
        }
        const animationKey = command.command.animationKey;
        const replaced = this.#animations.get(animationKey);
        if (replaced !== undefined) {
          this.#animations.delete(animationKey);
          if (replaced.timeoutId !== undefined) clearTimeout(replaced.timeoutId);
          replaced.animation.cancel();
          this.#emitCommand(replaced.command, { kind: "unsupported" });
        }
        const keyframes = animationKeyframes(command.command);
        if (keyframes === null) return this.#emitCommand(command, { kind: "unsupported" });
        const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        if (command.command.property === 9 || command.command.property === 10) {
          const from = Number(command.command.fromMilli) / 1000;
          const to = Number(command.command.toMilli) / 1000;
          if (!Number.isFinite(from) || !Number.isFinite(to)) {
            return this.#emitCommand(command, { kind: "unsupported" });
          }
          if (command.command.property === 9) {
            element.scrollLeft = from;
            element.scrollTo({ left: to, behavior: reducedMotion ? "auto" : "smooth" });
          } else {
            element.scrollTop = from;
            element.scrollTo({ top: to, behavior: reducedMotion ? "auto" : "smooth" });
          }
        }
        const animation = element.animate(keyframes, {
          duration: reducedMotion ? 0 : safeAnimationMillis(command.command.durationMillis),
          delay: reducedMotion ? 0 : safeAnimationMillis(command.command.delayMillis),
          easing: animationEasing(command.command.easing),
          fill: "both",
        });
        const active: ActiveDomAnimation = { animation, command };
        this.#animations.set(animationKey, active);
        this.#armAnimationDeadline(animationKey, active);
        void animation.finished.then(
          () => {
            if (this.#animations.get(animationKey) !== active) return;
            this.#animations.delete(animationKey);
            if (active.timeoutId !== undefined) clearTimeout(active.timeoutId);
            this.#emitCommand(command, { kind: "executed" });
          },
          () => {
            if (this.#animations.get(animationKey) !== active) return;
            this.#animations.delete(animationKey);
            if (active.timeoutId !== undefined) clearTimeout(active.timeoutId);
            this.#emitCommand(command, { kind: "unsupported" });
          },
        );
        break;
      }
      case "cancelAnimation": {
        const active = this.#animations.get(command.command.animationKey);
        if (active !== undefined) {
          this.#animations.delete(command.command.animationKey);
          if (active.timeoutId !== undefined) clearTimeout(active.timeoutId);
          active.animation.cancel();
          this.#emitCommand(active.command, { kind: "unsupported" });
        }
        this.#emitCommand(command, { kind: "executed" });
        break;
      }
      case "unsupported":
        this.#emitCommand(command, { kind: "unsupported" });
        break;
    }
  }

  #cancelOrphanedAnimations(): void {
    for (const [key, active] of this.#animations) {
      const binding = this.#refTable.get(handleKey(active.command.target));
      if (
        binding !== undefined
        && binding.bindingGeneration === active.command.expectedBindingGeneration
        && binding.node.isConnected
      ) {
        continue;
      }
      this.#animations.delete(key);
      if (active.timeoutId !== undefined) clearTimeout(active.timeoutId);
      active.animation.cancel();
      this.#emitCommand(active.command, { kind: "staleBinding" });
    }
  }

  #armAnimationDeadline(key: string, active: ActiveDomAnimation): void {
    const remaining = active.command.deadlineMillis - this.#nowMillis();
    if (remaining <= 0n) {
      this.#animations.delete(key);
      active.animation.cancel();
      this.#emitCommand(active.command, { kind: "deadlineExpired" });
      return;
    }
    const delay = Number(remaining > 2_147_483_647n ? 2_147_483_647n : remaining);
    active.timeoutId = globalThis.setTimeout(() => {
      if (this.#animations.get(key) !== active) return;
      if (this.#nowMillis() < active.command.deadlineMillis) {
        this.#armAnimationDeadline(key, active);
        return;
      }
      this.#animations.delete(key);
      active.animation.cancel();
      this.#emitCommand(active.command, { kind: "deadlineExpired" });
    }, delay);
  }

  #armPendingCommandDeadline(command: DomCommand): void {
    this.#clearPendingCommandDeadline(command.sequence);
    const remaining = command.deadlineMillis - this.#nowMillis();
    if (remaining <= 0n) {
      if (this.#pendingCommands.delete(command.sequence)) {
        this.#emitCommand(command, { kind: "deadlineExpired" });
      }
      return;
    }
    const delay = Number(remaining > 2_147_483_647n ? 2_147_483_647n : remaining);
    const timer = globalThis.setTimeout(() => {
      this.#pendingCommandDeadlines.delete(command.sequence);
      if (this.#pendingCommands.get(command.sequence) !== command) return;
      if (this.#nowMillis() < command.deadlineMillis) {
        this.#armPendingCommandDeadline(command);
        return;
      }
      this.#pendingCommands.delete(command.sequence);
      this.#emitCommand(command, { kind: "deadlineExpired" });
    }, delay);
    this.#pendingCommandDeadlines.set(command.sequence, timer);
  }

  #clearPendingCommandDeadline(sequence: bigint): void {
    const timer = this.#pendingCommandDeadlines.get(sequence);
    if (timer !== undefined) clearTimeout(timer);
    this.#pendingCommandDeadlines.delete(sequence);
  }

  #clearPendingCommandDeadlines(): void {
    for (const timer of this.#pendingCommandDeadlines.values()) clearTimeout(timer);
    this.#pendingCommandDeadlines.clear();
  }

  #emitCommand(command: DomCommand, outcome: DomCommandOutcome): void {
    this.#returnSink({
      kind: "commandResult",
      result: {
        requestId: command.requestId,
        sequence: command.sequence,
        appliedRevision: this.#appliedRevision,
        target: command.target,
        bindingGeneration: command.expectedBindingGeneration,
        outcome,
      },
    });
  }

  #pruneInputState(): void {
    for (const key of this.#input.editSequences.keys()) {
      if (!this.#nodeTable.has(key)) this.#input.editSequences.delete(key);
    }
    for (const key of this.#input.composing) {
      if (!this.#nodeTable.has(key)) this.#input.composing.delete(key);
    }
  }

  #poison(_cause: unknown): void {
    this.#health = "poisoned";
    this.#abort.abort();
    for (const command of this.#pendingCommands.values()) {
      this.#emitCommand(command, { kind: "rendererUnavailable" });
    }
    this.#pendingCommands.clear();
    this.#clearPendingCommandDeadlines();
    this.#host.setAttribute("data-vogui-poisoned", "true");
    this.#host.style.pointerEvents = "none";
    this.#host.hidden = true;
  }

  #assertHealthy(): void {
    if (this.#health !== "healthy") throw new Error(`DOM renderer is ${this.#health}`);
  }
}

function applyMirrorMutation(
  mirror: Map<string, MirrorNode>,
  treeRoot: string | undefined,
  mutation: DomMutation,
  limits: DomRendererLimits,
): string | undefined {
  const key = "node" in mutation ? handleKey(mutation.node) : "";
  switch (mutation.kind) {
    case "create": {
      if (mirror.has(key)) throw new Error("duplicate node");
      const parent = mutation.parent === undefined ? undefined : handleKey(mutation.parent);
      if (parent === undefined) {
        if (treeRoot !== undefined) throw new Error("multiple roots");
        treeRoot = key;
      } else {
        const record = required(mirror, parent);
        if (mutation.index > record.children.length) throw new Error("invalid child index");
        record.children.splice(mutation.index, 0, key);
      }
      mirror.set(key, { ...(parent === undefined ? {} : { parent }), children: [], properties: [] });
      break;
    }
    case "remove": {
      const record = required(mirror, key);
      if (record.children.length !== 0) throw new Error("remove requires deleted subtree order");
      if (record.parent !== undefined) {
        const parent = required(mirror, record.parent);
        parent.children = parent.children.filter((child) => child !== key);
      } else {
        treeRoot = undefined;
      }
      mirror.delete(key);
      break;
    }
    case "move": {
      const record = required(mirror, key);
      if (record.parent !== undefined) {
        const oldParent = required(mirror, record.parent);
        oldParent.children = oldParent.children.filter((child) => child !== key);
      }
      const parent = mutation.parent === undefined ? undefined : handleKey(mutation.parent);
      if (parent === undefined) {
        treeRoot = key;
        delete record.parent;
      } else {
        const nextParent = required(mirror, parent);
        if (mutation.index > nextParent.children.length) throw new Error("invalid child index");
        nextParent.children.splice(mutation.index, 0, key);
        record.parent = parent;
      }
      break;
    }
    case "setKind":
      required(mirror, key).nodeKind = mutation.nodeKind;
      break;
    case "setProperties":
      if (mutation.properties.length > limits.maxPropertiesPerNode) throw new Error("property capacity");
      required(mirror, key).properties = mutation.properties;
      break;
    case "bindRef":
    case "unbindRef":
    case "bindEvent":
    case "unbindEvent":
    case "attachResource":
    case "detachResource":
      break;
  }
  return treeRoot;
}

function applyStagedRefMutation(refs: Map<string, StagedRefBinding>, mutation: DomMutation): void {
  switch (mutation.kind) {
    case "bindRef":
      validateGeneration(mutation.bindingGeneration, "binding generation");
      refs.set(handleKey(mutation.ref), {
        nodeKey: handleKey(mutation.node),
        bindingGeneration: mutation.bindingGeneration,
      });
      break;
    case "unbindRef":
      refs.delete(handleKey(mutation.ref));
      break;
    default:
      break;
  }
}

function applyStagedEventMutation(events: Map<string, EventBinding>, mutation: DomMutation): void {
  switch (mutation.kind) {
    case "bindEvent": {
      validateEventPolicy(mutation.policy);
      const tokenKey = handleKey(mutation.token);
      const next = {
        nodeKey: handleKey(mutation.node),
        eventType: mutation.eventType,
        token: mutation.token,
        policy: mutation.policy,
      };
      for (const [existingToken, binding] of events) {
        if (existingToken !== tokenKey && nodeEventKey(binding.nodeKey, binding.eventType) === nodeEventKey(next.nodeKey, next.eventType)) {
          throw new Error("duplicate node event binding");
        }
      }
      events.set(tokenKey, next);
      break;
    }
    case "unbindEvent":
      events.delete(handleKey(mutation.token));
      break;
    default:
      break;
  }
}

function applyStagedResourceMutation(
  resources: Map<string, StagedResourceBinding>,
  mutation: DomMutation,
): void {
  switch (mutation.kind) {
    case "attachResource": {
      if (mutation.sourceRevision === 0n) throw new Error("invalid resource source revision");
      const nodeKey = handleKey(mutation.node);
      const existing = resources.get(nodeKey);
      if (existing !== undefined && !sameHandle(existing.resource, mutation.resource)) {
        throw new Error("node already has a different resource");
      }
      resources.set(nodeKey, {
        nodeKey,
        resource: mutation.resource,
        sourceRevision: mutation.sourceRevision,
      });
      break;
    }
    case "detachResource": {
      const nodeKey = handleKey(mutation.node);
      const existing = resources.get(nodeKey);
      if (existing === undefined || !sameHandle(existing.resource, mutation.resource)) {
        throw new Error("unknown node resource binding");
      }
      resources.delete(nodeKey);
      break;
    }
    default:
      break;
  }
}

function applyDomMutation(
  mutation: DomMutation,
  nodes: Map<string, Node>,
  refs: Map<string, RefBinding>,
  events: Map<string, EventBinding>,
  eventPairs: Map<string, string>,
  mount: Node,
  input: DomInputState,
  previousProperties: readonly DomProperty[] = [],
): void {
  const key = "node" in mutation ? handleKey(mutation.node) : "";
  switch (mutation.kind) {
    case "create": {
      const placeholder = document.createComment(`vogui:${key}`);
      nodes.set(key, placeholder);
      insertAt(mutation.parent === undefined ? mount : requiredNode(nodes, handleKey(mutation.parent)), placeholder, mutation.index);
      break;
    }
    case "remove": {
      const node = requiredNode(nodes, key);
      node.parentNode?.removeChild(node);
      nodes.delete(key);
      input.editSequences.delete(key);
      input.composing.delete(key);
      break;
    }
    case "move": {
      const node = requiredNode(nodes, key);
      const parent = mutation.parent === undefined ? mount : requiredNode(nodes, handleKey(mutation.parent));
      insertAt(parent, node, mutation.index);
      break;
    }
    case "setKind": {
      const current = requiredNode(nodes, key);
      const replacement =
        mutation.nodeKind.kind === "text"
          ? document.createTextNode(mutation.nodeKind.text)
          : document.createElement(mutation.nodeKind.tag);
      if (replacement instanceof Element) replacement.setAttribute("data-vogui-node", key);
      while (current.firstChild !== null) replacement.appendChild(current.firstChild);
      current.parentNode?.replaceChild(replacement, current);
      nodes.set(key, replacement);
      for (const binding of refs.values()) {
        if (binding.nodeKey === key) binding.node = replacement;
      }
      break;
    }
    case "setProperties":
      applyProperties(
        requiredNode(nodes, key),
        key,
        previousProperties,
        mutation.properties,
        input,
      );
      break;
    case "bindRef":
      refs.set(handleKey(mutation.ref), {
        nodeKey: key,
        bindingGeneration: mutation.bindingGeneration,
        node: requiredNode(nodes, key),
      });
      break;
    case "unbindRef":
      refs.delete(handleKey(mutation.ref));
      break;
    case "bindEvent": {
      requiredNode(nodes, key);
      const tokenKey = handleKey(mutation.token);
      const old = events.get(tokenKey);
      if (old !== undefined) eventPairs.delete(nodeEventKey(old.nodeKey, old.eventType));
      const binding = {
        nodeKey: key,
        eventType: mutation.eventType,
        token: mutation.token,
        policy: mutation.policy,
      };
      events.set(tokenKey, binding);
      eventPairs.set(nodeEventKey(key, mutation.eventType), tokenKey);
      break;
    }
    case "unbindEvent": {
      const tokenKey = handleKey(mutation.token);
      const binding = events.get(tokenKey);
      if (binding !== undefined) eventPairs.delete(nodeEventKey(binding.nodeKey, binding.eventType));
      events.delete(tokenKey);
      break;
    }
    case "attachResource":
    case "detachResource":
      break;
  }
}

function applyProperties(
  node: Node,
  nodeKey: string,
  previousProperties: readonly DomProperty[],
  properties: readonly DomProperty[],
  input: DomInputState,
): void {
  clearRemovedProperties(node, nodeKey, previousProperties, properties, input);
  if (node instanceof HTMLElement) clearPortableStyles(node);
  for (const property of properties) {
    switch (property.field) {
      case "text":
        node.textContent = property.value;
        break;
      case "inputType":
        if (node instanceof HTMLInputElement) node.type = property.value;
        break;
      case "value":
        if (
          (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) &&
          !input.composing.has(nodeKey) &&
          property.acknowledgedEditSequence >= (input.editSequences.get(nodeKey) ?? 0n)
        ) {
          node.value = property.value;
        }
        break;
      case "checked":
        if (node instanceof HTMLInputElement) node.checked = property.value;
        break;
      case "disabled":
        if (
          node instanceof HTMLButtonElement
          || node instanceof HTMLInputElement
          || node instanceof HTMLTextAreaElement
          || node instanceof HTMLSelectElement
        ) {
          node.disabled = property.value;
        }
        break;
      case "readOnly":
        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) node.readOnly = property.value;
        break;
      case "required":
        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
          node.required = property.value;
        }
        break;
      case "multiple":
        if (node instanceof HTMLSelectElement || node instanceof HTMLInputElement) node.multiple = property.value;
        break;
      case "hidden":
        if (node instanceof HTMLElement) node.hidden = property.value;
        break;
      case "inert":
        if (node instanceof HTMLElement) node.inert = property.value;
        break;
      case "open":
        if (node instanceof HTMLDialogElement) {
          if (property.value && !node.open) node.showModal();
          if (!property.value && node.open) node.close();
        }
        break;
      case "href":
        if (node instanceof HTMLAnchorElement) node.href = property.value;
        break;
      case "alt":
        if (node instanceof HTMLImageElement) node.alt = property.value;
        break;
      case "title":
        if (node instanceof HTMLElement) node.title = property.value;
        break;
      case "placeholder":
        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) node.placeholder = property.value;
        break;
      case "name":
        if (node instanceof HTMLElement) node.setAttribute("name", property.value);
        break;
      case "number":
        if (node instanceof HTMLInputElement) node[property.name] = String(property.value);
        break;
      case "progressNumber":
        if (node instanceof HTMLProgressElement) node[property.name] = property.value;
        break;
      case "tabIndex":
        if (node instanceof HTMLElement) node.tabIndex = property.value;
        break;
      case "role":
        if (node instanceof Element) node.setAttribute("role", property.value);
        break;
      case "ariaLabel":
        if (node instanceof Element) node.setAttribute("aria-label", property.value);
        break;
      case "ariaDescription":
        if (node instanceof Element) node.setAttribute("aria-description", property.value);
        break;
      case "ariaState":
        if (node instanceof Element) node.setAttribute(`aria-${property.name}`, property.value);
        break;
      case "className":
        if (node instanceof Element) node.className = property.value;
        break;
      case "styleToken":
        if (node instanceof HTMLElement) {
          node.style.setProperty(`--vogui-${property.name}`, property.value);
          if (portableInlineStyle(property.name)) {
            node.style.setProperty(property.name, property.value);
          }
        }
        break;
      case "nativeStyleToken":
        break;
      case "dataToken":
        if (node instanceof HTMLElement) node.dataset[`vogui${property.name}`] = property.value;
        break;
      case "resourceUrl":
        if (node instanceof HTMLImageElement) node.src = property.value;
        break;
    }
  }
  syncPortableSelection(node, properties);
}

function clearRemovedProperties(
  node: Node,
  nodeKey: string,
  previous: readonly DomProperty[],
  next: readonly DomProperty[],
  input: DomInputState,
): void {
  const retained = new Set(next.map(propertyIdentity));
  for (const property of previous) {
    if (retained.has(propertyIdentity(property))) continue;
    switch (property.field) {
      case "text":
        if (![...node.childNodes].some((child) =>
          child instanceof Element && child.hasAttribute("data-vogui-node")
        )) {
          node.textContent = "";
        }
        break;
      case "inputType":
        if (node instanceof HTMLInputElement) node.removeAttribute("type");
        break;
      case "value":
        if (
          (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
          && !input.composing.has(nodeKey)
        ) {
          node.value = "";
        }
        break;
      case "checked":
        if (node instanceof HTMLInputElement) node.checked = false;
        break;
      case "disabled":
        if (
          node instanceof HTMLButtonElement
          || node instanceof HTMLInputElement
          || node instanceof HTMLTextAreaElement
          || node instanceof HTMLSelectElement
        ) {
          node.disabled = false;
        }
        break;
      case "readOnly":
        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
          node.readOnly = false;
        }
        break;
      case "required":
        if (
          node instanceof HTMLInputElement
          || node instanceof HTMLTextAreaElement
          || node instanceof HTMLSelectElement
        ) {
          node.required = false;
        }
        break;
      case "multiple":
        if (node instanceof HTMLSelectElement || node instanceof HTMLInputElement) {
          node.multiple = false;
        }
        break;
      case "hidden":
        if (node instanceof HTMLElement) node.hidden = false;
        break;
      case "inert":
        if (node instanceof HTMLElement) node.inert = false;
        break;
      case "open":
        if (node instanceof HTMLDialogElement && node.open) node.close();
        break;
      case "href":
        if (node instanceof HTMLAnchorElement) node.removeAttribute("href");
        break;
      case "alt":
        if (node instanceof HTMLImageElement) node.removeAttribute("alt");
        break;
      case "title":
        if (node instanceof HTMLElement) node.removeAttribute("title");
        break;
      case "placeholder":
        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
          node.removeAttribute("placeholder");
        }
        break;
      case "name":
        if (node instanceof HTMLElement) node.removeAttribute("name");
        break;
      case "number":
      case "progressNumber":
        if (node instanceof Element) node.removeAttribute(property.name);
        break;
      case "tabIndex":
        if (node instanceof HTMLElement) node.removeAttribute("tabindex");
        break;
      case "role":
        if (node instanceof Element) node.removeAttribute("role");
        break;
      case "ariaLabel":
        if (node instanceof Element) node.removeAttribute("aria-label");
        break;
      case "ariaDescription":
        if (node instanceof Element) node.removeAttribute("aria-description");
        break;
      case "ariaState":
        if (node instanceof Element) node.removeAttribute(`aria-${property.name}`);
        break;
      case "className":
        if (node instanceof Element) node.removeAttribute("class");
        break;
      case "styleToken":
      case "nativeStyleToken":
        break;
      case "dataToken":
        if (node instanceof HTMLElement) delete node.dataset[`vogui${property.name}`];
        break;
      case "resourceUrl":
        if (node instanceof HTMLImageElement) node.removeAttribute("src");
        break;
    }
  }
}

function propertyIdentity(property: DomProperty): string {
  switch (property.field) {
    case "number":
    case "progressNumber":
    case "ariaState":
    case "styleToken":
    case "nativeStyleToken":
    case "dataToken":
      return `${property.field}:${property.name}`;
    default:
      return property.field;
  }
}

function syncPortableSelection(node: Node, properties: readonly DomProperty[]): void {
  if (!(node instanceof HTMLSelectElement)) return;
  const options = new Map<string, { label?: string; description?: string; disabled?: boolean }>();
  const order = new Map<string, number>();
  const selected = new Set<string>();
  for (const property of properties) {
    if (property.field !== "dataToken") continue;
    const option = /^option\.([1-9][0-9]*)\.(label|description|disabled)$/.exec(property.source);
    if (option !== null) {
      const record = options.get(option[1]!) ?? {};
      if (option[2] === "label") record.label = property.value;
      if (option[2] === "description") record.description = property.value;
      if (option[2] === "disabled") record.disabled = property.value === "true";
      options.set(option[1]!, record);
      continue;
    }
    const orderIndex = /^optionOrder\.([0-9]+)$/.exec(property.source);
    if (orderIndex !== null) {
      order.set(property.value, Number(orderIndex[1]));
      continue;
    }
    if (/^selected\.[0-9]+$/.test(property.source)) selected.add(property.value);
  }
  const children: HTMLOptionElement[] = [];
  const orderedOptions = [...options].sort(
    ([left], [right]) => (order.get(left) ?? Number.MAX_SAFE_INTEGER)
      - (order.get(right) ?? Number.MAX_SAFE_INTEGER),
  );
  for (const [id, record] of orderedOptions) {
    if (record.label === undefined) throw new Error(`portable option ${id} has no label`);
    const option = document.createElement("option");
    option.value = id;
    option.textContent = record.label;
    option.disabled = record.disabled ?? false;
    option.selected = selected.has(id);
    if (record.description !== undefined && record.description.length !== 0) {
      option.title = record.description;
    }
    children.push(option);
  }
  node.replaceChildren(...children);
}

function clearPortableStyles(node: HTMLElement): void {
  const tokens: string[] = [];
  for (let index = 0; index < node.style.length; index += 1) {
    const name = node.style.item(index);
    if (name.startsWith("--vogui-")) tokens.push(name.slice("--vogui-".length));
  }
  for (const token of tokens) {
    node.style.removeProperty(`--vogui-${token}`);
    if (portableInlineStyle(token)) node.style.removeProperty(token);
  }
}

function portableInlineStyle(token: string): boolean {
  if (
    token.startsWith("hover-")
    || token.startsWith("focus-")
    || token.startsWith("pressed-")
    || token.startsWith("disabled-")
  ) {
    return false;
  }
  return [
    "display",
    "position",
    "flex-direction",
    "flex-wrap",
    "grid-template-columns",
    "grid-auto-flow",
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "top",
    "right",
    "bottom",
    "left",
    "gap",
    "align-items",
    "justify-content",
    "align-self",
    "overflow-x",
    "overflow-y",
    "aspect-ratio",
    "color",
    "background-color",
    "border-color",
    "border-width",
    "border-radius",
    "opacity",
    "cursor",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "direction",
    "visibility",
  ].includes(token);
}

function installPortableStateStyles(mount: ShadowRoot | HTMLElement): void {
  if (mount instanceof ShadowRoot) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(portableStateStyleSheet);
    mount.adoptedStyleSheets = [...mount.adoptedStyleSheets, sheet];
    return;
  }
  if (document.head.querySelector("style[data-vogui-portable-state]") !== null) return;
  const style = document.createElement("style");
  style.dataset.voguiPortableState = "";
  style.textContent = portableStateStyleSheet;
  document.head.appendChild(style);
}

function delegatedEventTypes(type: string, event: Event): readonly DomEventType[] {
  switch (type) {
    case "click":
      return ["press", "toggle", "select", "open", "close", "dismiss"];
    case "input":
      return ["textEdit", "input"];
    case "compositionstart":
      return ["compositionStart", "textEdit"];
    case "compositionupdate":
      return ["compositionUpdate", "textEdit"];
    case "compositionend":
      return ["compositionCommit", "compositionCancel", "textEdit"];
    case "change":
      return ["change", "select", "toggle"];
    case "keydown":
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        return ["keyDown", "dismiss", "close"];
      }
      return ["keyDown"];
    case "keyup":
      return ["keyUp"];
    case "focusin":
      return ["focusIn"];
    case "focusout":
      return ["focusOut"];
    case "pointerdown":
      return ["pointerDown"];
    case "pointerup":
      return ["pointerUp"];
    case "pointermove":
      return ["pointerMove"];
    case "pointercancel":
      return ["pointerCancel"];
    case "wheel":
      return ["wheel"];
    case "contextmenu":
      return ["contextMenu"];
    case "submit":
      return ["submit"];
    case "dragenter":
      return ["dragEnter"];
    case "dragover":
      return ["dragOver"];
    case "dragleave":
      return ["dragLeave"];
    case "drop":
      return ["drop"];
    default:
      return [];
  }
}

function applyPortableRovingFocus(event: KeyboardEvent): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const role = target.getAttribute("role");
  const containerRole = role === "tab"
    ? "tablist"
    : role === "menuitem"
      ? "menu"
      : role === "radio"
        ? "radiogroup"
        : role === "option"
          ? "listbox"
          : role === "treeitem"
            ? "tree"
            : undefined;
  if (containerRole === undefined) return;
  const container = target.closest<HTMLElement>(`[role="${containerRole}"]`);
  if (container === null) return;
  const items = [...container.querySelectorAll<HTMLElement>(`[role="${role}"]`)].filter(
    (item) => item.getAttribute("aria-disabled") !== "true" && !item.hidden,
  );
  const current = items.indexOf(target);
  if (current < 0 || items.length < 2) return;
  const vertical = container.dataset.voguiOrientation === "1";
  const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
  const nextKey = vertical ? "ArrowDown" : "ArrowRight";
  let next = current;
  if (event.key === previousKey) next = (current - 1 + items.length) % items.length;
  else if (event.key === nextKey) next = (current + 1) % items.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = items.length - 1;
  else return;
  event.preventDefault();
  for (const [index, item] of items.entries()) item.tabIndex = index === next ? 0 : -1;
  items[next]!.focus();
  if (role === "tab" && container.dataset.voguiActivation !== "1") items[next]!.click();
}

function eventPayload(
  type: DomEventType,
  event: Event,
  nodeKey: string,
  input: DomInputState,
): DomEventPayload {
  switch (type) {
    case "press":
    case "dismiss":
    case "select":
    case "toggle":
    case "open":
    case "close":
      return { kind: "press" };
    case "textEdit":
    case "input":
    case "compositionStart":
    case "compositionUpdate":
    case "compositionCommit":
    case "compositionCancel": {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        throw new Error("text edit target is not a text control");
      }
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      return {
        kind: "textEdit",
        editSequence: input.editSequences.get(nodeKey) ?? 0n,
        text: target.value,
        selectionStartUtf8: utf16OffsetToUtf8(target.value, start),
        selectionEndUtf8: utf16OffsetToUtf8(target.value, end),
        composing: input.composing.has(nodeKey),
      };
    }
    case "keyDown":
    case "keyUp": {
      if (!(event instanceof KeyboardEvent)) throw new Error("key event type mismatch");
      return {
        kind: "key",
        physical: event.code,
        logical: event.key,
        repeat: event.repeat,
        alt: event.altKey,
        control: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
      };
    }
    case "focusIn":
    case "focusOut": {
      if (!(event instanceof FocusEvent)) throw new Error("focus event type mismatch");
      const related = event.relatedTarget instanceof Element ? event.relatedTarget.closest("[data-vogui-node]") : null;
      const encoded = related?.getAttribute("data-vogui-node");
      return {
        kind: "focus",
        focused: type === "focusIn",
        ...(encoded === null || encoded === undefined ? {} : { relatedNode: parseKey(encoded) }),
      };
    }
    case "pointerDown":
    case "pointerUp":
    case "pointerMove":
    case "pointerCancel":
      if (!(event instanceof PointerEvent)) throw new Error("pointer event type mismatch");
      return {
        kind: "pointer",
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        xMilli: Math.round(event.clientX * 1000),
        yMilli: Math.round(event.clientY * 1000),
        button: event.button,
        buttons: event.buttons,
      };
    case "wheel":
      if (!(event instanceof WheelEvent)) throw new Error("wheel event type mismatch");
      return {
        kind: "pointer",
        pointerId: 0,
        pointerType: "wheel",
        xMilli: Math.round(event.deltaX * 1000),
        yMilli: Math.round(event.deltaY * 1000),
        button: 0,
        buttons: 0,
      };
    case "contextMenu":
    case "submit":
    case "change":
      return { kind: "press" };
    case "dragEnter":
    case "dragOver":
    case "dragLeave":
    case "drop": {
      if (!(event instanceof DragEvent)) throw new Error("drag event type mismatch");
      return {
        kind: "drag",
        mimeTypes: event.dataTransfer === null ? [] : [...event.dataTransfer.types],
        xMilli: Math.round(event.clientX * 1000),
        yMilli: Math.round(event.clientY * 1000),
      };
    }
  }
}

function validateMirrorTree(mirror: Map<string, MirrorNode>, root: string | undefined): void {
  if (root === undefined || !mirror.has(root)) throw new Error("missing root");
  const seen = new Set<string>();
  const pending = [root];
  while (pending.length !== 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) throw new Error("invalid tree");
    seen.add(current);
    const record = required(mirror, current);
    if (record.nodeKind === undefined) throw new Error("missing node kind");
    for (const child of record.children) {
      if (required(mirror, child).parent !== current) throw new Error("parent mismatch");
      pending.push(child);
    }
  }
  if (seen.size !== mirror.size) throw new Error("unreachable node");
}

function cloneMirror(source: Map<string, MirrorNode>): Map<string, MirrorNode> {
  return new Map(
    [...source].map(([key, value]) => [
      key,
      {
        ...(value.parent === undefined ? {} : { parent: value.parent }),
        children: [...value.children],
        ...(value.nodeKind === undefined ? {} : { nodeKind: value.nodeKind }),
        properties: [...value.properties],
      },
    ]),
  );
}

function cloneEventBinding(binding: EventBinding): EventBinding {
  return {
    nodeKey: binding.nodeKey,
    eventType: binding.eventType,
    token: { index: binding.token.index, generation: binding.token.generation },
    policy: { ...binding.policy },
  };
}

function mutationStringBytes(mutation: DomMutation): number {
  switch (mutation.kind) {
    case "setKind":
      return mutation.nodeKind.kind === "text"
        ? encoder.encode(mutation.nodeKind.text).byteLength
        : mutation.nodeKind.tag.length;
    case "setProperties":
      return encoder.encode(JSON.stringify(mutation.properties)).byteLength;
    case "bindEvent":
      return mutation.eventType.length;
    default:
      return 0;
  }
}

function resourceMimeType(kind: number): string {
  switch (kind) {
    case 2: return "font/woff2";
    case 3: return "image/svg+xml";
    default: return "application/octet-stream";
  }
}

function joinResourceChunks(chunks: readonly ArrayBuffer[], totalBytes: number): Uint8Array {
  const joined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  if (offset !== totalBytes) throw new Error("resource chunk assembly length mismatch");
  return joined;
}

function installFontResidency(
  key: string,
  sourceRevision: bigint,
  url: string,
  metadata: Uint8Array,
): FontFace {
  const declared = metadata.byteLength === 0
    ? ""
    : new TextDecoder("utf-8", { fatal: true }).decode(metadata).trim();
  const family = declared.length === 0
    ? `vogui-${key.replace(":", "-")}-${sourceRevision.toString()}`
    : declared;
  const face = new FontFace(family, `url("${url}")`);
  document.fonts.add(face);
  void face.load().catch(() => {
    document.fonts.delete(face);
  });
  return face;
}

function insertAt(parent: Node, child: Node, index: number): void {
  const before = parent.childNodes.item(index);
  parent.insertBefore(child, before);
}

function required(map: Map<string, MirrorNode>, key: string): MirrorNode {
  const value = map.get(key);
  if (value === undefined) throw new Error(`unknown node ${key}`);
  return value;
}

function requiredNode(map: Map<string, Node>, key: string): Node {
  const value = map.get(key);
  if (value === undefined) throw new Error(`unknown platform node ${key}`);
  return value;
}

function handleKey(handle: Handle): string {
  validateHandle(handle);
  return `${handle.index}:${handle.generation}`;
}

function nodeEventKey(nodeKey: string, eventType: DomEventType): string {
  return `${nodeKey}/${eventType}`;
}

function parseKey(key: string): Handle {
  const [index, generation, extra] = key.split(":");
  if (index === undefined || generation === undefined || extra !== undefined) throw new Error("invalid node key");
  const handle = { index: Number(index), generation: Number(generation) };
  validateHandle(handle);
  return handle;
}

function validateIdentity(identity: DomRendererIdentity): void {
  validateHandle(identity.session);
  validateHandle(identity.root);
  validateHandle(identity.rendererGeneration);
  if (identity.uiRootEpoch <= 0 || identity.appCodeEpoch <= 0n) throw new Error("invalid renderer identity");
}

function validateHandle(handle: Handle): void {
  if (!Number.isSafeInteger(handle.index) || handle.index < 0 || handle.index > 0xffff_ffff) {
    throw new Error("invalid handle index");
  }
  if (!Number.isSafeInteger(handle.generation) || handle.generation <= 0 || handle.generation > 0xffff_ffff) {
    throw new Error("invalid handle generation");
  }
}

function validateGeneration(generation: number, label: string): void {
  if (!Number.isSafeInteger(generation) || generation <= 0 || generation > 0xffff_ffff) {
    throw new Error(`invalid ${label}`);
  }
}

function validateEventPolicy(policy: DomEventPolicy): void {
  if (policy.passive && policy.preventDefault) throw new Error("passive event cannot prevent default");
}

function validateLimits(limits: DomRendererLimits): void {
  if (
    limits.maxNodes <= 0 ||
    limits.maxMutations <= 0 ||
    limits.maxPropertiesPerNode <= 0 ||
    limits.maxStringBytes <= 0 ||
    (limits.maxPendingCommands !== undefined && limits.maxPendingCommands <= 0) ||
    (limits.maxFutureRevisionWindow !== undefined && limits.maxFutureRevisionWindow < 0n)
  ) {
    throw new Error("invalid DOM renderer limits");
  }
}

function sameHandle(left: Handle, right: Handle): boolean {
  return left.index === right.index && left.generation === right.generation;
}

export function utf16OffsetToUtf8(value: string, utf16Offset: number): number {
  if (!Number.isSafeInteger(utf16Offset) || utf16Offset < 0 || utf16Offset > value.length) {
    throw new Error("invalid UTF-16 offset");
  }
  if (
    utf16Offset > 0 &&
    utf16Offset < value.length &&
    isHighSurrogate(value.charCodeAt(utf16Offset - 1)) &&
    isLowSurrogate(value.charCodeAt(utf16Offset))
  ) {
    throw new Error("UTF-16 offset splits a surrogate pair");
  }
  return encoder.encode(value.slice(0, utf16Offset)).byteLength;
}

export function utf8OffsetToUtf16(value: string, utf8Offset: number): number {
  if (!Number.isSafeInteger(utf8Offset) || utf8Offset < 0) throw new Error("invalid UTF-8 offset");
  let consumed = 0;
  let utf16 = 0;
  for (const scalar of value) {
    if (consumed === utf8Offset) return utf16;
    consumed += encoder.encode(scalar).byteLength;
    utf16 += scalar.length;
    if (consumed > utf8Offset) throw new Error("UTF-8 offset splits a code point");
  }
  if (consumed === utf8Offset) return utf16;
  throw new Error("UTF-8 offset exceeds text");
}

function isHighSurrogate(value: number): boolean {
  return value >= 0xd800 && value <= 0xdbff;
}

function isLowSurrogate(value: number): boolean {
  return value >= 0xdc00 && value <= 0xdfff;
}

type BeginAnimationCommand = Extract<DomCommandKind, { readonly kind: "beginAnimation" }>;

function animationKeyframes(command: BeginAnimationCommand): Keyframe[] | null {
  const result: Keyframe[] = [];
  for (const frame of command.values) {
    const value = Number(frame.valueMilli) / 1000;
    if (!Number.isFinite(value)) return null;
    const keyframe = animationPropertyKeyframe(command.property, frame.valueMilli, value);
    if (keyframe === null) return null;
    result.push({ offset: frame.offset, ...keyframe });
  }
  return result;
}

function animationPropertyKeyframe(
  property: number,
  rawValue: bigint,
  value: number,
): Keyframe | null {
  switch (property) {
    case 1:
      return { opacity: value };
    case 2:
      return { transform: `translateX(${value}px)` };
    case 3:
      return { transform: `translateY(${value}px)` };
    case 4:
      return { transform: `scaleX(${value})` };
    case 5:
      return { transform: `scaleY(${value})` };
    case 6:
      return { transform: `rotate(${value}deg)` };
    case 7:
      return { width: `${value}px` };
    case 8:
      return { height: `${value}px` };
    case 9:
    case 10:
      return { opacity: 1 };
    case 11:
      return { color: animationColor(rawValue) };
    default:
      return null;
  }
}

function animationColor(value: bigint): string {
  const rgba = Number(BigInt.asUintN(32, value));
  return `#${rgba.toString(16).padStart(8, "0")}`;
}

function animationEasing(easing: number): string {
  switch (easing) {
    case 1:
      return "linear";
    case 2:
      return "ease-in";
    case 3:
      return "ease-out";
    case 4:
      return "ease-in-out";
    default:
      return "linear";
  }
}

function safeAnimationMillis(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("animation time exceeds browser range");
  return Number(value);
}

function domMilli(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-0x8000_0000, Math.min(0x7fff_ffff, Math.round(value * 1000)));
}

function domExtentMilli(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.max(1, Math.min(0x7fff_ffff, Math.round(value * 1000)));
}
