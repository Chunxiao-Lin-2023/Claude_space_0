// Rough balance probe: a bot on the 2nd floor shoots through the starting house's bars (no building, no crafting).
// Reports radio HP / player state after each night at speed 4.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 640 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/test.html'); await p.waitForFunction(() => window.__ready);
  await p.click('#soloBtn'); await p.evaluate(() => { window.__dbg.skipDraw = true; window.__dbg.speed = 4; W.p[0].meds = 3; });
  // bot: every 100ms pick side with nearest zombie to the radio, stand at the bars and aim
  await p.evaluate(() => {
    setInterval(() => {
      if (!W || W.over) return; const me = W.p[0];
      if (W.phase === 'day') { W.clock = Math.min(W.clock, 3); return; }
      const zs = W.zs.filter(z => z.hp > 0); if (!zs.length) { INP.mL = false; return; }
      zs.sort((a, c) => Math.abs(a.x - RADIO.x) - Math.abs(c.x - RADIO.x));
      const z = zs[0], left = z.x < RADIO.x;
      if (!me.down) { me.x = (left ? 65.4 : 74.6) * T; me.y = 36 * T; me.vx = me.vy = 0; }
      const [mx, my] = w2s(z.x, z.y - z.h * 0.75); INP.mx = mx; INP.my = my; INP.mouseT = performance.now(); INP.mL = true;
      if (me.mag[me.wpn] === 0 && me.ammo[me.wpn] === 0 && me.wpn) doAct(me, 'wpn', 0);
      if (me.hp < 50 && me.meds) doAct(me, 'med');
    }, 60);
  });
  let last = 0;
  for (let t = 0; t < 600; t++) {
    await p.waitForTimeout(1000);
    const s = await p.evaluate(() => ({ n: W.night, ph: W.phase, r: Math.round(W.radio.hp), hp: Math.round(W.p[0].hp), k: W.kills, lost: W.stats.lost, z: W.zs.length, over: W.over, ammo: W.p[0].mag.join('/') + '|' + W.p[0].ammo.join('/') }));
    if (s.over || (s.ph === 'day' && s.n !== last)) { console.log(JSON.stringify(s)); last = s.n; }
    if (s.over || s.n >= 7) break;
  }
  console.log('errs', errs);
  await b.close();
})();
