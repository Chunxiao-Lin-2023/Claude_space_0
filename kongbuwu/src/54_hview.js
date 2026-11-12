/* ================= 鬼屋地图：画面、界面、操作 ================= */
Object.assign(SPR, {
  hbush(g, e, t, R) { R(0, 3, 16, 13, '#1a2a18'); R(1, 1, 7, 8, '#22361f'); R(7, 0, 8, 9, '#1e321c'); R(2, 6, 12, 8, '#2a4426'); R(4, 4, 2, 2, '#35552f'); R(10, 3, 2, 2, '#35552f'); if (e.open) { R(5, 8, 1, 1, '#e8e0c8'); R(9, 8, 1, 1, '#e8e0c8'); } },
  urinal(g, e, t, R) { R(4, -4, 8, 14, '#d8dcd8'); R(5, -2, 6, 9, '#b8bcb8'); R(7, 9, 2, 3, '#888'); },
  bucket(g, e, t, R) { R(4, 6, 8, 9, '#4a6a8a'); R(4, 6, 8, 1, '#6a8aaa'); R(5, 8, 6, 1, '#3a5a7a'); R(3, 4, 10, 1, '#777'); }
});
const HF = { dmg: '#ffd27a', crit: '#ff6a4a', bad: '#ff8a8a', txt: '#d8d0c0', staff: '#c8a8ff', sys: '#9cc' };
function hLog(H, s, cls) { H.log.push({ s, cls: cls || '', t: H.t }); if (H.log.length > 40) H.log.shift(); }
function hFloat(H, x, y, s, k) { if (H.txt.length > 24) H.txt.shift(); H.txt.push({ x, y, s, k: k || 'txt', t0: H.t }); }
function hBub(H, v, s, dur, big) { v.bub = { s, until: H.t + (dur || 2), big }; }
function hFx(H, k, x, y, sk) { H.fx.push({ k, x, y, sk, t0: H.t }); if (k === 'light') H.black = .9; }

/* ---------- 尺寸 ---------- */
function hsSize() { const H = HS, cv = $('#hcv'), wr = $('#hsw'); if (!H || !cv || !wr) return; const W = wr.clientWidth || 360, Hh = wr.clientHeight || 520;
  if (H.phase === 'setup' || H.done) { cv.width = H.M.w * 16; cv.height = H.M.h * 16; H.z = 0; }
  else { const z = clamp(Math.floor(Math.min(W / (16 * 15), Hh / (16 * 9.5))), 2, 4); cv.width = Math.ceil(W / z); cv.height = Math.ceil(Hh / z); H.z = z; }
  H.cam = H.cam || { x: 0, y: 0 }; hsCam(H, true); }
function hsCam(H, snap) { const cv = $('#hcv'); if (!cv) return; const M = H.M; if (!H.z) { H.cam.x = 0; H.cam.y = 0; return; } const f = H.mode === 'chase' || !H.focus ? H.hero : H.focus;
  let tx = f.x * 16 + 8 - cv.width / 2, ty = f.y * 16 - cv.height / 2 + 4; const mw = M.w * 16, mh = M.h * 16; tx = mw <= cv.width ? (mw - cv.width) / 2 : clamp(tx, 0, mw - cv.width); ty = mh <= cv.height ? (mh - cv.height) / 2 : clamp(ty, 0, mh - cv.height);
  if (snap) { H.cam.x = tx; H.cam.y = ty; } else { const k = Math.min(1, H.dt * 8); H.cam.x += (tx - H.cam.x) * k; H.cam.y += (ty - H.cam.y) * k; } }
/* 屏幕坐标 → 地图坐标（格） */
function hsPt(H, ev) { const cv = $('#hcv'), r = cv.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * s) / 2, oy = (r.height - cv.height * s) / 2;
  return [((ev.clientX - r.left - ox) / s + H.cam.x) / 16 - .5, ((ev.clientY - r.top - oy) / s + H.cam.y) / 16 - .5]; }
function hsToCss(H, x, y) { const cv = $('#hcv'), wr = $('#hsw'), r = cv.getBoundingClientRect(), rw = wr.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * s) / 2 + r.left - rw.left, oy = (r.height - cv.height * s) / 2 + r.top - rw.top;
  return [(x * 16 + 8 - H.cam.x) * s + ox, (y * 16 - H.cam.y) * s + oy, s]; }

/* ---------- 画面 ---------- */
function hsMapCache(M) { if (M.cache) return M.cache; const c = M.cache = mk(M.w * 16, M.h * 16), g = c.getContext('2d'); const D = M.D, st = Object.assign({}, WALLSTYLE[D.wall] || WALLSTYLE.paper, D.wallC || {}), opts = D.tileOpts || {};
  const isW = (x, y) => x < 0 || y < 0 || x >= M.w || y >= M.h || M.t[y * M.w + x] === 'wall' || M.t[y * M.w + x] === 'void';
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { const R = (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x * 16 + Math.floor(a), y * 16 + Math.floor(b), Math.ceil(w), Math.ceil(h)); }; const n = M.t[y * M.w + x];
    if (n === 'wall') paintWall(R, x, y, !isW(x, y + 1), st, isW); else if (TILE[n]) TILE[n].paint(R, x, y, opts); else R(0, 0, 16, 16, '#000');
    if (M.sec[y * M.w + x]) { R(0, 0, 16, 16, 'rgba(10,6,6,.55)'); R(3, 2, 10, 12, 'rgba(0,0,0,.5)'); } }
  for (const e of M.ents) if (e.flat || e.wall) hsSpr(g, e, 0, 0, 0); return c; }
function hsSpr(g, e, ox, oy, t) { const fn = SPR[e.spr]; if (!fn) return; const x = Math.round(e.x * 16 - ox), y = Math.round(e.y * 16 - oy); fn(g, e, t, (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x + Math.floor(a), y + Math.floor(b), Math.ceil(w), Math.ceil(h)); }); }
function hsPerson(g, P, x, y, dir, fr, alpha) { const s = personSprite(P, dir, fr), tl = P.tall || 1, h = Math.round(24 * tl); g.globalAlpha = alpha ?? 1; g.drawImage(stTint(s, P.sil), Math.round(x), Math.round(y + 16 - h), 16, h); g.globalAlpha = 1; }
const HLC = mk(8, 8);
function hsDraw(H) { const cv = $('#hcv'); if (!cv) return; const g = cv.getContext('2d'), M = H.M, t = H.t, W = cv.width, Hh = cv.height; g.imageSmoothingEnabled = false;
  let sx = 0, sy = 0; if (H.shake > 0) { sx = (rnd() - .5) * 6 * H.shake * 4; sy = (rnd() - .5) * 4 * H.shake * 4; } const ox = Math.round(H.cam.x + sx), oy = Math.round(H.cam.y + sy);
  g.fillStyle = '#050405'; g.fillRect(0, 0, W, Hh); g.drawImage(hsMapCache(M), -ox, -oy);
  const setup = H.phase === 'setup';
  /* 机关位 */
  for (const s of M.slots) { const x = s.x * 16 - ox, y = s.y * 16 - oy; if (setup) { const k = (H.lay && H.lay.slots[s.i]) || ''; g.strokeStyle = k ? '#e8b04a' : 'rgba(232,200,120,.55)'; g.setLineDash([2, 2]); g.beginPath(); g.arc(x + 8, y + 8, 7, 0, 7); g.stroke(); g.setLineDash([]); if (k) hsSpr(g, { spr: DEV_SPR[k][0], x: s.x, y: s.y, off: 1 }, ox, oy, t); }
    else if (s.k) { if (s.fx > 0 && s.k === 'jump') hsSpr(g, { spr: 'closet', x: s.x, y: s.y, open: 1 }, ox, oy, t); else hsSpr(g, { spr: DEV_SPR[s.k][0], x: s.x, y: s.y, off: s.cd > 0 ? 1 : 0, power: s.k === 'friday' ? 'static' : 0, lit: 1 }, ox, oy, t); } }
  if (setup) for (const s of M.staff) { const k = H.lay && H.lay.staff[s.i]; const x = s.x * 16 - ox, y = s.y * 16 - oy; g.strokeStyle = k ? '#b090ff' : 'rgba(180,150,255,.5)'; g.setLineDash([2, 2]); g.strokeRect(x + 2.5, y - 5.5, 11, 20); g.setLineDash([]); if (k) hsPerson(g, pplOf(PETS[k].n === '殷小小' ? '小小' : PETS[k].n), x, y, 0, 0, .9); }
  if (H.tags) for (const tg of H.tags) { const x = tg[0] * 16 - ox, y = tg[1] * 16 - oy; g.fillStyle = '#d8d0b0'; g.fillRect(x + 5, y + 6, 6, 4); g.fillStyle = '#2a4a8a'; g.fillRect(x + 5, y + 6, 6, 1); }
  if (H.item && !H.item.got) { const x = H.item.x * 16 - ox, y = H.item.y * 16 - oy, b = Math.sin(t * 5) * 1.5; hsSpr(g, { spr: 'sparkle', x: H.item.x, y: H.item.y - .1 + b / 16 }, ox, oy, t); g.fillStyle = '#f0d890'; g.fillRect(x + 6, y + 5 + b, 4, 5); }
  /* 按 y 排序：摆设、游客、员工、陈歌、追的东西 */
  const L = []; for (const e of M.ents) if (!e.flat && !e.wall) L.push([e.y + e.h - 1, 0, e]);
  if (!setup) { for (const v of H.vis) if (v.st !== 'wait' && v.st !== 'gone') { L.push([v.y, 1, v]); v.fol.forEach(f => { const tr = v.ftrail[f.lag] || v.ftrail[v.ftrail.length - 1]; if (tr) L.push([tr[1] - .01, 3, { f, tr, v }]); }); }
    for (const s of H.staff) L.push([s.y, 2, s]); L.push([H.hero.y + .01, 4, H.hero]); if (H.boss) L.push([H.boss.y, 5, H.boss]); }
  L.sort((a, b) => a[0] - b[0]);
  for (const [, k, o] of L) {
    if (k === 0) { if (o.hide && H.hero.hidden && H.hero.tx === o.x && H.hero.ty === o.y && !setup) { hsSpr(g, Object.assign({}, o, { open: (t * 2 % 3) < .4 }), ox, oy, t); const x = o.x * 16 - ox, y = o.y * 16 - oy; g.fillStyle = '#e8e0c8'; g.fillRect(x + 5, y - 2, 1, 1); g.fillRect(x + 9, y - 2, 1, 1); } else hsSpr(g, o, ox, oy, t); }
    else if (k === 1) { const fl = o.st === 'flee'; hsPerson(g, o.P, o.x * 16 - ox, o.y * 16 - oy - (fl && Math.floor(t * 10) % 2 ? 1 : 0), o.dir, o.mv ? o.fr : 0); }
    else if (k === 3) hsPerson(g, o.f.P, o.tr[0] * 16 - ox + 3, o.tr[1] * 16 - oy + 1, o.tr[2], o.tr[3], .95);
    else if (k === 2) { const pop = o.pop > 0; hsPerson(g, o.P, o.x * 16 - ox, o.y * 16 - oy, pop ? (o.px < o.home[0] ? 1 : o.px > o.home[0] ? 2 : 0) : 0, 0, o.off ? .15 : pop ? 1 : .42); }
    else if (k === 4) { if (!o.hidden) hsPerson(g, o.P, o.x * 16 - ox, o.y * 16 - oy, o.dir, o.mv ? o.fr : 0); }
    else if (k === 5) hsPerson(g, o.P, o.x * 16 - ox + (o.hunt ? (rnd() - .5) * 1.5 : 0), o.y * 16 - oy, o.dir, o.mv ? o.fr : 0, o.ghost ? .88 : 1); }
  /* 黑暗 */ if (!setup) hsDark(H, g, ox, oy);
  else { g.fillStyle = 'rgba(5,4,8,.28)'; g.fillRect(0, 0, W, Hh); }
  /* 黑暗之上：机关圈、胆量条、气泡标记 */
  if (!setup) {
    if (H.mode === 'house') for (const s of M.slots) { if (!s.k) continue; const x = s.x * 16 + 8 - ox, y = s.y * 16 + 8 - oy, inr = hDevInRange(H, s), rdy = hDevReady(H, s), tg = rdy && inr && hDevTargets(H, s).length;
      if (tg) { const p = .6 + Math.sin(t * 9) * .4; g.strokeStyle = `rgba(255,70,50,${p})`; g.lineWidth = 1; g.beginPath(); g.arc(x, y, (HB.zone + .5) * 16, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,60,40,.12)'; g.fill(); }
      else if (inr) { g.strokeStyle = rdy ? 'rgba(232,176,74,.55)' : 'rgba(150,150,150,.3)'; g.setLineDash([2, 3]); g.beginPath(); g.arc(x, y, (HB.zone + .5) * 16, 0, 7); g.stroke(); g.setLineDash([]); }
      g.fillStyle = rdy ? (inr ? '#e8b04a' : 'rgba(232,176,74,.5)') : '#555'; g.fillRect(x - 1, y - 12, 2, 2); if (s.cd > 0) { g.fillStyle = '#e8b04a'; g.fillRect(x - 6, y + 9, Math.round(12 * (1 - s.cd / HB.devCd)), 1); } }
    for (const v of H.vis) { if (v.st === 'wait' || v.st === 'gone') continue; const x = v.x * 16 - ox, y = v.y * 16 - oy - (v.P.tall ? 14 : 10), r = Math.max(0, v.u.hp / v.u.mhp); if (v.st !== 'flee') { g.fillStyle = '#1a0a0a'; g.fillRect(x + 1, y - 3, 14, 3); g.fillStyle = r < .3 ? '#ff5a3a' : r < .6 ? '#e8b04a' : '#9ad0a0'; g.fillRect(x + 2, y - 2, Math.ceil(12 * r), 1); if (v.u.charging || (v.u.intent && v.u.intent.charge)) { g.fillStyle = '#ff3a2a'; g.fillRect(x + 7, y - 9, 2, 4); g.fillRect(x + 7, y - 4, 2, 1); } if (v.u.picky) { g.fillStyle = '#e8b04a'; g.fillRect(x + 13, y - 6, 2, 2); } if (H.hero.chase === v) { g.strokeStyle = '#ff5a3a'; g.strokeRect(x + .5, y + 3.5, 15, 22); } } }
    if (H.hero.hidden) { const x = H.hero.x * 16 - ox, y = H.hero.y * 16 - oy; g.fillStyle = 'rgba(232,224,200,.9)'; g.fillRect(x + 5, y - 2, 1, 1); g.fillRect(x + 9, y - 2, 1, 1); }
    if (H.hero.path && !H.hero.chase) { const [px, py] = H.hero.path, x = px * 16 + 8 - ox, y = py * 16 + 8 - oy; g.strokeStyle = 'rgba(160,220,200,.6)'; g.beginPath(); g.arc(x, y, 3 + Math.sin(t * 8), 0, 7); g.stroke(); } }
  hsFxDraw(H, g, ox, oy);
  if (H.black > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(.92, H.black) * (Math.floor(t * 20) % 3 ? 1 : .6)})`; g.fillRect(0, 0, W, Hh); }
  if (H.heart > .05) { const gr = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * .25, W / 2, Hh / 2, Math.max(W, Hh) * .7); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(140,0,0,${H.heart * .55 * (.75 + Math.sin(t * 9) * .25)})`); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
  for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect((rnd() * W) | 0, (rnd() * Hh) | 0, 1, 1); } }
let HDK = null;
function hsDark(H, g, ox, oy) { const M = H.M, W = g.canvas.width, Hh = g.canvas.height; if (!HDK || HDK.width !== W || HDK.height !== Hh) HDK = mk(W, Hh); const L = HDK.getContext('2d'); L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, Hh);
  L.globalAlpha = M.D.dark; L.fillStyle = '#04030a'; L.fillRect(0, 0, W, Hh); L.globalAlpha = 1; L.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { if (r <= 0) return; const gr = L.createRadialGradient(x, y, r * .12, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.6, `rgba(0,0,0,${a * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.beginPath(); L.arc(x, y, r, 0, 7); L.fill(); };
  const warm = [], P = (o, dy) => [o.x * 16 + 8 - ox, o.y * 16 + (dy ?? 4) - oy];
  const h = H.hero; if (!h.hidden) hole(...P(h), (H.mode === 'chase' ? 3.2 : 2.3) * 16, H.mode === 'chase' ? .95 : .62); else hole(...P(h), 1.2 * 16, .35);
  for (const e of M.ents) if (e.light) { const fl = 1 + Math.sin(H.t * 11 + e.x) * .05 + (rnd() < .015 ? -.35 : 0); const [x, y] = P(e, 6); hole(x, y, e.light[0] * 16 * fl, .9); warm.push([x, y, e.light[0] * 16, e.light[1]]); }
  for (const v of H.vis) { if (v.st === 'wait' || v.st === 'gone' || v.u.st.dark) continue; const [x, y] = P(v); hole(x, y, v.light * 16, .85); if (v.light > 2) { const [dx, dy] = HD[v.dir]; hole(x + dx * 30, y + dy * 30, 2.4 * 16, .7); } }
  for (const s of M.slots) if (s.fx > 0) { const [x, y] = P(s, 8); hole(x, y, 3 * 16 * s.fx, .9); warm.push([x, y, 3 * 16 * s.fx, 'rgba(255,40,30,.3)']); }
  for (const s of H.staff) if (s.pop > 0) { const [x, y] = P(s); hole(x, y, 2 * 16, .7); }
  if (H.boss) { const [x, y] = P(H.boss); hole(x, y, 1.2 * 16, .5); warm.push([x, y, 2 * 16, 'rgba(160,0,0,.25)']); }
  if (H.item && !H.item.got) { const [x, y] = P(H.item, 8); hole(x, y, 1.6 * 16, .8); warm.push([x, y, 1.6 * 16, 'rgba(255,230,140,.2)']); }
  L.globalCompositeOperation = 'source-over'; g.drawImage(HDK, 0, 0);
  if (warm.length) { g.globalCompositeOperation = 'lighter'; for (const [x, y, r, col] of warm) { const gr = g.createRadialGradient(x, y, 0, x, y, r * .8); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * .8, 0, 7); g.fill(); } g.globalCompositeOperation = 'source-over'; } }
/* 机关和员工的像素动画 */
const HGHOST = { jump: P_({ sil: '#5a0606', hs: 'long', cover: 1, redEye: 1, dress: 1, top: '#700', ghost: 1 }), doll: P_({ skin: '#e8e4dc', hair: '#141214', hs: 'bob', top: '#c8c0b0', dress: 1, mask: 1, ghost: 1 }) };
function hsFxDraw(H, g, ox, oy) { for (let i = H.fx.length - 1; i >= 0; i--) { const f = H.fx[i], a = (H.t - f.t0) / .9; if (a >= 1) { H.fx.splice(i, 1); continue; } const x = f.x * 16 + 8 - ox, y = f.y * 16 + 8 - oy;
    if (f.k === 'jump' || f.k === 'pounce' && f.sk === 'jump') { const k = 1.2 + Math.min(1, a * 4) * .8, P = HGHOST.jump; g.fillStyle = `rgba(120,0,0,${(1 - a) * .35})`; g.fillRect(x - 40, y - 40, 80, 80); g.globalAlpha = 1 - a * .6; g.drawImage(personSprite(P, 0, 0), 0, 0, 16, 14, Math.round(x - 8 * k * 1.6), Math.round(y - 26 * k + (1 - a) * 6), Math.round(16 * k * 1.6), Math.round(14 * k * 1.6)); g.globalAlpha = 1; }
    else if (f.k === 'sound') { for (let r = 0; r < 3; r++) { const rr = ((a * 3 + r) % 3) / 3; g.strokeStyle = `rgba(200,160,255,${(1 - rr) * .7})`; g.beginPath(); g.arc(x, y, 4 + rr * 40, 0, 7); g.stroke(); } }
    else if (f.k === 'doll') { const P = HGHOST.doll, k = 1 + Math.min(1, a * 3) * .7; g.globalAlpha = 1 - a * .5; g.drawImage(personSprite(P, a > .5 ? 2 : 0, 0), Math.round(x - 8 * k), Math.round(y - 26 * k), Math.round(16 * k), Math.round(24 * k)); g.globalAlpha = 1; }
    else if (f.k === 'story') { g.fillStyle = `rgba(160,200,180,${(1 - a) * .5})`; for (let j = 0; j < 6; j++) { const an = j + a * 3; g.fillRect(Math.round(x + Math.cos(an) * (8 + a * 22)), Math.round(y + Math.sin(an) * (6 + a * 14)), 2, 2); } }
    else if (f.k === 'chase' || f.k === 'pounce') { g.strokeStyle = `rgba(255,60,40,${1 - a})`; for (let j = 0; j < 5; j++) { const yy = y - 10 + j * 5; g.beginPath(); g.moveTo(x - 16 - a * 10, yy); g.lineTo(x - 4, yy); g.stroke(); } g.fillStyle = `rgba(255,80,60,${(1 - a) * .5})`; g.fillRect(x - 3, y - 14, 6, 6); }
    else if (f.k === 'staff') { g.fillStyle = `rgba(190,150,255,${(1 - a) * .6})`; for (let j = 0; j < 8; j++) { const an = j / 8 * 6.28; g.fillRect(Math.round(x + Math.cos(an) * a * 18), Math.round(y - 6 + Math.sin(an) * a * 14), 2, 2); } }
    else if (f.k === 'light') { g.fillStyle = `rgba(255,255,255,${a < .1 ? .7 : 0})`; g.fillRect(0, 0, g.canvas.width, g.canvas.height); } } }

/* ---------- 文字层（飘字、气泡） ---------- */
function hsTextLayer(H) { const el = $('#hsfx'); if (!el) return; let h = ''; const now = H.t;
  for (const f of H.txt) { const a = (now - f.t0) / 1.3; if (a >= 1) continue; const [x, y] = hsToCss(H, f.x, f.y - a * .8); h += '<span class="hf ' + f.k + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px;opacity:' + (1 - a * a).toFixed(2) + '">' + esc(f.s) + '</span>'; }
  H.txt = H.txt.filter(f => now - f.t0 < 1.3);
  if (H.phase === 'setup' && H.lay) { for (const s of H.M.slots) { const k = H.lay.slots[s.i], [x, y] = hsToCss(H, s.x, s.y + .5); h += '<span class="hl' + (k ? ' on' : '') + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + (k ? SKILLS[k].ic : '') + s.n + '</span>'; }
    for (const s of H.M.staff) { const k = H.lay.staff[s.i], [x, y] = hsToCss(H, s.x, s.y - .9); h += '<span class="hl st' + (k ? ' on' : '') + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + (k ? esc(PETS[k].n) : '员工') + '</span>'; }
    for (const r of H.M.rooms) { const [x, y] = hsToCss(H, (r.x0 + r.x1) / 2, r.y0 + .1); h += '<span class="hr" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + esc(r.n) + '</span>'; } }
  if (H.phase === 'live') { const bub = (o, s, big) => { const [x, y] = hsToCss(H, o.x, o.y - ((o.P && o.P.tall) ? 2.4 : 1.8)); h += '<span class="hb' + (big ? ' big' : '') + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + esc(s) + '</span>'; };
    for (const v of H.vis) if (v.bub && v.st !== 'gone' && v.st !== 'wait') bub(v, v.bub.s, v.bub.big); if (H.boss && H.boss.bub && H.boss.bub.until > now) bub(H.boss, H.boss.bub.s, 1); }
  el.innerHTML = h; }

/* ---------- 界面：布置 ---------- */
function hsSetup(H) { H.phase = 'setup'; H.lay = JSON.parse(JSON.stringify(houseLayout(H.o.scene, H.M))); hsSize(); hsSetupHtml(H); H.last = performance.now(); cancelAnimationFrame(H.raf); H.raf = requestAnimationFrame(hsFrame); }
function hsSetupHtml(H) { const B = H.B, el = $('#hsset'), devN = Object.values(H.lay.slots).filter(Boolean).length, stN = Object.values(H.lay.staff).filter(Boolean).length;
  const vis = B.foes.map(f => { const cd = C.codex[f.id] || { wk: [] }; return '<span class="hv">' + esc(f.n) + (f.trait ? '<small>' + esc(TRAITS[f.trait].split('：')[0]) + '</small>' : '') + (cd.wk.length ? '<small class="wk">怕' + cd.wk.map(w => EL[w]).join('、') + '</small>' : '<small>弱点未知</small>') + (f.picky ? '<small class="pk">最怕' + EL[f.picky] + '</small>' : '') + '</span>'; }).join('');
  const P = scenePas(H.o.scene);
  el.innerHTML = '<div class="hs-st"><b>' + esc(H.M.D.n) + '</b> · ' + (H.o.ppl || B.foes.length) + ' 位游客<div class="hvs">' + vis + '</div>' + (P.t ? '<div class="hs-rule">场景：' + esc(P.t) + '</div>' : '') + (H.rule ? '<div class="hs-rule red">💡 ' + esc(H.rule.t) + '</div>' : '') + '</div>'
    + '<div class="hs-sb"><div class="hs-cnt">机关 ' + devN + '/' + houseMaxDev() + ' · 员工 ' + stN + '/' + Math.min(H.M.staff.length, houseStaffList().length) + '<small>点圆圈放机关，点人形框安排员工</small></div><button class="btn" onclick="hsAutoLay()">自动布置</button><button class="btn pri big" onclick="hsOpen()">开门营业</button></div><div id="hspick"></div>'; }
function hsAutoLay() { const H = HS; if (!H) return; H.lay = houseAutoLayout(H.o.scene, H.M); sfx('tap'); hsSetupHtml(H); }
function hsPickSlot(H, s, staff) { const el = $('#hspick'); if (!el) return; const cur = staff ? H.lay.staff[s.i] : H.lay.slots[s.i]; let h = '<div class="hp-h">' + (staff ? '员工位 ' + (s.i + 1) : s.n + ' 号机关位 · ' + esc((hmRoomAt(H.M, s.x, s.y) || {}).n || '')) + '<button class="x" onclick="hsPickClose()">×</button></div><div class="hp-l">';
  if (staff) { for (const k of houseStaffList()) { const used = Object.entries(H.lay.staff).find(([i, v]) => v === k && +i !== s.i); const mv = petMoves(k).filter(m => m.c === 'atk')[0]; h += '<button class="hp-i' + (cur === k ? ' on' : '') + '" onclick="hsSetPick(' + s.i + ',\'' + k + '\',1)"><b>' + esc(PETS[k].n) + '</b><small>' + (mv ? esc(mv.n) + ' · ' + (EL[mv.el] || '') : '') + (used ? ' · 从 ' + (+used[0] + 1) + ' 号位换过来' : '') + '</small></button>'; } if (!houseStaffList().length) h += '<div class="mini">还没有能在白天帮忙的员工。</div>'; }
  else { const devs = houseDevices(), lay = H.lay.slots; for (const k of devs) { const S = SKILLS[k], n = Object.entries(lay).filter(([i, v]) => v === k && +i !== s.i).length, lim = k === 'jump' ? 2 : 1; h += '<button class="hp-i' + (cur === k ? ' on' : '') + (n >= lim ? ' dim' : '') + '" onclick="hsSetPick(' + s.i + ',\'' + k + '\',0)"><b>' + S.ic + ' ' + esc(S.n) + '</b><small>' + EL[S.el] + (S.all ? ' · 范围' : ' · 单个') + (S.st ? ' · ' + ({ fear: '恐惧', vuln: '破绽', dark: '漆黑', mark: '印记' })[S.st[0]] : '') + (n >= lim ? ' · 已经放满' : '') + '</small></button>'; } }
  h += '<button class="hp-i" onclick="hsSetPick(' + s.i + ',\'\',' + (staff ? 1 : 0) + ')"><b>空着</b></button></div>'; el.innerHTML = h; el.classList.add('on'); }
function hsPickClose() { const el = $('#hspick'); if (el) el.classList.remove('on'); }
function hsSetPick(i, k, staff) { const H = HS; if (!H) return; if (staff) { for (const j in H.lay.staff) if (H.lay.staff[j] === k) delete H.lay.staff[j]; if (k) H.lay.staff[i] = k; else delete H.lay.staff[i]; }
  else { const lay = H.lay.slots; if (k) { const n = Object.entries(lay).filter(([j, v]) => v === k && +j !== i).length; if (n >= (k === 'jump' ? 2 : 1)) { const j = Object.keys(lay).find(q => lay[q] === k && +q !== i); delete lay[j]; } if (!lay[i] && Object.values(lay).filter(Boolean).length >= houseMaxDev()) { toast('最多放 ' + houseMaxDev() + ' 个机关（等级越高越多）'); return; } lay[i] = k; } else delete lay[i]; }
  sfx('tap'); hsPickClose(); hsSetupHtml(H); }
function hsOpen() { const H = HS; if (!H || H.phase !== 'setup') return; C.hh.lay[H.o.scene] = Object.assign({ v: 1, nd: houseDevices().length, mx: houseMaxDev(), ns: houseStaffList().length }, JSON.parse(JSON.stringify(H.lay))); $('#hsset').innerHTML = ''; houseStart(H); hsSize(); hsHud(H); sfx('ok'); }

/* ---------- 界面：开门以后 ---------- */
function hsHud(H) { const el = $('#hshud'); if (!el) return; const chase = H.mode === 'chase';
  el.innerHTML = '<div class="hs-top">' + (chase ? '<span class="hs-obj" id="hsobj"></span>' : '<div class="hs-atm"><i id="hsatm"></i><span id="hsatt"></span></div><span class="hs-k" id="hsk"></span>') + '<span class="hs-mp" id="hsmp"></span>' + (chase ? '' : '<button class="tb" id="hsauto" onclick="hsAuto()">🤖</button>') + '</div>'
    + '<div class="hs-room" id="hsroom"></div><canvas id="hsmm"></canvas><div class="hs-tick" id="hstick"></div>'
    + '<div class="hs-bot">' + (chase ? '<button class="btn" onclick="hsHideNear()">躲进最近的柜子</button>' : '<div class="hs-devs" id="hsdevs"></div>' + (tapeReady() ? '<button class="btn" id="hstape" onclick="hsTape()">📼</button>' : '') + '<button class="btn pri big" id="hsgo" onclick="hsAct()">吓！</button>') + '</div>';
  const mm = $('#hsmm'); if (mm) { mm.onpointerdown = ev => { ev.stopPropagation(); const r = mm.getBoundingClientRect(); hGo(H, (ev.clientX - r.left) / r.width * H.M.w, (ev.clientY - r.top) / r.height * H.M.h); sfx('tap'); }; }
  hsHudTick(H, true); }
function hsHudTick(H, force) { H.hudT = (H.hudT || 0) - H.dt; if (H.hudT > 0 && !force) return; H.hudT = .12; const B = H.B, h = H.hero;
  const room = hmRoomAt(H.M, h.x, h.y); const rm = $('#hsroom'); if (rm) rm.textContent = (room ? room.n : '') + (h.hidden ? ' · 躲着' : '');
  const mp = $('#hsmp'); if (mp) mp.textContent = '精神 ' + Math.max(0, Math.round(C.mp));
  const tk = $('#hstick'); if (tk) { const l = H.log[H.log.length - 1]; tk.textContent = l && H.t - l.t < 6 ? l.s : ''; tk.className = 'hs-tick ' + (l ? l.cls : ''); }
  if (H.mode === 'chase') { const o = $('#hsobj'); if (o) o.textContent = H.item && !H.item.got ? '找到：' + H.item.n : H.o.wait ? '撑住 ' + Math.max(0, Math.ceil(H.o.wait - H.t)) + ' 秒' : '跑'; }
  else { const a = $('#hsatm'), at = $('#hsatt'); if (a) { a.style.width = Math.max(0, B.hero.hp / B.hero.mhp * 100) + '%'; at.textContent = '氛围 ' + Math.max(0, Math.round(B.hero.hp)) + '/' + B.hero.mhp; }
    const k = $('#hsk'); if (k) k.textContent = '吓退 ' + H.vis.filter(v => v.u.hp <= 0).length + '/' + H.vis.length + (H.tagGot != null ? ' · 校牌 ' + H.tagGot + '/8' : '');
    const au = $('#hsauto'); if (au) au.classList.toggle('on', H.auto);
    const dv = $('#hsdevs'); if (dv) { dv.innerHTML = H.M.slots.filter(s => s.k).map(s => { const S = SKILLS[s.k], inr = hDevInRange(H, s), rdy = hDevReady(H, s), arm = rdy && inr && hDevTargets(H, s).length; const p = s.cd > 0 ? Math.round((1 - s.cd / HB.devCd) * 100) : 100;
      return '<button class="hd' + (arm ? ' arm' : inr && rdy ? ' rdy' : '') + '" style="--p:' + p + '%" onclick="hsDev(' + s.i + ')"><b>' + S.ic + '</b><small>' + s.n + '</small></button>'; }).join(''); }
    const go = $('#hsgo'); if (go) { const a = hsActPlan(H); go.textContent = a ? a.lab : '吓！'; go.disabled = !a; go.classList.toggle('arm', !!a); } }
  hsMini(H); }
function hsMini(H) { const mm = $('#hsmm'); if (!mm || !H.minimap) return; const M = H.M, s = 3; if (mm.width !== M.w * s) { mm.width = M.w * s; mm.height = M.h * s; } const g = mm.getContext('2d'); g.clearRect(0, 0, mm.width, mm.height);
  g.fillStyle = 'rgba(10,10,14,.8)'; g.fillRect(0, 0, mm.width, mm.height); g.fillStyle = 'rgba(120,120,130,.45)'; for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (!M.hs[y * M.w + x] || M.hides.some(e => e.x === x && e.y === y)) g.fillRect(x * s, y * s, s, s);
  for (const sl of M.slots) if (sl.k) { g.fillStyle = sl.cd > 0 ? '#665' : '#e8b04a'; g.fillRect(sl.x * s, sl.y * s, s, s); }
  if (H.item && !H.item.got) { g.fillStyle = '#f0e090'; g.fillRect(H.item.x * s - 1, H.item.y * s - 1, s + 2, s + 2); }
  for (const v of H.vis) if (v.st !== 'wait' && v.st !== 'gone') { g.fillStyle = v.st === 'flee' ? '#888' : '#ff5a3a'; g.fillRect(Math.round(v.x * s), Math.round(v.y * s), s, s); }
  if (H.boss && (H.boss.hunt || hDist(H.boss, H.hero) < 6)) { g.fillStyle = '#ff2020'; g.fillRect(Math.round(H.boss.x * s) - 1, Math.round(H.boss.y * s) - 1, s + 2, s + 2); }
  g.fillStyle = '#fff'; g.fillRect(Math.round(H.hero.x * s), Math.round(H.hero.y * s), s, s); }
/* 「吓！」按钮现在会做什么 */
function hsActPlan(H) { const h = H.hero, ac = hActive(H); const near = ac.filter(v => hDist(v, h) <= 1.6).sort((a, b) => hDist(a, h) - hDist(b, h))[0];
  if (near && h.hidden && h.pcd <= 0) return { lab: '扑出去！', f: () => hPounce(H, near) };
  let best = null, bd = 9; for (const s of H.M.slots) { if (!hDevReady(H, s) || !hDevInRange(H, s)) continue; const tg = hDevTargets(H, s); if (!tg.length) continue; const d = Math.min(...tg.map(v => hDist(v, s))); if (d < bd) { bd = d; best = s; } }
  if (best) return { lab: SKILLS[best.k].ic + ' ' + best.n + ' 号' + (bd <= hPerf(best) ? ' ⭕' : ''), f: () => hTrigger(H, best) };
  if (near && h.pcd <= 0) return { lab: '扑！', f: () => hPounce(H, near) }; return null; }
function hsAct() { const H = HS; if (!H || H.phase !== 'live' || H.done) return; const a = hsActPlan(H); if (a) { a.f(); hsHudTick(H, true); } else toast('附近没有能吓的游客'); }
function hsDev(i) { const H = HS; if (!H || H.phase !== 'live') return; const s = H.M.slots[i]; if (!s) return; if (hDevInRange(H, s) && hDevReady(H, s) && hDevTargets(H, s).length) { hTrigger(H, s); hsHudTick(H, true); return; } if (!hDevInRange(H, s)) { hsGoNear(H, s); toast('走到 ' + s.n + ' 号机关旁边'); } else hTrigger(H, s); }
function hsGoNear(H, s) { const l = hLurk(H, s); if (l) hGo(H, l[0], l[1]); else hGo(H, s.x, s.y); }
/* 磁带：一天一次，里面所有游客恐惧 + 破绽 */
function hsTape() { const H = HS; if (!H || H.phase !== 'live' || !tapeReady()) return; const ac = hActive(H); if (!ac.length) { toast('里面还没有游客'); return; } C.tapeDay = C.day; for (const v of ac) { addSt(H.B, v.u, 'fear', 3); addSt(H.B, v.u, 'vuln', 2); hBub(H, v, '……谁在哭？', 1.8); } hLog(H, '陈歌按下了播放键。整座鬼屋都是哭声。', 'epic'); sfx('static'); H.black = .4; const b = $('#hstape'); if (b) b.remove(); }
function hsAuto() { const H = HS; if (!H) return; H.auto = !H.auto; sfx('tap'); hsHudTick(H, true); }
function hsHideNear() { const H = HS; if (!H) return; const h = H.hero; let best = null, bd = 1e9; for (const e of H.M.hides) { const f = hmField(H.M, e.x, e.y, 'h')[h.ty * H.M.w + h.tx]; if (f >= 0 && f < bd) { bd = f; best = e; } } if (best) hGo(H, best.x, best.y); }
/* 点地图 */
function hsTap(ev) { const H = HS; if (!H) return; const [x, y] = hsPt(H, ev);
  if (H.phase === 'setup') { const s = H.M.slots.find(q => Math.hypot(q.x - x, q.y - y) < .8); if (s) return hsPickSlot(H, s, 0); const st = H.M.staff.find(q => Math.abs(q.x - x) < .7 && y > q.y - 1.5 && y < q.y + .7); if (st) return hsPickSlot(H, st, 1); hsPickClose(); return; }
  if (H.phase !== 'live' || H.done) return; H.auto = false; const h = H.hero;
  if (H.mode === 'house') { const v = hActive(H).filter(q => Math.hypot(q.x - x, q.y - .5 - y) < 1).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; if (v) { h.chase = v; h.path = null; sfx('tap'); if (hDist(v, h) <= 1.5 && h.pcd <= 0) hPounce(H, v); return; }
    const s = H.M.slots.find(q => q.k && Math.hypot(q.x - x, q.y - y) < .75); if (s) return hsDev(s.i); }
  hGo(H, x, y); sfx('tap'); }
function hsKey(e) { const H = HS; if (!H || H.phase !== 'live' || H.done) return false; const k = e.key, d = { ArrowDown: 0, s: 0, ArrowLeft: 1, a: 1, ArrowRight: 2, d: 2, ArrowUp: 3, w: 3 }[k];
  if (d != null) { const h = H.hero; hGo(H, h.tx + HD[d][0], h.ty + HD[d][1]); return true; } if (k === ' ' || k === 'Enter') { if (H.mode === 'house') hsAct(); else hsHideNear(); return true; } return false; }

/* ---------- 主循环 ---------- */
function hsFrame(now) { const H = HS; if (!H || STATE.house !== H) return; const dt = Math.min(.05, (now - (H.last || now)) / 1000); H.last = now; H.dt = dt;
  if (H.phase === 'live' && !H.done) { const sp = H.auto ? 1.5 : 1; hStep(H, dt * sp); if (H.shake > 0) H.shake -= dt; if (H.black > 0) H.black -= dt; hsCam(H); hsHudTick(H); }
  if (H.done && H.phase === 'live' && !H.fin) { H.fin = 1; hsDraw(H); hsTextLayer(H); hsFinish(H); return; }
  hsDraw(H); hsTextLayer(H); H.raf = requestAnimationFrame(hsFrame); }
function hsEndPanel(H) { const B = H.B, rw = H.rw, s = H.stats, el = $('#hsset'), k = H.scared, n = H.vis.length; $('#hshud').innerHTML = ''; $('#hsfx').innerHTML = '';
  el.innerHTML = '<div class="hs-end"><div class="c1">' + (H.res === 'win' ? '游客尖叫着跑了出去' : (H.lost || '“一点都不吓人。”')) + '</div><div class="hs-grid"><span>吓退</span><b>' + k + '/' + n + '</b><span>完美时机</span><b>' + s.perfect + '</b><span>扑人</span><b>' + s.pounce + '</b><span>被看见</span><b>' + s.exposed + '</b>' + (s.house ? '<span>全场尖叫</span><b>×' + s.house + '</b>' : '') + '</div>'
    + (rw ? '<div class="hs-rw">' + (rw.money ? '门票 +' + rw.money + ' 元　' : '') + (rw.screams ? '尖叫 +' + rw.screams + '　' : '') + '经验 +' + rw.exp + (rw.picky ? '<br>挑剔的游客被吓哭了！' : '') + '</div>' : '') + '<button class="btn pri big" onclick="hsClose()">收工</button></div>';
  if (H.auto && C.auto) setTimeout(() => { if (HS === H) hsClose(); }, 900); }
window.addEventListener('resize', () => { if (HS && STATE.house) hsSize(); });
