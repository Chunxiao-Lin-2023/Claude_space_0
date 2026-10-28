const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  pg.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0, 300)));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready);
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = 'x'; startSolo(null); });
  const S = () => pg.evaluate(() => JSON.stringify({ qi: STORY.qi, si: STORY.si, run: !!STORY.running, dlg: DLG.open, cine: W.cine, t: +W.t.toFixed(1), hold: STORY.hold, me: [W.P[0].x | 0, W.P[0].z | 0], cam: [CAM.tx | 0, CAM.tz | 0], mode: STATE.mode, paused: STATE.paused }));
  for (let i = 0; i < 200; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } return [STORY.qi, !!STORY.running, DLG.open]; }); if (i % 20 === 0) console.log(i, await S()); if (st[0] >= 1 && !st[1] && !st[2]) break; await pg.waitForTimeout(60); }
  console.log('after', await S()); await pg.evaluate(() => { W.skip = false; }); await pg.waitForTimeout(2000); console.log('later', await S());
  await b.close(); })();
