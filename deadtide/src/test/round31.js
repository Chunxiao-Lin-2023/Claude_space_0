// Round 31: night levels every two nights; the tank (own cannon + shells, outdoors only, armour); clearer player markers on the maps
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  let s = await p.evaluate(() => ({ lv: [1, 2, 3, 4, 5, 6, 7].map(n => BAL.nightLv(n)), cnt: [1, 2, 3, 4, 5].map(n => BAL.nightSpawn(BAL.lvN(n))), hp: [1, 2, 3, 4].map(n => +BAL.hpMul(BAL.lvN(n)).toFixed(3)) }));
  check('night level goes up every night (round 34b); count / health climb with it', s.lv.join() === '1,2,3,4,5,6,7' && s.cnt.every((c, i) => !i || c > s.cnt[i - 1]) && s.hp.every((h, i) => !i || h > s.hp[i - 1]), JSON.stringify(s));
  // tank
  const spots = await p.evaluate(() => { window.__dbg.god = true; W.phase = 'day'; W.clock = 999; W.zs.length = 0; W.spawnQ = []; const me = W.p[0]; for (const k in W.res) W.res[k] = 999;
    let room = null; for (let r = 2; r < 60 && !room; r++) for (let dy = -r; dy <= r && !room; dy++) for (let dx = -r; dx <= r; dx++) { const x = W.radio.x + dx, y = W.radio.y + dy; if (!inMap(x, y)) continue; if (skyTop(x, y) >= 1 && !W.blk[ci(x, y, 0)] && support(x, y, 0) && !W.blk[ci(x, y, 1)]) { room = { x, y, L: 0 }; break; } }
    const x = W.radio.x + 20, y = W.radio.y + 20, L = gAt(x, y); for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) for (let l = L; l < L + 4; l++) { W.blk[ci(x + dx, y + dy, l)] = 0; if (l > L) W.slab[ci(x + dx, y + dy, l)] = 0; } W.ver++;
    return { room, open: { x, y, L } }; });
  const tp = s => p.evaluate(s => { const me = W.p[0]; me.x = s.x + 0.5; me.y = s.y + 0.5; me.L = s.L; me.z = surfZ(me.x, me.y, s.L); me.zv = me.z; }, s);
  await tp(spots.room);
  s = await p.evaluate(() => { const me = W.p[0]; const can = canCraft(me); doCraft(me, 'tank'); const own = ownsVeh(me, 6), shl = me.shl; me.shl = 50; doCraft(me, 'tshell'); const shl2 = me.shl; doAct(me, 'ride', 6); return { can, own, shl, shl2, ride: me.ride }; });
  check('the tank is built in the shop with 100 shells, shells are bought ×25, and it will not start indoors', s.can && s.own && s.shl === 100 && s.shl2 === 75 && !s.ride, JSON.stringify(s));
  await tp(spots.open);
  s = await p.evaluate(() => { const me = W.p[0]; doAct(me, 'ride', 6); const hp = me.hp; window.__dbg.god = false; hurtPlayer(me, 50); const lost = hp - me.hp; window.__dbg.god = true; me.hp = hp; return { ride: me.ride, veh: me.veh, lost }; });
  check('outdoors it starts; inside it a 50 hit does only 10 (×0.2)', s.ride && s.veh === 6 && Math.abs(s.lost - 10) < 0.6, JSON.stringify(s));
  // the cannon: aim at a knot of zombies 7 tiles away
  await p.evaluate(({ x, y, L }) => { W.zs.length = 0; for (const [dx, dy] of [[7, 0], [7.6, 0.8], [6.6, -0.9]]) { const z = putZombie('walker', x + dx, y + dy, L); z.sleep = 0; z.hp = z.max = 400; z.stun = 99; z.mz = 1; } const z0 = W.zs[0]; window.__s0 = { shl: W.p[0].shl, mag: W.p[0].mag[W.p[0].wpn] }; window.__dbg.aimAt = () => ({ x: z0.x, y: z0.y, z: z0.z + 0.8, zb: z0 }); }, spots.open);
  await p.mouse.move(500, 320); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); await simWait(0.5);
  s = await p.evaluate(() => { window.__dbg.aimAt = null; const me = W.p[0]; return { lost: W.zs.map(z => Math.round(400 - z.hp)), shl: window.__s0.shl - me.shl, mag: window.__s0.mag - me.mag[me.wpn] }; });
  check('the cannon shell bursts on the knot: the one aimed at takes about 120 (150 before round 34), the others splash damage; one shell used, your own gun untouched', s.shl === 1 && s.mag === 0 && s.lost[0] >= 100 && s.lost.filter(v => v > 0).length >= 2, JSON.stringify(s));
  // can't drive into a building
  s = await p.evaluate(() => { const me = W.p[0]; let ox = null;
    for (let r = 2; r < 70 && !ox; r++) for (let dy = -r; dy <= r && !ox; dy++) for (let dx = -r; dx <= r && !ox; dx++) { const x = W.radio.x + dx, y = W.radio.y + dy; if (!inMap(x, y) || skyTop(x, y) < 1 || W.blk[ci(x, y, 0)] || !support(x, y, 0)) continue;
      for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ux, ny = y + uy; if (inMap(nx, ny) && skyTop(nx, ny) === 0 && !W.blk[ci(nx, ny, 0)] && support(nx, ny, 0)) { ox = [nx, ny, -ux, -uy]; break; } } }
    if (!ox) return { skip: 1 }; me.x = ox[0] + 0.5; me.y = ox[1] + 0.5; me.L = 0; me.z = surfZ(me.x, me.y, 0); me.vx = me.vy = 0;
    for (let k = 0; k < 120; k++) { me.inp.mx = ox[2]; me.inp.my = ox[3]; stepMove(me, 1 / 60); } me.inp.mx = me.inp.my = 0; return { top: skyTop(me.x, me.y), L: me.L, at: ox }; });
  check('the tank stops at a building: it never ends up under a roof', !s.skip && s.top <= s.L, JSON.stringify(s));
  // pictures: tank close up, minimap, big map
  await tp(spots.open); await p.evaluate(() => { const me = W.p[0]; me.aim = 0.8; CAM.zoom = 3.4; document.querySelectorAll('#banner,.banner,#hud,.hud,#wbar,#tasks').forEach(e => e.style.display = 'none'); }); await simWait(3);
  const r = await p.evaluate(() => { const me = W.p[0]; CAM.tx = me.x; CAM.ty = me.y; return w2s(me.x, me.y, me.z + 0.5); });
  await p.screenshot({ path: `${OUT}/tank.png`, clip: { x: Math.max(0, r[0] - 230), y: Math.max(0, r[1] - 170), width: 460, height: 340 } });
  await p.evaluate(() => { const q = mkPlayer(1, '小青'); const me = W.p[0]; q.x = me.x + 14; q.y = me.y - 9; q.L = me.L; q.z = me.z; W.p.push(q); for (let k = 0; k < 40; k++) { const z = putZombie('walker', Math.floor(me.x) + ((k * 7) % 20) - 10, Math.floor(me.y) + ((k * 3) % 16) - 8, me.L); z.stun = 99; } MM.t = 0; });
  await simWait(0.5);
  const mb = await p.evaluate(() => { const r = document.getElementById('mini').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.screenshot({ path: `${OUT}/minimap.png`, clip: { x: Math.max(0, mb.x - 4), y: Math.max(0, mb.y - 4), width: mb.w + 8, height: mb.h + 8 } });
  await p.evaluate(() => toggleBigMap(true)); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/bigmap.png` }); await p.evaluate(() => toggleBigMap(false));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
