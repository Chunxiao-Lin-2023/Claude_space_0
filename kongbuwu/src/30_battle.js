/* 对峙引擎：一回合一次算完，发生的事记进 B.ev，动画只是回放（RULES 4c） */
const STATE = { scene: false, battle: null, busy: false, live: null, mini: null, run: 0 };
let BID = 0;
function mobUnit(id, lv, i) { const M = MOBS[id], D = DIFF[SET.diff] || DIFF[1]; lv = Math.max(1, lv);
  return { side: 'f', key: 'f' + i, id, n: M.n, lv, k: M.k, boss: !!M.boss, weak: M.weak || [], mhp: Math.round((58 + 25 * lv) * M.hp * BAL.foeHp(lv) * D.hp), atk: (10 + 3.5 * lv) * M.atk * BAL.foeAtk(lv) * D.atk, def: (3 + 1.5 * lv) * M.def, spd: M.spd, st: {}, intent: null, charging: null, acted: false, dmgT: 0 }; }
function heroUnit(scare) { const s = charStats(); return { side: 'a', key: 'hero', id: 'hero', n: '陈歌', lv: C.lv, mhp: s.mhp, hp: scare ? s.mhp : Math.max(1, C.hp), atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, st: {}, dmgT: 0 }; }
function petUnit(k) { const P = PETS[k], p = C.pets[k] || { lv: C.lv + 3, aff: 100 }, lv = p.lv; let atk = HERO.atk(lv) * P.atk * (1 + p.aff * .002); for (const g of C.gear) if (ITEMS[g].pet && ITEMS[g].pet[k]) atk *= ITEMS[g].pet[k];
  return { side: 'a', key: 'pet', id: k, n: P.n, lv, mhp: Math.round(HERO.hp(lv) * P.hp), atk, def: HERO.def(lv) * .8, spd: HERO.spd(lv) + 1, st: {}, dmgT: 0, pet: 1 }; }
function battleCreate(o) { const scare = !!o.scare, B = { id: ++BID, o, scare, turn: 1, log: [], ev: [], phase: 'hero', pick: {}, sel: 0, itemUsed: false, auto: !!(C.auto || (window.__dbg && __dbg.auto)), result: null, lowUsed: false, said: {}, seen: {} };
  const SP = scare ? scenePas(o.scene) : null; B.foes = o.mobs.map((m, i) => { const u = mobUnit(m[0], m[1], i); if (m[2]) u.n = m[2]; u.trait = MOBS[m[0]].trait || ''; if (SP) u.mhp = Math.round(u.mhp * SP.hp); u.hp = u.mhp; return u; }); B.hero = heroUnit(scare);
  const pk = o.ally || (o.noPet ? '' : C.pet[scare ? 'd' : 'n']); B.pet = pk && PETS[pk] && (o.ally || C.pets[pk]) ? petUnit(pk) : null; if (B.pet) B.pet.hp = B.pet.mhp;
  if (!scare && C.gear.includes('g_mask')) for (const f of B.foes) if (f.k === 'human') f.st.weak = 2;
  for (const f of B.foes) { const cd = C.codex[f.id] = C.codex[f.id] || { n: 0, wk: [] }; cd.n++; planMob(B, f); }
  for (const p of o.pre || []) { const f = B.foes[p[0]]; if (f) f.st[p[1]] = p[2]; }
  if (o.picky && B.foes[o.picky.i]) { const u = B.foes[o.picky.i]; u.picky = o.picky.el; u.n = '挑剔的' + u.n; }
  for (const f of B.foes) if (f.boss && SOFT[f.id]) blog(B, '💡 ' + SOFT[f.id][1], 'sys');
  if (scare) { const up = C.hh.up || {}; for (const f of B.foes) { if (up.fog) f.st.vuln = 2; if (o.scene === 'mh' && C.f.jiayi) f.st.fear = 1; if (up.cam) for (const w of f.weak) { const cd = C.codex[f.id]; if (!cd.wk.includes(w)) cd.wk.push(w); } } }
  return B; }
const alive = us => us.filter(u => u.hp > 0);
function addSt(B, u, k, t) { if (u.hp <= 0) return; if (u.trait === 'calm' && (k === 'fear' || k === 'vuln')) t = Math.max(1, t - 1); if (k === 'dark' && C.hh.up && C.hh.up.light) t++; if (k === 'stun') { if (u.st.steady) return; if (u.boss) u.st.steady = 3; } u.st[k] = Math.max(u.st[k] || 0, t); if (k === 'shield') u.shV = Math.round(B.hero.mhp * .3); if (k === 'slow' && u.charging) { u.charging = null; planMob(B, u, 1); fxe(B, { t: 'txt', who: u.key, txt: '蓄力被打断' }); } fxe(B, { t: 'st', who: u.key, k }); }
function blog(B, s, cls) { B.log.push({ s, cls: cls || '', turn: B.turn }); B.lastLine = B.log.length - 1; }
function fxe(B, e) { e.line = B.log.length - 1; B.ev.push(e); }
function unitByKey(B, k) { return k === 'hero' ? B.hero : k === 'pet' ? B.pet : B.foes.find(f => f.key === k); }
/* 敌人意图：蓄力大招先亮一回合 ⚠，下一回合才落下 */
function planMob(B, u, noBig) { const M = MOBS[u.id]; if (u.charging && !noBig) { u.intent = { mv: u.charging, exec: 1 }; return; } u.charging = null;
  let mv = M.mv.filter(m => !(m.ch && (noBig || u.st.slow || B.turn < 2 || u.lastBig === B.turn - 1))); let tot = mv.reduce((a, m) => a + m.w, 0), r = rnd() * tot, c = mv[0]; for (const m of mv) { r -= m.w; if (r <= 0) { c = m; break; } }
  if (c.ch) { u.charging = c; u.intent = { mv: c, charge: 1 }; } else u.intent = { mv: c }; }
function intentText(B, u) { const it = u.intent; if (!it || u.hp <= 0) return ''; if (u.st.stun) return '💫 懵了'; if (it.charge) return '⚠ ' + (it.mv.cn || '在蓄力') + '（下回合）'; if (it.exec) return '⚠ ' + it.mv.n + '！'; return '→ ' + it.mv.n; }
function weakOf(u, el) { return el && el !== 'none' && u.weak.includes(el); }
function noteWeak(B, u, el) { const cd = C.codex[u.id]; if (cd && !cd.wk.includes(el)) { cd.wk.push(el); blog(B, '发现弱点：' + u.n + ' 怕' + EL[el], 'gain'); } }
function tryInterrupt(B, u, why) { if (u.charging || (u.intent && u.intent.exec)) { u.charging = null; u.lastBig = B.turn; planMob(B, u, 1); blog(B, '打断了 ' + u.n + ' 的大招！（' + why + '）', 'gain'); fxe(B, { t: 'txt', who: u.key, txt: '打断！', big: 1 }); return true; } return false; }
function applyDmg(B, src, tgt, raw, o) { o = o || {}; let v = Math.max(1, Math.round(raw)); if (tgt.guard) v = Math.max(1, Math.round(v * BAL.guardMul));
  if (tgt.st.shield && tgt.shV > 0) { const a = Math.min(tgt.shV, v); tgt.shV -= a; v -= a; if (tgt.shV <= 0) delete tgt.st.shield; if (v <= 0) { fxe(B, { t: 'txt', who: tgt.key, txt: '挡住' }); return 0; } }
  /* 绝境：故事战里第一次要倒下或跌到三成，想起一句话 */
  if (tgt.key === 'hero' && !B.lowUsed && B.o.story && !B.scare && (tgt.hp - v) <= tgt.mhp * BAL.lowHp) { B.lowUsed = true; tgt.hp = Math.max(1, tgt.hp - v); tgt.dmgT += v; fxe(B, { t: 'hit', who: tgt.key, v, hp: tgt.hp, crit: o.crit, weak: o.weak });
    const heal = Math.round(tgt.mhp * (BAL.lowHeal + charStats().low)); tgt.hp = Math.min(tgt.mhp, tgt.hp + heal); for (const k of ['bleed', 'fear', 'weak', 'slow', 'stun']) delete tgt.st[k]; tgt.st.brave = 3;
    const ln = epicLow(B); blog(B, '【绝境】' + ln, 'epic'); fxe(B, { t: 'low', txt: ln, hp: tgt.hp }); yaAssist(B); return v; }
  tgt.hp = Math.max(0, tgt.hp - v); tgt.dmgT += v; fxe(B, { t: 'hit', who: tgt.key, v, hp: tgt.hp, crit: o.crit, weak: o.weak, src: src && src.key });
  if (tgt.hp <= 0) { fxe(B, { t: 'ko', who: tgt.key }); if (tgt.side === 'f') { blog(B, tgt.n + (B.scare ? ' 吓得夺路而逃！' : (tgt.k === 'ghost' ? ' 散了。' : ' 倒下了。')), 'gain'); battleSay(B, tgt, 'die'); C.kills[tgt.id] = (C.kills[tgt.id] || 0) + 1; } }
  else if (tgt.side === 'f' && tgt.boss && !tgt.phased && tgt.hp <= tgt.mhp * .5) { tgt.phased = true; tgt.st.rage = 99; const ln = epicPhase(B, tgt); blog(B, tgt.n + (B.scare ? ' 强撑着不肯认怂' : ' 红了眼') + '（攻击 +25%）' + (ln ? '：“' + ln + '”' : ''), 'warn'); fxe(B, { t: 'phase', who: tgt.key, txt: ln }); }
  return v; }
function skillMul(k) { let m = 1 + profLevel(k)[2]; for (const g of C.gear) { const G = ITEMS[g]; if (G.sk && G.sk[k]) m *= G.sk[k]; } const S = SKILLS[k]; if (S.m !== 'n' && C.talents.includes('lianrong') && (S.m === 'd' || STATE.battle && STATE.battle.scare)) m *= 1.12; if (C.titles.includes('boss20') && S.m === 'd') m *= 1.05;
  const B = STATE.battle; if (B && B.scare) { m *= 1 + relicBonus(C, 'scare'); const P = scenePas(B.o.scene); if (P.el[S.el]) m *= P.el[S.el]; const up = C.hh.up || {}; if (up.skin && S.el === 'doll') m *= 1.2; if (up.sound && S.el === 'sound') m *= 1.2; if (up.light && (S.el === 'jump' || S.el === 'light')) m *= 1.15; } return m; }
/* 厉鬼眷顾者：拿到红舞鞋以后，绝境那一刻影子里会伸出黑发（贪心过的话只有一半可能） */
function yaAssist(B) { if (B.scare || B.o.ally || !C.f.shoes || !C.titles.includes('favored') || B.pet && B.pet.id === 'zhangya') return; if (C.f.greedy && !chance(.5)) { blog(B, '影子动了一下，又静了。她还记得你那个请求。', 'say'); return; }
  const f = alive(B.foes).sort((a, b) => b.hp - a.hp)[0]; if (!f) return; blog(B, '影子里伸出一缕黑发——厉鬼眷顾者。', 'epic'); fxe(B, { t: 'banner', who: 'hero', txt: '黑发', ic: '🩸' }); applyDmg(B, null, f, Math.round(f.mhp * .2), {}); if (f.hp > 0) addSt(B, f, 'stun', 1); }
function doHit(B, src, tgt, pow, el, o) { o = o || {}; if (tgt.hp <= 0) return 0; let base = src.atk * pow * (o.mul || 1); if (src.st.weak) base *= .75; if (src.st.rage) base *= BAL.phaseAtk; if (src.st.brave) base *= BAL.lowAtk;
  if (src.pet && (tgt.st.mark || tgt.st.stun)) base *= 1.3; if (tgt.trait === 'corpse' && (el === 'doll' || el === 'jump')) base *= .75; if (tgt.trait === 'darkfear' && tgt.st.dark) base *= 1.2; if (tgt.k === 'human' && el === 'salt') base *= .5; if (tgt.k === 'ghost' && o.plain) base *= .6;
  const wk = weakOf(tgt, el); if (wk) { base *= BAL.weakMul; noteWeak(B, tgt, el); }
  let crit = false; if (src.key === 'hero') { if (src.st.bless) { crit = true; delete src.st.bless; } else crit = chance((src.crit || 0) + (src.st.see ? .35 : 0)); } if (crit) base *= BAL.critMul;
  const mit = tgt.def * (tgt.st.vuln ? .7 : 1) * .6; const v = applyDmg(B, src, tgt, base * (.92 + rnd() * .16) - mit, { crit, weak: wk }); tgt.acted = tgt.acted;
  if (tgt.hp > 0 && wk && tgt.side === 'f') tryInterrupt(B, tgt, '打中弱点'); return v; }
/* 我方出手 */
function perform(B, u, a) { if (u.hp <= 0 || B.result) return; u.guard = false;
  if (u.st.stun) { blog(B, u.n + ' 懵着，动不了。', 'warn'); fxe(B, { t: 'txt', who: u.key, txt: '懵' }); return; }
  if (a.t === 'guard') { u.guard = true; if (a.perfect && u.key === 'hero') { u.dodge = true; blog(B, '陈歌盯着它的动作，等那一下。', 'gain'); } blog(B, u.n + (B.scare ? ' 稳住场面。' : ' 护住要害。')); fxe(B, { t: 'txt', who: u.key, txt: '防御' }); sfxQ(B, 'guard'); return; }
  const tgt0 = B.foes[a.tg] && B.foes[a.tg].hp > 0 ? B.foes[a.tg] : alive(B.foes)[0]; if (!tgt0) return;
  if (u.key === 'hero') { let k = a.k, S = SKILLS[k]; if (!S || C.mp < S.cost) { k = B.scare ? 'jump' : 'hammer'; S = SKILLS[k]; } C.mp -= S.cost; profUse(k); let mul = skillMul(k) * comboMul(B, k); if (a.perfect) { mul *= PERFECT_MUL; FN().perfect++; blog(B, '完美时机！', 'epic'); fxe(B, { t: 'banner', who: 'hero', txt: '完美', ic: '⭕' }); }
    blog(B, '陈歌 · ' + S.ic + S.n + (S.self ? '' : ' → ' + (S.all ? '全体' : tgt0.n))); fxe(B, { t: 'banner', who: 'hero', txt: S.n, ic: S.ic });
    if (S.self) { addSt(B, u, S.st[0], S.st[1]); if (S.st[0] === 'see') for (const f of alive(B.foes)) for (const w of f.weak) noteWeak(B, f, w); return; }
    for (const t of (S.all ? alive(B.foes) : [tgt0])) { let m = mul; if (S.first && !t.acted) m *= S.first; if (S.dark && t.st.dark) m *= S.dark; if (S.ghost && t.k === 'ghost') m *= S.ghost; const soft = softHit(B, t, S); m *= soft; if (t.picky && t.picky === S.el) t.pickyHit = 1;
      doHit(B, u, t, S.pow, S.el, { mul: m, plain: k === 'hammer' }); reactLine(B, t); if (soft > 1 && t.hp > 0) { delete t.st.steady; addSt(B, t, 'stun', 1); tryInterrupt(B, t, '软肋'); } if (t.hp > 0) { if (S.st) addSt(B, t, S.st[0], S.st[1]); if (S.stun && chance(S.stun * (t.boss ? .6 : 1))) { addSt(B, t, 'stun', 1); if (t.st.stun) { blog(B, t.n + (B.scare ? ' 腿软了！' : ' 被打懵了！'), 'gain'); tryInterrupt(B, t, '打懵'); } } } }
    banterAct(B, k); return; }
  /* 员工 */
  const mv = a.mv; blog(B, u.n + ' · ' + mv.n + (mv.guard || mv.c === 'buf' ? '' : ' → ' + (mv.all ? '全体' : tgt0.n))); fxe(B, { t: 'banner', who: 'pet', txt: mv.n });
  if (mv.guard) { addSt(B, B.hero, mv.st[0], mv.st[1]); u.st.taunt = 2; return; } if (mv.c === 'buf') { addSt(B, B.hero, mv.st[0], mv.st[1]); if (mv.see) for (const f of alive(B.foes)) for (const w of f.weak) noteWeak(B, f, w); return; }
  for (const t of (mv.all ? alive(B.foes) : [tgt0])) { doHit(B, u, t, mv.pow || .5, mv.el || 'none'); reactLine(B, t); if (t.hp > 0) { if (mv.st) addSt(B, t, mv.st[0], mv.st[1]); if (mv.brk) tryInterrupt(B, t, u.n); if (mv.stun && chance(mv.stun * (t.boss ? .6 : 1))) { addSt(B, t, 'stun', 1); if (t.st.stun) tryInterrupt(B, t, '吓懵'); } } } }
function mobAct(B, u) { if (u.hp <= 0 || B.result) return; u.acted = true; if (u.st.stun) { blog(B, u.n + (B.scare ? ' 腿软，站在原地。' : ' 还懵着。')); return; } if (u.trait === 'distract' && !(u.intent && u.intent.exec) && chance(.2)) { blog(B, u.n + ' 低头看手机，没往前走。'); fxe(B, { t: 'txt', who: u.key, txt: '分心' }); return; }
  const it = u.intent || {}; const mv = it.mv; if (!mv) return; if (it.charge) { blog(B, u.n + '：' + (mv.cn || '在蓄力') + '……', 'warn'); fxe(B, { t: 'txt', who: u.key, txt: '⚠ 蓄力' }); return; }
  if (it.exec) { u.charging = null; u.lastBig = B.turn; }
  const tgts = mv.all ? [B.hero].concat(B.pet && B.pet.hp > 0 ? [B.pet] : []) : [(B.pet && B.pet.hp > 0 && (B.pet.st.taunt || chance(.22))) ? B.pet : B.hero];
  blog(B, u.n + ' · ' + mv.n + (it.exec ? '！' : ''), it.exec ? 'warn' : ''); fxe(B, { t: 'banner', who: u.key, txt: mv.n, foe: 1, big: it.exec });
  for (const t of tgts) { if (t.dodge && it.exec) { blog(B, t.n + ' 一侧身，闪开了！', 'gain'); fxe(B, { t: 'txt', who: t.key, txt: '闪开' }); FN().dodge++; continue; } let base = u.atk * mv.p; if (u.st.weak) base *= .75; if (u.st.rage) base *= BAL.phaseAtk; if (u.st.dark) base *= u.trait === 'darkfear' ? .5 : .8; base *= B.scare ? BAL.scareAtk : BAL.nightAtk * (u.boss && !B.pet?.id?.startsWith('zhangya') && alive(B.foes).length === 1 ? BAL.bossAtk : 1); const mit = t.def * (t.st.vuln ? .7 : 1) * .6; applyDmg(B, u, t, base * (.92 + rnd() * .16) - mit, {}); if (mv.st && t.hp > 0 && t.key === 'hero' && !t.guard) addSt(B, t, mv.st[0], mv.st[1]); } }
function sfxQ(B, n) { fxe(B, { t: 'sfx', n }); }
function tickSt(B, u) { if (u.hp <= 0) return; const dot = k => { const r = (k === 'bleed' ? .06 : .07) * (u.boss ? .5 : 1); const v = Math.max(1, Math.round(u.mhp * r)); u.hp = Math.max(u.side === 'a' ? 1 : 0, u.hp - v); fxe(B, { t: 'hit', who: u.key, v, hp: u.hp, dot: STATUS[k][0] }); if (u.hp <= 0) { blog(B, u.n + (B.scare ? ' 崩溃了，哭着往外跑！' : ' 倒下了。'), 'gain'); fxe(B, { t: 'ko', who: u.key }); C.kills[u.id] = (C.kills[u.id] || 0) + 1; } };
  if (u.st.bleed) dot('bleed'); if (u.hp > 0 && u.st.fear) dot('fear'); for (const k in u.st) if (u.st[k] < 90 && --u.st[k] <= 0) delete u.st[k]; }
function battleResolve(B) { const n0 = alive(B.foes).length; B.ev = []; B.phase = 'anim'; for (const u of [B.hero, B.pet].concat(B.foes)) if (u) u.dmgT = 0; const first = B.log.length;
  const order = B.pet && B.pet.hp > 0 ? (C.duo ? ['pet', 'hero'] : ['hero', 'pet']) : ['hero'];
  for (const k of order) { const u = unitByKey(B, k), a = B.pick[k]; if (u && a) perform(B, u, a); if (!alive(B.foes).length) break; }
  if (alive(B.foes).length) for (const f of B.foes.slice().sort((a, b) => (b.spd - (b.st.slow ? 6 : 0)) - (a.spd - (a.st.slow ? 6 : 0)))) { mobAct(B, f); if (B.hero.hp <= 0) break; }
  for (const u of B.foes.concat([B.hero, B.pet])) if (u) tickSt(B, u);
  if (B.scare && alive(B.foes).length) sceneTurn(B);
  if (B.pet && B.pet.hp <= 0 && !B.petDown) { B.petDown = true; blog(B, B.pet.n + ' 退到了你身后。', 'warn'); }
  if (B.scare && n0 >= 2 && !alive(B.foes).length) { B.fullHouse = n0; FN().house++; blog(B, '全场尖叫！' + n0 + ' 个游客一起冲了出去。', 'epic'); fxe(B, { t: 'banner', who: 'hero', txt: '全场尖叫', ic: '😱' }); }
  B.hero.guard = false; B.hero.dodge = false; if (B.pet) B.pet.guard = false; B.pick = {}; B.itemUsed = false; B.firstNew = first;
  if (!alive(B.foes).length) B.result = 'win'; else if (B.hero.hp <= 0) B.result = 'lose'; else { B.turn++; for (const f of alive(B.foes)) planMob(B, f); banterRound(B); } }
/* 自动对峙：会吃东西、会防大招、会打弱点 */
function botAct(B) { const h = B.hero, foes = alive(B.foes), mode = B.scare ? 'd' : 'n', bar = C.bar[mode].filter(k => SKILLS[k] && C.mp >= SKILLS[k].cost);
  if (!B.scare && !B.itemUsed && h.hp < h.mhp * .4) { const it = ['drink', 'bandage', 'bread'].find(k => itemN(k)); if (it) battleItem(it, 1); }
  if (!B.itemUsed && C.mp < charStats().mmp * .25) { const it = ['coffee', 'smoke'].find(k => itemN(k)); if (it) battleItem(it, 1); }
  if (B.o.candy && !B.candyUsed && itemN('candy') && h.hp < h.mhp * .6) return { t: 'candy' };
  const big = foes.find(f => f.intent && f.intent.exec && !f.st.stun); const cd = f => (C.codex[f.id] || { wk: [] }).wk;
  let best = null, bs = -1; for (const f of foes) for (const k of bar) { const S = SKILLS[k]; if (S.self) continue; let s = (S.pow || 0) * (S.all ? Math.min(foes.length, 2.2) : 1) * (cd(f).includes(S.el) && weakOf(f, S.el) ? 1.5 : 1) * (1 - S.cost * .012) + (S.st && !f.st[S.st[0]] ? .25 : 0) + (S.stun || 0); if (S.first && !f.acted) s *= S.first; if (S.dark && f.st.dark) s *= 1.5; if (B.scare && B.lastK) s *= k === B.lastK ? Math.pow(REPEAT_DOWN, Math.min((B.rep || 0) + 1, 3)) : 1 + COMBO_UP * Math.min((B.combo || 0) + 1, COMBO_MAX); s *= .6 + .4 * (1 - f.hp / f.mhp) + (f === big ? .5 : 0); if (s > bs) { bs = s; best = { t: 'sk', k, tg: B.foes.indexOf(f) }; } }
  if (big) { const wkSk = bar.find(k => weakOf(big, SKILLS[k].el) && cd(big).includes(SKILLS[k].el)); if (wkSk) return { t: 'sk', k: wkSk, tg: B.foes.indexOf(big) }; if (!(B.pet && B.pet.hp > 0 && petMovesB(B).some(m => m.brk))) return { t: 'guard' }; }
  if (!B.scare && B.turn === 1 && foes.some(f => f.boss)) { const buff = ['yintong', 'doll'].find(k => bar.includes(k) && !h.st[SKILLS[k].st[0]]); if (buff) return { t: 'sk', k: buff, tg: 0 }; }
  return best || { t: 'sk', k: B.scare ? 'jump' : 'hammer', tg: B.foes.indexOf(foes[0]) }; }
function petMovesB(B) { return B.pet ? (C.pets[B.pet.id] ? petMoves(B.pet.id) : PETS[B.pet.id].moves) : []; }
function petPick(B) { const p = B.pet, mv = petMovesB(B), foes = alive(B.foes); const big = foes.find(f => (f.charging || f.intent && f.intent.exec) && !f.st.stun); const tg = f => B.foes.indexOf(f);
  if (big) { const m = mv.find(m => m.brk) || mv.find(m => m.stun); if (m) return { t: 'mv', mv: m, tg: tg(big) }; }
  if (B.hero.hp < B.hero.mhp * .45 && !B.hero.st.shield) { const m = mv.find(m => m.guard); if (m) return { t: 'mv', mv: m, tg: 0 }; }
  const boss = foes.slice().sort((a, b) => b.hp - a.hp)[0]; const deb = mv.find(m => m.c === 'deb' && m.st && !boss.st[m.st[0]]); if (deb && boss.hp > boss.mhp * .35 && chance(.8)) return { t: 'mv', mv: deb, tg: tg(boss) };
  const buf = mv.find(m => m.c === 'buf' && !B.hero.st[m.st[0]]); if (buf && chance(.5)) return { t: 'mv', mv: buf, tg: 0 };
  const atk = mv.filter(m => m.c === 'atk').sort((a, b) => (b.pow || 0) * (b.all ? Math.min(foes.length, 2) : 1) - (a.pow || 0) * (a.all ? Math.min(foes.length, 2) : 1))[0] || mv[0]; return { t: 'mv', mv: atk, tg: tg(foes.slice().sort((a, b) => a.hp - b.hp)[0]) }; }
/* 每回合结束：场景特色 + 游客特性 */
function sceneTurn(B) { const fs = alive(B.foes), s = B.o.scene;
  if (s === 'ws' && C.pets.xiaoxiao && chance(.3)) { const f = pick(fs); addSt(B, f, 'mark', 2); blog(B, f.n + ' 觉得有人拽了一下衣角。', 'say'); }
  if (s === 'room' && chance(.25)) { const f = pick(fs); addSt(B, f, 'stun', 1); blog(B, f.n + '：“我们进来的时候……是几个人来着？”', 'say'); }
  if (s === 'ward') for (const f of fs) { const v = Math.max(1, Math.round(f.mhp * .05)); f.hp = Math.max(0, f.hp - v); fxe(B, { t: 'hit', who: f.key, v, hp: f.hp, dot: '三星' }); if (f.hp <= 0) { blog(B, f.n + ' 再也撑不住了！', 'gain'); fxe(B, { t: 'ko', who: f.key }); } }
  for (const f of alive(B.foes)) { if (f.trait === 'pair' && !f.st.fear && f.hp < f.mhp) { const v = Math.round(f.mhp * .06); f.hp = Math.min(f.mhp, f.hp + v); fxe(B, { t: 'txt', who: f.key, txt: '壮胆 +' + v }); }
    if (f.trait === 'torch' && fs.some(x => x.st.dark) && chance(.5)) { for (const x of fs) delete x.st.dark; blog(B, f.n + ' 打开了手机电筒。', 'warn'); fxe(B, { t: 'txt', who: f.key, txt: '开灯' }); } }
  if (!alive(B.foes).length) B.result = 'win'; }
function battleRewards(B) { const D = DIFF[SET.diff] || DIFF[1]; let exp = 0; for (const f of B.foes) exp += f.lv * 6 * (f.boss ? 3 : 1); exp = Math.round(exp * (B.o.story ? BAL.storyExp : 1) * D.exp * (B.scare ? .7 : 1)); const out = { exp };
  if (B.scare) { const sc = SCENES[B.o.scene] || { star: .5 }, n = B.foes.length, P = scenePas(B.o.scene); out.money = Math.round(BAL.ticket * (B.o.ppl || n) * P.pay * (1 + relicBonus(C, 'ticket'))); out.screams = Math.round(n * (6 + sc.star * 6) + B.foes.filter(f => f.boss).length * 10) + (B.fullHouse ? HOUSE_SCREAM * B.fullHouse : 0); if (B.foes.some(f => f.picky && f.pickyHit)) { out.money += PICKY_MONEY; out.picky = 1; } }
  else if (!B.o.story) out.money = B.foes.filter(f => f.k === 'human' && f.id !== 'dog').length * rint(3, 9);
  return out; }
