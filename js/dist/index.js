var un, Y, Bs, it, Fi, $s, Ws, Hs, Fr, cr, lr, Vs, jn = {}, zn = [], Pd = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, dn = Array.isArray;
function Oe(e, t) {
  for (var n in t) e[n] = t[n];
  return e;
}
function Br(e) {
  e && e.parentNode && e.parentNode.removeChild(e);
}
function _(e, t, n) {
  var o, r, i, s = {};
  for (i in t) i == "key" ? o = t[i] : i == "ref" ? r = t[i] : s[i] = t[i];
  if (arguments.length > 2 && (s.children = arguments.length > 3 ? un.call(arguments, 2) : n), typeof e == "function" && e.defaultProps != null) for (i in e.defaultProps) s[i] === void 0 && (s[i] = e.defaultProps[i]);
  return tn(e, s, o, r, null);
}
function tn(e, t, n, o, r) {
  var i = { type: e, props: t, key: n, ref: o, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: r ?? ++Bs, __i: -1, __u: 0 };
  return r == null && Y.vnode != null && Y.vnode(i), i;
}
function Us() {
  return { current: null };
}
function le(e) {
  return e.children;
}
function ke(e, t) {
  this.props = e, this.context = t;
}
function Tt(e, t) {
  if (t == null) return e.__ ? Tt(e.__, e.__i + 1) : null;
  for (var n; t < e.__k.length; t++) if ((n = e.__k[t]) != null && n.__e != null) return n.__e;
  return typeof e.type == "function" ? Tt(e) : null;
}
function Ed(e) {
  if (e.__P && e.__d) {
    var t = e.__v, n = t.__e, o = [], r = [], i = Oe({}, t);
    i.__v = t.__v + 1, Y.vnode && Y.vnode(i), $r(e.__P, i, t, e.__n, e.__P.namespaceURI, 32 & t.__u ? [n] : null, o, n ?? Tt(t), !!(32 & t.__u), r), i.__v = t.__v, i.__.__k[i.__i] = i, Gs(o, i, r), t.__e = t.__ = null, i.__e != n && js(i);
  }
}
function js(e) {
  if ((e = e.__) != null && e.__c != null) return e.__e = e.__c.base = null, e.__k.some(function(t) {
    if (t != null && t.__e != null) return e.__e = e.__c.base = t.__e;
  }), js(e);
}
function ur(e) {
  (!e.__d && (e.__d = !0) && it.push(e) && !Kn.__r++ || Fi != Y.debounceRendering) && ((Fi = Y.debounceRendering) || $s)(Kn);
}
function Kn() {
  for (var e, t = 1; it.length; ) it.length > t && it.sort(Ws), e = it.shift(), t = it.length, Ed(e);
  Kn.__r = 0;
}
function zs(e, t, n, o, r, i, s, a, l, c, u) {
  var d, f, p, m, h, v, g, w = o && o.__k || zn, y = t.length;
  for (l = Td(n, t, w, l, y), d = 0; d < y; d++) (p = n.__k[d]) != null && (f = p.__i != -1 && w[p.__i] || jn, p.__i = d, v = $r(e, p, f, r, i, s, a, l, c, u), m = p.__e, p.ref && f.ref != p.ref && (f.ref && Wr(f.ref, null, p), u.push(p.ref, p.__c || m, p)), h == null && m != null && (h = m), (g = !!(4 & p.__u)) || f.__k === p.__k ? l = Ks(p, l, e, g) : typeof p.type == "function" && v !== void 0 ? l = v : m && (l = m.nextSibling), p.__u &= -7);
  return n.__e = h, l;
}
function Td(e, t, n, o, r) {
  var i, s, a, l, c, u = n.length, d = u, f = 0;
  for (e.__k = new Array(r), i = 0; i < r; i++) (s = t[i]) != null && typeof s != "boolean" && typeof s != "function" ? (typeof s == "string" || typeof s == "number" || typeof s == "bigint" || s.constructor == String ? s = e.__k[i] = tn(null, s, null, null, null) : dn(s) ? s = e.__k[i] = tn(le, { children: s }, null, null, null) : s.constructor === void 0 && s.__b > 0 ? s = e.__k[i] = tn(s.type, s.props, s.key, s.ref ? s.ref : null, s.__v) : e.__k[i] = s, l = i + f, s.__ = e, s.__b = e.__b + 1, a = null, (c = s.__i = Ld(s, n, l, d)) != -1 && (d--, (a = n[c]) && (a.__u |= 2)), a == null || a.__v == null ? (c == -1 && (r > u ? f-- : r < u && f++), typeof s.type != "function" && (s.__u |= 4)) : c != l && (c == l - 1 ? f-- : c == l + 1 ? f++ : (c > l ? f-- : f++, s.__u |= 4))) : e.__k[i] = null;
  if (d) for (i = 0; i < u; i++) (a = n[i]) != null && !(2 & a.__u) && (a.__e == o && (o = Tt(a)), Xs(a, a));
  return o;
}
function Ks(e, t, n, o) {
  var r, i;
  if (typeof e.type == "function") {
    for (r = e.__k, i = 0; r && i < r.length; i++) r[i] && (r[i].__ = e, t = Ks(r[i], t, n, o));
    return t;
  }
  e.__e != t && (o && (t && e.type && !t.parentNode && (t = Tt(e)), n.insertBefore(e.__e, t || null)), t = e.__e);
  do
    t = t && t.nextSibling;
  while (t != null && t.nodeType == 8);
  return t;
}
function He(e, t) {
  return t = t || [], e == null || typeof e == "boolean" || (dn(e) ? e.some(function(n) {
    He(n, t);
  }) : t.push(e)), t;
}
function Ld(e, t, n, o) {
  var r, i, s, a = e.key, l = e.type, c = t[n], u = c != null && (2 & c.__u) == 0;
  if (c === null && a == null || u && a == c.key && l == c.type) return n;
  if (o > (u ? 1 : 0)) {
    for (r = n - 1, i = n + 1; r >= 0 || i < t.length; ) if ((c = t[s = r >= 0 ? r-- : i++]) != null && !(2 & c.__u) && a == c.key && l == c.type) return s;
  }
  return -1;
}
function Bi(e, t, n) {
  t[0] == "-" ? e.setProperty(t, n ?? "") : e[t] = n == null ? "" : typeof n != "number" || Pd.test(t) ? n : n + "px";
}
function Pn(e, t, n, o, r) {
  var i, s;
  e: if (t == "style") if (typeof n == "string") e.style.cssText = n;
  else {
    if (typeof o == "string" && (e.style.cssText = o = ""), o) for (t in o) n && t in n || Bi(e.style, t, "");
    if (n) for (t in n) o && n[t] == o[t] || Bi(e.style, t, n[t]);
  }
  else if (t[0] == "o" && t[1] == "n") i = t != (t = t.replace(Hs, "$1")), s = t.toLowerCase(), t = s in e || t == "onFocusOut" || t == "onFocusIn" ? s.slice(2) : t.slice(2), e.l || (e.l = {}), e.l[t + i] = n, n ? o ? n.u = o.u : (n.u = Fr, e.addEventListener(t, i ? lr : cr, i)) : e.removeEventListener(t, i ? lr : cr, i);
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
function $i(e) {
  return function(t) {
    if (this.l) {
      var n = this.l[t.type + e];
      if (t.t == null) t.t = Fr++;
      else if (t.t < n.u) return;
      return n(Y.event ? Y.event(t) : t);
    }
  };
}
function $r(e, t, n, o, r, i, s, a, l, c) {
  var u, d, f, p, m, h, v, g, w, y, x, k, A, S, M, L = t.type;
  if (t.constructor !== void 0) return null;
  128 & n.__u && (l = !!(32 & n.__u), i = [a = t.__e = n.__e]), (u = Y.__b) && u(t);
  e: if (typeof L == "function") try {
    if (g = t.props, w = "prototype" in L && L.prototype.render, y = (u = L.contextType) && o[u.__c], x = u ? y ? y.props.value : u.__ : o, n.__c ? v = (d = t.__c = n.__c).__ = d.__E : (w ? t.__c = d = new L(g, x) : (t.__c = d = new ke(g, x), d.constructor = L, d.render = Rd), y && y.sub(d), d.state || (d.state = {}), d.__n = o, f = d.__d = !0, d.__h = [], d._sb = []), w && d.__s == null && (d.__s = d.state), w && L.getDerivedStateFromProps != null && (d.__s == d.state && (d.__s = Oe({}, d.__s)), Oe(d.__s, L.getDerivedStateFromProps(g, d.__s))), p = d.props, m = d.state, d.__v = t, f) w && L.getDerivedStateFromProps == null && d.componentWillMount != null && d.componentWillMount(), w && d.componentDidMount != null && d.__h.push(d.componentDidMount);
    else {
      if (w && L.getDerivedStateFromProps == null && g !== p && d.componentWillReceiveProps != null && d.componentWillReceiveProps(g, x), t.__v == n.__v || !d.__e && d.shouldComponentUpdate != null && d.shouldComponentUpdate(g, d.__s, x) === !1) {
        t.__v != n.__v && (d.props = g, d.state = d.__s, d.__d = !1), t.__e = n.__e, t.__k = n.__k, t.__k.some(function(E) {
          E && (E.__ = t);
        }), zn.push.apply(d.__h, d._sb), d._sb = [], d.__h.length && s.push(d);
        break e;
      }
      d.componentWillUpdate != null && d.componentWillUpdate(g, d.__s, x), w && d.componentDidUpdate != null && d.__h.push(function() {
        d.componentDidUpdate(p, m, h);
      });
    }
    if (d.context = x, d.props = g, d.__P = e, d.__e = !1, k = Y.__r, A = 0, w) d.state = d.__s, d.__d = !1, k && k(t), u = d.render(d.props, d.state, d.context), zn.push.apply(d.__h, d._sb), d._sb = [];
    else do
      d.__d = !1, k && k(t), u = d.render(d.props, d.state, d.context), d.state = d.__s;
    while (d.__d && ++A < 25);
    d.state = d.__s, d.getChildContext != null && (o = Oe(Oe({}, o), d.getChildContext())), w && !f && d.getSnapshotBeforeUpdate != null && (h = d.getSnapshotBeforeUpdate(p, m)), S = u != null && u.type === le && u.key == null ? Ys(u.props.children) : u, a = zs(e, dn(S) ? S : [S], t, n, o, r, i, s, a, l, c), d.base = t.__e, t.__u &= -161, d.__h.length && s.push(d), v && (d.__E = d.__ = null);
  } catch (E) {
    if (t.__v = null, l || i != null) if (E.then) {
      for (t.__u |= l ? 160 : 128; a && a.nodeType == 8 && a.nextSibling; ) a = a.nextSibling;
      i[i.indexOf(a)] = null, t.__e = a;
    } else {
      for (M = i.length; M--; ) Br(i[M]);
      dr(t);
    }
    else t.__e = n.__e, t.__k = n.__k, E.then || dr(t);
    Y.__e(E, t, n);
  }
  else i == null && t.__v == n.__v ? (t.__k = n.__k, t.__e = n.__e) : a = t.__e = Md(n.__e, t, n, o, r, i, s, l, c);
  return (u = Y.diffed) && u(t), 128 & t.__u ? void 0 : a;
}
function dr(e) {
  e && (e.__c && (e.__c.__e = !0), e.__k && e.__k.some(dr));
}
function Gs(e, t, n) {
  for (var o = 0; o < n.length; o++) Wr(n[o], n[++o], n[++o]);
  Y.__c && Y.__c(t, e), e.some(function(r) {
    try {
      e = r.__h, r.__h = [], e.some(function(i) {
        i.call(r);
      });
    } catch (i) {
      Y.__e(i, r.__v);
    }
  });
}
function Ys(e) {
  return typeof e != "object" || e == null || e.__b > 0 ? e : dn(e) ? e.map(Ys) : Oe({}, e);
}
function Md(e, t, n, o, r, i, s, a, l) {
  var c, u, d, f, p, m, h, v = n.props || jn, g = t.props, w = t.type;
  if (w == "svg" ? r = "http://www.w3.org/2000/svg" : w == "math" ? r = "http://www.w3.org/1998/Math/MathML" : r || (r = "http://www.w3.org/1999/xhtml"), i != null) {
    for (c = 0; c < i.length; c++) if ((p = i[c]) && "setAttribute" in p == !!w && (w ? p.localName == w : p.nodeType == 3)) {
      e = p, i[c] = null;
      break;
    }
  }
  if (e == null) {
    if (w == null) return document.createTextNode(g);
    e = document.createElementNS(r, w, g.is && g), a && (Y.__m && Y.__m(t, i), a = !1), i = null;
  }
  if (w == null) v === g || a && e.data == g || (e.data = g);
  else {
    if (i = i && un.call(e.childNodes), !a && i != null) for (v = {}, c = 0; c < e.attributes.length; c++) v[(p = e.attributes[c]).name] = p.value;
    for (c in v) p = v[c], c == "dangerouslySetInnerHTML" ? d = p : c == "children" || c in g || c == "value" && "defaultValue" in g || c == "checked" && "defaultChecked" in g || Pn(e, c, null, p, r);
    for (c in g) p = g[c], c == "children" ? f = p : c == "dangerouslySetInnerHTML" ? u = p : c == "value" ? m = p : c == "checked" ? h = p : a && typeof p != "function" || v[c] === p || Pn(e, c, p, v[c], r);
    if (u) a || d && (u.__html == d.__html || u.__html == e.innerHTML) || (e.innerHTML = u.__html), t.__k = [];
    else if (d && (e.innerHTML = ""), zs(t.type == "template" ? e.content : e, dn(f) ? f : [f], t, n, o, w == "foreignObject" ? "http://www.w3.org/1999/xhtml" : r, i, s, i ? i[0] : n.__k && Tt(n, 0), a, l), i != null) for (c = i.length; c--; ) Br(i[c]);
    a || (c = "value", w == "progress" && m == null ? e.removeAttribute("value") : m != null && (m !== e[c] || w == "progress" && !m || w == "option" && m != v[c]) && Pn(e, c, m, v[c], r), c = "checked", h != null && h != e[c] && Pn(e, c, h, v[c], r));
  }
  return e;
}
function Wr(e, t, n) {
  try {
    if (typeof e == "function") {
      var o = typeof e.__u == "function";
      o && e.__u(), o && t == null || (e.__u = e(t));
    } else e.current = t;
  } catch (r) {
    Y.__e(r, n);
  }
}
function Xs(e, t, n) {
  var o, r;
  if (Y.unmount && Y.unmount(e), (o = e.ref) && (o.current && o.current != e.__e || Wr(o, null, t)), (o = e.__c) != null) {
    if (o.componentWillUnmount) try {
      o.componentWillUnmount();
    } catch (i) {
      Y.__e(i, t);
    }
    o.base = o.__P = null;
  }
  if (o = e.__k) for (r = 0; r < o.length; r++) o[r] && Xs(o[r], t, n || typeof e.type != "function");
  n || Br(e.__e), e.__c = e.__ = e.__e = void 0;
}
function Rd(e, t, n) {
  return this.constructor(e, n);
}
function ut(e, t, n) {
  var o, r, i, s;
  t == document && (t = document.documentElement), Y.__ && Y.__(e, t), r = (o = typeof n == "function") ? null : n && n.__k || t.__k, i = [], s = [], $r(t, e = (!o && n || t).__k = _(le, null, [e]), r || jn, jn, t.namespaceURI, !o && n ? [n] : r ? null : t.firstChild ? un.call(t.childNodes) : null, i, !o && n ? n : r ? r.__e : t.firstChild, o, s), Gs(i, e, s);
}
function qs(e, t) {
  ut(e, t, qs);
}
function Od(e, t, n) {
  var o, r, i, s, a = Oe({}, e.props);
  for (i in e.type && e.type.defaultProps && (s = e.type.defaultProps), t) i == "key" ? o = t[i] : i == "ref" ? r = t[i] : a[i] = t[i] === void 0 && s != null ? s[i] : t[i];
  return arguments.length > 2 && (a.children = arguments.length > 3 ? un.call(arguments, 2) : n), tn(e.type, a, o || e.key, r || e.ref, null);
}
function dt(e) {
  function t(n) {
    var o, r;
    return this.getChildContext || (o = /* @__PURE__ */ new Set(), (r = {})[t.__c] = this, this.getChildContext = function() {
      return r;
    }, this.componentWillUnmount = function() {
      o = null;
    }, this.shouldComponentUpdate = function(i) {
      this.props.value != i.value && o.forEach(function(s) {
        s.__e = !0, ur(s);
      });
    }, this.sub = function(i) {
      o.add(i);
      var s = i.componentWillUnmount;
      i.componentWillUnmount = function() {
        o && o.delete(i), s && s.call(i);
      };
    }), n.children;
  }
  return t.__c = "__cC" + Vs++, t.__ = e, t.Provider = t.__l = (t.Consumer = function(n, o) {
    return n.children(o);
  }).contextType = t, t;
}
un = zn.slice, Y = { __e: function(e, t, n, o) {
  for (var r, i, s; t = t.__; ) if ((r = t.__c) && !r.__) try {
    if ((i = r.constructor) && i.getDerivedStateFromError != null && (r.setState(i.getDerivedStateFromError(e)), s = r.__d), r.componentDidCatch != null && (r.componentDidCatch(e, o || {}), s = r.__d), s) return r.__E = r;
  } catch (a) {
    e = a;
  }
  throw e;
} }, Bs = 0, ke.prototype.setState = function(e, t) {
  var n;
  n = this.__s != null && this.__s != this.state ? this.__s : this.__s = Oe({}, this.state), typeof e == "function" && (e = e(Oe({}, n), this.props)), e && Oe(n, e), e != null && this.__v && (t && this._sb.push(t), ur(this));
}, ke.prototype.forceUpdate = function(e) {
  this.__v && (this.__e = !0, e && this.__h.push(e), ur(this));
}, ke.prototype.render = le, it = [], $s = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Ws = function(e, t) {
  return e.__v.__b - t.__v.__b;
}, Kn.__r = 0, Hs = /(PointerCapture)$|Capture$/i, Fr = 0, cr = $i(!1), lr = $i(!0), Vs = 0;
var je, oe, zo, Wi, Lt = 0, Js = [], ie = Y, Hi = ie.__b, Vi = ie.__r, Ui = ie.diffed, ji = ie.__c, zi = ie.unmount, Ki = ie.__;
function mt(e, t) {
  ie.__h && ie.__h(oe, e, Lt || t), Lt = 0;
  var n = oe.__H || (oe.__H = { __: [], __h: [] });
  return e >= n.__.length && n.__.push({}), n.__[e];
}
function $(e) {
  return Lt = 1, fn(Zs, e);
}
function fn(e, t, n) {
  var o = mt(je++, 2);
  if (o.t = e, !o.__c && (o.__ = [n ? n(t) : Zs(void 0, t), function(a) {
    var l = o.__N ? o.__N[0] : o.__[0], c = o.t(l, a);
    l !== c && (o.__N = [c, o.__[1]], o.__c.setState({}));
  }], o.__c = oe, !oe.__f)) {
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
    oe.__f = !0;
    var i = oe.shouldComponentUpdate, s = oe.componentWillUpdate;
    oe.componentWillUpdate = function(a, l, c) {
      if (this.__e) {
        var u = i;
        i = void 0, r(a, l, c), i = u;
      }
      s && s.call(this, a, l, c);
    }, oe.shouldComponentUpdate = r;
  }
  return o.__N || o.__;
}
function F(e, t) {
  var n = mt(je++, 3);
  !ie.__s && jr(n.__H, t) && (n.__ = e, n.u = t, oe.__H.__h.push(n));
}
function Ce(e, t) {
  var n = mt(je++, 4);
  !ie.__s && jr(n.__H, t) && (n.__ = e, n.u = t, oe.__h.push(n));
}
function T(e) {
  return Lt = 5, de(function() {
    return { current: e };
  }, []);
}
function Hr(e, t, n) {
  Lt = 6, Ce(function() {
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
function de(e, t) {
  var n = mt(je++, 7);
  return jr(n.__H, t) && (n.__ = e(), n.__H = t, n.__h = e), n.__;
}
function H(e, t) {
  return Lt = 8, de(function() {
    return e;
  }, t);
}
function et(e) {
  var t = oe.context[e.__c], n = mt(je++, 9);
  return n.c = e, t ? (n.__ == null && (n.__ = !0, t.sub(oe)), t.props.value) : e.__;
}
function Vr(e, t) {
  ie.useDebugValue && ie.useDebugValue(t ? t(e) : e);
}
function Id(e) {
  var t = mt(je++, 10), n = $();
  return t.__ = e, oe.componentDidCatch || (oe.componentDidCatch = function(o, r) {
    t.__ && t.__(o, r), n[1](o);
  }), [n[0], function() {
    n[1](void 0);
  }];
}
function Ur() {
  var e = mt(je++, 11);
  if (!e.__) {
    for (var t = oe.__v; t !== null && !t.__m && t.__ !== null; ) t = t.__;
    var n = t.__m || (t.__m = [0, 0]);
    e.__ = "P" + n[0] + "-" + n[1]++;
  }
  return e.__;
}
function Dd() {
  for (var e; e = Js.shift(); ) {
    var t = e.__H;
    if (e.__P && t) try {
      t.__h.some($n), t.__h.some(fr), t.__h = [];
    } catch (n) {
      t.__h = [], ie.__e(n, e.__v);
    }
  }
}
ie.__b = function(e) {
  oe = null, Hi && Hi(e);
}, ie.__ = function(e, t) {
  e && t.__k && t.__k.__m && (e.__m = t.__k.__m), Ki && Ki(e, t);
}, ie.__r = function(e) {
  Vi && Vi(e), je = 0;
  var t = (oe = e.__c).__H;
  t && (zo === oe ? (t.__h = [], oe.__h = [], t.__.some(function(n) {
    n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
  })) : (t.__h.some($n), t.__h.some(fr), t.__h = [], je = 0)), zo = oe;
}, ie.diffed = function(e) {
  Ui && Ui(e);
  var t = e.__c;
  t && t.__H && (t.__H.__h.length && (Js.push(t) !== 1 && Wi === ie.requestAnimationFrame || ((Wi = ie.requestAnimationFrame) || Fd)(Dd)), t.__H.__.some(function(n) {
    n.u && (n.__H = n.u), n.u = void 0;
  })), zo = oe = null;
}, ie.__c = function(e, t) {
  t.some(function(n) {
    try {
      n.__h.some($n), n.__h = n.__h.filter(function(o) {
        return !o.__ || fr(o);
      });
    } catch (o) {
      t.some(function(r) {
        r.__h && (r.__h = []);
      }), t = [], ie.__e(o, n.__v);
    }
  }), ji && ji(e, t);
}, ie.unmount = function(e) {
  zi && zi(e);
  var t, n = e.__c;
  n && n.__H && (n.__H.__.some(function(o) {
    try {
      $n(o);
    } catch (r) {
      t = r;
    }
  }), n.__H = void 0, t && ie.__e(t, n.__v));
};
var Gi = typeof requestAnimationFrame == "function";
function Fd(e) {
  var t, n = function() {
    clearTimeout(o), Gi && cancelAnimationFrame(t), setTimeout(e);
  }, o = setTimeout(n, 35);
  Gi && (t = requestAnimationFrame(n));
}
function $n(e) {
  var t = oe, n = e.__c;
  typeof n == "function" && (e.__c = void 0, n()), oe = t;
}
function fr(e) {
  var t = oe;
  e.__c = e.__(), oe = t;
}
function jr(e, t) {
  return !e || e.length !== t.length || t.some(function(n, o) {
    return n !== e[o];
  });
}
function Zs(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function Qs(e, t) {
  for (var n in t) e[n] = t[n];
  return e;
}
function pr(e, t) {
  for (var n in e) if (n !== "__source" && !(n in t)) return !0;
  for (var o in t) if (o !== "__source" && e[o] !== t[o]) return !0;
  return !1;
}
function zr(e, t) {
  var n = t(), o = $({ t: { __: n, u: t } }), r = o[0].t, i = o[1];
  return Ce(function() {
    r.__ = n, r.u = t, Ko(r) && i({ t: r });
  }, [e, n, t]), F(function() {
    return Ko(r) && i({ t: r }), e(function() {
      Ko(r) && i({ t: r });
    });
  }, [e]), n;
}
function Ko(e) {
  try {
    return !((t = e.__) === (n = e.u()) && (t !== 0 || 1 / t == 1 / n) || t != t && n != n);
  } catch {
    return !0;
  }
  var t, n;
}
function Kr(e) {
  e();
}
function Gr(e) {
  return e;
}
function Yr() {
  return [!1, Kr];
}
var Xr = Ce;
function Gn(e, t) {
  this.props = e, this.context = t;
}
function ea(e, t) {
  function n(r) {
    var i = this.props.ref, s = i == r.ref;
    return !s && i && (i.call ? i(null) : i.current = null), t ? !t(this.props, r) || !s : pr(this.props, r);
  }
  function o(r) {
    return this.shouldComponentUpdate = n, _(e, r);
  }
  return o.displayName = "Memo(" + (e.displayName || e.name) + ")", o.prototype.isReactComponent = !0, o.__f = !0, o.type = e, o;
}
(Gn.prototype = new ke()).isPureReactComponent = !0, Gn.prototype.shouldComponentUpdate = function(e, t) {
  return pr(this.props, e) || pr(this.state, t);
};
var Yi = Y.__b;
Y.__b = function(e) {
  e.type && e.type.__f && e.ref && (e.props.ref = e.ref, e.ref = null), Yi && Yi(e);
};
var Bd = typeof Symbol < "u" && Symbol.for && Symbol.for("react.forward_ref") || 3911;
function P(e) {
  function t(n) {
    var o = Qs({}, n);
    return delete o.ref, e(o, n.ref || null);
  }
  return t.$$typeof = Bd, t.render = e, t.prototype.isReactComponent = t.__f = !0, t.displayName = "ForwardRef(" + (e.displayName || e.name) + ")", t;
}
var Xi = function(e, t) {
  return e == null ? null : He(He(e).map(t));
}, Ve = { map: Xi, forEach: Xi, count: function(e) {
  return e ? He(e).length : 0;
}, only: function(e) {
  var t = He(e);
  if (t.length !== 1) throw "Children.only";
  return t[0];
}, toArray: He }, $d = Y.__e;
Y.__e = function(e, t, n, o) {
  if (e.then) {
    for (var r, i = t; i = i.__; ) if ((r = i.__c) && r.__c) return t.__e == null && (t.__e = n.__e, t.__k = n.__k), r.__c(e, t);
  }
  $d(e, t, n, o);
};
var qi = Y.unmount;
function ta(e, t, n) {
  return e && (e.__c && e.__c.__H && (e.__c.__H.__.forEach(function(o) {
    typeof o.__c == "function" && o.__c();
  }), e.__c.__H = null), (e = Qs({}, e)).__c != null && (e.__c.__P === n && (e.__c.__P = t), e.__c.__e = !0, e.__c = null), e.__k = e.__k && e.__k.map(function(o) {
    return ta(o, t, n);
  })), e;
}
function na(e, t, n) {
  return e && n && (e.__v = null, e.__k = e.__k && e.__k.map(function(o) {
    return na(o, t, n);
  }), e.__c && e.__c.__P === t && (e.__e && n.appendChild(e.__e), e.__c.__e = !0, e.__c.__P = n)), e;
}
function nn() {
  this.__u = 0, this.o = null, this.__b = null;
}
function oa(e) {
  if (!e.__) return null;
  var t = e.__.__c;
  return t && t.__a && t.__a(e);
}
function ra(e) {
  var t, n, o, r = null;
  function i(s) {
    if (t || (t = e()).then(function(a) {
      a && (r = a.default || a), o = !0;
    }, function(a) {
      n = a, o = !0;
    }), n) throw n;
    if (!o) throw t;
    return r ? _(r, s) : null;
  }
  return i.displayName = "Lazy", i.__f = !0, i;
}
function Nt() {
  this.i = null, this.l = null;
}
Y.unmount = function(e) {
  var t = e.__c;
  t && (t.__z = !0), t && t.__R && t.__R(), t && 32 & e.__u && (e.type = null), qi && qi(e);
}, (nn.prototype = new ke()).__c = function(e, t) {
  var n = t.__c, o = this;
  o.o == null && (o.o = []), o.o.push(n);
  var r = oa(o.__v), i = !1, s = function() {
    i || o.__z || (i = !0, n.__R = null, r ? r(l) : l());
  };
  n.__R = s;
  var a = n.__P;
  n.__P = null;
  var l = function() {
    if (!--o.__u) {
      if (o.state.__a) {
        var c = o.state.__a;
        o.__v.__k[0] = na(c, c.__c.__P, c.__c.__O);
      }
      var u;
      for (o.setState({ __a: o.__b = null }); u = o.o.pop(); ) u.__P = a, u.forceUpdate();
    }
  };
  o.__u++ || 32 & t.__u || o.setState({ __a: o.__b = o.__v.__k[0] }), e.then(s, s);
}, nn.prototype.componentWillUnmount = function() {
  this.o = [];
}, nn.prototype.render = function(e, t) {
  if (this.__b) {
    if (this.__v.__k) {
      var n = document.createElement("div"), o = this.__v.__k[0].__c;
      this.__v.__k[0] = ta(this.__b, n, o.__O = o.__P);
    }
    this.__b = null;
  }
  var r = t.__a && _(le, null, e.fallback);
  return r && (r.__u &= -33), [_(le, null, t.__a ? null : e.children), r];
};
var Ji = function(e, t, n) {
  if (++n[1] === n[0] && e.l.delete(t), e.props.revealOrder && (e.props.revealOrder[0] !== "t" || !e.l.size)) for (n = e.i; n; ) {
    for (; n.length > 3; ) n.pop()();
    if (n[1] < n[0]) break;
    e.i = n = n[2];
  }
};
function Wd(e) {
  return this.getChildContext = function() {
    return e.context;
  }, e.children;
}
function Hd(e) {
  var t = this, n = e.h;
  if (t.componentWillUnmount = function() {
    ut(null, t.v), t.v = null, t.h = null;
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
  ut(_(Wd, { context: t.context }, e.__v), t.v);
}
function vt(e, t) {
  var n = _(Hd, { __v: e, h: t });
  return n.containerInfo = t, n;
}
(Nt.prototype = new ke()).__a = function(e) {
  var t = this, n = oa(t.__v), o = t.l.get(e);
  return o[0]++, function(r) {
    var i = function() {
      t.props.revealOrder ? (o.push(r), Ji(t, e, o)) : r();
    };
    n ? n(i) : i();
  };
}, Nt.prototype.render = function(e) {
  this.i = null, this.l = /* @__PURE__ */ new Map();
  var t = He(e.children);
  e.revealOrder && e.revealOrder[0] === "b" && t.reverse();
  for (var n = t.length; n--; ) this.l.set(t[n], this.i = [1, 0, this.i]);
  return e.children;
}, Nt.prototype.componentDidUpdate = Nt.prototype.componentDidMount = function() {
  var e = this;
  this.l.forEach(function(t, n) {
    Ji(e, n, t);
  });
};
var ia = typeof Symbol < "u" && Symbol.for && Symbol.for("react.element") || 60103, Vd = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/, Ud = /^on(Ani|Tra|Tou|BeforeInp|Compo)/, jd = /[A-Z0-9]/g, zd = typeof document < "u", Kd = function(e) {
  return (typeof Symbol < "u" && typeof Symbol() == "symbol" ? /fil|che|rad/ : /fil|che|ra/).test(e);
};
function sa(e, t, n) {
  return t.__k == null && (t.textContent = ""), ut(e, t), typeof n == "function" && n(), e ? e.__c : null;
}
function aa(e, t, n) {
  return qs(e, t), typeof n == "function" && n(), e ? e.__c : null;
}
ke.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(e) {
  Object.defineProperty(ke.prototype, e, { configurable: !0, get: function() {
    return this["UNSAFE_" + e];
  }, set: function(t) {
    Object.defineProperty(this, e, { configurable: !0, writable: !0, value: t });
  } });
});
var Zi = Y.event;
function Gd() {
}
function Yd() {
  return this.cancelBubble;
}
function Xd() {
  return this.defaultPrevented;
}
Y.event = function(e) {
  return Zi && (e = Zi(e)), e.persist = Gd, e.isPropagationStopped = Yd, e.isDefaultPrevented = Xd, e.nativeEvent = e;
};
var qr, qd = { enumerable: !1, configurable: !0, get: function() {
  return this.class;
} }, Qi = Y.vnode;
Y.vnode = function(e) {
  typeof e.type == "string" && function(t) {
    var n = t.props, o = t.type, r = {}, i = o.indexOf("-") === -1;
    for (var s in n) {
      var a = n[s];
      if (!(s === "value" && "defaultValue" in n && a == null || zd && s === "children" && o === "noscript" || s === "class" || s === "className")) {
        var l = s.toLowerCase();
        s === "defaultValue" && "value" in n && n.value == null ? s = "value" : s === "download" && a === !0 ? a = "" : l === "translate" && a === "no" ? a = !1 : l[0] === "o" && l[1] === "n" ? l === "ondoubleclick" ? s = "ondblclick" : l !== "onchange" || o !== "input" && o !== "textarea" || Kd(n.type) ? l === "onfocus" ? s = "onfocusin" : l === "onblur" ? s = "onfocusout" : Ud.test(s) && (s = l) : l = s = "oninput" : i && Vd.test(s) ? s = s.replace(jd, "-$&").toLowerCase() : a === null && (a = void 0), l === "oninput" && r[s = l] && (s = "oninputCapture"), r[s] = a;
      }
    }
    o == "select" && r.multiple && Array.isArray(r.value) && (r.value = He(n.children).forEach(function(c) {
      c.props.selected = r.value.indexOf(c.props.value) != -1;
    })), o == "select" && r.defaultValue != null && (r.value = He(n.children).forEach(function(c) {
      c.props.selected = r.multiple ? r.defaultValue.indexOf(c.props.value) != -1 : r.defaultValue == c.props.value;
    })), n.class && !n.className ? (r.class = n.class, Object.defineProperty(r, "className", qd)) : n.className && (r.class = r.className = n.className), t.props = r;
  }(e), e.$$typeof = ia, Qi && Qi(e);
};
var es = Y.__r;
Y.__r = function(e) {
  es && es(e), qr = e.__c;
};
var ts = Y.diffed;
Y.diffed = function(e) {
  ts && ts(e);
  var t = e.props, n = e.__e;
  n != null && e.type === "textarea" && "value" in t && t.value !== n.value && (n.value = t.value == null ? "" : t.value), qr = null;
};
var ca = { ReactCurrentDispatcher: { current: { readContext: function(e) {
  return qr.__n[e.__c].props.value;
}, useCallback: H, useContext: et, useDebugValue: Vr, useDeferredValue: Gr, useEffect: F, useId: Ur, useImperativeHandle: Hr, useInsertionEffect: Xr, useLayoutEffect: Ce, useMemo: de, useReducer: fn, useRef: T, useState: $, useSyncExternalStore: zr, useTransition: Yr } } }, Jd = "18.3.1";
function la(e) {
  return _.bind(null, e);
}
function ze(e) {
  return !!e && e.$$typeof === ia;
}
function ua(e) {
  return ze(e) && e.type === le;
}
function da(e) {
  return !!e && typeof e.displayName == "string" && e.displayName.startsWith("Memo(");
}
function Ft(e) {
  return ze(e) ? Od.apply(null, arguments) : e;
}
function fa(e) {
  return !!e.__k && (ut(null, e), !0);
}
function pa(e) {
  return e && (e.base || e.nodeType === 1 && e) || null;
}
var ha = function(e, t) {
  return e(t);
}, co = function(e, t) {
  return e(t);
}, ma = le, va = ze, se = { useState: $, useId: Ur, useReducer: fn, useEffect: F, useLayoutEffect: Ce, useInsertionEffect: Xr, useTransition: Yr, useDeferredValue: Gr, useSyncExternalStore: zr, startTransition: Kr, useRef: T, useImperativeHandle: Hr, useMemo: de, useCallback: H, useContext: et, useDebugValue: Vr, version: "18.3.1", Children: Ve, render: sa, hydrate: aa, unmountComponentAtNode: fa, createPortal: vt, createElement: _, createContext: dt, createFactory: la, cloneElement: Ft, createRef: Us, Fragment: le, isValidElement: ze, isElement: va, isFragment: ua, isMemo: da, findDOMNode: pa, Component: ke, PureComponent: Gn, memo: ea, forwardRef: P, flushSync: co, unstable_batchedUpdates: ha, StrictMode: ma, Suspense: nn, SuspenseList: Nt, lazy: ra, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ca };
const ga = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Children: Ve,
  Component: ke,
  Fragment: le,
  PureComponent: Gn,
  StrictMode: ma,
  Suspense: nn,
  SuspenseList: Nt,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ca,
  cloneElement: Ft,
  createContext: dt,
  createElement: _,
  createFactory: la,
  createPortal: vt,
  createRef: Us,
  default: se,
  findDOMNode: pa,
  flushSync: co,
  forwardRef: P,
  hydrate: aa,
  isElement: va,
  isFragment: ua,
  isMemo: da,
  isValidElement: ze,
  lazy: ra,
  memo: ea,
  render: sa,
  startTransition: Kr,
  unmountComponentAtNode: fa,
  unstable_batchedUpdates: ha,
  useCallback: H,
  useContext: et,
  useDebugValue: Vr,
  useDeferredValue: Gr,
  useEffect: F,
  useErrorBoundary: Id,
  useId: Ur,
  useImperativeHandle: Hr,
  useInsertionEffect: Xr,
  useLayoutEffect: Ce,
  useMemo: de,
  useReducer: fn,
  useRef: T,
  useState: $,
  useSyncExternalStore: zr,
  useTransition: Yr,
  version: Jd
}, Symbol.toStringTag, { value: "Module" }));
let kt = null;
function Zd(e, t, n) {
  kt = n;
}
function Z(e, t) {
  var n;
  (n = kt == null ? void 0 : kt.onEvent) == null || n.call(kt, e, t);
}
function Qd(e, t) {
  let n;
  return (...o) => {
    clearTimeout(n), n = setTimeout(() => e(...o), t);
  };
}
function ef(e, t) {
  let n = 0;
  return (...o) => {
    const r = Date.now();
    r - n >= t && (n = r, e(...o));
  };
}
function tf(e, t) {
  var i;
  const n = (i = t.modifiers) == null ? void 0 : i.includes("once");
  let o = !1, r = (s) => {
    if (!(n && o) && !(t.keyFilter && s instanceof KeyboardEvent && s.key !== t.keyFilter)) {
      if (t.modifiers)
        for (const a of t.modifiers)
          a === "prevent" && s.preventDefault(), a === "stop" && s.stopPropagation();
      e(s), n && (o = !0);
    }
  };
  if (t.modifiers)
    for (const s of t.modifiers) {
      if (s.startsWith("debounce:")) {
        const a = parseInt(s.split(":")[1], 10);
        r = Qd(r, a);
      }
      if (s.startsWith("throttle:")) {
        const a = parseInt(s.split(":")[1], 10);
        r = ef(r, a);
      }
    }
  return r;
}
function K_(e) {
  const t = (n) => {
    const r = n.target.tagName;
    r === "INPUT" || r === "TEXTAREA" || r === "SELECT" || e.onEvent && ((n.key === "ArrowUp" || n.key === "ArrowDown" || n.key === "ArrowLeft" || n.key === "ArrowRight" || n.key === " " || n.key === "PageUp" || n.key === "PageDown") && n.preventDefault(), Z(-2, JSON.stringify({ key: n.key })));
  };
  return document.addEventListener("keydown", t, { capture: !0 }), () => document.removeEventListener("keydown", t, { capture: !0 });
}
function nf(e) {
  const t = { Type: e.type }, n = e.target;
  n && ("value" in n && n.value !== void 0 && (t.Value = String(n.value)), "checked" in n && typeof n.checked == "boolean" && (t.Checked = n.checked)), e instanceof KeyboardEvent && (t.Key = e.key), e instanceof MouseEvent && (t.ClientX = e.clientX, t.ClientY = e.clientY), "detail" in e && typeof e.detail == "number" && (t.Detail = e.detail);
  const r = e.currentTarget || n;
  return e.type === "scroll" && r && ("scrollTop" in r && (t.ScrollTop = r.scrollTop), "scrollHeight" in r && (t.ScrollHeight = r.scrollHeight), "clientHeight" in r && (t.ClientHeight = r.clientHeight)), JSON.stringify(t);
}
function Jr(e) {
  const t = {};
  if (e.onClick != null) {
    const n = e.onClick;
    t.onClick = (o) => {
      o.stopPropagation(), Z(n, "{}");
    };
  }
  if (e.onChange != null) {
    const n = e.onChange;
    t.onInput = (o) => {
      const r = o.target;
      Z(n, JSON.stringify({ Value: r.value ?? "" }));
    }, t.onChange = (o) => {
      const r = o.target;
      r.tagName === "SELECT" && Z(n, JSON.stringify({ Value: r.value ?? "" }));
    };
  }
  if (e.onSubmit != null) {
    const n = e.onSubmit;
    t.onSubmit = (o) => {
      o.preventDefault(), Z(n, "{}");
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
        Z(n, JSON.stringify({ Files: s }));
        return;
      }
      o && o(r);
    };
  }
  if (e.onSelect != null && (t["data-vo-select"] = e.onSelect), e.onScrollState != null) {
    const n = e.onScrollState;
    t.onScroll = (o) => {
      const r = o.currentTarget, i = r.scrollTop, s = r.scrollHeight, a = r.clientHeight, l = Math.max(0, s - a), c = Math.max(0, l - i);
      Z(n, JSON.stringify({
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
          Z(i.iD, nf(l));
        };
        t[s] = tf(a, i);
      }
  }
  return t;
}
const of = {
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
}, rf = /* @__PURE__ */ new Set([
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
function sf(e, t) {
  return typeof e == "number" ? t && rf.has(t) ? String(e) : `${e}px` : String(e);
}
function af(e) {
  switch (e) {
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
    case "vo-form-field":
      return "div";
    case "vo-form-error":
      return "div";
    case "vo-form-help":
      return "div";
    case "vo-form-section":
      return "div";
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
    case "vo-dialog-title":
      return "h2";
    case "vo-dialog-content":
      return "div";
    case "vo-dialog-actions":
      return "div";
    case "vo-menu-item":
      return "div";
    case "vo-menu-divider":
      return "hr";
    case "vo-combobox-option":
      return "div";
    default:
      return "div";
  }
}
function cf(e) {
  switch (e) {
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
    case "vo-form-field":
      return "flex flex-col gap-1.5";
    case "vo-form-error":
      return "text-sm text-danger";
    case "vo-form-help":
      return "text-sm text-muted-foreground";
    case "vo-form-section":
      return "flex flex-col gap-4";
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
    case "vo-dialog-title":
      return "text-lg font-semibold leading-none tracking-tight";
    case "vo-dialog-content":
      return "mt-2 text-sm text-muted-foreground";
    case "vo-dialog-actions":
      return "mt-4 flex justify-end gap-2";
    case "vo-menu-item":
      return "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground";
    case "vo-menu-divider":
      return "my-1 h-px bg-border";
    case "vo-combobox-option":
      return "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent";
    default:
      return "";
  }
}
function lf(e, t, n) {
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
function ce(e) {
  const t = e.style;
  if (!t || typeof t != "object") return;
  const n = {};
  for (const [o, r] of Object.entries(t)) {
    const i = of[o] || o;
    n[uf(i)] = sf(r, i);
  }
  return n;
}
function uf(e) {
  return e.includes("-") ? e.replace(/-([a-z])/g, (t, n) => n.toUpperCase()) : e;
}
const df = -6, rn = /* @__PURE__ */ new Map();
function G_(e) {
  return rn.get(e);
}
function pn(e) {
  return (t) => {
    t ? rn.set(e, t) : rn.delete(e);
  };
}
function ff(e) {
  const t = rn.get(e.ref);
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
        e.measureId != null && Z(df, JSON.stringify({
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
const pf = '*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:var(--vo-font-family, system-ui, -apple-system, sans-serif);font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.\\!container{width:100%!important}.container{width:100%}@media (min-width: 640px){.\\!container{max-width:640px!important}.container{max-width:640px}}@media (min-width: 768px){.\\!container{max-width:768px!important}.container{max-width:768px}}@media (min-width: 1024px){.\\!container{max-width:1024px!important}.container{max-width:1024px}}@media (min-width: 1280px){.\\!container{max-width:1280px!important}.container{max-width:1280px}}@media (min-width: 1536px){.\\!container{max-width:1536px!important}.container{max-width:1536px}}.pointer-events-none{pointer-events:none}.visible{visibility:visible}.static{position:static}.absolute{position:absolute}.relative{position:relative}.inset-x-0{left:0;right:0}.inset-y-0{top:0;bottom:0}.bottom-0{bottom:0}.left-0{left:0}.right-0{right:0}.right-2{right:.5rem}.right-4{right:1rem}.top-0{top:0}.top-4{top:1rem}.z-50{z-index:50}.-mx-1{margin-left:-.25rem;margin-right:-.25rem}.my-1{margin-top:.25rem;margin-bottom:.25rem}.my-2{margin-top:.5rem;margin-bottom:.5rem}.ml-2{margin-left:.5rem}.mr-1\\.5{margin-right:.375rem}.mr-2{margin-right:.5rem}.mt-1{margin-top:.25rem}.mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.block{display:block}.inline-block{display:inline-block}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.contents{display:contents}.hidden{display:none}.aspect-square{aspect-ratio:1 / 1}.h-1\\.5{height:.375rem}.h-10{height:2.5rem}.h-12{height:3rem}.h-2{height:.5rem}.h-3\\.5{height:.875rem}.h-4{height:1rem}.h-5{height:1.25rem}.h-7{height:1.75rem}.h-8{height:2rem}.h-9{height:2.25rem}.h-full{height:100%}.h-px{height:1px}.max-h-60{max-height:15rem}.max-h-96{max-height:24rem}.max-h-\\[85\\%\\]{max-height:85%}.min-h-0{min-height:0px}.min-h-\\[60px\\]{min-height:60px}.w-10{width:2.5rem}.w-3{width:.75rem}.w-3\\.5{width:.875rem}.w-3\\/4{width:75%}.w-4{width:1rem}.w-5{width:1.25rem}.w-64{width:16rem}.w-72{width:18rem}.w-8{width:2rem}.w-9{width:2.25rem}.w-full{width:100%}.min-w-\\[2rem\\]{min-width:2rem}.min-w-\\[8rem\\]{min-width:8rem}.max-w-lg{max-width:32rem}.max-w-sm{max-width:24rem}.flex-1{flex:1 1 0%}.flex-shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.flex-grow,.grow{flex-grow:1}.transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.animate-fade-in{animation:fade-in .2s ease-out}@keyframes scale-in{0%{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}.animate-scale-in{animation:scale-in .2s ease-out}@keyframes slide-in-from-bottom{0%{transform:translateY(100%)}to{transform:translateY(0)}}.animate-slide-in-from-bottom{animation:slide-in-from-bottom .2s ease-out}@keyframes slide-in-from-left{0%{transform:translate(-100%)}to{transform:translate(0)}}.animate-slide-in-from-left{animation:slide-in-from-left .2s ease-out}@keyframes slide-in-from-right{0%{transform:translate(100%)}to{transform:translate(0)}}.animate-slide-in-from-right{animation:slide-in-from-right .2s ease-out}@keyframes slide-in-from-top{0%{transform:translateY(-100%)}to{transform:translateY(0)}}.animate-slide-in-from-top{animation:slide-in-from-top .2s ease-out}@keyframes spin{to{transform:rotate(360deg)}0%{transform:rotate(0)}}.animate-spin{animation:spin 1s linear infinite}.cursor-default{cursor:default}.cursor-not-allowed{cursor:not-allowed}.cursor-pointer{cursor:pointer}.touch-none{touch-action:none}.select-none{-webkit-user-select:none;-moz-user-select:none;user-select:none}.resize{resize:both}.flex-row{flex-direction:row}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-start{align-items:flex-start}.items-center{align-items:center}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-0\\.5{gap:.125rem}.gap-1{gap:.25rem}.gap-1\\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-4{gap:1rem}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.whitespace-nowrap{white-space:nowrap}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:var(--vo-radius-lg, 8px)}.rounded-md{border-radius:var(--vo-radius, 6px)}.rounded-sm{border-radius:var(--vo-radius-sm, 4px)}.border{border-width:1px}.border-2{border-width:2px}.border-b{border-bottom-width:1px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-border{border-color:var(--vo-border, #e2e8f0)}.border-current{border-color:currentColor}.border-input{border-color:var(--vo-input-border, #e2e8f0)}.border-muted{border-color:var(--vo-muted, #f1f5f9)}.border-primary{border-color:var(--vo-primary, #3b82f6)}.border-transparent{border-color:transparent}.border-t-transparent{border-top-color:transparent}.bg-accent{background-color:var(--vo-accent, #f1f5f9)}.bg-background{background-color:var(--vo-background, #ffffff)}.bg-border{background-color:var(--vo-border, #e2e8f0)}.bg-card{background-color:var(--vo-card, #ffffff)}.bg-danger{background-color:var(--vo-danger, #ef4444)}.bg-foreground{background-color:var(--vo-text, #0f172a)}.bg-info{background-color:var(--vo-info, #06b6d4)}.bg-muted{background-color:var(--vo-muted, #f1f5f9)}.bg-popover{background-color:var(--vo-popover, #ffffff)}.bg-primary{background-color:var(--vo-primary, #3b82f6)}.bg-secondary{background-color:var(--vo-secondary, #6b7280)}.bg-success{background-color:var(--vo-success, #22c55e)}.bg-surface{background-color:var(--vo-surface, #f8fafc)}.bg-transparent{background-color:transparent}.bg-warning{background-color:var(--vo-warning, #f59e0b)}.fill-foreground{fill:var(--vo-text, #0f172a)}.fill-popover{fill:var(--vo-popover, #ffffff)}.object-cover{-o-object-fit:cover;object-fit:cover}.p-1{padding:.25rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.px-1{padding-left:.25rem;padding-right:.25rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-2\\.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-8{padding-left:2rem;padding-right:2rem}.py-0\\.5{padding-top:.125rem;padding-bottom:.125rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\\.5{padding-top:.375rem;padding-bottom:.375rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.pb-4{padding-bottom:1rem}.pl-2{padding-left:.5rem}.pr-8{padding-right:2rem}.pt-0{padding-top:0}.text-center{text-align:center}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xs{font-size:.75rem;line-height:1rem}.font-medium{font-weight:500}.font-semibold{font-weight:600}.leading-none{line-height:1}.tracking-tight{letter-spacing:-.025em}.text-accent-foreground{color:var(--vo-accent-foreground, #0f172a)}.text-background{color:var(--vo-background, #ffffff)}.text-card-foreground{color:var(--vo-card-foreground, #0f172a)}.text-current{color:currentColor}.text-danger{color:var(--vo-danger, #ef4444)}.text-danger-foreground{color:var(--vo-danger-foreground, #ffffff)}.text-foreground{color:var(--vo-text, #0f172a)}.text-info{color:var(--vo-info, #06b6d4)}.text-info-foreground{color:var(--vo-info-foreground, #ffffff)}.text-muted-foreground{color:var(--vo-text-muted, #64748b)}.text-popover-foreground{color:var(--vo-popover-foreground, #0f172a)}.text-primary{color:var(--vo-primary, #3b82f6)}.text-primary-foreground{color:var(--vo-primary-foreground, #ffffff)}.text-secondary-foreground{color:var(--vo-secondary-foreground, #ffffff)}.text-success{color:var(--vo-success, #22c55e)}.text-success-foreground{color:var(--vo-success-foreground, #ffffff)}.text-warning{color:var(--vo-warning, #f59e0b)}.text-warning-foreground{color:var(--vo-warning-foreground, #ffffff)}.underline-offset-4{text-underline-offset:4px}.opacity-50{opacity:.5}.opacity-70{opacity:.7}.shadow{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-lg{--tw-shadow: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-md{--tw-shadow: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);--tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-sm{--tw-shadow: 0 1px 2px 0 rgb(0 0 0 / .05);--tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.outline-none{outline:2px solid transparent;outline-offset:2px}.outline{outline-style:solid}.ring-0{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.ring-offset-background{--tw-ring-offset-color: var(--vo-background, #ffffff)}.blur{--tw-blur: blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-transform{transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.duration-200{transition-duration:.2s}.ease-out{transition-timing-function:cubic-bezier(0,0,.2,1)}.placeholder\\:text-muted-foreground::-moz-placeholder{color:var(--vo-text-muted, #64748b)}.placeholder\\:text-muted-foreground::placeholder{color:var(--vo-text-muted, #64748b)}.hover\\:bg-accent:hover{background-color:var(--vo-accent, #f1f5f9)}.hover\\:text-accent-foreground:hover{color:var(--vo-accent-foreground, #0f172a)}.hover\\:text-foreground:hover{color:var(--vo-text, #0f172a)}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:opacity-100:hover{opacity:1}.focus\\:bg-accent:focus{background-color:var(--vo-accent, #f1f5f9)}.focus\\:text-accent-foreground:focus{color:var(--vo-accent-foreground, #0f172a)}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus\\:ring-1:focus{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus\\:ring-ring:focus{--tw-ring-color: var(--vo-ring, #3b82f6)}.focus-visible\\:outline-none:focus-visible{outline:2px solid transparent;outline-offset:2px}.focus-visible\\:ring-1:focus-visible{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus-visible\\:ring-2:focus-visible{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus-visible\\:ring-ring:focus-visible{--tw-ring-color: var(--vo-ring, #3b82f6)}.disabled\\:pointer-events-none:disabled{pointer-events:none}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:opacity-50:disabled{opacity:.5}.data-\\[disabled\\]\\:pointer-events-none[data-disabled]{pointer-events:none}.data-\\[state\\=checked\\]\\:translate-x-4[data-state=checked]{--tw-translate-x: 1rem;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.data-\\[state\\=unchecked\\]\\:translate-x-0[data-state=unchecked]{--tw-translate-x: 0px;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@keyframes fade-out{0%{opacity:1}to{opacity:0}}.data-\\[state\\=closed\\]\\:animate-fade-out[data-state=closed]{animation:fade-out .2s ease-out}@keyframes fade-in{0%{opacity:0}to{opacity:1}}.data-\\[state\\=open\\]\\:animate-fade-in[data-state=open]{animation:fade-in .2s ease-out}.data-\\[state\\=checked\\]\\:border-primary[data-state=checked]{border-color:var(--vo-primary, #3b82f6)}.data-\\[state\\=active\\]\\:bg-background[data-state=active]{background-color:var(--vo-background, #ffffff)}.data-\\[state\\=checked\\]\\:bg-primary[data-state=checked]{background-color:var(--vo-primary, #3b82f6)}.data-\\[state\\=unchecked\\]\\:bg-muted[data-state=unchecked]{background-color:var(--vo-muted, #f1f5f9)}.data-\\[state\\=active\\]\\:text-foreground[data-state=active]{color:var(--vo-text, #0f172a)}.data-\\[state\\=checked\\]\\:text-primary-foreground[data-state=checked]{color:var(--vo-primary-foreground, #ffffff)}.data-\\[disabled\\]\\:opacity-50[data-disabled]{opacity:.5}.data-\\[state\\=active\\]\\:shadow[data-state=active]{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.\\[\\&\\[data-state\\=open\\]\\>svg\\]\\:rotate-180[data-state=open]>svg{--tw-rotate: 180deg;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}';
let ns = !1, yt = null;
function Y_() {
  if (ns) return;
  ns = !0;
  const e = document.createElement("style");
  e.id = "vogui-base", e.textContent = pf, document.head.appendChild(e);
}
function hf(e) {
  var t;
  if (!(!e || e.length === 0)) {
    yt || (yt = document.createElement("style"), yt.id = "vogui-dynamic", document.head.appendChild(yt));
    for (const n of e)
      (t = yt.sheet) == null || t.insertRule(n, yt.sheet.cssRules.length);
  }
}
const mf = {
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
let Ue = null;
function X_() {
  return Ue ? Ue.classList.toggle("dark") : !1;
}
function q_(e) {
  Ue && (e ? Ue.classList.add("dark") : Ue.classList.remove("dark"));
}
function J_() {
  return (Ue == null ? void 0 : Ue.classList.contains("dark")) ?? !1;
}
function vf(e, t) {
  Ue = e;
  const n = { ...mf, ...t };
  for (const [o, r] of Object.entries(n))
    e.style.setProperty(o, r);
  e.style.backgroundColor = n["--vo-background"], e.style.color = n["--vo-text"], e.style.borderColor = n["--vo-border"], e.style.caretColor = n["--vo-text"], e.style.fontFamily = n["--vo-font-family"], e.style.fontSize = "14px";
}
const gf = [
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
  "ON",
  "CS",
  "ON",
  "CS",
  "ON",
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
  "ON",
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
  "ON",
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
], bf = [
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "CS",
  "AL",
  "ON",
  "ON",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AN",
  "AN",
  "AN",
  "AN",
  "AN",
  "AN",
  "AN",
  "AN",
  "AN",
  "AN",
  "ET",
  "AN",
  "AN",
  "AL",
  "AL",
  "AL",
  "NSM",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "ON",
  "NSM",
  "NSM",
  "NSM",
  "NSM",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL",
  "AL"
];
function wf(e) {
  return e <= 255 ? gf[e] : 1424 <= e && e <= 1524 ? "R" : 1536 <= e && e <= 1791 ? bf[e & 255] : 1792 <= e && e <= 2220 ? "AL" : "L";
}
function yf(e) {
  const t = e.length;
  if (t === 0)
    return null;
  const n = new Array(t);
  let o = 0;
  for (let c = 0; c < t; c++) {
    const u = wf(e.charCodeAt(c));
    (u === "R" || u === "AL" || u === "AN") && o++, n[c] = u;
  }
  if (o === 0)
    return null;
  const r = t / o < 0.3 ? 0 : 1, i = new Int8Array(t);
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
    i[c] & 1 ? (u === "L" || u === "AN" || u === "EN") && i[c]++ : u === "R" ? i[c]++ : (u === "AN" || u === "EN") && (i[c] += 2);
  }
  return i;
}
function _f(e, t) {
  const n = yf(e);
  if (n === null)
    return null;
  const o = new Int8Array(t.length);
  for (let r = 0; r < t.length; r++)
    o[r] = n[t[r]];
  return o;
}
const xf = /[ \t\n\r\f]+/g, Cf = /[\t\n\r\f]| {2,}|^ | $/;
function Sf(e) {
  const t = e ?? "normal";
  return t === "pre-wrap" ? { mode: t, preserveOrdinarySpaces: !0, preserveHardBreaks: !0 } : { mode: t, preserveOrdinarySpaces: !1, preserveHardBreaks: !1 };
}
function Af(e) {
  if (!Cf.test(e))
    return e;
  let t = e.replace(xf, " ");
  return t.charCodeAt(0) === 32 && (t = t.slice(1)), t.length > 0 && t.charCodeAt(t.length - 1) === 32 && (t = t.slice(0, -1)), t;
}
function kf(e) {
  return /[\r\f]/.test(e) ? e.replace(/\r\n/g, `
`).replace(/[\r\f]/g, `
`) : e.replace(/\r\n/g, `
`);
}
let Go = null, Nf;
function Pf() {
  return Go === null && (Go = new Intl.Segmenter(Nf, { granularity: "word" })), Go;
}
const Ef = new RegExp("\\p{Script=Arabic}", "u"), lo = new RegExp("\\p{M}", "u"), ba = new RegExp("\\p{Nd}", "u");
function hr(e) {
  return Ef.test(e);
}
function ct(e) {
  for (const t of e) {
    const n = t.codePointAt(0);
    if (n >= 19968 && n <= 40959 || n >= 13312 && n <= 19903 || n >= 131072 && n <= 173791 || n >= 173824 && n <= 177983 || n >= 177984 && n <= 178207 || n >= 178208 && n <= 183983 || n >= 183984 && n <= 191471 || n >= 196608 && n <= 201551 || n >= 63744 && n <= 64255 || n >= 194560 && n <= 195103 || n >= 12288 && n <= 12351 || n >= 12352 && n <= 12447 || n >= 12448 && n <= 12543 || n >= 44032 && n <= 55215 || n >= 65280 && n <= 65519)
      return !0;
  }
  return !1;
}
const wa = /* @__PURE__ */ new Set([
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
]), uo = /* @__PURE__ */ new Set([
  '"',
  "(",
  "[",
  "{",
  "“",
  "‘",
  "«",
  "‹",
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
]), Zr = /* @__PURE__ */ new Set([
  "'",
  "’"
]), hn = /* @__PURE__ */ new Set([
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
]), Tf = /* @__PURE__ */ new Set([
  ":",
  ".",
  "،",
  "؛"
]), Lf = /* @__PURE__ */ new Set([
  "၏"
]), Mf = /* @__PURE__ */ new Set([
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
function Rf(e) {
  if (Qr(e))
    return !0;
  let t = !1;
  for (const n of e) {
    if (hn.has(n)) {
      t = !0;
      continue;
    }
    if (!(t && lo.test(n)))
      return !1;
  }
  return t;
}
function Of(e) {
  for (const t of e)
    if (!wa.has(t) && !hn.has(t))
      return !1;
  return e.length > 0;
}
function If(e) {
  if (Qr(e))
    return !0;
  for (const t of e)
    if (!uo.has(t) && !Zr.has(t) && !lo.test(t))
      return !1;
  return e.length > 0;
}
function Qr(e) {
  let t = !1;
  for (const n of e)
    if (!(n === "\\" || lo.test(n))) {
      if (uo.has(n) || hn.has(n) || Zr.has(n)) {
        t = !0;
        continue;
      }
      return !1;
    }
  return t;
}
function Df(e) {
  const t = Array.from(e);
  let n = t.length;
  for (; n > 0; ) {
    const o = t[n - 1];
    if (lo.test(o)) {
      n--;
      continue;
    }
    if (uo.has(o) || Zr.has(o)) {
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
function Ff(e, t) {
  if (e.length === 0)
    return !1;
  for (const n of e)
    if (n !== t)
      return !1;
  return !0;
}
function Bf(e) {
  return !hr(e) || e.length === 0 ? !1 : Tf.has(e[e.length - 1]);
}
function $f(e) {
  return e.length === 0 ? !1 : Lf.has(e[e.length - 1]);
}
function Wf(e) {
  if (e.length < 2 || e[0] !== " ")
    return null;
  const t = e.slice(1);
  return new RegExp("^\\p{M}+$", "u").test(t) ? { space: " ", marks: t } : null;
}
function ya(e) {
  for (let t = e.length - 1; t >= 0; t--) {
    const n = e[t];
    if (Mf.has(n))
      return !0;
    if (!hn.has(n))
      return !1;
  }
  return !1;
}
function Hf(e, t) {
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
function Vf(e, t, n, o) {
  const r = [];
  let i = null, s = "", a = n, l = !1, c = 0;
  for (const u of e) {
    const d = Hf(u, o), f = d === "text" && t;
    if (i !== null && d === i && f === l) {
      s += u, c += u.length;
      continue;
    }
    i !== null && r.push({
      text: s,
      isWordLike: l,
      kind: i,
      start: a
    }), i = d, s = u, a = n + c, l = f, c += u.length;
  }
  return i !== null && r.push({
    text: s,
    isWordLike: l,
    kind: i,
    start: a
  }), r;
}
function mr(e) {
  return e === "space" || e === "preserved-space" || e === "zero-width-break" || e === "hard-break";
}
const Uf = /^[A-Za-z][A-Za-z0-9+.-]*:$/;
function jf(e, t) {
  const n = e.texts[t];
  return n.startsWith("www.") ? !0 : Uf.test(n) && t + 1 < e.len && e.kinds[t + 1] === "text" && e.texts[t + 1] === "//";
}
function zf(e) {
  return e.includes("?") && (e.includes("://") || e.startsWith("www."));
}
function Kf(e) {
  const t = e.texts.slice(), n = e.isWordLike.slice(), o = e.kinds.slice(), r = e.starts.slice();
  for (let s = 0; s < e.len; s++) {
    if (o[s] !== "text" || !jf(e, s))
      continue;
    let a = s + 1;
    for (; a < e.len && !mr(o[a]); ) {
      t[s] += t[a], n[s] = !0;
      const l = t[a].includes("?");
      if (o[a] = "text", t[a] = "", a++, l)
        break;
    }
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
function Gf(e) {
  const t = [], n = [], o = [], r = [];
  for (let i = 0; i < e.len; i++) {
    const s = e.texts[i];
    if (t.push(s), n.push(e.isWordLike[i]), o.push(e.kinds[i]), r.push(e.starts[i]), !zf(s))
      continue;
    const a = i + 1;
    if (a >= e.len || mr(e.kinds[a]))
      continue;
    let l = "";
    const c = e.starts[a];
    let u = a;
    for (; u < e.len && !mr(e.kinds[u]); )
      l += e.texts[u], u++;
    l.length > 0 && (t.push(l), n.push(!0), o.push("text"), r.push(c), i = u - 1);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
const Yf = /* @__PURE__ */ new Set([
  ":",
  "-",
  "/",
  "×",
  ",",
  ".",
  "+",
  "–",
  "—"
]), os = /^[A-Za-z0-9_]+[,:;]*$/, Xf = /[,:;]+$/;
function _a(e) {
  for (const t of e)
    if (ba.test(t))
      return !0;
  return !1;
}
function vr(e) {
  if (e.length === 0)
    return !1;
  for (const t of e)
    if (!(ba.test(t) || Yf.has(t)))
      return !1;
  return !0;
}
function qf(e) {
  const t = [], n = [], o = [], r = [];
  for (let i = 0; i < e.len; i++) {
    const s = e.texts[i], a = e.kinds[i];
    if (a === "text" && vr(s) && _a(s)) {
      let l = s, c = i + 1;
      for (; c < e.len && e.kinds[c] === "text" && vr(e.texts[c]); )
        l += e.texts[c], c++;
      t.push(l), n.push(!0), o.push("text"), r.push(e.starts[i]), i = c - 1;
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
function Jf(e) {
  const t = [], n = [], o = [], r = [];
  for (let i = 0; i < e.len; i++) {
    const s = e.texts[i], a = e.kinds[i], l = e.isWordLike[i];
    if (a === "text" && l && os.test(s)) {
      let c = s, u = i + 1;
      for (; Xf.test(c) && u < e.len && e.kinds[u] === "text" && e.isWordLike[u] && os.test(e.texts[u]); )
        c += e.texts[u], u++;
      t.push(c), n.push(!0), o.push("text"), r.push(e.starts[i]), i = u - 1;
      continue;
    }
    t.push(s), n.push(l), o.push(a), r.push(e.starts[i]);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function Zf(e) {
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
        (u.length === 0 || !_a(u) || !vr(u)) && (l = !1);
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
function Qf(e) {
  const t = [], n = [], o = [], r = [];
  let i = 0;
  for (; i < e.len; ) {
    let s = e.texts[i], a = e.isWordLike[i], l = e.kinds[i], c = e.starts[i];
    if (l === "glue") {
      let u = s;
      const d = c;
      for (i++; i < e.len && e.kinds[i] === "glue"; )
        u += e.texts[i], i++;
      if (i < e.len && e.kinds[i] === "text")
        s = u + e.texts[i], a = e.isWordLike[i], l = "text", c = d, i++;
      else {
        t.push(u), n.push(!1), o.push("glue"), r.push(d);
        continue;
      }
    } else
      i++;
    if (l === "text")
      for (; i < e.len && e.kinds[i] === "glue"; ) {
        let u = "";
        for (; i < e.len && e.kinds[i] === "glue"; )
          u += e.texts[i], i++;
        if (i < e.len && e.kinds[i] === "text") {
          s += u + e.texts[i], a = a || e.isWordLike[i], i++;
          continue;
        }
        s += u;
      }
    t.push(s), n.push(a), o.push(l), r.push(c);
  }
  return {
    len: t.length,
    texts: t,
    isWordLike: n,
    kinds: o,
    starts: r
  };
}
function ep(e) {
  const t = e.texts.slice(), n = e.isWordLike.slice(), o = e.kinds.slice(), r = e.starts.slice();
  for (let i = 0; i < t.length - 1; i++) {
    if (o[i] !== "text" || o[i + 1] !== "text" || !ct(t[i]) || !ct(t[i + 1]))
      continue;
    const s = Df(t[i]);
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
function tp(e, t, n) {
  const o = Pf();
  let r = 0;
  const i = [], s = [], a = [], l = [];
  for (const f of o.segment(e))
    for (const p of Vf(f.segment, f.isWordLike ?? !1, f.index, n)) {
      const m = p.kind === "text";
      t.carryCJKAfterClosingQuote && m && r > 0 && a[r - 1] === "text" && ct(p.text) && ct(i[r - 1]) && ya(i[r - 1]) || m && r > 0 && a[r - 1] === "text" && Of(p.text) && ct(i[r - 1]) || m && r > 0 && a[r - 1] === "text" && $f(i[r - 1]) ? (i[r - 1] += p.text, s[r - 1] = s[r - 1] || p.isWordLike) : m && r > 0 && a[r - 1] === "text" && p.isWordLike && hr(p.text) && Bf(i[r - 1]) ? (i[r - 1] += p.text, s[r - 1] = !0) : m && !p.isWordLike && r > 0 && a[r - 1] === "text" && p.text.length === 1 && p.text !== "-" && p.text !== "—" && Ff(i[r - 1], p.text) || m && !p.isWordLike && r > 0 && a[r - 1] === "text" && (Rf(p.text) || p.text === "-" && s[r - 1]) ? i[r - 1] += p.text : (i[r] = p.text, s[r] = p.isWordLike, a[r] = p.kind, l[r] = p.start, r++);
    }
  for (let f = 1; f < r; f++)
    a[f] === "text" && !s[f] && Qr(i[f]) && a[f - 1] === "text" && (i[f - 1] += i[f], s[f - 1] = s[f - 1] || s[f], i[f] = "");
  for (let f = r - 2; f >= 0; f--)
    if (a[f] === "text" && !s[f] && If(i[f])) {
      let p = f + 1;
      for (; p < r && i[p] === ""; )
        p++;
      p < r && a[p] === "text" && (i[p] = i[f] + i[p], l[p] = l[f], i[f] = "");
    }
  let c = 0;
  for (let f = 0; f < r; f++) {
    const p = i[f];
    p.length !== 0 && (c !== f && (i[c] = p, s[c] = s[f], a[c] = a[f], l[c] = l[f]), c++);
  }
  i.length = c, s.length = c, a.length = c, l.length = c;
  const u = Qf({
    len: c,
    texts: i,
    isWordLike: s,
    kinds: a,
    starts: l
  }), d = ep(Jf(Zf(qf(Gf(Kf(u))))));
  for (let f = 0; f < d.len - 1; f++) {
    const p = Wf(d.texts[f]);
    p !== null && (d.kinds[f] !== "space" && d.kinds[f] !== "preserved-space" || d.kinds[f + 1] !== "text" || !hr(d.texts[f + 1]) || (d.texts[f] = p.space, d.isWordLike[f] = !1, d.kinds[f] = d.kinds[f] === "preserved-space" ? "preserved-space" : "space", d.texts[f + 1] = p.marks + d.texts[f + 1], d.starts[f + 1] = d.starts[f] + p.space.length));
  }
  return d;
}
function np(e, t) {
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
function op(e, t, n = "normal") {
  const o = Sf(n), r = o.mode === "pre-wrap" ? kf(e) : Af(e);
  if (r.length === 0)
    return {
      normalized: r,
      chunks: [],
      len: 0,
      texts: [],
      isWordLike: [],
      kinds: [],
      starts: []
    };
  const i = tp(r, t, o);
  return {
    normalized: r,
    chunks: np(i, o),
    ...i
  };
}
let _t = null;
const rs = /* @__PURE__ */ new Map();
let xt = null;
const rp = new RegExp("\\p{Emoji_Presentation}", "u"), ip = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;
let Yo = null;
const is = /* @__PURE__ */ new Map();
function ei() {
  if (_t !== null)
    return _t;
  if (typeof OffscreenCanvas < "u")
    return _t = new OffscreenCanvas(1, 1).getContext("2d"), _t;
  if (typeof document < "u")
    return _t = document.createElement("canvas").getContext("2d"), _t;
  throw new Error("Text measurement requires OffscreenCanvas or a DOM canvas context.");
}
function sp(e) {
  let t = rs.get(e);
  return t || (t = /* @__PURE__ */ new Map(), rs.set(e, t)), t;
}
function st(e, t) {
  let n = t.get(e);
  return n === void 0 && (n = {
    width: ei().measureText(e).width,
    containsCJK: ct(e)
  }, t.set(e, n)), n;
}
function mn() {
  if (xt !== null)
    return xt;
  if (typeof navigator > "u")
    return xt = {
      lineFitEpsilon: 5e-3,
      carryCJKAfterClosingQuote: !1,
      preferPrefixWidthsForBreakableRuns: !1,
      preferEarlySoftHyphenBreak: !1
    }, xt;
  const e = navigator.userAgent, n = navigator.vendor === "Apple Computer, Inc." && e.includes("Safari/") && !e.includes("Chrome/") && !e.includes("Chromium/") && !e.includes("CriOS/") && !e.includes("FxiOS/") && !e.includes("EdgiOS/"), o = e.includes("Chrome/") || e.includes("Chromium/") || e.includes("CriOS/") || e.includes("Edg/");
  return xt = {
    lineFitEpsilon: n ? 1 / 64 : 5e-3,
    carryCJKAfterClosingQuote: o,
    preferPrefixWidthsForBreakableRuns: n,
    preferEarlySoftHyphenBreak: n
  }, xt;
}
function ap(e) {
  const t = e.match(/(\d+(?:\.\d+)?)\s*px/);
  return t ? parseFloat(t[1]) : 16;
}
function ti() {
  return Yo === null && (Yo = new Intl.Segmenter(void 0, { granularity: "grapheme" })), Yo;
}
function cp(e) {
  return rp.test(e) || e.includes("️");
}
function lp(e) {
  return ip.test(e);
}
function up(e, t) {
  let n = is.get(e);
  if (n !== void 0)
    return n;
  const o = ei();
  o.font = e;
  const r = o.measureText("😀").width;
  if (n = 0, r > t + 0.5 && typeof document < "u" && document.body !== null) {
    const i = document.createElement("span");
    i.style.font = e, i.style.display = "inline-block", i.style.visibility = "hidden", i.style.position = "absolute", i.textContent = "😀", document.body.appendChild(i);
    const s = i.getBoundingClientRect().width;
    document.body.removeChild(i), r - s > 0.5 && (n = r - s);
  }
  return is.set(e, n), n;
}
function dp(e) {
  let t = 0;
  const n = ti();
  for (const o of n.segment(e))
    cp(o.segment) && t++;
  return t;
}
function fp(e, t) {
  return t.emojiCount === void 0 && (t.emojiCount = dp(e)), t.emojiCount;
}
function at(e, t, n) {
  return n === 0 ? t.width : t.width - fp(e, t) * n;
}
function pp(e, t, n, o) {
  if (t.graphemeWidths !== void 0)
    return t.graphemeWidths;
  const r = [], i = ti();
  for (const s of i.segment(e)) {
    const a = st(s.segment, n);
    r.push(at(s.segment, a, o));
  }
  return t.graphemeWidths = r.length > 1 ? r : null, t.graphemeWidths;
}
function hp(e, t, n, o) {
  if (t.graphemePrefixWidths !== void 0)
    return t.graphemePrefixWidths;
  const r = [], i = ti();
  let s = "";
  for (const a of i.segment(e)) {
    s += a.segment;
    const l = st(s, n);
    r.push(at(s, l, o));
  }
  return t.graphemePrefixWidths = r.length > 1 ? r : null, t.graphemePrefixWidths;
}
function mp(e, t) {
  const n = ei();
  n.font = e;
  const o = sp(e), r = ap(e), i = t ? up(e, r) : 0;
  return { cache: o, fontSize: r, emojiCorrection: i };
}
function Yn(e) {
  return e === "space" || e === "preserved-space" || e === "tab" || e === "zero-width-break" || e === "soft-hyphen";
}
function vp(e) {
  return e === "space";
}
function gp(e, t) {
  if (t <= 0)
    return 0;
  const n = e % t;
  return Math.abs(n) <= 1e-6 ? t : t - n;
}
function ni(e, t, n, o) {
  return !o || t === null ? e[n] : t[n] - (n > 0 ? t[n - 1] : 0);
}
function bp(e, t, n, o, r, i) {
  let s = 0, a = t;
  for (; s < e.length; ) {
    const l = i ? t + e[s] : a + e[s];
    if ((s + 1 < e.length ? l + r : l) > n + o)
      break;
    a = l, s++;
  }
  return { fitCount: s, fittedWidth: a };
}
function wp(e, t) {
  return e.simpleLineWalkFastPath ? yp(e, t) : xa(e, t);
}
function yp(e, t) {
  const { widths: n, kinds: o, breakableWidths: r, breakablePrefixWidths: i } = e;
  if (n.length === 0)
    return 0;
  const s = mn(), a = s.lineFitEpsilon;
  let l = 0, c = 0, u = !1;
  function d(f) {
    const p = n[f];
    if (p > t && r[f] !== null) {
      const m = r[f], h = i[f] ?? null;
      c = 0;
      for (let v = 0; v < m.length; v++) {
        const g = ni(m, h, v, s.preferPrefixWidthsForBreakableRuns);
        c > 0 && c + g > t + a ? (l++, c = g) : (c === 0 && l++, c += g);
      }
    } else
      c = p, l++;
    u = !0;
  }
  for (let f = 0; f < n.length; f++) {
    const p = n[f], m = o[f];
    if (!u) {
      d(f);
      continue;
    }
    const h = c + p;
    if (h > t + a) {
      if (vp(m))
        continue;
      c = 0, u = !1, d(f);
      continue;
    }
    c = h;
  }
  return u ? l : l + 1;
}
function _p(e, t, n) {
  const { widths: o, kinds: r, breakableWidths: i, breakablePrefixWidths: s } = e;
  if (o.length === 0)
    return 0;
  const a = mn(), l = a.lineFitEpsilon;
  let c = 0, u = 0, d = !1, f = 0, p = 0, m = 0, h = 0, v = -1, g = 0;
  function w() {
    v = -1, g = 0;
  }
  function y(C = m, O = h, W = u) {
    c++, n == null || n({
      startSegmentIndex: f,
      startGraphemeIndex: p,
      endSegmentIndex: C,
      endGraphemeIndex: O,
      width: W
    }), u = 0, d = !1, w();
  }
  function x(C, O) {
    d = !0, f = C, p = 0, m = C + 1, h = 0, u = O;
  }
  function k(C, O, W) {
    d = !0, f = C, p = O, m = C, h = O + 1, u = W;
  }
  function A(C, O) {
    if (!d) {
      x(C, O);
      return;
    }
    u += O, m = C + 1, h = 0;
  }
  function S(C, O) {
    Yn(r[C]) && (v = C + 1, g = u - O);
  }
  function M(C) {
    L(C, 0);
  }
  function L(C, O) {
    const W = i[C], V = s[C] ?? null;
    for (let z = O; z < W.length; z++) {
      const B = ni(W, V, z, a.preferPrefixWidthsForBreakableRuns);
      if (!d) {
        k(C, z, B);
        continue;
      }
      u + B > t + l ? (y(), k(C, z, B)) : (u += B, m = C, h = z + 1);
    }
    d && m === C && h === W.length && (m = C + 1, h = 0);
  }
  let E = 0;
  for (; E < o.length; ) {
    const C = o[E], O = r[E];
    if (!d) {
      C > t && i[E] !== null ? M(E) : x(E, C), S(E, C), E++;
      continue;
    }
    if (u + C > t + l) {
      if (Yn(O)) {
        A(E, C), y(E + 1, 0, u - C), E++;
        continue;
      }
      if (v >= 0) {
        y(v, 0, g);
        continue;
      }
      if (C > t && i[E] !== null) {
        y(), M(E), E++;
        continue;
      }
      y();
      continue;
    }
    A(E, C), S(E, C), E++;
  }
  return d && y(), c;
}
function xa(e, t, n) {
  if (e.simpleLineWalkFastPath)
    return _p(e, t, n);
  const { widths: o, lineEndFitAdvances: r, lineEndPaintAdvances: i, kinds: s, breakableWidths: a, breakablePrefixWidths: l, discretionaryHyphenWidth: c, tabStopAdvance: u, chunks: d } = e;
  if (o.length === 0 || d.length === 0)
    return 0;
  const f = mn(), p = f.lineFitEpsilon;
  let m = 0, h = 0, v = !1, g = 0, w = 0, y = 0, x = 0, k = -1, A = 0, S = 0, M = null;
  function L() {
    k = -1, A = 0, S = 0, M = null;
  }
  function E(N = y, D = x, j = h) {
    m++, n == null || n({
      startSegmentIndex: g,
      startGraphemeIndex: w,
      endSegmentIndex: N,
      endGraphemeIndex: D,
      width: j
    }), h = 0, v = !1, L();
  }
  function C(N, D) {
    v = !0, g = N, w = 0, y = N + 1, x = 0, h = D;
  }
  function O(N, D, j) {
    v = !0, g = N, w = D, y = N, x = D + 1, h = j;
  }
  function W(N, D) {
    if (!v) {
      C(N, D);
      return;
    }
    h += D, y = N + 1, x = 0;
  }
  function V(N, D) {
    if (!Yn(s[N]))
      return;
    const j = s[N] === "tab" ? 0 : r[N], q = s[N] === "tab" ? D : i[N];
    k = N + 1, A = h - D + j, S = h - D + q, M = s[N];
  }
  function z(N) {
    B(N, 0);
  }
  function B(N, D) {
    const j = a[N], q = l[N] ?? null;
    for (let J = D; J < j.length; J++) {
      const ae = ni(j, q, J, f.preferPrefixWidthsForBreakableRuns);
      if (!v) {
        O(N, J, ae);
        continue;
      }
      h + ae > t + p ? (E(), O(N, J, ae)) : (h += ae, y = N, x = J + 1);
    }
    v && y === N && x === j.length && (y = N + 1, x = 0);
  }
  function U(N) {
    if (M !== "soft-hyphen")
      return !1;
    const D = a[N];
    if (D === null)
      return !1;
    const j = f.preferPrefixWidthsForBreakableRuns ? l[N] ?? D : D, q = j !== D, { fitCount: J, fittedWidth: ae } = bp(j, h, t, p, c, q);
    return J === 0 ? !1 : (h = ae, y = N, x = J, L(), J === D.length ? (y = N + 1, x = 0, !0) : (E(N, J, ae + c), B(N, J), !0));
  }
  function I(N) {
    m++, n == null || n({
      startSegmentIndex: N.startSegmentIndex,
      startGraphemeIndex: 0,
      endSegmentIndex: N.consumedEndSegmentIndex,
      endGraphemeIndex: 0,
      width: 0
    }), L();
  }
  for (let N = 0; N < d.length; N++) {
    const D = d[N];
    if (D.startSegmentIndex === D.endSegmentIndex) {
      I(D);
      continue;
    }
    v = !1, h = 0, g = D.startSegmentIndex, w = 0, y = D.startSegmentIndex, x = 0, L();
    let j = D.startSegmentIndex;
    for (; j < D.endSegmentIndex; ) {
      const q = s[j], J = q === "tab" ? gp(h, u) : o[j];
      if (q === "soft-hyphen") {
        v && (y = j + 1, x = 0, k = j + 1, A = h + c, S = h + c, M = q), j++;
        continue;
      }
      if (!v) {
        J > t && a[j] !== null ? z(j) : C(j, J), V(j, J), j++;
        continue;
      }
      if (h + J > t + p) {
        const Se = h + (q === "tab" ? 0 : r[j]), he = h + (q === "tab" ? J : i[j]);
        if (M === "soft-hyphen" && f.preferEarlySoftHyphenBreak && A <= t + p) {
          E(k, 0, S);
          continue;
        }
        if (M === "soft-hyphen" && U(j)) {
          j++;
          continue;
        }
        if (Yn(q) && Se <= t + p) {
          W(j, J), E(j + 1, 0, he), j++;
          continue;
        }
        if (k >= 0 && A <= t + p) {
          E(k, 0, S);
          continue;
        }
        if (J > t && a[j] !== null) {
          E(), z(j), j++;
          continue;
        }
        E();
        continue;
      }
      W(j, J), V(j, J), j++;
    }
    if (v) {
      const q = k === D.consumedEndSegmentIndex ? S : h;
      E(D.consumedEndSegmentIndex, 0, q);
    }
  }
  return m;
}
let Xo = null, ss = /* @__PURE__ */ new WeakMap();
function Ca() {
  return Xo === null && (Xo = new Intl.Segmenter(void 0, { granularity: "grapheme" })), Xo;
}
function xp(e) {
  return e ? {
    widths: [],
    lineEndFitAdvances: [],
    lineEndPaintAdvances: [],
    kinds: [],
    simpleLineWalkFastPath: !0,
    segLevels: null,
    breakableWidths: [],
    breakablePrefixWidths: [],
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
    breakableWidths: [],
    breakablePrefixWidths: [],
    discretionaryHyphenWidth: 0,
    tabStopAdvance: 0,
    chunks: []
  };
}
function Cp(e, t, n) {
  const o = Ca(), r = mn(), { cache: i, emojiCorrection: s } = mp(t, lp(e.normalized)), a = at("-", st("-", i), s), c = at(" ", st(" ", i), s) * 8;
  if (e.len === 0)
    return xp(n);
  const u = [], d = [], f = [], p = [];
  let m = e.chunks.length <= 1;
  const h = n ? [] : null, v = [], g = [], w = n ? [] : null, y = Array.from({ length: e.len }), x = Array.from({ length: e.len });
  function k(M, L, E, C, O, W, V, z) {
    O !== "text" && O !== "space" && O !== "zero-width-break" && (m = !1), u.push(L), d.push(E), f.push(C), p.push(O), h == null || h.push(W), v.push(V), g.push(z), w !== null && w.push(M);
  }
  for (let M = 0; M < e.len; M++) {
    y[M] = u.length;
    const L = e.texts[M], E = e.isWordLike[M], C = e.kinds[M], O = e.starts[M];
    if (C === "soft-hyphen") {
      k(L, 0, a, a, C, O, null, null), x[M] = u.length;
      continue;
    }
    if (C === "hard-break") {
      k(L, 0, 0, 0, C, O, null, null), x[M] = u.length;
      continue;
    }
    if (C === "tab") {
      k(L, 0, 0, 0, C, O, null, null), x[M] = u.length;
      continue;
    }
    const W = st(L, i);
    if (C === "text" && W.containsCJK) {
      let U = "", I = 0;
      for (const N of o.segment(L)) {
        const D = N.segment;
        if (U.length === 0) {
          U = D, I = N.index;
          continue;
        }
        if (uo.has(U) || wa.has(D) || hn.has(D) || r.carryCJKAfterClosingQuote && ct(D) && ya(U)) {
          U += D;
          continue;
        }
        const j = st(U, i), q = at(U, j, s);
        k(U, q, q, q, "text", O + I, null, null), U = D, I = N.index;
      }
      if (U.length > 0) {
        const N = st(U, i), D = at(U, N, s);
        k(U, D, D, D, "text", O + I, null, null);
      }
      x[M] = u.length;
      continue;
    }
    const V = at(L, W, s), z = C === "space" || C === "preserved-space" || C === "zero-width-break" ? 0 : V, B = C === "space" || C === "zero-width-break" ? 0 : V;
    if (E && L.length > 1) {
      const U = pp(L, W, i, s), I = r.preferPrefixWidthsForBreakableRuns ? hp(L, W, i, s) : null;
      k(L, V, z, B, C, O, U, I);
    } else
      k(L, V, z, B, C, O, null, null);
    x[M] = u.length;
  }
  const A = Sp(e.chunks, y, x), S = h === null ? null : _f(e.normalized, h);
  return w !== null ? {
    widths: u,
    lineEndFitAdvances: d,
    lineEndPaintAdvances: f,
    kinds: p,
    simpleLineWalkFastPath: m,
    segLevels: S,
    breakableWidths: v,
    breakablePrefixWidths: g,
    discretionaryHyphenWidth: a,
    tabStopAdvance: c,
    chunks: A,
    segments: w
  } : {
    widths: u,
    lineEndFitAdvances: d,
    lineEndPaintAdvances: f,
    kinds: p,
    simpleLineWalkFastPath: m,
    segLevels: S,
    breakableWidths: v,
    breakablePrefixWidths: g,
    discretionaryHyphenWidth: a,
    tabStopAdvance: c,
    chunks: A
  };
}
function Sp(e, t, n) {
  const o = [];
  for (let r = 0; r < e.length; r++) {
    const i = e[r], s = i.startSegmentIndex < t.length ? t[i.startSegmentIndex] : n[n.length - 1] ?? 0, a = i.endSegmentIndex < t.length ? t[i.endSegmentIndex] : n[n.length - 1] ?? 0, l = i.consumedEndSegmentIndex < t.length ? t[i.consumedEndSegmentIndex] : n[n.length - 1] ?? 0;
    o.push({
      startSegmentIndex: s,
      endSegmentIndex: a,
      consumedEndSegmentIndex: l
    });
  }
  return o;
}
function Sa(e, t, n, o) {
  const r = op(e, mn(), o == null ? void 0 : o.whiteSpace);
  return Cp(r, t, n);
}
function Ap(e, t, n) {
  return Sa(e, t, !1, n);
}
function kp(e, t, n) {
  return Sa(e, t, !0, n);
}
function Np(e, t, n) {
  const o = wp(e, t);
  return { lineCount: o, height: o * n };
}
function as(e, t, n) {
  let o = n.get(e);
  if (o !== void 0)
    return o;
  o = [];
  const r = Ca();
  for (const i of r.segment(t[e]))
    o.push(i.segment);
  return n.set(e, o), o;
}
function Pp(e) {
  let t = ss.get(e);
  return t !== void 0 || (t = /* @__PURE__ */ new Map(), ss.set(e, t)), t;
}
function Ep(e, t, n, o) {
  return o > 0 && e[o - 1] === "soft-hyphen" && !(t === o && n > 0);
}
function Tp(e, t, n, o, r, i, s) {
  let a = "";
  const l = Ep(t, o, r, i);
  for (let c = o; c < i; c++)
    t[c] === "soft-hyphen" || t[c] === "hard-break" || (c === o && r > 0 ? a += as(c, e, n).slice(r).join("") : a += e[c]);
  return s > 0 ? (l && (a += "-"), a += as(i, e, n).slice(o === i ? r : 0, s).join("")) : l && (a += "-"), a;
}
function Lp(e, t, n, o, r, i, s) {
  return {
    text: Tp(e.segments, e.kinds, t, o, r, i, s),
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
function Mp(e, t, n) {
  return Lp(e, t, n.width, n.startSegmentIndex, n.startGraphemeIndex, n.endSegmentIndex, n.endGraphemeIndex);
}
function Aa(e, t, n) {
  const o = [];
  if (e.widths.length === 0)
    return { lineCount: 0, height: 0, lines: o };
  const r = Pp(e), i = xa(e, t, (s) => {
    o.push(Mp(e, r, s));
  });
  return { lineCount: i, height: i * n, lines: o };
}
const En = /* @__PURE__ */ new Map(), Tn = /* @__PURE__ */ new Map(), Rp = 500;
function ka(e, t) {
  return `${t}\0${e}`;
}
function Na(e) {
  if (e.size >= Rp) {
    const t = e.keys().next().value;
    e.delete(t);
  }
}
function Pa(e, t, n) {
  return e.delete(t), e.set(t, n), n;
}
function Ea(e) {
  return e === 1 ? { whiteSpace: "pre-wrap" } : void 0;
}
function Op(e, t, n = 0) {
  const o = `${n}\0${ka(e, t)}`;
  let r = En.get(o);
  return r ? Pa(En, o, r) : (r = Ap(e, t, Ea(n)), Na(En), En.set(o, r), r);
}
function Ta(e, t, n = 0) {
  const o = `${n}\0${ka(e, t)}`;
  let r = Tn.get(o);
  return r ? Pa(Tn, o, r) : (r = kp(e, t, Ea(n)), Na(Tn), Tn.set(o, r), r);
}
function Z_(e, t, n, o, r = 0) {
  const i = Op(e, t, r), s = Np(i, n, o), a = new ArrayBuffer(12), l = new DataView(a);
  return l.setFloat64(0, s.height, !0), l.setInt32(8, s.lineCount, !0), new Uint8Array(a);
}
function Q_(e, t, n, o, r = 0) {
  const i = Ta(e, t, r), s = Aa(i, n, o), a = new TextEncoder(), l = s.lines.map((m) => a.encode(m.text));
  let c = 16;
  for (const m of l)
    c += 2 + m.length + 8;
  const u = new ArrayBuffer(c), d = new DataView(u), f = new Uint8Array(u);
  let p = 0;
  d.setFloat64(p, s.height, !0), p += 8, d.setInt32(p, s.lineCount, !0), p += 4, d.setInt32(p, s.lines.length, !0), p += 4;
  for (let m = 0; m < s.lines.length; m++) {
    const h = s.lines[m], v = l[m];
    d.setUint16(p, v.length, !0), p += 2, f.set(v, p), p += v.length, d.setFloat64(p, h.width, !0), p += 8;
  }
  return new Uint8Array(u, 0, p);
}
function Ip(e, t, n, o, r, i) {
  const s = e.font, a = Ta(t, s), { lines: l } = Aa(a, r, i);
  for (let c = 0; c < l.length; c++)
    e.fillText(l[c].text, n, o + c * i);
}
const cs = /* @__PURE__ */ new Map(), Ln = /* @__PURE__ */ new Set();
function qo(e) {
  const t = cs.get(e);
  if (t) return t;
  if (Ln.has(e)) return null;
  Ln.add(e);
  const n = new Image();
  return n.onload = () => {
    cs.set(e, n), Ln.delete(e);
  }, n.onerror = () => {
    Ln.delete(e), console.warn(`VoGUI: Failed to load image: ${e}`);
  }, n.src = e, null;
}
function Dp(e, t) {
  const n = t.get(e.ref);
  if (!n || !(n instanceof HTMLCanvasElement)) {
    console.warn(`VoGUI: Canvas ref "${e.ref}" not found or not a canvas element`);
    return;
  }
  const o = n.getContext("2d");
  if (o)
    for (const r of e.cmds)
      Fp(o, n, r);
}
function Fp(e, t, n) {
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
      ls(e, o[0], o[1], o[2], o[3], o[4]), e.fill();
      break;
    case "srr":
      ls(e, o[0], o[1], o[2], o[3], o[4]), e.stroke();
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
      Ip(e, o[0], o[1], o[2], o[3], o[4]);
      break;
    case "di": {
      const r = qo(o[0]);
      r && e.drawImage(r, o[1], o[2]);
      break;
    }
    case "dis": {
      const r = qo(o[0]);
      r && e.drawImage(r, o[1], o[2], o[3], o[4]);
      break;
    }
    case "disub": {
      const r = qo(o[0]);
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
function ls(e, t, n, o, r, i) {
  e.beginPath(), e.moveTo(t + i, n), e.lineTo(t + o - i, n), e.arcTo(t + o, n, t + o, n + i, i), e.lineTo(t + o, n + r - i), e.arcTo(t + o, n + r, t + o - i, n + r, i), e.lineTo(t + i, n + r), e.arcTo(t, n + r, t, n + r - i, i), e.lineTo(t, n + i), e.arcTo(t, n, t + i, n, i), e.closePath();
}
const Bp = {
  default: "bg-muted text-foreground hover:bg-muted/80",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  destructive: "bg-danger text-danger-foreground hover:bg-danger/90",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90",
  error: "bg-danger text-danger-foreground hover:bg-danger/90",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline bg-transparent"
}, $p = {
  xs: "h-7 px-2 text-xs rounded-sm",
  sm: "h-8 px-3 text-xs rounded-sm",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-6 text-sm rounded-md",
  xl: "h-12 px-8 text-base rounded-lg",
  icon: "h-9 w-9 rounded-md"
}, Wp = P(function(t, n) {
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
  } = t, f = c || "", p = ce(t), m = typeof r == "function" ? r : void 0, h = typeof r == "number" ? r : void 0, v = [
    "inline-flex items-center justify-center font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    Bp[i || "default"],
    $p[s || "md"],
    u,
    f
  ].filter(Boolean).join(" ");
  return _("button", {
    ...d,
    ref: n,
    className: v,
    style: p,
    disabled: a || !1,
    onClick: (g) => {
      m == null || m(g), !g.defaultPrevented && h != null && Z(h, "{}");
    }
  }, l ? _("span", { className: "vo-icon" }, l) : null, o != null ? String(o) : null);
});
function us(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function fo(...e) {
  return (t) => {
    let n = !1;
    const o = e.map((r) => {
      const i = us(r, t);
      return !n && typeof i == "function" && (n = !0), i;
    });
    if (n)
      return () => {
        for (let r = 0; r < o.length; r++) {
          const i = o[r];
          typeof i == "function" ? i() : us(e[r], null);
        }
      };
  };
}
function X(...e) {
  return H(fo(...e), e);
}
var Hp = 0;
function b(e, t, n, o, r, i) {
  t || (t = {});
  var s, a, l = t;
  if ("ref" in l) for (a in l = {}, t) a == "ref" ? s = t[a] : l[a] = t[a];
  var c = { type: e, props: l, key: n, ref: s, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --Hp, __i: -1, __u: 0, __source: r, __self: i };
  if (typeof e == "function" && (s = e.defaultProps)) for (a in s) l[a] === void 0 && (l[a] = s[a]);
  return Y.vnode && Y.vnode(c), c;
}
function pe(e, t = []) {
  let n = [];
  function o(i, s) {
    const a = dt(s), l = n.length;
    n = [...n, s];
    const c = (d) => {
      var g;
      const { scope: f, children: p, ...m } = d, h = ((g = f == null ? void 0 : f[e]) == null ? void 0 : g[l]) || a, v = de(() => m, Object.values(m));
      return /* @__PURE__ */ b(h.Provider, { value: v, children: p });
    };
    c.displayName = i + "Provider";
    function u(d, f) {
      var h;
      const p = ((h = f == null ? void 0 : f[e]) == null ? void 0 : h[l]) || a, m = et(p);
      if (m) return m;
      if (s !== void 0) return s;
      throw new Error(`\`${d}\` must be used within \`${i}\``);
    }
    return [c, u];
  }
  const r = () => {
    const i = n.map((s) => dt(s));
    return function(a) {
      const l = (a == null ? void 0 : a[e]) || i;
      return de(
        () => ({ [`__scope${e}`]: { ...a, [e]: l } }),
        [a, l]
      );
    };
  };
  return r.scopeName = e, [o, Vp(r, ...t)];
}
function Vp(...e) {
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
      return de(() => ({ [`__scope${t.scopeName}`]: s }), [s]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
function R(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(r) {
    if (e == null || e(r), n === !1 || !r.defaultPrevented)
      return t == null ? void 0 : t(r);
  };
}
var fe = globalThis != null && globalThis.document ? Ce : () => {
}, Up = ga[" useInsertionEffect ".trim().toString()] || fe;
function ge({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: o
}) {
  const [r, i, s] = jp({
    defaultProp: t,
    onChange: n
  }), a = e !== void 0, l = a ? e : r;
  {
    const u = T(e !== void 0);
    F(() => {
      const d = u.current;
      d !== a && console.warn(
        `${o} is changing from ${d ? "controlled" : "uncontrolled"} to ${a ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = a;
    }, [a, o]);
  }
  const c = H(
    (u) => {
      var d;
      if (a) {
        const f = zp(u) ? u(e) : u;
        f !== e && ((d = s.current) == null || d.call(s, f));
      } else
        i(u);
    },
    [a, e, i, s]
  );
  return [l, c];
}
function jp({
  defaultProp: e,
  onChange: t
}) {
  const [n, o] = $(e), r = T(n), i = T(t);
  return Up(() => {
    i.current = t;
  }, [t]), F(() => {
    var s;
    r.current !== n && ((s = i.current) == null || s.call(i, n), r.current = n);
  }, [n, r]), [n, o, i];
}
function zp(e) {
  return typeof e == "function";
}
function po(e) {
  const t = T({ value: e, previous: e });
  return de(() => (t.current.value !== e && (t.current.previous = t.current.value, t.current.value = e), t.current.previous), [e]);
}
function ho(e) {
  const [t, n] = $(void 0);
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
function Kp(e, t) {
  return fn((n, o) => t[n][o] ?? n, e);
}
var be = (e) => {
  const { present: t, children: n } = e, o = Gp(t), r = typeof n == "function" ? n({ present: o.isPresent }) : Ve.only(n), i = X(o.ref, Yp(r));
  return typeof n == "function" || o.isPresent ? Ft(r, { ref: i }) : null;
};
be.displayName = "Presence";
function Gp(e) {
  const [t, n] = $(), o = T(null), r = T(e), i = T("none"), s = e ? "mounted" : "unmounted", [a, l] = Kp(s, {
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
  return F(() => {
    const c = Mn(o.current);
    i.current = a === "mounted" ? c : "none";
  }, [a]), fe(() => {
    const c = o.current, u = r.current;
    if (u !== e) {
      const f = i.current, p = Mn(c);
      e ? l("MOUNT") : p === "none" || (c == null ? void 0 : c.display) === "none" ? l("UNMOUNT") : l(u && f !== p ? "ANIMATION_OUT" : "UNMOUNT"), r.current = e;
    }
  }, [e, l]), fe(() => {
    if (t) {
      let c;
      const u = t.ownerDocument.defaultView ?? window, d = (p) => {
        const h = Mn(o.current).includes(CSS.escape(p.animationName));
        if (p.target === t && h && (l("ANIMATION_END"), !r.current)) {
          const v = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", c = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = v);
          });
        }
      }, f = (p) => {
        p.target === t && (i.current = Mn(o.current));
      };
      return t.addEventListener("animationstart", f), t.addEventListener("animationcancel", d), t.addEventListener("animationend", d), () => {
        u.clearTimeout(c), t.removeEventListener("animationstart", f), t.removeEventListener("animationcancel", d), t.removeEventListener("animationend", d);
      };
    } else
      l("ANIMATION_END");
  }, [t, l]), {
    isPresent: ["mounted", "unmountSuspended"].includes(a),
    ref: H((c) => {
      o.current = c ? getComputedStyle(c) : null, n(c);
    }, [])
  };
}
function Mn(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function Yp(e) {
  var o, r;
  let t = (o = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (r = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
// @__NO_SIDE_EFFECTS__
function Mt(e) {
  const t = /* @__PURE__ */ Xp(e), n = P((o, r) => {
    const { children: i, ...s } = o, a = Ve.toArray(i), l = a.find(Jp);
    if (l) {
      const c = l.props.children, u = a.map((d) => d === l ? Ve.count(c) > 1 ? Ve.only(null) : ze(c) ? c.props.children : null : d);
      return /* @__PURE__ */ b(t, { ...s, ref: r, children: ze(c) ? Ft(c, void 0, u) : null });
    }
    return /* @__PURE__ */ b(t, { ...s, ref: r, children: i });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function Xp(e) {
  const t = P((n, o) => {
    const { children: r, ...i } = n;
    if (ze(r)) {
      const s = Qp(r), a = Zp(i, r.props);
      return r.type !== le && (a.ref = o ? fo(o, s) : s), Ft(r, a);
    }
    return Ve.count(r) > 1 ? Ve.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var La = Symbol("radix.slottable");
// @__NO_SIDE_EFFECTS__
function qp(e) {
  const t = ({ children: n }) => /* @__PURE__ */ b(le, { children: n });
  return t.displayName = `${e}.Slottable`, t.__radixId = La, t;
}
function Jp(e) {
  return ze(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === La;
}
function Zp(e, t) {
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
function Qp(e) {
  var o, r;
  let t = (o = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (r = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var eh = [
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
], K = eh.reduce((e, t) => {
  const n = /* @__PURE__ */ Mt(`Primitive.${t}`), o = P((r, i) => {
    const { asChild: s, ...a } = r, l = s ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ b(l, { ...a, ref: i });
  });
  return o.displayName = `Primitive.${t}`, { ...e, [t]: o };
}, {});
function Ma(e, t) {
  e && co(() => e.dispatchEvent(t));
}
var mo = "Checkbox", [th] = pe(mo), [nh, oi] = th(mo);
function oh(e) {
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
  } = e, [f, p] = ge({
    prop: n,
    defaultProp: r ?? !1,
    onChange: l,
    caller: mo
  }), [m, h] = $(null), [v, g] = $(null), w = T(!1), y = m ? !!s || !!m.closest("form") : (
    // We set this to true by default so that events bubble to forms without JS (SSR)
    !0
  ), x = {
    checked: f,
    disabled: i,
    setChecked: p,
    control: m,
    setControl: h,
    name: a,
    form: s,
    value: u,
    hasConsumerStoppedPropagationRef: w,
    required: c,
    defaultChecked: qe(r) ? !1 : r,
    isFormControl: y,
    bubbleInput: v,
    setBubbleInput: g
  };
  return /* @__PURE__ */ b(
    nh,
    {
      scope: t,
      ...x,
      children: rh(d) ? d(x) : o
    }
  );
}
var Ra = "CheckboxTrigger", Oa = P(
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
      bubbleInput: m
    } = oi(Ra, e), h = X(r, u), v = T(l);
    return F(() => {
      const g = i == null ? void 0 : i.form;
      if (g) {
        const w = () => d(v.current);
        return g.addEventListener("reset", w), () => g.removeEventListener("reset", w);
      }
    }, [i, d]), /* @__PURE__ */ b(
      K.button,
      {
        type: "button",
        role: "checkbox",
        "aria-checked": qe(l) ? "mixed" : l,
        "aria-required": c,
        "data-state": Wa(l),
        "data-disabled": a ? "" : void 0,
        disabled: a,
        value: s,
        ...o,
        ref: h,
        onKeyDown: R(t, (g) => {
          g.key === "Enter" && g.preventDefault();
        }),
        onClick: R(n, (g) => {
          d((w) => qe(w) ? !0 : !w), m && p && (f.current = g.isPropagationStopped(), f.current || g.stopPropagation());
        })
      }
    );
  }
);
Oa.displayName = Ra;
var Ia = P(
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
      oh,
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
        internal_do_not_use_render: ({ isFormControl: f }) => /* @__PURE__ */ b(le, { children: [
          /* @__PURE__ */ b(
            Oa,
            {
              ...d,
              ref: t,
              __scopeCheckbox: n
            }
          ),
          f && /* @__PURE__ */ b(
            $a,
            {
              __scopeCheckbox: n
            }
          )
        ] })
      }
    );
  }
);
Ia.displayName = mo;
var Da = "CheckboxIndicator", Fa = P(
  (e, t) => {
    const { __scopeCheckbox: n, forceMount: o, ...r } = e, i = oi(Da, n);
    return /* @__PURE__ */ b(
      be,
      {
        present: o || qe(i.checked) || i.checked === !0,
        children: /* @__PURE__ */ b(
          K.span,
          {
            "data-state": Wa(i.checked),
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
Fa.displayName = Da;
var Ba = "CheckboxBubbleInput", $a = P(
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
    } = oi(Ba, e), m = X(n, p), h = po(i), v = ho(o);
    F(() => {
      const w = f;
      if (!w) return;
      const y = window.HTMLInputElement.prototype, k = Object.getOwnPropertyDescriptor(
        y,
        "checked"
      ).set, A = !r.current;
      if (h !== i && k) {
        const S = new Event("click", { bubbles: A });
        w.indeterminate = qe(i), k.call(w, qe(i) ? !1 : i), w.dispatchEvent(S);
      }
    }, [f, h, i, r]);
    const g = T(qe(i) ? !1 : i);
    return /* @__PURE__ */ b(
      K.input,
      {
        type: "checkbox",
        "aria-hidden": !0,
        defaultChecked: s ?? g.current,
        required: a,
        disabled: l,
        name: c,
        value: u,
        form: d,
        ...t,
        tabIndex: -1,
        ref: m,
        style: {
          ...t.style,
          ...v,
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
$a.displayName = Ba;
function rh(e) {
  return typeof e == "function";
}
function qe(e) {
  return e === "indeterminate";
}
function Wa(e) {
  return qe(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function ih(e) {
  const { textContent: t, checked: n, onChange: o, disabled: r } = e, i = e.class || "", s = ce(e);
  return _(
    "label",
    {
      className: ["flex items-center gap-2 text-sm cursor-pointer", i].filter(Boolean).join(" "),
      style: s
    },
    _(
      Ia,
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
          o != null && Z(o, JSON.stringify({ Checked: a }));
        }
      },
      _(
        Fa,
        { className: "flex items-center justify-center text-current" },
        _(
          "svg",
          { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" },
          _("polyline", { points: "20 6 9 17 4 12" })
        )
      )
    ),
    t ? _("span", null, t) : null
  );
}
var vo = "Switch", [sh] = pe(vo), [ah, ch] = sh(vo), Ha = P(
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
    } = e, [f, p] = $(null), m = X(t, (y) => p(y)), h = T(!1), v = f ? u || !!f.closest("form") : !0, [g, w] = ge({
      prop: r,
      defaultProp: i ?? !1,
      onChange: c,
      caller: vo
    });
    return /* @__PURE__ */ b(ah, { scope: n, checked: g, disabled: a, children: [
      /* @__PURE__ */ b(
        K.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": g,
          "aria-required": s,
          "data-state": za(g),
          "data-disabled": a ? "" : void 0,
          disabled: a,
          value: l,
          ...d,
          ref: m,
          onClick: R(e.onClick, (y) => {
            w((x) => !x), v && (h.current = y.isPropagationStopped(), h.current || y.stopPropagation());
          })
        }
      ),
      v && /* @__PURE__ */ b(
        ja,
        {
          control: f,
          bubbles: !h.current,
          name: o,
          value: l,
          checked: g,
          required: s,
          disabled: a,
          form: u,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
Ha.displayName = vo;
var Va = "SwitchThumb", Ua = P(
  (e, t) => {
    const { __scopeSwitch: n, ...o } = e, r = ch(Va, n);
    return /* @__PURE__ */ b(
      K.span,
      {
        "data-state": za(r.checked),
        "data-disabled": r.disabled ? "" : void 0,
        ...o,
        ref: t
      }
    );
  }
);
Ua.displayName = Va;
var lh = "SwitchBubbleInput", ja = P(
  ({
    __scopeSwitch: e,
    control: t,
    checked: n,
    bubbles: o = !0,
    ...r
  }, i) => {
    const s = T(null), a = X(s, i), l = po(n), c = ho(t);
    return F(() => {
      const u = s.current;
      if (!u) return;
      const d = window.HTMLInputElement.prototype, p = Object.getOwnPropertyDescriptor(
        d,
        "checked"
      ).set;
      if (l !== n && p) {
        const m = new Event("click", { bubbles: o });
        p.call(u, n), u.dispatchEvent(m);
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
ja.displayName = lh;
function za(e) {
  return e ? "checked" : "unchecked";
}
var uh = Ha, dh = Ua;
function fh(e) {
  const { textContent: t, checked: n, onChange: o, disabled: r } = e, i = e.class || "", s = ce(e);
  return _(
    "label",
    {
      className: ["flex items-center gap-2 text-sm cursor-pointer", i].filter(Boolean).join(" "),
      style: s
    },
    _(
      uh,
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
          o != null && Z(o, JSON.stringify({ Checked: a }));
        }
      },
      _(dh, {
        className: [
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        ].join(" ")
      })
    ),
    t ? _("span", null, t) : null
  );
}
function Xn(e, [t, n]) {
  return Math.min(n, Math.max(t, e));
}
var ph = dt(void 0);
function Bt(e) {
  const t = et(ph);
  return e || t || "ltr";
}
function vn(e) {
  const t = e + "CollectionProvider", [n, o] = pe(t), [r, i] = n(
    t,
    { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
  ), s = (h) => {
    const { scope: v, children: g } = h, w = se.useRef(null), y = se.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ b(r, { scope: v, itemMap: y, collectionRef: w, children: g });
  };
  s.displayName = t;
  const a = e + "CollectionSlot", l = /* @__PURE__ */ Mt(a), c = se.forwardRef(
    (h, v) => {
      const { scope: g, children: w } = h, y = i(a, g), x = X(v, y.collectionRef);
      return /* @__PURE__ */ b(l, { ref: x, children: w });
    }
  );
  c.displayName = a;
  const u = e + "CollectionItemSlot", d = "data-radix-collection-item", f = /* @__PURE__ */ Mt(u), p = se.forwardRef(
    (h, v) => {
      const { scope: g, children: w, ...y } = h, x = se.useRef(null), k = X(v, x), A = i(u, g);
      return se.useEffect(() => (A.itemMap.set(x, { ref: x, ...y }), () => void A.itemMap.delete(x))), /* @__PURE__ */ b(f, { [d]: "", ref: k, children: w });
    }
  );
  p.displayName = u;
  function m(h) {
    const v = i(e + "CollectionConsumer", h);
    return se.useCallback(() => {
      const w = v.collectionRef.current;
      if (!w) return [];
      const y = Array.from(w.querySelectorAll(`[${d}]`));
      return Array.from(v.itemMap.values()).sort(
        (A, S) => y.indexOf(A.ref.current) - y.indexOf(S.ref.current)
      );
    }, [v.collectionRef, v.itemMap]);
  }
  return [
    { Provider: s, Slot: c, ItemSlot: p },
    m,
    o
  ];
}
var Ka = ["PageUp", "PageDown"], Ga = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], Ya = {
  "from-left": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-right": ["Home", "PageDown", "ArrowDown", "ArrowRight"],
  "from-bottom": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-top": ["Home", "PageDown", "ArrowUp", "ArrowLeft"]
}, $t = "Slider", [gr, hh, mh] = vn($t), [Xa] = pe($t, [
  mh
]), [vh, go] = Xa($t), qa = P(
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
      form: m,
      ...h
    } = e, v = T(/* @__PURE__ */ new Set()), g = T(0), y = s === "horizontal" ? gh : bh, [x = [], k] = ge({
      prop: u,
      defaultProp: c,
      onChange: (C) => {
        var W;
        (W = [...v.current][g.current]) == null || W.focus(), d(C);
      }
    }), A = T(x);
    function S(C) {
      const O = Ch(x, C);
      E(C, O);
    }
    function M(C) {
      E(C, g.current);
    }
    function L() {
      const C = A.current[g.current];
      x[g.current] !== C && f(x);
    }
    function E(C, O, { commit: W } = { commit: !1 }) {
      const V = Nh(i), z = Ph(Math.round((C - o) / i) * i + o, V), B = Xn(z, [o, r]);
      k((U = []) => {
        const I = _h(U, B, O);
        if (kh(I, l * i)) {
          g.current = I.indexOf(B);
          const N = String(I) !== String(U);
          return N && W && f(I), N ? I : U;
        } else
          return U;
      });
    }
    return /* @__PURE__ */ b(
      vh,
      {
        scope: e.__scopeSlider,
        name: n,
        disabled: a,
        min: o,
        max: r,
        valueIndexToChangeRef: g,
        thumbs: v.current,
        values: x,
        orientation: s,
        form: m,
        children: /* @__PURE__ */ b(gr.Provider, { scope: e.__scopeSlider, children: /* @__PURE__ */ b(gr.Slot, { scope: e.__scopeSlider, children: /* @__PURE__ */ b(
          y,
          {
            "aria-disabled": a,
            "data-disabled": a ? "" : void 0,
            ...h,
            ref: t,
            onPointerDown: R(h.onPointerDown, () => {
              a || (A.current = x);
            }),
            min: o,
            max: r,
            inverted: p,
            onSlideStart: a ? void 0 : S,
            onSlideMove: a ? void 0 : M,
            onSlideEnd: a ? void 0 : L,
            onHomeKeyDown: () => !a && E(o, 0, { commit: !0 }),
            onEndKeyDown: () => !a && E(r, x.length - 1, { commit: !0 }),
            onStepKeyDown: ({ event: C, direction: O }) => {
              if (!a) {
                const z = Ka.includes(C.key) || C.shiftKey && Ga.includes(C.key) ? 10 : 1, B = g.current, U = x[B], I = i * z * O;
                E(U + I, B, { commit: !0 });
              }
            }
          }
        ) }) })
      }
    );
  }
);
qa.displayName = $t;
var [Ja, Za] = Xa($t, {
  startEdge: "left",
  endEdge: "right",
  size: "width",
  direction: 1
}), gh = P(
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
    } = e, [d, f] = $(null), p = X(t, (y) => f(y)), m = T(void 0), h = Bt(r), v = h === "ltr", g = v && !i || !v && i;
    function w(y) {
      const x = m.current || d.getBoundingClientRect(), k = [0, x.width], S = ri(k, g ? [n, o] : [o, n]);
      return m.current = x, S(y - x.left);
    }
    return /* @__PURE__ */ b(
      Ja,
      {
        scope: e.__scopeSlider,
        startEdge: g ? "left" : "right",
        endEdge: g ? "right" : "left",
        direction: g ? 1 : -1,
        size: "width",
        children: /* @__PURE__ */ b(
          Qa,
          {
            dir: h,
            "data-orientation": "horizontal",
            ...u,
            ref: p,
            style: {
              ...u.style,
              "--radix-slider-thumb-transform": "translateX(-50%)"
            },
            onSlideStart: (y) => {
              const x = w(y.clientX);
              s == null || s(x);
            },
            onSlideMove: (y) => {
              const x = w(y.clientX);
              a == null || a(x);
            },
            onSlideEnd: () => {
              m.current = void 0, l == null || l();
            },
            onStepKeyDown: (y) => {
              const k = Ya[g ? "from-left" : "from-right"].includes(y.key);
              c == null || c({ event: y, direction: k ? -1 : 1 });
            }
          }
        )
      }
    );
  }
), bh = P(
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
    } = e, u = T(null), d = X(t, u), f = T(void 0), p = !r;
    function m(h) {
      const v = f.current || u.current.getBoundingClientRect(), g = [0, v.height], y = ri(g, p ? [o, n] : [n, o]);
      return f.current = v, y(h - v.top);
    }
    return /* @__PURE__ */ b(
      Ja,
      {
        scope: e.__scopeSlider,
        startEdge: p ? "bottom" : "top",
        endEdge: p ? "top" : "bottom",
        size: "height",
        direction: p ? 1 : -1,
        children: /* @__PURE__ */ b(
          Qa,
          {
            "data-orientation": "vertical",
            ...c,
            ref: d,
            style: {
              ...c.style,
              "--radix-slider-thumb-transform": "translateY(50%)"
            },
            onSlideStart: (h) => {
              const v = m(h.clientY);
              i == null || i(v);
            },
            onSlideMove: (h) => {
              const v = m(h.clientY);
              s == null || s(v);
            },
            onSlideEnd: () => {
              f.current = void 0, a == null || a();
            },
            onStepKeyDown: (h) => {
              const g = Ya[p ? "from-bottom" : "from-top"].includes(h.key);
              l == null || l({ event: h, direction: g ? -1 : 1 });
            }
          }
        )
      }
    );
  }
), Qa = P(
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
    } = e, u = go($t, n);
    return /* @__PURE__ */ b(
      K.span,
      {
        ...c,
        ref: t,
        onKeyDown: R(e.onKeyDown, (d) => {
          d.key === "Home" ? (s(d), d.preventDefault()) : d.key === "End" ? (a(d), d.preventDefault()) : Ka.concat(Ga).includes(d.key) && (l(d), d.preventDefault());
        }),
        onPointerDown: R(e.onPointerDown, (d) => {
          const f = d.target;
          f.setPointerCapture(d.pointerId), d.preventDefault(), u.thumbs.has(f) ? f.focus() : o(d);
        }),
        onPointerMove: R(e.onPointerMove, (d) => {
          d.target.hasPointerCapture(d.pointerId) && r(d);
        }),
        onPointerUp: R(e.onPointerUp, (d) => {
          const f = d.target;
          f.hasPointerCapture(d.pointerId) && (f.releasePointerCapture(d.pointerId), i(d));
        })
      }
    );
  }
), ec = "SliderTrack", tc = P(
  (e, t) => {
    const { __scopeSlider: n, ...o } = e, r = go(ec, n);
    return /* @__PURE__ */ b(
      K.span,
      {
        "data-disabled": r.disabled ? "" : void 0,
        "data-orientation": r.orientation,
        ...o,
        ref: t
      }
    );
  }
);
tc.displayName = ec;
var br = "SliderRange", nc = P(
  (e, t) => {
    const { __scopeSlider: n, ...o } = e, r = go(br, n), i = Za(br, n), s = T(null), a = X(t, s), l = r.values.length, c = r.values.map(
      (f) => ic(f, r.min, r.max)
    ), u = l > 1 ? Math.min(...c) : 0, d = 100 - Math.max(...c);
    return /* @__PURE__ */ b(
      K.span,
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
nc.displayName = br;
var wr = "SliderThumb", oc = P(
  (e, t) => {
    const n = hh(e.__scopeSlider), [o, r] = $(null), i = X(t, (a) => r(a)), s = de(
      () => o ? n().findIndex((a) => a.ref.current === o) : -1,
      [n, o]
    );
    return /* @__PURE__ */ b(wh, { ...e, ref: i, index: s });
  }
), wh = P(
  (e, t) => {
    const { __scopeSlider: n, index: o, name: r, ...i } = e, s = go(wr, n), a = Za(wr, n), [l, c] = $(null), u = X(t, (w) => c(w)), d = l ? s.form || !!l.closest("form") : !0, f = ho(l), p = s.values[o], m = p === void 0 ? 0 : ic(p, s.min, s.max), h = xh(o, s.values.length), v = f == null ? void 0 : f[a.size], g = v ? Sh(v, m, a.direction) : 0;
    return F(() => {
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
          [a.startEdge]: `calc(${m}% + ${g}px)`
        },
        children: [
          /* @__PURE__ */ b(gr.ItemSlot, { scope: e.__scopeSlider, children: /* @__PURE__ */ b(
            K.span,
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
              onFocus: R(e.onFocus, () => {
                s.valueIndexToChangeRef.current = o;
              })
            }
          ) }),
          d && /* @__PURE__ */ b(
            rc,
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
oc.displayName = wr;
var yh = "RadioBubbleInput", rc = P(
  ({ __scopeSlider: e, value: t, ...n }, o) => {
    const r = T(null), i = X(r, o), s = po(t);
    return F(() => {
      const a = r.current;
      if (!a) return;
      const l = window.HTMLInputElement.prototype, u = Object.getOwnPropertyDescriptor(l, "value").set;
      if (s !== t && u) {
        const d = new Event("input", { bubbles: !0 });
        u.call(a, t), a.dispatchEvent(d);
      }
    }, [s, t]), /* @__PURE__ */ b(
      K.input,
      {
        style: { display: "none" },
        ...n,
        ref: i,
        defaultValue: t
      }
    );
  }
);
rc.displayName = yh;
function _h(e = [], t, n) {
  const o = [...e];
  return o[n] = t, o.sort((r, i) => r - i);
}
function ic(e, t, n) {
  const i = 100 / (n - t) * (e - t);
  return Xn(i, [0, 100]);
}
function xh(e, t) {
  return t > 2 ? `Value ${e + 1} of ${t}` : t === 2 ? ["Minimum", "Maximum"][e] : void 0;
}
function Ch(e, t) {
  if (e.length === 1) return 0;
  const n = e.map((r) => Math.abs(r - t)), o = Math.min(...n);
  return n.indexOf(o);
}
function Sh(e, t, n) {
  const o = e / 2, i = ri([0, 50], [0, o]);
  return (o - i(t) * n) * n;
}
function Ah(e) {
  return e.slice(0, -1).map((t, n) => e[n + 1] - t);
}
function kh(e, t) {
  if (t > 0) {
    const n = Ah(e);
    return Math.min(...n) >= t;
  }
  return !0;
}
function ri(e, t) {
  return (n) => {
    if (e[0] === e[1] || t[0] === t[1]) return t[0];
    const o = (t[1] - t[0]) / (e[1] - e[0]);
    return t[0] + o * (n - e[0]);
  };
}
function Nh(e) {
  return (String(e).split(".")[1] || "").length;
}
function Ph(e, t) {
  const n = Math.pow(10, t);
  return Math.round(e * n) / n;
}
var Eh = qa, Th = tc, Lh = nc, Mh = oc;
function Rh(e) {
  const { value: t, min: n, max: o, onChange: r, disabled: i } = e, s = n ?? 0, a = o ?? 100, l = t ?? 0, c = e.class || "", u = ce(e);
  return _(
    Eh,
    {
      className: ["relative flex w-full touch-none select-none items-center", c].filter(Boolean).join(" "),
      style: u,
      value: [l],
      min: s,
      max: a,
      disabled: i || !1,
      onValueChange: (d) => {
        r != null && Z(r, JSON.stringify({ Value: d[0] }));
      }
    },
    _(
      Th,
      {
        className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted"
      },
      _(Lh, {
        className: "absolute h-full bg-primary"
      })
    ),
    _(Mh, {
      className: [
        "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow",
        "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50"
      ].join(" ")
    })
  );
}
function Ne(e) {
  const t = T(e);
  return F(() => {
    t.current = e;
  }), de(() => (...n) => {
    var o;
    return (o = t.current) == null ? void 0 : o.call(t, ...n);
  }, []);
}
function Oh(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Ne(e);
  F(() => {
    const o = (r) => {
      r.key === "Escape" && n(r);
    };
    return t.addEventListener("keydown", o, { capture: !0 }), () => t.removeEventListener("keydown", o, { capture: !0 });
  }, [n, t]);
}
var Ih = "DismissableLayer", yr = "dismissableLayer.update", Dh = "dismissableLayer.pointerDownOutside", Fh = "dismissableLayer.focusOutside", ds, sc = dt({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), Wt = P(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: o,
      onPointerDownOutside: r,
      onFocusOutside: i,
      onInteractOutside: s,
      onDismiss: a,
      ...l
    } = e, c = et(sc), [u, d] = $(null), f = (u == null ? void 0 : u.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, p] = $({}), m = X(t, (S) => d(S)), h = Array.from(c.layers), [v] = [...c.layersWithOutsidePointerEventsDisabled].slice(-1), g = h.indexOf(v), w = u ? h.indexOf(u) : -1, y = c.layersWithOutsidePointerEventsDisabled.size > 0, x = w >= g, k = Wh((S) => {
      const M = S.target, L = [...c.branches].some((E) => E.contains(M));
      !x || L || (r == null || r(S), s == null || s(S), S.defaultPrevented || a == null || a());
    }, f), A = Hh((S) => {
      const M = S.target;
      [...c.branches].some((E) => E.contains(M)) || (i == null || i(S), s == null || s(S), S.defaultPrevented || a == null || a());
    }, f);
    return Oh((S) => {
      w === c.layers.size - 1 && (o == null || o(S), !S.defaultPrevented && a && (S.preventDefault(), a()));
    }, f), F(() => {
      if (u)
        return n && (c.layersWithOutsidePointerEventsDisabled.size === 0 && (ds = f.body.style.pointerEvents, f.body.style.pointerEvents = "none"), c.layersWithOutsidePointerEventsDisabled.add(u)), c.layers.add(u), fs(), () => {
          n && c.layersWithOutsidePointerEventsDisabled.size === 1 && (f.body.style.pointerEvents = ds);
        };
    }, [u, f, n, c]), F(() => () => {
      u && (c.layers.delete(u), c.layersWithOutsidePointerEventsDisabled.delete(u), fs());
    }, [u, c]), F(() => {
      const S = () => p({});
      return document.addEventListener(yr, S), () => document.removeEventListener(yr, S);
    }, []), /* @__PURE__ */ b(
      K.div,
      {
        ...l,
        ref: m,
        style: {
          pointerEvents: y ? x ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: R(e.onFocusCapture, A.onFocusCapture),
        onBlurCapture: R(e.onBlurCapture, A.onBlurCapture),
        onPointerDownCapture: R(
          e.onPointerDownCapture,
          k.onPointerDownCapture
        )
      }
    );
  }
);
Wt.displayName = Ih;
var Bh = "DismissableLayerBranch", $h = P((e, t) => {
  const n = et(sc), o = T(null), r = X(t, o);
  return F(() => {
    const i = o.current;
    if (i)
      return n.branches.add(i), () => {
        n.branches.delete(i);
      };
  }, [n.branches]), /* @__PURE__ */ b(K.div, { ...e, ref: r });
});
$h.displayName = Bh;
function Wh(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Ne(e), o = T(!1), r = T(() => {
  });
  return F(() => {
    const i = (a) => {
      if (a.target && !o.current) {
        let l = function() {
          ac(
            Dh,
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
function Hh(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Ne(e), o = T(!1);
  return F(() => {
    const r = (i) => {
      i.target && !o.current && ac(Fh, n, { originalEvent: i }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", r), () => t.removeEventListener("focusin", r);
  }, [t, n]), {
    onFocusCapture: () => o.current = !0,
    onBlurCapture: () => o.current = !1
  };
}
function fs() {
  const e = new CustomEvent(yr);
  document.dispatchEvent(e);
}
function ac(e, t, n, { discrete: o }) {
  const r = n.originalEvent.target, i = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && r.addEventListener(e, t, { once: !0 }), o ? Ma(r, i) : r.dispatchEvent(i);
}
var Jo = 0;
function ii() {
  F(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? ps()), document.body.insertAdjacentElement("beforeend", e[1] ?? ps()), Jo++, () => {
      Jo === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), Jo--;
    };
  }, []);
}
function ps() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var Zo = "focusScope.autoFocusOnMount", Qo = "focusScope.autoFocusOnUnmount", hs = { bubbles: !1, cancelable: !0 }, Vh = "FocusScope", bo = P((e, t) => {
  const {
    loop: n = !1,
    trapped: o = !1,
    onMountAutoFocus: r,
    onUnmountAutoFocus: i,
    ...s
  } = e, [a, l] = $(null), c = Ne(r), u = Ne(i), d = T(null), f = X(t, (h) => l(h)), p = T({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  F(() => {
    if (o) {
      let h = function(y) {
        if (p.paused || !a) return;
        const x = y.target;
        a.contains(x) ? d.current = x : Xe(d.current, { select: !0 });
      }, v = function(y) {
        if (p.paused || !a) return;
        const x = y.relatedTarget;
        x !== null && (a.contains(x) || Xe(d.current, { select: !0 }));
      }, g = function(y) {
        if (document.activeElement === document.body)
          for (const k of y)
            k.removedNodes.length > 0 && Xe(a);
      };
      document.addEventListener("focusin", h), document.addEventListener("focusout", v);
      const w = new MutationObserver(g);
      return a && w.observe(a, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", h), document.removeEventListener("focusout", v), w.disconnect();
      };
    }
  }, [o, a, p.paused]), F(() => {
    if (a) {
      vs.add(p);
      const h = document.activeElement;
      if (!a.contains(h)) {
        const g = new CustomEvent(Zo, hs);
        a.addEventListener(Zo, c), a.dispatchEvent(g), g.defaultPrevented || (Uh(Yh(cc(a)), { select: !0 }), document.activeElement === h && Xe(a));
      }
      return () => {
        a.removeEventListener(Zo, c), setTimeout(() => {
          const g = new CustomEvent(Qo, hs);
          a.addEventListener(Qo, u), a.dispatchEvent(g), g.defaultPrevented || Xe(h ?? document.body, { select: !0 }), a.removeEventListener(Qo, u), vs.remove(p);
        }, 0);
      };
    }
  }, [a, c, u, p]);
  const m = H(
    (h) => {
      if (!n && !o || p.paused) return;
      const v = h.key === "Tab" && !h.altKey && !h.ctrlKey && !h.metaKey, g = document.activeElement;
      if (v && g) {
        const w = h.currentTarget, [y, x] = jh(w);
        y && x ? !h.shiftKey && g === x ? (h.preventDefault(), n && Xe(y, { select: !0 })) : h.shiftKey && g === y && (h.preventDefault(), n && Xe(x, { select: !0 })) : g === w && h.preventDefault();
      }
    },
    [n, o, p.paused]
  );
  return /* @__PURE__ */ b(K.div, { tabIndex: -1, ...s, ref: f, onKeyDown: m });
});
bo.displayName = Vh;
function Uh(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const o of e)
    if (Xe(o, { select: t }), document.activeElement !== n) return;
}
function jh(e) {
  const t = cc(e), n = ms(t, e), o = ms(t.reverse(), e);
  return [n, o];
}
function cc(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (o) => {
      const r = o.tagName === "INPUT" && o.type === "hidden";
      return o.disabled || o.hidden || r ? NodeFilter.FILTER_SKIP : o.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function ms(e, t) {
  for (const n of e)
    if (!zh(n, { upTo: t })) return n;
}
function zh(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function Kh(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function Xe(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && Kh(e) && t && e.select();
  }
}
var vs = Gh();
function Gh() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), e = gs(e, t), e.unshift(t);
    },
    remove(t) {
      var n;
      e = gs(e, t), (n = e[0]) == null || n.resume();
    }
  };
}
function gs(e, t) {
  const n = [...e], o = n.indexOf(t);
  return o !== -1 && n.splice(o, 1), n;
}
function Yh(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Xh = ga[" useId ".trim().toString()] || (() => {
}), qh = 0;
function Pe(e) {
  const [t, n] = $(Xh());
  return fe(() => {
    n((o) => o ?? String(qh++));
  }, [e]), t ? `radix-${t}` : "";
}
const Jh = ["top", "right", "bottom", "left"], Ze = Math.min, ye = Math.max, qn = Math.round, Rn = Math.floor, Fe = (e) => ({
  x: e,
  y: e
}), Zh = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Qh = {
  start: "end",
  end: "start"
};
function _r(e, t, n) {
  return ye(e, Ze(t, n));
}
function Ke(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ge(e) {
  return e.split("-")[0];
}
function Ht(e) {
  return e.split("-")[1];
}
function si(e) {
  return e === "x" ? "y" : "x";
}
function ai(e) {
  return e === "y" ? "height" : "width";
}
const em = /* @__PURE__ */ new Set(["top", "bottom"]);
function Ie(e) {
  return em.has(Ge(e)) ? "y" : "x";
}
function ci(e) {
  return si(Ie(e));
}
function tm(e, t, n) {
  n === void 0 && (n = !1);
  const o = Ht(e), r = ci(e), i = ai(r);
  let s = r === "x" ? o === (n ? "end" : "start") ? "right" : "left" : o === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (s = Jn(s)), [s, Jn(s)];
}
function nm(e) {
  const t = Jn(e);
  return [xr(e), t, xr(t)];
}
function xr(e) {
  return e.replace(/start|end/g, (t) => Qh[t]);
}
const bs = ["left", "right"], ws = ["right", "left"], om = ["top", "bottom"], rm = ["bottom", "top"];
function im(e, t, n) {
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? ws : bs : t ? bs : ws;
    case "left":
    case "right":
      return t ? om : rm;
    default:
      return [];
  }
}
function sm(e, t, n, o) {
  const r = Ht(e);
  let i = im(Ge(e), n === "start", o);
  return r && (i = i.map((s) => s + "-" + r), t && (i = i.concat(i.map(xr)))), i;
}
function Jn(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Zh[t]);
}
function am(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function lc(e) {
  return typeof e != "number" ? am(e) : {
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
function ys(e, t, n) {
  let {
    reference: o,
    floating: r
  } = e;
  const i = Ie(t), s = ci(t), a = ai(s), l = Ge(t), c = i === "y", u = o.x + o.width / 2 - r.width / 2, d = o.y + o.height / 2 - r.height / 2, f = o[a] / 2 - r[a] / 2;
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
  switch (Ht(t)) {
    case "start":
      p[s] -= f * (n && c ? -1 : 1);
      break;
    case "end":
      p[s] += f * (n && c ? -1 : 1);
      break;
  }
  return p;
}
async function cm(e, t) {
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
  } = Ke(t, e), m = lc(p), v = a[f ? d === "floating" ? "reference" : "floating" : d], g = Zn(await i.getClippingRect({
    element: (n = await (i.isElement == null ? void 0 : i.isElement(v))) == null || n ? v : v.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(a.floating)),
    boundary: c,
    rootBoundary: u,
    strategy: l
  })), w = d === "floating" ? {
    x: o,
    y: r,
    width: s.floating.width,
    height: s.floating.height
  } : s.reference, y = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(a.floating)), x = await (i.isElement == null ? void 0 : i.isElement(y)) ? await (i.getScale == null ? void 0 : i.getScale(y)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, k = Zn(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: a,
    rect: w,
    offsetParent: y,
    strategy: l
  }) : w);
  return {
    top: (g.top - k.top + m.top) / x.y,
    bottom: (k.bottom - g.bottom + m.bottom) / x.y,
    left: (g.left - k.left + m.left) / x.x,
    right: (k.right - g.right + m.right) / x.x
  };
}
const lm = async (e, t, n) => {
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
  } = ys(c, o, l), f = o, p = {}, m = 0;
  for (let v = 0; v < a.length; v++) {
    var h;
    const {
      name: g,
      fn: w
    } = a[v], {
      x: y,
      y: x,
      data: k,
      reset: A
    } = await w({
      x: u,
      y: d,
      initialPlacement: o,
      placement: f,
      strategy: r,
      middlewareData: p,
      rects: c,
      platform: {
        ...s,
        detectOverflow: (h = s.detectOverflow) != null ? h : cm
      },
      elements: {
        reference: e,
        floating: t
      }
    });
    u = y ?? u, d = x ?? d, p = {
      ...p,
      [g]: {
        ...p[g],
        ...k
      }
    }, A && m <= 50 && (m++, typeof A == "object" && (A.placement && (f = A.placement), A.rects && (c = A.rects === !0 ? await s.getElementRects({
      reference: e,
      floating: t,
      strategy: r
    }) : A.rects), {
      x: u,
      y: d
    } = ys(c, f, l)), v = -1);
  }
  return {
    x: u,
    y: d,
    placement: f,
    strategy: r,
    middlewareData: p
  };
}, um = (e) => ({
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
    const d = lc(u), f = {
      x: n,
      y: o
    }, p = ci(r), m = ai(p), h = await s.getDimensions(c), v = p === "y", g = v ? "top" : "left", w = v ? "bottom" : "right", y = v ? "clientHeight" : "clientWidth", x = i.reference[m] + i.reference[p] - f[p] - i.floating[m], k = f[p] - i.reference[p], A = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(c));
    let S = A ? A[y] : 0;
    (!S || !await (s.isElement == null ? void 0 : s.isElement(A))) && (S = a.floating[y] || i.floating[m]);
    const M = x / 2 - k / 2, L = S / 2 - h[m] / 2 - 1, E = Ze(d[g], L), C = Ze(d[w], L), O = E, W = S - h[m] - C, V = S / 2 - h[m] / 2 + M, z = _r(O, V, W), B = !l.arrow && Ht(r) != null && V !== z && i.reference[m] / 2 - (V < O ? E : C) - h[m] / 2 < 0, U = B ? V < O ? V - O : V - W : 0;
    return {
      [p]: f[p] + U,
      data: {
        [p]: z,
        centerOffset: V - z - U,
        ...B && {
          alignmentOffset: U
        }
      },
      reset: B
    };
  }
}), dm = function(e) {
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
        fallbackAxisSideDirection: m = "none",
        flipAlignment: h = !0,
        ...v
      } = Ke(e, t);
      if ((n = i.arrow) != null && n.alignmentOffset)
        return {};
      const g = Ge(r), w = Ie(a), y = Ge(a) === a, x = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), k = f || (y || !h ? [Jn(a)] : nm(a)), A = m !== "none";
      !f && A && k.push(...sm(a, h, m, x));
      const S = [a, ...k], M = await l.detectOverflow(t, v), L = [];
      let E = ((o = i.flip) == null ? void 0 : o.overflows) || [];
      if (u && L.push(M[g]), d) {
        const V = tm(r, s, x);
        L.push(M[V[0]], M[V[1]]);
      }
      if (E = [...E, {
        placement: r,
        overflows: L
      }], !L.every((V) => V <= 0)) {
        var C, O;
        const V = (((C = i.flip) == null ? void 0 : C.index) || 0) + 1, z = S[V];
        if (z && (!(d === "alignment" ? w !== Ie(z) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        E.every((I) => Ie(I.placement) === w ? I.overflows[0] > 0 : !0)))
          return {
            data: {
              index: V,
              overflows: E
            },
            reset: {
              placement: z
            }
          };
        let B = (O = E.filter((U) => U.overflows[0] <= 0).sort((U, I) => U.overflows[1] - I.overflows[1])[0]) == null ? void 0 : O.placement;
        if (!B)
          switch (p) {
            case "bestFit": {
              var W;
              const U = (W = E.filter((I) => {
                if (A) {
                  const N = Ie(I.placement);
                  return N === w || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  N === "y";
                }
                return !0;
              }).map((I) => [I.placement, I.overflows.filter((N) => N > 0).reduce((N, D) => N + D, 0)]).sort((I, N) => I[1] - N[1])[0]) == null ? void 0 : W[0];
              U && (B = U);
              break;
            }
            case "initialPlacement":
              B = a;
              break;
          }
        if (r !== B)
          return {
            reset: {
              placement: B
            }
          };
      }
      return {};
    }
  };
};
function _s(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width
  };
}
function xs(e) {
  return Jh.some((t) => e[t] >= 0);
}
const fm = function(e) {
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
          }), a = _s(s, n.reference);
          return {
            data: {
              referenceHiddenOffsets: a,
              referenceHidden: xs(a)
            }
          };
        }
        case "escaped": {
          const s = await o.detectOverflow(t, {
            ...i,
            altBoundary: !0
          }), a = _s(s, n.floating);
          return {
            data: {
              escapedOffsets: a,
              escaped: xs(a)
            }
          };
        }
        default:
          return {};
      }
    }
  };
}, uc = /* @__PURE__ */ new Set(["left", "top"]);
async function pm(e, t) {
  const {
    placement: n,
    platform: o,
    elements: r
  } = e, i = await (o.isRTL == null ? void 0 : o.isRTL(r.floating)), s = Ge(n), a = Ht(n), l = Ie(n) === "y", c = uc.has(s) ? -1 : 1, u = i && l ? -1 : 1, d = Ke(t, e);
  let {
    mainAxis: f,
    crossAxis: p,
    alignmentAxis: m
  } = typeof d == "number" ? {
    mainAxis: d,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: d.mainAxis || 0,
    crossAxis: d.crossAxis || 0,
    alignmentAxis: d.alignmentAxis
  };
  return a && typeof m == "number" && (p = a === "end" ? m * -1 : m), l ? {
    x: p * u,
    y: f * c
  } : {
    x: f * c,
    y: p * u
  };
}
const hm = function(e) {
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
      } = t, l = await pm(t, e);
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
}, mm = function(e) {
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
          fn: (g) => {
            let {
              x: w,
              y
            } = g;
            return {
              x: w,
              y
            };
          }
        },
        ...c
      } = Ke(e, t), u = {
        x: n,
        y: o
      }, d = await i.detectOverflow(t, c), f = Ie(Ge(r)), p = si(f);
      let m = u[p], h = u[f];
      if (s) {
        const g = p === "y" ? "top" : "left", w = p === "y" ? "bottom" : "right", y = m + d[g], x = m - d[w];
        m = _r(y, m, x);
      }
      if (a) {
        const g = f === "y" ? "top" : "left", w = f === "y" ? "bottom" : "right", y = h + d[g], x = h - d[w];
        h = _r(y, h, x);
      }
      const v = l.fn({
        ...t,
        [p]: m,
        [f]: h
      });
      return {
        ...v,
        data: {
          x: v.x - n,
          y: v.y - o,
          enabled: {
            [p]: s,
            [f]: a
          }
        }
      };
    }
  };
}, vm = function(e) {
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
      }, d = Ie(r), f = si(d);
      let p = u[f], m = u[d];
      const h = Ke(a, t), v = typeof h == "number" ? {
        mainAxis: h,
        crossAxis: 0
      } : {
        mainAxis: 0,
        crossAxis: 0,
        ...h
      };
      if (l) {
        const y = f === "y" ? "height" : "width", x = i.reference[f] - i.floating[y] + v.mainAxis, k = i.reference[f] + i.reference[y] - v.mainAxis;
        p < x ? p = x : p > k && (p = k);
      }
      if (c) {
        var g, w;
        const y = f === "y" ? "width" : "height", x = uc.has(Ge(r)), k = i.reference[d] - i.floating[y] + (x && ((g = s.offset) == null ? void 0 : g[d]) || 0) + (x ? 0 : v.crossAxis), A = i.reference[d] + i.reference[y] + (x ? 0 : ((w = s.offset) == null ? void 0 : w[d]) || 0) - (x ? v.crossAxis : 0);
        m < k ? m = k : m > A && (m = A);
      }
      return {
        [f]: p,
        [d]: m
      };
    }
  };
}, gm = function(e) {
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
      } = Ke(e, t), u = await s.detectOverflow(t, c), d = Ge(r), f = Ht(r), p = Ie(r) === "y", {
        width: m,
        height: h
      } = i.floating;
      let v, g;
      d === "top" || d === "bottom" ? (v = d, g = f === (await (s.isRTL == null ? void 0 : s.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (g = d, v = f === "end" ? "top" : "bottom");
      const w = h - u.top - u.bottom, y = m - u.left - u.right, x = Ze(h - u[v], w), k = Ze(m - u[g], y), A = !t.middlewareData.shift;
      let S = x, M = k;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (M = y), (o = t.middlewareData.shift) != null && o.enabled.y && (S = w), A && !f) {
        const E = ye(u.left, 0), C = ye(u.right, 0), O = ye(u.top, 0), W = ye(u.bottom, 0);
        p ? M = m - 2 * (E !== 0 || C !== 0 ? E + C : ye(u.left, u.right)) : S = h - 2 * (O !== 0 || W !== 0 ? O + W : ye(u.top, u.bottom));
      }
      await l({
        ...t,
        availableWidth: M,
        availableHeight: S
      });
      const L = await s.getDimensions(a.floating);
      return m !== L.width || h !== L.height ? {
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
function Vt(e) {
  return dc(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function _e(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function $e(e) {
  var t;
  return (t = (dc(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function dc(e) {
  return wo() ? e instanceof Node || e instanceof _e(e).Node : !1;
}
function Ee(e) {
  return wo() ? e instanceof Element || e instanceof _e(e).Element : !1;
}
function Be(e) {
  return wo() ? e instanceof HTMLElement || e instanceof _e(e).HTMLElement : !1;
}
function Cs(e) {
  return !wo() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof _e(e).ShadowRoot;
}
const bm = /* @__PURE__ */ new Set(["inline", "contents"]);
function gn(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: o,
    display: r
  } = Te(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + o + n) && !bm.has(r);
}
const wm = /* @__PURE__ */ new Set(["table", "td", "th"]);
function ym(e) {
  return wm.has(Vt(e));
}
const _m = [":popover-open", ":modal"];
function yo(e) {
  return _m.some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
const xm = ["transform", "translate", "scale", "rotate", "perspective"], Cm = ["transform", "translate", "scale", "rotate", "perspective", "filter"], Sm = ["paint", "layout", "strict", "content"];
function li(e) {
  const t = ui(), n = Ee(e) ? Te(e) : e;
  return xm.some((o) => n[o] ? n[o] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || Cm.some((o) => (n.willChange || "").includes(o)) || Sm.some((o) => (n.contain || "").includes(o));
}
function Am(e) {
  let t = Qe(e);
  for (; Be(t) && !Rt(t); ) {
    if (li(t))
      return t;
    if (yo(t))
      return null;
    t = Qe(t);
  }
  return null;
}
function ui() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
const km = /* @__PURE__ */ new Set(["html", "body", "#document"]);
function Rt(e) {
  return km.has(Vt(e));
}
function Te(e) {
  return _e(e).getComputedStyle(e);
}
function _o(e) {
  return Ee(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function Qe(e) {
  if (Vt(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Cs(e) && e.host || // Fallback.
    $e(e)
  );
  return Cs(t) ? t.host : t;
}
function fc(e) {
  const t = Qe(e);
  return Rt(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Be(t) && gn(t) ? t : fc(t);
}
function sn(e, t, n) {
  var o;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const r = fc(e), i = r === ((o = e.ownerDocument) == null ? void 0 : o.body), s = _e(r);
  if (i) {
    const a = Cr(s);
    return t.concat(s, s.visualViewport || [], gn(r) ? r : [], a && n ? sn(a) : []);
  }
  return t.concat(r, sn(r, [], n));
}
function Cr(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function pc(e) {
  const t = Te(e);
  let n = parseFloat(t.width) || 0, o = parseFloat(t.height) || 0;
  const r = Be(e), i = r ? e.offsetWidth : n, s = r ? e.offsetHeight : o, a = qn(n) !== i || qn(o) !== s;
  return a && (n = i, o = s), {
    width: n,
    height: o,
    $: a
  };
}
function di(e) {
  return Ee(e) ? e : e.contextElement;
}
function Pt(e) {
  const t = di(e);
  if (!Be(t))
    return Fe(1);
  const n = t.getBoundingClientRect(), {
    width: o,
    height: r,
    $: i
  } = pc(t);
  let s = (i ? qn(n.width) : n.width) / o, a = (i ? qn(n.height) : n.height) / r;
  return (!s || !Number.isFinite(s)) && (s = 1), (!a || !Number.isFinite(a)) && (a = 1), {
    x: s,
    y: a
  };
}
const Nm = /* @__PURE__ */ Fe(0);
function hc(e) {
  const t = _e(e);
  return !ui() || !t.visualViewport ? Nm : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Pm(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== _e(e) ? !1 : t;
}
function ft(e, t, n, o) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), i = di(e);
  let s = Fe(1);
  t && (o ? Ee(o) && (s = Pt(o)) : s = Pt(e));
  const a = Pm(i, n, o) ? hc(i) : Fe(0);
  let l = (r.left + a.x) / s.x, c = (r.top + a.y) / s.y, u = r.width / s.x, d = r.height / s.y;
  if (i) {
    const f = _e(i), p = o && Ee(o) ? _e(o) : o;
    let m = f, h = Cr(m);
    for (; h && o && p !== m; ) {
      const v = Pt(h), g = h.getBoundingClientRect(), w = Te(h), y = g.left + (h.clientLeft + parseFloat(w.paddingLeft)) * v.x, x = g.top + (h.clientTop + parseFloat(w.paddingTop)) * v.y;
      l *= v.x, c *= v.y, u *= v.x, d *= v.y, l += y, c += x, m = _e(h), h = Cr(m);
    }
  }
  return Zn({
    width: u,
    height: d,
    x: l,
    y: c
  });
}
function xo(e, t) {
  const n = _o(e).scrollLeft;
  return t ? t.left + n : ft($e(e)).left + n;
}
function mc(e, t) {
  const n = e.getBoundingClientRect(), o = n.left + t.scrollLeft - xo(e, n), r = n.top + t.scrollTop;
  return {
    x: o,
    y: r
  };
}
function Em(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: o,
    strategy: r
  } = e;
  const i = r === "fixed", s = $e(o), a = t ? yo(t.floating) : !1;
  if (o === s || a && i)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = Fe(1);
  const u = Fe(0), d = Be(o);
  if ((d || !d && !i) && ((Vt(o) !== "body" || gn(s)) && (l = _o(o)), Be(o))) {
    const p = ft(o);
    c = Pt(o), u.x = p.x + o.clientLeft, u.y = p.y + o.clientTop;
  }
  const f = s && !d && !i ? mc(s, l) : Fe(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - l.scrollLeft * c.x + u.x + f.x,
    y: n.y * c.y - l.scrollTop * c.y + u.y + f.y
  };
}
function Tm(e) {
  return Array.from(e.getClientRects());
}
function Lm(e) {
  const t = $e(e), n = _o(e), o = e.ownerDocument.body, r = ye(t.scrollWidth, t.clientWidth, o.scrollWidth, o.clientWidth), i = ye(t.scrollHeight, t.clientHeight, o.scrollHeight, o.clientHeight);
  let s = -n.scrollLeft + xo(e);
  const a = -n.scrollTop;
  return Te(o).direction === "rtl" && (s += ye(t.clientWidth, o.clientWidth) - r), {
    width: r,
    height: i,
    x: s,
    y: a
  };
}
const Ss = 25;
function Mm(e, t) {
  const n = _e(e), o = $e(e), r = n.visualViewport;
  let i = o.clientWidth, s = o.clientHeight, a = 0, l = 0;
  if (r) {
    i = r.width, s = r.height;
    const u = ui();
    (!u || u && t === "fixed") && (a = r.offsetLeft, l = r.offsetTop);
  }
  const c = xo(o);
  if (c <= 0) {
    const u = o.ownerDocument, d = u.body, f = getComputedStyle(d), p = u.compatMode === "CSS1Compat" && parseFloat(f.marginLeft) + parseFloat(f.marginRight) || 0, m = Math.abs(o.clientWidth - d.clientWidth - p);
    m <= Ss && (i -= m);
  } else c <= Ss && (i += c);
  return {
    width: i,
    height: s,
    x: a,
    y: l
  };
}
const Rm = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function Om(e, t) {
  const n = ft(e, !0, t === "fixed"), o = n.top + e.clientTop, r = n.left + e.clientLeft, i = Be(e) ? Pt(e) : Fe(1), s = e.clientWidth * i.x, a = e.clientHeight * i.y, l = r * i.x, c = o * i.y;
  return {
    width: s,
    height: a,
    x: l,
    y: c
  };
}
function As(e, t, n) {
  let o;
  if (t === "viewport")
    o = Mm(e, n);
  else if (t === "document")
    o = Lm($e(e));
  else if (Ee(t))
    o = Om(t, n);
  else {
    const r = hc(e);
    o = {
      x: t.x - r.x,
      y: t.y - r.y,
      width: t.width,
      height: t.height
    };
  }
  return Zn(o);
}
function vc(e, t) {
  const n = Qe(e);
  return n === t || !Ee(n) || Rt(n) ? !1 : Te(n).position === "fixed" || vc(n, t);
}
function Im(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let o = sn(e, [], !1).filter((a) => Ee(a) && Vt(a) !== "body"), r = null;
  const i = Te(e).position === "fixed";
  let s = i ? Qe(e) : e;
  for (; Ee(s) && !Rt(s); ) {
    const a = Te(s), l = li(s);
    !l && a.position === "fixed" && (r = null), (i ? !l && !r : !l && a.position === "static" && !!r && Rm.has(r.position) || gn(s) && !l && vc(e, s)) ? o = o.filter((u) => u !== s) : r = a, s = Qe(s);
  }
  return t.set(e, o), o;
}
function Dm(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: o,
    strategy: r
  } = e;
  const s = [...n === "clippingAncestors" ? yo(t) ? [] : Im(t, this._c) : [].concat(n), o], a = s[0], l = s.reduce((c, u) => {
    const d = As(t, u, r);
    return c.top = ye(d.top, c.top), c.right = Ze(d.right, c.right), c.bottom = Ze(d.bottom, c.bottom), c.left = ye(d.left, c.left), c;
  }, As(t, a, r));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function Fm(e) {
  const {
    width: t,
    height: n
  } = pc(e);
  return {
    width: t,
    height: n
  };
}
function Bm(e, t, n) {
  const o = Be(t), r = $e(t), i = n === "fixed", s = ft(e, !0, i, t);
  let a = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = Fe(0);
  function c() {
    l.x = xo(r);
  }
  if (o || !o && !i)
    if ((Vt(t) !== "body" || gn(r)) && (a = _o(t)), o) {
      const p = ft(t, !0, i, t);
      l.x = p.x + t.clientLeft, l.y = p.y + t.clientTop;
    } else r && c();
  i && !o && r && c();
  const u = r && !o && !i ? mc(r, a) : Fe(0), d = s.left + a.scrollLeft - l.x - u.x, f = s.top + a.scrollTop - l.y - u.y;
  return {
    x: d,
    y: f,
    width: s.width,
    height: s.height
  };
}
function er(e) {
  return Te(e).position === "static";
}
function ks(e, t) {
  if (!Be(e) || Te(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return $e(e) === n && (n = n.ownerDocument.body), n;
}
function gc(e, t) {
  const n = _e(e);
  if (yo(e))
    return n;
  if (!Be(e)) {
    let r = Qe(e);
    for (; r && !Rt(r); ) {
      if (Ee(r) && !er(r))
        return r;
      r = Qe(r);
    }
    return n;
  }
  let o = ks(e, t);
  for (; o && ym(o) && er(o); )
    o = ks(o, t);
  return o && Rt(o) && er(o) && !li(o) ? n : o || Am(e) || n;
}
const $m = async function(e) {
  const t = this.getOffsetParent || gc, n = this.getDimensions, o = await n(e.floating);
  return {
    reference: Bm(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: o.width,
      height: o.height
    }
  };
};
function Wm(e) {
  return Te(e).direction === "rtl";
}
const Hm = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Em,
  getDocumentElement: $e,
  getClippingRect: Dm,
  getOffsetParent: gc,
  getElementRects: $m,
  getClientRects: Tm,
  getDimensions: Fm,
  getScale: Pt,
  isElement: Ee,
  isRTL: Wm
};
function bc(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Vm(e, t) {
  let n = null, o;
  const r = $e(e);
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
    const m = Rn(d), h = Rn(r.clientWidth - (u + f)), v = Rn(r.clientHeight - (d + p)), g = Rn(u), y = {
      rootMargin: -m + "px " + -h + "px " + -v + "px " + -g + "px",
      threshold: ye(0, Ze(1, l)) || 1
    };
    let x = !0;
    function k(A) {
      const S = A[0].intersectionRatio;
      if (S !== l) {
        if (!x)
          return s();
        S ? s(!1, S) : o = setTimeout(() => {
          s(!1, 1e-7);
        }, 1e3);
      }
      S === 1 && !bc(c, e.getBoundingClientRect()) && s(), x = !1;
    }
    try {
      n = new IntersectionObserver(k, {
        ...y,
        // Handle <iframe>s
        root: r.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(k, y);
    }
    n.observe(e);
  }
  return s(!0), i;
}
function Um(e, t, n, o) {
  o === void 0 && (o = {});
  const {
    ancestorScroll: r = !0,
    ancestorResize: i = !0,
    elementResize: s = typeof ResizeObserver == "function",
    layoutShift: a = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = o, c = di(e), u = r || i ? [...c ? sn(c) : [], ...sn(t)] : [];
  u.forEach((g) => {
    r && g.addEventListener("scroll", n, {
      passive: !0
    }), i && g.addEventListener("resize", n);
  });
  const d = c && a ? Vm(c, n) : null;
  let f = -1, p = null;
  s && (p = new ResizeObserver((g) => {
    let [w] = g;
    w && w.target === c && p && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
      var y;
      (y = p) == null || y.observe(t);
    })), n();
  }), c && !l && p.observe(c), p.observe(t));
  let m, h = l ? ft(e) : null;
  l && v();
  function v() {
    const g = ft(e);
    h && !bc(h, g) && n(), h = g, m = requestAnimationFrame(v);
  }
  return n(), () => {
    var g;
    u.forEach((w) => {
      r && w.removeEventListener("scroll", n), i && w.removeEventListener("resize", n);
    }), d == null || d(), (g = p) == null || g.disconnect(), p = null, l && cancelAnimationFrame(m);
  };
}
const jm = hm, zm = mm, Km = dm, Gm = gm, Ym = fm, Ns = um, Xm = vm, qm = (e, t, n) => {
  const o = /* @__PURE__ */ new Map(), r = {
    platform: Hm,
    ...n
  }, i = {
    ...r.platform,
    _c: o
  };
  return lm(e, t, {
    ...r,
    platform: i
  });
};
var Jm = typeof document < "u", Zm = function() {
}, Wn = Jm ? Ce : Zm;
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
function wc(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Ps(e, t) {
  const n = wc(e);
  return Math.round(t * n) / n;
}
function tr(e) {
  const t = T(e);
  return Wn(() => {
    t.current = e;
  }), t;
}
function Qm(e) {
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
  } = e, [u, d] = $({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [f, p] = $(o);
  Qn(f, o) || p(o);
  const [m, h] = $(null), [v, g] = $(null), w = H((I) => {
    I !== A.current && (A.current = I, h(I));
  }, []), y = H((I) => {
    I !== S.current && (S.current = I, g(I));
  }, []), x = i || m, k = s || v, A = T(null), S = T(null), M = T(u), L = l != null, E = tr(l), C = tr(r), O = tr(c), W = H(() => {
    if (!A.current || !S.current)
      return;
    const I = {
      placement: t,
      strategy: n,
      middleware: f
    };
    C.current && (I.platform = C.current), qm(A.current, S.current, I).then((N) => {
      const D = {
        ...N,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: O.current !== !1
      };
      V.current && !Qn(M.current, D) && (M.current = D, co(() => {
        d(D);
      }));
    });
  }, [f, t, n, C, O]);
  Wn(() => {
    c === !1 && M.current.isPositioned && (M.current.isPositioned = !1, d((I) => ({
      ...I,
      isPositioned: !1
    })));
  }, [c]);
  const V = T(!1);
  Wn(() => (V.current = !0, () => {
    V.current = !1;
  }), []), Wn(() => {
    if (x && (A.current = x), k && (S.current = k), x && k) {
      if (E.current)
        return E.current(x, k, W);
      W();
    }
  }, [x, k, W, E, L]);
  const z = de(() => ({
    reference: A,
    floating: S,
    setReference: w,
    setFloating: y
  }), [w, y]), B = de(() => ({
    reference: x,
    floating: k
  }), [x, k]), U = de(() => {
    const I = {
      position: n,
      left: 0,
      top: 0
    };
    if (!B.floating)
      return I;
    const N = Ps(B.floating, u.x), D = Ps(B.floating, u.y);
    return a ? {
      ...I,
      transform: "translate(" + N + "px, " + D + "px)",
      ...wc(B.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: N,
      top: D
    };
  }, [n, a, B.floating, u.x, u.y]);
  return de(() => ({
    ...u,
    update: W,
    refs: z,
    elements: B,
    floatingStyles: U
  }), [u, W, z, B, U]);
}
const ev = (e) => {
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
      return o && t(o) ? o.current != null ? Ns({
        element: o.current,
        padding: r
      }).fn(n) : {} : o ? Ns({
        element: o,
        padding: r
      }).fn(n) : {};
    }
  };
}, tv = (e, t) => ({
  ...jm(e),
  options: [e, t]
}), nv = (e, t) => ({
  ...zm(e),
  options: [e, t]
}), ov = (e, t) => ({
  ...Xm(e),
  options: [e, t]
}), rv = (e, t) => ({
  ...Km(e),
  options: [e, t]
}), iv = (e, t) => ({
  ...Gm(e),
  options: [e, t]
}), sv = (e, t) => ({
  ...Ym(e),
  options: [e, t]
}), av = (e, t) => ({
  ...ev(e),
  options: [e, t]
});
var cv = "Arrow", yc = P((e, t) => {
  const { children: n, width: o = 10, height: r = 5, ...i } = e;
  return /* @__PURE__ */ b(
    K.svg,
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
yc.displayName = cv;
var lv = yc, fi = "Popper", [_c, We] = pe(fi), [uv, xc] = _c(fi), Cc = (e) => {
  const { __scopePopper: t, children: n } = e, [o, r] = $(null);
  return /* @__PURE__ */ b(uv, { scope: t, anchor: o, onAnchorChange: r, children: n });
};
Cc.displayName = fi;
var Sc = "PopperAnchor", Ac = P(
  (e, t) => {
    const { __scopePopper: n, virtualRef: o, ...r } = e, i = xc(Sc, n), s = T(null), a = X(t, s), l = T(null);
    return F(() => {
      const c = l.current;
      l.current = (o == null ? void 0 : o.current) || s.current, c !== l.current && i.onAnchorChange(l.current);
    }), o ? null : /* @__PURE__ */ b(K.div, { ...r, ref: a });
  }
);
Ac.displayName = Sc;
var pi = "PopperContent", [dv, fv] = _c(pi), kc = P(
  (e, t) => {
    var G, ee, re, Q, te, ne;
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
      onPlaced: m,
      ...h
    } = e, v = xc(pi, n), [g, w] = $(null), y = X(t, (we) => w(we)), [x, k] = $(null), A = ho(x), S = (A == null ? void 0 : A.width) ?? 0, M = (A == null ? void 0 : A.height) ?? 0, L = o + (i !== "center" ? "-" + i : ""), E = typeof u == "number" ? u : { top: 0, right: 0, bottom: 0, left: 0, ...u }, C = Array.isArray(c) ? c : [c], O = C.length > 0, W = {
      padding: E,
      boundary: C.filter(hv),
      // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
      altBoundary: O
    }, { refs: V, floatingStyles: z, placement: B, isPositioned: U, middlewareData: I } = Qm({
      // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
      strategy: "fixed",
      placement: L,
      whileElementsMounted: (...we) => Um(...we, {
        animationFrame: p === "always"
      }),
      elements: {
        reference: v.anchor
      },
      middleware: [
        tv({ mainAxis: r + M, alignmentAxis: s }),
        l && nv({
          mainAxis: !0,
          crossAxis: !1,
          limiter: d === "partial" ? ov() : void 0,
          ...W
        }),
        l && rv({ ...W }),
        iv({
          ...W,
          apply: ({ elements: we, rects: Me, availableWidth: Kt, availableHeight: Gt }) => {
            const { width: Yt, height: Nd } = Me.reference, Nn = we.floating.style;
            Nn.setProperty("--radix-popper-available-width", `${Kt}px`), Nn.setProperty("--radix-popper-available-height", `${Gt}px`), Nn.setProperty("--radix-popper-anchor-width", `${Yt}px`), Nn.setProperty("--radix-popper-anchor-height", `${Nd}px`);
          }
        }),
        x && av({ element: x, padding: a }),
        mv({ arrowWidth: S, arrowHeight: M }),
        f && sv({ strategy: "referenceHidden", ...W })
      ]
    }), [N, D] = Ec(B), j = Ne(m);
    fe(() => {
      U && (j == null || j());
    }, [U, j]);
    const q = (G = I.arrow) == null ? void 0 : G.x, J = (ee = I.arrow) == null ? void 0 : ee.y, ae = ((re = I.arrow) == null ? void 0 : re.centerOffset) !== 0, [Se, he] = $();
    return fe(() => {
      g && he(window.getComputedStyle(g).zIndex);
    }, [g]), /* @__PURE__ */ b(
      "div",
      {
        ref: V.setFloating,
        "data-radix-popper-content-wrapper": "",
        style: {
          ...z,
          transform: U ? z.transform : "translate(0, -200%)",
          // keep off the page when measuring
          minWidth: "max-content",
          zIndex: Se,
          "--radix-popper-transform-origin": [
            (Q = I.transformOrigin) == null ? void 0 : Q.x,
            (te = I.transformOrigin) == null ? void 0 : te.y
          ].join(" "),
          // hide the content if using the hide middleware and should be hidden
          // set visibility to hidden and disable pointer events so the UI behaves
          // as if the PopperContent isn't there at all
          ...((ne = I.hide) == null ? void 0 : ne.referenceHidden) && {
            visibility: "hidden",
            pointerEvents: "none"
          }
        },
        dir: e.dir,
        children: /* @__PURE__ */ b(
          dv,
          {
            scope: n,
            placedSide: N,
            onArrowChange: k,
            arrowX: q,
            arrowY: J,
            shouldHideArrow: ae,
            children: /* @__PURE__ */ b(
              K.div,
              {
                "data-side": N,
                "data-align": D,
                ...h,
                ref: y,
                style: {
                  ...h.style,
                  // if the PopperContent hasn't been placed yet (not all measurements done)
                  // we prevent animations so that users's animation don't kick in too early referring wrong sides
                  animation: U ? void 0 : "none"
                }
              }
            )
          }
        )
      }
    );
  }
);
kc.displayName = pi;
var Nc = "PopperArrow", pv = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
}, Pc = P(function(t, n) {
  const { __scopePopper: o, ...r } = t, i = fv(Nc, o), s = pv[i.placedSide];
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
          lv,
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
Pc.displayName = Nc;
function hv(e) {
  return e !== null;
}
var mv = (e) => ({
  name: "transformOrigin",
  options: e,
  fn(t) {
    var v, g, w;
    const { placement: n, rects: o, middlewareData: r } = t, s = ((v = r.arrow) == null ? void 0 : v.centerOffset) !== 0, a = s ? 0 : e.arrowWidth, l = s ? 0 : e.arrowHeight, [c, u] = Ec(n), d = { start: "0%", center: "50%", end: "100%" }[u], f = (((g = r.arrow) == null ? void 0 : g.x) ?? 0) + a / 2, p = (((w = r.arrow) == null ? void 0 : w.y) ?? 0) + l / 2;
    let m = "", h = "";
    return c === "bottom" ? (m = s ? d : `${f}px`, h = `${-l}px`) : c === "top" ? (m = s ? d : `${f}px`, h = `${o.floating.height + l}px`) : c === "right" ? (m = `${-l}px`, h = s ? d : `${p}px`) : c === "left" && (m = `${o.floating.width + l}px`, h = s ? d : `${p}px`), { data: { x: m, y: h } };
  }
});
function Ec(e) {
  const [t, n = "center"] = e.split("-");
  return [t, n];
}
var bn = Cc, Ut = Ac, wn = kc, yn = Pc, vv = "Portal", jt = P((e, t) => {
  var a;
  const { container: n, ...o } = e, [r, i] = $(!1);
  fe(() => i(!0), []);
  const s = n || r && ((a = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : a.body);
  return s ? se.createPortal(/* @__PURE__ */ b(K.div, { ...o, ref: t }), s) : null;
});
jt.displayName = vv;
var Tc = Object.freeze({
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
}), gv = "VisuallyHidden", Lc = P(
  (e, t) => /* @__PURE__ */ b(
    K.span,
    {
      ...e,
      ref: t,
      style: { ...Tc, ...e.style }
    }
  )
);
Lc.displayName = gv;
var bv = Lc, wv = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Ct = /* @__PURE__ */ new WeakMap(), On = /* @__PURE__ */ new WeakMap(), In = {}, nr = 0, Mc = function(e) {
  return e && (e.host || Mc(e.parentNode));
}, yv = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var o = Mc(n);
    return o && e.contains(o) ? o : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, _v = function(e, t, n, o) {
  var r = yv(t, Array.isArray(e) ? e : [e]);
  In[n] || (In[n] = /* @__PURE__ */ new WeakMap());
  var i = In[n], s = [], a = /* @__PURE__ */ new Set(), l = new Set(r), c = function(d) {
    !d || a.has(d) || (a.add(d), c(d.parentNode));
  };
  r.forEach(c);
  var u = function(d) {
    !d || l.has(d) || Array.prototype.forEach.call(d.children, function(f) {
      if (a.has(f))
        u(f);
      else
        try {
          var p = f.getAttribute(o), m = p !== null && p !== "false", h = (Ct.get(f) || 0) + 1, v = (i.get(f) || 0) + 1;
          Ct.set(f, h), i.set(f, v), s.push(f), h === 1 && m && On.set(f, !0), v === 1 && f.setAttribute(n, "true"), m || f.setAttribute(o, "true");
        } catch (g) {
          console.error("aria-hidden: cannot operate on ", f, g);
        }
    });
  };
  return u(t), a.clear(), nr++, function() {
    s.forEach(function(d) {
      var f = Ct.get(d) - 1, p = i.get(d) - 1;
      Ct.set(d, f), i.set(d, p), f || (On.has(d) || d.removeAttribute(o), On.delete(d)), p || d.removeAttribute(n);
    }), nr--, nr || (Ct = /* @__PURE__ */ new WeakMap(), Ct = /* @__PURE__ */ new WeakMap(), On = /* @__PURE__ */ new WeakMap(), In = {});
  };
}, hi = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var o = Array.from(Array.isArray(e) ? e : [e]), r = wv(e);
  return r ? (o.push.apply(o, Array.from(r.querySelectorAll("[aria-live], script"))), _v(o, r, n, "aria-hidden")) : function() {
    return null;
  };
}, Re = function() {
  return Re = Object.assign || function(t) {
    for (var n, o = 1, r = arguments.length; o < r; o++) {
      n = arguments[o];
      for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && (t[i] = n[i]);
    }
    return t;
  }, Re.apply(this, arguments);
};
function Rc(e, t) {
  var n = {};
  for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && t.indexOf(o) < 0 && (n[o] = e[o]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, o = Object.getOwnPropertySymbols(e); r < o.length; r++)
      t.indexOf(o[r]) < 0 && Object.prototype.propertyIsEnumerable.call(e, o[r]) && (n[o[r]] = e[o[r]]);
  return n;
}
function xv(e, t, n) {
  if (n || arguments.length === 2) for (var o = 0, r = t.length, i; o < r; o++)
    (i || !(o in t)) && (i || (i = Array.prototype.slice.call(t, 0, o)), i[o] = t[o]);
  return e.concat(i || Array.prototype.slice.call(t));
}
var Hn = "right-scroll-bar-position", Vn = "width-before-scroll-bar", Cv = "with-scroll-bars-hidden", Sv = "--removed-body-scroll-bar-size";
function or(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Av(e, t) {
  var n = $(function() {
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
var kv = typeof window < "u" ? Ce : F, Es = /* @__PURE__ */ new WeakMap();
function Nv(e, t) {
  var n = Av(null, function(o) {
    return e.forEach(function(r) {
      return or(r, o);
    });
  });
  return kv(function() {
    var o = Es.get(n);
    if (o) {
      var r = new Set(o), i = new Set(e), s = n.current;
      r.forEach(function(a) {
        i.has(a) || or(a, null);
      }), i.forEach(function(a) {
        r.has(a) || or(a, s);
      });
    }
    Es.set(n, e);
  }, [e]), n;
}
function Pv(e) {
  return e;
}
function Ev(e, t) {
  t === void 0 && (t = Pv);
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
function Tv(e) {
  e === void 0 && (e = {});
  var t = Ev(null);
  return t.options = Re({ async: !0, ssr: !1 }, e), t;
}
var Oc = function(e) {
  var t = e.sideCar, n = Rc(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var o = t.read();
  if (!o)
    throw new Error("Sidecar medium not found");
  return _(o, Re({}, n));
};
Oc.isSideCarExport = !0;
function Lv(e, t) {
  return e.useMedium(t), Oc;
}
var Ic = Tv(), rr = function() {
}, Co = P(function(e, t) {
  var n = T(null), o = $({
    onScrollCapture: rr,
    onWheelCapture: rr,
    onTouchMoveCapture: rr
  }), r = o[0], i = o[1], s = e.forwardProps, a = e.children, l = e.className, c = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, v = e.allowPinchZoom, g = e.as, w = g === void 0 ? "div" : g, y = e.gapMode, x = Rc(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), k = f, A = Nv([n, t]), S = Re(Re({}, x), r);
  return _(
    le,
    null,
    u && _(k, { sideCar: Ic, removeScrollBar: c, shards: d, noRelative: p, noIsolation: m, inert: h, setCallbacks: i, allowPinchZoom: !!v, lockRef: n, gapMode: y }),
    s ? Ft(Ve.only(a), Re(Re({}, S), { ref: A })) : _(w, Re({}, S, { className: l, ref: A }), a)
  );
});
Co.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Co.classNames = {
  fullWidth: Vn,
  zeroRight: Hn
};
var Mv = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function Rv() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = Mv();
  return t && e.setAttribute("nonce", t), e;
}
function Ov(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function Iv(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Dv = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = Rv()) && (Ov(t, n), Iv(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, Fv = function() {
  var e = Dv();
  return function(t, n) {
    F(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, Dc = function() {
  var e = Fv(), t = function(n) {
    var o = n.styles, r = n.dynamic;
    return e(o, r), null;
  };
  return t;
}, Bv = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, ir = function(e) {
  return parseInt(e || "", 10) || 0;
}, $v = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], o = t[e === "padding" ? "paddingTop" : "marginTop"], r = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [ir(n), ir(o), ir(r)];
}, Wv = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return Bv;
  var t = $v(e), n = document.documentElement.clientWidth, o = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, o - n + t[2] - t[0])
  };
}, Hv = Dc(), Et = "data-scroll-locked", Vv = function(e, t, n, o) {
  var r = e.left, i = e.top, s = e.right, a = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(Cv, ` {
   overflow: hidden `).concat(o, `;
   padding-right: `).concat(a, "px ").concat(o, `;
  }
  body[`).concat(Et, `] {
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
  
  .`).concat(Hn, ` {
    right: `).concat(a, "px ").concat(o, `;
  }
  
  .`).concat(Vn, ` {
    margin-right: `).concat(a, "px ").concat(o, `;
  }
  
  .`).concat(Hn, " .").concat(Hn, ` {
    right: 0 `).concat(o, `;
  }
  
  .`).concat(Vn, " .").concat(Vn, ` {
    margin-right: 0 `).concat(o, `;
  }
  
  body[`).concat(Et, `] {
    `).concat(Sv, ": ").concat(a, `px;
  }
`);
}, Ts = function() {
  var e = parseInt(document.body.getAttribute(Et) || "0", 10);
  return isFinite(e) ? e : 0;
}, Uv = function() {
  F(function() {
    return document.body.setAttribute(Et, (Ts() + 1).toString()), function() {
      var e = Ts() - 1;
      e <= 0 ? document.body.removeAttribute(Et) : document.body.setAttribute(Et, e.toString());
    };
  }, []);
}, jv = function(e) {
  var t = e.noRelative, n = e.noImportant, o = e.gapMode, r = o === void 0 ? "margin" : o;
  Uv();
  var i = de(function() {
    return Wv(r);
  }, [r]);
  return _(Hv, { styles: Vv(i, !t, r, n ? "" : "!important") });
}, Sr = !1;
if (typeof window < "u")
  try {
    var Dn = Object.defineProperty({}, "passive", {
      get: function() {
        return Sr = !0, !0;
      }
    });
    window.addEventListener("test", Dn, Dn), window.removeEventListener("test", Dn, Dn);
  } catch {
    Sr = !1;
  }
var St = Sr ? { passive: !1 } : !1, zv = function(e) {
  return e.tagName === "TEXTAREA";
}, Fc = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !zv(e) && n[t] === "visible")
  );
}, Kv = function(e) {
  return Fc(e, "overflowY");
}, Gv = function(e) {
  return Fc(e, "overflowX");
}, Ls = function(e, t) {
  var n = t.ownerDocument, o = t;
  do {
    typeof ShadowRoot < "u" && o instanceof ShadowRoot && (o = o.host);
    var r = Bc(e, o);
    if (r) {
      var i = $c(e, o), s = i[1], a = i[2];
      if (s > a)
        return !0;
    }
    o = o.parentNode;
  } while (o && o !== n.body);
  return !1;
}, Yv = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, o = e.clientHeight;
  return [
    t,
    n,
    o
  ];
}, Xv = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, o = e.clientWidth;
  return [
    t,
    n,
    o
  ];
}, Bc = function(e, t) {
  return e === "v" ? Kv(t) : Gv(t);
}, $c = function(e, t) {
  return e === "v" ? Yv(t) : Xv(t);
}, qv = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, Jv = function(e, t, n, o, r) {
  var i = qv(e, window.getComputedStyle(t).direction), s = i * o, a = n.target, l = t.contains(a), c = !1, u = s > 0, d = 0, f = 0;
  do {
    if (!a)
      break;
    var p = $c(e, a), m = p[0], h = p[1], v = p[2], g = h - v - i * m;
    (m || g) && Bc(e, a) && (d += g, f += m);
    var w = a.parentNode;
    a = w && w.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? w.host : w;
  } while (
    // portaled content
    !l && a !== document.body || // self content
    l && (t.contains(a) || t === a)
  );
  return (u && Math.abs(d) < 1 || !u && Math.abs(f) < 1) && (c = !0), c;
}, Fn = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Ms = function(e) {
  return [e.deltaX, e.deltaY];
}, Rs = function(e) {
  return e && "current" in e ? e.current : e;
}, Zv = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, Qv = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, eg = 0, At = [];
function tg(e) {
  var t = T([]), n = T([0, 0]), o = T(), r = $(eg++)[0], i = $(Dc)[0], s = T(e);
  F(function() {
    s.current = e;
  }, [e]), F(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(r));
      var h = xv([e.lockRef.current], (e.shards || []).map(Rs), !0).filter(Boolean);
      return h.forEach(function(v) {
        return v.classList.add("allow-interactivity-".concat(r));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(r)), h.forEach(function(v) {
          return v.classList.remove("allow-interactivity-".concat(r));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var a = H(function(h, v) {
    if ("touches" in h && h.touches.length === 2 || h.type === "wheel" && h.ctrlKey)
      return !s.current.allowPinchZoom;
    var g = Fn(h), w = n.current, y = "deltaX" in h ? h.deltaX : w[0] - g[0], x = "deltaY" in h ? h.deltaY : w[1] - g[1], k, A = h.target, S = Math.abs(y) > Math.abs(x) ? "h" : "v";
    if ("touches" in h && S === "h" && A.type === "range")
      return !1;
    var M = window.getSelection(), L = M && M.anchorNode, E = L ? L === A || L.contains(A) : !1;
    if (E)
      return !1;
    var C = Ls(S, A);
    if (!C)
      return !0;
    if (C ? k = S : (k = S === "v" ? "h" : "v", C = Ls(S, A)), !C)
      return !1;
    if (!o.current && "changedTouches" in h && (y || x) && (o.current = k), !k)
      return !0;
    var O = o.current || k;
    return Jv(O, v, h, O === "h" ? y : x);
  }, []), l = H(function(h) {
    var v = h;
    if (!(!At.length || At[At.length - 1] !== i)) {
      var g = "deltaY" in v ? Ms(v) : Fn(v), w = t.current.filter(function(k) {
        return k.name === v.type && (k.target === v.target || v.target === k.shadowParent) && Zv(k.delta, g);
      })[0];
      if (w && w.should) {
        v.cancelable && v.preventDefault();
        return;
      }
      if (!w) {
        var y = (s.current.shards || []).map(Rs).filter(Boolean).filter(function(k) {
          return k.contains(v.target);
        }), x = y.length > 0 ? a(v, y[0]) : !s.current.noIsolation;
        x && v.cancelable && v.preventDefault();
      }
    }
  }, []), c = H(function(h, v, g, w) {
    var y = { name: h, delta: v, target: g, should: w, shadowParent: ng(g) };
    t.current.push(y), setTimeout(function() {
      t.current = t.current.filter(function(x) {
        return x !== y;
      });
    }, 1);
  }, []), u = H(function(h) {
    n.current = Fn(h), o.current = void 0;
  }, []), d = H(function(h) {
    c(h.type, Ms(h), h.target, a(h, e.lockRef.current));
  }, []), f = H(function(h) {
    c(h.type, Fn(h), h.target, a(h, e.lockRef.current));
  }, []);
  F(function() {
    return At.push(i), e.setCallbacks({
      onScrollCapture: d,
      onWheelCapture: d,
      onTouchMoveCapture: f
    }), document.addEventListener("wheel", l, St), document.addEventListener("touchmove", l, St), document.addEventListener("touchstart", u, St), function() {
      At = At.filter(function(h) {
        return h !== i;
      }), document.removeEventListener("wheel", l, St), document.removeEventListener("touchmove", l, St), document.removeEventListener("touchstart", u, St);
    };
  }, []);
  var p = e.removeScrollBar, m = e.inert;
  return _(
    le,
    null,
    m ? _(i, { styles: Qv(r) }) : null,
    p ? _(jv, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function ng(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const og = Lv(Ic, tg);
var So = P(function(e, t) {
  return _(Co, Re({}, e, { ref: t, sideCar: og }));
});
So.classNames = Co.classNames;
var rg = [" ", "Enter", "ArrowUp", "ArrowDown"], ig = [" ", "Enter"], pt = "Select", [Ao, ko, sg] = vn(pt), [zt] = pe(pt, [
  sg,
  We
]), No = We(), [ag, tt] = zt(pt), [cg, lg] = zt(pt), Wc = (e) => {
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
    form: m
  } = e, h = No(t), [v, g] = $(null), [w, y] = $(null), [x, k] = $(!1), A = Bt(c), [S, M] = ge({
    prop: o,
    defaultProp: r ?? !1,
    onChange: i,
    caller: pt
  }), [L, E] = ge({
    prop: s,
    defaultProp: a,
    onChange: l,
    caller: pt
  }), C = T(null), O = v ? m || !!v.closest("form") : !0, [W, V] = $(/* @__PURE__ */ new Set()), z = Array.from(W).map((B) => B.props.value).join(";");
  return /* @__PURE__ */ b(bn, { ...h, children: /* @__PURE__ */ b(
    ag,
    {
      required: p,
      scope: t,
      trigger: v,
      onTriggerChange: g,
      valueNode: w,
      onValueNodeChange: y,
      valueNodeHasChildren: x,
      onValueNodeHasChildrenChange: k,
      contentId: Pe(),
      value: L,
      onValueChange: E,
      open: S,
      onOpenChange: M,
      dir: A,
      triggerPointerDownPosRef: C,
      disabled: f,
      children: [
        /* @__PURE__ */ b(Ao.Provider, { scope: t, children: /* @__PURE__ */ b(
          cg,
          {
            scope: e.__scopeSelect,
            onNativeOptionAdd: H((B) => {
              V((U) => new Set(U).add(B));
            }, []),
            onNativeOptionRemove: H((B) => {
              V((U) => {
                const I = new Set(U);
                return I.delete(B), I;
              });
            }, []),
            children: n
          }
        ) }),
        O ? /* @__PURE__ */ b(
          sl,
          {
            "aria-hidden": !0,
            required: p,
            tabIndex: -1,
            name: u,
            autoComplete: d,
            value: L,
            onChange: (B) => E(B.target.value),
            disabled: f,
            form: m,
            children: [
              L === void 0 ? /* @__PURE__ */ b("option", { value: "" }) : null,
              Array.from(W)
            ]
          },
          z
        ) : null
      ]
    }
  ) });
};
Wc.displayName = pt;
var Hc = "SelectTrigger", Vc = P(
  (e, t) => {
    const { __scopeSelect: n, disabled: o = !1, ...r } = e, i = No(n), s = tt(Hc, n), a = s.disabled || o, l = X(t, s.onTriggerChange), c = ko(n), u = T("touch"), [d, f, p] = cl((h) => {
      const v = c().filter((y) => !y.disabled), g = v.find((y) => y.value === s.value), w = ll(v, h, g);
      w !== void 0 && s.onValueChange(w.value);
    }), m = (h) => {
      a || (s.onOpenChange(!0), p()), h && (s.triggerPointerDownPosRef.current = {
        x: Math.round(h.pageX),
        y: Math.round(h.pageY)
      });
    };
    return /* @__PURE__ */ b(Ut, { asChild: !0, ...i, children: /* @__PURE__ */ b(
      K.button,
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
        "data-placeholder": al(s.value) ? "" : void 0,
        ...r,
        ref: l,
        onClick: R(r.onClick, (h) => {
          h.currentTarget.focus(), u.current !== "mouse" && m(h);
        }),
        onPointerDown: R(r.onPointerDown, (h) => {
          u.current = h.pointerType;
          const v = h.target;
          v.hasPointerCapture(h.pointerId) && v.releasePointerCapture(h.pointerId), h.button === 0 && h.ctrlKey === !1 && h.pointerType === "mouse" && (m(h), h.preventDefault());
        }),
        onKeyDown: R(r.onKeyDown, (h) => {
          const v = d.current !== "";
          !(h.ctrlKey || h.altKey || h.metaKey) && h.key.length === 1 && f(h.key), !(v && h.key === " ") && rg.includes(h.key) && (m(), h.preventDefault());
        })
      }
    ) });
  }
);
Vc.displayName = Hc;
var Uc = "SelectValue", jc = P(
  (e, t) => {
    const { __scopeSelect: n, className: o, style: r, children: i, placeholder: s = "", ...a } = e, l = tt(Uc, n), { onValueNodeHasChildrenChange: c } = l, u = i !== void 0, d = X(t, l.onValueNodeChange);
    return fe(() => {
      c(u);
    }, [c, u]), /* @__PURE__ */ b(
      K.span,
      {
        ...a,
        ref: d,
        style: { pointerEvents: "none" },
        children: al(l.value) ? /* @__PURE__ */ b(le, { children: s }) : i
      }
    );
  }
);
jc.displayName = Uc;
var ug = "SelectIcon", zc = P(
  (e, t) => {
    const { __scopeSelect: n, children: o, ...r } = e;
    return /* @__PURE__ */ b(K.span, { "aria-hidden": !0, ...r, ref: t, children: o || "▼" });
  }
);
zc.displayName = ug;
var dg = "SelectPortal", Kc = (e) => /* @__PURE__ */ b(jt, { asChild: !0, ...e });
Kc.displayName = dg;
var ht = "SelectContent", Gc = P(
  (e, t) => {
    const n = tt(ht, e.__scopeSelect), [o, r] = $();
    if (fe(() => {
      r(new DocumentFragment());
    }, []), !n.open) {
      const i = o;
      return i ? vt(
        /* @__PURE__ */ b(Yc, { scope: e.__scopeSelect, children: /* @__PURE__ */ b(Ao.Slot, { scope: e.__scopeSelect, children: /* @__PURE__ */ b("div", { children: e.children }) }) }),
        i
      ) : null;
    }
    return /* @__PURE__ */ b(Xc, { ...e, ref: t });
  }
);
Gc.displayName = ht;
var Ae = 10, [Yc, nt] = zt(ht), fg = "SelectContentImpl", pg = /* @__PURE__ */ Mt("SelectContent.RemoveScroll"), Xc = P(
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
      sticky: m,
      hideWhenDetached: h,
      avoidCollisions: v,
      //
      ...g
    } = e, w = tt(ht, n), [y, x] = $(null), [k, A] = $(null), S = X(t, (G) => x(G)), [M, L] = $(null), [E, C] = $(
      null
    ), O = ko(n), [W, V] = $(!1), z = T(!1);
    F(() => {
      if (y) return hi(y);
    }, [y]), ii();
    const B = H(
      (G) => {
        const [ee, ...re] = O().map((ne) => ne.ref.current), [Q] = re.slice(-1), te = document.activeElement;
        for (const ne of G)
          if (ne === te || (ne == null || ne.scrollIntoView({ block: "nearest" }), ne === ee && k && (k.scrollTop = 0), ne === Q && k && (k.scrollTop = k.scrollHeight), ne == null || ne.focus(), document.activeElement !== te)) return;
      },
      [O, k]
    ), U = H(
      () => B([M, y]),
      [B, M, y]
    );
    F(() => {
      W && U();
    }, [W, U]);
    const { onOpenChange: I, triggerPointerDownPosRef: N } = w;
    F(() => {
      if (y) {
        let G = { x: 0, y: 0 };
        const ee = (Q) => {
          var te, ne;
          G = {
            x: Math.abs(Math.round(Q.pageX) - (((te = N.current) == null ? void 0 : te.x) ?? 0)),
            y: Math.abs(Math.round(Q.pageY) - (((ne = N.current) == null ? void 0 : ne.y) ?? 0))
          };
        }, re = (Q) => {
          G.x <= 10 && G.y <= 10 ? Q.preventDefault() : y.contains(Q.target) || I(!1), document.removeEventListener("pointermove", ee), N.current = null;
        };
        return N.current !== null && (document.addEventListener("pointermove", ee), document.addEventListener("pointerup", re, { capture: !0, once: !0 })), () => {
          document.removeEventListener("pointermove", ee), document.removeEventListener("pointerup", re, { capture: !0 });
        };
      }
    }, [y, I, N]), F(() => {
      const G = () => I(!1);
      return window.addEventListener("blur", G), window.addEventListener("resize", G), () => {
        window.removeEventListener("blur", G), window.removeEventListener("resize", G);
      };
    }, [I]);
    const [D, j] = cl((G) => {
      const ee = O().filter((te) => !te.disabled), re = ee.find((te) => te.ref.current === document.activeElement), Q = ll(ee, G, re);
      Q && setTimeout(() => Q.ref.current.focus());
    }), q = H(
      (G, ee, re) => {
        const Q = !z.current && !re;
        (w.value !== void 0 && w.value === ee || Q) && (L(G), Q && (z.current = !0));
      },
      [w.value]
    ), J = H(() => y == null ? void 0 : y.focus(), [y]), ae = H(
      (G, ee, re) => {
        const Q = !z.current && !re;
        (w.value !== void 0 && w.value === ee || Q) && C(G);
      },
      [w.value]
    ), Se = o === "popper" ? Ar : qc, he = Se === Ar ? {
      side: a,
      sideOffset: l,
      align: c,
      alignOffset: u,
      arrowPadding: d,
      collisionBoundary: f,
      collisionPadding: p,
      sticky: m,
      hideWhenDetached: h,
      avoidCollisions: v
    } : {};
    return /* @__PURE__ */ b(
      Yc,
      {
        scope: n,
        content: y,
        viewport: k,
        onViewportChange: A,
        itemRefCallback: q,
        selectedItem: M,
        onItemLeave: J,
        itemTextRefCallback: ae,
        focusSelectedItem: U,
        selectedItemText: E,
        position: o,
        isPositioned: W,
        searchRef: D,
        children: /* @__PURE__ */ b(So, { as: pg, allowPinchZoom: !0, children: /* @__PURE__ */ b(
          bo,
          {
            asChild: !0,
            trapped: w.open,
            onMountAutoFocus: (G) => {
              G.preventDefault();
            },
            onUnmountAutoFocus: R(r, (G) => {
              var ee;
              (ee = w.trigger) == null || ee.focus({ preventScroll: !0 }), G.preventDefault();
            }),
            children: /* @__PURE__ */ b(
              Wt,
              {
                asChild: !0,
                disableOutsidePointerEvents: !0,
                onEscapeKeyDown: i,
                onPointerDownOutside: s,
                onFocusOutside: (G) => G.preventDefault(),
                onDismiss: () => w.onOpenChange(!1),
                children: /* @__PURE__ */ b(
                  Se,
                  {
                    role: "listbox",
                    id: w.contentId,
                    "data-state": w.open ? "open" : "closed",
                    dir: w.dir,
                    onContextMenu: (G) => G.preventDefault(),
                    ...g,
                    ...he,
                    onPlaced: () => V(!0),
                    ref: S,
                    style: {
                      // flex layout so we can place the scroll buttons properly
                      display: "flex",
                      flexDirection: "column",
                      // reset the outline by default as the content MAY get focused
                      outline: "none",
                      ...g.style
                    },
                    onKeyDown: R(g.onKeyDown, (G) => {
                      const ee = G.ctrlKey || G.altKey || G.metaKey;
                      if (G.key === "Tab" && G.preventDefault(), !ee && G.key.length === 1 && j(G.key), ["ArrowUp", "ArrowDown", "Home", "End"].includes(G.key)) {
                        let Q = O().filter((te) => !te.disabled).map((te) => te.ref.current);
                        if (["ArrowUp", "End"].includes(G.key) && (Q = Q.slice().reverse()), ["ArrowUp", "ArrowDown"].includes(G.key)) {
                          const te = G.target, ne = Q.indexOf(te);
                          Q = Q.slice(ne + 1);
                        }
                        setTimeout(() => B(Q)), G.preventDefault();
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
Xc.displayName = fg;
var hg = "SelectItemAlignedPosition", qc = P((e, t) => {
  const { __scopeSelect: n, onPlaced: o, ...r } = e, i = tt(ht, n), s = nt(ht, n), [a, l] = $(null), [c, u] = $(null), d = X(t, (S) => u(S)), f = ko(n), p = T(!1), m = T(!0), { viewport: h, selectedItem: v, selectedItemText: g, focusSelectedItem: w } = s, y = H(() => {
    if (i.trigger && i.valueNode && a && c && h && v && g) {
      const S = i.trigger.getBoundingClientRect(), M = c.getBoundingClientRect(), L = i.valueNode.getBoundingClientRect(), E = g.getBoundingClientRect();
      if (i.dir !== "rtl") {
        const te = E.left - M.left, ne = L.left - te, we = S.left - ne, Me = S.width + we, Kt = Math.max(Me, M.width), Gt = window.innerWidth - Ae, Yt = Xn(ne, [
          Ae,
          // Prevents the content from going off the starting edge of the
          // viewport. It may still go off the ending edge, but this can be
          // controlled by the user since they may want to manage overflow in a
          // specific way.
          // https://github.com/radix-ui/primitives/issues/2049
          Math.max(Ae, Gt - Kt)
        ]);
        a.style.minWidth = Me + "px", a.style.left = Yt + "px";
      } else {
        const te = M.right - E.right, ne = window.innerWidth - L.right - te, we = window.innerWidth - S.right - ne, Me = S.width + we, Kt = Math.max(Me, M.width), Gt = window.innerWidth - Ae, Yt = Xn(ne, [
          Ae,
          Math.max(Ae, Gt - Kt)
        ]);
        a.style.minWidth = Me + "px", a.style.right = Yt + "px";
      }
      const C = f(), O = window.innerHeight - Ae * 2, W = h.scrollHeight, V = window.getComputedStyle(c), z = parseInt(V.borderTopWidth, 10), B = parseInt(V.paddingTop, 10), U = parseInt(V.borderBottomWidth, 10), I = parseInt(V.paddingBottom, 10), N = z + B + W + I + U, D = Math.min(v.offsetHeight * 5, N), j = window.getComputedStyle(h), q = parseInt(j.paddingTop, 10), J = parseInt(j.paddingBottom, 10), ae = S.top + S.height / 2 - Ae, Se = O - ae, he = v.offsetHeight / 2, G = v.offsetTop + he, ee = z + B + G, re = N - ee;
      if (ee <= ae) {
        const te = C.length > 0 && v === C[C.length - 1].ref.current;
        a.style.bottom = "0px";
        const ne = c.clientHeight - h.offsetTop - h.offsetHeight, we = Math.max(
          Se,
          he + // viewport might have padding bottom, include it to avoid a scrollable viewport
          (te ? J : 0) + ne + U
        ), Me = ee + we;
        a.style.height = Me + "px";
      } else {
        const te = C.length > 0 && v === C[0].ref.current;
        a.style.top = "0px";
        const we = Math.max(
          ae,
          z + h.offsetTop + // viewport might have padding top, include it to avoid a scrollable viewport
          (te ? q : 0) + he
        ) + re;
        a.style.height = we + "px", h.scrollTop = ee - ae + h.offsetTop;
      }
      a.style.margin = `${Ae}px 0`, a.style.minHeight = D + "px", a.style.maxHeight = O + "px", o == null || o(), requestAnimationFrame(() => p.current = !0);
    }
  }, [
    f,
    i.trigger,
    i.valueNode,
    a,
    c,
    h,
    v,
    g,
    i.dir,
    o
  ]);
  fe(() => y(), [y]);
  const [x, k] = $();
  fe(() => {
    c && k(window.getComputedStyle(c).zIndex);
  }, [c]);
  const A = H(
    (S) => {
      S && m.current === !0 && (y(), w == null || w(), m.current = !1);
    },
    [y, w]
  );
  return /* @__PURE__ */ b(
    vg,
    {
      scope: n,
      contentWrapper: a,
      shouldExpandOnScrollRef: p,
      onScrollButtonChange: A,
      children: /* @__PURE__ */ b(
        "div",
        {
          ref: l,
          style: {
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            zIndex: x
          },
          children: /* @__PURE__ */ b(
            K.div,
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
qc.displayName = hg;
var mg = "SelectPopperPosition", Ar = P((e, t) => {
  const {
    __scopeSelect: n,
    align: o = "start",
    collisionPadding: r = Ae,
    ...i
  } = e, s = No(n);
  return /* @__PURE__ */ b(
    wn,
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
Ar.displayName = mg;
var [vg, mi] = zt(ht, {}), kr = "SelectViewport", Jc = P(
  (e, t) => {
    const { __scopeSelect: n, nonce: o, ...r } = e, i = nt(kr, n), s = mi(kr, n), a = X(t, i.onViewportChange), l = T(0);
    return /* @__PURE__ */ b(le, { children: [
      /* @__PURE__ */ b(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: "[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}"
          },
          nonce: o
        }
      ),
      /* @__PURE__ */ b(Ao.Slot, { scope: n, children: /* @__PURE__ */ b(
        K.div,
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
          onScroll: R(r.onScroll, (c) => {
            const u = c.currentTarget, { contentWrapper: d, shouldExpandOnScrollRef: f } = s;
            if (f != null && f.current && d) {
              const p = Math.abs(l.current - u.scrollTop);
              if (p > 0) {
                const m = window.innerHeight - Ae * 2, h = parseFloat(d.style.minHeight), v = parseFloat(d.style.height), g = Math.max(h, v);
                if (g < m) {
                  const w = g + p, y = Math.min(m, w), x = w - y;
                  d.style.height = y + "px", d.style.bottom === "0px" && (u.scrollTop = x > 0 ? x : 0, d.style.justifyContent = "flex-end");
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
Jc.displayName = kr;
var Zc = "SelectGroup", [gg, bg] = zt(Zc), wg = P(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e, r = Pe();
    return /* @__PURE__ */ b(gg, { scope: n, id: r, children: /* @__PURE__ */ b(K.div, { role: "group", "aria-labelledby": r, ...o, ref: t }) });
  }
);
wg.displayName = Zc;
var Qc = "SelectLabel", yg = P(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e, r = bg(Qc, n);
    return /* @__PURE__ */ b(K.div, { id: r.id, ...o, ref: t });
  }
);
yg.displayName = Qc;
var eo = "SelectItem", [_g, el] = zt(eo), tl = P(
  (e, t) => {
    const {
      __scopeSelect: n,
      value: o,
      disabled: r = !1,
      textValue: i,
      ...s
    } = e, a = tt(eo, n), l = nt(eo, n), c = a.value === o, [u, d] = $(i ?? ""), [f, p] = $(!1), m = X(
      t,
      (w) => {
        var y;
        return (y = l.itemRefCallback) == null ? void 0 : y.call(l, w, o, r);
      }
    ), h = Pe(), v = T("touch"), g = () => {
      r || (a.onValueChange(o), a.onOpenChange(!1));
    };
    if (o === "")
      throw new Error(
        "A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder."
      );
    return /* @__PURE__ */ b(
      _g,
      {
        scope: n,
        value: o,
        disabled: r,
        textId: h,
        isSelected: c,
        onItemTextChange: H((w) => {
          d((y) => y || ((w == null ? void 0 : w.textContent) ?? "").trim());
        }, []),
        children: /* @__PURE__ */ b(
          Ao.ItemSlot,
          {
            scope: n,
            value: o,
            disabled: r,
            textValue: u,
            children: /* @__PURE__ */ b(
              K.div,
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
                ref: m,
                onFocus: R(s.onFocus, () => p(!0)),
                onBlur: R(s.onBlur, () => p(!1)),
                onClick: R(s.onClick, () => {
                  v.current !== "mouse" && g();
                }),
                onPointerUp: R(s.onPointerUp, () => {
                  v.current === "mouse" && g();
                }),
                onPointerDown: R(s.onPointerDown, (w) => {
                  v.current = w.pointerType;
                }),
                onPointerMove: R(s.onPointerMove, (w) => {
                  var y;
                  v.current = w.pointerType, r ? (y = l.onItemLeave) == null || y.call(l) : v.current === "mouse" && w.currentTarget.focus({ preventScroll: !0 });
                }),
                onPointerLeave: R(s.onPointerLeave, (w) => {
                  var y;
                  w.currentTarget === document.activeElement && ((y = l.onItemLeave) == null || y.call(l));
                }),
                onKeyDown: R(s.onKeyDown, (w) => {
                  var x;
                  ((x = l.searchRef) == null ? void 0 : x.current) !== "" && w.key === " " || (ig.includes(w.key) && g(), w.key === " " && w.preventDefault());
                })
              }
            )
          }
        )
      }
    );
  }
);
tl.displayName = eo;
var Qt = "SelectItemText", nl = P(
  (e, t) => {
    const { __scopeSelect: n, className: o, style: r, ...i } = e, s = tt(Qt, n), a = nt(Qt, n), l = el(Qt, n), c = lg(Qt, n), [u, d] = $(null), f = X(
      t,
      (g) => d(g),
      l.onItemTextChange,
      (g) => {
        var w;
        return (w = a.itemTextRefCallback) == null ? void 0 : w.call(a, g, l.value, l.disabled);
      }
    ), p = u == null ? void 0 : u.textContent, m = de(
      () => /* @__PURE__ */ b("option", { value: l.value, disabled: l.disabled, children: p }, l.value),
      [l.disabled, l.value, p]
    ), { onNativeOptionAdd: h, onNativeOptionRemove: v } = c;
    return fe(() => (h(m), () => v(m)), [h, v, m]), /* @__PURE__ */ b(le, { children: [
      /* @__PURE__ */ b(K.span, { id: l.textId, ...i, ref: f }),
      l.isSelected && s.valueNode && !s.valueNodeHasChildren ? vt(i.children, s.valueNode) : null
    ] });
  }
);
nl.displayName = Qt;
var ol = "SelectItemIndicator", rl = P(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e;
    return el(ol, n).isSelected ? /* @__PURE__ */ b(K.span, { "aria-hidden": !0, ...o, ref: t }) : null;
  }
);
rl.displayName = ol;
var Nr = "SelectScrollUpButton", xg = P((e, t) => {
  const n = nt(Nr, e.__scopeSelect), o = mi(Nr, e.__scopeSelect), [r, i] = $(!1), s = X(t, o.onScrollButtonChange);
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
    il,
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
xg.displayName = Nr;
var Pr = "SelectScrollDownButton", Cg = P((e, t) => {
  const n = nt(Pr, e.__scopeSelect), o = mi(Pr, e.__scopeSelect), [r, i] = $(!1), s = X(t, o.onScrollButtonChange);
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
    il,
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
Cg.displayName = Pr;
var il = P((e, t) => {
  const { __scopeSelect: n, onAutoScroll: o, ...r } = e, i = nt("SelectScrollButton", n), s = T(null), a = ko(n), l = H(() => {
    s.current !== null && (window.clearInterval(s.current), s.current = null);
  }, []);
  return F(() => () => l(), [l]), fe(() => {
    var u;
    const c = a().find((d) => d.ref.current === document.activeElement);
    (u = c == null ? void 0 : c.ref.current) == null || u.scrollIntoView({ block: "nearest" });
  }, [a]), /* @__PURE__ */ b(
    K.div,
    {
      "aria-hidden": !0,
      ...r,
      ref: t,
      style: { flexShrink: 0, ...r.style },
      onPointerDown: R(r.onPointerDown, () => {
        s.current === null && (s.current = window.setInterval(o, 50));
      }),
      onPointerMove: R(r.onPointerMove, () => {
        var c;
        (c = i.onItemLeave) == null || c.call(i), s.current === null && (s.current = window.setInterval(o, 50));
      }),
      onPointerLeave: R(r.onPointerLeave, () => {
        l();
      })
    }
  );
}), Sg = "SelectSeparator", Ag = P(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e;
    return /* @__PURE__ */ b(K.div, { "aria-hidden": !0, ...o, ref: t });
  }
);
Ag.displayName = Sg;
var Er = "SelectArrow", kg = P(
  (e, t) => {
    const { __scopeSelect: n, ...o } = e, r = No(n), i = tt(Er, n), s = nt(Er, n);
    return i.open && s.position === "popper" ? /* @__PURE__ */ b(yn, { ...r, ...o, ref: t }) : null;
  }
);
kg.displayName = Er;
var Ng = "SelectBubbleInput", sl = P(
  ({ __scopeSelect: e, value: t, ...n }, o) => {
    const r = T(null), i = X(o, r), s = po(t);
    return F(() => {
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
      K.select,
      {
        ...n,
        style: { ...Tc, ...n.style },
        ref: i,
        defaultValue: t
      }
    );
  }
);
sl.displayName = Ng;
function al(e) {
  return e === "" || e === void 0;
}
function cl(e) {
  const t = Ne(e), n = T(""), o = T(0), r = H(
    (s) => {
      const a = n.current + s;
      t(a), function l(c) {
        n.current = c, window.clearTimeout(o.current), c !== "" && (o.current = window.setTimeout(() => l(""), 1e3));
      }(a);
    },
    [t]
  ), i = H(() => {
    n.current = "", window.clearTimeout(o.current);
  }, []);
  return F(() => () => window.clearTimeout(o.current), []), [n, r, i];
}
function ll(e, t, n) {
  const r = t.length > 1 && Array.from(t).every((c) => c === t[0]) ? t[0] : t, i = n ? e.indexOf(n) : -1;
  let s = Pg(e, Math.max(i, 0));
  r.length === 1 && (s = s.filter((c) => c !== n));
  const l = s.find(
    (c) => c.textValue.toLowerCase().startsWith(r.toLowerCase())
  );
  return l !== n ? l : void 0;
}
function Pg(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
var Eg = Wc, Tg = Vc, Lg = jc, Mg = zc, Rg = Kc, Og = Gc, Ig = Jc, Dg = tl, Fg = nl, Bg = rl;
function $g(e) {
  const { value: t, options: n, onChange: o, placeholder: r, disabled: i } = e, s = n || [], a = e.class || "", l = ce(e), c = Ye();
  return _(
    Eg,
    {
      value: t != null ? String(t) : void 0,
      onValueChange: (u) => {
        o != null && Z(o, JSON.stringify({ Value: u }));
      },
      disabled: i || !1
    },
    _(
      Tg,
      {
        className: [
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          a
        ].filter(Boolean).join(" "),
        style: l
      },
      _(Lg, { placeholder: r || "Select..." }),
      _(
        Mg,
        { className: "ml-2 opacity-50" },
        _(
          "svg",
          { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          _("path", { d: "m6 9 6 6 6-6" })
        )
      )
    ),
    _(
      Rg,
      { container: c ?? void 0 },
      _(
        Og,
        {
          className: [
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            "animate-scale-in"
          ].join(" "),
          position: "popper",
          sideOffset: 4
        },
        _(
          Ig,
          { className: "p-1" },
          s.map(
            (u) => _(
              Dg,
              {
                key: u.value,
                value: u.value,
                className: [
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                ].join(" ")
              },
              _(Fg, null, u.label),
              _(
                Bg,
                { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center" },
                _(
                  "svg",
                  { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
                  _("polyline", { points: "20 6 9 17 4 12" })
                )
              )
            )
          )
        )
      )
    )
  );
}
function Wg(e) {
  var f;
  const { open: t, onClose: n, voChildren: o } = e, r = o || [], i = e.class || "", s = ce(e), a = Ye(), l = () => {
    n != null && Z(n, "{}");
  };
  F(() => {
    if (!t) return;
    const p = (m) => {
      m.key === "Escape" && (m.preventDefault(), l());
    };
    return document.addEventListener("keydown", p), () => {
      document.removeEventListener("keydown", p);
    };
  }, [t]);
  let c = e.title, u = r;
  if (!c) {
    const p = r.findIndex((m) => (m == null ? void 0 : m.type) === "vo-dialog-title");
    p >= 0 && (c = (f = r[p].props) == null ? void 0 : f.textContent, u = r.filter((m, h) => h !== p));
  }
  if (!t)
    return null;
  const d = _(
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
    _(
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
        onClick: (p) => p.stopPropagation()
      },
      c ? _("h2", { className: "text-lg font-semibold leading-none tracking-tight" }, c) : null,
      _("div", { className: "mt-4" }, ...u.map(ue)),
      _(
        "button",
        {
          type: "button",
          className: "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
          onClick: l
        },
        _(
          "svg",
          { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          _("path", { d: "M18 6 6 18" }),
          _("path", { d: "m6 6 12 12" })
        )
      )
    )
  );
  return a ? vt(d, a) : d;
}
function Hg(e) {
  var h;
  const { open: t, onClose: n, side: o, voChildren: r } = e, i = r || [], s = o || "right", a = e.class || "", l = ce(e), c = Ye(), u = () => {
    n != null && Z(n, "{}");
  };
  F(() => {
    if (!t) return;
    const v = (g) => {
      g.key === "Escape" && (g.preventDefault(), u());
    };
    return document.addEventListener("keydown", v), () => {
      document.removeEventListener("keydown", v);
    };
  }, [t]);
  let d = e.title, f = i;
  if (!d) {
    const v = i.findIndex((g) => (g == null ? void 0 : g.type) === "vo-dialog-title");
    v >= 0 && (d = (h = i[v].props) == null ? void 0 : h.textContent, f = i.filter((g, w) => w !== v));
  }
  const p = {
    left: "absolute inset-y-0 left-0 flex h-full w-3/4 max-w-sm flex-col animate-slide-in-from-left",
    right: "absolute inset-y-0 right-0 flex h-full w-3/4 max-w-sm flex-col animate-slide-in-from-right",
    top: "absolute inset-x-0 top-0 flex max-h-[85%] flex-col animate-slide-in-from-top",
    bottom: "absolute inset-x-0 bottom-0 flex max-h-[85%] flex-col animate-slide-in-from-bottom"
  };
  if (!t)
    return null;
  const m = _(
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
    _(
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
        onClick: (v) => v.stopPropagation()
      },
      d ? _("h2", { className: "text-lg font-semibold" }, d) : null,
      _("div", {
        className: [
          d ? "mt-4" : "",
          "flex min-h-0 flex-1 flex-col overflow-auto"
        ].filter(Boolean).join(" ")
      }, ...f.map(ue)),
      _(
        "button",
        {
          type: "button",
          className: "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
          onClick: u
        },
        _(
          "svg",
          { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          _("path", { d: "M18 6 6 18" }),
          _("path", { d: "m6 6 12 12" })
        )
      )
    )
  );
  return c ? vt(m, c) : m;
}
var [Po] = pe("Tooltip", [
  We
]), Eo = We(), ul = "TooltipProvider", Vg = 700, Tr = "tooltip.open", [Ug, vi] = Po(ul), dl = (e) => {
  const {
    __scopeTooltip: t,
    delayDuration: n = Vg,
    skipDelayDuration: o = 300,
    disableHoverableContent: r = !1,
    children: i
  } = e, s = T(!0), a = T(!1), l = T(0);
  return F(() => {
    const c = l.current;
    return () => window.clearTimeout(c);
  }, []), /* @__PURE__ */ b(
    Ug,
    {
      scope: t,
      isOpenDelayedRef: s,
      delayDuration: n,
      onOpen: H(() => {
        window.clearTimeout(l.current), s.current = !1;
      }, []),
      onClose: H(() => {
        window.clearTimeout(l.current), l.current = window.setTimeout(
          () => s.current = !0,
          o
        );
      }, [o]),
      isPointerInTransitRef: a,
      onPointerInTransitChange: H((c) => {
        a.current = c;
      }, []),
      disableHoverableContent: r,
      children: i
    }
  );
};
dl.displayName = ul;
var an = "Tooltip", [jg, _n] = Po(an), fl = (e) => {
  const {
    __scopeTooltip: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    disableHoverableContent: s,
    delayDuration: a
  } = e, l = vi(an, e.__scopeTooltip), c = Eo(t), [u, d] = $(null), f = Pe(), p = T(0), m = s ?? l.disableHoverableContent, h = a ?? l.delayDuration, v = T(!1), [g, w] = ge({
    prop: o,
    defaultProp: r ?? !1,
    onChange: (S) => {
      S ? (l.onOpen(), document.dispatchEvent(new CustomEvent(Tr))) : l.onClose(), i == null || i(S);
    },
    caller: an
  }), y = de(() => g ? v.current ? "delayed-open" : "instant-open" : "closed", [g]), x = H(() => {
    window.clearTimeout(p.current), p.current = 0, v.current = !1, w(!0);
  }, [w]), k = H(() => {
    window.clearTimeout(p.current), p.current = 0, w(!1);
  }, [w]), A = H(() => {
    window.clearTimeout(p.current), p.current = window.setTimeout(() => {
      v.current = !0, w(!0), p.current = 0;
    }, h);
  }, [h, w]);
  return F(() => () => {
    p.current && (window.clearTimeout(p.current), p.current = 0);
  }, []), /* @__PURE__ */ b(bn, { ...c, children: /* @__PURE__ */ b(
    jg,
    {
      scope: t,
      contentId: f,
      open: g,
      stateAttribute: y,
      trigger: u,
      onTriggerChange: d,
      onTriggerEnter: H(() => {
        l.isOpenDelayedRef.current ? A() : x();
      }, [l.isOpenDelayedRef, A, x]),
      onTriggerLeave: H(() => {
        m ? k() : (window.clearTimeout(p.current), p.current = 0);
      }, [k, m]),
      onOpen: x,
      onClose: k,
      disableHoverableContent: m,
      children: n
    }
  ) });
};
fl.displayName = an;
var Lr = "TooltipTrigger", pl = P(
  (e, t) => {
    const { __scopeTooltip: n, ...o } = e, r = _n(Lr, n), i = vi(Lr, n), s = Eo(n), a = T(null), l = X(t, a, r.onTriggerChange), c = T(!1), u = T(!1), d = H(() => c.current = !1, []);
    return F(() => () => document.removeEventListener("pointerup", d), [d]), /* @__PURE__ */ b(Ut, { asChild: !0, ...s, children: /* @__PURE__ */ b(
      K.button,
      {
        "aria-describedby": r.open ? r.contentId : void 0,
        "data-state": r.stateAttribute,
        ...o,
        ref: l,
        onPointerMove: R(e.onPointerMove, (f) => {
          f.pointerType !== "touch" && !u.current && !i.isPointerInTransitRef.current && (r.onTriggerEnter(), u.current = !0);
        }),
        onPointerLeave: R(e.onPointerLeave, () => {
          r.onTriggerLeave(), u.current = !1;
        }),
        onPointerDown: R(e.onPointerDown, () => {
          r.open && r.onClose(), c.current = !0, document.addEventListener("pointerup", d, { once: !0 });
        }),
        onFocus: R(e.onFocus, () => {
          c.current || r.onOpen();
        }),
        onBlur: R(e.onBlur, r.onClose),
        onClick: R(e.onClick, r.onClose)
      }
    ) });
  }
);
pl.displayName = Lr;
var gi = "TooltipPortal", [zg, Kg] = Po(gi, {
  forceMount: void 0
}), hl = (e) => {
  const { __scopeTooltip: t, forceMount: n, children: o, container: r } = e, i = _n(gi, t);
  return /* @__PURE__ */ b(zg, { scope: t, forceMount: n, children: /* @__PURE__ */ b(be, { present: n || i.open, children: /* @__PURE__ */ b(jt, { asChild: !0, container: r, children: o }) }) });
};
hl.displayName = gi;
var Ot = "TooltipContent", ml = P(
  (e, t) => {
    const n = Kg(Ot, e.__scopeTooltip), { forceMount: o = n.forceMount, side: r = "top", ...i } = e, s = _n(Ot, e.__scopeTooltip);
    return /* @__PURE__ */ b(be, { present: o || s.open, children: s.disableHoverableContent ? /* @__PURE__ */ b(vl, { side: r, ...i, ref: t }) : /* @__PURE__ */ b(Gg, { side: r, ...i, ref: t }) });
  }
), Gg = P((e, t) => {
  const n = _n(Ot, e.__scopeTooltip), o = vi(Ot, e.__scopeTooltip), r = T(null), i = X(t, r), [s, a] = $(null), { trigger: l, onClose: c } = n, u = r.current, { onPointerInTransitChange: d } = o, f = H(() => {
    a(null), d(!1);
  }, [d]), p = H(
    (m, h) => {
      const v = m.currentTarget, g = { x: m.clientX, y: m.clientY }, w = Jg(g, v.getBoundingClientRect()), y = Zg(g, w), x = Qg(h.getBoundingClientRect()), k = tb([...y, ...x]);
      a(k), d(!0);
    },
    [d]
  );
  return F(() => () => f(), [f]), F(() => {
    if (l && u) {
      const m = (v) => p(v, u), h = (v) => p(v, l);
      return l.addEventListener("pointerleave", m), u.addEventListener("pointerleave", h), () => {
        l.removeEventListener("pointerleave", m), u.removeEventListener("pointerleave", h);
      };
    }
  }, [l, u, p, f]), F(() => {
    if (s) {
      const m = (h) => {
        const v = h.target, g = { x: h.clientX, y: h.clientY }, w = (l == null ? void 0 : l.contains(v)) || (u == null ? void 0 : u.contains(v)), y = !eb(g, s);
        w ? f() : y && (f(), c());
      };
      return document.addEventListener("pointermove", m), () => document.removeEventListener("pointermove", m);
    }
  }, [l, u, s, c, f]), /* @__PURE__ */ b(vl, { ...e, ref: i });
}), [Yg, Xg] = Po(an, { isInside: !1 }), qg = /* @__PURE__ */ qp("TooltipContent"), vl = P(
  (e, t) => {
    const {
      __scopeTooltip: n,
      children: o,
      "aria-label": r,
      onEscapeKeyDown: i,
      onPointerDownOutside: s,
      ...a
    } = e, l = _n(Ot, n), c = Eo(n), { onClose: u } = l;
    return F(() => (document.addEventListener(Tr, u), () => document.removeEventListener(Tr, u)), [u]), F(() => {
      if (l.trigger) {
        const d = (f) => {
          const p = f.target;
          p != null && p.contains(l.trigger) && u();
        };
        return window.addEventListener("scroll", d, { capture: !0 }), () => window.removeEventListener("scroll", d, { capture: !0 });
      }
    }, [l.trigger, u]), /* @__PURE__ */ b(
      Wt,
      {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: i,
        onPointerDownOutside: s,
        onFocusOutside: (d) => d.preventDefault(),
        onDismiss: u,
        children: /* @__PURE__ */ b(
          wn,
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
              /* @__PURE__ */ b(qg, { children: o }),
              /* @__PURE__ */ b(Yg, { scope: n, isInside: !0, children: /* @__PURE__ */ b(bv, { id: l.contentId, role: "tooltip", children: r || o }) })
            ]
          }
        )
      }
    );
  }
);
ml.displayName = Ot;
var gl = "TooltipArrow", bl = P(
  (e, t) => {
    const { __scopeTooltip: n, ...o } = e, r = Eo(n);
    return Xg(
      gl,
      n
    ).isInside ? null : /* @__PURE__ */ b(yn, { ...r, ...o, ref: t });
  }
);
bl.displayName = gl;
function Jg(e, t) {
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
function Zg(e, t, n = 5) {
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
function Qg(e) {
  const { top: t, right: n, bottom: o, left: r } = e;
  return [
    { x: r, y: t },
    { x: n, y: t },
    { x: n, y: o },
    { x: r, y: o }
  ];
}
function eb(e, t) {
  const { x: n, y: o } = e;
  let r = !1;
  for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
    const a = t[i], l = t[s], c = a.x, u = a.y, d = l.x, f = l.y;
    u > o != f > o && n < (d - c) * (o - u) / (f - u) + c && (r = !r);
  }
  return r;
}
function tb(e) {
  const t = e.slice();
  return t.sort((n, o) => n.x < o.x ? -1 : n.x > o.x ? 1 : n.y < o.y ? -1 : n.y > o.y ? 1 : 0), nb(t);
}
function nb(e) {
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
var ob = dl, rb = fl, ib = pl, sb = hl, ab = ml, cb = bl;
function lb(e) {
  const { textContent: t, side: n, voChildren: o } = e, r = o || [], i = Ye(), s = r[0];
  return _(
    ob,
    { delayDuration: 200 },
    _(
      rb,
      null,
      _(
        ib,
        { asChild: !0 },
        s ? ue(s) : _("span", null)
      ),
      _(
        sb,
        { container: i ?? void 0 },
        _(
          ab,
          {
            className: [
              "z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md",
              "animate-scale-in"
            ].join(" "),
            side: n || "top",
            sideOffset: 4
          },
          t || "",
          _(cb, { className: "fill-foreground" })
        )
      )
    )
  );
}
var To = "Popover", [wl] = pe(To, [
  We
]), xn = We(), [ub, ot] = wl(To), yl = (e) => {
  const {
    __scopePopover: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    modal: s = !1
  } = e, a = xn(t), l = T(null), [c, u] = $(!1), [d, f] = ge({
    prop: o,
    defaultProp: r ?? !1,
    onChange: i,
    caller: To
  });
  return /* @__PURE__ */ b(bn, { ...a, children: /* @__PURE__ */ b(
    ub,
    {
      scope: t,
      contentId: Pe(),
      triggerRef: l,
      open: d,
      onOpenChange: f,
      onOpenToggle: H(() => f((p) => !p), [f]),
      hasCustomAnchor: c,
      onCustomAnchorAdd: H(() => u(!0), []),
      onCustomAnchorRemove: H(() => u(!1), []),
      modal: s,
      children: n
    }
  ) });
};
yl.displayName = To;
var _l = "PopoverAnchor", db = P(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = ot(_l, n), i = xn(n), { onCustomAnchorAdd: s, onCustomAnchorRemove: a } = r;
    return F(() => (s(), () => a()), [s, a]), /* @__PURE__ */ b(Ut, { ...i, ...o, ref: t });
  }
);
db.displayName = _l;
var xl = "PopoverTrigger", Cl = P(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = ot(xl, n), i = xn(n), s = X(t, r.triggerRef), a = /* @__PURE__ */ b(
      K.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": r.open,
        "aria-controls": r.contentId,
        "data-state": El(r.open),
        ...o,
        ref: s,
        onClick: R(e.onClick, r.onOpenToggle)
      }
    );
    return r.hasCustomAnchor ? a : /* @__PURE__ */ b(Ut, { asChild: !0, ...i, children: a });
  }
);
Cl.displayName = xl;
var bi = "PopoverPortal", [fb, pb] = wl(bi, {
  forceMount: void 0
}), Sl = (e) => {
  const { __scopePopover: t, forceMount: n, children: o, container: r } = e, i = ot(bi, t);
  return /* @__PURE__ */ b(fb, { scope: t, forceMount: n, children: /* @__PURE__ */ b(be, { present: n || i.open, children: /* @__PURE__ */ b(jt, { asChild: !0, container: r, children: o }) }) });
};
Sl.displayName = bi;
var It = "PopoverContent", Al = P(
  (e, t) => {
    const n = pb(It, e.__scopePopover), { forceMount: o = n.forceMount, ...r } = e, i = ot(It, e.__scopePopover);
    return /* @__PURE__ */ b(be, { present: o || i.open, children: i.modal ? /* @__PURE__ */ b(mb, { ...r, ref: t }) : /* @__PURE__ */ b(vb, { ...r, ref: t }) });
  }
);
Al.displayName = It;
var hb = /* @__PURE__ */ Mt("PopoverContent.RemoveScroll"), mb = P(
  (e, t) => {
    const n = ot(It, e.__scopePopover), o = T(null), r = X(t, o), i = T(!1);
    return F(() => {
      const s = o.current;
      if (s) return hi(s);
    }, []), /* @__PURE__ */ b(So, { as: hb, allowPinchZoom: !0, children: /* @__PURE__ */ b(
      kl,
      {
        ...e,
        ref: r,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: R(e.onCloseAutoFocus, (s) => {
          var a;
          s.preventDefault(), i.current || (a = n.triggerRef.current) == null || a.focus();
        }),
        onPointerDownOutside: R(
          e.onPointerDownOutside,
          (s) => {
            const a = s.detail.originalEvent, l = a.button === 0 && a.ctrlKey === !0, c = a.button === 2 || l;
            i.current = c;
          },
          { checkForDefaultPrevented: !1 }
        ),
        onFocusOutside: R(
          e.onFocusOutside,
          (s) => s.preventDefault(),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
), vb = P(
  (e, t) => {
    const n = ot(It, e.__scopePopover), o = T(!1), r = T(!1);
    return /* @__PURE__ */ b(
      kl,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (i) => {
          var s, a;
          (s = e.onCloseAutoFocus) == null || s.call(e, i), i.defaultPrevented || (o.current || (a = n.triggerRef.current) == null || a.focus(), i.preventDefault()), o.current = !1, r.current = !1;
        },
        onInteractOutside: (i) => {
          var l, c;
          (l = e.onInteractOutside) == null || l.call(e, i), i.defaultPrevented || (o.current = !0, i.detail.originalEvent.type === "pointerdown" && (r.current = !0));
          const s = i.target;
          ((c = n.triggerRef.current) == null ? void 0 : c.contains(s)) && i.preventDefault(), i.detail.originalEvent.type === "focusin" && r.current && i.preventDefault();
        }
      }
    );
  }
), kl = P(
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
    } = e, f = ot(It, n), p = xn(n);
    return ii(), /* @__PURE__ */ b(
      bo,
      {
        asChild: !0,
        loop: !0,
        trapped: o,
        onMountAutoFocus: r,
        onUnmountAutoFocus: i,
        children: /* @__PURE__ */ b(
          Wt,
          {
            asChild: !0,
            disableOutsidePointerEvents: s,
            onInteractOutside: u,
            onEscapeKeyDown: a,
            onPointerDownOutside: l,
            onFocusOutside: c,
            onDismiss: () => f.onOpenChange(!1),
            children: /* @__PURE__ */ b(
              wn,
              {
                "data-state": El(f.open),
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
), Nl = "PopoverClose", gb = P(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = ot(Nl, n);
    return /* @__PURE__ */ b(
      K.button,
      {
        type: "button",
        ...o,
        ref: t,
        onClick: R(e.onClick, () => r.onOpenChange(!1))
      }
    );
  }
);
gb.displayName = Nl;
var bb = "PopoverArrow", Pl = P(
  (e, t) => {
    const { __scopePopover: n, ...o } = e, r = xn(n);
    return /* @__PURE__ */ b(yn, { ...r, ...o, ref: t });
  }
);
Pl.displayName = bb;
function El(e) {
  return e ? "open" : "closed";
}
var wb = yl, yb = Cl, _b = Sl, xb = Al, Cb = Pl;
function Sb(e) {
  const { open: t, onOpenChange: n, side: o, voChildren: r } = e, i = r || [], s = Ye(), a = i[0], l = i.slice(1);
  return _(
    wb,
    {
      open: t != null ? !!t : void 0
    },
    _(
      yb,
      { asChild: !0 },
      a ? ue(a) : _("span", null)
    ),
    _(
      _b,
      { container: s ?? void 0 },
      _(
        xb,
        {
          className: [
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "animate-scale-in"
          ].join(" "),
          side: o || "bottom",
          sideOffset: 4,
          align: "center"
        },
        ...l.map(ue),
        _(Cb, { className: "fill-popover" })
      )
    )
  );
}
var sr = "rovingFocusGroup.onEntryFocus", Ab = { bubbles: !1, cancelable: !0 }, Cn = "RovingFocusGroup", [Mr, Tl, kb] = vn(Cn), [Nb, Lo] = pe(
  Cn,
  [kb]
), [Pb, Eb] = Nb(Cn), Ll = P(
  (e, t) => /* @__PURE__ */ b(Mr.Provider, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ b(Mr.Slot, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ b(Tb, { ...e, ref: t }) }) })
);
Ll.displayName = Cn;
var Tb = P((e, t) => {
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
  } = e, f = T(null), p = X(t, f), m = Bt(i), [h, v] = ge({
    prop: s,
    defaultProp: a ?? null,
    onChange: l,
    caller: Cn
  }), [g, w] = $(!1), y = Ne(c), x = Tl(n), k = T(!1), [A, S] = $(0);
  return F(() => {
    const M = f.current;
    if (M)
      return M.addEventListener(sr, y), () => M.removeEventListener(sr, y);
  }, [y]), /* @__PURE__ */ b(
    Pb,
    {
      scope: n,
      orientation: o,
      dir: m,
      loop: r,
      currentTabStopId: h,
      onItemFocus: H(
        (M) => v(M),
        [v]
      ),
      onItemShiftTab: H(() => w(!0), []),
      onFocusableItemAdd: H(
        () => S((M) => M + 1),
        []
      ),
      onFocusableItemRemove: H(
        () => S((M) => M - 1),
        []
      ),
      children: /* @__PURE__ */ b(
        K.div,
        {
          tabIndex: g || A === 0 ? -1 : 0,
          "data-orientation": o,
          ...d,
          ref: p,
          style: { outline: "none", ...e.style },
          onMouseDown: R(e.onMouseDown, () => {
            k.current = !0;
          }),
          onFocus: R(e.onFocus, (M) => {
            const L = !k.current;
            if (M.target === M.currentTarget && L && !g) {
              const E = new CustomEvent(sr, Ab);
              if (M.currentTarget.dispatchEvent(E), !E.defaultPrevented) {
                const C = x().filter((B) => B.focusable), O = C.find((B) => B.active), W = C.find((B) => B.id === h), z = [O, W, ...C].filter(
                  Boolean
                ).map((B) => B.ref.current);
                Ol(z, u);
              }
            }
            k.current = !1;
          }),
          onBlur: R(e.onBlur, () => w(!1))
        }
      )
    }
  );
}), Ml = "RovingFocusGroupItem", Rl = P(
  (e, t) => {
    const {
      __scopeRovingFocusGroup: n,
      focusable: o = !0,
      active: r = !1,
      tabStopId: i,
      children: s,
      ...a
    } = e, l = Pe(), c = i || l, u = Eb(Ml, n), d = u.currentTabStopId === c, f = Tl(n), { onFocusableItemAdd: p, onFocusableItemRemove: m, currentTabStopId: h } = u;
    return F(() => {
      if (o)
        return p(), () => m();
    }, [o, p, m]), /* @__PURE__ */ b(
      Mr.ItemSlot,
      {
        scope: n,
        id: c,
        focusable: o,
        active: r,
        children: /* @__PURE__ */ b(
          K.span,
          {
            tabIndex: d ? 0 : -1,
            "data-orientation": u.orientation,
            ...a,
            ref: t,
            onMouseDown: R(e.onMouseDown, (v) => {
              o ? u.onItemFocus(c) : v.preventDefault();
            }),
            onFocus: R(e.onFocus, () => u.onItemFocus(c)),
            onKeyDown: R(e.onKeyDown, (v) => {
              if (v.key === "Tab" && v.shiftKey) {
                u.onItemShiftTab();
                return;
              }
              if (v.target !== v.currentTarget) return;
              const g = Rb(v, u.orientation, u.dir);
              if (g !== void 0) {
                if (v.metaKey || v.ctrlKey || v.altKey || v.shiftKey) return;
                v.preventDefault();
                let y = f().filter((x) => x.focusable).map((x) => x.ref.current);
                if (g === "last") y.reverse();
                else if (g === "prev" || g === "next") {
                  g === "prev" && y.reverse();
                  const x = y.indexOf(v.currentTarget);
                  y = u.loop ? Ob(y, x + 1) : y.slice(x + 1);
                }
                setTimeout(() => Ol(y));
              }
            }),
            children: typeof s == "function" ? s({ isCurrentTabStop: d, hasTabStop: h != null }) : s
          }
        )
      }
    );
  }
);
Rl.displayName = Ml;
var Lb = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function Mb(e, t) {
  return t !== "rtl" ? e : e === "ArrowLeft" ? "ArrowRight" : e === "ArrowRight" ? "ArrowLeft" : e;
}
function Rb(e, t, n) {
  const o = Mb(e.key, n);
  if (!(t === "vertical" && ["ArrowLeft", "ArrowRight"].includes(o)) && !(t === "horizontal" && ["ArrowUp", "ArrowDown"].includes(o)))
    return Lb[o];
}
function Ol(e, t = !1) {
  const n = document.activeElement;
  for (const o of e)
    if (o === n || (o.focus({ preventScroll: t }), document.activeElement !== n)) return;
}
function Ob(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
var Il = Ll, Dl = Rl, Rr = ["Enter", " "], Ib = ["ArrowDown", "PageUp", "Home"], Fl = ["ArrowUp", "PageDown", "End"], Db = [...Ib, ...Fl], Fb = {
  ltr: [...Rr, "ArrowRight"],
  rtl: [...Rr, "ArrowLeft"]
}, Bb = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
}, Sn = "Menu", [cn, $b, Wb] = vn(Sn), [gt, Mo] = pe(Sn, [
  Wb,
  We,
  Lo
]), Ro = We(), Bl = Lo(), [Hb, bt] = gt(Sn), [Vb, An] = gt(Sn), $l = (e) => {
  const { __scopeMenu: t, open: n = !1, children: o, dir: r, onOpenChange: i, modal: s = !0 } = e, a = Ro(t), [l, c] = $(null), u = T(!1), d = Ne(i), f = Bt(r);
  return F(() => {
    const p = () => {
      u.current = !0, document.addEventListener("pointerdown", m, { capture: !0, once: !0 }), document.addEventListener("pointermove", m, { capture: !0, once: !0 });
    }, m = () => u.current = !1;
    return document.addEventListener("keydown", p, { capture: !0 }), () => {
      document.removeEventListener("keydown", p, { capture: !0 }), document.removeEventListener("pointerdown", m, { capture: !0 }), document.removeEventListener("pointermove", m, { capture: !0 });
    };
  }, []), /* @__PURE__ */ b(bn, { ...a, children: /* @__PURE__ */ b(
    Hb,
    {
      scope: t,
      open: n,
      onOpenChange: d,
      content: l,
      onContentChange: c,
      children: /* @__PURE__ */ b(
        Vb,
        {
          scope: t,
          onClose: H(() => d(!1), [d]),
          isUsingKeyboardRef: u,
          dir: f,
          modal: s,
          children: o
        }
      )
    }
  ) });
};
$l.displayName = Sn;
var Ub = "MenuAnchor", wi = P(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e, r = Ro(n);
    return /* @__PURE__ */ b(Ut, { ...r, ...o, ref: t });
  }
);
wi.displayName = Ub;
var yi = "MenuPortal", [jb, Wl] = gt(yi, {
  forceMount: void 0
}), Hl = (e) => {
  const { __scopeMenu: t, forceMount: n, children: o, container: r } = e, i = bt(yi, t);
  return /* @__PURE__ */ b(jb, { scope: t, forceMount: n, children: /* @__PURE__ */ b(be, { present: n || i.open, children: /* @__PURE__ */ b(jt, { asChild: !0, container: r, children: o }) }) });
};
Hl.displayName = yi;
var xe = "MenuContent", [zb, _i] = gt(xe), Vl = P(
  (e, t) => {
    const n = Wl(xe, e.__scopeMenu), { forceMount: o = n.forceMount, ...r } = e, i = bt(xe, e.__scopeMenu), s = An(xe, e.__scopeMenu);
    return /* @__PURE__ */ b(cn.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ b(be, { present: o || i.open, children: /* @__PURE__ */ b(cn.Slot, { scope: e.__scopeMenu, children: s.modal ? /* @__PURE__ */ b(Kb, { ...r, ref: t }) : /* @__PURE__ */ b(Gb, { ...r, ref: t }) }) }) });
  }
), Kb = P(
  (e, t) => {
    const n = bt(xe, e.__scopeMenu), o = T(null), r = X(t, o);
    return F(() => {
      const i = o.current;
      if (i) return hi(i);
    }, []), /* @__PURE__ */ b(
      xi,
      {
        ...e,
        ref: r,
        trapFocus: n.open,
        disableOutsidePointerEvents: n.open,
        disableOutsideScroll: !0,
        onFocusOutside: R(
          e.onFocusOutside,
          (i) => i.preventDefault(),
          { checkForDefaultPrevented: !1 }
        ),
        onDismiss: () => n.onOpenChange(!1)
      }
    );
  }
), Gb = P((e, t) => {
  const n = bt(xe, e.__scopeMenu);
  return /* @__PURE__ */ b(
    xi,
    {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => n.onOpenChange(!1)
    }
  );
}), Yb = /* @__PURE__ */ Mt("MenuContent.ScrollLock"), xi = P(
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
      disableOutsideScroll: m,
      ...h
    } = e, v = bt(xe, n), g = An(xe, n), w = Ro(n), y = Bl(n), x = $b(n), [k, A] = $(null), S = T(null), M = X(t, S, v.onContentChange), L = T(0), E = T(""), C = T(0), O = T(null), W = T("right"), V = T(0), z = m ? So : le, B = m ? { as: Yb, allowPinchZoom: !0 } : void 0, U = (N) => {
      var G, ee;
      const D = E.current + N, j = x().filter((re) => !re.disabled), q = document.activeElement, J = (G = j.find((re) => re.ref.current === q)) == null ? void 0 : G.textValue, ae = j.map((re) => re.textValue), Se = sw(ae, D, J), he = (ee = j.find((re) => re.textValue === Se)) == null ? void 0 : ee.ref.current;
      (function re(Q) {
        E.current = Q, window.clearTimeout(L.current), Q !== "" && (L.current = window.setTimeout(() => re(""), 1e3));
      })(D), he && setTimeout(() => he.focus());
    };
    F(() => () => window.clearTimeout(L.current), []), ii();
    const I = H((N) => {
      var j, q;
      return W.current === ((j = O.current) == null ? void 0 : j.side) && cw(N, (q = O.current) == null ? void 0 : q.area);
    }, []);
    return /* @__PURE__ */ b(
      zb,
      {
        scope: n,
        searchRef: E,
        onItemEnter: H(
          (N) => {
            I(N) && N.preventDefault();
          },
          [I]
        ),
        onItemLeave: H(
          (N) => {
            var D;
            I(N) || ((D = S.current) == null || D.focus(), A(null));
          },
          [I]
        ),
        onTriggerLeave: H(
          (N) => {
            I(N) && N.preventDefault();
          },
          [I]
        ),
        pointerGraceTimerRef: C,
        onPointerGraceIntentChange: H((N) => {
          O.current = N;
        }, []),
        children: /* @__PURE__ */ b(z, { ...B, children: /* @__PURE__ */ b(
          bo,
          {
            asChild: !0,
            trapped: r,
            onMountAutoFocus: R(i, (N) => {
              var D;
              N.preventDefault(), (D = S.current) == null || D.focus({ preventScroll: !0 });
            }),
            onUnmountAutoFocus: s,
            children: /* @__PURE__ */ b(
              Wt,
              {
                asChild: !0,
                disableOutsidePointerEvents: a,
                onEscapeKeyDown: c,
                onPointerDownOutside: u,
                onFocusOutside: d,
                onInteractOutside: f,
                onDismiss: p,
                children: /* @__PURE__ */ b(
                  Il,
                  {
                    asChild: !0,
                    ...y,
                    dir: g.dir,
                    orientation: "vertical",
                    loop: o,
                    currentTabStopId: k,
                    onCurrentTabStopIdChange: A,
                    onEntryFocus: R(l, (N) => {
                      g.isUsingKeyboardRef.current || N.preventDefault();
                    }),
                    preventScrollOnEntryFocus: !0,
                    children: /* @__PURE__ */ b(
                      wn,
                      {
                        role: "menu",
                        "aria-orientation": "vertical",
                        "data-state": ru(v.open),
                        "data-radix-menu-content": "",
                        dir: g.dir,
                        ...w,
                        ...h,
                        ref: M,
                        style: { outline: "none", ...h.style },
                        onKeyDown: R(h.onKeyDown, (N) => {
                          const j = N.target.closest("[data-radix-menu-content]") === N.currentTarget, q = N.ctrlKey || N.altKey || N.metaKey, J = N.key.length === 1;
                          j && (N.key === "Tab" && N.preventDefault(), !q && J && U(N.key));
                          const ae = S.current;
                          if (N.target !== ae || !Db.includes(N.key)) return;
                          N.preventDefault();
                          const he = x().filter((G) => !G.disabled).map((G) => G.ref.current);
                          Fl.includes(N.key) && he.reverse(), rw(he);
                        }),
                        onBlur: R(e.onBlur, (N) => {
                          N.currentTarget.contains(N.target) || (window.clearTimeout(L.current), E.current = "");
                        }),
                        onPointerMove: R(
                          e.onPointerMove,
                          ln((N) => {
                            const D = N.target, j = V.current !== N.clientX;
                            if (N.currentTarget.contains(D) && j) {
                              const q = N.clientX > V.current ? "right" : "left";
                              W.current = q, V.current = N.clientX;
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
Vl.displayName = xe;
var Xb = "MenuGroup", Ci = P(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return /* @__PURE__ */ b(K.div, { role: "group", ...o, ref: t });
  }
);
Ci.displayName = Xb;
var qb = "MenuLabel", Ul = P(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return /* @__PURE__ */ b(K.div, { ...o, ref: t });
  }
);
Ul.displayName = qb;
var to = "MenuItem", Os = "menu.itemSelect", Oo = P(
  (e, t) => {
    const { disabled: n = !1, onSelect: o, ...r } = e, i = T(null), s = An(to, e.__scopeMenu), a = _i(to, e.__scopeMenu), l = X(t, i), c = T(!1), u = () => {
      const d = i.current;
      if (!n && d) {
        const f = new CustomEvent(Os, { bubbles: !0, cancelable: !0 });
        d.addEventListener(Os, (p) => o == null ? void 0 : o(p), { once: !0 }), Ma(d, f), f.defaultPrevented ? c.current = !1 : s.onClose();
      }
    };
    return /* @__PURE__ */ b(
      jl,
      {
        ...r,
        ref: l,
        disabled: n,
        onClick: R(e.onClick, u),
        onPointerDown: (d) => {
          var f;
          (f = e.onPointerDown) == null || f.call(e, d), c.current = !0;
        },
        onPointerUp: R(e.onPointerUp, (d) => {
          var f;
          c.current || (f = d.currentTarget) == null || f.click();
        }),
        onKeyDown: R(e.onKeyDown, (d) => {
          const f = a.searchRef.current !== "";
          n || f && d.key === " " || Rr.includes(d.key) && (d.currentTarget.click(), d.preventDefault());
        })
      }
    );
  }
);
Oo.displayName = to;
var jl = P(
  (e, t) => {
    const { __scopeMenu: n, disabled: o = !1, textValue: r, ...i } = e, s = _i(to, n), a = Bl(n), l = T(null), c = X(t, l), [u, d] = $(!1), [f, p] = $("");
    return F(() => {
      const m = l.current;
      m && p((m.textContent ?? "").trim());
    }, [i.children]), /* @__PURE__ */ b(
      cn.ItemSlot,
      {
        scope: n,
        disabled: o,
        textValue: r ?? f,
        children: /* @__PURE__ */ b(Dl, { asChild: !0, ...a, focusable: !o, children: /* @__PURE__ */ b(
          K.div,
          {
            role: "menuitem",
            "data-highlighted": u ? "" : void 0,
            "aria-disabled": o || void 0,
            "data-disabled": o ? "" : void 0,
            ...i,
            ref: c,
            onPointerMove: R(
              e.onPointerMove,
              ln((m) => {
                o ? s.onItemLeave(m) : (s.onItemEnter(m), m.defaultPrevented || m.currentTarget.focus({ preventScroll: !0 }));
              })
            ),
            onPointerLeave: R(
              e.onPointerLeave,
              ln((m) => s.onItemLeave(m))
            ),
            onFocus: R(e.onFocus, () => d(!0)),
            onBlur: R(e.onBlur, () => d(!1))
          }
        ) })
      }
    );
  }
), Jb = "MenuCheckboxItem", zl = P(
  (e, t) => {
    const { checked: n = !1, onCheckedChange: o, ...r } = e;
    return /* @__PURE__ */ b(ql, { scope: e.__scopeMenu, checked: n, children: /* @__PURE__ */ b(
      Oo,
      {
        role: "menuitemcheckbox",
        "aria-checked": no(n) ? "mixed" : n,
        ...r,
        ref: t,
        "data-state": Ai(n),
        onSelect: R(
          r.onSelect,
          () => o == null ? void 0 : o(no(n) ? !0 : !n),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
zl.displayName = Jb;
var Kl = "MenuRadioGroup", [Zb, Qb] = gt(
  Kl,
  { value: void 0, onValueChange: () => {
  } }
), Gl = P(
  (e, t) => {
    const { value: n, onValueChange: o, ...r } = e, i = Ne(o);
    return /* @__PURE__ */ b(Zb, { scope: e.__scopeMenu, value: n, onValueChange: i, children: /* @__PURE__ */ b(Ci, { ...r, ref: t }) });
  }
);
Gl.displayName = Kl;
var Yl = "MenuRadioItem", Xl = P(
  (e, t) => {
    const { value: n, ...o } = e, r = Qb(Yl, e.__scopeMenu), i = n === r.value;
    return /* @__PURE__ */ b(ql, { scope: e.__scopeMenu, checked: i, children: /* @__PURE__ */ b(
      Oo,
      {
        role: "menuitemradio",
        "aria-checked": i,
        ...o,
        ref: t,
        "data-state": Ai(i),
        onSelect: R(
          o.onSelect,
          () => {
            var s;
            return (s = r.onValueChange) == null ? void 0 : s.call(r, n);
          },
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
Xl.displayName = Yl;
var Si = "MenuItemIndicator", [ql, ew] = gt(
  Si,
  { checked: !1 }
), Jl = P(
  (e, t) => {
    const { __scopeMenu: n, forceMount: o, ...r } = e, i = ew(Si, n);
    return /* @__PURE__ */ b(
      be,
      {
        present: o || no(i.checked) || i.checked === !0,
        children: /* @__PURE__ */ b(
          K.span,
          {
            ...r,
            ref: t,
            "data-state": Ai(i.checked)
          }
        )
      }
    );
  }
);
Jl.displayName = Si;
var tw = "MenuSeparator", Zl = P(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return /* @__PURE__ */ b(
      K.div,
      {
        role: "separator",
        "aria-orientation": "horizontal",
        ...o,
        ref: t
      }
    );
  }
);
Zl.displayName = tw;
var nw = "MenuArrow", Ql = P(
  (e, t) => {
    const { __scopeMenu: n, ...o } = e, r = Ro(n);
    return /* @__PURE__ */ b(yn, { ...r, ...o, ref: t });
  }
);
Ql.displayName = nw;
var ow = "MenuSub", [e0, eu] = gt(ow), en = "MenuSubTrigger", tu = P(
  (e, t) => {
    const n = bt(en, e.__scopeMenu), o = An(en, e.__scopeMenu), r = eu(en, e.__scopeMenu), i = _i(en, e.__scopeMenu), s = T(null), { pointerGraceTimerRef: a, onPointerGraceIntentChange: l } = i, c = { __scopeMenu: e.__scopeMenu }, u = H(() => {
      s.current && window.clearTimeout(s.current), s.current = null;
    }, []);
    return F(() => u, [u]), F(() => {
      const d = a.current;
      return () => {
        window.clearTimeout(d), l(null);
      };
    }, [a, l]), /* @__PURE__ */ b(wi, { asChild: !0, ...c, children: /* @__PURE__ */ b(
      jl,
      {
        id: r.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": n.open,
        "aria-controls": r.contentId,
        "data-state": ru(n.open),
        ...e,
        ref: fo(t, r.onTriggerChange),
        onClick: (d) => {
          var f;
          (f = e.onClick) == null || f.call(e, d), !(e.disabled || d.defaultPrevented) && (d.currentTarget.focus(), n.open || n.onOpenChange(!0));
        },
        onPointerMove: R(
          e.onPointerMove,
          ln((d) => {
            i.onItemEnter(d), !d.defaultPrevented && !e.disabled && !n.open && !s.current && (i.onPointerGraceIntentChange(null), s.current = window.setTimeout(() => {
              n.onOpenChange(!0), u();
            }, 100));
          })
        ),
        onPointerLeave: R(
          e.onPointerLeave,
          ln((d) => {
            var p, m;
            u();
            const f = (p = n.content) == null ? void 0 : p.getBoundingClientRect();
            if (f) {
              const h = (m = n.content) == null ? void 0 : m.dataset.side, v = h === "right", g = v ? -5 : 5, w = f[v ? "left" : "right"], y = f[v ? "right" : "left"];
              i.onPointerGraceIntentChange({
                area: [
                  // Apply a bleed on clientX to ensure that our exit point is
                  // consistently within polygon bounds
                  { x: d.clientX + g, y: d.clientY },
                  { x: w, y: f.top },
                  { x: y, y: f.top },
                  { x: y, y: f.bottom },
                  { x: w, y: f.bottom }
                ],
                side: h
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
        onKeyDown: R(e.onKeyDown, (d) => {
          var p;
          const f = i.searchRef.current !== "";
          e.disabled || f && d.key === " " || Fb[o.dir].includes(d.key) && (n.onOpenChange(!0), (p = n.content) == null || p.focus(), d.preventDefault());
        })
      }
    ) });
  }
);
tu.displayName = en;
var nu = "MenuSubContent", ou = P(
  (e, t) => {
    const n = Wl(xe, e.__scopeMenu), { forceMount: o = n.forceMount, ...r } = e, i = bt(xe, e.__scopeMenu), s = An(xe, e.__scopeMenu), a = eu(nu, e.__scopeMenu), l = T(null), c = X(t, l);
    return /* @__PURE__ */ b(cn.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ b(be, { present: o || i.open, children: /* @__PURE__ */ b(cn.Slot, { scope: e.__scopeMenu, children: /* @__PURE__ */ b(
      xi,
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
          var d;
          s.isUsingKeyboardRef.current && ((d = l.current) == null || d.focus()), u.preventDefault();
        },
        onCloseAutoFocus: (u) => u.preventDefault(),
        onFocusOutside: R(e.onFocusOutside, (u) => {
          u.target !== a.trigger && i.onOpenChange(!1);
        }),
        onEscapeKeyDown: R(e.onEscapeKeyDown, (u) => {
          s.onClose(), u.preventDefault();
        }),
        onKeyDown: R(e.onKeyDown, (u) => {
          var p;
          const d = u.currentTarget.contains(u.target), f = Bb[s.dir].includes(u.key);
          d && f && (i.onOpenChange(!1), (p = a.trigger) == null || p.focus(), u.preventDefault());
        })
      }
    ) }) }) });
  }
);
ou.displayName = nu;
function ru(e) {
  return e ? "open" : "closed";
}
function no(e) {
  return e === "indeterminate";
}
function Ai(e) {
  return no(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function rw(e) {
  const t = document.activeElement;
  for (const n of e)
    if (n === t || (n.focus(), document.activeElement !== t)) return;
}
function iw(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
function sw(e, t, n) {
  const r = t.length > 1 && Array.from(t).every((c) => c === t[0]) ? t[0] : t, i = n ? e.indexOf(n) : -1;
  let s = iw(e, Math.max(i, 0));
  r.length === 1 && (s = s.filter((c) => c !== n));
  const l = s.find(
    (c) => c.toLowerCase().startsWith(r.toLowerCase())
  );
  return l !== n ? l : void 0;
}
function aw(e, t) {
  const { x: n, y: o } = e;
  let r = !1;
  for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
    const a = t[i], l = t[s], c = a.x, u = a.y, d = l.x, f = l.y;
    u > o != f > o && n < (d - c) * (o - u) / (f - u) + c && (r = !r);
  }
  return r;
}
function cw(e, t) {
  if (!t) return !1;
  const n = { x: e.clientX, y: e.clientY };
  return aw(n, t);
}
function ln(e) {
  return (t) => t.pointerType === "mouse" ? e(t) : void 0;
}
var iu = $l, su = wi, au = Hl, cu = Vl, lu = Ci, uu = Ul, du = Oo, fu = zl, pu = Gl, hu = Xl, mu = Jl, vu = Zl, gu = Ql, bu = tu, wu = ou, Io = "DropdownMenu", [lw] = pe(
  Io,
  [Mo]
), me = Mo(), [uw, yu] = lw(Io), _u = (e) => {
  const {
    __scopeDropdownMenu: t,
    children: n,
    dir: o,
    open: r,
    defaultOpen: i,
    onOpenChange: s,
    modal: a = !0
  } = e, l = me(t), c = T(null), [u, d] = ge({
    prop: r,
    defaultProp: i ?? !1,
    onChange: s,
    caller: Io
  });
  return /* @__PURE__ */ b(
    uw,
    {
      scope: t,
      triggerId: Pe(),
      triggerRef: c,
      contentId: Pe(),
      open: u,
      onOpenChange: d,
      onOpenToggle: H(() => d((f) => !f), [d]),
      modal: a,
      children: /* @__PURE__ */ b(iu, { ...l, open: u, onOpenChange: d, dir: o, modal: a, children: n })
    }
  );
};
_u.displayName = Io;
var xu = "DropdownMenuTrigger", Cu = P(
  (e, t) => {
    const { __scopeDropdownMenu: n, disabled: o = !1, ...r } = e, i = yu(xu, n), s = me(n);
    return /* @__PURE__ */ b(su, { asChild: !0, ...s, children: /* @__PURE__ */ b(
      K.button,
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
        ref: fo(t, i.triggerRef),
        onPointerDown: R(e.onPointerDown, (a) => {
          !o && a.button === 0 && a.ctrlKey === !1 && (i.onOpenToggle(), i.open || a.preventDefault());
        }),
        onKeyDown: R(e.onKeyDown, (a) => {
          o || (["Enter", " "].includes(a.key) && i.onOpenToggle(), a.key === "ArrowDown" && i.onOpenChange(!0), ["Enter", " ", "ArrowDown"].includes(a.key) && a.preventDefault());
        })
      }
    ) });
  }
);
Cu.displayName = xu;
var dw = "DropdownMenuPortal", Su = (e) => {
  const { __scopeDropdownMenu: t, ...n } = e, o = me(t);
  return /* @__PURE__ */ b(au, { ...o, ...n });
};
Su.displayName = dw;
var Au = "DropdownMenuContent", ku = P(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = yu(Au, n), i = me(n), s = T(!1);
    return /* @__PURE__ */ b(
      cu,
      {
        id: r.contentId,
        "aria-labelledby": r.triggerId,
        ...i,
        ...o,
        ref: t,
        onCloseAutoFocus: R(e.onCloseAutoFocus, (a) => {
          var l;
          s.current || (l = r.triggerRef.current) == null || l.focus(), s.current = !1, a.preventDefault();
        }),
        onInteractOutside: R(e.onInteractOutside, (a) => {
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
ku.displayName = Au;
var fw = "DropdownMenuGroup", pw = P(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(lu, { ...r, ...o, ref: t });
  }
);
pw.displayName = fw;
var hw = "DropdownMenuLabel", mw = P(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(uu, { ...r, ...o, ref: t });
  }
);
mw.displayName = hw;
var vw = "DropdownMenuItem", Nu = P(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(du, { ...r, ...o, ref: t });
  }
);
Nu.displayName = vw;
var gw = "DropdownMenuCheckboxItem", bw = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(fu, { ...r, ...o, ref: t });
});
bw.displayName = gw;
var ww = "DropdownMenuRadioGroup", yw = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(pu, { ...r, ...o, ref: t });
});
yw.displayName = ww;
var _w = "DropdownMenuRadioItem", xw = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(hu, { ...r, ...o, ref: t });
});
xw.displayName = _w;
var Cw = "DropdownMenuItemIndicator", Sw = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(mu, { ...r, ...o, ref: t });
});
Sw.displayName = Cw;
var Aw = "DropdownMenuSeparator", Pu = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(vu, { ...r, ...o, ref: t });
});
Pu.displayName = Aw;
var kw = "DropdownMenuArrow", Nw = P(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
    return /* @__PURE__ */ b(gu, { ...r, ...o, ref: t });
  }
);
Nw.displayName = kw;
var Pw = "DropdownMenuSubTrigger", Ew = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(bu, { ...r, ...o, ref: t });
});
Ew.displayName = Pw;
var Tw = "DropdownMenuSubContent", Lw = P((e, t) => {
  const { __scopeDropdownMenu: n, ...o } = e, r = me(n);
  return /* @__PURE__ */ b(
    wu,
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
Lw.displayName = Tw;
var Mw = _u, Rw = Cu, Ow = Su, Iw = ku, Dw = Nu, Fw = Pu;
function Bw(e) {
  const { voChildren: t } = e, n = t || [], o = Ye(), r = n[0], i = n.slice(1);
  return _(
    Mw,
    null,
    _(
      Rw,
      { asChild: !0 },
      r ? ue(r) : _("button", null, "...")
    ),
    _(
      Ow,
      { container: o ?? void 0 },
      _(
        Iw,
        {
          className: [
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "animate-scale-in"
          ].join(" "),
          sideOffset: 4,
          align: "start"
        },
        ...i.map((s) => $w(s))
      )
    )
  );
}
function $w(e) {
  if (!e) return null;
  const { type: t, props: n = {} } = e;
  if (t === "vo-menu-divider")
    return _(Fw, { className: "-mx-1 my-1 h-px bg-border" });
  const o = n.textContent || "", r = n.onClick, i = n.disabled;
  return _(Dw, {
    className: [
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "transition-colors focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    ].join(" "),
    disabled: i || !1,
    onSelect: () => {
      r != null && Z(r, "{}");
    }
  }, o);
}
var ki = "ContextMenu", [Ww] = pe(ki, [
  Mo
]), ve = Mo(), [Hw, Eu] = Ww(ki), Tu = (e) => {
  const { __scopeContextMenu: t, children: n, onOpenChange: o, dir: r, modal: i = !0 } = e, [s, a] = $(!1), l = ve(t), c = Ne(o), u = H(
    (d) => {
      a(d), c(d);
    },
    [c]
  );
  return /* @__PURE__ */ b(
    Hw,
    {
      scope: t,
      open: s,
      onOpenChange: u,
      modal: i,
      children: /* @__PURE__ */ b(
        iu,
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
Tu.displayName = ki;
var Lu = "ContextMenuTrigger", Mu = P(
  (e, t) => {
    const { __scopeContextMenu: n, disabled: o = !1, ...r } = e, i = Eu(Lu, n), s = ve(n), a = T({ x: 0, y: 0 }), l = T({
      getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...a.current })
    }), c = T(0), u = H(
      () => window.clearTimeout(c.current),
      []
    ), d = (f) => {
      a.current = { x: f.clientX, y: f.clientY }, i.onOpenChange(!0);
    };
    return F(() => u, [u]), F(() => void (o && u()), [o, u]), /* @__PURE__ */ b(le, { children: [
      /* @__PURE__ */ b(su, { ...s, virtualRef: l }),
      /* @__PURE__ */ b(
        K.span,
        {
          "data-state": i.open ? "open" : "closed",
          "data-disabled": o ? "" : void 0,
          ...r,
          ref: t,
          style: { WebkitTouchCallout: "none", ...e.style },
          onContextMenu: o ? e.onContextMenu : R(e.onContextMenu, (f) => {
            u(), d(f), f.preventDefault();
          }),
          onPointerDown: o ? e.onPointerDown : R(
            e.onPointerDown,
            Bn((f) => {
              u(), c.current = window.setTimeout(() => d(f), 700);
            })
          ),
          onPointerMove: o ? e.onPointerMove : R(e.onPointerMove, Bn(u)),
          onPointerCancel: o ? e.onPointerCancel : R(e.onPointerCancel, Bn(u)),
          onPointerUp: o ? e.onPointerUp : R(e.onPointerUp, Bn(u))
        }
      )
    ] });
  }
);
Mu.displayName = Lu;
var Vw = "ContextMenuPortal", Ru = (e) => {
  const { __scopeContextMenu: t, ...n } = e, o = ve(t);
  return /* @__PURE__ */ b(au, { ...o, ...n });
};
Ru.displayName = Vw;
var Ou = "ContextMenuContent", Iu = P(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = Eu(Ou, n), i = ve(n), s = T(!1);
    return /* @__PURE__ */ b(
      cu,
      {
        ...i,
        ...o,
        ref: t,
        side: "right",
        sideOffset: 2,
        align: "start",
        onCloseAutoFocus: (a) => {
          var l;
          (l = e.onCloseAutoFocus) == null || l.call(e, a), !a.defaultPrevented && s.current && a.preventDefault(), s.current = !1;
        },
        onInteractOutside: (a) => {
          var l;
          (l = e.onInteractOutside) == null || l.call(e, a), !a.defaultPrevented && !r.modal && (s.current = !0);
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
Iu.displayName = Ou;
var Uw = "ContextMenuGroup", jw = P(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = ve(n);
    return /* @__PURE__ */ b(lu, { ...r, ...o, ref: t });
  }
);
jw.displayName = Uw;
var zw = "ContextMenuLabel", Kw = P(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = ve(n);
    return /* @__PURE__ */ b(uu, { ...r, ...o, ref: t });
  }
);
Kw.displayName = zw;
var Gw = "ContextMenuItem", Du = P(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = ve(n);
    return /* @__PURE__ */ b(du, { ...r, ...o, ref: t });
  }
);
Du.displayName = Gw;
var Yw = "ContextMenuCheckboxItem", Xw = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(fu, { ...r, ...o, ref: t });
});
Xw.displayName = Yw;
var qw = "ContextMenuRadioGroup", Jw = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(pu, { ...r, ...o, ref: t });
});
Jw.displayName = qw;
var Zw = "ContextMenuRadioItem", Qw = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(hu, { ...r, ...o, ref: t });
});
Qw.displayName = Zw;
var ey = "ContextMenuItemIndicator", ty = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(mu, { ...r, ...o, ref: t });
});
ty.displayName = ey;
var ny = "ContextMenuSeparator", Fu = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(vu, { ...r, ...o, ref: t });
});
Fu.displayName = ny;
var oy = "ContextMenuArrow", ry = P(
  (e, t) => {
    const { __scopeContextMenu: n, ...o } = e, r = ve(n);
    return /* @__PURE__ */ b(gu, { ...r, ...o, ref: t });
  }
);
ry.displayName = oy;
var iy = "ContextMenuSubTrigger", sy = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(bu, { ...r, ...o, ref: t });
});
sy.displayName = iy;
var ay = "ContextMenuSubContent", cy = P((e, t) => {
  const { __scopeContextMenu: n, ...o } = e, r = ve(n);
  return /* @__PURE__ */ b(
    wu,
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
cy.displayName = ay;
function Bn(e) {
  return (t) => t.pointerType !== "mouse" ? e(t) : void 0;
}
var ly = Tu, uy = Mu, dy = Ru, fy = Iu, py = Du, hy = Fu;
function my(e) {
  const { voChildren: t } = e, n = t || [], o = Ye(), r = n[0], i = n.slice(1);
  return _(
    ly,
    null,
    _(
      uy,
      { asChild: !0 },
      r ? ue(r) : _("div", null)
    ),
    _(
      dy,
      { container: o ?? void 0 },
      _(
        fy,
        {
          className: [
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "animate-scale-in"
          ].join(" ")
        },
        ...i.map((s) => vy(s))
      )
    )
  );
}
function vy(e) {
  if (!e) return null;
  const { type: t, props: n = {} } = e;
  if (t === "vo-menu-divider")
    return _(hy, { className: "-mx-1 my-1 h-px bg-border" });
  const o = n.textContent || "", r = n.onClick, i = n.disabled;
  return _(py, {
    className: [
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "transition-colors focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    ].join(" "),
    disabled: i || !1,
    onSelect: () => {
      r != null && Z(r, "{}");
    }
  }, o);
}
var ar, Do = "HoverCard", [Bu] = pe(Do, [
  We
]), Fo = We(), [gy, Bo] = Bu(Do), $u = (e) => {
  const {
    __scopeHoverCard: t,
    children: n,
    open: o,
    defaultOpen: r,
    onOpenChange: i,
    openDelay: s = 700,
    closeDelay: a = 300
  } = e, l = Fo(t), c = T(0), u = T(0), d = T(!1), f = T(!1), [p, m] = ge({
    prop: o,
    defaultProp: r ?? !1,
    onChange: i,
    caller: Do
  }), h = H(() => {
    clearTimeout(u.current), c.current = window.setTimeout(() => m(!0), s);
  }, [s, m]), v = H(() => {
    clearTimeout(c.current), !d.current && !f.current && (u.current = window.setTimeout(() => m(!1), a));
  }, [a, m]), g = H(() => m(!1), [m]);
  return F(() => () => {
    clearTimeout(c.current), clearTimeout(u.current);
  }, []), /* @__PURE__ */ b(
    gy,
    {
      scope: t,
      open: p,
      onOpenChange: m,
      onOpen: h,
      onClose: v,
      onDismiss: g,
      hasSelectionRef: d,
      isPointerDownOnContentRef: f,
      children: /* @__PURE__ */ b(bn, { ...l, children: n })
    }
  );
};
$u.displayName = Do;
var Wu = "HoverCardTrigger", Hu = P(
  (e, t) => {
    const { __scopeHoverCard: n, ...o } = e, r = Bo(Wu, n), i = Fo(n);
    return /* @__PURE__ */ b(Ut, { asChild: !0, ...i, children: /* @__PURE__ */ b(
      K.a,
      {
        "data-state": r.open ? "open" : "closed",
        ...o,
        ref: t,
        onPointerEnter: R(e.onPointerEnter, ro(r.onOpen)),
        onPointerLeave: R(e.onPointerLeave, ro(r.onClose)),
        onFocus: R(e.onFocus, r.onOpen),
        onBlur: R(e.onBlur, r.onClose),
        onTouchStart: R(e.onTouchStart, (s) => s.preventDefault())
      }
    ) });
  }
);
Hu.displayName = Wu;
var Ni = "HoverCardPortal", [by, wy] = Bu(Ni, {
  forceMount: void 0
}), Vu = (e) => {
  const { __scopeHoverCard: t, forceMount: n, children: o, container: r } = e, i = Bo(Ni, t);
  return /* @__PURE__ */ b(by, { scope: t, forceMount: n, children: /* @__PURE__ */ b(be, { present: n || i.open, children: /* @__PURE__ */ b(jt, { asChild: !0, container: r, children: o }) }) });
};
Vu.displayName = Ni;
var oo = "HoverCardContent", Uu = P(
  (e, t) => {
    const n = wy(oo, e.__scopeHoverCard), { forceMount: o = n.forceMount, ...r } = e, i = Bo(oo, e.__scopeHoverCard);
    return /* @__PURE__ */ b(be, { present: o || i.open, children: /* @__PURE__ */ b(
      yy,
      {
        "data-state": i.open ? "open" : "closed",
        ...r,
        onPointerEnter: R(e.onPointerEnter, ro(i.onOpen)),
        onPointerLeave: R(e.onPointerLeave, ro(i.onClose)),
        ref: t
      }
    ) });
  }
);
Uu.displayName = oo;
var yy = P((e, t) => {
  const {
    __scopeHoverCard: n,
    onEscapeKeyDown: o,
    onPointerDownOutside: r,
    onFocusOutside: i,
    onInteractOutside: s,
    ...a
  } = e, l = Bo(oo, n), c = Fo(n), u = T(null), d = X(t, u), [f, p] = $(!1);
  return F(() => {
    if (f) {
      const m = document.body;
      return ar = m.style.userSelect || m.style.webkitUserSelect, m.style.userSelect = "none", m.style.webkitUserSelect = "none", () => {
        m.style.userSelect = ar, m.style.webkitUserSelect = ar;
      };
    }
  }, [f]), F(() => {
    if (u.current) {
      const m = () => {
        p(!1), l.isPointerDownOnContentRef.current = !1, setTimeout(() => {
          var v;
          ((v = document.getSelection()) == null ? void 0 : v.toString()) !== "" && (l.hasSelectionRef.current = !0);
        });
      };
      return document.addEventListener("pointerup", m), () => {
        document.removeEventListener("pointerup", m), l.hasSelectionRef.current = !1, l.isPointerDownOnContentRef.current = !1;
      };
    }
  }, [l.isPointerDownOnContentRef, l.hasSelectionRef]), F(() => {
    u.current && xy(u.current).forEach((h) => h.setAttribute("tabindex", "-1"));
  }), /* @__PURE__ */ b(
    Wt,
    {
      asChild: !0,
      disableOutsidePointerEvents: !1,
      onInteractOutside: s,
      onEscapeKeyDown: o,
      onPointerDownOutside: r,
      onFocusOutside: R(i, (m) => {
        m.preventDefault();
      }),
      onDismiss: l.onDismiss,
      children: /* @__PURE__ */ b(
        wn,
        {
          ...c,
          ...a,
          onPointerDown: R(a.onPointerDown, (m) => {
            m.currentTarget.contains(m.target) && p(!0), l.hasSelectionRef.current = !1, l.isPointerDownOnContentRef.current = !0;
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
}), _y = "HoverCardArrow", ju = P(
  (e, t) => {
    const { __scopeHoverCard: n, ...o } = e, r = Fo(n);
    return /* @__PURE__ */ b(yn, { ...r, ...o, ref: t });
  }
);
ju.displayName = _y;
function ro(e) {
  return (t) => t.pointerType === "touch" ? void 0 : e();
}
function xy(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (o) => o.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
var Cy = $u, Sy = Hu, Ay = Vu, ky = Uu, Ny = ju;
function Py(e) {
  const { voChildren: t } = e, n = t || [], o = Ye(), r = n[0], i = n.slice(1);
  return _(
    Cy,
    { openDelay: 200, closeDelay: 100 },
    _(
      Sy,
      { asChild: !0 },
      r ? ue(r) : _("span", null)
    ),
    _(
      Ay,
      { container: o ?? void 0 },
      _(
        ky,
        {
          className: [
            "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "animate-scale-in"
          ].join(" "),
          sideOffset: 4
        },
        ...i.map(ue),
        _(Ny, { className: "fill-popover" })
      )
    )
  );
}
var $o = "Collapsible", [Ey, zu] = pe($o), [Ty, Pi] = Ey($o), Ku = P(
  (e, t) => {
    const {
      __scopeCollapsible: n,
      open: o,
      defaultOpen: r,
      disabled: i,
      onOpenChange: s,
      ...a
    } = e, [l, c] = ge({
      prop: o,
      defaultProp: r ?? !1,
      onChange: s,
      caller: $o
    });
    return /* @__PURE__ */ b(
      Ty,
      {
        scope: n,
        disabled: i,
        contentId: Pe(),
        open: l,
        onOpenToggle: H(() => c((u) => !u), [c]),
        children: /* @__PURE__ */ b(
          K.div,
          {
            "data-state": Ti(l),
            "data-disabled": i ? "" : void 0,
            ...a,
            ref: t
          }
        )
      }
    );
  }
);
Ku.displayName = $o;
var Gu = "CollapsibleTrigger", Yu = P(
  (e, t) => {
    const { __scopeCollapsible: n, ...o } = e, r = Pi(Gu, n);
    return /* @__PURE__ */ b(
      K.button,
      {
        type: "button",
        "aria-controls": r.contentId,
        "aria-expanded": r.open || !1,
        "data-state": Ti(r.open),
        "data-disabled": r.disabled ? "" : void 0,
        disabled: r.disabled,
        ...o,
        ref: t,
        onClick: R(e.onClick, r.onOpenToggle)
      }
    );
  }
);
Yu.displayName = Gu;
var Ei = "CollapsibleContent", Xu = P(
  (e, t) => {
    const { forceMount: n, ...o } = e, r = Pi(Ei, e.__scopeCollapsible);
    return /* @__PURE__ */ b(be, { present: n || r.open, children: ({ present: i }) => /* @__PURE__ */ b(Ly, { ...o, ref: t, present: i }) });
  }
);
Xu.displayName = Ei;
var Ly = P((e, t) => {
  const { __scopeCollapsible: n, present: o, children: r, ...i } = e, s = Pi(Ei, n), [a, l] = $(o), c = T(null), u = X(t, c), d = T(0), f = d.current, p = T(0), m = p.current, h = s.open || a, v = T(h), g = T(void 0);
  return F(() => {
    const w = requestAnimationFrame(() => v.current = !1);
    return () => cancelAnimationFrame(w);
  }, []), fe(() => {
    const w = c.current;
    if (w) {
      g.current = g.current || {
        transitionDuration: w.style.transitionDuration,
        animationName: w.style.animationName
      }, w.style.transitionDuration = "0s", w.style.animationName = "none";
      const y = w.getBoundingClientRect();
      d.current = y.height, p.current = y.width, v.current || (w.style.transitionDuration = g.current.transitionDuration, w.style.animationName = g.current.animationName), l(o);
    }
  }, [s.open, o]), /* @__PURE__ */ b(
    K.div,
    {
      "data-state": Ti(s.open),
      "data-disabled": s.disabled ? "" : void 0,
      id: s.contentId,
      hidden: !h,
      ...i,
      ref: u,
      style: {
        "--radix-collapsible-content-height": f ? `${f}px` : void 0,
        "--radix-collapsible-content-width": m ? `${m}px` : void 0,
        ...e.style
      },
      children: h && r
    }
  );
});
function Ti(e) {
  return e ? "open" : "closed";
}
var qu = Ku, Ju = Yu, Zu = Xu;
function My(e) {
  const { open: t, defaultOpen: n, onChange: o, voChildren: r } = e, i = r || [], s = i[0], a = i.slice(1), l = e.class || "", c = ce(e), u = {
    className: l || void 0,
    style: c,
    onOpenChange: (d) => {
      o != null && Z(o, JSON.stringify({ Checked: d }));
    }
  };
  return t != null ? u.open = !!t : n && (u.defaultOpen = !0), _(
    qu,
    u,
    _(
      Ju,
      { asChild: !0 },
      s ? ue(s) : _("button", null, "Toggle")
    ),
    _(
      Zu,
      {
        className: "overflow-hidden data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      },
      ...a.map(ue)
    )
  );
}
var Wo = "Tabs", [Ry] = pe(Wo, [
  Lo
]), Qu = Lo(), [Oy, Li] = Ry(Wo), ed = P(
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
    } = e, u = Bt(a), [d, f] = ge({
      prop: o,
      onChange: r,
      defaultProp: i ?? "",
      caller: Wo
    });
    return /* @__PURE__ */ b(
      Oy,
      {
        scope: n,
        baseId: Pe(),
        value: d,
        onValueChange: f,
        orientation: s,
        dir: u,
        activationMode: l,
        children: /* @__PURE__ */ b(
          K.div,
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
ed.displayName = Wo;
var td = "TabsList", nd = P(
  (e, t) => {
    const { __scopeTabs: n, loop: o = !0, ...r } = e, i = Li(td, n), s = Qu(n);
    return /* @__PURE__ */ b(
      Il,
      {
        asChild: !0,
        ...s,
        orientation: i.orientation,
        dir: i.dir,
        loop: o,
        children: /* @__PURE__ */ b(
          K.div,
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
nd.displayName = td;
var od = "TabsTrigger", rd = P(
  (e, t) => {
    const { __scopeTabs: n, value: o, disabled: r = !1, ...i } = e, s = Li(od, n), a = Qu(n), l = ad(s.baseId, o), c = cd(s.baseId, o), u = o === s.value;
    return /* @__PURE__ */ b(
      Dl,
      {
        asChild: !0,
        ...a,
        focusable: !r,
        active: u,
        children: /* @__PURE__ */ b(
          K.button,
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
            onMouseDown: R(e.onMouseDown, (d) => {
              !r && d.button === 0 && d.ctrlKey === !1 ? s.onValueChange(o) : d.preventDefault();
            }),
            onKeyDown: R(e.onKeyDown, (d) => {
              [" ", "Enter"].includes(d.key) && s.onValueChange(o);
            }),
            onFocus: R(e.onFocus, () => {
              const d = s.activationMode !== "manual";
              !u && !r && d && s.onValueChange(o);
            })
          }
        )
      }
    );
  }
);
rd.displayName = od;
var id = "TabsContent", sd = P(
  (e, t) => {
    const { __scopeTabs: n, value: o, forceMount: r, children: i, ...s } = e, a = Li(id, n), l = ad(a.baseId, o), c = cd(a.baseId, o), u = o === a.value, d = T(u);
    return F(() => {
      const f = requestAnimationFrame(() => d.current = !1);
      return () => cancelAnimationFrame(f);
    }, []), /* @__PURE__ */ b(be, { present: r || u, children: ({ present: f }) => /* @__PURE__ */ b(
      K.div,
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
sd.displayName = id;
function ad(e, t) {
  return `${e}-trigger-${t}`;
}
function cd(e, t) {
  return `${e}-content-${t}`;
}
var Iy = ed, Dy = nd, Fy = rd, By = sd;
function $y(e) {
  const { activeIndex: t, items: n, onChange: o } = e, r = n || [], i = String(t ?? 0), s = e.class || "", a = ce(e);
  return _(
    Iy,
    {
      value: i,
      className: s || void 0,
      style: a,
      onValueChange: (l) => {
        o != null && Z(o, JSON.stringify({ Value: parseInt(l, 10) }));
      }
    },
    _(
      Dy,
      {
        className: [
          "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
        ].join(" ")
      },
      ...r.map(
        (l, c) => _(Fy, {
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
      (l, c) => _(
        By,
        {
          key: String(c),
          value: String(c),
          className: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        },
        l.content ? ue(l.content) : null
      )
    )
  );
}
var Le = "Accordion", Wy = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"], [Mi, Hy, Vy] = vn(Le), [Ho] = pe(Le, [
  Vy,
  zu
]), Ri = zu(), ld = se.forwardRef(
  (e, t) => {
    const { type: n, ...o } = e, r = o, i = o;
    return /* @__PURE__ */ b(Mi.Provider, { scope: e.__scopeAccordion, children: n === "multiple" ? /* @__PURE__ */ b(Ky, { ...i, ref: t }) : /* @__PURE__ */ b(zy, { ...r, ref: t }) });
  }
);
ld.displayName = Le;
var [ud, Uy] = Ho(Le), [dd, jy] = Ho(
  Le,
  { collapsible: !1 }
), zy = se.forwardRef(
  (e, t) => {
    const {
      value: n,
      defaultValue: o,
      onValueChange: r = () => {
      },
      collapsible: i = !1,
      ...s
    } = e, [a, l] = ge({
      prop: n,
      defaultProp: o ?? "",
      onChange: r,
      caller: Le
    });
    return /* @__PURE__ */ b(
      ud,
      {
        scope: e.__scopeAccordion,
        value: se.useMemo(() => a ? [a] : [], [a]),
        onItemOpen: l,
        onItemClose: se.useCallback(() => i && l(""), [i, l]),
        children: /* @__PURE__ */ b(dd, { scope: e.__scopeAccordion, collapsible: i, children: /* @__PURE__ */ b(fd, { ...s, ref: t }) })
      }
    );
  }
), Ky = se.forwardRef((e, t) => {
  const {
    value: n,
    defaultValue: o,
    onValueChange: r = () => {
    },
    ...i
  } = e, [s, a] = ge({
    prop: n,
    defaultProp: o ?? [],
    onChange: r,
    caller: Le
  }), l = se.useCallback(
    (u) => a((d = []) => [...d, u]),
    [a]
  ), c = se.useCallback(
    (u) => a((d = []) => d.filter((f) => f !== u)),
    [a]
  );
  return /* @__PURE__ */ b(
    ud,
    {
      scope: e.__scopeAccordion,
      value: s,
      onItemOpen: l,
      onItemClose: c,
      children: /* @__PURE__ */ b(dd, { scope: e.__scopeAccordion, collapsible: !0, children: /* @__PURE__ */ b(fd, { ...i, ref: t }) })
    }
  );
}), [Gy, Vo] = Ho(Le), fd = se.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, disabled: o, dir: r, orientation: i = "vertical", ...s } = e, a = se.useRef(null), l = X(a, t), c = Hy(n), d = Bt(r) === "ltr", f = R(e.onKeyDown, (p) => {
      var M;
      if (!Wy.includes(p.key)) return;
      const m = p.target, h = c().filter((L) => {
        var E;
        return !((E = L.ref.current) != null && E.disabled);
      }), v = h.findIndex((L) => L.ref.current === m), g = h.length;
      if (v === -1) return;
      p.preventDefault();
      let w = v;
      const y = 0, x = g - 1, k = () => {
        w = v + 1, w > x && (w = y);
      }, A = () => {
        w = v - 1, w < y && (w = x);
      };
      switch (p.key) {
        case "Home":
          w = y;
          break;
        case "End":
          w = x;
          break;
        case "ArrowRight":
          i === "horizontal" && (d ? k() : A());
          break;
        case "ArrowDown":
          i === "vertical" && k();
          break;
        case "ArrowLeft":
          i === "horizontal" && (d ? A() : k());
          break;
        case "ArrowUp":
          i === "vertical" && A();
          break;
      }
      const S = w % g;
      (M = h[S].ref.current) == null || M.focus();
    });
    return /* @__PURE__ */ b(
      Gy,
      {
        scope: n,
        disabled: o,
        direction: r,
        orientation: i,
        children: /* @__PURE__ */ b(Mi.Slot, { scope: n, children: /* @__PURE__ */ b(
          K.div,
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
), io = "AccordionItem", [Yy, Oi] = Ho(io), pd = se.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, value: o, ...r } = e, i = Vo(io, n), s = Uy(io, n), a = Ri(n), l = Pe(), c = o && s.value.includes(o) || !1, u = i.disabled || e.disabled;
    return /* @__PURE__ */ b(
      Yy,
      {
        scope: n,
        open: c,
        disabled: u,
        triggerId: l,
        children: /* @__PURE__ */ b(
          qu,
          {
            "data-orientation": i.orientation,
            "data-state": wd(c),
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
pd.displayName = io;
var hd = "AccordionHeader", md = se.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...o } = e, r = Vo(Le, n), i = Oi(hd, n);
    return /* @__PURE__ */ b(
      K.h3,
      {
        "data-orientation": r.orientation,
        "data-state": wd(i.open),
        "data-disabled": i.disabled ? "" : void 0,
        ...o,
        ref: t
      }
    );
  }
);
md.displayName = hd;
var Or = "AccordionTrigger", vd = se.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...o } = e, r = Vo(Le, n), i = Oi(Or, n), s = jy(Or, n), a = Ri(n);
    return /* @__PURE__ */ b(Mi.ItemSlot, { scope: n, children: /* @__PURE__ */ b(
      Ju,
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
vd.displayName = Or;
var gd = "AccordionContent", bd = se.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...o } = e, r = Vo(Le, n), i = Oi(gd, n), s = Ri(n);
    return /* @__PURE__ */ b(
      Zu,
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
bd.displayName = gd;
function wd(e) {
  return e ? "open" : "closed";
}
var Xy = ld, qy = pd, Jy = md, Zy = vd, Qy = bd;
function e_(e) {
  const { items: t, openIndex: n, onChange: o } = e, r = t || [], i = n != null && n >= 0 ? String(n) : void 0, s = e.class || "", a = ce(e);
  return _(
    Xy,
    {
      type: "single",
      collapsible: !0,
      value: i,
      className: s || void 0,
      style: a,
      onValueChange: (l) => {
        if (o != null) {
          const c = l === "" ? -1 : parseInt(l, 10);
          Z(o, JSON.stringify({ Value: c }));
        }
      }
    },
    ...r.map(
      (l, c) => _(
        qy,
        {
          key: String(c),
          value: String(c),
          className: "border-b border-border"
        },
        _(
          Jy,
          { className: "flex" },
          _(
            Zy,
            {
              className: [
                "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all",
                "hover:underline [&[data-state=open]>svg]:rotate-180"
              ].join(" ")
            },
            l.title,
            _(
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
              _("path", { d: "m6 9 6 6 6-6" })
            )
          )
        ),
        _(
          Qy,
          {
            className: "overflow-hidden text-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
          },
          _(
            "div",
            { className: "pb-4 pt-0" },
            l.content ? ue(l.content) : null
          )
        )
      )
    )
  );
}
function t_(e) {
  var k;
  const { value: t, placeholder: n, voChildren: o } = e, r = e.onSelect ?? e.onChange, s = (o || []).filter((A) => A.type === "vo-combobox-option").map((A) => {
    var S, M, L, E;
    return {
      label: ((S = A.props) == null ? void 0 : S.textContent) || ((M = A.props) == null ? void 0 : M.label) || "",
      value: ((L = A.props) == null ? void 0 : L.value) || ((E = A.props) == null ? void 0 : E.textContent) || ""
    };
  }), [a, l] = $(!1), [c, u] = $(""), [d, f] = $(0), p = T(null), m = T(null), h = c ? s.filter((A) => A.label.toLowerCase().includes(c.toLowerCase())) : s;
  F(() => {
    f(0);
  }, [c]);
  const v = (A) => {
    l(!1), u(""), r != null && Z(r, JSON.stringify({ Value: A }));
  }, g = ((k = s.find((A) => A.value === t)) == null ? void 0 : k.label) || "", w = (A) => {
    A.key === "ArrowDown" ? (A.preventDefault(), f((S) => Math.min(S + 1, h.length - 1))) : A.key === "ArrowUp" ? (A.preventDefault(), f((S) => Math.max(S - 1, 0))) : A.key === "Enter" ? (A.preventDefault(), h[d] && v(h[d].value)) : A.key === "Escape" && l(!1);
  }, y = e.class || "", x = ce(e);
  return _(
    "div",
    {
      className: ["relative w-full", y].filter(Boolean).join(" "),
      style: x
    },
    _(
      "button",
      {
        className: [
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
        ].join(" "),
        onClick: () => {
          l(!a), setTimeout(() => {
            var A;
            return (A = p.current) == null ? void 0 : A.focus();
          }, 0);
        },
        type: "button"
      },
      _(
        "span",
        { className: t ? "" : "text-muted-foreground" },
        g || n || "Select..."
      ),
      _(
        "svg",
        { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "ml-2 opacity-50" },
        _("path", { d: "m6 9 6 6 6-6" })
      )
    ),
    a ? _(
      "div",
      {
        className: [
          "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md",
          "animate-scale-in"
        ].join(" ")
      },
      _(
        "div",
        { className: "flex items-center border-b px-3" },
        _(
          "svg",
          { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "mr-2 shrink-0 opacity-50" },
          _("circle", { cx: 11, cy: 11, r: 8 }),
          _("path", { d: "m21 21-4.3-4.3" })
        ),
        _("input", {
          ref: p,
          className: "flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground",
          placeholder: "Search...",
          value: c,
          onInput: (A) => u(A.target.value),
          onKeyDown: w
        })
      ),
      _(
        "div",
        {
          ref: m,
          className: "max-h-60 overflow-auto p-1",
          role: "listbox"
        },
        h.length === 0 ? _("div", { className: "py-6 text-center text-sm text-muted-foreground" }, "No results.") : h.map(
          (A, S) => _(
            "div",
            {
              key: A.value,
              className: [
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                S === d ? "bg-accent text-accent-foreground" : "",
                A.value === t ? "font-medium" : ""
              ].join(" "),
              role: "option",
              "aria-selected": A.value === t,
              onMouseEnter: () => f(S),
              onClick: () => v(A.value)
            },
            A.value === t ? _(
              "svg",
              { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "mr-2" },
              _("polyline", { points: "20 6 9 17 4 12" })
            ) : _("span", { className: "mr-2 w-3" }),
            A.label
          )
        )
      )
    ) : null
  );
}
function n_(e) {
  const { textContent: t, value: n, selected: o, onChange: r, disabled: i, name: s } = e, a = String(n ?? "") === String(o ?? ""), l = e.class || "", c = ce(e);
  return _(
    "label",
    {
      className: [
        "flex items-center gap-2 text-sm cursor-pointer",
        i ? "opacity-50 cursor-not-allowed" : "",
        l
      ].filter(Boolean).join(" "),
      style: c
    },
    _("input", {
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
        r != null && Z(r, JSON.stringify({ Value: String(n ?? "") }));
      }
    }),
    t ? _("span", null, t) : null
  );
}
function o_(e) {
  const { items: t } = e, n = t || [], o = e.class || "", r = ce(e);
  return _(
    "nav",
    {
      className: ["flex items-center text-sm text-muted-foreground", o].filter(Boolean).join(" "),
      style: r,
      "aria-label": "breadcrumb"
    },
    _(
      "ol",
      { className: "flex items-center gap-1.5" },
      ...n.map((i, s) => {
        const a = s === n.length - 1, l = [];
        return s > 0 && l.push(_("li", {
          key: `sep-${s}`,
          className: "text-muted-foreground/50 select-none",
          "aria-hidden": "true"
        }, "/")), a ? l.push(_("li", {
          key: `item-${s}`,
          className: "font-medium text-foreground",
          "aria-current": "page"
        }, i.label)) : l.push(_(
          "li",
          { key: `item-${s}` },
          _("a", {
            href: i.href || "#",
            className: "transition-colors hover:text-foreground"
          }, i.label)
        )), l;
      }).flat()
    )
  );
}
function r_(e) {
  const { current: t, total: n, onChange: o } = e, r = t ?? 1, i = n ?? 1, s = e.class || "", a = ce(e), l = (p, m) => [
    "inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-sm rounded-md",
    "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    p ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
    m ? "pointer-events-none opacity-50" : "cursor-pointer"
  ].filter(Boolean).join(" "), c = (p) => {
    o != null && Z(o, JSON.stringify({ Value: p }));
  }, u = [];
  u.push(_("button", {
    key: "prev",
    className: l(!1, r <= 1),
    disabled: r <= 1,
    onClick: () => c(r - 1)
  }, "«"));
  const d = Math.max(1, r - 2), f = Math.min(i, r + 2);
  d > 1 && (u.push(_("button", { key: "p1", className: l(r === 1, !1), onClick: () => c(1) }, "1")), d > 2 && u.push(_("span", { key: "ell1", className: "px-1 text-muted-foreground" }, "…")));
  for (let p = d; p <= f; p++)
    u.push(_("button", {
      key: `p${p}`,
      className: l(p === r, !1),
      onClick: () => c(p)
    }, String(p)));
  return f < i && (f < i - 1 && u.push(_("span", { key: "ell2", className: "px-1 text-muted-foreground" }, "…")), u.push(_("button", { key: `p${i}`, className: l(r === i, !1), onClick: () => c(i) }, String(i)))), u.push(_("button", {
    key: "next",
    className: l(!1, r >= i),
    disabled: r >= i,
    onClick: () => c(r + 1)
  }, "»")), _("nav", {
    className: ["flex items-center gap-1", s].filter(Boolean).join(" "),
    style: a,
    "aria-label": "pagination"
  }, ...u);
}
function i_(e) {
  const { current: t, items: n } = e, o = t ?? 0, r = n || [], i = e.class || "", s = ce(e);
  return _(
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
      return _(
        "div",
        { key: String(l), className: "flex flex-col items-center gap-1.5 flex-1" },
        _(
          "div",
          { className: u },
          c === "completed" ? _(
            "svg",
            { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5 },
            _("polyline", { points: "20 6 9 17 4 12" })
          ) : String(l + 1)
        ),
        _("div", { className: d }, a.label),
        a.description ? _("div", { className: "text-xs text-muted-foreground text-center" }, a.description) : null
      );
    })
  );
}
function s_(e) {
  const {
    totalCount: t = 0,
    itemHeight: n = 40,
    visibleStart: o = 0,
    overscan: r = 3,
    onRange: i,
    voChildren: s
  } = e, a = s || [], l = T(null), c = T(""), u = t * n, d = o * n, f = e.class || "", p = ce(e) || {}, m = H(() => {
    const h = l.current;
    if (!h || i == null) return;
    const v = h.scrollTop, g = h.clientHeight, w = r;
    let y = Math.floor(v / n) - w;
    y < 0 && (y = 0);
    let x = Math.ceil((v + g) / n) + w;
    x > t && (x = t);
    const k = `${y}:${x}`;
    k !== c.current && (c.current = k, Z(i, JSON.stringify({
      Start: y,
      End: x,
      ScrollTop: v
    })));
  }, [t, n, r, i]);
  return F(() => {
    const h = l.current;
    if (h)
      return h.addEventListener("scroll", m, { passive: !0 }), m(), () => h.removeEventListener("scroll", m);
  }, [m]), _(
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
    _(
      "div",
      {
        style: {
          height: `${u}px`,
          position: "relative"
        }
      },
      _(
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
          (h, v) => _("div", {
            key: `vl-${o + v}`,
            "data-vl-index": o + v
          }, ue(h))
        )
      )
    )
  );
}
const yd = {
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
}, a_ = yd.fade;
function _d(e) {
  return yd[e] || a_;
}
function on(e, t, n) {
  return e.map((o) => `${o} ${t}ms ${n}`).join(", ");
}
function c_(e) {
  const { voChildren: t, ...n } = e, o = t || [], r = n.transition || "fade", i = n.class || "", s = ce(n) || {}, a = o.length > 0 && o[0].type !== "#text", l = a ? o[0] : null, [c, u] = $(l), [d, f] = $(a ? "enter" : "idle"), p = T(null), m = T(a), h = T(!1);
  a && !m.current ? (u(l), f("enter")) : !a && m.current && !h.current ? f("leave") : a && l && (d === "idle" || d === "enter") && u(l), m.current = a;
  const v = H(() => {
    const g = p.current;
    g && (g.style.transition = "", g.style.opacity = "", g.style.transform = ""), h.current = !1;
  }, []);
  return Ce(() => {
    const g = p.current;
    if (!g) return;
    const w = _d(r);
    d === "enter" ? (h.current = !0, Object.assign(g.style, w.enterFrom), g.style.transition = "none", requestAnimationFrame(() => {
      g.style.transition = on(
        Object.keys(w.enterFrom),
        w.duration,
        w.easing
      ), Object.assign(g.style, w.enterTo);
      const y = (x) => {
        x.target === g && (g.removeEventListener("transitionend", y), v(), f("idle"));
      };
      g.addEventListener("transitionend", y), setTimeout(() => {
        h.current && d === "enter" && (g.removeEventListener("transitionend", y), v(), f("idle"));
      }, w.duration + 50);
    })) : d === "leave" && (h.current = !0, Object.assign(g.style, w.leaveFrom), g.style.transition = "none", requestAnimationFrame(() => {
      g.style.transition = on(
        Object.keys(w.leaveTo),
        w.duration,
        w.easing
      ), Object.assign(g.style, w.leaveTo);
      const y = (x) => {
        x.target === g && (g.removeEventListener("transitionend", y), v(), u(null), f("idle"));
      };
      g.addEventListener("transitionend", y), setTimeout(() => {
        h.current && (g.removeEventListener("transitionend", y), v(), u(null), f("idle"));
      }, w.duration + 50);
    }));
  }, [d, r, v]), c ? _("div", {
    ref: p,
    className: i || void 0,
    style: s,
    "data-transition": r,
    "data-transition-phase": d
  }, ue(c)) : null;
}
function l_(e) {
  var A;
  const { voChildren: t, ...n } = e, o = t || [], r = n.transition || "fade", i = n.class || "", s = ce(n) || {}, a = T(null), l = T(/* @__PURE__ */ new Map()), c = T(/* @__PURE__ */ new Set()), u = T(/* @__PURE__ */ new Map()), d = T([]), [f, p] = $([]);
  if (a.current) {
    const S = /* @__PURE__ */ new Map(), M = Array.from(a.current.children);
    for (const L of M) {
      const E = L.dataset.flipKey;
      if (E) {
        const C = L.getBoundingClientRect();
        S.set(E, { x: C.x, y: C.y, width: C.width, height: C.height });
      }
    }
    l.current = S;
  }
  const m = /* @__PURE__ */ new Set(), h = /* @__PURE__ */ new Map();
  for (const S of o) {
    const M = (A = S.props) == null ? void 0 : A.key;
    if (M != null) {
      const L = String(M);
      m.add(L), h.set(L, ue(S));
    }
  }
  const v = c.current, g = u.current;
  let w = !1;
  for (const S of v)
    if (!m.has(S)) {
      const M = g.get(S);
      M && !d.current.some((L) => L.key === S) && (d.current = [...d.current, { key: S, vnode: M }], w = !0);
    }
  const y = d.current.filter((S) => !m.has(S.key));
  y.length !== d.current.length && (d.current = y, w = !0), u.current = h, w && p(d.current);
  const x = (S) => {
    d.current = d.current.filter((M) => M.key !== S), p(d.current);
  };
  Ce(() => {
    const S = a.current;
    if (!S) return;
    const M = l.current, L = _d(r), E = Array.from(S.children);
    for (const C of E) {
      const O = C.dataset.flipKey;
      if (!O) continue;
      if (C.dataset.leaving === "true") {
        Object.assign(C.style, L.leaveFrom), C.style.transition = "none", requestAnimationFrame(() => {
          C.style.transition = on(
            Object.keys(L.leaveTo),
            L.duration,
            L.easing
          ), Object.assign(C.style, L.leaveTo);
          const I = (N) => {
            N.target === C && (C.removeEventListener("transitionend", I), x(O));
          };
          C.addEventListener("transitionend", I), setTimeout(() => {
            d.current.some((N) => N.key === O) && x(O);
          }, L.duration + 50);
        });
        continue;
      }
      const V = M.get(O);
      if (!V || !v.has(O)) {
        Object.assign(C.style, L.enterFrom), C.style.transition = "none", requestAnimationFrame(() => {
          C.style.transition = on(
            Object.keys(L.enterFrom),
            L.duration,
            L.easing
          ), Object.assign(C.style, L.enterTo);
          const I = (N) => {
            N.target === C && (C.removeEventListener("transitionend", I), C.style.transition = "");
          };
          C.addEventListener("transitionend", I), setTimeout(() => {
            C.style.transition = "";
          }, L.duration + 50);
        });
        continue;
      }
      const z = C.getBoundingClientRect(), B = V.x - z.x, U = V.y - z.y;
      Math.abs(B) < 0.5 && Math.abs(U) < 0.5 || (C.style.transform = `translate(${B}px, ${U}px)`, C.style.transition = "none", requestAnimationFrame(() => {
        C.style.transition = on(
          ["transform"],
          L.duration,
          L.easing
        ), C.style.transform = "";
        const I = (N) => {
          N.target === C && (C.removeEventListener("transitionend", I), C.style.transition = "");
        };
        C.addEventListener("transitionend", I), setTimeout(() => {
          C.style.transition = "";
        }, L.duration + 50);
      }));
    }
    c.current = m;
  });
  const k = o.map((S) => {
    var E;
    const M = (E = S.props) == null ? void 0 : E.key, L = M != null ? String(M) : void 0;
    return _("div", {
      key: L,
      "data-flip-key": L
    }, ue(S));
  });
  for (const S of f)
    k.push(_("div", {
      key: S.key,
      "data-flip-key": S.key,
      "data-leaving": "true",
      style: { pointerEvents: "none" }
    }, S.vnode));
  return _("div", {
    ref: a,
    className: i || void 0,
    style: s,
    "data-transition-group": r
  }, ...k);
}
const u_ = {
  button: Wp,
  "vo-checkbox": ih,
  "vo-switch": fh,
  "vo-slider": Rh,
  select: $g,
  "vo-dialog": Wg,
  "vo-drawer": Hg,
  "vo-tooltip": lb,
  "vo-popover": Sb,
  "vo-dropdown-menu": Bw,
  "vo-context-menu": my,
  "vo-hover-card": Py,
  "vo-collapsible": My,
  "vo-tabs": $y,
  "vo-accordion": e_,
  "vo-combobox": t_,
  "vo-radio": n_,
  "vo-breadcrumb": o_,
  "vo-pagination": r_,
  "vo-steps": i_,
  "vo-virtual-list": s_,
  "vo-transition": c_,
  "vo-transition-group": l_
}, Is = /* @__PURE__ */ new Map(), xd = /* @__PURE__ */ new Map(), so = /* @__PURE__ */ new Set(), Xt = /* @__PURE__ */ new Map(), qt = /* @__PURE__ */ new Map(), Jt = /* @__PURE__ */ new Map();
function Un(e) {
  const t = globalThis.__voguiStudioLog;
  t == null || t(e);
}
function t0(e, t) {
  xd.set(e, t), Un(`[vogui] widgetRegistry.set type=${e}`);
}
function n0() {
  var e;
  for (const t of so)
    (e = t.destroy) == null || e.call(t);
  so.clear();
}
const Cd = dt(null);
function d_(e) {
  for (const o of Array.from(e.children))
    if (o instanceof HTMLElement && o.dataset.voguiOverlayRoot === "true")
      return o;
  const t = window.getComputedStyle(e).position;
  (!t || t === "static") && (e.style.position = "relative");
  const n = document.createElement("div");
  return n.dataset.voguiOverlayRoot = "true", n.style.position = "absolute", n.style.inset = "0", n.style.zIndex = "200", n.style.pointerEvents = "none", n.style.overflow = "visible", e.appendChild(n), n;
}
function f_(e, t) {
  for (const o of Array.from(e.children))
    if (o instanceof HTMLElement && o.dataset.voguiPortalName === t)
      return o;
  const n = document.createElement("div");
  return n.dataset.voguiPortalName = t, n.style.position = "absolute", n.style.inset = "0", n.style.pointerEvents = "none", n.style.overflow = "visible", t === "toast" && (n.style.display = "flex", n.style.alignItems = "flex-start", n.style.justifyContent = "flex-end", n.style.padding = "12px"), e.appendChild(n), n;
}
function Ye() {
  return et(Cd);
}
function o0(e, t, n) {
  if (!(t != null && t.tree)) {
    ut(null, e);
    return;
  }
  Zd(t.gen, t.handlers, n), vf(e, t.theme), t.styles && hf(t.styles);
  const o = e.parentElement instanceof HTMLElement ? e.parentElement : e, r = d_(o);
  ut(
    _(
      Cd.Provider,
      { value: r },
      _(p_, { tree: t.tree, canvas: t.canvas, refActions: t.refActions })
    ),
    e
  );
}
function p_({ tree: e, canvas: t, refActions: n }) {
  const o = T(null);
  return F(() => {
    if (t && o.current)
      for (const r of t)
        Dp(r, rn);
  }, [t]), Ce(() => {
    if (n && o.current)
      for (const r of n)
        ff(r);
  }, [n]), _("div", { ref: o, style: { display: "contents" } }, ue(e));
}
function ue(e) {
  if (!e || !e.type) return null;
  const { type: t, props: n = {}, children: o = [] } = e;
  if (t === "#text")
    return n.text != null ? String(n.text) : null;
  if (t === "Fragment")
    return _("div", { style: { display: "contents" } }, lt(o));
  if (t === "__comp__") {
    const i = n._cid, s = o[0] ? ue(o[0]) : null;
    return Is.set(i, s), Ds(i, n, s);
  }
  if (t === "__cached__") {
    const i = n._cid, s = Is.get(i) ?? null;
    return Ds(i, n, s);
  }
  if (t === "vo-unsafe-html") {
    const i = n.html || "";
    return _("div", {
      dangerouslySetInnerHTML: { __html: i },
      ...kn(n)
    });
  }
  if (t === "vo-portal")
    return _(h_, {
      portalName: n.portalName,
      portalChildren: o
    });
  if (t === "Canvas")
    return g_(n);
  if (t === "vo-host-widget")
    return b_(n, o);
  const r = u_[t];
  if (r) {
    const i = {
      ...n,
      voChildren: o
    };
    if (typeof n.onClick == "number") {
      const s = Jr(n);
      typeof s.onClick == "function" && (i.onClick = s.onClick);
    }
    return _(r, {
      ...i
    });
  }
  return m_(t, n, o);
}
function lt(e) {
  return e.map(ue);
}
function h_({ portalName: e, portalChildren: t }) {
  const n = Ye();
  if (!n)
    return _("div", { style: { display: "contents" } }, lt(t));
  const o = f_(n, e || "default");
  return vt(
    _("div", { style: { display: "contents" } }, lt(t)),
    o
  );
}
function Ds(e, t, n) {
  const o = kn(t), r = ce(t) ?? {}, i = Jr(t), s = t.class || void 0, a = Object.keys(r).length > 0, l = Object.keys(i).length > 0, c = !!s, u = {
    ...o,
    "data-vcid": e
  };
  return !a && !l && !c ? _("div", { ...u, style: { display: "contents" } }, n) : _("div", {
    ...u,
    ...i,
    className: s,
    style: a ? r : void 0
  }, n);
}
function m_(e, t, n) {
  const o = af(e), r = cf(e), i = lf(e, t.variant, t.size), s = t.class || "", a = t.ref, l = t.onResize, c = l != null ? a ? `ref:${a}` : `resize:${l}` : null, u = t.onIntersect, d = u != null ? a ? `iref:${a}` : `intersect:${u}` : null, f = t.active ? v_(e) : "", p = t.disabled && o !== "input" && o !== "textarea" && o !== "select" ? "opacity-50 pointer-events-none" : "", m = [r, i, f, p, s].filter(Boolean).join(" ") || void 0, h = ce(t), v = Jr(t), g = kn(t), w = e === "vo-grid" && t.cols ? { ...h, gridTemplateColumns: `repeat(${t.cols}, 1fr)` } : h, y = {
    ...g,
    ...v,
    className: m,
    style: w
  };
  if (t.disabled && o !== "input" && o !== "textarea" && o !== "select" && (y["aria-disabled"] = "true"), t.textContent != null && n.length === 0) {
    const M = Fs(t, e);
    return M ? _(o, y, M, String(t.textContent)) : _(o, y, String(t.textContent));
  }
  if (o === "input" && __(y, t), o === "textarea" && x_(y, t), o === "a" && t.href && (y.href = t.href), o === "img" && (t.src && (y.src = t.src), t.alt && (y.alt = t.alt)), o === "video" && t.src && (y.src = t.src), o === "form" && t.onSubmit != null && (y.onSubmit = (M) => {
    M.preventDefault(), Z(t.onSubmit, "{}");
  }), l != null || u != null) {
    const M = a ? pn(a) : void 0;
    y.ref = (L) => {
      if (M && M(L), c)
        if (L) {
          const E = qt.get(c);
          if (!E || E.element !== L || E.resizeId !== l) {
            E && (E.observer.disconnect(), qt.delete(c));
            let C;
            const O = new ResizeObserver((W) => {
              for (const V of W) {
                const z = Math.round(V.contentRect.width), B = Math.round(V.contentRect.height);
                z === C.lastWidth && B === C.lastHeight || (C.lastWidth = z, C.lastHeight = B, Z(C.resizeId, JSON.stringify({ Width: z, Height: B })));
              }
            });
            C = { element: L, observer: O, resizeId: l, lastWidth: -1, lastHeight: -1 }, O.observe(L), qt.set(c, C);
          }
        } else {
          const E = qt.get(c);
          E && (E.observer.disconnect(), qt.delete(c));
        }
      if (d)
        if (L) {
          const E = Jt.get(d);
          if (!E || E.element !== L || E.intersectId !== u) {
            E && (E.observer.disconnect(), Jt.delete(d));
            const C = u, O = new IntersectionObserver((W) => {
              for (const V of W)
                Z(C, JSON.stringify({
                  IsIntersecting: V.isIntersecting,
                  IntersectionRatio: V.intersectionRatio
                }));
            });
            O.observe(L), Jt.set(d, { element: L, observer: O, intersectId: C });
          }
        } else {
          const E = Jt.get(d);
          E && (E.observer.disconnect(), Jt.delete(d));
        }
    };
  }
  const x = e === "vo-form-field" && t.label ? [_("label", { className: "text-sm font-medium text-foreground" }, t.label), ...lt(n)] : lt(n);
  let A = (e === "vo-form-section" && t.title ? [_("h3", { className: "text-lg font-semibold" }, t.title), ...lt(n)] : null) || x;
  const S = Fs(t, e);
  return S && Array.isArray(A) && (A = [S, ...A]), e === "vo-progress" ? y_(y, t) : e === "vo-avatar" && t.src ? _(
    o,
    y,
    _("img", { src: t.src, className: "aspect-square h-full w-full object-cover" })
  ) : _(o, y, ...A);
}
function v_(e) {
  switch (e) {
    case "vo-nav-item":
    case "vo-sidebar-item":
      return "bg-accent text-accent-foreground font-medium";
    default:
      return "active";
  }
}
function Fs(e, t) {
  return t === "vo-icon" && e.name ? _("span", { className: "vo-icon", "data-icon": e.name }) : e.icon && t !== "vo-icon" ? _("span", { className: "vo-icon mr-1.5 inline-flex items-center", "data-icon": e.icon }) : null;
}
function g_(e) {
  const t = e.ref, n = e.width || 300, o = e.height || 150, r = kn(e), i = e.fullscreen, s = e.onPointer, a = e.onResize, l = a != null ? t ? `ref:${t}` : `resize:${a}` : null, c = {};
  i && (c.width = "100%", c.height = "100%");
  const u = {};
  if (s != null) {
    const f = (p, m) => {
      const h = m.currentTarget.getBoundingClientRect();
      Z(s, JSON.stringify({
        Kind: p,
        X: m.clientX - h.left,
        Y: m.clientY - h.top,
        Button: m.button,
        Buttons: m.buttons
      }));
    };
    u.onPointerDown = (p) => f("down", p), u.onPointerUp = (p) => f("up", p), u.onPointerMove = (p) => f("move", p), u.onPointerEnter = (p) => f("enter", p), u.onPointerLeave = (p) => f("leave", p);
  }
  const d = (f) => {
    if (t && pn(t)(f), !l)
      return;
    if (!f) {
      const v = Xt.get(l);
      v && (v.observer.disconnect(), Xt.delete(l));
      return;
    }
    const p = Xt.get(l);
    if (p && p.element === f && p.resizeId === a)
      return;
    p && (p.observer.disconnect(), Xt.delete(l));
    let m;
    const h = new ResizeObserver((v) => {
      for (const g of v) {
        const w = Math.round(g.contentRect.width), y = Math.round(g.contentRect.height);
        w === m.lastWidth && y === m.lastHeight || (m.lastWidth = w, m.lastHeight = y, Z(m.resizeId, JSON.stringify({
          Width: w,
          Height: y
        })));
      }
    });
    m = {
      element: f,
      observer: h,
      resizeId: a,
      lastWidth: -1,
      lastHeight: -1
    }, h.observe(f), Xt.set(l, m);
  };
  return _("canvas", {
    ...r,
    ...u,
    width: n,
    height: o,
    style: Object.keys(c).length > 0 ? c : void 0,
    ref: d
  });
}
function b_(e, t) {
  const n = t.length > 0 ? lt(t) : void 0;
  return _(w_, { props: e, voChildren: n });
}
function w_({ props: e, voChildren: t }) {
  const n = e.widgetType, o = kn(e), r = ce(e), i = T(null), s = T(null), a = T(e);
  return a.current = e, F(() => {
    var c;
    const l = s.current;
    l && ((c = l.update) == null || c.call(l, e));
  }, [e]), F(() => {
    const l = i.current;
    if (!l) return;
    const c = xd.get(n);
    if (Un(`[vogui] hostWidget effect type=${n} hasFactory=${c ? "yes" : "no"}`), !c) return;
    const u = (f) => {
      const p = a.current;
      p.onWidget != null && Z(p.onWidget, f);
    };
    Un(`[vogui] hostWidget create type=${n}`);
    const d = c.create(l, a.current, u);
    return s.current = d, so.add(d), () => {
      var f;
      Un(`[vogui] hostWidget destroy type=${n}`), so.delete(d), s.current === d && (s.current = null), (f = d.destroy) == null || f.call(d);
    };
  }, [n]), _("div", {
    ...o,
    className: "vo-host-widget",
    style: r,
    "data-widget-type": n,
    ref: (l) => {
      i.current = l, e.ref && pn(e.ref)(l);
    }
  }, t);
}
function y_(e, t) {
  const n = t.value || 0, o = t.max || 100, r = Math.round(n / o * 100);
  return _(
    "div",
    {
      ...e,
      className: [e.className, "relative h-2 w-full overflow-hidden rounded-full bg-muted"].filter(Boolean).join(" ")
    },
    _("div", {
      className: "h-full bg-primary transition-all",
      style: { width: `${r}%` }
    })
  );
}
function __(e, t) {
  t.type && (e.type = t.type), t.value != null && (e.value = String(t.value)), t.placeholder && (e.placeholder = t.placeholder), t.disabled && (e.disabled = !0), t.readOnly && (e.readOnly = !0), e.className = [
    e.className,
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
    "transition-colors placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ].filter(Boolean).join(" ");
}
function x_(e, t) {
  t.value != null && (e.value = String(t.value)), t.placeholder && (e.placeholder = t.placeholder), t.rows && (e.rows = Number(t.rows)), t.disabled && (e.disabled = !0), e.className = [
    e.className,
    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ].filter(Boolean).join(" ");
}
function kn(e) {
  const t = {};
  if (e.ref && (t.ref = pn(e.ref)), e.key && (t.key = e.key, t["data-key"] = e.key), e.variant && (t["data-variant"] = e.variant), e.transition && (t["data-transition"] = e.transition), e.attrs && typeof e.attrs == "object") {
    const n = e.attrs;
    for (const [o, r] of Object.entries(n))
      typeof r == "boolean" ? r && (t[o] = "") : t[o] = String(r);
  }
  return t;
}
const C_ = new TextDecoder("utf-8");
function S_(e) {
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
class A_ {
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
    return this.pos += t, C_.decode(n);
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
function k_(e) {
  const t = new A_(e), n = t.u32(), o = t.u8(), r = t.node(), i = t.u16(), s = new Array(i);
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
      const p = t.str(), m = t.u32(), h = new Array(m);
      for (let v = 0; v < m; v++) {
        const g = t.str(), w = t.u8();
        if (w > 0) {
          const y = new Array(w);
          for (let x = 0; x < w; x++) y[x] = t.value();
          h[v] = { c: g, a: y };
        } else
          h[v] = { c: g };
      }
      l[f] = { ref: p, cmds: h };
    }
  }
  let c;
  if (o & 4) {
    const d = t.u16();
    c = {};
    for (let f = 0; f < d; f++) {
      const p = t.str(), m = t.str();
      c[p] = m;
    }
  }
  let u;
  if (o & 8) {
    const d = t.u16();
    u = new Array(d);
    for (let f = 0; f < d; f++) {
      const p = t.str(), m = S_(t.str()), v = t.u8() !== 0 ? t.i32() : void 0, w = t.u8() !== 0 ? t.i32() : void 0, y = { ref: p, cmd: m };
      v !== void 0 && (y.top = v), w !== void 0 && (y.measureId = w), u[f] = y;
    }
  }
  return { type: "render", gen: n, tree: r, handlers: s, styles: a, canvas: l, theme: c, refActions: u };
}
function N_(e) {
  return Ii(e.tree);
}
function r0(e) {
  return N_(k_(e));
}
function Ii(e) {
  var o;
  if (!e)
    return null;
  if (e.type === "vo-host-widget") {
    const r = (o = e.props) == null ? void 0 : o.onWidget;
    if (typeof r == "number")
      return r;
  }
  const t = e.props ?? {};
  for (const r of Object.values(t)) {
    const i = Ir(r);
    if (i !== null)
      return i;
  }
  const n = e.children ?? [];
  for (const r of n) {
    const i = Ii(r);
    if (i !== null)
      return i;
  }
  return null;
}
function Ir(e) {
  if (Array.isArray(e)) {
    for (const t of e) {
      const n = Ir(t);
      if (n !== null)
        return n;
    }
    return null;
  }
  if (!e || typeof e != "object")
    return null;
  if (P_(e))
    return Ii(e);
  for (const t of Object.values(e)) {
    const n = Ir(t);
    if (n !== null)
      return n;
  }
  return null;
}
function P_(e) {
  return "type" in e && typeof e.type == "string" && ("props" in e || "children" in e);
}
let Zt = null;
const wt = /* @__PURE__ */ new Map(), ao = /* @__PURE__ */ new Map();
let E_ = 1, T_ = 1, Uo = 1, Dr = 1, De = null, Je = null, Sd = 0, Ad = 1, Dt = !1, Di = 0, jo = 0;
function rt() {
  return Zt || (Zt = new AudioContext()), Zt.state === "suspended" && Zt.resume(), Zt;
}
function L_(e, t) {
  if (e.buffer || e.decoding) return;
  e.decoding = !0;
  const n = rt(), o = e.raw.slice(0);
  n.decodeAudioData(o).then((r) => {
    e.buffer = r, e.decoding = !1;
  }).catch((r) => {
    console.warn(`voAudio: decode failed for clip ${t}:`, r), e.decoding = !1;
  });
}
function M_(e) {
  const t = E_++, n = new ArrayBuffer(e.byteLength);
  new Uint8Array(n).set(e);
  const o = { raw: n, buffer: null, decoding: !1 };
  return wt.set(t, o), L_(o, t), t;
}
function R_(e) {
  wt.delete(e);
}
function O_(e, t, n) {
  const o = wt.get(e);
  if (!o || !o.buffer) return;
  const r = rt(), i = r.createBufferSource();
  i.buffer = o.buffer, i.playbackRate.value = n;
  const s = r.createGain();
  s.gain.value = t * Uo, i.connect(s).connect(r.destination), i.start();
}
function I_(e, t) {
  kd();
  const n = wt.get(e);
  if (!n || !n.buffer) return;
  const o = rt(), r = o.createBufferSource();
  r.buffer = n.buffer, r.loop = !0;
  const i = o.createGain();
  i.gain.value = t * Dr, r.connect(i).connect(o.destination), r.start(), De = r, Je = i, Sd = e, Ad = t, Dt = !1, Di = o.currentTime, jo = 0;
}
function kd() {
  if (De) {
    try {
      De.stop();
    } catch {
    }
    De.disconnect(), De = null;
  }
  Je && (Je.disconnect(), Je = null), Dt = !1, jo = 0;
}
function D_() {
  if (!De || Dt) return;
  const e = rt();
  jo += e.currentTime - Di;
  try {
    De.stop();
  } catch {
  }
  De.disconnect(), De = null, Dt = !0;
}
function F_() {
  if (!Dt || !Je) return;
  const e = wt.get(Sd);
  if (!e || !e.buffer) return;
  const t = rt(), n = t.createBufferSource();
  n.buffer = e.buffer, n.loop = !0, n.connect(Je).connect(t.destination), n.start(0, jo % e.buffer.duration), De = n, Di = t.currentTime, Dt = !1;
}
function B_(e) {
  Uo = Math.max(0, Math.min(1, e));
}
function $_(e) {
  Dr = Math.max(0, Math.min(1, e)), Je && (Je.gain.value = Ad * Dr);
}
function W_(e, t, n, o, r, i, s, a, l) {
  const u = rt().listener;
  u.positionX ? (u.positionX.value = e, u.positionY.value = t, u.positionZ.value = n, u.forwardX.value = o, u.forwardY.value = r, u.forwardZ.value = i, u.upX.value = s, u.upY.value = a, u.upZ.value = l) : (u.setPosition(e, t, n), u.setOrientation(o, r, i, s, a, l));
}
function H_(e, t, n, o, r, i, s) {
  const a = wt.get(e);
  if (!a || !a.buffer) return;
  const l = rt(), c = l.createBufferSource();
  c.buffer = a.buffer;
  const u = l.createPanner();
  u.panningModel = "HRTF", u.distanceModel = "inverse", u.refDistance = i, u.maxDistance = s, u.rolloffFactor = 1, u.positionX.value = t, u.positionY.value = n, u.positionZ.value = o;
  const d = l.createGain();
  d.gain.value = r * Uo, c.connect(u).connect(d).connect(l.destination), c.start();
}
function V_(e, t, n, o, r, i, s) {
  const a = wt.get(e);
  if (!a || !a.buffer) return -1;
  const l = rt(), c = l.createBufferSource();
  c.buffer = a.buffer, c.loop = !0;
  const u = l.createPanner();
  u.panningModel = "HRTF", u.distanceModel = "inverse", u.refDistance = i, u.maxDistance = s, u.rolloffFactor = 1, u.positionX.value = t, u.positionY.value = n, u.positionZ.value = o;
  const d = l.createGain();
  d.gain.value = r * Uo, c.connect(u).connect(d).connect(l.destination), c.start();
  const f = T_++;
  return ao.set(f, {
    sourceNode: c,
    gainNode: d,
    pannerNode: u,
    clipId: e,
    volume: r,
    refDistance: i,
    maxDistance: s
  }), f;
}
function U_() {
}
function j_(e, t, n, o) {
  const r = ao.get(e);
  r && (r.pannerNode.positionX.value = t, r.pannerNode.positionY.value = n, r.pannerNode.positionZ.value = o);
}
function z_(e) {
  const t = ao.get(e);
  if (t) {
    if (t.sourceNode) {
      try {
        t.sourceNode.stop();
      } catch {
      }
      t.sourceNode.disconnect();
    }
    t.gainNode.disconnect(), t.pannerNode.disconnect(), ao.delete(e);
  }
}
function i0() {
  const e = window;
  e.voAudioLoad = M_, e.voAudioFree = R_, e.voAudioPlaySound = O_, e.voAudioPlayMusic = I_, e.voAudioStopMusic = kd, e.voAudioPauseMusic = D_, e.voAudioResumeMusic = F_, e.voAudioSetSFXVolume = B_, e.voAudioSetMusicVolume = $_, e.voAudioSetListener = W_, e.voAudioPlaySound3D = H_, e.voAudioCreateSource3D = V_, e.voAudioUpdateSpatial = U_, e.voAudioSetSource3DPos = j_, e.voAudioRemoveSource3D = z_;
}
export {
  vf as applyTheme,
  k_ as decodeBinaryRender,
  n0 as destroyWidgets,
  Z as emit,
  Dp as executeCanvasBatch,
  ff as executeRefAction,
  Ip as fillTextWrap,
  N_ as findHostWidgetHandlerId,
  r0 as findHostWidgetHandlerIdInBytes,
  G_ as getRef,
  hf as injectDynamicStyles,
  Y_ as injectStyles,
  i0 as installAudioBridge,
  J_ as isDarkMode,
  Z_ as measureText,
  Q_ as measureTextLines,
  t0 as registerWidget,
  o0 as render,
  q_ as setDarkMode,
  Zd as setRenderContext,
  K_ as setupKeyHandler,
  X_ as toggleDarkMode,
  ue as voNodeToVNode
};
