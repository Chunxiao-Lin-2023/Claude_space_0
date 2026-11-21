// 尸城求生 (round 19): default mode, sleepers in buildings (wake on sight / noise / damage), clearing a building,
// blueprints (locked builds, a case always gives one), build anywhere, mines, turrets (+refill), barricades,
// vehicles (speed, no shooting), ammo boxes for every gun, double loot, the night ends on time, save / load.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
  check('the new mode is the default', await p.evaluate(() => curMode() === 'siege' && MODE_IDS[0] === 'siege'));
  let r = await p.evaluate(() => { $('soloBtn').click(); window.__dbg.god = true; const O = W.obj; return { mode: W.mode, occ: O.occ.length, sleepers: W.zs.filter(z => z.sleep).length, cases: (() => { let n = 0; for (let i = 0; i < NC; i++) if (W.blk[i] === 55) n++; return n; })(), hud: modeHud().t, marks: modeMarks().length }; });
  await p.waitForFunction(() => W && W.t > 0.5);
  check('a game starts in 尸城求生 with sleeping crowds in buildings and blueprint cases', r.mode === 'siege' && r.occ >= 8 && r.sleepers >= 80 && r.cases >= 6, JSON.stringify(r));
  // sleepers stay put during the day; a gunshot nearby wakes them (and their neighbours)
  r = await p.evaluate(() => { const O = W.obj, q = O.occ.find(q => !q.out), zs = W.zs.filter(z => z.occ === O.occ.indexOf(q)); const me = W.p[0]; me.x = q.x + 40; me.y = q.y; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); me.z = surfZ(me.x, me.y, me.L); return { k: O.occ.indexOf(q), pos: zs.map(z => [z.x, z.y]) }; }); const K = r.k;
  await simWait(3);
  let s = await p.evaluate(k => { const zs = W.zs.filter(z => z.occ === k); return { still: zs.every(z => z.sleep), n: zs.length }; }, r.k);
  check('sleepers stay asleep and still with nobody around', s.still, JSON.stringify(s));
  s = await p.evaluate(k => { const zs = W.zs.filter(z => z.occ === k), cx = zs.reduce((a, z) => a + z.x, 0) / zs.length, cy = zs.reduce((a, z) => a + z.y, 0) / zs.length; const L = zs[0].L, fl = zs.filter(z => z.L === L), fx = fl.reduce((a, z) => a + z.x, 0) / fl.length, fy = fl.reduce((a, z) => a + z.y, 0) / fl.length; noiseAt(fx, fy, 12, zs[0].z); window.__L = L; return 1; }, r.k);
  await simWait(2);
  s = await p.evaluate(k => { const zs = W.zs.filter(z => z.occ === k), fl = zs.filter(z => z.L === __L); return { awake: fl.filter(z => !z.sleep).length, n: fl.length, otherFloors: zs.filter(z => z.L !== __L && !z.sleep).length + '/' + zs.filter(z => z.L !== __L).length }; }, r.k);
  check('a gunshot in the middle of them wakes most of that floor (floors and walls muffle it)', s.awake >= s.n * 0.5, JSON.stringify(s));
  // standing at a building's door doesn't wake the whole building (round 19b)
  s = await p.evaluate(() => { const O = W.obj, k = O.occ.findIndex((q, k) => !q.out && W.zs.some(z => z.occ === k) && W.zs.filter(z => z.occ === k).every(z => z.sleep)), H = TOWN_HOUSES[O.occ[k].h], me = W.p[0];
    let door = null; for (let x = H[0]; x <= H[2] && !door; x++) for (const y of [H[1], H[3]]) { const b = W.blk[ci(x, y, 0)]; if ((b === 7 || !b) && standable(x, y + (y === H[1] ? -1 : 1), 0, 'p')) { door = [x, y + (y === H[1] ? -1 : 1)]; break; } }
    me.x = door[0] + 0.5; me.y = door[1] + 0.5; me.L = 0; me.z = 0; window.__k = k; return { k, n: W.zs.filter(z => z.occ === k && z.sleep).length, door }; });
  await simWait(3);
  const sd = await p.evaluate(k => W.zs.filter(z => z.occ === k && !z.sleep).length, s.k);
  check('standing at a building\'s door for 3 s wakes at most a couple', sd <= 2, JSON.stringify([s, sd]));
  // one quiet stab kills a sleeper and nobody else hears it; the notice meter: in front 3 cells -> wakes in ~1-2 s, behind -> slower
  s = await p.evaluate(() => { const me = W.p[0]; const x0 = Math.floor(me.x), x = x0 + 30 < MW - 10 ? x0 + 30 : x0 - 30, y = Math.min(MH - 8, Math.max(8, Math.floor(me.y))); W.zs = W.zs.filter(z => Math.hypot(z.x - x, z.y - y) > 12);
    for (let dy = -4; dy <= 4; dy++) for (let dx = -6; dx <= 6; dx++) { const i = ci(x + dx, y + dy, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++;
    const a = putZombie('walker', x, y, 0), b2 = putZombie('walker', x + 2, y, 0); for (const z of [a, b2]) { z.sleep = 1; z.mz = 1; z.occ = null; z.face = 0; }
    me.x = x - 0.6; me.y = y + 0.5; me.L = 0; me.z = gAt(x, y) * FH; me.aim = 0; knife(me, a.id); return { aDead: a.hp <= 0, bSleep: !!b2.sleep }; });
  check('one quiet knife stab kills a sleeper, the one next to it sleeps on', s.aDead && s.bSleep, JSON.stringify(s));
  r = await p.evaluate(() => { const me = W.p[0]; const x0 = Math.floor(me.x), x = x0 + 20 < MW - 10 ? x0 + 20 : x0 - 20, y = Math.min(MH - 8, Math.max(8, Math.floor(me.y)));
    for (let dy = -4; dy <= 4; dy++) for (let dx = -6; dx <= 6; dx++) { const i = ci(x + dx, y + dy, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++;
    W.zs = W.zs.filter(z => Math.hypot(z.x - x, z.y - y) > 12);
    const f = putZombie('walker', x, y, 0), bk = putZombie('walker', x + 3, y + 1, 0); for (const z of [f, bk]) { z.sleep = 1; z.mz = 1; z.occ = null; z.aw = 0; } f.x = x + 0.5; f.y = y + 0.5; bk.x = x + 3.5; bk.y = y + 0.5; f.face = Math.PI; bk.face = 0;
    me.x = x - 1.5; me.y = y + 0.5; me.L = 0; me.z = gAt(x, y) * FH; window.__fz = [f, bk]; return 1; });
  await simWait(3);
  s = await p.evaluate(() => __fz.map(z => ({ sleep: !!z.sleep, aw: +(z.aw || 0).toFixed(2), me: [W.p[0].dead, W.p[0].hp | 0, W.p[0].x.toFixed(1), W.p[0].L, z.L, z.x.toFixed(1), los(z.x, z.y, z.z + 1, W.p[0].x, W.p[0].y, W.p[0].z + 0.8)] })));
  check('a sleeper facing you 2 cells away notices you within 3 s; one 5 cells away with its back to you sleeps on', !s[0].sleep && s[1].sleep, JSON.stringify(s));
  // clearing it: kill them all -> cleared, reward
  r = await p.evaluate(k => { const parts = W.res.parts; for (const z of W.zs) if (z.occ === k) hurtZombie(z, 1e5, W.p[0]); return { parts }; }, K);
  await simWait(0.6);
  s = await p.evaluate(k => ({ c: W.obj.occ[k].c, parts: W.res.parts, mark: modeMarks()[k].c }), K);
  check('killing a building\'s crowd clears it (+parts, green on the map)', s.c === 1 && s.parts >= r.parts + 6 && s.mark === '#8fe39a', JSON.stringify([r, s]));
  // blueprints: a locked build is refused; a blueprint case always gives one; then it builds — anywhere, far from camp
  r = await p.evaluate(() => {
    const me = W.p[0]; W.zs = W.zs.filter(z => z.sleep && Math.hypot(z.x - (W.radio.x + 60), z.y - W.radio.y) > 20); W.res = { wood: 500, stone: 500, steel: 500, parts: 500 };
    const x0 = W.radio.x + 45, y0 = W.radio.y + 2; let spot = null; for (let y = Math.max(5, y0 - 40); y < Math.min(MH - 5, y0 + 40) && !spot; y++) for (let x = Math.max(5, x0 - 20); x < Math.min(MW - 5, x0 + 45) && !spot; x++) { let free = true; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!standable(x + dx, y + dy, 0, 'p') || W.blk[ci(x + dx, y + dy, 0)] || gAt(x + dx, y + dy) || houseInterior(x + dx, y + dy) || ttAt(x + dx, y + dy) === TT.water) free = false; if (free && radioDist(x, y) > 30) spot = [x, y]; }
    me.x = spot[0] + 0.5; me.y = spot[1] + 0.5; me.L = 0; me.z = 0; W.obj.bp = [];
    const locked = canPlace(spot[0] + 2, spot[1], 0, 51), wall = canPlace(spot[0] + 2, spot[1], 0, 1);
    const ci0 = ci(spot[0] + 1, spot[1] + 1, 0); W.blk[ci0] = 55; W.bhp[ci0] = 1;
    completeUse(me, { k: 'spot', i: ci0 }); const got = W.obj.bp.slice();
    W.obj.bp = BP_LIST.slice(); const now = canPlace(spot[0] + 2, spot[1], 0, 51);
    return { spot, locked, wall, got, now, far: radioDist(spot[0], spot[1]) };
  });
  check('locked builds say so, base builds work anywhere (far from camp)', /蓝图/.test(r.locked) && r.wall === '' && r.far > 30, JSON.stringify(r));
  check('a blueprint case always gives a blueprint', r.got.length === 1, JSON.stringify(r.got));
  check('with the blueprint the mine can go down', r.now === '', r.now);
  // mine: a zombie walking over it sets it off
  s = await p.evaluate(({ spot }) => { const [x, y] = spot; doBuild(W.p[0], x + 3, y, 0, 51); const z = putZombie('walker', x + 3, y, 0); z.hp = z.max = 150; z.sleep = 0; z.mz = 1; return { placed: W.blk[ci(x + 3, y, 0)] }; }, r);
  await simWait(0.4);
  let s2 = await p.evaluate(({ spot }) => ({ mine: W.blk[ci(spot[0] + 3, spot[1], 0)], zDead: !W.zs.some(z => Math.abs(z.x - spot[0] - 3.5) < 1 && Math.abs(z.y - spot[1] - 0.5) < 1 && z.hp > 0) }), r);
  check('a zombie on a mine sets it off', s.placed === 51 && s2.mine === 0 && s2.zDead, JSON.stringify([s, s2]));
  // turret: shoots a zombie in range, refills for 3 parts when low
  s = await p.evaluate(({ spot }) => { const [x, y] = spot, me = W.p[0]; doBuild(me, x - 2, y, 0, 52); const z = putZombie('walker', x - 2, y + 6, 0); z.hp = z.max = 400; z.sleep = 0; z.mz = 1; z.stun = 99; window.__tz = z; return W.blk[ci(x - 2, y, 0)]; }, r);
  await simWait(2);
  s2 = await p.evaluate(({ spot }) => { const i = ci(spot[0] - 2, spot[1], 0); return { hp: Math.round(__tz.hp), ammo: W.obj.tam[i] }; }, r);
  check('the turret shoots a zombie 6 cells away', s === 52 && s2.hp < 400 && s2.ammo < 240, JSON.stringify(s2));
  s = await p.evaluate(({ spot }) => { const i = ci(spot[0] - 2, spot[1], 0), me = W.p[0]; W.obj.tam[i] = 10; me.x = spot[0] - 1 + 0.5; me.y = spot[1] + 0.5; const t = useTarget(me), parts = W.res.parts; if (t) completeUse(me, t); return { t: t && t.name, ammo: W.obj.tam[i], paid: parts - W.res.parts }; }, r);
  check('an empty turret is refilled with F for 3 parts', s.t && s.ammo === 240 && s.paid === 3, JSON.stringify(s));
  // barricade: bullets over, zombies stopped
  s = await p.evaluate(() => ({ low: B[53].low, Z: B[53].Z, vault: B[53].vault, base: BP_BASE.includes(53) }));
  check('the barricade is a starter build: zombies must smash it, you shoot over and vault it', s.low && s.Z && s.vault && s.base, JSON.stringify(s));
  // vehicles
  s = await p.evaluate(() => { const me = W.p[0]; W.obj.bp = BP_LIST.slice(); const H = TOWN_HOUSES.find(h => h[5] === 'ware'); me.x = H[0] + 3.5; me.y = H[3] - 1.5; me.L = 0; me.z = 0; const can = canCraft(me); doCraft(me, 'moto'); me.x = W.radio.x + 0.5; me.y = W.radio.y + 9.5; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); doAct(me, 'ride'); /* round 22: buying sets the default vehicle, T gets on */ return { can, veh: me.veh, ride: me.ride, blocked: craftBlocked(me, CRAFT.find(c => c.id === 'bike')) }; });
  const sp = async () => p.evaluate(() => { const me = W.p[0], x0 = me.x; for (let k = 0; k < 40; k++) { me.inp.mx = 1; me.inp.my = 0; stepMove(me, 0.025); } me.inp.mx = 0; const v = (me.x - x0) / 1; me.x = x0; return v; });
  const vRide = await sp(); await p.evaluate(() => doAct(W.p[0], 'ride')); await simWait(0.3); const vWalk = await sp();
  check('crafting the motorbike makes it your vehicle and T gets on it; riding is much faster than walking', s.veh === 2 && s.ride && vRide > vWalk * 1.7, JSON.stringify({ s, vRide: vRide.toFixed(2), vWalk: vWalk.toFixed(2) }));
  s = await p.evaluate(() => { const me = W.p[0]; doAct(me, 'ride'); me.aimPt = { x: me.x + 4, y: me.y, z: 0.7 }; me.wpn = 0; me.cdW = WPN.map(() => 0); me.fireCD = 0; const m0 = me.mag[0]; for (let k = 0; k < 4; k++) { me.inp.fire = 1; stepActions(me, 0.016); } me.inp.fire = 0; const fired = m0 - me.mag[0], cd = +me.cdW[0].toFixed(2); doAct(me, 'ride'); return { ride: me.ride, fired, cd, base: WPN[0].rate }; });
  check('you can shoot while riding, but much slower (driver: 2.5x the cooldown)', s.fired === 1 && Math.abs(s.cd - s.base * 2.5) < 0.08, JSON.stringify(s));
  // ammo box: bullets for every gun, owned or not; double loot in this mode
  s = await p.evaluate(() => { const me = W.p[0]; me.owned = WPN.map((w, k) => k < 2 ? 1 : 0); me.ammo = WPN.map(() => 0); const i = ci(Math.floor(me.x) + 1, Math.floor(me.y), 0); W.blk[i] = 54; completeUse(me, { k: 'spot', i }); return me.ammo.slice(); });
  check('an ammo box gives bullets for every gun (half for the ones you don\'t have yet)', s.slice(1).every(n => n > 0), JSON.stringify(s));
  check('ammo boxes lie about the map', await p.evaluate(() => { let n = 0; for (let i = 0; i < NC; i++) if (W.blk[i] === 54) n++; return n >= 25; }));
  // the night ends on time even with zombies about; far ones wander off, near ones stay
  r = await p.evaluate(() => { W.phase = 'day'; W.clock = 0.01; return 1; });
  await simWait(0.3);
  r = await p.evaluate(() => ({ ph: W.phase, n: W.night, q: W.spawnQ.length, edges: [0, 1, 2, 3].map(s => W.edges[s].length) }));
  s = await p.evaluate(() => { const me = W.p[0], ex = W.edges; let far = 0; for (const s of [0, 1, 2, 3]) for (const [x, y] of ex[s]) far = Math.max(far, Math.hypot(x - me.x, y - me.y)); W.nightT = BAL.nightMin(W.night) - 0.05; return Math.round(far); });
  await simWait(0.5);
  s2 = await p.evaluate(() => ({ ph: W.phase, n: W.night, alive: W.zs.filter(z => !z.sleep).length }));
  check('the horde comes out on a ring round you, not the camp', r.ph === 'night' && s < 40, JSON.stringify([r, s]));
  check('the night ends on time with zombies still about', s2.ph === 'day' && s2.n === 1, JSON.stringify(s2));
  // save / load keeps blueprints, cleared buildings, sleepers, the motorbike
  s = await p.evaluate(() => { saveGame(true); const before = { bp: W.obj.bp.length, c: W.obj.occ.filter(q => q.c).length, sl: W.zs.filter(z => z.sleep).length, veh: W.p[0].veh }; continueGame(); return [before, { bp: W.obj.bp.length, c: W.obj.occ.filter(q => q.c).length, sl: W.zs.filter(z => z.sleep).length, veh: W.p[0].veh, mode: W.mode }]; });
  check('save / load keeps blueprints, cleared buildings, sleepers and your vehicle', s[1].mode === 'siege' && s[0].bp === s[1].bp && s[0].c === s[1].c && Math.abs(s[0].sl - s[1].sl) <= 2 && s[1].veh === 2, JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
