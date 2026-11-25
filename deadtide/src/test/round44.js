// Round 44: every mech and every beast has an attack that reaches each flying zombie (at its hover height)
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
  const s = await S(() => { const fk = Object.keys(ZT).filter(k => ZT[k].fly), out = {}; window.__dbg.god = true;
    const tryAtk = (v, evo, k, d, how) => { const me = mech(v); if (evo) { me.evoOn = true; me.evo = 100; } me.shl = 9; me.bat = 120; const z = spawnZombie(k, 0); z.x = me.x + d; z.y = me.y; z.L = me.L; z.z = me.z + ZT[k].fly.alt; z.hp = z.maxHp = 1e5; z.sleep = false; z.stun = 99; z.fa = 0; visTick();
      me.aim = 0; me.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; const hp0 = z.hp;
      for (let n = 0; n < 3; n++) { me.gcd = 0; me.mcd = 0; if (how === 'atk') mechPunch(me); else mechSkill(me, { x: z.x, y: z.y }); for (let k2 = 0; k2 < 50; k2++) { W.t += 1 / 60; stepDelayed(1 / 60); stepProj(1 / 60); stepDrones(1 / 60); me_mv(1 / 60); z.z = me.z + ZT[k].fly.alt; z.x = me.x + d; z.y = me.y; } }
      return Math.round(hp0 - z.hp); };
    for (const v of [1, 2, 3, 4, 5, 6]) for (const evo of [0, 1]) { const nm = evo ? EVO[v].name : MECHS[v].name, row = {};
      for (const k of fk) { const r = []; for (const d of [2.5, 6]) { r.push(tryAtk(v, evo, k, d, 'atk')); } r.push(tryAtk(v, evo, k, 4, 'sk')); row[k] = r.join('/'); } out[nm] = row; }
    window.__dbg.god = false; return { fk, out }; });
  console.log('flyers', s.fk.join(','));
  for (const nm in s.out) { const row = s.out[nm]; const line = s.fk.map(k => k + ':' + row[k]).join('  '); const okAll = s.fk.every(k => row[k].split('/').slice(0, 2).some(n => +n > 0)); check(nm + ' normal attack reaches every flyer (near / mid / skill dmg)', okAll, line); }
  check('no errors', !errs.length, errs);
  await b.close(); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
})();
