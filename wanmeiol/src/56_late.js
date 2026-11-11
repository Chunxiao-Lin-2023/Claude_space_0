/* ================= the late game: 悟道, 炼器, 隐世天骄, the partners' third form and three new partners, late fused 宝术,
   the 天庭 you can build up, 轮回 (a second life), and the 前情提要 =================
   悟道  past 40 层, experience you cannot use (a level gate, or the cap) turns into 悟道点: one per quarter of a level.
         Spend them on the 石昊 page: 气血 / 攻击 / 防御 +1% each (20 at most), or +20 熟练度 to a 宝术 on your bar.
   炼器  after 第六卷, a 宝骨 can be forged up to +5: each level +20% of what it gives (+10% for the special ones).
         Costs 灵石 and 兽骨; +4 and +5 can fail (the 灵石 are gone, the 兽骨 are not). 天庭's 炼器坊 makes it cheaper and surer.
   隐世天骄  after 第六卷, six people who never stood on the 虚神界 list can be challenged (once a day each); the first win
         gives a 宝骨 of their own. All six → the title 隐世无双.
   真身  a partner that has 返祖 and is 70 级 with full affection takes its true form: +15% again. Partners now grow to 85.
   天庭  after it is founded: 药园 / 炼器坊 / 演武场 / 城墙, three levels each.
   轮回  after the end, at 上苍之上: start again from 石村 with your titles, 图鉴, records, 悟道, 宝骨 (and their forging);
         foes are stronger each time (气血 +30%, 攻击 +20% per life), experience +25% per life. */

/* ---------- 悟道 ---------- */
const DAO_MAX = 20;
const DAO_OPTS = [{ k: 'hp', n: '气血', i: '❤️' }, { k: 'atk', n: '攻击', i: '⚔️' }, { k: 'def', n: '防御', i: '🛡️' }];
function daoGain(over) { if (!C || over <= 0 || C.lv < 40) return; C.daoX = (C.daoX || 0) + over; const per = Math.max(1, Math.round(BAL.expNext(C.lv) * 0.25)); let n = 0; while (C.daoX >= per) { C.daoX -= per; n++; }
  if (n) { C.dao = (C.dao || 0) + n; logLine(`用不上的经验化成了<b class="lvup">悟道点 +${n}</b>（现有 ${C.dao}）——在「石昊」页的「悟道」里用。`, 'sys'); } }
function capExp() { const need = BAL.expNext(C.lv); if (C.exp > need) daoGain(C.exp - need); C.exp = need; }
function daoSpend(k) { if (NETROLE === 'guest' || STATE.battle) return; if (!(C.dao > 0)) { toast('没有悟道点'); return; } C.daoP = C.daoP || {};
  if (k === 'prof') { const L = C.bar.filter(id => profLevel(id) < PROF_MAX).sort((a, b) => ((C.prof || {})[a] || 0) - ((C.prof || {})[b] || 0)); if (!L.length) { toast('带着的宝术都圆满了'); return; } const id = L[0]; for (let i = 0; i < 20; i++) profUse(id); logLine(`悟道：${SKILLS[id].icon}${SKILLS[id].name} 熟练度 +20`, 'sys'); }
  else { if ((C.daoP[k] || 0) >= DAO_MAX) { toast('这一项已经悟到头了'); return; } C.daoP[k] = (C.daoP[k] || 0) + 1; }
  C.dao--; fixHp(); sfx('magic'); save(); refresh(); }
function daoHtml() { if (C.lv < 40 && !C.dao) return ''; const P = C.daoP || {};
  return `<div class="card"><h3>悟道 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">40 层以后，用不上的经验（卡在境界关口、或者到顶了）会化成悟道点</span></h3>
    <div class="row" style="flex-wrap:wrap;gap:6px"><span>悟道点 <b class="pw" style="font-size:1.1rem">${C.dao || 0}</b></span><span class="dim" style="font-size:.8rem">（下一点还差 ${fmt(Math.max(0, Math.round(BAL.expNext(C.lv) * 0.25) - Math.round(C.daoX || 0)))} 经验）</span></div>
    <div class="dts" style="margin-top:6px">${DAO_OPTS.map(o => `<button class="sb" ${C.dao > 0 && (P[o.k] || 0) < DAO_MAX ? '' : 'disabled'} onclick="daoSpend('${o.k}')">${o.i} ${o.n} +1%（${P[o.k] || 0}/${DAO_MAX}）</button>`).join('')}<button class="sb" ${C.dao > 0 ? '' : 'disabled'} onclick="daoSpend('prof')" title="给宝术栏里熟练度最低、还没圆满的那一门">📿 宝术熟练 +20</button></div></div>`; }

/* ---------- 炼器 ---------- */
const FORGE_MAX = 5;
const forgeLv = (id, c = C) => (c && c.forge && c.forge[id]) || 0;
function relicB(id, c = C) { const R = RELICS[id]; if (!R || !R.b) return null; const m = 1 + 0.2 * forgeLv(id, c); if (m === 1) return R.b; const o = {}; for (const k in R.b) o[k] = R.b[k] * m; return o; }
const forgeOpen = () => !!(C && C.story.f.v6end);
function forgeCost(id) { const l = forgeLv(id), cut = 1 - 0.1 * ttLv('lu'); return { money: Math.round((l + 1) * (80 + C.lv * 14) * cut), bone: 3 * (l + 1), yao: l >= 3 ? 1 : 0, ok: l < 3 ? 1 : Math.min(1, (l === 3 ? 0.7 : 0.5) + 0.1 * ttLv('lu')) }; }
async function forgeRelic(id) {
  if (NETROLE === 'guest' || STATE.scene || STATE.battle || !(C.relics || {})[id] || !forgeOpen()) return; const l = forgeLv(id); if (l >= FORGE_MAX) { toast('已经炼到 +5 了'); return; }
  const k = forgeCost(id); if ((C.money || 0) < k.money || itemN('bone') < k.bone || itemN('baoyao') < k.yao) { toast(`需要 💎${k.money} 灵石、兽骨×${k.bone}${k.yao ? '、宝药×1' : ''}`); return; }
  C.money -= k.money; if (k.yao) takeItem('baoyao', 1); const R = RELICS[id];
  if (Math.random() < k.ok) { takeItem('bone', k.bone); C.forge = C.forge || {}; C.forge[id] = l + 1; fixHp(); sfx('epic'); logLine(`<b class="lvup">炼器</b>：${R.i}<b>${R.n}</b> 炼到了 <b>+${l + 1}</b>（效果 ×${(1 + 0.2 * (l + 1)).toFixed(1)}）。`, 'sys'); bigFlash(`${R.n} +${l + 1}`, 'relic'); }
  else { sfx('fail'); logLine(`炼器：火候差了一点，${R.n} 上的纹路散了回去。灵石烧掉了，兽骨还在。<span class="dim">（成功率 ${Math.round(k.ok * 100)}%）</span>`, 'sys'); }
  save(); refresh(); }
function forgeBtn(id) { if (!forgeOpen()) return ''; const l = forgeLv(id); if (l >= FORGE_MAX) return `<span class="pill gold">+${l}</span>`; const k = forgeCost(id);
  return `<button class="sb" style="min-height:30px" title="💎${k.money} 灵石 · 兽骨×${k.bone}${k.yao ? ' · 宝药×1' : ''} · 成功率 ${Math.round(k.ok * 100)}%" onclick="event.stopPropagation();forgeRelic('${id}')">🔥炼${l ? ' +' + l : ''}</button>`; }

/* ---------- 隐世天骄 (虚神界) ---------- */
const HIDDEN = [
  { id: 'shiguan', n: '十冠王', icon: '🌳', lv: 58, sk: ['wudi', 'zhizun', 'lunhui', 'ta'], relic: 'r_shiguan', intro: '光幕边上坐着一个人，身后有一棵金色大树的影子。他从来不上榜——他说，榜太矮了。', win: '他看了看自己的手，笑了：“……这一回，榜可以高一点了。”' },
  { id: 'zhexian', n: '谪仙', icon: '🕊️', lv: 56, sk: ['zhuque', 'lei', 'jian', 'zhizun'], relic: 'r_zhexian', intro: '一个白衣人站在光幕最高处，脚不沾地，看谁都像隔着一层云。', win: '他第一次落了地，踩了踩脚下：“……原来地上是这种感觉。”' },
  { id: 'tianzi', n: '天子', icon: '👑', lv: 57, sk: ['zhizun', 'sn', 'lei', 'ta'], relic: 'r_tianzi', intro: '他的名字就叫天子。他说这不是狂，是生下来就有的名字。', win: '他沉默了很久：“……名字，是该换一个了。”' },
  { id: 'changgong', n: '长弓衍', icon: '🏹', lv: 55, sk: ['qly', 'jian', 'lei', 'gw'], relic: 'r_changgong', intro: '你还没看见人，先看见了一支箭。箭停在你眉心前一寸，箭尾上挂着一张帖子：请战。', win: '他把弓背回身后：“你躲开了九箭。没有人躲开过第十箭——下回，我射第十箭。”' },
  { id: 'gujian', n: '孤剑云', icon: '⚔️', lv: 54, sk: ['jian', 'dsh', 'qly', 'wudi'], relic: 'r_gujian', intro: '争霸台上替你守过两百场的那个人。他抱着剑：“那一次，我欠你一场。”', win: '他收了剑：“……两清了。”他走了两步，又回头：“下回，不两清。”' },
  { id: 'longnv', n: '龙女', icon: '🐉', lv: 56, sk: ['zhuque', 'lei', 'gw', 'lunhui'], relic: 'r_longnv', intro: '一个头上长着小角的姑娘拦住了你：“听说你在下界吃过真龙的肉？”', win: '她揉了揉被打红的手：“……吃过就吃过吧。下回请我吃。”' },
];
const hiddenOpen = () => !!(C && C.story.f.v6end);
const hiddenLv = H => Math.max(H.lv, C.lv + 2);
function hiddenHtml() { if (!hiddenOpen()) return ''; C.hidden = C.hidden || {}; const d = gameDay();
  return `<h4 style="margin:12px 0 4px;color:var(--gold2)">隐世天骄 <span class="dim" style="font-size:.78rem;font-family:var(--ff)">不上榜的人 · 每人每天一次 · 第一次赢有他们的宝骨</span></h4><div class="list">${HIDDEN.map(H => { const s = C.hidden[H.id] || {}, done = s.day === d;
    return `<div class="li"><span class="ic">${H.icon}</span><div class="t"><b>${H.n}</b>${s.win ? ' <span class="pill gold">赢过</span>' : ''}<small>${realmOf(hiddenLv(H)).name}${hiddenLv(H)}层 · ${H.sk.map(k => SKILLS[k].icon).join('')}</small></div><div class="acts"><button class="sb pri" ${done ? 'disabled' : ''} onclick="hiddenFight('${H.id}')">${done ? '明天再来' : '挑战'}</button></div></div>`; }).join('')}</div>`; }
async function hiddenFight(id) { const H = HIDDEN.find(x => x.id === id); if (!H || NETROLE === 'guest' || STATE.scene || STATE.battle) return; C.hidden = C.hidden || {}; const s = C.hidden[id] = C.hidden[id] || {}; if (s.day === gameDay()) return;
  closeModal(); s.day = gameDay(); fullHeal();
  await runScene(async () => { await nar(H.intro);
    const r = await startBattle({ rivals: [{ name: H.n, lv: hiddenLv(H), gear: 1.42, sk: H.sk, icon: H.icon, boss: 1 }], title: `隐世天骄 · ${H.n}`, noLose: true, flee: true });
    if (r && r.win) { await nar(H.win); if (!s.win) { s.win = 1; gainRelic(H.relic); give('baoyao', 3); gainExp(BAL.expNext(C.lv) * 0.6); } else { gainMoney(C.lv * 12, '隐世天骄留下的'); gainExp(BAL.expNext(C.lv) * 0.15); } }
    else await nar(`${H.n}没有追你。“明天再来。”`); }, { title: '隐世天骄 · ' + H.n }); fullHeal(); save(); refresh(); }
Object.assign(RELICS, {
  r_shiguan: { n: '世界树叶', i: '🌳', d: '气血 +10%，防御 +10%。', b: { hpP: 0.1, defP: 0.1 } },
  r_zhexian: { n: '谪仙羽', i: '🪶', d: '身法 +8，暴击 +5%。', b: { spd: 8, crit: 0.05 } },
  r_tianzi: { n: '天子印', i: '🔱', d: '攻击 +12%。', b: { atkP: 0.12 } },
  r_changgong: { n: '第十支箭', i: '🏹', d: '第一回合必定先出手，攻击 +20%。', sp: { first: 0.2 } },
  r_gujian: { n: '孤剑剑穗', i: '🎐', d: '暴击 +6%，攻击 +6%。', b: { crit: 0.06, atkP: 0.06 } },
  r_longnv: { n: '龙女的鳞', i: '🐉', d: '符力 +15%，造成伤害的 4% 回复气血。', b: { mpP: 0.15, leech: 0.04 } },
});

/* ---------- partners: grow to 85, 真身, and three new ones ---------- */
Object.assign(PETS, {
  yumiao: { name: '鱼苗', race: '界海里的小鱼', role: '吞噬 · 控制', icon: '🐟', desc: '从界海一片枯叶的水洼里捞上来的小鱼，只有手指长。它不怕黑——它在黑里长大，吃的就是黑。', mul: { hp: 0.75, atk: 0.85, def: 0.75, spd: 1.3 },
    sk: [{ n: '小口一咬', cat: 'atk', dmg: 1.1, w: 3, d: '游过去咬一口，比看上去疼。' },
      { n: '吐泡泡', cat: 'def', shieldHero: 1.1, w: 1, d: '吐出一个大泡泡，把石昊裹在里面（护盾）。' },
      { n: '摆尾', cat: 'buff', buffHero: { k: 'dodge', t: 2, v: 0.25 }, w: 1, aff: 25, d: '在石昊脚边摆尾巴搅水，两回合内他更难被打中。' },
      { n: '吞光', cat: 'debuff', dmg: 0.6, mag: 1, st: { k: 'weak', t: 2, v: 0.3, p: 1 }, w: 1, aff: 50, d: '把敌人身上的光吞掉一口：攻击 -30%，两回合。' },
      { n: '漩涡', cat: 'atk', dmg: 0.9, aoe: 1, st: { k: 'stun', t: 1, p: 0.25 }, w: 1, aff: 75, d: '绕着敌人游一圈，转出一个漩涡，全体伤害，可能转晕。' },
      { n: '吞海', cat: 'atk', dmg: 1.5, aoe: 1, mag: 1, st: { k: 'weak', t: 2, v: 0.25, p: 0.7 }, w: 2, evo: 1, d: '觉醒后：张嘴把一片海吞进去，全体重伤并虚弱。' }] },
  bazhen: { name: '八珍', race: '八珍麒', role: '治疗 · 护盾', icon: '🦄', desc: '三千州草丛里那头分你半块干饼的小麒麟。毛是八种颜色的，脾气是一种颜色的：犟。', mul: { hp: 0.9, atk: 0.65, def: 0.95, spd: 1.05 },
    sk: [{ n: '顶角', cat: 'atk', dmg: 1, w: 3, d: '低头一顶。' },
      { n: '八色灵光', cat: 'def', healAlly: 0.24, w: 2, d: '给伤得最重的同伴回 24% 气血。' },
      { n: '瑞气', cat: 'buff', buffHero: { k: 'atk', t: 2, v: 0.22 }, w: 1, aff: 25, d: '身上的八色光落在石昊身上，两回合内攻击 +22%。' },
      { n: '踏云', cat: 'debuff', dmg: 0.5, st: { k: 'brk', t: 2, v: 0.3, p: 1 }, w: 1, aff: 50, d: '踩着云从敌人头上踏过去，破甲：防御 -30%。' },
      { n: '八珍屏障', cat: 'def', shieldAll: 1.1, w: 1, aff: 75, d: '八种颜色的光圈住全队，一层护盾。' },
      { n: '麒麟踏', cat: 'atk', dmg: 1.2, aoe: 1, el: 'blunt', st: { k: 'stun', t: 1, p: 0.3 }, w: 2, evo: 1, d: '觉醒后：四蹄落地，全体重击，可能踏晕。' }] },
  jiutou: { name: '九头', race: '九头狮子幼崽', role: '群攻 · 威慑', icon: '🦁', desc: '风族山崖下捡到的小狮子，九个脑袋，八个在睡觉，醒着的那个在吵架。', mul: { hp: 0.9, atk: 0.95, def: 0.85, spd: 1 },
    sk: [{ n: '九口齐咬', cat: 'atk', dmg: 0.45, hits: 3, w: 3, d: '醒着的几个脑袋一起咬。' },
      { n: '狮吼', cat: 'def', taunt: 2, guard: 1, w: 1, d: '九个脑袋一起吼，两回合内敌人都冲它来，这回合它受伤减半。' },
      { n: '鬃毛竖起', cat: 'buff', buffHero: { k: 'atk', t: 2, v: 0.25 }, w: 1, aff: 25, d: '鬃毛一竖，石昊两回合内攻击 +25%。' },
      { n: '震魂吼', cat: 'debuff', dmg: 0.5, aoe: 1, st: { k: 'weak', t: 2, v: 0.25, p: 0.9 }, w: 1, aff: 50, d: '一声把全体吼得发虚：攻击 -25%。' },
      { n: '扑杀', cat: 'atk', dmg: 2.4, w: 1, aff: 75, d: '九个脑袋都醒了，扑上去单体重击。' },
      { n: '九首焚天', cat: 'atk', dmg: 1.45, aoe: 1, el: 'fire', st: { k: 'burn', t: 3, v: 0.3, p: 0.8 }, w: 2, evo: 1, d: '觉醒后：九张嘴同时喷火，全体重伤并灼烧。' }] },
});
Object.assign(EVO_TEXT, {
  yumiao: ['鱼苗在你掌心的水洼里转圈，越转越快，水洼里的水黑了，又清了。', '它跳起来的时候，影子落在地上——是一条很长很长的鱼。'],
  bazhen: ['八珍站在草坡上，八种颜色的毛一根一根亮起来，像一道站着的彩虹。', '它冲你打了个响鼻，意思是：还要半块饼。'],
  jiutou: ['九头的九个脑袋，第一次同时醒着。它们没吵架。', '它们一起抬头，冲着天吼了一声——九天的云，散了。'],
});
Object.assign(EVO2_TEXT, { yumiao: '鱼苗游进了界海，又游了回来。它嘴里叼着一片很小的、发光的枯叶——一个死掉的世界里，最后一点亮。它把亮吞了下去。', bazhen: '八珍在天庭的柱子底下卧了三天。第四天早上，柱子底下长出了一圈八种颜色的灵草。', jiutou: '九头的九个脑袋排成一排，冲着风族的山崖吼。山崖上的风，往回吹了一下，又往前吹了。' });
const EVO3_TEXT = { maoqiu: '毛球站在你肩上，伸了个懒腰——它投下的影子盖住了整座山。那是朱厌的真身。', dahong: '大红飞上九天，再落下来的时候，翅膀一展，遮住了半个天庭的太阳。', ertuzi: '二秃子头顶那根毛亮成了五种颜色，一圈一圈的光落下来，像下了一场彩色的雨。……毛还是只有一根。', yumiao: '鱼苗跃出水面，身子在半空里一直长，一直长——落回去的时候，是一条能吞下一片枯叶世界的大鱼。它游回你身边，又缩成了手指长。', bazhen: '八珍站在天庭的柱子顶上，八种颜色合成了一种——白。白得像造化之门里的光。', jiutou: '九头的九个脑袋同时闭上眼睛，又同时睁开。它们第一次说了同一句话：吼。' };
Object.assign(PET_SAY, {
  yumiao: { act: ['（鱼苗在空气里游了一圈，好像那里也有水。）'], heroCrit: ['（鱼苗吐了一串泡泡，泡泡排成了一个“好”字……大概。）'], heroLow: ['（鱼苗游到你嘴边，吐了一个泡泡：吸一口。）'], kill: ['（鱼苗把敌人掉下来的光吞了，打了个嗝。）'] },
  bazhen: { act: ['（八珍打了个响鼻，八种颜色的毛都炸了起来。）'], heroCrit: ['（八珍用角拱了拱你：再来一个。）'], heroLow: ['（八珍挤到你身前，八种颜色的光一下子全亮了。）'], kill: ['（八珍嚼了嚼地上的草，又吐了：不好吃。）'] },
  jiutou: { act: ['（九头的三个脑袋在吵先咬谁，另外六个已经咬上去了。）'], heroCrit: ['（九个脑袋一起吼了一声，吵得你耳朵嗡嗡响。）'], heroLow: ['（九头八个脑袋挡在你前面，第九个回头舔了舔你的脸。）'], kill: ['（九头九个脑袋抢一块骨头，最后谁也没抢到。）'] },
});
function petEvo3Check(id) { const p = C.pets[id]; if (!p || p.evo3 || !p.evo2 || p.aff < 100 || petLv(id) < 70 || NETROLE === 'guest') return; p.evo3 = 1;
  setTimeout(() => runScene(async () => { await nar(EVO3_TEXT[id] || `${PETS[id].name}身上的血脉，醒到了最深处。`); logLine(`<b class="lvup">真身</b>：${PETS[id].icon}<b>${PETS[id].name}</b> 全身属性再 +15%。`, 'sys'); sfx('epic'); bigFlash(PETS[id].name + ' · 真身', 'relic'); }, { title: PETS[id].name + '真身' }), 700); }

/* ---------- late fused 宝术 ---------- */
const FUSED2 = {
  f_liulun: { name: '柳神轮回', icon: '🍃', mp: 54, cd: 5, tgt: 'enemies', dmg: 3.0, mag: 1, pierce: 1, st: [{ k: 'stun', t: 1, p: 0.5 }, { k: 'bound', t: 1, p: 0.4 }], self: [{ k: 'shield', t: 2, v: 1 }], desc: '柳枝抽下去的那一刻，轮回也转了一圈：全体 3 倍伤害，无视防御，可能眩晕、缠住；自己得到护盾。', fuse: ['liushen', 'lunhui'] },
  f_daolei: { name: '大罗雷劫', icon: '🌩️', mp: 52, cd: 4, tgt: 'enemy', dmg: 6.2, pierce: 1, el: 'lei', st: [{ k: 'stun', t: 1, p: 0.5 }, { k: 'bleed', t: 3, v: 0.5, p: 1 }], desc: '剑胎上缠满了雷：6.2 倍伤害，无视防御，一半概率眩晕，重创流血。', fuse: ['daluo', 'lei'] },
  f_tazhi: { name: '他化至尊', icon: '🌟', mp: 58, cd: 5, tgt: 'enemies', dmg: 1.5, hits: 3, mag: 1, pierce: 1, st: [{ k: 'weak', t: 2, v: 0.35, p: 0.8 }], self: [{ k: 'shield', t: 2, v: 0.8 }], desc: '化出来的每一个你，胸口都亮着至尊骨：全体连打三下，共 4.5 倍伤害，无视防御，虚弱；自己得到护盾。', fuse: ['tahua', 'zhizun'] },
  f_wuluo: { name: '无敌剑胎', icon: '⚔️', mp: 56, cd: 4, tgt: 'enemy', dmg: 6.8, pierce: 1, el: 'blunt', st: [{ k: 'brk', t: 2, v: 0.35, p: 1 }, { k: 'bleed', t: 3, v: 0.5, p: 1 }], desc: '这一剑只往前，不回头：6.8 倍伤害，无视防御，破甲，重创流血。', fuse: ['wudi', 'daluo'] },
};
Object.assign(FUSED, FUSED2); Object.assign(SKILLS, FUSED2); SKILL_ORDER.push(...Object.keys(FUSED2));

/* ---------- 天庭 ---------- */
const TT = [
  { k: 'yao', n: '药园', i: '🌿', d: l => l ? `每天收 灵药×${l}${l >= 3 ? '、宝药×1' : ''}` : '每天能收灵药' },
  { k: 'lu', n: '炼器坊', i: '🔥', d: l => `炼宝骨省 ${l * 10}% 灵石，+4/+5 成功率 +${l * 10}%` },
  { k: 'wu', n: '演武场', i: '🥋', d: l => `打仗得的经验 +${l * 5}%` },
  { k: 'qiang', n: '城墙', i: '🧱', d: l => `防御 +${l * 3}%` },
];
const TT_MAX = 3;
const ttLv = (k, c = C) => (c && c.tt && c.tt[k]) || 0;
const ttOpen = () => !!(C && C.story.f.tiantingDone);
const ttCost = l => ({ money: (l + 1) * (300 + C.lv * 15), bone: (l + 1) * 5 });
function lateExpMul() { return (1 + 0.05 * ttLv('wu')) * (1 + 0.25 * ((C && C.ng) || 0)); }
function ttPeople() { const f = C.story.f, L = ['齐道临（他管账，账本上一个字都没有）'];
  L.push(f.xiaoqiSafe ? '小七和帝关活下来的孩子们' : '小七（拄着拐，腿是替你挡那一下留下的）和帝关的孩子们');
  if (f.shiyiDuel) L.push('石毅（站在你旁边，什么都不说）'); if (f.army) L.push('石村八百兵的后人，扛着石锁'); if (f.qinhao) L.push('秦昊（假装路过）');
  if (f.yunxiQ) L.push('云曦（她带来的泉水，养活了药园）'); if (f.yinkun === 'spare') L.push('银坤（他来扫地。他说这是他欠的）');
  if (f.huoling && !f.shihaiDone) L.push('最高的那间屋子里，睡着火灵儿'); if (f.shihaiDone) L.push('火灵儿（她在烤肉，烤糊了）'); if (f.leaf) L.push('柱子底下，那片界海上捡回来的叶子，又绿了一点');
  return L; }
async function ttVisit() { if (!ttOpen() || NETROLE === 'guest' || STATE.scene || STATE.battle) return; C.tt = C.tt || {};
  await runScene(async () => { await nar(`天庭的柱子下面：${ttPeople().join('；')}。`);
    for (; ;) { const d = gameDay(), canYao = ttLv('yao') && C.tt.yaoDay !== d;
      const opts = TT.map(T => { const l = ttLv(T.k); if (l >= TT_MAX) return { t: `${T.i} ${T.n} · 满（${T.d(l)}）`, dis: true }; const k = ttCost(l); return { t: `${T.i} 修${T.n}到 ${l + 1} 级：${T.d(l + 1)}（💎${k.money}、兽骨×${k.bone}）`, dis: (C.money || 0) < k.money || itemN('bone') < k.bone }; });
      opts.push({ t: canYao ? `🌿 去药园收药` : '🌿 药园今天收过了', dis: !canYao }, { t: '走了' });
      const c = await dlgChoose(opts, `你有 💎${C.money || 0} 灵石、兽骨×${itemN('bone')}。`);
      if (c === TT.length + 1) break;
      if (c === TT.length) { C.tt.yaoDay = d; const l = ttLv('yao'); give('lingyao', l); if (l >= 3) give('baoyao', 1); logLine(`药园里收了 灵药×${l}${l >= 3 ? '、宝药×1' : ''}。`, 'loot'); continue; }
      const T = TT[c], l = ttLv(T.k), k = ttCost(l); if (l >= TT_MAX || (C.money || 0) < k.money || itemN('bone') < k.bone) continue;
      C.money -= k.money; takeItem('bone', k.bone); C.tt[T.k] = l + 1; fixHp(); sfx('epic'); logLine(`<b class="lvup">天庭</b>：${T.i}${T.n} 修到了 ${l + 1} 级——${T.d(l + 1)}。`, 'sys');
      await nar(['柱子下面的人一起动手，一天就修好了。大壮的后人扛石头，小七的孩子们刻阵纹，齐道临在旁边喊号子——喊错了三回。', '天庭又大了一点。来的人，也又多了一点。', '修好的那天晚上，柱子下面摆了很多桌。没人记得是谁先摆的。'][l]); }
  }, { title: '天庭' }); refresh(); }

/* ---------- 轮回 · 第二世 ---------- */
const NG_KEEP = ['ach', 'codex', 'records', 'dao', 'daoX', 'daoP', 'relics', 'forge', 'hidden', 'diff', 'auto', 'created'];
async function lunhuiStart() { if (NETROLE === 'guest' || STATE.scene || STATE.battle || !C.story.f.v15end) return; let go2 = false;
  await runScene(async () => { await nar('上苍之上很安静。你坐在长河的断口上，回头看。很远很远的下面，有一个小村子，村口有一棵柳树，还没被雷劈。');
    await nar(`再走一遍，会是什么样？<br><span class="dim">轮回：从石村重新开始。带着：称号、图鉴、守城/守擂纪录、悟道点和悟道、所有宝骨（连同炼器）。<br>不带：境界、宝术、功法、伙伴、灵石、背包。<br>第 ${(C.ng || 0) + 2} 世：凶兽气血 +${((C.ng || 0) + 1) * 30}%、攻击 +${((C.ng || 0) + 1) * 20}%，经验 +${((C.ng || 0) + 1) * 25}%。</span>`);
    const c = await choose(['（闭上眼睛，再活一次）', '还是算了']); if (c !== 0) return;
    const c2 = await choose(['……确定。从石村开始。', '再想想']); if (c2 !== 0) return; go2 = true;
    await cine('你闭上眼睛。<br>长河往回流。<br>你听见了兽奶罐子被打翻的声音。'); }, { title: '轮回' });
  if (!go2) return; const old = C, c = newChar(); for (const k of NG_KEEP) if (old[k] !== undefined) c[k] = old[k]; c.ng = (old.ng || 0) + 1; c.eq = []; c.seen = Object.assign({}, c.seen, { tut: 1, tut1: 1, tut2: 1, tutPet: 1 });
  C = c; fullHeal(); STATE.dungeon = null; save(true); enterGame(true); logLine(`<b class="lvup">第 ${C.ng + 1} 世</b>。凶兽更凶了，你也记得更多了。`, 'sys'); }
const ngFoe = () => 1 + 0.3 * ((C && C.ng) || 0), ngFoeAtk = () => 1 + 0.2 * ((C && C.ng) || 0);

/* ---------- the 烂木盒子, opened at last ---------- */
async function boxOpen() { if (NETROLE === 'guest' || STATE.scene || STATE.battle || C.story.f.boxOpened) return;
  await runScene(async () => { await nar('你把那只烂木盒子放在膝盖上。它跟着你从边荒的废墟走到帝关，走进黑水，走过九天，走到了这里。');
    const f = C.story.f, k = (f.boxQ || 0);
    if (k >= 3) await nar('你知道它的来历了：边荒最早的那一批守城的人，用城墙上掉下来的一块木头做的。蛄祖见过做它的人。帝落的长河里，你也见过。');
    await nar('你打开了盒子。');
    await cine('盒子里是空的。<br>不对——盒底刻着一行很小的字，刻得歪歪扭扭，像一个孩子刻的：<br><b>“给下一个守城的人。”</b>');
    const c = await choose(['（从怀里摸出一颗石村的小石子，放进去）', '（把小七那根旧发带放进去）', '（什么也不放，合上）']);
    if (c === 0) await nar('石子落进盒底，咚的一声。很轻。可你觉得，很远很远的下面，石村村口那块石头，也响了一下。');
    else if (c === 1) await nar('那根发带早就褪色了。你把它叠好，放了进去。小七要是知道，大概会骂你。');
    else await nar('你把盒子合上了。空着也好。下一个守城的人，会自己放东西进去的。');
    await nar('你把盒子放在了断口边上。它会在这里，一直等下一个人。'); f.boxOpened = c + 1; }, { title: '烂木盒子' }); refresh(); }

/* ---------- buttons on a place ---------- */
function lateActs(P) { const a = [];
  if (P.id === 'jt_court' && ttOpen()) a.push(`<button class="ab main" onclick="ttVisit()">🏛 天庭（${TT.map(T => T.i + ttLv(T.k)).join(' ')}）</button>`);
  if (P.id === 'jh_top' && C.story.f.v15end) { if (!C.story.f.boxOpened) a.push(`<button class="ab main" onclick="boxOpen()">📦 打开烂木盒子</button>`); a.push(`<button class="ab" onclick="lunhuiStart()">☯ 轮回 · 第 ${(C.ng || 0) + 2} 世</button>`); }
  return a; }

/* ---------- 前情提要 ---------- */
const CH_VOL = [0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
const VOL_NAMES = ['', '石村少年', '石国', '石皇', '登天', '上界', '争霸', '仙古', '帝关', '异域', '仙域', '清算', '天庭', '帝落', '异域之战', '独断万古'];
const VOL_RECAP = ['',
  '大荒深处的石村里，一个叫小不点的孩子在烧焦的柳树下长大。他胸口有一道疤——那里本该有一块至尊骨。他出了村，进了补天阁，在百断山里活着走了出来。',
  '他去了石国的皇都，那里有他的另一个“家”：武王府。人皇的寿宴上，所有人都知道了他的名字——荒。',
  '同一块骨头，两个人：他和石毅在天空战场上打了一场。后来他坐上了石皇的龙椅，又在神来收庄稼的那天，死了一回，站了起来。',
  '他补全了骨头，走上了几千年没人走完的登天路。走之前，他跟火国的公主告了别。',
  '上界的天很高，人的眼睛更高。他在至尊古台的天碑上，刻下了一个“罪”字。',
  '三千州的天才争霸，他在台上守了五百多场，燃烧至尊血换来了柳神法，拿着大罗剑胎回到台上，赢了。',
  '仙古遗地里，他和石毅第一次站在一边。帝冲本体来找他，没赢。一个背着旧剑的老人，问他愿不愿意去帝关。',
  '帝关是九天十地的最后一道门。他知道了“罪血”真正的意思——七王的后人。后来，有人用他换了五百年太平，他自己走出了城门。',
  '他在异域的黑水天牢里熬了一百年，被吊在城门上，喝过悟道茶，最后从海瀑跳了下去。',
  '仙域有一座比帝关还老的城。他回到帝关的第七天，不朽之王安澜来了。孟天正一剑斩断了自己的成仙路。',
  '他回到石村养伤，从头练起。然后带着石村八百兵，一笔一笔地算了帐：七大道统、金家、风族、九天之巅。九天太平了一万年。',
  '他在九天立了一根柱子，叫天庭。他去看了界海，走进了造化之门。',
  '他沿着时光长河往上游走，活了八辈子，又回来了。',
  '他打进了异域，从封印里救回了火灵儿，把黑色的柳神从界海里带了回来，平了异域。',
  '他在界海深处死了一回，从记得他的人心里化了回来，成了仙帝。然后一剑斩断了时光长河。'];
function recapText(v) { const f = C.story.f, out = [];
  const pick_ = (cond, t) => { if (cond) out.push(t); };
  if (v === 4) pick_(f.huoBye, ['你问她要不要一起走。她说火国是她的家。', '你说你会回来。她说，不回来就烧了你的石村。', '你把烤肉递给她。她说，凉了。'][f.huoBye - 1]);
  if (v === 3) { pick_(f.duelTalk === 'father', '你跟石毅说：欠你的不是他。他说了声谢谢。'); pick_(f.held7, '你在七神面前撑了四个回合。'); }
  if (v === 6) pick_(f.yinkun, f.yinkun === 'spare' ? '你放了银坤一条命。' : '你斩了银坤。');
  if (v === 10) pick_(f.xiaoqiSafe, '你在安澜面前一直挡在小七前面。');
  if (v === 11) { pick_(f.wang, f.wang === 'now' ? '你在天门下就对王长生出了手。' : '王长生的账，你记下了，留到以后。'); pick_(f.jinFate, ['', '你把金太君交给了帝关。', '你废了金太君的修为，让她做个普通老人。', '你让金太君走了。'][f.jinFate || 0]); pick_(f.yinkunGate, '那个被你放过的银坤，替你打开了道统的山门。'); }
  if (v === 12) pick_(f.leaf, '你把界海上一片死掉的叶子世界，捧回了天庭。');
  if (v === 13) pick_(f.baxiMem, '八辈子的事，你一件都没忘。');
  if (v === 14) { pick_(f.huoGuard, '三位仙王伏击的时候，没有一道光落在火灵儿身上。'); pick_(f.tahuaOk, '他化自在的每一个你，都挡住了一道追兵。'); }
  return out; }
async function volRecap(cn) { const v = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'].indexOf(cn); if (v < 1) return; const L = recapText(v); C.recapSeen = Math.max(C.recapSeen || 0, v);
  if (L.length) await nar(`<b>这一卷，你做过的选择：</b><br>${L.map(t => '· ' + t).join('<br>')}`); }
async function recapShow(force) { if (!C || STATE.scene || STATE.battle || NETROLE === 'guest') return; const q = curQ(), v = CH_VOL[q.ch] || 1; if (C.story.q < 2) return;
  await runScene(async () => { const prev = v > 1 ? `<small>上一卷 · ${VOL_NAMES[v - 1]}</small><br>${VOL_RECAP[v - 1]}<br><br>` : '';
    await nar(`<b>前情提要</b><br>${prev}<small>第${['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'][v]}卷 · ${VOL_NAMES[v]}</small><br>${VOL_RECAP[v]}`);
    const L = []; for (let i = 1; i <= v; i++) L.push(...recapText(i)); if (L.length && force) await nar(`<b>一路上你做过的选择：</b><br>${L.slice(-8).map(t => '· ' + t).join('<br>')}`);
    await nar(`<b>现在：</b>${esc(q.title)}——${q.goal}`); }); }
function recapOnLoad() { if (!C || !C.savedAt || now() - C.savedAt < 20 * 60 * 1000 || C.story.q < 3) return; setTimeout(() => recapShow(false), 900); }
