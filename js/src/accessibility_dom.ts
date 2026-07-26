export type DomSemanticAction =
  | "press"
  | "focus"
  | "increment"
  | "decrement"
  | "setValue"
  | "dismiss";

export interface DomSemanticNode {
  readonly id: string;
  readonly domNodeKey: string;
  readonly role: string;
  readonly name: string;
  readonly description: string;
  readonly valueText: string;
  readonly states: Readonly<Record<string, string | boolean | number>>;
  readonly actions: readonly DomSemanticAction[];
  readonly live: "off" | "polite" | "assertive";
}

export interface DomSemanticSnapshot {
  readonly revision: bigint;
  readonly nodes: readonly DomSemanticNode[];
}

export interface DomAccessibilityLimits {
  readonly maxNodes: number;
  readonly maxStringBytes: number;
  readonly maxStatesPerNode: number;
}

export class DomAccessibilityHost {
  readonly #root: ShadowRoot | HTMLElement;
  readonly #limits: DomAccessibilityLimits;
  readonly #owned = new Map<string, Element>();
  #revision = 0n;
  #closed = false;

  constructor(root: ShadowRoot | HTMLElement, limits: DomAccessibilityLimits) {
    if (
      !Number.isSafeInteger(limits.maxNodes)
      || limits.maxNodes <= 0
      || !Number.isSafeInteger(limits.maxStringBytes)
      || limits.maxStringBytes <= 0
      || !Number.isSafeInteger(limits.maxStatesPerNode)
      || limits.maxStatesPerNode <= 0
    ) {
      throw new Error("invalid DOM accessibility limits");
    }
    this.#root = root;
    this.#limits = limits;
  }

  get revision(): bigint {
    return this.#revision;
  }

  apply(snapshot: DomSemanticSnapshot): void {
    this.#assertOpen();
    if (snapshot.revision !== this.#revision + 1n) {
      throw new Error("DOM semantic revision mismatch");
    }
    if (snapshot.nodes.length > this.#limits.maxNodes) {
      throw new Error("DOM semantic node capacity exceeded");
    }
    const staged = new Map<string, { semantic: DomSemanticNode; element: Element }>();
    let stringBytes = 0;
    for (const semantic of snapshot.nodes) {
      if (
        semantic.id.length === 0
        || semantic.domNodeKey.length === 0
        || staged.has(semantic.id)
        || Object.keys(semantic.states).length > this.#limits.maxStatesPerNode
      ) {
        throw new Error("invalid DOM semantic node");
      }
      stringBytes += semantic.id.length
        + semantic.domNodeKey.length
        + semantic.role.length
        + semantic.name.length
        + semantic.description.length
        + semantic.valueText.length;
      for (const [name, value] of Object.entries(semantic.states)) {
        stringBytes += name.length + String(value).length;
      }
      if (stringBytes > this.#limits.maxStringBytes) {
        throw new Error("DOM semantic string capacity exceeded");
      }
      const element = this.#root.querySelector(`[data-vogui-node="${cssEscape(semantic.domNodeKey)}"]`);
      if (element === null) throw new Error("DOM semantic node has no rendered element");
      staged.set(semantic.id, { semantic, element });
    }

    for (const [id, element] of this.#owned) {
      if (!staged.has(id)) clearSemanticAttributes(element);
    }
    this.#owned.clear();
    for (const [id, { semantic, element }] of staged) {
      applySemanticAttributes(element, semantic);
      this.#owned.set(id, element);
    }
    this.#revision = snapshot.revision;
  }

  perform(
    semanticId: string,
    action: DomSemanticAction,
    argument?: string,
  ): void {
    this.#assertOpen();
    const element = this.#owned.get(semanticId);
    if (element === undefined) throw new Error("unknown DOM semantic node");
    const actions = (element.getAttribute("data-vogui-semantic-actions") ?? "").split(" ");
    if (!actions.includes(action)) throw new Error("unsupported DOM semantic action");
    switch (action) {
      case "press":
        if (element instanceof HTMLElement) element.click();
        break;
      case "focus":
        if (element instanceof HTMLElement) element.focus({ preventScroll: true });
        break;
      case "increment":
      case "decrement": {
        if (!(element instanceof HTMLInputElement)) throw new Error("semantic range target mismatch");
        action === "increment" ? element.stepUp() : element.stepDown();
        element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        break;
      }
      case "setValue": {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
          throw new Error("semantic value target mismatch");
        }
        element.value = argument ?? "";
        element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        break;
      }
      case "dismiss":
        element.dispatchEvent(new CustomEvent("vogui-dismiss", { bubbles: true, composed: true }));
        break;
    }
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const element of this.#owned.values()) clearSemanticAttributes(element);
    this.#owned.clear();
  }

  #assertOpen(): void {
    if (this.#closed) throw new Error("DOM accessibility host closed");
  }
}

function applySemanticAttributes(element: Element, semantic: DomSemanticNode): void {
  clearSemanticAttributes(element);
  element.setAttribute("data-vogui-semantic-id", semantic.id);
  element.setAttribute("data-vogui-semantic-actions", semantic.actions.join(" "));
  setAttribute(element, "role", semantic.role);
  setAttribute(element, "aria-label", semantic.name);
  setAttribute(element, "aria-description", semantic.description);
  setAttribute(element, "aria-valuetext", semantic.valueText);
  if (semantic.live !== "off") element.setAttribute("aria-live", semantic.live);
  for (const [name, value] of Object.entries(semantic.states)) {
    element.setAttribute(`aria-${ariaStateName(name)}`, String(value));
  }
}

function clearSemanticAttributes(element: Element): void {
  for (const attribute of [...element.attributes]) {
    if (
      attribute.name === "role"
      || attribute.name.startsWith("aria-")
      || attribute.name.startsWith("data-vogui-semantic-")
    ) {
      element.removeAttribute(attribute.name);
    }
  }
}

function setAttribute(element: Element, name: string, value: string): void {
  if (value.length > 0) element.setAttribute(name, value);
}

function ariaStateName(name: string): string {
  return name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

function cssEscape(value: string): string {
  if (globalThis.CSS?.escape !== undefined) return globalThis.CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}
