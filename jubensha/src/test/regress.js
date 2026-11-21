const { chromium } = require('playwright'); const OUT = process.argv[2] || '/tmp/jx'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const errs = []; const R = {};
  const mk = async (vp, touch) => { const ctx = await b.newContext({ viewport: vp, hasTouch: !!touch, isMobile: !!touch }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8781/test.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.evaluate(() => { window.adv = () => { const g = __dbg.G, r = g.seats[0]; if (g.phase === 'intro' && !g.introStyle[r]) __dbg.act({ t: 'intro', i: 0 }); if (g.phase === 'final' && r !== 'det' && !g.finalSaid[r]) __dbg.act({ t: 'say', topic: 'final', i: 0 }); __dbg.act({ t: 'ready' }); }; }); return p; };
  const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
  const closeAll = p => p.evaluate(() => { document.querySelectorAll('.mask').forEach(m => m.remove()); __dbg.U.modalOpen = null; });
  /* A：第二局里 AI 问你时，弹窗还会自动弹出吗 */
  const P = await mk({ width: 1200, height: 800 });
  const toD1 = async role => { await P.evaluate(r => { __dbg.U.setup = { sid: 'renchiren', mode: 'sus', role: r, diff: 'std' }; UI.start(); TK.hide(); }, role); for (let i = 0; i < 3; i++) await P.evaluate(() => adv()); };
  const listenUntilPrompt = async () => { for (let i = 0; i < 12; i++) { await P.evaluate(() => act({ t: 'listen' })); if (await P.evaluate(() => __dbg.G.prompts.length)) return true; } return false; };
  await toD1('hu'); await listenUntilPrompt(); R.A1_firstGamePromptPopped = await P.evaluate(() => !!document.querySelector('.mask .optl'));
  await closeAll(P); await P.evaluate(() => UI.toTitle());
  await toD1('hu'); await listenUntilPrompt(); R.A2_secondGamePromptPopped = await P.evaluate(() => !!document.querySelector('.mask .optl'));
  R.A2_pendingPrompts = await P.evaluate(() => __dbg.G.prompts.length);
  await closeAll(P);
  /* B：往上翻看记录时，新消息会不会把你拽回底部 */
  for (let i = 0; i < 6; i++) { await P.evaluate(() => { const p = __dbg.G.prompts[0]; if (p) act({ t: 'say', pid: p.id, i: 0 }); act({ t: 'listen' }); }); }
  await closeAll(P);
  await P.evaluate(() => { document.querySelector('.main').scrollTop = 0; });
  await P.evaluate(() => { const p = __dbg.G.prompts[0]; if (p) act({ t: 'say', pid: p.id, i: 0 }); act({ t: 'listen' }); });
  await closeAll(P); R.B_scrollTopAfterNewMsg = await P.evaluate(() => document.querySelector('.main').scrollTop);
  /* E：AI 没话可说以后，连点“听大家说” */
  const before = await P.evaluate(() => __dbg.G.log.filter(e => e.k === 'idle').length);
  for (let i = 0; i < 15; i++) await P.evaluate(() => { const p = __dbg.G.prompts[0]; if (p) act({ t: 'say', pid: p.id, i: 0 }); act({ t: 'listen' }); });
  R.E_idleLinesFrom15Clicks = await P.evaluate(() => __dbg.G.log.filter(e => e.k === 'idle').length) - before;
  await closeAll(P); await shot(P, 'E_idle_spam');
  /* F：“结束讨论”是不是一点就过 */
  const ph0 = await P.evaluate(() => __dbg.G.phase); await P.click('button.pri:has-text("结束讨论")'); R.F_afterOneClick = ph0 + ' -> ' + await P.evaluate(() => __dbg.G.phase) + ' / label: ' + await P.evaluate(() => document.querySelector('.bar button.pri').textContent); await P.click('button.pri:has-text("再点一次结束")'); R.F_afterTwoClicks = await P.evaluate(() => __dbg.G.phase);
  /* J：第二轮讨论里还能看到第一轮的记录吗 */
  await P.evaluate(() => act({ t: 'ready' })); R.J_d1MsgsVisibleInD2 = await P.evaluate(() => [...document.querySelectorAll('.log .msg')].length + ' msgs on screen; d1 entries in log: ' + __dbg.G.log.filter(e => e.ph === 'd1').length);
  /* D：AI 向你出示一条没映射话题的线索时，问的是什么 */
  R.D_unmappedShowTopic = await P.evaluate(() => { const sc = __dbg.SCRIPTS.renchiren; const all = Object.keys(sc.clues).concat(Object.keys(sc.facts)); return all.filter(i => !sc.showTopic[i]).length + ' of ' + all.length + ' ids fall back to topic "_" → question text: ' + topicQ(sc, '_' === '_' ? 'where' : '_'); });
  /* C：联机存档在单机里“继续上次” */
  const C = await mk({ width: 1200, height: 800 });
  await C.evaluate(() => { const g = __dbg.newGame('renchiren', 'net', ['li', 'hu']); g.room = 'AB23'; lsSet('save-renchiren', g); }); await C.reload();
  R.C_continueShown = !!(await C.$('text=继续上次'));
  if (R.C_continueShown) { await C.click('text=继续上次'); await C.click('text=单机继续'); await C.evaluate(() => act({ t: 'ready' })); R.C_afterReady = await C.evaluate(() => __dbg.G.phase + ' (ready: ' + JSON.stringify(__dbg.G.ready) + ')'); await shot(C, 'C_net_resume_stuck'); }
  /* G：投票平票有多常见（入局 1 人 + 3 AI，随机打法 40 局） */
  R.G_tieRate = await C.evaluate(() => { let tie = 0, n = 40; for (let s = 0; s < n; s++) { const roles = ['zhang', 'li', 'hu', 'wang']; const g = __dbg.newGame('renchiren', 'sus', [roles[s % 4]]); g.seed = s * 97 + 3;
      const h = roles[s % 4]; __dbg.apply(g, { t: 'ready' }, 0); __dbg.apply(g, { t: 'intro', i: 0 }, 0); __dbg.apply(g, { t: 'ready' }, 0); __dbg.apply(g, { t: 'ready' }, 0);
      for (let k = 0; k < 8; k++) { __dbg.apply(g, { t: 'listen' }, 0); while (g.prompts.length) __dbg.apply(g, { t: 'say', pid: g.prompts[0].id, i: (s + k) % 2 }, 0); }
      __dbg.apply(g, { t: 'ready' }, 0); for (let k = 0; k < 6; k++) { const ids = Object.keys(__dbg.SCRIPTS.renchiren.clues).filter(i => __dbg.SCRIPTS.renchiren.clues[i].r === 2 && !g.taken[i] && __dbg.SCRIPTS.renchiren.clues[i].owner !== h); if (ids.length) __dbg.apply(g, { t: 'search', id: ids[(s + k) % ids.length] }, 0); }
      [...g.own[h]].forEach(id => __dbg.apply(g, { t: 'publish', id }, 0)); __dbg.apply(g, { t: 'ready' }, 0);
      for (let k = 0; k < 10; k++) { __dbg.apply(g, { t: 'listen' }, 0); while (g.prompts.length) __dbg.apply(g, { t: 'say', pid: g.prompts[0].id, i: 0 }, 0); }
      __dbg.apply(g, { t: 'ready' }, 0); __dbg.apply(g, { t: 'say', topic: 'final', i: 0 }, 0); __dbg.apply(g, { t: 'ready' }, 0); __dbg.apply(g, { t: 'answers', v: [s % 4, 0, 0, 2, 0, 1, 0, 0] }, 0); if (!g.verdict) tie++; } return tie + '/' + n + ' games ended with no verdict'; });
  /* I/K：手机上的平面图和答卷 */
  const M = await mk({ width: 360, height: 740 }, true);
  await M.evaluate(() => { __dbg.U.setup = { sid: 'renchiren', mode: 'det', role: null, diff: 'std' }; UI.start(); TK.hide(); adv(); adv(); });
  await shot(M, 'I_phone_r1'); R.I_overflowX = await M.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  R.I_hotOverlap = await M.evaluate(() => { const r = [...document.querySelectorAll('.hot')].map(h => h.getBoundingClientRect()); let n = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (!(r[i].right < r[j].left || r[j].right < r[i].left || r[i].bottom < r[j].top || r[j].bottom < r[i].top)) n++; return n + ' overlapping hotspot pairs'; });
  await M.evaluate(() => { adv(); __dbg.U.target = 'li'; render(); }); await shot(M, 'K_phone_d1');
  R.K_barHeight = await M.evaluate(() => Math.round(document.querySelector('.bar').getBoundingClientRect().height) + 'px of 740');
  await M.evaluate(() => { adv(); adv(); adv(); adv(); }); await shot(M, 'K_phone_answer');
  /* N：真相页逐行播放时会不会一直重画（滚动/选中文本被打断） */
  await M.evaluate(() => act({ t: 'answers', v: [0, 0, 0, 2, 0, 1, 0, 0] })); await M.waitForTimeout(300);
  await M.evaluate(() => { document.querySelector('.main').scrollTop = 600; }); await M.waitForTimeout(1000); R.N_revealScrollKept = await M.evaluate(() => document.querySelector('.main').scrollTop);
  await shot(M, 'N_phone_reveal');
  console.log(JSON.stringify(R, null, 1)); console.log('pageerrors', errs.slice(0, 5)); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
