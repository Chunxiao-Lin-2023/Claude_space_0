// Hub cover: staged night scene + title, saved as covers/lasttower.webp (800x450) by the python step.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/lt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => {
    NETROLE = 'solo'; startGame(4242, ['阿橙', '小青'], 'normal', 0);
    document.getElementById('hud').style.display = 'none';
    const me = W.p[0], P2 = W.p[1]; W.res = { wood: 999, stone: 999, steel: 999, parts: 999 };
    me.x = 70 * T; me.y = 36 * T;
    const B = (x, y, id) => { const t = W.tiles[ix(x, y)]; if (t) return; me.x = x * T; me.y = (y + 3) * T; doBuild(me, x, y, id); };
    // third floor
    for (let k = 0; k <= 5; k++) { B(64 + k, 32, 4); B(75 - k, 32, 4); }
    for (const c of [64, 75]) { B(c, 31, 3); B(c, 30, 8); B(c, 29, 3); }
    for (let r = 35; r >= 32; r--) { const i = ix(72, r); if (W.tiles[i] && W.tiles[i] !== 6) W.tiles[i] = 0; B(72, r, 6); }
    B(68, 31, 10); B(70, 28, 4);
    for (let c = 64; c <= 75; c++) if (!tileAt(c, 28)) B(c, 28, 5);
    // outer barricade + wire
    B(60, 39, 2); B(60, 38, 2); B(58, 39, 9); B(57, 39, 9); B(79, 39, 1); B(79, 38, 1); B(81, 39, 9);
    W.phase = 'night'; W.night = 6; W.spawnQ = [{ t: 999, k: 'walker', side: 1 }];
    me.x = 65.5 * T; me.y = 32 * T; me.wpn = 2; me.owned[2] = 1; me.aim = Math.PI + 0.32; me.face = -1;
    P2.x = 74.4 * T; P2.y = 28 * T; P2.wpn = 3; P2.owned[3] = 1; P2.aim = -0.25; P2.face = 1;
    const put = (k, x, f) => { const z = spawnZombie(k, f < 0 ? 1 : -1); z.x = x * T; z.face = f; z.vx = f * 40; z.anim = Math.random() * 3; return z; };
    put('walker', 59.2, 1); put('walker', 56.5, 1); put('runner', 53, 1); put('brute', 50.5, 1); put('spitter', 46, 1); put('walker', 61.6, 1).atk = 9;
    const r = put('walker', 61.4, 1); r.y = GY - 1.82 * T; r.ride = 1; 
    const cl = put('climber', 63.6, 1); cl.climbing = 'wall'; cl.y = 34.5 * T;
    put('walker', 82, -1); put('walker', 84.5, -1); put('climber', 87, -1); put('walker', 89, -1); put('boss', 94, -1);
    window.__dbg.speed = 0; window.__dbg.dark = 0.7; window.__dbg.cover = 1; SET.zoom = 1; W.zs.forEach(z => z.hitT = 0);
    CAM.lookX = 0; CAM.lookY = 0;
  });
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const me = W.p[0], P2 = W.p[1];
    window.__frz = true;
    const keep = () => {
      CAM.x = 70.5 * T; CAM.y = 33.2 * T; CAM.lookX = 0; CAM.lookY = 0;
      const [x, y] = muzzle(me); RND.tracers = [{ x, y, x2: 59.2 * T, y2: GY - 1.5 * T, t: 0, life: 99 }, { x: x, y: y + 3, x2: 61.4 * T, y2: GY - 3.2 * T, t: 0, life: 99 }];
      const [x2, y2] = muzzle(P2); RND.tracers.push({ x: x2, y: y2, x2: 94 * T, y2: GY - 2.6 * T, t: 0, life: 99, sn: 1 });
      RND.flashes = [{ x, y, a: me.aim, t: 0, life: 99 }, { x: x2, y: y2, a: P2.aim, t: 0, life: 99, big: 1 }];
    };
    setInterval(keep, 16); keep();
    for (let k = 0; k < 4; k++) blood(59.2 * T, GY - 1.5 * T, 6, 0, 1);
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:44px;top:34px;z-index:99;font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;pointer-events:none';
    d.innerHTML = '<div style="font-size:92px;font-weight:900;color:#f2e6cf;letter-spacing:.06em;line-height:1;text-shadow:0 0 26px rgba(226,72,61,.45),0 5px 0 #000">尸夜<span style="color:#e2483d">孤</span>楼</div><div style="margin-top:10px;font:600 17px Oswald,sans-serif;letter-spacing:.6em;color:#bcae98">LAST TOWER</div><div style="margin-top:10px;font-size:19px;color:#e6d8bf;letter-spacing:.12em;text-shadow:0 2px 6px #000">盖楼 · 守夜 · 双人合作</div>';
    document.body.appendChild(d);
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/cover_raw.png' });
  await b.close();
})();
