// Every floor that leads up has a ladder, on every map, over 8 seeds each (loot must never land on a ladder's exit).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } }); await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  console.log(await p.evaluate(() => { window.__dbg.skipDraw = true; NETROLE = 'solo'; const bad = [];
    for (const m of MAP_IDS) for (let seed = 1; seed < 9; seed++) { startGame(seed * 104729, ['a'], 'normal', 0, 'classic', m);
      for (const [x0, y0, x1, y1, st, t] of TOWN_HOUSES) { const need = t === 'garage' || t === 'barn' ? 0 : t === 'ware' || t === 'shop' ? 1 : t === 'villa' ? st - 1 : st; for (let L = 0; L < need; L++) { let n = 0; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (inMap(x, y) && W.blk[ci(x, y, L)] === 6) n++; if (!n) bad.push(m + ':' + seed + ':' + t + ':L' + L); } } }
    return bad.length ? 'FAIL ' + bad.slice(0, 20).join(' ') : 'ALL PASS all floors have ladders (6 maps x 8 seeds)'; }));
  await b.close();
})();
