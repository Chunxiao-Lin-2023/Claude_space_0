/* ================= UI: screens, HUD, events ================= */
const HUB = /\/prophunt\/(index\.html)?$/.test(location.pathname) && !inArtifact();
const TOUCH = matchMedia('(pointer: coarse)').matches;
const myName = () => ($('nameIn').value || '').trim().slice(0, 8);
let PICK_MODE = LS.get('mode', 'rt'), PICK_MAP = LS.get('map', 'rand');
const resolveMap = m => m === 'rand' || !SCENES[m] ? SCENE_IDS[Math.floor(Math.random() * SCENE_IDS.length)] : m;
const mapButtons = el => { el.innerHTML = SCENE_IDS.map(id => '<button data-map="' + id + '">' + SCENES[id].icon + ' ' + SCENES[id].n + '</button>').join('') + '<button data-map="rand">🎲 随机</button>'; };
const MODE_DESC = {
  rt: '实时追逐：躲方有 30 秒找地方变成家具；抓方只看得见所在的房间，敲击次数每 10 秒恢复一次。最后 20 秒躲方会不停出声，但抓方只剩 3 次敲击。',
  turn: '回合推理：整栋房子摊在眼前。抓方每回合敲一件，敲错会得到 烫/热/温/冷 提示；躲方每回合可以挪 3 米、就地变形或不动。敲错 6 次就输。'
};
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function showScreen(n) { for (const id of ['title', 'lobby']) $(id).classList.toggle('hidden', id !== n); $('hud').classList.toggle('hidden', n !== 'hud'); }
function toTitle() {
  if (NETROLE && NETROLE !== 'solo') netLeave(); NETROLE = null;
  STATE.mode = 'title'; G = null; useScene(resolveMap(PICK_MAP)); MAP = genMap((Math.random() * 1e9) | 0);
  hideEnd(); closeMenu(); showScreen('title'); $('blind').classList.add('hidden'); $('curtain').classList.add('hidden'); $('joy').classList.add('hidden');
  $('hubBtn').classList.toggle('hidden', !HUB);
  if (inArtifact()) { $('hostBtn').disabled = $('joinBtn').disabled = $('codeIn').disabled = true; titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); }
  modeUI();
}
function titleStatus(s) { $('tStatus').textContent = s || ''; }
function modeUI() {
  for (const b of document.querySelectorAll('#modeSeg button')) b.classList.toggle('sel', b.dataset.m === PICK_MODE);
  $('modeDesc').textContent = MODE_DESC[PICK_MODE];
  for (const b of document.querySelectorAll('#mapSeg button')) b.classList.toggle('sel', b.dataset.map === PICK_MAP);
}
function lobbyUI(st) {
  const host = NETROLE === 'host', L = NET.lobby;
  $('lCode').textContent = NET.code || '····';
  $('lP0').textContent = '🏠 ' + (host ? (myName() || '房主') + '（你）' : (NET.hostName || '房主'));
  $('lP1').textContent = host ? (NET.guestName ? '🎮 ' + NET.guestName : '⏳ 等待对手加入…') : '🎮 ' + (myName() || '你') + '（你）';
  for (const b of document.querySelectorAll('#lModeSeg button')) { b.classList.toggle('sel', b.dataset.m === L.mode); b.disabled = !host; }
  for (const b of document.querySelectorAll('#lFirstSeg button')) { b.classList.toggle('sel', b.dataset.f === L.first); b.disabled = !host; }
  $('lModeDesc').textContent = MODE_DESC[L.mode];
  for (const b of document.querySelectorAll('#lMapSeg button')) { b.classList.toggle('sel', b.dataset.map === (L.map || 'rand')); b.disabled = !host; }
  $('lStart').classList.toggle('hidden', !host); $('lStart').disabled = !(host && NET.guestName);
  $('lWait').classList.toggle('hidden', host);
  if (st != null) $('lStatus').textContent = st;
  else $('lStatus').textContent = host ? (NET.guestName ? '对手已加入，可以开始了' : '把房间码告诉对手') : '等待房主开始…';
}
function startSolo(next) {
  NETROLE = 'solo'; ME = 0;
  const prev = next && G ? G : null;
  newRound({ seed: (Math.random() * 1e9) | 0, scene: PICK_MAP === 'rand' || !prev ? resolveMap(PICK_MAP) : prev.scene, mode: prev ? prev.mode : PICK_MODE, hider: 1, ai: 1, score: prev ? prev.score.slice() : [0, 0], round: prev ? prev.round + 1 : 1, names: [myName() || '你', '电脑'] });
  enterGame();
}
function enterGame() {
  STATE.mode = 'play'; hideEnd(); closeMenu(); showScreen('hud');
  Object.assign(STATE, { dgKey: [], puffs: [], tz: 1, tpan: [0, 0], lastPhase: null, sel: null, pend: null, ghost: null, form: null, ripples: [], pops: [], kcd: 0, lastWh: '' });
  CAM.x = G.pl[ME].x; CAM.y = G.pl[ME].y;
  renderActs();
}
function onPhase() {
  STATE.sel = null; STATE.pend = null; STATE.ghost = null;
  if (G.mode === 'turn' && G.phase === 'hturn' && amHider() && G.pl[ME].dg) STATE.ghostR = G.pl[ME].dg.r;
  if (G.mode === 'turn' && G.phase === 'place' && amHider()) { STATE.form = null; STATE.ghostR = 0; }
  if (G.mode === 'turn' && G.phase === 'place' && amHider()) banner('你来藏', '点一件家具选好变身，再点地板放下');
  if (G.mode === 'rt' && G.phase === 'hide') banner(amHider() ? '快藏起来！' : '闭眼数数', amHider() ? '走到家具旁按 E（或点它）变成一样的东西' : '对方正在找地方变成家具');
  renderActs(); turnPanel();
}

/* ---------- per-frame HUD ---------- */
let hudT = 0;
function hudTick(dt) {
  if (!isPlay()) return;
  const blind = G.mode === 'rt' && G.phase === 'hide' && !amHider();
  $('blind').classList.toggle('hidden', !blind);
  if (blind) $('blindN').textContent = Math.max(0, Math.ceil(G.t));
  const curtain = G.mode === 'turn' && !amHider() && (G.phase === 'place' || G.phase === 'hturn');
  $('curtain').classList.toggle('hidden', !curtain);
  if (curtain) $('curT').textContent = G.phase === 'place' ? '对方正在藏…' : '对方正在行动…';
  if ((hudT -= dt) > 0) return; hudT = .1;
  $('hRole').textContent = amHider() ? '🙈 你在藏' : '🔍 你在找';
  $('hRole').className = 'chip ' + (amHider() ? 'hide' : 'seek');
  let ph = '';
  if (G.mode === 'rt') ph = G.phase === 'hide' ? '躲藏 ' + fmtT(G.t) : G.phase === 'seek' ? (G.fin ? '最后 ' : '剩余 ') + fmtT(G.t) : '本局结束';
  else ph = G.phase === 'place' ? '躲方藏身中' + (G.ai ? '' : ' ' + fmtT(G.t)) : G.phase === 'seek' ? '第 ' + G.turnN + ' 回合 · 抓方敲' : G.phase === 'hturn' ? '躲方行动' + (G.ai ? '' : ' ' + fmtT(G.t)) : '本局结束';
  $('hPhase').textContent = ph;
  $('hPhase').classList.toggle('urgent', G.mode === 'rt' && G.phase === 'seek' && !!G.fin);
  if (G.mode === 'rt') {
    const cap = G.fin ? BAL.finalKnocks : BAL.knockMax, k = clamp(G.kn, 0, cap);
    $('hTaps').innerHTML = '<span class="lbl">' + (G.fin ? '最后机会' : '敲击') + '</span>' + '<i class="on">●</i>'.repeat(k) + '<i>●</i>'.repeat(cap - k) + (!G.fin && G.phase === 'seek' && k < cap ? '<span class="lbl"> +1 ' + Math.ceil(G.regenT) + 's</span>' : '');
    $('hTaps').classList.toggle('fin', !!G.fin);
  } else {
    const rem = G.maxWrong - G.wrong;
    $('hTaps').innerHTML = '<span class="lbl">可敲错</span>' + '<i class="on">●</i>'.repeat(Math.max(0, rem)) + '<i>●</i>'.repeat(Math.min(G.maxWrong, G.wrong));
  }
  $('hWh').textContent = G.mode === 'rt' && G.phase === 'seek' ? (G.fin ? '🔔 每 ' + BAL.finalWhistle + ' 秒出声' : '🔔 最后 ' + BAL.finalT + ' 秒出声') : G.mode === 'turn' ? '🔔 每 ' + BAL.whistleTurns + ' 回合' : '';
  $('hScore').textContent = G.names[0] + ' ' + G.score[0] + ' : ' + G.score[1] + ' ' + G.names[1];
  const me = G.pl[ME], rm = G.mode === 'rt' ? roomAt(me.x, me.y) : null; $('hRoom').textContent = rm ? '📍 ' + rm.n : '';
  const tb = $('aTaunt'); if (tb) { tb.disabled = G.phase !== 'seek' || !!G.fin || G.tauntCD > 0; tb.querySelector('small').textContent = G.tauntCD > 0 ? Math.ceil(G.tauntCD) + 's' : '-' + BAL.tauntCut + '秒'; }
  const kb = $('aKnock'); if (kb) kb.disabled = G.phase !== 'seek' || (G.mode === 'rt' && G.kn <= 0);
  $('hTip').textContent = tipText(); $('hTip').classList.toggle('top', G.mode === 'turn');
}
function tipText() {
  if (G.phase === 'end') return '';
  if (G.mode === 'turn') return TOUCH ? '双指缩放 · 放大后拖动查看' : '滚轮缩放 · 放大后拖动查看';
  if (amHider()) return TOUCH ? '左下拖动移动 · 点附近的家具变成它 · 变身后移动会被看见' : 'WASD 移动 · 点附近的家具或按 E 变成它 · Q 变回 · R 旋转 · T 嘲讽 · 变身后移动会被看见';
  if (G.phase === 'hide') return '';
  return TOUCH ? '左下拖动移动 · 点可疑的东西敲一下（要走近）' : 'WASD 移动 · 走近可疑的东西按 E 或点它敲一下 · 滚轮缩放';
}
function renderActs() {
  const el = $('acts'); if (!isPlay() || G.mode !== 'rt' || G.phase === 'end') { el.innerHTML = ''; return; }
  if (amHider()) {
    const dg = G.pl[ME].dg;
    el.innerHTML = '<button id="aCopy" class="act primary">变身<small>E</small></button><button id="aRev" class="act" ' + (dg ? '' : 'disabled') + '>变回<small>Q</small></button><button id="aRot" class="act" ' + (dg ? '' : 'disabled') + '>旋转<small>R</small></button><button id="aTaunt" class="act pink">嘲讽<small></small></button>';
    $('aCopy').onclick = () => { audioInit(); primary(); }; $('aRev').onclick = revert; $('aRot').onclick = rotateKey; $('aTaunt').onclick = taunt;
  } else {
    el.innerHTML = '<button id="aKnock" class="act primary big">敲一下<small>E</small></button>';
    $('aKnock').onclick = () => { audioInit(); primary(); };
  }
}
function turnPanel() {
  const el = $('turnPanel');
  if (!isPlay() || G.mode !== 'turn' || G.phase === 'end') { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const legend = '<div class="legend">' + BAND.map((b, i) => '<span style="color:' + b.c + '">' + b.n + (i < 3 ? '&lt;' + BAL.bands[i] + 'm' : '') + '</span>').join(' ') + '</div>';
  let h = '';
  if (!amHider()) {
    if (G.phase === 'seek') {
      const s = STATE.sel;
      h = '<b>轮到你敲</b>：点一件可疑的东西，再点一次或按「敲下去」。还能敲错 <b>' + (G.maxWrong - G.wrong) + '</b> 次。' + (STATE.lastWh ? '<div class="wh">🔔 本回合哨声来自：' + esc(STATE.lastWh) + '</div>' : '') + legend +
        '<div class="row"><button id="tGo" class="primary" ' + (s ? '' : 'disabled') + '>敲下去' + (s ? '：' + (s.kind === 'pl' ? T[G.pl[G.hider].dg.k].n : T[s.it.k].n) : '') + '</button></div>';
    } else h = '<b>对方行动中</b>…' + legend;
  } else {
    if (G.phase === 'place') {
      const q = STATE.pend;
      h = '<b>藏起来</b>：先点一件家具（变成它），再点地板放下。只能变成那个房间里已有的东西。' +
        '<div class="st">' + (STATE.form ? '变身：<b>' + T[STATE.form.k].n + '</b>' : '还没选家具') + (q && q.err ? ' · <span class="bad">' + esc(q.err) + '</span>' : q ? ' · <span class="ok">可以放这里</span>' : '') + '</div>' +
        '<div class="row"><button id="tRot">⟳ 旋转</button><button id="tGo" class="primary" ' + (q && !q.err ? '' : 'disabled') + '>藏好了</button></div>';
    } else if (G.phase === 'hturn') {
      const last = G.hints[G.hints.length - 1], q = STATE.pend;
      h = (last ? '他敲了<b>' + T[MAP.items[last[0]].k].n + '</b>，提示「<span style="color:' + BAND[last[1]].c + '">' + BAND[last[1]].n + '</span>」。' : '') + '在虚线圈内点地板挪动，或点圈里的家具就地变形，也可以不动。' +
        (q ? '<div class="st">' + (q.err ? '<span class="bad">' + esc(q.err) + '</span>' : '<span class="ok">可以</span>') + '</div>' : '') +
        '<div class="row"><button id="tRot">⟳ 旋转</button><button id="tStay">不动</button><button id="tGo" class="primary" ' + (q && !q.err ? '' : 'disabled') + '>确认</button></div>';
    } else h = '<b>抓方在敲</b>…看看他会不会找到你。' + legend;
  }
  el.innerHTML = h;
  const b = id => $(id) && ($(id).onclick = { tGo: turnConfirm, tRot: turnRotate, tStay: turnPass }[id]);
  b('tGo'); b('tRot'); b('tStay');
}

/* ---------- events (applied on both machines) ---------- */
function emit(ev) { handleEv(ev); if (NETROLE === 'host') netSend({ t: 'ev', ev }); }
function handleEv(ev) {
  if (!G) return;
  switch (ev.e) {
    case 'knock': {
      if (ev.id === -1) { const h = G.pl[G.hider]; sfx('knock'); sfx('catch'); pop(h.x, h.y, 1.3, '抓到了！', '#ffd36a', 1); break; }
      const it = MAP.items[ev.id]; if (!it) break;
      it.wob = 1; sfx('knock'); const hz = (it.h || Math.max(...it.pr.map(p => p.z1)));
      pop(it.x, it.y, hz, '咚咚', '#ffffff');
      setTimeout(() => {
        if (ev.band != null) { pop(it.x, it.y, hz + .3, BAND[ev.band].n + '！', BAND[ev.band].c, 1); sfx('empty'); }
        else { pop(it.x, it.y, hz + .3, '空的', '#ff8a7a', 1); sfx('empty'); }
        if (ev.near) { sfx('near'); toast(ME === G.hider ? '好险！他敲到你旁边了' : '……附近好像有动静', 'warn'); }
      }, 260);
      break;
    }
    case 'wh': {
      const mine = ME === G.hider, x = mine ? ev.hx : ev.x, y = mine ? ev.hy : ev.y;
      STATE.ripples.push({ x, y, t: 0, room: ev.room, taunt: ev.taunt });
      const [v, p] = mine ? [1, 0] : spatial(ev.x, ev.y); sfx(ev.taunt ? 'taunt' : 'whistle', v, p);
      if (!mine) { STATE.lastWh = ev.room; toast((ev.taunt ? '😜 对方在嘲讽！声音来自：' : '🔔 哨声来自：') + ev.room, 'gold'); }
      else toast(ev.taunt ? '你嘲讽了一下，时间 -' + BAL.tauntCut + ' 秒' : '你吹了一声哨，他知道你在' + ev.room + '附近', 'warn');
      turnPanel();
      break;
    }
    case 'seek':
      if (G.phase === 'hide') G.phase = 'seek';
      if (ME === G.hider) { if (!G.pl[ME].dg) autoDisguise(ME); banner('他来找了！', '别乱动，或者趁他不在悄悄换地方'); }
      else banner('开始找！', '敲击次数会慢慢恢复 · 最后 ' + BAL.finalT + ' 秒他会出声，但只剩 ' + BAL.finalKnocks + ' 次');
      sfx('go'); renderActs(); break;
    case 'final':
      G.fin = 1;
      if (amHider()) banner('最后 ' + BAL.finalT + ' 秒！', '你会每 ' + BAL.finalWhistle + ' 秒自动出声，撑住！');
      else banner('最后 ' + BAL.finalT + ' 秒！', '他会不停出声 · 只剩 ' + BAL.finalKnocks + ' 次敲击');
      sfx('go'); break;
    case 'turn':
      if (!amHider()) { if ((ev.n || G.turnN) % BAL.whistleTurns !== 0) STATE.lastWh = ''; banner('轮到你敲', '还能敲错 ' + (G.maxWrong - G.wrong) + ' 次'); sfx('turn'); }
      STATE.sel = null; STATE.pend = null; STATE.ghost = null; turnPanel(); break;
    case 'hturn':
      if (amHider()) { banner('轮到你了', '挪一挪、换个样子，或者不动'); sfx('turn'); }
      break;
    case 'end':
      G.phase = 'end'; if (ev.res) { G.res = ev.res; G.score = ev.score; }
      if (ev.hx != null) { const h = G.pl[G.hider]; if (ME !== G.hider) { h.x = ev.hx; h.y = ev.hy; h.dg = ev.dg; } }
      { const iWon = (G.res.win === 'hider') === amHider(); setTimeout(() => sfx(iWon ? 'win' : 'lose'), 500); }
      STATE.endAt = performance.now(); renderActs(); turnPanel();
      setTimeout(showEnd, 1800); break;
  }
}

/* ---------- end of round ---------- */
function showEnd() {
  if (!G || G.phase !== 'end' || STATE.mode !== 'play') return;
  const iWon = (G.res.win === 'hider') === amHider(), h = G.pl[G.hider], what = h.dg ? T[h.dg.k].n : '人形';
  const why = G.res.why === 'caught' ? (amHider() ? '你变成的' + what + '被敲中了' : '在第 ' + (G.wrong + 1) + ' 次敲中了变成' + what + '的对手') :
    G.res.why === 'taps' ? (G.mode === 'rt' ? (amHider() ? '对方最后 ' + BAL.finalKnocks + ' 次都没敲中，你一直是' + what : '最后 ' + BAL.finalKnocks + ' 次都没敲中。对方变成了' + what) : (amHider() ? '对方敲错了 ' + G.wrong + ' 次，你一直是' + what : '敲错了 ' + G.wrong + ' 次。对方变成了' + what)) :
      (amHider() ? '时间到，你一直藏成' + what : '时间到。对方藏成了' + what);
  $('eTitle').textContent = iWon ? (amHider() ? '躲过去了！' : '抓到了！') : (amHider() ? '被找到了' : '没找到…');
  $('eTitle').className = iWon ? 'win' : 'lose';
  $('eWhy').textContent = why;
  $('eScore').textContent = G.names[0] + '  ' + G.score[0] + ' : ' + G.score[1] + '  ' + G.names[1];
  const canNext = NETROLE !== 'guest';
  $('eNext').classList.toggle('hidden', !canNext); $('eWait').classList.toggle('hidden', canNext);
  $('eNext').textContent = NETROLE === 'solo' ? '再来一局' : '下一局（交换角色）';
  $('endScr').classList.remove('hidden');
}
function hideEnd() { $('endScr').classList.add('hidden'); }

/* ---------- menu / toasts / banner ---------- */
function openMenu() { $('menu').classList.remove('hidden'); $('mHub').classList.toggle('hidden', !HUB); for (const id of ['mTitle', 'mHub']) { delete $(id).dataset.arm; } $('mTitle').textContent = '返回标题'; $('mHub').textContent = '返回游戏厅'; }
function closeMenu() { $('menu').classList.add('hidden'); }
function armClick(id, fn) { const b = $(id); if (b.dataset.arm) { fn(); return; } b.dataset.arm = 1; b.textContent = '再点一次确认'; setTimeout(() => { if (b.dataset.arm) { delete b.dataset.arm; b.textContent = id === 'mHub' ? '返回游戏厅' : '返回标题'; } }, 2500); }
function toast(s, cls) {
  const el = document.createElement('div'); el.className = 'toast ' + (cls || ''); el.textContent = s; $('toasts').appendChild(el);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}
let bannerTO = 0;
function banner(t, sub) { const el = $('banner'); el.innerHTML = '<b>' + esc(t) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : ''); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(bannerTO); bannerTO = setTimeout(() => el.classList.remove('show'), 2200); }

/* ---------- wiring ---------- */
function wireUI() {
  $('nameIn').value = LS.get('name', ''); $('nameIn').addEventListener('change', () => LS.set('name', myName()));
  for (const b of document.querySelectorAll('#modeSeg button')) b.onclick = () => { PICK_MODE = b.dataset.m; LS.set('mode', PICK_MODE); modeUI(); sfx('click'); };
  mapButtons($('mapSeg')); mapButtons($('lMapSeg'));
  for (const b of document.querySelectorAll('#mapSeg button')) b.onclick = () => { PICK_MAP = b.dataset.map; LS.set('map', PICK_MAP); modeUI(); sfx('click'); if (PICK_MAP !== 'rand') { useScene(PICK_MAP); MAP = genMap((Math.random() * 1e9) | 0); } };
  for (const b of document.querySelectorAll('#lMapSeg button')) b.onclick = () => { if (NETROLE !== 'host') return; NET.lobby.map = b.dataset.map; sendLobby(); lobbyUI(); };
  $('soloBtn').onclick = () => { audioInit(); startSolo(false); };
  $('hostBtn').onclick = () => { audioInit(); NET.lobby.mode = PICK_MODE; NET.lobby.map = PICK_MAP; NET.score = [0, 0]; netHost(); };
  $('joinBtn').onclick = () => { audioInit(); netJoin($('codeIn').value); };
  $('helpBtn').onclick = () => $('help').classList.remove('hidden');
  $('helpClose').onclick = () => $('help').classList.add('hidden');
  $('hubBtn').onclick = () => { location.href = '../'; };
  for (const b of document.querySelectorAll('#lModeSeg button')) b.onclick = () => { if (NETROLE !== 'host') return; NET.lobby.mode = b.dataset.m; sendLobby(); lobbyUI(); };
  for (const b of document.querySelectorAll('#lFirstSeg button')) b.onclick = () => { if (NETROLE !== 'host') return; NET.lobby.first = b.dataset.f; sendLobby(); lobbyUI(); };
  $('lStart').onclick = () => hostStart(false);
  $('lLeave').onclick = () => toTitle();
  $('menuBtn').onclick = () => openMenu();
  $('sndBtn').onclick = () => { audioInit(); setSound(!AU.on); };
  $('mResume').onclick = closeMenu;
  $('mSound').onclick = () => { audioInit(); setSound(!AU.on); };
  $('mHelp').onclick = () => $('help').classList.remove('hidden');
  $('mTitle').onclick = () => armClick('mTitle', toTitle);
  $('mHub').onclick = () => armClick('mHub', () => { netLeave(); location.href = '../'; });
  $('eNext').onclick = () => { hideEnd(); if (NETROLE === 'solo') startSolo(true); else if (NETROLE === 'host') { if (linkUp()) hostStart(true); else { showScreen('lobby'); STATE.mode = 'lobby'; lobbyUI(); } } };
  $('eTitle2').onclick = () => toTitle();
}
