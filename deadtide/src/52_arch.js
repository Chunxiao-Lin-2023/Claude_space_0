/* ================= architecture art: procedural textures, detailed walls, crowns, ruins =================
   Each wall material has its own look: wooden palisade (planks, battens, sharpened stakes on top), brick keep
   (running bond, concrete cap, battlements), steel bunker (riveted plates, hazard band, corner posts, spikes).
   The ruined town is plastered walls with peeling patches, window holes and broken tops. */
const ARCH = { tex: {}, I: {}, roofCells: new Set(), roofs: [] };
function archTex(w, h, seed, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  fn(g, mulberry(seed), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t;
}
// box-project UVs from position so split-up geometry (window walls, broken tops, merlons) shows one continuous texture
function worldUV(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k), nx = Math.abs(n.getX(k)), ny = Math.abs(n.getY(k)), nz = Math.abs(n.getZ(k));
    if (ny > 0.5) { uv[k * 2] = x + 0.5; uv[k * 2 + 1] = z + 0.5; }
    else if (nx > nz) { uv[k * 2] = z + 0.5; uv[k * 2 + 1] = y / FH; }
    else { uv[k * 2] = x + 0.5; uv[k * 2 + 1] = y / FH; }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
const hsl = (h, s, l, a) => `hsla(${h},${s}%,${l}%,${a == null ? 1 : a})`;
function speckle(g, r, w, h, n, dark, light) {
  for (let k = 0; k < n; k++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${dark})` : `rgba(255,245,220,${light})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}
function planks(g, r, x0, y0, w, h, n, vertical, hue, light) {
  const pw = (vertical ? w : h) / n;
  for (let k = 0; k < n; k++) {
    const l = light + (r() - 0.5) * 8, hu = hue + (r() - 0.5) * 6;
    g.fillStyle = hsl(hu, 38 + r() * 10, l);
    if (vertical) g.fillRect(x0 + k * pw, y0, pw, h); else g.fillRect(x0, y0 + k * pw, w, pw);
    g.strokeStyle = hsl(hu, 35, l - 9, 0.55); g.lineWidth = 1;
    for (let q = 0; q < 4; q++) { // grain
      g.beginPath();
      if (vertical) { let x = x0 + k * pw + 2 + r() * (pw - 4); g.moveTo(x, y0); for (let y = y0; y <= y0 + h; y += 12) { x += (r() - 0.5) * 1.6; g.lineTo(x, y); } }
      else { let y = y0 + k * pw + 2 + r() * (pw - 4); g.moveTo(x0, y); for (let x = x0; x <= x0 + w; x += 12) { y += (r() - 0.5) * 1.6; g.lineTo(x, y); } }
      g.stroke();
    }
    if (r() < 0.5) { g.fillStyle = hsl(hu, 40, l - 14, 0.8); const kx = vertical ? x0 + k * pw + pw / 2 : x0 + r() * w, ky = vertical ? y0 + r() * h : y0 + k * pw + pw / 2; g.beginPath(); g.ellipse(kx, ky, 2.5, 4, vertical ? 0 : Math.PI / 2, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.45)'; if (vertical) g.fillRect(x0 + k * pw, y0, 1.5, h); else g.fillRect(x0, y0 + k * pw, w, 1.5);
    g.fillStyle = 'rgba(255,230,190,.12)'; if (vertical) g.fillRect(x0 + k * pw + 1.5, y0, 1, h); else g.fillRect(x0, y0 + k * pw + 1.5, w, 1);
  }
}
function bricks(g, r, w, h, rows, mortar, hue, sat, light, sootBottom) {
  g.fillStyle = mortar; g.fillRect(0, 0, w, h);
  const bh = h / rows, bw = w / 3;
  for (let row = 0; row < rows; row++) for (let k = -1; k < 4; k++) {
    const x = k * bw + (row % 2 ? bw / 2 : 0), y = row * bh;
    let l = light + (r() - 0.5) * 9; if (r() < 0.08) l -= 10;
    g.fillStyle = hsl(hue + (r() - 0.5) * 8, sat + (r() - 0.5) * 12, l); g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    g.fillStyle = 'rgba(255,225,200,.10)'; g.fillRect(x + 1.5, y + 1.5, bw - 3, 2);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x + 1.5, y + bh - 3.5, bw - 3, 2);
    if (r() < 0.12) { g.fillStyle = mortar; g.beginPath(); g.moveTo(x + 2 + r() * (bw - 10), y + 1.5); g.lineTo(x + 8 + r() * 6, y + 1.5); g.lineTo(x + 5, y + 6); g.fill(); } // chip
  }
  if (sootBottom) { const gr = g.createLinearGradient(0, h * 0.7, 0, h); gr.addColorStop(0, 'rgba(20,14,10,0)'); gr.addColorStop(1, 'rgba(20,14,10,.55)'); g.fillStyle = gr; g.fillRect(0, h * 0.7, w, h * 0.3); }
}
function archTextures() {
  const T = ARCH.tex, WH = 168;
  // wooden palisade: vertical planks with two battens and nails
  const wood = (g, r, w, h, brace) => {
    planks(g, r, 0, 0, w, h, 5, true, 28, 34);
    if (brace) { // diagonal brace board
      g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.atan2(h * 0.62, w * 0.9)); g.fillStyle = hsl(26, 40, 26); g.fillRect(-w * 0.62, -7, w * 1.24, 14);
      g.fillStyle = 'rgba(255,230,190,.14)'; g.fillRect(-w * 0.62, -7, w * 1.24, 2); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w * 0.62, 5, w * 1.24, 2); g.restore();
    }
    for (const fy of [0.16, 0.8]) {
      const y = h * fy; g.fillStyle = hsl(25, 38, 24); g.fillRect(0, y - 7, w, 14);
      g.fillStyle = 'rgba(255,230,190,.16)'; g.fillRect(0, y - 7, w, 2); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, y + 5, w, 2);
      g.fillStyle = '#b9b2a6'; for (let k = 0; k < 5; k++) { g.fillRect(k * w / 5 + w / 10 - 1.5, y - 1.5, 3, 3); g.fillStyle = 'rgba(70,40,20,.5)'; g.fillRect(k * w / 5 + w / 10 - 1, y + 1.5, 2, 4); g.fillStyle = '#b9b2a6'; }
    }
    speckle(g, r, w, h, 160, 0.18, 0.06);
  };
  T.wood = archTex(128, WH, 11, (g, r, w, h) => wood(g, r, w, h, false));
  T.woodB = archTex(128, WH, 12, (g, r, w, h) => wood(g, r, w, h, true));
  // brick keep: running bond, soot at the foot
  T.brick = archTex(128, WH, 21, (g, r, w, h) => { bricks(g, r, w, h, 9, '#a89c8b', 12, 46, 36, true); speckle(g, r, w, h, 220, 0.2, 0.06); });
  // steel bunker: two riveted plates, rust streaks, hazard band
  T.steel = archTex(128, WH, 31, (g, r, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#7f909c'); gr.addColorStop(1, '#5d6c77'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 2; k++) {
      const x = k * w / 2; g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x + 3, 3, w / 2 - 6, 2); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + w / 2 - 2, 0, 2, h);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 22; y < h * 0.8; y += 22) g.fillRect(x + 6, y, w / 2 - 12, 1);
      for (let y = 8; y < h * 0.84; y += 18) for (const rx of [x + 6, x + w / 2 - 8]) {
        g.fillStyle = '#3c474f'; g.beginPath(); g.arc(rx, y, 2.2, 0, 7); g.fill(); g.fillStyle = 'rgba(230,240,248,.5)'; g.fillRect(rx - 1.2, y - 1.4, 1.2, 1.2);
        if (r() < 0.22) { const sg = g.createLinearGradient(0, y, 0, y + 30 + r() * 30); sg.addColorStop(0, 'rgba(140,72,30,.55)'); sg.addColorStop(1, 'rgba(140,72,30,0)'); g.fillStyle = sg; g.fillRect(rx - 1.5, y + 2, 3 + r() * 2, 50); }
      }
    }
    const by = h * 0.86; g.fillStyle = '#1f2326'; g.fillRect(0, by, w, h - by);
    g.save(); g.beginPath(); g.rect(0, by + 2, w, h - by - 4); g.clip(); g.fillStyle = '#e0b53a';
    for (let x = -h; x < w + h; x += 18) { g.beginPath(); g.moveTo(x, by + 2); g.lineTo(x + 9, by + 2); g.lineTo(x + 9 - (h - by), h); g.lineTo(x - (h - by), h); g.fill(); }
    g.restore(); speckle(g, r, w, h, 260, 0.22, 0.08);
  });
  // floors
  T.wfloor = archTex(128, 128, 41, (g, r, w, h) => { planks(g, r, 0, 0, w, h, 6, false, 27, 33); g.fillStyle = '#a8a196'; for (let k = 0; k < 6; k++) for (const x of [6, w - 8]) g.fillRect(x, k * h / 6 + h / 12 - 1, 2.5, 2.5); speckle(g, r, w, h, 140, 0.18, 0.06); });
  T.sfloor = archTex(128, 128, 42, (g, r, w, h) => {
    g.fillStyle = '#6a7884'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { g.save(); g.translate(x + 4, y + 4); g.rotate(Math.PI / 4 * ((x + y) % 32 ? 1 : -1)); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-5, -1.5, 10, 3); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-5, 1.5, 10, 1.2); g.restore(); }
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); speckle(g, r, w, h, 200, 0.2, 0.08);
  });
  // door leaf: three planks, Z brace, iron studs
  T.door = archTex(64, 96, 51, (g, r, w, h) => {
    planks(g, r, 0, 0, w, h, 3, true, 24, 26);
    g.fillStyle = hsl(22, 36, 19); g.fillRect(0, 12, w, 9); g.fillRect(0, h - 22, w, 9);
    g.save(); g.translate(w / 2, h / 2); g.rotate(Math.atan2(h - 40, w)); g.fillRect(-w * 0.85, -4.5, w * 1.7, 9); g.restore();
    g.fillStyle = '#2b2a28'; for (const y of [16, h - 18]) for (let x = 6; x < w; x += 13) { g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); }
    g.fillStyle = '#b0a080'; g.fillRect(w - 12, h / 2 - 2, 6, 4);
    speckle(g, r, w, h, 80, 0.2, 0.05);
  });
  // plaster for the ruined town (tinted per house): stains, soot, cracks and peeled patches showing brick
  const plaster = (g, r, w, h) => {
    g.fillStyle = '#ebe5d8'; g.fillRect(0, 0, w, h); speckle(g, r, w, h, 500, 0.08, 0.15);
    for (let k = 0; k < 12; k++) { const x = r() * w, sg = g.createLinearGradient(0, 0, 0, h * (0.3 + r() * 0.5)); sg.addColorStop(0, 'rgba(70,60,45,.32)'); sg.addColorStop(1, 'rgba(70,60,45,0)'); g.fillStyle = sg; g.fillRect(x, 0, 3 + r() * 8, h); }
    for (let k = 0; k < 3 + Math.floor(r() * 2); k++) { // peeled patch
      const cx = 18 + r() * (w - 36), cy = 24 + r() * (h - 60), rx = 9 + r() * 10, ry = 7 + r() * 9;
      g.save(); g.beginPath(); for (let a = 0; a < 6.3; a += 0.5) { const rr = 0.7 + r() * 0.5; g.lineTo(cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr); } g.closePath();
      g.fillStyle = 'rgba(60,40,30,.35)'; g.fill(); g.clip(); g.translate(cx - rx * 1.3, cy - ry * 1.3); bricks(g, r, rx * 2.6, ry * 2.6, 4, '#9c9082', 12, 40, 38, false); g.restore();
    }
    g.strokeStyle = 'rgba(40,32,26,.55)'; g.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { let x = r() * w, y = r() * h * 0.5; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 16; y += 6 + r() * 10; g.lineTo(x, y); } g.stroke(); }
    const gr = g.createLinearGradient(0, h * 0.65, 0, h); gr.addColorStop(0, 'rgba(30,24,18,0)'); gr.addColorStop(1, 'rgba(30,24,18,.5)'); g.fillStyle = gr; g.fillRect(0, h * 0.65, w, h * 0.35);
  };
  T.plasterA = archTex(384, WH, 61, plaster); T.plasterB = archTex(384, WH, 62, plaster);
}
function archGeo() {
  const G = ARCH.G = {}, h = FH;
  G.wall = boxG(1, h, 1, 0, h / 2, 0);
  G.trimWood = merge([boxG(1.05, 0.08, 1.05, 0, h - 0.04, 0), boxG(1.05, 0.1, 1.05, 0, 0.05, 0)]);
  G.trimBrick = merge([boxG(1.08, 0.1, 1.08, 0, h + 0.03, 0), boxG(1.05, 0.12, 1.05, 0, 0.06, 0)]);
  const sp = [boxG(1.06, 0.07, 1.06, 0, h - 0.02, 0)]; for (const [a, b] of [[-0.49, -0.49], [0.49, -0.49], [-0.49, 0.49], [0.49, 0.49]]) sp.push(boxG(0.09, h, 0.09, a, h / 2, b));
  G.trimSteel = merge(sp);
  G.merlon = worldUV(boxG(0.6, 0.44, 0.6, 0, h + 0.08 + 0.22, 0));
  const st = []; for (const x of [-0.33, 0, 0.33]) { st.push(boxG(0.16, 0.22, 0.16, x, h + 0.11, 0)); st.push(new THREE.ConeGeometry(0.115, 0.26, 4).rotateY(Math.PI / 4).translate(x, h + 0.35, 0)); }
  G.stakes = merge(st);
  const sk = [boxG(1, 0.05, 0.06, 0, h + 0.1, 0)]; for (const x of [-0.375, -0.125, 0.125, 0.375]) { sk.push(boxG(0.035, 0.12, 0.035, x, h + 0.06, 0)); sk.push(new THREE.ConeGeometry(0.04, 0.2, 4).translate(x, h + 0.22, 0)); }
  G.spikes = merge(sk);
  G.slab = boxG(1, 0.14, 1, 0, -0.07, 0);
  G.joist = merge([boxG(1, 0.1, 0.1, 0, -0.19, -0.42), boxG(1, 0.1, 0.1, 0, -0.19, 0.42)]);
  // sandbags under the shooting bars + iron frame and bars
  const sb = []; for (let row = 0; row < 2; row++) for (let k = 0; k < 3; k++) { const g = new THREE.SphereGeometry(0.5, 8, 4); g.scale(0.33, 0.13, 0.42); g.translate(-0.33 + k * 0.33 + (row ? 0.16 : 0) - (row && k === 2 ? 0.66 : 0), 0.12 + row * 0.22, 0); sb.push(g); }
  G.sand = merge(sb);
  const br = [boxG(1, 0.1, 0.22, 0, h - 0.05, 0), boxG(0.1, h * 0.62, 0.2, -0.45, h * 0.66, 0), boxG(0.1, h * 0.62, 0.2, 0.45, h * 0.66, 0), boxG(1, 0.06, 0.18, 0, h * 0.4, 0)];
  for (let k = 0; k < 5; k++) br.push(new THREE.CylinderGeometry(0.025, 0.025, h * 0.56, 5).translate(-0.3 + k * 0.15, h * 0.68, 0));
  G.bars = merge(br);
  G.doorFrame = merge([boxG(1, h * 0.2, 1, 0, h * 0.9, 0), boxG(0.14, h * 0.8, 1, -0.43, h * 0.4, 0), boxG(0.14, h * 0.8, 1, 0.43, h * 0.4, 0)]);
  G.doorLeaf = boxG(0.72, h * 0.78, 0.14, 0, h * 0.39, 0);
  const sst = []; for (let k = 0; k < 5; k++) sst.push(boxG(0.2, h * (k + 1) / 5, 1, -0.4 + k * 0.2, h * (k + 1) / 10, 0));
  G.stairs = merge(sst);
  // wire: posts at both ends
  G.wirePosts = merge([boxG(0.06, 0.5, 0.06, -0.48, 0.25, 0).rotateX(0.25), boxG(0.06, 0.5, 0.06, -0.48, 0.25, 0).rotateX(-0.25), boxG(0.06, 0.5, 0.06, 0.48, 0.25, 0).rotateX(0.25), boxG(0.06, 0.5, 0.06, 0.48, 0.25, 0).rotateX(-0.25)]);
  // ruins: window wall, broken stepped top, full with cornice, low stub
  G.ruin = [
    merge([boxG(1, h * 0.36, 1, 0, h * 0.18, 0), boxG(0.28, h * 0.42, 1, -0.36, h * 0.57, 0), boxG(0.28, h * 0.42, 1, 0.36, h * 0.57, 0), boxG(1, h * 0.22, 1, 0, h * 0.89, 0), boxG(0.56, 0.05, 1.1, 0, h * 0.37, 0)]),
    merge([boxG(1, h * 0.5, 1, 0, h * 0.25, 0), boxG(0.55, h * 0.3, 1, -0.225, h * 0.65, 0), boxG(0.25, h * 0.18, 1, -0.375, h * 0.89, 0), boxG(0.18, h * 0.12, 0.6, 0.25, h * 0.56, 0.1)]),
    merge([boxG(1, h, 1, 0, h / 2, 0), boxG(1.08, 0.09, 1.08, 0, h * 0.97, 0)]),
    merge([boxG(1, h * 0.32, 1, 0, h * 0.16, 0), boxG(0.4, h * 0.16, 0.5, 0.1, h * 0.4, -0.1).rotateY(0.3)]),
  ].map(worldUV);
}
// called from buildScene: textured instanced pools for walls, floors, trims and ruins
function archScene() {
  archTextures(); archGeo();
  const T = ARCH.tex, G = ARCH.G, I = ARCH.I, tm = (t, o) => new THREE.MeshLambertMaterial(Object.assign({ map: t, color: '#ffffff' }, o || {}));
  I.wood = inst(G.wall, tm(T.wood), 3000); I.woodB = inst(G.wall, tm(T.woodB), 3000);
  I.brick = inst(G.wall, tm(T.brick), 3000); I.steel = inst(G.wall, tm(T.steel), 3000);
  I.tWood = inst(G.trimWood, lam('#4b3020'), 6000); I.tBrick = inst(G.trimBrick, lam('#77726a'), 3000); I.tSteel = inst(G.trimSteel, lam('#3b454d'), 3000);
  I.merlon = inst(G.merlon, tm(T.brick), 2000); I.stakes = inst(G.stakes, lam('#7a5332'), 2000); I.spikes = inst(G.spikes, lam('#4a545c'), 2000);
  I.wfloor = inst(G.slab, tm(T.wfloor), 4000); I.sfloor = inst(G.slab, tm(T.sfloor), 4000); I.joist = inst(G.joist, lam('#3e2a1a'), 4000);
  I.sand = inst(G.sand, lam('#b4a273'), 600); I.bars = inst(G.bars, lam('#3a434b'), 600);
  I.doorF = inst(G.doorFrame, lam('#4a3220'), 400); I.doorL = inst(G.doorLeaf, tm(T.door), 400);
  I.stairs = inst(G.stairs, tm(T.wfloor), 400);
  I.wireP = inst(G.wirePosts, lam('#5a4630'), 600);
  // the plaster spans three cells; each instance reads the slice for its own position so walls don't repeat cell by cell
  const wide = m => { m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_INSTANCING\nvMapUv.x = (vMapUv.x + instanceMatrix[3].x + instanceMatrix[3].z) / 3.0;\n#endif'); }; m.customProgramCacheKey = () => 'wide3'; return m; };
  I.ruin = G.ruin.map((g, k) => inst(g, wide(tm(k % 2 ? T.plasterB : T.plasterA)), 900));
}
const PLASTER = ['#e6cf96', '#a9c3cf', '#e2ae92', '#bfcf9e', '#d9b8b0', '#c8c2b0'];
const ARC = {};
function archBegin() { for (const k in ARCH.I) { if (Array.isArray(ARCH.I[k])) ARCH.I[k].forEach((m, j) => ARC[k + j] = 0); else ARC[k] = 0; } }
function archPut(key, x, y, z, rot, sx, sy, sz, col) { const m = key.length > 4 && /\d$/.test(key) && key.startsWith('ruin') ? ARCH.I.ruin[+key.slice(4)] : ARCH.I[key]; setInst(m, ARC[key]++, x, y, z, rot, sx, sy, sz, col); }
function archEnd() { for (const k in ARCH.I) { const arr = Array.isArray(ARCH.I[k]) ? ARCH.I[k] : [ARCH.I[k]]; arr.forEach((m, j) => { m.count = Array.isArray(ARCH.I[k]) ? ARC[k + j] : ARC[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }); } }
// one wall / ruin / floor cell. Returns true if it handled the block.
function archWall(b, i, x, y, L, X, Y, Z, h, cut, vl) {
  const f = W.bhp[i] / (B[b].hp || 1), tint = dmgTint('#ffffff', f);
  const up = L + 1 < ML ? ci(x, y, L + 1) : -1, open = up < 0 || (!W.blk[up] && !W.slab[up]);
  const crown = open && cut === 1, ax = wallAxis(x, y, L) ? Math.PI / 2 : 0;
  if (b === 1) {
    archPut(h < 0.35 ? 'woodB' : 'wood', X, Y, Z, 0, 1, cut, 1, tint); archPut('tWood', X, Y, Z, 0, 1, cut, 1, dmgTint('#ffffff', 0.6 + f * 0.4));
    if (crown) archPut('stakes', X, Y, Z, ax, 1, 1, 1, dmgTint('#ffffff', 0.6 + f * 0.4));
  } else if (b === 2) {
    archPut('brick', X, Y, Z, 0, 1, cut, 1, tint); archPut('tBrick', X, Y, Z, 0, 1, cut, 1);
    if (crown && (x + y + L) % 2 === 0) archPut('merlon', X, Y, Z, 0, 1, 1, 1, tint);
  } else if (b === 3) {
    archPut('steel', X, Y, Z, 0, 1, cut, 1, tint); archPut('tSteel', X, Y, Z, 0, 1, cut, 1);
    if (crown) archPut('spikes', X, Y, Z, ax, 1, 1, 1);
  } else if (b === 24) {
    let v = h < 0.28 ? 0 : h < 0.58 ? 1 : h < 0.84 ? 2 : 3; if (L === 0 && ARCH.roofCells.has(x + ',' + y)) v = h < 0.4 ? 0 : 2;
    const rot = (v === 0 ? ax : 0) + (v === 1 && hash2(x, y * 3) < 0.5 ? Math.PI : 0) + (v === 1 ? ax : 0);
    const hk = houseOf(x, y), col = PLASTER[hk >= 0 ? (hk * 2 + 1) % PLASTER.length : Math.floor(hash2(x >> 3, y >> 3) * PLASTER.length)];
    archPut('ruin' + v, X, Y, Z, rot, 1, 1, 1, dmgTint(col, f));
  } else return false;
  return true;
}
function archSlab(s, i, x, y, L, X, Y, Z) {
  if (s !== 4 && s !== 5) return false;
  const f = W.shp[i] / B[s].hp;
  archPut(s === 4 ? 'wfloor' : 'sfloor', X, Y, Z, 0, 1, 1, 1, dmgTint('#ffffff', f));
  // joists under the floor where nothing holds it from below
  const below = L > 0 ? W.blk[ci(x, y, L - 1)] : 1;
  if (L > 0 && !below) archPut('joist', X, Y, Z, (x + y) % 2 ? 0 : Math.PI / 2, 1, 1, 1);
  return true;
}

/* ---------- ruined town: house colours, broken tiled roofs over one end of each house, fallen beams ---------- */
function houseOf(x, y) { for (let k = 0; k < TOWN_HOUSES.length; k++) { const [x0, y0, x1, y1] = TOWN_HOUSES[k]; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return k; } return -1; }
// roof cells must be known before the first cell rebuild (they decide the wall variant)
for (let k = 0; k < TOWN_HOUSES.length; k++) {
  const [x0, y0, x1, y1] = TOWN_HOUSES[k], west = hash2(k, 77) < 0.5, xa = west ? x0 : x1 - 2, xb = xa + 2;
  for (let x = xa; x <= xb; x++) for (let y = y0; y <= y1; y++) if (y === y0 || y === y1 || x === (west ? x0 : x1)) ARCH.roofCells.add(x + ',' + y);
}
function tileTex() {
  return archTex(128, 128, 71, (g, r, w, h) => {
    g.fillStyle = '#5a2a1c'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let k = -1; k < 9; k++) {
      const x = k * 16 + (row % 2 ? 8 : 0), y = row * 16;
      if (r() < 0.04) { g.fillStyle = '#1c1410'; g.fillRect(x, y, 16, 16); continue; }
      g.fillStyle = hsl(12 + (r() - 0.5) * 10, 48 + r() * 12, 34 + (r() - 0.5) * 10);
      g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 15, y); g.lineTo(x + 15, y + 11); g.quadraticCurveTo(x + 8, y + 17, x + 1, y + 11); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,220,190,.14)'; g.fillRect(x + 2, y + 1, 3, 9);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + 12, 16, 3);
      if (r() < 0.07) { g.fillStyle = 'rgba(90,110,50,.55)'; g.beginPath(); g.arc(x + 4 + r() * 8, y + 4 + r() * 8, 3 + r() * 4, 0, 7); g.fill(); }
    }
    speckle(g, r, w, h, 200, 0.2, 0.06);
  });
}
function archTown() {
  for (const R of ARCH.roofs) SCN.remove(R.g);
  ARCH.roofs = [];
  if (!ARCH.tex.tile) ARCH.tex.tile = tileTex();
  const tileM = new THREE.MeshLambertMaterial({ map: ARCH.tex.tile, side: THREE.DoubleSide }), dark = lam('#2c231c');
  TOWN_HOUSES.forEach(([x0, y0, x1, y1], k) => {
    const r = mulberry(k * 977 + 13), west = hash2(k, 77) < 0.5, xa = west ? x0 : x1 - 2, xb = xa + 3, g = new THREE.Group();
    const S = y1 - y0 + 1, zc = (y0 + y1 + 1) / 2, Ye = FH + 0.02, Rz = S * 0.3, Yr = Ye + Rz, oh = 0.18;
    // roof planes as strips: whole near the gable end, ragged toward the open end of the house
    const pos = [], uv = [], slopeLen = Math.hypot(Rz + 0.1, S / 2 + oh);
    for (const s of [-1, 1]) for (let q = 0; q < 6; q++) {
      const xs = (west ? xa - oh : xa) + q * 0.5 + (west ? 0 : 0), xe2 = Math.min(xs + 0.5, west ? xb : xb + oh);
      const fromGable = west ? q : 5 - q; let t1 = 1;
      if (fromGable >= 3) { const u = r(); if (u < 0.3) continue; t1 = 0.35 + u * 0.6; }
      const P = (x, t) => [x, Yr + t * (Ye - 0.1 - Yr), zc + t * s * (S / 2 + oh)];
      const a = P(xs, 0), b = P(xe2, 0), c = P(xe2, t1), d = P(xs, t1);
      for (const v of [a, b, c, a, c, d]) pos.push(...v);
      const U = (p, t) => [p * 1.6, t * slopeLen * 1.6];
      for (const v of [U(xs, 0), U(xe2, 0), U(xe2, t1), U(xs, 0), U(xe2, t1), U(xs, t1)]) uv.push(...v);
    }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.computeVertexNormals();
    const roof = new THREE.Mesh(rg, tileM); roof.castShadow = roof.receiveShadow = true; g.add(roof);
    const gx = west ? xa - 0.02 : xb + 0.02, gl = west ? xb - xa + oh : xb - xa + oh;
    const ridge = new THREE.Mesh(boxG(gl * (west ? 0.62 : 0.62), 0.12, 0.14), dark); ridge.position.set(west ? xa - oh + gl * 0.31 : xb + oh - gl * 0.31, Yr + 0.03, zc); ridge.castShadow = true; g.add(ridge);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(boxG(gl, 0.1, 0.06), dark); f.position.set((xa + xb) / 2 + (west ? -oh / 2 : oh / 2), Ye - 0.12, zc + s * (S / 2 + oh)); g.add(f); }
    // gable triangle in the house's plaster
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute([gx, Ye, y0, gx, Ye, y1 + 1, gx, Yr, zc], 3));
    tg.setAttribute('uv', new THREE.Float32BufferAttribute([0, Ye / FH, S, Ye / FH, S / 2, Yr / FH], 2)); tg.computeVertexNormals();
    const gm = new THREE.MeshLambertMaterial({ map: ARCH.tex.plasterA, side: THREE.DoubleSide, color: PLASTER[(k * 2 + 1) % PLASTER.length] });
    const gable = new THREE.Mesh(tg, gm); gable.castShadow = true; g.add(gable);
    // a few charred beams fallen into the open part of the house
    for (let n = 0; n < 3; n++) {
      const len = 1.6 + r() * 1.6, bm = new THREE.Mesh(boxG(len, 0.13, 0.13), lam('#2e2620'));
      const bx = west ? xb + 0.5 + r() * (x1 - xb - 0.5) : x0 + 1 + r() * (xa - x0 - 1), by = y0 + 1.2 + r() * (S - 2.4);
      bm.position.set(bx, 0.1 + r() * 0.35, by); bm.rotation.set(0, r() * Math.PI, (r() - 0.5) * 0.5); bm.castShadow = true; g.add(bm);
    }
    SCN.add(g);
    const sup = []; for (const c of ARCH.roofCells) { const [cx, cy] = c.split(',').map(Number); if (cx >= xa && cx <= xb - 1 + (west ? 0 : 1) && cy >= y0 && cy <= y1) sup.push(ci(cx, cy, 0)); }
    ARCH.roofs.push({ g, roof: [roof, ridge, gable, ...g.children.filter(m => m.geometry && m.geometry.parameters && m.geometry.parameters.width === gl)], rect: [x0, y0, x1 + 1, y1 + 1], sup, down: false });
  });
}
// per frame: lift the roof off a house the local player is inside; drop it for good once its walls are mostly gone
function archFrame() {
  if (!W) return; const me = W.p[ME];
  for (const R of ARCH.roofs) {
    if (!R.down && W.t - (R.chk || -9) > 1) { R.chk = W.t; let n = 0; for (const i of R.sup) if (W.blk[i] === 24) n++; if (n < R.sup.length * 0.5) R.down = true; }
    const inside = me && !me.dead && me.x >= R.rect[0] && me.x <= R.rect[2] && me.y >= R.rect[1] && me.y <= R.rect[3];
    for (const m of R.roof) m.visible = !R.down && !inside;
  }
}
