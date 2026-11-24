// Round 40: co-op mech fusion (ask / agree, roles, pooled hull, combined ultimate, swap, split, modules, net)
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
  // two mechs side by side: 1P 铁卫, 2P 赤刃
  let s = await S(() => { const o = spot(true); put(o); const me = W.p[ME], q = mkPlayer(1, '小青'); W.p.push(q); q.x = me.x + 1.5; q.y = me.y; q.L = me.L; q.z = me.z;
    for (const [pp, v] of [[me, 4], [q, 2]]) { pp.vehs |= 1 << v; pp.veh = v; pp.ride = true; pp.mform = 1; pp.mtr = 0; pp.mh = []; pp.bat = 120; pp.mcd = 0; pp.gcd = 0; pp.evoOn = false; pp.aim = 0; }
    const out = {}; doAct(me, 'fuse'); out.req = !!W.fusReq && !W.fus; doAct(q, 'fuse'); const F = W.fus; out.fused = !!F;
    out.roles = [F.kb, F.kp, F.d === me.i, F.g === q.i, mechOf(me).name, mechOf(q).name, F.max, F.hp].join(',');
    me.invT = q.invT = 0; const h0 = F.hp, mh0 = mhpOf(me); hurtPlayer(q, 100); out.hurt = [Math.round((h0 - F.hp) * 10) / 10, mhpOf(me) === mh0, q.hp === q.maxHp].join(',');
    const z = spawnZombie('walker', 0); z.x = me.x + 2; z.y = me.y; z.L = me.L; z.z = me.z; z.hp = z.maxHp = 1e5; z.sleep = false; hurtZombie(z, 100, me); out.dmg = Math.round(1e5 - z.hp);
    const qx = q.x; z.x = me.x + 3.4; q.gcd = 0; mechPunch(q); out.noDash = q.x === qx;
    const ev = []; const fx0 = window.fxEvent; window.fxEvent = e => { ev.push(e); return fx0(e); };
    try { doAct(me, 'nade', { x: me.x + 6, y: me.y }); out.drvDeny = ev.some(e => e.k === 'deny' && /炮手/.test(e.why)); ev.length = 0; doAct(q, 'nade', { x: me.x + 6, y: me.y }); out.ult = [ev.some(e => e.k === 'fskill'), ev.filter(e => e.k === 'mskill').map(e => e.t).join('+'), F.cd].join(',');
      ev.length = 0; doAct(q, 'nade', {}); out.ultCd = ev.some(e => e.k === 'deny' && /冷却/.test(e.why)); } finally { window.fxEvent = fx0; }
    doAct(q, 'fswap'); out.swap = [F.d === q.i, mechOf(q).name, mechOf(me).name].join(',');
    // the gunner rides inside: stepping the gunner snaps it onto the driver
    q.x += 3; me.x += 0; fuseStep(1 / 60); stepMove(me, 1 / 60); out.snap = Math.abs(me.x - q.x) < 1e-6 || Math.abs(q.x - me.x) < 0.01;
    F.hp = F.max * 0.5; doAct(me, 'xform'); out.split = [!W.fus, Math.round(mhpOf(me, 4)), Math.round(mhpOf(q, 2))].join(',');
    for (const pp of [me, q]) { pp.mh = []; pp.mtr = 0; pp.mform = 1; pp.ride = true; } q.x = me.x + 1; doAct(q, 'fuse'); doAct(me, 'fuse'); const F2 = W.fus; out.body2 = F2 && F2.kb === 2 && F2.d === q.i;
    me.invT = q.invT = 0; hurtPlayer(me, 1e6); out.broke = [!W.fus, me.mtr > 0 && me.mto === 0, q.mtr > 0 && q.mto === 0, mhpOf(me, 4), mhpOf(q, 2)].join(',');
    for (const pp of [me, q]) { pp.mh = []; pp.mtr = 0; pp.mform = 1; pp.ride = true; pp.veh = 6; pp.vehs |= 64; } q.x = me.x + 1; W.fus = null; W.fusReq = null; doAct(me, 'fuse'); doAct(q, 'fuse'); const F3 = W.fus; out.same = F3 ? [F3.same, F3.max, fusName(F3)].join(',') : 'none';
    z.hp = 1e5; hurtZombie(z, 100, me); out.sameDmg = Math.round(1e5 - z.hp);
    return out; });
  check('one asks, the other agrees: fused', s.req && s.fused, JSON.stringify(s));
  check('the asker is the body and drives (铁卫 attack), the other is the gunner (赤刃 attack); hull (2400 + 1200) × 0.9', s.roles === '4,2,true,true,铁卫,赤刃,3240,3240', s.roles);
  check('a hit on the gunner lands on the pooled hull (100 × 0.7 × 0.8 ÷ 1.5 = 37.3), pilots untouched', s.hurt === '37.3,true,true', s.hurt);
  check('fused attacks ×1.2 (on top of the mech ×1.5)', s.dmg === 180, s.dmg);
  check('the gunner\'s melee does not step the body', s.noDash);
  check('the driver cannot fire the ultimate; the gunner fires both skills at once, then it cools down', s.drvDeny && /^true,(quake\+dash|dash\+quake),10$/.test(s.ult) && s.ultCd, s.ult);
  check('K swaps: the attacks follow the roles', s.swap === 'true,铁卫,赤刃', s.swap);
  check('the gunner is kept inside the body', s.snap);
  check('split: each mech gets its share of what is left (half)', s.split === 'true,1200,600', s.split);
  check('the other one can be the body', s.body2);
  check('hull broken: split and both mechs knocked back to vehicles at 0', s.broke === 'true,true,true,0,0', s.broke);
  check('same kind: 4000 × 0.9 × 1.15, its own name, ×1.35', s.same === '1,4140,攻城重炮' && s.sameDmg === 203, s.same + ' ' + s.sameDmg);
  // drawing: the body grows and wears the module, the other pilot's model is hidden; the snapshot carries it to a guest
  s = await S(() => { window.__dbg.skipDraw = false; const me = W.p[ME], q = W.p[1], F = W.fus, out = {}; for (const pp of [me, q]) { pp.veh = pp === me ? 5 : 1; } F.kb = 5; F.kp = 1; F.same = 0;
    let T = performance.now(); for (let k = 0; k < 110; k++) { T += 16.7; frame(T); } /* (round 40c) past the 1.4 s cut-in */ const m = OBJ.pl[0], m2 = OBJ.pl[1]; out.scale = Math.round((m.mech.userData.fsc || 0) * 100) / 100; out.mod = !!(m.mech.userData.fmods && m.mech.userData.fmods[1] && m.mech.userData.fmods[1].visible); out.dbg = [m.mech.userData.J.k, F.kb, F.a, Object.keys(m.mech.userData.fmods || {}).join('|'), m.mech.children.length].join(';'); out.hide = !m2.g.visible;
    for (const k of [2, 3, 4, 5, 6]) { F.kp = k; for (let i = 0; i < 3; i++) { T += 16.7; frame(T); } out['m' + k] = !!(m.mech.userData.fmods[k] && m.mech.userData.fmods[k].visible); }
    const sn = makeSnap(); out.snap = JSON.stringify(sn.fu); const keep = W.fus; W.fus = null; applySnap(JSON.parse(JSON.stringify(sn))); out.guest = W.fus ? [W.fus.a, W.fus.b, W.fus.kb, W.fus.kp, W.fus.d, W.fus.g].join(',') : 'none'; W.fus = keep;
    return out; });
  check('the body grows ×1.3 and wears the module; the second pilot is hidden', s.scale > 1.2 && s.mod && s.hide, JSON.stringify(s));
  check('every kind of module builds and shows', s.m2 && s.m3 && s.m4 && s.m5 && s.m6, JSON.stringify(s));
  check('the snapshot carries the fusion to a guest', s.guest === '0,1,5,6,0,1', s.snap + ' ' + s.guest);
  // (round 40c) the cut-in: the partner's model flies in shrinking, the module bursts out after the impact, the name banner shows, then everything settles
  s = await S(() => { const me = W.p[ME], q = W.p[1], out = {}; fuseSplit(W.fus, 'x'); let T = performance.now(); const st = n => { for (let k = 0; k < n; k++) { T += 16.7; frame(T); } };
    st(40); q.x = me.x - 2.5; q.y = me.y + 1; q.rx = q.x; q.ry = q.y; me.mh = []; q.mh = []; st(2); fuseStart(me, q); const m = OBJ.pl[0], m2 = OBJ.pl[1];
    st(24); out.fly = [m2.g.visible, Math.round(m2.g.scale.x * 100) / 100, Math.round(d2(m2.g.position.x, m2.g.position.z, m.g.position.x, m.g.position.z) * 10) / 10].join(',');
    st(30); const md = m.mech.userData.fmods[W.fus.kp]; out.hit = [!m2.g.visible, !!document.querySelector('.fusban'), Math.round(md.scale.x * 100) / 100].join(',');
    st(60); out.done = [Math.round(m.mech.userData.fsc * 100) / 100, md.scale.x, RND.fusA === null].join(',');
    fuseSplit(W.fus, 'x'); st(14); out.split = [RND.fusU ? 1 : 0, md.visible, Math.round(md.scale.x * 100) / 100].join(','); st(40); out.after = [md.visible, RND.fusU === null, m2.g.scale.x].join(',');
    return out; });
  check('cut-in: the partner flies in and shrinks, then the impact shows the banner and bursts the module out, then it settles', /^true,0\.[0-9]+,/.test(s.fly) && +s.fly.split(',')[1] < 0.9 && s.hit.startsWith('true,true,') && +s.hit.split(',')[2] > 0.2 && s.done === '1.3,1,true', JSON.stringify(s));
  check('split: the module spins back into the chest, then hides and the partner is back to full size', s.split.startsWith('1,true,') && +s.split.split(',')[2] < 1 && s.after === 'false,true,1', JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})();
