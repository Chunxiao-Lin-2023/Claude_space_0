// node test/travel.js — walk through every area gap and check you arrive in the linked area (pet follows), and that quest routing points at the right gap
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); for (const p of W.P) p.script = false; });
  let fail = 0;
  const links = await pg.evaluate(() => AREAS.flatMap(A => A.links.map((L, i) => [A.id, i, L.to.id])));
  for (const [aid, i, toId] of links) {
    const r = await pg.evaluate(async ([aid, i]) => { const A = AREA_BY[aid], L = A.links[i], me = W.P[0]; const [sx, sz] = gapPoint(A, L.side, L.c, 6), [gx, gz] = gapPoint(A, L.side, L.c, -1); teleport(me, sx, sz); await new Promise(r => setTimeout(r, 300)); walkTo(me, gx, gz, 6); for (let t = 0; t < 60 && !W.transit; t++) await new Promise(r => setTimeout(r, 100)); for (let t = 0; t < 40 && W.transit; t++) await new Promise(r => setTimeout(r, 100)); me.walk = null; const B = areaAt(me.x, me.z), pet = W.P[1]; return [B && B.id, pet ? areaAt(pet.x, pet.z) && areaAt(pet.x, pet.z).id : null, tileSolid(me.x, me.z)]; }, [aid, i]);
    const ok = r[0] === toId && r[1] === toId && !r[2]; if (!ok) fail++; console.log(ok ? 'ok  ' : 'BAD ', aid, '→', toId, JSON.stringify(r));
  }
  const rt = await pg.evaluate(() => { const v = routeTo(0, 60, NEST.x, NEST.z); return [v.via, Math.round(v.x), Math.round(v.z)]; }); console.log('route village→nest goes via', JSON.stringify(rt)); if (rt[0] !== '山林') fail++;
  console.log(fail ? `TRAVEL FAIL ${fail}` : 'TRAVEL PASS'); await b.close(); process.exit(fail ? 1 : 0);
})();
