/** Apply theme CSS custom properties to a container element. */
export declare function applyTheme(container: HTMLElement, theme?: Record<string, string>): void;

/** Canvas command batch targeting a specific canvas ref. */
export declare interface CanvasBatch {
    ref: string;
    cmds: CanvasCommand[];
}

/** Canvas draw command from Vo. */
export declare interface CanvasCommand {
    c: string;
    a?: any[];
}

/** Decode a binary render message produced by VoGUI's encode.vo. */
export declare function decodeBinaryRender(data: Uint8Array): RenderMessage;

/** Unregister and destroy all widget instances. */
export declare function destroyWidgets(): void;

/** Emit an event to Vo. */
export declare function emit(handlerId: number, payload: string): void;

/** Event callback signature. */
export declare type EventCallback = (handlerId: number, payload: string) => void;

/** Execute a batch of canvas commands on the target canvas element. */
export declare function executeCanvasBatch(batch: CanvasBatch, refRegistry: Map<string, HTMLElement>): void;

export declare function executeRefAction(action: RefAction): void;

/**
 * Fill text with word wrapping on a Canvas 2D context.
 * Uses Pretext for line breaking, then draws each line with ctx.fillText.
 */
export declare function fillTextWrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void;

export declare function findHostWidgetHandlerId(message: RenderMessage): number | null;

export declare function findHostWidgetHandlerIdInBytes(bytes: Uint8Array): number | null;

/** Get a DOM element by its Vo ref name. */
export declare function getRef(name: string): HTMLElement | undefined;

/** Inject dynamic CSS strings from Vo's Style combinator system. */
export declare function injectDynamicStyles(styles: string[]): void;

/** Inject the base VoGUI Tailwind stylesheet. Called once before first render. */
export declare function injectStyles(): void;

export declare function installAudioBridge(): void;

/** Check if dark mode is currently active. */
export declare function isDarkMode(): boolean;

/**
 * Measure text height and line count.
 * Returns binary: [f64 LE height][i32 LE lineCount] = 12 bytes.
 */
export declare function measureText(text: string, font: string, maxWidth: number, lineHeight: number, whiteSpace?: number): Uint8Array;

/**
 * Measure text and return per-line info.
 * Binary format:
 *   [f64 LE height]      8 bytes
 *   [i32 LE lineCount]   4 bytes
 *   [i32 LE numLines]    4 bytes
 *   per line:
 *     [u16 LE textLen]   2 bytes
 *     [u8[] text]         textLen bytes
 *     [f64 LE width]     8 bytes
 */
export declare function measureTextLines(text: string, font: string, maxWidth: number, lineHeight: number, whiteSpace?: number): Uint8Array;

export declare interface RefAction {
    ref: string;
    cmd: RefActionCommand;
    top?: number;
    measureId?: number;
}

declare type RefActionCommand = 'focus' | 'blur' | 'scrollTo' | 'scrollToSmooth' | 'scrollToBottom' | 'scrollToBottomSmooth' | 'scrollIntoView' | 'scrollIntoViewSmooth' | 'selectText' | 'measure';

/** Register an host widget factory. */
export declare function registerWidget(type: string, factory: WidgetFactory): void;

/** Render a decoded VoNode tree into a container element. */
export declare function render(container: HTMLElement, msg: RenderMessage, config: RendererConfig): void;

/** Renderer configuration. */
export declare interface RendererConfig {
    onEvent?: EventCallback;
}

/** Render message from Vo. */
export declare interface RenderMessage {
    type: 'render';
    gen: number;
    tree: VoNode;
    handlers: VoHandler[];
    styles?: string[];
    canvas?: CanvasBatch[];
    theme?: Record<string, string>;
    refActions?: RefAction[];
}

/** Explicitly set dark mode on or off. */
export declare function setDarkMode(enabled: boolean): void;

/** Update the render context for event dispatch. Called on each render(). */
export declare function setRenderContext(gen: number, handlers: VoHandler[], config: RendererConfig): void;

/**
 * Setup a global keyboard handler that forwards key events to Vo's
 * global key handler (handler ID -2). Skips events from form inputs.
 * Returns a cleanup function.
 */
export declare function setupKeyHandler(config: RendererConfig): () => void;

/** Toggle dark mode on the render container. Returns the new state. */
export declare function toggleDarkMode(): boolean;

/** Handler metadata from Vo. */
export declare interface VoHandler {
    iD: number;
    gen: number;
    type: number;
    intVal: number;
    modifiers?: string[];
    keyFilter?: string;
}

/** VoNode is the decoded representation of a Vo Node struct. */
export declare interface VoNode {
    type: string;
    props?: Record<string, any>;
    children?: VoNode[];
}

export declare function voNodeToVNode(node: VoNode | null | undefined): any;

/** Host widget factory interface. */
export declare interface WidgetFactory {
    create(container: HTMLElement, props: Record<string, any>, onEvent: (payload: string) => void): WidgetInstance;
}

/** Host widget instance interface. */
export declare interface WidgetInstance {
    update?(props: Record<string, any>): void;
    destroy?(): void;
}

export { }
