// Turn mode over the network + iPad touch smoke. Needs test/peerserver.js and repo root on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/prophunt/src/out/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name, opt) => { const c = await b.newContext(opt || { viewport: { width: 1100, height: 720 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(U); await p.waitForFunction(() => window.__ready); await p.fill('#nameIn', name); return p; };
  const H = await mk('阿橙'), Gu = await mk('小青', { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true });
  await H.click('#modeSeg button[data-m="turn"]');
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code);
  await Gu.fill('#codeIn', code); await Gu.tap('#joinBtn');
  await H.waitForFunction(() => NET.guestName === '小青', null, { timeout: 30000 });
  await H.click('#lFirstSeg button[data-f="guest"]'); await Gu.waitForTimeout(300);
  console.log('guest lobby mode', await Gu.evaluate(() => NET.lobby.mode + ' ' + $('lModeDesc').textContent.slice(0, 6)));
  await H.click('#lStart');
  await Gu.waitForFunction(() => STATE.mode === 'play' && G && G.phase === 'place', null, { timeout: 20000 });
  await Gu.waitForTimeout(600);
  console.log('host curtain', await H.evaluate(() => !$('curtain').classList.contains('hidden')));
  // guest taps a chair-ish item on screen to choose a form, then taps floor next to it
  const tgt = await Gu.evaluate(() => { const o = DRAWN.find(d => d.kind === 'item' && d.it.k === 'chair') || DRAWN.find(d => d.kind === 'item'); const f = o.faces[o.faces.length - 1].p; const cx = f.reduce((s, q) => s + q[0], 0) / f.length, cy = f.reduce((s, q) => s + q[1], 0) / f.length; return { cx, cy, id: o.it.id, k: o.it.k }; });
  await Gu.touchscreen.tap(tgt.cx, tgt.cy); await Gu.waitForTimeout(300);
  console.log('form', await Gu.evaluate(() => JSON.stringify(STATE.form)), 'wanted', tgt.k);
  const spot = await Gu.evaluate(() => { const sp = aiChooseSpot(ME, {}); STATE.form = { k: sp.k, v: sp.v }; STATE.ghostR = sp.r; const [sx, sy] = P(sp.x, sp.y, 0); return { sx, sy, sp }; });
  await Gu.touchscreen.tap(spot.sx, spot.sy); await Gu.waitForTimeout(300);
  console.log('pend', await Gu.evaluate(() => JSON.stringify(STATE.pend)));
  await Gu.screenshot({ path: OUT + '/t_place_g.png' });
  let ok = await Gu.evaluate(() => !!STATE.pend && !STATE.pend.err);
  if (!ok) await Gu.evaluate(sp => { STATE.pend = { ...sp }; validatePend(); }, spot.sp);
  await Gu.tap('#tGo'); await H.waitForFunction(() => G.phase === 'seek', null, { timeout: 5000 });
  console.log('placed; host sees hider dg', await H.evaluate(() => JSON.stringify(G.pl[1].dg)));
  await H.waitForTimeout(400); await H.screenshot({ path: OUT + '/t_seek_h.png' });
  // host knocks a far item
  const far = await H.evaluate(() => { const h = G.pl[1]; return MAP.items.filter(i => !i.flat).sort((a, b) => Math.hypot(b.x - h.x, b.y - h.y) - Math.hypot(a.x - h.x, a.y - h.y))[0].id; });
  await H.evaluate(id => { STATE.sel = { kind: 'item', it: MAP.items[id] }; turnConfirm(); }, far);
  await Gu.waitForFunction(() => G.phase === 'hturn', null, { timeout: 5000 }); await Gu.waitForTimeout(500);
  console.log('hints', await Gu.evaluate(() => JSON.stringify(G.hints)), 'host curtain', await H.evaluate(() => !$('curtain').classList.contains('hidden')));
  await Gu.screenshot({ path: OUT + '/t_hturn_g.png' });
  // guest moves 2 m via a tap on the floor inside the circle
  const mv = await Gu.evaluate(() => { const p = G.pl[ME]; for (const [ox, oy] of OFFS.map(([a, b]) => [a * 3, b * 3])) { const q = { x: p.x + ox, y: p.y + oy, k: p.dg.k, v: p.dg.v, r: p.dg.r }; if (Math.hypot(ox, oy) > 1 && !checkPlace(ME, q, 'tmove')) { const [sx, sy] = P(q.x, q.y, 0); return { sx, sy }; } } return null; });
  if (mv) { await Gu.touchscreen.tap(mv.sx, mv.sy); await Gu.waitForTimeout(300); }
  console.log('move pend', await Gu.evaluate(() => JSON.stringify(STATE.pend)));
  if (await Gu.evaluate(() => STATE.pend && !STATE.pend.err)) await Gu.tap('#tGo'); else await Gu.tap('#tStay');
  await H.waitForFunction(() => G.phase === 'seek' && G.turnN === 2, null, { timeout: 5000 });
  console.log('turn2 hider at', await H.evaluate(() => G.pl[1].x.toFixed(2) + ',' + G.pl[1].y.toFixed(2)));
  // pinch-free zoom via wheel on host
  await H.mouse.move(550, 360); await H.mouse.wheel(0, -300); await H.waitForTimeout(600);
  await H.screenshot({ path: OUT + '/t_zoom_h.png' });
  // catch
  await H.evaluate(() => { STATE.sel = { kind: 'pl', i: G.hider }; turnConfirm(); }); await Gu.waitForTimeout(2500);
  console.log('end', await H.evaluate(() => G.phase + JSON.stringify(G.res)), await Gu.evaluate(() => G.phase + ' ' + G.score));
  await Gu.screenshot({ path: OUT + '/t_end_g.png' });
  // iPad realtime solo on the guest page (touch joystick)
  await Gu.evaluate(() => toTitle()); await Gu.waitForTimeout(500);
  console.log('title state', await Gu.evaluate(() => STATE.mode + ' title hidden ' + $('title').className + ' hud ' + $('hud').className + ' lobby ' + $('lobby').className + ' role ' + NETROLE));
  await Gu.tap('#modeSeg button[data-m="rt"]'); await Gu.tap('#soloBtn');
  await Gu.waitForFunction(() => G.phase === 'seek', null, { timeout: 8000 });
  const s0 = await Gu.evaluate(() => [G.pl[0].x, G.pl[0].y]);
  const cdp = await Gu.context().newCDPSession(Gu);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 600, id: 1 }] });
  for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 600 - i * 5, id: 1 }] }); await Gu.waitForTimeout(40); }
  await Gu.waitForTimeout(700); await Gu.screenshot({ path: OUT + '/t_ipad_joy.png' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log('joystick moved', await Gu.evaluate(s0 => Math.hypot(G.pl[0].x - s0[0], G.pl[0].y - s0[1]).toFixed(2), s0));
  await Gu.tap('#aKnock'); await Gu.waitForTimeout(300);
  console.log('errs host', H.errs, 'guest', Gu.errs);
  await b.close();
})();
