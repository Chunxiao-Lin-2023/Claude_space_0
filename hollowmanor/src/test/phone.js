// iPhone portrait/landscape + iPad + desktop: title, in-game HUD, journal, pause. Reports HUD elements outside the viewport.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const views = JSON.parse(process.env.VIEWS || '[[393,852,1],[852,393,1]]');
  for (const [w, h, touch] of views) {
    const c = await b.newContext(touch ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA } : { viewport: { width: w, height: h } });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/test.html?solo=1&seed=5', { waitUntil: 'commit', timeout: 120000 });
    await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
    await p.evaluate(() => { window.__dbg.noBot = true; W.huntCD = 1e9; W.inv.push('ring', 'doll', 'fuse'); W.evFound.frost = 1; W.evFound.prints = 1; addLog('发现证据：❄ 霜痕', '#9fe8ff'); addLog('持灯者拾起了 💍 旧婚戒', '#9dff9d'); });
    await p.waitForTimeout(2500);
    const tag = `${w}x${h}`;
    const off = await p.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#hud .tl, #hud .tc, #hud .tr, #touchUI .tb, #prompt')) { if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue; const r = el.getBoundingClientRect(); if (r.width === 0) continue; if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) bad.push((el.id || el.className) + ' ' + [r.left, r.top, r.right, r.bottom].map(v => v | 0)); } return bad; });
    const overlap = await p.evaluate(() => { const a = document.querySelector('#hud .tc').getBoundingClientRect(), t = document.querySelector('#hud .tr').getBoundingClientRect(), l = document.querySelector('#hud .tl').getBoundingClientRect(); const ov = (x, y) => !(x.right <= y.left || y.right <= x.left || x.bottom <= y.top || y.bottom <= x.top); return { objVsRight: ov(a, t), objVsLeft: ov(a, l), leftVsRight: ov(l, t) }; });
    console.log(tag, 'offscreen', off, 'overlap', JSON.stringify(overlap));
    await p.screenshot({ path: `${OUT}/ph_${tag}_hud.png`, timeout: 120000 });
    await p.evaluate(() => openModal('mJournal')); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/ph_${tag}_journal.png`, timeout: 120000 });
    await p.evaluate(() => { closeModal(); openModal('mPause'); }); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/ph_${tag}_pause.png`, timeout: 120000 });
    await p.evaluate(() => { closeModal(); W = null; MENU_W = null; showScreen('title'); }); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/ph_${tag}_title.png`, timeout: 120000 });
    await p.evaluate(() => { NET.roles = ['L', 'S']; NET.code = 'AB3D'; STATE.mode = 'lobby'; showScreen('lobby'); }); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/ph_${tag}_lobby.png`, timeout: 120000 });
    console.log(tag, 'errs', errs.slice(0, 5));
    await c.close();
  }
  await b.close();
})();
