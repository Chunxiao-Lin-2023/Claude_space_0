/* 角色状态、成长、存档（5 个位置）、回忆录 */
let C = null; const SAVE_V = 1;
function newChar() { return { v: SAVE_V, lv: 1, exp: 0, hp: 0, mp: 0, money: 35, day: 1, tick: 0, loc: 'hh_door', q: 'q_open', f: {}, sk: ['hammer', 'jump', 'story'], bar: { n: ['hammer'], d: ['jump', 'story'] }, prof: {},
  pets: {}, pet: { n: '', d: '' }, duo: 0, bag: { bread: 2 }, gear: [], talents: [], titles: [], title: '', hh: { good: 0, bad: 0, today: 4, month: 10, screams: 0, spins: 0, total: 0, scenes: ['zombie', 'mh'], groups: 0, batches: 0, up: {} },
  fans: 0, codex: {}, kills: {}, seen: {}, dlog: [], daily: { day: 0, got: '', done: 0 }, ex: {}, track: '', auto: 0, made: Date.now(), bonus: { hp: 0 }, fun: { chs: { 1: { lose: 0, fail: 0, d0: 1 } } } }; }
function charStats(c) { c = c || C; const l = c.lv; let hp = HERO.hp(l) + (c.bonus.hp || 0) + relicBonus(c, 'hp'), mp = HERO.mp(l) + relicBonus(c, 'mp'), atk = HERO.atk(l), def = HERO.def(l), spd = HERO.spd(l), exp = 0, low = 0;
  for (const t of c.titles) { const T = TITLES[t]; if (!T) continue; hp += T.hp || 0; mp += T.mp || 0; atk += T.atk || 0; exp += T.exp || 0; low += T.low || 0; }
  for (const g of c.gear) { const G = ITEMS[g]; if (!G) continue; hp += G.hp || 0; spd += G.spd || 0; exp += G.exp || 0; }
  if (c.talents.includes('run')) spd += 3;
  return { mhp: Math.round(hp), mmp: Math.round(mp), atk, def, spd, crit: .08, exp, low }; }
function fixHp() { const s = charStats(); C.hp = clamp(Math.round(C.hp), 0, s.mhp); C.mp = clamp(Math.round(C.mp), 0, s.mmp); }
function fullHeal() { const s = charStats(); C.hp = s.mhp; C.mp = s.mmp; }
function skillsOf(mode) { return C.sk.filter(k => SKILLS[k] && (SKILLS[k].m === mode || SKILLS[k].m === 'b')); }
function learnSkill(k, quiet) { if (C.sk.includes(k)) return false; C.sk.push(k); const S = SKILLS[k], modes = S.m === 'b' ? ['n', 'd'] : [S.m];
  const sc = x => (SKILLS[x].pow || 0) * (SKILLS[x].all ? 1.4 : 1) * (SKILLS[x].first ? 1.15 : 1);
  for (const m of modes) { const bar = C.bar[m]; if (bar.length < barSlots(C.lv)) bar.push(k); else if (!S.self) { /* 栏满了：换下威力最低的（不动不耗精神的基础手段和护身类） */ const cand = bar.filter(x => SKILLS[x].cost && !SKILLS[x].self).sort((x, y) => sc(x) - sc(y))[0]; if (cand && sc(cand) < sc(k)) bar[bar.indexOf(cand)] = k; } }
  if (!quiet) { logLine('学会手段：' + S.ic + S.n, 'gain'); toast('学会 ' + S.ic + ' ' + S.n); sfx('ok'); } return true; }
function fillBars() { for (const m of ['n', 'd']) for (const k of skillsOf(m)) if (C.bar[m].length < barSlots(C.lv) && !C.bar[m].includes(k)) C.bar[m].push(k); }
function swapSkill(from, to) { const i = C.sk.indexOf(from); if (i >= 0) C.sk[i] = to; else if (!C.sk.includes(to)) C.sk.push(to); for (const m of ['n', 'd']) { const j = C.bar[m].indexOf(from); if (j >= 0) C.bar[m][j] = to; } if (C.prof[from]) { C.prof[to] = C.prof[from]; delete C.prof[from]; } }
function toggleBar(k) { const S = SKILLS[k]; if (!S) return; const modes = S.m === 'b' ? ['n', 'd'] : [S.m]; for (const m of modes) { const bar = C.bar[m], i = bar.indexOf(k);
    if (i >= 0) { if (bar.length <= 1) { toast('至少带一个手段'); return; } bar.splice(i, 1); } else if (bar.length >= barSlots(C.lv)) { toast('栏位满了（' + barSlots(C.lv) + '），先换下一个'); return; } else bar.push(k); } sfx('tap'); save(); renderSide(); }
function profLevel(k) { const n = C.prof[k] || 0; let r = PROF[0]; for (const p of PROF) if (n >= p[0]) r = p; return r; }
function profUse(k) { const b = profLevel(k); C.prof[k] = (C.prof[k] || 0) + 1; const a = profLevel(k); if (a !== b) { logLine(SKILLS[k].n + ' 用得更顺了：' + a[1] + '（威力 +' + Math.round(a[2] * 100) + '%）', 'gain'); toast(SKILLS[k].n + ' → ' + a[1]); } }
function learnTalent(k) { if (C.talents.includes(k)) return; C.talents.push(k); logLine('获得天赋：' + TALENTS[k].n, 'gain'); }
function gainTitle(k) { if (C.titles.includes(k)) return; C.titles.push(k); if (!C.title) C.title = k; logLine('获得称号：' + TITLES[k].n, 'gain'); toast('称号 · ' + TITLES[k].n); fixHp(); }
function gainPet(k, quiet) { if (C.pets[k]) return; C.pets[k] = { aff: 0, lv: Math.max(1, C.lv - 1), exp: 0 }; const P = PETS[k]; for (const m of (P.m === 'b' ? ['n', 'd'] : [P.m])) if (!C.pet[m]) C.pet[m] = k; if (!quiet) { logLine(P.n + ' 成为恐怖屋的员工', 'gain'); toast('新员工 · ' + P.n); sfx('big'); } }
function setPet(k) { const P = PETS[k]; if (!P || !C.pets[k]) return; if (P.m === 'd') { toast('白天的员工在接待游客的布置画面里安排站岗'); return; } C.pet.n = C.pet.n === k ? '' : k; sfx('tap'); save(); renderSide(); }
function petAff(k, n) { const p = C.pets[k]; if (!p) return; const b = p.aff; p.aff = clamp(p.aff + n, 0, 100); for (const m of PETS[k].moves) if (m.need && b < m.need && p.aff >= m.need) { logLine(PETS[k].n + ' 肯多做一件事了：' + m.n, 'gain'); toast(PETS[k].n + ' · ' + m.n); } }
function petMoves(k) { const p = C.pets[k] || { aff: 100 }; return PETS[k].moves.filter(m => !m.need || p.aff >= m.need); }
function petCap() { return Math.min(HERO.cap + 2, C.lv + 2); }
function petGainExp(k, n) { const p = C.pets[k]; if (!p || p.lv >= petCap()) return; p.exp += Math.round(n * (p.lv < C.lv ? 1.6 : 1)); while (p.lv < petCap() && p.exp >= HERO.need(p.lv)) { p.exp -= HERO.need(p.lv); p.lv++; logLine(PETS[k].n + ' 更熟练了（' + p.lv + ' 级）', 'gain'); } }
function itemN(k) { return C.bag[k] || 0; }
function addItem(k, n, quiet) { n = n || 1; C.bag[k] = (C.bag[k] || 0) + n; const I = ITEMS[k]; if (I && I.k === 'gear' && !C.gear.includes(k) && C.gear.length < gearSlots(C.lv)) C.gear.push(k); if (!quiet && I) logLine('得到 ' + I.ic + I.n + (n > 1 ? ' ×' + n : ''), 'gain'); }
function takeItem(k, n) { n = n || 1; if ((C.bag[k] || 0) < n) return false; C.bag[k] -= n; if (C.bag[k] <= 0) delete C.bag[k]; return true; }
function useItem(k, inBattle) { const I = ITEMS[k]; if (!I || I.k !== 'use' || !itemN(k)) return false; const s = charStats();
  if (I.battle && !inBattle) { toast('对峙的时候才用得上'); return false; }
  if (I.heal && C.hp >= s.mhp && !I.mp && !I.cure) { toast('体力是满的'); return false; } if (I.mp && !I.heal && C.mp >= s.mmp) { toast('精神是满的'); return false; }
  takeItem(k); if (I.heal) C.hp = Math.min(s.mhp, C.hp + Math.round(s.mhp * I.heal)); if (I.mp) C.mp = Math.min(s.mmp, C.mp + Math.round(s.mmp * I.mp)); if (I.maxhp) { C.bonus.hp += I.maxhp; C.hp += I.maxhp; }
  logLine('用了 ' + I.ic + I.n, 'sys'); sfx('ok'); return true; }
function equipGear(k) { const i = C.gear.indexOf(k); if (i >= 0) C.gear.splice(i, 1); else if (C.gear.length >= gearSlots(C.lv)) { toast('佩戴栏满了（' + gearSlots(C.lv) + '）'); return; } else C.gear.push(k); fixHp(); sfx('tap'); save(); renderSide(); }
function gainMoney(n, why) { C.money += n; if (n > 0) { logLine((why ? why + '：' : '') + '+' + n + ' 元', 'gain'); sfx('coin'); } }
function gainExp(n) { const s = charStats(); n = Math.round(n * (1 + s.exp)); if (C.lv >= HERO.cap) return; C.exp += n; logLine('经验 +' + n, 'sys'); let up = 0;
  while (C.lv < HERO.cap && C.exp >= HERO.need(C.lv)) { C.exp -= HERO.need(C.lv); C.lv++; up++; }
  if (up) { fillBars(); fullHeal(); logLine('胆识提升到 ' + C.lv + ' 级 · ' + rankOf(C.lv), 'gain'); toast('胆识 ' + C.lv + ' 级'); sfx('big'); } }
function gameDay() { return C.day; }

/* —— 存档 —— */
let SLOT = store.get('slot', 1); const SLOTS = 5;
const saveKey = n => 'save.' + (n || SLOT), jrKey = n => 'jr.' + (n || SLOT);
let saveT = 0;
function save() { if (C) try { checkAch(); } catch (e) {} if (!C || (window.__dbg && __dbg.nosave)) return; clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
function saveNow() { if (!C) return; C.savedAt = Date.now(); store.set(saveKey(), C); }
function fixSave(c) { const d = newChar(); for (const k in d) if (c[k] === undefined) c[k] = d[k]; for (const k in d.hh) if (c.hh[k] === undefined) c.hh[k] = d.hh[k]; if (!MAIN.some(q => q.id === c.q)) c.q = c.q === 'q_end' ? 'q_end' : MAIN[0].id; if (!PLACES[c.loc]) c.loc = 'hh_door'; c.sk = c.sk.filter(k => SKILLS[k]); for (const m of ['n', 'd']) c.bar[m] = (c.bar[m] || []).filter(k => c.sk.includes(k)); return c; }
function loadSave(n) { const c = store.get(saveKey(n), null); return c && c.v === SAVE_V ? fixSave(c) : null; }
function useSlot(n) { SLOT = n; store.set('slot', n); JOURNAL = store.get(jrKey(), []); }
let JOURNAL = store.get(jrKey(), []);
function saveJournal() { if (window.__dbg && __dbg.nosave) return; if (JOURNAL.length > 140) JOURNAL = JOURNAL.slice(-140); store.set(jrKey(), JOURNAL); }
function exportCode() { try { return btoa(unescape(encodeURIComponent(JSON.stringify({ c: C, j: JOURNAL.slice(-60) })))); } catch (e) { return ''; } }
function importCode(s) { try { const o = JSON.parse(decodeURIComponent(escape(atob(s.trim())))); if (!o.c || o.c.v !== SAVE_V) return false; C = fixSave(o.c); JOURNAL = o.j || []; saveNow(); saveJournal(); return true; } catch (e) { return false; } }
