/* 剧本杀 · 规则引擎（只在房主/单机上运行；队友把操作发给房主） */
function mkP(g, who) {
  const pub = new Set(g.pub);
  return { has: (...ids) => ids.every(i => pub.has(i)), any: (...ids) => ids.some(i => pub.has(i)), round: g.phase === 'r1' || g.phase === 'd1' ? 1 : 2,
    brk: (r, t) => !!(g.brk[r] && g.brk[r][t]), human: r => g.seats.includes(r), who };
}
const aiRoles = g => SCRIPTS[g.sid].suspects.filter(r => !g.seats.includes(r));
const humanRoles = g => g.seats.filter(Boolean);
const topicQ = (sc, t) => t.startsWith('about_') ? '你怎么看' + sc.roles[t.slice(6)].name + '？' : (sc.topics.find(x => x.id === t) || {}).q || t;
const itemTitle = (sc, id) => sc.clues[id] ? '「' + sc.clues[id].title + '」' : sc.facts[id] ? '「' + sc.facts[id].text.replace(/^[^：]+：/, '').slice(0, 18) + '…」' : id;

function logPush(g, e) { e.i = g.nid++; e.ph = g.phase; g.log.push(e); if (g.log.length > 600) g.log.splice(0, g.log.length - 600); return e; }
function reveal(g, ids, by) {
  const sc = SCRIPTS[g.sid]; const added = [];
  for (const id of ids || []) if (!g.pub.includes(id)) {
    g.pub.push(id); added.push(id);
    for (const r in g.own) { const k = g.own[r].indexOf(id); if (k >= 0) g.own[r].splice(k, 1); }
    if (sc.facts[id]) logPush(g, { k: 'fact', who: by, ref: id, text: sc.facts[id].text });
  }
  if (added.length) contraCheck(g);
  return added;
}
function contraCheck(g) {
  const sc = SCRIPTS[g.sid];
  sc.contra.forEach((c, i) => {
    if (g.contraUsed[i] || !g.pub.includes(c.a) || !g.pub.includes(c.b)) return;
    g.contraUsed[i] = 1; g.contraAdd[c.who] = (g.contraAdd[c.who] || 0) + c.add;
    const by = c.by.find(r => !g.seats.includes(r) && r !== c.who) || c.by[0];
    logPush(g, { k: 'contra', who: by, to: c.who, text: c.say });
  });
}
function pickAns(g, role, topic) {
  const sc = SCRIPTS[g.sid], list = (sc.ans[role] || {})[topic]; if (!list) return null;
  const P = mkP(g, role); return list.find(x => !x.when || x.when(P)) || null;
}
function noteEvade(g, role, topic, kind) {
  if ((kind === 'evade' || kind === 'crack') && !g.evadeT[role][topic]) { g.evadeT[role][topic] = 1; g.evade[role]++; }
}
/* AI 回答一个问题；对真人则弹出问题 */
function answer(g, from, to, topic) {
  const sc = SCRIPTS[g.sid];
  g.asked[to + ':' + topic] = (g.asked[to + ':' + topic] || 0) + 1;
  logPush(g, { k: 'ask', who: from, to, topic, text: topicQ(sc, topic) });
  if (g.seats.includes(to)) { addPrompt(g, { to, from, topic }); return; }
  const a = pickAns(g, to, topic);
  if (!a) { logPush(g, { k: 'ans', who: to, to: from, text: rnd(g, sc.show[to]._) }); return; }
  logPush(g, { k: 'ans', who: to, to: from, text: a.say, kind: a.kind });
  noteEvade(g, to, topic, a.kind); reveal(g, a.reveal, to);
}
function showTo(g, from, to, id) {
  const sc = SCRIPTS[g.sid];
  if (!g.pub.includes(id)) reveal(g, [id], from);
  logPush(g, { k: 'show', who: from, to, ref: id, text: '出示了' + itemTitle(sc, id) });
  if (g.seats.includes(to)) { addPrompt(g, { to, from, topic: sc.showTopic[id] || '_', clue: id }); return; }
  if (to === from) { /* 自言自语：对着线索说出想法 */ }
  const ent = (sc.show[to] || {})[id], P = mkP(g, to);
  if (ent && (!ent.when || ent.when(P))) {
    if (ent.say && ent.say !== '……') logPush(g, { k: 'ans', who: to, to: from, text: ent.say });
    if (ent.brk) {
      if (ent.say === '……') logPush(g, { k: 'ans', who: to, to: from, text: '……（沉默了很久。）' });
      for (const t of ent.brk) { g.brk[to][t] = 1; const a = pickAns(g, to, t); if (a) { logPush(g, { k: 'ans', who: to, to: from, text: a.say, kind: a.kind, broke: 1 }); reveal(g, a.reveal, to); } }
    }
    reveal(g, ent.reveal, to);
  } else logPush(g, { k: 'ans', who: to, to: from, text: rnd(g, (sc.show[to] || {})._ || ['……']) });
}
function rnd(g, arr) { if (!arr || !arr.length) return '……'; g.seed = (g.seed * 1103515245 + 12345) & 0x7fffffff; return arr[g.seed % arr.length]; }
function addPrompt(g, p) { p.id = g.nid++; g.prompts.push(p); }

/* 真人的发言（回答问题、主动说） */
function deckFor(g, role, topic) {
  const sc = SCRIPTS[g.sid], d = sc.deck[role] || {}; let list = d[topic] || d._ || [];
  if (role !== sc.killer) list = list.filter(x => x.kind !== 'lie');
  const P = mkP(g, role); return list.map(x => x.when && !x.when(P) ? Object.assign({}, x, { vol: 0 }) : x);
}
function humanSay(g, role, ent, prompt) {
  const sc = SCRIPTS[g.sid];
  logPush(g, { k: prompt ? 'ans' : 'say', who: role, to: prompt ? prompt.from : null, text: ent.say, kind: ent.kind });
  if (prompt) noteEvade(g, role, prompt.topic, ent.kind);
  if (ent.confess === 1) { g.confess[role] = 1; g.contraAdd[role] = (g.contraAdd[role] || 0) + 30; }
  if (ent.confess === 2) g.confess[role + '2'] = 1;
  for (const r in ent.push || {}) g.contraAdd[r] = (g.contraAdd[r] || 0) + ent.push[r];
  if (ent.cut) { g.cut = g.cut || {}; g.cut[ent.cut] = .4; }
  if (ent.vol && !prompt) { g.saidV = g.saidV || {}; g.saidV[role + ':' + ent.say.slice(0, 12)] = 1; }
  reveal(g, ent.reveal, role);
}

/* AI 怀疑度：只看已公开的东西 */
function suspicion(g, viewer) {
  const sc = SCRIPTS[g.sid], s = {};
  for (const r of sc.suspects) s[r] = 0.5 * (g.evade[r] || 0) + (g.contraAdd[r] || 0);
  for (const id of g.pub) { const w = sc.sus[id], k = (g.cut && g.cut[id]) || 1; if (w) for (const r in w) s[r] += w[r] * k; }
  if (viewer) delete s[viewer];
  return s;
}
function aiVote(g, viewer) {
  const s = suspicion(g, viewer), order = ['zhang', 'li', 'hu', 'wang'];
  let best = null; for (const r of order) if (r in s && (best == null || s[r] > s[best])) best = r;
  return best;
}

/* AI 的下一步：按剧本里的顺序挑第一条能说的 */
function aiStep(g) {
  const sc = SCRIPTS[g.sid], ph = g.phase; if (ph !== 'd1' && ph !== 'd2') return false;
  const ais = aiRoles(g); if (!ais.length) return false;
  const round = ph === 'd1' ? 1 : 2;
  if (g.aiN[ph] < AI_BUDGET[ph]) {
    for (const it of sc.talk) {
      if (g.used[it.id] || it.r > round) continue;
      const P0 = mkP(g); if (it.when && !it.when(P0)) continue;
      const cand = [].concat(it.who), who = cand.find(r => !g.seats.includes(r));
      if (!who || (it.ask && it.ask.to === who)) { g.used[it.id] = 1; continue; }
      g.used[it.id] = 1; g.aiN[ph]++;
      const P = mkP(g, who);
      if (it.say) { logPush(g, { k: 'say', who, text: typeof it.say === 'function' ? it.say(P) : it.say }); reveal(g, it.reveal, who); }
      if (it.ask) answer(g, who, it.ask.to, it.ask.topic);
      if (it.show) { const id = typeof it.show.id === 'function' ? it.show.id(P) : it.show.id; if (it.self) selfThink(g, who, id); else showTo(g, who, it.show.to, id); }
      return true;
    }
    /* 剧本里的话说完了：真人是嫌疑人时，AI 轮流追问他还没被问过的话题 */
    const hs = humanRoles(g).filter(r => r !== 'det');
    if (hs.length && !g.prompts.length) {
      for (const h of hs) for (const t of ['where', 'zhao', 'saw', 'village']) {
        if (g.asked[h + ':' + t]) continue;
        const who = ais[(g.idleI++) % ais.length]; g.aiN[ph]++; answer(g, who, h, t); return true;
      }
    }
  }
  const who = ais[(g.idleI++) % ais.length];
  logPush(g, { k: 'idle', who, text: rnd(g, sc.idle[who]) });
  return false;
}
function selfThink(g, who, id) {
  const sc = SCRIPTS[g.sid], ent = (sc.show[who] || {})[id], P = mkP(g, who);
  if (ent && (!ent.when || ent.when(P))) { logPush(g, { k: 'say', who, text: ent.say }); reveal(g, ent.reveal, who); }
}

/* 第二轮开始时 AI 搜证 */
function aiSearch(g, one) {
  const sc = SCRIPTS[g.sid], ais = aiRoles(g).filter(a => (g.aiAp[a] || 0) > 0);
  for (let n = 0; n < 12 && ais.some(a => g.aiAp[a] > 0); n++) {
    const a = ais[(g.idleI++) % ais.length]; if (!(g.aiAp[a] > 0)) continue; g.aiAp[a]--; const k = g.aiAp[a];
    const s = suspicion(g, a), rank = Object.keys(s).sort((x, y) => s[y] - s[x]);
    let pool = Object.keys(sc.clues).filter(id => sc.clues[id].r === 2 && !g.taken[id] && sc.clues[id].owner !== a);
    if (!pool.length) return;
    const pref = pool.filter(id => sc.clues[id].owner === rank[k % rank.length]);
    const id = (pref.length ? pref : pool)[Math.floor(rng(g.seed + g.nid * 13 + k)() * (pref.length ? pref : pool).length)];
    g.taken[id] = a; const c = sc.clues[id];
    logPush(g, { k: 'sys', who: a, text: roleName(a) + (c.scene ? '深入调查了现场，' : '搜查了' + roleName(c.owner) + '，') + '公开了' + itemTitle(sc, id) + '。', ref: id });
    reveal(g, [id], a);
    const ent = (sc.show[a] || {})[id]; if (ent && !ent.brk && (!ent.when || ent.when(mkP(g, a)))) { logPush(g, { k: 'say', who: a, text: ent.say }); reveal(g, ent.reveal, a); }
    if (one) return;
  }
}

function enterPhase(g, id) {
  const sc = SCRIPTS[g.sid]; g.phase = id; g.pt0 = Date.now(); g.ready = {};
  if (id === 'intro') {
    for (const r of sc.suspects) logPush(g, { k: 'intro', who: r, text: sc.roles[r].intro });
    if (g.seats.includes('det')) logPush(g, { k: 'intro', who: 'det', text: '我是南城刑警队的探员，这个案子由我接手。从现在起，谁都不许离开村子。' });
  }
  if (id === 'r1') logPush(g, { k: 'sys', text: '第一轮：现场勘查开始。赵家的平面图上标出了可以查看的地方。' });
  if (id === 'd1') { for (const c in sc.clues) if (sc.clues[c].r === 1 && !g.pub.includes(c)) g.pub.push(c); logPush(g, { k: 'sys', text: '第一轮讨论开始。现场线索已全部放进线索箱。' }); }
  if (id === 'r2') {
    for (const r of humanRoles(g)) g.ap[r] = AP.human;
    g.aiAp = {}; for (const a of aiRoles(g)) g.aiAp[a] = g.seats.includes('det') ? 1 : 2;
    logPush(g, { k: 'sys', text: '第二轮：搜身搜屋。每人 ' + AP.human + ' 点行动点；你每查一次，AI 也轮流查一次，结束时 AI 把剩下的点用完。' });
  }
  if (id === 'd2') aiSearch(g);
  if (id === 'd2') logPush(g, { k: 'sys', text: '第二轮讨论开始。把证词和线索对起来。' });
  if (id === 'reveal') finalize(g);
}
function finalize(g) {
  const sc = SCRIPTS[g.sid], q0 = sc.questions[0];
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
    g.score[h] = { s: Math.round(s), right, side };
  }
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
      g.ready[role] = 1; if (allReady(g)) advance(g); break;
    case 'unready': delete g.ready[role]; break;
    case 'look': if (g.phase === 'r1' && sc.clues[a.id] && sc.clues[a.id].r === 1 && !g.pub.includes(a.id)) { g.pub.push(a.id); logPush(g, { k: 'sys', who: role, text: roleName(role) + '查看了' + itemTitle(sc, a.id) + '。', ref: a.id }); } break;
    case 'search': {
      const c = sc.clues[a.id];
      if (g.phase !== 'r2' || !c || c.r !== 2 || g.taken[a.id] || c.owner === role || !(g.ap[role] > 0)) return;
      g.taken[a.id] = role; g.own[role].push(a.id); g.ap[role]--;
      logPush(g, { k: 'sys', who: role, text: roleName(role) + (c.scene ? '深入调查了现场' : '搜查了' + roleName(c.owner)) + '，拿到一条线索（还没公开）。' });
      aiSearch(g, 1); break;
    }
    case 'publish': if (g.own[role].includes(a.id)) { logPush(g, { k: 'pub', who: role, ref: a.id, text: '公开了' + itemTitle(sc, a.id) }); reveal(g, [a.id], role); } break;
    case 'ask': if (disc && a.to !== role && sc.suspects.includes(a.to)) { answer(g, role, a.to, a.topic); g.acts++; } break;
    case 'show': if (disc && (g.pub.includes(a.id) || g.own[role].includes(a.id)) && sc.suspects.includes(a.to)) { showTo(g, role, a.to, a.id); g.acts++; } break;
    case 'say': {
      const pr = a.pid != null ? g.prompts.find(p => p.id === a.pid && p.to === role) : null;
      const topic = pr ? pr.topic : a.topic; const ent = deckFor(g, role, topic)[a.i]; if (!ent) return;
      if (pr) g.prompts.splice(g.prompts.indexOf(pr), 1); else if (!ent.vol || (g.saidV || {})[role + ':' + ent.say.slice(0, 12)]) return;
      humanSay(g, role, ent, pr); g.acts++; break;
    }
    case 'listen': if (disc) aiStep(g); break;
    case 'answers': if (g.phase === 'answer' && Array.isArray(a.v) && a.v.length === sc.questions.length) { g.answers[role] = a.v.slice(); g.ready[role] = 1; if (allReady(g)) advance(g); } break;
    case 'seen': g.seen[role] = a.n; break;
  }
  if (disc && OPT.autoAI && ['ask', 'show', 'say'].includes(a.t) && g.acts % 2 === 0 && !g.prompts.some(p => p.to && g.seats.includes(p.to))) aiStep(g);
}
