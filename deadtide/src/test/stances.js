// Weapon stances: all seven weapons side by side (shouldered), then on the move (low ready), close-ups.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.click('#soloBtn'); await p.waitForFunction(() => W && W.t > 0.5);
  await p.evaluate(() => {
    window.__dbg.god = true; window.__dbg.speed = 0; window.__dbg.aimAt = () => ({ x: W.p[0].x + 6, y: W.p[0].y, z: 0.8 });
    document.getElementById('hud').style.display = 'none';
    const X = W.radio.x + 10, Y = W.radio.y + 10, cf = camFwd();
    for (let y = Y - 4; y <= Y + 4; y++) for (let x = X - 4; x <= X + 12; x++) { const i = ci(x, y, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++;
    while (W.p.length < 7) W.p.push(mkPlayer(W.p.length, 'p' + W.p.length));
    W.p.forEach((q, k) => { const cr0 = camRight(); q.x = X + 0.5 + cr0[0] * (k - 3) * 1.3; q.y = Y + 0.5 + cr0[1] * (k - 3) * 1.3; q.L = 0; q.z = 0; q.zv = 0; q.wpn = k; q.owned = WPN.map(() => 1); const cr = camRight(); q.aim = Math.atan2(cr[1] * 0.55 - cf[1] * 0.85, cr[0] * 0.55 - cf[0] * 0.85); q.aimPt = { x: q.x + Math.cos(q.aim) * 6, y: q.y + Math.sin(q.aim) * 6, z: 0.8 }; q._lastShot = W.t; q.gone = false; });
    window.__dbg.aimAt = () => W.p[0].aimPt;
    CAM.zoom = 4.6; CAM.rot = 0; CAM.tx = X + 4.3; CAM.ty = Y; CAM.lookX = CAM.lookY = 0;
  });
  const hold = () => p.evaluate(() => { CAM.tx = W.p[3].x; CAM.ty = W.p[3].y; CAM.lookX = CAM.lookY = 0; });
  await p.waitForTimeout(2500); await hold(); await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/st_ready.png' });
  await p.evaluate(() => { CAM.rot = 1; }); await p.waitForTimeout(2500); await hold(); await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/st_ready_r1.png' });
  // on the move, not shooting: low ready
  await p.evaluate(() => { CAM.rot = 0; W.p.forEach(q => { q._lastShot = -99; }); window.__walk = setInterval(() => { W.p.forEach(q => { const a = q.aim; q.x += Math.cos(a) * 0.03; q.y += Math.sin(a) * 0.03; q.aimPt.x += Math.cos(a) * 0.03; q.aimPt.y += Math.sin(a) * 0.03; }); }, 16); });
  await p.waitForTimeout(3000); await p.evaluate(() => { CAM.tx = W.p[3].x; CAM.ty = W.p[3].y; }); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/st_move.png' });
  console.log(await p.evaluate(() => W.p.map(q => q.wpn + ':' + (q._rdy || 0).toFixed(2) + '/' + (q._kn || 0).toFixed(2)).join(' ')));
  console.log('errs', errs); await b.close();
})();
