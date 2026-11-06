// node test/walkcheck.js — every moving on-screen character must change sprite frames regularly (no sliding / "teleporting")
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); const me = W.P[0]; teleport(me, VIL.x + 3, VIL.z + 6, 0); window._wc = new Map(); });
  await pg.waitForTimeout(3000); // let the sprite cache warm up a little
  await pg.evaluate(() => { window._wc = new Map(); });
  // sample: per entity, count frames where it moved but its drawn frame did not change for > 0.4 s
  for (let i = 0; i < 60; i++) { await pg.waitForTimeout(100); await pg.evaluate(() => { for (const e of W.ents) { if (!e.R || !onScreen(e.x, e.z, 0)) continue; let s = _wc.get(e.id); if (!s) _wc.set(e.id, s = { name: e.name, moved: 0, frozen: 0, maxStill: 0, f: null, still: 0, x: e.x, z: e.z }); const mv = Math.hypot(e.x - s.x, e.z - s.z); s.x = e.x; s.z = e.z; const F = e.R.lastF; if (mv > 0.04) { s.moved++; if (F === s.f) { s.still += 0.1; s.maxStill = Math.max(s.maxStill, s.still); } else s.still = 0; } else s.still = 0; s.f = F; } }); }
  const res = await pg.evaluate(() => [..._wc.values()].filter(s => s.moved > 3));
  let bad = 0; for (const s of res) { const ok = s.maxStill <= 0.45; if (!ok) bad++; console.log((ok ? 'ok  ' : 'BAD ') + s.name.padEnd(6), 'moved', s.moved, 'longest frozen-while-moving', s.maxStill.toFixed(1) + 's'); }
  console.log(bad ? `WALKCHECK FAIL ${bad}` : 'WALKCHECK PASS', res.length, 'movers');
  await b.close(); process.exit(bad ? 1 : 0);
})();
