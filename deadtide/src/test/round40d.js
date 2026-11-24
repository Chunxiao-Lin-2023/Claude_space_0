// Round 40d/e: fusion capsules — found while searching, used alone (J with no partner close): fire swings body + module together, G = combined skill, a timer
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
  // drops: only once someone has a mech; about 1 in 33 searches; at most 4 held
  let s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], out = {}; W.strayT = 1e9; W.phase = 'day';
    const cells = []; for (let i = 0; i < W.blk.length && cells.length < 500; i++) { const b = W.blk[i]; if (b && B[b] && B[b].spot && SPOTS[B[b].spot] && !SPOTS[B[b].spot].bp && !W.srch.has(i)) cells.push(i); }
    me.vehs = 0; W.bps = []; for (const c of cells.slice(0, 60)) completeUse(me, { k: 'spot', i: c }); out.noMech = capN();
    me.vehs = 126; W.bps = []; W.capN = 0; let n = 0, got = 0; for (const c of cells.slice(60, 460)) { const b0 = capN(); completeUse(me, { k: 'spot', i: c }); n++; if (capN() > b0) got++; if (capN() >= BAL.capMax) { W.bps = W.bps.filter(b => b[0] !== 'c'); } }
    out.rate = [got, n].join('/'); W.bps = ['c1', 'c2', 'c3', 'c4', 'g1']; W.capN = BAL.capPity; completeUse(me, { k: 'spot', i: cells[470] }); out.cap = capN(); return out; });
  check('capsules drop only once someone has a mech, about every 30 searches, and you carry at most 4', s.noMech === 0 && +s.rate.split('/')[0] >= 6 && +s.rate.split('/')[0] <= 24 && s.cap === 4, JSON.stringify(s));
  // using one alone: J with no partner → the capsule mech joins as the module; pooled hull; you are the driver; the module attacks by itself; G is yours
  s = await S(() => { const o = spot(true); put(o); W.phase = 'day'; const me = W.p[ME], out = {}; W.p.length = 1; Object.assign(me, { vehs: 126, veh: 4, ride: true, mform: 1, mtr: 0, mh: [], bat: 120, mcd: 0, gcd: 0, evoOn: false, aim: 0, aimPt: null });
    W.bps = ['c2', 'g1', 'c5']; W.fus = null; const ev = []; const fx0 = window.fxEvent; window.fxEvent = e => { ev.push(e); return fx0(e); };
    try { doAct(me, 'fuse'); const F = W.fus; out.fused = F ? [F.v, F.kb, F.kp, F.b, F.d === me.i, F.max, F.hp, Math.round(F.left), W.bps.join('|')].join(',') : 'none'; out.ev = ev.some(e => e.k === 'fuse' && e.v === 1 && e.bz > me.z + 5);
      out.mech = [mechOf(me).name, fusRole(me)].join(',');
      const z = spawnZombie('walker', 0); z.x = me.x + 2.2; z.y = me.y + 0.3; z.L = me.L; z.z = me.z; z.hp = z.maxHp = 1e5; z.sleep = false; z.stun = 99; visTick(); me.invT = 0;
      ev.length = 0; F.vg = 0; for (let k = 0; k < 90; k++) fuseAI(me, 1 / 60, false); out.idle = ev.some(e => e.k === 'mpunch'); /* (round 40e) no AI: nothing while you don't fire */
      me.aim = Math.atan2(z.y - me.y, z.x - me.x); me.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; F.vg = 0; const aim0 = me.aim, gcd0 = me.gcd; fuseAI(me, 1 / 60, true); out.ai = [ev.some(e => e.k === 'mpunch' && e.fm === 1), me.aim === aim0, me.gcd === gcd0, F.vg > 0].join(',');
      for (let k = 0; k < 20; k++) stepDelayed(1 / 60); out.hit = Math.round(1e5 - z.hp) > 0; out.mechBack = mechOf(me).name;
      ev.length = 0; doAct(me, 'nade', { x: me.x + 6, y: me.y }); out.ult = [ev.some(e => e.k === 'fskill'), F.cd > 0].join(',');
      ev.length = 0; doAct(me, 'fswap'); out.swapDeny = ev.some(e => e.k === 'deny');
      const h0 = F.hp; hurtPlayer(me, 100); out.hurt = F.hp < h0;
      // the timer runs out: split, the capsule mech is gone, your own hull gets its share
      F.left = 0.01; fuseStep(1 / 60); out.end = [W.fus === null, ev.some(e => e.k === 'unfuse' && e.b === -1), inMech(me), mhpOf(me) > 0 && mhpOf(me) <= MECHS[4].hp].join(',');
      // J again with the next capsule; X splits early; no capsule left → the usual message
      doAct(me, 'fuse'); out.second = W.fus ? W.fus.kp : 0; doAct(me, 'xform'); out.early = W.fus === null; ev.length = 0; doAct(me, 'fuse'); out.none = ev.some(e => e.k === 'deny' && /队友/.test(e.why));
      // the snapshot carries a capsule fusion to a guest
      W.bps = ['c6']; doAct(me, 'fuse'); const sn = makeSnap(); const keep = W.fus; W.fus = null; applySnap(JSON.parse(JSON.stringify(sn))); out.guest = W.fus ? [W.fus.v, W.fus.kp, W.fus.g, W.fus.left > 40].join(',') : 'none'; W.fus = keep;
    } finally { window.fxEvent = fx0; }
    return out; });
  check('J alone uses the first capsule: a virtual partner (module only), pooled hull, it falls from the sky', /^1,4,2,-1,true,3240,/.test(s.fused) && s.fused.endsWith(',45,g1|c5') && s.ev && s.mech === '铁卫,d', JSON.stringify(s));
  check('the module attacks only while you fire, at what you aim at (its own cooldown, your swing untouched), and hits', !s.idle && s.ai === 'true,true,true,true' && s.hit && s.mechBack === '铁卫', JSON.stringify(s));
  check('alone you fire the combined skill; K is refused; hits land on the pooled hull', s.ult === 'true,true' && s.swapDeny && s.hurt, JSON.stringify(s));
  check('time up: split, your mech keeps its share; the next capsule works; X splits early; none left → the partner message', s.end === 'true,true,true,true' && s.second === 5 && s.early && s.none, JSON.stringify(s));
  check('the snapshot carries a capsule fusion to a guest', s.guest === '1,6,-1,true', s.guest);
  // the cut-in draws the capsule pod falling in, then hides it
  s = await S(() => { window.__dbg.skipDraw = false; const me = W.p[ME], out = {}; fuseSplit(W.fus, 'x'); let T = performance.now(); const st = n => { for (let k = 0; k < n; k++) { T += 16.7; frame(T); } }; st(30); W.bps = ['c1']; doAct(me, 'fuse'); st(20);
    const V = RND.fusVM; out.pod = !!(V && V.g.visible && V.mech && V.k === 1); out.podH = V ? Math.round((V.g.position.y - me.z) * 10) / 10 : -1; st(60); out.gone = !!(V && !V.g.visible); out.mod = !!(OBJ.pl[0].mech.userData.fmods[1] && OBJ.pl[0].mech.userData.fmods[1].visible); return out; });
  check('cut-in: a glowing pod with the capsule mech falls in from above, then disappears into the body', s.pod && s.podH > 2 && s.gone && s.mod, JSON.stringify(s));
  s = await S(() => { window.__dbg.skipDraw = true; const me = W.p[ME], out = []; if (W.fus) fuseSplit(W.fus, 'x'); put(spot(true)); W.phase = 'day'; Object.assign(me, { ride: true, mform: 1, mtr: 0, bat: 120, mcd: 0, gcd: 0, evoOn: false, aim: 0, aimPt: null, ccStg: 0 }); /* a fresh open spot: nothing between it and the zombie */
    for (const kp of [1, 2, 3, 4, 5, 6]) { W.zs.length = 0; W.dly = []; me.mh = []; me.veh = kp === 4 ? 2 : 4; W.bps = ['c' + kp]; doAct(me, 'fuse'); const F = W.fus; me.invT = 0;
      const z = spawnZombie('walker', 0); z.x = me.x + 2.4; z.y = me.y; z.L = me.L; z.z = me.z; z.hp = z.maxHp = 1e5; z.sleep = false; z.stun = 99; visTick();
      me.aim = 0; me.aimPt = { x: z.x, y: z.y, z: z.z, zb: z }; let n = 0; for (let k = 0; k < 150; k++) { fuseAI(me, 1 / 60, true); stepDelayed(1 / 60); stepProj && stepProj(1 / 60); n = 1e5 - z.hp; }
      out.push(MECHS[kp].name + ':' + Math.round(n) + (n > 0 ? '' : '[' + [!!F, F && F.vg, inMech(me), me.mtr, me.ccStg, zSeen(z), Math.round(Math.hypot(z.x - me.x, z.y - me.y) * 10) / 10, z.hp > 0, me.down, me.dead].join(',') + ']')); fuseSplit(F, 'x'); }
    return out.join(' '); });
  check('every capsule kind\'s module fires with you (blade, machine gun, parcels, shield, rockets, cannon)', s.split(' ').every(t => +t.split(':')[1] > 0), s);
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})();
