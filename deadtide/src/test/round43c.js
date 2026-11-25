// Round 43c: the 21 fusion ultimates — each fires, hurts the crowd in front, the right cooldown, and its own rule (rooted, walls, invulnerable, blocks shots, lands again)
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
  await S(() => { window.duo = (kb, kp) => { const me = mech(kb); let q = W.p[1]; if (!q) { q = mkPlayer(1, 'B'); W.p.push(q); } Object.assign(q, { x: me.x + 1, y: me.y, L: me.L, z: me.z, vehs: 126, veh: kp, ride: true, mform: 1, mtr: 0, mh: [], evoOn: false, bat: 120, aim: 0, gone: false, dead: false, down: false, gcd: 0, mcd: 0, mfly: false, aimPt: null }); me.bat = 120; me.mfly = false; fuseStart(me, q); q.x = me.x; q.y = me.y; evs.length = 0; return [me, q]; };
    window.tk = (sec, f) => { for (let k = 0; k < Math.round(sec * 60); k++) { W.t += 1 / 60; stepDelayed(1 / 60); fuseStep(1 / 60); sboomStep(1 / 60); whirlStep(1 / 60); stepDrones(1 / 60); stepProj(1 / 60); me_mv(1 / 60); W.p.forEach(q => { if (q.invT > 0) q.invT -= 1 / 60; }); if (f) f(k); } }; });
  const keys = ['1-2', '1-3', '1-4', '1-5', '1-6', '2-3', '2-4', '2-5', '2-6', '3-4', '3-5', '3-6', '4-5', '4-6', '5-6', '1-1', '2-2', '3-3', '4-4', '5-5', '6-6'];
  for (const key of keys) {
    const s = await S((key) => { const [kb, kp] = key.split('-').map(Number), [me, g] = duo(kb, kp), out = {}; me.aim = 0; g.aim = 0; me.shl = g.shl = 9; const F = W.fus;
      const crowd = []; for (let k = 0; k < 8; k++) { const z = zAt(me, 5 + (k % 3) * 1.2, (Math.floor(k / 3) - 1) * 1.3, 4000); z.stun = 0; crowd.push(z); } const hp0 = crowd.reduce((t, z) => t + z.hp, 0);
      g.aimPt = { x: me.x + 6, y: me.y, z: me.z }; evs.length = 0; fuseSkill(g, { x: me.x + 6, y: me.y }); out.ev = evs.some(e => e.k === 'fskill' && e.kk === key); out.name = (evs.find(e => e.k === 'fskill') || {}).n; out.cd = F.cd;
      let lockSpd = null, walls = 0, inv = null, maxWalls = 0; const proj0 = W.proj.length; W.proj.push({ k: 'arrow', x: me.x + 3, y: me.y, z: me.z + 1.5, vx: -20, vy: 0, vz: 0, t: 0.8, dm: 10 });
      tk(11, k => { if (key === '2-5' && k < 60) { me.x += 4.5 / 60; g.x = me.x; } if (k === 30) { lockSpd = fusSpd(F); inv = me.invT > 0; } if (W.ftmp) maxWalls = Math.max(maxWalls, W.ftmp.length); });
      out.dmg = Math.round(hp0 - crowd.reduce((t, z) => t + Math.max(0, z.hp), 0)); out.lock = lockSpd; out.inv = inv; out.walls = maxWalls; out.wallsLeft = (W.ftmp || []).length; out.blocked = evs.some(e => e.k === 'fult' && e.ek === 'pblock'); out.air = [me.mfly, g.mfly, airborne(me)].join(','); out.ult = F.ultT > W.t; out.fus = !!W.fus;
      return out; }, key);
    const ok1 = s.ev && s.dmg > (key === '3-4' ? 500 : 1500) && s.cd === (key[0] === key[2] ? 22 : 18) && s.air === 'false,false,false' && s.fus && !s.ult;
    let extra = true, why = '';
    if (key === '1-6' || key === '4-4') { extra = s.lock === 0; why = 'rooted'; }
    if (key === '3-4') { extra = s.walls >= 4 && s.wallsLeft === 0; why = 'walls up then gone'; }
    if (key === '4-4' || key === '2-2') { extra = extra && s.inv === true; why += ' invulnerable'; }
    if (key === '1-1') { extra = s.blocked; why = 'shots blocked'; }
    check(key + ' ' + s.name + ': fires, hurts the crowd' + (key === '2-5' ? ' (carried into it)' : '') + ', cooldown ' + (key[0] === key[2] ? 22 : 18) + ' s, everyone back on the ground' + (why ? ', ' + why : ''), ok1 && extra, JSON.stringify(s));
  }
  check('no errors', !errs.length, errs);
  await b.close(); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
})();
