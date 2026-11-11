/* ================= turn-based battle =================
   石昊 (you), the active pet and story allies on one side; beasts, or a 虚神界 rival, on the other.
   Enemy intentions are shown a round ahead (“蓄力” = a big hit is coming). */
const STATE = { mode: 'title', battle: null, scene: null, dungeon: null, busy: false };
const ALLY_NPC = {
  a_linhu: { name: '石林虎', icon: '🏹', mul: { hp: 1.5, atk: 0.9, def: 1 }, sk: [{ n: '骨箭', dmg: 1, w: 3 }, { n: '连珠箭', dmg: 0.7, aoe: 1, w: 1 }] },
  a_kids: { name: '大壮和二猛', icon: '👦', mul: { hp: 1.3, atk: 0.6, def: 0.8 }, sk: [{ n: '扔石头', dmg: 0.9, w: 3 }, { n: '一起扑上去', dmg: 0.5, aoe: 1, w: 1 }] },
  a_chief: { name: '石云峰', icon: '👴', mul: { hp: 2.2, atk: 1.2, def: 1.4 }, sk: [{ n: '族长一掌', dmg: 1.1, w: 3 }, { n: '骨文护体', healAlly: 0.2, w: 1 }] },
  a_huo: { name: '火灵儿', icon: '👘', mul: { hp: 1.4, atk: 1.15, def: 1, spd: 1.2 }, sk: [{ n: '火凤翎', dmg: 1.05, el: 'fire', w: 3 }, { n: '焚天火海', dmg: 0.75, aoe: 1, el: 'fire', st: { k: 'burn', t: 2, v: 0.3, p: 0.6 }, w: 1 }] },
  a_eagle: { name: '青鳞小鹰', icon: '🦅', mul: { hp: 1.1, atk: 1.1, def: 0.9, spd: 1.6 }, sk: [{ n: '鳞爪', dmg: 1.05, w: 3 }, { n: '鳞羽', dmg: 0.6, aoe: 1, w: 1 }] },
  a_yunxi: { name: '云曦', icon: '🌙', mul: { hp: 1.3, atk: 1, def: 1 }, sk: [{ n: '月华', dmg: 1, mag: 1, w: 3 }, { n: '清辉', healAlly: 0.18, w: 1 }] },
};
const unitDef = id => MOBS[id] || ALLY_NPC[id] || PETS[id];
let BID = 1;
function mobUnit(id, lv, side = 1) {
  const M = unitDef(id); lv = lv || M.lv || 1; const E = BAL.enemy(lv), m = M.mul || {};
  return { id: 'u' + (BID++), side, kind: side ? 'mob' : 'npc', mob: id, name: M.name, icon: M.icon || (M.boss ? '👹' : '🐾'), lv, boss: !!M.boss,
    hpMax: Math.round(E.hp * (m.hp || 1)), atk: Math.round(E.atk * (m.atk || 1)), def: Math.round(E.def * (m.def || 1)), spd: E.spd * (m.spd || 1), crit: M.boss ? 0.08 : 0.05, leech: 0, mpMax: 0, mp: 0, sk: [], cd: {}, st: [], alive: true, plan: null, intent: '' };
}
function heroUnit() { const s = charStats(); return { id: 'hero', side: 0, kind: 'pc', name: '石昊', icon: '🧒', lv: C.lv, hpMax: s.hpMax, hp: Math.max(1, Math.round(C.hp)), mpMax: s.mpMax, mp: Math.round(C.mp), atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, leech: 0, regen: s.regen || 0, sk: skillsOf(), cd: {}, st: [], alive: true, prof: Object.fromEntries(C.sk.map(id => [id, PROF[profLevel(id)].b])) }; }
function petUnit(id) { // the pet scales with 石昊; affection gives up to +15%
  const s = charStats(), P = PETS[id], aff = C.pets[id].aff, k = 1 + aff / 100 * 0.15, m = P.mul;
  return { id: 'pet', side: 0, kind: 'npc', mob: id, pet: 1, name: P.name, icon: P.icon, lv: C.lv, hpMax: Math.round(s.hpMax * m.hp * k), atk: Math.round(s.atk * m.atk * k), def: Math.round(s.def * m.def * k), spd: s.spd * m.spd, crit: 0.08, leech: 0, mpMax: 0, mp: 0, sk: [], cd: {}, st: [], alive: true, plan: null, intent: '', aff, hp: 0 };
}
function rivalUnit(r) { // 虚神界 rivals fight with 宝术 like you do
  const L = r.lv - 1, g = r.gear || 1; const u = { id: 'u' + (BID++), side: 1, kind: 'rival', name: r.name, icon: r.icon || '🧑', lv: r.lv, boss: !!r.boss, hpMax: Math.round((HERO.base.hp + HERO.grow.hp * L) * g * 1.25), atk: Math.round((HERO.base.atk + HERO.grow.atk * L) * g), def: Math.round((HERO.base.def + HERO.grow.def * L) * g), spd: HERO.base.spd + HERO.grow.spd * L, crit: 0.12, leech: 0,
    mpMax: Math.round(HERO.base.mp + HERO.grow.mp * L), sk: ['atk', ...(r.sk || ['qly', 'sn'])], cd: {}, st: [], alive: true };
  u.hp = u.hpMax; u.mp = u.mpMax; return u;
}
/* spec: { mobs:[[id,lv]], allies:[id], rivals:[{name,lv,gear,sk}], tag, title, flee, noLose, roam } */
function battleCreate(spec) {
  const B = { id: 'b' + (BID++), story: !!spec.story, tag: spec.tag || '', title: spec.title || '', round: 1, units: [], log: [], over: false, win: null, flee: spec.flee !== false, acts: {}, kills: [], dungeon: spec.dungeon || null, room: spec.room ?? null, noLose: !!spec.noLose, arena: spec.arena || null, roam: spec.roam || null, seq: 0 };
  B.units.push(heroUnit());
  if (C.pet && C.pets[C.pet] && !spec.noPet) { const p = petUnit(C.pet); p.hp = p.hpMax; B.units.push(p); }
  for (const id of spec.allies || []) { const u = mobUnit(id, C.lv, 0); u.hp = u.hpMax; B.units.push(u); }
  for (const r of spec.rivals || []) B.units.push(rivalUnit(r));
  for (const [id, lv] of spec.mobs || []) { const u = mobUnit(id, lv, 1); u.hp = u.hpMax; if (spec.roam) { u.hpMax = spec.roam.hpMax; u.hp = spec.roam.hp; } B.units.push(u); }
  for (const u of B.units) if (u.kind === 'mob' || u.kind === 'npc') planMob(B, u);
  for (const [id] of spec.mobs || []) if (!MOBS[id].nocodex) { C.codex = C.codex || {}; C.codex[id] = C.codex[id] || { wk: [] }; }
  blog(B, `<span class="bt">⚔ ${spec.title || '战斗开始'}</span>`);
  return B;
}
const alive = (B, side) => B.units.filter(u => u.alive && (side === undefined || u.side === side));
const stOf = (u, k) => u.st.find(s => s.k === k);
const stV = (u, k) => { let v = 0; for (const s of u.st) if (s.k === k) v += s.v || 0; return v; };
function addSt(u, s) { const ex = u.st.find(x => x.k === s.k); if (ex) { ex.t = Math.max(ex.t, s.t); if (s.k === 'shield') ex.v = (ex.v || 0) + (s.v || 0); else ex.v = Math.max(ex.v || 0, s.v || 0); } else u.st.push({ k: s.k, t: s.t, v: s.v || 0 }); }
function blog(B, html) { B.log.push(html); if (B.log.length > 150) B.log.splice(0, B.log.length - 150); }
const uName = u => `<span class="${u.side ? 'foe' : u.kind === 'pc' ? 'pc' : 'ally'}">${esc(u.name)}</span>`;
const needInput = B => B.units.filter(u => u.kind === 'pc' && u.alive && !B.acts[u.id] && !stOf(u, 'stun') && !stOf(u, 'freeze'));

/* ---------- AI ---------- */
function planMob(B, u) {
  const M = unitDef(u.mob); if (!M) return;
  if (u.charging != null) { const s = M.sk[u.charging]; u.plan = u.charging; u.charging = null; u.intent = '⚠ ' + s.n; return; }
  const cands = M.sk.map((s, i) => ({ s, i, w: s.w || 1 })).filter(x => !(x.s.aff && (u.aff || 0) < x.s.aff) && !(x.s.healAlly && !alive(B, u.side).some(v => v.hp < v.hpMax * 0.7)) && !(x.s.summon && alive(B, u.side).filter(v => v.mob === x.s.summon).length >= (x.s.max || 2)));
  const c = wpick(cands); if (c.s.charge) { u.charging = c.i; u.plan = 'charge'; u.intent = '⏳ 蓄力：' + c.s.n; } else { u.plan = c.i; u.intent = c.s.aoe ? '◎ ' + c.s.n : c.s.buff || c.s.healAlly ? '✦ ' + c.s.n : '→ ' + c.s.n; }
}
function pickFoe(B, u) { const foes = alive(B, 1 - u.side); if (!foes.length) return null; const t = foes.filter(f => stOf(f, 'taunt')); if (t.length) return pick(t); return wpick(foes, f => (f.kind === 'pc' ? 1.5 : 1)); }
function botAct(B, u) { // auto-battle for 石昊 and the AI for 虚神界 rivals
  const allies = alive(B, u.side), foes = alive(B, 1 - u.side); if (!foes.length) return { sk: 'atk' };
  const can = id => u.sk.includes(id) && !(u.cd[id] > 0) && u.mp >= SKILLS[id].mp; const boss = foes.find(f => f.boss), main = boss || foes.slice().sort((a, b) => a.hp - b.hp)[0];
  if (can('ta') && allies.filter(a => a.hp < a.hpMax * 0.6).length >= 1) return { sk: 'ta' };
  if (foes.length >= 2 && can('lei')) return { sk: 'lei' }; if (foes.length >= 3 && can('gw')) return { sk: 'gw' };
  for (const id of ['dsh', 'sn', 'jian', 'qly']) if (can(id)) return { sk: id, tgt: (id === 'sn' ? foes.find(f => f.plan === 'charge') || main : main).id };
  if (u.mp < u.mpMax * 0.15 && u.kind === 'pc') return { sk: 'guard' };
  return { sk: 'atk', tgt: main.id };
}
/* ---------- damage ---------- */
const weakOf = (d, el) => el && d.mob && MOBS[d.mob] && MOBS[d.mob].weak && MOBS[d.mob].weak[el] || 0;
function hitCalc(a, d, mul, mag, opts = {}) {
  const dodge = 0.03 + Math.max(0, d.spd - a.spd) * 0.008 + stV(d, 'dodge'); if (!opts.sure && Math.random() < Math.min(0.5, dodge)) return { miss: true, dmg: 0 };
  const atk = a.atk * (1 + stV(a, 'atk') + stV(a, 'rage')) * (1 - stV(a, 'weak')); const wk = weakOf(d, opts.el); if (wk) mul *= wk; let def = d.def * (1 + stV(d, 'def')); if (mag) def *= 0.5; if (opts.pierce) def = 0;
  const K = BAL.defK + a.lv * 7; let dmg = atk * mul * K / (K + def) * rnd(0.9, 1.1);
  const crit = !!stOf(a, 'sure') || Math.random() < a.crit; if (crit) dmg *= BAL.critMul; if (stOf(d, 'guard')) dmg *= 0.5;
  return { dmg: Math.max(1, Math.round(dmg)), crit, weak: !!wk };
}
function noteWeak(d, el) { if (!d.mob || !C.codex || !C.codex[d.mob]) return; const w = C.codex[d.mob].wk || (C.codex[d.mob].wk = []); if (!w.includes(el)) w.push(el); }
function applyDmg(B, a, d, dmg) {
  const sh = stOf(d, 'shield'); let absorbed = 0; if (sh) { absorbed = Math.min(sh.v, dmg); sh.v -= absorbed; dmg -= absorbed; if (sh.v <= 0) d.st.splice(d.st.indexOf(sh), 1); }
  if (B.roam && d.side === 1 && dmg > 0) B.roamDmg = (B.roamDmg || 0) + Math.min(dmg, d.hp);
  d.hp -= dmg; if (a && a.leech && dmg > 0) a.hp = Math.min(a.hpMax, a.hp + dmg * a.leech);
  if (d.hp <= 0) { d.hp = 0; d.alive = false; d.st = []; if (d.side === 1 && d.kind === 'mob') B.kills.push([d.mob, d.lv, d.boss]); return true; }
  if (d.boss && d.side === 1 && !d.raged && d.hp <= d.hpMax / 2 && d.mob && MOBS[d.mob]) { d.raged = true; addSt(d, { k: 'rage', t: 99, v: BAL.phaseAtk }); B.phase = 1;
    blog(B, `<span class="phase">${MOBS[d.mob].p2 || esc(d.name) + '被激怒了！'}（攻击提升）</span>`); }
  return false;
}
function perform(B, u, act, L) {
  if (u.kind === 'mob' || u.kind === 'npc') return mobAct(B, u, L);
  if (!act) act = botAct(B, u);
  if (act.flee) { if (!B.flee || alive(B, 1).some(f => f.boss)) { L(`${uName(u)} 想跑，可对方死死盯着你！`); return; } if (Math.random() < BAL.flee) { L(`${uName(u)} <b>撒腿就跑，逃掉了</b>`); B.over = true; B.win = null; B.fled = true; return; } L(`${uName(u)} 没跑掉！`); return; }
  if (act.item) { const it = ITEMS[act.item]; if (it) { if (it.heal) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * it.heal); if (it.mp) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * it.mp); L(`${uName(u)} 用了 ${it.icon}${it.name}`); B.fx = 'heal'; } return; }
  let id = act.sk || 'atk', S = SKILLS[id]; if (!S || !u.sk.includes(id) || u.cd[id] > 0 || u.mp < S.mp) { id = 'atk'; S = SKILLS.atk; }
  u.mp -= S.mp; if (S.cd) u.cd[id] = S.cd + 1; if (u.kind === 'pc' && id !== 'atk' && id !== 'guard' && NETROLE !== 'guest') profUse(id); const pb = 1 + ((u.prof && u.prof[id]) || 0); const foes = alive(B, 1 - u.side), allies = alive(B, u.side);
  let tg = []; if (S.tgt === 'enemy') { const t = foes.find(x => x.id === act.tgt) || foes.slice().sort((a, b) => a.hp - b.hp)[0]; if (t) tg = [t]; } else if (S.tgt === 'enemies') tg = foes; else if (S.tgt === 'allies') tg = allies; else tg = [u];
  const head = id === 'atk' ? `${uName(u)} 出手` : id === 'guard' ? `${uName(u)} 护住要害` : `${uName(u)} 施展 <span class="sk">${S.icon}${S.name}</span>`;
  if (S.dmg) { const parts = [];
    for (const t of tg) { if (!t.alive) continue; const hits = S.hits || 1; let tot = 0, crit = false, miss = 0, died = false;
      let weak = false; for (let h = 0; h < hits && t.alive; h++) { const r = hitCalc(u, t, S.dmg * pb / hits, S.mag, { sure: !!stOf(u, 'sure'), pierce: S.pierce, el: S.el }); if (r.miss) { miss++; continue; } tot += r.dmg; crit = crit || r.crit; weak = weak || r.weak; if (applyDmg(B, u, t, r.dmg)) died = true; }
      if (weak && u.side === 0) noteWeak(t, S.el);
      if (miss === hits) parts.push(`${uName(t)} <span class="miss">躲开了</span>`);
      else { parts.push(`${uName(t)} <span class="${crit ? 'crit' : 'dmg'}">-${tot}${crit ? ' 暴击!' : ''}</span>${weak ? ' <span class="weak">正中要害</span>' : ''}${died ? ' <b class="die">倒下</b>' : ''}`); B.fx = crit ? 'crit' : 'hit';
        if (t.alive && S.st) for (const s of S.st) if (Math.random() < (s.p ?? 1) && !(s.k === 'stun' && t.boss && Math.random() < 0.5)) { addSt(t, { k: s.k, t: s.t, v: s.v ? Math.round(u.atk * s.v) : 0 }); parts.push(`<span class="st" style="color:${STATUS[s.k].c}">${STATUS[s.k].n}</span>`); } } }
    L(head + '：' + parts.join('，'));
  } else if (S.shield) { const v = Math.round(u.atk * S.shield * pb); for (const t of tg) addSt(t, { k: 'shield', t: 3, v }); L(`${head}，全队获得 <span class="heal">${v}</span> 点护盾`); B.fx = 'heal'; }
  else L(head);
  if (S.self) for (const s of S.self) addSt(u, s); if (S.mpBack) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * S.mpBack);
  if (stOf(u, 'sure') && S.dmg) u.st = u.st.filter(s => s.k !== 'sure');
}
function mobAct(B, u, L) {
  const M = unitDef(u.mob); if (u.plan === 'charge') { L(`${uName(u)} 正在<span class="warn">蓄力</span>……`); return; }
  const s = M.sk[u.plan ?? 0] || M.sk[0]; const foes = alive(B, 1 - u.side); if (!foes.length) return;
  if (s.buff) { addSt(u, s.buff); L(`${uName(u)} <span class="sk">${s.n}</span>，<span style="color:${STATUS[s.buff.k].c}">${STATUS[s.buff.k].n}</span>`); return; }
  if (s.shieldAll) { const v = Math.round(u.atk * s.shieldAll); for (const t of alive(B, u.side)) addSt(t, { k: 'shield', t: 3, v }); L(`${uName(u)} <span class="sk">${s.n}</span>，全队获得 <span class="heal">${v}</span> 点护盾`); B.fx = 'heal'; return; }
  if (s.healAlly) { const t = alive(B, u.side).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0]; const v = Math.round(t.hpMax * s.healAlly); t.hp = Math.min(t.hpMax, t.hp + v); L(`${uName(u)} <span class="sk">${s.n}</span>，${uName(t)} <span class="heal">+${v}</span>`); B.fx = 'heal'; return; }
  const tg = s.aoe ? foes : [pickFoe(B, u)]; const parts = [];
  for (const t of tg) { if (!t.alive) continue; const r = hitCalc(u, t, s.dmg || 1, s.mag, { el: s.el }); if (r.miss) { parts.push(`${uName(t)} <span class="miss">躲开了</span>`); continue; }
    const died = applyDmg(B, u, t, r.dmg); if (s.leech) u.hp = Math.min(u.hpMax, u.hp + r.dmg * s.leech); if (r.weak && u.side === 0) noteWeak(t, s.el);
    parts.push(`${uName(t)} <span class="${r.crit ? 'crit' : 'dmg'}">-${r.dmg}${r.crit ? ' 暴击!' : ''}</span>${r.weak ? ' <span class="weak">正中要害</span>' : ''}${died ? ' <b class="die">倒下</b>' : ''}`);
    if (t.alive && s.st && Math.random() < (s.st.p ?? 1)) { addSt(t, { k: s.st.k, t: s.st.t, v: s.st.v ? Math.round(u.atk * s.st.v) : 0 }); parts.push(`<span class="st" style="color:${STATUS[s.st.k].c}">${STATUS[s.st.k].n}</span>`); } }
  L(`${uName(u)} <span class="sk">${s.n}</span>：${parts.join('，')}`); B.fx = 'hit';
}
function battleResolve(B) {
  if (B.over) return; const L = h => blog(B, h); B.fx = '';
  blog(B, `<span class="rd">— 第 ${B.round} 回合 —</span>`);
  const order = B.units.filter(u => u.alive).map(u => ({ u, k: u.spd * rnd(0.85, 1.15) + (B.acts[u.id] && B.acts[u.id].item ? 100 : 0) })).sort((a, b) => b.k - a.k).map(x => x.u);
  for (const u of order) { if (!u.alive || B.over) continue;
    if (stOf(u, 'stun') || stOf(u, 'freeze')) { L(`${uName(u)} <span class="st" style="color:${stOf(u, 'freeze') ? '#9ad8ff' : '#ffd34a'}">${stOf(u, 'freeze') ? '被冻住了' : '眩晕中'}</span>，动弹不得`); continue; }
    perform(B, u, u.kind === 'pc' ? B.acts[u.id] : null, L); if (battleCheckEnd(B)) break; }
  if (!B.over) {
    for (const u of B.units) { if (!u.alive) continue;
      for (const k of ['bleed', 'burn', 'poison']) { const s = stOf(u, k); if (s && s.v) { const d = Math.max(1, Math.round(s.v)); L(`${uName(u)} <span style="color:${STATUS[k].c}">${STATUS[k].n}</span> -${d}`); if (applyDmg(B, null, u, d)) L(`${uName(u)} <b class="die">倒下了</b>`); } }
      if (u.regen && u.alive) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * u.regen);
      for (const s of u.st) s.t--; u.st = u.st.filter(s => s.t > 0); for (const k in u.cd) if (u.cd[k] > 0) u.cd[k]--; if (u.mpMax) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * BAL.mpRegen); }
    battleCheckEnd(B); if (!B.over) { B.round++; for (const u of B.units) if (u.alive && (u.kind === 'mob' || u.kind === 'npc')) planMob(B, u); }
  }
  B.acts = {}; B.seq++; if (B.roam) roamRound(B);
}
function battleCheckEnd(B) {
  if (B.over) return true;
  if (!alive(B, 1).length) { B.over = true; B.win = true; blog(B, '<span class="bt win">★ 胜利 ★</span>'); return true; }
  if (!B.units.find(u => u.kind === 'pc').alive) { B.over = true; B.win = false; blog(B, '<span class="bt lose">✖ 你倒下了</span>'); return true; }
  return false;
}
function battleRewards(B) {
  const p = B.units.find(u => u.kind === 'pc'); let exp = 0; const items = [];
  for (const [id, lv, boss] of B.kills) { const M = MOBS[id], E = BAL.enemy(lv); const diff = p.lv - lv; const mod = diff > 4 ? Math.max(0.1, 1 - (diff - 4) * 0.18) : diff < -3 ? 1.25 : 1;
    exp += E.exp * (boss ? 4 : 1) * mod * BAL.expMul(lv) * (B.story ? BAL.storyExp : 1); for (const [it, pr] of M.loot || []) if (Math.random() < pr) items.push(it); }
  return { exp: Math.round(exp), items };
}
