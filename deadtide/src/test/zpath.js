// Zombies and buildings: the player hides in a ground-floor room of several town buildings; 24 walkers start 10-14 cells out.
// After 60 s of game time: how many reached the player, how many hit a town wall (not a door), how many are stuck in place.
// Also: a forest walk — the player can cross the woods (trees only block a thin trunk). Usage: node test/zpath.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const res = await p.evaluate(() => {
    window.__dbg.skipDraw = true; NETROLE = 'solo'; const out = [];
    for (const type of ['apt', 'police', 'villa', 'clinic', 'shop']) {
      startGame(4242, ['甲'], 'normal', 0, 'classic', 'town'); window.__dbg.god = true; W.clock = 9999;
      const H = TOWN_HOUSES.find(h => h[5] === type), [x0, y0, x1, y1] = H, me = W.p[0];
      let spot = null; for (let y = y0 + 1; y < y1 && !spot; y++) for (let x = x0 + 1; x < x1 && !spot; x++) if (standable(x, y, 0, 'p') && x > x0 + 4 && y > y0 + 1) spot = [x, y];
      me.x = spot[0] + 0.5; me.y = spot[1] + 0.5; me.L = 0; me.z = 0;
      W.zs.length = 0; updateFields(0, true);
      const r = mulberry(9); let n = 0;
      for (let k = 0; k < 400 && n < 24; k++) { const a = r() * 6.28, d = 10 + r() * 4 + Math.max(x1 - x0, y1 - y0) / 2, x = Math.floor((x0 + x1) / 2 + Math.cos(a) * d), y = Math.floor((y0 + y1) / 2 + Math.sin(a) * d); if (!inMap(x, y) || !standable(x, y, 0, 'z') || houseInterior(x, y)) continue; const z = spawnZombie('walker', 0); z.x = x + 0.5; z.y = y + 0.5; z.L = 0; z.z = 0; z.spd = 1.1; n++; }
      const wallHits = new Set(), doorHits = new Set(); const orig = zAttackCell;
      window.zAttackCell = (z, i) => { const b = W.blk[i]; if (b === 24 || b === 50) wallHits.add(z.id); else if (b === 7) doorHits.add(z.id); return orig(z, i); };
      const pos = new Map(W.zs.map(z => [z.id, [z.x, z.y]])); let still = 0;
      for (let t = 0; t < 60 / 0.05; t++) { simStep(0.05); if (t === 600) for (const z of W.zs) { pos.set(z.id, [z.x, z.y]); } }
      for (const z of W.zs) { const q = pos.get(z.id); if (q && Math.hypot(z.x - q[0], z.y - q[1]) < 0.3 && Math.hypot(z.x - me.x, z.y - me.y) > 2 && z.st !== 'attack') still++; }
      window.zAttackCell = orig;
      const reached = W.zs.filter(z => Math.hypot(z.x - me.x, z.y - me.y) < 1.6).length;
      out.push({ type, n, reached, wallHits: wallHits.size, doorHits: doorHits.size, still });
    }
    // forest: walk east 30 cells through the woods
    startGame(4242, ['甲'], 'normal', 0, 'classic', 'forest'); window.__dbg.god = true; W.zs.length = 0; W.clock = 9999;
    let best = null; for (let y = 10; y < MH - 10 && !best; y += 3) for (let x = 10; x < MW - 40 && !best; x += 3) { let f = 0; for (let k = 0; k < 30; k++) if (ttAt(x + k, y) === TT.forest) f++; if (f >= 26 && gAt(x, y) === 0) best = [x, y]; }
    const me = W.p[0]; me.x = best[0] + 0.5; me.y = best[1] + 0.5; me.L = 0; me.z = 0; const x0 = me.x;
    let trees = 0; for (let k = 0; k < 30; k++) for (let dy = -1; dy <= 1; dy++) if (W.blk[ci(best[0] + k, best[1] + dy, 0)] === 22) trees++;
    let lx = me.x, side = 0; for (let t = 0; t < 12 / 0.05; t++) { if (t % 6 === 0) { side = me.x - lx < 0.3 ? (side ? side : 1) : 0; lx = me.x; } me.inp.mx = side ? 0.5 : 1; me.inp.my = side * 0.85; simStep(0.05); } // walk east; sidestep when blocked (a rock)
    me.inp.mx = 0; const sx = Math.floor(me.x), sy = Math.floor(me.y); out.push({ forest: true, walked: +(me.x - x0).toFixed(1), trees, at: [me.x.toFixed(2), me.y.toFixed(2)], next: [W.blk[ci(sx + 1, sy, 0)], gAt(sx + 1, sy), ttAt(sx + 1, sy), W.blk[ci(sx + 1, sy - 1, 0)], W.blk[ci(sx + 1, sy + 1, 0)]] });
    return out;
  });
  for (const r of res) console.log('     ', JSON.stringify(r));
  const bld = res.filter(r => !r.forest), tot = bld.reduce((a, r) => a + r.n, 0);
  check('zombies get to the player inside buildings (≥ 70% within 60 s)', bld.reduce((a, r) => a + r.reached, 0) >= tot * 0.7, bld.reduce((a, r) => a + r.reached, 0) + '/' + tot);
  check('they use doors and openings, few hit town walls (≤ 15%)', bld.reduce((a, r) => a + r.wallHits, 0) <= tot * 0.15, bld.reduce((a, r) => a + r.wallHits, 0) + '/' + tot);
  check('nobody stands stuck in place away from the player (≤ 2 per building)', bld.every(r => r.still <= 2), JSON.stringify(bld.map(r => r.still)));
  const f = res.find(r => r.forest);
  check('you can walk straight through the woods (≥ 40 cells in 12 s at full speed... at least 35)', f.walked >= 35, JSON.stringify(f));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
