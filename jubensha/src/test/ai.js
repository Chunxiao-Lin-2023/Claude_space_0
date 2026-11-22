/* node test/ai.js — Claude 接入（用假的 API 响应，不花钱）：台词改写、泄露/编时间/认罪被拦、超时退回脚本、自由提问归类、
   不是凶手说谎被拒、联机时朋友不用密钥也能看到 Claude 台词并自由提问。需要 serve.js out 8781 和 peerserver.js */
const { chromium } = require('playwright'); const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
let MODE = 'ok', CALLS = { say: 0, route: 0, judge: 0 };
const mock = async route => {
  const req = JSON.parse(route.request().postData() || '{}'), tool = req.tool_choice && req.tool_choice.name, user = (req.messages && req.messages[0].content) || '';
  if (route.request().headers()['anthropic-dangerous-direct-browser-access'] !== 'true' || !route.request().headers()['x-api-key']) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":{"message":"bad headers"}}' });
  CALLS[tool] = (CALLS[tool] || 0) + 1;
  let input;
  if (tool === 'say') {
    const orig = (user.match(/原句：([\s\S]*)$/) || [])[1] || '';
    if (MODE === 'slow') { await new Promise(r => setTimeout(r, 13000)); }
    input = { line: MODE === 'leak' ? '我知道，那两个字是赌徒。' : MODE === 'time' ? '我九点五十才回的家。' : MODE === 'confess' ? '是我毒死他的。' : '（换个说法）' + orig.slice(0, 60) };
  } else if (tool === 'route' && MODE === 'err') { await new Promise(r => setTimeout(r, 1200)); return route.fulfill({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":{"message":"overloaded"}}' });
  } else if (tool === 'route' && MODE === 'names') { input = { act: 'ask', to: '王村长', topic: 'village', item: 'none' };
  } else if (tool === 'route' && MODE === 'noto') { input = { act: 'ask', to: 'none', topic: 'where', item: 'none' };
  } else if (tool === 'route') {
    const said = (user.match(/【玩家打的话】(.*)/) || [])[1] || '';
    input = /在哪|干什么/.test(said) ? { act: 'ask', to: /王/.test(said) ? 'wang' : /张/.test(said) ? 'zhang' : /胡/.test(said) ? 'hu' : 'li', topic: 'where', item: 'none' } : /给.*看|出示/.test(said) ? { act: 'show', to: 'li', topic: 'none', item: 'c_bullets' } : { act: 'say', to: 'none', topic: 'none', item: 'none' };
  } else if (tool === 'judge') {
    const said = (user.match(/【玩家打的话】(.*)/) || [])[1] || '';
    input = /没出门|一直在家/.test(said) ? { index: -1, kind: 'lie', contradicts: true } : { index: 0, kind: 'truth', contradicts: false };
  } else input = { text: '通了' };
  route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ content: [{ type: 'tool_use', name: tool, input }], usage: { input_tokens: 800, output_tokens: 60 } }) });
};
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [], R = {};
  const mk = async (name, key) => { const ctx = await b.newContext({ viewport: { width: 1100, height: 780 } }); await ctx.route(/api\.anthropic\.com/, mock); await ctx.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto('http://localhost:8781/test.html?peerhost=127.0.0.1&peerport=9000'); await p.evaluate(k => { localStorage.clear(); localStorage.setItem('jbs-tut', '3'); if (k) localStorage.setItem('hub.ai', JSON.stringify({ key: k, on: true, tier: 'bal' })); }, key); await p.reload();
    await p.evaluate(() => { window.adv = () => { const g = __dbg.G, r = myRole(); if (g.phase === 'intro' && !g.introStyle[r]) act({ t: 'intro', i: 0 }); if (g.phase === 'final' && r !== 'det' && !g.finalSaid[r]) act({ t: 'say', topic: 'final', i: 0 }); act({ t: 'ready' }); }; }); return p; };
  const idle = p => p.waitForFunction(() => !AIJ.busy && !__dbg.G.log.some(e => e.v === 'p') && !(__dbg.G.freeQ || []).length, null, { timeout: 40000 });
  const P = await mk('solo', 'sk-ant-test-0000');
  R.available = await P.evaluate(() => AIKit.available());
  await P.evaluate(() => { __dbg.U.setup = { sid: 'renchiren', mode: 'det', role: null, diff: 'std' }; UI.start(); TK.hide(); adv(); adv(); }); await idle(P);
  R.introVoiced = await P.evaluate(() => __dbg.G.log.filter(e => e.k === 'intro' && e.v === 'a').length + '/' + __dbg.G.log.filter(e => e.k === 'intro' && e.who !== 'det').length);
  await P.evaluate(() => { adv(); }); await P.evaluate(() => { act({ t: 'ask', to: 'li', topic: 'where' }); }); await P.waitForTimeout(150);
  R.pendingShowsDots = await P.evaluate(() => !!document.querySelector('.msg .dots'));
  await idle(P); await P.screenshot({ path: '/tmp/jbs/50_ai_voiced.png' });
  R.answerVoiced = await P.evaluate(() => { const e = __dbg.G.log.filter(x => x.k === 'ans').pop(); return e.v + ' | ' + e.text.slice(0, 30); });
  for (const m of ['leak', 'time', 'confess']) { MODE = m; await P.evaluate(() => act({ t: 'ask', to: 'wang', topic: 'where' })); await idle(P); R['blocked_' + m] = await P.evaluate(() => { const e = __dbg.G.log.filter(x => x.k === 'ans' && x.who === 'wang').pop(); return e.v + ' ' + (e.aiWhy || '') + ' | ' + e.text.slice(0, 20); }); }
  MODE = 'slow'; await P.evaluate(() => act({ t: 'ask', to: 'hu', topic: 'village' })); await idle(P); R.timeoutFallsBack = await P.evaluate(() => { const e = __dbg.G.log.filter(x => x.k === 'ans' && x.who === 'hu').pop(); return e.v + ' | ' + e.text.slice(0, 20); }); MODE = 'ok';
  /* 自由提问 */
  await P.evaluate(() => { __dbg.U.target = 'zhang'; render(); }); await P.fill('#freeq', '张村民，那天晚上你在哪？'); await P.click('.freebar button'); await idle(P);
  R.freeAsk = await P.evaluate(() => { const L = __dbg.G.log; const a = L.filter(e => e.k === 'ask' && e.own).pop(); return a ? a.who + '→' + a.to + ' 话题=' + a.topic + ' 原话=' + a.text : 'none'; });
  await P.fill('#freeq', '把墙上的弹孔给李警察看看'); await P.click('.freebar button'); await idle(P);
  R.freeShow = await P.evaluate(() => { const e = __dbg.G.log.filter(x => x.k === 'show').pop(); return e ? e.who + '→' + e.to + ' ' + e.ref : 'none'; });
  const lastAsk = () => P.evaluate(() => { const L = __dbg.G.log, i = L.map(e => !!(e.k === 'ask' && e.own)).lastIndexOf(true), a = L[i], ans = L.slice(i + 1).find(e => e.k === 'ans' && e.who === (a && a.to)); return a ? a.who + '→' + a.to + ' ' + a.topic + ' | 回答：' + (ans ? ans.text.slice(0, 16) : '无') : 'none'; });
  await P.evaluate(() => { __dbg.U.target = null; render(); });
  MODE = 'err'; await P.fill('#freeq', '胡调研，你那晚看到什么可疑的人了吗？'); await P.click('.freebar button'); await P.waitForTimeout(500);
  R.pendingBubble = await P.evaluate(() => document.querySelectorAll('.pendfree').length); await idle(P);
  R.routeFailsLocalFallback = await lastAsk();
  MODE = 'names'; await P.fill('#freeq', '村长，村里平时都怎么过日子？'); await P.click('.freebar button'); await idle(P);
  R.routeNameNormalized = await lastAsk();
  MODE = 'noto'; const n0 = await P.evaluate(() => __dbg.G.log.length); await P.fill('#freeq', '你那晚在哪？'); await P.click('.freebar button'); await idle(P); await P.waitForTimeout(300);
  R.groupQuestionGetsAnswer = await lastAsk();
  await P.fill('#freeq', ''); MODE = 'ok';
  R.costTracked = await P.evaluate(() => JSON.stringify(AIKit.usage().session));
  await P.evaluate(() => UI.modal('ai')); await P.screenshot({ path: '/tmp/jbs/51_ai_settings.png' }); await P.evaluate(() => UI.close());
  /* 入局：不是凶手的玩家（李警察）打谎话被拒，实话通过 */
  const Q = await mk('sus', 'sk-ant-test-0000');
  await Q.evaluate(() => { __dbg.U.setup = { sid: 'renchiren', mode: 'sus', role: 'li', diff: 'std' }; UI.start(); TK.hide(); adv(); adv(); adv(); });
  await Q.evaluate(() => { act({ t: 'freeText', text: '我那晚一直在家，没出门。', say: 1 }); }); await idle(Q);
  R.innocentLieRejected = await Q.evaluate(() => JSON.stringify((__dbg.G.freeMsg || {}).li || null));
  await Q.evaluate(() => { act({ t: 'freeText', text: '我九点十分去过他家，开了枪但没打中。', say: 1 }); }); await idle(Q);
  R.innocentTruthAccepted = await Q.evaluate(() => { const e = __dbg.G.log.filter(x => x.who === 'li' && x.own).pop(); return e ? e.k + ' ' + e.text : 'none'; });
  /* 没有密钥：完全是脚本 AI */
  const N = await mk('nokey', null);
  await N.evaluate(() => { __dbg.U.setup = { sid: 'renchiren', mode: 'det', role: null, diff: 'std' }; UI.start(); TK.hide(); adv(); adv(); adv(); act({ t: 'ask', to: 'li', topic: 'where' }); });
  R.noKeyScripted = await N.evaluate(() => 'G.ai=' + __dbg.G.ai + ' voiced=' + __dbg.G.log.filter(e => e.v === 'a').length + ' freebar=' + !!document.querySelector('.freebar'));
  /* 联机：房主有密钥，朋友没有 */
  const H = await mk('host', 'sk-ant-test-0000'), F = await mk('guest', null);
  await H.evaluate(() => { UI.go('lobby'); NET.host(); }); await H.waitForFunction(() => __dbg.NET.code, null, { timeout: 15000 }); const code = await H.evaluate(() => __dbg.NET.code);
  await F.evaluate(c => { UI.go('lobby'); NET.join(c); }, code); await F.waitForFunction(() => __dbg.NET.role === 'guest' && __dbg.NET.lobby, null, { timeout: 20000 });
  await H.waitForFunction(() => !!__dbg.NET.conn); await H.evaluate(() => NET.pick('li')); await F.evaluate(() => NET.pick('hu')); await H.waitForTimeout(400); await H.evaluate(() => NET.start());
  await F.waitForFunction(() => __dbg.G && __dbg.G.phase === 'read'); const both = async () => { await H.evaluate(() => adv()); await H.waitForTimeout(150); await F.evaluate(() => adv()); await H.waitForTimeout(300); };
  await both(); await both(); await both(); await idle(H); await H.waitForTimeout(500);
  R.guestSeesClaude = await F.evaluate(() => 'G.ai=' + __dbg.G.ai + ' voiced lines=' + __dbg.G.log.filter(e => e.v === 'a').length + ' freebar=' + !!document.querySelector('.freebar'));
  const before = CALLS.route; await F.evaluate(() => { __dbg.U.target = 'wang'; render(); }); await F.fill('#freeq', '王村长，你那晚在哪？'); await F.click('.freebar button'); await H.waitForTimeout(500); await idle(H); await F.waitForTimeout(500);
  R.guestFreeAskViaHost = (CALLS.route - before) + ' route call(s); guest log: ' + await F.evaluate(() => { const a = __dbg.G.log.filter(e => e.k === 'ask' && e.own).pop(); return a ? a.who + '→' + a.to + ' ' + a.topic : 'none'; });
  R.guestNeverCalledAPI = 'guest key=' + await F.evaluate(() => AIKit.cfg().key ? 'yes' : 'none') + ' guest calls=' + await F.evaluate(() => AIKit.usage().session.calls);
  R.calls = JSON.stringify(CALLS);
  console.log(JSON.stringify(R, null, 1)); console.log('errors', errs.slice(0, 6)); await b.close(); process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
