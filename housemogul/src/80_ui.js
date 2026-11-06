/* ================= UI (DOM) ================= */
const SET0 = LS.get('set', {}); if (SET0.v !== 2) LS.del('save');
const SET = Object.assign({ name: '', ai: 0, preset: 'pure', diff: 'easy', opt: Object.assign({}, PRESET.pure) }, LS.get('set', {}));
const saveSet = () => { SET.v = 2; LS.set('set', SET); };
if (SET0.v !== 2) saveSet();   // old turn-based saves were dropped above; mark settings as current
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
function bestKey() { return 'best_' + SET.diff + '_' + (SET.preset === 'custom' ? 'c' + OPTS.map(o => SET.opt[o.k] ? 1 : 0).join('') : SET.preset) + '_' + SET.ai; }
function titleUI() {
  $('nameIn').value = SET.name;
  [...$('aiSeg').children].forEach(b => b.classList.toggle('sel', +b.dataset.ai === SET.ai));
  renderModeUI('modeSeg', 'optBox', SET.preset, SET.opt);
  [...$('diffSeg').children].forEach(b => b.classList.toggle('sel', b.dataset.d === SET.diff)); $('diffDesc').textContent = DIFF[SET.diff].d;
  const sv = LS.get('save', null);
  $('contBtn').classList.toggle('hidden', !sv);
  if (sv) $('contBtn').textContent = '继续（' + clock(sv.t || 0) + '）';
  const b = LS.get(bestKey(), null);
  $('bestTxt').textContent = b && b > 30 ? '这个玩法的最快纪录：' + clock(b) + ' 买下豪宅' : '';
  $('hubBtn').classList.toggle('hidden', !HUB);
  if (inArtifact()) { $('hostBtn').disabled = $('joinBtn').disabled = true; $('codeIn').disabled = true; titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); }
}
$('nameIn').addEventListener('input', e => { SET.name = e.target.value.trim().slice(0, 8); saveSet(); });
$('aiSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET.ai = +b.dataset.ai; saveSet(); sfx('click'); titleUI(); });
$('diffSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET.diff = b.dataset.d; saveSet(); sfx('click'); titleUI(); });
$('modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SET.preset = b.dataset.m; saveSet(); sfx('click'); titleUI(); });
$('optBox').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || SET.preset !== 'custom') return; SET.opt[b.dataset.k] = SET.opt[b.dataset.k] ? 0 : 1; saveSet(); sfx('click'); titleUI(); });
$('newBtn').onclick = () => { audioInit(); sfx('click'); netLeave(); NETROLE = 'solo'; newGame((Math.random() * 1e9) | 0, [SET.name || '我'], SET.ai, optOf(SET.preset), SET.diff); G.preset = SET.preset; G.bestKey = bestKey(); enterGame(0); saveGame(); };
$('contBtn').onclick = () => { audioInit(); const sv = LS.get('save', null); if (!sv || sv.v !== 2) { LS.del('save'); titleUI(); return; } netLeave(); NETROLE = 'solo'; G = sv; STATE.lastSeq = G.seq; enterGame(0); };
$('hostBtn').onclick = () => { audioInit(); sfx('click'); NET.ai = SET.ai; NET.diff = SET.diff; NET.preset = SET.preset; NET.opt = optOf(SET.preset); netHost(); };
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
  [...$('lDiffSeg').children].forEach(b => { b.classList.toggle('sel', b.dataset.d === (NET.diff || 'easy')); b.disabled = !host; });
  $('lReady').classList.toggle('hidden', host); $('lStart').classList.toggle('hidden', !host);
  $('lReady').textContent = NET.ready ? '取消准备' : '准备'; $('lReady').classList.toggle('green', !!NET.ready);
  $('lStart').disabled = !(host && NET.gctl && NET.gctl.open && NET.ready);
  if (host && !st && NET.peer && NET.peer.open) $('lStatus').textContent = NET.guestName ? (NET.ready ? '对方已准备，可以开始' : '等对方点准备') : '把房间码发给朋友';
}
function hostLobbyChanged() { if (NETROLE === 'host') { NET.ready = false; sendLobby(); lobbyUI(); } }
$('lAiSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host') return; NET.ai = +b.dataset.ai; SET.ai = NET.ai; saveSet(); hostLobbyChanged(); });
$('lDiffSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host') return; NET.diff = b.dataset.d; SET.diff = NET.diff; saveSet(); hostLobbyChanged(); });
$('lModeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host') return; NET.preset = b.dataset.m; SET.preset = NET.preset; NET.opt = optOf(NET.preset); saveSet(); hostLobbyChanged(); });
$('lOptBox').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || NETROLE !== 'host' || NET.preset !== 'custom') return; SET.opt[b.dataset.k] = SET.opt[b.dataset.k] ? 0 : 1; NET.opt = optOf('custom'); saveSet(); hostLobbyChanged(); });
$('lReady').onclick = () => { NET.ready = !NET.ready; sendRaw(NET.ctl, { t: 'lready', v: NET.ready }); sfx('ready'); lobbyUI(); };
$('lStart').onclick = () => hostStart();
$('lLeave').onclick = () => { netLeave(); toTitle(); };

/* ---------- screens ---------- */
function toTitle() {
  STATE.mode = 'title'; STATE.sel = -1; STATE.detail = false; RND.hiD = -1; RND.ring = -1;
  $('hud').classList.add('hidden'); showScreen('title'); titleUI();
  if (!G || G.over || NETROLE !== 'backdrop') { newGame(12345, ['我'], 0, PRESET.pure, 'normal'); NETROLE = 'backdrop'; }
  fitCam(); CAM.z *= 1.15;
}
function enterGame(me) {
  ME = me; STATE.mode = 'play'; STATE.sel = -1; STATE.detail = false; STATE.lastSeq = G.seq; STATE.paused = false; STATE.speed = 1; STATE.myIdx = 0;
  RND.hiD = -1; RND.ring = -1; RND.trees = null; RND.seen.clear(); RND.flash.clear(); RND.prevV.clear(); for (const k in _dc) delete _dc[k];
  showScreen(null); $('hud').classList.remove('hidden');
  fitCam(); if (innerWidth <= 760 || PHONE.matches) { CAM.z = clamp(CAM.z * 1.55, 0.5, 1); CAM.x = -40; CAM.y = 330; }
  TUT.step = -1; tutStart(false); renderHUD(true); sfx('month');
  if (G.over) showEnd();
}
function openMenu() {
  $('menuScr').classList.remove('hidden'); $('mHub').classList.toggle('hidden', !HUB);
  $('mStatus').textContent = NETROLE === 'solo' ? '单人游戏会自动存档；菜单打开时时间暂停' : '联机时时间不会暂停';
  delete $('mTitle').dataset.arm; $('mTitle').textContent = '返回标题'; delete $('mHub').dataset.arm; $('mHub').textContent = '返回游戏厅';
}
const menuOpen = () => !$('menuScr').classList.contains('hidden') || !$('help').classList.contains('hidden') || !$('confirm').classList.contains('hidden');
function closeMenu() { $('menuScr').classList.add('hidden'); }
function openHelp() { $('help').classList.remove('hidden'); }
function closeHelp() { $('help').classList.add('hidden'); }
let confirmFn = null;
function askConfirm(html, yes, fn) { $('cTxt').innerHTML = html; $('cYes').textContent = yes || '确定'; confirmFn = fn; $('confirm').classList.remove('hidden'); }
function closeConfirm() { $('confirm').classList.add('hidden'); confirmFn = null; }
$('cNo').onclick = closeConfirm; $('cYes').onclick = () => { const f = confirmFn; closeConfirm(); f && f(); };
$('menuBtn').onclick = () => { sfx('click'); openMenu(); };
$('mTut').onclick = () => { closeMenu(); if (NETROLE !== 'solo') { toast('新手引导只在单人游戏里有', ''); return; } tutStart(true); };
$('coachSkip').onclick = () => { tutEnd(); toast('可以在菜单里重看新手引导', ''); };
$('coachOk').onclick = () => tutEnd();
$('mResume').onclick = closeMenu; $('mHelp').onclick = openHelp; $('helpClose').onclick = closeHelp;
$('mSound').onclick = () => setSound(!AU.on); $('sndBtn').onclick = () => { audioInit(); setSound(!AU.on); };
function armTwice(btn, fn) { if (NETROLE === 'solo' || btn.dataset.arm) { fn(); return; } btn.dataset.arm = 1; btn.textContent = '再点一次确认'; }
$('mTitle').onclick = () => armTwice($('mTitle'), () => { if (NETROLE === 'solo') saveGame(); netLeave(); closeMenu(); toTitle(); });
$('mHub').onclick = () => armTwice($('mHub'), () => { if (NETROLE === 'solo') saveGame(); netLeave(); location.href = '../'; });
$('eAgain').onclick = () => {
  if (NETROLE === 'solo') { $('newBtn').onclick(); return; }
  if (NETROLE === 'host' && NET.gctl && NET.gctl.open) { newGame((Math.random() * 1e9) | 0, [SET.name || '房主', NET.guestName || '玩家二'], NET.ai, NET.opt, NET.diff); G.preset = NET.preset; sendRaw(NET.gctl, { t: 'start', G, me: 1 }); enterGame(0); return; }
  if (NETROLE === 'guest') { toast('等房主开新的一局', ''); return; }
  netLeave(); toTitle();
};
$('eTitleBtn').onclick = () => { netLeave(); toTitle(); };
function saveGame() { if (NETROLE === 'solo' && G) { if (G.over) LS.del('save'); else LS.set('save', G); } }

/* ---------- time controls (solo only) ---------- */
const simRuns = () => STATE.mode === 'play' && G && !G.over && (NETROLE === 'solo' || NETROLE === 'host') && !(NETROLE === 'solo' && (STATE.paused || menuOpen() || TUT.pause));
function setSpeed(s) {
  if (NETROLE !== 'solo') return;
  if (s === 0) STATE.paused = !STATE.paused; else { STATE.paused = false; STATE.speed = s; }
  sfx('click'); renderHUD(true);
}
$('speed').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSpeed(+b.dataset.s); });

/* ---------- actions ---------- */
function act(a, v) {
  audioInit();
  if (NETROLE === 'guest') { netSend({ t: 'act', a, v }); return; }
  const err = doAct(ME, a, v);
  if (err) { toast(err, 'bad'); sfx('err'); return; }
  afterAct();
}
function afterAct() { onState(); syncNow(); }
function onState() { processEvents(); renderHUD(true); if (G.over && STATE.mode === 'play') setTimeout(showEnd, 900); }

function processEvents() {
  if (STATE.lastSeq > G.seq) STATE.lastSeq = 0;
  const evs = G.ev.filter(e => e.s > STATE.lastSeq); STATE.lastSeq = G.seq;
  if (STATE.mode !== 'play') return;
  for (const e of evs) {
    const mine = e.pi === ME, other = e.pi >= 0 && e.pi !== ME;
    switch (e.k) {
      case 'buy': if (mine) { sfx('buy'); popMoney(e.id, '-' + fmtM(e.amt), '#ffd27a'); } else { toast(e.txt, ''); popMoney(e.id, '被抢走了', '#ffffff'); if (STATE.sel === e.id) sfx('err'); } break;
      case 'sell': if (mine) { sfx(e.amt >= 0 ? 'sell' : 'loss', e.amt > 50); popMoney(e.id, (e.amt >= 0 ? '+' : '') + fmtM(e.amt), e.amt >= 0 ? '#ff7a6e' : '#4fe09a'); } else if (other) toast(e.txt, ''); break;
      case 'demo': if (mine) { sfx('sell', true); popMoney(e.id, '拆迁 +' + fmtM(e.amt), '#ffd27a'); } toast(e.txt, 'gold'); break;
      case 'forced': if (mine) { sfx('bad'); toast(e.txt, 'bad'); } else toast(e.txt, ''); break;
      case 'reno': if (mine) sfx('reno'); break;
      case 'renodone': if (mine) { toast(e.txt, 'good'); sfx('good'); } break;
      case 'inspect': if (mine) sfx('insp'); break;
      case 'repay': if (mine) { sfx('good'); toast(e.txt, ''); } break;
      case 'bankrupt': toast(e.txt, 'bad'); sfx('bad'); break;
      case 'build': if (onScreen(e.id)) sfx('build'); break;
      case 'demolish': if (onScreen(e.id)) sfx('demolish'); break;
      case 'built': popMoney(e.id, '新楼盘', '#ffe9a8'); break;
      case 'news': toast(e.txt, e.amt > 0 ? 'good' : e.amt < 0 ? 'bad' : ''); sfx('news'); break;
    }
  }
}
function onScreen(id) { const p = G.props[id]; if (!p) return false; const s = w2s(...iso(p.x + p.w / 2, p.y + p.h / 2, 10)); return s[0] > 0 && s[0] < VW && s[1] > 0 && s[1] < VH; }

function ownerName(o) { return o < 0 ? '业主' : o === ME ? '你' : G.pl[o].name; }

/* ---------- selection ---------- */
function selectProp(id, focus) {
  if (id === STATE.sel && !focus) id = -1;
  if (id >= 0 && G.props[id] && G.props[id].gone) id = -1;
  STATE.sel = id; STATE.detail = false; RND.hiD = -1;
  if (id >= 0) { sfx('sel'); if (focus) { const p = G.props[id]; focusTile(p.x + p.w / 2, p.y + p.h / 2, Math.max(CAM.z, innerWidth <= 760 || PHONE.matches ? 0.8 : 0.95)); } }
  QC.key = ''; renderHUD(true);
}
$('tGoal').onclick = () => selectProp(G.mansion, true);
$('mineBtn').onclick = () => {
  const mine = ownedBy(ME).sort((a, b) => a.id - b.id);
  if (!mine.length) { toast('你还没有房子。点地图上标着' + (easyHints() ? '「超值」「划算」' : '负百分比') + '的房子买一套', ''); return; }
  STATE.myIdx = (STATE.myIdx + (mine.some(p => p.id === STATE.sel) ? 1 : 0)) % mine.length;
  selectProp(mine[STATE.myIdx].id, true);
};

/* ---------- quick card next to the selected house (updated in place, so taps never get lost) ---------- */
const QC = { key: '' };
function qcModel(p) {
  const me = G.pl[ME];
  if (p.gone || p.stage === 'demo') return { mode: 'none', p: '已拆除', s: '', b: null };
  if (p.stage === 'build') return { mode: 'build', p: '施工中', s: Math.ceil(BAL.buildT - p.bt) + ' 秒后开盘', b: null };
  if (p.kind === 'mansion' && p.owner === -1) {
    const need = mansionPrice() * (1 + buyFee()), can = me.cash >= need && me.alive;
    return { mode: 'man', p: fmtM(need), pc: 'gold', s: can ? '现金够了，买下就赢！' : '现金还差 ' + fmtM(need - me.cash), b: { t: can ? '买下豪宅' : '钱还不够', cls: 'primary', dis: !can, q: 'buy' } };
  }
  if (p.list && p.owner === -1) {
    const L = p.list, d = dealOf(p, ME), full = buyCost(L.ask, false), dp = buyCost(L.ask, true);
    const useLoan = OP('loan') && me.cash < full && me.cash >= dp, can = me.alive && (me.cash >= full || useLoan), chip = dealChip(p);
    return { mode: 'list', p: fmtM(L.ask), chip, s: '市场价 ' + fmtM(refVal(p, ME)) + ' · 还剩 ' + Math.ceil(L.left) + ' 秒', b: { t: can ? (useLoan ? '贷款买，先付 ' + fmtM(dp) : '买下') : '钱不够', cls: d.k === 'high' ? '' : 'primary', dis: !can, q: 'buy', loan: useLoan } };
  }
  if (p.owner === ME && p.owner >= 0) {
    const prof = p.offer * (1 - sellFee()) - p.paid;
    if (p.reno) return { mode: 'reno', p: '装修中', s: '还要 ' + Math.ceil(p.reno) + ' 秒', b: null };
    if (!canSell(p)) return { mode: 'hold', p: (prof >= 0 ? '赚 ' : '亏 ') + fmtM(Math.abs(prof)), pc: udc(prof), s: '过户中，' + Math.ceil(BAL.hold - (G.t - p.boughtT)) + ' 秒后能卖', b: { t: '过户中…', cls: 'ghost', dis: true, q: 'sell' } };
    const a = sellAdvice(p);
    return { mode: 'mine', p: (prof >= 0 ? '赚 ' : '亏 ') + fmtM(Math.abs(prof)), pc: udc(prof), chip: p.hotT > 0 ? ['抢手', '#f5c451', '#1d1406'] : null, s: p.hotT > 0 ? '有人抢着要，出价特别高！' : easyHints() ? a.n : '买价 ' + fmtM(p.paid) + ' · 有人出 ' + fmtM(p.offer), b: { t: '卖 ' + fmtM(p.offer), cls: prof >= 0 ? 'red' : 'green', dis: false, q: 'sell' } };
  }
  if (p.owner >= 0) return { mode: 'other', p: fmtM(val(p)), s: esc(G.pl[p.owner].name) + '的房', b: null };
  return { mode: 'idle', p: fmtM(val(p)), s: p.cool > 0 ? '刚成交，业主暂时不卖' : '业主现在不卖，过一阵可能挂出来', b: null };
}
function renderQC() {
  const el = $('qc'), id = STATE.sel;
  if (id < 0 || STATE.detail || STATE.mode !== 'play' || !G.props[id]) { el.classList.add('hidden'); QC.key = ''; return; }
  const p = G.props[id], m = qcModel(p), key = id + ':' + m.mode + ':' + !!m.b;
  if (key !== QC.key) {
    QC.key = key;
    el.innerHTML = '<div class="qh"><b>' + esc(p.kind === 'mansion' ? '山顶豪宅' : propName(p)) + '</b><span class="sub">' + KINDS[p.kind].n + ' · ' + DISTS[p.d].n + '</span><button class="x ghost" data-q="close">✕</button></div>' +
      '<div class="qp"><span id="qcP"></span><span id="qcC" class="deal"></span></div><div class="qs" id="qcS"></div>' +
      (m.b ? '<button class="qb" id="qcB"></button>' : '') + (m.mode === 'none' ? '' : '<button class="ghost qd" data-q="more">详情 ›</button>');
  }
  el.classList.remove('hidden');
  $('qcP').textContent = m.p; $('qcP').className = m.pc || '';
  const c = $('qcC'); if (m.chip) { c.textContent = m.chip[0]; c.style.background = m.chip[1]; c.style.color = m.chip[2]; c.hidden = false; } else c.hidden = true;
  $('qcS').innerHTML = m.s;
  if (m.b) {
    const b = $('qcB'); b.textContent = m.b.t; b.disabled = m.b.dis; b.dataset.q = m.b.q; b.dataset.loan = m.b.loan ? 1 : '';
    b.className = 'qb ' + m.b.cls + (RND.ring === id && !m.b.dis ? ' pulse' : '');
  }
  placeQC();
}
function placeQC() {
  const el = $('qc'); if (el.classList.contains('hidden') || STATE.sel < 0) return;
  if (innerWidth <= 760 || PHONE.matches) { el.style.left = el.style.top = ''; return; }
  const p = G.props[STATE.sel], s = w2s(...iso(p.x + p.w / 2, p.y + p.h / 2, propTopZ(p))), w = el.offsetWidth, hh = el.offsetHeight;
  let x = s[0] + 40, y = s[1] - hh / 2;
  if (x + w > VW - 12) x = s[0] - 40 - w;
  x = clamp(x, 12, VW - w - 12); y = clamp(y, 76, VH - hh - 76);
  el.style.left = x + 'px'; el.style.top = y + 'px';
}
$('qc').addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b || b.disabled) return;
  const id = STATE.sel, q = b.dataset.q;
  if (q === 'close') selectProp(-1);
  else if (q === 'more') { STATE.detail = true; sfx('click'); renderHUD(true); }
  else if (q === 'buy') { if (G.props[id].kind === 'mansion') askConfirm('用现金 <b class="gold">' + fmtM(mansionPrice() * (1 + buyFee())) + '</b> 买下山顶豪宅？', '买下！', () => act('buy', { id, loan: false })); else act('buy', { id, loan: !!b.dataset.loan }); }
  else if (q === 'sell') act('sell', { id });
});

/* ---------- top bar & bottom controls ---------- */
const MOOD = () => { const h = heat(); return h > 0.03 ? ['楼市火热', 'up'] : h > 0.008 ? ['楼市回暖', 'up'] : h < -0.03 ? ['楼市冰冷', 'down'] : h < -0.008 ? ['楼市降温', 'down'] : ['楼市平稳', '']; };
let hudT = 0, detT = 0;
function renderHUD(force) {
  if (!G || STATE.mode !== 'play' && STATE.mode !== 'end') return;
  const me = G.pl[ME], mp = mansionPrice(), need = mp * (1 + buyFee());
  $('tClock').textContent = clock(G.t) + ' / ' + clock(BAL.limit);
  const md = MOOD(); $('tMood').textContent = md[0]; $('tMood').className = md[1];
  $('tCash').textContent = fmtM(me.cash); $('tCash').className = me.cash < 0 ? 'down' : '';
  $('tNet').textContent = fmtM(netWorth(ME));
  $('tGoalP').textContent = fmtM(need);
  $('tGoalL').textContent = me.cash >= need ? '山顶豪宅 · 现金够了，点这里买！' : '山顶豪宅 · 现金还差 ' + fmtM(need - me.cash);
  $('tGoal').classList.toggle('ready', me.cash >= need && mansionP().owner === -1);
  const bars = $('tBars'); if (bars.children.length !== G.pl.length) bars.innerHTML = G.pl.map(pl => '<div class="bar" title="' + esc(pl.name) + '"><i class="p' + pl.i + '"></i></div>').join('');
  G.pl.forEach((pl, k) => { bars.children[k].firstChild.style.width = (pl.alive ? clamp(netWorth(pl.i) / need, 0, 1) * 100 : 0).toFixed(1) + '%'; });
  const mine = ownedBy(ME); $('mineN').textContent = mine.length;
  const solo = NETROLE === 'solo';
  $('speed').classList.toggle('hidden', !solo);
  if (solo) for (const b of $('speed').children) { const s = +b.dataset.s; b.classList.toggle('sel', s === 0 ? STATE.paused : !STATE.paused && STATE.speed === s); if (s === 0) b.textContent = STATE.paused ? '继续' : '暂停'; }
  $('pausedTag').classList.toggle('hidden', !(solo && (STATE.paused || TUT.pause)));
  $('pausedTag').textContent = TUT.pause ? '引导中，时间暂停' : '已暂停';
  renderQC();
  if (force || (detT -= 1) <= 0) { detT = 10; if (!$('detail').matches(':hover')) renderDetail(); }
  tutCheck();
}
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
  c.fillStyle = 'rgba(255,255,255,.4)'; c.textAlign = 'left'; c.fillText(opt.from || '', L, h - 6); c.textAlign = 'right'; c.fillText(opt.to || '现在', w - R, h - 6);
}

function renderDetail() {
  const el = $('detail'), id = STATE.sel;
  if (id < 0 || !G.props[id] || !STATE.detail) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const p = G.props[id], K = KINDS[p.kind], D = DISTS[p.d], v = val(p), me = G.pl[ME], man = p.kind === 'mansion';
  const listed = p.list && p.owner === -1, mine = p.owner === ME;
  let h = '<h2><span class="sw" style="background:' + D.col + ';width:12px;height:12px"></span>' + esc(propName(p)) + '<button class="x ghost" id="dBack">‹ 收起</button></h2>';
  h += '<div class="meta">' + K.n + ' · ' + D.n + ' · ' + (man ? '庄园' : COND[p.cond].n) + (p.owner >= 0 ? ' · <b style="color:' + PCOL[p.owner] + '">' + esc(ownerName(p.owner)) + '的房</b>' : '') + (p.demo ? ' · <span class="tagx rumor">拆迁传闻</span>' : '') + '</div>';
  const lines = [];
  let body = '';
  if (man) {
    const need = p.list ? p.list.ask * (1 + buyFee()) : v;
    body += '<div class="kv"><span>售价</span><span class="big gold">' + fmtM(p.list ? p.list.ask : v) + '</span><span>你的现金</span><span>' + fmtM(me.cash) + '</span><span>你的总身家</span><span>' + fmtM(netWorth(ME)) + '</span></div>';
    if (p.owner >= 0) body += '<div class="note good">' + esc(ownerName(p.owner)) + ' 已经买下了终极豪宅。</div>';
    else {
      body += '<div class="note">终极目标：用<b>现金一次付清</b>买下就赢' + (G.pl.length > 1 ? '，谁先买下谁赢' : '') + '。房子也算钱，但要先卖掉换成现金。豪宅的价格也会跟着楼市涨跌。</div>';
      body += '<div class="acts"><button id="dBuyMan" class="primary"' + (me.cash >= need && me.alive ? '' : ' disabled') + '>买下豪宅 ' + fmtM(need) + '<small>' + (me.cash >= need ? '现在就能买！' : '现金还差 ' + fmtM(need - me.cash)) + '</small></button></div>';
    }
  } else if (p.stage === 'build') {
    body += '<div class="note">开发商正在盖' + K.n + '，' + Math.ceil(BAL.buildT - p.bt) + ' 秒后作为新楼盘开卖。新楼盘有时会打折开盘。</div>';
  } else if (listed && p.kind !== 'mansion') {
    const L = p.list, d = dealOf(p, ME), ref = refVal(p, ME), est = OP('insp') && !knows(p, ME);
    const pc = Math.abs(d.r - 1) * 100;
    body += '<div class="verdict ' + d.k + '">' + (easyHints() ? d.n : dealChip(p)[0]) + '<small>' + (d.r < 0.995 ? '比市场价便宜 ' + pc.toFixed(0) + '%' : d.r > 1.005 ? '比市场价贵 ' + pc.toFixed(0) + '%' : '和市场价差不多') + '</small></div>';
    body += '<div class="kv"><span>售价</span><span class="big">' + fmtM(L.ask) + '</span>';
    body += '<span>' + (knows(p, ME) ? '真实市场价（已验房）' : est ? '市场价（中介估的）' : '市场价') + '</span><span>' + fmtM(ref) + '</span>';
    body += '<span>还挂多久</span><span>' + Math.ceil(L.left) + ' 秒' + (L.cut ? '（降过价）' : '') + '</span></div>';
    body += '<div class="note ' + (d.k === 'great' || d.k === 'good' ? 'good' : d.k === 'high' ? 'warn' : '') + '">' +
      (d.k === 'great' ? '很便宜！买下来，等房价涨一点再卖，大概率能赚。' : d.k === 'good' ? '比较便宜，买下来等一会儿，卖掉一般能赚。' : d.k === 'fair' ? '价格正常。买了要等房价涨起来才能赚，不急的话可以等更便宜的。' : '太贵了，买了很可能亏，不建议。') +
      (L.tag === 'hot' ? '业主急着用钱。' : L.tag === 'new' ? '刚盖好的新楼盘。' : '') + '</div>';
    if (est) body += '<div class="sub" style="font-size:12px">中介估的市场价可能差 10% 左右，花一点钱验房就知道准不准。</div>';
    if (knows(p, ME)) { const [qn] = QUAL(p.q); body += '<div class="note insp">验房结果：房屋质量' + qn + '，真实市场价 ' + fmtM(v) + '。</div>'; }
    lines.push({ v: L.ask, col: '#ffd27a', n: '售价' });
    const fc = buyCost(L.ask, false), lc = buyCost(L.ask, true), can = me.cash >= fc && me.alive;
    body += '<div class="acts">';
    if (OP('insp') && !knows(p, ME)) body += '<button id="dInsp">验房 ' + fmtM(inspCost(p)) + '<small>看真实市场价</small></button>';
    body += '<div class="row"><button id="dBuy" class="primary"' + (can ? '' : ' disabled') + '>买下 ' + fmtM(fc) + '<small>' + (can ? (OP('fee') ? '含 2% 手续费' : '用现金付') : '现金还差 ' + fmtM(fc - me.cash)) + '</small></button>';
    if (OP('loan')) body += '<button id="dLoan" class="primary"' + (me.cash >= lc && me.alive ? '' : ' disabled') + '>贷款买<small>先付 ' + fmtM(lc) + '</small></button>';
    body += '</div>';
    if (OP('loan')) body += '<div class="sub" style="font-size:12px">贷款买：先付三成，剩下 ' + fmtM(L.ask * (1 - BAL.down)) + ' 向银行借，每分钟付利息约 ' + fmtM(L.ask * (1 - BAL.down) * G.rate * 60 / MON) + '，卖房时自动还清。现金变成负数，银行会低价卖掉你的房。</div>';
    if (OP('rent')) body += '<div class="sub" style="font-size:12px">拿着这套房，每分钟能收租约 ' + fmtM(v * BAL.rent * 60 / MON) + '，交物业费约 ' + fmtM(v * BAL.upkeep * 60 / MON) + '。</div>';
    body += '</div>';
  } else if (mine) {
    const a = sellAdvice(p), net = sellNet(p), prof = p.offer * (1 - sellFee()) - p.paid;
    body += '<div class="verdict ' + (a.k === 'sell' ? 'great' : a.k === 'ok' ? 'good' : 'fair') + '">' + (easyHints() || a.k === 'wait' ? a.n : prof >= 0 ? '赚钱中' : '亏钱中') + '<small>' + (p.reno ? '还要 ' + Math.ceil(p.reno) + ' 秒' : !canSell(p) ? '' : (prof >= 0 ? '现在卖能赚 ' : '现在卖会亏 ') + fmtM(Math.abs(prof))) + '</small></div>';
    body += '<div class="kv"><span>买的时候花了</span><span>' + fmtM(p.paid) + '</span>';
    body += '<span>市场价</span><span>' + fmtM(v) + '</span>';
    body += '<span>现在有人出价</span><span class="big ' + udc(p.offer - p.paid) + '">' + (p.reno ? '—' : fmtM(p.offer)) + '</span>';
    if (p.loan) body += '<span>欠银行</span><span>' + fmtM(p.loan) + '</span>';
    if (!p.reno && (OP('fee') || p.loan)) body += '<span>卖掉到手</span><span>' + fmtM(net) + '</span>';
    const PM = 60 / MON;
    if (OP('rent')) body += '<span>每分钟</span><span>租 ' + fmtM(p.reno ? 0 : v * BAL.rent * PM, 1) + ' · 物业 ' + fmtM(-v * BAL.upkeep * PM) + (p.loan ? ' · 利息 ' + fmtM(-p.loan * G.rate * PM) : '') + '</span>';
    else if (p.loan) body += '<span>每分钟利息</span><span>' + fmtM(-p.loan * G.rate * PM) + '</span>';
    body += '</div>';
    if (!canSell(p) && !p.reno) body += '<div class="note">刚买下，过户要几秒钟，之后就能卖。买家出价一直在变。</div>';
    else if (!p.reno) body += '<div class="note ' + (a.k === 'sell' ? 'good' : '') + '">' + (p.offerHot ? '有买家特别想要这套，出价比平时高，好机会！' : a.k === 'sell' ? '赚钱了，可以卖掉换成现金，再去买下一套便宜的。' : a.k === 'ok' ? '小赚一点。可以卖，也可以等出价再涨涨。' : '现在卖会亏。买家出价一直在变，等它涨回来再卖。') + '</div>';
    else body += '<div class="note insp">装修中，还要 ' + Math.ceil(p.reno) + ' 秒，完工后变成' + COND[p.renoTo].n + '，更值钱。装修期间不能卖' + (OP('rent') ? '、没有房租' : '') + '。</div>';
    lines.push({ v: p.paid, col: PCOL[ME], n: '买价' });
    body += '<div class="acts">';
    const fresh = !canSell(p);
    body += '<button id="dSell" class="' + (prof >= 0 ? 'red' : 'green') + '"' + (p.reno || fresh || !me.alive ? ' disabled' : '') + '>' + (fresh ? '过户中…' : '卖掉，拿 ' + fmtM(net)) + '<small>' + (fresh ? '刚买的房要等几秒' : (prof >= 0 ? '赚 ' : '亏 ') + fmtM(Math.abs(prof)) + (OP('fee') ? '（已扣 3% 手续费）' : '')) + '</small></button>';
    const R = OP('reno') ? renoInfo(p) : null;
    if (R && !p.reno) body += '<button id="dReno"' + (me.cash >= R.cost ? '' : ' disabled') + '>装修成' + COND[p.cond + 1].n + ' ' + fmtM(R.cost) + '<small>要 ' + R.t + ' 秒，房子能多值约 ' + fmtM(R.gain) + '</small></button>';
    if (OP('loan') && p.loan > 0) body += '<button id="dRepay" class="ghost"' + (me.cash >= p.loan ? '' : ' disabled') + '>提前还清贷款 ' + fmtM(p.loan) + '</button>';
    body += '</div>';
  } else {
    body += '<div class="kv"><span>市场价</span><span class="big">' + (OP('insp') && p.owner < 0 ? '约 ' + fmtM(Math.round(v / 5) * 5) : fmtM(v)) + '</span></div>';
    body += '<div class="note">' + (p.owner >= 0 ? esc(ownerName(p.owner)) + ' 的房，买不了。' : p.cool ? '刚卖出去不久，业主暂时不卖。' : '业主现在不卖，以后可能会挂出来。') + '</div>';
    body += '<div class="sub" style="font-size:12px">' + D.n + '：' + D.hint + '</div>';
  }
  el.innerHTML = h + '<canvas id="dChart"></canvas><div class="sub" style="font-size:11.5px;margin-top:-4px">蓝线：这套房的市场价，最近 ' + Math.round(p.hist.length * BAL.histDt / 6) / 10 + ' 分钟</div>' + body;
  const hist = p.hist.slice();
  bigChart($('dChart'), [{ data: hist, col: '#8fd0ff', fill: 'rgba(143,208,255,.25)' }], { lines, from: Math.round(hist.length * BAL.histDt) + ' 秒前' });
  const on = (i, f) => { const b = $(i); if (b) b.onclick = f; };
  on('dBack', () => { STATE.detail = false; renderHUD(true); });
  on('dInsp', () => act('inspect', { id }));
  on('dBuy', () => act('buy', { id, loan: false }));
  on('dLoan', () => act('buy', { id, loan: true }));
  on('dSell', () => act('sell', { id }));
  on('dReno', () => act('reno', { id }));
  on('dRepay', () => act('repay', { id }));
  on('dBuyMan', () => askConfirm('用现金 <b class="gold">' + fmtM(p.list.ask * (1 + buyFee())) + '</b> 买下终极豪宅？', '买下！', () => act('buy', { id, loan: false })));
}

/* ---------- beginner guide (solo): time is frozen until the first purchase ---------- */
const TUT = { step: -1, pause: false, focused: -1 };
function tutStart(force) {
  if (NETROLE !== 'solo' || (!force && LS.get('tutDone', false))) { TUT.step = -1; TUT.pause = false; RND.ring = -1; tutRender(); return; }
  TUT.step = ownedBy(ME).length ? 1 : 0; TUT.pause = TUT.step === 0; TUT.focused = -1; tutRender();
}
function tutEnd() { TUT.step = -1; TUT.pause = false; RND.ring = -1; LS.set('tutDone', true); tutRender(); renderHUD(true); }
function tutTarget() {
  const me = G.pl[ME];
  const ls = G.props.filter(p => p.list && p.owner === -1 && p.kind !== 'mansion' && !p.stage && me.cash >= buyCost(p.list.ask, false)).sort((a, b) => dealOf(a, ME).r - dealOf(b, ME).r);
  return ls.length ? ls[0].id : -1;
}
function tutCheck() {
  if (TUT.step < 0 || !G || G.over || STATE.mode !== 'play') { RND.ring = -1; tutRender(); return; }
  const me = G.pl[ME], mine = ownedBy(ME);
  if (TUT.step === 0 && mine.length) { TUT.step = 1; TUT.pause = false; }
  if (TUT.step === 1 && me.st.sells > 0) TUT.step = 2;
  if (TUT.step === 0) {
    const keep = RND.ring >= 0 && G.props[RND.ring].list && G.props[RND.ring].owner === -1, t = keep ? RND.ring : tutTarget();
    if (t !== RND.ring || TUT.focused !== t) { RND.ring = t; TUT.focused = t; if (t >= 0 && STATE.sel !== t) { const p = G.props[t]; focusTile(p.x + p.w / 2, p.y + p.h / 2, Math.max(CAM.z, innerWidth <= 760 || PHONE.matches ? 0.8 : 0.9)); } }
  }
  else if (TUT.step === 1) RND.ring = mine.length ? mine.sort((a, b) => (b.offer - b.paid) - (a.offer - a.paid))[0].id : -1;
  else RND.ring = -1;
  tutRender();
}
function tutRender() {
  const c = $('coach'); if (!c) return;
  if (TUT.step < 0 || STATE.mode !== 'play') { c.classList.add('hidden'); return; }
  c.classList.remove('hidden');
  $('coachOk').classList.toggle('hidden', TUT.step !== 2); $('coachSkip').classList.toggle('hidden', TUT.step === 2);
  const cheap = easyHints() ? '标着 <span class="deal great">超值</span> 或 <span class="deal good">划算</span>' : '标着金色、绿色<b>负百分比</b>（比市场价便宜）';
  let txt = '';
  if (TUT.step === 0) txt = STATE.sel === RND.ring && RND.ring >= 0 ? '这套比市场价便宜。点<b>「买下」</b>，时间就开始走。' : '<b>目标：攒钱买下山顶豪宅。</b><br>地图上' + cheap + '的房子便宜。点有箭头的那套。';
  else if (TUT.step === 1) {
    const p = RND.ring >= 0 ? G.props[RND.ring] : null, prof = p ? p.offer * (1 - sellFee()) - p.paid : 0;
    if (p && canSell(p) && prof > 0) txt = STATE.sel === p.id ? '现在卖是赚的，点<b>「卖」</b>！' : '你的房现在卖是<b>赚</b>的！点它，再点「卖」。';
    else txt = '时间开始走了。你的房子上写着<b>现在卖能赚多少</b>，数字一直在变。等它变成红色「赚」再卖。';
  } else txt = '赚到第一笔了！就这样<b>便宜买、涨了卖</b>。顶上进度条满了，就去山顶买豪宅。时间不等人，房子也会被别人抢走。';
  $('coachT').innerHTML = txt;
}

/* ---------- end screen ---------- */
function showEnd() {
  if (STATE.mode === 'end' || !G.over) return;
  STATE.mode = 'end'; selectProp(-1);
  const o = G.over, w = o.winner, me = G.pl[ME];
  const won = w === ME;
  let title, sub;
  if (o.reason === 'mansion') { title = won ? '豪宅到手！' : esc(G.pl[w].name) + ' 赢了'; sub = (won ? '你' : esc(G.pl[w].name)) + '用了 ' + clock(o.t) + ' 买下山顶豪宅'; }
  else if (o.reason === 'time') { title = w < 0 ? '时间到' : won ? '你赢了' : esc(G.pl[w].name) + ' 赢了'; sub = clock(BAL.limit) + ' 到了，' + (w < 0 ? '还没买下豪宅' : '按总身家排名'); }
  else { title = '破产了'; sub = w >= 0 ? esc(G.pl[w].name) + ' 笑到了最后' : '资不抵债'; }
  if (won && o.reason === 'mansion' && NETROLE === 'solo' && G.bestKey) { const b = LS.get(G.bestKey, null); if (!b || o.t < b) { LS.set(G.bestKey, o.t); sub += '，新纪录！'; } else sub += '（纪录 ' + clock(b) + '）'; }
  sub += ' · ' + DIFF[G.diff || 'normal'].n + ' · 玩法：' + presetName(G.preset || (OPTS.every(x => G.opt[x.k]) ? 'full' : OPTS.every(x => !G.opt[x.k]) ? 'pure' : 'custom'), G.opt);
  $('eTitle').textContent = title.replace(/&amp;/g, '&'); $('eSub').innerHTML = sub;
  const rank = G.pl.slice().sort((a, b) => (b.i === w) - (a.i === w) || netWorth(b.i) - netWorth(a.i));
  $('eRank').innerHTML = rank.map((pl, k) => '<div><span class="sw" style="background:' + PCOL[pl.i] + ';width:12px;height:12px"></span><b>' + (k + 1) + '. ' + esc(pl.name) + (pl.alive ? '' : '（破产）') + '</b><span>总身家 ' + fmtM(pl.alive ? netWorth(pl.i) : 0) + '</span><span class="sub" style="font-size:13px">买 ' + pl.st.buys + ' 卖 ' + pl.st.sells + ' · 最赚一笔 ' + fmtM(pl.st.best) + '</span></div>').join('');
  showScreen('endScr');
  bigChart($('endChart'), G.pl.map(pl => ({ data: pl.wh, col: PCOL[pl.i] })), { lines: [{ v: mansionPrice(), col: '#f5c451', n: '豪宅' }], from: '0:00' });
  $('eAgain').textContent = NETROLE === 'solo' ? '再来一局' : NETROLE === 'host' && linkUp() ? '再来一局' : NETROLE === 'guest' ? '等房主开新局' : '返回标题';
  $('eAgain').disabled = NETROLE === 'guest';
  sfx(won ? 'win' : 'lose');
  saveGame();
}
