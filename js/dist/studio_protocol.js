const _ = new TextDecoder("utf-8");
function C(s) {
  switch (s) {
    case "focus":
    case "blur":
    case "scrollTo":
    case "scrollToSmooth":
    case "scrollToBottom":
    case "scrollToBottomSmooth":
    case "scrollIntoView":
    case "scrollIntoViewSmooth":
    case "selectText":
    case "measure":
      return s;
    default:
      throw new Error(`unsupported ref action command: ${s}`);
  }
}
class k {
  constructor(t) {
    this.pos = 0, this.bytes = t, this.view = new DataView(t.buffer, t.byteOffset, t.byteLength);
  }
  u8() {
    return this.view.getUint8(this.pos++);
  }
  u16() {
    const t = this.view.getUint16(this.pos, !0);
    return this.pos += 2, t;
  }
  u32() {
    const t = this.view.getUint32(this.pos, !0);
    return this.pos += 4, t;
  }
  i32() {
    const t = this.view.getInt32(this.pos, !0);
    return this.pos += 4, t;
  }
  f64() {
    const t = this.view.getFloat64(this.pos, !0);
    return this.pos += 8, t;
  }
  str() {
    const t = this.u16(), n = this.bytes.subarray(this.pos, this.pos + t);
    return this.pos += t, _.decode(n);
  }
  value() {
    switch (this.u8()) {
      case 0:
        return null;
      case 1:
        return this.u8() !== 0;
      case 2:
        return this.i32();
      case 3:
        return this.f64();
      case 4:
        return this.str();
      case 5: {
        const n = this.u16(), i = {};
        for (let e = 0; e < n; e++) {
          const h = this.str();
          i[h] = this.value();
        }
        return i;
      }
      case 6: {
        const n = this.u32(), i = new Array(n);
        for (let e = 0; e < n; e++) i[e] = this.value();
        return i;
      }
      case 7:
        return this.node();
      default:
        return null;
    }
  }
  node() {
    const t = this.u8();
    if (t === 0) return null;
    if (t === 2)
      return { type: "#text", props: { text: this.str() }, children: [] };
    if (t === 3) {
      const c = this.u16(), o = [];
      for (let l = 0; l < c; l++) {
        const f = this.node();
        f && o.push(f);
      }
      return { type: "Fragment", props: {}, children: o };
    }
    if (t === 4) {
      const c = this.u32(), o = this.u16(), l = { _cid: c };
      for (let r = 0; r < o; r++) {
        const u = this.str();
        l[u] = this.value();
      }
      const f = this.node();
      return { type: "__comp__", props: l, children: f ? [f] : [] };
    }
    if (t === 5) {
      const c = this.u32(), o = this.u16(), l = { _cid: c };
      for (let f = 0; f < o; f++) {
        const r = this.str();
        l[r] = this.value();
      }
      return { type: "__cached__", props: l, children: [] };
    }
    const n = this.str(), i = this.u16(), e = {};
    for (let c = 0; c < i; c++) {
      const o = this.str();
      e[o] = this.value();
    }
    const h = this.u32(), d = [];
    for (let c = 0; c < h; c++) {
      const o = this.node();
      o && d.push(o);
    }
    return { type: n, props: e, children: d };
  }
  handler() {
    const t = this.u16(), n = this.u16(), i = this.u8(), e = this.i32(), h = this.u8(), d = [];
    for (let o = 0; o < h; o++) d.push(this.str());
    const c = this.str();
    return {
      iD: t,
      gen: n,
      type: i,
      intVal: e,
      modifiers: d.length > 0 ? d : void 0,
      keyFilter: c || void 0
    };
  }
}
function T(s) {
  const t = new k(s), n = t.u32(), i = t.u8(), e = t.node(), h = t.u16(), d = new Array(h);
  for (let r = 0; r < h; r++)
    d[r] = t.handler();
  let c;
  if (i & 1) {
    const r = t.u16();
    c = new Array(r);
    for (let u = 0; u < r; u++) c[u] = t.str();
  }
  let o;
  if (i & 2) {
    const r = t.u16();
    o = new Array(r);
    for (let u = 0; u < r; u++) {
      const m = t.str(), p = t.u32(), g = new Array(p);
      for (let a = 0; a < p; a++) {
        const v = t.str(), y = t.u8();
        if (y > 0) {
          const w = new Array(y);
          for (let I = 0; I < y; I++) w[I] = t.value();
          g[a] = { c: v, a: w };
        } else
          g[a] = { c: v };
      }
      o[u] = { ref: m, cmds: g };
    }
  }
  let l;
  if (i & 4) {
    const r = t.u16();
    l = {};
    for (let u = 0; u < r; u++) {
      const m = t.str(), p = t.str();
      l[m] = p;
    }
  }
  let f;
  if (i & 8) {
    const r = t.u16();
    f = new Array(r);
    for (let u = 0; u < r; u++) {
      const m = t.str(), p = C(t.str()), a = t.u8() !== 0 ? t.i32() : void 0, y = t.u8() !== 0 ? t.i32() : void 0, w = { ref: m, cmd: p };
      a !== void 0 && (w.top = a), y !== void 0 && (w.measureId = y), f[u] = w;
    }
  }
  return { type: "render", gen: n, tree: e, handlers: d, styles: c, canvas: o, theme: l, refActions: f };
}
function V(s) {
  return A(s.tree);
}
function A(s) {
  var i;
  if (!s)
    return null;
  if (s.type === "vo-host-widget") {
    const e = (i = s.props) == null ? void 0 : i.onWidget;
    if (typeof e == "number")
      return e;
  }
  const t = s.props ?? {};
  for (const e of Object.values(t)) {
    const h = b(e);
    if (h !== null)
      return h;
  }
  const n = s.children ?? [];
  for (const e of n) {
    const h = A(e);
    if (h !== null)
      return h;
  }
  return null;
}
function b(s) {
  if (Array.isArray(s)) {
    for (const t of s) {
      const n = b(t);
      if (n !== null)
        return n;
    }
    return null;
  }
  if (!s || typeof s != "object")
    return null;
  if (x(s))
    return A(s);
  for (const t of Object.values(s)) {
    const n = b(t);
    if (n !== null)
      return n;
  }
  return null;
}
function x(s) {
  return "type" in s && typeof s.type == "string" && ("props" in s || "children" in s);
}
function j(s) {
  return V(T(s));
}
export {
  j as findHostWidgetHandlerId
};
