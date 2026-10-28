const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 4).join(' | '))); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await pg.goto('http://localhost:8765/test.html?q=low'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 });
  await pg.evaluate(() => { localStorage.clear(); __dbg.autoDlg = 0.12; __dbg.speed = 3; });
  await pg.click('#bnew'); await pg.waitForTimeout(200); await pg.fill('#pn', '团团'); await pg.click('#pok');
  for (let i = 0; i < +(process.env.N || 12); i++) { await pg.waitForTimeout(5000); const s = await pg.evaluate(() => ({ t: W.t.toFixed(1), run: !!STORY.running, dlg: DLG.open, line: DLG.full && DLG.full.slice(0, 20), qi: STORY.qi, si: STORY.si, cine: W.cine, fps: 0 })); console.log(JSON.stringify(s)); }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
