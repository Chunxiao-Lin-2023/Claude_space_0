// node test/q6shot.js — the eagle returning to its cliff nest (chapter 8 opening)
const { chromium } = require('playwright');
(async () => {
  const out = '/tmp/claude-0/q6'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; setLight('day', true); const me = W.P[0]; teleport(me, NEST.x + 4, NEST.z + 24); teleport(W.P[1], NEST.x + 5, NEST.z + 25); PARTY.flags.hatched = 1; for (const k of ['dazhuang', 'ermeng', 'pihou']) { const e = entByTag(k); if (e) teleport(e, NEST.x + rr(-3, 6), NEST.z + rr(22, 27)); } const qi = QUESTS.findIndex(q => q.id === 'q6'); startStory(qi, 0); });
  let n = 0; for (let i = 0; i < 400 && n < 9; i++) { await pg.waitForTimeout(250); const st = await pg.evaluate(() => { if (DLG.open && DLG.typing >= DLG.full.length) { advanceDlg(); return 'adv'; } const e = entByTag('eagle'); return e ? [e.x.toFixed(0), e.z.toFixed(0), (e.flyH || 0).toFixed(1), e.fly] : 'none'; }); if (i % 6 === 3) { await pg.screenshot({ path: `${out}/s${n}.png` }); console.log(n, JSON.stringify(st)); n++; } }
  await b.close();
})();
