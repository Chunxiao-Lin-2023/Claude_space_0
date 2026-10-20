/* 斗地主 / 跑得快 / 彩牌接龙 — shared card helpers: rules engine for "climbing" games (classify / compare / generate),
   hand-decomposition AI, table UI helpers, and the full climbing-game instance used by doudizhu.js and paodekuai.js. */
const D = BX.draw, C = BX.C;
const L = BX.data.ddz = {};

/* ================= cards =================
   id 0..51 = suit*13 + (rank-1)  (rank 1=A … 13=K, suit 0..3 = ♠♥♣♦), 52 = 小王, 53 = 大王.
   value: 3..13, A=14, 2=15, 小王=16, 大王=17 */
const val = id => id === 53 ? 17 : id === 52 ? 16 : (id % 13 === 0 ? 14 : id % 13 === 1 ? 15 : id % 13 + 1);
const face = id => id >= 52 ? {joker: id === 53 ? 'big' : 'small'} : {r: id % 13 + 1, s: (id / 13) | 0};
const VN = {3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '小王', 17: '大王'};
const sortIds = a => a.sort((x, y) => val(y) - val(x) || x - y);
const countIds = ids => { const c = new Array(18).fill(0); for (const i of ids) c[val(i)]++; return c; };
const countVals = vs => { const c = new Array(18).fill(0); for (const v of vs) c[v]++; return c; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
L.val = val; L.face = face; L.VN = VN; L.sortIds = sortIds; L.countIds = countIds;

const TN = {single: '单张', pair: '对子', trio: '三张', trio1: '三带一', trio2: '三带二', straight: '顺子', pairs: '连对', plane: '飞机', plane1: '飞机带翅膀', plane2: '飞机带翅膀', four2: '四带二', four22: '四带两对', bomb: '炸弹', rocket: '王炸'};
L.TN = TN;

/* highest value v such that v-n+1..v all have count >= m (chains stop at A) */
function runTop(c, n, m, below = 15) {
  for (let v = Math.min(14, below - 1); v - n + 1 >= 3; v--) { let ok = true; for (let i = 0; i < n; i++) if (c[v - i] < m) { ok = false; break; } if (ok) return v; }
  return 0;
}
/* all interpretations of a set of card values. G = 'ddz' | 'pdk'; whole = these are the player's last cards */
function classify(vals, G, whole) {
  const k = vals.length; if (!k) return [];
  const c = countVals(vals), ks = []; for (let v = 3; v <= 17; v++) if (c[v]) ks.push(v);
  let mx = 0; for (const v of ks) mx = Math.max(mx, c[v]);
  const out = [], add = (t, v, n) => out.push({t, v, n, k});
  const consec = arr => arr.every((v, i) => !i || v === arr[i - 1] + 1) && arr[arr.length - 1] <= 14;
  const top = m => { for (let v = 17; v >= 3; v--) if (c[v] >= m) return v; return 0; };
  if (G === 'ddz' && k === 2 && c[16] && c[17]) { add('rocket', 17, 1); return out; }
  if (k === 4 && mx === 4) add('bomb', ks[0], 1);
  if (k === 1) add('single', ks[0], 1);
  if (k === 2 && mx === 2) add('pair', ks[0], 1);
  if (G === 'ddz') {
    if (k === 3 && mx === 3) add('trio', ks[0], 1);
    if (k === 4 && mx === 3) add('trio1', top(3), 1);
    if (k === 5 && mx === 3 && ks.length === 2) add('trio2', top(3), 1);
  } else {
    if (k === 5 && mx === 3) add('trio2', top(3), 1);
    if (whole && (k === 3 || k === 4) && mx === 3) add('trio2', top(3), 1);
  }
  if (k >= 5 && mx === 1 && consec(ks)) add('straight', ks[ks.length - 1], k);
  if (mx === 2 && ks.every(v => c[v] === 2) && ks.length >= (G === 'ddz' ? 3 : 2) && consec(ks)) add('pairs', ks[ks.length - 1], ks.length);
  if (G === 'ddz') {
    if (ks.length >= 2 && ks.every(v => c[v] === 3) && consec(ks)) add('plane', ks[ks.length - 1], ks.length);
    if (k % 4 === 0 && k >= 8) { const n = k / 4, v = runTop(c, n, 3); if (v) add('plane1', v, n); }
    if (k % 5 === 0 && k >= 10) {
      const n = k / 5;
      for (let v = 14; v - n + 1 >= 3; v--) {
        let ok = true; for (let i = 0; i < n; i++) if (c[v - i] < 3) { ok = false; break; }
        if (!ok) continue;
        const r = c.slice(); for (let i = 0; i < n; i++) r[v - i] -= 3;
        if (r.every(x => x % 2 === 0) && !(r[16] || r[17])) { add('plane2', v, n); break; }
      }
    }
    if (k === 6 && mx === 4 && !(c[16] && c[17])) add('four2', top(4), 1);
    if (k === 8 && mx === 4) { const v4 = top(4), r = c.slice(); r[v4] -= 4; if (r.every(x => x % 2 === 0) && !(r[16] || r[17])) add('four22', v4, 1); }
  } else {
    for (let n = 2; 3 * n <= k; n++) if (k === 5 * n || (whole && k < 5 * n)) { const v = runTop(c, n, 3); if (v) add('plane', v, n); }
  }
  return out;
}
function beats(a, b) {
  if (!b) return true;
  if (a.t === 'rocket') return true;
  if (b.t === 'rocket') return false;
  if (a.t === 'bomb' && b.t !== 'bomb') return true;
  if (b.t === 'bomb' && a.t !== 'bomb') return false;
  return a.t === b.t && a.n === b.n && a.v > b.v;
}
const match = (vals, G, prev, whole) => classify(vals, G, whole).find(x => beats(x, prev)) || null;
L.classify = classify; L.beats = beats; L.match = match;

/* kicker candidates (values) ordered by how cheap they are to give away */
function kickers(c, excl, need = 1) {
  const out = [];
  for (let v = 3; v <= 17; v++) { if (excl.includes(v)) continue; if (c[v] >= need) out.push(v); }
  const cost = v => (c[v] === 1 ? 0 : c[v] === 2 ? 12 : c[v] === 3 ? 30 : 60) + v + (v >= 15 ? 25 : 0);
  return out.sort((a, b) => cost(a) - cost(b));
}
function combos(arr, n, lim = 40) {
  const out = [], cur = [];
  (function rec(i) { if (out.length >= lim) return; if (cur.length === n) { out.push(cur.slice()); return; } for (let j = i; j < arr.length; j++) { cur.push(arr[j]); rec(j + 1); cur.pop(); } })(0);
  return out;
}
/* generate candidate plays (arrays of values) from counts c that beat prev (or any lead when prev null) */
function gen(c, G, prev) {
  const out = [], tot = sum(c), ddz = G === 'ddz';
  const want = t => !prev || prev.t === t;
  const pv = prev ? prev.v : 0, pn = prev ? prev.n : 0;
  const rep = (v, n) => Array(n).fill(v);
  if (want('single')) for (let v = 3; v <= 17; v++) if (c[v] && v > pv) out.push([v]);
  if (want('pair')) for (let v = 3; v <= 15; v++) if (c[v] >= 2 && v > pv) out.push([v, v]);
  if (ddz) {
    if (want('trio')) for (let v = 3; v <= 15; v++) if (c[v] >= 3 && v > pv) out.push(rep(v, 3));
    if (want('trio1')) for (let v = 3; v <= 15; v++) if (c[v] >= 3 && v > pv) for (const u of kickers(c, [v]).slice(0, 6)) out.push([v, v, v, u]);
    if (want('trio2')) for (let v = 3; v <= 15; v++) if (c[v] >= 3 && v > pv) for (const u of kickers(c, [v], 2).filter(u => u <= 15).slice(0, 5)) out.push([v, v, v, u, u]);
  } else if (want('trio2')) {
    for (let v = 3; v <= 15; v++) {
      if (c[v] < 3 || v <= pv) continue;
      if (tot <= 4) { const all = []; for (let u = 3; u <= 17; u++) for (let i = 0; i < c[u]; i++) all.push(u); out.push(all); continue; }
      const kc = []; for (const u of kickers(c, [v])) for (let i = 0; i < Math.min(2, c[u]); i++) kc.push(u);
      const seen = new Set();
      for (const cb of combos(kc.slice(0, 8), 2)) { const key = cb.join(','); if (seen.has(key)) continue; seen.add(key); out.push([v, v, v, ...cb]); }
    }
  }
  const chains = (t, m, minL) => {
    if (!want(t)) return;
    for (let a = 3; a <= 14; a++) for (let b = a; b <= 14 && c[b] >= m; b++) {
      const len = b - a + 1; if (len < minL || (prev && len !== pn) || b <= pv) continue;
      const vs = []; for (let v = a; v <= b; v++) for (let i = 0; i < m; i++) vs.push(v);
      if (t === 'straight' || t === 'pairs' || (t === 'plane' && ddz)) { out.push(vs); continue; }
    }
  };
  chains('straight', 1, 5); chains('pairs', 2, ddz ? 3 : 2);
  if (ddz) chains('plane', 3, 2);
  // planes with wings
  const planeW = (t, kn) => {
    if (!want(t)) return;
    for (let a = 3; a <= 13; a++) for (let b = a + 1; b <= 14 && c[b] >= 3 && c[a] >= 3; b++) {
      let ok = true; for (let v = a; v <= b; v++) if (c[v] < 3) { ok = false; break; } if (!ok) break;
      const n = b - a + 1; if ((prev && n !== pn) || b <= pv) continue;
      const body = []; for (let v = a; v <= b; v++) body.push(v, v, v);
      const excl = []; for (let v = a; v <= b; v++) excl.push(v);
      const rest = c.slice(); for (const v of body) rest[v]--;
      if (t === 'plane1') { if (n * 4 > tot) continue; for (const cb of combos(kickers(rest, excl).slice(0, 7), n, 12)) out.push(body.concat(cb)); }
      else if (t === 'plane2') { if (n * 5 > tot) continue; for (const cb of combos(kickers(rest, excl, 2).filter(u => u <= 15).slice(0, 6), n, 10)) out.push(body.concat(cb.flatMap(u => [u, u]))); }
      else { // pdk plane: 2n wings (or the whole remaining hand when shorter)
        const kc = []; for (const u of kickers(rest, excl)) for (let i = 0; i < rest[u]; i++) kc.push(u);
        if (kc.length >= 2 * n) out.push(body.concat(kc.slice(0, 2 * n)));
        else if (body.length + kc.length === tot) out.push(body.concat(kc));
      }
    }
  };
  if (ddz) { planeW('plane1'); planeW('plane2'); } else planeW('plane');
  if (ddz) {
    if (want('four2')) for (let v = 3; v <= 15; v++) if (c[v] === 4 && v > pv) {
      const kc = []; for (const u of kickers(c, [v])) for (let i = 0; i < Math.min(2, c[u]); i++) kc.push(u);
      const seen = new Set(); for (const cb of combos(kc.slice(0, 6), 2, 15)) { const key = cb.join(); if (!seen.has(key) && !(cb[0] === 16 && cb[1] === 17)) { seen.add(key); out.push([v, v, v, v, ...cb]); } }
    }
    if (want('four22')) for (let v = 3; v <= 15; v++) if (c[v] === 4 && v > pv) for (const cb of combos(kickers(c, [v], 2).filter(u => u <= 15).slice(0, 5), 2, 10)) out.push([v, v, v, v, cb[0], cb[0], cb[1], cb[1]]);
  }
  // bombs & rocket
  if (!prev || prev.t !== 'rocket') {
    for (let v = 3; v <= 15; v++) if (c[v] === 4 && (!prev || prev.t !== 'bomb' || v > pv)) out.push(rep(v, 4));
    if (ddz && c[16] && c[17]) out.push([16, 17]);
  }
  return out;
}
L.gen = gen;

/* minimal number of plays needed to shed counts c (heuristic with chain search, memoised) */
function minH(c, G, memo) {
  let key = ''; for (let v = 3; v <= 17; v++) key += c[v];
  const hit = memo.get(key); if (hit != null) return hit;
  let h = 0, t = 0, p = 0, s = 0;
  for (let v = 3; v <= 15; v++) { const n = c[v]; if (n === 4) h++; else if (n === 3) t++; else if (n === 2) p++; else if (n === 1) s++; }
  if (c[16] && c[17]) h += G === 'ddz' ? 1 : 2; else s += c[16] + c[17];
  if (G === 'ddz') h += t + Math.max(0, s + p - t);
  else { const tp = Math.min(t, p), tr = t - tp; h += t + (p - tp) + Math.max(0, s - 2 * tr); }
  let best = h;
  const lone = () => { let n = 0; for (let v = 3; v <= 14; v++) if (c[v] === 1 || c[v] === 2) n++; return n; };
  const tryRun = (a, b, m, plane) => {
    for (let v = a; v <= b; v++) c[v] -= m;
    let r = 1 + minH(c, G, memo);
    if (plane) r -= Math.min(b - a + 1, lone());
    for (let v = a; v <= b; v++) c[v] += m;
    if (r < best) best = Math.max(1, r);
  };
  const pmin = G === 'ddz' ? 3 : 2;
  for (let a = 3; a <= 13; a++) {
    for (let b = a; b <= 14 && c[b] >= 1; b++) if (b - a + 1 >= 5) tryRun(a, b, 1);
    for (let b = a; b <= 14 && c[b] >= 2; b++) if (b - a + 1 >= pmin) tryRun(a, b, 2);
    for (let b = a; b <= 14 && c[b] >= 3; b++) if (b - a + 1 >= 2) tryRun(a, b, 3, true);
  }
  memo.set(key, best);
  return best;
}
L.minH = minH;

/* pick concrete card ids for a list of values (must = an id that has to be used if its value appears) */
function toIds(vals, hand, must) {
  const pool = hand.slice(), out = [];
  for (const v of vals) {
    let j = -1;
    if (must != null && !out.includes(must) && val(must) === v) j = pool.indexOf(must);
    if (j < 0) j = pool.findIndex(i => val(i) === v);
    if (j < 0) return null;
    out.push(pool[j]); pool.splice(j, 1);
  }
  return out;
}

/* ================= table UI helpers (also used by uno.js) ================= */
const U = L.ui = {};
U.table = (g, w, h, felt = '#2f6b4f') => {
  const gr = g.createRadialGradient(w / 2, h * .45, 20, w / 2, h * .5, Math.max(w, h) * .75);
  gr.addColorStop(0, '#5a3a20'); gr.addColorStop(1, '#22140a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const m = Math.min(w, h) * .025 + 4, r = Math.min(w, h) * .09;
  D.wood(g, m * .4, m * .4, w - m * .8, h - m * .8, {r: r + m * .6, base: '#7a4424', dark: '#3a1a0a', seed: 5, grain: .25});
  D.felt(g, m, m, w - 2 * m, h - 2 * m, {r, color: felt});
  g.save(); D.rr(g, m, m, w - 2 * m, h - 2 * m, r); g.clip();
  g.globalAlpha = .05; g.fillStyle = '#fff';
  for (let i = 0; i < 60; i++) { const x = (i * 197.3) % w, y = (i * 83.7) % h; g.fillRect(x, y, 1.5, 1.5); }
  g.globalAlpha = 1; g.restore();
  g.strokeStyle = 'rgba(230,197,125,.55)'; g.lineWidth = 1.5; D.rr(g, m + 5, m + 5, w - 2 * m - 10, h - 2 * m - 10, r * .8); g.stroke();
};
/* faint centre emblem on the felt */
U.emblem = (g, x, y, r, ch) => {
  g.save(); g.globalAlpha = .13; g.strokeStyle = '#f3e2c0'; g.lineWidth = Math.max(1.5, r * .04);
  D.circle(g, x, y, r); g.stroke(); D.circle(g, x, y, r * .82); g.stroke();
  D.text(g, ch, x, y + r * .04, {size: r * 1.05, color: '#f3e2c0', font: 'deco', weight: 400});
  g.restore();
};
U.seal = (g, x, y, s, ch, color) => {
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3; g.fillStyle = color; D.rr(g, x - s / 2, y - s / 2, s, s, s * .18); g.fill(); g.restore();
  g.strokeStyle = 'rgba(255,235,200,.75)'; g.lineWidth = Math.max(1, s * .06); D.rr(g, x - s * .4, y - s * .4, s * .8, s * .8, s * .12); g.stroke();
  D.text(g, ch, x, y + s * .04, {size: s * .62, color: '#fff3e0', font: 'serif', weight: 900});
};
/* player plaque. o = {name, color, active, count, role:[ch,color], alarm, sub, t} */
U.plaque = (g, x, y, w, h, o) => {
  g.save();
  if (o.active) { g.shadowColor = 'rgba(255,210,110,.9)'; g.shadowBlur = 14 + 6 * Math.sin((o.t || 0) * 6); }
  else { g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; }
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#4a2a18'); gr.addColorStop(1, '#2a160b');
  g.fillStyle = gr; D.rr(g, x, y, w, h, h * .22); g.fill(); g.restore();
  g.strokeStyle = o.active ? '#ffd76a' : 'rgba(230,197,125,.5)'; g.lineWidth = o.active ? 2.5 : 1.2; D.rr(g, x, y, w, h, h * .22); g.stroke();
  const ar = h * .34, ax = x + h * .46, ay = y + h / 2;
  D.disc(g, ax, ay, ar, o.color || '#888', {ring: 'rgba(255,240,210,.6)', shadow: false});
  D.text(g, (o.name || '?').slice(0, 1), ax, ay + 1, {size: ar * 1.05, color: '#fff8ea', font: 'serif', weight: 900});
  const tx = x + h * .88, fs = Math.max(11, h * .25);
  D.text(g, o.name || '', tx, y + h * .32, {size: fs, color: '#f6e7c8', align: 'left', maxW: w - (tx - x) - 6, weight: 700});
  if (o.count != null) {
    const bw = h * .2, bh = h * .28, by = y + h * .52;
    D.card(g, tx, by, bw, bh, null, {shadow: false, backText: ''});
    D.text(g, '×' + o.count, tx + bw + 4, by + bh / 2 + 1, {size: fs * .95, color: o.alarm ? '#ff8a6a' : '#e6c57d', align: 'left', weight: 800});
  }
  if (o.sub) D.text(g, o.sub, x + w - 6, y + h * .74, {size: fs * .8, color: '#cdb995', align: 'right'});
  if (o.role) U.seal(g, x + w - h * .2, y + h * .02, h * .38, o.role[0], o.role[1]);
  if (o.alarm) {
    const a = .55 + .45 * Math.sin((o.t || 0) * 9);
    g.save(); g.globalAlpha = a; g.fillStyle = '#d0301e'; D.rr(g, x + w - h * .95, y + h - h * .34, h * .9, h * .3, h * .1); g.fill(); g.restore();
    D.text(g, '报警', x + w - h * .5, y + h - h * .19, {size: h * .2, color: '#fff', weight: 800});
  }
};
/* canvas button  b = {x,y,w,h,label,kind:'red'|'gold'|'jade'|'ghost',dis} */
U.btn = (g, b) => {
  const cols = {red: ['#d0533f', '#a33022', '#6e1d14', '#fff3e3'], gold: ['#ecd08c', '#c8a052', '#8a6a2c', '#3a2410'], jade: ['#5aa08a', '#3f7f6b', '#23503f', '#f0fff8'], ghost: ['#5a4030', '#3d2a1c', '#21150c', '#f3e2c0']}[b.kind || 'gold'];
  const press = b.down ? 2 : 0;
  g.save(); if (b.dis) g.globalAlpha = .42;
  g.fillStyle = cols[2]; D.rr(g, b.x, b.y + 3, b.w, b.h, b.h * .28); g.fill();
  const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
  g.fillStyle = gr; D.rr(g, b.x, b.y + press, b.w, b.h, b.h * .28); g.fill();
  g.strokeStyle = 'rgba(255,240,210,.35)'; g.lineWidth = 1; D.rr(g, b.x + 2, b.y + 2 + press, b.w - 4, b.h - 4, b.h * .24); g.stroke();
  D.text(g, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1 + press, {size: Math.min(b.h * .42, b.w / Math.max(2, b.label.length) * .9), color: cols[3], weight: 800});
  g.restore();
};
U.hitBtn = (btns, p) => btns.find(b => !b.dis && p.x >= b.x - 3 && p.x <= b.x + b.w + 3 && p.y >= b.y - 3 && p.y <= b.y + b.h + 5);
/* lay out a row of buttons centred at cx */
U.row = (defs, cx, y, h, maxW) => {
  const gap = Math.max(6, h * .2); let bw = Math.min(h * 2.5, (maxW - gap * (defs.length - 1)) / defs.length);
  bw = Math.max(bw, 58); const tw = bw * defs.length + gap * (defs.length - 1);
  return defs.map((d, i) => Object.assign({x: cx - tw / 2 + i * (bw + gap), y, w: bw, h}, d));
};
/* hand layout: n cards between x0..x1 resting on yBottom. Two rows when crowded and allowed. → {rects, top} */
U.handRects = (n, x0, x1, yBottom, cw, ch, two) => {
  const avail = x1 - x0, maxStep = cw * .62; let rows = 1, per = n;
  let step = n > 1 ? Math.min(maxStep, (avail - cw) / (n - 1)) : 0;
  if (two && n > 1 && step < cw * .42) { rows = 2; per = Math.ceil(n / 2); step = Math.min(maxStep, (avail - cw) / Math.max(1, per - 1)); }
  const off = ch * .5, rects = [];
  for (let i = 0; i < n; i++) {
    const r = rows === 2 && i >= per ? 1 : 0, j = r ? i - per : i, cnt = rows === 2 ? (r ? n - per : per) : n;
    const wr = cw + step * (cnt - 1), sx = (x0 + x1) / 2 - wr / 2;
    rects.push({x: sx + j * step, y: yBottom - ch - (rows === 2 && !r ? off : 0), w: cw, h: ch, i});
  }
  return {rects, top: yBottom - ch - (rows === 2 ? off : 0), rows, step};
};
U.hitHand = (rects, p, raised) => {
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i], up = raised ? raised(i) : 0;
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - up && p.y <= r.y + r.h) return i;
  }
  return -1;
};
/* positions for a small fan of n cards. align 'l' → ax is left edge, 'r' right edge, 'c' centre. Wraps under maxW. */
U.fanPos = (n, ax, top, pw, ph, align, maxW) => {
  const step = pw * .42; let per = n;
  if (pw + step * (n - 1) > maxW) per = Math.max(1, Math.floor((maxW - pw) / step) + 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / per), j = i % per, cnt = Math.min(per, n - row * per), wr = pw + step * (cnt - 1);
    const sx = align === 'l' ? ax : align === 'r' ? ax - wr : ax - wr / 2;
    out.push({x: sx + j * step, y: top + row * ph * .55});
  }
  return out;
};
U.bubble = (g, x, y, text, size, o = {}) => {
  g.font = `800 ${size}px ${BX.F.sans}`; const tw = g.measureText(text).width + size * 1.2, th = size * 1.7;
  const bx = o.align === 'l' ? x : o.align === 'r' ? x - tw : x - tw / 2;
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6; g.fillStyle = o.bg || 'rgba(255,248,234,.95)'; D.rr(g, bx, y - th / 2, tw, th, th / 2); g.fill(); g.restore();
  D.text(g, text, bx + tw / 2, y + 1, {size, color: o.color || '#5a3a20', weight: 800});
};

/* ================= the climbing game (斗地主 'ddz' / 跑得快 'pdk') ================= */
L.climb = function (ctx, G) {
  const ddz = G === 'ddz', N = ctx.n, HAND = ddz ? 17 : 16;
  const st = {ph: 'deal', hands: [], bottom: [], aside: [], turn: 0, last: null, shown: [], passes: 0, plays: [], bombs: 0, played: [],
    bids: [], bidMax: 0, bidBy: -1, bidStart: 0, nBid: 0, lord: -1, base: 1, redeal: 0, first: true, mustId: null, res: null, seq: 0};
  const cv = ctx.canvas();
  /* ---------- rules ---------- */
  function deal() {
    let deck;
    if (ddz) deck = BX.range(54); else deck = BX.range(52).filter(i => ![0, 14, 27, 40].includes(i));
    ctx.rng.shuffle(deck);
    for (let s = 0; s < N; s++) st.hands[s] = sortIds(deck.slice(s * HAND, s * HAND + HAND));
    st.bottom = ddz ? deck.slice(51) : []; st.aside = ddz ? [] : deck.slice(N * HAND);
    st.shown = BX.range(N).map(() => null); st.plays = BX.range(N).map(() => 0); st.bids = BX.range(N).map(() => -1);
    st.last = null; st.passes = 0; st.bombs = 0; st.played = []; st.first = true;
    st.bidMax = 0; st.bidBy = -1; st.nBid = 0; st.lord = -1;
    if (ddz) { st.bidStart = ctx.rng.int(N); st.turn = st.bidStart; }
    else {
      let lo = null, who = 0;
      for (let s = 0; s < N; s++) for (const id of st.hands[s]) if (lo == null || val(id) < val(lo) || (val(id) === val(lo) && id < lo)) { lo = id; who = s; }
      st.mustId = lo; st.turn = who;
    }
    st.ph = 'deal';
    ui.dealT = 0; ctx.anim(1300, k => ui.dealT = k, null, BX.ease.out); ctx.sfx('shuffle'); ctx.after(500, () => ctx.sfx('deal'));
  }
  const nextHasOne = seat => !ddz && st.hands[(seat + 1) % N].length === 1;
  function interpFor(seat, ids) {
    const hand = st.hands[seat];
    if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || !ids.every(i => hand.includes(i))) return null;
    const vals = ids.map(val), whole = ids.length === hand.length;
    const it = match(vals, G, st.last, whole); if (!it) return null;
    if (!ddz) {
      if (st.first && st.mustId != null && hand.includes(st.mustId) && !ids.includes(st.mustId)) return null;
      if (it.t === 'single' && nextHasOne(seat) && vals[0] !== val(hand[0])) return null;
    }
    return it;
  }
  function legalMoves(seat) {
    const hand = st.hands[seat], out = [], seen = new Set();
    for (const vals of gen(countIds(hand), G, st.last)) {
      const ids = toIds(vals, hand, st.first ? st.mustId : null); if (!ids) continue;
      const key = vals.slice().sort((a, b) => a - b).join(','); if (seen.has(key)) continue; seen.add(key);
      const it = interpFor(seat, ids); if (it) out.push({ids, vals, it});
    }
    return out;
  }
  let cpKey = '', cpVal = false;
  const canPass = seat => {
    if (!st.last) return false; if (ddz) return true;
    const k = st.seq + ':' + seat; if (k !== cpKey) { cpKey = k; cpVal = !legalMoves(seat).length; } return cpVal;
  };
  /* ---------- UI state (never part of st) ---------- */
  const ui = {dealT: 1, sel: new Set(), fly: null, fx: [], hint: -1, hintList: null, lay: null, drag: null, t: 0, newIds: null, btns: [], shake: 0, alarmed: {}, botK: 1, press: null};
  const live = () => !ctx.ended;
  const roleOf = s => !ddz || st.lord < 0 ? null : s === st.lord ? ['地', '#b23a2b'] : ['农', '#3f7f6b'];
  function finish(w) {
    st.ph = 'over'; st.turn = -1;
    if (ddz) {
      const lw = w === st.lord, far = BX.range(N).filter(s => s !== st.lord);
      const spring = lw && far.every(s => st.plays[s] === 0), anti = !lw && st.plays[st.lord] === 1;
      const mult = Math.pow(2, st.bombs + (spring || anti ? 1 : 0)), score = st.base * mult;
      st.res = {w, lw, spring, anti, mult, score};
      const tags = [st.bombs ? '炸弹×' + st.bombs : '', spring ? '春天' : '', anti ? '反春' : ''].filter(Boolean).join(' · ');
      const text = (lw ? '地主 ' + ctx.name(st.lord) + ' 获胜' : '农民获胜') + `　底分 ${st.base} × ${mult} 倍 = ${score} 分` + (tags ? '（' + tags + '）' : '');
      ctx.end({winner: lw ? [st.lord] : far, text, delay: 1500});
    } else {
      let tot = 0; const det = [];
      for (let s = 0; s < N; s++) {
        if (s === w) continue;
        const n = st.hands[s].length; let p = n === 1 ? 0 : n; const shut = st.plays[s] === 0; if (shut) p *= 2;
        tot += p; det.push(ctx.name(s) + ' 剩' + n + '张' + (shut ? '（关门×2）' : n === 1 ? '（报单免罚）' : '') + ' −' + p);
      }
      st.res = {w, score: tot};
      ctx.end({winner: w, text: ctx.name(w) + ' 率先出完，赢 ' + tot + ' 分。' + det.join('；'), delay: 1500});
    }
    ctx.sfx('gong');
  }
  /* ---------- AI ---------- */
  function aiBid(seat, level) {
    const h = st.hands[seat], c = countIds(h);
    let s = (c[17] ? 4 : 0) + (c[16] ? 3 : 0) + c[15] * 2 + c[14] * .6;
    for (let v = 3; v <= 15; v++) if (c[v] === 4) s += 5;
    if (level >= 3) { const mh = minH(c, G, new Map()); s += (8 - mh) * .7; }
    else if (level === 2) s += 0;
    let b = s >= 10 ? 3 : s >= 7.5 ? 2 : s >= 5.5 ? 1 : 0;
    if (level === 1) b = Math.random() < .45 ? Math.floor(Math.random() * 4) : b;
    if (b <= st.bidMax) b = 0;
    // last bidder with nobody bidding yet: take it with a half-decent hand rather than redeal forever
    if (!b && st.nBid === N - 1 && st.bidMax === 0 && s >= 4 && level >= 2) b = 1;
    return b;
  }
  function unseenCounts(seat) {
    const all = ddz ? BX.range(54) : BX.range(52).filter(i => ![0, 14, 27, 40].includes(i));
    const known = new Set(st.hands[seat].concat(st.played));
    if (ddz && st.lord >= 0 && st.lord !== seat) for (const b of st.bottom) if (st.hands[st.lord].includes(b)) known.add(b);
    return countIds(all.filter(i => !known.has(i)));
  }
  /* score every legal move (and passing) for seat. returns [[move|null, score]] */
  function rank(seat, level, moves) {
    const hand = st.hands[seat], c = countIds(hand), lead = !st.last, tot = hand.length;
    const ally = s => ddz && st.lord >= 0 && s !== seat && s !== st.lord && seat !== st.lord;
    const enemies = BX.range(N).filter(s => s !== seat && !ally(s));
    const danger = Math.min(...enemies.map(s => st.hands[s].length));
    const nxt = (seat + 1) % N, nxtAlly = ally(nxt), nxtN = st.hands[nxt].length;
    const memo = new Map(), H0 = minH(c, G, memo);
    const unseen = level >= 3 ? unseenCounts(seat) : null;
    const maxV = val(hand[0]);
    const out = [];
    for (const m of moves) {
      if (m.ids.length === tot) { out.push([m, 1e6]); continue; }
      const after = c.slice(); for (const v of m.vals) after[v]--;
      const h = minH(after, G, memo), big = m.it.t === 'bomb' || m.it.t === 'rocket';
      let s = -h * 100 - m.it.v * 2.2;
      if (lead) s += m.ids.length * 4;
      if (m.it.v >= 15 && !big) s -= 14;
      if (big) s -= (h <= 1 || danger <= 3 || (!lead && danger <= 5)) ? 10 : 140;
      if (!lead && st.last) {
        const gap = m.it.v - st.last.v;
        if (!big && gap > 4 && m.it.v >= 14 && danger > 5) s -= 60;
      }
      if (lead) {
        if (m.it.t === 'single') {
          if (danger === 1 && !(nxtAlly && nxtN === 1)) s += m.it.v === maxV ? 40 : -260;
          if (nxtAlly && nxtN === 1) s += 300 - m.it.v * 10;
        } else if (m.it.t === 'pair') {
          if (danger === 2) s -= 160;
          if (nxtAlly && nxtN === 2) s += 250 - m.it.v * 8;
        }
        if (danger <= 2 && m.it.t !== 'single' && m.it.t !== 'pair') s += 50;
      }
      if (unseen) {
        const ctl = !gen(unseen, G, m.it).length;
        if (ctl) s += h <= 1 ? 500 : 25;
        else if (lead && h <= 1) s -= 30;
      }
      out.push([m, s]);
    }
    if (st.last && ddz) {
      let ps = -H0 * 100;
      const by = st.last.s;
      if (ally(by)) ps += st.hands[by].length <= 2 ? 1000 : 150;
      else if (danger <= 3) ps -= 400;
      else if (danger <= 6) ps -= 60;
      out.push([null, ps]);
    }
    return out.sort((a, b) => b[1] - a[1]);
  }
  function aiMove(seat, level) {
    if (st.ph === 'bid') return {t: 'bid', v: aiBid(seat, level)};
    const moves = legalMoves(seat);
    if (!moves.length) return {t: 'pass'};
    const fin = moves.find(m => m.ids.length === st.hands[seat].length); if (fin) return {t: 'play', c: fin.ids};
    if (level === 1) {
      if (st.last && ddz && Math.random() < .25) return {t: 'pass'};
      const srt = moves.slice().sort((a, b) => ((a.it.t === 'bomb' || a.it.t === 'rocket') - (b.it.t === 'bomb' || b.it.t === 'rocket')) || a.it.v - b.it.v || b.ids.length - a.ids.length);
      const m = srt[Math.floor(Math.random() * Math.min(3, srt.length))];
      return {t: 'play', c: m.ids};
    }
    const r = rank(seat, level, moves);
    let pick = r[0];
    if (level === 2 && r.length > 1 && Math.random() < .15 && r[1][1] > r[0][1] - 120) pick = r[1];
    return pick[0] ? {t: 'play', c: pick[0].ids} : {t: 'pass'};
  }
  /* ---------- apply ---------- */
  function apply(a, by) {
    st.seq++;
    if (a.t === 'go') { st.ph = ddz ? 'bid' : 'play'; if (ddz) st.turn = st.bidStart; return; }
    if (a.t === 'bid') {
      st.bids[by] = a.v; st.nBid++;
      if (a.v > st.bidMax) { st.bidMax = a.v; st.bidBy = by; }
      st.shown[by] = {bid: a.v}; ctx.sfx(a.v ? 'chip' : 'tick');
      if (a.v === 3 || st.nBid === N) {
        if (!st.bidMax) { st.redeal++; ctx.toast('无人叫分，重新洗牌'); deal(); return; }
        st.lord = st.bidBy; st.base = st.bidMax;
        st.hands[st.lord] = sortIds(st.hands[st.lord].concat(st.bottom));
        st.ph = 'play'; st.turn = st.lord; st.shown = st.shown.map(() => null);
        ui.botK = 0; ctx.anim(700, k => ui.botK = k);
        if (st.lord === ctx.view) { ui.newIds = new Set(st.bottom); ctx.after(2500, () => ui.newIds = null); }
        ctx.sfx('gong'); fx(ctx.name(st.lord) + ' 当地主', '#ffd76a');
        return;
      }
      st.turn = (by + 1) % N; return;
    }
    if (a.t === 'pass') {
      st.shown[by] = {pass: 1}; st.passes++; ctx.sfx('tick');
      if (st.passes >= N - 1) { st.turn = st.last.s; st.last = null; st.passes = 0; }
      else st.turn = (by + 1) % N;
      return;
    }
    if (a.t === 'play') {
      const ids = a.c.slice(), it = interpFor(by, ids);
      if (!it) throw new Error('illegal play ' + JSON.stringify(a));
      // visual: remember where the cards came from
      if (!ctx.fast) {
        const from = {};
        if (by === ctx.view && ui.lay) for (const r of ui.lay.hand.rects) { const id = ui.lay.handIds[r.i]; if (ids.includes(id)) from[id] = {x: r.x, y: r.y - (ui.sel.has(id) ? ui.lay.raise : 0), w: r.w}; }
        ui.fly = {seat: by, k: 0, from}; ctx.anim(260, k => { if (ui.fly) ui.fly.k = k; }, () => ui.fly = null, BX.ease.out);
      }
      const hand = st.hands[by];
      for (const id of ids) hand.splice(hand.indexOf(id), 1);
      st.played.push(...ids); st.plays[by]++;
      if (!st.last) st.shown = st.shown.map(() => null);
      st.shown[by] = {c: sortIds(ids.slice()), t: it.t};
      st.last = {s: by, c: ids, t: it.t, v: it.v, n: it.n, k: it.k}; st.passes = 0; st.first = false;
      if (by === ctx.view) { ui.sel.clear(); ui.hint = -1; }
      ui.hintList = null;
      if (it.t === 'bomb' || it.t === 'rocket') {
        if (ddz) st.bombs++;
        ctx.sfx(it.t === 'rocket' ? 'crash' : 'boom'); ui.shake = 1; fx(it.t === 'rocket' ? '王 炸' : '炸 弹', '#ff7a4a', true);
      } else {
        ctx.sfx('card');
        if (['straight', 'pairs', 'plane', 'plane1', 'plane2'].includes(it.t)) { fx(TN[it.t], '#ffe2a0'); ctx.sfx('whoosh'); }
      }
      if (!hand.length) { finish(by); return; }
      if (hand.length <= 2 && !ui.alarmed[by + ':' + hand.length]) { ui.alarmed[by + ':' + hand.length] = 1; ctx.sfx('bell'); if (by !== ctx.view) ctx.toast(ctx.name(by) + (hand.length === 1 ? ' 只剩 1 张！' : ' 只剩 2 张！')); }
      st.turn = (by + 1) % N;
    }
  }
  function fx(text, color, big) { if (ctx.fast) return; const e = {text, color, big, k: 0}; ui.fx.push(e); ctx.anim(big ? 1300 : 1000, k => e.k = k, () => ui.fx.splice(ui.fx.indexOf(e), 1), x => x); }
  /* ---------- status ---------- */
  function status() {
    for (let s = 0; s < N; s++) ctx.info(s, (ddz && st.lord >= 0 ? (s === st.lord ? '地主 ' : '农民 ') : '') + (st.ph === 'deal' ? '' : st.hands[s].length + '张'));
    if (st.ph === 'over') { ctx.status(ddz ? (st.res.lw ? '地主获胜' : '农民获胜') : ctx.name(st.res.w) + ' 出完了'); return; }
    if (st.ph === 'deal') { ctx.status(st.redeal ? '重新洗牌发牌…' : '洗牌发牌中…'); return; }
    const me = ctx.canAct(st.turn), who = ctx.hotseat ? ctx.name(st.turn) : '你';
    if (st.ph === 'bid') { ctx.status(me ? `${ctx.hotseat ? who + '：' : ''}请叫分${st.bidMax ? '（当前 ' + st.bidMax + ' 分）' : ''}` : '等待 ' + ctx.name(st.turn) + ' 叫分…'); return; }
    if (me) ctx.status((ctx.hotseat ? who + '：' : '') + (!st.last ? '轮到你出牌' : canPass(st.turn) && !ddz ? '要不起上家' : '压过 ' + ctx.name(st.last.s) + ' 或不出'));
    else ctx.status('等待 ' + ctx.name(st.turn) + ' 出牌…');
  }
  /* ---------- layout ---------- */
  const rel = s => (s - ctx.view + N) % N;
  function layout() {
    const w = cv.w, h = cv.h, portrait = h > w * 1.1;
    const pad = Math.max(8, Math.min(w, h) * .025);
    const cw = portrait ? BX.clamp(w / 5.5, 46, 96) : BX.clamp(Math.min(w / 13, h / 4.3), 44, 96), ch = cw * 1.4;
    const pw = portrait ? cw * .7 : cw * .78, ph = pw * 1.4;
    const vs = ctx.view, hand = st.hands[vs] || [];
    let handIds = hand;
    if (st.ph === 'deal') handIds = hand.slice(0, Math.min(hand.length, Math.floor(ui.dealT * (HAND + .99))));
    const hl = U.handRects(handIds.length, pad, w - pad, h - pad * .7, cw, ch, portrait);
    if (!handIds.length) hl.top = h - pad - ch;
    const bh = BX.clamp(cw * .58, 44, 52), btnY = hl.top - bh - (portrait ? 14 : 12) - cw * .12;
    const PW = BX.clamp(w * (portrait ? .3 : .15), 108, 176), PH = BX.clamp(PW * .4, 48, 64);
    const seats = [];
    for (let s = 0; s < N; s++) {
      const r = rel(s); let p;
      if (r === 0) p = {px: pad, py: btnY - PH - 8, fanA: w / 2, fanT: btnY - ph - 10, align: 'c', maxW: w - 2 * pad, self: true};
      else if (N === 2) p = {px: w / 2 - PW / 2, py: pad, fanA: w / 2, fanT: pad + PH + 10, align: 'c', maxW: w - 2 * pad};
      else if (portrait) {
        const right = r === 1, py = pad;
        p = {px: right ? w - pad - PW : pad, py, fanA: right ? w - pad : pad, fanT: py + PH + 10 + (right ? 0 : ph * .55 + ph + 12), align: right ? 'r' : 'l', maxW: w - 2 * pad - 20};
      } else {
        const right = r === 1, py = Math.max(pad, h * .1), fanT = Math.max(py + PH + 10, h * .28), fx = pad + PW * .35;
        p = {px: right ? w - pad - PW : pad, py, fanA: right ? w - fx : fx, fanT, align: right ? 'r' : 'l', maxW: w / 2 - fx - 16};
      }
      seats[s] = p;
    }
    return {w, h, portrait, pad, cw, ch, pw, ph, hand: hl, handIds, raise: ch * .17, bh, btnY, PW, PH, seats};
  }
  /* ---------- input ---------- */
  const myTurn = () => (st.ph === 'bid' || st.ph === 'play') && ctx.canAct(st.turn);
  function buttons(lay) {
    if (!myTurn()) return [];
    const maxW = lay.w - 2 * lay.pad - (lay.portrait ? 0 : lay.PW * 1.4);
    const cx = lay.portrait ? lay.w / 2 + 26 : lay.w / 2, mw = lay.portrait ? lay.w - 2 * lay.pad - 56 : maxW;
    if (st.ph === 'bid') return U.row([0, 1, 2, 3].map(v => ({label: v ? v + ' 分' : '不叫', kind: v ? (v === 3 ? 'red' : 'gold') : 'ghost', dis: v && v <= st.bidMax, act: {t: 'bid', v}})), cx, lay.btnY, lay.bh, Math.min(mw, 420));
    const sel = [...ui.sel], it = sel.length ? interpFor(st.turn, sel) : null;
    const defs = [];
    const passOK = canPass(st.turn), forced = !ddz && passOK;
    if (st.last) defs.push({label: forced ? '要不起' : '不出', kind: forced ? 'red' : 'ghost', dis: !passOK, act: {t: 'pass'}});
    if (!forced) { defs.push({label: '提示', kind: 'jade', hint: true}); defs.push({label: '出牌', kind: 'red', dis: !it, act: it ? {t: 'play', c: sel} : null}); }
    return U.row(defs, cx, lay.btnY, lay.bh, Math.min(mw, 380));
  }
  function doHint() {
    const s = st.turn;
    if (!ui.hintList) { const mv = legalMoves(s); ui.hintList = rank(s, 2, mv).filter(x => x[0]).map(x => x[0]); if (!st.last) ui.hintList.sort((a, b) => a.it.v - b.it.v || b.ids.length - a.ids.length); else ui.hintList.sort((a, b) => ((a.it.t === 'bomb' || a.it.t === 'rocket') - (b.it.t === 'bomb' || b.it.t === 'rocket')) || a.it.v - b.it.v); ui.hint = -1; }
    if (!ui.hintList.length) { ctx.toast('没有能大过上家的牌'); return; }
    ui.hint = (ui.hint + 1) % ui.hintList.length; ui.sel = new Set(ui.hintList[ui.hint].ids); ctx.sfx('select');
  }
  function press(b) {
    if (b.hint) { doHint(); return; }
    if (!b.act) return;
    ctx.sfx('click'); ctx.act(b.act, st.turn);
  }
  ctx.on(cv.cv, 'pointerdown', e => {
    const p = cv.pos(e), lay = ui.lay; if (!lay) return;
    const b = U.hitBtn(ui.btns, p);
    if (b) { ui.press = b; b.down = true; setTimeout(() => { b.down = false; }, 120); press(b); return; }
    if (st.ph === 'deal' || st.ph === 'over') return;
    const i = U.hitHand(lay.hand.rects, p, j => ui.sel.has(lay.handIds[j]) ? lay.raise : 0);
    if (i >= 0) {
      const id = lay.handIds[i], on = !ui.sel.has(id);
      ui.drag = {start: i, on, base: new Set(ui.sel), last: i}; applyDrag(i); ctx.sfx('tick');
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
    } else if (p.y < lay.btnY - 4 && ui.sel.size) { ui.sel.clear(); }
  });
  function applyDrag(i) {
    const d = ui.drag, lay = ui.lay; if (!d) return;
    const a = Math.min(d.start, i), b = Math.max(d.start, i);
    ui.sel = new Set(d.base);
    for (let j = a; j <= b; j++) { const id = lay.handIds[j]; if (d.on) ui.sel.add(id); else ui.sel.delete(id); }
    ui.hint = -1;
  }
  ctx.on(cv.cv, 'pointermove', e => {
    if (!ui.drag || !ui.lay) return; const p = cv.pos(e), lay = ui.lay;
    // horizontal-only hit within the hand band
    let i = -1; const rs = lay.hand.rects;
    for (let j = rs.length - 1; j >= 0; j--) { const r = rs[j]; if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - lay.raise - 30 && p.y <= r.y + r.h + 30) { i = j; break; } }
    if (i >= 0 && i !== ui.drag.last) { ui.drag.last = i; applyDrag(i); ctx.sfx('tick'); }
  });
  const endDrag = () => { ui.drag = null; };
  ctx.on(cv.cv, 'pointerup', endDrag); ctx.on(cv.cv, 'pointercancel', endDrag);
  /* ---------- drawing ---------- */
  function drawCard(g, id, x, y, w, h, o) { D.card(g, x, y, w, h, id == null ? null : face(id), o); }
  function frame(dt) {
    const g = cv.g; cv.clear(); ui.t += dt;
    const lay = ui.lay = layout(), {w, h, pw, ph, cw, ch} = lay;
    g.save();
    if (ui.shake > 0) { ui.shake = Math.max(0, ui.shake - dt * 2.2); const a = ui.shake * 7; g.translate((Math.random() - .5) * a, (Math.random() - .5) * a); }
    U.table(g, w, h, ddz ? '#2f6b4f' : '#245a6b');
    const midY = lay.portrait ? h * .42 : (lay.seats[ctx.view].fanT + (lay.seats[(ctx.view + 1) % N].fanT + ph)) / 2;
    U.emblem(g, w / 2, midY, Math.min(w, h) * .14, ddz ? '斗' : '跑');
    // bottom cards / score panel (ddz)
    if (ddz) {
      const bw = lay.portrait ? pw * .78 : pw * .72, bhh = bw * 1.4, gap = bw * .12, tw = bw * 3 + gap * 2, bx = w / 2 - tw / 2, by = lay.pad * .8 + 2;
      for (let i = 0; i < 3; i++) {
        const id = st.bottom[i]; const flip = st.lord >= 0 ? ui.botK : 0;
        const sx = Math.abs(Math.cos(flip * Math.PI)), up = flip > .5;
        g.save(); g.translate(bx + i * (bw + gap) + bw / 2, by); g.scale(Math.max(.02, sx), 1);
        drawCard(g, up || st.ph === 'over' ? id : null, -bw / 2, 0, bw, bhh, {});
        g.restore();
      }
      const info = st.lord >= 0 ? `底分 ${st.base}　倍数 ×${Math.pow(2, st.bombs)}` : st.ph === 'bid' ? (st.bidMax ? '当前 ' + st.bidMax + ' 分' : '叫分中') : '底牌';
      D.text(g, info, w / 2, by + bhh + 13, {size: BX.clamp(cw * .2, 12, 16), color: '#f3e2c0', shadow: true});
    } else {
      if (!st.last || lay.portrait) D.text(g, N === 2 ? '两人 · 各 16 张' : '三人 · 各 16 张', w / 2, midY + Math.min(w, h) * .14 + 16, {size: BX.clamp(cw * .2, 12, 15), color: 'rgba(243,226,192,.45)'});
    }
    // deal animation: deck in the middle + flying backs
    if (st.ph === 'deal') {
      const dx = w / 2 - pw / 2, dy = midY - ph / 2;
      for (let i = 0; i < 4; i++) drawCard(g, null, dx - i * 1.5, dy - i * 1.5, pw, ph, {shadow: i === 3});
      const k = ui.dealT; if (k < 1) {
        const i = Math.floor(k * HAND * N), s = i % N, f = (k * HAND * N) % 1, sp = lay.seats[s];
        const tx = rel(s) === 0 ? w / 2 - pw / 2 : sp.px + lay.PW / 2 - pw / 2, ty = rel(s) === 0 ? lay.hand.top : sp.py;
        drawCard(g, null, BX.lerp(dx, tx, f), BX.lerp(dy, ty, f), pw, ph, {});
      }
    }
    // plaques + shown cards for every seat
    for (let s = 0; s < N; s++) {
      const sp = lay.seats[s], r = rel(s), n = st.hands[s].length;
      const cnt = st.ph === 'deal' ? Math.min(n, Math.floor(ui.dealT * (HAND + .99))) : n;
      if (r !== 0) U.plaque(g, sp.px, sp.py, lay.PW, lay.PH, {name: ctx.name(s), color: ctx.color(s), active: st.turn === s && st.ph !== 'deal' && st.ph !== 'over', count: cnt, role: roleOf(s), alarm: st.ph === 'play' && n > 0 && n <= 2, t: ui.t, sub: ctx.isAI(s) ? BX.LEVELS[ctx.level(s)] : ''});
      drawShown(g, lay, s);
    }
    // my info chip
    const ms = ctx.view, mine = st.hands[ms] || [];
    {
      const rr = roleOf(ms), y = lay.btnY + lay.bh / 2, sz = BX.clamp(cw * .42, 22, 34);
      let x = lay.pad + 4;
      const cnt = st.ph !== 'deal' ? mine.length + (lay.portrait ? '' : ' 张') : '';
      if (lay.portrait) {
        if (rr) U.seal(g, x + sz / 2, y - sz * .3, sz, rr[0], rr[1]);
        if (cnt !== '') D.text(g, cnt + '张', x + sz / 2, y + sz * .62, {size: 12, color: mine.length <= 2 && st.ph === 'play' ? '#ff8a6a' : '#f3e2c0', shadow: true});
      } else {
        if (rr) { U.seal(g, x + sz / 2, y, sz, rr[0], rr[1]); x += sz + 6; }
        if (cnt !== '') D.text(g, cnt, x, y, {size: BX.clamp(cw * .22, 12, 16), color: mine.length <= 2 && st.ph === 'play' ? '#ff8a6a' : '#f3e2c0', align: 'left', shadow: true});
      }
    }
    // my hand
    const raise = lay.raise, newSet = ui.newIds;
    lay.hand.rects.forEach((rc, i) => {
      const id = lay.handIds[i], sel = ui.sel.has(id);
      const y = rc.y - (sel ? raise : 0);
      drawCard(g, id, rc.x, y, rc.w, rc.h, {sel: sel ? '#e0a020' : (newSet && newSet.has(id) ? '#ffd76a' : false)});
    });
    if (st.ph === 'over') drawReveal(g, lay);
    // buttons
    ui.btns = buttons(lay);
    for (const b of ui.btns) U.btn(g, b);
    if (myTurn() && st.ph === 'play') {
      const sel = [...ui.sel], it = sel.length ? interpFor(st.turn, sel) : null;
      if (sel.length && ui.btns.length) { const b = ui.btns[ui.btns.length - 1]; D.text(g, it ? TN[it.t] : (st.last ? '大不过 / 牌型不符' : '不是有效牌型'), b.x + b.w / 2, b.y - 10, {size: BX.clamp(cw * .19, 11, 14), color: it ? '#ffe9a8' : '#ffb0a0', shadow: true}); }
      if (!st.last && st.first && !ddz && st.mustId != null && mine.includes(st.mustId)) D.text(g, '首手须含 ' + '♠♥♣♦'[face(st.mustId).s] + VN[val(st.mustId)], w / 2, lay.btnY - 12, {size: BX.clamp(cw * .2, 12, 15), color: '#ffe9a8', shadow: true});
    }
    if (myTurn() && st.ph === 'bid') D.text(g, '看牌叫分：1~3 分，叫 3 分直接当地主', w / 2, lay.btnY - 14, {size: BX.clamp(cw * .2, 12, 15), color: '#ffe9a8', shadow: true});
    // effects
    for (const e of ui.fx) {
      const a = e.k < .15 ? e.k / .15 : e.k > .75 ? (1 - e.k) / .25 : 1, sc = e.big ? 1 + (1 - Math.min(1, e.k * 4)) * .6 : 1;
      g.save(); g.globalAlpha = a; g.translate(w / 2, midY - (e.big ? 0 : e.k * 20)); g.scale(sc, sc);
      D.text(g, e.text, 0, 0, {size: e.big ? Math.min(w, h) * .13 : Math.min(w, h) * .065, color: e.color, font: 'deco', weight: 400, stroke: 'rgba(60,20,5,.85)', strokeW: e.big ? 7 : 4});
      g.restore();
    }
    g.restore();
  }
  function drawShown(g, lay, s) {
    const sp = lay.seats[s], sh = st.shown[s], {pw, ph} = lay;
    if (st.ph === 'over' && rel(s) !== 0 && st.hands[s].length) return;   // replaced by the reveal
    if (!sh) {
      if (st.turn === s && st.ph !== 'over' && st.ph !== 'deal' && rel(s) !== 0) { // thinking dots
        const t = ui.t, cy = sp.fanT + ph / 2, cx = sp.align === 'l' ? sp.fanA + 30 : sp.align === 'r' ? sp.fanA - 30 : sp.fanA;
        for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(255,230,170,${.35 + .65 * Math.max(0, Math.sin(t * 5 - i * .8))})`; D.circle(g, cx + (i - 1) * 12, cy, 4); g.fill(); }
      }
      return;
    }
    const fs = BX.clamp(pw * .32, 13, 20), cy = sp.fanT + ph / 2;
    if (sh.pass || sh.bid != null) {
      const txt = sh.pass ? (ddz ? '不出' : '要不起') : sh.bid ? sh.bid + ' 分' : '不叫';
      U.bubble(g, sp.fanA, cy, txt, fs, {align: sp.align, color: sh.bid ? '#a33022' : '#5a3a20'});
      return;
    }
    const pos = U.fanPos(sh.c.length, sp.fanA, sp.fanT, pw, ph, sp.align, sp.maxW);
    const fl = ui.fly && ui.fly.seat === s && st.shown[s] === sh ? ui.fly : null;
    sh.c.forEach((id, i) => {
      let {x, y} = pos[i], ww = pw;
      if (fl && fl.k < 1) {
        const f = fl.from[id], k = fl.k;
        const ox = f ? f.x : sp.px + lay.PW / 2 - pw / 2, oy = f ? f.y : sp.py, ow = f ? f.w : pw * .6;
        x = BX.lerp(ox, x, k); y = BX.lerp(oy, y, k); ww = BX.lerp(ow, pw, k);
      }
      drawCard(g, id, x, y, ww, ww * 1.4, {});
    });
    if (sh.t && !['single', 'pair'].includes(sh.t) && (!fl || fl.k >= 1)) {
      const p0 = pos[0], last = pos[pos.length - 1];
      D.text(g, TN[sh.t], (p0.x + last.x + pw) / 2, last.y + ph + 9, {size: BX.clamp(pw * .26, 11, 14), color: '#ffe2a0', shadow: true});
    }
  }
  function drawReveal(g, lay) {
    const {pw, ph} = lay;
    for (let s = 0; s < N; s++) {
      if (rel(s) === 0 || !st.hands[s].length) continue;
      const sp = lay.seats[s], pos = U.fanPos(st.hands[s].length, sp.fanA, sp.fanT, pw * .85, ph * .85, sp.align, sp.maxW);
      st.hands[s].forEach((id, i) => drawCard(g, id, pos[i].x, pos[i].y, pw * .85, ph * .85, {}));
    }
    const r = st.res; if (!r) return;
    const txt = ddz ? (r.lw ? '地主胜' : '农民胜') + (r.spring ? ' · 春天' : r.anti ? ' · 反春' : '') : ctx.name(r.w) + ' 出完';
    U.bubble(g, lay.w / 2, lay.portrait ? lay.h * .42 : (lay.seats[ctx.view].fanT - 26), txt, BX.clamp(lay.cw * .3, 15, 24), {bg: 'rgba(178,58,43,.95)', color: '#fff3e0'});
  }
  /* ---------- instance ---------- */
  deal();
  const inst = {
    st,
    toMove: () => (st.ph === 'bid' || st.ph === 'play') ? st.turn : null,
    sysMove: () => st.ph === 'deal' ? {a: {t: 'go'}, delay: 1500} : null,
    valid(a, by) {
      if (by !== st.turn) return false;
      if (a.t === 'bid') return st.ph === 'bid' && Number.isInteger(a.v) && a.v >= 0 && a.v <= 3 && (a.v === 0 || a.v > st.bidMax);
      if (st.ph !== 'play') return false;
      if (a.t === 'pass') return canPass(by);
      if (a.t === 'play') return !!interpFor(by, a.c);
      return false;
    },
    apply, aiMove, onTurn: status,
    onView() { ui.sel.clear(); ui.hintList = null; },
    key(e) {
      if (!myTurn() || st.ph !== 'play') return;
      const b = ui.btns;
      if (e.code === 'Enter') { const p = b.find(x => x.label === '出牌'); if (p && !p.dis) press(p); }
      else if (e.code === 'Space' || e.code === 'KeyP') { const p = b.find(x => x.act && x.act.t === 'pass'); if (p && !p.dis) press(p); }
      else if (e.code === 'KeyH') doHint();
    },
    frame,
  };
  return inst;
};

/* lobby icon helper: fan of cards on felt */
L.iconFan = (g, w, h, felt, ids, extra) => {
  D.iconBase(g, w, h, felt);
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .7); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const cw = h * .42, chh = cw * 1.4, n = ids.length;
  for (let i = 0; i < n; i++) {
    const a = (i - (n - 1) / 2) * .2;
    g.save(); g.translate(w / 2 + (i - (n - 1) / 2) * cw * .32, h * .92); g.rotate(a);
    D.card(g, -cw / 2, -chh - h * .1, cw, chh, ids[i] == null ? null : face(ids[i]), {});
    g.restore();
  }
  if (extra) extra(g, w, h);
};
