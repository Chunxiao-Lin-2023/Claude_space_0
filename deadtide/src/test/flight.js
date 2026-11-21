// Round 29: the gyrocopter — takes off only from open ground / a roof, hovers over buildings, burns fuel, can't shoot, lands on T, comes down when empty, refuels indoors
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  // find a roofed room and a roof to stand on, plus open ground
  const spots = await p.evaluate(() => { window.__dbg.god = true; W.phase = 'day'; W.clock = 999; W.zs.length = 0; W.spawnQ = []; const me = W.p[0]; me.vehs |= 1 << 5; me.fuel = 60;
    let room = null, roof = null;
    for (let r = 2; r < 60 && !(room && roof); r++) for (let dy = -r; dy <= r && !(room && roof); dy++) for (let dx = -r; dx <= r; dx++) {
      const x = W.radio.x + dx, y = W.radio.y + dy; if (!inMap(x, y)) continue; const t = skyTop(x, y);
      if (!room && t >= 1 && !W.blk[ci(x, y, 0)] && support(x, y, 0) && !W.blk[ci(x, y, 1)]) room = { x, y, L: 0 };
      if (!roof && t >= 2 && W.slab[ci(x, y, t)] && !W.blk[ci(x, y, t)]) roof = { x, y, L: t };
    }
    const x = W.radio.x + 20, y = W.radio.y + 20, L = gAt(x, y); for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) for (let l = L; l < L + 4; l++) { W.blk[ci(x + dx, y + dy, l)] = 0; if (l > L) W.slab[ci(x + dx, y + dy, l)] = 0; } W.ver++;
    return { room, roof, open: { x, y, L } }; });
  const tp = s => p.evaluate(s => { const me = W.p[0]; me.x = s.x + 0.5; me.y = s.y + 0.5; me.L = s.L; me.z = surfZ(me.x, me.y, s.L); me.zv = me.z; }, s);
  // indoors: refused
  await tp(spots.room); let s = await p.evaluate(() => { doAct(W.p[0], 'ride', 5); return { ride: W.p[0].ride, top: skyTop(W.p[0].x, W.p[0].y), L: W.p[0].L }; });
  check('inside a building (roof overhead) the gyrocopter will not take off', !s.ride && s.top > s.L, JSON.stringify(s));
  // refuel indoors
  s = await p.evaluate(() => { const me = W.p[0]; me.fuel = 20; const t = useTarget(me); if (t && t.k === 'fuel') completeUse(me, t); return { k: t && t.k, name: t && t.name, fuel: me.fuel }; });
  check('in a roofed room F refuels it (to 60 s)', s.k === 'fuel' && s.fuel === 60, JSON.stringify(s));
  // (round 30) chin-gun ammo is bought in the shop like gun ammo
  s = await p.evaluate(() => { const me = W.p[0]; me.gam = 0; for (const k in W.res) W.res[k] = 99; const can = canCraft(me), blk = craftBlocked(me, CRAFT.find(c => c.gam)); doCraft(me, 'gammo'); return { can, blk, gam: me.gam }; });
  check('in a building you can buy 150 chin-gun rounds for the gyrocopter', s.can && !s.blk && s.gam === 150, JSON.stringify(s));
  s = await p.evaluate(() => { const me = W.p[0]; me.fuel = 12; const blk = craftBlocked(me, CRAFT.find(c => c.fuel)); doCraft(me, 'gfuel'); SET.shopTab = 'veh'; openCraft(); const card = /旋翼机油箱/.test($('clist').textContent); closeCraft(); return { blk, fuel: me.fuel, card, full: craftBlocked(me, CRAFT.find(c => c.fuel)) }; });
  check('the shop refuels it too (any time it is not full; free and instant), with its own card in the 载具 tab', !s.blk && s.fuel === 60 && s.card && s.full === '油是满的', JSON.stringify(s));
  // from a roof: allowed
  await tp(spots.roof); s = await p.evaluate(() => { doAct(W.p[0], 'ride', 5); const r = W.p[0].ride; doAct(W.p[0], 'ride'); return r; });
  check('on a roof it can take off', s, JSON.stringify(spots.roof));
  await simWait(3);
  await p.evaluate(() => { const me = W.p[0]; me.ride = false; me.land = false; me.alt = 0; });
  // open ground: up it goes
  await tp(spots.open); await p.evaluate(() => { W.p[0].fuel = 60; doAct(W.p[0], 'ride', 5); });
  await simWait(2.5);
  s = await p.evaluate(() => { const me = W.p[0]; return { ride: me.ride, air: +(me.z - surfZ(me.x, me.y, skyTop(me.x, me.y))).toFixed(2), fuel: +me.fuel.toFixed(1), L: me.L }; });
  check('from open ground it climbs to about 2 floors up and burns about 1 s of fuel per second', s.ride && s.air > 2.2 && s.fuel < 58.5 && s.fuel > 56, JSON.stringify(s));
  // zombies below can't bite; no shooting from the air
  s = await p.evaluate(async () => { const me = W.p[0]; const z = putZombie('walker', Math.floor(me.x), Math.floor(me.y), skyTop(me.x, me.y)); z.sleep = 0; const hp = me.hp, mag = me.mag[me.wpn]; window.__dbg.god = false; me.inp.fire = 1; me.cdW = me.cdW.map(() => 0); await new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= 1.5 ? r() : setTimeout(f, 30); f(); }); me.inp.fire = 0; window.__dbg.god = true; return { hp0: hp, hp: me.hp, mag0: mag, mag: me.mag[me.wpn], zd: +Math.hypot(z.x - me.x, z.y - me.y).toFixed(1) }; });
  check('a zombie right under it cannot bite, and your own gun stays quiet in the air', s.hp === s.hp0 && s.mag === s.mag0, JSON.stringify(s));
  // (round 30) the chin gun shoots what you aim at, from the aircraft's own ammo
  await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; const z = putZombie('walker', Math.floor(me.x) + 3, Math.floor(me.y), skyTop(me.x + 3, me.y)); z.sleep = 0; z.hp = z.max = 600; z.stun = 99; z.mz = 1;
    window.__g0 = { g: me.gam, mag: me.mag[me.wpn], z }; window.__dbg.aimAt = () => ({ x: z.x, y: z.y, z: z.z + 0.8, zb: z }); });
  await p.mouse.move(500, 320); await p.mouse.down(); await simWait(1.0); await p.mouse.up();
  s = await p.evaluate(() => { const me = W.p[0], G = window.__g0; window.__dbg.aimAt = null; return { lost: Math.round(600 - G.z.hp), used: G.g - me.gam, mag0: G.mag, mag: me.mag[me.wpn] }; });
  check('in the air the chin gun hits the zombie you aim at and uses the aircraft ammo, not your gun', s.lost >= 36 && s.used >= 4 && s.mag === s.mag0, JSON.stringify(s));
  // fly over a building: altitude follows the roofs
  await p.evaluate(() => { W.zs.length = 0; });
  await p.evaluate(() => { CAM.zoom = 3; document.querySelectorAll('#hud,.hud,#wbar').forEach(e => e.style.display = 'none'); }); await p.keyboard.down('d'); await simWait(1.2);
  const r = await p.evaluate(() => { const me = W.p[0]; return w2s(me.x, me.y, me.z + 0.5); });
  await p.screenshot({ path: `${OUT}/gyro_fly.png`, clip: { x: Math.max(0, r[0] - 220), y: Math.max(0, r[1] - 170), width: 440, height: 340 } });
  await p.keyboard.up('d');
  // land with T (ride again): comes down and you get out
  await p.evaluate(() => doAct(W.p[0], 'ride')); await simWait(3.2);
  s = await p.evaluate(() => { const me = W.p[0]; return { ride: me.ride, land: me.land, air: +(me.z - surfZ(me.x, me.y, skyTop(me.x, me.y))).toFixed(2), L: me.L, top: skyTop(me.x, me.y) }; });
  check('T in the air brings it down; on touchdown you are out, standing on what is below', !s.ride && !s.land && Math.abs(s.air) < 0.1 && s.L === s.top, JSON.stringify(s));
  // out of fuel: comes down on its own
  await tp(spots.open); await p.evaluate(() => { W.p[0].fuel = 3.2; doAct(W.p[0], 'ride', 5); }); await simWait(3.6); /* 1.2 s spin-up, then climbs until the tank runs dry */
  const mid = await p.evaluate(() => ({ land: W.p[0].land, fuel: W.p[0].fuel }));
  await simWait(3);
  s = await p.evaluate(() => ({ ride: W.p[0].ride, fuel: W.p[0].fuel }));
  check('when the fuel runs out it lands by itself, and with no fuel it will not take off', mid.land && !s.ride && s.fuel === 0 && !(await p.evaluate(() => { doAct(W.p[0], 'ride', 5); return W.p[0].ride; })), JSON.stringify({ mid, s }));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
