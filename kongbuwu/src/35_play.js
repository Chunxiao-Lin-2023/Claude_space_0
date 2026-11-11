/* 时间、移动、探索、接待游客、对峙流程、休息、买卖、日常任务、转盘。不用现实时钟（RULES 7） */
const ENTRY = { park: 'pk_gate', pingan: 'pa_road', xicheng: 'xc_gate', muyang: 'my_road', haiming: 'hm_door', kangfu: 'kf_gate' };
function isNight() { return window.__dbg && __dbg.night != null ? __dbg.night : C.tick >= BAL.duskAt; }
function clockText() { const t = C.tick; return isNight() ? ['入夜', '深夜', '午夜', '凌晨', '天快亮了'][clamp(Math.floor(t) - BAL.duskAt, 0, 4)] : ['清晨', '上午', '上午', '正午', '下午', '下午', '傍晚'][clamp(Math.floor(t), 0, 6)]; }
function passTime(n) { const wasN = isNight(); C.tick += n; if (C.tick >= BAL.dayLen) { newDay(); logLine('熬了一整夜，天亮了。第 ' + C.day + ' 天。', 'sys'); } else if (!wasN && isNight()) { logLine('天黑了。乐园关门，游客散尽。', 'sys'); sfx('wind'); } }
function setNight(t) { if (C.tick < (t || BAL.duskAt)) C.tick = t || BAL.duskAt; }
function newDay() { C.day++; C.tick = 0; C.hh.today = 0; C.hh.groups = 0; C.camp = {}; if (C.day % 30 === 1) C.hh.month = 0; }
function exitsOf(id) { const p = PLACES[id], out = []; for (const lab in p.exits) if (placeOpen(p.exits[lab])) out.push([lab, p.exits[lab]]); return out; }
function pdesc(id) { const p = PLACES[id]; return (isNight() && p.dn) || p.d; }
function go(to, quiet, force) { if (!force) { if (STATE.scene || STATE.battle || STATE.busy) return false; if (!exitsOf(C.loc).some(e => e[1] === to)) return false; } if (!PLACES[to]) return false; C.loc = to; C.seen['p_' + to] = 1; if (!quiet) sfx('page');
  STATE.walkTip = ''; if (!force) { if (isNight() && !PLACES[to].town && chance(.12)) sfx(pick(['drip', 'wind', 'door'])); npcOnArrive(); } refresh(); save(); if (!force) storyArrive(); return true; }
function areasOpen() { return Object.keys(AREAS).filter(a => !AREAS[a].open || C.f[AREAS[a].open]); }
function travel(area) { if (STATE.scene || STATE.battle || STATE.busy) return; const to = ENTRY[area]; if (!to || !areasOpen().includes(area) || PLACES[C.loc].area === area) return;
  if (C.money >= 10) { C.money -= 10; logLine('打车去' + AREAS[area].name + '（-10 元）', 'sys'); } else logLine('没钱打车，扫了辆共享单车去' + AREAS[area].name + '。', 'sys'); if (!isNight()) passTime(1); go(to, false, true); storyArrive(); }
/* 寻路：同一区域走出口，跨区域先到本区入口再打车 */
function route(from, to) { if (from === to) return []; const A = PLACES[from].area, Bz = PLACES[to].area; const bfs = (s, t) => { const q = [s], prev = { [s]: null }; while (q.length) { const c = q.shift(); if (c === t) { const r = []; let x = t; while (x !== s) { r.unshift(x); x = prev[x]; } return r; } for (const e of exitsOf(c)) if (!(e[1] in prev)) { prev[e[1]] = c; q.push(e[1]); } } return null; };
  if (A === Bz) return bfs(from, to); if (!areasOpen().includes(Bz)) return null; const a = bfs(from, ENTRY[A]), b = bfs(ENTRY[Bz], to); if (!a || !b) return null; return a.concat(['>' + Bz]).concat(b); }
let walking = 0;
async function autoWalk(to) { if (STATE.scene || STATE.battle) return false; const r = route(C.loc, to); if (!r) { toast('现在还去不了那里'); return false; } const my = ++walking;
  for (const s of r) { if (my !== walking || STATE.scene || STATE.battle) return false; if (s[0] === '>') travel(s.slice(1)); else if (!go(s, true)) return false; await sleep(160); } return C.loc === to; }

/* —— 夜里探索 —— */
const NIGHT_MOBS = { park: ['remnant'], pingan: ['dog', 'drunk', 'remnant'], xicheng: ['remnant', 'chairgirl'], muyang: ['remnant', 'redshadow'], haiming: ['remnant', 'drunk'], kangfu: ['remnant', 'onearm', 'dog'] };
const FLAVOR = { d: ['一个孩子指着恐怖屋问他妈妈：“里面是真的鬼吗？”他妈妈把他拉走了。', '旋转木马的工作人员朝你点了点头。', '有人在门口拍了张照，没进来。', '你把宣传单又压了一遍。', '风把黑帘子掀起一角，里面的冷气漏出来一点。'],
  n: ['你停下来听了一会。什么都没有。就是因为什么都没有。', '手电照过去，墙上有一道很新的划痕。', '身后好像有脚步声，你停，它也停。', '水声。这里不应该有水。', '有一扇门，你记得刚才是关着的。', '你下意识摸了摸领口的布偶，它还在。'] };
async function explore() { if (STATE.scene || STATE.battle || STATE.busy) return; const p = PLACES[C.loc], area = p.area, night = isNight(); C.ex[C.loc] = (C.ex[C.loc] || 0) + 1;
  if (!night) { logLine(pickFresh('fl_d', FLAVOR.d)); passTime(.5); refresh(); save(); return; }
  passTime(1); const r = rnd(); const lv = Math.max(1, C.lv + rint(-1, 1));
  if (r < .5) { const id = pick(NIGHT_MOBS[area] || ['remnant']); const n = chance(.3) && C.lv >= 4 ? 2 : 1; logLine(pickFresh('fl_n', FLAVOR.n)); const res = await startBattle({ mobs: Array.from({ length: n }, () => [id, lv]), title: p.name }); if (res === 'lose') await knockedOut(); }
  else if (r < .72) { const it = pick(['bread', 'smoke', 'saltbag', 'bandage', 'drink']); addItem(it); logLine('角落里有别人落下的东西。'); }
  else if (r < .8 && C.talents.includes('yintong')) { const m = rint(12, 30); logLine('阴瞳让你看清了黑暗里的东西：一个旧钱包。'); gainMoney(m); }
  else logLine(pickFresh('fl_n', FLAVOR.n));
  if (C.ex[C.loc] === 5) { logLine('这里你已经摸熟了。', 'gain'); gainExp(20 + C.lv * 6); }
  refresh(); save(); }
async function knockedOut() { C.loc = 'hh_rest'; passTime(1); const s = charStats(); C.hp = Math.round(s.mhp * .3); C.mp = Math.round(s.mmp * .3); logLine('你不记得是怎么回来的。醒来时躺在员工休息室，布偶压在胸口。', 'warn'); refresh(); save(); }
function camp() { if (STATE.scene || STATE.battle) return; C.camp = C.camp || {}; if (C.camp[C.loc]) { toast('这里今天歇过了'); return; } C.camp[C.loc] = 1; const s = charStats(); C.hp = Math.min(s.mhp, C.hp + Math.round(s.mhp * BAL.restCamp)); C.mp = Math.min(s.mmp, C.mp + Math.round(s.mmp * BAL.restCamp)); passTime(.5); logLine(PLACES[C.loc].town ? '你坐下歇了一会。' : '你背靠着墙歇了一会，一直盯着门。', 'sys'); sfx('ok'); refresh(); save(); }
function sleepBed() { if (STATE.scene || STATE.battle) return; if (!PLACES[C.loc].bed) return; if (C.f.lockNight) { toast(C.f.lockNight); return; } if (isNight()) { newDay(); fullHeal(); logLine('你睡着了。醒来是第 ' + C.day + ' 天，阳光照在脸上。', 'sys'); } else { C.tick = BAL.duskAt; const s = charStats(); C.hp = Math.min(s.mhp, C.hp + Math.round(s.mhp * .6)); C.mp = s.mmp; logLine('你睡到了天黑。', 'sys'); } sfx('ok'); refresh(); save(); storyArrive(); }

/* —— 接待游客（白天的“对峙”：把游客的胆量吓到零） —— */
function sceneList() { return C.hh.scenes.filter(s => SCENES[s] && !(s === 'ws' && C.f.wsClosed)); }
function goodRate() { const t = C.hh.good + C.hh.bad; return t ? Math.round(C.hh.good / t * 100) : 0; }
async function receive(sid) { if (STATE.scene || STATE.battle || STATE.busy) return; if (isNight()) { toast('乐园关门了，明天再营业'); return; } if (C.loc !== 'hh_door') { toast('去恐怖屋门口接待'); return; } const sc = SCENES[sid]; if (!sc) return;
  const n = rint(1, C.lv >= 3 ? 3 : 2), lv = Math.max(1, C.lv - 1 + Math.floor(sc.star)); const mobs = Array.from({ length: n }, () => [pick(sc.pool), lv]);
  logLine('一批游客买了票，进了「' + sc.n + '」。', 'sys'); const res = await startBattle({ scare: 1, scene: sid, mobs, title: sc.n + ' · 尖叫指数 ' + starTxt(sc.star) }); passTime(2); C.hh.groups++;
  if (res === 'win') { C.hh.good++; C.hh.today += n; C.hh.month += n; C.hh.total += n; const pk = C.pet.d; if (pk) petAff(pk, 3); if (C.pets.xiaoxiao) petAff('xiaoxiao', 1); dailyProg('groups', 1); }
  else { C.hh.bad++; C.hh.today += n; C.hh.month += n; logLine('“一点都不吓人。”他们在大众点评上给了一星。', 'warn'); }
  refresh(); save(); }
/* —— 对峙流程 —— */
let battleDone = null;
async function startBattle(o) { if (STATE.battle) return 'lose'; const B = battleCreate(o); STATE.battle = B; STATE.busy = false; musicMode(B.scare ? 'scare' : (o.epic ? 'door' : 'fight')); applyMode(); if (o.epic) await fxBossCard(o.epic); else await stageTransition(B.scare ? '游客进场' : '对峙');
  if (o.intro) blog(B, o.intro); if (!C.seen.tut) { C.seen.tut = 1; blog(B, '怎么打：对方卡片上写着它这回合要做什么。出现 ⚠ 就是大招——下回合落下，可以「防御」减半，也可以打懵它、打中弱点来打断。', 'sys'); blog(B, '先点对方的卡片选目标，再点手段。吃喝不占回合（每回合一次）。' + (B.scare ? '白天比的是把游客的「胆量」吓到零，你的「氛围」别被拆穿到零。' : ''), 'sys'); } battleOpenSay(B); renderBattle(); const p = new Promise(r => { battleDone = r; }); if (B.auto) botLoop(B); return p; }
function botLoop(B) { setTimeout(() => { if (STATE.battle !== B || B.result || B.phase !== 'hero' || !B.auto) return; battleAct(botAct(B)); }, (window.__dbg && __dbg.instant) ? 0 : 420); }
async function battleAct(a) { const B = STATE.battle; if (!B || B.result || B.phase === 'anim') return;
  if (B.phase === 'hero') {
    if (a.t === 'flee') { if (B.o.story || B.scare) { toast(B.scare ? '游客还在里面，老板不能跑' : '这一场躲不掉'); return; } if (C.gear.includes('g_shoes') || chance(.6)) { B.result = 'flee'; blog(B, '你转身就跑，没有回头。'); return battleFinish(); } blog(B, '没跑掉！', 'warn'); a = { t: 'guard' }; }
    if (a.t === 'candy') { if (!B.o.candy || B.candyUsed || !itemN('candy')) return; B.candyUsed = true; takeItem('candy'); B.phase = 'anim'; renderBattle(); await candyScene(B); B.pet = petUnit('zhangya'); B.pet.hp = B.pet.mhp; B.petDown = false; blog(B, '张雅身穿红衣，从你的影子里走了出来。', 'epic'); B.phase = 'hero'; renderBattle(); if (B.auto) botLoop(B); return; }
    if (a.t === 'sk' && SKILLS[a.k] && C.mp < SKILLS[a.k].cost) { toast('精神不够（需要 ' + SKILLS[a.k].cost + '）'); return; }
    B.pick.hero = a; sfx('tap'); if (B.pet && B.pet.hp > 0) { B.phase = 'pet'; if (B.auto) return battleAct(petPick(B)); renderBattle(); return; } }
  else if (B.phase === 'pet') { B.pick.pet = a; sfx('tap'); }
  battleResolve(B); renderBattle(true); await fxPlay(B); if (STATE.battle !== B) return; if (B.result) return battleFinish(); B.phase = 'hero'; renderBattle(); if (B.auto) botLoop(B); }
function battleUndo() { const B = STATE.battle; if (B && B.phase === 'pet') { B.phase = 'hero'; delete B.pick.hero; renderBattle(); } }
function battleItem(k, quiet) { const B = STATE.battle; if (!B || B.phase !== 'hero' || B.result) return; if (B.itemUsed) { toast('这回合已经用过东西了'); return; } const I = ITEMS[k]; if (!I || !itemN(k)) return; const h = B.hero, s = charStats();
  if (B.scare && (I.heal || I.battle)) { toast('接待游客的时候用不上'); return; } if (I.heal && h.hp >= h.mhp && !I.cure) { toast('体力是满的'); return; } if (I.mp && !I.heal && C.mp >= s.mmp) { toast('精神是满的'); return; }
  takeItem(k); B.itemUsed = true; if (I.heal) h.hp = Math.min(h.mhp, h.hp + Math.round(h.mhp * I.heal)); if (I.mp) C.mp = Math.min(s.mmp, C.mp + Math.round(s.mmp * I.mp)); if (I.cure) delete h.st.bleed;
  if (I.battle === 'salt') { B.ev = []; for (const f of alive(B.foes)) { doHit(B, h, f, .7, 'salt'); if (f.hp > 0) addSt(B, f, 'slow', 2); } if (!alive(B.foes).length) { B.result = 'win'; renderBattle(); return battleFinish(); } }
  blog(B, '陈歌用了 ' + I.ic + I.n + '（不占回合）', 'sys'); sfx('ok'); if (!quiet) renderBattle(); }
function toggleAuto() { const B = STATE.battle; if (!B) return; B.auto = !B.auto; sfx('tap'); renderBattle(); if (B.auto && B.phase === 'hero') botLoop(B); else if (B.auto && B.phase === 'pet') battleAct(petPick(B)); }
async function battleFinish() { const B = STATE.battle; if (!B) return; B.phase = 'end'; const res = B.result; let rw = null;
  if (!B.scare) C.hp = res === 'win' || res === 'flee' ? Math.max(1, Math.round(B.hero.hp)) : 1; fixHp();
  if (res === 'win') { rw = battleRewards(B); if (rw.money) gainMoney(rw.money, B.scare ? '门票' : '捡到'); if (rw.screams) { C.hh.screams += rw.screams; logLine('收集尖叫 +' + rw.screams + '（' + C.hh.screams + '/' + BAL.screamPerSpin + '）', 'gain'); } gainExp(rw.exp);
    if (B.pet && C.pets[B.pet.id]) { petGainExp(B.pet.id, rw.exp); petAff(B.pet.id, B.scare ? 1 : 2); } for (const k in C.pets) if (!B.pet || k !== B.pet.id) petGainExp(k, Math.round(rw.exp * .3)); battleWinSay(B); }
  B.rw = rw; sfx(res === 'win' ? 'big' : 'bad'); await fxStamp(res === 'win' ? (B.scare ? '吓退' : '撑住了') : res === 'flee' ? '脱身' : (B.scare ? '不吓人' : '倒下')); renderBattle();
  if (B.auto || (window.__dbg && __dbg.instant)) battleEnd(); }
function battleEnd() { const B = STATE.battle; if (!B || B.phase !== 'end') return; STATE.battle = null; applyMode(); musicMode(moodNow()); refresh(); save(); const r = battleDone; battleDone = null; if (r) r(B.result); }
function moodNow() { if (STATE.battle) return STATE.battle.scare ? 'scare' : 'fight'; if (PLACES[C.loc].art === 'inside') return 'door'; return isNight() ? (PLACES[C.loc].area === 'park' ? 'house' : 'night') : 'day'; }

/* —— 买卖 —— */
const SHOP = ['bread', 'drink', 'bandage', 'smoke', 'coffee', 'saltbag', 'g_raincoat', 'g_torch', 'g_shoes'];
function buyItem(k) { const I = ITEMS[k]; if (!PLACES[C.loc].shop) { toast('去小卖部买'); return; } if (I.k === 'gear' && itemN(k)) { toast('已经有了'); return; } if (C.money < I.price) { toast('钱不够（' + I.price + ' 元）'); sfx('bad'); return; } C.money -= I.price; addItem(k); sfx('coin'); save(); renderSide(); renderTop(); }
function sellItem(k) { const I = ITEMS[k]; if (!PLACES[C.loc].shop) { toast('去小卖部卖'); return; } if (!I.price || I.k === 'key' || !itemN(k)) return; if (C.gear.includes(k)) { toast('先卸下来'); return; } takeItem(k); gainMoney(Math.floor(I.price * BAL.sellRate)); save(); renderSide(); renderTop(); }

/* —— 黑色手机：日常任务（每天凌晨刷新，只能领一个）与恐怖大转盘 —— */
const DAILY = {
  easy: [{ k: 'spend', n: 40, t: '想要给游客提供一场完美的惊悚之旅，那么你需要注意场景的整洁。花 40 元修缮道具、清理场地。', r: '好评 +2，经验' }, { k: 'spend', n: 70, t: '道具和机关过于陈旧会让游客出戏。花 70 元更换一批皮料和线。', r: '好评 +3，经验' }],
  normal: [{ k: 'groups', n: 2, t: '在引人注目物体的反方向设计惊吓点。今天成功吓退 2 批游客。', r: '一次免费恐怖转盘机会' }, { k: 'groups', n: 3, t: '张弛有度，才能带给游客最佳的体验。今天成功吓退 3 批游客。', r: '一次免费恐怖转盘机会，功能饮料' }],
  nm: [{ k: 'mini', g: 'mirror', t: '午夜独自站在镜子前，点一根蜡烛，闭上眼，念自己的名字。无论发生什么，都不要睁开眼睛。', r: '直接作用在你身上的东西' }, { k: 'mini', g: 'water', t: '深夜的浴室总会发出奇怪的声音。把头埋进水里，屏住呼吸六十秒。', r: '直接作用在你身上的东西' }, { k: 'mini', g: 'guest', t: '把一双穿过的拖鞋放在门外，床铺整理成有人熟睡的样子，你躺在床下。不要出声。', r: '直接作用在你身上的东西' }]
};
function dailyOpen() { return MAIN.findIndex(q => q.id === C.q) > MAIN.findIndex(q => q.id === 'q_wheel') || C.q === 'q_end'; }
function dailyRoll() { if (C.daily.day === C.day) return; const r = srng(C.day * 977 + C.made % 1000); const p = a => a[Math.floor(r() * a.length)]; C.daily = { day: C.day, got: '', done: 0, prog: 0, opts: { easy: p(DAILY.easy), normal: p(DAILY.normal), nm: p(DAILY.nm) } }; }
function dailyProg(k, n) { const d = C.daily; if (d.day !== C.day || !d.got || d.done) return; const T = d.opts[d.got]; if (T.k !== k) return; d.prog += n; if (d.prog >= T.n) dailyFinish(); }
function dailyFinish() { const d = C.daily, T = d.opts[d.got]; d.done = 1; sfx('phone'); if (d.got === 'easy') { C.hh.good += T.n >= 70 ? 3 : 2; gainExp(15 + C.lv * 5); logLine('【黑色手机】简单难度日常任务完成。好评增加。', 'phone'); }
  else if (d.got === 'normal') { C.hh.spins++; if (T.n >= 3) addItem('drink'); logLine('【黑色手机】一般难度日常任务完成，获得一次免费恐怖转盘机会。', 'phone'); }
  else { C.bonus.hp += 8; C.hp += 8; gainExp(30 + C.lv * 10); logLine('【黑色手机】不得不说你是幸运的。噩梦难度日常任务完成：体力上限 +8。', 'phone'); } save(); }
async function dailyTake(which) { if (STATE.scene || STATE.battle) return; dailyRoll(); const d = C.daily; if (d.got) { toast('每天只能领取一个任务'); return; } const T = d.opts[which];
  if (which === 'nm') { if (!isNight()) { toast('噩梦任务要等到夜里'); return; } if (PLACES[C.loc].area !== 'park') { toast('回恐怖屋再做'); return; } d.got = 'nm'; closeSide(); await runScene(async () => { await T_(`@|确定接受噩梦难度日常任务？接受后，有可能会引发未知情况出现。\n|${T.t}`); const ok = await miniGame(T.g, {}); if (ok) { await nar('你撑过去了。手心全是汗。'); dailyFinish(); } else { C.hp = Math.max(1, Math.round(C.hp * .5)); C.mp = Math.round(C.mp * .4); d.done = 2; await nar('你没撑住。醒来的时候天花板在转。今天的噩梦任务失败了。'); } }); return; }
  if (which === 'easy') { if (C.money < T.n) { toast('钱不够（' + T.n + ' 元）'); return; } C.money -= T.n; d.got = 'easy'; dailyFinish(); } else { d.got = 'normal'; d.prog = 0; logLine('【黑色手机】已接受一般难度日常任务。', 'phone'); sfx('phone'); }
  save(); renderSide(); refresh(); }
const WHEEL = [['drink', 20, 2], ['coffee', 14, 1], ['saltbag', 16, 3], ['bandage', 12, 2], ['$', 22, 0], ['fruit', 8, 1], ['g_torch', 4, 1], ['smoke', 4, 3]];
async function spinWheel() { if (STATE.scene || STATE.battle || STATE.busy) return; if (!C.f.wheel) { toast('转盘还没有激活'); return; } if (C.hh.spins > 0) C.hh.spins--; else if (C.hh.screams >= BAL.screamPerSpin) C.hh.screams -= BAL.screamPerSpin; else { toast('尖叫不够（' + C.hh.screams + '/' + BAL.screamPerSpin + '）'); return; }
  STATE.busy = true; for (let i = 0; i < 14; i++) { sfx('spin'); const e = $('#wheelv'); if (e) e.textContent = pick(['☠', '🍑', '💀', '🕯', '👁', '🩸', '🎭']); await sleep(60 + i * 14); } STATE.busy = false;
  let pool = WHEEL.filter(w => !(ITEMS[w[0]] && ITEMS[w[0]].k === 'gear' && itemN(w[0]))); let tot = pool.reduce((a, w) => a + w[1], 0), r = rnd() * tot, c = pool[0]; for (const w of pool) { r -= w[1]; if (r <= 0) { c = w; break; } }
  if (c[0] === '$') { const m = rint(40, 110); gainMoney(m, '转盘'); logLine('【黑色手机】抽奖完成，指针停在一沓纸钱上——是真钱。', 'phone'); } else { addItem(c[0], c[2]); logLine('【黑色手机】抽奖完成！恭喜你获得 ' + ITEMS[c[0]].n + '。', 'phone'); }
  sfx('big'); save(); renderSide(); renderTop(); }
