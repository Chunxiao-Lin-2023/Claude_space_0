// Gyrocopter + tank bug hunt: random driving / flying / landing / shooting / switching / getting knocked down / saving mid-flight around town;
// after every step: no NaN, nobody inside a wall, nobody left hanging in the air, no page errors
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'siege', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  await p.evaluate(() => { window.__dbg.god = true; window.__dbg.skipDraw = true; const me = W.p[0]; me.vehs = 0b1111110; me.fuel = 60; me.gam = 200; me.shl = 30; W.obj.bp = BP_LIST.slice(); W.phase = 'day'; W.clock = 9999;
    const q = mkPlayer(1, '小青'); q.x = me.x + 1; q.y = me.y; q.L = me.L; q.z = me.z; q.owned[1] = 1; W.p.push(q); window.__qi = setInterval(() => { if (W && W.p[1]) stepMove(W.p[1], 1 / 60); }, 16);
    window.__bad = []; window.__chk = tag => { for (const P of W.p) { if (P.gone) continue; const flying = airborne(P) || inAirZ(P) != null;
      const bad = !isFinite(P.x) || !isFinite(P.y) || !isFinite(P.z) || P.L < 0 || P.L >= ML || P.x < 0 || P.y < 0 || P.x >= MW || P.y >= MH
        || (!flying && !P.jmp && P.L > skyTop(P.x, P.y)) || (!flying && !P.jmp && solidFor(W.blk[ci(Math.floor(P.x), Math.floor(P.y), P.L)], 'p') && !(B[W.blk[ci(Math.floor(P.x), Math.floor(P.y), P.L)]] || {}).stairs);
      if (bad) window.__bad.push(tag + ' p' + P.i + ' ' + JSON.stringify({ x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +(P.z || 0).toFixed(2), L: P.L, top: skyTop(P.x, P.y), ride: P.ride, veh: P.veh, pass: P.pass, b: W.blk[ci(Math.floor(P.x), Math.floor(P.y), P.L)] })); } }; });
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => { window.__chk('w'); W.t - t0 >= s ? r() : setTimeout(f, 50); }; f(); }), s);
  const keys = ['w', 'a', 's', 'd']; let R = 12345; const rnd = () => (R = (R * 16807) % 2147483647) / 2147483647;
  const acts = { mountGyro: () => p.evaluate(() => doAct(W.p[0], 'ride', 5)), mountTank: () => p.evaluate(() => doAct(W.p[0], 'ride', 6)), mountMoto: () => p.evaluate(() => doAct(W.p[0], 'ride', 2)),
    toggle: () => p.evaluate(() => doAct(W.p[0], 'ride')), passenger: () => p.evaluate(() => { const q = W.p[1], me = W.p[0]; if (q.pass < 0) { const nx = me.x - 1; if (!airborne(me) && standable(Math.floor(nx), Math.floor(me.y), me.L, 'p')) { q.x = nx; q.y = me.y; q.L = me.L; q.z = surfZ(q.x, q.y, q.L); } } doAct(q, 'ride'); }),
    fire: async () => { await p.mouse.move(300 + rnd() * 400, 200 + rnd() * 250); await p.mouse.down(); await simWait(0.4); await p.mouse.up(); },
    knock: () => p.evaluate(() => { window.__dbg.god = false; const me = W.p[0]; hurtPlayer(me, 400); window.__dbg.god = true; }),
    revive: () => p.evaluate(() => { const me = W.p[0]; if (me.down || me.dead) { me.down = false; me.dead = false; me.hp = 100; } }),
    save: () => p.evaluate(() => { saveGame(true); const n = SLOT; continueGame(n); window.__dbg.god = true; const me = W.p[0]; me.vehs = 0b1111110; me.fuel = 60; me.gam = 200; me.shl = 30; const q = mkPlayer(1, '小青'); q.x = me.x; q.y = me.y; q.L = me.L; q.z = me.z; W.p.push(q); }),
    switchV: () => p.evaluate(() => doAct(W.p[0], 'vdef', [2, 4, 5, 6][Math.floor(Math.random() * 4)])),
    hop: () => p.evaluate(() => { const me = W.p[0]; for (let k = 0; k < 200; k++) { const x = Math.floor(Math.random() * MW), y = Math.floor(Math.random() * MH), t = skyTop(x, y); if (standable(x, y, t, 'p')) { if (!airborne(me)) { me.x = x + 0.5; me.y = y + 0.5; me.L = t; me.z = surfZ(me.x, me.y, t); } break; } } }),
    edge: () => p.evaluate(() => { const me = W.p[0]; if (airborne(me)) { me.x = 2.5; me.y = 2.5; } }),
    fuelOut: () => p.evaluate(() => { W.p[0].fuel = 0.5; }) };
  const names = Object.keys(acts), log = [];
  for (let step = 0; step < 45; step++) {
    const a = names[Math.floor(rnd() * names.length)]; log.push(a);
    await acts[a](); const k = keys[Math.floor(rnd() * 4)]; await p.keyboard.down(k); await simWait(0.3 + rnd() * 1.2); await p.keyboard.up(k);
    await p.evaluate(t => window.__chk(t), a);
  }
  await p.evaluate(() => { doAct(W.p[0], 'ride'); }); await simWait(4);
  const s = await p.evaluate(() => ({ bad: window.__bad.slice(0, 6), nbad: window.__bad.length, me: (() => { const me = W.p[0]; return { ride: me.ride, veh: me.veh, L: me.L, top: skyTop(me.x, me.y) }; })() }));
  console.log('actions:', log.join(' '));
  check('45 random vehicle actions: never NaN, never inside a wall, never left hanging in the air', s.nbad === 0, JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
