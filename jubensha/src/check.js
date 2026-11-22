/* 剧本数据检查：引用的线索/证词/角色/话题都要存在，原文都要在 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = __dirname;
const TEXT = {}; for (const f of fs.readdirSync(path.join(D, 'text'))) if (f.endsWith('.txt')) TEXT[f.slice(0, -4)] = fs.readFileSync(path.join(D, 'text', f), 'utf8');
const ctx = { SCRIPTS: {}, TEXT }; vm.createContext(ctx);
for (const f of fs.readdirSync(D).filter(f => /^1\d_.*\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
const errs = []; let n = 0;
for (const sid in ctx.SCRIPTS) {
  const sc = ctx.SCRIPTS[sid], ids = new Set([...Object.keys(sc.clues), ...Object.keys(sc.facts)]), roles = new Set(Object.keys(sc.roles));
  const tops = new Set(sc.topics.map(t => t.id).concat(sc.suspects.map(r => 'about_' + r)));
  const need = (id, where) => { n++; if (!ids.has(id)) errs.push(`${sid}: ${where} 引用了不存在的 ${id}`); };
  for (const k of ['bg', 'truth']) if (!TEXT[sc[k]]) errs.push(`${sid}: 缺原文 ${sc[k]}`);
  for (const r of sc.suspects) { if (!roles.has(r)) errs.push(`${sid}: 嫌疑人 ${r} 没有角色`); if (!TEXT[sc.roles[r].book]) errs.push(`${sid}: ${r} 缺人物剧本原文`); if (!sc.ans[r]) errs.push(`${sid}: ${r} 没有回答`); if (!sc.show[r] || !sc.show[r]._) errs.push(`${sid}: ${r} 缺默认反应`); if (!sc.deck[r]) errs.push(`${sid}: ${r} 没有真人发言表`); }
  for (const c in sc.clues) { const x = sc.clues[c]; if (x.owner && !roles.has(x.owner)) errs.push(`${sid}: 线索 ${c} 的主人不存在`); if (x.r === 1 && !sc.spots[c]) errs.push(`${sid}: 第一轮线索 ${c} 没有位置`); }
  for (const f in sc.facts) { const w = sc.facts[f].who; if (!roles.has(w) && w !== 'zhao' && w !== 'deduce') errs.push(`${sid}: 证词 ${f} 的 who 不对`); }
  for (const id in sc.sus) { need(id, 'sus'); for (const r in sc.sus[id]) if (!sc.suspects.includes(r)) errs.push(`${sid}: sus.${id} 的 ${r} 不是嫌疑人`); }
  for (const c of sc.contra) { need(c.a, 'contra'); need(c.b, 'contra'); }
  for (const r in sc.ans) for (const t in sc.ans[r]) { if (!tops.has(t)) errs.push(`${sid}: ans.${r}.${t} 话题不存在`); for (const a of sc.ans[r][t]) (a.reveal || []).forEach(i => need(i, `ans.${r}.${t}`)); }
  for (const r of sc.suspects) for (const t of tops) if (t !== 'about_' + r && !(sc.ans[r] || {})[t]) errs.push(`${sid}: ${r} 没有话题 ${t} 的回答`);
  for (const r in sc.show) for (const id in sc.show[r]) { if (id === '_') continue; need(id, `show.${r}`); const e = sc.show[r][id]; (e.reveal || []).forEach(i => need(i, `show.${r}.${id}`)); (e.brk || []).forEach(t => { if (!sc.ans[r][t]) errs.push(`${sid}: show.${r}.${id} 打开的话题 ${t} 没有回答`); }); }
  const tids = new Set();
  for (const it of sc.talk) {
    if (tids.has(it.id)) errs.push(`${sid}: 发言 id 重名 ${it.id}`); tids.add(it.id);
    [].concat(it.who).forEach(w => { if (!roles.has(w)) errs.push(`${sid}: 发言 ${it.id} 的说话人 ${w} 不存在`); });
    (it.reveal || []).forEach(i => need(i, 'talk.' + it.id));
    if (it.ask && (!roles.has(it.ask.to) || !tops.has(it.ask.topic))) errs.push(`${sid}: 发言 ${it.id} 的 ask 不对`);
    if (it.show && typeof it.show.id === 'string') need(it.show.id, 'talk.' + it.id);
    if (!it.say && !it.ask && !it.show) errs.push(`${sid}: 发言 ${it.id} 什么也不做`);
    if (it.cut) need(it.cut, 'talk.cut'); if (it.uncut) need(it.uncut, 'talk.uncut');
    if (it.diff && !['rebut', 'frame'].includes(it.diff)) errs.push(`${sid}: 发言 ${it.id} 的 diff 不对`);
  }
  for (const r in sc.deck) for (const t in sc.deck[r]) { if (t !== '_' && t !== 'rebut' && !tops.has(t)) errs.push(`${sid}: deck.${r}.${t} 话题不存在`); for (const e of sc.deck[r][t]) { (e.reveal || []).forEach(i => need(i, `deck.${r}.${t}`)); if (e.cut) need(e.cut, 'deck.cut'); if (e.kind === 'lie' && r !== sc.killer) errs.push(`${sid}: ${r} 不是凶手却有谎话`); } }
  for (const id in sc.showTopic) { need(id, 'showTopic'); if (!tops.has(sc.showTopic[id])) errs.push(`${sid}: showTopic.${id} 话题不存在`); }
  for (const L of sc.links || []) { need(L.a, 'links'); need(L.b, 'links'); (L.reveal || []).forEach(i => need(i, 'links.reveal')); for (const r in L.brk || {}) L.brk[r].forEach(t => { if (!sc.ans[r] || !sc.ans[r][t]) errs.push(`${sid}: links 打开的 ${r}.${t} 没有回答`); }); if (!(L.reveal || []).length && !L.brk) errs.push(`${sid}: link ${L.a}+${L.b} 什么也不做`); }
  const lk = new Set(); for (const L of sc.links || []) { const k = [L.a, L.b].sort().join('+'); if (lk.has(k)) errs.push(`${sid}: link 重复 ${k}`); lk.add(k); }
  for (const r of sc.suspects.concat(['det'])) { const it = (sc.intros || {})[r]; if (!it || it.length !== 3) errs.push(`${sid}: ${r} 的自我介绍不是 3 条`); }
  for (const r of sc.suspects) { const f = (sc.finals || {})[r]; if (!f || !f.length) errs.push(`${sid}: ${r} 没有最终陈述`); else f.forEach(e => { if (e.kind === 'lie' && r !== sc.killer) errs.push(`${sid}: ${r} 不是凶手却有谎话（最终陈述）`); }); }
  sc.questions.forEach((q, i) => { if (q.a == null || q.a >= q.opts.length) errs.push(`${sid}: 第 ${i + 1} 题答案不对`); });
  if (sc.questions[0].roles[sc.questions[0].a] !== sc.killer) errs.push(`${sid}: 第一题答案不是凶手`);
  sc.timeline.rows.forEach((r, i) => { if (r.length !== sc.timeline.cols.length + 1) errs.push(`${sid}: 时间线第 ${i + 1} 行列数不对`); });
  /* Claude 相关数据（25_ai.js 用）和平面图 */
  for (const r of sc.suspects) { if (!(sc.voice || {})[r]) errs.push(`${sid}: ${r} 没有 voice（Claude 扮演时的说话风格）`); if (!((sc.dodge || {})[r] || []).length) errs.push(`${sid}: ${r} 没有 dodge（剧本外问题的中性回避句）`); }
  for (const S of sc.secrets || []) { if (!S.words || !S.words.length) errs.push(`${sid}: secrets 有一项没有 words`); (S.ok || []).forEach(i => need(i, 'secrets.ok')); }
  if (!(sc.secrets || []).length) errs.push(`${sid}: 没有 secrets（Claude 不许提前说出的词）`);
  if (Object.prototype.toString.call(sc.confess) !== '[object RegExp]') errs.push(`${sid}: 没有 confess 正则（凶手认罪说法）`);
  for (const t in sc.topicScope || {}) if (!tops.has(t)) errs.push(`${sid}: topicScope.${t} 话题不存在`);
  for (const t of sc.topics) if (!(sc.topicScope || {})[t.id]) errs.push(`${sid}: 话题 ${t.id} 没有 topicScope（自由提问归类用）`);
  for (const t in sc.topicWords || {}) if (!tops.has(t)) errs.push(`${sid}: topicWords.${t} 话题不存在`);
  for (const t of sc.pressTopics || []) if (!tops.has(t)) errs.push(`${sid}: pressTopics 里 ${t} 话题不存在`);
  for (const A of sc.planAreas || []) { if (A.length < 5 || A[0] >= A[2] || A[1] >= A[3]) errs.push(`${sid}: planAreas 坐标不对 ${JSON.stringify(A)}`); if (A[4]) need(A[4], 'planAreas'); else if (!A[5]) errs.push(`${sid}: planAreas 没线索也没提示`); }
  for (const c in sc.clues) if (sc.clues[c].img && !sc.clues[c].img.match(/^[a-z]+$/)) errs.push(`${sid}: 线索 ${c} 的 img 键名不对`);
  console.log(`${sc.title}: ${Object.keys(sc.clues).length} 条线索 · ${Object.keys(sc.facts).length} 条证词/推论 · ${sc.talk.length} 条 AI 发言 · ${n} 处引用已检查`);
}
if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
