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
    const t = this.u16(), e = this.bytes.subarray(this.pos, this.pos + t);
    return this.pos += t, _.decode(e);
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
        const e = this.u16(), n = {};
        for (let r = 0; r < e; r++) {
          const d = this.str();
          n[d] = this.value();
        }
        return n;
      }
      case 6: {
        const e = this.u32(), n = new Array(e);
        for (let r = 0; r < e; r++) n[r] = this.value();
        return n;
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
      const c = this.u16(), i = [];
      for (let h = 0; h < c; h++) {
        const l = this.node();
        l && i.push(l);
      }
      return { type: "Fragment", props: {}, children: i };
    }
    if (t === 4) {
      const c = this.u32(), i = this.u16(), h = { _cid: c };
      for (let o = 0; o < i; o++) {
        const u = this.str();
        h[u] = this.value();
      }
      const l = this.node();
      return { type: "__comp__", props: h, children: l ? [l] : [] };
    }
    if (t === 5) {
      const c = this.u32(), i = this.u16(), h = { _cid: c };
      for (let l = 0; l < i; l++) {
        const o = this.str();
        h[o] = this.value();
      }
      return { type: "__cached__", props: h, children: [] };
    }
    const e = this.str(), n = this.u16(), r = {};
    for (let c = 0; c < n; c++) {
      const i = this.str();
      r[i] = this.value();
    }
    const d = this.u32(), f = [];
    for (let c = 0; c < d; c++) {
      const i = this.node();
      i && f.push(i);
    }
    return { type: e, props: r, children: f };
  }
  handler() {
    const t = this.u16(), e = this.u16(), n = this.u8(), r = this.i32(), d = this.u8(), f = [];
    for (let i = 0; i < d; i++) f.push(this.str());
    const c = this.str();
    return {
      iD: t,
      gen: e,
      type: n,
      intVal: r,
      modifiers: f.length > 0 ? f : void 0,
      keyFilter: c || void 0
    };
  }
}
function T(s) {
  const t = new k(s), e = t.u32(), n = t.u8(), r = t.node(), d = t.u16(), f = new Array(d);
  for (let o = 0; o < d; o++)
    f[o] = t.handler();
  let c;
  if (n & 1) {
    const o = t.u16();
    c = new Array(o);
    for (let u = 0; u < o; u++) c[u] = t.str();
  }
  let i;
  if (n & 2) {
    const o = t.u16();
    i = new Array(o);
    for (let u = 0; u < o; u++) {
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
      i[u] = { ref: m, cmds: g };
    }
  }
  let h;
  if (n & 4) {
    const o = t.u16();
    h = {};
    for (let u = 0; u < o; u++) {
      const m = t.str(), p = t.str();
      h[m] = p;
    }
  }
  let l;
  if (n & 8) {
    const o = t.u16();
    l = new Array(o);
    for (let u = 0; u < o; u++) {
      const m = t.str(), p = C(t.str()), a = t.u8() !== 0 ? t.i32() : void 0, y = t.u8() !== 0 ? t.i32() : void 0, w = { ref: m, cmd: p };
      a !== void 0 && (w.top = a), y !== void 0 && (w.measureId = y), l[u] = w;
    }
  }
  return { type: "render", gen: e, tree: r, handlers: f, styles: c, canvas: i, theme: h, refActions: l };
}
function V(s) {
  return A(s.tree);
}
function A(s) {
  if (!s)
    return null;
  if (s.type === "vo-host-widget") {
    const n = s.props?.onWidget;
    if (typeof n == "number")
      return n;
  }
  const t = s.props ?? {};
  for (const n of Object.values(t)) {
    const r = b(n);
    if (r !== null)
      return r;
  }
  const e = s.children ?? [];
  for (const n of e) {
    const r = A(n);
    if (r !== null)
      return r;
  }
  return null;
}
function b(s) {
  if (Array.isArray(s)) {
    for (const t of s) {
      const e = b(t);
      if (e !== null)
        return e;
    }
    return null;
  }
  if (!s || typeof s != "object")
    return null;
  if (x(s))
    return A(s);
  for (const t of Object.values(s)) {
    const e = b(t);
    if (e !== null)
      return e;
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
