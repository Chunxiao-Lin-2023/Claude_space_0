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
  // (round 38g) bites need a moment on foot / not at all from a moving vehicle; mechs hit 1.5x and take 2/3; big ones 1.5x hp; control on mechs only
  let s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; me.invT = 0;
    const z = spawnZombie('walker', 0); z.x = me.x + 0.5; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.cd = 0; z.sleep = 0; z.spd = 0; const h0 = me.hp;
    run(0.25); out.brush = Math.round(h0 - me.hp); run(0.5); out.hold = Math.round(h0 - me.hp);
    me.hp = me.maxHp; me.vehs |= 2; me.veh = 1; me.ride = true; me.mform = 0; me.vx = 6; me.vy = 0; z.cd = 0; z.wu = 0; for (let k = 0; k < 60; k++) { me.vx = 6; stepZombies(1 / 60); } out.drive = Math.round(me.maxHp - me.hp);
    me.vx = 0; me.vy = 0; me.ride = false; W.zs.length = 0; return out; });
  check('on foot a zombie must hold on ~0.45 s before biting (brushing past costs nothing); a moving vehicle is never bitten', s.brush === 0 && s.hold > 0 && s.drive === 0, JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9;
    const w = spawnZombie('walker', 0), wd = spawnZombie('warden', 0), kj = spawnZombie('kjaw', 0); out.wardenHp = Math.round(wd.max / w.max * ZT.walker.hp / ZT.warden.hp * 100) / 100; out.kjHp = Math.round(kj.max / (ZT.kjaw.hp * (1 + BAL.kaijuHpPer * (BAL.lvN(Math.max(1, W.night)) - 1)) * W.D.hp * (activeP().length > 1 ? 1.15 : 1)) * 100) / 100; const k0 = kj.hp; hurtZombie(kj, 10, null); out.trapKj = Math.round(k0 - kj.hp);
    const a0 = w.hp; hurtZombie(w, 10, me); out.foot = Math.round(a0 - w.hp); const b0 = wd.hp; hurtZombie(wd, 10, me); out.footBig = Math.round(b0 - wd.hp);
    me.vehs |= 4; me.veh = 2; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; const c0 = w.hp; hurtZombie(w, 10, me); out.mech = Math.round(c0 - w.hp); const d0 = wd.hp; hurtZombie(wd, 10, me); out.mechBig = Math.round(d0 - wd.hp);
    const h0 = mhpOf(me); hurtPlayer(me, 100); out.hull = Math.round(h0 - mhpOf(me)); me.ride = false; me.mform = 0; W.zs.length = 0; return out; });
  check('mech hits ×1.5 (on foot unchanged); 能力者 normal hp (round 38h); 怪兽 ×1.25 hp and non-mech hits on them ×1.25; 赤刃 (×1.0) loses 100/1.5 ≈ 67 per 100', s.foot === 10 && s.mech === 15 && s.footBig === 10 && s.mechBig === 15 && s.wardenHp === 1 && s.kjHp === 1.25 && Math.abs(s.trapKj - 12.5) < 0.6 && s.hull === 67, JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; me.vehs |= 8; me.veh = 3; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; me.evo = 0; me.evoOn = false; me.gcd = 0; me.mcd = 0; me.ccL = {}; me.ccStg = me.ccSlw = me.ccBrk = 0;
    out.stg = mechCC(me, 'stg', 0.7) && me.ccStg; out.spd0 = ccSpeed(me); me.gcd = 0; mechPunch(me); out.punchBlocked = me.gcd === 0; me.ccStg = 0; out.dr = (mechCC(me, 'stg', 0.7), me.ccStg); me.ccStg = 0;
    // on foot nothing happens
    me.mform = 0; out.foot = mechCC(me, 'stg', 1); me.mform = 1;
    // armour break
    const h0 = mhpOf(me); hurtPlayer(me, 100); const plain = h0 - mhpOf(me); mechCC(me, 'brk', 6); const h1 = mhpOf(me); hurtPlayer(me, 100); out.brk = Math.round((h1 - mhpOf(me)) / plain * 100) / 100; me.ccBrk = 0;
    // climbers jump on, slow it, claw it; a punch throws one off, a skill all of them
    W.zs.length = 0; const cs = [0, 1, 2].map(k => { const z = spawnZombie('climber', 0); z.x = me.x + 0.6 * Math.cos(k * 2); z.y = me.y + 0.6 * Math.sin(k * 2); z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.sleep = 0; z.cd = 0; z.lgCD = 99; return z; });
    for (let k = 0; k < 30; k++) { stepZombies(1 / 60); stepCC(me, 1 / 60); } out.lat = cs.filter(z => z.mlat === ME).length; out.spdLat = Math.round(ccSpeed(me) * 100) / 100; out.onTop = cs.every(z => z.z > me.z + 0.8);
    me.gcd = 0; me.mcmb = 0; mechPunch(me); out.afterPunch = cs.filter(z => z.mlat === ME).length; me.mcd = 0; mechSkill(me, { x: me.x + 3, y: me.y }); out.afterSkill = cs.filter(z => z.mlat === ME).length;
    // evolving clears control
    mechCC(me, 'slw', 3, 0.4); me.ccL = {}; mechCC(me, 'stg', 1); me.evo = 100; me.mtr = 0; evolve(me); out.evoClear = !(me.ccStg > 0) && !(me.ccSlw > 0) && me.evoOn; me.evoOn = false;
    me.ride = false; me.mform = 0; W.zs.length = 0; return out; });
  check('mech control: stagger stops moving & attacking, again within 5 s lasts half; nothing on foot; 破甲 +25%; up to 3 climbers ride it (−45% speed), a punch throws one off, a skill the rest; evolving clears it', s.stg > 0.6 && s.spd0 === 0 && s.punchBlocked && Math.abs(s.dr - 0.35) < 0.01 && s.foot === false && s.brk === 1.25 && s.lat === 3 && s.spdLat === 0.55 && s.onTop && s.afterPunch === 2 && s.afterSkill === 0 && s.evoClear, JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; me.vehs |= 16; me.veh = 4; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.ccL = {}; me.ccStg = 0; W.zs.length = 0;
    const z = spawnZombie('brute', 0); z.x = me.x + 1.2; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.sleep = 0; z.slam = { t: BAL.slamWind }; z.slamCD = 0; stepZombies(1 / 60); out.slamStg = me.ccStg > 0;
    me.ride = false; me.mform = 0; me.ccStg = 0; W.zs.length = 0; return out; });
  check('重锤 slam staggers a mech', s.slamStg, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
