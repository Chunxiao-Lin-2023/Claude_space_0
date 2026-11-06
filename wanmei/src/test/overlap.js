// node test/overlap.js — map lint: no prop may interpenetrate a building / rock / trunk, no NPC may stand inside one
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage();
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); startSolo(null); });
  await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => {
    const hard = [], all = []; for (const it of STATIC.list) { const f = fpOf(it.P, it.x, it.z, it.s); f.name = it.P.name; f.lift = liftAt(it.x, it.z); all.push(f); if (!f.soft) hard.push(f); }
    const C = 8, G = new Map(); for (const h of hard) { const k = Math.floor(h.x / C) + ',' + Math.floor(h.z / C); (G.get(k) || G.set(k, []).get(k)).push(h); }
    const bad = []; const near = f => { const out = [], ci = Math.floor(f.x / C), cj = Math.floor(f.z / C); for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) for (const h of G.get(i + ',' + j) || []) out.push(h); return out; };
    for (const f of all) { const t = f.soft ? Object.assign({}, f, f.r != null ? { r: f.r * 0.45 } : { hw: f.hw * 0.45, hd: f.hd * 0.45 }) : f; for (const h of near(f)) { if (h === f || (!f.soft && all.indexOf(h) < all.indexOf(f))) continue; if (h.lift !== f.lift) continue; const g = fpGap(t, h); if (g < -0.05) bad.push(`${f.name}@${f.x.toFixed(1)},${f.z.toFixed(1)} ⟂ ${h.name}@${h.x.toFixed(1)},${h.z.toFixed(1)} (${g.toFixed(2)}m)`); } }
    const npcIn = []; for (const e of W.ents) { if (e.type !== 'npc' || !e.R || e.A.pose === 'sit' || e.dy > 0) continue; const hx = e.home ? e.home.x : e.x, hz = e.home ? e.home.z : e.z, f = { x: hx, z: hz, r: 0.3 }; for (const h of near(f)) if (fpGap(f, h) < 0) npcIn.push(`${e.name} home@${hx.toFixed(1)},${hz.toFixed(1)} in ${h.name}`); }
    return { n: all.length, hard: hard.length, bad, npcIn, skipped: PLACE.skipped.slice() };
  });
  console.log('props', r.n, 'hard', r.hard, 'skipped(hand-placed, no free spot):', r.skipped.length, r.skipped.slice(0, 10).join(' '));
  for (const s of r.bad.slice(0, 30)) console.log('OVERLAP', s); for (const s of r.npcIn.slice(0, 20)) console.log('NPC-IN', s);
  const fail = r.bad.length + r.npcIn.length; console.log(fail ? `OVERLAP FAIL ${r.bad.length} props, ${r.npcIn.length} npcs` : 'OVERLAP PASS');
  await b.close(); process.exit(fail ? 1 : 0);
})();
