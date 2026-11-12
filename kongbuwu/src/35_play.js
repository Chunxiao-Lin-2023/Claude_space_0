/* 时间、移动、探索、接待游客、翻新、对峙流程、休息、买卖、日常任务、转盘。不用现实时钟（RULES 7） */
const ENTRY = { park: 'pk_gate', pingan: 'pa_road', xicheng: 'xc_gate', muyang: 'my_road', haiming: 'hm_door', kangfu: 'kf_gate' };
function isNight() { return window.__dbg && __dbg.night != null ? __dbg.night : C.tick >= BAL.duskAt; }
const HOURS = ['早上 8 点', '上午 9 点', '上午 10 点', '中午 12 点', '下午 2 点', '下午 4 点', '傍晚 6 点', '晚上 7 点', '晚上 10 点', '午夜 0 点', '凌晨 2 点', '凌晨 4 点'];
function clockText() { return C.clk || HOURS[clamp(Math.floor(C.tick), 0, 11)]; }
/* 剧情里把钟拨到某个时刻（label 是顶栏显示的字，比如“凌晨 2:44”） */
function setClock(t, label) { C.tick = t; C.clk = label || ''; renderTop(); }
function passTime(n) { const wasN = isNight(); C.tick += n; C.clk = ''; if (C.tick >= BAL.dayLen) { newDay(); logLine('熬了一整夜，天亮了。第 ' + C.day + ' 天。', 'sys'); } else if (!wasN && isNight()) { logLine('天黑了。乐园关门，游客散尽。', 'sys'); sfx('wind'); } }
function setNight(t) { if (C.tick < (t || BAL.duskAt)) C.tick = t || BAL.duskAt; C.clk = ''; }
function newDay() { C.day++; C.tick = 0; C.clk = ''; C.hh.today = 0; C.hh.groups = 0; C.camp = {}; C.keep = {}; if (C.day % 30 === 1) C.hh.month = 0; eastTick(); }
/* 剧情里熬到第二天：先给一张小卡片，不要直接跳 */
async function dayCard(label) { newDay(); fullHeal(); C.clk = label || ''; await showCard('<div class="c1">第 ' + C.day + ' 天</div><div class="c2" style="font-size:1.4em">' + esc(label || '天亮了') + '</div>', 700); renderTop(); }
function exitsOf(id) { const p = PLACES[id], out = []; for (const lab in p.exits) if (placeOpen(p.exits[lab])) out.push([lab, p.exits[lab]]); return out; }
function pdesc(id) { const p = PLACES[id]; return (isNight() && p.dn) || p.d; }
function go(to, quiet, force) { if (!force) { if (STATE.scene || STATE.battle || STATE.busy) return false; if (!exitsOf(C.loc).some(e => e[1] === to)) return false; } if (!PLACES[to]) return false; C.loc = to; C.seen['p_' + to] = 1; if (!quiet) sfx('page');
  STATE.walkTip = ''; if (!force) { if (isNight() && !PLACES[to].town && chance(.12)) sfx(pick(['drip', 'wind', 'door'])); npcOnArrive(); } refresh(); save(); if (!force) { storyArrive(); setTimeout(daySurprise, 450); } return true; }
function areasOpen() { return Object.keys(AREAS).filter(a => !AREAS[a].open || C.f[AREAS[a].open]); }
function travel(area) { if (STATE.scene || STATE.battle || STATE.busy) return; const to = ENTRY[area]; if (!to || !areasOpen().includes(area) || PLACES[C.loc].area === area) return;
  if (C.money >= 10) { C.money -= 10; logLine('打车去' + AREAS[area].name + '（-10 元）', 'sys'); } else logLine('没钱打车，扫了辆共享单车去' + AREAS[area].name + '。', 'sys'); if (!isNight()) passTime(1); go(to, false, true); storyArrive(); }
/* 寻路：同一区域走出口，跨区域先到本区入口再打车 */
function route(from, to) { if (from === to) return []; const A = PLACES[from].area, Bz = PLACES[to].area; const bfs = (s, t) => { const q = [s], prev = { [s]: null }; while (q.length) { const c = q.shift(); if (c === t) { const r = []; let x = t; while (x !== s) { r.unshift(x); x = prev[x]; } return r; } for (const e of exitsOf(c)) if (!(e[1] in prev)) { prev[e[1]] = c; q.push(e[1]); } } return null; };
  if (A === Bz) return bfs(from, to); if (!areasOpen().includes(Bz)) return null; const a = bfs(from, ENTRY[A]), b = bfs(ENTRY[Bz], to); if (!a || !b) return null; return a.concat(['>' + Bz]).concat(b); }
let walking = 0;
async function autoWalk(to) { if (STATE.scene || STATE.battle) return false; const r = route(C.loc, to); if (!r) { toast('现在还去不了那里'); return false; } const my = ++walking;
  for (const s of r) { if (my !== walking || STATE.scene || STATE.battle) return false; if (s[0] === '>') travel(s.slice(1)); else if (!go(s, true)) return false; await sleep(160); } return C.loc === to; }

/* —— 夜里探索：精神会一点点耗掉；精神越低，越容易“看见”东西 —— */
const NIGHT_MOBS = { park: ['remnant'], pingan: ['dog', 'drunk', 'remnant'], xicheng: ['remnant', 'chairgirl'], muyang: ['remnant', 'redshadow'], haiming: ['remnant', 'drunk'], kangfu: ['remnant', 'onearm', 'dog'] };
const FLAVOR = { d: ['一个孩子指着恐怖屋问他妈妈：“里面是真的鬼吗？”他妈妈把他拉走了。', '旋转木马的工作人员朝你点了点头。', '有人在门口拍了张照，没进来。', '你把宣传单又压了一遍。', '风把黑帘子掀起一角，里面的冷气漏出来一点。', '两个初中生在门口互相推：“你先进。”“你先。”', '保洁阿姨绕着恐怖屋走，走得很远。'],
  n: ['你停下来听了一会。什么都没有。就是因为什么都没有。', '手电照过去，墙上有一道很新的划痕。', '身后好像有脚步声，你停，它也停。', '水声。这里不应该有水。', '有一扇门，你记得刚才是关着的。', '你下意识摸了摸领口的布偶，它还在。', '手电闪了两下。你拍了拍，它又亮了。', '有人在很远的地方喊了一个名字。不是你的。'] };
const LOWMP = ['你看见墙角站着一个人。眨眼，是一件挂着的外套。', '手机屏幕自己亮了一下，又黑了。黑屏里映着的不止你一个。', '你的影子比你慢了半拍。', '走廊变长了。你数过的，刚才只有六扇门。'];
async function explore() { if (STATE.scene || STATE.battle || STATE.busy) return; const p = PLACES[C.loc], area = p.area, night = isNight(); C.ex[C.loc] = (C.ex[C.loc] || 0) + 1;
  if (!night) { logLine(pickFresh('fl_d', FLAVOR.d)); passTime(.5); refresh(); save(); return; }
  passTime(1); if (!p.town) C.mp = Math.max(0, C.mp - 3); const low = C.mp < charStats().mmp * .25;
  const ev = nightEventFor(C.loc); if (ev && chance(.5)) { await runNightEvent(ev); refresh(); save(); return; }
  if (!p.town && chance(.16)) { await threeDoors(); refresh(); save(); return; }
  if (!p.town && C.f.live && chance(.12)) { await danmuAsk(); refresh(); save(); return; }
  if (low && chance(.35)) { await scare(pick(['face', 'eyes', 'hand'])); logLine(pickFresh('fl_low', LOWMP), 'warn'); C.mp = Math.max(0, C.mp - 4); refresh(); save(); return; }
  const r = rnd(); const lv = Math.max(1, C.lv + rint(-1, 1));
  if (r < (low ? .62 : .48)) { const id = pick(NIGHT_MOBS[area] || ['remnant']); const n = chance(low ? .5 : .3) && C.lv >= 4 ? 2 : 1; logLine(pickFresh('fl_n', FLAVOR.n)); const res = await startBattle({ mobs: Array.from({ length: n }, () => [id, lv]), title: p.name }); if (res === 'lose') await knockedOut(); }
  else if (r < .72) { const it = pick(['bread', 'smoke', 'saltbag', 'bandage', 'drink']); addItem(it); logLine('角落里有别人落下的东西。'); }
  else if (r < .82 && C.talents.includes('yintong')) { const m = rint(12, 30); logLine('阴瞳让你看清了黑暗里的东西：一个旧钱包。'); gainMoney(m); }
  else if (!p.town && relicCan(area) && chance(.3)) relicGain(area);
  else { if (chance(.12)) await scare('face'); logLine(pickFresh('fl_n', FLAVOR.n)); }
  if (C.ex[C.loc] === 5) { logLine('这里你已经摸熟了。', 'gain'); gainExp(20 + C.lv * 6); }
  refresh(); save(); }
async function knockedOut() { C.loc = 'hh_rest'; passTime(1); const s = charStats(); C.hp = Math.round(s.mhp * .3); C.mp = Math.round(s.mmp * .3); logLine('你不记得是怎么回来的。醒来时躺在员工休息室，布偶压在胸口。', 'warn'); refresh(); save(); }
function camp() { if (STATE.scene || STATE.battle) return; C.camp = C.camp || {}; if (C.camp[C.loc]) { toast('这里今天歇过了'); return; } C.camp[C.loc] = 1; const s = charStats(); C.hp = Math.min(s.mhp, C.hp + Math.round(s.mhp * BAL.restCamp)); C.mp = Math.min(s.mmp, C.mp + Math.round(s.mmp * BAL.restCamp)); passTime(.5); logLine(PLACES[C.loc].town ? '你坐下歇了一会。' : '你背靠着墙歇了一会，一直盯着门。', 'sys'); sfx('ok'); refresh(); save(); }
function sleepBed() { if (STATE.scene || STATE.battle) return; if (!PLACES[C.loc].bed) return; if (isNight()) { newDay(); fullHeal(); logLine('你睡着了。醒来是第 ' + C.day + ' 天，阳光照在脸上。', 'sys'); } else { C.tick = BAL.duskAt; C.clk = ''; const s = charStats(); C.hp = Math.min(s.mhp, C.hp + Math.round(s.mhp * .6)); C.mp = s.mmp; logLine('你睡到了天黑。', 'sys'); } sfx('ok'); refresh(); save(); storyArrive(); }

/* —— 接待游客（白天的“对峙”：把游客的胆量吓到零） —— */
function sceneList() { return C.hh.scenes.filter(s => SCENES[s] && !(s === 'ws' && C.f.wsClosed)); }
function sceneStar(s) { return s === 'mh' && C.f.jiayi ? 1 : s === 'zombie' && C.hh.up.zombie ? .5 : SCENES[s].star; }
function goodRate() { const t = C.hh.good + C.hh.bad; return t ? Math.round(C.hh.good / t * 100) : 0; }
/* 关注越多，每批进来的人越多（直播和短视频的作用） */
function crowd() { return 2 + Math.floor(Math.log10(C.fans + 10)) + (C.hh.up.ac ? 2 : 0); }
async function receive(sid) { if (STATE.scene || STATE.battle || STATE.house || STATE.busy) return; if (isNight()) { toast('乐园关门了，明天再营业'); return; } if (C.loc !== 'hh_door') { toast('去恐怖屋门口接待'); return; } const sc = SCENES[sid]; if (!sc) return;
  const n = rint(1, C.lv >= 3 ? 3 : 2), lv = Math.max(1, C.lv - 1 + Math.floor(sceneStar(sid))); const mobs = Array.from({ length: n }, () => [pick(sc.pool), lv]); const ppl = n * crowd() + rint(0, 2); const picky = pickyFor(mobs);
  logLine(ppl + ' 个游客买了票，进了「' + sc.n + '」。', 'sys'); const res = await startBattle({ scare: 1, scene: sid, mobs, ppl, picky, title: sc.n + ' · 尖叫指数 ' + starTxt(sceneStar(sid)) }); passTime(2); C.hh.groups++; C.hh.batches++;
  C.hh.today += ppl; C.hh.month += ppl; eastStart(); if (FN().east && FN().east.got < 3) FN().east.ppl += ppl;
  { const rv = addReview(sid, res === 'win', picky && FN().pickyWin === C.day); logLine('评论：“' + rv + '”', 'say'); if (!STATE.dayRun) toast('“' + rv + '”'); }
  if (res === 'win') { C.hh.good++; C.hh.total += ppl; const fan = Math.round(ppl * (C.hh.up.sign ? 1 : .5) * (1 + sceneStar(sid) * .3)); C.fans += fan; logLine('有人发了视频：关注 +' + fan, 'gain'); const onDuty = Object.values(((C.hh.lay || {})[sid] || {}).staff || {}).filter(k => C.pets[k]); for (const k of onDuty) petAff(k, 3); for (const k in C.pets) if (PETS[k].seal === 'ghost' && !onDuty.includes(k)) petAff(k, 1); dailyProg('groups', 1); }
  else { C.hh.bad++; logLine('“一点都不吓人。”他们在大众点评上给了一星。', 'warn'); }
  refresh(); save(); storyArrive(); }
/* —— 翻新恐怖屋 —— */
function buyUpgrade(k) { const U = UPGRADES.find(u => u.k === k); if (!U) return; if (C.loc !== 'hh_ctrl') { toast('去总控制室安排'); return; } if (C.hh.up[k]) { toast('已经装好了'); return; } if (C.money < U.price) { toast('钱不够（' + U.price + ' 元）'); sfx('bad'); return; }
  C.money -= U.price; C.hh.up[k] = 1; if (k === 'zombie') logLine('僵尸复活夜重做好了。至少僵尸的妆不再像腮红了。', 'gain'); else logLine('翻新：' + U.n, 'gain'); sfx('coin'); dailyProg('spend', U.price); save(); renderSide(); renderTop(); }
/* —— 陪员工：每天每位一次 —— */
const KEEP_T = { wan: ['你帮徐婉对了一遍台词。她念到一半自己笑场了。', '徐婉问你怎么画死人妆。你讲得很认真，她听得很认真，然后说想回家。'], xiaoxiao: ['你在床底下放了一个新做的小布偶。第二天它被摆到了枕头上。', '你陪她玩了一会捉迷藏。你一直没找到她。'],
  bixian: ['你给那支圆珠笔换了新胶带。纸上出现一个“哼”。', '你问它明天会不会下雨。它画了一个圈，又画了一把伞。'], baimao: ['你给白猫开了一个罐头。它吃完才看了你一眼。', '它趴在你腿上睡着了。你一个小时没敢动。'], canmian: ['你给二十四个人偶掸了灰，一个一个念了名字。', '你在暮阳中学的黑板上写了“下课”。第二天，粉笔字旁边多了一个笑脸。'] };
async function keepPet(k) { C.keep = C.keep || {}; if (!C.pets[k]) return; if (C.keep[k]) { toast('今天已经陪过它了'); return; } if (PLACES[C.loc].area !== 'park') { toast('回恐怖屋再说'); return; } if (STATE.scene || STATE.battle) return; C.keep[k] = 1; petAff(k, 6); passTime(.5); sfx('ok'); save();
  const sk = PET_SKIT[k]; if (sk) { closeSide(); await runScene(async () => { await T_(pickFresh('skit_' + k, sk)); }, '陪' + PETS[k].n); } logLine((sk ? '你陪' + PETS[k].n + '待了一会。' : pickFresh('keep_' + k, KEEP_T[k] || ['你陪它待了一会。'])) + '（好感 +6）', 'gain'); save(); renderSide(); renderTop(); }

/* —— 对峙流程 —— */
let battleDone = null;
const TUT = { n: '<div class="c1">怎么对峙</div><div class="c3" style="text-align:left">对方卡片上写着它<b>这回合要做什么</b>。<br>出现 <b style="color:#f66">⚠</b> 是大招：下回合才落下——可以「防御」减半，也可以把它打懵、打中弱点来打断。<br>先点对方卡片选目标，再点手段；陈歌选完轮到员工选，先后可以换。<br>吃喝不占回合，每回合一次。撑不住就开「🤖 自动」。</div><div class="c3">点任意处开始</div>',
  d: '<div class="c1">怎么接待游客</div><div class="c3" style="text-align:left">把每个游客的<b>胆量</b>吓到零，他们就尖叫着跑出去——门票、尖叫和关注都在这里来。<br>游客也会“拆穿”你：你的<b>氛围</b>被拆到零，就是一星差评。<br>每个场景擅长的手段不一样，每类游客也有自己的毛病（卡片下面的小字）。</div><div class="c3">点任意处开始</div>' };
async function startBattle(o) { if (STATE.battle || STATE.house) return 'lose'; if (o.scare && !o.turn) return houseRun(o); const B = battleCreate(o); STATE.battle = B; STATE.busy = false; musicMode(B.scare ? 'scare' : (o.epic ? 'door' : 'fight')); applyMode(); if (o.epic) await fxBossCard(o.epic); else await stageTransition(B.scare ? '游客进场' : '对峙');
  const tk = B.scare ? 'tutd' : 'tut'; if (!C.seen[tk]) { C.seen[tk] = 1; await showCard(TUT[B.scare ? 'd' : 'n'], 900); }
  if (o.intro) blog(B, o.intro); battleOpenSay(B); renderBattle(); const p = new Promise(r => { battleDone = r; }); if (B.auto) botLoop(B); return p; }
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
function tapeReady() { return itemN('tape') && C.tapeDay !== C.day; }
function battleItem(k, quiet) { const B = STATE.battle; if (!B || B.phase !== 'hero' || B.result) return; if (B.itemUsed) { toast('这回合已经用过东西了'); return; } const I = ITEMS[k]; if (!I || !itemN(k)) return; const h = B.hero, s = charStats();
  if (k === 'tape') { if (!tapeReady()) { toast('磁带今天已经放过了'); return; } C.tapeDay = C.day; B.itemUsed = true; B.ev = []; blog(B, '陈歌按下了播放键。磁带里只有哭声。', 'epic'); for (const f of alive(B.foes)) { if (B.scare) { addSt(B, f, 'fear', 3); addSt(B, f, 'vuln', 2); } else if (f.k === 'ghost') addSt(B, f, 'slow', 2); else addSt(B, f, 'weak', 2); } sfx('static'); if (!quiet) renderBattle(); return; }
  if (B.scare && (I.heal || I.battle)) { toast('接待游客的时候用不上'); return; } if (I.heal && h.hp >= h.mhp && !I.cure) { toast('体力是满的'); return; } if (I.mp && !I.heal && C.mp >= s.mmp) { toast('精神是满的'); return; }
  takeItem(k); B.itemUsed = true; if (I.heal) h.hp = Math.min(h.mhp, h.hp + Math.round(h.mhp * I.heal)); if (I.mp) C.mp = Math.min(s.mmp, C.mp + Math.round(s.mmp * I.mp)); if (I.cure) delete h.st.bleed;
  if (I.battle === 'salt') { B.ev = []; for (const f of alive(B.foes)) { doHit(B, h, f, .7, 'salt'); if (f.hp > 0) addSt(B, f, 'slow', 2); } if (!alive(B.foes).length) { B.result = 'win'; renderBattle(); return battleFinish(); } }
  blog(B, '陈歌用了 ' + I.ic + I.n + '（不占回合）', 'sys'); sfx('ok'); if (!quiet) renderBattle(); }
function toggleAuto() { const B = STATE.battle; if (!B) return; B.auto = !B.auto; sfx('tap'); renderBattle(); if (B.auto && B.phase === 'hero') botLoop(B); else if (B.auto && B.phase === 'pet') battleAct(petPick(B)); }
async function battleFinish() { const B = STATE.battle; if (!B) return; B.phase = 'end'; const res = B.result; let rw = null;
  if (!B.scare) C.hp = res === 'win' || res === 'flee' ? Math.max(1, Math.round(B.hero.hp)) : 1; fixHp();
  if (res === 'win') { rw = battleRewards(B); if (rw.picky) { FN().pickyWin = C.day; C.fans += 60; logLine('挑剔的游客被吓哭了：赏钱 +' + PICKY_MONEY + '，关注 +60', 'gain'); } if (rw.money) gainMoney(rw.money, B.scare ? '门票' : '捡到'); if (rw.screams) { FN().scr += rw.screams; C.hh.screams += rw.screams; logLine('收集尖叫 +' + rw.screams + '（' + C.hh.screams + '/' + BAL.screamPerSpin + '）', 'gain'); } gainExp(rw.exp);
    if (B.pet && C.pets[B.pet.id]) { petGainExp(B.pet.id, rw.exp); petAff(B.pet.id, B.scare ? 1 : 3); } for (const k in C.pets) if (!B.pet || k !== B.pet.id) petGainExp(k, Math.round(rw.exp * .3)); battleWinSay(B); }
  B.rw = rw; sfx(res === 'win' ? 'big' : 'bad'); await fxStamp(res === 'win' ? (B.scare ? '吓退' : '撑住了') : res === 'flee' ? '脱身' : (B.scare ? '不吓人' : '倒下')); renderBattle();
  if (B.auto || (window.__dbg && __dbg.instant)) battleEnd(); }
function battleEnd() { const B = STATE.battle; if (!B || B.phase !== 'end') return; STATE.battle = null; applyMode(); musicMode(moodNow()); refresh(); save(); const r = battleDone; battleDone = null; if (r) r(B.result); }
function moodNow() { if (STATE.house) return STATE.house.mode === 'house' ? 'scare' : 'door'; if (STATE.scene && STATE.musOv && !STATE.battle) return STATE.musOv; if (STATE.battle) return STATE.battle.scare ? 'scare' : 'fight'; if (PLACES[C.loc].art === 'inside') return 'door'; return isNight() ? (PLACES[C.loc].area === 'park' ? 'house' : 'night') : 'day'; }

/* —— 买卖 —— */
const SHOP = ['bread', 'drink', 'bandage', 'smoke', 'coffee', 'saltbag', 'g_raincoat', 'g_torch', 'g_shoes'];
function buyItem(k) { const I = ITEMS[k]; if (!PLACES[C.loc].shop) { toast('去小卖部买'); return; } if (I.k === 'gear' && itemN(k)) { toast('已经有了'); return; } if (C.money < I.price) { toast('钱不够（' + I.price + ' 元）'); sfx('bad'); return; } C.money -= I.price; addItem(k); sfx('coin'); save(); renderSide(); renderTop(); }
function sellItem(k) { const I = ITEMS[k]; if (!PLACES[C.loc].shop) { toast('去小卖部卖'); return; } if (!I.price || I.k === 'key' || !itemN(k)) return; if (C.gear.includes(k)) { toast('先卸下来'); return; } takeItem(k); gainMoney(Math.floor(I.price * BAL.sellRate)); save(); renderSide(); renderTop(); }

/* —— 黑色手机：日常任务（每天凌晨刷新，只能领一个）与恐怖大转盘 —— */
const DAILY = {
  easy: [{ k: 'spend', n: 40, t: '想要给游客提供一场完美的惊悚之旅，那么你需要注意场景的整洁。花 40 元修缮道具、清理场地。', r: '好评 +2，经验' }, { k: 'spend', n: 70, t: '道具和机关过于陈旧会让游客出戏。花 70 元更换一批皮料和线。', r: '好评 +3，经验' }, { k: 'up', n: 1, t: '安全永远是第一位的。今天在总控制室给恐怖屋添置一样新设备。', r: '好评 +3，经验，150 元补贴' }],
  normal: [{ k: 'groups', n: 2, t: '在引人注目物体的反方向设计惊吓点。今天成功吓退 2 批游客。', r: '一次免费恐怖转盘机会' }, { k: 'groups', n: 3, t: '张弛有度，才能带给游客最佳的体验。今天成功吓退 3 批游客。', r: '一次免费恐怖转盘机会，功能饮料' }],
  nm: [{ k: 'mini', g: 'mirror', t: '午夜独自站在镜子前，点一根蜡烛，闭上眼，念自己的名字。无论发生什么，都不要睁开眼睛。', r: '直接作用在你身上的东西' }, { k: 'mini', g: 'water', t: '深夜的浴室总会发出奇怪的声音。把头埋进水里，屏住呼吸六十秒。', r: '直接作用在你身上的东西' }, { k: 'mini', g: 'guest', t: '把一双穿过的拖鞋放在门外，床铺整理成有人熟睡的样子，你躺在床下。不要出声。', r: '直接作用在你身上的东西' }]
};
function dailyOpen() { return MAIN.findIndex(q => q.id === C.q) > MAIN.findIndex(q => q.id === 'q_wheel') || C.q === 'q_end'; }
function dailyRoll() { if (C.daily.day === C.day) return; const r = srng(C.day * 977 + C.made % 1000); const p = a => a[Math.floor(r() * a.length)]; C.daily = { day: C.day, got: '', done: 0, prog: 0, opts: { easy: p(DAILY.easy), normal: p(DAILY.normal), nm: p(DAILY.nm) } }; }
function dailyProg(k, n) { const d = C.daily; if (d.day !== C.day || !d.got || d.done) return; const T = d.opts[d.got]; if (T.k === 'up' && k === 'spend') k = 'up', n = 1; if (T.k !== k) return; d.prog += n; if (d.prog >= T.n) dailyFinish(); }
function dailyFinish() { const d = C.daily, T = d.opts[d.got]; d.done = 1; sfx('phone'); if (d.got === 'easy') { C.hh.good += T.n >= 70 || T.k === 'up' ? 3 : 2; if (T.k === 'up') C.money += 150; gainExp(15 + C.lv * 5); logLine('【黑色手机】简单难度日常任务完成。好评增加。', 'phone'); }
  else if (d.got === 'normal') { C.hh.spins++; if (T.n >= 3) addItem('drink'); logLine('【黑色手机】一般难度日常任务完成，获得一次免费恐怖转盘机会。', 'phone'); }
  else { C.bonus.hp += 8; C.hp += 8; gainExp(30 + C.lv * 10); logLine('【黑色手机】不得不说你是幸运的。噩梦难度日常任务完成：体力上限 +8。', 'phone'); } save(); }
async function dailyTake(which) { if (STATE.scene || STATE.battle) return; dailyRoll(); const d = C.daily; if (d.got) { toast('每天只能领取一个任务'); return; } const T = d.opts[which];
  if (which === 'nm') { if (!isNight()) { toast('噩梦任务要等到夜里'); return; } if (PLACES[C.loc].area !== 'park') { toast('回恐怖屋再做'); return; } d.got = 'nm'; closeSide(); await runScene(async () => { await T_(`@确定接受噩梦难度日常任务？接受后，有可能会引发未知情况出现。\n${T.t}`); const ok = await miniGame(T.g, {}); if (ok) { await nar('你撑过去了。手心全是汗。'); dailyFinish(); } else { C.hp = Math.max(1, Math.round(C.hp * .5)); C.mp = Math.round(C.mp * .4); d.done = 2; await nar('你没撑住。醒来的时候天花板在转。今天的噩梦任务失败了。'); } }); return; }
  if (which === 'easy') { if (T.k === 'up') { d.got = 'easy'; d.prog = 0; logLine('【黑色手机】已接受简单难度日常任务：去总控制室添置设备。', 'phone'); sfx('phone'); } else { if (C.money < T.n) { toast('钱不够（' + T.n + ' 元）'); return; } C.money -= T.n; d.got = 'easy'; dailyFinish(); } } else { d.got = 'normal'; d.prog = 0; logLine('【黑色手机】已接受一般难度日常任务。', 'phone'); sfx('phone'); }
  save(); renderSide(); refresh(); }
const WHEEL = [['drink', 20, 2], ['coffee', 14, 1], ['saltbag', 16, 3], ['bandage', 12, 2], ['$', 22, 0], ['fruit', 8, 1], ['g_torch', 4, 1], ['smoke', 4, 3], ['$$', 3, 0], ['relic', 5, 1]];
async function spinWheel() { if (STATE.scene || STATE.battle || STATE.busy) return; if (!C.f.wheel) { toast('转盘还没有激活'); return; } if (C.hh.spins > 0) C.hh.spins--; else if (C.hh.screams >= BAL.screamPerSpin) C.hh.screams -= BAL.screamPerSpin; else { toast('尖叫不够（' + C.hh.screams + '/' + BAL.screamPerSpin + '）'); return; }
  STATE.busy = true; FN().spins++; for (let i = 0; i < 18; i++) { sfx('spin'); const e = $('#wheelv'); if (e) e.textContent = pick(['☠', '🍑', '💀', '🕯', '👁', '🩸', '🎭', '💰']); await sleep(50 + i * i * 2.2); } STATE.busy = false;
  let pool = WHEEL.filter(w => !(ITEMS[w[0]] && ITEMS[w[0]].k === 'gear' && itemN(w[0])) && !(w[0] === 'relic' && !relicCan())); let tot = pool.reduce((a, w) => a + w[1], 0), r = rnd() * tot, c = pool[0]; for (const w of pool) { r -= w[1]; if (r <= 0) { c = w; break; } }
  const ev = $('#wheelv'); if (ev) ev.textContent = c[0] === '$$' ? '💰' : c[0] === 'relic' ? '🕯' : c[0] === '$' ? '💴' : ITEMS[c[0]].ic;
  if (c[0] === '$$') { const m = rint(300, 500); FN().jack++; gainMoney(m, '转盘大奖'); logLine('【黑色手机】幸运的厉鬼眷顾者！指针停在了金色的那一格：' + m + ' 元！', 'phone'); sfx('stinger'); await showCard('<div class="c1">大奖</div><div class="grade gS">💰</div><div class="c2">' + m + ' 元</div><div class="c3">转盘上从来没人见过的金色格子。</div>', 700); }
  else if (c[0] === 'relic') { const rr = relicGain(); logLine('【黑色手机】抽奖完成。指针停在一根蜡烛上——' + (rr ? rr[1] : '') + '。', 'phone'); }
  else if (c[0] === '$') { const m = rint(40, 110); gainMoney(m, '转盘'); logLine('【黑色手机】抽奖完成，指针停在一沓纸钱上——是真钱。', 'phone'); } else { addItem(c[0], c[2]); logLine('【黑色手机】抽奖完成！恭喜你获得 ' + ITEMS[c[0]].n + '。', 'phone'); }
  sfx('big'); save(); renderSide(); renderTop(); }

/* —— 夜探的专属事件：每处几件，每件一个存档只碰到一次。from = 这一步之后才会出现 —— */
const NIGHT_EV = [
  { id: 'ne_pk1', at: ['hh_2f'], from: 'q_firstday', s: `^fx dark
冥婚的正房里，一个纸人跪的方向变了。它本来朝着棺材，现在朝着门口——朝着你。`, ch: [['把它摆回去', () => { if (C.pets.xiaoxiao) petAff('xiaoxiao', 3); return `你把它转回去。手指碰到纸的时候是温的。\n床底下有什么东西咯咯笑了一声。`; }], ['不管它，退出去', () => { C.mp = Math.max(0, C.mp - 5); return `你退出去，带上了门。门缝里，那张画好的脸一直在看着你。（精神 -5）`; }]] },
  { id: 'ne_pk2', at: ['hh_3f'], from: 'q_scene', s: `^fx dark
^prop tub bathtub 8 4 {"full":1}
午夜逃杀的浴室里有水声。浴缸是满的。你记得今天下午放干了。`, ch: [['伸手把塞子拔了', () => { gainExp(20 + C.lv * 4); return `水打着旋流下去。最后一点水里，好像有一绺头发。你没细看。`; }], ['关灯，走人', () => `你关了灯。黑暗里，水面“哗”地响了一声。`]] },
  { id: 'ne_pk3', at: ['hh_ctrl'], from: 'q_daily1', s: `^fx tv
监控里，一楼走廊尽头站着一个人。一动不动。你切到下一个画面，再切回来——它近了一格。`, mini: 'peek', ok: () => { gainExp(25 + C.lv * 5); return `你一直盯着屏幕。它没有再动。天快亮的时候，那一格画面恢复了正常。`; }, bad: () => { C.mp = Math.max(0, C.mp - 8); return `你眨了一下眼。屏幕上什么都没有了。走廊里，脚步声停在了控制室门口。（精神 -8）`; } },
  { id: 'ne_pa1', at: ['pa_yard'], from: 'q_scene', s: `警戒线里，一楼那扇窗亮了一下。公寓里应该已经没人住了。`, ch: [['过去看看', () => { addItem('saltbag'); return `窗台上放着一袋盐，像是有人特意留的。屋里什么都没有。`; }], ['不去', () => `你没去。走出院子的时候，那扇窗又暗了。`]] },
  { id: 'ne_pa2', at: ['pa_woods', 'pa_hut'], from: 'q_scene', s: `^fx dark
林子里有人在挖土。铁锹一下一下。你关掉手电。挖土声也停了。`, fight: [['remnant', 0], ['dog', 0]] },
  { id: 'ne_pa3', at: ['pa_3f'], from: 'q_scene', s: `^fx dark
三楼走廊尽头的墙被凿开了，里面是空的。墙洞旁边，有人放了一束野花。`, ch: [['也站一会', () => { C.mp = Math.min(charStats().mmp, C.mp + 15); return `你站了一会儿。来的路上一直绷着的那口气，松了一点。（精神 +15）`; }]] },
  { id: 'ne_xc1', at: ['xc_dorm'], from: 'q_shoes', s: `^fx dark
宿舍走廊中间那把椅子不见了。地上有四道拖出去的痕迹，一直通到楼梯口。`, ch: [['顺着痕迹走', () => { gainExp(25 + C.lv * 4); return `痕迹在楼梯口断了。台阶上，四把椅子叠在一起，椅背全朝着墙。`; }], ['不追了', () => `你没追。走到校门口，回头看了一眼——二楼窗户边，好像坐着一个人。`]] },
  { id: 'ne_xc2', at: ['xc_dance'], from: 'q_shoes', s: `^fx dark
镜子里有人在跳舞。没有音乐，脚步声却很齐，一共六个人。你数了两遍，还是六个。`, mini: 'silent', ok: () => { if (C.f.shoes) C.mp = charStats().mmp; return `跳完最后一个动作，镜子里的人一起朝你鞠了一躬，散了。你的精神全回来了。`; }, bad: () => { C.hp = Math.max(1, Math.round(C.hp * .7)); return `你开口问了一句“谁”。镜子里五个人同时转过头来——第六个没有。（体力 -30%）`; } },
  { id: 'ne_my1', at: ['my_teach', 'my_last'], from: 'q_well', s: `^fx rain
雨里，教学楼尽头的那间教室亮着灯。有人在上课，读书声整整齐齐。`, ch: [['在门口站一会', () => { if (C.pets.canmian) petAff('canmian', 6); return `你在门口站到下课。读书声停了。黑板上，有人写了你的名字，后面画了个勾。`; }], ['敲敲门', () => { C.mp = Math.max(0, C.mp - 6); return `你敲了一下。读书声停了，灯灭了。窗户上贴满了脸。（精神 -6）`; }]] },
  { id: 'ne_my2', at: ['my_dorm'], from: 'q_pen', s: `^fx dark
第四间寝室的四把椅子又摆好了。纸上有一行字：“这次你问什么？”`, ch: [['问：“我今晚能活着出去吗？”', () => { if (C.pets.bixian) petAff('bixian', 5); return `纸上画了一个圈。圈旁边还有一个小字：废话。`; }], ['不问，把纸叠起来', () => `你把纸叠好放回椅子上。走出门的时候，背后传来一声很轻的“切”。`]] },
  { id: 'ne_my3', at: ['my_hill'], from: 'q_well', s: `^fx rain
深井已经被填上了。井口的土上，有两双小小的脚印，绕着井走了一圈又一圈。`, fight: [['remnant', 0], ['redshadow', 0]] },
  { id: 'ne_hm1', at: ['hm_3f', 'hm_303'], from: 'q_cat', s: `^fx dark
301 的电视又开了，音量很大。门没关严，屋里没有人。`, ch: [['进去关掉', () => { gainExp(20 + C.lv * 4); return `你按下开关。黑掉的屏幕上，映出你身后的走廊——303 的门开着。`; }], ['敲敲 302 的门', () => { addItem('coffee'); return `302 的年轻人隔着门缝递出来一罐咖啡。“他每晚都这样。你别管。”`; }]] },
  { id: 'ne_hm2', at: ['hm_303'], from: 'q_cat', s: `卫生间的镜子上有一层水汽。有人在水汽上写了两个字：谢谢。`, ch: [['用手抹掉', () => `你抹掉了。镜子里只有你一个人。这一次是真的只有你一个。`], ['留着', () => { C.mp = Math.min(charStats().mmp, C.mp + 10); return `你没动它。关灯的时候，那两个字还在。（精神 +10）`; }]] },
  { id: 'ne_kf1', at: ['kf_b1', 'kf_b2'], from: 'q_inside', s: `^fx dark
洗衣间的三个铁笼都空了。笼门开着，锁头被人拿走了。`, ch: [['把笼门全关上', () => { gainExp(30 + C.lv * 5); return `你一个一个关上了。最后一个关上的时候，楼上传来一声很轻的“谢谢”。`; }], ['掉头离开', () => `你没碰它们。下楼的时候，身后响起了笼门晃动的声音。`]] },
  { id: 'ne_kf2', at: ['kf_b3'], from: 'q_inside', s: `^fx dark
护士站的柜台上放着一袋新配的药。纸袋上写着名字：陈歌。`, mini: 'silent', ok: () => { addItem('bandage', 2); return `你没碰那袋药，也没出声。过了很久，纸袋上的名字自己褪掉了。柜台下面多了两卷绷带。`; }, bad: () => { C.mp = Math.max(0, C.mp - 10); return `你念出了纸袋上的名字。走廊里所有的被褥同时动了一下。（精神 -10）`; } },
  { id: 'ne_hp1', at: ['hh_park'], from: 'q_parking', s: `^fx dark
^prop st stairsdown 12 5
地下停车场。售票台那截残缺的楼梯上，坐着一个很矮的人影。你往前一步，它就往下挪一级。`, ch: [['在楼梯口放一张门票', () => { gainExp(20 + C.lv * 4); return `^prop tk paper 11 5
你撕了一张门票，压在楼梯口。
^del tk
天快亮的时候再来看，门票不见了。楼梯好像又往下多了一级。`; }], ['不打扰它', () => `你退了出去。身后很轻地响了一声，像是有人在数台阶。`]] },
  { id: 'ne_xc3', at: ['xc_field', 'xc_gate'], from: 'q_shoes', s: `^fx dark
^prop sh shoes 12 5 {"col":"#a01818"}
操场跑道正中间放着一双红色的舞鞋，鞋尖朝着艺术生活动中心。你记得那双鞋现在在恐怖屋里。`, ch: [['把它摆正，鞋尖朝外', () => { if (C.f.shoes) C.mp = Math.min(charStats().mmp, C.mp + 20); return `^del sh
你把鞋转了个方向。再回头，跑道上什么也没有了。
你的影子比平时深了一点，像有人陪着你往外走。（精神 +20）`; }], ['绕开走', () => `你绕开了。走出校门以后，身后有人踮着脚尖跟了你一段。`]] },
  { id: 'ne_my4', at: ['my_wc'], from: 'q_wc', s: `^fx dark
^prop s5 stall 10 4
^at 小男孩 9
^at 小女孩 10
第五个隔间的门开着。那两个孩子还在里面，手拉着手，看着你手里的锤子。`, ch: [['把锤子收起来，蹲下', () => { gainExp(25 + C.lv * 4); return `^to 陈歌 7
^down 陈歌
你把锤子别回腰后，蹲到和他们一样高。
女孩伸出一根手指，在你手背上画了一个圈。然后两个人一起不见了。
^out 小男孩
^out 小女孩
^up 陈歌`; }], ['轻轻带上门', () => `^del s5
你把门带上了。门那边传来很小的一声：“爸爸？”`]] },
  { id: 'ne_my5', at: ['my_office', 'my_yard'], from: 'q_last', s: `^fx rain
^prop bk book 11 5 {"col":"#3a4a7a"}
数学组的桌上又放着那本卡通画册。翻开的那一页，黑房子里的两个红色小人不见了。`, mini: 'peek', ok: () => { gainExp(30 + C.lv * 5); return `^at 小男孩 14
^at 小女孩 15
窗外，两个小小的影子站在雨里，朝后山走去。
^out 小男孩
^out 小女孩
你没有追。画册的最后一页，多了一个举着锤子的小人。`; }, bad: () => { C.mp = Math.max(0, C.mp - 8); return `你一抬头，窗玻璃上全是小小的手印。（精神 -8）`; } },
  { id: 'ne_hm3', at: ['hm_door', 'hm_3f'], from: 'q_haiming', s: `^fx dark
^prop wn window 11 3 {"lit":1}
海明公寓 303 的灯亮着。那间屋子早就没人住了。`, fight: [['remnant', 0], ['remnant', -1]] },
  { id: 'ne_kf4', at: ['kf_gate'], from: 'q_ward', s: `^fx dark
^prop tn crate 13 5
刘刀的帐篷拉链开着，里面没人。睡袋还是温的。手电照到地上，有一串光脚的脚印，朝第三病栋去了。
^prop fp footprints 11 5`, mini: 'peek', ok: () => { gainExp(30 + C.lv * 5); return `^in 刘刀 15
你在连廊口等。十分钟后，刘刀自己走了回来，眼睛是闭着的。
你把他领回帐篷。第二天他什么也不记得。
^out 刘刀`; }, bad: () => { C.hp = Math.max(1, C.hp - Math.round(charStats().mhp * .1)); return `你追过去的时候脚印断了。黑暗里有什么东西撞了你一下。（体力 -10%）`; } },
  { id: 'ne_kf5', at: ['kf_dean'], from: 'q_dean', s: `^fx dark
^prop wd wardrobe 14 4
院长办公室里，那个贴着封条的衣柜，封条断了。`, ch: [['打开衣柜', () => { addItem('saltbag', 2); return `^prop wd wardrobe 14 4 {"open":1}
衣柜里挂着一件白大褂，胸牌上的名字被刮掉了。口袋里有两袋盐——有人比你更早想到了这一招。`; }], ['重新贴上', () => { gainExp(25 + C.lv * 4); return `你用胶带把封条贴了回去。衣柜里，有人轻轻敲了两下，像是在说谢谢。`; }]] },
  { id: 'ne_kf6', at: ['kf_b3_4'], from: 'q_inside', s: `^fx dark
四楼走廊的地上，那场“黑色的雪”还没扫干净。踩上去是软的。
雪堆里伸出了一只长满毛发的手。`, fight: [['doorhand', -1]] },
  { id: 'ne_kf3', at: ['kf_b3_1'], from: 'q_inside', s: `^fx dark
十号病房的铁门后面有人在敲。三下，停一停，又三下。`, ch: [['也敲三下', () => { C.f.knock10 = 1; return `敲门声停了。很久以后，门缝里塞出来一张纸，上面只有一个数字：10。`; }], ['不回应', () => `你没有回应。敲门声跟着你，一直跟到楼梯口。`]] }
];
function nightEventFor(loc) { const list = NIGHT_EV.filter(e => e.at.includes(loc) && !C.seen[e.id] && qPast(e.from)); return list.length ? list[0] : null; }
async function runNightEvent(ev) { C.seen[ev.id] = 1; await runScene(async () => { await T_(ev.s);
  if (ev.ch) { const i = await choose(ev.ch.map(c => [c[0]])); await T_(ev.ch[i][1]()); }
  else if (ev.mini) { const ok = await miniGame(ev.mini); await T_(ok ? ev.ok() : ev.bad()); }
  else if (ev.fight) { const res = await startBattle({ mobs: ev.fight.map(m => [m[0], Math.max(1, C.lv + m[1])]), title: PLACES[C.loc].name }); if (res === 'lose') await knockedOut(); else await nar('你喘着气站了一会儿。四周又安静了。'); } }, '夜探 · ' + PLACES[C.loc].name); }
