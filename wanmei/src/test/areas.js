// node test/areas.js — one screenshot per area spot (Stardew-style tiled maps)
const { chromium } = require('playwright');
(async () => {
  const out = '/tmp/claude-0/areas'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); hidePet(false); for (const p of W.P) p.script = false; document.querySelectorAll('#hud, #party, #tracker, #chat, #bar, #hotbar, #plates, #tbtns, #menu').forEach(e => e && (e.style.visibility = 'hidden')); setLight('day', true); });
  const spots = (process.env.SPOTS || 'gate:0,-4;willow:0,24;street:-20,40;plaza:0,62;bath:-28,84;yard:0,110;fcamp:22,-66;cave:64,-58;stonef:140,-150;meadow:100,130;beicun:-160,-160').split(';').map(s => { const [n, p] = s.split(':'); const [x, z] = p.split(',').map(Number); return [n, x, z]; });
  for (const [n, x, z] of spots) { await pg.evaluate(([x, z, zm]) => { const me = W.P[0]; teleport(me, x, z, PI); teleport(W.P[1], x + 1.4, z + 0.6, PI); CAM.zoomT = zm; }, [x, z, +(process.env.ZOOM || 1)]); await pg.waitForTimeout(2600); await pg.screenshot({ path: `${out}/${n}.png` }); console.log('shot', n, await pg.evaluate(() => (W.area || {}).name)); }
  await b.close();
})();
