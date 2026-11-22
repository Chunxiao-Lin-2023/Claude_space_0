/* ================= vehicles (round 27): detailed models, spinning wheels, steering, lights, riding poses ================= */
// Local frame of every vehicle: forward = +x, up = +y, the driver's hips sit over x = 0 and the back-seat rider over x = -PILLION.
// Each player owns one set of the four models (only the one being ridden is visible); moving parts are listed in userData.S.
const _vUp = new THREE.Vector3(0, 1, 0), _vw = new THREE.Vector3(), _vax = new THREE.Vector3();
const vLit = (c, e, k) => new THREE.MeshLambertMaterial({ color: c, emissive: e, emissiveIntensity: k, flatShading: true }); // per vehicle, so each can glow on its own
function vBox(par, mat, w, h, d, x, y, z, rz, ry, rx) { const m = new THREE.Mesh(boxG(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); par.add(m); return m; }
function vRod(par, mat, a, b, r, seg) { // a cylinder from point a to point b
  _vw.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _vw.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg || 6), mat); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(_vUp, _vw.normalize()); par.add(m); return m;
}
function vCyl(par, mat, r1, r2, h, x, y, z, axis, seg) { // axis: 'x' | 'y' | 'z'
  const g = new THREE.CylinderGeometry(r1, r2, h, seg || 10); if (axis === 'x') g.rotateZ(-Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); par.add(m); return m;
}
function vMark(par, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); par.add(o); return o; }
function vArc(par, mat, r, w, a0, a1, x, y, z) { // a mudguard: a thin band over the wheel from angle a0 to a1 (0 = forward, PI/2 = up)
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 4, 14, a1 - a0), mat); m.rotation.z = a0; m.scale.z = w / 0.024; m.position.set(x, y, z); par.add(m); return m;
}
// a wheel: the returned pivot steers (rotation.y), the inner group spins (rotation.z)
function vWheel(par, x, z, r, w, kind) {
  const piv = new THREE.Group(); piv.position.set(x, r, z); par.add(piv);
  const g = new THREE.Group(); piv.add(g);
  const tire = new THREE.Mesh(new THREE.TorusGeometry(r - w * 0.5, w * 0.5, 6, 20), lam('#1b1b1d')); g.add(tire);
  const rimR = r - w * 0.95;
  if (kind === 'armor') {
    tire.scale.z = 1.5;
    vCyl(g, lam('#4a5232'), rimR, rimR, w * 0.9, 0, 0, 0, 'z', 10);                       // steel disc wheel
    vCyl(g, lam('#2c3020'), rimR * 0.4, rimR * 0.4, w * 1.05, 0, 0, 0, 'z', 8);           // hub
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; vBox(g, lam('#9a9a8a'), 0.022, 0.022, w * 1.1, Math.cos(a) * rimR * 0.65, Math.sin(a) * rimR * 0.65, 0); } // wheel nuts
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; vBox(g, lam('#111'), 0.04, 0.05, w * 1.35, Math.cos(a) * (r - 0.012), Math.sin(a) * (r - 0.012), 0, a); } // tread blocks
  } else {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, kind === 'moto' ? 0.018 : 0.01, 4, 20), lam(kind === 'moto' ? '#3a3d42' : '#c9ccd0')); g.add(rim);
    vCyl(g, lam('#9a9ea4'), 0.028, 0.028, w + 0.03, 0, 0, 0, 'z', 8);                      // hub
    if (kind === 'moto') {
      for (let k = 0; k < 5; k++) { const s = vBox(g, lam('#3a3d42'), 0.03, rimR, 0.03, 0, 0, 0, k / 5 * Math.PI * 2); s.geometry.translate(0, rimR / 2, 0); } // cast spokes
      vCyl(g, lam('#b4b8bd'), rimR * 0.55, rimR * 0.55, 0.008, 0, 0, w * 0.5 + 0.01, 'z', 14); // brake disc
    } else {
      for (let k = 0; k < 12; k++) { const s = vBox(g, lam('#d4d7db'), 0.005, rimR, 0.005, 0, 0, (k % 2 ? 1 : -1) * 0.012, k / 12 * Math.PI * 2 + (k % 2) * 0.12); s.geometry.translate(0, rimR / 2, 0); } // wire spokes
    }
  }
  return { piv, g, r };
}
function vLights(S, v, head, tail, beamAt) {
  S.head = head; S.tail = tail;
  if (beamAt) { // a faint cone of headlight on the ground, only at night
    const geo = new THREE.ConeGeometry(0.75, 2.4, 14, 1, true); geo.rotateZ(Math.PI / 2); geo.translate(1.2, 0, 0);
    const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffe9b0', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(beamAt[0], beamAt[1], beamAt[2]); beam.rotation.z = -0.2; beam.visible = false; (beamAt[3] || v).add(beam); S.beam = beam;
  }
}

function mkBike() {
  const v = new THREE.Group(), S = { spin: [], steer: [] }, fm = lam('#c0392b'), dk = lam('#232323'), cr = lam('#c4c8cc');
  S.spin.push(vWheel(v, -0.36, 0, 0.22, 0.04, 'bike'));
  const BB = [0.04, 0.25, 0], ST = [-0.05, 0.56, 0], HT = [0.3, 0.58, 0], HB = [0.32, 0.47, 0], RA = [-0.36, 0.22];
  vRod(v, fm, BB, ST, 0.02); vRod(v, fm, ST, HT, 0.017); vRod(v, fm, BB, HB, 0.022); vRod(v, fm, HB, HT, 0.026);         // diamond frame
  for (const s of [-1, 1]) { vRod(v, fm, BB, [RA[0], RA[1], s * 0.05], 0.011); vRod(v, fm, ST, [RA[0], RA[1], s * 0.05], 0.01); } // chain- and seatstays
  vRod(v, cr, ST, [-0.04, 0.6, 0], 0.011);                                                                              // seatpost
  vBox(v, dk, 0.19, 0.035, 0.08, -0.02, 0.605, 0); vBox(v, dk, 0.08, 0.04, 0.14, -0.09, 0.605, 0);                         // saddle (nose + wide back)
  vArc(v, cr, 0.25, 0.06, 0.15 * Math.PI, 0.85 * Math.PI, RA[0], RA[1], 0);                                              // rear mudguard
  vBox(v, cr, 0.22, 0.012, 0.11, -0.3, 0.5, 0); vRod(v, cr, [-0.2, 0.5, 0.05], [-0.36, 0.22, 0.05], 0.007); vRod(v, cr, [-0.2, 0.5, -0.05], [-0.36, 0.22, -0.05], 0.007); // rear rack
  const tl = vLit('#b0231b', '#ff2a1a', 0.3); vBox(v, tl, 0.02, 0.035, 0.05, -0.42, 0.5, 0);                            // tail reflector
  vCyl(v, lam('#e8e2c8'), 0.022, 0.022, 0.12, 0.17, 0.39, 0, 'y', 8).rotation.z = -0.95;                                 // water bottle on the down tube
  vCyl(v, cr, 0.07, 0.07, 0.008, BB[0], BB[1], 0.05, 'z', 14); vCyl(v, cr, 0.03, 0.03, 0.008, RA[0], RA[1], 0.05, 'z', 10); // chainring + cog
  vRod(v, dk, [BB[0], BB[1] + 0.07, 0.05], [RA[0], RA[1] + 0.03, 0.05], 0.005); vRod(v, dk, [BB[0], BB[1] - 0.07, 0.05], [RA[0], RA[1] - 0.03, 0.05], 0.005); // chain
  const ck = new THREE.Group(); ck.position.set(BB[0], BB[1], 0); v.add(ck); S.crank = ck; S.pedals = [];
  for (const s of [1, -1]) { const arm = vBox(ck, cr, 0.016, 0.1, 0.014, 0, -s * 0.05, s * 0.065); arm.userData = 0; const pd = new THREE.Group(); pd.position.set(0, -s * 0.1, s * 0.1); ck.add(pd); vBox(pd, dk, 0.07, 0.014, 0.05, 0, 0, 0); S.pedals.push(pd); }
  // steering: fork, stem, bars, lamp, bell and the front wheel turn together about the head tube
  const st = new THREE.Group(); st.position.set(HT[0], 0, 0); v.add(st); S.steer.push(st);
  S.spin.push(vWheel(st, 0.1, 0, 0.22, 0.04, 'bike'));
  for (const s of [-1, 1]) vRod(st, fm, [0.02, 0.47, s * 0.035], [0.1, 0.22, s * 0.035], 0.011);                         // fork blades
  vArc(st, cr, 0.25, 0.06, 0.25 * Math.PI, 0.7 * Math.PI, 0.1, 0.22, 0);                                                 // front mudguard
  vRod(st, cr, [0, 0.58, 0], [-0.02, 0.71, 0], 0.012); vRod(st, cr, [-0.02, 0.71, -0.21], [-0.02, 0.71, 0.21], 0.011);     // stem + bar
  for (const s of [-1, 1]) vCyl(st, dk, 0.016, 0.016, 0.07, -0.05, 0.71, s * 0.2, 'z', 6);                                 // grips
  vCyl(st, lam('#d9b13a'), 0.018, 0.012, 0.02, -0.02, 0.73, 0.13, 'y', 8);                                                 // bell
  const hl = vLit('#fff4cf', '#ffe08a', 0.5); vBox(st, dk, 0.05, 0.04, 0.05, 0.03, 0.66, 0); vBox(st, hl, 0.012, 0.03, 0.04, 0.057, 0.66, 0); // lamp
  S.grip = [vMark(st, -0.05, 0.715, -0.2), vMark(st, -0.05, 0.715, 0.2)];
  vLights(S, v, [hl], [tl], [0.07, 0.66, 0, st]);
  S.dust = [RA[0], 0.02, 0]; v.userData.S = S; return v;
}

function mkMoto() {
  const v = new THREE.Group(), S = { spin: [], steer: [] }, fr = lam('#1d1f22'), tk = lam('#b8322a'), cr = lam('#c9ccd0'), dk = lam('#141414'), eg = lam('#3a3d42');
  S.spin.push(vWheel(v, -0.52, 0, 0.25, 0.1, 'moto'));
  for (const s of [-1, 1]) {
    vRod(v, fr, [-0.1, 0.3, s * 0.08], [-0.52, 0.25, s * 0.08], 0.02);                                                    // swingarm
    vRod(v, lam('#d9a520'), [-0.42, 0.28, s * 0.1], [-0.3, 0.6, s * 0.1], 0.024); vRod(v, cr, [-0.43, 0.26, s * 0.1], [-0.29, 0.63, s * 0.1], 0.011); // rear shocks (spring over a rod)
    vRod(v, cr, [-0.3, 0.7, s * 0.13], [-0.55, 0.72, s * 0.13], 0.011);                                                   // grab rail sides
    vRod(v, fr, [-0.34, 0.66, s * 0.12], [-0.31, 0.4, s * 0.15], 0.012); vRod(v, cr, [-0.31, 0.38, s * 0.11], [-0.31, 0.38, s * 0.21], 0.012); // pillion footpeg + hanger
    vRod(v, cr, [0.06, 0.3, s * 0.1], [0.06, 0.3, s * 0.2], 0.013);                                                        // rider footpeg
  }
  vRod(v, cr, [-0.55, 0.72, -0.13], [-0.55, 0.72, 0.13], 0.011);                                                          // grab rail back
  // engine: crankcase, finned cylinder, side cover, carburettor
  vBox(v, eg, 0.32, 0.2, 0.2, 0.06, 0.33, 0); vCyl(v, cr, 0.075, 0.075, 0.02, 0.0, 0.31, 0.105, 'z', 12); vCyl(v, cr, 0.05, 0.05, 0.02, 0.15, 0.3, -0.105, 'z', 10);
  const cyl = new THREE.Group(); cyl.position.set(0.17, 0.46, 0); cyl.rotation.z = -0.32; v.add(cyl);
  vBox(cyl, eg, 0.13, 0.2, 0.15, 0, 0, 0); for (let k = 0; k < 5; k++) vBox(cyl, lam('#55595f'), 0.17, 0.014, 0.19, 0, -0.07 + k * 0.035, 0);
  vCyl(v, dk, 0.035, 0.035, 0.08, -0.02, 0.47, 0, 'z', 8);
  // frame: backbone, down tube, cradle
  vRod(v, fr, [0.34, 0.7, 0], [0.0, 0.62, 0], 0.026); vRod(v, fr, [0.0, 0.62, 0], [-0.32, 0.6, 0], 0.022); vRod(v, fr, [0.34, 0.64, 0], [0.24, 0.24, 0], 0.024); vRod(v, fr, [0.24, 0.24, 0], [-0.12, 0.24, 0], 0.022);
  // tank with a stripe and filler cap, side panel, seats
  vBox(v, tk, 0.33, 0.15, 0.25, 0.18, 0.7, 0, 0.08); vBox(v, tk, 0.26, 0.04, 0.2, 0.17, 0.785, 0, 0.08);
  for (const s of [-1, 1]) vBox(v, lam('#efe6d0'), 0.27, 0.025, 0.004, 0.18, 0.715, s * 0.126, 0.08);
  vCyl(v, cr, 0.025, 0.025, 0.02, 0.22, 0.81, 0, 'y', 8);
  vBox(v, lam('#2b2d31'), 0.2, 0.15, 0.22, -0.15, 0.52, 0); vCyl(v, lam('#efe6d0'), 0.05, 0.05, 0.004, -0.15, 0.53, 0.112, 'z', 10); // side panel + number disc
  vBox(v, dk, 0.32, 0.07, 0.26, -0.03, 0.62, 0); vBox(v, dk, 0.08, 0.06, 0.24, -0.21, 0.655, 0, -0.3); vBox(v, dk, 0.28, 0.08, 0.24, -0.37, 0.68, 0); // rider seat, step, pillion seat
  for (const x of [-0.12, 0.06]) vBox(v, lam('#2a2a2a'), 0.006, 0.072, 0.262, x, 0.622, 0);                              // seat stitching
  // tail: cowl, tail light, plate, mudguard
  vBox(v, tk, 0.2, 0.09, 0.2, -0.6, 0.68, 0, 0.12); const tl = vLit('#c0201a', '#ff2010', 0.35); vBox(v, tl, 0.025, 0.045, 0.13, -0.7, 0.69, 0);
  vBox(v, lam('#e8d26a'), 0.012, 0.07, 0.14, -0.66, 0.55, 0, 0.35); vArc(v, fr, 0.29, 0.12, 0.2 * Math.PI, 0.75 * Math.PI, -0.52, 0.25, 0);
  // exhaust: header pipe, muffler, dark tip
  vRod(v, cr, [0.2, 0.42, 0.085], [0.1, 0.22, 0.12], 0.022); vRod(v, cr, [0.1, 0.22, 0.12], [-0.26, 0.3, 0.15], 0.022);
  vCyl(v, cr, 0.05, 0.042, 0.32, -0.42, 0.33, 0.155, 'x', 10).rotation.z = 0.1; vCyl(v, dk, 0.03, 0.03, 0.03, -0.59, 0.35, 0.155, 'x', 8);
  S.exh = vMark(v, -0.62, 0.35, 0.155);
  // steering head: forks, headlight, screen, bars, mirrors, clocks and the front wheel
  const st = new THREE.Group(); st.position.set(0.36, 0, 0); v.add(st); S.steer.push(st);
  S.spin.push(vWheel(st, 0.19, 0, 0.25, 0.1, 'moto'));
  for (const s of [-1, 1]) { vRod(st, cr, [-0.01, 0.76, s * 0.075], [0.12, 0.42, s * 0.075], 0.018); vRod(st, fr, [0.11, 0.44, s * 0.075], [0.19, 0.25, s * 0.075], 0.026); }
  vBox(st, fr, 0.06, 0.03, 0.2, -0.01, 0.77, 0); vArc(st, tk, 0.29, 0.12, 0.3 * Math.PI, 0.72 * Math.PI, 0.19, 0.25, 0);
  const hl = vLit('#fff4cf', '#ffe08a', 0.6); vCyl(st, cr, 0.07, 0.06, 0.07, 0.1, 0.71, 0, 'x', 12); vCyl(st, hl, 0.058, 0.058, 0.012, 0.14, 0.71, 0, 'x', 12);
  for (const s of [-1, 1]) vBox(st, lit2(), 0.03, 0.025, 0.03, 0.09, 0.7, s * 0.12);                                      // indicators
  vBox(st, lam('#9fc4d8'), 0.012, 0.14, 0.2, 0.07, 0.85, 0, 0.4);                                                        // fly screen
  vCyl(st, lam('#202226'), 0.04, 0.04, 0.03, 0.0, 0.84, 0, 'y', 10).rotation.z = 0.5; vCyl(st, lam('#e8f0d0'), 0.032, 0.032, 0.004, -0.008, 0.857, 0, 'y', 10).rotation.z = 0.5; // clock
  vRod(st, cr, [-0.03, 0.78, -0.1], [-0.05, 0.84, -0.27], 0.012); vRod(st, cr, [-0.03, 0.78, 0.1], [-0.05, 0.84, 0.27], 0.012); // bars
  for (const s of [-1, 1]) { vCyl(st, dk, 0.019, 0.019, 0.09, -0.05, 0.84, s * 0.25, 'z', 6); vRod(st, cr, [-0.03, 0.83, s * 0.17], [0.0, 0.98, s * 0.22], 0.006); vBox(st, dk, 0.02, 0.05, 0.08, 0.0, 1.0, s * 0.23); vBox(st, lam('#bcd2e0'), 0.004, 0.04, 0.065, -0.011, 1.0, s * 0.23); } // grips, mirrors
  S.grip = [vMark(st, -0.06, 0.845, -0.25), vMark(st, -0.06, 0.845, 0.25)];
  vLights(S, v, [hl], [tl], [0.15, 0.71, 0, st]);
  S.dust = [-0.52, 0.02, 0]; v.userData.S = S; return v;
}
function lit2() { return vLit('#d98a1a', '#ff9a1a', 0.25); }

function mkCargo() {
  const v = new THREE.Group(), S = { spin: [], steer: [] }, cm = lam('#3f7a5a'), dk = lam('#232323'), cr = lam('#c4c8cc'), wd = lam('#8a6a44'), wd2 = lam('#6e5236');
  for (const z of [-0.43, 0.43]) S.spin.push(vWheel(v, -0.46, z, 0.2, 0.05, 'bike'));
  vRod(v, cr, [-0.46, 0.2, -0.43], [-0.46, 0.2, 0.43], 0.016);                                                            // rear axle
  const BB = [0.12, 0.27, 0], ST = [-0.05, 0.56, 0], HT = [0.34, 0.58, 0];
  vRod(v, cm, BB, ST, 0.02); vRod(v, cm, ST, HT, 0.018); vRod(v, cm, BB, [0.35, 0.5, 0], 0.022); vRod(v, cm, [0.35, 0.5, 0], HT, 0.026);
  vRod(v, cm, ST, [-0.2, 0.36, 0], 0.02); vRod(v, cm, BB, [-0.2, 0.34, 0], 0.022);                                       // frame into the bed
  vRod(v, cr, ST, [-0.04, 0.6, 0], 0.011); vBox(v, dk, 0.19, 0.035, 0.08, -0.02, 0.605, 0); vBox(v, dk, 0.08, 0.04, 0.15, -0.09, 0.605, 0); // seatpost + saddle
  vCyl(v, cr, 0.07, 0.07, 0.008, BB[0], BB[1], 0.05, 'z', 14); vRod(v, dk, [BB[0], BB[1] + 0.07, 0.05], [-0.46, 0.23, 0.06], 0.005); vRod(v, dk, [BB[0], BB[1] - 0.07, 0.05], [-0.46, 0.17, 0.06], 0.005);
  const ck = new THREE.Group(); ck.position.set(BB[0], BB[1], 0); v.add(ck); S.crank = ck; S.pedals = [];
  for (const s of [1, -1]) { vBox(ck, cr, 0.016, 0.1, 0.014, 0, -s * 0.05, s * 0.065); const pd = new THREE.Group(); pd.position.set(0, -s * 0.1, s * 0.1); ck.add(pd); vBox(pd, dk, 0.07, 0.014, 0.05, 0, 0, 0); S.pedals.push(pd); }
  // cargo bed: plank floor, slatted sides with corner posts, mudguards over the back wheels
  vBox(v, wd2, 0.62, 0.04, 0.7, -0.5, 0.36, 0); for (let k = 0; k < 5; k++) vBox(v, wd, 0.6, 0.006, 0.12, -0.5, 0.383, -0.28 + k * 0.14);
  for (const z of [-0.345, 0.345]) { for (const y of [0.43, 0.51, 0.59]) vBox(v, wd, 0.62, 0.05, 0.022, -0.5, y, z); for (const x of [-0.2, -0.8]) vBox(v, cm, 0.04, 0.3, 0.04, x, 0.5, z); }
  for (const y of [0.43, 0.51]) vBox(v, wd, 0.022, 0.05, 0.7, -0.2, y, 0); for (const y of [0.43, 0.51, 0.59]) vBox(v, wd, 0.022, 0.05, 0.7, -0.8, y, 0);
  for (const z of [-0.43, 0.43]) vArc(v, cm, 0.24, 0.07, 0.1 * Math.PI, 0.9 * Math.PI, -0.46, 0.2, z);
  // the haul: two crates, a sack, a red jerry can, scrap pipes
  const ld = new THREE.Group(); v.add(ld); S.load = ld; S.bed = vMark(v, -0.55, 0.62, 0); // (round 34d) the haul sits in its own group so it can rattle
  const crate = (x, y, z, s, ry) => { const c = new THREE.Group(); c.position.set(x, y, z); c.rotation.y = ry; ld.add(c); vBox(c, wd, s, s * 0.75, s, 0, 0, 0); for (const q of [-1, 1]) { vBox(c, wd2, s + 0.006, 0.025, 0.025, 0, q * s * 0.3, s * 0.5); vBox(c, wd2, s + 0.006, 0.025, 0.025, 0, q * s * 0.3, -s * 0.5); } vBox(c, wd2, s * 1.2, 0.022, 0.022, 0, 0, s * 0.5 + 0.004, 0.62); };
  crate(-0.62, 0.48, 0.13, 0.24, 0.15); crate(-0.6, 0.66, 0.1, 0.16, -0.35);
  vBox(ld, lam('#a89a78'), 0.22, 0.12, 0.2, -0.36, 0.44, -0.15, 0.25, 0.3); vBox(ld, lam('#7e7258'), 0.05, 0.03, 0.06, -0.26, 0.52, -0.15, 0.25);
  vBox(ld, lam('#b02a22'), 0.09, 0.16, 0.14, -0.32, 0.47, 0.19); vBox(ld, lam('#222'), 0.03, 0.03, 0.03, -0.3, 0.565, 0.23);
  vRod(ld, lam('#6a7a86'), [-0.78, 0.47, -0.25], [-0.26, 0.5, -0.04], 0.018); vRod(ld, lam('#8a6a54'), [-0.76, 0.45, -0.05], [-0.4, 0.48, -0.28], 0.014);
  ld.children.forEach((c, i) => { c.userData.y0 = c.position.y; c.userData.r0 = c.rotation.z; c.userData.ph = i * 1.7; });
  // salvage flag on a pole at the back
  vRod(v, dk, [-0.79, 0.6, -0.33], [-0.79, 1.3, -0.33], 0.009); const fl = new THREE.Group(); fl.position.set(-0.79, 1.25, -0.33); v.add(fl); vBox(fl, lam('#ff8a1a'), 0.2, 0.12, 0.006, -0.1, 0, 0); S.flag = fl;
  const tl = vLit('#b0231b', '#ff2a1a', 0.3); for (const z of [-0.25, 0.25]) vBox(v, tl, 0.012, 0.04, 0.06, -0.815, 0.45, z);
  // steering: fork, bars, basket lamp, front wheel
  const st = new THREE.Group(); st.position.set(HT[0], 0, 0); v.add(st); S.steer.push(st);
  S.spin.push(vWheel(st, 0.16, 0, 0.2, 0.05, 'bike'));
  for (const s of [-1, 1]) vRod(st, cm, [0.01, 0.5, s * 0.04], [0.16, 0.2, s * 0.04], 0.012);
  vArc(st, cm, 0.23, 0.07, 0.25 * Math.PI, 0.7 * Math.PI, 0.16, 0.2, 0);
  vRod(st, cr, [0, 0.58, 0], [-0.02, 0.73, 0], 0.012); vRod(st, cr, [-0.02, 0.73, -0.22], [-0.02, 0.73, 0.22], 0.011);
  for (const s of [-1, 1]) vCyl(st, dk, 0.016, 0.016, 0.07, -0.05, 0.73, s * 0.21, 'z', 6);
  const hl = vLit('#fff4cf', '#ffe08a', 0.5); vBox(st, dk, 0.06, 0.05, 0.06, 0.05, 0.66, 0); vBox(st, hl, 0.012, 0.035, 0.045, 0.082, 0.66, 0);
  S.grip = [vMark(st, -0.05, 0.735, -0.21), vMark(st, -0.05, 0.735, 0.21)];
  vLights(S, v, [hl], [tl], [0.09, 0.66, 0, st]);
  S.dust = [-0.46, 0.02, 0.43]; v.userData.S = S; return v;
}

function mkArmor() {
  const v = new THREE.Group(), S = { spin: [], steer: [] }, am = lam('#55603a'), ad = lam('#3a4228'), st = lam('#7b8087'), dk = lam('#1b1b1b'), rv = lam('#8a9070');
  for (const x of [0.5, -0.5]) for (const z of [-0.43, 0.43]) { const w = vWheel(v, x, z, 0.23, 0.15, 'armor'); S.spin.push(w); if (x > 0) S.steer.push(w.piv); }
  // hull: belly, floor, side walls with a rim and rivets, back wall, sloped glacis, engine deck
  vBox(v, ad, 1.32, 0.14, 0.72, -0.02, 0.27, 0); vBox(v, lam('#2c3020'), 1.08, 0.01, 0.66, -0.1, 0.345, 0);
  for (let k = 0; k < 6; k++) vBox(v, lam('#353b26'), 0.03, 0.012, 0.64, -0.6 + k * 0.18, 0.352, 0);               // floor ribs
  for (const z of [-0.36, 0.36]) {
    vBox(v, am, 1.12, 0.42, 0.05, -0.1, 0.55, z); vBox(v, ad, 1.14, 0.03, 0.08, -0.1, 0.775, z);                        // wall + rim
    vBox(v, ad, 0.4, 0.2, 0.012, 0.0, 0.52, z * 1.075); vBox(v, ad, 0.3, 0.2, 0.012, -0.48, 0.52, z * 1.075);              // bolted-on plates
    for (let k = 0; k < 8; k++) { vBox(v, rv, 0.022, 0.022, 0.012, -0.6 + k * 0.143, 0.73, z * 1.08); vBox(v, rv, 0.022, 0.022, 0.012, -0.6 + k * 0.143, 0.38, z * 1.08); }
    vBox(v, ad, 0.36, 0.04, 0.17, 0.5, 0.5, z * 1.19); vBox(v, ad, 0.36, 0.04, 0.17, -0.5, 0.5, z * 1.19);                  // mudguards
    vBox(v, ad, 0.12, 0.03, 0.17, 0.72, 0.45, z * 1.19, -0.6); vBox(v, ad, 0.12, 0.03, 0.17, -0.72, 0.45, z * 1.19, 0.6);
    vBox(v, st, 0.22, 0.025, 0.1, 0.0, 0.3, z * 1.25);                                                                   // side step
  }
  vBox(v, am, 0.05, 0.42, 0.72, -0.66, 0.55, 0); vBox(v, ad, 0.08, 0.03, 0.78, -0.66, 0.775, 0);
  vBox(v, am, 0.5, 0.05, 0.72, 0.58, 0.54, 0, -1.07); vBox(v, am, 0.2, 0.05, 0.72, 0.42, 0.765, 0);                       // glacis + deck
  for (let k = 0; k < 4; k++) vBox(v, ad, 0.012, 0.18, 0.5, 0.61 + 0.0 * k, 0.5 - k * 0.0, -0.24 + k * 0.16, -1.07);      // grille slats
  // armoured visor with a vision slit
  vBox(v, am, 0.04, 0.16, 0.66, 0.43, 0.86, 0, 0.2); vBox(v, lam('#9fc4d8'), 0.046, 0.035, 0.48, 0.43, 0.88, 0, 0.2);
  // bull bar with spikes (it rams zombies), caged headlights
  for (const z of [-0.26, 0.26]) vRod(v, dk, [0.78, 0.24, z], [0.78, 0.6, z], 0.025);
  vRod(v, dk, [0.8, 0.32, -0.36], [0.8, 0.32, 0.36], 0.022); vRod(v, dk, [0.8, 0.54, -0.36], [0.8, 0.54, 0.36], 0.022);
  for (const z of [-0.24, 0, 0.24]) for (const y of [0.32, 0.54]) vCyl(v, st, 0, 0.022, 0.1, 0.86, y, z, 'x', 6);
  const hl = vLit('#fff4cf', '#ffe08a', 0.6), heads = [];
  for (const z of [-0.27, 0.27]) { vCyl(v, dk, 0.05, 0.05, 0.06, 0.67, 0.66, z, 'x', 10); heads.push(vCyl(v, hl, 0.042, 0.042, 0.01, 0.705, 0.66, z, 'x', 10)); vRod(v, dk, [0.715, 0.62, z], [0.715, 0.7, z], 0.005); vRod(v, dk, [0.715, 0.66, z - 0.045], [0.715, 0.66, z + 0.045], 0.005); }
  // back: spare wheel, jerry cans, tail lights, antenna with a pennant, exhaust stack
  const sp = new THREE.Group(); sp.position.set(-0.74, 0.55, 0); sp.rotation.y = Math.PI / 2; v.add(sp);
  sp.add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 6, 14), lam('#1b1b1d'))); vCyl(sp, lam('#4a5232'), 0.1, 0.1, 0.05, 0, 0, 0, 'z', 10);
  for (const z of [-0.26, 0.26]) { vBox(v, lam(z < 0 ? '#4a6a3a' : '#a8322a'), 0.08, 0.2, 0.14, -0.73, 0.52, z); vBox(v, dk, 0.03, 0.03, 0.04, -0.73, 0.635, z + 0.04); }
  const tl = vLit('#c0201a', '#ff2010', 0.35); for (const z of [-0.33, 0.33]) vBox(v, tl, 0.02, 0.05, 0.06, -0.695, 0.7, z);
  vRod(v, dk, [-0.6, 0.78, 0.31], [-0.62, 1.5, 0.31], 0.008); const fl = new THREE.Group(); fl.position.set(-0.62, 1.46, 0.31); v.add(fl); vBox(fl, lam('#c94b4b'), 0.16, 0.07, 0.005, -0.08, 0, 0); S.flag = fl;
  vRod(v, dk, [-0.5, 0.45, -0.39], [-0.5, 0.96, -0.39], 0.028); vCyl(v, dk, 0.04, 0.04, 0.03, -0.5, 0.97, -0.39, 'y', 8);
  S.exh = vMark(v, -0.5, 1.0, -0.39);
  // inside: two seats with backrests, dashboard with lit gauges, steering wheel on a column
  for (const x of [-0.02, -0.38]) { vBox(v, lam('#4a3a2a'), 0.22, 0.06, 0.28, x, 0.47, 0); vBox(v, lam('#4a3a2a'), 0.05, 0.22, 0.28, x - 0.13, 0.6, 0, 0.12); vBox(v, st, 0.04, 0.12, 0.04, x, 0.4, 0); }
  vBox(v, ad, 0.1, 0.14, 0.64, 0.38, 0.66, 0); for (const z of [-0.12, 0.0, 0.12]) vBox(v, vLit('#a8e0a0', '#7aff6a', 0.35), 0.012, 0.03, 0.04, 0.328, 0.69, z);
  vRod(v, dk, [0.36, 0.62, 0], [0.29, 0.74, 0], 0.015);
  const sw = new THREE.Group(); sw.position.set(0.28, 0.755, 0); sw.rotation.z = 0.75; v.add(sw); const ws = new THREE.Group(); sw.add(ws); S.wheel = ws;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.013, 5, 16), dk); ring.rotation.y = Math.PI / 2; ws.add(ring);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + Math.PI / 2; vRod(ws, dk, [0, 0, 0], [0, Math.sin(a) * 0.1, Math.cos(a) * 0.1], 0.008); }
  S.grip = [vMark(ws, 0, 0.045, -0.09), vMark(ws, 0, 0.045, 0.09)];
  vLights(S, v, heads.map(() => hl).slice(0, 1), [tl], [0.72, 0.66, 0]);
  S.dust = [-0.5, 0.02, 0.43]; v.userData.S = S; return v;
}

// (round 29) gyrocopter: open pod, seat, stick and throttle, mast with a two-blade rotor, pusher prop, tail boom with fins, tricycle gear
function mkGyro() {
  const v = new THREE.Group(), S = { spin: [], steer: [] }, bd = lam('#e0b030'), dk = lam('#24262a'), cr = lam('#b8bcc2'), rd = lam('#c0392b');
  S.spin.push(vWheel(v, 0.5, 0, 0.08, 0.04, 'bike'));
  for (const z of [-0.34, 0.34]) { const w = vWheel(v, -0.3, z, 0.1, 0.05, 'bike'); S.spin.push(w); vRod(v, dk, [-0.26, 0.32, z * 0.6], [-0.3, 0.1, z], 0.014); }
  vRod(v, dk, [0.42, 0.3, 0], [0.5, 0.08, 0], 0.014);
  // (round 30) a longer pod with two seats in tandem: pilot over x = 0, passenger over x = -PILLION
  vBox(v, bd, 1.1, 0.3, 0.52, -0.12, 0.42, 0); vBox(v, bd, 0.3, 0.24, 0.44, 0.5, 0.4, 0, -0.35); vBox(v, bd, 0.16, 0.16, 0.3, 0.66, 0.34, 0, -0.7);
  for (const s of [-1, 1]) { vBox(v, rd, 1.12, 0.04, 0.004, -0.1, 0.48, s * 0.262); vRod(v, cr, [-0.6, 0.64, s * 0.25], [0.05, 0.64, s * 0.25], 0.012); } // stripes, side grab rails
  vBox(v, lam('#9fc4d8'), 0.012, 0.2, 0.36, 0.42, 0.66, 0, 0.6); vBox(v, dk, 0.1, 0.08, 0.2, 0.34, 0.6, 0);
  vBox(v, vLit('#a8e0a0', '#7aff6a', 0.35), 0.004, 0.04, 0.12, 0.29, 0.62, 0);
  // pilot seat, stick, throttle, pedals
  vBox(v, dk, 0.24, 0.05, 0.3, -0.03, 0.53, 0); vBox(v, dk, 0.05, 0.26, 0.3, -0.16, 0.66, 0, 0.12);
  for (const s of [-1, 1]) vBox(v, rd, 0.008, 0.22, 0.03, -0.135, 0.68, s * 0.08, 0.12);
  vRod(v, dk, [0.2, 0.45, 0.04], [0.16, 0.68, 0.04], 0.012); vCyl(v, lam('#111'), 0.018, 0.018, 0.06, 0.16, 0.7, 0.04, 'y', 6);
  vRod(v, cr, [0.02, 0.5, -0.21], [0.08, 0.63, -0.21], 0.01); vBox(v, rd, 0.03, 0.03, 0.03, 0.08, 0.64, -0.21);
  for (const s of [-1, 1]) vBox(v, cr, 0.06, 0.012, 0.07, 0.42, 0.36, s * 0.1);
  // passenger seat (a step higher, so they see past the pilot) and footrests
  vBox(v, dk, 0.24, 0.12, 0.3, -0.42, 0.56, 0); vBox(v, dk, 0.05, 0.3, 0.3, -0.56, 0.74, 0, 0.12); for (const s of [-1, 1]) vBox(v, cr, 0.08, 0.014, 0.06, -0.12, 0.42, s * 0.13);
  // mast behind both seats + rotor head, two long blades (spin); pusher engine + prop (spin), exhaust
  vRod(v, cr, [-0.66, 0.56, 0], [-0.58, 1.5, 0], 0.025); vRod(v, cr, [-0.76, 0.56, 0.1], [-0.6, 1.25, 0], 0.012); vRod(v, cr, [-0.76, 0.56, -0.1], [-0.6, 1.25, 0], 0.012);
  const rh = new THREE.Group(); rh.position.set(-0.58, 1.54, 0); rh.rotation.z = 0.06; v.add(rh); vCyl(rh, dk, 0.05, 0.05, 0.06, 0, 0, 0, 'y', 8);
  const ro = new THREE.Group(); rh.add(ro); vBox(ro, dk, 2.2, 0.018, 0.11, 0, 0.03, 0); for (const s of [-1, 1]) vBox(ro, rd, 0.12, 0.02, 0.112, s * 1.04, 0.031, 0); S.rotor = ro;
  vBox(v, lam('#3a3d42'), 0.3, 0.28, 0.32, -0.82, 0.6, 0); for (let k = 0; k < 4; k++) vBox(v, lam('#55595f'), 0.31, 0.012, 0.36, -0.82, 0.5 + k * 0.06, 0);
  const pr = new THREE.Group(); pr.position.set(-1.02, 0.62, 0); v.add(pr); vCyl(pr, dk, 0.04, 0.04, 0.06, 0, 0, 0, 'x', 8); vBox(pr, lam('#6a4a2e'), 0.02, 0.72, 0.07, -0.02, 0, 0); S.prop = pr;
  vRod(v, dk, [-0.84, 0.78, 0.12], [-0.9, 0.86, 0.12], 0.018); S.exh = vMark(v, -0.9, 0.88, 0.12);
  // tail: boom, fin (red tip), stabiliser, nav lights
  vRod(v, cr, [-0.7, 0.38, 0.06], [-1.6, 0.5, 0], 0.016); vRod(v, cr, [-0.7, 0.38, -0.06], [-1.6, 0.5, 0], 0.016);
  vBox(v, bd, 0.26, 0.34, 0.03, -1.56, 0.68, 0, 0.15); vBox(v, rd, 0.1, 0.08, 0.032, -1.6, 0.82, 0, 0.15); vBox(v, bd, 0.2, 0.02, 0.44, -1.54, 0.5, 0);
  const tl = vLit('#c0201a', '#ff2010', 0.35); vBox(v, tl, 0.03, 0.03, 0.03, -1.66, 0.86, 0);
  vBox(v, vLit('#2aa04a', '#3aff6a', 0.6), 0.03, 0.03, 0.02, -1.54, 0.5, 0.23); vBox(v, vLit('#c0201a', '#ff3020', 0.6), 0.03, 0.03, 0.02, -1.54, 0.5, -0.23);
  const hl = vLit('#fff4cf', '#ffe08a', 0.5); vBox(v, hl, 0.03, 0.05, 0.08, 0.7, 0.3, 0, -0.7);
  // chin gun on a swivel under the nose: turns to the aim, dips toward the target
  const gm = new THREE.Group(); gm.position.set(0.56, 0.2, 0); gm.rotation.order = 'YZX'; v.add(gm); S.gun = gm;
  vCyl(gm, dk, 0.05, 0.05, 0.08, 0, 0.04, 0, 'y', 8); vBox(gm, lam('#3a3d42'), 0.16, 0.08, 0.1, 0.04, -0.02, 0); vCyl(gm, dk, 0.018, 0.022, 0.34, 0.26, -0.02, 0, 'x', 6); vBox(gm, lam('#4f5a32'), 0.08, 0.07, 0.06, -0.02, -0.02, 0.08);
  S.grip = [vMark(v, 0.08, 0.645, -0.21), vMark(v, 0.16, 0.7, 0.04)];
  vLights(S, v, [hl], [tl], [0.7, 0.3, 0]); if (S.beam) S.beam.rotation.z = -0.6;
  S.dust = [-0.3, 0.02, 0.34]; v.userData.S = S; return v;
}

// (round 31) tank: tracked hull with road wheels (spin), sloped glacis, skirts, engine deck; a turret (turns to the aim) with a recoiling gun, the commander stands in the hatch
function mkTank() {
  const v = new THREE.Group(), S = { spin: [], steer: [] }, ol = lam('#5a6b3a'), od = lam('#3e4a2a'), tr = lam('#1d1d1f'), st = lam('#7b8087'), dk = lam('#1b1b1b');
  for (const z of [-0.5, 0.5]) {
    vBox(v, tr, 1.7, 0.08, 0.22, 0, 0.36, z); vBox(v, tr, 1.6, 0.08, 0.22, 0, 0.04, z);                                      // track runs
    vCyl(v, tr, 0.17, 0.17, 0.22, 0.8, 0.2, z, 'z', 10); vCyl(v, tr, 0.17, 0.17, 0.22, -0.8, 0.2, z, 'z', 10);                 // track around the ends
    for (let k = 0; k < 5; k++) S.spin.push(vWheel(v, -0.56 + k * 0.28, z, 0.14, 0.1, 'armor'));                              // road wheels
    for (let k = 0; k < 12; k++) vBox(v, lam('#2a2a2c'), 0.05, 0.03, 0.23, -0.75 + k * 0.137, 0.405, z);                      // track links on top
    vBox(v, od, 1.5, 0.16, 0.04, 0.0, 0.36, z * 1.24); for (let k = 0; k < 6; k++) vBox(v, lam('#8a9070'), 0.02, 0.02, 0.012, -0.6 + k * 0.24, 0.4, z * 1.26); // skirt + rivets
  }
  vBox(v, ol, 1.5, 0.3, 0.8, -0.02, 0.4, 0); vBox(v, ol, 0.42, 0.06, 0.8, 0.74, 0.46, 0, -0.55); vBox(v, od, 1.0, 0.04, 0.82, -0.1, 0.565, 0); // hull, glacis, deck plate
  for (let k = 0; k < 5; k++) vBox(v, lam('#2c3420'), 0.03, 0.012, 0.6, -0.52 - k * 0.06, 0.59, 0);                                 // engine grille
  vBox(v, st, 0.06, 0.06, 0.6, 0.9, 0.3, 0); for (const z of [-0.3, 0.3]) vRod(v, st, [0.92, 0.3, z], [0.82, 0.5, z], 0.018);           // tow bar
  const hl = vLit('#fff4cf', '#ffe08a', 0.6); for (const z of [-0.32, 0.32]) { vCyl(v, dk, 0.04, 0.04, 0.05, 0.84, 0.52, z, 'x', 8); vCyl(v, hl, 0.034, 0.034, 0.008, 0.865, 0.52, z, 'x', 8); }
  const tl = vLit('#c0201a', '#ff2010', 0.35); for (const z of [-0.36, 0.36]) vBox(v, tl, 0.02, 0.04, 0.05, -0.78, 0.5, z);
  for (const z of [-0.26, 0.26]) vCyl(v, dk, 0.035, 0.035, 0.1, -0.74, 0.62, z, 'y', 8); S.exh = vMark(v, -0.74, 0.68, 0.26);
  vBox(v, lam('#4a6a3a'), 0.08, 0.2, 0.14, -0.6, 0.66, 0.3); vBox(v, lam('#6a4a2e'), 0.3, 0.1, 0.12, -0.45, 0.62, -0.32);        // jerry can, log
  // turret (turns with the aim): body, mantlet, gun (recoils), hatch ring, open lid, roof MG, smoke dischargers, antenna, star
  const tu = new THREE.Group(); tu.position.set(0, 0.6, 0); v.add(tu); S.turret = tu;
  vCyl(tu, od, 0.38, 0.4, 0.06, 0, 0.03, 0, 'y', 14); vBox(tu, ol, 0.72, 0.26, 0.62, -0.02, 0.19, 0); vBox(tu, ol, 0.2, 0.22, 0.5, 0.36, 0.17, 0, -0.35); vBox(tu, ol, 0.22, 0.18, 0.56, -0.44, 0.17, 0, 0.3);
  const br = new THREE.Group(); br.position.set(0.44, 0.2, 0); tu.add(br); S.barrel = br;
  vBox(br, od, 0.14, 0.16, 0.2, 0.02, 0, 0); vCyl(br, ol, 0.05, 0.055, 1.0, 0.55, 0, 0, 'x', 10); vCyl(br, od, 0.07, 0.07, 0.16, 0.4, 0, 0, 'x', 10); vBox(br, dk, 0.1, 0.09, 0.12, 1.07, 0, 0); S.muz = vMark(br, 1.12, 0, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 5, 14), od); ring.rotation.x = Math.PI / 2; ring.position.set(-0.08, 0.33, 0); tu.add(ring);
  vBox(tu, ol, 0.3, 0.03, 0.3, -0.3, 0.46, 0, 1.1);                                                                                 // open hatch lid
  vRod(tu, dk, [0.05, 0.36, -0.2], [0.35, 0.4, -0.2], 0.014); vBox(tu, dk, 0.1, 0.06, 0.05, 0.05, 0.37, -0.2);                    // roof MG
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) vCyl(tu, dk, 0.025, 0.025, 0.08, 0.2 - k * 0.05, 0.3, s * 0.32, 'z', 6);
  vRod(tu, dk, [-0.36, 0.32, 0.22], [-0.4, 1.0, 0.22], 0.006); vBox(tu, lam('#eae4d0'), 0.005, 0.1, 0.1, 0.0, 0.2, 0.312, 0.785); vBox(tu, lam('#eae4d0'), 0.005, 0.1, 0.1, 0.0, 0.2, -0.312, 0.785);
  S.grip = [vMark(tu, 0.04, 0.37, -0.14), vMark(tu, 0.04, 0.37, 0.14)];
  vLights(S, v, [hl], [tl], [0.86, 0.52, 0]);
  S.dust = [-0.7, 0.02, 0.5]; v.userData.S = S; return v;
}

function mkVehicles() {
  const g = new THREE.Group(), bike = mkBike(), moto = mkMoto(), cargo = mkCargo(), armor = mkArmor(), gyro = mkGyro(), tank = mkTank();
  for (const q of [bike, moto, cargo, armor, gyro, tank]) q.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; } });
  g.add(bike, moto, cargo, armor, gyro, tank); g.userData = { bike, moto, cargo, armor, gyro, tank, all: [null, bike, moto, cargo, armor, gyro, tank] }; return g;
}

// how a rider sits on each vehicle: H = hip height, lean = torso pitch (negative = forward), pedal = [x, y, crank radius] or peg = [x, y, half-width],
// p* = the back-seat rider (pPeg in the vehicle frame), hold = where the back-seat rider's hands go (their own frame), roll = how much it banks into turns,
// foot = puts a foot down when stopped
const VPOSE = [null,
  { H: 0.66, lean: -0.3, pedal: [0.04, 0.25, 0.1], roll: 1, foot: 1, drop: 0.1, slide: 0.1 },
  { H: 0.7, lean: -0.22, peg: [0.06, 0.3, 0.15], pH: 0.77, pLean: -0.26, pPeg: [-0.31, 0.38, 0.16], hold: [0.3, 0.83, 0.16], roll: 1.3, foot: 1, drop: 0.1, slide: 0 },
  { H: 0.66, lean: -0.22, pedal: [0.12, 0.27, 0.1], roll: 0.12 },
  { H: 0.55, lean: -0.06, peg: [0.3, 0.41, 0.1], pH: 0.55, pLean: -0.02, pPeg: [-0.08, 0.41, 0.11], hold: [0.06, 0.78, 0.34], roll: -0.15 },
  { H: 0.58, lean: -0.08, peg: [0.42, 0.36, 0.1], pH: 0.67, pLean: -0.04, pPeg: [-0.12, 0.43, 0.13], hold: [0.12, 0.64, 0.25], roll: 0.9, fly: 1 },
  { H: 0.9, lean: 0, peg: [0.0, 0.55, 0.1], roll: -0.06, turret: 1 },                                                    // (round 31) tank: the commander stands in the turret hatch, turns with it                                          // (round 29) gyrocopter: banks and noses down in flight
];
// two-bone leg IK: put the ankle of leg L at (tx, ty, tz) in the lower-body frame, hip pivot at (hx, hy, hz); the thigh abducts (rotation.x) for sideways targets
function legIK(L, hx, hy, hz, tx, ty, tz, toe) {
  const dx = tx - hx, dy = ty - hy, dz = tz - hz, py = -Math.hypot(dy, dz), A = 0.23, B = 0.22;
  const b = Math.atan2(-dz, -dy), d = clamp(Math.hypot(dx, py), 0.06, A + B - 0.003), phi = Math.atan2(dx, -py);
  const a = phi + Math.acos(clamp((A * A + d * d - B * B) / (2 * A * d), -1, 1));            // knee in front of the hip-ankle line
  const kx = A * Math.sin(a), ky = -A * Math.cos(a), ex = d * Math.sin(phi), ey = -d * Math.cos(phi), s = Math.atan2(ex - kx, ky - ey), k = a - s;
  L.th.rotation.set(b, 0, a); L.kn.rotation.z = -k; L.ft.rotation.z = k - a + (toe || 0);
}
// legs of a rider: feet on the pedals (turning with the crank) or the pegs; the driver of a bike / motorbike puts one foot down when stopped
// (ox, oz = how far the hips slid off the saddle toward that foot)
function rideLegs(m, RP, pil, H, vr, ox, oz) {
  for (let s = 0; s < 2; s++) {
    const sg = s ? 1 : -1; let t;
    if (!pil && RP.pedal) { const c = (vr._crank || 0) + (s ? 0 : Math.PI), R = RP.pedal[2]; t = [RP.pedal[0] - R * Math.sin(c) - 0.045, RP.pedal[1] - R * Math.cos(c) + 0.075, sg * 0.1]; }
    else { const pg = pil ? RP.pPeg : RP.peg; t = [pg[0] + (pil ? PILLION : 0) - 0.04, pg[1] + 0.075, sg * pg[2]]; }
    const k = !pil && s === 1 && RP.foot ? vr._stopK || 0 : 0;
    if (k > 0.01) { const r = vr._roll || 0; t = [lerp(t[0], 0.08 + ox, k), lerp(t[1], (0.075 + 0.24 * Math.sin(r)) / Math.cos(r), k), lerp(t[2], 0.24, k)]; } // the ankle on the ground of the leaning frame
    legIK(m.legs[s], ox, H - 0.02, sg * 0.075 + oz, t[0], t[1], t[2], RP.pedal && !pil ? -0.18 : -0.08);
  }
}
// per-frame vehicle state of a driver: yaw rate → bank + steering, crank, foot-down, brake light
function rideState(p, dt) {
  const RP = VPOSE[p.veh || 1] || VPOSE[1], yr = dt > 0 && p._lyP != null ? angDiff(p._lyP, p._ly) / dt : 0; p._lyP = p._ly;
  p._yr = lerp(p._yr || 0, clamp(yr, -6, 6), Math.min(1, dt * 6));
  const fast = clamp(p._spd / 3, 0, 1);
  p._stopK = lerp(p._stopK || 0, RP.foot && p._spd < 0.35 ? 1 : 0, Math.min(1, dt * 6));
  p._roll = lerp(p._roll || 0, clamp(p._yr * 0.09 * fast * RP.roll, -0.36, 0.36) + p._stopK * 0.28, Math.min(1, dt * 8)); // stopped: leans onto the foot that's down
  p._steer = lerp(p._steer || 0, clamp(-p._yr * 0.11, -0.45, 0.45), Math.min(1, dt * 8));
  p._crank = (p._crank || 0) + Math.min(p._spd, 6) * dt / 0.22 * 0.5;
  p._pitch = lerp(p._pitch || 0, RP.fly ? -clamp(p._spd / 4, 0, 1) * 0.16 : 0, Math.min(1, dt * 4));
  const dec = dt > 0 ? ((p._spdP || 0) - p._spd) / dt : 0; p._spdP = p._spd;
  p._brake = lerp(p._brake || 0, dec > 1.2 || (p._spd < 0.3 && p._stopK < 0.9) ? 1 : 0, Math.min(1, dt * 10));
}
// moving parts, lights, exhaust and dust of the vehicle a driver is on
function vehTick(p, m, dt, dk) {
  const V = m.veh.userData.all[p.veh || 1]; if (!V) return; const S = V.userData.S, sp = p._spd || 0;
  for (const w of S.spin) w.g.rotation.z -= Math.min(sp, 8) * dt / w.r;
  if (S.crank) { S.crank.rotation.z = -(p._crank || 0); for (const q of S.pedals) q.rotation.z = p._crank || 0; }
  for (const s of S.steer) s.rotation.y = p._steer || 0;
  if (S.wheel) S.wheel.rotation.x = -(p._steer || 0) * 3;
  if (S.turret) { S.turret.rotation.y = -angDiff(p._ly, p.aim); const ap = p.aimPt, hd = ap ? Math.hypot(ap.x - p.x, ap.y - p.y) : 8; S.barrel.rotation.z = lerp(S.barrel.rotation.z, ap ? clamp(Math.atan2(ap.z - (p.z + 0.8), Math.max(1, hd)), -0.15, 0.4) : 0, Math.min(1, dt * 8)); p._crec = Math.max(0, (p._crec || 0) - dt * 2.5); S.barrel.position.x = 0.44 - 0.16 * p._crec; } // turret to the aim, gun recoils
  if (S.gun) { S.gun.rotation.y = -angDiff(p._ly, p.aim); const ap = p.aimPt, hd = ap ? Math.hypot(ap.x - p.x, ap.y - p.y) : 6; S.gun.rotation.z = lerp(S.gun.rotation.z, ap ? clamp(Math.atan2(ap.z - (p.z + 0.25), Math.max(0.5, hd)), -1.3, 0.3) : -0.3, Math.min(1, dt * 10)); }
  if (S.rotor) { const air = p.z - surfZ(p.x, p.y, skyTop(p.x, p.y)); p._rot = lerp(p._rot || 0, p.land && air < 0.15 ? 6 : 30, Math.min(1, dt * 1.5)); S.rotor.rotation.y += p._rot * dt; S.prop.rotation.x += p._rot * 1.4 * dt;
    if (air < 3.5 && air > 0.05 && FXR() < dt * 30) { const a = FXR() * 6.28, r = 0.6 + FXR() * 0.8, gz = p.z - air; addP({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, z: gz + 0.05, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, vz: 0.15, g: -0.1, col: '#8a7e6a', s: 0.08, life: 0.5, smoke: 1 }); } } // rotor + prop spin; downwash kicks up dust close to the ground
  if (S.load) { // (round 34d) the haul rattles over bumps (more the faster you go) and jumps when something new lands in the bed
    if (p._ldKT && W.t >= p._ldKT) { p._ldKT = 0; p._ldK = 1; } p._ldK = Math.max(0, (p._ldK || 0) - dt * 3);
    const shk = Math.min(1, sp / 3), kk = p._ldK || 0;
    for (const c of S.load.children) { const u = c.userData, j = Math.abs(Math.sin(W.t * (16 + u.ph) + u.ph)) * 0.022 * shk + kk * 0.05 * Math.abs(Math.sin(W.t * 30 + u.ph)); c.position.y = u.y0 + j; c.rotation.z = u.r0 + Math.sin(W.t * (11 + u.ph) + u.ph * 2) * 0.05 * shk + kk * 0.08 * Math.sin(W.t * 25 + u.ph); }
  }
  if (S.flag) S.flag.rotation.y = Math.sin(W.t * (6 + sp * 2) + p.i) * (0.2 + Math.min(0.3, sp * 0.06)) + Math.min(0.6, sp * 0.12);
  const hk = 0.35 + dk * 1.2; for (const mt of S.head) mt.emissiveIntensity = hk;
  const tk = 0.25 + dk * 0.35 + (p._brake || 0) * 1.1; for (const mt of S.tail) mt.emissiveIntensity = tk;
  if (S.beam) { S.beam.visible = dk > 0.3; S.beam.material.opacity = 0.075 * dk; }
  if (S.exh && (p._exT = (p._exT || 0) - dt) <= 0) {
    p._exT = sp > 0.5 ? 0.08 : 0.32; S.exh.getWorldPosition(_vw);
    addP({ x: _vw.x, y: _vw.z, z: _vw.y, vx: frnd(-0.15, 0.15) - Math.cos(p._ly) * 0.5, vy: frnd(-0.15, 0.15) - Math.sin(p._ly) * 0.5, vz: 0.3, g: -0.4, col: sp > 0.5 ? '#77736c' : '#8d8a84', s: 0.05, life: 0.6, smoke: 1 });
  }
  if (sp > 2.2 && S.dust && FXR() < dt * 14) {
    _vw.set(S.dust[0], S.dust[1], S.dust[2] * (FXR() < 0.5 ? -1 : 1)); V.localToWorld(_vw);
    addP({ x: _vw.x, y: _vw.z, z: _vw.y, vx: frnd(-0.3, 0.3) - Math.cos(p._ly) * 0.6, vy: frnd(-0.3, 0.3) - Math.sin(p._ly) * 0.6, vz: 0.3, g: -0.2, col: '#8a7e6a', s: 0.07, life: 0.45, smoke: 1 });
  }
}
// the whole rider (and their vehicle) banks about the forward axis
const _vq = new THREE.Quaternion(), _vax2 = new THREE.Vector3();
function rideBank(m, ly, roll, pitch) { _vax.set(Math.cos(ly), 0, Math.sin(ly)); m.g.quaternion.setFromAxisAngle(_vax, roll || 0); if (pitch) { _vax2.set(-Math.sin(ly), 0, Math.cos(ly)); _vq.setFromAxisAngle(_vax2, pitch); m.g.quaternion.premultiply(_vq); } } // pitch (nose down < 0) about the rider's left-right axis

/* ---------- (round 34) mechs, (round 34d) rebuilt: rounded armour, tapered limbs, ball joints, panel lines; each of the six
   has its own size and build (scout lanky and small, bastion huge and broad, worker hunched with long arms, howitzer stocky).
   Local frame like the vehicles: +x forward, +y up, +z the mech's left. Joints rotate about z (positive = swing forward). */
const MECH_DIM = { // s = overall scale; th / sh = thigh / shin; cw = chest width; arm = arm thickness; hunch = resting torso lean
  scout: { s: 0.82, th: 0.72, sh: 0.82, ft: 0.15, cw: 0.78, arm: 0.8, hunch: 0.08 },
  slim: { s: 1.0, th: 0.78, sh: 0.8, ft: 0.15, cw: 0.86, arm: 0.9, hunch: 0.04 },
  worker: { s: 1.0, th: 0.42, sh: 0.44, ft: 0.2, cw: 1.0, arm: 1.15, hunch: 0.06 }, // (round 36f) a stubby little chibi: short legs, big head, round belly
  big: { s: 1.2, th: 0.7, sh: 0.7, ft: 0.18, cw: 1.18, arm: 1.25, hunch: 0.05 },
  fly: { s: 0.94, th: 0.74, sh: 0.78, ft: 0.15, cw: 0.82, arm: 0.88, hunch: 0.02 },
  cannon: { s: 1.12, th: 0.56, sh: 0.6, ft: 0.18, cw: 1.12, arm: 1.12, hunch: 0.1 },
};
const MECH_LEG = { th: 0.74, sh: 0.76, ft: 0.16 }; // (kept for anything that still asks; each mech carries its own J.LEG)
const _mgeo = {};
function mRound(w, h, d, r) { // a box with rounded edges (extruded rounded rectangle, bevelled faces), centred
  const key = [w, h, d, r].map(v => v.toFixed(3)).join(); if (_mgeo[key]) return _mgeo[key];
  r = Math.min(r, w / 2 - 0.004, h / 2 - 0.004); const b = Math.min(r * 0.6, d / 3), x = w / 2 - r, y = h / 2 - r, S = new THREE.Shape();
  S.moveTo(-x, -h / 2); S.lineTo(x, -h / 2); S.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); S.lineTo(w / 2, y); S.quadraticCurveTo(w / 2, h / 2, x, h / 2); S.lineTo(-x, h / 2); S.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); S.lineTo(-w / 2, -y); S.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
  const g = new THREE.ExtrudeGeometry(S, { depth: Math.max(0.002, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 1, curveSegments: 2 }); g.center(); g.computeVertexNormals();
  return (_mgeo[key] = g);
}
function mPart(par, geo, mat, x, y, z, rz, ry, rx, sx, sy, sz) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); if (sx) m.scale.set(sx, sy || sx, sz || sx); par.add(m); return m; }
const mRB = (par, mat, w, h, d, r, x, y, z, rz, ry, rx) => mPart(par, mRound(w, h, d, r), mat, x, y, z, rz, ry, rx);
const mTaper = (r1, r2, h, seg) => { const key = 't' + [r1, r2, h, seg || 8].join(); return _mgeo[key] || (_mgeo[key] = new THREE.CylinderGeometry(r1, r2, h, seg || 8).translate(0, -h / 2, 0)); };
const mBall = r => _mgeo['b' + r] || (_mgeo['b' + r] = new THREE.SphereGeometry(r, 10, 7));
const KTRL = []; // (round 36f) the sword-trail ribbons (in the scene); fxTick hides any whose mech was not drawn this frame
function mkMech(k) {
  const M = MECHS[k] || MECHS[4], st = M.style, D = MECH_DIM[st] || MECH_DIM.slim, g = new THREE.Group(), J = { k, st, D, LEG: { th: D.th, sh: D.sh, ft: D.ft }, legs: [], arms: [], flames: [], blades: [] };
  const lit = c => new THREE.MeshLambertMaterial({ color: c, flatShading: false });
  const main = lit(M.col[0]), dark = lit(M.col[1]), acc = lit(M.col[2]), steel = lit('#80878f'), blk = lit('#17181a'), hyd = lit('#c4bea9'), line = lit('#101113');
  const glow = new THREE.MeshBasicMaterial({ color: M.glow }), glowA = new THREE.MeshBasicMaterial({ color: M.glow, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameM = new THREE.MeshBasicMaterial({ color: '#ffb35a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const big = st === 'big' || st === 'cannon', fly = st === 'fly', scout = st === 'scout', worker = st === 'worker', cannon = st === 'cannon', edge = st === 'slim';
  const cw = D.cw, A = D.arm, hipY = D.th + D.sh + D.ft - 0.05;
  const root = new THREE.Group(); root.scale.setScalar(D.s); g.add(root); J.root = root;
  const pel = new THREE.Group(); pel.position.y = hipY; root.add(pel); J.pel = pel;
  // pelvis: a rounded hip block, a groin guard, ball joints, skirt plates that flare out
  mRB(pel, dark, 0.46, 0.28, 0.6 * cw, 0.07, 0, 0, 0); mRB(pel, main, 0.2, 0.3, 0.3 * cw, 0.06, 0.22, -0.06, 0, -0.25); mRB(pel, acc, 0.03, 0.12, 0.16, 0.012, 0.33, -0.04, 0, -0.25);
  for (const s of [-1, 1]) { mPart(pel, mBall(0.13 * A), steel, 0, -0.05, s * 0.32 * cw); mRB(pel, main, 0.4, 0.24, 0.07, 0.05, -0.02, -0.12, s * 0.42 * cw, 0, 0, s * 0.22); mRB(pel, line, 0.38, 0.015, 0.075, 0.005, -0.02, -0.06, s * 0.43 * cw, 0, 0, s * 0.22); }
  if (edge) for (const fx of [1, -1]) for (let q = 0; q < 2; q++) { mRB(pel, q ? dark : main, 0.05, 0.12, 0.42 * cw, 0.02, fx * (0.26 + q * 0.025), -0.16 - q * 0.1, 0, -fx * 0.25); vBox(pel, lit('#b0242a'), 0.055, 0.012, 0.4 * cw, fx * (0.26 + q * 0.025), -0.11 - q * 0.1, 0, -fx * 0.25); } // (round 36f) 草摺 waist plates front and back
  // legs: tapered thigh with a front plate and a ram behind, a ball knee with a cap, a shin with a guard and calf, a splayed foot
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0, -0.06, s * 0.34 * cw); pel.add(hip);
    if (worker) { // (round 36f) 工蜂: stubby rounded legs and big round boots, same smooth shell as the body
      const sm = (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs);
      mPart(hip, mTaper(0.13, 0.12, D.th, 16), dark, 0, 0, 0); mPart(hip, sm(0.15), main, 0.02, -D.th * 0.5, 0, 0, 0, 0, 1, 1.5, 1);
      const kn = new THREE.Group(); kn.position.y = -D.th; hip.add(kn); mPart(kn, sm(0.12), steel, 0, 0, 0);
      mPart(kn, mTaper(0.12, 0.15, D.sh, 16), main, 0, 0, 0); mPart(kn, new THREE.TorusGeometry(0.15, 0.025, 8, 20), acc, 0, -D.sh + 0.06, 0, 0, 0, Math.PI / 2);
      const an = new THREE.Group(); an.position.y = -D.sh; kn.add(an);
      mPart(an, sm(0.2), dark, 0.07, -0.06, 0, 0, 0, 0, 1.45, 0.62, 1.05); mPart(an, sm(0.12), acc, 0.25, -0.05, 0, 0, 0, 0, 1, 0.7, 1.3); mRB(an, blk, 0.56, 0.05, 0.38, 0.02, 0.07, -0.16, 0);
      J.legs.push({ hip, kn, an, s }); continue; }
    mPart(hip, mTaper(0.15 * A, 0.12 * A, D.th), dark, 0, 0, 0, 0, 0, 0, 1, 1, 0.92);
    mRB(hip, main, 0.13, D.th * 0.78, 0.27 * A, 0.05, 0.13 * A, -D.th * 0.45, 0, 0.05); mRB(hip, line, 0.135, 0.015, 0.275 * A, 0.006, 0.13 * A, -D.th * 0.3, 0, 0.05);
    mRB(hip, main, 0.24 * A, D.th * 0.4, 0.06, 0.04, -0.02, -D.th * 0.35, s * 0.15 * A, 0, 0, s * 0.08);
    vRod(hip, hyd, [-0.12, -0.1, 0], [-0.11, -D.th + 0.08, 0], 0.025);
    const kn = new THREE.Group(); kn.position.y = -D.th; hip.add(kn);
    mPart(kn, mBall(0.12 * A), steel, 0, 0, 0); mRB(kn, acc, 0.14, 0.2, 0.2 * A, 0.05, 0.12, 0.02, 0, -0.35);
    mPart(kn, mTaper(0.12 * A, 0.09 * A, D.sh), dark, -0.02, 0, 0, 0, 0, 0, 1, 1, 0.95);
    mRB(kn, main, 0.13, D.sh * 0.84, 0.28 * A, 0.05, 0.12 * A, -D.sh * 0.48, 0, 0.07); mRB(kn, line, 0.135, 0.015, 0.285 * A, 0.006, 0.12 * A, -D.sh * 0.62, 0, 0.07);
    mPart(kn, mBall(0.14 * A), main, -0.09, -D.sh * 0.32, 0, 0, 0, 0, 0.8, 1.5, 0.95);                                      // calf
    vRod(kn, hyd, [-0.14, -0.08, s * 0.06], [-0.11, -D.sh + 0.1, s * 0.06], 0.02);
    if (fly) mPart(kn, mTaper(0.06, 0.085, 0.16, 10), blk, -0.17, -D.sh * 0.55, 0);
    const an = new THREE.Group(); an.position.y = -D.sh; kn.add(an);
    mPart(an, mBall(0.085 * A), steel, 0, 0, 0);
    mRB(an, dark, 0.54 * A, D.ft, 0.32 * A, 0.05, 0.08, -0.08, 0); mRB(an, main, 0.22, 0.1, 0.34 * A, 0.04, 0.28 * A, -0.06, 0, -0.22);
    for (const t of [-1, 1]) mRB(an, blk, 0.13, 0.06, 0.1, 0.025, 0.38 * A, -0.13, t * 0.1 * A, 0, t * 0.15);
    mRB(an, blk, 0.12, 0.08, 0.18, 0.03, -0.23, -0.11, 0);
    J.legs.push({ hip, kn, an, s });
  }
  // torso: waist ring (turns toward the aim), segmented abdomen, chest with the reactor, collar, back pack
  const tor = new THREE.Group(); tor.position.y = 0.15; pel.add(tor); J.tor = tor;
  if (!worker) mPart(tor, mTaper(0.2 * cw, 0.24 * cw, 0.14, 12), steel, 0, 0.14, 0);
  if (!worker) for (let a = 0; a < 3; a++) mPart(tor, mTaper(0.24 * cw - a * 0.01, 0.22 * cw + a * 0.01, 0.08, 10), a % 2 ? dark : main, 0.02, 0.22 + a * 0.085, 0, 0, 0, 0, 1.15, 1, 1.25);
  const ch = new THREE.Group(); ch.position.y = 0.42; tor.add(ch); J.ch = ch;
  const eggR = y => { const u = clamp((y + 0.75) / 1.55, 0, 1); return 0.52 * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * u)), 0.7) * (1 - 0.18 * u); }; // the worker's shell radius at height y (chest space)
  if (worker) { // (round 36f) 工蜂 is one smooth egg-shaped shell from the hips up to the head (not a stack of boxes): a yellow tummy plate, a panel seam, a glowing heart, a collar band the head sits in
    const prof = []; for (let i = 0; i <= 18; i++) { const y = -0.75 + i / 18 * 1.55; prof.push(new THREE.Vector2(Math.max(0.02, eggR(y)), y)); }
    mPart(ch, new THREE.LatheGeometry(prof, 28), main, 0, 0, 0, 0, 0, 0, 0.95, 1, 1.12);
    mPart(ch, new THREE.SphereGeometry(0.3, 24, 16), acc, 0.31, 0.06, 0, 0, 0, 0, 0.55, 0.92, 1.05); // an oval tummy plate
    for (const [y, m] of [[-0.36, line], [0.58, line]]) mPart(ch, new THREE.TorusGeometry(eggR(y) + 0.004, 0.011, 6, 30), m, 0, y, 0, 0, 0, Math.PI / 2, 0.95, 1.12, 1);
    mPart(ch, new THREE.TorusGeometry(eggR(0.74) + 0.02, 0.045, 10, 30), acc, 0, 0.74, 0, 0, 0, Math.PI / 2, 0.95, 1.12, 1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.016, 6, 18), steel); ring2.rotation.y = Math.PI / 2; ring2.position.set(0.475, 0.1, 0); ch.add(ring2);
    J.core = vCyl(ch, glow, 0.07, 0.07, 0.02, 0.475, 0.1, 0, 'x', 18); J.coreHalo = vCyl(ch, glowA, 0.13, 0.13, 0.01, 0.482, 0.1, 0, 'x', 18);
    for (const s2 of [-1, 1]) mPart(ch, new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), dark, 0.22, -0.2, s2 * 0.42, 0, 0, Math.PI / 2 - s2 * 0.5); // little side vents
  }
  if (!worker) {
  mRB(ch, dark, 0.58, 0.6, 0.9 * cw, 0.12, -0.02, 0.32, 0);
  for (const s of [-1, 1]) { mRB(ch, main, 0.2, 0.5, 0.44 * cw, 0.08, 0.27, 0.36, s * 0.24 * cw, 0, s * 0.24); mRB(ch, line, 0.21, 0.015, 0.4 * cw, 0.006, 0.28, 0.22, s * 0.24 * cw, 0, s * 0.24); }
  mRB(ch, main, 0.5, 0.12, 0.94 * cw, 0.05, 0.02, 0.66, 0); mRB(ch, acc, 0.52, 0.035, 0.22, 0.012, 0.03, 0.73, 0);
  vCyl(ch, blk, 0.2, 0.2, 0.06, 0.35, 0.34, 0, 'x', 18);
  J.core = vCyl(ch, glow, 0.15, 0.15, 0.04, 0.38, 0.34, 0, 'x', 18); J.coreHalo = vCyl(ch, glowA, 0.28, 0.28, 0.02, 0.39, 0.34, 0, 'x', 18);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 6, 22), steel); ring.rotation.y = Math.PI / 2; ring.position.set(0.38, 0.34, 0); ch.add(ring);
  for (let a = 0; a < 6; a++) { const q = a / 6 * Math.PI * 2; vBox(ch, steel, 0.03, 0.05, 0.02, 0.4, 0.34 + Math.sin(q) * 0.2, Math.cos(q) * 0.2, q); }
  mRB(ch, dark, 0.34, 0.54, 0.7 * cw, 0.1, -0.42, 0.32, 0);
  for (let a = 0; a < 4; a++) mRB(ch, blk, 0.02, 0.035, 0.48 * cw, 0.01, -0.6, 0.16 + a * 0.1, 0);
  } /* (round 36f) end of the non-worker chest */
  if (big && !cannon) for (const s of [-1, 1]) { mPart(ch, mTaper(0.07, 0.085, 0.5, 10), steel, -0.5, 1.05, s * 0.2); vCyl(ch, blk, 0.05, 0.05, 0.04, -0.5, 1.06, s * 0.2, 'y', 10); }
  if (edge) { for (let a = 0; a < 4; a++) mRB(ch, acc, 0.22 - a * 0.03, 0.06, 0.03, 0.012, -0.62, 0.62 - a * 0.13, 0, 0.5);
    const sb = new THREE.Group(); sb.position.set(-0.5, 0.38, -0.12); sb.rotation.set(0.15, 0, -0.95); ch.add(sb); const laq = lit(M.col[1]), gold2 = lit('#c9a24a'); // (round 36f) the scabbard across its back
    mRB(sb, laq, 1.75, 0.12, 0.06, 0.03, 0.55, 0, 0); for (const xq of [-0.25, 0.4, 1.3]) mRB(sb, gold2, 0.04, 0.13, 0.065, 0.01, xq, 0, 0); mRB(sb, gold2, 0.08, 0.125, 0.065, 0.03, 1.4, 0, 0); /* (round 36f) 鐺 end cap, 下緒 cord */ const cd2 = lit('#b0242a'); for (const xq of [-0.12, -0.06]) mPart(sb, new THREE.TorusGeometry(0.075, 0.01, 4, 14), cd2, xq, 0, 0, 0, Math.PI / 2, 0, 1, 0.9, 0.55); vRod(sb, cd2, [-0.09, -0.07, 0.02], [0.15, -0.22, 0.05], 0.01);
    const sh2 = new THREE.Group(); sh2.position.x = -0.32; sb.add(sh2); mPart(sh2, mTaper(0.034, 0.034, 0.36, 8), lit('#2a1c1c'), -0.18, 0, 0, Math.PI / 2); const ts2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.022, 12), gold2); ts2.rotation.z = Math.PI / 2; sh2.add(ts2); J.katSheathed = sh2; }
  if (fly) {
    for (const s of [-1, 1]) { const wg = new THREE.Group(); wg.position.set(-0.5, 0.5, s * 0.3); wg.rotation.set(s * 0.35, s * 0.5, 0.25); ch.add(wg); wg.userData.s = s; // (round 35) a two-part wing that folds along the back and spreads to fly
      mRB(wg, main, 0.5, 0.05, 0.9, 0.02, -0.1, 0, s * 0.45); mRB(wg, acc, 0.4, 0.055, 0.12, 0.02, -0.08, 0.01, s * 0.86); vBox(wg, glow, 0.36, 0.02, 0.03, -0.06, 0.03, s * 0.62);
      const tip = new THREE.Group(); tip.position.set(-0.05, 0, s * 0.9); wg.add(tip); for (let q = 0; q < 3; q++) { const fe = new THREE.Group(); fe.position.set(-0.2 - q * 0.06, 0, s * 0.5); tip.add(fe); mRB(fe, q % 2 ? dark : main, 0.14, 0.025, 0.5, 0.012, -0.05, 0, s * 0.25, 0, s * (-0.35 - q * 0.25)); vBox(fe, glow, 0.012, 0.03, 0.4, 0.0, 0.015, s * 0.22, 0, s * (-0.35 - q * 0.25)); (J.feath = J.feath || []).push({ g: fe, k: q, s }); } (J.wtips = J.wtips || []).push(vMark(tip, -0.3, 0, s * 1.0)); /* (round 36f) three feathers fan out at each wing tip; contrails from the tips */ mRB(tip, main, 0.36, 0.04, 0.6, 0.02, -0.12, 0, s * 0.28, 0, s * -0.25); mRB(tip, dark, 0.2, 0.045, 0.3, 0.015, -0.24, 0.005, s * 0.5, 0, s * -0.5); vBox(tip, glow, 0.03, 0.03, 0.4, -0.02, 0.02, s * 0.3); wg.userData.tip = tip;
      J.wings = (J.wings || []).concat(wg); }
    for (const s of [-1, 1]) { const pod = new THREE.Group(); pod.position.set(-0.18, 0.74, s * 0.36 * cw); ch.add(pod); mRB(pod, dark, 0.42, 0.2, 0.26, 0.05, 0.08, 0.1, 0); for (let r2 = 0; r2 < 2; r2++) for (let c2 = 0; c2 < 2; c2++) { vCyl(pod, blk, 0.045, 0.045, 0.06, 0.3, 0.06 + r2 * 0.09, (c2 - 0.5) * 0.11, 'x', 8); vCyl(pod, glow, 0.025, 0.025, 0.065, 0.305, 0.06 + r2 * 0.09, (c2 - 0.5) * 0.11, 'x', 8); } mRB(pod, acc, 0.44, 0.03, 0.27, 0.01, 0.08, 0.21, 0); (J.pods = J.pods || []).push(pod); } // shoulder rocket pods: lie flat, swing up to fire
    for (const s of [-1, 1]) { mPart(ch, mTaper(0.1, 0.13, 0.26, 12), steel, -0.62, 0.23, s * 0.16); const f = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.6, 10).rotateX(Math.PI).translate(0, -0.3, 0), flameM); f.position.set(-0.62, -0.04, s * 0.16); ch.add(f); J.flames.push(f); }
  }
  // head / cockpit: a rounded helmet, a wrap-around visor, a chin, a crest that differs per mech
  const hd = new THREE.Group(); hd.position.set(0.04, 0.78, 0); ch.add(hd); J.head = hd;
  if (worker) { // (round 36f) a big round head (a cute little helper bot) set into the collar: smooth dome + yellow cap, a curved face screen with two big eyes that blink, rosy cheeks, a little smile, ear pods, a stubby antenna
    hd.position.set(0.0, 0.6, 0); const HS = [1, 0.92, 1.05], HR = 0.4, face = lit('#1c2028'), white = new THREE.MeshBasicMaterial({ color: '#f4f8ff' }), pupil = new THREE.MeshBasicMaterial({ color: '#1a2230' }), cheek = new THREE.MeshBasicMaterial({ color: '#ff9a8a', transparent: true, opacity: 0.8 });
    mPart(hd, new THREE.SphereGeometry(HR, 28, 20), main, 0, 0.36, 0, 0, 0, 0, ...HS);
    mPart(hd, new THREE.SphereGeometry(HR + 0.006, 28, 10, 0, Math.PI * 2, 0, 0.95), acc, 0, 0.36, 0, 0, 0, 0, ...HS);                        // the cap
    mPart(hd, new THREE.SphereGeometry(HR + 0.004, 28, 16, Math.PI - 0.82, 1.64, Math.PI / 2 - 0.48, 0.92), face, 0, 0.36, 0, 0, 0, 0, ...HS); // the face screen, curved with the head
    const onFace = (a, dy, out) => [(HR + out) * Math.cos(a) * HS[0], 0.36 + dy, (HR + out) * Math.sin(a) * HS[2]];
    J.eyes = []; for (const s2 of [-1, 1]) { const a = s2 * 0.33, e = new THREE.Group(); e.position.set(...onFace(a, 0.04, 0.012)); e.rotation.y = Math.PI / 2 - a; hd.add(e);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), white); e.add(w); const pu = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), pupil); pu.position.set(0, -0.012, 0.003); e.add(pu); const hl = new THREE.Mesh(new THREE.CircleGeometry(0.022, 8), white); hl.position.set(-s2 * 0.022, 0.016, 0.006); e.add(hl); J.eyes.push(e); }
    for (const s2 of [-1, 1]) { const a = s2 * 0.6, c = new THREE.Mesh(new THREE.CircleGeometry(0.045, 14), cheek); c.position.set(...onFace(a, -0.08, 0.008)); c.rotation.y = Math.PI / 2 - a; hd.add(c); }
    { const m = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 4, 12, Math.PI), white); m.position.set(...onFace(0, -0.1, 0.01)); m.rotation.set(0, Math.PI / 2, Math.PI); hd.add(m); } // a small smile
    for (const s2 of [-1, 1]) { mPart(hd, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 20), acc, 0, 0.36, s2 * HR * HS[2], 0, 0, Math.PI / 2); mPart(hd, new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16), dark, 0, 0.36, s2 * HR * HS[2], 0, 0, Math.PI / 2); }
    const ant = new THREE.Group(); ant.position.set(-0.06, 0.72, 0); hd.add(ant); vRod(ant, steel, [0, 0, 0], [0, 0.2, 0], 0.014); mPart(ant, new THREE.SphereGeometry(0.05, 14, 10), lit('#ffcc33'), 0, 0.22, 0); J.ant = ant;
  } else {
  mPart(hd, mTaper(0.1, 0.12, 0.08, 10), steel, 0, 0.06, 0);
  mRB(hd, main, 0.32, 0.24, 0.3, 0.09, 0.02, 0.17, 0); mRB(hd, dark, 0.18, 0.08, 0.3, 0.03, 0.1, 0.06, 0);
  const vis = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 4, 14, Math.PI * 0.8), glow); vis.rotation.set(Math.PI / 2, 0, -Math.PI * 0.4); vis.position.set(0.03, 0.19, 0); hd.add(vis);
  vBox(hd, glowA, 0.04, 0.1, 0.32, 0.2, 0.19, 0);
  if (big) mRB(hd, acc, 0.36, 0.05, 0.34, 0.02, 0.03, 0.3, 0);
  if (cannon) for (const [yy, zz, rr] of [[0.2, 0, 0.045], [0.14, 0.08, 0.028], [0.14, -0.08, 0.028]]) { vCyl(hd, blk, rr + 0.015, rr + 0.015, 0.04, 0.19, yy, zz, 'x', 12); vCyl(hd, glow, rr, rr, 0.045, 0.2, yy, zz, 'x', 12); } // (round 36f) 重炮's three-lens rangefinder
  if (big && !cannon) J.stacks = [-1, 1].map(s2 => vMark(ch, -0.5, 1.1, s2 * 0.2)); // 铁卫's exhaust stacks
  if (edge) { const gd = lit('#d4ad4a'); for (const s2 of [-1, 1]) { mRB(hd, gd, 0.04, 0.36, 0.022, 0.011, 0.17, 0.44, s2 * 0.06, -0.35, 0, s2 * 0.42); mRB(hd, main, 0.14, 0.12, 0.03, 0.02, 0.06, 0.24, s2 * 0.18, 0, s2 * 0.35, 0); } /* (round 36f) a gold 鍬形 crest and 吹返 side flaps */ mPart(hd, new THREE.SphereGeometry(0.035, 12, 8), glow, 0.19, 0.31, 0); mRB(hd, dark, 0.06, 0.08, 0.2, 0.02, 0.16, 0.05, 0); for (const s2 of [-1, 1]) vBox(hd, glow, 0.012, 0.012, 0.06, 0.19, 0.06, s2 * 0.05); }
  if (fly) for (const s of [-1, 1]) mRB(hd, acc, 0.26, 0.03, 0.08, 0.012, -0.08, 0.3, s * 0.14, 0.35, 0, s * 0.3);
  if (scout) for (const s of [-1, 1]) mRB(hd, acc, 0.06, 0.18, 0.03, 0.012, -0.02, 0.34, s * 0.12, -0.3);
  } /* (round 36f) end of the non-worker head */
  // arms: ball shoulder under a curved pauldron, tapered upper arm, elbow, a gauntlet forearm, a fist with fingers
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(-0.02, 0.48, s * (0.56 * cw + 0.06)); ch.add(sh);
    if (worker) { sh.position.set(0, 0.3, s * eggR(0.3) * 1.06); const sm = (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs); // (round 36f) 工蜂's arms come out of the shell: no pauldron, no rods, round mitts
      mPart(sh, sm(0.17), main, 0, 0, s * 0.02); mPart(sh, mTaper(0.09, 0.085, 0.6, 16), dark, 0, -0.04, 0);
      const el = new THREE.Group(); el.position.y = -0.66; sh.add(el); mPart(el, sm(0.1), steel, 0, 0, 0);
      mPart(el, mTaper(0.1, 0.14, 0.5, 16), main, 0, -0.02, 0); mPart(el, new THREE.TorusGeometry(0.14, 0.022, 8, 18), acc, 0, -0.5, 0, 0, 0, Math.PI / 2);
      mPart(el, sm(0.16), blk, 0.02, -0.68, 0, 0, 0, 0, 1, 1.1, 0.95); mPart(el, sm(0.065), blk, 0.1, -0.6, -s * 0.11);
      J.arms.push({ sh, el, s, fist: vMark(el, 0.12, -0.74, 0), tip: null }); continue; }
    mPart(sh, mBall(0.14 * A), steel, 0, 0, 0);
    const pd = new THREE.Mesh(new THREE.SphereGeometry(0.27 * A, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), main); pd.scale.set(1.15, 0.75, 1); pd.rotation.x = s * 0.35; pd.position.set(0, 0.06, s * 0.05); sh.add(pd);
    const ps = new THREE.Mesh(new THREE.TorusGeometry(0.255 * A, 0.018, 4, 18), acc); ps.rotation.x = Math.PI / 2 + s * 0.35; ps.scale.set(1.15, 1, 1); ps.position.set(0, 0.07, s * 0.05); sh.add(ps);
    mPart(sh, mTaper(0.11 * A, 0.095 * A, 0.6), dark, 0, -0.04, 0);
    vRod(sh, hyd, [0.12, -0.08, 0], [0.11, -0.58, 0], 0.02);
    const el = new THREE.Group(); el.position.y = -0.66; sh.add(el);
    mPart(el, mBall(0.1 * A), steel, 0, 0, 0);
    mPart(el, mTaper(0.11 * A, 0.15 * A, 0.56, 10), main, 0, -0.02, 0, 0, 0, 0, 1.05, 1, 1);                               // gauntlet widens to the wrist
    mRB(el, dark, 0.2 * A, 0.12, 0.32 * A, 0.04, 0.02, -0.18, 0); mRB(el, line, 0.03, 0.4, 0.1, 0.01, 0.15 * A, -0.32, 0);
    mRB(el, blk, 0.27 * A, 0.22, 0.25 * A, 0.07, 0, -0.71, 0);                                                                  // fist
    for (let a = 0; a < 4; a++) mRB(el, steel, 0.07, 0.06, 0.055 * A, 0.02, 0.14 * A, -0.67 - (a % 2) * 0.012, (a - 1.5) * 0.06 * A);
    mRB(el, steel, 0.06, 0.1, 0.05, 0.02, 0.08, -0.62, -s * 0.12 * A, 0, 0, s * 0.4);                                       // thumb
    if (big && !cannon) mRB(el, acc, 0.08, 0.5, 0.42, 0.03, 0, -0.32, s * 0.18);
    if (edge && s === -1) { // (round 36f) 赤刃 carries a long curved 太刀 in its right hand (drawn from the scabbard on its back when it fights): wrapped hilt, round guard, a gently curved blade with a glowing edge
      const kat = new THREE.Group(); kat.position.set(0.1, -0.74, 0); kat.scale.setScalar(1.35); el.add(kat); J.kat = kat; const bladeM = lit('#dfe6ec'), wrap = lit('#2a1c1c'), gold = lit('#c9a24a'), hamon = new THREE.MeshBasicMaterial({ color: '#f6fbff' }), hi = lit('#8e98a2');
      mPart(kat, mTaper(0.034, 0.034, 0.38, 8), wrap, -0.2, 0, 0, Math.PI / 2); // the hilt runs from x -0.39 to -0.01
      const ito = lit('#7a1418'); for (let q = 0; q < 7; q++) for (const zz of [-1, 1]) vBox(kat, ito, 0.034, 0.034, 0.01, -0.36 + q * 0.05, 0, zz * 0.031, Math.PI / 4); // (round 36f) the diamond 柄巻 wrap
      for (const zz of [-1, 1]) mRB(kat, gold, 0.07, 0.022, 0.012, 0.006, -0.22, 0, zz * 0.036);                                    // 目貫 ornaments
      const tas = new THREE.Group(); tas.position.set(-0.43, 0, 0); kat.add(tas); J.katTas = tas; const cord = lit('#b0242a');            // a cord and tassel off the pommel
      mPart(tas, new THREE.TorusGeometry(0.03, 0.008, 4, 10), cord, -0.02, -0.02, 0); vRod(tas, cord, [-0.03, -0.04, 0], [-0.05, -0.16, 0], 0.008); mPart(tas, new THREE.ConeGeometry(0.028, 0.09, 8), cord, -0.05, -0.2, 0);
      mPart(kat, mTaper(0.042, 0.042, 0.03, 8), gold, -0.4, 0, 0, Math.PI / 2);                                                       // pommel
      const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.025, 16), lit('#2b2b2e')); tsuba.rotation.z = Math.PI / 2; tsuba.position.x = 0.01; kat.add(tsuba); // (round 36f) an iron 鍔 with a gold rim and two gold openwork petals
      mPart(kat, new THREE.TorusGeometry(0.1, 0.011, 6, 20), gold, 0.01, 0, 0, 0, Math.PI / 2, 0); for (const yy of [-1, 1]) mRB(kat, gold, 0.03, 0.045, 0.03, 0.012, 0.01, yy * 0.06, 0);
      let seg = new THREE.Group(); seg.position.x = 0.03; kat.add(seg); J.katBase = vMark(seg, 0.12, 0, 0); mRB(seg, gold, 0.07, 0.11, 0.045, 0.012, 0.03, -0.005, 0); // habaki collar
      for (let q = 0; q < 4; q++) { const L = 0.44; mRB(seg, bladeM, L + 0.03, 0.13 - q * 0.01, 0.03, 0.005, L / 2, 0, 0); vBox(seg, glow, L + 0.03, 0.018, 0.034, L / 2, -0.062 + q * 0.005, 0); vBox(seg, lit('#9aa6b0'), L + 0.03, 0.012, 0.034, L / 2, 0.035 - q * 0.004, 0); /* (round 36f) segments butt together: no gaps */
        for (let h2 = 0; h2 < 4; h2++) vBox(seg, hamon, L / 4 + 0.004, 0.012, 0.033, L / 8 + h2 * L / 4, -0.036 + q * 0.004 + (h2 % 2 ? 0.008 : -0.002), 0, (h2 % 2 ? 0.12 : -0.12)); // a wavy 刃文 line
        if (q < 3) vBox(seg, hi, L * 0.92, 0.012, 0.034, L / 2, 0.016 - q * 0.003, 0); /* the 樋 groove */ if (q === 1) J.katMid = vMark(seg, L * 0.6, 0, 0);
        const nx = new THREE.Group(); nx.position.x = L; nx.rotation.z = 0.045; seg.add(nx); seg = nx; }                       // four segments, each bent up a little: the curve
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 4).rotateZ(-Math.PI / 2).scale(1, 1, 0.3), bladeM); tip.position.set(0.12, 0.0, 0); seg.add(tip); J.katTip = vMark(seg, 0.24, 0, 0);
    }
    if (fly) mPart(el, mTaper(0.06, 0.08, 0.16, 10), blk, -0.15, -0.24, 0);
    if (edge) { const lace = lit('#b0242a'); for (let q = 0; q < 3; q++) { mRB(sh, q % 2 ? dark : main, 0.36, 0.08, 0.05, 0.02, 0, -0.04 - q * 0.085, s * (0.27 + q * 0.018), 0, 0, s * 0.22); vBox(sh, lace, 0.012, 0.07, 0.055, 0.08, -0.04 - q * 0.085, s * (0.27 + q * 0.018), 0, 0, s * 0.22); vBox(sh, lace, 0.012, 0.07, 0.055, -0.08, -0.04 - q * 0.085, s * (0.27 + q * 0.018), 0, 0, s * 0.22); } } // (round 36f) layered 大袖 shoulder plates with red lacing
    J.arms.push({ sh, el, s, fist: vMark(el, 0.12, -0.74, 0), tip: null });
  }
  if (worker) for (const A2 of J.arms) A2.sh.scale.setScalar(0.8); // (round 36f) short little arms to go with the short legs
  // what the vehicle turned into still shows: wheels, cargo box, rotor, tracks and guns ride on the mech
  const tyre = lit('#1a1a1c'), rim = lit('#9aa0a6');
  const wheelOn = (par, x, y, z, r, ry) => { const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = ry || 0; par.add(w); vCyl(w, tyre, r, r, 0.08, 0, 0, 0, 'z', 16); vCyl(w, rim, r * 0.55, r * 0.55, 0.09, 0, 0, 0, 'z', 10); const tr = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, 0.01, 4, 16), rim); w.add(tr); return w; };
  if (scout) { const sc = new THREE.Group(); sc.position.set(-0.05, 0.7, 0); ch.add(sc); const scarfM = lit('#d8382c'); mPart(sc, new THREE.TorusGeometry(0.2, 0.06, 8, 20), scarfM, 0.04, 0, 0, 0, 0, Math.PI / 2, 1, 1.25, 1); J.scarf = []; let par = sc; for (let q = 0; q < 7; q++) { const sg = new THREE.Group(); sg.position.set(q ? -0.17 : -0.18, 0, q ? 0 : 0.12); par.add(sg); mRB(sg, scarfM, 0.19, 0.15 - q * 0.012, 0.025, 0.008, -0.09, 0, 0); J.scarf.push(sg); par = sg; } } // (round 36f) 疾风's long scarf streams behind it
  if (scout) { J.kib = [wheelOn(ch, -0.58, 0.48, 0, 0.3, Math.PI / 2), wheelOn(ch, -0.58, 0.08, 0, 0.3, Math.PI / 2)]; vRod(ch, steel, [0.1, 0.95, 0.12], [0.0, 1.45, 0.25], 0.012); }
  if (edge) for (const A2 of J.arms) wheelOn(A2.sh, -0.05, 0.24, A2.s * 0.3, 0.2, 0);
  if (worker) { const box = lit('#b8893a'), box2 = lit('#9a6f2e'), tape = lit('#e8d9a8'); mRB(ch, steel, 0.06, 0.7, 0.7, 0.03, -0.46, 0.2, 0); for (const s2 of [-1, 1]) vRod(ch, steel, [-0.3, 0.55, s2 * 0.2], [-0.48, 0.5, s2 * 0.25], 0.025); // a rack of parcels on the back (round 35: on a hinge — it kicks up as it launches them)
    const rack = new THREE.Group(); rack.position.set(-0.5, 0.0, 0); ch.add(rack); J.rack = rack; J.rackBoxes = [];
    for (const [x, y, z, w, h, d, b] of [[-0.18, 0.16, -0.2, 0.34, 0.3, 0.36, box], [-0.18, 0.16, 0.2, 0.34, 0.28, 0.34, box2], [-0.2, 0.46, 0, 0.3, 0.3, 0.42, box], [-0.16, 0.72, -0.1, 0.26, 0.22, 0.28, box2]]) { const q = new THREE.Group(); q.position.set(x, y, z); rack.add(q); mRB(q, b, w, h, d, 0.02, 0, 0, 0); mRB(q, tape, w + 0.005, 0.04, d + 0.005, 0.005, 0, 0, 0); mRB(q, tape, w + 0.006, h + 0.006, 0.04, 0.005, 0, 0, 0); J.rackBoxes.push(q); }
    for (const s2 of [-1, 1]) mRB(rack, steel, 0.5, 0.04, 0.04, 0.01, -0.18, 0.9, s2 * 0.3); mRB(rack, lit('#ffcc33'), 0.04, 0.05, 0.64, 0.01, -0.42, 0.9, 0);
  }
  if (fly) { const rot = new THREE.Group(); rot.position.set(-0.45, 0.95, 0); ch.add(rot); vCyl(rot, steel, 0.05, 0.05, 0.12, 0, 0, 0, 'y', 8); for (let b2 = 0; b2 < 2; b2++) mRB(rot, dark, 1.4, 0.02, 0.1, 0.01, 0, 0.06, 0, 0, b2 * Math.PI / 2); J.rotor = rot; }
  if (cannon) { const drum = new THREE.Group(); drum.position.set(-0.62, 0.42, 0); ch.add(drum); vCyl(drum, dark, 0.24, 0.24, 0.5, 0, 0, 0, 'z', 18); for (const zz of [-0.24, 0.24]) vCyl(drum, steel, 0.25, 0.25, 0.04, 0, 0, zz, 'z', 18); vCyl(drum, acc, 0.1, 0.1, 0.52, 0, 0, 0, 'z', 12); const brass = lit('#c9a24a'); for (let q = 0; q < 7; q++) { const f = q / 6; vBox(ch, brass, 0.05, 0.1, 0.03, lerp(-0.45, -0.2, f), lerp(0.62, 0.86, f), lerp(0.18, 0.4, f), 0.4); } J.drum = drum; } // (round 36f) 重炮: an ammo drum on its back feeding a belt to the shoulder gun
  if (cannon) { { const A1 = J.arms[1], ag = new THREE.Group(); A1.el.add(ag); J.armGun = ag; mPart(ag, mTaper(0.075, 0.065, 0.85, 12), steel, 0, 0, 0); mPart(ag, mTaper(0.09, 0.09, 0.08, 12), blk, 0, -0.78, 0); vCyl(ag, glow, 0.04, 0.04, 0.01, 0, -0.86, 0, 'y', 10); ag.position.y = -0.2; } // (round 35) slides out past the fist to fire
    for (const s2 of [-1, 1]) { const gun = new THREE.Group(); gun.position.set(-0.15, 0.84, s2 * 0.44); ch.add(gun); mRB(gun, dark, 0.38, 0.24, 0.26, 0.06, 0, 0, 0); mPart(gun, mTaper(0.07, 0.06, 0.95, 12), main, 0.12, 0.02, 0, Math.PI / 2); mRB(gun, blk, 0.09, 0.11, 0.11, 0.03, 1.08, 0.02, 0); (J.guns = J.guns || []).push(gun); }
    for (const G of J.legs) { mRB(G.kn, tyre, 0.09, D.sh * 0.8, 0.3, 0.03, -0.21, -D.sh * 0.5, 0); for (let t2 = 0; t2 < 5; t2++) vBox(G.kn, steel, 0.09, 0.025, 0.31, -0.23, -0.12 - t2 * D.sh * 0.15, 0); } }
  g.traverse(o => { if (o.isMesh && !o.material.transparent && o.material.type !== 'MeshBasicMaterial') o.castShadow = true; });
  g.userData.J = J; return g;
}

// (round 34b) pose the mech: every joint is a damped spring toward a target pose, so moves flow into each other.
// Walking: stride matched to ground speed (no foot sliding), hips sway and drop on each step, shoulders counter-turn, fists up in a guard,
// walks backwards instead of turning round when you back away. Attacks: a three-hit combo with wind-up, strike (torso twist, step in,
// full extension), follow-through and recovery; 赤刃 slashes in wide arcs with a trail; a hit freezes the pose for a blink (hit-stop).
const MSPR = { k: 260, z: 0.82 }, _vw2 = new THREE.Vector3();
function mSpring(J, key, target, dt, k) {
  const S = J.sp || (J.sp = {}), q = S[key] || (S[key] = { x: target, v: 0 }), K = k || MSPR.k, C = 2 * Math.sqrt(K) * MSPR.z;
  const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n; for (let i = 0; i < n; i++) { q.v += (K * (target - q.x) - C * q.v) * h; q.x += q.v * h; } return q.x;
}
const MSTRIDE = 2.4; // ground covered per full walk cycle at full stride
// (round 34b) the folded-up pose a mech unfolds from when a vehicle transforms: knees to the chest, arms swept back, torso turned round
const MFOLD = { thL: 1.3, thR: 1.3, knL: 2.4, knR: 2.4, lean: 0.55, cr: 0, bob: 0, roll: 0, yawH: 0, twist: Math.PI, yaw: 0, sh0: -2.4, sh1: -2.4, el0: 2.5, el1: 2.5, ab0: 0.9, ab1: 0.9, blade: -2.9 };
function mechTick(p, mm, dt, xf = 1) { // xf < 1: mid-transform (0 = folded up, 1 = standing)
  const J = mm.userData.J, M = mechOf(p), L = J.LEG || MECH_LEG, k = J.k, DS = J.D ? J.D.s : 1;
  // hit-stop: a landed blow freezes the attack pose for a moment
  if (p._mhs > 0) { p._mhs -= dt; dt *= 0.08; }
  const sp = p._spd || 0, maxS = BAL.pSpeed * M.spd, a = clamp(sp / (maxS * 0.85), 0, 1.1), air = (p.jz || 0) > 0.05 || airborne(p);
  const back = p._mback ? -1 : 1;
  // stride: phase advances with distance walked, so the planted foot stays put
  J.ph = (J.ph || 0) + back * (sp * dt / Math.max(0.6, MSTRIDE * DS * (L.th + L.sh) / 1.5 * (0.45 + 0.55 * Math.min(1, a)))) * Math.PI * 2; // longer legs, longer strides
  const ph = J.ph, sw = Math.sin(ph), cw = Math.cos(ph);
  if (p._mpT != null) p._mpT += dt; if (p._msT != null) p._msT += dt;
  const sT = p._msT != null ? p._msT : 99, sk = p._msK, t = p._mpT != null ? p._mpT : 99, side = p._mpS ? 1 : 0, combo = p._mcombo || 0;
  // ---- target pose: locomotion + guard ----
  const T = { lean: 0.1 * a + (J.D ? J.D.hunch : 0), crouch: 0.04 * a, twist: 0, roll: 0, yawH: 0, sh: [0.3, 0.3], el: [1.95, 1.95], ab: [0.12, 0.12], blade: -2.9, flame: 0 };
  T.thL = 0.46 * a * sw; T.thR = -0.46 * a * sw;
  // (round 35) out of a fight the arms hang and swing with the stride like a walker's (opposite to the legs); the guard (fists up) only for a moment after an attack
  const cmb = t < 1.2 || sT < 1 ? 1 : t < 1.8 ? 1 - ease((t - 1.2) / 0.6) : 0; J.cmb = cmb;
  for (let n = 0; n < 2; n++) { const leg = n ? T.thR : T.thL; T.sh[n] = lerp(0.06 - leg * 0.85, 0.45, cmb); T.el[n] = lerp(0.25 + 0.35 * a, 1.7, cmb); T.ab[n] = lerp(0.08, 0.15, cmb); }
  T.knL = 0.12 + a * (sw < 0 ? 0.25 : 0) + Math.max(0, -cw * back) * 0.85 * a; T.knR = 0.12 + a * (sw > 0 ? 0.25 : 0) + Math.max(0, cw * back) * 0.85 * a; // knee lifts on the swing leg
  T.bob = -Math.abs(cw) * 0.06 * a; T.roll = sw * 0.05 * a; T.yawH = sw * 0.1 * a; T.twist = -sw * 0.14 * a; // hips sway / drop, shoulders counter-turn
  T.sh[0] += -sw * 0.14 * a * cmb; T.sh[1] += sw * 0.14 * a * cmb;                                          // in the guard the fists bob with the stride
  if (!a) { const br = Math.sin(W.t * 1.6 + p.i) * 0.012; T.bob = br; T.sh[0] += br * 2; T.sh[1] += br * 2; } // idle: servo breathing
  // ---- attacks (round 34d): every melee mech hits DOWN at zombie height; the ranged ones aim and fire. wind-up 0.12 s, strike to 0.2, hold to 0.3, recover to 0.6 ----
  if (t < 0.6) {
    const f = t < 0.12 ? -ease(t / 0.12) * 0.6 : t < 0.2 ? -0.6 + ease((t - 0.12) / 0.08) * 1.6 : t < 0.3 ? 1 : 1 - ease((t - 0.3) / 0.3); // -0.6 cocked … 1 struck
    const o = 1 - side, sgn = side ? 1 : -1, on = Math.max(0, f), cock = Math.max(0, -f / 0.6), rest = 1 - cock - on, st = J.st;
    if (st === 'slim') { // 赤刃 (round 36f): sword work with the 太刀 in the right hand (arm 0) — 袈裟斩 (high right down across to low left), 横斩 (a flat sweep), then a two-handed 唐竹割 (overhead straight down)
      const G = { sh: 0.9, el: 1.2, ab: 0.05, kz: 0.75, kx: 0 }, mix = (c, s) => c * cock + s * on + (c === undefined ? 0 : 0) , bl = (cv, sv, gv) => cv * cock + sv * on + gv * rest;
      if (combo === 0) { T.sh[0] = bl(2.7, 0.55, G.sh); T.ab[0] = bl(0.6, -0.55, G.ab); T.el[0] = bl(0.5, 0.05, G.el); T.kz = bl(1.55, -0.4, G.kz); T.kx = 0; T.twist = 0.5 * cock - 0.65 * on; T.lean += 0.38 * on - 0.08 * cock; T.crouch += 0.22 * on; T.sh[1] = bl(1.2, 0.35, 0.8); T.el[1] = bl(1.3, 0.8, 1.3); T.ab[1] = -0.2; }
      else if (combo === 1) { T.sh[0] = bl(1.35, 1.4, G.sh); T.ab[0] = bl(1.3, -1.0, G.ab); T.el[0] = bl(0.35, 0.1, G.el); T.kz = bl(0.15, 0.05, G.kz); T.kx = bl(1.45, 1.45, 0); T.twist = 0.8 * cock - 0.95 * on; T.crouch += 0.26 * on; T.lean += 0.12 * on; T.sh[1] = 0.5; T.el[1] = 1.0; T.ab[1] = 0.4 * on; }
      else { for (const s2 of [0, 1]) { T.sh[s2] = bl(2.95, 0.5, G.sh); T.el[s2] = bl(0.55, 0.08, 1.2); T.ab[s2] = s2 ? -0.18 : 0.18; } T.kz = bl(1.95, -0.3, G.kz); T.kx = 0; T.twist = 0; T.lean += 0.5 * on - 0.15 * cock; T.crouch += 0.34 * on; }
      void mix; void sgn; void o;
    } else if (st === 'big') { // 铁卫: hammer fist into the ground, a stomp, then the fist cannon
      if (combo === 0) { T.sh[side] = 2.8 * cock + 0.35 * on + 0.3 * rest; T.el[side] = 0.2; T.lean += 0.45 * on; T.crouch += 0.28 * on; T.twist = sgn * -0.3 * on; T.sh[o] = 0.7; T.el[o] = 1.5; }
      else if (combo === 1) { const up = t < 0.15 ? ease(t / 0.15) : 0, dn = t >= 0.15 && t < 0.3 ? 1 : t >= 0.3 ? 1 - ease((t - 0.3) / 0.3) : 0; if (side) { T.thL = 1.1 * up + 0.25 * dn; T.knL = 1.5 * up + 0.2 * dn; } else { T.thR = 1.1 * up + 0.25 * dn; T.knR = 1.5 * up + 0.2 * dn; } T.crouch += 0.18 * dn; T.lean += 0.1 * dn; T.ab = [0.5 * up + 0.3, 0.5 * up + 0.3]; T.sh = [0.3, 0.3]; T.el = [0.9, 0.9]; }
      else { T.sh[side] = 0.55 + 1.0 * (on + cock * 0.6); T.el[side] = 1.3 * (1 - on) + 0.05; T.twist = sgn * (0.3 * cock - 0.5 * on); T.lean -= 0.12 * on; T.sh[o] = 0.65; T.el[o] = 1.55; }
    } else if (st === 'worker') { // 工蜂 (round 35): points where it wants them and the back rack kicks up, flinging parcels out over the shoulder
      T.sh[side] = 1.45 * (on + cock) + 0.3 * rest; T.el[side] = 0.15; T.ab[side] = 0.1; T.twist = sgn * -0.25 * on; T.lean -= 0.12 * on - 0.1 * cock; T.crouch += 0.12 * cock; T.sh[o] = 0.5; T.el[o] = 1.3; T.rack = 0.55 * on - 0.1 * cock;
    } else if (st === 'scout') { // 疾风: low snap kicks, arms swinging against them
      const thK = -0.45 * cock + 1.15 * on, knK = 1.3 * cock + 0.1 * on + 0.2 * rest; if (side) { T.thL = thK; T.knL = knK; } else { T.thR = thK; T.knR = knK; }
      T.sh[side] = 0.2; T.sh[o] = 1.0 * on + 0.3 * rest; T.el = [1.6, 1.6]; T.lean -= 0.15 * on; T.twist = sgn * 0.3 * on;
    } else if (st === 'cannon') { // 重炮: the right arm comes up, the barrel slides out of the forearm and kicks back on each shot; the shoulder guns swing up off the back
      T.sh[1] = 1.55; T.el[1] = 0.05 + 0.35 * on * (t < 0.25 ? 1 : 0); T.twist = -0.25; T.sh[0] = 0.75; T.el[0] = 1.5; T.lean -= 0.08 * on;
    } else { // 苍隼: the shoulder pods swing up and fire, arms braced
      T.sh = [0.6, 0.6]; T.el = [1.3, 1.3]; T.lean -= 0.1 * on; T.podK = on;
    }
  }
  // ---- skills ----
  if (sk === 'slam' && sT < 0.95) { if (sT < 0.3) { const f = ease(sT / 0.3); T.sh = [2.8 * f, 2.8 * f]; T.el = [0.3, 0.3]; T.crouch = 0.1 * f; T.lean = -0.1 * f; } else if (sT < 0.45) { const f = ease((sT - 0.3) / 0.15); T.sh = [2.8 - f * 2.2, 2.8 - f * 2.2]; T.el = [0.1, 0.1]; T.crouch = 0.1 + f * 0.38; T.lean = f * 0.45; } else { const f = ease((sT - 0.45) / 0.5); T.sh = [0.6 + 0.0 * f, 0.6]; T.crouch = 0.48 * (1 - f); T.lean = 0.45 * (1 - f); } }
  if (sk === 'parcels' && sT < 0.9) { const f = sT < 0.25 ? ease(sT / 0.25) : 1 - ease((sT - 0.25) / 0.65); T.sh = [2.2 * f + 0.3 * (1 - f), 2.2 * f + 0.3 * (1 - f)]; T.ab = [0.8 * f, 0.8 * f]; T.el = [0.3, 0.3]; T.lean -= 0.25 * f; T.crouch += 0.15 * f; T.rack = 1.1 * f; } // (round 35) the rack tips right up and sprays the lot
  if (sk === 'dash' && sT < 0.55) { const f = sT < 0.4 ? 1 : 1 - (sT - 0.4) / 0.15; T.lean = 0.55 * f; T.sh = [-0.5 * f + 0.55 * (1 - f), 1.4 * f + 0.55 * (1 - f)]; T.el = [0.2, 0.3]; T.ab = [0.3, 1.0 * f]; T.crouch = 0.15 * f; T.thL = 0.6 * f; T.thR = -0.5 * f; T.knL = 0.5 * f + 0.15; T.knR = 0.9 * f + 0.15; T.blade = 0; T.flame = 1; T.twist = -0.6 * f; }
  if (sk === 'leap' && sT < 1.3) { if (sT < 0.15) T.crouch = ease(sT / 0.15) * 0.35; T.flame = air || sT < 1.05 ? 1 : 0; }
  if (J.kat && J.cmb > 0.05 && t >= 0.6 && t < 1.2 && !(sT < 1)) { T.kz = 0.75; T.kx = 0; T.sh[0] = lerp(T.sh[0], 0.9, J.cmb); T.el[0] = lerp(T.el[0], 1.2, J.cmb); T.sh[1] = lerp(T.sh[1], 0.85, J.cmb); T.el[1] = lerp(T.el[1], 1.35, J.cmb); T.ab[1] = lerp(T.ab[1], -0.35, J.cmb); } // (round 36f) 赤刃's 中段 guard between cuts: both hands toward the hilt, the blade up and forward
  if (J.kat && t >= 1.2 && t < 1.8 && !(sT < 1)) { const f = ease(clamp((t - 1.2) / 0.22, 0, 1)), g = ease(clamp((t - 1.42) / 0.3, 0, 1)); // (round 36f) 血振り: a sharp flick down and out, then the hand goes over the shoulder to slide it back into the scabbard
    T.sh[0] = lerp(lerp(0.9, 0.3, f), 2.95, g); T.ab[0] = lerp(lerp(0.05, 0.95, f), -0.4, g); T.el[0] = lerp(lerp(1.2, 0.12, f), 1.95, g); T.kz = lerp(lerp(0.75, -1.0, f), 2.5, g); T.kx = 0; T.sh[1] = 0.35; T.el[1] = 1.4; T.twist = 0.25 * f * (1 - g); }
  // (round 36f) 工蜂 grabs what it finds: reaches down in front with its right hand, then flings it back over its shoulder into the rack
  if (J.st === 'worker' && p._grabT != null && p._grabT < 1.05) { p._grabT += dt; const g = p._grabT; // (round 36f) 工蜂 bends down, picks the thing up, hoists it over its head and lobs it into the rack on its back
    if (g < 0.28) { const r = ease(g / 0.28); T.sh[1] = lerp(T.sh[1], 1.3, r); T.el[1] = lerp(T.el[1], 0.1, r); T.ab[1] = 0.05; T.sh[0] = lerp(T.sh[0], 0.9, r); T.el[0] = lerp(T.el[0], 0.3, r); T.lean += 0.45 * r; T.crouch += 0.22 * r; }
    else if (g < 0.6) { const r = ease((g - 0.28) / 0.32); T.sh[1] = 1.3 + 1.85 * r; T.el[1] = 0.1 + 1.0 * r; T.ab[1] = 0.05; T.sh[0] = 0.9 + 1.4 * r; T.el[0] = 0.3 + 0.5 * r; T.ab[0] = 0.3 * r; T.lean += 0.45 - 0.75 * r; T.crouch += 0.22 * (1 - r); T.twist = 0.25 * r; }
    else { const r = ease(Math.min(1, (g - 0.6) / 0.3)); T.sh[1] = 3.15 - 0.9 * r; T.el[1] = 1.1 - 0.8 * r; T.sh[0] = 2.3 - 1.2 * r; T.el[0] = 0.8; T.ab[0] = 0.3; T.lean += -0.3 + 0.3 * r; T.twist = 0.25 - 0.45 * r; T.rack = Math.max(T.rack || 0, g > 0.88 ? 0.5 * Math.sin(Math.min(1, (g - 0.88) / 0.17) * Math.PI) : 0); } }
  if (air) { T.thL = 0.55; T.thR = 0.15; T.knL = 1.2; T.knR = 0.75; T.sh = [0.9, 0.9]; T.el = [0.9, 0.9]; T.ab = [0.5, 0.5]; T.flame = 1; T.lean = 0.15; }
  // ---- springs → joints ----
  const u = xf < 1 ? ease(xf) : 1;
  const S = xf < 1 ? (key, v) => { const fv = MFOLD[key] != null ? MFOLD[key] : v, x = lerp(fv, v, u), q = (J.sp || (J.sp = {}))[key] = { x, v: 0 }; return q.x; } : (key, v, kk) => mSpring(J, key, v, dt, kk); // mid-transform: driven straight from the fold, springs pick up from there
  mm.scale.setScalar(xf < 1 ? lerp(0.5, 1, Math.min(1.06, u * 1.06)) : 1); J.head.scale.setScalar(xf < 1 ? clamp((xf - 0.55) / 0.3, 0.01, 1) : 1);
  const thL = S('thL', T.thL, 420), thR = S('thR', T.thR, 420), knL = S('knL', T.knL, 420), knR = S('knR', T.knR, 420);
  const lean = S('lean', T.lean, 160), crouch = S('cr', T.crouch, 260), bob = S('bob', T.bob, 500), roll = S('roll', T.roll, 200), yawH = S('yawH', T.yawH, 200);
  const legH = (q, kq) => L.th * Math.cos(q) + L.sh * Math.cos(q - kq) + L.ft;
  J.pel.position.y = Math.max(legH(thL + lean * 0.4, knL), legH(thR + lean * 0.4, knR)) - crouch + bob;
  J.pel.rotation.set(roll, yawH, -lean * 0.4);
  [[thL, knL], [thR, knR]].forEach(([q, kq], n) => { const G = J.legs[n]; G.hip.rotation.z = q + lean * 0.4; G.kn.rotation.z = -kq; G.an.rotation.z = kq - q - lean * 0.4 + (n ? (sw < -0.6 ? 0.25 : 0) : (sw > 0.6 ? 0.25 : 0)) * a * back; }); // toe pushes off at the end of the stance
  const twist = S('twist', T.twist, 300), face = p._ly; // (walking backwards, _ly already faces away from the way you go)
  const yaw = S('yaw', clamp(-angDiff(face, p.aim), -1.5, 1.5), 160) - yawH + twist;
  J.tor.rotation.set(-roll * 0.6, yaw, -lean * 0.7);
  J.head.rotation.set(0, -twist * 0.4, lean * 0.4);
  J.arms.forEach((A, n) => { A.sh.rotation.z = S('sh' + n, T.sh[n], 380); A.el.rotation.z = S('el' + n, T.el[n], 380); A.sh.rotation.x = A.s * S('ab' + n, T.ab[n], 300); });
  for (const b of J.blades) b.rotation.z = S('blade', J.cmb > 0.25 ? 0 : T.blade, 600);
  if (J.kat) { const drawn = sT < 1 || J.cmb > 0.05 && t < 1.7; J.kat.visible = drawn; if (J.katSheathed) J.katSheathed.visible = !drawn; // (round 36f) the 太刀: in hand for a fight, back in the scabbard after
    if (drawn !== J._drawn) { if (J._drawn != null && J.katTip) { J.katBase.getWorldPosition(_vw); for (let q = 0; q < 8; q++) addP({ x: _vw.x, y: _vw.z, z: _vw.y, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(0, 2), g: 0.5, col: drawn ? '#fff0d0' : '#ffb060', s: 0.05, life: 0.25 }); if (p.i === ME) sfx(drawn ? 'clink' : 'clank'); } J._drawn = drawn; } // the draw flashes, the sheathe clicks
    if (J.katTas) { J.katTas.rotation.z = Math.sin(W.t * 5 + p.i) * 0.25 + (J.sp && J.sp.kz ? clamp(J.sp.kz.v || 0, -6, 6) * 0.08 : 0); J.katTas.rotation.x = Math.sin(W.t * 3.3) * 0.2; }
    J.kat.rotation.z = S('kz', T.kz != null ? T.kz : 0.75, 520); J.kat.rotation.x = S('kx', T.kx || 0, 520); } // (round 35) the arm blades flick out for a fight, fold back along the forearm after
  // (round 35) weapons deploy: 重炮's arm barrel slides out and its shoulder guns swing up off the back; 苍隼's pods rise; 工蜂's rack kicks; 苍隼's wings spread to fly
  const dep = S('dep', J.cmb > 0.05 ? 1 : 0, 120);
  if (J.armGun) J.armGun.position.y = lerp(0.05, -0.55, dep) + (t < 0.18 ? 0.12 * (1 - t / 0.18) : 0);
  if (J.guns) for (const G of J.guns) G.rotation.z = lerp(1.2, 0, dep);
  if (J.pods) { const pk = S('pod', J.cmb > 0.05 ? 1 : 0, 160); for (const P of J.pods) { P.rotation.z = lerp(-1.3, 0.15, pk) + (T.podK ? -0.06 * T.podK : 0); P.scale.setScalar(lerp(0.75, 1, pk)); } }
  if (J.rack) J.rack.rotation.z = S('rack', T.rack || 0, 300);
  if (J.wings) { const wo = S('wing', p.mfly || air ? 1 : sp > maxS * 0.8 ? 0.25 : 0, 90); if (J.feath) for (const F of J.feath) F.g.rotation.y = F.s * (F.k - 1) * 0.3 * wo; /* (round 36f) the tip feathers fan out as the wings spread */ if (J.wtips && wo > 0.6 && (p.mfly || air) && FXR() < dt * 40) for (const m2 of J.wtips) { m2.getWorldPosition(_vw); addP({ x: _vw.x, y: _vw.z, z: _vw.y, vx: 0, vy: 0, vz: 0, g: 0, col: '#e8f4ff', s: 0.05, life: 0.45 }); } for (const Wg of J.wings) { const s2 = Wg.userData.s; Wg.rotation.set(s2 * lerp(0.2, 0.05, wo), s2 * lerp(1.25, 0.08, wo), lerp(0.75, 0.12, wo) + (wo > 0.6 ? Math.sin(W.t * 3 + s2) * 0.04 : 0)); if (Wg.userData.tip) Wg.userData.tip.rotation.y = s2 * lerp(2.2, 0, wo); } }
  if (J.buckets) { const bz = S('bucket', J.st === 'worker' && t < 0.45 && t > 0.1 ? -0.8 : 0.5, 400); for (const b of J.buckets) b.rotation.z = bz; } // the bucket curls as it scoops
  // ---- effects: reactor, thrusters, blade trail, footfalls ----
  const pulse = 0.85 + Math.sin(W.t * 4 + p.i) * 0.15; J.coreHalo.scale.set(1, pulse, pulse);
  if (J.eyes) { const bl = (W.t + p.i * 1.7) % 3.4 < 0.13 ? 0.08 : p._grabT != null && p._grabT < 1.05 ? 1.3 : 1; for (const e of J.eyes) e.scale.y = lerp(e.scale.y, bl, Math.min(1, dt * 30)); } // (round 36f) blinks; wide-eyed when it grabs something
  if (J.ant) { J.ant.rotation.z = S('ant', (sp > 0.4 ? Math.sin(W.t * 13) * 0.22 : Math.sin(W.t * 2.2) * 0.07) - lean * 0.6, 220); J.head.rotation.z += Math.sin(W.t * 2.4 + p.i) * 0.04; J.head.rotation.x = Math.sin(W.t * 1.7 + p.i) * 0.05; } // antenna wobble, a little head tilt
  for (const f of J.flames) { f.visible = T.flame > 0 || sp > maxS * 0.9; f.scale.y = (T.flame ? 1.4 : 0.6) * (0.85 + FXR() * 0.3); }
  const pz = (p.zv != null ? p.zv : p.z) + (p.rjz != null ? p.rjz : p.jz || 0), px = p.rx != null ? p.rx : p.x, py = p.ry != null ? p.ry : p.y;
  if (T.flame && FXR() < dt * 40) addP({ x: px - Math.cos(p._ly) * 0.7, y: py - Math.sin(p._ly) * 0.7, z: pz + 1.6, vx: frnd(-0.4, 0.4), vy: frnd(-0.4, 0.4), vz: -2, g: -0.3, col: '#ffb060', s: 0.09, life: 0.3 });
  if (J.kat) { // (round 36f) a ribbon of light swept by the blade (world space, fades in 0.16 s) + a few sparks off the tip
    const TR = J.trl || (J.trl = { pts: [] }), on = J.st === 'slim' && t > 0.05 && t < 0.4 && J.kat.visible;
    if (!TR.m) { const N = 28, gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3)); gg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3)); const ix = []; for (let q = 0; q < N - 1; q++) { const a0 = q * 2; ix.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); } gg.setIndex(ix);
      TR.m = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); TR.m.frustumCulled = false; KTRL.push(TR.m); TR.N = N; TR.col = new THREE.Color(M.glow || '#ff6040'); SCN.add(TR.m); }
    TR.m.userData.seen = W.t; const now = W.t; if (on) { J.katTip.getWorldPosition(_vw); J.katMid.getWorldPosition(_vw2); TR.pts.push({ a: _vw2.clone(), b: _vw.clone(), t: now }); if (FXR() < 0.5) addP({ x: _vw.x, y: _vw.z, z: _vw.y, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: frnd(0, 1.5), g: 0.6, col: '#fff0d0', s: 0.045, life: 0.2 }); }
    while (TR.pts.length && (now - TR.pts[0].t > 0.16 || TR.pts.length > TR.N)) TR.pts.shift();
    const n = TR.pts.length; TR.m.visible = n > 1;
    if (n > 1) { const P = TR.m.geometry.attributes.position, C = TR.m.geometry.attributes.color; for (let q = 0; q < n; q++) { const pt = TR.pts[q], k2 = 1 - (now - pt.t) / 0.16, f = Math.max(0, k2) * (q / (n - 1)); P.setXYZ(q * 2, pt.a.x, pt.a.y, pt.a.z); P.setXYZ(q * 2 + 1, pt.b.x, pt.b.y, pt.b.z); C.setXYZ(q * 2, TR.col.r * f * 0.08, TR.col.g * f * 0.08, TR.col.b * f * 0.08); C.setXYZ(q * 2 + 1, Math.min(1, TR.col.r * f * 0.75 + f * 0.15), Math.min(1, TR.col.g * f * 0.75 + f * 0.12), Math.min(1, TR.col.b * f * 0.75 + f * 0.1)); }
      P.needsUpdate = true; C.needsUpdate = true; TR.m.geometry.setDrawRange(0, (n - 1) * 6); }
  }
  if (J.st === 'worker' && J.rack) { const g = p._grabT, on = g != null && g > 0.18 && g < 0.92; // (round 36f) the thing it picked up: in its hand, then flying in an arc over its head into the rack
    if (on && !J.held) { const h = J.held = new THREE.Group(), bx = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), new THREE.MeshLambertMaterial({ color: '#b8893a' })); h.add(bx); vBox(h, lam('#e8d9a8'), 0.35, 0.06, 0.35, 0, 0.02, 0); J.heldM = bx.material; mm.add(h); }
    if (J.held) { J.held.visible = on; if (on) { if (J.heldM.color.getStyle() !== (p._grabCol || '#b8893a')) J.heldM.color.set(p._grabCol || '#b8893a'); mm.updateMatrixWorld(true);
      if (g < 0.6) { J.arms[1].fist.getWorldPosition(_vw); mm.worldToLocal(J.held.position.copy(_vw)); J.held.position.y -= 0.05; J.held.rotation.set(0, 0, 0); J._relP = (J._relP || new THREE.Vector3()).copy(J.held.position); }
      else { const f = (g - 0.6) / 0.32; J.rack.getWorldPosition(_vw2); mm.worldToLocal(_vw2); _vw2.y += 0.75; J.held.position.lerpVectors(J._relP, _vw2, f); J.held.position.y += Math.sin(f * Math.PI) * 0.9; J.held.rotation.set(f * 5, f * 2, f * 7); J.held.scale.setScalar(1 - 0.35 * f); } }
      if (!on && g != null && g >= 0.92 && !J._landed) { J._landed = true; if (p.i === ME) sfx('thunk'); J.rack.getWorldPosition(_vw2); for (let k = 0; k < 6; k++) addP({ x: _vw2.x, y: _vw2.z, z: _vw2.y + 0.8, vx: frnd(-1.4, 1.4), vy: frnd(-1.4, 1.4), vz: frnd(0.5, 2), col: k % 2 ? '#fff0b0' : p._grabCol || '#b8893a', s: 0.07, life: 0.4 }); }
      if (g != null && g < 0.6) { J._landed = false; J.held.scale.setScalar(1); } } }
  if (J.scarf) { const f = clamp(sp / (maxS * 0.9), 0, 1) + (sT < 0.6 ? 0.6 : 0); for (let q = 0; q < J.scarf.length; q++) { const sg = J.scarf[q]; sg.rotation.z = (q ? 0.18 : 1.0) * (1 - Math.min(1, f)) + (q ? -0.04 * f : 0.15) + Math.sin(W.t * (6 + 8 * f) - q * 0.9) * (0.06 + 0.12 * f); sg.rotation.y = Math.sin(W.t * (4 + 6 * f) - q * 0.7) * (0.08 + 0.18 * f); } } // (round 36f) hangs when it stands, streams and ripples when it runs
  if (J.stacks && FXR() < dt * (1.2 + a * 5)) { const m2 = J.stacks[FXR() < 0.5 ? 0 : 1]; m2.getWorldPosition(_vw); addP({ x: _vw.x, y: _vw.z, z: _vw.y, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 1.2 + a, g: -0.2, col: '#6a6a6e', s: 0.1, life: 0.9, smoke: 1 }); } // (round 36f) 铁卫's stacks puff smoke, more when it runs
  const st = Math.sign(Math.sin(ph)); if (a > 0.3 && st !== J.fs && !air) { const s2 = st > 0 ? 1 : -1, aa = p._ly + Math.PI / 2 * s2; for (let q = 0; q < 5; q++) addP({ x: px + Math.cos(aa) * 0.38, y: py + Math.sin(aa) * 0.38, z: pz + 0.05, vx: frnd(-0.9, 0.9), vy: frnd(-0.9, 0.9), vz: 0.35, g: -0.2, col: '#8a7e6a', s: 0.12, life: 0.5, smoke: 1 }); if (p.i === ME) { shake(px, py, J.st === 'big' || J.st === 'cannon' ? 0.07 : J.st === 'scout' ? 0.02 : 0.04); if (thr('mstep', 0.25)) sfx('mstep', px, py); } } J.fs = st; /* (round 35) was J.st = st: overwrote the mech's style after the first footstep, so the style's attack poses stopped playing */
}
