/* 弹窗/点击类体验回归：点了要有反应、不闪、看得到内容、不会被别的弹窗挤掉
   node test/ux.js   （需要 test/serve.js out 8781 在跑） */
const { chromium } = require('playwright');
const R = {}, fail = [];
const ok = (k, v, good) => { R[k] = v; if (!good) fail.push(k); };
(async () => {
  const b = await chromium.launch();
  for (const [vp, tag] of [[{ width: 1280, height: 800 }, 'pc'], [{ width: 390, height: 844 }, 'phone']]) {
    const p = await (await b.newContext({ viewport: vp, hasTouch: tag === 'phone', isMobile: tag === 'phone' })).newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8781/test.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('jbs-tut', '3'); }); await p.reload();
    await p.evaluate(() => { __dbg.U.setup = { sid: 'renchiren', mode: 'det', role: null, diff: 'std' }; UI.start(); TK.hide(); OPT.typing = false; });
    const to = async ph => { for (let k = 0; k < 10 && await p.evaluate(() => __dbg.G.phase) !== ph; k++) await p.evaluate(() => { const g = __dbg.G; if (g.phase === 'intro' && !g.introStyle.det) __dbg.act({ t: 'intro', i: 0 }); if (g.phase === 'r1') ['c_body', 'c_cup', 'c_candle', 'c_bullets', 'c_msg', 'c_room', 'c_map'].forEach(c => __dbg.act({ t: 'look', id: c })); __dbg.act({ t: 'ready' }); }); await p.evaluate(() => UI.close()); await p.waitForTimeout(250); };
    const mark = () => p.evaluate(() => { window.__m = document.querySelector('.mask'); });
    const same = () => p.evaluate(() => !!document.querySelector('.mask') && document.querySelector('.mask') === window.__m && document.querySelectorAll('.mask').length === 1);
    await to('d1');
    /* 1 指出关联：点选不重建弹窗，选中项有全文 */
    await p.evaluate(() => UI.modal('link')); await mark(); await p.click('.mask .linkopt >> nth=1'); await p.click('.mask .linkopt >> nth=2');
    ok(tag + ':linkNoFlash', await same(), await same());
    ok(tag + ':linkShowsText', await p.evaluate(() => document.querySelectorAll('.linksel .card').length), await p.evaluate(() => document.querySelectorAll('.linksel .card').length === 2));
    await p.evaluate(() => UI.close());
    /* 2 出示弹窗：每条线索有内容摘要 */
    await p.evaluate(() => { __dbg.U.target = 'li'; render(); UI.modal('show'); });
    ok(tag + ':showHasExcerpt', await p.evaluate(() => document.querySelectorAll('.mask .linkopt .ex').length), await p.evaluate(() => document.querySelectorAll('.mask .linkopt .ex').length >= 5));
    await p.evaluate(() => UI.close());
    /* 3 线索箱 / 剧本切标签：不闪、回到顶部 */
    for (const [k, v, tab] of [['clues', 'mtab', 'fact'], ['book', 'btab', 'bg']]) {
      await p.evaluate(k => UI.modal(k), k); await p.evaluate(() => { const d = document.querySelector('.mask .db'); d.scrollTop = 400; }); await mark();
      await p.click(`.mask .tabs button >> nth=${k === 'book' ? 0 : 2}`); await p.waitForTimeout(100);
      const st = await p.evaluate(() => document.querySelector('.mask .db').scrollTop);
      ok(tag + ':' + k + 'TabNoFlash', await same(), await same()); ok(tag + ':' + k + 'TabTop', st, st === 0);
      await p.evaluate(() => UI.close());
    }
    /* 4 正在看一张线索卡时 AI 来问你：卡片不能被挤掉；关掉后再弹问题 */
    await p.evaluate(() => showClue('c_body')); await mark();
    await p.evaluate(() => { const g = __dbg.G; g.prompts.push({ id: g.nid++, to: 'det', from: 'wang', topic: 'where' }); render(); });
    const kept = await same(); ok(tag + ':clueNotStolenByPrompt', kept, kept);
    await p.evaluate(() => UI.close()); await p.evaluate(() => render()); await p.waitForTimeout(100);
    ok(tag + ':promptAfterClose', await p.evaluate(() => (document.querySelector('.mask h3') || {}).textContent), await p.evaluate(() => /问你/.test((document.querySelector('.mask h3') || {}).textContent || '')));
    await p.evaluate(() => { __dbg.G.prompts = []; UI.close(); render(); });
    /* 4b 正在底部输入框打字时 AI 来问你：不弹窗抢焦点；发出后再弹 */
    const hasFree = await p.evaluate(() => { __dbg.G.ai = 1; render(); return !!document.querySelector('#freeq'); });
    if (hasFree) {
      await p.fill('#freeq', '张村民你'); await p.focus('#freeq');
      await p.evaluate(() => { const g = __dbg.G; g.prompts.push({ id: g.nid++, to: 'det', from: 'hu', topic: 'where' }); render(); });
      const r4 = await p.evaluate(() => ({ mask: !!document.querySelector('.mask'), focus: document.activeElement && document.activeElement.id, val: (document.querySelector('#freeq') || {}).value }));
      ok(tag + ':typingNotInterrupted', r4, !r4.mask && r4.focus === 'freeq' && r4.val === '张村民你');
      await p.evaluate(() => { document.querySelector('#freeq').value = ''; document.activeElement.blur(); __dbg.G.prompts = []; __dbg.G.ai = 0; render(); UI.close(); });
    }
    /* 5 记录里的出示/公开：点摘要能看全文 */
    await p.evaluate(() => { __dbg.act({ t: 'show', to: 'li', id: 'c_bullets' }); }); await p.waitForTimeout(200); await p.evaluate(() => UI.close());
    const hasRef = await p.evaluate(() => !!document.querySelector('.refx'));
    if (hasRef) { await p.evaluate(() => [...document.querySelectorAll('.refx')].pop().scrollIntoView()); await p.locator('.refx').last().click(); }
    ok(tag + ':logRefOpensClue', hasRef && await p.evaluate(() => (document.querySelector('.mask .cl h3') || {}).textContent), hasRef && await p.evaluate(() => !!document.querySelector('.mask .cl')));
    await p.evaluate(() => UI.close());
    /* 6 第二轮：搜到立刻弹出；已搜到的卡片能再点开看 */
    await p.evaluate(() => __dbg.act({ t: 'ready' })); await p.waitForTimeout(200); await p.evaluate(() => UI.close());
    await p.click('.main button.it >> nth=0'); await p.waitForTimeout(150);
    ok(tag + ':searchPopup', await p.evaluate(() => !!document.querySelector('.mask .cl')), await p.evaluate(() => !!document.querySelector('.mask .cl')));
    await p.evaluate(() => UI.close());
    await p.click('.main button.it.got >> nth=0'); await p.waitForTimeout(150);
    ok(tag + ':gotCardReopens', await p.evaluate(() => !!document.querySelector('.mask .cl')), await p.evaluate(() => !!document.querySelector('.mask .cl')));
    await p.evaluate(() => UI.close());
    /* 7 第二轮的提示按钮也要先确认 */
    await p.click('.bar button:has-text("提示")'); await p.waitForTimeout(100);
    ok(tag + ':r2HintConfirm', await p.evaluate(() => (document.querySelector('.mask h3') || {}).textContent), await p.evaluate(() => /用提示/.test((document.querySelector('.mask h3') || {}).textContent || '')));
    await p.evaluate(() => UI.close());
    ok(tag + ':pageerrors', errs, !errs.length);
  }
  console.log(JSON.stringify(R, null, 1)); console.log(fail.length ? 'FAIL ' + fail.join(', ') : 'ALL OK'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
