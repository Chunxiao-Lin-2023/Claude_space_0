/* ================= DOM UI: screens, HUD, panels ================= */
const $ = id => document.getElementById(id);
const UI = { hudT: 0, toastT: 0, bannerT: 0, resPrev: {} };
function showScreen(s) {
  for (const id of ['title', 'lobby']) $(id).classList.toggle('hidden', id !== s);
  $('hud').classList.toggle('hidden', s !== 'play');
  $('hubBtn').classList.toggle('hidden', !HUB || s !== 'title');
  if (s !== 'play') { for (const id of ['craft', 'pause', 'over']) $(id).classList.add('hidden'); }
  if (s === 'title') { STATE.mode = 'title'; renderBest(); }
  if (s === 'lobby') STATE.mode = 'lobby';
}
function titleStatus(t) { $('tStatus').textContent = t || ''; }
function renderBest() { const b = lsGet('best', 0); $('bestTxt').textContent = b ? '最佳纪录：撑过 ' + b + ' 夜' : ''; }
function confirmBtn(el, fn) {
  const label = el.textContent;
  el.addEventListener('click', () => {
    if (el.dataset.arm === '1') { el.dataset.arm = ''; el.textContent = label; fn(); return; }
    el.dataset.arm = '1'; el.textContent = '再点一次确认';
    clearTimeout(el._t); el._t = setTimeout(() => { el.dataset.arm = ''; el.textContent = label; }, 3000);
  });
}
function diffButtons(seg, cb) {
  seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.diff = b.dataset.d; saveSet(); markDiff(); cb && cb(); sfx('click'); }));
}
function markDiff() { for (const seg of [$('diffSeg'), $('lDiffSeg')]) seg.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.d === (NETROLE === 'guest' ? NET.diff : SET.diff))); }
/* lobby */
function lobbyUI(status) {
  if (status != null) $('lStatus').textContent = status;
  if (STATE.mode !== 'lobby') return;
  const host = NETROLE === 'host';
  $('lCode').textContent = NET.code || '····';
  $('lP0').textContent = host ? (SET.name || '房主') : (NET.hostName || '房主');
  $('lP1').textContent = host ? (NET.guestName || '等待加入…') : (SET.name || '你');
  $('lP1s').textContent = (host ? NET.guestName : true) ? (NET.ready ? '已准备' : '未准备') : '队友 · 青色';
  $('lReady').classList.toggle('hidden', host); $('lReady').textContent = NET.ready ? '取消准备' : '准备';
  $('lStart').classList.toggle('hidden', !host); $('lStart').disabled = !(host && NET.guestName && NET.ready);
  $('lDiffSeg').querySelectorAll('button').forEach(b => b.disabled = !host);
  $('lDiffNote').textContent = host ? '' : '（房主决定）';
  markDiff();
  if (host && !NET.guestName && !$('lStatus').textContent) $('lStatus').textContent = '把房间码发给队友';
}
function backToLobby() {
  STATE.mode = 'lobby'; W = null; showScreen('lobby'); NET.ready = false; lobbyUI('');
  if (NETROLE === 'host') sendLobby();
}
/* messages */
function uiMsg(t, col) {
  const d = document.createElement('div'); d.textContent = t; if (col) d.style.color = col;
  const L = $('log'); L.appendChild(d); while (L.children.length > 5) L.firstChild.remove();
  setTimeout(() => d.remove(), 6200);
}
function toast(t, col) { const el = $('toast'); el.textContent = t; el.style.color = col || ''; el.classList.add('show'); UI.toastT = 1.6; }
function banner(t, s, col) { $('bnT').textContent = t; $('bnT').style.color = col || ''; $('bnS').textContent = s || ''; $('banner').classList.add('show'); UI.bannerT = 3.2; }
function uiMute() { $('muteBtn').textContent = SET.mute ? '🔇' : '🔊'; }
/* HUD */
function blockIcon(id) {
  const c = document.createElement('canvas'); c.width = 52; c.height = 52; const g = c.getContext('2d');
  if (RND.tex && RND.tex[id]) g.drawImage(RND.tex[id][0], 0, 0, 52, 52);
  return c;
}
function buildHudStatic() {
  $('resBox').innerHTML = RES.map(r => `<div id="res_${r.k}"><b style="color:${r.col}">0</b><small>${r.name}</small></div>`).join('');
  $('wbar').innerHTML = WPN.map((w, i) => `<button data-w="${i}"><span>${w.name}</span><small id="wb${i}"></small></button>`).join('');
  $('wbar').querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); if (inGame()) act('wpn', +b.dataset.w); }));
  const bb = $('bbar'); bb.innerHTML = '';
  PAL.forEach((id, n) => {
    const B = TF[id], b = document.createElement('button'); b.dataset.b = id;
    b.innerHTML = `<span class="k kbd">${(n + 1) % 10}</span>`; b.appendChild(blockIcon(id));
    const nm = document.createElement('span'); nm.textContent = B.name; b.appendChild(nm);
    const sm = document.createElement('small'); sm.textContent = costText(B.cost); b.appendChild(sm);
    b.addEventListener('pointerdown', e => { e.stopPropagation(); selBlock(id); });
    bb.appendChild(b);
  });
  const dm = document.createElement('button'); dm.id = 'bDemo'; dm.innerHTML = '<span style="font-size:20px">✕</span><span>拆除</span><small class="kbd">右键 / X</small>';
  dm.addEventListener('pointerdown', e => { e.stopPropagation(); const me = W.p[ME]; me.demo = !me.demo; uiBuildBar(); sfx('click'); }); bb.appendChild(dm);
  const ex = document.createElement('button'); ex.innerHTML = '<span style="font-size:18px">↩</span><span>退出</span><small class="kbd">B</small>';
  ex.addEventListener('pointerdown', e => { e.stopPropagation(); toggleBuild(false); }); bb.appendChild(ex);
}
function uiBuildBar() {
  if (!W) return; const me = W.p[ME];
  $('bbar').classList.toggle('hidden', !me.build); $('binfo').classList.toggle('hidden', !me.build);
  $('wbar').classList.toggle('hidden', !!me.build);
  $('bbar').querySelectorAll('button[data-b]').forEach(b => { const id = +b.dataset.b; b.classList.toggle('sel', !me.demo && me.sel === id); b.classList.toggle('na', !affordable(W.res, TF[id].cost)); });
  $('bDemo').classList.toggle('sel', !!me.demo);
  $('tBuild').classList.toggle('on', !!me.build); document.body.classList.toggle('building', !!me.build);
  const B = TF[me.sel];
  $('binfo').textContent = me.demo ? '拆除：点方块拆掉，退还一半材料（按血量折算）' : B.name + ' · ' + costText(B.cost) + ' · ' + B.tip + (B.hp ? ' · 耐久 ' + B.hp : '');
}
function hudTick(dt) {
  if (UI.toastT > 0 && (UI.toastT -= dt) <= 0) $('toast').classList.remove('show');
  if (UI.bannerT > 0 && (UI.bannerT -= dt) <= 0) $('banner').classList.remove('show');
  UI.hudT -= dt; if (UI.hudT > 0) return; UI.hudT = 0.1;
  const me = W.p[ME];
  // players
  $('pcards').innerHTML = W.p.map(p => {
    const st = p.gone ? '已离开' : p.dead ? '阵亡' : p.down ? '倒地 ' + Math.ceil(p.downT) + 's' : Math.ceil(p.hp);
    return `<div class="pbar p${p.i % 2}${p.i === ME ? '' : ' small'}"><div class="nm"><span>${p.name}${p.i === ME && W.p.length > 1 ? '（你）' : ''}</span><i>${st}</i></div><div class="bar"><i style="width:${p.dead || p.gone ? 0 : p.down ? 100 * p.downT / BAL.downTime : 100 * p.hp / p.maxHp}%;${p.down ? 'background:#7a2a24' : ''}"></i></div></div>`;
  }).join('');
  const wi = me.down ? 0 : me.wpn, w = WPN[wi];
  $('wName').textContent = me.build ? '建造中' : w.name;
  $('wMag').textContent = me.build ? '' : me.mag[wi];
  $('wRes').textContent = me.build ? '' : '/ ' + (w.inf ? '∞' : me.ammo[wi]);
  const rl = me.reloadT > 0 ? 1 - me.reloadT / WPN[me.reloadW != null ? me.reloadW : wi].reload : me.reloadVis > 0 ? 1 - me.reloadVis / w.reload : me.medT > 0 ? 1 - me.medT / (me.selfRev ? 3 : BAL.healTime) : 0;
  $('wRl').style.width = (rl * 100) + '%';
  $('iNade').textContent = me.nades; $('iMed').textContent = me.meds; $('iKill').textContent = me.kills;
  WPN.forEach((w2, i) => { const b = $('wbar').children[i]; b.classList.toggle('hidden', !me.owned[i]); b.classList.toggle('sel', i === me.wpn); $('wb' + i).textContent = w2.inf ? '∞' : me.mag[i] + '/' + me.ammo[i]; });
  // phase
  const ph = $('phase');
  if (W.phase === 'day') {
    const m = Math.max(0, Math.ceil(W.clock)); ph.className = '';
    ph.innerHTML = (W.night ? '第 ' + (W.night + 1) + ' 夜前' : '第一个白天') + `<span class="sub">${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} 后入夜</span>`;
  } else if (W.phase === 'night') {
    const left = W.zs.length + (NETROLE === 'guest' ? (W.spawnLeft || 0) : W.spawnQ.length);
    ph.className = isBlood(W.night) ? 'blood' : 'night';
    ph.innerHTML = '第 ' + W.night + ' 夜' + (isBlood(W.night) ? ' · 血月' : '') + `<span class="sub">剩余 ${left} 只 · ${W.night}/${BAL.nights}</span>`;
  } else ph.textContent = W.phase === 'win' ? '获救' : '失守';
  const rr = W.radio.hp / W.radio.max;
  $('rHp').style.width = clamp(rr, 0, 1) * 100 + '%'; $('rbar').classList.toggle('low', rr < 0.3); $('rTxt').textContent = Math.max(0, Math.ceil(W.radio.hp));
  const rb = $('readyBtn'); rb.classList.toggle('hidden', W.phase !== 'day');
  if (W.phase === 'day') { const n = activeP().filter(p => !p.dead && p.ready).length, tot = activeP().filter(p => !p.dead).length; rb.classList.toggle('on', me.ready); rb.innerHTML = (me.ready ? '已准备' : '准备入夜') + (tot > 1 ? ` ${n}/${tot}` : '') + ' <span class="kbd">(N)</span>'; }
  // resources
  for (const r of RES) { const el = $('res_' + r.k), v = W.res[r.k]; el.firstElementChild.textContent = v; if (UI.resPrev[r.k] != null && v > UI.resPrev[r.k]) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } UI.resPrev[r.k] = v; }
  // prompt
  let ptxt = '', prog = 0;
  if (!me.dead && !me.build) {
    const tgt = useTarget(me);
    const key = INP.touch ? '按住「交互」' : '按住 E ';
    if (tgt && tgt.k === 'rev') { ptxt = key + '扶起 ' + W.p[tgt.i].name; prog = me.useT / BAL.reviveTime; }
    else if (tgt) { ptxt = key + '搜索' + SPOTS[W.spots[tgt.i].k].name; prog = me.useT / BAL.searchTime; }
    else if (nearBench(me)) ptxt = (INP.touch ? '点「交互」' : '按 E ') + '打开工作台';
    if (me.down) ptxt = me.meds > 0 ? (INP.touch ? '点「医疗」' : '按 H ') + '用医疗包自救' : (W.p.length > 1 ? '等待队友来扶你…' : '');
    if (me.medT > 0 && me.selfRev) { ptxt = '正在自救…'; prog = 1 - me.medT / 3; }
  }
  $('prompt').classList.toggle('hidden', !ptxt); $('pTxt').textContent = ptxt; $('pPr').style.width = clamp(prog, 0, 1) * 100 + '%';
  $('prompt').querySelector('.pr').style.display = prog > 0 ? '' : 'none';
  if (me.build) uiBuildBar();
}
/* craft */
function openCraft() {
  if (!W || W.over) return; const me = W.p[ME];
  if (!nearBench(me)) { toast('要在电台旁的工作台才能制作'); return; }
  renderCraft(); $('craft').classList.remove('hidden'); sfx('click');
}
function closeCraft() { $('craft').classList.add('hidden'); }
function renderCraft() {
  const me = W.p[ME];
  $('clist').innerHTML = CRAFT.map(c => { const why = craftBlocked(me, c); return `<button class="ci${why ? ' no' : ''}" data-c="${c.id}" ${why && why !== '材料不足' ? 'disabled' : ''}><b>${c.name}</b><small>${c.desc || '&nbsp;'}</small><span class="c">${why && why !== '材料不足' ? why : costText(c.cost)}</span></button>`; }).join('');
  $('clist').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const c = CRAFT.find(c => c.id === b.dataset.c), why = craftBlocked(W.p[ME], c);
    if (why) { toast(why, '#ff8a7a'); sfx('deny'); return; }
    act('craft', c.id);
    if (NETROLE === 'guest') { for (const k in c.cost) W.res[k] -= c.cost[k]; if (c.wpn) { W.p[ME].owned[c.wpn] = 1; } }
    setTimeout(() => { if (!$('craft').classList.contains('hidden')) renderCraft(); }, NETROLE === 'guest' ? 250 : 0);
  }));
}
/* pause / help / over */
function togglePause(force) {
  if (STATE.mode !== 'play') return;
  const el = $('pause'), open = force != null ? force : el.classList.contains('hidden');
  if (!$('help').classList.contains('hidden')) { closeHelp(); return; }
  if (!$('craft').classList.contains('hidden')) { closeCraft(); return; }
  el.classList.toggle('hidden', !open);
  $('pauseT').textContent = NETROLE === 'solo' ? '暂停' : '菜单（游戏继续中）';
  $('pHub').classList.toggle('hidden', !HUB);
  STATE.paused = open && NETROLE === 'solo';
}
function openHelp() { $('help').classList.remove('hidden'); }
function closeHelp() { $('help').classList.add('hidden'); }
function showOver(e) {
  const el = $('over'); el.className = 'modal ' + e.v; el.classList.remove('hidden');
  $('oT').textContent = e.v === 'win' ? '获救！' : '失守';
  $('oWhy').textContent = e.why + (e.v === 'win' ? '，你们撑过了 ' + e.n + ' 夜' : '，倒在第 ' + e.n + ' 夜');
  const pk = (e.pk || []).map((k, i) => `<div>${W.p[i] ? W.p[i].name : ''} 击杀<b>${k}</b></div>`).join('');
  $('oStats').innerHTML = `<div>撑过<b>${e.v === 'win' ? e.n : Math.max(0, e.n - 1)} 夜</b></div><div>总击杀<b>${e.kills}</b></div>` + pk + `<div>建造方块<b>${W.stats ? W.stats.built : '—'}</b></div><div>最佳纪录<b>${lsGet('best', 0)} 夜</b></div>`;
  const solo = NETROLE === 'solo', host = NETROLE === 'host';
  $('oAgain').classList.toggle('hidden', !(solo || host)); $('oLobby').classList.toggle('hidden', !host);
  $('oEndless').classList.toggle('hidden', !(e.v === 'win' && (solo || host)));
  $('oHub').classList.toggle('hidden', !HUB);
  closeCraft(); $('pause').classList.add('hidden');
  if (W.p[ME].build) toggleBuild(false);
}
function initUI() {
  $('nameIn').value = SET.name || '';
  $('nameIn').addEventListener('input', () => { SET.name = $('nameIn').value.trim().slice(0, 10); saveSet(); });
  diffButtons($('diffSeg')); diffButtons($('lDiffSeg'), () => { if (NETROLE === 'host') sendLobby(); });
  markDiff();
  $('soloBtn').onclick = () => { audioInit(); netLeave(); NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0); };
  $('hostBtn').onclick = () => { audioInit(); netHost(); };
  $('joinBtn').onclick = () => { audioInit(); netJoin($('codeIn').value); };
  $('codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('joinBtn').click(); });
  $('helpBtn').onclick = openHelp; $('pHelp').onclick = openHelp; $('helpClose').onclick = closeHelp;
  $('hubBtn').onclick = () => { location.href = '../'; };
  $('lReady').onclick = () => { NET.ready = !NET.ready; netSendCtl({ t: 'ready', v: NET.ready }); lobbyUI(); sfx('ready'); };
  $('lStart').onclick = () => hostStart();
  $('lLeave').onclick = () => { netLeave(); showScreen('title'); };
  $('craftClose').onclick = closeCraft;
  $('resumeBtn').onclick = () => togglePause(false);
  confirmBtn($('pTitle'), () => { netLeave(); W = null; STATE.paused = false; showScreen('title'); });
  confirmBtn($('pHub'), () => { netLeave(); location.href = '../'; });
  $('pauseBtn').onclick = () => togglePause();
  $('muteBtn').onclick = () => { setMute(!SET.mute); uiMute(); };
  $('zoomBtn').onclick = () => { SET.zoom = SET.zoom === 2 ? 1 : 2; saveSet(); };
  $('readyBtn').onclick = () => inGame() && toggleReady();
  $('oAgain').onclick = () => { $('over').classList.add('hidden'); if (NETROLE === 'host') { if (!NET.gctl || !NET.gctl.open) { NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0); } else hostStart(); } else startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0); };
  $('oLobby').onclick = () => { netSendCtl({ t: 'toLobby' }); backToLobby(); };
  $('oEndless').onclick = () => { $('over').classList.add('hidden'); W.endless = true; W.over = null; W.phase = 'night'; dawn(); };
  $('oTitle').onclick = () => { netLeave(); W = null; showScreen('title'); };
  $('oHub').onclick = () => { netLeave(); location.href = '../'; };
  if (inArtifact()) { $('coopBox').classList.add('hidden'); $('artNote').classList.remove('hidden'); }
  uiMute(); renderBest();
}
