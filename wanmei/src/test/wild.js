// node test/wild.js — biome props and critters
const { chromium } = require('playwright');
(async () => {
  const out = '/tmp/claude-0/wild'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); hidePet(false); for (const p of W.P) p.script = false; document.querySelectorAll('#hud, #party, #mm, #tracker, #chat, #bar, #hotbar, #plates, #tbtns, #menu').forEach(e => e && (e.style.visibility = 'hidden')); });
  const shot = async (n, w = 2200) => { await pg.waitForTimeout(w); await pg.screenshot({ path: `${out}/${n}.png` }); console.log('shot', n); };
  const pick = await pg.evaluate(() => { const h = RABBIT_HOLES.slice().sort((a, b) => Math.hypot(a.x - 60, a.z - 40) - Math.hypot(b.x - 60, b.z - 40))[0]; return h; });
  console.log('hole', JSON.stringify(pick), await pg.evaluate(() => RABBIT_HOLES.length));
  await pg.evaluate(h => { setLight('day', true); const me = W.P[0], pet = W.P[1]; teleport(me, h.x + 14, h.z + 3, 0); teleport(pet, h.x + 15.5, h.z + 3.5, 0); me.script = pet.script = true; CRIT.crowT = 0; }, pick);
  await shot('A_meadow', 4500);
  await pg.evaluate(h => { const me = W.P[0]; walkTo(me, h.x + 2, h.z + 1, 5); }, pick); await shot('A2_flee', 1800);
  await pg.evaluate(() => { const me = W.P[0]; let best = null, bv = 0; for (let i = 0; i < 400; i++) { const x = -150 + (i % 20) * 15, z = -150 + Math.floor(i / 20) * 15; const v = fbm(x * 0.009 + 40, z * 0.009 - 12, 3); if (v > bv && Math.hypot(x, z - 55) > 80) { bv = v; best = [x, z]; } } teleport(me, best[0], best[1], 0); teleport(W.P[1], best[0] + 1.5, best[1] + 0.5, 0); });
  await shot('B_birch', 3500);
  await pg.evaluate(() => { const me = W.P[0]; let best = null, bv = 0; for (let i = 0; i < 400; i++) { const x = -150 + (i % 20) * 15, z = -150 + Math.floor(i / 20) * 15; const v = forestDens(x, z); if (v > bv) { bv = v; best = [x, z]; } } teleport(me, best[0], best[1], 0); teleport(W.P[1], best[0] + 1.5, best[1] + 0.5, 0); });
  await shot('C_forest', 3500);
  await pg.evaluate(() => { setLight('night', true); }); await shot('D_night', 3500);
  await b.close();
})();
