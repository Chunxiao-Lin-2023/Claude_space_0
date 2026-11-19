// Soak run: every map with a different mode, drawn (small window), time sped up. The bot hides in the nearest town building
// on the ground floor and shoots the nearest zombie it can see; between nights it is teleported through building floors,
// farmsteads and the open country so every renderer path runs. Reports: page errors, NaNs, zombies stuck (alive, not attacking,
// not stunned, moved < 0.3 in 20 s of game time), how many shots were fired / hit, frame time. Usage: node test/soak.js [nights]
const { chromium } = require('playwright'); const NIGHTS = +process.argv[2] || 2;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true;
  const runs = [['town', 'classic'], ['forest', 'nests'], ['desert', 'airdrop'], ['islands', 'towers'], ['snow', 'escape'], ['city', 'boss']];
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  for (const [map, mode] of runs.filter(r => !only || only.includes(r[0]))) {
    const p = await (await b.newContext({ viewport: { width: 800, height: 500 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.evaluate(([map, mode]) => { NETROLE = 'solo'; startGame(1234, ['甲'], 'normal', 0, mode, map); }, [map, mode]);
    await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
    await p.evaluate(() => {
      window.__dbg.speed = 5; window.__dbg.god = true; const me = W.p[0]; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 400);
      const S = window.__soak = { stuck: 0, stuckK: {}, nan: 0, shots: 0, hits: 0, frames: [], pos: new Map(), tour: 0, st: [] };
      const H = TOWN_HOUSES.filter(h => h[5] !== 'barn'), R = W.radio;
      H.sort((a, c) => Math.hypot((a[0] + a[2]) / 2 - R.x, (a[1] + a[3]) / 2 - R.y) - Math.hypot((c[0] + c[2]) / 2 - R.x, (c[1] + c[3]) / 2 - R.y));
      const home = H[0], cells = []; for (let x = home[0] + 1; x < home[2]; x++) for (let y = home[1] + 1; y < home[3]; y++) if (standable(x, y, 0, 'p')) cells.push([x, y]);
      S.home = cells[Math.floor(cells.length / 2)];
      // places to visit during the day: each building's floors, farm ruins, random open ground
      const visit = []; for (const h of TOWN_HOUSES) for (let L = 0; L <= h[4]; L++) for (let k = 0; k < 40; k++) { const x = h[0] + 1 + Math.floor(Math.random() * (h[2] - h[0] - 1)), y = h[1] + 1 + Math.floor(Math.random() * (h[3] - h[1] - 1)); if (standable(x, y, L, 'p')) { visit.push([x, y, L]); break; } }
      for (let i = 0; i < MW * MH; i += 37) { const x = i % MW, y = Math.floor(i / MW); if ((W.blk[ci(x, y, 0)] === 24 || W.blk[ci(x, y, 0)] === 50) && HOUSE_ID[i] < 0 && standable(x + 1, y + 1, 0, 'p')) visit.push([x + 1, y + 1, 0]); }
      for (let k = 0; k < 20; k++) { const x = Math.floor(Math.random() * MW), y = Math.floor(Math.random() * MH), L = gAt(x, y); if (standable(x, y, L, 'p')) visit.push([x, y, L]); }
      S.visit = visit;
      const shotsBefore = () => W.stats ? W.stats.shots || 0 : 0;
      setInterval(() => {
        if (!W || W.over) return;
        for (const z of W.zs) { if (![z.x, z.y, z.z, z.hp].every(Number.isFinite)) S.nan++; }
        for (const q of W.p) if (![q.x, q.y, q.z, q.hp].every(Number.isFinite)) S.nan++;
        if (W.phase === 'day') { INP.mL = false; if (S.toured) W.clock = Math.min(W.clock, 2); return; }
        if (!S.atHome) { me.x = S.home[0] + 0.5; me.y = S.home[1] + 0.5; me.L = 0; me.z = surfZ(me.x, me.y, 0); S.atHome = true; }
        const sh = shoulder(me), vis = W.zs.filter(z => z.hp > 0 && !z.hidden && Math.hypot(z.x - me.x, z.y - me.y) < 14 && los(...sh, z.x, z.y, z.z + z.h * 0.6, LEAN)).sort((a, c) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(c.x - me.x, c.y - me.y));
        if (vis.length) { const z = vis[0]; window.__dbg.aimAt = () => ({ x: z.x, y: z.y, z: z.z + z.h * 0.6, zb: z }); INP.mouseT = performance.now(); INP.mL = true; const w = me.ammo[1] + me.mag[1] > 0 ? 1 : 0; if (me.wpn !== w) doAct(me, 'wpn', w); }
        else INP.mL = false;
        if (me.mag[me.wpn] === 0 && me.reloadT <= 0) doAct(me, 'reload');
      }, 40);
      // stuck zombies: sampled every 4 s of game time
      setInterval(() => {
        if (!W || W.phase !== 'night') { S.pos.clear(); S.atHome = false; return; }
        for (const z of W.zs) {
          if (z.hp <= 0) continue; const q = S.pos.get(z.id);
          if (!q) { S.pos.set(z.id, { x: z.x, y: z.y, t: W.t }); continue; }
          if (Math.hypot(z.x - q.x, z.y - q.y) > 0.3 || z.st === 'attack' || z.stun > 0 || z.climbing || z.hidden || (ZT[z.k].boss) || W.p.some(q => Math.hypot(q.x - z.x, q.y - z.y) < 2.2)) { S.pos.set(z.id, { x: z.x, y: z.y, t: W.t }); continue; }
          if (W.t - q.t > 20 && !q.rep) { q.rep = 1; S.stuck++; const key = z.k + '@' + Math.floor(z.x) + ',' + Math.floor(z.y) + ',' + z.L + ':' + (B[W.blk[ci(Math.floor(z.x), Math.floor(z.y), z.L)]].key || '-'); S.st.push(key); }
        }
      }, 800);
      let lf = performance.now(); const fr = () => { const n = performance.now(); S.frames.push(n - lf); if (S.frames.length > 400) S.frames.shift(); lf = n; requestAnimationFrame(fr); }; requestAnimationFrame(fr);
    });
    // render tour (drawn): every building floor, farm ruins, open ground; then the nights run undrawn and fast
    const nv = await p.evaluate(() => __soak.visit.length);
    for (let k = 0; k < nv; k++) { await p.evaluate(k => { const me = W.p[0], [x, y, L] = __soak.visit[k]; me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); me.vx = me.vy = 0; }, k); await p.waitForTimeout(120); }
    await p.waitForTimeout(800);
    await p.evaluate(() => { __soak.toured = true; window.__dbg.skipDraw = true; window.__dbg.speed = 8; });
    let last = -1, s; const last2 = { k: -1, t: 0 };
    for (let t = 0; t < 420; t++) {
      await p.waitForTimeout(1000);
      s = await p.evaluate(() => ({ n: W.night, ph: W.phase, over: W.over, z: W.zs.filter(z => z.hp > 0).length, k: W.kills, S: { stuck: __soak.stuck, nan: __soak.nan, st: __soak.st.slice(0, 6) }, ft: (() => { const f = __soak.frames.slice().sort((a, b) => a - b); return f.length ? [Math.round(f[f.length >> 1]), Math.round(f[Math.floor(f.length * 0.95)])] : []; })(), obj: typeof modeHud === 'function' ? modeHud() : '' }));
      if (t % 30 === 0) console.log('   ', map, 't', t, 'night', s.n, s.ph, 'kills', s.k, 'alive', s.z, 'ft', s.ft.join('/'));
      if (s.ph === 'day' && s.n !== last) { last = s.n; }
      if (s.over || s.n > NIGHTS || (s.n === NIGHTS && s.ph === 'day')) break;
      if (s.k !== (s.kPrev = s.kPrev, last2.k)) { last2.k = s.k; last2.t = t; }
      if (s.ph === 'night' && t - last2.t > 60) { s.stall = await p.evaluate(() => { const me = W.p[0]; return W.zs.filter(z => z.hp > 0).slice(0, 8).map(z => { const i = ci(Math.floor(z.x), Math.floor(z.y), z.L); return [z.k, +z.x.toFixed(1), +z.y.toFixed(1), z.L, z.st, Math.round(W.ff.pw[i]), Math.round(Math.hypot(z.x - me.x, z.y - me.y)), z.mz ? 'mz' : '']; }).concat([['me', +me.x.toFixed(1), +me.y.toFixed(1), me.L]]); }); console.log('    STALL', JSON.stringify(s.stall)); break; }
    }
    const pass = !errs.length && !s.S.nan && s.S.stuck <= 3;
    if (!pass) ok = false;
    console.log((pass ? 'PASS ' : 'FAIL ') + (map + '/' + mode).padEnd(16), 'night', s.n, s.ph, 'over', s.over, 'kills', s.k, 'alive', s.z, 'stuck', s.S.stuck, JSON.stringify(s.S.st), 'nan', s.S.nan, 'frame ms p50/p95', s.ft.join('/'), '|', s.obj, errs.length ? 'ERRS ' + errs.slice(0, 3).join(' | ') : '');
    await p.context().close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
