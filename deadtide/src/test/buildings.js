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
    // east annex: steel-walled tower with a steel floor and a wooden palisade yard
    for (let x = 36; x <= 39; x++) for (let y = 25; y <= 29; y++) {
      const edge = x === 36 || x === 39 || y === 25 || y === 29;
      if (edge) K(x, y, 0, (y === 29 && x === 37) ? 7 : (x === 39 && y === 27) ? 8 : 3);
      if (!edge) S(x, y, 1, 5);
      if (edge) K(x, y, 1, (x === 39 && y === 26) ? 8 : 2);
    }
    for (let x = 30; x <= 40; x++) if (!W.blk[ci(x, 33, 0)]) K(x, 33, 0, x === 34 ? 7 : 1);
    for (let y = 30; y <= 32; y++) { K(40, y, 0, 1); K(29, y + 0, 0, y === 31 ? 8 : 1); }
    for (let x = 30; x <= 40; x += 2) K(x, 35, 0, 9);
    K(31, 32, 0, 10); K(38, 32, 0, 10); K(37, 26, 1, 10);
    recomputeStab(); setTimeout(() => { RND.parts.length = 0; }, 1500);
    const me = W.p[0]; me.x = 34.5; me.y = 31.5; me.L = 0; me.z = surfZ(me.x, me.y, 0);
  });
  const shot = async (n, fn) => { await p.evaluate(fn); await p.evaluate(() => { window.__dbg.speed = 0; }); await p.waitForTimeout(3000); await p.screenshot({ path: `${OUT}/${TAG}_${n}.png` }); };
  await shot('fort', () => { VIEW.auto = false; VIEW.L = ML - 1; CAM.zoom = 7.5; CAM.rot = 0; uiView(); });
  await shot('fort_r2', () => { CAM.rot = 2; });
  await shot('house', () => { CAM.rot = 0; CAM.zoom = 4.5; const me = W.p[0]; me.x = 44.5; me.y = 47.5; me.z = surfZ(me.x, me.y, 0); });
  await shot('town', () => { CAM.rot = 0; CAM.zoom = 8; const me = W.p[0]; me.x = 40.5; me.y = 47.5; me.z = surfZ(me.x, me.y, 0); });
  await shot('night', () => { CAM.zoom = 7.5; const me = W.p[0]; me.x = 34.5; me.y = 31.5; me.z = surfZ(me.x, me.y, 0); W.phase = 'night'; W.night = 2; W.spawnQ = [{ t: 999, k: 'walker', side: 0 }]; });
  console.log('errs', errs);
  await b.close();
})();
