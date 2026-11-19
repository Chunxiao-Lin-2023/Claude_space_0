// Round 3: props/searchables + daily restock, new zombie types, new weapons + effects, vault/jump, ladders, obstacles, build confirmation.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!cond) fails++; };
  const c = await b.newContext({ viewport: { width: 1280, height: 760 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; W.res.wood = W.res.stone = W.res.steel = W.res.parts = 999; });
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  // props on the map
  const pc = await p.evaluate(() => { const c = {}; for (let i = 0; i < NC; i++) { const k = B[W.blk[i]].key; if ([32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 25, 26, 29].includes(W.blk[i])) c[k] = (c[k] || 0) + 1; } return c; });
  ok('every searchable / gatherable type is on the map', Object.keys(pc).length >= 13, JSON.stringify(pc));
  ok('town spread out', await p.evaluate(() => TOWN_HOUSES.length) <= 18);
  // search a crate: it vanishes; car: marked; dawn restocks
  const SPOTS_N_CRATE = 16; const BAL_SEARCH = 3;
  const sr = await p.evaluate(() => {
    const me = W.p[0]; let ci0 = -1, car = -1; for (let i = 0; i < NC; i++) { if (ci0 < 0 && W.blk[i] === 26) ci0 = i; if (car < 0 && W.blk[i] === 25) car = i; }
    const n0 = spotCount().crate; completeUse(me, { k: 'spot', i: ci0 }); const gone = W.blk[ci0] === 0;
    completeUse(me, { k: 'spot', i: car }); const marked = W.srch.has(car) && W.blk[car] === 25; const again = useTarget; 
    let left = 0; for (let i = 0; i < NC; i++) if (W.blk[i] === 26 && left++ > 4) W.blk[i] = 0; const n0b = spotCount().crate;
    W.night = 1; W.phase = 'night'; W.zs.length = 0; W.spawnQ = []; W.nightT = 999; dawn(); return { gone, marked, n0: n0b, n1: spotCount().crate, carStill: W.srch.has(car) };
  });
  ok('crate vanishes when searched, car is marked searched', sr.gone && sr.marked, JSON.stringify(sr));
  ok('dawn restocks crates', sr.n0 <= 5 && sr.n1 >= SPOTS_N_CRATE, JSON.stringify(sr));
  // weapons
  const wr = await p.evaluate(() => {
    const me = W.p[0]; W.zs.length = 0; me.x = W.radio.x + 0.5; me.y = W.radio.y + 6.5; me.L = 0; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 99); me.mag = WPN.map(w => w.mag);
    const R = {};
    const fireAt = (wi, z) => { me.wpn = wi; me.aimPt = { x: z.x, y: z.y, z: z.z + 0.6 }; me.fireCD = 0; fireWeapon(me, wi); };
    const mk = (k, dx, face) => { const z = spawnZombie(k, 0); z.x = me.x + dx; z.y = me.y; z.L = 0; z.z = 0; z.face = face == null ? Math.PI : face; z.stun = 0; return z; };
    let z = mk('walker', 3); fireAt(5, z); R.burn = z.burn > 0;
    z = mk('walker', 4); fireAt(4, z); R.pin = z.stun > 0.5;
    z = mk('walker', 2); fireAt(1, z); R.sgStun = z.stun > 0.1;
    let a = mk('armored', 5, Math.PI), h0 = a.hp; me.wpn = 0; fireAt(0, a); R.armorFront = (h0 - a.hp) / WPN[0].dmg;
    a.face = 0; h0 = a.hp; fireAt(0, a); R.armorBack = (h0 - a.hp) / WPN[0].dmg;
    a.hp = a.max = 9999; h0 = a.hp; a.face = Math.PI; fireAt(3, a); R.armorSniper = (h0 - a.hp) / WPN[3].dmg;
    W.zs.length = 0; z = mk('walker', 6); fireAt(6, z); R.glProj = W.proj.some(b => b.k === 'gl');
    return R;
  });
  await simWait(1.2);
  const glKill = await p.evaluate(() => W.zs.filter(z => z.k === 'walker').length === 0 || W.zs[0].hp < W.zs[0].max * 0.5);
  ok('flamer sets fire', wr.burn); ok('crossbow pins', wr.pin); ok('shotgun staggers', wr.sgStun);
  ok('riot armour: front blocks, back/sniper get through', wr.armorFront < 0.5 && wr.armorBack > 0.9 && wr.armorSniper > 0.9, JSON.stringify(wr));
  ok('launcher shell flies and explodes', wr.glProj && glKill);
  // new zombies: bloater blast breaks walls, screamer enrages
  const zr = await p.evaluate(() => {
    const me = W.p[0]; W.zs.length = 0; W.proj.length = 0; const X = me.x + 4 | 0, Y = me.y | 0;
    W.blk[ci(X + 1, Y, 0)] = 1; W.bhp[ci(X + 1, Y, 0)] = 140; W.ver++;
    const bz = spawnZombie('bloater', 0); bz.x = X + 0.5; bz.y = Y + 0.5; bz.L = 0; bz.z = 0; killZombie(bz, me);
    const wallHp = W.bhp[ci(X + 1, Y, 0)], wallGone = W.blk[ci(X + 1, Y, 0)] !== 1;
    const s = spawnZombie('screamer', 0); s.x = me.x + 3; s.y = me.y + 2.5; s.L = 0; s.z = 0; s.scrT = 0;
    const w = spawnZombie('walker', 0); w.x = me.x + 4; w.y = me.y + 3.5; w.L = 0; w.z = 0;
    return { wallHp, wallGone };
  });
  await simWait(0.5);
  const rage = await p.evaluate(() => W.zs.some(z => z.rage > 0));
  ok('bloater burst damages walls', zr.wallGone || zr.wallHp < 140, JSON.stringify(zr));
  ok('screamer enrages nearby zombies', rage);
  // vault over a sandbag wall, leap a gap, hop
  const vr = await p.evaluate(() => {
    const me = W.p[0]; W.zs.length = 0; me.build = false; const X = W.radio.x + 10, Y = W.radio.y + 10;
    for (let x = X - 2; x <= X + 4; x++) for (let l = 0; l < 3; l++) { W.blk[ci(x, Y, l)] = 0; W.slab[ci(x, Y, l)] = 0; }
    W.blk[ci(X + 1, Y, 0)] = 12; W.bhp[ci(X + 1, Y, 0)] = 260; W.ver++;
    me.x = X + 0.5; me.y = Y + 0.5; me.L = 0; me.jmp = null; const r = { t: jumpTarget(me, 1, 0) };
    startJump(me, 1, 0, true); for (let k = 0; k < 40; k++) stepMove(me, 1 / 60); r.x = me.x; r.L = me.L;
    return r;
  });
  ok('vault over sandbags', vr.t && vr.x > vr.t.x - 0.3, JSON.stringify(vr));
  const auto = await p.evaluate(() => { const me = W.p[0]; const X = Math.floor(me.x); me.x = X + 0.5; me.inp.mx = -1; me.inp.my = 0; for (let k = 0; k < 70; k++) stepMove(me, 1 / 60); me.inp.mx = 0; return Math.floor(me.x) - X; });
  ok('pushing into it vaults back over automatically', auto <= -2, 'moved ' + auto);
  // ladders slow zombies; traps hold them
  const lr = await p.evaluate(() => {
    const L1 = B[W.blk[ci(W.radio.x + 1, W.radio.y - 4, 0)]], L2 = B[W.blk[ci(W.radio.x + 1, W.radio.y + 4, 0)]];
    const me = W.p[0], X = W.radio.x + 12, Y = W.radio.y + 14; W.blk[ci(X, Y, 0)] = 15; W.bhp[ci(X, Y, 0)] = 40; W.ver++;
    const z = spawnZombie('walker', 0); z.x = X + 0.5; z.y = Y + 0.5; z.L = 0; z.z = 0; stepZombies(1 / 60);
    return { ladders: L1.name + ',' + L2.name, stun: z.stun, trapGone: W.blk[ci(X, Y, 0)] !== 15 };
  });
  ok('starter house has two ladders', lr.ladders === '爬梯,爬梯', lr.ladders);
  ok('bear trap holds a zombie and breaks', lr.stun > 2 && lr.trapGone, JSON.stringify(lr));
  // one tap searches to the end without holding
  const tapI = await p.evaluate(() => { const me = W.p[0]; me.build = false; W.zs.length = 0; for (let i = 0; i < NC; i++) { if (W.blk[i] !== 26) continue; const x = cx_(i), y = cy_(i), L = cl_(i); const f = DIRS.map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => standable(a, b, L, 'p')); if (!f) continue; me.x = f[0] + 0.5; me.y = f[1] + 0.5; me.L = L; me.z = pZ(me); const t = useTarget(me); if (t && t.i === i) { INP.useReq = true; return i; } } return -1; });
  await simWait(BAL_SEARCH);
  ok('one tap finishes a search', tapI >= 0 && await p.evaluate(i => W.blk[i] !== 26, tapI), 'crate ' + tapI);
  // houses: several storeys, ladders all hang on walls
  const hs = await p.evaluate(() => {
    let maxSt = 0, lad = 0, flush = 0, ok2 = 0;
    for (const [x0, y0, x1, y1, st] of TOWN_HOUSES) maxSt = Math.max(maxSt, st);
    for (let i = 0; i < NC; i++) if (W.blk[i] === 6) { lad++; const x = cx_(i), y = cy_(i), L = cl_(i), [dx, dy] = DIRS[W.bdir[i]], f = blkAt(x + dx, y + dy, L); if (B[f].top && (B[f].P || B[f].Z)) flush++; if (standable(x + dx, y + dy, L + 1, 'p')) ok2++; }
    return { maxSt, lad, flush, ok2, size: TOWN_HOUSES.map(h => (h[2] - h[0] + 1) + 'x' + (h[3] - h[1] + 1) + '/' + h[4]).join(' ') };
  });
  ok('town has 3-4 storey blocks and every ladder hangs on a wall with somewhere to step off', hs.maxSt >= 4 && hs.lad >= 20 && hs.flush === hs.lad && hs.ok2 === hs.lad, JSON.stringify(hs));
  const ld = await p.evaluate(() => { const me = W.p[0], X = W.radio.x + 12, Y = W.radio.y + 5; for (let x = X - 1; x <= X + 2; x++) for (let y = Y - 1; y <= Y + 1; y++) for (let l = 0; l < 2; l++) { W.blk[ci(x, y, l)] = 0; W.slab[ci(x, y, l)] = 0; } W.blk[ci(X + 1, Y, 0)] = 2; W.bhp[ci(X + 1, Y, 0)] = 340; W.ver++; recomputeStab();
    me.x = X - 1.5; me.y = Y + 0.5; me.L = 0; me.sel = 6; me.sdir = 3; const why = buildWhy(me, X, Y, 0), dir = me.sdir, lonely = canPlace(X - 1, Y - 1, 0, 6, 0); return { why, dir, lonely }; });
  ok('ladders turn to face the wall next to them; none in open floor', ld.why === '' && ld.dir === 0 && ld.lonely !== '', JSON.stringify(ld));
  // build confirmation
  const bc = await p.evaluate(() => {
    const me = W.p[0], X = W.radio.x + 7, Y = W.radio.y + 3; me.x = X - 1.5; me.y = Y + 1.5; me.L = 0; me.build = true; me.demo = false; me.sel = 2; SET.bconf = 1;
    for (let x = X - 1; x <= X + 6; x++) for (let y = Y - 1; y <= Y + 1; y++) { W.blk[ci(x, y, 0)] = 0; } W.ver++; recomputeStab();
    CAM.tx = me.x; CAM.ty = me.y; updateCamera(1); updateCamera(1);
    const a = w2s(X + 0.5, Y + 0.5, 0.02), e = w2s(X + 3.5, Y + 0.6, 0.02);
    paintBuild(a[0], a[1], true, false); for (let k = 1; k <= 4; k++) paintBuild(a[0] + (e[0] - a[0]) * k / 4, a[1] + (e[1] - a[1]) * k / 4, false, false); finishPaint();
    const planned = PLAN ? PLAN.cells.length : 0, built0 = W.blk[ci(X, Y, 0)];
    const bar = !document.getElementById('bconf').classList.contains('hidden');
    confirmPlan(); return { planned, built0, bar };
  });
  await simWait(0.3);
  const built = await p.evaluate(() => { const X = W.radio.x + 7, Y = W.radio.y + 3; let n = 0; for (let x = X; x <= X + 3; x++) if (W.blk[ci(x, Y, 0)] === 2) n++; return n; });
  ok('drag makes a plan, nothing built yet, confirm bar shows', bc.planned === 4 && bc.built0 === 0 && bc.bar, JSON.stringify(bc));
  ok('confirm builds the row', built === 4, 'built ' + built);
  // screenshots: new zombies + props
  await p.evaluate(() => {
    const me = W.p[0]; me.build = false; W.zs.length = 0; me.x = W.radio.x + 0.5; me.y = W.radio.y + 8.5; me.L = 0; me.owned = WPN.map(() => 1); me.wpn = 3;
    window.__sz = stepZombies; stepZombies = () => { for (const z of W.zs) { z.x += Math.cos(z.face) * 0.003; z.y += Math.sin(z.face) * 0.003; } };
    ['dog', 'dog', 'crawler', 'bloater', 'screamer', 'armored', 'walker', 'runner'].forEach((k, j) => { const z = spawnZombie(k, 0); z.x = me.x - 2 + (j % 4) * 1.2; z.y = me.y - 1.6 - (j < 4 ? 0 : 1.3); z.L = 0; z.z = 0; z.face = Math.PI / 2; z.seed = j * 3; if (k === 'screamer') z.scr = 9; if (j === 6) z.burn = 9; });
    const X = me.x + 1, Y = me.y + 1;[32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 12, 13, 14, 15].forEach((id, k) => { const x = X + (k % 7), y = Y + Math.floor(k / 7) * 1.5 | 0; W.blk[ci(x | 0, y, 0)] = id; W.bhp[ci(x | 0, y, 0)] = B[id].hp || 1; }); W.ver++;
    CAM.zoom = 3.4; window.__dbg.dark = 0;
  });
  await p.waitForTimeout(1200); await p.screenshot({ path: OUT + '/r3_lineup.png' });
  await p.evaluate(() => { window.__dbg.dark = 1; }); await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/r3_night.png' });
  await p.evaluate(() => { stepZombies = window.__sz; W.zs.length = 0; window.__dbg.dark = 0; const me = W.p[0]; me.x = 80.5; me.y = 92.5; CAM.zoom = 15; });
  await p.waitForTimeout(1500); await p.screenshot({ path: OUT + '/r3_town.png' });
  ok('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  await b.close();
})();
