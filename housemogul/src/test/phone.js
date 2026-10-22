// iPhone portrait / landscape and iPad touch layouts. Serve repo root on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
const U = 'http://localhost:8765/housemogul/src/out/test.html';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [w, h, tag] of [[393, 852, 'p'], [375, 667, 'se'], [852, 393, 'l'], [852, 340, 'l2'], [1180, 820, 'ipad'], [820, 1180, 'ipadp']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 1000, deviceScaleFactor: 1, userAgent: UA });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(U); await p.waitForFunction(() => window.__ready); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/ph_${tag}_1title.png` });
    const nb = p.locator('#newBtn'); await nb.scrollIntoViewIfNeeded(); await nb.tap(); await p.waitForTimeout(700);
    await p.evaluate(() => { const q = G.props.filter(p => p.list && p.kind !== 'mansion').sort((a, b) => a.list.ask - b.list.ask)[0]; doAct(0, 'buy', { id: q.id }); endMonth(); renderUI(); });
    await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/ph_${tag}_2game.png` });
    const tabBtn = (await p.locator('#phoneTabs').isVisible()) ? '#phoneTabs button[data-t="list"]' : '#tabs button[data-t="list"]';
    await p.locator(tabBtn).tap(); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/ph_${tag}_3list.png` });
    await p.locator('#tabBody .item[data-id]').nth(1).tap(); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/ph_${tag}_4detail.png` });
    // tap on map to select something
    await p.evaluate(() => { selectProp(-1); $('side').classList.remove('open'); const q = G.props[G.mansion]; focusTile(q.x + 1.5, q.y + 1.5, 1); }); await p.waitForTimeout(1200);
    const box = await p.evaluate(() => { const q = G.props[G.mansion]; const s = w2s(...iso(q.x + 1.5, q.y + 1.5, 20)); return s; });
    await p.touchscreen.tap(box[0], box[1]); await p.waitForTimeout(700);
    console.log(tag, 'map tap sel', await p.evaluate(() => STATE.sel), 'mansion', await p.evaluate(() => G.mansion));
    await p.screenshot({ path: `${OUT}/ph_${tag}_5tap.png` });
    await p.evaluate(() => openMenu()); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/ph_${tag}_6menu.png` });
    await p.evaluate(() => { closeMenu(); G.over = { winner: 0, reason: 'mansion', m: 40 }; showEnd(); }); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/ph_${tag}_7end.png` });
    // overflow check: elements outside viewport
    const off = await p.evaluate(() => { const r = []; for (const el of document.querySelectorAll('#top > *, #bottom > *, #endBtn')) { const b = el.getBoundingClientRect(); if (b.width && (b.right > innerWidth + 1 || b.left < -1 || b.bottom > innerHeight + 1)) r.push(el.id || el.className); } return r; });
    console.log(tag, 'offscreen', off, 'errs', errs);
    await c.close();
  }
  await b.close();
})();
