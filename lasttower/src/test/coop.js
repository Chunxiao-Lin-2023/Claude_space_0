// Two real clients over a local PeerJS server (node test/peerserver.js) with out/ served on :8765.
// Lobby, ready, start, guest movement reaching host, guest build/craft/fire requests, events + snapshots, revive, disconnect.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/lt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name) => { const c = await b.newContext({ viewport: { width: 1100, height: 680 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(U); await p.waitForFunction(() => window.__ready); await p.fill('#nameIn', name); return p; };
  const H = await mk('阿橙'), G = await mk('小青');
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code); console.log('code', code);
  await G.fill('#codeIn', code); await G.click('#joinBtn');
  await H.waitForFunction(() => NET.guestName === '小青', null, { timeout: 30000 });
  console.log('start disabled before ready:', await H.evaluate(() => document.getElementById('lStart').disabled));
  await H.click('#lDiffSeg button[data-d="hard"]'); await G.waitForTimeout(500);
  console.log('guest sees diff', await G.evaluate(() => NET.diff));
  await G.click('#lReady'); await H.waitForFunction(() => NET.ready, null, { timeout: 10000 });
  await H.screenshot({ path: OUT + '/c_lobby.png' });
  await H.click('#lStart');
  await G.waitForFunction(() => STATE.mode === 'play' && W && W.p.length === 2, null, { timeout: 20000 });
  console.log('names', await G.evaluate(() => W.p.map(p => p.name).join(',') + ' ME=' + ME + ' diff ' + W.diff));
  // guest walks right
  const g0 = await H.evaluate(() => W.p[1].x);
  await G.keyboard.down('d'); await G.waitForTimeout(1200); await G.keyboard.up('d'); await G.waitForTimeout(500);
  console.log('guest moved on host', (await H.evaluate(() => W.p[1].x) - g0).toFixed(0));
  // guest builds a wall via the network
  await G.evaluate(() => { const me = W.p[ME]; me.x = 78 * T; me.y = GY; });
  await G.waitForTimeout(300);
  await G.evaluate(() => { act('build', { x: 80, y: 39, b: 1 }); });
  await G.waitForTimeout(600);
  console.log('guest build -> host tile', await H.evaluate(() => tileAt(80, 39)), 'guest tile', await G.evaluate(() => tileAt(80, 39)), 'res host/guest', await H.evaluate(() => W.res.wood), await G.evaluate(() => W.res.wood));
  // guest searches a spot
  await G.evaluate(() => { const s = W.spots[12]; const me = W.p[ME]; me.x = s.x; me.y = GY; INP.keys.e = true; });
  await G.waitForTimeout(2200); await G.evaluate(() => { INP.keys.e = false; });
  console.log('guest search spot searched host', await H.evaluate(() => W.spots[12].searched), 'guest', await G.evaluate(() => W.spots[12].searched));
  // guest crafts rifle at the bench
  await H.evaluate(() => { W.res.parts += 30; W.res.steel += 20; });
  await G.evaluate(() => { const me = W.p[ME]; me.x = BENCH.x; me.y = GY; }); await G.waitForTimeout(400);
  await G.evaluate(() => act('craft', 'rifle')); await G.waitForTimeout(600);
  console.log('guest rifle owned host', await H.evaluate(() => W.p[1].owned.join('') + ' wpn ' + W.p[1].wpn), 'guest', await G.evaluate(() => W.p[ME].owned.join('') + ' wpn ' + W.p[ME].wpn));
  // night with zombies; guest shoots
  await H.evaluate(() => { window.__dbg.god = true; W.clock = 0.3; });
  await H.waitForTimeout(800);
  await H.evaluate(() => { for (let k = 0; k < 4; k++) { const z = spawnZombie('walker', 1); z.x = (82 + k) * T; } });
  await G.evaluate(() => { const me = W.p[ME]; me.x = 77 * T; me.y = GY; });
  await G.waitForTimeout(800);
  console.log('guest sees zombies', await G.evaluate(() => W.zs.length + ' phase ' + W.phase + ' night ' + W.night));
  await G.evaluate(() => { const [mx, my] = w2s(84 * T, GY - 40); INP.mx = mx; INP.my = my; INP.mouseT = performance.now(); INP.mL = true; });
  await G.waitForTimeout(2500); await G.evaluate(() => { INP.mL = false; });
  console.log('kills by guest (host view)', await H.evaluate(() => W.p[1].kills), 'guest view', await G.evaluate(() => W.p[ME].kills), 'guest mag', await G.evaluate(() => W.p[ME].mag.join(',')));
  await G.screenshot({ path: OUT + '/c_guest_night.png' });
  await H.screenshot({ path: OUT + '/c_host_night.png' });
  // guest goes down, host revives
  await H.evaluate(() => { window.__dbg.god = false; hurtPlayer(W.p[1], 999); window.__dbg.god = true; });
  await G.waitForTimeout(500);
  console.log('guest down (guest view)', await G.evaluate(() => W.p[ME].down));
  await H.evaluate(() => { const g = W.p[1], me = W.p[0]; me.x = g.x + 10; me.y = g.y; INP.keys.e = true; });
  await H.waitForTimeout(3000); await H.evaluate(() => { INP.keys.e = false; });
  console.log('guest revived', await H.evaluate(() => !W.p[1].down), await G.evaluate(() => !W.p[ME].down));
  // disconnect
  await G.context().close(); await H.waitForTimeout(3000);
  console.log('after guest left: gone', await H.evaluate(() => W.p[1].gone), 'log', await H.evaluate(() => [...document.querySelectorAll('#log div')].map(d => d.textContent).slice(-1).join('')));
  console.log('errs host', H.errs, 'guest', G.errs);
  await b.close();
})();
