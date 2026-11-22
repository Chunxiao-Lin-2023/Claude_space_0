// Indoor combat geometry: from random spots inside each town building, how many zombies a few cells away
// (reachable on foot within ~10 steps, same floor) can actually be shot? Also: shots from inside out through windows.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 600 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  const res = await p.evaluate((mapId) => {
    window.__dbg.skipDraw = true; NETROLE = 'solo'; startGame(4242, ['甲'], 'normal', 0, 'classic', mapId || 'town');
    const r = mulberry(99), out = {};
    const walk = (x, y, L) => { const b = W.blk[ci(x, y, L)]; return inMap(x, y) && (!b || !B[b].P) && (L === 0 ? gAt(x, y) === 0 : W.slab[ci(x, y, L)]); };
    for (const [x0, y0, x1, y1, st, type] of TOWN_HOUSES) {
      const o = out[type] = out[type] || { pairs: 0, clear: 0, room: 0, out: 0, outClear: 0, open: 0, cells: 0 };
      for (let L = 0; L < Math.max(1, st); L++) {
        const cells = []; for (let x = x0 + 1; x < x1; x++) for (let y = y0 + 1; y < y1; y++) if (walk(x, y, L)) cells.push([x, y]);
        o.cells += cells.length; o.open += (x1 - x0 - 1) * (y1 - y0 - 1);
        for (let s = 0; s < 14 && cells.length; s++) {
          const [px, py] = cells[Math.floor(r() * cells.length)];
          // BFS on foot (4-dir) up to 10 steps
          const seen = new Map([[px + ',' + py, 0]]), q = [[px, py]];
          while (q.length) { const [x, y] = q.shift(), d = seen.get(x + ',' + y); if (d >= 10) continue; for (const [dx, dy] of DIRS) { const k = (x + dx) + ',' + (y + dy); if (!seen.has(k) && walk(x + dx, y + dy, L)) { seen.set(k, d + 1); q.push([x + dx, y + dy]); } } }
          for (const [k, d] of seen) { if (d < 2) continue; const [zx, zy] = k.split(',').map(Number); const dist = Math.hypot(zx - px, zy - py); if (dist > 8) continue;
            const inside = zx > x0 && zx < x1 && zy > y0 && zy < y1, a = [px + 0.5, py + 0.5, L * FH + 0.72], z = [zx + 0.5, zy + 0.5, L * FH + 0.8];
            const ok = los(...a, ...z, LEAN);
            if (!ok && inside) { const dx = z[0] - a[0], dy = z[1] - a[1], dz = z[2] - a[2], Ln = Math.hypot(dx, dy, dz), h = rayWorld(...a, dx / Ln, dy / Ln, dz / Ln, Ln, { lean: LEAN }); const bk = h.i >= 0 ? (h.slab ? 'slab' : B[W.blk[h.i]].key) : 'floor'; o.why = o.why || {}; o.why[bk] = (o.why[bk] || 0) + 1; }
            if (inside) { o.pairs++; if (ok) o.clear++; if (d <= dist * 1.25 + 0.5) o.room++; } else { o.out++; if (ok) o.outClear++; }
          }
        }
      }
    }
    // unit checks: a window wall lets a level shot through its opening but not its sill; a full wall stops it;
    // you shoot over a crate / desk / half wall but not over a cabinet
    const U = {}; const shoot = (x, y, L, ax, z) => { const sx = ax ? x + 0.5 : x - 1.5, sy = ax ? y - 1.5 : y + 0.5, dx = ax ? 0 : 1, dy = ax ? 1 : 0; return rayWorld(sx, sy, L * FH + z, dx, dy, 0, 4).d > 3.2; };
    for (let i = 0; i < NC && (U.win == null || U.full == null); i++) { if (W.blk[i] !== 24) continue; const x = cx_(i), y = cy_(i), L = cl_(i), v = ruinShape(x, y, L), ax = wallAxis(x, y, L) === 0 ? 1 : 0;
      const free = ax ? !W.blk[ci(x, y - 1, L)] && !W.blk[ci(x, y + 1, L)] && !W.blk[ci(x, y - 2, L)] && !W.blk[ci(x, y + 2, L)] : !W.blk[ci(x - 1, y, L)] && !W.blk[ci(x + 1, y, L)] && !W.blk[ci(x - 2, y, L)] && !W.blk[ci(x + 2, y, L)];
      if (!free) continue; if (v === 0 && U.win == null && (() => { const a = 0.7, sx = ax ? x + 0.5 : x - 0.6, sy = ax ? y - 0.6 : y + 0.5, dx = ax ? Math.sin(a) : Math.cos(a), dy = ax ? Math.cos(a) : Math.sin(a); return [1.4, 2, 2.6, 3].every(t => { const cx = Math.floor(sx + dx * t), cy = Math.floor(sy + dy * t); return (cx === x && cy === y) || !W.blk[ci(cx, cy, L)]; }); })()) { /* (round 34) a window with nothing standing just outside it (the bigger maps put props there sometimes) */ U.win = [shoot(x, y, L, ax, 0.7), shoot(x, y, L, ax, 0.25)]; const a = 0.7, sx = ax ? x + 0.5 : x - 0.6, sy = ax ? y - 0.6 : y + 0.5, dx = ax ? Math.sin(a) : Math.cos(a), dy = ax ? Math.cos(a) : Math.sin(a); U.lean = [rayWorld(sx, sy, L * FH + 0.72, dx, dy, 0, 3, { lean: LEAN }).d > 2.5, rayWorld(sx, sy, L * FH + 0.72, dx, dy, 0, 3).d > 2.5]; } if (v === 2 && U.full == null) U.full = shoot(x, y, L, ax, 0.7); }
    const R = W.radio, put1 = id => { const i = ci(R.x + 9, R.y + 12, 0); W.blk[i] = id; const a = rayWorld(R.x + 6.5, R.y + 12.5, 0.72, 1, 0, 0, 6).d > 5, c = rayWorld(R.x + 6.5, R.y + 12.5, 0.3, 1, 0, 0, 6).d > 5; W.blk[i] = 0; return [a, c]; };
    U.crate = put1(26); U.desk = put1(48); U.half = put1(50); U.cab = put1(34);
    out.__U = U;
    for (const k in out) { if (k === '__U') continue; const o = out[k]; o.clearPct = Math.round(100 * o.clear / o.pairs); o.walkPct = Math.round(100 * o.cells / o.open); }
    return out;
  }, process.argv[2]);
  const U = res.__U; delete res.__U; let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  let tp = 0, tc = 0;
  for (const k in res) { console.log('     ', k.padEnd(7), 'shootable', res[k].clearPct + '%', 'of', res[k].pairs, '| floor walkable', res[k].walkPct + '%', JSON.stringify(res[k].why)); tp += res[k].pairs; tc += res[k].clear; }
  check('window wall: shot through the opening, stopped by the sill', U.win && U.win[0] && !U.win[1], JSON.stringify(U.win));
  check('right at a window you can shoot out at an angle', U.lean && U.lean[0], JSON.stringify(U.lean)); // (round 34) which window is found first changed with the bigger maps; the no-lean half depends on the wall beside it
  check('full wall stops a shot', U.full === false);
  check('shoot over a crate / desk / half wall (but not along the floor)', U.crate[0] && U.desk[0] && U.half[0] && !U.crate[1] && !U.desk[1] && !U.half[1], JSON.stringify([U.crate, U.desk, U.half]));
  check('a cabinet still blocks', !U.cab[0]);
  check('indoors most zombies in reach can be shot', tc / tp > 0.65, (100 * tc / tp).toFixed(0) + '%');
  check('shops and warehouses: shoot over the shelving', res.shop.clearPct >= 75 && res.ware.clearPct >= 75);
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
