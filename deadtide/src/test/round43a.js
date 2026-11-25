// Round 43a: capsules solo-only; 铁卫's rocket fist; 铁熊's charge-then-slap
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
  await S(() => { window.evs = []; const f0 = window.fxEvent; window.fxEvent = e => { window.evs.push(e); return f0(e); };
    window.mech = (v) => { const o = spot(true); put(o); W.phase = 'day'; const me = W.p[ME]; Object.assign(me, { vehs: 126, veh: v, ride: true, mform: 1, mtr: 0, mh: [], bat: 120, mcd: 0, gcd: 0, evoOn: false, evo: 0, aim: 0, aimPt: null, mcmb: 0, mlastT: -9 }); W.fus = null; window.evs.length = 0; return me; };
    window.zAt = (me, dx, dy, hp) => { const z = spawnZombie('walker', 0); z.x = me.x + dx; z.y = me.y + dy; z.L = me.L; z.z = me.z; z.hp = z.maxHp = hp || 1e5; z.sleep = false; z.stun = 99; visTick(); return z; };
    window.steps = (sec) => { for (let k = 0; k < Math.round(sec * 60); k++) { W.t += 1 / 60; stepDelayed(1 / 60); me_mv(1 / 60); } };
    window.me_mv = dt => { for (const q of W.p) { const d = q.dash; if (d && d.T) { f = Math.min(1, (d.t + dt) / d.T) - Math.min(1, d.t / d.T); q.x += d.dx * f; q.y += d.dy * f; d.t += dt; if (d.t >= d.T) q.dash = null; } } }; });
  // capsules: solo only
  let s = await S(() => { const me = mech(4), out = {}; W.bps = ['c2', 'c3']; out.solo = capN();
    const q = mkPlayer(1, 'B'); W.p.push(q); out.duo = capN(); const cells = []; for (let i = 0; i < W.blk.length && cells.length < 200; i++) { const b = W.blk[i]; if (b && B[b] && B[b].spot && SPOTS[B[b].spot] && !SPOTS[B[b].spot].bp && !W.srch.has(i)) cells.push(i); }
    W.capN = BAL.capPity; for (const c of cells.slice(0, 120)) completeUse(me, { k: 'spot', i: c }); out.duoDrop = W.bps.filter(b => b[0] === 'c').length; out.kept = W.bps.join('|');
    evs.length = 0; doAct(me, 'fuse'); out.duoJ = !W.fus || !W.fus.v; q.gone = true; out.back = capN(); W.p.pop(); return out; });
  check('capsules: usable alone; with two players none show, none drop, J does not use one; back alone they are still there', s.solo === 2 && s.duo === 0 && s.duoDrop === 2 && s.duoJ && s.back === 2, JSON.stringify(s));
  // 铁卫: pound, pound, rocket fist
  s = await S(() => { const me = mech(4), out = {}; const z1 = zAt(me, 2.0, 0), far = [zAt(me, 7.5, 0, 500), zAt(me, 7.8, 1.0, 500), zAt(me, 8.2, -0.9, 500)];
    const hp = () => Math.round(1e5 - z1.hp); const blows = [];
    for (let k = 0; k < 3; k++) { me.gcd = 0; me.aim = 0; me.aimPt = k < 2 ? { x: z1.x, y: z1.y, z: z1.z, zb: z1 } : { x: far[0].x, y: far[0].y, z: far[0].z, zb: far[0] }; const h0 = hp(); const r0 = mechShoot; let rv = 0; window.mechShoot = function () { rv = r0.apply(this, arguments); return rv; }; mechPunch(me); window.mechShoot = r0; if (k === 2) out.tt = Math.round(rv * 100) / 100; out['gcd' + k] = Math.round(me.gcd * 100) / 100; steps(0.9); blows.push(hp() - h0); }
    out.blows = blows.join(','); const F = evs.find(e => e.k === 'mrkt' && e.kd === 'fist'), Bm = evs.find(e => e.k === 'rfboom'); out.fist = !!F; out.boom = Bm ? [Bm.r, Math.round(Math.hypot(Bm.x - far[0].x, Bm.y - far[0].y) * 10) / 10].join(',') : 'none';
    out.farHurt = far.map(z => Math.round(500 - Math.max(0, z.hp))).join(','); out.flung = far.some(z => Math.hypot(z.vx || 0, z.vy || 0) > 1 || Math.hypot(z.x - me.x, z.y - me.y) > 8.6); return out; });
  check('铁卫: two pounds land on the zombie in front, the third fires the rocket fist', s.blows.split(',').slice(0, 2).every(n => +n > 100) && s.fist, JSON.stringify(s));
  check('铁卫: the fist bursts at the group 7–8 tiles away (radius 2.4) and hurts all three', s.boom !== 'none' && +s.boom.split(',')[0] === 2.4 && +s.boom.split(',')[1] < 1.2 && s.farHurt.split(',').every(n => +n > 60), JSON.stringify(s));
  check('铁卫: the arm is empty until the fist is back (cooldown ≥ flight + 0.5 s)', s.gcd2 >= s.tt + 0.5 - 0.01, JSON.stringify(s));
  // 铁熊: charges in only when a zombie is within 4
  s = await S(() => { const me = mech(6), out = {}; me.evoOn = true; me.evo = 100; const z = zAt(me, 3.6, 0); me.aim = 0; me.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; const x0 = me.x, h0 = z.hp; mechPunch(me); steps(0.6);
    out.lunge = [evs.some(e => e.k === 'blunge'), Math.round((me.x - x0) * 10) / 10, Math.round(h0 - z.hp) > 100].join(',');
    const me2 = mech(6); me2.evoOn = true; me2.evo = 100; zAt(me2, 7, 0); me2.aim = 0; evs.length = 0; const x1 = me2.x; mechPunch(me2); steps(0.6); out.none = [evs.some(e => e.k === 'blunge'), Math.round((me2.x - x1) * 10) / 10].join(','); return out; });
  check('铁熊: a zombie 3.6 tiles off — it charges about 2 tiles in and the slap lands', /^true,(1\.[5-9]|2(\.\d)?),true$/.test(s.lunge), JSON.stringify(s));
  check('铁熊: nothing within 4 — it slaps on the spot', s.none === 'false,0', JSON.stringify(s));
  check('no errors', !errs.length, errs);
  await b.close(); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
})();
