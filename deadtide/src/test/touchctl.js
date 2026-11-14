// Touch controls: fire button (hold = auto-aim, drag = aim), contextual use/med buttons, weapon chip, pinch zoom, build layer buttons.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
require('fs').mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!cond) fails++; };
  for (const [vp, w, h] of [['phoneL', 852, 393], ['phoneP', 393, 852]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.tap('#soloBtn'); await p.evaluate(() => { window.__dbg.skipDraw = true; window.__dbg.god = true; W.clock = 999; }); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
    const cdp = await c.newCDPSession(p);
    const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
    const center = async sel => p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width]; }, sel);
    // 1. hold fire (no drag) auto-aims at a zombie behind the player
    await p.evaluate(() => { const me = W.p[0]; me.x = 32.5; me.y = 34.5; me.L = 0; me.aim = 0; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = 28.5; z.y = 34.5; z.L = 0; z.z = surfZ(z.x, z.y, 0); window.__z = z; });
    const [fx, fy, fw] = await center('#tFire');
    await tch('touchStart', [{ x: fx, y: fy, id: 5 }]); await simWait(2.5); await tch('touchEnd', []);
    ok(vp + ' hold fire kills a zombie behind you', await p.evaluate(() => window.__z.hp <= 0), 'kills ' + await p.evaluate(() => W.kills));
    // 2. drag the fire stick to aim north
    await p.evaluate(() => { const me = W.p[0]; me.aimPt = null; });
    await tch('touchStart', [{ x: fx, y: fy, id: 6 }]); await tch('touchMove', [{ x: fx, y: fy - fw * 0.45, id: 6 }]); await simWait(0.4);
    const dragAim = await p.evaluate(() => { const [ux, uy] = camFwd(); return Math.cos(W.p[0].aim) * ux + Math.sin(W.p[0].aim) * uy; });
    const firing = await p.evaluate(() => W.p[0].inp.fire);
    await tch('touchEnd', []);
    ok(vp + ' drag fire aims screen-up and fires', dragAim > 0.85 && firing === 1, 'dot ' + dragAim.toFixed(2));
    // 3. move stick on the left while holding fire (two thumbs)
    const p0 = await p.evaluate(() => [W.p[0].x, W.p[0].y]);
    await tch('touchStart', [{ x: w * 0.2, y: h * 0.75, id: 1 }, { x: fx, y: fy, id: 7 }]);
    await tch('touchMove', [{ x: w * 0.2 + 60, y: h * 0.75, id: 1 }, { x: fx, y: fy, id: 7 }]); await simWait(0.6);
    const both = await p.evaluate(() => W.p[0].inp.fire);
    await tch('touchEnd', []);
    const p1 = await p.evaluate(() => [W.p[0].x, W.p[0].y]);
    ok(vp + ' move + fire together', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.8 && both === 1);
    // 4. contextual use button next to a tree
    const tr = await p.evaluate(() => { for (let i = 0; i < NC; i++) if (W.blk[i] === 22) { const x = cx_(i), y = cy_(i), L = cl_(i); const f = DIRS.map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => standable(a, b, L, 'p')); if (f) { const me = W.p[0]; me.x = f[0] + 0.5; me.y = f[1] + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); return i; } } return -1; });
    await simWait(0.3); await p.waitForTimeout(250);
    const useVis = await p.evaluate(() => !document.getElementById('tUse').classList.contains('hidden') && document.getElementById('tUse').textContent);
    const w0 = await p.evaluate(() => W.res.wood);
    const [ux, uy] = await center('#tUse');
    await tch('touchStart', [{ x: ux, y: uy, id: 8 }]); await simWait(2.4); await tch('touchEnd', []);
    ok(vp + ' use button appears and chops by holding', !!useVis && (await p.evaluate(() => W.res.wood)) > w0, 'label ' + useVis);
    await p.screenshot({ path: `${OUT}/tc_${vp}_use.png` });
    // 5. med button only when hurt
    const medHidden = await p.evaluate(() => document.getElementById('tMed').classList.contains('hidden'));
    await p.evaluate(() => { W.p[0].hp = 40; }); await p.waitForTimeout(250);
    const medShown = await p.evaluate(() => !document.getElementById('tMed').classList.contains('hidden'));
    await p.tap('#tMed'); await simWait(1.3);
    ok(vp + ' med button shows when hurt and heals', medHidden && medShown && (await p.evaluate(() => W.p[0].hp)) > 40);
    // 6. weapon chip cycles
    const wp0 = await p.evaluate(() => W.p[0].wpn); await p.tap('#tWpn'); await simWait(0.2);
    ok(vp + ' weapon chip switches weapon', (await p.evaluate(() => W.p[0].wpn)) !== wp0);
    // 7. pinch to zoom
    const z0 = await p.evaluate(() => CAM.zoom);
    await tch('touchStart', [{ x: w * 0.4, y: h * 0.4, id: 11 }]); await tch('touchStart', [{ x: w * 0.4, y: h * 0.4, id: 11 }, { x: w * 0.5, y: h * 0.45, id: 12 }]);
    await tch('touchMove', [{ x: w * 0.3, y: h * 0.35, id: 11 }, { x: w * 0.62, y: h * 0.5, id: 12 }]); await p.waitForTimeout(100); await tch('touchEnd', []);
    const z1 = await p.evaluate(() => CAM.zoom);
    ok(vp + ' pinch zooms in', z1 < z0 - 0.5, z0.toFixed(1) + ' -> ' + z1.toFixed(1));
    // 8. build mode: layer buttons + fire cluster hidden
    await p.tap('#tBuild'); await p.waitForTimeout(200);
    const fireHid = await p.evaluate(() => getComputedStyle(document.getElementById('tFire')).display === 'none' && getComputedStyle(document.getElementById('tLay')).display !== 'none');
    await p.tap('#tLUp'); await p.waitForTimeout(150);
    ok(vp + ' build mode swaps fire cluster for layer buttons', fireHid && (await p.evaluate(() => buildL())) === 1);
    await p.tap('#tBuild'); await p.evaluate(() => viewAuto());
    // 9. view panel toggle
    const v0 = await p.evaluate(() => getComputedStyle(document.getElementById('viewBox')).display);
    await p.tap('#vToggle'); const v1 = await p.evaluate(() => getComputedStyle(document.getElementById('viewBox')).display);
    ok(vp + ' 视角 toggles the view panel', v0 === 'none' && v1 !== 'none');
    await p.evaluate(() => { window.__dbg.skipDraw = false; window.__dbg.speed = 0; }); await p.waitForTimeout(2600);
    await p.screenshot({ path: `${OUT}/tc_${vp}_view.png` });
    ok(vp + ' no page errors', !errs.length, errs.join(' | '));
    await c.close();
  }
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
