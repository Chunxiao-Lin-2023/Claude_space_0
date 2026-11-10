/* ================= the simulated MMO world =================
   80 simulated players with personalities who level up in real time, chat in 世界/附近/公会, stand around
   in places, accept party invites, list goods on the market and join world-boss fights.  In co-op the host
   runs this and relays chat/boss state, so everyone sees the same server. */
const SERVER = '荒域 · 一区';
const FAKE_NAMES = ['∮夜雨√', '石村一霸', '咸鱼本鱼', 'Ｍ丶小可爱', '★龙傲天★', '补天阁扫地僧', '狈村卧底', '柳神的叶子', '莽牛不吃草', '一拳一个狼', '鲲鹏展翅', '小不点的哥哥', '重瞳天下', '再也不肝了', '今天也要早睡',
  '奶妈求带', '纯路人', '摸鱼大师', '青鳞鹰の蛋', '雷鸟宝骨', '工作室007', '月下独酌', '剑来', '隔壁老王', '手残党', '氪金大佬', '零氪党', '凌晨三点', '诗和远方', '社恐猎人', '无情铁手', '小月亮', '糖醋排骨',
  '虎婶的擀面杖', '欧皇附体', '非酋本酋', '会飞的猪', '霸天虎', '一只喵', '秋名山车神', '风清扬', '不要打我', '佛系玩家', '肝帝', '寂寞如雪', '大荒游侠', '边城浪子', '虚神界第一', '挖骨头的', '老坛酸菜',
  '吃货一枚', '萌新求带', '回坑了', '孤独的根号三', '路过打酱油', 'Kevin', 'Xx丶杀神丶xX', '夏天的风', '奶茶三分糖', '橘子汽水', '锅包肉', '深夜食堂', '睡不醒', '冲冲冲', '西瓜太郎', '战神归来', '小鹿乱撞',
  '豆腐脑要咸的', '温柔一刀', '南山南', '石昊的头号粉丝', '我是奶妈别打我', '天下第二', '人间值得', '笑看风云', '风吹屁屁凉', '一口一个莽牛', '夜猫子', '白给少年', '阿飞'];
const PERS = ['newbie', 'newbie', 'trader', 'leader', 'whale', 'joker', 'joker', 'helper', 'helper', 'grinder', 'grinder', 'casual', 'casual'];
const GUILDS = [
  { id: 'g1', name: '石村一家亲', desc: '萌新友好，有问必答。每天整点组队打世界首领。' },
  { id: 'g2', name: '补天', desc: '只收战力前列的玩家，冲虚神界排名。' },
  { id: 'g3', name: '咸鱼大队', desc: '佛系养老，不打卡不催上线，主打一个开心。' }];
let FAKES = [];
function genFakes() {
  const r = srng('wmol-server-1'); FAKES = FAKE_NAMES.map((name, i) => { const cls = ['mangniu', 'kunpeng', 'liushen'][Math.floor(r() * 3)], per = PERS[Math.floor(r() * PERS.length)];
    const spd = per === 'grinder' || per === 'whale' ? 0.12 + r() * 0.12 : per === 'newbie' ? 0.02 + r() * 0.03 : 0.04 + r() * 0.07;
    return { id: 'f' + i, name, cls, per, spd, lv0: 1 + Math.floor(r() * (per === 'newbie' ? 4 : 12)), gear: per === 'whale' ? 1.35 + r() * 0.2 : 0.85 + r() * 0.35, guild: r() < 0.55 ? GUILDS[Math.floor(r() * 3)].id : null, on: r(), arena: 0 }; });
}
const srvStart = () => { let t = store.get('srv', 0); if (!t) { t = now() - 2.5 * 86400000; store.set('srv', t); } return t; };
function fakeLv(f) { const h = (now() - srvStart()) / 3600000; return clamp(Math.floor(f.lv0 + f.spd * h), 1, f.per === 'newbie' ? 14 : f.per === 'grinder' || f.per === 'whale' ? BAL.lvCap : 26); }
function fakePower(f) { const lv = fakeLv(f); const K = CLASSES[f.cls]; return Math.round(((K.base.atk + K.grow.atk * lv) * 6 + (K.base.def + K.grow.def * lv) * 5 + (K.base.hp + K.grow.hp * lv) * 0.6) * f.gear * 1.35 + lv * 40); }
const fakeOnline = f => hash(f.id, Math.floor(now() / 1200000)) < 0.55 + (f.per === 'grinder' ? 0.3 : 0);
const fakeBot = f => ({ id: f.id, name: f.name, cls: f.cls, lv: fakeLv(f), gear: f.gear });
const onlineCount = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return Math.round(1180 + 520 * Math.sin((h - 14) / 24 * Math.PI * 2) + hash(Math.floor(now() / 30000)) * 90); };

/* ---------- who stands where (deterministic per 2-minute slot, so co-op partners agree) ---------- */
const ACTS_TOWN = ['在摆摊：出售强化石', '在摆摊：收兽骨', '在发呆', '在和人聊天', '刚从副本出来', '在挂机', '在喊人组队', '在研究强化', '在看悬赏榜', '坐在地上打坐'];
function fakesAt(loc) {
  const P = PLACES[loc], slot = Math.floor(now() / 120000), out = [];
  for (const f of FAKES) { if (!fakeOnline(f) || STATE.party.some(b => b.id === f.id)) continue; const lv = fakeLv(f);
    const fit = P.town ? (P.area === 'shicun' ? lv <= 8 : P.area === 'biancheng' ? lv >= 10 : lv >= 14) : P.lv && lv >= P.lv[0] - 2 && lv <= P.lv[1] + 3;
    if (!fit) continue; const h = hash(slot, f.id, loc); if (h > (P.town ? 0.22 : 0.16)) continue;
    const mob = P.mobs ? MOBS[pick(P.mobs)[0]].name : ''; const r2 = hash(slot, f.id, 'a');
    out.push({ f, lv, act: P.town ? ACTS_TOWN[Math.floor(r2 * ACTS_TOWN.length)] : r2 < 0.5 ? `正在打${mob}` : r2 < 0.7 ? '在采集' : r2 < 0.85 ? '在打坐回血' : '路过' }); if (out.length >= 6) break; }
  return out;
}

/* ---------- chat ---------- */
const CHAT = { world: [], near: [], party: [], guild: [], sys: [] };
const CH_NAME = { world: '世界', near: '附近', party: '队伍', guild: '公会', sys: '系统' };
function chatPush(ch, from, text, opts = {}) {
  const m = { ch, from, text, t: now(), me: !!opts.me, real: !!opts.real, cls: opts.cls || null }; const L = CHAT[ch]; L.push(m); if (L.length > 80) L.shift();
  if (ch !== 'world' || SET.chatWorld) uiChat(m); if (NETROLE === 'host' && !opts.noRelay && ch !== 'guild') netBroadcast({ t: 'chat', m: Object.assign({}, m, { me: false, real: m.me || m.real }) });
}
const sysMsg = (text) => chatPush('sys', '', text);
const TPL = {
  newbie: ['请问{loc}怎么走啊', '新手求问，狼穴要几级能打？', '萌新求带{dungeon}！', '突破洞天境要什么东西？', '为什么我打不过雷鸟啊啊啊', '这游戏剧情还挺好看的', '虎婶的兽奶到底被谁偷了', '刚出新手村，好激动', '有没有人带带我，我会叫爸爸', '莽牛冲锋那个蓄力怎么躲啊'],
  trader: ['收{mat}，{price}两一个，私聊', '出{eq}，{rar}，{price}两，交易行已挂', '低价出强化石，量大从优', '收太古鳞片！高价！', '卖回城符，比商店便宜两成', '出一张保护符，懂的来'],
  leader: ['【{guild}】招人啦！{lv}级以上，每晚组队打世界首领，萌新也要！', '世界首领快刷了，{guild}的兄弟们集合！', '{dungeon}开组，来个奶妈，来个坦克', '【{guild}】今晚公会活动，全员上线'],
  whale: ['又强化碎了一把+8……谁懂', '刚出了一件至宝，嘿嘿', '{eq}+9了，还有谁', '虚神界前十，有不服的来', '首领宝箱又是一堆凡品，策划出来挨打'],
  joker: ['小不点又偷喝兽奶了', '狈村的伙食是真的差', '柳神：我只是一根柳枝', '莽牛：你礼貌吗', '打雷鸟被劈成了烤鸭', '谁家的绒灵跑到边城来了', '石林虎：那是村里最后一个好木桩', '我的骨矛断了，用的是牙签吗'],
  helper: ['新人记得每天签到，第七天有首领宝箱', '强化到+5以上记得贴保护符', '狼穴带个柳神奶妈好打很多', '雷泽的雷鸟会蓄力，看到蓄力就防御', '虚神界每天5次，记得打完', '悬赏榜每天三张，经验很香'],
  grinder: ['{loc}的{mob}被我承包了', '又是刷{mob}的一天', '肝到{lv}级了，睡了睡了', '今天刷了三百头{mob}，手都麻了', '谁说{loc}没人，我在这挂了一天'],
  casual: ['有人一起去{dungeon}吗', '{boss}还有几分钟刷？', '虚神界那个重瞳少年太变态了', '晚上好啊各位', '边城客栈的说书先生又在讲小不点', '今天运气不错', '有没有一起聊天的', '刚下班，上线看看'],
};
function fillT(t, f) {
  const lv = fakeLv(f), locs = Object.values(PLACES).filter(p => p.lv && lv >= p.lv[0] - 2 && lv <= p.lv[1] + 2); const P = locs.length ? pick(locs) : PLACES.fl_path;
  const e = rollEquip(Math.max(lv, 3), 0.5, 1);
  return t.replace('{loc}', P.name).replace('{mob}', P.mobs ? MOBS[pick(P.mobs)[0]].name : '山狼').replace('{dungeon}', lv >= 15 ? '百断山' : '狼穴').replace('{mat}', ITEMS[pick(['wolfpelt', 'bullhorn', 'bone', 'feather', 'ore', 'lingyao'])].name)
    .replace('{price}', rint(5, 60)).replace('{eq}', EQB[e.b].name).replace('{rar}', BAL.rarity[e.r].n).replace('{guild}', (GUILDS.find(g => g.id === f.guild) || GUILDS[0]).name).replace('{lv}', Math.max(5, lv - 3))
    .replace('{boss}', MOBS[WORLD_BOSSES[(wbSlot() + 1) % 3].id].name);
}
function fakeSay(ch = 'world', f, text) { f = f || pick(FAKES.filter(fakeOnline)); if (!f) return; chatPush(ch, f.name, text || fillT(pick(TPL[f.per] || TPL.casual), f), { cls: f.cls }); }
const REACT = {
  level: ['恭喜', 'gg', '恭喜恭喜', '升得好快', '大佬带带'], realm: ['恭喜突破！', '大佬！', '卧槽这么快', '突破了，羡慕', '带带我！'], drop: ['欧皇！', '羡慕', '出吗？我高价收', '我刷了一天都没有', '吸吸欧气'],
  enhOk: ['666', '强化之神', '这运气……', '我碎了三把了'], enhFail: ['哈哈哈哈心疼', '节哀', '强化有风险', '一起碎，不孤单'], boss: ['谢谢大佬', '首领好肉', 'gg', '下一只在哪刷？'],
  chapter: ['剧情党！', '后面剧情更好看', '恭喜通关'], shiyi: ['卧槽重瞳少年都输了？', '大佬！虚神界新秀！', '这人什么来头'], contest: ['外门魁首！', '恭喜恭喜', '补天阁大佬']
};
function worldEvent(kind, d) { // something I did that the server would announce
  const n = esc(C.name); let s = '';
  if (kind === 'level') s = `恭喜玩家 <b>${n}</b> 升到了 ${d.lv} 级！`;
  if (kind === 'realm') s = `恭喜玩家 <b>${n}</b> 突破至 <b>${d.realm}</b>！`;
  if (kind === 'drop') s = `玩家 <b>${n}</b> 获得了 <span style="color:${BAL.rarity[d.r].c}">${BAL.rarity[d.r].n}【${esc(d.item)}】</span>！`;
  if (kind === 'enhOk') s = `玩家 <b>${n}</b> 将【${esc(d.item)}】强化到了 <b>+${d.p}</b>！`;
  if (kind === 'enhFail') s = `玩家 <b>${n}</b> 强化【${esc(d.item)}】失败了……`;
  if (kind === 'chapter') s = `玩家 <b>${n}</b> 完成了第${'一二三四'[d.ch - 1]}章剧情！`;
  if (kind === 'shiyi') s = `玩家 <b>${n}</b> 在虚神界击败了重瞳少年！`;
  if (kind === 'contest') s = `玩家 <b>${n}</b> 夺得补天阁外门大比魁首！`;
  if (kind === 'arena') s = `玩家 <b>${n}</b> 冲进了虚神界前 ${d.rank} 名！`;
  if (!s) return; if (NETROLE === 'guest') netSend({ t: 'wev', s }); else sysMsg(s);
  const R = REACT[kind]; if (R) for (let i = 0, k = rint(1, 3); i < k; i++) setTimeout(() => fakeSay('world', null, pick(R)), 1500 + i * rint(1200, 3500));
}
const FAQ = [[/狼穴/, '狼穴在黑石林北边，5级就能打，带个奶妈稳'], [/突破|洞天/, '9级圆满了要天地精华，雷泽打雷鸟给'], [/强化/, '+5以前随便上，+5以后贴保护符'], [/首领|boss|BOSS/i, '世界首领每15分钟一只，看系统频道'],
  [/雷鸟/, '雷鸟蓄力的时候防御，奶妈给盾'], [/边城/, '雷泽往北走古道就到边城'], [/补天/, '边城北边的传送阵，要引荐令'], [/虚神/, '边城虚神殿，每天5次'], [/青鳞鹰/, '带块烤兽肉去，有惊喜（小声）'], [/莽牛/, '莽牛坡在山林小径东边'], [/悬赏/, '边城城主府，每天三张'], [/百断/, '补天阁后山，17级以上三个人去']];
function fakeReply(text) { // simulated players answering what I typed in 世界
  const later = (t, f) => setTimeout(() => fakeSay('world', f, t), rint(1500, 5000));
  for (const [re, ans] of FAQ) if (re.test(text)) return later(ans, pick(FAKES.filter(f => f.per === 'helper')));
  if (/你好|大家好|hi|hello/i.test(text)) return later(pick(['你好呀', '晚上好', 'hi~', '欢迎欢迎']));
  if (/组|带|队/.test(text)) return later(pick(['来来来', '几级？', '我来！', '我也去', '差个坦克吗？我莽牛']));
  if (/卖|出/.test(text)) return later(pick(['多少钱', '便宜点', '挂交易行吧', '私聊']));
  if (/收/.test(text)) return later(pick(['我有，多少钱收', '价格太低了', '私聊']));
  if (/小不点/.test(text)) return later(pick(['小不点永远的神', '他又偷喝兽奶了', '小不点！']));
  if (/[?？吗]/.test(text) && chance(0.6)) return later(pick(['不知道诶', '我也想知道', '问问老玩家', '多看看系统频道']));
  if (chance(0.35)) later(pick(['？', '哈哈哈', '+1', '确实', '666']));
}

/* ---------- party (simulated players and co-op partners) ---------- */
function inviteFake(f) {
  if (STATE.party.length + netHumans().length >= BAL.partyMax - 1 + (STATE.party.some(b => b.id === f.id) ? 1 : 0)) { toast('队伍已满'); return; }
  const lv = fakeLv(f), d = Math.abs(lv - C.lv), p = (f.per === 'newbie' || f.per === 'helper' ? 0.9 : f.per === 'whale' ? 0.35 : 0.65) - Math.max(0, d - 5) * 0.12;
  toast(`已向 ${f.name} 发送组队邀请`);
  setTimeout(() => { if (Math.random() < p) { STATE.party.push({ id: f.id, until: now() + rint(15, 40) * 60000 }); chatPush('party', f.name, pick(['来了来了', '走起', '冲！', '我来奶你', '好的老板', 'hi']), { cls: f.cls }); sfx('chat'); netPub(); refresh(); }
    else { chatPush('sys', '', `${esc(f.name)} 拒绝了你的组队邀请：${pick(['在忙', '等级差太多啦', '已经有队了', '挂机中', '要下线了'])}`); refresh(); } }, rint(900, 2600));
}
function kickBot(id) { const f = FAKES.find(x => x.id === id); STATE.party = STATE.party.filter(b => b.id !== id); if (f) chatPush('party', '', `${esc(f.name)} 离开了队伍`); netPub(); refresh(); }
const partyBots = () => STATE.party.map(b => { const f = FAKES.find(x => x.id === b.id); return f ? Object.assign(fakeBot(f), b.lv ? { lv: b.lv } : {}) : null; }).filter(Boolean);
function autoMatch(n) { // 一键匹配: fill the party with simulated players of about my level, covering the roles I lack
  const have = new Set([C.cls, ...partyBots().map(b => b.cls), ...netHumans().map(h => h.cls)]); const want = ['liushen', 'mangniu', 'kunpeng'].filter(c => !have.has(c)).concat(['kunpeng', 'liushen', 'mangniu']); const got = [];
  for (const cls of want) { if (got.length >= n || STATE.party.length + netHumans().length >= BAL.partyMax - 1) break; const cand = shuffle(FAKES.filter(f => f.cls === cls && fakeOnline(f) && !STATE.party.some(b => b.id === f.id) && !got.includes(f))); const f = cand.sort((a, b) => Math.abs(fakeLv(a) - C.lv) - Math.abs(fakeLv(b) - C.lv))[0]; if (!f) continue;
    got.push(f); STATE.party.push({ id: f.id, until: now() + rint(20, 45) * 60000, lv: clamp(C.lv + rint(-1, 1), 1, BAL.lvCap) }); }
  for (const f of got) chatPush('party', f.name, pick(['来了来了', '匹配到了，冲！', '我来奶', '我坦', '老板好']), { cls: f.cls });
  logLine(`匹配成功：${got.map(f => `<span class="pname" style="color:${CLASSES[f.cls].color}">${esc(f.name)}</span>（${CLASSES[f.cls].name}）`).join('、')} 加入了队伍。`, 'sys'); sfx('level'); netPub(); refresh(); }

/* ---------- guild ---------- */
function joinGuild(id) { if (C.lv < 5) { toast('5 级才能加入公会'); return; } C.guild = id; const g = GUILDS.find(x => x.id === id); logLine(`你加入了公会「${g.name}」。公会加成：经验 +5%，攻击 +2%。`, 'sys'); chatPush('guild', '', `欢迎新成员 ${esc(C.name)}！`);
  setTimeout(() => { const m = FAKES.filter(f => f.guild === id && fakeOnline(f)); for (let i = 0; i < 2 && m.length; i++) fakeSay('guild', pick(m), pick(['欢迎欢迎', '新人好', '欢迎！有问题公会里问', '来了老弟'])); }, 1500); save(); refresh(); }

/* ---------- world boss ---------- */
const wbSlot = () => Math.floor(now() / (BAL.worldBossEvery * 60000));
let WB = null; // { id, loc, lv, slot, hpMax, hp, start, end, dmg:{name:n}, dead, killer }
function wbForSlot(slot, lv) { const W = WORLD_BOSSES[slot % WORLD_BOSSES.length], start = slot * BAL.worldBossEvery * 60000; const E = BAL.enemy(lv), hpMax = Math.round(E.hp * MOBS[W.id].mul.hp * 1.8);
  return { id: W.id, loc: W.loc, lv, slot, hpMax, hp: hpMax, start, end: start + BAL.worldBossOpen * 60000, dmg: {}, dead: false, killer: '', warned: false }; }
function worldTick() { // once a second on the authoritative client (solo or host)
  if (!C) return; const slot = wbSlot(), t = now();
  if (!WB || WB.slot !== slot) { const lv = clamp(Math.max(C.lv, ...netHumans().map(h => h.lv || 1)), 6, 28); WB = wbForSlot(slot, lv); }
  const next = (slot + 1) * BAL.worldBossEvery * 60000;
  if (!WB.warned2 && next - t < 120000) { WB.warned2 = 1; sysMsg(`世界首领 <b>${MOBS[WORLD_BOSSES[(slot + 1) % 3].id].name}</b> 将在 2 分钟后出现在 <b>${PLACES[WORLD_BOSSES[(slot + 1) % 3].loc].name}</b>！`); }
  if (t < WB.end && !WB.dead) {
    if (!WB.warned) { WB.warned = 1; sysMsg(`世界首领 <b>${MOBS[WB.id].name}</b>（${WB.lv} 级）出现在了 <b>${PLACES[WB.loc].name}</b>！`); if (chance(0.7)) setTimeout(() => fakeSay('world', null, pick(['冲冲冲', '首领刷了！', '集合集合', '这次我要拿第一'])), 2000); }
    const left = WB.end - t, rate = WB.hp / Math.max(1, left / 1000) * rnd(0.6, 1.1); // fake players chip in so it dies around the end of the window
    if (Math.random() < 0.6) { const f = pick(FAKES.filter(x => fakeOnline(x) && fakeLv(x) >= WB.lv - 6)) || FAKES[0]; const d = Math.round(rate * rnd(1, 2.4)); WB.dmg[f.name] = (WB.dmg[f.name] || 0) + d; WB.hp -= d; }
    if (WB.hp <= 0) wbDie(pick(Object.keys(WB.dmg)));
    if (NETROLE === 'host' && t % 3000 < 1000) netBroadcast({ t: 'wb', WB });
  }
}
function wbDie(killer) {
  if (WB.dead) return; WB.dead = true; WB.hp = 0; WB.killer = killer; const rank = Object.entries(WB.dmg).sort((a, b) => b[1] - a[1]);
  sysMsg(`世界首领 <b>${MOBS[WB.id].name}</b> 被击杀了！最后一击：<b>${esc(killer)}</b>。伤害第一：<b>${esc(rank[0][0])}</b>`);
  const names = [C.name, ...netHumans().map(h => h.name)];
  for (const nm of names) { const i = rank.findIndex(r => r[0] === nm); if (i < 0) continue; const m = { title: `世界首领奖励 · ${MOBS[WB.id].name}`, body: `你在讨伐${MOBS[WB.id].name}中造成了 ${fmt(rank[i][1])} 点伤害，排名第 ${i + 1}。`, items: i < 3 ? [['box2', 1]] : [['box1', 1], ['stone', 3]], gold: 100 + WB.lv * 20, exp: Math.round(BAL.expNext(WB.lv) * (i < 3 ? 0.5 : 0.3)) };
    if (nm === C.name) { sendMail(m); C.stats.wb++; } else netSendTo(nm, { t: 'mail', m }); }
  if (NETROLE === 'host') netBroadcast({ t: 'wb', WB });
  setTimeout(() => fakeSay('world', null, pick(REACT.boss)), 2500);
}
function worldBossRound(B) { // called after each battle round when fighting the world boss
  if (!WB || WB.dead) { const b = B.units.find(u => u.side === 1 && u.boss); if (b && b.alive && WB && WB.dead) { b.alive = false; b.hp = 0; B.over = true; B.win = true; blog(B, `<span class="bt win">★ 首领已被讨伐 ★</span>`); } return; }
  const b = B.units.find(u => u.side === 1 && u.boss); if (!b) return; B.dmgBy = B.dmgBy || {}; let tot = 0;
  for (const [nm, d] of Object.entries(B.dmgBy)) { const prev = (B.dmgSeen || {})[nm] || 0; const delta = d - prev; if (delta > 0) { WB.dmg[nm] = (WB.dmg[nm] || 0) + delta; tot += delta; } }
  B.dmgSeen = Object.assign({}, B.dmgBy); WB.hp = Math.max(0, WB.hp - tot);
  const helpers = Object.keys(WB.dmg).filter(n => !B.units.some(u => u.name === n)); if (helpers.length) blog(B, `<span class="dim">【附近】${esc(pick(helpers))} 等 ${helpers.length} 名玩家也在围攻首领……</span>`);
  if (b.alive) b.hp = Math.max(1, WB.hp); if (WB.hp <= 0 || !b.alive) { const killer = B.units.find(u => u.kind === 'pc')?.name || C.name; b.alive = false; b.hp = 0; WB.hp = 0; wbDie(killer); B.over = true; B.win = true; blog(B, `<span class="bt win">★ 首领被讨伐了！★</span>`); }
}

/* ---------- mail ---------- */
function sendMail(m) { C.mail.unshift(Object.assign({ id: uid(), t: now(), read: false, got: false, from: '系统' }, m)); if (C.mail.length > 40) C.mail.length = 40; toast('📬 你有一封新邮件'); save(); refresh(); }
function claimMail(id) { const m = C.mail.find(x => x.id === id); if (!m || m.got) return; m.got = true; m.read = true; for (const [k, n] of m.items || []) addItem(k, n); if (m.gold) addGold(m.gold); if (m.exp) gainExp(m.exp); for (const e of m.eqs || []) addEquip(e); sfx('loot'); save(); refresh(); }

/* ---------- market (交易行) ---------- */
function marketList() { // fake listings for this 10-minute window; bought ones are remembered
  const slot = Math.floor(now() / 600000), r = srng('mk' + slot), out = [], bought = store.get('bought', {});
  const lv = clamp(C.lv, 3, 28);
  for (let i = 0; i < 16; i++) { const f = FAKES[Math.floor(r() * FAKES.length)], key = slot + ':' + i; if (bought[key]) continue;
    if (r() < 0.45) { const id = ['stone', 'stone', 'herb', 'pill', 'elixir', 'protect', 'scroll', 'lingyao', 'ore', 'feather', 'thunderbone', 'soulshard', 'ancientscale', 'bone'][Math.floor(r() * 14)]; const n = id === 'protect' ? 1 : 1 + Math.floor(r() * 5);
      out.push({ key, seller: f.name, kind: 'item', id, n, price: Math.max(1, Math.round(ITEMS[id].price * (0.75 + r() * 0.9))) * n }); }
    else { const cands = EQ_BASES.filter(b => b.lv <= lv + 2 && b.lv >= lv - 8), b = cands[Math.floor(r() * cands.length)]; const rr = r(), rar = rr < 0.4 ? 1 : rr < 0.75 ? 2 : rr < 0.95 ? 3 : 4, p = r() < 0.3 ? Math.floor(r() * 6) : 0;
      const e = { u: 'm' + key, b: b.id, r: rar, p, af: [] }; const rr2 = srng('af' + key); const pool = AFFIX.slice(); for (let j = 0; j < rar; j++) { const a = pool.splice(Math.floor(rr2() * pool.length), 1)[0]; let v = (a.r[0] + rr2() * (a.r[1] - a.r[0])) * (1 + b.lv / 30); if (a.k === 'spd') v = Math.round(v); e.af.push([a.k, +v.toFixed(3)]); }
      out.push({ key, seller: f.name, kind: 'eq', e, price: Math.round(eqPrice(e) * (1.6 + r() * 1.6)) }); } }
  return out;
}
function marketBuy(L) { if (C.gold < L.price) { toast('银两不够'); return; } C.gold -= L.price; const b = store.get('bought', {}); b[L.key] = 1; store.set('bought', b);
  if (L.kind === 'item') addItem(L.id, L.n); else addEquip(Object.assign({}, L.e, { u: uid() })); sfx('gold'); toast('购买成功'); save(); refresh(); }
function marketSell(kind, ref, n, price) { // list my item; simulated buyers pick it up over the next minutes
  if (C.market.length >= 6) { toast('最多同时挂 6 件'); return; } price = Math.max(1, Math.round(price));
  if (kind === 'item') { if (!takeItem(ref, n)) return; C.market.push({ lid: uid(), kind, id: ref, n, price, t: now() }); }
  else { const i = C.gear.findIndex(g => g.u === ref); if (i < 0) return; const e = C.gear.splice(i, 1)[0]; C.market.push({ lid: uid(), kind, e, price, t: now() }); }
  toast('已上架，有人买了会通过邮件结算'); save(); refresh();
}
function marketCancel(lid) { const i = C.market.findIndex(m => m.lid === lid); if (i < 0) return; const m = C.market.splice(i, 1)[0]; if (m.kind === 'item') addItem(m.id, m.n, true); else C.gear.push(m.e); save(); refresh(); }
const fairPrice = m => m.kind === 'item' ? ITEMS[m.id].price * m.n : eqPrice(m.e) * 2.2;
function marketTick(mins = 1) { if (!C || !C.market.length) return; for (const m of C.market.slice()) { const q = m.price / Math.max(1, fairPrice(m)); const p = 1 - Math.pow(1 - clamp(1.5 - q, 0.03, 0.9) * 0.3, mins);
  if (Math.random() < p) { C.market.splice(C.market.indexOf(m), 1); const buyer = pick(FAKES).name, g = Math.floor(m.price * (1 - BAL.marketTax)); sendMail({ from: '交易行', title: '物品已售出', body: `${buyer} 买下了你的${m.kind === 'item' ? ITEMS[m.id].name + '×' + m.n : eqName(m.e)}，扣除 5% 手续费后到账 ${g} 两。`, gold: g }); } } }

/* ---------- daily: sign-in, bounties, arena tries ---------- */
const SIGN_REWARD = [{ gold: 100 }, { items: [['herb', 5]] }, { items: [['stone', 5]] }, { items: [['pill', 5]] }, { items: [['box1', 1]] }, { items: [['protect', 1]] }, { items: [['box2', 1]] }];
function dailyCheck() {
  const d = today(); if (C.daily.d === d) return; const prev = C.daily; C.daily = { d, sign: false, signDays: prev.signDays || 0, bounty: genBounties(d), bountyDone: 0, arena: 5 };
  if (prev.d && C.arena.rank && C.arena.rank <= 500) sendMail({ title: '虚神界每日结算', body: `昨日虚神界排名第 ${C.arena.rank}。`, gold: Math.round(2000 / Math.sqrt(C.arena.rank)), items: [['stone', C.arena.rank <= 50 ? 5 : 2]] });
}
function signIn() { if (C.daily.sign) return; C.daily.sign = true; const i = C.daily.signDays % 7; C.daily.signDays++; const R = SIGN_REWARD[i]; if (R.gold) addGold(R.gold); for (const [k, n] of R.items || []) addItem(k, n); sfx('loot'); toast(`签到成功（第 ${i + 1} 天）`); save(); refresh(); }
function genBounties(d) { const r = srng('bt' + d + C.name), lv = C.lv, P = Object.values(PLACES).filter(p => p.mobs && p.lv && p.lv[0] <= lv + 1 && p.lv[1] >= lv - 4), out = [];
  for (let i = 0; i < BAL.bountyPerDay; i++) { const p = P.length ? P[Math.floor(r() * P.length)] : PLACES.fl_path, mob = p.mobs[Math.floor(r() * p.mobs.length)][0]; out.push({ mob, loc: p.id, n: 4 + Math.floor(r() * 5), got: 0, done: false, taken: false }); } return out; }
function bountyKill(mob) { if (!C.daily.bounty) return; for (const b of C.daily.bounty) if (b.taken && !b.done && b.mob === mob && b.got < b.n) { b.got++; if (b.got >= b.n) logLine(`【悬赏】${MOBS[mob].name} ${b.got}/${b.n} 完成！回城主府领赏。`, 'quest'); } }
function bountyClaim(i) { const b = C.daily.bounty[i]; if (!b || b.done || b.got < b.n) return; b.done = true; C.daily.bountyDone++; C.stats.bounty = (C.stats.bounty || 0) + 1; gainExp(Math.round(BAL.expNext(C.lv) * 0.22)); addGold(60 + C.lv * 15); addItem('stone', 2); sfx('loot'); save(); refresh(); }

/* ---------- arena (虚神界): simulated players ranked by power ---------- */
function arenaBoard() { const list = FAKES.map(f => ({ name: f.name, cls: f.cls, lv: fakeLv(f), power: fakePower(f), f })); for (const h of netHumans()) list.push({ name: h.name, cls: h.cls, lv: h.lv, power: h.power, real: 1 });
  list.push({ name: C.name, cls: C.cls, lv: C.lv, power: charStats().power, me: 1 }); return list; }
function arenaRank() { if (!C.arena.rank) C.arena.rank = 900 + rint(0, 80); return C.arena.rank; }
function arenaOpponents() { const r = arenaRank(), seed = srng('ao' + today() + r + C.arena.wins); const out = [];
  for (let i = 0; i < 3; i++) { const f = FAKES[Math.floor(seed() * FAKES.length)], rank = Math.max(1, r - Math.floor(5 + seed() * Math.min(120, r * 0.25))); const lv = clamp(C.lv + [-1, 0, 2][i] + Math.floor(seed() * 2), 1, 30);
    out.push({ f, rank, bot: { id: f.id, name: f.name, cls: f.cls, lv, gear: 0.82 + i * 0.14 + (r < 100 ? 0.15 : 0) } }); }
  return out.sort((a, b) => b.rank - a.rank); }
async function arenaFight(o) {
  if ((C.daily.arena ?? 5) <= 0) { toast('今天的挑战次数用完了'); return; } C.daily.arena--; fullHeal();
  const win = await startBattle({ foes: [o.bot], title: `虚神界 · 挑战 ${o.f.name}（第 ${o.rank} 名）`, noLose: true, flee: false, arena: 'ladder', solo: true });
  fullHeal(); if (win && win.win) { C.arena.wins = (C.arena.wins || 0) + 1; const old = C.arena.rank; if (o.rank < old) C.arena.rank = o.rank; logLine(`虚神界排名 ${old} → <b>${C.arena.rank}</b>`, 'sys'); addGold(30 + C.lv * 3);
    for (const th of [100, 50, 10]) if (old > th && C.arena.rank <= th) worldEvent('arena', { rank: th }); }
  else logLine('虚神界挑战失败，排名不变。', 'dim'); save(); refresh();
}

/* ---------- enhancement (强化) ---------- */
function enhance(u, useProtect) {
  const e = u === 'weapon' || u === 'armor' || u === 'acc' ? C.eq[u] : C.gear.find(g => g.u === u); if (!e) return; if (e.p >= 10) { toast('已强化到满级'); return; }
  const st = BAL.enhStones(e.p), gd = BAL.enhGold(e.p); if (itemN('stone') < st) { toast(`需要强化石×${st}`); return; } if (C.gold < gd) { toast(`需要 ${gd} 两`); return; }
  if (useProtect && !itemN('protect')) { toast('没有保护符'); return; }
  takeItem('stone', st); C.gold -= gd; if (useProtect && e.p >= BAL.enhDropFrom) takeItem('protect'); C.stats.enh++;
  if (Math.random() < BAL.enhRate[e.p]) { e.p++; sfx('epic'); toast(`强化成功！+${e.p}`); logLine(`强化成功：<b>${eqName(e)}</b>`, 'loot'); if (e.p >= 7) worldEvent('enhOk', { item: EQB[e.b].name, p: e.p }); }
  else { sfx('fail'); if (e.p >= BAL.enhDropFrom && !useProtect) { e.p--; toast(`强化失败，掉到 +${e.p}`); } else toast('强化失败'); logLine(`强化失败：${eqName(e)}`, 'dim'); if (e.p >= 6) worldEvent('enhFail', { item: EQB[e.b].name }); }
  fixHp(); save(); refresh();
}

/* ---------- ambient tick: chat chatter, bots leaving, market ---------- */
let worldT = { chat: 0, min: 0, party: 0 };
function ambientTick() {
  if (!C || STATE.mode !== 'play') return; const t = now();
  if (NETROLE !== 'guest') { worldTick();
    if (t > worldT.chat) { worldT.chat = t + rint(5000, 13000); fakeSay('world'); if (C.guild && chance(0.25)) { const m = FAKES.filter(f => f.guild === C.guild && fakeOnline(f)); if (m.length) fakeSay('guild', pick(m), fillT(pick(TPL.casual.concat(TPL.leader)), pick(m))); } } }
  if (t > worldT.party) { worldT.party = t + rint(20000, 45000);
    for (const b of STATE.party.slice()) { const f = FAKES.find(x => x.id === b.id); if (!f) continue; if (t > b.until) { chatPush('party', f.name, pick(['有事先下了，886', '要吃饭了，拜拜', '困了，下次一起']), { cls: f.cls }); kickBot(b.id); } else if (chance(0.3)) chatPush('party', f.name, pick(['冲冲冲', '这怪好肉', '奶一口', '下一个去哪', '等我回个血', '666']), { cls: f.cls }); } }
  if (t > worldT.min) { worldT.min = t + 60000; marketTick(1); C.stats.playMin++; dailyCheck(); }
}
