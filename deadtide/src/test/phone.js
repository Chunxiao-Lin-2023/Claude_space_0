// Touch devices: iPad + iPhone landscape/portrait. Move by CDP touch drag, fire with the aim stick, tap-build, view buttons, screenshots.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, w, h] of [['ipad', 1180, 820], ['phoneL', 852, 393], ['phoneP', 393, 852]]) {
    const phone = name.startsWith('phone');
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: phone, deviceScaleFactor: 1, userAgent: phone ? UA : undefined });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.tap('#soloBtn'); await p.evaluate(() => { window.__dbg.skipDraw = true; }); await p.waitForFunction(() => W && W.t > 1, null, { timeout: 90000 });
    const shot = async n => { await p.evaluate(() => { window.__dbg.skipDraw = false; window.__dbg.speed = 0; }); await p.waitForTimeout(2600); await p.screenshot({ path: `${OUT}/t_${name}_${n}.png` }); await p.evaluate(() => { window.__dbg.skipDraw = true; window.__dbg.speed = 1; }); await p.waitForTimeout(300); };
    const cdp = await c.newCDPSession(p);
    const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
    const x0 = await p.evaluate(() => [W.p[0].x, W.p[0].y]);
    await tch('touchStart', [{ x: w * 0.2, y: h * 0.75, id: 1 }]); await tch('touchMove', [{ x: w * 0.2, y: h * 0.75 - 70, id: 1 }]);
    await simWait(0.6);
    const mid = await p.evaluate(() => ({ touch: INP.touch, mx: W.p[0].inp.mx.toFixed(2), my: W.p[0].inp.my.toFixed(2) }));
    await tch('touchEnd', []);
    const x1 = await p.evaluate(() => [W.p[0].x, W.p[0].y]);
    const m0 = await p.evaluate(() => W.p[0].mag[1]);
    await tch('touchStart', [{ x: w * 0.75, y: h * 0.45, id: 2 }]); await tch('touchMove', [{ x: w * 0.75 - 60, y: h * 0.45, id: 2 }]);
    await simWait(0.4); await tch('touchEnd', []);
    const m1 = await p.evaluate(() => W.p[0].mag[1]);
    console.log(name, 'moved', Math.hypot(x1[0] - x0[0], x1[1] - x0[1]).toFixed(2), JSON.stringify(mid), 'fire mag', m0, '->', m1);
    await p.tap('#tBuild'); await simWait(0.2);
    // place a wall 2 tiles east of the player by tapping its screen position
    const tgt = await p.evaluate(() => { const me = W.p[0]; me.x = 37.5; me.y = 28.5; me.L = 0; me.sel = 1; const c = [38, 30]; const [sx, sy] = w2s(c[0] + 0.5, c[1] + 0.5, 0); return [sx, sy]; });
    await simWait(0.3);
    const tgt2 = await p.evaluate(() => w2s(38.5, 30.5, 0));
    await p.touchscreen.tap(tgt2[0], tgt2[1]); await simWait(0.3);
    console.log(name, 'built by tap', await p.evaluate(() => W.blk[ci(38, 30, 0)]), 'at', tgt2.map(v => v | 0).join(','));
    await shot('build');
    await p.tap('#tBuild'); await simWait(0.2);
    await p.tap('#vZin'); await p.tap('#vRr'); await p.tap('#vUp'); await simWait(0.3);
    console.log(name, 'view', await p.evaluate(() => [CAM.zoom.toFixed(1), CAM.rot, VIEW.auto, VIEW.L].join(',')));
    await shot('view');
    await p.tap('#vAuto'); await p.tap('#pauseBtn'); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/t_${name}_pause.png` });
    await p.tap('#resumeBtn');
    await p.evaluate(() => { W.p[0].x = W.bench.x + 1.5; W.p[0].y = W.bench.y + 0.5; W.p[0].L = 0; }); await simWait(0.2); await p.tap('#tUse'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/t_${name}_craft.png` });
    console.log(name, 'craft open', await p.evaluate(() => !document.getElementById('craft').classList.contains('hidden')), 'errs', errs, await p.evaluate(() => window.__dbg.err || ''));
    await c.close();
  }
  await b.close();
})();
