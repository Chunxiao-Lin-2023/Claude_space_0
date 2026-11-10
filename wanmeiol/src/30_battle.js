/* ================= turn-based party battle engine =================
   The battle object B is plain JSON so the host can send it to guests.  Only the authoritative side
   (solo player, or the co-op host) runs battleResolve(); everyone renders B and sends actions. */
const STATE = { mode: 'title', battle: null, scene: null, dungeon: null, party: [], busy: false, guestPreview: false };
let MYID = 'local';
const ALLY_NPC = { // story allies fight like monsters on our side; stats scale with the player
  a_hunter: { name: '石林虎', icon: '🏹', mul: { hp: 1.6, atk: 0.9, def: 1 }, sk: [{ n: '骨箭', dmg: 1, w: 3 }, { n: '连珠箭', dmg: 0.7, aoe: 1, w: 1 }] },
  a_bull: { name: '莽牛母兽', icon: '🐂', mul: { hp: 2.4, atk: 1, def: 1.3 }, sk: [{ n: '冲撞', dmg: 1.2, w: 3 }, { n: '践踏', dmg: 0.7, aoe: 1, w: 1 }] },
  a_eagle: { name: '青鳞鹰', icon: '🦅', mul: { hp: 2, atk: 1.2, def: 1, spd: 1.8 }, sk: [{ n: '铁爪', dmg: 1.1, w: 3 }, { n: '羽刃', dmg: 0.75, aoe: 1, w: 2 }] },
  a_kid: { name: '小不点', icon: '🧒', mul: { hp: 1.4, atk: 1.3, def: 0.9, spd: 1.4 }, sk: [{ n: '小拳头', dmg: 1.1, w: 3 }, { n: '狻猊宝术（不太熟练）', dmg: 1.6, w: 1 }] },
};
let BID = 1;
function mobUnit(id, lv, side = 1) {
  const M = MOBS[id] || ALLY_NPC[id]; lv = lv || M.lv || 1; const E = BAL.enemy(lv), m = M.mul || {};
  return { id: 'u' + (BID++), side, kind: side ? 'mob' : 'npc', mob: id, name: M.name, icon: M.icon || (M.boss ? '👹' : '🐾'), lv, boss: !!M.boss,
    hpMax: Math.round(E.hp * (m.hp || 1)), atk: Math.round(E.atk * (m.atk || 1)), def: Math.round(E.def * (m.def || 1)), spd: E.spd * (m.spd || 1), crit: M.boss ? 0.08 : 0.05, leech: 0, mpMax: 0, mp: 0, sk: [], cd: {}, st: [], alive: true, plan: null, intent: '' };
}
function pcUnit(c, pid, stats) { // a human player (my own character, or a co-op partner from their published stats)
  const s = stats || charStats(c);
  return { id: 'u' + (BID++), side: 0, kind: 'pc', pid, name: c.name, cls: c.cls, icon: CLASSES[c.cls].icon, lv: c.lv, hpMax: s.hpMax, hp: Math.max(1, Math.round(c.hp)), mpMax: s.mpMax, mp: Math.round(c.mp), atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, leech: s.leech, sk: c.skills || skillsOf(c), cd: {}, st: [], alive: true };
}
function botUnit(b, side = 0) { // a simulated player (party member, or an opponent in 虚神界)
  const K = CLASSES[b.cls], L = b.lv - 1, g = b.gear || 1;
  const sk = ['atk', ...K.skills.filter(id => SKILLS[id].lv <= b.lv)];
  const hp = Math.round((K.base.hp + K.grow.hp * L) * g * 1.15), u = { id: 'u' + (BID++), side, kind: 'bot', bot: b.id, name: b.name, cls: b.cls, icon: K.icon, lv: b.lv, hpMax: hp, hp, mpMax: Math.round(K.base.mp + K.grow.mp * L), atk: Math.round((K.base.atk + K.grow.atk * L) * g * 1.1), def: Math.round((K.base.def + K.grow.def * L) * g), spd: K.base.spd + K.grow.spd * L, crit: K.base.crit + 0.03, leech: 0, sk, cd: {}, st: [], alive: true };
  u.mp = u.mpMax; return u;
}
/* spec: { mobs:[[id,lv]...], allies:[[npcId]...], bots:[bot...], tag, title, flee, world, scale } */
function battleCreate(spec, humans) {
  const B = { id: 'b' + now().toString(36) + (BID++), tag: spec.tag || '', title: spec.title || '', round: 1, units: [], log: [], over: false, win: null, flee: spec.flee !== false, world: spec.world || null,
    acts: {}, deadline: 0, kills: [], loc: spec.loc || (C && C.loc), owner: spec.owner || MYID, dungeon: spec.dungeon || null, room: spec.room ?? null, noLose: !!spec.noLose, arena: spec.arena || null, seq: 0 };
  for (const h of humans) B.units.push(pcUnit(h.c, h.pid, h.stats));
  for (const b of spec.bots || []) B.units.push(botUnit(b, 0));
  const plv = Math.max(...humans.map(h => h.c.lv));
  for (const [id] of spec.allies || []) { const u = mobUnit(id, plv, 0); u.hp = u.hpMax; B.units.push(u); }
  for (const b of spec.foes || []) { const u = botUnit(b, 1); u.hpMax = Math.round(u.hpMax * 1.3); u.hp = u.hpMax; B.units.push(u); } // 虚神界 opponents
  for (const [id, lv] of spec.mobs || []) { const u = mobUnit(id, lv, 1); if (spec.world) { u.hpMax = spec.world.hpMax; } u.hp = spec.world ? spec.world.hp : u.hpMax; if (u.boss && humans.length > 1 && !spec.world) u.hpMax = u.hp = Math.round(u.hpMax * (1 + 0.55 * (humans.length - 1))); B.units.push(u); }
  for (const u of B.units) if (u.side === 1 && u.kind === 'mob') planMob(B, u);
  blog(B, `<span class="bt">⚔ ${spec.title || '战斗开始'}</span>`);
  return B;
}
const alive = (B, side) => B.units.filter(u => u.alive && (side === undefined || u.side === side));
const stOf = (u, k) => u.st.find(s => s.k === k);
const stV = (u, k) => { let v = 0; for (const s of u.st) if (s.k === k) v += s.v || 0; return v; };
function addSt(u, s) { const ex = u.st.find(x => x.k === s.k); if (ex) { ex.t = Math.max(ex.t, s.t); ex.v = Math.max(ex.v || 0, s.v || 0); if (s.k === 'shield') ex.v = (ex.v || 0) + (s.v || 0); } else u.st.push({ k: s.k, t: s.t, v: s.v || 0 }); }
function blog(B, html) { B.log.push(html); if (B.log.length > 120) B.log.splice(0, B.log.length - 120); }
const uName = u => `<span class="${u.side ? 'foe' : u.kind === 'pc' ? 'pc' : 'ally'}">${esc(u.name)}</span>`;
const humansIn = B => B.units.filter(u => u.kind === 'pc');
const needInput = B => B.units.filter(u => u.kind === 'pc' && u.alive && !B.acts[u.id] && !stOf(u, 'stun'));

/* ---------- AI ---------- */
function planMob(B, u) {
  const M = MOBS[u.mob] || ALLY_NPC[u.mob]; if (!M) return;
  if (u.charging != null) { const s = M.sk[u.charging]; u.plan = u.charging; u.charging = null; u.intent = '⚠ ' + s.n; return; }
  let cands = M.sk.map((s, i) => ({ s, i, w: s.w || 1 })).filter(x => !(x.s.summon && alive(B, u.side).filter(v => v.mob === x.s.summon).length >= (x.s.max || 2)) && !(x.s.healAlly && !alive(B, u.side).some(v => v.hp < v.hpMax * 0.7)));
  const c = wpick(cands); if (c.s.charge) { u.charging = c.i; u.plan = 'charge'; u.intent = '⏳ 蓄力：' + c.s.n; } else { u.plan = c.i; u.intent = c.s.aoe ? '◎ ' + c.s.n : c.s.buff || c.s.healAlly || c.s.summon ? '✦ ' + c.s.n : '→ ' + c.s.n; }
}
function pickFoe(B, u) { const foes = alive(B, 1 - u.side); if (!foes.length) return null; const t = foes.filter(f => stOf(f, 'taunt')); if (t.length) return pick(t); return wpick(foes, f => (f.kind === 'pc' ? 1.3 : 1) / (0.6 + f.def / (f.atk + 1))); }
function botAct(B, u) { // simple class-aware AI for bots, story allies controlled as party, and auto-battle
  const allies = alive(B, u.side), foes = alive(B, 1 - u.side); if (!foes.length) return { sk: 'atk' };
  const can = id => u.sk.includes(id) && !(u.cd[id] > 0) && u.mp >= SKILLS[id].mp;
  const weak = allies.filter(a => a.hp < a.hpMax * 0.5).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax);
  const boss = foes.find(f => f.boss), main = boss || foes.slice().sort((a, b) => a.hp - b.hp)[0];
  if (u.cls === 'liushen') { if (weak.length && can('ls_heal')) return { sk: 'ls_heal', tgt: weak[0].id }; if (allies.filter(a => a.hp < a.hpMax * 0.8).length >= 2 && can('ls_ward')) return { sk: 'ls_ward' }; if (foes.length >= 2 && can('ls_rune')) return { sk: 'ls_rune' }; }
  if (u.cls === 'mangniu') { if (u.hp < u.hpMax * 0.65 && !stOf(u, 'def') && can('mn_gold')) return { sk: 'mn_gold' }; if (foes.length >= 2 && can('mn_roar')) return { sk: 'mn_roar' }; if (can('mn_rage')) return { sk: 'mn_rage', tgt: main.id }; if (can('mn_charge')) return { sk: 'mn_charge', tgt: (foes.find(f => f.plan === 'charge') || main).id }; }
  if (u.cls === 'kunpeng') { if (foes.length >= 3 && can('kp_storm')) return { sk: 'kp_storm' }; if (boss && can('kp_swift') && !stOf(u, 'sure')) return { sk: 'kp_swift' }; if (boss && can('kp_rend') && !stOf(boss, 'bleed')) return { sk: 'kp_rend', tgt: boss.id }; if (can('kp_storm') && foes.length >= 2) return { sk: 'kp_storm' }; if (can('kp_wing')) return { sk: 'kp_wing', tgt: main.id }; }
  if (can('sk_thunder') && foes.length >= 2) return { sk: 'sk_thunder' }; if (can('sk_suanni') && boss) return { sk: 'sk_suanni', tgt: boss.id };
  if (u.cls === 'liushen' && can('ls_whip')) return { sk: 'ls_whip', tgt: main.id };
  if (u.mp < u.mpMax * 0.15) return { sk: 'guard' };
  return { sk: 'atk', tgt: main.id };
}

/* ---------- damage ---------- */
function hitCalc(a, d, mul, mag, opts = {}) {
  const dodge = 0.03 + Math.max(0, d.spd - a.spd) * 0.008 + stV(d, 'dodge');
  if (!opts.sure && Math.random() < Math.min(0.6, dodge)) return { miss: true, dmg: 0 };
  const atk = a.atk * (1 + stV(a, 'atk')) * (1 - stV(a, 'weak')); let def = d.def * (1 + stV(d, 'def')); if (mag) def *= 0.5;
  const K = BAL.defK + a.lv * 7; let dmg = atk * mul * K / (K + def) * rnd(0.9, 1.1);
  const crit = !!stOf(a, 'sure') || Math.random() < a.crit; if (crit) dmg *= BAL.critMul; if (stOf(d, 'guard')) dmg *= 0.5;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}
function applyDmg(B, a, d, dmg, L, tag = '') {
  const sh = stOf(d, 'shield'); let absorbed = 0; if (sh) { absorbed = Math.min(sh.v, dmg); sh.v -= absorbed; dmg -= absorbed; if (sh.v <= 0) d.st.splice(d.st.indexOf(sh), 1); }
  if (a && B.world && d.side === 1 && dmg > 0) { B.dmgBy = B.dmgBy || {}; B.dmgBy[a.name] = (B.dmgBy[a.name] || 0) + Math.min(dmg, d.hp); }
  d.hp -= dmg; if (a && a.leech && dmg > 0) a.hp = Math.min(a.hpMax, a.hp + dmg * a.leech);
  const absTxt = absorbed ? `<span class="dim">（护盾吸收 ${absorbed}）</span>` : '';
  if (d.hp <= 0) { d.hp = 0; d.alive = false; d.st = []; L(`${tag}${absTxt}　${uName(d)} <b class="die">倒下了</b>`); if (d.side === 1 && d.kind === 'mob') B.kills.push([d.mob, d.lv, d.boss]); return true; }
  if (absTxt) L(absTxt); return false;
}
/* ---------- one action ---------- */
function perform(B, u, act, L) {
  if (!act) act = u.kind === 'mob' || u.kind === 'npc' ? null : botAct(B, u);
  if (u.kind === 'mob' || u.kind === 'npc') return mobAct(B, u, L);
  if (act.flee) { const bossHere = alive(B, 1).some(f => f.boss); if (!B.flee || bossHere) { L(`${uName(u)} 想逃跑，却被死死缠住了！`); return; } if (Math.random() < BAL.flee) { L(`${uName(u)} <b>成功逃离了战斗</b>`); B.over = true; B.win = null; B.fled = true; return; } L(`${uName(u)} 逃跑失败！`); return; }
  if (act.item) { const it = ITEMS[act.item]; if (it) { if (it.heal) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * it.heal); if (it.mpHeal) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * it.mpHeal); L(`${uName(u)} 使用了 ${it.icon}${it.name}`); B.fx = 'heal'; } return; }
  let id = act.sk || 'atk', S = SKILLS[id]; if (!S || !u.sk.includes(id) || u.cd[id] > 0 || u.mp < S.mp) { id = 'atk'; S = SKILLS.atk; }
  u.mp -= S.mp; if (S.cd) u.cd[id] = S.cd + 1; const foes = alive(B, 1 - u.side), allies = alive(B, u.side);
  const pickT = (list, tid) => list.find(x => x.id === tid) || null;
  let tg = [];
  if (S.tgt === 'enemy') { const t = pickT(foes, act.tgt) || foes.slice().sort((a, b) => a.hp - b.hp)[0]; if (t) tg = [t]; }
  else if (S.tgt === 'enemies') tg = foes; else if (S.tgt === 'ally') { const t = pickT(allies, act.tgt) || allies.slice().sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0]; tg = [t]; }
  else if (S.tgt === 'allies') tg = allies; else tg = [u];
  const head = id === 'atk' ? `${uName(u)} 出手` : id === 'guard' ? `${uName(u)} 摆出防御姿态` : `${uName(u)} 施展 <span class="sk">${S.icon}${S.name}</span>`;
  if (S.dmg) {
    const parts = []; let low = 1; if (S.lowHpBonus) low = 1 + S.lowHpBonus * (1 - u.hp / u.hpMax);
    for (const t of tg) { if (!t.alive) continue; const hits = S.hits || 1; let tot = 0, crit = false, miss = 0; let died = false;
      for (let h = 0; h < hits && t.alive; h++) { const r = hitCalc(u, t, S.dmg / hits * low, S.mag, { sure: !!stOf(u, 'sure') }); if (r.miss) { miss++; continue; } tot += r.dmg; crit = crit || r.crit; died = applyDmg(B, u, t, r.dmg, () => { }, ''); if (!t.alive) died = true; }
      if (miss === hits) parts.push(`${uName(t)} <span class="miss">闪避</span>`);
      else { parts.push(`${uName(t)} <span class="${crit ? 'crit' : 'dmg'}">-${tot}${crit ? ' 暴击!' : ''}</span>${died ? ' <b class="die">倒下</b>' : ''}`); B.fx = crit ? 'crit' : 'hit';
        if (t.alive && S.st) for (const s of S.st) if (Math.random() < (s.p ?? 1) && !(s.k === 'stun' && t.boss && Math.random() < 0.5)) { addSt(t, { k: s.k, t: s.t, v: s.v ? Math.round(u.atk * s.v) : 0 }); parts.push(`<span class="st" style="color:${STATUS[s.k].c}">${STATUS[s.k].n}</span>`); } }
    }
    L(head + '：' + parts.join('，'));
  } else if (S.heal) { const t = tg[0]; const v = Math.round(u.atk * S.heal + t.hpMax * (S.healPct || 0)); t.hp = Math.min(t.hpMax, t.hp + v); L(`${head}，${uName(t)} <span class="heal">+${v}</span>`); B.fx = 'heal'; }
  else if (S.shield) { const v = Math.round(u.atk * S.shield); for (const t of tg) addSt(t, { k: 'shield', t: 3, v }); L(`${head}，全队获得 <span class="heal">${v}</span> 点护盾`); B.fx = 'heal'; }
  else L(head);
  if (S.self) for (const s of S.self) addSt(u, s);
  if (S.allyBuff) { for (const t of allies) for (const s of S.allyBuff) addSt(t, s); L(`<span class="dim">　全队攻击提升</span>`); }
  if (S.mpBack) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * S.mpBack);
  if (stOf(u, 'sure') && S.dmg) u.st = u.st.filter(s => s.k !== 'sure');
}
function mobAct(B, u, L) {
  const M = MOBS[u.mob] || ALLY_NPC[u.mob]; if (u.plan === 'charge') { L(`${uName(u)} 正在<span class="warn">蓄力</span>……`); return; }
  const s = M.sk[u.plan ?? 0] || M.sk[0]; const foes = alive(B, 1 - u.side); if (!foes.length) return;
  if (s.summon) { const n = mobUnit(s.summon, Math.max(1, u.lv - 2), u.side); n.hp = n.hpMax; planMob(B, n); B.units.push(n); L(`${uName(u)} <span class="sk">${s.n}</span>，${uName(n)} 加入了战斗！`); return; }
  if (s.buff) { addSt(u, s.buff); L(`${uName(u)} <span class="sk">${s.n}</span>，<span style="color:${STATUS[s.buff.k].c}">${STATUS[s.buff.k].n}</span>`); return; }
  if (s.healAlly) { const t = alive(B, u.side).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0]; const v = Math.round(t.hpMax * s.healAlly); t.hp = Math.min(t.hpMax, t.hp + v); L(`${uName(u)} <span class="sk">${s.n}</span>，${uName(t)} <span class="heal">+${v}</span>`); return; }
  const tg = s.aoe ? foes : [pickFoe(B, u)]; const parts = [];
  for (const t of tg) { const r = hitCalc(u, t, s.dmg || 1, s.mag); if (r.miss) { parts.push(`${uName(t)} <span class="miss">闪避</span>`); continue; }
    const died = applyDmg(B, u, t, r.dmg, () => { }); if (s.leech) u.hp = Math.min(u.hpMax, u.hp + r.dmg * s.leech);
    parts.push(`${uName(t)} <span class="${r.crit ? 'crit' : 'dmg'}">-${r.dmg}${r.crit ? ' 暴击!' : ''}</span>${died ? ' <b class="die">倒下</b>' : ''}`);
    if (t.alive && s.st && Math.random() < (s.st.p ?? 1)) { addSt(t, { k: s.st.k, t: s.st.t, v: s.st.v ? Math.round(u.atk * s.st.v) : 0 }); parts.push(`<span class="st" style="color:${STATUS[s.st.k].c}">${STATUS[s.st.k].n}</span>`); } }
  L(`${uName(u)} <span class="sk">${s.n}</span>：${parts.join('，')}`); B.fx = 'hit';
}
/* ---------- one full round (auth only) ---------- */
function battleResolve(B) {
  if (B.over) return; const L = h => blog(B, h); B.fx = '';
  blog(B, `<span class="rd">— 第 ${B.round} 回合 —</span>`);
  // bots, allies and auto-battle humans pick now
  const order = B.units.filter(u => u.alive).map(u => ({ u, k: u.spd * rnd(0.85, 1.15) + (B.acts[u.id] && B.acts[u.id].item ? 100 : 0) })).sort((a, b) => b.k - a.k).map(x => x.u);
  for (const u of order) { if (!u.alive || B.over) continue;
    if (stOf(u, 'stun')) { L(`${uName(u)} <span class="st" style="color:#ffd34a">眩晕中</span>，无法行动`); continue; }
    perform(B, u, u.kind === 'pc' ? B.acts[u.id] || botAct(B, u) : u.kind === 'bot' ? botAct(B, u) : null, L);
    if (battleCheckEnd(B)) break; }
  if (!B.over) { // end of round
    for (const u of B.units) { if (!u.alive) continue;
      for (const k of ['bleed', 'burn', 'poison']) { const s = stOf(u, k); if (s && s.v) { const d = Math.max(1, Math.round(s.v)); L(`${uName(u)} <span style="color:${STATUS[k].c}">${STATUS[k].n}</span> -${d}`); applyDmg(B, null, u, d, L); } }
      for (const s of u.st) if (s.k !== 'shield' || true) s.t--; u.st = u.st.filter(s => s.t > 0);
      for (const k in u.cd) if (u.cd[k] > 0) u.cd[k]--; if (u.mpMax) u.mp = Math.min(u.mpMax, u.mp + u.mpMax * BAL.mpRegen); }
    battleCheckEnd(B);
    if (!B.over) { B.round++; for (const u of B.units) if (u.alive && u.kind !== 'pc' && u.kind !== 'bot' && (u.kind === 'mob' || u.kind === 'npc')) planMob(B, u); }
  }
  B.acts = {}; B.seq++; B.deadline = humansIn(B).length > 1 ? now() + 30000 : 0;
  if (B.world && typeof worldBossRound === 'function') worldBossRound(B);
}
function battleCheckEnd(B) {
  if (B.over) return true;
  if (!alive(B, 1).length) { B.over = true; B.win = true; blog(B, '<span class="bt win">★ 战斗胜利 ★</span>'); return true; }
  if (!alive(B, 0).filter(u => u.kind === 'pc').length) { B.over = true; B.win = false; blog(B, '<span class="bt lose">✖ 战斗失败</span>'); return true; }
  return false;
}
/* ---------- rewards (auth computes, each client applies its own) ---------- */
function battleRewards(B) {
  const pcs = B.units.filter(u => u.kind === 'pc'), n = B.units.filter(u => u.kind === 'pc' || u.kind === 'bot').length, out = {};
  for (const p of pcs) {
    let exp = 0, gold = 0; const items = [], eqs = [];
    for (const [id, lv, boss] of B.kills) { const M = MOBS[id], E = BAL.enemy(lv); const diff = p.lv - lv; const mod = diff > 4 ? Math.max(0.1, 1 - (diff - 4) * 0.18) : diff < -3 ? 1.25 : 1;
      exp += E.exp * (boss ? 4 : 1) * mod; gold += E.gold * (boss ? 5 : 1) * (M.gold || 1) * rnd(0.7, 1.3);
      for (const [it, pr] of M.loot || []) if (Math.random() < pr) items.push(it);
      const eqc = M.equip || [0.045]; for (const pr of eqc) if (Math.random() < pr) eqs.push(rollEquip(lv, boss ? 0.6 : 0, boss ? 1 : 0)); }
    const share = (1 + 0.2 * (n - 1)) / n; out[p.pid] = { exp: Math.round(exp * share), gold: Math.round(gold * share), items, eqs, hp: p.hp, mp: p.mp, alive: p.alive };
  }
  return out;
}
