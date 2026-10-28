const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = 'x'; startSolo(null); W.skip = true; });
  for (let i = 0; i < 60; i++) { const qi = await pg.evaluate(() => { W.skip = true; if (DLG.open) advanceDlg(); return STORY.qi; }); if (qi >= 1) break; await pg.waitForTimeout(100); }
  await pg.evaluate(() => { W.skip = false; }); await pg.waitForTimeout(2000);
  const fps = () => pg.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else res(+(n / 2.5).toFixed(1)); }; f(); }));
  console.log('all', await fps());
  for (const n of ['queueStatic', 'queueScene', 'drawChibi', 'drawBeast', 'queueFX']) {
    await pg.evaluate(n => { window['_o_' + n] = window[n]; window[n] = function () {  }; }, n);
    console.log('without', n, await fps());
    await pg.evaluate(n => { window[n] = window['_o_' + n]; }, n);
  }
  await pg.evaluate(() => { __dbg.skipDraw = true; }); console.log('skipDraw', await fps());
  await b.close();
})();
