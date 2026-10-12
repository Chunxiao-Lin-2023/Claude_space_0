// Visual check: renders the solo test build at several spots/states and saves screenshots.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
const W_ = +(process.env.W || 1100), H_ = +(process.env.H || 650);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W_, height: H_ } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html?solo=1&seed=' + (process.env.SEED || 11) + '&role=' + (process.env.ROLE || 'L') + (process.env.Q || ''), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
  await p.evaluate(() => { window.__dbg.noBot = true; W.huntCD = 1e9; W.eventCD = 1e9; });
  const shots = JSON.parse(process.env.SHOTS || '[]');
  for (const [name, js, wait] of shots) {
    await p.evaluate(js);
    await p.waitForTimeout(wait || 1500);
    await p.screenshot({ path: OUT + '/' + name + '.png', timeout: 120000 });
    console.log('shot', name, await p.evaluate(() => (R3.lastCalls || 0) + ' calls ' + (R3.lastTris || 0) + ' tris'));
  }
  console.log('errs', errs.slice(0, 10));
  await b.close();
})();
