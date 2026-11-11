/* ================= 好玩一点（第四轮 20 条）：操作只多一个按钮，靠反馈、惊喜和收集 ================= */
/* 存档里的小账本：老存档没有就现建 */
function FN() { C.fun = C.fun || {}; const f = C.fun; for (const [k, v] of [['ach', {}], ['relic', {}], ['sv', {}], ['soft', {}], ['chs', {}], ['rv', []]]) if (!f[k]) f[k] = v;
  for (const k of ['perfect', 'house', 'combo4', 'dodge', 'doors', 'danmu', 'spins', 'jack', 'scr', 'sup', 'svDay', 'svRoll']) if (f[k] == null) f[k] = 0; return f; }

/* —— 1 看准时机：开门杀、断电点下去时出现缩圈，正好点中算“完美” —— */
const RING_EL = ['jump', 'light'], PERFECT_MUL = 1.3, HOUSE_SCREAM = 15, PICKY_MONEY = 120;
function timingRing(label) { if (window.__dbg && (__dbg.auto || __dbg.instant)) return Promise.resolve(window.__dbg.ring || false); if (!SET.motion) return Promise.resolve(false);
  return new Promise(res => { const box = el('div', '', '<div class="rg-t"></div><div class="rg-c"></div><div class="rg-l">' + esc(label) + '</div>'); box.id = 'ring'; $('#vBt').appendChild(box); const t0 = performance.now(), D = 900; let done = false;
    const fin = ok => { if (done) return; done = true; box.classList.add(ok ? 'ok' : 'no'); if (ok) sfx('ok'); setTimeout(() => box.remove(), 360); setTimeout(() => res(ok), ok ? 260 : 0); };
    box.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); const p = (performance.now() - t0) / D; fin(p >= .8 && p <= 1.02); }); setTimeout(() => fin(false), D * 1.12); }); }
async function pickSkillFx(k) { const B = STATE.battle; if (!B || B.phase !== 'hero' || B.result) return; const S = SKILLS[k]; if (!S) return; if (C.mp < S.cost) { toast('精神不够（需要 ' + S.cost + '）'); return; }
  let perfect = false; if (B.scare && RING_EL.includes(S.el) && !B.auto) { B.phase = 'ring'; perfect = await timingRing('等红圈和白圈重合时点下去'); if (STATE.battle !== B) return; B.phase = 'hero'; }
  battleAct({ t: 'sk', k, tg: B.sel, perfect }); }
/* —— 10 躲开大招：对方蓄好的大招落下前点「防御」，再看准时机点一下就完全躲开 —— */
async function guardFx() { const B = STATE.battle; if (!B || B.phase !== 'hero' || B.result) return; let perfect = false;
  if (!B.scare && !B.auto && alive(B.foes).some(f => f.intent && f.intent.exec && !f.st.stun)) { B.phase = 'ring'; perfect = await timingRing('它要扑过来了——看准时机躲开'); if (STATE.battle !== B) return; B.phase = 'hero'; }
  battleAct({ t: 'guard', perfect }); }

/* —— 2 游客反应：胆量掉到一半、只剩一点时，各说各的 —— */
const REACT = { stu: ['卧槽卧槽卧槽！', '我手机掉了！谁帮我捡一下……不了不要了！', '妈——！'], couple: ['你别拽我！', '你不是说你不怕吗？！', '我们分手吧，我先跑了！'], skeptic: ['这、这是光学原理……', '我只是……腿麻了。', '科学……科学是什么来着……'],
  med: ['这个解剖结构不对……它为什么还能动！', '我见过尸体！但没见过会追人的！'], tough: ['谁摸我后脖子？！', '……我出去抽根烟。', '别别别别过来！'], vlog: ['家人们这个是真的！真的！', '直播先暂停一下……', '镜头里多了一个人！'],
  _: ['啊——！', '让我出去！', '刚才是不是有人叫我名字？'] };
function reactLine(B, f) { if (!B.scare || f.side !== 'f' || f.hp <= 0) return; const r = f.hp / f.mhp; const lv = r < .2 ? 2 : r < .5 ? 1 : 0; if (lv <= (f.rx || 0)) return; f.rx = lv; const L = REACT[f.id] || REACT._; blog(B, f.n + '：' + L[(lv + f.key.length + B.turn) % L.length], 'say'); fxe(B, { t: 'txt', who: f.key, txt: lv === 2 ? '腿软' : '慌了' }); }

/* —— 4 换着吓：换不同手段连段加成，同一招连用会被习惯 —— */
const COMBO_UP = .08, COMBO_MAX = 4, REPEAT_DOWN = .88;
function comboMul(B, k) { if (!B.scare) return 1; const same = B.lastK === k; B.combo = same ? 0 : Math.min(COMBO_MAX, (B.combo || 0) + (B.lastK ? 1 : 0)); B.rep = same ? (B.rep || 0) + 1 : 0; B.lastK = k; if (B.combo >= COMBO_MAX) FN().combo4++;
  if (B.combo) fxe(B, { t: 'txt', who: 'hero', txt: '连段 ×' + B.combo }); if (B.rep) blog(B, '游客开始习惯这一招了。', 'warn'); return (1 + COMBO_UP * B.combo) * Math.pow(REPEAT_DOWN, Math.min(B.rep, 3)); }
function comboText(B) { if (!B.scare || !B.lastK) return ''; return B.rep ? ' · <span class="cb no">' + SKILLS[B.lastK].n + '用多了 -' + Math.round((1 - Math.pow(REPEAT_DOWN, Math.min(B.rep, 3))) * 100) + '%</span>' : B.combo ? ' · <span class="cb">连段 ×' + B.combo + '（+' + Math.round(COMBO_UP * B.combo * 100) + '%）换一招继续</span>' : ''; }

/* —— 12 首领的软肋：开场一句提示，用对了手段打出专属一击 —— */
const SOFT = { wangqi: ['name', '他每天都在找那个女人。念出她的名字。'], aunt: ['name', '她怕的不是你，是她哥哥。念出那个名字。'], mirror: ['light', '镜子里的东西，最怕突然亮起来的光。'], twoface: ['name', '两张脸不是一条心。叫出其中一个的名字。'],
  nurse: ['blade', '她身上缺掉的那几块，都是被刀划开的。'], tallone: ['blade', '白布底下全是脸。划开白布，它们就散了。'], xiong: ['blunt', '他只盯着你的左半边——右边是空门。'], redshadow: ['light', '它是影子。影子怕光。'], zhangpeng: ['blunt', '他手里有刀，可他从来没挨过打。'],
  dean: ['name', '那四封信的署名，你念得出来。'], gaoru: ['sound', '她能分析你所有的套路——除了那首歌。'], feiyl: ['doll', '他是来拍“员工”的。可人偶不是员工。'], wanghl: ['doll', '他要的是校牌。校牌挂在人偶脖子上。'] };
const SOFT_MUL = 1.5;
function softHit(B, t, S) { const s = SOFT[t.id]; if (!s || !t.boss || t.softHit || s[0] !== S.el) return 1; t.softHit = 1; FN().soft[t.id] = 1; blog(B, '软肋！' + t.n + ' 整个僵住了。', 'epic'); fxe(B, { t: 'banner', who: t.key, txt: '软肋', ic: '💥', foe: 1, big: 1 }); return SOFT_MUL; }

/* —— 11 场景一击：夜里的对峙，每场一个跟地点有关的按钮，只能用一次，不占回合 —— */
function strikeOf() { const k = stageKey(); if (['doorhall', 'hall', 'corridor', 'wardhall', 'apt'].includes(k)) return ['🚪', '关门', 'door']; if (['dance', 'room', 'wc', 'toilet', 'inside'].includes(k)) return ['🪞', '砸镜子', 'mirror'];
  if (['classroom', 'dorm', 'school', 'office', 'laundry', 'ward', 'ctrl', 'prop', 'attic', 'shop', 'house'].includes(k)) return ['🪑', '掀翻桌柜', 'table']; if (['woods', 'hut', 'field', 'park', 'parking', 'burnt'].includes(k)) return ['🌑', '关掉手电', 'dark']; return ['🧱', '抄起手边的东西', 'grab']; }
function sceneStrike() { const B = STATE.battle; if (!B || B.scare || B.phase !== 'hero' || B.result || B.strikeUsed) return; B.strikeUsed = true; B.ev = []; const [ic, n, k] = strikeOf(), fs = alive(B.foes);
  blog(B, '陈歌 · ' + ic + n + '（不占回合）', 'epic'); fxe(B, { t: 'banner', who: 'hero', txt: n, ic });
  if (k === 'door') for (const f of fs) { if (f.boss) addSt(B, f, 'slow', 2); else addSt(B, f, 'stun', 1); }
  else if (k === 'mirror') for (const f of fs) { if (f.k === 'ghost') applyDmg(B, B.hero, f, Math.round(f.mhp * .12), {}); else addSt(B, f, 'weak', 2); }
  else if (k === 'table') for (const f of fs) { addSt(B, f, 'vuln', 2); applyDmg(B, B.hero, f, Math.round(f.mhp * .06), {}); }
  else if (k === 'dark') { for (const f of fs) addSt(B, f, 'dark', 2); addSt(B, B.hero, 'shield', 1); }
  else { const f = B.foes[B.sel] && B.foes[B.sel].hp > 0 ? B.foes[B.sel] : fs[0]; applyDmg(B, B.hero, f, Math.round(f.mhp * .1), {}); if (f.hp > 0) addSt(B, f, 'weak', 2); }
  sfx('hit'); if (!alive(B.foes).length) { B.result = 'win'; renderBattle(); return battleFinish(); } renderBattle(); }

/* —— 5 挑剔的游客：每天一位，放话说什么都不怕——其实只怕一样 —— */
function pickyFor(mobs) { const f = FN(); if (f.pickyDay === C.day || !qPast('q_firstday')) return null; f.pickyDay = C.day; const els = [...new Set(C.bar.d.map(k => SKILLS[k] && SKILLS[k].el).filter(e => e && e !== 'none'))]; if (!els.length) return null;
  const el = els[Math.floor(rnd() * els.length)]; logLine('排队的人里有个人放话：“什么都吓不到我。”——听说他最怕' + EL[el] + '。', 'warn'); toast('今天有位挑剔的游客：最怕' + EL[el]); return { i: 0, el }; }
/* —— 6 评论墙 —— */
const RV = { good: ['「{s}」里那个东西是真人扮的吧？反正我不会再进去了。', '进去前男朋友说他不怕。出来的时候，他在我后面。', '五星。扣的那一星是我丢在里面的一只鞋。', '老板人挺好，就是长得有点像里面的鬼。', '带我妈来的。我妈拉着我说：下次还来。我不来了。', '工作人员太敬业了，我在厕所隔间里都被吓到了。', '出来以后才发现，我们进去的时候是四个人，出来是五个。'],
  bad: ['「{s}」还没有我家楼道吓人。', '道具太假，一星。腮红打得比我还好看。', '进去十分钟，唯一吓到我的是门票价格。', '鬼呢？我等了半天。'], picky: ['我说过什么都吓不到我。我收回。', '别问。我今晚开灯睡。'] };
function addReview(sid, ok, picky) { const pool = picky ? RV.picky : ok ? RV.good : RV.bad; const s = pick(pool).replace('{s}', SCENES[sid] ? SCENES[sid].n : '恐怖屋'); const f = FN(); f.rv.unshift({ d: C.day, s, ok: ok ? 1 : 0 }); f.rv.length = Math.min(f.rv.length, 12); return s; }

/* —— 7 一键营业一整天 —— */
async function dayRun() { if (STATE.scene || STATE.battle || STATE.busy) return; if (isNight()) { toast('乐园关门了'); return; } if (C.loc !== 'hh_door') { toast('去恐怖屋门口'); return; }
  const m0 = C.money, s0 = C.hh.screams, p0 = C.hh.today, g0 = C.hh.good, b0 = C.hh.bad, q0 = C.q, mo = SET.motion, au = C.auto; SET.motion = 0; C.auto = 1; STATE.dayRun = true; let n = 0;
  try { while (!isNight() && C.loc === 'hh_door' && C.q === q0 && n < 8) { const sid = sceneList().sort((a, b) => scenePas(b).pay * (1 + sceneStar(b)) - scenePas(a).pay * (1 + sceneStar(a)))[0]; await receive(sid); n++; for (let i = 0; i < 400 && (STATE.battle || STATE.scene); i++) await sleep(20); if (STATE.scene) break; } }
  finally { SET.motion = mo; C.auto = au; STATE.dayRun = false; }
  const rv = FN().rv.slice(0, 2).map(r => '<div class="c3" style="text-align:left">“' + esc(r.s) + '”</div>').join('');
  await showCard('<div class="c1">今天收工</div><div class="c2">接待 ' + n + ' 批 · ' + (C.hh.today - p0) + ' 人</div><div class="c3">好评 ' + (C.hh.good - g0) + ' · 差评 ' + (C.hh.bad - b0) + '<br>门票 +' + (C.money - m0) + ' 元 · 尖叫 +' + Math.max(0, C.hh.screams - s0) + '</div>' + rv, 700); refresh(); save(); storyArrive(); }

/* —— 8 三扇门 · 9 弹幕点播：夜探时偶尔出现 —— */
async function threeDoors() { FN().doors++; await runScene(async () => { await T_(`^fx dark
^prop d1 door 7 3
^prop d2 door 10 3
^prop d3 door 13 3
走廊尽头并排三扇门。三条门缝里，都透着一点光。`); const c = await choose([['左边的门'], ['中间的门'], ['右边的门']], '开哪一扇？'); const r = rnd(), x = [7, 10, 13][c];
    if (r < .22) { await T_(`^to 陈歌 ${x}\n^sfx creak\n门开了一条缝。\n^scare 黑影\n门后面站着一个人，脸贴着门缝。\n^fx flicker\n你用力把门撞了回去。`); C.mp = Math.max(0, C.mp - 5); logLine('精神 -5', 'warn'); }
    else if (r < .5) { const it = pick(['bread', 'drink', 'saltbag', 'bandage', 'coffee']); await T_(`^to 陈歌 ${x}\n^prop it item ${x} 5\n门后是个杂物间。架子上落了一样东西：${ITEMS[it].ic}${ITEMS[it].n}。`); addItem(it); }
    else if (r < .7) { const m = rint(30, 90); await T_(`^to 陈歌 ${x}\n^prop it coin ${x} 5\n门后什么都没有，只有地上一个旧钱包。${m} 元。`); gainMoney(m); }
    else if (r < .85 && relicCan()) { await T_(`^to 陈歌 ${x}\n^prop it sparkle ${x} 5\n门后只有一张小桌，桌上放着一样东西，像是专门等你来拿。`); relicGain(); }
    else { await T_(`^to 陈歌 ${x}\n门后是一面墙。墙上有人用指甲刻了一行字：别回头。\n^sfx whisper\n你没回头。`); gainExp(15 + C.lv * 4); } }, '夜探 · 三扇门'); }
async function danmuAsk() { await runScene(async () => { liveOn(Math.max(800, Math.round(C.fans * .2))); await T_(`>主播！去开那个柜子！／开！开！开！／别怂啊`);
    const c = await choose([['照弹幕说的做', '人气会涨，也可能被吓'], ['不理他们', '']], '弹幕在起哄。'); if (c === 0) { FN().danmu++; if (chance(.65)) { const f = rint(40, 120), m = rint(10, 40); await T_(`^prop cb closet 11 4 {"open":1}\n柜子里只有一件旧外套。口袋里有张纸条：谢谢你来看我。\n>有点感人是怎么回事／这主播真敢开／打赏了`); C.fans += f; gainMoney(m, '打赏'); logLine('关注 +' + f, 'gain'); }
      else { await T_(`^prop cb closet 11 4 {"open":1}\n^scare 镜鬼\n柜门一开，里面有一张脸。\n>卧槽！！！／我手机扔出去了／主播你还好吗`); C.mp = Math.max(0, C.mp - 6); C.fans += 30; logLine('精神 -6，关注 +30（被吓到的样子反而火了）', 'warn'); } }
    else await T_(`>主播怂了／取关了取关了／……其实我也不敢开`); STATE.live = null; }, '夜探 · 弹幕'); }

/* —— 14 怨念物：夜探时捡到，四组各三件，凑齐一组有个小的永久加成 —— */
const RELICS = { pingan: [['r_pa1', '生锈的门牌', '208。背面有人用指甲刻了一个日期。'], ['r_pa2', '半张寻人启事', '照片那一半被雨水泡掉了，只剩联系人一栏。'], ['r_pa3', '桃红色手机壳的碎片', '边缘很整齐，像是被人一点点掰下来的。']],
  xicheng: [['r_xc1', '断掉的舞鞋带', '粉色的。打了一个死结，又被人解开过。'], ['r_xc2', '写着名字的椅子脚', '名字被划掉了，划痕比字还深。'], ['r_xc3', '一张糖纸', '背面写着一句话：生日快乐。没有署名。']],
  muyang: [['r_my1', '泡过水的校牌', '照片上的人在笑。名字那一栏是空的。'], ['r_my2', '一只笔帽', '咬过的痕迹很深。笔不知道去哪了。'], ['r_my3', '雨衣上的纽扣', '黄色的。比你的雨衣小两号。']],
  kangfu: [['r_kf1', '空药袋', '写着你的名字。药不在了。'], ['r_kf2', '病号手环', '编号被剪掉了，只剩“病栋三”。'], ['r_kf3', '一张值班表', '每一格都写着同一个字：陈。']] };
const RELIC_SET = { pingan: ['平安公寓', '精神上限 +10'], xicheng: ['西城私立学院', '门票 +10%'], muyang: ['暮阳中学', '吓人手段 +6%'], kangfu: ['第三病栋', '体力上限 +25'] };
const RELIC_AREA = { pingan: 'pingan', xicheng: 'xicheng', muyang: 'muyang', haiming: 'muyang', kangfu: 'kangfu', park: null };
function relicSetDone(s) { return RELICS[s].every(r => FN().relic[r[0]]); }
function relicBonus(c, k) { if (!c.fun || !c.fun.relic) return 0; const has = s => RELICS[s].every(r => c.fun.relic[r[0]]); return k === 'mp' ? (has('pingan') ? 10 : 0) : k === 'hp' ? (has('kangfu') ? 25 : 0) : k === 'ticket' ? (has('xicheng') ? .1 : 0) : k === 'scare' ? (has('muyang') ? .06 : 0) : 0; }
function relicCan(area) { const s = area ? RELIC_AREA[area] : null; const L = s ? RELICS[s] : Object.values(RELICS).flat(); return L.some(r => !FN().relic[r[0]]); }
function relicGain(area) { const s = area ? RELIC_AREA[area] : null; const L = (s ? RELICS[s] : Object.values(RELICS).flat()).filter(r => !FN().relic[r[0]]); if (!L.length) return null; const r = L[Math.floor(rnd() * L.length)]; FN().relic[r[0]] = 1;
  logLine('🕯 怨念物：' + r[1] + '——' + r[2], 'gain'); toast('怨念物：' + r[1]); sfx('chalk'); const set = Object.keys(RELICS).find(k => RELICS[k].some(x => x[0] === r[0])); if (relicSetDone(set)) { logLine('凑齐了「' + RELIC_SET[set][0] + '」的三件怨念物：' + RELIC_SET[set][1] + '。', 'gain'); toast('凑齐一组：' + RELIC_SET[set][1]); sfx('big'); } return r; }

/* —— 15 午夜售票台的特殊游客 —— */
const SPECIAL = [
  { id: 'sv_rain', n: '穿黄雨衣的小女孩', s: `^at 雨衣女孩 13\n大太阳底下，一个穿黄雨衣的小女孩站在售票台前。雨衣是湿的。\n雨衣女孩|叔叔，今天会下雨吗？`, ch: [['把伞借给她', () => { addItem('g_raincoat', 1, 1); return `她接过伞，没打开，抱在怀里走了。\n^out 雨衣女孩\n傍晚的时候，伞被放回了门口。伞面上全是水。伞柄上挂着一件小雨衣——是给你的。`; }], ['告诉她不会', () => { gainExp(20 + C.lv * 4); return `雨衣女孩|哦。\n她点点头，走进了乐园。\n^out 雨衣女孩\n半小时后下了一场雨，只下在恐怖屋门口那一小块地上。`; }]] },
  { id: 'sv_old', n: '拿着旧票根的老人', s: `^at 老人 13\n一个老人递过来一张票根。纸已经黄了，上面印着二十年前的日期。\n老人|那时候，里面只有一对年轻夫妻，自己扮鬼，自己卖票。我女儿吓哭了，那个男的蹲下来给了她一颗糖。`, ch: [['请他免费进去', () => { C.hh.spins++; return `老人|……不了。我就是想看看，这地方还在不在。\n^out 老人\n他把票根留在了柜台上。黑色手机震了一下：获得一次免费转盘机会。`; }], ['问他记不记得那对夫妻的样子', () => { gainExp(30 + C.lv * 5); return `老人|那个男的，笑起来跟你一模一样。\n^out 老人\n你在柜台后面站了很久。`; }]] },
  { id: 'sv_food', n: '送外卖的小哥', s: `^in 外卖小哥 13\n外卖小哥|恐怖屋三楼……小小收？备注写着：放床底下就行。\n订单上的付款人一栏，是空的。`, ch: [['签收，拿去三楼', () => { if (C.pets.xiaoxiao) petAff('xiaoxiao', 6); else gainMoney(-15); return `一份儿童套餐。你放到了床底下。\n第二天，盒子空了，里面的玩具被摆在了枕头上。`; }], ['说送错了', () => `外卖小哥|可是导航就停在这里啊……\n^out 外卖小哥\n他走了以后，三楼传来一声很小的叹气。`]] },
  { id: 'sv_count', n: '一直在数人数的学生', s: `^in 数数的学生 13\n数数的学生|我们一共五个人。一、二、三、四、五……六？\n他又数了一遍。还是六。他的四个同学都在笑他。`, ch: [['让他们进去', () => { C.fans += 120; return `出来的时候，他们五个人脸都白了。\n他们在门口拍了张合照，发到网上：里面那个人到底是谁？——关注 +120。`; }], ['请他再数一遍', () => { gainExp(20 + C.lv * 4); return `数数的学生|一、二、三、四、五。……五。\n他松了一口气。你没告诉他，第六个刚刚站到了你身后。`; }]] },
  { id: 'sv_wet', n: '浑身湿透的男人', s: `^at 湿透的男人 13\n^sfx drip\n一个男人站在门口，全身都在往下滴水。\n湿透的男人|请问……你们这里的浴缸，现在有人用吗？`, ch: [['说有人', () => { C.mp = charStats().mmp; return `湿透的男人|那我等一会。\n^out 湿透的男人\n他走了。地上那一摊水，过了一下午都没干。你却觉得脑子清醒了很多。（精神回满）`; }], ['问他为什么问这个', () => { gainExp(25 + C.lv * 4); return `湿透的男人|我在里面待了六十秒。出来以后，就一直是湿的。\n^out 湿透的男人\n你想起了深水那一晚。`; }]] },
  { id: 'sv_nurse', n: '戴口罩的护士', need: 'q_ward', s: `^at 戴口罩的护士 13\n一个护士站在售票台前，口罩遮了半张脸。\n戴口罩的护士|请问……第三病栋怎么走？我好像走错路了。`, ch: [['告诉她病栋封了', () => { addItem('bandage', 2); return `戴口罩的护士|封了？……那我的病人怎么办。\n^out 戴口罩的护士\n她在柜台上留下两卷绷带，走了。走路没有声音。`; }], ['给她指路', () => { C.mp = Math.max(0, C.mp - 5); gainExp(40 + C.lv * 5); return `她听完，朝你鞠了一躬。\n^out 戴口罩的护士\n^fx glitch\n她转身的时候，你看见她的腰，折成了一个不可能的角度。（精神 -5）`; }]] },
  { id: 'sv_press', n: '拿录音笔的记者', s: `^in 记者 13\n记者|陈老板，我是做城市怪谈专题的。能聊几句吗？你这里……是真的吗？`, ch: [['“都是真的。”', () => { C.fans += 300; return `记者笑了，在本子上写了一行字。\n第二天的报道标题是：西郊鬼屋老板疑似精神失常。——关注 +300。`; }], ['“都是特效。”', () => { gainMoney(150, '采访费'); return `记者|也是。\n他付了采访费，进去转了一圈。出来的时候，录音笔里多了一段不是他录的笑声。`; }]] },
  { id: 'sv_draw', n: '背画板的孩子', s: `^in 画画的孩子 13\n一个背着画板的孩子坐在恐怖屋对面，画了一下午。\n他把画递给你：恐怖屋的每一扇窗户里，都有一张脸。`, ch: [['把画挂在休息室', () => { for (const k in C.pets) petAff(k, 2); return `你把画挂在了休息室墙上。\n第二天早上，画里窗户上的脸，都换成了笑脸。（员工好感 +2）`; }], ['问他看见了谁', () => { gainExp(20 + C.lv * 4); return `画画的孩子|你身边那个红衣服的姐姐，她一直在看你。\n^out 画画的孩子\n他收起画板，跑了。`; }]] }];
function svToday() { const f = FN(); if (!C.f.parking || isNight() || C.loc !== 'hh_door') return null; if (f.svDay === C.day) return null; if (f.svRoll !== C.day) { f.svRoll = C.day; f.svHere = srng(C.day * 131 + 7)() < .4 ? 1 : 0; } if (!f.svHere) return null;
  return SPECIAL.find(v => !f.sv[v.id] && (!v.need || qPast(v.need))) || null; }
async function svMeet() { const v = svToday(); if (!v || STATE.scene || STATE.battle) return; const f = FN(); f.svDay = C.day; f.sv[v.id] = 1; sfx('phone');
  await runScene(async () => { await T_(`~phone\n午夜售票台在柜台下面，轻轻响了一声。\n` + v.s); const c = await choose(v.ch.map(x => [x[0]])); await T_(v.ch[c][1]()); }, '特殊游客 · ' + v.n); logLine('特殊游客：' + v.n + '（' + Object.keys(f.sv).length + '/' + SPECIAL.length + '）', 'gain'); refresh(); save(); }

/* —— 13 陪员工的小剧场 —— */
const PET_SKIT = {
  wan: [`^in 徐婉 12\n徐婉|老板，你看我这个妆……\n^fx flicker\n徐婉|是不是太吓人了？\n^fx steady\n你看了一眼。是太吓人了。你没说出口。`, `^in 徐婉 12\n徐婉在背台词。“还我命来——”念到一半，她自己笑场了。\n徐婉|老板，鬼笑起来是不是就不吓人了？\n我|看情况。有的笑起来更吓人。`, `^in 徐婉 12\n^prop dr cup 11 5\n徐婉把一瓶饮料推到你面前。\n徐婉|昨晚你又一夜没睡吧。……别看我，我就是顺手买的。`],
  xiaoxiao: [`^at 小小 13\n^sfx giggle\n你陪小小玩捉迷藏。你数到十，转过身——\n^out 小小\n她不见了。你找了一个小时。最后发现她一直站在你影子里。`, `^prop dl doll 12 5\n你在床底下放了一个新缝的小布偶。\n^at 小小 13\n第二天，布偶被摆到了枕头上，旁边还压着一颗用纸叠的星星。`, `^at 小小 12\n小小拿着蜡笔，在墙上画了一家人。爸爸、妈妈、她。\n她想了想，又在旁边画了一个拿锤子的人。`],
  bixian: [`^prop pp paper 11 5\n你给那支圆珠笔换了新胶带。\n纸上慢慢出现一个字：哼。\n过了一会儿，又多了一个：谢。`, `^prop pp paper 11 5\n你问它明天会不会下雨。\n它画了一个圈。又在圈旁边，画了一把伞。`, `^prop pp paper 11 5\n你问它，你爸妈在哪。\n笔在纸上停了很久，最后只写了两个字：还在。`],
  baimao: [`^prop ct cat 11 5\n你给白猫开了一个罐头。它吃完了，才抬头看了你一眼。\n就一眼。`, `^prop ct cat 7 5\n^sfx cat\n白猫趴在你腿上睡着了。\n你一个小时没敢动。`, `^prop ct cat 11 5\n白猫盯着空无一人的墙角，尾巴竖了起来。\n^fx flicker\n墙角，什么都没有。它还是盯着。`],
  canmian: [`^stage classroom\n^at 学生 9\n^at 学生乙 12\n你在暮阳中学的黑板上写了“下课”。\n^out 学生\n^out 学生乙\n第二天，粉笔字旁边多了一个笑脸。`, `^stage classroom\n你给二十四个人偶掸了灰，一个一个念它们的名字。\n^sfx whisper\n念到最后一个的时候，屋里响起一声很轻的“到”。`, `^stage classroom\n^at 学生丙 11\n有一个人偶的校牌歪了。你帮它扶正。\n它的头，跟着你的手，转了一点点。`] };

/* —— 17 东郊乐园倒计时：租下停车场以后开始，十天一阶段，自动结算 —— */
const EAST = { target: [150, 250, 350], money: [400, 700, 1000], fans: [500, 1000, 2000] };
function eastStart() { const f = FN(); if (f.east || !C.f.parking) return; f.east = { d0: C.day, got: 0, ppl: 0, res: [] }; }
function eastTick() { const f = FN(); eastStart(); const e = f.east; if (!e || e.got >= 3) return; if (C.day - e.d0 < (e.got + 1) * 10) return; const i = e.got, ok = e.ppl >= EAST.target[i];
  if (ok) { gainMoney(EAST.money[i], '阶段目标'); C.fans += EAST.fans[i]; logLine('【东郊倒计时】第 ' + (i + 1) + ' 阶段达标：' + e.ppl + '/' + EAST.target[i] + ' 人。奖励 ' + EAST.money[i] + ' 元、关注 +' + EAST.fans[i] + '。', 'gain'); }
  else logLine('【东郊倒计时】第 ' + (i + 1) + ' 阶段没达标：' + e.ppl + '/' + EAST.target[i] + ' 人。', 'warn');
  e.res.push(ok ? 1 : 0); e.got++; e.ppl = 0; if (e.got >= 3) logLine(e.res.every(x => x) ? '虚拟未来乐园开业了。开业当天，排队最长的，还是西郊那座恐怖屋。' : '虚拟未来乐园开业了。门口的人少了一些——但总有人，专门来找“真的”。', 'gain'); }
function eastText() { const e = FN().east; if (!e) return ''; if (e.got >= 3) return '虚拟未来乐园已经开业。三个阶段：' + e.res.map(x => x ? '✔' : '✘').join(' '); return '距虚拟未来乐园开业还有 ' + Math.max(0, 30 - (C.day - e.d0)) + ' 天 · 第 ' + (e.got + 1) + ' 阶段游客 ' + e.ppl + '/' + EAST.target[e.got] + '（' + EAST.money[e.got] + ' 元）'; }

/* —— 18 章节评级 —— */
const GRADE_RW = { S: [300, 1], A: [180, 0], B: [80, 0], C: [0, 0] }, GRADE_PAR = { 1: 3, 2: 3, 3: 2, 4: 3, 5: 2 };
function chStat(k) { const q = curQ(); if (!q) return; const s = FN().chs[q.ch] = FN().chs[q.ch] || { lose: 0, fail: 0, d0: C.day }; s[k] = (s[k] || 0) + 1; }
function chStart(ch) { const s = FN().chs; if (!s[ch]) s[ch] = { lose: 0, fail: 0, d0: C.day }; }
function gradeOf(ch) { const s = FN().chs[ch] || { lose: 0, fail: 0, d0: C.day }; const days = C.day - s.d0, over = Math.max(0, days - (GRADE_PAR[ch] || 3)); const sc = 100 - 15 * (s.lose || 0) - 8 * (s.fail || 0) - 4 * over; return { sc, g: sc >= 90 ? 'S' : sc >= 70 ? 'A' : sc >= 50 ? 'B' : 'C', s, days, over }; }
async function gradeCard(ch) { const r = gradeOf(ch), rw = GRADE_RW[r.g]; FN().chs[ch].g = r.g; if (rw[0]) gainMoney(rw[0], '章节评级'); if (rw[1]) C.hh.spins += rw[1]; logLine('第 ' + ch + ' 章评级：' + r.g + (rw[0] ? '（' + rw[0] + ' 元' + (rw[1] ? '、一次转盘' : '') + '）' : ''), 'gain');
  await showCard('<div class="c1">第 ' + ch + ' 章 · 评级</div><div class="grade g' + r.g + '">' + r.g + '</div><div class="c3">倒下 ' + (r.s.lose || 0) + ' 次 · 小游戏失手 ' + (r.s.fail || 0) + ' 次 · 用了 ' + r.days + ' 天' + (r.over ? '（多 ' + r.over + ' 天）' : '') + '</div><div class="c3">' + (rw[0] ? '奖励 ' + rw[0] + ' 元' + (rw[1] ? ' · 一次免费转盘' : '') : '下次可以试试更快、更少倒下') + '</div>', 900); }

/* —— 19 成就 —— */
const ACH = [
  ['a_open', '开张大吉', '第一次吓退游客', () => C.hh.good >= 1], ['a_g20', '口碑渐起', '好评 20 次', () => C.hh.good >= 20], ['a_g60', '远近闻名', '好评 60 次', () => C.hh.good >= 60], ['a_scr', '尖叫收集者', '累计收集 500 次尖叫', () => FN().scr >= 500],
  ['a_f1', '小有名气', '关注过万', () => C.fans >= 10000], ['a_f10', '现象级主播', '关注十万', () => C.fans >= 100000], ['a_rich', '第一次有存款', '手里有 3000 元', () => C.money >= 3000], ['a_spin', '转盘常客', '转盘转了 10 次', () => FN().spins >= 10],
  ['a_jack', '大奖！', '转盘转出大奖', () => FN().jack >= 1], ['a_sc6', '六个场景', '恐怖屋有六个场景', () => C.hh.scenes.length >= 6], ['a_up', '焕然一新', '翻新全部完成', () => UPGRADES.every(u => C.hh.up[u.k])], ['a_team', '鬼怪团队', '四位鬼怪员工', () => Object.keys(C.pets).filter(k => PETS[k].seal === 'ghost').length >= 4],
  ['a_aff', '心意相通', '某位员工好感 80', () => Object.values(C.pets).some(p => p.aff >= 80)], ['a_rs', '凑齐一组', '凑齐一组怨念物', () => Object.keys(RELICS).some(relicSetDone)], ['a_ra', '怨念收藏家', '十二件怨念物', () => Object.keys(RELICS).every(relicSetDone)],
  ['a_sv4', '特殊的客人', '接待 4 位特殊游客', () => Object.keys(FN().sv).length >= 4], ['a_sv8', '午夜售票员', '接待全部特殊游客', () => Object.keys(FN().sv).length >= SPECIAL.length], ['a_pf', '完美时机', '10 次完美时机', () => FN().perfect >= 10], ['a_house', '全场尖叫', '一回合吓跑一整批', () => FN().house >= 1],
  ['a_combo', '四连段', '吓游客打出四连段', () => FN().combo4 >= 1], ['a_dodge', '闪开了', '躲开一次大招', () => FN().dodge >= 1], ['a_soft', '找到软肋', '三个首领的软肋', () => Object.keys(FN().soft).length >= 3], ['a_s', '满分章节', '某一章评级 S', () => Object.values(FN().chs).some(c => c.g === 'S')],
  ['a_allS', '全 S', '五章都是 S', () => [1, 2, 3, 4, 5].every(i => FN().chs[i] && FN().chs[i].g === 'S')], ['a_door', '推开十扇门', '夜探开过 10 扇门', () => FN().doors >= 10], ['a_dm', '听话的主播', '照弹幕做了 10 次', () => FN().danmu >= 10],
  ['a_h1', '没睁眼', '镜子游戏全程没睁眼', () => qPast('q_mirror') && !C.f.mirrorFail, 1], ['a_h2', '一句话没说', '门后一句话都没说', () => C.q === 'q_end' && C.f.spoke === 0, 1], ['a_h3', '猜中了', '一开始就猜中了凶手', () => qPast('q_hut') && C.f.guess === 1, 1],
  ['a_h4', '好人有好报', '帮王琦捡起了寻人启事', () => qPast('q_hut') && C.f.helpWq, 1], ['a_h5', '我就试试', '向红衣厉鬼提了那个请求', () => !!C.f.greedy, 1]];
function checkAch(silent) { if (!C) return; const f = FN(); if (f.quietAch) { silent = 1; f.quietAch = 0; } for (const a of ACH) if (!f.ach[a[0]]) { let ok = false; try { ok = a[3](); } catch (e) {} if (ok && silent) f.ach[a[0]] = C.day; else if (ok) { f.ach[a[0]] = C.day; toast('🏆 成就：' + a[1]); logLine('🏆 成就：' + a[1] + '——' + a[2], 'gain'); sfx('big'); } } }

/* —— 20 每天第一次回到恐怖屋的小惊喜 —— */
const SUP = [
  () => C.pets.xiaoxiao && [`^at 小小 13\n^prop pp paper 11 5\n床头多了一张蜡笔画：你、她，还有一只没有脸的猫。`, () => petAff('xiaoxiao', 2)], () => C.pets.wan && [`^prop dr cup 11 5\n桌上压着一张便利贴：老板，冰箱里给你放了饮料。——徐婉`, () => addItem('drink')],
  () => C.pets.bixian && [`^prop pp paper 11 5\n桌上的纸上写着一行字：今天人多。后面画了一个笑脸。`, () => { C.fans += 30; }], () => C.pets.baimao && [`^prop ct cat 12 5\n门口放着一只死老鼠。白猫坐在旁边，等你夸它。`, () => petAff('baimao', 2)],
  () => [`^prop it coin 11 5\n柜台底下滚出来几枚硬币。不知道是谁的。`, () => gainMoney(rint(20, 60))], () => [`^fx flicker\n^sfx breath\n休息室的镜子上有一行水汽写的字：早上好。\n你没有对着镜子呵过气。`, () => { C.mp = Math.max(0, C.mp - 2); }],
  () => [`^sfx creak\n^prop dl doll 12 5\n道具间的门开着。一个人偶坐在门口，像是在等你上班。`, () => gainExp(10 + C.lv * 3)]];
function daySurprise() { if (window.__dbg && !__dbg.surp) return; if (!C || STATE.scene || STATE.battle || STATE.busy || isNight() || !C.f.open || !dailyOpen()) return; if (!['hh_rest', 'hh_door', 'hh_hall'].includes(C.loc)) return; const f = FN(); if (f.sup === C.day) return; f.sup = C.day;
  const L = SUP.map(g => g()).filter(Boolean), s = L[Math.floor(srng(C.day * 53 + 11)() * L.length)]; runScene(async () => { await T_(s[0]); s[1](); }, '早上'); }
