import {
  DomRenderer,
  type DomPatchBatch,
  type DomProperty,
  type DomRendererIdentity,
  type DomReturn,
} from "./dom_renderer.js";

interface SmokeReport {
  readonly complete: boolean;
  readonly passed: boolean;
  readonly cases: readonly string[];
  readonly detail: string;
}

declare global {
  interface Window {
    __voguiBrowserSmoke?: SmokeReport;
  }
}

const host = requireElement("host", HTMLDivElement);
const output = requireElement("results", HTMLPreElement);
const identity: DomRendererIdentity = {
  session: { index: 1, generation: 1 },
  root: { index: 2, generation: 1 },
  uiRootEpoch: 1,
  appCodeEpoch: 1n,
  rendererGeneration: { index: 3, generation: 1 },
};

let report: SmokeReport;
try {
  const returns: DomReturn[] = [];
  const renderer = new DomRenderer(
    host,
    "shadow",
    identity,
    {
      maxNodes: 16,
      maxMutations: 64,
      maxPropertiesPerNode: 64,
      maxStringBytes: 4096,
    },
    (item) => returns.push(item),
  );
  renderer.apply(batch(0n, 1n, true, [
    { kind: "create", node: identity.root, index: 0 },
    {
      kind: "setKind",
      node: identity.root,
      nodeKind: { kind: "element", tag: "button" },
    },
    {
      kind: "setProperties",
      node: identity.root,
      properties: styledProperties([
        ["display", "flex"],
        ["width", "120px"],
        ["background-color", "#123456ff"],
        ["color", "#f0f4f8ff"],
        ["hover-color", "#ffffffff"],
      ]).concat([
        { field: "role", value: "button" },
        { field: "ariaLabel", value: "Save game" },
        { field: "tabIndex", value: 0 },
      ]),
    },
    {
      kind: "bindEvent",
      node: identity.root,
      eventType: "pointerDown",
      token: { index: 4, generation: 1 },
      policy: {
        preventDefault: true,
        stopPropagation: false,
        passive: false,
        once: false,
      },
    },
  ]));
  const node = host.shadowRoot?.querySelector<HTMLElement>("[data-vogui-node]");
  assert(node !== null && node !== undefined, "rendered node");
  assert(node.style.display === "flex", "portable display reaches CSS");
  assert(node.style.width === "120px", "portable width reaches CSS");
  assert(
    getComputedStyle(node).backgroundColor === "rgb(18, 52, 86)",
    "typed background reaches computed style",
  );
  assert(
    node.style.getPropertyValue("--vogui-hover-color") === "#ffffffff",
    "renderer-owned state token retained",
  );
  assert(node.style.getPropertyValue("hover-color") === "", "state token is not unsafe CSS");
  assert(node.getAttribute("role") === "button", "portable role reaches DOM semantics");
  assert(node.getAttribute("aria-label") === "Save game", "portable label reaches DOM semantics");
  assert(node.tabIndex === 0, "portable tab order reaches DOM semantics");
  node.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true,
    pointerId: 7,
    pointerType: "mouse",
    clientX: 8,
    clientY: 8,
    button: 0,
    buttons: 1,
  }));
  const eventReturn = returns.find((item) => item.kind === "event");
  assert(eventReturn?.kind === "event", "delegated event reaches UiReturn");
  assert(eventReturn.event.type === "pointerDown", "typed event kind");
  assert(eventReturn.event.appliedRevision === 1n, "event revision");
  assert(eventReturn.event.token.index === 4, "event token");

  renderer.apply(batch(1n, 2n, false, [{
    kind: "setProperties",
    node: identity.root,
    properties: styledProperties([["color", "#010203ff"]]),
  }]));
  assert(String(node.style.display) === "", "removed display is cleared");
  assert(String(node.style.width) === "", "removed width is cleared");
  assert(node.style.backgroundColor === "", "removed background is cleared");
  assert(
    node.style.getPropertyValue("--vogui-hover-color") === "",
    "removed state token is cleared",
  );
  assert(node.getAttribute("role") === null, "removed role is cleared");
  assert(node.getAttribute("aria-label") === null, "removed aria label is cleared");
  assert(node.getAttribute("tabindex") === null, "removed tab order is cleared");
  assert(getComputedStyle(node).color === "rgb(1, 2, 3)", "replacement color applied");
  renderer.apply(batch(2n, 3n, false, [{
    kind: "setProperties",
    node: identity.root,
    properties: styledProperties([
      ["color", "#010203ff"],
      ["hover-color", "#aabbccff"],
    ]),
  }]));
  assert(
    host.shadowRoot?.adoptedStyleSheets.some((sheet) =>
      [...sheet.cssRules].some((rule) => rule.cssText.includes(":hover"))
    ) === true,
    "renderer state stylesheet installed",
  );
  report = {
    complete: true,
    passed: true,
    cases: [
      "retained DOM style and semantic replacement",
      "delegated pointer event reaches typed UiReturn",
      "renderer-owned interaction state stylesheet",
    ],
    detail: "ok",
  };
} catch (error) {
  report = {
    complete: true,
    passed: false,
    cases: [],
    detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
  };
}

window.__voguiBrowserSmoke = report;
document.documentElement.dataset.smoke = report.passed ? "passed" : "failed";
output.textContent = JSON.stringify(report, null, 2);

function styles(entries: ReadonlyArray<readonly [string, string]>): DomProperty[] {
  return entries.map(([name, value]) => ({ field: "styleToken", name, value }));
}

function styledProperties(entries: ReadonlyArray<readonly [string, string]>): DomProperty[] {
  return [{ field: "text", value: "style target" }, ...styles(entries)];
}

function batch(
  baseRevision: bigint,
  newRevision: bigint,
  replacement: boolean,
  mutations: DomPatchBatch["mutations"],
): DomPatchBatch {
  return {
    identity,
    baseRevision,
    newRevision,
    replacement,
    mutations,
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function requireElement<T extends Element>(
  id: string,
  constructor: { new (): T },
): T {
  const element = document.getElementById(id);
  if (!(element instanceof constructor)) throw new Error(`missing #${id}`);
  return element;
}
