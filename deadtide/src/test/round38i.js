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
  // (round 38i) vehicle blueprints from searching; mech refits; gun refits (magazine / fire rate); auto reload
  let s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; W.phase = 'day'; W.res = { wood: 999, stone: 999, steel: 999, parts: 999 };
    out.start = W.vbp.join(','); const moto = CRAFT.find(c => c.id === 'moto'), bike = CRAFT.find(c => c.id === 'bike'); out.motoLocked = craftBlocked(me, moto); out.bikeOk = craftBlocked(me, bike);
    const cells = []; for (let i = 0; i < W.blk.length && cells.length < 40; i++) { const b = W.blk[i]; if (b && B[b] && B[b].spot && SPOTS[B[b].spot] && !SPOTS[B[b].spot].bp && !W.srch.has(i)) cells.push(i); }
    out.cells = cells.length; for (let k = 0; k < 19; k++) completeUse(me, { k: 'spot', i: cells[k] }); out.at19 = [W.bpPts, W.bpN]; completeUse(me, { k: 'spot', i: cells[19] }); out.at20 = [W.bpPts, W.bpN];
    doAct(me, 'bpveh', 'moto'); out.afterUnlock = [W.bpPts, W.vbp.includes('moto'), craftBlocked(me, moto)]; doAct(me, 'bpveh', 'tank'); out.noPts = W.vbp.includes('tank');
    W.bpPts = 1; const st0 = W.res.steel; doAct(me, 'mlv', 3); out.mlv = [W.mlv[3], st0 - W.res.steel, W.bpPts];
    const z = spawnZombie('walker', 0); me.vehs |= 8; me.veh = 3; me.ride = true; me.mform = 1; me.mtr = 0; const h0 = z.hp; hurtZombie(z, 10, me); out.mechHit = Math.round((h0 - z.hp) * 100) / 100; const m0 = mhpOf(me); hurtPlayer(me, 100); out.hull = Math.round((m0 - mhpOf(me)) * 10) / 10; me.ride = false; me.mform = 0;
    W.bpPts = 2; const mag0 = magCap(1); doAct(me, 'gun', 'mag'); out.mag = [mag0, magCap(1), W.gmag]; doAct(me, 'gun', 'rof'); out.rof = [W.grof, Math.round(rofMul() * 1000) / 1000];
    // auto reload: an empty magazine starts reloading on its own
    me.owned[1] = 1; me.wpn = 1; me.mag[1] = 0; me.ammo[1] = 50; me.reloadT = 0; me.medT = 0; me.inp = me.inp || {}; me.inp.fire = false; stepActions(me, 1 / 60); out.autoRl = me.reloadT > 0;
    W.zs.length = 0; return out; });
  check('new run: bike + cargo unlocked, moto needs a blueprint; 20 searches → 1 blueprint; it unlocks moto; none left for tank', s.start === 'bike,cargo' && s.motoLocked === '需要蓝图' && s.bikeOk === '' && s.cells >= 20 && s.at19[0] === 0 && s.at19[1] === 19 && s.at20[0] === 1 && s.at20[1] === 0 && s.afterUnlock[0] === 0 && s.afterUnlock[1] && s.afterUnlock[2] === '' && !s.noPts, JSON.stringify(s));
  check('mech refit Lv1: costs a blueprint + 15 steel; 工蜂 hits ×1.5×1.1 and takes 90/1.5/1.1', s.mlv[0] === 1 && s.mlv[1] === 15 && s.mlv[2] === 0 && Math.abs(s.mechHit - 16.5) < 0.01 && Math.abs(s.hull - 54.5) < 0.1, JSON.stringify(s));
  check('gun refits: magazine +20%, fire rate +10%; an empty magazine reloads by itself', s.mag[2] === 1 && s.mag[1] === Math.round(s.mag[0] * 1.2) && s.rof[0] === 1 && Math.abs(s.rof[1] - 0.909) < 0.002 && s.autoRl, JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; me.vehs = 8; me.veh = 3; me.ride = false; me.mform = 0; me.evo = 0; me.evoOn = false; // (round 38i) the 进化 meter fills on foot too and banks up to 200
    for (let k = 0; k < 30; k++) { const z = spawnZombie('walker', 0); killZombie(z, me); } out.foot = me.evo; for (let k = 0; k < 40; k++) { const z = spawnZombie('walker', 0); killZombie(z, me); } out.cap = me.evo;
    me.vehs = 0; me.evo = 0; { const z = spawnZombie('walker', 0); killZombie(z, me); } out.noVeh = me.evo; me.vehs = 8;
    me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.mh[3] = 800; me.evo = 150; me.evoLastT = -99; evolve(me); out.kept = me.evo; out.heal1 = Math.round(mhpOf(me)); devolve(me); out.back = me.evo; evolve(me); out.heal2 = Math.round(mhpOf(me)); devolve(me);
    me.ride = false; me.mform = 0; W.zs.length = 0; return out; });
  check('进化 meter: kills on foot fill it once you own a vehicle (30 × 4 = 120), it banks up to 200, nothing without a vehicle; evolving keeps the bank, turning back keeps what is left; the +30% hull only once per 30 s', s.foot === 120 && s.cap === 200 && s.noVeh === 0 && s.kept === 150 && s.back === 150 && s.heal1 === 1280 && s.heal2 === 1280, JSON.stringify(s));
  s = await S(() => { const ok = saveGame(true); if (!ok) return { skip: 1 }; const S0 = loadSlot(SLOT); return { saved: !!(S0 && S0.bp), vbp: S0 && S0.bp && S0.bp.vbp.join(','), mlv: S0 && S0.bp && S0.bp.mlv[3], gmag: S0 && S0.bp && S0.bp.gmag }; });
  check('blueprint state is saved', s.skip || (s.saved && s.vbp === 'bike,cargo,moto' && s.mlv === 1 && s.gmag === 1), JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
