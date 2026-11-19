// Character showcase: every zombie type / walker variant + both survivors in several poses, day and night.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 760 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; document.getElementById('hud').style.opacity = 0.15; });
  const stage = await p.evaluate(() => {
    const X = W.radio.x + 6, Y = W.radio.y + 8, me = W.p[0]; me.x = X + 0.5; me.y = Y + 0.6; me.L = 0; me.aim = 0;
    W.zs.length = 0; W.p.push(mkPlayer(1, 'b')); const q = W.p[1]; q.x = X - 3.5; q.y = Y + 2.5; q.L = 0; q.wpn = 2; q.owned[2] = 1; q.aim = 0.3;
    const kinds = [['walker', 0], ['walker', 1], ['walker', 2], ['walker', 3], ['walker', 4], ['runner', 0], ['climber', 0], ['spitter', 0], ['brute', 0], ['boss', 0]];
    kinds.forEach(([k, v], j) => { const z = spawnZombie(k, 0); z.seed = v + 5 * (j + 1); if (k === 'walker') z.seed = v + 5 * 7; z.x = X - 1.2 + (j % 5) * 1.1; z.y = Y - 0.6 + (j < 5 ? 0 : 1.6) + 0.5; z.L = 0; z.z = 0; z.face = Math.PI; z.spd = 0; z.frozen = 1; });
    window.__freeze = setInterval(() => { for (const z of W.zs) { z.face = Math.atan2(W.p[0].y - z.y, W.p[0].x - z.x) * 0 + Math.PI * 0.85; } }, 16);
    CAM.zoom = 2.8; CAM.lookX = 0; CAM.lookY = 0; return [X, Y];
  });
  // freeze zombie AI by making them unable to move: overwrite stepZombies
  await p.evaluate(() => { window.__sz = stepZombies; stepZombies = () => { for (const z of W.zs) { z.anim += 0.016; } }; });
  const shot = async (n, f) => { await p.evaluate(f || (() => 0)); await p.evaluate(() => { INP.mx = VW / 2; INP.my = VH / 2; INP.mouseT = performance.now(); }); await p.waitForTimeout(900); await p.screenshot({ path: OUT + '/ch_' + n + '.png' }); };
  await shot('day', () => { 0; });
  await shot('day_r2', () => { CAM.rot = 2; CAM.yaw = camYawTarget(); });
  await shot('night', () => { CAM.rot = 0; CAM.yaw = camYawTarget(); window.__dbg.dark = 1; });
  // walking zombies (moving in place) + attacking
  await p.evaluate(() => { stepZombies = () => { for (const z of W.zs) { z.x += Math.cos(z.face) * 0.004; z.y += Math.sin(z.face) * 0.004; z.moving = true; z.atk = z.k === 'brute' || z.k === 'boss' ? 0.3 : 0; } }; window.__dbg.dark = 0.2; });
  await shot('walk');
  await p.waitForTimeout(250); await shot('walk2');
  // survivors: shooting, reloading, running, down
  await p.evaluate(() => { stepZombies = window.__sz; W.zs.length = 0; RND.corpses.length = 0; const me = W.p[0], q = W.p[1]; me.aimPt = { x: me.x + 4, y: me.y, z: 0.7 }; q.reloadT = 2; CAM.zoom = 3.2; CAM.lookX = 1; });
  await shot('players', () => { const me = W.p[0]; INP.mL = true; INP.mouseT = 0; me.inp.fire = 1; });
  await p.evaluate(() => { const me = W.p[0]; me.inp.fire = 0; INP.mL = false; INP.keys.d = true; });
  await p.waitForTimeout(500); await shot('run');
  await p.evaluate(() => { INP.keys.d = false; W.p[1].down = true; W.p[1].downT = 99; W.p[0].medT = 2; });
  await shot('down_med');
  // death poses
  await p.evaluate(() => { W.p[1].down = false; W.p[0].medT = 0; const me = W.p[0]; for (let k = 0; k < 6; k++) { const z = spawnZombie(['walker', 'runner', 'brute', 'climber', 'spitter', 'walker'][k], 0); z.x = me.x + 2 + k * 0.8; z.y = me.y + (k % 2) * 1.2; z.L = 0; z.z = 0; z.seed = k; killZombie(z, me); } W.zs.length = 0; });
  await shot('dead');
  console.log('errs', errs.slice(0, 5));
  await b.close();
})();
