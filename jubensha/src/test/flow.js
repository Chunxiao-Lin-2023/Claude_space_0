/* 全流程卫生检查：每个阶段刷新后继续、第二局状态清干净、各难度走到底、未答问题不跨轮、答卷要答完、没 Claude 时不留“…”
   node test/flow.js   （需要 test/serve.js out 8781） */
const { chromium } = require('playwright');
const R = {}, fail = []; const ok = (k, v, good) => { R[k] = v; if (!good) fail.push(k); };
const adv = `(() => { const g = __dbg.G, r = g.seats[0]; g.prompts = g.prompts.filter(x => x.to !== r);
  if (g.phase === 'intro' && !g.introStyle[r]) __dbg.act({ t: 'intro', i: 0 });
  if (g.phase === 'r1') ['c_body', 'c_cup', 'c_candle', 'c_bullets', 'c_msg', 'c_room', 'c_map'].forEach(c => __dbg.act({ t: 'look', id: c }));
  if (g.phase === 'r2') Object.keys(SCRIPTS.renchiren.clues).filter(c => SCRIPTS.renchiren.clues[c].r === 2 && SCRIPTS.renchiren.clues[c].owner !== r).slice(0, 8).forEach(c => __dbg.act({ t: 'search', id: c }));
  if (g.phase === 'final' && r !== 'det' && !g.finalSaid[r]) __dbg.act({ t: 'say', topic: 'final', i: 0 });
  if (g.phase === 'answer') __dbg.act({ t: 'answers', v: SCRIPTS.renchiren.questions.map((q, i) => i === 0 ? (r === 'li' ? 0 : 2) : q.a) }); else __dbg.act({ t: 'ready' }); })()`;
(async () => { try {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8781/test.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('jbs-tut', '3'); }); await p.reload();
  const start = (m, r, d) => p.evaluate(([m, r, d]) => { __dbg.U.setup = { sid: 'renchiren', mode: m, role: r, diff: d }; UI.start(); TK.hide(); }, [m, r, d]);
  const ph = () => p.evaluate(() => __dbg.G.phase);
  /* 1 每个阶段刷新 → 继续上次 */
  await start('sus', 'li', 'std'); const seen = [];
  for (let k = 0; k < 14; k++) {
    const before = await ph(); const n0 = await p.evaluate(() => __dbg.G.log.length);
    await p.reload(); await p.waitForTimeout(400);
    const hasCont = await p.evaluate(() => [...document.querySelectorAll('button')].some(x => /继续上次/.test(x.innerText)));
    if (!hasCont) { ok('resume:' + before, { hasCont, buttons: await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.replace(/\s+/g, ' ').slice(0, 20))) }, false); break; }
    await p.click('button:has-text("继续上次")'); await p.waitForTimeout(300);
    const after = await ph(), n1 = await p.evaluate(() => __dbg.G.log.length), scr = await p.evaluate(() => __dbg.U.scr), tk = await p.evaluate(() => getComputedStyle(document.querySelector('.tk-root')).display);
    seen.push(before); ok('resume:' + before, { hasCont, after, logKept: n1 === n0, scr, tk }, hasCont && after === before && n1 === n0 && scr === 'game' && tk === 'none');
    if (before === 'reveal') break; await p.evaluate(adv); await p.waitForTimeout(150);
  }
  ok('resume:allPhases', seen.join('>'), seen.includes('reveal'));
  /* 2 第二局：状态清干净 */
  await p.evaluate(() => { __dbg.U.sheet = [1, 1, 1, 1, 1, 1, 1, 1]; __dbg.U.hintOk = 1; __dbg.U.linkSel = ['c_body']; __dbg.U.target = 'hu'; });
  await p.click('.bar button:has-text("再玩")'); await p.waitForTimeout(300);
  const g2 = await p.evaluate(() => ({ ph: __dbg.G.phase, log: __dbg.G.log.length, sheet: __dbg.U.sheet, hintOk: __dbg.U.hintOk, link: __dbg.U.linkSel, target: __dbg.U.target, own: __dbg.G.own.li.length, pub: __dbg.G.pub.length, hints: Object.keys(__dbg.G.hints).length, wrong: Object.keys(__dbg.G.wrong).length }));
  ok('again:clean', g2, g2.ph === 'read' && !g2.sheet && !g2.hintOk && !g2.link.length && !g2.target && !g2.own && !g2.pub && !g2.hints && !g2.wrong);
  /* 3 第一轮讨论没回答的问题不带进第二轮 */
  for (let k = 0; k < 6 && await ph() !== 'd1'; k++) await p.evaluate(adv);
  await p.evaluate(() => { const g = __dbg.G; g.prompts.push({ id: g.nid++, to: g.seats[0], from: 'wang', topic: 'where' }); __dbg.act({ t: 'ready' }); });
  ok('promptNotCarried', await p.evaluate(() => ({ ph: __dbg.G.phase, n: __dbg.G.prompts.length })), await p.evaluate(() => __dbg.G.phase === 'r2' && !__dbg.G.prompts.length));
  /* 4 答卷要全部答完才能交 */
  for (let k = 0; k < 6 && await ph() !== 'answer'; k++) await p.evaluate(adv); await p.evaluate(() => UI.close());
  const sub0 = await p.evaluate(() => { const b = [...document.querySelectorAll('.bar button')].pop(); return b.disabled; });
  await p.click('.main .q >> nth=0 >> button >> nth=0').catch(() => {}); 
  const sub1 = await p.evaluate(() => [...document.querySelectorAll('.bar button')].pop().disabled);
  ok('answerNeedsAll', { empty: sub0, one: sub1 }, sub0 && sub1);
  await p.evaluate(() => { const q = SCRIPTS.renchiren.questions[0]; __dbg.act({ t: 'answers', v: [q.roles.indexOf(__dbg.G.seats[0]), 1, 1, 1, 1, 1, 1, 1] }); });
  ok('selfVoteRejected', await ph(), await ph() === 'answer');
  /* 5 三档难度、两种模式都走到真相，无报错；结局按立场 */
  for (const [m, r, d] of [['det', null, 'easy'], ['det', null, 'hard'], ['sus', 'wang', 'hard'], ['sus', 'hu', 'easy']]) {
    await start(m, r, d); for (let k = 0; k < 14 && await ph() !== 'reveal'; k++) await p.evaluate(adv); await p.waitForTimeout(200);
    const out = await p.evaluate(() => ({ ph: __dbg.G.phase, outcome: (document.querySelector('.outcome') || {}).textContent, rate: (document.querySelector('.rate, .stamp') || {}).textContent, epi: document.querySelectorAll('.epi, .card').length }));
    ok(`full:${m}${r || ''}:${d}`, out, out.ph === 'reveal' && !!out.outcome);
  }
  /* 6 没 Claude 时刷新：等改写的句子不留“…” */
  await start('det', null, 'std'); for (let k = 0; k < 4 && await ph() !== 'd1'; k++) await p.evaluate(adv);
  await p.evaluate(() => { __dbg.G.log.slice(-3).forEach(e => e.v = 'p'); save(); }); await p.reload(); await p.waitForTimeout(300); await p.click('button:has-text("继续上次")'); await p.waitForTimeout(300);
  ok('noStuckDots', await p.evaluate(() => ({ p: __dbg.G.log.filter(e => e.v === 'p').length, dots: document.querySelectorAll('.msg .dots').length })), await p.evaluate(() => !__dbg.G.log.some(e => e.v === 'p') && !document.querySelectorAll('.msg .dots').length));
  ok('pageerrors', errs, !errs.length);
  console.log(JSON.stringify(R, null, 1)); console.log(fail.length ? 'FAIL ' + fail.join(', ') : 'ALL OK'); await b.close(); process.exit(fail.length ? 1 : 0);
  } catch (e) { console.log(JSON.stringify(R, null, 1)); console.log('CRASH', e.message.split('\n')[0]); process.exit(2); }
})();
