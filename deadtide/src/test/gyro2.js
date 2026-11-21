// Round 30: two in the gyrocopter — a teammate hops in the back during the spin-up, rides along at the right height, shoots their own gun from the air, can't jump out mid-air, and gets out on landing
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  let s = await p.evaluate(() => { window.__dbg.god = true; W.phase = 'day'; W.clock = 999; W.zs.length = 0; W.spawnQ = []; const me = W.p[0]; me.vehs |= 1 << 5; me.fuel = 60;
    const x = W.radio.x + 20, y = W.radio.y + 20, L = gAt(x, y); for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) for (let l = L; l < L + 4; l++) { W.blk[ci(x + dx, y + dy, l)] = 0; if (l > L) W.slab[ci(x + dx, y + dy, l)] = 0; } W.ver++;
    me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); me.aim = 0;
    const q = mkPlayer(1, '小青'); q.x = me.x - 1.5; q.y = me.y + 0.5; q.L = L; q.z = me.z; q.owned[1] = 1; q.mag[1] = 6; q.wpn = 1; W.p.push(q);
    window.__qi = setInterval(() => { if (W && W.p[1]) stepMove(W.p[1], 1 / 60); }, 16); // the teammate's own client would do this
    doAct(me, 'ride', 5); doAct(q, 'ride'); return { pilot: me.ride, pass: q.pass }; });
  check('during the spin-up a teammate next to it gets in the back (T)', s.pilot && s.pass === 0, JSON.stringify(s));
  await simWait(3);
  s = await p.evaluate(() => { const me = W.p[0], q = W.p[1]; return { air: +(me.z - surfZ(me.x, me.y, skyTop(me.x, me.y))).toFixed(2), dz: +(q.z - me.z).toFixed(2), gap: +Math.hypot(q.x - me.x, q.y - me.y).toFixed(2), sh: +(shoulder(q)[2] - me.z).toFixed(2) }; });
  check('the passenger flies along: same height, right behind the pilot, shoulders up in the air too', s.air > 2 && Math.abs(s.dz) < 0.05 && Math.abs(s.gap - 0.38) < 0.1 && s.sh > 0.6 && s.sh < 0.8, JSON.stringify(s));
  s = await p.evaluate(() => { const q = W.p[1]; doAct(q, 'ride'); return q.pass; });
  check('the passenger cannot jump out in mid-air', s === 0, s);
  // the passenger shoots their own gun at a zombie below
  s = await p.evaluate(async () => { const me = W.p[0], q = W.p[1]; const z = putZombie('walker', Math.floor(me.x) + 2, Math.floor(me.y), skyTop(me.x + 2, me.y)); z.sleep = 0; z.hp = z.max = 900; z.stun = 99; z.mz = 1;
    const mag = q.mag[1]; q.aimPt = { x: z.x, y: z.y, z: z.z + 0.8, zb: z }; q.aim = Math.atan2(z.y - q.y, z.x - q.x); q.cdW = q.cdW.map(() => 0); q.inp.fire = 1;
    await new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= 1.4 ? r() : setTimeout(f, 30); f(); }); q.inp.fire = 0;
    return { lost: Math.round(900 - z.hp), shots: mag - q.mag[1] }; });
  check('the passenger shoots their own gun from the air and hits the zombie below', s.shots >= 1 && s.lost > 0, JSON.stringify(s));
  await p.evaluate(() => { W.p[1]._lastShot = W.t; CAM.zoom = 3.4; document.querySelectorAll('#hud,.hud,#wbar').forEach(e => e.style.display = 'none'); }); await simWait(0.3);
  const r = await p.evaluate(() => { const me = W.p[0]; CAM.tx = me.x; CAM.ty = me.y; return w2s(me.x, me.y, me.z + 0.5); });
  await p.screenshot({ path: `${OUT}/gyro_two.png`, clip: { x: Math.max(0, r[0] - 220), y: Math.max(0, r[1] - 170), width: 440, height: 340 } });
  s = await p.evaluate(() => { const m = OBJ.pl[1], d = OBJ.pl[0]; m.g.updateMatrixWorld(true); d.g.updateMatrixWorld(true); const v3 = () => new THREE.Vector3(); const seat = d.veh.userData.all[5].userData.S; return { hipsP: +(m.hips.getWorldPosition(v3()).y - d.g.position.y).toFixed(2), gun: m.guns.some(g => g.visible), visP: m.g.visible, vehP: m.veh.visible }; });
  check('on screen the passenger sits on the back seat (hips about 0.67 up), gun out while shooting, no second aircraft drawn', s.hipsP > 0.6 && s.hipsP < 0.76 && s.gun && s.visP && !s.vehP, JSON.stringify(s));
  // land: both get out
  await p.evaluate(() => doAct(W.p[0], 'ride')); await simWait(4);
  s = await p.evaluate(() => { const me = W.p[0], q = W.p[1]; clearInterval(window.__qi); return { ride: me.ride, pass: q.pass, qair: +(q.z - surfZ(q.x, q.y, q.L)).toFixed(2), qL: q.L, top: skyTop(q.x, q.y) }; });
  check('on landing both are out, the passenger standing on the ground', !s.ride && s.pass === -1 && Math.abs(s.qair) < 0.15 && s.qL === s.top, JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
