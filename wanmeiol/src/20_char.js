/* ================= 石昊: stats, 宝术, 功法, 洞天, pets, bag, levels, save ================= */
let C = null;
const SAVE_V = 2;
function newChar() {
  return { v: SAVE_V, name: '石昊', lv: 1, exp: 0, hp: 1, mp: 1, loc: 'sc_chief', home: 'sc_street', bag: { milk: 2 },
    sk: [], bar: [], gf: ['yingxia'], dt: [], pets: {}, pet: null, story: { q: 0, n: 0, f: {} }, kills: {}, stats: { kills: 0, deaths: 0, bosses: 0 },
    arena: { rank: 0, wins: 0, tries: BAL.arenaTries, day: '', best: 999, got: {}, claimed: '' }, dungeons: {}, auto: false, seen: {}, prof: {}, codex: {}, relics: {}, eq: [], diff: 1, money: 20, day: 1, tick: 0, ex: {}, ach: {}, title: '', created: now() };
}
function charStats(c = C) {
  const L = c.lv - 1, s = { hpMax: HERO.base.hp + HERO.grow.hp * L, mpMax: HERO.base.mp + HERO.grow.mp * L, atk: HERO.base.atk + HERO.grow.atk * L, def: HERO.base.def + HERO.grow.def * L, spd: HERO.base.spd + HERO.grow.spd * L, crit: HERO.base.crit + HERO.grow.crit * L, leech: 0, regen: 0 };
  const P = { hpP: 0, mpP: 0, atkP: 0, defP: 0 };
  const add = b => { for (const k in b) { if (k in P) P[k] += b[k]; else s[k] = (s[k] || 0) + b[k]; } };
  for (const g of c.gf) if (GONGFA[g]) add(GONGFA[g].b); for (const r of c.eq || []) if (RELICS[r] && RELICS[r].b) add(relicB(r, c)); for (const k of c.dt) { const d = DONGTIAN.find(x => x.k === k); if (d) add(d.b); }
  if (c.daoP) { P.hpP += (c.daoP.hp || 0) * 0.01; P.atkP += (c.daoP.atk || 0) * 0.01; P.defP += (c.daoP.def || 0) * 0.01; } P.defP += 0.03 * ttLv('qiang', c);
  s.hpMax = Math.round(s.hpMax * (1 + P.hpP)); s.mpMax = Math.round(s.mpMax * (1 + P.mpP)); s.atk = Math.round(s.atk * (1 + P.atkP)); s.def = Math.round(s.def * (1 + P.defP)); s.spd = Math.round(s.spd * 10) / 10; s.crit = Math.min(0.6, s.crit);
  s.power = Math.round(s.atk * 6 + s.def * 5 + s.hpMax * 0.6 + s.mpMax * 0.3 + s.crit * 1500 + s.spd * 15 + c.lv * 40);
  return s;
}
function fixHp() { const s = charStats(); C.hp = clamp(C.hp, 0, s.hpMax); C.mp = clamp(C.mp, 0, s.mpMax); }
function fullHeal() { const s = charStats(); C.hp = s.hpMax; C.mp = s.mpMax; }
function skillsOf(c = C) { return ['atk', ...c.bar.filter(id => c.sk.includes(id)), 'guard']; }
function learnSkill(id) { if (C.sk.includes(id)) return; C.sk.push(id); if (C.bar.length < barSlots(C.lv)) C.bar.push(id); const S = SKILLS[id]; logLine(`<b class="lvup">领悟宝术</b>：${S.icon}<b>${S.name}</b>——${S.desc}`, 'sys'); sfx('epic'); }
/* 宝术熟练度 */
const profLevel = (id, c = C) => { const n = (c.prof && c.prof[id]) || 0; let l = 0; for (let i = 1; i < PROF.length; i++) if (n >= PROF[i].at) l = i; return l; };
function profUse(id) { C.prof = C.prof || {}; const before = profLevel(id); C.prof[id] = (C.prof[id] || 0) + 1; const after = profLevel(id); if (after > before) setTimeout(() => { logLine(`${SKILLS[id].icon}<b>${SKILLS[id].name}</b> 用得越来越顺手——<b class="lvup">${PROF[after].n}</b>（威力 +${PROF[after].b * 100}%）`, 'sys'); sfx('epic'); }, 50); }
const knownWeak = mob => { const M = MOBS[mob]; if (!M || !M.weak) return []; const w = (C.codex && C.codex[mob] && C.codex[mob].wk) || []; return Object.keys(M.weak).filter(e => w.includes(e)); };
function toggleBar(id) { const i = C.bar.indexOf(id); if (i >= 0) C.bar.splice(i, 1); else { if (C.bar.length >= barSlots(C.lv)) { const old = C.bar.slice().sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b))[0]; C.bar.splice(C.bar.indexOf(old), 1); toast(`宝术栏满了（${barSlots(C.lv)} 门），换下了最低阶的「${SKILLS[old].name}」`); } C.bar.push(id); } C.bar.sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b)); save(); refresh(); }
function learnGongfa(id) { if (C.gf.includes(id)) return; C.gf.push(id); const G = GONGFA[id]; fixHp(); logLine(`<b class="lvup">修炼有成</b>：${G.icon}<b>${G.name}</b>——${G.desc}`, 'sys'); sfx('epic'); }

/* ---------- pets ---------- */
function gainPet(id) { if (C.pets[id]) return; C.pets[id] = { aff: 10, hatch: 0, lv: Math.max(1, C.lv - 1), exp: 0 }; if (!C.pet) C.pet = id; const P = PETS[id]; logLine(`<b class="lvup">新伙伴</b>：${P.icon}<b>${P.name}</b>（${P.race}）——${P.desc}`, 'sys'); sfx('epic'); save(); refresh(); }
function setPet(id) { if (!C.pets[id]) return; C.pet = C.pet === id ? null : id; sfx('click'); save(); refresh(); }
function feedPet(id, item) { const p = C.pets[id], it = ITEMS[item]; if (!p || !it || !it.food || !takeItem(item)) return; const before = p.aff; p.aff = Math.min(100, p.aff + it.food); sfx('heal');
  const P = PETS[id]; logLine(`${P.icon}${P.name} 吃了${it.name}，${pick(['尾巴摇个不停', '高兴得在你身边打转', '吃完还想要', '舔了舔你的手'])}。（亲近 ${before} → ${p.aff}）`, 'dim');
  for (const s of P.sk) if (s.aff && before < s.aff && p.aff >= s.aff) logLine(`${P.icon}${P.name} 学会了 <b>${s.n}</b>！`, 'sys'); petEvoCheck(id); save(); refresh(); }
const petSkillsOpen = id => PETS[id].sk.filter(s => (!s.aff || (C.pets[id] && C.pets[id].aff >= s.aff)) && (!s.evo || (C.pets[id] && C.pets[id].evo)));

/* ---------- bag ---------- */
const itemN = id => C.bag[id] || 0;
function addItem(id, n = 1, quiet) { if (!ITEMS[id] || n <= 0) return; C.bag[id] = (C.bag[id] || 0) + n; if (!quiet) logLine(`获得 <span class="it">${ITEMS[id].icon}${ITEMS[id].name}</span> ×${n}`, 'loot'); }
function takeItem(id, n = 1) { if ((C.bag[id] || 0) < n) return false; C.bag[id] -= n; if (C.bag[id] <= 0) delete C.bag[id]; return true; }
function useItem(id, inBattle) {
  const it = ITEMS[id]; if (!it || !itemN(id)) return false; const s = charStats();
  if (it.type === 'gf') { if (inBattle) return false; takeItem(id); learnGongfa(it.gf); save(); refresh(); return true; }
  if (it.type !== 'use') return false;
  if (inBattle) { takeItem(id); return true; }
  if (C.hp >= s.hpMax && (!it.mp || C.mp >= s.mpMax)) { toast('气血符力都是满的'); return false; }
  takeItem(id); if (it.heal) C.hp = Math.min(s.hpMax, C.hp + s.hpMax * it.heal); if (it.mp) C.mp = Math.min(s.mpMax, C.mp + s.mpMax * it.mp); sfx('heal'); logLine(`你用了${it.icon}${it.name}。`, 'dim'); save(); refresh(); return true;
}

/* ---------- levels & realms ---------- */
const LV_GATES = [[9, 'jijing'], [19, 'end'], [24, 'v2end'], [29, 'shihuang'], [34, 'v4'], [39, 'v4end'], [44, 'v5end'], [49, 'v6end'], [54, 'v7end'], [59, 'yiyu0'], [62, 'yyEnd'], [65, 'v8end'], [71, 'v9end'], [75, 'v12end'], [80, 'v13end'], [84, 'xiandi']]; /* a realm's last level: the story has to open the next one (9 → 机缘 is handled on its own) */
const lvGated = c => LV_GATES.some(([l, f]) => c.lv === l && !c.story.f[f]);
function gainExp(n, quiet) {
  if (n <= 0) return; C.exp += Math.round(n); if (!quiet) logLine(`获得 <span class="exp">${fmt(n)} 经验</span>`, 'loot');
  while (C.exp >= BAL.expNext(C.lv) && C.lv < BAL.lvCap) {
    if (C.lv === 9 && !C.story.f.jijing) { C.exp = BAL.expNext(C.lv); if (!C.seen.neck9) { C.seen.neck9 = 1; logLine('你体内的气血像江河一样奔涌，却撞上了一层看不见的壁——<b>搬血境走到头了</b>。要怎么往前走，得看机缘（跟着主线走）。', 'sys'); } break; }
    if (lvGated(C)) { capExp(); break; }
    if (C.lv === 68 && !C.story.f.zhizun) { capExp(); break; }
    C.exp -= BAL.expNext(C.lv); C.lv++; fullHeal(); sfx('level');
    logLine(`<b class="lvup">境界精进！</b> ${realmOf(C.lv).name} · 第 ${C.lv} 层。气血、符力已回满。`, 'sys'); bigFlash(`境界精进 · ${realmOf(C.lv).name}第 ${C.lv} 层`, 'lv');
    if (C.lv >= 10 && C.lv <= 18 && C.dt.length < C.lv - 9) STATE.dtPending = true;
    if (barSlots(C.lv) > barSlots(C.lv - 1)) { logLine(`<b class="lvup">宝术栏 +1</b>：现在能带 ${barSlots(C.lv)} 门宝术进战斗。`, 'sys'); for (const id of SKILL_ORDER) if (C.sk.includes(id) && !C.bar.includes(id) && C.bar.length < barSlots(C.lv)) C.bar.push(id); }
    if (relicSlots(C.lv) > relicSlots(C.lv - 1)) { logLine(`<b class="lvup">宝骨栏 +1</b>：现在能戴 ${relicSlots(C.lv)} 件宝骨。`, 'sys'); C.eq = C.eq || []; for (const id of Object.keys(C.relics || {})) if (!C.eq.includes(id) && C.eq.length < relicSlots(C.lv)) C.eq.push(id); }
  }
  if (C.lv >= BAL.lvCap && C.exp > BAL.expNext(C.lv)) capExp();
  netPub(); if (STATE.dtPending) setTimeout(dongtianPick, 400);
  setTimeout(storyPoll, 200);
}
async function dongtianPick() { // open a 洞天: pick one of two blessings
  if (!STATE.dtPending || STATE.scene || STATE.battle || STATE.dungeon || NETROLE === 'guest') return; if (C.dt.length >= C.lv - 9 || C.lv < 10) { STATE.dtPending = false; return; }
  STATE.dtPending = false; const pool = DONGTIAN.filter(d => !C.dt.includes(d.k) || C.dt.filter(x => x === d.k).length < 2); const opts = shuffle(pool.slice()).slice(0, 2);
  await runScene(async () => { await nar(`你盘膝而坐，体内轰鸣——第 <b>${C.dt.length + 1}</b> 座洞天要开了。它会是什么样子？`); const c = await choose(opts.map(o => `${o.n}（${o.d}）`)); C.dt.push(opts[c].k); fixHp(); logLine(`开辟<b>${opts[c].n}</b>：${opts[c].d}`, 'sys'); sfx('epic'); });
  if (C.dt.length < C.lv - 9) { STATE.dtPending = true; setTimeout(dongtianPick, 300); }
}

/* ---------- save ---------- */
let saveT = 0;
function save(now_) { if (!C || NETROLE === 'guest') return; clearTimeout(saveT); const f = () => { if (!C) return; achCheck(); C.savedAt = now(); C.story.qid = MAIN[C.story.q].id; store.set(saveKey(SLOT), C); }; if (now_) f(); else saveT = setTimeout(f, 300); }
// v2 saves stored only the step index; the step list has grown since, so map old indices through the old order
const OLD_V2 = ['q_wake', 'q_yard', 'q_wolf0', 'q_wolf', 'q_egg0', 'q_egg', 'q_tomb0', 'q_tomb', 'q_bei', 'q_yaoding', 'q_shanbao', 'q_ruin', 'q_jijing', 'q_memory', 'q_qingfeng', 'q_bandit0', 'q_bandit', 'q_xushen0', 'q_xushen', 'q_leave', 'q_gate', 'q_lotus', 'q_join', 'q_lei', 'q_lib', 'q_baiduan', 'q_bdgate', 'q_lion', 'q_yu', 'q_cliff', 'q_spring', 'q_tiangu', 'q_mount', 'q_return', 'q_end'];
function fixSave(c) { if (!c || c.v !== SAVE_V) return null; petGoneFix(c); if (c.rumorLog) { const seen = new Set(); c.rumorLog = c.rumorLog.filter(r => !seen.has(r.t) && seen.add(r.t)); } // old saves heard some rumours more than once const d = newChar(); for (const k in d) if (c[k] === undefined) c[k] = d[k]; for (const k in d.arena) if (c.arena[k] === undefined) c.arena[k] = d.arena[k];
  for (const [id, R] of Object.entries(RELICS)) if ((c.kills || {})[R.from] && !c.relics[id]) { c.relics[id] = 1; if (c.eq.length < relicSlots(c.lv)) c.eq.push(id); } // bosses beaten before 宝骨 existed
  const qid = c.story.qid || OLD_V2[c.story.q]; const i = qi(qid); if (i >= 0) c.story.q = i; c.story.q = clamp(c.story.q, 0, MAIN.length - 1); if (!PLACES[c.loc]) c.loc = 'sc_street'; return c; }
/* save slots: slot 1 keeps the old keys (save2 / journal2), slots 2–5 add _s2 … _s5; the open slot is remembered */
const SLOTS = 5; let SLOT = clamp(store.get('slot', 1) | 0, 1, SLOTS);
const saveKey = s => s === 1 ? 'save2' : 'save2_s' + s, jKey = s => s === 1 ? 'journal2' : 'journal2_s' + s;
function loadSave(s = SLOT) { return fixSave(store.get(saveKey(s), null)); }
function useSlot(s) { if (C && NETROLE !== 'guest') save(true); SLOT = s; store.set('slot', s); JOURNAL = store.get(jKey(s), []); }
/* ---------- 回忆录 (story journal) — kept apart from the save so co-op snapshots stay small ---------- */
let JOURNAL = store.get(jKey(SLOT), []);
const saveJournal = () => store.set(jKey(SLOT), JOURNAL.slice(-120));
/* ---------- save code: copy the save to another browser ---------- */
async function b64z(str, unzip) {
  const CS = unzip ? window.DecompressionStream : window.CompressionStream;
  if (!unzip) { const bytes = new TextEncoder().encode(str); let out = bytes, tag = 'R'; if (CS) { out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CS('deflate'))).arrayBuffer()); tag = 'Z'; } let bin = ''; for (let i = 0; i < out.length; i += 8192) bin += String.fromCharCode.apply(null, out.subarray(i, i + 8192)); return tag + btoa(bin); }
  const tag = str[0], bin = atob(str.slice(1)), bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0)); if (tag === 'R') return new TextDecoder().decode(bytes); if (!CS) throw new Error('nozip'); return new TextDecoder().decode(await new Response(new Blob([bytes]).stream().pipeThrough(new CS('deflate'))).arrayBuffer()); }
async function exportCode() { save(true); return 'WMOL1' + await b64z(JSON.stringify({ c: C, j: JOURNAL })); }
async function importCode(code) { code = (code || '').replace(/\s+/g, ''); if (!code.startsWith('WMOL1')) throw new Error('bad'); const o = JSON.parse(await b64z(code.slice(5), true)); const c = fixSave(o.c); if (!c) throw new Error('bad'); store.set(saveKey(SLOT), c); JOURNAL = Array.isArray(o.j) ? o.j : []; saveJournal(); return c; }
function nearestTown(loc) { const a = PLACES[loc].area; if (PLACES[loc].town) return loc; if ((a === 'butian' || a === 'baiduan') && C.story.f.joined) return 'bt_court'; if (a === 'butian') return 'bt_gate'; return 'sc_street'; }
