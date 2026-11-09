// Two real clients over a local PeerJS server (node test/peerserver.js), repo root served on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/prophunt/src/out/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name) => { const c = await b.newContext({ viewport: { width: 1100, height: 720 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(U); await p.waitForFunction(() => window.__ready); await p.fill('#nameIn', name); return p; };
  const H = await mk('阿橙'), Gu = await mk('小青');
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code); console.log('code', code);
  await Gu.fill('#codeIn', code); await Gu.click('#joinBtn');
  await H.waitForFunction(() => NET.guestName === '小青', null, { timeout: 30000 });
  await H.click('#lFirstSeg button[data-f="guest"]'); await Gu.waitForTimeout(400);
  await H.screenshot({ path: OUT + '/c_lobby_h.png' }); await Gu.screenshot({ path: OUT + '/c_lobby_g.png' });
  await H.click('#lStart');
  await Gu.waitForFunction(() => STATE.mode === 'play' && G && G.phase === 'hide', null, { timeout: 20000 });
  console.log('guest ME', await Gu.evaluate(() => ME + ' hider ' + G.hider + ' snap ' + !!(NET.snap && NET.snap.open)));
  // guest (hider) walks then disguises next to a chair / anything
  await Gu.keyboard.down('a'); await Gu.waitForTimeout(800); await Gu.keyboard.up('a');
  await Gu.evaluate(() => { const p = G.pl[ME]; const it = MAP.items.filter(i => i.room === 4 && !i.flat)[0]; p.x = it.x; p.y = it.y; for (const [ox, oy] of OFFS.map(([a, b]) => [a * 2.5, b * 2.5])) { if (!blocked([it.x + ox - .3, it.y + oy - .3, it.x + ox + .3, it.y + oy + .3], ME)) { p.x = it.x + ox; p.y = it.y + oy; break; } } });
  await Gu.waitForTimeout(300); await Gu.screenshot({ path: OUT + '/c_hider_human.png' });
  await Gu.keyboard.press('e'); await Gu.waitForTimeout(600);
  console.log('guest dg', await Gu.evaluate(() => JSON.stringify(G.pl[ME].dg)), 'host sees', await H.evaluate(() => JSON.stringify(G.pl[1].dg) + ' at ' + G.pl[1].x.toFixed(2)));
  await Gu.keyboard.press('r'); await Gu.waitForTimeout(400);
  await Gu.screenshot({ path: OUT + '/c_hider_disg.png' }); await H.screenshot({ path: OUT + '/c_seeker_blind.png' });
  // skip the countdown
  await H.evaluate(() => { G.t = .1; }); await Gu.waitForFunction(() => G.phase === 'seek', null, { timeout: 5000 });
  await Gu.waitForTimeout(500); console.log('guest still disguised', await Gu.evaluate(() => !!G.pl[ME].dg));
  // taunt from guest
  await Gu.keyboard.press('t'); await H.waitForTimeout(800);
  console.log('host t after taunt', await H.evaluate(() => G.t.toFixed(1) + ' cd ' + G.tauntCD.toFixed(1)));
  await H.screenshot({ path: OUT + '/c_seeker_taunt.png' });
  // host walks next to the hider and knocks the hider
  await H.evaluate(() => { const h = G.pl[1], s = G.pl[0]; for (const [ox, oy] of OFFS.map(([a, b]) => [a * 2.2, b * 2.2])) { const x = h.x + ox, y = h.y + oy; if (Math.hypot(ox, oy) > .9 && !blocked([x - .26, y - .26, x + .26, y + .26], 0)) { s.x = x; s.y = y; break; } } });
  await H.waitForTimeout(700); await H.screenshot({ path: OUT + '/c_seeker_near.png' });
  const vis = await H.evaluate(() => hiderSeen()); console.log('host sees hider', vis);
  console.log('knock ret', await H.evaluate(() => (G.kcd = 0, doAct(0, 'knock', { id: -1 })) + ' kn ' + G.kn + ' seen ' + hiderSeen() + ' d ' + distFp(G.pl[0].x, G.pl[0].y, plBox(G.pl[1], G.pl[1].x, G.pl[1].y)).toFixed(2))); await Gu.waitForTimeout(2600);
  console.log('end host', await H.evaluate(() => G.phase + ' ' + JSON.stringify(G.res) + ' ' + G.score), 'guest', await Gu.evaluate(() => G.phase + ' ' + G.score + ' endScr ' + !$('endScr').classList.contains('hidden')));
  await Gu.screenshot({ path: OUT + '/c_end_g.png' });
  await H.click('#eNext');
  await Gu.waitForFunction(() => G.round === 2 && STATE.mode === 'play', null, { timeout: 10000 });
  console.log('round2 hider', await Gu.evaluate(() => G.hider + ' me ' + ME + ' phase ' + G.phase), 'blind visible guest', await Gu.evaluate(() => !$('blind').classList.contains('hidden')));
  await H.waitForTimeout(500); await H.screenshot({ path: OUT + '/c_r2_host_hider.png' });
  console.log('errs host', H.errs, 'guest', Gu.errs);
  await b.close();
})();
