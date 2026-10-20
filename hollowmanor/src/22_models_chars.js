/* ================= characters, ghost, items ================= */
const CM = {}; // character materials (no cut-away)
function cmat(k, o) { if (!CM[k]) CM[k] = new THREE.MeshStandardMaterial(o); return CM[k]; }
const cm = (c, r = 0.75, extra) => cmat('c' + c + r + (extra ? JSON.stringify(extra) : ''), Object.assign({ color: c, roughness: r }, extra || {}));
const cfab = (c, r = 0.92) => cmat('f' + c, { color: c, roughness: r, map: TEX.fabric });
const SKIN = () => cmat('skin', { color: 0xe8c4a6, roughness: 0.62 });
function limb(p, rTop, rBot, len, mat, seg = 12) { const m = addM(p, new THREE.CapsuleGeometry((rTop + rBot) / 2, len, 4, seg), mat, 0, -len / 2, 0); m.geometry.scale(rTop / ((rTop + rBot) / 2) * 0.5 + 0.5, 1, 1); return m; }
function taper(p, rTop, rBot, len, mat, seg = 14) { const g = new THREE.CylinderGeometry(rTop, rBot, len, seg, 1); addM(p, g, mat, 0, -len / 2, 0); addM(p, GEO.sph(rBot, seg, 8), mat, 0, -len, 0); addM(p, GEO.sph(rTop, seg, 8), mat, 0, 0, 0); }
/* generic humanoid rig: root → hips → (legL, legR), torso → chest → (head, armL, armR) */
function rig(o) {
  const root = new THREE.Group(), body = grp(root), hips = grp(body, 0, o.hipY, 0), torso = grp(hips, 0, 0.02, 0), chest = grp(torso, 0, o.chestY, 0), head = grp(chest, 0, o.headY, 0);
  const mkArm = sx => { const sh = grp(chest, sx * o.shX, o.shY, 0), el = grp(sh, 0, -o.upper, 0), hand = grp(el, 0, -o.fore, 0); return { sh, el, hand }; };
  const mkLeg = sx => { const hp = grp(hips, sx * o.legX, -0.02, 0), kn = grp(hp, 0, -o.thigh, 0), ft = grp(kn, 0, -o.shin, 0); return { hp, kn, ft }; };
  return { root, body, hips, torso, chest, head, aL: mkArm(1), aR: mkArm(-1), lL: mkLeg(1), lR: mkLeg(-1), o };
}
function eyes(head, o) {
  const white = cm(0xf4f0ea, 0.25), iris = cm(o.iris || 0x2a1a10, 0.2), hl = cmat('eyehl', { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
  for (const sx of [-1, 1]) {
    const e = grp(head, sx * o.ex, o.ey, o.ez);
    addM(e, GEO.sph(o.er, 14, 10), white, 0, 0, 0, 0, 0, 0, 0.9, 1.15, 0.55);
    addM(e, GEO.sph(o.er * 0.62, 12, 10), iris, sx * 0.002, -0.002, o.er * 0.38, 0, 0, 0, 0.9, 1.1, 0.5);
    addM(e, GEO.sph(o.er * 0.2, 8, 6), hl, sx * -o.er * 0.22, o.er * 0.3, o.er * 0.56);
    addM(e, GEO.box(o.er * 2.2, o.er * 0.35, o.er * 0.4, 0.004), cm(o.brow || 0x1a120c, 0.8), 0, o.er * 1.6, o.er * 0.3, 0, 0, sx * (o.browA || 0.1));
  }
}
/* the protagonists themselves are built in 25_models_heroes.js */
function pleatedSkirt(rTop, rBot, h, pleats, mat) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, pleats * 4, 3, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), t = (h / 2 - y) / h, k = 1 + Math.abs(Math.sin(a * pleats)) * 0.06 * (0.3 + t); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals(); return g;
}
/* ---------- the ghost (custom translucent shader) ---------- */
const GHOST_U = { uTime: { value: 0 }, uAlpha: { value: 1 }, uColor: { value: new THREE.Color(0x9fd8ff) }, uHunt: { value: 0 }, uSpirit: { value: 0 } };
function ghostMat(dark) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uDark: { value: dark ? 1 : 0 } }, GHOST_U), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: dark ? THREE.NormalBlending : THREE.NormalBlending,
    vertexShader: `uniform float uTime; uniform float uHunt; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vY;
      void main(){ vec3 p = position; vec4 w0 = modelMatrix * vec4(p,1.0); float sway = sin(uTime*2.2 + w0.y*3.0 + p.x*4.0) * 0.035 * (1.0 + uHunt) * smoothstep(1.4, 0.0, w0.y);
        p.x += sway; p.z += cos(uTime*1.7 + w0.y*2.5) * 0.03 * smoothstep(1.4, 0.0, w0.y);
        vec4 w = modelMatrix * vec4(p,1.0); vW = w.xyz; vY = w.y; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform float uAlpha; uniform vec3 uColor; uniform float uDark; uniform float uHunt; uniform float uSpirit; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vY;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
        float nz = n2(vW.xz*3.0 + vec2(0.0, uTime*0.6) + vY*2.0) * 0.6 + n2(vW.xy*7.0 - uTime*0.9) * 0.4;
        float hem = smoothstep(0.02, 0.55, vY + (nz - 0.5) * 0.35);
        float a = uAlpha * hem;
        if (uDark > 0.5) { gl_FragColor = vec4(vec3(0.02,0.02,0.03), a * (0.92 - fr*0.3)); return; }
        vec3 c = mix(uColor * 0.35, uColor * 1.6, fr) + vec3(0.6,0.0,0.05) * uHunt * fr;
        c = mix(c, vec3(0.55,0.9,1.0) * 1.4, uSpirit * 0.35);
        float body = 0.18 + fr * 0.8 + nz * 0.12;
        gl_FragColor = vec4(c, a * body); }`,
  });
}
function makeGhost() {
  const g = new THREE.Group(), body = grp(g), mat = ghostMat(false), dark = ghostMat(true);
  // shroud
  const sp = []; for (let i = 0; i <= 18; i++) { const t = i / 18; sp.push([0.05 + Math.pow(t, 0.8) * 0.42 + Math.sin(t * 20) * 0.012, 1.95 - t * 1.95]); }
  const shroud = addM(body, GEO.lathe(sp.reverse(), 28), mat, 0, 0.12, 0); shroud.castShadow = false;
  // head under the veil
  const head = grp(body, 0, 1.86, 0.05); addM(head, GEO.sph(0.15, 18, 14), mat, 0, 0, 0, 0, 0, 0, 0.9, 1.15, 0.95);
  // long black hair hanging over the face
  for (let k = 0; k < 16; k++) { const a = -PI * 0.55 + k / 15 * PI * 1.1, L = rr(0.55, 0.95); const s = addM(head, GEO.cone(0.035, L, 5), dark, Math.sin(a) * 0.12, -L / 2 + 0.08, Math.cos(a) * 0.11 + 0.02, PI + rr(-0.08, 0.08), 0, rr(-0.06, 0.06)); s.castShadow = false; }
  addM(head, GEO.sph(0.16, 16, 12, 0, TAU, 0, PI * 0.55), dark, 0, 0.02, -0.01, -0.1).castShadow = false;
  const eyesG = grp(head, 0, 0.0, 0.13); for (const sx of [-1, 1]) { const e = addM(eyesG, GEO.sph(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }), sx * 0.045, 0.01, 0); e.castShadow = false; }
  // arms (reach forward during hunts)
  const arms = [];
  for (const sx of [-1, 1]) { const sh = grp(body, sx * 0.2, 1.62, 0.02); const up = addM(sh, GEO.cyl(0.035, 0.025, 0.55, 8), mat, 0, -0.27, 0); up.castShadow = false; const el = grp(sh, 0, -0.55, 0); addM(el, GEO.cyl(0.025, 0.018, 0.5, 8), mat, 0, -0.25, 0).castShadow = false; const hd = grp(el, 0, -0.52, 0); for (let f = 0; f < 4; f++) addM(hd, GEO.cyl(0.006, 0.003, 0.16, 4), mat, (f - 1.5) * 0.015, -0.07, 0.0, 0, 0, (f - 1.5) * 0.12).castShadow = false; arms.push({ sh, el, sx }); }
  // trailing wisps
  const wisps = []; for (let k = 0; k < 7; k++) { const w = addM(body, GEO.cone(0.08, 0.7, 6), mat, rr(-0.3, 0.3), 0.3, rr(-0.35, 0.1), PI + 0.3, 0, rr(-0.3, 0.3)); w.castShadow = false; w.userData.keep = true; wisps.push(w); }
  mergeRig(g);
  g.userData = { body, head, arms, wisps, eyes: eyesG };
  g.renderOrder = 5;
  return g;
}
/* merge the direct mesh children of every group (per material) — keeps the rig animatable, cuts draw calls */
function mergeRig(root) {
  const groups = []; root.traverse(o => { if (!o.isMesh) groups.push(o); });
  for (const g of groups) {
    const by = new Map();
    for (const c of g.children) { if (!c.isMesh || c.userData.keep || c.children.length) continue; const k = c.material.uuid + (c.castShadow ? 's' : ''); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
    for (const list of by.values()) {
      if (list.length < 2) continue;
      const geos = list.map(c => { c.updateMatrix(); let q = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') q.deleteAttribute(k); if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.applyMatrix4(c.matrix); return q; });
      const m = new THREE.Mesh(THREE.mergeGeometries(geos, false), list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = true; m.renderOrder = list[0].renderOrder;
      for (const c of list) g.remove(c); g.add(m);
    }
  }
  return root;
}
/* ---------- items ---------- */
function makeItem(kind) {
  const g = grp();
  if (kind === 'ring') { addM(g, GEO.tor(0.04, 0.009, TAU, 10, 24), cm(0xc8a040, 0.25, { metalness: 0.9 }), 0, 0.04, 0, 0.3, 0, 0); addM(g, GEO.ico(0.016, 0), cm(0xd8e8ff, 0.05, { metalness: 0.2 }), 0, 0.082, 0.01); addM(g, GEO.box(0.12, 0.04, 0.09, 0.01), cfab(0x3a0e14), 0, 0.02, 0.0).position.y = 0.0; }
  if (kind === 'doll') { const d = makeDoll(0); d.scale.setScalar(1.1); g.add(d); }
  if (kind === 'watch') { addM(g, GEO.cyl(0.045, 0.045, 0.015, 24), cm(0xc8a040, 0.25, { metalness: 0.9 }), 0, 0.01, 0); addM(g, GEO.cyl(0.038, 0.038, 0.003, 24), cmat('wface', { map: clockFace(), roughness: 0.4 }), 0, 0.019, 0); addM(g, GEO.tor(0.012, 0.003, TAU, 6, 10), cm(0xc8a040, 0.25, { metalness: 0.9 }), 0, 0.012, -0.055, HP); for (let k = 0; k < 6; k++) addM(g, GEO.tor(0.006, 0.0015, TAU, 4, 8), cm(0xc8a040, 0.3, { metalness: 0.9 }), 0.01 * Math.sin(k), 0.008, -0.07 - k * 0.012, HP, k * 0.6, 0); }
  if (kind === 'salt') { addM(g, GEO.lathe([[0, 0], [0.04, 0], [0.042, 0.1], [0.03, 0.12], [0.03, 0.13], [0, 0.13]], 16), cmat('saltGlass', { color: 0xd8e0e8, roughness: 0.1, transparent: true, opacity: 0.55 }), 0, 0, 0); addM(g, GEO.cyl(0.036, 0.038, 0.08, 16), cm(0xf4f4f0, 0.9), 0, 0.045, 0); addM(g, GEO.cyl(0.033, 0.033, 0.02, 16), cm(0x5a3a1a, 0.7), 0, 0.14, 0); addM(g, GEO.box(0.05, 0.04, 0.002), cm(0xd8c8a0, 0.9), 0, 0.06, 0.042); }
  if (kind === 'fuse') { addM(g, GEO.cyl(0.022, 0.022, 0.08, 12), cm(0xe0d8c8, 0.3), 0, 0.022, 0, 0, 0, HP); for (const sx of [-1, 1]) addM(g, GEO.cyl(0.024, 0.024, 0.015, 12), cm(0xb08a40, 0.3, { metalness: 0.9 }), sx * 0.045, 0.022, 0, 0, 0, HP); }
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xfff0c0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })); glint.scale.setScalar(0.22); glint.position.y = 0.08; g.add(glint); g.userData.glint = glint;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}
