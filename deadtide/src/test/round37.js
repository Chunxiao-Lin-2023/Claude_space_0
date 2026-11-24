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
  // (round 37) 第二形态: the 进化 meter fills from kills in mech form; X turns a full mech into its beast; each beast has its own attack / skill / stats
  let s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; me.vehs |= 2; me.veh = 1; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; me.evo = 0; me.evoOn = false; W.phase = 'night'; W.strayT = 1e9;
    for (let k = 0; k < 25; k++) { const z = spawnZombie('walker', 0); z.x = me.x + 3; z.y = me.y; z.L = me.L; killZombie(z, me); } const full = me.evo; W.zs.length = 0;
    doAct(me, 'xform', 'evo'); /* (round 38j) hold X evolves */ const on = me.evoOn, name = mechOf(me).name, spd = mechOf(me).spd; for (let k = 0; k < 60; k++) stepActions(me, 1 / 60); const after1s = +me.evo.toFixed(1);
    doAct(me, 'xform'); const back = !me.evoOn && inMech(me); me.evo = 100; doAct(me, 'xform', 'evo'); const again = me.evoOn; doAct(me, 'xform', 'evo'); const veh = !me.evoOn && me.mform === 0 && me.mtr > 0; me.mtr = 0;
    me.mform = 1; me.evo = 100; doAct(me, 'xform', 'evo'); for (let k = 0; k < 60 * 23; k++) stepActions(me, 1 / 60); const ranOut = !me.evoOn && inMech(me);
    me.ride = false; me.mform = 0; return { full, on, name, spd, after1s, back, again, veh, ranOut }; });
  check('进化: 25 kills fill the meter; X evolves 疾风 → 青蛇 (faster); it drains over 22 s; X turns back, hold X goes to the vehicle; running out → back to the mech', s.full === 100 && s.on && s.name === '青蛇' && s.spd > 1.65 && s.after1s > 94 && s.after1s < 96.5 && s.back && s.again && s.veh && s.ranOut, JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME]; W.phase = 'night'; W.strayT = 1e9; window.__dbg.god = false; const out = {};
    for (const v of [1, 2, 3, 4, 5, 6]) { me.vehs |= 1 << v; me.veh = v; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; me.mfly = v === 5; me.evo = 100; me.evoOn = false; me.aim = 0; me.aimPt = null; me.mcd = 0; me.gcd = 0; me.x = o.x; me.y = o.y; me.L = o.L; me.z = pZ(me) + (v === 5 ? 2 : 0); me.jmp = null; me.dash = null;
      W.zs.length = 0; W.dly = []; doAct(me, 'xform', 'evo'); const zs = [1.6, 2.6, 3.4].map(d => { const z = spawnZombie('walker', 0); z.x = me.x + d; z.y = me.y + 0.2; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 5000; z.sleep = 0; z.stun = 99; return z; }); visTick();
      for (let k = 0; k < 3; k++) { me.gcd = 0; mechPunch(me); for (let f = 0; f < 40; f++) { stepDelayed(1 / 60); if (me.jmp || me.dash) stepActions(me, 1 / 60); } }
      const atk = zs.reduce((t, z) => t + (z.max - z.hp), 0); zs.forEach(z => { z.hp = z.max; }); me.mcd = 0; mechSkill(me, { x: me.x + 4, y: me.y }); for (let f = 0; f < 90; f++) { stepDelayed(1 / 60); stepEvoWorld(1 / 60); evoStep(me, 1 / 60); if (me.jmp || me.dash) stepActions(me, 1 / 60); }
      const sk = zs.reduce((t, z) => t + (z.max - z.hp), 0); out[mechOf(me).name] = [Math.round(atk), Math.round(sk), me.mcd > 0, !!me.spinT || !!me.rageT]; me.evoOn = false; }
    me.ride = false; me.mform = 0; me.mfly = false; W.zs.length = 0; W.cz = []; return out; });
  check('every beast hits with its attack and its skill', Object.values(s).length === 6 && Object.values(s).every(r => r[0] > 0 && r[1] > 0 && r[2]), JSON.stringify(s));
  s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], mate = { ...me }; const out = {};
    me.veh = 4; me.ride = true; me.mform = 1; me.mh = []; me.evoOn = true; me.spinT = 2; const h0 = mhpOf(me); hurtPlayer(me, 100); out.spin = h0 - mhpOf(me); me.spinT = 0; hurtPlayer(me, 100); out.shell = Math.round(h0 - mhpOf(me));
    me.veh = 1; me.mh = []; let dodged = 0; for (let k = 0; k < 200; k++) { me.hp = me.maxHp; me.dead = false; const h = mhpOf(me); hurtPlayer(me, 10); if (mhpOf(me) === h) dodged++; me.mh = []; } out.dodge = dodged;
    me.evoOn = false; me.ride = false; me.mform = 0; return out; });
  check('玄龟 spinning takes nothing, in the shell ×0.3 (÷1.5 mech toughness); 青蛇 slips ~35% of hits', s.spin === 0 && s.shell === 20 && s.dodge > 45 && s.dodge < 95, JSON.stringify(s));
  s = await S(() => { const me = W.p[ME], out = {}; me.ride = true; me.mform = 1; me.mtr = 0; me.bat = 120; me.spinT = 0; // (round 38f) beasts are tougher, 玉兔 most of all; only 5% reaches the pilot
    for (const v of [2, 3, 4, 5, 6]) { me.veh = v; me.mh = []; me.evoOn = true; me.hp = me.maxHp; const h0 = mhpOf(me), p0 = me.hp; hurtPlayer(me, 100); out[v] = [Math.round(h0 - mhpOf(me)), Math.round((p0 - me.hp) * 10) / 10]; }
    me.evoOn = false; me.veh = 3; me.mh = []; me.hp = me.maxHp; const h1 = mhpOf(me), p1 = me.hp; hurtPlayer(me, 100); out.mech = [Math.round(h1 - mhpOf(me)), Math.round((p1 - me.hp) * 10) / 10]; me.ride = false; me.mform = 0; return out; });
  check('beast hulls (÷1.5 since round 38g): 赤龙 37 · 玉兔 30 · 玄龟 20 · 火凤 43 · 铁熊 30 per 100 (工蜂 60); pilot gets 5 in beast form, 10 in a mech', s[2][0] === 37 && s[3][0] === 30 && s[4][0] === 20 && s[5][0] === 43 && s[6][0] === 30 && s.mech[0] === 60 && s[3][1] === 5 && s.mech[1] === 10, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
