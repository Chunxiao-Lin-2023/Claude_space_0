// A teammate who bleeds out: lies where they fell, comes back beside a living teammate after the respawn clock
// (20 s by day / 60 s at night, or at dawn), or at once with a medkit used at the body. The game only ends when nobody is standing.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
  await p.evaluate(() => { NETROLE = 'solo'; startGame(4242, ['甲', '乙'], 'normal', 0, 'siege', 'town'); W.clock = 9999; W.zs = W.zs.filter(z => z.sleep); window.__dbg.speed = 4; });
  await p.waitForFunction(() => W && W.t > 0.3);
  // put both in the open, then let 乙 bleed out
  let r = await p.evaluate(() => { const [a, q] = W.p, R = W.radio; a.x = R.x + 12.5; a.y = R.y + 0.5; a.L = gAt(R.x + 12, R.y); a.z = surfZ(a.x, a.y, a.L); q.x = a.x + 6; q.y = a.y + 3; q.L = a.L; q.z = a.z; q.meds = 0;
    hurtPlayer(q, 999); q.downT = 0.01; return { down: q.down }; });
  await simWait(0.3);
  let s = await p.evaluate(() => { const q = W.p[1]; return { dead: q.dead, t: +q.downT.toFixed(1), over: W.over, visible: OBJ.pl[1].g.visible, lying: OBJ.pl[1].g.rotation.x < -1, tag: document.getElementById('ov').innerHTML.includes('✝') }; });
  check('a teammate who bleeds out dies, lies where they fell, and shows a ✝ tag', s.dead && s.visible && s.lying && s.tag && !s.over, JSON.stringify(s));
  check('by day the respawn clock is 20 s, and the game goes on while someone stands', s.t > 18 && s.t <= 20 && !s.over, JSON.stringify(s));
  await simWait(20.5);
  s = await p.evaluate(() => { const [a, q] = W.p; return { dead: q.dead, hp: q.hp, d: +Math.hypot(q.x - a.x, q.y - a.y).toFixed(1) }; });
  check('after the clock they come back beside the living teammate (half health)', !s.dead && s.hp === 50 && s.d <= 3.5, JSON.stringify(s));
  // at night: 60 s; a medkit at the body brings them back at once
  r = await p.evaluate(() => { W.phase = 'night'; W.nightT = 0; W.spawnQ = []; const [a, q] = W.p; q.x = a.x + 0.8; q.y = a.y; hurtPlayer(q, 999); q.downT = 0.01; return 1; });
  await simWait(0.3);
  s = await p.evaluate(() => { const [a, q] = W.p; const t = +q.downT.toFixed(0); a.meds = 0; const none = useTarget(a); a.meds = 2; const tg = useTarget(a); if (tg) completeUse(a, tg); return { t, none: none && none.k, k: tg && tg.k, dead: q.dead, hp: q.hp, meds: a.meds }; });
  check('at night the clock is 60 s', s.t >= 58 && s.t <= 60, JSON.stringify(s));
  check('no medkit: nothing to do at the body; with one: hold F 6 s and they are back (40% health, 1 medkit used)', s.none !== 'rez' && s.k === 'rez' && !s.dead && s.hp === 40 && s.meds === 1, JSON.stringify(s));
  // dawn brings the dead back too
  r = await p.evaluate(() => { const [a, q] = W.p; hurtPlayer(q, 999); q.downT = 0.01; return 1; });
  await simWait(0.3);
  s = await p.evaluate(() => { W.nightT = BAL.nightMin(W.night) + 1; return W.p[1].dead; });
  await simWait(0.4);
  s = await p.evaluate(() => ({ was: true, dead: W.p[1].dead, ph: W.phase }));
  check('dawn brings a dead teammate back', !s.dead && s.ph === 'day', JSON.stringify(s));
  // two on a motorbike: the teammate climbs on the back, rides along, can shoot (70% rate); off when the driver gets off
  s = await p.evaluate(() => { const [a, q] = W.p; for (const x of W.p) { x.dead = false; x.down = false; x.hp = 100; } a.veh = 2; a.ride = true; q.x = a.x + 1; q.y = a.y; q.L = a.L; q.z = a.z; doAct(q, 'ride');
    const on = q.pass; const x0 = q.x; for (let k = 0; k < 30; k++) { a.inp.mx = 1; a.inp.my = 0; stepMove(a, 0.03); stepMove(q, 0.03); } a.inp.mx = 0;
    const follow = +(q.x - x0).toFixed(1), gap = +Math.hypot(q.x - a.x, q.y - a.y).toFixed(2);
    q.aimPt = { x: q.x + 4, y: q.y + 1, z: 0.7 }; q.wpn = 0; q.cdW = WPN.map(() => 0); q.fireCD = 0; q.mag[0] = 12; q.inp.fire = 1; stepActions(q, 0.016); q.inp.fire = 0; const cd = +q.cdW[0].toFixed(2);
    doAct(a, 'ride'); return { on, follow, gap, cd, base: WPN[0].rate, offAfter: q.pass }; });
  check('a teammate can ride on the back of the motorbike and is carried along', s.on === 0 && s.follow > 1.5 && s.gap < 0.6, JSON.stringify(s));
  check('the pillion rider shoots at 70% rate; when the driver gets off so do they', Math.abs(s.cd - s.base * 1.43) < 0.06 && s.offAfter === -1, JSON.stringify(s));
  // both down -> game over
  r = await p.evaluate(() => { for (const q of W.p) { q.meds = 0; q.selfRev = false; hurtPlayer(q, 999); } return W.over; });
  check('when nobody is left standing it is game over', r === 'lose' || (await p.evaluate(() => W.over)) === 'lose', String(r));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
