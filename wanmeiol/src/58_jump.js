/* ================= 跳章 (for testing, or just to skip ahead) =================
   设置 → 跳章: start at the beginning of a chapter with what an average player would have by then — a little more,
   to be safe: level, 宝术 with their mastery, 功法, 洞天, partners, 宝骨, items, places opened and the story flags the
   later scenes read. It replaces the current save (two clicks to confirm). Choices along the way take their first option. */
const JUMPS = [
  { q: 'q_memory', n: '第二章 · 出村', lv: 9, exp: 0.6, loc: 'sc_street', gf: ['xixue', 'guwen', 'yaoding', 'jijing'], sk: { qly: 45, sn: 30 }, pets: { maoqiu: [35, 9] },
    relics: ['r_eagle', 'r_suanni', 'r_fengbei'], dun: ['tomb'], f: { lure: 1, tomb: 1, bei: 1, deep: 1, moved: 1, jijing: 1 }, bag: { milk: 4, herb: 5, meat: 3, lingyao: 2, baoyao: 1, bone: 6 }, money: 80, dt: 0, arena: 0 },
  { q: 'q_gate', n: '第三章 · 补天阁', lv: 12, exp: 0.4, loc: 'dh_road', sk: { qly: 80, sn: 55 }, pets: { maoqiu: [50, 12] }, relics: ['r_jiling'],
    f: { vow: 'find', out: 1, qingfeng: 1, saved: 1, xushen: 1, butian: 1 }, bag: { milk: 6, herb: 6, meat: 4, lingyao: 3, baoyao: 2, bone: 8 }, money: 150, dt: 3, arena: 85 },
  { q: 'q_baiduan', n: '第四章 · 百断山', lv: 14, exp: 0.4, loc: 'bt_court', sk: { qly: 110, sn: 75, lei: 35, gw: 30 }, pets: { maoqiu: [65, 14] },
    f: { joined: 1, bully: 1, qf: 'spar' }, bag: { herb: 8, meat: 5, lingyao: 4, baoyao: 3, bone: 10 }, money: 260, dt: 5, arena: 60 },
  { q: 'q_end', n: '第二卷 · 石国', lv: 20, exp: 0, loc: 'bt_court', sk: { qly: 170, sn: 125, lei: 95, gw: 60, jian: 45, dsh: 35, ta: 20 }, pets: { maoqiu: [90, 21], dahong: [45, 20], ertuzi: [25, 19] },
    gf: ['taiyi'], relics: ['r_zhuque', 'r_lion', 'r_yu', 'r_tiger', 'r_peng', 'r_boneking', 'r_pumo'], dun: ['tiangu'], f: { baiduan: 1, lion: 1, cave: 1, yuDone: 1, water: 1, guRegrow: 1, cliff: 1, spring: 1, carrySpring: 1, shengyao: 1, mount: 1, yunxi: 1, sawShiyi: 1, qfIn: 1, end: 1, eggWins: 8 },
    bag: { herb: 10, meat: 6, lingyao: 6, baoyao: 5, bone: 14, bulao: 1, xiantao: 1 }, money: 500, dt: 9, arena: 30 },
  { q: 'q_v3', n: '第三卷 · 石皇', lv: 25, exp: 0.2, loc: 'sg_hou', sk: { qly: 175, sn: 165, lei: 130, gw: 90, jian: 80, dsh: 70, ta: 55 }, pets: { maoqiu: [100, 26], dahong: [70, 25], ertuzi: [45, 24] },
    relics: ['r_jinzhu', 'r_mozhu', 'r_qingluan'], dun: ['zhuchao'], f: { v2: 1, yuwang: 1, truth: 1, ziteng: 1, shouyan0: 1, jinzhu: 1, hou: 1, challenge: 1, v2end: 1, v3: 1 },
    bag: { herb: 12, meat: 8, lingyao: 8, baoyao: 7, bone: 18 }, money: 1200, dt: 9, arena: 20 },
  { q: 'q_dajie', n: '第八章 · 石皇', lv: 29, exp: 0.2, loc: 'sg_hou', gf: ['niepan', 'zhizungu'], sk: { qly: 180, sn: 175, lei: 165, gw: 120, jian: 110, dsh: 95, ta: 80, zhuque: 40, zhizun: 15 }, pets: { maoqiu: [100, 30], dahong: [85, 29], ertuzi: [60, 28] },
    relics: ['r_rongyan'], dun: ['rongyan'], f: { huohuang: 1, guBack: 1, shiyiDuel: 1, duelTalk: 'give', shiyiWin2: 1 },
    bag: { herb: 14, meat: 10, lingyao: 10, baoyao: 9, bone: 22 }, money: 2000, dt: 9, arena: 12 },
  { q: 'q_qishen', n: '第九章 · 七神', lv: 31, exp: 0.1, loc: 'sg_inner', gf: ['renhuang'], sk: { qly: 185, sn: 180, lei: 175, gw: 140, jian: 130, dsh: 115, ta: 100, zhuque: 70, zhizun: 45 }, pets: { maoqiu: [100, 32], dahong: [95, 31], ertuzi: [70, 30] },
    relics: ['r_shichong'], f: { dajie: 1, shihuang: 1 }, bag: { herb: 15, meat: 10, lingyao: 12, baoyao: 10, bone: 24 }, money: 3000, dt: 9, arena: 8 },
];
function dropRunning() { // a story scene, dialogue, mini-game or fight in progress is simply abandoned: its promise never resolves
  const B = STATE.battle; if (B) { B.over = B.done = B.aborted = true; STATE.battle = null; STATE.battleRes = null; STATE.busy = false; UI.selFoe = null; }
  clearInterval(UI.miniT); DLG = null; STATE.scene = null; UI.jEntry = null; UI.hist = []; UI.cur = null; STATE.dtPending = null; renderDlg(); }
function jumpTo(i) { if (NETROLE === 'guest') { toast('只有房主能跳章'); return; } dropRunning();
  const c = newChar(); c.diff = C ? C.diff : 1; c.created = C ? C.created : now(); c.auto = C ? !!C.auto : false; const DT = ['li', 'ti', 'shou', 'su', 'feng', 'ling'];
  for (let k = 0; k <= i; k++) { const J = JUMPS[k];
    c.gf = [...new Set([...c.gf, ...(J.gf || [])])]; for (const [id, n] of Object.entries(J.sk || {})) { if (!c.sk.includes(id)) c.sk.push(id); c.prof[id] = n; }
    for (const [id, [aff, lv]] of Object.entries(J.pets || {})) c.pets[id] = { aff, lv, exp: 0, hatch: 0, evo: aff >= 100 ? 1 : 0 }; for (const r of J.relics || []) c.relics[r] = 1;
    for (const d of J.dun || []) c.dungeons[d] = 1; Object.assign(c.story.f, J.f || {}); if (J.bag) c.bag = { ...J.bag }; if (J.money) c.money = J.money; }
  const J = JUMPS[i]; c.lv = J.lv; c.exp = Math.round(BAL.expNext(J.lv) * (J.exp || 0)); c.dt = DT.concat(DT).slice(0, J.dt); c.pet = 'maoqiu'; c.story.q = qi(J.q); c.story.qid = J.q; c.loc = J.loc; c.home = PLACES[J.loc].town ? J.loc : 'sc_street';
  c.bar = c.sk.slice().sort((a, b) => SKILL_ORDER.indexOf(b) - SKILL_ORDER.indexOf(a)).slice(0, barSlots(J.lv)); c.eq = Object.keys(c.relics).slice(-relicSlots(J.lv));
  if (J.arena) Object.assign(c.arena, { rank: J.arena, best: J.arena, wins: Math.round((120 - J.arena) / 4) });
  C = c; for (const id of Object.keys(PLACES)) if (placeOpen(id)) { C.seen[id] = 1; for (const [m] of PLACES[id].mobs || []) C.codex[m] = C.codex[m] || { wk: [] }; }
  C.ach = {}; for (const A of ACH) { try { if (A.ok()) C.ach[A.id] = now(); } catch (e) { } } // titles already earned by then: no pile of toasts
  fullHeal(); DLG = null; STATE.dungeon = null; UI.nav = null; closeModal(); $('log').innerHTML = ''; logLine(`<div class="lochead">${J.n}</div>`, 'loc');
  logLine(`<b class="lvup">跳章</b>：从「${J.n}」开始。等级、宝术、伙伴、宝骨和物品都按这时候应有的水平（略高一点）准备好了。`, 'sys'); save(true); refresh(); bannerDraw(); netSync(); setTimeout(storyPoll, 600); }
function jumpHtml() { if (NETROLE === 'guest') return ''; return `<div class="card"><h4>跳章 <span class="dim" style="font-size:.8rem">测试用：直接从某一章开始，属性、宝术、伙伴按上一章结束时的水平（略高）准备好。<b style="color:#ff9a7a">会覆盖当前进度</b>，点两次确认。</span></h4>
  <div class="row" style="flex-wrap:wrap;gap:6px">${JUMPS.map((J, i) => `<button class="sb" onclick="jumpArm(this,${i})">${UI.jumpArm === i ? '再点一次确认' : J.n}</button>`).join('')}</div></div>`; }
function jumpArm(b, i) { if (UI.jumpArm === i) { UI.jumpArm = null; jumpTo(i); return; } UI.jumpArm = i; b.textContent = '再点一次确认'; b.style.color = '#ff9a7a'; clearTimeout(UI.jumpT); UI.jumpT = setTimeout(() => { UI.jumpArm = null; if (UI.modal === 'set') openModal('set', 1); }, 4000); }
