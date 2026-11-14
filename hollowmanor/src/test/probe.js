const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || require('fs').readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).flatMap(d => ['/chrome-linux/chrome', '/chrome-linux64/chrome'].map(s => '/opt/pw-browsers/' + d + s)).find(p => require('fs').existsSync(p)), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 650 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html?solo=1&seed=' + (process.env.SEED || 11), { waitUntil: 'commit' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
  if (process.env.PRE) { await p.evaluate(process.env.PRE); await p.waitForTimeout(+(process.env.WAIT || 1500)); }
  console.log(await p.evaluate(process.env.JS));
  await b.close();
})();
