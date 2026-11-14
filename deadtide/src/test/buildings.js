// Visual check of building art: a staged fort mixing wood / brick / steel walls, doors, bars, stairs, lamps, wire,
// plus the ruined town. Usage: node test/buildings.js <tag>   (serve out/ on :8766)
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt'; const TAG = process.argv[2] || 'b';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.click('#soloBtn'); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  await p.evaluate(() => {
    window.__dbg.god = true; W.clock = 999; document.getElementById('hud').style.display = 'none';
    const K = (x, y, L, id, d) => setCell(ci(x, y, L), id, W.slab[ci(x, y, L)], d == null ? null : d, 'build');
    const S = (x, y, L, id) => setCell(ci(x, y, L), W.blk[ci(x, y, L)], id, null, 'build');
    const R = W.radio, X = R.x, Y = R.y;
    // east annex: steel tower with a steel floor and brick upper storey, wooden palisade yard to the south
    for (let x = X + 6; x <= X + 9; x++) for (let y = Y - 3; y <= Y + 1; y++) {
      const edge = x === X + 6 || x === X + 9 || y === Y - 3 || y === Y + 1;
      if (edge) K(x, y, 0, (y === Y + 1 && x === X + 7) ? 7 : (x === X + 9 && y === Y - 1) ? 8 : 3);
      if (!edge) S(x, y, 1, 5);
      if (edge) K(x, y, 1, (x === X + 9 && y === Y - 2) ? 8 : 2);
    }
    for (let x = X - 6; x <= X + 10; x++) if (!W.blk[ci(x, Y + 7, 0)]) K(x, Y + 7, 0, x === X + 2 ? 7 : 1);
    for (let y = Y + 2; y <= Y + 6; y++) { if (!W.blk[ci(X + 10, y, 0)]) K(X + 10, y, 0, 1); if (!W.blk[ci(X - 6, y, 0)]) K(X - 6, y, 0, y === Y + 4 ? 8 : 1); }
    for (let x = X - 6; x <= X + 10; x += 2) K(x, Y + 9, 0, 9);
    K(X - 3, Y + 6, 0, 10); K(X + 8, Y + 6, 0, 10);
    recomputeStab(); setTimeout(() => { RND.parts.length = 0; }, 1500);
    const me = W.p[0]; me.x = X + 2.5; me.y = Y + 5.5; me.L = 0; me.z = surfZ(me.x, me.y, 0);
  });
  const shot = async (n, fn) => { await p.evaluate(fn); await p.evaluate(() => { window.__dbg.speed = 0; }); await p.waitForTimeout(3000); await p.screenshot({ path: `${OUT}/${TAG}_${n}.png` }); };
  await shot('fort', () => { VIEW.auto = false; VIEW.L = ML - 1; CAM.zoom = 9; CAM.rot = 0; uiView(); });
  await shot('fort_r2', () => { CAM.rot = 2; });
  await shot('house', () => { CAM.rot = 0; CAM.zoom = 4.5; const me = W.p[0]; me.x = 50.5; me.y = 76.5; me.z = surfZ(me.x, me.y, 0); });
  await shot('town', () => { CAM.rot = 0; CAM.zoom = 8; const me = W.p[0]; me.x = 57.5; me.y = 74.5; CAM.zoom = 12; me.z = surfZ(me.x, me.y, 0); });
  await shot('night', () => { CAM.zoom = 7.5; const me = W.p[0]; me.x = W.radio.x + 2.5; me.y = W.radio.y + 5.5; me.z = surfZ(me.x, me.y, 0); W.phase = 'night'; W.night = 2; W.spawnQ = [{ t: 999, k: 'walker', side: 0 }]; });
  console.log('errs', errs);
  await b.close();
})();
