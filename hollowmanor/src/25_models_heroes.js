/* ================= the two protagonists (detailed) =================
   Sculpted heads (deformed sphere: jaw, cheeks, sockets, brow), textured irises behind blinking lids with lashes,
   five-fingered hands, strand-clump hair, layered clothing with fabric textures.
   Rig contract used by poseChar(): root, body, hips, torso, chest, head, aL/aR {sh, el, hand}, lL/lR {hp, kn, ft}, o, kind,
   plus lens/flash (holder), amulet/spiritFlame/lanternG/hairBack (seer), lids (both). */
const HM = {};
function pmat(key, o) { if (!HM[key]) HM[key] = new THREE.MeshPhysicalMaterial(o); return HM[key]; }
const ss = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const UPV = new THREE.Vector3(0, 1, 0);
/* ---------- procedural textures for clothes and eyes ---------- */
function heroTex() {
  if (TEX.denim) return;
  { const c = cnv(256, 256), g = c.getContext('2d'); g.fillStyle = '#26324e'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 2) for (let x = 0; x < 256; x += 2) { g.fillStyle = (x + y) % 8 < 4 ? 'rgba(160,180,220,.13)' : 'rgba(0,0,10,.12)'; g.fillRect(x, y, 2, 2); } for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(200,210,235,${tr(0.02, 0.08)})`; g.fillRect(texRng() * 256, texRng() * 256, tr(20, 90), tr(2, 6)); } TEX.denim = mkTex(c, 3, 3); }
  { const c = cnv(128, 128), g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128); for (let x = 0; x < 128; x += 8) for (let y = 0; y < 128; y += 8) { g.fillStyle = '#a0a0a0'; g.beginPath(); g.ellipse(x + 2, y + 4, 2.2, 4, 0.5, 0, TAU); g.ellipse(x + 6, y + 4, 2.2, 4, -0.5, 0, TAU); g.fill(); g.fillStyle = '#505050'; g.fillRect(x + 3.6, y, 0.8, 8); } TEX.knit = mkTex(c, 6, 6, false); }
  { const c = cnv(256, 256), g = c.getContext('2d'); g.fillStyle = '#1c2a24'; g.fillRect(0, 0, 256, 256); const band = (pos, w, col, a) => { g.fillStyle = col; g.globalAlpha = a; g.fillRect(pos, 0, w, 256); g.fillRect(0, pos, 256, w); g.globalAlpha = 1; }; for (const o of [0, 128]) { band(o + 10, 34, '#13203a', 0.75); band(o + 60, 12, '#2c3e34', 0.6); band(o + 92, 3, '#8a1a1a', 0.9); band(o + 100, 2, '#c8b060', 0.55); } noiseLayer(g, 256, 256, 0.05, 3000); TEX.tartan = mkTex(c, 2, 2); }
  { const c = cnv(128, 128), g = c.getContext('2d'); g.fillStyle = '#7a5a3c'; g.fillRect(0, 0, 128, 128); for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(${texRng() < 0.5 ? '40,25,10' : '160,120,80'},${tr(0.03, 0.1)})`; g.fillRect(texRng() * 128, texRng() * 128, tr(2, 8), 1); } TEX.leather = mkTex(c, 1, 1); }
  { const c = cnv(64, 64), g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 4) { g.fillStyle = y % 8 ? '#9a9a9a' : '#6a6a6a'; g.fillRect(0, y, 64, 2); } TEX.knurl = mkTex(c, 1, 4, false); }
}
function irisTex(base, ring, glow) {
  const key = 'iris' + base + ring; if (TEX[key]) return TEX[key];
  const c = cnv(128, 128), g = c.getContext('2d'); g.clearRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 8, 64, 64, 62); gr.addColorStop(0, glow || '#000'); gr.addColorStop(0.25, base); gr.addColorStop(0.8, base); gr.addColorStop(1, ring); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.16)'; for (let k = 0; k < 70; k++) { const a = k / 70 * TAU; g.lineWidth = tr(0.6, 1.6); g.beginPath(); g.moveTo(64 + Math.cos(a) * 18, 64 + Math.sin(a) * 18); g.lineTo(64 + Math.cos(a + tr(-0.05, 0.05)) * 56, 64 + Math.sin(a) * 56); g.stroke(); }
  g.fillStyle = '#050405'; g.beginPath(); g.arc(64, 64, 19, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(48, 46, 10, 8, -0.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(80, 82, 4, 0, TAU); g.fill();
  TEX[key] = mkTex(c); TEX[key].wrapS = TEX[key].wrapT = THREE.ClampToEdgeWrapping; return TEX[key];
}
/* ---------- geometry helpers ---------- */
function deformHead(g, r, o = {}) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const nx = v.x / r, ny = v.y / r, nz = v.z / r;
    let x = v.x, y = v.y * (o.tall || 1.06), z = v.z;
    const jw = ss(-0.1, -0.85, ny); x *= 1 - jw * (o.jaw || 0.22); z *= 1 - jw * 0.06;
    if (ny < -0.45) y *= 1 - 0.14 * ss(-0.45, -1, ny); // shorter, rounder chin
    if (nz > 0) z += r * (o.chin || 0.04) * ss(-0.5, -0.85, ny) * ss(0.3, 0.95, nz);
    const ch = Math.exp(-((ny + 0.3) ** 2) / 0.05 - ((Math.abs(nx) - 0.5) ** 2) / 0.06) * ss(0.2, 0.6, nz); x += Math.sign(nx) * r * 0.02 * ch * (o.cheek || 1); z += r * 0.015 * ch * (o.cheek || 1);
    if (nz < 0) z *= 1 + 0.06 * (-nz) * ss(-0.3, 0.6, ny);
    x *= 1 - 0.04 * ss(0.2, 0.8, ny);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); return g;
}
const headGeo = (r, o) => deformHead(new THREE.SphereGeometry(r, 48, 36), r, o);
/* the painted face: a sphere patch over the front of the head, deformed like the head so it hugs it */
const FACE_PATCH = { ps: PI / 2 - 0.95, pl: 1.9, ts: PI / 2 - 0.8, tl: 1.45 };
function facePatch(r, o) { const g = new THREE.SphereGeometry(r * 1.004, 40, 30, FACE_PATCH.ps, FACE_PATCH.pl, FACE_PATCH.ts, FACE_PATCH.tl); return deformHead(g, r * 1.004, o); }
/* canvas coordinates of a point on the face given its elevation e (rad above the equator) and azimuth a (rad, + = viewer's right) */
const FW = 512, FH = Math.round(512 * FACE_PATCH.tl / FACE_PATCH.pl);
const fxy = (a, e) => [(0.5 + a / FACE_PATCH.pl) * FW, (0.8 - e) / FACE_PATCH.tl * FH];
function faceTex(o, closed) {
  const key = 'face' + o.key + (closed ? 'c' : 'o'); if (TEX[key]) return TEX[key];
  const c = cnv(FW, FH), g = c.getContext('2d'); g.clearRect(0, 0, FW, FH);
  // blush
  for (const sx of [-1, 1]) { const [x, y] = fxy(sx * 0.42, -0.26); const gr = g.createRadialGradient(x, y, 2, x, y, 34); gr.addColorStop(0, `rgba(240,120,120,${o.blush || 0.22})`); gr.addColorStop(1, 'rgba(240,120,120,0)'); g.fillStyle = gr; g.fillRect(x - 40, y - 40, 80, 80); }
  for (const sx of [-1, 1]) {
    const [cx, cy] = fxy(sx * o.sep, o.ey), w = o.ew, h = o.eh, inner = -sx; // inner = toward the nose
    // brow
    { const [bx, by] = fxy(sx * (o.sep + 0.02), o.ey + o.browE); g.strokeStyle = o.browC; g.lineCap = 'round'; g.lineWidth = o.browW; g.beginPath(); g.moveTo(bx + inner * w * 0.75, by + o.browTilt); g.quadraticCurveTo(bx, by - 7, bx - inner * w * 0.85, by + 2 - o.browTilt * 0.4); g.stroke(); }
    if (closed) { g.strokeStyle = o.lash; g.lineWidth = 4.5; g.beginPath(); g.moveTo(cx + inner * w, cy + 2); g.quadraticCurveTo(cx, cy + h * 0.32, cx - inner * w * 1.05, cy); g.stroke(); continue; }
    // eye white (almond)
    const shape = () => { g.beginPath(); g.moveTo(cx + inner * w, cy + h * 0.1); g.bezierCurveTo(cx + inner * w * 0.5, cy - h * 0.62, cx - inner * w * 0.55, cy - h * 0.62, cx - inner * w * 1.04, cy - h * 0.08); g.bezierCurveTo(cx - inner * w * 0.6, cy + h * 0.55, cx + inner * w * 0.5, cy + h * 0.6, cx + inner * w, cy + h * 0.1); g.closePath(); };
    shape(); g.fillStyle = '#fbf7f2'; g.fill();
    g.save(); shape(); g.clip();
    // iris
    const ix = cx + inner * w * 0.06, iy = cy + h * 0.06, ir = h * o.irisK;
    const ig = g.createLinearGradient(0, iy - ir, 0, iy + ir); ig.addColorStop(0, o.iris[0]); ig.addColorStop(0.55, o.iris[1]); ig.addColorStop(1, o.iris[2]); g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, ir * 0.82, ir, 0, 0, TAU); g.fill();
    g.strokeStyle = o.iris[3]; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = 'rgba(10,6,8,.92)'; g.beginPath(); g.ellipse(ix, iy + 1, ir * 0.36, ir * 0.46, 0, 0, TAU); g.fill();
    if (o.glow) { const gg = g.createRadialGradient(ix, iy + ir * 0.4, 1, ix, iy + ir * 0.4, ir * 0.8); gg.addColorStop(0, 'rgba(190,240,255,.55)'); gg.addColorStop(1, 'rgba(190,240,255,0)'); g.fillStyle = gg; g.fillRect(ix - ir, iy - ir, ir * 2, ir * 2); }
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(ix - inner * ir * 0.3, iy - ir * 0.42, ir * 0.22, ir * 0.17, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(ix + inner * ir * 0.28, iy + ir * 0.38, ir * 0.09, 0, TAU); g.fill();
    // lid shadow
    const sg = g.createLinearGradient(0, cy - h * 0.6, 0, cy - h * 0.1); sg.addColorStop(0, 'rgba(60,30,30,.35)'); sg.addColorStop(1, 'rgba(60,30,30,0)'); g.fillStyle = sg; g.fillRect(cx - w * 1.2, cy - h, w * 2.4, h);
    g.restore();
    // upper lash line, thicker toward the outer corner, optional flick
    g.strokeStyle = o.lash; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = o.lashW; g.beginPath(); g.moveTo(cx + inner * w * 1.02, cy + h * 0.12); g.bezierCurveTo(cx + inner * w * 0.5, cy - h * 0.64, cx - inner * w * 0.55, cy - h * 0.66, cx - inner * w * 1.08, cy - h * 0.05); g.stroke();
    if (o.flick) { g.lineWidth = o.lashW * 0.8; g.beginPath(); g.moveTo(cx - inner * w * 0.95, cy - h * 0.18); g.lineTo(cx - inner * w * 1.32, cy - h * 0.42); g.stroke(); g.beginPath(); g.moveTo(cx - inner * w * 0.7, cy - h * 0.42); g.lineTo(cx - inner * w * 0.92, cy - h * 0.7); g.lineWidth = 2; g.stroke(); }
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(80,40,30,.45)'; g.beginPath(); g.moveTo(cx + inner * w * 0.7, cy - h * 0.62); g.quadraticCurveTo(cx, cy - h * 0.86, cx - inner * w * 0.85, cy - h * 0.5); g.stroke(); // crease
    g.strokeStyle = 'rgba(90,50,40,.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx + inner * w * 0.4, cy + h * 0.5); g.quadraticCurveTo(cx - inner * w * 0.2, cy + h * 0.6, cx - inner * w * 0.85, cy + h * 0.25); g.stroke();
  }
  // nose hint: a soft shadow under the tip and a tiny highlight
  { const [nx, ny] = fxy(0.0, o.noseE); const gr = g.createRadialGradient(nx + 3, ny + 3, 1, nx + 3, ny + 3, 13); gr.addColorStop(0, 'rgba(150,80,60,.35)'); gr.addColorStop(1, 'rgba(150,80,60,0)'); g.fillStyle = gr; g.fillRect(nx - 16, ny - 12, 34, 30); g.strokeStyle = 'rgba(120,60,45,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx - 5, ny + 3); g.quadraticCurveTo(nx, ny + 6, nx + 5, ny + 3); g.stroke(); }
  // mouth
  { const [mx, my] = fxy(0, o.mouthE); g.strokeStyle = o.mouthC; g.lineCap = 'round'; g.lineWidth = 3; g.beginPath(); g.moveTo(mx - o.mouthW, my + o.mouthCurve * 0.3); g.quadraticCurveTo(mx, my + o.mouthCurve, mx + o.mouthW, my + o.mouthCurve * 0.3); g.stroke(); if (o.lip) { g.fillStyle = o.lip; g.beginPath(); g.ellipse(mx, my + 5 + o.mouthCurve * 0.4, o.mouthW * 0.55, 3.2, 0, 0, TAU); g.fill(); } }
  if (o.mole) { const [x, y] = fxy(o.mole[0], o.mole[1]); g.fillStyle = 'rgba(60,30,20,.85)'; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
  TEX[key] = mkTex(c); TEX[key].wrapS = TEX[key].wrapT = THREE.ClampToEdgeWrapping; return TEX[key];
}
/* hair strand: a flattened, tapering tube along a curve, its width laid along the head surface */
function strandGeo(pts, w0, w1, h0, h1, blunt) {
  const curve = new THREE.CatmullRomCurve3(pts), N = Math.max(8, pts.length * 4), Mr = 8, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPoint(t), T = curve.getTangent(t).normalize();
    const Nn = p.clone().setY(p.y * 0.4).normalize(); Nn.sub(T.clone().multiplyScalar(Nn.dot(T))).normalize();
    const Bn = new THREE.Vector3().crossVectors(T, Nn).normalize();
    let w = lerp(w0, w1, t), h = lerp(h0, h1, t);
    if (t > 0.8) { const k = blunt ? 1 : Math.sqrt(Math.max(0, 1 - ((t - 0.8) / 0.2) ** 2)); w *= Math.max(k, 0.06); h *= Math.max(k, 0.3); }
    for (let j = 0; j < Mr; j++) { const a = j / Mr * TAU, q = p.clone().addScaledVector(Bn, Math.cos(a) * w).addScaledVector(Nn, Math.sin(a) * h); pos.push(q.x, q.y, q.z); }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < Mr; j++) { const a = i * Mr + j, b = i * Mr + (j + 1) % Mr, c = (i + 1) * Mr + j, d = (i + 1) * Mr + (j + 1) % Mr; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
/* point on a sphere: theta from the top, phi around y measured from the face (+z), positive toward +x */
const sph = (R, th, ph) => new THREE.Vector3(R * Math.sin(th) * Math.sin(ph), R * Math.cos(th), R * Math.sin(th) * Math.cos(ph));
/* a clump of hair: a flattened cone curved backwards along its length; base at origin, tip along +y */
function clumpGeo(len, r, bend = 0.3, flat = 1.7) {
  const g = new THREE.ConeGeometry(r, len, 7, 6, false); g.translate(0, len / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = y / len; p.setX(i, p.getX(i) * flat * (1 + 0.25 * Math.sin(t * 3.1))); p.setZ(i, p.getZ(i) * 0.75 + bend * len * t * t); }
  g.computeVertexNormals(); return g;
}
function placeAlong(parent, geo, mat, pos, dir, roll = 0) { const m = new THREE.Mesh(geo, mat); m.position.copy(pos); m.quaternion.setFromUnitVectors(UPV, dir.clone().normalize()); if (roll) m.rotateY(roll); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
function foldLathe(pts, seg, amp, freq, zs = 1) { const g = GEO.lathe(pts, seg), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), r = Math.hypot(x, z); if (r < 1e-4) continue; const k = 1 + Math.sin(a * freq + y * 9) * amp * ss(0.02, 0.06, r); p.setX(i, x * k); p.setZ(i, z * k * zs); } g.computeVertexNormals(); return g; }
function foldTube(p, rTop, rBot, len, mat, folds = 0.05) { const g = new THREE.CylinderGeometry(rTop, rBot, len, 18, 6, false), q = g.attributes.position; for (let i = 0; i < q.count; i++) { const x = q.getX(i), z = q.getZ(i), y = q.getY(i), a = Math.atan2(z, x), k = 1 + Math.sin(a * 5 + y * 30) * folds * 0.3 + Math.sin(y * 22) * folds * 0.2; q.setX(i, x * k); q.setZ(i, z * k); } g.computeVertexNormals(); addM(p, g, mat, 0, -len / 2, 0); addM(p, GEO.sph(rBot, 16, 10), mat, 0, -len, 0); addM(p, GEO.sph(rTop, 16, 10), mat, 0, 0, 0); }
/* ---------- head: sculpted skull + painted face (open/closed for blinking) + small 3D nose + ears ---------- */
function makeHead(R, H, r, skullY, neck, skin, ho, fo, ears = true) {
  addM(H, GEO.cyl(neck[0], neck[1], 0.2, 14), skin, 0, -0.07, -0.008);
  const skull = grp(H, 0, skullY, 0); R.skull = skull;
  addM(skull, headGeo(r, ho), skin, 0, 0, 0);
  const mk = closed => { const m = new THREE.Mesh(facePatch(r, ho), pmat('face' + fo.key + closed, { map: faceTex(fo, closed), transparent: true, depthWrite: false, roughness: 0.42, clearcoat: 0.15, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.userData.keep = true; m.renderOrder = 2; skull.add(m); return m; };
  R.faceO = mk(0); R.faceC = mk(1); R.faceC.visible = false;
  // nose: bridge and a soft tip, sitting on the surface
  const ne = fo.noseE, ny = r * (ho.tall || 1.06) * Math.sin(ne), nz = r * Math.cos(ne);
  addM(skull, GEO.sph(0.0085 * fo.nose, 14, 10), skin, 0, ny + 0.002, nz - 0.0045, 0, 0, 0, 1.05, 0.85, 0.9);
  addM(skull, new THREE.CapsuleGeometry(0.0048 * fo.nose, 0.024, 3, 8), skin, 0, ny + 0.016, nz - 0.0065, -0.42, 0, 0);
  if (ears) for (const sx of [-1, 1]) { const ea = grp(skull, sx * r * 0.9, -0.012, -0.01); ea.rotation.set(0, sx * 0.35, sx * -0.1); addM(ea, GEO.sph(0.028, 12, 10), skin, 0, 0, 0, 0, 0, 0, 0.38, 1.0, 0.72); addM(ea, GEO.sph(0.017, 10, 8), pmat('earIn', { color: 0xc8907a, roughness: 0.7 }), sx * 0.006, 0, 0.004, 0, 0, 0, 0.3, 0.8, 0.5); }
  return skull;
}
/* hair path: along the scalp from th0 to th1 at azimuth ph, then optionally hanging down / flicking out */
function hairPath(r, ph, th0, th1, o = {}) {
  const pts = [], n = 6, R0 = r * (o.lift || 1.07);
  for (let i = 0; i <= n; i++) { const t = i / n, p = sph(R0 * (1 + (o.puff || 0) * Math.sin(t * PI)), lerp(th0, th1, t), ph + (o.tw || 0) * t); p.y = p.y * 1.06; if (p.z < 0) p.z *= 1.05; pts.push(p); }
  const scalpN = pts.length;
  if (o.hang) {
    const last = pts[n], out = new THREE.Vector3(last.x, 0, last.z).normalize(), m = Math.max(3, Math.round(o.hang / 0.05));
    for (let i = 1; i <= m; i++) { const t = i / m; pts.push(last.clone().addScaledVector(out, (o.flare || 0.012) * Math.sin(t * HP) - (o.curl || 0) * t * t).add(new THREE.Vector3((o.sway || 0) * t, -o.hang * t, 0))); }
  }
  if (o.flick) { const last = pts.at(-1), d = last.clone().sub(pts.at(-2)).normalize(), out = new THREE.Vector3(last.x, 0, last.z).normalize(); pts.push(last.clone().addScaledVector(d, o.flick * 0.7).addScaledVector(out, o.flick * 0.7)); }
  pts.scalpN = scalpN; return pts;
}
function strand(parent, mat, pts, w0, w1, h, blunt) { const m = new THREE.Mesh(strandGeo(pts, w0, w1, h, h * 0.8, blunt), mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
function hairCap(skull, r, mat, tilt, len) { addM(skull, new THREE.SphereGeometry(r * 1.05, 36, 22, 0, TAU, 0, PI * len), mat, 0, 0.004, -0.004, tilt, 0, 0, 1.0, 1.06, 1.04); }
function makeHand(parent, sx, skin, glove, curl = 0.5, thumbCurl = 0.4) {
  const h = grp(parent, 0, -0.012, 0), pm = glove || skin;
  addM(h, GEO.box(0.072, 0.082, 0.03, 0.012), pm, 0, -0.042, 0);
  addM(h, GEO.sph(0.028, 10, 8), pm, sx * 0.018, -0.05, 0.006, 0, 0, 0, 1.2, 1.4, 0.8);
  const fx = [-0.026, -0.009, 0.009, 0.026], fl = [0.026, 0.03, 0.029, 0.023];
  fx.forEach((x, i) => {
    const f1 = grp(h, x * sx, -0.085, 0); f1.rotation.x = curl * 0.9;
    addM(f1, new THREE.CapsuleGeometry(0.0082, fl[i], 3, 8), glove || skin, 0, -fl[i] / 2, 0);
    const f2 = grp(f1, 0, -fl[i] - 0.004, 0); f2.rotation.x = curl * 1.1;
    addM(f2, new THREE.CapsuleGeometry(0.0075, fl[i] * 0.85, 3, 8), skin, 0, -fl[i] * 0.42, 0);
    addM(f2, GEO.sph(0.0055, 6, 4), pmat('nail', { color: 0xf0c8b8, roughness: 0.25, clearcoat: 0.6 }), 0, -fl[i] * 0.78, 0.0055, 0, 0, 0, 1, 1.2, 0.4);
  });
  const t1 = grp(h, sx * 0.04, -0.03, 0.012); t1.rotation.set(0.3 + thumbCurl * 0.5, 0, sx * 0.7);
  addM(t1, new THREE.CapsuleGeometry(0.009, 0.026, 3, 8), glove || skin, 0, -0.016, 0);
  const t2 = grp(t1, 0, -0.034, 0); t2.rotation.x = thumbCurl; addM(t2, new THREE.CapsuleGeometry(0.0085, 0.02, 3, 8), skin, 0, -0.012, 0);
  return h;
}
/* ---------- 持灯者 阿岩 ---------- */
function makeHolder() {
  heroTex();
  const R = rig({ hipY: 0.84, chestY: 0.32, headY: 0.22, shX: 0.205, shY: 0.07, upper: 0.28, fore: 0.26, legX: 0.1, thigh: 0.4, shin: 0.38 });
  const skin = pmat('skinA', { color: 0xd6a07a, roughness: 0.55, sheen: 0.15, sheenColor: new THREE.Color(0xffc0a8), sheenRoughness: 0.5 });
  const coat = pmat('raincoat', { color: 0xd8a024, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3, bumpMap: TEX.fabric, bumpScale: 0.3 });
  const coatD = pmat('raincoatD', { color: 0x9a6c12, roughness: 0.5, clearcoat: 0.3 });
  const refl = pmat('refl', { color: 0xd8d8d0, roughness: 0.25, metalness: 0.5, emissive: 0x3a3a34, emissiveIntensity: 1, clearcoat: 1 });
  const denim = pmat('denim', { map: TEX.denim, roughness: 0.9, bumpMap: TEX.denim, bumpScale: 0.5 });
  const denimL = pmat('denimL', { color: 0x8a98b8, map: TEX.denim, roughness: 0.9 });
  const leatherB = pmat('bootLeather', { color: 0x5a3820, roughness: 0.55, clearcoat: 0.25, map: TEX.leather });
  const rubber = pmat('rubber', { color: 0x1a1816, roughness: 0.85 }), brass = pmat('brassH', { color: 0xc49a48, roughness: 0.3, metalness: 0.9 });
  const glove = pmat('glove', { color: 0x2c2e30, roughness: 0.8, map: TEX.knit }), hairM = pmat('hairA', { color: 0x1c1610, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0x5a4a3a) });
  const scarfM = pmat('scarf', { color: 0x8a2420, roughness: 0.95, map: TEX.knit, bumpMap: TEX.knit, bumpScale: 1.2 });
  const canvasM = pmat('packCanvas', { color: 0x4e5a3c, roughness: 0.92, map: TEX.fabric, bumpMap: TEX.fabric, bumpScale: 0.6 }), strapM = pmat('strap', { color: 0x3a2618, roughness: 0.6, map: TEX.leather });
  // ---- legs: jeans with seams and rolled cuffs, lace-up boots
  for (const [L, sx] of [[R.lL, 1], [R.lR, -1]]) {
    foldTube(L.hp, 0.082, 0.064, 0.4, denim, 0.04);
    addM(L.hp, GEO.box(0.004, 0.38, 0.004), pmat('seam', { color: 0xb8803a, roughness: 0.8 }), sx * 0.074, -0.2, 0, 0, 0, sx * -0.04);
    for (const sz of [-1, 1]) addM(L.hp, GEO.box(0.05, 0.004, 0.004), pmat('seam', {}), sx * 0.02, -0.05, sz * 0.07);
    foldTube(L.kn, 0.064, 0.056, 0.32, denim, 0.05);
    addM(L.kn, GEO.tor(0.058, 0.014, TAU, 8, 20), denimL, 0, -0.3, 0, HP, 0, 0);
    const b = grp(L.ft, 0, 0, 0);
    addM(b, GEO.cyl(0.056, 0.06, 0.13, 16), leatherB, 0, 0.03, -0.005);
    addM(b, GEO.tor(0.056, 0.016, TAU, 8, 18), pmat('bootPad', { color: 0x3a2214, roughness: 0.7 }), 0, 0.095, -0.005, HP, 0, 0);
    const toe = addM(b, GEO.sph(0.055, 16, 12), leatherB, 0, -0.035, 0.085, 0, 0, 0, 1.0, 0.65, 1.5);
    addM(b, GEO.box(0.11, 0.06, 0.15, 0.025), leatherB, 0, -0.035, 0.02);
    addM(b, GEO.box(0.122, 0.028, 0.27, 0.012), rubber, 0, -0.072, 0.045);
    for (let k = 0; k < 5; k++) addM(b, GEO.box(0.12, 0.006, 0.012), rubber, 0, -0.088, -0.06 + k * 0.05);
    addM(b, GEO.box(0.1, 0.02, 0.06, 0.01), rubber, 0, -0.06, -0.075);
    for (let k = 0; k < 4; k++) { const y = 0.07 - k * 0.032, z = 0.05 + k * 0.016; for (const lx of [-1, 1]) addM(b, GEO.tor(0.006, 0.0018, TAU, 4, 8), brass, lx * 0.024, y, z, 0, lx * 0.6, 0); addM(b, GEO.box(0.05, 0.004, 0.004), pmat('lace', { color: 0xb8a070, roughness: 0.8 }), 0, y - 0.006, z + 0.004, 0, 0, k % 2 ? 0.35 : -0.35); }
    addM(b, GEO.tor(0.012, 0.0025, TAU, 4, 8), pmat('lace', {}), 0.012, 0.1, 0.052, 0.4, 0, 0); addM(b, GEO.tor(0.012, 0.0025, TAU, 4, 8), pmat('lace', {}), -0.012, 0.1, 0.052, 0.4, 0, 0);
  }
  // ---- raincoat body
  const cp = [[0.0, -0.36], [0.245, -0.36], [0.24, -0.25], [0.21, -0.08], [0.2, 0.08], [0.205, 0.2], [0.23, 0.32], [0.21, 0.39], [0.13, 0.44], [0.0, 0.45]];
  addM(R.torso, foldLathe(cp, 40, 0.035, 7, 0.78), coat, 0, 0, 0);
  addM(R.torso, GEO.tor(0.24, 0.022, TAU, 8, 40), refl, 0, -0.26, 0, HP, 0, 0, 1, 0.8, 1);
  addM(R.torso, GEO.box(0.04, 0.78, 0.016, 0.006), coatD, 0.018, 0.04, 0.162);
  addM(R.torso, GEO.box(0.006, 0.76, 0.006), pmat('zip', { color: 0x2a2a2a, roughness: 0.4, metalness: 0.6 }), -0.004, 0.04, 0.164);
  for (let k = 0; k < 4; k++) { const y = 0.3 - k * 0.15; addM(R.torso, new THREE.CapsuleGeometry(0.008, 0.035, 3, 6), pmat('toggle', { color: 0x4a2e1a, roughness: 0.5 }), 0.03, y, 0.176, 0, 0, HP); addM(R.torso, GEO.tor(0.012, 0.003, TAU, 4, 10), rubber, 0.0, y, 0.172, 0, 0, 0, 1.6, 0.8, 1); }
  for (const sx of [-1, 1]) { const pk = grp(R.torso, sx * 0.13, -0.16, 0.15); pk.rotation.y = sx * 0.55; addM(pk, GEO.box(0.12, 0.11, 0.02, 0.008), coat, 0, 0, 0); addM(pk, GEO.box(0.13, 0.04, 0.026, 0.008), coatD, 0, 0.055, 0.004, -0.15); addM(pk, GEO.box(0.12, 0.012, 0.022, 0.004), refl, 0, -0.035, 0.004); }
  { const pk = grp(R.torso, 0.1, 0.2, 0.155); pk.rotation.y = 0.35; addM(pk, GEO.box(0.08, 0.085, 0.016, 0.006), coat, 0, 0, 0); addM(pk, GEO.box(0.086, 0.03, 0.02, 0.006), coatD, 0, 0.04, 0.003, -0.15); addM(pk, new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), pmat('pen', { color: 0x1a1a1a, roughness: 0.3 }), -0.02, 0.06, 0.002); }
  // collar, drawstrings, hood bunched behind the neck
  addM(R.chest, GEO.cyl(0.1, 0.115, 0.1, 24, 1, true), pmat('collarDS', { color: 0xd8a024, roughness: 0.45, clearcoat: 0.4, side: THREE.DoubleSide }), 0, 0.14, -0.005);
  for (const sx of [-1, 1]) { addM(R.chest, GEO.cyl(0.0025, 0.0025, 0.12, 4), pmat('cord', { color: 0x1a1a1a, roughness: 0.8 }), sx * 0.04, 0.05, 0.12, 0.1, 0, sx * 0.08); addM(R.chest, GEO.cyl(0.004, 0.004, 0.018, 6), brass, sx * 0.045, -0.015, 0.124); }
  const hood = grp(R.chest, 0, 0.12, -0.12); addM(hood, foldLathe([[0, 0], [0.1, 0.0], [0.13, 0.05], [0.12, 0.11], [0.06, 0.15], [0, 0.15]], 20, 0.08, 5), coat, 0, -0.04, 0, -1.25, 0, 0, 1, 0.8, 0.9); addM(hood, GEO.tor(0.1, 0.016, PI * 1.2, 6, 18), refl, 0, 0.0, 0.03, -1.35, 0, -PI * 0.1);
  // knitted scarf with a hanging tail and fringe
  addM(R.chest, GEO.tor(0.088, 0.034, TAU, 10, 24), scarfM, 0, 0.165, 0.008, HP + 0.1, 0, 0, 1, 1, 0.75);
  const tail = grp(R.chest, 0.055, 0.15, 0.115); tail.rotation.set(0.25, 0, 0.15); addM(tail, GEO.box(0.075, 0.22, 0.022, 0.01), scarfM, 0, -0.11, 0); for (let k = 0; k < 6; k++) addM(tail, GEO.cyl(0.003, 0.002, 0.04, 4), scarfM, -0.03 + k * 0.012, -0.24, 0);
  // backpack: canvas body, flap, front pocket, straps, buckles, bedroll, water bottle, a small red charm
  const bp = grp(R.chest, 0, -0.06, -0.205); bp.rotation.x = 0.06;
  addM(bp, GEO.box(0.3, 0.38, 0.15, 0.05), canvasM, 0, 0, 0); addM(bp, GEO.box(0.31, 0.14, 0.16, 0.04), pmat('packFlap', { color: 0x3e4a2e, roughness: 0.9, map: TEX.fabric }), 0, 0.15, -0.01, -0.08);
  addM(bp, GEO.box(0.2, 0.14, 0.05, 0.02), canvasM, 0, -0.08, -0.09); addM(bp, GEO.box(0.21, 0.05, 0.055, 0.015), pmat('packFlap', {}), 0, -0.02, -0.095);
  for (const sx of [-1, 1]) { addM(bp, GEO.box(0.025, 0.16, 0.006), strapM, sx * 0.08, 0.04, -0.082); addM(bp, GEO.box(0.03, 0.022, 0.01, 0.004), brass, sx * 0.08, -0.03, -0.085); addM(bp, GEO.box(0.035, 0.42, 0.012, 0.005), strapM, sx * 0.1, 0.02, 0.085, -0.12, 0, 0); addM(bp, GEO.box(0.035, 0.03, 0.016, 0.005), brass, sx * 0.1, -0.09, 0.09); }
  const roll = grp(bp, 0, 0.26, -0.01); addM(roll, GEO.cyl(0.07, 0.07, 0.36, 16), pmat('bedroll', { color: 0x6a3a22, roughness: 0.95, map: TEX.fabric }), 0, 0, 0, 0, 0, HP); for (const sx of [-1, 1]) addM(roll, GEO.tor(0.072, 0.007, TAU, 4, 16), strapM, sx * 0.11, 0, 0, 0, HP, 0);
  const btl = grp(bp, -0.17, -0.05, 0); addM(btl, GEO.cyl(0.035, 0.035, 0.18, 14), pmat('bottle', { color: 0x8a9298, roughness: 0.25, metalness: 0.85 }), 0, 0, 0); addM(btl, GEO.cyl(0.022, 0.03, 0.03, 12), rubber, 0, 0.1, 0);
  const charm = grp(bp, 0.12, -0.12, -0.08); addM(charm, GEO.tor(0.008, 0.002, TAU, 4, 8), brass, 0, 0, 0); addM(charm, GEO.box(0.025, 0.03, 0.01, 0.006), pmat('charm', { color: 0xb81e1e, roughness: 0.6 }), 0, -0.025, 0, 0, 0, PI / 4); addM(charm, GEO.cyl(0.002, 0.001, 0.035, 3), pmat('charm', {}), 0, -0.055, 0);
  // ---- arms: sleeves with folds, reflective band, cuff tab; fingerless gloves
  for (const [A, sx] of [[R.aL, 1], [R.aR, -1]]) {
    addM(A.sh, GEO.sph(0.074, 16, 12), coat, 0, -0.005, 0, 0, 0, 0, 1, 0.9, 1);
    foldTube(A.sh, 0.068, 0.06, 0.28, coat, 0.08);
    addM(A.sh, GEO.tor(0.066, 0.014, TAU, 6, 18), refl, 0, -0.13, 0, HP, 0, 0);
    foldTube(A.el, 0.06, 0.054, 0.22, coat, 0.07);
    addM(A.el, GEO.cyl(0.058, 0.056, 0.035, 16), coatD, 0, -0.22, 0); addM(A.el, GEO.box(0.03, 0.02, 0.012, 0.004), coatD, sx * 0.03, -0.215, 0.05);
    makeHand(A.hand, sx, skin, glove, sx < 0 ? 1.25 : 0.45, sx < 0 ? 1.0 : 0.3);
  }
  // ---- flashlight in the right hand: knurled body, bezel, switch, lanyard; the lens glows
  const fl = grp(R.aR.hand, 0, -0.07, 0.012); fl.rotation.x = PI;
  const alu = pmat('alu', { color: 0x3a3c40, roughness: 0.35, metalness: 0.8, map: TEX.knurl, bumpMap: TEX.knurl, bumpScale: 0.6 });
  addM(fl, GEO.cyl(0.021, 0.021, 0.2, 16), alu, 0, 0.02, 0); addM(fl, GEO.cyl(0.024, 0.021, 0.02, 16), pmat('aluS', { color: 0x2a2c30, roughness: 0.3, metalness: 0.85 }), 0, -0.085, 0);
  addM(fl, GEO.cyl(0.04, 0.025, 0.07, 20), pmat('aluS', {}), 0, 0.15, 0); addM(fl, GEO.tor(0.039, 0.005, TAU, 6, 24), pmat('bezel', { color: 0x9a9a98, roughness: 0.2, metalness: 0.95 }), 0, 0.186, 0, HP, 0, 0);
  addM(fl, GEO.box(0.014, 0.022, 0.01, 0.004), rubber, 0, 0.07, 0.022); addM(fl, GEO.tor(0.012, 0.002, TAU, 4, 8), pmat('cord', {}), 0, -0.1, 0, 0, HP, 0);
  const lens = addM(fl, GEO.cyl(0.034, 0.034, 0.005, 20), pmat('lens', { color: 0xfff6dd, emissive: 0xfff2c8, emissiveIntensity: 2.5, roughness: 0.1 }), 0, 0.188, 0); lens.castShadow = false; lens.userData.keep = true;
  R.lens = lens; R.flash = fl;
  // ---- head: sculpted skull, painted face, a plaster on the cheek, messy layered hair
  const r = 0.128, ho = { jaw: 0.18, chin: 0.06, cheek: 0.6 };
  const skull = makeHead(R, R.head, r, 0.13, [0.05, 0.06], skin, ho, {
    key: 'A', sep: 0.37, ey: 0.0, ew: 40, eh: 33, irisK: 0.68, iris: ['#2a160a', '#6a4424', '#9a6a3a', '#1a0c04'], lash: '#1a120c', lashW: 4.5,
    browE: 0.2, browC: '#2a1c12', browW: 7, browTilt: 3, mouthE: -0.43, mouthW: 15, mouthCurve: 2, mouthC: 'rgba(120,50,40,.85)', lip: 'rgba(190,110,100,.35)', blush: 0.1, noseE: -0.22, nose: 1.1 });
  { const pl = grp(skull, -0.07, -0.04, r * 0.76); pl.rotation.set(0, -0.62, 0.35); addM(pl, GEO.box(0.032, 0.013, 0.004, 0.003), pmat('plaster', { color: 0xe0c098, roughness: 0.8 }), 0, 0, 0); addM(pl, GEO.box(0.011, 0.011, 0.005, 0.002), pmat('plasterPad', { color: 0xf0e0c8, roughness: 0.9 }), 0, 0, 0.0005); }
  hairCap(skull, r, hairM, -0.42, 0.48);
  const hr = mulberry32(31);
  for (let k = 0; k < 34; k++) {
    const ph = (k / 34) * TAU + (hr() - 0.5) * 0.12, a = Math.abs(angDiff(0, ph)), front = a < 0.9, side = a < 1.9;
    const th0 = 0.05 + hr() * 0.22, th1 = front ? 1.06 + hr() * 0.16 : side ? 1.32 + hr() * 0.12 : 1.72 + hr() * 0.16;
    const pts = hairPath(r, ph, th0, th1, { lift: 1.06 + (k % 3) * 0.012, puff: 0.03 + hr() * 0.05, tw: front ? 0.28 : (hr() - 0.5) * 0.2, flick: 0.012 + hr() * 0.02 });
    strand(skull, hairM, pts, 0.012, 0.024, 0.009, false);
  }
  for (let k = 0; k < 7; k++) { const ph = (hr() - 0.5) * 1.4; strand(skull, hairM, hairPath(r, ph, 0.25 + hr() * 0.2, 1.0 + hr() * 0.15, { lift: 1.1, puff: 0.06, tw: 0.3, flick: 0.025 }), 0.01, 0.018, 0.008, false); }
  for (let k = 0; k < 6; k++) { const ph = PI + (hr() - 0.5) * 1.6; strand(skull, hairM, hairPath(r, ph, 0.2, 0.9 + hr() * 0.5, { lift: 1.11, puff: 0.1, flick: 0.03 }), 0.011, 0.02, 0.008, false); }
  mergeRig(R.root); R.kind = 'L';
  return R;
}
/* ---------- 灵视者 小雾 ---------- */
function makeSeer() {
  heroTex();
  const R = rig({ hipY: 0.76, chestY: 0.29, headY: 0.188, shX: 0.172, shY: 0.065, upper: 0.25, fore: 0.225, legX: 0.084, thigh: 0.37, shin: 0.345 });
  const skin = pmat('skinB', { color: 0xe8b89a, roughness: 0.52, sheen: 0.2, sheenColor: new THREE.Color(0xffd0c4), sheenRoughness: 0.45 });
  const knit = pmat('cardigan', { color: 0x1e2846, roughness: 0.95, map: TEX.knit, bumpMap: TEX.knit, bumpScale: 1.1 });
  const knitRib = pmat('cardiganRib', { color: 0x182038, roughness: 0.95, map: TEX.knit, bumpMap: TEX.knit, bumpScale: 1.6 });
  const blouse = pmat('blouse', { color: 0xf0ece4, roughness: 0.75, map: TEX.fabric, sheen: 0.3, sheenColor: new THREE.Color(0xffffff) });
  const skirtM = pmat('tartanSkirt', { map: TEX.tartan, roughness: 0.85, side: THREE.DoubleSide });
  const sock = pmat('sock', { color: 0xeeeae2, roughness: 0.95, map: TEX.knit, bumpMap: TEX.knit, bumpScale: 0.6 });
  const shoe = pmat('maryjane', { color: 0x0e0b0c, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  const silver = pmat('silver', { color: 0xd8dce0, roughness: 0.2, metalness: 0.95 }), brass = pmat('brassH', { color: 0xc49a48, roughness: 0.3, metalness: 0.9 });
  const hairM = pmat('hairB', { color: 0x0b0a10, roughness: 0.32, sheen: 0.9, sheenColor: new THREE.Color(0x4a5a7a), sheenRoughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const ribbonM = pmat('ribbon', { color: 0x9a1424, roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color(0xff6070) });
  const leather = pmat('satchel', { color: 0x6a4224, roughness: 0.55, map: TEX.leather, clearcoat: 0.2 });
  // ---- legs: knee socks with ribbed tops, glossy Mary-janes with strap and buckle
  for (const [L, sx] of [[R.lL, 1], [R.lR, -1]]) {
    foldTube(L.hp, 0.062, 0.05, 0.37, skin, 0);
    foldTube(L.kn, 0.052, 0.041, 0.3, sock, 0.01);
    addM(L.kn, GEO.tor(0.052, 0.011, TAU, 8, 20), sock, 0, -0.025, 0, HP, 0, 0);
    for (let k = 0; k < 3; k++) addM(L.kn, GEO.tor(0.051, 0.004, TAU, 4, 20), pmat('sockStripe', { color: 0x1e2846, roughness: 0.9 }), 0, -0.05 - k * 0.012, 0, HP, 0, 0);
    const b = grp(L.ft, 0, 0, 0);
    addM(b, GEO.sph(0.046, 16, 12), shoe, 0, -0.035, 0.05, 0, 0, 0, 0.95, 0.62, 1.55);
    addM(b, GEO.box(0.085, 0.045, 0.12, 0.02), shoe, 0, -0.04, -0.01);
    addM(b, GEO.box(0.094, 0.014, 0.205, 0.006), pmat('sole', { color: 0x2a1a14, roughness: 0.7 }), 0, -0.064, 0.025);
    addM(b, GEO.box(0.06, 0.03, 0.04, 0.008), pmat('sole', {}), 0, -0.05, -0.06);
    addM(b, GEO.box(0.1, 0.009, 0.016, 0.004), shoe, 0, -0.006, 0.03, 0, 0, 0); addM(b, GEO.box(0.014, 0.012, 0.004, 0.002), silver, sx * 0.048, -0.006, 0.032);
  }
  // ---- skirt (tartan, pleated) with a lace petticoat edge
  addM(R.hips, pleatedSkirt(0.145, 0.26, 0.36, 14, skirtM), skirtM, 0, -0.1, 0, 0, 0, 0, 1, 1, 0.86);
  addM(R.hips, GEO.cyl(0.255, 0.262, 0.03, 40, 1, true), pmat('petticoat', { color: 0xf2eee8, roughness: 0.9, side: THREE.DoubleSide, map: TEX.fabric }), 0, -0.285, 0, 0, 0, 0, 1, 1, 0.86);
  addM(R.hips, GEO.cyl(0.15, 0.15, 0.04, 28), skirtM, 0, 0.07, 0, 0, 0, 0, 1, 1, 0.86);
  // ---- cardigan (open front) over a blouse with a Peter Pan collar and a red ribbon
  const cp = [[0, -0.1], [0.172, -0.1], [0.176, -0.02], [0.16, 0.12], [0.175, 0.26], [0.16, 0.34], [0.09, 0.39], [0, 0.4]];
  addM(R.torso, foldLathe(cp, 36, 0.025, 6, 0.74), knit, 0, 0, 0);
  addM(R.torso, GEO.tor(0.172, 0.016, TAU, 8, 36), knitRib, 0, -0.085, 0, HP, 0, 0, 1, 0.74, 1);
  const vf = new THREE.Shape(); vf.moveTo(-0.055, 0.36); vf.lineTo(0.055, 0.36); vf.lineTo(0.03, -0.08); vf.lineTo(-0.03, -0.08); vf.lineTo(-0.055, 0.36);
  addM(R.torso, new THREE.ShapeGeometry(vf), blouse, 0, 0, 0.123, -0.06);
  for (let k = 0; k < 4; k++) { addM(R.torso, GEO.sph(0.006, 8, 6), pmat('btnW', { color: 0xe8e0d0, roughness: 0.3 }), 0, 0.26 - k * 0.08, 0.128); for (const sx of [-1, 1]) addM(R.torso, GEO.cyl(0.008, 0.008, 0.004, 10), pmat('btnC', { color: 0x9a8a6a, roughness: 0.3, metalness: 0.4 }), sx * 0.052, 0.24 - k * 0.085, 0.12, HP, 0, 0); }
  for (const sx of [-1, 1]) { addM(R.torso, GEO.box(0.012, 0.44, 0.012, 0.004), knitRib, sx * 0.047, 0.13, 0.121, -0.05, 0, sx * -0.06); const pk = grp(R.torso, sx * 0.105, -0.02, 0.116); pk.rotation.y = sx * 0.5; addM(pk, GEO.box(0.07, 0.065, 0.012, 0.006), knit, 0, 0, 0); addM(pk, GEO.box(0.072, 0.012, 0.014, 0.004), knitRib, 0, 0.033, 0.002); }
  { const em = grp(R.torso, -0.095, 0.24, 0.11); em.rotation.y = -0.45; const mo = new THREE.Shape(); mo.absarc(0, 0, 0.018, 0.5, TAU - 0.5, false); mo.absarc(0.008, 0, 0.014, TAU - 0.75, 0.75, true); addM(em, new THREE.ShapeGeometry(mo), pmat('embroid', { color: 0xc8d0e0, roughness: 0.6, emissive: 0x3a4a6a, emissiveIntensity: 0.4 }), 0, 0, 0.004); }
  for (const sx of [-1, 1]) { const c = addM(R.chest, new THREE.CircleGeometry(0.045, 16, 0, PI), blouse, sx * 0.032, 0.085, 0.098, -1.1, 0, sx > 0 ? -0.35 : PI + 0.35); c.material = pmat('collarDS2', { color: 0xf4f0e8, roughness: 0.7, side: THREE.DoubleSide, map: TEX.fabric }); }
  addM(R.chest, GEO.cyl(0.05, 0.055, 0.06, 16), blouse, 0, 0.11, 0);
  const bow = grp(R.chest, 0, 0.075, 0.118); addM(bow, GEO.sph(0.012, 10, 8), ribbonM, 0, 0, 0.004); for (const sx of [-1, 1]) { addM(bow, GEO.cone(0.022, 0.045, 10), ribbonM, sx * 0.026, 0, 0, 0, 0, sx * HP, 1, 1, 0.45); addM(bow, GEO.box(0.016, 0.075, 0.003, 0.002), ribbonM, sx * 0.012, -0.045, 0.004, 0, 0, sx * 0.25); }
  // amulet: a crescent pendant on a fine chain (glows when a ghost is near — see renderFrame)
  for (let k = 0; k < 10; k++) { const a = -0.5 + k / 9; addM(R.chest, GEO.tor(0.0035, 0.0009, TAU, 3, 6), silver, Math.sin(a) * 0.05, 0.06 - Math.cos(a * 1.2) * 0.04 + 0.02, 0.112 + Math.cos(a) * 0.004, 0, (k % 2) * HP, 0); }
  { const mo = new THREE.Shape(); mo.absarc(0, 0, 0.02, 0.6, TAU - 0.6, false); mo.absarc(0.009, 0, 0.016, TAU - 0.9, 0.9, true); const am = addM(R.chest, GEO.ext(mo, 0.004, 0.0015), pmat('amulet', { color: 0x9adfff, emissive: 0x5ac8ff, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.3 }), 0, 0.005, 0.125, 0, 0, -HP); am.castShadow = false; am.userData.keep = true; R.amulet = am; }
  // satchel strap across the body and the bag on the right hip
  addM(R.torso, GEO.box(0.028, 0.56, 0.008, 0.003), leather, 0.0, 0.16, 0.125, 0, 0, 0.72); addM(R.torso, GEO.box(0.028, 0.56, 0.008, 0.003), leather, 0.0, 0.16, -0.12, 0, 0, -0.72);
  { const sat = grp(R.torso, 0.175, -0.07, 0.035); sat.rotation.y = -0.15; addM(sat, GEO.box(0.06, 0.17, 0.21, 0.025), leather, 0, 0, 0); addM(sat, GEO.box(0.066, 0.09, 0.215, 0.02), pmat('satchelFlap', { color: 0x5a3418, roughness: 0.5, map: TEX.leather }), 0.004, 0.045, 0); addM(sat, GEO.box(0.01, 0.024, 0.03, 0.003), brass, 0.035, 0.005, 0); addM(sat, GEO.box(0.004, 0.06, 0.012, 0.002), leather, 0.034, 0.03, 0); }
  // ---- arms: knit sleeves with ribbed cuffs and the blouse cuff peeking out
  for (const [A, sx] of [[R.aL, 1], [R.aR, -1]]) {
    addM(A.sh, GEO.sph(0.06, 16, 12), knit, 0, -0.004, 0);
    foldTube(A.sh, 0.056, 0.049, 0.25, knit, 0.06);
    foldTube(A.el, 0.049, 0.044, 0.19, knit, 0.05);
    addM(A.el, GEO.tor(0.045, 0.011, TAU, 8, 18), knitRib, 0, -0.19, 0, HP, 0, 0);
    addM(A.el, GEO.cyl(0.04, 0.042, 0.03, 16), blouse, 0, -0.212, 0);
    makeHand(A.hand, sx, skin, null, sx > 0 ? 1.0 : 0.35, sx > 0 ? 0.8 : 0.25);
  }
  // ---- the spirit lantern (left hand): hexagonal brass cage, glass, blue flame, a talisman tied on
  const ln = grp(R.aL.hand, 0, -0.07, 0.01); R.lanternG = ln;
  addM(ln, GEO.tor(0.026, 0.0045, PI, 6, 12), brass, 0, 0.0, 0, 0, HP, 0);
  for (let k = 0; k < 5; k++) addM(ln, GEO.tor(0.005, 0.0012, TAU, 3, 6), brass, 0, -0.03 - k * 0.011, 0, 0, (k % 2) * HP, 0);
  const cage = grp(ln, 0, -0.17, 0); R.lanternCage = cage;
  addM(cage, GEO.cone(0.058, 0.05, 6), brass, 0, 0.115, 0); addM(cage, GEO.cyl(0.012, 0.016, 0.02, 8), brass, 0, 0.145, 0); addM(cage, GEO.tor(0.012, 0.003, TAU, 4, 10), brass, 0, 0.16, 0);
  addM(cage, GEO.cyl(0.062, 0.062, 0.02, 6), brass, 0, 0.088, 0); addM(cage, GEO.cyl(0.064, 0.058, 0.03, 6), brass, 0, -0.085, 0); addM(cage, GEO.cyl(0.04, 0.05, 0.02, 6), brass, 0, -0.105, 0);
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + PI / 6; addM(cage, GEO.box(0.007, 0.17, 0.007), brass, Math.cos(a) * 0.058, 0.0, Math.sin(a) * 0.058, 0, -a, 0); }
  addM(cage, GEO.cyl(0.055, 0.055, 0.16, 6, 1, true), pmat('lglass', { color: 0x9adcff, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 }), 0, 0.0, 0);
  addM(cage, GEO.cyl(0.006, 0.008, 0.03, 8), pmat('wick', { color: 0xe8e0d0, roughness: 0.8 }), 0, -0.055, 0);
  const flame = addM(cage, GEO.sph(0.022, 12, 10), new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -0.005, 0, 0, 0, 0, 0.8, 1.6, 0.8); flame.castShadow = false; flame.userData.keep = true; R.spiritFlame = flame;
  addM(cage, GEO.plane(0.03, 0.09), stdMat({ map: talismanTex(), roughness: 0.9, side: THREE.DoubleSide }, 'talisman', false), 0.062, -0.08, 0.0, 0, HP, 0.1);
  // ---- head: softer jaw, big painted eyes with a faint spirit glow, flicked lashes, blush, a beauty mark; hime-cut hair
  const r = 0.122, ho = { jaw: 0.2, chin: 0.045, cheek: 1.1 };
  const skull = makeHead(R, R.head, r, 0.13, [0.04, 0.048], skin, ho, {
    key: 'B', sep: 0.36, ey: -0.02, ew: 44, eh: 40, irisK: 0.7, iris: ['#16304a', '#3f78a8', '#9fd6ff', '#0c1a2a'], glow: 1, lash: '#0a0810', lashW: 6, flick: 1,
    browE: 0.22, browC: 'rgba(30,22,34,.9)', browW: 4, browTilt: 1, mouthE: -0.42, mouthW: 11, mouthCurve: 3, mouthC: 'rgba(150,60,70,.9)', lip: 'rgba(220,120,130,.45)', blush: 0.3, mole: [-0.25, -0.27], noseE: -0.21, nose: 0.85 }, false);
  hairCap(skull, r, hairM, -0.4, 0.49);
  const hr = mulberry32(57), back = grp(skull, 0, -0.03, -0.11); R.hairBack = back;
  for (let k = 0; k < 56; k++) {
    const ph = (k / 56) * TAU, a = Math.abs(angDiff(0, ph)), sx = Math.sign(Math.sin(ph)) || 1;
    if (a < 0.8) { // straight blunt bangs to the brows
      strand(skull, hairM, hairPath(r, ph, 0.12, 1.28 + Math.cos(ph * 7) * 0.03, { lift: 1.065 + (k % 2) * 0.01, puff: 0.04, tw: ph * -0.12 }), 0.017, 0.022, 0.0065, true);
    } else if (a < 1.35) { // side locks framing the face, cut at the chin
      strand(skull, hairM, hairPath(r, ph, 0.12, 1.45, { lift: 1.08 + (k % 2) * 0.01, puff: 0.03, hang: 0.16 + (a - 0.8) * 0.12, flare: 0.006, curl: 0.01, sway: -sx * 0.008 }), 0.018, 0.022, 0.007, true);
    } else { // the long back mass: scalp part on the skull, the hanging part in the swaying group
      const pts = hairPath(r, ph, 0.1, 1.72, { lift: 1.07 + (k % 3) * 0.01, puff: 0.03, hang: 0.4 - (a - 1.35) * 0.05 + hr() * 0.04, flare: 0.03, curl: 0.03, sway: sx * 0.01 });
      strand(skull, hairM, pts.slice(0, pts.scalpN), 0.017, 0.024, 0.007, true);
      const off = back.position, hang = pts.slice(pts.scalpN - 2).map(p => p.clone().sub(off));
      strand(back, hairM, hang, 0.024, 0.02, 0.007, true);
    }
  }
  const clip = grp(skull, 0.08, 0.06, 0.075); clip.rotation.set(0, 0.7, -0.5); clip.scale.setScalar(0.7); const mo = new THREE.Shape(); mo.absarc(0, 0, 0.022, 0.5, TAU - 0.5, false); mo.absarc(0.01, 0, 0.017, TAU - 0.7, 0.7, true); addM(clip, GEO.ext(mo, 0.005, 0.0015), pmat('clip', { color: 0xd8dce4, roughness: 0.15, metalness: 0.9, emissive: 0x2a3a5a, emissiveIntensity: 0.5 }), 0, 0, 0);
  mergeRig(R.root); R.kind = 'S';
  return R;
}
/* idle life: blinking and a little head motion (called from poseChar) */
function heroIdle(R, t, p) {
  if (!R.faceO) return;
  R.blinkT = R.blinkT == null ? 1 + Math.random() * 3 : R.blinkT - (R._lt != null ? t - R._lt : 0); R._lt = t;
  if (R.blinkT <= 0) R.blinkT = 2 + Math.random() * 3.5;
  const shut = p.down || R.blinkT < 0.12;
  R.faceO.visible = !shut; R.faceC.visible = shut;
}
