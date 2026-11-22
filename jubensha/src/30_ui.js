/* 剧本杀 · 界面 */
const U = { scr: 'title', setup: { sid: 'renchiren', mode: 'det', role: null, diff: 'std' }, tab: 'mine', btab: 'mine', target: null, modalOpen: null, mtab: 'pub',
  seenI: 0, pSeen: {}, hintSeen: 0, logAll: false, endArm: 0, hubArm: 0, titleArm: 0, sheet: null, sheetGid: '', tlShown: 0, linkSel: [], unread: 0, typing: [], lastStatus: '' };
const app = () => $('#app');
const PH_MIN = { read: 5, intro: 2, r1: 5, d1: 15, r2: 5, d2: 20, final: 2, answer: 5 };
const KIND = { truth: '实话', lie: '谎话', evade: '回避' };
const narrow = () => innerWidth <= 640;
function sealH(r, big) { const sc = G ? S() : SCRIPTS.renchiren; const R = r === 'zhao' ? { seal: '赵', color: '#3d3d3d' } : r === 'deduce' ? { seal: '推', color: '#8a2b1f' } : (sc && sc.roles[r]) || { seal: '?', color: '#555' }; return '<span class="seal' + (big ? ' big' : '') + '" style="--c:' + R.color + '">' + R.seal + '</span>'; }
function toast(t, ms) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), ms || 2600); }
function fmtT(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
const phaseClock = () => Date.now() - (NET.skew || 0) - G.pt0;
/* 剧本段落：可以点一下摘进笔记 */
const para = (s, quotable) => esc(s).split(/\n\n+/).map(p => '<p' + (quotable ? ' class="q"' : '') + '>' + p.replace(/\n/g, '<br>').replace(/【([^】]+)】/g, '<b class="hd">【$1】</b>') + '</p>').join('');
/* 每局的本地数据：笔记、看过的线索 */
const localKey = k => k + '-' + G.gid + '-' + myRole();
const notes = () => lsGet(localKey('notes'), { text: '', quotes: [] });
const seenClues = () => new Set(lsGet(localKey('seenc'), []));

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
  const cont = sv && sv.phase !== 'reveal' ? (sv.mode === 'net' && (sv.seats.filter(Boolean).length > 1 || sv.guestRole)
    ? `<button onclick="UI.modal('resumeNet')">继续上次联机（房间 ${esc(sv.room || '----')} · ${esc(PHASES[phaseIdx(sv.phase)].name)}）</button>`
    : `<button onclick="UI.resume()">继续上次（${esc(SCRIPTS[sv.sid].title)} · ${esc(PHASES[phaseIdx(sv.phase)].name)}）</button>`) : '';
  app().innerHTML = `<div class="scr" style="position:relative">
    ${HUB ? '<button class="ghost sm hubbtn" onclick="UI.hub(this)">‹ 游戏厅</button>' : ''}
    <div class="title"><div class="sub">剧本杀</div><h1>夜半推理馆</h1>
    <div class="mut" style="max-width:520px;font-family:var(--serif);line-height:1.8">一个人当侦探，或者和一个朋友各自入局；其余的位置由 AI 扮演——他们会隐瞒、会回避，凶手会说谎。</div>
    <div class="btns"><button class="pri" onclick="UI.go('setup')">开始新的案件</button>${cont}
      <button onclick="UI.go('lobby')">🔗 和朋友联机</button>
      <button class="ghost" onclick="UI.modal('rules')">玩法说明</button><button class="ghost" onclick="UI.modal('opts')">设置</button></div></div></div>`;
}
const diffPick = (cur, fn, dis) => `<div class="pick">${Object.keys(DIFF).map(k => `<button class="opt ${cur === k ? 'on' : ''}" ${dis ? 'disabled' : ''} onclick="${fn}('${k}')"><b>${DIFF[k].name}</b><span class="mut small">${esc(DIFF[k].desc)}</span></button>`).join('')}</div>`;
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
    ${st.mode === 'sus' ? `<h3>选一个角色</h3><div class="pick" style="margin-bottom:14px">${roleOpts}</div>` : ''}
    <h3>难度</h3>${diffPick(st.diff, 'UI.setDiff')}
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
      <div style="display:flex;gap:8px;margin-top:14px"><input id="jcode" class="code" maxlength="4" placeholder="房间码" style="flex:1;text-transform:uppercase" autocomplete="off" onkeydown="if(event.key==='Enter')NET.join(this.value)"><button onclick="NET.join($('#jcode').value)">加入</button></div>
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
      <p class="mut small" id="netmsg">${esc(NET.msg || '')}</p>
      <h3>剧本：人吃人</h3>
      <div class="pick" style="margin-bottom:10px">
        <button class="opt ${L.mode === 'sus' ? 'on' : ''}" ${host ? '' : 'disabled'} onclick="NET.setMode('sus')"><b>🎭 两人都入局</b><span class="mut small">各拿一本嫌疑人剧本，另外两人是 AI。</span></button>
        <button class="opt ${L.mode === 'det' ? 'on' : ''}" ${host ? '' : 'disabled'} onclick="NET.setMode('det')"><b>🕵 房主当侦探</b><span class="mut small">朋友拿一本嫌疑人剧本，其余三人是 AI。</span></button>
      </div>
      <h3>难度</h3>${diffPick(L.diff || 'std', 'NET.setDiff', !host)}
      <h3 style="margin-top:12px">房主的角色</h3><div class="pick">${roleBtns(0)}</div>
      <h3 style="margin-top:12px">朋友的角色</h3><div class="pick">${roleBtns(1)}</div>
    </div>`;
  }
  const can = host && NET.conn && L.roles && L.roles[0] && L.roles[1];
  app().innerHTML = `<div class="scr"><div class="top"><button class="ghost sm" onclick="NET.leave();UI.go('title')">‹ 返回</button><span class="ph">联机</span></div>
  <div class="main">${body}</div>
  <div class="bar">${host ? `<button class="pri" ${can ? '' : 'disabled'} onclick="NET.start()">开始游戏</button>` : guest ? '<span class="mut">等房主开始…</span>' : ''}</div></div>`;
}
/* ---------- 游戏 ---------- */
function partnerLine() {
  const r = myRole(), o = humanRoles(G).filter(x => x !== r)[0]; if (!o) return '';
  return `<span class="mut small partner">${sealH(o)} ${esc(S().roles[o].name)}：${esc(G.status[o] || (G.ready[o] ? '准备好了' : '在这一阶段'))}</span>`;
}
function topBar() {
  const p = PHASES[phaseIdx(G.phase)], r = myRole(), sc = S();
  const np = G.prompts.filter(x => x.to === r).length, mins = PH_MIN[G.phase], unseen = newClueCount();
  return `<div class="top"><button class="ghost sm" onclick="UI.modal('menu')">≡</button>
    <span class="ph">${esc(p.name)}</span><span class="tm" id="ptm">${mins ? fmtT(phaseClock()) + ' / 建议 ' + mins + ' 分' : ''}</span>${partnerLine()}<span class="sp"></span>
    ${r ? sealH(r) + '<span class="nm small hide-n">' + esc(sc.roles[r].name) + '</span>' : ''}
    ${G.ai ? `<button class="aichip" onclick="${NET.role === 'guest' ? "toast('房主开着 Claude：AI 玩家由 Claude 扮演')" : "UI.modal('ai')"}" title="AI 玩家由 Claude 扮演">✦ Claude</button>` : ''}
    <button class="sm ghost" onclick="UI.modal('book')" title="剧本">📖</button>
    <button class="sm ghost" onclick="UI.modal('notes')" title="笔记">📝</button>
    <button class="sm ghost" onclick="UI.modal('clues')" title="线索箱">🗂 ${G.pub.filter(i => sc.clues[i]).length + (G.own[r] || []).length}${unseen ? '<span class="dot"></span>' : ''}</button>
    <button class="sm ghost" onclick="UI.modal('tl')" title="时间线板">🕒</button>
    ${np ? `<button class="sm" onclick="UI.modal('prompt')">有人问你<span class="prompt-badge">${np}</span></button>` : ''}</div>`;
}
function newClueCount() { if (!G) return 0; const seen = seenClues(); return G.pub.concat(G.own[myRole()] || []).filter(i => !seen.has(i)).length; }
function readyBar(label, extra, dis) {
  const r = myRole(), hs = humanRoles(G), rd = G.ready[r];
  const others = hs.filter(x => x !== r).map(x => (G.ready[x] ? '✓ ' : '… ') + S().roles[x].name).join('　');
  return `<div class="bar">${extra || ''}<span class="sp"></span>${hs.length > 1 ? `<span class="mut small">${esc(others)}</span>` : ''}
    ${rd ? `<button onclick="act({t:'unready'})">等对方…（取消）</button>` : `<button class="pri" ${dis ? 'disabled' : ''} onclick="act({t:'ready'})">${label}</button>`}</div>`;
}
function renderGame() {
  const ph = G.phase, f = { read: gRead, intro: gIntro, r1: gR1, d1: gDisc, r2: gR2, d2: gDisc, final: gFinal, answer: gAnswer, reveal: gReveal }[ph];
  const m0 = $('.main'), samePh = U._ph === ph, keep = m0 && samePh ? m0.scrollTop : null;
  const atBottom = m0 && (m0.scrollHeight - m0.scrollTop - m0.clientHeight < 60);
  const r = myRole(), fresh = G.log.filter(e => e.i > U.seenI);
  if (G.gid !== U.gid) { U.gid = G.gid; U.seenI = fresh.length > 8 ? G.log[G.log.length - 1].i : 0; U.unread = 0; U.sheet = null; U.tlShown = 0; U.linkSel = []; U.endArm = 0; U.hintSeen = (G.hintText[r] || {}).n || 0; }
  const fq0 = $('#freeq'), fqv = fq0 ? fq0.value : '', fqf = fq0 && document.activeElement === fq0, fqs = fq0 ? fq0.selectionStart : 0;
  app().innerHTML = `<div class="scr" ${samePh ? 'style="animation:none"' : ''}>${topBar()}${f()}</div>`;
  const fq1 = $('#freeq'); if (fq1 && fqv) { fq1.value = fqv; } if (fq1 && fqf) { fq1.focus(); try { fq1.setSelectionRange(fqs, fqs); } catch (e) { } }
  const m = $('.main'), chatty = ph === 'd1' || ph === 'd2' || ph === 'intro' || ph === 'final';
  if (m) {
    if (chatty) {
      const mine = fresh.some(e => e.who === r && (e.k === 'ask' || e.k === 'show' || e.k === 'say' || e.k === 'pub' || e.k === 'chat'));
      if (!samePh || atBottom || mine || keep == null) { m.scrollTop = m.scrollHeight; U.unread = 0; }
      else { m.scrollTop = keep; U.unread += fresh.length; }
      m.onscroll = () => { if (m.scrollHeight - m.scrollTop - m.clientHeight < 60 && U.unread) { U.unread = 0; const b = $('.newbtn'); if (b) b.remove(); } };
      if (U.unread) m.insertAdjacentHTML('afterend', `<button class="newbtn" onclick="UI.toBottom()">↓ ${U.unread} 条新消息</button>`);
    } else if (keep != null) m.scrollTop = keep;
  }
  if (!samePh) { U._ph = ph; U.target = null; U.endArm = 0; sfx('page'); }
  if (fresh.length && U.seenI) { newLogSfx(fresh); fxFor(fresh); typeNew(fresh); }
  const voicedNow = G.log.filter(e => e.v === 'a' && !AIJ.voiced[e.i]); voicedNow.forEach(e => AIJ.voiced[e.i] = 1);
  if (voicedNow.length && U.seenI) typeNew(voicedNow);
  U.seenI = G.log.length ? G.log[G.log.length - 1].i : 0;
  const fm = (G.freeMsg || {})[r]; if (fm && fm.n !== U.freeSeen) { U.freeSeen = fm.n; toast(fm.text, 4200); const fi = $('#freeq'); if (fm.back && fi && !fi.value) fi.value = fm.back; }
  $$('#app canvas.cimg').forEach(c => drawImg(c));
  if (ph === 'r1') drawPlan($('#plan'), 1);
  if (ph === 'r2') drawPlan($('#plan'), 2);
  const pkey = p => G.gid + ':' + p.id, np = G.prompts.find(p => p.to === r && !U.pSeen[pkey(p)]);
  if (np && !U.modalOpen && (ph === 'd1' || ph === 'd2')) { U.pSeen[pkey(np)] = 1; UI.modal('prompt'); }
  const h = G.hintText[r]; if (h && h.n !== U.hintSeen) { U.hintSeen = h.n; UI.modal('hint'); }
  const typingInModal = document.activeElement && document.activeElement.closest && document.activeElement.closest('.mask') && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (U.modalOpen && ['clues', 'tl', 'prompt', 'acts'].includes(U.modalOpen) && !typingInModal) UI.modal(U.modalOpen, 1);
  coach();
  if (G.restartReq && NET.role !== 'guest') { delete G.restartReq; UI.again(true); }
}
function newLogSfx(es) { for (const e of es) { if (e.broke) return sfx('break'); if (e.k === 'contra') return sfx('contra'); if (e.k === 'fact') return sfx('fact'); } sfx('tick'); }
/* 破防、推论、矛盾的演出 */
function fxFor(es) {
  if (!OPT.anim) return;
  const e = es.find(x => x.broke) || es.find(x => x.k === 'contra') || es.find(x => x.k === 'fact' && x.ref && x.ref[0] === 'd');
  if (!e) return;
  const [txt, col, sub] = e.broke ? ['破　防', S().roles[e.who].color, roleName(e.who) + '说了实话'] : e.k === 'contra' ? ['矛　盾', '#a3241b', roleName(e.to) + '的话对不上'] : ['推　论', '#8a2b1f', ''];
  $$('.fx').forEach(x => x.remove());
  document.body.insertAdjacentHTML('beforeend', `<div class="fx"><div class="fxs" style="--c:${col}">${txt}</div>${sub ? `<div class="fxt">${esc(sub)}</div>` : ''}</div>`);
  setTimeout(() => $$('.fx').forEach(x => x.remove()), 1300);
}
/* 新消息逐字出现（点记录区跳过） */
function typeNew(es) {
  if (!OPT.typing || !OPT.anim) return;
  const r = myRole(), ids = es.filter(e => (e.k === 'ans' || e.k === 'say' || e.k === 'intro' || e.k === 'final' || e.k === 'contra' || e.k === 'idle') && e.who !== r).slice(-3).map(e => e.i);
  let delay = 0;
  for (const i of ids) {
    const el = $(`.msg[data-i="${i}"] .tx`); if (!el) continue;
    const full = el.textContent; el.textContent = ''; const job = { el, full, n: 0 }; U.typing.push(job);
    const step = () => { if (job.done) return; job.n += 2; el.textContent = full.slice(0, job.n); if (job.n >= full.length) { job.done = 1; } else job.t = setTimeout(step, 16); };
    job.t = setTimeout(step, delay); delay += Math.min(1400, full.length * 8);
  }
}
function finishTyping() { for (const j of U.typing) { clearTimeout(j.t); if (!j.done) { j.done = 1; j.el.textContent = j.full; } } U.typing = []; }
function bookHTML(tab) {
  const sc = S(), r = myRole();
  if (tab === 'bg') return '<h2>背景</h2>' + para(TEXT[sc.bg], 1);
  if (tab === 'rules') return '<h2>规则</h2>' + sc.rules.map(x => '<p>' + esc(x) + '</p>').join('');
  const R = sc.roles[r]; return '<h2>' + esc(R.name) + '</h2>' + para(R.bookText || TEXT[R.book], 1) + (R.side && !R.detective ? '<p class="mut" style="text-indent:0">本局支线：' + esc(R.side) + '</p>' : '');
}
const bookTip = '<p class="mut small" style="text-align:center">点一段文字，可以摘进 📝 笔记。</p>';
function gRead() {
  const t = U.tab || 'mine';
  return `<div class="main"><div class="tabs">${[['bg', '背景'], ['mine', '我的剧本'], ['rules', '规则']].map(([k, n]) => `<button class="sm ${t === k ? 'on' : ''}" onclick="UI.tab('${k}')">${n}</button>`).join('')}</div>
    <div class="book">${bookHTML(t)}</div>${bookTip}</div>` + readyBar('读完了', '<span class="mut small">剧本随时可以从顶栏 📖 再翻。</span>');
}
function msgHTML(e) {
  const r = myRole(), sc = S();
  if (e.k === 'sys') return `<div class="sys" data-i="${e.i}">${esc(e.text)}</div>`;
  if (e.k === 'fact') return `<div class="fact ${e.ref && e.ref[0] === 'd' ? 'ded' : ''} ${e.i > U.seenI ? 'new' : ''}" data-i="${e.i}">✦ ${esc(e.text)}</div>`;
  const who = e.who, to = e.to, mine = who === r;
  const hd = esc(roleName(who)) + (to ? ' → ' + esc(roleName(to)) : '') + ({ pub: ' · 公开', show: ' · 出示', contra: ' · 指出矛盾', chat: ' · 悄悄话（AI 听不到）', final: ' · 最终陈述' }[e.k] || '');
  const tx = e.k === 'show' || e.k === 'pub' ? esc(e.text) + (e.ref && sc.clues[e.ref] ? `<div class="small mut" style="margin-top:4px">${esc(sc.clues[e.ref].text.slice(0, 80))}${sc.clues[e.ref].text.length > 80 ? '…' : ''}</div>` : '') : esc(e.text);
  const tag = e.v === 'a' ? `<span class="aitag" title="Claude 说的。脚本原句：${esc(e.text0 || '')}">Claude</span>` : '';
  const body = e.v === 'p' ? '<span class="dots"><i></i><i></i><i></i></span>' : tx;
  return `<div class="msg k-${e.k} ${mine ? 'mine' : ''} ${e.broke ? 'brk' : ''} ${e.k === 'contra' ? 'contra' : ''} ${e.i > U.seenI ? 'new' : ''}" data-i="${e.i}">${sealH(who)}<div class="bd"><div class="hd2">${hd}${tag}</div><div class="tx">${body}</div></div></div>`;
}
/* 自己刚打的话：Claude 还在理解时先显示出来，不会像没发出去 */
const pendFree = r => [G.freeCur].concat(G.freeQ || []).filter(f => f && f.role === r && f.pid == null && !f.say).map(f => `<div class="msg mine pendfree">${sealH(r)}<div class="bd"><div class="hd2">${esc(roleName(r))}${f.to ? ' → ' + esc(roleName(f.to)) : ''}</div><div class="tx">${esc(f.text)}</div><div class="small mut">Claude 在理解你的话 <span class="dots"><i></i><i></i><i></i></span></div></div></div>`).join('');
const logHTML = (filter, tail) => '<div class="log" onclick="finishTyping()">' + G.log.filter(filter || (() => true)).map(msgHTML).join('') + (tail || '') + '</div>';
function gIntro() {
  const sc = S(), r = myRole(), mine = G.introStyle[r], opts = (sc.intros || {})[r] || [];
  const pick = mine ? '' : `<div class="card" style="max-width:820px;margin:12px auto"><h3>轮到你介绍自己</h3><p class="mut small">怎么开场，大家会记住。</p><div class="optl">${opts.map((o, i) => `<button onclick="act({t:'intro',i:${i}})"><span class="k k-evade">${esc(o.label)}</span>${esc(o.say)}</button>`).join('')}</div></div>`;
  return `<div class="main">${logHTML(e => e.k === 'intro')}${pick}</div>` + readyBar('开始勘查现场', '', !mine);
}
function gR1() {
  const sc = S(), ids = Object.keys(sc.clues).filter(c => sc.clues[c].r === 1), seen = ids.filter(c => G.pub.includes(c));
  const hots = ids.map((c, n) => { const p = sc.spots[c]; return `<button class="hot ${G.pub.includes(c) ? 'done' : ''}" style="left:${p[0] * 100}%;top:${p[1] * 100}%" onclick="UI.look('${c}')" aria-label="${esc(sc.clues[c].title)}"><b>${n + 1}</b><span>${esc(sc.clues[c].title)}</span></button>`; }).join('');
  const legend = `<div class="legend">${ids.map((c, n) => `<button class="sm ${G.pub.includes(c) ? 'ghost' : ''}" onclick="UI.look('${c}')"><b>${n + 1}</b> ${esc(sc.clues[c].title)}</button>`).join('')}</div>`;
  return `<div class="main"><div class="wrap"><div class="plan" onclick="UI.planClick(event)"><canvas id="plan"></canvas>${hots}</div>${legend}
    <p class="mut small" style="text-align:center">赵慈善借住的屋子 · 5 月 15 日清晨 · 点位置查看</p>
    <div class="grid">${seen.map(c => clueCard(c)).join('')}</div></div></div>` + readyBar('开始讨论', `<span class="mut small">已看 ${seen.length}/${ids.length}</span>`, seen.length < 4 && humanRoles(G).length === 1);
}
function shownTo(id) { const t = [...new Set(G.log.filter(e => e.k === 'show' && e.ref === id).map(e => e.to))]; return t.length ? '<div class="small mut" style="margin-top:6px">已出示给：' + t.map(x => esc(roleName(x))).join('、') + '</div>' : ''; }
function clueCard(id, extra, isNew) {
  const sc = S(), c = sc.clues[id], nd = isNew ? '<span class="dot" style="position:static;display:inline-block;margin-left:6px"></span>' : '';
  if (!c) { const f = sc.facts[id]; return f ? `<div class="cl ${id[0] === 'd' ? 'ded' : ''}"><div class="tx">${esc(f.text)}${nd}</div>${shownTo(id)}${extra || ''}</div>` : ''; }
  return `<div class="cl ${(G.own[myRole()] || []).includes(id) ? 'priv' : ''}"><h3>${esc(c.title)}${c.owner ? ' <span class="mut small">· ' + esc(roleName(c.owner)) + '</span>' : ''}${nd}</h3>${c.img ? `<canvas class="cimg" data-img="${c.img}" width="420" height="300" style="width:100%;max-width:420px;border-radius:8px;display:block;margin:4px 0 8px"></canvas>` : ''}<div class="tx">${esc(c.text)}</div>${shownTo(id)}${extra || ''}</div>`;
}
function gR2() {
  const sc = S(), r = myRole(), ap = G.ap[r] || 0, max = dif().ap;
  const items = Object.keys(sc.clues).filter(c => sc.clues[c].r === 2);
  const groups = sc.suspects.concat(['scene']).map(o => {
    const its = items.filter(c => (sc.clues[c].owner || 'scene') === o); if (!its.length) return '';
    const cards = its.map((c, i) => { const t = G.taken[c]; const mine = t === r, pubd = G.pub.includes(c);
      if (t) return `<div class="it ${mine ? 'got' : 'gone'}">${mine || pubd ? '<b>' + esc(sc.clues[c].title) + '</b>' : '？'}<span class="small mut">${mine ? (pubd ? '你搜到 · 已公开' : '你搜到 · 未公开') : esc(roleName(t)) + '搜走' + (pubd ? ' · 已公开' : '')}</span></div>`;
      const dis = o === r || ap <= 0; return `<button class="it" ${dis ? 'disabled' : ''} onclick="act({t:'search',id:'${c}'})"><b>${o === 'scene' ? '🔍 ' + esc(sc.clues[c].title) : '线索 ' + (i + 1)}</b><span class="small mut">${o === r ? '不能搜自己' : ap <= 0 ? '行动点用完了' : '花 1 点查看'}</span></button>`; }).join('');
    return `<div style="margin-bottom:14px"><h3>${o === 'scene' ? '🏚 现场深入调查' : sealH(o) + ' ' + esc(roleName(o))}</h3><div class="items">${cards}</div></div>`;
  }).join('');
  const mine = (G.own[r] || []);
  return `<div class="main"><div class="wrap"><div class="card" style="margin-bottom:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span>行动点</span><span class="ap">${'●'.repeat(ap)}${'○'.repeat(Math.max(0, max - ap))}</span><span class="mut small">搜到的线索只有你看得到，要不要公开由你决定。</span></div>
    ${groups}
    ${mine.length ? '<h3>你手上还没公开的线索</h3><div class="grid">' + mine.map(c => clueCard(c, `<div style="margin-top:8px"><button class="sm" onclick="act({t:'publish',id:'${c}'})">公开给所有人</button></div>`)).join('') + '</div>' : ''}
    <h3 style="margin-top:14px">搜证记录</h3>${logHTML(e => e.ph === 'r2')}</div></div>` + readyBar('开始第二轮讨论', `<span class="mut small">剩 ${ap} 点</span><button class="sm ghost" onclick="act({t:'hint'})">💡 提示</button>`);
}
function seatStatus(x) {
  if (!dif().status || x === 'det') return '';
  const s = suspicion(G), vals = Object.values(s), mx = Math.max(1, ...vals), w = Math.max(4, Math.round(100 * Math.max(0, s[x]) / mx));
  const v = !isHuman(x) && G.pub.length > 7 ? aiVote(G, x) : null;
  return `<span class="sbar" title="大家对他的怀疑"><i style="width:${w}%"></i></span>${v ? `<span class="who">疑→${esc(S().roles[v].name.slice(0, 1))}</span>` : ''}`;
}
function discActions() {
  const sc = S(), r = myRole(), t = U.target, canAct = t && t !== 'det' && t !== r;
  const more = aiHasMore(G), canSay = r !== 'det', net = humanRoles(G).length > 1;
  const list = [
    ['ask', `❓ 提问${canAct ? '：' + esc(sc.roles[t].name) : ''}`, canAct, "UI.modal('ask')"],
    ['show', '🗂 出示', canAct, "UI.modal('show')"],
    canSay ? ['say', '💬 发言', true, "UI.modal('say')"] : null,
    ['link', '🔗 指出关联', true, "UI.modal('link')"],
    ['hint', '💡 提示', true, "UI.hint()"],
    net ? ['chat', '🗨 悄悄话', true, "UI.modal('chat')"] : null
  ].filter(Boolean);
  return { list, more };
}
function gDisc() {
  const sc = S(), r = myRole(), t = U.target;
  const seats = sc.suspects.concat(G.seats.includes('det') ? ['det'] : []).map(x => `<button class="st ${t === x ? 'on' : ''}" onclick="UI.tgt('${x}')" ${x === r ? 'disabled' : ''}>${sealH(x, 1)}<span class="nm small">${esc(sc.roles[x].name)}</span><span class="${isHuman(x) ? 'me' : 'who'}">${x === r ? '你' : isHuman(x) ? '真人' : 'AI'}</span>${seatStatus(x)}</button>`).join('');
  const { list, more } = discActions();
  const filt = U.logAll ? (e => e.k !== 'intro' || true) : (e => e.ph === G.phase || (G.phase === 'd2' && e.ph === 'r2' && e.k !== 'sys'));
  const own = (G.own[r] || []).length;
  const endLbl = U.endArm ? '再点一次结束' + (own ? `（还有 ${own} 条没公开）` : more ? '（AI 还有话没说）' : '') : '结束讨论';
  const btns = narrow() ? `<button onclick="UI.modal('acts')">🎬 行动</button>` : list.map(([k, n, ok, fn]) => `<button ${ok ? '' : 'disabled'} onclick="${fn}">${n}</button>`).join('');
  const rd = G.ready[r];
  const free = G.ai ? `<div class="freebar"><input id="freeq" maxlength="120" autocomplete="off" placeholder="${t && t !== r ? '直接打字问' + esc(sc.roles[t].name) + '，或者说“把柴刀给他看”…' : '直接打字：问谁、问什么，或者出示什么…'}" onkeydown="if(event.key==='Enter')UI.free()"><button onclick="UI.free()">发送</button></div>` : '';
  return `<div class="seats">${seats}<button class="sm ghost logtg" onclick="UI.logAll()">${U.logAll ? '只看本轮' : '全部记录'}</button></div>
  <div class="main">${logHTML(filt, pendFree(r))}</div>${free}
  <div class="bar">${btns}
    <button onclick="UI.listen()" class="${more ? '' : 'ghost'}">${more ? '👂 听大家说' : '👂 大家在等你'}</button>
    <span class="sp"></span>${humanRoles(G).length > 1 ? `<span class="mut small">${humanRoles(G).filter(x => x !== r).map(x => (G.ready[x] ? '✓ ' : '… ') + esc(sc.roles[x].name)).join(' ')}</span>` : ''}
    ${rd ? `<button onclick="act({t:'unready'})">等对方…（取消）</button>` : `<button class="pri" onclick="UI.endDisc()">${endLbl}</button>`}
  </div>`;
}
function gFinal() {
  const sc = S(), r = myRole(), opts = r !== 'det' && !G.finalSaid[r] ? deckFor(G, r, 'final') : [];
  const pick = opts.length ? `<div class="card" style="max-width:820px;margin:12px auto"><h3>你的最后一句话</h3><p class="mut small">说完就进入答卷，说的话会影响 AI 怎么投票。</p><div class="optl">${opts.map((e, i) => `<button onclick="act({t:'say',topic:'final',i:${i}})"><span class="k k-${e.kind}">${KIND[e.kind]}</span>${esc(e.say)}</button>`).join('')}</div></div>` : '';
  return `<div class="main">${logHTML(e => e.ph === 'final')}${pick}</div>` + readyBar('去答卷', `<span class="mut small">${r === 'det' ? '听完他们的陈述，然后由你指认。' : ''}</span>`, !!opts.length);
}
function gAnswer() {
  const sc = S(), r = myRole(), mine = G.answers[r];
  if (!U.sheet || U.sheetGid !== G.gid) { U.sheet = (mine || sc.questions.map(() => null)).slice(); U.sheetGid = G.gid; }
  const qs = sc.questions.map((q, i) => `<div class="q"><div class="qt">${i + 1}. ${esc(q.q)}${i === 0 ? ' <span class="stamp" style="font-size:14px;padding:0 6px">指认</span>' : ''}</div><div class="os">${q.opts.map((o, j) => `<button class="${U.sheet[i] === j ? 'on' : ''}" ${mine ? 'disabled' : ''} onclick="UI.ans(${i},${j})">${esc(o)}</button>`).join('')}</div></div>`).join('');
  const done = U.sheet.every(x => x != null), left = U.sheet.filter(x => x == null).length;
  const wait = humanRoles(G).filter(x => !G.answers[x]).map(x => sc.roles[x].name);
  return `<div class="main"><div class="book" style="font-family:var(--sans)"><h2>答　卷</h2><p class="mut" style="text-indent:0">第一题就是你的指认。${G.seats.includes('det') ? '侦探的指认决定结果，其他人的投票只作参考。' : '所有人（包括 AI）投票，票多的被指认；平票则无人被指认。'}</p>${qs}</div></div>
  <div class="bar"><span class="mut small">${mine ? '已交卷' + (wait.length ? '，等 ' + esc(wait.join('、')) + '…' : '') : left ? '还有 ' + left + ' 题没答' : '答完了'}</span><span class="sp"></span>${mine ? '' : `<button class="pri" ${done ? '' : 'disabled'} onclick="UI.submit()">交卷</button>`}</div>`;
}
function gReveal() {
  const sc = S(), r = myRole(), v = G.verdict, end = v === sc.killer ? sc.endings.wang : v ? sc.endings.other : sc.endings.none;
  const H = Object.assign({}, G, { answersRight: i => humanRoles(G).some(h => (G.answers[h] || [])[i] === sc.questions[i].a) });
  const votes = Object.keys(G.votes).map(x => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">${sealH(x)}<span class="nm">${esc(roleName(x))}</span><span class="mut">${isHuman(x) ? '（真人）' : '（AI）'}投给</span>${G.votes[x] ? sealH(G.votes[x]) + '<span class="nm">' + esc(roleName(G.votes[x])) + '</span>' : '<span class="mut">弃权</span>'}</div>`).join('');
  const my = G.score[r] || { s: 0, right: [] }, ms = G.missed || { clues: [], deduce: [], unbroken: [] };
  const rows = sc.timeline.rows.map((row, i) => `<tr style="${i < U.tlShown ? '' : 'visibility:hidden'}"><td class="t">${row[0]}</td>${row.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  const missed = [...ms.clues.map(id => '没找到的线索：' + itemTitle(sc, id)), ...ms.deduce.map(id => '没得出的推论：' + sc.facts[id].text.replace(/^推论：/, '')), ...ms.unbroken.map(x => roleName(x) + '到最后都没说出那晚的实话')];
  const againBtn = NET.role ? (G.again[r] ? '<button disabled>等对方同意…</button>' : `<button class="pri" onclick="act({t:'again'})">再玩一次${humanRoles(G).some(x => x !== r && G.again[x]) ? '（对方已同意）' : ''}</button>`) : '<button class="pri" onclick="UI.again()">再玩一次</button>';
  return `<div class="main"><div class="wrap">
    <div class="card" style="text-align:center;margin-bottom:14px"><div class="mut">被指认的人</div><div style="margin:10px 0">${v ? sealH(v, 1) + ' <span class="nm" style="font-size:26px">' + esc(roleName(v)) + '</span>' : '<span class="nm" style="font-size:24px">无人</span>'}</div>
      <div><span class="stamp">${v === sc.killer ? '真　凶' : '错　判'}</span></div><div class="mut" style="margin-top:10px">真凶是 ${esc(roleName(sc.killer))}</div></div>
    <div class="card" style="margin-bottom:14px"><h3>投票</h3>${votes}</div>
    <div class="card ending" style="margin-bottom:14px"><h2>${esc(end.title)}</h2>${para(end.text.replace('{name}', roleName(v)))}</div>
    <div class="card" style="margin-bottom:14px;overflow:auto"><h3>那一夜</h3><table class="tl"><tr><th>时间</th>${sc.timeline.cols.map(c => `<th>${esc(roleName(c))}</th>`).join('')}</tr>${rows}</table>
      ${U.tlShown < sc.timeline.rows.length ? '<button class="sm" style="margin-top:8px" onclick="UI.tlAll()">全部显示</button>' : ''}</div>
    <div class="card" style="margin-bottom:14px"><h3>你错过了什么</h3>${missed.length ? missed.map(x => `<div class="small" style="margin:4px 0">· ${esc(x)}</div>`).join('') : '<p>什么都没错过。</p>'}</div>
    <div class="card" style="margin-bottom:14px"><h3>案件解析（原文）</h3><div class="ending" style="font-size:16px">${para(TEXT[sc.truth])}</div></div>
    <div class="card" style="margin-bottom:14px"><h3>后来</h3>${sc.epilogues.map(e => `<p style="font-family:var(--serif);line-height:1.9">${esc(e.text(H))}</p>`).join('')}</div>
    <div class="card"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><span class="rate r-${my.rate}">${my.rate || '-'}</span><h3 style="margin:0">得分 <span class="acc" style="font-size:28px">${my.s}</span></h3>
      <span class="mut small">评级按得分减去提示 ${G.hints[r] || 0} 次 × ${dif().hintCost}、关联错 ${G.wrong[r] || 0} 次 × 2 计算 · 难度：${esc(dif().name)}</span></div>
      ${sc.questions.map((q, i) => `<div class="small">${my.right[i] ? '✅' : '❌'} ${i + 1}. ${esc(q.q)} <span class="mut">正确：${esc(q.opts[q.a])}</span></div>`).join('')}
      ${my.side != null ? `<div style="margin-top:8px">${my.side ? '✅' : '❌'} 支线：${esc(sc.roles[r].side)}（+10）</div>` : ''}
      ${humanRoles(G).filter(x => x !== r).map(x => `<div class="mut" style="margin-top:6px">${esc(roleName(x))}：${(G.score[x] || {}).s || 0} 分 · ${(G.score[x] || {}).rate || ''}</div>`).join('')}
    </div></div></div>
  <div class="bar"><button class="ghost" onclick="UI.toTitle()">回到标题</button><span class="sp"></span>${againBtn}</div>`;
}

/* ---------- 新手引导（第一局讨论时） ---------- */
function coach() {
  $$('.coach').forEach(x => x.remove());
  if (!G || lsGet('tut', 0) >= 3 || (G.phase !== 'd1')) return;
  let st = lsGet('tut', 0);
  if (st === 0 && U.target) { st = 1; lsSet('tut', 1); }
  if (st === 1 && G.acts > 0) { st = 2; lsSet('tut', 2); }
  const txt = ['点上面任意一个人，选中他。', '点「提问」问他问题，或者「出示」线索给他看。', '不知道问什么？点「👂 听大家说」让 AI 先聊；卡住了就用「💡 提示」或「🔗 指出关联」。'][st];
  document.body.insertAdjacentHTML('beforeend', `<div class="coach">${esc(txt)}${st === 2 ? ' <button class="sm" onclick="lsSet(\'tut\',3);coach()">知道了</button>' : ''} <button class="sm ghost" onclick="lsSet('tut',3);coach()">跳过引导</button></div>`);
}

/* ---------- 弹窗 ---------- */
function dlg(title, body, foot) { return `<div class="mask" onclick="if(event.target===this)UI.close()"><div class="dlg"><div class="dh"><h3>${title}</h3><button class="sm ghost" onclick="UI.close()">✕</button></div><div class="db">${body}</div>${foot ? '<div class="df">' + foot + '</div>' : ''}</div></div>`; }
function itemBtn(id, extra) { const sc = S(); return sc.clues[id] ? '🗂 ' + esc(sc.clues[id].title) + (extra || '') : '✦ ' + esc(sc.facts[id].text); }
function modalHTML(k) {
  const sc = G ? S() : SCRIPTS.renchiren, r = G ? myRole() : null;
  if (k === 'rules') return dlg('玩法说明', `<div style="line-height:1.9">${sc.rules.map(x => '<p>· ' + esc(x) + '</p>').join('')}<p>· <b>当侦探</b>：四名嫌疑人都是 AI。向任何人提问、出示线索和证词；被戳中的人会改口说实话。点“听大家说”，AI 们会互相质问、提出推论。</p><p>· <b>🔗 指出关联</b>：自己把两条线索或证词放在一起。对了就得出推论或逼出实话，错了扣评级。</p><p>· <b>💡 提示</b>：告诉你下一步能做什么，按难度扣评级。</p><p>· <b>入局</b>：AI 也会来问你。你只能从你的剧本允许的说法里选——不是凶手就不能撒谎，只能回避。</p><p>· 顶栏 📖 剧本、📝 笔记、🗂 线索箱、🕒 时间线板随时可以看。</p></div>`);
  if (k === 'opts') return dlg('设置', [['anim', '动画（破防演出、淡入）'], ['typing', '台词逐字出现'], ['sound', '声音'], ['autoAI', 'AI 自动插话（每两次操作后）']].map(([o, n]) => `<label style="display:flex;align-items:center;gap:10px;padding:10px 0;font-size:17px"><input type="checkbox" ${OPT[o] ? 'checked' : ''} onchange="OPT['${o}']=this.checked;saveOpt();render()" style="width:22px;height:22px"> ${n}</label>`).join('') + `<button class="sm ghost" onclick="lsSet('tut',0);toast('下一局会重新显示新手引导')">重新显示新手引导</button>`);
  if (k === 'menu') return dlg('菜单', `<div class="optl"><button onclick="UI.close();UI.modal('rules')">玩法说明</button><button onclick="UI.close();UI.modal('opts')">设置</button><button onclick="UI.close();UI.modal('ai')">AI 玩家（Claude）${typeof AIKit !== 'undefined' && AIKit.available() ? ' · 已开启' : ''}</button>
    <button onclick="UI.toTitle(this)">回到标题（${NET.role ? '离开房间' : '进度已自动保存'}）</button>${HUB ? '<button onclick="UI.hub(this)">返回游戏厅</button>' : ''}</div>`);
  if (k === 'resumeNet') { const sv = loadSave('renchiren'); return dlg('继续上次联机', `<p>上次是联机局（房间 <b class="code">${esc(sv.room || '----')}</b>），你是房主。</p><div class="optl"><button onclick="UI.resumeNet(1)">重开同一个房间，等朋友回来<br><span class="mut small">朋友在“和朋友联机”里输入同一个房间码就能接回他的角色</span></button><button onclick="UI.resumeNet(0)">单机继续<br><span class="mut small">朋友的角色交给 AI，他手上没公开的线索会公开</span></button></div>`); }
  if (k === 'ai') return dlg('AI 玩家（Claude）', AIKit.panelHTML(G && NET.role === 'guest' ? '你是朋友那一方：AI 由房主那边的 Claude 扮演，你不用设置。' : 'Claude 只负责把 AI 玩家的台词说得自然、听懂你打的字；谁说实话、透露什么、谁破防，仍由游戏规则决定，所以不会剧透。' + (AIJ.err ? '<br>最近一次调用失败：' + esc(AIJ.err) : '')));
  if (!G) return '';
  if (k === 'book') { const t = U.btab || 'mine'; return dlg('剧本', `<div class="tabs">${[['bg', '背景'], ['mine', '我的剧本'], ['rules', '规则']].map(([x, n]) => `<button class="sm ${t === x ? 'on' : ''}" onclick="U.btab='${x}';UI.modal('book',1)">${n}</button>`).join('')}</div><div class="book">${bookHTML(t)}</div>${bookTip}`); }
  if (k === 'notes') { const n = notes(); return dlg('笔记', `<p class="mut small">只存在这台设备上。读剧本时点一段文字就能摘进来。</p>${n.quotes.length ? '<h3>摘录</h3>' + n.quotes.map((q, i) => `<div class="cl" style="margin:6px 0;display:flex;gap:8px;align-items:flex-start"><div class="tx" style="flex:1">${esc(q)}</div><button class="sm ghost" onclick="UI.delQuote(${i})">删</button></div>`).join('') : ''}<h3>自己记</h3><textarea id="notetx" rows="8" style="width:100%;font:16px/1.7 var(--serif);padding:10px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.2);color:var(--fg)" placeholder="比如：九点二十五以后谁没有不在场证明？" oninput="UI.saveNote(this.value)">${esc(n.text)}</textarea>`); }
  if (k === 'clues') {
    const t = U.mtab, disc = G.phase === 'd1' || G.phase === 'd2', seen = seenClues();
    const mine = G.own[r] || [], pubC = G.pub.filter(i => sc.clues[i]), pubF = G.pub.filter(i => sc.facts[i]);
    const btn = id => disc ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${sc.suspects.filter(x => x !== r).map(x => `<button class="sm" onclick="UI.doShow('${x}','${id}')">出示给${esc(sc.roles[x].name)}</button>`).join('')}${mine.includes(id) ? `<button class="sm" onclick="act({t:'publish',id:'${id}'})">只公开</button>` : ''}</div>` : (mine.includes(id) ? `<div style="margin-top:8px"><button class="sm" onclick="act({t:'publish',id:'${id}'})">公开</button></div>` : '');
    const group = (ids, keyOf, nameOf) => { const g = {}; ids.forEach(id => (g[keyOf(id)] = g[keyOf(id)] || []).push(id)); return Object.keys(g).map(k2 => `<h3 class="grp">${esc(nameOf(k2))}</h3>` + g[k2].map(id => clueCard(id, btn(id), !seen.has(id))).join('')).join(''); };
    let body;
    if (t === 'pub') body = group(pubC, id => sc.clues[id].r === 1 ? 'scene1' : sc.clues[id].owner || 'scene2', k2 => k2 === 'scene1' ? '现场' : k2 === 'scene2' ? '现场深入' : roleName(k2) + '身上 / 屋里');
    else if (t === 'mine') body = mine.map(id => clueCard(id, btn(id), !seen.has(id))).join('');
    else body = group(pubF, id => id[0] === 'd' ? 'deduce' : sc.facts[id].who, k2 => k2 === 'deduce' ? '推论' : roleName(k2) + '的证词');
    setTimeout(() => lsSet(localKey('seenc'), [...new Set([...seen, ...G.pub, ...mine])]), 0);
    return dlg('线索箱', `<div class="tabs">${[['pub', '公开线索 ' + pubC.length], ['mine', '我私有的 ' + mine.length], ['fact', '证词与推论 ' + pubF.length]].map(([x, n]) => `<button class="sm ${t === x ? 'on' : ''}" onclick="U.mtab='${x}';UI.modal('clues',1)">${n}</button>`).join('')}</div>
      <div style="display:flex;flex-direction:column;gap:10px">${body || '<p class="mut">还没有。</p>'}</div>`);
  }
  if (k === 'tl') {
    const times = ['20:30', '21:00', '21:05', '21:10', '21:15', '21:25', '21:30', '21:40'], cols = sc.timeline.cols;
    const facts = G.pub.filter(i => sc.facts[i] && sc.facts[i].t);
    const caught = new Set(sc.contra.filter((c, i) => G.contraUsed[i]).flatMap(c => [c.a, c.b].filter(x => sc.facts[x] && sc.facts[x].who !== 'deduce' && x.startsWith('f_' + c.who))));
    const cell = (t, c) => facts.filter(i => sc.facts[i].t === t && sc.facts[i].who === c).map(i => `<span class="${caught.has(i) ? 'lie' : ''}">${esc(sc.facts[i].text.replace(/^[^：]+：/, ''))}</span>`).join('<br>');
    const other = G.pub.filter(i => sc.facts[i] && !sc.facts[i].t);
    return dlg('时间线板', `<p class="mut small">只放已经公开的证词。红色虚线 = 已经被当场指出矛盾的说法。注意：凶手的证词可能是假的。</p><div style="overflow:auto"><table class="tl"><tr><th>时间</th>${cols.map(c => `<th>${esc(roleName(c))}</th>`).join('')}</tr>
      ${times.map(t => `<tr><td class="t">${t}</td>${cols.map(c => `<td>${cell(t, c)}</td>`).join('')}</tr>`).join('')}</table></div>
      <h3 style="margin-top:12px">其他证词与推论</h3>${other.length ? other.map(i => `<div class="fact ${i[0] === 'd' ? 'ded' : ''} ${caught.has(i) ? 'lie' : ''}" style="margin:6px 0">${esc(sc.facts[i].text)}</div>`).join('') : '<p class="mut">还没有。</p>'}`);
  }
  if (k === 'ask') {
    const t = U.target; if (!t) return '';
    const tops = sc.topics.filter(x => !x.when || x.when(mkP(G))).map(x => x.id).concat(sc.suspects.filter(x => x !== t && x !== r).map(x => 'about_' + x));
    return dlg('问' + esc(sc.roles[t].name), `<div class="optl">${tops.map(x => `<button onclick="UI.doAsk('${t}','${x}')">${esc(topicQ(sc, x))}${G.asked[t + ':' + x] ? ' <span class="mut small">（问过）</span>' : ''}</button>`).join('')}</div>`);
  }
  if (k === 'show') {
    const t = U.target; if (!t) return '';
    const ids = (G.own[r] || []).concat(G.pub);
    return dlg('向' + esc(sc.roles[t].name) + '出示', `<p class="mut small">线索和证词都能出示。出示私有线索等于公开它。</p><div class="optl">${ids.map(id => `<button onclick="UI.doShow('${t}','${id}')">${itemBtn(id, (G.own[r] || []).includes(id) ? ' <span class="acc small">（私有）</span>' : '')}${G.log.some(e => e.k === 'show' && e.ref === id && e.to === t) ? ' <span class="mut small">（给他看过）</span>' : ''}</button>`).join('')}</div>`);
  }
  if (k === 'link') {
    const ids = (G.own[r] || []).concat(G.pub), sel = U.linkSel;
    return dlg('指出关联', `<p class="mut small">选两条你觉得能放在一起看的线索或证词。对了就会得出推论、逼出实话或抓到谎话；错了扣评级。</p><div class="optl">${ids.map(id => `<button class="${sel.includes(id) ? 'on' : ''}" onclick="UI.linkPick('${id}')">${sel.includes(id) ? '<b class="acc">［' + (sel.indexOf(id) + 1) + '］</b> ' : ''}${itemBtn(id)}</button>`).join('')}</div>`,
      `<span class="mut small">已选 ${sel.length}/2</span><button class="pri" ${sel.length === 2 ? '' : 'disabled'} onclick="UI.doLink()">放在一起看</button>`);
  }
  if (k === 'say') {
    const d = sc.deck[r] || {}; const opts = [];
    for (const tp in d) deckFor(G, r, tp).forEach((e, i) => { if (e.vol && !G.saidV[saidKey(r, e)]) opts.push([tp, i, e]); });
    const fs = G.ai ? `<div class="freebox" style="margin:0 0 12px"><input id="frees" maxlength="120" autocomplete="off" placeholder="自己打字说一句…" onkeydown="if(event.key==='Enter')UI.freeSay()"><button onclick="UI.freeSay()">说</button></div>` : '';
    return dlg('主动发言', `<p class="mut small">从你的剧本允许的说法里选${G.ai ? '，或者自己打字' : ''}。${r === sc.killer ? '你是凶手，可以说谎。' : '你不是凶手，不能说谎。'}</p>${fs}${opts.length ? '' : '<p class="mut">能主动说的都说过了。</p>'}<div class="optl">${opts.map(([tp, i, e]) => `<button onclick="UI.doSay('${tp}',${i})"><span class="k k-${e.kind}">${KIND[e.kind]}</span>${esc(e.say)}${e.tip ? ' <span class="mut small">（' + esc(e.tip) + '）</span>' : ''}</button>`).join('')}</div>`);
  }
  if (k === 'prompt') {
    const p = G.prompts.find(x => x.to === r); if (!p) return '';
    const list = deckFor(G, r, p.topic);
    const fb = G.ai ? `<div class="freebox"><input id="freea" maxlength="120" autocomplete="off" placeholder="或者自己打字回答…" onkeydown="if(event.key==='Enter')UI.freeAns(${p.id})"><button onclick="UI.freeAns(${p.id})">回答</button></div><p class="mut small">${r === sc.killer ? '你是凶手，可以撒谎。' : '你不是凶手：和你剧本矛盾的话会被拒绝。'}</p>` : '';
    return dlg(esc(roleName(p.from)) + '问你', `<div class="msg">${sealH(p.from)}<div class="bd"><div class="tx">${p.clue ? '（出示了' + esc(itemTitle(sc, p.clue)) + '）' : ''}${esc(p.q || topicQ(sc, p.topic))}</div></div></div>
      ${p.clue ? clueCard(p.clue) : ''}<h3 style="margin-top:12px">你怎么回答？</h3>
      <div class="optl">${list.map((e, i) => `<button onclick="UI.doSay(null,${i},${p.id})"><span class="k k-${e.kind}">${KIND[e.kind]}</span>${esc(e.say)}${e.tip ? ' <span class="mut small">（' + esc(e.tip) + '）</span>' : ''}</button>`).join('')}</div>${fb}
      ${G.prompts.filter(x => x.to === r).length > 1 ? `<p class="mut small">后面还有 ${G.prompts.filter(x => x.to === r).length - 1} 个问题。</p>` : ''}`);
  }
  if (k === 'hint') { const h = G.hintText[r]; return h ? dlg('💡 提示', `<p style="font-family:var(--serif);font-size:18px;line-height:1.8">${esc(h.text)}</p><p class="mut small">本局已用提示 ${G.hints[r] || 0} 次${dif().hintCost ? '，每次评级扣 ' + dif().hintCost + ' 分' : '（简单难度不扣分）'}。</p>`) : ''; }
  if (k === 'acts') { const { list, more } = discActions(); return dlg('行动', `<div class="optl">${list.map(([, n, ok, fn]) => `<button ${ok ? '' : 'disabled'} onclick="UI.close();${fn}">${n}${!ok ? ' <span class="mut small">（先点上面的人选中他）</span>' : ''}</button>`).join('')}<button onclick="UI.close();UI.listen()">${more ? '👂 听大家说' : '👂 大家在等你'}</button></div>`); }
  if (k === 'chat') return dlg('悄悄话', `<p class="mut small">只有你们两个真人看得到，AI 听不到。</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${(sc.quick || []).map((q, i) => `<button class="sm" onclick="UI.chat(S().quick[${i}])">${esc(q)}</button>`).join('')}</div><div style="display:flex;gap:8px"><input id="chattx" maxlength="120" style="flex:1;font-size:16px" placeholder="自己打一句…" onkeydown="if(event.key==='Enter')UI.chat(this.value)"><button onclick="UI.chat($('#chattx').value)">发送</button></div>`);
  return '';
}

const UI = {
  go(s) { U.scr = s; U.modalOpen = null; closeMask(); render(); },
  hub(b) { if (G && U.scr === 'game' && NET.role) { if (!U.hubArm) { U.hubArm = 1; b.textContent = '再点一次确认'; setTimeout(() => U.hubArm = 0, 3000); return; } } save(); NET.leave(); location.href = '../'; },
  resume() { G = loadSave('renchiren'); ME = { seat: 0 }; U.scr = 'game'; U.gid = null; render(); },
  resumeNet(reopen) { UI.close(); G = loadSave('renchiren'); ME = { seat: 0 }; U.gid = null;
    if (reopen && !ARTIFACT) { const code = G.room; seatLeft(G, 1); U.scr = 'game'; save(); render(); NET.host(code); }
    else { seatLeft(G, 1); G.mode = 'sus'; U.scr = 'game'; save(); render(); } },
  pickSc(id) { U.setup.sid = id; render(); },
  setMode(m) { U.setup.mode = m; render(); },
  setRole(r) { U.setup.role = r; render(); },
  setDiff(d) { U.setup.diff = d; render(); },
  start() {
    const st = U.setup, sc = SCRIPTS[st.sid]; let role = st.mode === 'det' ? 'det' : st.role;
    if (role === 'rand') role = sc.suspects[Math.floor(Math.random() * 4)];
    G = newGame(st.sid, st.mode, [role], st.diff); ME = { seat: 0 }; U.scr = 'game'; U.tab = 'mine'; save(); render();
    if (st.role === 'rand' && st.mode === 'sus') toast('你抽到了：' + sc.roles[role].name, 3000);
  },
  tab(t) { U.tab = t; render(); },
  tgt(x) { U.target = U.target === x ? null : x; render(); },
  look(c) { act({ t: 'look', id: c }); U.modalOpen = null; showClue(c); },
  /* 点在平面图空白处 / 家具 / 文字上：就近打开线索；床是第二轮的深入调查；其他地方提示看圆点 */
  planClick(ev) {
    if (ev.target.closest('.hot')) return;
    const sc = S(), r = ev.currentTarget.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    const ids = Object.keys(sc.clues).filter(c => sc.clues[c].r === 1 && sc.spots[c]);
    const near = rad => ids.map(c => [c, Math.hypot(sc.spots[c][0] - x, (sc.spots[c][1] - y) / 1.5)]).filter(v => v[1] < rad).sort((p, q) => p[1] - q[1])[0];
    let hit = near(0.07);
    if (!hit && x > 0.66 && x < 0.9 && y > 0.18 && y < 0.54) return toast('床板好像能整块掀开……第二轮搜证时可以深入调查。');
    if (!hit && x > 0.6 && x < 0.86 && y > 0.58 && y < 0.72) hit = ['c_room'];
    if (!hit) hit = near(0.12);
    if (hit) return UI.look(hit[0]);
    toast('这里没发现什么。带标签、会发光的点才是线索。');
  },
  doAsk(t, tp) { UI.close(); act({ t: 'ask', to: t, topic: tp }); },
  doShow(t, id) { UI.close(); act({ t: 'show', to: t, id }); },
  doSay(tp, i, pid) { UI.close(); act(pid != null ? { t: 'say', i, pid } : { t: 'say', topic: tp, i }); },
  linkPick(id) { const s = U.linkSel, k = s.indexOf(id); if (k >= 0) s.splice(k, 1); else { if (s.length >= 2) s.shift(); s.push(id); } UI.modal('link', 1); },
  doLink() { const [a, b] = U.linkSel; U.linkSel = []; UI.close(); act({ t: 'link', a, b }); },
  hint() { act({ t: 'hint' }); },
  listen() { if (!aiHasMore(G)) toast('AI 没有新的话了：去提问、出示证据、指出关联，或者用提示。', 3200); act({ t: 'listen' }); },
  endDisc() { if (humanRoles(G).length === 1 && !U.endArm) { U.endArm = 1; render(); setTimeout(() => { if (U.endArm) { U.endArm = 0; if (G && (G.phase === 'd1' || G.phase === 'd2')) render(); } }, 4000); return; } U.endArm = 0; act({ t: 'ready' }); },
  logAll() { U.logAll = !U.logAll; render(); },
  free() { const i = $('#freeq'); const t = i && i.value.trim(); if (!t) return; i.value = ''; act({ t: 'freeText', text: t, to: U.target && U.target !== myRole() && U.target !== 'det' ? U.target : null }); toast('Claude 在理解你的话…', 1600); },
  freeAns(pid) { const i = $('#freea'); const t = i && i.value.trim(); if (!t) return; UI.close(); act({ t: 'freeText', text: t, pid }); toast('Claude 在判断你的回答…', 1600); },
  freeSay() { const i = $('#frees'); const t = i && i.value.trim(); if (!t) return; UI.close(); act({ t: 'freeText', text: t, say: 1 }); toast('Claude 在判断你这句话…', 1600); },
  toBottom() { const m = $('.main'); if (m) m.scrollTop = m.scrollHeight; U.unread = 0; $$('.newbtn').forEach(x => x.remove()); },
  chat(t) { t = String(t || '').trim(); if (!t) return; act({ t: 'chat', text: t }); const i = $('#chattx'); if (i) i.value = ''; UI.close(); },
  ans(i, j) { U.sheet[i] = j; render(); },
  submit() { act({ t: 'answers', v: U.sheet.slice() }); },
  tlAll() { U.tlShown = 99; render(); },
  saveNote(v) { const n = notes(); n.text = v; lsSet(localKey('notes'), n); },
  addQuote(t) { const n = notes(); if (!n.quotes.includes(t)) { n.quotes.push(t); lsSet(localKey('notes'), n); toast('已摘进笔记'); } },
  delQuote(i) { const n = notes(); n.quotes.splice(i, 1); lsSet(localKey('notes'), n); UI.modal('notes', 1); },
  copy(t) { try { navigator.clipboard.writeText(t).then(() => toast('已复制'), () => toast(t)); } catch (e) { toast(t); } },
  toTitle(b) { if (NET.role && b && !U.titleArm) { U.titleArm = 1; b.textContent = '再点一次确认（会离开房间）'; setTimeout(() => U.titleArm = 0, 3000); return; } save(); NET.leave(); G = null; UI.go('title'); },
  again(net) { const g = G; if (NET.role === 'host' || net) { NET.restart(); return; } G = newGame(g.sid, g.mode, g.seats, g.diff); save(); render(); },
  modal(k, keep) {
    const db = $('.mask .db'), st = keep && db ? db.scrollTop : 0;
    closeMask(); const h = modalHTML(k); if (!h) { U.modalOpen = null; return; } U.modalOpen = k;
    document.body.insertAdjacentHTML('beforeend', h); $$('.mask canvas.cimg').forEach(c => drawImg(c));
    if (keep) { const d = $('.mask .db'); if (d) d.scrollTop = st; } else sfx('tick');
    if (k === 'ai') { const box = $('.mask .ak'); if (box) AIKit.bind(box, () => { if (G) { aiAfter(); save(); netSend(); } UI.modal('ai', 1); render(); }); }
    sendStatus();
  },
  close() { U.modalOpen = null; closeMask(); sendStatus(); }
};
const STATUS = { book: '在看剧本', notes: '在记笔记', clues: '在翻线索箱', tl: '在看时间线', ask: '在想问什么', show: '在挑证据', link: '在找关联', prompt: '在回答问题', say: '在想怎么说', chat: '在打字' };
function sendStatus() { if (!G || humanRoles(G).length < 2 || U.scr !== 'game') return; const s = STATUS[U.modalOpen] || ''; if (s === U.lastStatus) return; U.lastStatus = s; act({ t: 'status', s }); }
function closeMask() { $$('.mask').forEach(m => m.remove()); }
function showClue(c) { closeMask(); U.modalOpen = null; document.body.insertAdjacentHTML('beforeend', dlg('线索', clueCard(c))); $$('.mask canvas.cimg').forEach(x => drawImg(x)); sfx('fact'); }
document.addEventListener('click', e => { const p = e.target.closest('.book p.q'); if (p) UI.addQuote(p.textContent.trim()); });
setInterval(() => { const e = $('#ptm'); if (e && G && PH_MIN[G.phase]) e.textContent = fmtT(phaseClock()) + ' / 建议 ' + PH_MIN[G.phase] + ' 分'; }, 1000);
setInterval(() => { if (G && G.phase === 'reveal' && U.scr === 'game' && U.tlShown < S().timeline.rows.length) { U.tlShown++; const rows = $$('table.tl tr'); if (rows[U.tlShown]) rows[U.tlShown].style.visibility = ''; if (U.tlShown >= S().timeline.rows.length) { const b = $$('.card button').find(x => x.textContent === '全部显示'); if (b) b.remove(); } } }, 900);
