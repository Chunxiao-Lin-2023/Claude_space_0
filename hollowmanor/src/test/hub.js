// Gallery integration: the hub card opens the game; the title screen's "‹ 游戏厅" returns to the hub. Serve the repo root on :8766.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8766/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  const card = await p.$('a[href*="hollowmanor"]'); console.log('card found', !!card);
  await p.screenshot({ path: OUT + '/hub.png' });
  await card.click();
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
  console.log('at', await p.evaluate(() => location.pathname), 'hub button visible', await p.evaluate(() => !document.getElementById('hubBtn').classList.contains('hidden')));
  await p.click('#hubBtn'); await p.waitForTimeout(1500);
  console.log('back at', await p.evaluate(() => location.pathname));
  console.log('errs', errs);
  await b.close();
})();
