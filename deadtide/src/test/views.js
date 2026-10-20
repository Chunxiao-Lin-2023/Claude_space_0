// Visual check of the camera controls: zoom levels, rotation, auto cutaway indoors, manual per-floor view.
// Stages a 3-storey fort, then screenshots each view. Serve out/ on :8766.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.click('#soloBtn'); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  await p.evaluate(() => {
    window.__dbg.god = true; W.clock = 999;
    const S = (x, y, L, id) => setCell(ci(x, y, L), W.blk[ci(x, y, L)], id, null, 'build');
    const K = (x, y, L, id, d) => setCell(ci(x, y, L), id, W.slab[ci(x, y, L)], d == null ? null : d, 'build');
    for (let x = 29; x <= 35; x++) for (let y = 25; y <= 31; y++) {
      const edge = x === 29 || x === 35 || y === 25 || y === 31;
      if (edge && !W.blk[ci(x, y, 1)]) K(x, y, 1, (x + y) % 4 === 0 ? 8 : 1);
      if (!edge && !(x === 33 && y === 30)) S(x, y, 2, 5);
      if (edge && (x === 35 || y === 25)) K(x, y, 2, (x + y) % 3 === 0 ? 8 : 3);
    }
    K(33, 30, 1, 6, 3);
    K(31, 28, 1, 10); K(33, 27, 2, 10);
    recomputeStab();
    const me = W.p[0]; me.x = 31.5; me.y = 29.5; me.L = 0; me.z = surfZ(me.x, me.y, 0);
    for (let k = 0; k < 6; k++) { const z = spawnZombie(k % 3 ? 'walker' : 'runner', k % 4); z.x = 24 + k; z.y = 33 + (k % 2); z.L = 0; z.z = surfZ(z.x, z.y, 0); }
  });
  const shot = async (n, fn) => { await p.evaluate(fn); await p.evaluate(() => { window.__dbg.speed = 0; }); await p.waitForTimeout(2800); await p.screenshot({ path: OUT + '/v_' + n + '.png' }); };
  await shot('1_auto_indoor_1F', () => { VIEW.auto = true; CAM.zoom = 9; CAM.rot = 0; uiView(); });
  await shot('2_manual_all', () => { VIEW.auto = false; VIEW.L = ML - 1; uiView(); });
  await shot('3_manual_2F', () => { VIEW.auto = false; VIEW.L = 1; uiView(); });
  await shot('4_manual_3F', () => { VIEW.auto = false; VIEW.L = 2; uiView(); });
  await shot('5_zoom_in', () => { VIEW.auto = true; CAM.zoom = 5; uiView(); });
  await shot('6_zoom_out', () => { CAM.zoom = 20; VIEW.auto = false; VIEW.L = ML - 1; uiView(); });
  await shot('7_rotated', () => { CAM.zoom = 9; CAM.rot = 2; VIEW.auto = false; VIEW.L = 1; uiView(); });
  const info = await p.evaluate(() => ({ vl: viewL(), lbl: document.getElementById('vLbl').textContent, stab: [W.stab[ci(31, 28, 2)], W.stab[ci(35, 28, 2)]].join(',') }));
  console.log(JSON.stringify(info), 'errs', errs);
  await b.close();
})();
