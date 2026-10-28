// node test/perf2d.js [gpu]  — time the 2D render passes
const { chromium } = require('playwright');
(async () => {
  const args = process.argv[2] === 'gpu' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--disable-gpu'];
  const b = await chromium.launch({ args });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await pg.goto('http://localhost:8765/test.html');
  await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  const r = await pg.evaluate(() => {
    __dbg.skipDraw = true; const g = V.g, out = {}; const T = (n, f) => { const t0 = performance.now(); f(); out[n] = (out[n] || 0) + performance.now() - t0; };
    CAM.tx = 0; CAM.tz = 40; V.cx = 0; V.cz = 40;
    T('prewarm', () => prewarmChunks(0, 40, 1));
    for (let i = 0; i < 5; i++) { T('ground', () => drawGround(g)); T('static', () => { queueStatic(); queueScene(); flushQueue(g); }); T('light', () => { LAMPS.length = 0; sceneLamps(LAMPS); drawLighting(g); }); }
    for (const k in out) out[k] = +(out[k]).toFixed(1);  out.statics = STATIC.list.length; return out;
  }).catch(e => 'ERR ' + e.message);
  console.log(r); await b.close();
})();
