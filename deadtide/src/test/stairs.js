// (round 35) every zombie kind gets up the stairs to a survivor on the first floor in five town buildings (the brute used to charge off along the floor below; walkers went up and down the stairs for ever)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:' + (8766) + '/test.html'); await p.waitForFunction(() => window.__ready);
  const res = await p.evaluate(() => {
    window.__dbg.skipDraw = true; NETROLE = 'solo'; const out = [];
    for (const type of ['apt', 'police', 'villa', 'clinic', 'shop']) {
      startGame(4242, ['甲'], 'normal', 0, 'classic', 'town'); window.__dbg.god = true; W.clock = 9999;
      const H = TOWN_HOUSES.find(h => h[5] === type); if (!H) continue; const [x0, y0, x1, y1] = H, me = W.p[0];
      let up = null, dn = null; for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) { if (!up && standable(x, y, 1, 'p') && support(x, y, 1) && !B[W.blk[ci(x, y, 1)]].stairs) up = [x, y]; if (standable(x, y, 0, 'z') && !B[W.blk[ci(x, y, 0)]].stairs) dn = [x, y]; }
      if (!up || !dn) { out.push({ type, none: 1 }); continue; }
      me.x = up[0] + 0.5; me.y = up[1] + 0.5; me.L = 1; me.z = FH;
      const r = {};
      for (const k of ['walker', 'brute', 'boss', 'armored', 'bloater']) {
        W.zs.length = 0; updateFields(0, true); const z = spawnZombie(k, 0); z.x = dn[0] + 0.5; z.y = dn[1] + 0.5; z.L = 0; z.z = 0; z.spd = 1.2;
        let reach = -1, maxL = 0; for (let t = 0; t < 50 / 0.05; t++) { simStep(0.05); maxL = Math.max(maxL, z.L); if (reach < 0 && z.L === 1 && Math.hypot(z.x - me.x, z.y - me.y) < 2) reach = +(t * 0.05).toFixed(1); }
        r[k] = { reach, maxL, at: [+z.x.toFixed(1), +z.y.toFixed(1), z.L], st: z.st, bump: z.bump };
      }
      out.push({ type, r });
    }
    return out;
  });
  let ok = !errs.length; for (const o of res) { const bad = o.none ? ['no spot'] : Object.entries(o.r).filter(([k, v]) => v.reach < 0).map(([k]) => k); console.log((bad.length ? 'FAIL ' : 'PASS ') + o.type + ' upstairs: ' + JSON.stringify(Object.fromEntries(Object.entries(o.r || {}).map(([k, v]) => [k, v.reach])))); if (bad.length) ok = false; }
  if (errs.length) console.log('FAIL errors', errs.join('|')); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
