// usage: node test/smoke.js [outdir-for-shots]
const { chromium } = require('playwright');
(async () => {
  const shots = process.argv[2] || '/tmp/claude-0/shots'; require('fs').mkdirSync(shots, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: +(process.env.VW || 960), height: +(process.env.VH || 540) } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n'))); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('http://localhost:8765/test.html' + (process.env.Q || ''));
  await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.waitForTimeout(1500); await pg.screenshot({ path: shots + '/00_title.png', timeout: 120000 });
  await pg.click('#bnew'); await pg.waitForTimeout(300); await pg.fill('#pn', '团团'); await pg.click('#pok');
  for (let i = 1; i <= +(process.env.N || 6); i++) { await pg.waitForTimeout(+(process.env.DT || 2500)); await pg.screenshot({ path: `${shots}/${String(i).padStart(2, '0')}.png`, timeout: 120000 }); }
  console.log(errs.slice(0, 20).join('\n') || 'no errors'); await b.close();
})();
