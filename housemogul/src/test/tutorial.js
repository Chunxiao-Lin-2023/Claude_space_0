// Plays the beginner guide like a new player on easy/pure, using only the highlighted buttons. VP=phone for iPhone portrait.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
const vp = process.env.VP === 'phone' ? { width: 393, height: 852, hasTouch: true, isMobile: true } : { width: 1366, height: 820 };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const tag = process.env.VP || 'desk', shot = async n => p.screenshot({ path: `${OUT}/tut_${tag}_${n}.png` });
  const click = async sel => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); vp.hasTouch ? await l.tap() : await l.click(); await p.waitForTimeout(450); };
  const coach = () => p.evaluate(() => TUT.step + ' | ' + $('coachT').textContent);
  await p.goto('http://localhost:8765/housemogul/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction(() => window.__ready);
  await click('#newBtn'); await p.waitForTimeout(300);
  console.log(await coach()); await shot(1);
  let taps = 0;
  for (let k = 0; k < 40; k++) {
    const st = await p.evaluate(() => TUT.step); if (st === 4) break;
    const n = await p.locator('.pulse:visible').count(); if (!n) { console.log('no highlighted control at step', st); break; }
    if (k < 6) await shot('s' + k);
    await click('.pulse:visible'); taps++;
  }
  console.log('taps to finish guide:', taps, '|', await coach()); await shot(9);
  await click('#coachOk'); console.log('done', await p.evaluate(() => TUT.step + ' ' + localStorage.getItem('housemogul.tutDone') + ' cash ' + G.pl[0].cash.toFixed(1) + ' sells ' + G.pl[0].st.sells));
  // tap a house on the map -> quick card
  await p.evaluate(() => { const q = G.props.find(q => q.list && q.owner === -1 && q.kind !== 'mansion'); $('side').classList.remove('open'); focusTile(q.x + q.w / 2, q.y + q.h / 2, 1.2); window.__q = q.id; }); await p.waitForTimeout(1000);
  const pt = await p.evaluate(() => { const q = G.props[__q]; return w2s(...iso(q.x + q.w / 2, q.y + q.h / 2, 12)); });
  vp.hasTouch ? await p.touchscreen.tap(pt[0], pt[1]) : await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(500);
  console.log('map tap sel', await p.evaluate(() => STATE.sel + ' qc ' + !$('qc').classList.contains('hidden')));
  await shot('qc');
  await click('#qc [data-q="more"]'); await shot('detail');
  console.log('errs', errs); await b.close();
})();
