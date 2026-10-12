// iPad-style screenshots: menu (landscape + portrait), in-game touch HUD (right/left hand), boss + train HUD.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const [w, h, tag] of [[1180, 820, 'land'], [820, 1180, 'port']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/test.html?touch=1', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !document.getElementById('loading'), { timeout: 60000 }); await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/t_menu_${tag}.png` });
    if (tag === 'port') { await p.evaluate(() => document.getElementById('panel').scrollTop = 400); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/t_menu_port2.png` }); }
    for (const [mode, hand] of tag === 'land' ? [['gem', 'right'], ['boss', 'left'], ['train', 'right']] : [['solo', 'right']]) {
      await p.evaluate(([mode, hand]) => { SET.hand = hand; applySettings(); startLocal(mode); }, [mode, hand]);
      await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/t_${mode}_${tag}.png` });
      await p.evaluate(() => quitToMenu());
    }
    await c.close();
  }
  console.log('errs', errs.slice(0, 5));
  await b.close();
})();
