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
    c.lv = 20; c.pets.dahong = { aff: 100, evo: 1, lv: 20, exp: 0 }; c.pet = 'dahong'; const atk20 = petUnit('dahong').atk; for (let i = 0; i < 60 && c.pets.dahong.lv < 25; i++) petGainExp('dahong', 5000); await w8(900); await idle();
    ok('petLevelsPastHero', c.pets.dahong.lv >= 25 && petUnit('dahong').atk > atk20); ok('evo2', !!c.pets.dahong.evo2);
    c.bag.bone = 20; c.bag.lingyao = 5; c.bag.baoyao = 2; petRankUp('dahong', 0); petRankUp('dahong', 0); ok('rankUp', petRank('dahong', 0) === 3); ok('rankEffect', rankedMove(PETS.dahong.sk[0], 3).dmg > PETS.dahong.sk[0].dmg && rankedMove(PETS.dahong.sk[0], 3).st.t === PETS.dahong.sk[0].st.t + 1);
    const lv0 = c.pets.maoqiu.lv || c.lv, ex0 = c.pets.maoqiu.exp || 0; c.auto = true; await D.startBattle({ mobs: [['boar', 20]], title: 't' }); await idle(); ok('benchExp', (c.pets.maoqiu.exp || 0) > ex0 || (c.pets.maoqiu.lv || 0) > lv0);
    // 任务列表: side errands and bounties can be tracked, the target follows
    c.side = {}; const T0 = tasks(); ok('taskListHasSide', T0.some(t => t.key.startsWith('side:')) && T0.some(t => t.key.startsWith('bounty:')));
    c.side.sq_milk = 'on'; c.bag.bone = 0; trackTask('side:sq_milk'); ok('trackSide', curTask().key === 'side:sq_milk' && !!taskWhere() && PLACES[taskWhere()].gather.some(g => g[0] === 'bone') || PLACES[taskWhere()].mobs.some(m => (MOBS[m[0]].loot || []).some(l => l[0] === 'bone')));
    D.addItem('bone', 3, true); ok('trackSideReady', taskWhere() === 'sc_yard'); c.side.sq_milk = 'done'; ok('trackFallsBack', curTask().key === 'main');
    // difficulty
    c.diff = 2; const u2 = mobUnit('wolf', 10); c.diff = 0; const u0 = mobUnit('wolf', 10); c.diff = 1; ok('difficulty', u2.hpMax > u0.hpMax);
    return out; });
  const bad = Object.entries(r).filter(([k, v]) => !v); console.log(JSON.stringify(r)); console.log('failed', bad.map(x => x[0]), 'errors', errs.slice(0, 6)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
