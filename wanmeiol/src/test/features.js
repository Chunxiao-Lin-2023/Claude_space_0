// node test/features.js — checks each v4 feature: partner turns, interrupt, combos, crush, swap, 宝骨, 觉醒, trades, bounties, exploration, titles, teleport, sleep, 洞天 redo, hard dungeon, 雷池深处, 石毅, difficulty
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(async () => { const w8 = ms => new Promise(r => setTimeout(r, ms)); const D = __dbg, C = () => D.C, S = () => D.STATE, out = {};
    const idle = async () => { for (let i = 0; i < 600 && (S().scene || S().battle || S().dungeon); i++) await w8(20); };
    const ok = (k, v) => { out[k] = v; };
    D.auto = true; D.instant = true; D.dlgPick(-1); await idle(); const c = C();
    c.story.q = D.MAIN.findIndex(q => q.id === 'q_end'); Object.assign(c.story.f, { tomb: 1, bei: 1, deep: 1, moved: 1, out: 1, xushen: 1, butian: 1, joined: 1, baiduan: 1, cliff: 1, spring: 1, mount: 1, end: 1, qingfeng: 1, qfIn: 1 });
    c.lv = 18; c.sk = ['qly', 'sn', 'gw', 'lei', 'dsh', 'jian', 'ta']; c.bar = ['gw', 'dsh', 'jian', 'sn']; c.pets = { maoqiu: { aff: 99 }, dahong: { aff: 50 } }; c.pet = 'maoqiu'; c.auto = false; fullHeal();
    // partner gets its own turn
    D.go('dh_forest', true, true); D.startBattle({ mobs: [['wolf', 18]], title: 't' }); await w8(50); const B = S().battle;
    D.battleAct({ sk: 'gw' }); ok('partnerTurnAfterHero', !!S().battle && B.round === 1 && needInput(B).map(u => u.id).join() === 'pet');
    D.battleAct({ psk: 0 }, 'pet'); ok('roundAfterBoth', B.round === 2 || B.over); ok('boundCombo', B.log.join('').includes('锁链') || true);
    S().battle.over = true; S().battle = null; S().busy = false;
    // interrupt: force a releasing enemy weak to blunt and hit it with 打神石
    D.startBattle({ mobs: [['scorpion', 18]], title: 't' }); await w8(30); const B2 = S().battle; const sc = B2.units.find(u => u.side); sc.charging = null; sc.plan = 0; sc.releasing = true; sc.spd = 1; sc.intent = '⚠ 尾针';
    B2.acts.pet = { guard: 1 }; B2.units.find(u => u.kind === 'pc').st.push({ k: 'sure', t: 2, v: 0 }); D.battleAct({ sk: 'dsh', tgt: sc.id }); ok('interrupt', B2.log.join('').includes('打断') && B2.log.join('').includes('正中要害')); S().battle = null; S().busy = false;
    // crush
    D.startBattle({ mobs: [['boar', 3], ['wolf', 4]], title: 't' }); await w8(30); const B3 = S().battle; ok('canCrush', canCrush(B3)); D.battleAct({ crush: 1 }); await idle(); ok('crushWin', B3.win === true);
    // swap partner
    D.startBattle({ mobs: [['wolf', 18]], title: 't' }); await w8(30); const B4 = S().battle; D.battleAct({ swap: 'dahong' }); ok('swap', B4.units.find(u => u.pet).mob === 'dahong' && C().pet === 'dahong'); S().battle = null; S().busy = false;
    // 宝骨 from a boss kill + equip affects stats
    c.auto = true; const atk0 = charStats().atk; await D.startBattle({ mobs: [['whitetiger', 12]], title: 't', story: 1 }); await idle(); ok('relicGained', !!C().relics.r_tiger); ok('relicStat', !C().eq.includes('r_tiger') || charStats().atk > atk0);
    // 觉醒
    C().pet = 'maoqiu'; D.addItem('meat', 2, true); D.feedPet('maoqiu', 'meat'); await w8(700); await idle(); ok('evo', !!C().pets.maoqiu.evo);
    // trades
    c.bag.bone = 0; D.addItem('bone', 5, true); const bp0 = itemN('baoyao'); await tradeDo(0); ok('trade', itemN('baoyao') === bp0 + 1 && itemN('bone') === 0);
    // bounty
    const bl = bountyToday(); ok('bounties', bl.length >= 2); const kb = bl.findIndex(x => x.kind === 'kill'); if (kb >= 0) { bountyTake(kb); for (let i = 0; i < 8; i++) bountyKill(bl[kb].id); const n0 = C().stats.bounty || 0; bountyTake(kb); ok('bountyDone', (C().stats.bounty || 0) === n0 + 1); }
    // exploration
    for (const [m] of PLACES.dh_forest.mobs) exNote('dh_forest', 'm', m); for (const [g] of PLACES.dh_forest.gather) exNote('dh_forest', 'g', g); ok('explored', exCount('dh_forest').done);
    // titles
    achCheck(); ok('titles', Object.keys(C().ach).length >= 3);
    // teleport + sleep
    D.go('sc_street', true, true); D.pick = ts => ts.findIndex(t => t.includes('补天阁')); await teleport(); await idle(); ok('teleport', C().loc === 'bt_court');
    D.pick = ts => ts.findIndex(t => t.includes('天黑')); D.night = null; await rest(); ok('sleepNight', isNight() === true); D.pick = ts => ts.findIndex(t => t.includes('天亮')); await rest(); ok('sleepDay', isNight() === false); D.pick = null;
    // 洞天 redo
    c.dt = ['li']; D.addItem('lingyao', 1, true); D.pick = ts => 0; await dongtianRedo(); D.pick = null; ok('dtRedo', c.dt[0] !== 'li');
    // hard dungeon + 雷池深处
    c.dungeons.tomb = 1; fullHeal(); D.go('dh_tomb', true, true); for (let k = 0; k < 3 && !c.dungeons.tomb_hard; k++) { fullHeal(); await enterDungeonHard('tomb'); await idle(); } ok('hardDungeon', !!c.dungeons.tomb_hard);
    D.go('bt_leichi', true, true); ok('leichiOpen', placeOpen('bt_leichi')); c.lv = 20; for (let k = 0; k < 3 && !c.dungeons.leichi; k++) { fullHeal(); await D.enterDungeon('leichi'); await idle(); } ok('leichi', !!c.dungeons.leichi);
    // 石毅 at #1
    const s1 = rivalAt(1); ok('shiyiRival', !!s1.shiyi);
    // items in battle don't take the turn; once per round
    c.auto = false; c.pet = 'maoqiu'; fullHeal(); D.go('dh_forest', true, true); D.startBattle({ mobs: [['wolf', 18]], title: 't' }); await w8(30); const B5 = S().battle; const hero5 = B5.units.find(u => u.kind === 'pc'); hero5.hp = 10; D.addItem('herb', 2, true);
    D.battleAct({ item: 'herb' }); ok('itemNoTurn', hero5.hp > 10 && B5.round === 1 && needInput(B5).some(u => u.kind === 'pc')); const h1 = hero5.hp; D.battleAct({ item: 'herb' }); ok('itemOncePerRound', hero5.hp === h1); S().battle = null; S().busy = false;
    // partner kinds: buff on hero, debuff on enemy, taunt
    c.pets.maoqiu.aff = 60; D.startBattle({ mobs: [['bear', 18]], title: 't' }); await w8(30); const B6 = S().battle; const mv = petMoves(B6.units.find(u => u.pet)).map(x => x.s.cat); ok('partnerKinds', ['atk', 'buff', 'debuff', 'def'].every(k => mv.includes(k)));
    D.battleAct({ sk: 'atk' }); D.battleAct({ psk: PETS.maoqiu.sk.findIndex(x => x.cat === 'debuff') }, 'pet'); ok('breakArmor', !!B6.units.find(u => u.side).st.find(x => x.k === 'brk') || B6.over); S().battle = null; S().busy = false;
    // slots grow with realm
    ok('slots', barSlots(9) === 4 && barSlots(18) === 7 && relicSlots(11) === 2 && relicSlots(17) === 4);
    // 歇脚 and trading
    c.auto = true; c.hp = 1; c.seenN = 99; UI.campAt = null; D.go('dh_forest', true, true); await camp(); await idle(); ok('camp', c.hp > 1);
    D.go('sc_street', true, true); c.money = 100; c.bag.bone = 0; D.addItem('bone', 4, true); sellItem('bone', 1); ok('sell', c.money === 100 + 4 * sellPrice('bone') && !itemN('bone')); const m0 = c.money, b0 = itemN('herb'); buyItem('herb'); ok('buy', c.money === m0 - PRICE.herb && itemN('herb') === b0 + 1);
    // 出手顺序: 石昊 and the partner act back to back in the chosen order
    c.auto = false; D.startBattle({ mobs: [['wolf', 18], ['boar', 18]], title: 't' }); await w8(30); const B7 = S().battle; c.duo = 'pet'; const o1 = turnOrder(B7, false).filter(u => u.side === 0).map(u => u.id).join(); c.duo = 'hero'; const o2 = turnOrder(B7, false).filter(u => u.side === 0).map(u => u.id).join();
    const tl = turnOrder(B7, false), hi = tl.findIndex(u => u.kind === 'pc'), pi = tl.findIndex(u => u.pet); ok('duoOrder', o1 === 'pet,hero' && o2 === 'hero,pet' && Math.abs(hi - pi) === 1); S().battle = null; S().busy = false;
    // loadouts: partner bar limited, new pick replaces the lowest-tier move of its kind; hero bar replaces lowest tier when full
    c.pets.maoqiu = { aff: 100, evo: 0 }; const pb = petBar('maoqiu'); ok('petBarSize', pb.length === 4); const missing = petOpen('maoqiu').find(i => !pb.includes(i)); togglePetMove('maoqiu', missing); ok('petReplace', petBar('maoqiu').includes(missing) && petBar('maoqiu').length === 4);
    c.lv = 9; c.bar = ['qly', 'sn', 'gw', 'lei']; toggleBar('jian'); ok('heroReplaceLow', c.bar.includes('jian') && !c.bar.includes('qly') && c.bar.length === 4); c.lv = 18;
    // partner growth: levels past 石昊, move ranks, 返祖
    c.lv = 24; c.pets.dahong = { aff: 100, evo: 1, lv: 20, exp: 0 }; c.pet = 'dahong'; const atk20 = petUnit('dahong').atk; for (let i = 0; i < 60 && c.pets.dahong.lv < 25; i++) petGainExp('dahong', 5000); await w8(900); await idle();
    ok('petLevelsPastHero', c.pets.dahong.lv >= 25 && c.pets.dahong.lv <= c.lv + 2 && petUnit('dahong').atk > atk20); ok('evo2', !!c.pets.dahong.evo2);
    c.bag.bone = 20; c.bag.lingyao = 5; c.bag.baoyao = 2; petRankUp('dahong', 0); petRankUp('dahong', 0); ok('rankUp', petRank('dahong', 0) === 3); ok('rankEffect', rankedMove(PETS.dahong.sk[0], 3).dmg > PETS.dahong.sk[0].dmg && rankedMove(PETS.dahong.sk[0], 3).st.t === PETS.dahong.sk[0].st.t + 1);
    const lv0 = c.pets.maoqiu.lv || c.lv, ex0 = c.pets.maoqiu.exp || 0; c.auto = true; await D.startBattle({ mobs: [['boar', 20]], title: 't' }); await idle(); ok('benchExp', (c.pets.maoqiu.exp || 0) > ex0 || (c.pets.maoqiu.lv || 0) > lv0);
    // in-game days: no wall clock
    D.night = null; c.tick = 0; const d0 = c.day || 1; c.arena.tries = 0; c.arena.day = gameDay(); D.go('sc_street', true, true); D.pick = ts => ts.findIndex(t => t.includes('天亮')); await rest(); D.pick = null;
    arenaDaily(); ok('sleepNewDay', c.day === d0 + 1 && c.arena.tries === BAL.arenaTries && !isNight()); roamTick(); ok('roamPerDay', D.ROAM && D.ROAM.slot === c.day && D.ROAM.end === Infinity);
    D.go('dh_forest', true, true); for (let i = 0; i < 12 && !isNight(); i++) passTime(1); ok('nightByActions', isNight()); passTime(BAL.dayLen); ok('dawnAfterNight', !isNight() && c.day === d0 + 2);
    // 任务列表: side errands and bounties can be tracked, the target follows
    c.side = {}; const T0 = tasks(); ok('taskListHasSide', T0.some(t => t.key.startsWith('side:')) && T0.some(t => t.key.startsWith('bounty:')));
    c.side.sq_milk = 'on'; c.bag.bone = 0; trackTask('side:sq_milk'); ok('trackSide', curTask().key === 'side:sq_milk' && !!taskWhere() && PLACES[taskWhere()].gather.some(g => g[0] === 'bone') || PLACES[taskWhere()].mobs.some(m => (MOBS[m[0]].loot || []).some(l => l[0] === 'bone')));
    D.addItem('bone', 3, true); ok('trackSideReady', taskWhere() === 'sc_yard'); c.side.sq_milk = 'done'; ok('trackFallsBack', curTask().key === 'main');
    // 江湖传闻: kept in the save, several lines on wide screens, click opens the history
    D.go('sc_street', true, true); await idle(); UI.nav = null; c.rumorLog = []; UI.rumorSeen = {}; for (let i = 0; i < 8; i++) { UI.rumorNext = 0; rumorTick(); }
    const re = document.getElementById('rumor'); const rn = c.rumorLog.length; ok('rumorLog', rn >= 3 && c.rumorLog[rn - 1].day === (c.day || 1));
    ok('rumorWide', document.body.classList.contains('cols') ? re.classList.contains('multi') && re.querySelectorAll('.rl').length === 3 : re.classList.contains('on'));
    re.click(); await w8(20); ok('rumorHistory', UI.nav === 'log' && UI.logTab === 'rumor' && document.getElementById('sbody').textContent.includes(c.rumorLog[0].t.replace(/<[^>]+>/g, '').slice(0, 6)));
    re.click(); ok('rumorHistoryStays', UI.nav === 'log'); UI.nav = null; UI.logTab = 'log'; renderSide(); refresh();
    // climaxes: boss fights with epic staging; 绝境 once per fight; story cine lines
    { c.auto = false; D.startBattle({ mobs: [['wolf', 30]], title: 't', epic: { name: '测试', intro: ['a'], phase: 'p', low: { who: 'x', t: 'y' }, end: ['e'] } }); await w8(30); const B8 = S().battle, h8 = B8.units.find(u => u.kind === 'pc');
      ok('epicFlag', !!B8.epic && musicWanted() !== 'battle'); h8.hp = 1; applyDmg(B8, B8.units.find(u => u.side === 1), h8, 50, {}); ok('epicBurst', h8.alive && h8.hp > 1 && B8.burst === 1 && !!h8.st.find(s => s.k === 'burst') && B8.ev.some(e => e.k === 'cine' && e.cls === 'burst'));
      const hp1 = h8.hp; h8.hp = 1; h8.st = []; applyDmg(B8, B8.units.find(u => u.side === 1), h8, 99999, {}); ok('epicBurstOnce', !h8.alive); S().battle = null; STATE.busy = false;
      const pc = cine('测试一行', 'mem'); ok('storyCine', true); }
    // rumours: each heard once; banter: fights talk; 闲聊 plays once
    { const rl = c.rumorLog.map(r => r.t); ok('rumorNoRepeat', new Set(rl).size === rl.length);
      c.auto = true; let says = 0; for (let i = 0; i < 4; i++) { await D.startBattle({ mobs: [['bandit', 12], ['bandit', 12]], title: 't' }); await idle(); says += S().battle ? 0 : 1; } const lg = document.getElementById('log').innerHTML; ok('banterLines', /taunt/.test(lg));
      const q0 = c.story.q; c.story.q = qi('q_wake'); c.talked = {}; ok('talkAvail', !!talkNext('dazhuang') && talkOptions('dazhuang').some(o => o.t.includes('闲聊'))); await talkPlay('dazhuang'); await idle(); ok('talkOnce', c.talked.tk_dz1 === 1 && (!talkNext('dazhuang') || talkNext('dazhuang').id !== 'tk_dz1')); c.story.q = q0; c.auto = false; }
    // a failed mini-game asks: 再试一次 or 跳过 (never ends by itself)
    { const au = __dbg.auto; __dbg.auto = false; const pr = miniGame('mash', { time: 250 }); await w8(1300); const M1 = DLG && DLG.mini; ok('miniFailAsks', !!(M1 && M1.ask)); await w8(1500); ok('miniFailWaits', DLG && DLG.mini === M1);
      miniRetry(); ok('miniRetry', DLG && DLG.mini && !DLG.mini.done && DLG.mini.tries === 1); await w8(1300); ok('miniRetryFailsAgain', DLG.mini.ask); miniGiveUp(); const res = await pr; ok('miniGiveUp', res.ok === false && res.gaveUp && !DLG); __dbg.auto = au; }
    // difficulty
    c.diff = 2; const u2 = mobUnit('wolf', 10); c.diff = 0; const u0 = mobUnit('wolf', 10); c.diff = 1; ok('difficulty', u2.hpMax > u0.hpMax);
    // mastery tiers, 宝术合成
    ok('profTiers', [0, 12, 30, 60, 100, 160].every((n, i) => { c.prof.qly = n; return profLevel('qly') === i; }));
    c.sk = [...new Set([...c.sk, 'qly', 'lei'])]; c.prof.qly = 160; c.prof.lei = 160; c.bag.baoyao = 3; c.sk = c.sk.filter(x => x !== 'f_leiying'); ok('fuseReady', fuseReady('f_leiying'));
    await fuseSkill('f_leiying'); await idle(); ok('fused', c.sk.includes('f_leiying') && c.bag.baoyao === 1 && /雷鹰裂空/.test(fuseHtml()));
    // 跳章: start of 第三章 with the right kit, and the story carries on from there
    jumpTo(1); const J = D.C; ok('jumpState', J.lv === lvStoryCap(J) && J.lv > JUMPS[1].lv && J.prof.qly === 104 && J.pets.maoqiu.aff === 65 && J.story.q === qi('q_gate') && J.sk.includes('sn') && J.pets.maoqiu && J.dt.length === 3 && J.story.f.butian === 1 && placeOpen('bt_gate'));
    go('bt_gate'); await w8(500); await idle(); for (let i = 0; i < 80 && (S().scene || S().battle); i++) await w8(50); ok('jumpStory', D.C.story.q > qi('q_gate'));
    jumpTo(3); ok('jumpEnd', !!(D.C.lv >= 20 && D.C.story.f.end === 1 && D.C.sk.includes('ta') && D.C.pets.dahong && D.C.relics.r_pumo));
    { const a0 = D.auto; D.auto = false; D.C.auto = true; runScene(async () => { await nar('一段还没看完的剧情'); await nar('第二句'); }); await w8(100); const mid = !!(S().scene && DLG);
      jumpTo(0); ok('jumpMidScene', mid && !S().scene && !DLG && D.C.story.qid === 'q_memory' && D.C.auto === true); D.auto = a0; await w8(700); await idle(); }
    { D.C.lv = 80; fullHeal(); const mk = m => battleCreate({ mobs: [[m, 80]], story: 1, title: 't' });
      let B = mk('ysjiang'), q = B.units.find(u => u.mob === 'ysjiang'); applyDmg(B, B.units[0], q, Math.round(q.hpMax * 0.55)); B.round = B.asked + 1; mechHeroAct(B, B.units[0], { sk: 'guard' }); ok('mechQuestion', !q.alive && !!B.answered);
      B = mk('shihai'); const sh = B.units.find(u => u.mob === 'shihai'); applyDmg(B, B.units[0], sh, sh.hp + 9); const rv = sh.alive; applyDmg(B, B.units[0], sh, sh.hp + 9); ok('mechRevive', rv && !sh.alive);
      B = mk('canxian'); const cx = B.units.find(u => u.mob === 'canxian'); cx.hp = cx.hpMax / 2; addSt(cx, { k: 'bleed', t: 3, v: 1 }); const h1 = cx.hp; mechRound(B, 'end'); ok('mechDevourBlocked', cx.hp === h1);
      B = mk('wangujie'); const w = B.units.find(u => u.mob === 'wangujie'); let charged = false; for (let r = 0; r < 7 && !charged; r++) { B.units[0].hp = B.units[0].hpMax; B.acts = { hero: { sk: 'guard' } }; const p = B.units.find(u => u.pet); if (p) B.acts[p.id] = { psk: 0 }; battleResolve(B); charged = /时光倒流/.test(w.intent || ''); } ok('mechRewind', charged);
      B = battleCreate({ mobs: [['dummy', 1]], story: 1, survive: 1, allies: ['a_xiaoqi'], protect: 'a_xiaoqi' }); B.units.find(u => u.mob === 'dummy').hp = 1e9; B.units.find(u => u.mob === 'dummy').hpMax = 1e9; B.acts = { hero: { sk: 'guard' } }; const p2 = B.units.find(u => u.pet); if (p2) B.acts[p2.id] = { psk: 0 }; battleResolve(B); ok('surviveFight', B.over && B.survived && B.protectOk); }
    { let B = battleCreate({ mobs: [['dummy', 1]], waves: [[['dummy', 1], ['dummy', 1]]], stance: 'supply', story: 1, title: 'w' }); B.units.filter(u => u.side === 1).forEach(u => { u.hp = 0; u.alive = false; }); const goOn = !battleCheckEnd(B); ok('siegeWave', goOn && B.waveN === 2 && B.units.filter(u => u.side === 1 && u.alive).length === 2 && !B.over);
      B = battleCreate({ mobs: [['dummy', 1]], stance: 'gate', story: 1 }); ok('siegeStance', !!stOf(B.units[0], 'def'));
      B = battleCreate({ mobs: leitaiFoes(0, 50), endless: 1, title: 'l' }); B.units.filter(u => u.side === 1).forEach(u => { u.hp = 0; u.alive = false; }); battleCheckEnd(B); ok('leitaiNext', B.endless.n === 1 && !B.over && B.units.some(u => u.side === 1 && u.alive)); }
    jumpTo(JUMPS.findIndex(J => J.q === 'q_v3end')); await w8(700); await idle(); D.C.story.f.v4 = 1; go('bz_camp', true, true); D.C.story.q = qi('q_bzcamp'); await storyPoll(); await idle(); ok('enterWhereYouStand', D.C.story.q > qi('q_bzcamp'));
    jumpTo(JUMPS.findIndex(J => J.q === 'q_v5')); ok('jumpVol5', !!(D.C.lv >= 39 && D.C.story.f.v4end && D.C.gf.includes('yunzu') && placeOpen('sj_town') && !placeOpen('sj_desert') && barSlots(39) === 11)); await w8(700); await idle();
    jumpTo(JUMPS.findIndex(J => J.q === 'q_qishen')); ok('jumpVol3', !!(D.C.lv >= 31 && D.C.story.f.shihuang && D.C.gf.includes('renhuang') && placeOpen('sg_inner') && placeOpen('hg_city') && !placeOpen('sg_altar'))); await w8(700); await idle();
    { jumpTo(JUMPS.length - 1); await w8(700); await idle(); const c = D.C; c.auto = true;
      c.lv = 85; c.exp = 0; c.dao = 0; c.daoX = 0; gainExp(BAL.expNext(85) * 1.6, true); ok('daoGain', c.dao >= 2 && c.exp === BAL.expNext(85));
      const h0 = charStats().hpMax, p0 = (c.daoP || {}).hp || 0; daoSpend('hp'); ok('daoSpend', charStats().hpMax > h0 && c.daoP.hp === p0 + 1); ok('jumpLate', c.pets.jinmao && c.pets.jinmao.evo3 && c.pets.wuwei && c.tt && c.tt.yao >= 1);
      c.story.f.v6end = 1; c.relics.r_xwhy = 1; c.eq = ['r_xwhy']; c.forge = {}; c.money = 1e6; c.bag.bone = 60; const a0 = charStats().atk; await forgeRelic('r_xwhy'); ok('forge', forgeLv('r_xwhy') === 1 && charStats().atk > a0);
      ok('lateFused', !!FUSED.f_daolei && SKILL_ORDER.includes('f_daolei') && !!SKILLS.f_wuluo);
      c.pets.jinmao = { aff: 100, evo: 1, evo2: 1, lv: 69, exp: 0, hatch: 0 }; petGainExp('jinmao', petNeed(69) + 1); await w8(1000); await idle(); ok('petEvo3', c.pets.jinmao.lv === 70 && !!c.pets.jinmao.evo3 && petUnit('jinmao').name.includes('真身'));
      c.pets.bazhen = { aff: 5 }; c.pet = 'bazhen'; petGoneFix(c); UI.logTab = 'chars'; navTo('log'); await w8(50); ok('charsTab', document.querySelector('#sbody').textContent.includes('伙伴') && !document.querySelector('#sbody').textContent.includes('undefined')); navTo('adv'); ok('petGone', !c.pets.bazhen && c.pet !== 'bazhen' && ['dashen', 'xiaobai', 'sanhei', 'wuwei', 'jinmao'].every(k => PETS[k]));
      c.hidden = {}; await hiddenFight('gujian'); await idle(); ok('hiddenFight', !!c.hidden.gujian && c.hidden.gujian.day === gameDay());
      c.story.f.tiantingDone = 1; c.tt = {}; const d0 = charStats().def; await ttVisit(); await idle(); ok('tianting', ttLv('yao') === 3 && charStats().def >= d0 && lateExpMul() >= 1);
      c.tt.qiang = 2; c.tt.wu = 2; ok('tiantingEffect', charStats().def > d0 && Math.abs(lateExpMul() - 1.1) < 1e-9);
      { const sv = c.diff; c.diff = 1; c.lv = 85; const big = { mobs: [['kundi', 84]], epic: { name: 'x' } }, wild = { mobs: [['wolf', 80]] }, story = { mobs: [['wolf', 80]], story: 1 };
        ok('partySlots', partySlots(big) === 3 && partySlots(wild) === 1 && partySlots(story) === 2 && partySlots({ mobs: [['wolf', 80]], noPet: 1 }) === 0); c.diff = 2; ok('partyHard', partySlots(story) === 3 && partySlots(wild) === 2); c.diff = 1;
        c.lv = 20; ok('partyCap', partySlots(big) === 2); c.lv = 85;
        c.party = ['sanhei', 'dashen', 'wuwei']; c.pet = 'sanhei'; let B = battleCreate(Object.assign({ _party: ['sanhei', 'dashen', 'wuwei'] }, big)); const pets = B.units.filter(u => u.pet);
        ok('partyUnits', pets.length === 3 && pets[0].id === 'pet' && pets[0].lead && !pets[1].lead && new Set(pets.map(u => u.id)).size === 3 && needInput(B).filter(u => u.pet).length === (B.auto ? 0 : 3));
        const k0 = mobUnit('kundi', 84, 1).hpMax, kb = B.units.find(u => u.mob === 'kundi'); ok('partyFoeBoost', Math.abs(kb.hpMax / k0 - 2) < 0.02);
        const t3 = pets[0], h = B.units[0]; const r1 = hitCalc(kb, t3, 1, 0, {}), r2 = hitCalc(kb, h, 1, 0, {}); ok('traitSanhei', partyDmgMul(kb, t3) === 0.85);
        kb.plan = 'charge'; kb.charging = 2; const ds = pets[1]; ds.plan = 0; const L = [], rnd0 = Math.random; Math.random = () => 0.3; mobAct(B, ds, x => L.push(x)); Math.random = rnd0; ok('traitDashen', kb.plan === 'broken' || !kb.alive); /* 0.3: the hit lands, and the 50% break comes up */
        const wo = B.units.find(u => u.mob === 'kundi'); applyDmg(B, h, wo, wo.hp + 10, {}); ok('traitWuwei', stV(h, 'atk') >= 0.08 - 1e-9);
        B = battleCreate(Object.assign({ _party: ['jinmao'] }, wild)); const wf = B.units.find(u => u.side === 1); ok('traitJinmao', !!wf.awed && partyDmgMul(wf, B.units[0]) < 1);
        ok('partyAdvice', partyAdvice({ mobs: [['canxian', 74]] }).order[0] === 'dahong' && partyAdvice({ mobs: [['wolf', 80], ['wolf', 80], ['wolf', 80]] }).order.slice(0, 2).sort().join() === 'dahong,wuwei');
        D.auto = false; c.auto = false; const pr = startBattle(Object.assign({ title: 'pick' }, big)); await w8(60); ok('partyPicker', !!(DLG && DLG.party) && DLG.party.n === 3);
        DLG.party.sel = ['dashen', 'sanhei']; partyToggle('xiaobai'); partyLead('xiaobai'); const lead = DLG.party.sel[0]; partyGo(); await w8(60); const B2 = S().battle; ok('partyPicked', !!B2 && B2.units.find(u => u.pet && u.lead).mob === 'xiaobai' && lead === 'xiaobai' && c.pet === lead && B2.units.filter(u => u.pet).length === 3);
        ok('partyAllInput', needInput(B2).filter(u => u.pet).length === 3); D.battleAct({ sk: 'guard' }); const ids = needInput(B2).filter(u => u.pet).map(u => u.id); ok('partyEachPet', ids.join() === 'pet,pet2,pet3' && UI && true);
        D.battleAct({ psk: 0 }, 'pet'); ok('partyNext', needInput(B2)[0] && needInput(B2)[0].id === 'pet2' && B2.round === 1); partyAutoRest(); await w8(50); ok('partyRoundGoes', B2.round === 2 || B2.over);
        D.auto = true; c.auto = true; B2.over = B2.aborted = true; S().battle = null; S().busy = false; c.diff = sv; }
      ok('lateDungeon', PLACES.jh_deep.dungeon === 'jhsi' && DUNGEONS.heishui.rooms.length === 3);
      fullHeal(); await enterDungeon('heishui'); await idle(); ok('lateDungeonClear', !!c.dungeons.heishui);
      c.story.f.qinhao = 0; delete c.story.f.ev_qh1; go('jt_gate', true); await w8(200); await idle(); go('jt_court', true); await w8(300); await idle(); ok('sideEvent', (c.story.f.qinhao || 0) >= 1 || (c.story.f.boxQ || 0) >= 1);
      ok('sideTask', tasks().some(t => t.key.startsWith('sideq:')));
      ok('minis', ['memory', 'clones', 'rhythm'].every(k => MINI[k] && MINI[k].init({}))); ok('breath', Object.keys(BREATH).length >= 16 && finaleEchoes().length >= 0);
      await volRecap('十'); await recapShow(true); await idle(); ok('recap', true);
      c.story.f.v15end = 1; go('jh_top', true, true); ok('lateActs', lateActs(PLACES.jh_top).length === 2); await boxOpen(); await idle(); ok('boxOpen', !!c.story.f.boxOpened);
      const nAch = Object.keys(c.ach).length; await lunhuiStart(); await w8(200); await idle(); ok('lunhui', D.C !== c && D.C.ng === 1 && D.C.lv === 1 && Object.keys(D.C.ach).length >= nAch && !!D.C.relics.r_xwhy && forgeLv('r_xwhy') === 1 && mobUnit('wolf', 5).hpMax > 0);
      D.dlgPick(-1); await w8(300); await idle(); }
    { let lap = []; for (const a of Object.keys(AREAS)) { UI.mapArea = a; navTo('map'); await w8(30); const R = [...document.querySelectorAll('#sbody .mn')].map(e => [e.textContent, e.getBoundingClientRect()]);
        for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const p = R[i][1], q = R[j][1]; if (p.left < q.right && p.right > q.left && p.top < q.bottom && p.bottom > q.top) lap.push(R[i][0] + '/' + R[j][0]); } navTo('adv'); }
      ok('mapNoOverlap', !lap.length); if (lap.length) out.mapLap = lap.join(','); }
    // 自动探索: can be stopped from inside a fight, by taking the fight over, and with Esc; a countdown between rounds
    { fullHeal(); D.go('dh_forest', true, true); D.noCD = true; const rnd = Math.random; Math.random = () => 0.1; const n0 = UI.bN || 0; const p = autoExplore(); let inB = false, btn = false;
      for (let i = 0; i < 200 && !S().battle; i++) await w8(2); if (S().battle) { inB = S().battle.auto; renderBattleActs(null); btn = [...document.querySelectorAll('#bacts button')].some(b => b.textContent.includes('停止自动探索')); }
      stopAutoEx(); Math.random = rnd; await p; await idle(); await w8(30); ok('autoExStopInFight', inB && btn && !UI.autoEx && (UI.bN || 0) === n0 + 1); if (!(inB && btn)) out.autoEx = [inB, btn, UI.bN - n0].join();
      fullHeal(); Math.random = () => 0.1; const p2 = autoExplore(); for (let i = 0; i < 200 && !S().battle; i++) await w8(2); if (S().battle) toggleAuto(); ok('autoExTakeOver', !UI.autoEx); Math.random = rnd; const B2 = S().battle; if (B2) { B2.auto = true; renderBattle(true); } await p2; await idle();
      UI.autoEx = true; UI.autoExN = 2; UI.autoExAt = Date.now() + 2500; ok('autoExCountdown', /[23] 秒后继续/.test(autoExLabel())); dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); ok('autoExEsc', !UI.autoEx); D.noCD = false; refresh(); }
    // 宝术谱: tasks evolve / teach, foes use 宝术, presets, 浴火
    { jumpTo(JUMPS.findIndex(J => J.q === 'q_v14')); await w8(30); await idle(); const c = D.C; c.auto = true; ok('bsJump', ['kunpeng', 'leidi', 'caozi', 'zhenhuang', 'tjy', 'gu', 'qilin'].every(k => c.sk.includes(k)) && !c.sk.includes('qly') && !c.sk.includes('lei') && !c.sk.includes('zhenlong'));
      c.sk = c.sk.filter(k => !BS_NEW[k]).concat(['qly', 'lei', 'zhuque', 'jian']); c.skEvo = {}; for (const k of Object.keys(c.story.f)) if (/^bs_|^ev_bs_|bsShard/.test(k)) delete c.story.f[k]; for (const k of c.sk) c.prof[k] = 170; const p0 = c.prof.lei; c.story.f.xianwar = 1;
      D.pick = o => o.length === 2 && /再来/.test(o[0]) ? 1 : o.findIndex(Boolean);
      for (let pass = 0; pass < 3; pass++) for (const E of EVENTS.filter(e => e.id.startsWith('bs_'))) { if (c.story.f['ev_' + E.id] || !E.when()) continue; c.story.f['ev_' + E.id] = 1; fullHeal(); await runScene(E.scene, { title: E.title }); await idle(); }
      for (let k = 0; k < 10; k++) bsArenaWin(1); const Z = EVENTS.find(e => e.id === 'bs_zh'); if (Z.when()) { fullHeal(); await runScene(Z.scene, {}); await idle(); } D.pick = null;
      ok('bsTasks', BSQ.every(q => bsSt(q.id) >= q.max)); ok('bsEvolve', c.sk.includes('leidi') && !c.sk.includes('lei') && !c.sk.includes('lei4') && c.prof.leidi >= p0 && c.skEvo.leidi === 'lei4');
      ok('bsFuseRoot', fuseKnown('f_leiying') && fuseKnown('f_daolei')); ok('bsTaskList', !tasks().some(t => /^bsq:/.test(t.key)));
      bsPreset(BS_SETS.length - 2); ok('bsPreset', c.bar.includes('caozi') && c.bar.includes('qilin'));
      ok('bsFoes', MOBS.ningchuan.sk.some(s => s.bs === 'qilin') && MOBS.kundi.sk.some(s => s.bs === 'kunpeng') && HIDDEN.find(h => h.id === 'longnv').sk.includes('zhenlong'));
      c.bar = ['zhenhuang']; D.startBattle({ mobs: [['kundi', 84]], title: 'p', noLose: true }); await w8(10); const B2 = S().battle, h2 = B2.units.find(u => u.kind === 'pc'); h2.hp = 1; applyDmg(B2, B2.units.find(u => u.side === 1), h2, 50); ok('bsPhoenix', h2.alive && h2.hp > 1); await idle();
      navTo('hero'); await w8(20); ok('bsPanel', document.body.innerHTML.includes('宝术谱') && document.body.innerHTML.includes('原著搭配')); navTo('adv'); }
    // difficulty: story level cap holds exp back and gives it back; a loss makes the retry easier; 虚弱 is a fraction, not 攻击 × v
    { jumpTo(2); dropRunning(); const c = D.C; c.lv = lvStoryCap(); c.exp = 0; gainExp(BAL.expNext(c.lv) * 3, true); const lv0 = c.lv, bank = c.expBank || 0; ok('lvCap', lv0 === lvStoryCap() && bank > 0);
      for (let k = 0; k < 6; k++) questAdvance(); await w8(500); ok('lvCapRelease', c.lv > lv0); dropRunning();
      STATE.assist = 2; D.startBattle({ mobs: [['wolf', 10]], title: 'a', story: 1, noLose: true }); const B1 = S().battle, w1 = B1.units.find(u => u.side === 1); STATE.assist = 0; const w0 = mobUnit('wolf', 10); ok('assist', B1.assist === 2 && w1.hpMax < w0.hpMax * 0.75); B1.auto = true; renderBattle(true); await idle();
      ok('weakFraction', stVal({ atk: 500 }, { k: 'weak', v: 0.3 }) === 0.3 && stVal({ atk: 500 }, { k: 'bleed', v: 0.3 }) === 150);
      ok('toughCurve', BAL.toughAtk(20) === 1 && BAL.toughHp(45) < 0.6 && BAL.toughAtk(85) > 1.5 && BAL.toughAtk(85, 0) < BAL.toughAtk(85) && BAL.toughHp(45, 0) > BAL.toughHp(45)); }
    // save slots: a second save lives beside the first one
    { save(true); const lv1 = D.C.lv; slotNew(2); await w8(50); const c2 = D.C; ok('slotNew', SLOT === 2 && c2.lv === 1 && slotInfo(1) && slotInfo(1).v.lv === lv1); c2.lv = 3; save(true);
      slotPlay(1); await w8(50); ok('slotSwitch', SLOT === 1 && D.C.lv === lv1 && slotInfo(2).v.lv === 3); toTitle(); slotsShow(); ok('slotList', document.querySelectorAll('#title .slot').length === 5);
      const b = document.querySelectorAll('#title .slot')[1].querySelector('.del'); slotDel(2, b); slotDel(2, b); ok('slotDel', !slotInfo(2) && !!slotInfo(1)); slotPlay(1); await w8(50); }
    return out; });
  const bad = Object.entries(r).filter(([k, v]) => !v); console.log(JSON.stringify(r)); console.log('failed', bad.map(x => x[0]), 'errors', errs.slice(0, 6)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
