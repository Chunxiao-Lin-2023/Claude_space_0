// Hub cover: staged dusk scene + title -> /tmp/dt/cover_raw.png (python resizes to covers/deadtide.webp)
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.evaluate(() => {
    window.__dbg.skipDraw = true; NETROLE = 'solo'; startGame(4242, ['阿橙', '小青'], 'normal', 0); window.__dbg.speed = 0;
    document.getElementById('hud').style.display = 'none'; document.getElementById('tpad').style.display = 'none';
    const me = W.p[0], P2 = W.p[1]; W.res = { wood: 9999, stone: 9999, steel: 9999, parts: 999 };
    const Bd = (x, y, L, id, d) => { me.x = x + 0.5; me.y = y + 0.5; me.L = L; doBuild(me, x, y, L, id, d); };
    // second storey walls on the open sides + third storey
    for (let x = 29; x <= 35; x++) Bd(x, 31, 1, x % 2 ? 3 : 8);
    for (let y = 26; y <= 30; y++) Bd(35, y, 1, y % 2 ? 3 : 8);
    for (let k = 0; k <= 4; k++) for (let x = 30; x <= 34; x++) Bd(x, 26 + k, 2, 5);
    for (let x = 29; x <= 35; x++) { Bd(x, 25, 2, 5); Bd(x, 31, 2, 5); } for (let y = 26; y <= 30; y++) { Bd(29, y, 2, 5); Bd(35, y, 2, 5); }
    for (let x = 29; x <= 35; x++) Bd(x, 25, 2, x % 3 ? 3 : 8);
    for (let y = 26; y <= 31; y++) Bd(29, y, 2, y % 3 ? 3 : 8);
    Bd(33, 30, 1, 6, 3); Bd(32, 28, 2, 10);
    for (let x = 26; x <= 38; x++) { if (x === 32) continue; Bd(x, 34, 0, 9); } for (let y = 23; y <= 33; y++) Bd(26, y, 0, 9);
    Bd(27, 22, 0, 10); Bd(37, 33, 0, 10);
    W.phase = 'night'; W.night = 6; W.spawnQ = [{ t: 999, k: 'walker', side: 1 }];
    me.x = 33.5; me.y = 31.6; me.L = 2; me.z = 2 * FH; me.zv = me.z; me.wpn = 2; me.owned[2] = 1;
    P2.x = 29.6; P2.y = 29.5; P2.L = 3; P2.z = 3 * FH; P2.zv = P2.z; P2.wpn = 3; P2.owned[3] = 1;
    const put = (k, x, y, f) => { const z = spawnZombie(k, 0); z.x = x; z.y = y; z.L = gAt(Math.floor(x), Math.floor(y)); z.z = surfZ(x, y, z.L); z.face = f; z.moving = true; z.anim = Math.random() * 4; return z; };
    const zs = [['walker', 31.6, 36.2, -1.6], ['walker', 33.2, 36.8, -1.7], ['runner', 30.1, 38.3, -1.3], ['brute', 34.6, 38.6, -2.2], ['walker', 28.3, 37.4, -1.1], ['walker', 36.5, 35.8, -2.4], ['spitter', 27.2, 40.2, -1.0], ['walker', 24.5, 31.8, 0.1], ['walker', 23.8, 29.2, 0.2], ['runner', 22.6, 27.5, 0.3], ['walker', 24.6, 25.8, 0.4], ['climber', 25.3, 34.1, -0.6], ['boss', 30.8, 41.6, -1.5], ['walker', 37.8, 38.8, -2.5], ['walker', 21.2, 32.6, 0]];
    for (const [k, x, y, f] of zs) put(k, x, y, f).atk = k === 'walker' && y < 36.5 ? 1 : 0;
    me.aimPt = { x: 31.6, y: 36.2, z: 0.7 }; me.aim = Math.atan2(36.2 - 31.6, 31.6 - 33.5);
    P2.aimPt = { x: 25.3, y: 34.1, z: 0.5 }; P2.aim = Math.atan2(34.1 - 29.5, 25.3 - 29.6);
    VIEW.auto = false; VIEW.L = 3; CUT_KEY = ''; CAM.zoom = 8.2; CAM.rot = 0; CAM.yaw = camYawTarget(); CAM.tx = 31; CAM.ty = 32.5; CAM.lookX = 0; CAM.lookY = 0;
    window.__dbg.dark = 0.9;
    const keep = () => {
      const [ax, ay] = w2s(31.6, 36.2, 0.7); INP.mx = ax; INP.my = ay; INP.mouseT = performance.now();
      CAM.lookX = 0; CAM.lookY = 0; W.p[0].x = 33.5; W.p[0].y = 31.6; W.p[1].x = 29.6; W.p[1].y = 29.5;
      RND.tracers = [];
      for (const q of [W.p[0], W.p[1]]) { const [sx, sy, sz] = shoulder(q); const mx = q.x + Math.cos(q.aim) * 0.55, my = q.y + Math.sin(q.aim) * 0.55; RND.tracers.push({ x: mx, y: my, z: sz, x2: q.aimPt.x, y2: q.aimPt.y, z2: q.aimPt.z, t: 0.02, life: 99 }); }
      RND.flashes = [W.p[0], W.p[1]].map(q => ({ x: q.x + Math.cos(q.aim) * 0.55, y: q.y + Math.sin(q.aim) * 0.55, z: q.z + 0.72, t: 0, life: 99, big: 1 }));
    };
    setInterval(keep, 16); keep();
    RND.parts = []; RND.floats = []; for (let k = 0; k < 4; k++) bloodFx(31.6, 36.2, 0.7, 6);
  });
  await p.evaluate(() => { window.__dbg.skipDraw = false; });
  await p.waitForTimeout(9000);
  await p.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:44px;top:30px;z-index:99;font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;pointer-events:none';
    d.innerHTML = '<div style="font-size:92px;font-weight:900;color:#f2e6cf;letter-spacing:.06em;line-height:1;text-shadow:0 0 26px rgba(226,72,61,.45),0 5px 0 #000">尸潮<span style="color:#e2483d">堡</span>垒</div><div style="margin-top:10px;font:600 17px Oswald,sans-serif;letter-spacing:.6em;color:#d9ccb6;text-shadow:0 2px 4px #000">DEAD TIDE</div><div style="margin-top:10px;font-size:19px;color:#efe3cc;letter-spacing:.12em;text-shadow:0 2px 6px #000">2.5D 盖楼守夜 · 双人合作</div>';
    document.body.appendChild(d);
  });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT + '/cover_raw.png' });
  await b.close();
})();
