/* 剧情：按原著顺序走，文字全部原创改写（RULES 1）。步骤按 id 存档；选择写进 C.f，后面一定读到。 */
const CH_NAMES = { 1: '第一章 · 濒临倒闭的恐怖屋', 2: '第二章 · 午夜逃杀', 3: '第三章 · 红舞鞋', 4: '第四章 · 暮阳中学', 5: '第五章 · 第三病栋' };
const F = () => C.f, L = d => clamp(C.lv + (d || 0), 1, 40);
function nar(t) { journalAdd('', t); return dlgShow({ text: t }); }
function say(who, t) { journalAdd(who, t); return dlgShow({ who, text: t }); }
function me(t) { return say('陈歌', t); }
function ph(t) { journalAdd('黑色手机', t); return dlgShow({ kind: 'ph', text: t }); }
function choose(list, text) { return dlgShow({ choices: list, text: text == null ? null : text, who: '' }); }
/* 一段台本：每行 “谁|话”。空=旁白，我=陈歌，@=黑色手机，>=弹幕（／分隔），!=惊吓，#=整屏旁白（／分行），~=音效，%=震屏 */
async function T_(s) { const my = STATE.run; for (let ln of s.split('\n')) { ln = ln.trim(); if (!ln) continue; if (my !== STATE.run) return new Promise(() => {}); const sp = /^(#m|#r|[@#!~>%^])\|?/.exec(ln); const i = sp ? -1 : ln.indexOf('|'), who = sp ? sp[1] : i < 0 ? '' : ln.slice(0, i), t = sp ? ln.slice(sp[0].length) : i < 0 ? ln : ln.slice(i + 1);
    if (who === '^') { if (/^wait /.test(t)) await sleep(+t.slice(5)); else stageCmd(t); } else if (who === '>') danmu(t.split('／')); else if (who === '!') { STG.flash = 1; STG.shake = .5; await scare(t); } else if (who === '#') await cine(t.split('／')); else if (who === '#m') await cine(t.split('／'), 'mem'); else if (who === '#r') await cine(t.split('／'), 'red'); else if (who === '~') sfx(t); else if (who === '%') shake();
    else if (who === '@') await ph(t); else if (who === '我') await me(t); else if (who === '') await nar(t); else await say(who, t); } }
/* 夜里大战前：先被追、躲藏，拿到东西或者等员工准备好再打（RULES 23） */
async function chasePhase(o) { const c = o.chase; o.chase = null; const s = charStats(); C.hp = Math.max(C.hp, Math.round(s.mhp * .6)); const r = await chaseRun(c); const n = o.mobs.length; o.pre = (o.pre || []).slice();
  if (r === 'ok') { for (let i = 0; i < n; i++) o.pre.push([i, 'vuln', 2]); o.pre.push([0, 'stun', 1]); o.intro = (c.ok || c.ready || '你回过头。') + '（先手：对方破绽 + 发懵）' + (o.intro ? ' ' + o.intro : ''); logLine('甩开了：' + (c.ok || c.ready || ''), 'gain'); }
  else { C.hp = Math.max(1, C.hp - Math.round(s.mhp * .25)); o.pre.push([0, 'rage', 2]); o.intro = (c.caught || '你被追上了。') + '（体力 -25%，对方暴怒）' + (o.intro ? ' ' + o.intro : ''); logLine('被追上了：' + (c.caught || ''), 'warn'); chStat('fail'); } }
async function fight(o) { o = Object.assign({ story: 1 }, o); if (o.chase) await chasePhase(o); { const s = charStats(); C.hp = Math.max(C.hp, Math.round(s.mhp * .6)); C.mp = Math.max(C.mp, Math.round(s.mmp * .6)); } for (;;) { const res = await startBattle(o); if (res === 'win') { if (o.scare) { C.hh.good++; C.hh.batches++; } return true; } chStat('lose'); const s = charStats(); C.hp = Math.max(C.hp, Math.round(s.mhp * .7)); C.mp = Math.max(C.mp, Math.round(s.mmp * .7));
    const c = await choose([['再来一次', '体力和精神回到七成'], ['调低难度再来', '现在：' + DIFF[SET.diff].n], ['咬牙撑过去', '跳过这一场，剧情照常往下走']], o.scare ? '游客打着哈欠往外走。' : '眼前黑了一下。你扶着墙，又站了起来。'); if (c === 1) { SET.diff = Math.max(0, SET.diff - 1); saveSet(); } if (c === 2) return false; if (o.candy && !itemN('candy')) addItem('candy', 1, true); } }
function curQ() { return C ? MAIN.find(q => q.id === C.q) || null : null; }
function qIdx(id) { const i = MAIN.findIndex(q => q.id === id); return i < 0 ? 999 : i; }
function qPast(id) { return qIdx(C.q) > qIdx(id); } /* id 这一步已经做完 */
function questWhere(q) { if (q.need && q.needAt && q.need()) return q.needAt; return typeof q.at === 'function' ? q.at() : q.at; }
function questBlocked(q) { return !!(q && q.need && q.need()); }
function sinceBatch() { return C.hh.batches - (C.qMark || 0); }
/* 调查：几样东西挨个看，看够 need 样才能往下走（让长段剧情有事可做） */
async function look(prompt, items, need) { const seen = new Set(); need = need == null ? items.length : need;
  for (;;) { const left = items.map((it, i) => [it, i]).filter(x => !seen.has(x[1])); if (!left.length) break; const opts = left.map(x => [x[0][0]]); if (seen.size >= need) opts.push(['（够了，继续）', '']);
    const c = await choose(opts, prompt + (seen.size < need ? '（还要看 ' + (need - seen.size) + ' 样）' : '')); if (c >= left.length) break; seen.add(left[c][1]); const it = left[c][0]; if (typeof it[1] === 'function') await it[1](); else await T_(it[1]); } }
function questGoal(q) { if (questBlocked(q)) return q.need(); const need = q.night && !isNight() ? '（要等到天黑）' : q.day && isNight() ? '（要等到天亮）' : ''; return q.goal + need; }
async function runScene(fn, title) { if (STATE.scene) return; const my = ++STATE.run; STATE.scene = true; stageSceneStart(); const q = curQ(); STATE.jr = { t: title || (q ? q.title : '片段'), ch: q ? q.ch : 0, l: [] }; DLG.prev = ''; DLG.cur = null; UI.lastWho = ''; applyMode();
  try { await fn(); if (C.fun && C.fun.gradeQ) { const g = C.fun.gradeQ; C.fun.gradeQ = 0; await gradeCard(g); } } catch (e) { console.error(e); if (window.__dbg) __dbg.err = String(e && e.stack || e); } if (my !== STATE.run) return; if (STATE.jr.l.length > 1) { JOURNAL.push(STATE.jr); saveJournal(); } STATE.jr = null; STATE.scene = false; DLG.cur = null; refresh(); save(); }
function storyHereRun() { const q = curQ(); if (!q || STATE.scene || STATE.battle || questWhere(q) !== C.loc) return; if (questBlocked(q)) { toast(q.need()); return; } closeSide();
  if (q.night && !isNight()) { setNight(); logLine('你一直等到天黑。', 'sys'); } else if (q.day && isNight()) { newDay(); fullHeal(); logLine('你等到了天亮。第 ' + C.day + ' 天。', 'sys'); }
  return runScene(async () => { const ch0 = q.ch; STATE.qAbort = 0; await q.run(); if (C.q === q.id && !STATE.qAbort) questAdvance(q); STATE.qAbort = 0; }, q.title); }
function storyArrive() { const q = curQ(); if (q && q.auto && questWhere(q) === C.loc && !questBlocked(q) && !(q.day && isNight()) && !STATE.scene && !STATE.battle) storyHereRun(); }
function questAdvance(q) { const i = MAIN.indexOf(q), nx = MAIN[i + 1]; if (!nx || nx.ch !== q.ch) { FN().gradeQ = q.ch; if (nx) chStart(nx.ch); } C.q = nx ? nx.id : 'q_end'; C.qMark = C.hh.batches; gainExp(Math.round(HERO.need(C.lv) * .22)); const s = charStats(); C.hp = Math.max(C.hp, Math.round(s.mhp * .5)); C.mp = Math.max(C.mp, Math.round(s.mmp * .5)); logLine('主线推进：' + (nx ? nx.title : '第一卷完'), 'gain'); save(); }

/* ================= 第一章 ================= */
async function S_open() { await cine(['半年前。凌晨两点四十四分。', '城郊一所废弃医院的走廊里，一部黑色手机的屏幕，亮了一下。', '屏幕上只有一行字：', '“你是否相信，这个世界上有鬼？”', '没有人回答。', '走廊尽头那扇门，自己关上了。'], 'red');
  await chapterCard('一', '濒临倒闭的恐怖屋', '九江市西郊 · 新世纪乐园');
  await T_(`游客|这么不吓人的鬼屋，我还是第一次见。
游客|道具太假。逛了一圈，不仅不害怕，甚至有点想笑。
游客|唯物主义者无所畏惧！
^in 游客 13
^out 游客
几个学生骑上共享单车走了，头也没回。你手里还攥着一沓没发出去的宣传单。
吓人是门技术活。可现在的人被各种惊悚片洗过一遍，进鬼屋就跟逛自家后院一样。
徐婉|老板！
一个穿护士服的娇小身影从出口跑出来，妆还没卸，嘴角挂着血浆。
徐婉|刚才那几个人占我便宜！说要跟“女尸”合照，手都搭上来了。
我|……去管理处调监控。算了，他们已经走了。
徐婉|这不是化的妆哦。（她指了指嘴角）我咬的。`);
  await T_(`她没走。站了一会，从口袋里摸出一个信封。
徐婉|老板……这是小魏的辞职信。他不好意思自己来。他说……这样下去看不到头。
我|你呢？也要走？`);
  const c = await choose([['“今天七夕，提前下班吧。”', '什么都不问'], ['“你要是也想走，我不拦你。”', '把话说开']]);
  if (c === 0) { F().wan = 'kind'; await T_(`徐婉|那……我先去卸妆了。
^to 徐婉 15
她走出两步，又回头看了你一眼。信封留在了你手里，只有一个。
^out 徐婉`); } else { F().wan = 'frank'; await T_(`徐婉|我没说要走！我就是……替他送个信。
^out 徐婉
她把信封塞给你，气鼓鼓地去卸妆了。走到拐角，脚步慢了一点。`); }
  await T_(`半年前，你的父母离奇失踪，只留下这座恐怖屋。
为了不留念想，你辞了玩具公司的工作，全心全意来经营它。
可惜时代变得太快。隔壁市的鬼屋隔一段时间就翻新一次主题，那需要钱。你连这个月的水电费都没有。
徐叔|小陈。
你下意识加快了脚步。
徐叔|装没听见是吧？（一把抓住你的肩膀）水电费和场地费，拖了几个月了。上面给我的压力很大。
我|徐叔，资金确实有点紧。再给我一个月。
徐叔|上个月你也是这么说的。`);
  const d = await choose([['“我保证，这是最后一个月。”', '硬撑'], ['把这周卖出的门票钱先交上去一些', '-20 元，徐叔会记得']]);
  if (d === 1 && C.money >= 20) { C.money -= 20; F().xushu = 'paid'; await say('徐叔', '……行吧。你这孩子，跟你爸一个脾气。我再帮你拖几天。'); } else { F().xushu = 'promise'; await say('徐叔', '一个月。到时候还是这样，这地方就要转让了。你年纪轻轻，干点什么不好，何必在这耗着？'); }
  await T_(`我|这座鬼屋对我来说不一样。它是我爸妈留给我的唯一念想。
徐叔叹了口气，没再说什么。
血浆用完了。你记得三楼的杂物间里，好像还有以前剩下的。
^sfx scrape
^prop w3 window 9 0 {"face":1}
三楼的灯坏了很久，一直没修。
^zoom w3 2.6
^sfx creak
你走到楼梯口的时候，楼上传来很轻的一声——像有人把一个箱子，往门口推了推。
^zoom off`); }
async function S_attic() { await T_(`^fx dark
晚上十点，最后一批游客骂骂咧咧地走了。今天的门票钱，刚够交一半电费。
我|三楼还堆着爸妈留下的东西。……有些，该收拾了。`);
  const r = await nt('attic', { autoF: { k_believe: 2 } }); if (!r) return;
  F().believe = r.f.k_believe != null ? r.f.k_believe : 2;
  await T_(`~phone
@你心中所想，即是答案。从这一刻起，你将正式接替我，成为恐怖屋的新主人。
@当然，这并不是一件值得庆贺的事情。新手教程的最后，送你一句忠告：自杀是最懦弱的行为，请努力的活下去。
我|……这中二的语气，怎么跟我老爹有点像。
@九江市西郊恐怖屋　状态：濒临倒闭　好评度：无　今日游览人数：四　当月游览人数：十
@我的鬼怪团队成员：无。　现有设施场景：僵尸复活夜（尖叫指数无）；冥婚（尖叫指数半颗星）。
@可解锁恐怖场景：午夜逃杀（一星）；第三病栋（三星）。
你盯着“第三病栋”四个字看了很久。爸妈失踪的地方，就是一所废弃的医院。
我|这游戏……是以我的鬼屋为原型做的？还是说，在游戏里改变鬼屋，现实也会跟着变？`);
  F().phone = 1; addItem('phone'); addItem('ragdoll'); learnSkill('doll'); toast('底栏多了「📱 手机」'); }
async function S_daily1() { await T_(`@日常任务每日凌晨刷新，每天只能领取一个，难度不同，奖励不同。（注意！个别任务极度危险，请慎重选择！）
@简单：没有故事的鬼屋就没有灵魂，重新撰写僵尸复活夜和冥婚的背景故事。
@一般：今夜凌晨之前，修补好恐怖屋里所有的人偶模型。
@噩梦：独自一人太孤单了吗？来玩个游戏吧，我保证你会终身难忘。`);
  const c = await choose([['一般：修人偶', '稳妥'], ['噩梦：那个“游戏”', '难度越高，奖励越丰厚——但他今晚选了稳妥的']], '先从哪个开始？');
  if (c === 1) await me('万一是个坑……先从一般难度试试水。噩梦的，明晚再说。');
  setClock(8, '晚上 11 点');
  const r = await nt('daily1'); if (!r) return; const ok = r.kind === 'end';
  await T_(`~phone
@你已完成一般难度日常任务。专注细节，才能营造出真正的恐怖氛围。奖励：背景曲目《黑色星期五》。
我|《黑色星期五》？传说听过的人里有一百多个自杀，原曲早就失传的那首？
你按下播放。只听了第一个小节。
#黑暗里有什么东西醒了。／你做过的、想忘掉的事，一件一件自己走了回来。／像掉进一条没有尽头的隧道。
一曲终了，你后背全湿了。幸亏没点循环。
我|这手机……奖励是真的会出现在现实里。`);
  addItem('cd'); learnSkill('friday'); if (ok) gainExp(20); }
async function S_mirror() { setClock(10, '凌晨 2:44'); await T_(`^fx dark
凌晨。日常任务刷新了，噩梦难度那一条，一个字都没变。
我|我是开鬼屋的，每天琢磨怎么吓人。这种东西……正好全程录下来。`);
  const r = await nt('mirror'); if (!r) return;
  if (r.f.k_fail || r.kind === 'skip') F().mirrorFail = 1;
  await T_(`^fx tv
录像回放：25 分 14 秒，镜面自己裂开。镜子里那个“你”，开始往外撞。
^fx clear
^fx dark
~phone
@不得不说你是幸运的。恭喜你完成噩梦难度日常任务！奖励：初级天赋技能——殓容。
@第一次完成噩梦难度日常任务，获得称号「噩梦之城新人」。额外奖励：解锁一星恐怖场景「午夜逃杀」的试炼任务。
我|噩梦任务的奖励……是直接作用在我身上的。`);
  learnTalent('lianrong'); gainTitle('rookie'); F().know_ws = 1;
  const c = await choose([['把完整视频传到灵异论坛', '懂的人自然懂'], ['只剪最后十四秒，发短视频平台', '凌晨三点，正等着看小姐姐的路人']], '这段录像……');
  F().video = c; if (c === 1) { C.fans += 500; await T_(`>前排提示！高能！／这特么是合成的吧／日了狗，大半夜的，手机屏幕摔碎了／镜子为什么会自己裂？！／UP 主头像是西郊一家鬼屋，这是广告
评论区直接沦陷。你在个人介绍那一栏，附上了恐怖屋的地址，后面加了个括号：一点都不恐怖的恐怖屋。`); } else { C.fans += 180; await T_(`>25分14秒高能！／热胀冷缩吧，房间温度不均匀／镜子属阴，极易招邪，这视频应该叫镜中有鬼／如果不是合成的我实名倒立……／难道就我发现了吗？上传者头像是西郊一家鬼屋
私信一条接一条。你一概没回，只在个人介绍里附上了恐怖屋的地址。`); }
  await nar('你靠着墙睡着了。'); await dayCard('早上 8:30'); go('hh_door', true, true); }
async function S_firstday() { await T_(`八点四十五。离乐园开门还有十五分钟。
徐婉|老板！乐园门口有人在排队，专门来咱们恐怖屋的！咱们有游客了！
我|有游客不是很正常吗，看你一副没见过世面的样子。
你偷偷看了一眼手机：关注破了五百，评论区硝烟弥漫。有人留言说昨晚被吓得尿了一床，现在刀已经磨好，正在路上。
` + (F().video === 1 ? '门口排队的大多是凌晨被那十四秒吓到的路人，揣着一肚子火。' : '门口排队的大多是论坛上的灵异爱好者，带着手电和录音笔，想看看视频里那面镜子。') + `
我|……好像玩得有点大。小婉，今天的主题是冥婚。你的妆，我亲自来画。
徐婉|老板你还会化妆？
你把她按在镜子前。脑子里涌进来很多不属于你的东西：配色、上妆，还有人体骨骼学、死亡学。`);
  const ok = await miniGame('makeup');
  await T_(ok ? `镜子里的人像从旧画里走出来的。徐婉看呆了，过了一会，打了个冷颤。
^fx glitch
镜子里的她眨了一下眼。镜子外面的她，没有眨。
徐婉|老板……我从来没有这么美过。可是我怎么觉得，像在看一个死人？
你这才想起来：殓容，本来就不是给活人准备的。` : `妆有点花，但灯一暗没人看得清。
徐婉|老板，我觉得你没必要对自己那么严格……`);
  gainPet('wan'); if (F().wan === 'kind') petAff('wan', 12); if (ok) petAff('wan', 8);
  await T_(`门外。
游客|找到正主了！昨晚发短视频的就是你吧？我的刀呢？
我|大家既然来了，不如进去体验一下。以毒攻毒。今天门票一律五折。
没人动。一个个躲在护栏外面，怂得你都看不下去。
鹤山|不就是个鬼屋吗？真的尸体我都见过。
高汝雪|他没骗你们。尸体对我们来说，早就习以为常。
一个戴遮阳帽、穿白色短裙的女人走过来，所过之处温度都像降了几度。九江医科大学法医学院——鹤山，和他的学姐高汝雪。
我|（刚开张就碰上法医砸场子。）
^recall tale 脚下这片地
^stage field
^fx fog
^prop g1 gravestone 4 4
^prop g2 gravestone 7 5 {"flowers":1}
^prop g3 gravestone 12 4
^prop g4 gravestone 15 5
我|进去之前，有件事要告诉二位。我们脚下这片地，五十年前是九江最大的乱葬岗。
^fx hands
^sfx wind
没有碑的坟，一层压着一层。
^stage corridor
^fx dark
^fx flicker
^creep 戴口罩的护士 14
我|三十年前建了医院，后来因为一些解释不了的事，搬走了。
^recall off
我|这座鬼屋，就是用医院旧楼改的。
我|本次项目：冥婚。十五分钟内找到出口。实在害怕，就对着监控喊。
你锁上出口，跑进总控制室。本来不打算用那首曲子的。
我|是可忍，孰不可忍。`);
  go('hh_ctrl', true, true); F().open = 1;
  const win = await fight({ scare: 1, scene: 'mh', mobs: [['gaoru', L(1)], ['heshan', L(0)]], title: '冥婚 · 法医学院', intro: '总控制室。监控里，两个人走进了四合院。把《黑色星期五》和你的手段都用上。', epic: { name: '高汝雪', sub: '九江医科大学 · 法医学院', seal: '砸场', intro: ['解剖过的男人，比你牵过手的女人都多。', '“鬼屋吓人的方法，翻来覆去就那么几种。”'], phase: '我到底在害怕什么？' } });
  if (win) { await T_(`鹤山被抬出来的时候还在喊“纸人睁眼了”。
你回放了监控。四合院里的纸人，眼睛都是画上去的。
^fx tv
^stage wedding
^fx dark
可回放里，有一个纸人的头，跟着鹤山，慢慢转了半圈。
^fx clear
^stage clear
高汝雪是自己走出来的。走到太阳底下，蹲在地上哭了。
游客|……医学生被吓哭了？
游客|我、我也买一张。
~phone
@首次收集到游客尖叫，恐怖大转盘激活。赠送一次抽奖机会。`); gainTitle('boss20'); } else await T_(`高汝雪|做工不错。就是不吓人。
她走了。但是鹤山腿软了——这也算开张。
~phone
@首次收集到游客尖叫，恐怖大转盘激活。赠送一次抽奖机会。`);
  F().wheel = 1; C.hh.total += 6; C.hh.today += 6; C.hh.month += 6; go('hh_door', true, true); toast('现在可以在恐怖屋门口「接待游客」了'); }
async function S_wheel() { await T_(`生死有命，富贵在天。这里有增加寿命的灵果，亦有满含仇怨的厉鬼。
我|我运气一向一般。一般的意思是，应该抽不到最坏的那个。
你点了一下。指针越转越慢。
~spin
~spin
~phone
@抽奖完成，恭喜你获得稀有类特殊道具：被诅咒的情书（中奖概率千分之三）！
@“自高楼坠落的那一刻起，她便成了校园中的禁忌。红色的舞鞋，染血的校服，连那个名字都不能提。直到有一天，又有人收到了她的情书。”
@首次抽奖抽中厉鬼，解锁稀有称号：厉鬼眷顾者。
我|千分之三。这是天要亡我？
^stage wedding
^fx dark
你站在西厢房里，手里多了一张信纸。地上，你的影子旁边，多了一道影子。
^in 张雅 4
^fx red
^fx pulse
^zoom 张雅 1.8
它慢慢靠过来，和你的影子叠在了一起。
^zoom off
^fx pulse off
我|……我这辈子收到的第一封情书。
^out 张雅
^fx clear`);
  addItem('letter'); gainTitle('favored'); F().zhangya = 1;
  await T_(`@午夜逃杀试炼任务：破旧的公寓楼内住进了一个危险的精神病患者，他手持剪刀和铁锤，正在你的房门外徘徊。
@是否接受？注意：试炼任务只存在二十四小时，若未接受，本场景将永远无法解锁。地点：平安公寓。要求：在那里住一晚，存活至天亮。`);
  await choose([['接受', '这个任务只能做一次']]); F().a_pingan = 1;
  await T_(`你翻出九个月前的一条投诉留言，才问到平安公寓在哪：西郊更西，树林深处。
下午四点半，你在道具间清点：身份证、手机、充电宝、打火机、水果刀、多用工具锤。布偶也带上。
我|小婉，今天提前下班，你来锁门。……希望她明天别在早间新闻上看到我。`);
  learnSkill('knife'); learnSkill('feint'); addItem('drink', 2); toast('地图上多了「平安公寓」：从乐园广场打车去'); }

/* ================= 第二章 ================= */
async function S_trial() { await chapterCard('二', '午夜逃杀', '平安公寓 · 从前叫富安公寓'); setClock(7, '晚上 7 点');
  const r = await nt('trial'); if (!r) return;
  if (r.f.k_helpWq) F().helpWq = 1;
  go('pa_208', true, true); }
async function S_wangqi() { setClock(7, '晚上 8 点');
  const r = await nt('wangqi', { autoF: { k_guess: 2 } }); if (!r) return;
  F().guess = r.f.k_guess != null ? r.f.k_guess : 2; }
async function S_live() { setClock(8, '晚上 10 点');
  await T_(`^call 鹤山
你唯一能求助的“专业人士”，是白天被吓晕的那个医学生。
鹤山|老大！我一直在等你发新视频！……你说你现在在哪？凶宅？隔壁可能住着杀人犯？！报警啊！
我|一报警，今晚就白来了。不过你提醒了我——我可以开直播。真出了事，直播间里的人能替我报警，录像就是证据。`);
  liveOn(40);
  const r = await nt('live'); if (!r) return;
  await T_(`>主播你身后！！！／门缝下面！／我截图了你们看／主播回去还敢睡吗`); }
async function S_3f() { setClock(9, '凌晨 1 点');
  const r = await nt('f3'); if (!r) return;
  if (r.f.k_seen) F().seen3f = 1;
  await T_(`>黑屏了？？／刚才那是尸体吗／已报警，主播撑住`); }
async function S_escape() { setClock(10, '凌晨 2 点');
  const r = await nt('escape'); if (!r) return;
  go('pa_woods', true, true); learnTalent('run'); }
async function S_hut() { setClock(10, '凌晨 3 点');
  const r = await nt('hut'); if (!r) return;
  F().wqAxe = 1;
  await T_(`^out 王琦
^stage apt
^fx clear
^prop cr car 3 5
一刻没停，一直跑到看见水泥路。警灯。
我|是我报的警！我抓住了五年前灭门案的凶手！
李队|你就是那个开直播的？……小伙子，命挺大。
王琦当场落网，公寓里其他几个房客也相继被抓。
李队|房东本来只是老爷子的护工，见财起意，伙同几个在逃的人霸占了公寓。墙里的尸体不是他们干的——他们是怕说不清，才想偷偷埋掉。
李队|手背纹牡丹的那个叫张鹏。赌徒，欠了几十万高利贷，入室盗窃、抢劫。只有他还没归案。你最近当心点。
你找各种理由赖在公寓不走：回 208 拿包，带警察看三楼。一直折腾到早上六点。
~phone
@玩家在规定时间内抵达任务场地，成功找出凶手，并存活至天亮，午夜逃杀试炼任务完成！全新恐怖场景「午夜逃杀」已解锁。
@试炼任务完成度超过百分之九十，获得隐藏道具：王琦的寻人启事（怨念值十一）。
我|这也算奖励？怎么看都像诅咒。
警车把你送回了乐园。早间新闻里，你的脸打了码。
徐婉|老板，你上电视了！！`);
  liveOff(); C.fans += 900; C.hh.scenes.push('ws'); addItem('notice'); F().zhangpeng = 1; await dayCard('早上 7 点'); go('hh_rest', true, true); C.f.lockArea = 0; }
async function S_scene() { await T_(`三楼变了。错综的通道，烧焦的屋顶，随处可见疤痕一样的刀痕。新场景占了整个三层，还吃掉了冥婚和僵尸复活夜的一角。
@注意：恐怖屋内部空间已不足，扩建之后，才能继续解锁全新恐怖场景！
今天的一般难度任务不难：在引人注目的东西的反方向，设计惊吓点。你用了一个中午。
~phone
@恭喜你获得任务奖励——碎颅医生的制服！
一件染血的白大褂，一张人皮面具，一把四十多厘米长的铁锤。
鹤山|老大！我把寝室的人都带来了。他们不信有鬼屋能吓哭学姐。
我|正好。三楼新做了一个场景，叫午夜逃杀。你们胆子大，帮我试试效果。
徐婉|老板，这个制服……我穿？大了两号啊。
我|锤子拖在地上走，效果更好。`);
  addItem('uniform'); addItem('g_mask'); learnSkill('chase'); learnSkill('skull');
  const win = await fight({ scare: 1, scene: 'ws', mobs: [['med', L(0), '老赵'], ['med', L(0), '慧姐'], ['heshan', L(0)]], title: '午夜逃杀 · 法医学院寝室团' });
  await T_(`${win ? '七个人进去，抬出来四个。' : '他们撑到了最后，但出来的时候没人说话。'}`);
  const r = await nt('dolls', { autoF: { k_notice: 0 } }); if (!r) return;
  const c = r.f.k_notice != null ? r.f.k_notice : 0; F().notice = c;
  await T_(`~phone
@隐藏任务完成！厉鬼好感度加一，获得平安公寓受害者残念的善意：它们将每天为你清理垃圾，保持午夜逃杀场景原貌。
我|每一个场景背后都有自己的故事。解锁它们，也算是给无家可归的“它们”，一个住处吧。`);
  gainPet('xiaoxiao'); petAff('xiaoxiao', 15); if (c === 0) petAff('xiaoxiao', 10); F().xiaoxiao = 1; C.hh.total += 9; C.hh.month += 9; }
async function S_water() { setClock(9, '凌晨 1:10');
  const r = await nt('water'); if (!r) return; const ok = r.kind === 'end' && !r.f.k_fail;
  await T_(ok ? `~phone
@你在水中闭气六十二秒。恭喜你完成噩梦难度日常任务！奖励：阴瞳。` : `~phone
@任务勉强完成。奖励：阴瞳。（完成度不足，没有额外奖励）`);
  await T_(`@阴瞳：视之不详，通之地阴，以阳身看阴神。
@解锁全新功能——厉鬼好感度。殷小小（厉鬼）：略有好感。张雅（红衣厉鬼）：情有独钟——你对她来说与众不同，她喜欢你，不过，喜欢的是死后的你。
我|……红衣厉鬼。还带专属页面。
^stage clear
^fx clear
你退出那个血红色的页面，感觉空气都清新了许多。
你找来木板，把通往午夜逃杀的员工通道封死了。镜子里的东西处理掉之前，这个场景先不开放。`);
  learnTalent('yintong'); learnSkill('yintong'); F().aff = 1; F().wsClosed = 1; if (ok) { C.bonus.hp += 10; gainExp(40); } }
async function S_zhangpeng() { await T_(`^call 李队
李队|小陈，张鹏在你那附近露面了——平安公寓一楼那个纹牡丹的。监控拍到了他的左手。他是冲你来的，你坏了他的事。
李队|我们想在乐园布控。你今晚最好别住鬼屋。
我|我不在，他会看出来的。那么狡猾的人，不会上钩。……我留下。`);
  const r = await nt('zhangpeng'); if (!r) return;
  await T_(`傍晚，你调好了冥婚场景的灯光节奏。
~phone
@张弛有度，才能带给游客最佳的体验。奖励：背景曲目《嫁衣》。注意：《嫁衣》和冥婚场景完美契合，冥婚场景尖叫指数上升为一星！`);
  addItem('jiayicd'); learnSkill('jiayi'); F().jiayi = 1; SCENES.mh.star = 1;
  await T_(`@噩梦难度：你的房间里一直住着另外一个人，你难道不想知道他是谁吗？
@是否接受张雅的好感度任务！注意！本任务存在一定危险性！
我|噩梦任务的奖励是随机的。可张雅……比镜子里那个东西高好几个级别。
你一咬牙，点了下去。
@请在接受任务一小时之内，抵达西城私立学院，天亮之前找到张雅的红色舞鞋。`);
  F().a_xicheng = 1; toast('从乐园广场打车去「西城私立学院」'); }
