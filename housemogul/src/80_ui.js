/* ================= UI (DOM) ================= */
const SET = Object.assign({ name: '', ai: 0, preset: 'pure', opt: Object.assign({}, PRESET.pure) }, LS.get('set', {}));
const saveSet = () => LS.set('set', SET);
const HUB = /\/housemogul\/(index\.html)?$/.test(location.pathname) && !inArtifact();
const SCREENS = ['title', 'lobby', 'help', 'menuScr', 'endScr', 'confirm'];
function showScreen(id) { for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id); }
function titleStatus(t) { $('titleStatus').textContent = t || ''; }
function toast(txt, cls) {
  const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.textContent = txt; $('toasts').appendChild(d);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  setTimeout(() => d.remove(), 3800);
}
const optOf = preset => preset === 'custom' ? Object.assign({}, SET.opt) : Object.assign({}, PRESET[preset]);
const presetName = (pr, opt) => pr === 'pure' ? '纯粹' : pr === 'full' ? '完整' : '自定义（' + (OPTS.filter(o => opt[o.k]).map(o => o.n).join('、') || '全关') + '）';

/* ---------- title ---------- */
function renderModeUI(segId, boxId, preset, opt, ro) {
  [...$(segId).children].forEach(b => b.classList.toggle('sel', b.dataset.m === preset));
  const box = $(boxId); box.classList.toggle('ro', !!ro);
  box.innerHTML = preset === 'custom' ? OPTS.map(o => '<button data-k="' + o.k + '" class="' + (opt[o.k] ? 'on' : '') + '" title="' + esc(o.d) + '"><i>' + (opt[o.k] ? '✓' : '') + '</i>' + o.n + '</button>').join('')
    : '<div class="modeDesc" style="grid-column:1/-1">' + (preset === 'pure' ? '只有房价涨跌、挂牌和买卖：看准时机低买高卖，攒钱买豪宅。' : '全部玩法：按揭贷款、房租物业、装修、估价误差与验房、新闻传闻、交易手续费。') + '</div>';
}
function bestKey() { return 'best_' + (SET.preset === 'custom' ? 'c' + OPTS.map(o => SET.opt[o.k] ? 1 : 0).join('') : SET.preset) + '_' + SET.ai; }
function titleUI() {
  $('nameIn').value = SET.name;
  [...$('aiSeg').children].forEach(b => b.classList.toggle('sel', +b.dataset.ai === SET.ai));
  renderModeUI('modeSeg', 'optBox', SET.preset, SET.opt);
  const sv = LS.get('save', null);
  $('contBtn').classList.toggle('hidden', !sv);
  if (sv) $('contBtn').textContent = '继续（' + monthLabel(sv.month) + '）';
  const b = LS.get(bestKey(), null);
  $('bestTxt').textContent = b ? '这个玩法的最快纪录：' + b + ' 个月买下豪宅' : '';
  $('hubBtn').classList.toggle('hidden', !HUB);
  if (inArtifact()) { $('hostBtn').disabled = $('joinBtn').disabled = true; $('codeIn').disabled = true; titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); }
}
$('nameIn').addEventListener('input', e => { SET.name = e.target.value.trim().slice(0, 8); saveSet(); });
$('aiSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET.ai = +b.dataset.ai; saveSet(); sfx('click'); titleUI(); });
$('modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET.preset = b.dataset.m; saveSet(); sfx('click'); titleUI(); });
$('optBox').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || SET.preset !== 'custom') return; SET.opt[b.dataset.k] = SET.opt[b.dataset.k] ? 0 : 1; saveSet(); sfx('click'); titleUI(); });
$('newBtn').onclick = () => { audioInit(); sfx('click'); netLeave(); NETROLE = 'solo'; newGame((Math.random() * 1e9) | 0, [SET.name || '我'], SET.ai, optOf(SET.preset)); G.preset = SET.preset; G.bestKey = bestKey(); enterGame(0); saveGame(); };
$('contBtn').onclick = () => { audioInit(); const sv = LS.get('save', null); if (!sv) return; netLeave(); NETROLE = 'solo'; G = sv; STATE.lastSeq = G.seq; enterGame(0); };
$('hostBtn').onclick = () => { audioInit(); sfx('click'); NET.ai = SET.ai; NET.preset = SET.preset; NET.opt = optOf(SET.preset); netHost(); };
$('joinBtn').onclick = () => { audioInit(); sfx('click'); netJoin($('codeIn').value); };
$('helpBtn').onclick = () => openHelp();
$('hubBtn').onclick = () => { location.href = '../'; };

/* ---------- lobby ---------- */
function lobbyUI(st) {
  if (st != null) $('lStatus').textContent = st;
  const host = NETROLE === 'host';
  $('lCode').textContent = NET.code || '····';
  $('lP0').textContent = host ? (SET.name || '房主') : (NET.hostName || '房主');
  $('lP1').textContent = host ? (NET.guestName || '等待加入…') : (SET.name || '玩家二');
  $('lP1s').textContent = (host ? NET.guestName : 1) ? (NET.ready ? '已准备' : '未准备') : '　';
  [...$('lAiSeg').children].forEach(b => { b.classList.toggle('sel', +b.dataset.ai === (+NET.ai || 0)); b.disabled = !host; });
  [...$('lModeSeg').children].forEach(b => { b.disabled = !host; });
  renderModeUI('lModeSeg', 'lOptBox', NET.preset || 'pure', NET.opt || PRESET.pure, !host);
  $('lReady').classList.toggle('hidden', host); $('lStart').classList.toggle('hidden', !host);
  $('lReady').textContent = NET.ready ? '取消准备' : '准备'; $('lReady').classList.toggle('green', !!NET.ready);
  $('lStart').disabled = !(host && NET.gctl && NET.gctl.open && NET.ready);
  if (host && !st && NET.peer && NET.peer.open) $('lStatus').textContent = NET.guestName ? (NET.ready ? '对方已准备，可以开始' : '等对方点准备') : '把房间码发给朋友';
}
function hostLobbyChanged() { if (NETROLE === 'host') { NET.ready = false; sendLobby(); lobbyUI(); } }
$('lAiSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host') return; NET.ai = +b.dataset.ai; SET.ai = NET.ai; saveSet(); hostLobbyChanged(); });
$('lModeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host') return; NET.preset = b.dataset.m; SET.preset = NET.preset; NET.opt = optOf(NET.preset); saveSet(); hostLobbyChanged(); });
$('lOptBox').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host' || NET.preset !== 'custom') return; SET.opt[b.dataset.k] = SET.opt[b.dataset.k] ? 0 : 1; NET.opt = optOf('custom'); saveSet(); hostLobbyChanged(); });
$('lReady').onclick = () => { NET.ready = !NET.ready; sendRaw(NET.ctl, { t: 'lready', v: NET.ready }); sfx('ready'); lobbyUI(); };
$('lStart').onclick = () => hostStart();
$('lLeave').onclick = () => { netLeave(); toTitle(); };

/* ---------- screens ---------- */
function toTitle() {
  STATE.mode = 'title'; STATE.sel = -1; RND.hiD = -1;
  $('hud').classList.add('hidden'); showScreen('title'); titleUI();
  if (!G) newGame(12345, ['我'], 0, PRESET.full); // backdrop city
  fitCam(); CAM.z *= 1.15;
}
function enterGame(me) {
  ME = me; STATE.mode = 'play'; STATE.sel = -1; STATE.lastSeq = G.seq; RND.hiD = -1; RND.trees = null; for (const k in _dc) delete _dc[k];
  showScreen(null); $('hud').classList.remove('hidden');
  STATE.tab = innerWidth <= 760 || PHONE.matches ? 'list' : 'list'; $('side').classList.remove('open');
  fitCam(); renderUI(); sfx('month');
  if (G.over) showEnd();
}
function openMenu() { $('menuScr').classList.remove('hidden'); $('mHub').classList.toggle('hidden', !HUB); $('mStatus').textContent = NETROLE === 'solo' ? '单人游戏每个月自动存档' : ''; delete $('mTitle').dataset.arm; $('mTitle').textContent = '返回标题'; delete $('mHub').dataset.arm; $('mHub').textContent = '返回游戏厅'; }
function closeMenu() { $('menuScr').classList.add('hidden'); }
function openHelp() { $('help').classList.remove('hidden'); }
function closeHelp() { $('help').classList.add('hidden'); }
let confirmFn = null;
function askConfirm(html, yes, fn) { $('cTxt').innerHTML = html; $('cYes').textContent = yes || '确定'; confirmFn = fn; $('confirm').classList.remove('hidden'); }
function closeConfirm() { $('confirm').classList.add('hidden'); confirmFn = null; }
$('cNo').onclick = closeConfirm; $('cYes').onclick = () => { const f = confirmFn; closeConfirm(); f && f(); };
$('menuBtn').onclick = () => { sfx('click'); openMenu(); };
$('mResume').onclick = closeMenu; $('mHelp').onclick = openHelp; $('helpClose').onclick = closeHelp;
$('mSound').onclick = () => setSound(!AU.on); $('sndBtn').onclick = () => { audioInit(); setSound(!AU.on); };
function armTwice(btn, fn) { if (NETROLE === 'solo' || btn.dataset.arm) { fn(); return; } btn.dataset.arm = 1; btn.textContent = '再点一次确认'; }
$('mTitle').onclick = () => armTwice($('mTitle'), () => { if (NETROLE === 'solo') saveGame(); netLeave(); closeMenu(); toTitle(); });
$('mHub').onclick = () => armTwice($('mHub'), () => { if (NETROLE === 'solo') saveGame(); netLeave(); location.href = '../'; });
$('eAgain').onclick = () => {
  if (NETROLE === 'solo') { $('newBtn').onclick(); return; }
  if (NETROLE === 'host' && NET.gctl && NET.gctl.open) { newGame((Math.random() * 1e9) | 0, [SET.name || '房主', NET.guestName || '玩家二'], NET.ai, NET.opt); G.preset = NET.preset; sendRaw(NET.gctl, { t: 'start', G, me: 1 }); enterGame(0); return; }
  if (NETROLE === 'guest') { toast('等房主开新的一局', ''); return; }
  netLeave(); toTitle();
};
$('eTitleBtn').onclick = () => { netLeave(); toTitle(); };
function saveGame() { if (NETROLE === 'solo' && G) { if (G.over) LS.del('save'); else LS.set('save', G); } }

/* ---------- actions ---------- */
function act(a, v) {
  audioInit();
  if (NETROLE === 'guest') { netSend({ t: 'act', a, v }); return; }
  const err = doAct(ME, a, v);
  if (err) { toast(err, 'bad'); sfx('err'); return; }
  afterAct();
}
function afterAct() { maybeAdvance(); onState(); sync(); saveGame(); }
function maybeAdvance() {
  if (NETROLE === 'guest' || !G || G.over) return;
  if (humansReady()) endMonth();
}
function endTurnClick() {
  if (!G || G.over || STATE.mode !== 'play') return;
  const me = G.pl[ME]; if (!me.alive) return;
  sfx('click');
  act('ready', { on: !me.ready });
}
$('endBtn').onclick = endTurnClick;
function onState() { processEvents(); renderUI(); if (G.over && STATE.mode === 'play') setTimeout(showEnd, 900); }

function processEvents() {
  const evs = G.ev.filter(e => e.s > STATE.lastSeq); STATE.lastSeq = G.seq;
  let month = false;
  for (const e of evs) {
    const mine = e.pi === ME, other = e.pi >= 0 && e.pi !== ME;
    switch (e.k) {
      case 'buy': if (mine) { sfx('buy'); popMoney(e.id, '-' + fmtM(e.amt), '#ffd27a'); } else { toast(e.txt, ''); popMoney(e.id, '已售出', '#ffffff'); } break;
      case 'sell': if (mine) { sfx(e.amt >= 0 ? 'sell' : 'loss', e.amt > 50); popMoney(e.id, (e.amt >= 0 ? '+' : '') + fmtM(e.amt), e.amt >= 0 ? '#ff7a6e' : '#4fe09a'); toast(e.txt, e.amt >= 0 ? 'good' : 'bad'); } else if (other) toast(e.txt, ''); break;
      case 'demo': if (mine) { sfx('sell', true); popMoney(e.id, '拆迁 +' + fmtM(e.amt), '#ffd27a'); } toast(e.txt, 'gold'); break;
      case 'forced': if (mine) { sfx('bad'); toast(e.txt, 'bad'); } else toast(e.txt, ''); break;
      case 'reno': if (mine) sfx('reno'); break;
      case 'renodone': if (mine) { toast(e.txt, 'good'); sfx('good'); } break;
      case 'inspect': if (mine) sfx('insp'); break;
      case 'repay': if (mine) { sfx('good'); toast(e.txt, ''); } break;
      case 'bankrupt': toast(e.txt, 'bad'); sfx('bad'); break;
      case 'win': break;
      case 'month': month = true; break;
    }
  }
  if (month) {
    sfx('month'); const fx = $('monthFx'); $('monthFxT').textContent = monthLabel(G.month); fx.classList.remove('show'); void fx.offsetWidth; fx.classList.add('show');
    const nws = evs.filter(e => e.k === 'news');
    if (nws.length) setTimeout(() => { sfx(nws.some(e => e.amt > 0) ? 'news' : 'news'); for (const e of nws) toast(e.txt, e.amt > 0 ? 'good' : e.amt < 0 ? 'bad' : ''); }, 700);
    const me = G.pl[ME];
    if (me && me.flow && (OP('rent') || OP('loan')) && Math.abs(me.flow.net) > 0.005) { const f = me.flow, txt = '月结：' + [OP('rent') && f.rent > 0.004 ? '房租 ' + fmtM(f.rent, 1) : '', OP('rent') && f.up > 0.004 ? '物业 ' + fmtM(-f.up) : '', OP('loan') && f.int > 0.004 ? '利息 ' + fmtM(-f.int) : ''].filter(Boolean).join('，'); setTimeout(() => toast(txt, ''), 1100); }
  }
}

/* ---------- selection & tabs ---------- */
function selectProp(id, focus) {
  if (id === STATE.sel && !focus) id = -1;
  STATE.sel = id; RND.hiD = -1;
  if (id >= 0) { sfx('sel'); $('side').classList.remove('open'); if (focus) { const p = G.props[id]; focusTile(p.x + p.w / 2, p.y + p.h / 2, Math.max(CAM.z, 1)); } }
  renderUI();
}
function setTab(t) {
  const narrow = innerWidth <= 760 || PHONE.matches;
  if (narrow) { const open = $('side').classList.contains('open'); if (open && STATE.tab === t) { $('side').classList.remove('open'); renderUI(); return; } $('side').classList.add('open'); STATE.sel = -1; }
  STATE.tab = t; sfx('click'); renderUI();
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); });
$('phoneTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); });
$('news').onclick = () => setTab('news');
$('tGoal').onclick = () => selectProp(G.mansion, true);
$('tabBody').addEventListener('click', e => {
  const it = e.target.closest('[data-id]'); if (it) { selectProp(+it.dataset.id, true); return; }
  const d = e.target.closest('[data-d]'); if (d) { const i = +d.dataset.d; RND.hiD = RND.hiD === i ? -1 : i; STATE.sel = -1; if (RND.hiD >= 0) { const c = distCenter(i); focusTile(c[0], c[1], Math.max(CAM.z, 0.8)); } sfx('sel'); renderUI(); }
});

/* ---------- charts ---------- */
function spark(cvs, data, col) {
  const r = Math.min(devicePixelRatio || 1, 2), w = cvs.clientWidth || 72, h = cvs.clientHeight || 26; cvs.width = w * r; cvs.height = h * r;
  const c = cvs.getContext('2d'); c.scale(r, r);
  if (data.length < 2) return;
  let lo = Math.min(...data), hi = Math.max(...data); if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  c.strokeStyle = col; c.lineWidth = 1.5; c.lineJoin = 'round'; c.beginPath();
  data.forEach((v, i) => { const x = 1 + i / (data.length - 1) * (w - 2), y = h - 2 - (v - lo) / (hi - lo) * (h - 4); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
}
function bigChart(cvs, series, opt) {
  opt = opt || {};
  const r = Math.min(devicePixelRatio || 1, 2), w = cvs.clientWidth || 300, h = cvs.clientHeight || 96; cvs.width = w * r; cvs.height = h * r;
  const c = cvs.getContext('2d'); c.scale(r, r);
  const all = series.flatMap(s => s.data).concat(opt.lines ? opt.lines.map(l => l.v) : []);
  if (!all.length) return;
  let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.12 || hi * 0.05 || 1; lo -= pad; hi += pad;
  if (opt.zero) lo = Math.min(lo, 0);
  const L = 4, R = 46, T = 6, B = 14, n = Math.max(...series.map(s => s.data.length));
  const X = i => L + i / Math.max(1, n - 1) * (w - L - R), Y = v => T + (1 - (v - lo) / (hi - lo)) * (h - T - B);
  c.font = '10px Oswald,sans-serif'; c.fillStyle = 'rgba(255,255,255,.45)'; c.textAlign = 'left'; c.textBaseline = 'middle';
  for (let k = 0; k <= 2; k++) { const v = lo + (hi - lo) * (0.15 + k * 0.35), y = Y(v); c.strokeStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(L, y); c.lineTo(w - R, y); c.stroke(); c.fillText(fmtM(v).replace('¥', ''), w - R + 4, y); }
  if (opt.lines) for (const l of opt.lines) { const y = Y(l.v); c.setLineDash([4, 3]); c.strokeStyle = l.col; c.lineWidth = 1.2; c.beginPath(); c.moveTo(L, y); c.lineTo(w - R, y); c.stroke(); c.setLineDash([]); c.fillStyle = l.col; c.fillText(l.n, L + 2, y - 7); }
  for (const s of series) {
    if (s.data.length < 2) continue;
    const off = n - s.data.length;
    c.strokeStyle = s.col; c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath();
    s.data.forEach((v, i) => { const x = X(i + off), y = Y(v); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    if (s.fill) { c.lineTo(X(n - 1), h - B); c.lineTo(X(off), h - B); c.closePath(); const g = c.createLinearGradient(0, T, 0, h); g.addColorStop(0, s.fill); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fill(); }
    const lv = s.data[s.data.length - 1]; c.fillStyle = s.col; c.beginPath(); c.arc(X(n - 1), Y(lv), 3, 0, 6.283); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,.4)'; c.textAlign = 'left'; c.fillText(opt.from || '', L, h - 6); c.textAlign = 'right'; c.fillText('本月', w - R, h - 6);
}

/* ---------- main HUD render ---------- */
function flashStat(id, v) { const el = $(id); if (el.dataset.v !== String(v)) { if (el.dataset.v != null) { el.parentNode.classList.remove('flash'); void el.offsetWidth; el.parentNode.classList.add('flash'); } el.dataset.v = String(v); } }
function renderUI() {
  if (!G || STATE.mode === 'title') return;
  const me = G.pl[ME], mp = mansionPrice();
  $('tM').textContent = monthLabel(G.month);
  $('tMs').textContent = '第 ' + (G.month + 1) + ' / ' + BAL.maxMonth + ' 月 · ' + REGLABEL();
  $('tCash').textContent = fmtM(me.cash); flashStat('tCash', Math.round(me.cash * 10));
  $('tCash').className = me.cash < 0 ? 'down' : '';
  $('tNet').textContent = fmtM(netWorth(ME));
  const dsm = document.querySelector('.stat.debt small');
  if (OP('loan')) { dsm.textContent = '贷款 · 月利率'; $('tDebt').textContent = fmtM(debtOf(ME)) + ' · ' + (G.rate * 100).toFixed(2) + '%'; }
  else { dsm.textContent = '持有'; $('tDebt').textContent = ownedBy(ME).length + ' 套'; }
  $('tGoalP').textContent = fmtM(mp);
  $('tBars').innerHTML = G.pl.map(pl => { const v = pl.alive ? clamp(netWorth(pl.i) / mp, 0, 1) : 0; return '<div class="bar" title="' + esc(pl.name) + ' 净资产 ' + Math.round(v * 100) + '%"><i class="p' + pl.i + '" style="width:' + (v * 100).toFixed(1) + '%"></i></div>'; }).join('');
  // tabs
  const listed = G.props.filter(p => p.list && p.owner === -1), mine = ownedBy(ME);
  $('cList').textContent = listed.length; $('cMine').textContent = mine.length || ''; $('pcList').textContent = listed.length; $('pcMine').textContent = mine.length || '';
  for (const b of $('tabs').children) b.classList.toggle('sel', b.dataset.t === STATE.tab);
  const narrow = innerWidth <= 760 || PHONE.matches;
  for (const b of $('phoneTabs').children) b.classList.toggle('sel', b.dataset.t === STATE.tab && $('side').classList.contains('open'));
  $('tabs').querySelector('[data-t="news"]').classList.toggle('hidden', !OP('news') && !narrow && false);
  renderTab();
  renderDetail();
  // news ticker
  const nl = G.news.slice(-3).reverse();
  $('news').innerHTML = nl.map(n => '<div class="nl ' + n.tone + '"><i>' + (Math.floor(n.m / 12) + 1) + '年' + (n.m % 12 + 1) + '月</i><b>' + esc(n.tag) + '</b>' + esc(n.txt) + '</div>').join('');
  // end button
  const eb = $('endBtn'), others = G.pl.filter(p => p.kind === 'human' && p.i !== ME && p.alive && !p.gone);
  if (!me.alive) { eb.disabled = true; eb.className = 'wait'; eb.innerHTML = '已出局<small>看对手继续</small>'; }
  else if (me.ready) { eb.disabled = false; eb.className = 'wait'; eb.innerHTML = '等待 ' + esc(others.map(p => p.name).join('、')) + '…<small>点击取消</small>'; }
  else { eb.disabled = false; eb.className = 'primary'; const w = others.filter(p => p.ready).length; eb.innerHTML = (G.month + 1 >= BAL.maxMonth ? '最后一个月 ▸' : '下个月 ▸') + '<small>' + (others.length ? (w ? '对方已准备' : '两人都点了才翻月') : (narrow ? '' : '回车')) + '</small>'; }
}
const REGLABEL = () => { const h = heat(); return h > 0.03 ? '楼市火热' : h > 0.008 ? '楼市回暖' : h < -0.03 ? '楼市冰冷' : h < -0.008 ? '楼市降温' : '楼市平稳'; };
function ownerName(o) { return o < 0 ? '业主' : o === ME ? '你' : G.pl[o].name; }
function itemHTML(p, right, sub) {
  const D = DISTS[p.d];
  return '<div class="item' + (p.id === STATE.sel ? ' sel' : '') + '" data-id="' + p.id + '"><span class="sw" style="background:' + D.col + '"></span><div class="main"><div class="nm">' + esc(propName(p)) + '</div><div class="ds">' + sub + '</div></div><div class="rt">' + right + '</div></div>';
}
function renderTab() {
  const tb = $('tabBody'), t = STATE.tab; let h = '';
  if (t === 'mkt') {
    const ht = heat(), hv = clamp((ht + 0.06) / 0.12, 0, 1);
    h += '<div class="mktHead"><div class="heat"><span>冷</span><div class="bar"><i style="width:' + (hv * 100).toFixed(0) + '%"></i></div><span>热</span></div><div>' + REGLABEL() + '，近三个月均价 <b class="' + udc(ht) + '">' + pct(Math.exp(ht) - 1) + '</b>' + (OP('loan') ? '　房贷月利率 <b class="gold">' + (G.rate * 100).toFixed(2) + '%</b>' : '') + '</div></div>';
    DISTS.forEach((D, i) => {
      const s = G.d[i], hs = s.hist, c3 = hs.length > 3 ? hs[hs.length - 1] / hs[hs.length - 4] - 1 : 0, c12 = hs.length > 12 ? hs[hs.length - 1] / hs[hs.length - 13] - 1 : 0;
      h += '<div class="item' + (RND.hiD === i ? ' sel' : '') + '" data-d="' + i + '"><span class="sw" style="background:' + D.col + '"></span><div class="main"><div class="nm">' + D.n + ' <span class="num" style="font-weight:400;color:var(--sub);font-size:13px">' + Math.round(s.idx * 100) + '</span></div><div class="ds">' + D.hint + '</div></div><canvas class="spark" data-sp="' + i + '"></canvas><div class="rt"><span class="' + udc(c3) + '">' + pct(c3) + '</span><small class="' + udc(c12) + '">年 ' + pct(c12, 0) + '</small></div></div>';
    });
    h += '<div class="secT">点一个区，地图上会高亮它</div>';
  } else if (t === 'list') {
    const ls = G.props.filter(p => p.list && p.owner === -1);
    const man = ls.find(p => p.kind === 'mansion'), rest = ls.filter(p => p.kind !== 'mansion').sort((a, b) => (b.list.tag === 'hot') - (a.list.tag === 'hot') || a.list.ask / estOf(a) - b.list.ask / estOf(b));
    if (man) h += itemHTML(man, '<span class="gold">' + fmtM(man.list.ask) + '</span><small class="sub">全款</small>', '<span class="tagx goal">目标</span> 买下就赢');
    h += '<div class="secT">挂牌中 ' + rest.length + ' 套 · ' + (OP('insp') ? '按挂牌价 / 中介估价排序' : '按挂牌价 / 参考价排序') + '</div>';
    if (!rest.length) h += '<div class="empty">这个月没有挂牌房源</div>';
    for (const p of rest) {
      const e = knows(p, ME) ? val(p) : estOf(p), r = p.list.ask / e - 1, L = p.list;
      const tags = (L.tag === 'hot' ? '<span class="tagx hot">急售</span>' : '') + (L.age === 0 ? '<span class="tagx new">新</span>' : L.cut ? '<span class="tagx cut">降价</span>' : '') + (p.demo ? '<span class="tagx rumor">拆迁传闻</span>' : '');
      h += itemHTML(p, fmtM(L.ask) + '<small style="color:' + (r < -0.04 ? 'var(--gold)' : 'var(--sub)') + '">' + (knows(p, ME) ? '真实 ' : OP('insp') ? '估 ' : '参考 ') + pct(r, 0) + '</small>', KINDS[p.kind].n + ' · ' + DISTS[p.d].n + ' · 剩 ' + L.left + ' 月' + tags);
    }
  } else if (t === 'mine') {
    const mine = ownedBy(ME), me = G.pl[ME];
    if (!mine.length) h += '<div class="empty">你还没有房产。<br>去「房源」里挑一套挂牌价划算的买下来吧。</div>';
    else {
      let mv = 0, ln = 0; for (const p of mine) { mv += val(p); ln += p.loan; }
      const f = monthlyFlow(ME);
      h += '<div class="mktHead"><div>持有 <b>' + mine.length + '</b> 套 · 市值 <b class="num">' + fmtM(mv) + '</b>' + (OP('loan') ? ' · 贷款 <b class="num">' + fmtM(ln) + '</b>' : '') + '</div>' + (OP('rent') || OP('loan') ? '<div>每月现金流 <b class="num ' + udc(f.net) + '">' + fmtM(f.net, 1) + '</b></div>' : '') + '</div>';
      for (const p of mine.sort((a, b) => (b.offer / b.paid) - (a.offer / a.paid))) {
        const r = p.offer * (1 - sellFee()) / p.paid - 1;
        h += itemHTML(p, p.reno ? '<span class="gold">装修中</span><small class="sub">还剩 ' + p.reno + ' 月</small>' : fmtM(p.offer) + '<small class="' + udc(r) + '">' + pct(r) + '</small>', KINDS[p.kind].n + ' · 买入 ' + fmtM(p.paid) + (p.offerHot ? '<span class="tagx hot">抢手</span>' : '') + (p.loan ? ' · 按揭' : ''));
      }
    }
    if (me.st.sells || me.st.profit) h += '<div class="secT">累计卖出 ' + me.st.sells + ' 套，盈亏 <span class="' + udc(me.st.profit) + '">' + fmtM(me.st.profit, 1) + '</span></div>';
  } else if (t === 'news') {
    const ns = G.news.slice().reverse();
    if (!OP('news')) h += '<div class="empty" style="padding:6px">本局没开「新闻与传闻」，这里只有楼市大事。</div>';
    for (const n of ns) h += '<div class="item" style="cursor:default;align-items:flex-start"><span class="num sub" style="font-size:12px;width:46px;flex:none">' + (Math.floor(n.m / 12) + 1) + '年' + (n.m % 12 + 1) + '月</span><div class="main"><div style="font-size:13.5px;line-height:1.5;white-space:normal"><b class="' + (n.tone === 'good' ? 'up' : n.tone === 'bad' ? 'down' : n.tone === 'rumor' ? '' : 'gold') + '" style="' + (n.tone === 'rumor' ? 'color:#c9a4ff' : '') + '">' + esc(n.tag) + '</b> ' + esc(n.txt) + '</div></div></div>';
  }
  const st = tb.scrollTop; tb.innerHTML = h; tb.scrollTop = st;
  tb.querySelectorAll('canvas[data-sp]').forEach(c => { const i = +c.dataset.sp; spark(c, G.d[i].hist.slice(-24), DISTS[i].col); });
}

function renderDetail() {
  const el = $('detail'), id = STATE.sel;
  if (id < 0 || !G.props[id]) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const p = G.props[id], K = KINDS[p.kind], D = DISTS[p.d], v = val(p), me = G.pl[ME], man = p.kind === 'mansion';
  const listed = p.list && p.owner === -1, mine = p.owner === ME, kn = knows(p, ME) || !OP('insp');
  let h = '<h2><span class="sw" style="background:' + D.col + ';width:12px;height:12px"></span>' + esc(propName(p)) + '<button class="x ghost" id="dClose">✕</button></h2>';
  h += '<div class="meta">' + K.n + ' · ' + D.n + ' · ' + (man ? '庄园' : COND[p.cond].n) + (p.owner >= 0 ? ' · <b style="color:' + PCOL[p.owner] + '">' + esc(ownerName(p.owner)) + '的房</b>' : '') + (p.demo ? ' · <span class="tagx rumor">拆迁传闻</span>' : '') + '</div>';
  h += '<canvas id="dChart"></canvas>';
  const lines = [];
  if (man) {
    const need = p.list ? p.list.ask * (1 + buyFee()) : v;
    h += '<div class="kv"><span>价格</span><span class="big gold">' + fmtM(p.list ? p.list.ask : v) + '</span><span>你的现金</span><span>' + fmtM(me.cash) + '</span><span>你的净资产</span><span>' + fmtM(netWorth(ME)) + '</span></div>';
    if (p.owner >= 0) h += '<div class="note good">' + esc(ownerName(p.owner)) + ' 已经买下了终极豪宅。</div>';
    else {
      h += '<div class="note">终极目标：<b>全款</b>买下就赢' + (G.pl.length > 1 ? '，谁先买下谁赢' : '') + '。价格跟着半山的房价涨跌。' + (OP('fee') ? '另收 2% 手续费。' : '') + '</div>';
      h += '<div class="acts"><button id="dBuyMan" class="primary"' + (me.cash >= need && me.alive ? '' : ' disabled') + '>全款买下 ' + fmtM(need) + '<small>' + (me.cash >= need ? '现在就能买！' : '还差 ' + fmtM(need - me.cash) + ' 现金') + '</small></button></div>';
    }
    lines.push();
  } else if (listed) {
    const L = p.list, e = kn ? v : estOf(p), r = L.ask / e - 1;
    h += '<div class="kv"><span>挂牌价</span><span class="big">' + fmtM(L.ask) + '</span>';
    h += '<span>' + (knows(p, ME) ? '真实价值（已验房）' : OP('insp') ? '中介估价（±10%）' : '参考价') + '</span><span style="color:' + (r < -0.04 ? 'var(--gold)' : 'inherit') + '">' + fmtM(e) + ' <small class="sub">' + (r <= 0 ? '低 ' : '高 ') + Math.abs(r * 100).toFixed(0) + '%</small></span>';
    h += '<span>挂牌</span><span>' + (L.age === 0 ? '本月新挂' : '已挂 ' + L.age + ' 个月') + '，还剩 ' + L.left + ' 月</span></div>';
    if (L.tag === 'hot') h += '<div class="note warn">业主说急着用钱，想尽快出手。</div>';
    if (L.cut) h += '<div class="note">卖了几个月没卖掉，这个月降价了。</div>';
    if (knows(p, ME)) { const [qn, qc] = QUAL(p.q); h += '<div class="note insp">验房结果：房屋质量<b>' + qn + '</b>，真实价值 ' + fmtM(v) + '。</div>'; }
    lines.push({ v: L.ask, col: '#ffd27a', n: '挂牌' });
    const fc = buyCost(L.ask, false), lc = buyCost(L.ask, true);
    h += '<div class="acts">';
    if (OP('insp') && !knows(p, ME)) h += '<button id="dInsp">验房 ' + fmtM(inspCost(p)) + '<small>看到真实价值和房屋质量</small></button>';
    h += '<div class="row"><button id="dBuy" class="primary"' + (me.cash >= fc && me.alive ? '' : ' disabled') + '>全款买入<small>' + fmtM(fc) + (OP('fee') ? ' 含手续费' : '') + '</small></button>';
    if (OP('loan')) h += '<button id="dLoan" class="primary"' + (me.cash >= lc && me.alive ? '' : ' disabled') + '>按揭买入<small>首付 ' + fmtM(lc) + '</small></button>';
    h += '</div>';
    if (OP('loan')) h += '<div class="sub" style="font-size:12px">按揭：贷款 ' + fmtM(L.ask * (1 - BAL.down)) + '，每月利息约 ' + fmtM(L.ask * (1 - BAL.down) * G.rate) + (OP('rent') ? '，月租约 ' + fmtM(v * BAL.rent) : '') + '</div>';
    else if (OP('rent')) h += '<div class="sub" style="font-size:12px">月租约 ' + fmtM(v * BAL.rent) + '，物业费约 ' + fmtM(v * BAL.upkeep) + '</div>';
    h += '</div>';
  } else if (mine) {
    const net = sellNet(p), prof = p.offer * (1 - sellFee()) - p.paid, r = prof / p.paid;
    h += '<div class="kv"><span>买入成本</span><span>' + fmtM(p.paid) + ' <small class="sub">' + (G.month - p.boughtM) + ' 个月前</small></span>';
    h += '<span>参考价</span><span>' + fmtM(v) + '</span>';
    h += '<span>本月买家出价</span><span class="big ' + udc(p.offer - p.paid) + '">' + (p.reno ? '—' : fmtM(p.offer)) + '</span>';
    if (p.loan) h += '<span>贷款余额</span><span>' + fmtM(p.loan) + '</span>';
    if (!p.reno) h += '<span>卖出到手</span><span>' + fmtM(net) + ' <small class="' + udc(prof) + '">' + (prof >= 0 ? '赚 ' : '亏 ') + fmtM(Math.abs(prof)) + '（' + pct(r) + '）</small></span>';
    if (OP('rent')) h += '<span>每月</span><span>租 ' + fmtM(p.reno ? 0 : v * BAL.rent, 1) + ' · 物业 ' + fmtM(-v * BAL.upkeep) + (p.loan ? ' · 息 ' + fmtM(-p.loan * G.rate) : '') + '</span>';
    else if (p.loan) h += '<span>每月利息</span><span>' + fmtM(-p.loan * G.rate) + '</span>';
    h += '</div>';
    if (p.offerHot) h += '<div class="note good">有买家特别想要这套，出价比平时高。</div>';
    if (p.reno) h += '<div class="note insp">装修中，还要 ' + p.reno + ' 个月，完工后变成' + COND[p.renoTo].n + '。装修期间不能卖' + (OP('rent') ? '、没有房租' : '') + '。</div>';
    if (knows(p, ME) && OP('insp')) { const [qn] = QUAL(p.q); h += '<div class="sub" style="font-size:12px">验房记录：房屋质量' + qn + '</div>'; }
    lines.push({ v: p.paid, col: PCOL[ME], n: '成本' });
    h += '<div class="acts">';
    h += '<button id="dSell" class="' + (prof >= 0 ? 'red' : 'green') + '"' + (p.reno || !me.alive ? ' disabled' : '') + '>以 ' + fmtM(p.offer) + ' 卖出<small>' + (OP('fee') ? '扣 3% 手续费' : '') + (p.loan ? (OP('fee') ? '、' : '') + '还清贷款' : '') + (OP('fee') || p.loan ? '后' : '') + '到手 ' + fmtM(net) + '</small></button>';
    const R = OP('reno') ? renoInfo(p) : null;
    if (R && !p.reno) h += '<button id="dReno"' + (me.cash >= R.cost ? '' : ' disabled') + '>装修成' + COND[p.cond + 1].n + ' ' + fmtM(R.cost) + '<small>' + R.t + ' 个月，参考价约 +' + fmtM(R.gain) + '</small></button>';
    if (OP('loan') && p.loan > 0) h += '<button id="dRepay" class="ghost"' + (me.cash >= p.loan ? '' : ' disabled') + '>提前还清贷款 ' + fmtM(p.loan) + '</button>';
    h += '</div>';
  } else {
    h += '<div class="kv"><span>参考价</span><span class="big">' + (OP('insp') && p.owner < 0 ? '约 ' : '') + fmtM(OP('insp') && p.owner < 0 ? Math.round(v / 5) * 5 : v) + '</span></div>';
    h += '<div class="note">' + (p.owner >= 0 ? esc(ownerName(p.owner)) + ' 持有这套房。' : p.cool ? '刚成交不久，业主暂时不卖。' : '业主暂时没挂牌，以后可能会卖。') + '</div>';
    if (OP('rent') && p.owner < 0) h += '<div class="sub" style="font-size:12px">' + D.hint + '</div>';
  }
  el.innerHTML = h;
  const hist = p.hist.slice();
  bigChart($('dChart'), [{ data: hist, col: '#8fd0ff', fill: 'rgba(143,208,255,.25)' }], { lines, from: hist.length + ' 个月前' });
  const on = (i, f) => { const b = $(i); if (b) b.onclick = f; };
  on('dClose', () => selectProp(-1));
  on('dInsp', () => act('inspect', { id }));
  on('dBuy', () => act('buy', { id, loan: false }));
  on('dLoan', () => act('buy', { id, loan: true }));
  on('dSell', () => act('sell', { id }));
  on('dReno', () => act('reno', { id }));
  on('dRepay', () => act('repay', { id }));
  on('dBuyMan', () => askConfirm('全款 <b class="gold">' + fmtM(p.list.ask * (1 + buyFee())) + '</b> 买下终极豪宅？', '买下！', () => act('buy', { id, loan: false })));
}

/* ---------- end screen ---------- */
function showEnd() {
  if (STATE.mode === 'end' || !G.over) return;
  STATE.mode = 'end'; selectProp(-1);
  const o = G.over, w = o.winner, me = G.pl[ME];
  const won = w === ME;
  let title, sub;
  if (o.reason === 'mansion') { title = won ? '豪宅到手！' : esc(G.pl[w].name) + ' 赢了'; sub = (won ? '你' : esc(G.pl[w].name)) + '用了 ' + (o.m + 1) + ' 个月买下终极豪宅'; }
  else if (o.reason === 'time') { title = w < 0 ? '时间到' : won ? '你赢了' : esc(G.pl[w].name) + ' 赢了'; sub = BAL.maxMonth + ' 个月过去了，' + (w < 0 ? '还没买下豪宅' : '按净资产排名'); }
  else { title = '破产了'; sub = w >= 0 ? esc(G.pl[w].name) + ' 笑到了最后' : '资不抵债'; }
  if (won && o.reason === 'mansion' && NETROLE === 'solo' && G.bestKey) { const b = LS.get(G.bestKey, null); if (!b || o.m + 1 < b) { LS.set(G.bestKey, o.m + 1); sub += '，新纪录！'; } else sub += '（纪录 ' + b + ' 个月）'; }
  sub += ' · 玩法：' + presetName(G.preset || (OPTS.every(x => G.opt[x.k]) ? 'full' : OPTS.every(x => !G.opt[x.k]) ? 'pure' : 'custom'), G.opt);
  $('eTitle').textContent = title.replace(/&amp;/g, '&'); $('eSub').innerHTML = sub;
  const rank = G.pl.slice().sort((a, b) => (b.i === w) - (a.i === w) || netWorth(b.i) - netWorth(a.i));
  $('eRank').innerHTML = rank.map((pl, k) => '<div><span class="sw" style="background:' + PCOL[pl.i] + ';width:12px;height:12px"></span><b>' + (k + 1) + '. ' + esc(pl.name) + (pl.alive ? '' : '（破产）') + '</b><span>净资产 ' + fmtM(pl.alive ? netWorth(pl.i) : 0) + '</span><span class="sub" style="font-size:13px">买 ' + pl.st.buys + ' 卖 ' + pl.st.sells + ' · 最赚一笔 ' + fmtM(pl.st.best) + '</span></div>').join('');
  showScreen('endScr');
  bigChart($('endChart'), G.pl.map(pl => ({ data: pl.wh, col: PCOL[pl.i] })), { lines: [{ v: mansionPrice(), col: '#f5c451', n: '豪宅' }], from: '第 1 月' });
  $('eAgain').textContent = NETROLE === 'solo' ? '再来一局' : NETROLE === 'host' && linkUp() ? '再来一局' : NETROLE === 'guest' ? '等房主开新局' : '返回标题';
  $('eAgain').disabled = NETROLE === 'guest';
  sfx(won ? 'win' : 'lose');
  saveGame();
}
