/* ================= rendering: world assembly, lights, camera, post ================= */
const R3 = {
  renderer: null, scene: null, cam: null, rt: null, postScene: null, postCam: null, postMat: null,
  world: null, doors: [], hides: [], levers: [], dials: [], fuseSlot: null, fuseLamp: null, flames: [], bulbs: [], fixtures: [], pool: [],
  chars: [], ghost: null, items: [], ev: [], frost: [], mirrors: [], spirit: [], camT: new THREE.Vector3(17, 0, 20), camPos: new THREE.Vector3(),
  shake: 0, flash: 0, quality: 1, glass: [], shafts: [], pend: null, hands: null, mobile: null, seal: null, gate: null, rain: null,
};
function initRender() {
  const cv = document.getElementById('gl');
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 1.75)); r.setSize(innerWidth, innerHeight, false);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
  r.outputColorSpace = THREE.SRGBColorSpace;
  R3.renderer = r;
  R3.scene = new THREE.Scene(); R3.scene.background = new THREE.Color(0x020304); R3.scene.fog = new THREE.FogExp2(0x030406, 0.028);
  R3.cam = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.5, 90);
  const isGL2 = r.capabilities.isWebGL2;
  R3.rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 4 : 0 });
  R3.postMat = new THREE.ShaderMaterial({
    uniforms: { tD: { value: R3.rt.texture }, uT: { value: 0 }, uFear: { value: 0 }, uSpirit: { value: 0 }, uHunt: { value: 0 }, uFlash: { value: 0 }, uGrain: { value: 1 }, uDown: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uBeat: { value: 0 }, uHide: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tD; uniform float uT, uFear, uSpirit, uHunt, uFlash, uGrain, uDown, uBeat, uHide; uniform vec2 uRes; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uT*7.0) * 43758.5453); }
      void main(){
        vec2 uv = vUv; vec2 c = uv - 0.5; float r = length(c * vec2(uRes.x/uRes.y, 1.0));
        float wob = (uFear*0.004 + uHunt*0.003) * sin(uT*3.0 + uv.y*18.0);
        uv.x += wob;
        float ca = 0.0015 + uFear*0.006 + uHunt*0.004 + uDown*0.008;
        vec3 col; col.r = texture2D(tD, uv + c*ca).r; col.g = texture2D(tD, uv).g; col.b = texture2D(tD, uv - c*ca).b;
        if (uHide > 0.0) { float sl = step(0.5, fract(vUv.y*9.0)) ; col *= mix(1.0, 0.18 + 0.82*sl, uHide); }
        float l = dot(col, vec3(0.299,0.587,0.114));
        // spirit sight: cold desaturated tint, lifted blacks
        col = mix(col, vec3(l)*vec3(0.75,0.95,1.25) + vec3(0.004,0.010,0.022), uSpirit*0.55);
        // downed: drained of color, reddish
        col = mix(col, vec3(l*1.1, l*0.5, l*0.5), uDown*0.75);
        col += vec3(0.75,0.82,1.0) * uFlash * 0.35;
        float vig = smoothstep(0.35 + uFear*0.05, 1.05 - uFear*0.35 - uHunt*0.15, r);
        col *= 1.0 - vig*(0.55 + uFear*0.3);
        col += vec3(0.25,0.0,0.01) * vig * (uHunt*0.6 + uBeat*0.5);
        col += (hash(vUv*uRes) - 0.5) * (0.012 + l * 0.05) * uGrain;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  R3.postScene = new THREE.Scene(); R3.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), R3.postMat); q.frustumCulled = false; R3.postScene.add(q);
  // lights
  R3.hemi = new THREE.HemisphereLight(0x2a3a58, 0x0a0806, 0.25); R3.scene.add(R3.hemi);
  const moon = new THREE.DirectionalLight(0x8aa6e0, 0.9); moon.position.set(17 - 11, 15, 13 + 13); moon.target.position.set(17, 0, 13); R3.scene.add(moon, moon.target);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 60 }); moon.shadow.bias = -0.0008; moon.shadow.normalBias = 0.03; moon.shadow.autoUpdate = false; moon.shadow.needsUpdate = true;
  R3.moon = moon;
  const fl = new THREE.SpotLight(0xfff1d8, 0, 17, 0.42, 0.55, 1.5); fl.castShadow = true; fl.shadow.mapSize.set(1024, 1024); fl.shadow.camera.near = 0.15; fl.shadow.camera.far = 17; fl.shadow.bias = -0.0006; fl.shadow.normalBias = 0.025; R3.scene.add(fl, fl.target); R3.flashLight = fl;
  const fill = new THREE.PointLight(0xffe6c0, 0, 2.6, 2); R3.scene.add(fill); R3.flashFill = fill; // bounce near the holder
  const lan = new THREE.PointLight(0x7ab8ff, 0, 6.5, 1.6); R3.scene.add(lan); R3.lantern = lan;
  const gl = new THREE.PointLight(0x9fd8ff, 0, 5, 2); R3.scene.add(gl); R3.ghostLight = gl;
  const nPool = SET.quality === 'low' ? 3 : 6;
  for (let i = 0; i < nPool; i++) { const p = new THREE.PointLight(0xffb870, 0, 7, 1.8); R3.scene.add(p); R3.pool.push(p); }
  // volumetric beam cone
  const coneG = new THREE.CylinderGeometry(0.03, 2.9, 7, 24, 1, true); coneG.translate(0, -3.5, 0); coneG.rotateX(-HP);
  R3.beam = new THREE.Mesh(coneG, new THREE.ShaderMaterial({ uniforms: { uA: { value: 0.07 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.z/7.0; vec4 w = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform float uA; varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float a = uA * (1.0 - vZ) * (1.0 - vZ) * f; gl_FragColor = vec4(1.0, 0.95, 0.82, a); }' }));
  R3.beam.renderOrder = 4; R3.beam.frustumCulled = false; R3.scene.add(R3.beam);
  addEventListener('resize', onResize); onResize();
}
function onResize() {
  const r = R3.renderer, w = innerWidth, h = innerHeight; r.setSize(w, h, false); R3.cam.aspect = w / h; R3.cam.updateProjectionMatrix();
  const pr = r.getPixelRatio(); R3.rt.setSize(Math.floor(w * pr), Math.floor(h * pr)); R3.postMat.uniforms.uRes.value.set(w * pr, h * pr);
}

/* ---------- world assembly ---------- */
function wallFace(parent, mat, len, y0, y1, u0, x, z, ry) {
  const g = new THREE.PlaneGeometry(len, y1 - y0); const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 / 2 + uv.getX(i) * len / 2, (y0 + uv.getY(i) * (y1 - y0)) / 3);
  return addM(parent, g, mat, x, (y0 + y1) / 2, z, 0, ry);
}
function buildWorld(setup) {
  const saved = RNG; RNG = mulberry32(4242);
  if (R3.world) { R3.scene.remove(R3.world); }
  const W = R3.world = new THREE.Group(); R3.scene.add(W);
  const stat = grp(W); // static, merged later
  Object.assign(R3, { doors: [], hides: [], levers: [], dials: [], flames: [], bulbs: [], fixtures: [], items: [], ev: [], frost: [], mirrors: [], spirit: [], glass: [], shafts: [] });
  const CS = MAP.CS, WH = MAP.WALL_H, T = MAP.WT / 2;
  // floors + shadow-only ceilings
  for (const r of MAP.rooms) {
    const w = r.r[2] - r.r[0], d = r.r[3] - r.r[1];
    const g = new THREE.PlaneGeometry(w, d); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.r[0] + uv.getX(i) * w) / 4, (r.r[1] + (1 - uv.getY(i)) * d) / 4);
    const f = addM(stat, g, MAT.floor[r.floor], r.cx, 0, r.cz, -HP); f.castShadow = false;
    const c = addM(W, new THREE.PlaneGeometry(w + 0.3, d + 0.3), MAT.shadowOnly, r.cx, WH + 0.02, r.cz, HP); c.receiveShadow = false;
  }
  // walls, window and door openings
  const sideMat = ri2 => ri2 < 0 ? MAT.wall.ext : MAT.wall[MAP.rooms[ri2].wall];
  const lines = [];
  for (let j = 0; j <= MAP.GH; j++) { let s = null; for (let i = 0; i <= MAP.GW; i++) { const c = i < MAP.GW ? MAP.hE[hIdx(i, j)] : 0, ra = roomAtCell(i, j - 1), rb = roomAtCell(i, j), key = c ? c + '|' + ra + '|' + rb + '|' + (c === 3 ? MAP.hD[hIdx(i, j)] : '') : null; if (s && key !== s.key) { lines.push(s); s = null; } if (key && !s) s = { dir: 'h', at: j * CS, a: i * CS, key, c, ra, rb }; if (s) s.b = (i + 1) * CS; } }
  for (let i = 0; i <= MAP.GW; i++) { let s = null; for (let j = 0; j <= MAP.GH; j++) { const c = j < MAP.GH ? MAP.vE[vIdx(i, j)] : 0, ra = roomAtCell(i - 1, j), rb = roomAtCell(i, j), key = c ? c + '|' + ra + '|' + rb + '|' + (c === 3 ? MAP.vD[vIdx(i, j)] : '') : null; if (s && key !== s.key) { lines.push(s); s = null; } if (key && !s) s = { dir: 'v', at: i * CS, a: j * CS, key, c, ra, rb }; if (s) s.b = (j + 1) * CS; } }
  for (const L of lines) {
    const len = L.b - L.a, mid = (L.a + L.b) / 2;
    const spans = L.c === 1 ? [[0, WH]] : L.c === 2 ? [[0, 0.85], [2.3, WH]] : [[MAP.doors[L.key.split('|')[3]].kind === 'arch' ? 2.65 : 2.3, WH]];
    for (const [y0, y1] of spans) {
      if (L.dir === 'h') { wallFace(stat, sideMat(L.ra), len, y0, y1, L.a, mid, L.at - T, PI); wallFace(stat, sideMat(L.rb), len, y0, y1, L.a, mid, L.at + T, 0); }
      else { wallFace(stat, sideMat(L.ra), len, y0, y1, L.a, L.at - T, mid, -HP); wallFace(stat, sideMat(L.rb), len, y0, y1, L.a, L.at + T, mid, HP); }
    }
    // caps
    const cap = (y0, y1) => L.dir === 'h' ? addM(stat, new THREE.BoxGeometry(len + (L.c === 1 ? T * 2 : 0), y1 - y0, MAP.WT), MAT.wallTop, mid, (y0 + y1) / 2, L.at) : addM(stat, new THREE.BoxGeometry(MAP.WT, y1 - y0, len + (L.c === 1 ? T * 2 : 0)), MAT.wallTop, L.at, (y0 + y1) / 2, mid);
    if (L.c === 1) cap(WH - 0.001, WH + 0.04); else { cap(WH - 0.001, WH + 0.04); if (L.c === 2) cap(0.84, 0.86); }
  }
  // corner posts at segment ends (hide seams)
  for (const s of MAP.segs) for (const e of [s.a, s.b]) { const x = s.dir === 'h' ? e : s.at, z = s.dir === 'h' ? s.at : e; addM(stat, new THREE.BoxGeometry(MAP.WT + 0.02, WH + 0.04, MAP.WT + 0.02), MAT.wallTop, x, WH / 2 + 0.02, z).castShadow = true; }
  buildWindows(stat, W);
  buildDoors(stat, W);
  // furniture
  for (const f of MAP.furn) {
    const fb = FB[f.k]; if (!fb) continue;
    const m = fb(f.o); m.position.set(f.x, 0, f.z); m.rotation.y = f.r; stat.add(m);
    if (f.o.hide) { const h = MAP.hides.find(h => h.f === f.id); R3.hides[h.id] = m.userData.doors; }
    if (f.k === 'grandClock') { m.traverse(o => { if (o.userData.pendulum) R3.pend = o; if (o.userData.clockHands) R3.hands = o; }); }
    if (f.k === 'crib') m.traverse(o => { if (o.userData.spin) R3.mobile = o; });
    if (f.k === 'stairs') buildGate(W, f);
  }
  // wall-mounted
  for (const w of MAP.wallDecor) {
    const fb = WB[w.k]; if (!fb) continue; const m = fb(w); m.position.set(w.x, w.y, w.z); m.rotation.y = w.r; stat.add(m);
    if (w.k === 'lever') m.traverse(o => { if (o.userData.leverArm) R3.levers[w.o.lever] = o; });
    if (w.k === 'runePanel') R3.dials = m.userData.dials;
    if (w.k === 'fuseBox') m.traverse(o => { if (o.userData.fuseSlot) R3.fuseSlot = o; if (o.userData.fuseLamp) R3.fuseLamp = o; });
  }
  PAINTDEF.forEach(([x, z, r, s], i) => { const p = WB.painting(i, s || 1); p.position.set(x, 1.75, z); p.rotation.y = r; stat.add(p); });
  // mirrors (surface + reflection figure)
  for (const mr of MAP.mirrors) {
    const g = grp(W, mr.x, mr.y, mr.z, mr.r); let off = 0.03;
    if (mr.kind === 'chevalMirror') { g.position.y = 1.15; off = 0.02; g.rotation.x = 0; }
    const surf = addM(g, GEO.plane(mr.mw, mr.mh), new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.05, metalness: 0.9, envMapIntensity: 0 }), 0, 0, off); surf.castShadow = false;
    const fig = addM(g, GEO.plane(mr.mw * 0.55, mr.mh * 0.85), new THREE.MeshBasicMaterial({ map: TEX.mirrorGhost, transparent: true, opacity: 0, depthWrite: false }), rr(-0.08, 0.08), -0.02, off + 0.004); fig.castShadow = false;
    const sheen = addM(g, GEO.plane(mr.mw, mr.mh), new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, off + 0.006); sheen.castShadow = false;
    R3.mirrors.push({ mr, fig, sheen, lit: 0 });
  }
  // light fixtures
  for (const l of MAP.lights) {
    let m = null;
    if (LB[l.k]) { m = LB[l.k](); m.position.set(l.x, l.y, l.z); if (l.k === 'sconce') { const n = l.z < 9 ? 0 : PI; m.rotation.y = n; } stat.add(m); }
    R3.fixtures.push({ l, m, k: l.k === 'candles' || l.k === 'candleS' ? 'candle' : l.k === 'fire' ? 'fire' : 'elec', phase: rr(0, 9) });
  }
  // outside: lawn, path, fence, trees, tombstones, porch
  buildOutside(stat, W);
  // merge everything static
  mergeStatic(stat);
  RNG = saved;
  if (setup) buildSetup(setup);
  R3.moon.shadow.needsUpdate = true;
}
function buildWindows(stat, W) {
  const frameM = M.paint(0x1a1612, 0.6), sillM = M.wood(0x2a1a10, 0.5);
  for (const w of MAP.windows) {
    const len = w.b - w.a, mid = (w.a + w.b) / 2, h = 2.3 - 0.85, yc = 0.85 + h / 2, stained = w.kind === 'stained', cons = w.room >= 0 && MAP.rooms[w.room].id === 'cons';
    const g = w.dir === 'h' ? grp(W, mid, 0, w.at, 0) : grp(W, w.at, 0, mid, HP);
    const inward = (w.dir === 'h' ? (w.at === 0 ? 1 : -1) : (w.at === 0 ? 1 : -1)); // +1: inside is +local z
    const sg = grp(stat, g.position.x, 0, g.position.z, g.rotation.y);
    bx(sg, frameM, len, 0.06, 0.24, 0, 0.85, 0); bx(sg, frameM, len, 0.07, 0.22, 0, 2.3, 0);
    bx(sg, sillM, len + 0.12, 0.04, 0.3, 0, 0.85, inward * 0.08);
    for (const e of [-len / 2, len / 2]) bx(sg, frameM, 0.07, h, 0.22, e, yc, 0);
    const nm = Math.max(1, Math.round(len / 0.55)); for (let k = 1; k < nm; k++) bx(sg, frameM, 0.035, h, 0.06, -len / 2 + k * len / nm, yc, 0);
    bx(sg, frameM, len, 0.035, 0.06, 0, yc + h * 0.18, 0);
    let gm;
    if (stained) gm = new THREE.MeshStandardMaterial({ map: stainedTex(), emissive: 0xffffff, emissiveMap: stainedTex(), emissiveIntensity: 0.55, transparent: true, opacity: 0.85, roughness: 0.3, side: THREE.DoubleSide, depthWrite: false });
    else gm = new THREE.MeshStandardMaterial({ color: 0x6a86b0, emissive: 0x1a2a48, emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
    const gl = addM(g, GEO.plane(len, h), gm, 0, yc, 0); gl.castShadow = false; gl.receiveShadow = false; R3.glass.push({ m: gm, base: gm.emissiveIntensity });
    // curtains (inside), except conservatory
    if (!cons && !stained) {
      const cm2 = stdMat({ color: pick([0x3a1418, 0x1e2a3a, 0x2a3020]), roughness: 0.95, map: TEX.fabric, side: THREE.DoubleSide }, null, true);
      for (const sx of [-1, 1]) {
        const cw = rr(0.32, 0.42), cg = new THREE.PlaneGeometry(cw, 2.55, 10, 8), p = cg.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin((x / cw) * PI * 5 + y * 0.3) * 0.04 + (y < -0.8 ? (y + 0.8) * 0.06 : 0)); p.setX(i, x * (1 - (0.5 - y / 2.55) * 0.25 * (RNG() < 0.5 ? 1 : 0.6))); }
        cg.computeVertexNormals();
        addM(sg, cg, cm2, sx * (len / 2 + cw / 2 - 0.12), 1.55, inward * 0.16);
      }
      addM(sg, GEO.cyl(0.02, 0.02, len + 0.9, 8), M.metal(0x6a5030, 0.4), 0, 2.85, inward * 0.18, 0, 0, HP);
    }
    // moonlit shaft (very faint additive plane slanted into the room)
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.95, 3.2), new THREE.MeshBasicMaterial({ map: TEX.shaft, color: stained ? 0xb08acf : 0x7a9ad8, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    sh.position.set(0, 1.1, inward * 1.25); sh.rotation.set(inward * -1.0, 0, 0); g.add(sh); R3.shafts.push(sh);
  }
}
function stainedTex() {
  if (TEX.stained) return TEX.stained;
  const c = cnv(256, 256), g = c.getContext('2d'), cols = ['#7a1a2a', '#1a3a7a', '#a88a2a', '#2a6a4a', '#5a2a7a'];
  for (let k = 0; k < 70; k++) { g.fillStyle = cols[k % 5]; g.beginPath(); const x = texRng() * 256, y = texRng() * 256; for (let a = 0; a < 5; a++) g.lineTo(x + Math.cos(a / 5 * TAU + k) * tr(15, 40), y + Math.sin(a / 5 * TAU + k) * tr(15, 40)); g.fill(); }
  g.strokeStyle = '#0a0806'; g.lineWidth = 4; for (let k = 0; k < 30; k++) { g.beginPath(); g.moveTo(texRng() * 256, texRng() * 256); g.lineTo(texRng() * 256, texRng() * 256); g.stroke(); }
  g.beginPath(); g.arc(128, 100, 60, 0, TAU); g.lineWidth = 6; g.stroke();
  TEX.stained = mkTex(c); return TEX.stained;
}
function buildDoors(stat, W) {
  const trim = M.wood(0x2a160a, 0.45), leafM = M.wood(0x3a1f0f, 0.5), dk = M.wood(0x24130a, 0.55), brass = M.metal(0xb08a40, 0.35);
  for (const d of MAP.doors) {
    const g = d.dir === 'h' ? grp(W, d.cx, 0, d.cz, 0) : grp(W, d.cx, 0, d.cz, HP);
    const sg = grp(stat, g.position.x, 0, g.position.z, g.rotation.y);
    const w = d.w, top = d.kind === 'arch' ? 2.65 : 2.3;
    // casing on both faces
    for (const sz of [-1, 1]) { bx(sg, trim, 0.1, top + 0.02, 0.04, -w / 2 - 0.03, top / 2, sz * 0.11); bx(sg, trim, 0.1, top + 0.02, 0.04, w / 2 + 0.03, top / 2, sz * 0.11); bx(sg, trim, w + 0.3, 0.12, 0.05, 0, top + 0.06, sz * 0.11); }
    bx(sg, M.wood(0x1e1008, 0.6), w, 0.03, 0.22, 0, 0.015, 0); // threshold
    for (const e of [-w / 2, w / 2]) bx(sg, trim, 0.04, top, MAP.WT, e, top / 2, 0); // jambs
    const ent = { d, g, leaves: [], kind: d.kind };
    if (d.kind === 'arch') { for (const sx of [-1, 1]) { bx(sg, M.paint(0x2a1e16, 0.6), 0.22, 2.65, 0.3, sx * (w / 2 + 0.11), 1.325, 0); addM(sg, GEO.box(0.3, 0.12, 0.36), trim, sx * (w / 2 + 0.11), 2.6, 0); } }
    if (d.kind === 'door' || d.kind === 'rune' || d.kind === 'double' || d.kind === 'front') {
      const n = d.kind === 'double' || d.kind === 'front' ? 2 : 1, lw = w / n;
      for (let k = 0; k < n; k++) {
        const side = n === 1 ? -1 : (k ? 1 : -1);
        const hinge = grp(g, side * w / 2, 0, 0); const leaf = grp(hinge, -side * lw / 2, 0, 0);
        const heavy = d.kind === 'double' || d.kind === 'front';
        bx(leaf, d.kind === 'rune' ? stdMat({ color: 0x4a4640, roughness: 0.8, map: TEX.stone }, 'runeDoor') : leafM, lw - 0.02, 2.26, heavy ? 0.08 : 0.05, 0, 1.13, 0);
        for (const sz of [-1, 1]) {
          if (d.kind === 'rune') { addM(leaf, GEO.tor(0.32, 0.03, TAU, 6, 32), stdMat({ color: 0x8a7040, roughness: 0.4, metalness: 0.7 }, 'runeRing'), 0, 1.3, sz * 0.03); for (let q = 0; q < 6; q++) { const a = q / 6 * TAU; const lab = addM(leaf, GEO.plane(0.14, 0.14), stdMat({ map: TEX.glyph[q], transparent: true, color: 0x8a7040, roughness: 0.5 }, 'glyphCarve' + q, false), Math.cos(a) * 0.32, 1.3 + Math.sin(a) * 0.32, sz * 0.035, 0, sz < 0 ? PI : 0); lab.castShadow = false; } continue; }
          for (const [py, ph] of [[0.35, 0.8], [1.35, 0.7]]) { bx(leaf, dk, lw - 0.24, ph, 0.02, 0, py + ph / 2, sz * (heavy ? 0.04 : 0.026), 0, 0.01); bx(leaf, leafM, lw - 0.32, ph - 0.08, 0.02, 0, py + ph / 2, sz * (heavy ? 0.05 : 0.034), 0, 0.012); }
          if (heavy) for (const y of [0.4, 1.9]) bx(leaf, M.metal(0x1a1816, 0.5, 0.7), lw - 0.04, 0.08, 0.02, 0, y, sz * 0.052, 0, 0.004);
          addM(leaf, GEO.sph(0.03, 10, 8), brass, -side * (lw / 2 - 0.1), 1.0, sz * (heavy ? 0.07 : 0.05));
        }
        ent.leaves.push({ hinge, side });
      }
      if (d.kind === 'front') { const fan = new THREE.Shape(); fan.absarc(0, 0, w / 2, 0, PI, false); addM(sg, GEO.ext(fan, 0.04, 0), new THREE.MeshStandardMaterial({ map: stainedTex(), emissive: 0xffffff, emissiveMap: stainedTex(), emissiveIntensity: 0.08, transparent: true, opacity: 0.55, color: 0x777777 }), 0, 2.36, 0); }
    }
    if (d.kind === 'shutter') { const s = grp(g, 0, 0, 0); const sm = M.metal(0x4a4c4e, 0.55, 0.7); for (let k = 0; k < 15; k++) bx(s, sm, w, 0.15, 0.04, 0, 0.08 + k * 0.152, 0, 0, 0.01); bx(s, M.metal(0x2a2a2a), w, 0.08, 0.06, 0, 0.05, 0); bx(sg, M.metal(0x3a3a3a, 0.5), w + 0.2, 0.35, 0.3, 0, 2.48, 0.0); const lamp = addM(sg, GEO.sph(0.03, 8, 6), stdMat({ color: 0x400808, emissive: 0xff2010, emissiveIntensity: 1.0 }, 'shutLamp', false), w / 2 + 0.2, 1.6, 0.14); ent.lamp = lamp; ent.slide = s; }
    if (d.kind === 'shelf') { const bs = FB.bookshelf({}, 1); const s = grp(g, 0, 0, -0.33); s.add(bs); ent.slide = s; }
    for (const l of ent.leaves) mergeRig(l.hinge); if (ent.slide) mergeRig(ent.slide);
    R3.doors[d.idx] = ent;
  }
}
function buildGate(W, f) {
  const g = grp(W, f.x, 0, f.z + 4.15), ir = M.metal(0x121110, 0.45, 0.8), gold = M.metal(0x8a6a30, 0.35);
  const leaves = [];
  for (const sx of [-1, 1]) { const h = grp(g, sx * 1.15, 0, 0), l = grp(h, -sx * 0.575, 0, 0); for (let k = 0; k < 6; k++) { addM(l, GEO.cyl(0.015, 0.015, 1.7, 6), ir, -0.5 + k * 0.2, 0.85, 0); addM(l, GEO.cone(0.03, 0.08, 6), gold, -0.5 + k * 0.2, 1.75, 0); } for (const y of [0.2, 0.9, 1.55]) addM(l, GEO.box(1.12, 0.04, 0.03), ir, 0, y, 0); addM(l, GEO.tor(0.18, 0.015, TAU, 6, 24), ir, 0, 1.22, 0); leaves.push({ h, sx }); }
  // spectral seal across the gate
  const sm = new THREE.MeshBasicMaterial({ map: sealTex(), color: 0xb08aff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const seal = addM(g, GEO.plane(1.6, 1.6), sm, 0, 1.0, 0.05); seal.castShadow = false;
  const chainM = new THREE.MeshBasicMaterial({ color: 0x9a7aff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const a of [0.7, -0.7]) for (let k = 0; k < 14; k++) addM(g, GEO.tor(0.04, 0.01, TAU, 4, 10), chainM, -1.05 + k * 0.16, 1.0 + (-1.05 + k * 0.16) * Math.tan(a) * 0.5, 0.06, 0, (k % 2) * HP, a * 0.5).castShadow = false;
  for (const l of leaves) mergeRig(l.h);
  R3.gate = { g, leaves, seal, sm, chainM, open: 0 };
}
function sealTex() { if (TEX.seal) return TEX.seal; const c = cnv(256, 256), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 10; g.lineWidth = 4; g.beginPath(); g.arc(128, 128, 110, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 92, 0, TAU); g.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.beginPath(); g.arc(128 + Math.cos(a) * 40, 128 + Math.sin(a) * 40, 40, 0, TAU); g.stroke(); } g.beginPath(); g.arc(128, 128, 40, 0, TAU); g.stroke(); g.font = '22px serif'; g.fillStyle = '#fff'; GLYPHS.forEach((s, i) => { const a = i / 6 * TAU; g.fillText(s, 120 + Math.cos(a) * 101, 136 + Math.sin(a) * 101); }); TEX.seal = mkTex(c); TEX.seal.wrapS = TEX.seal.wrapT = THREE.ClampToEdgeWrapping; return TEX.seal; }
function buildOutside(W, Wdyn) {
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(110, 100), MAT.grass); gr.rotation.x = -HP; gr.position.set(17, -0.02, 13); gr.receiveShadow = true; W.add(gr);
  const path = addM(W, new THREE.PlaneGeometry(2.6, 16), MAT.gravel, 17, -0.01, 34, -HP); path.castShadow = false;
  // porch
  const st = stdMat({ color: 0x4a4640, roughness: 0.85, map: TEX.stone }, 'porch'); for (let k = 0; k < 3; k++) bx(W, st, 4 - k * 0.3, 0.12, 0.6, 17, 0.06 + k * 0.0, 26.4 + k * 0.6 - 0.0, 0, 0.01).position.y = 0.18 - k * 0.06;
  // fence around
  const ir = M.metal(0x0e0d0c, 0.5, 0.7);
  const fence = (x0, z0, x1, z1) => { const L = dist(x0, z0, x1, z1), n = Math.floor(L / 0.32), a = Math.atan2(z1 - z0, x1 - x0); for (let k = 0; k <= n; k++) { const t = k / n; addM(W, GEO.cyl(0.012, 0.012, 1.3, 5), ir, lerp(x0, x1, t), 0.65, lerp(z0, z1, t)); addM(W, GEO.cone(0.025, 0.08, 5), ir, lerp(x0, x1, t), 1.33, lerp(z0, z1, t)); } for (const y of [0.25, 1.1]) addM(W, GEO.box(L, 0.03, 0.03), ir, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, -a); };
  fence(-6, 33, 15.5, 33); fence(18.5, 33, 40, 33); fence(-6, -6, -6, 33); fence(40, -6, 40, 33); fence(-6, -6, 40, -6);
  const tm = M.wood(0x15110e, 0.95);
  for (const [x, z] of [[-3, 29], [37, 30], [-3.5, 4], [38, 8], [24, 30.5], [9, 30], [-2, 16], [37.5, 18], [30, -3], [4, -3]]) { RNG = mulberry32(x * 100 + z); deadTree(W, x, 0, z, rr(1.4, 2.2), 0.16, 4, tm); }
  const gs = stdMat({ color: 0x5a5852, roughness: 0.9, map: TEX.concrete }, 'grave');
  for (const [x, z, r] of [[29, 30, 0.1], [30.6, 30.2, -0.15], [32.2, 29.8, 0.2], [29.8, 31.8, 0.05], [31.5, 31.6, -0.25]]) { const t = grp(W, x, 0, z, r); bx(t, gs, 0.5, 0.7, 0.12, 0, 0.35, 0, 0, 0.03); addM(t, GEO.cyl(0.25, 0.25, 0.12, 16, 1, false, 0, PI), gs, 0, 0.7, 0, HP, 0, HP); t.rotation.z = rr(-0.08, 0.08); }
  // rain (outdoor only)
  const N = SET.quality === 'low' ? 900 : 2200, pos = new Float32Array(N * 6), seed = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const x = rr(-14, 48), y = rr(0, 5), z = rr(-12, 40); pos.set([x, y, z, x - 0.04, y + 0.45, z + 0.02], i * 6); seed[i * 2] = seed[i * 2 + 1] = rr(0, 1); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const rm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'uniform float uT; attribute float seed; varying float vA; void main(){ vec3 p = position; float y = mod(p.y - uT*11.0 - seed*5.0, 5.0); p.y = y; bool inside = p.x > -1.5 && p.x < 35.5 && p.z > -1.5 && p.z < 27.5; vA = inside ? 0.0 : 0.22; vec4 w = modelMatrix*vec4(p,1.0); gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'varying float vA; void main(){ if (vA <= 0.0) discard; gl_FragColor = vec4(0.6,0.7,0.85,vA); }' });
  R3.rain = new THREE.LineSegments(rg, rm); R3.rain.frustumCulled = false; Wdyn.add(R3.rain);
}
function mergeStatic(stat) {
  stat.updateMatrixWorld(true);
  const groups = new Map();
  const keep = [];
  stat.traverse(o => {
    if (!o.isMesh) return;
    let p = o, isDyn = false; while (p && p !== stat) { if (p.userData.dyn) { isDyn = true; break; } p = p.parent; }
    if (isDyn || o.userData.dyn) { keep.push(o); return; }
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(o.matrixWorld);
    g.computeBoundingBox(); const bc = g.boundingBox.getCenter(new THREE.Vector3()); const chunk = Math.floor(bc.x / 9) + ',' + Math.floor(bc.z / 9);
    // colour-only differences are baked into vertex colours so many materials share one draw call
    const m0 = o.material; let mat = m0, fam = null;
    if (m0.isMeshStandardMaterial && !m0.transparent && !m0.polygonOffset && m0.emissive.getHex() === 0 && !m0.vertexColors) {
      const cut = !!(m0.customProgramCacheKey && m0.customProgramCacheKey() === 'cut');
      fam = 'fam|' + (m0.map ? m0.map.uuid : '-') + '|' + (m0.bumpMap ? m0.bumpMap.uuid + m0.bumpScale : '-') + '|' + m0.roughness.toFixed(2) + '|' + m0.metalness.toFixed(2) + '|' + m0.side + '|' + cut;
      mat = stdMat({ color: 0xffffff, map: m0.map, bumpMap: m0.bumpMap, bumpScale: m0.bumpScale, roughness: m0.roughness, metalness: m0.metalness, side: m0.side, vertexColors: true }, fam, cut);
      const n = g.attributes.position.count, ca = new Float32Array(n * 3), c = m0.color; for (let i = 0; i < n; i++) { ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
    }
    const key = (fam || m0.uuid) + (o.castShadow ? 's' : 'n') + chunk;
    if (!groups.has(key)) groups.set(key, { mat, cast: o.castShadow, list: [] }); groups.get(key).list.push(g);
  });
  // re-parent dynamic subtrees into the world (keep their world transform)
  const dynRoots = new Set(); for (const o of keep) { let p = o; while (p.parent && p.parent !== stat && !p.userData.dyn) p = p.parent; dynRoots.add(p.userData.dyn ? p : o); }
  for (const r of dynRoots) { r.updateMatrixWorld(true); const m = r.matrixWorld.clone(); R3.world.add(r); m.decompose(r.position, r.quaternion, r.scale); }
  // keep animated item references valid (pendulum etc. are dyn roots; they moved, still same objects)
  stat.removeFromParent();
  for (const { mat, cast, list } of groups.values()) {
    const merged = THREE.mergeGeometries(list, false); if (!merged) continue;
    const m = new THREE.Mesh(merged, mat); m.castShadow = cast; m.receiveShadow = true; R3.world.add(m);
  }
  R3.flames = []; R3.world.traverse(o => { if (o.userData.flame) R3.flames.push(o); });
  R3.bulbs = [];
}
/* ---------- per-game setup visuals: evidence, rune code, items ---------- */
function buildSetup(st) {
  const W = R3.world;
  for (const o of [...R3.ev, ...R3.frost.map(f => f.m), ...R3.spirit, ...R3.items.map(i => i.m)]) o.removeFromParent && o.removeFromParent();
  R3.ev = []; R3.frost = []; R3.spirit = []; R3.items = [];
  for (const e of st.ev) {
    if (e.k === 'prints') { const m = new THREE.Mesh(GEO.plane(0.55, 0.55), new THREE.MeshBasicMaterial({ map: TEX.hand, color: 0x7fe6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(e.x + Math.sin(e.r) * 0.012, e.y, e.z + Math.cos(e.r) * 0.012); m.rotation.y = e.r; m.rotation.z = rr(-0.4, 0.4); W.add(m); m.userData.spirit = true; R3.spirit.push(m); }
    if (e.k === 'orbs') { const g = grp(W, e.x, e.y, e.z); for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x9fe8ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(rr(0.12, 0.22)); s.userData.ph = rr(0, 9); g.add(s); } g.userData.orbs = true; g.userData.spirit = true; R3.spirit.push(g); }
    if (e.k === 'frost') { const m = new THREE.Mesh(GEO.plane(1.1, 1.1), new THREE.MeshBasicMaterial({ map: TEX.frost, color: 0xdff4ff, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -HP; m.rotation.z = rr(0, TAU); m.position.set(e.x, (e.y || 0) + 0.015, e.z); W.add(m); R3.frost.push({ e, m, a: 0 }); }
  }
  // rune code written on a wall (spirit only)
  if (st.codeSpot) { const c = st.codeSpot, g = grp(W, c.x + Math.sin(c.r) * 0.015, c.y + 0.25, c.z + Math.cos(c.r) * 0.015, c.r); st.code.forEach((gi, i) => { const m = addM(g, GEO.plane(0.3, 0.3), new THREE.MeshBasicMaterial({ map: TEX.glyph[gi], color: 0x9ff0ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), -0.5 + i * 0.33, 0, 0); m.castShadow = false; }); const u = addM(g, GEO.plane(1.3, 0.04), new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -0.22, 0); u.castShadow = false; g.userData.spirit = true; R3.spirit.push(g); }
  // draft seeping out of the hidden shelf (spirit only)
  { const d = MAP.doors.find(x => x.kind === 'shelf'), g = grp(W, d.cx, 0, d.cz - 0.6); for (let k = 0; k < 6; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x9fd0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(0.5, 1.2, 1); s.userData.ph = k / 6; g.add(s); } g.userData.draft = true; g.userData.spirit = true; R3.spirit.push(g); }
  for (const it of st.items) { const m = makeItem(it.k); m.position.set(it.x, it.y, it.z); m.rotation.y = rr(0, TAU); W.add(m); R3.items.push({ it, m }); }
}

/* ---------- character instances ---------- */
function ensureChars() {
  if (R3.chars.length) return;
  for (const role of ['L', 'S']) { const r = role === 'L' ? makeHolder() : makeSeer(); R3.scene.add(r.root); r.ph = 0; r.vis = { x: 0, z: 0, a: 0 }; R3.chars.push(r); }
  R3.ghost = makeGhost(); R3.scene.add(R3.ghost);
}
const charOf = role => R3.chars[role === 'L' ? 0 : 1];
function poseChar(R, p, dt, t) {
  const root = R.root;
  root.visible = p.hide < 0;
  root.position.set(p.x, 0, p.z);
  // smooth facing
  R.vis.a += angDiff(R.vis.a, p.a) * Math.min(1, dt * 12);
  root.rotation.y = -R.vis.a + HP; // world angle (atan2(z,x)) → three rotation (front = +z)
  const spd = p.spd || 0, run = spd > 3.3;
  R.ph += dt * (spd > 0.05 ? 3.2 + spd * 1.9 : 0) * (p.down ? 0.4 : 1);
  const s = Math.sin(R.ph), c = Math.cos(R.ph), amp = clamp(spd / 2.5, 0, 1.25);
  const o = R.o;
  if (p.down) {
    // crawling / collapsed
    R.body.position.y = -o.hipY + 0.16; R.body.rotation.x = 1.35;
    R.lL.hp.rotation.x = 0.2 + s * 0.3 * amp; R.lR.hp.rotation.x = 0.2 - s * 0.3 * amp; R.lL.kn.rotation.x = R.lR.kn.rotation.x = 0.4;
    R.aL.sh.rotation.x = -2.6 + c * 0.4 * amp; R.aR.sh.rotation.x = -2.6 - c * 0.4 * amp; R.aL.el.rotation.x = R.aR.el.rotation.x = -0.2;
    R.head.rotation.x = -0.9;
    return;
  }
  R.body.rotation.x = 0; R.head.rotation.x = 0;
  R.body.position.y = Math.abs(s) * 0.03 * amp + Math.sin(t * 1.6) * 0.004;
  R.torso.rotation.x = run ? 0.18 : 0.04 * amp; R.torso.rotation.y = s * 0.06 * amp;
  R.lL.hp.rotation.x = s * 0.6 * amp; R.lR.hp.rotation.x = -s * 0.6 * amp;
  R.lL.kn.rotation.x = Math.max(0, -c) * 0.9 * amp + 0.02; R.lR.kn.rotation.x = Math.max(0, c) * 0.9 * amp + 0.02;
  R.lL.ft.rotation.x = -R.lL.kn.rotation.x * 0.4; R.lR.ft.rotation.x = -R.lR.kn.rotation.x * 0.4;
  R.aL.sh.rotation.set(-s * 0.5 * amp, 0, 0.08); R.aR.sh.rotation.set(s * 0.5 * amp, 0, -0.08); R.aL.el.rotation.x = -0.25 - amp * 0.2; R.aR.el.rotation.x = -0.25 - amp * 0.2;
  // breathing / fear tremble
  R.chest.scale.y = 1 + Math.sin(t * (1.8 + (p.fear || 0) / 30)) * 0.012;
  if (R.kind === 'L') {
    // right arm holds the flashlight forward toward the aim
    const rel = angDiff(p.a, p.aim);
    R.aR.sh.rotation.set(-1.25 + Math.sin(t * 7) * 0.01, clamp(rel, -0.9, 0.9) * 0.6, -0.05); R.aR.el.rotation.set(-0.25, 0, 0);
    R.head.rotation.y = clamp(rel, -0.8, 0.8) * 0.5;
  } else {
    // left hand carries the lantern slightly forward; keep the lantern hanging
    R.aL.sh.rotation.set(-0.5 - s * 0.15 * amp, 0, 0.18); R.aL.el.rotation.x = -0.6;
    R.lanternG.rotation.x = 1.1 + s * 0.1 * amp; // counter-rotate to hang
    if (R.hairBack) R.hairBack.rotation.x = 0.08 + amp * 0.12 + Math.sin(R.ph) * 0.02;
    if (R.spiritFlame) { const k = 1 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.08; R.spiritFlame.scale.set(0.8 * k, 1.6 * k, 0.8 * k); }
  }
}
