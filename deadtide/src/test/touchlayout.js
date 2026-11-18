// Touch HUD layout on iPad / iPhone, landscape and portrait: screenshots + button rects (overlaps, thumb reach, sizes).
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [vp, w, h] of (process.env.VPS ? JSON.parse(process.env.VPS) : [['ipadL', 1180, 820], ['ipadP', 820, 1180], ['phoneL', 852, 393], ['phoneP', 393, 852]])) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, userAgent: UA }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => { NETROLE = 'solo'; startGame(4242, ['甲'], 'normal', 0, 'escape', 'town'); window.__dbg.god = true; const me = W.p[0]; me.owned = WPN.map(() => 1); me.ammo = WPN.map(() => 30); me.nades = 2; me.meds = 1; });
    const cdp = await c.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: w * 0.55, y: h * 0.4, id: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(3000);
    const rects = await p.evaluate(() => { const out = {}; document.querySelectorAll('#tctl button, #tctl .tb, #hud button, #stickL, #wbar, #mini, #objp, #tasks, #hTL, #hTR').forEach(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (!r.width || cs.display === 'none' || cs.visibility === 'hidden' || e.offsetParent === null) return; out[e.id || e.className.split(' ')[0] + ':' + (e.textContent || '').trim().slice(0, 6)] = [r.left | 0, r.top | 0, r.width | 0, r.height | 0]; }); return out; });
    console.log(vp, JSON.stringify(rects));
    await p.screenshot({ path: OUT + '/tl_' + vp + '.png' });
    await p.evaluate(() => { toggleBuild && toggleBuild(true); }).catch(() => {}); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + '/tl_' + vp + '_build.png' });
    console.log(vp, 'errs', errs.slice(0, 2)); await c.close();
  }
  await b.close();
})();
