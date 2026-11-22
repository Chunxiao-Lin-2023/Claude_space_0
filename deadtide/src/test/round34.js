// Round 34: smooth riding (the drawn survivor moves every frame, between the 60 Hz sim steps), explosives toned down
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 500, height: 360 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  // drive frames by hand at an uneven ~120 Hz: the bike / gyrocopter on screen must move every frame and keep its heading
  let s = await p.evaluate(async () => {
    window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 100));
    const out = {}, ri = readInput;
    for (const v of [5, 1]) {
      const me = W.p[ME]; W.zs.length = 0; W.spawnQ = []; W.phase = 'day'; W.clock = 999; window.__dbg.god = true;
      me.vehs |= 1 << v; me.veh = v; me.fuel = 60; me.x = W.radio.x + 0.5; me.y = W.radio.y + 20.5; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); me.z = pZ(me); me.alt = 0; me.land = false; me.spool = 0; me.jmp = null; me.dash = null; me.ride = true; if (v === 5) me.alt = 1; me._uy = null; me.aim = 0;
      const press = () => { me.inp.mx = 1; me.inp.my = 0; }; window.readInput = press; let t = performance.now(); const xs = [], ly = [];
      for (let k = 0; k < 120; k++) { t += k % 2 ? 7.2 : 9.5; press(); frame(t); if (k > 60) { xs.push(OBJ.pl[ME].g.position.x); ly.push(me._ly); } }
      const d = xs.slice(1).map((x, i) => x - xs[i]);
      out[v] = { still: d.filter(q => Math.abs(q) < 1e-5).length, n: d.length, ly: +(Math.max(...ly) - Math.min(...ly)).toFixed(3) };
      me.ride = false;
    }
    window.readInput = ri; return out; });
  check('riding at 120 Hz: the drawn bike moves on (almost) every frame and keeps its heading (was: stood still every other frame)', s[1].still <= 6 && s[1].ly < 0.1, JSON.stringify(s[1]));
  check('riding at 120 Hz: the drawn gyrocopter moves on every frame and keeps its heading', s[5].still === 0 && s[5].ly < 0.15, JSON.stringify(s[5]));
  // explosives: smaller radius, steeper falloff, bosses take less; fewer frag grenades and launcher shells
  s = await p.evaluate(() => {
    const me = W.p[ME]; W.zs.length = 0; const mk = (k, dx) => { const z = spawnZombie(k, 0); z.x = me.x + 6 + dx; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 5000; return z; };
    const a = mk('walker', 0), e = mk('walker', 2.4), bz = mk('boss', -0.01); W.upg = 0;
    explode(me.x + 6, me.y, a.z + 0.6, me, BAL.nadeR, BAL.nadeDmg);
    return { centre: 5000 - a.hp, edge: 5000 - e.hp, boss: 5000 - bz.hp, cap: BAL.nadeCap, gl: ammoCap(6), R: BAL.nadeR, tank: BAL.tankDmg, tankR: BAL.tankR, glDmg: WPN[6].dmg };
  });
  check('grenade: ~220 in the middle, about half near the edge, a boss takes 40% less; carry 10 frags, 60 launcher shells; tank 120 / r 2.3, launcher 160',
    s.centre > 180 && s.centre <= 220 && s.edge < 130 && s.edge > 0 && s.boss < s.centre * 0.65 && s.cap === 10 && s.gl === 60 && s.R === 3 && s.tank === 120 && s.tankR === 2.3 && s.glDmg === 160, JSON.stringify(s));
  // a two-player save carried on alone keeps the teammate's kit (and a teammate who dropped out is still saved)
  s = await p.evaluate(() => {
    NETROLE = 'host'; startGame(4242, ['甲', '乙'], 'normal', 0, 'classic', 'town'); SLOT = 1; const g = W.p[1]; g.owned[3] = 1; g.ammo[3] = 77; g.meds = 5; g.vehs = 1 << 4; g.gone = true; W.res.steel = 321;
    saveGame(true); const a = loadSlot(1); NETROLE = 'solo'; continueGame(1); const one = W.p.length; saveGame(true); const b = loadSlot(1);
    return { a: a.p.length, a1: a.p[1] && a.p[1].ammo[3], one, b: b.p.length, b1: b.p[1] && b.p[1].ammo[3], meds: b.p[1] && b.p[1].meds, vehs: b.p[1] && b.p[1].vehs, steel: b.res.steel };
  });
  check('save: a teammate who dropped out is saved; carrying on alone keeps their guns / ammo / medkits / vehicles in the save; shared materials kept', s.a === 2 && s.a1 === 77 && s.one === 1 && s.b === 2 && s.b1 === 77 && s.meds === 5 && s.vehs === 16 && s.steel === 321, JSON.stringify(s));
  // ---------- mechs ----------
  await p.evaluate(() => { NETROLE = 'solo'; startGame(777, ['甲'], 'normal', 0, 'classic', 'town'); window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16); requestAnimationFrame(frame); });
  const simWait = t => p.evaluate(t => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= t ? r() : setTimeout(f, 30); f(); }), t);
  await simWait(0.3);
  const open = await p.evaluate(() => { window.readInput = () => { }; window.__dbg.god = false; W.zs.length = 0; W.spawnQ = []; W.phase = 'day'; W.clock = 9999; const me = W.p[ME]; for (const k in W.res) W.res[k] = 999;
    const x = W.radio.x + 22, y = W.radio.y + 22, L = gAt(x, y); for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) for (let l = L; l < L + 5; l++) { const i = ci(x + dx, y + dy, l); W.blk[i] = 0; if (l > L) W.slab[i] = 0; } W.ver++; W.navDirty = true;
    return { x, y, L }; });

  const ride = (v, o) => p.evaluate(([v, o]) => { const me = W.p[ME]; me.ride = false; me.mform = 0; me.mtr = 0; me.mh = []; me.bat = BAL.mechBat; me.mcd = 0; me.down = false; me.dead = false; me.invT = 0; me.hp = me.maxHp; me.vehs |= 1 << v; me.veh = v; me.shl = 50; me.fuel = 60;
    me.x = o.x + 0.5; me.y = o.y + 0.5; me.L = o.L; me.z = pZ(me); me.jmp = null; me.dash = null; doAct(me, 'ride', v); return me.ride; }, [v, o]);
  const xform = () => p.evaluate(() => { doAct(W.p[ME], 'xform'); return W.p[ME].mtr; });
  await ride(4, open);
  s = await p.evaluate(() => { const me = W.p[ME]; const before = inMech(me); doAct(me, 'xform'); return { before, mtr: me.mtr, mid: inMech(me), gun: vehGun(me) }; });
  await simWait(0.5); const half = await p.evaluate(() => ({ mech: inMech(W.p[ME]), mtr: W.p[ME].mtr }));
  await simWait(0.7); const done = await p.evaluate(() => ({ mech: inMech(W.p[ME]), name: mechOf(W.p[ME]).name, hp: mhpOf(W.p[ME]) }));
  check('装甲车 → 铁卫: 变形 takes 1 s (nothing fires meanwhile), no blueprint needed', !s.before && s.mtr === 1 && !s.mid && s.gun === 'busy' && !half.mech && half.mtr > 0 && done.mech && done.name === '铁卫' && done.hp === 2400, JSON.stringify([s, half, done]));
  s = await p.evaluate(() => { const me = W.p[ME]; me.aim = 0; me.gcd = 0; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + 1.8; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 1000; const z2 = spawnZombie('walker', 0); z2.x = me.x - 1.8; z2.y = me.y; z2.L = me.L; z2.z = z.z; z2.hp = z2.max = 1000;
    mechPunch(me); W.dly = []; mechPunchHit(me); const a = 1000 - z.hp, behind = 1000 - z2.hp; const hp0 = me.hp; hurtPlayer(me, 100, z); return { a, behind, pilot: hp0 - me.hp, hull: mhpOf(me) }; });
  check('铁卫: a punch hits in front (95), not behind; a 100 hit takes 70 off the hull (×0.7) and 10% gets through to the pilot (×0.35 in the armoured car: 3.5)', s.a === 95 && s.behind === 0 && s.hull === 2330 && Math.abs(s.pilot - 3.5) < 0.01, JSON.stringify(s));
  s = await p.evaluate(() => { const me = W.p[ME]; W.zs.length = 0; const zs = [1.5, 3.5, 6].map(d => { const z = spawnZombie('walker', 0); z.x = me.x + d; z.y = me.y + 0.3; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 1000; return z; });
    mechSkill(me, null); return { lost: zs.map(z => Math.round(1000 - z.hp)), stun: zs.map(z => +(z.stun || 0).toFixed(1)), cd: me.mcd }; });
  check('铁卫 震地: 220 close, 60% to 4.5, nothing at 6, stuns; 12 s cooldown', s.lost[0] === 220 && s.lost[1] === 132 && s.lost[2] === 0 && s.stun[0] >= 1.5 && s.cd === 12, JSON.stringify(s));
  s = await p.evaluate(() => { const me = W.p[ME]; me.mh[me.veh] = 10; me.invT = 0; hurtPlayer(me, 100); return { mech: inMech(me), mtr: me.mtr, hull: mhpOf(me), deny: xformDeny(me, 1) }; });
  await simWait(1.2); s.after = await p.evaluate(() => ({ ride: W.p[ME].ride, mech: inMech(W.p[ME]) }));
  check('a broken hull folds it back into the vehicle (you stay in the seat) and it can\'t stand up again until the hull comes back', !s.mech && s.mtr > 0 && s.hull === 0 && !!s.deny && s.after.ride && !s.after.mech, JSON.stringify(s));
  s = await p.evaluate(() => { const me = W.p[ME]; me.mh[4] = 0; for (let k = 0; k < 600; k++) stepActions(me, 1 / 60); return { hull: Math.round(mhpOf(me, 4)) }; });
  check('out of mech form the hull comes back by itself (1.5% a second)', s.hull > 300 && s.hull < 420, JSON.stringify(s));
  // the other five
  const want = { 1: '疾风', 2: '赤刃', 3: '工蜂', 5: '苍隼', 6: '重炮' }, got = {};
  for (const v of [1, 2, 3, 5, 6]) { await ride(v, open); await xform(); await simWait(1.15); got[v] = await p.evaluate(() => ({ n: inMech(W.p[ME]) ? mechOf(W.p[ME]).name : '', spd: mechOf(W.p[ME]).spd, air: airborne(W.p[ME]) })); }
  check('every vehicle has its own mech: 疾风 / 赤刃 / 工蜂 / 苍隼 (lands from the air) / 重炮', Object.keys(want).every(v => got[v].n === want[v]) && !got[5].air, JSON.stringify(got));
  await ride(1, open); await xform(); await simWait(1.15);
  s = await p.evaluate(() => { const me = W.p[ME]; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + 3; z.y = me.y + 0.4; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 1000; window.__z = z; window.__x0 = me.x; mechSkill(me, { x: me.x + 10, y: me.y }); return 1; });
  await simWait(0.5); s = await p.evaluate(() => ({ moved: +(W.p[ME].x - __x0).toFixed(1), lost: Math.round(1000 - __z.hp), stun: __z.stun > 0.5 }));
  check('疾风 滑铲: slides ~6 and knocks down what is on the way (90)', s.moved > 4.5 && s.moved < 7 && s.lost === 90 && s.stun, JSON.stringify(s));
  await ride(3, open); await xform(); await simWait(1.15);
  s = await p.evaluate(() => { const me = W.p[ME]; me.aim = 0; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + 1.5; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 1000; const y = spawnZombie('walker', 0); y.x = me.x + 7.5; y.y = me.y + 0.8; y.L = me.L; y.z = z.z; y.hp = y.max = 1000; window.__z = z; window.__y = y; mechSkill(me, { x: me.x + 7, y: me.y }); return 1; });
  await simWait(0.9); s = await p.evaluate(() => ({ zx: +(__z.x - W.p[ME].x).toFixed(1), zl: Math.round(1000 - __z.hp), yl: Math.round(1000 - __y.hp) }));
  check('工蜂 抓投: grabs the zombie in front and throws it ~7 away (200), splashing one where it lands (100)', s.zx > 5.5 && s.zl === 200 && s.yl === 100, JSON.stringify(s));
  await ride(6, open); await xform(); await simWait(1.15);
  s = await p.evaluate(() => { const me = W.p[ME]; me.aim = 0; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + 10; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 1000; window.__z = z; const s0 = me.shl; mechSkill(me, { x: me.x + 10, y: me.y }); return { used: s0 - me.shl }; });
  await simWait(1.0); s.lost = await p.evaluate(() => Math.round(1000 - __z.hp));
  check('重炮 齐射: 3 tank shells at the target (the middle one lands on it)', s.used === 3 && s.lost >= 110, JSON.stringify(s));
  s = await p.evaluate(() => { const me = W.p[ME]; let room = null; for (let r = 2; r < 60 && !room; r++) for (let dy = -r; dy <= r && !room; dy++) for (let dx = -r; dx <= r; dx++) { const a = W.radio.x + dx, b = W.radio.y + dy; if (inMap(a, b) && skyTop(a, b) >= 1 && !W.blk[ci(a, b, 0)] && support(a, b, 0)) { room = [a, b]; break; } }
    me.ride = false; me.mform = 0; me.veh = 1; me.x = room[0] + 0.5; me.y = room[1] + 0.5; me.L = 0; me.z = pZ(me); doAct(me, 'ride', 1); const deny = xformDeny(me, 1); const snap = JSON.stringify(makeSnap()); me.bat = 1; return { ride: me.ride, deny, snap: /\[0,0,\[/.test(snap) }; });
  check('under a roof it won\'t stand up; mech form / hulls / energy go to the teammate', s.ride && /屋顶/.test(s.deny) && s.snap, JSON.stringify(s));
  // ---------- kaiju ----------
  s = await p.evaluate(o => { const me = W.p[ME]; me.ride = false; me.x = o.x + 0.5; me.y = o.y + 0.5; me.L = o.L; me.z = pZ(me); me.hp = me.maxHp; me.down = false; me.dead = false; me.invT = 0; me.invT = 0; W.zs.length = 0;
    const z = spawnZombie('kjaw', 0); z.x = me.x + 4; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.kcd = 0; window.__k = z; window.__hp0 = me.hp; return 1; }, open);
  await simWait(0.5); const w1 = await p.evaluate(() => ({ kt: __k.kt, hp: W.p[ME].hp }));
  await simWait(1.6); const w2 = await p.evaluate(() => ({ kt: __k.kt, hp: W.p[ME].hp, hp0: __hp0 }));
  check('kaiju 裂颚兽: winds up (telegraph) without hurting, then the acid breath burns you in its cone', w1.kt === 1 && w1.hp === w2.hp0 && w2.hp < w2.hp0 - 20, JSON.stringify([w1, w2]));
  s = await p.evaluate(o => { const me = W.p[ME]; me.hp = me.maxHp; me.down = false; me.dead = false; me.invT = 0; W.zs.length = 0; const z = spawnZombie('ktail', 0); z.x = me.x + 2.5; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.kcd = 0; window.__k = z; return 1; }, open);
  await simWait(0.4); const t1 = await p.evaluate(() => ({ kt: __k.kt, sweep: __k.ks && __k.ks.k }));
  await p.evaluate(() => { __k.stun = 1; }); await simWait(0.2); const t2 = await p.evaluate(() => ({ kt: __k.kt, ks: !!__k.ks, hp: W.p[ME].hp, max: W.p[ME].maxHp }));
  check('kaiju 钢尾兽: close up it winds up a tail sweep; a hard stun breaks the wind-up (no hit)', t1.kt === 1 && t1.sweep === 'sweep' && t2.kt === 0 && !t2.ks && t2.hp === t2.max, JSON.stringify([t1, t2]));
  s = await p.evaluate(o => { const me = W.p[ME]; W.zs.length = 0; const z = spawnZombie('kdig', 0); z.x = me.x + 9; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.kcd = 0; window.__k = z; me.hp = me.maxHp; me.down = false; me.dead = false; me.invT = 0; return 1; }, open);
  await simWait(0.5); const d1 = await p.evaluate(() => ({ hidden: !!__k.hidden }));
  await simWait(2.6); const d2 = await p.evaluate(() => ({ hidden: !!__k.hidden, near: +Math.hypot(__k.x - W.p[ME].x, __k.y - W.p[ME].y).toFixed(1), crawlers: W.zs.filter(z => z.k === 'crawler').length, hp: W.p[ME].hp, max: W.p[ME].maxHp }));
  check('kaiju 掘地兽: burrows out of sight, bursts out under you (hurts) with crawlers', d1.hidden && !d2.hidden && d2.near < 2 && d2.crawlers >= 2 && d2.hp < d2.max, JSON.stringify([d1, d2]));
  s = await p.evaluate(() => { W.night = 4; W.zs.length = 0; startNight(); const k5 = W.spawnQ.filter(q => ZT[q.k].kaiju).length; W.night = 5; startNight(); const k6 = W.spawnQ.filter(q => ZT[q.k].kaiju).length; W.night = 10; startNight(); const k11 = W.spawnQ.filter(q => ZT[q.k].kaiju).length; return { k5, k6, k11 }; });
  check('kaiju turn up on night 5 (one), not night 6, two from night 11', s.k5 === 1 && s.k6 === 0 && s.k11 === 2, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
