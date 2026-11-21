// Co-op pillion: the rider on the back sits on the bike on both screens (no floating), and both models are back to normal after getting off
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const U = 'http://localhost:8766/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name) => { const c = await b.newContext({ viewport: { width: 900, height: 560 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.setDefaultTimeout(150000); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(U); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 }); await p.evaluate(([i, v]) => { const e = document.querySelector(i); e.value = v; e.dispatchEvent(new Event('input')); }, ['#nameIn', name]); return p; };
  const H = await mk('阿橙'), G = await mk('小青');
  const simWait = (p, s) => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  await H.evaluate(() => document.querySelector('#hostBtn').click()); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code);
  await G.evaluate(v => { const e = document.querySelector('#codeIn'); e.value = v; e.dispatchEvent(new Event('input')); }, code); await G.evaluate(() => document.querySelector('#joinBtn').click());
  await H.waitForFunction(() => NET.guestName === '小青', null, { timeout: 30000 });
  await G.evaluate(() => document.querySelector('#lReady').click()); await H.waitForFunction(() => NET.ready, null, { timeout: 10000 });
  await H.evaluate(() => { SET.mode = 'classic'; SET.map = 'town'; sendLobby(); }); await G.waitForTimeout(500);
  await H.evaluate(() => document.querySelector('#lStart').click());
  await G.waitForFunction(() => STATE.mode === 'play' && W && W.p.length === 2, null, { timeout: 30000 }); await H.waitForFunction(() => W.t > 1, null, { timeout: 90000 });
  // a clear straight road; host owns a motorbike
  const spot = await H.evaluate(() => { const x = W.radio.x + 20, y = W.radio.y + 20, L = gAt(x, y); for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 16; dx++) for (let l = L; l < L + 3; l++) { W.blk[ci(x + dx, y + dy, l)] = 0; if (l > L) W.slab[ci(x + dx, y + dy, l)] = 0; } W.ver++; W.zs.length = 0; W.spawnQ = []; W.phase = 'day'; W.clock = 999;
    const me = W.p[ME]; me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); me.vehs = 4; me.veh = 2; doAct(me, 'ride'); return { x, y, L }; });
  await simWait(H, 0.5);
  await G.evaluate(s => { const me = W.p[ME]; me.x = s.x + 0.5; me.y = s.y + 1.5; me.L = s.L; me.z = surfZ(me.x, me.y, s.L); }, spot); await simWait(G, 0.8);
  const shape = p => p.evaluate(() => OBJ.pl.map((m, i) => ({ i, hips: +m.hips.position.y.toFixed(2), rx: +m.g.rotation.x.toFixed(2), veh: m.veh ? m.veh.visible : null, th: +m.legs[0].th.rotation.z.toFixed(2), pos: [+m.g.position.x.toFixed(2), +m.g.position.z.toFixed(2), +m.g.position.y.toFixed(2)], sc: [m.g.scale.x, m.g.scale.y].join('/'), vis: m.g.visible, lowerY: +m.lower.rotation.y.toFixed(2) })));
  const before = { h: await shape(H), g: await shape(G) }; before.h[0] = before.h[1]; before.g[0] = before.g[1]; // the host is already on the bike here: compare with a standing model
  await G.evaluate(s => { const me = W.p[ME]; me.x = s.x + 0.5; me.y = s.y + 2.6; }, spot); await simWait(G, 0.3); await G.keyboard.press('t'); await simWait(G, 0.6); await simWait(H, 0.3); // PC: T next to a teammate on a motorbike
  let s = await H.evaluate(() => ({ pass: W.p[1].pass, ride: W.p[0].ride }));
  check('PC: T next to a teammate on a motorbike (2 tiles away) puts you on the back', s.pass === 0 && s.ride, JSON.stringify(s));
  // the host drives east for a while
  await H.keyboard.down('w');
  const gap = async p => p.evaluate(() => { const m0 = OBJ.pl[0].g.position, m1 = OBJ.pl[1].g.position; return { d: +Math.hypot(m0.x - m1.x, m0.z - m1.z).toFixed(2), dz: +(m1.y - m0.y).toFixed(2), hipsP: +OBJ.pl[1].hips.position.y.toFixed(2), hipsD: +OBJ.pl[0].hips.position.y.toFixed(2) }; });
  const gs = [];
  for (let k = 0; k < 6; k++) { await H.waitForTimeout(250); gs.push({ h: await gap(H), g: await gap(G) }); if (k === 3) { for (const q of [H, G]) await q.evaluate(() => { CAM.zoom = 2.6; }); await H.screenshot({ path: OUT + '/ride_host.png' }); await G.screenshot({ path: OUT + '/ride_guest.png' }); } }
  await H.keyboard.up('w');
  const moved = await H.evaluate(s => +(W.p[0].x - s.x).toFixed(1), spot);
  console.log('driven', moved, JSON.stringify(gs));
  check('while riding, the pillion model sits right behind the driver on both screens (0.25–0.6 apart, same height)', gs.every(x => [x.h, x.g].every(q => q.d > 0.2 && q.d < 0.65 && Math.abs(q.dz) < 0.12)), JSON.stringify(gs.slice(-2)));
  // off again
  await H.evaluate(() => doAct(W.p[0], 'ride')); await simWait(H, 1); await simWait(G, 0.6);
  const after = { h: await shape(H), g: await shape(G) }; await H.screenshot({ path: OUT + '/ride_off_host.png' }); await G.screenshot({ path: OUT + '/ride_off_guest.png' });
  const same = (a, b) => a.every((m, i) => Math.abs(m.hips - b[i].hips) < 0.05 && m.rx === b[i].rx && m.veh === b[i].veh && m.sc === b[i].sc && m.vis === b[i].vis);
  check('after getting off, both models on both screens look like before riding', same(after.h, before.h) && same(after.g, before.g), JSON.stringify({ before, after }));
  check('no page errors', !H.errs.length && !G.errs.length, H.errs.concat(G.errs).slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
