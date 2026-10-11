/* ================= renderer: scene, map visuals, entities, fx ================= */
const R3 = { renderer: null, scene: null, cam: null, hemi: null, sun: null, mapG: null, entG: null, fxG: null, wallInst: [], bushInst: null, bushBase: [], bushTouched: new Set(), tileVis: null, boxVis: [], vis: new Map(), pvis: new Map(), cvis: new Map(), tvis: new Map(), gas: [], aim: null, camT: new THREE.Vector3(20, 0, 20), shake: 0, waterMat: null, bushMat: null, time: 0, quality: 1 };
const OV = { cv: null, ctx: null, dpr: 1, nums: [] };
function initRenderer() {
  const cv = document.getElementById('gl');
  const lowEnd = IS_TOUCH || QS.get('low') === '1';
  R3.quality = lowEnd ? 0 : 1;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: !lowEnd || devicePixelRatio < 2, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1.5 : 2));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  R3.renderer = r;
  R3.scene = new THREE.Scene();
  R3.cam = new THREE.PerspectiveCamera(38, 1, 0.5, 140);
  R3.hemi = new THREE.HemisphereLight(0xfff4e0, 0x9a7a5a, 1.75); R3.scene.add(R3.hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.3); sun.castShadow = true;
  const sz = 17; Object.assign(sun.shadow.camera, { left: -sz, right: sz, top: sz, bottom: -sz, near: 1, far: 60 });
  sun.shadow.mapSize.set(lowEnd ? 1024 : 2048, lowEnd ? 1024 : 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  R3.sun = sun; R3.scene.add(sun); R3.scene.add(sun.target);
  R3.entG = new THREE.Group(); R3.fxG = new THREE.Group(); R3.scene.add(R3.entG, R3.fxG);
  initParticles(); initAim();
  OV.cv = document.getElementById('ov'); OV.ctx = OV.cv.getContext('2d');
  addEventListener('resize', resize); resize();
}
function resize() {
  const w = innerWidth, h = innerHeight;
  R3.renderer.setSize(w, h, false); R3.cam.aspect = w / h; R3.cam.updateProjectionMatrix();
  OV.dpr = Math.min(devicePixelRatio, 2); OV.cv.width = w * OV.dpr; OV.cv.height = h * OV.dpr;
}

/* ---------- textures ---------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const hex = c => '#' + c.toString(16).padStart(6, '0');
function shade(c, k) { const r = Math.min(255, Math.max(0, ((c >> 16) & 255) * k)), g = Math.min(255, Math.max(0, ((c >> 8) & 255) * k)), b = Math.min(255, Math.max(0, (c & 255) * k)); return (r << 16) | (g << 8) | b; }
function groundTexture(th) {
  const N = M.N, S = 32, rng = mulberry32(M.seed + 3);
  return canvasTex(N * S, N * S, (g) => {
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const t = M.t[tIdx(x, z)];
      let c = ((x + z) & 1) ? th.g1 : th.g2;
      if (t === T_BORDER) c = th.border;
      if (t === T_WATER) c = th.waterDeep;
      g.fillStyle = hex(c); g.fillRect(x * S, z * S, S, S);
      if (t === T_FLOOR || t === T_BUSH || t === T_WALL) {
        for (let k = 0; k < 4; k++) { g.fillStyle = hex(shade(c, rng() < .5 ? 0.92 : 1.05)); const r = 1 + rng() * 2.2; g.beginPath(); g.arc(x * S + rng() * S, z * S + rng() * S, r, 0, TAU); g.fill(); }
        if (rng() < 0.12) { g.strokeStyle = hex(shade(c, 0.86)); g.lineWidth = 1.2; g.beginPath(); let px = x * S + rng() * S, pz = z * S + rng() * S; g.moveTo(px, pz); for (let k = 0; k < 3; k++) { px += (rng() - .5) * 14; pz += (rng() - .5) * 14; g.lineTo(px, pz); } g.stroke(); }
      }
    }
    // water banks
    g.lineWidth = 5;
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      if (M.t[tIdx(x, z)] !== T_WATER) continue;
      g.strokeStyle = hex(shade(th.g1, th.ice ? 0.9 : 0.82));
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (inMap(x + dx, z + dz) && M.t[tIdx(x + dx, z + dz)] !== T_WATER) {
          g.beginPath();
          if (dx) { const ex = (x + (dx > 0 ? 1 : 0)) * S + dx * 2.5; g.moveTo(ex, z * S); g.lineTo(ex, z * S + S); }
          else { const ez = (z + (dz > 0 ? 1 : 0)) * S + dz * 2.5; g.moveTo(x * S, ez); g.lineTo(x * S + S, ez); }
          g.stroke();
        }
      }
    }
    // subtle grid lines
    g.strokeStyle = 'rgba(0,0,0,0.035)'; g.lineWidth = 1;
    for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * S, 0); g.lineTo(i * S, N * S); g.stroke(); g.beginPath(); g.moveTo(0, i * S); g.lineTo(N * S, i * S); g.stroke(); }
  });
}
function crateTexture(th, top) {
  return canvasTex(128, 128, (g, w, h) => {
    const base = top ? th.crateTop : th.crate;
    g.fillStyle = hex(base); g.fillRect(0, 0, w, h);
    g.strokeStyle = hex(shade(base, 0.72)); g.lineWidth = 3;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); }
    if (!top || !THEMES[M.theme].ice) {
      g.lineWidth = 10; g.strokeStyle = hex(shade(base, 0.62)); g.strokeRect(5, 5, w - 10, h - 10);
      g.lineWidth = 9; g.beginPath(); g.moveTo(10, 10); g.lineTo(w - 10, h - 10); g.stroke();
      g.fillStyle = '#c9c2b5'; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
    } else { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, w, h); }
  });
}
let BOX_TEX = null;
function boxTextures() {
  if (BOX_TEX) return BOX_TEX;
  const draw = glowOnly => (g, w, h) => {
    g.fillStyle = glowOnly ? '#000' : '#5a7890'; g.fillRect(0, 0, w, h);
    if (!glowOnly) {
      g.strokeStyle = '#c3d6e4'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#3c5266'; g.fillRect(26, 26, w - 52, h - 52);
      g.fillStyle = '#c9d6e0'; for (const [x, y] of [[13, 13], [w - 13, 13], [13, h - 13], [w - 13, h - 13]]) { g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fill(); }
    }
    const c = w / 2; g.save(); g.translate(c, c); g.rotate(Math.PI / 4);
    g.fillStyle = glowOnly ? '#4dff7c' : '#3ee070'; g.fillRect(-20, -20, 40, 40);
    g.fillStyle = glowOnly ? '#b9ffcb' : '#b8ffcb'; g.fillRect(-9, -9, 18, 18); g.restore();
  };
  BOX_TEX = { map: canvasTex(128, 128, draw(false)), em: canvasTex(128, 128, draw(true)) };
  return BOX_TEX;
}
const GLOW_TEX = (() => { let t = null; return () => t || (t = canvasTex(64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); })); })();

/* ---------- map scene ---------- */
function buildMapScene() {
  const th = THEMES[M.theme], N = M.N, S = R3.scene;
  if (R3.mapG) { S.remove(R3.mapG); R3.mapG.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  for (const V of R3.vis.values()) R3.entG.remove(V.root); R3.vis.clear();
  for (const m of R3.pvis.values()) R3.fxG.remove(m); R3.pvis.clear();
  for (const m of R3.cvis.values()) R3.fxG.remove(m); R3.cvis.clear();
  for (const m of R3.tvis.values()) R3.entG.remove(m.root); R3.tvis.clear();
  const g = R3.mapG = new THREE.Group(); S.add(g);
  S.background = new THREE.Color(th.sky); S.fog = new THREE.Fog(th.fog, 34, 70);
  R3.hemi.color.set(th.ice ? 0xf0f6ff : M.theme === 'dusk' ? 0xffe2c4 : 0xfff4e0); R3.hemi.groundColor.set(th.ice ? 0x8094ad : M.theme === 'dusk' ? 0x8a5a6a : 0x9a7a5a);
  R3.sun.color.set(M.theme === 'dusk' ? 0xffd2a0 : 0xfff1d6);
  // outside ground
  const out = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), toon(th.out)); out.rotation.x = -Math.PI / 2; out.position.set(N / 2, -0.03, N / 2); out.receiveShadow = true; g.add(out);
  // arena ground
  const gt = groundTexture(th);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(N, N), new THREE.MeshToonMaterial({ map: gt, gradientMap: GRAD })); ground.rotation.x = -Math.PI / 2; ground.position.set(N / 2, 0, N / 2); ground.receiveShadow = true; g.add(ground);
  // walls
  R3.tileVis = new Int32Array(N * N).fill(-1);
  const rockGeo = GEO.box(0.98, 0.92, 0.98, 0.1).translate(0, 0.46, 0), capGeo = GEO.box(1.0, 0.16, 1.0, 0.07).translate(0, 0.98, 0);
  const crateGeo = GEO.box(0.96, 0.96, 0.96, 0.05).translate(0, 0.48, 0);
  const borderGeo = GEO.box(1.0, 1.35, 1.0, 0.08).translate(0, 0.675, 0), bcapGeo = GEO.box(1.02, 0.2, 1.02, 0.08).translate(0, 1.38, 0);
  const lists = { rock: [], crate: [], border: [] };
  for (let i = 0; i < N * N; i++) { const t = M.t[i]; if (t === T_WALL) lists[M.sty[i] ? 'crate' : 'rock'].push(i); else if (t === T_BORDER) lists.border.push(i); }
  const crateMat = new THREE.MeshToonMaterial({ map: crateTexture(th, false), gradientMap: GRAD });
  const crateTop = new THREE.MeshToonMaterial({ map: crateTexture(th, true), gradientMap: GRAD });
  const crateMats = [crateMat, crateMat, crateTop, crateMat, crateMat, crateMat];
  const mkInst = (geo, mat, list, sy, kind) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); im.count = list.length; im.castShadow = true; im.receiveShadow = true;
    const m4 = new THREE.Matrix4(), rng = mulberry32(M.seed + list.length);
    list.forEach((i, k) => { const x = i % N, z = (i / N) | 0; const ys = sy ? 1 + (rng() - 0.5) * sy : 1; m4.makeScale(1, ys, 1).setPosition(x + 0.5, 0, z + 0.5); im.setMatrixAt(k, m4); });
    im.instanceMatrix.needsUpdate = true; g.add(im); return im;
  };
  const rb = mkInst(rockGeo, toon(th.rock), lists.rock, 0.12), rc = mkInst(capGeo, toon(th.rockTop), lists.rock, 0.12);
  const cb = mkInst(crateGeo, crateMats, lists.crate, 0);
  mkInst(borderGeo, toon(th.border), lists.border, 0.25); mkInst(bcapGeo, toon(th.borderTop), lists.border, 0.25);
  R3.wallInst = [{ ims: [rb, rc], list: lists.rock }, { ims: [cb], list: lists.crate }];
  lists.rock.forEach((i, k) => R3.tileVis[i] = k); lists.crate.forEach((i, k) => R3.tileVis[i] = 100000 + k);
  // bushes
  const parts = [];
  for (const [x, y, z, r] of [[0, 0.42, 0, 0.42], [0.26, 0.3, 0.24, 0.3], [-0.26, 0.3, 0.22, 0.3], [0.24, 0.32, -0.25, 0.3], [-0.24, 0.3, -0.24, 0.31], [0, 0.62, 0.05, 0.26]]) parts.push(new THREE.IcosahedronGeometry(r, 1).translate(x, y, z));
  const bushGeo = THREE.mergeGeometries(parts);
  const bushList = []; for (let i = 0; i < N * N; i++) if (M.t[i] === T_BUSH) bushList.push(i);
  const bmat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: GRAD, flatShading: true });
  bmat.onBeforeCompile = sh => {
    sh.uniforms.uT = { value: 0 }; R3.bushMat = sh;
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph = instanceMatrix[3].x*0.9 + instanceMatrix[3].z*0.7;\n transformed.x += sin(uT*1.8+ph)*0.035*position.y; transformed.z += cos(uT*1.5+ph)*0.025*position.y;\n#endif');
  };
  const bim = new THREE.InstancedMesh(bushGeo, bmat, Math.max(1, bushList.length)); bim.count = bushList.length; bim.castShadow = true; bim.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), rng = mulberry32(M.seed + 7);
  R3.bushBase = [];
  bushList.forEach((i, k) => {
    const x = i % N, z = (i / N) | 0, s = 1.0 + rng() * 0.12;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * TAU);
    m4.compose(new THREE.Vector3(x + 0.5, 0, z + 0.5), q, new THREE.Vector3(s, s * (0.95 + rng() * 0.15), s)); bim.setMatrixAt(k, m4); R3.bushBase.push(m4.clone());
    bim.setColorAt(k, col.set(th.bush[Math.floor(rng() * th.bush.length)])); R3.tileVis[i] = 200000 + k;
  });
  bim.instanceMatrix.needsUpdate = true; if (bim.instanceColor) bim.instanceColor.needsUpdate = true;
  g.add(bim); R3.bushInst = bim; R3.bushTouched.clear();
  // water
  const wq = []; for (let i = 0; i < N * N; i++) if (M.t[i] === T_WATER) wq.push(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate((i % N) + .5, 0.05, ((i / N) | 0) + .5));
  if (wq.length) {
    const wmat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(th.water) }, uB: { value: new THREE.Color(th.waterDeep) }, uIce: { value: th.ice ? 1 : 0 } },
      vertexShader: 'varying vec2 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform float uT,uIce; uniform vec3 uA,uB; varying vec2 vW;
        void main(){ float t=uT*(1.-uIce*0.95);
          float n=sin(vW.x*2.3+t*1.6)*0.5+sin(vW.y*1.9-t*1.2)*0.5+sin((vW.x+vW.y)*1.3+t)*0.35;
          vec3 c=mix(uB,uA,0.55+0.25*n);
          float l=smoothstep(0.82,0.95,sin(vW.x*3.1+sin(vW.y*2.2+t)*1.4+t*1.1)*0.5+0.5);
          c+=vec3(l)*0.22*(1.-uIce*0.5);
          if(uIce>0.5){ float cr=smoothstep(0.96,1.,abs(sin(vW.x*5.3+vW.y*2.1))); c=mix(c,vec3(1.),cr*0.35); }
          gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>

        }`,
    });
    R3.waterMat = wmat;
    g.add(new THREE.Mesh(THREE.mergeGeometries(wq), wmat));
  } else R3.waterMat = null;
  // floor deco
  const decoGeos = [GEO.dod(0.09).translate(0, 0.03, 0), GEO.cone(0.05, 0.16, 5).translate(0, 0.08, 0), GEO.sph(0.05).translate(0, 0.05, 0)];
  const decoMats = [toon(shade(th.g1, 0.72)), toon(th.ice ? 0x9fb7c9 : shade(th.bush[0], 1.05)), toon(th.ice ? 0xffffff : 0xff8fa3)];
  for (let k = 0; k < 3; k++) {
    const L = M.deco.filter(d => d.k === k); if (!L.length) continue;
    const im = new THREE.InstancedMesh(decoGeos[k], decoMats[k], L.length);
    L.forEach((d, j) => { m4.compose(new THREE.Vector3(d.x, 0, d.z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), d.r), new THREE.Vector3(d.s, d.s, d.s)); im.setMatrixAt(j, m4); });
    im.receiveShadow = true; g.add(im);
  }
  // outside scenery
  const prop = th.deco, srng = mulberry32(M.seed + 11), scenery = new THREE.Group(); g.add(scenery);
  for (let k = 0; k < 46; k++) {
    let x, z; for (; ;) { x = -10 + srng() * (N + 20); z = -10 + srng() * (N + 20); if (x < -0.8 || z < -0.8 || x > N + 0.8 || z > N + 0.8) break; }
    const o = makeProp(prop, srng); o.position.set(x, 0, z); o.rotation.y = srng() * TAU; const s = 0.8 + srng() * 0.7; o.scale.setScalar(s); scenery.add(o);
  }
  for (let k = 0; k < 30; k++) {
    let x, z; for (; ;) { x = -8 + srng() * (N + 16); z = -8 + srng() * (N + 16); if (x < -0.6 || z < -0.6 || x > N + 0.6 || z > N + 0.6) break; }
    const r = P(scenery, GEO.dod(0.3 + srng() * 0.5), toon(shade(th.border, 1.1)), x, 0.1, z, srng(), srng(), srng(), null); r.receiveShadow = true;
  }
  mergeStatic(scenery);
  // power boxes
  R3.boxVis = M.boxes.map(b => {
    const bt = boxTextures();
    const mat = new THREE.MeshToonMaterial({ map: bt.map, emissiveMap: bt.em, emissive: 0xffffff, emissiveIntensity: 0.9, gradientMap: GRAD });
    const grp = new THREE.Group(); grp.position.set(b.tx + .5, 0, b.tz + .5);
    const m = P(grp, GEO.box(0.86, 0.82, 0.86, 0.06).translate(0, 0.41, 0), mat, 0, 0, 0, 0, 0, 0, OUTLINE_THIN); m.receiveShadow = true;
    P(grp, GEO.box(0.92, 0.1, 0.92, 0.04), toon(0x6f8ea6), 0, 0.84, 0, 0, 0, 0, null);
    P(grp, GEO.box(0.3, 0.06, 0.3, 0.03), glow(0x4dff7c, 1.2), 0, 0.9, 0, 0, Math.PI / 4, 0, null);
    g.add(grp); return { grp, mat, alive: true, shake: 0 };
  });
  // gas layers
  R3.gas = [];
  for (const [y, a] of [[0.12, 1], [1.05, 0.55]]) {
    const gm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uR: { value: N / 2 }, uT: { value: 0 }, uC: { value: new THREE.Vector2(N / 2, N / 2) }, uA: { value: a } },
      vertexShader: 'varying vec2 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform float uR,uT,uA; uniform vec2 uC; varying vec2 vW;
        void main(){ float e=max(abs(vW.x-uC.x),abs(vW.y-uC.y)); float d=e-uR;
          if(d<-0.2 || e>uC.x-0.98) discard;
          float n=sin(vW.x*1.3+uT*1.2)*sin(vW.y*1.1-uT*0.9)*0.5+0.5; float n2=sin(vW.x*0.5-uT*0.4+vW.y*0.4)*0.5+0.5;
          float a=smoothstep(-0.2,0.5,d)*(0.42+0.22*n+0.12*n2)*uA;
          vec3 c=mix(vec3(0.18,0.62,0.26),vec3(0.5,0.9,0.35),n*0.7+n2*0.3);
          c+=vec3(0.5,0.9,0.4)*smoothstep(0.35,0.,abs(d))*0.5;
          gl_FragColor=vec4(c,a);
#include <colorspace_fragment>

        }`,
    });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(N + 50, N + 50).rotateX(-Math.PI / 2), gm); pm.position.set(N / 2, y, N / 2); pm.renderOrder = 5; g.add(pm); R3.gas.push(gm);
  }
}
function makeProp(kind, rng) {
  const o = new THREE.Group();
  if (kind === 'cactus') {
    const c = toon(0x4f9e4a);
    P(o, GEO.cap(0.22, 1.0), c, 0, 0.72, 0);
    const a1 = P(o, GEO.cap(0.13, 0.35), c, 0.3, 0.85, 0); P(o, GEO.cap(0.12, 0.25), c, 0.2, 0.75, 0, 0, 0, Math.PI / 2);
    if (rng() < .7) { P(o, GEO.cap(0.12, 0.3), c, -0.28, 1.0, 0); P(o, GEO.cap(0.11, 0.2), c, -0.18, 0.9, 0, 0, 0, Math.PI / 2); }
    if (rng() < .5) P(o, GEO.sph(0.07), toon(0xff7aa2), 0, 1.36, 0, 0, 0, 0, null);
    void a1;
  } else if (kind === 'pine') {
    P(o, GEO.cyl(0.1, 0.13, 0.5), toon(0x6b4a33), 0, 0.25, 0);
    for (const [y, r, h] of [[0.75, 0.6, 0.8], [1.2, 0.46, 0.7], [1.6, 0.32, 0.6]]) { P(o, GEO.cone(r, h, 8), toon(0x2e7d5b), 0, y, 0); P(o, GEO.cone(r * 0.55, h * 0.4, 8), toon(0xffffff), 0, y + h * 0.32, 0, 0, 0, 0, null); }
  } else {
    P(o, GEO.cyl(0.08, 0.12, 1.6, 8), toon(0x9b6b43), 0, 0.8, 0, 0, 0, 0.12);
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6; P(o, GEO.sph(0.16, 1, 0.25, 3.2), toon(0x3fa36b), Math.cos(a) * 0.38 + 0.1, 1.55, Math.sin(a) * 0.38, 0, -a + Math.PI / 2, 0.35); }
  }
  o.traverse(m => { if (m.isMesh && !m.userData.outline) m.receiveShadow = true; });
  return o;
}
function visClearTile(i, wasWall) {
  const v = R3.tileVis ? R3.tileVis[i] : -1; if (v < 0) return;
  R3.tileVis[i] = -1;
  const z0 = new THREE.Matrix4().makeScale(0, 0, 0);
  if (v >= 200000) { const k = v - 200000; R3.bushInst.setMatrixAt(k, z0); R3.bushInst.instanceMatrix.needsUpdate = true; R3.bushBase[k] = null; }
  else { const W = R3.wallInst[v >= 100000 ? 1 : 0], k = v % 100000; for (const im of W.ims) { im.setMatrixAt(k, z0); im.instanceMatrix.needsUpdate = true; } }
  void wasWall;
}

/* ---------- particles ---------- */
const PT = { n: 1400, list: [], mesh: null, add: null, addList: [] };
function initParticles() {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mk = (additive) => {
    const mat = additive ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
      : new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: GRAD, flatShading: true });
    const im = new THREE.InstancedMesh(geo, mat, PT.n); im.count = 0; im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.setColorAt(0, new THREE.Color()); im.renderOrder = additive ? 8 : 0; R3.fxG.add(im); return im;
  };
  PT.mesh = mk(false); PT.add = mk(true);
}
function emit(o, n = 1) {
  for (let i = 0; i < n; i++) {
    const L = o.glow ? PT.addList : PT.list; if (L.length >= PT.n) L.shift();
    const sp = o.sp != null ? o.sp * rr(0.4, 1) : 0, a = o.a != null ? o.a + rr(-(o.ar || 0), o.ar || 0) : Math.random() * TAU, up = o.up != null ? o.up * rr(0.5, 1) : 0;
    L.push({ x: o.x + rr(-(o.jr || 0), o.jr || 0), y: o.y != null ? o.y : 0.5, z: o.z + rr(-(o.jr || 0), o.jr || 0), vx: Math.cos(a) * sp, vy: up, vz: Math.sin(a) * sp, g: o.g != null ? o.g : 9, life: 0, max: (o.life || 0.6) * rr(0.7, 1.15), s0: (o.s0 || 0.1) * rr(0.7, 1.2), s1: o.s1 != null ? o.s1 : 0, c: new THREE.Color(Array.isArray(o.c) ? pick(o.c) : o.c), drag: o.drag || 1.5, spin: Math.random() * TAU });
  }
}
function stepParticles(dt) {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (const [L, im] of [[PT.list, PT.mesh], [PT.addList, PT.add]]) {
    let k = 0;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]; p.life += dt; if (p.life >= p.max) { L.splice(i, 1); continue; }
      p.vy -= p.g * dt; const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vz *= dr;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.03) { p.y = 0.03; p.vy *= -0.35; p.vx *= 0.7; p.vz *= 0.7; }
      const f = p.life / p.max, sc = lerp(p.s0, p.s1, f); p.spin += dt * 4;
      m4.compose(v.set(p.x, p.y, p.z), q.setFromEuler(e.set(p.spin, p.spin * 0.7, 0)), s.set(sc, sc, sc));
      im.setMatrixAt(k, m4); im.setColorAt(k, p.c); k++;
    }
    im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
}
const RINGS = [];
function ring(x, z, r, color, life = 0.45, y = 0.06, w = 0.12) {
  const geo = new THREE.RingGeometry(1 - w, 1, 40).rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.set(x, y, z); m.renderOrder = 9; R3.fxG.add(m); RINGS.push({ m, r, t: 0, life });
}
function stepRings(dt) {
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const R = RINGS[i]; R.t += dt; const f = R.t / R.life;
    if (f >= 1) { R3.fxG.remove(R.m); R.m.geometry.dispose(); R.m.material.dispose(); RINGS.splice(i, 1); continue; }
    const s = R.r * (0.25 + 0.75 * (1 - (1 - f) * (1 - f))); R.m.scale.set(s, 1, s); R.m.material.opacity = 1 - f;
  }
}

/* ---------- aim indicators ---------- */
function initAim() {
  const mat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group(); g.renderOrder = 7;
  const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5), mat(0xffffff));
  const cone = new THREE.Mesh(new THREE.CircleGeometry(1, 40, -Math.PI / 2 - 0.3, 0.6).rotateX(-Math.PI / 2), mat(0xffffff));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), mat(0xffffff));
  const rng = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2), mat(0xffffff));
  for (const m of [line, cone, disc, rng]) { m.renderOrder = 7; m.visible = false; g.add(m); }
  g.position.y = 0.045; R3.scene.add(g);
  R3.aim = { g, line, cone, disc, rng, coneSpread: 0 };
}
function showAim(b, mode, ang, tx, tz, strength) {
  const A = R3.aim;
  for (const m of [A.line, A.cone, A.disc, A.rng]) m.visible = false;
  if (!b || !mode) return;
  const a = mode === 'sup' ? b.H.sup : b.H.atk, col = mode === 'sup' ? 0xffd23f : 0xffffff, op = strength;
  const setM = (m, o = op) => { m.visible = true; m.material.color.setHex(col); m.material.opacity = o; };
  const rotY = Math.PI / 2 - ang;
  if (a.type === 'stealth' || a.type === 'shield') {
    const rad = a.type === 'shield' ? a.range : 1.0;
    setM(A.disc, op * 0.6); A.disc.position.set(b.x, 0, b.z); A.disc.scale.set(rad, 1, rad);
  } else if (a.type === 'lob' || a.type === 'turret' || a.type === 'pool' || a.type === 'zone' || a.type === 'leap') {
    let dx = tx - b.x, dz = tz - b.z, L = Math.hypot(dx, dz); if (L < 0.01) { dx = Math.cos(ang); dz = Math.sin(ang); L = 1; }
    const D = Math.min(L, a.range), px = b.x + dx / L * D, pz = b.z + dz / L * D, rad = a.type === 'zone' ? a.zone.r : a.type === 'turret' ? 0.6 : a.radius;
    setM(A.disc, op * 0.9); A.disc.position.set(px, 0, pz); A.disc.scale.set(rad, 1, rad);
    setM(A.rng, op * 0.8); A.rng.position.set(b.x, 0, b.z); A.rng.scale.set(a.range, 1, a.range);
  } else if (a.type === 'ring') {
    setM(A.disc, op * 0.6); A.disc.position.set(b.x, 0, b.z); A.disc.scale.set(a.range, 1, a.range);
  } else if (a.type === 'spread' || a.type === 'flame' || a.type === 'fan' || a.type === 'melee') {
    const sp = a.spread + (a.type === 'fan' ? 0.1 : 0.06);
    if (Math.abs(A.coneSpread - sp) > 1e-3) { A.cone.geometry.dispose(); A.cone.geometry = new THREE.CircleGeometry(1, 40, -Math.PI / 2 - sp / 2, sp).rotateX(-Math.PI / 2); A.coneSpread = sp; }
    setM(A.cone); A.cone.position.set(b.x, 0, b.z); A.cone.rotation.y = rotY; A.cone.scale.set(a.range, 1, a.range);
  } else {
    const w = a.type === 'dash' ? 1.0 : a.type === 'chain' ? 0.55 : (a.size || 0.2) * 2 + 0.25;
    setM(A.line); A.line.position.set(b.x, 0, b.z); A.line.rotation.y = rotY; A.line.scale.set(w, 1, a.range);
  }
}

/* ---------- per-frame sync ---------- */
const TEAM_COL = { me: 0x45e06a, ally: 0x3fa9ff, foe: 0xff4b4b };
function teamRel(b) { const me = meEnt(); if (me && b.id === me.id) return 'me'; return b.team === myTeam() ? 'ally' : 'foe'; }
function makeVis(b) {
  const V = makeHero(b.H.k);
  const rel = teamRel(b);
  const rm = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TEAM_COL[rel], transparent: true, opacity: 0.85, depthWrite: false }));
  rm.position.y = 0.035; rm.renderOrder = 6; V.root.add(rm); V.ringM = rm;
  const sr = new THREE.Mesh(new THREE.RingGeometry(0.56, 0.66, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  sr.position.y = 0.04; sr.renderOrder = 6; V.root.add(sr); V.supM = sr;
  V.root.traverse(o => { if (o.isMesh && !o.userData.outline && o !== rm && o !== sr) o.castShadow = true; });
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16), new THREE.MeshBasicMaterial({ color: 0x2fb8ff, transparent: true, opacity: 0.3, depthWrite: false }));
  sh.position.y = 0.7; sh.visible = false; sh.renderOrder = 8; V.root.add(sh); V.shieldM = sh;
  V.wasAlive = true; V.deadAt = 0; V.x = b.x; V.z = b.z; V.face = b.face;
  R3.entG.add(V.root); return V;
}
const PROJ_LOOK = {
  pellet: { g: () => GEO.sph(0.09), m: () => glow(0xffd166, 1.6), trail: 0xffc04a },
  slug: { g: () => GEO.sph(0.15), m: () => glow(0xff9f1c, 1.8), trail: 0xffb347 },
  bolt: { g: () => GEO.cap(0.045, 0.42).rotateX(Math.PI / 2), m: () => glow(0x6ff7e0, 1.8), trail: 0x6ff7e0 },
  bolt2: { g: () => GEO.cap(0.07, 0.6).rotateX(Math.PI / 2), m: () => glow(0xb4fff1, 2.2), trail: 0x7af5ff },
  flame: { g: () => GEO.ico(0.24, 1), m: () => new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), trail: 0xff8a2a },
  bomb: { g: () => GEO.sph(0.15), m: () => toon(0x2b2b3a), trail: 0xffd54a },
  megabomb: { g: () => GEO.sph(0.34), m: () => toon(0xff7ac0), trail: 0xffb3e0 },
  bullet: { g: () => GEO.cap(0.06, 0.18).rotateX(Math.PI / 2), m: () => glow(0xfff1a8, 1.8), trail: 0xffe066 },
  bullet2: { g: () => GEO.cap(0.07, 0.22).rotateX(Math.PI / 2), m: () => glow(0xffb703, 2), trail: 0xffb703 },
  orb: { g: () => GEO.sph(0.2), m: () => glow(0x5ef2ff, 2.2), trail: 0x5ef2ff },
  tshot: { g: () => GEO.sph(0.1), m: () => glow(0x9df7ff, 2), trail: 0x5ef2ff },
  spore: { g: () => GEO.ico(0.17, 1), m: () => glow(0xa45cff, 1.2), trail: 0x9cff57 },
  snowball: { g: () => GEO.sph(0.17), m: () => toon(0xffffff), trail: 0xd8f1ff },
  lantern: { g: () => GEO.box(0.2, 0.26, 0.2, 0.04), m: () => glow(0xffd36b, 1.8), trail: 0xffc04a },
  quake: { g: () => GEO.dod(0.3), m: () => toon(0x8a6a4a), trail: 0xc8a878 },
};
const PLOOK_CACHE = {};
function projMesh(k) {
  const L = PROJ_LOOK[k]; const c = PLOOK_CACHE[k] || (PLOOK_CACHE[k] = { g: L.g(), m: L.m() });
  const grp = new THREE.Group(); const m = new THREE.Mesh(c.g, c.m); grp.add(m); grp.userData.k = k;
  if (k === 'megabomb') { for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(GEO.tor(0.34, 0.025, TAU, 6, 24), toon(0xc0397e)); t.rotation.set(i, i * 1.3, 0); grp.add(t); } }
  if (LOB_KINDS.has(k)) {
    const sh = new THREE.Mesh(new THREE.CircleGeometry(k === 'megabomb' ? 0.4 : 0.2, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
    grp.userData.shadow = sh; R3.fxG.add(sh);
    const tg = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0.6, depthWrite: false }));
    tg.renderOrder = 7; grp.userData.target = tg; R3.fxG.add(tg);
  }
  R3.fxG.add(grp); return grp;
}
function syncScene(dt, now) {
  const me = meEnt(), myT = myTeam();
  // brawlers
  const seen = new Set();
  for (const b of viewBrawlers()) {
    seen.add(b.id);
    let V = R3.vis.get(b.id); if (!V) { V = makeVis(b); R3.vis.set(b.id, V); }
    const visible = b.alive ? b.vis !== false : true;
    // death tracking
    if (V.wasAlive && !b.alive) { V.deadAt = now; poof(V.x, V.z, b.H.color); }
    if (!V.wasAlive && b.alive) { V.root.visible = true; V.x = b.x; V.z = b.z; ring(b.x, b.z, 1.3, 0x7dffa0, 0.5); }
    V.wasAlive = b.alive;
    const deadAge = b.alive ? 0 : now - V.deadAt;
    V.root.visible = visible && (b.alive || deadAge < 1.4);
    if (!V.root.visible) continue;
    V.x = b.x; V.z = b.z;
    V.root.position.set(V.x, b.jy || 0, V.z);
    V.shieldM.visible = b.alive && b.shield > 0; if (V.shieldM.visible) { V.shieldM.material.opacity = 0.26 + 0.08 * Math.sin(now * 6); V.shieldM.scale.setScalar(1 + Math.sin(now * 4) * 0.03); }
    if (b.alive && b.slowT > 0 && Math.random() < dt * 10) emit({ x: b.x, z: b.z, y: 1.2, c: [0xffffff, 0xbfe9ff], s0: 0.06, s1: 0, life: 0.6, sp: 0.6, up: -0.2, g: 0.5, jr: 0.35 });
    if (b.alive && b.stunT > 0.15 && Math.random() < dt * 14) { const a = now * 8 + Math.random(); emit({ x: b.x + Math.cos(a) * 0.35, z: b.z + Math.sin(a) * 0.35, y: 1.65, c: 0xffe14d, glow: 1, s0: 0.07, s1: 0, life: 0.25, g: 0 }); }
    if (b.atkSeq !== V.lastAtkSeq) { if (V.lastAtkSeq >= 0) { V.atkAge = 0; V.hand ^= 1; } V.lastAtkSeq = b.atkSeq; }
    if (b.supSeq !== V.lastSupSeq) { if (V.lastSupSeq >= 0) V.supAge = 0; V.lastSupSeq = b.supSeq; }
    V.atkAge += dt; V.supAge += dt;
    const recentAtk = V.atkAge < 0.6 || V.supAge < 0.6;
    const isMe = me && b.id === me.id;
    const aiming = isMe && INP.aimHeld;
    const want = (recentAtk || aiming || !b.moving) ? b.face : b.mface;
    V.face += angDiff(V.face, want) * Math.min(1, dt * 16);
    V.root.rotation.y = Math.PI / 2 - V.face;
    const fl = b.flashT > 0 ? 1 : 0; if (fl !== V.flash) { V.flash = fl; setHeroFlash(V, fl); }
    setHeroOpacity(V, b.alive && b.stealthT > 0 ? 0.3 : b.alive && b.inBush && b.team === myT ? 0.5 : 1);
    V.ringM.visible = b.alive; V.supM.material.opacity = b.alive && b.sup >= 1 && b.team === myT ? 0.55 + 0.35 * Math.sin(now * 8) : 0;
    animHero(V, { alive: b.alive, deadAge, jy: b.jy || 0, moving: b.moving, atkAge: V.atkAge, supAge: V.supAge, aiming, stun: b.stunT > 0, dash: b.fm === 'dash' || (b.fm && b.fm.k === 'dash'), spin: b.burst === 'ring' || (b.burst && b.burst.k === 'ring') }, dt, now);
    // footstep dust
    if (b.moving && b.alive && Math.random() < dt * 8 && !b.inBush) emit({ x: b.x, z: b.z, y: 0.05, c: THEMES[M.theme].ice ? 0xffffff : shade(THEMES[M.theme].g1, 0.9), s0: 0.07, s1: 0.0, life: 0.45, sp: 0.4, up: 0.6, g: 1 });
    if (b.burst && (b.burst === 'ring' || b.burst.k === 'ring')) emit({ x: b.x, z: b.z, y: 0.7, c: 0xffd23f, glow: 1, s0: 0.06, s1: 0, life: 0.3, sp: 3 });
  }
  for (const [id, V] of R3.vis) if (!seen.has(id)) { R3.entG.remove(V.root); R3.vis.delete(id); }
  // projectiles
  const pseen = new Set();
  for (const p of viewProjs()) {
    if (p.delay > 0) continue;
    pseen.add(p.id);
    let m = R3.pvis.get(p.id); if (!m) { m = projMesh(p.k); R3.pvis.set(p.id, m); m.userData.age = 0; }
    m.userData.age += dt;
    m.position.set(p.x, p.y, p.z);
    const k = p.k;
    if (k === 'flame') { const s = 0.6 + m.userData.age * 3.2; m.scale.setScalar(s); m.children[0].material.opacity = Math.max(0, 0.9 - m.userData.age * 1.6); if (Math.random() < 0.5) emit({ x: p.x, z: p.z, y: p.y, c: [0xff5a1a, 0xffb347, 0xffe08a], glow: 1, s0: 0.14, s1: 0, life: 0.3, up: 1, g: -1 }); }
    else if (LOB_KINDS.has(k)) {
      m.rotation.x += dt * 8; m.rotation.z += dt * 5;
      const sh = m.userData.shadow; sh.position.set(p.x, 0.04, p.z);
      if (p.lob) { m.userData.target.position.set(p.lob.tx, 0.05, p.lob.tz); const r = p.radius || 1; m.userData.target.scale.set(r, 1, r); }
      if (Math.random() < 0.6) emit({ x: p.x, z: p.z, y: p.y + (k === 'bomb' ? 0.18 : 0.4), c: [0xffd54a, 0xff8a3a], glow: 1, s0: 0.05, s1: 0, life: 0.25, up: 1, g: 0 });
    } else {
      m.rotation.y = Math.atan2(p.vx, p.vz);
      const L = PROJ_LOOK[k]; if (L && Math.random() < 0.8) emit({ x: p.x, z: p.z, y: p.y, c: L.trail, glow: 1, s0: k === 'orb' ? 0.13 : 0.07, s1: 0, life: 0.22, g: 0 });
      if (k === 'orb') m.scale.setScalar(1 + Math.sin(now * 20) * 0.12);
      if (k === 'lantern') { m.rotation.y = now * 9; }
      if (k === 'quake') { m.rotation.x = now * 7; m.position.y = 0.3; if (Math.random() < 0.7) emit({ x: p.x, z: p.z, y: 0.1, c: [0xc8a878, 0x9a7a5a], s0: 0.12, s1: 0, life: 0.5, sp: 1.5, up: 2, g: 6 }); }
    }
  }
  for (const [id, m] of R3.pvis) if (!pseen.has(id)) { R3.fxG.remove(m); if (m.userData.shadow) R3.fxG.remove(m.userData.shadow); if (m.userData.target) R3.fxG.remove(m.userData.target); R3.pvis.delete(id); }
  // cubes
  const cseen = new Set();
  for (const c of viewCubes()) {
    cseen.add(c.id);
    let m = R3.cvis.get(c.id);
    if (!m) {
      m = new THREE.Group(); const cm = P(m, GEO.box(0.34, 0.34, 0.34, 0.05), toon(0x3de06a, { emissive: 0x1fbf4a, emissiveIntensity: 0.9 }), 0, 0, 0, 0, 0, 0, OUTLINE_THIN);
      P(cm, GEO.box(0.2, 0.36, 0.2, 0.03), glow(0xb6ffc8, 1.2), 0, 0, 0, 0, 0, 0, null);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX(), color: 0x6dff8f, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(1.3); m.add(sp);
      m.userData.cube = cm; m.userData.born = now; R3.fxG.add(m); R3.cvis.set(c.id, m);
    }
    const age = now - m.userData.born, hop = age < 0.45 ? Math.sin(age / 0.45 * Math.PI) * 0.9 : 0;
    m.position.set(c.x, 0.45 + Math.sin(now * 3 + c.id) * 0.08 + hop, c.z); m.userData.cube.rotation.set(0.6, now * 1.8, 0.6);
  }
  for (const [id, m] of R3.cvis) if (!cseen.has(id)) { R3.fxG.remove(m); R3.cvis.delete(id); }
  // turrets
  const tseen = new Set();
  for (const t of viewTurrets()) {
    tseen.add(t.id);
    let T = R3.tvis.get(t.id);
    if (!T) { T = makeTurret(); T.root.position.set(t.x, 0, t.z); R3.entG.add(T.root); R3.tvis.set(t.id, T); T.face = t.face; T.fl = 0;
      const rm = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.55, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: t.team === myT ? (t.owner === (me && me.id) ? TEAM_COL.me : TEAM_COL.ally) : TEAM_COL.foe, transparent: true, opacity: .85, depthWrite: false })); rm.position.y = 0.035; T.root.add(rm); }
    T.face += angDiff(T.face, t.face) * Math.min(1, dt * 10); T.head.rotation.y = Math.PI / 2 - T.face;
    const fl = t.flashT > 0 ? 1 : 0; if (fl !== T.fl) { T.fl = fl; for (const m of T.mats) { if (fl) { m.emissive.setRGB(1, 1, 1); m.emissiveIntensity = 0.9; } else { m.emissive.copy(m.userData.baseE); m.emissiveIntensity = m.userData.baseEI; } } }
  }
  for (const [id, T] of R3.tvis) if (!tseen.has(id)) { R3.entG.remove(T.root); R3.tvis.delete(id); }
  // boxes
  M.boxes.forEach((b, i) => {
    const V = R3.boxVis[i]; if (!V) return;
    if (b.hp <= 0 && V.alive) { V.alive = false; V.grp.visible = false; }
    if (b.hp > 0 && !V.alive) { V.alive = true; V.grp.visible = true; }
    if (V.shake > 0) { V.shake -= dt; V.grp.position.x = b.tx + .5 + Math.sin(now * 70) * 0.05 * V.shake * 6; } else V.grp.position.x = b.tx + .5;
    V.mat.emissiveIntensity = 0.75 + Math.sin(now * 3 + i) * 0.25;
  });
  // bushes squash near my brawler if inside
  if (R3.bushInst && me) {
    const want = new Set();
    if (me.alive && me.inBush) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const tx = Math.floor(me.x) + dx, tz = Math.floor(me.z) + dz; if (!inMap(tx, tz)) continue; const v = R3.tileVis[tIdx(tx, tz)];
      if (v >= 200000 && d2(tx + .5, tz + .5, me.x, me.z) < 2.6 * 2.6) want.add(v - 200000);
    }
    const m4 = new THREE.Matrix4(), sc = new THREE.Matrix4().makeScale(0.85, 0.42, 0.85);
    let ch = false;
    for (const k of R3.bushTouched) if (!want.has(k)) { if (R3.bushBase[k]) R3.bushInst.setMatrixAt(k, R3.bushBase[k]); ch = true; }
    for (const k of want) if (!R3.bushTouched.has(k) && R3.bushBase[k]) { m4.copy(R3.bushBase[k]).multiply(sc); R3.bushInst.setMatrixAt(k, m4); ch = true; }
    R3.bushTouched = want; if (ch) R3.bushInst.instanceMatrix.needsUpdate = true;
  }
  syncZones(dt, now);
  stepFxm(dt);
  // gas & water
  const gr = viewGasR();
  for (const gm of R3.gas) { gm.uniforms.uR.value = gr; gm.uniforms.uT.value = now; }
  if (R3.waterMat) R3.waterMat.uniforms.uT.value = now;
  if (R3.bushMat) R3.bushMat.uniforms.uT.value = now;
}
function poof(x, z, col) {
  emit({ x, z, y: 0.6, c: [0xffffff, 0xe6e6e6, col], s0: 0.28, s1: 0.0, life: 0.7, sp: 3, up: 3, g: 2, jr: 0.2 }, 18);
  emit({ x, z, y: 0.6, c: [0xffd23f, 0xffffff], glow: 1, s0: 0.1, s1: 0, life: 0.6, sp: 5, up: 4, g: 6 }, 14);
  ring(x, z, 1.6, 0xffffff, 0.5);
}

/* ---------- camera ---------- */
function updateCamera(dt, focus, lead) {
  const asp = R3.cam.aspect, k = clamp(1.6 / asp, 1, 1.5) * (IS_TOUCH ? 1.05 : 1);
  const tx = focus ? focus.x + (lead ? lead.x : 0) : M.N / 2, tz = focus ? focus.z + (lead ? lead.z : 0) : M.N / 2;
  R3.camT.x += (tx - R3.camT.x) * Math.min(1, dt * 6); R3.camT.z += (tz - R3.camT.z) * Math.min(1, dt * 6);
  const sh = R3.shake > 0 ? R3.shake : 0; R3.shake = Math.max(0, R3.shake - dt * 1.8);
  const ox = (Math.random() - .5) * sh * 0.5, oz = (Math.random() - .5) * sh * 0.5;
  R3.cam.position.set(R3.camT.x + ox, 15.5 * k, R3.camT.z + 9.6 * k + oz);
  R3.cam.lookAt(R3.camT.x + ox, 0, R3.camT.z + oz + 0.6);
  R3.sun.position.set(R3.camT.x - 7, 16, R3.camT.z + 5); R3.sun.target.position.set(R3.camT.x, 0, R3.camT.z - 1);
}

/* ---------- 2D overlay: names, hp bars, damage numbers ---------- */
const _v = new THREE.Vector3();
function toScreen(x, y, z) { _v.set(x, y, z).project(R3.cam); return { x: (_v.x * 0.5 + 0.5) * innerWidth, y: (-_v.y * 0.5 + 0.5) * innerHeight, ok: _v.z < 1 }; }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawOverlay(dt, now) {
  const g = OV.ctx, D = OV.dpr; g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
  if (STATE.mode !== 'play' && STATE.mode !== 'result') return;
  const me = meEnt(), myT = myTeam(), sc = clamp(innerHeight / 820, 0.75, 1.15);
  g.textAlign = 'center'; g.lineJoin = 'round';
  for (const b of viewBrawlers()) {
    if (!b.alive || b.vis === false) continue;
    const V = R3.vis.get(b.id); if (!V || !V.root.visible) continue;
    const s = toScreen(V.x, 1.95 * (V.root.userData.scale || 1), V.z); if (!s.ok) continue;
    const rel = teamRel(b), col = rel === 'me' ? '#4fe36f' : rel === 'ally' ? '#47aaff' : '#ff4d4d';
    const w = 70 * sc, h = 13 * sc, x = s.x - w / 2, y = s.y;
    // name
    g.font = `800 ${12 * sc}px "ZCOOL KuaiLe","PingFang SC",system-ui,sans-serif`;
    g.lineWidth = 3.5; g.strokeStyle = 'rgba(20,12,24,.85)'; g.strokeText(b.name, s.x, y - 6 * sc); g.fillStyle = rel === 'foe' ? '#ffd9d9' : '#ffffff'; g.fillText(b.name, s.x, y - 6 * sc);
    // hp bar
    g.fillStyle = 'rgba(20,12,24,.85)'; rrect(g, x - 2, y - 2, w + 4, h + 4, 5); g.fill();
    const f = clamp(b.hp / b.mhp, 0, 1); g.fillStyle = col; rrect(g, x, y, Math.max(h, w * f), h, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 3, y + 2, Math.max(0, w * f - 6), h * 0.3);
    g.font = `900 ${10.5 * sc}px "Lilita One",system-ui,sans-serif`; g.lineWidth = 3; g.strokeStyle = 'rgba(20,12,24,.9)'; g.strokeText(Math.ceil(b.hp), s.x, y + h - 2.2 * sc); g.fillStyle = '#fff'; g.fillText(Math.ceil(b.hp), s.x, y + h - 2.2 * sc);
    // cubes badge
    if (b.cubes > 0) {
      const bx = x - 12 * sc, by = y + h / 2; g.save(); g.translate(bx, by); g.rotate(Math.PI / 4); g.fillStyle = '#1f6b34'; g.fillRect(-9 * sc, -9 * sc, 18 * sc, 18 * sc); g.fillStyle = '#4dff7c'; g.fillRect(-7 * sc, -7 * sc, 14 * sc, 14 * sc); g.restore();
      g.font = `900 ${11 * sc}px "Lilita One",system-ui,sans-serif`; g.fillStyle = '#0b2a14'; g.fillText(b.cubes, bx, by + 4 * sc);
    }
    // my ammo
    if (rel === 'me') {
      const aw = (w - 4) / 3, ay = y + h + 5;
      for (let i = 0; i < 3; i++) { const fi = clamp(b.ammo - i, 0, 1); g.fillStyle = 'rgba(20,12,24,.85)'; rrect(g, x + i * (aw + 2) - 1, ay - 1, aw + 2, 7 * sc + 2, 3); g.fill(); g.fillStyle = fi >= 1 ? '#ff9f1c' : '#a35f12'; rrect(g, x + i * (aw + 2), ay, aw * fi, 7 * sc, 3); if (fi > 0.05) g.fill(); }
    }
  }
  // turrets / boxes hp
  for (const t of viewTurrets()) {
    const s = toScreen(t.x, 1.25, t.z); if (!s.ok) continue; const w = 46 * sc, h = 8 * sc;
    g.fillStyle = 'rgba(20,12,24,.85)'; rrect(g, s.x - w / 2 - 2, s.y - 2, w + 4, h + 4, 4); g.fill();
    g.fillStyle = t.team === myT ? '#47aaff' : '#ff4d4d'; rrect(g, s.x - w / 2, s.y, w * clamp(t.hp / t.mhp, 0, 1), h, 3); g.fill();
  }
  M.boxes.forEach(b => {
    if (b.hp <= 0 || b.hp >= BAL.boxHp) return; const s = toScreen(b.tx + .5, 1.3, b.tz + .5); if (!s.ok) return; const w = 50 * sc, h = 8 * sc;
    g.fillStyle = 'rgba(20,12,24,.85)'; rrect(g, s.x - w / 2 - 2, s.y - 2, w + 4, h + 4, 4); g.fill();
    g.fillStyle = '#4dff7c'; rrect(g, s.x - w / 2, s.y, w * b.hp / BAL.boxHp, h, 3); g.fill();
  });
  // damage numbers
  for (let i = OV.nums.length - 1; i >= 0; i--) {
    const n = OV.nums[i]; n.t += dt; if (n.t > 0.9) { OV.nums.splice(i, 1); continue; }
    const s = toScreen(n.x, 1.6 + n.t * 1.2, n.z); if (!s.ok) continue;
    const pop = n.t < 0.12 ? 1 + (0.12 - n.t) * 4 : 1, a = n.t > 0.6 ? 1 - (n.t - 0.6) / 0.3 : 1;
    g.globalAlpha = a; g.font = `900 ${n.big ? 22 * sc * pop : 16 * sc * pop}px "Lilita One",system-ui,sans-serif`; g.lineWidth = 4; g.strokeStyle = 'rgba(20,12,24,.9)';
    g.strokeText(n.v, s.x + n.dx, s.y); g.fillStyle = n.c; g.fillText(n.v, s.x + n.dx, s.y); g.globalAlpha = 1;
  }
  // off-screen teammate arrow (duo)
  if (me) for (const b of viewBrawlers()) {
    if (b.id === me.id || b.team !== myT || !b.alive) continue;
    const s = toScreen(b.x, 1, b.z); const m = 40; if (s.ok && s.x > m && s.y > m && s.x < innerWidth - m && s.y < innerHeight - m) continue;
    const cx = innerWidth / 2, cy = innerHeight / 2, a = Math.atan2(s.y - cy, s.x - cx), px = clamp(cx + Math.cos(a) * 9999, m, innerWidth - m), py = clamp(cy + Math.sin(a) * 9999, m, innerHeight - m);
    g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = '#47aaff'; g.strokeStyle = '#102030'; g.lineWidth = 3; g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, -11); g.lineTo(-8, 11); g.closePath(); g.stroke(); g.fill(); g.restore();
  }
}
function addNum(x, z, v, c, big) { OV.nums.push({ x, z, v, c, t: 0, big, dx: (Math.random() - .5) * 26 }); if (OV.nums.length > 80) OV.nums.shift(); }

/* ---------- zones & one-shot effect meshes ---------- */
const ZONE_LOOK = { poison: { fill: 0x7ac943, edge: 0xa55cd6, p: [0x9cff57, 0xb070ff] }, heal: { fill: 0xff8fb8, edge: 0x6dff8f, p: [0xff9fd0, 0xb6ffc8] }, frost: { fill: 0x4fb4f0, edge: 0x2f8fd8, p: [0xffffff, 0xd8f1ff] } };
R3.zvis = new Map();
function syncZones(dt, now) {
  const seen = new Set();
  for (const z of viewZones()) {
    seen.add(z.id); let V = R3.zvis.get(z.id); const L = ZONE_LOOK[z.k];
    if (!V) {
      const g = new THREE.Group(); g.position.set(z.x, 0.05, z.z);
      const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: L.fill, transparent: true, opacity: 0.32, depthWrite: false }));
      const edge = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: L.edge, transparent: true, opacity: 0.85, depthWrite: false }));
      fill.renderOrder = edge.renderOrder = 6; g.add(fill, edge);
      if (z.k === 'heal') for (let i = 0; i < 6; i++) { const a = i * TAU / 6, m = new THREE.Group(); m.position.set(Math.cos(a) * 0.86, 0, Math.sin(a) * 0.86); P(m, GEO.cyl(0.035, 0.05, 0.14, 8).translate(0, 0.07, 0), toon(0xfff1de), 0, 0, 0, 0, 0, 0, null); P(m, GEO.half(0.09, 1, 0.7, 1).translate(0, 0.13, 0), toon(0xff6fa8), 0, 0, 0, 0, 0, 0, null); g.add(m); }
      g.scale.set(z.r, 1, z.r); R3.fxG.add(g); V = { g, fill, edge, born: now }; R3.zvis.set(z.id, V);
    }
    const age = now - V.born, fin = Math.min(1, age / 0.25), fade = clamp(z.life / 0.5, 0, 1);
    V.g.scale.set(z.r * (0.6 + 0.4 * fin), 1, z.r * (0.6 + 0.4 * fin));
    V.fill.material.opacity = (0.26 + 0.08 * Math.sin(now * 5)) * fade; V.edge.material.opacity = 0.85 * fade;
    if (Math.random() < dt * z.r * 9) { const a = Math.random() * TAU, rr2 = Math.sqrt(Math.random()) * z.r;
      emit({ x: z.x + Math.cos(a) * rr2, z: z.z + Math.sin(a) * rr2, y: z.k === 'frost' ? 1.8 : 0.1, c: L.p, glow: z.k !== 'frost' ? 1 : 0, s0: z.k === 'frost' ? 0.06 : 0.09, s1: 0, life: z.k === 'frost' ? 1.2 : 0.8, up: z.k === 'frost' ? -1.4 : 1.2, g: z.k === 'frost' ? 0.2 : -0.6 }); }
  }
  for (const [id, V] of R3.zvis) if (!seen.has(id)) { R3.fxG.remove(V.g); R3.zvis.delete(id); }
}
const FXM = [];
function fxMesh(m, life, grow) { R3.fxG.add(m); FXM.push({ m, t: 0, life, grow: grow || 0, o0: m.material.opacity }); }
function stepFxm(dt) {
  for (let i = FXM.length - 1; i >= 0; i--) {
    const F = FXM[i]; F.t += dt; const f = F.t / F.life;
    if (f >= 1) { R3.fxG.remove(F.m); F.m.geometry.dispose(); F.m.material.dispose(); FXM.splice(i, 1); continue; }
    F.m.material.opacity = F.o0 * (1 - f); if (F.grow) F.m.scale.multiplyScalar(1 + F.grow * dt);
  }
}
function arcFx(x, z, a, r, s, color) {
  const g = new THREE.RingGeometry(r * 0.35, r, 28, 1, -a - s / 2, s).rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, 0.5, z); m.renderOrder = 9; fxMesh(m, 0.22);
}
function boltFx(pts) {
  if (pts.length < 2) return;
  const path = new THREE.CurvePath(); let prev = new THREE.Vector3(pts[0][0], 0.9, pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const b = new THREE.Vector3(pts[i][0], 0.8, pts[i][1]), segs = Math.max(2, Math.round(prev.distanceTo(b) / 0.5));
    for (let k = 1; k <= segs; k++) { const p = prev.clone().lerp(b, k / segs); if (k < segs) p.add(new THREE.Vector3(rr(-0.2, 0.2), rr(-0.15, 0.15), rr(-0.2, 0.2))); path.add(new THREE.LineCurve3(path.curves.length ? path.curves[path.curves.length - 1].v2 : prev.clone(), p)); }
    prev = b;
  }
  for (const [r, c, o] of [[0.035, 0xffffff, 1], [0.1, 0xc77dff, 0.45]]) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, path.curves.length * 2, r, 5), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.renderOrder = 9; fxMesh(m, 0.2);
  }
}
