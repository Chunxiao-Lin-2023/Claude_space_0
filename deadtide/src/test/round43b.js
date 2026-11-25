// Round 43b: fusion parts — the tower shield (slam / boomerang / front block), backhands, heavy+wings glide & whirlwind, light+wings wing-meter flight, air attacks and the dive
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
    window.tk = (sec, f) => { for (let k = 0; k < Math.round(sec * 60); k++) { W.t += 1 / 60; stepDelayed(1 / 60); fuseStep(1 / 60); sboomStep(1 / 60); whirlStep(1 / 60); me_mv(1 / 60); if (f) f(k); } }; });
  // tower shield: slam close, boomerang far (both ways), the shield is gone meanwhile
  let s = await S(() => { const [me, g] = duo(2, 4), out = {}, z = zAt(me, 2.2, 0); g.aim = 0; g.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; mechPunch(g); tk(0.5); out.slam = [Math.round(1e5 - z.hp), evs.some(e => e.k === 'sslam'), evs.some(e => e.k === 'mpunch' && e.sk === 1)].join(',');
    const far = zAt(me, 7.5, 0.3); z.hp = 1e5; z.x = me.x - 30; g.gcd = 0; g.aimPt = { x: far.x, y: far.y, z: far.z, zb: far }; evs.length = 0; mechPunch(g); out.thrown = [!!(W.sboom && W.sboom.length), W.fus.shOut > W.t, evs.some(e => e.k === 'sboom'), evs.some(e => e.k === 'mpunch' && e.sk === 2)].join(',');
    let mid = 0; tk(1.3, k => { if (k === 30) mid = Math.round(1e5 - far.hp); }); out.legs = [mid, Math.round(1e5 - far.hp)].join(','); out.back = [(W.sboom || []).length, W.fus.shOut > W.t].join(','); return out; });
  check('shield: a zombie in close — the shield is slammed down on it', /^\d+,true,true$/.test(s.slam) && +s.slam.split(',')[0] > 80, JSON.stringify(s));
  check('shield: further off it is thrown (gone from the arm meanwhile)', s.thrown === 'true,true,true,true', JSON.stringify(s));
  check('shield: it hits on the way out and again on the way back, then it is back on the arm', +s.legs.split(',')[0] > 50 && +s.legs.split(',')[1] > +s.legs.split(',')[0] + 50 && s.back === '0,false', JSON.stringify(s));
  // front block ×0.6 (not from behind, not while thrown); 重炮's reactive armour ×0.9
  s = await S(() => { const out = {}; let [me, g] = duo(2, 4); me.aim = 0; const F = W.fus, hit = (dx) => { me.invT = 0; g.invT = 0; const h0 = F.hp; hurtPlayer(me, 100, { x: me.x + dx, y: me.y, k: 'walker' }); me.invT = 0; return Math.round(h0 - F.hp); };
    out.front = hit(2); out.rear = hit(-2); F.shOut = W.t + 5; out.thrownFront = hit(2); F.shOut = 0;
    [me, g] = duo(2, 6); me.aim = 0; me.invT = 0; const F2 = W.fus, h1 = F2.hp; hurtPlayer(me, 100, { x: me.x + 2, y: me.y, k: 'walker' }); out.react = Math.round(h1 - F2.hp);
    [me, g] = duo(2, 1); me.aim = 0; me.invT = 0; const F3 = W.fus, h2 = F3.hp; hurtPlayer(me, 100, { x: me.x + 2, y: me.y, k: 'walker' }); out.plain = Math.round(h2 - F3.hp); return out; });
  check('shield: hits from the front ×0.6, from behind full, none while it is thrown', Math.abs(s.front / s.rear - 0.6) < 0.03 && s.thrownFront === s.rear, JSON.stringify(s));
  check('重炮 module: reactive armour ×0.9', Math.abs(s.react / s.plain - 0.9) < 0.03, JSON.stringify(s));
  // backhand: the partner strikes behind the body
  s = await S(() => { const [me, g] = duo(4, 2); me.aim = 0; const z = zAt(me, -2.2, 0); g.aim = Math.PI; g.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; mechPunch(g); tk(0.4); return [evs.some(e => e.k === 'mpunch' && e.o === 1 && e.sk === 3), Math.round(1e5 - z.hp) > 50].join(','); });
  check('two players: the partner hits a zombie behind the body with a backhand (sk 3)', s === 'true,true', s);
  // heavy + wings: glide ×1.05, every 4th rocket a whirlwind that pulls zombies in
  s = await S(() => { const [me, g] = duo(4, 5), out = {}; out.spd = fusSpd(W.fus); const zs = [zAt(me, 6.5, 2.4), zAt(me, 6.5, -2.4), zAt(me, 8.8, 0)]; zs.forEach(z => z.stun = 0);
    g.aim = 0; let n = 0; for (let k = 0; k < 4; k++) { g.gcd = 0; g.aimPt = { x: me.x + 6.5, y: me.y, z: me.z }; mechPunch(g); } out.whirl = evs.filter(e => e.k === 'whirl').length; const W0 = (W.whirl || [])[0];
    const d0 = zs.map(z => Math.hypot(z.x - W0.x, z.y - W0.y)); tk(2.0, () => zs.forEach(z => { z.stun = Math.max(z.stun, 0); })); const d1 = zs.map(z => Math.hypot(z.x - W0.x, z.y - W0.y)); out.pull = d0.map((d, i) => d - d1[i] > 0.8).join(','); out.dmg = zs.map(z => Math.round(1e5 - z.hp)).join(','); return out; });
  check('苍隼 + 铁卫: glides ×1.05 (faster than a normal fusion ×0.9)', s.spd === 1.05, JSON.stringify(s));
  check('苍隼 + 铁卫: the 4th rocket is a whirlwind; it drags the zombies around into its eye and hurts them', s.whirl === 1 && s.pull === 'true,true,true' && s.dmg.split(',').every(n => +n > 0), JSON.stringify(s));
  // light + wings: 4 cuts fill the wing meter → it flies; in the air the blade throws waves; after 4 s it dives on the aim point with 翼刀落斩
  s = await S(() => { const [me, g] = duo(2, 5), out = {}, z = zAt(me, 2.2, 0); me.aim = 0; let n = 0;
    for (let k = 0; k < 4; k++) { me.gcd = 0; me.mlastT = -9; me.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; mechPunch(me); tk(0.3); } const F = W.fus; out.fly = [!!F.fly, airborne(me), airborne(g), evs.some(e => e.k === 'ffly')].join(',');
    const far = zAt(me, 6, 0); me.gcd = 0; me.aimPt = { x: far.x, y: far.y, z: far.z, zb: far }; evs.length = 0; mechPunch(me); out.wave = [evs.some(e => e.k === 'bwave'), Math.round(1e5 - far.hp) > 30].join(',');
    const tz = zAt(me, 6, 1.5); me.aimPt = { x: me.x + 6, y: me.y + 1.5, z: me.z, auto: false }; const x0 = me.x; tk(4.5); out.dive = [evs.some(e => e.k === 'fdive'), evs.some(e => e.k === 'fdhit' && e.kk === '2-5'), Math.round(me.x - x0), me.mfly, airborne(me), Math.round(1e5 - tz.hp) > 100].join(','); return out; });
  check('苍隼 + 赤刃: 4 cuts fill the wing meter and it takes off (both pilots in the air)', s.fly === 'true,true,true,true', JSON.stringify(s));
  check('苍隼 + 赤刃: in the air a cut is a blade wave that reaches 6 tiles', s.wave === 'true,true', JSON.stringify(s));
  check('苍隼 + 赤刃: 4 s later it dives ~6 tiles onto the aim point, 翼刀落斩 lands, back on the ground', /^true,true,[56],false,false,true$/.test(s.dive), JSON.stringify(s));
  // 工蜂 + 苍隼 drops a parcel a second while flying; 疾风 + 苍隼's landing sweep; a capsule 铁卫 swings the shield
  s = await S(() => { const out = {}; let [me, g] = duo(3, 5); W.fus.wg = 1; tk(0.1); const n0 = W.dly.filter(d => d.box).length; tk(2.05); out.drops = evs.filter(e => e.k === 'mrkt' && e.kd === 'parcel' && e.o === me.i).length;
    [me, g] = duo(1, 5); W.fus.wg = 1; tk(0.1); const z = zAt(me, 6.2, 0); me.aimPt = { x: me.x + 6, y: me.y, z: me.z }; tk(4.6); out.sweep = [evs.some(e => e.k === 'fdhit' && e.kk === '1-5'), Math.round(1e5 - z.hp) > 120].join(',');
    W.p.pop(); const m2 = mech(2); W.bps = ['c4']; doAct(m2, 'fuse'); const zc = zAt(m2, 2.2, 0); m2.aim = 0; m2.aimPt = { x: zc.x, y: zc.y, z: zc.z, zb: zc }; W.fus.vg = 0; evs.length = 0; fuseAI(m2, 1 / 60, true); tk(0.5); out.cap = [evs.some(e => e.k === 'sslam'), Math.round(1e5 - zc.hp) > 80].join(','); return out; });
  check('工蜂 + 苍隼: flying, it drops a parcel under itself every second', s.drops >= 2, JSON.stringify(s));
  check('疾风 + 苍隼: the landing sweep (旋翼轰降) hurts what is around', s.sweep === 'true,true', JSON.stringify(s));
  check('capsule 铁卫: alone, firing slams the shield too', s.cap === 'true,true', JSON.stringify(s));
  check('no errors', !errs.length, errs);
  await b.close(); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
})();
