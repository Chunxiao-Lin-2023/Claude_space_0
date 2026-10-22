// Plays the beginner guide like a new player on easy/pure: screenshots each coach step.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
const vp = process.env.VP === 'phone' ? { width: 393, height: 852, hasTouch: true, isMobile: true } : { width: 1366, height: 820 };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const tag = process.env.VP || 'desk', shot = async n => p.screenshot({ path: `${OUT}/tut_${tag}_${n}.png` });
  const click = async sel => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); vp.hasTouch ? await l.tap() : await l.click(); await p.waitForTimeout(500); };
  await p.goto('http://localhost:8765/housemogul/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.__ready);
  console.log('defaults', await p.evaluate(() => SET.diff + ' ' + SET.preset));
  await shot(0);
  await click('#newBtn'); await p.waitForTimeout(400);
  console.log('step', await p.evaluate(() => TUT.step), await p.evaluate(() => $('coachT').textContent)); await shot(1);
  const tabSel = vp.hasTouch ? '#phoneTabs button[data-t="list"]' : '#tabs button[data-t="list"]';
  if (vp.hasTouch) await click(tabSel);
  await shot(2);
  await click('#tabBody .item.pulse');
  console.log('step', await p.evaluate(() => TUT.step), await p.evaluate(() => $('coachT').textContent)); await shot(3);
  await click('#dBuy');
  console.log('step', await p.evaluate(() => TUT.step), await p.evaluate(() => $('coachT').textContent)); await shot(4);
  for (let k = 0; k < 12; k++) {
    await click('#endBtn'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => TUT.step);
    if (st === 3) {
      const mine = vp.hasTouch ? '#phoneTabs button[data-t="mine"]' : '#tabs button[data-t="mine"]';
      if (k === 0) { console.log('step3', await p.evaluate(() => $('coachT').textContent)); await shot(5); }
      await click(mine); await click('#tabBody .item[data-id]');
      const txt = await p.evaluate(() => $('coachT').textContent); console.log('m', k, txt);
      if (await p.locator('#dSell.pulse').count()) { await shot(6); await click('#dSell'); break; }
      await p.evaluate(() => selectProp(-1)); if (vp.hasTouch) await p.evaluate(() => $('side').classList.remove('open'));
    }
  }
  console.log('final step', await p.evaluate(() => TUT.step), await p.evaluate(() => $('coachT').textContent)); await shot(7);
  await click('#coachOk'); console.log('done', await p.evaluate(() => TUT.step + ' ' + localStorage.getItem('housemogul.tutDone')));
  console.log('errs', errs); await b.close();
})();
