// Hub layout check (serve the repo root on :8766): hub buttons visible, two-tap exit, and a cover screenshot.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '.';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)|unpkg|jsdelivr/, r => r.abort());
  await p.goto('http://localhost:8766/dunerumble/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  const hub = await p.evaluate(() => ({ hub: !document.getElementById('hubBtn').classList.contains('hidden'), pHub: !document.getElementById('pHub').classList.contains('hidden') }));
  await p.evaluate(() => { SEL.hero = 3; refreshMenu(); document.getElementById('hubBtn').style.visibility = 'hidden'; }); await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT + '/cover_raw.png' }); await p.evaluate(() => { document.getElementById('hubBtn').style.visibility = ''; });
  await p.evaluate(() => { startGame({ seed: 1, theme: 'desert', mode: 'solo', diff: 1, roster: buildRoster(false) }); }); await p.waitForTimeout(600);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.click('#pHub'); const t1 = await p.textContent('#pHub');
  console.log(JSON.stringify({ hub, t1, url: p.url() }), errs);
  await b.close();
})();
