// Single-player smoke: title -> solo -> gather/search/build/craft -> night fight -> screenshots. Serve out/ on :8766.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  // the software GPU in CI renders ~2 fps: simulate with drawing off, render only for screenshots
  const shot = async (n) => { await p.evaluate(() => { window.__dbg.skipDraw = false; window.__dbg.speed0 = window.__dbg.speed; window.__dbg.speed = 0; }); await p.waitForTimeout(2600); await p.screenshot({ path: OUT + '/' + n + '.png' }); await p.evaluate(() => { window.__dbg.skipDraw = true; window.__dbg.speed = window.__dbg.speed0; }); await p.waitForTimeout(300); };
  await shot('01_title');
  await p.click('#soloBtn'); await p.evaluate(() => { window.__dbg.skipDraw = true; }); await p.waitForFunction(() => W && W.t > 1, null, { timeout: 90000 });
  await shot('02_day');
  const r = await p.evaluate(async () => {
    const me = W.p[0], o = {}; const until = sec => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= sec ? r() : setTimeout(f, 30); f(); });
    o.start = [me.x, me.y, me.L].join(',');
    o.edges = [0, 1, 2, 3].map(s => W.edges[s].length).join(',');
    o.rfield = W.ff.rw[ci(1, 1, gAt(1, 1))];
    // walk north for 1s
    const y0 = me.y; INP.keys.w = true; await until(0.9); INP.keys.w = false; o.walked = (me.y - y0).toFixed(2) + ' x ' + me.x.toFixed(2);
    // gather the nearest tree
    let ti = -1, bd = 1e9; for (let i = 0; i < NC; i++) if (W.blk[i] === 22) { const d = Math.hypot(cx_(i) - 32, cy_(i) - 28); if (d < bd) { bd = d; ti = i; } }
    const tx = cx_(ti), ty = cy_(ti), tl = cl_(ti);
    const free = DIRS.map(([dx, dy]) => [tx + dx, ty + dy]).find(([x, y]) => standable(x, y, tl, 'p'));
    me.x = free[0] + 0.5; me.y = free[1] + 0.5; me.L = tl; const w0 = W.res.wood; INP.keys.f = true; await until(2.0); INP.keys.f = false;
    o.chop = (W.res.wood - w0) + ' tree gone ' + (W.blk[ti] === 0);
    // search a car
    const car = W.spots.find(s => s.k === 'car'); const cx = cx_(car.i), cy = cy_(car.i), cl = cl_(car.i);
    const f2 = DIRS.map(([dx, dy]) => [cx + dx, cy + dy]).find(([x, y]) => standable(x, y, cl, 'p'));
    me.x = f2[0] + 0.5; me.y = f2[1] + 0.5; me.L = cl; INP.keys.f = true; await until(1.8); INP.keys.f = false;
    o.car = car.searched + ' ' + JSON.stringify(W.res);
    // build outside the fort: walls + floor above + stairs
    me.x = 37.5; me.y = 28.5; me.L = 0; W.res.wood += 200; W.res.stone += 100; W.res.steel += 100;
    doBuild(me, 38, 27, 0, 1); doBuild(me, 38, 28, 0, 2); doBuild(me, 38, 29, 0, 1); doBuild(me, 38, 28, 1, 4); doBuild(me, 37, 28, 1, 4); doBuild(me, 36, 26, 0, 6, 3);
    o.built = [W.blk[ci(38, 27, 0)], W.blk[ci(38, 28, 0)], W.slab[ci(38, 28, 1)], W.slab[ci(37, 28, 1)], W.blk[ci(36, 26, 0)]].join(',');
    o.float = canPlace(40, 20, 3, 1);
    doDemolish(me, 38, 28, 0); doDemolish(me, 38, 27, 0); doDemolish(me, 38, 29, 0);
    o.collapse = [W.slab[ci(38, 28, 1)], W.slab[ci(37, 28, 1)]].join(',');
    // walk up the fort stairs: (34,27,0) dir north -> (34,26,1)
    me.x = 34.5; me.y = 27.9; me.L = 0; INP.keys.w = true; CAM.rot = 0; CAM.yaw = camYawTarget();
    me.inp.mx = 0; await new Promise(r => setTimeout(r, 50));
    INP.keys.w = false;
    // drive movement directly north
    for (let k = 0; k < 40; k++) { moveEnt(me, 0, -0.03, 'p', true); }
    o.stairs = [me.x.toFixed(2), me.y.toFixed(2), me.L, surfZ(me.x, me.y, me.L).toFixed(2)].join(',');
    me.x = W.bench.x + 1.5; me.y = W.bench.y + 0.5; me.L = 0; W.res.parts += 40; doCraft(me, 'rifle'); o.rifle = me.owned[2] + ' wpn ' + me.wpn;
    me.x = 32.5; me.y = 29.5; me.L = 0;
    return o;
  });
  console.log('day', JSON.stringify(r));
  await shot('03_built');
  // view layer up + build mode screenshot
  await p.keyboard.press('b'); await p.mouse.move(700, 380); await shot('04_build');
  await p.keyboard.press('PageUp'); await shot('05_build_up'); await p.keyboard.press('Home'); await p.keyboard.press('b');
  // night
  await p.evaluate(() => { window.__dbg.god = true; W.clock = 0.3; });
  await p.waitForTimeout(1500); await p.evaluate(() => { window.__dbg.speed = 4; }); await p.waitForTimeout(9000);
  console.log('night', await p.evaluate(() => JSON.stringify({ ph: W.phase, n: W.night, zs: W.zs.length, q: W.spawnQ.length, radio: Math.round(W.radio.hp), atk: W.zs.filter(z => z.st === 'attack').length, lost: W.stats.lost, pos: W.zs.slice(0, 6).map(z => z.x.toFixed(0) + ',' + z.y.toFixed(0) + ',' + z.L).join(' ') })));
  await p.evaluate(() => { window.__dbg.speed = 1; });
  for (let k = 0; k < 16; k++) { await p.evaluate(() => { const me = W.p[0]; const z = W.zs.slice().sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; if (z) { const [sx, sy] = w2s(z.x, z.y, z.z + 0.6); INP.mx = sx; INP.my = sy; INP.mouseT = performance.now(); INP.mL = true; } }); await p.waitForTimeout(150); }
  await p.evaluate(() => { INP.mL = false; });
  await shot('06_night');
  console.log('fight', await p.evaluate(() => 'kills ' + W.kills + ' mag ' + W.p[0].mag.join(',')));
  await p.evaluate(() => { CAM.zoom = 5; CAM.rot = 2; }); await shot('07_zoom_rot');
  await p.evaluate(() => { W.radio.hp = 0; }); await p.waitForTimeout(500); await shot('08_over');
  console.log('errs', errs.slice(0, 8), await p.evaluate(() => window.__dbg.err || ''));
  await b.close();
})();
