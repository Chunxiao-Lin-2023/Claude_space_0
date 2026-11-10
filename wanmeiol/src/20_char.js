/* ================= the player character: stats, bag, equipment, levels, save ================= */
let C = null; // my character
const SAVE_V = 1;
function newChar(name, cls) {
  const c = { v: SAVE_V, name, cls, lv: 1, exp: 0, hp: 1, mp: 1, gold: 60, loc: 'sc_chief', home: 'sc_street', bag: {}, gear: [], eq: { weapon: null, armor: null, acc: null },
    story: { q: 0, n: 0, f: {} }, side: {}, kills: {}, daily: {}, mail: [], stats: { kills: 0, deaths: 0, bosses: 0, wb: 0, enh: 0, playMin: 0 }, arena: { rank: 0, wins: 0, best: 0 },
    guild: null, market: [], dungeons: {}, title: '', created: now(), auto: false, seen: {} };
  c.eq.weapon = makeEquip('w1', 0); c.eq.armor = makeEquip('a1', 0);
  return c;
}
function charStats(c = C, extra) {
  const K = CLASSES[c.cls], L = c.lv - 1, s = { hpMax: K.base.hp + K.grow.hp * L, mpMax: K.base.mp + K.grow.mp * L, atk: K.base.atk + K.grow.atk * L, def: K.base.def + K.grow.def * L, spd: K.base.spd + K.grow.spd * L, crit: K.base.crit + K.grow.crit * L, leech: 0 };
  let atkP = 0, defP = 0, hpP = 0, mpP = 0;
  for (const sl in c.eq) { const e = c.eq[sl]; if (!e) continue; const q = eqStats(e); s.atk += q.atk; s.def += q.def; s.hpMax += q.hp; s.crit += q.crit; s.spd += q.spd; atkP += q.atkP; defP += q.defP; hpP += q.hpP; mpP += q.mpP; s.leech += q.leech; }
  if (c.story && c.story.f.heart === 'ren') hpP += 0.05; if (c.story && c.story.f.heart === 'yong') atkP += 0.05; if (c.story && c.story.f.heart === 'zhi') mpP += 0.08;
  if (c.guild) atkP += 0.02;
  s.atk = Math.round(s.atk * (1 + atkP)); s.def = Math.round(s.def * (1 + defP)); s.hpMax = Math.round(s.hpMax * (1 + hpP)); s.mpMax = Math.round(s.mpMax * (1 + mpP)); s.spd = Math.round(s.spd * 10) / 10; s.crit = Math.min(0.75, s.crit);
  s.power = Math.round(s.atk * 6 + s.def * 5 + s.hpMax * 0.6 + s.mpMax * 0.3 + s.crit * 1500 + s.spd * 15 + s.leech * 1200 + c.lv * 40);
  return s;
}
function fixHp() { const s = charStats(); C.hp = clamp(C.hp, 0, s.hpMax); C.mp = clamp(C.mp, 0, s.mpMax); }
function fullHeal() { const s = charStats(); C.hp = s.hpMax; C.mp = s.mpMax; }
function skillsOf(c = C) { // usable skills (ids) in bar order
  const out = ['atk']; for (const id of CLASSES[c.cls].skills) if (c.lv >= SKILLS[id].lv) out.push(id);
  if (c.story.f.thunder) out.push('sk_thunder'); if (c.story.f.suanni) out.push('sk_suanni'); out.push('guard'); return out;
}

/* ---------- bag ---------- */
const itemN = id => C.bag[id] || 0;
function addItem(id, n = 1, quiet) { if (!ITEMS[id] || n <= 0) return; C.bag[id] = (C.bag[id] || 0) + n; if (!quiet) logLine(`获得 <span class="it">${ITEMS[id].icon}${ITEMS[id].name}</span> ×${n}`, 'loot'); onItemChange(id); }
function takeItem(id, n = 1) { if ((C.bag[id] || 0) < n) return false; C.bag[id] -= n; if (C.bag[id] <= 0) delete C.bag[id]; onItemChange(id); return true; }
function addGold(n, quiet) { C.gold = Math.max(0, C.gold + Math.round(n)); if (!quiet && n > 0) logLine(`获得 <span class="gold">${fmt(n)} 两</span>`, 'loot'); }
function addEquip(e, quiet) {
  C.gear.push(e); if (!quiet) { const R = BAL.rarity[e.r]; logLine(`获得装备 <span style="color:${R.c}">【${eqName(e)}】</span> <span class="dim">${R.n}</span>`, 'loot'); if (e.r >= 3) { sfx('epic'); worldEvent('drop', { item: eqName(e), r: e.r }); } else sfx('loot'); }
  if (C.gear.length > 60) { // bag overflow: auto-sell the worst 凡品
    const w = C.gear.filter(g => g.r === 0 && !g.p).sort((a, b) => eqPower(a) - eqPower(b))[0]; if (w) { C.gear.splice(C.gear.indexOf(w), 1); addGold(eqPrice(w), true); logLine(`背包已满，自动卖掉了 ${eqName(w)}（+${eqPrice(w)} 两）`, 'dim'); } }
}
function equipItem(u) {
  const i = C.gear.findIndex(g => g.u === u); if (i < 0) return; const e = C.gear[i], b = EQB[e.b];
  if (C.lv < b.lv) { toast(`需要 ${b.lv} 级`); return; }
  C.gear.splice(i, 1); if (C.eq[b.slot]) C.gear.push(C.eq[b.slot]); C.eq[b.slot] = e; fixHp(); sfx('click'); save(); refresh();
}
function unequip(slot) { if (!C.eq[slot]) return; C.gear.push(C.eq[slot]); C.eq[slot] = null; fixHp(); save(); refresh(); }
function sellEquip(u) { const i = C.gear.findIndex(g => g.u === u); if (i < 0) return; const e = C.gear[i]; C.gear.splice(i, 1); addGold(eqPrice(e), true); sfx('gold'); toast(`卖出 ${eqName(e)}，获得 ${eqPrice(e)} 两`); save(); refresh(); }
function sellItem(id, n = 1) { const it = ITEMS[id]; if (!it || !it.price || it.type === 'key') return; n = Math.min(n, itemN(id)); if (!n || !takeItem(id, n)) return; const g = Math.floor(it.price * 0.5) * n; addGold(g, true); sfx('gold'); toast(`卖出 ${it.name}×${n}，获得 ${g} 两`); save(); refresh(); }
function useItem(id, inBattle) {
  const it = ITEMS[id]; if (!it || it.type !== 'use' || !itemN(id)) return false; const s = charStats();
  if (it.recall) { if (inBattle || STATE.battle) { toast('战斗中不能使用'); return false; } if (STATE.scene) { toast('剧情中不能使用'); return false; } takeItem(id); go(nearestTown(C.loc), true); return true; }
  if (it.box) { takeItem(id); for (const [k, n] of it.box) addItem(k, n); if (it.gold) addGold(it.gold); for (let i = 0; i < (it.equip || 0); i++) addEquip(rollEquip(C.lv, 0.8, 2)); save(); refresh(); return true; }
  if (!inBattle) { if (it.heal && C.hp >= s.hpMax && !it.mpHeal) { toast('气血已满'); return false; } takeItem(id); if (it.heal) C.hp = Math.min(s.hpMax, C.hp + s.hpMax * it.heal); if (it.mpHeal) C.mp = Math.min(s.mpMax, C.mp + s.mpMax * it.mpHeal); sfx('heal'); logLine(`使用了 ${it.icon}${it.name}`, 'dim'); save(); refresh(); return true; }
  takeItem(id); return true; // battle use applies to the unit in the battle engine
}
function onItemChange(id) { if (typeof storyItemCheck === 'function') storyItemCheck(id); }

/* ---------- levels & realms ---------- */
function gainExp(n, quiet) {
  if (n <= 0) return; n = Math.round(n * (C.guild ? 1.05 : 1)); C.exp += n; if (!quiet) logLine(`获得 <span class="exp">${fmt(n)} 经验</span>`, 'loot');
  while (C.exp >= BAL.expNext(C.lv) && C.lv < BAL.lvCap) {
    const R = realmOf(C.lv); if (C.lv === R.to) { const nx = BAL.realms[BAL.realms.indexOf(R) + 1]; C.exp = Math.min(C.exp, BAL.expNext(C.lv)); if (!C.seen['neck' + C.lv]) { C.seen['neck' + C.lv] = 1; logLine(`你感到体内的力量撞上了一层看不见的壁障——<b>${R.name}圆满</b>。需要「${ITEMS[nx.need].name}」才能突破到${nx.name}。`, 'sys'); } break; }
    C.exp -= BAL.expNext(C.lv); C.lv++; fullHeal(); sfx('level');
    logLine(`<b class="lvup">等级提升！</b> 你现在是 <b>${C.lv}</b> 级。气血、符力已回满。`, 'sys');
    for (const id of CLASSES[C.cls].skills) if (SKILLS[id].lv === C.lv) logLine(`领悟新宝术：<b>${SKILLS[id].icon}${SKILLS[id].name}</b>——${SKILLS[id].desc}`, 'sys');
    if (C.lv % 5 === 0) worldEvent('level', { lv: C.lv });
    netPub();
  }
  if (C.lv >= BAL.lvCap) C.exp = Math.min(C.exp, BAL.expNext(C.lv));
  if (typeof storyLevelCheck === 'function') storyLevelCheck();
}
function canBreak() { const R = realmOf(C.lv); const nx = BAL.realms[BAL.realms.indexOf(R) + 1]; return nx && C.lv === R.to && C.exp >= BAL.expNext(C.lv) && C.lv < BAL.lvCap ? nx : null; }
function breakthrough() {
  const nx = canBreak(); if (!nx) return; if (!itemN(nx.need)) { toast(`需要「${ITEMS[nx.need].name}」`); return; }
  if (nx.name === '铭纹境') { toast('铭纹境将在下一卷开放'); return; }
  takeItem(nx.need); C.exp = 0; C.lv++; fullHeal(); sfx('epic');
  logLine(`<b class="lvup">——突破！——</b><br>你服下${ITEMS[nx.need].name}，盘膝而坐。体内气血如江河奔涌，轰然冲破了那层壁障。${nx.name === '洞天境' ? '恍惚间，你仿佛看见体内开辟出一方小小的洞天，符文在其中流转不息。' : '血肉中的符文一个个亮起，像是活了过来，你的每一寸骨头都在发出低鸣。'}<br>你踏入了 <b>${nx.name}</b>！`, 'sys');
  worldEvent('realm', { realm: nx.name }); save(); refresh(); netPub();
  if (typeof storyLevelCheck === 'function') storyLevelCheck();
}

/* ---------- save ---------- */
let saveT = 0;
function save(now_) { if (!C || STATE.guestPreview) return; clearTimeout(saveT); const f = () => { C.savedAt = now(); store.set('save', C); }; if (now_) f(); else saveT = setTimeout(f, 300); }
function loadSave() { const c = store.get('save', null); if (!c || c.v !== SAVE_V || !CLASSES[c.cls]) return null; // migrate missing fields
  const d = newChar(c.name, c.cls); for (const k in d) if (c[k] === undefined) c[k] = d[k]; if (!PLACES[c.loc]) c.loc = 'sc_street'; return c; }
function nearestTown(loc) { const a = PLACES[loc].area; if (PLACES[loc].town) return loc; if (a === 'butian' && C.story.f.inSect) return 'bt_outer'; if (a === 'dahuang' && ['road', 'th_marsh'].includes(loc) && C.story.f.city) return 'bc_gate'; return C.home && PLACES[C.home] ? C.home : 'sc_street'; }
