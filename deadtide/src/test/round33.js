// Round 33: bigger maps (240 with themed outskirts), the task list is a collapsed pill, ammo caps (guns 500, gyro 500, tank 200),
// swapping guns reloads the holstered one, the bike is quiet / mud-proof / shoots almost at full rate
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  // every map: 240 square, outskirts scenes placed, no road through any building, scenes clear of each other
  let s = await p.evaluate(() => { window.__dbg.skipDraw = true; NETROLE = 'solo'; const out = {};
    for (const m of MAP_IDS) { startGame(104729, ['a'], 'normal', 0, 'classic', m);
      const X = MAPDEF.outskirts, kinds = new Set(X.placed.map(q => q.key)); let thru = 0, lad = 0, tot = 0;
      for (const [x0, y0, x1, y1, st, t] of TOWN_HOUSES) { for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) if (ttAt(x, y) === TT.road) { thru++; y = 1e9; break; }
        const need = t === 'garage' || t === 'barn' ? 0 : t === 'ware' || t === 'shop' ? 1 : t === 'villa' ? st - 1 : st;
        for (let L = 0; L < need; L++) { tot++; let n = 0; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (inMap(x, y) && W.blk[ci(x, y, L)] === 6) n++; if (!n) lad++; } }
      out[m] = { mw: MW, mh: MH, scenes: X.placed.length, kinds: kinds.size, thru, lad, tot, list: SCENES[m].every(k => SC[k] && SCENE_NAME[k]) }; }
    return out; });
  for (const m in s) check(m + ': 240 map, 10+ outskirts scenes of the map\'s own kinds, no road through a building, every floor has a ladder', s[m].mw === 240 && s[m].scenes >= 10 && s[m].kinds >= 6 && s[m].list && s[m].thru === 0 && s[m].lad === 0, JSON.stringify(s[m]));
  // a real game: the task pill starts collapsed and doesn't move the ready button when opened
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  s = await p.evaluate(() => new Promise(r => setTimeout(() => { const t = $('tasks'), rb = $('readyBtn').getBoundingClientRect(), lst = t.querySelector('.tklist');
    const closed = !t.classList.contains('open') && (!lst || getComputedStyle(lst).display === 'none'), h0 = t.getBoundingClientRect().height;
    t.querySelector('.tksum').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => { const lst2 = t.querySelector('.tklist'), rb2 = $('readyBtn').getBoundingClientRect();
      const res = { closed, h0, open: t.classList.contains('open') && lst2 && getComputedStyle(lst2).display !== 'none', rbSame: Math.abs(rb.top - rb2.top) < 1 && Math.abs(rb.left - rb2.left) < 1, txt: t.querySelector('.tksum').textContent };
      t.querySelector('.tksum').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => { res.closedAgain = !t.classList.contains('open'); r(res); }, 300); }, 300); }, 600)));
  check('task pill: collapsed at start (one short line), opens as a dropdown without moving the ready button, closes again', s.closed && s.h0 < 40 && s.open && s.rbSame && s.closedAgain && /任务/.test(s.txt), JSON.stringify(s));
  // ammo caps
  s = await p.evaluate(() => ({ rifle: ammoCap(2), shot: ammoCap(1), snipe: ammoCap(3), gl: ammoCap(6), tank: BAL.tankCap, tankS: BAL.tankStart, gyro: BAL.gyroCap, gyroS: BAL.gyroStart }));
  check('ammo caps: guns 500 (grenade launcher 100), gyrocopter 500 (comes with 250), tank 200 (comes with 100)', s.rifle === 500 && s.shot === 500 && s.snipe === 500 && s.gl === 100 && s.tank === 200 && s.tankS === 100 && s.gyro === 500 && s.gyroS === 250, JSON.stringify(s));
  // swapping guns: the half-empty one reloads in the holster; drawing an empty gun starts its reload
  s = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; W.spawnQ = []; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 100); me.wpn = 2; me.mag[2] = 11; me.mag[1] = 0; me.reloadT = 0; me.rlBg = WPN.map(() => 0);
    doAct(me, 'wpn', 1); const bg = me.rlBg[2], drawRl = me.reloadT > 0 && me.reloadW === 1; return { bg, drawRl }; });
  await p.evaluate(() => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 > 2.6 ? r() : setTimeout(f, 50); f(); }));
  s.after = await p.evaluate(() => ({ rifle: W.p[0].mag[2], shot: W.p[0].mag[1] }));
  check('swapping guns: the half-empty rifle reloads in the holster, the empty shotgun you draw starts reloading at once', s.bg > 1 && s.drawRl && s.after.rifle === 30 && s.after.shot === 6, JSON.stringify(s));
  // the bike: almost full fire rate, no mud slow-down, no engine noise; the motorbike is loud
  s = await p.evaluate(() => { const me = W.p[0]; me.ride = true; me.veh = 1; const bk = rideK(me).rate; me.veh = 2; const mo = rideK(me).rate; me.ride = false;
    return { bk, mo, quiet: !VEH[1].noise && VEH[1].quiet, mud: !!VEH[1].mud, motoNoise: VEH[2].noise > 0 }; });
  check('bike: shoots at ~full rate (moto 2.5x slower), mud-proof, silent; motorbike makes engine noise', s.bk < 1.3 && s.mo === 2.5 && s.quiet && s.mud && s.motoNoise, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
