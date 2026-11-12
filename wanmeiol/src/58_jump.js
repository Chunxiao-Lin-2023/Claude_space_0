/* ================= 跳章 (for testing, or just to skip ahead) =================
   设置 → 跳章: start at the beginning of a chapter with what an average player would have by then — a little more,
   to be safe: level, 宝术 with their mastery, 功法, 洞天, partners, 宝骨, items, places opened and the story flags the
   later scenes read. It replaces the current save (two clicks to confirm). Choices along the way take their first option. */
const JUMPS = [
  { q: 'q_memory', n: '第二章 · 出村', lv: 9, exp: 0.6, loc: 'sc_street', gf: ['xixue', 'guwen', 'yaoding', 'jijing'], sk: { qly: 45, sn: 30 }, pets: { maoqiu: [35, 9] },
    relics: ['r_eagle', 'r_suanni', 'r_fengbei'], dun: ['tomb'], f: { lure: 1, tomb: 1, bei: 1, deep: 1, moved: 1, jijing: 1 }, bag: { milk: 4, herb: 5, meat: 3, lingyao: 2, baoyao: 1, bone: 6 }, money: 80, dt: 0, arena: 0 },
  { q: 'q_gate', n: '第三章 · 补天阁', lv: 12, exp: 0.4, loc: 'dh_road', sk: { qly: 80, sn: 55 }, pets: { maoqiu: [50, 12] }, relics: ['r_jiling'],
    f: { vow: 'find', out: 1, qingfeng: 1, saved: 1, xushen: 1, butian: 1, stoneName: 1 }, bag: { milk: 6, herb: 6, meat: 4, lingyao: 3, baoyao: 2, bone: 8 }, money: 150, dt: 3, arena: 85 },
  { q: 'q_baiduan', n: '第四章 · 百断山', lv: 14, exp: 0.4, loc: 'bt_court', sk: { qly: 110, sn: 75, lei: 35, gw: 30 }, pets: { maoqiu: [65, 14] },
    f: { joined: 1, bully: 1, qf: 'spar', qf2: 1 }, bag: { herb: 8, meat: 5, lingyao: 4, baoyao: 3, bone: 10 }, money: 260, dt: 5, arena: 60 },
  { q: 'q_end', n: '第二卷 · 石国', lv: 20, exp: 0, loc: 'bt_court', sk: { qly: 170, sn: 125, lei: 95, gw: 60, jian: 45, dsh: 35, ta: 20 }, pets: { maoqiu: [90, 21], dahong: [45, 20], ertuzi: [25, 19] },
    gf: ['taiyi'], relics: ['r_zhuque', 'r_lion', 'r_yu', 'r_tiger', 'r_peng', 'r_boneking', 'r_pumo'], dun: ['tiangu'], f: { qf3: 1, ev_yunxi: 1, yunxiHelp: 1, baiduan: 1, lion: 1, cave: 1, yuDone: 1, water: 1, guRegrow: 1, cliff: 1, spring: 1, carrySpring: 1, shengyao: 1, mount: 1, yunxi: 1, sawShiyi: 1, qfIn: 1, end: 1, eggWins: 8 },
    bag: { herb: 10, meat: 6, lingyao: 6, baoyao: 5, bone: 14, bulao: 1, xiantao: 1 }, money: 500, dt: 9, arena: 30 },
  { q: 'q_invite', lv: 22, exp: 0.1, loc: 'sg_market', f: {} },
  { q: 'q_v3', n: '第三卷 · 石皇', lv: 25, exp: 0.2, loc: 'sg_hou', sk: { qly: 175, sn: 165, lei: 130, gw: 90, jian: 80, dsh: 70, ta: 55 }, pets: { maoqiu: [100, 26], dahong: [70, 25], ertuzi: [45, 24] },
    relics: ['r_jinzhu', 'r_mozhu', 'r_qingluan'], dun: ['zhuchao'], f: { v2: 1, yuwang: 1, truth: 1, ziteng: 1, shouyan0: 1, jinzhu: 1, hou: 1, challenge: 1, v2end: 1, v3: 1 },
    bag: { herb: 12, meat: 8, lingyao: 8, baoyao: 7, bone: 18 }, money: 1200, dt: 9, arena: 20 },
  { q: 'q_dajie', n: '第八章 · 石皇', lv: 29, exp: 0.2, loc: 'sg_hou', gf: ['niepan', 'zhizungu'], sk: { qly: 180, sn: 175, lei: 165, gw: 120, jian: 110, dsh: 95, ta: 80, zhuque: 40, zhizun: 15 }, pets: { maoqiu: [100, 30], dahong: [85, 29], ertuzi: [60, 28] },
    relics: ['r_rongyan'], dun: ['rongyan'], f: { huohuang: 1, guBack: 1, shiyiDuel: 1, duelTalk: 'give', shiyiWin2: 1 },
    bag: { herb: 14, meat: 10, lingyao: 10, baoyao: 9, bone: 22 }, money: 2000, dt: 9, arena: 12 },
  { q: 'q_qishen', n: '第九章 · 七神', lv: 31, exp: 0.1, loc: 'sg_inner', gf: ['renhuang'], sk: { qly: 185, sn: 180, lei: 175, gw: 140, jian: 130, dsh: 115, ta: 100, zhuque: 70, zhizun: 45 }, pets: { maoqiu: [100, 32], dahong: [95, 31], ertuzi: [70, 30] },
    relics: ['r_shichong'], f: { dajie: 1, shihuang: 1 }, bag: { herb: 15, meat: 10, lingyao: 12, baoyao: 10, bone: 24 }, money: 3000, dt: 9, arena: 8 },
  { q: 'q_v3end', n: '第四卷 · 登天', lv: 34, exp: 0.1, loc: 'sg_hou', gf: ['lingshen'], sk: { qly: 190, sn: 185, lei: 180, gw: 160, jian: 150, dsh: 140, ta: 120, zhuque: 100, zhizun: 80, lunhui: 30 }, pets: { maoqiu: [100, 35], dahong: [100, 34], ertuzi: [80, 33] },
    relics: ['r_shenhuo', 'r_ziteng'], f: { qishen: 1, shengdi: 1, parents: 1, v3end: 1 }, bag: { herb: 16, meat: 12, lingyao: 14, baoyao: 12, bone: 26 }, money: 4000, dt: 9, arena: 5 },
  { q: 'q_huobye', lv: 37, exp: 0.1, loc: 'bz_camp', f: { huoBye: 2 } },
  { q: 'q_v5', n: '第五卷 · 上界', lv: 39, exp: 0.1, loc: 'sj_gate', gf: ['shuanggu', 'yunzu'], sk: { qly: 200, sn: 195, lei: 190, gw: 175, jian: 170, dsh: 165, ta: 150, zhuque: 140, zhizun: 120, lunhui: 70 }, pets: { maoqiu: [100, 40], dahong: [100, 39], ertuzi: [90, 38] },
    relics: ['r_dihuo', 'r_zhanhun', 'r_jitan'], dun: ['baojie'], f: { v4: 1, baojie: 1, bzWin: 1, bzCore: 1, altar: 1, yunzu: 1, huoBye: 2, v4end: 1 }, bag: { herb: 18, meat: 14, lingyao: 16, baoyao: 14, bone: 30 }, money: 5000, dt: 9, arena: 3 },
  { q: 'q_tianren', n: '第十三章 · 至尊古台', lv: 41, exp: 0.1, loc: 'sj_town', gf: ['wudidao'], sk: { qly: 205, sn: 200, lei: 195, gw: 185, jian: 180, dsh: 175, ta: 165, zhuque: 155, zhizun: 140, lunhui: 95, wudi: 30 }, pets: { maoqiu: [100, 42], dahong: [100, 41], ertuzi: [95, 40] },
    f: { zuixue: 1, ladder: 1, qidao: 1, dojo: 1 }, bag: { herb: 20, meat: 15, lingyao: 18, baoyao: 16, bone: 32 }, money: 6000, dt: 9, arena: 2 },
  { q: 'q_v5end', n: '第六卷 · 争霸', lv: 44, exp: 0.1, loc: 'sj_town', gf: ['zhizunye'], sk: { qly: 210, sn: 205, lei: 200, gw: 195, jian: 190, dsh: 185, ta: 175, zhuque: 165, zhizun: 155, lunhui: 120, wudi: 70 }, pets: { maoqiu: [100, 45], dahong: [100, 44], ertuzi: [100, 43] },
    relics: ['r_tianming', 'r_kuang', 'r_shenqi'], dun: ['kuangmai'], f: { tianren: 1, kuang: 1, gutai: 1, tianshen: 1, v5end: 1 }, bag: { herb: 22, meat: 16, lingyao: 20, baoyao: 18, bone: 34 }, money: 8000, dt: 9, arena: 1 },
  { q: 'q_arena', lv: 47, exp: 0.1, loc: 'sq_town', f: {} },
  { q: 'q_v7', n: '第七卷 · 仙古', lv: 49, exp: 0.1, loc: 'sq_arena', gf: ['niepanyuan'], sk: { qly: 215, sn: 210, lei: 205, gw: 200, jian: 200, dsh: 195, ta: 185, zhuque: 180, zhizun: 170, lunhui: 150, wudi: 110, liushen: 40, daluo: 20 }, pets: { maoqiu: [100, 46], dahong: [100, 46], ertuzi: [100, 46] },
    relics: ['r_baishi', 'r_ningchuan'], f: { v6: 1, yinmo: 1, shiyi3: 1, wounded: 1, liushen: 1, yinkun: 'kill', v6end: 1 }, bag: { herb: 24, meat: 18, lingyao: 22, baoyao: 20, bone: 36 }, money: 10000, dt: 9, arena: 1 },
  { q: 'q_dichong', lv: 54, exp: 0.1, loc: 'xg_palace', f: {} },
  { q: 'q_v8', n: '第八卷 · 帝关', lv: 54, exp: 0.1, loc: 'xg_gate', gf: ['xiangu'], sk: { qly: 220, sn: 215, lei: 210, gw: 205, jian: 205, dsh: 200, ta: 195, zhuque: 190, zhizun: 185, lunhui: 170, wudi: 150, liushen: 90, daluo: 70 }, pets: { maoqiu: [100, 46], dahong: [100, 46], ertuzi: [100, 46] },
    relics: ['r_dichong'], dun: ['xiangudian'], f: { v7: 1, xgAvatar: 1, xgNing: 1, xgDian: 1, br17: 1, dichong: 1, v7end: 1 }, bag: { herb: 26, meat: 20, lingyao: 24, baoyao: 22, bone: 38 }, money: 12000, dt: 9, arena: 1 },
  { q: 'q_bianhuang', lv: 58, exp: 0.1, loc: 'dg_wall', f: {} },
  { q: 'q_yy', n: '第九卷 · 异域', lv: 59, exp: 0.1, loc: 'yy_jail', gf: ['qiwang'], sk: { qly: 230, sn: 225, lei: 220, gw: 215, jian: 215, dsh: 210, ta: 205, zhuque: 200, zhizun: 200, lunhui: 190, wudi: 180, liushen: 150, daluo: 130 }, pets: { maoqiu: [100, 46], dahong: [100, 46], ertuzi: [100, 46] },
    relics: ['r_dizu'], dun: ['bianhuang'], f: { v8: 1, br18: 1, wallName: 1, br19: 1, qiwangDone: 1, wangDone: 1, crystal: 1, dizuDone: 1, bianhuang: 1, box: 1, yiyu0: 1 }, bag: { herb: 28, meat: 22, lingyao: 26, baoyao: 24, bone: 40 }, money: 15000, dt: 9, arena: 1 },
  { q: 'q_yyfalls', lv: 62, exp: 0.1, loc: 'yy_tree', f: {} },
  { q: 'q_xy', n: '第十卷 · 仙域', lv: 62, exp: 0.1, loc: 'xy_shore', gf: ['daoze'], sk: { qly: 240, sn: 235, lei: 230, gw: 225, jian: 225, dsh: 220, ta: 215, zhuque: 210, zhizun: 210, lunhui: 200, wudi: 195, liushen: 170, daluo: 150 }, relics: ['r_chiwang', 'r_chashu'],
    f: { yyHung: 1, br20: 1, yyArena: 1, yyTree: 1, daoze: 1, br21: 1, yyEnd: 1 }, bag: { herb: 30, meat: 24, lingyao: 28, baoyao: 26, bone: 42 }, money: 16000, dt: 9, arena: 1 },
  { q: 'q_anlan', lv: 64, exp: 0.1, loc: 'dg_city', f: {} },
  { q: 'q_v9', n: '第十一卷 · 清算', lv: 65, exp: 0.1, loc: 'sc_willow', gf: ['yuanshi'], f: { xy: 1, br22: 1, yuanshiDone: 1, back: 1, br23: 1, mengTalk: 1, anlan: 1, v8end: 1 }, bag: { herb: 30, meat: 24, lingyao: 28, baoyao: 26, bone: 42 }, money: 18000, dt: 9, arena: 1 },
  { q: 'q_army', lv: 68, exp: 0.1, loc: 'sc_yard', f: { wang: 'now' } },
  { q: 'q_v9end', n: '第十二卷 · 天庭', lv: 71, exp: 0.1, loc: 'sc_willow', gf: ['chongzhi'], sk: { qly: 250, sn: 245, lei: 240, gw: 235, jian: 235, dsh: 230, ta: 225, zhuque: 225, zhizun: 225, lunhui: 220, wudi: 215, liushen: 200, daluo: 190 }, relics: ['r_heian'],
    f: { br24: 1, v9: 1, envoy0: 1, wang: 'now', envoy: 1, zhizun: 1, army: 1, purge: 1, jinFate: 1, jin: 1, br25: 1, jinfeng: 1, v9end: 1 }, bag: { herb: 32, meat: 26, lingyao: 30, baoyao: 30, bone: 44 }, money: 22000, dt: 9, arena: 1 },
  { q: 'q_xwhy', lv: 75, exp: 0.1, loc: 'xy_city', f: { ttRule: 1 } },
  { q: 'q_v13', n: '第十三卷 · 帝落', lv: 75, exp: 0.1, loc: 'xy_gate', gf: ['zhenxian'], relics: ['r_canxian', 'r_xwhy'], f: { v12: 1, canxian: 1, ttRule: 1, tiantingDone: 1, br26: 1, dam: 1, xwhyDone: 1, br27: 1, zaohuaLetter: 1, v12end: 1 }, bag: { herb: 34, meat: 28, lingyao: 32, baoyao: 32, bone: 46 }, money: 26000, dt: 9, arena: 1 },
  { q: 'q_lives', lv: 79, exp: 0.1, loc: 'dl_age', f: {} },
  { q: 'q_v14', n: '第十四卷 · 异域之战', lv: 80, exp: 0.1, loc: 'dg_city', gf: ['baxi'], sk: { qly: 260, sn: 255, lei: 250, gw: 245, jian: 245, dsh: 240, ta: 240, zhuque: 240, zhizun: 240, lunhui: 235, wudi: 230, liushen: 225, daluo: 220 }, f: { v13: 1, br28: 1, dlAge: 1, baxiMem: 1, baxi: 1, br29: 1, v13end: 1 }, bag: { herb: 36, meat: 30, lingyao: 34, baoyao: 34, bone: 48 }, money: 30000, dt: 9, arena: 1 },
  { q: 'q_chiwang', lv: 83, exp: 0.1, loc: 'yy_seal', f: {} },
  { q: 'q_v15', n: '第十五卷 · 独断万古', lv: 84, exp: 0.1, loc: 'jh_dam', gf: ['zhunxiandi'], sk: { tahua: 60 }, relics: ['r_kundi'], f: { tahuaOk: 1, br30: 1, huoNight: 1, huoling: 1, liushenBack: 1, chiwangDone: 1, br31: 1, kundiWar: 1, xianwar: 1, v14end: 1 }, bag: { herb: 40, meat: 32, lingyao: 36, baoyao: 36, bone: 50 }, money: 35000, dt: 9, arena: 1 },
  { q: 'q_shihai', lv: 84, exp: 0.5, loc: 'jh_sea', f: {} },
];
function dropRunning() { // a story scene, dialogue, mini-game or fight in progress is simply abandoned: its promise never resolves
  const B = STATE.battle; if (B) { B.over = B.done = B.aborted = true; STATE.battle = null; STATE.battleRes = null; STATE.busy = false; UI.selFoe = null; }
  clearInterval(UI.miniT); DLG = null; STATE.scene = null; UI.jEntry = null; UI.hist = []; UI.cur = null; STATE.dtPending = null; renderDlg(); }
function jumpTo(i) { if (NETROLE === 'guest') { toast('只有房主能跳章'); return; } dropRunning();
  const c = newChar(); c.diff = C ? C.diff : 1; c.created = C ? C.created : now(); c.auto = C ? !!C.auto : false; for (const k of ['tut', 'tut1', 'tut2', 'tutPet']) c.seen[k] = 1; /* skipping ahead means skipping the lessons too */ const DT = ['li', 'ti', 'shou', 'su', 'feng', 'ling'];
  for (let k = 0; k <= i; k++) { const J = JUMPS[k];
    c.gf = [...new Set([...c.gf, ...(J.gf || [])])]; for (const [id, n] of Object.entries(J.sk || {})) { if (!c.sk.includes(id)) c.sk.push(id); c.prof[id] = n; }
    for (const [id, [aff, lv]] of Object.entries(J.pets || {})) c.pets[id] = { aff, lv, exp: 0, hatch: 0, evo: aff >= 100 ? 1 : 0 }; for (const r of J.relics || []) c.relics[r] = 1;
    for (const d of J.dun || []) c.dungeons[d] = 1; Object.assign(c.story.f, J.f || {}); if (J.bag) c.bag = { ...J.bag }; if (J.money) c.money = J.money; if (J.dt != null) c.dtN = J.dt; if (J.arena) c.arenaR = J.arena; }
  const J = JUMPS[i]; jumpScan(c, qi(J.q)); c.lv = J.lv; c.exp = Math.round(BAL.expNext(J.lv) * (J.exp || 0)); c.dt = DT.concat(DT).slice(0, Math.min(c.dtN || 0, Math.max(0, J.lv - 9))); const AR = c.arenaR; delete c.dtN; delete c.arenaR; c.pet = 'maoqiu'; c.story.q = qi(J.q); c.story.qid = J.q; c.loc = J.loc; c.home = PLACES[J.loc].town ? J.loc : 'sc_street';
  c.bar = c.sk.slice().sort((a, b) => SKILL_ORDER.indexOf(b) - SKILL_ORDER.indexOf(a)).slice(0, barSlots(J.lv)); c.eq = Object.keys(c.relics).slice(-relicSlots(J.lv));
  if (AR) { const r = Math.max(1, Math.round(AR * JUMP_UP.arena)); Object.assign(c.arena, { rank: r, best: r, wins: Math.round((120 - r) / 4) }); }
  jumpBoost(c, i); jumpLate(c, i);
  C = c; for (const id of Object.keys(PLACES)) if (placeOpen(id)) { C.seen[id] = 1; for (const [m] of PLACES[id].mobs || []) C.codex[m] = C.codex[m] || { wk: [] }; }
  C.ach = {}; for (const A of ACH) { try { if (A.ok()) C.ach[A.id] = now(); } catch (e) { } } // titles already earned by then: no pile of toasts
  fullHeal(); DLG = null; STATE.dungeon = null; UI.nav = null; closeModal(); $('log').innerHTML = ''; logLine(`<div class="lochead">${jumpName(J)}</div>`, 'loc');
  logLine(`<b class="lvup">跳章</b>：从「${jumpName(J)}」开始。等级、宝术、伙伴、宝骨和物品都按一路玩得不错的水平（中上）准备好了。`, 'sys'); save(true); refresh(); bannerDraw(); netSync(); setTimeout(storyPoll, 600); }
/* the later systems follow the jump too: partners met by then (with levels, affection, 觉醒/返祖/真身), 悟道 points, 天庭 */
const JUMP_PETS = [['dashen', 'cliff'], ['xiaobai', 'v2'], ['sanhei', 'v3end'], ['wuwei', 'dizuDone'], ['jinmao', 'v12end']];
function jumpLate(c, i) { const J = JUMPS[i], f = c.story.f, since = flag => JUMPS.findIndex(x => x.f && x.f[flag]);
  const plv = c.story.f.end ? Math.min(PET_LV_CAP, c.lv) : Math.min(c.lv + 1, PET_LV_CAP); // after volume one a partner keeps up with 石昊
  for (const [id, flag] of JUMP_PETS) if (f[flag] && !c.pets[id]) { const k = since(flag); c.pets[id] = { aff: k >= 0 && k < i ? 100 : 75, lv: Math.max(1, plv - 1), exp: 0, hatch: 0 }; }
  for (const p of Object.values(c.pets)) { if (c.story.f.end) p.lv = Math.max(p.lv || 1, plv - (p.aff >= 100 ? 0 : 2)); p.evo = p.aff >= 100 ? 1 : 0; p.evo2 = p.evo && p.lv >= 25 ? 1 : 0; p.evo3 = p.evo2 && p.lv >= 70 ? 1 : 0; }
  for (const [id, p] of Object.entries(c.pets)) { const open = PETS[id].sk.map((s, k) => ({ s, k })).filter(x => (!x.s.aff || p.aff >= x.s.aff) && (!x.s.evo || p.evo)).map(x => x.k); p.seen = open.slice(); p.bar = [0, ...open.filter(k => k).reverse()].slice(0, 4 + (p.evo ? 1 : 0)); } /* a ready loadout (the newest moves plus the basic one), so no "learned a move" toasts right after the jump */
  if (c.lv > 44) { const n = Math.floor((c.lv - 44) * 1.2), spent = Math.floor(n / 2); c.daoP = { hp: Math.ceil(spent / 3), atk: Math.ceil(spent / 3), def: Math.floor(spent / 3) }; c.dao = n - c.daoP.hp - c.daoP.atk - c.daoP.def; }
  if (f.tiantingDone) c.tt = { yao: 2, lu: f.v13end ? 2 : 1, wu: 2, qiang: f.v13end ? 2 : 1 };
  bsJump(c); c.bar = c.sk.slice().sort((a, b) => SKILL_ORDER.indexOf(b) - SKILL_ORDER.indexOf(a)).slice(0, barSlots(c.lv)); /* 宝术谱: the 机缘 a good player had taken by now */
  const fl = c.lv >= 75 ? 3 : c.lv >= 59 ? 2 : c.lv >= 47 ? 1 : 0; if (fl) { c.forge = {}; for (const r of c.eq) c.forge[r] = fl; } } /* 炼器 opens with volume six: the worn 宝骨 come already worked */
/* 跳章 = a player who played well (中上水平), not an average one: a few levels over the preset (never past a realm gate the story hasn't opened),
   宝术 ×1.3, partners closer and stronger, a fuller purse and bag, a better 虚神界 rank */
const JUMP_UP = { lv: 3, prof: 1.3, aff: 15, petLv: 3, money: 1.5, bag: 1.5, arena: 0.6 };
function jumpBoost(c, i) { const J = JUMPS[i], U = JUMP_UP;
  for (let k = 0; k < U.lv && c.lv < BAL.lvCap && !lvGated(c); k++) c.lv++; if (c.lv > J.lv) c.exp = 0; else if (lvGated(c)) c.exp = Math.round(BAL.expNext(c.lv) * 0.6);
  for (const id of Object.keys(c.prof)) c.prof[id] = Math.round(c.prof[id] * U.prof);
  for (const p of Object.values(c.pets)) { p.aff = Math.min(100, (p.aff || 0) + U.aff); p.lv = Math.min(PET_LV_CAP, c.story.f.end ? (p.lv || 1) + U.petLv : c.lv + 2, (p.lv || 1) + U.petLv); }
  c.money = Math.round((c.money || 0) * U.money); for (const k of Object.keys(c.bag || {})) c.bag[k] = Math.round(c.bag[k] * U.bag);
  c.bar = c.sk.slice().sort((a, b) => SKILL_ORDER.indexOf(b) - SKILL_ORDER.indexOf(a)).slice(0, barSlots(c.lv)); c.eq = Object.keys(c.relics).slice(-relicSlots(c.lv)); }
/* whatever the scenes before the jump point hand out — 宝术, 功法, 伙伴, story marks, the 宝骨 of the bosses fought, the 秘境 cleared — the jump hands out too,
   so a new chapter start needs only its level and place. Marks that only some choices (or a held-out fight) give are left out. */
const JUMP_OPTIONAL = ['ding', 'lure', 'held7', 'xiaoqiSafe', 'yinkunGate', 'huoGuard', 'heldShihai', 'baxiMem', 'tahuaOk', 'carveHuang', 'wallName', 'zaohuaLetter', 'huoNight', 'qhAdvice', 'stoneLate', 'yunxi', 'dieBack'];
function jumpSrc(q) { const seen = new Set(); let s = ''; const add = f => { if (!f || seen.has(f)) return; seen.add(f); const t = f.toString(); s += '\n' + t; for (const m of t.matchAll(/\b(S_\w+)\(/g)) { let g = null; try { g = eval(m[1]); } catch (e) { } if (typeof g === 'function') add(g); } };
  add(q.scene); if (q.onEnter) add(q.onEnter.scene); return s; }
function jumpScan(c, qn) { const avg = Math.round(Object.values(c.prof).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(c.prof).length) * 0.7);
  for (let k = 0; k < qn; k++) { const q = MAIN[k], s = jumpSrc(q);
    for (const m of s.matchAll(/learnSkill\('(\w+)'\)/g)) if (!c.sk.includes(m[1])) { c.sk.push(m[1]); c.prof[m[1]] = c.prof[m[1]] || avg; }
    for (const m of s.matchAll(/learnGongfa\('(\w+)'\)/g)) if (!c.gf.includes(m[1])) c.gf.push(m[1]);
    for (const m of s.matchAll(/F\(\)\.(\w+) = 1\b/g)) if (!JUMP_OPTIONAL.includes(m[1]) && c.story.f[m[1]] == null) c.story.f[m[1]] = 1;
    for (const m of s.matchAll(/mobs: \[\['(\w+)'/g)) for (const [id, R] of Object.entries(RELICS)) if (R.from === m[1] && MOBS[m[1]] && MOBS[m[1]].boss) c.relics[id] = 1;
    if (q.type === 'dungeon' && q.dungeon) { c.dungeons[q.dungeon] = 1; const D = DUNGEONS[q.dungeon], bo = D.rooms.find(r => r.boss); if (bo) for (const [id, R] of Object.entries(RELICS)) if (bo.mobs.includes(R.from)) c.relics[id] = 1; } } }
const VOL_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
const jumpCh = J => MAIN[qi(J.q)].ch;
const jumpName = J => CH_NAMES[jumpCh(J)] || J.q;
function jumpHtml() { if (NETROLE === 'guest') return ''; const by = {}; JUMPS.forEach((J, i) => { const v = CH_VOL[jumpCh(J)]; (by[v] = by[v] || []).push(i); });
  return `<div class="card"><h4>跳章 <span class="dim" style="font-size:.8rem">直接从某一章的开头开始：等级、宝术、功法、伙伴、宝骨、物品和之前的剧情都按“一路玩到这里”准备好（按玩得不错的中上水平）。<b style="color:#ff9a7a">会覆盖当前进度</b>，点两次确认。第一章就是新开一局。</span></h4>
  ${Object.keys(by).sort((a, b) => a - b).map(v => `<div class="jvol"><b>第${VOL_CN[v]}卷 · ${VOL_NAMES[v]}</b><div class="row" style="flex-wrap:wrap;gap:6px">${by[v].map(i => `<button class="sb" onclick="jumpArm(this,${i})">${UI.jumpArm === i ? '再点一次确认' : CH_NAMES[jumpCh(JUMPS[i])].replace(' · ', ' ')}</button>`).join('')}</div></div>`).join('')}</div>`; }
function jumpArm(b, i) { if (UI.jumpArm === i) { UI.jumpArm = null; jumpTo(i); return; } UI.jumpArm = i; b.textContent = '再点一次确认'; b.style.color = '#ff9a7a'; clearTimeout(UI.jumpT); UI.jumpT = setTimeout(() => { UI.jumpArm = null; if (UI.modal === 'set') openModal('set', 1); }, 4000); }
