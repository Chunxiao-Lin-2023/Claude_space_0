// node test/pxlab.js people|poses|beasts|portraits [scale]
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 4).join(' | '))); pg.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  const w = process.argv[2] || 'people', s = +(process.argv[3] || 3);
  await pg.goto('http://localhost:8766/test/pxlab.html'); await pg.waitForFunction(() => window.LAB);
  await pg.evaluate(([w, s]) => w === 'portraits' ? LAB.portraits(s) : w === 'pixtest' ? LAB.pixtest(s) : LAB.sheet(w, s), [w, s]);
  await pg.locator('#c').screenshot({ path: `/tmp/claude-0/px_${w}.png` }); await b.close(); })();
