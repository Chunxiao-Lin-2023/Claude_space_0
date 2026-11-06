// node test/nestshot.js — the cliff-top nest and the flying eagle
const { chromium } = require('playwright');
(async () => {
  const out = '/tmp/claude-0/nest'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); hidePet(false); for (const p of W.P) p.script = false; document.querySelectorAll('#hud, #party, #mm, #tracker, #chat, #bar, #hotbar, #plates, #tbtns, #menu').forEach(e => e && (e.style.visibility = 'hidden')); });
  const shot = async (n, w = 2200) => { await pg.waitForTimeout(w); await pg.screenshot({ path: `${out}/${n}.png` }); console.log('shot', n); };
  await pg.evaluate(() => { setLight('day', true); const me = W.P[0], pet = W.P[1]; teleport(me, NEST.x + 1, NEST.z + 12, PI); teleport(pet, NEST.x + 2.4, NEST.z + 12.6, PI); me.script = pet.script = true;
    for (const [k, dx] of [['dazhuang', -3], ['ermeng', -1.6], ['pihou', 3.6]]) { const e = entByTag(k); if (e) { teleport(e, NEST.x + dx, NEST.z + 13.5, PI); e.script = true; e.npcAI = null; } }
    CAM.zoomT = 1; });
  await shot('A_base', 3000);
  await pg.evaluate(() => { CAM.zoomT = 0.5; }); await shot('A2_base_wide', 2500);
  await pg.evaluate(() => { const me = W.P[0], pet = W.P[1]; CAM.zoomT = 1; teleport(me, NEST.x + 1, NEST.z + 5.5, PI); teleport(pet, NEST.x - 1, NEST.z + 6, PI); STORY.eggs = [0, 1, 2].map(i => { const m = eggMesh(i === 2 ? 0xa8e0c8 : 0x9ad8b8, 0x5ae8a0, 0.4); m.position.set(NEST.x - 1 + i, terrH(NEST.x, NEST.z) + 0.3, NEST.z - 1 + (i % 2) * 0.6); R3.scene.add(m); return m; }); });
  await shot('B_top', 3000);
  await pg.evaluate(() => { const me = W.P[0]; teleport(me, NEST.x + 4, NEST.z + 22, PI); const eg = eagleEnt(NEST.x - 2, NEST.z + 26, { flyH: 6 }); eg.rot = HP; CAM.zoomT = 0.5; });
  await shot('C_eagle', 2600); await shot('C2_eagle', 300);
  await b.close();
})();
