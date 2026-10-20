'use strict';
/* ===================== 百戏茶馆 core: utilities ===================== */
const BX = window.BX = {games: {}, list: [], ver: '1.0', ARTIFACT: !!window.BX_ARTIFACT};
const QS = new URLSearchParams(location.search);
BX.QS = QS;
BX.test = QS.has('test');           // test build hooks (fast AI, no delays)
BX.bot = QS.has('bot');             // local human seats are played by the AI (for automated tests)
const $id = id => document.getElementById(id);
BX.$ = $id;
BX.data = {};

/* h('div', {class:'x', style:{...}, on:{click:fn}, html:'..', text:'..'}, child, ...) */
BX.h = function h(tag, a, ...kids) {
  const e = document.createElement(tag);
  if (a) for (const k in a) {
    const v = a[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'on') for (const t in v) e.addEventListener(t, v[t]);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k in e && typeof v !== 'string') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : String(c));
  return e;
};
const h = BX.h;

BX.store = {
  get(k, d) { try { const v = localStorage.getItem('baixi.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('baixi.' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('baixi.' + k); } catch (e) {} },
};

/* seeded PRNG (mulberry32) — returns () => [0,1) */
BX.rng = function (seed) {
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.int = n => Math.floor(f() * n);
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  f.state = () => a; f.setState = s => { a = s >>> 0; };
  return f;
};
BX.newSeed = () => (Math.random() * 4294967296) >>> 0;
BX.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
BX.lerp = (a, b, t) => a + (b - a) * t;
BX.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
BX.shuffle = (arr, rnd = Math.random) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
BX.pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
BX.range = n => Array.from({length: n}, (_, i) => i);
BX.sleep = ms => new Promise(r => setTimeout(r, ms));
BX.clone = o => JSON.parse(JSON.stringify(o));
BX.ease = {
  out: t => 1 - (1 - t) * (1 - t), in: t => t * t, inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  back: t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2), bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
};
/* fit a logical w×h box into W×H with padding; returns {s, x, y} (scale + top-left offset) */
BX.fit = (W, H, w, h, pad = 8) => { const s = Math.max(0.01, Math.min((W - 2 * pad) / w, (H - 2 * pad) / h)); return {s, x: (W - w * s) / 2, y: (H - h * s) / 2}; };
BX.PHONE = matchMedia('(pointer:coarse) and (max-height:500px), (pointer:coarse) and (max-width:500px)');
BX.TOUCH = matchMedia('(pointer:coarse)');

BX.toast = function (msg, ms = 2000) {
  const t = h('div', {class: 'toast', text: msg});
  $id('layer').append(t); setTimeout(() => t.remove(), ms);
};

/* generic modal. opts: {title, html|body(Element), buttons:[{label, value, cls}], cls, dismiss(value when tapping backdrop / X; undefined = not dismissible)} → Promise<value> */
BX.modal = function (opts) {
  return new Promise(res => {
    const close = v => { ov.remove(); BX._modals.delete(ov); res(v); };
    const box = h('div', {class: 'mbox ' + (opts.cls || '')},
      opts.big ? h('div', {class: 'res-big', text: opts.big}) : null,
      opts.title ? h('h3', {text: opts.title}) : null,
      opts.body || (opts.html != null ? h('div', {class: 'msg', html: opts.html}) : null),
      h('div', {class: 'btns'}, (opts.buttons || [{label: '好', value: true}]).map(b => h('button', {class: 'bx-btn ' + (b.cls || ''), text: b.label, on: {click: () => close(b.value)}}))));
    const sheet = h('div', {class: 'sheet', style: {width: 'min(' + (opts.width || 420) + 'px,100%)'}}, box);
    if (opts.dismiss !== undefined) sheet.append(h('button', {class: 'sheet-x', text: '✕', on: {click: () => close(opts.dismiss)}}));
    const ov = h('div', {class: 'ov', on: {click: e => { if (e.target === ov && opts.dismiss !== undefined) close(opts.dismiss); }}}, sheet);
    ov._close = close; BX._modals.add(ov);
    $id('layer').append(ov);
  });
};
BX._modals = new Set();
BX.closeModals = () => { for (const m of [...BX._modals]) m._close(undefined); };
BX.confirm = (text, yes = '确定', no = '取消') => BX.modal({title: '', html: text, buttons: [{label: no, value: false, cls: 'ghost'}, {label: yes, value: true, cls: 'red'}], dismiss: false});
BX.choose = (title, labels, sub) => BX.modal({title, html: sub || '', buttons: labels.map((l, i) => ({label: l, value: i}))});

BX.myName = () => BX.store.get('name', '') || '茶客';
BX.esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
