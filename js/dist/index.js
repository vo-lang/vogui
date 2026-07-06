var un, K, Zs, ct, Vi, Qs, ea, ta, Wr, fr, pr, na, Un = {}, jn = [], Ud = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, dn = Array.isArray;
function Te(e, t) {
  for (var n in t) e[n] = t[n];
  return e;
}
function Hr(e) {
  e && e.parentNode && e.parentNode.removeChild(e);
}
function C(e, t, n) {
  var o, r, i, s = {};
  for (i in t) i == "key" ? o = t[i] : i == "ref" ? r = t[i] : s[i] = t[i];
  if (arguments.length > 2 && (s.children = arguments.length > 3 ? un.call(arguments, 2) : n), typeof e == "function" && e.defaultProps != null) for (i in e.defaultProps) s[i] === void 0 && (s[i] = e.defaultProps[i]);
  return en(e, s, o, r, null);
}
function en(e, t, n, o, r) {
  var i = { type: e, props: t, key: n, ref: o, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: r ?? ++Zs, __i: -1, __u: 0 };
  return r == null && K.vnode != null && K.vnode(i), i;
}
function oa() {
  return { current: null };
}
function ce(e) {
  return e.children;
}
function Ee(e, t) {
  this.props = e, this.context = t;
}
function Dt(e, t) {
  if (t == null) return e.__ ? Dt(e.__, e.__i + 1) : null;
  for (var n; t < e.__k.length; t++) if ((n = e.__k[t]) != null && n.__e != null) return n.__e;
  return typeof e.type == "function" ? Dt(e) : null;
}
function jd(e) {
  if (e.__P && e.__d) {
    var t = e.__v, n = t.__e, o = [], r = [], i = Te({}, t);
    i.__v = t.__v + 1, K.vnode && K.vnode(i), Vr(e.__P, i, t, e.__n, e.__P.namespaceURI, 32 & t.__u ? [n] : null, o, n ?? Dt(t), !!(32 & t.__u), r), i.__v = t.__v, i.__.__k[i.__i] = i, aa(o, i, r), t.__e = t.__ = null, i.__e != n && ra(i);
  }
}
function ra(e) {
  if ((e = e.__) != null && e.__c != null) return e.__e = e.__c.base = null, e.__k.some(function(t) {
    if (t != null && t.__e != null) return e.__e = e.__c.base = t.__e;
  }), ra(e);
}
function hr(e) {
  (!e.__d && (e.__d = !0) && ct.push(e) && !zn.__r++ || Vi != K.debounceRendering) && ((Vi = K.debounceRendering) || Qs)(zn);
}
function zn() {
  for (var e, t = 1; ct.length; ) ct.length > t && ct.sort(ea), e = ct.shift(), t = ct.length, jd(e);
  zn.__r = 0;
}
function ia(e, t, n, o, r, i, s, a, l, c, u) {
  var d, f, p, x, h, m, v, g = o && o.__k || jn, w = t.length;
  for (l = zd(n, t, g, l, w), d = 0; d < w; d++) (p = n.__k[d]) != null && (f = p.__i != -1 && g[p.__i] || Un, p.__i = d, m = Vr(e, p, f, r, i, s, a, l, c, u), x = p.__e, p.ref && f.ref != p.ref && (f.ref && Ur(f.ref, null, p), u.push(p.ref, p.__c || x, p)), h == null && x != null && (h = x), (v = !!(4 & p.__u)) || f.__k === p.__k ? l = sa(p, l, e, v) : typeof p.type == "function" && m !== void 0 ? l = m : x && (l = x.nextSibling), p.__u &= -7);
  return n.__e = h, l;
}
function zd(e, t, n, o, r) {
  var i, s, a, l, c, u = n.length, d = u, f = 0;
  for (e.__k = new Array(r), i = 0; i < r; i++) (s = t[i]) != null && typeof s != "boolean" && typeof s != "function" ? (typeof s == "string" || typeof s == "number" || typeof s == "bigint" || s.constructor == String ? s = e.__k[i] = en(null, s, null, null, null) : dn(s) ? s = e.__k[i] = en(ce, { children: s }, null, null, null) : s.constructor === void 0 && s.__b > 0 ? s = e.__k[i] = en(s.type, s.props, s.key, s.ref ? s.ref : null, s.__v) : e.__k[i] = s, l = i + f, s.__ = e, s.__b = e.__b + 1, a = null, (c = s.__i = Kd(s, n, l, d)) != -1 && (d--, (a = n[c]) && (a.__u |= 2)), a == null || a.__v == null ? (c == -1 && (r > u ? f-- : r < u && f++), typeof s.type != "function" && (s.__u |= 4)) : c != l && (c == l - 1 ? f-- : c == l + 1 ? f++ : (c > l ? f-- : f++, s.__u |= 4))) : e.__k[i] = null;
  if (d) for (i = 0; i < u; i++) (a = n[i]) != null && (2 & a.__u) == 0 && (a.__e == o && (o = Dt(a)), la(a, a));
  return o;
}
function sa(e, t, n, o) {
  var r, i;
  if (typeof e.type == "function") {
    for (r = e.__k, i = 0; r && i < r.length; i++) r[i] && (r[i].__ = e, t = sa(r[i], t, n, o));
    return t;
  }
  e.__e != t && (o && (t && e.type && !t.parentNode && (t = Dt(e)), n.insertBefore(e.__e, t || null)), t = e.__e);
  do
    t = t && t.nextSibling;
  while (t != null && t.nodeType == 8);
  return t;
}
function Ve(e, t) {
  return t = t || [], e == null || typeof e == "boolean" || (dn(e) ? e.some(function(n) {
    Ve(n, t);
  }) : t.push(e)), t;
}
function Kd(e, t, n, o) {
  var r, i, s, a = e.key, l = e.type, c = t[n], u = c != null && (2 & c.__u) == 0;
  if (c === null && a == null || u && a == c.key && l == c.type) return n;
  if (o > (u ? 1 : 0)) {
    for (r = n - 1, i = n + 1; r >= 0 || i < t.length; ) if ((c = t[s = r >= 0 ? r-- : i++]) != null && (2 & c.__u) == 0 && a == c.key && l == c.type) return s;
  }
  return -1;
}
function Ui(e, t, n) {
  t[0] == "-" ? e.setProperty(t, n ?? "") : e[t] = n == null ? "" : typeof n != "number" || Ud.test(t) ? n : n + "px";
}
function An(e, t, n, o, r) {
  var i, s;
  e: if (t == "style") if (typeof n == "string") e.style.cssText = n;
  else {
    if (typeof o == "string" && (e.style.cssText = o = ""), o) for (t in o) n && t in n || Ui(e.style, t, "");
    if (n) for (t in n) o && n[t] == o[t] || Ui(e.style, t, n[t]);
  }
  else if (t[0] == "o" && t[1] == "n") i = t != (t = t.replace(ta, "$1")), s = t.toLowerCase(), t = s in e || t == "onFocusOut" || t == "onFocusIn" ? s.slice(2) : t.slice(2), e.l || (e.l = {}), e.l[t + i] = n, n ? o ? n.u = o.u : (n.u = Wr, e.addEventListener(t, i ? pr : fr, i)) : e.removeEventListener(t, i ? pr : fr, i);
  else {
    if (r == "http://www.w3.org/2000/svg") t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if (t != "width" && t != "height" && t != "href" && t != "list" && t != "form" && t != "tabIndex" && t != "download" && t != "rowSpan" && t != "colSpan" && t != "role" && t != "popover" && t in e) try {
      e[t] = n ?? "";
      break e;
    } catch {
    }
    typeof n == "function" || (n == null || n === !1 && t[4] != "-" ? e.removeAttribute(t) : e.setAttribute(t, t == "popover" && n == 1 ? "" : n));
  }
}
function ji(e) {
  return function(t) {
    if (this.l) {
      var n = this.l[t.type + e];
      if (t.t == null) t.t = Wr++;
      else if (t.t < n.u) return;
      return n(K.event ? K.event(t) : t);
    }
  };
}
function Vr(e, t, n, o, r, i, s, a, l, c) {
  var u, d, f, p, x, h, m, v, g, w, _, S, y, N, k, O = t.type;
  if (t.constructor !== void 0) return null;
  128 & n.__u && (l = !!(32 & n.__u), i = [a = t.__e = n.__e]), (u = K.__b) && u(t);
  e: if (typeof O == "function") try {
    if (v = t.props, g = "prototype" in O && O.prototype.render, w = (u = O.contextType) && o[u.__c], _ = u ? w ? w.props.value : u.__ : o, n.__c ? m = (d = t.__c = n.__c).__ = d.__E : (g ? t.__c = d = new O(v, _) : (t.__c = d = new Ee(v, _), d.constructor = O, d.render = Yd), w && w.sub(d), d.state || (d.state = {}), d.__n = o, f = d.__d = !0, d.__h = [], d._sb = []), g && d.__s == null && (d.__s = d.state), g && O.getDerivedStateFromProps != null && (d.__s == d.state && (d.__s = Te({}, d.__s)), Te(d.__s, O.getDerivedStateFromProps(v, d.__s))), p = d.props, x = d.state, d.__v = t, f) g && O.getDerivedStateFromProps == null && d.componentWillMount != null && d.componentWillMount(), g && d.componentDidMount != null && d.__h.push(d.componentDidMount);
    else {
      if (g && O.getDerivedStateFromProps == null && v !== p && d.componentWillReceiveProps != null && d.componentWillReceiveProps(v, _), t.__v == n.__v || !d.__e && d.shouldComponentUpdate != null && d.shouldComponentUpdate(v, d.__s, _) === !1) {
        t.__v != n.__v && (d.props = v, d.state = d.__s, d.__d = !1), t.__e = n.__e, t.__k = n.__k, t.__k.some(function(E) {
          E && (E.__ = t);
        }), jn.push.apply(d.__h, d._sb), d._sb = [], d.__h.length && s.push(d);
        break e;
      }
      d.componentWillUpdate != null && d.componentWillUpdate(v, d.__s, _), g && d.componentDidUpdate != null && d.__h.push(function() {
        d.componentDidUpdate(p, x, h);
      });
    }
    if (d.context = _, d.props = v, d.__P = e, d.__e = !1, S = K.__r, y = 0, g) d.state = d.__s, d.__d = !1, S && S(t), u = d.render(d.props, d.state, d.context), jn.push.apply(d.__h, d._sb), d._sb = [];
    else do
      d.__d = !1, S && S(t), u = d.render(d.props, d.state, d.context), d.state = d.__s;
    while (d.__d && ++y < 25);
    d.state = d.__s, d.getChildContext != null && (o = Te(Te({}, o), d.getChildContext())), g && !f && d.getSnapshotBeforeUpdate != null && (h = d.getSnapshotBeforeUpdate(p, x)), N = u != null && u.type === ce && u.key == null ? ca(u.props.children) : u, a = ia(e, dn(N) ? N : [N], t, n, o, r, i, s, a, l, c), d.base = t.__e, t.__u &= -161, d.__h.length && s.push(d), m && (d.__E = d.__ = null);
  } catch (E) {
    if (t.__v = null, l || i != null) if (E.then) {
      for (t.__u |= l ? 160 : 128; a && a.nodeType == 8 && a.nextSibling; ) a = a.nextSibling;
      i[i.indexOf(a)] = null, t.__e = a;
    } else {
      for (k = i.length; k--; ) Hr(i[k]);
      xr(t);
    }
    else t.__e = n.__e, t.__k = n.__k, E.then || xr(t);
    K.__e(E, t, n);
  }
  else i == null && t.__v == n.__v ? (t.__k = n.__k, t.__e = n.__e) : a = t.__e = Gd(n.__e, t, n, o, r, i, s, l, c);
  return (u = K.diffed) && u(t), 128 & t.__u ? void 0 : a;
}
function xr(e) {
  e && (e.__c && (e.__c.__e = !0), e.__k && e.__k.some(xr));
}
function aa(e, t, n) {
  for (var o = 0; o < n.length; o++) Ur(n[o], n[++o], n[++o]);
  K.__c && K.__c(t, e), e.some(function(r) {
    try {
      e = r.__h, r.__h = [], e.some(function(i) {
        i.call(r);
      });
    } catch (i) {
      K.__e(i, r.__v);
    }
  });
}
function ca(e) {
  return typeof e != "object" || e == null || e.__b > 0 ? e : dn(e) ? e.map(ca) : Te({}, e);
}
function Gd(e, t, n, o, r, i, s, a, l) {
  var c, u, d, f, p, x, h, m = n.props || Un, v = t.props, g = t.type;
  if (g == "svg" ? r = "http://www.w3.org/2000/svg" : g == "math" ? r = "http://www.w3.org/1998/Math/MathML" : r || (r = "http://www.w3.org/1999/xhtml"), i != null) {
    for (c = 0; c < i.length; c++) if ((p = i[c]) && "setAttribute" in p == !!g && (g ? p.localName == g : p.nodeType == 3)) {
      e = p, i[c] = null;
      break;
    }
  }
  if (e == null) {
    if (g == null) return document.createTextNode(v);
    e = document.createElementNS(r, g, v.is && v), a && (K.__m && K.__m(t, i), a = !1), i = null;
  }
  if (g == null) m === v || a && e.data == v || (e.data = v);
  else {
    if (i = i && un.call(e.childNodes), !a && i != null) for (m = {}, c = 0; c < e.attributes.length; c++) m[(p = e.attributes[c]).name] = p.value;
    for (c in m) p = m[c], c == "dangerouslySetInnerHTML" ? d = p : c == "children" || c in v || c == "value" && "defaultValue" in v || c == "checked" && "defaultChecked" in v || An(e, c, null, p, r);
    for (c in v) p = v[c], c == "children" ? f = p : c == "dangerouslySetInnerHTML" ? u = p : c == "value" ? x = p : c == "checked" ? h = p : a && typeof p != "function" || m[c] === p || An(e, c, p, m[c], r);
    if (u) a || d && (u.__html == d.__html || u.__html == e.innerHTML) || (e.innerHTML = u.__html), t.__k = [];
    else if (d && (e.innerHTML = ""), ia(t.type == "template" ? e.content : e, dn(f) ? f : [f], t, n, o, g == "foreignObject" ? "http://www.w3.org/1999/xhtml" : r, i, s, i ? i[0] : n.__k && Dt(n, 0), a, l), i != null) for (c = i.length; c--; ) Hr(i[c]);
    a || (c = "value", g == "progress" && x == null ? e.removeAttribute("value") : x != null && (x !== e[c] || g == "progress" && !x || g == "option" && x != m[c]) && An(e, c, x, m[c], r), c = "checked", h != null && h != e[c] && An(e, c, h, m[c], r));
  }
  return e;
}
function Ur(e, t, n) {
  try {
    if (typeof e == "function") {
      var o = typeof e.__u == "function";
      o && e.__u(), o && t == null || (e.__u = e(t));
    } else e.current = t;
  } catch (r) {
    K.__e(r, n);
  }
}
function la(e, t, n) {
  var o, r;
  if (K.unmount && K.unmount(e), (o = e.ref) && (o.current && o.current != e.__e || Ur(o, null, t)), (o = e.__c) != null) {
    if (o.componentWillUnmount) try {
      o.componentWillUnmount();
    } catch (i) {
      K.__e(i, t);
    }
    o.base = o.__P = null;
  }
  if (o = e.__k) for (r = 0; r < o.length; r++) o[r] && la(o[r], t, n || typeof e.type != "function");
  n || Hr(e.__e), e.__c = e.__ = e.__e = void 0;
}
function Yd(e, t, n) {
  return this.constructor(e, n);
}
function ft(e, t, n) {
  var o, r, i, s;
  t == document && (t = document.documentElement), K.__ && K.__(e, t), r = (o = typeof n == "function") ? null : n && n.__k || t.__k, i = [], s = [], Vr(t, e = (!o && n || t).__k = C(ce, null, [e]), r || Un, Un, t.namespaceURI, !o && n ? [n] : r ? null : t.firstChild ? un.call(t.childNodes) : null, i, !o && n ? n : r ? r.__e : t.firstChild, o, s), aa(i, e, s);
}
function ua(e, t) {
  ft(e, t, ua);
}
function Xd(e, t, n) {
  var o, r, i, s, a = Te({}, e.props);
  for (i in e.type && e.type.defaultProps && (s = e.type.defaultProps), t) i == "key" ? o = t[i] : i == "ref" ? r = t[i] : a[i] = t[i] === void 0 && s != null ? s[i] : t[i];
  return arguments.length > 2 && (a.children = arguments.length > 3 ? un.call(arguments, 2) : n), en(e.type, a, o || e.key, r || e.ref, null);
}
function pt(e) {
  function t(n) {
    var o, r;
    return this.getChildContext || (o = /* @__PURE__ */ new Set(), (r = {})[t.__c] = this, this.getChildContext = function() {
      return r;
    }, this.componentWillUnmount = function() {
      o = null;
    }, this.shouldComponentUpdate = function(i) {
      this.props.value != i.value && o.forEach(function(s) {
        s.__e = !0, hr(s);
      });
    }, this.sub = function(i) {
      o.add(i);
      var s = i.componentWillUnmount;
      i.componentWillUnmount = function() {
        o && o.delete(i), s && s.call(i);
      };
    }), n.children;
  }
  return t.__c = "__cC" + na++, t.__ = e, t.Provider = t.__l = (t.Consumer = function(n, o) {
    return n.children(o);
  }).contextType = t, t;
}
un = jn.slice, K = { __e: function(e, t, n, o) {
  for (var r, i, s; t = t.__; ) if ((r = t.__c) && !r.__) try {
    if ((i = r.constructor) && i.getDerivedStateFromError != null && (r.setState(i.getDerivedStateFromError(e)), s = r.__d), r.componentDidCatch != null && (r.componentDidCatch(e, o || {}), s = r.__d), s) return r.__E = r;
  } catch (a) {
    e = a;
  }
  throw e;
} }, Zs = 0, Ee.prototype.setState = function(e, t) {
  var n;
  n = this.__s != null && this.__s != this.state ? this.__s : this.__s = Te({}, this.state), typeof e == "function" && (e = e(Te({}, n), this.props)), e && Te(n, e), e != null && this.__v && (t && this._sb.push(t), hr(this));
}, Ee.prototype.forceUpdate = function(e) {
  this.__v && (this.__e = !0, e && this.__h.push(e), hr(this));
}, Ee.prototype.render = ce, ct = [], Qs = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, ea = function(e, t) {
  return e.__v.__b - t.__v.__b;
}, zn.__r = 0, ta = /(PointerCapture)$|Capture$/i, Wr = 0, fr = ji(!1), pr = ji(!0), na = 0;
var je, ee, Yo, zi, Ot = 0, da = [], oe = K, Ki = oe.__b, Gi = oe.__r, Yi = oe.diffed, Xi = oe.__c, Ji = oe.unmount, qi = oe.__;
function gt(e, t) {
  oe.__h && oe.__h(ee, e, Ot || t), Ot = 0;
  var n = ee.__H || (ee.__H = { __: [], __h: [] });
  return e >= n.__.length && n.__.push({}), n.__[e];
}
function V(e) {
  return Ot = 1, fn(fa, e);
}
function fn(e, t, n) {
  var o = gt(je++, 2);
  if (o.t = e, !o.__c && (o.__ = [n ? n(t) : fa(void 0, t), function(a) {
    var l = o.__N ? o.__N[0] : o.__[0], c = o.t(l, a);
    l !== c && (o.__N = [c, o.__[1]], o.__c.setState({}));
  }], o.__c = ee, !ee.__f)) {
    var r = function(a, l, c) {
      if (!o.__c.__H) return !0;
      var u = o.__c.__H.__.filter(function(f) {
        return f.__c;
      });
      if (u.every(function(f) {
        return !f.__N;
      })) return !i || i.call(this, a, l, c);
      var d = o.__c.props !== a;
      return u.some(function(f) {
        if (f.__N) {
          var p = f.__[0];
          f.__ = f.__N, f.__N = void 0, p !== f.__[0] && (d = !0);
        }
      }), i && i.call(this, a, l, c) || d;
    };
    ee.__f = !0;
    var i = ee.shouldComponentUpdate, s = ee.componentWillUpdate;
    ee.componentWillUpdate = function(a, l, c) {
      if (this.__e) {
        var u = i;
        i = void 0, r(a, l, c), i = u;
      }
      s && s.call(this, a, l, c);
    }, ee.shouldComponentUpdate = r;
  }
  return o.__N || o.__;
}
function W(e, t) {
  var n = gt(je++, 3);
  !oe.__s && Gr(n.__H, t) && (n.__ = e, n.u = t, ee.__H.__h.push(n));
}
function Se(e, t) {
  var n = gt(je++, 4);
  !oe.__s && Gr(n.__H, t) && (n.__ = e, n.u = t, ee.__h.push(n));
}
function M(e) {
  return Ot = 5, ue(function() {
    return { current: e };
  }, []);
}
function jr(e, t, n) {
  Ot = 6, Se(function() {
    if (typeof e == "function") {
      var o = e(t());
      return function() {
        e(null), o && typeof o == "function" && o();
      };
    }
    if (e) return e.current = t(), function() {
      return e.current = null;
    };
  }, n == null ? n : n.concat(e));
}
function ue(e, t) {
  var n = gt(je++, 7);
  return Gr(n.__H, t) && (n.__ = e(), n.__H = t, n.__h = e), n.__;
}
function j(e, t) {
  return Ot = 8, ue(function() {
    return e;
  }, t);
}
function tt(e) {
  var t = ee.context[e.__c], n = gt(je++, 9);
  return n.c = e, t ? (n.__ == null && (n.__ = !0, t.sub(ee)), t.props.value) : e.__;
}
function zr(e, t) {
  oe.useDebugValue && oe.useDebugValue(t ? t(e) : e);
}
function Jd(e) {
  var t = gt(je++, 10), n = V();
  return t.__ = e, ee.componentDidCatch || (ee.componentDidCatch = function(o, r) {
    t.__ && t.__(o, r), n[1](o);
  }), [n[0], function() {
    n[1](void 0);
  }];
}
function Kr() {
  var e = gt(je++, 11);
  if (!e.__) {
    for (var t = ee.__v; t !== null && !t.__m && t.__ !== null; ) t = t.__;
    var n = t.__m || (t.__m = [0, 0]);
    e.__ = "P" + n[0] + "-" + n[1]++;
  }
  return e.__;
}
function qd() {
  for (var e; e = da.shift(); ) {
    var t = e.__H;
    if (e.__P && t) try {
      t.__h.some(Ln), t.__h.some(mr), t.__h = [];
    } catch (n) {
      t.__h = [], oe.__e(n, e.__v);
    }
  }
}
oe.__b = function(e) {
  ee = null, Ki && Ki(e);
}, oe.__ = function(e, t) {
  e && t.__k && t.__k.__m && (e.__m = t.__k.__m), qi && qi(e, t);
}, oe.__r = function(e) {
  Gi && Gi(e), je = 0;
  var t = (ee = e.__c).__H;
  t && (Yo === ee ? (t.__h = [], ee.__h = [], t.__.some(function(n) {
    n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
  })) : (t.__h.some(Ln), t.__h.some(mr), t.__h = [], je = 0)), Yo = ee;
}, oe.diffed = function(e) {
  Yi && Yi(e);
  var t = e.__c;
  t && t.__H && (t.__H.__h.length && (da.push(t) !== 1 && zi === oe.requestAnimationFrame || ((zi = oe.requestAnimationFrame) || Zd)(qd)), t.__H.__.some(function(n) {
    n.u && (n.__H = n.u), n.u = void 0;
  })), Yo = ee = null;
}, oe.__c = function(e, t) {
  t.some(function(n) {
    try {
      n.__h.some(Ln), n.__h = n.__h.filter(function(o) {
        return !o.__ || mr(o);
      });
    } catch (o) {
      t.some(function(r) {
        r.__h && (r.__h = []);
      }), t = [], oe.__e(o, n.__v);
    }
  }), Xi && Xi(e, t);
}, oe.unmount = function(e) {
  Ji && Ji(e);
  var t, n = e.__c;
  n && n.__H && (n.__H.__.some(function(o) {
    try {
      Ln(o);
    } catch (r) {
      t = r;
    }
  }), n.__H = void 0, t && oe.__e(t, n.__v));
};
var Zi = typeof requestAnimationFrame == "function";
function Zd(e) {
  var t, n = function() {
    clearTimeout(o), Zi && cancelAnimationFrame(t), setTimeout(e);
  }, o = setTimeout(n, 35);
  Zi && (t = requestAnimationFrame(n));
}
function Ln(e) {
  var t = ee, n = e.__c;
  typeof n == "function" && (e.__c = void 0, n()), ee = t;
}
function mr(e) {
  var t = ee;
  e.__c = e.__(), ee = t;
}
function Gr(e, t) {
  return !e || e.length !== t.length || t.some(function(n, o) {
    return n !== e[o];
  });
}
function fa(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function pa(e, t) {
  for (var n in t) e[n] = t[n];
  return e;
}
function vr(e, t) {
  for (var n in e) if (n !== "__source" && !(n in t)) return !0;
  for (var o in t) if (o !== "__source" && e[o] !== t[o]) return !0;
  return !1;
}
function Yr(e, t) {
  var n = t(), o = V({ t: { __: n, u: t } }), r = o[0].t, i = o[1];
  return Se(function() {
    r.__ = n, r.u = t, Xo(r) && i({ t: r });
  }, [e, n, t]), W(function() {
    return Xo(r) && i({ t: r }), e(function() {
      Xo(r) && i({ t: r });
    });
  }, [e]), n;
}
function Xo(e) {
  try {
    return !((t = e.__) === (n = e.u()) && (t !== 0 || 1 / t == 1 / n) || t != t && n != n);
  } catch {
    return !0;
  }
  var t, n;
}
function Xr(e) {
  e();
}
function Jr(e) {
  return e;
}
function qr() {
  return [!1, Xr];
}
var Zr = Se;
function Kn(e, t) {
  this.props = e, this.context = t;
}
function ha(e, t) {
  function n(r) {
    var i = this.props.ref, s = i == r.ref;
    return !s && i && (i.call ? i(null) : i.current = null), t ? !t(this.props, r) || !s : vr(this.props, r);
  }
  function o(r) {
    return this.shouldComponentUpdate = n, C(e, r);
  }
  return o.displayName = "Memo(" + (e.displayName || e.name) + ")", o.prototype.isReactComponent = !0, o.__f = !0, o.type = e, o;
}
(Kn.prototype = new Ee()).isPureReactComponent = !0, Kn.prototype.shouldComponentUpdate = function(e, t) {
  return vr(this.props, e) || vr(this.state, t);
};
var Qi = K.__b;
K.__b = function(e) {
  e.type && e.type.__f && e.ref && (e.props.ref = e.ref, e.ref = null), Qi && Qi(e);
};
var Qd = typeof Symbol < "u" && Symbol.for && /* @__PURE__ */ Symbol.for("react.forward_ref") || 3911;
function F(e) {
  function t(n) {
    var o = pa({}, n);
    return delete o.ref, e(o, n.ref || null);
  }
  return t.$$typeof = Qd, t.render = e, t.prototype.isReactComponent = t.__f = !0, t.displayName = "ForwardRef(" + (e.displayName || e.name) + ")", t;
}
var es = function(e, t) {
  return e == null ? null : Ve(Ve(e).map(t));
}, Ue = { map: es, forEach: es, count: function(e) {
  return e ? Ve(e).length : 0;
}, only: function(e) {
  var t = Ve(e);
  if (t.length !== 1) throw "Children.only";
  return t[0];
}, toArray: Ve }, ef = K.__e;
K.__e = function(e, t, n, o) {
  if (e.then) {
    for (var r, i = t; i = i.__; ) if ((r = i.__c) && r.__c) return t.__e == null && (t.__e = n.__e, t.__k = n.__k), r.__c(e, t);
  }
  ef(e, t, n, o);
};
var ts = K.unmount;
function xa(e, t, n) {
  return e && (e.__c && e.__c.__H && (e.__c.__H.__.forEach(function(o) {
    typeof o.__c == "function" && o.__c();
  }), e.__c.__H = null), (e = pa({}, e)).__c != null && (e.__c.__P === n && (e.__c.__P = t), e.__c.__e = !0, e.__c = null), e.__k = e.__k && e.__k.map(function(o) {
    return xa(o, t, n);
  })), e;
}
function ma(e, t, n) {
  return e && n && (e.__v = null, e.__k = e.__k && e.__k.map(function(o) {
    return ma(o, t, n);
  }), e.__c && e.__c.__P === t && (e.__e && n.appendChild(e.__e), e.__c.__e = !0, e.__c.__P = n)), e;
}
function tn() {
  this.__u = 0, this.o = null, this.__b = null;
}
function va(e) {
  if (!e.__) return null;
  var t = e.__.__c;
  return t && t.__a && t.__a(e);
}
function ga(e) {
  var t, n, o, r = null;
  function i(s) {
    if (t || (t = e()).then(function(a) {
      a && (r = a.default || a), o = !0;
    }, function(a) {
      n = a, o = !0;
    }), n) throw n;
    if (!o) throw t;
    return r ? C(r, s) : null;
  }
  return i.displayName = "Lazy", i.__f = !0, i;
}
function Mt() {
  this.i = null, this.l = null;
}
K.unmount = function(e) {
  var t = e.__c;
  t && (t.__z = !0), t && t.__R && t.__R(), t && 32 & e.__u && (e.type = null), ts && ts(e);
}, (tn.prototype = new Ee()).__c = function(e, t) {
  var n = t.__c, o = this;
  o.o == null && (o.o = []), o.o.push(n);
  var r = va(o.__v), i = !1, s = function() {
    i || o.__z || (i = !0, n.__R = null, r ? r(l) : l());
  };
  n.__R = s;
  var a = n.__P;
  n.__P = null;
  var l = function() {
    if (!--o.__u) {
      if (o.state.__a) {
        var c = o.state.__a;
        o.__v.__k[0] = ma(c, c.__c.__P, c.__c.__O);
      }
      var u;
      for (o.setState({ __a: o.__b = null }); u = o.o.pop(); ) u.__P = a, u.forceUpdate();
    }
  };
  o.__u++ || 32 & t.__u || o.setState({ __a: o.__b = o.__v.__k[0] }), e.then(s, s);
}, tn.prototype.componentWillUnmount = function() {
  this.o = [];
}, tn.prototype.render = function(e, t) {
  if (this.__b) {
    if (this.__v.__k) {
      var n = document.createElement("div"), o = this.__v.__k[0].__c;
      this.__v.__k[0] = xa(this.__b, n, o.__O = o.__P);
    }
    this.__b = null;
  }
  var r = t.__a && C(ce, null, e.fallback);
  return r && (r.__u &= -33), [C(ce, null, t.__a ? null : e.children), r];
};
var ns = function(e, t, n) {
  if (++n[1] === n[0] && e.l.delete(t), e.props.revealOrder && (e.props.revealOrder[0] !== "t" || !e.l.size)) for (n = e.i; n; ) {
    for (; n.length > 3; ) n.pop()();
    if (n[1] < n[0]) break;
    e.i = n = n[2];
  }
};
function tf(e) {
  return this.getChildContext = function() {
    return e.context;
  }, e.children;
}
function nf(e) {
  var t = this, n = e.h;
  if (t.componentWillUnmount = function() {
    ft(null, t.v), t.v = null, t.h = null;
  }, t.h && t.h !== n && t.componentWillUnmount(), !t.v) {
    for (var o = t.__v; o !== null && !o.__m && o.__ !== null; ) o = o.__;
    t.h = n, t.v = { nodeType: 1, parentNode: n, childNodes: [], __k: { __m: o.__m }, contains: function() {
      return !0;
    }, namespaceURI: n.namespaceURI, insertBefore: function(r, i) {
      this.childNodes.push(r), t.h.insertBefore(r, i);
    }, removeChild: function(r) {
      this.childNodes.splice(this.childNodes.indexOf(r) >>> 1, 1), t.h.removeChild(r);
    } };
  }
  ft(C(tf, { context: t.context }, e.__v), t.v);
}
function bt(e, t) {
  var n = C(nf, { __v: e, h: t });
  return n.containerInfo = t, n;
}
(Mt.prototype = new Ee()).__a = function(e) {
  var t = this, n = va(t.__v), o = t.l.get(e);
  return o[0]++, function(r) {
    var i = function() {
      t.props.revealOrder ? (o.push(r), ns(t, e, o)) : r();
    };
    n ? n(i) : i();
  };
}, Mt.prototype.render = function(e) {
  this.i = null, this.l = /* @__PURE__ */ new Map();
  var t = Ve(e.children);
  e.revealOrder && e.revealOrder[0] === "b" && t.reverse();
  for (var n = t.length; n--; ) this.l.set(t[n], this.i = [1, 0, this.i]);
  return e.children;
}, Mt.prototype.componentDidUpdate = Mt.prototype.componentDidMount = function() {
  var e = this;
  this.l.forEach(function(t, n) {
    ns(e, n, t);
  });
};
var ba = typeof Symbol < "u" && Symbol.for && /* @__PURE__ */ Symbol.for("react.element") || 60103, of = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/, rf = /^on(Ani|Tra|Tou|BeforeInp|Compo)/, sf = /[A-Z0-9]/g, af = typeof document < "u", cf = function(e) {
  return (typeof Symbol < "u" && typeof /* @__PURE__ */ Symbol() == "symbol" ? /fil|che|rad/ : /fil|che|ra/).test(e);
};
function wa(e, t, n) {
  return t.__k == null && (t.textContent = ""), ft(e, t), typeof n == "function" && n(), e ? e.__c : null;
}
function ya(e, t, n) {
  return ua(e, t), typeof n == "function" && n(), e ? e.__c : null;
}
Ee.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(e) {
  Object.defineProperty(Ee.prototype, e, { configurable: !0, get: function() {
    return this["UNSAFE_" + e];
  }, set: function(t) {
    Object.defineProperty(this, e, { configurable: !0, writable: !0, value: t });
  } });
});
var os = K.event;
function lf() {
}
function uf() {
  return this.cancelBubble;
}
function df() {
  return this.defaultPrevented;
}
K.event = function(e) {
  return os && (e = os(e)), e.persist = lf, e.isPropagationStopped = uf, e.isDefaultPrevented = df, e.nativeEvent = e;
};
var Qr, ff = { enumerable: !1, configurable: !0, get: function() {
  return this.class;
} }, rs = K.vnode;
K.vnode = function(e) {
  typeof e.type == "string" && (function(t) {
    var n = t.props, o = t.type, r = {}, i = o.indexOf("-") === -1;
    for (var s in n) {
      var a = n[s];
      if (!(s === "value" && "defaultValue" in n && a == null || af && s === "children" && o === "noscript" || s === "class" || s === "className")) {
        var l = s.toLowerCase();
        s === "defaultValue" && "value" in n && n.value == null ? s = "value" : s === "download" && a === !0 ? a = "" : l === "translate" && a === "no" ? a = !1 : l[0] === "o" && l[1] === "n" ? l === "ondoubleclick" ? s = "ondblclick" : l !== "onchange" || o !== "input" && o !== "textarea" || cf(n.type) ? l === "onfocus" ? s = "onfocusin" : l === "onblur" ? s = "onfocusout" : rf.test(s) && (s = l) : l = s = "oninput" : i && of.test(s) ? s = s.replace(sf, "-$&").toLowerCase() : a === null && (a = void 0), l === "oninput" && r[s = l] && (s = "oninputCapture"), r[s] = a;
      }
    }
    o == "select" && r.multiple && Array.isArray(r.value) && (r.value = Ve(n.children).forEach(function(c) {
      c.props.selected = r.value.indexOf(c.props.value) != -1;
    })), o == "select" && r.defaultValue != null && (r.value = Ve(n.children).forEach(function(c) {
      c.props.selected = r.multiple ? r.defaultValue.indexOf(c.props.value) != -1 : r.defaultValue == c.props.value;
    })), n.class && !n.className ? (r.class = n.class, Object.defineProperty(r, "className", ff)) : n.className && (r.class = r.className = n.className), t.props = r;
  })(e), e.$$typeof = ba, rs && rs(e);
};
var is = K.__r;
K.__r = function(e) {
  is && is(e), Qr = e.__c;
};
var ss = K.diffed;
K.diffed = function(e) {
  ss && ss(e);
  var t = e.props, n = e.__e;
  n != null && e.type === "textarea" && "value" in t && t.value !== n.value && (n.value = t.value == null ? "" : t.value), Qr = null;
};
var Ca = { ReactCurrentDispatcher: { current: { readContext: function(e) {
  return Qr.__n[e.__c].props.value;
}, useCallback: j, useContext: tt, useDebugValue: zr, useDeferredValue: Jr, useEffect: W, useId: Kr, useImperativeHandle: jr, useInsertionEffect: Zr, useLayoutEffect: Se, useMemo: ue, useReducer: fn, useRef: M, useState: V, useSyncExternalStore: Yr, useTransition: qr } } }, pf = "18.3.1";
function _a(e) {
  return C.bind(null, e);
}
function ze(e) {
  return !!e && e.$$typeof === ba;
}
function Sa(e) {
  return ze(e) && e.type === ce;
}
function Na(e) {
  return !!e && typeof e.displayName == "string" && e.displayName.startsWith("Memo(");
}
function $t(e) {
  return ze(e) ? Xd.apply(null, arguments) : e;
}
function Ea(e) {
  return !!e.__k && (ft(null, e), !0);
}
function Aa(e) {
  return e && (e.base || e.nodeType === 1 && e) || null;
}
var Fa = function(e, t) {
  return e(t);
}, ao = function(e, t) {
  return e(t);
}, Ma = ce, ka = ze, ie = { useState: V, useId: Kr, useReducer: fn, useEffect: W, useLayoutEffect: Se, useInsertionEffect: Zr, useTransition: qr, useDeferredValue: Jr, useSyncExternalStore: Yr, startTransition: Xr, useRef: M, useImperativeHandle: jr, useMemo: ue, useCallback: j, useContext: tt, useDebugValue: zr, version: "18.3.1", Children: Ue, render: wa, hydrate: ya, unmountComponentAtNode: Ea, createPortal: bt, createElement: C, createContext: pt, createFactory: _a, cloneElement: $t, createRef: oa, Fragment: ce, isValidElement: ze, isElement: ka, isFragment: Sa, isMemo: Na, findDOMNode: Aa, Component: Ee, PureComponent: Kn, memo: ha, forwardRef: F, flushSync: ao, unstable_batchedUpdates: Fa, StrictMode: Ma, Suspense: tn, SuspenseList: Mt, lazy: ga, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: Ca };
const Pa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Children: Ue,
  Component: Ee,
  Fragment: ce,
  PureComponent: Kn,
  StrictMode: Ma,
  Suspense: tn,
  SuspenseList: Mt,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: Ca,
  cloneElement: $t,
  createContext: pt,
  createElement: C,
  createFactory: _a,
  createPortal: bt,
  createRef: oa,
  default: ie,
  findDOMNode: Aa,
  flushSync: ao,
  forwardRef: F,
  hydrate: ya,
  isElement: ka,
  isFragment: Sa,
  isMemo: Na,
  isValidElement: ze,
  lazy: ga,
  memo: ha,
  render: wa,
  startTransition: Xr,
  unmountComponentAtNode: Ea,
  unstable_batchedUpdates: Fa,
  useCallback: j,
  useContext: tt,
  useDebugValue: zr,
  useDeferredValue: Jr,
  useEffect: W,
  useErrorBoundary: Jd,
  useId: Kr,
  useImperativeHandle: jr,
  useInsertionEffect: Zr,
  useLayoutEffect: Se,
  useMemo: ue,
  useReducer: fn,
  useRef: M,
  useState: V,
  useSyncExternalStore: Yr,
  useTransition: qr,
  version: pf
}, Symbol.toStringTag, { value: "Module" }));
let Da = null;
function hf(e, t, n) {
  Da = n;
}
function J(e, t) {
  Da?.onEvent?.(e, t);
}
function xf(e, t) {
  let n;
  return ((...o) => {
    clearTimeout(n), n = setTimeout(() => e(...o), t);
  });
}
function mf(e, t) {
  let n = 0;
  return ((...o) => {
    const r = Date.now();
    r - n >= t && (n = r, e(...o));
  });
}
function vf(e, t) {
  const n = t.modifiers?.includes("once");
  let o = !1, r = (i) => {
    if (!(n && o) && !(t.keyFilter && i instanceof KeyboardEvent && i.key !== t.keyFilter)) {
      if (t.modifiers)
        for (const s of t.modifiers)
          s === "prevent" && i.preventDefault(), s === "stop" && i.stopPropagation();
      e(i), n && (o = !0);
    }
  };
  if (t.modifiers)
    for (const i of t.modifiers) {
      if (i.startsWith("debounce:")) {
        const s = parseInt(i.split(":")[1], 10);
        r = xf(r, s);
      }
      if (i.startsWith("throttle:")) {
        const s = parseInt(i.split(":")[1], 10);
        r = mf(r, s);
      }
    }
  return r;
}
function Rw(e) {
  const t = (n) => {
    const r = n.target.tagName;
    r === "INPUT" || r === "TEXTAREA" || r === "SELECT" || e.onEvent && ((n.key === "ArrowUp" || n.key === "ArrowDown" || n.key === "ArrowLeft" || n.key === "ArrowRight" || n.key === " " || n.key === "PageUp" || n.key === "PageDown") && n.preventDefault(), J(-2, JSON.stringify({ key: n.key })));
  };
  return document.addEventListener("keydown", t, { capture: !0 }), () => document.removeEventListener("keydown", t, { capture: !0 });
}
function gf(e) {
  const t = { Type: e.type }, n = e.target;
  n && ("value" in n && n.value !== void 0 && (t.Value = String(n.value)), "checked" in n && typeof n.checked == "boolean" && (t.Checked = n.checked)), e instanceof KeyboardEvent && (t.Key = e.key), e instanceof MouseEvent && (t.ClientX = e.clientX, t.ClientY = e.clientY), "detail" in e && typeof e.detail == "number" && (t.Detail = e.detail);
  const r = e.currentTarget || n;
  return e.type === "scroll" && r && ("scrollTop" in r && (t.ScrollTop = r.scrollTop), "scrollHeight" in r && (t.ScrollHeight = r.scrollHeight), "clientHeight" in r && (t.ClientHeight = r.clientHeight)), JSON.stringify(t);
}
function ei(e) {
  const t = {};
  if (e.onClick != null) {
    const n = e.onClick;
    t.onClick = (o) => {
      o.stopPropagation(), J(n, "{}");
    };
  }
  if (e.onChange != null) {
    const n = e.onChange;
    t.onInput = (o) => {
      const r = o.target;
      J(n, JSON.stringify({ Value: r.value ?? "" }));
    }, t.onChange = (o) => {
      const r = o.target;
      r.tagName === "SELECT" && J(n, JSON.stringify({ Value: r.value ?? "" }));
    };
  }
  if (e.onSubmit != null) {
    const n = e.onSubmit;
    t.onSubmit = (o) => {
      o.preventDefault(), J(n, "{}");
    };
  }
  if (e.onClose != null && (t["data-vo-close"] = e.onClose), e.onFiles != null) {
    const n = e.onFiles, o = t.onChange;
    t.onChange = (r) => {
      const i = r.target;
      if (i.type === "file" && i.files) {
        const s = [];
        for (let a = 0; a < i.files.length; a++) {
          const l = i.files[a];
          s.push({ Name: l.name, Size: l.size, Type: l.type, Data: "" });
        }
        J(n, JSON.stringify({ Files: s }));
        return;
      }
      o && o(r);
    };
  }
  if (e.onSelect != null && (t["data-vo-select"] = e.onSelect), e.onScrollState != null) {
    const n = e.onScrollState;
    t.onScroll = (o) => {
      const r = o.currentTarget, i = r.scrollTop, s = r.scrollHeight, a = r.clientHeight, l = Math.max(0, s - a), c = Math.max(0, l - i);
      J(n, JSON.stringify({
        ScrollTop: i,
        ScrollHeight: s,
        ClientHeight: a,
        AtBottom: c <= 1,
        BottomGap: c
      }));
    };
  }
  if (e.events && typeof e.events == "object") {
    const n = e.events;
    for (const [o, r] of Object.entries(n))
      if (r && typeof r == "object" && "iD" in r) {
        const i = r, s = "on" + o.charAt(0).toUpperCase() + o.slice(1), a = (l) => {
          J(i.iD, gf(l));
        };
        t[s] = vf(a, i);
      }
  }
  return t;
}
const bf = {
  width: "width",
  height: "height",
  minWidth: "min-width",
  maxWidth: "max-width",
  minHeight: "min-height",
  maxHeight: "max-height",
  padding: "padding",
  paddingTop: "padding-top",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
  paddingRight: "padding-right",
  margin: "margin",
  marginTop: "margin-top",
  marginBottom: "margin-bottom",
  marginLeft: "margin-left",
  marginRight: "margin-right",
  gap: "gap",
  background: "background",
  color: "color",
  fontSize: "font-size",
  fontWeight: "font-weight",
  fontFamily: "font-family",
  borderRadius: "border-radius",
  border: "border",
  boxShadow: "box-shadow",
  opacity: "opacity",
  overflow: "overflow",
  cursor: "cursor",
  flex: "flex",
  display: "display",
  position: "position",
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  zIndex: "z-index",
  textAlign: "text-align",
  textDecoration: "text-decoration",
  letterSpacing: "letter-spacing",
  lineHeight: "line-height",
  whiteSpace: "white-space",
  wordBreak: "word-break",
  objectFit: "object-fit",
  transition: "transition",
  transform: "transform",
  animation: "animation",
  gridTemplateColumns: "grid-template-columns",
  gridColumn: "grid-column",
  gridRow: "grid-row",
  alignItems: "align-items",
  alignSelf: "align-self",
  justifyContent: "justify-content",
  justifySelf: "justify-self",
  flexDirection: "flex-direction",
  flexWrap: "flex-wrap",
  flexGrow: "flex-grow",
  flexShrink: "flex-shrink",
  fontStyle: "font-style",
  maxLines: "-webkit-line-clamp"
}, wf = /* @__PURE__ */ new Set([
  "flex",
  "flex-grow",
  "flex-shrink",
  "opacity",
  "z-index",
  "order",
  "line-height",
  "font-weight",
  "orphans",
  "widows",
  "columns",
  "column-count",
  "tab-size",
  "counter-increment",
  "counter-reset",
  "-webkit-line-clamp"
]);
function yf(e, t) {
  return typeof e == "number" ? t && wf.has(t) ? String(e) : `${e}px` : String(e);
}
function Cf(e) {
  switch (e) {
    // Standard HTML
    case "div":
      return "div";
    case "span":
      return "span";
    case "button":
      return "button";
    case "input":
      return "input";
    case "textarea":
      return "textarea";
    case "select":
      return "select";
    case "form":
      return "form";
    case "a":
      return "a";
    case "img":
      return "img";
    case "video":
      return "video";
    case "h1":
      return "h1";
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    case "h4":
      return "h4";
    case "h5":
      return "h5";
    case "h6":
      return "h6";
    case "p":
      return "p";
    case "code":
      return "code";
    case "pre":
      return "pre";
    case "strong":
      return "strong";
    case "em":
      return "em";
    case "ul":
      return "ul";
    case "ol":
      return "ol";
    case "li":
      return "li";
    case "table":
      return "table";
    case "thead":
      return "thead";
    case "tbody":
      return "tbody";
    case "tr":
      return "tr";
    case "td":
      return "td";
    case "th":
      return "th";
    case "nav":
      return "nav";
    case "hr":
      return "hr";
    // VoGUI layout
    case "vo-text":
      return "span";
    case "vo-row":
      return "div";
    case "vo-column":
      return "div";
    case "vo-center":
      return "div";
    case "vo-stack":
      return "div";
    case "vo-grid":
      return "div";
    case "vo-spacer":
      return "div";
    case "vo-divider":
      return "hr";
    case "vo-scroll":
      return "div";
    case "vo-wrap":
      return "div";
    // VoGUI display
    case "vo-badge":
      return "span";
    case "vo-tag":
      return "span";
    case "vo-progress":
      return "div";
    case "vo-spinner":
      return "div";
    case "vo-alert":
      return "div";
    case "vo-avatar":
      return "div";
    case "vo-icon":
      return "span";
    case "vo-card":
      return "div";
    case "vo-card-header":
      return "div";
    case "vo-card-body":
      return "div";
    case "vo-card-footer":
      return "div";
    case "vo-panel":
      return "div";
    // VoGUI form
    case "vo-form-field":
      return "div";
    case "vo-form-error":
      return "div";
    case "vo-form-help":
      return "div";
    case "vo-form-section":
      return "div";
    // VoGUI nav
    case "vo-nav-item":
      return "a";
    case "vo-nav-link":
      return "a";
    case "vo-nav-divider":
      return "hr";
    case "vo-nav-group":
      return "div";
    case "vo-sidebar":
      return "aside";
    case "vo-sidebar-item":
      return "a";
    case "vo-sidebar-section":
      return "div";
    // VoGUI dialog / overlay sub-parts
    case "vo-dialog-title":
      return "h2";
    case "vo-dialog-content":
      return "div";
    case "vo-dialog-actions":
      return "div";
    // VoGUI menu sub-parts (used inside dropdown/context menus)
    case "vo-menu-item":
      return "div";
    case "vo-menu-divider":
      return "hr";
    // VoGUI combobox sub-parts
    case "vo-combobox-option":
      return "div";
    default:
      return "div";
  }
}
function _f(e) {
  switch (e) {
    // Layout
    case "vo-row":
      return "flex flex-row";
    case "vo-column":
      return "flex flex-col";
    case "vo-center":
      return "flex items-center justify-center";
    case "vo-stack":
      return "relative";
    case "vo-grid":
      return "grid";
    case "vo-spacer":
      return "flex-1";
    case "vo-divider":
      return "border-t border-border my-2";
    case "vo-scroll":
      return "overflow-auto";
    case "vo-wrap":
      return "flex flex-wrap";
    // Display
    case "vo-badge":
      return "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium";
    case "vo-tag":
      return "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground";
    case "vo-spinner":
      return "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent";
    case "vo-alert":
      return "relative w-full rounded-lg border p-4";
    case "vo-avatar":
      return "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full";
    case "vo-icon":
      return "inline-flex items-center justify-center";
    case "vo-card":
      return "rounded-lg border border-border bg-card text-card-foreground shadow-sm";
    case "vo-card-header":
      return "flex flex-col gap-1.5 p-6 pb-4";
    case "vo-card-body":
      return "px-6 pb-4";
    case "vo-card-footer":
      return "flex items-center px-6 py-4 border-t border-border";
    case "vo-panel":
      return "rounded-lg border border-border bg-surface p-4";
    // Form
    case "vo-form-field":
      return "flex flex-col gap-1.5";
    case "vo-form-error":
      return "text-sm text-danger";
    case "vo-form-help":
      return "text-sm text-muted-foreground";
    case "vo-form-section":
      return "flex flex-col gap-4";
    // Nav
    case "vo-nav-item":
      return "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground";
    case "vo-nav-link":
      return "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer";
    case "vo-nav-divider":
      return "border-t border-border my-1";
    case "vo-nav-group":
      return "flex flex-col gap-1";
    case "vo-sidebar":
      return "flex flex-col w-64 border-r border-border bg-surface h-full";
    case "vo-sidebar-item":
      return "flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer";
    case "vo-sidebar-section":
      return "flex flex-col gap-0.5 px-2 py-2";
    // Dialog / overlay sub-parts
    case "vo-dialog-title":
      return "text-lg font-semibold leading-none tracking-tight";
    case "vo-dialog-content":
      return "mt-2 text-sm text-muted-foreground";
    case "vo-dialog-actions":
      return "mt-4 flex justify-end gap-2";
    // Menu sub-parts
    case "vo-menu-item":
      return "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground";
    case "vo-menu-divider":
      return "my-1 h-px bg-border";
    // Combobox option
    case "vo-combobox-option":
      return "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent";
    default:
      return "";
  }
}
function Sf(e, t, n) {
  if (e === "vo-alert")
    switch (t) {
      case "success":
        return "border-success/50 text-success bg-success/10";
      case "warning":
        return "border-warning/50 text-warning bg-warning/10";
      case "danger":
      case "error":
        return "border-danger/50 text-danger bg-danger/10";
      case "info":
        return "border-info/50 text-info bg-info/10";
      default:
        return "border-border text-foreground";
    }
  if (e === "vo-badge")
    switch (t) {
      case "primary":
        return "border-transparent bg-primary text-primary-foreground";
      case "secondary":
        return "border-transparent bg-secondary text-secondary-foreground";
      case "success":
        return "border-transparent bg-success text-success-foreground";
      case "warning":
        return "border-transparent bg-warning text-warning-foreground";
      case "danger":
      case "destructive":
      case "error":
        return "border-transparent bg-danger text-danger-foreground";
      case "info":
        return "border-transparent bg-info text-info-foreground";
      case "outline":
        return "text-foreground border-border";
      default:
        return "border-transparent bg-muted text-muted-foreground";
    }
  return e === "vo-sidebar-item" && t === "active" ? "bg-accent text-accent-foreground font-medium" : e === "vo-nav-item" && t === "active" ? "bg-accent text-accent-foreground" : "";
}
function se(e) {
  const t = e.style;
  if (!t || typeof t != "object") return;
  const n = {};
  for (const [o, r] of Object.entries(t)) {
    const i = bf[o] || o;
    n[Nf(i)] = yf(r, i);
  }
  return n;
}
function Nf(e) {
  return e.includes("-") ? e.replace(/-([a-z])/g, (t, n) => n.toUpperCase()) : e;
}
const Ef = -6, on = /* @__PURE__ */ new Map();
function Bw(e) {
  return on.get(e);
}
function pn(e) {
  return (t) => {
    t ? on.set(e, t) : on.delete(e);
  };
}
function Af(e) {
  const t = on.get(e.ref);
  if (t)
    switch (e.cmd) {
      case "focus":
        t.focus();
        break;
      case "blur":
        t.blur();
        break;
      case "scrollTo":
        t.scrollTop = e.top ?? 0;
        break;
      case "scrollToSmooth":
        t.scrollTo({ top: e.top ?? 0, behavior: "smooth" });
        break;
      case "scrollToBottom":
        t.scrollTop = Math.max(0, t.scrollHeight - t.clientHeight);
        break;
      case "scrollToBottomSmooth":
        t.scrollTo({ top: Math.max(0, t.scrollHeight - t.clientHeight), behavior: "smooth" });
        break;
      case "scrollIntoView":
        t.scrollIntoView();
        break;
      case "scrollIntoViewSmooth":
        t.scrollIntoView({ behavior: "smooth" });
        break;
      case "selectText":
        (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) && t.select();
        break;
      case "measure": {
        const n = t.getBoundingClientRect();
        e.measureId != null && J(Ef, JSON.stringify({
          ID: e.measureId,
          Rect: {
            X: n.x,
            Y: n.y,
            Width: n.width,
            Height: n.height,
            Top: n.top,
            Right: n.right,
            Bottom: n.bottom,
            Left: n.left
          }
        }));
        break;
      }
      default: {
        const n = e.cmd;
        throw new Error(`unsupported ref action: ${String(n)}`);
      }
    }
}
const Ff = '*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:var(--vo-font-family, system-ui, -apple-system, sans-serif);font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.\\!container{width:100%!important}.container{width:100%}@media(min-width:640px){.\\!container{max-width:640px!important}.container{max-width:640px}}@media(min-width:768px){.\\!container{max-width:768px!important}.container{max-width:768px}}@media(min-width:1024px){.\\!container{max-width:1024px!important}.container{max-width:1024px}}@media(min-width:1280px){.\\!container{max-width:1280px!important}.container{max-width:1280px}}@media(min-width:1536px){.\\!container{max-width:1536px!important}.container{max-width:1536px}}.pointer-events-none{pointer-events:none}.visible{visibility:visible}.static{position:static}.absolute{position:absolute}.relative{position:relative}.inset-x-0{left:0;right:0}.inset-y-0{top:0;bottom:0}.bottom-0{bottom:0}.left-0{left:0}.right-0{right:0}.right-2{right:.5rem}.right-4{right:1rem}.top-0{top:0}.top-4{top:1rem}.z-50{z-index:50}.-mx-1{margin-left:-.25rem;margin-right:-.25rem}.my-1{margin-top:.25rem;margin-bottom:.25rem}.my-2{margin-top:.5rem;margin-bottom:.5rem}.ml-2{margin-left:.5rem}.mr-1\\.5{margin-right:.375rem}.mr-2{margin-right:.5rem}.mt-1{margin-top:.25rem}.mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.block{display:block}.inline-block{display:inline-block}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.contents{display:contents}.hidden{display:none}.aspect-square{aspect-ratio:1 / 1}.h-1\\.5{height:.375rem}.h-10{height:2.5rem}.h-12{height:3rem}.h-2{height:.5rem}.h-3\\.5{height:.875rem}.h-4{height:1rem}.h-5{height:1.25rem}.h-7{height:1.75rem}.h-8{height:2rem}.h-9{height:2.25rem}.h-full{height:100%}.h-px{height:1px}.max-h-60{max-height:15rem}.max-h-96{max-height:24rem}.max-h-\\[85\\%\\]{max-height:85%}.min-h-0{min-height:0px}.min-h-\\[60px\\]{min-height:60px}.w-10{width:2.5rem}.w-3{width:.75rem}.w-3\\.5{width:.875rem}.w-3\\/4{width:75%}.w-4{width:1rem}.w-5{width:1.25rem}.w-64{width:16rem}.w-72{width:18rem}.w-8{width:2rem}.w-9{width:2.25rem}.w-full{width:100%}.min-w-\\[2rem\\]{min-width:2rem}.min-w-\\[8rem\\]{min-width:8rem}.max-w-lg{max-width:32rem}.max-w-sm{max-width:24rem}.flex-1{flex:1 1 0%}.flex-shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.flex-grow,.grow{flex-grow:1}.transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.animate-fade-in{animation:fade-in .2s ease-out}@keyframes scale-in{0%{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}.animate-scale-in{animation:scale-in .2s ease-out}@keyframes slide-in-from-bottom{0%{transform:translateY(100%)}to{transform:translateY(0)}}.animate-slide-in-from-bottom{animation:slide-in-from-bottom .2s ease-out}@keyframes slide-in-from-left{0%{transform:translate(-100%)}to{transform:translate(0)}}.animate-slide-in-from-left{animation:slide-in-from-left .2s ease-out}@keyframes slide-in-from-right{0%{transform:translate(100%)}to{transform:translate(0)}}.animate-slide-in-from-right{animation:slide-in-from-right .2s ease-out}@keyframes slide-in-from-top{0%{transform:translateY(-100%)}to{transform:translateY(0)}}.animate-slide-in-from-top{animation:slide-in-from-top .2s ease-out}@keyframes spin{to{transform:rotate(360deg)}0%{transform:rotate(0)}}.animate-spin{animation:spin 1s linear infinite}.cursor-default{cursor:default}.cursor-not-allowed{cursor:not-allowed}.cursor-pointer{cursor:pointer}.touch-none{touch-action:none}.select-none{-webkit-user-select:none;-moz-user-select:none;user-select:none}.resize{resize:both}.flex-row{flex-direction:row}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-start{align-items:flex-start}.items-center{align-items:center}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-0\\.5{gap:.125rem}.gap-1{gap:.25rem}.gap-1\\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-4{gap:1rem}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.whitespace-nowrap{white-space:nowrap}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:var(--vo-radius-lg, 8px)}.rounded-md{border-radius:var(--vo-radius, 6px)}.rounded-sm{border-radius:var(--vo-radius-sm, 4px)}.border{border-width:1px}.border-2{border-width:2px}.border-b{border-bottom-width:1px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-border{border-color:var(--vo-border, #e2e8f0)}.border-current{border-color:currentColor}.border-input{border-color:var(--vo-input-border, #e2e8f0)}.border-muted{border-color:var(--vo-muted, #f1f5f9)}.border-primary{border-color:var(--vo-primary, #3b82f6)}.border-transparent{border-color:transparent}.border-t-transparent{border-top-color:transparent}.bg-accent{background-color:var(--vo-accent, #f1f5f9)}.bg-background{background-color:var(--vo-background, #ffffff)}.bg-border{background-color:var(--vo-border, #e2e8f0)}.bg-card{background-color:var(--vo-card, #ffffff)}.bg-danger{background-color:var(--vo-danger, #ef4444)}.bg-foreground{background-color:var(--vo-text, #0f172a)}.bg-info{background-color:var(--vo-info, #06b6d4)}.bg-muted{background-color:var(--vo-muted, #f1f5f9)}.bg-popover{background-color:var(--vo-popover, #ffffff)}.bg-primary{background-color:var(--vo-primary, #3b82f6)}.bg-secondary{background-color:var(--vo-secondary, #6b7280)}.bg-success{background-color:var(--vo-success, #22c55e)}.bg-surface{background-color:var(--vo-surface, #f8fafc)}.bg-transparent{background-color:transparent}.bg-warning{background-color:var(--vo-warning, #f59e0b)}.fill-foreground{fill:var(--vo-text, #0f172a)}.fill-popover{fill:var(--vo-popover, #ffffff)}.object-cover{-o-object-fit:cover;object-fit:cover}.p-1{padding:.25rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.px-1{padding-left:.25rem;padding-right:.25rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-2\\.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-8{padding-left:2rem;padding-right:2rem}.py-0\\.5{padding-top:.125rem;padding-bottom:.125rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\\.5{padding-top:.375rem;padding-bottom:.375rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.pb-4{padding-bottom:1rem}.pl-2{padding-left:.5rem}.pr-8{padding-right:2rem}.pt-0{padding-top:0}.text-center{text-align:center}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xs{font-size:.75rem;line-height:1rem}.font-medium{font-weight:500}.font-semibold{font-weight:600}.leading-none{line-height:1}.tracking-tight{letter-spacing:-.025em}.text-accent-foreground{color:var(--vo-accent-foreground, #0f172a)}.text-background{color:var(--vo-background, #ffffff)}.text-card-foreground{color:var(--vo-card-foreground, #0f172a)}.text-current{color:currentColor}.text-danger{color:var(--vo-danger, #ef4444)}.text-danger-foreground{color:var(--vo-danger-foreground, #ffffff)}.text-foreground{color:var(--vo-text, #0f172a)}.text-info{color:var(--vo-info, #06b6d4)}.text-info-foreground{color:var(--vo-info-foreground, #ffffff)}.text-muted-foreground{color:var(--vo-text-muted, #64748b)}.text-popover-foreground{color:var(--vo-popover-foreground, #0f172a)}.text-primary{color:var(--vo-primary, #3b82f6)}.text-primary-foreground{color:var(--vo-primary-foreground, #ffffff)}.text-secondary-foreground{color:var(--vo-secondary-foreground, #ffffff)}.text-success{color:var(--vo-success, #22c55e)}.text-success-foreground{color:var(--vo-success-foreground, #ffffff)}.text-warning{color:var(--vo-warning, #f59e0b)}.text-warning-foreground{color:var(--vo-warning-foreground, #ffffff)}.underline-offset-4{text-underline-offset:4px}.opacity-50{opacity:.5}.opacity-70{opacity:.7}.shadow{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-lg{--tw-shadow: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-md{--tw-shadow: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);--tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-sm{--tw-shadow: 0 1px 2px 0 rgb(0 0 0 / .05);--tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.outline-none{outline:2px solid transparent;outline-offset:2px}.outline{outline-style:solid}.ring-0{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.ring-offset-background{--tw-ring-offset-color: var(--vo-background, #ffffff)}.blur{--tw-blur: blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-transform{transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.duration-200{transition-duration:.2s}.ease-out{transition-timing-function:cubic-bezier(0,0,.2,1)}.placeholder\\:text-muted-foreground::-moz-placeholder{color:var(--vo-text-muted, #64748b)}.placeholder\\:text-muted-foreground::placeholder{color:var(--vo-text-muted, #64748b)}.hover\\:bg-accent:hover{background-color:var(--vo-accent, #f1f5f9)}.hover\\:text-accent-foreground:hover{color:var(--vo-accent-foreground, #0f172a)}.hover\\:text-foreground:hover{color:var(--vo-text, #0f172a)}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:opacity-100:hover{opacity:1}.focus\\:bg-accent:focus{background-color:var(--vo-accent, #f1f5f9)}.focus\\:text-accent-foreground:focus{color:var(--vo-accent-foreground, #0f172a)}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus\\:ring-1:focus{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus\\:ring-ring:focus{--tw-ring-color: var(--vo-ring, #3b82f6)}.focus-visible\\:outline-none:focus-visible{outline:2px solid transparent;outline-offset:2px}.focus-visible\\:ring-1:focus-visible{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus-visible\\:ring-2:focus-visible{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus-visible\\:ring-ring:focus-visible{--tw-ring-color: var(--vo-ring, #3b82f6)}.disabled\\:pointer-events-none:disabled{pointer-events:none}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:opacity-50:disabled{opacity:.5}.data-\\[disabled\\]\\:pointer-events-none[data-disabled]{pointer-events:none}.data-\\[state\\=checked\\]\\:translate-x-4[data-state=checked]{--tw-translate-x: 1rem;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.data-\\[state\\=unchecked\\]\\:translate-x-0[data-state=unchecked]{--tw-translate-x: 0px;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@keyframes fade-out{0%{opacity:1}to{opacity:0}}.data-\\[state\\=closed\\]\\:animate-fade-out[data-state=closed]{animation:fade-out .2s ease-out}@keyframes fade-in{0%{opacity:0}to{opacity:1}}.data-\\[state\\=open\\]\\:animate-fade-in[data-state=open]{animation:fade-in .2s ease-out}.data-\\[state\\=checked\\]\\:border-primary[data-state=checked]{border-color:var(--vo-primary, #3b82f6)}.data-\\[state\\=active\\]\\:bg-background[data-state=active]{background-color:var(--vo-background, #ffffff)}.data-\\[state\\=checked\\]\\:bg-primary[data-state=checked]{background-color:var(--vo-primary, #3b82f6)}.data-\\[state\\=unchecked\\]\\:bg-muted[data-state=unchecked]{background-color:var(--vo-muted, #f1f5f9)}.data-\\[state\\=active\\]\\:text-foreground[data-state=active]{color:var(--vo-text, #0f172a)}.data-\\[state\\=checked\\]\\:text-primary-foreground[data-state=checked]{color:var(--vo-primary-foreground, #ffffff)}.data-\\[disabled\\]\\:opacity-50[data-disabled]{opacity:.5}.data-\\[state\\=active\\]\\:shadow[data-state=active]{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.\\[\\&\\[data-state\\=open\\]\\>svg\\]\\:rotate-180[data-state=open]>svg{--tw-rotate: 180deg;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}';
let as = !1, _t = null;
function Iw() {
  if (as) return;
  as = !0;
  const e = document.createElement("style");
  e.id = "vogui-base", e.textContent = Ff, document.head.appendChild(e);
}
function Mf(e) {
  if (!(!e || e.length === 0)) {
    _t || (_t = document.createElement("style"), _t.id = "vogui-dynamic", document.head.appendChild(_t));
    for (const t of e)
      _t.sheet?.insertRule(t, _t.sheet.cssRules.length);
  }
}
const kf = {
  "--vo-primary": "#3b82f6",
  "--vo-primary-foreground": "#ffffff",
  "--vo-secondary": "#6b7280",
  "--vo-secondary-foreground": "#ffffff",
  "--vo-success": "#22c55e",
  "--vo-success-foreground": "#ffffff",
  "--vo-danger": "#ef4444",
  "--vo-danger-foreground": "#ffffff",
  "--vo-warning": "#f59e0b",
  "--vo-warning-foreground": "#ffffff",
  "--vo-info": "#06b6d4",
  "--vo-info-foreground": "#ffffff",
  "--vo-background": "#ffffff",
  "--vo-text": "#0f172a",
  "--vo-text-muted": "#64748b",
  "--vo-surface": "#f8fafc",
  "--vo-card": "#ffffff",
  "--vo-card-foreground": "#0f172a",
  "--vo-popover": "#ffffff",
  "--vo-popover-foreground": "#0f172a",
  "--vo-border": "#e2e8f0",
  "--vo-input-border": "#e2e8f0",
  "--vo-ring": "#3b82f6",
  "--vo-accent": "#f1f5f9",
  "--vo-accent-foreground": "#0f172a",
  "--vo-muted": "#f1f5f9",
  "--vo-radius": "6px",
  "--vo-radius-sm": "4px",
  "--vo-radius-lg": "8px",
  "--vo-font-family": "system-ui, -apple-system, sans-serif"
};
let ut = null;
function Lw() {
  return ut ? ut.classList.toggle("dark") : !1;
}
function $w(e) {
  ut && (e ? ut.classList.add("dark") : ut.classList.remove("dark"));
}
function Ww() {
  return ut?.classList.contains("dark") ?? !1;
}
function Pf(e, t) {
  ut = e;
  const n = { ...kf, ...t };
  for (const [o, r] of Object.entries(n))
    e.style.setProperty(o, r);
  e.style.backgroundColor = n["--vo-background"], e.style.color = n["--vo-text"], e.style.borderColor = n["--vo-border"], e.style.caretColor = n["--vo-text"], e.style.fontFamily = n["--vo-font-family"], e.style.fontSize = "14px";
}
const Df = [
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "S",
  "B",
  "S",
  "WS",
  "B",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "B",
  "B",
  "B",
  "S",
  "WS",
  "ON",
  "ON",
  "ET",
  "ET",
  "ET",
  "ON",
  "ON",
  "ON",
  "ON",
  "ON",
  "ES",
  "CS",
  "ES",
  "CS",
  "CS",
  "EN",
  "EN",
  "EN",
  "EN",
  "EN",
  "EN",
  "EN",
  "EN",
  "EN",
  "EN",
  "CS",
  "ON",
  "ON",
  "ON",
  "ON",
  "ON",
  "ON",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "ON",
  "ON",
  "ON",
  "ON",
  "ON",
  "ON",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "ON",
  "ON",
  "ON",
  "ON",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "B",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "CS",
  "ON",
  "ET",
  "ET",
  "ET",
  "ET",
  "ON",
  "ON",
  "ON",
  "ON",
  "L",
  "ON",
  "ON",
  "BN",
  "ON",
  "ON",
  "ET",
  "ET",
  "EN",
  "EN",
  "ON",
  "L",
  "ON",
  "ON",
  "ON",
  "EN",
  "L",
  "ON",
  "ON",
  "ON",
  "ON",
  "ON",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "ON",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "ON",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L",
  "L"
], cs = [
  [697, 698, "ON"],
  [706, 719, "ON"],
  [722, 735, "ON"],
  [741, 749, "ON"],
  [751, 767, "ON"],
  [768, 879, "NSM"],
  [884, 885, "ON"],
  [894, 894, "ON"],
  [900, 901, "ON"],
  [903, 903, "ON"],
  [1014, 1014, "ON"],
  [1155, 1161, "NSM"],
  [1418, 1418, "ON"],
  [1421, 1422, "ON"],
  [1423, 1423, "ET"],
  [1424, 1424, "R"],
  [1425, 1469, "NSM"],
  [1470, 1470, "R"],
  [1471, 1471, "NSM"],
  [1472, 1472, "R"],
  [1473, 1474, "NSM"],
  [1475, 1475, "R"],
  [1476, 1477, "NSM"],
  [1478, 1478, "R"],
  [1479, 1479, "NSM"],
  [1480, 1535, "R"],
  [1536, 1541, "AN"],
  [1542, 1543, "ON"],
  [1544, 1544, "AL"],
  [1545, 1546, "ET"],
  [1547, 1547, "AL"],
  [1548, 1548, "CS"],
  [1549, 1549, "AL"],
  [1550, 1551, "ON"],
  [1552, 1562, "NSM"],
  [1563, 1610, "AL"],
  [1611, 1631, "NSM"],
  [1632, 1641, "AN"],
  [1642, 1642, "ET"],
  [1643, 1644, "AN"],
  [1645, 1647, "AL"],
  [1648, 1648, "NSM"],
  [1649, 1749, "AL"],
  [1750, 1756, "NSM"],
  [1757, 1757, "AN"],
  [1758, 1758, "ON"],
  [1759, 1764, "NSM"],
  [1765, 1766, "AL"],
  [1767, 1768, "NSM"],
  [1769, 1769, "ON"],
  [1770, 1773, "NSM"],
  [1774, 1775, "AL"],
  [1776, 1785, "EN"],
  [1786, 1808, "AL"],
  [1809, 1809, "NSM"],
  [1810, 1839, "AL"],
  [1840, 1866, "NSM"],
  [1867, 1957, "AL"],
  [1958, 1968, "NSM"],
  [1969, 1983, "AL"],
  [1984, 2026, "R"],
  [2027, 2035, "NSM"],
  [2036, 2037, "R"],
  [2038, 2041, "ON"],
  [2042, 2044, "R"],
  [2045, 2045, "NSM"],
  [2046, 2069, "R"],
  [2070, 2073, "NSM"],
  [2074, 2074, "R"],
  [2075, 2083, "NSM"],
  [2084, 2084, "R"],
  [2085, 2087, "NSM"],
  [2088, 2088, "R"],
  [2089, 2093, "NSM"],
  [2094, 2136, "R"],
  [2137, 2139, "NSM"],
  [2140, 2143, "R"],
  [2144, 2191, "AL"],
  [2192, 2193, "AN"],
  [2194, 2198, "AL"],
  [2199, 2207, "NSM"],
  [2208, 2249, "AL"],
  [2250, 2273, "NSM"],
  [2274, 2274, "AN"],
  [2275, 2306, "NSM"],
  [2362, 2362, "NSM"],
  [2364, 2364, "NSM"],
  [2369, 2376, "NSM"],
  [2381, 2381, "NSM"],
  [2385, 2391, "NSM"],
  [2402, 2403, "NSM"],
  [2433, 2433, "NSM"],
  [2492, 2492, "NSM"],
  [2497, 2500, "NSM"],
  [2509, 2509, "NSM"],
  [2530, 2531, "NSM"],
  [2546, 2547, "ET"],
  [2555, 2555, "ET"],
  [2558, 2558, "NSM"],
  [2561, 2562, "NSM"],
  [2620, 2620, "NSM"],
  [2625, 2626, "NSM"],
  [2631, 2632, "NSM"],
  [2635, 2637, "NSM"],
  [2641, 2641, "NSM"],
  [2672, 2673, "NSM"],
  [2677, 2677, "NSM"],
  [2689, 2690, "NSM"],
  [2748, 2748, "NSM"],
  [2753, 2757, "NSM"],
  [2759, 2760, "NSM"],
  [2765, 2765, "NSM"],
  [2786, 2787, "NSM"],
  [2801, 2801, "ET"],
  [2810, 2815, "NSM"],
  [2817, 2817, "NSM"],
  [2876, 2876, "NSM"],
  [2879, 2879, "NSM"],
  [2881, 2884, "NSM"],
  [2893, 2893, "NSM"],
  [2901, 2902, "NSM"],
  [2914, 2915, "NSM"],
  [2946, 2946, "NSM"],
  [3008, 3008, "NSM"],
  [3021, 3021, "NSM"],
  [3059, 3064, "ON"],
  [3065, 3065, "ET"],
  [3066, 3066, "ON"],
  [3072, 3072, "NSM"],
  [3076, 3076, "NSM"],
  [3132, 3132, "NSM"],
  [3134, 3136, "NSM"],
  [3142, 3144, "NSM"],
  [3146, 3149, "NSM"],
  [3157, 3158, "NSM"],
  [3170, 3171, "NSM"],
  [3192, 3198, "ON"],
  [3201, 3201, "NSM"],
  [3260, 3260, "NSM"],
  [3276, 3277, "NSM"],
  [3298, 3299, "NSM"],
  [3328, 3329, "NSM"],
  [3387, 3388, "NSM"],
  [3393, 3396, "NSM"],
  [3405, 3405, "NSM"],
  [3426, 3427, "NSM"],
  [3457, 3457, "NSM"],
  [3530, 3530, "NSM"],
  [3538, 3540, "NSM"],
  [3542, 3542, "NSM"],
  [3633, 3633, "NSM"],
  [3636, 3642, "NSM"],
  [3647, 3647, "ET"],
  [3655, 3662, "NSM"],
  [3761, 3761, "NSM"],
  [3764, 3772, "NSM"],
  [3784, 3790, "NSM"],
  [3864, 3865, "NSM"],
  [3893, 3893, "NSM"],
  [3895, 3895, "NSM"],
  [3897, 3897, "NSM"],
  [3898, 3901, "ON"],
  [3953, 3966, "NSM"],
  [3968, 3972, "NSM"],
  [3974, 3975, "NSM"],
  [3981, 3991, "NSM"],
  [3993, 4028, "NSM"],
  [4038, 4038, "NSM"],
  [4141, 4144, "NSM"],
  [4146, 4151, "NSM"],
  [4153, 4154, "NSM"],
  [4157, 4158, "NSM"],
  [4184, 4185, "NSM"],
  [4190, 4192, "NSM"],
  [4209, 4212, "NSM"],
  [4226, 4226, "NSM"],
  [4229, 4230, "NSM"],
  [4237, 4237, "NSM"],
  [4253, 4253, "NSM"],
  [4957, 4959, "NSM"],
  [5008, 5017, "ON"],
  [5120, 5120, "ON"],
  [5760, 5760, "WS"],
  [5787, 5788, "ON"],
  [5906, 5908, "NSM"],
  [5938, 5939, "NSM"],
  [5970, 5971, "NSM"],
  [6002, 6003, "NSM"],
  [6068, 6069, "NSM"],
  [6071, 6077, "NSM"],
  [6086, 6086, "NSM"],
  [6089, 6099, "NSM"],
  [6107, 6107, "ET"],
  [6109, 6109, "NSM"],
  [6128, 6137, "ON"],
  [6144, 6154, "ON"],
  [6155, 6157, "NSM"],
  [6158, 6158, "BN"],
  [6159, 6159, "NSM"],
  [6277, 6278, "NSM"],
  [6313, 6313, "NSM"],
  [6432, 6434, "NSM"],
  [6439, 6440, "NSM"],
  [6450, 6450, "NSM"],
  [6457, 6459, "NSM"],
  [6464, 6464, "ON"],
  [6468, 6469, "ON"],
  [6622, 6655, "ON"],
  [6679, 6680, "NSM"],
  [6683, 6683, "NSM"],
  [6742, 6742, "NSM"],
  [6744, 6750, "NSM"],
  [6752, 6752, "NSM"],
  [6754, 6754, "NSM"],
  [6757, 6764, "NSM"],
  [6771, 6780, "NSM"],
  [6783, 6783, "NSM"],
  [6832, 6877, "NSM"],
  [6880, 6891, "NSM"],
  [6912, 6915, "NSM"],
  [6964, 6964, "NSM"],
  [6966, 6970, "NSM"],
  [6972, 6972, "NSM"],
  [6978, 6978, "NSM"],
  [7019, 7027, "NSM"],
  [7040, 7041, "NSM"],
  [7074, 7077, "NSM"],
  [7080, 7081, "NSM"],
  [7083, 7085, "NSM"],
  [7142, 7142, "NSM"],
  [7144, 7145, "NSM"],
  [7149, 7149, "NSM"],
  [7151, 7153, "NSM"],
  [7212, 7219, "NSM"],
  [7222, 7223, "NSM"],
  [7376, 7378, "NSM"],
  [7380, 7392, "NSM"],
  [7394, 7400, "NSM"],
  [7405, 7405, "NSM"],
  [7412, 7412, "NSM"],
  [7416, 7417, "NSM"],
  [7616, 7679, "NSM"],
  [8125, 8125, "ON"],
  [8127, 8129, "ON"],
  [8141, 8143, "ON"],
  [8157, 8159, "ON"],
  [8173, 8175, "ON"],
  [8189, 8190, "ON"],
  [8192, 8202, "WS"],
  [8203, 8205, "BN"],
  [8207, 8207, "R"],
  [8208, 8231, "ON"],
  [8232, 8232, "WS"],
  [8233, 8233, "B"],
  [8234, 8238, "BN"],
  [8239, 8239, "CS"],
  [8240, 8244, "ET"],
  [8245, 8259, "ON"],
  [8260, 8260, "CS"],
  [8261, 8286, "ON"],
  [8287, 8287, "WS"],
  [8288, 8303, "BN"],
  [8304, 8304, "EN"],
  [8308, 8313, "EN"],
  [8314, 8315, "ES"],
  [8316, 8318, "ON"],
  [8320, 8329, "EN"],
  [8330, 8331, "ES"],
  [8332, 8334, "ON"],
  [8352, 8399, "ET"],
  [8400, 8432, "NSM"],
  [8448, 8449, "ON"],
  [8451, 8454, "ON"],
  [8456, 8457, "ON"],
  [8468, 8468, "ON"],
  [8470, 8472, "ON"],
  [8478, 8483, "ON"],
  [8485, 8485, "ON"],
  [8487, 8487, "ON"],
  [8489, 8489, "ON"],
  [8494, 8494, "ET"],
  [8506, 8507, "ON"],
  [8512, 8516, "ON"],
  [8522, 8525, "ON"],
  [8528, 8543, "ON"],
  [8585, 8587, "ON"],
  [8592, 8721, "ON"],
  [8722, 8722, "ES"],
  [8723, 8723, "ET"],
  [8724, 9013, "ON"],
  [9083, 9108, "ON"],
  [9110, 9257, "ON"],
  [9280, 9290, "ON"],
  [9312, 9351, "ON"],
  [9352, 9371, "EN"],
  [9450, 9899, "ON"],
  [9901, 10239, "ON"],
  [10496, 11123, "ON"],
  [11126, 11263, "ON"],
  [11493, 11498, "ON"],
  [11503, 11505, "NSM"],
  [11513, 11519, "ON"],
  [11647, 11647, "NSM"],
  [11744, 11775, "NSM"],
  [11776, 11869, "ON"],
  [11904, 11929, "ON"],
  [11931, 12019, "ON"],
  [12032, 12245, "ON"],
  [12272, 12287, "ON"],
  [12288, 12288, "WS"],
  [12289, 12292, "ON"],
  [12296, 12320, "ON"],
  [12330, 12333, "NSM"],
  [12336, 12336, "ON"],
  [12342, 12343, "ON"],
  [12349, 12351, "ON"],
  [12441, 12442, "NSM"],
  [12443, 12444, "ON"],
  [12448, 12448, "ON"],
  [12539, 12539, "ON"],
  [12736, 12773, "ON"],
  [12783, 12783, "ON"],
  [12829, 12830, "ON"],
  [12880, 12895, "ON"],
  [12924, 12926, "ON"],
  [12977, 12991, "ON"],
  [13004, 13007, "ON"],
  [13175, 13178, "ON"],
  [13278, 13279, "ON"],
  [13311, 13311, "ON"],
  [19904, 19967, "ON"],
  [42128, 42182, "ON"],
  [42509, 42511, "ON"],
  [42607, 42610, "NSM"],
  [42611, 42611, "ON"],
  [42612, 42621, "NSM"],
  [42622, 42623, "ON"],
  [42654, 42655, "NSM"],
  [42736, 42737, "NSM"],
  [42752, 42785, "ON"],
  [42888, 42888, "ON"],
  [43010, 43010, "NSM"],
  [43014, 43014, "NSM"],
  [43019, 43019, "NSM"],
  [43045, 43046, "NSM"],
  [43048, 43051, "ON"],
  [43052, 43052, "NSM"],
  [43064, 43065, "ET"],
  [43124, 43127, "ON"],
  [43204, 43205, "NSM"],
  [43232, 43249, "NSM"],
  [43263, 43263, "NSM"],
  [43302, 43309, "NSM"],
  [43335, 43345, "NSM"],
  [43392, 43394, "NSM"],
  [43443, 43443, "NSM"],
  [43446, 43449, "NSM"],
  [43452, 43453, "NSM"],
  [43493, 43493, "NSM"],
  [43561, 43566, "NSM"],
  [43569, 43570, "NSM"],
  [43573, 43574, "NSM"],
  [43587, 43587, "NSM"],
  [43596, 43596, "NSM"],
  [43644, 43644, "NSM"],
  [43696, 43696, "NSM"],
  [43698, 43700, "NSM"],
  [43703, 43704, "NSM"],
  [43710, 43711, "NSM"],
  [43713, 43713, "NSM"],
  [43756, 43757, "NSM"],
  [43766, 43766, "NSM"],
  [43882, 43883, "ON"],
  [44005, 44005, "NSM"],
  [44008, 44008, "NSM"],
  [44013, 44013, "NSM"],
  [64285, 64285, "R"],
  [64286, 64286, "NSM"],
  [64287, 64296, "R"],
  [64297, 64297, "ES"],
  [64298, 64335, "R"],
  [64336, 64450, "AL"],
  [64451, 64466, "ON"],
  [64467, 64829, "AL"],
  [64830, 64847, "ON"],
  [64848, 64911, "AL"],
  [64912, 64913, "ON"],
  [64914, 64967, "AL"],
  [64968, 64975, "ON"],
  [64976, 65007, "BN"],
  [65008, 65020, "AL"],
  [65021, 65023, "ON"],
  [65024, 65039, "NSM"],
  [65040, 65049, "ON"],
  [65056, 65071, "NSM"],
  [65072, 65103, "ON"],
  [65104, 65104, "CS"],
  [65105, 65105, "ON"],
  [65106, 65106, "CS"],
  [65108, 65108, "ON"],
  [65109, 65109, "CS"],
  [65110, 65118, "ON"],
  [65119, 65119, "ET"],
  [65120, 65121, "ON"],
  [65122, 65123, "ES"],
  [65124, 65126, "ON"],
  [65128, 65128, "ON"],
  [65129, 65130, "ET"],
  [65131, 65131, "ON"],
  [65136, 65278, "AL"],
  [65279, 65279, "BN"],
  [65281, 65282, "ON"],
  [65283, 65285, "ET"],
  [65286, 65290, "ON"],
  [65291, 65291, "ES"],
  [65292, 65292, "CS"],
  [65293, 65293, "ES"],
  [65294, 65295, "CS"],
  [65296, 65305, "EN"],
  [65306, 65306, "CS"],
  [65307, 65312, "ON"],
  [65339, 65344, "ON"],
  [65371, 65381, "ON"],
  [65504, 65505, "ET"],
  [65506, 65508, "ON"],
  [65509, 65510, "ET"],
  [65512, 65518, "ON"],
  [65520, 65528, "BN"],
  [65529, 65533, "ON"],
  [65534, 65535, "BN"],
  [65793, 65793, "ON"],
  [65856, 65932, "ON"],
  [65936, 65948, "ON"],
  [65952, 65952, "ON"],
  [66045, 66045, "NSM"],
  [66272, 66272, "NSM"],
  [66273, 66299, "EN"],
  [66422, 66426, "NSM"],
  [67584, 67870, "R"],
  [67871, 67871, "ON"],
  [67872, 68096, "R"],
  [68097, 68099, "NSM"],
  [68100, 68100, "R"],
  [68101, 68102, "NSM"],
  [68103, 68107, "R"],
  [68108, 68111, "NSM"],
  [68112, 68151, "R"],
  [68152, 68154, "NSM"],
  [68155, 68158, "R"],
  [68159, 68159, "NSM"],
  [68160, 68324, "R"],
  [68325, 68326, "NSM"],
  [68327, 68408, "R"],
  [68409, 68415, "ON"],
  [68416, 68863, "R"],
  [68864, 68899, "AL"],
  [68900, 68903, "NSM"],
  [68904, 68911, "AL"],
  [68912, 68921, "AN"],
  [68922, 68927, "AL"],
  [68928, 68937, "AN"],
  [68938, 68968, "R"],
  [68969, 68973, "NSM"],
  [68974, 68974, "ON"],
  [68975, 69215, "R"],
  [69216, 69246, "AN"],
  [69247, 69290, "R"],
  [69291, 69292, "NSM"],
  [69293, 69311, "R"],
  [69312, 69327, "AL"],
  [69328, 69336, "ON"],
  [69337, 69369, "AL"],
  [69370, 69375, "NSM"],
  [69376, 69423, "R"],
  [69424, 69445, "AL"],
  [69446, 69456, "NSM"],
  [69457, 69487, "AL"],
  [69488, 69505, "R"],
  [69506, 69509, "NSM"],
  [69510, 69631, "R"],
  [69633, 69633, "NSM"],
  [69688, 69702, "NSM"],
  [69714, 69733, "ON"],
  [69744, 69744, "NSM"],
  [69747, 69748, "NSM"],
  [69759, 69761, "NSM"],
  [69811, 69814, "NSM"],
  [69817, 69818, "NSM"],
  [69826, 69826, "NSM"],
  [69888, 69890, "NSM"],
  [69927, 69931, "NSM"],
  [69933, 69940, "NSM"],
  [70003, 70003, "NSM"],
  [70016, 70017, "NSM"],
  [70070, 70078, "NSM"],
  [70089, 70092, "NSM"],
  [70095, 70095, "NSM"],
  [70191, 70193, "NSM"],
  [70196, 70196, "NSM"],
  [70198, 70199, "NSM"],
  [70206, 70206, "NSM"],
  [70209, 70209, "NSM"],
  [70367, 70367, "NSM"],
  [70371, 70378, "NSM"],
  [70400, 70401, "NSM"],
  [70459, 70460, "NSM"],
  [70464, 70464, "NSM"],
  [70502, 70508, "NSM"],
  [70512, 70516, "NSM"],
  [70587, 70592, "NSM"],
  [70606, 70606, "NSM"],
  [70608, 70608, "NSM"],
  [70610, 70610, "NSM"],
  [70625, 70626, "NSM"],
  [70712, 70719, "NSM"],
  [70722, 70724, "NSM"],
  [70726, 70726, "NSM"],
  [70750, 70750, "NSM"],
  [70835, 70840, "NSM"],
  [70842, 70842, "NSM"],
  [70847, 70848, "NSM"],
  [70850, 70851, "NSM"],
  [71090, 71093, "NSM"],
  [71100, 71101, "NSM"],
  [71103, 71104, "NSM"],
  [71132, 71133, "NSM"],
  [71219, 71226, "NSM"],
  [71229, 71229, "NSM"],
  [71231, 71232, "NSM"],
  [71264, 71276, "ON"],
  [71339, 71339, "NSM"],
  [71341, 71341, "NSM"],
  [71344, 71349, "NSM"],
  [71351, 71351, "NSM"],
  [71453, 71453, "NSM"],
  [71455, 71455, "NSM"],
  [71458, 71461, "NSM"],
  [71463, 71467, "NSM"],
  [71727, 71735, "NSM"],
  [71737, 71738, "NSM"],
  [71995, 71996, "NSM"],
  [71998, 71998, "NSM"],
  [72003, 72003, "NSM"],
  [72148, 72151, "NSM"],
  [72154, 72155, "NSM"],
  [72160, 72160, "NSM"],
  [72193, 72198, "NSM"],
  [72201, 72202, "NSM"],
  [72243, 72248, "NSM"],
  [72251, 72254, "NSM"],
  [72263, 72263, "NSM"],
  [72273, 72278, "NSM"],
  [72281, 72283, "NSM"],
  [72330, 72342, "NSM"],
  [72344, 72345, "NSM"],
  [72544, 72544, "NSM"],
  [72546, 72548, "NSM"],
  [72550, 72550, "NSM"],
  [72752, 72758, "NSM"],
  [72760, 72765, "NSM"],
  [72850, 72871, "NSM"],
  [72874, 72880, "NSM"],
  [72882, 72883, "NSM"],
  [72885, 72886, "NSM"],
  [73009, 73014, "NSM"],
  [73018, 73018, "NSM"],
  [73020, 73021, "NSM"],
  [73023, 73029, "NSM"],
  [73031, 73031, "NSM"],
  [73104, 73105, "NSM"],
  [73109, 73109, "NSM"],
  [73111, 73111, "NSM"],
  [73459, 73460, "NSM"],
  [73472, 73473, "NSM"],
  [73526, 73530, "NSM"],
  [73536, 73536, "NSM"],
  [73538, 73538, "NSM"],
  [73562, 73562, "NSM"],
  [73685, 73692, "ON"],
  [73693, 73696, "ET"],
  [73697, 73713, "ON"],
  [78912, 78912, "NSM"],
  [78919, 78933, "NSM"],
  [90398, 90409, "NSM"],
  [90413, 90415, "NSM"],
  [92912, 92916, "NSM"],
  [92976, 92982, "NSM"],
  [94031, 94031, "NSM"],
  [94095, 94098, "NSM"],
  [94178, 94178, "ON"],
  [94180, 94180, "NSM"],
  [113821, 113822, "NSM"],
  [113824, 113827, "BN"],
  [117760, 117973, "ON"],
  [118e3, 118009, "EN"],
  [118010, 118012, "ON"],
  [118016, 118451, "ON"],
  [118458, 118480, "ON"],
  [118496, 118512, "ON"],
  [118528, 118573, "NSM"],
  [118576, 118598, "NSM"],
  [119143, 119145, "NSM"],
  [119155, 119162, "BN"],
  [119163, 119170, "NSM"],
  [119173, 119179, "NSM"],
  [119210, 119213, "NSM"],
  [119273, 119274, "ON"],
  [119296, 119361, "ON"],
  [119362, 119364, "NSM"],
  [119365, 119365, "ON"],
  [119552, 119638, "ON"],
  [120513, 120513, "ON"],
  [120539, 120539, "ON"],
  [120571, 120571, "ON"],
  [120597, 120597, "ON"],
  [120629, 120629, "ON"],
  [120655, 120655, "ON"],
  [120687, 120687, "ON"],
  [120713, 120713, "ON"],
  [120745, 120745, "ON"],
  [120771, 120771, "ON"],
  [120782, 120831, "EN"],
  [121344, 121398, "NSM"],
  [121403, 121452, "NSM"],
  [121461, 121461, "NSM"],
  [121476, 121476, "NSM"],
  [121499, 121503, "NSM"],
  [121505, 121519, "NSM"],
  [122880, 122886, "NSM"],
  [122888, 122904, "NSM"],
  [122907, 122913, "NSM"],
  [122915, 122916, "NSM"],
  [122918, 122922, "NSM"],
  [123023, 123023, "NSM"],
  [123184, 123190, "NSM"],
  [123566, 123566, "NSM"],
  [123628, 123631, "NSM"],
  [123647, 123647, "ET"],
  [124140, 124143, "NSM"],
  [124398, 124399, "NSM"],
  [124643, 124643, "NSM"],
  [124646, 124646, "NSM"],
  [124654, 124655, "NSM"],
  [124661, 124661, "NSM"],
  [124928, 125135, "R"],
  [125136, 125142, "NSM"],
  [125143, 125251, "R"],
  [125252, 125258, "NSM"],
  [125259, 126063, "R"],
  [126064, 126143, "AL"],
  [126144, 126207, "R"],
  [126208, 126287, "AL"],
  [126288, 126463, "R"],
  [126464, 126703, "AL"],
  [126704, 126705, "ON"],
  [126706, 126719, "AL"],
  [126720, 126975, "R"],
  [126976, 127019, "ON"],
  [127024, 127123, "ON"],
  [127136, 127150, "ON"],
  [127153, 127167, "ON"],
  [127169, 127183, "ON"],
  [127185, 127221, "ON"],
  [127232, 127242, "EN"],
  [127243, 127247, "ON"],
  [127279, 127279, "ON"],
  [127338, 127343, "ON"],
  [127405, 127405, "ON"],
  [127584, 127589, "ON"],
  [127744, 128728, "ON"],
  [128732, 128748, "ON"],
  [128752, 128764, "ON"],
  [128768, 128985, "ON"],
  [128992, 129003, "ON"],
  [129008, 129008, "ON"],
  [129024, 129035, "ON"],
  [129040, 129095, "ON"],
  [129104, 129113, "ON"],
  [129120, 129159, "ON"],
  [129168, 129197, "ON"],
  [129200, 129211, "ON"],
  [129216, 129217, "ON"],
  [129232, 129240, "ON"],
  [129280, 129623, "ON"],
  [129632, 129645, "ON"],
  [129648, 129660, "ON"],
  [129664, 129674, "ON"],
  [129678, 129734, "ON"],
  [129736, 129736, "ON"],
  [129741, 129756, "ON"],
  [129759, 129770, "ON"],
  [129775, 129784, "ON"],
  [129792, 129938, "ON"],
  [129940, 130031, "ON"],
  [130032, 130041, "EN"],
  [130042, 130042, "ON"],
  [131070, 131071, "BN"],
  [196606, 196607, "BN"],
  [262142, 262143, "BN"],
  [327678, 327679, "BN"],
  [393214, 393215, "BN"],
  [458750, 458751, "BN"],
  [524286, 524287, "BN"],
  [589822, 589823, "BN"],
  [655358, 655359, "BN"],
  [720894, 720895, "BN"],
  [786430, 786431, "BN"],
  [851966, 851967, "BN"],
  [917502, 917759, "BN"],
  [917760, 917999, "NSM"],
  [918e3, 921599, "BN"],
  [983038, 983039, "BN"],
  [1048574, 1048575, "BN"],
  [1114110, 1114111, "BN"]
];
function Of(e) {
  if (e <= 255)
    return Df[e];
  let t = 0, n = cs.length - 1;
  for (; t <= n; ) {
    const o = t + n >> 1, r = cs[o];
    if (e < r[0]) {
      n = o - 1;
      continue;
    }
    if (e > r[1]) {
      t = o + 1;
      continue;
    }
    return r[2];
  }
  return "L";
}
function Tf(e) {
  const t = e.length;
  if (t === 0)
    return null;
  const n = new Array(t);
  let o = !1;
  for (let c = 0; c < t; ) {
    const u = e.charCodeAt(c);
    let d = u, f = 1;
    if (u >= 55296 && u <= 56319 && c + 1 < t) {
      const x = e.charCodeAt(c + 1);
      x >= 56320 && x <= 57343 && (d = (u - 55296 << 10) + (x - 56320) + 65536, f = 2);
    }
    const p = Of(d);
    (p === "R" || p === "AL" || p === "AN") && (o = !0);
    for (let x = 0; x < f; x++)
      n[c + x] = p;
    c += f;
  }
  if (!o)
    return null;
  let r = 0;
  for (let c = 0; c < t; c++) {
    const u = n[c];
    if (u === "L") {
      r = 0;
      break;
    }
    if (u === "R" || u === "AL") {
      r = 1;
      break;
    }
  }
  const i = new Int8Array(t);
  for (let c = 0; c < t; c++)
    i[c] = r;
  const s = r & 1 ? "R" : "L", a = s;
  let l = a;
  for (let c = 0; c < t; c++)
    n[c] === "NSM" ? n[c] = l : l = n[c];
  l = a;
  for (let c = 0; c < t; c++) {
    const u = n[c];
    u === "EN" ? n[c] = l === "AL" ? "AN" : "EN" : (u === "R" || u === "L" || u === "AL") && (l = u);
  }
  for (let c = 0; c < t; c++)
    n[c] === "AL" && (n[c] = "R");
  for (let c = 1; c < t - 1; c++)
    n[c] === "ES" && n[c - 1] === "EN" && n[c + 1] === "EN" && (n[c] = "EN"), n[c] === "CS" && (n[c - 1] === "EN" || n[c - 1] === "AN") && n[c + 1] === n[c - 1] && (n[c] = n[c - 1]);
  for (let c = 0; c < t; c++) {
    if (n[c] !== "EN")
      continue;
    let u;
    for (u = c - 1; u >= 0 && n[u] === "ET"; u--)
      n[u] = "EN";
    for (u = c + 1; u < t && n[u] === "ET"; u++)
      n[u] = "EN";
  }
  for (let c = 0; c < t; c++) {
    const u = n[c];
    (u === "WS" || u === "ES" || u === "ET" || u === "CS") && (n[c] = "ON");
  }
  l = a;
  for (let c = 0; c < t; c++) {
    const u = n[c];
    u === "EN" ? n[c] = l === "L" ? "L" : "EN" : (u === "R" || u === "L") && (l = u);
  }
  for (let c = 0; c < t; c++) {
    if (n[c] !== "ON")
      continue;
    let u = c + 1;
    for (; u < t && n[u] === "ON"; )
      u++;
    const d = c > 0 ? n[c - 1] : a, f = u < t ? n[u] : a, p = d !== "L" ? "R" : "L";
    if (p === (f !== "L" ? "R" : "L"))
      for (let h = c; h < u; h++)
        n[h] = p;
    c = u - 1;
  }
  for (let c = 0; c < t; c++)
    n[c] === "ON" && (n[c] = s);
  for (let c = 0; c < t; c++) {
    const u = n[c];
    (i[c] & 1) === 0 ? u === "R" ? i[c]++ : (u === "AN" || u === "EN") && (i[c] += 2) : (u === "L" || u === "AN" || u === "EN") && i[c]++;
  }
  return i;
}
function Rf(e, t) {
  const n = Tf(e);
  if (n === null)
    return null;
  const o = new Int8Array(t.length);
  for (let r = 0; r < t.length; r++)
    o[r] = n[t[r]];
  return o;
}
const Bf = /[ \t\n\r\f]+/g, If = /[\t\n\r\f]| {2,}|^ | $/;
function Lf(e) {
  const t = e ?? "normal";
  return t === "pre-wrap" ? { mode: t, preserveOrdinarySpaces: !0, preserveHardBreaks: !0 } : { mode: t, preserveOrdinarySpaces: !1, preserveHardBreaks: !1 };
}
function $f(e) {
  if (!If.test(e))
    return e;
  let t = e.replace(Bf, " ");
  return t.charCodeAt(0) === 32 && (t = t.slice(1)), t.length > 0 && t.charCodeAt(t.length - 1) === 32 && (t = t.slice(0, -1)), t;
}
function Wf(e) {
  return /[\r\f]/.test(e) ? e.replace(/\r\n/g, `
`).replace(/[\r\f]/g, `
`) : e;
}
let Jo = null, Hf;
function Vf() {
  return Jo === null && (Jo = new Intl.Segmenter(Hf, { granularity: "word" })), Jo;
}
const Uf = new RegExp("\\p{Script=Arabic}", "u"), nt = new RegExp("\\p{M}", "u"), ti = new RegExp("\\p{Nd}", "u");
function ls(e) {
  return Uf.test(e);
}
function us(e) {
  return e >= 19968 && e <= 40959 || e >= 13312 && e <= 19903 || e >= 131072 && e <= 173791 || e >= 173824 && e <= 177983 || e >= 177984 && e <= 178207 || e >= 178208 && e <= 183983 || e >= 183984 && e <= 191471 || e >= 191472 && e <= 192093 || e >= 194560 && e <= 195103 || e >= 196608 && e <= 201551 || e >= 201552 && e <= 205743 || e >= 205744 && e <= 210041 || e >= 63744 && e <= 64255 || e >= 12288 && e <= 12351 || e >= 12352 && e <= 12447 || e >= 12448 && e <= 12543 || e >= 12592 && e <= 12687 || e >= 44032 && e <= 55215 || e >= 65280 && e <= 65519;
}
function Le(e) {
  for (let t = 0; t < e.length; t++) {
    const n = e.charCodeAt(t);
    if (!(n < 12288)) {
      if (n >= 55296 && n <= 56319 && t + 1 < e.length) {
        const o = e.charCodeAt(t + 1);
        if (o >= 56320 && o <= 57343) {
          const r = (n - 55296 << 10) + (o - 56320) + 65536;
          if (us(r))
            return !0;
          t++;
          continue;
        }
      }
      if (us(n))
        return !0;
    }
  }
  return !1;
}
function jf(e) {
  const t = hn(e);
  return t !== null && (ni.has(t) || ht.has(t));
}
const zf = /* @__PURE__ */ new Set([
  " ",
  " ",
  "⁠",
  "\uFEFF"
]), Kf = /* @__PURE__ */ new Set([
  "-",
  "‐",
  "–",
  "—"
]);
function Gf(e) {
  const t = hn(e);
  return t !== null && zf.has(t);
}
function Yf(e) {
  const t = hn(e);
  return t !== null && Kf.has(t);
}
function Oa(e, t) {
  return Gf(e) ? !1 : t ? !(jf(e) || Yf(e)) : !0;
}
const ni = /* @__PURE__ */ new Set([
  "，",
  "．",
  "！",
  "：",
  "；",
  "？",
  "、",
  "。",
  "・",
  "）",
  "〕",
  "〉",
  "》",
  "」",
  "』",
  "】",
  "〗",
  "〙",
  "〛",
  "ー",
  "々",
  "〻",
  "ゝ",
  "ゞ",
  "ヽ",
  "ヾ"
]), co = /* @__PURE__ */ new Set([
  '"',
  "(",
  "[",
  "{",
  "¡",
  "¿",
  "“",
  "‘",
  "‚",
  "„",
  "«",
  "‹",
  "⸘",
  "（",
  "〔",
  "〈",
  "《",
  "「",
  "『",
  "【",
  "〖",
  "〘",
  "〚"
]), oi = /* @__PURE__ */ new Set([
  "'",
  "’"
]), ht = /* @__PURE__ */ new Set([
  ".",
  ",",
  "!",
  "?",
  ":",
  ";",
  "،",
  "؛",
  "؟",
  "।",
  "॥",
  "၊",
  "။",
  "၌",
  "၍",
  "၏",
  ")",
  "]",
  "}",
  "%",
  '"',
  "”",
  "’",
  "»",
  "›",
  "…"
]), Xf = /* @__PURE__ */ new Set([
  ":",
  ".",
  "،",
  "؛"
]), Jf = /* @__PURE__ */ new Set([
  "၏"
]), qf = /* @__PURE__ */ new Set([
  "”",
  "’",
  "»",
  "›",
  "」",
  "』",
  "】",
  "》",
  "〉",
  "〕",
  "）"
]);
function Zf(e) {
  if (ri(e))
    return !0;
  let t = !1;
  for (const n of e) {
    if (ht.has(n) || uo(n)) {
      t = !0;
      continue;
    }
    if (!(t && nt.test(n)))
      return !1;
  }
  return t;
}
function Qf(e) {
  for (const t of e)
    if (!ni.has(t) && !ht.has(t))
      return !1;
  return e.length > 0;
}
function e0(e) {
  if (ri(e))
    return !0;
  for (const t of e)
    if (!co.has(t) && !oi.has(t) && !nt.test(t) && !uo(t))
      return !1;
  return e.length > 0;
}
function ri(e) {
  let t = !1;
  for (const n of e)
    if (!(n === "\\" || nt.test(n))) {
      if (co.has(n) || ht.has(n) || oi.has(n)) {
        t = !0;
        continue;
      }
      return !1;
    }
  return t;
}
function lo(e, t) {
  const n = t - 1;
  if (n <= 0)
    return Math.max(n, 0);
  const o = e.charCodeAt(n);
  if (o < 56320 || o > 57343)
    return n;
  const r = n - 1;
  if (r < 0)
    return n;
  const i = e.charCodeAt(r);
  return i >= 55296 && i <= 56319 ? r : n;
}
function hn(e) {
  if (e.length === 0)
    return null;
  const t = lo(e, e.length);
  return e.slice(t);
}
function t0(e) {
  for (const t of e)
    if (!nt.test(t))
      return t;
  return null;
}
function n0(e) {
  for (let t = e.length; t > 0; ) {
    const n = lo(e, t), o = e.slice(n, t);
    if (!nt.test(o))
      return o;
    t = n;
  }
  return null;
}
const o0 = [
  36,
  37,
  43,
  43,
  92,
  92,
  162,
  165,
  176,
  177,
  1423,
  1423,
  1545,
  1547,
  1642,
  1642,
  2046,
  2047,
  2546,
  2547,
  2553,
  2555,
  2801,
  2801,
  3065,
  3065,
  3449,
  3449,
  3647,
  3647,
  6107,
  6107,
  8240,
  8247,
  8279,
  8279,
  8352,
  8399,
  8451,
  8451,
  8457,
  8457,
  8470,
  8470,
  8722,
  8723,
  43064,
  43064,
  65020,
  65020,
  65129,
  65130,
  65284,
  65285,
  65504,
  65505,
  65509,
  65510,
  73693,
  73696,
  123647,
  123647,
  126124,
  126124,
  126128,
  126128
];
function r0(e, t) {
  for (let n = 0; n < t.length; n += 2)
    if (e >= t[n] && e <= t[n + 1])
      return !0;
  return !1;
}
function uo(e) {
  const t = e.codePointAt(0);
  return t !== void 0 && r0(t, o0);
}
function i0(e) {
  const t = n0(e);
  return t !== null && uo(t);
}
function s0(e) {
  const t = t0(e);
  return t !== null && ti.test(t);
}
function a0(e) {
  const t = Array.from(e);
  let n = t.length;
  for (; n > 0; ) {
    const o = t[n - 1];
    if (nt.test(o)) {
      n--;
      continue;
    }
    if (co.has(o) || oi.has(o)) {
      n--;
      continue;
    }
    break;
  }
  return n <= 0 || n === t.length ? null : {
    head: t.slice(0, n).join(""),
    tail: t.slice(n).join("")
  };
}
function c0(e, t, n) {
  return n === "text" && !t && e.length === 1 && e !== "-" && e !== "—" ? e : null;
}
function ds(e, t, n, o) {
  const r = t[o], i = e[o];
  if (r == null)
    return i;
  const s = n[o];
  if (i.length === s)
    return i;
  const a = r.repeat(s);
  return e[o] = a, a;
}
function fs(e, t) {
  return e && t !== null && Xf.has(t);
}
function l0(e) {
  const t = hn(e);
  return t !== null && Jf.has(t);
}
function u0(e) {
  if (e.length < 2 || e[0] !== " ")
    return null;
  const t = e.slice(1);
  return new RegExp("^\\p{M}+$", "u").test(t) ? { space: " ", marks: t } : null;
}
function gr(e) {
  let t = e.length;
  for (; t > 0; ) {
    const n = lo(e, t), o = e.slice(n, t);
    if (qf.has(o))
      return !0;
    if (!ht.has(o))
      return !1;
    t = n;
  }
  return !1;
}
function d0(e, t) {
  if (t.preserveOrdinarySpaces || t.preserveHardBreaks) {
    if (e === " ")
      return "preserved-space";
    if (e === "	")
      return "tab";
    if (t.preserveHardBreaks && e === `
`)
      return "hard-break";
  }
  return e === " " ? "space" : e === " " || e === " " || e === "⁠" || e === "\uFEFF" ? "glue" : e === "​" ? "zero-width-break" : e === "­" ? "soft-hyphen" : "text";
}
const f0 = /[\x20\t\n\xA0\xAD\u200B\u202F\u2060\uFEFF]/;
function Ae(e) {
  return e.length === 1 ? e[0] : e.join("");
}
function p0(e, t) {
  const n = [];
  for (let o = e.length - 1; o >= 0; o--)
    n.push(e[o]);
  return n.push(t), Ae(n);
}
function h0(e, t, n, o) {
  if (!f0.test(e))
    return [{ text: e, isWordLike: t, kind: "text", start: n }];
  const r = [];
  let i = null, s = [], a = n, l = !1, c = 0;
  for (const u of e) {
    const d = d0(u, o), f = d === "text" && t;
    if (i !== null && d === i && f === l) {
      s.push(u), c += u.length;
      continue;
    }
    i !== null && r.push({
      text: Ae(s),
      isWordLike: l,
      kind: i,
      start: a
    }), i = d, s = [u], a = n + c, l = f, c += u.length;
  }
  return i !== null && r.push({
    text: Ae(s),
    isWordLike: l,
    kind: i,
    start: a
  }), r;
}
function br(e) {
  return e === "space" || e === "preserved-space" || e === "zero-width-break" || e === "hard-break";
}
const x0 = /^[A-Za-z][A-Za-z0-9+.-]*:$/;
function m0(e, t) {
  const n = e.texts[t];
  return n.startsWith("www.") ? !0 : x0.test(n) && t + 1 < e.len && e.kinds[t + 1] === "text" && e.texts[t + 1] === "//";
}
function v0(e) {
  return e.includes("?") && (e.includes("://") || e.startsWith("www."));
}
function g0(e) {
  const t = e.texts.slice(), n = e.isWordLike.slice(), o = e.kinds.slice(), r = e.starts.slice();
  for (let s = 0; s < e.len; s++) {
    if (o[s] !== "text" || !m0(e, s))
      continue;
    const a = [t[s]];
    let l = s + 1;
    for (; l < e.len && !br(o[l]); ) {
      a.push(t[l]), n[s] = !0;
      const c = t[l].includes("?");
      if (o[l] = "text", t[l] = "", l++, c)
        break;
    }
    t[s] = Ae(a);
  }
  let i = 0;
  for (let s = 0; s < t.length; s++) {
    const a = t[s];
    a.length !== 0 && (i !== s && (t[i] = a, n[i] = n[s], o[i] = o[s], r[i] = r[s]), i++);
  }
  return t.length = i, n.length = i, o.length = i, r.length = i, {
    len: i,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function b0(e) {
  const t = [], n = [], o = [], r = [];
  for (let i = 0; i < e.len; i++) {
    const s = e.texts[i];
    if (t.push(s), n.push(e.isWordLike[i]), o.push(e.kinds[i]), r.push(e.starts[i]), !v0(s))
      continue;
    const a = i + 1;
    if (a >= e.len || br(e.kinds[a]))
      continue;
    const l = [], c = e.starts[a];
    let u = a;
    for (; u < e.len && !br(e.kinds[u]); )
      l.push(e.texts[u]), u++;
    l.length > 0 && (t.push(Ae(l)), n.push(!0), o.push("text"), r.push(c), i = u - 1);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
const w0 = /* @__PURE__ */ new Set([
  ":",
  "-",
  "/",
  "×",
  ",",
  ".",
  "+",
  "–",
  "—"
]), y0 = /[\p{P}\p{S}\p{Co}]/u, C0 = new RegExp("\\p{Emoji_Presentation}", "u"), _0 = /* @__PURE__ */ new Set([
  "?",
  "֊",
  "-",
  "‐",
  "‒",
  "–",
  "—",
  "…",
  "‼",
  "‽",
  "⁉"
]);
function S0(e) {
  return e >= 33 && e <= 47 && e !== 45 || e >= 58 && e <= 64 && e !== 63 || e >= 91 && e <= 96 || e >= 123 && e <= 126;
}
function Ta(e) {
  const t = e.charCodeAt(0);
  return t < 128 ? S0(t) : !_0.has(e) && !C0.test(e) && y0.test(e);
}
function ps(e) {
  let t = !1;
  for (const n of e)
    if (!nt.test(n)) {
      if (!Ta(n))
        return !1;
      t = !0;
    }
  return t;
}
function N0(e) {
  for (let t = e.length; t > 0; ) {
    const n = lo(e, t), o = e.slice(n, t);
    if (nt.test(o)) {
      t = n;
      continue;
    }
    return Ta(o) || uo(o);
  }
  return !1;
}
function E0(e, t, n, o) {
  const r = !t && ps(e), i = !o && ps(n), s = i0(e), a = (t || s) && N0(e);
  return !r && !i && !a || Le(e) || Le(n) ? !1 : (t || r || s) && (o || i);
}
function Ra(e) {
  for (const t of e)
    if (ti.test(t))
      return !0;
  return !1;
}
function Gn(e) {
  if (e.length === 0)
    return !1;
  for (const t of e)
    if (!(ti.test(t) || w0.has(t)))
      return !1;
  return !0;
}
function A0(e) {
  const t = [], n = [], o = [], r = [];
  for (let i = 0; i < e.len; i++) {
    const s = e.texts[i], a = e.kinds[i];
    if (a === "text" && Gn(s) && Ra(s)) {
      const l = [s];
      let c = i + 1;
      for (; c < e.len && e.kinds[c] === "text" && Gn(e.texts[c]); )
        l.push(e.texts[c]), c++;
      t.push(Ae(l)), n.push(!0), o.push("text"), r.push(e.starts[i]), i = c - 1;
      continue;
    }
    t.push(s), n.push(e.isWordLike[i]), o.push(a), r.push(e.starts[i]);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function F0(e) {
  const t = [], n = [], o = [], r = [];
  let i = 0;
  for (; i < e.len; ) {
    const s = e.texts[i], a = e.kinds[i], l = e.isWordLike[i];
    if (a === "text") {
      const c = [s];
      let u = i + 1, d = l;
      for (; u < e.len && e.kinds[u] === "text" && E0(e.texts[u - 1], e.isWordLike[u - 1], e.texts[u], e.isWordLike[u]); ) {
        const f = e.texts[u];
        c.push(f), d = d || e.isWordLike[u], u++;
      }
      if (u > i + 1) {
        t.push(Ae(c)), n.push(d), o.push("text"), r.push(e.starts[i]), i = u;
        continue;
      }
    }
    t.push(s), n.push(l), o.push(a), r.push(e.starts[i]), i++;
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function M0(e) {
  const t = [], n = [], o = [], r = [];
  for (let i = 0; i < e.len; i++) {
    const s = e.texts[i];
    if (e.kinds[i] === "text" && s.includes("-")) {
      const a = s.split("-");
      let l = a.length > 1;
      for (let c = 0; c < a.length; c++) {
        const u = a[c];
        if (!l)
          break;
        (u.length === 0 || !Ra(u) || !Gn(u)) && (l = !1);
      }
      if (l) {
        let c = 0;
        for (let u = 0; u < a.length; u++) {
          const d = a[u], f = u < a.length - 1 ? `${d}-` : d;
          t.push(f), n.push(!0), o.push("text"), r.push(e.starts[i] + c), c += f.length;
        }
        continue;
      }
    }
    t.push(s), n.push(e.isWordLike[i]), o.push(e.kinds[i]), r.push(e.starts[i]);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function k0(e) {
  const t = [], n = [], o = [], r = [];
  let i = 0;
  for (; i < e.len; ) {
    const s = [e.texts[i]];
    let a = e.isWordLike[i], l = e.kinds[i], c = e.starts[i];
    if (l === "glue") {
      const u = [s[0]], d = c;
      for (i++; i < e.len && e.kinds[i] === "glue"; )
        u.push(e.texts[i]), i++;
      const f = Ae(u);
      if (i < e.len && e.kinds[i] === "text")
        s[0] = f, s.push(e.texts[i]), a = e.isWordLike[i], l = "text", c = d, i++;
      else {
        t.push(f), n.push(!1), o.push("glue"), r.push(d);
        continue;
      }
    } else
      i++;
    if (l === "text")
      for (; i < e.len && e.kinds[i] === "glue"; ) {
        const u = [];
        for (; i < e.len && e.kinds[i] === "glue"; )
          u.push(e.texts[i]), i++;
        const d = Ae(u);
        if (i < e.len && e.kinds[i] === "text") {
          s.push(d, e.texts[i]), a = a || e.isWordLike[i], i++;
          continue;
        }
        s.push(d);
      }
    t.push(Ae(s)), n.push(a), o.push(l), r.push(c);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function P0(e) {
  const t = e.texts.slice(), n = e.isWordLike.slice(), o = e.kinds.slice(), r = e.starts.slice();
  for (let i = 0; i < t.length - 1; i++) {
    if (o[i] !== "text" || o[i + 1] !== "text" || !Le(t[i]) || !Le(t[i + 1]))
      continue;
    const s = a0(t[i]);
    s !== null && (t[i] = s.head, t[i + 1] = s.tail + t[i + 1], r[i + 1] = r[i] + s.head.length);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function D0(e, t, n) {
  const o = Vf();
  let r = 0;
  const i = [], s = [], a = [], l = [], c = [], u = [], d = [], f = [], p = [], x = [], h = [], m = [];
  for (const y of o.segment(e))
    for (const N of h0(y.segment, y.isWordLike ?? !1, y.index, n)) {
      let D = function() {
        u[B] !== null && (s[B] = [
          ds(i, u, d, B)
        ], u[B] = null), s[B].push(N.text), a[B] = a[B] || N.isWordLike, f[B] = f[B] || E, p[B] = p[B] || P, x[B] = H, h[B] = $, m[B] = fs(p[B], L);
      };
      const k = N.kind === "text", O = c0(N.text, N.isWordLike, N.kind), E = Le(N.text), P = ls(N.text), L = hn(N.text), H = gr(N.text), $ = l0(N.text), B = r - 1;
      t.carryCJKAfterClosingQuote && k && r > 0 && l[B] === "text" && E && f[B] && x[B] || k && r > 0 && l[B] === "text" && Qf(N.text) && f[B] || k && r > 0 && l[B] === "text" && h[B] ? D() : k && r > 0 && l[B] === "text" && N.isWordLike && P && m[B] ? (D(), a[B] = !0) : O !== null && r > 0 && l[B] === "text" && u[B] === O ? d[B] = (d[B] ?? 1) + 1 : k && !N.isWordLike && r > 0 && l[B] === "text" && !f[B] && (Zf(N.text) || N.text === "-" && a[B]) ? D() : (i[r] = N.text, s[r] = [N.text], a[r] = N.isWordLike, l[r] = N.kind, c[r] = N.start, u[r] = O, d[r] = O === null ? 0 : 1, f[r] = E, p[r] = P, x[r] = H, h[r] = $, m[r] = fs(P, L), r++);
    }
  for (let y = 0; y < r; y++) {
    if (u[y] !== null) {
      i[y] = ds(i, u, d, y);
      continue;
    }
    i[y] = Ae(s[y]);
  }
  for (let y = 1; y < r; y++)
    l[y] === "text" && !a[y] && ri(i[y]) && l[y - 1] === "text" && !f[y - 1] && (i[y - 1] += i[y], a[y - 1] = a[y - 1] || a[y], i[y] = "");
  const v = Array.from({ length: r }, () => null);
  let g = -1;
  for (let y = r - 1; y >= 0; y--) {
    const N = i[y];
    if (N.length !== 0) {
      if (l[y] === "text" && !a[y] && g >= 0 && l[g] === "text" && (e0(N) || N === "-" && s0(i[g]))) {
        const k = v[g] ?? [];
        k.push(N), v[g] = k, c[g] = c[y], i[y] = "";
        continue;
      }
      g = y;
    }
  }
  for (let y = 0; y < r; y++) {
    const N = v[y];
    N != null && (i[y] = p0(N, i[y]));
  }
  let w = 0;
  for (let y = 0; y < r; y++) {
    const N = i[y];
    N.length !== 0 && (w !== y && (i[w] = N, a[w] = a[y], l[w] = l[y], c[w] = c[y]), w++);
  }
  i.length = w, a.length = w, l.length = w, c.length = w;
  const _ = k0({
    len: w,
    texts: i,
    isWordLike: a,
    kinds: l,
    starts: c
  }), S = P0(F0(M0(A0(b0(g0(_))))));
  for (let y = 0; y < S.len - 1; y++) {
    const N = u0(S.texts[y]);
    N !== null && (S.kinds[y] !== "space" && S.kinds[y] !== "preserved-space" || S.kinds[y + 1] !== "text" || !ls(S.texts[y + 1]) || (S.texts[y] = N.space, S.isWordLike[y] = !1, S.kinds[y] = S.kinds[y] === "preserved-space" ? "preserved-space" : "space", S.texts[y + 1] = N.marks + S.texts[y + 1], S.starts[y + 1] = S.starts[y] + N.space.length));
  }
  return S;
}
function O0(e, t) {
  if (e.len === 0)
    return [];
  if (!t.preserveHardBreaks)
    return [{
      startSegmentIndex: 0,
      endSegmentIndex: e.len,
      consumedEndSegmentIndex: e.len
    }];
  const n = [];
  let o = 0;
  for (let r = 0; r < e.len; r++)
    e.kinds[r] === "hard-break" && (n.push({
      startSegmentIndex: o,
      endSegmentIndex: r,
      consumedEndSegmentIndex: r + 1
    }), o = r + 1);
  return o < e.len && n.push({
    startSegmentIndex: o,
    endSegmentIndex: e.len,
    consumedEndSegmentIndex: e.len
  }), n;
}
function T0(e, t, n) {
  if (t.len <= 1)
    return t;
  const o = [], r = [], i = [], s = [];
  let a = -1, l = !1;
  function c(f) {
    o.push(t.texts[f]), r.push(t.isWordLike[f]), i.push("text"), s.push(t.starts[f]);
  }
  function u(f, p) {
    let x = !1;
    for (let v = f; v < p; v++)
      x = x || t.isWordLike[v];
    const h = t.starts[f], m = p < t.len ? t.starts[p] : e.length;
    o.push(e.slice(h, m)), r.push(x), i.push("text"), s.push(h);
  }
  function d(f) {
    if (!(a < 0)) {
      if (l)
        a + 1 === f ? c(a) : u(a, f);
      else
        for (let p = a; p < f; p++)
          c(p);
      a = -1, l = !1;
    }
  }
  for (let f = 0; f < t.len; f++) {
    const p = t.texts[f], x = t.kinds[f];
    if (x === "text") {
      a >= 0 && !Oa(t.texts[f - 1], n) && d(f), a < 0 && (a = f), l = l || Le(p);
      continue;
    }
    d(f), o.push(p), r.push(t.isWordLike[f]), i.push(x), s.push(t.starts[f]);
  }
  return d(t.len), {
    len: o.length,
    texts: o,
    isWordLike: r,
    kinds: i,
    starts: s
  };
}
function R0(e, t, n = "normal", o = "normal") {
  const r = Lf(n), i = r.mode === "pre-wrap" ? Wf(e) : $f(e);
  if (i.length === 0)
    return {
      normalized: i,
      chunks: [],
      len: 0,
      texts: [],
      isWordLike: [],
      kinds: [],
      starts: []
    };
  const s = D0(i, t, r), a = o === "keep-all" ? T0(i, s, t.breakKeepAllAfterPunctuation) : s;
  return {
    normalized: i,
    chunks: O0(a, r),
    ...a
  };
}
let St = null;
const hs = /* @__PURE__ */ new Map();
let Nt = null;
const B0 = 96, I0 = new RegExp("\\p{Emoji_Presentation}", "u"), L0 = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;
let qo = null;
const xs = /* @__PURE__ */ new Map();
function ii() {
  if (St !== null)
    return St;
  if (typeof OffscreenCanvas < "u")
    return St = new OffscreenCanvas(1, 1).getContext("2d"), St;
  if (typeof document < "u")
    return St = document.createElement("canvas").getContext("2d"), St;
  throw new Error("Text measurement requires OffscreenCanvas or a DOM canvas context.");
}
function $0(e) {
  let t = hs.get(e);
  return t || (t = /* @__PURE__ */ new Map(), hs.set(e, t)), t;
}
function Je(e, t) {
  let n = t.get(e);
  return n === void 0 && (n = {
    width: ii().measureText(e).width,
    containsCJK: Le(e)
  }, t.set(e, n)), n;
}
function fo() {
  if (Nt !== null)
    return Nt;
  if (typeof navigator > "u")
    return Nt = {
      lineFitEpsilon: 5e-3,
      carryCJKAfterClosingQuote: !1,
      breakKeepAllAfterPunctuation: !0,
      preferPrefixWidthsForBreakableRuns: !1,
      preferEarlySoftHyphenBreak: !1
    }, Nt;
  const e = navigator.userAgent, n = navigator.vendor === "Apple Computer, Inc." && e.includes("Safari/") && !e.includes("Chrome/") && !e.includes("Chromium/") && !e.includes("CriOS/") && !e.includes("FxiOS/") && !e.includes("EdgiOS/"), o = e.includes("Chrome/") || e.includes("Chromium/") || e.includes("CriOS/") || e.includes("Edg/");
  return Nt = {
    lineFitEpsilon: n ? 1 / 64 : 5e-3,
    carryCJKAfterClosingQuote: o,
    breakKeepAllAfterPunctuation: !n,
    preferPrefixWidthsForBreakableRuns: n,
    preferEarlySoftHyphenBreak: n
  }, Nt;
}
function W0(e) {
  const t = e.match(/(\d+(?:\.\d+)?)\s*px/);
  return t ? parseFloat(t[1]) : 16;
}
function Ba() {
  return qo === null && (qo = new Intl.Segmenter(void 0, { granularity: "grapheme" })), qo;
}
function H0(e) {
  return I0.test(e) || e.includes("️");
}
function V0(e) {
  return L0.test(e);
}
function U0(e, t) {
  let n = xs.get(e);
  if (n !== void 0)
    return n;
  const o = ii();
  o.font = e;
  const r = o.measureText("😀").width;
  if (n = 0, r > t + 0.5 && typeof document < "u" && document.body !== null) {
    const i = document.createElement("span");
    i.style.font = e, i.style.display = "inline-block", i.style.visibility = "hidden", i.style.position = "absolute", i.textContent = "😀", document.body.appendChild(i);
    const s = i.getBoundingClientRect().width;
    document.body.removeChild(i), r - s > 0.5 && (n = r - s);
  }
  return xs.set(e, n), n;
}
function j0(e) {
  let t = 0;
  const n = Ba();
  for (const o of n.segment(e))
    H0(o.segment) && t++;
  return t;
}
function z0(e, t) {
  return t.emojiCount === void 0 && (t.emojiCount = j0(e)), t.emojiCount;
}
function lt(e, t, n) {
  return n === 0 ? t.width : t.width - z0(e, t) * n;
}
function K0(e, t, n, o, r) {
  if (t.breakableFitAdvances !== void 0 && t.breakableFitMode === r)
    return t.breakableFitAdvances;
  t.breakableFitMode = r;
  const i = Ba(), s = [];
  for (const u of i.segment(e))
    s.push(u.segment);
  if (s.length <= 1)
    return t.breakableFitAdvances = null, t.breakableFitAdvances;
  if (r === "sum-graphemes") {
    const u = [];
    for (const d of s) {
      const f = Je(d, n);
      u.push(lt(d, f, o));
    }
    return t.breakableFitAdvances = u, t.breakableFitAdvances;
  }
  if (r === "pair-context" || s.length > B0) {
    const u = [];
    let d = null, f = 0;
    for (const p of s) {
      const x = Je(p, n), h = lt(p, x, o);
      if (d === null)
        u.push(h);
      else {
        const m = d + p, v = Je(m, n);
        u.push(lt(m, v, o) - f);
      }
      d = p, f = h;
    }
    return t.breakableFitAdvances = u, t.breakableFitAdvances;
  }
  const a = [];
  let l = "", c = 0;
  for (const u of s) {
    l += u;
    const d = Je(l, n), f = lt(l, d, o);
    a.push(f - c), c = f;
  }
  return t.breakableFitAdvances = a, t.breakableFitAdvances;
}
function G0(e, t) {
  const n = ii();
  n.font = e;
  const o = $0(e), r = W0(e), i = t ? U0(e, r) : 0;
  return { cache: o, fontSize: r, emojiCorrection: i };
}
function Y0(e) {
  return e === "space" || e === "zero-width-break" || e === "soft-hyphen";
}
function Ia(e) {
  return e === "space" || e === "preserved-space" || e === "tab" || e === "zero-width-break" || e === "soft-hyphen";
}
function La(e, t, n = e.widths.length) {
  for (; t < n; ) {
    const o = e.kinds[t];
    if (!Y0(o))
      break;
    t++;
  }
  return t;
}
function X0(e, t) {
  if (t <= 0)
    return 0;
  const n = e % t;
  return Math.abs(n) <= 1e-6 ? t : t - n;
}
function J0(e, t, n) {
  return e.letterSpacing !== 0 && t && e.spacingGraphemeCounts[n] > 0 ? e.letterSpacing : 0;
}
function si(e, t) {
  return t === 0 ? 0 : e + t;
}
function q0(e, t) {
  return e.letterSpacing !== 0 && e.spacingGraphemeCounts[t] > 0 ? e.letterSpacing : 0;
}
function Z0(e, t, n, o, r) {
  const i = t === "tab" ? r + q0(e, n) : e.lineEndFitAdvances[n];
  return si(o, i);
}
function ms(e, t, n, o) {
  const r = t === "tab" ? 0 : e.lineEndFitAdvances[n];
  return si(o, r);
}
function vs(e, t, n, o, r) {
  const i = t === "tab" ? r : e.lineEndPaintAdvances[n];
  return si(o, i);
}
function Q0(e, t, n) {
  return e.letterSpacing !== 0 && t ? n + e.letterSpacing : n;
}
function ep(e, t) {
  return e.letterSpacing === 0 ? t : t + e.letterSpacing;
}
function Yn(e, t, n) {
  let o = t;
  for (; o < e.length && e[o] < n; )
    o++;
  return o;
}
function tp(e, t, n, o, r) {
  if (e.letterSpacing === 0)
    return 0;
  if (r > 0)
    return e.spacingGraphemeCounts[o] > 0 ? e.letterSpacing : 0;
  for (let i = o - 1; i >= t; i--) {
    const s = e.kinds[i];
    if (!(s === "space" || s === "zero-width-break" || s === "hard-break")) {
      if (s === "soft-hyphen") {
        if (i === o - 1)
          return 0;
        continue;
      }
      return i === t && n > 0 || e.spacingGraphemeCounts[i] > 0 ? e.letterSpacing : 0;
    }
  }
  return 0;
}
function np(e, t, n, o, r, i) {
  return t + tp(e, n, o, r, i);
}
function op(e, t) {
  return $a(e, t);
}
function rp(e, t, n) {
  const { widths: o, kinds: r, breakableFitAdvances: i, breakablePreferredBreaks: s } = e;
  if (o.length === 0)
    return 0;
  const l = fo().lineFitEpsilon, c = t + l;
  let u = 0, d = 0, f = !1, p = 0, x = 0, h = 0, m = 0, v = -1, g = 0;
  function w() {
    v = -1, g = 0;
  }
  function _(E = h, P = m, L = d) {
    u++, n?.(L, p, x, E, P), d = 0, f = !1, w();
  }
  function S(E, P) {
    f = !0, p = E, x = 0, h = E + 1, m = 0, d = P;
  }
  function y(E, P, L) {
    f = !0, p = E, x = P, h = E, m = P + 1, d = L;
  }
  function N(E, P) {
    if (!f) {
      S(E, P);
      return;
    }
    d += P, h = E + 1, m = 0;
  }
  function k(E, P) {
    const L = i[E], H = s[E] ?? null;
    let $ = H === null ? -1 : Yn(H, 0, P + 1), B = -1, D = 0, R = P;
    for (; R < L.length; ) {
      const A = L[R];
      if (!f)
        y(E, R, A);
      else if (d + A > c) {
        if (H !== null && B > P) {
          _(E, B, D), R = B, $ = Yn(H, $, R + 1), B = -1, D = 0;
          continue;
        }
        _(), y(E, R, A);
      } else
        d += A, h = E, m = R + 1;
      const T = R + 1;
      H !== null && H[$] === T && (B = T, D = d, $++), R++;
    }
    f && h === E && m === L.length && (h = E + 1, m = 0);
  }
  let O = 0;
  for (; O < o.length && !(!f && (O = La(e, O), O >= o.length)); ) {
    const E = o[O], P = r[O], L = Ia(P);
    if (!f) {
      E > c && i[O] !== null ? k(O, 0) : S(O, E), L && (v = O + 1, g = d - E), O++;
      continue;
    }
    if (d + E > c) {
      if (L) {
        N(O, E), _(O + 1, 0, d - E), O++;
        continue;
      }
      if (v >= 0) {
        if (h > v || h === v && m > 0) {
          _();
          continue;
        }
        _(v, 0, g);
        continue;
      }
      if (E > c && i[O] !== null) {
        _(), k(O, 0), O++;
        continue;
      }
      _();
      continue;
    }
    N(O, E), L && (v = O + 1, g = d - E), O++;
  }
  return f && _(), u;
}
function $a(e, t, n) {
  if (e.simpleLineWalkFastPath)
    return rp(e, t, n);
  const { widths: o, kinds: r, breakableFitAdvances: i, breakablePreferredBreaks: s, discretionaryHyphenWidth: a, chunks: l } = e;
  if (o.length === 0 || l.length === 0)
    return 0;
  const c = fo(), u = c.lineFitEpsilon, d = t + u;
  let f = 0, p = 0, x = !1, h = 0, m = 0, v = 0, g = 0, w = -1, _ = 0, S = 0, y = null;
  function N() {
    w = -1, _ = 0, S = 0, y = null;
  }
  function k() {
    return y === "soft-hyphen" && w === v && g === 0 ? S : p;
  }
  function O(D = v, R = g, A) {
    f++, n !== void 0 && n(np(e, A ?? k(), h, m, D, R), h, m, D, R), p = 0, x = !1, N();
  }
  function E(D, R) {
    x = !0, h = D, m = 0, v = D + 1, g = 0, p = R;
  }
  function P(D, R, A) {
    x = !0, h = D, m = R, v = D, g = R + 1, p = A;
  }
  function L(D, R) {
    if (!x) {
      E(D, R);
      return;
    }
    p += R, v = D + 1, g = 0;
  }
  function H(D, R, A, T, Y, X) {
    if (!R)
      return;
    const q = ms(e, D, A, Y), Z = vs(e, D, A, Y, T);
    w = A + 1, _ = p - X + q, S = p - X + Z, y = D;
  }
  function $(D, R) {
    const A = i[D], T = s[D] ?? null;
    let Y = T === null ? -1 : Yn(T, 0, R + 1), X = -1, q = 0, Z = R;
    for (; Z < A.length; ) {
      const re = A[Z];
      if (!x)
        P(D, Z, re);
      else {
        const de = Q0(e, !0, re), U = p + de;
        if (ep(e, U) > d) {
          if (T !== null && X > R) {
            O(D, X, q), Z = X, Y = Yn(T, Y, Z + 1), X = -1, q = 0;
            continue;
          }
          O(), P(D, Z, re);
        } else
          p = U, v = D, g = Z + 1;
      }
      const be = Z + 1;
      T !== null && T[Y] === be && (X = be, q = p, Y++), Z++;
    }
    x && v === D && g === A.length && (v = D + 1, g = 0);
  }
  function B(D) {
    f++, n?.(0, D.startSegmentIndex, 0, D.consumedEndSegmentIndex, 0), N();
  }
  for (let D = 0; D < l.length; D++) {
    const R = l[D];
    if (R.startSegmentIndex === R.endSegmentIndex) {
      B(R);
      continue;
    }
    x = !1, p = 0, h = R.startSegmentIndex, m = 0, v = R.startSegmentIndex, g = 0, N();
    let A = R.startSegmentIndex;
    for (; A < R.endSegmentIndex && !(!x && (A = La(e, A, R.endSegmentIndex), A >= R.endSegmentIndex)); ) {
      const T = r[A], Y = Ia(T), X = J0(e, x, A), q = T === "tab" ? X0(p + X, e.tabStopAdvance) : o[A], Z = X + q, re = Z0(e, T, A, X, q);
      if (T === "soft-hyphen") {
        x && (v = A + 1, g = 0, w = A + 1, _ = p + a, S = p + a, y = T), A++;
        continue;
      }
      if (!x) {
        re > d && i[A] !== null ? $(A, 0) : E(A, q), H(T, Y, A, q, X, Z), A++;
        continue;
      }
      if (p + re > d) {
        const de = p + ms(e, T, A, X), U = p + vs(e, T, A, X, q);
        if (y === "soft-hyphen" && c.preferEarlySoftHyphenBreak && _ <= d) {
          O(w, 0, S);
          continue;
        }
        if (Y && de <= d) {
          L(A, Z), O(A + 1, 0, U), A++;
          continue;
        }
        if (w >= 0 && _ <= d) {
          if (v > w || v === w && g > 0) {
            O();
            continue;
          }
          const Q = w;
          O(Q, 0, S), A = Q;
          continue;
        }
        if (re > d && i[A] !== null) {
          O(), $(A, 0), A++;
          continue;
        }
        O();
        continue;
      }
      L(A, Z), H(T, Y, A, q, X, Z), A++;
    }
    if (x) {
      const T = w === R.consumedEndSegmentIndex ? S : p;
      O(R.consumedEndSegmentIndex, 0, T);
    }
  }
  return f;
}
let Zo = null, gs = /* @__PURE__ */ new WeakMap();
function ip() {
  return Zo === null && (Zo = new Intl.Segmenter(void 0, { granularity: "grapheme" })), Zo;
}
function bs(e, t, n) {
  let o = n.get(e);
  if (o !== void 0)
    return o;
  o = [];
  const r = ip();
  for (const i of r.segment(t[e]))
    o.push(i.segment);
  return n.set(e, o), o;
}
function sp(e, t, n) {
  return n > t && e[n - 1] === "soft-hyphen";
}
function ws(e, t, n, o) {
  for (let r = n; r < o; r++)
    e += t[r];
  return e;
}
function ap(e) {
  let t = gs.get(e);
  return t !== void 0 || (t = /* @__PURE__ */ new Map(), gs.set(e, t)), t;
}
function cp(e, t, n, o, r, i) {
  let s = "";
  const a = sp(e.kinds, n, r);
  for (let l = n; l < r; l++)
    if (!(e.kinds[l] === "soft-hyphen" || e.kinds[l] === "hard-break"))
      if (l === n && o > 0) {
        const c = bs(l, e.segments, t);
        s = ws(s, c, o, c.length);
      } else
        s += e.segments[l];
  if (i > 0) {
    a && (s += "-");
    const l = bs(r, e.segments, t);
    s = ws(s, l, n === r ? o : 0, i);
  } else a && (s += "-");
  return s;
}
let Qo = null;
function ai() {
  return Qo === null && (Qo = new Intl.Segmenter(void 0, { granularity: "grapheme" })), Qo;
}
function lp(e) {
  return e ? {
    widths: [],
    lineEndFitAdvances: [],
    lineEndPaintAdvances: [],
    kinds: [],
    simpleLineWalkFastPath: !0,
    segLevels: null,
    breakableFitAdvances: [],
    breakablePreferredBreaks: [],
    letterSpacing: 0,
    spacingGraphemeCounts: [],
    discretionaryHyphenWidth: 0,
    tabStopAdvance: 0,
    chunks: [],
    segments: []
  } : {
    widths: [],
    lineEndFitAdvances: [],
    lineEndPaintAdvances: [],
    kinds: [],
    simpleLineWalkFastPath: !0,
    segLevels: null,
    breakableFitAdvances: [],
    breakablePreferredBreaks: [],
    letterSpacing: 0,
    spacingGraphemeCounts: [],
    discretionaryHyphenWidth: 0,
    tabStopAdvance: 0,
    chunks: []
  };
}
function up(e, t) {
  const n = [];
  let o = [], r = 0, i = !1, s = !1, a = !1;
  function l() {
    o.length !== 0 && (n.push({
      text: o.length === 1 ? o[0] : o.join(""),
      start: r
    }), o = [], i = !1, s = !1, a = !1);
  }
  function c(d, f, p) {
    o = [d], r = f, i = p, s = gr(d), a = co.has(d);
  }
  function u(d, f) {
    o.push(d), i = i || f;
    const p = gr(d);
    d.length === 1 && ht.has(d) ? s = s || p : s = p, a = !1;
  }
  for (const d of ai().segment(e)) {
    const f = d.segment, p = Le(f);
    if (o.length === 0) {
      c(f, d.index, p);
      continue;
    }
    if (a || ni.has(f) || ht.has(f) || t.carryCJKAfterClosingQuote && p && s) {
      u(f, p);
      continue;
    }
    if (!i && !p) {
      u(f, p);
      continue;
    }
    l(), c(f, d.index, p);
  }
  return l(), n;
}
function dp(e, t, n) {
  if (t.length <= 1)
    return t;
  const o = [];
  let r = -1, i = !1;
  function s(l, c) {
    const u = t[l].start, d = c < t.length ? t[c].start : e.length;
    o.push({
      text: e.slice(u, d),
      start: u
    });
  }
  function a(l) {
    if (!(r < 0)) {
      if (i)
        r + 1 === l ? o.push(t[r]) : s(r, l);
      else
        for (let c = r; c < l; c++)
          o.push(t[c]);
      r = -1, i = !1;
    }
  }
  for (let l = 0; l < t.length; l++) {
    const c = t[l];
    r >= 0 && !Oa(t[l - 1].text, n) && a(l), r < 0 && (r = l), i = i || Le(c.text);
  }
  return a(t.length), o;
}
function ys(e, t) {
  if (t === "zero-width-break" || t === "soft-hyphen" || t === "hard-break")
    return 0;
  if (t === "tab")
    return 1;
  let n = 0;
  const o = ai();
  for (const r of o.segment(e))
    n++;
  return n;
}
function fp(e) {
  return e === "-" || e === "֊" || e === "‐" || e === "‒" || e === "–" || e === "—";
}
function pp(e) {
  if (!/[-\u058A\u2010\u2012\u2013\u2014]/u.test(e))
    return null;
  const t = [];
  let n = 0;
  for (const o of ai().segment(e))
    n++, fp(o.segment) && t.push(n);
  return t.length === 0 ? null : t;
}
function hp(e, t, n) {
  return t > 1 ? e + (t - 1) * n : e;
}
function xp(e, t, n, o, r) {
  const i = fo(), { cache: s, emojiCorrection: a } = G0(t, V0(e.normalized)), l = lt("-", Je("-", s), a) + (r === 0 ? 0 : r * 2), u = lt(" ", Je(" ", s), a) * 8, d = r !== 0;
  if (e.len === 0)
    return lp(n);
  const f = [], p = [], x = [], h = [];
  let m = e.chunks.length <= 1 && !d;
  const v = n ? [] : null, g = [], w = [], _ = [], S = n ? [] : null, y = Array.from({ length: e.len });
  function N(P, L, H, $, B, D, R, A, T) {
    B !== "text" && B !== "space" && B !== "zero-width-break" && (m = !1), f.push(L), p.push(H), x.push($), h.push(B), v?.push(D), g.push(R), w.push(A), d && _.push(T), S !== null && S.push(P);
  }
  function k(P, L, H, $, B) {
    const D = Je(P, s), R = d ? ys(P, L) : 0, A = hp(lt(P, D, a), R, r), T = L === "space" || L === "preserved-space" || L === "zero-width-break" ? 0 : A, Y = T === 0 ? 0 : T + (R > 0 ? r : 0), X = L === "space" || L === "zero-width-break" ? 0 : A;
    if (B && $ && P.length > 1) {
      let q = "sum-graphemes";
      r !== 0 ? q = "segment-prefixes" : Gn(P) ? q = "pair-context" : i.preferPrefixWidthsForBreakableRuns && (q = "segment-prefixes");
      const Z = K0(P, D, s, a, q), re = Z === null || o === "keep-all" ? null : pp(P);
      N(P, A, Y, X, L, H, Z, re, R);
      return;
    }
    N(P, A, Y, X, L, H, null, null, R);
  }
  for (let P = 0; P < e.len; P++) {
    y[P] = f.length;
    const L = e.texts[P], H = e.isWordLike[P], $ = e.kinds[P], B = e.starts[P];
    if ($ === "soft-hyphen") {
      N(L, 0, l, l, $, B, null, null, 0);
      continue;
    }
    if ($ === "hard-break") {
      N(L, 0, 0, 0, $, B, null, null, 0);
      continue;
    }
    if ($ === "tab") {
      N(L, 0, 0, 0, $, B, null, null, d ? ys(L, $) : 0);
      continue;
    }
    const D = Je(L, s);
    if ($ === "text" && D.containsCJK) {
      const R = up(L, i), A = o === "keep-all" ? dp(L, R, i.breakKeepAllAfterPunctuation) : R;
      for (let T = 0; T < A.length; T++) {
        const Y = A[T];
        k(Y.text, "text", B + Y.start, H, o === "keep-all" || !Le(Y.text));
      }
      continue;
    }
    k(L, $, B, H, !0);
  }
  const O = mp(e.chunks, y, f.length), E = v === null ? null : Rf(e.normalized, v);
  return S !== null ? {
    widths: f,
    lineEndFitAdvances: p,
    lineEndPaintAdvances: x,
    kinds: h,
    simpleLineWalkFastPath: m,
    segLevels: E,
    breakableFitAdvances: g,
    breakablePreferredBreaks: w,
    letterSpacing: r,
    spacingGraphemeCounts: _,
    discretionaryHyphenWidth: l,
    tabStopAdvance: u,
    chunks: O,
    segments: S
  } : {
    widths: f,
    lineEndFitAdvances: p,
    lineEndPaintAdvances: x,
    kinds: h,
    simpleLineWalkFastPath: m,
    segLevels: E,
    breakableFitAdvances: g,
    breakablePreferredBreaks: w,
    letterSpacing: r,
    spacingGraphemeCounts: _,
    discretionaryHyphenWidth: l,
    tabStopAdvance: u,
    chunks: O
  };
}
function mp(e, t, n) {
  const o = [];
  for (let r = 0; r < e.length; r++) {
    const i = e[r], s = i.startSegmentIndex < t.length ? t[i.startSegmentIndex] : n, a = i.endSegmentIndex < t.length ? t[i.endSegmentIndex] : n, l = i.consumedEndSegmentIndex < t.length ? t[i.consumedEndSegmentIndex] : n;
    o.push({
      startSegmentIndex: s,
      endSegmentIndex: a,
      consumedEndSegmentIndex: l
    });
  }
  return o;
}
function Wa(e, t, n, o) {
  const r = o?.wordBreak ?? "normal", i = o?.letterSpacing ?? 0, s = R0(e, fo(), o?.whiteSpace, r);
  return xp(s, t, n, r, i);
}
function vp(e, t, n) {
  return Wa(e, t, !1, n);
}
function gp(e, t, n) {
  return Wa(e, t, !0, n);
}
function bp(e, t, n) {
  const o = op(e, t);
  return { lineCount: o, height: o * n };
}
function wp(e, t, n, o, r, i, s) {
  return {
    text: cp(e, t, o, r, i, s),
    width: n,
    start: {
      segmentIndex: o,
      graphemeIndex: r
    },
    end: {
      segmentIndex: i,
      graphemeIndex: s
    }
  };
}
function Ha(e, t, n) {
  const o = [];
  if (e.widths.length === 0)
    return { lineCount: 0, height: 0, lines: o };
  const r = ap(e), i = $a(e, t, (s, a, l, c, u) => {
    o.push(wp(e, r, s, a, l, c, u));
  });
  return { lineCount: i, height: i * n, lines: o };
}
const Fn = /* @__PURE__ */ new Map(), Mn = /* @__PURE__ */ new Map(), yp = 500;
function Va(e, t) {
  return `${t}\0${e}`;
}
function Ua(e) {
  if (e.size >= yp) {
    const t = e.keys().next().value;
    e.delete(t);
  }
}
function ja(e, t, n) {
  return e.delete(t), e.set(t, n), n;
}
function za(e) {
  return e === 1 ? { whiteSpace: "pre-wrap" } : void 0;
}
function Cp(e, t, n = 0) {
  const o = `${n}\0${Va(e, t)}`;
  let r = Fn.get(o);
  return r ? ja(Fn, o, r) : (r = vp(e, t, za(n)), Ua(Fn), Fn.set(o, r), r);
}
function Ka(e, t, n = 0) {
  const o = `${n}\0${Va(e, t)}`;
  let r = Mn.get(o);
  return r ? ja(Mn, o, r) : (r = gp(e, t, za(n)), Ua(Mn), Mn.set(o, r), r);
}
function Hw(e, t, n, o, r = 0) {
  const i = Cp(e, t, r), s = bp(i, n, o), a = new ArrayBuffer(12), l = new DataView(a);
  return l.setFloat64(0, s.height, !0), l.setInt32(8, s.lineCount, !0), new Uint8Array(a);
}
function Vw(e, t, n, o, r = 0) {
  const i = Ka(e, t, r), s = Ha(i, n, o), a = new TextEncoder(), l = s.lines.map((x) => a.encode(x.text));
  let c = 16;
  for (const x of l)
    c += 2 + x.length + 8;
  const u = new ArrayBuffer(c), d = new DataView(u), f = new Uint8Array(u);
  let p = 0;
  d.setFloat64(p, s.height, !0), p += 8, d.setInt32(p, s.lineCount, !0), p += 4, d.setInt32(p, s.lines.length, !0), p += 4;
  for (let x = 0; x < s.lines.length; x++) {
    const h = s.lines[x], m = l[x];
    d.setUint16(p, m.length, !0), p += 2, f.set(m, p), p += m.length, d.setFloat64(p, h.width, !0), p += 8;
  }
  return new Uint8Array(u, 0, p);
}
function _p(e, t, n, o, r, i) {
  const s = e.font, a = Ka(t, s), { lines: l } = Ha(a, r, i);
  for (let c = 0; c < l.length; c++)
    e.fillText(l[c].text, n, o + c * i);
}
const Cs = /* @__PURE__ */ new Map(), kn = /* @__PURE__ */ new Set();
function er(e) {
  const t = Cs.get(e);
  if (t) return t;
  if (kn.has(e)) return null;
  kn.add(e);
  const n = new Image();
  return n.onload = () => {
    Cs.set(e, n), kn.delete(e);
  }, n.onerror = () => {
    kn.delete(e), console.warn(`VoGUI: Failed to load image: ${e}`);
  }, n.src = e, null;
}
function Sp(e, t) {
  const n = t.get(e.ref);
  if (!n || !(n instanceof HTMLCanvasElement)) {
    console.warn(`VoGUI: Canvas ref "${e.ref}" not found or not a canvas element`);
    return;
  }
  const o = n.getContext("2d");
  if (o)
    for (const r of e.cmds)
      Np(o, n, r);
}
function Np(e, t, n) {
  const o = n.a || [];
  switch (n.c) {
    case "clear":
      e.clearRect(0, 0, t.width, t.height);
      break;
    case "fill":
      e.fillStyle = o[0];
      break;
    case "stroke":
      e.strokeStyle = o[0];
      break;
    case "lw":
      e.lineWidth = o[0];
      break;
    case "font":
      e.font = o[0];
      break;
    case "alpha":
      e.globalAlpha = o[0];
      break;
    case "ta":
      e.textAlign = o[0];
      break;
    case "tb":
      e.textBaseline = o[0];
      break;
    case "lc":
      e.lineCap = o[0];
      break;
    case "lj":
      e.lineJoin = o[0];
      break;
    case "shadow":
      e.shadowOffsetX = o[0], e.shadowOffsetY = o[1], e.shadowBlur = o[2], e.shadowColor = o[3];
      break;
    case "fr":
      e.fillRect(o[0], o[1], o[2], o[3]);
      break;
    case "sr":
      e.strokeRect(o[0], o[1], o[2], o[3]);
      break;
    case "cr":
      e.clearRect(o[0], o[1], o[2], o[3]);
      break;
    case "fc":
      e.beginPath(), e.arc(o[0], o[1], o[2], 0, Math.PI * 2), e.fill();
      break;
    case "sc":
      e.beginPath(), e.arc(o[0], o[1], o[2], 0, Math.PI * 2), e.stroke();
      break;
    case "frr":
      _s(e, o[0], o[1], o[2], o[3], o[4]), e.fill();
      break;
    case "srr":
      _s(e, o[0], o[1], o[2], o[3], o[4]), e.stroke();
      break;
    case "fe":
      e.beginPath(), e.ellipse(o[0], o[1], o[2], o[3], 0, 0, Math.PI * 2), e.fill();
      break;
    case "se":
      e.beginPath(), e.ellipse(o[0], o[1], o[2], o[3], 0, 0, Math.PI * 2), e.stroke();
      break;
    case "bp":
      e.beginPath();
      break;
    case "mt":
      e.moveTo(o[0], o[1]);
      break;
    case "lt":
      e.lineTo(o[0], o[1]);
      break;
    case "at":
      e.arcTo(o[0], o[1], o[2], o[3], o[4]);
      break;
    case "arc":
      e.arc(o[0], o[1], o[2], o[3], o[4]);
      break;
    case "qct":
      e.quadraticCurveTo(o[0], o[1], o[2], o[3]);
      break;
    case "bct":
      e.bezierCurveTo(o[0], o[1], o[2], o[3], o[4], o[5]);
      break;
    case "cp":
      e.closePath();
      break;
    case "f":
      e.fill();
      break;
    case "s":
      e.stroke();
      break;
    case "clip":
      e.clip();
      break;
    case "ft":
      e.fillText(o[0], o[1], o[2]);
      break;
    case "st":
      e.strokeText(o[0], o[1], o[2]);
      break;
    case "ftw":
      _p(e, o[0], o[1], o[2], o[3], o[4]);
      break;
    case "di": {
      const r = er(o[0]);
      r && e.drawImage(r, o[1], o[2]);
      break;
    }
    case "dis": {
      const r = er(o[0]);
      r && e.drawImage(r, o[1], o[2], o[3], o[4]);
      break;
    }
    case "disub": {
      const r = er(o[0]);
      r && e.drawImage(r, o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8]);
      break;
    }
    case "save":
      e.save();
      break;
    case "rest":
      e.restore();
      break;
    case "tr":
      e.translate(o[0], o[1]);
      break;
    case "rot":
      e.rotate(o[0]);
      break;
    case "scl":
      e.scale(o[0], o[1]);
      break;
    case "rt":
      e.resetTransform();
      break;
    case "lg": {
      const r = e.createLinearGradient(o[0], o[1], o[2], o[3]), i = o[4];
      for (const s of i) r.addColorStop(s.offset, s.color);
      e.fillStyle = r;
      break;
    }
    case "rg": {
      const r = e.createRadialGradient(o[0], o[1], o[2], o[3], o[4], o[5]), i = o[6];
      for (const s of i) r.addColorStop(s.offset, s.color);
      e.fillStyle = r;
      break;
    }
    default:
      console.warn(`VoGUI: Unknown canvas command: ${n.c}`);
  }
}
function _s(e, t, n, o, r, i) {
  e.beginPath(), e.moveTo(t + i, n), e.lineTo(t + o - i, n), e.arcTo(t + o, n, t + o, n + i, i), e.lineTo(t + o, n + r - i), e.arcTo(t + o, n + r, t + o - i, n + r, i), e.lineTo(t + i, n + r), e.arcTo(t, n + r, t, n + r - i, i), e.lineTo(t, n + i), e.arcTo(t, n, t + i, n, i), e.closePath();
}
const Ep = {
  default: "bg-muted text-foreground hover:bg-muted/80",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  destructive: "bg-danger text-danger-foreground hover:bg-danger/90",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90",
  error: "bg-danger text-danger-foreground hover:bg-danger/90",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline bg-transparent"
}, Ap = {
  xs: "h-7 px-2 text-xs rounded-sm",
  sm: "h-8 px-3 text-xs rounded-sm",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-6 text-sm rounded-md",
  xl: "h-12 px-8 text-base rounded-lg",
  icon: "h-9 w-9 rounded-md"
}, Fp = F(function(t, n) {
  const {
    textContent: o,
    onClick: r,
    variant: i,
    size: s,
    disabled: a,
    icon: l,
    class: c,
    className: u,
    ...d
  } = t, f = c || "", p = se(t), x = typeof r == "function" ? r : void 0, h = typeof r == "number" ? r : void 0, m = [
    "inline-flex items-center justify-center font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    Ep[i || "default"],
    Ap[s || "md"],
    u,
    f
  ].filter(Boolean).join(" ");
  return C("button", {
    ...d,
    ref: n,
    className: m,
    style: p,
    disabled: a || !1,
    onClick: (v) => {
      x?.(v), !v.defaultPrevented && h != null && J(h, "{}");
    }
  }, l ? C("span", { className: "vo-icon" }, l) : null, o != null ? String(o) : null);
});
function Ss(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function po(...e) {
  return (t) => {
    let n = !1;
    const o = e.map((r) => {
      const i = Ss(r, t);
      return !n && typeof i == "function" && (n = !0), i;
    });
    if (n)
      return () => {
        for (let r = 0; r < o.length; r++) {
          const i = o[r];
          typeof i == "function" ? i() : Ss(e[r], null);
        }
      };
  };
}
function G(...e) {
  return j(po(...e), e);
}
var Mp = 0;
function b(e, t, n, o, r, i) {
  t || (t = {});
  var s, a, l = t;
  if ("ref" in l) for (a in l = {}, t) a == "ref" ? s = t[a] : l[a] = t[a];
  var c = { type: e, props: l, key: n, ref: s, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --Mp, __i: -1, __u: 0, __source: r, __self: i };
  if (typeof e == "function" && (s = e.defaultProps)) for (a in s) l[a] === void 0 && (l[a] = s[a]);
  return K.vnode && K.vnode(c), c;
}
function pe(e, t = []) {
  let n = [];
  function o(i, s) {
    const a = pt(s), l = n.length;
    n = [...n, s];
    const c = (d) => {
      const { scope: f, children: p, ...x } = d, h = f?.[e]?.[l] || a, m = ue(() => x, Object.values(x));
      return /* @__PURE__ */ b(h.Provider, { value: m, children: p });
    };
    c.displayName = i + "Provider";
    function u(d, f) {
      const p = f?.[e]?.[l] || a, x = tt(p);
      if (x) return x;
      if (s !== void 0) return s;
      throw new Error(`\`${d}\` must be used within \`${i}\``);
    }
    return [c, u];
  }
  const r = () => {
    const i = n.map((s) => pt(s));
    return function(a) {
      const l = a?.[e] || i;
      return ue(
        () => ({ [`__scope${e}`]: { ...a, [e]: l } }),
        [a, l]
      );
    };
  };
  return r.scopeName = e, [o, kp(r, ...t)];
}
function kp(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const o = e.map((r) => ({
      useScope: r(),
      scopeName: r.scopeName
    }));
    return function(i) {
      const s = o.reduce((a, { useScope: l, scopeName: c }) => {
        const d = l(i)[`__scope${c}`];
        return { ...a, ...d };
      }, {});
      return ue(() => ({ [`__scope${t.scopeName}`]: s }), [s]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
function I(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(r) {
    if (e?.(r), n === !1 || !r.defaultPrevented)
      return t?.(r);
  };
}
var fe = globalThis?.document ? Se : () => {
}, Pp = Pa[" useInsertionEffect ".trim().toString()] || fe;
function ve({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: o
}) {
  const [r, i, s] = Dp({
    defaultProp: t,
    onChange: n
  }), a = e !== void 0, l = a ? e : r;
  {
    const u = M(e !== void 0);
    W(() => {
      const d = u.current;
      d !== a && console.warn(
        `${o} is changing from ${d ? "controlled" : "uncontrolled"} to ${a ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = a;
    }, [a, o]);
  }
  const c = j(
    (u) => {
      if (a) {
        const d = Op(u) ? u(e) : u;
        d !== e && s.current?.(d);
      } else
        i(u);
    },
    [a, e, i, s]
  );
  return [l, c];
}
function Dp({
  defaultProp: e,
  onChange: t
}) {
  const [n, o] = V(e), r = M(n), i = M(t);
  return Pp(() => {
    i.current = t;
  }, [t]), W(() => {
    r.current !== n && (i.current?.(n), r.current = n);
  }, [n, r]), [n, o, i];
}
function Op(e) {
  return typeof e == "function";
}
function ho(e) {
  const t = M({ value: e, previous: e });
  return ue(() => (t.current.value !== e && (t.current.previous = t.current.value, t.current.value = e), t.current.previous), [e]);
}
function xo(e) {
  const [t, n] = V(void 0);
  return fe(() => {
    if (e) {
      n({ width: e.offsetWidth, height: e.offsetHeight });
      const o = new ResizeObserver((r) => {
        if (!Array.isArray(r) || !r.length)
          return;
        const i = r[0];
        let s, a;
        if ("borderBoxSize" in i) {
          const l = i.borderBoxSize, c = Array.isArray(l) ? l[0] : l;
          s = c.inlineSize, a = c.blockSize;
        } else
          s = e.offsetWidth, a = e.offsetHeight;
        n({ width: s, height: a });
      });
      return o.observe(e, { box: "border-box" }), () => o.unobserve(e);
    } else
      n(void 0);
  }, [e]), t;
}
function Tp(e, t) {
  return fn((n, o) => t[n][o] ?? n, e);
}
var ge = (e) => {
  const { present: t, children: n } = e, o = Rp(t), r = typeof n == "function" ? n({ present: o.isPresent }) : Ue.only(n), i = G(o.ref, Bp(r));
  return typeof n == "function" || o.isPresent ? $t(r, { ref: i }) : null;
};
ge.displayName = "Presence";
function Rp(e) {
  const [t, n] = V(), o = M(null), r = M(e), i = M("none"), s = e ? "mounted" : "unmounted", [a, l] = Tp(s, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return W(() => {
    const c = Pn(o.current);
    i.current = a === "mounted" ? c : "none";
  }, [a]), fe(() => {
    const c = o.current, u = r.current;
    if (u !== e) {
      const f = i.current, p = Pn(c);
      e ? l("MOUNT") : p === "none" || c?.display === "none" ? l("UNMOUNT") : l(u && f !== p ? "ANIMATION_OUT" : "UNMOUNT"), r.current = e;
    }
  }, [e, l]), fe(() => {
    if (t) {
      let c;
      const u = t.ownerDocument.defaultView ?? window, d = (p) => {
        const h = Pn(o.current).includes(CSS.escape(p.animationName));
        if (p.target === t && h && (l("ANIMATION_END"), !r.current)) {
          const m = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", c = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = m);
          });
        }
      }, f = (p) => {
        p.target === t && (i.current = Pn(o.current));
      };
      return t.addEventListener("animationstart", f), t.addEventListener("animationcancel", d), t.addEventListener("animationend", d), () => {
        u.clearTimeout(c), t.removeEventListener("animationstart", f), t.removeEventListener("animationcancel", d), t.removeEventListener("animationend", d);
      };
    } else
      l("ANIMATION_END");
  }, [t, l]), {
    isPresent: ["mounted", "unmountSuspended"].includes(a),
    ref: j((c) => {
      o.current = c ? getComputedStyle(c) : null, n(c);
    }, [])
  };
}
function Pn(e) {
  return e?.animationName || "none";
}
function Bp(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
// @__NO_SIDE_EFFECTS__
function Tt(e) {
  const t = /* @__PURE__ */ Ip(e), n = F((o, r) => {
    const { children: i, ...s } = o, a = Ue.toArray(i), l = a.find($p);
    if (l) {
      const c = l.props.children, u = a.map((d) => d === l ? Ue.count(c) > 1 ? Ue.only(null) : ze(c) ? c.props.children : null : d);
      return /* @__PURE__ */ b(t, { ...s, ref: r, children: ze(c) ? $t(c, void 0, u) : null });
    }
    return /* @__PURE__ */ b(t, { ...s, ref: r, children: i });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function Ip(e) {
  const t = F((n, o) => {
    const { children: r, ...i } = n;
    if (ze(r)) {
      const s = Hp(r), a = Wp(i, r.props);
      return r.type !== ce && (a.ref = o ? po(o, s) : s), $t(r, a);
    }
    return Ue.count(r) > 1 ? Ue.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var Ga = /* @__PURE__ */ Symbol("radix.slottable");
// @__NO_SIDE_EFFECTS__
function Lp(e) {
  const t = ({ children: n }) => /* @__PURE__ */ b(ce, { children: n });
  return t.displayName = `${e}.Slottable`, t.__radixId = Ga, t;
}
function $p(e) {
  return ze(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === Ga;
}
function Wp(e, t) {
  const n = { ...t };
  for (const o in t) {
    const r = e[o], i = t[o];
    /^on[A-Z]/.test(o) ? r && i ? n[o] = (...a) => {
      const l = i(...a);
      return r(...a), l;
    } : r && (n[o] = r) : o === "style" ? n[o] = { ...r, ...i } : o === "className" && (n[o] = [r, i].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function Hp(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var Vp = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], z = Vp.reduce((e, t) => {
  const n = /* @__PURE__ */ Tt(`Primitive.${t}`), o = F((r, i) => {
    const { asChild: s, ...a } = r, l = s ? n : t;
    return typeof window < "u" && (window[/* @__PURE__ */ Symbol.for("radix-ui")] = !0), /* @__PURE__ */ b(l, { ...a, ref: i });
  });
  return o.displayName = `Primitive.${t}`, { ...e, [t]: o };
}, {});
function Ya(e, t) {
  e && ao(() => e.dispatchEvent(t));
}
var mo = "Checkbox", [Up] = pe(mo), [jp, ci] = Up(mo);
function zp(e) {
  const {
    __scopeCheckbox: t,
    checked: n,
    children: o,
    defaultChecked: r,
    disabled: i,
    form: s,
    name: a,
    onCheckedChange: l,
    required: c,
    value: u = "on",
    // @ts-expect-error
    internal_do_not_use_render: d
  } = e, [f, p] = ve({
    prop: n,
    defaultProp: r ?? !1,
    onChange: l,
    caller: mo
  }), [x, h] = V(null), [m, v] = V(null), g = M(!1), w = x ? !!s || !!x.closest("form") : (
    // We set this to true by default so that events bubble to forms without JS (SSR)
    !0
  ), _ = {
    checked: f,
    disabled: i,
    setChecked: p,
    control: x,
    setControl: h,
    name: a,
    form: s,
    value: u,
    hasConsumerStoppedPropagationRef: g,
    required: c,
    defaultChecked: qe(r) ? !1 : r,
    isFormControl: w,
    bubbleInput: m,
    setBubbleInput: v
  };
  return /* @__PURE__ */ b(
    jp,
    {
      scope: t,
      ..._,
      children: Kp(d) ? d(_) : o
    }
  );
}
var Xa = "CheckboxTrigger", Ja = F(
  ({ __scopeCheckbox: e, onKeyDown: t, onClick: n, ...o }, r) => {
    const {
      control: i,
      value: s,
      disabled: a,
      checked: l,
      required: c,
      setControl: u,
      setChecked: d,
      hasConsumerStoppedPropagationRef: f,
      isFormControl: p,
      bubbleInput: x
    } = ci(Xa, e), h = G(r, u), m = M(l);
    return W(() => {
      const v = i?.form;
      if (v) {
        const g = () => d(m.current);
        return v.addEventListener("reset", g), () => v.removeEventListener("reset", g);
      }
    }, [i, d]), /* @__PURE__ */ b(
      z.button,
      {
        type: "button",
        role: "checkbox",
        "aria-checked": qe(l) ? "mixed" : l,
        "aria-required": c,
        "data-state": nc(l),
        "data-disabled": a ? "" : void 0,
        disabled: a,
        value: s,
        ...o,
        ref: h,
        onKeyDown: I(t, (v) => {
          v.key === "Enter" && v.preventDefault();
        }),
        onClick: I(n, (v) => {
          d((g) => qe(g) ? !0 : !g), x && p && (f.current = v.isPropagationStopped(), f.current || v.stopPropagation());
        })
      }
    );
  }
);
Ja.displayName = Xa;
var qa = F(
  (e, t) => {
    const {
      __scopeCheckbox: n,
      name: o,
      checked: r,
      defaultChecked: i,
      required: s,
      disabled: a,
      value: l,
      onCheckedChange: c,
      form: u,
      ...d
    } = e;
    return /* @__PURE__ */ b(
      zp,
      {
        __scopeCheckbox: n,
        checked: r,
        defaultChecked: i,
        disabled: a,
        required: s,
        onCheckedChange: c,
        name: o,
        form: u,
        value: l,
        internal_do_not_use_render: ({ isFormControl: f }) => /* @__PURE__ */ b(ce, { children: [
          /* @__PURE__ */ b(
            Ja,
            {
              ...d,
              ref: t,
              __scopeCheckbox: n
            }
          ),
          f && /* @__PURE__ */ b(
            tc,
            {
              __scopeCheckbox: n
            }
          )
        ] })
      }
    );
  }
);
qa.displayName = mo;
var Za = "CheckboxIndicator", Qa = F(
  (e, t) => {
    const { __scopeCheckbox: n, forceMount: o, ...r } = e, i = ci(Za, n);
    return /* @__PURE__ */ b(
      ge,
      {
        present: o || qe(i.checked) || i.checked === !0,
        children: /* @__PURE__ */ b(
          z.span,
          {
            "data-state": nc(i.checked),
            "data-disabled": i.disabled ? "" : void 0,
            ...r,
            ref: t,
            style: { pointerEvents: "none", ...e.style }
          }
        )
      }
    );
  }
);
Qa.displayName = Za;
var ec = "CheckboxBubbleInput", tc = F(
  ({ __scopeCheckbox: e, ...t }, n) => {
    const {
      control: o,
      hasConsumerStoppedPropagationRef: r,
      checked: i,
      defaultChecked: s,
      required: a,
      disabled: l,
      name: c,
      value: u,
      form: d,
      bubbleInput: f,
      setBubbleInput: p
    } = ci(ec, e), x = G(n, p), h = ho(i), m = xo(o);
    W(() => {
      const g = f;
      if (!g) return;
      const w = window.HTMLInputElement.prototype, S = Object.getOwnPropertyDescriptor(
        w,
        "checked"
      ).set, y = !r.current;
      if (h !== i && S) {
        const N = new Event("click", { bubbles: y });
        g.indeterminate = qe(i), S.call(g, qe(i) ? !1 : i), g.dispatchEvent(N);
      }
    }, [f, h, i, r]);
    const v = M(qe(i) ? !1 : i);
    return /* @__PURE__ */ b(
      z.input,
      {
        type: "checkbox",
        "aria-hidden": !0,
        defaultChecked: s ?? v.current,
        required: a,
        disabled: l,
        name: c,
        value: u,
        form: d,
        ...t,
        tabIndex: -1,
        ref: x,
        style: {
          ...t.style,
          ...m,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0,
          // We transform because the input is absolutely positioned but we have
          // rendered it **after** the button. This pulls it back to sit on top
          // of the button.
          transform: "translateX(-100%)"
        }
      }
    );
  }
);
tc.displayName = ec;
function Kp(e) {
  return typeof e == "function";
}
function qe(e) {
  return e === "indeterminate";
}
function nc(e) {
  return qe(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function Gp(e) {
  const { textContent: t, checked: n, onChange: o, disabled: r } = e, i = e.class || "", s = se(e);
  return C(
    "label",
    {
      className: ["flex items-center gap-2 text-sm cursor-pointer", i].filter(Boolean).join(" "),
      style: s
    },
    C(
      qa,
      {
        className: [
          "peer h-4 w-4 shrink-0 rounded-sm border border-input shadow",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
        ].join(" "),
        checked: !!n,
        disabled: r || !1,
        onCheckedChange: (a) => {
          o != null && J(o, JSON.stringify({ Checked: a }));
        }
      },
      C(
        Qa,
        { className: "flex items-center justify-center text-current" },
        C(
          "svg",
          { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" },
          C("polyline", { points: "20 6 9 17 4 12" })
        )
      )
    ),
    t ? C("span", null, t) : null
  );
}
var vo = "Switch", [Yp] = pe(vo), [Xp, Jp] = Yp(vo), oc = F(
  (e, t) => {
    const {
      __scopeSwitch: n,
      name: o,
      checked: r,
      defaultChecked: i,
      required: s,
      disabled: a,
      value: l = "on",
      onCheckedChange: c,
      form: u,
      ...d
    } = e, [f, p] = V(null), x = G(t, (w) => p(w)), h = M(!1), m = f ? u || !!f.closest("form") : !0, [v, g] = ve({
      prop: r,
      defaultProp: i ?? !1,
      onChange: c,
      caller: vo
    });
    return /* @__PURE__ */ b(Xp, { scope: n, checked: v, disabled: a, children: [
      /* @__PURE__ */ b(
        z.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": v,
          "aria-required": s,
          "data-state": ac(v),
          "data-disabled": a ? "" : void 0,
          disabled: a,
          value: l,
          ...d,
          ref: x,
          onClick: I(e.onClick, (w) => {
            g((_) => !_), m && (h.current = w.isPropagationStopped(), h.current || w.stopPropagation());
          })
        }
      ),
      m && /* @__PURE__ */ b(
        sc,
        {
          control: f,
          bubbles: !h.current,
          name: o,
          value: l,
          checked: v,
          required: s,
          disabled: a,
          form: u,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
oc.displayName = vo;
var rc = "SwitchThumb", ic = F(
  (e, t) => {
    const { __scopeSwitch: n, ...o } = e, r = Jp(rc, n);
    return /* @__PURE__ */ b(
      z.span,
      {
        "data-state": ac(r.checked),
        "data-disabled": r.disabled ? "" : void 0,
        ...o,
        ref: t
      }
    );
  }
);
ic.displayName = rc;
var qp = "SwitchBubbleInput", sc = F(
  ({
    __scopeSwitch: e,
    control: t,
    checked: n,
    bubbles: o = !0,
    ...r
  }, i) => {
    const s = M(null), a = G(s, i), l = ho(n), c = xo(t);
    return W(() => {
      const u = s.current;
      if (!u) return;
      const d = window.HTMLInputElement.prototype, p = Object.getOwnPropertyDescriptor(
        d,
        "checked"
      ).set;
      if (l !== n && p) {
        const x = new Event("click", { bubbles: o });
        p.call(u, n), u.dispatchEvent(x);
      }
    }, [l, n, o]), /* @__PURE__ */ b(
      "input",
      {
        type: "checkbox",
        "aria-hidden": !0,
        defaultChecked: n,
        ...r,
        tabIndex: -1,
        ref: a,
        style: {
          ...r.style,
          ...c,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0
        }
      }
    );
  }
);
sc.displayName = qp;
function ac(e) {
  return e ? "checked" : "unchecked";
}
var Zp = oc, Qp = ic;
function eh(e) {
  const { textContent: t, checked: n, onChange: o, disabled: r } = e, i = e.class || "", s = se(e);
  return C(
    "label",
    {
      className: ["flex items-center gap-2 text-sm cursor-pointer", i].filter(Boolean).join(" "),
      style: s
    },
    C(
      Zp,
      {
        className: [
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
        ].join(" "),
        checked: !!n,
        disabled: r || !1,
        onCheckedChange: (a) => {
          o != null && J(o, JSON.stringify({ Checked: a }));
        }
      },
      C(Qp, {
        className: [
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        ].join(" ")
      })
    ),
    t ? C("span", null, t) : null
  );
}
function Xn(e, [t, n]) {
  return Math.min(n, Math.max(t, e));
}
var th = pt(void 0);
function Wt(e) {
  const t = tt(th);
  return e || t || "ltr";
}
function xn(e) {
  const t = e + "CollectionProvider", [n, o] = pe(t), [r, i] = n(
    t,
    { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
  ), s = (h) => {
    const { scope: m, children: v } = h, g = ie.useRef(null), w = ie.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ b(r, { scope: m, itemMap: w, collectionRef: g, children: v });
  };
  s.displayName = t;
  const a = e + "CollectionSlot", l = /* @__PURE__ */ Tt(a), c = ie.forwardRef(
    (h, m) => {
      const { scope: v, children: g } = h, w = i(a, v), _ = G(m, w.collectionRef);
      return /* @__PURE__ */ b(l, { ref: _, children: g });
    }
  );
  c.displayName = a;
  const u = e + "CollectionItemSlot", d = "data-radix-collection-item", f = /* @__PURE__ */ Tt(u), p = ie.forwardRef(
    (h, m) => {
      const { scope: v, children: g, ...w } = h, _ = ie.useRef(null), S = G(m, _), y = i(u, v);
      return ie.useEffect(() => (y.itemMap.set(_, { ref: _, ...w }), () => {
        y.itemMap.delete(_);
      })), /* @__PURE__ */ b(f, { [d]: "", ref: S, children: g });
    }
  );
  p.displayName = u;
  function x(h) {
    const m = i(e + "CollectionConsumer", h);
    return ie.useCallback(() => {
      const g = m.collectionRef.current;
      if (!g) return [];
      const w = Array.from(g.querySelectorAll(`[${d}]`));
      return Array.from(m.itemMap.values()).sort(
        (y, N) => w.indexOf(y.ref.current) - w.indexOf(N.ref.current)
      );
    }, [m.collectionRef, m.itemMap]);
  }
  return [
    { Provider: s, Slot: c, ItemSlot: p },
    x,
    o
  ];
}
var cc = ["PageUp", "PageDown"], lc = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], uc = {
  "from-left": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-right": ["Home", "PageDown", "ArrowDown", "ArrowRight"],
  "from-bottom": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-top": ["Home", "PageDown", "ArrowUp", "ArrowLeft"]
}, Ht = "Slider", [wr, nh, oh] = xn(Ht), [dc] = pe(Ht, [
  oh
]), [rh, go] = dc(Ht), fc = F(
  (e, t) => {
    const {
      name: n,
      min: o = 0,
      max: r = 100,
      step: i = 1,
      orientation: s = "horizontal",
      disabled: a = !1,
      minStepsBetweenThumbs: l = 0,
      defaultValue: c = [o],
      value: u,
      onValueChange: d = () => {
      },
      onValueCommit: f = () => {
      },
      inverted: p = !1,
      form: x,
      ...h
    } = e, m = M(/* @__PURE__ */ new Set()), v = M(0), w = s === "horizontal" ? ih : sh, [_ = [], S] = ve({
      prop: u,
      defaultProp: c,
      onChange: (P) => {
        [...m.current][v.current]?.focus(), d(P);
      }
    }), y = M(_);
    function N(P) {
      const L = dh(_, P);
      E(P, L);
    }
    function k(P) {
      E(P, v.current);
    }
    function O() {
      const P = y.current[v.current];
      _[v.current] !== P && f(_);
    }
    function E(P, L, { commit: H } = { commit: !1 }) {
      const $ = xh(i), B = mh(Math.round((P - o) / i) * i + o, $), D = Xn(B, [o, r]);
      S((R = []) => {
        const A = lh(R, D, L);
        if (hh(A, l * i)) {
          v.current = A.indexOf(D);
          const T = String(A) !== String(R);
          return T && H && f(A), T ? A : R;
        } else
          return R;
      });
    }
    return /* @__PURE__ */ b(
      rh,
      {
        scope: e.__scopeSlider,
        name: n,
        disabled: a,
        min: o,
        max: r,
        valueIndexToChangeRef: v,
        thumbs: m.current,
        values: _,
        orientation: s,
        form: x,
        children: /* @__PURE__ */ b(wr.Provider, { scope: e.__scopeSlider, children: /* @__PURE__ */ b(wr.Slot, { scope: e.__scopeSlider, children: /* @__PURE__ */ b(
          w,
          {
            "aria-disabled": a,
            "data-disabled": a ? "" : void 0,
            ...h,
            ref: t,
            onPointerDown: I(h.onPointerDown, () => {
              a || (y.current = _);
            }),
            min: o,
            max: r,
            inverted: p,
            onSlideStart: a ? void 0 : N,
            onSlideMove: a ? void 0 : k,
            onSlideEnd: a ? void 0 : O,
            onHomeKeyDown: () => !a && E(o, 0, { commit: !0 }),
            onEndKeyDown: () => !a && E(r, _.length - 1, { commit: !0 }),
            onStepKeyDown: ({ event: P, direction: L }) => {
              if (!a) {
                const B = cc.includes(P.key) || P.shiftKey && lc.includes(P.key) ? 10 : 1, D = v.current, R = _[D], A = i * B * L;
                E(R + A, D, { commit: !0 });
              }
            }
          }
        ) }) })
      }
    );
  }
);
fc.displayName = Ht;
var [pc, hc] = dc(Ht, {
  startEdge: "left",
  endEdge: "right",
  size: "width",
  direction: 1
}), ih = F(
  (e, t) => {
    const {
      min: n,
      max: o,
      dir: r,
      inverted: i,
      onSlideStart: s,
      onSlideMove: a,
      onSlideEnd: l,
      onStepKeyDown: c,
      ...u
    } = e, [d, f] = V(null), p = G(t, (w) => f(w)), x = M(void 0), h = Wt(r), m = h === "ltr", v = m && !i || !m && i;
    function g(w) {
      const _ = x.current || d.getBoundingClientRect(), S = [0, _.width], N = li(S, v ? [n, o] : [o, n]);
      return x.current = _, N(w - _.left);
    }
    return /* @__PURE__ */ b(
      pc,
      {
        scope: e.__scopeSlider,
        startEdge: v ? "left" : "right",
        endEdge: v ? "right" : "left",
        direction: v ? 1 : -1,
        size: "width",
        children: /* @__PURE__ */ b(
          xc,
          {
            dir: h,
            "data-orientation": "horizontal",
            ...u,
            ref: p,
            style: {
              ...u.style,
              "--radix-slider-thumb-transform": "translateX(-50%)"
            },
            onSlideStart: (w) => {
              const _ = g(w.clientX);
              s?.(_);
            },
            onSlideMove: (w) => {
              const _ = g(w.clientX);
              a?.(_);
            },
            onSlideEnd: () => {
              x.current = void 0, l?.();
            },
            onStepKeyDown: (w) => {
              const S = uc[v ? "from-left" : "from-right"].includes(w.key);
              c?.({ event: w, direction: S ? -1 : 1 });
            }
          }
        )
      }
    );
  }
), sh = F(
  (e, t) => {
    const {
      min: n,
      max: o,
      inverted: r,
      onSlideStart: i,
      onSlideMove: s,
      onSlideEnd: a,
      onStepKeyDown: l,
      ...c
    } = e, u = M(null), d = G(t, u), f = M(void 0), p = !r;
    function x(h) {
      const m = f.current || u.current.getBoundingClientRect(), v = [0, m.height], w = li(v, p ? [o, n] : [n, o]);
      return f.current = m, w(h - m.top);
    }
    return /* @__PURE__ */ b(
      pc,
      {
        scope: e.__scopeSlider,
        startEdge: p ? "bottom" : "top",
        endEdge: p ? "top" : "bottom",
        size: "height",
        direction: p ? 1 : -1,
        children: /* @__PURE__ */ b(
          xc,
          {
            "data-orientation": "vertical",
            ...c,
            ref: d,
            style: {
              ...c.style,
              "--radix-slider-thumb-transform": "translateY(50%)"
            },
            onSlideStart: (h) => {
              const m = x(h.clientY);
              i?.(m);
            },
            onSlideMove: (h) => {
              const m = x(h.clientY);
              s?.(m);
            },
            onSlideEnd: () => {
              f.current = void 0, a?.();
            },
            onStepKeyDown: (h) => {
              const v = uc[p ? "from-bottom" : "from-top"].includes(h.key);
              l?.({ event: h, direction: v ? -1 : 1 });
            }
          }
        )
      }
    );
  }
), xc = F(
  (e, t) => {
    const {
      __scopeSlider: n,
      onSlideStart: o,
      onSlideMove: r,
      onSlideEnd: i,
      onHomeKeyDown: s,
      onEndKeyDown: a,
      onStepKeyDown: l,
      ...c
    } = e, u = go(Ht, n);
    return /* @__PURE__ */ b(
      z.span,
      {
        ...c,
        ref: t,
        onKeyDown: I(e.onKeyDown, (d) => {
          d.key === "Home" ? (s(d), d.preventDefault()) : d.key === "End" ? (a(d), d.preventDefault()) : cc.concat(lc).includes(d.key) && (l(d), d.preventDefault());
        }),
        onPointerDown: I(e.onPointerDown, (d) => {
          const f = d.target;
          f.setPointerCapture(d.pointerId), d.preventDefault(), u.thumbs.has(f) ? f.focus() : o(d);
        }),
        onPointerMove: I(e.onPointerMove, (d) => {
          d.target.hasPointerCapture(d.pointerId) && r(d);
        }),
        onPointerUp: I(e.onPointerUp, (d) => {
          const f = d.target;
          f.hasPointerCapture(d.pointerId) && (f.releasePointerCapture(d.pointerId), i(d));
        })
      }
    );
  }
), mc = "SliderTrack", vc = F(
  (e, t) => {
    const { __scopeSlider: n, ...o } = e, r = go(mc, n);
    return /* @__PURE__ */ b(
      z.span,
      {
        "data-disabled": r.disabled ? "" : void 0,
        "data-orientation": r.orientation,
        ...o,
        ref: t
      }
    );
  }
);
vc.displayName = mc;
var yr = "SliderRange", gc = F(
  (e, t) => {
    const { __scopeSlider: n, ...o } = e, r = go(yr, n), i = hc(yr, n), s = M(null), a = G(t, s), l = r.values.length, c = r.values.map(
      (f) => yc(f, r.min, r.max)
    ), u = l > 1 ? Math.min(...c) : 0, d = 100 - Math.max(...c);
    return /* @__PURE__ */ b(
      z.span,
      {
        "data-orientation": r.orientation,
        "data-disabled": r.disabled ? "" : void 0,
        ...o,
        ref: a,
        style: {
          ...e.style,
          [i.startEdge]: u + "%",
          [i.endEdge]: d + "%"
        }
      }
    );
  }
);
gc.displayName = yr;
var Cr = "SliderThumb", bc = F(
  (e, t) => {
    const n = nh(e.__scopeSlider), [o, r] = V(null), i = G(t, (a) => r(a)), s = ue(
      () => o ? n().findIndex((a) => a.ref.current === o) : -1,
      [n, o]
    );
    return /* @__PURE__ */ b(ah, { ...e, ref: i, index: s });
  }
), ah = F(
  (e, t) => {
    const { __scopeSlider: n, index: o, name: r, ...i } = e, s = go(Cr, n), a = hc(Cr, n), [l, c] = V(null), u = G(t, (g) => c(g)), d = l ? s.form || !!l.closest("form") : !0, f = xo(l), p = s.values[o], x = p === void 0 ? 0 : yc(p, s.min, s.max), h = uh(o, s.values.length), m = f?.[a.size], v = m ? fh(m, x, a.direction) : 0;
    return W(() => {
      if (l)
        return s.thumbs.add(l), () => {
          s.thumbs.delete(l);
        };
    }, [l, s.thumbs]), /* @__PURE__ */ b(
      "span",
      {
        style: {
          transform: "var(--radix-slider-thumb-transform)",
          position: "absolute",
          [a.startEdge]: `calc(${x}% + ${v}px)`
        },
        children: [
          /* @__PURE__ */ b(wr.ItemSlot, { scope: e.__scopeSlider, children: /* @__PURE__ */ b(
            z.span,
            {
              role: "slider",
              "aria-label": e["aria-label"] || h,
              "aria-valuemin": s.min,
              "aria-valuenow": p,
              "aria-valuemax": s.max,
              "aria-orientation": s.orientation,
              "data-orientation": s.orientation,
              "data-disabled": s.disabled ? "" : void 0,
              tabIndex: s.disabled ? void 0 : 0,
              ...i,
              ref: u,
              style: p === void 0 ? { display: "none" } : e.style,
              onFocus: I(e.onFocus, () => {
                s.valueIndexToChangeRef.current = o;
              })
            }
          ) }),
          d && /* @__PURE__ */ b(
            wc,
            {
              name: r ?? (s.name ? s.name + (s.values.length > 1 ? "[]" : "") : void 0),
              form: s.form,
              value: p
            },
            o
          )
        ]
      }
    );
  }
);
bc.displayName = Cr;
var ch = "RadioBubbleInput", wc = F(
  ({ __scopeSlider: e, value: t, ...n }, o) => {
    const r = M(null), i = G(r, o), s = ho(t);
    return W(() => {
      const a = r.current;
      if (!a) return;
      const l = window.HTMLInputElement.prototype, u = Object.getOwnPropertyDescriptor(l, "value").set;
      if (s !== t && u) {
        const d = new Event("input", { bubbles: !0 });
        u.call(a, t), a.dispatchEvent(d);
      }
    }, [s, t]), /* @__PURE__ */ b(
      z.input,
      {
        style: { display: "none" },
        ...n,
        ref: i,
        defaultValue: t
      }
    );
  }
);
wc.displayName = ch;
function lh(e = [], t, n) {
  const o = [...e];
  return o[n] = t, o.sort((r, i) => r - i);
}
function yc(e, t, n) {
  const i = 100 / (n - t) * (e - t);
  return Xn(i, [0, 100]);
}
function uh(e, t) {
  return t > 2 ? `Value ${e + 1} of ${t}` : t === 2 ? ["Minimum", "Maximum"][e] : void 0;
}
function dh(e, t) {
  if (e.length === 1) return 0;
  const n = e.map((r) => Math.abs(r - t)), o = Math.min(...n);
  return n.indexOf(o);
}
function fh(e, t, n) {
  const o = e / 2, i = li([0, 50], [0, o]);
  return (o - i(t) * n) * n;
}
function ph(e) {
  return e.slice(0, -1).map((t, n) => e[n + 1] - t);
}
function hh(e, t) {
  if (t > 0) {
    const n = ph(e);
    return Math.min(...n) >= t;
  }
  return !0;
}
function li(e, t) {
  return (n) => {
    if (e[0] === e[1] || t[0] === t[1]) return t[0];
    const o = (t[1] - t[0]) / (e[1] - e[0]);
    return t[0] + o * (n - e[0]);
  };
}
function xh(e) {
  return (String(e).split(".")[1] || "").length;
}
function mh(e, t) {
  const n = Math.pow(10, t);
  return Math.round(e * n) / n;
}
var vh = fc, gh = vc, bh = gc, wh = bc;
function yh(e) {
  const { value: t, min: n, max: o, onChange: r, disabled: i } = e, s = n ?? 0, a = o ?? 100, l = t ?? 0, c = e.class || "", u = se(e);
  return C(
    vh,
    {
      className: ["relative flex w-full touch-none select-none items-center", c].filter(Boolean).join(" "),
      style: u,
      value: [l],
      min: s,
      max: a,
      disabled: i || !1,
      onValueChange: (d) => {
        r != null && J(r, JSON.stringify({ Value: d[0] }));
      }
    },
    C(
      gh,
      {
        className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted"
      },
      C(bh, {
        className: "absolute h-full bg-primary"
      })
    ),
    C(wh, {
      className: [
        "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow",
        "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50"
      ].join(" ")
    })
  );
}
function Fe(e) {
  const t = M(e);
  return W(() => {
    t.current = e;
  }), ue(() => (...n) => t.current?.(...n), []);
}
function Ch(e, t = globalThis?.document) {
  const n = Fe(e);
  W(() => {
    const o = (r) => {
      r.key === "Escape" && n(r);
    };
    return t.addEventListener("keydown", o, { capture: !0 }), () => t.removeEventListener("keydown", o, { capture: !0 });
  }, [n, t]);
}
var _h = "DismissableLayer", _r = "dismissableLayer.update", Sh = "dismissableLayer.pointerDownOutside", Nh = "dismissableLayer.focusOutside", Ns, Cc = pt({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), Vt = F(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: o,
      onPointerDownOutside: r,
      onFocusOutside: i,
      onInteractOutside: s,
      onDismiss: a,
      ...l
    } = e, c = tt(Cc), [u, d] = V(null), f = u?.ownerDocument ?? globalThis?.document, [, p] = V({}), x = G(t, (N) => d(N)), h = Array.from(c.layers), [m] = [...c.layersWithOutsidePointerEventsDisabled].slice(-1), v = h.indexOf(m), g = u ? h.indexOf(u) : -1, w = c.layersWithOutsidePointerEventsDisabled.size > 0, _ = g >= v, S = Fh((N) => {
      const k = N.target, O = [...c.branches].some((E) => E.contains(k));
      !_ || O || (r?.(N), s?.(N), N.defaultPrevented || a?.());
    }, f), y = Mh((N) => {
      const k = N.target;
      [...c.branches].some((E) => E.contains(k)) || (i?.(N), s?.(N), N.defaultPrevented || a?.());
    }, f);
    return Ch((N) => {
      g === c.layers.size - 1 && (o?.(N), !N.defaultPrevented && a && (N.preventDefault(), a()));
    }, f), W(() => {
      if (u)
        return n && (c.layersWithOutsidePointerEventsDisabled.size === 0 && (Ns = f.body.style.pointerEvents, f.body.style.pointerEvents = "none"), c.layersWithOutsidePointerEventsDisabled.add(u)), c.layers.add(u), Es(), () => {
          n && c.layersWithOutsidePointerEventsDisabled.size === 1 && (f.body.style.pointerEvents = Ns);
        };
    }, [u, f, n, c]), W(() => () => {
      u && (c.layers.delete(u), c.layersWithOutsidePointerEventsDisabled.delete(u), Es());
    }, [u, c]), W(() => {
      const N = () => p({});
      return document.addEventListener(_r, N), () => document.removeEventListener(_r, N);
    }, []), /* @__PURE__ */ b(
      z.div,
      {
        ...l,
        ref: x,
        style: {
          pointerEvents: w ? _ ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: I(e.onFocusCapture, y.onFocusCapture),
        onBlurCapture: I(e.onBlurCapture, y.onBlurCapture),
        onPointerDownCapture: I(
          e.onPointerDownCapture,
          S.onPointerDownCapture
        )
      }
    );
  }
);
Vt.displayName = _h;
var Eh = "DismissableLayerBranch", Ah = F((e, t) => {
  const n = tt(Cc), o = M(null), r = G(t, o);
  return W(() => {
    const i = o.current;
    if (i)
      return n.branches.add(i), () => {
        n.branches.delete(i);
      };
  }, [n.branches]), /* @__PURE__ */ b(z.div, { ...e, ref: r });
});
Ah.displayName = Eh;
function Fh(e, t = globalThis?.document) {
  const n = Fe(e), o = M(!1), r = M(() => {
  });
  return W(() => {
    const i = (a) => {
      if (a.target && !o.current) {
        let l = function() {
          _c(
            Sh,
            n,
            c,
            { discrete: !0 }
          );
        };
        const c = { originalEvent: a };
        a.pointerType === "touch" ? (t.removeEventListener("click", r.current), r.current = l, t.addEventListener("click", r.current, { once: !0 })) : l();
      } else
        t.removeEventListener("click", r.current);
      o.current = !1;
    }, s = window.setTimeout(() => {
      t.addEventListener("pointerdown", i);
    }, 0);
    return () => {
      window.clearTimeout(s), t.removeEventListener("pointerdown", i), t.removeEventListener("click", r.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => o.current = !0
  };
}
function Mh(e, t = globalThis?.document) {
  const n = Fe(e), o = M(!1);
  return W(() => {
    const r = (i) => {
      i.target && !o.current && _c(Nh, n, { originalEvent: i }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", r), () => t.removeEventListener("focusin", r);
  }, [t, n]), {
    onFocusCapture: () => o.current = !0,
    onBlurCapture: () => o.current = !1
  };
}
function Es() {
  const e = new CustomEvent(_r);
  document.dispatchEvent(e);
}
function _c(e, t, n, { discrete: o }) {
  const r = n.originalEvent.target, i = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && r.addEventListener(e, t, { once: !0 }), o ? Ya(r, i) : r.dispatchEvent(i);
}
var tr = 0;
function ui() {
  W(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? As()), document.body.insertAdjacentElement("beforeend", e[1] ?? As()), tr++, () => {
      tr === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), tr--;
    };
  }, []);
}
function As() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var nr = "focusScope.autoFocusOnMount", or = "focusScope.autoFocusOnUnmount", Fs = { bubbles: !1, cancelable: !0 }, kh = "FocusScope", bo = F((e, t) => {
  const {
    loop: n = !1,
    trapped: o = !1,
    onMountAutoFocus: r,
    onUnmountAutoFocus: i,
    ...s
  } = e, [a, l] = V(null), c = Fe(r), u = Fe(i), d = M(null), f = G(t, (h) => l(h)), p = M({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  W(() => {
    if (o) {
      let h = function(w) {
        if (p.paused || !a) return;
        const _ = w.target;
        a.contains(_) ? d.current = _ : Xe(d.current, { select: !0 });
      }, m = function(w) {
        if (p.paused || !a) return;
        const _ = w.relatedTarget;
        _ !== null && (a.contains(_) || Xe(d.current, { select: !0 }));
      }, v = function(w) {
        if (document.activeElement === document.body)
          for (const S of w)
            S.removedNodes.length > 0 && Xe(a);
      };
      document.addEventListener("focusin", h), document.addEventListener("focusout", m);
      const g = new MutationObserver(v);
      return a && g.observe(a, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", h), document.removeEventListener("focusout", m), g.disconnect();
      };
    }
  }, [o, a, p.paused]), W(() => {
    if (a) {
      ks.add(p);
      const h = document.activeElement;
      if (!a.contains(h)) {
        const v = new CustomEvent(nr, Fs);
        a.addEventListener(nr, c), a.dispatchEvent(v), v.defaultPrevented || (Ph(Bh(Sc(a)), { select: !0 }), document.activeElement === h && Xe(a));
      }
      return () => {
        a.removeEventListener(nr, c), setTimeout(() => {
          const v = new CustomEvent(or, Fs);
          a.addEventListener(or, u), a.dispatchEvent(v), v.defaultPrevented || Xe(h ?? document.body, { select: !0 }), a.removeEventListener(or, u), ks.remove(p);
        }, 0);
      };
    }
  }, [a, c, u, p]);
  const x = j(
    (h) => {
      if (!n && !o || p.paused) return;
      const m = h.key === "Tab" && !h.altKey && !h.ctrlKey && !h.metaKey, v = document.activeElement;
      if (m && v) {
        const g = h.currentTarget, [w, _] = Dh(g);
        w && _ ? !h.shiftKey && v === _ ? (h.preventDefault(), n && Xe(w, { select: !0 })) : h.shiftKey && v === w && (h.preventDefault(), n && Xe(_, { select: !0 })) : v === g && h.preventDefault();
      }
    },
    [n, o, p.paused]
  );
  return /* @__PURE__ */ b(z.div, { tabIndex: -1, ...s, ref: f, onKeyDown: x });
});
bo.displayName = kh;
function Ph(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const o of e)
    if (Xe(o, { select: t }), document.activeElement !== n) return;
}
function Dh(e) {
  const t = Sc(e), n = Ms(t, e), o = Ms(t.reverse(), e);
  return [n, o];
}
function Sc(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (o) => {
      const r = o.tagName === "INPUT" && o.type === "hidden";
      return o.disabled || o.hidden || r ? NodeFilter.FILTER_SKIP : o.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Ms(e, t) {
  for (const n of e)
    if (!Oh(n, { upTo: t })) return n;
}
function Oh(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function Th(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function Xe(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && Th(e) && t && e.select();
  }
}
var ks = Rh();
function Rh() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && n?.pause(), e = Ps(e, t), e.unshift(t);
    },
    remove(t) {
      e = Ps(e, t), e[0]?.resume();
    }
  };
}
function Ps(e, t) {
  const n = [...e], o = n.indexOf(t);
  return o !== -1 && n.splice(o, 1), n;
}
function Bh(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Ih = Pa[" useId ".trim().toString()] || (() => {
}), Lh = 0;
function Me(e) {
  const [t, n] = V(Ih());
  return fe(() => {
    n((o) => o ?? String(Lh++));
  }, [e]), t ? `radix-${t}` : "";
}
const $h = ["top", "right", "bottom", "left"], Qe = Math.min, we = Math.max, Jn = Math.round, Dn = Math.floor, Ie = (e) => ({
  x: e,
  y: e
}), Wh = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Hh = {
  start: "end",
  end: "start"
};
function Sr(e, t, n) {
  return we(e, Qe(t, n));
}
function Ke(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ge(e) {
  return e.split("-")[0];
}
function Ut(e) {
  return e.split("-")[1];
}
function di(e) {
  return e === "x" ? "y" : "x";
}
function fi(e) {
  return e === "y" ? "height" : "width";
}
const Vh = /* @__PURE__ */ new Set(["top", "bottom"]);
function Re(e) {
  return Vh.has(Ge(e)) ? "y" : "x";
}
function pi(e) {
  return di(Re(e));
}
function Uh(e, t, n) {
  n === void 0 && (n = !1);
  const o = Ut(e), r = pi(e), i = fi(r);
  let s = r === "x" ? o === (n ? "end" : "start") ? "right" : "left" : o === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (s = qn(s)), [s, qn(s)];
}
function jh(e) {
  const t = qn(e);
  return [Nr(e), t, Nr(t)];
}
function Nr(e) {
  return e.replace(/start|end/g, (t) => Hh[t]);
}
const Ds = ["left", "right"], Os = ["right", "left"], zh = ["top", "bottom"], Kh = ["bottom", "top"];
function Gh(e, t, n) {
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? Os : Ds : t ? Ds : Os;
    case "left":
    case "right":
      return t ? zh : Kh;
    default:
      return [];
  }
}
function Yh(e, t, n, o) {
  const r = Ut(e);
  let i = Gh(Ge(e), n === "start", o);
  return r && (i = i.map((s) => s + "-" + r), t && (i = i.concat(i.map(Nr)))), i;
}
function qn(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Wh[t]);
}
function Xh(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Nc(e) {
  return typeof e != "number" ? Xh(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Zn(e) {
  const {
    x: t,
    y: n,
    width: o,
    height: r
  } = e;
  return {
    width: o,
    height: r,
    top: n,
    left: t,
    right: t + o,
    bottom: n + r,
    x: t,
    y: n
  };
}
function Ts(e, t, n) {
  let {
    reference: o,
    floating: r
  } = e;
  const i = Re(t), s = pi(t), a = fi(s), l = Ge(t), c = i === "y", u = o.x + o.width / 2 - r.width / 2, d = o.y + o.height / 2 - r.height / 2, f = o[a] / 2 - r[a] / 2;
  let p;
  switch (l) {
    case "top":
      p = {
        x: u,
        y: o.y - r.height
      };
      break;
    case "bottom":
      p = {
        x: u,
        y: o.y + o.height
      };
      break;
    case "right":
      p = {
        x: o.x + o.width,
        y: d
      };
      break;
    case "left":
      p = {
        x: o.x - r.width,
        y: d
      };
      break;
    default:
      p = {
        x: o.x,
        y: o.y
      };
  }
  switch (Ut(t)) {
    case "start":
      p[s] -= f * (n && c ? -1 : 1);
      break;
    case "end":
      p[s] += f * (n && c ? -1 : 1);
      break;
  }
  return p;
}
async function Jh(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: o,
    y: r,
    platform: i,
    rects: s,
    elements: a,
    strategy: l
  } = e, {
    boundary: c = "clippingAncestors",
    rootBoundary: u = "viewport",
    elementContext: d = "floating",
    altBoundary: f = !1,
    padding: p = 0
  } = Ke(t, e), x = Nc(p), m = a[f ? d === "floating" ? "reference" : "floating" : d], v = Zn(await i.getClippingRect({
    element: (n = await (i.isElement == null ? void 0 : i.isElement(m))) == null || n ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(a.floating)),
    boundary: c,
    rootBoundary: u,
    strategy: l
  })), g = d === "floating" ? {
    x: o,
    y: r,
    width: s.floating.width,
    height: s.floating.height
  } : s.reference, w = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(a.floating)), _ = await (i.isElement == null ? void 0 : i.isElement(w)) ? await (i.getScale == null ? void 0 : i.getScale(w)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, S = Zn(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: a,
    rect: g,
    offsetParent: w,
    strategy: l
  }) : g);
  return {
    top: (v.top - S.top + x.top) / _.y,
    bottom: (S.bottom - v.bottom + x.bottom) / _.y,
    left: (v.left - S.left + x.left) / _.x,
    right: (S.right - v.right + x.right) / _.x
  };
}
const qh = async (e, t, n) => {
  const {
    placement: o = "bottom",
    strategy: r = "absolute",
    middleware: i = [],
    platform: s
  } = n, a = i.filter(Boolean), l = await (s.isRTL == null ? void 0 : s.isRTL(t));
  let c = await s.getElementRects({
    reference: e,
    floating: t,
    strategy: r
  }), {
    x: u,
    y: d
  } = Ts(c, o, l), f = o, p = {}, x = 0;
  for (let m = 0; m < a.length; m++) {
    var h;
    const {
      name: v,
      fn: g
    } = a[m], {
      x: w,
      y: _,
      data: S,
      reset: y
    } = await g({
      x: u,
      y: d,
      initialPlacement: o,
      placement: f,
      strategy: r,
      middlewareData: p,
      rects: c,
      platform: {
        ...s,
        detectOverflow: (h = s.detectOverflow) != null ? h : Jh
      },
      elements: {
        reference: e,
        floating: t
      }
    });
    u = w ?? u, d = _ ?? d, p = {
      ...p,
      [v]: {
        ...p[v],
        ...S
      }
    }, y && x <= 50 && (x++, typeof y == "object" && (y.placement && (f = y.placement), y.rects && (c = y.rects === !0 ? await s.getElementRects({
      reference: e,
      floating: t,
      strategy: r
    }) : y.rects), {
      x: u,
      y: d
    } = Ts(c, f, l)), m = -1);
  }
  return {
    x: u,
    y: d,
    placement: f,
    strategy: r,
    middlewareData: p
  };
}, Zh = (e) => ({
  name: "arrow",
  options: e,
  async fn(t) {
    const {
      x: n,
      y: o,
      placement: r,
      rects: i,
      platform: s,
      elements: a,
      middlewareData: l
    } = t, {
      element: c,
      padding: u = 0
    } = Ke(e, t) || {};
    if (c == null)
      return {};
    const d = Nc(u), f = {
      x: n,
      y: o
    }, p = pi(r), x = fi(p), h = await s.getDimensions(c), m = p === "y", v = m ? "top" : "left", g = m ? "bottom" : "right", w = m ? "clientHeight" : "clientWidth", _ = i.reference[x] + i.reference[p] - f[p] - i.floating[x], S = f[p] - i.reference[p], y = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(c));
    let N = y ? y[w] : 0;
    (!N || !await (s.isElement == null ? void 0 : s.isElement(y))) && (N = a.floating[w] || i.floating[x]);
    const k = _ / 2 - S / 2, O = N / 2 - h[x] / 2 - 1, E = Qe(d[v], O), P = Qe(d[g], O), L = E, H = N - h[x] - P, $ = N / 2 - h[x] / 2 + k, B = Sr(L, $, H), D = !l.arrow && Ut(r) != null && $ !== B && i.reference[x] / 2 - ($ < L ? E : P) - h[x] / 2 < 0, R = D ? $ < L ? $ - L : $ - H : 0;
    return {
      [p]: f[p] + R,
      data: {
        [p]: B,
        centerOffset: $ - B - R,
        ...D && {
          alignmentOffset: R
        }
      },
      reset: D
    };
  }
}), Qh = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, o;
      const {
        placement: r,
        middlewareData: i,
        rects: s,
        initialPlacement: a,
        platform: l,
        elements: c
      } = t, {
        mainAxis: u = !0,
        crossAxis: d = !0,
        fallbackPlacements: f,
        fallbackStrategy: p = "bestFit",
        fallbackAxisSideDirection: x = "none",
        flipAlignment: h = !0,
        ...m
      } = Ke(e, t);
      if ((n = i.arrow) != null && n.alignmentOffset)
        return {};
      const v = Ge(r), g = Re(a), w = Ge(a) === a, _ = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), S = f || (w || !h ? [qn(a)] : jh(a)), y = x !== "none";
      !f && y && S.push(...Yh(a, h, x, _));
      const N = [a, ...S], k = await l.detectOverflow(t, m), O = [];
      let E = ((o = i.flip) == null ? void 0 : o.overflows) || [];
      if (u && O.push(k[v]), d) {
        const $ = Uh(r, s, _);
        O.push(k[$[0]], k[$[1]]);
      }
      if (E = [...E, {
        placement: r,
        overflows: O
      }], !O.every(($) => $ <= 0)) {
        var P, L;
        const $ = (((P = i.flip) == null ? void 0 : P.index) || 0) + 1, B = N[$];
        if (B && (!(d === "alignment" ? g !== Re(B) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        E.every((A) => Re(A.placement) === g ? A.overflows[0] > 0 : !0)))
          return {
            data: {
              index: $,
              overflows: E
            },
            reset: {
              placement: B
            }
          };
        let D = (L = E.filter((R) => R.overflows[0] <= 0).sort((R, A) => R.overflows[1] - A.overflows[1])[0]) == null ? void 0 : L.placement;
        if (!D)
          switch (p) {
            case "bestFit": {
              var H;
              const R = (H = E.filter((A) => {
                if (y) {
                  const T = Re(A.placement);
                  return T === g || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  T === "y";
                }
                return !0;
              }).map((A) => [A.placement, A.overflows.filter((T) => T > 0).reduce((T, Y) => T + Y, 0)]).sort((A, T) => A[1] - T[1])[0]) == null ? void 0 : H[0];
              R && (D = R);
              break;
            }
            case "initialPlacement":
              D = a;
              break;
          }
        if (r !== D)
          return {
            reset: {
              placement: D
            }
          };
      }
      return {};
    }
  };
};
function Rs(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width
  };
}
function Bs(e) {
  return $h.some((t) => e[t] >= 0);
}
const ex = function(e) {
  return e === void 0 && (e = {}), {
    name: "hide",
    options: e,
    async fn(t) {
      const {
        rects: n,
        platform: o
      } = t, {
        strategy: r = "referenceHidden",
        ...i
      } = Ke(e, t);
      switch (r) {
        case "referenceHidden": {
          const s = await o.detectOverflow(t, {
            ...i,
            elementContext: "reference"
          }), a = Rs(s, n.reference);
          return {
            data: {
              referenceHiddenOffsets: a,
              referenceHidden: Bs(a)
            }
          };
        }
        case "escaped": {
          const s = await o.detectOverflow(t, {
            ...i,
            altBoundary: !0
          }), a = Rs(s, n.floating);
          return {
            data: {
              escapedOffsets: a,
              escaped: Bs(a)
            }
          };
        }
        default:
          return {};
      }
    }
  };
}, Ec = /* @__PURE__ */ new Set(["left", "top"]);
async function tx(e, t) {
  const {
    placement: n,
    platform: o,
    elements: r
  } = e, i = await (o.isRTL == null ? void 0 : o.isRTL(r.floating)), s = Ge(n), a = Ut(n), l = Re(n) === "y", c = Ec.has(s) ? -1 : 1, u = i && l ? -1 : 1, d = Ke(t, e);
  let {
    mainAxis: f,
    crossAxis: p,
    alignmentAxis: x
  } = typeof d == "number" ? {
    mainAxis: d,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: d.mainAxis || 0,
    crossAxis: d.crossAxis || 0,
    alignmentAxis: d.alignmentAxis
  };
  return a && typeof x == "number" && (p = a === "end" ? x * -1 : x), l ? {
    x: p * u,
    y: f * c
  } : {
    x: f * c,
    y: p * u
  };
}
const nx = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, o;
      const {
        x: r,
        y: i,
        placement: s,
        middlewareData: a
      } = t, l = await tx(t, e);
      return s === ((n = a.offset) == null ? void 0 : n.placement) && (o = a.arrow) != null && o.alignmentOffset ? {} : {
        x: r + l.x,
        y: i + l.y,
        data: {
          ...l,
          placement: s
        }
      };
    }
  };
}, ox = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: o,
        placement: r,
        platform: i
      } = t, {
        mainAxis: s = !0,
        crossAxis: a = !1,
        limiter: l = {
          fn: (v) => {
            let {
              x: g,
              y: w
            } = v;
            return {
              x: g,
              y: w
            };
          }
        },
        ...c
      } = Ke(e, t), u = {
        x: n,
        y: o
      }, d = await i.detectOverflow(t, c), f = Re(Ge(r)), p = di(f);
      let x = u[p], h = u[f];
      if (s) {
        const v = p === "y" ? "top" : "left", g = p === "y" ? "bottom" : "right", w = x + d[v], _ = x - d[g];
        x = Sr(w, x, _);
      }
      if (a) {
        const v = f === "y" ? "top" : "left", g = f === "y" ? "bottom" : "right", w = h + d[v], _ = h - d[g];
        h = Sr(w, h, _);
      }
      const m = l.fn({
        ...t,
        [p]: x,
        [f]: h
      });
      return {
        ...m,
        data: {
          x: m.x - n,
          y: m.y - o,
          enabled: {
            [p]: s,
            [f]: a
          }
        }
      };
    }
  };
}, rx = function(e) {
  return e === void 0 && (e = {}), {
    options: e,
    fn(t) {
      const {
        x: n,
        y: o,
        placement: r,
        rects: i,
        middlewareData: s
      } = t, {
        offset: a = 0,
        mainAxis: l = !0,
        crossAxis: c = !0
      } = Ke(e, t), u = {
        x: n,
        y: o
      }, d = Re(r), f = di(d);
      let p = u[f], x = u[d];
      const h = Ke(a, t), m = typeof h == "number" ? {
        mainAxis: h,
        crossAxis: 0
      } : {
        mainAxis: 0,
        crossAxis: 0,
        ...h
      };
      if (l) {
        const w = f === "y" ? "height" : "width", _ = i.reference[f] - i.floating[w] + m.mainAxis, S = i.reference[f] + i.reference[w] - m.mainAxis;
        p < _ ? p = _ : p > S && (p = S);
      }
      if (c) {
        var v, g;
        const w = f === "y" ? "width" : "height", _ = Ec.has(Ge(r)), S = i.reference[d] - i.floating[w] + (_ && ((v = s.offset) == null ? void 0 : v[d]) || 0) + (_ ? 0 : m.crossAxis), y = i.reference[d] + i.reference[w] + (_ ? 0 : ((g = s.offset) == null ? void 0 : g[d]) || 0) - (_ ? m.crossAxis : 0);
        x < S ? x = S : x > y && (x = y);
      }
      return {
        [f]: p,
        [d]: x
      };
    }
  };
}, ix = function(e) {
  return e === void 0 && (e = {}), {
    name: "size",
    options: e,
    async fn(t) {
      var n, o;
      const {
        placement: r,
        rects: i,
        platform: s,
        elements: a
      } = t, {
        apply: l = () => {
        },
        ...c
      } = Ke(e, t), u = await s.detectOverflow(t, c), d = Ge(r), f = Ut(r), p = Re(r) === "y", {
        width: x,
        height: h
      } = i.floating;
      let m, v;
      d === "top" || d === "bottom" ? (m = d, v = f === (await (s.isRTL == null ? void 0 : s.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (v = d, m = f === "end" ? "top" : "bottom");
      const g = h - u.top - u.bottom, w = x - u.left - u.right, _ = Qe(h - u[m], g), S = Qe(x - u[v], w), y = !t.middlewareData.shift;
      let N = _, k = S;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (k = w), (o = t.middlewareData.shift) != null && o.enabled.y && (N = g), y && !f) {
        const E = we(u.left, 0), P = we(u.right, 0), L = we(u.top, 0), H = we(u.bottom, 0);
        p ? k = x - 2 * (E !== 0 || P !== 0 ? E + P : we(u.left, u.right)) : N = h - 2 * (L !== 0 || H !== 0 ? L + H : we(u.top, u.bottom));
      }
      await l({
        ...t,
        availableWidth: k,
        availableHeight: N
      });
      const O = await s.getDimensions(a.floating);
      return x !== O.width || h !== O.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function wo() {
  return typeof window < "u";
}
function jt(e) {
  return Ac(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function ye(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function We(e) {
  var t;
  return (t = (Ac(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Ac(e) {
  return wo() ? e instanceof Node || e instanceof ye(e).Node : !1;
}
function ke(e) {
  return wo() ? e instanceof Element || e instanceof ye(e).Element : !1;
}
function $e(e) {
  return wo() ? e instanceof HTMLElement || e instanceof ye(e).HTMLElement : !1;
}
function Is(e) {
  return !wo() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof ye(e).ShadowRoot;
}
const sx = /* @__PURE__ */ new Set(["inline", "contents"]);
function mn(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: o,
    display: r
  } = Pe(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + o + n) && !sx.has(r);
}
const ax = /* @__PURE__ */ new Set(["table", "td", "th"]);
function cx(e) {
  return ax.has(jt(e));
}
const lx = [":popover-open", ":modal"];
function yo(e) {
  return lx.some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
const ux = ["transform", "translate", "scale", "rotate", "perspective"], dx = ["transform", "translate", "scale", "rotate", "perspective", "filter"], fx = ["paint", "layout", "strict", "content"];
function hi(e) {
  const t = xi(), n = ke(e) ? Pe(e) : e;
  return ux.some((o) => n[o] ? n[o] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || dx.some((o) => (n.willChange || "").includes(o)) || fx.some((o) => (n.contain || "").includes(o));
}
function px(e) {
  let t = et(e);
  for (; $e(t) && !Rt(t); ) {
    if (hi(t))
      return t;
    if (yo(t))
      return null;
    t = et(t);
  }
  return null;
}
function xi() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
const hx = /* @__PURE__ */ new Set(["html", "body", "#document"]);
function Rt(e) {
  return hx.has(jt(e));
}
function Pe(e) {
  return ye(e).getComputedStyle(e);
}
function Co(e) {
  return ke(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function et(e) {
  if (jt(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Is(e) && e.host || // Fallback.
    We(e)
  );
  return Is(t) ? t.host : t;
}
function Fc(e) {
  const t = et(e);
  return Rt(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : $e(t) && mn(t) ? t : Fc(t);
}
function rn(e, t, n) {
  var o;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const r = Fc(e), i = r === ((o = e.ownerDocument) == null ? void 0 : o.body), s = ye(r);
  if (i) {
    const a = Er(s);
    return t.concat(s, s.visualViewport || [], mn(r) ? r : [], a && n ? rn(a) : []);
  }
  return t.concat(r, rn(r, [], n));
}
function Er(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function Mc(e) {
  const t = Pe(e);
  let n = parseFloat(t.width) || 0, o = parseFloat(t.height) || 0;
  const r = $e(e), i = r ? e.offsetWidth : n, s = r ? e.offsetHeight : o, a = Jn(n) !== i || Jn(o) !== s;
  return a && (n = i, o = s), {
    width: n,
    height: o,
    $: a
  };
}
function mi(e) {
  return ke(e) ? e : e.contextElement;
}
function kt(e) {
  const t = mi(e);
  if (!$e(t))
    return Ie(1);
  const n = t.getBoundingClientRect(), {
    width: o,
    height: r,
    $: i
  } = Mc(t);
  let s = (i ? Jn(n.width) : n.width) / o, a = (i ? Jn(n.height) : n.height) / r;
  return (!s || !Number.isFinite(s)) && (s = 1), (!a || !Number.isFinite(a)) && (a = 1), {
    x: s,
    y: a
  };
}
const xx = /* @__PURE__ */ Ie(0);
function kc(e) {
  const t = ye(e);
  return !xi() || !t.visualViewport ? xx : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function mx(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== ye(e) ? !1 : t;
}
function xt(e, t, n, o) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), i = mi(e);
  let s = Ie(1);
  t && (o ? ke(o) && (s = kt(o)) : s = kt(e));
  const a = mx(i, n, o) ? kc(i) : Ie(0);
  let l = (r.left + a.x) / s.x, c = (r.top + a.y) / s.y, u = r.width / s.x, d = r.height / s.y;
  if (i) {
    const f = ye(i), p = o && ke(o) ? ye(o) : o;
    let x = f, h = Er(x);
    for (; h && o && p !== x; ) {
      const m = kt(h), v = h.getBoundingClientRect(), g = Pe(h), w = v.left + (h.clientLeft + parseFloat(g.paddingLeft)) * m.x, _ = v.top + (h.clientTop + parseFloat(g.paddingTop)) * m.y;
      l *= m.x, c *= m.y, u *= m.x, d *= m.y, l += w, c += _, x = ye(h), h = Er(x);
    }
  }
  return Zn({
    width: u,
    height: d,
    x: l,
    y: c
  });
}
function _o(e, t) {
  const n = Co(e).scrollLeft;
  return t ? t.left + n : xt(We(e)).left + n;
}
function Pc(e, t) {
  const n = e.getBoundingClientRect(), o = n.left + t.scrollLeft - _o(e, n), r = n.top + t.scrollTop;
  return {
    x: o,
    y: r
  };
}
function vx(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: o,
    strategy: r
  } = e;
  const i = r === "fixed", s = We(o), a = t ? yo(t.floating) : !1;
  if (o === s || a && i)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = Ie(1);
  const u = Ie(0), d = $e(o);
  if ((d || !d && !i) && ((jt(o) !== "body" || mn(s)) && (l = Co(o)), $e(o))) {
    const p = xt(o);
    c = kt(o), u.x = p.x + o.clientLeft, u.y = p.y + o.clientTop;
  }
  const f = s && !d && !i ? Pc(s, l) : Ie(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - l.scrollLeft * c.x + u.x + f.x,
    y: n.y * c.y - l.scrollTop * c.y + u.y + f.y
  };
}
function gx(e) {
  return Array.from(e.getClientRects());
}
function bx(e) {
  const t = We(e), n = Co(e), o = e.ownerDocument.body, r = we(t.scrollWidth, t.clientWidth, o.scrollWidth, o.clientWidth), i = we(t.scrollHeight, t.clientHeight, o.scrollHeight, o.clientHeight);
  let s = -n.scrollLeft + _o(e);
  const a = -n.scrollTop;
  return Pe(o).direction === "rtl" && (s += we(t.clientWidth, o.clientWidth) - r), {
    width: r,
    height: i,
    x: s,
    y: a
  };
}
const Ls = 25;
function wx(e, t) {
  const n = ye(e), o = We(e), r = n.visualViewport;
  let i = o.clientWidth, s = o.clientHeight, a = 0, l = 0;
  if (r) {
    i = r.width, s = r.height;
    const u = xi();
    (!u || u && t === "fixed") && (a = r.offsetLeft, l = r.offsetTop);
  }
  const c = _o(o);
  if (c <= 0) {
    const u = o.ownerDocument, d = u.body, f = getComputedStyle(d), p = u.compatMode === "CSS1Compat" && parseFloat(f.marginLeft) + parseFloat(f.marginRight) || 0, x = Math.abs(o.clientWidth - d.clientWidth - p);
    x <= Ls && (i -= x);
  } else c <= Ls && (i += c);
  return {
    width: i,
    height: s,
    x: a,
    y: l
  };
}
const yx = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function Cx(e, t) {
  const n = xt(e, !0, t === "fixed"), o = n.top + e.clientTop, r = n.left + e.clientLeft, i = $e(e) ? kt(e) : Ie(1), s = e.clientWidth * i.x, a = e.clientHeight * i.y, l = r * i.x, c = o * i.y;
  return {
    width: s,
    height: a,
    x: l,
    y: c
  };
}
function $s(e, t, n) {
  let o;
  if (t === "viewport")
    o = wx(e, n);
  else if (t === "document")
    o = bx(We(e));
  else if (ke(t))
    o = Cx(t, n);
  else {
    const r = kc(e);
    o = {
      x: t.x - r.x,
      y: t.y - r.y,
      width: t.width,
      height: t.height
    };
  }
  return Zn(o);
}
function Dc(e, t) {
  const n = et(e);
  return n === t || !ke(n) || Rt(n) ? !1 : Pe(n).position === "fixed" || Dc(n, t);
}
function _x(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let o = rn(e, [], !1).filter((a) => ke(a) && jt(a) !== "body"), r = null;
  const i = Pe(e).position === "fixed";
  let s = i ? et(e) : e;
  for (; ke(s) && !Rt(s); ) {
    const a = Pe(s), l = hi(s);
    !l && a.position === "fixed" && (r = null), (i ? !l && !r : !l && a.position === "static" && !!r && yx.has(r.position) || mn(s) && !l && Dc(e, s)) ? o = o.filter((u) => u !== s) : r = a, s = et(s);
  }
  return t.set(e, o), o;
}
function Sx(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: o,
    strategy: r
  } = e;
  const s = [...n === "clippingAncestors" ? yo(t) ? [] : _x(t, this._c) : [].concat(n), o], a = s[0], l = s.reduce((c, u) => {
    const d = $s(t, u, r);
    return c.top = we(d.top, c.top), c.right = Qe(d.right, c.right), c.bottom = Qe(d.bottom, c.bottom), c.left = we(d.left, c.left), c;
  }, $s(t, a, r));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function Nx(e) {
  const {
    width: t,
    height: n
  } = Mc(e);
  return {
    width: t,
    height: n
  };
}
function Ex(e, t, n) {
  const o = $e(t), r = We(t), i = n === "fixed", s = xt(e, !0, i, t);
  let a = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = Ie(0);
  function c() {
    l.x = _o(r);
  }
  if (o || !o && !i)
    if ((jt(t) !== "body" || mn(r)) && (a = Co(t)), o) {
      const p = xt(t, !0, i, t);
      l.x = p.x + t.clientLeft, l.y = p.y + t.clientTop;
    } else r && c();
  i && !o && r && c();
  const u = r && !o && !i ? Pc(r, a) : Ie(0), d = s.left + a.scrollLeft - l.x - u.x, f = s.top + a.scrollTop - l.y - u.y;
  return {
    x: d,
    y: f,
    width: s.width,
    height: s.height
  };
}
function rr(e) {
  return Pe(e).position === "static";
}
function Ws(e, t) {
  if (!$e(e) || Pe(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return We(e) === n && (n = n.ownerDocument.body), n;
}
function Oc(e, t) {
  const n = ye(e);
  if (yo(e))
    return n;
  if (!$e(e)) {
    let r = et(e);
    for (; r && !Rt(r); ) {
      if (ke(r) && !rr(r))
        return r;
      r = et(r);
    }
    return n;
  }
  let o = Ws(e, t);
  for (; o && cx(o) && rr(o); )
    o = Ws(o, t);
  return o && Rt(o) && rr(o) && !hi(o) ? n : o || px(e) || n;
}
const Ax = async function(e) {
  const t = this.getOffsetParent || Oc, n = this.getDimensions, o = await n(e.floating);
  return {
    reference: Ex(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: o.width,
      height: o.height
    }
  };
};
function Fx(e) {
  return Pe(e).direction === "rtl";
}
const Mx = {
  convertOffsetParentRelativeRectToViewportRelativeRect: vx,
  getDocumentElement: We,
  getClippingRect: Sx,
  getOffsetParent: Oc,
  getElementRects: Ax,
  getClientRects: gx,
  getDimensions: Nx,
  getScale: kt,
  isElement: ke,
  isRTL: Fx
};
function Tc(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function kx(e, t) {
  let n = null, o;
  const r = We(e);
  function i() {
    var a;
    clearTimeout(o), (a = n) == null || a.disconnect(), n = null;
  }
  function s(a, l) {
    a === void 0 && (a = !1), l === void 0 && (l = 1), i();
    const c = e.getBoundingClientRect(), {
      left: u,
      top: d,
      width: f,
      height: p
    } = c;
    if (a || t(), !f || !p)
      return;
    const x = Dn(d), h = Dn(r.clientWidth - (u + f)), m = Dn(r.clientHeight - (d + p)), v = Dn(u), w = {
      rootMargin: -x + "px " + -h + "px " + -m + "px " + -v + "px",
      threshold: we(0, Qe(1, l)) || 1
    };
    let _ = !0;
    function S(y) {
      const N = y[0].intersectionRatio;
      if (N !== l) {
        if (!_)
          return s();
        N ? s(!1, N) : o = setTimeout(() => {
          s(!1, 1e-7);
        }, 1e3);
      }
      N === 1 && !Tc(c, e.getBoundingClientRect()) && s(), _ = !1;
    }
    try {
      n = new IntersectionObserver(S, {
        ...w,
        // Handle <iframe>s
        root: r.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(S, w);
    }
    n.observe(e);
  }
  return s(!0), i;
}
function Px(e, t, n, o) {
  o === void 0 && (o = {});
  const {
    ancestorScroll: r = !0,
    ancestorResize: i = !0,
    elementResize: s = typeof ResizeObserver == "function",
    layoutShift: a = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = o, c = mi(e), u = r || i ? [...c ? rn(c) : [], ...rn(t)] : [];
  u.forEach((v) => {
    r && v.addEventListener("scroll", n, {
      passive: !0
    }), i && v.addEventListener("resize", n);
  });
  const d = c && a ? kx(c, n) : null;
  let f = -1, p = null;
  s && (p = new ResizeObserver((v) => {
    let [g] = v;
    g && g.target === c && p && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
      var w;
      (w = p) == null || w.observe(t);
    })), n();
  }), c && !l && p.observe(c), p.observe(t));
  let x, h = l ? xt(e) : null;
  l && m();
  function m() {
    const v = xt(e);
    h && !Tc(h, v) && n(), h = v, x = requestAnimationFrame(m);
  }
  return n(), () => {
    var v;
    u.forEach((g) => {
      r && g.removeEventListener("scroll", n), i && g.removeEventListener("resize", n);
    }), d?.(), (v = p) == null || v.disconnect(), p = null, l && cancelAnimationFrame(x);
  };
}
const Dx = nx, Ox = ox, Tx = Qh, Rx = ix, Bx = ex, Hs = Zh, Ix = rx, Lx = (e, t, n) => {
  const o = /* @__PURE__ */ new Map(), r = {
    platform: Mx,
    ...n
  }, i = {
    ...r.platform,
    _c: o
  };
  return qh(e, t, {
    ...r,
    platform: i
  });
};
var $x = typeof document < "u", Wx = function() {
}, $n = $x ? Se : Wx;
function Qn(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, o, r;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (o = n; o-- !== 0; )
        if (!Qn(e[o], t[o]))
          return !1;
      return !0;
    }
    if (r = Object.keys(e), n = r.length, n !== Object.keys(t).length)
      return !1;
    for (o = n; o-- !== 0; )
      if (!{}.hasOwnProperty.call(t, r[o]))
        return !1;
    for (o = n; o-- !== 0; ) {
      const i = r[o];
      if (!(i === "_owner" && e.$$typeof) && !Qn(e[i], t[i]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Rc(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Vs(e, t) {
  const n = Rc(e);
  return Math.round(t * n) / n;
}
function ir(e) {
  const t = M(e);
  return $n(() => {
    t.current = e;
  }), t;
}
function Hx(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: o = [],
    platform: r,
    elements: {
      reference: i,
      floating: s
    } = {},
    transform: a = !0,
    whileElementsMounted: l,
    open: c
  } = e, [u, d] = V({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [f, p] = V(o);
  Qn(f, o) || p(o);
  const [x, h] = V(null), [m, v] = V(null), g = j((A) => {
    A !== y.current && (y.current = A, h(A));
  }, []), w = j((A) => {
    A !== N.current && (N.current = A, v(A));
  }, []), _ = i || x, S = s || m, y = M(null), N = M(null), k = M(u), O = l != null, E = ir(l), P = ir(r), L = ir(c), H = j(() => {
    if (!y.current || !N.current)
      return;
    const A = {
      placement: t,
      strategy: n,
      middleware: f
    };
    P.current && (A.platform = P.current), Lx(y.current, N.current, A).then((T) => {
      const Y = {
        ...T,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: L.current !== !1
      };
      $.current && !Qn(k.current, Y) && (k.current = Y, ao(() => {
        d(Y);
      }));
    });
  }, [f, t, n, P, L]);
  $n(() => {
    c === !1 && k.current.isPositioned && (k.current.isPositioned = !1, d((A) => ({
      ...A,
      isPositioned: !1
    })));
  }, [c]);
  const $ = M(!1);
  $n(() => ($.current = !0, () => {
    $.current = !1;
  }), []), $n(() => {
    if (_ && (y.current = _), S && (N.current = S), _ && S) {
      if (E.current)
        return E.current(_, S, H);
      H();
    }
  }, [_, S, H, E, O]);
  const B = ue(() => ({
    reference: y,
    floating: N,
    setReference: g,
    setFloating: w
  }), [g, w]), D = ue(() => ({
    reference: _,
    floating: S
  }), [_, S]), R = ue(() => {
    const A = {
      position: n,
      left: 0,
      top: 0
    };
    if (!D.floating)
      return A;
    const T = Vs(D.floating, u.x), Y = Vs(D.floating, u.y);
    return a ? {
      ...A,
      transform: "translate(" + T + "px, " + Y + "px)",
      ...Rc(D.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: T,
      top: Y
    };
  }, [n, a, D.floating, u.x, u.y]);
  return ue(() => ({
    ...u,
    update: H,
    refs: B,
    elements: D,
    floatingStyles: R
  }), [u, H, B, D, R]);
}
const Vx = (e) => {
  function t(n) {
    return {}.hasOwnProperty.call(n, "current");
  }
  return {
    name: "arrow",
    options: e,
    fn(n) {
      const {
        element: o,
        padding: r
      } = typeof e == "function" ? e(n) : e;
      return o && t(o) ? o.current != null ? Hs({
        element: o.current,
        padding: r
      }).fn(n) : {} : o ? Hs({
        element: o,
        padding: r
      }).fn(n) : {};
    }
  };
}, Ux = (e, t) => ({
  ...Dx(e),
  options: [e, t]
}), jx = (e, t) => ({
  ...Ox(e),
  options: [e, t]
}), zx = (e, t) => ({
  ...Ix(e),
  options: [e, t]
}), Kx = (e, t) => ({
  ...Tx(e),
  options: [e, t]
}), Gx = (e, t) => ({
  ...Rx(e),
  options: [e, t]
}), Yx = (e, t) => ({
  ...Bx(e),
  options: [e, t]
}), Xx = (e, t) => ({
  ...Vx(e),
  options: [e, t]
});
var Jx = "Arrow", Bc = F((e, t) => {
  const { children: n, width: o = 10, height: r = 5, ...i } = e;
  return /* @__PURE__ */ b(
    z.svg,
    {
      ...i,
      ref: t,
      width: o,
      height: r,
      viewBox: "0 0 30 10",
      preserveAspectRatio: "none",
      children: e.asChild ? n : /* @__PURE__ */ b("polygon", { points: "0,0 30,0 15,10" })
    }
  );
});
Bc.displayName = Jx;
var qx = Bc, vi = "Popper", [Ic, He] = pe(vi), [Zx, Lc] = Ic(vi), $c = (e) => {
  const { __scopePopper: t, children: n } = e, [o, r] = V(null);
  return /* @__PURE__ */ b(Zx, { scope: t, anchor: o, onAnchorChange: r, children: n });
};
$c.displayName = vi;
var Wc = "PopperAnchor", Hc = F(
  (e, t) => {
    const { __scopePopper: n, virtualRef: o, ...r } = e, i = Lc(Wc, n), s = M(null), a = G(t, s), l = M(null);
    return W(() => {
      const c = l.current;
      l.current = o?.current || s.current, c !== l.current && i.onAnchorChange(l.current);
    }), o ? null : /* @__PURE__ */ b(z.div, { ...r, ref: a });
  }
);
Hc.displayName = Wc;
var gi = "PopperContent", [Qx, em] = Ic(gi), Vc = F(
  (e, t) => {
    const {
      __scopePopper: n,
      side: o = "bottom",
      sideOffset: r = 0,
      align: i = "center",
      alignOffset: s = 0,
      arrowPadding: a = 0,
      avoidCollisions: l = !0,
      collisionBoundary: c = [],
      collisionPadding: u = 0,
      sticky: d = "partial",
      hideWhenDetached: f = !1,
      updatePositionStrategy: p = "optimized",
      onPlaced: x,
      ...h
    } = e, m = Lc(gi, n), [v, g] = V(null), w = G(t, (U) => g(U)), [_, S] = V(null), y = xo(_), N = y?.width ?? 0, k = y?.height ?? 0, O = o + (i !== "center" ? "-" + i : ""), E = typeof u == "number" ? u : { top: 0, right: 0, bottom: 0, left: 0, ...u }, P = Array.isArray(c) ? c : [c], L = P.length > 0, H = {
      padding: E,
      boundary: P.filter(nm),
      // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
      altBoundary: L
    }, { refs: $, floatingStyles: B, placement: D, isPositioned: R, middlewareData: A } = Hx({
      // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
      strategy: "fixed",
      placement: O,
      whileElementsMounted: (...U) => Px(...U, {
        animationFrame: p === "always"
      }),
      elements: {
        reference: m.anchor
      },
      middleware: [
        Ux({ mainAxis: r + k, alignmentAxis: s }),
        l && jx({
          mainAxis: !0,
          crossAxis: !1,
          limiter: d === "partial" ? zx() : void 0,
          ...H
        }),
        l && Kx({ ...H }),
        Gx({
          ...H,
          apply: ({ elements: U, rects: Q, availableWidth: he, availableHeight: te }) => {
            const { width: ne, height: ae } = Q.reference, Ce = U.floating.style;
            Ce.setProperty("--radix-popper-available-width", `${he}px`), Ce.setProperty("--radix-popper-available-height", `${te}px`), Ce.setProperty("--radix-popper-anchor-width", `${ne}px`), Ce.setProperty("--radix-popper-anchor-height", `${ae}px`);
          }
        }),
        _ && Xx({ element: _, padding: a }),
        om({ arrowWidth: N, arrowHeight: k }),
        f && Yx({ strategy: "referenceHidden", ...H })
      ]
    }), [T, Y] = zc(D), X = Fe(x);
    fe(() => {
      R && X?.();
    }, [R, X]);
    const q = A.arrow?.x, Z = A.arrow?.y, re = A.arrow?.centerOffset !== 0, [be, de] = V();
    return fe(() => {
      v && de(window.getComputedStyle(v).zIndex);
    }, [v]), /* @__PURE__ */ b(
      "div",
      {
        ref: $.setFloating,
        "data-radix-popper-content-wrapper": "",
        style: {
          ...B,
          transform: R ? B.transform : "translate(0, -200%)",
          // keep off the page when measuring
          minWidth: "max-content",
          zIndex: be,
          "--radix-popper-transform-origin": [
            A.transformOrigin?.x,
            A.transformOrigin?.y
          ].join(" "),
          // hide the content if using the hide middleware and should be hidden
          // set visibility to hidden and disable pointer events so the UI behaves
          // as if the PopperContent isn't there at all
          ...A.hide?.referenceHidden && {
            visibility: "hidden",
            pointerEvents: "none"
          }
        },
        dir: e.dir,
        children: /* @__PURE__ */ b(
          Qx,
          {
            scope: n,
            placedSide: T,
            onArrowChange: S,
            arrowX: q,
            arrowY: Z,
            shouldHideArrow: re,
            children: /* @__PURE__ */ b(
              z.div,
              {
                "data-side": T,
                "data-align": Y,
                ...h,
                ref: w,
                style: {
                  ...h.style,
                  // if the PopperContent hasn't been placed yet (not all measurements done)
                  // we prevent animations so that users's animation don't kick in too early referring wrong sides
                  animation: R ? void 0 : "none"
                }
              }
            )
          }
        )
      }
    );
  }
);
Vc.displayName = gi;
var Uc = "PopperArrow", tm = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
}, jc = F(function(t, n) {
  const { __scopePopper: o, ...r } = t, i = em(Uc, o), s = tm[i.placedSide];
  return (
    // we have to use an extra wrapper because `ResizeObserver` (used by `useSize`)
    // doesn't report size as we'd expect on SVG elements.
    // it reports their bounding box which is effectively the largest path inside the SVG.
    /* @__PURE__ */ b(
      "span",
      {
        ref: i.onArrowChange,
        style: {
          position: "absolute",
          left: i.arrowX,
          top: i.arrowY,
          [s]: 0,
          transformOrigin: {
            top: "",
            right: "0 0",
            bottom: "center 0",
            left: "100% 0"
          }[i.placedSide],
          transform: {
            top: "translateY(100%)",
            right: "translateY(50%) rotate(90deg) translateX(-50%)",
            bottom: "rotate(180deg)",
            left: "translateY(50%) rotate(-90deg) translateX(50%)"
          }[i.placedSide],
          visibility: i.shouldHideArrow ? "hidden" : void 0
        },
        children: /* @__PURE__ */ b(
          qx,
          {
            ...r,
            ref: n,
            style: {
              ...r.style,
              // ensures the element can be measured correctly (mostly for if SVG)
              display: "block"
            }
          }
        )
      }
    )
  );
});
jc.displayName = Uc;
function nm(e) {
  return e !== null;
}
var om = (e) => ({
  name: "transformOrigin",
  options: e,
  fn(t) {
    const { placement: n, rects: o, middlewareData: r } = t, s = r.arrow?.centerOffset !== 0, a = s ? 0 : e.arrowWidth, l = s ? 0 : e.arrowHeight, [c, u] = zc(n), d = { start: "0%", center: "50%", end: "100%" }[u], f = (r.arrow?.x ?? 0) + a / 2, p = (r.arrow?.y ?? 0) + l / 2;
    let x = "", h = "";
    return c === "bottom" ? (x = s ? d : `${f}px`, h = `${-l}px`) : c === "top" ? (x = s ? d : `${f}px`, h = `${o.floating.height + l}px`) : c === "right" ? (x = `${-l}px`, h = s ? d : `${p}px`) : c === "left" && (x = `${o.floating.width + l}px`, h = s ? d : `${p}px`), { data: { x, y: h } };
  }
});
function zc(e) {
  const [t, n = "center"] = e.split("-");
  return [t, n];
}
var vn = $c, zt = Hc, gn = Vc, bn = jc, rm = "Portal", Kt = F((e, t) => {
  const { container: n, ...o } = e, [r, i] = V(!1);
  fe(() => i(!0), []);
  const s = n || r && globalThis?.document?.body;
  return s ? ie.createPortal(/* @__PURE__ */ b(z.div, { ...o, ref: t }), s) : null;
});
Kt.displayName = rm;
var Kc = Object.freeze({
  // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
  position: "absolute",
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal"
}), im = "VisuallyHidden", Gc = F(
  (e, t) => /* @__PURE__ */ b(
    z.span,
    {
      ...e,
      ref: t,
      style: { ...Kc, ...e.style }
    }
  )
);
Gc.displayName = im;
var sm = Gc, am = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Et = /* @__PURE__ */ new WeakMap(), On = /* @__PURE__ */ new WeakMap(), Tn = {}, sr = 0, Yc = function(e) {
  return e && (e.host || Yc(e.parentNode));
}, cm = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var o = Yc(n);
    return o && e.contains(o) ? o : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, lm = function(e, t, n, o) {
  var r = cm(t, Array.isArray(e) ? e : [e]);
  Tn[n] || (Tn[n] = /* @__PURE__ */ new WeakMap());
  var i = Tn[n], s = [], a = /* @__PURE__ */ new Set(), l = new Set(r), c = function(d) {
    !d || a.has(d) || (a.add(d), c(d.parentNode));
  };
  r.forEach(c);
  var u = function(d) {
    !d || l.has(d) || Array.prototype.forEach.call(d.children, function(f) {
      if (a.has(f))
        u(f);
      else
        try {
          var p = f.getAttribute(o), x = p !== null && p !== "false", h = (Et.get(f) || 0) + 1, m = (i.get(f) || 0) + 1;
          Et.set(f, h), i.set(f, m), s.push(f), h === 1 && x && On.set(f, !0), m === 1 && f.setAttribute(n, "true"), x || f.setAttribute(o, "true");
        } catch (v) {
          console.error("aria-hidden: cannot operate on ", f, v);
        }
    });
  };
  return u(t), a.clear(), sr++, function() {
    s.forEach(function(d) {
      var f = Et.get(d) - 1, p = i.get(d) - 1;
      Et.set(d, f), i.set(d, p), f || (On.has(d) || d.removeAttribute(o), On.delete(d)), p || d.removeAttribute(n);
    }), sr--, sr || (Et = /* @__PURE__ */ new WeakMap(), Et = /* @__PURE__ */ new WeakMap(), On = /* @__PURE__ */ new WeakMap(), Tn = {});
  };
}, bi = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var o = Array.from(Array.isArray(e) ? e : [e]), r = am(e);
  return r ? (o.push.apply(o, Array.from(r.querySelectorAll("[aria-live], script"))), lm(o, r, n, "aria-hidden")) : function() {
    return null;
  };
}, Oe = function() {
  return Oe = Object.assign || function(t) {
    for (var n, o = 1, r = arguments.length; o < r; o++) {
      n = arguments[o];
      for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && (t[i] = n[i]);
    }
    return t;
  }, Oe.apply(this, arguments);
};
function Xc(e, t) {
  var n = {};
  for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && t.indexOf(o) < 0 && (n[o] = e[o]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, o = Object.getOwnPropertySymbols(e); r < o.length; r++)
      t.indexOf(o[r]) < 0 && Object.prototype.propertyIsEnumerable.call(e, o[r]) && (n[o[r]] = e[o[r]]);
  return n;
}
function um(e, t, n) {
  if (n || arguments.length === 2) for (var o = 0, r = t.length, i; o < r; o++)
    (i || !(o in t)) && (i || (i = Array.prototype.slice.call(t, 0, o)), i[o] = t[o]);
  return e.concat(i || Array.prototype.slice.call(t));
}
var Wn = "right-scroll-bar-position", Hn = "width-before-scroll-bar", dm = "with-scroll-bars-hidden", fm = "--removed-body-scroll-bar-size";
function ar(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function pm(e, t) {
  var n = V(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return n.value;
        },
        set current(o) {
          var r = n.value;
          r !== o && (n.value = o, n.callback(o, r));
        }
      }
    };
  })[0];
  return n.callback = t, n.facade;
}
var hm = typeof window < "u" ? Se : W, Us = /* @__PURE__ */ new WeakMap();
function xm(e, t) {
  var n = pm(null, function(o) {
    return e.forEach(function(r) {
      return ar(r, o);
    });
  });
  return hm(function() {
    var o = Us.get(n);
    if (o) {
      var r = new Set(o), i = new Set(e), s = n.current;
      r.forEach(function(a) {
        i.has(a) || ar(a, null);
      }), i.forEach(function(a) {
        r.has(a) || ar(a, s);
      });
    }
    Us.set(n, e);
  }, [e]), n;
}
function mm(e) {
  return e;
}
function vm(e, t) {
  t === void 0 && (t = mm);
  var n = [], o = !1, r = {
    read: function() {
      if (o)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(i) {
      var s = t(i, o);
      return n.push(s), function() {
        n = n.filter(function(a) {
          return a !== s;
        });
      };
    },
    assignSyncMedium: function(i) {
      for (o = !0; n.length; ) {
        var s = n;
        n = [], s.forEach(i);
      }
      n = {
        push: function(a) {
          return i(a);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(i) {
      o = !0;
      var s = [];
      if (n.length) {
        var a = n;
        n = [], a.forEach(i), s = n;
      }
      var l = function() {
        var u = s;
        s = [], u.forEach(i);
      }, c = function() {
        return Promise.resolve().then(l);
      };
      c(), n = {
        push: function(u) {
          s.push(u), c();
        },
        filter: function(u) {
          return s = s.filter(u), n;
        }
      };
    }
  };
  return r;
}
function gm(e) {
  e === void 0 && (e = {});
  var t = vm(null);
  return t.options = Oe({ async: !0, ssr: !1 }, e), t;
}
var Jc = function(e) {
  var t = e.sideCar, n = Xc(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var o = t.read();
  if (!o)
    throw new Error("Sidecar medium not found");
  return C(o, Oe({}, n));
};
Jc.isSideCarExport = !0;
function bm(e, t) {
  return e.useMedium(t), Jc;
}
var qc = gm(), cr = function() {
}, So = F(function(e, t) {
  var n = M(null), o = V({
    onScrollCapture: cr,
    onWheelCapture: cr,
    onTouchMoveCapture: cr
  }), r = o[0], i = o[1], s = e.forwardProps, a = e.children, l = e.className, c = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, x = e.noIsolation, h = e.inert, m = e.allowPinchZoom, v = e.as, g = v === void 0 ? "div" : v, w = e.gapMode, _ = Xc(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), S = f, y = xm([n, t]), N = Oe(Oe({}, _), r);
  return C(
    ce,
    null,
    u && C(S, { sideCar: qc, removeScrollBar: c, shards: d, noRelative: p, noIsolation: x, inert: h, setCallbacks: i, allowPinchZoom: !!m, lockRef: n, gapMode: w }),
    s ? $t(Ue.only(a), Oe(Oe({}, N), { ref: y })) : C(g, Oe({}, N, { className: l, ref: y }), a)
  );
});
So.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
So.classNames = {
  fullWidth: Hn,
  zeroRight: Wn
};
var wm = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function ym() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = wm();
  return t && e.setAttribute("nonce", t), e;
}
function Cm(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function _m(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Sm = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = ym()) && (Cm(t, n), _m(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, Nm = function() {
  var e = Sm();
  return function(t, n) {
    W(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, Zc = function() {
  var e = Nm(), t = function(n) {
    var o = n.styles, r = n.dynamic;
    return e(o, r), null;
  };
  return t;
}, Em = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, lr = function(e) {
  return parseInt(e || "", 10) || 0;
}, Am = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], o = t[e === "padding" ? "paddingTop" : "marginTop"], r = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [lr(n), lr(o), lr(r)];
}, Fm = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return Em;
  var t = Am(e), n = document.documentElement.clientWidth, o = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, o - n + t[2] - t[0])
  };
}, Mm = Zc(), Pt = "data-scroll-locked", km = function(e, t, n, o) {
  var r = e.left, i = e.top, s = e.right, a = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(dm, ` {
   overflow: hidden `).concat(o, `;
   padding-right: `).concat(a, "px ").concat(o, `;
  }
  body[`).concat(Pt, `] {
    overflow: hidden `).concat(o, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(o, ";"),
    n === "margin" && `
    padding-left: `.concat(r, `px;
    padding-top: `).concat(i, `px;
    padding-right: `).concat(s, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(a, "px ").concat(o, `;
    `),
    n === "padding" && "padding-right: ".concat(a, "px ").concat(o, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Wn, ` {
    right: `).concat(a, "px ").concat(o, `;
  }
  
  .`).concat(Hn, ` {
    margin-right: `).concat(a, "px ").concat(o, `;
  }
  
  .`).concat(Wn, " .").concat(Wn, ` {
    right: 0 `).concat(o, `;
  }
  
  .`).concat(Hn, " .").concat(Hn, ` {
    margin-right: 0 `).concat(o, `;
  }
  
  body[`).concat(Pt, `] {
    `).concat(fm, ": ").concat(a, `px;
  }
`);
}, js = function() {
  var e = parseInt(document.body.getAttribute(Pt) || "0", 10);
  return isFinite(e) ? e : 0;
}, Pm = function() {
  W(function() {
    return document.body.setAttribute(Pt, (js() + 1).toString()), function() {
      var e = js() - 1;
      e <= 0 ? document.body.removeAttribute(Pt) : document.body.setAttribute(Pt, e.toString());
    };
  }, []);
}, Dm = function(e) {
  var t = e.noRelative, n = e.noImportant, o = e.gapMode, r = o === void 0 ? "margin" : o;
  Pm();
  var i = ue(function() {
    return Fm(r);
  }, [r]);
  return C(Mm, { styles: km(i, !t, r, n ? "" : "!important") });
}, Ar = !1;
if (typeof window < "u")
  try {
    var Rn = Object.defineProperty({}, "passive", {
      get: function() {
        return Ar = !0, !0;
      }
    });
    window.addEventListener("test", Rn, Rn), window.removeEventListener("test", Rn, Rn);
  } catch {
    Ar = !1;
  }
var At = Ar ? { passive: !1 } : !1, Om = function(e) {
  return e.tagName === "TEXTAREA";
}, Qc = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !Om(e) && n[t] === "visible")
  );
}, Tm = function(e) {
  return Qc(e, "overflowY");
}, Rm = function(e) {
  return Qc(e, "overflowX");
}, zs = function(e, t) {
  var n = t.ownerDocument, o = t;
  do {
    typeof ShadowRoot < "u" && o instanceof ShadowRoot && (o = o.host);
    var r = el(e, o);
    if (r) {
      var i = tl(e, o), s = i[1], a = i[2];
      if (s > a)
        return !0;
    }
    o = o.parentNode;
  } while (o && o !== n.body);
  return !1;
}, Bm = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, o = e.clientHeight;
  return [
    t,
    n,
    o
  ];
}, Im = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, o = e.clientWidth;
  return [
    t,
    n,
    o
  ];
}, el = function(e, t) {
  return e === "v" ? Tm(t) : Rm(t);
}, tl = function(e, t) {
  return e === "v" ? Bm(t) : Im(t);
}, Lm = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, $m = function(e, t, n, o, r) {
  var i = Lm(e, window.getComputedStyle(t).direction), s = i * o, a = n.target, l = t.contains(a), c = !1, u = s > 0, d = 0, f = 0;
  do {
    if (!a)
      break;
    var p = tl(e, a), x = p[0], h = p[1], m = p[2], v = h - m - i * x;
    (x || v) && el(e, a) && (d += v, f += x);
    var g = a.parentNode;
    a = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
  } while (
    // portaled content
    !l && a !== document.body || // self content
    l && (t.contains(a) || t === a)
  );
  return (u && Math.abs(d) < 1 || !u && Math.abs(f) < 1) && (c = !0), c;
}, Bn = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Ks = function(e) {
  return [e.deltaX, e.deltaY];
}, Gs = function(e) {
  return e && "current" in e ? e.current : e;
}, Wm = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, Hm = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, Vm = 0, Ft = [];
function Um(e) {
  var t = M([]), n = M([0, 0]), o = M(), r = V(Vm++)[0], i = V(Zc)[0], s = M(e);
  W(function() {
    s.current = e;
  }, [e]), W(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(r));
      var h = um([e.lockRef.current], (e.shards || []).map(Gs), !0).filter(Boolean);
      return h.forEach(function(m) {
        return m.classList.add("allow-interactivity-".concat(r));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(r)), h.forEach(function(m) {
          return m.classList.remove("allow-interactivity-".concat(r));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var a = j(function(h, m) {
    if ("touches" in h && h.touches.length === 2 || h.type === "wheel" && h.ctrlKey)
      return !s.current.allowPinchZoom;
    var v = Bn(h), g = n.current, w = "deltaX" in h ? h.deltaX : g[0] - v[0], _ = "deltaY" in h ? h.deltaY : g[1] - v[1], S, y = h.target, N = Math.abs(w) > Math.abs(_) ? "h" : "v";
    if ("touches" in h && N === "h" && y.type === "range")
      return !1;
    var k = window.getSelection(), O = k && k.anchorNode, E = O ? O === y || O.contains(y) : !1;
    if (E)
      return !1;
    var P = zs(N, y);
    if (!P)
      return !0;
    if (P ? S = N : (S = N === "v" ? "h" : "v", P = zs(N, y)), !P)
      return !1;
    if (!o.current && "changedTouches" in h && (w || _) && (o.current = S), !S)
      return !0;
    var L = o.current || S;
    return $m(L, m, h, L === "h" ? w : _);
  }, []), l = j(function(h) {
    var m = h;
    if (!(!Ft.length || Ft[Ft.length - 1] !== i)) {
      var v = "deltaY" in m ? Ks(m) : Bn(m), g = t.current.filter(function(S) {
        return S.name === m.type && (S.target === m.target || m.target === S.shadowParent) && Wm(S.delta, v);
      })[0];
      if (g && g.should) {
        m.cancelable && m.preventDefault();
        return;
      }
      if (!g) {
        var w = (s.current.shards || []).map(Gs).filter(Boolean).filter(function(S) {
          return S.contains(m.target);
        }), _ = w.length > 0 ? a(m, w[0]) : !s.current.noIsolation;
        _ && m.cancelable && m.preventDefault();
      }
    }
  }, []), c = j(function(h, m, v, g) {
    var w = { name: h, delta: m, target: v, should: g, shadowParent: jm(v) };
    t.current.push(w), setTimeout(function() {
      t.current = t.current.filter(function(_) {
        return _ !== w;
      });
    }, 1);
  }, []), u = j(function(h) {
    n.current = Bn(h), o.current = void 0;
  }, []), d = j(function(h) {
    c(h.type, Ks(h), h.target, a(h, e.lockRef.current));
  }, []), f = j(function(h) {
    c(h.type, Bn(h), h.target, a(h, e.lockRef.current));
  }, []);
  W(function() {
    return Ft.push(i), e.setCallbacks({
      onScrollCapture: d,
      onWheelCapture: d,
      onTouchMoveCapture: f
    }), document.addEventListener("wheel", l, At), document.addEventListener("touchmove", l, At), document.addEventListener("touchstart", u, At), function() {
      Ft = Ft.filter(function(h) {
        return h !== i;
      }), document.removeEventListener("wheel", l, At), document.removeEventListener("touchmove", l, At), document.removeEventListener("touchstart", u, At);
    };
  }, []);
  var p = e.removeScrollBar, x = e.inert;
  return C(
    ce,
    null,
    x ? C(i, { styles: Hm(r) }) : null,
    p ? C(Dm, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function jm(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const zm = bm(qc, Um);
var No = F(function(e, t) {
  return C(So, Oe({}, e, { ref: t, sideCar: zm }));
});
No.classNames = So.classNames;
var Km = [" ", "Enter", "ArrowUp", "ArrowDown"], Gm = [" ", "Enter"], mt = "Select", [Eo, Ao, Ym] = xn(mt), [Gt] = pe(mt, [
  Ym,
  He
]), Fo = He(), [Xm, ot] = Gt(mt), [Jm, qm] = Gt(mt), nl = (e) => {
  const {
    __scopeSelect: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    value: s,
    defaultValue: a,
    onValueChange: l,
    dir: c,
    name: u,
    autoComplete: d,
    disabled: f,
    required: p,
    form: x
  } = e, h = Fo(t), [m, v] = V(null), [g, w] = V(null), [_, S] = V(!1), y = Wt(c), [N, k] = ve({
    prop: o,
    defaultProp: r ?? !1,
    onChange: i,
    caller: mt
  }), [O, E] = ve({
    prop: s,
    defaultProp: a,
    onChange: l,
    caller: mt
  }), P = M(null), L = m ? x || !!m.closest("form") : !0, [H, $] = V(/* @__PURE__ */ new Set()), B = Array.from(H).map((D) => D.props.value).join(";");
  return /* @__PURE__ */ b(vn, { ...h, children: /* @__PURE__ */ b(
    Xm,
    {
      required: p,
      scope: t,
      trigger: m,
      onTriggerChange: v,
      valueNode: g,
      onValueNodeChange: w,
      valueNodeHasChildren: _,
      onValueNodeHasChildrenChange: S,
      contentId: Me(),
      value: O,
      onValueChange: E,
      open: N,
      onOpenChange: k,
      dir: y,
      triggerPointerDownPosRef: P,
      disabled: f,
      children: [
        /* @__PURE__ */ b(Eo.Provider, { scope: t, children: /* @__PURE__ */ b(
          Jm,
          {
            scope: e.__scopeSelect,
            onNativeOptionAdd: j((D) => {
              $((R) => new Set(R).add(D));
            }, []),
            onNativeOptionRemove: j((D) => {
              $((R) => {
                const A = new Set(R);
                return A.delete(D), A;
              });
            }, []),
            children: n
          }
        ) }),
        L ? /* @__PURE__ */ b(
          Cl,
          {
            "aria-hidden": !0,
            required: p,
            tabIndex: -1,
            name: u,
            autoComplete: d,
            value: O,
            onChange: (D) => E(D.target.value),
            disabled: f,
            form: x,
            children: [
              O === void 0 ? /* @__PURE__ */ b("option", { value: "" }) : null,
              Array.from(H)
            ]
          },
          B
        ) : null
      ]
    }
  ) });
};
nl.displayName = mt;
var ol = "SelectTrigger", rl = F(
  (e, t) => {
    const { __scopeSelect: n, disabled: o = !1, ...r } = e, i = Fo(n), s = ot(ol, n), a = s.disabled || o, l = G(t, s.onTriggerChange), c = Ao(n), u = M("touch"), [d, f, p] = Sl((h) => {
      const m = c().filter((w) => !w.disabled), v = m.find((w) => w.value === s.value), g = Nl(m, h, v);
      g !== void 0 && s.onValueChange(g.value);
    }), x = (h) => {
      a || (s.onOpenChange(!0), p()), h && (s.triggerPointerDownPosRef.current = {
        x: Math.round(h.pageX),
        y: Math.round(h.pageY)
      });
    };
    return /* @__PURE__ */ b(zt, { asChild: !0, ...i, children: /* @__PURE__ */ b(
      z.button,
      {
        type: "button",
        role: "combobox",
        "aria-controls": s.contentId,
        "aria-expanded": s.open,
        "aria-required": s.required,
        "aria-autocomplete": "none",
        dir: s.dir,
        "data-state": s.open ? "open" : "closed",
        disabled: a,
        "data-disabled": a ? "" : void 0,
        "data-placeholder": _l(s.value) ? "" : void 0,
        ...r,
        ref: l,
        onClick: I(r.onClick, (h) => {
          h.currentTarget.focus(), u.current !== "mouse" && x(h);
        }),
        onPointerDown: I(r.onPointerDown, (h) => {
          u.current = h.pointerType;
          const m = h.target;
          m.hasPointerCapture(h.pointerId) && m.releasePointerCapture(h.pointerId), h.button === 0 && h.ctrlKey === !1 && h.pointerType === "mouse" && (x(h), h.preventDefault());
        }),
        onKeyDown: I(r.onKeyDown, (h) => {
          const m = d.current !== "";
          !(h.ctrlKey || h.altKey || h.metaKey) && h.key.length === 1 && f(h.key), !(m && h.key === " ") && Km.includes(h.key) && (x(), h.preventDefault());
        })
      }
    ) });
  }
);
rl.displayName = ol;
var il = "SelectValue", sl = F(
  (e, t) => {
    const { __scopeSelect: n, className: o, style: r, children: i, placeholder: s = "", ...a } = e, l = ot(il, n), { onValueNodeHasChildrenChange: c } = l, u = i !== void 0, d = G(t, l.onValueNodeChange);
    return fe(() => {
      c(u);
    }, [c, u]), /* @__PURE__ */ b(
      z.span,
      {
        ...a,
        ref: d,
        style: { pointerEvents: "none" },
        children: _l(l.value) ? /* @__PURE__ */ b(ce, { children: s }) : i
      }
    );
  }
);
sl.displayName = il;
var Zm = "SelectIcon", al = F(
  (e, t) => {
    const { __scopeSelect: n, children: o, ...r } = e;
    return /* @__PURE__ */ b(z.span, { "aria-hidden": !0, ...r, ref: t, children: o || "▼" });
  }
);
al.displayName = Zm;
var Qm = "SelectPortal", cl = (e) => /* @__PURE__ */ b(Kt, { asChild: !0, ...e });
cl.displayName = Qm;
var vt = "SelectContent", ll = F(
  (e, t) => {
    const n = ot(vt, e.__scopeSelect), [o, r] = V();
    if (fe(() => {
      r(new DocumentFragment());
    }, []), !n.open) {
      const i = o;
      return i ? bt(
        /* @__PURE__ */ b(ul, { scope: e.__scopeSelect, children: /* @__PURE__ */ b(Eo.Slot, { scope: e.__scopeSelect, children: /* @__PURE__ */ b("div", { children: e.children }) }) }),
        i
      ) : null;
    }
    return /* @__PURE__ */ b(dl, { ...e, ref: t });
  }
);
ll.displayName = vt;
var Ne = 10, [ul, rt] = Gt(vt), ev = "SelectContentImpl", tv = /* @__PURE__ */ Tt("SelectContent.RemoveScroll"), dl = F(
  (e, t) => {
    const {
      __scopeSelect: n,
      position: o = "item-aligned",
      onCloseAutoFocus: r,
      onEscapeKeyDown: i,
      onPointerDownOutside: s,
      //
      // PopperContent props
      side: a,
      sideOffset: l,
      align: c,
      alignOffset: u,
      arrowPadding: d,
      collisionBoundary: f,
      collisionPadding: p,
      sticky: x,
      hideWhenDetached: h,
      avoidCollisions: m,
      //
      ...v
    } = e, g = ot(vt, n), [w, _] = V(null), [S, y] = V(null), N = G(t, (U) => _(U)), [k, O] = V(null), [E, P] = V(
      null
    ), L = Ao(n), [H, $] = V(!1), B = M(!1);
    W(() => {
      if (w) return bi(w);
    }, [w]), ui();
    const D = j(
      (U) => {
        const [Q, ...he] = L().map((ae) => ae.ref.current), [te] = he.slice(-1), ne = document.activeElement;
        for (const ae of U)
          if (ae === ne || (ae?.scrollIntoView({ block: "nearest" }), ae === Q && S && (S.scrollTop = 0), ae === te && S && (S.scrollTop = S.scrollHeight), ae?.focus(), document.activeElement !== ne)) return;
      },
      [L, S]
    ), R = j(
      () => D([k, w]),
      [D, k, w]
    );
    W(() => {
      H && R();
    }, [H, R]);
    const { onOpenChange: A, triggerPointerDownPosRef: T } = g;
    W(() => {
      if (w) {
        let U = { x: 0, y: 0 };
        const Q = (te) => {
          U = {
            x: Math.abs(Math.round(te.pageX) - (T.current?.x ?? 0)),
            y: Math.abs(Math.round(te.pageY) - (T.current?.y ?? 0))
          };
        }, he = (te) => {
          U.x <= 10 && U.y <= 10 ? te.preventDefault() : w.contains(te.target) || A(!1), document.removeEventListener("pointermove", Q), T.current = null;
        };
        return T.current !== null && (document.addEventListener("pointermove", Q), document.addEventListener("pointerup", he, { capture: !0, once: !0 })), () => {
          document.removeEventListener("pointermove", Q), document.removeEventListener("pointerup", he, { capture: !0 });
        };
      }
    }, [w, A, T]), W(() => {
      const U = () => A(!1);
      return window.addEventListener("blur", U), window.addEventListener("resize", U), () => {
        window.removeEventListener("blur", U), window.removeEventListener("resize", U);
      };
    }, [A]);
    const [Y, X] = Sl((U) => {
      const Q = L().filter((ne) => !ne.disabled), he = Q.find((ne) => ne.ref.current === document.activeElement), te = Nl(Q, U, he);
      te && setTimeout(() => te.ref.current.focus());
    }), q = j(
      (U, Q, he) => {
        const te = !B.current && !he;
        (g.value !== void 0 && g.value === Q || te) && (O(U), te && (B.current = !0));
      },
      [g.value]
    ), Z = j(() => w?.focus(), [w]), re = j(
      (U, Q, he) => {
        const te = !B.current && !he;
        (g.value !== void 0 && g.value === Q || te) && P(U);
      },
      [g.value]
    ), be = o === "popper" ? Fr : fl, de = be === Fr ? {
      side: a,
      sideOffset: l,
      align: c,
      alignOffset: u,
      arrowPadding: d,
      collisionBoundary: f,
      collisionPadding: p,
      sticky: x,
      hideWhenDetached: h,
      avoidCollisions: m
    } : {};
    return /* @__PURE__ */ b(
      ul,
      {
        scope: n,
        content: w,
        viewport: S,
        onViewportChange: y,
        itemRefCallback: q,
        selectedItem: k,
        onItemLeave: Z,
        itemTextRefCallback: re,
        focusSelectedItem: R,
        selectedItemText: E,
        position: o,
        isPositioned: H,
        searchRef: Y,
        children: /* @__PURE__ */ b(No, { as: tv, allowPinchZoom: !0, children: /* @__PURE__ */ b(
          bo,
          {
            asChild: !0,
            trapped: g.open,
            onMountAutoFocus: (U) => {
              U.preventDefault();
            },
            onUnmountAutoFocus: I(r, (U) => {
              g.trigger?.focus({ preventScroll: !0 }), U.preventDefault();
            }),
            children: /* @__PURE__ */ b(
              Vt,
              {
                asChild: !0,
                disableOutsidePointerEvents: !0,
                onEscapeKeyDown: i,
                onPointerDownOutside: s,
                onFocusOutside: (U) => U.preventDefault(),
                onDismiss: () => g.onOpenChange(!1),
                children: /* @__PURE__ */ b(
                  be,
                  {
                    role: "listbox",
                    id: g.contentId,
                    "data-state": g.open ? "open" : "closed",
                    dir: g.dir,
                    onContextMenu: (U) => U.preventDefault(),
                    ...v,
                    ...de,
                    onPlaced: () => $(!0),
                    ref: N,
                    style: {
                      // flex layout so we can place the scroll buttons properly
                      display: "flex",
                      flexDirection: "column",
                      // reset the outline by default as the content MAY get focused
                      outline: "none",
                      ...v.style
                    },
                    onKeyDown: I(v.onKeyDown, (U) => {
                      const Q = U.ctrlKey || U.altKey || U.metaKey;
                      if (U.key === "Tab" && U.preventDefault(), !Q && U.key.length === 1 && X(U.key), ["ArrowUp", "ArrowDown", "Home", "End"].includes(U.key)) {
                        let te = L().filter((ne) => !ne.disabled).map((ne) => ne.ref.current);
                        if (["ArrowUp", "End"].includes(U.key) && (te = te.slice().reverse()), ["ArrowUp", "ArrowDown"].includes(U.key)) {
                          const ne = U.target, ae = te.indexOf(ne);
                          te = te.slice(ae + 1);
                        }
                        setTimeout(() => D(te)), U.preventDefault();
                      }
                    })
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
dl.displayName = ev;
var nv = "SelectItemAlignedPosition", fl = F((e, t) => {
  const { __scopeSelect: n, onPlaced: o, ...r } = e, i = ot(vt, n), s = rt(vt, n), [a, l] = V(null), [c, u] = V(null), d = G(t, (N) => u(N)), f = Ao(n), p = M(!1), x = M(!0), { viewport: h, selectedItem: m, selectedItemText: v, focusSelectedItem: g } = s, w = j(() => {
    if (i.trigger && i.valueNode && a && c && h && m && v) {
      const N = i.trigger.getBoundingClientRect(), k = c.getBoundingClientRect(), O = i.valueNode.getBoundingClientRect(), E = v.getBoundingClientRect();
      if (i.dir !== "rtl") {
        const ne = E.left - k.left, ae = O.left - ne, Ce = N.left - ae, at = N.width + Ce, zo = Math.max(at, k.width), Ko = window.innerWidth - Ne, Go = Xn(ae, [
          Ne,
          // Prevents the content from going off the starting edge of the
          // viewport. It may still go off the ending edge, but this can be
          // controlled by the user since they may want to manage overflow in a
          // specific way.
          // https://github.com/radix-ui/primitives/issues/2049
          Math.max(Ne, Ko - zo)
        ]);
        a.style.minWidth = at + "px", a.style.left = Go + "px";
      } else {
        const ne = k.right - E.right, ae = window.innerWidth - O.right - ne, Ce = window.innerWidth - N.right - ae, at = N.width + Ce, zo = Math.max(at, k.width), Ko = window.innerWidth - Ne, Go = Xn(ae, [
          Ne,
          Math.max(Ne, Ko - zo)
        ]);
        a.style.minWidth = at + "px", a.style.right = Go + "px";
      }
      const P = f(), L = window.innerHeight - Ne * 2, H = h.scrollHeight, $ = window.getComputedStyle(c), B = parseInt($.borderTopWidth, 10), D = parseInt($.paddingTop, 10), R = parseInt($.borderBottomWidth, 10), A = parseInt($.paddingBottom, 10), T = B + D + H + A + R, Y = Math.min(m.offsetHeight * 5, T), X = window.getComputedStyle(h), q = parseInt(X.paddingTop, 10), Z = parseInt(X.paddingBottom, 10), re = N.top + N.height / 2 - Ne, be = L - re, de = m.offsetHeight / 2, U = m.offsetTop + de, Q = B + D + U, he = T - Q;
      if (Q <= re) {
        const ne = P.length > 0 && m === P[P.length - 1].ref.current;
        a.style.bottom = "0px";
        const ae = c.clientHeight - h.offsetTop - h.offsetHeight, Ce = Math.max(
          be,
          de + // viewport might have padding bottom, include it to avoid a scrollable viewport
          (ne ? Z : 0) + ae + R
        ), at = Q + Ce;
        a.style.height = at + "px";
      } else {
        const ne = P.length > 0 && m === P[0].ref.current;
        a.style.top = "0px";
        const Ce = Math.max(
          re,
          B + h.offsetTop + // viewport might have padding top, include it to avoid a scrollable viewport
          (ne ? q : 0) + de
        ) + he;
        a.style.height = Ce + "px", h.scrollTop = Q - re + h.offsetTop;
      }
      a.style.margin = `${Ne}px 0`, a.style.minHeight = Y + "px", a.style.maxHeight = L + "px", o?.(), requestAnimationFrame(() => p.current = !0);
    }
  }, [
    f,
    i.trigger,
    i.valueNode,
    a,
    c,
    h,
    m,
    v,
    i.dir,
    o
  ]);
  fe(() => w(), [w]);
  const [_, S] = V();
  fe(() => {
    c && S(window.getComputedStyle(c).zIndex);
  }, [c]);
  const y = j(
    (N) => {
      N && x.current === !0 && (w(), g?.(), x.current = !1);
    },
    [w, g]
  );
  return /* @__PURE__ */ b(
    rv,
    {
      scope: n,
      contentWrapper: a,
      shouldExpandOnScrollRef: p,
      onScrollButtonChange: y,
      children: /* @__PURE__ */ b(
        "div",
        {
          ref: l,
          style: {
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            zIndex: _
          },
          children: /* @__PURE__ */ b(
            z.div,
            {
              ...r,
              ref: d,
              style: {
                // When we get the height of the content, it includes borders. If we were to set
                // the height without having `boxSizing: 'border-box'` it would be too big.
                boxSizing: "border-box",
                // We need to ensure the content doesn't get taller than the wrapper
                maxHeight: "100%",
                ...r.style
              }
            }
          )
        }
      )
    }
  );
});
fl.displayName = nv;
var ov = "SelectPopperPosition", Fr = F((e, t) => {
  const {
    __scopeSelect: n,
    align: o = "start",
    collisionPadding: r = Ne,
    ...i
  } = e, s = Fo(n);
  return /* @__PURE__ */ b(
    gn,
    {
      ...s,
      ...i,
      ref: t,
      align: o,
      collisionPadding: r,
      style: {
        // Ensure border-box for floating-ui calculations
        boxSizing: "border-box",
        ...i.style,
        "--radix-select-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-select-content-available-width": "var(--radix-popper-available-width)",
        "--radix-select-content-available-height": "var(--radix-popper-available-height)",
        "--radix-select-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-select-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
Fr.displayName = ov;
var [rv, wi] = Gt(vt, {}), Mr = "SelectViewport", pl = F(
  (e, t) => {
    const { __scopeSelect: n, nonce: o, ...r } = e, i = rt(Mr, n), s = wi(Mr, n), a = G(t, i.onViewportChange), l = M(0);
    return /* @__PURE__ */ b(ce, { children: [
      /* @__PURE__ */ b(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: "[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}"
          },
          nonce: o
        }
      ),
      /* @__PURE__ */ b(Eo.Slot, { scope: n, children: /* @__PURE__ */ b(
        z.div,
        {
          "data-radix-select-viewport": "",
          role: "presentation",
          ...r,
          ref: a,
          style: {
            // we use position: 'relative' here on the `viewport` so that when we call
            // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
            // (independent of the scrollUpButton).
            position: "relative",
            flex: 1,
            // Viewport should only be scrollable in the vertical direction.
            // This won't work in vertical writing modes, so we'll need to
            // revisit this if/when that is supported
            // https://developer.chrome.com/blog/vertical-form-controls
            overflow: "hidden auto",
            ...r.style
          },
          onScroll: I(r.onScroll, (c) => {
            const u = c.currentTarget, { contentWrapper: d, shouldExpandOnScrollRef: f } = s;
            if (f?.current && d) {
              const p = Math.abs(l.current - u.scrollTop);
              if (p > 0) {
                const x = window.innerHeight - Ne * 2, h = parseFloat(d.style.minHeight), m = parseFloat(d.style.height), v = Math.max(h, m);
                if (v < x) {
                  const g = v + p, w = Math.min(x, g), _ = g - w;
                  d.style.height = w + "px", d.style.bottom === "0px" && (u.scrollTop = _ > 0 ? _ : 0, d.style.justifyContent = "flex-end");
                }
              }
            }
            l.current = u.scrollTop;
          })
        }
      ) })
    ] });
  }
);
pl.displayName = Mr;
var hl = "SelectGroup", [iv, sv] = Gt(hl), av = F(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e, r = Me();
    return /* @__PURE__ */ b(iv, { scope: n, id: r, children: /* @__PURE__ */ b(z.div, { role: "group", "aria-labelledby": r, ...o, ref: t }) });
  }
);
av.displayName = hl;
var xl = "SelectLabel", cv = F(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e, r = sv(xl, n);
    return /* @__PURE__ */ b(z.div, { id: r.id, ...o, ref: t });
  }
);
cv.displayName = xl;
var eo = "SelectItem", [lv, ml] = Gt(eo), vl = F(
  (e, t) => {
    const {
      __scopeSelect: n,
      value: o,
      disabled: r = !1,
      textValue: i,
      ...s
    } = e, a = ot(eo, n), l = rt(eo, n), c = a.value === o, [u, d] = V(i ?? ""), [f, p] = V(!1), x = G(
      t,
      (g) => l.itemRefCallback?.(g, o, r)
    ), h = Me(), m = M("touch"), v = () => {
      r || (a.onValueChange(o), a.onOpenChange(!1));
    };
    if (o === "")
      throw new Error(
        "A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder."
      );
    return /* @__PURE__ */ b(
      lv,
      {
        scope: n,
        value: o,
        disabled: r,
        textId: h,
        isSelected: c,
        onItemTextChange: j((g) => {
          d((w) => w || (g?.textContent ?? "").trim());
        }, []),
        children: /* @__PURE__ */ b(
          Eo.ItemSlot,
          {
            scope: n,
            value: o,
            disabled: r,
            textValue: u,
            children: /* @__PURE__ */ b(
              z.div,
              {
                role: "option",
                "aria-labelledby": h,
                "data-highlighted": f ? "" : void 0,
                "aria-selected": c && f,
                "data-state": c ? "checked" : "unchecked",
                "aria-disabled": r || void 0,
                "data-disabled": r ? "" : void 0,
                tabIndex: r ? void 0 : -1,
                ...s,
                ref: x,
                onFocus: I(s.onFocus, () => p(!0)),
                onBlur: I(s.onBlur, () => p(!1)),
                onClick: I(s.onClick, () => {
                  m.current !== "mouse" && v();
                }),
                onPointerUp: I(s.onPointerUp, () => {
                  m.current === "mouse" && v();
                }),
                onPointerDown: I(s.onPointerDown, (g) => {
                  m.current = g.pointerType;
                }),
                onPointerMove: I(s.onPointerMove, (g) => {
                  m.current = g.pointerType, r ? l.onItemLeave?.() : m.current === "mouse" && g.currentTarget.focus({ preventScroll: !0 });
                }),
                onPointerLeave: I(s.onPointerLeave, (g) => {
                  g.currentTarget === document.activeElement && l.onItemLeave?.();
                }),
                onKeyDown: I(s.onKeyDown, (g) => {
                  l.searchRef?.current !== "" && g.key === " " || (Gm.includes(g.key) && v(), g.key === " " && g.preventDefault());
                })
              }
            )
          }
        )
      }
    );
  }
);
vl.displayName = eo;
var Zt = "SelectItemText", gl = F(
  (e, t) => {
    const { __scopeSelect: n, className: o, style: r, ...i } = e, s = ot(Zt, n), a = rt(Zt, n), l = ml(Zt, n), c = qm(Zt, n), [u, d] = V(null), f = G(
      t,
      (v) => d(v),
      l.onItemTextChange,
      (v) => a.itemTextRefCallback?.(v, l.value, l.disabled)
    ), p = u?.textContent, x = ue(
      () => /* @__PURE__ */ b("option", { value: l.value, disabled: l.disabled, children: p }, l.value),
      [l.disabled, l.value, p]
    ), { onNativeOptionAdd: h, onNativeOptionRemove: m } = c;
    return fe(() => (h(x), () => m(x)), [h, m, x]), /* @__PURE__ */ b(ce, { children: [
      /* @__PURE__ */ b(z.span, { id: l.textId, ...i, ref: f }),
      l.isSelected && s.valueNode && !s.valueNodeHasChildren ? bt(i.children, s.valueNode) : null
    ] });
  }
);
gl.displayName = Zt;
var bl = "SelectItemIndicator", wl = F(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e;
    return ml(bl, n).isSelected ? /* @__PURE__ */ b(z.span, { "aria-hidden": !0, ...o, ref: t }) : null;
  }
);
wl.displayName = bl;
var kr = "SelectScrollUpButton", uv = F((e, t) => {
  const n = rt(kr, e.__scopeSelect), o = wi(kr, e.__scopeSelect), [r, i] = V(!1), s = G(t, o.onScrollButtonChange);
  return fe(() => {
    if (n.viewport && n.isPositioned) {
      let a = function() {
        const c = l.scrollTop > 0;
        i(c);
      };
      const l = n.viewport;
      return a(), l.addEventListener("scroll", a), () => l.removeEventListener("scroll", a);
    }
  }, [n.viewport, n.isPositioned]), r ? /* @__PURE__ */ b(
    yl,
    {
      ...e,
      ref: s,
      onAutoScroll: () => {
        const { viewport: a, selectedItem: l } = n;
        a && l && (a.scrollTop = a.scrollTop - l.offsetHeight);
      }
    }
  ) : null;
});
uv.displayName = kr;
var Pr = "SelectScrollDownButton", dv = F((e, t) => {
  const n = rt(Pr, e.__scopeSelect), o = wi(Pr, e.__scopeSelect), [r, i] = V(!1), s = G(t, o.onScrollButtonChange);
  return fe(() => {
    if (n.viewport && n.isPositioned) {
      let a = function() {
        const c = l.scrollHeight - l.clientHeight, u = Math.ceil(l.scrollTop) < c;
        i(u);
      };
      const l = n.viewport;
      return a(), l.addEventListener("scroll", a), () => l.removeEventListener("scroll", a);
    }
  }, [n.viewport, n.isPositioned]), r ? /* @__PURE__ */ b(
    yl,
    {
      ...e,
      ref: s,
      onAutoScroll: () => {
        const { viewport: a, selectedItem: l } = n;
        a && l && (a.scrollTop = a.scrollTop + l.offsetHeight);
      }
    }
  ) : null;
});
dv.displayName = Pr;
var yl = F((e, t) => {
  const { __scopeSelect: n, onAutoScroll: o, ...r } = e, i = rt("SelectScrollButton", n), s = M(null), a = Ao(n), l = j(() => {
    s.current !== null && (window.clearInterval(s.current), s.current = null);
  }, []);
  return W(() => () => l(), [l]), fe(() => {
    a().find((u) => u.ref.current === document.activeElement)?.ref.current?.scrollIntoView({ block: "nearest" });
  }, [a]), /* @__PURE__ */ b(
    z.div,
    {
      "aria-hidden": !0,
      ...r,
      ref: t,
      style: { flexShrink: 0, ...r.style },
      onPointerDown: I(r.onPointerDown, () => {
        s.current === null && (s.current = window.setInterval(o, 50));
      }),
      onPointerMove: I(r.onPointerMove, () => {
        i.onItemLeave?.(), s.current === null && (s.current = window.setInterval(o, 50));
      }),
      onPointerLeave: I(r.onPointerLeave, () => {
        l();
      })
    }
  );
}), fv = "SelectSeparator", pv = F(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e;
    return /* @__PURE__ */ b(z.div, { "aria-hidden": !0, ...o, ref: t });
  }
);
pv.displayName = fv;
var Dr = "SelectArrow", hv = F(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e, r = Fo(n), i = ot(Dr, n), s = rt(Dr, n);
    return i.open && s.position === "popper" ? /* @__PURE__ */ b(bn, { ...r, ...o, ref: t }) : null;
  }
);
hv.displayName = Dr;
var xv = "SelectBubbleInput", Cl = F(
  ({ __scopeSelect: e, value: t, ...n }, o) => {
    const r = M(null), i = G(o, r), s = ho(t);
    return W(() => {
      const a = r.current;
      if (!a) return;
      const l = window.HTMLSelectElement.prototype, u = Object.getOwnPropertyDescriptor(
        l,
        "value"
      ).set;
      if (s !== t && u) {
        const d = new Event("change", { bubbles: !0 });
        u.call(a, t), a.dispatchEvent(d);
      }
    }, [s, t]), /* @__PURE__ */ b(
      z.select,
      {
        ...n,
        style: { ...Kc, ...n.style },
        ref: i,
        defaultValue: t
      }
    );
  }
);
Cl.displayName = xv;
function _l(e) {
  return e === "" || e === void 0;
}
function Sl(e) {
  const t = Fe(e), n = M(""), o = M(0), r = j(
    (s) => {
      const a = n.current + s;
      t(a), (function l(c) {
        n.current = c, window.clearTimeout(o.current), c !== "" && (o.current = window.setTimeout(() => l(""), 1e3));
      })(a);
    },
    [t]
  ), i = j(() => {
    n.current = "", window.clearTimeout(o.current);
  }, []);
  return W(() => () => window.clearTimeout(o.current), []), [n, r, i];
}
function Nl(e, t, n) {
  const r = t.length > 1 && Array.from(t).every((c) => c === t[0]) ? t[0] : t, i = n ? e.indexOf(n) : -1;
  let s = mv(e, Math.max(i, 0));
  r.length === 1 && (s = s.filter((c) => c !== n));
  const l = s.find(
    (c) => c.textValue.toLowerCase().startsWith(r.toLowerCase())
  );
  return l !== n ? l : void 0;
}
function mv(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
var vv = nl, gv = rl, bv = sl, wv = al, yv = cl, Cv = ll, _v = pl, Sv = vl, Nv = gl, Ev = wl;
function Av(e) {
  const { value: t, options: n, onChange: o, placeholder: r, disabled: i } = e, s = n || [], a = e.class || "", l = se(e), c = Ye();
  return C(
    vv,
    {
      value: t != null ? String(t) : void 0,
      onValueChange: (u) => {
        o != null && J(o, JSON.stringify({ Value: u }));
      },
      disabled: i || !1
    },
    C(
      gv,
      {
        className: [
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          a
        ].filter(Boolean).join(" "),
        style: l
      },
      C(bv, { placeholder: r || "Select..." }),
      C(
        wv,
        { className: "ml-2 opacity-50" },
        C(
          "svg",
          { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          C("path", { d: "m6 9 6 6 6-6" })
        )
      )
    ),
    C(
      yv,
      { container: c ?? void 0 },
      C(
        Cv,
        {
          className: [
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            "animate-scale-in"
          ].join(" "),
          position: "popper",
          sideOffset: 4
        },
        C(
          _v,
          { className: "p-1" },
          s.map(
            (u) => C(
              Sv,
              {
                key: u.value,
                value: u.value,
                className: [
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                ].join(" ")
              },
              C(Nv, null, u.label),
              C(
                Ev,
                { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center" },
                C(
                  "svg",
                  { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
                  C("polyline", { points: "20 6 9 17 4 12" })
                )
              )
            )
          )
        )
      )
    )
  );
}
function Fv(e) {
  const { open: t, onClose: n, voChildren: o } = e, r = o || [], i = e.class || "", s = se(e), a = Ye(), l = () => {
    n != null && J(n, "{}");
  };
  W(() => {
    if (!t) return;
    const f = (p) => {
      p.key === "Escape" && (p.preventDefault(), l());
    };
    return document.addEventListener("keydown", f), () => {
      document.removeEventListener("keydown", f);
    };
  }, [t]);
  let c = e.title, u = r;
  if (!c) {
    const f = r.findIndex((p) => p?.type === "vo-dialog-title");
    f >= 0 && (c = r[f].props?.textContent, u = r.filter((p, x) => x !== f));
  }
  if (!t)
    return null;
  const d = C(
    "div",
    {
      style: {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgb(0 0 0 / 0.5)",
        pointerEvents: "auto"
      },
      className: "animate-fade-in",
      onClick: l
    },
    C(
      "div",
      {
        className: [
          "relative w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg animate-scale-in",
          i
        ].filter(Boolean).join(" "),
        style: {
          ...s,
          pointerEvents: "auto"
        },
        onClick: (f) => f.stopPropagation()
      },
      c ? C("h2", { className: "text-lg font-semibold leading-none tracking-tight" }, c) : null,
      C("div", { className: "mt-4" }, ...u.map(le)),
      C(
        "button",
        {
          type: "button",
          className: "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
          onClick: l
        },
        C(
          "svg",
          { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          C("path", { d: "M18 6 6 18" }),
          C("path", { d: "m6 6 12 12" })
        )
      )
    )
  );
  return a ? bt(d, a) : d;
}
function Mv(e) {
  const { open: t, onClose: n, side: o, voChildren: r } = e, i = r || [], s = o || "right", a = e.class || "", l = se(e), c = Ye(), u = () => {
    n != null && J(n, "{}");
  };
  W(() => {
    if (!t) return;
    const h = (m) => {
      m.key === "Escape" && (m.preventDefault(), u());
    };
    return document.addEventListener("keydown", h), () => {
      document.removeEventListener("keydown", h);
    };
  }, [t]);
  let d = e.title, f = i;
  if (!d) {
    const h = i.findIndex((m) => m?.type === "vo-dialog-title");
    h >= 0 && (d = i[h].props?.textContent, f = i.filter((m, v) => v !== h));
  }
  const p = {
    left: "absolute inset-y-0 left-0 flex h-full w-3/4 max-w-sm flex-col animate-slide-in-from-left",
    right: "absolute inset-y-0 right-0 flex h-full w-3/4 max-w-sm flex-col animate-slide-in-from-right",
    top: "absolute inset-x-0 top-0 flex max-h-[85%] flex-col animate-slide-in-from-top",
    bottom: "absolute inset-x-0 bottom-0 flex max-h-[85%] flex-col animate-slide-in-from-bottom"
  };
  if (!t)
    return null;
  const x = C(
    "div",
    {
      style: {
        position: "absolute",
        inset: "0",
        background: "rgb(0 0 0 / 0.5)",
        pointerEvents: "auto"
      },
      className: "animate-fade-in",
      onClick: u
    },
    C(
      "div",
      {
        className: [
          "overflow-hidden border bg-background p-6 shadow-lg",
          p[s] || p.right,
          a
        ].filter(Boolean).join(" "),
        style: {
          ...l,
          pointerEvents: "auto"
        },
        onClick: (h) => h.stopPropagation()
      },
      d ? C("h2", { className: "text-lg font-semibold" }, d) : null,
      C("div", {
        className: [
          d ? "mt-4" : "",
          "flex min-h-0 flex-1 flex-col overflow-auto"
        ].filter(Boolean).join(" ")
      }, ...f.map(le)),
      C(
        "button",
        {
          type: "button",
          className: "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
          onClick: u
        },
        C(
          "svg",
          { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          C("path", { d: "M18 6 6 18" }),
          C("path", { d: "m6 6 12 12" })
        )
      )
    )
  );
  return c ? bt(x, c) : x;
}
var [Mo] = pe("Tooltip", [
  He
]), ko = He(), El = "TooltipProvider", kv = 700, Or = "tooltip.open", [Pv, yi] = Mo(El), Al = (e) => {
  const {
    __scopeTooltip: t,
    delayDuration: n = kv,
    skipDelayDuration: o = 300,
    disableHoverableContent: r = !1,
    children: i
  } = e, s = M(!0), a = M(!1), l = M(0);
  return W(() => {
    const c = l.current;
    return () => window.clearTimeout(c);
  }, []), /* @__PURE__ */ b(
    Pv,
    {
      scope: t,
      isOpenDelayedRef: s,
      delayDuration: n,
      onOpen: j(() => {
        window.clearTimeout(l.current), s.current = !1;
      }, []),
      onClose: j(() => {
        window.clearTimeout(l.current), l.current = window.setTimeout(
          () => s.current = !0,
          o
        );
      }, [o]),
      isPointerInTransitRef: a,
      onPointerInTransitChange: j((c) => {
        a.current = c;
      }, []),
      disableHoverableContent: r,
      children: i
    }
  );
};
Al.displayName = El;
var sn = "Tooltip", [Dv, wn] = Mo(sn), Fl = (e) => {
  const {
    __scopeTooltip: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    disableHoverableContent: s,
    delayDuration: a
  } = e, l = yi(sn, e.__scopeTooltip), c = ko(t), [u, d] = V(null), f = Me(), p = M(0), x = s ?? l.disableHoverableContent, h = a ?? l.delayDuration, m = M(!1), [v, g] = ve({
    prop: o,
    defaultProp: r ?? !1,
    onChange: (N) => {
      N ? (l.onOpen(), document.dispatchEvent(new CustomEvent(Or))) : l.onClose(), i?.(N);
    },
    caller: sn
  }), w = ue(() => v ? m.current ? "delayed-open" : "instant-open" : "closed", [v]), _ = j(() => {
    window.clearTimeout(p.current), p.current = 0, m.current = !1, g(!0);
  }, [g]), S = j(() => {
    window.clearTimeout(p.current), p.current = 0, g(!1);
  }, [g]), y = j(() => {
    window.clearTimeout(p.current), p.current = window.setTimeout(() => {
      m.current = !0, g(!0), p.current = 0;
    }, h);
  }, [h, g]);
  return W(() => () => {
    p.current && (window.clearTimeout(p.current), p.current = 0);
  }, []), /* @__PURE__ */ b(vn, { ...c, children: /* @__PURE__ */ b(
    Dv,
    {
      scope: t,
      contentId: f,
      open: v,
      stateAttribute: w,
      trigger: u,
      onTriggerChange: d,
      onTriggerEnter: j(() => {
        l.isOpenDelayedRef.current ? y() : _();
      }, [l.isOpenDelayedRef, y, _]),
      onTriggerLeave: j(() => {
        x ? S() : (window.clearTimeout(p.current), p.current = 0);
      }, [S, x]),
      onOpen: _,
      onClose: S,
      disableHoverableContent: x,
      children: n
    }
  ) });
};
Fl.displayName = sn;
var Tr = "TooltipTrigger", Ml = F(
  (e, t) => {
    const { __scopeTooltip: n, ...o } = e, r = wn(Tr, n), i = yi(Tr, n), s = ko(n), a = M(null), l = G(t, a, r.onTriggerChange), c = M(!1), u = M(!1), d = j(() => c.current = !1, []);
    return W(() => () => document.removeEventListener("pointerup", d), [d]), /* @__PURE__ */ b(zt, { asChild: !0, ...s, children: /* @__PURE__ */ b(
      z.button,
      {
        "aria-describedby": r.open ? r.contentId : void 0,
        "data-state": r.stateAttribute,
        ...o,
        ref: l,
        onPointerMove: I(e.onPointerMove, (f) => {
          f.pointerType !== "touch" && !u.current && !i.isPointerInTransitRef.current && (r.onTriggerEnter(), u.current = !0);
        }),
        onPointerLeave: I(e.onPointerLeave, () => {
          r.onTriggerLeave(), u.current = !1;
        }),
        onPointerDown: I(e.onPointerDown, () => {
          r.open && r.onClose(), c.current = !0, document.addEventListener("pointerup", d, { once: !0 });
        }),
        onFocus: I(e.onFocus, () => {
          c.current || r.onOpen();
        }),
        onBlur: I(e.onBlur, r.onClose),
        onClick: I(e.onClick, r.onClose)
      }
    ) });
  }
);
Ml.displayName = Tr;
var Ci = "TooltipPortal", [Ov, Tv] = Mo(Ci, {
  forceMount: void 0
}), kl = (e) => {
  const { __scopeTooltip: t, forceMount: n, children: o, container: r } = e, i = wn(Ci, t);
  return /* @__PURE__ */ b(Ov, { scope: t, forceMount: n, children: /* @__PURE__ */ b(ge, { present: n || i.open, children: /* @__PURE__ */ b(Kt, { asChild: !0, container: r, children: o }) }) });
};
kl.displayName = Ci;
var Bt = "TooltipContent", Pl = F(
  (e, t) => {
    const n = Tv(Bt, e.__scopeTooltip), { forceMount: o = n.forceMount, side: r = "top", ...i } = e, s = wn(Bt, e.__scopeTooltip);
    return /* @__PURE__ */ b(ge, { present: o || s.open, children: s.disableHoverableContent ? /* @__PURE__ */ b(Dl, { side: r, ...i, ref: t }) : /* @__PURE__ */ b(Rv, { side: r, ...i, ref: t }) });
  }
), Rv = F((e, t) => {
  const n = wn(Bt, e.__scopeTooltip), o = yi(Bt, e.__scopeTooltip), r = M(null), i = G(t, r), [s, a] = V(null), { trigger: l, onClose: c } = n, u = r.current, { onPointerInTransitChange: d } = o, f = j(() => {
    a(null), d(!1);
  }, [d]), p = j(
    (x, h) => {
      const m = x.currentTarget, v = { x: x.clientX, y: x.clientY }, g = $v(v, m.getBoundingClientRect()), w = Wv(v, g), _ = Hv(h.getBoundingClientRect()), S = Uv([...w, ..._]);
      a(S), d(!0);
    },
    [d]
  );
  return W(() => () => f(), [f]), W(() => {
    if (l && u) {
      const x = (m) => p(m, u), h = (m) => p(m, l);
      return l.addEventListener("pointerleave", x), u.addEventListener("pointerleave", h), () => {
        l.removeEventListener("pointerleave", x), u.removeEventListener("pointerleave", h);
      };
    }
  }, [l, u, p, f]), W(() => {
    if (s) {
      const x = (h) => {
        const m = h.target, v = { x: h.clientX, y: h.clientY }, g = l?.contains(m) || u?.contains(m), w = !Vv(v, s);
        g ? f() : w && (f(), c());
      };
      return document.addEventListener("pointermove", x), () => document.removeEventListener("pointermove", x);
    }
  }, [l, u, s, c, f]), /* @__PURE__ */ b(Dl, { ...e, ref: i });
}), [Bv, Iv] = Mo(sn, { isInside: !1 }), Lv = /* @__PURE__ */ Lp("TooltipContent"), Dl = F(
  (e, t) => {
    const {
      __scopeTooltip: n,
      children: o,
      "aria-label": r,
      onEscapeKeyDown: i,
      onPointerDownOutside: s,
      ...a
    } = e, l = wn(Bt, n), c = ko(n), { onClose: u } = l;
    return W(() => (document.addEventListener(Or, u), () => document.removeEventListener(Or, u)), [u]), W(() => {
      if (l.trigger) {
        const d = (f) => {
          f.target?.contains(l.trigger) && u();
        };
        return window.addEventListener("scroll", d, { capture: !0 }), () => window.removeEventListener("scroll", d, { capture: !0 });
      }
    }, [l.trigger, u]), /* @__PURE__ */ b(
      Vt,
      {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: i,
        onPointerDownOutside: s,
        onFocusOutside: (d) => d.preventDefault(),
        onDismiss: u,
        children: /* @__PURE__ */ b(
          gn,
          {
            "data-state": l.stateAttribute,
            ...c,
            ...a,
            ref: t,
            style: {
              ...a.style,
              "--radix-tooltip-content-transform-origin": "var(--radix-popper-transform-origin)",
              "--radix-tooltip-content-available-width": "var(--radix-popper-available-width)",
              "--radix-tooltip-content-available-height": "var(--radix-popper-available-height)",
              "--radix-tooltip-trigger-width": "var(--radix-popper-anchor-width)",
              "--radix-tooltip-trigger-height": "var(--radix-popper-anchor-height)"
            },
            children: [
              /* @__PURE__ */ b(Lv, { children: o }),
              /* @__PURE__ */ b(Bv, { scope: n, isInside: !0, children: /* @__PURE__ */ b(sm, { id: l.contentId, role: "tooltip", children: r || o }) })
            ]
          }
        )
      }
    );
  }
);
Pl.displayName = Bt;
var Ol = "TooltipArrow", Tl = F(
  (e, t) => {
    const { __scopeTooltip: n, ...o } = e, r = ko(n);
    return Iv(
      Ol,
      n
    ).isInside ? null : /* @__PURE__ */ b(bn, { ...r, ...o, ref: t });
  }
);
Tl.displayName = Ol;
function $v(e, t) {
  const n = Math.abs(t.top - e.y), o = Math.abs(t.bottom - e.y), r = Math.abs(t.right - e.x), i = Math.abs(t.left - e.x);
  switch (Math.min(n, o, r, i)) {
    case i:
      return "left";
    case r:
      return "right";
    case n:
      return "top";
    case o:
      return "bottom";
    default:
      throw new Error("unreachable");
  }
}
function Wv(e, t, n = 5) {
  const o = [];
  switch (t) {
    case "top":
      o.push(
        { x: e.x - n, y: e.y + n },
        { x: e.x + n, y: e.y + n }
      );
      break;
    case "bottom":
      o.push(
        { x: e.x - n, y: e.y - n },
        { x: e.x + n, y: e.y - n }
      );
      break;
    case "left":
      o.push(
        { x: e.x + n, y: e.y - n },
        { x: e.x + n, y: e.y + n }
      );
      break;
    case "right":
      o.push(
        { x: e.x - n, y: e.y - n },
        { x: e.x - n, y: e.y + n }
      );
      break;
  }
  return o;
}
function Hv(e) {
  const { top: t, right: n, bottom: o, left: r } = e;
  return [
    { x: r, y: t },
    { x: n, y: t },
    { x: n, y: o },
    { x: r, y: o }
  ];
}
function Vv(e, t) {
  const { x: n, y: o } = e;
  let r = !1;
  for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
    const a = t[i], l = t[s], c = a.x, u = a.y, d = l.x, f = l.y;
    u > o != f > o && n < (d - c) * (o - u) / (f - u) + c && (r = !r);
  }
  return r;
}
function Uv(e) {
  const t = e.slice();
  return t.sort((n, o) => n.x < o.x ? -1 : n.x > o.x ? 1 : n.y < o.y ? -1 : n.y > o.y ? 1 : 0), jv(t);
}
function jv(e) {
  if (e.length <= 1) return e.slice();
  const t = [];
  for (let o = 0; o < e.length; o++) {
    const r = e[o];
    for (; t.length >= 2; ) {
      const i = t[t.length - 1], s = t[t.length - 2];
      if ((i.x - s.x) * (r.y - s.y) >= (i.y - s.y) * (r.x - s.x)) t.pop();
      else break;
    }
    t.push(r);
  }
  t.pop();
  const n = [];
  for (let o = e.length - 1; o >= 0; o--) {
    const r = e[o];
    for (; n.length >= 2; ) {
      const i = n[n.length - 1], s = n[n.length - 2];
      if ((i.x - s.x) * (r.y - s.y) >= (i.y - s.y) * (r.x - s.x)) n.pop();
      else break;
    }
    n.push(r);
  }
  return n.pop(), t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y ? t : t.concat(n);
}
var zv = Al, Kv = Fl, Gv = Ml, Yv = kl, Xv = Pl, Jv = Tl;
function qv(e) {
  const { textContent: t, side: n, voChildren: o } = e, r = o || [], i = Ye(), s = r[0];
  return C(
    zv,
    { delayDuration: 200 },
    C(
      Kv,
      null,
      C(
        Gv,
        { asChild: !0 },
        s ? le(s) : C("span", null)
      ),
      C(
        Yv,
        { container: i ?? void 0 },
        C(
          Xv,
          {
            className: [
              "z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md",
              "animate-scale-in"
            ].join(" "),
            side: n || "top",
            sideOffset: 4
          },
          t || "",
          C(Jv, { className: "fill-foreground" })
        )
      )
    )
  );
}
var Po = "Popover", [Rl] = pe(Po, [
  He
]), yn = He(), [Zv, it] = Rl(Po), Bl = (e) => {
  const {
    __scopePopover: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    modal: s = !1
  } = e, a = yn(t), l = M(null), [c, u] = V(!1), [d, f] = ve({
    prop: o,
    defaultProp: r ?? !1,
    onChange: i,
    caller: Po
  });
  return /* @__PURE__ */ b(vn, { ...a, children: /* @__PURE__ */ b(
    Zv,
    {
      scope: t,
      contentId: Me(),
      triggerRef: l,
      open: d,
      onOpenChange: f,
      onOpenToggle: j(() => f((p) => !p), [f]),
      hasCustomAnchor: c,
      onCustomAnchorAdd: j(() => u(!0), []),
      onCustomAnchorRemove: j(() => u(!1), []),
      modal: s,
      children: n
    }
  ) });
};
Bl.displayName = Po;
var Il = "PopoverAnchor", Qv = F(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = it(Il, n), i = yn(n), { onCustomAnchorAdd: s, onCustomAnchorRemove: a } = r;
    return W(() => (s(), () => a()), [s, a]), /* @__PURE__ */ b(zt, { ...i, ...o, ref: t });
  }
);
Qv.displayName = Il;
var Ll = "PopoverTrigger", $l = F(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = it(Ll, n), i = yn(n), s = G(t, r.triggerRef), a = /* @__PURE__ */ b(
      z.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": r.open,
        "aria-controls": r.contentId,
        "data-state": zl(r.open),
        ...o,
        ref: s,
        onClick: I(e.onClick, r.onOpenToggle)
      }
    );
    return r.hasCustomAnchor ? a : /* @__PURE__ */ b(zt, { asChild: !0, ...i, children: a });
  }
);
$l.displayName = Ll;
var _i = "PopoverPortal", [eg, tg] = Rl(_i, {
  forceMount: void 0
}), Wl = (e) => {
  const { __scopePopover: t, forceMount: n, children: o, container: r } = e, i = it(_i, t);
  return /* @__PURE__ */ b(eg, { scope: t, forceMount: n, children: /* @__PURE__ */ b(ge, { present: n || i.open, children: /* @__PURE__ */ b(Kt, { asChild: !0, container: r, children: o }) }) });
};
Wl.displayName = _i;
var It = "PopoverContent", Hl = F(
  (e, t) => {
    const n = tg(It, e.__scopePopover), { forceMount: o = n.forceMount, ...r } = e, i = it(It, e.__scopePopover);
    return /* @__PURE__ */ b(ge, { present: o || i.open, children: i.modal ? /* @__PURE__ */ b(og, { ...r, ref: t }) : /* @__PURE__ */ b(rg, { ...r, ref: t }) });
  }
);
Hl.displayName = It;
var ng = /* @__PURE__ */ Tt("PopoverContent.RemoveScroll"), og = F(
  (e, t) => {
    const n = it(It, e.__scopePopover), o = M(null), r = G(t, o), i = M(!1);
    return W(() => {
      const s = o.current;
      if (s) return bi(s);
    }, []), /* @__PURE__ */ b(No, { as: ng, allowPinchZoom: !0, children: /* @__PURE__ */ b(
      Vl,
      {
        ...e,
        ref: r,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: I(e.onCloseAutoFocus, (s) => {
          s.preventDefault(), i.current || n.triggerRef.current?.focus();
        }),
        onPointerDownOutside: I(
          e.onPointerDownOutside,
          (s) => {
            const a = s.detail.originalEvent, l = a.button === 0 && a.ctrlKey === !0, c = a.button === 2 || l;
            i.current = c;
          },
          { checkForDefaultPrevented: !1 }
        ),
        onFocusOutside: I(
          e.onFocusOutside,
          (s) => s.preventDefault(),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
), rg = F(
  (e, t) => {
    const n = it(It, e.__scopePopover), o = M(!1), r = M(!1);
    return /* @__PURE__ */ b(
      Vl,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (i) => {
          e.onCloseAutoFocus?.(i), i.defaultPrevented || (o.current || n.triggerRef.current?.focus(), i.preventDefault()), o.current = !1, r.current = !1;
        },
        onInteractOutside: (i) => {
          e.onInteractOutside?.(i), i.defaultPrevented || (o.current = !0, i.detail.originalEvent.type === "pointerdown" && (r.current = !0));
          const s = i.target;
          n.triggerRef.current?.contains(s) && i.preventDefault(), i.detail.originalEvent.type === "focusin" && r.current && i.preventDefault();
        }
      }
    );
  }
), Vl = F(
  (e, t) => {
    const {
      __scopePopover: n,
      trapFocus: o,
      onOpenAutoFocus: r,
      onCloseAutoFocus: i,
      disableOutsidePointerEvents: s,
      onEscapeKeyDown: a,
      onPointerDownOutside: l,
      onFocusOutside: c,
      onInteractOutside: u,
      ...d
    } = e, f = it(It, n), p = yn(n);
    return ui(), /* @__PURE__ */ b(
      bo,
      {
        asChild: !0,
        loop: !0,
        trapped: o,
        onMountAutoFocus: r,
        onUnmountAutoFocus: i,
        children: /* @__PURE__ */ b(
          Vt,
          {
            asChild: !0,
            disableOutsidePointerEvents: s,
            onInteractOutside: u,
            onEscapeKeyDown: a,
            onPointerDownOutside: l,
            onFocusOutside: c,
            onDismiss: () => f.onOpenChange(!1),
            children: /* @__PURE__ */ b(
              gn,
              {
                "data-state": zl(f.open),
                role: "dialog",
                id: f.contentId,
                ...p,
                ...d,
                ref: t,
                style: {
                  ...d.style,
                  "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)",
                  "--radix-popover-content-available-width": "var(--radix-popper-available-width)",
                  "--radix-popover-content-available-height": "var(--radix-popper-available-height)",
                  "--radix-popover-trigger-width": "var(--radix-popper-anchor-width)",
                  "--radix-popover-trigger-height": "var(--radix-popper-anchor-height)"
                }
              }
            )
          }
        )
      }
    );
  }
), Ul = "PopoverClose", ig = F(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = it(Ul, n);
    return /* @__PURE__ */ b(
      z.button,
      {
        type: "button",
        ...o,
        ref: t,
        onClick: I(e.onClick, () => r.onOpenChange(!1))
      }
    );
  }
);
ig.displayName = Ul;
var sg = "PopoverArrow", jl = F(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = yn(n);
    return /* @__PURE__ */ b(bn, { ...r, ...o, ref: t });
  }
);
jl.displayName = sg;
function zl(e) {
  return e ? "open" : "closed";
}
var ag = Bl, cg = $l, lg = Wl, ug = Hl, dg = jl;
function fg(e) {
  const { open: t, onOpenChange: n, side: o, voChildren: r } = e, i = r || [], s = Ye(), a = i[0], l = i.slice(1);
  return C(
    ag,
    {
      open: t != null ? !!t : void 0
    },
    C(
      cg,
      { asChild: !0 },
      a ? le(a) : C("span", null)
    ),
    C(
      lg,
      { container: s ?? void 0 },
      C(
        ug,
        {
          className: [
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "animate-scale-in"
          ].join(" "),
          side: o || "bottom",
          sideOffset: 4,
          align: "center"
        },
        ...l.map(le),
        C(dg, { className: "fill-popover" })
      )
    )
  );
}
var ur = "rovingFocusGroup.onEntryFocus", pg = { bubbles: !1, cancelable: !0 }, Cn = "RovingFocusGroup", [Rr, Kl, hg] = xn(Cn), [xg, Do] = pe(
  Cn,
  [hg]
), [mg, vg] = xg(Cn), Gl = F(
  (e, t) => /* @__PURE__ */ b(Rr.Provider, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ b(Rr.Slot, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ b(gg, { ...e, ref: t }) }) })
);
Gl.displayName = Cn;
var gg = F((e, t) => {
  const {
    __scopeRovingFocusGroup: n,
    orientation: o,
    loop: r = !1,
    dir: i,
    currentTabStopId: s,
    defaultCurrentTabStopId: a,
    onCurrentTabStopIdChange: l,
    onEntryFocus: c,
    preventScrollOnEntryFocus: u = !1,
    ...d
  } = e, f = M(null), p = G(t, f), x = Wt(i), [h, m] = ve({
    prop: s,
    defaultProp: a ?? null,
    onChange: l,
    caller: Cn
  }), [v, g] = V(!1), w = Fe(c), _ = Kl(n), S = M(!1), [y, N] = V(0);
  return W(() => {
    const k = f.current;
    if (k)
      return k.addEventListener(ur, w), () => k.removeEventListener(ur, w);
  }, [w]), /* @__PURE__ */ b(
    mg,
    {
      scope: n,
      orientation: o,
      dir: x,
      loop: r,
      currentTabStopId: h,
      onItemFocus: j(
        (k) => m(k),
        [m]
      ),
      onItemShiftTab: j(() => g(!0), []),
      onFocusableItemAdd: j(
        () => N((k) => k + 1),
        []
      ),
      onFocusableItemRemove: j(
        () => N((k) => k - 1),
        []
      ),
      children: /* @__PURE__ */ b(
        z.div,
        {
          tabIndex: v || y === 0 ? -1 : 0,
          "data-orientation": o,
          ...d,
          ref: p,
          style: { outline: "none", ...e.style },
          onMouseDown: I(e.onMouseDown, () => {
            S.current = !0;
          }),
          onFocus: I(e.onFocus, (k) => {
            const O = !S.current;
            if (k.target === k.currentTarget && O && !v) {
              const E = new CustomEvent(ur, pg);
              if (k.currentTarget.dispatchEvent(E), !E.defaultPrevented) {
                const P = _().filter((D) => D.focusable), L = P.find((D) => D.active), H = P.find((D) => D.id === h), B = [L, H, ...P].filter(
                  Boolean
                ).map((D) => D.ref.current);
                Jl(B, u);
              }
            }
            S.current = !1;
          }),
          onBlur: I(e.onBlur, () => g(!1))
        }
      )
    }
  );
}), Yl = "RovingFocusGroupItem", Xl = F(
  (e, t) => {
    const {
      __scopeRovingFocusGroup: n,
      focusable: o = !0,
      active: r = !1,
      tabStopId: i,
      children: s,
      ...a
    } = e, l = Me(), c = i || l, u = vg(Yl, n), d = u.currentTabStopId === c, f = Kl(n), { onFocusableItemAdd: p, onFocusableItemRemove: x, currentTabStopId: h } = u;
    return W(() => {
      if (o)
        return p(), () => x();
    }, [o, p, x]), /* @__PURE__ */ b(
      Rr.ItemSlot,
      {
        scope: n,
        id: c,
        focusable: o,
        active: r,
        children: /* @__PURE__ */ b(
          z.span,
          {
            tabIndex: d ? 0 : -1,
            "data-orientation": u.orientation,
            ...a,
            ref: t,
            onMouseDown: I(e.onMouseDown, (m) => {
              o ? u.onItemFocus(c) : m.preventDefault();
            }),
            onFocus: I(e.onFocus, () => u.onItemFocus(c)),
            onKeyDown: I(e.onKeyDown, (m) => {
              if (m.key === "Tab" && m.shiftKey) {
                u.onItemShiftTab();
                return;
              }
              if (m.target !== m.currentTarget) return;
              const v = yg(m, u.orientation, u.dir);
              if (v !== void 0) {
                if (m.metaKey || m.ctrlKey || m.altKey || m.shiftKey) return;
                m.preventDefault();
                let w = f().filter((_) => _.focusable).map((_) => _.ref.current);
                if (v === "last") w.reverse();
                else if (v === "prev" || v === "next") {
                  v === "prev" && w.reverse();
                  const _ = w.indexOf(m.currentTarget);
                  w = u.loop ? Cg(w, _ + 1) : w.slice(_ + 1);
                }
                setTimeout(() => Jl(w));
              }
            }),
            children: typeof s == "function" ? s({ isCurrentTabStop: d, hasTabStop: h != null }) : s
          }
        )
      }
    );
  }
);
Xl.displayName = Yl;
var bg = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function wg(e, t) {
  return t !== "rtl" ? e : e === "ArrowLeft" ? "ArrowRight" : e === "ArrowRight" ? "ArrowLeft" : e;
}
function yg(e, t, n) {
  const o = wg(e.key, n);
  if (!(t === "vertical" && ["ArrowLeft", "ArrowRight"].includes(o)) && !(t === "horizontal" && ["ArrowUp", "ArrowDown"].includes(o)))
    return bg[o];
}
function Jl(e, t = !1) {
  const n = document.activeElement;
  for (const o of e)
    if (o === n || (o.focus({ preventScroll: t }), document.activeElement !== n)) return;
}
function Cg(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
var ql = Gl, Zl = Xl, Br = ["Enter", " "], _g = ["ArrowDown", "PageUp", "Home"], Ql = ["ArrowUp", "PageDown", "End"], Sg = [..._g, ...Ql], Ng = {
  ltr: [...Br, "ArrowRight"],
  rtl: [...Br, "ArrowLeft"]
}, Eg = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
}, _n = "Menu", [an, Ag, Fg] = xn(_n), [wt, Oo] = pe(_n, [
  Fg,
  He,
  Do
]), To = He(), eu = Do(), [Mg, yt] = wt(_n), [kg, Sn] = wt(_n), tu = (e) => {
  const { __scopeMenu: t, open: n = !1, children: o, dir: r, onOpenChange: i, modal: s = !0 } = e, a = To(t), [l, c] = V(null), u = M(!1), d = Fe(i), f = Wt(r);
  return W(() => {
    const p = () => {
      u.current = !0, document.addEventListener("pointerdown", x, { capture: !0, once: !0 }), document.addEventListener("pointermove", x, { capture: !0, once: !0 });
    }, x = () => u.current = !1;
    return document.addEventListener("keydown", p, { capture: !0 }), () => {
      document.removeEventListener("keydown", p, { capture: !0 }), document.removeEventListener("pointerdown", x, { capture: !0 }), document.removeEventListener("pointermove", x, { capture: !0 });
    };
  }, []), /* @__PURE__ */ b(vn, { ...a, children: /* @__PURE__ */ b(
    Mg,
    {
      scope: t,
      open: n,
      onOpenChange: d,
      content: l,
      onContentChange: c,
      children: /* @__PURE__ */ b(
        kg,
        {
          scope: t,
          onClose: j(() => d(!1), [d]),
          isUsingKeyboardRef: u,
          dir: f,
          modal: s,
          children: o
        }
      )
    }
  ) });
};
tu.displayName = _n;
var Pg = "MenuAnchor", Si = F(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e, r = To(n);
    return /* @__PURE__ */ b(zt, { ...r, ...o, ref: t });
  }
);
Si.displayName = Pg;
var Ni = "MenuPortal", [Dg, nu] = wt(Ni, {
  forceMount: void 0
}), ou = (e) => {
  const { __scopeMenu: t, forceMount: n, children: o, container: r } = e, i = yt(Ni, t);
  return /* @__PURE__ */ b(Dg, { scope: t, forceMount: n, children: /* @__PURE__ */ b(ge, { present: n || i.open, children: /* @__PURE__ */ b(Kt, { asChild: !0, container: r, children: o }) }) });
};
ou.displayName = Ni;
var _e = "MenuContent", [Og, Ei] = wt(_e), ru = F(
  (e, t) => {
    const n = nu(_e, e.__scopeMenu), { forceMount: o = n.forceMount, ...r } = e, i = yt(_e, e.__scopeMenu), s = Sn(_e, e.__scopeMenu);
    return /* @__PURE__ */ b(an.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ b(ge, { present: o || i.open, children: /* @__PURE__ */ b(an.Slot, { scope: e.__scopeMenu, children: s.modal ? /* @__PURE__ */ b(Tg, { ...r, ref: t }) : /* @__PURE__ */ b(Rg, { ...r, ref: t }) }) }) });
  }
), Tg = F(
  (e, t) => {
    const n = yt(_e, e.__scopeMenu), o = M(null), r = G(t, o);
    return W(() => {
      const i = o.current;
      if (i) return bi(i);
    }, []), /* @__PURE__ */ b(
      Ai,
      {
        ...e,
        ref: r,
        trapFocus: n.open,
        disableOutsidePointerEvents: n.open,
        disableOutsideScroll: !0,
        onFocusOutside: I(
          e.onFocusOutside,
          (i) => i.preventDefault(),
          { checkForDefaultPrevented: !1 }
        ),
        onDismiss: () => n.onOpenChange(!1)
      }
    );
  }
), Rg = F((e, t) => {
  const n = yt(_e, e.__scopeMenu);
  return /* @__PURE__ */ b(
    Ai,
    {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => n.onOpenChange(!1)
    }
  );
}), Bg = /* @__PURE__ */ Tt("MenuContent.ScrollLock"), Ai = F(
  (e, t) => {
    const {
      __scopeMenu: n,
      loop: o = !1,
      trapFocus: r,
      onOpenAutoFocus: i,
      onCloseAutoFocus: s,
      disableOutsidePointerEvents: a,
      onEntryFocus: l,
      onEscapeKeyDown: c,
      onPointerDownOutside: u,
      onFocusOutside: d,
      onInteractOutside: f,
      onDismiss: p,
      disableOutsideScroll: x,
      ...h
    } = e, m = yt(_e, n), v = Sn(_e, n), g = To(n), w = eu(n), _ = Ag(n), [S, y] = V(null), N = M(null), k = G(t, N, m.onContentChange), O = M(0), E = M(""), P = M(0), L = M(null), H = M("right"), $ = M(0), B = x ? No : ce, D = x ? { as: Bg, allowPinchZoom: !0 } : void 0, R = (T) => {
      const Y = E.current + T, X = _().filter((U) => !U.disabled), q = document.activeElement, Z = X.find((U) => U.ref.current === q)?.textValue, re = X.map((U) => U.textValue), be = Yg(re, Y, Z), de = X.find((U) => U.textValue === be)?.ref.current;
      (function U(Q) {
        E.current = Q, window.clearTimeout(O.current), Q !== "" && (O.current = window.setTimeout(() => U(""), 1e3));
      })(Y), de && setTimeout(() => de.focus());
    };
    W(() => () => window.clearTimeout(O.current), []), ui();
    const A = j((T) => H.current === L.current?.side && Jg(T, L.current?.area), []);
    return /* @__PURE__ */ b(
      Og,
      {
        scope: n,
        searchRef: E,
        onItemEnter: j(
          (T) => {
            A(T) && T.preventDefault();
          },
          [A]
        ),
        onItemLeave: j(
          (T) => {
            A(T) || (N.current?.focus(), y(null));
          },
          [A]
        ),
        onTriggerLeave: j(
          (T) => {
            A(T) && T.preventDefault();
          },
          [A]
        ),
        pointerGraceTimerRef: P,
        onPointerGraceIntentChange: j((T) => {
          L.current = T;
        }, []),
        children: /* @__PURE__ */ b(B, { ...D, children: /* @__PURE__ */ b(
          bo,
          {
            asChild: !0,
            trapped: r,
            onMountAutoFocus: I(i, (T) => {
              T.preventDefault(), N.current?.focus({ preventScroll: !0 });
            }),
            onUnmountAutoFocus: s,
            children: /* @__PURE__ */ b(
              Vt,
              {
                asChild: !0,
                disableOutsidePointerEvents: a,
                onEscapeKeyDown: c,
                onPointerDownOutside: u,
                onFocusOutside: d,
                onInteractOutside: f,
                onDismiss: p,
                children: /* @__PURE__ */ b(
                  ql,
                  {
                    asChild: !0,
                    ...w,
                    dir: v.dir,
                    orientation: "vertical",
                    loop: o,
                    currentTabStopId: S,
                    onCurrentTabStopIdChange: y,
                    onEntryFocus: I(l, (T) => {
                      v.isUsingKeyboardRef.current || T.preventDefault();
                    }),
                    preventScrollOnEntryFocus: !0,
                    children: /* @__PURE__ */ b(
                      gn,
                      {
                        role: "menu",
                        "aria-orientation": "vertical",
                        "data-state": wu(m.open),
                        "data-radix-menu-content": "",
                        dir: v.dir,
                        ...g,
                        ...h,
                        ref: k,
                        style: { outline: "none", ...h.style },
                        onKeyDown: I(h.onKeyDown, (T) => {
                          const X = T.target.closest("[data-radix-menu-content]") === T.currentTarget, q = T.ctrlKey || T.altKey || T.metaKey, Z = T.key.length === 1;
                          X && (T.key === "Tab" && T.preventDefault(), !q && Z && R(T.key));
                          const re = N.current;
                          if (T.target !== re || !Sg.includes(T.key)) return;
                          T.preventDefault();
                          const de = _().filter((U) => !U.disabled).map((U) => U.ref.current);
                          Ql.includes(T.key) && de.reverse(), Kg(de);
                        }),
                        onBlur: I(e.onBlur, (T) => {
                          T.currentTarget.contains(T.target) || (window.clearTimeout(O.current), E.current = "");
                        }),
                        onPointerMove: I(
                          e.onPointerMove,
                          cn((T) => {
                            const Y = T.target, X = $.current !== T.clientX;
                            if (T.currentTarget.contains(Y) && X) {
                              const q = T.clientX > $.current ? "right" : "left";
                              H.current = q, $.current = T.clientX;
                            }
                          })
                        )
                      }
                    )
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
ru.displayName = _e;
var Ig = "MenuGroup", Fi = F(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return /* @__PURE__ */ b(z.div, { role: "group", ...o, ref: t });
  }
);
Fi.displayName = Ig;
var Lg = "MenuLabel", iu = F(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return /* @__PURE__ */ b(z.div, { ...o, ref: t });
  }
);
iu.displayName = Lg;
var to = "MenuItem", Ys = "menu.itemSelect", Ro = F(
  (e, t) => {
    const { disabled: n = !1, onSelect: o, ...r } = e, i = M(null), s = Sn(to, e.__scopeMenu), a = Ei(to, e.__scopeMenu), l = G(t, i), c = M(!1), u = () => {
      const d = i.current;
      if (!n && d) {
        const f = new CustomEvent(Ys, { bubbles: !0, cancelable: !0 });
        d.addEventListener(Ys, (p) => o?.(p), { once: !0 }), Ya(d, f), f.defaultPrevented ? c.current = !1 : s.onClose();
      }
    };
    return /* @__PURE__ */ b(
      su,
      {
        ...r,
        ref: l,
        disabled: n,
        onClick: I(e.onClick, u),
        onPointerDown: (d) => {
          e.onPointerDown?.(d), c.current = !0;
        },
        onPointerUp: I(e.onPointerUp, (d) => {
          c.current || d.currentTarget?.click();
        }),
        onKeyDown: I(e.onKeyDown, (d) => {
          const f = a.searchRef.current !== "";
          n || f && d.key === " " || Br.includes(d.key) && (d.currentTarget.click(), d.preventDefault());
        })
      }
    );
  }
);
Ro.displayName = to;
var su = F(
  (e, t) => {
    const { __scopeMenu: n, disabled: o = !1, textValue: r, ...i } = e, s = Ei(to, n), a = eu(n), l = M(null), c = G(t, l), [u, d] = V(!1), [f, p] = V("");
    return W(() => {
      const x = l.current;
      x && p((x.textContent ?? "").trim());
    }, [i.children]), /* @__PURE__ */ b(
      an.ItemSlot,
      {
        scope: n,
        disabled: o,
        textValue: r ?? f,
        children: /* @__PURE__ */ b(Zl, { asChild: !0, ...a, focusable: !o, children: /* @__PURE__ */ b(
          z.div,
          {
            role: "menuitem",
            "data-highlighted": u ? "" : void 0,
            "aria-disabled": o || void 0,
            "data-disabled": o ? "" : void 0,
            ...i,
            ref: c,
            onPointerMove: I(
              e.onPointerMove,
              cn((x) => {
                o ? s.onItemLeave(x) : (s.onItemEnter(x), x.defaultPrevented || x.currentTarget.focus({ preventScroll: !0 }));
              })
            ),
            onPointerLeave: I(
              e.onPointerLeave,
              cn((x) => s.onItemLeave(x))
            ),
            onFocus: I(e.onFocus, () => d(!0)),
            onBlur: I(e.onBlur, () => d(!1))
          }
        ) })
      }
    );
  }
), $g = "MenuCheckboxItem", au = F(
  (e, t) => {
    const { checked: n = !1, onCheckedChange: o, ...r } = e;
    return /* @__PURE__ */ b(fu, { scope: e.__scopeMenu, checked: n, children: /* @__PURE__ */ b(
      Ro,
      {
        role: "menuitemcheckbox",
        "aria-checked": no(n) ? "mixed" : n,
        ...r,
        ref: t,
        "data-state": ki(n),
        onSelect: I(
          r.onSelect,
          () => o?.(no(n) ? !0 : !n),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
au.displayName = $g;
var cu = "MenuRadioGroup", [Wg, Hg] = wt(
  cu,
  { value: void 0, onValueChange: () => {
  } }
), lu = F(
  (e, t) => {
    const { value: n, onValueChange: o, ...r } = e, i = Fe(o);
    return /* @__PURE__ */ b(Wg, { scope: e.__scopeMenu, value: n, onValueChange: i, children: /* @__PURE__ */ b(Fi, { ...r, ref: t }) });
  }
);
lu.displayName = cu;
var uu = "MenuRadioItem", du = F(
  (e, t) => {
    const { value: n, ...o } = e, r = Hg(uu, e.__scopeMenu), i = n === r.value;
    return /* @__PURE__ */ b(fu, { scope: e.__scopeMenu, checked: i, children: /* @__PURE__ */ b(
      Ro,
      {
        role: "menuitemradio",
        "aria-checked": i,
        ...o,
        ref: t,
        "data-state": ki(i),
        onSelect: I(
          o.onSelect,
          () => r.onValueChange?.(n),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
du.displayName = uu;
var Mi = "MenuItemIndicator", [fu, Vg] = wt(
  Mi,
  { checked: !1 }
), pu = F(
  (e, t) => {
    const { __scopeMenu: n, forceMount: o, ...r } = e, i = Vg(Mi, n);
    return /* @__PURE__ */ b(
      ge,
      {
        present: o || no(i.checked) || i.checked === !0,
        children: /* @__PURE__ */ b(
          z.span,
          {
            ...r,
            ref: t,
            "data-state": ki(i.checked)
          }
        )
      }
    );
  }
);
pu.displayName = Mi;
var Ug = "MenuSeparator", hu = F(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return /* @__PURE__ */ b(
      z.div,
      {
        role: "separator",
        "aria-orientation": "horizontal",
        ...o,
        ref: t
      }
    );
  }
);
hu.displayName = Ug;
var jg = "MenuArrow", xu = F(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e, r = To(n);
    return /* @__PURE__ */ b(bn, { ...r, ...o, ref: t });
  }
);
xu.displayName = jg;
var zg = "MenuSub", [Uw, mu] = wt(zg), Qt = "MenuSubTrigger", vu = F(
  (e, t) => {
    const n = yt(Qt, e.__scopeMenu), o = Sn(Qt, e.__scopeMenu), r = mu(Qt, e.__scopeMenu), i = Ei(Qt, e.__scopeMenu), s = M(null), { pointerGraceTimerRef: a, onPointerGraceIntentChange: l } = i, c = { __scopeMenu: e.__scopeMenu }, u = j(() => {
      s.current && window.clearTimeout(s.current), s.current = null;
    }, []);
    return W(() => u, [u]), W(() => {
      const d = a.current;
      return () => {
        window.clearTimeout(d), l(null);
      };
    }, [a, l]), /* @__PURE__ */ b(Si, { asChild: !0, ...c, children: /* @__PURE__ */ b(
      su,
      {
        id: r.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": n.open,
        "aria-controls": r.contentId,
        "data-state": wu(n.open),
        ...e,
        ref: po(t, r.onTriggerChange),
        onClick: (d) => {
          e.onClick?.(d), !(e.disabled || d.defaultPrevented) && (d.currentTarget.focus(), n.open || n.onOpenChange(!0));
        },
        onPointerMove: I(
          e.onPointerMove,
          cn((d) => {
            i.onItemEnter(d), !d.defaultPrevented && !e.disabled && !n.open && !s.current && (i.onPointerGraceIntentChange(null), s.current = window.setTimeout(() => {
              n.onOpenChange(!0), u();
            }, 100));
          })
        ),
        onPointerLeave: I(
          e.onPointerLeave,
          cn((d) => {
            u();
            const f = n.content?.getBoundingClientRect();
            if (f) {
              const p = n.content?.dataset.side, x = p === "right", h = x ? -5 : 5, m = f[x ? "left" : "right"], v = f[x ? "right" : "left"];
              i.onPointerGraceIntentChange({
                area: [
                  // Apply a bleed on clientX to ensure that our exit point is
                  // consistently within polygon bounds
                  { x: d.clientX + h, y: d.clientY },
                  { x: m, y: f.top },
                  { x: v, y: f.top },
                  { x: v, y: f.bottom },
                  { x: m, y: f.bottom }
                ],
                side: p
              }), window.clearTimeout(a.current), a.current = window.setTimeout(
                () => i.onPointerGraceIntentChange(null),
                300
              );
            } else {
              if (i.onTriggerLeave(d), d.defaultPrevented) return;
              i.onPointerGraceIntentChange(null);
            }
          })
        ),
        onKeyDown: I(e.onKeyDown, (d) => {
          const f = i.searchRef.current !== "";
          e.disabled || f && d.key === " " || Ng[o.dir].includes(d.key) && (n.onOpenChange(!0), n.content?.focus(), d.preventDefault());
        })
      }
    ) });
  }
);
vu.displayName = Qt;
var gu = "MenuSubContent", bu = F(
  (e, t) => {
    const n = nu(_e, e.__scopeMenu), { forceMount: o = n.forceMount, ...r } = e, i = yt(_e, e.__scopeMenu), s = Sn(_e, e.__scopeMenu), a = mu(gu, e.__scopeMenu), l = M(null), c = G(t, l);
    return /* @__PURE__ */ b(an.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ b(ge, { present: o || i.open, children: /* @__PURE__ */ b(an.Slot, { scope: e.__scopeMenu, children: /* @__PURE__ */ b(
      Ai,
      {
        id: a.contentId,
        "aria-labelledby": a.triggerId,
        ...r,
        ref: c,
        align: "start",
        side: s.dir === "rtl" ? "left" : "right",
        disableOutsidePointerEvents: !1,
        disableOutsideScroll: !1,
        trapFocus: !1,
        onOpenAutoFocus: (u) => {
          s.isUsingKeyboardRef.current && l.current?.focus(), u.preventDefault();
        },
        onCloseAutoFocus: (u) => u.preventDefault(),
        onFocusOutside: I(e.onFocusOutside, (u) => {
          u.target !== a.trigger && i.onOpenChange(!1);
        }),
        onEscapeKeyDown: I(e.onEscapeKeyDown, (u) => {
          s.onClose(), u.preventDefault();
        }),
        onKeyDown: I(e.onKeyDown, (u) => {
          const d = u.currentTarget.contains(u.target), f = Eg[s.dir].includes(u.key);
          d && f && (i.onOpenChange(!1), a.trigger?.focus(), u.preventDefault());
        })
      }
    ) }) }) });
  }
);
bu.displayName = gu;
function wu(e) {
  return e ? "open" : "closed";
}
function no(e) {
  return e === "indeterminate";
}
function ki(e) {
  return no(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function Kg(e) {
  const t = document.activeElement;
  for (const n of e)
    if (n === t || (n.focus(), document.activeElement !== t)) return;
}
function Gg(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
function Yg(e, t, n) {
  const r = t.length > 1 && Array.from(t).every((c) => c === t[0]) ? t[0] : t, i = n ? e.indexOf(n) : -1;
  let s = Gg(e, Math.max(i, 0));
  r.length === 1 && (s = s.filter((c) => c !== n));
  const l = s.find(
    (c) => c.toLowerCase().startsWith(r.toLowerCase())
  );
  return l !== n ? l : void 0;
}
function Xg(e, t) {
  const { x: n, y: o } = e;
  let r = !1;
  for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
    const a = t[i], l = t[s], c = a.x, u = a.y, d = l.x, f = l.y;
    u > o != f > o && n < (d - c) * (o - u) / (f - u) + c && (r = !r);
  }
  return r;
}
function Jg(e, t) {
  if (!t) return !1;
  const n = { x: e.clientX, y: e.clientY };
  return Xg(n, t);
}
function cn(e) {
  return (t) => t.pointerType === "mouse" ? e(t) : void 0;
}
var yu = tu, Cu = Si, _u = ou, Su = ru, Nu = Fi, Eu = iu, Au = Ro, Fu = au, Mu = lu, ku = du, Pu = pu, Du = hu, Ou = xu, Tu = vu, Ru = bu, Bo = "DropdownMenu", [qg] = pe(
  Bo,
  [Oo]
), xe = Oo(), [Zg, Bu] = qg(Bo), Iu = (e) => {
  const {
    __scopeDropdownMenu: t,
    children: n,
    dir: o,
    open: r,
    defaultOpen: i,
    onOpenChange: s,
    modal: a = !0
  } = e, l = xe(t), c = M(null), [u, d] = ve({
    prop: r,
    defaultProp: i ?? !1,
    onChange: s,
    caller: Bo
  });
  return /* @__PURE__ */ b(
    Zg,
    {
      scope: t,
      triggerId: Me(),
      triggerRef: c,
      contentId: Me(),
      open: u,
      onOpenChange: d,
      onOpenToggle: j(() => d((f) => !f), [d]),
      modal: a,
      children: /* @__PURE__ */ b(yu, { ...l, open: u, onOpenChange: d, dir: o, modal: a, children: n })
    }
  );
};
Iu.displayName = Bo;
var Lu = "DropdownMenuTrigger", $u = F(
  (e, t) => {
    const { __scopeDropdownMenu: n, disabled: o = !1, ...r } = e, i = Bu(Lu, n), s = xe(n);
    return /* @__PURE__ */ b(Cu, { asChild: !0, ...s, children: /* @__PURE__ */ b(
      z.button,
      {
        type: "button",
        id: i.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": i.open,
        "aria-controls": i.open ? i.contentId : void 0,
        "data-state": i.open ? "open" : "closed",
        "data-disabled": o ? "" : void 0,
        disabled: o,
        ...r,
        ref: po(t, i.triggerRef),
        onPointerDown: I(e.onPointerDown, (a) => {
          !o && a.button === 0 && a.ctrlKey === !1 && (i.onOpenToggle(), i.open || a.preventDefault());
        }),
        onKeyDown: I(e.onKeyDown, (a) => {
          o || (["Enter", " "].includes(a.key) && i.onOpenToggle(), a.key === "ArrowDown" && i.onOpenChange(!0), ["Enter", " ", "ArrowDown"].includes(a.key) && a.preventDefault());
        })
      }
    ) });
  }
);
$u.displayName = Lu;
var Qg = "DropdownMenuPortal", Wu = (e) => {
  const { __scopeDropdownMenu: t, ...n } = e, o = xe(t);
  return /* @__PURE__ */ b(_u, { ...o, ...n });
};
Wu.displayName = Qg;
var Hu = "DropdownMenuContent", Vu = F(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = Bu(Hu, n), i = xe(n), s = M(!1);
    return /* @__PURE__ */ b(
      Su,
      {
        id: r.contentId,
        "aria-labelledby": r.triggerId,
        ...i,
        ...o,
        ref: t,
        onCloseAutoFocus: I(e.onCloseAutoFocus, (a) => {
          s.current || r.triggerRef.current?.focus(), s.current = !1, a.preventDefault();
        }),
        onInteractOutside: I(e.onInteractOutside, (a) => {
          const l = a.detail.originalEvent, c = l.button === 0 && l.ctrlKey === !0, u = l.button === 2 || c;
          (!r.modal || u) && (s.current = !0);
        }),
        style: {
          ...e.style,
          "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
          "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
          "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }
);
Vu.displayName = Hu;
var e1 = "DropdownMenuGroup", t1 = F(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
    return /* @__PURE__ */ b(Nu, { ...r, ...o, ref: t });
  }
);
t1.displayName = e1;
var n1 = "DropdownMenuLabel", o1 = F(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
    return /* @__PURE__ */ b(Eu, { ...r, ...o, ref: t });
  }
);
o1.displayName = n1;
var r1 = "DropdownMenuItem", Uu = F(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
    return /* @__PURE__ */ b(Au, { ...r, ...o, ref: t });
  }
);
Uu.displayName = r1;
var i1 = "DropdownMenuCheckboxItem", s1 = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(Fu, { ...r, ...o, ref: t });
});
s1.displayName = i1;
var a1 = "DropdownMenuRadioGroup", c1 = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(Mu, { ...r, ...o, ref: t });
});
c1.displayName = a1;
var l1 = "DropdownMenuRadioItem", u1 = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(ku, { ...r, ...o, ref: t });
});
u1.displayName = l1;
var d1 = "DropdownMenuItemIndicator", f1 = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(Pu, { ...r, ...o, ref: t });
});
f1.displayName = d1;
var p1 = "DropdownMenuSeparator", ju = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(Du, { ...r, ...o, ref: t });
});
ju.displayName = p1;
var h1 = "DropdownMenuArrow", x1 = F(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
    return /* @__PURE__ */ b(Ou, { ...r, ...o, ref: t });
  }
);
x1.displayName = h1;
var m1 = "DropdownMenuSubTrigger", v1 = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(Tu, { ...r, ...o, ref: t });
});
v1.displayName = m1;
var g1 = "DropdownMenuSubContent", b1 = F((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = xe(n);
  return /* @__PURE__ */ b(
    Ru,
    {
      ...r,
      ...o,
      ref: t,
      style: {
        ...e.style,
        "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
        "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
        "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
b1.displayName = g1;
var w1 = Iu, y1 = $u, C1 = Wu, _1 = Vu, S1 = Uu, N1 = ju;
function E1(e) {
  const { voChildren: t } = e, n = t || [], o = Ye(), r = n[0], i = n.slice(1);
  return C(
    w1,
    null,
    C(
      y1,
      { asChild: !0 },
      r ? le(r) : C("button", null, "...")
    ),
    C(
      C1,
      { container: o ?? void 0 },
      C(
        _1,
        {
          className: [
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "animate-scale-in"
          ].join(" "),
          sideOffset: 4,
          align: "start"
        },
        ...i.map((s) => A1(s))
      )
    )
  );
}
function A1(e) {
  if (!e) return null;
  const { type: t, props: n = {} } = e;
  if (t === "vo-menu-divider")
    return C(N1, { className: "-mx-1 my-1 h-px bg-border" });
  const o = n.textContent || "", r = n.onClick, i = n.disabled;
  return C(S1, {
    className: [
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "transition-colors focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    ].join(" "),
    disabled: i || !1,
    onSelect: () => {
      r != null && J(r, "{}");
    }
  }, o);
}
var Pi = "ContextMenu", [F1] = pe(Pi, [
  Oo
]), me = Oo(), [M1, zu] = F1(Pi), Ku = (e) => {
  const { __scopeContextMenu: t, children: n, onOpenChange: o, dir: r, modal: i = !0 } = e, [s, a] = V(!1), l = me(t), c = Fe(o), u = j(
    (d) => {
      a(d), c(d);
    },
    [c]
  );
  return /* @__PURE__ */ b(
    M1,
    {
      scope: t,
      open: s,
      onOpenChange: u,
      modal: i,
      children: /* @__PURE__ */ b(
        yu,
        {
          ...l,
          dir: r,
          open: s,
          onOpenChange: u,
          modal: i,
          children: n
        }
      )
    }
  );
};
Ku.displayName = Pi;
var Gu = "ContextMenuTrigger", Yu = F(
  (e, t) => {
    const { __scopeContextMenu: n, disabled: o = !1, ...r } = e, i = zu(Gu, n), s = me(n), a = M({ x: 0, y: 0 }), l = M({
      getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...a.current })
    }), c = M(0), u = j(
      () => window.clearTimeout(c.current),
      []
    ), d = (f) => {
      a.current = { x: f.clientX, y: f.clientY }, i.onOpenChange(!0);
    };
    return W(() => u, [u]), W(() => {
      o && u();
    }, [o, u]), /* @__PURE__ */ b(ce, { children: [
      /* @__PURE__ */ b(Cu, { ...s, virtualRef: l }),
      /* @__PURE__ */ b(
        z.span,
        {
          "data-state": i.open ? "open" : "closed",
          "data-disabled": o ? "" : void 0,
          ...r,
          ref: t,
          style: { WebkitTouchCallout: "none", ...e.style },
          onContextMenu: o ? e.onContextMenu : I(e.onContextMenu, (f) => {
            u(), d(f), f.preventDefault();
          }),
          onPointerDown: o ? e.onPointerDown : I(
            e.onPointerDown,
            In((f) => {
              u(), c.current = window.setTimeout(() => d(f), 700);
            })
          ),
          onPointerMove: o ? e.onPointerMove : I(e.onPointerMove, In(u)),
          onPointerCancel: o ? e.onPointerCancel : I(e.onPointerCancel, In(u)),
          onPointerUp: o ? e.onPointerUp : I(e.onPointerUp, In(u))
        }
      )
    ] });
  }
);
Yu.displayName = Gu;
var k1 = "ContextMenuPortal", Xu = (e) => {
  const { __scopeContextMenu: t, ...n } = e, o = me(t);
  return /* @__PURE__ */ b(_u, { ...o, ...n });
};
Xu.displayName = k1;
var Ju = "ContextMenuContent", qu = F(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = zu(Ju, n), i = me(n), s = M(!1);
    return /* @__PURE__ */ b(
      Su,
      {
        ...i,
        ...o,
        ref: t,
        side: "right",
        sideOffset: 2,
        align: "start",
        onCloseAutoFocus: (a) => {
          e.onCloseAutoFocus?.(a), !a.defaultPrevented && s.current && a.preventDefault(), s.current = !1;
        },
        onInteractOutside: (a) => {
          e.onInteractOutside?.(a), !a.defaultPrevented && !r.modal && (s.current = !0);
        },
        style: {
          ...e.style,
          "--radix-context-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-context-menu-content-available-width": "var(--radix-popper-available-width)",
          "--radix-context-menu-content-available-height": "var(--radix-popper-available-height)",
          "--radix-context-menu-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-context-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }
);
qu.displayName = Ju;
var P1 = "ContextMenuGroup", D1 = F(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(Nu, { ...r, ...o, ref: t });
  }
);
D1.displayName = P1;
var O1 = "ContextMenuLabel", T1 = F(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(Eu, { ...r, ...o, ref: t });
  }
);
T1.displayName = O1;
var R1 = "ContextMenuItem", Zu = F(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(Au, { ...r, ...o, ref: t });
  }
);
Zu.displayName = R1;
var B1 = "ContextMenuCheckboxItem", I1 = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(Fu, { ...r, ...o, ref: t });
});
I1.displayName = B1;
var L1 = "ContextMenuRadioGroup", $1 = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(Mu, { ...r, ...o, ref: t });
});
$1.displayName = L1;
var W1 = "ContextMenuRadioItem", H1 = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(ku, { ...r, ...o, ref: t });
});
H1.displayName = W1;
var V1 = "ContextMenuItemIndicator", U1 = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(Pu, { ...r, ...o, ref: t });
});
U1.displayName = V1;
var j1 = "ContextMenuSeparator", Qu = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(Du, { ...r, ...o, ref: t });
});
Qu.displayName = j1;
var z1 = "ContextMenuArrow", K1 = F(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(Ou, { ...r, ...o, ref: t });
  }
);
K1.displayName = z1;
var G1 = "ContextMenuSubTrigger", Y1 = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(Tu, { ...r, ...o, ref: t });
});
Y1.displayName = G1;
var X1 = "ContextMenuSubContent", J1 = F((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(
    Ru,
    {
      ...r,
      ...o,
      ref: t,
      style: {
        ...e.style,
        "--radix-context-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-context-menu-content-available-width": "var(--radix-popper-available-width)",
        "--radix-context-menu-content-available-height": "var(--radix-popper-available-height)",
        "--radix-context-menu-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-context-menu-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
J1.displayName = X1;
function In(e) {
  return (t) => t.pointerType !== "mouse" ? e(t) : void 0;
}
var q1 = Ku, Z1 = Yu, Q1 = Xu, eb = qu, tb = Zu, nb = Qu;
function ob(e) {
  const { voChildren: t } = e, n = t || [], o = Ye(), r = n[0], i = n.slice(1);
  return C(
    q1,
    null,
    C(
      Z1,
      { asChild: !0 },
      r ? le(r) : C("div", null)
    ),
    C(
      Q1,
      { container: o ?? void 0 },
      C(
        eb,
        {
          className: [
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "animate-scale-in"
          ].join(" ")
        },
        ...i.map((s) => rb(s))
      )
    )
  );
}
function rb(e) {
  if (!e) return null;
  const { type: t, props: n = {} } = e;
  if (t === "vo-menu-divider")
    return C(nb, { className: "-mx-1 my-1 h-px bg-border" });
  const o = n.textContent || "", r = n.onClick, i = n.disabled;
  return C(tb, {
    className: [
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "transition-colors focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    ].join(" "),
    disabled: i || !1,
    onSelect: () => {
      r != null && J(r, "{}");
    }
  }, o);
}
var dr, Io = "HoverCard", [ed] = pe(Io, [
  He
]), Lo = He(), [ib, $o] = ed(Io), td = (e) => {
  const {
    __scopeHoverCard: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    openDelay: s = 700,
    closeDelay: a = 300
  } = e, l = Lo(t), c = M(0), u = M(0), d = M(!1), f = M(!1), [p, x] = ve({
    prop: o,
    defaultProp: r ?? !1,
    onChange: i,
    caller: Io
  }), h = j(() => {
    clearTimeout(u.current), c.current = window.setTimeout(() => x(!0), s);
  }, [s, x]), m = j(() => {
    clearTimeout(c.current), !d.current && !f.current && (u.current = window.setTimeout(() => x(!1), a));
  }, [a, x]), v = j(() => x(!1), [x]);
  return W(() => () => {
    clearTimeout(c.current), clearTimeout(u.current);
  }, []), /* @__PURE__ */ b(
    ib,
    {
      scope: t,
      open: p,
      onOpenChange: x,
      onOpen: h,
      onClose: m,
      onDismiss: v,
      hasSelectionRef: d,
      isPointerDownOnContentRef: f,
      children: /* @__PURE__ */ b(vn, { ...l, children: n })
    }
  );
};
td.displayName = Io;
var nd = "HoverCardTrigger", od = F(
  (e, t) => {
    const { __scopeHoverCard: n, ...o } = e, r = $o(nd, n), i = Lo(n);
    return /* @__PURE__ */ b(zt, { asChild: !0, ...i, children: /* @__PURE__ */ b(
      z.a,
      {
        "data-state": r.open ? "open" : "closed",
        ...o,
        ref: t,
        onPointerEnter: I(e.onPointerEnter, ro(r.onOpen)),
        onPointerLeave: I(e.onPointerLeave, ro(r.onClose)),
        onFocus: I(e.onFocus, r.onOpen),
        onBlur: I(e.onBlur, r.onClose),
        onTouchStart: I(e.onTouchStart, (s) => s.preventDefault())
      }
    ) });
  }
);
od.displayName = nd;
var Di = "HoverCardPortal", [sb, ab] = ed(Di, {
  forceMount: void 0
}), rd = (e) => {
  const { __scopeHoverCard: t, forceMount: n, children: o, container: r } = e, i = $o(Di, t);
  return /* @__PURE__ */ b(sb, { scope: t, forceMount: n, children: /* @__PURE__ */ b(ge, { present: n || i.open, children: /* @__PURE__ */ b(Kt, { asChild: !0, container: r, children: o }) }) });
};
rd.displayName = Di;
var oo = "HoverCardContent", id = F(
  (e, t) => {
    const n = ab(oo, e.__scopeHoverCard), { forceMount: o = n.forceMount, ...r } = e, i = $o(oo, e.__scopeHoverCard);
    return /* @__PURE__ */ b(ge, { present: o || i.open, children: /* @__PURE__ */ b(
      cb,
      {
        "data-state": i.open ? "open" : "closed",
        ...r,
        onPointerEnter: I(e.onPointerEnter, ro(i.onOpen)),
        onPointerLeave: I(e.onPointerLeave, ro(i.onClose)),
        ref: t
      }
    ) });
  }
);
id.displayName = oo;
var cb = F((e, t) => {
  const {
    __scopeHoverCard: n,
    onEscapeKeyDown: o,
    onPointerDownOutside: r,
    onFocusOutside: i,
    onInteractOutside: s,
    ...a
  } = e, l = $o(oo, n), c = Lo(n), u = M(null), d = G(t, u), [f, p] = V(!1);
  return W(() => {
    if (f) {
      const x = document.body;
      return dr = x.style.userSelect || x.style.webkitUserSelect, x.style.userSelect = "none", x.style.webkitUserSelect = "none", () => {
        x.style.userSelect = dr, x.style.webkitUserSelect = dr;
      };
    }
  }, [f]), W(() => {
    if (u.current) {
      const x = () => {
        p(!1), l.isPointerDownOnContentRef.current = !1, setTimeout(() => {
          document.getSelection()?.toString() !== "" && (l.hasSelectionRef.current = !0);
        });
      };
      return document.addEventListener("pointerup", x), () => {
        document.removeEventListener("pointerup", x), l.hasSelectionRef.current = !1, l.isPointerDownOnContentRef.current = !1;
      };
    }
  }, [l.isPointerDownOnContentRef, l.hasSelectionRef]), W(() => {
    u.current && ub(u.current).forEach((h) => h.setAttribute("tabindex", "-1"));
  }), /* @__PURE__ */ b(
    Vt,
    {
      asChild: !0,
      disableOutsidePointerEvents: !1,
      onInteractOutside: s,
      onEscapeKeyDown: o,
      onPointerDownOutside: r,
      onFocusOutside: I(i, (x) => {
        x.preventDefault();
      }),
      onDismiss: l.onDismiss,
      children: /* @__PURE__ */ b(
        gn,
        {
          ...c,
          ...a,
          onPointerDown: I(a.onPointerDown, (x) => {
            x.currentTarget.contains(x.target) && p(!0), l.hasSelectionRef.current = !1, l.isPointerDownOnContentRef.current = !0;
          }),
          ref: d,
          style: {
            ...a.style,
            userSelect: f ? "text" : void 0,
            // Safari requires prefix
            WebkitUserSelect: f ? "text" : void 0,
            "--radix-hover-card-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-hover-card-content-available-width": "var(--radix-popper-available-width)",
            "--radix-hover-card-content-available-height": "var(--radix-popper-available-height)",
            "--radix-hover-card-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-hover-card-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      )
    }
  );
}), lb = "HoverCardArrow", sd = F(
  (e, t) => {
    const { __scopeHoverCard: n, ...o } = e, r = Lo(n);
    return /* @__PURE__ */ b(bn, { ...r, ...o, ref: t });
  }
);
sd.displayName = lb;
function ro(e) {
  return (t) => t.pointerType === "touch" ? void 0 : e();
}
function ub(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (o) => o.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
var db = td, fb = od, pb = rd, hb = id, xb = sd;
function mb(e) {
  const { voChildren: t } = e, n = t || [], o = Ye(), r = n[0], i = n.slice(1);
  return C(
    db,
    { openDelay: 200, closeDelay: 100 },
    C(
      fb,
      { asChild: !0 },
      r ? le(r) : C("span", null)
    ),
    C(
      pb,
      { container: o ?? void 0 },
      C(
        hb,
        {
          className: [
            "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "animate-scale-in"
          ].join(" "),
          sideOffset: 4
        },
        ...i.map(le),
        C(xb, { className: "fill-popover" })
      )
    )
  );
}
var Wo = "Collapsible", [vb, ad] = pe(Wo), [gb, Oi] = vb(Wo), cd = F(
  (e, t) => {
    const {
      __scopeCollapsible: n,
      open: o,
      defaultOpen: r,
      disabled: i,
      onOpenChange: s,
      ...a
    } = e, [l, c] = ve({
      prop: o,
      defaultProp: r ?? !1,
      onChange: s,
      caller: Wo
    });
    return /* @__PURE__ */ b(
      gb,
      {
        scope: n,
        disabled: i,
        contentId: Me(),
        open: l,
        onOpenToggle: j(() => c((u) => !u), [c]),
        children: /* @__PURE__ */ b(
          z.div,
          {
            "data-state": Ri(l),
            "data-disabled": i ? "" : void 0,
            ...a,
            ref: t
          }
        )
      }
    );
  }
);
cd.displayName = Wo;
var ld = "CollapsibleTrigger", ud = F(
  (e, t) => {
    const { __scopeCollapsible: n, ...o } = e, r = Oi(ld, n);
    return /* @__PURE__ */ b(
      z.button,
      {
        type: "button",
        "aria-controls": r.contentId,
        "aria-expanded": r.open || !1,
        "data-state": Ri(r.open),
        "data-disabled": r.disabled ? "" : void 0,
        disabled: r.disabled,
        ...o,
        ref: t,
        onClick: I(e.onClick, r.onOpenToggle)
      }
    );
  }
);
ud.displayName = ld;
var Ti = "CollapsibleContent", dd = F(
  (e, t) => {
    const { forceMount: n, ...o } = e, r = Oi(Ti, e.__scopeCollapsible);
    return /* @__PURE__ */ b(ge, { present: n || r.open, children: ({ present: i }) => /* @__PURE__ */ b(bb, { ...o, ref: t, present: i }) });
  }
);
dd.displayName = Ti;
var bb = F((e, t) => {
  const { __scopeCollapsible: n, present: o, children: r, ...i } = e, s = Oi(Ti, n), [a, l] = V(o), c = M(null), u = G(t, c), d = M(0), f = d.current, p = M(0), x = p.current, h = s.open || a, m = M(h), v = M(void 0);
  return W(() => {
    const g = requestAnimationFrame(() => m.current = !1);
    return () => cancelAnimationFrame(g);
  }, []), fe(() => {
    const g = c.current;
    if (g) {
      v.current = v.current || {
        transitionDuration: g.style.transitionDuration,
        animationName: g.style.animationName
      }, g.style.transitionDuration = "0s", g.style.animationName = "none";
      const w = g.getBoundingClientRect();
      d.current = w.height, p.current = w.width, m.current || (g.style.transitionDuration = v.current.transitionDuration, g.style.animationName = v.current.animationName), l(o);
    }
  }, [s.open, o]), /* @__PURE__ */ b(
    z.div,
    {
      "data-state": Ri(s.open),
      "data-disabled": s.disabled ? "" : void 0,
      id: s.contentId,
      hidden: !h,
      ...i,
      ref: u,
      style: {
        "--radix-collapsible-content-height": f ? `${f}px` : void 0,
        "--radix-collapsible-content-width": x ? `${x}px` : void 0,
        ...e.style
      },
      children: h && r
    }
  );
});
function Ri(e) {
  return e ? "open" : "closed";
}
var fd = cd, pd = ud, hd = dd;
function wb(e) {
  const { open: t, defaultOpen: n, onChange: o, voChildren: r } = e, i = r || [], s = i[0], a = i.slice(1), l = e.class || "", c = se(e), u = {
    className: l || void 0,
    style: c,
    onOpenChange: (d) => {
      o != null && J(o, JSON.stringify({ Checked: d }));
    }
  };
  return t != null ? u.open = !!t : n && (u.defaultOpen = !0), C(
    fd,
    u,
    C(
      pd,
      { asChild: !0 },
      s ? le(s) : C("button", null, "Toggle")
    ),
    C(
      hd,
      {
        className: "overflow-hidden data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      },
      ...a.map(le)
    )
  );
}
var Ho = "Tabs", [yb] = pe(Ho, [
  Do
]), xd = Do(), [Cb, Bi] = yb(Ho), md = F(
  (e, t) => {
    const {
      __scopeTabs: n,
      value: o,
      onValueChange: r,
      defaultValue: i,
      orientation: s = "horizontal",
      dir: a,
      activationMode: l = "automatic",
      ...c
    } = e, u = Wt(a), [d, f] = ve({
      prop: o,
      onChange: r,
      defaultProp: i ?? "",
      caller: Ho
    });
    return /* @__PURE__ */ b(
      Cb,
      {
        scope: n,
        baseId: Me(),
        value: d,
        onValueChange: f,
        orientation: s,
        dir: u,
        activationMode: l,
        children: /* @__PURE__ */ b(
          z.div,
          {
            dir: u,
            "data-orientation": s,
            ...c,
            ref: t
          }
        )
      }
    );
  }
);
md.displayName = Ho;
var vd = "TabsList", gd = F(
  (e, t) => {
    const { __scopeTabs: n, loop: o = !0, ...r } = e, i = Bi(vd, n), s = xd(n);
    return /* @__PURE__ */ b(
      ql,
      {
        asChild: !0,
        ...s,
        orientation: i.orientation,
        dir: i.dir,
        loop: o,
        children: /* @__PURE__ */ b(
          z.div,
          {
            role: "tablist",
            "aria-orientation": i.orientation,
            ...r,
            ref: t
          }
        )
      }
    );
  }
);
gd.displayName = vd;
var bd = "TabsTrigger", wd = F(
  (e, t) => {
    const { __scopeTabs: n, value: o, disabled: r = !1, ...i } = e, s = Bi(bd, n), a = xd(n), l = _d(s.baseId, o), c = Sd(s.baseId, o), u = o === s.value;
    return /* @__PURE__ */ b(
      Zl,
      {
        asChild: !0,
        ...a,
        focusable: !r,
        active: u,
        children: /* @__PURE__ */ b(
          z.button,
          {
            type: "button",
            role: "tab",
            "aria-selected": u,
            "aria-controls": c,
            "data-state": u ? "active" : "inactive",
            "data-disabled": r ? "" : void 0,
            disabled: r,
            id: l,
            ...i,
            ref: t,
            onMouseDown: I(e.onMouseDown, (d) => {
              !r && d.button === 0 && d.ctrlKey === !1 ? s.onValueChange(o) : d.preventDefault();
            }),
            onKeyDown: I(e.onKeyDown, (d) => {
              [" ", "Enter"].includes(d.key) && s.onValueChange(o);
            }),
            onFocus: I(e.onFocus, () => {
              const d = s.activationMode !== "manual";
              !u && !r && d && s.onValueChange(o);
            })
          }
        )
      }
    );
  }
);
wd.displayName = bd;
var yd = "TabsContent", Cd = F(
  (e, t) => {
    const { __scopeTabs: n, value: o, forceMount: r, children: i, ...s } = e, a = Bi(yd, n), l = _d(a.baseId, o), c = Sd(a.baseId, o), u = o === a.value, d = M(u);
    return W(() => {
      const f = requestAnimationFrame(() => d.current = !1);
      return () => cancelAnimationFrame(f);
    }, []), /* @__PURE__ */ b(ge, { present: r || u, children: ({ present: f }) => /* @__PURE__ */ b(
      z.div,
      {
        "data-state": u ? "active" : "inactive",
        "data-orientation": a.orientation,
        role: "tabpanel",
        "aria-labelledby": l,
        hidden: !f,
        id: c,
        tabIndex: 0,
        ...s,
        ref: t,
        style: {
          ...e.style,
          animationDuration: d.current ? "0s" : void 0
        },
        children: f && i
      }
    ) });
  }
);
Cd.displayName = yd;
function _d(e, t) {
  return `${e}-trigger-${t}`;
}
function Sd(e, t) {
  return `${e}-content-${t}`;
}
var _b = md, Sb = gd, Nb = wd, Eb = Cd;
function Ab(e) {
  const { activeIndex: t, items: n, onChange: o } = e, r = n || [], i = String(t ?? 0), s = e.class || "", a = se(e);
  return C(
    _b,
    {
      value: i,
      className: s || void 0,
      style: a,
      onValueChange: (l) => {
        o != null && J(o, JSON.stringify({ Value: parseInt(l, 10) }));
      }
    },
    C(
      Sb,
      {
        className: [
          "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
        ].join(" ")
      },
      ...r.map(
        (l, c) => C(Nb, {
          key: String(c),
          value: String(c),
          className: [
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium",
            "ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
            "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          ].join(" ")
        }, l.label)
      )
    ),
    ...r.map(
      (l, c) => C(
        Eb,
        {
          key: String(c),
          value: String(c),
          className: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        },
        l.content ? le(l.content) : null
      )
    )
  );
}
var De = "Accordion", Fb = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"], [Ii, Mb, kb] = xn(De), [Vo] = pe(De, [
  kb,
  ad
]), Li = ad(), Nd = ie.forwardRef(
  (e, t) => {
    const { type: n, ...o } = e, r = o, i = o;
    return /* @__PURE__ */ b(Ii.Provider, { scope: e.__scopeAccordion, children: n === "multiple" ? /* @__PURE__ */ b(Tb, { ...i, ref: t }) : /* @__PURE__ */ b(Ob, { ...r, ref: t }) });
  }
);
Nd.displayName = De;
var [Ed, Pb] = Vo(De), [Ad, Db] = Vo(
  De,
  { collapsible: !1 }
), Ob = ie.forwardRef(
  (e, t) => {
    const {
      value: n,
      defaultValue: o,
      onValueChange: r = () => {
      },
      collapsible: i = !1,
      ...s
    } = e, [a, l] = ve({
      prop: n,
      defaultProp: o ?? "",
      onChange: r,
      caller: De
    });
    return /* @__PURE__ */ b(
      Ed,
      {
        scope: e.__scopeAccordion,
        value: ie.useMemo(() => a ? [a] : [], [a]),
        onItemOpen: l,
        onItemClose: ie.useCallback(() => i && l(""), [i, l]),
        children: /* @__PURE__ */ b(Ad, { scope: e.__scopeAccordion, collapsible: i, children: /* @__PURE__ */ b(Fd, { ...s, ref: t }) })
      }
    );
  }
), Tb = ie.forwardRef((e, t) => {
  const {
    value: n,
    defaultValue: o,
    onValueChange: r = () => {
    },
    ...i
  } = e, [s, a] = ve({
    prop: n,
    defaultProp: o ?? [],
    onChange: r,
    caller: De
  }), l = ie.useCallback(
    (u) => a((d = []) => [...d, u]),
    [a]
  ), c = ie.useCallback(
    (u) => a((d = []) => d.filter((f) => f !== u)),
    [a]
  );
  return /* @__PURE__ */ b(
    Ed,
    {
      scope: e.__scopeAccordion,
      value: s,
      onItemOpen: l,
      onItemClose: c,
      children: /* @__PURE__ */ b(Ad, { scope: e.__scopeAccordion, collapsible: !0, children: /* @__PURE__ */ b(Fd, { ...i, ref: t }) })
    }
  );
}), [Rb, Uo] = Vo(De), Fd = ie.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, disabled: o, dir: r, orientation: i = "vertical", ...s } = e, a = ie.useRef(null), l = G(a, t), c = Mb(n), d = Wt(r) === "ltr", f = I(e.onKeyDown, (p) => {
      if (!Fb.includes(p.key)) return;
      const x = p.target, h = c().filter((k) => !k.ref.current?.disabled), m = h.findIndex((k) => k.ref.current === x), v = h.length;
      if (m === -1) return;
      p.preventDefault();
      let g = m;
      const w = 0, _ = v - 1, S = () => {
        g = m + 1, g > _ && (g = w);
      }, y = () => {
        g = m - 1, g < w && (g = _);
      };
      switch (p.key) {
        case "Home":
          g = w;
          break;
        case "End":
          g = _;
          break;
        case "ArrowRight":
          i === "horizontal" && (d ? S() : y());
          break;
        case "ArrowDown":
          i === "vertical" && S();
          break;
        case "ArrowLeft":
          i === "horizontal" && (d ? y() : S());
          break;
        case "ArrowUp":
          i === "vertical" && y();
          break;
      }
      const N = g % v;
      h[N].ref.current?.focus();
    });
    return /* @__PURE__ */ b(
      Rb,
      {
        scope: n,
        disabled: o,
        direction: r,
        orientation: i,
        children: /* @__PURE__ */ b(Ii.Slot, { scope: n, children: /* @__PURE__ */ b(
          z.div,
          {
            ...s,
            "data-orientation": i,
            ref: l,
            onKeyDown: o ? void 0 : f
          }
        ) })
      }
    );
  }
), io = "AccordionItem", [Bb, $i] = Vo(io), Md = ie.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, value: o, ...r } = e, i = Uo(io, n), s = Pb(io, n), a = Li(n), l = Me(), c = o && s.value.includes(o) || !1, u = i.disabled || e.disabled;
    return /* @__PURE__ */ b(
      Bb,
      {
        scope: n,
        open: c,
        disabled: u,
        triggerId: l,
        children: /* @__PURE__ */ b(
          fd,
          {
            "data-orientation": i.orientation,
            "data-state": Rd(c),
            ...a,
            ...r,
            ref: t,
            disabled: u,
            open: c,
            onOpenChange: (d) => {
              d ? s.onItemOpen(o) : s.onItemClose(o);
            }
          }
        )
      }
    );
  }
);
Md.displayName = io;
var kd = "AccordionHeader", Pd = ie.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...o } = e, r = Uo(De, n), i = $i(kd, n);
    return /* @__PURE__ */ b(
      z.h3,
      {
        "data-orientation": r.orientation,
        "data-state": Rd(i.open),
        "data-disabled": i.disabled ? "" : void 0,
        ...o,
        ref: t
      }
    );
  }
);
Pd.displayName = kd;
var Ir = "AccordionTrigger", Dd = ie.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...o } = e, r = Uo(De, n), i = $i(Ir, n), s = Db(Ir, n), a = Li(n);
    return /* @__PURE__ */ b(Ii.ItemSlot, { scope: n, children: /* @__PURE__ */ b(
      pd,
      {
        "aria-disabled": i.open && !s.collapsible || void 0,
        "data-orientation": r.orientation,
        id: i.triggerId,
        ...a,
        ...o,
        ref: t
      }
    ) });
  }
);
Dd.displayName = Ir;
var Od = "AccordionContent", Td = ie.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...o } = e, r = Uo(De, n), i = $i(Od, n), s = Li(n);
    return /* @__PURE__ */ b(
      hd,
      {
        role: "region",
        "aria-labelledby": i.triggerId,
        "data-orientation": r.orientation,
        ...s,
        ...o,
        ref: t,
        style: {
          "--radix-accordion-content-height": "var(--radix-collapsible-content-height)",
          "--radix-accordion-content-width": "var(--radix-collapsible-content-width)",
          ...e.style
        }
      }
    );
  }
);
Td.displayName = Od;
function Rd(e) {
  return e ? "open" : "closed";
}
var Ib = Nd, Lb = Md, $b = Pd, Wb = Dd, Hb = Td;
function Vb(e) {
  const { items: t, openIndex: n, onChange: o } = e, r = t || [], i = n != null && n >= 0 ? String(n) : void 0, s = e.class || "", a = se(e);
  return C(
    Ib,
    {
      type: "single",
      collapsible: !0,
      value: i,
      className: s || void 0,
      style: a,
      onValueChange: (l) => {
        if (o != null) {
          const c = l === "" ? -1 : parseInt(l, 10);
          J(o, JSON.stringify({ Value: c }));
        }
      }
    },
    ...r.map(
      (l, c) => C(
        Lb,
        {
          key: String(c),
          value: String(c),
          className: "border-b border-border"
        },
        C(
          $b,
          { className: "flex" },
          C(
            Wb,
            {
              className: [
                "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all",
                "hover:underline [&[data-state=open]>svg]:rotate-180"
              ].join(" ")
            },
            l.title,
            C(
              "svg",
              {
                width: 16,
                height: 16,
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 2,
                className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
              },
              C("path", { d: "m6 9 6 6 6-6" })
            )
          )
        ),
        C(
          Hb,
          {
            className: "overflow-hidden text-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
          },
          C(
            "div",
            { className: "pb-4 pt-0" },
            l.content ? le(l.content) : null
          )
        )
      )
    )
  );
}
function Ub(e) {
  const { value: t, placeholder: n, voChildren: o } = e, r = e.onSelect ?? e.onChange, s = (o || []).filter((S) => S.type === "vo-combobox-option").map((S) => ({
    label: S.props?.textContent || S.props?.label || "",
    value: S.props?.value || S.props?.textContent || ""
  })), [a, l] = V(!1), [c, u] = V(""), [d, f] = V(0), p = M(null), x = M(null), h = c ? s.filter((S) => S.label.toLowerCase().includes(c.toLowerCase())) : s;
  W(() => {
    f(0);
  }, [c]);
  const m = (S) => {
    l(!1), u(""), r != null && J(r, JSON.stringify({ Value: S }));
  }, v = s.find((S) => S.value === t)?.label || "", g = (S) => {
    S.key === "ArrowDown" ? (S.preventDefault(), f((y) => Math.min(y + 1, h.length - 1))) : S.key === "ArrowUp" ? (S.preventDefault(), f((y) => Math.max(y - 1, 0))) : S.key === "Enter" ? (S.preventDefault(), h[d] && m(h[d].value)) : S.key === "Escape" && l(!1);
  }, w = e.class || "", _ = se(e);
  return C(
    "div",
    {
      className: ["relative w-full", w].filter(Boolean).join(" "),
      style: _
    },
    C(
      "button",
      {
        className: [
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
        ].join(" "),
        onClick: () => {
          l(!a), setTimeout(() => p.current?.focus(), 0);
        },
        type: "button"
      },
      C(
        "span",
        { className: t ? "" : "text-muted-foreground" },
        v || n || "Select..."
      ),
      C(
        "svg",
        { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "ml-2 opacity-50" },
        C("path", { d: "m6 9 6 6 6-6" })
      )
    ),
    a ? C(
      "div",
      {
        className: [
          "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md",
          "animate-scale-in"
        ].join(" ")
      },
      C(
        "div",
        { className: "flex items-center border-b px-3" },
        C(
          "svg",
          { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "mr-2 shrink-0 opacity-50" },
          C("circle", { cx: 11, cy: 11, r: 8 }),
          C("path", { d: "m21 21-4.3-4.3" })
        ),
        C("input", {
          ref: p,
          className: "flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground",
          placeholder: "Search...",
          value: c,
          onInput: (S) => u(S.target.value),
          onKeyDown: g
        })
      ),
      C(
        "div",
        {
          ref: x,
          className: "max-h-60 overflow-auto p-1",
          role: "listbox"
        },
        h.length === 0 ? C("div", { className: "py-6 text-center text-sm text-muted-foreground" }, "No results.") : h.map(
          (S, y) => C(
            "div",
            {
              key: S.value,
              className: [
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                y === d ? "bg-accent text-accent-foreground" : "",
                S.value === t ? "font-medium" : ""
              ].join(" "),
              role: "option",
              "aria-selected": S.value === t,
              onMouseEnter: () => f(y),
              onClick: () => m(S.value)
            },
            S.value === t ? C(
              "svg",
              { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "mr-2" },
              C("polyline", { points: "20 6 9 17 4 12" })
            ) : C("span", { className: "mr-2 w-3" }),
            S.label
          )
        )
      )
    ) : null
  );
}
function jb(e) {
  const { textContent: t, value: n, selected: o, onChange: r, disabled: i, name: s } = e, a = String(n ?? "") === String(o ?? ""), l = e.class || "", c = se(e);
  return C(
    "label",
    {
      className: [
        "flex items-center gap-2 text-sm cursor-pointer",
        i ? "opacity-50 cursor-not-allowed" : "",
        l
      ].filter(Boolean).join(" "),
      style: c
    },
    C("input", {
      type: "radio",
      className: [
        "h-4 w-4 shrink-0 rounded-full border border-input text-primary",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        "disabled:cursor-not-allowed"
      ].join(" "),
      name: s || void 0,
      value: n ?? "",
      checked: a,
      disabled: i || !1,
      onChange: () => {
        r != null && J(r, JSON.stringify({ Value: String(n ?? "") }));
      }
    }),
    t ? C("span", null, t) : null
  );
}
function zb(e) {
  const { items: t } = e, n = t || [], o = e.class || "", r = se(e);
  return C(
    "nav",
    {
      className: ["flex items-center text-sm text-muted-foreground", o].filter(Boolean).join(" "),
      style: r,
      "aria-label": "breadcrumb"
    },
    C(
      "ol",
      { className: "flex items-center gap-1.5" },
      ...n.map((i, s) => {
        const a = s === n.length - 1, l = [];
        return s > 0 && l.push(C("li", {
          key: `sep-${s}`,
          className: "text-muted-foreground/50 select-none",
          "aria-hidden": "true"
        }, "/")), a ? l.push(C("li", {
          key: `item-${s}`,
          className: "font-medium text-foreground",
          "aria-current": "page"
        }, i.label)) : l.push(C(
          "li",
          { key: `item-${s}` },
          C("a", {
            href: i.href || "#",
            className: "transition-colors hover:text-foreground"
          }, i.label)
        )), l;
      }).flat()
    )
  );
}
function Kb(e) {
  const { current: t, total: n, onChange: o } = e, r = t ?? 1, i = n ?? 1, s = e.class || "", a = se(e), l = (p, x) => [
    "inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-sm rounded-md",
    "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    p ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
    x ? "pointer-events-none opacity-50" : "cursor-pointer"
  ].filter(Boolean).join(" "), c = (p) => {
    o != null && J(o, JSON.stringify({ Value: p }));
  }, u = [];
  u.push(C("button", {
    key: "prev",
    className: l(!1, r <= 1),
    disabled: r <= 1,
    onClick: () => c(r - 1)
  }, "«"));
  const d = Math.max(1, r - 2), f = Math.min(i, r + 2);
  d > 1 && (u.push(C("button", { key: "p1", className: l(r === 1, !1), onClick: () => c(1) }, "1")), d > 2 && u.push(C("span", { key: "ell1", className: "px-1 text-muted-foreground" }, "…")));
  for (let p = d; p <= f; p++)
    u.push(C("button", {
      key: `p${p}`,
      className: l(p === r, !1),
      onClick: () => c(p)
    }, String(p)));
  return f < i && (f < i - 1 && u.push(C("span", { key: "ell2", className: "px-1 text-muted-foreground" }, "…")), u.push(C("button", { key: `p${i}`, className: l(r === i, !1), onClick: () => c(i) }, String(i)))), u.push(C("button", {
    key: "next",
    className: l(!1, r >= i),
    disabled: r >= i,
    onClick: () => c(r + 1)
  }, "»")), C("nav", {
    className: ["flex items-center gap-1", s].filter(Boolean).join(" "),
    style: a,
    "aria-label": "pagination"
  }, ...u);
}
function Gb(e) {
  const { current: t, items: n } = e, o = t ?? 0, r = n || [], i = e.class || "", s = se(e);
  return C(
    "div",
    {
      className: ["flex items-start gap-4", i].filter(Boolean).join(" "),
      style: s
    },
    ...r.map((a, l) => {
      const c = l < o ? "completed" : l === o ? "active" : "pending", u = [
        "flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium shrink-0",
        c === "completed" ? "bg-primary text-primary-foreground" : "",
        c === "active" ? "border-2 border-primary text-primary" : "",
        c === "pending" ? "border-2 border-muted text-muted-foreground" : ""
      ].filter(Boolean).join(" "), d = [
        "text-sm font-medium",
        c === "completed" ? "text-foreground" : "",
        c === "active" ? "text-foreground" : "",
        c === "pending" ? "text-muted-foreground" : ""
      ].filter(Boolean).join(" ");
      return C(
        "div",
        { key: String(l), className: "flex flex-col items-center gap-1.5 flex-1" },
        C(
          "div",
          { className: u },
          c === "completed" ? C(
            "svg",
            { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5 },
            C("polyline", { points: "20 6 9 17 4 12" })
          ) : String(l + 1)
        ),
        C("div", { className: d }, a.label),
        a.description ? C("div", { className: "text-xs text-muted-foreground text-center" }, a.description) : null
      );
    })
  );
}
function Yb(e) {
  const {
    totalCount: t = 0,
    itemHeight: n = 40,
    visibleStart: o = 0,
    overscan: r = 3,
    onRange: i,
    voChildren: s
  } = e, a = s || [], l = M(null), c = M(""), u = t * n, d = o * n, f = e.class || "", p = se(e) || {}, x = j(() => {
    const h = l.current;
    if (!h || i == null) return;
    const m = h.scrollTop, v = h.clientHeight, g = r;
    let w = Math.floor(m / n) - g;
    w < 0 && (w = 0);
    let _ = Math.ceil((m + v) / n) + g;
    _ > t && (_ = t);
    const S = `${w}:${_}`;
    S !== c.current && (c.current = S, J(i, JSON.stringify({
      Start: w,
      End: _,
      ScrollTop: m
    })));
  }, [t, n, r, i]);
  return W(() => {
    const h = l.current;
    if (h)
      return h.addEventListener("scroll", x, { passive: !0 }), x(), () => h.removeEventListener("scroll", x);
  }, [x]), C(
    "div",
    {
      className: f || void 0,
      ref: (h) => {
        l.current = h, e.ref && pn(e.ref)(h);
      },
      style: {
        ...p,
        overflowY: "auto",
        position: "relative"
      }
    },
    C(
      "div",
      {
        style: {
          height: `${u}px`,
          position: "relative"
        }
      },
      C(
        "div",
        {
          style: {
            position: "absolute",
            top: `${d}px`,
            left: 0,
            right: 0
          }
        },
        ...a.map(
          (h, m) => C("div", {
            key: `vl-${o + m}`,
            "data-vl-index": o + m
          }, le(h))
        )
      )
    )
  );
}
const Bd = {
  fade: {
    enterFrom: { opacity: "0" },
    enterTo: { opacity: "1" },
    leaveFrom: { opacity: "1" },
    leaveTo: { opacity: "0" },
    duration: 200,
    easing: "ease"
  },
  scale: {
    enterFrom: { opacity: "0", transform: "scale(0.95)" },
    enterTo: { opacity: "1", transform: "scale(1)" },
    leaveFrom: { opacity: "1", transform: "scale(1)" },
    leaveTo: { opacity: "0", transform: "scale(0.95)" },
    duration: 250,
    easing: "ease"
  },
  "slide-down": {
    enterFrom: { opacity: "0", transform: "translateY(-10px)" },
    enterTo: { opacity: "1", transform: "translateY(0)" },
    leaveFrom: { opacity: "1", transform: "translateY(0)" },
    leaveTo: { opacity: "0", transform: "translateY(-10px)" },
    duration: 250,
    easing: "ease-out"
  },
  "slide-up": {
    enterFrom: { opacity: "0", transform: "translateY(10px)" },
    enterTo: { opacity: "1", transform: "translateY(0)" },
    leaveFrom: { opacity: "1", transform: "translateY(0)" },
    leaveTo: { opacity: "0", transform: "translateY(10px)" },
    duration: 250,
    easing: "ease-out"
  },
  "slide-left": {
    enterFrom: { opacity: "0", transform: "translateX(10px)" },
    enterTo: { opacity: "1", transform: "translateX(0)" },
    leaveFrom: { opacity: "1", transform: "translateX(0)" },
    leaveTo: { opacity: "0", transform: "translateX(10px)" },
    duration: 250,
    easing: "ease-out"
  },
  "slide-right": {
    enterFrom: { opacity: "0", transform: "translateX(-10px)" },
    enterTo: { opacity: "1", transform: "translateX(0)" },
    leaveFrom: { opacity: "1", transform: "translateX(0)" },
    leaveTo: { opacity: "0", transform: "translateX(-10px)" },
    duration: 250,
    easing: "ease-out"
  }
}, Xb = Bd.fade;
function Id(e) {
  return Bd[e] || Xb;
}
function nn(e, t, n) {
  return e.map((o) => `${o} ${t}ms ${n}`).join(", ");
}
function Jb(e) {
  const { voChildren: t, ...n } = e, o = t || [], r = n.transition || "fade", i = n.class || "", s = se(n) || {}, a = o.length > 0 && o[0].type !== "#text", l = a ? o[0] : null, [c, u] = V(l), [d, f] = V(a ? "enter" : "idle"), p = M(null), x = M(a), h = M(!1);
  a && !x.current ? (u(l), f("enter")) : !a && x.current && !h.current ? f("leave") : a && l && (d === "idle" || d === "enter") && u(l), x.current = a;
  const m = j(() => {
    const v = p.current;
    v && (v.style.transition = "", v.style.opacity = "", v.style.transform = ""), h.current = !1;
  }, []);
  return Se(() => {
    const v = p.current;
    if (!v) return;
    const g = Id(r);
    d === "enter" ? (h.current = !0, Object.assign(v.style, g.enterFrom), v.style.transition = "none", requestAnimationFrame(() => {
      v.style.transition = nn(
        Object.keys(g.enterFrom),
        g.duration,
        g.easing
      ), Object.assign(v.style, g.enterTo);
      const w = (_) => {
        _.target === v && (v.removeEventListener("transitionend", w), m(), f("idle"));
      };
      v.addEventListener("transitionend", w), setTimeout(() => {
        h.current && d === "enter" && (v.removeEventListener("transitionend", w), m(), f("idle"));
      }, g.duration + 50);
    })) : d === "leave" && (h.current = !0, Object.assign(v.style, g.leaveFrom), v.style.transition = "none", requestAnimationFrame(() => {
      v.style.transition = nn(
        Object.keys(g.leaveTo),
        g.duration,
        g.easing
      ), Object.assign(v.style, g.leaveTo);
      const w = (_) => {
        _.target === v && (v.removeEventListener("transitionend", w), m(), u(null), f("idle"));
      };
      v.addEventListener("transitionend", w), setTimeout(() => {
        h.current && (v.removeEventListener("transitionend", w), m(), u(null), f("idle"));
      }, g.duration + 50);
    }));
  }, [d, r, m]), c ? C("div", {
    ref: p,
    className: i || void 0,
    style: s,
    "data-transition": r,
    "data-transition-phase": d
  }, le(c)) : null;
}
function qb(e) {
  const { voChildren: t, ...n } = e, o = t || [], r = n.transition || "fade", i = n.class || "", s = se(n) || {}, a = M(null), l = M(/* @__PURE__ */ new Map()), c = M(/* @__PURE__ */ new Set()), u = M(/* @__PURE__ */ new Map()), d = M([]), [f, p] = V([]);
  if (a.current) {
    const y = /* @__PURE__ */ new Map(), N = Array.from(a.current.children);
    for (const k of N) {
      const O = k.dataset.flipKey;
      if (O) {
        const E = k.getBoundingClientRect();
        y.set(O, { x: E.x, y: E.y, width: E.width, height: E.height });
      }
    }
    l.current = y;
  }
  const x = /* @__PURE__ */ new Set(), h = /* @__PURE__ */ new Map();
  for (const y of o) {
    const N = y.props?.key;
    if (N != null) {
      const k = String(N);
      x.add(k), h.set(k, le(y));
    }
  }
  const m = c.current, v = u.current;
  let g = !1;
  for (const y of m)
    if (!x.has(y)) {
      const N = v.get(y);
      N && !d.current.some((k) => k.key === y) && (d.current = [...d.current, { key: y, vnode: N }], g = !0);
    }
  const w = d.current.filter((y) => !x.has(y.key));
  w.length !== d.current.length && (d.current = w, g = !0), u.current = h, g && p(d.current);
  const _ = (y) => {
    d.current = d.current.filter((N) => N.key !== y), p(d.current);
  };
  Se(() => {
    const y = a.current;
    if (!y) return;
    const N = l.current, k = Id(r), O = Array.from(y.children);
    for (const E of O) {
      const P = E.dataset.flipKey;
      if (!P) continue;
      if (E.dataset.leaving === "true") {
        Object.assign(E.style, k.leaveFrom), E.style.transition = "none", requestAnimationFrame(() => {
          E.style.transition = nn(
            Object.keys(k.leaveTo),
            k.duration,
            k.easing
          ), Object.assign(E.style, k.leaveTo);
          const R = (A) => {
            A.target === E && (E.removeEventListener("transitionend", R), _(P));
          };
          E.addEventListener("transitionend", R), setTimeout(() => {
            d.current.some((A) => A.key === P) && _(P);
          }, k.duration + 50);
        });
        continue;
      }
      const H = N.get(P);
      if (!H || !m.has(P)) {
        Object.assign(E.style, k.enterFrom), E.style.transition = "none", requestAnimationFrame(() => {
          E.style.transition = nn(
            Object.keys(k.enterFrom),
            k.duration,
            k.easing
          ), Object.assign(E.style, k.enterTo);
          const R = (A) => {
            A.target === E && (E.removeEventListener("transitionend", R), E.style.transition = "");
          };
          E.addEventListener("transitionend", R), setTimeout(() => {
            E.style.transition = "";
          }, k.duration + 50);
        });
        continue;
      }
      const $ = E.getBoundingClientRect(), B = H.x - $.x, D = H.y - $.y;
      Math.abs(B) < 0.5 && Math.abs(D) < 0.5 || (E.style.transform = `translate(${B}px, ${D}px)`, E.style.transition = "none", requestAnimationFrame(() => {
        E.style.transition = nn(
          ["transform"],
          k.duration,
          k.easing
        ), E.style.transform = "";
        const R = (A) => {
          A.target === E && (E.removeEventListener("transitionend", R), E.style.transition = "");
        };
        E.addEventListener("transitionend", R), setTimeout(() => {
          E.style.transition = "";
        }, k.duration + 50);
      }));
    }
    c.current = x;
  });
  const S = o.map((y) => {
    const N = y.props?.key, k = N != null ? String(N) : void 0;
    return C("div", {
      key: k,
      "data-flip-key": k
    }, le(y));
  });
  for (const y of f)
    S.push(C("div", {
      key: y.key,
      "data-flip-key": y.key,
      "data-leaving": "true",
      style: { pointerEvents: "none" }
    }, y.vnode));
  return C("div", {
    ref: a,
    className: i || void 0,
    style: s,
    "data-transition-group": r
  }, ...S);
}
const Zb = {
  button: Fp,
  "vo-checkbox": Gp,
  "vo-switch": eh,
  "vo-slider": yh,
  select: Av,
  "vo-dialog": Fv,
  "vo-drawer": Mv,
  "vo-tooltip": qv,
  "vo-popover": fg,
  "vo-dropdown-menu": E1,
  "vo-context-menu": ob,
  "vo-hover-card": mb,
  "vo-collapsible": wb,
  "vo-tabs": Ab,
  "vo-accordion": Vb,
  "vo-combobox": Ub,
  "vo-radio": jb,
  "vo-breadcrumb": zb,
  "vo-pagination": Kb,
  "vo-steps": Gb,
  "vo-virtual-list": Yb,
  "vo-transition": Jb,
  "vo-transition-group": qb
}, Xs = /* @__PURE__ */ new Map(), Ld = /* @__PURE__ */ new Map(), so = /* @__PURE__ */ new Set(), Yt = /* @__PURE__ */ new Map(), Xt = /* @__PURE__ */ new Map(), Jt = /* @__PURE__ */ new Map();
function Vn(e) {
  const t = globalThis.__voguiStudioLog;
  t?.(e);
}
function jw(e, t) {
  Ld.set(e, t), Vn(`[vogui] widgetRegistry.set type=${e}`);
}
function zw() {
  for (const e of so)
    e.destroy?.();
  so.clear();
}
const $d = pt(null);
function Qb(e) {
  for (const o of Array.from(e.children))
    if (o instanceof HTMLElement && o.dataset.voguiOverlayRoot === "true")
      return o;
  const t = window.getComputedStyle(e).position;
  (!t || t === "static") && (e.style.position = "relative");
  const n = document.createElement("div");
  return n.dataset.voguiOverlayRoot = "true", n.style.position = "absolute", n.style.inset = "0", n.style.zIndex = "200", n.style.pointerEvents = "none", n.style.overflow = "visible", e.appendChild(n), n;
}
function ew(e, t) {
  for (const o of Array.from(e.children))
    if (o instanceof HTMLElement && o.dataset.voguiPortalName === t)
      return o;
  const n = document.createElement("div");
  return n.dataset.voguiPortalName = t, n.style.position = "absolute", n.style.inset = "0", n.style.pointerEvents = "none", n.style.overflow = "visible", t === "toast" && (n.style.display = "flex", n.style.alignItems = "flex-start", n.style.justifyContent = "flex-end", n.style.padding = "12px"), e.appendChild(n), n;
}
function Ye() {
  return tt($d);
}
function Kw(e, t, n) {
  if (!t?.tree) {
    ft(null, e);
    return;
  }
  hf(t.gen, t.handlers, n), Pf(e, t.theme), t.styles && Mf(t.styles);
  const o = e.parentElement instanceof HTMLElement ? e.parentElement : e, r = Qb(o);
  ft(
    C(
      $d.Provider,
      { value: r },
      C(tw, { tree: t.tree, canvas: t.canvas, refActions: t.refActions })
    ),
    e
  );
}
function tw({ tree: e, canvas: t, refActions: n }) {
  const o = M(null);
  return W(() => {
    if (t && o.current)
      for (const r of t)
        Sp(r, on);
  }, [t]), Se(() => {
    if (n && o.current)
      for (const r of n)
        Af(r);
  }, [n]), C("div", { ref: o, style: { display: "contents" } }, le(e));
}
function le(e) {
  if (!e || !e.type) return null;
  const { type: t, props: n = {}, children: o = [] } = e;
  if (t === "#text")
    return n.text != null ? String(n.text) : null;
  if (t === "Fragment")
    return C("div", { style: { display: "contents" } }, dt(o));
  if (t === "__comp__") {
    const i = n._cid, s = o[0] ? le(o[0]) : null;
    return Xs.set(i, s), Js(i, n, s);
  }
  if (t === "__cached__") {
    const i = n._cid, s = Xs.get(i) ?? null;
    return Js(i, n, s);
  }
  if (t === "vo-unsafe-html") {
    const i = n.html || "";
    return C("div", {
      dangerouslySetInnerHTML: { __html: i },
      ...Nn(n)
    });
  }
  if (t === "vo-portal")
    return C(nw, {
      portalName: n.portalName,
      portalChildren: o
    });
  if (t === "Canvas")
    return iw(n);
  if (t === "vo-host-widget")
    return sw(n, o);
  const r = Zb[t];
  if (r) {
    const i = {
      ...n,
      voChildren: o
    };
    if (typeof n.onClick == "number") {
      const s = ei(n);
      typeof s.onClick == "function" && (i.onClick = s.onClick);
    }
    return C(r, {
      ...i
    });
  }
  return ow(t, n, o);
}
function dt(e) {
  return e.map(le);
}
function nw({ portalName: e, portalChildren: t }) {
  const n = Ye();
  if (!n)
    return C("div", { style: { display: "contents" } }, dt(t));
  const o = ew(n, e || "default");
  return bt(
    C("div", { style: { display: "contents" } }, dt(t)),
    o
  );
}
function Js(e, t, n) {
  const o = Nn(t), r = se(t) ?? {}, i = ei(t), s = t.class || void 0, a = Object.keys(r).length > 0, l = Object.keys(i).length > 0, c = !!s, u = {
    ...o,
    "data-vcid": e
  };
  return !a && !l && !c ? C("div", { ...u, style: { display: "contents" } }, n) : C("div", {
    ...u,
    ...i,
    className: s,
    style: a ? r : void 0
  }, n);
}
function ow(e, t, n) {
  const o = Cf(e), r = _f(e), i = Sf(e, t.variant, t.size), s = t.class || "", a = t.ref, l = t.onResize, c = l != null ? a ? `ref:${a}` : `resize:${l}` : null, u = t.onIntersect, d = u != null ? a ? `iref:${a}` : `intersect:${u}` : null, f = t.active ? rw(e) : "", p = t.disabled && o !== "input" && o !== "textarea" && o !== "select" ? "opacity-50 pointer-events-none" : "", x = [r, i, f, p, s].filter(Boolean).join(" ") || void 0, h = se(t), m = ei(t), v = Nn(t), g = e === "vo-grid" && t.cols ? { ...h, gridTemplateColumns: `repeat(${t.cols}, 1fr)` } : h, w = {
    ...v,
    ...m,
    className: x,
    style: g
  };
  if (t.disabled && o !== "input" && o !== "textarea" && o !== "select" && (w["aria-disabled"] = "true"), t.textContent != null && n.length === 0) {
    const k = qs(t, e);
    return k ? C(o, w, k, String(t.textContent)) : C(o, w, String(t.textContent));
  }
  if (o === "input" && lw(w, t), o === "textarea" && uw(w, t), o === "a" && t.href && (w.href = t.href), o === "img" && (t.src && (w.src = t.src), t.alt && (w.alt = t.alt)), o === "video" && t.src && (w.src = t.src), o === "form" && t.onSubmit != null && (w.onSubmit = (k) => {
    k.preventDefault(), J(t.onSubmit, "{}");
  }), l != null || u != null) {
    const k = a ? pn(a) : void 0;
    w.ref = (O) => {
      if (k && k(O), c)
        if (O) {
          const E = Xt.get(c);
          if (!E || E.element !== O || E.resizeId !== l) {
            E && (E.observer.disconnect(), Xt.delete(c));
            let P;
            const L = new ResizeObserver((H) => {
              for (const $ of H) {
                const B = Math.round($.contentRect.width), D = Math.round($.contentRect.height);
                B === P.lastWidth && D === P.lastHeight || (P.lastWidth = B, P.lastHeight = D, J(P.resizeId, JSON.stringify({ Width: B, Height: D })));
              }
            });
            P = { element: O, observer: L, resizeId: l, lastWidth: -1, lastHeight: -1 }, L.observe(O), Xt.set(c, P);
          }
        } else {
          const E = Xt.get(c);
          E && (E.observer.disconnect(), Xt.delete(c));
        }
      if (d)
        if (O) {
          const E = Jt.get(d);
          if (!E || E.element !== O || E.intersectId !== u) {
            E && (E.observer.disconnect(), Jt.delete(d));
            const P = u, L = new IntersectionObserver((H) => {
              for (const $ of H)
                J(P, JSON.stringify({
                  IsIntersecting: $.isIntersecting,
                  IntersectionRatio: $.intersectionRatio
                }));
            });
            L.observe(O), Jt.set(d, { element: O, observer: L, intersectId: P });
          }
        } else {
          const E = Jt.get(d);
          E && (E.observer.disconnect(), Jt.delete(d));
        }
    };
  }
  const _ = e === "vo-form-field" && t.label ? [C("label", { className: "text-sm font-medium text-foreground" }, t.label), ...dt(n)] : dt(n);
  let y = (e === "vo-form-section" && t.title ? [C("h3", { className: "text-lg font-semibold" }, t.title), ...dt(n)] : null) || _;
  const N = qs(t, e);
  return N && Array.isArray(y) && (y = [N, ...y]), e === "vo-progress" ? cw(w, t) : e === "vo-avatar" && t.src ? C(
    o,
    w,
    C("img", { src: t.src, className: "aspect-square h-full w-full object-cover" })
  ) : C(o, w, ...y);
}
function rw(e) {
  switch (e) {
    case "vo-nav-item":
    case "vo-sidebar-item":
      return "bg-accent text-accent-foreground font-medium";
    default:
      return "active";
  }
}
function qs(e, t) {
  return t === "vo-icon" && e.name ? C("span", { className: "vo-icon", "data-icon": e.name }) : e.icon && t !== "vo-icon" ? C("span", { className: "vo-icon mr-1.5 inline-flex items-center", "data-icon": e.icon }) : null;
}
function iw(e) {
  const t = e.ref, n = e.width || 300, o = e.height || 150, r = Nn(e), i = e.fullscreen, s = e.onPointer, a = e.onResize, l = a != null ? t ? `ref:${t}` : `resize:${a}` : null, c = {};
  i && (c.width = "100%", c.height = "100%");
  const u = {};
  if (s != null) {
    const f = (p, x) => {
      const h = x.currentTarget.getBoundingClientRect();
      J(s, JSON.stringify({
        Kind: p,
        X: x.clientX - h.left,
        Y: x.clientY - h.top,
        Button: x.button,
        Buttons: x.buttons
      }));
    };
    u.onPointerDown = (p) => f("down", p), u.onPointerUp = (p) => f("up", p), u.onPointerMove = (p) => f("move", p), u.onPointerEnter = (p) => f("enter", p), u.onPointerLeave = (p) => f("leave", p);
  }
  const d = (f) => {
    if (t && pn(t)(f), !l)
      return;
    if (!f) {
      const m = Yt.get(l);
      m && (m.observer.disconnect(), Yt.delete(l));
      return;
    }
    const p = Yt.get(l);
    if (p && p.element === f && p.resizeId === a)
      return;
    p && (p.observer.disconnect(), Yt.delete(l));
    let x;
    const h = new ResizeObserver((m) => {
      for (const v of m) {
        const g = Math.round(v.contentRect.width), w = Math.round(v.contentRect.height);
        g === x.lastWidth && w === x.lastHeight || (x.lastWidth = g, x.lastHeight = w, J(x.resizeId, JSON.stringify({
          Width: g,
          Height: w
        })));
      }
    });
    x = {
      element: f,
      observer: h,
      resizeId: a,
      lastWidth: -1,
      lastHeight: -1
    }, h.observe(f), Yt.set(l, x);
  };
  return C("canvas", {
    ...r,
    ...u,
    width: n,
    height: o,
    style: Object.keys(c).length > 0 ? c : void 0,
    ref: d
  });
}
function sw(e, t) {
  const n = t.length > 0 ? dt(t) : void 0;
  return C(aw, { props: e, voChildren: n });
}
function aw({ props: e, voChildren: t }) {
  const n = e.widgetType, o = Nn(e), r = se(e), i = M(null), s = M(null), a = M(e);
  return a.current = e, W(() => {
    const l = s.current;
    l && l.update?.(e);
  }, [e]), W(() => {
    const l = i.current;
    if (!l) return;
    const c = Ld.get(n);
    if (Vn(`[vogui] hostWidget effect type=${n} hasFactory=${c ? "yes" : "no"}`), !c) return;
    const u = (f) => {
      const p = a.current;
      p.onWidget != null && J(p.onWidget, f);
    };
    Vn(`[vogui] hostWidget create type=${n}`);
    const d = c.create(l, a.current, u);
    return s.current = d, so.add(d), () => {
      Vn(`[vogui] hostWidget destroy type=${n}`), so.delete(d), s.current === d && (s.current = null), d.destroy?.();
    };
  }, [n]), C("div", {
    ...o,
    className: "vo-host-widget",
    style: r,
    "data-widget-type": n,
    ref: (l) => {
      i.current = l, e.ref && pn(e.ref)(l);
    }
  }, t);
}
function cw(e, t) {
  const n = t.value || 0, o = t.max || 100, r = Math.round(n / o * 100);
  return C(
    "div",
    {
      ...e,
      className: [e.className, "relative h-2 w-full overflow-hidden rounded-full bg-muted"].filter(Boolean).join(" ")
    },
    C("div", {
      className: "h-full bg-primary transition-all",
      style: { width: `${r}%` }
    })
  );
}
function lw(e, t) {
  t.type && (e.type = t.type), t.value != null && (e.value = String(t.value)), t.placeholder && (e.placeholder = t.placeholder), t.disabled && (e.disabled = !0), t.readOnly && (e.readOnly = !0), e.className = [
    e.className,
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
    "transition-colors placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ].filter(Boolean).join(" ");
}
function uw(e, t) {
  t.value != null && (e.value = String(t.value)), t.placeholder && (e.placeholder = t.placeholder), t.rows && (e.rows = Number(t.rows)), t.disabled && (e.disabled = !0), e.className = [
    e.className,
    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ].filter(Boolean).join(" ");
}
function Nn(e) {
  const t = {};
  if (e.ref && (t.ref = pn(e.ref)), e.key && (t.key = e.key, t["data-key"] = e.key), e.variant && (t["data-variant"] = e.variant), e.transition && (t["data-transition"] = e.transition), e.attrs && typeof e.attrs == "object") {
    const n = e.attrs;
    for (const [o, r] of Object.entries(n))
      typeof r == "boolean" ? r && (t[o] = "") : t[o] = String(r);
  }
  return t;
}
const dw = new TextDecoder("utf-8");
function fw(e) {
  switch (e) {
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
      return e;
    default:
      throw new Error(`unsupported ref action command: ${e}`);
  }
}
class pw {
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
    return this.pos += t, dw.decode(n);
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
        const n = this.u16(), o = {};
        for (let r = 0; r < n; r++) {
          const i = this.str();
          o[i] = this.value();
        }
        return o;
      }
      case 6: {
        const n = this.u32(), o = new Array(n);
        for (let r = 0; r < n; r++) o[r] = this.value();
        return o;
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
      const a = this.u16(), l = [];
      for (let c = 0; c < a; c++) {
        const u = this.node();
        u && l.push(u);
      }
      return { type: "Fragment", props: {}, children: l };
    }
    if (t === 4) {
      const a = this.u32(), l = this.u16(), c = { _cid: a };
      for (let d = 0; d < l; d++) {
        const f = this.str();
        c[f] = this.value();
      }
      const u = this.node();
      return { type: "__comp__", props: c, children: u ? [u] : [] };
    }
    if (t === 5) {
      const a = this.u32(), l = this.u16(), c = { _cid: a };
      for (let u = 0; u < l; u++) {
        const d = this.str();
        c[d] = this.value();
      }
      return { type: "__cached__", props: c, children: [] };
    }
    const n = this.str(), o = this.u16(), r = {};
    for (let a = 0; a < o; a++) {
      const l = this.str();
      r[l] = this.value();
    }
    const i = this.u32(), s = [];
    for (let a = 0; a < i; a++) {
      const l = this.node();
      l && s.push(l);
    }
    return { type: n, props: r, children: s };
  }
  handler() {
    const t = this.u16(), n = this.u16(), o = this.u8(), r = this.i32(), i = this.u8(), s = [];
    for (let l = 0; l < i; l++) s.push(this.str());
    const a = this.str();
    return {
      iD: t,
      gen: n,
      type: o,
      intVal: r,
      modifiers: s.length > 0 ? s : void 0,
      keyFilter: a || void 0
    };
  }
}
function hw(e) {
  const t = new pw(e), n = t.u32(), o = t.u8(), r = t.node(), i = t.u16(), s = new Array(i);
  for (let d = 0; d < i; d++)
    s[d] = t.handler();
  let a;
  if (o & 1) {
    const d = t.u16();
    a = new Array(d);
    for (let f = 0; f < d; f++) a[f] = t.str();
  }
  let l;
  if (o & 2) {
    const d = t.u16();
    l = new Array(d);
    for (let f = 0; f < d; f++) {
      const p = t.str(), x = t.u32(), h = new Array(x);
      for (let m = 0; m < x; m++) {
        const v = t.str(), g = t.u8();
        if (g > 0) {
          const w = new Array(g);
          for (let _ = 0; _ < g; _++) w[_] = t.value();
          h[m] = { c: v, a: w };
        } else
          h[m] = { c: v };
      }
      l[f] = { ref: p, cmds: h };
    }
  }
  let c;
  if (o & 4) {
    const d = t.u16();
    c = {};
    for (let f = 0; f < d; f++) {
      const p = t.str(), x = t.str();
      c[p] = x;
    }
  }
  let u;
  if (o & 8) {
    const d = t.u16();
    u = new Array(d);
    for (let f = 0; f < d; f++) {
      const p = t.str(), x = fw(t.str()), m = t.u8() !== 0 ? t.i32() : void 0, g = t.u8() !== 0 ? t.i32() : void 0, w = { ref: p, cmd: x };
      m !== void 0 && (w.top = m), g !== void 0 && (w.measureId = g), u[f] = w;
    }
  }
  return { type: "render", gen: n, tree: r, handlers: s, styles: a, canvas: l, theme: c, refActions: u };
}
function xw(e) {
  return Wi(e.tree);
}
function Gw(e) {
  return xw(hw(e));
}
function Wi(e) {
  if (!e)
    return null;
  if (e.type === "vo-host-widget") {
    const o = e.props?.onWidget;
    if (typeof o == "number")
      return o;
  }
  const t = e.props ?? {};
  for (const o of Object.values(t)) {
    const r = Lr(o);
    if (r !== null)
      return r;
  }
  const n = e.children ?? [];
  for (const o of n) {
    const r = Wi(o);
    if (r !== null)
      return r;
  }
  return null;
}
function Lr(e) {
  if (Array.isArray(e)) {
    for (const t of e) {
      const n = Lr(t);
      if (n !== null)
        return n;
    }
    return null;
  }
  if (!e || typeof e != "object")
    return null;
  if (mw(e))
    return Wi(e);
  for (const t of Object.values(e)) {
    const n = Lr(t);
    if (n !== null)
      return n;
  }
  return null;
}
function mw(e) {
  return "type" in e && typeof e.type == "string" && ("props" in e || "children" in e);
}
let qt = null;
const Ct = /* @__PURE__ */ new Map(), ln = /* @__PURE__ */ new Map();
let vw = 1, gw = 1, En = 1, $r = 1, Be = null, Ze = null, Wd = 0, Hd = 1, Lt = !1, Hi = 0, jo = 0;
function st() {
  return qt || (qt = new AudioContext()), qt.state === "suspended" && qt.resume(), qt;
}
function bw(e, t) {
  if (e.buffer || e.decoding) return;
  e.decoding = !0;
  const n = st(), o = e.raw.slice(0);
  n.decodeAudioData(o).then((r) => {
    e.buffer = r, e.decoding = !1;
  }).catch((r) => {
    console.warn(`voAudio: decode failed for clip ${t}:`, r), e.decoding = !1;
  });
}
function ww(e) {
  const t = vw++, n = new ArrayBuffer(e.byteLength);
  new Uint8Array(n).set(e);
  const o = { raw: n, buffer: null, decoding: !1 };
  return Ct.set(t, o), bw(o, t), t;
}
function yw(e) {
  Ct.delete(e);
}
function Cw(e, t, n) {
  const o = Ct.get(e);
  if (!o || !o.buffer) return;
  const r = st(), i = r.createBufferSource();
  i.buffer = o.buffer, i.playbackRate.value = n;
  const s = r.createGain();
  s.gain.value = t * En, i.connect(s).connect(r.destination), i.start();
}
function _w(e, t) {
  Vd();
  const n = Ct.get(e);
  if (!n || !n.buffer) return;
  const o = st(), r = o.createBufferSource();
  r.buffer = n.buffer, r.loop = !0;
  const i = o.createGain();
  i.gain.value = t * $r, r.connect(i).connect(o.destination), r.start(), Be = r, Ze = i, Wd = e, Hd = t, Lt = !1, Hi = o.currentTime, jo = 0;
}
function Vd() {
  if (Be) {
    try {
      Be.stop();
    } catch {
    }
    Be.disconnect(), Be = null;
  }
  Ze && (Ze.disconnect(), Ze = null), Lt = !1, jo = 0;
}
function Sw() {
  if (!Be || Lt) return;
  const e = st();
  jo += e.currentTime - Hi;
  try {
    Be.stop();
  } catch {
  }
  Be.disconnect(), Be = null, Lt = !0;
}
function Nw() {
  if (!Lt || !Ze) return;
  const e = Ct.get(Wd);
  if (!e || !e.buffer) return;
  const t = st(), n = t.createBufferSource();
  n.buffer = e.buffer, n.loop = !0, n.connect(Ze).connect(t.destination), n.start(0, jo % e.buffer.duration), Be = n, Hi = t.currentTime, Lt = !1;
}
function Ew(e) {
  En = Math.max(0, Math.min(1, e));
}
function Aw(e) {
  $r = Math.max(0, Math.min(1, e)), Ze && (Ze.gain.value = Hd * $r);
}
function Fw(e, t, n, o, r, i, s, a, l) {
  const u = st().listener;
  u.positionX ? (u.positionX.value = e, u.positionY.value = t, u.positionZ.value = n, u.forwardX.value = o, u.forwardY.value = r, u.forwardZ.value = i, u.upX.value = s, u.upY.value = a, u.upZ.value = l) : (u.setPosition(e, t, n), u.setOrientation(o, r, i, s, a, l));
}
function Mw(e, t, n, o, r, i, s) {
  const a = Ct.get(e);
  if (!a || !a.buffer) return;
  const l = st(), c = l.createBufferSource();
  c.buffer = a.buffer;
  const u = l.createPanner();
  u.panningModel = "HRTF", u.distanceModel = "inverse", u.refDistance = i, u.maxDistance = s, u.rolloffFactor = 1, u.positionX.value = t, u.positionY.value = n, u.positionZ.value = o;
  const d = l.createGain();
  d.gain.value = r * En, c.connect(u).connect(d).connect(l.destination), c.start();
}
function kw(e, t, n, o, r, i, s) {
  const a = Ct.get(e);
  if (!a || !a.buffer) return -1;
  const l = st(), c = l.createBufferSource();
  c.buffer = a.buffer, c.loop = !0;
  const u = l.createPanner();
  u.panningModel = "HRTF", u.distanceModel = "inverse", u.refDistance = i, u.maxDistance = s, u.rolloffFactor = 1, u.positionX.value = t, u.positionY.value = n, u.positionZ.value = o;
  const d = l.createGain();
  d.gain.value = r * En, c.connect(u).connect(d).connect(l.destination), c.start();
  const f = gw++;
  return ln.set(f, {
    sourceNode: c,
    gainNode: d,
    pannerNode: u,
    clipId: e,
    volume: r,
    refDistance: i,
    maxDistance: s
  }), f;
}
function Pw() {
}
function Dw(e, t, n, o) {
  const r = ln.get(e);
  r && (r.pannerNode.positionX.value = t, r.pannerNode.positionY.value = n, r.pannerNode.positionZ.value = o);
}
function Ow(e, t, n) {
  const o = ln.get(e);
  o && (o.volume = Math.max(0, t), o.gainNode.gain.value = o.volume * En, o.sourceNode && (o.sourceNode.playbackRate.value = Math.max(0.01, n)));
}
function Tw(e) {
  const t = ln.get(e);
  if (t) {
    if (t.sourceNode) {
      try {
        t.sourceNode.stop();
      } catch {
      }
      t.sourceNode.disconnect();
    }
    t.gainNode.disconnect(), t.pannerNode.disconnect(), ln.delete(e);
  }
}
function Yw() {
  const e = window;
  e.voAudioLoad = ww, e.voAudioFree = yw, e.voAudioPlaySound = Cw, e.voAudioPlayMusic = _w, e.voAudioStopMusic = Vd, e.voAudioPauseMusic = Sw, e.voAudioResumeMusic = Nw, e.voAudioSetSFXVolume = Ew, e.voAudioSetMusicVolume = Aw, e.voAudioSetListener = Fw, e.voAudioPlaySound3D = Mw, e.voAudioCreateSource3D = kw, e.voAudioUpdateSpatial = Pw, e.voAudioSetSource3DPos = Dw, e.voAudioSetSource3DParams = Ow, e.voAudioRemoveSource3D = Tw;
}
export {
  Pf as applyTheme,
  hw as decodeBinaryRender,
  zw as destroyWidgets,
  J as emit,
  Sp as executeCanvasBatch,
  Af as executeRefAction,
  _p as fillTextWrap,
  xw as findHostWidgetHandlerId,
  Gw as findHostWidgetHandlerIdInBytes,
  Bw as getRef,
  Mf as injectDynamicStyles,
  Iw as injectStyles,
  Yw as installAudioBridge,
  Ww as isDarkMode,
  Hw as measureText,
  Vw as measureTextLines,
  jw as registerWidget,
  Kw as render,
  $w as setDarkMode,
  hf as setRenderContext,
  Rw as setupKeyHandler,
  Lw as toggleDarkMode,
  le as voNodeToVNode
};
