// Screenshots of the new multi-storey blocks, the starter house ladders and the weapon picker.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 760 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.click('#soloBtn'); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; document.getElementById('hud').style.opacity = 0.2; });
  const shot = async (n, f) => { await p.evaluate(f); await p.evaluate(() => { const me = W.p[0]; CAM.tx = me.x; CAM.ty = me.y; CAM.tz = me.L * FH; CAM.lookX = CAM.lookY = 0; }); await p.waitForTimeout(1500); await p.screenshot({ path: OUT + '/h_' + n + '.png' }); };
  await shot('block_out', () => { const me = W.p[0]; me.x = 101.5; me.y = 70.5; me.L = 0; CAM.zoom = 9; });
  await shot('block_in1', () => { const me = W.p[0]; me.x = 99.5; me.y = 61.5; me.L = 1; me.z = FH; CAM.zoom = 6; });
  await shot('block_in3', () => { const me = W.p[0]; me.L = 3; me.z = 3 * FH; });
  await shot('camp_in', () => { const me = W.p[0]; me.x = W.radio.x + 2.5; me.y = W.radio.y + 0.5; me.L = 0; me.z = 0; CAM.zoom = 5; });
  await shot('camp_roof', () => { const me = W.p[0]; me.L = 2; me.z = 2 * FH; CAM.zoom = 7; });
  console.log('errs', errs.slice(0, 3)); await c.close();
  const m = await b.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true, userAgent: UA }); await m.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const q = await m.newPage(); q.setDefaultTimeout(150000); await q.goto('http://localhost:8766/test.html'); await q.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await q.tap('#soloBtn'); await q.waitForFunction(() => W && W.t > 0.3, null, { timeout: 90000 });
  await q.evaluate(() => { const me = W.p[0]; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 30); });
  await q.waitForTimeout(400); await q.tap('#tWpn'); await q.waitForTimeout(300);
  const n = await q.evaluate(() => document.querySelectorAll('#wpick button').length); await q.screenshot({ path: OUT + '/h_wpick.png' });
  await q.tap('#wpick button:nth-child(6)'); await q.waitForTimeout(400);
  console.log('picker buttons', n, 'picked weapon', await q.evaluate(() => W.p[0].wpn), 'closed', await q.evaluate(() => document.getElementById('wpick').classList.contains('hidden')));
  await b.close();
})();
