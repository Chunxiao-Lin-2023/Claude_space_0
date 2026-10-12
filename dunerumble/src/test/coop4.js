// Host + 3 guests over a local PeerJS server: lobby list, team mode start (versus split), guest input reaching host,
// mode state reaching guests, guest gadget/emote/ping, one guest dropping -> AI takeover, back-to-room.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const U = 'http://localhost:8765/test.html?peerhost=127.0.0.1&peerport=9000';
  const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
  const mk = async () => { const c = await b.newContext({ viewport: { width: 900, height: 560 } }); await c.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) p.errs.push(m.text().slice(0, 200)); }); await p.goto(U, { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForFunction(() => !document.getElementById('loading'), { timeout: 60000 }); await p.evaluate(() => { window.__dbg.skipDraw = true; }); return p; };
  const mode = process.env.MODE || 'gem', versus = process.env.VS === '1';
  const H = await mk(), Gs = [await mk(), await mk(), await mk()];
  for (const p of [H, ...Gs]) await p.click('#playSeg button[data-v=online]');
  await H.click(`#modeGrid [data-v="${mode}"]`);
  if (versus) await H.click('#vsSeg button[data-v=vs]');
  await H.fill('#nameIn', '房主');
  for (let i = 0; i < Gs.length; i++) { await Gs[i].fill('#nameIn', '朋友' + (i + 1)); await Gs[i].click(`.hcard[data-i="${[4, 7, 9][i]}"]`); }
  await H.click('#hostBtn'); await H.waitForFunction(() => NET.peer && NET.peer.open, { timeout: 20000 });
  const code = await H.evaluate(() => NET.code); console.log('code', code);
  for (const g of Gs) { await g.fill('#codeIn', code); await g.click('#joinBtn'); }
  await H.waitForFunction(() => [...NET.guests.values()].filter(g => g.hello).length === 3, { timeout: 25000 });
  await Gs[2].waitForFunction(() => NET.lobby && NET.lobby.players.length === 4, { timeout: 10000 });
  console.log('lobby (host)', await H.evaluate(() => JSON.stringify(lobbyPlayers().map(p => p.name + ':' + HEROES[p.hero].k))), 'guest3 sees', await Gs[2].evaluate(() => NET.lobby.players.length + ' ' + NET.lobby.mode));
  await H.screenshot({ path: OUT + '/c4_lobby_host.png', timeout: 8000 }).catch(() => {}); await Gs[0].screenshot({ path: OUT + '/c4_lobby_guest.png', timeout: 8000 }).catch(() => {});
  await H.click('#startBtn');
  for (const g of Gs) await g.waitForFunction(() => STATE.mode === 'play' && CL.me, { timeout: 15000 });
  for (const p of [H, ...Gs]) await p.evaluate(() => { window.__dbg.skipDraw = true; });
  for (const g of Gs) await g.waitForFunction(() => CL.me && !CL.me.first, { timeout: 15000 });
  await Gs[0].evaluate(() => { window.__dbg.skipDraw = false; }); await Gs[0].waitForTimeout(3000); // G1 renders the whole match (compiles shaders up front)
  console.log('guest fps check', await Gs[0].evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); })(); })));
  console.log('teams', await H.evaluate(() => JSON.stringify(G.ents.map(e => `${e.name}/${e.H.k}/t${e.team}/h${e.human}`))));
  console.log('guest views', JSON.stringify(await Promise.all(Gs.map(g => g.evaluate(() => ({ id: CL.me.id, team: CL.me.team, hero: CL.me.H.k, n: CL.list.length, mode: CL.cfg.mode, arena: !!M.arena }))))));
  // guest 1 walks, shoots, uses gadget, emotes, pings
  const G1 = Gs[0];
  const before = await H.evaluate(() => { const g = G.ents.find(e => e.human === 2); return { id: g.id, x: g.x, z: g.z, atk: g.atkSeq, gad: g.gadLeft }; });
  await G1.keyboard.down('w'); await G1.waitForTimeout(1500); await G1.keyboard.up('w');
  await G1.mouse.move(600, 200); await G1.mouse.down(); await G1.waitForTimeout(120); await G1.mouse.up();
  await G1.keyboard.press('q'); await G1.keyboard.press('2'); await G1.keyboard.press('t');
  await G1.waitForTimeout(1500);
  const after = await H.evaluate(id => { const g = entById(id); return { x: g.x, z: g.z, atk: g.atkSeq, gad: g.gadLeft, emote: !!G.ev.find(e => e.k === 'emote' && e.id === id), ping: !!G.ev.find(e => e.k === 'ping' && e.by === id) }; }, before.id);
  console.log('guest1 on host: before', JSON.stringify(before), 'after', JSON.stringify(after));
  await H.evaluate(() => { for (let i = 0; i < 60 * 25; i++) stepGame(1 / 60); });
  await G1.waitForTimeout(1500);
  console.log('mode state host', await H.evaluate(() => JSON.stringify({ t: G.t | 0, sc: G.ms.sc, gems: G.ms.gems && G.ms.gems.length, ball: G.ms.ball && [G.ms.ball.x | 0, G.ms.ball.z | 0] })),
    'guest', await G1.evaluate(() => JSON.stringify({ t: CL.t | 0, sc: CL.ms && CL.ms.sc, gems: CL.ms && CL.ms.gems && CL.ms.gems.length, ball: CL.ms && CL.ms.ball && [CL.ms.ball.x | 0, CL.ms.ball.z | 0], hud: document.getElementById('hScore').textContent })));
  
  await G1.waitForTimeout(1200); await G1.screenshot({ path: OUT + '/c4_guest.png', timeout: 8000 }).catch(() => {});
  
  // guest 3 leaves
  await Gs[2].context().close(); await H.waitForTimeout(16000);
  console.log('after drop', await H.evaluate(() => JSON.stringify({ seen: [...NET.guests.values()].map(g => performance.now() - g.seen | 0), lt: performance.now() - NET.lastTick | 0, guests: NET.guests.size, ai: G.ents.filter(e => e.name.includes('(AI)')).map(e => e.name) })));
  // finish the match on host, guests should get results; host returns to room, guests follow
  await H.evaluate(() => { for (let i = 0; i < 60 * 200 && !G.over; i++) stepGame(1 / 60); });
  await G1.waitForTimeout(4000);
  console.log('end dbg host', await H.evaluate(() => JSON.stringify({ t: G.t | 0, over: G.over, ev: G.evSeq, end: G.ev.filter(e => e.k === 'end').map(e => [e.seq, e.tt | 0]) })), 'guest', await G1.evaluate(() => JSON.stringify({ t: CL.t | 0, over: CL.over, ev: CL.evSeq, age: performance.now() - CL.lastSnap | 0 })));
  console.log('results', await H.evaluate(() => STATE.mode + ' ' + document.getElementById('rRank').textContent), await G1.evaluate(() => STATE.mode + ' ' + document.getElementById('rRank').textContent + ' ' + document.getElementById('rReward').textContent));
  await G1.screenshot({ path: OUT + '/c4_guest_result.png', timeout: 8000 }).catch(() => {});
  await H.click('#rAgain'); await G1.waitForTimeout(1500);
  console.log('back to room', await H.evaluate(() => STATE.mode + ' guests=' + NET.guests.size), await G1.evaluate(() => STATE.mode + ' conn=' + connected()), await Gs[1].evaluate(() => STATE.mode));
  console.log('errs host', H.errs.slice(0, 5), 'g1', Gs[0].errs.slice(0, 5), 'g2', Gs[1].errs.slice(0, 5));
  await b.close();
})();
