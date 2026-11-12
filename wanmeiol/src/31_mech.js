/* ================= boss mechanics, hold-out fights, and the reward for fighting by hand =================
   Each great boss of the later volumes has one thing of its own (MOBS[id].mech), so the fights stop feeling alike:
     rewind   万古之劫   every 4th round it gathers 时光倒流; if not broken it winds its 气血 back one round
     dark     鲲帝       its blows leave 黑暗 that stacks and burns; 雷道 or 柳神法 wash it off you
     question 帝城守将   at half 气血 it asks "帝关还在吗？" — answer by choosing 防御 that round and it lays down its spear
     revive   尸骸仙帝   the first time it falls, the darkness flows back and it rises with 40% 气血
     summon   赤王/银坤  at half 气血 more come (异域仙兵 / 争霸台挑战者)
     mimic    帝冲       the same 宝术 twice in a row only does half (it has seen it through its 化身)
     qilin    宁川       at half 气血 the 麒麟 wraps it in a shield of 30% of its 气血
     devour   残仙       heals 2.5% each round — unless it is bleeding or burning
     tide     黑暗之帝   every 2nd round the tide takes 8% 气血 from everyone on your side who has no shield
     door     造化守灵   every 3rd round the door pulls: 石昊 is stunned unless he chose 防御
     fate     前世之敌   a tenth of what you deal comes back to you — a critical hit cuts through fate
     pride    仙王后裔   takes half damage while above 70% 气血
     swallow  黑暗至尊   its hits eat shields and heal it by what they ate
   Hold-out fights (spec.survive = rounds): the "you cannot win this" fights. Stand for N rounds and the story goes on with
   something extra; fall, and it goes on as before. spec.protect: an ally that must still be standing.
   By hand: breaking a gathering blow or hitting a weak spot in a story/boss fight raises the reward (not with 🤖 on). */
const MECH_ROUND = {
  rewind: (B, u, when) => { if (when !== 'end') return; (u.hist = u.hist || []).push(u.hp); },
  devour: (B, u, when) => { if (when !== 'end' || !u.alive) return; if (stOf(u, 'bleed') || stOf(u, 'burn')) { blog(B, `<span class="dim">${uName(u)} 伤口在流血，吃不下了</span>`); return; } const v = Math.round(u.hpMax * 0.025); u.hp = Math.min(u.hpMax, u.hp + v); fxe(B, { k: 'heal', t: u.id, v, hp: hpr(u) }); blog(B, `${uName(u)} 吸了一口九天的灵气 <span class="heal">+${v}</span>　<span class="dim">（流血或灼烧能让它吃不下）</span>`); },
  tide: (B, u, when) => { if (when !== 'end' || !u.alive || B.round % 2) return; const hit = []; for (const t of alive(B, 0)) { if (stOf(t, 'shield')) continue; const v = Math.round(t.hpMax * 0.08); applyDmg(B, u, t, Math.min(v, t.hp - 1), { dot: 'dark' }); hit.push(uName(t)); }
    blog(B, `<span class="warn">黑暗潮汐漫过来</span>${hit.length ? '：' + hit.join('、') + ' 气血 -8%' : '——护盾挡住了它'}　<span class="dim">（有护盾就不怕）</span>`); },
  door: (B, u, when) => { if (when !== 'end' || !u.alive || B.round % 3) return; const h = B.units.find(x => x.kind === 'pc' && x.alive); if (!h) return;
    if (B.lastHero && B.lastHero.sk === 'guard') { blog(B, `<span class="weak">门里伸出的手抓了个空——你护住了要害</span>`); return; } addSt(h, { k: 'stun', t: 1 }); blog(B, `<span class="warn">造化之门往里一拉，${uName(h)} 被拽得站不稳（眩晕）</span>　<span class="dim">（每 3 回合一次，那回合选「防御」就不会被拽）</span>`); },
};
const MECH_PLAN = { // runs after the normal plan for the next round
  rewind: (B, u) => { if (B.round % 4 || u.releasing) return; const M = unitDef(u.mob), i = M.sk.findIndex(s => s.mfn === 'rewind'); if (i < 0) return; u.charging = i; u.plan = 'charge'; u.intent = '⏳ 蓄力：时光倒流'; },
};
const MECH_FN = { // special moves (sk.mfn)
  rewind: (B, u, s, L) => { const h = u.hist || [], back = h.length >= 2 ? h[h.length - 2] : u.hp, v = Math.max(0, Math.round(back - u.hp)); u.hp = Math.min(u.hpMax, u.hp + v); fxe(B, { k: 'heal', t: u.id, v, hp: hpr(u) });
    L(`${uName(u)} <span class="sk">时光倒流</span>：上一回合的伤，全回去了 <span class="heal">+${v}</span>　<span class="dim">（打晕它或打中弱点能打断）</span>`); },
};
function mechInit(B, spec) {
  B.survive = spec.survive || 0; B.protect = spec.protect || null; B.baseTitle = B.title;
  for (const u of B.units) { const M = u.mob && MOBS[u.mob]; if (!M || u.side !== 1 || !M.mech) continue; u.mech = M.mech; if (M.mech === 'mimic') u.shiyi = 1; }
  if (B.survive) { B.title = `${B.baseTitle}（撑住 ${B.survive} 回合）`; blog(B, `<span class="warn">这一仗打不赢。撑住 ${B.survive} 回合${B.protect ? '，护住' + esc(unitDef(B.protect).name) : ''}。</span>`); } }
function mechRound(B, when) {
  for (const u of B.units) if (u.mech && u.alive && MECH_ROUND[u.mech]) MECH_ROUND[u.mech](B, u, when);
  if (when === 'end' && B.survive && !B.over) { const left = B.survive - B.round; const h = B.units.find(x => x.kind === 'pc');
    if (left <= 0 && h && h.alive) { B.over = true; B.win = false; B.survived = true; B.protectOk = !B.protect || !!B.units.find(x => x.mob === B.protect && x.alive); blog(B, `<span class="bt win">★ 撑住了 ★</span>${B.protect ? (B.protectOk ? ` <span class="weak">${esc(unitDef(B.protect).name)}也还站着</span>` : '') : ''}`); fxe(B, { k: 'finish', t: 'hero' }); }
    else if (left > 0) B.title = `${B.baseTitle}（还要撑 ${left} 回合）`; } }
function mechPlan(B, u) { if (u.mech && MECH_PLAN[u.mech]) MECH_PLAN[u.mech](B, u); }
function mechPhase(B, d) { const M = MOBS[d.mob]; if (!d.mech) return;
  if (d.mech === 'summon') { const add = M.summonId || 'yyxwb'; for (let i = 0; i < 2; i++) { const s = mobUnit(add, Math.max(1, d.lv - 3), 1); s.hp = Math.round(s.hpMax * 0.6); s.alive = true; partyFoe(B, s); planMob(B, s); B.units.push(s); } blog(B, `<span class="warn">又来了两个 ${esc(MOBS[add].name)}！</span>　<span class="dim">（一路赶来，带着伤）</span>`); fxe(B, { k: 'phase', t: d.id }); }
  if (d.mech === 'qilin') { const v = Math.round(d.hpMax * 0.3); addSt(d, { k: 'shield', t: 4, v }); fxe(B, { k: 'shield', t: d.id, v }); blog(B, `<span class="warn">麒麟的影子裹住了 ${uName(d)}（护盾 ${v}，4 回合）</span>`); }
  if (d.mech === 'question') { B.asked = B.round; blog(B, `<span class="cine">${uName(d)} 停下了枪：“……帝关，还在吗？”</span>　<span class="dim">（下回合选「防御」，就是你的回答）</span>`); fxe(B, { k: 'cine', cls: 'phase', who: d.name, text: '“……帝关，还在吗？”' }); } }
function mechDie(B, d) { // true = it does not fall
  if (d.mech === 'revive' && !d.revived) { d.revived = 1; d.hp = Math.round(d.hpMax * 0.4); fxe(B, { k: 'heal', t: d.id, v: d.hp, hp: hpr(d) }); blog(B, `<span class="warn">界海的黑暗倒流回来——${uName(d)} 又站了起来！</span>`); fxe(B, { k: 'cine', cls: 'phase', who: d.name, text: '黑暗倒流回来——它又站了起来！' }); return true; }
  return false; }
function mechHit(B, a, d, dmg, info) {
  if (!a || dmg <= 0) return;
  if (d.mech === 'fate' && a.side === 0 && !info.crit && !info.dot && a.alive) { const v = Math.max(1, Math.round(dmg * 0.1)); a.hp = Math.max(1, a.hp - v); fxe(B, { k: 'dot', t: a.id, v, hp: hpr(a), st: 'dark' }); }
  if (a.mech === 'swallow' && d.side === 0 && info.ate) { const v = Math.round(info.ate); a.hp = Math.min(a.hpMax, a.hp + v); fxe(B, { k: 'heal', t: a.id, v, hp: hpr(a) }); }
  if (a.mech === 'dark' && d.kind === 'pc') { const s = stOf(d, 'dark'); addSt(d, { k: 'dark', t: 4, v: Math.round(a.atk * 0.12) + (s ? s.v : 0) }); } }
const mechDmgMul = (a, d) => (d.mech === 'pride' && d.hp > d.hpMax * 0.7 && a && a.side === 0) ? 0.5 : 1;
function mechHeroAct(B, u, act) { B.lastHero = act || {};
  if (act && act.sk && ['lei', 'liushen'].includes(act.sk) && stOf(u, 'dark')) { u.st = u.st.filter(s => s.k !== 'dark'); blog(B, `<span class="weak">${SKILLS[act.sk].name}把身上的黑暗洗掉了</span>`); }
  const q = B.units.find(x => x.mech === 'question' && x.alive); if (q && B.asked && B.round === B.asked + 1 && act && act.sk === 'guard') { q.hp = 0; q.alive = false; fxe(B, { k: 'die', t: q.id }); B.kills.push([q.mob, q.lv, q.boss]); blog(B, `<span class="cine">你没有出手，只说了一句：“还在。小七守着呢。”<br>${uName(q)} 放下了枪。</span>`); B.answered = 1; } }
/* fighting by hand: breaking a gathering blow / hitting a weak spot in a story or boss fight */
function mechBonus(B) { if (B.auto || !(B.story || B.units.some(u => u.boss))) return 0; const n = Math.min(3, (B.ints || 0)) + Math.min(2, Math.floor((B.weakHits || 0) / 3)); return n; }
