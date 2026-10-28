const { chromium } = require('playwright');
(async () => {
  const args = process.argv[2] === 'gpu' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--disable-gpu'];
  const b = await chromium.launch({ args }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  const r = await pg.evaluate(() => new Promise(res => { let n = 0, worst = 0, last = performance.now(); const t0 = last; const f = () => { const t = performance.now(); worst = Math.max(worst, t - last); last = t; n++; if (t - t0 < 4000) requestAnimationFrame(f); else res({ fps: n / 4, worst: worst | 0 }); }; f(); }));
  console.log(r); const t1 = Date.now(); await pg.screenshot({ path: '/tmp/claude-0/fps.png' }); console.log('shot ms', Date.now() - t1); await b.close();
})();
