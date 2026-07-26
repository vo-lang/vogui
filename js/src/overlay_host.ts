import { DomRenderer } from "./dom_renderer.js";

export interface BrowserOverlayHostLimits {
  readonly maxOverlays: number;
  readonly maxFocusablesPerScope: number;
}

export interface BrowserOverlayDescriptor {
  readonly id: string;
  readonly modal: boolean;
  readonly dismissOnEscape: boolean;
  readonly restoreFocus: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
  readonly onDismissRequested?: () => void;
}

export interface BrowserOverlay {
  readonly id: string;
  readonly portal: HTMLElement;
  readonly content: HTMLElement;
}

interface OwnedOverlay extends BrowserOverlay {
  readonly descriptor: BrowserOverlayDescriptor;
  readonly previouslyFocused: HTMLElement | null;
  readonly inerted: Map<HTMLElement, boolean>;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

export class BrowserOverlayHost {
  readonly #document: Document;
  readonly #renderer: DomRenderer;
  readonly #limits: BrowserOverlayHostLimits;
  readonly #overlays: OwnedOverlay[] = [];
  readonly #abort = new AbortController();
  #closed = false;

  constructor(
    document: Document,
    renderer: DomRenderer,
    limits: BrowserOverlayHostLimits,
  ) {
    if (
      !Number.isSafeInteger(limits.maxOverlays)
      || limits.maxOverlays <= 0
      || !Number.isSafeInteger(limits.maxFocusablesPerScope)
      || limits.maxFocusablesPerScope <= 0
    ) {
      throw new Error("invalid browser overlay host limits");
    }
    this.#document = document;
    this.#renderer = renderer;
    this.#limits = limits;
    document.addEventListener("keydown", (event) => this.#onKeyDown(event), {
      capture: true,
      signal: this.#abort.signal,
    });
  }

  open(descriptor: BrowserOverlayDescriptor): BrowserOverlay {
    this.#assertOpen();
    if (
      descriptor.id.length === 0
      || this.#overlays.some((overlay) => overlay.id === descriptor.id)
    ) {
      throw new Error("invalid or duplicate overlay id");
    }
    if (this.#overlays.length >= this.#limits.maxOverlays) {
      throw new Error("overlay capacity exceeded");
    }
    const portal = this.#document.createElement("div");
    portal.setAttribute("data-vogui-portal", descriptor.id);
    portal.style.position = "fixed";
    portal.style.inset = "0";
    portal.style.zIndex = String(1_000_000 + this.#overlays.length);
    portal.style.pointerEvents = "none";

    const content = this.#document.createElement("div");
    content.setAttribute("data-vogui-overlay", descriptor.id);
    content.style.pointerEvents = "auto";
    if (descriptor.className !== undefined) content.className = descriptor.className;
    if (descriptor.ariaLabel !== undefined) content.setAttribute("aria-label", descriptor.ariaLabel);
    if (descriptor.modal) {
      content.setAttribute("role", "dialog");
      content.setAttribute("aria-modal", "true");
    }
    portal.appendChild(content);
    this.#document.body.appendChild(portal);
    this.#renderer.registerPortal(portal);

    const overlay: OwnedOverlay = {
      id: descriptor.id,
      portal,
      content,
      descriptor,
      previouslyFocused: this.#document.activeElement instanceof HTMLElement
        ? this.#document.activeElement
        : null,
      inerted: new Map(),
    };
    this.#overlays.push(overlay);
    if (descriptor.modal) this.#activateModal(overlay);
    return overlay;
  }

  focusInitial(id: string, preferred?: HTMLElement): void {
    const overlay = this.#overlay(id);
    const focusables = this.#focusables(overlay);
    const target = preferred !== undefined && overlay.content.contains(preferred)
      ? preferred
      : focusables[0] ?? overlay.content;
    if (target === overlay.content && !overlay.content.hasAttribute("tabindex")) {
      overlay.content.tabIndex = -1;
    }
    target.focus({ preventScroll: true });
  }

  close(id: string): void {
    this.#assertOpen();
    const index = this.#overlays.findIndex((overlay) => overlay.id === id);
    if (index < 0) throw new Error("unknown overlay");
    if (index !== this.#overlays.length - 1) throw new Error("focus scopes must close in stack order");
    const overlay = this.#overlays.pop()!;
    overlay.portal.remove();
    this.#restoreInert(overlay);
    const next = this.#overlays.at(-1);
    if (next?.descriptor.modal === true) {
      this.#activateModal(next);
      this.focusInitial(next.id);
    } else if (
      overlay.descriptor.restoreFocus
      && overlay.previouslyFocused !== null
      && overlay.previouslyFocused.isConnected
    ) {
      overlay.previouslyFocused.focus({ preventScroll: true });
    }
  }

  closeAll(): void {
    while (this.#overlays.length > 0) this.close(this.#overlays.at(-1)!.id);
  }

  closeHost(): void {
    if (this.#closed) return;
    this.closeAll();
    this.#closed = true;
    this.#abort.abort();
  }

  #activateModal(overlay: OwnedOverlay): void {
    for (const sibling of [...this.#document.body.children]) {
      if (!(sibling instanceof HTMLElement) || sibling === overlay.portal) continue;
      overlay.inerted.set(sibling, sibling.inert);
      sibling.inert = true;
    }
  }

  #restoreInert(overlay: OwnedOverlay): void {
    for (const [element, previous] of overlay.inerted) {
      if (element.isConnected) element.inert = previous;
    }
    overlay.inerted.clear();
  }

  #onKeyDown(event: KeyboardEvent): void {
    const active = this.#overlays.at(-1);
    if (active === undefined) return;
    if (event.key === "Escape" && active.descriptor.dismissOnEscape) {
      event.preventDefault();
      event.stopPropagation();
      active.descriptor.onDismissRequested?.();
      return;
    }
    if (event.key !== "Tab" || !active.descriptor.modal) return;
    const focusables = this.#focusables(active);
    if (focusables.length === 0) {
      event.preventDefault();
      this.focusInitial(active.id);
      return;
    }
    const focused = this.#document.activeElement;
    let index = focusables.findIndex((element) => element === focused);
    index = event.shiftKey
      ? (index <= 0 ? focusables.length - 1 : index - 1)
      : (index < 0 || index === focusables.length - 1 ? 0 : index + 1);
    event.preventDefault();
    focusables[index]!.focus({ preventScroll: true });
  }

  #focusables(overlay: OwnedOverlay): HTMLElement[] {
    const elements = [...overlay.content.querySelectorAll(FOCUSABLE_SELECTOR)]
      .filter((element): element is HTMLElement =>
        element instanceof HTMLElement
        && !element.hidden
        && !element.inert
        && element.getAttribute("aria-hidden") !== "true",
      );
    if (elements.length > this.#limits.maxFocusablesPerScope) {
      throw new Error("focus scope capacity exceeded");
    }
    return elements;
  }

  #overlay(id: string): OwnedOverlay {
    this.#assertOpen();
    const overlay = this.#overlays.find((candidate) => candidate.id === id);
    if (overlay === undefined) throw new Error("unknown overlay");
    return overlay;
  }

  #assertOpen(): void {
    if (this.#closed) throw new Error("overlay host closed");
  }
}
