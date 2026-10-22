// Solo smoke: title, new game (pure + full), select/buy/sell, month advance, screenshots.
// run from repo root with `python3 -m http.server 8765`; NODE_PATH must reach playwright.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
const BASE = process.env.BASE || 'http://localhost:8765/housemogul/src/out/test.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: 1366, height: 820 } }); await c.route(/fonts\.(googleapis|gstatic)|unpkg|jsdelivr/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(BASE); await p.waitForFunction(() => window.__ready);
  await p.waitForTimeout(600); await p.screenshot({ path: OUT + '/01_title.png' });
  // full mode via preset
  await p.click('#modeSeg button[data-m="full"]'); await p.click('#aiSeg button[data-ai="1"]');
  await p.click('#newBtn'); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/02_game.png' });
  const info = await p.evaluate(() => ({ props: G.props.length, listed: G.props.filter(p => p.list).length, man: mansionPrice(), opt: G.opt }));
  console.log('full', JSON.stringify(info));
  // select cheapest listing and buy with loan
  const id = await p.evaluate(() => G.props.filter(p => p.list && p.kind !== 'mansion').sort((a, b) => a.list.ask - b.list.ask)[0].id);
  await p.evaluate(id => selectProp(id, true), id); await p.waitForTimeout(700);
  await p.screenshot({ path: OUT + '/03_detail.png' });
  await p.click('#dInsp'); await p.waitForTimeout(200);
  await p.click('#dLoan'); await p.waitForTimeout(500);
  console.log('owner', await p.evaluate(id => G.props[id].owner + ' loan ' + G.props[id].loan.toFixed(1) + ' cash ' + G.pl[0].cash.toFixed(1), id));
  await p.screenshot({ path: OUT + '/04_bought.png' });
  for (let k = 0; k < 6; k++) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
  await p.waitForTimeout(800);
  await p.click('#tabs button[data-t="mine"]'); await p.waitForTimeout(200);
  const id3 = await p.evaluate(() => { let q = ownedBy(0)[0]; if (!q) { q = G.props.filter(p => p.list && p.kind !== 'mansion').sort((a, b) => a.list.ask - b.list.ask)[0]; doAct(0, 'buy', { id: q.id, loan: true }); endMonth(); renderUI(); } return q.id; });
  await p.evaluate(id => selectProp(id, true), id3); await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/05_mine.png' });
  await p.click('#dSell'); await p.waitForTimeout(500);
  console.log('after sell', await p.evaluate(() => G.month + ' cash ' + G.pl[0].cash.toFixed(1) + ' ai net ' + netWorth(1).toFixed(0) + ' news ' + G.news.length));
  await p.click('#tabs button[data-t="mkt"]'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/06_mkt.png' });
  await p.click('#tabs button[data-t="news"]'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/07_news.png' });
  // zoom in on map
  await p.evaluate(() => { selectProp(-1); focusTile(9, 9, 1.6); }); await p.waitForTimeout(900); await p.screenshot({ path: OUT + '/08_zoom.png' });
  await p.evaluate(() => { focusTile(18, 17, 1.8); }); await p.waitForTimeout(900); await p.screenshot({ path: OUT + '/09_mansion.png' });
  // pure mode
  await p.evaluate(() => toTitle()); await p.click('#modeSeg button[data-m="pure"]'); await p.click('#aiSeg button[data-ai="0"]'); await p.click('#newBtn'); await p.waitForTimeout(500);
  const id2 = await p.evaluate(() => G.props.filter(p => p.list && p.kind !== 'mansion')[0].id);
  await p.evaluate(id => selectProp(id, true), id2); await p.waitForTimeout(600); await p.screenshot({ path: OUT + '/10_pure.png' });
  console.log('pure opt', await p.evaluate(() => JSON.stringify(G.opt) + ' insp btn ' + !!document.getElementById('dInsp') + ' loan btn ' + !!document.getElementById('dLoan')));
  // custom
  await p.evaluate(() => toTitle()); await p.click('#modeSeg button[data-m="custom"]'); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/11_custom.png' });
  console.log('errs', errs);
  await b.close();
})();
