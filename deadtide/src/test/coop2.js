// Guest-side robustness: guest renders while walking into town buildings, host searches lots of crates, a dawn restocks everything.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8766/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async (name) => { const c = await b.newContext({ viewport: { width: 640, height: 400 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.setDefaultTimeout(150000); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); }); await p.goto(U); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 }); await p.evaluate(() => { window.__dbg.skipDraw = true; }); await p.fill('#nameIn', name); return p; };
  const H = await mk('阿橙'), G = await mk('小青');
  const simWait = (p, s) => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code);
  await G.fill('#codeIn', code); await G.click('#joinBtn');
  await H.waitForFunction(() => NET.guestName === '小青', null, { timeout: 30000 });
  await G.click('#lReady'); await H.waitForFunction(() => NET.ready, null, { timeout: 10000 });
  await H.click('#lStart');
  await G.waitForFunction(() => STATE.mode === 'play' && W && W.p.length === 2, null, { timeout: 30000 });
  await H.waitForFunction(() => W.t > 1, null, { timeout: 90000 });
  const counts = p => p.evaluate(() => { rebuildCells(); let n = 0; SCN.traverse(o => { if (o.isInstancedMesh) n += o.count; }); return { inst: n, cam: [CAM.tx.toFixed(1), CAM.ty.toFixed(1)], me: [W.p[ME].x.toFixed(1), W.p[ME].y.toFixed(1), W.p[ME].L], gone: W.p[ME].gone, seq: W.seq, err: window.__dbg.err || '' }; });
  console.log('guest start', await counts(G));
  // host searches 30 crates quickly (vanish → 30 cell events), then a dawn restocks them
  const t0 = Date.now();
  await H.evaluate(() => { let n = 0; for (let i = 0; i < NC && n < 30; i++) if (B[W.blk[i]] && B[W.blk[i]].spot && SPOTS[B[W.blk[i]].spot].vanish) { completeUse(W.p[0], { k: 'spot', i }); n++; } });
  await simWait(H, 1.0);
  console.log('after 30 searches (real ms)', Date.now() - t0, await counts(G));
  const gl = await G.evaluate(() => { const t = performance.now(); for (let k = 0; k < 30; k++) recomputeStab(); return ((performance.now() - t) / 30).toFixed(1); });
  console.log('guest recomputeStab ms each', gl);
  await H.evaluate(() => { W.phase = 'night'; W.night = 1; dawn(); }); await simWait(H, 1.5);
  console.log('after dawn', await counts(G), 'srch host', await H.evaluate(() => W.srch.size), 'guest', await G.evaluate(() => W.srch.size));
  // guest walks into a town building, up a floor
  await G.evaluate(() => { const h = TOWN_HOUSES[0]; const me = W.p[ME]; for (let y = h[1] + 1; y < h[3]; y++) for (let x = h[0] + 1; x < h[2]; x++) if (standable(x, y, 1, 'p')) { me.x = x + 0.5; me.y = y + 0.5; me.L = 1; return; } });
  await simWait(H, 1.0);
  console.log('guest in house', await counts(G));
  await G.evaluate(() => { window.__dbg.skipDraw = false; }); await G.waitForTimeout(4000); await G.screenshot({ path: OUT + '/c2_guest.png' }); await G.evaluate(() => { window.__dbg.skipDraw = true; });
  const sum = p => p.evaluate(() => { let a = 0, c = 0; for (let i = 0; i < NC; i++) { a = (a * 31 + W.blk[i]) % 1000000007; c = (c * 31 + W.slab[i]) % 1000000007; } return a + '/' + c; });
  { const a = await sum(H), g = await sum(G); console.log('map identical host/guest', a === g, a, g); }
  console.log('linked', await H.evaluate(() => !!(NET.gctl && NET.gctl.open) && !W.p[1].gone), await G.evaluate(() => linkUp()));
  console.log('errs host', H.errs.slice(0, 5), 'guest', G.errs.slice(0, 5));
  await b.close();
})();
