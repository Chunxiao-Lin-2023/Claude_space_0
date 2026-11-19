// node test/move.js — movement precision: tap distance, slide after keyup, camera settle, walk-anim stop, slow walk, click-to-move rules
// URL=http://localhost:8783/wanmei/src/out/test.html node test/move.js   (default URL below; out/ served from the repo root)
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8783/wanmei/src/out/test.html';
const SPOT = (process.env.SPOT || '0,62').split(',').map(Number); // 石村广场: open, flat, no mobs
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message); });
  await pg.goto(URL); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
  for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
  await pg.evaluate(() => {
    W.skip = false; W.cine = false; uiCine(false); hidePet(false); for (const p of W.P) p.script = false; setLight('day', true);
    window.__mv = { on: false, log: [], ev: [] };
    const st0 = step; step = function (dt) { st0(dt); const M = __mv; if (!M.on) return; const me = W.P[W.me]; M.log.push({ t: performance.now(), x: me.x, z: me.z, ox: V.ox, oz: V.oz, vel: me.vel || 0, wf: (me.A.walk || 0) > 0.3, held: !!(INP.keys.a || INP.keys.d), sx: w2s(me.x, me.z)[0] - (V.W >> 1) }); };
    const rec = (k, e) => { if (!__mv.on) return; const me = W.P[W.me]; __mv.ev.push({ k, key: e.key, t: performance.now(), x: me.x, z: me.z }); };
    addEventListener('keydown', e => { if (!e.repeat) rec('down', e); }, true); addEventListener('keyup', e => rec('up', e), true);
  });
  const home = async () => { await pg.evaluate(([x, z]) => { const me = W.P[W.me]; INP.moveTo = null; INP.chase = null; INP.walk = false; teleport(me, x, z, PI); if (W.P[1]) { teleport(W.P[1], x - 6, z + 4, PI); } CAM.tx = x; CAM.tz = z; DLG.open && advanceDlg(); }, SPOT); await pg.waitForTimeout(500); };
  const fps = await pg.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); }));
  console.log('fps', fps, 'spot', SPOT.join(','));
  async function trial(key, ms, mods = [], pre) {
    await home(); if (pre) await pre(); await pg.evaluate(() => { __mv.log = []; __mv.ev = []; __mv.on = true; });
    for (const m of mods) await pg.keyboard.down(m);
    await pg.keyboard.down(key); await pg.waitForTimeout(ms); await pg.keyboard.up(key);
    for (const m of mods) await pg.keyboard.up(m);
    await pg.waitForTimeout(800);
    return pg.evaluate(k => { __mv.on = false; const M = __mv, d = M.ev.find(e => e.k === 'down' && e.key.toLowerCase() === k), u = M.ev.find(e => e.k === 'up' && e.key.toLowerCase() === k); const L = M.log, last = L[L.length - 1];
      const after = L.filter(f => f.t > u.t); let camF = 0, walkF = 0; for (let i = 0; i < after.length; i++) { const pv = i ? after[i - 1] : L[L.indexOf(after[0]) - 1]; if (pv && (after[i].ox !== pv.ox || after[i].oz !== pv.oz)) camF = i + 1; if (after[i].wf) walkF = i + 1; }
      const steady = L.filter(f => f.t > d.t + 250 && f.t < u.t - 20), spd = steady.length > 2 ? Math.hypot(steady[steady.length - 1].x - steady[0].x, steady[steady.length - 1].z - steady[0].z) / ((steady[steady.length - 1].t - steady[0].t) / 1000) : null;
      const sxs = [...new Set(L.filter(f => f.t > d.t + 250 && f.t < u.t).map(f => f.sx))];
      return { sxs, held: u.t - d.t, dist: Math.hypot(last.x - d.x, last.z - d.z), slide: Math.hypot(last.x - u.x, last.z - u.z), camF, walkF, spd }; }, key);
  }
  const DUR = [40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 250, 300, 350, 400, 450, 500];
  const R = [];
  for (let i = 0; i < 30; i++) { const ms = DUR[i % DUR.length], key = i % 2 ? 'a' : 'd'; const r = await trial(key, ms); R.push(r); }
  R.sort((a, b) => a.held - b.held);
  console.log('held_ms  dist_m  slide_m  cam_frames  walk_frames');
  for (const r of R) console.log(String(Math.round(r.held)).padStart(6), r.dist.toFixed(3).padStart(7), r.slide.toFixed(3).padStart(8), String(r.camF).padStart(11), String(r.walkF).padStart(12));
  const avg = (a, f) => a.reduce((s, r) => s + f(r), 0) / a.length, short = R.filter(r => r.held < 90);
  console.log(`SUMMARY tap<90ms avg dist ${avg(short, r => r.dist).toFixed(3)} m | min dist ${Math.min(...R.map(r => r.dist)).toFixed(3)} m | avg slide ${avg(R, r => r.slide).toFixed(3)} m (max ${Math.max(...R.map(r => r.slide)).toFixed(3)}) | cam settle avg ${avg(R, r => r.camF).toFixed(1)} fr (max ${Math.max(...R.map(r => r.camF))}) | walk-anim stop avg ${avg(R, r => r.walkF).toFixed(1)} fr (max ${Math.max(...R.map(r => r.walkF))})`);
  // speeds: normal run vs Alt held (slow walk) vs V toggle
  const run = await trial('d', 900), alt = await trial('a', 900, ['Alt']);
  const vt = await trial('d', 900, [], () => pg.keyboard.press('v'));
  console.log(`SPEED run ${run.spd.toFixed(2)} m/s | Alt-held ${alt.spd.toFixed(2)} m/s (${(alt.spd / run.spd).toFixed(2)}x) | V-toggle ${vt.spd.toFixed(2)} m/s (${(vt.spd / run.spd).toFixed(2)}x)`);
  console.log(`HERO screen-x offset from centre while running (distinct values): ${run.sxs.length} [${run.sxs.slice(0, 8).join(',')}${run.sxs.length > 8 ? ',…' : ''}]`);
  // click-to-move rules: right / middle click never move; left click on ground moves; a key press cancels a pending moveTo
  const clickMv = async (button) => { await home(); const [cx, cy] = await pg.evaluate(() => { const me = W.P[W.me], [sx, sy] = w2s(me.x + 4, me.z), f = CSSPX(); return [sx * f, sy * f]; }); const p0 = await pg.evaluate(() => [W.P[W.me].x, W.P[W.me].z]); await pg.mouse.click(cx, cy, { button }); await pg.waitForTimeout(900); const p1 = await pg.evaluate(() => [W.P[W.me].x, W.P[W.me].z]); return Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); };
  const mR = await clickMv('right'), mM = await clickMv('middle'), mL = await clickMv('left');
  await home(); const cancel = await pg.evaluate(() => { const me = W.P[W.me]; INP.moveTo = { x: me.x + 10, z: me.z }; return 0; });
  await pg.waitForTimeout(150); await pg.keyboard.down('w'); await pg.waitForTimeout(60); await pg.keyboard.up('w'); const mt = await pg.evaluate(() => !!INP.moveTo);
  // left click on an out-of-reach foe: walks into range and attacks
  await home(); const [wx, wy, d0] = await pg.evaluate(() => { const me = W.P[W.me]; const w = spawnMob('wolf', me.x + 6, me.z, { lv: 1, story: true }); w.script = true; w.noPush = false; window.__w = w; const [sx, sy] = w2s(w.x, w.z, 0), f = CSSPX(); return [sx * f, (sy - w.h * 0.5 * k()) * f, edist(me, w)]; });
  const hp0 = await pg.evaluate(() => __w.hp); await pg.mouse.click(wx, wy); await pg.waitForTimeout(1500);
  const chase = await pg.evaluate(() => { const r = [edist(W.P[W.me], __w), __w.hp, UI.target === __w]; rmEnt(__w); INP.chase = null; return r; });
  console.log(`CLICK foe 6 m away: dist ${d0.toFixed(1)} -> ${chase[0].toFixed(1)} m, wolf hp ${hp0} -> ${Math.round(chase[1])}, targeted ${chase[2]}`);
  console.log(`CLICK right ${mR.toFixed(2)} m | middle ${mM.toFixed(2)} m | left-ground ${mL.toFixed(2)} m | moveTo after key tap: ${mt ? 'still pending' : 'cancelled'}`);
  await b.close();
})();
