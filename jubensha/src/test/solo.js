/* node test/solo.js — 单人：侦探局从头玩到真相 + 凶手局（王村长）+ 截图。需要 node test/serve.js out 8781 */
const { chromium } = require('playwright'); const fs = require('fs');
const OUT = process.argv[2] || '/tmp/jbs'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const errs = [];
  const mk = async (vp, touch) => { const ctx = await b.newContext({ viewport: vp, hasTouch: !!touch, isMobile: !!touch }); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); await pg.goto('http://localhost:8781/test.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.evaluate(() => { window.adv = () => { const g = __dbg.G, r = g.seats[0]; if (g.phase === 'intro' && !g.introStyle[r]) __dbg.act({ t: 'intro', i: 0 }); if (g.phase === 'final' && r !== 'det' && !g.finalSaid[r]) __dbg.act({ t: 'say', topic: 'final', i: 0 }); __dbg.act({ t: 'ready' }); }; }); return pg; };
  const shot = async (pg, n) => { await pg.waitForTimeout(250); await pg.screenshot({ path: `${OUT}/${n}.png` }); };
  const P = await mk({ width: 1280, height: 820 });
  await shot(P, '00_title');
  await P.click('text=开始新的案件'); await shot(P, '01_setup');
  await P.click('button.pri:has-text("开始")');
  const phase = () => P.evaluate(() => __dbg.G.phase);
  await shot(P, '02_read'); await P.click('text=读完了');
  console.log('phase', await phase()); await P.click('.optl button >> nth=0'); await shot(P, '03_intro'); await P.click('text=开始勘查现场');
  const nh = (await P.$$('.hot')).length; for (let i = 0; i < nh; i++) { await P.click(`.hot >> nth=${i}`); await P.waitForTimeout(80); if (i === 4) await shot(P, '04a_clue'); await P.click('.mask .dh button'); }
  await shot(P, '04_r1'); await P.click('text=开始讨论');
  console.log('phase', await phase());
  /* 第一轮：问几个问题、听 AI 说 */
  await P.click('.st:has-text("李警察")'); await P.click('text=❓ 提问'); await P.click('.mask .optl button:has-text("那天晚上你在哪")');
  await P.click('.st:has-text("张村民")'); await P.click('text=❓ 提问'); await P.click('.mask .optl button:has-text("你怎么看王村长")');
  for (let i = 0; i < 6; i++) await P.evaluate(() => UI.listen());
  await shot(P, '05_d1'); await P.click('text=结束讨论'); await P.click('text=再点一次结束');
  console.log('phase', await phase(), 'ai taken', await P.evaluate(() => Object.keys(__dbg.G.taken).length));
  /* 第二轮搜证：优先拿关键线索 */
  const want = ['c_cellar', 'c_wang_form', 'c_zh_loan', 'c_li_gun', 'c_hu_knife', 'c_zh_father', 'c_hu_rec', 'c_zh_knife', 'c_li_gf'];
  for (const id of want) await P.evaluate(id => { if (!__dbg.G.taken[id] && __dbg.G.ap.det > 0) __dbg.act({ t: 'search', id }); }, id);
  await shot(P, '06_r2');
  await P.evaluate(() => [...__dbg.G.own.det].forEach(id => __dbg.act({ t: 'publish', id })));
  await P.click('text=开始第二轮讨论'); console.log('phase', await phase());
  /* 出示关键证据，逼出证词 */
  const show = (to, id) => P.evaluate(([to, id]) => __dbg.act({ t: 'show', to, id }), [to, id]);
  const ask = (to, topic) => P.evaluate(([to, topic]) => __dbg.act({ t: 'ask', to, topic }), [to, topic]);
  await show('li', 'c_li_gun'); await show('zhang', 'c_cellar'); await show('hu', 'c_hu_knife'); await ask('li', 'saw'); await ask('hu', 'village'); await ask('wang', 'cellar');
  for (let i = 0; i < 16; i++) await P.evaluate(() => UI.listen());
  const pub = await P.evaluate(() => __dbg.G.pub.filter(x => x[0] === 'd'));
  console.log('deductions', pub.join(','));
  console.log('AI votes', await P.evaluate(() => ['wang', 'zhang', 'li', 'hu'].map(r => r + '→' + __dbg.aiVote(__dbg.G, r)).join(' ')));
  await shot(P, '07_d2'); await P.click('text=🕒'); await shot(P, '08_timeline'); await P.click('.mask .dh button');
  await P.click('text=🗂'); await shot(P, '09_clues'); await P.click('.mask .dh button');
  await P.click('text=结束讨论'); await P.click('text=再点一次结束'); console.log('phase', await phase()); await shot(P, '09b_final'); await P.click('text=去答卷');
  for (let i = 0; i < 8; i++) await P.click(`.q:nth-of-type(${i + 2}) .os button >> nth=0`).catch(() => P.evaluate(i => UI.ans(i, 0), i));
  await P.evaluate(() => __dbg.U.sheet.forEach((v, i) => { if (v == null) UI.ans(i, 0); }));
  await P.evaluate(() => { const q = __dbg.SCRIPTS.renchiren.questions; q.forEach((x, i) => UI.ans(i, x.a)); });
  await shot(P, '10_answer'); console.log('sheet', await P.evaluate(() => JSON.stringify(__dbg.U.sheet)), await P.evaluate(() => document.querySelector('.bar').innerText)); await P.click('button.pri:has-text("交卷")');
  console.log('phase', await phase(), 'verdict', await P.evaluate(() => __dbg.G.verdict), 'score', await P.evaluate(() => JSON.stringify(__dbg.G.score.det)));
  await P.waitForTimeout(2500); await shot(P, '11_reveal'); await P.evaluate(() => UI.tlAll()); await P.evaluate(() => document.querySelector('.main').scrollTop = 99999); await shot(P, '12_reveal_end');
  /* 继续存档 */
  await P.reload(); console.log('resume button after finish (should be absent):', !!(await P.$('text=继续上次')));

  /* 凶手局：王村长。passive=总选第一个说法；smart=藏起要命的线索、在地洞上撒谎、嫁祸张村民 */
  for (const mode of ['passive', 'smart']) {
    const K = await mk({ width: 1024, height: 768 }, true);
    await K.evaluate(() => { const g = __dbg.newGame('renchiren', 'sus', ['wang']); __dbg.G = g; __dbg.U.scr = 'game'; __dbg.render(); });
    for (const ph of ['read', 'intro', 'r1']) await K.evaluate(() => adv());
    const pickI = { passive: {}, smart: { where: 0, saw: 2, village: 0, cellar: 1, zhao: 0 } }[mode];
    const answerPrompts = async () => { for (let i = 0; i < 6; i++) { const n = await K.evaluate(() => __dbg.G.prompts.length); if (!n) break; await K.evaluate(pk => { const p = __dbg.G.prompts[0]; __dbg.act({ t: 'say', pid: p.id, i: pk[p.topic] || 0 }); }, pickI); } };
    for (let i = 0; i < 10; i++) { await K.evaluate(() => __dbg.act({ t: 'listen' })); await answerPrompts(); }
    if (mode === 'passive') await shot(K, '20_killer_d1');
    await K.evaluate(() => { document.querySelectorAll('.mask').forEach(m => m.remove()); __dbg.U.modalOpen = null; adv(); });
    await K.evaluate(m => { const want = m === 'smart' ? ['c_zh_loan', 'c_cellar', 'c_zh_knife', 'c_zh_father', 'c_li_gun', 'c_hu_knife'] : ['c_zh_knife', 'c_li_gun', 'c_hu_knife', 'c_zh_father', 'c_li_gf', 'c_hu_sons'];
      for (const id of want) if (!__dbg.G.taken[id]) __dbg.act({ t: 'search', id });
      [...__dbg.G.own.wang].forEach(id => { if (m !== 'smart' || !['c_zh_loan', 'c_cellar'].includes(id)) __dbg.act({ t: 'publish', id }); }); adv(); }, mode);
    if (mode === 'smart') await K.evaluate(() => { __dbg.act({ t: 'say', topic: 'saw', i: 2 }); });
    for (let i = 0; i < 18; i++) { await K.evaluate(() => __dbg.act({ t: 'listen' })); await answerPrompts(); if (mode === 'smart') await K.evaluate(() => { const d = __dbg.SCRIPTS.renchiren.deck.wang.rebut; d.forEach((e, i) => { const k = 'wang:' + e.say.slice(0, 12); if (e.when(mkP(__dbg.G)) && !(__dbg.G.saidV || {})[k]) __dbg.act({ t: 'say', topic: 'rebut', i }); }); }); }
    await shot(K, mode === 'passive' ? '21_killer_d2' : '23_smart_d2');
    console.log(mode, 'killer AI votes', await K.evaluate(() => ['zhang', 'li', 'hu'].map(r => r + '→' + __dbg.aiVote(__dbg.G, r)).join(' ')), 'sus', await K.evaluate(() => JSON.stringify(__dbg.suspicion(__dbg.G))), 'deductions', await K.evaluate(() => __dbg.G.pub.filter(x => x[0] === 'd').join(',')));
    await K.evaluate(() => { adv(); adv(); __dbg.act({ t: 'answers', v: [1, 0, 0, 2, 0, 1, 0, 0] }); });
    console.log(mode, 'verdict', await K.evaluate(() => __dbg.G.verdict), 'score', await K.evaluate(() => JSON.stringify(__dbg.G.score.wang)));
    if (mode === 'passive') await shot(K, '22_killer_reveal');
  }
  /* 无辜的真人（胡调研）：照实回答，AI 能不能找到王村长 */
  { const Q = await mk({ width: 390, height: 844 }, true);
    await Q.evaluate(() => { const g = __dbg.newGame('renchiren', 'sus', ['hu']); __dbg.G = g; __dbg.U.scr = 'game'; __dbg.render(); });
    await shot(Q, '30_phone_read');
    for (const ph of ['read', 'intro']) await Q.evaluate(() => adv());
    await shot(Q, '31_phone_r1'); await Q.evaluate(() => adv());
    const ans = async () => { for (let i = 0; i < 6; i++) { if (!(await Q.evaluate(() => __dbg.G.prompts.length))) break; await Q.evaluate(() => { const p = __dbg.G.prompts[0]; __dbg.act({ t: 'say', pid: p.id, i: 0 }); }); } };
    for (let i = 0; i < 10; i++) { await Q.evaluate(() => __dbg.act({ t: 'listen' })); await ans(); }
    await Q.evaluate(() => { document.querySelectorAll('.mask').forEach(m => m.remove()); __dbg.U.modalOpen = null; }); await shot(Q, '32_phone_d1');
    await Q.evaluate(() => adv());
    await Q.evaluate(() => { for (const id of ['c_cellar', 'c_wang_form', 'c_zh_loan', 'c_li_gun', 'c_zh_knife', 'c_wang_tools']) if (!__dbg.G.taken[id]) __dbg.act({ t: 'search', id }); });
    await shot(Q, '33_phone_r2');
    await Q.evaluate(() => { [...__dbg.G.own.hu].forEach(id => __dbg.act({ t: 'publish', id })); adv(); });
    for (let i = 0; i < 14; i++) { await Q.evaluate(() => __dbg.act({ t: 'listen' })); await ans(); }
    await Q.evaluate(() => { document.querySelectorAll('.mask').forEach(m => m.remove()); __dbg.U.modalOpen = null; __dbg.U.target = 'wang'; __dbg.render(); }); await shot(Q, '34_phone_d2');
    await Q.evaluate(() => __dbg.act({ t: 'ask', to: 'wang', topic: 'where' })); await Q.waitForTimeout(300); await shot(Q, '35_phone_prompt');
    console.log('innocent(hu) AI votes', await Q.evaluate(() => ['wang', 'zhang', 'li'].map(r => r + '→' + __dbg.aiVote(__dbg.G, r)).join(' ')), await Q.evaluate(() => JSON.stringify(__dbg.suspicion(__dbg.G))));
    await Q.evaluate(() => { adv(); adv(); __dbg.act({ t: 'answers', v: [0, 0, 0, 2, 0, 1, 0, 0] }); }); await Q.waitForTimeout(1500);
    console.log('innocent verdict', await Q.evaluate(() => __dbg.G.verdict), await Q.evaluate(() => JSON.stringify(__dbg.G.score.hu))); await shot(Q, '36_phone_reveal'); }
  console.log('errors', errs.slice(0, 10)); await b.close(); process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
