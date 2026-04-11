// VoGUI v4 Preact Renderer — core rendering engine.
// Converts VoNode tree → Preact VNode tree → DOM via Preact reconciler.

import { h, render as preactRender, createContext, type ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useRef, useEffect, useLayoutEffect, useContext } from 'preact/hooks';

import type { VoNode, RenderMessage, RendererConfig, CanvasBatch, RefAction, WidgetFactory, WidgetInstance } from './types';
import { setRenderContext, propsToHandlers, emit } from './events';
import { typeToTag, typeToBaseClass, variantClass, propsToStyle } from './mapping';
import { executeRefAction, refCallback, refRegistry } from './refs';
import { applyTheme, injectDynamicStyles } from './styles';
import { executeCanvasBatch } from './canvas';
import { componentMap } from './components/index';

// =============================================================================
// Component memo cache for __comp__ / __cached__ optimization
// =============================================================================

const compCache = new Map<number, any>();

// =============================================================================
// External Widget Registry
// =============================================================================

const widgetRegistry = new Map<string, WidgetFactory>();
const widgetInstances = new Set<WidgetInstance>();
type CanvasResizeBinding = {
    element: HTMLCanvasElement;
    observer: ResizeObserver;
    resizeId: number;
    lastWidth: number;
    lastHeight: number;
};
const canvasResizeBindings = new Map<string, CanvasResizeBinding>();
type ElementResizeBinding = {
    element: HTMLElement;
    observer: ResizeObserver;
    resizeId: number;
    lastWidth: number;
    lastHeight: number;
};
const elementResizeBindings = new Map<string, ElementResizeBinding>();
type ElementIntersectBinding = {
    element: HTMLElement;
    observer: IntersectionObserver;
    intersectId: number;
};
const elementIntersectBindings = new Map<string, ElementIntersectBinding>();

function logStudioWidget(message: string): void {
    const logger = (globalThis as Record<string, unknown>).__voguiStudioLog as ((message: string) => void) | undefined;
    logger?.(message);
}

/** Register an external widget factory. */
export function registerWidget(type: string, factory: WidgetFactory): void {
    widgetRegistry.set(type, factory);
    logStudioWidget(`[vogui] widgetRegistry.set type=${type}`);
}

/** Unregister and destroy all widget instances. */
export function destroyWidgets(): void {
    for (const instance of widgetInstances) {
        instance.destroy?.();
    }
    widgetInstances.clear();
}

// =============================================================================
// Public API
// =============================================================================

const PortalContainerContext = createContext<HTMLElement | null>(null);

function ensureOverlayRoot(host: HTMLElement): HTMLElement {
    for (const child of Array.from(host.children)) {
        if (child instanceof HTMLElement && child.dataset.voguiOverlayRoot === 'true') {
            return child;
        }
    }

    const currentPosition = window.getComputedStyle(host).position;
    if (!currentPosition || currentPosition === 'static') {
        host.style.position = 'relative';
    }

    const root = document.createElement('div');
    root.dataset.voguiOverlayRoot = 'true';
    root.style.position = 'absolute';
    root.style.inset = '0';
    root.style.zIndex = '200';
    root.style.pointerEvents = 'none';
    root.style.overflow = 'visible';
    host.appendChild(root);
    return root;
}

function ensureNamedPortalContainer(root: HTMLElement, name: string): HTMLElement {
    for (const child of Array.from(root.children)) {
        if (child instanceof HTMLElement && child.dataset.voguiPortalName === name) {
            return child;
        }
    }

    const mount = document.createElement('div');
    mount.dataset.voguiPortalName = name;
    mount.style.position = 'absolute';
    mount.style.inset = '0';
    mount.style.pointerEvents = 'none';
    mount.style.overflow = 'visible';
    if (name === 'toast') {
        mount.style.display = 'flex';
        mount.style.alignItems = 'flex-start';
        mount.style.justifyContent = 'flex-end';
        mount.style.padding = '12px';
    }
    root.appendChild(mount);
    return mount;
}

export function usePortalContainer(): HTMLElement | null {
    return useContext(PortalContainerContext);
}

/** Render a decoded VoNode tree into a container element. */
export function render(container: HTMLElement, msg: RenderMessage, config: RendererConfig): void {
    if (!msg?.tree) {
        preactRender(null, container);
        return;
    }

    setRenderContext(msg.gen, msg.handlers, config);
    applyTheme(container, msg.theme);

    if (msg.styles) {
        injectDynamicStyles(msg.styles);
    }

    const portalHost = container.parentElement instanceof HTMLElement
        ? container.parentElement
        : container;
    const portalContainer = ensureOverlayRoot(portalHost);

    preactRender(
        h(PortalContainerContext.Provider, { value: portalContainer },
            h(VoTreeRoot, { tree: msg.tree, canvas: msg.canvas, refActions: msg.refActions }),
        ),
        container,
    );
}

// =============================================================================
// Root component
// =============================================================================

function VoTreeRoot({ tree, canvas, refActions }: { tree: VoNode; canvas?: CanvasBatch[]; refActions?: RefAction[] }): any {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (canvas && containerRef.current) {
            for (const batch of canvas) {
                executeCanvasBatch(batch, refRegistry);
            }
        }
    }, [canvas]);

    useLayoutEffect(() => {
        if (refActions && containerRef.current) {
            for (const action of refActions) {
                executeRefAction(action);
            }
        }
    }, [refActions]);

    return h('div', { ref: containerRef, style: { display: 'contents' } }, voNodeToVNode(tree));
}

// =============================================================================
// VoNode → Preact VNode conversion
// =============================================================================

export function voNodeToVNode(node: VoNode | null | undefined): any {
    if (!node || !node.type) return null;

    const { type, props = {}, children = [] } = node;

    // Text node
    if (type === '#text') {
        return props.text != null ? String(props.text) : null;
    }

    // Fragment
    if (type === 'Fragment') {
        return h('div', { style: { display: 'contents' } }, childrenToVNodes(children));
    }

    // Component subtree markers
    if (type === '__comp__') {
        const cid = props._cid as number;
        const childVNode = children[0] ? voNodeToVNode(children[0]) : null;
        compCache.set(cid, childVNode);
        return renderComponentWrapper(cid, props, childVNode);
    }
    if (type === '__cached__') {
        const cid = props._cid as number;
        const cachedChild = compCache.get(cid) ?? null;
        return renderComponentWrapper(cid, props, cachedChild);
    }

    // UnsafeHTML
    if (type === 'vo-unsafe-html') {
        const html = props.html as string || '';
        return h('div', {
            dangerouslySetInnerHTML: { __html: html },
            ...buildCommonProps(props),
        });
    }

    // Portal
    if (type === 'vo-portal') {
        return h(VoPortalNode, {
            portalName: props.portalName as string | undefined,
            portalChildren: children,
        });
    }

    // Canvas
    if (type === 'Canvas') {
        return renderCanvas(props);
    }

    // External widget (HostWidget / ExternalWidget)
    if (type === 'vo-external-widget') {
        return renderExternalWidget(props, children);
    }

    // Check component registry for managed components
    const Component = componentMap[type];
    if (Component) {
        const managedProps: Record<string, any> = {
            ...props,
            voChildren: children,
        };
        if (typeof props.onClick === 'number') {
            const eventHandlers = propsToHandlers(props);
            if (typeof eventHandlers.onClick === 'function') {
                managedProps.onClick = eventHandlers.onClick;
            }
        }
        return h(Component, {
            ...managedProps,
        });
    }

    // Generic element rendering
    return renderGenericElement(type, props, children);
}

function childrenToVNodes(children: VoNode[]): ComponentChildren[] {
    return children.map(voNodeToVNode);
}

function VoPortalNode({ portalName, portalChildren }: { portalName?: string; portalChildren: VoNode[] }): any {
    const portalRoot = usePortalContainer();
    if (!portalRoot) {
        return h('div', { style: { display: 'contents' } }, childrenToVNodes(portalChildren));
    }
    const mount = ensureNamedPortalContainer(portalRoot, portalName || 'default');
    return createPortal(
        h('div', { style: { display: 'contents' } }, childrenToVNodes(portalChildren)),
        mount,
    );
}

function renderComponentWrapper(cid: number, props: Record<string, any>, childVNode: any): any {
    const commonProps = buildCommonProps(props);
    const style = propsToStyle(props) ?? {};
    const eventHandlers = propsToHandlers(props);
    const className = props.class || undefined;
    const hasStyle = Object.keys(style).length > 0;
    const hasHandlers = Object.keys(eventHandlers).length > 0;
    const hasClassName = Boolean(className);
    const wrapperProps: Record<string, any> = {
        ...commonProps,
        'data-vcid': cid,
    };

    if (!hasStyle && !hasHandlers && !hasClassName) {
        return h('div', { ...wrapperProps, style: { display: 'contents' } }, childVNode);
    }

    return h('div', {
        ...wrapperProps,
        ...eventHandlers,
        className,
        style: hasStyle ? style : undefined,
    }, childVNode);
}

// =============================================================================
// Generic element rendering
// =============================================================================

function renderGenericElement(type: string, props: Record<string, any>, children: VoNode[]): any {
    const tag = typeToTag(type);
    const baseClass = typeToBaseClass(type);
    const vClass = variantClass(type, props.variant, props.size);
    const userClass = props.class || '';
    const refName = props.ref as string | undefined;
    const resizeId = props.onResize as number | undefined;
    const resizeKey = resizeId != null
        ? (refName ? `ref:${refName}` : `resize:${resizeId}`)
        : null;
    const intersectId = props.onIntersect as number | undefined;
    const intersectKey = intersectId != null
        ? (refName ? `iref:${refName}` : `intersect:${intersectId}`)
        : null;

    // Active state classes
    const activeClass = props.active ? getActiveClass(type) : '';
    // Disabled state classes (non-input elements)
    const disabledClass = props.disabled && tag !== 'input' && tag !== 'textarea' && tag !== 'select'
        ? 'opacity-50 pointer-events-none' : '';

    const className = [baseClass, vClass, activeClass, disabledClass, userClass].filter(Boolean).join(' ') || undefined;
    const style = propsToStyle(props);
    const eventHandlers = propsToHandlers(props);
    const commonProps = buildCommonProps(props);

    // Grid cols
    const gridStyle = type === 'vo-grid' && props.cols
        ? { ...style, gridTemplateColumns: `repeat(${props.cols}, 1fr)` }
        : style;

    const elementProps: Record<string, any> = {
        ...commonProps,
        ...eventHandlers,
        className,
        style: gridStyle,
    };

    // Disabled ARIA on non-form elements
    if (props.disabled && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        elementProps['aria-disabled'] = 'true';
    }

    // Text content — render inline when no children
    if (props.textContent != null && children.length === 0) {
        // Prepend icon if present
        const iconEl = renderIconProp(props, type);
        if (iconEl) {
            return h(tag, elementProps, iconEl, String(props.textContent));
        }
        return h(tag, elementProps, String(props.textContent));
    }

    // HTML-specific attributes
    if (tag === 'input') {
        applyInputProps(elementProps, props);
    }
    if (tag === 'textarea') {
        applyTextareaProps(elementProps, props);
    }
    if (tag === 'a') {
        if (props.href) elementProps.href = props.href;
    }
    if (tag === 'img') {
        if (props.src) elementProps.src = props.src;
        if (props.alt) elementProps.alt = props.alt;
    }
    if (tag === 'video') {
        if (props.src) elementProps.src = props.src;
    }

    // Form submit
    if (tag === 'form' && props.onSubmit != null) {
        elementProps.onSubmit = (e: Event) => {
            e.preventDefault();
            emit(props.onSubmit, '{}');
        };
    }

    if (resizeId != null || intersectId != null) {
        const baseRef = refName ? refCallback(refName) : undefined;
        elementProps.ref = (el: HTMLElement | null) => {
            if (baseRef) {
                baseRef(el);
            }

            // ResizeObserver binding
            if (resizeKey) {
                if (!el) {
                    const binding = elementResizeBindings.get(resizeKey);
                    if (binding) {
                        binding.observer.disconnect();
                        elementResizeBindings.delete(resizeKey);
                    }
                } else {
                    const existing = elementResizeBindings.get(resizeKey);
                    if (!existing || existing.element !== el || existing.resizeId !== resizeId) {
                        if (existing) {
                            existing.observer.disconnect();
                            elementResizeBindings.delete(resizeKey);
                        }
                        let binding!: ElementResizeBinding;
                        const observer = new ResizeObserver((entries) => {
                            for (const entry of entries) {
                                const width = Math.round(entry.contentRect.width);
                                const height = Math.round(entry.contentRect.height);
                                if (width === binding.lastWidth && height === binding.lastHeight) continue;
                                binding.lastWidth = width;
                                binding.lastHeight = height;
                                emit(binding.resizeId, JSON.stringify({ Width: width, Height: height }));
                            }
                        });
                        binding = { element: el, observer, resizeId: resizeId!, lastWidth: -1, lastHeight: -1 };
                        observer.observe(el);
                        elementResizeBindings.set(resizeKey, binding);
                    }
                }
            }

            // IntersectionObserver binding
            if (intersectKey) {
                if (!el) {
                    const binding = elementIntersectBindings.get(intersectKey);
                    if (binding) {
                        binding.observer.disconnect();
                        elementIntersectBindings.delete(intersectKey);
                    }
                } else {
                    const existing = elementIntersectBindings.get(intersectKey);
                    if (!existing || existing.element !== el || existing.intersectId !== intersectId) {
                        if (existing) {
                            existing.observer.disconnect();
                            elementIntersectBindings.delete(intersectKey);
                        }
                        const id = intersectId!;
                        const observer = new IntersectionObserver((entries) => {
                            for (const entry of entries) {
                                emit(id, JSON.stringify({
                                    IsIntersecting: entry.isIntersecting,
                                    IntersectionRatio: entry.intersectionRatio,
                                }));
                            }
                        });
                        observer.observe(el);
                        elementIntersectBindings.set(intersectKey, { element: el, observer, intersectId: id });
                    }
                }
            }
        };
    }

    // Label for form fields
    const labelContent = type === 'vo-form-field' && props.label
        ? [h('label', { className: 'text-sm font-medium text-foreground' }, props.label), ...childrenToVNodes(children)]
        : childrenToVNodes(children);

    // Section title
    const sectionContent = type === 'vo-form-section' && props.title
        ? [h('h3', { className: 'text-lg font-semibold' }, props.title), ...childrenToVNodes(children)]
        : null;

    let content = sectionContent || labelContent;

    // Prepend icon if present and has children
    const iconEl = renderIconProp(props, type);
    if (iconEl && Array.isArray(content)) {
        content = [iconEl, ...content];
    }

    // Progress bar special rendering
    if (type === 'vo-progress') {
        return renderProgress(elementProps, props);
    }

    // Avatar special rendering
    if (type === 'vo-avatar' && props.src) {
        return h(tag, elementProps,
            h('img', { src: props.src, className: 'aspect-square h-full w-full object-cover' }),
        );
    }

    return h(tag, elementProps, ...content);
}

/** Get the active-state class for a given node type. */
function getActiveClass(type: string): string {
    switch (type) {
        case 'vo-nav-item': case 'vo-sidebar-item':
            return 'bg-accent text-accent-foreground font-medium';
        default:
            return 'active';
    }
}

/** Render an icon element from the `icon` or `name` prop. */
function renderIconProp(props: Record<string, any>, type: string): any {
    if (type === 'vo-icon' && props.name) {
        return h('span', { className: 'vo-icon', 'data-icon': props.name });
    }
    if (props.icon && type !== 'vo-icon') {
        return h('span', { className: 'vo-icon mr-1.5 inline-flex items-center', 'data-icon': props.icon });
    }
    return null;
}

// =============================================================================
// Specialized renderers
// =============================================================================

function renderCanvas(props: Record<string, any>): any {
    const refName = props.ref as string;
    const w = props.width || 300;
    const hVal = props.height || 150;
    const common = buildCommonProps(props);
    const fullscreen = props.fullscreen;
    const pointerId = props.onPointer as number | undefined;
    const resizeId = props.onResize as number | undefined;
    const resizeKey = resizeId != null
        ? (refName ? `ref:${refName}` : `resize:${resizeId}`)
        : null;

    const canvasStyle: Record<string, string> = {};
    if (fullscreen) {
        canvasStyle.width = '100%';
        canvasStyle.height = '100%';
    }

    const pointerHandlers: Record<string, any> = {};
    if (pointerId != null) {
        const emitPointer = (kind: string, e: PointerEvent) => {
            const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
            emit(pointerId, JSON.stringify({
                Kind: kind,
                X: e.clientX - rect.left,
                Y: e.clientY - rect.top,
                Button: e.button,
                Buttons: e.buttons,
            }));
        };
        pointerHandlers.onPointerDown = (e: PointerEvent) => emitPointer('down', e);
        pointerHandlers.onPointerUp = (e: PointerEvent) => emitPointer('up', e);
        pointerHandlers.onPointerMove = (e: PointerEvent) => emitPointer('move', e);
        pointerHandlers.onPointerEnter = (e: PointerEvent) => emitPointer('enter', e);
        pointerHandlers.onPointerLeave = (e: PointerEvent) => emitPointer('leave', e);
    }

    const combinedRef = (el: HTMLCanvasElement | null) => {
        if (refName) refCallback(refName)(el);
        if (!resizeKey) {
            return;
        }
        if (!el) {
            const binding = canvasResizeBindings.get(resizeKey);
            if (binding) {
                binding.observer.disconnect();
                canvasResizeBindings.delete(resizeKey);
            }
            return;
        }

        const existing = canvasResizeBindings.get(resizeKey);
        if (existing && existing.element === el && existing.resizeId === resizeId) {
            return;
        }
        if (existing) {
            existing.observer.disconnect();
            canvasResizeBindings.delete(resizeKey);
        }

        let binding!: CanvasResizeBinding;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = Math.round(entry.contentRect.width);
                const height = Math.round(entry.contentRect.height);
                if (width === binding.lastWidth && height === binding.lastHeight) {
                    continue;
                }
                binding.lastWidth = width;
                binding.lastHeight = height;
                emit(binding.resizeId, JSON.stringify({
                    Width: width,
                    Height: height,
                }));
            }
        });
        binding = {
            element: el,
            observer,
            resizeId: resizeId!,
            lastWidth: -1,
            lastHeight: -1,
        };
        observer.observe(el);
        canvasResizeBindings.set(resizeKey, binding);
    };

    return h('canvas', {
        ...common,
        ...pointerHandlers,
        width: w,
        height: hVal,
        style: Object.keys(canvasStyle).length > 0 ? canvasStyle : undefined,
        ref: combinedRef,
    });
}

function renderExternalWidget(props: Record<string, any>, children: VoNode[]): any {
    const voChildren = children.length > 0 ? childrenToVNodes(children) : undefined;
    return h(ExternalWidgetHost, { props, voChildren });
}

function ExternalWidgetHost({ props, voChildren }: { props: Record<string, any>; voChildren?: any }): any {
    const widgetType = props.widgetType as string;
    const common = buildCommonProps(props);
    const style = propsToStyle(props);
    const hostRef = useRef<HTMLElement | null>(null);
    const instanceRef = useRef<WidgetInstance | null>(null);
    const propsRef = useRef<Record<string, any>>(props);

    propsRef.current = props;

    useEffect(() => {
        const instance = instanceRef.current;
        if (instance) {
            instance.update?.(props);
        }
    }, [props]);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const factory = widgetRegistry.get(widgetType);
        logStudioWidget(`[vogui] externalWidget effect type=${widgetType} hasFactory=${factory ? 'yes' : 'no'}`);
        if (!factory) return;
        const onWidgetEvent = (payload: string) => {
            const currentProps = propsRef.current;
            if (currentProps.onWidget != null) emit(currentProps.onWidget as number, payload);
        };
        logStudioWidget(`[vogui] externalWidget create type=${widgetType}`);
        const instance = factory.create(host, propsRef.current, onWidgetEvent);
        instanceRef.current = instance;
        widgetInstances.add(instance);
        return () => {
            logStudioWidget(`[vogui] externalWidget destroy type=${widgetType}`);
            widgetInstances.delete(instance);
            if (instanceRef.current === instance) {
                instanceRef.current = null;
            }
            instance.destroy?.();
        };
    }, [widgetType]);

    return h('div', {
        ...common,
        className: 'vo-external-widget',
        style,
        'data-widget-type': widgetType,
        ref: (el: HTMLElement | null) => {
            hostRef.current = el;
            if (props.ref) {
                refCallback(props.ref)(el);
            }
        },
    }, voChildren);
}

function renderProgress(elementProps: Record<string, any>, props: Record<string, any>): any {
    const value = props.value || 0;
    const max = props.max || 100;
    const pct = Math.round((value / max) * 100);

    return h('div', {
        ...elementProps,
        className: [elementProps.className, 'relative h-2 w-full overflow-hidden rounded-full bg-muted'].filter(Boolean).join(' '),
    },
        h('div', {
            className: 'h-full bg-primary transition-all',
            style: { width: `${pct}%` },
        }),
    );
}

// =============================================================================
// HTML attribute helpers
// =============================================================================

function applyInputProps(elementProps: Record<string, any>, props: Record<string, any>): void {
    if (props.type) elementProps.type = props.type;
    if (props.value != null) elementProps.value = String(props.value);
    if (props.placeholder) elementProps.placeholder = props.placeholder;
    if (props.disabled) elementProps.disabled = true;
    if (props.readOnly) elementProps.readOnly = true;

    // Tailwind input styling
    elementProps.className = [
        elementProps.className,
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
        'transition-colors placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
    ].filter(Boolean).join(' ');
}

function applyTextareaProps(elementProps: Record<string, any>, props: Record<string, any>): void {
    if (props.value != null) elementProps.value = String(props.value);
    if (props.placeholder) elementProps.placeholder = props.placeholder;
    if (props.rows) elementProps.rows = Number(props.rows);
    if (props.disabled) elementProps.disabled = true;

    elementProps.className = [
        elementProps.className,
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
    ].filter(Boolean).join(' ');
}

// =============================================================================
// Common props (ref, key, data-attributes)
// =============================================================================

function buildCommonProps(props: Record<string, any>): Record<string, any> {
    const common: Record<string, any> = {};

    // Ref
    if (props.ref) {
        common.ref = refCallback(props.ref);
    }

    // Key
    if (props.key) {
        common.key = props.key;
        common['data-key'] = props.key;
    }

    // Variant
    if (props.variant) {
        common['data-variant'] = props.variant;
    }

    // Transition
    if (props.transition) {
        common['data-transition'] = props.transition;
    }

    // HTML attributes (ARIA, data-*, role, etc.) from node.Attrs()
    if (props.attrs && typeof props.attrs === 'object') {
        const attrs = props.attrs as Record<string, any>;
        for (const [key, val] of Object.entries(attrs)) {
            if (typeof val === 'boolean') {
                if (val) common[key] = '';
                // false → omit the attribute (Preact won't render it)
            } else {
                common[key] = String(val);
            }
        }
    }

    return common;
}
