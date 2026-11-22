/* 剧本杀 · Claude 接入（AIKit）。只在单机/房主上运行；朋友那边只看结果。
   硬性规则（代码保证，不靠提示词）：
   1. 引擎决定一切事实：谁说实话、透露什么、谁破防，都和脚本 AI 完全一样。Claude 只把引擎已经定好的台词换个说法。
   2. Claude 拿不到任何还没公开的线索、别人的剧本和真相；凶手 AI 也只拿到自己的人设和要说的那句话。
   3. 每句 Claude 台词都要过检查，不过就作废、用原来的脚本台词：
      · 没公开的秘密词（剧本里的 secrets 表）不许出现，除非原句里本来就有；
      · 出现的时间点必须在原句或已公开证词里出现过；
      · 凶手的台词不许有认罪说法；不许提 AI、模型、游戏、剧本、玩家；长度有上限。
   4. 玩家自由打字只会被归到已有的动作（问哪个话题、出示哪条、选哪句说法），不会产生剧本里没有的效果。
      不是凶手的玩家，说和自己剧本矛盾的话会被拒绝（不能撒谎）。
   5. 调用失败、超时、没有密钥：直接用脚本台词，游戏不卡。 */
const AIJ = { busy: 0, voiced: {}, err: '' };
const aiOn = () => typeof AIKit !== 'undefined' && AIKit.available() && NET.role !== 'guest';
const VOICE_K = { ans: 1, say: 1, final: 1, intro: 1, contra: 1, ask: 1 };
const KIND_LABEL = { truth: '实话', evade: '回避（不能透露原句以外的任何东西）', lie: '谎话（照样说谎，不能改口）', crack: '慌了，但还在嘴硬' };

/* 一条日志要不要让 Claude 说 */
function needVoice(g, e) {
  if (e.v || !VOICE_K[e.k] || !e.who || !SCRIPTS[g.sid].suspects.includes(e.who) || g.seats.includes(e.who)) return false;
  if (e.k === 'ask' && e.own) return false;
  return ['intro', 'd1', 'd2', 'final'].includes(e.ph);
}
function aiAfter() {
  if (!G) return;
  G.ai = aiOn() ? 1 : 0;
  if (!G.ai) return;
  const pend = G.log.filter(e => needVoice(G, e));
  /* 太旧的不补了，只说最近的几句 */
  pend.slice(0, -6).forEach(e => e.v = 's');
  pend.slice(-6).forEach(e => e.v = 'p');
  pump();
}
async function pump() {
  if (AIJ.busy || !G) return;
  AIJ.busy = 1;
  try {
    for (let guard = 0; guard < 40 && G; guard++) {
      if (G.freeQ && G.freeQ.length) { const g = G; g.freeCur = g.freeQ.shift(); netSend(); render(); try { await handleFree(g.freeCur); } finally { if (g.freeCur) { g.freeCur = null; if (G === g) { netSend(); render(); } } } continue; }
      const e = G.log.find(x => x.v === 'p'); if (!e) break;
      await voiceOne(G, e);
    }
  } finally { AIJ.busy = 0; }
}
function transcript(g, upto, n) {
  const sc = SCRIPTS[g.sid], out = [];
  for (const e of g.log) { if (e.i >= upto) break; if (['sys', 'idle'].includes(e.k) || e.v === 'p') continue; out.push(e.k === 'fact' ? '（' + e.text + '）' : roleName(e.who) + (e.to ? ' → ' + roleName(e.to) : '') + '：' + e.text); }
  return out.slice(-(n || 12)).join('\n');
}
const pubFacts = g => g.pub.map(id => { const sc = SCRIPTS[g.sid]; return sc.clues[id] ? '【线索】' + sc.clues[id].title + '：' + sc.clues[id].text.replace(/\n+/g, ' ').slice(0, 90) : sc.facts[id] ? '【证词/推论】' + sc.facts[id].text : ''; }).filter(Boolean);
const TIME_RE = /([0-9一二三四五六七八九十两]{1,3})\s*点\s*(半|一刻|[0-9一二三四五六七八九十]{1,3}\s*分?)?/g;
const CN = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
const cnNum = s => /^\d+$/.test(s) ? +s : s.length === 1 ? CN[s] : s[0] === '十' ? 10 + (CN[s[1]] || 0) : (CN[s[0]] || 0) * 10 + (s[2] ? CN[s[2]] : 0);
const times = t => { const r = new Set(); for (const m of String(t).matchAll(TIME_RE)) { const h = cnNum(m[1]); if (!h || (h < 6 && !m[2])) continue; let mi = 0; if (m[2]) mi = m[2] === '半' ? 30 : m[2] === '一刻' ? 15 : cnNum(m[2].replace(/\s*分?$/, '')); r.add(h % 12 + ':' + mi); } return r; };
/* 硬性检查：返回 null 表示通过，否则返回原因 */
function aiCheck(g, e, text, orig) {
  const sc = SCRIPTS[g.sid];
  if (!text || typeof text !== 'string') return '空';
  text = text.trim();
  const max = Math.min(220, Math.max(40, orig.length * 2 + 30)); if (text.length > max) return '太长';
  if (/AI|人工智能|模型|Claude|剧本|玩家|游戏|系统提示/i.test(text)) return '出戏';
  const pub = new Set(g.pub);
  for (const s of sc.secrets || []) for (const w of s.words) if (text.includes(w) && !orig.includes(w) && !s.ok.some(id => pub.has(id))) return '泄露：' + w;
  const allowed = times(orig + pubFacts(g).join(' '));
  for (const t of times(text)) if (!allowed.has(t)) return '编造时间：' + t;
  if (e.who === sc.killer && sc.confess && sc.confess.test(text) && !sc.confess.test(orig)) return '认罪';
  return null;
}
async function voiceOne(g, e) {
  const sc = SCRIPTS[g.sid], R = sc.roles[e.who], orig = e.text;
  const smart = e.broke || e.k === 'final' || e.k === 'contra';
  const system = [
    `你在一场中文剧本杀里扮演「${R.name}」（${R.title}）。说话风格：${(sc.voice || {})[e.who] || ''}`,
    '你要做的只有一件事：把给你的“原句”用这个人物的口吻重新说出来，并自然地接上刚才的对话。',
    '【硬性规则】',
    '1. 只说原句里已有的事实。可以换说法、加语气、回应对方刚才的话，但不能新增任何事实、时间、地点、人物、物品或动作。',
    '2. 原句是回避，就继续回避；原句是谎话，就照样说谎，不改口、不暗示真相。' + (e.who === sc.killer ? '你绝不承认自己杀了人，也不承认去过死者家里找到他。' : ''),
    '3. 不提任何没出现在原句或“已公开信息”里的线索和人名。',
    '4. 不提 AI、模型、游戏、剧本、玩家；只用中文；不写旁白，除非原句里本来有括号动作。',
    `5. 长度不超过原句的两倍，最多 ${Math.min(150, orig.length * 2 + 20)} 个字。`,
    `人物自我介绍（只用来把握语气）：${R.intro}`
  ].join('\n');
  const label = { ans: '回答', say: '主动发言', final: '最终陈述（投票前的最后一句）', intro: '自我介绍', contra: '指出对方的矛盾', ask: '提问' }[e.k];
  const user = `【已公开信息】\n${pubFacts(g).slice(-24).join('\n') || '（无）'}\n\n【刚才的对话】\n${transcript(g, e.i, 10) || '（刚开始）'}\n\n【这一句】类型：${label}${e.kind ? '；性质：' + (KIND_LABEL[e.kind] || e.kind) : ''}${e.to ? '；说给：' + roleName(e.to) : ''}\n原句：${orig}`;
  try {
    const v = await AIKit.call({ system, user, want: smart ? 'smart' : 'quick', maxTokens: 300, tool: { name: 'say', description: '说出这一句', schema: { type: 'object', properties: { line: { type: 'string', description: '人物说出口的这一句' } }, required: ['line'] } } });
    if (!G || G !== g) return;
    let line = v && String(v.line || '').trim();
    if (line) line = line.replace(new RegExp('^(' + R.name + '|' + R.seal + ')[：:]\\s*'), '').replace(/^[「“"]+|[」”"]+$/g, '').trim();
    const why = aiCheck(g, e, line, orig);
    if (why) { e.v = 's'; e.aiWhy = why; } else { e.text0 = orig; e.text = line; e.v = 'a'; }
  } catch (err) { e.v = 's'; AIJ.err = err.message; if (/密钥|401/.test(err.message)) { AIKit.setCfg({ on: false }); toast('Claude 调用失败：' + err.message + '。已改回脚本 AI，可在设置里重新打开。', 5000); } }
  if (G === g) { save(); netSend(); render(); }
}

/* 玩家自由打字：先归类成已有的动作，再交给引擎 */
/* 不靠 Claude 的归类：话里提到的人、话题关键词、线索标题 */
function localRoute(g, f, R, tops, items) {
  const sc = SCRIPTS[g.sid], t = f.text;
  const named = R.filter(r => t.includes(sc.roles[r].name) || t.includes(sc.roles[r].seal) || (sc.roles[r].alias || []).some(w => t.includes(w)));
  let to = named.length === 1 ? named[0] : named.length > 1 ? (named.find(r => new RegExp(sc.roles[r].seal + '[^，,。？?]{0,3}[，,：:]').test(t)) || named.sort((a, b) => t.indexOf(sc.roles[a].name[0]) - t.indexOf(sc.roles[b].name[0]))[0]) : null;
  if (!to && f.to && R.includes(f.to)) to = f.to;
  const other = named.find(r => r !== to);
  let topic = null;
  if (other && /怎么看|觉得|怎么样|为人|关系|认识|了解/.test(t) && tops.includes('about_' + other)) topic = 'about_' + other;
  if (!topic) for (const [k, re] of Object.entries(sc.topicWords || {})) if (tops.includes(k) && re.test(t)) { topic = k; break; }
  const item = /给.{0,6}看|出示|拿出|你看这|看看这/.test(t) ? items.find(id => sc.clues[id] && t.includes(sc.clues[id].title.replace(/[（(].*$/, '').replace(/^(一张|一把|一根|桌上的|墙上的|卧室的)/, ''))) : null;
  return { to, topic, item: item || null, act: item ? 'show' : to ? 'ask' : 'say' };
}
async function handleFree(f) {
  const g = G, sc = SCRIPTS[g.sid], seat = g.seats.indexOf(f.role); if (seat < 0) return;
  const msg = (t, back) => { g.freeCur = null; g.freeMsg = g.freeMsg || {}; g.freeMsg[f.role] = { n: g.nid++, text: t, back: back ? f.text : '' }; save(); netSend(); render(); };
  const callC = async o => { try { return await AIKit.call(o); } catch (err) { AIJ.err = err.message; throw err; } finally { g.freeCur = null; } };
  const pr = f.pid != null ? g.prompts.find(p => p.id === f.pid && p.to === f.role) : null;
  try {
    if (pr || f.say) {
      /* 回答问题 / 主动发言：在剧本允许的说法里找最接近的一条，并判断有没有和自己的剧本矛盾 */
      const topic = pr ? pr.topic : null;
      const opts = pr ? deckFor(g, f.role, topic) : Object.keys(sc.deck[f.role] || {}).flatMap(tp => deckFor(g, f.role, tp).map((e, i) => Object.assign({ tp, i }, e))).filter(e => e.vol && !g.saidV[saidKey(f.role, e)]);
      const R = sc.roles[f.role], killer = f.role === sc.killer;
      const v = await callC({
        want: 'quick', maxTokens: 300,
        system: '你是剧本杀的裁判助手。玩家扮演「' + R.name + '」，打了一句话。你要判断：这句话和下面哪条“可选说法”意思最接近；它是实话、回避还是谎话（以这个人物自己的剧本为准）。只做判断，不评论。',
        user: '【这个人物的剧本】\n' + (R.bookText || TEXT[R.book]).slice(0, 3000) + '\n\n【可选说法】\n' + opts.map((o, k) => k + '. [' + o.kind + '] ' + o.say).join('\n') + (pr ? '\n\n【被问的问题】' + (pr.q || topicQ(sc, pr.topic)) : '') + '\n\n【玩家打的话】' + f.text,
        tool: { name: 'judge', schema: { type: 'object', properties: { index: { type: 'integer', description: '最接近的可选说法编号；都不接近填 -1' }, kind: { type: 'string', enum: ['truth', 'evade', 'lie'] }, contradicts: { type: 'boolean', description: '是否和人物剧本里的事实矛盾' } }, required: ['index', 'kind', 'contradicts'] } }
      });
      if (!killer && (v.kind === 'lie' || v.contradicts)) return msg('你不是凶手，不能说谎：这句话和你的剧本对不上。换个说法，或者回避。');
      const k = Number.isInteger(v.index) && v.index >= 0 && v.index < opts.length ? v.index : -1;
      if (k >= 0) {
        const o = opts[k];
        if (!killer && o.kind === 'lie') return msg('你不是凶手，不能说谎。');
        apply(g, pr ? { t: 'say', pid: pr.id, i: k, fromFree: 1, q: f.text } : { t: 'say', topic: o.tp, i: o.i, fromFree: 1, q: f.text }, seat);
      } else if (pr) {
        /* 不像任何一条：当作回避，记下原话 */
        const list = deckFor(g, f.role, topic), ev = list.findIndex(o => o.kind === 'evade');
        apply(g, { t: 'say', pid: pr.id, i: ev >= 0 ? ev : 0, fromFree: 1, q: f.text }, seat);
      } else apply(g, { t: 'free', q: f.text, kind: v.kind }, seat);
    } else {
      /* 讨论里的提问：归到 问谁 + 哪个话题 / 出示哪条 / 闲聊 */
      const R = sc.suspects.filter(r => r !== f.role), tops = sc.topics.filter(x => !x.when || x.when(mkP(g))).map(x => x.id).concat(sc.suspects.map(x => 'about_' + x));
      const items = (g.own[f.role] || []).concat(g.pub);
      let v = null;
      try { v = await callC({
        want: 'quick', maxTokens: 300, timeout: 9000,
        system: '你是剧本杀的裁判助手，把玩家打的一句话归类成一个游戏动作。只能从给定的选项里选。to/topic/item 只能填给定的英文 id。',
        user: '【可以问的人】' + R.map(r => r + '=' + sc.roles[r].name).join('，') + (f.to ? '（玩家当前选中了 ' + f.to + '）' : '') +
          '\n【话题】\n' + tops.map(t => t + '：' + topicQ(sc, t)).join('\n') +
          '\n【可以出示的线索/证词】\n' + items.map(id => id + '：' + (sc.clues[id] ? sc.clues[id].title : sc.facts[id].text.slice(0, 30))).join('\n') +
          '\n\n【玩家打的话】' + f.text + '\n\n规则：问某人某件事 → act=ask；拿出某条线索/证词给某人看 → act=show；都不是（闲聊、自言自语、对所有人说的推理）→ act=say。',
        tool: { name: 'route', schema: { type: 'object', properties: { act: { type: 'string', enum: ['ask', 'show', 'say'] }, to: { type: 'string', enum: R.concat(['none']) }, topic: { type: 'string', enum: tops.concat(['none']) }, item: { type: 'string', enum: items.length ? items.concat(['none']) : ['none'] } }, required: ['act', 'to', 'topic', 'item'] } }
      }); } catch (err) { v = null; }
      /* Claude 的结果先规范化（名字→id），再用本地规则兜底：Claude 失败或没给出对象时问题也不会石沉大海 */
      const L = localRoute(g, f, R, tops, items);
      const nTo = x => { if (!x) return null; if (R.includes(x)) return x; return R.find(r => x === sc.roles[r].name || x === sc.roles[r].seal || String(x).includes(sc.roles[r].name)) || null; };
      const to = (v && nTo(v.to)) || L.to || (f.to && R.includes(f.to) ? f.to : null);
      const act = v && v.act ? v.act : L.act, topic = v && tops.includes(v.topic) ? v.topic : L.topic, item = v && items.includes(v.item) ? v.item : L.item;
      if (act === 'show' && to && item) apply(g, { t: 'show', to, id: item, q: f.text }, seat);
      else if ((act === 'ask' || act === 'show') && !to) return msg('没听出你在问谁：先点一下座位上的人，或者在话里带上名字（比如“张村民，你那晚在哪？”）。', 1);
      else if (act !== 'say' && to && topic) apply(g, { t: 'ask', to, topic, q: f.text }, seat);
      else if (act !== 'say' && to) apply(g, { t: 'free', to, q: f.text }, seat);
      else if (to && /[？?吗呢]\s*$/.test(f.text)) apply(g, topic ? { t: 'ask', to, topic, q: f.text } : { t: 'free', to, q: f.text }, seat);
      else {
        apply(g, { t: 'free', q: f.text, kind: 'truth' }, seat);
        if (!g.freeSayHint) { g.freeSayHint = 1; msg('这句话大家都听到了。想让某个人回答，就先点他的座位，或者在话里带上他的名字。'); }
      }
    }
  } catch (err) { msg('Claude 没能理解这句话（' + err.message + '），请用按钮操作。'); return; }
  if (G === g) { save(); netSend(); aiAfter(); render(); }
}
