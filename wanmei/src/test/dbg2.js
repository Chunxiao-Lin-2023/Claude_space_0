const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 320, height: 180 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  await pg.goto('http://localhost:8765/test.html?q=low'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 });
  await pg.evaluate(() => { localStorage.clear(); __dbg.autoDlg = 0.1; __dbg.speed = 4; PARTY.pname = 'x'; startSolo(null); W.skip = true; });
  await pg.waitForFunction(() => !STORY.running, null, { timeout: 60000 });
  console.log(await pg.evaluate(() => { STORY.running = null; startStory(1, 4); return STORY.si; }));
  for (let i = 0; i < 14; i++) { await pg.waitForTimeout(1500); console.log(await pg.evaluate(() => { const b = entByTag('wuse'), me = W.P[0]; if (b && me && !STORY.running) teleport(me, b.x + 1, b.z + 1); return JSON.stringify({ si: STORY.si, run: !!STORY.running, dlg: DLG.open, b: b ? [b.x.toFixed(1), b.z.toFixed(1), !!b.walk, STORY.birdI] : null, me: me && [me.x.toFixed(1), me.z.toFixed(1)] }); })); }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
