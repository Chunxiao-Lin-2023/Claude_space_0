// Two real clients over a local PeerJS server: lobby, role swap, start, guest movement/interaction reaching the host,
// events reaching the guest, snapshot sync, disconnect handling. Needs `node test/peerserver.js` and out/ served on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name) => { const c = await b.newContext({ viewport: { width: 960, height: 560 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) p.errs.push(m.text().slice(0, 200)); }); await p.goto(U, { waitUntil: 'commit', timeout: 120000 }); await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 }); await p.evaluate(() => { window.__dbg.skipDraw = true; }); await p.fill('#nameIn', name); return p; };
  const H = await mk('房主'), G = await mk('朋友');
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code); console.log('code', code);
  await G.fill('#codeIn', code); await G.click('#joinBtn');
  await H.waitForFunction(() => NET.guestName === '朋友', null, { timeout: 30000 });
  await G.waitForFunction(() => STATE.mode === 'lobby', null, { timeout: 10000 });
  console.log('lobby host start disabled before ready:', await H.evaluate(() => document.getElementById('startBtn').disabled));
  await G.click('#swapBtn'); await H.waitForTimeout(800);
  console.log('roles after guest swap request', await H.evaluate(() => NET.roles.join('')), await G.evaluate(() => NET.roles.join('')));
  await G.click('#readyBtn'); await H.waitForFunction(() => NET.ready[1], null, { timeout: 10000 });
  await H.screenshot({ path: OUT + '/co_lobby.png', timeout: 60000 }).catch(() => {});
  await H.click('#startBtn');
  await G.waitForFunction(() => STATE.mode === 'play' && W, null, { timeout: 20000 });
  for (const p of [H, G]) await p.evaluate(() => { W.huntCD = 1e9; });
  console.log('same setup', await H.evaluate(() => JSON.stringify(W.setup.code) + W.setup.gtype), await G.evaluate(() => JSON.stringify(W.setup.code) + W.setup.gtype));
  console.log('roles in game host', await H.evaluate(() => W.p.map(p => p.role + ':' + p.name).join(' ')), 'guest ME', await G.evaluate(() => ME + ' ' + W.p[ME].role));
  // guest walks north
  const g0 = await H.evaluate(() => [W.p[1].x, W.p[1].z]);
  await G.keyboard.down('w'); await G.waitForTimeout(1500); await G.keyboard.up('w'); await G.waitForTimeout(600);
  const g1 = await H.evaluate(() => [W.p[1].x, W.p[1].z]);
  console.log('guest moved on host', g0.map(v => v.toFixed(1)), '->', g1.map(v => v.toFixed(1)));
  // guest picks up an item: teleport guest next to the first untaken item and press E
  const it = await H.evaluate(() => { const i = W.items.find(x => x.k !== 'fuse' && ['music', 'nursery', 'kitchen', 'dining', 'parlor', 'gallery', 'foyer'].includes(x.slot)) || W.items.find(x => x.k === 'fuse'); return { i: i.i, x: i.x, z: i.z, k: i.k }; });
  await G.evaluate(it => { const me = W.p[ME]; me.x = it.x; me.z = it.z + 0.7; INP.aimAng = -HP; me.a = -HP; }, it);
  await G.waitForTimeout(600); await G.keyboard.press('e'); await G.waitForTimeout(1200);
  console.log('item', it.k, 'taken on host', await H.evaluate(i => W.items[i].taken, it.i), 'guest inv', await G.evaluate(() => W.inv.join(',')));
  // host quick chat + ping reach the guest
  await H.keyboard.press('2'); await H.keyboard.press('q'); await G.waitForTimeout(1000);
  console.log('guest got quick/ping', await G.evaluate(() => W.E.filter(e => e.k === 'quick' || e.k === 'ping').map(e => e.k).join(',')));
  // guest flashlight / seer roles: whoever is holder boosts
  console.log('guest sees ghost st', await G.evaluate(() => W.g.st + ' ' + W.g.x.toFixed(1)), 'host', await H.evaluate(() => W.g.st + ' ' + W.g.x.toFixed(1)));
  // floor change across the link: host climbs to floor 2, guest follows and keeps syncing
  await H.evaluate(() => { W.ascTo = 1; hostAscend(); });
  await G.waitForFunction(() => MAP.fi === 1 && W.floor === 1, null, { timeout: 60000, polling: 300 });
  console.log('right after floor change host/guest', await H.evaluate(() => W.p.map(p => p.x.toFixed(1) + ',' + p.z.toFixed(1)).join(' ')), await G.evaluate(() => W.p.map(p => p.x.toFixed(1) + ',' + p.z.toFixed(1)).join(' ') + ' ph=' + W.phase));
  await G.waitForTimeout(4500); // floor card fades
  const f0 = await H.evaluate(() => W.p[1].x.toFixed(2) + ',' + W.p[1].z.toFixed(2));
  await G.keyboard.down('d'); await G.waitForTimeout(1200); await G.keyboard.up('d'); await G.waitForTimeout(600);
  console.log('guest moved on floor 2 (host view)', f0, '->', await H.evaluate(() => W.p[1].x.toFixed(2) + ',' + W.p[1].z.toFixed(2)));
  await G.waitForTimeout(800);
  console.log('floor 2 host', await H.evaluate(() => MAP.fi + ' ' + JSON.stringify(W.used) + W.setup.gtype + ' g=' + W.g.x.toFixed(1)), 'guest', await G.evaluate(() => MAP.fi + ' ' + W.setup.gtype + ' g=' + W.g.x.toFixed(1)));
  console.log('guest pos host/guest', await H.evaluate(() => { const p = W.p[1]; return p.x.toFixed(1) + ',' + p.z.toFixed(1); }), await G.evaluate(() => { const p = W.p[ME]; return p.x.toFixed(1) + ',' + p.z.toFixed(1); }));
  // render a frame on the guest for a screenshot
  await G.evaluate(() => { window.__dbg.skipDraw = false; }); await G.waitForTimeout(2500);
  await G.screenshot({ path: OUT + '/co_guest.png', timeout: 90000 }).catch(e => console.log('shot fail', e.message));
  await G.evaluate(() => { window.__dbg.skipDraw = true; });
  // guest leaves
  await G.context().close(); await H.waitForTimeout(4000);
  console.log('after guest left', await H.evaluate(() => JSON.stringify({ dc: W.dc, link: linkUp(), log: [...document.querySelectorAll('#log div')].map(d => d.textContent).slice(-2) })));
  console.log('errs host', H.errs.slice(0, 6), 'guest', G.errs.slice(0, 6));
  await b.close();
})();
