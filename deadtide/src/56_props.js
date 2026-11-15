/* ================= props: new searchables / gatherables, buildable obstacles, ladders, build-plan ghosts, x-ray ring ================= */
const PROP = {};   // block id -> { m: InstancedMesh, n, col, al: align to walls }
function propScene() {
  const nI = g => g.index ? g.toNonIndexed() : g, M = gs => THREE.mergeGeometries(gs.map(nI), false);
  const cyl = (rt, rb, h, s, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(rt, rb, h, s || 8).translate(x, y, z);
  const ico = (r, x, y, z, d = 0) => new THREE.IcosahedronGeometry(r, d).translate(x, y, z);
  const G = {
    32: M([cyl(0.2, 0.17, 0.52, 9, 0, 0.26, 0), cyl(0.22, 0.22, 0.05, 9, 0, 0.54, 0), boxG(0.12, 0.03, 0.04, 0, 0.58, 0)]),                         // trash bin
    33: M([boxG(0.3, 0.16, 0.24, 0, 0.08, 0), boxG(0.12, 0.1, 0.2, 0.14, 0.06, 0), cyl(0.06, 0.06, 0.26, 7, -0.12, 0.2, 0).rotateX(Math.PI / 2)]),     // backpack
    34: M([boxG(0.46, 0.86, 0.72, 0, 0.43, 0), boxG(0.02, 0.02, 0.6, 0.235, 0.58, 0), boxG(0.02, 0.02, 0.6, 0.235, 0.3, 0), boxG(0.03, 0.06, 0.06, 0.24, 0.72, 0.2)]), // cabinet
    35: M([boxG(0.36, 0.16, 0.2, 0, 0.08, 0), boxG(0.04, 0.08, 0.03, -0.1, 0.2, 0), boxG(0.04, 0.08, 0.03, 0.1, 0.2, 0), boxG(0.24, 0.03, 0.03, 0, 0.24, 0)]), // toolbox
    36: M([boxG(0.72, 0.42, 0.5, 0, 0.21, 0), boxG(0.74, 0.06, 0.52, 0, 0.36, 0), boxG(0.06, 0.1, 0.2, 0.37, 0.25, 0), boxG(0.06, 0.1, 0.2, -0.37, 0.25, 0)]), // military crate
    37: M([cyl(0.25, 0.25, 0.74, 10, 0, 0.37, 0), cyl(0.265, 0.265, 0.05, 10, 0, 0.2, 0), cyl(0.265, 0.265, 0.05, 10, 0, 0.55, 0)]),                  // oil barrel
    38: M([boxG(0.62, 1.25, 0.66, 0, 0.625, 0), boxG(0.04, 0.6, 0.44, 0.32, 0.78, -0.06), boxG(0.05, 0.16, 0.12, 0.33, 0.35, 0.18)]),                // vending machine
    39: M([boxG(0.5, 0.18, 0.36, -0.1, 0.09, 0.05).rotateY(0.4), cyl(0.12, 0.12, 0.5, 7, 0.15, 0.14, -0.1).rotateZ(1.3), boxG(0.3, 0.3, 0.06, 0.05, 0.2, 0.18).rotateX(0.6), ico(0.16, -0.18, 0.18, -0.15)]), // scrap heap
    40: M([cyl(0.13, 0.13, 0.9, 7, 0, 0.13, -0.14).rotateZ(Math.PI / 2), cyl(0.13, 0.13, 0.9, 7, 0, 0.13, 0.14).rotateZ(Math.PI / 2), cyl(0.12, 0.12, 0.85, 7, 0, 0.36, 0).rotateZ(Math.PI / 2)]), // log pile
    41: M([ico(0.26, 0, 0.24, 0, 0), ico(0.2, 0.18, 0.18, 0.12, 0), ico(0.18, -0.16, 0.17, -0.1, 0), ico(0.15, 0.05, 0.38, -0.12, 0)]),              // bush
    12: M((() => { const a = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { const g = new THREE.SphereGeometry(0.5, 7, 4); g.scale(0.36, 0.17, 0.42); g.translate(-0.33 + k * 0.33 + (r % 2 ? 0.16 : 0) - (r % 2 && k === 2 ? 0.66 : 0), 0.09 + r * 0.17, 0); a.push(g); } return a; })()), // sandbags
    13: M([boxG(0.9, 0.08, 0.08, 0, 0.35, 0).rotateZ(0.6), boxG(0.9, 0.08, 0.08, 0, 0.35, 0).rotateZ(-0.6), boxG(0.08, 0.08, 0.9, 0, 0.35, 0).rotateX(0.6), boxG(0.08, 0.08, 0.9, 0, 0.35, 0).rotateX(-0.6), new THREE.ConeGeometry(0.04, 0.2, 4).translate(0.42, 0.62, 0), new THREE.ConeGeometry(0.04, 0.2, 4).translate(-0.42, 0.62, 0)]), // cheval de frise
    14: M([boxG(0.12, 0.85, 0.98, 0, 0.425, 0), boxG(0.3, 0.06, 0.06, -0.15, 0.3, 0.42).rotateZ(-0.7), boxG(0.3, 0.06, 0.06, -0.15, 0.3, -0.42).rotateZ(-0.7), boxG(0.14, 0.04, 1.0, 0, 0.84, 0)]), // steel cover
    15: M([new THREE.TorusGeometry(0.17, 0.025, 4, 12).rotateX(Math.PI / 2).translate(0, 0.03, 0), boxG(0.3, 0.02, 0.06, 0, 0.02, 0), ...[0, 1, 2, 3, 4, 5].map(k => new THREE.ConeGeometry(0.02, 0.07, 3).translate(Math.cos(k * 1.05) * 0.15, 0.06, Math.sin(k * 1.05) * 0.15))]), // bear trap
    6: M([boxG(0.05, FH + 0.4, 0.05, 0.445, (FH + 0.4) / 2, -0.24), boxG(0.05, FH + 0.4, 0.05, 0.445, (FH + 0.4) / 2, 0.24), ...[0, 1, 2, 3, 4, 5].map(k => boxG(0.04, 0.035, 0.46, 0.445, 0.18 + k * 0.24, 0)), boxG(0.04, 0.04, 0.04, 0.47, FH * 0.3, -0.24), boxG(0.04, 0.04, 0.04, 0.47, FH * 0.75, 0.24)]), // ladder hung flat on the wall
  };
  G[42] = M([boxG(0.06, 0.9, 0.06, 0, 0.45, -0.44), boxG(0.06, 0.9, 0.06, 0, 0.45, 0.44), boxG(0.06, 0.9, 0.06, 0, 0.45, 0), boxG(0.07, 0.06, 1, 0, 0.88, 0), boxG(0.04, 0.04, 1, 0, 0.45, 0)]);
  const C = { 42: '#7a8088', 32: '#3f5a3a', 33: '#5a4a2e', 34: '#6a4a30', 35: '#a8322a', 36: '#4f5a32', 37: '#9a3a2a', 38: '#b8333a', 39: '#7a5a44', 40: '#6a4a2c', 41: '#3e5f2e', 12: '#a8946a', 13: '#6a5038', 14: '#7a8590', 15: '#5a5a55', 6: '#8a6440' };
  const cap = { 42: 2500, 41: 3000, 40: 600, 39: 600, 12: 1500, 13: 800, 14: 800, 15: 400, 6: 400, 32: 400, 34: 400 };
  for (const id in G) { const m = inst(G[id], lam('#ffffff'), cap[id] || 300); m.castShadow = id == 38 || id == 34; PROP[id] = { m, n: 0, col: C[id], al: id == 12 || id == 13 || id == 14 }; }
  // build-plan ghosts and the x-ray ring that shows survivors through walls
  OBJ.planI = inst(boxG(1, 1, 1, 0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false }), 64, false);
  OBJ.xray = inst(new THREE.RingGeometry(0.3, 0.4, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthTest: false, depthWrite: false }), 4, false);
  OBJ.xray.renderOrder = 999;
  OBJ.lockI = inst(new THREE.RingGeometry(0.78, 1, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthTest: false, depthWrite: false }), 1, false); OBJ.lockI.renderOrder = 998;
  OBJ.ringI = inst(new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 8, false);
}
function propBegin() { for (const id in PROP) PROP[id].n = 0; }
// returns true if it drew block b
function propPut(b, i, x, y, L, X, Y, Z, h) {
  const P = PROP[b]; if (!P) return false;
  if (P.n >= P.m.instanceMatrix.count) return true;
  let rot = h * 6.28, col = P.col, sc = 1;
  if (P.al) rot = wallAxis(x, y, L) ? 0 : Math.PI / 2;
  if (b === 6) { rot = -W.bdir[i] * Math.PI / 2; col = '#e2a43a'; }
  if (b === 42) { const r = (xx, yy) => { const q = blkAt(xx, yy, L); return q === 42 || (q && B[q].top); }; rot = r(x - 1, y) || r(x + 1, y) ? Math.PI / 2 : 0; }
  if (b === 37) col = ['#9a3a2a', '#2f5a8a', '#c9a23a'][Math.floor(h * 3)];
  if (b === 38 && W.srch.has(i)) col = '#5a2a2c';
  if (b === 41) sc = 0.8 + h * 0.5;
  if (b === 15 || b === 33 || b === 35) rot = h * 6.28;
  if (B[b].brk && W.bhp[i] && B[b].hp) col = dmgTint(col, W.bhp[i] / B[b].hp);
  setInst(P.m, P.n++, X, Y, Z, rot, sc, sc, sc, col);
  return true;
}
function propEnd() { for (const id in PROP) { const P = PROP[id]; P.m.count = P.n; P.m.instanceMatrix.needsUpdate = true; if (P.m.instanceColor) P.m.instanceColor.needsUpdate = true; } }
// translucent boxes for the plan waiting for confirmation (pulsing) and the one being drawn
function drawPlan() {
  const I = OBJ.planI, P = typeof PLAN !== 'undefined' && (PLAN || PREV); let n = 0;
  if (P && W.p[ME] && W.p[ME].build) {
    const slab = !P.demo && B[P.id] && B[P.id].slab, low = !P.demo && B[P.id] && (B[P.id].dep || B[P.id].vault);
    for (const c of P.cells) {
      if (n >= 64) break; const h = slab ? 0.14 : low ? 0.6 : FH * 0.98;
      setInst(I, n++, c.x + 0.5, c.L * FH + (slab ? -0.12 : 0.01), c.y + 0.5, 0, 1.02, h, 1.02, P.demo ? '#ff5a4a' : '#7dff8a');
    }
    I.material.opacity = P === PLAN ? 0.32 + Math.sin(W.t * 6) * 0.12 : 0.28;
  }
  I.count = n; I.instanceMatrix.needsUpdate = true; if (I.instanceColor) I.instanceColor.needsUpdate = true;
  // x-ray rings: always drawn on top, so a survivor behind a building is never lost
  const X = OBJ.xray; let k = 0;
  for (const p of W.p) { if (p.gone || p.dead || !OBJ.pl[p.i] || !OBJ.pl[p.i].g.visible) continue; setInst(X, k++, p.x, (p.zv != null ? p.zv : p.z) + 0.03, p.y, 0, 1, 1, 1, PCOL[p.i % 2].j); }
  X.count = k; X.instanceMatrix.needsUpdate = true; if (X.instanceColor) X.instanceColor.needsUpdate = true;
  const LI = OBJ.lockI, lk = typeof INP !== 'undefined' && INP.lockShow; LI.count = 0;
  if (lk) { const z = lk.zb, s = z.r * 2.3 * (1 + Math.sin(W.t * 10) * 0.06); setInst(LI, 0, z.x, z.z + 0.04, z.y, W.t * 1.5, s, 1, s, lk.head ? '#ffd23a' : '#ff4a3a'); LI.count = 1; LI.instanceMatrix.needsUpdate = true; if (LI.instanceColor) LI.instanceColor.needsUpdate = true; }
  // scream shockwaves
  const R = OBJ.ringI; let r = 0; RND.rings = (RND.rings || []).filter(q => (q.t += 1 / 60) < 0.8);
  for (const q of RND.rings) { if (r >= 8) break; const s = 0.5 + q.t * BAL.screamR * 1.1; setInst(R, r++, q.x, q.z + 0.1, q.y, 0, s, 1, s, '#ff5a8a'); }
  R.count = r; R.material.opacity = RND.rings.length ? 0.6 * (1 - RND.rings[0].t / 0.8) : 0; R.instanceMatrix.needsUpdate = true; if (R.instanceColor) R.instanceColor.needsUpdate = true;
}
