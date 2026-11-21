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
  const crate = (x, y, z, s, ry) => { const c = new THREE.Group(); c.position.set(x, y, z); c.rotation.y = ry; v.add(c); vBox(c, wd, s, s * 0.75, s, 0, 0, 0); for (const q of [-1, 1]) { vBox(c, wd2, s + 0.006, 0.025, 0.025, 0, q * s * 0.3, s * 0.5); vBox(c, wd2, s + 0.006, 0.025, 0.025, 0, q * s * 0.3, -s * 0.5); } vBox(c, wd2, s * 1.2, 0.022, 0.022, 0, 0, s * 0.5 + 0.004, 0.62); };
  crate(-0.62, 0.48, 0.13, 0.24, 0.15); crate(-0.6, 0.66, 0.1, 0.16, -0.35);
  vBox(v, lam('#a89a78'), 0.22, 0.12, 0.2, -0.36, 0.44, -0.15, 0.25, 0.3); vBox(v, lam('#7e7258'), 0.05, 0.03, 0.06, -0.26, 0.52, -0.15, 0.25);
  vBox(v, lam('#b02a22'), 0.09, 0.16, 0.14, -0.32, 0.47, 0.19); vBox(v, lam('#222'), 0.03, 0.03, 0.03, -0.3, 0.565, 0.23);
  vRod(v, lam('#6a7a86'), [-0.78, 0.47, -0.25], [-0.26, 0.5, -0.04], 0.018); vRod(v, lam('#8a6a54'), [-0.76, 0.45, -0.05], [-0.4, 0.48, -0.28], 0.014);
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
