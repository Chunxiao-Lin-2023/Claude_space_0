/* 剧本杀 · 界面 */
const U = { scr: 'title', setup: { sid: 'renchiren', mode: 'det', role: null }, tab: 'mine', target: null, modal: null, mtab: 'pub', lastN: 0, hubArm: 0, titleArm: 0, sheet: null, tlShown: 0, lobby: { mode: 'sus', roles: [null, null] }, pSeen: {} };
const app = () => $('#app');
function sealH(r, big) { const sc = S ? (G ? S() : SCRIPTS.renchiren) : null; const R = r === 'zhao' ? { seal: '赵', color: '#3d3d3d' } : r === 'deduce' ? { seal: '推', color: '#8a2b1f' } : (sc && sc.roles[r]) || { seal: '?', color: '#555' }; return '<span class="seal' + (big ? ' big' : '') + '" style="--c:' + R.color + '">' + R.seal + '</span>'; }
function toast(t, ms) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), ms || 2200); }
function fmtT(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
const PH_MIN = { read: 5, intro: 3, r1: 5, d1: 15, r2: 5, d2: 20, answer: 5 };

function render() {
  const scr = U.scr === 'game' && G ? G.phase : U.scr;
  document.body.dataset.scr = scr;
  const rk = U.scr + ':' + scr; document.body.classList.toggle('same', rk === U._rk); U._rk = rk;
  document.body.classList.toggle('noanim', !OPT.anim);
  drawBg(scr);
  if (U.scr === 'title') return renderTitle();
  if (U.scr === 'setup') return renderSetup();
  if (U.scr === 'lobby') return renderLobby();
  if (U.scr === 'game' && G) return renderGame();
}
/* ---------- 标题 ---------- */
function renderTitle() {
  const sv = loadSave('renchiren');
  app().innerHTML = `<div class="scr" style="position:relative">
    ${HUB ? '<button class="ghost sm hubbtn" onclick="UI.hub(this)">‹ 游戏厅</button>' : ''}
    <div class="title"><div class="sub">剧本杀</div><h1>夜半推理馆</h1>
    <div class="mut" style="max-width:520px;font-family:var(--serif);line-height:1.8">一个人当侦探，或者和一个朋友各自入局；其余的位置由 AI 扮演——他们会隐瞒、会回避，凶手会说谎。</div>
    <div class="btns">
      <button class="pri" onclick="UI.go('setup')">开始新的案件</button>
      ${sv && sv.phase !== 'reveal' ? `<button onclick="UI.resume()">继续上次（${esc(SCRIPTS[sv.sid].title)} · ${esc(PHASES[phaseIdx(sv.phase)].name)}）</button>` : ''}
      <button onclick="UI.go('lobby')">🔗 和朋友联机</button>
      <button class="ghost" onclick="UI.modal('rules')">玩法说明</button>
      <button class="ghost" onclick="UI.modal('opts')">设置</button>
    </div></div></div>`;
}
/* ---------- 选剧本、选模式 ---------- */
function renderSetup() {
  const st = U.setup, sc = SCRIPTS[st.sid];
  const roleOpts = sc.suspects.map(r => `<button class="opt ${st.role === r ? 'on' : ''}" onclick="UI.setRole('${r}')"><b>${sealH(r)} ${esc(sc.roles[r].name)}</b><span class="mut small">${esc(sc.roles[r].title)}</span></button>`).join('') +
    `<button class="opt ${st.role === 'rand' ? 'on' : ''}" onclick="UI.setRole('rand')"><b>🎲 随机</b><span class="mut small">可能抽到凶手</span></button>`;
  app().innerHTML = `<div class="scr"><div class="top"><button class="ghost sm" onclick="UI.go('title')">‹ 返回</button><span class="ph">选择剧本</span></div>
  <div class="main"><div class="wrap">
    <div class="grid" style="margin-bottom:18px">
      <div class="sc" onclick="UI.pickSc('renchiren')" style="${st.sid === 'renchiren' ? 'border-color:var(--acc)' : ''}"><h2>人吃人</h2><div class="mut">${esc(sc.sub)} · ${esc(sc.minutes)}</div><p style="font-family:var(--serif);line-height:1.8">${esc(sc.blurb)}</p><span class="tag">4 名嫌疑人</span><span class="tag">可加侦探</span><span class="tag">社会派</span></div>
      <div class="sc off"><h2>再见卡门</h2><div class="mut">1845 · 塞维利亚 · 制作中</div><p style="font-family:var(--serif);line-height:1.8">吉普赛女郎卡门死在自己的帐篷里，胸口有剑伤、有枪伤，还中了毒。四个外乡人里，谁该为她偿命？</p><span class="tag">90–120 分钟</span><span class="tag">变格</span></div>
    </div>
    <h3>你想怎么玩？</h3>
    <div class="pick" style="margin-bottom:14px">
      <button class="opt ${st.mode === 'det' ? 'on' : ''}" onclick="UI.setMode('det')"><b>🕵 当侦探（推荐首玩）</b><span class="mut small">四名嫌疑人全由 AI 扮演。你审问、出示证据，最后由你指认凶手。</span></button>
      <button class="opt ${st.mode === 'sus' ? 'on' : ''}" onclick="UI.setMode('sus')"><b>🎭 入局当嫌疑人</b><span class="mut small">拿一本人物剧本，其余三人是 AI。少数服从多数投出凶手——你也可能就是凶手。</span></button>
    </div>
    ${st.mode === 'sus' ? `<h3>选一个角色</h3><div class="pick">${roleOpts}</div>` : ''}
  </div></div>
  <div class="bar"><span class="mut small">每阶段有建议时长，不会强制结束。</span><span class="sp"></span><button class="pri" ${st.mode === 'sus' && !st.role ? 'disabled' : ''} onclick="UI.start()">开始</button></div></div>`;
}
/* ---------- 联机大厅 ---------- */
function renderLobby() {
  const L = NET.lobby || {}, host = NET.role === 'host', guest = NET.role === 'guest', sc = SCRIPTS.renchiren;
  let body = '';
  if (!NET.role) body = `<div class="card" style="max-width:520px;margin:0 auto">
      <h3>和一个朋友联机</h3><p class="mut">两人各用自己的设备，各看各的剧本；剩下的位置由 AI 扮演。由开房间的一方运行 AI。</p>
      <button class="pri" style="width:100%" onclick="NET.host()">开一个房间</button>
      <div style="display:flex;gap:8px;margin-top:14px"><input id="jcode" class="code" maxlength="4" placeholder="房间码" style="flex:1;text-transform:uppercase" autocomplete="off"><button onclick="NET.join($('#jcode').value)">加入</button></div>
      ${ARTIFACT ? '<p class="acc small">注意：claude.ai 里的版本不能联机（浏览器安全设置挡住了直连），请在游戏厅网址里玩联机。</p>' : ''}
      <p class="mut small" id="netmsg">${esc(NET.msg || '')}</p></div>`;
  else {
    const seatRole = s => (L.roles || [])[s];
    const roleBtns = s => (L.mode === 'det' && s === 0 ? ['det'] : sc.suspects).map(r => { const taken = (L.roles || []).some((x, i) => x === r && i !== s); const mine = s === (host ? 0 : 1);
      return `<button class="opt ${seatRole(s) === r ? 'on' : ''}" ${taken || !mine ? 'disabled' : ''} onclick="NET.pick('${r}')"><b>${sealH(r)} ${esc(sc.roles[r].name)}</b><span class="mut small">${esc(sc.roles[r].title)}</span></button>`; }).join('');
    body = `<div class="card" style="max-width:760px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="flex:1">房间 <span class="code acc" style="font-size:28px">${esc(NET.code || '----')}</span></h3>
      <span>${NET.conn ? '🟢 朋友已连接' : host ? '🟡 等朋友输入房间码…' : '🟡 正在连接…'}</span>
      ${host ? `<button class="sm" onclick="UI.copy('${esc(NET.code || '')}')">复制房间码</button>` : ''}</div>
      <p class="mut small">${esc(NET.msg || '')}</p>
      <h3>剧本：人吃人</h3>
      <div class="pick" style="margin-bottom:10px">
        <button class="opt ${L.mode === 'sus' ? 'on' : ''}" ${host ? '' : 'disabled'} onclick="NET.setMode('sus')"><b>🎭 两人都入局</b><span class="mut small">各拿一本嫌疑人剧本，另外两人是 AI。</span></button>
        <button class="opt ${L.mode === 'det' ? 'on' : ''}" ${host ? '' : 'disabled'} onclick="NET.setMode('det')"><b>🕵 房主当侦探</b><span class="mut small">朋友拿一本嫌疑人剧本，其余三人是 AI。</span></button>
      </div>
      <h3>房主的角色</h3><div class="pick">${roleBtns(0)}</div>
      <h3 style="margin-top:12px">朋友的角色</h3><div class="pick">${roleBtns(1)}</div>
    </div>`;
  }
  const can = host && NET.conn && L.roles && L.roles[0] && L.roles[1];
  app().innerHTML = `<div class="scr"><div class="top"><button class="ghost sm" onclick="NET.leave();UI.go('title')">‹ 返回</button><span class="ph">联机</span></div>
  <div class="main">${body}</div>
  <div class="bar">${host ? `<button class="pri" ${can ? '' : 'disabled'} onclick="NET.start()">开始游戏</button>` : guest ? '<span class="mut">等房主开始…</span>' : ''}</div></div>`;
}
/* ---------- 游戏 ---------- */
function topBar() {
  const p = PHASES[phaseIdx(G.phase)], r = myRole(), sc = S();
  const np = G.prompts.filter(x => x.to === r).length;
  const mins = PH_MIN[G.phase];
  return `<div class="top"><button class="ghost sm" onclick="UI.modal('menu')">≡</button>
    <span class="ph">${esc(p.name)}</span><span class="tm" id="ptm">${mins ? fmtT(Date.now() - G.pt0) + ' / 建议 ' + mins + ' 分' : ''}</span><span class="sp"></span>
    ${r ? sealH(r) + '<span class="nm small">' + esc(sc.roles[r].name) + '</span>' : ''}
    <button class="sm ghost" onclick="UI.modal('book')">📖</button>
    <button class="sm ghost" onclick="UI.modal('clues')">🗂 ${G.pub.filter(i => sc.clues[i]).length + (G.own[r] || []).length}</button>
    <button class="sm ghost" onclick="UI.modal('tl')">🕒</button>
    ${np ? `<button class="sm" onclick="UI.modal('prompt')">有人问你<span class="prompt-badge">${np}</span></button>` : ''}</div>`;
}
function readyBar(label, extra, dis) {
  const r = myRole(), hs = humanRoles(G), rd = G.ready[r];
  const others = hs.filter(x => x !== r).map(x => (G.ready[x] ? '✓ ' : '… ') + S().roles[x].name).join('　');
  return `<div class="bar">${extra || ''}<span class="sp"></span>${hs.length > 1 ? `<span class="mut small">${esc(others)}</span>` : ''}
    ${rd ? `<button onclick="act({t:'unready'})">等对方…（取消）</button>` : `<button class="pri" ${dis ? 'disabled' : ''} onclick="act({t:'ready'})">${label}</button>`}</div>`;
}
function renderGame() {
  const ph = G.phase, f = { read: gRead, intro: gIntro, r1: gR1, d1: gDisc, r2: gR2, d2: gDisc, answer: gAnswer, reveal: gReveal }[ph];
  const keep = $('.main') && U._ph === ph ? $('.main').scrollTop : null, atBottom = $('.main') && ($('.main').scrollHeight - $('.main').scrollTop - $('.main').clientHeight < 80);
  app().innerHTML = `<div class="scr" ${U._ph === ph ? 'style="animation:none"' : ''}>${topBar()}${f()}</div>`;
  const m = $('.main');
  if (m) { if (ph === 'd1' || ph === 'd2' || ph === 'intro') { if (U._ph !== ph || atBottom || G.log.length !== U.lastN) m.scrollTop = m.scrollHeight; } else if (keep != null) m.scrollTop = keep; }
  if (U._ph !== ph) { U._ph = ph; U.target = null; sfx('page'); }
  if (G.log.length > U.lastN && U.lastN) newLogSfx(G.log.slice(U.lastN));
  U.lastN = G.log.length;
  $$('#app canvas.cimg').forEach(c => drawImg(c));
  if (ph === 'r1') drawPlan($('#plan'), 1);
  if (ph === 'r2') drawPlan($('#plan'), 2);
  const r = myRole(), np = G.prompts.find(p => p.to === r && !U.pSeen[p.id]); if (np && !U.modalOpen && (ph === 'd1' || ph === 'd2')) { U.pSeen[np.id] = 1; UI.modal('prompt'); }
  if (U.modalOpen) UI.modal(U.modalOpen, 1);
}
function newLogSfx(es) { for (const e of es) { if (e.broke) return sfx('break'); if (e.k === 'contra') return sfx('contra'); if (e.k === 'fact') return sfx('fact'); } sfx('tick'); }
function bookHTML(tab) {
  const sc = S(), r = myRole();
  if (tab === 'bg') return '<h2>背景</h2>' + para(TEXT[sc.bg]);
  if (tab === 'rules') return '<h2>规则</h2>' + sc.rules.map(x => '<p>' + esc(x) + '</p>').join('');
  const R = sc.roles[r]; return '<h2>' + esc(R.name) + '</h2>' + para(R.bookText || TEXT[R.book]) + (R.side && !R.detective ? '<p class="mut" style="text-indent:0">本局支线：' + esc(R.side) + '</p>' : '');
}
function gRead() {
  const t = U.tab || 'mine';
  return `<div class="main"><div class="tabs">${[['bg', '背景'], ['mine', '我的剧本'], ['rules', '规则']].map(([k, n]) => `<button class="sm ${t === k ? 'on' : ''}" onclick="UI.tab('${k}')">${n}</button>`).join('')}</div>
    <div class="book">${bookHTML(t)}</div></div>` + readyBar('读完了', '<span class="mut small">剧本随时可以从顶栏 📖 再翻。</span>');
}
function logHTML(filter) {
  const r = myRole(), sc = S();
  return '<div class="log">' + G.log.filter(filter || (() => true)).map(e => {
    if (e.k === 'sys') return `<div class="sys">${esc(e.text)}</div>`;
    if (e.k === 'fact') return `<div class="fact ${e.ref && e.ref[0] === 'd' ? 'ded' : ''}">✦ ${esc(e.text)}</div>`;
    const who = e.who, to = e.to, mine = who === r;
    const hd = esc(roleName(who)) + (to ? ' → ' + esc(roleName(to)) : '') + (e.k === 'pub' ? ' · 公开' : e.k === 'show' ? ' · 出示' : e.k === 'contra' ? ' · 指出矛盾' : '');
    const tx = e.k === 'show' || e.k === 'pub' ? esc(e.text) + (e.ref && sc.clues[e.ref] ? `<div class="small mut" style="margin-top:4px">${esc(sc.clues[e.ref].text.slice(0, 80))}${sc.clues[e.ref].text.length > 80 ? '…' : ''}</div>` : '') : esc(e.text);
    return `<div class="msg k-${e.k} ${mine ? 'mine' : ''} ${e.broke ? 'brk' : ''} ${e.k === 'contra' ? 'contra' : ''}">${sealH(who)}<div class="bd"><div class="hd2">${hd}</div><div class="tx">${tx}</div></div></div>`;
  }).join('') + '</div>';
}
function gIntro() { return `<div class="main">${logHTML(e => e.k === 'intro')}</div>` + readyBar('开始勘查现场'); }
function gR1() {
  const sc = S(), seen = Object.keys(sc.clues).filter(c => sc.clues[c].r === 1 && G.pub.includes(c));
  const hots = Object.keys(sc.clues).filter(c => sc.clues[c].r === 1).map(c => { const p = sc.spots[c]; return `<button class="hot ${G.pub.includes(c) ? 'done' : ''}" style="left:${p[0] * 100}%;top:${p[1] * 100}%" onclick="UI.look('${c}')">${esc(sc.clues[c].title)}</button>`; }).join('');
  return `<div class="main"><div class="wrap"><div class="plan"><canvas id="plan"></canvas>${hots}</div>
    <p class="mut small" style="text-align:center">赵慈善借住的屋子 · 5 月 15 日清晨 · 点位置查看</p>
    <div class="grid">${seen.map(c => clueCard(c)).join('')}</div></div></div>` + readyBar('开始讨论', `<span class="mut small">已看 ${seen.length}/7</span>`, seen.length < 4 && humanRoles(G).length === 1);
}
function clueCard(id, extra) {
  const sc = S(), c = sc.clues[id]; if (!c) { const f = sc.facts[id]; return f ? `<div class="cl"><div class="tx">${esc(f.text)}</div>${extra || ''}</div>` : ''; }
  return `<div class="cl ${(G.own[myRole()] || []).includes(id) ? 'priv' : ''}"><h3>${esc(c.title)}${c.owner ? ' <span class="mut small">· ' + esc(roleName(c.owner)) + '</span>' : ''}</h3>${c.img ? `<canvas class="cimg" data-img="${c.img}" width="420" height="300" style="width:100%;max-width:420px;border-radius:8px;display:block;margin:4px 0 8px"></canvas>` : ''}<div class="tx">${esc(c.text)}</div>${extra || ''}</div>`;
}
function gR2() {
  const sc = S(), r = myRole(), ap = G.ap[r] || 0;
  const items = Object.keys(sc.clues).filter(c => sc.clues[c].r === 2);
  const groups = sc.suspects.concat(['scene']).map(o => {
    const its = items.filter(c => (sc.clues[c].owner || 'scene') === o); if (!its.length) return '';
    const cards = its.map((c, i) => { const t = G.taken[c]; const mine = t === r, pubd = G.pub.includes(c);
      if (t) return `<div class="it ${mine ? 'got' : 'gone'}">${mine || pubd ? '<b>' + esc(sc.clues[c].title) + '</b>' : '？'}<span class="small mut">${mine ? (pubd ? '你搜到 · 已公开' : '你搜到 · 未公开') : esc(roleName(t)) + '搜走' + (pubd ? ' · 已公开' : '')}</span></div>`;
      const dis = o === r || ap <= 0; return `<button class="it" ${dis ? 'disabled' : ''} onclick="act({t:'search',id:'${c}'})"><b>${o === 'scene' ? '🔍 ' + esc(sc.clues[c].title) : '线索 ' + (i + 1)}</b><span class="small mut">${o === r ? '不能搜自己' : '花 1 点查看'}</span></button>`; }).join('');
    return `<div style="margin-bottom:14px"><h3>${o === 'scene' ? '🏚 现场深入调查' : sealH(o) + ' ' + esc(roleName(o))}</h3><div class="items">${cards}</div></div>`;
  }).join('');
  const mine = (G.own[r] || []);
  return `<div class="main"><div class="wrap"><div class="card" style="margin-bottom:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span>行动点</span><span class="ap">${'●'.repeat(ap)}${'○'.repeat(Math.max(0, AP.human - ap))}</span><span class="mut small">搜到的线索只有你看得到，要不要公开由你决定。</span></div>
    ${groups}
    ${mine.length ? '<h3>你手上还没公开的线索</h3><div class="grid">' + mine.map(c => clueCard(c, `<div style="margin-top:8px"><button class="sm" onclick="act({t:'publish',id:'${c}'})">公开给所有人</button></div>`)).join('') + '</div>' : ''}
    <h3 style="margin-top:14px">搜证记录</h3>${logHTML(e => e.ph === 'r2')}</div></div>` + readyBar('开始第二轮讨论', `<span class="mut small">剩 ${ap} 点</span>`);
}
function gDisc() {
  const sc = S(), r = myRole(), t = U.target;
  const seats = sc.suspects.concat(G.seats.includes('det') ? ['det'] : []).map(x => `<button class="st ${t === x ? 'on' : ''}" onclick="UI.tgt('${x}')" ${x === r ? 'disabled' : ''}>${sealH(x, 1)}<span class="nm small">${esc(sc.roles[x].name)}</span><span class="${isHuman(x) ? 'me' : 'who'}">${x === r ? '你' : isHuman(x) ? '真人' : 'AI'}</span></button>`).join('');
  const budget = AI_BUDGET[G.phase] - G.aiN[G.phase];
  const canSay = r !== 'det';
  return `<div class="seats" style="border-bottom:1px solid var(--line)">${seats}</div><div class="main">${logHTML(e => e.ph === G.phase || (G.phase === 'd2' && e.ph === 'r2' && e.k !== 'sys'))}</div>
  <div class="bar">
    <button ${!t || t === 'det' ? 'disabled' : ''} onclick="UI.modal('ask')">❓ 提问${t && t !== 'det' ? '：' + esc(sc.roles[t].name) : ''}</button>
    <button ${!t || t === 'det' ? 'disabled' : ''} onclick="UI.modal('show')">🗂 出示</button>
    ${canSay ? `<button onclick="UI.modal('say')">💬 发言</button>` : ''}
    <button onclick="act({t:'listen'})" title="让 AI 说下一句">👂 听大家说${budget > 0 ? '' : '（没什么新的了）'}</button>
    <span class="sp"></span>${readyBar('结束讨论', '', false).replace(/^<div class="bar">|<\/div>$/g, '')}
  </div>`;
}
function gAnswer() {
  const sc = S(), r = myRole(), mine = G.answers[r];
  if (!U.sheet || U.sheet.length !== sc.questions.length) U.sheet = (mine || sc.questions.map(() => null)).slice();
  const qs = sc.questions.map((q, i) => `<div class="q"><div class="qt">${i + 1}. ${esc(q.q)}${i === 0 ? ' <span class="stamp" style="font-size:14px;padding:0 6px">指认</span>' : ''}</div><div class="os">${q.opts.map((o, j) => `<button class="${U.sheet[i] === j ? 'on' : ''}" ${mine ? 'disabled' : ''} onclick="UI.ans(${i},${j})">${esc(o)}</button>`).join('')}</div></div>`).join('');
  const done = U.sheet.every(x => x != null);
  const hs = humanRoles(G), wait = hs.filter(x => !G.answers[x]).map(x => sc.roles[x].name);
  return `<div class="main"><div class="book" style="font-family:var(--sans)"><h2>答　卷</h2><p class="mut" style="text-indent:0">第一题就是你的指认。${G.seats.includes('det') ? '侦探的指认决定结果，其他人的投票只作参考。' : '所有人（包括 AI）投票，票多的被指认；平票则无人被指认。'}</p>${qs}</div></div>
  <div class="bar"><span class="mut small">${mine ? '已交卷' + (wait.length ? '，等 ' + esc(wait.join('、')) + '…' : '') : '答完全部才能交卷'}</span><span class="sp"></span>${mine ? '' : `<button class="pri" ${done ? '' : 'disabled'} onclick="UI.submit()">交卷</button>`}</div>`;
}
function gReveal() {
  const sc = S(), r = myRole(), v = G.verdict, end = v === sc.killer ? sc.endings.wang : v ? sc.endings.other : sc.endings.none;
  const H = Object.assign({}, G, { answersRight: i => humanRoles(G).some(h => (G.answers[h] || [])[i] === sc.questions[i].a) });
  const votes = Object.keys(G.votes).map(x => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">${sealH(x)}<span class="nm">${esc(roleName(x))}</span><span class="mut">${isHuman(x) ? '（真人）' : '（AI）'}投给</span>${G.votes[x] ? sealH(G.votes[x]) + '<span class="nm">' + esc(roleName(G.votes[x])) + '</span>' : '<span class="mut">弃权</span>'}</div>`).join('');
  const my = G.score[r] || { s: 0, right: [] };
  const rows = sc.timeline.rows.map((row, i) => `<tr class="${i < U.tlShown ? 'show' : ''}" style="${i < U.tlShown ? '' : 'visibility:hidden'}"><td class="t">${row[0]}</td>${row.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="main"><div class="wrap">
    <div class="card" style="text-align:center;margin-bottom:14px"><div class="mut">被指认的人</div><div style="margin:10px 0">${v ? sealH(v, 1) + ' <span class="nm" style="font-size:26px">' + esc(roleName(v)) + '</span>' : '<span class="nm" style="font-size:24px">无人</span>'}</div>
      <div><span class="stamp">${v === sc.killer ? '真　凶' : '错　判'}</span></div><div class="mut" style="margin-top:10px">真凶是 ${esc(roleName(sc.killer))}</div></div>
    <div class="card" style="margin-bottom:14px"><h3>投票</h3>${votes}</div>
    <div class="card ending" style="margin-bottom:14px"><h2>${esc(end.title)}</h2>${para(end.text.replace('{name}', roleName(v)))}</div>
    <div class="card" style="margin-bottom:14px;overflow:auto"><h3>那一夜</h3><table class="tl"><tr><th>时间</th>${sc.timeline.cols.map(c => `<th>${esc(roleName(c))}</th>`).join('')}</tr>${rows}</table>
      ${U.tlShown < sc.timeline.rows.length ? '<button class="sm" style="margin-top:8px" onclick="UI.tlAll()">全部显示</button>' : ''}</div>
    <div class="card" style="margin-bottom:14px"><h3>案件解析（原文）</h3><div class="ending" style="font-size:16px">${para(TEXT[sc.truth])}</div></div>
    <div class="card" style="margin-bottom:14px"><h3>后来</h3>${sc.epilogues.map(e => `<p style="font-family:var(--serif);line-height:1.9">${esc(e.text(H))}</p>`).join('')}</div>
    <div class="card"><h3>你的得分：<span class="acc" style="font-size:28px">${my.s}</span></h3>
      ${sc.questions.map((q, i) => `<div class="small">${my.right[i] ? '✅' : '❌'} ${i + 1}. ${esc(q.q)} <span class="mut">正确：${esc(q.opts[q.a])}</span></div>`).join('')}
      ${my.side != null ? `<div style="margin-top:8px">${my.side ? '✅' : '❌'} 支线：${esc(sc.roles[r].side)}（+10）</div>` : ''}
      ${humanRoles(G).filter(x => x !== r).map(x => `<div class="mut" style="margin-top:6px">${esc(roleName(x))}：${(G.score[x] || {}).s || 0} 分</div>`).join('')}
    </div></div></div>
  <div class="bar"><button class="ghost" onclick="UI.toTitle()">回到标题</button><span class="sp"></span>${NET.role === 'guest' ? '' : '<button class="pri" onclick="UI.again()">再玩一次</button>'}</div>`;
}

/* ---------- 弹窗 ---------- */
function dlg(title, body, foot) { return `<div class="mask" onclick="if(event.target===this)UI.close()"><div class="dlg"><div class="dh"><h3>${title}</h3><button class="sm ghost" onclick="UI.close()">✕</button></div><div class="db">${body}</div>${foot ? '<div class="df">' + foot + '</div>' : ''}</div></div>`; }
function modalHTML(k) {
  const sc = G ? S() : SCRIPTS.renchiren, r = G ? myRole() : null;
  if (k === 'rules') return dlg('玩法说明', `<div style="line-height:1.9">${sc.rules.map(x => '<p>· ' + esc(x) + '</p>').join('')}<p>· <b>当侦探</b>：四名嫌疑人都是 AI。你可以向任何人提问、出示线索和证词；被戳中的人会改口说实话。点“听大家说”，AI 们会互相质问、提出推论。</p><p>· <b>入局</b>：AI 也会来问你。你只能从你的剧本允许的说法里选——不是凶手就不能撒谎，只能回避。</p><p>· 顶栏 📖 剧本、🗂 线索箱、🕒 时间线板随时可以看。</p></div>`);
  if (k === 'opts') return dlg('设置', [['anim', '动画'], ['sound', '声音'], ['autoAI', 'AI 自动插话（每两次操作后）']].map(([o, n]) => `<label style="display:flex;align-items:center;gap:10px;padding:10px 0;font-size:17px"><input type="checkbox" ${OPT[o] ? 'checked' : ''} onchange="OPT['${o}']=this.checked;saveOpt();render()" style="width:22px;height:22px"> ${n}</label>`).join(''));
  if (k === 'menu') return dlg('菜单', `<div class="optl"><button onclick="UI.close();UI.modal('rules')">玩法说明</button><button onclick="UI.close();UI.modal('opts')">设置</button>
    <button onclick="UI.toTitle(this)">回到标题（${NET.role ? '离开房间' : '进度已自动保存'}）</button>${HUB ? '<button onclick="UI.hub(this)">返回游戏厅</button>' : ''}</div>`);
  if (!G) return '';
  if (k === 'book') { const t = U.btab || 'mine'; return dlg('剧本', `<div class="tabs">${[['bg', '背景'], ['mine', '我的剧本'], ['rules', '规则']].map(([x, n]) => `<button class="sm ${t === x ? 'on' : ''}" onclick="U.btab='${x}';UI.modal('book',1)">${n}</button>`).join('')}</div><div class="book">${bookHTML(t)}</div>`); }
  if (k === 'clues') {
    const t = U.mtab, disc = G.phase === 'd1' || G.phase === 'd2';
    const pubC = G.pub.filter(i => sc.clues[i]), pubF = G.pub.filter(i => sc.facts[i]), mine = G.own[r] || [];
    const btn = id => disc ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${sc.suspects.filter(x => x !== r).map(x => `<button class="sm" onclick="UI.doShow('${x}','${id}')">出示给${esc(sc.roles[x].name)}</button>`).join('')}${mine.includes(id) ? `<button class="sm" onclick="act({t:'publish',id:'${id}'})">只公开</button>` : ''}</div>` : (mine.includes(id) ? `<div style="margin-top:8px"><button class="sm" onclick="act({t:'publish',id:'${id}'})">公开</button></div>` : '');
    const list = t === 'pub' ? pubC : t === 'mine' ? mine : pubF;
    return dlg('线索箱', `<div class="tabs">${[['pub', '公开线索 ' + pubC.length], ['mine', '我私有的 ' + mine.length], ['fact', '证词与推论 ' + pubF.length]].map(([x, n]) => `<button class="sm ${t === x ? 'on' : ''}" onclick="U.mtab='${x}';UI.modal('clues',1)">${n}</button>`).join('')}</div>
      <div style="display:flex;flex-direction:column;gap:10px">${list.length ? list.map(id => clueCard(id, btn(id))).join('') : '<p class="mut">还没有。</p>'}</div>`);
  }
  if (k === 'tl') {
    const times = ['20:30', '21:00', '21:05', '21:10', '21:15', '21:25', '21:30', '21:40'], cols = sc.timeline.cols;
    const facts = G.pub.filter(i => sc.facts[i] && sc.facts[i].t);
    const cell = (t, c) => facts.filter(i => sc.facts[i].t === t && sc.facts[i].who === c).map(i => esc(sc.facts[i].text.replace(/^[^：]+：/, ''))).join('<br>');
    const other = G.pub.filter(i => sc.facts[i] && !sc.facts[i].t);
    return dlg('时间线板', `<p class="mut small">只放已经公开的证词。注意：凶手的证词可能是假的。</p><div style="overflow:auto"><table class="tl"><tr><th>时间</th>${cols.map(c => `<th>${esc(roleName(c))}</th>`).join('')}</tr>
      ${times.map(t => `<tr><td class="t">${t}</td>${cols.map(c => `<td>${cell(t, c)}</td>`).join('')}</tr>`).join('')}</table></div>
      <h3 style="margin-top:12px">其他证词与推论</h3>${other.length ? other.map(i => `<div class="fact ${i[0] === 'd' ? 'ded' : ''}" style="margin:6px 0">${esc(sc.facts[i].text)}</div>`).join('') : '<p class="mut">还没有。</p>'}`);
  }
  if (k === 'ask') {
    const t = U.target; if (!t) return '';
    const tops = sc.topics.filter(x => !x.when || x.when(mkP(G))).map(x => x.id).concat(sc.suspects.filter(x => x !== t && x !== r).map(x => 'about_' + x));
    return dlg('问' + esc(sc.roles[t].name), `<div class="optl">${tops.map(x => `<button onclick="UI.doAsk('${t}','${x}')">${esc(topicQ(sc, x))}${G.asked[t + ':' + x] ? ' <span class="mut small">（问过）</span>' : ''}</button>`).join('')}</div>`);
  }
  if (k === 'show') {
    const t = U.target; if (!t) return '';
    const ids = (G.own[r] || []).concat(G.pub);
    return dlg('向' + esc(sc.roles[t].name) + '出示', `<p class="mut small">线索和证词都能出示。出示私有线索等于公开它。</p><div class="optl">${ids.map(id => `<button onclick="UI.doShow('${t}','${id}')">${sc.clues[id] ? '🗂 ' + esc(sc.clues[id].title) + ((G.own[r] || []).includes(id) ? ' <span class="acc small">（私有）</span>' : '') : '✦ ' + esc(sc.facts[id].text)}</button>`).join('')}</div>`);
  }
  if (k === 'say') {
    const d = sc.deck[r] || {}; const opts = [];
    for (const tp in d) deckFor(G, r, tp).forEach((e, i) => { if (e.vol && !(G.saidV || {})[r + ':' + e.say.slice(0, 12)]) opts.push([tp, i, e]); });
    return dlg('主动发言', `<p class="mut small">从你的剧本允许的说法里选。${r === sc.killer ? '你是凶手，可以说谎。' : '你不是凶手，不能说谎。'}</p>${opts.length ? '' : '<p class="mut">能主动说的都说过了。</p>'}<div class="optl">${opts.map(([tp, i, e]) => `<button onclick="UI.doSay('${tp}',${i})"><span class="k k-${e.kind}">${{ truth: '实话', lie: '谎话', evade: '回避' }[e.kind]}</span>${esc(e.say)}${e.tip ? ' <span class="mut small">（' + esc(e.tip) + '）</span>' : ''}</button>`).join('')}</div>`);
  }
  if (k === 'prompt') {
    const p = G.prompts.find(x => x.to === r); if (!p) return '';
    const list = deckFor(G, r, p.topic);
    return dlg(esc(roleName(p.from)) + '问你', `<div class="msg">${sealH(p.from)}<div class="bd"><div class="tx">${p.clue ? '（出示了' + esc(itemTitle(sc, p.clue)) + '）' : ''}${esc(topicQ(sc, p.topic === '_' ? 'where' : p.topic))}</div></div></div>
      ${p.clue ? clueCard(p.clue) : ''}<h3 style="margin-top:12px">你怎么回答？</h3>
      <div class="optl">${list.map((e, i) => `<button onclick="UI.doSay(null,${i},${p.id})"><span class="k k-${e.kind}">${{ truth: '实话', lie: '谎话', evade: '回避' }[e.kind]}</span>${esc(e.say)}${e.tip ? ' <span class="mut small">（' + esc(e.tip) + '）</span>' : ''}</button>`).join('')}</div>`);
  }
  return '';
}

const UI = {
  go(s) { U.scr = s; U.modalOpen = null; closeMask(); render(); },
  hub(b) { if (G && U.scr === 'game' && NET.role) { if (!U.hubArm) { U.hubArm = 1; b.textContent = '再点一次确认'; setTimeout(() => U.hubArm = 0, 3000); return; } } save(); NET.leave(); location.href = '../'; },
  resume() { G = loadSave('renchiren'); ME = { seat: 0 }; U.scr = 'game'; U.lastN = G.log.length; render(); },
  pickSc(id) { U.setup.sid = id; render(); },
  setMode(m) { U.setup.mode = m; render(); },
  setRole(r) { U.setup.role = r; render(); },
  start() {
    const st = U.setup, sc = SCRIPTS[st.sid]; let role = st.mode === 'det' ? 'det' : st.role;
    if (role === 'rand') role = sc.suspects[Math.floor(Math.random() * 4)];
    G = newGame(st.sid, st.mode, [role]); ME = { seat: 0 }; U.scr = 'game'; U.tab = 'mine'; U.lastN = 0; U.sheet = null; U.tlShown = 0; save(); render();
    if (st.role === 'rand') toast('你抽到了：' + sc.roles[role].name, 3000);
  },
  tab(t) { U.tab = t; render(); },
  tgt(x) { U.target = U.target === x ? null : x; render(); },
  look(c) { act({ t: 'look', id: c }); U.modalOpen = null; showClue(c); },
  doAsk(t, tp) { UI.close(); act({ t: 'ask', to: t, topic: tp }); },
  doShow(t, id) { UI.close(); act({ t: 'show', to: t, id }); },
  doSay(tp, i, pid) { UI.close(); act(pid != null ? { t: 'say', i, pid } : { t: 'say', topic: tp, i }); },
  ans(i, j) { U.sheet[i] = j; render(); },
  submit() { act({ t: 'answers', v: U.sheet.slice() }); },
  tlAll() { U.tlShown = 99; render(); },
  copy(t) { try { navigator.clipboard.writeText(t); toast('已复制'); } catch (e) { toast(t); } },
  toTitle(b) { if (NET.role && b && !U.titleArm) { U.titleArm = 1; b.textContent = '再点一次确认（会离开房间）'; setTimeout(() => U.titleArm = 0, 3000); return; } save(); NET.leave(); G = null; UI.go('title'); },
  again() { const g = G; if (NET.role === 'host') { NET.restart(); return; } G = newGame(g.sid, g.mode, g.seats); U.lastN = 0; U.sheet = null; U.tlShown = 0; save(); render(); },
  modal(k, keep) { closeMask(); const h = modalHTML(k); if (!h) { U.modalOpen = null; return; } U.modalOpen = k; document.body.insertAdjacentHTML('beforeend', h); $$('.mask canvas.cimg').forEach(c => drawImg(c)); if (!keep) sfx('tick'); },
  close() { U.modalOpen = null; closeMask(); }
};
function closeMask() { $$('.mask').forEach(m => m.remove()); }
function showClue(c) { closeMask(); U.modalOpen = null; document.body.insertAdjacentHTML('beforeend', dlg('线索', clueCard(c))); $$('.mask canvas.cimg').forEach(x => drawImg(x)); sfx('fact'); }
setInterval(() => { const e = $('#ptm'); if (e && G && PH_MIN[G.phase]) e.textContent = fmtT(Date.now() - G.pt0) + ' / 建议 ' + PH_MIN[G.phase] + ' 分'; }, 1000);
setInterval(() => { if (G && G.phase === 'reveal' && U.scr === 'game' && U.tlShown < S().timeline.rows.length) { U.tlShown++; if (!U.modalOpen) render(); } }, 900);
