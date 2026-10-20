// Visual check: a crowd of every zombie type at the house, at night and by day.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/lt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/test.html'); await p.waitForFunction(() => window.__ready);
  await p.click('#soloBtn'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    window.__dbg.god = true; const me = W.p[0]; me.x = 72 * T; me.y = 36 * T; me.aim = Math.PI;
    W.phase = 'night'; W.night = 6; W.spawnQ = [{ t: 999, k: 'walker', side: 1 }];
    const put = (k, x) => { const z = spawnZombie(k, -1); z.x = x * T; return z; };
    put('walker', 58); put('walker', 59); put('walker', 60); put('runner', 56); put('climber', 61); put('spitter', 52); put('brute', 55); put('walker', 62); put('walker', 62.5);
    const zb = put('boss', 48);
  });
  await p.waitForTimeout(3500); await p.screenshot({ path: OUT + '/10_crowd_night.png' });
  await p.evaluate(() => { const me = W.p[0]; INP.mL = true; INP.mouseT = performance.now(); const [mx, my] = w2s(60 * T, GY - 40); INP.mx = mx; INP.my = my; me.wpn = 2; me.owned[2] = 1; me.mag[2] = 30; me.ammo[2] = 300; });
  await p.waitForTimeout(1500); await p.screenshot({ path: OUT + '/11_shoot_night.png' });
  await p.evaluate(() => { INP.mL = false; });
  await p.waitForTimeout(6000);
  console.log(await p.evaluate(() => JSON.stringify({ zs: W.zs.map(z => z.k + (z.ride ? '^' : '') + (z.climbing ? '#' + z.climbing : '') + '@' + (z.x / T).toFixed(1) + ',' + (z.y / T).toFixed(1)), lost: W.stats.lost, tiles: [tileAt(64, 38), tileAt(64, 39), tileAt(64, 37)].join() })));
  await p.screenshot({ path: OUT + '/12_later.png' });
  await p.evaluate(() => { W.phase = 'day'; W.clock = 80; W.dayLen = 110; });
  await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/13_crowd_day.png' });
  console.log('errs', errs);
  await b.close();
})();
