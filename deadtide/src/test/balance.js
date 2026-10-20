// Rough balance probe: a bot on the starting fort's upper floor shoots the zombie nearest the radio (no building, no crafting).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 640 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.click('#soloBtn'); await p.evaluate(() => { window.__dbg.skipDraw = true; }); await p.waitForFunction(() => W && W.t > 1, null, { timeout: 90000 });
  await p.evaluate(() => {
    window.__dbg.speed = 4; W.p[0].meds = 3;
    setInterval(() => {
      if (!W || W.over) return; const me = W.p[0];
      if (W.phase === 'day') { W.clock = Math.min(W.clock, 3); INP.mL = false; return; }
      const zs = W.zs.filter(z => z.hp > 0); if (!zs.length) { INP.mL = false; return; }
      zs.sort((a, c) => Math.hypot(a.x - W.radio.x, a.y - W.radio.y) - Math.hypot(c.x - W.radio.x, c.y - W.radio.y));
      const z = zs[0];
      if (!me.down) { me.x = clamp(z.x, 30.5, 34.4); me.y = clamp(z.y, 26.5, 30.5); if (Math.floor(me.x) === 34 && Math.floor(me.y) === 27) me.y = 28.5; me.L = 1; me.z = surfZ(me.x, me.y, 1); me.vx = me.vy = 0; }
      const [sx, sy] = w2s(z.x, z.y, z.z + z.h * 0.7); INP.mx = sx; INP.my = sy; INP.mouseT = performance.now(); INP.mL = true;
      if (me.mag[me.wpn] === 0 && me.ammo[me.wpn] === 0 && me.wpn) doAct(me, 'wpn', 0);
      if (me.hp < 50 && me.meds) doAct(me, 'med');
    }, 50);
  });
  let last = -1;
  for (let t = 0; t < 900; t++) {
    await p.waitForTimeout(1000);
    const s = await p.evaluate(() => ({ n: W.night, ph: W.phase, r: Math.round(W.radio.hp), hp: Math.round(W.p[0].hp), k: W.kills, lost: W.stats.lost, z: W.zs.length, over: W.over, kinds: [...new Set(W.zs.map(z => z.k))].join('') }));
    if (s.over || (s.ph === 'day' && s.n !== last)) { console.log(JSON.stringify(s)); last = s.n; }
    if (s.over || s.n >= 6) break;
  }
  console.log('errs', errs, await p.evaluate(() => window.__dbg.err || ''));
  await b.close();
})();
