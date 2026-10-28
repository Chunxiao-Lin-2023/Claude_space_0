// usage: node test/scene2d.js [outdir]   — 2D village style check: title, village walk, dialogue, wolf fight
const { chromium } = require('playwright');
(async () => {
  const shots = process.argv[2] || '/tmp/claude-0/shots2d'; require('fs').mkdirSync(shots, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  const pg = await b.newPage({ viewport: { width: +(process.env.VW || 1280), height: +(process.env.VH || 720) } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text()); });
  const T = Date.now(), log = (...a) => console.log(((Date.now() - T) / 1000).toFixed(1) + 's', ...a);
  await pg.goto('http://localhost:8765/test.html' + (process.env.Q || ''));
  await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 }); log('ready');
  await pg.evaluate(() => localStorage.clear());
  await pg.waitForTimeout(2500); await pg.screenshot({ path: shots + '/00_title.png', timeout: 120000 }); log('title');
  if (errs.length) { console.log(errs.join('\n')); }
  await pg.click('#bnew'); await pg.waitForTimeout(300); await pg.fill('#pn', '团团'); await pg.click('#pok');
  if (process.env.PRO) { for (let i = 0; i < 6; i++) { await pg.waitForTimeout(3000); await pg.screenshot({ path: `${shots}/p${i}.png`, timeout: 120000 }); log('pro', i); } }
  // skip the prologue and the opening of chapter 1
  for (let i = 0; i < 200; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(60); }
  await pg.evaluate(() => { W.skip = false; uiCine(false); W.cine = false; setLight('day', true); }); await pg.waitForTimeout(2500); log('q1');
  await pg.screenshot({ path: shots + '/01_q1.png', timeout: 120000 });
  await pg.evaluate(() => { hidePet(false); const me = W.P[0]; teleport(me, VIL.x + 6, VIL.z - 18); teleport(W.P[1], VIL.x + 7.5, VIL.z - 17); CAM.zoomT = 0.75; });
  await pg.waitForTimeout(2500); await pg.screenshot({ path: shots + '/01b_village.png', timeout: 120000 }); log('village');
  // walk with keys
  await pg.keyboard.down('d'); await pg.waitForTimeout(900); await pg.keyboard.up('d'); await pg.keyboard.down('s'); await pg.waitForTimeout(1400);
  await pg.screenshot({ path: shots + '/02_walk.png', timeout: 120000 }); await pg.keyboard.up('s'); log('walk');
  // talk to the chief if there is a dialogue step
  await pg.evaluate(() => { const ch = W.ents.find(e => e.tag === 'chief'); const me = W.P[0]; if (ch) { teleport(me, ch.x + 1.4, ch.z + 1.6); doInteract(me, ch); } });
  await pg.waitForTimeout(2200); await pg.screenshot({ path: shots + '/03_talk.png', timeout: 120000 }); log('talk');
  for (let i = 0; i < 60; i++) { const busy = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(1); return !!STORY.running || DLG.open; }); if (!busy) break; await pg.waitForTimeout(60); } await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); CAM.zoomT = 1; });
  // wolf fight just outside the village
  await pg.evaluate(() => { const me = W.P[0]; teleport(me, 20, -30); teleport(W.P[1], 21.5, -29); for (let i = 0; i < 3; i++) { const w = spawnMob('wolf', 24 + i * 1.6, -34 + (i % 2) * 2, { lv: 1 }); w.ai.tgt = me; } setLight('day', true); });
  for (let i = 0; i < 4; i++) { await pg.waitForTimeout(700); await pg.evaluate(() => { const me = W.P[0]; const t = W.ents.find(e => e.type === 'mob' && e.alive); if (t) { setTarget(t); INP.chase = t; } if (Math.random() < 0.5) heroAction('s1'); }); }
  await pg.screenshot({ path: shots + '/04_fight.png', timeout: 120000 }); log('fight');
  await pg.waitForTimeout(1500); await pg.screenshot({ path: shots + '/05_fight.png', timeout: 120000 });
  await pg.evaluate(() => setLight('night', true)); await pg.evaluate(() => { const me = W.P[0]; teleport(me, WILLOW.x + 3, WILLOW.z + 9); teleport(W.P[1], WILLOW.x + 4.5, WILLOW.z + 9.5); }); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: shots + '/06_night.png', timeout: 120000 }); log('night');
  const fps = await pg.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; f(); }));
  console.log('fps(swiftshader)', fps);
  console.log(errs.slice(0, 30).join('\n') || 'no errors'); await b.close();
})();
