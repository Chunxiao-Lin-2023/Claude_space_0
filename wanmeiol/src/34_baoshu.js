/* ================= 宝术谱: every 宝术 石昊 met in the book, in the order he met them =================
   - Some 宝术 grow into a higher one (进化): the old one is 包含 in the new — it leaves the list, its slot and its 熟练度 go to the new one.
       青鳞鹰宝术 → 鲲鹏法 · 雷道 → 雷道四绝天 → 雷帝宝术 · 朱雀宝术 → 真凰宝术 · 锈剑 → 草字剑诀（残）→ 草字剑诀 · 天角蚁·力之篇 → 不灭经
   - Others are new: 符文分身, 蛄之宝术, 麒麟宝术, 真龙宝术. Each comes from a 机缘 task (BSQ) in the task list, at the point of the story the book puts it.
   - 原著搭配: one click sets the 宝术栏 the way 石昊 fought at that stage (with what you own); or pick your own.
   - Foes use the same 宝术 (MOB_BS / rivals), so 宁川 really throws 麒麟宝术 at you and 鲲帝 swallows the sky with 鲲鹏法.
   All prose here is original; the sources are named in OPTIMIZATIONS.md. */
const BS_NEW = {
  kunpeng: { name: '鲲鹏法', icon: '🐋', mp: 12, cd: 1, tgt: 'enemy', dmg: 2.4, hits: 3, st: [{ k: 'bleed', t: 2, v: 0.25, p: 0.6 }], self: [{ k: 'swift', t: 2 }], line: 'qly', desc: '鲲鹏巢里拿回来的十凶宝术：鹰爪变成了鹏翼，连击三下共 2.4 倍伤害，可能流血；之后一回合抢先出手。重瞳看不穿它（不受“看穿”减半）。包含青鳞鹰宝术。' },
  lei4: { name: '雷道四绝天', icon: '⚡', mp: 22, cd: 3, tgt: 'enemies', dmg: 1.7, mag: 1, el: 'lei', st: [{ k: 'stun', t: 1, p: 0.26 }], line: 'lei', desc: '元天秘境第一页金纸上的四道雷：全体 1.7 倍伤害，无视一半防御，26% 眩晕；劈在动弹不得的敌人身上 ×1.25。包含雷道。' },
  leidi: { name: '雷帝宝术', icon: '🌩️', mp: 26, cd: 3, tgt: 'enemies', dmg: 2.0, mag: 1, el: 'lei', st: [{ k: 'stun', t: 1, p: 0.3 }], self: [{ k: 'def', t: 2, v: 0.3 }], line: 'lei', desc: '两页金纸合在一起，十凶雷帝的全本：全体 2 倍伤害，无视一半防御，30% 眩晕；身上披一层雷帝甲胄（2 回合防御 +30%）。包含雷道四绝天。' },
  zhenhuang: { name: '真凰宝术', icon: '🐦‍🔥', mp: 30, cd: 3, tgt: 'enemies', dmg: 2.2, mag: 1, el: 'fire', st: [{ k: 'burn', t: 3, v: 0.45, p: 0.9 }], line: 'zhuque', desc: '虚神界十块青铜书碎片换来的十凶真凰：全体 2.2 倍伤害，重灼烧。带在宝术栏里时，每场战斗第一次倒下会浴火重生（回三成气血）。包含朱雀宝术。' },
  caozi0: { name: '草字剑诀（残）', icon: '🌿', mp: 20, cd: 3, tgt: 'enemy', dmg: 2.4, hits: 3, mag: 1, st: [{ k: 'bleed', t: 3, v: 0.4, p: 1 }], line: 'jian', desc: '一张兽皮上的半篇剑诀：三片剑叶连斩，共 2.4 倍伤害，无视一半防御，重创流血；斩在流血的伤口上 ×1.35。包含锈剑的剑意。' },
  caozi: { name: '草字剑诀', icon: '🍃', mp: 34, cd: 3, tgt: 'enemy', dmg: 5.0, hits: 9, mag: 1, pierce: 1, st: [{ k: 'bleed', t: 3, v: 0.5, p: 1 }], line: 'jian', desc: '十凶九叶剑草的全本：九片剑叶一片接一片，共 5 倍伤害，无视防御，重创流血；斩在流血的伤口上 ×1.35。包含草字剑诀（残）。' },
  tjy0: { name: '天角蚁·力之篇', icon: '🐜', mp: 22, cd: 3, tgt: 'enemy', dmg: 2.8, el: 'blunt', st: [{ k: 'brk', t: 2, v: 0.25, p: 1 }], line: 'tjy0', desc: '古龙骸骨里一只蒲团上留下的开篇，讲的只有一个字：力。2.8 倍伤害，破甲（防御 -25%）。' },
  tjy: { name: '不灭经', icon: '🐜', mp: 34, cd: 4, tgt: 'enemy', dmg: 3.6, el: 'blunt', pierce: 1, st: [{ k: 'brk', t: 2, v: 0.3, p: 1 }], heal: 0.1, line: 'tjy0', desc: '老天角蚁传下的全本：打不死的身子，打得死人的拳。3.6 倍伤害，无视防御，破甲；自己回 10% 气血。包含天角蚁·力之篇。' },
  fuwen: { name: '符文分身', icon: '👤', mp: 24, cd: 5, tgt: 'self', self: [{ k: 'clone', t: 3 }], desc: '重新长出来的至尊骨里藏着的神通：骨文凝成另一个你。3 回合内，你每一门打单个敌人的宝术，分身都会跟着再打一下（四成威力）。' },
  gu: { name: '蛄之宝术', icon: '🪲', mp: 40, cd: 4, tgt: 'enemy', dmg: 3.4, mag: 1, pierce: 1, st: [{ k: 'weak', t: 2, v: 0.3, p: 1 }], dispel: 1, desc: '蛄祖临走前塞进你脑子里的东西：3.4 倍伤害，无视防御，虚弱；先把敌人身上的护盾、狂怒和增益全啃掉。' },
  qilin: { name: '麒麟宝术', icon: '🦄', mp: 48, cd: 4, tgt: 'enemies', dmg: 3.2, mag: 1, el: 'fire', st: [{ k: 'burn', t: 3, v: 0.5, p: 0.8 }], cleanse: 1, healAll: 0.06, desc: '梦回仙古时那头白麒麟教的：麒麟踏火，全体 3.2 倍伤害，灼烧；麒麟是瑞兽——顺手洗掉自己身上的坏状态，全队回 6% 气血。' },
  zhenlong: { name: '真龙宝术', icon: '🐉', mp: 56, cd: 5, tgt: 'enemies', dmg: 3.6, mag: 1, st: [{ k: 'weak', t: 2, v: 0.35, p: 0.9 }], awe: 1, desc: '跟一位老仙王换来的十凶真龙：龙威压下来，全体 3.6 倍伤害，虚弱；所有正在蓄力的敌人，力气当场散掉。' },
};
Object.assign(SKILLS, BS_NEW);
SKILL_ORDER.splice(0, SKILL_ORDER.length, 'qly', 'sn', 'gw', 'lei', 'dsh', 'jian', 'ta', 'kunpeng', 'zhuque', 'fuwen', 'zhizun', 'lunhui', 'lei4', 'tjy0', 'caozi0', 'wudi', 'leidi', 'zhenhuang', 'liushen', 'tjy', 'daluo', 'gu', 'caozi', 'tahua', 'qilin', 'zhenlong', 'duduan');
Object.assign(STATUS, { swift: { n: '先手', c: '#9ad8ff' }, clone: { n: '分身', c: '#e8d8a0' } });
/* lines: an evolved 宝术 counts as its root wherever the root is asked for (合成, combos, 宝骨 that boost 雷道, the auto-battle) */
const skLine = id => (SKILLS[id] && SKILLS[id].line) || id;
const skOwn = (c, base) => c && c.sk ? (c.sk.includes(base) ? base : c.sk.find(s => skLine(s) === skLine(base) && SKILLS[s].line)) : null;
const skRes = (u, id) => u.sk.includes(id) ? id : u.sk.find(s => skLine(s) === id) || id;
const EVO = [['qly', 'kunpeng'], ['lei', 'lei4'], ['lei4', 'leidi'], ['zhuque', 'zhenhuang'], ['jian', 'caozi0'], ['caozi0', 'caozi'], ['tjy0', 'tjy']];
function evolveSkill(from, to, quiet) { // the new one takes the old one's place, slot and mastery
  const c = C; if (!c.sk.includes(from) || c.sk.includes(to)) { if (!c.sk.includes(to)) learnSkill(to); return; }
  c.sk[c.sk.indexOf(from)] = to; const b = c.bar.indexOf(from); if (b >= 0) c.bar[b] = to; c.prof[to] = Math.max(c.prof[to] || 0, c.prof[from] || 0); c.skEvo = c.skEvo || {}; c.skEvo[to] = from;
  if (!quiet) { const A = SKILLS[from], S = SKILLS[to]; logLine(`<b class="lvup">宝术进化</b>：${A.icon}${A.name} → ${S.icon}<b>${S.name}</b>（熟练度带了过来）——${S.desc}`, 'sys'); sfx('epic'); } }
function bsGain(id, quiet) { const E = EVO.find(([, t]) => t === id); if (E && C.sk.includes(E[0])) return evolveSkill(E[0], id, quiet); if (C.sk.includes(id)) return; if (quiet) { C.sk.push(id); if (C.bar.length < barSlots(C.lv)) C.bar.push(id); C.prof[id] = C.prof[id] || 0; } else learnSkill(id); }

/* ---------- 机缘: one task per 宝术, at the place and time the book gives it ---------- */
const bsSt = id => C.story.f['bs_' + id] || 0;
const bsHas = base => !!skOwn(C, base);
const BSQ = [
  { id: 'kp', n: '鲲鹏巢', sk: 'kunpeng', max: 2, open: () => F_('v2') && bsHas('qly'), by: 'v3', loc: s => s === 0 ? 'xs_hall' : 'bd_bone', hint: s => s === 0 ? '虚神界里，有人知道鲲鹏法的下落。（虚神界）' : '鲲鹏巢在天骨禁区的尽头。（百断山 · 天骨禁区）', done: '青鳞鹰宝术进化成了鲲鹏法。' },
  { id: 'fw', n: '至尊骨里的另一个你', sk: 'fuwen', max: 1, open: () => F_('guBack'), by: 'shihuang', loc: () => 'hg_nirvana', hint: () => '刚长回来的至尊骨里，好像还藏着什么。回涅槃池坐一坐。（火国 · 涅槃池）', done: '学会了符文分身。' },
  { id: 'tj', n: '天角蚁', sk: 'tjy', max: 2, open: () => F_('v4'), by: 'v7end', by0: 'v4end', loc: s => s === 0 ? 'bz_field' : (F_('v7') ? 'xg_forest' : null), hint: s => s === 0 ? '百族战场上躺着一具古龙的骨头，天角蚁族的人总绕着它走。（百族战场）' : F_('v7') ? '仙古古林里，有一只很老很老的天角蚁。（仙古古林）' : '力之篇只是开头。剩下的，要等到了仙古才找得到。', done: '天角蚁·力之篇进化成了不灭经。' },
  { id: 'ld', n: '元天秘境的金纸', sk: 'leidi', max: 2, open: () => F_('gutai') && bsHas('lei'), by: 'v5end', loc: s => s === 0 ? 'sj_desert' : 'sj_wild', hint: s => s === 0 ? '天仙州荒漠底下，压着元天至尊留下的秘境。（天仙州荒漠）' : '第二页金纸不在秘境里——有人看见它飘进了无人区。（无人区）', done: '雷道一路进化成了雷帝宝术。' },
  { id: 'zh', n: '十块青铜书碎片', sk: 'zhenhuang', max: 2, open: () => F_('zuixue') && bsHas('zhuque'), by: 'v6end', loc: s => s === 1 ? 'xs_hall' : null, hint: s => s === 0 ? `在虚神界打赢对手，攒青铜书碎片（${C.story.f.bsShard || 0}/10）。打赢隐世天骄一次给 3 块。` : '十块碎片齐了。去虚神界深处，真凰的传承地开了。（虚神界）', done: '朱雀宝术进化成了真凰宝术。' },
  { id: 'cz', n: '草字剑诀', sk: 'caozi', max: 2, open: () => F_('zuixue') && bsHas('jian'), by: 'v9end', by0: 'v6', loc: s => s === 0 ? 'xs_hall' : (F_('zhizun') ? 'jt_peak' : null), hint: s => s === 0 ? '虚神界里有个补天教的老婆婆，身上藏着一张写着剑诀的兽皮。（虚神界）' : F_('zhizun') ? '下界的至尊殿堂开了，草字剑诀的下半篇在那里。（九天之巅）' : '剑诀只有半篇。另外半篇在下界的至尊殿堂——等你重回至尊。', done: '锈剑的剑意进化成了草字剑诀。' },
  { id: 'gz', n: '蛄祖的礼物', sk: 'gu', max: 1, open: () => F_('daoze'), by: 'yyEnd', loc: () => 'yy_guzu', hint: () => '蛄祖补完了你的道则，又把你叫了回去。（异域 · 蛄祖洞）', done: '学会了蛄之宝术。' },
  { id: 'ql', n: '白麒麟', sk: 'qilin', max: 1, open: () => F_('dlAge'), by: 'v13end', loc: () => 'dl_age', hint: () => '梦回仙古，古战场上走过一头浑身雪白的麒麟。（帝落古战场）', done: '学会了麒麟宝术。' },
  { id: 'zl', n: '换一门真龙', sk: 'zhenlong', max: 1, open: () => F_('xianwar'), by: 'v14end', loc: () => 'xy_city', hint: () => '仙域古城里，一位老仙王说他手里有真龙宝术——要换，拿本事来换。（仙域古城）', done: '学会了真龙宝术。' },
];
function bsDone(q) { return bsSt(q.id) >= q.max; }
/* a jump lands where a player who played well would be: every 机缘 whose time has passed is already taken */
function bsJump(c) { const P = Object.values(c.prof || {}), avg = Math.round(P.reduce((a, b) => a + b, 0) / Math.max(1, P.length) * 0.7), f = c.story.f, has = base => c.sk.includes(base) || c.sk.some(s => skLine(s) === base && SKILLS[s].line);
  const C0 = C; C = c; try { for (const q of BSQ) { if (!f[q.by0 || q.by] && !f[q.by]) continue; const steps = { kp: [[1, 'kunpeng']], fw: [[1, 'fuwen']], tj: [[1, 'tjy0'], [2, 'tjy']], ld: [[1, 'lei4'], [2, 'leidi']], zh: [[2, 'zhenhuang']], cz: [[1, 'caozi0'], [2, 'caozi']], gz: [[1, 'gu']], ql: [[1, 'qilin']], zl: [[1, 'zhenlong']] }[q.id];
      const need = { kp: 'qly', ld: 'lei', zh: 'zhuque', cz: 'jian' }[q.id]; if (need && !has(need)) continue;
      for (const [s, id] of steps) { if (s > 1 && !f[q.by]) break; if (s === 1 && q.by0 && !f[q.by0]) break; bsGain(id, true); f['bs_' + q.id] = s; if (!c.prof[id]) c.prof[id] = avg; } if (q.id === 'zh' && f.bs_zh) f.bsShard = 10; } } finally { C = C0; } }

/* 虚神界: each win is a 青铜书碎片 once the 真凰 task is open (隐世天骄 give 3) */
function bsArenaWin(n = 1) { const q = BSQ[4]; if (!q.open() || bsSt('zh') >= 1) return; const f = C.story.f; f.bsShard = Math.min(10, (f.bsShard || 0) + n); logLine(`虚神界掉下 <b>${n} 块青铜书碎片</b>（${f.bsShard}/10）。`, 'loot');
  if (f.bsShard >= 10) { f.bs_zh = 1; logLine('十块青铜书碎片齐了——虚神界深处，有一道门开了。（再进一次 <b>虚神界</b>）', 'sys'); } }

/* ---------- foes use the same 宝术 ---------- */
Object.assign(MOBS, {
  kpcan: { name: '鲲鹏残念', lv: 24, boss: 1, mul: { hp: 4.2, atk: 1.35, def: 1.3, spd: 1.2 }, sk: [{ n: '鲲鹏法', dmg: 1.15, w: 3, st: { k: 'bleed', t: 2, v: 0.25, p: 0.4 } }, { n: '吞天', dmg: 0.85, aoe: 1, w: 2 }, { n: '扶摇九万里', dmg: 2.2, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '残念张开了翅膀，整个巢都被它带着飞了起来！', d: '鲲鹏死后留在巢里的一口气。十凶之一，死了也还能吞天。' },
  longao: { name: '龙獒骸骨', lv: 42, boss: 1, weak: { lei: 1 }, mul: { hp: 5.4, atk: 1.55, def: 1.6 }, sk: [{ n: '骨爪', dmg: 1.2, w: 3 }, { n: '雷道四绝天', dmg: 0.9, aoe: 1, mag: 1, el: 'lei', st: { k: 'stun', t: 1, p: 0.15 }, w: 2 }, { n: '獒吼', dmg: 2.2, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '骸骨的肋骨缝里，金纸亮了起来——它在用纸上的雷！', d: '元天秘境里的一副骸骨，脑袋像獒，身子像龙，肋骨里夹着雷帝宝术的第一页。' },
  zhyy: { name: '真凰虚影', lv: 46, boss: 1, weak: { lei: 1 }, mul: { hp: 5.1, atk: 1.5, def: 1.45, spd: 1.1 }, sk: [{ n: '真凰宝术', dmg: 0.9, aoe: 1, mag: 1, el: 'fire', st: { k: 'burn', t: 3, v: 0.3, p: 0.45 }, w: 3 }, { n: '凰啄', dmg: 1.3, w: 2 }, { n: '浴火', healAlly: 0.08, w: 1 }, { n: '焚天', dmg: 2.2, aoe: 1, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '真凰虚影烧成了一团白火！', d: '虚神界深处，真凰传承地的守关者。朱雀只是它掉下来的一根羽毛。' },
});
const MOB_BS = [['eagle', 1, 'qly'], ['suanni', 1, 'sn'], ['leishou', 1, 'lei'], ['leiyun', 0, 'lei'], ['ape', 0, 'lei'], ['tianjiao', 0, 'tjy0'], ['ningchuan', 2, 'qilin'], ['kundi', 0, 'kunpeng'], ['butianjiao', 0, 'caozi0'], ['kpcan', 0, 'kunpeng'], ['longao', 1, 'lei4'], ['zhyy', 0, 'zhenhuang']];
for (const [m, i, bs] of MOB_BS) { const s = MOBS[m] && MOBS[m].sk[i], S = SKILLS[bs]; if (!s) continue; s.n = S.name; s.bs = bs; if (!s.el && S.el) s.el = S.el; if (!s.st && S.st) s.st = Object.assign({}, S.st[0], { p: (S.st[0].p ?? 1) * 0.6 }); }
const mobBs = id => MOBS[id] ? [...new Set(MOBS[id].sk.filter(s => s.bs).map(s => s.bs))] : [];

/* ---------- 原著搭配: how 石昊 fought at each stage of the book ---------- */
const BS_SETS = [
  { n: '石村 · 小不点', f: null, sk: ['qly', 'sn', 'gw'] },
  { n: '补天阁 · 百断山', f: 'butian', sk: ['qly', 'sn', 'lei', 'dsh', 'jian', 'gw'] },
  { n: '石国 · 双石之战', f: 'v2', sk: ['kunpeng', 'sn', 'lei', 'zhuque', 'jian', 'ta'] },
  { n: '石皇 · 斩七神', f: 'guBack', sk: ['zhizun', 'lunhui', 'fuwen', 'kunpeng', 'zhuque', 'lei', 'ta'] },
  { n: '上界 · 至尊古台', f: 'zuixue', sk: ['leidi', 'kunpeng', 'zhizun', 'wudi', 'zhenhuang', 'tjy0', 'fuwen', 'lunhui'] },
  { n: '争霸 · 仙古', f: 'v6', sk: ['daluo', 'liushen', 'leidi', 'kunpeng', 'tjy', 'zhenhuang', 'lunhui', 'zhizun'] },
  { n: '帝关 · 异域', f: 'v8', sk: ['gu', 'daluo', 'leidi', 'kunpeng', 'liushen', 'tjy', 'caozi', 'zhenhuang'] },
  { n: '帝落 · 仙域', f: 'v12', sk: ['caozi', 'qilin', 'leidi', 'kunpeng', 'daluo', 'liushen', 'gu', 'tjy'] },
  { n: '独断万古', f: 'v13end', sk: ['duduan', 'tahua', 'zhenlong', 'qilin', 'kunpeng', 'leidi', 'caozi', 'daluo'] },
];
function bsPreset(i) { const P = BS_SETS[i]; if (!P) return; const own = P.sk.map(id => skOwn(C, id)).filter(Boolean); if (!own.length) { toast('这一套里的宝术你还一门都没有'); return; }
  C.bar = [...new Set(own)].slice(0, barSlots(C.lv)); C.bar.sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b)); save(); refresh(); toast(`宝术栏换成了「${P.n}」的搭配（${C.bar.length} 门）`); }

/* ---------- the 宝术谱 page ---------- */
const BS_BOOK = [
  ['下界 · 石村', ['qly', 'sn', 'gw']], ['下界 · 补天阁 · 百断山', ['lei', 'dsh', 'jian', 'ta']], ['下界 · 石国 · 火国', ['kunpeng', 'zhuque', 'zhizun', 'fuwen', 'lunhui']],
  ['百族战场 · 上界', ['tjy0', 'lei4', 'leidi', 'wudi', 'zhenhuang', 'caozi0']], ['三千州 · 仙古', ['liushen', 'daluo', 'tjy']], ['帝关 · 异域', ['gu']], ['九天 · 帝落 · 仙域', ['caozi', 'qilin', 'tahua', 'zhenlong', 'duduan']],
];
function evoAfter(id) { const out = []; for (let x = id, e; (e = EVO.find(([a]) => a === x)); x = e[1]) out.push(e[1]); return out; }
function bsWhere(id) { const q = BSQ.find(q => q.sk === id || ({ lei4: 'ld', tjy0: 'tj', caozi0: 'cz' })[id] === q.id); return q; }
function bsHtml() { if (!C.sk.length) return ''; const evoTo = {}; for (const [a, b] of EVO) evoTo[a] = b;
  const row = id => { const S = SKILLS[id], own = C.sk.includes(id), absorbed = !own && evoAfter(id).some(x => C.sk.includes(x)), q = bsWhere(id);
    const st = own ? '<span class="pill gold">已领悟</span>' : absorbed ? '<span class="pill">已进化</span>' : '<span class="pill">未得</span>';
    const nx = evoTo[id] ? `<span class="dim"> → ${SKILLS[evoTo[id]].icon}${SKILLS[evoTo[id]].name}</span>` : '';
    const how = own || absorbed ? '' : q && q.open() ? `<small class="warn">机缘：${q.hint(bsSt(q.id))}</small>` : q ? '<small class="dim">时候还没到。</small>' : '<small class="dim">跟着主线走，会遇到的。</small>';
    const foes = Object.keys(MOBS).filter(m => mobBs(m).includes(id) && C.codex && C.codex[m]).map(m => MOBS[m].name);
    return `<div class="li ${own ? 'on' : ''}" style="${own || absorbed ? '' : 'opacity:.78'}"><span class="ic">${own || absorbed || (q && q.open()) ? S.icon : '❔'}</span><div class="t"><b>${own || absorbed || (q && q.open()) ? S.name : '？？？'}</b> ${st}${nx}${own || absorbed ? `<small>${S.desc}</small>` : ''}${how}${foes.length ? `<small class="dim">用过它的对手：${foes.join('、')}</small>` : ''}</div></div>`; };
  const sets = BS_SETS.filter(P => !P.f || F_(P.f)).map((P, i) => { const k = BS_SETS.indexOf(P), n = P.sk.filter(id => skOwn(C, id)).length; return `<button class="sb" onclick="bsPreset(${k})" title="${P.sk.map(id => SKILLS[id].name).join('、')}">${P.n} <span class="dim">${n}/${P.sk.length}</span></button>`; }).join('');
  return `<div class="card"><h3>宝术谱 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">原著里石昊一路学过的宝术 · 有的会进化，旧的被新的包含（熟练度带过去）</span></h3>
    <h4 style="margin:4px 0">原著搭配 <span class="dim" style="font-size:.78rem">点一下，宝术栏换成那时候石昊的打法（只放你已经有的）；也可以在上面自己点选</span></h4><div class="dts">${sets}</div>
    <details style="margin-top:8px" ${UI.bsOpen ? 'open' : ''} ontoggle="UI.bsOpen=this.open"><summary style="cursor:pointer;color:var(--gold2)">全部宝术（领悟 ${BS_BOOK.flatMap(x => x[1]).filter(id => C.sk.includes(id) || evoAfter(id).some(x => C.sk.includes(x))).length}/${BS_BOOK.flatMap(x => x[1]).length}）· 来历、进化、机缘</summary>${BS_BOOK.map(([t, L]) => `<h4 style="margin:10px 0 2px;color:var(--gold2)">${t}</h4><div class="list">${L.map(row).join('')}</div>`).join('')}</details></div>`; }

/* ---------- what makes each new 宝术 its own (called from perform in 30_battle.js) ---------- */
const BS_FX = { zhenhuang: 'fire', qilin: 'fire', gu: 'curse', zhenlong: 'roar', fuwen: 'bless', tjy0: 'rock', tjy: 'rock' };
function bsAfter(B, u, S, foes, allies, L) {
  if (S.heal) { const v = Math.round(u.hpMax * S.heal); u.hp = Math.min(u.hpMax, u.hp + v); fxe(B, { k: 'heal', t: u.id, v, hp: hpr(u) }); L(`${uName(u)} 打不死的身子又长好了一截 <span class="heal">+${v}</span>`); }
  if (S.cleanse) { const n0 = u.st.length; u.st = u.st.filter(s => !['stun', 'bleed', 'burn', 'poison', 'weak', 'brk', 'freeze', 'dark', 'bound', 'mark'].includes(s.k)); if (u.st.length < n0) L(`${uName(u)} 身上的坏状态被麒麟火烧干净了`); }
  if (S.healAll) for (const t of allies) { if (!t.alive) continue; const v = Math.round(t.hpMax * S.healAll * (t.pet ? 0.55 : 1)); t.hp = Math.min(t.hpMax, t.hp + v); fxe(B, { k: 'heal', t: t.id, v, hp: hpr(t) }); }
  if (S.awe) { let n = 0; for (const f of foes) if (tryInterrupt(B, f)) n++; if (n) L(`<span class="weak">龙威压下来，${n} 个正在蓄力的敌人力气全散了！</span>`); }
}
/* the auto-battle knows the new 宝术 too: 分身 before a big single-target round, 真龙 on a charge, otherwise the strongest it can afford */
function bsBot(B, u, a) { const foes = alive(B, 1 - u.side); if (!foes.length || a.item || a.swap || a.flee) return a;
  const can = id => u.sk.includes(id) && !(u.cd[id] > 0) && u.mp >= SKILLS[id].mp, boss = foes.find(f => f.boss);
  if (can('zhenlong') && foes.some(f => f.plan === 'charge' || f.releasing)) return { sk: 'zhenlong' };
  if (can('gu') && boss && boss.st.some(s => ['shield', 'rage', 'atk'].includes(s.k))) return { sk: 'gu', tgt: boss.id };
  if (can('fuwen') && !stOf(u, 'clone') && (boss || foes.length === 1) && u.mp >= SKILLS.fuwen.mp + 20) return { sk: 'fuwen' };
  if (can('qilin') && (u.st.some(s => ['stun', 'burn', 'poison', 'weak', 'bleed'].includes(s.k)) || foes.length >= 2)) return { sk: 'qilin' };
  if (a.sk === 'atk' || a.sk === 'guard' && u.mp > u.mpMax * 0.3) { const main = boss || foes.slice().sort((x, y) => x.hp - y.hp)[0];
    const best = u.sk.filter(id => id !== 'atk' && id !== 'guard' && SKILLS[id].dmg && can(id)).sort((x, y) => SKILLS[y].dmg * (SKILLS[y].tgt === 'enemies' ? Math.min(foes.length, 3) * 0.7 : 1) - SKILLS[x].dmg * (SKILLS[x].tgt === 'enemies' ? Math.min(foes.length, 3) * 0.7 : 1))[0];
    if (best && BS_NEW[best]) return { sk: best, tgt: main.id }; }
  return a; }
