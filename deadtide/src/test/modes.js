// Every mode end to end (objectives forced along with debug shortcuts): setup, HUD, markers, progress, win; boss abilities.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const start = (mode) => p.evaluate(mode => { window.__dbg.skipDraw = true; window.__dbg.god = true; NETROLE = 'solo'; startGame(777, ['甲'], 'normal', 0, mode); return { mode: W.mode, map: W.map, hud: modeHud(), marks: modeMarks().length }; }, mode);
  const step = (s) => p.evaluate(s => { for (let k = 0; k < s * 60; k++) simStep(1 / 60); }, s);
  const at = (x, y, L) => p.evaluate(([x, y, L]) => { const me = W.p[0]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (standable(x + dx, y + dy, L, 'p')) { me.x = x + dx + 0.5; me.y = y + dy + 0.5; me.L = L; me.z = pZ(me); return true; } me.x = x + 1.5; me.y = y + 0.5; me.L = L; return false; }, [x, y, L]);
  const use = () => p.evaluate(() => { const me = W.p[0], px = Math.floor(me.x), py = Math.floor(me.y); let t = null; for (let dy = -1; dy <= 1 && !t; dy++) for (let dx = -1; dx <= 1 && !t; dx++) { const i = ci(px + dx, py + dy, me.L), b = W.blk[i]; if (b && B[b].obj) t = modeUse(me, i, b); } if (!t) t = useTarget(me); if (!t) return null; completeUse(me, t); return t.name; });

  // 修车逃离
  let r = await start('escape'); check('escape: town map, 6 parts + truck placed, HUD + markers', r.map === 'town' && r.hud && /零件 0\/6/.test(r.hud.t) && r.marks === 7, JSON.stringify(r));
  const parts = await p.evaluate(() => W.obj.parts.map(q => [q.x, q.y, q.L, W.blk[q.ci]]));
  check('escape: part crates stand in buildings', parts.every(q => q[3] === 43), JSON.stringify(parts));
  const names = []; for (const [x, y, L] of parts) { await at(x, y, L); names.push(await use()); }
  check('escape: all six parts picked up', await p.evaluate(() => W.obj.parts.every(q => q.got)), names.join(','));
  await p.evaluate(() => { const T = W.obj.truck; const me = W.p[0]; me.x = T.x + 0.5; me.y = T.y + 1.5; me.L = gAt(T.x, T.y); me.z = pZ(me); });
  const inst = await use(), eng = await use();
  check('escape: install at the truck, then start the engine', /安装/.test(inst) && /发动/.test(eng) && await p.evaluate(() => W.obj.phase === 'start'), inst + ' / ' + eng);
  await step(3); check('escape: the engine draws a horde', await p.evaluate(() => W.zs.filter(z => z.mz).length > 0));
  await p.evaluate(() => { W.obj.t = 0.5; }); await step(1); check('escape: holding out wins', await p.evaluate(() => W.over === 'win'), await p.evaluate(() => JSON.stringify(W.over)));

  // 摧毁尸巢
  r = await start('nests'); check('nests: forest map, 5 nests', r.map === 'forest' && await p.evaluate(() => W.obj.nests.length === 5 && W.obj.nests.every(q => W.blk[q.ci] === 44)), JSON.stringify(r));
  await p.evaluate(() => { const q = W.obj.nests[0], me = W.p[0]; me.x = q.x + 6.5; me.y = q.y + 0.5; me.L = q.L; me.z = pZ(me); }); await step(10);
  check('nests: a nest hatches zombies when you come near', await p.evaluate(() => W.zs.some(z => z.nest === W.obj.nests[0].ci)));
  // shoot it: a ray from the player to the nest hurts it
  const before = await p.evaluate(() => W.bhp[W.obj.nests[0].ci]);
  await p.evaluate(() => { const q = W.obj.nests[0], me = W.p[0]; W.zs.length = 0; me.wpn = 0; me.aimPt = { x: q.x + 0.5, y: q.y + 0.5, z: q.L * FH + 0.5 }; me.aim = Math.atan2(q.y + 0.5 - me.y, q.x + 0.5 - me.x); for (let k = 0; k < 6; k++) { me.fireCD = 0; me.mag[0] = 12; fireWeapon(me, 0); } });
  check('nests: bullets damage a nest', await p.evaluate(b0 => W.bhp[W.obj.nests[0].ci] < b0, before));
  for (let k = 0; k < 5; k++) { await p.evaluate(k => { const q = W.obj.nests[k]; modeHit(q.ci, 1e6); }, k); await step(0.2); }
  check('nests: all nests down -> mother nest + guardian', await p.evaluate(() => W.obj.mother && W.blk[W.obj.mother.ci] === 44 && W.zs.some(z => z.k === 'boss')), await p.evaluate(() => JSON.stringify(modeHud())));
  await p.evaluate(() => modeHit(W.obj.mother.ci, 1e7)); await step(0.3); check('nests: mother down wins', await p.evaluate(() => W.over === 'win'));

  // 信号塔
  r = await start('towers'); check('towers: desert map, 4 towers', r.map === 'desert' && await p.evaluate(() => W.obj.towers.length === 4), JSON.stringify(r));
  const tw = await p.evaluate(() => W.obj.towers.map(q => [q.x, q.y, q.L]));
  await at(...tw[0]); const act = await use(); check('towers: start calibration at the box', /启动/.test(act) && await p.evaluate(() => W.obj.towers[0].st === 1), act);
  await step(4); const pr = await p.evaluate(() => W.obj.towers[0].prog); check('towers: progress while you stand in the ring, zombies come', pr > 0.03 && await p.evaluate(() => W.zs.length > 0), 'prog ' + pr.toFixed(3));
  await p.evaluate(() => { const me = W.p[0]; me.x += 30; me.y += 0; }); const p1 = await p.evaluate(() => W.obj.towers[0].prog); await step(3);
  check('towers: leaving the ring pauses it', await p.evaluate(p1 => W.obj.towers[0].prog <= p1, p1));
  await p.evaluate(() => { for (const q of W.obj.towers) { q.st = 1; q.prog = 0.999; } W.zs.length = 0; });
  for (const t of tw) { await at(...t); await step(0.3); }
  check('towers: all four done -> helicopter countdown', await p.evaluate(() => W.obj.phase === 'evac'), await p.evaluate(() => JSON.stringify(modeHud())));
  await p.evaluate(() => { W.obj.t = 0.2; const me = W.p[0]; me.x = W.radio.x + 0.5; me.y = W.radio.y + 8.5; me.L = 0; me.z = pZ(me); }); await step(0.5);
  check('towers: being in camp when it lands wins', await p.evaluate(() => W.over === 'win'));

  // 抢空投
  r = await start('airdrop'); check('airdrop: islands map', r.map === 'islands', JSON.stringify(r));
  await p.evaluate(() => { W.obj.next = 0; }); await step(0.2);
  check('airdrop: a drop falls', await p.evaluate(() => W.obj.drops.length === 1 && W.obj.drops[0].st === 0));
  await step(10.5); const d = await p.evaluate(() => { const q = W.obj.drops[0]; return [q.x, q.y, q.L, q.st, W.blk[q.ci], W.zs.length]; });
  check('airdrop: it lands as a crate and draws a horde', d[3] === 1 && d[4] === 46 && d[5] >= 5, JSON.stringify(d));
  await at(d[0], d[1], d[2]); const parts0 = await p.evaluate(() => W.res.parts); const op = await use();
  check('airdrop: opening it gives a beacon and loot', /打开/.test(op) && await p.evaluate(p0 => W.obj.got === 1 && W.res.parts > p0, parts0), op);
  await p.evaluate(() => { W.obj.got = 5; W.obj.next = 0; }); await step(0.2); await step(10.5);
  const d2 = await p.evaluate(() => { const q = W.obj.drops[1]; return [q.x, q.y, q.L]; }); await at(...d2); await use();
  check('airdrop: six beacons -> evac point', await p.evaluate(() => W.obj.phase === 'evac' && W.obj.ev), await p.evaluate(() => JSON.stringify(W.obj.ev)));
  await p.evaluate(() => { const e = W.obj.ev, me = W.p[0]; me.x = e.x + 0.5; me.y = e.y + 0.5; me.L = gAt(e.x, e.y); me.z = pZ(me); e.t = 88; W.zs.length = 0; }); await step(2.5);
  check('airdrop: holding the evac point wins', await p.evaluate(() => W.over === 'win'));

  // 尸王狩猎
  r = await start('boss'); check('boss: snow map, four kings in order', r.map === 'snow' && await p.evaluate(() => W.obj.order.length === 4), JSON.stringify(r));
  const kinds = await p.evaluate(() => W.obj.order);
  for (let k = 0; k < 4; k++) {
    const info = await p.evaluate(k => { W.zs.length = 0; W.obj.pools = []; W.night = k + 2; modeNight(k + 2); const z = W.zs.find(z => ZT[z.k].boss); const me = W.p[0]; z.x = me.x + 6; z.y = me.y; z.L = me.L; z.z = me.z; z.abT = 0; return z ? z.k : null; }, k);
    const seen = await p.evaluate(() => { const o = { leap: 0, dig: 0 }; for (let k = 0; k < 72; k++) { simStep(1 / 60); const z = W.zs.find(z => ZT[z.k].boss); if (z.leap) o.leap = 1; if (z.dig || z.hidden) o.dig = 1; } return o; });
    const ab = await p.evaluate(seen => { const z = W.zs.find(z => ZT[z.k].boss); return { k: z.k, leap: seen.leap, hidden: seen.dig, minions: W.zs.filter(q => q.sum === z.id).length, pools: W.obj.pools.length, acid: W.proj.filter(q => q.pool).length, hud: modeHud().t }; }, seen);
    const used = ab.k === 'leaper' ? !!ab.leap : ab.k === 'digger' ? !!ab.hidden : ab.k === 'summoner' ? ab.minions > 0 : ab.pools > 0 || ab.acid > 0;
    check('boss: ' + info + ' arrives and uses its ability', info === kinds[k] && used, JSON.stringify(ab));
    await p.evaluate(() => { const z = W.zs.find(z => ZT[z.k].boss); z.hidden = 0; z.dig = null; z.leap = null; hurtZombie(z, 1e7, W.p[0]); }); await step(0.3);
  }
  check('boss: four kings down wins', await p.evaluate(() => W.over === 'win' && W.obj.dead.length === 4), await p.evaluate(() => JSON.stringify(W.obj.dead)));
  // classic still ends at night 15 only in classic
  r = await start('classic'); check('classic: no objective panel', !r.hud);
  // screenshots: HUD with the objective panel and an edge arrow (escape on town)
  await start('escape'); await p.evaluate(() => { window.__dbg.skipDraw = false; }); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + '/mode_escape.png' });
  await p.evaluate(() => toggleBigMap(true)); await p.waitForTimeout(600); await p.screenshot({ path: OUT + '/mode_escape_map.png' }); await p.evaluate(() => toggleBigMap(false));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | ')); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
