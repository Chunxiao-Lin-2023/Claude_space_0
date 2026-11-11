/* ================= turn-based battle =================
   石昊 (you), the active pet and story allies on one side; beasts, or a 虚神界 rival, on the other.
   Enemy intentions are shown a round ahead (“蓄力” = a big hit is coming). */
const STATE = { mode: 'title', battle: null, scene: null, dungeon: null, busy: false };
const ALLY_NPC = {
  a_linhu: { name: '石林虎', icon: '🏹', mul: { hp: 1.5, atk: 0.9, def: 1 }, sk: [{ n: '骨箭', dmg: 1, w: 3 }, { n: '连珠箭', dmg: 0.7, aoe: 1, w: 1 }] },
  a_kids: { name: '大壮和二猛', icon: '👦', mul: { hp: 1.3, atk: 0.6, def: 0.8 }, sk: [{ n: '扔石头', dmg: 0.9, w: 3 }, { n: '一起扑上去', dmg: 0.5, aoe: 1, w: 1 }] },
  a_chief: { name: '石云峰', icon: '👴', mul: { hp: 2.2, atk: 1.2, def: 1.4 }, sk: [{ n: '族长一掌', dmg: 1.1, w: 3 }, { n: '骨文护体', healAlly: 0.2, w: 1 }] },
  a_huo: { name: '火灵儿', icon: '👘', mul: { hp: 1.4, atk: 1.15, def: 1, spd: 1.2 }, sk: [{ n: '火凤翎', dmg: 1.05, el: 'fire', w: 3 }, { n: '焚天火海', dmg: 0.75, aoe: 1, el: 'fire', st: { k: 'burn', t: 2, v: 0.3, p: 0.6 }, w: 1 }] },
  a_lion: { name: '九头狮（小弟）', icon: '🦁', mul: { hp: 2.2, atk: 1.1, def: 1.3 }, sk: [{ n: '九首噬咬', dmg: 0.55, aoe: 1, w: 2 }, { n: '护大哥', taunt: 2, guard: 1, w: 1 }, { n: '金焰', dmg: 1.05, st: { k: 'burn', t: 2, v: 0.25, p: 0.5 }, w: 2 }] },
  a_shiyi: { name: '石毅', icon: '👁️', mul: { hp: 2.4, atk: 1.6, def: 1.4 }, sk: [{ n: '重瞳', dmg: 1.2, mag: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.5 }, w: 3 }, { n: '重瞳神光', dmg: 0.75, aoe: 1, mag: 1, w: 2 }] },
  a_meng: { name: '孟天正', icon: '🗡️', mul: { hp: 3, atk: 1.8, def: 1.6 }, sk: [{ n: '一剑', dmg: 1.4, w: 3 }, { n: '剑幕', dmg: 0.8, aoe: 1, w: 2 }, { n: '护着你', taunt: 2, guard: 1, w: 1 }] },
  a_shicun: { name: '石村八百兵', icon: '🏹', mul: { hp: 2.6, atk: 1.2, def: 1.5 }, sk: [{ n: '齐射', dmg: 0.7, aoe: 1, w: 2 }, { n: '石村长矛', dmg: 1.1, w: 3 }, { n: '护着小不点', taunt: 2, guard: 1, w: 1 }] },
  a_sanzang: { name: '三藏', icon: '🧘', mul: { hp: 2.4, atk: 1.5, def: 1.5 }, sk: [{ n: '佛光', dmg: 0.75, aoe: 1, w: 2 }, { n: '金刚拳', dmg: 1.2, w: 3 }] },
  a_liushen: { name: '柳神', icon: '🌳', mul: { hp: 3.2, atk: 1.9, def: 1.8 }, sk: [{ n: '万千柳枝', dmg: 0.9, aoe: 1, w: 2 }, { n: '柳枝一抽', dmg: 1.5, w: 3 }, { n: '护着你', taunt: 2, guard: 1, w: 1 }] },
  a_xiaoqi: { name: '小七', icon: '🕯️', mul: { hp: 2.6, atk: 0.8, def: 1.1 }, sk: [{ n: '守城枪', dmg: 0.9, w: 3 }, { n: '咬牙顶住', buff: { k: 'def', t: 2, v: 0.3 }, w: 1 }] },
  a_huolingS: { name: '沉睡的火灵儿', icon: '🔥', mul: { hp: 2.8, atk: 0.3, def: 1.2 }, sk: [{ n: '睡着', buff: { k: 'def', t: 1, v: 0.1 }, w: 1 }] },
  a_jun: { name: '石国禁军', icon: '⚔️', mul: { hp: 2, atk: 1, def: 1.3 }, sk: [{ n: '结阵', dmg: 0.6, aoe: 1, w: 2 }, { n: '长戈', dmg: 1.05, w: 3 }] },
  a_eagle: { name: '青鳞小鹰', icon: '🦅', mul: { hp: 1.1, atk: 1.1, def: 0.9, spd: 1.6 }, sk: [{ n: '鳞爪', dmg: 1.05, w: 3 }, { n: '鳞羽', dmg: 0.6, aoe: 1, w: 1 }] },
  a_yunxi: { name: '云曦', icon: '🌙', mul: { hp: 1.3, atk: 1, def: 1 }, sk: [{ n: '月华', dmg: 1, mag: 1, w: 3 }, { n: '清辉', healAlly: 0.18, w: 1 }] },
};
const unitDef = id => MOBS[id] || ALLY_NPC[id] || PETS[id];
let BID = 1;
function mobUnit(id, lv, side = 1) {
  const M = unitDef(id); lv = lv || M.lv || 1; const E = BAL.enemy(lv), m = M.mul || {}, D = side ? { hp: diffOf().hp * BAL.foeHp(lv) * ngFoe(), atk: diffOf().atk * BAL.foeAtk(lv) * ngFoeAtk() } : { hp: 1, atk: 1 };
  return { id: 'u' + (BID++), side, kind: side ? 'mob' : 'npc', mob: id, name: M.name, icon: M.icon || (M.boss ? '👹' : '🐾'), lv, boss: !!M.boss,
    hpMax: Math.round(E.hp * (m.hp || 1) * D.hp), atk: Math.round(E.atk * (m.atk || 1) * D.atk), def: Math.round(E.def * (m.def || 1)), spd: E.spd * (m.spd || 1), crit: M.boss ? 0.08 : 0.05, leech: 0, mpMax: 0, mp: 0, sk: [], cd: {}, st: [], alive: true, plan: null, intent: '' };
}
function heroUnit() { const s = charStats(); const u = { id: 'hero', side: 0, kind: 'pc', name: '石昊', icon: '🧒', lv: C.lv, hpMax: s.hpMax, hp: Math.max(1, Math.round(C.hp)), mpMax: s.mpMax, mp: Math.round(C.mp), atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, leech: s.leech || 0, regen: s.regen || 0, sk: skillsOf(), cd: {}, st: [], alive: true,
    prof: Object.fromEntries(C.sk.map(id => [id, PROF[profLevel(id)].b + (id === 'lei' ? relicSp('lei') : 0)])), mpRegen: BAL.mpRegen + relicSp('mp'), noPoison: !!relicSp('noPoison'), first: relicSp('first') };
  const sh = relicSp('shieldStart'); if (sh) u.st.push({ k: 'shield', t: 3, v: Math.round(s.hpMax * sh) }); if (u.first) u.st.push({ k: 'atk', t: 1, v: u.first }); return u; }
function petUnit(id, slot = 0) { // the partner scales with 石昊; affection up to +15%, 觉醒 +8%, 返祖 +8%, 真身 +5%, and ±3% per level it is above / below him
  const s = charStats(), P = PETS[id], pd = C.pets[id], aff = pd.aff, plv = petLv(id), k = (1 + aff / 100 * 0.15) * (pd.evo ? 1.08 : 1) * (pd.evo2 ? 1.08 : 1) * (pd.evo3 ? 1.05 : 1) * clamp(1 + 0.03 * (plv - C.lv), 0.7, 1.5), m = P.mul;
  return { id: slot ? 'pet' + (slot + 1) : 'pet', lead: !slot, trait: id, side: 0, kind: 'npc', mob: id, pet: 1, evo: !!pd.evo, name: P.name + (pd.evo3 ? '·真身' : pd.evo2 ? '·返祖' : pd.evo ? '·觉醒' : ''), icon: P.icon, lv: plv, hpMax: Math.round(s.hpMax * m.hp * k), atk: Math.round(s.atk * m.atk * k), def: Math.round(s.def * m.def * k), spd: s.spd * m.spd, crit: 0.08, leech: 0, mpMax: 0, mp: 0, sk: [], cd: {}, st: [], alive: true, plan: null, intent: '', aff, hp: 0 };
}
function rivalUnit(r) { // 虚神界 rivals fight with 宝术 like you do
  const L = r.lv - 1, g = r.gear || 1, D = diffOf(); const u = { id: 'u' + (BID++), side: 1, kind: 'rival', name: r.name, icon: r.icon || '🧑', lv: r.lv, boss: !!r.boss, shiyi: !!r.shiyi, hpMax: Math.round((HERO.base.hp + HERO.grow.hp * L) * g * 1.25 * D.hp * (r.shiyi ? 1.3 : 1)), atk: Math.round((HERO.base.atk + HERO.grow.atk * L) * g * D.atk), def: Math.round((HERO.base.def + HERO.grow.def * L) * g), spd: HERO.base.spd + HERO.grow.spd * L + (r.shiyi ? 3 : 0), crit: 0.12, leech: 0,
    mpMax: Math.round(HERO.base.mp + HERO.grow.mp * L), sk: ['atk', ...(r.sk || ['qly', 'sn'])], cd: {}, st: [], alive: true };
  u.hp = u.hpMax; u.mp = u.mpMax; return u;
}
/* spec: { mobs:[[id,lv]], allies:[id], rivals:[{name,lv,gear,sk}], tag, title, flee, noLose, roam, story } */
function battleCreate(spec) {
  const B = { id: 'b' + (BID++), story: !!spec.story, tag: spec.tag || '', title: spec.title || '', round: 1, units: [], log: [], lc: 0, ev: [], over: false, win: null, flee: spec.flee !== false, acts: {}, kills: [], dungeon: spec.dungeon || null, room: spec.room ?? null, noLose: !!spec.noLose, arena: spec.arena || null, roam: spec.roam || null, seq: 0, petHp: {}, noPet: !!spec.noPet };
  B.units.push(heroUnit());
  const party = spec._party || partyFor(partySlots(spec)); B.partyN = party.length; party.forEach((id, i) => { if (!C.pets[id]) return; const p = petUnit(id, i); partyPet(B, p); p.hp = p.hpMax; B.units.push(p); });
  for (const id of spec.allies || []) { const u = mobUnit(id, C.lv, 0); u.hp = u.hpMax; B.units.push(u); }
  for (const r of spec.rivals || []) B.units.push(rivalUnit(r));
  for (const [id, lv] of spec.mobs || []) { const u = mobUnit(id, lv, 1); u.hp = u.hpMax; if (spec.roam) { u.hpMax = Math.round(spec.roam.hpMax * diffOf().hp * BAL.foeHp(lv)); u.hp = Math.round(spec.roam.hp * diffOf().hp * BAL.foeHp(lv)); } B.units.push(u); }
  for (const u of B.units) partyFoe(B, u);
  for (const u of B.units) if (u.kind === 'mob' || u.kind === 'npc') planMob(B, u);
  for (const [id] of spec.mobs || []) if (!MOBS[id].nocodex) { C.codex = C.codex || {}; C.codex[id] = C.codex[id] || { wk: [] }; }
  blog(B, `<span class="bt">⚔ ${spec.title || '战斗开始'}</span>`);
  const foes = B.units.filter(u => u.side === 1), talker = foes.find(u => u.boss || u.kind === 'rival') || foes[0];
  if (talker) battleSay(B, talker, 'open'); banterOpen(B);
  B.sayQ = []; B.epic = spec.epic || null; B.auto = spec.auto ?? !!(C.auto || UI.forceAuto); // 🤖 in a fight only lasts for that fight
  mechInit(B, spec); B.waves = spec.waves ? spec.waves.slice() : null; B.stance = spec.stance || null; B.endless = spec.endless ? { n: 0 } : null; stanceApply(B);
  if (B.waves) { B.waveN = 1; B.title = `${B.baseTitle}（第 1/${1 + B.waves.length} 波）`; } return B;
}
const alive = (B, side) => B.units.filter(u => u.alive && (side === undefined || u.side === side));
const stOf = (u, k) => u.st.find(s => s.k === k);
const stV = (u, k) => { let v = 0; for (const s of u.st) if (s.k === k) v += s.v || 0; return v; };
function addSt(u, s) { if (s.k === 'poison' && u.noPoison) return; const ex = u.st.find(x => x.k === s.k); if (ex) { ex.t = Math.max(ex.t, s.t); if (s.k === 'shield') ex.v = (ex.v || 0) + (s.v || 0); else ex.v = Math.max(ex.v || 0, s.v || 0); } else u.st.push({ k: s.k, t: s.t, v: s.v || 0 }); }
function blog(B, html) { B.log.push(html); B.lc++; if (B.log.length > 150) B.log.splice(0, B.log.length - 150); }
/* animation records: what happened, in order, tied to the log line it belongs to (li = running line number) */
const fxe = (B, o) => { o.li = B.lc; B.ev.push(o); };
const hpr = u => Math.max(0, u.hp / u.hpMax);
const uName = u => `<span class="${u.side ? 'foe' : u.kind === 'pc' ? 'pc' : 'ally'}">${esc(u.name)}</span>`;
/* who still has to choose this round: 石昊, then the 灵兽伙伴 (unless auto-battle, or 石昊 is calling a different 伙伴 in) */
const needInput = B => B.units.filter(u => u.alive && !B.acts[u.id] && (u.kind === 'pc' || (u.pet && !B.auto && !(B.acts.hero && (B.acts.hero.swap || B.acts.hero.crush || B.acts.hero.flee)))));
function petPick(B, u) { // the partner's own judgement (auto-battle, or the default before you choose)
  const mv = petMoves(u), h = B.units.find(x => x.kind === 'pc'), foes = alive(B, 1), has = c => mv.filter(x => x.s.cat === c), pw = L => wpick(L, x => x.s.w || 1).i;
  const atk = has('atk'); if (!h || !foes.length) return pw(atk);
  const hurt = alive(B, 0).find(a => a.hp < a.hpMax * 0.45), defs = has('def');
  if (hurt) { const L = defs.filter(x => x.s.healAlly || x.s.shieldAll || x.s.shieldHero); if (L.length && chance(0.75)) return pw(L); }
  if (foes.some(f => f.releasing || f.plan === 'charge')) { const L = defs.filter(x => x.s.taunt || x.s.shieldHero || x.s.shieldAll); if (L.length && u.hp > u.hpMax * 0.5 && chance(0.7)) return pw(L); }
  const buffs = has('buff'); if (buffs.length && h.alive && !h.st.some(x => ['atk', 'sure', 'dodge'].includes(x.k)) && chance(0.4)) return pw(buffs);
  const deb = has('debuff'), tgt = foes.find(f => f.boss) || (foes.length >= 2 ? foes[0] : null); if (deb.length && tgt && !tgt.st.some(x => ['brk', 'mark', 'weak'].includes(x.k)) && chance(0.55)) return pw(deb);
  const aoe = atk.filter(x => x.s.aoe), one = atk.filter(x => !x.s.aoe); return pw(foes.length >= 2 && aoe.length ? aoe : one.length ? one : atk); }
const petMovesAll = u => PETS[u.mob].sk.map((s, i) => ({ s, i })).filter(x => !(x.s.aff && (u.aff || 0) < x.s.aff) && !(x.s.evo && !u.evo));
const petMoves = u => { const open = petMovesAll(u), bar = petBar(u.mob); const L = open.filter(x => bar.includes(x.i)); return L.length ? L : open; };

/* ---------- AI ---------- */
function planMob(B, u) {
  const M = unitDef(u.mob); if (!M) return; u.releasing = false; if (u.pet) { u.plan = petPick(B, u); u.intent = ''; return; }
  if (u.charging != null) { const s = M.sk[u.charging]; u.plan = u.charging; u.charging = null; u.releasing = true; u.intent = '⚠ ' + s.n; return; }
  const cands = M.sk.map((s, i) => ({ s, i, w: s.w ?? 1 })).filter(x => x.w > 0 && !(x.s.aff && (u.aff || 0) < x.s.aff) && !(x.s.evo && !u.evo) && !(x.s.healAlly && !alive(B, u.side).some(v => v.hp < v.hpMax * 0.7)) && !(x.s.summon && alive(B, u.side).filter(v => v.mob === x.s.summon).length >= (x.s.max || 2)));
  const c = wpick(cands); if (c.s.charge) { u.charging = c.i; u.plan = 'charge'; u.intent = '⏳ 蓄力：' + c.s.n; } else { u.plan = c.i; u.intent = c.s.aoe ? '◎ ' + c.s.n : c.s.buff || c.s.healAlly || c.s.shieldAll ? '✦ ' + c.s.n : '→ ' + c.s.n; }
  mechPlan(B, u);
}
function pickFoe(B, u) { const foes = alive(B, 1 - u.side); if (!foes.length) return null; const t = foes.filter(f => stOf(f, 'taunt')); if (t.length) return pick(t); return wpick(foes, f => (f.kind === 'pc' ? 1.5 : 1)); }
const HEALS = ['baoyao', 'meat', 'herb', 'milk'];
function botAct(B, u) { // auto-battle for 石昊 and the AI for 虚神界 rivals
  const allies = alive(B, u.side), foes = alive(B, 1 - u.side); if (!foes.length) return { sk: 'atk' };
  const can = id => u.sk.includes(id) && !(u.cd[id] > 0) && u.mp >= SKILLS[id].mp; const boss = foes.find(f => f.boss), main = boss || foes.slice().sort((a, b) => a.hp - b.hp)[0];
  const pc = u.kind === 'pc', known = f => pc && f.mob ? knownWeak(f.mob) : [];
  if (pc && u.hp < u.hpMax * 0.35 && B.itemRound !== B.round) { const it = (u.hp < u.hpMax * 0.2 ? HEALS : HEALS.slice(1).concat('baoyao')).find(i => itemN(i)); if (it) return { item: it }; }
  const big = foes.find(f => f.releasing || f.plan === 'charge');
  if (big) { for (const id of ['dsh', 'jian', 'qly']) if (can(id) && SKILLS[id].el && known(big).includes(SKILLS[id].el)) return { sk: id, tgt: big.id };
    if (big.releasing && can('sn') && !big.boss) return { sk: 'sn', tgt: big.id }; if (big.releasing && pc && u.hp < u.hpMax * 0.75) return { sk: 'guard' }; }
  if (can('ta') && allies.filter(a => a.hp < a.hpMax * 0.6).length >= 1) return { sk: 'ta' };
  if (can('lei') && foes.some(f => known(f).includes('lei'))) return { sk: 'lei' }; if (can('gw') && foes.some(f => known(f).includes('bone'))) return { sk: 'gw' };
  if (can('dsh')) { const t = foes.find(f => known(f).includes('blunt')); if (t) return { sk: 'dsh', tgt: t.id }; }
  if (foes.length >= 2 && can('lei')) return { sk: 'lei' }; if (foes.length >= 3 && can('gw')) return { sk: 'gw' };
  for (const id of ['dsh', 'sn', 'jian', 'qly']) if (can(id)) return { sk: id, tgt: (id === 'sn' ? foes.find(f => f.plan === 'charge') || main : id === 'jian' ? foes.find(f => stOf(f, 'bleed')) || main : main).id };
  if (u.mp < u.mpMax * 0.15 && pc) return { sk: 'guard' };
  return { sk: 'atk', tgt: main.id };
}
/* ---------- damage ---------- */
const weakOf = (d, el) => el && d.mob && MOBS[d.mob] && MOBS[d.mob].weak && MOBS[d.mob].weak[el] || 0;
function hitCalc(a, d, mul, mag, opts = {}) {
  const dodge = 0.03 + Math.max(0, d.spd - a.spd) * 0.008 + stV(d, 'dodge'); if (!opts.sure && Math.random() < Math.min(0.5, dodge)) return { miss: true, dmg: 0 };
  const atk = a.atk * (1 + stV(a, 'atk') + stV(a, 'rage') + stV(a, 'burst')) * (1 - stV(a, 'weak')); const wk = weakOf(d, opts.el); if (wk) mul *= wk; let def = d.def * (1 + stV(d, 'def')) * (1 - stV(d, 'brk')); if (mag) def *= 0.5; if (opts.pierce) def = 0;
  let bound = false; if (!mag && stOf(d, 'bound')) { mul *= 1.3; bound = true; d.st = d.st.filter(s => s.k !== 'bound'); } // 骨文锁链 → the next physical hit lands harder
  const K = BAL.defK + a.lv * 7; let dmg = atk * mul * K / (K + def) * rnd(0.9, 1.1);
  const crit = !!stOf(a, 'sure') || Math.random() < a.crit; if (crit) dmg *= BAL.critMul; if (stOf(d, 'guard')) dmg *= 0.5; dmg *= mechDmgMul(a, d) * partyDmgMul(a, d);
  return { dmg: Math.max(1, Math.round(dmg)), crit, weak: !!wk, bound };
}
function noteWeak(d, el) { if (!d.mob || !C.codex || !C.codex[d.mob]) return; const w = C.codex[d.mob].wk || (C.codex[d.mob].wk = []); if (!w.includes(el)) w.push(el); }
function tryInterrupt(B, t) { // a stun or a hit on its weak spot breaks a gathering blow
  if (!t.alive || t.side !== 1 || !(t.plan === 'charge' || t.releasing)) return false;
  t.charging = null; t.releasing = false; t.plan = 'broken'; t.intent = '💫 被打断'; fxe(B, { k: 'int', t: t.id }); B.ints = (B.ints || 0) + 1; return true; }
function applyDmg(B, a, d, dmg, info = {}) {
  const sh = stOf(d, 'shield'); let absorbed = 0; if (sh) { absorbed = Math.min(sh.v, dmg); sh.v -= absorbed; dmg -= absorbed; if (sh.v <= 0) d.st.splice(d.st.indexOf(sh), 1); }
  if (B.roam && d.side === 1 && dmg > 0) B.roamDmg = (B.roamDmg || 0) + Math.min(dmg, d.hp);
  d.hp -= dmg; partyHurt(B, d, dmg); if (a && a.leech && dmg > 0) a.hp = Math.min(a.hpMax, a.hp + dmg * a.leech);
  fxe(B, { k: info.dot ? 'dot' : 'hit', t: d.id, v: dmg + absorbed, crit: !!info.crit, weak: !!info.weak, hp: hpr(d), st: info.dot }); if (d.kind === 'pc' && B.epic) epicLow(B, d); banterHit(B, a, d, info); mechHit(B, a, d, dmg + absorbed, Object.assign({ ate: absorbed }, info));
  if (d.side === 1 && B.sayQ) { if (d.hp <= 0) B.sayQ.push([d, 'die']); else if (!d.saidLow && d.hp < d.hpMax * 0.25) { d.saidLow = 1; B.sayQ.push([d, 'low']); } }
  if (d.hp <= 0 && mechDie(B, d)) return false;
  if (d.hp <= 0) { d.hp = 0; d.alive = false; d.st = []; fxe(B, { k: 'die', t: d.id }); epicKill(B, d); partyKill(B, a, d); if (d.side === 1 && B.sayQ) B.sayQ.push([a, 'killq', d]); if (d.side === 1 && d.kind === 'mob') B.kills.push([d.mob, d.lv, d.boss]); return true; }
  if (d.boss && d.side === 1 && !d.raged && d.hp <= d.hpMax / 2 && d.mob && MOBS[d.mob]) { d.raged = true; addSt(d, { k: 'rage', t: 99, v: BAL.phaseAtk }); B.phase = 1;
    blog(B, `<span class="phase">${MOBS[d.mob].p2 || esc(d.name) + '被激怒了！'}（攻击提升）</span>`); fxe(B, { k: 'phase', t: d.id }); epicPhase(B, d); mechPhase(B, d); }
  return false;
}
const SK_FX = { atk: 'slash', qly: 'claw', sn: 'roar', gw: 'bone', lei: 'lei', dsh: 'rock', jian: 'blade', ta: 'tower', guard: 'guard' };
function comboOf(id, t) { // 宝术 that work together
  if (id === 'jian' && stOf(t, 'bleed')) return [1.35, '伤口崩裂'];
  if (id === 'lei' && (stOf(t, 'stun') || stOf(t, 'freeze'))) return [1.25, '雷落在动弹不得的身上'];
  if (id === 'sn' && t.raged) return [1.2, '狻猊对上狂怒的凶兽，吼得更响'];
  return [1, ''];
}
function canCrush(B) { const h = B.units.find(u => u.kind === 'pc'); const foes = alive(B, 1); return !B.over && !B.story && !B.arena && !B.roam && !B.dungeon && foes.length && foes.every(f => f.kind === 'mob' && !f.boss && f.lv <= h.lv - 4); }
function perform(B, u, act, L) {
  if (u.kind === 'mob' || u.kind === 'npc') { banterAct(B, u); return mobAct(B, u, L); }
  if (!act) act = botAct(B, u);
  if (act.flee) { if (!B.flee || alive(B, 1).some(f => f.boss)) { L(`${uName(u)} 想跑，可对方死死盯着你！`); return; } if (Math.random() < BAL.flee) { L(`${uName(u)} <b>撒腿就跑，逃掉了</b>`); B.over = true; B.win = null; B.fled = true; return; } L(`${uName(u)} 没跑掉！`); return; }
  if (act.crush && canCrush(B)) { fxe(B, { k: 'act', a: u.id, fx: 'crush', tg: alive(B, 1).map(f => f.id) }); for (const f of alive(B, 1)) applyDmg(B, u, f, f.hp, {}); L(`${uName(u)} 一拳一个，干净利落`); return; }
  if (act.item) { const it = ITEMS[act.item]; if (it) { if (it.heal) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * it.heal); if (it.mp) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * it.mp); fxe(B, { k: 'heal', t: u.id, v: Math.round(u.hpMax * (it.heal || 0)), hp: hpr(u) }); L(`${uName(u)} 用了 ${it.icon}${it.name}`); B.fx = 'heal'; } return; }
  if (act.swap && C.pets[act.swap] && !B.units.some(x => x.pet && !x.lead && x.mob === act.swap)) { const old = B.units.find(x => x.pet && x.lead); if (old) { B.petHp[old.mob] = old.alive ? hpr(old) : 0; B.units = B.units.filter(x => x !== old); }
    const p = petUnit(act.swap); partyPet(B, p); p.hp = Math.round(p.hpMax * (B.petHp[act.swap] ?? 1)); p.alive = p.hp > 0; planMob(B, p); B.units.splice(1, 0, p); if (NETROLE !== 'guest') C.pet = act.swap; fxe(B, { k: 'swap', t: 'pet' }); L(`${uName(u)} 一声口哨，换 ${uName(p)} 上场`); return; }
  let id = act.sk || 'atk', S = SKILLS[id]; if (!S || !u.sk.includes(id) || u.cd[id] > 0 || u.mp < S.mp) { id = 'atk'; S = SKILLS.atk; }
  u.mp -= S.mp; if (S.cd) u.cd[id] = S.cd + 1; if (u.kind === 'pc' && id !== 'atk' && id !== 'guard' && NETROLE !== 'guest') profUse(id); const pb = 1 + ((u.prof && u.prof[id]) || 0); const foes = alive(B, 1 - u.side), allies = alive(B, u.side);
  let tg = []; if (S.tgt === 'enemy') { const t = foes.find(x => x.id === act.tgt) || foes.slice().sort((a, b) => a.hp - b.hp)[0]; if (t) tg = [t]; } else if (S.tgt === 'enemies') tg = foes; else if (S.tgt === 'allies') tg = allies; else tg = [u];
  const head = id === 'atk' ? `${uName(u)} 出手` : id === 'guard' ? `${uName(u)} 护住要害` : `${uName(u)} 施展 <span class="sk">${S.icon}${S.name}</span>`;
  fxe(B, { k: 'act', a: u.id, fx: SK_FX[id] || 'slash', tg: tg.map(t => t.id), side: u.side, n: id === 'atk' ? '' : S.name, ic: S.icon, who: u.kind === 'pc' ? 'hero' : 'foe' });
  if (S.dmg) { const parts = [];
    for (const t of tg) { if (!t.alive) continue; const hits = S.hits || 1; let tot = 0, crit = false, miss = 0, died = false;
      const [cm0, ct0] = comboOf(id, t), seen = t.shiyi && u.kind === 'pc' && id !== 'atk' && id === u.lastSk ? 0.5 : 1, mk = u.kind === 'pc' && stOf(t, 'mark') ? 1 + stV(t, 'mark') : 1, cm = cm0 * mk, ct = [ct0, mk > 1 ? '印记' : '', u.kind === 'pc' && stOf(t, 'brk') && S.dmg ? '破甲' : ''].filter(Boolean).join('·');
      let weak = false, bound = false; for (let h = 0; h < hits && t.alive; h++) { const r = hitCalc(u, t, S.dmg * pb * cm * seen / hits, S.mag, { sure: !!stOf(u, 'sure'), pierce: S.pierce, el: S.el }); if (r.miss) { miss++; fxe(B, { k: 'miss', t: t.id }); continue; } tot += r.dmg; crit = crit || r.crit; weak = weak || r.weak; bound = bound || r.bound; if (applyDmg(B, u, t, r.dmg, { crit: r.crit, weak: r.weak })) died = true; }
      if (weak && u.side === 0) { noteWeak(t, S.el); B.weakHits = (B.weakHits || 0) + 1; }
      if (miss === hits) parts.push(`${uName(t)} <span class="miss">躲开了</span>`);
      else { parts.push(`${uName(t)} <span class="${crit ? 'crit' : 'dmg'}">-${tot}${crit ? ' 暴击!' : ''}</span>${weak ? ' <span class="weak">正中要害</span>' : ''}${ct ? ` <span class="weak">${ct}</span>` : ''}${bound ? ' <span class="weak">借着骨文锁链</span>' : ''}${seen < 1 ? ' <span class="miss">重瞳看穿了这一招</span>' : ''}${died ? ' <b class="die">倒下</b>' : ''}`); B.fx = crit ? 'crit' : 'hit';
        let stunned = false; if (t.alive && S.st) for (const s of S.st) if (Math.random() < (s.p ?? 1) && !(s.k === 'stun' && t.boss && Math.random() < 0.5)) { addSt(t, { k: s.k, t: s.t, v: s.v ? Math.round(u.atk * s.v) : 0 }); if (s.k === 'stun') stunned = true; parts.push(`<span class="st" style="color:${STATUS[s.k].c}">${STATUS[s.k].n}</span>`); }
        if (t.alive && id === 'gw') addSt(t, { k: 'bound', t: 2 });
        if (u.side === 0 && (stunned || weak) && tryInterrupt(B, t)) parts.push('<span class="weak">打断了它的蓄力！</span>'); } }
    L(head + '：' + parts.join('，'));
  } else if (S.shield) { const v = Math.round(u.atk * S.shield * pb); for (const t of tg) { addSt(t, { k: 'shield', t: 3, v }); fxe(B, { k: 'shield', t: t.id, v }); } L(`${head}，全队获得 <span class="heal">${v}</span> 点护盾`); B.fx = 'heal'; }
  else L(head);
  if (S.self) for (const s of S.self) addSt(u, s); if (S.mpBack) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * S.mpBack);
  if (stOf(u, 'sure') && S.dmg) u.st = u.st.filter(s => s.k !== 'sure'); u.lastSk = id; if (u.kind === 'pc') mechHeroAct(B, u, Object.assign({}, act, { sk: id }));
}
function mobFx(s) { return s.healAlly ? 'heal' : s.shieldAll ? 'shield' : s.buff ? 'buff' : s.cat === 'debuff' ? 'curse' : s.el === 'fire' ? 'fire' : s.mag ? 'magic' : s.aoe ? 'wave' : 'claw'; }
const mobWho = u => u.pet ? 'pet' : u.side ? (u.boss ? 'boss' : 'foe') : 'ally';
function mobAct(B, u, L) {
  const M = unitDef(u.mob); if (u.plan === 'charge') { fxe(B, { k: 'act', a: u.id, fx: 'charge', tg: [], side: u.side }); L(`${uName(u)} 正在<span class="warn">蓄力</span>……`); return; }
  if (u.plan === 'broken') { L(`${uName(u)} 踉跄了一下，蓄好的力全散了`); return; }
  const pa = u.pet && B.acts[u.id]; if (pa) { if (pa.guard) { addSt(u, { k: 'guard', t: 1, v: 0.5 }); fxe(B, { k: 'act', a: u.id, fx: 'guard', tg: [u.id], side: 0 }); L(`${uName(u)} 缩成一团，护住要害`); return; } if (petMoves(u).some(x => x.i === pa.psk)) u.plan = pa.psk; }
  let s = M.sk[u.plan ?? 0] || M.sk[0]; if (u.pet) s = rankedMove(s, petRank(u.mob, M.sk.indexOf(s))); if (s.mfn && MECH_FN[s.mfn]) { MECH_FN[s.mfn](B, u, s, L); return; } const foes = alive(B, 1 - u.side); if (!foes.length) return; u.releasing = false;
  if (s.taunt || s.buffHero || s.shieldHero) { const h = B.units.find(x => x.kind === 'pc' && x.alive) || u;
    if (s.taunt) { addSt(u, { k: 'taunt', t: s.taunt }); if (s.guard) addSt(u, { k: 'guard', t: 1, v: 0.5 }); fxe(B, { k: 'act', a: u.id, fx: 'taunt', tg: [u.id], side: u.side, n: s.n, who: mobWho(u) }); L(`${uName(u)} <span class="sk">${s.n}</span>，敌人的目光全被它引了过去`); return; }
    if (s.buffHero) { addSt(h, s.buffHero); fxe(B, { k: 'act', a: u.id, fx: 'bless', tg: [h.id], side: u.side, n: s.n, who: mobWho(u) }); L(`${uName(u)} <span class="sk">${s.n}</span>，${uName(h)} <span style="color:${STATUS[s.buffHero.k].c}">${s.buffHero.k === 'sure' ? '下一击必暴' : STATUS[s.buffHero.k].n + (s.buffHero.v ? ' +' + Math.round(s.buffHero.v * 100) + '%' : '')}</span>`); return; }
    if (s.shieldHero) { const v = Math.round(u.atk * s.shieldHero * (u.pet ? (u.trait === 'ertuzi' ? 0.75 : 0.55) : 1)); addSt(h, { k: 'shield', t: 3, v }); fxe(B, { k: 'act', a: u.id, fx: 'shield', tg: [h.id], side: u.side, n: s.n, who: mobWho(u) }); fxe(B, { k: 'shield', t: h.id, v }); L(`${uName(u)} <span class="sk">${s.n}</span>，${uName(h)} 获得 <span class="heal">${v}</span> 点护盾`); B.fx = 'heal'; return; } }
  if (s.buff) { addSt(u, s.buff); fxe(B, { k: 'act', a: u.id, fx: 'buff', tg: [u.id], side: u.side }); L(`${uName(u)} <span class="sk">${s.n}</span>，<span style="color:${STATUS[s.buff.k].c}">${STATUS[s.buff.k].n}</span>`); return; }
  if (s.shieldAll) { const v = Math.round(u.atk * s.shieldAll * (u.pet ? (u.trait === 'ertuzi' ? 0.75 : 0.55) : 1)); fxe(B, { k: 'act', a: u.id, fx: 'shield', tg: alive(B, u.side).map(t => t.id), side: u.side, n: s.n, who: mobWho(u) }); for (const t of alive(B, u.side)) { addSt(t, { k: 'shield', t: 3, v }); fxe(B, { k: 'shield', t: t.id, v }); } L(`${uName(u)} <span class="sk">${s.n}</span>，全队获得 <span class="heal">${v}</span> 点护盾`); B.fx = 'heal'; return; }
  if (s.healAlly) { const t = alive(B, u.side).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0]; const v = Math.round(t.hpMax * s.healAlly * (u.pet ? (u.trait === 'ertuzi' ? 0.75 : 0.55) : 1)); t.hp = Math.min(t.hpMax, t.hp + v); fxe(B, { k: 'act', a: u.id, fx: 'heal', tg: [t.id], side: u.side, n: s.n, who: mobWho(u) }); fxe(B, { k: 'heal', t: t.id, v, hp: hpr(t) }); L(`${uName(u)} <span class="sk">${s.n}</span>，${uName(t)} <span class="heal">+${v}</span>`); B.fx = 'heal'; return; }
  const tg = s.aoe ? foes : [(pa && pa.tgt && foes.find(f => f.id === pa.tgt)) || (u.pet && s.cat === 'debuff' && (foes.find(f => f.boss) || foes.slice().sort((a, b) => b.hp - a.hp)[0])) || pickFoe(B, u)]; const parts = []; fxe(B, { k: 'act', a: u.id, fx: mobFx(s), tg: tg.map(t => t.id), side: u.side, big: !!s.charge, n: s.n, who: mobWho(u) });
  for (const t of tg) { if (!t.alive) continue; const opp = u.pet && (stOf(t, 'stun') || stOf(t, 'freeze')); const r = hitCalc(u, t, (s.dmg || 1) * (opp ? 1.3 : 1) * (u.trait === 'dahong' && s.aoe ? 1.15 : 1), s.mag, { el: s.el, sure: u.trait === 'dashen' }); if (r.miss) { banterMiss(B, u, t); fxe(B, { k: 'miss', t: t.id }); parts.push(`${uName(t)} <span class="miss">躲开了</span>`); continue; }
    const died = applyDmg(B, u, t, r.dmg, { crit: r.crit, weak: r.weak }); if (u.trait === 'maoqiu') u.hp = Math.min(u.hpMax, u.hp + Math.round(r.dmg * 0.15)); if (s.leech) u.hp = Math.min(u.hpMax, u.hp + r.dmg * s.leech); if (r.weak && u.side === 0) noteWeak(t, s.el);
    parts.push(`${uName(t)} <span class="${r.crit ? 'crit' : 'dmg'}">-${r.dmg}${r.crit ? ' 暴击!' : ''}</span>${r.weak ? ' <span class="weak">正中要害</span>' : ''}${opp ? ' <span class="weak">趁它动不了</span>' : ''}${died ? ' <b class="die">倒下</b>' : ''}`);
    let stunned = false; if (t.alive && s.st && Math.random() < (s.st.p ?? 1) * (u.pet && t.boss && s.st.k === 'stun' ? 0.5 : 1) + (u.trait === 'dahong' && s.st.k === 'burn' ? 0.2 : 0)) { addSt(t, { k: s.st.k, t: s.st.t, v: s.st.v ? Math.round(u.atk * s.st.v) : 0 }); if (s.st.k === 'stun') stunned = true; parts.push(`<span class="st" style="color:${STATUS[s.st.k].c}">${STATUS[s.st.k].n}</span>`); }
    if (u.side === 0 && (stunned || r.weak || (u.trait === 'dashen' && chance(0.5))) && tryInterrupt(B, t)) parts.push('<span class="weak">打断了它的蓄力！</span>'); }
  L(`${uName(u)} <span class="sk">${s.n}</span>：${parts.join('，')}`); B.fx = 'hit';
}
/* who acts when: by speed, but 石昊 and the partner act back to back (at the earlier of their two places), in the order you picked */
function turnOrder(B, jitter) {
  const L = B.units.filter(u => u.alive).map(u => ({ u, k: u.spd * (jitter ? rnd(0.85, 1.15) : 1) + (B.acts[u.id] && B.acts[u.id].swap ? 100 : 0) + (u.first && B.round === 1 ? 1000 : 0) + (u.trait === 'xiaobai' ? 500 : 0) })).sort((a, b) => b.k - a.k).map(x => x.u);
  const h = L.find(u => u.kind === 'pc'), p = L.find(u => u.pet && u.lead); if (!h || !p) return L;
  const i = Math.min(L.indexOf(h), L.indexOf(p)), rest = L.filter(u => u !== h && u !== p); rest.splice(i, 0, ...((C.duo || 'hero') === 'pet' ? [p, h] : [h, p])); return rest; }
function battleResolve(B) {
  if (B.over) return; const L = h => blog(B, h); B.fx = ''; B.ev = []; B.lc0 = B.lc;
  blog(B, `<span class="rd">— 第 ${B.round} 回合 —</span>`); mechRound(B, 'start'); partyRound(B, 'start');
  const order = turnOrder(B, true);
  for (const u of order) { if (!u.alive || B.over || !B.units.includes(u)) continue;
    if (stOf(u, 'stun') || stOf(u, 'freeze')) { L(`${uName(u)} <span class="st" style="color:${stOf(u, 'freeze') ? '#9ad8ff' : '#ffd34a'}">${stOf(u, 'freeze') ? '被冻住了' : '眩晕中'}</span>，动弹不得`); continue; }
    perform(B, u, u.kind === 'pc' ? B.acts[u.id] : null, L); flushSay(B); if (battleCheckEnd(B)) break; }
  if (!B.over) {
    for (const u of B.units) { if (!u.alive) continue;
      for (const k of ['bleed', 'burn', 'poison', 'dark']) { const s = stOf(u, k); if (s && s.v) { const d = Math.max(1, Math.round(s.v)); L(`${uName(u)} <span style="color:${STATUS[k].c}">${STATUS[k].n}</span> -${d}`); if (applyDmg(B, null, u, d, { dot: k })) L(`${uName(u)} <b class="die">倒下了</b>`); } }
      if (u.regen && u.alive) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * u.regen);
      for (const s of u.st) s.t--; u.st = u.st.filter(s => s.t > 0); for (const k in u.cd) if (u.cd[k] > 0) u.cd[k]--; if (u.mpMax) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * (u.mpRegen || BAL.mpRegen)); }
    mechRound(B, 'end'); partyRound(B, 'end'); flushSay(B); battleCheckEnd(B); if (!B.over) { B.round++; for (const u of B.units) if (u.alive && (u.kind === 'mob' || u.kind === 'npc')) planMob(B, u); }
  }
  B.acts = {}; B.seq++; if (B.roam) roamRound(B);
}
function flushSay(B) { const Q = B.sayQ || []; B.sayQ = []; for (const [u, k, x] of Q) { if (k === 'killq') banterKill(B, u, x); else if (chance(k === 'die' ? 0.8 : 1)) battleSay(B, u, k); } }
function battleCheckEnd(B) {
  if (B.over) return true;
  if (!alive(B, 1).length && mechWave(B)) return false;
  if (!alive(B, 1).length) { B.over = true; B.win = true; epicEnd(B); banterWin(B); blog(B, '<span class="bt win">★ 胜利 ★</span>'); return true; }
  if (!B.units.find(u => u.kind === 'pc').alive) { B.over = true; B.win = false; blog(B, '<span class="bt lose">✖ 你倒下了</span>'); return true; }
  return false;
}
function battleRewards(B) {
  const p = B.units.find(u => u.kind === 'pc'); let exp = 0, money = 0; const items = [];
  for (const [id, lv, boss] of B.kills) { const M = MOBS[id], E = BAL.enemy(lv); const diff = p.lv - lv; const mod = diff > 4 ? Math.max(0.1, 1 - (diff - 4) * 0.18) : diff < -3 ? 1.25 : 1;
    exp += E.exp * (boss ? 4 : 1) * mod * BAL.expMul(lv) * (B.story ? BAL.storyExp : 1) * diffOf().exp; money += (2 + lv * 0.8) * (boss ? 6 : 1) * (diff > 4 ? 0.3 : 1); for (const [it, pr] of M.loot || []) if (Math.random() < pr) items.push(it); }
  const bonus = mechBonus(B); if (bonus) { exp *= 1 + bonus * 0.15; money *= 1 + bonus * 0.15; if (bonus >= 3) items.push('baoyao'); }
  return { exp: Math.round(exp * lateExpMul()), items, money: Math.round(money * rnd(0.8, 1.2)), bonus };
}
