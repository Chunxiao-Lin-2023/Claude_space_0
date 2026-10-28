const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready); await pg.waitForTimeout(3000);
  await pg.screenshot({ path: '/tmp/claude-0/title2d.png' }); await b.close(); })();
