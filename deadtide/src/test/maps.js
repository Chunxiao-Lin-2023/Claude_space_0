// Every map preset: generation time, buildings standing on land, camp clear, ladders, a big-map screenshot each.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 900, height: 900 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const ids = await p.evaluate(() => MAP_IDS);
  for (const id of ids) {
    const r = await p.evaluate(id => { window.__dbg.skipDraw = true; const t0 = performance.now(); setMap(id); startGame(4242, ['甲'], 'normal', 0); const t1 = performance.now();
      const walls = TOWN_HOUSES.map(([x0, y0, x1, y1]) => { let n = 0, wet = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (W.tt[y * MW + x] === TT.water) wet++; for (let L = 0; L < 3; L++) if (W.blk[ci(x, y, L)] === 24) n++; } return [n, wet]; });
      let campBad = 0; for (let y = W.radio.y - 6; y <= W.radio.y + 6; y++) for (let x = W.radio.x - 7; x <= W.radio.x + 7; x++) if (W.G[y * MW + x] !== 0 || W.tt[y * MW + x] === TT.water) campBad++;
      let lad = 0; for (let i = 0; i < NC; i++) if (W.blk[i] === 6) lad++;
      const sp = spotCount(); let cars = 0; for (let i = 0; i < NC; i++) if (W.blk[i] === 25) cars++;
      // can you walk from the camp to every building's door? flood fill over standable ground (bridges included)
      const seen = new Uint8Array(MW * MH), q = [W.radio.y * MW + W.radio.x + 8]; seen[q[0]] = 1;
      while (q.length) { const u = q.pop(), x = u % MW, y = Math.floor(u / MW); for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue; const v = ny * MW + nx; if (seen[v]) continue; const g = W.G[v]; if (transition(x, y, nx, ny, W.G[u], 'p', true) < 0 && !standable(nx, ny, 0, 'p')) continue; seen[v] = 1; q.push(v); } }
      const reach = TOWN_HOUSES.map(([x0, y0, x1, y1]) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (seen[y * MW + x]) return 1; return 0; });
      return { ms: Math.round(t1 - t0), houses: TOWN_HOUSES.length, walls: walls.map(w => w[0]), wet: walls.reduce((a, w) => a + w[1], 0), campBad, lad, spots: Object.values(sp).reduce((a, b) => a + b, 0), cars, reach: reach.join('') };
    }, id);
    console.log(id, JSON.stringify(r));
    check(id + ': every building has walls, none in water', r.walls.every(n => n > 30) && r.wet === 0, 'walls ' + r.walls.join(',') + ' wet ' + r.wet);
    check(id + ': camp is flat dry ground', r.campBad === 0, 'bad ' + r.campBad);
    check(id + ': every building reachable on foot from the camp', !r.reach.includes('0'), r.reach);
    await p.evaluate(() => { window.__dbg.skipDraw = false; document.getElementById('hud').style.opacity = 0.1; toggleBigMap(true); }); await p.waitForTimeout(500);
    await p.screenshot({ path: OUT + '/map_' + id + '.png', clip: await p.evaluate(() => { const r = document.getElementById('bigmapC').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }) });
    await p.evaluate(() => toggleBigMap(false));
    await p.evaluate(() => { const me = W.p[0]; CAM.zoom = 14; CAM.rot = 0; }); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + '/view_' + id + '.png' });
  }
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | ')); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
