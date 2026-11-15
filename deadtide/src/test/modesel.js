// Mode / map picker on the title screen (desktop and phone), the choice reaches the game; old saves and labels.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  for (const [vp, w, h, touch] of [['desk', 1200, 800, false], ['phone', 852, 393, true]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => { localStorage.removeItem('deadtide.save'); SET.mode = 'classic'; SET.map = ''; saveSet(); uiModeLbl(); });
    await p.click('#modeBtn'); await p.waitForTimeout(500);
    const n = await p.evaluate(() => [document.querySelectorAll('#mGrid .mcard').length, document.querySelectorAll('#mapGrid .mapcard').length]);
    check(vp + ': picker shows 6 modes and 6 maps', n[0] === 6 && n[1] === 6, JSON.stringify(n));
    await p.click('#mGrid .mcard[data-m="nests"]'); await p.waitForTimeout(300);
    check(vp + ': choosing a mode picks its recommended map', await p.evaluate(() => SET.mode === 'nests' && curMap() === 'forest'));
    await p.click('#mapGrid .mapcard[data-p="snow"]'); await p.waitForTimeout(2500);
    check(vp + ': choosing a map', await p.evaluate(() => curMap() === 'snow'));
    check(vp + ': map thumbnails drawn', await p.evaluate(() => Object.keys(MAPTHUMB).length >= 6), await p.evaluate(() => Object.keys(MAPTHUMB).join(',')));
    await p.screenshot({ path: OUT + '/modesel_' + vp + '.png' });
    await p.click('#msOk'); await p.waitForTimeout(400);
    check(vp + ': title button shows the choice', /摧毁尸巢/.test(await p.evaluate(() => document.getElementById('modeBtn').textContent)) && /雪原/.test(await p.evaluate(() => document.getElementById('modeBtn').textContent)));
    await p.click('#soloBtn'); await p.waitForFunction(() => W && !W.demo && W.t > 0.3);
    check(vp + ': the game starts in that mode on that map', await p.evaluate(() => W.mode === 'nests' && W.map === 'snow' && W.obj.nests.length === 5));
    await p.evaluate(() => { saveGame(false); }); const lab = await p.evaluate(() => saveLabel(loadSave()));
    check(vp + ': save label names the mode and map', /摧毁尸巢/.test(lab) && /雪原/.test(lab), lab);
    check(vp + ': no page errors', !errs.length, errs.slice(0, 3).join(' | ')); await c.close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
