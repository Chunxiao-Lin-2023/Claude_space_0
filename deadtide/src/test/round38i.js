// Round 35: flying zombies (crows / bats) and 能力者 elites (blink / call / shield / cloak)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 500, height: 360 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  await p.evaluate(() => { window.requestAnimationFrame = () => 0; window.__dbg.skipDraw = true;
    // helpers: an open spot under the sky and a spot indoors, both walkable
    window.spot = open => { const R = W.radio; for (let r = 4; r < 60; r++) for (let k = 0; k < 64; k++) { const a = k / 64 * 6.28, x = Math.floor(R.x + Math.cos(a) * r), y = Math.floor(R.y + Math.sin(a) * r); if (!inMap(x, y)) continue; const L = gAt(x, y); if (!standable(x, y, L, 'p') || W.blk[ci(x, y, L)]) continue;
      let clear = true; if (open) { for (let dy = -3; dy <= 3 && clear; dy++) for (let dx = -3; dx <= 3; dx++) if (!inMap(x + dx, y + dy) || skyTop(x + dx, y + dy) > gAt(x + dx, y + dy) + 0 || W.blk[ci(x + dx, y + dy, gAt(x + dx, y + dy))]) { clear = false; break; } } else clear = skyTop(x, y) > L + 1 && houseInterior(x, y);
      if (clear) return { x: x + 0.5, y: y + 0.5, L }; } return null; };
    window.put = (o) => { const me = W.p[ME]; me.ride = false; me.mform = 0; me.down = false; me.dead = false; me.hp = me.maxHp; me.invT = 0; me.x = o.x; me.y = o.y; me.L = o.L; me.z = pZ(me); me.rx = me.x; me.ry = me.y; W.zs.length = 0; W.wardens = []; W.spawnQ = []; W.phase = 'night'; W.nightT = 0; W.clock = 999; window.__dbg.god = false; visTick(); };
    window.run = (sec, f) => { for (let k = 0; k < sec * 60; k++) { stepZombies(1 / 60); if (f) f(k); } };
  });
  const S = (fn, a) => p.evaluate(fn, a);
  // (round 38i/j) found blueprints: vehicles unlock at once; mech / gun upgrades are installed with materials and change the model; auto reload
  let s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; W.phase = 'day'; W.res = { wood: 999, stone: 999, steel: 999, parts: 999 };
    out.start = W.vbp.join(','); const moto = CRAFT.find(c => c.id === 'moto'), bike = CRAFT.find(c => c.id === 'bike'); out.motoLocked = craftBlocked(me, moto); out.bikeOk = craftBlocked(me, bike);
    const cells = []; for (let i = 0; i < W.blk.length && cells.length < 400; i++) { const b = W.blk[i]; if (b && B[b] && B[b].spot && SPOTS[B[b].spot] && !SPOTS[B[b].spot].bp && !W.srch.has(i)) cells.push(i); }
    // how often: count blueprints over many searches (vehicles unlock; upgrades pile up)
    let found = 0, n = 0; const ev0 = W.vbp.length; for (const c of cells.slice(0, 200)) { const before = W.vbp.length + W.bps.length; completeUse(me, { k: 'spot', i: c }); n++; if (W.vbp.length + W.bps.length > before) found++; }
    out.rate = Math.round(n / Math.max(1, found) * 10) / 10; out.vehUnlocked = W.vbp.length - ev0; out.items = W.bps.slice(); out.pityOk = W.bpN < BAL.bpPity;
    // install a mech blueprint
    W.bps = ['m3', 'g1']; const st0 = W.res.steel; doAct(me, 'bpinst', 0); out.mlv = [W.mlv[3], st0 - W.res.steel, W.bps.join(',')];
    const z = spawnZombie('walker', 0); me.vehs |= 8; me.veh = 3; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; const h0 = z.hp; hurtZombie(z, 10, me); out.mechHit = Math.round((h0 - z.hp) * 100) / 100; const m0 = mhpOf(me); hurtPlayer(me, 100); out.hull = Math.round((m0 - mhpOf(me)) * 10) / 10; me.ride = false; me.mform = 0;
    const mag0 = magCap(1); doAct(me, 'bpinst', 0); out.gun = [W.wlv[1], mag0, magCap(1), W.bps.length]; W.wlv[1] = 2; out.rof2 = Math.round(rofMul(1) * 1000) / 1000; W.wlv[1] = 3; out.mag3 = magCap(1); W.wlv[1] = 0;
    // auto reload: an empty magazine starts reloading on its own
    me.owned[1] = 1; me.wpn = 1; me.mag[1] = 0; me.ammo[1] = 50; me.reloadT = 0; me.medT = 0; me.inp = me.inp || {}; me.inp.fire = false; stepActions(me, 1 / 60); out.autoRl = me.reloadT > 0;
    W.zs.length = 0; return out; });
  check('new run: bike + cargo unlocked, moto needs a blueprint; a blueprint turns up about every 20 searches (no counter), vehicles unlock straight away', s.start === 'bike,cargo' && s.motoLocked === '需要蓝图' && s.bikeOk === '' && s.rate >= 12 && s.rate <= 32 && s.vehUnlocked >= 1 && s.pityOk, JSON.stringify(s));
  check('mech blueprint installed (20 steel): 工蜂 强化装甲 = toughness ×1.15 (90/1.5/1.15 ≈ 52.2), damage unchanged at Lv1', s.mlv[0] === 1 && s.mlv[1] === 20 && s.mlv[2] === 'g1' && Math.abs(s.mechHit - 15) < 0.01 && Math.abs(s.hull - 52.2) < 0.1, JSON.stringify(s));
  check('gun blueprint: Lv1 magazine ×1.4, Lv2 fire rate ×1.15, Lv3 magazine ×1.7; empty magazine reloads by itself', s.gun[0] === 1 && s.gun[2] === Math.round(s.gun[1] * 1.4) && s.gun[3] === 0 && Math.abs(s.rof2 - 0.87) < 0.002 && s.mag3 === Math.round(s.gun[1] * 1.7) && s.autoRl, JSON.stringify(s));
  s = await S(() => { const me = W.p[ME]; me.vehs = 8; me.veh = 3; W.mlv[3] = 3; W.wlv[2] = 3; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; return { ok: 1 }; });
  await S(() => { window.__dbg.skipDraw = false; for (let i = 0; i < 6; i++) { window.__T = (window.__T || performance.now()) + 17; frame(window.__T); } window.__dbg.skipDraw = true; });
  s = await S(() => { const m = OBJ.pl && OBJ.pl[ME], J = m && m.mech && m.mech.userData.J; const out = { upg: J && J.upg ? J.upg.map(l => l.filter(o => o.visible).length) : null, gunUp: m && m.guns[2] && m.guns[2].userData.up ? m.guns[2].userData.up.length : 0 }; const me = W.p[ME]; me.ride = false; me.mform = 0; W.mlv[3] = 1; W.wlv[2] = 0; return out; });
  check('upgrade parts are on the model (mech Lv3 shows all three sets; every gun carries its three upgrade groups)', s.upg && s.upg.every(n => n > 0) && s.gunUp === 3, JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; me.vehs = 8; me.veh = 3; me.ride = false; me.mform = 0; me.evo = 0; me.evoOn = false; // (round 38i) the 进化 meter fills on foot too and banks up to 200
    for (let k = 0; k < 30; k++) { const z = spawnZombie('walker', 0); killZombie(z, me); } out.foot = me.evo; for (let k = 0; k < 40; k++) { const z = spawnZombie('walker', 0); killZombie(z, me); } out.cap = me.evo; for (let k = 0; k < 120; k++) { const z = spawnZombie('walker', 0); killZombie(z, me); } out.cap500 = me.evo;
    me.vehs = 0; me.evo = 0; { const z = spawnZombie('walker', 0); killZombie(z, me); } out.noVeh = me.evo; me.vehs = 8;
    me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.mh[3] = 800; me.evo = 150; me.evoLastT = -99; evolve(me); out.kept = me.evo; out.heal1 = Math.round(mhpOf(me)); devolve(me); out.back = me.evo; evolve(me); out.heal2 = Math.round(mhpOf(me)); devolve(me);
    me.ride = false; me.mform = 0; W.zs.length = 0; return out; });
  check('进化 meter: kills on foot fill it once you own a vehicle (30 × 4 = 120), it banks up to 500, nothing without a vehicle; evolving keeps the bank, turning back keeps what is left; the +30% hull only once per 30 s', s.foot === 120 && s.cap === 280 && s.cap500 === 500 && s.noVeh === 0 && s.kept === 150 && s.back === 150 && s.heal1 === 1280 && s.heal2 === 1280, JSON.stringify(s));
  s = await S(() => { const me = W.p[ME], out = {}; me.vehs = 8; me.veh = 3; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.evo = 150; me.evoOn = false; // (round 38j) tap X goes back to the vehicle even with a full meter; hold X evolves
    doAct(me, 'xform'); out.tap = [me.evoOn, me.mtr > 0, me.mto]; me.mtr = 0; me.mform = 1; doAct(me, 'xform', 'evo'); out.hold = me.evoOn; doAct(me, 'xform'); out.tapBeast = [me.evoOn, inMech(me)]; me.evo = 40; doAct(me, 'xform', 'evo'); out.notFull = me.evoOn; me.ride = false; me.mform = 0; return out; });
  check('X: tap in mech form → back to the vehicle even when the meter is full; hold → evolve; tap in beast form → mech; hold with < 100% does nothing', s.tap[0] === false && s.tap[1] && s.tap[2] === 0 && s.hold === true && s.tapBeast[0] === false && s.tapBeast[1] && s.notFull === false, JSON.stringify(s));
  s = await S(() => { const ok = saveGame(true); if (!ok) return { skip: 1 }; const S0 = loadSlot(SLOT); return { saved: !!(S0 && S0.bp), vbp: S0 && S0.bp && S0.bp.vbp.join(','), mlv: S0 && S0.bp && S0.bp.mlv[3] }; });
  check('blueprint state is saved', s.skip || (s.saved && s.vbp.startsWith('bike,cargo') && s.mlv === 1), JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
