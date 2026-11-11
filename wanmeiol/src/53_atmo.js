/* ================= atmosphere: each region gets its own colours, a painted backdrop and drifting particles =================
   石村: warm earth and wood, willow catkins (fireflies at night) · 大荒: deep forest green, falling leaves · 补天阁: cool blue, cloud wisps
   百断山: ochre stone, blowing sand · 虚神界: violet void, rising motes · 秘境: dark stone, embers.
   One palette per region (ATMO) feeds the CSS variables, the backdrop canvases (#exbg behind 探索, #btbg behind 战斗) and the
   particle canvas #amb, which moves into whichever screen is showing. Particles stop when 动画 is off or the tab is hidden. */
const ATMO = {
  shicun: { c0: '#1a140c', c1: '#3a2a16', lab: '#c8a878', b1: '#3a2b19', b2: '#2a1f12', bd: '#6e5634', bh: '#d8b07a', tx: '#efe3cb', fl: '#c9a46a77', p: 'catkin', pn: 'firefly' },
  dahuang: { c0: '#0b140e', c1: '#1d3326', lab: '#8fae8a', b1: '#1f3326', b2: '#16261b', bd: '#3f5e47', bh: '#a8c88a', tx: '#dfe6d6', fl: '#6f9a6a66', p: 'leaf', pn: 'firefly' },
  butian: { c0: '#0d1219', c1: '#22344c', lab: '#94acc8', b1: '#1f2d40', b2: '#151f2e', bd: '#41587a', bh: '#a8c4e8', tx: '#dfe6f0', fl: '#7a9ac866', p: 'cloud', pn: 'mote' },
  baiduan: { c0: '#170f0a', c1: '#40291a', lab: '#c4a07a', b1: '#3b291a', b2: '#291c11', bd: '#704f33', bh: '#e0b888', tx: '#efdfc8', fl: '#c08a5a66', p: 'sand', pn: 'sand' },
  xushen: { c0: '#0e0c1c', c1: '#2c2856', lab: '#a4a4dc', b1: '#28244a', b2: '#1a1734', bd: '#4c4884', bh: '#c0c0ff', tx: '#e4e2f6', fl: '#8a88d866', p: 'mote', pn: 'mote' },
  shiguo: { c0: '#1a1012', c1: '#3e1e1c', lab: '#d8a878', b1: '#3a1e1a', b2: '#281412', bd: '#7a3e2a', bh: '#e8b878', tx: '#f0e2cc', fl: '#d0805a66', p: 'lantern', pn: 'lantern' },
  huoguo: { c0: '#1c0e08', c1: '#4a2010', lab: '#e8a070', b1: '#3e1c10', b2: '#2a120a', bd: '#8a4020', bh: '#ffb070', tx: '#f6e2cc', fl: '#e0703a66', p: 'ember', pn: 'ember' },
  dungeon: { c0: '#0d0a08', c1: '#2e1c10', lab: '#b0906a', b1: '#2c2620', b2: '#1d1915', bd: '#5c4e40', bh: '#e0a060', tx: '#e8dcc8', fl: '#c0703a66', p: 'ember', pn: 'ember' },
};
const atmoLoc = () => STATE.dungeon ? DUNGEONS[STATE.dungeon.id].loc : C.loc;
function atmoKey() { if (!C) return 'dahuang'; if (STATE.dungeon) return 'dungeon'; const a = (PLACES[C.loc] || {}).area; return ATMO[a] ? a : 'dahuang'; }
function atmoPal() { const k = atmoKey(), P = Object.assign({ k }, ATMO[k]), nt = isNight() && k !== 'dungeon' && k !== 'xushen';
  if (nt) { P.c0 = mixHex(P.c0, '#04060c', 0.35); P.c1 = mixHex(P.c1, '#101a30', 0.55); P.tx = mixHex(P.tx, '#c8d4ee', 0.3); } P.nt = nt; return P; }
const mixHex = (a, b, t) => '#' + hexRgb(a).map((v, i) => Math.round(v + (hexRgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const rgba = (h, a) => `rgba(${hexRgb(h).join(',')},${a})`;
UI.atmoK = ''; UI.exbgK = ''; UI.btbgK = '';
function atmoUpdate() { if (!C || STATE.mode !== 'play') return; const P = atmoPal(), b = document.body, key = P.k + P.nt;
  if (UI.atmoK !== key) { UI.atmoK = key; b.dataset.area = P.k; b.classList.toggle('night', P.nt); const s = b.style;
    for (const [v, c] of [['c0', P.c0], ['c1', P.c1], ['lab', P.lab], ['b1', P.b1], ['b2', P.b2], ['bd', P.bd], ['bh', P.bh], ['tx2', P.tx], ['fl', P.fl]]) s.setProperty('--' + v, c);
    s.setProperty('--panel', rgba(P.c0, 0.8)); s.setProperty('--panel2', rgba(P.c0, 0.6)); s.setProperty('--line', rgba(P.bh, 0.14)); s.setProperty('--bqb', rgba(P.b1, 0.93));
    ambReset(); }
  const m = curMode(), view = $({ explore: 'vExplore', talk: 'vTalk', battle: 'vBattle' }[m]);
  if (m === 'explore') atmoPaint('exbg', 'exbgK', P, false); if (m === 'battle' || STATE.battle) atmoPaint('btbg', 'btbgK', P, true);
  const a = $('amb'); if (a && view && a.parentNode !== view) view.insertBefore(a, m === 'talk' ? $('tbg').nextSibling : view.firstChild.nextSibling); ambStart(); }
function atmoPaint(id, kk, P, battle) { const cv = $(id); if (!cv) return; const W = cv.parentNode.clientWidth, H = cv.parentNode.clientHeight; if (!W || !H) return;
  const loc = atmoLoc(), nt = isNight() || !!STATE.dungeon, key = loc + W + 'x' + H + nt + P.k + (C.story.f.moved ? 'm' : ''); if (UI[kk] === key) return; UI[kk] = key;
  const dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const H2 = Math.min(H, Math.round(W * 0.78)), oy = H - H2; g.save(); g.translate(0, oy); paintScene(g, W, H2, loc, nt, true, !battle); g.restore(); // tall screens: the painting sits at the bottom, its sky stretched up
  if (oy > 0) g.drawImage(cv, 0, Math.ceil(oy * dpr) + 1, cv.width, 1, 0, 0, W, oy + 1);
  if (battle) { const r = g.createRadialGradient(W / 2, 0, 0, W / 2, 0, Math.max(W, H)); r.addColorStop(0, 'rgba(58,21,18,.62)'); r.addColorStop(0.75, 'rgba(22,9,9,.9)'); r.addColorStop(1, 'rgba(14,6,6,.95)'); g.fillStyle = r; g.fillRect(0, 0, W, H); return; }
  const l = g.createLinearGradient(0, 0, 0, H); l.addColorStop(0, rgba(P.c1, 0.45)); l.addColorStop(0.35, rgba(P.c0, 0.78)); l.addColorStop(1, rgba(P.c0, 0.93)); g.fillStyle = l; g.fillRect(0, 0, W, H);
  const v = g.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, W * 0.9); v.addColorStop(0, rgba(P.c1, 0.35)); v.addColorStop(1, rgba(P.c1, 0)); g.fillStyle = v; g.fillRect(0, 0, W, H); }

/* ---------- drifting particles ---------- */
const AMB = { ps: [], kind: '', raf: 0, last: 0, t: 0 };
function ambReset() { AMB.ps = []; AMB.kind = ''; }
function ambStart() { if (AMB.raf || !animOn()) return; AMB.raf = requestAnimationFrame(ambFrame); }
function ambSpawn(k, W, H, fresh) { const r = Math.random, p = { k, x: r() * W, y: r() * H, a: r() * TAU, s: r(), life: 0 };
  if (k === 'catkin') { p.vx = 0.25 + r() * 0.4; p.vy = 0.08 + r() * 0.15; p.rad = 1.2 + r() * 1.6; if (!fresh) p.x = -10; }
  if (k === 'leaf') { p.vx = 0.15 + r() * 0.35; p.vy = 0.35 + r() * 0.5; p.rad = 3 + r() * 2.5; p.col = ['#6f8f3a', '#8f7a35', '#a8642a', '#5f7a30'][Math.floor(r() * 4)]; if (!fresh) p.y = -10; }
  if (k === 'firefly') { p.vx = 0; p.vy = 0; p.rad = 1.6 + r(); }
  if (k === 'cloud') { p.vx = 0.08 + r() * 0.14; p.vy = 0; p.w = 120 + r() * 200; p.h = 18 + r() * 26; p.al = 0.04 + r() * 0.05; if (!fresh) p.x = -p.w; }
  if (k === 'mote') { p.vx = 0; p.vy = -(0.15 + r() * 0.35); p.rad = 1 + r() * 1.6; if (!fresh) p.y = H + 5; }
  if (k === 'sand') { p.vx = -(3 + r() * 4); p.vy = 0.3 + r() * 0.5; p.len = 8 + r() * 16; if (!fresh) p.x = W + 20; }
  if (k === 'lantern') { p.vx = 0.05 + r() * 0.1; p.vy = -(0.1 + r() * 0.18); p.rad = 2.5 + r() * 2.5; if (!fresh) p.y = H + 10; }
  if (k === 'ember') { p.vx = 0; p.vy = -(0.4 + r() * 0.7); p.rad = 1 + r() * 1.4; p.max = 200 + r() * 260; if (!fresh) p.y = H + 5; }
  return p; }
function ambFrame(ts) { AMB.raf = 0; const cv = $('amb'); if (!cv || !C || STATE.mode !== 'play' || !animOn() || document.hidden) { if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); return; }
  AMB.raf = requestAnimationFrame(ambFrame); if (ts - AMB.last < 33) return; const dt = Math.min(3, (ts - AMB.last) / 16.7 || 1); AMB.last = ts; AMB.t += dt;
  const W = cv.parentNode.clientWidth, H = cv.parentNode.clientHeight; if (!W || !H) return; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const P = atmoPal(), k = P.nt ? P.pn : P.p, n = Math.round(Math.max(10, Math.min(k === 'cloud' ? 9 : k === 'lantern' ? 14 : k === 'sand' ? 34 : k === 'firefly' ? 22 : 30, W * H / 26000)));
  if (AMB.kind !== k) { AMB.kind = k; AMB.ps = Array.from({ length: n }, () => ambSpawn(k, W, H, true)); } while (AMB.ps.length < n) AMB.ps.push(ambSpawn(k, W, H, false)); if (AMB.ps.length > n) AMB.ps.length = n;
  const g = cv.getContext('2d'); g.clearRect(0, 0, W, H); const t = AMB.t;
  for (let i = 0; i < AMB.ps.length; i++) { const p = AMB.ps[i]; p.life += dt;
    if (k === 'firefly') { p.a += (Math.random() - 0.5) * 0.35 * dt; p.x += Math.cos(p.a) * 0.35 * dt; p.y += Math.sin(p.a) * 0.25 * dt; if (p.x < 0 || p.x > W) p.a = Math.PI - p.a; if (p.y < H * 0.15 || p.y > H) p.a = -p.a;
      const al = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.03 + p.s * 9)); g.fillStyle = `rgba(214,255,140,${al * 0.16})`; g.beginPath(); g.arc(p.x, p.y, p.rad * 4, 0, TAU); g.fill(); g.fillStyle = `rgba(230,255,170,${al})`; g.beginPath(); g.arc(p.x, p.y, p.rad, 0, TAU); g.fill(); continue; }
    p.x += (p.vx + (k === 'catkin' || k === 'leaf' || k === 'mote' || k === 'ember' || k === 'lantern' ? Math.sin(t * 0.02 + p.s * 7) * (k === 'leaf' ? 0.5 : 0.25) : 0)) * dt; p.y += p.vy * dt;
    if (p.x > W + 30 || p.x < -(p.w || 30) - 30 || p.y > H + 12 || p.y < -12 || (p.max && p.life > p.max)) { AMB.ps[i] = ambSpawn(k, W, H, false); continue; }
    if (k === 'catkin') { g.fillStyle = 'rgba(255,250,235,.12)'; g.beginPath(); g.arc(p.x, p.y, p.rad * 2.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,252,240,.6)'; g.beginPath(); g.arc(p.x, p.y, p.rad, 0, TAU); g.fill(); }
    else if (k === 'leaf') { g.save(); g.translate(p.x, p.y); g.rotate(p.a + t * 0.03 * (p.s - 0.5)); g.scale(1, Math.abs(Math.sin(t * 0.04 + p.s * 5)) * 0.8 + 0.2); g.fillStyle = p.col; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(0, 0, p.rad, p.rad * 0.45, 0, 0, TAU); g.fill(); g.restore(); }
    else if (k === 'cloud') { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w / 2); gr.addColorStop(0, `rgba(235,242,255,${p.al})`); gr.addColorStop(1, 'rgba(235,242,255,0)'); g.fillStyle = gr; g.save(); g.translate(p.x, p.y); g.scale(1, p.h / p.w * 2); g.translate(-p.x, -p.y); g.beginPath(); g.arc(p.x, p.y, p.w / 2, 0, TAU); g.fill(); g.restore(); }
    else if (k === 'mote') { const al = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.04 + p.s * 11)), c = P.k === 'xushen' ? '200,190,255' : '200,225,255'; g.fillStyle = `rgba(${c},${al * 0.18})`; g.beginPath(); g.arc(p.x, p.y, p.rad * 3.5, 0, TAU); g.fill(); g.fillStyle = `rgba(${c},${al})`; g.beginPath(); g.arc(p.x, p.y, p.rad, 0, TAU); g.fill(); }
    else if (k === 'sand') { g.strokeStyle = `rgba(226,196,140,${0.12 + p.s * 0.2})`; g.lineWidth = 1 + p.s; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.len, p.y - p.len * 0.08); g.stroke(); }
    else if (k === 'lantern') { const al = 0.55 + 0.35 * Math.sin(t * 0.05 + p.s * 9); const gl = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad * 5); gl.addColorStop(0, `rgba(255,170,80,${al * 0.35})`); gl.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gl; g.fillRect(p.x - p.rad * 5, p.y - p.rad * 5, p.rad * 10, p.rad * 10); g.fillStyle = `rgba(255,${150 + Math.round(p.s * 50)},90,${al})`; g.beginPath(); g.ellipse(p.x, p.y, p.rad * 0.8, p.rad, 0, 0, TAU); g.fill(); }
    else if (k === 'ember') { const f = p.max ? 1 - p.life / p.max : 1; g.fillStyle = `rgba(255,150,60,${0.2 * f})`; g.beginPath(); g.arc(p.x, p.y, p.rad * 3, 0, TAU); g.fill(); g.fillStyle = `rgba(255,${190 + Math.round(p.s * 50)},110,${0.85 * f})`; g.beginPath(); g.arc(p.x, p.y, p.rad, 0, TAU); g.fill(); } } }
document.addEventListener('visibilitychange', () => { if (!document.hidden) ambStart(); });
