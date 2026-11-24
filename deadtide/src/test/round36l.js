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
  // kaiju: lower health growth, pairs weaker
  let s = await S(() => { const o = spot(true); put(o); W.night = 5; const a = spawnZombie('kjaw', 0); W.night = 11; const b2 = spawnZombie('ktail', 0); W.zs.length = 0; W.night = 10; startNight(); const ks = W.spawnQ.filter(q => ZT[q.k].kaiju); return { a: Math.round(a.max), b: Math.round(b2.max), pair: ks.map(q => q.km) }; });
  check('kaiju health: 裂颚兽 night 5 ≈ 2720 (was 4470), 钢尾兽 night 11 ≈ 4370 (was 8400); two on a night are ×0.8 each', Math.abs(s.a - 2720 * 1.5) < 45 && Math.abs(s.b - 4370 * 1.5) < 60 /* (round 38g) big ones ×1.5 */ && s.pair.length === 2 && s.pair.every(k => k === 0.8), JSON.stringify(s));
  // kaiju: heavy damage during a tell breaks it → an opening, damage ×2
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; const z = spawnZombie('ktail', 0); z.x = me.x + 3; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.kcd = 0; visTick(); run(0.1); const k0 = z.ks && z.ks.k; hurtZombie(z, z.max * 0.09, me); run(0.05); const open = z.xpT > 0, h = z.hp; hurtZombie(z, 100, me); return { k0, open, d: Math.round(h - z.hp) }; });
  check('kaiju: 9% of its health during the sweep tell breaks it — 破绽, it takes double damage', s.k0 === 'sweep' && s.open && s.d === 300 /* (round 38g) on-foot hits on big ones ×1.5 */, JSON.stringify(s));
  // kaiju: 钢尾兽 throws a boulder at someone standing still at range (marked), it hurts
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; me.vx = me.vy = 0; const z = spawnZombie('ktail', 0); z.x = me.x + 12; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); let rock = 0, hp0 = me.hp, minHp = me.hp; const oe = window.emit; window.emit = e => { if (e.k === 'krock') rock++; return oe(e); };
    for (let k = 0; k < 6 && !rock; k++) { z.kcd = 0; z.x = me.x + 12; z.y = me.y; visTick(); run(0.05); } run(2.2, () => { minHp = Math.min(minHp, me.hp); me.vx = me.vy = 0; }); window.emit = oe; return { rock, dmg: Math.round(hp0 - minHp) }; });
  check('kaiju: 钢尾兽 hurls a boulder at range (marked spot) — standing still gets hit (28 × 0.65 on foot)', s.rock >= 1 && s.dmg >= 15 && s.dmg <= 25, JSON.stringify(s));
  // kaiju: smashes wood but not brick
  s = await S(() => { const me = W.p[ME]; return { wood: B[1].hp <= 330, door: B[7].hp <= 330, brick: B[2].hp <= 330 }; });
  check('kaiju: smash wood walls and doors, not brick', s.wood && s.door && !s.brick, JSON.stringify(s));
  // 闪影者: hit it in the beat after it appears = parried; step away = it whiffs and stumbles
  for (const mode of ['hit', 'dodge']) {
    s = await S((mode) => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; me.aim = 0; const z = spawnZombie('blinker', 0); z.x = me.x + 6; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.eCD = 0; const hp0 = me.hp;
      let ph1 = false; for (let k = 0; k < 120 && !ph1; k++) { visTick(); stepZombies(1 / 60); ph1 = !!(z.es && z.es.ph === 1); }
      if (mode === 'hit') hurtZombie(z, 60, me); else { me.x += 2.2; me.y += 0.5; }
      for (let k = 0; k < 40; k++) { visTick(); stepZombies(1 / 60); } return { ph1, open: z.xpT > 0, hurt: Math.round(hp0 - me.hp) }; }, mode);
    check('闪影者 (' + mode + '): it appears behind you; ' + (mode === 'hit' ? 'hitting it in the beat parries it' : 'stepping away makes it whiff') + ' — 破绽, no damage to you', s.ph1 && s.open && s.hurt === 0, JSON.stringify(s));
  }
  // 隐身者: facing it when it flickers turns the ambush back on it; back turned = you get hit
  for (const face of [true, false]) {
    s = await S((face) => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; const z = spawnZombie('shade', 0); z.x = me.x + 1.5; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.ck = 1; me.aim = face ? 0 : Math.PI; const hp0 = me.hp;
      let tell = false; for (let k = 0; k < 50; k++) { visTick(); stepZombies(1 / 60); if (z.es && z.es.amb) tell = true; me.aim = face ? Math.atan2(z.y - me.y, z.x - me.x) : Math.atan2(me.y - z.y, me.x - z.x); } return { tell, open: z.xpT > 0, hurt: Math.round(hp0 - me.hp) }; }, face);
    check('隐身者: it flickers before striking; ' + (face ? 'facing it parries (破绽, no damage)' : 'back turned → ambushed'), s.tell && (face ? s.open && s.hurt === 0 : !s.open && s.hurt > 0), JSON.stringify(s));
  }
  // 唤尸者: backs off when you close in; its raised zombies drop when it dies
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; const z = spawnZombie('caller', 0); z.x = me.x + 3; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); const d0 = 3; run(2, () => visTick()); const d1 = Math.hypot(z.x - me.x, z.y - me.y);
    const m = spawnZombie('walker', 0); m.x = z.x + 1; m.y = z.y; m.L = z.L; z.mins = [m.id]; hurtZombie(z, 1e6, me); return { d0, d1: +d1.toFixed(1), minion: m.hp }; });
  check('唤尸者 keeps its distance (you chase it), and what it raised drops with it', s.d1 > 3.5 && s.minion <= 0, JSON.stringify(s));
  // 护盾者: stand inside its bubble and it pulses you out (marked); hit it hard in the tell = bubble broken + 破绽
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; const z = spawnZombie('warden', 0); z.x = me.x + 1.5; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.eCD = 0; visTick(); run(0.05, () => visTick());
    const tell = !!z.es; run(1.2, () => { visTick(); }); const pushed = Math.hypot(me.x - z.x, me.y - z.y);
    me.x = z.x + 1.2; me.y = z.y; me.vx = me.vy = 0; z.eCD = 0; z.sh = z.shMax = z.max * 0.6; run(0.05, () => visTick()); const tell2 = !!z.es; hurtZombie(z, 80, null); run(0.05, () => visTick()); return { tell, pushed: +pushed.toFixed(1), tell2, sh: z.sh, open: z.xpT > 0 }; });
  check('护盾者: pulses people out of its bubble (after a marked tell); a hard hit during the tell breaks the bubble and opens it up', s.tell && s.tell2 && s.sh === 0 && s.open, JSON.stringify(s));
  // flyers: 尸鹫 drops a marked acid glob on someone standing still; a bat can cling on and the knife knocks it off; crows sometimes strafe along a line
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; me.vx = me.vy = 0; const v = spawnZombie('vult', 0); v.x = me.x + 4; v.y = me.y; v.z = me.z + 3.5; v.L = me.L; v.fk = 7; v.dvCD = 0; let bomb = 0; const hp0 = me.hp; const oe = window.emit; window.emit = e => { if (e.k === 'vbomb') bomb++; return oe(e); };
    run(5, () => { visTick(); me.vx = me.vy = 0; }); window.emit = oe; const vd = Math.round(hp0 - me.hp);
    W.zs.length = 0; me.hp = me.maxHp; const b2 = spawnZombie('bat', 0); b2.x = me.x + 0.3; b2.y = me.y; b2.z = flyAimZ(me) + 0.3; b2.latch = { p: me.i, t: 2.4, hp: b2.hp }; run(0.6, () => visTick()); const latched = !!b2.latch, drained = me.hp < me.maxHp; hurtZombie(b2, 5, me); run(0.05, () => visTick());
    W.zs.length = 0; let strafe = 0; for (let k = 0; k < 6; k++) { const c = spawnZombie('crow', 0); c.x = me.x + 3; c.y = me.y + k * 0.3; c.z = me.z + 2; c.fk = 50; c.L = me.L; } run(8, () => { visTick(); for (const c of W.zs) if (c.dv && c.dv.strafe) strafe = 1; });
    return { bomb, vd, latched, drained, off: !b2.latch, strafe }; });
  check('飞行丧尸: 尸鹫 acid glob hits someone standing still; a clinging bat drains until hit; crows strafe along marked lines', s.bomb >= 1 && s.vd > 0 && s.latched && s.drained && s.off && s.strafe, JSON.stringify(s));
  // (round 36m) 翼龙兽: flies high, swoops along a marked line and lands (open), rains acid, gusts; hit hard in a tell → shot down
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; window.__dbg.god = true; const z = spawnZombie('kwing', 0); z.x = me.x + 6; z.y = me.y; z.z = me.z + 5; z.L = me.L; z.kcd = 0.5; const ev = {}; let maxAlt = 0, landed = 0;
    const oe = window.emit; window.emit = e => { if (e.k === 'ktell' || e.k === 'kxp' || e.k === 'vbomb' || e.k === 'kroar') { const key = e.k + ':' + (e.k === 'ktell' ? e.s : e.w || ''); ev[key] = (ev[key] || 0) + 1; } return oe(e); };
    run(25, () => { visTick(); maxAlt = Math.max(maxAlt, z.z - me.z); if (z.gnd > 0 && z.z - flyFloor(z.x, z.y) < 0.5) landed = 1; if (!z.ks) z.kcd = Math.min(z.kcd, 0.6); });
    z.gnd = 0; z.xpT = 0; z.stun = 0; z.kcd = 0; z.z = me.z + 5; let down = false; for (let k = 0; k < 400 && !down; k++) { visTick(); stepZombies(1 / 60); if (z.ks && z.kt === 1) { hurtZombie(z, z.max * 0.1, me); visTick(); stepZombies(1 / 60); down = z.gnd > 0 && z.xpT > 0; } }
    window.emit = oe; window.__dbg.god = false; return { maxAlt: +maxAlt.toFixed(1), landed, ev, down, label: ZT.kwing.kaiju }; });
  check('翼龙兽: circles high, swoops (marked line) and lands (破绽), rains acid (marked), and a hard hit in a tell shoots it down', s.maxAlt > 4 && s.landed && s.ev['ktell:line'] && s.ev['kxp:land'] && s.ev['vbomb:'] && s.down, JSON.stringify(s));
  s = await S(() => { const out = {}; for (const n of [6, 7]) { W.night = n - 1; W.zs.length = 0; let wing = 0; for (let k = 0; k < 40; k++) { W.night = n - 1; W.zs.length = 0; startNight(); if (W.spawnQ.some(q => q.k === 'kwing')) wing++; } out[n] = wing; } return out; });
  check('翼龙兽 can turn up from night 7 (not before; night 6 has no kaiju at all)', s[6] === 0 && s[7] > 0, JSON.stringify(s));
  s = await S(() => ({ runner: ZT.runner.hp, dog: ZT.dog.hp, climber: ZT.climber.hp, screamer: ZT.screamer.hp, walker: ZT.walker.hp }));
  check('fast zombies are frailer than the slow ones', s.runner < s.walker && s.dog < s.runner && s.climber < s.walker && s.screamer < 150, JSON.stringify(s));
  // (round 36n) late nights: zombie hp grows +8% a night after night 8; mechs gain from 弹头 levels above the start; 疾风 tougher, spinning third kick
  s = await S(() => ({ h1: BAL.hpMul(1), h8: +BAL.hpMul(8).toFixed(2), h19: +BAL.hpMul(19).toFixed(2), gale: [MECHS[1].hp, MECHS[1].armor, MECHS[1].dmg, MECHS[1].cd] }));
  check('zombie hp growth slows after night 8 (night 19 ×3.14, was ×4.24); 疾风 1000 hp / armour 1.0 / gun 15 / 浮游炮 cd 22', s.h1 === 1 && s.h8 === 2.26 && s.h19 === 3.14 && s.gale.join() === '1000,1,15,22', JSON.stringify(s));
  s = await S(() => { const me = W.p[ME]; W.zs.length = 0; const sv = { ride: me.ride, veh: me.veh, mform: me.mform, vx: me.vx, vy: me.vy, hp: me.hp, invT: me.invT }; me.invT = 0; me.mform = 0;
    me.ride = 1; me.veh = 1; me.vx = 3; me.vy = 0; let dodged = 0; for (let k = 0; k < 200; k++) { me.hp = 100; hurtPlayer(me, 10); if (me.hp === 100) dodged++; } const rate = rideK(me).rate;
    me.veh = 4; me.vx = 0; me.hp = 50; hurtPlayer(me, 10); const armour = 50 - me.hp; me.hitAt = W.t - 5; const h0 = me.hp; for (let k = 0; k < 60; k++) stepActions(me, 1 / 60); const heal = +(me.hp - h0).toFixed(1);
    Object.assign(me, sv); return { dodged, rate, armour, heal }; });
  check('vehicle forms (round 36n): bike dodges ~40% while moving and fires at full rate; armoured car takes 30% and heals 4/s after 3 s unhurt', s.dodged > 55 && s.dodged < 110 && s.rate === 1 && Math.abs(s.armour - 3) < 0.01 && s.heal > 3 && s.heal < 5, JSON.stringify(s));
  // (round 36n) 工蜂 throws three parcels a go and pours out a torrent; 苍隼 fires a salvo of three harder rockets in the air
  s = await S(() => { const me = W.p[ME]; const sv = { ride: me.ride, veh: me.veh, mform: me.mform, mfly: me.mfly, aimPt: me.aimPt }; W.zs.length = 0; me.aimPt = null; me.aim = 0; me.ride = 1; me.mform = 1;
    me.veh = 3; W.dly = []; mechShoot(me, 'parcel', null, 0); const boxes = W.dly.filter(q => q.box).map(q => Math.round(q.dmg)); W.dly = []; me.mcd = 0; mechSkill(me, { x: me.x + 8, y: me.y }); const pour = W.dly.filter(q => q.launch).length, span = Math.max(...W.dly.map(q => q.t)); W.dly = [];
    me.veh = 5; me.mfly = false; mechShoot(me, 'rocket', null, 0); const ground = W.dly.filter(q => q.shell).map(q => Math.round(q.dmg)); W.dly = []; me.mfly = true; const air = airborne(me); mechShoot(me, 'rocket', null, 0); const sky = W.dly.filter(q => q.shell).map(q => Math.round(q.dmg)); W.dly = [];
    Object.assign(me, sv); me.mcd = 0; return { boxes, want: Math.round(36 * mechMul()), pour, span: +span.toFixed(2), ground, air, sky }; });
  check('工蜂: 3 parcels a throw (36 each × 弹头); 快递雨 pours 36 over ~2 s · 苍隼: 1 rocket on foot, 3 × 72 in the air', s.boxes.length === 3 && s.boxes.every(d => d === s.want) && s.pour === 36 && s.span > 1.9 && s.ground.join() === '55' && s.air && s.sky.length === 3 && s.sky.every(d => d === 72), JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
