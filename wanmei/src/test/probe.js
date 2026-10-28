const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  const t0 = Date.now(); await pg.goto('http://localhost:8765/test.html' + (process.env.Q || ''));
  await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 }); console.log('ready in', Date.now() - t0, 'ms');
  const r = await pg.evaluate(() => new Promise(res => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 4000) requestAnimationFrame(f); else res({ fps: n / 4, calls: R3.ren.info.render.calls, tris: R3.ren.info.render.triangles }); }; f(); }));
  console.log(JSON.stringify(r)); console.log(errs.slice(0, 15).join('\n') || 'no errors'); await b.close();
})();
