// Terrain variety and vegetation per map: tree / rock counts, trees next to roads (must be 0), share of each ground type,
// farmsteads present, no page errors. Usage: node test/terrain.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 600 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true;
  for (const m of await p.evaluate(() => MAP_IDS)) {
    const r = await p.evaluate(m => {
      window.__dbg.skipDraw = true; NETROLE = 'solo'; startGame(4242, ['甲'], 'normal', 0, 'classic', m);
      const c = { tree: 0, rock: 0, bush: 0, roadTree: 0, farmWalls: 0 }, tt = {}; let land = 0;
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const t = ttAt(x, y); if (t !== TT.water) { land++; tt[t] = (tt[t] || 0) + 1; }
        const b = W.blk[ci(x, y, gAt(x, y))]; if (b === 22) { c.tree++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (ttAt(x + dx, y + dy) === TT.road) { c.roadTree++; dy = dx = 9; } }
        if (b === 21) c.rock++; if (b === 41) c.bush++;
        if ((b === 24 || b === 50) && HOUSE_ID[y * MW + x] < 0) c.farmWalls++;
      }
      const pct = {}; for (const k in TT) if (tt[TT[k]]) pct[k] = +(100 * tt[TT[k]] / land).toFixed(1);
      // mud slows a walking player
      const me = W.p[0]; let mud = null; for (let y = 0; y < MH && !mud; y++) for (let x = 0; x < MW && !mud; x++) if (ttAt(x, y) === TT.mud && gAt(x, y) === 0 && !W.blk[ci(x, y, 0)]) mud = [x, y];
      return { c, pct, treesPerLand: +(c.tree / land * 100).toFixed(1), mud: !!mud && inMud(mud[0] + 0.5, mud[1] + 0.5, 0), deco: OBJ.deco ? Object.fromEntries(Object.entries(OBJ.deco).map(([k, v]) => [k, v.count])) : null };
    }, m);
    const pass = r.c.roadTree === 0 && r.c.farmWalls > 0;
    if (!pass) ok = false;
    console.log((pass ? 'PASS ' : 'FAIL ') + m.padEnd(8), 'trees', r.c.tree, '(' + r.treesPerLand + '% of land)', 'rocks', r.c.rock, 'bushes', r.c.bush, 'trees by road', r.c.roadTree, 'farm walls', r.c.farmWalls, 'mud ok', r.mud, JSON.stringify(r.pct), JSON.stringify(r.deco));
  }
  console.log(errs.length ? 'FAIL errs ' + errs.join(' | ') : 'PASS no page errors'); if (errs.length) ok = false;
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
