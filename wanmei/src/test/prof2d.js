const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = 'x'; startSolo(null); W.skip = true; });
  for (let i = 0; i < 60; i++) { const qi = await pg.evaluate(() => { W.skip = true; if (DLG.open) advanceDlg(); return STORY.qi; }); if (qi >= 1) break; await pg.waitForTimeout(100); }
  await pg.evaluate(() => { W.skip = false; }); await pg.waitForTimeout(3000);
  const r = await pg.evaluate(() => new Promise(res => {
    const P = {}; const names = ['step', 'render', 'drawGround', 'queueStatic', 'queueScene', 'flushQueue', 'drawParticles', 'drawLighting', 'updateHUD', 'tickPlates', 'drawMinimap', 'paintChunk', 'drawChibi', 'drawBeast', 'protoBitmap', 'tickFloat', 'separate', 'moveEnt', 'collide'];
    for (const n of names) { const f = window[n]; if (typeof f !== 'function') continue; P[n] = { t: 0, c: 0 }; window[n] = function () { const t0 = performance.now(); try { return f.apply(this, arguments); } finally { P[n].t += performance.now() - t0; P[n].c++; } }; }
    let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else { for (const k in P) P[k] = [+(P[k].t / n).toFixed(2), +(P[k].c / n).toFixed(1)]; res({ fps: n / 4, per_frame_ms_calls: P, ents: W.ents.length }); } }; f();
  }));
  console.log(JSON.stringify(r, null, 0)); await b.close();
})();
