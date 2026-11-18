// Auto quality: slow frames step the level down (pixel ratio, then shadows); the pause menu cycles it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.evaluate(() => $('soloBtn').click()); await p.waitForFunction(() => W && W.t > 0.5);
  const st = () => p.evaluate(() => ({ lv: QUAL.lv, qa: SET.qa, pr: RENDER.getPixelRatio(), shadow: OBJ.sun.castShadow }));
  console.log('start', JSON.stringify(await st()));
  await p.evaluate(() => { window.__dbg.autoQ = true; window.__dbg.god = true; QUAL.t = 6; });
  await p.waitForFunction(() => QUAL.lv >= 1, null, { timeout: 120000 }); console.log('slow -> ', JSON.stringify(await st()), await p.evaluate(() => document.getElementById('toast').textContent));
  await p.waitForFunction(() => QUAL.lv >= 2, null, { timeout: 120000 }); console.log('slower -> ', JSON.stringify(await st()));
  await p.evaluate(() => { window.__dbg.autoQ = false; }); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const lab = []; for (let k = 0; k < 4; k++) { lab.push(await p.evaluate(() => document.getElementById('pQual').textContent)); await p.click('#pQual'); }
  console.log('menu cycle', lab.join(' → '), JSON.stringify(await st()));
  console.log('remembered', await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('deadtide.set')))));
  console.log('errs', errs); await b.close();
})();
