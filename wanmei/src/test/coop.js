// Two real clients over a local PeerJS server. Needs `node test/peerserver.js` and out/ served on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/claude-0/coop'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/test.html?q=low&peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async () => { const c = await b.newContext({ viewport: { width: 640, height: 360 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); await p.goto(U); await p.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 120000 }); await p.evaluate(() => { localStorage.clear(); __dbg.skipDraw = true; __dbg.autoDlg = 0.2; }); return p; };
  const H = await mk(), G = await mk();
  await H.evaluate(() => { STATE.mode = 'lobby'; netHost(); }); await H.waitForFunction(() => NET.peer && NET.peer.open, null, { timeout: 30000 });
  const code = await H.evaluate(() => NET.code); console.log('code', code);
  await G.evaluate(c => { STATE.mode = 'lobby'; netJoin(c, '团团'); }, code);
  await H.waitForFunction(() => NET.guestName === '团团', null, { timeout: 30000 }); console.log('guest joined');
  await H.evaluate(() => { PARTY.pname = NET.guestName; startSolo(null); W.skip = true; });
  await G.waitForFunction(() => STATE.mode === 'play', null, { timeout: 30000 }); console.log('guest in play');
  await H.waitForFunction(() => !STORY.running, null, { timeout: 60000 });
  // jump to q2 (pet hatched) and check guest sees entities
  await H.evaluate(() => { PARTY.flags.hatched = 1; hidePet(false); startStory(2, 0); });
  await G.waitForTimeout(3000);
  console.log('guest ents', await G.evaluate(() => W.ents.length + ' p1=' + !!W.P[0] + ' me=' + W.me + ' name=' + (W.P[1] && W.P[1].name)));
  const g0 = await H.evaluate(() => [W.P[1].x, W.P[1].z].map(v => v.toFixed(1)).join(','));
  await G.keyboard.down('w'); await G.waitForTimeout(1500); await G.keyboard.up('w'); await G.waitForTimeout(800);
  console.log('guest moved on host', g0, '->', await H.evaluate(() => [W.P[1].x, W.P[1].z].map(v => v.toFixed(1)).join(',') + ' ctrl=' + W.P[1].ctrl));
  // guest casts at a wolf
  await H.evaluate(() => { const p = W.P[1]; const w = spawnMob('wolf', p.x + 3, p.z + 3, { lv: 1, story: true }); w.script = true; window.__w = w.id; });
  await G.waitForTimeout(1500);
  const hp0 = await H.evaluate(() => W.byId.get(window.__w).hp);
  const wid = await H.evaluate(() => window.__w); await G.evaluate(wid => { const w = W.byId.get(wid); const me = W.P[1]; teleport(me, w.x + 1.5, w.z, 0); faceTo(me, w.x, w.z); setTarget(w); }, wid);
  await G.waitForTimeout(600); console.log('seq', await G.evaluate(() => NET.seq), await H.evaluate(() => [W.P[1].inSeq, (W.t - W.P[1].remoteT).toFixed(1), W.t.toFixed(1)])); await G.waitForTimeout(1000); console.log('seq2', await G.evaluate(() => [NET.seq, W.t.toFixed(1)]), await H.evaluate(() => [W.P[1].inSeq, (W.t - W.P[1].remoteT).toFixed(1)])); console.log('guest state', await G.evaluate(() => JSON.stringify({ cine: W.cine, dlg: DLG.open, modal: UI.modal, alive: W.P[1].alive, tgt: UI.target && UI.target.name, d: UI.target && edist(W.P[1], UI.target).toFixed(1) }))); console.log('host state', await H.evaluate(() => JSON.stringify({ cine: W.cine, run: !!STORY.running, dlg: DLG.open, qi: STORY.qi, p2: [W.P[1].x.toFixed(1), W.P[1].z.toFixed(1)], w: (() => { const w = W.byId.get(window.__w); return [w.x.toFixed(1), w.z.toFixed(1)]; })() }))); for (let i = 0; i < 4; i++) { await G.keyboard.press('j'); await G.waitForTimeout(700); } await G.keyboard.press('1'); await G.waitForTimeout(1500);
  console.log('wolf hp on host', hp0, '->', await H.evaluate(() => { const w = W.byId.get(window.__w); return w ? w.hp + ' alive=' + w.alive : 'gone'; }));
  // dialogue reaches guest
  await H.evaluate(() => { runFree(async () => { await talk([['族长', '联机测试对白'], ['小不点', '第二句']]); }); }); await G.waitForTimeout(1500);
  console.log('guest dialog', await G.evaluate(() => DLG.open + ' ' + DLG.full));
  await H.evaluate(() => { __dbg.skipDraw = false; }); await G.evaluate(() => { __dbg.skipDraw = false; }); await G.waitForTimeout(2500);
  await G.screenshot({ path: OUT + '/guest.png', timeout: 120000 }).catch(e => console.log('shot fail', e.message));
  await H.screenshot({ path: OUT + '/host.png', timeout: 120000 }).catch(e => console.log('shot fail', e.message));
  await G.context().close(); await H.waitForTimeout(4000);
  console.log('after guest left ctrl', await H.evaluate(() => W.P[1].ctrl));
  console.log('errs host', H.errs.slice(0, 6), 'guest', G.errs.slice(0, 6));
  await b.close();
})();
