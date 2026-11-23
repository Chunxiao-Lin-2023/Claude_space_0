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
  // spawn rules
  let s = await p.evaluate(() => { const out = {}; for (const n of [1, 2, 3, 4, 9]) { W.night = n - 1; W.zs.length = 0; startNight(); out[n] = { crow: W.spawnQ.filter(q => q.k === 'crow').length, bat: W.spawnQ.filter(q => q.k === 'bat').length, elite: W.spawnQ.filter(q => ZT[q.k].elite).length, fk: new Set(W.spawnQ.filter(q => q.fk).map(q => q.fk)).size }; } W.spawnQ = []; W.zs.length = 0; W.phase = 'day'; return out; });
  check('flocks: none on night 1, crows from night 2 (one flock), more flocks later; bats only from night 4', s[1].crow + s[1].bat === 0 && s[2].crow >= 4 && s[2].bat === 0 && s[2].fk === 1 && s[9].fk >= 4, JSON.stringify(s));
  check('能力者: none before night 3, one on night 3, three by night 9', s[1].elite === 0 && s[2].elite === 0 && s[3].elite === 1 && s[9].elite === 3, JSON.stringify(s));
  // a crow out in the open: cruises above head height, circles, dives in and pecks
  s = await p.evaluate(() => { const o = spot(true); if (!o) return { none: 1 }; put(o); const me = W.p[ME]; W.edges = { 0: [[Math.floor(o.x) + 6, Math.floor(o.y), o.L]] };
    const z = spawnZombie('crow', 0); z.fk = 99; let maxH = 0, minD = 99, dove = 0, hp0 = me.hp; const z0 = z.z - pZ(me);
    run(12, () => { if (z.hp <= 0) return; const d = Math.hypot(z.x - me.x, z.y - me.y); minD = Math.min(minD, d); if (!z.dv) maxH = Math.max(maxH, z.z - pZ(me)); if (z.kt === 2) dove = 1; me.hp = Math.max(me.hp, 50); me.invT = 0; });
    return { z0: +z0.toFixed(2), maxH: +maxH.toFixed(2), minD: +minD.toFixed(2), dove, hurt: me.kills >= 0 && me.hp < hp0 || W.p[ME].hp < W.p[ME].maxHp, L: z.L }; });
  check('a crow comes in up in the air (about 1.9 over the ground), circles over your head and dives to peck you', !s.none && s.z0 > 1.5 && s.maxH > 1.5 && s.dove && s.minD < 1 && s.hurt, JSON.stringify(s));
  // indoors: the birds can't get at you
  s = await p.evaluate(() => { const o = spot(false); if (!o) return { none: 1 }; put(o); const me = W.p[ME]; W.edges = { 0: [[Math.floor(o.x) + 5, Math.floor(o.y) + 5, gAt(Math.floor(o.x) + 5, Math.floor(o.y) + 5)]] };
    for (let k = 0; k < 5; k++) { const z = spawnZombie('crow', 0); z.fk = 98; } const hp0 = me.hp; let low = 99; run(10, () => { for (const z of W.zs) low = Math.min(low, z.z - pZ(me)); });
    return { hurt: hp0 - me.hp, exposed: zExposed(me), low: +low.toFixed(2) }; });
  check('under a roof the flock can\'t reach you (no pecks, they stay over the roof)', !s.none && !s.exposed && s.hurt === 0 && s.low > 1, JSON.stringify(s));
  // a pilot in the air does get chased
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; me.vehs |= 32; me.veh = 5; me.ride = true; me.fuel = 60; me.alt = 1; me.z = pZ(me) + 2.2 * FH; me.L = Math.min(ML - 1, me.L + 2);
    W.edges = { 0: [[Math.floor(o.x) + 6, Math.floor(o.y), o.L]] }; const z = spawnZombie('bat', 0); z.fk = 97; z.hp = 999; const hp0 = me.hp; z.hp = 30; const zh = z.hp; let healed = 0; run(12, () => { me.invT = 0; if (z.hp > zh) healed = 1; });
    const out = { exposed: zExposed(me), hurt: hp0 - me.hp, healed, batZ: +(z.z - me.z).toFixed(2) }; me.ride = false; me.alt = 0; me.L = o.L; me.z = pZ(me); return out; });
  check('a flying gyrocopter is fair game: the bat climbs to it and bites (and heals off the bite)', s.exposed && s.hurt > 0 && s.healed, JSON.stringify(s));
  // shooting a bird: the ray hits it in the air; it falls to the ground
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; W.edges = { 0: [[Math.floor(o.x) + 4, Math.floor(o.y), o.L]] }; const z = spawnZombie('crow', 0); z.dvCD = 99; run(0.3);
    const ev = []; const em = window.emit; window.emit = e => { ev.push(e); em(e); };
    me.owned[2] = 1; me.wpn = 2; let n = 0; while (z.hp > 0 && n < 30) { me.mag[2] = 10; me.aimPt = { x: z.x, y: z.y, z: z.z + 0.25 }; me.aim = Math.atan2(z.y - me.y, z.x - me.x); fireWeapon(me, 2); n++; }
    window.emit = em; const d = ev.find(e => e.k === 'zdie'); return { dead: z.hp <= 0, n, inAir: d ? +(d.z - d.gz).toFixed(2) : null }; });
  check('a crow can be shot out of the air and falls to the ground (the corpse lands, not floating)', s.dead && s.n <= 10 && s.inAir > 1, JSON.stringify(s));
  // 闪影者: tells, blinks behind you, slashes
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; me.aim = 0; W.edges = { 0: [[Math.floor(o.x) + 3, Math.floor(o.y) + 3, o.L]] }; const z = spawnZombie('blinker', 0); z.x = o.x + 3; z.y = o.y; z.L = o.L; z.z = surfZ(z.x, z.y, z.L); z.eCD = 0; me.x = o.x - 3;
    const ev = []; const em = window.emit; window.emit = e => { ev.push(e); em(e); }; const hp0 = me.hp; let tell = 0, back = null;
    run(3, () => { me.invT = 0; if (z.kt === 1) tell = 1; if (!back && ev.some(e => e.a === 'blink1')) back = +(Math.cos(Math.atan2(z.y - me.y, z.x - me.x) - me.aim)).toFixed(2); });
    window.emit = em; return { tell, b0: ev.some(e => e.a === 'blink0'), back, slash: ev.some(e => e.a === 'slash'), hurt: hp0 - me.hp }; });
  check('闪影者: purple tell, then it appears behind you and slashes', s.tell && s.b0 && s.back !== null && s.back < -0.3 && s.slash && s.hurt > 0, JSON.stringify(s));
  // 唤尸者: wind-up, then zombies rise; a stun stops it
  s = await p.evaluate(() => { const o = spot(true); put(o); W.edges = { 0: [[Math.floor(o.x) + 5, Math.floor(o.y), o.L]] }; const z = spawnZombie('caller', 0); z.x = o.x + 5; z.y = o.y; z.z = surfZ(z.x, z.y, z.L); z.eCD = 0; W.night = 3;
    run(0.5); const mid = !!z.es; z.stun = 1; run(0.2); const stopped = !z.es; const n0 = W.zs.length; z.stun = 0; z.eCD = 0; run(2); return { mid, stopped, raised: W.zs.length - n0 }; });
  check('唤尸者: a wind-up a stun can break; otherwise 2-4 zombies climb out of the ground', s.mid && s.stopped && s.raised >= 2, JSON.stringify(s));
  // 护盾者: the bubble soaks hits from outside, not from inside; it breaks and comes back
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; W.edges = { 0: [[Math.floor(o.x) + 6, Math.floor(o.y), o.L]] }; const w = spawnZombie('warden', 0); w.x = o.x + 6; w.y = o.y; w.z = surfZ(w.x, w.y, w.L);
    const q = spawnZombie('walker', 0); q.x = w.x + 1; q.y = w.y; q.z = w.z; q.hp = q.max = 500; stepZombies(1 / 60);
    const sh0 = w.sh; hurtZombie(q, 60, me); const out = { sh0: Math.round(sh0), outside: 500 - q.hp, soaked: Math.round(sh0 - w.sh) };
    me.x = w.x - 1.5; hurtZombie(q, 60, me); out.inside = Math.round(500 - out.outside - q.hp);
    me.x = o.x; hurtZombie(q, 5000, me); out.broke = w.sh === 0; out.qAlive = q.hp > 0; run(10, () => { q.hp = 500; }); out.back = w.sh > 0; return out; });
  check('护盾者: hits from outside the bubble go into it, from inside they land; it breaks and comes back', s.sh0 > 100 && s.outside === 0 && s.soaked === 60 && s.inside === 60 && s.broke && s.back, JSON.stringify(s));
  // 隐身者: unseen while cloaked (shimmer up close), a hit shows it, an ambush from up close
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; W.edges = { 0: [[Math.floor(o.x) + 8, Math.floor(o.y), o.L]] }; const z = spawnZombie('shade', 0); z.x = o.x + 8; z.y = o.y; z.z = surfZ(z.x, z.y, z.L); visTick();
    const out = { ck: z.ck, seenFar: zSeen(z) }; hurtZombie(z, 1, me); out.shown = !z.ck && zSeen(z); z.ckT = 0; me.x = o.x - 6; run(0.2); out.recloak = z.ck;
    me.x = o.x; z.x = o.x + 1.4; z.y = o.y; me.aim = Math.PI; const hp0 = me.hp; run(0.7, () => { me.invT = 0; me.aim = Math.PI; }); out.ambush = hp0 - me.hp; /* (round 36l) back turned: facing it would parry the ambush */ out.after = z.ck; return out; });
  check('隐身者: invisible from afar while cloaked, a hit reveals it, it re-cloaks away from you and ambushes up close', s.ck && !s.seenFar && s.shown && s.recloak && s.ambush >= 15 && !s.after, JSON.stringify(s));
  // (round 36) counters: step out of a bird's marked dive spot and it misses; a blast grenade pops the bubble; a blast shows a cloaked one; kaiju / elites hit people on foot softer; no skills from out of sight
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; const out = {}; W.edges = { 0: [[Math.floor(o.x) + 5, Math.floor(o.y), o.L]] };
    const c = spawnZombie('crow', 0); c.fk = 77; const hp0 = me.hp; let marked = null; const em = window.emit; window.emit = e => { if (e.k === 'fdive' && !marked) marked = e; em(e); };
    run(12, k => { me.invT = 0; if (c.dv && c.dv.ph === 0 && c.dv.t < 0.05) { me.x = c.dv.x + (me.x > c.dv.x ? 2.2 : -2.2); me.rx = me.x; } if (!c.dv && marked) { me.x = o.x; me.rx = me.x; } });
    window.emit = em; out.marked = !!marked; out.dodgeHurt = hp0 - me.hp;
    put(o); const w = spawnZombie('warden', 0); w.x = o.x + 5; w.y = o.y; w.z = surfZ(w.x, w.y, w.L); gSpecial(3, w.x + 1, w.y, w.z + 0.3, me); out.popped = w.sh === 0;
    put(o); const sh = spawnZombie('shade', 0); sh.x = o.x + 6; sh.y = o.y; sh.z = surfZ(sh.x, sh.y, sh.L); explode(sh.x + 2, sh.y, sh.z + 0.3, me, 2, 1); out.shown = !sh.ck;
    put(o); const b = spawnZombie('blinker', 0); const h1 = me.hp; hurtPlayer(me, 20, b); out.foot = Math.round(h1 - me.hp);
    put(o); const far = spawnZombie('runner', 0); far.x = o.x + 30; far.y = o.y; far.L = o.L; far.z = surfZ(far.x, far.y, far.L); visTick(); far.lgCD = 0; far.spCD = 0; for (let k = 0; k < 30; k++) zSkill(far, ZT.runner, 1 / 60); out.blind = !far.lg && !(far.spr > 0);
    return out; });
  check('counters: a bird dives at a marked spot and misses if you step aside; 爆破弹 pops the bubble; a blast shows the 隐身者; on foot kaiju / 能力者 hit ×0.65; no skills from out of sight', s.marked && s.dodgeHurt === 0 && s.popped && s.shown && s.foot === 13 && s.blind, JSON.stringify(s));
  // (round 36) 工蜂 passive: what it flattens is gathered (and doesn't grow back); another mech's flattening grows back at dawn
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; me.vehs |= 8 | 4; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; const out = {};
    for (const v of [3, 2]) { me.veh = v; const i = ci(Math.floor(o.x) + 1, Math.floor(o.y), o.L); setCell(i, 22, W.slab[i], 0, 'test'); W.scar = []; const w0 = W.res.wood; act('crush', i); out[v] = { gone: !W.blk[i], wood: W.res.wood - w0, scar: W.scar.length, ch: W.scar.length ? W.scar[0][3] : null }; }
    me.ride = false; me.mform = 0; return out; });
  check('工蜂 flattens a tree into wood (60% chance it grows back); 赤刃 just flattens it (grows back)', s[3].gone && s[3].wood >= 3 && s[3].scar === 1 && s[3].ch === 0.6 && s[2].gone && s[2].scar === 1 && s[2].ch === 1, JSON.stringify(s));
  // net bits, loot
  s = await p.evaluate(() => { const o = spot(true); put(o); const w = spawnZombie('warden', 0), sh = spawnZombie('shade', 0), cr = spawnZombie('crow', 0); const S = makeSnap(), f = id => { for (let k = 0; k < S.z.length; k += 9) if (S.z[k] === id) return S.z[k + 8]; };
    const p0 = W.res.parts; killZombie(w, W.p[ME]); return { shield: !!(f(w.id) & 32768), cloak: !!(f(sh.id) & 65536), kind: (() => { for (let k = 0; k < S.z.length; k += 9) if (S.z[k] === cr.id) return ZKEYS[S.z[k + 1]]; })(), loot: W.res.parts - p0 }; });
  check('snapshot carries the bubble and cloak; a dead 能力者 drops parts', s.shield && s.cloak && s.kind === 'crow' && s.loot >= 6, JSON.stringify(s));
  // mech aiming: melee turns to a zombie off to the side and steps in; guns lock onto one 45° off your aim; the marker shows the pick
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; window.__dbg.god = true; const out = {};
    for (const v of [2, 5]) { me.vehs |= 1 << v; me.veh = v; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; me.mfly = false; me.gcd = 0; me.aim = 0; me.aimPt = null; me.x = o.x; me.y = o.y; me.z = pZ(me); W.zs.length = 0; W.edges = { 0: [[Math.floor(o.x) + 2, Math.floor(o.y), o.L]] };
      const z = spawnZombie('walker', 0), D = v === 2 ? 4 : 9, A = v === 2 ? 0.8 : 0.75; z.x = me.x + Math.cos(A) * D; z.y = me.y + Math.sin(A) * D; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 9999; z.stun = 99;
      for (let k = 1; k < 30; k++) { const f = k / 30; for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const cx = Math.floor(lerp(me.x, z.x, f)) + ox, cy = Math.floor(lerp(me.y, z.y, f)) + oy; for (let l = me.L; l < me.L + 4 && l < ML; l++) { const i = ci(cx, cy, l); if (W.blk[i] || W.slab[i] && l > me.L) setCell(i, 0, l > me.L ? 0 : W.slab[i], null, 'demo'); } } } // a clear line of sight for the test
      const lock = mechLock(me); const dbg = lock === z ? 0 : { d: +Math.hypot(z.x - me.x, z.y - me.y).toFixed(2), dz: +(z.z - me.z).toFixed(2), los: los(me.x, me.y, me.z + 1.6, z.x, z.y, z.z + z.h * 0.5), inM: inMech(me), atk: mechOf(me) && mechOf(me).atk, zs: W.zs.length }; mechPunch(me); for (let k = 0; k < 60; k++) { if (me.dash) stepMove(me, 1 / 60); stepDelayed(1 / 60); }
      out[v] = { dbg, lock: lock === z, hurt: Math.round(9999 - z.hp), moved: +Math.hypot(me.x - o.x, me.y - o.y).toFixed(2) }; }
    me.ride = false; me.mform = 0; window.__dbg.god = false; return out; });
  check('mech aiming: 赤刃 turns to a zombie 45° off its aim and steps in to chop it; 苍隼 locks its rockets onto one 9 tiles out, 43° off', s[2].lock && s[2].hurt > 0 && s[2].moved > 0.5 && s[5].lock && s[5].hurt > 0, JSON.stringify(s));
  // (round 36b) 苍隼 in the air: rockets at a zombie close below land on it (the downward angle used to be capped and they overshot)
  s = await p.evaluate(() => { const o = spot(true); put(o); const me = W.p[ME]; window.__dbg.god = true; me.vehs |= 32; me.veh = 5; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; me.mfly = true; me.alt = 1; me.gcd = 0; me.aim = 0; me.aimPt = null;
    me.L = Math.min(ML - 1, o.L + 2); me.z = o.L * FH + 2.2 * FH; const out = [];
    for (const D of [3, 6]) { W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + D; z.y = me.y; z.L = o.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 9999; z.stun = 99; me.gcd = 0; mechPunch(me); for (let k = 0; k < 90; k++) stepDelayed(1 / 60); out.push(Math.round(9999 - z.hp)); }
    me.ride = false; me.mform = 0; me.mfly = false; me.alt = 0; me.L = o.L; me.z = pZ(me); window.__dbg.god = false; return out; });
  check('苍隼 flying: rockets hit zombies 3 and 6 tiles out below it', s[0] > 0 && s[1] > 0, JSON.stringify(s));
  // drawing: flyers, auras, the bubble, the cloak shimmer, names over heads
  s = await p.evaluate(() => { window.__dbg.skipDraw = false; const o = spot(true); put(o); const me = W.p[ME]; W.edges = { 0: [[Math.floor(o.x) + 3, Math.floor(o.y), o.L]] };
    const a = spawnZombie('crow', 0), bt = spawnZombie('bat', 0), w = spawnZombie('warden', 0), sh = spawnZombie('shade', 0); sh.x = me.x + 2.5; sh.y = me.y; sh.stun = 99; w.x = me.x - 2; w.y = me.y; w.L = me.L; w.z = surfZ(w.x, w.y, w.L); w.stun = 99; /* (round 36n) pin it next to you so the lock-ring check doesn't depend on where it wandered */ for (const k of ['blinker', 'caller']) spawnZombie(k, 0);
    let t = performance.now(); for (let k = 0; k < 30; k++) { t += 16.7; frame(t); } a.dv = { ph: 1, t: 0 }; frame(t + 16.7); killZombie(a, me); for (let k = 0; k < 20; k++) { t += 16.7; frame(t); }
    const X = ELX.get(w.id), G = ELX.get(sh.id); me.vehs |= 4; me.veh = 2; me.ride = true; me.mform = 1; me.aim = Math.atan2(w.y - me.y, w.x - me.x); frame(t + 40); const mk = !!(MLOCK && MLOCK.visible); me.ride = false; me.mform = 0;
    return { mk, fly: FLY.size, elx: ELX.size, bub: !!(X && X.bub && X.bub.visible), ghost: !!(G && G.ghost.visible), labels: document.querySelectorAll('#ov .elt').length }; });
  check('drawn: birds (and a falling corpse), aura rings, the blue bubble, the cloaked shimmer, names over 能力者 heads', s.fly >= 2 && s.elx >= 4 && s.bub && s.ghost && s.labels >= 3 && s.mk, JSON.stringify(s));
  // (round 36b) the shop closes with a tap outside its card (like the map), not with a tap on the card
  s = await p.evaluate(() => { const M = document.getElementById('craft'), card = M.querySelector('.card'); M.classList.remove('hidden'); card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); const stays = !M.classList.contains('hidden'); M.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return { stays, closed: M.classList.contains('hidden') }; });
  check('shop: a tap on the card keeps it open, a tap beside it closes it', s.stays && s.closed, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
