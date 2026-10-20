// Touch devices: iPad + iPhone landscape/portrait. Moves with a CDP touch drag, opens build/pause/help, screenshots.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/lt';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [name, w, h] of [['ipad', 1180, 820], ['phoneL', 852, 393], ['phoneP', 393, 852], ['ipadP', 820, 1180]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: name.startsWith('phone'), deviceScaleFactor: 1, userAgent: name.startsWith('phone') ? UA : undefined });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/test.html'); await p.waitForFunction(() => window.__ready);
    await p.screenshot({ path: `${OUT}/t_${name}_title.png` });
    await p.tap('#soloBtn'); await p.waitForTimeout(600);
    const cdp = await c.newCDPSession(p);
    const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const x0 = await p.evaluate(() => W.p[0].x);
    await touch('touchStart', w * 0.2, h * 0.7); await touch('touchMove', w * 0.2 + 30, h * 0.7); await touch('touchMove', w * 0.2 + 60, h * 0.7);
    await p.waitForTimeout(700);
    const mid = await p.evaluate(() => ({ touch: INP.touch, r: W.p[0].inp.r, body: document.body.classList.contains('touch') }));
    await p.screenshot({ path: `${OUT}/t_${name}_move.png` });
    await touch('touchEnd');
    const x1 = await p.evaluate(() => W.p[0].x);
    // aim stick on the right fires
    const m0 = await p.evaluate(() => W.p[0].mag[1]);
    const cdp2 = cdp;
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: w * 0.75, y: h * 0.45, id: 2 }] });
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: w * 0.75 - 50, y: h * 0.45, id: 2 }] });
    await p.waitForTimeout(500);
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const m1 = await p.evaluate(() => W.p[0].mag[1] + ' aim ' + W.p[0].aim.toFixed(2));
    console.log(name, 'moved', (x1 - x0).toFixed(0), JSON.stringify(mid), 'fire mag', m0, '->', m1);
    await p.tap('#tBuild'); await p.waitForTimeout(400);
    // tap to build next to the player
    const bt = await p.evaluate(() => { const me = W.p[0]; me.sel = 1; const [sx, sy] = w2s(77.5 * T, 39.5 * T); return [sx, sy]; });
    await p.evaluate(() => { W.p[0].x = 76 * T; }); await p.waitForTimeout(300);
    const bt2 = await p.evaluate(() => w2s(78.5 * T, 39.5 * T));
    await p.touchscreen.tap(bt2[0], bt2[1]); await p.waitForTimeout(300);
    console.log(name, 'built by tap', await p.evaluate(() => tileAt(78, 39)));
    await p.screenshot({ path: `${OUT}/t_${name}_build.png` });
    await p.tap('#tBuild'); await p.waitForTimeout(200);
    await p.tap('#pauseBtn'); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/t_${name}_pause.png` });
    await p.tap('#pHelp'); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/t_${name}_help.png` });
    await p.tap('#helpClose'); await p.tap('#resumeBtn');
    await p.evaluate(() => { W.p[0].x = BENCH.x; }); await p.waitForTimeout(200); await p.tap('#tUse'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/t_${name}_craft.png` });
    console.log(name, 'craft open', await p.evaluate(() => !document.getElementById('craft').classList.contains('hidden')), 'errs', errs);
    await c.close();
  }
  await b.close();
})();
