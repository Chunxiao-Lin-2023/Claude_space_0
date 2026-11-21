// Round 27: detailed vehicles — wheels spin, feet on pedals / pegs (pedalling), hands on the bars when not shooting, a foot down when stopped, banking, lights at night
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  const spot = await p.evaluate(() => { window.__dbg.god = true; W.phase = 'day'; W.clock = 999; const me = W.p[0];
    const x = W.radio.x + 22, y = W.radio.y + 22, L = gAt(x, y); for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) for (let l = L; l < L + 3; l++) { W.blk[ci(x + dx, y + dy, l)] = 0; if (l > L) W.slab[ci(x + dx, y + dy, l)] = 0; } W.ver++; W.zs.length = 0; W.spawnQ = [];
    me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); me.vehs = 15; return { x, y, L }; });
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  const probe = () => p.evaluate(() => { const m = OBJ.pl[0], P = W.p[0], V = m.veh.userData.all[P.veh], S = V.userData.S, v3 = () => new THREE.Vector3();
    m.g.updateMatrixWorld(true);
    const hand = k => m.arms[k].el.localToWorld(v3().set(0, -0.18, 0)), foot = k => m.legs[k].ft.getWorldPosition(v3());
    const gd = S.grip.map((g, k) => +g.getWorldPosition(v3()).distanceTo(hand(k)).toFixed(3));
    const pd = S.pedals ? S.pedals.map((q, k) => +q.getWorldPosition(v3()).distanceTo(foot(1 - k)).toFixed(3)) : null;
    const ground = Math.min(foot(0).y, foot(1).y) - m.g.position.y;
    return { veh: P.veh, spin: +S.spin[0].g.rotation.z.toFixed(2), gd, pd, ground: +ground.toFixed(3), grip: +(P._grip || 0).toFixed(2), gun: m.guns.some(g => g.visible), roll: +(P._roll || 0).toFixed(3), stop: +(P._stopK || 0).toFixed(2), hips: +m.hips.position.y.toFixed(2) }; });
  const R = {};
  for (const v of [1, 2, 3, 4]) {
    await p.evaluate(([v, s]) => { const me = W.p[0]; me.x = s.x - 4.5; me.y = s.y + 0.5; me.aim = 0; me.veh = v; if (!me.ride) doAct(me, 'ride', v); else doAct(me, 'vdef', v); CAM.zoom = 2.4; }, [v, spot]);
    await simWait(0.3);
    await p.keyboard.down('d'); await simWait(0.5); await p.keyboard.down('w'); await simWait(0.35);
    const run = await probe(); await p.evaluate(() => CAM.zoom = 2.4); await p.screenshot({ path: `${OUT}/veh${v}_run.png` });
    await p.keyboard.up('w'); await p.keyboard.up('d'); await simWait(1.2);
    const stop = await probe(); await p.screenshot({ path: `${OUT}/veh${v}_stop.png` });
    R[v] = { run, stop };
  }
  console.log(JSON.stringify(R));
  check('wheels spin while driving', [1, 2, 3, 4].every(v => R[v].run.spin !== 0));
  check('pedal bikes: both feet stay on the pedals while pedalling (< 0.09)', [1, 3].every(v => R[v].run.pd.every(d => d < 0.09)), JSON.stringify([R[1].run.pd, R[3].run.pd]));
  check('hands on the grips / steering wheel when not shooting (< 0.07), gun slung', [1, 2, 3, 4].every(v => R[v].stop.gd.every(d => d < 0.07) && !R[v].stop.gun && R[v].stop.grip > 0.9), JSON.stringify([1, 2, 3, 4].map(v => R[v].stop.gd)));
  check('bike and motorbike: a foot on the ground when stopped, leaning a little onto it', [1, 2].every(v => R[v].stop.stop > 0.9 && R[v].stop.ground < 0.09 && R[v].stop.roll > 0.05), JSON.stringify([R[1].stop, R[2].stop]));
  check('bank into the turn while driving and turning (motorbike)', Math.abs(R[2].run.roll) > 0.03, R[2].run.roll);
  // shooting while riding: hands leave the bars, the gun comes out
  await p.evaluate(() => { W.p[0]._lastShot = W.t; }); await simWait(0.7);
  const sh = await p.evaluate(() => { const me = W.p[0], m = OBJ.pl[0]; return { grip: +(me._grip).toFixed(2), gun: m.guns.some(g => g.visible) }; });
  check('firing from the vehicle: hands come off the bars and the gun is out', sh.grip < 0.3 && sh.gun, JSON.stringify(sh));
  // night: headlight on with a beam
  await p.evaluate(() => { window.__dbg.dark = 1; W.p[0].veh = 2; CAM.zoom = 3.2; }); await simWait(0.6);
  const nt = await p.evaluate(() => { const S = OBJ.pl[0].veh.userData.all[2].userData.S; return { beam: S.beam.visible, head: +S.head[0].emissiveIntensity.toFixed(2) }; });
  await p.screenshot({ path: `${OUT}/veh_night.png` });
  check('at night the headlight glows and throws a beam', nt.beam && nt.head > 1, JSON.stringify(nt));
  await p.evaluate(() => { window.__dbg.dark = null; doAct(W.p[0], 'ride'); }); await simWait(0.6);
  const off = await p.evaluate(() => { const m = OBJ.pl[0]; return { veh: m.veh.visible, rx: +m.g.rotation.x.toFixed(2), rz: +m.g.rotation.z.toFixed(2), hips: +m.hips.position.y.toFixed(2), ab: +m.legs[0].th.rotation.x.toFixed(2) }; });
  check('off the vehicle: upright, normal hips, legs back under the body', !off.veh && off.rx === 0 && off.rz === 0 && off.hips < 0.55 && off.ab === 0, JSON.stringify(off));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
