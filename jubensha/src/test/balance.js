const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://localhost:8781/test.html');
  const res = await p.evaluate(() => {
    const SC = __dbg.SCRIPTS.renchiren, A = __dbg.apply;
    const run = (diff, role, strat) => {
      const g = __dbg.newGame('renchiren', 'sus', [role], diff); g.seed = 1234;
      const ans = pk => { for (let k = 0; k < 8 && g.prompts.length; k++) { const pr = g.prompts[0]; A(g, { t: 'say', pid: pr.id, i: (pk[pr.topic] || 0) }, 0); } };
      const pk = strat === 'smart' ? { where: 0, saw: 2, village: 0, cellar: 1, zhao: 0 } : {};
      A(g, { t: 'ready' }, 0); A(g, { t: 'intro', i: 0 }, 0); A(g, { t: 'ready' }, 0); A(g, { t: 'ready' }, 0);
      for (let i = 0; i < 10; i++) { A(g, { t: 'listen' }, 0); ans(pk); }
      A(g, { t: 'ready' }, 0);
      const want = role === 'wang' ? (strat === 'smart' ? ['c_zh_loan', 'c_cellar', 'c_zh_knife', 'c_zh_father', 'c_li_gun', 'c_hu_knife'] : ['c_zh_knife', 'c_li_gun', 'c_hu_knife', 'c_zh_father', 'c_li_gf', 'c_hu_sons']) : ['c_cellar', 'c_wang_form', 'c_zh_loan', 'c_li_gun', 'c_zh_knife', 'c_wang_tools'];
      for (const id of want) A(g, { t: 'search', id }, 0);
      [...g.own[role]].forEach(id => { if (strat !== 'smart' || !['c_zh_loan', 'c_cellar'].includes(id)) A(g, { t: 'publish', id }, 0); });
      A(g, { t: 'ready' }, 0);
      if (strat === 'smart') A(g, { t: 'say', topic: 'saw', i: 2 }, 0);
      for (let i = 0; i < 18; i++) { A(g, { t: 'listen' }, 0); ans(pk); if (strat === 'smart') SC.deck.wang.rebut.forEach((e, k) => A(g, { t: 'say', topic: 'rebut', i: k }, 0)); }
      A(g, { t: 'ready' }, 0); A(g, { t: 'say', topic: 'final', i: strat === 'smart' ? 1 : 0 }, 0); A(g, { t: 'ready' }, 0);
      A(g, { t: 'answers', v: [role === 'wang' ? 1 : 0, 0, 0, 2, 0, 1, 0, 0] }, 0);
      const s = __dbg.suspicion(g); return diff + ' ' + role + '/' + (strat || 'honest') + ': 判 ' + g.verdict + '  王 ' + s.wang.toFixed(1) + ' 张 ' + s.zhang.toFixed(1) + ' 李 ' + s.li.toFixed(1) + ' 胡 ' + s.hu.toFixed(1);
    };
    const out = []; for (const d of ['easy', 'std', 'hard']) { out.push(run(d, 'wang', 'passive'), run(d, 'wang', 'smart'), run(d, 'hu', ''), run(d, 'li', '')); } return out; });
  console.log(res.join('\n')); await b.close(); })();
