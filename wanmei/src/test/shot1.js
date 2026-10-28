const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  await pg.goto('http://localhost:8765/test.html?q=low'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 });
  const t = Date.now(); try { await pg.screenshot({ path: '/tmp/claude-0/shots/t.png', timeout: 110000 }); console.log('shot ms', Date.now() - t); } catch (e) { console.log('fail', e.message.slice(0, 100)); }
  await b.close();
})();
