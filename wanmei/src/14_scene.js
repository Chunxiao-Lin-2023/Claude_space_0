/* ================= a tiny scene graph for 2D (keeps the story / FX code's "object with position" style) =================
   Positions are world metres (x right, z down the screen, y up). Objects are drawn in the depth-sorted queue at their world z,
   lifted by (y - ground height). draw(g, K, o) paints with origin at the object, 1 m = K px. */
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } clone() { return new V3(this.x, this.y, this.z); }
  setScalar(s) { this.x = this.y = this.z = s; return this; } multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; } addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; } distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
}
class Obj2D {
  constructor(draw, o) { this.position = new V3(); this.rotation = new V3(); this.scale = new V3(1, 1, 1); this.visible = true; this.children = []; this.parent = null; this.draw = draw || null; this.material = { opacity: 1 }; this.zoff = 0; this.layer = 1; if (o) Object.assign(this, o); }
  add(c) { if (c.parent) c.removeFromParent(); c.parent = this; this.children.push(c); return this; }
  removeFromParent() { if (this.parent) { const a = this.parent.children, i = a.indexOf(this); if (i >= 0) a.splice(i, 1); this.parent = null; } return this; }
  traverse(f) { f(this); for (const c of this.children) c.traverse(f); }
}
class PLight extends Obj2D { constructor(col, intensity = 1, distance = 6) { super(null); this.color = { set: c => { this.col = c; } }; this.col = col; this.intensity = intensity; this.distance = distance; } }
const SCENE = new Obj2D();
R3.scene = SCENE;
function sceneClear() { SCENE.children.length = 0; }
/* draw one object (and its children) with the canvas already translated to its anchor */
function drawObj(g, o, K) {
  if (!o.visible) return; const op = o.material.opacity; if (op <= 0.003) return;
  g.save(); if (op < 1) g.globalAlpha *= op; if (o.rotation.z) g.rotate(o.rotation.z); if (o.scale.x !== 1 || o.scale.y !== 1) g.scale(o.scale.x, o.scale.x);
  if (o.draw) o.draw(g, K, o);
  for (const c of o.children) { if (!c.visible) continue; g.save(); g.translate(c.position.x * K, (c.position.z - c.position.y) * K); drawObj(g, c, K); g.restore(); }
  g.restore();
}
function queueScene() {
  const K = k();
  for (const o of SCENE.children) {
    if (!o.visible || o.noDraw) continue; const p = o.position; if (!onScreen(p.x, p.z, o.cullR || 12)) continue;
    const elev = o.absY ? 0 : p.y - (o.groundY ?? terrH(p.x, p.z));
    if (o.shadow) { const r = o.shadow * K * (o.scale.x || 1); queue(p.z, g => { const [sx, sy] = w2s(p.x, p.z); const f = clamp(1 - elev * 0.12, 0.35, 1); shadowBlob(g, sx, sy, r * 1.15 * f, r * 0.42 * f, 0.26 * f); }, 0); }
    queue(p.z + (o.zoff || 0), g => { const [sx, sy] = w2s(p.x, p.z, elev); g.save(); g.translate(sx, sy); drawObj(g, o, K); g.restore(); }, o.layer ?? 1);
  }
}
/* lights: every PLight in the scene becomes a lamp hole in the night overlay */
function sceneLamps(out) {
  const walk = (o, x, y, z) => { if (!o.visible) return; x += o.position.x; y += o.position.y; z += o.position.z; if (o instanceof PLight && o.intensity > 0) { const c = rgbOf(hex(o.col)); out.push({ x, z, r: o.distance * clamp(o.intensity / 30, 0.25, 1.4), col: `rgba(${c[0]},${c[1]},${c[2]},A)`, k: clamp(o.intensity / 20, 0.2, 1) }); } for (const ch of o.children) walk(ch, x, y, z); };
  for (const o of SCENE.children) walk(o, 0, 0, 0);
}
/* ---------- screen-space direction of a world heading (rot: forward = (sin rot, cos rot) in x,z) ---------- */
const scrAng = rot => Math.atan2(Math.cos(rot), Math.sin(rot));
/* ---------- ready-made drawables used by skills, FX and the story ---------- */
function glowDot(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); const c = rgbOf(hex(col)); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.25, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.9})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function rockMesh(s = 0.6) {
  const seed = Math.random() * 1e4 | 0;
  return new Obj2D((g, K, o) => { const R = mulberry32(seed); LW = 1.4; const r = s * K; g.save(); g.rotate(o.spinA || 0); rockShape(g, 0, r * 0.4, r, r * 0.95, '#8a847a', R); g.restore(); });
}
function eggMesh(col = 0xbfffe0, glowc = 0x8affd0, s = 0.45) {
  const o = new Obj2D((g, K, ob) => { const r = s * K, gl = ob.glow ?? 0.6; glowDot(g, 0, -r * 1.1, r * 2.6, ob.glowc, 0.35 * gl + 0.1 * Math.sin(W.t * 3)); LW = 1.4; const p = new Path2D(); p.moveTo(0, -r * 2.5); p.bezierCurveTo(r * 1.15, -r * 2.4, r * 1.05, 0, 0, 0); p.bezierCurveTo(-r * 1.05, 0, -r * 1.15, -r * 2.4, 0, -r * 2.5); cel(g, p, hex(ob.col), { sx: r * 0.3, sy: 0, hl: '#ffffff', hla: 0.5 }); g.strokeStyle = rgba(mix(hex(ob.col), '#000', 0.4), 0.6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-r * 0.5, -r * 1.4); g.lineTo(-r * 0.2, -r * 1.2); g.lineTo(0.1 * r, -r * 1.45); g.lineTo(r * 0.45, -r * 1.25); g.stroke(); for (let i = 0; i < 4; i++) { g.fillStyle = rgba(mix(hex(ob.col), '#2a6a4a', 0.5), 0.5); g.beginPath(); g.ellipse((i - 1.5) * r * 0.4, -r * (0.7 + (i % 2) * 0.9), r * 0.12, r * 0.09, 0, 0, TAU); g.fill(); } });
  o.col = col; o.glowc = glowc; return o;
}
function crescentMesh(col, R = 1) { // a silver moon blade, flying along its heading
  return new Obj2D((g, K, o) => { const r = R * K, a = scrAng(o.rotation.y); g.save(); g.rotate(a); g.globalCompositeOperation = 'lighter'; glowDot(g, r * 0.2, 0, r * 1.4, col, 0.28); g.globalCompositeOperation = 'source-over'; const p = new Path2D(); p.arc(0, 0, r, -1.25, 1.25); p.arc(-r * 0.32, 0, r * 0.82, 1.15, -1.15, true); p.closePath(); g.fillStyle = hex(col); g.fill(p); g.strokeStyle = rgba(mix(hex(col), '#103050', 0.5), 0.9); g.lineWidth = 1.5; g.stroke(p); g.save(); g.scale(0.82, 0.7); g.translate(r * 0.12, 0); g.fillStyle = '#ffffff'; g.fill(p); g.restore(); g.restore(); });
}
function orbMesh(col, r = 0.3) { return new Obj2D((g, K) => { g.save(); g.globalCompositeOperation = 'lighter'; glowDot(g, 0, 0, r * K * 2.4, col, 0.9); g.restore(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r * K * 0.45, 0, TAU); g.fill(); }); }
function arrowMesh() { return new Obj2D((g, K, o) => { const a = scrAng(o.rotation.y), L = 1.3 * K; g.save(); g.rotate(a); g.translate(0, -(o.rotation.x || 0) * 0); line(g, -L / 2, 0, L / 2, 0, Math.max(1.5, 0.05 * K), '#5a4030'); g.fillStyle = '#9a9aa2'; g.beginPath(); g.moveTo(L / 2 + 0.2 * K, 0); g.lineTo(L / 2 - 0.05 * K, -0.07 * K); g.lineTo(L / 2 - 0.05 * K, 0.07 * K); g.closePath(); g.fill(); g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(-L / 2, 0); g.lineTo(-L / 2 + 0.25 * K, -0.1 * K); g.lineTo(-L / 2 + 0.25 * K, 0.1 * K); g.closePath(); g.fill(); g.restore(); }); }
function birdFX(col, s = 1) { // a spirit bird made of fire / light
  return new Obj2D((g, K, o) => { const a = scrAng(o.rotation.y), r = 0.5 * K * s, f = Math.sin(W.t * 18) * 0.4, c = hex(col), c2 = mix(c, '#fff4c0', 0.55); g.save(); g.rotate(a); g.globalCompositeOperation = 'lighter'; glowDot(g, 0, 0, r * 2, col, 0.35); g.globalCompositeOperation = 'source-over'; g.lineWidth = 1.2; g.strokeStyle = rgba(mix(c, '#200800', 0.5), 0.9);
    for (const sd of [-1, 1]) { const w = new Path2D(); w.moveTo(r * 0.2, 0); w.quadraticCurveTo(-r * 0.2, sd * r * (1.5 + f), -r * 0.8, sd * r * (1.3 + f)); w.quadraticCurveTo(-r * 0.3, sd * r * 0.4, -r * 0.2, 0); g.fillStyle = c; g.fill(w); g.stroke(w); }
    const tl = new Path2D(); tl.moveTo(-r * 0.3, 0); tl.lineTo(-r * 1.5, -r * 0.35); tl.lineTo(-r * 1.25, 0); tl.lineTo(-r * 1.5, r * 0.35); tl.closePath(); g.fillStyle = c; g.fill(tl); g.stroke(tl); const bd = new Path2D(); bd.ellipse(r * 0.12, 0, r * 0.55, r * 0.3, 0, 0, TAU); g.fillStyle = c2; g.fill(bd); g.stroke(bd); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(r * 0.25, 0, r * 0.25, r * 0.13, 0, 0, TAU); g.fill(); g.restore(); });
}
function lootMesh() { return new Obj2D((g, K, o) => { const b = Math.sin(W.t * 3) * 0.1 * K; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, 0, 0, -2.6 * K); gr.addColorStop(0, 'rgba(255,216,106,0.55)'); gr.addColorStop(1, 'rgba(255,216,106,0)'); g.fillStyle = gr; g.fillRect(-0.18 * K, -2.6 * K, 0.36 * K, 2.6 * K); glowDot(g, 0, -0.35 * K + b, 0.5 * K, 0xffd86a, 0.8); g.restore(); g.fillStyle = '#ffe08a'; g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -0.55 * K + b); g.lineTo(0.16 * K, -0.35 * K + b); g.lineTo(0, -0.15 * K + b); g.lineTo(-0.16 * K, -0.35 * K + b); g.closePath(); g.fill(); g.stroke(); }); }
function weaponMesh(kind, s = 1) { const o = new Obj2D((g, K, ob) => { const a = scrAng(ob.rotation.y); g.save(); g.rotate(a + PI / 2); const px = UM_C * K * s; g.scale(px, px); LW = 1.2 / px; drawWeapon(g, kind, 1); g.restore(); }); o.kind = kind; return o; }
