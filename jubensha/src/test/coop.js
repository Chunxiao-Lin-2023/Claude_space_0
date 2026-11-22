/* node test/coop.js — 双人联机：开房、加入、选角、两边一起推进、朋友提问/搜证/答题、朋友掉线由 AI 接手。需要 peerserver.js(9000) 和 serve.js out 8781 */
const { chromium } = require('playwright'); const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [];
  const mk = async name => { const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } }); await ctx.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ }));
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await pg.goto('http://localhost:8781/test.html?peerhost=127.0.0.1&peerport=9000'); await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('jbs-tut', '3'); window.adv = () => { const g = __dbg.G, r = myRole(); if (g.phase === 'intro' && !g.introStyle[r]) act({ t: 'intro', i: 0 }); if (g.phase === 'final' && r !== 'det' && !g.finalSaid[r]) act({ t: 'say', topic: 'final', i: 0 }); act({ t: 'ready' }); }; }); return pg; };
  const H = await mk('host'), F = await mk('guest');
  await H.click('text=和朋友联机'); await H.click('.tk-box button:has-text("创建房间")'); await H.waitForFunction(() => __dbg.NET.role === 'host' && __dbg.NET.code, null, { timeout: 15000 });
  const code = await H.evaluate(() => __dbg.NET.code); console.log('room', code);
  await F.click('text=和朋友联机'); await F.fill('.tk-code', code); await F.click('.tk-box button:has-text("加入")');
  await F.waitForFunction(() => __dbg.NET.role === 'guest' && __dbg.NET.lobby, null, { timeout: 20000 }); console.log('guest in lobby');
  await H.waitForFunction(() => !!__dbg.NET.conn); await H.evaluate(() => NET.pick('li')); await F.evaluate(() => NET.pick('hu'));
  await H.waitForFunction(() => __dbg.NET.lobby.roles[1] === 'hu', null, { timeout: 5000 }); await H.screenshot({ path: '/tmp/jbs/40_lobby.png' });
  await H.click('text=开始游戏'); await F.waitForFunction(() => __dbg.G && __dbg.G.phase === 'read', null, { timeout: 5000 });
  console.log('guest role', await F.evaluate(() => myRole()), 'host role', await H.evaluate(() => myRole()));
  const both = async () => { await H.evaluate(() => adv()); await H.waitForTimeout(150); await F.evaluate(() => adv()); await H.waitForTimeout(300); };
  await H.evaluate(() => act({ t: 'ready' })); await H.waitForTimeout(200); console.log('host alone ready keeps phase:', await H.evaluate(() => __dbg.G.phase));
  await F.evaluate(() => act({ t: 'ready' })); await H.waitForTimeout(300); console.log('after both ready:', await H.evaluate(() => __dbg.G.phase), await F.evaluate(() => __dbg.G.phase));
  await both(); await F.evaluate(() => act({ t: 'look', id: 'c_cup' })); await H.waitForTimeout(250); console.log('guest look visible to host:', await H.evaluate(() => __dbg.G.pub.includes('c_cup')));
  await both(); console.log('phase', await H.evaluate(() => __dbg.G.phase));
  await F.evaluate(() => act({ t: 'ask', to: 'wang', topic: 'where' })); await H.waitForTimeout(300);
  console.log('host sees guest question + AI answer:', await H.evaluate(() => __dbg.G.log.slice(-3).map(e => e.k + ':' + (e.who || '')).join(' ')));
  await H.evaluate(() => act({ t: 'ask', to: 'hu', topic: 'zhao' })); await F.waitForTimeout(400);
  console.log('guest got prompt:', await F.evaluate(() => !!document.querySelector('.mask .optl')));
  await F.screenshot({ path: '/tmp/jbs/41_guest_prompt.png' });
  await F.click('.mask .optl button >> nth=0'); await H.waitForTimeout(300); console.log('prompt answered, host prompts left:', await H.evaluate(() => __dbg.G.prompts.length));
  for (let i = 0; i < 6; i++) { await F.evaluate(() => act({ t: 'listen' })); await F.waitForTimeout(120); for (let k = 0; k < 3; k++) { if (await F.evaluate(() => __dbg.G.prompts.some(p => p.to === 'hu'))) await F.evaluate(() => { const p = __dbg.G.prompts.find(p => p.to === 'hu'); act({ t: 'say', pid: p.id, i: 0 }); }); if (await H.evaluate(() => __dbg.G.prompts.some(p => p.to === 'li'))) await H.evaluate(() => { const p = __dbg.G.prompts.find(p => p.to === 'li'); act({ t: 'say', pid: p.id, i: 0 }); }); await F.waitForTimeout(150); } }
  await H.evaluate(() => { document.querySelectorAll('.mask').forEach(m => m.remove()); __dbg.U.modalOpen = null; }); await F.evaluate(() => { document.querySelectorAll('.mask').forEach(m => m.remove()); __dbg.U.modalOpen = null; });
  await both(); console.log('phase', await H.evaluate(() => __dbg.G.phase));
  await F.evaluate(() => act({ t: 'search', id: 'c_wang_form' })); await H.waitForTimeout(300);
  console.log('guest search private:', await H.evaluate(() => __dbg.G.own.hu.includes('c_wang_form') && !__dbg.G.pub.includes('c_wang_form')), 'guest AP', await F.evaluate(() => __dbg.G.ap.hu));
  await F.evaluate(() => act({ t: 'publish', id: 'c_wang_form' })); await H.waitForTimeout(250); console.log('published:', await H.evaluate(() => __dbg.G.pub.includes('c_wang_form')));
  await both(); console.log('phase', await H.evaluate(() => __dbg.G.phase));
  await F.evaluate(() => act({ t: 'chat', text: '我觉得是王村长。' })); await H.waitForTimeout(250); console.log('chat reached host:', await H.evaluate(() => __dbg.G.log.some(e => e.k === 'chat' && e.who === 'hu')));
  await F.evaluate(() => UI.modal('clues')); await H.waitForTimeout(300); console.log('host sees guest status:', await H.evaluate(() => __dbg.G.status.hu)); await F.evaluate(() => UI.close());
  await both(); console.log('phase', await H.evaluate(() => __dbg.G.phase));
  await both(); console.log('phase', await H.evaluate(() => __dbg.G.phase));
  await H.evaluate(() => act({ t: 'answers', v: [0, 0, 0, 2, 0, 1, 0, 0] })); await F.evaluate(() => act({ t: 'answers', v: [0, 0, 0, 2, 0, 1, 0, 1] })); await H.waitForTimeout(500);
  console.log('reveal both:', await H.evaluate(() => __dbg.G.phase), await F.evaluate(() => __dbg.G.phase), 'verdict', await F.evaluate(() => __dbg.G.verdict), 'scores', await F.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(__dbg.G.score).map(([k, v]) => [k, v.s])))));
  await F.screenshot({ path: '/tmp/jbs/42_guest_reveal.png' });
  /* 再来一局，然后朋友掉线 */
  await H.click('text=再玩一次'); await H.waitForTimeout(300); console.log('host alone voted again, still reveal:', await H.evaluate(() => __dbg.G.phase));
  await F.click('button.pri:has-text("再玩一次")'); await F.waitForFunction(() => __dbg.G.phase === 'read', null, { timeout: 5000 }); console.log('restart synced after both agreed');
  /* 朋友手上有私有线索时掉线 → 公开；房主刷新 → 朋友自动重连 */
  for (let i = 0; i < 4; i++) await both();
  await F.evaluate(() => UI.search('c_zh_loan')); await H.waitForTimeout(600);
  console.log('guest search popup after host state:', await F.evaluate(() => (document.querySelector('.mask .cl h3') || {}).textContent || 'none')); await F.evaluate(() => UI.close());
  await H.evaluate(() => NET.leave()); await H.waitForTimeout(800);
  console.log('guest kept game while host gone:', await F.evaluate(() => !!__dbg.G && __dbg.U.scr === 'game'));
  await H.reload(); await H.evaluate(() => localStorage.setItem('jbs-tut', '3')); console.log('host save after reload:', await H.evaluate(() => { const g = loadSave('renchiren'); return g ? g.mode + ' ' + JSON.stringify(g.seats) + ' ' + g.phase + ' room ' + g.room : 'none'; }), await H.evaluate(() => document.querySelector('.tk-root, #tk, body').innerText.slice(0, 200).replace(/\s+/g, ' '))); await H.evaluate(() => { window.adv = () => { const g = __dbg.G, r = myRole(); if (g.phase === 'intro' && !g.introStyle[r]) act({ t: 'intro', i: 0 }); if (g.phase === 'final' && r !== 'det' && !g.finalSaid[r]) act({ t: 'say', topic: 'final', i: 0 }); act({ t: 'ready' }); }; }); await H.click('text=继续上次'); await H.click('text=重开同一个房间');
  await F.waitForFunction(() => __dbg.NET.conn && __dbg.NET.conn.open, null, { timeout: 60000 }); await H.waitForTimeout(800);
  console.log('guest auto-reconnected, seats', await H.evaluate(() => JSON.stringify(__dbg.G.seats)), 'loan public after leave?', await H.evaluate(() => __dbg.G.pub.includes('c_zh_loan')));
  await F.evaluate(() => act({ t: 'search', id: 'c_wang_tools' })); await H.waitForTimeout(300);
  await F.evaluate(() => NET.leave()); await H.waitForFunction(() => !__dbg.G.seats[1], null, { timeout: 25000 }).catch(() => {});
  console.log('after guest left, seats', await H.evaluate(() => JSON.stringify(__dbg.G.seats)), 'guest private clue published:', await H.evaluate(() => __dbg.G.pub.includes('c_wang_tools')), 'host can advance alone:', await H.evaluate(() => { adv(); return __dbg.G.phase; }));
  console.log('errors', errs.slice(0, 8)); await b.close(); process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
