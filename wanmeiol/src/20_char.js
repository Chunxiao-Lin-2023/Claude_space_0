/* ================= 石昊: stats, 宝术, 功法, 洞天, pets, bag, levels, save ================= */
let C = null;
const SAVE_V = 2;
function newChar() {
  return { v: SAVE_V, name: '石昊', lv: 1, exp: 0, hp: 1, mp: 1, loc: 'sc_chief', home: 'sc_street', bag: { milk: 2 },
    sk: [], bar: [], gf: ['yingxia'], dt: [], pets: {}, pet: null, story: { q: 0, n: 0, f: {} }, kills: {}, stats: { kills: 0, deaths: 0, bosses: 0 },
    arena: { rank: 0, wins: 0, tries: BAL.arenaTries, day: '' }, dungeons: {}, auto: false, seen: {}, created: now() };
}
function charStats(c = C) {
  const L = c.lv - 1, s = { hpMax: HERO.base.hp + HERO.grow.hp * L, mpMax: HERO.base.mp + HERO.grow.mp * L, atk: HERO.base.atk + HERO.grow.atk * L, def: HERO.base.def + HERO.grow.def * L, spd: HERO.base.spd + HERO.grow.spd * L, crit: HERO.base.crit + HERO.grow.crit * L, leech: 0, regen: 0 };
  const P = { hpP: 0, mpP: 0, atkP: 0, defP: 0 };
  const add = b => { for (const k in b) { if (k in P) P[k] += b[k]; else s[k] = (s[k] || 0) + b[k]; } };
  for (const g of c.gf) if (GONGFA[g]) add(GONGFA[g].b); for (const k of c.dt) { const d = DONGTIAN.find(x => x.k === k); if (d) add(d.b); }
  s.hpMax = Math.round(s.hpMax * (1 + P.hpP)); s.mpMax = Math.round(s.mpMax * (1 + P.mpP)); s.atk = Math.round(s.atk * (1 + P.atkP)); s.def = Math.round(s.def * (1 + P.defP)); s.spd = Math.round(s.spd * 10) / 10; s.crit = Math.min(0.6, s.crit);
  s.power = Math.round(s.atk * 6 + s.def * 5 + s.hpMax * 0.6 + s.mpMax * 0.3 + s.crit * 1500 + s.spd * 15 + c.lv * 40);
  return s;
}
function fixHp() { const s = charStats(); C.hp = clamp(C.hp, 0, s.hpMax); C.mp = clamp(C.mp, 0, s.mpMax); }
function fullHeal() { const s = charStats(); C.hp = s.hpMax; C.mp = s.mpMax; }
function skillsOf(c = C) { return ['atk', ...c.bar.filter(id => c.sk.includes(id)), 'guard']; }
function learnSkill(id) { if (C.sk.includes(id)) return; C.sk.push(id); if (C.bar.length < 4) C.bar.push(id); const S = SKILLS[id]; logLine(`<b class="lvup">领悟宝术</b>：${S.icon}<b>${S.name}</b>——${S.desc}`, 'sys'); sfx('epic'); }
function toggleBar(id) { const i = C.bar.indexOf(id); if (i >= 0) C.bar.splice(i, 1); else { if (C.bar.length >= 4) { toast('最多带 4 门宝术进战斗'); return; } C.bar.push(id); } C.bar.sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b)); save(); refresh(); }
function learnGongfa(id) { if (C.gf.includes(id)) return; C.gf.push(id); const G = GONGFA[id]; fixHp(); logLine(`<b class="lvup">修炼有成</b>：${G.icon}<b>${G.name}</b>——${G.desc}`, 'sys'); sfx('epic'); }

/* ---------- pets ---------- */
function gainPet(id) { if (C.pets[id]) return; C.pets[id] = { aff: 10, hatch: 0 }; if (!C.pet) C.pet = id; const P = PETS[id]; logLine(`<b class="lvup">新伙伴</b>：${P.icon}<b>${P.name}</b>（${P.race}）——${P.desc}`, 'sys'); sfx('epic'); save(); refresh(); }
function setPet(id) { if (!C.pets[id]) return; C.pet = C.pet === id ? null : id; sfx('click'); save(); refresh(); }
function feedPet(id, item) { const p = C.pets[id], it = ITEMS[item]; if (!p || !it || !it.food || !takeItem(item)) return; const before = p.aff; p.aff = Math.min(100, p.aff + it.food); sfx('heal');
  const P = PETS[id]; logLine(`${P.icon}${P.name} 吃了${it.name}，${pick(['尾巴摇个不停', '高兴得在你身边打转', '吃完还想要', '舔了舔你的手'])}。（亲近 ${before} → ${p.aff}）`, 'dim');
  for (const s of P.sk) if (s.aff && before < s.aff && p.aff >= s.aff) logLine(`${P.icon}${P.name} 学会了 <b>${s.n}</b>！`, 'sys'); save(); refresh(); }
const petSkillsOpen = id => PETS[id].sk.filter(s => !s.aff || (C.pets[id] && C.pets[id].aff >= s.aff));

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
function gainExp(n, quiet) {
  if (n <= 0) return; C.exp += Math.round(n); if (!quiet) logLine(`获得 <span class="exp">${fmt(n)} 经验</span>`, 'loot');
  while (C.exp >= BAL.expNext(C.lv) && C.lv < BAL.lvCap) {
    if (C.lv === 9 && !C.story.f.jijing) { C.exp = BAL.expNext(C.lv); if (!C.seen.neck9) { C.seen.neck9 = 1; logLine('你体内的气血像江河一样奔涌，却撞上了一层看不见的壁——<b>搬血境走到头了</b>。要怎么往前走，得看机缘（跟着主线走）。', 'sys'); } break; }
    if (C.lv === 19 && !C.story.f.end) { C.exp = BAL.expNext(C.lv); break; }
    C.exp -= BAL.expNext(C.lv); C.lv++; fullHeal(); sfx('level');
    logLine(`<b class="lvup">境界精进！</b> ${realmOf(C.lv).name} · 第 ${C.lv} 层。气血、符力已回满。`, 'sys');
    if (C.lv >= 10 && C.lv <= 18 && C.dt.length < C.lv - 9) STATE.dtPending = true;
  }
  if (C.lv >= BAL.lvCap) C.exp = Math.min(C.exp, BAL.expNext(C.lv));
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
function save(now_) { if (!C || NETROLE === 'guest') return; clearTimeout(saveT); const f = () => { C.savedAt = now(); store.set('save2', C); }; if (now_) f(); else saveT = setTimeout(f, 300); }
function loadSave() { const c = store.get('save2', null); if (!c || c.v !== SAVE_V) return null; const d = newChar(); for (const k in d) if (c[k] === undefined) c[k] = d[k]; if (!PLACES[c.loc]) c.loc = 'sc_street'; return c; }
function nearestTown(loc) { const a = PLACES[loc].area; if (PLACES[loc].town) return loc; if ((a === 'butian' || a === 'baiduan') && C.story.f.joined) return 'bt_court'; if (a === 'butian') return 'bt_gate'; return 'sc_street'; }
