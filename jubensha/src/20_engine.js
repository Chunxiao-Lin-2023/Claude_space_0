/* 剧本杀 · 规则引擎（只在房主/单机上运行；队友把操作发给房主） */
function mkP(g, who) {
  const pub = new Set(g.pub);
  return { has: (...ids) => ids.every(i => pub.has(i)), any: (...ids) => ids.some(i => pub.has(i)), round: g.phase === 'r1' || g.phase === 'd1' ? 1 : 2,
    brk: (r, t) => !!(g.brk[r] && g.brk[r][t]), human: r => g.seats.includes(r), cut: id => !!(g.cut && g.cut[id]), who };
}
const aiRoles = g => SCRIPTS[g.sid].suspects.filter(r => !g.seats.includes(r));
const humanRoles = g => g.seats.filter(Boolean);
const firstSentence = s => { const m = String(s).replace(/\n+/g, '').match(/^.*?[。！？…]+/); return m ? m[0] : s; };
function topicQ(sc, t) {
  if (t === '_') return '看看这个，你有什么要说的？';
  if (t === 'final') return '投票前，你还有什么要说的？';
  return t.startsWith('about_') ? '你怎么看' + sc.roles[t.slice(6)].name + '？' : (sc.topics.find(x => x.id === t) || {}).q || t;
}
const itemTitle = (sc, id) => sc.clues[id] ? '「' + sc.clues[id].title + '」' : sc.facts[id] ? '「' + sc.facts[id].text.replace(/^[^：]+：/, '').slice(0, 18) + '…」' : id;

function logPush(g, e) { e.i = g.nid++; e.ph = g.phase; g.log.push(e); if (g.log.length > 700) g.log.splice(0, g.log.length - 700); return e; }
function reveal(g, ids, by) {
  const sc = SCRIPTS[g.sid]; const added = [];
  for (const id of ids || []) if (!g.pub.includes(id)) {
    g.pub.push(id); added.push(id); (g.pubAt = g.pubAt || {})[id] = g.nid;
    for (const r in g.own) { const k = g.own[r].indexOf(id); if (k >= 0) g.own[r].splice(k, 1); }
    if (sc.facts[id]) logPush(g, { k: 'fact', who: by, ref: id, text: sc.facts[id].text });
  }
  if (added.length) contraCheck(g);
  return added;
}
function fireContra(g, i, by) {
  const sc = SCRIPTS[g.sid], c = sc.contra[i]; if (g.contraUsed[i]) return false;
  g.contraUsed[i] = 1; g.contraAdd[c.who] = (g.contraAdd[c.who] || 0) + c.add;
  logPush(g, { k: 'contra', who: by, to: c.who, text: c.say });
  return true;
}
function contraCheck(g) {
  const sc = SCRIPTS[g.sid];
  sc.contra.forEach((c, i) => {
    if (g.contraUsed[i] || !g.pub.includes(c.a) || !g.pub.includes(c.b)) return;
    fireContra(g, i, c.by.find(r => !g.seats.includes(r) && r !== c.who) || c.by[0]);
  });
}
function pickAns(g, role, topic) {
  const sc = SCRIPTS[g.sid], list = (sc.ans[role] || {})[topic]; if (!list) return null;
  const P = mkP(g, role); return list.find(x => !x.when || x.when(P)) || null;
}
function noteEvade(g, role, topic, kind) {
  if ((kind === 'evade' || kind === 'crack') && !g.evadeT[role][topic]) { g.evadeT[role][topic] = 1; g.evade[role]++; }
}
const promptFor = (g, r) => g.prompts.some(p => p.to === r);
const ownText = q => { const t = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 120); return t || null; };
/* AI 回答一个问题；对真人则弹出问题 */
function answer(g, from, to, topic, q) {
  const sc = SCRIPTS[g.sid], key = to + ':' + topic;
  g.asked[key] = (g.asked[key] || 0) + 1;
  logPush(g, { k: 'ask', who: from, to, topic, text: q || topicQ(sc, topic), own: q ? 1 : 0 });
  if (g.seats.includes(to)) { addPrompt(g, { to, from, topic }); return; }
  const a = pickAns(g, to, topic);
  if (!a) { logPush(g, { k: 'ans', who: to, to: from, text: rnd(g, sc.show[to]._) }); return; }
  /* 同一个问题再问：说过的话不再整段重复 */
  const again = g.lastAns[key] === a.say, dodge = a.kind === 'evade' || a.kind === 'crack';
  let text = a.say;
  if (again) text = dodge ? '我说了，' + firstSentence(a.say).replace(/^……/, '') + '（明显不耐烦了。）' : '我刚才说过了。' + firstSentence(a.say);
  g.lastAns[key] = a.say;
  logPush(g, { k: 'ans', who: to, to: from, text, kind: a.kind });
  if (again && dodge) g.evade[to] += 0.25;
  noteEvade(g, to, topic, a.kind); reveal(g, a.reveal, to);
}
function breakTopics(g, to, from, topics) {
  for (const t of topics) {
    if (g.brk[to][t]) continue; g.brk[to][t] = 1;
    if (g.seats.includes(to)) continue;
    const a = pickAns(g, to, t); if (a) { logPush(g, { k: 'ans', who: to, to: from, text: a.say, kind: a.kind, broke: 1 }); g.lastAns[to + ':' + t] = a.say; reveal(g, a.reveal, to); }
  }
}
function showTo(g, from, to, id) {
  const sc = SCRIPTS[g.sid];
  if (!g.pub.includes(id)) reveal(g, [id], from);
  logPush(g, { k: 'show', who: from, to, ref: id, text: '出示了' + itemTitle(sc, id) });
  if (g.seats.includes(to)) { addPrompt(g, { to, from, topic: sc.showTopic[id] || '_', clue: id }); return; }
  const ent = (sc.show[to] || {})[id], P = mkP(g, to);
  if (ent && (!ent.when || ent.when(P))) {
    if (ent.say && ent.say !== '……') logPush(g, { k: 'ans', who: to, to: from, text: ent.say });
    if (ent.brk) { if (ent.say === '……') logPush(g, { k: 'ans', who: to, to: from, text: '……（沉默了很久。）' }); breakTopics(g, to, from, ent.brk); }
    reveal(g, ent.reveal, to);
  } else logPush(g, { k: 'ans', who: to, to: from, text: rnd(g, (sc.show[to] || {})._ || ['……']) });
}
function rnd(g, arr) { if (!arr || !arr.length) return '……'; g.seed = (g.seed * 1103515245 + 12345) & 0x7fffffff; return arr[g.seed % arr.length]; }
function addPrompt(g, p) { p.id = g.nid++; g.prompts.push(p); }

/* 真人的发言（回答问题、主动说、最终陈述） */
function deckFor(g, role, topic) {
  const sc = SCRIPTS[g.sid];
  let list = topic === 'final' ? (sc.finals[role] || []) : ((sc.deck[role] || {})[topic] || (sc.deck[role] || {})._ || []);
  if (role !== sc.killer) list = list.filter(x => x.kind !== 'lie');
  const P = mkP(g, role); return list.map(x => x.when && !x.when(P) ? Object.assign({}, x, { vol: 0 }) : x);
}
const saidKey = (role, ent) => role + ':' + ent.say.slice(0, 12);
function applyEffects(g, role, ent) {
  for (const r in ent.push || {}) g.contraAdd[r] = (g.contraAdd[r] || 0) + ent.push[r];
  if (ent.cut) g.cut[ent.cut] = g.seats.includes(role) ? .4 : .6;
  if (ent.uncut) delete g.cut[ent.uncut];
}
function humanSay(g, role, ent, prompt, topic, own) {
  logPush(g, { k: topic === 'final' ? 'final' : prompt ? 'ans' : 'say', who: role, to: prompt ? prompt.from : null, text: own || ent.say, kind: ent.kind, own: own ? 1 : 0 });
  if (prompt) noteEvade(g, role, prompt.topic, ent.kind);
  if (ent.confess === 1) { g.confess[role] = 1; g.contraAdd[role] = (g.contraAdd[role] || 0) + 30; }
  if (ent.confess === 2) g.confess[role + '2'] = 1;
  applyEffects(g, role, ent);
  if (ent.vol && !prompt) g.saidV[saidKey(role, ent)] = 1;
  reveal(g, ent.reveal, role);
}

/* AI 怀疑度：只看已公开的东西 */
function suspicion(g, viewer) {
  const sc = SCRIPTS[g.sid], s = {};
  for (const r of sc.suspects) s[r] = 0.5 * (g.evade[r] || 0) + (g.contraAdd[r] || 0) + (g.introStyle[r] === 'strong' ? .5 : 0);
  for (const id of g.pub) { const w = sc.sus[id], k = (g.cut && g.cut[id]) || 1; if (w) for (const r in w) s[r] += w[r] * k; }
  if (viewer) delete s[viewer];
  return s;
}
function aiVote(g, viewer) {
  const s = suspicion(g, viewer), order = ['zhang', 'li', 'hu', 'wang'];
  let best = null; for (const r of order) if (r in s && (best == null || s[r] > s[best])) best = r;
  return best;
}
/* AI 投某人的理由：贡献最大的两条已公开线索/推论 */
function voteReasons(g, target) {
  const sc = SCRIPTS[g.sid], w = id => sc.sus[id][target] * (g.cut[id] || 1);
  return g.pub.filter(id => sc.sus[id] && sc.sus[id][target] > 0).sort((a, b) => w(b) - w(a)).slice(0, 2);
}

/* AI 的下一步：按剧本里的顺序挑第一条能说的 */
function aiStep(g) {
  const sc = SCRIPTS[g.sid], ph = g.phase; if (ph !== 'd1' && ph !== 'd2') return false;
  const ais = aiRoles(g); if (!ais.length) return false;
  const round = ph === 'd1' ? 1 : 2, D = dif(g);
  if (g.aiN[ph] < D.budget[ph]) {
    for (const it of sc.talk) {
      if (g.used[it.id] || it.r > round) continue;
      if (it.diff && !D[it.diff]) continue;
      const P0 = mkP(g); if (it.when && !it.when(P0)) continue;
      const cand = [].concat(it.who), who = cand.find(r => !g.seats.includes(r));
      if (!who || (it.ask && it.ask.to === who)) { g.used[it.id] = 1; continue; }
      const tgt = it.ask ? it.ask.to : it.show && !it.self ? it.show.to : null;
      if (tgt && g.seats.includes(tgt) && promptFor(g, tgt)) continue; /* 真人还有没答的问题：先不追问 */
      g.used[it.id] = 1; g.aiN[ph]++;
      const P = mkP(g, who);
      if (it.say) { logPush(g, { k: 'say', who, text: typeof it.say === 'function' ? it.say(P) : it.say }); applyEffects(g, who, it); reveal(g, it.reveal, who); }
      if (it.ask) answer(g, who, it.ask.to, it.ask.topic);
      if (it.show) { const id = typeof it.show.id === 'function' ? it.show.id(P) : it.show.id; if (it.self) selfThink(g, who, id); else showTo(g, who, it.show.to, id); }
      return true;
    }
    /* 剧本里的话说完了：真人是嫌疑人时，AI 轮流追问他还没被问过的话题 */
    const hs = humanRoles(g).filter(r => r !== 'det' && !promptFor(g, r));
    for (const h of hs) for (const t of ['where', 'zhao', 'saw', 'village']) {
      if (g.asked[h + ':' + t]) continue;
      const who = ais[(g.idleI++) % ais.length]; g.aiN[ph]++; answer(g, who, h, t); return true;
    }
  }
  /* 没新话了：只说一句闲话，之后不再刷屏 */
  const last = g.log[g.log.length - 1];
  if (last && last.k === 'idle') return false;
  const who = ais[(g.idleI++) % ais.length];
  logPush(g, { k: 'idle', who, text: rnd(g, sc.idle[who]) });
  return false;
}
function aiHasMore(g) {
  const ph = g.phase; if (ph !== 'd1' && ph !== 'd2' || g.aiN[ph] >= dif(g).budget[ph]) return false;
  const sc = SCRIPTS[g.sid], D = dif(g), round = ph === 'd1' ? 1 : 2, P = mkP(g);
  if (sc.talk.some(it => !g.used[it.id] && it.r <= round && (!it.diff || D[it.diff]) && (!it.when || it.when(P)) && [].concat(it.who).some(r => !g.seats.includes(r)))) return true;
  return humanRoles(g).some(h => h !== 'det' && ['where', 'zhao', 'saw', 'village'].some(t => !g.asked[h + ':' + t]));
}
function selfThink(g, who, id) {
  const sc = SCRIPTS[g.sid], ent = (sc.show[who] || {})[id], P = mkP(g, who);
  if (ent && (!ent.when || ent.when(P))) { logPush(g, { k: 'say', who, text: ent.say }); reveal(g, ent.reveal, who); }
}

/* 玩家把两条放在一起 */
function linkItems(g, role, a, b) {
  const sc = SCRIPTS[g.sid], has = id => g.pub.includes(id) || g.own[role].includes(id);
  if (!has(a) || !has(b) || a === b) return;
  const same = x => (x.a === a && x.b === b) || (x.a === b && x.b === a);
  const cIdx = sc.contra.findIndex(same), L = sc.links.find(same);
  const intro = () => logPush(g, { k: 'say', who: role, text: '我把' + itemTitle(sc, a) + '和' + itemTitle(sc, b) + '放在一起看——' });
  if (cIdx >= 0 && !g.contraUsed[cIdx]) { reveal(g, [a, b].filter(id => !g.pub.includes(id)), role); if (!g.contraUsed[cIdx]) { intro(); fireContra(g, cIdx, role); } return; }
  if (L) {
    const newR = (L.reveal || []).filter(id => !g.pub.includes(id)), newB = Object.keys(L.brk || {}).some(r => L.brk[r].some(t => !g.brk[r][t]));
    if (!newR.length && !newB) { g.hintText[role] = { n: g.nid++, text: '这个结论已经有了。' }; return; }
    reveal(g, [a, b].filter(id => !g.pub.includes(id)), role); intro();
    reveal(g, newR, role);
    for (const r in L.brk || {}) { if (g.seats.includes(r)) continue; logPush(g, { k: 'sys', text: roleName(r) + '的脸色变了。' }); breakTopics(g, r, role, L.brk[r]); }
    return;
  }
  g.wrong[role] = (g.wrong[role] || 0) + 1;
  logPush(g, { k: 'sys', who: role, text: roleName(role) + '把' + itemTitle(sc, a) + '和' + itemTitle(sc, b) + '放在一起，但看不出有什么联系。' });
}
/* 提示：找一个现在就能推进的地方 */
function hintFor(g, role) {
  const sc = SCRIPTS[g.sid], pub = new Set(g.pub.concat(g.own[role] || [])), ais = aiRoles(g), P = mkP(g);
  const topicOK = t => { const x = sc.topics.find(y => y.id === t); return !x || !x.when || x.when(P); };
  for (const to of ais) for (const id in sc.show[to] || {}) {
    if (id === '_' || !pub.has(id)) continue; const e = sc.show[to][id]; if (e.when && !e.when(P)) continue;
    if ((e.brk && e.brk.some(t => !g.brk[to][t])) || (e.reveal && e.reveal.some(x => !g.pub.includes(x)))) return '试试把' + itemTitle(sc, id) + '出示给' + roleName(to) + '。';
  }
  for (const to of ais) for (const t of Object.keys(sc.ans[to] || {})) {
    const a = pickAns(g, to, t); if (a && a.reveal && a.reveal.some(x => !g.pub.includes(x)) && topicOK(t)) return '问问' + roleName(to) + '：' + topicQ(sc, t);
  }
  for (const L of sc.links) if (pub.has(L.a) && pub.has(L.b) && ((L.reveal || []).some(x => !g.pub.includes(x)) || Object.keys(L.brk || {}).some(r => !g.seats.includes(r) && L.brk[r].some(t => !g.brk[r][t])))) return '试试用「🔗 指出关联」，把' + itemTitle(sc, L.a) + '和' + itemTitle(sc, L.b) + '放在一起。';
  if (g.phase === 'r2' && Object.keys(sc.clues).some(id => sc.clues[id].r === 2 && !g.taken[id] && sc.clues[id].owner !== role)) return '还有没搜的线索，先把行动点用完。';
  if ((g.own[role] || []).length) return '你手上还有没公开的线索。公开或出示出去，别人才会对它有反应。';
  return '能逼出来的都逼出来了。打开 🕒 时间线板，看看九点二十五以后，谁没有人能作证。';
}

/* 第二轮：真人每搜一次，AI 轮流搜一次；结束时 AI 用完剩下的点 */
function aiSearch(g, one) {
  const sc = SCRIPTS[g.sid], ais = aiRoles(g).filter(a => (g.aiAp[a] || 0) > 0);
  for (let n = 0; n < 12 && ais.some(a => g.aiAp[a] > 0); n++) {
    const a = ais[(g.idleI++) % ais.length]; if (!(g.aiAp[a] > 0)) continue; g.aiAp[a]--; const k = g.aiAp[a];
    const s = suspicion(g, a), rank = Object.keys(s).sort((x, y) => s[y] - s[x]);
    const pool = Object.keys(sc.clues).filter(id => sc.clues[id].r === 2 && !g.taken[id] && sc.clues[id].owner !== a);
    if (!pool.length) return;
    const pref = pool.filter(id => sc.clues[id].owner === rank[k % rank.length]), from = pref.length ? pref : pool;
    const id = from[Math.floor(rng(g.seed + g.nid * 13 + k)() * from.length)];
    g.taken[id] = a; const c = sc.clues[id];
    logPush(g, { k: 'sys', who: a, text: roleName(a) + (c.scene ? '深入调查了现场，' : '搜查了' + roleName(c.owner) + '，') + '公开了' + itemTitle(sc, id) + '。', ref: id });
    reveal(g, [id], a);
    const ent = (sc.show[a] || {})[id]; if (ent && !ent.brk && (!ent.when || ent.when(mkP(g, a)))) { logPush(g, { k: 'say', who: a, text: ent.say }); reveal(g, ent.reveal, a); }
    if (one) return;
  }
}
/* 真人掉线：他的位置交给 AI，手上没公开的线索也公开 */
function seatLeft(g, seat) {
  const r = g.seats[seat]; if (!r) return;
  g.guestRole = r; g.seats[seat] = null; g.prompts = g.prompts.filter(p => p.to !== r); delete g.status[r];
  logPush(g, { k: 'sys', text: '朋友断开了，' + roleName(r) + '由 AI 接手。把房间码再发给他就能接回来。' });
  if (g.phase === 'intro' && !g.introStyle[r]) logPush(g, { k: 'intro', who: r, text: SCRIPTS[g.sid].roles[r].intro });
  if ((g.own[r] || []).length) { logPush(g, { k: 'sys', text: roleName(r) + '手上没公开的线索，AI 接手后公开了。' }); reveal(g, g.own[r].slice(), r); }
  if (humanRoles(g).length && allReady(g)) advance(g);
}
function seatBack(g, seat) { if (!g.seats[seat] && g.guestRole) { g.seats[seat] = g.guestRole; logPush(g, { k: 'sys', text: '朋友回来了，接回' + roleName(g.guestRole) + '。' }); } }

function enterPhase(g, id) {
  const sc = SCRIPTS[g.sid]; g.phase = id; g.pt0 = Date.now(); g.ready = {};
  if (id === 'intro') for (const r of aiRoles(g)) logPush(g, { k: 'intro', who: r, text: sc.roles[r].intro });
  if (id === 'r1') logPush(g, { k: 'sys', text: '第一轮：现场勘查开始。赵家的平面图上标出了可以查看的地方。' });
  if (id === 'd1') { for (const c in sc.clues) if (sc.clues[c].r === 1 && !g.pub.includes(c)) g.pub.push(c); logPush(g, { k: 'sys', text: '第一轮讨论开始。现场线索已全部放进线索箱。' }); }
  if (id === 'r2') {
    const D = dif(g); for (const r of humanRoles(g)) g.ap[r] = D.ap;
    g.aiAp = {}; for (const a of aiRoles(g)) g.aiAp[a] = g.seats.includes('det') ? 1 : D.aiAp;
    logPush(g, { k: 'sys', text: '第二轮：搜身搜屋。每人 ' + D.ap + ' 点行动点；你每查一次，AI 也轮流查一次，结束时 AI 把剩下的点用完。' });
  }
  if (id === 'd2') { aiSearch(g); logPush(g, { k: 'sys', text: '第二轮讨论开始。把证词和线索对起来。' }); }
  if (id === 'final') {
    g.prompts = [];
    logPush(g, { k: 'sys', text: '讨论结束。投票前，每个人说最后一句话。' });
    for (const a of aiRoles(g)) {
      const v = aiVote(g, a), why = voteReasons(g, v).map(x => itemTitle(sc, x));
      let t = '我投' + roleName(v) + '。' + (why.length ? '因为' + why.join('，还有') + '。' : '说不上为什么，就是觉得不对劲。');
      if (g.seats.includes(v) && g.introStyle[v] === 'strong') t += '而且你一上来就那么冲，反倒让人起疑。';
      if (g.seats.includes(v) && g.introStyle[v] === 'mislead') t += '你一开场就把话头往别人身上引，我记着呢。';
      logPush(g, { k: 'final', who: a, to: v, text: t });
    }
  }
  if (id === 'reveal') finalize(g);
}
function finalize(g) {
  const sc = SCRIPTS[g.sid], q0 = sc.questions[0], D = dif(g);
  for (const a of aiRoles(g)) g.votes[a] = aiVote(g, a);
  for (const h of humanRoles(g)) { const ans = g.answers[h] || []; g.votes[h] = ans[0] != null ? q0.roles[ans[0]] : null; }
  if (g.seats.includes('det')) g.verdict = g.votes.det;
  else {
    const n = {}; for (const r in g.votes) if (g.votes[r]) n[g.votes[r]] = (n[g.votes[r]] || 0) + 1;
    const top = Object.keys(n).sort((a, b) => n[b] - n[a]);
    g.verdict = top.length && (top.length === 1 || n[top[0]] > n[top[1]]) ? top[0] : null;
  }
  g.score = {};
  for (const h of humanRoles(g)) {
    const ans = g.answers[h] || [], right = sc.questions.map((q, i) => ans[i] === q.a);
    let s = (right[0] ? 50 : 0) + right.slice(1).filter(Boolean).length * 50 / (sc.questions.length - 1);
    let side = null; if (sc.sides[h]) { side = !!sc.sides[h](g, h); if (side) s += 10; }
    const pen = (g.hints[h] || 0) * D.hintCost + (g.wrong[h] || 0) * 2, adj = Math.round(s) - pen;
    g.score[h] = { s: Math.round(s), right, side, pen, rate: adj >= 95 ? 'S' : adj >= 80 ? 'A' : adj >= 60 ? 'B' : 'C' };
  }
  g.missed = {
    clues: Object.keys(sc.clues).filter(id => !g.pub.includes(id)),
    deduce: Object.keys(sc.facts).filter(id => id[0] === 'd' && !g.pub.includes(id)),
    unbroken: ['li', 'zhang', 'hu'].filter(r => !g.brk[r].where)
  };
}
function allReady(g) { return humanRoles(g).every(r => g.ready[r]); }
function advance(g) { const i = phaseIdx(g.phase); if (i < PHASES.length - 1) enterPhase(g, PHASES[i + 1].id); }

/* 所有改动状态的操作 */
function apply(g, a, seat) {
  const sc = SCRIPTS[g.sid], role = g.seats[seat];
  if (!role) return;
  const disc = g.phase === 'd1' || g.phase === 'd2';
  switch (a.t) {
    case 'ready':
      if (g.phase === 'answer' && !(g.answers[role])) return;
      if (g.phase === 'intro' && !g.introStyle[role]) return;
      g.ready[role] = 1; if (allReady(g)) advance(g); break;
    case 'unready': delete g.ready[role]; break;
    case 'intro': {
      const it = ((sc.intros || {})[role] || [])[a.i]; if (g.phase !== 'intro' || !it || g.introStyle[role]) return;
      g.introStyle[role] = it.style; logPush(g, { k: 'intro', who: role, text: it.say });
      for (const r in it.push || {}) g.contraAdd[r] = (g.contraAdd[r] || 0) + it.push[r];
      break;
    }
    case 'look': if (g.phase === 'r1' && sc.clues[a.id] && sc.clues[a.id].r === 1 && !g.pub.includes(a.id)) { g.pub.push(a.id); logPush(g, { k: 'sys', who: role, text: roleName(role) + '查看了' + itemTitle(sc, a.id) + '。', ref: a.id }); } break;
    case 'search': {
      const c = sc.clues[a.id];
      if (g.phase !== 'r2' || !c || c.r !== 2 || g.taken[a.id] || c.owner === role || !(g.ap[role] > 0)) return;
      g.taken[a.id] = role; g.own[role].push(a.id); g.ap[role]--;
      logPush(g, { k: 'sys', who: role, text: roleName(role) + (c.scene ? '深入调查了现场' : '搜查了' + roleName(c.owner)) + '，拿到一条线索（还没公开）。' });
      aiSearch(g, 1); break;
    }
    case 'publish': if (g.own[role].includes(a.id)) { logPush(g, { k: 'pub', who: role, ref: a.id, text: '公开了' + itemTitle(sc, a.id) }); reveal(g, [a.id], role); } break;
    case 'ask': if (disc && a.to !== role && sc.suspects.includes(a.to)) { answer(g, role, a.to, a.topic, ownText(a.q)); g.acts++; } break;
    case 'show': if (disc && (g.pub.includes(a.id) || g.own[role].includes(a.id)) && sc.suspects.includes(a.to) && a.to !== role) { if (ownText(a.q)) logPush(g, { k: 'say', who: role, to: a.to, text: ownText(a.q), own: 1 }); showTo(g, role, a.to, a.id); g.acts++; } break;
    case 'free': { /* 自由打字但不属于任何话题：记下原话，对方只回一句不含事实的话 */
      const q = ownText(a.q); if (!disc || !q) return;
      if (a.to && sc.suspects.includes(a.to) && a.to !== role) { logPush(g, { k: 'ask', who: role, to: a.to, text: q, own: 1 }); if (g.seats.includes(a.to)) addPrompt(g, { to: a.to, from: role, topic: '_', q }); else logPush(g, { k: 'ans', who: a.to, to: role, text: rnd(g, (sc.dodge || sc.idle)[a.to]), kind: 'evade', free: 1, q }); }
      else logPush(g, { k: 'say', who: role, text: q, own: 1, kind: a.kind || 'truth' });
      g.acts++; break;
    }
    case 'freeText': { const q = ownText(a.text); if (!q) return; g.freeQ = g.freeQ || []; if (!disc && a.pid == null) return; g.freeQ.push({ id: g.nid++, role, text: q, pid: a.pid != null ? a.pid : null, to: a.to || null, say: !!a.say }); return; }
    case 'link': if (disc) { linkItems(g, role, a.a, a.b); g.acts++; } break;
    case 'hint': if (disc || g.phase === 'r2') { g.hints[role] = (g.hints[role] || 0) + 1; g.hintText[role] = { n: g.nid++, text: hintFor(g, role) }; } break;
    case 'say': {
      const pr = a.pid != null ? g.prompts.find(p => p.id === a.pid && p.to === role) : null;
      const topic = pr ? pr.topic : a.topic; const ent = deckFor(g, role, topic)[a.i]; if (!ent) return;
      if (topic === 'final') { if (g.phase !== 'final' || g.finalSaid[role]) return; g.finalSaid[role] = 1; humanSay(g, role, ent, null, 'final'); break; }
      if (pr) g.prompts.splice(g.prompts.indexOf(pr), 1); else if (!ent.vol || g.saidV[saidKey(role, ent)]) return;
      humanSay(g, role, ent, pr, null, a.fromFree ? ownText(a.q) : null); g.acts++; break;
    }
    case 'chat': { const t = String(a.text || '').trim().slice(0, 120); if (t && humanRoles(g).length > 1) logPush(g, { k: 'chat', who: role, text: t }); return; }
    case 'status': g.status[role] = String(a.s || '').slice(0, 20); return;
    case 'again': if (g.phase === 'reveal') { g.again[role] = 1; if (humanRoles(g).every(r => g.again[r])) g.restartReq = 1; } return;
    case 'listen': if (disc) aiStep(g); break;
    case 'answers': if (g.phase === 'answer' && Array.isArray(a.v) && a.v.length === sc.questions.length && a.v.every(x => Number.isInteger(x))) { g.answers[role] = a.v.slice(); g.ready[role] = 1; if (allReady(g)) advance(g); } break;
  }
  if (disc && OPT.autoAI && ['ask', 'show', 'say', 'link'].includes(a.t) && g.acts % 2 === 0) aiStep(g);
}
