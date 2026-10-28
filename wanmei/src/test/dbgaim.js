const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready);
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = 'x'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; const me = W.P[0]; teleport(me, 30, -40, 0); CAM.tx = 30; CAM.tz = -40; }); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => new Promise(res => { PARTY.flags.sk_yinyue = 1; const me = W.P[0]; const w = spawnMob('wolf', 36, -40, { lv: 2 }); w.ai.cd = 9; const log = []; me.mp = 99; castSkill(me, 'yinyue', w); log.push(['after cast', me.rot.toFixed(2)]); let n = 0; const f = () => { log.push([n, PROJ.map(p => [p.x.toFixed(1), p.z.toFixed(1), p.mesh ? w2s(p.mesh.position.x, p.mesh.position.z).map(v => v | 0).join(',') : '-', p.mesh && p.mesh.parent === SCENE]).join(';'), w2s(me.x, me.z).map(v => v | 0).join(','), PART.n]); if (++n < 12) requestAnimationFrame(f); else res(log); }; f(); }));
  await pg.screenshot({ path: '/tmp/claude-0/aim.png' });
  console.log(JSON.stringify(r)); await b.close(); })();
