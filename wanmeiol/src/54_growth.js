/* ================= 宝术: six tiers of mastery, and fusing two 圆满 宝术 into a greater one =================
   Mastery tiers live in PROF (10_data.js): 初窥 → 入门 → 小成 → 精通 → 大成 → 圆满. Each use in battle counts.
   When two 宝术 are both 圆满, their 骨文 can be fused (石昊 page → 宝术合成): it costs 宝药 and a 融合骨文 puzzle
   (fail → try again or give up, nothing is lost). The fused 宝术 is new and stronger, and starts again at 初窥. */
const FUSED = {
  f_leiying: { name: '雷鹰裂空', icon: '🌩️', mp: 26, cd: 3, tgt: 'enemies', dmg: 1.5, hits: 2, mag: 1, el: 'lei', st: [{ k: 'stun', t: 1, p: 0.25 }, { k: 'bleed', t: 2, v: 0.25, p: 0.5 }], desc: '鹰爪裹着雷光撕开天空：全体连抓两下，共 1.5 倍伤害，无视一半防御，可能眩晕、流血。', fuse: ['qly', 'lei'] },
  f_suanlei: { name: '狻猊雷吼', icon: '💥', mp: 30, cd: 4, tgt: 'enemies', dmg: 1.9, mag: 1, el: 'lei', st: [{ k: 'stun', t: 1, p: 0.45 }, { k: 'brk', t: 2, v: 0.25, p: 0.8 }], desc: '狻猊张口，吼出来的是雷：全体 1.9 倍伤害，45% 眩晕，破甲（防御 -25%）。', fuse: ['sn', 'lei'] },
  f_fujian: { name: '缚灵剑阵', icon: '⛓️', mp: 28, cd: 4, tgt: 'enemies', dmg: 1.2, mag: 1, el: 'bone', st: [{ k: 'weak', t: 2, v: 0.3, p: 0.9 }, { k: 'bleed', t: 3, v: 0.35, p: 1 }], desc: '骨文锁链上挂满剑意：全体 1.2 倍伤害，虚弱（攻击 -30%）并重创流血。残魂最怕它。', fuse: ['gw', 'jian'] },
  f_zhenyue: { name: '镇岳', icon: '⛰️', mp: 26, cd: 4, tgt: 'enemy', dmg: 3.6, pierce: 1, el: 'blunt', st: [{ k: 'stun', t: 1, p: 0.6 }], desc: '打神石里灌进狻猊之力，砸下去像一座山：3.6 倍伤害，完全无视防御，60% 眩晕。', fuse: ['dsh', 'sn'] },
  f_leijian: { name: '雷霆剑意', icon: '⚔️', mp: 28, cd: 3, tgt: 'enemy', dmg: 3.0, mag: 1, pierce: 1, el: 'lei', st: [{ k: 'bleed', t: 3, v: 0.45, p: 1 }], desc: '锈剑引来一道天雷：3 倍伤害，无视防御，重创流血。', fuse: ['jian', 'lei'] },
  f_yingyu: { name: '鹰羽剑雨', icon: '🪶', mp: 24, cd: 3, tgt: 'enemies', dmg: 1.2, hits: 3, st: [{ k: 'bleed', t: 2, v: 0.3, p: 0.6 }], desc: '剑意化成千百根鹰羽落下：全体连打三下，共 1.2 倍伤害，可能流血。', fuse: ['qly', 'jian'] },
  f_tazhen: { name: '塔镇万纹', icon: '🏯', mp: 30, cd: 5, tgt: 'allies', shield: 2.5, desc: '小塔放大，骨文绕着塔身转成一圈：全队获得 2.5 倍攻击的护盾。', fuse: ['ta', 'gw'] },
};
Object.assign(SKILLS, FUSED); SKILL_ORDER.push(...Object.keys(FUSED));
const PROF_MAX = PROF.length - 1, FUSE_COST = [['baoyao', 2]];
const fuseReady = id => { const F_ = FUSED[id]; return F_.fuse.every(s => skOwn(C, s) && profLevel(skOwn(C, s)) >= PROF_MAX); }; /* an evolved 宝术 still counts as its root */
const fuseKnown = id => FUSED[id].fuse.every(s => skOwn(C, s));
async function fuseSkill(id) {
  if (NETROLE === 'guest' || STATE.scene || STATE.battle || !FUSED[id] || C.sk.includes(id)) return; const F_ = FUSED[id];
  if (!fuseReady(id)) { toast('两门宝术都要练到圆满才行'); return; } if (FUSE_COST.some(([k, n]) => itemN(k) < n)) { toast('需要 宝药 ×2'); return; }
  closeModal(); UI.nav = null; renderSide();
  await runScene(async () => { const [a, b] = F_.fuse.map(s => SKILLS[s]);
    await nar(`你盘膝坐下，把${a.icon}<b>${a.name}</b>和${b.icon}<b>${b.name}</b>的骨文同时运转起来。两股力量在你体内撞在一起，像两条要打架的蛇。`);
    const r = await miniGame('lights', { title: '融合骨文', desc: '把乱窜的骨文一道道按熄，让两门宝术的纹路合成一条。', presses: 5 });
    if (!r.ok) { await nar('骨文散开了，两门宝术各回各位。你出了一身冷汗——还好，什么都没丢。'); return; }
    for (const [k, n] of FUSE_COST) takeItem(k, n);
    await cine(`两道骨文缠在一起，越转越快，最后——<br>合成了一道你从没见过的纹路。<br><b>${F_.icon} ${F_.name}</b>`);
    learnSkill(id); C.prof[id] = 0; save(); }, { title: '宝术合成 · ' + F_.name });
  refresh(); }
function fuseHtml() { const L = Object.entries(FUSED).filter(([id]) => fuseKnown(id) || C.sk.includes(id)); if (!L.length) return '';
  return `<div class="card"><h4>宝术合成 <span class="dim" style="font-size:.8rem">两门宝术都到「${PROF[PROF_MAX].n}」，就能把骨文合成一门更强的宝术（宝药 ×2）</span></h4><div class="list">${L.map(([id, F_]) => { const have = C.sk.includes(id), ready = fuseReady(id);
    const parts = F_.fuse.map(s => `${SKILLS[s].icon}${SKILLS[s].name}<span style="color:${profLevel(s) >= PROF_MAX ? 'var(--grn)' : 'var(--dim)'}">（${PROF[profLevel(s)].n || '初窥'}）</span>`).join(' ＋ ');
    return `<div class="li"><span class="ic">${F_.icon}</span><div class="t"><b>${F_.name}</b>${have ? ' <span class="pill gold">已合成</span>' : ''}<small>${parts}</small><small>${F_.desc}</small></div>${have ? '' : `<button class="sb" ${ready ? '' : 'disabled'} onclick="event.stopPropagation();fuseSkill('${id}')">合成</button>`}</div>`; }).join('')}</div></div>`; }
