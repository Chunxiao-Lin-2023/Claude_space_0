// Layout check on iPhone portrait / landscape and iPad: HUD in view, quick card, detail, menu, end screen.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
const U = 'http://localhost:8765/housemogul/src/out/test.html';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [w, h, tag] of [[393, 852, 'p'], [375, 667, 'se'], [852, 393, 'l'], [852, 340, 'l2'], [1180, 820, 'ipad'], [820, 1180, 'ipadp']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 1000, deviceScaleFactor: 1, userAgent: UA });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(U); await p.waitForFunction(() => window.__ready); await p.evaluate(() => localStorage.setItem('housemogul.tutDone', 'true')); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/ph_${tag}_1title.png` });
    const nb = p.locator('#newBtn'); await nb.scrollIntoViewIfNeeded(); await nb.tap(); await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/ph_${tag}_2game.png` });
    // tap a price tag on screen
    const xy = await p.evaluate(() => { const r = RND.tagHit.find(r => G.props[r.id].list && G.props[r.id].kind !== 'mansion' && r.x > 20 && r.x < innerWidth - 80 && r.y > 90 && r.y < innerHeight - 200); return r ? [r.x + r.w / 2, r.y + r.h / 2, r.id] : null; });
    if (xy) { await p.touchscreen.tap(xy[0], xy[1]); await p.waitForTimeout(500); }
    console.log(tag, 'tag tap ->', await p.evaluate(() => STATE.sel), xy && xy[2]);
    await p.screenshot({ path: `${OUT}/ph_${tag}_3card.png` });
    if (await p.locator('#qcB:not([disabled])').count()) await p.locator('#qcB').tap(); await p.waitForTimeout(400);
    await p.locator('#mineBtn').tap(); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/ph_${tag}_4mine.png` });
    await p.locator('#qc [data-q="more"]').tap().catch(() => {}); await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/ph_${tag}_5detail.png` });
    await p.evaluate(() => { STATE.detail = false; selectProp(-1); openMenu(); }); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/ph_${tag}_6menu.png` });
    await p.evaluate(() => { closeMenu(); G.over = { winner: 0, reason: 'mansion', t: 300 }; showEnd(); }); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/ph_${tag}_7end.png` });
    const off = await p.evaluate(() => { const r = []; for (const el of document.querySelectorAll('#top > *, #bottom > *')) { const b = el.getBoundingClientRect(); if (b.width && (b.right > innerWidth + 1 || b.left < -1 || b.bottom > innerHeight + 1)) r.push(el.id || el.className); } return r; });
    console.log(tag, 'offscreen', off, 'errs', errs);
    await c.close();
  }
  await b.close();
})();
