/* ================= 伙伴组队: several partners in one fight, chosen before it starts =================
   How many partners may fight depends on the occasion, the difficulty and how far along you are:
     野外遭遇 1 · 剧情战 / 秘境 / 守城 / 守擂 2 · 首领战 3 ；困难难度 +1 ；石昊 15 层前最多 1、30 层前最多 2 ；最多 3。
   Every partner past the first makes the foes sturdier (气血 +50%, 攻击 +15% each) and each partner is a little weaker (×0.7 with two, ×0.55 with three), so a bigger team means a longer, richer fight,
   not a free win. You choose a move for every partner each round (or let the rest act on their own); the first one (领头) acts right
   next to 石昊 and is the one ⇄ swaps out.
   Before a boss / 秘境 / 守城 fight (when you own more partners than may come) a picker opens: it recommends partners for
   this fight from what the foes do — every partner has one trait of its own (PET_TRAIT) and a kind of fight it is good in.
   C.party keeps the last team, lead first (C.pet is always the lead). */
const PET_TRAIT = {
  maoqiu: { n: '越战越勇', d: '每挨一下打，攻击 +5%（最多 +30%）；打出去的伤害有 15% 回到自己身上。', use: '硬碰硬的长仗，站在前面挨打的那一个。' },
  dahong: { n: '火羽', d: '群攻伤害 +15%，灼烧更容易点上。', use: '敌人成群、守城一波一波来的时候；能让残仙这种会回血的吃不下。' },
  ertuzi: { n: '五色护体', d: '它的回血和护盾比别的伙伴多三成多；照晕正在蓄力的敌人，就能打断它。', use: '要撑很久的仗——它是最好的奶妈；也能打断蓄大招的首领。' },
  dashen: { n: '指哪打哪', d: '从不打空；砸中正在蓄力的敌人，一半机会能打断。', use: '专治蓄力大招和硬壳——哪个首领爱憋大招，就带它。' },
  xiaobai: { n: '快', d: '每回合最先出手；每回合结束，给气血最低的同伴回 2%。', use: '拖得很长的仗，或者敌人每回合都在掉你血（黑暗潮汐）的时候。' },
  sanhei: { n: '玄甲', d: '受到的伤害 -15%；石昊气血低于四成时，自己挡到前面去。', use: '首领一下打得特别疼的时候。' },
  wuwei: { n: '无畏', d: '每倒下一个敌人，全队攻击 +8%（最多 +24%）。', use: '敌人越多越好——守城、守擂、成群的野外。' },
  jinmao: { n: '仙王威压', d: '它在场时，敌人攻击 -10%；打首领伤害 +10%。', use: '首领战，什么首领都行。' },
};
const PARTY_MAX = 3; /* every partner's stun lands half as often on a 首领 */
const partyOwned = () => Object.keys(C.pets || {});
function partyIsBig(spec) { return !!(spec.epic || (spec.mobs || []).some(([id]) => MOBS[id] && MOBS[id].boss) || (spec.rivals || []).some(r => r.boss)); }
function partySlots(spec) { if (!C || spec.noPet) return 0; const own = partyOwned().length; if (!own) return 0;
  const occ = partyIsBig(spec) ? 3 : (spec.story || spec.dungeon || spec.waves || spec.endless || spec.siegeMode) ? 2 : 1, hard = (C.diff ?? 1) >= 2 ? 1 : 0, cap = C.lv < 15 ? 1 : C.lv < 30 ? 2 : 3;
  return Math.max(1, Math.min(occ + hard, cap, own, PARTY_MAX)); }
const slotWhy = spec => `${partyIsBig(spec) ? '首领战 3' : (spec.story || spec.dungeon || spec.waves || spec.endless || spec.siegeMode) ? '剧情战/秘境/守城 2' : '野外 1'}${(C.diff ?? 1) >= 2 ? '，困难 +1' : ''}${C.lv < 30 ? `，${C.lv < 15 ? 15 : 30} 层前最多 ${C.lv < 15 ? 1 : 2}` : ''}`;
function partyList() { const own = partyOwned(); let L = (C.party || []).filter(id => C.pets[id]); if (C.pet && C.pets[C.pet]) L = [C.pet, ...L.filter(x => x !== C.pet)];
  for (const id of own.slice().sort((a, b) => petLv(b) - petLv(a) || (C.pets[b].aff - C.pets[a].aff))) if (!L.includes(id)) L.push(id); return L; }
const partyFor = n => n > 0 ? partyList().slice(0, n) : [];
/* which partners suit this fight, and why */
function partyAdvice(spec) { const foes = (spec.mobs || []).map(([id]) => MOBS[id]).filter(Boolean), boss = foes.filter(M => M.boss), many = foes.length >= 3 || spec.waves || spec.endless, sc = {}, why = {};
  const add = (id, v, t) => { sc[id] = (sc[id] || 0) + v; (why[id] = why[id] || []).includes(t) || why[id].push(t); };
  if (boss.some(M => M.sk.some(s => s.charge)) || (spec.rivals || []).some(r => r.boss)) { add('dashen', 3, '能打断大招'); add('ertuzi', 2, '能打断大招'); }
  if (boss.length || partyIsBig(spec)) { add('jinmao', 3, '首领战'); add('maoqiu', 1, '破甲'); }
  if (many) { add('dahong', 3, '敌人多'); add('wuwei', 3, '敌人多'); }
  if (boss.some(M => (M.mul.atk || 1) >= 1.8) || boss.some(M => M.mech === 'dark' || M.mech === 'swallow')) { add('sanhei', 3, '首领打得疼'); add('xiaobai', 1, '回血'); }
  if (boss.some(M => M.mech === 'tide') || boss.some(M => (M.mul.hp || 1) >= 7)) { add('xiaobai', 2, '仗长、掉血'); add('sanhei', 1, '扛得住'); }
  if (boss.some(M => M.mech === 'devour') || foes.some(M => M.weak && M.weak.fire)) add('dahong', 3, foes.some(M => M.mech === 'devour') ? '让它吃不下' : '怕火');
  if (foes.some(M => M.weak && M.weak.blunt)) { add('dashen', 2, '怕钝击'); add('maoqiu', 1, '怕钝击'); }
  if (boss.some(M => M.mech === 'mimic')) { add('wuwei', 1, '招式多'); add('dahong', 1, '招式多'); }
  const own = partyOwned(); return { order: own.slice().sort((a, b) => (sc[b] || 0) - (sc[a] || 0) || petLv(b) - petLv(a)), why }; }
function partyNeedsPick(spec, n) { if (!n || NETROLE) return false; /* co-op: the host's saved team, no picker */ if (window.__dbg && __dbg.auto) return false; if (C.auto || UI.forceAuto) return false;
  const own = partyOwned().length; if (own <= 1) return false; return partyIsBig(spec) || !!spec.dungeon || !!spec.waves || !!spec.endless; }
function partyPick(spec, n) { const adv = partyAdvice(spec), cur = partyFor(n), sel = partyIsBig(spec) || spec.waves || spec.endless ? adv.order.slice(0, n) : cur;
  return new Promise(res => { DLG = { party: { n, sel: sel.length ? sel : cur, adv, why: slotWhy(spec), title: spec.title || '战斗' }, res }; renderDlg(); }); }
function partyToggle(id) { const P = DLG && DLG.party; if (!P) return; const i = P.sel.indexOf(id); if (i >= 0) P.sel.splice(i, 1); else { if (P.sel.length >= P.n) P.sel.pop(); P.sel.push(id); } sfx('click'); renderDlg(); }
function partyLead(id) { const P = DLG && DLG.party; if (!P || !P.sel.includes(id)) return; P.sel = [id, ...P.sel.filter(x => x !== id)]; sfx('click'); renderDlg(); }
function partyRecommend() { const P = DLG && DLG.party; if (!P) return; P.sel = P.adv.order.slice(0, P.n); sfx('click'); renderDlg(); }
function partyGo() { const D_ = DLG, P = D_ && D_.party; if (!P) return; if (!P.sel.length) P.sel = partyFor(1); C.party = P.sel.concat(partyList().filter(x => !P.sel.includes(x))); C.pet = P.sel[0]; DLG = null; renderDlg(); sfx('click'); D_.res(P.sel.slice()); }
function partyHtml(P) { const own = partyOwned();
  return `<div class="tplace">出战伙伴<span>${esc(P.title)}</span></div><div class="party-h">这一仗能带 <b>${P.n}</b> 个伙伴 <span class="dim">（${P.why}）</span>。<br><span class="dim">每个伙伴的招都由你来选（也可以点「剩下的伙伴自己打」）；<b>领头</b>的那个和石昊连着出手，⇄ 换人也是换它。每多带一个，敌人气血 +50%、攻击 +15%；伙伴越多，每个伙伴分到的力气越少（两个 ×0.7，三个 ×0.55）。</span></div>
    <div class="party">${own.map(id => { const Pt = PETS[id], p = C.pets[id], T = PET_TRAIT[id] || {}, k = P.sel.indexOf(id), w = P.adv.why[id] || [];
      return `<div class="pcard ${k >= 0 ? 'on' : ''}" onclick="partyToggle('${id}')"><div class="pc-h"><span class="pc-i">${Pt.icon}</span><b>${Pt.name}</b>${k === 0 ? '<span class="pill gold">领头</span>' : k > 0 ? `<span class="pill">第 ${k + 1}</span>` : ''}<span class="dim">${petLv(id)} 级${p.evo3 ? '·真身' : p.evo2 ? '·返祖' : p.evo ? '·觉醒' : ''}</span></div>
        <div class="pc-r">${Pt.role}</div><div class="pc-t"><b>${T.n || ''}</b>：${T.d || ''}</div>${w.length ? `<div class="pc-w">👍 ${w.join('、')}</div>` : ''}${k > 0 ? `<button class="sb" onclick="event.stopPropagation();partyLead('${id}')">设为领头</button>` : ''}</div>`; }).join('')}</div>
    <div class="ch"><button class="chb" onclick="partyRecommend()">👍 按推荐</button><button class="chb pri" onclick="partyGo()">⚔ 开战（${P.sel.length}/${P.n}）</button></div>`; }

/* ---------- traits in battle ---------- */
function partyDmgMul(a, d) { let m = 1; if (a && a.awed && a.side === 1) m *= 0.9; if (a && a.trait === 'jinmao' && d.boss) m *= 1.1; if (d.trait === 'sanhei') m *= 0.85; return m; }
const PARTY_FOE = { hp: 0.5, atk: 0.15 }; // per partner past the first
const PARTY_PET = [1, 1, 0.7, 0.55]; // a bigger team: each partner a little weaker (they share the fight)
function partyPet(B, p) { const k = PARTY_PET[B.partyN || 1] || 1; if (k < 1) { p.hpMax = Math.round(p.hpMax * k); p.atk = Math.round(p.atk * k); p.def = Math.round(p.def * k); } }
function partyFoe(B, u) { if (u.side !== 1) return; const x = Math.max(0, (B.partyN || 1) - 1), k = 1 + PARTY_FOE.hp * x; if (k > 1) { u.hpMax = Math.round(u.hpMax * k); u.hp = Math.round(u.hp * k); u.atk = Math.round(u.atk * (1 + PARTY_FOE.atk * x)); } if (B.units.some(x => x.trait === 'jinmao' && x.alive)) u.awed = 1; }
function partyHurt(B, d, dmg) { if (d.trait === 'maoqiu' && dmg > 0 && d.alive) { const v = Math.min(0.3, stV(d, 'atk') + 0.05); d.st = d.st.filter(s => s.k !== 'atk'); d.st.push({ k: 'atk', t: 99, v }); } }
function partyKill(B, a, d) { if (d.side === 1 && B.units.some(x => x.trait === 'wuwei' && x.alive)) { B.wuweiN = Math.min(3, (B.wuweiN || 0) + 1); for (const u of alive(B, 0)) { const v = Math.max(stV(u, 'atk'), 0.08 * B.wuweiN); u.st = u.st.filter(s => s.k !== 'atk'); u.st.push({ k: 'atk', t: 99, v }); } blog(B, `<span class="weak">无畏：全队攻击 +${8 * B.wuweiN}%</span>`); }
  if (d.trait === 'jinmao') for (const u of B.units) if (u.side === 1) u.awed = 0; }
function partyRound(B, when) { if (when === 'start') { const h = B.units.find(u => u.kind === 'pc'), t = B.units.find(u => u.trait === 'sanhei' && u.alive); if (h && t && h.alive && h.hp < h.hpMax * 0.4 && !stOf(t, 'taunt')) { addSt(t, { k: 'taunt', t: 1 }); blog(B, `${uName(t)} 慢吞吞地爬到了石昊前面——<span class="weak">玄甲：敌人这回合冲它来</span>`); } return; }
  const w = B.units.find(u => u.trait === 'xiaobai' && u.alive); if (w) { const t = alive(B, 0).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0]; if (t && t.hp < t.hpMax) { const v = Math.round(t.hpMax * 0.02); t.hp = Math.min(t.hpMax, t.hp + v); fxe(B, { k: 'heal', t: t.id, v, hp: hpr(t) }); } } }
function partyFielded(B) { return B ? B.units.filter(u => u.pet).map(u => u.mob) : []; }
/* the 灵兽 page: the standing team order (used when no picker opens) */
function partyUp(id) { const L = partyList(), i = L.indexOf(id); if (i <= 0) return; L.splice(i, 1); L.splice(i - 1, 0, id); C.party = L; C.pet = L[0]; sfx('click'); save(); refresh(); }
function partyCardHtml() { const L = partyList(); if (L.length < 2) return '';
  return `<div class="card"><h3>出战顺序 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">排在前面的先上：野外 1 个 · 剧情战/秘境/守城 2 个 · 首领战 3 个（困难 +1；15 层前最多 1、30 层前最多 2）。首领战、秘境、守城前还能临时挑。</span></h3>
    <div class="list">${L.map((id, i) => { const P = PETS[id], T = PET_TRAIT[id] || {}; return `<div class="li ${i === 0 ? 'on' : ''}"><span class="ic">${P.icon}</span><div class="t"><b>${i + 1}. ${P.name}</b>${i === 0 ? ' <span class="pill gold">领头</span>' : ''} <span class="pill">${T.n || ''}</span><small>${T.d || ''}</small><small class="dim">适合：${T.use || ''}</small></div>${i ? `<button class="sb" onclick="partyUp('${id}')">↑</button>` : ''}</div>`; }).join('')}</div></div>`; }
