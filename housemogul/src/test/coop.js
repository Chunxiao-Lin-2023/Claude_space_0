// Two real clients over a local PeerJS server (node test/peerserver.js), repo root served on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/housemogul/src/out/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name) => { const c = await b.newContext({ viewport: { width: 1280, height: 780 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(U); await p.waitForFunction(() => window.__ready); await p.fill('#nameIn', name); return p; };
  const H = await mk('阿橙'), Gu = await mk('小青');
  await H.click('#modeSeg button[data-m="full"]');
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code); console.log('code', code);
  await Gu.fill('#codeIn', code); await Gu.click('#joinBtn');
  await H.waitForFunction(() => NET.guestName === '小青', null, { timeout: 30000 });
  await H.click('#lAiSeg button[data-ai="1"]'); await Gu.waitForTimeout(500);
  console.log('guest sees ai/preset', await Gu.evaluate(() => NET.ai + ' ' + NET.preset));
  console.log('start disabled before ready', await H.evaluate(() => $('lStart').disabled));
  await Gu.click('#lReady'); await H.waitForFunction(() => NET.ready, null, { timeout: 10000 });
  await H.screenshot({ path: OUT + '/c_lobby.png' }); await Gu.screenshot({ path: OUT + '/c_lobby_g.png' });
  await H.click('#lStart');
  await Gu.waitForFunction(() => STATE.mode === 'play' && G && G.pl.length === 3, null, { timeout: 20000 });
  console.log('guest ME', await Gu.evaluate(() => ME + ' names ' + G.pl.map(p => p.name).join(',') + ' opt ' + JSON.stringify(G.opt)));
  // guest buys a listing
  const id = await Gu.evaluate(() => G.props.filter(p => p.list && p.kind !== 'mansion').sort((a, b) => a.list.ask - b.list.ask)[0].id);
  await Gu.evaluate(id => { selectProp(id, true); }, id); await Gu.waitForTimeout(500);
  await Gu.click('#dInsp'); await Gu.waitForTimeout(500);
  await Gu.click('#dBuy'); await Gu.waitForTimeout(800);
  console.log('host sees owner', await H.evaluate(id => G.props[id].owner, id), 'guest sees', await Gu.evaluate(id => G.props[id].owner, id), 'insp', await H.evaluate(id => G.props[id].insp.join(','), id));
  // host tries to buy the same -> error
  const err = await H.evaluate(id => doAct(0, 'buy', { id }), id); console.log('host double-buy err:', err);
  // month: host ready, then guest ready
  await H.click('#endBtn'); await H.waitForTimeout(400);
  console.log('host waiting btn', await H.evaluate(() => $('endBtn').textContent), 'month', await H.evaluate(() => G.month));
  await Gu.screenshot({ path: OUT + '/c_guest_wait.png' });
  await Gu.keyboard.press('Enter'); await Gu.waitForTimeout(1200);
  console.log('after both ready month host/guest', await H.evaluate(() => G.month), await Gu.evaluate(() => G.month));
  await H.screenshot({ path: OUT + '/c_host.png' }); await Gu.screenshot({ path: OUT + '/c_guest.png' });
  // guest sells
  await Gu.evaluate(id => selectProp(id, true), id); await Gu.waitForTimeout(400); await Gu.click('#dSell'); await Gu.waitForTimeout(700);
  console.log('after guest sell owner', await H.evaluate(id => G.props[id].owner, id), 'guest cash', await Gu.evaluate(() => G.pl[1].cash.toFixed(1)));
  // size of state
  console.log('state json KB', await H.evaluate(() => (roundJSON(G).length / 1024).toFixed(1)));
  // guest disconnect & rejoin
  await Gu.context().close(); await H.waitForTimeout(2500);
  console.log('gone', await H.evaluate(() => G.pl[1].gone));
  await H.click('#endBtn'); await H.waitForTimeout(500); console.log('host advances alone', await H.evaluate(() => G.month));
  const G2 = await mk('小青'); await G2.fill('#codeIn', code); await G2.click('#joinBtn');
  await G2.waitForFunction(() => STATE.mode === 'play', null, { timeout: 20000 });
  console.log('rejoined ME', await G2.evaluate(() => ME + ' month ' + G.month), 'host gone flag', await H.evaluate(() => G.pl[1].gone));
  // win: give host money and buy mansion
  await H.evaluate(() => { G.pl[0].cash = 99999; act('buy', { id: G.mansion }); });
  await G2.waitForTimeout(2000);
  console.log('guest end screen', await G2.evaluate(() => STATE.mode + ' ' + $('eTitle').textContent));
  await G2.screenshot({ path: OUT + '/c_end_g.png' });
  console.log('errs host', H.errs, 'guest', Gu.errs, G2.errs);
  await b.close();
})();
