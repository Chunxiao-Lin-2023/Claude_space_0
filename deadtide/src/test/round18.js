// Round 18: harder from night 1 and every night after (mix, packs), and area weapons that pay off:
// grenade radius / landing fuse, launcher radius, wider flamer + fire that spreads, shotgun pellets through two, red barrels.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 900, height: 600 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
  // ---- the night curve
  const curve = await p.evaluate(() => {
    window.__dbg.skipDraw = true; NETROLE = 'solo'; const out = [];
    for (const n of [1, 2, 3, 4, 6, 8, 12, 15]) {
      startGame(777, ['甲'], 'normal', 0, 'classic', 'town'); W.night = n - 1; startNight();
      const q = W.spawnQ, kinds = {}; for (const s of q) kinds[s.k] = (kinds[s.k] || 0) + 1;
      const packs = new Set(q.map(s => s.g)).size, spots = new Set(q.map(s => s.side + ':' + s.at)).size, mixed = [...new Set(q.map(s => s.g))].filter(g => new Set(q.filter(s => s.g === g).map(s => s.k)).size > 1).length;
      out.push({ n, total: q.length, packs, spots, mixed, sides: new Set(q.map(s => s.side)).size, kinds, hp: +BAL.hpMul(n).toFixed(2), spd: +BAL.spdMul(n).toFixed(2), last: Math.round(q[q.length - 1].t) });
    }
    return out;
  });
  for (const r of curve) console.log('      night', String(r.n).padStart(2), 'zombies', String(r.total).padStart(3), 'in', String(r.packs).padStart(3), 'herds (' + r.mixed + ' mixed, ' + r.spots + ' spawn spots) from', r.sides, 'side(s), hp x' + r.hp, 'speed x' + r.spd, 'all out by', r.last + 's', JSON.stringify(r.kinds));
  check('night 1 already has more than walkers and crawlers', curve[0].kinds.runner > 0 && curve[0].total >= 40, JSON.stringify(curve[0].kinds));
  check('each night brings at least as many as the last (a level every two nights since round 31)', curve.every((r, i) => !i || r.total >= curve[i - 1].total || (curve[i - 1].n % 5 === 0)) && curve[curve.length - 1].total > curve[0].total * 2);
  check('zombies come in herds (several per herd)', curve.every(r => r.packs < r.total * 0.5));
  check('a herd is spread over the edge (not one spawn cell) and some herds are mixed', curve.every(r => r.spots > r.packs * 1.3) && curve.slice(1).every(r => r.mixed > 0), JSON.stringify(curve.map(r => [r.spots, r.packs, r.mixed])));
  // packs stay together on the way in
  const spread = await p.evaluate(() => new Promise(res => {
    startGame(778, ['甲'], 'normal', 0, 'classic', 'town'); window.__dbg.god = true; window.__dbg.speed = 6; W.night = 0; startNight();
    const t0 = W.t; const f = () => { if (W.t - t0 < 25) return setTimeout(f, 50);
      const zs = W.zs.filter(z => z.hp > 0), nn = zs.map(z => Math.min(...zs.filter(o => o !== z).map(o => Math.hypot(o.x - z.x, o.y - z.y)))); nn.sort((a, b) => a - b);
      const byG = {}; for (const z of zs) if (z.g) (byG[z.g] = byG[z.g] || []).push(z);
      const herds = Object.values(byG).filter(a => a.length >= 3), spreadG = herds.map(a => { const cx = a.reduce((s, z) => s + z.x, 0) / a.length, cy = a.reduce((s, z) => s + z.y, 0) / a.length; return Math.max(...a.map(z => Math.hypot(z.x - cx, z.y - cy))); });
      const spds = herds.map(a => new Set(a.map(z => z.spd.toFixed(2))).size >= a.length * 0.6 && Math.max(...a.map(z => z.spd)) - Math.min(...a.map(z => z.spd)) > 0.1);
      window.__dbg.speed = 1; res({ n: zs.length, median: +nn[nn.length >> 1].toFixed(2), herds: herds.length, radius: spreadG.map(v => +v.toFixed(1)), ownPace: spds.every(Boolean) }); }; f(); }));
  check('a herd arrives as a loose crowd: not single file, not a solid block (gap 0.6–2.5, herd radius < 9)', spread.median > 0.6 && spread.median < 2.5 && spread.radius.every(r => r < 9), JSON.stringify(spread));
  check('everyone in a herd keeps its own pace', spread.ownPace, JSON.stringify(spread));
  // ---- area weapons, on cleared open ground
  await p.evaluate(() => {
    startGame(779, ['甲'], 'normal', 0, 'classic', 'town'); window.__dbg.god = true; window.__dbg.speed = 1; W.night = 1;
    const me = W.p[0]; me.x = W.radio.x + 10.5; me.y = W.radio.y - 9.5; me.L = 0; me.z = 0; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 99); me.mag = WPN.map(w => w.mag); me.nades = 5;
    for (let y = -14; y <= 14; y++) for (let x = -4; x <= 16; x++) { const i = ci(Math.floor(me.x) + x, Math.floor(me.y) + y, 0); if (W.blk[i]) W.blk[i] = 0; } W.ver++; W.navDirty = true;
    window.__ring = (k, cx, cy, n, r) => { W.zs.length = 0; for (let j = 0; j < n; j++) { const a = j / n * 6.283, z = spawnZombie(k, 0); z.x = cx + Math.cos(a) * r; z.y = cy + Math.sin(a) * r; z.L = 0; z.z = 0; z.stun = 99; z.hp = z.max = 150; } };
    window.__aimAt = (x, y, zz) => { const me = W.p[0]; me.aimPt = { x, y, z: zz }; me.aim = Math.atan2(y - me.y, x - me.x); };
  });
  // grenade into a loose group (8 zombies 2.6 from the centre, 150 hp each): everyone is hit hard, it goes off near where it was aimed
  let r = await p.evaluate(() => { const me = W.p[0], cx = me.x + 8, cy = me.y; __ring('walker', cx, cy, 8, 2.6); __aimAt(cx, cy, 0.5); throwNade(me); return { cx, cy, fuse: W.proj[0].t }; });
  await simWait(1.6);
  let s = await p.evaluate(() => ({ hurt: W.zs.filter(z => z.hp > 0 && z.hp < z.max - 60).length, dead: 8 - W.zs.filter(z => z.hp > 0).length }));
  check('grenade: 8 zombies 2.6 from where it lands are all hit hard or killed', s.hurt + s.dead >= 8, JSON.stringify(s) + ' fuse ' + r.fuse.toFixed(2));
  check('grenade goes off soon after landing (not rolling on for 1.6 s)', r.fuse < 1.45, r.fuse.toFixed(2));
  // launcher radius
  r = await p.evaluate(() => { const me = W.p[0], cx = me.x + 9, cy = me.y; __ring('walker', cx, cy, 6, 2.4); W.zs = W.zs.filter(z => z.x > cx - 1); window.__nL = W.zs.length; me.wpn = 6; me.mag[6] = 4; me.fireCD = 0; __aimAt(cx, cy, 0.2); fireWeapon(me, 6); return 1; });
  await simWait(1.5);
  s = await p.evaluate(() => [W.zs.filter(z => z.hp > 0 && z.hp < z.max - 40).length + __nL - W.zs.filter(z => z.hp > 0).length, __nL]);
  check('launcher: zombies 2.4 from where the shell lands are all caught by the blast', s[0] === s[1], 'hit ' + s.join('/'));
  // flamer: a wide spread in front, then fire jumps between zombies close together
  r = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; const hit = [];
    for (const a of [-0.42, -0.2, 0, 0.2, 0.42]) { const z = spawnZombie('walker', 0); z.x = me.x + Math.cos(a) * 4.6; z.y = me.y + Math.sin(a) * 4.6; z.L = 0; z.z = 0; z.stun = 99; z.hp = z.max = 900; }
    __aimAt(me.x + 5, me.y, 0.7); me.wpn = 5; me.mag[5] = 80; for (let k = 0; k < 3; k++) fireWeapon(me, 5); return W.zs.filter(z => z.burn > 0).length; });
  check('flamer: 5 zombies spread over ±24° at 4.6 all catch fire', r === 5, r + '/5');
  r = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; const a = spawnZombie('walker', 0), z2 = spawnZombie('walker', 0);
    for (const [z, dx] of [[a, 6], [z2, 7.05]]) { z.x = Math.floor(me.x) + dx + 0.95; z.y = Math.floor(me.y) + 0.5; z.L = 0; z.z = 0; z.stun = 99; z.hp = z.max = 900; } a.burn = 3; a.burnBy = 0; return 1; });
  await simWait(2.5);
  check('fire spreads to a zombie in the next cell', await p.evaluate(() => W.zs[1].burn > 0 || W.zs[1].hp < 900));
  // shotgun: a pellet goes through the first zombie into the one behind
  r = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; const zs = [];
    for (const d of [2.2, 3.0]) { const z = spawnZombie('walker', 0); z.x = me.x + d; z.y = me.y; z.L = 0; z.z = 0; z.stun = 99; z.hp = z.max = 900; zs.push(z); }
    __aimAt(me.x + 3, me.y, 0.7); me.wpn = 1; me.mag[1] = 6; fireWeapon(me, 1); return zs.map(z => Math.round(900 - z.hp)); });
  check('shotgun pellets go through into the zombie behind', r[1] > 0, JSON.stringify(r));
  // red barrel: a shot sets it off (blast + fire); other barrels don't
  r = await p.evaluate(() => {
    const me = W.p[0], bx = Math.floor(me.x) + 6, by0 = Math.floor(me.y) - 6, out = {};
    for (let by = by0; by < by0 + 12 && out.red == null; by++) { const i = ci(bx, by, 0); W.blk[i] = 37; if (redBarrel(i)) out.red = [bx, by]; else { if (out.plain == null) out.plain = [bx, by]; else W.blk[i] = 0; } }
    W.ver++; return out; });
  s = await p.evaluate(({ red, plain }) => {
    const me = W.p[0], [rx, ry] = red; W.zs.length = 0; __ring('walker', rx + 0.5, ry + 0.5, 6, 1.8); for (const z of W.zs) z.hp = z.max = 900; W.zs = W.zs.filter(z => z.x > rx + 0.3); /* behind the barrel, not in the line of fire */ const before = W.blk[ci(rx, ry, 0)];
    __aimAt(rx + 0.5, ry + 0.5, 0.35); me.wpn = 0; me.mag[0] = 12; fireWeapon(me, 0);
    const res = { before, n: W.zs.length, gone: W.blk[ci(rx, ry, 0)] === 0, burning: W.zs.filter(z => z.burn > 0).length, hurt: W.zs.filter(z => z.hp < z.max).length };
    if (plain) { __aimAt(plain[0] + 0.5, plain[1] + 0.5, 0.35); me.fireCD = 0; fireWeapon(me, 0); res.plainStays = W.blk[ci(plain[0], plain[1], 0)] === 37; }
    return res; }, r);
  check('shooting a red barrel blows it up and sets the zombies round it alight', s.before === 37 && s.gone && s.burning === s.n && s.hurt === s.n && s.n >= 2, JSON.stringify(s));
  check('other barrels just get shot', s.plainStays !== false, JSON.stringify(s));
  // the cap on zombies alive at once
  r = await p.evaluate(() => { W.zs.length = 0; W.phase = 'night'; W.nightT = 0; W.spawnQ = Array.from({ length: 400 }, (_, k) => ({ t: 0, k: 'walker', side: 0, at: -1, f: 1 })); stepPhase(0.016); return { alive: W.zs.length, cap: BAL.zCap(), left: W.spawnQ.length }; });
  check('no more than the cap alive at once, the rest wait', r.alive === r.cap && r.left === 400 - r.cap, JSON.stringify(r));
  // each gun its own reload and cooldown
  r = await p.evaluate(() => { W.zs.length = 0; W.phase = 'day'; W.spawnQ = []; const me = W.p[0]; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 50); me.wpn = 1; me.mag[1] = 0; me.mag[0] = 12; me.mag[3] = 5; me.reloadT = 0; me.fireCD = 0; me.cdW = WPN.map(() => 0); me.rlBg = WPN.map(() => 0);
    startReload(me); const t1 = me.reloadT; doAct(me, 'wpn', 0); return { t1, bg: +me.rlBg[1].toFixed(2), rt: me.reloadT }; });
  await simWait(0.3);
  s = await p.evaluate(() => { const me = W.p[0], m0 = me.mag[0]; me.aimPt = { x: me.x + 5, y: me.y, z: 0.7 }; for (let k = 0; k < 4; k++) { me.inp.fire = 1; stepActions(me, 0.016); } me.inp.fire = 0; return { fired: m0 - me.mag[0] }; });
  await simWait(1.8);
  let s2 = await p.evaluate(() => ({ shotgunMag: W.p[0].mag[1], bg: W.p[0].rlBg[1] }));
  check('swap away mid-reload: the other gun fires at once, the reload finishes in the holster', r.bg > 1 && r.rt === 0 && s.fired >= 1 && s2.shotgunMag === 6, JSON.stringify([r, s, s2]));
  r = await p.evaluate(() => { const me = W.p[0]; me.wpn = 3; me.fireCD = 0; me.cdW = WPN.map(() => 0); me.aimPt = { x: me.x + 5, y: me.y, z: 0.7 }; fireWeapon(me, 3); doAct(me, 'wpn', 0); return { sniperCD: +me.cdW[3].toFixed(2), pistolCD: me.cdW[0] }; });
  await simWait(0.3);
  s = await p.evaluate(() => { const me = W.p[0], m0 = me.mag[0]; me.aimPt = { x: me.x + 5, y: me.y, z: 0.7 }; for (let k = 0; k < 4; k++) { me.inp.fire = 1; stepActions(me, 0.016); } me.inp.fire = 0; return { fired: m0 - me.mag[0] }; });
  check('the sniper\'s 1 s bolt doesn\'t hold up the pistol', r.sniperCD > 0.9 && s.fired >= 1, JSON.stringify([r, s]));
  r = await p.evaluate(() => { const me = W.p[0]; me.wpn = 1; me.mag[1] = 0; me.reloadT = 0; doAct(me, 'wpn', 0); return +me.rlBg[1].toFixed(2); });
  check('an empty gun you put away reloads itself', r > 1.5, r);
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
