/* ================= 2D view: canvas, camera, world<->screen, draw queue, day/night lighting ================= */
const V = { ox: 0, oz: 0, cv: null, g: null, sg: null, lo: null, W: 1, H: 1, dpr: 1, PPM: 20, SC: 2, zoom: 1, cx: 0, cz: 0, shake: 0, sx: 0, sy: 0, light: null, lightCv: null, t: 0 };
/* pixel pipeline: the world is drawn 1:1 into a small canvas (V.lo, V.W×V.H art pixels, 20 px per metre) and
   blown up with nearest-neighbour by an integer factor V.SC (device px per art px) onto the screen canvas. */
function initView() {
  const cv = document.createElement('canvas'); document.getElementById('gl').appendChild(cv); V.cv = cv; V.sg = cv.getContext('2d');
  V.lo = document.createElement('canvas'); V.lightCv = document.createElement('canvas'); V.lg = V.lightCv.getContext('2d');
  addEventListener('resize', resizeView); resizeView();
}
function resizeView() { V.dpr = Math.min(devicePixelRatio || 1, 3); V.cv.width = Math.round(innerWidth * V.dpr); V.cv.height = Math.round(innerHeight * V.dpr); V.cv.style.width = innerWidth + 'px'; V.cv.style.height = innerHeight + 'px'; V.scKey = null; fitLow(); }
function baseSC() { return Math.max(1, Math.round(V.cv.height / 340)); }
function fitLow() {
  const sc = Math.max(1, Math.round(baseSC() * V.zoom)), key = sc + 'x' + V.cv.width + 'x' + V.cv.height; if (key === V.scKey) return; V.scKey = key; V.SC = sc;
  V.W = Math.ceil(V.cv.width / sc); V.H = Math.ceil(V.cv.height / sc); V.lo.width = V.W; V.lo.height = V.H; V.g = V.lo.getContext('2d'); V.g.imageSmoothingEnabled = false;
  V.lightCv.width = Math.ceil(V.W / 2); V.lightCv.height = Math.ceil(V.H / 2);
}
function blitLow() { const g = V.sg; g.imageSmoothingEnabled = false; g.drawImage(V.lo, 0, 0, V.W * V.SC, V.H * V.SC); }
const R3 = { get W() { return innerWidth; }, get H() { return innerHeight; } }; // UI code reads R3.W/H (CSS px)
const CSSPX = () => V.SC / V.dpr; // CSS px per art px
function k() { return V.PPM; }
function elevS(y) { return y < 3 ? y : 3 + (y - 3) * 0.4; } // tall heights are compressed so flyers stay on screen
function camSnap() { const K = V.PPM; V.ox = Math.round(V.cx * K - V.W / 2 - V.sx); V.oz = Math.round(V.cz * K - V.H / 2 - V.sy); }
function w2s(x, z, y = 0) { const K = V.PPM; return [Math.round(x * K) - V.ox, Math.round(z * K) - V.oz - Math.round(elevS(y) * K)]; }
function a2w(ax, ay) { const K = V.PPM; return [(ax + V.ox) / K, (ay + V.oz) / K]; }
function s2w(cx, cy) { const f = CSSPX(); return a2w(cx / f, cy / f); } // from CSS pixels (mouse)
function onScreen(x, z, m = 4) { const K = V.PPM, hw = V.W / 2 / K + m, hh = V.H / 2 / K + m; return Math.abs(x - V.cx) < hw && Math.abs(z - V.cz) < hh + m; }
/* ---------- draw queue: everything with a depth (world z) is sorted before drawing ---------- */
const DQ = [];
function queue(z, fn, layer = 1) { DQ.push({ z, fn, layer }); }
function flushQueue(g) { DQ.sort((a, b) => a.layer - b.layer || a.z - b.z); for (const d of DQ) d.fn(g); DQ.length = 0; }
/* ---------- offscreen cache helper ---------- */
function cnv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
const TEX = {}, MAT = {}, GEO = {};
/* ---------- time of day: a colour wash + darkness with light holes ---------- */
const LIGHTS = {
  day: { wash: [255, 250, 240, 0], dark: 0, sat: 1 },
  dawn: { wash: [255, 190, 150, 0.16], dark: 0.12, sat: 1 },
  dusk: { wash: [255, 140, 90, 0.2], dark: 0.22, sat: 1 },
  night: { wash: [50, 70, 150, 0.3], dark: 0.46, sat: 0.8 },
  storm: { wash: [90, 100, 120, 0.25], dark: 0.3, sat: 0.7 },
  mist: { wash: [230, 235, 230, 0.25], dark: 0.05, sat: 0.8 },
  ash: { wash: [180, 120, 80, 0.22], dark: 0.15, sat: 0.8 },
  realm: { wash: [120, 80, 200, 0.25], dark: 0.3, sat: 1 },
};
let LTGT = LIGHTS.day; const LCUR = { wash: [255, 250, 240, 0], dark: 0 };
function setLight(name, instant) { LTGT = LIGHTS[name] || LIGHTS.day; if (instant) { LCUR.wash = LTGT.wash.slice(); LCUR.dark = LTGT.dark; } }
function updateLight(dt) { const t = Math.min(1, dt * 1.2); for (let i = 0; i < 4; i++) LCUR.wash[i] = lerp(LCUR.wash[i], LTGT.wash[i], t); LCUR.dark = lerp(LCUR.dark, LTGT.dark, t); }
const LAMPS = []; // {x,z,r,col,k}
function drawLighting(g) {
  const w = LCUR.wash; if (w[3] > 0.01) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(${w[0] | 0},${w[1] | 0},${w[2] | 0},${w[3] * 2.2})`; g.fillRect(0, 0, V.W, V.H); g.restore(); }
  if (LCUR.dark > 0.02) {
    const L = V.lg, lw = V.lightCv.width, lh = V.lightCv.height, sc = lw / V.W; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, lw, lh); L.fillStyle = `rgba(8,10,28,${LCUR.dark})`; L.fillRect(0, 0, lw, lh); L.globalCompositeOperation = 'destination-out';
    for (const lp of LAMPS) { const [sx, sy] = w2s(lp.x, lp.z); const r = lp.r * k() * sc; const gr = L.createRadialGradient(sx * sc, sy * sc, 0, sx * sc, sy * sc, r); gr.addColorStop(0, `rgba(0,0,0,${lp.k ?? 1})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.beginPath(); L.arc(sx * sc, sy * sc, r, 0, TAU); L.fill(); }
    g.drawImage(V.lightCv, 0, 0, V.W, V.H);
    g.save(); g.globalCompositeOperation = 'lighter'; for (const lp of LAMPS) { if (!lp.col) continue; const [sx, sy] = w2s(lp.x, lp.z); const r = lp.r * k() * 0.7; const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, lp.col.replace('A', String(0.22 * LCUR.dark * 2))); gr.addColorStop(1, lp.col.replace('A', '0')); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill(); } g.restore();
  }
  // soft vignette
  const vg = g.createRadialGradient(V.W / 2, V.H * 0.48, Math.min(V.W, V.H) * 0.45, V.W / 2, V.H / 2, Math.max(V.W, V.H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,18,8,0.28)'); g.fillStyle = vg; g.fillRect(0, 0, V.W, V.H);
}
function shake(s) { if (SET.shake) V.shake = Math.max(V.shake, s); }
