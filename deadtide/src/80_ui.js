/* ================= DOM UI: screens, HUD, panels ================= */
const $ = id => document.getElementById(id);
const UI = { hudT: 0, toastT: 0, bannerT: 0, resPrev: {} };
function showScreen(s) {
  for (const id of ['title', 'lobby']) $(id).classList.toggle('hidden', id !== s);
  $('hud').classList.toggle('hidden', s !== 'play');
  $('hubBtn').classList.toggle('hidden', !HUB || s !== 'title');
  if (s !== 'play') { for (const id of ['craft', 'pause', 'over']) $(id).classList.add('hidden'); }
  if (s === 'title' && typeof renderBest === 'function') renderBest();
  if (s === 'title') { STATE.mode = 'title'; renderBest(); }
  if (s === 'lobby') STATE.mode = 'lobby';
}
function titleStatus(t) { $('tStatus').textContent = t || ''; }
function renderBest() {
  const b = lsGet('best', 0); $('bestTxt').textContent = b ? '最佳纪录：撑过 ' + b + ' 夜' : '';
  const s = loadSave(), cb = $('contBtn'); cb.classList.toggle('hidden', !s); if (s) cb.innerHTML = '继续上次 <small style="opacity:.75;font-weight:400">' + saveLabel(s) + '</small>';
  $('soloBtn').textContent = s ? '新开一局（单人）' : '单人守夜'; $('soloBtn').classList.toggle('primary', !s);
}
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
// desktop: the keys you can press right now, greyed out when they'd do nothing, lit when they matter
function uiKeys(me) {
  const el = $('keys'); if (!el || INP.touch) return;
  const wi = me.down ? 0 : me.wpn, w = WPN[wi], st = c => c === 1 ? ' class="hot"' : c === 2 ? ' class="warn"' : c === -1 ? ' class="off"' : '';
  let rows;
  if (me.build) rows = [['左键', '盖（拖动一排）'], ['右键', '拆'], ['1–0', '选材料'], ['R', '转向'], ['X', '拆除模式', me.demo ? 1 : 0], ['Enter', '确认'], ['Esc', '取消'], ['B', '退出建造', 1]];
  else {
    const canRl = me.mag[wi] < w.mag && (w.inf || me.ammo[wi] > 0) && !(me.reloadT > 0), ut = useTarget(me), bench = nearBench(me);
    rows = [['左键', '射击'], ['R', '换弹', me.mag[wi] === 0 && canRl ? 2 : canRl ? 0 : -1], ['G', '手雷 ×' + me.nades, me.nades ? 0 : -1],
      ['H', me.down ? '自救' : '医疗 ×' + me.meds, !me.meds ? -1 : (me.down || me.hp < me.maxHp * 0.4) ? 2 : me.hp >= me.maxHp ? -1 : 0],
      ['V', '推开'], ['空格', '跳 / 翻越'], ['F', ut ? ut.name : '交互', ut ? 1 : 0], ['1–' + NW, '换枪'], ['C', '制作', bench ? 1 : -1], ['B', '建造']];
    if (W.phase === 'day') rows.push(['N', me.ready ? '取消准备' : '准备入夜', me.ready ? 1 : 0]);
  }
  rows.push(['Q E', '转镜头'], ['Esc', '菜单']);
  const key = (SET.keysOff ? 1 : 0) + rows.map(r => r.join(':')).join('|'); if (UI.keysK === key) return; UI.keysK = key;
  el.classList.toggle('min', !!SET.keysOff);
  el.innerHTML = `<div class="kh"><span>按键</span><span>${SET.keysOff ? '展开 ▾' : '收起 ▴'}</span></div><div class="kg">` + rows.map(([k, t, c]) => `<kbd${st(c)}>${k}</kbd><span${st(c)}>${t}</span>`).join('') + '</div>';
}
function toast(t, col) { const el = $('toast'); el.textContent = t; el.style.color = col || ''; el.classList.add('show'); UI.toastT = 1.6; }
function banner(t, s, col) { $('bnT').textContent = t; $('bnT').style.color = col || ''; $('bnS').textContent = s || ''; $('banner').classList.add('show'); UI.bannerT = 3.2; }
function uiMute() { $('muteBtn').textContent = SET.mute ? '🔇' : '🔊'; $('pMute').textContent = '声音：' + (SET.mute ? '关' : '开'); if ($('pQual') && typeof qualLabel === 'function') $('pQual').textContent = qualLabel(); }
/* HUD */
function blockIcon(id) {
  const c = document.createElement('canvas'); c.width = 52; c.height = 52; const g = c.getContext('2d'), col = B[id].col || '#888';
  const shade = k => { tmpC.set(col).multiplyScalar(k); return '#' + tmpC.getHexString(); };
  const poly = (pts, f) => { g.fillStyle = f; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
  const cube = (h) => { poly([[26, 6 + 30 - h], [46, 16 + 30 - h], [26, 26 + 30 - h], [6, 16 + 30 - h]], shade(1.15)); poly([[6, 46 - h], [26, 56 - h], [26, 56], [6, 46]].map(([x, y]) => [x, y - 6]), shade(0.8)); poly([[26, 56 - h], [46, 46 - h], [46, 46], [26, 56]].map(([x, y]) => [x, y - 6]), shade(0.6)); };
  if (B[id].slab) cube(6); else if (B[id].dep) { g.fillStyle = col; g.fillRect(22, 14, 8, 30); if (B[id].lamp) { g.fillStyle = '#ffe9a8'; g.fillRect(16, 8, 20, 9); } else { g.strokeStyle = col; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(14 + k * 12, 36, 7, 0, 7); g.stroke(); } } }
  else if (B[id].stairs) { for (let k = 0; k < 4; k++) { g.fillStyle = shade(1 - k * 0.08); g.fillRect(8 + k * 9, 40 - k * 9, 36 - k * 9, 9 + k * 9); } }
  else cube(28);
  if (id === 8) { g.fillStyle = 'rgba(0,0,0,.45)'; for (let k = 0; k < 3; k++) g.fillRect(14 + k * 9, 20, 3, 22); }
  if (id === 7) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(12, 22, 10, 20); }
  return c;
}
function buildHudStatic() {
  $('resBox').innerHTML = RES.map(r => `<div id="res_${r.k}"><b style="color:${r.col}">0</b><small>${r.name}</small></div>`).join('');
  $('wbar').innerHTML = WPN.map((w, i) => `<button data-w="${i}"><span><kbd>${i + 1}</kbd>${w.name}</span><small id="wb${i}"></small></button>`).join('');
  $('wbar').querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); if (inGame()) act('wpn', +b.dataset.w); }));
  const bb = $('bbar'); bb.innerHTML = '';
  PAL.forEach((id, n) => {
    const Bb = B[id], b = document.createElement('button'); b.dataset.b = id;
    b.innerHTML = `<span class="k kbd">${(n + 1) % 10}</span>`; b.appendChild(blockIcon(id));
    const nm = document.createElement('span'); nm.textContent = Bb.name; b.appendChild(nm);
    const sm = document.createElement('small'); sm.textContent = costText(Bb.cost); b.appendChild(sm);
    b.addEventListener('pointerdown', e => { e.stopPropagation(); selBlock(id); });
    bb.appendChild(b);
  });
  const dm = document.createElement('button'); dm.id = 'bDemo'; dm.innerHTML = '<span style="font-size:20px">✕</span><span>拆除</span><small class="kbd">右键 / X</small>';
  dm.addEventListener('pointerdown', e => { e.stopPropagation(); const me = W.p[ME]; me.demo = !me.demo; uiBuildBar(); sfx('click'); }); bb.appendChild(dm);
  const ro = document.createElement('button'); ro.id = 'bRot'; ro.innerHTML = '<span style="font-size:18px">↻</span><span>楼梯朝向</span><small class="kbd">R</small>';
  ro.addEventListener('pointerdown', e => { e.stopPropagation(); rotStairs(); }); bb.appendChild(ro);
  const cf = document.createElement('button'); cf.id = 'bConf'; cf.innerHTML = '<span style="font-size:16px">✓✓</span><span>二次确认</span><small></small>';
  cf.addEventListener('pointerdown', e => { e.stopPropagation(); SET.bconf = SET.bconf ? 0 : 1; saveSet(); uiBuildBar(); toast(SET.bconf ? '二次确认：开（先预览，点 ✓ 才建）' : '二次确认：关（点了就建）'); sfx('click'); }); bb.appendChild(cf);
  const ex = document.createElement('button'); ex.innerHTML = '<span style="font-size:18px">↩</span><span>退出</span><small class="kbd">B</small>';
  ex.addEventListener('pointerdown', e => { e.stopPropagation(); toggleBuild(false); }); bb.appendChild(ex);
}
function uiBuildBar() {
  if (!W) return; const me = W.p[ME];
  $('bbar').classList.toggle('hidden', !me.build); $('binfo').classList.toggle('hidden', !me.build);
  $('wbar').classList.toggle('hidden', !!me.build);
  $('bbar').querySelectorAll('button[data-b]').forEach(b => { const id = +b.dataset.b; b.classList.toggle('sel', !me.demo && me.sel === id); b.classList.toggle('na', !affordable(W.res, B[id].cost)); });
  $('bDemo').classList.toggle('sel', !!me.demo);
  $('tBuild').classList.toggle('on', !!me.build); document.body.classList.toggle('building', !!me.build);
  const Bs = B[me.sel];
  const why = BUILD_HOVER && !BUILD_HOVER.ok && BUILD_HOVER.why ? ' · ' + BUILD_HOVER.why : '';
  $('binfo').textContent = (me.demo ? '拆除：点（或拖过）要拆的方块，' + (SET.bconf ? '再点 ✓ 确认，' : '') + '退还一半材料（按血量折算）' : Bs.name + ' · ' + costText(Bs.cost) + ' · ' + Bs.tip + (Bs.hp ? ' · 耐久 ' + Bs.hp : '')) + ' · 建在 ' + (buildL() + 1) + 'F' + why;
  $('bRot').classList.toggle('hidden', me.sel !== 6 || me.demo);
  const cf = $('bConf'); if (cf) { cf.classList.toggle('sel', !!SET.bconf); cf.lastElementChild.textContent = SET.bconf ? '开' : '关'; }
}
// the confirm bar floats next to the waiting plan
function uiPlan() {
  const el = $('bconf'); if (!el) return; el.classList.toggle('hidden', !PLAN);
  if (PLAN) { $('bcTxt').textContent = planCost(); el.classList.toggle('demo', !!PLAN.demo); }
}
function uiPlanPos() {
  if (!PLAN) return; const el = $('bconf'), c = PLAN.cells[PLAN.cells.length - 1], [sx, sy] = w2s(c.x + 0.5, c.y + 0.5, (c.L + 1) * FH);
  el.style.left = clamp(sx - el.offsetWidth / 2, 8, VW - el.offsetWidth - 8) + 'px'; el.style.top = clamp(sy - el.offsetHeight - 26, 60, VH - el.offsetHeight - 110) + 'px';
}
function hudTick(dt) {
  uiPlanPos();
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
  uiKeys(me);
  WPN.forEach((w2, i) => { const b = $('wbar').children[i]; b.classList.toggle('hidden', !me.owned[i]); b.classList.toggle('sel', i === me.wpn); $('wb' + i).textContent = w2.inf ? '∞' : me.mag[i] + '/' + me.ammo[i]; });
  // phase
  const ph = $('phase');
  if (W.phase === 'day') {
    const m = Math.max(0, Math.ceil(W.clock)); ph.className = '';
    ph.innerHTML = (W.night ? '第 ' + (W.night + 1) + ' 夜前' : '第一个白天') + `<span class="sub">${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} 后入夜</span>`;
  } else if (W.phase === 'night') {
    const left = W.zs.length + (NETROLE === 'guest' ? (W.spawnLeft || 0) : W.spawnQ.length);
    ph.className = isBlood(W.night) ? 'blood' : 'night';
    const rest = Math.max(0, Math.ceil(BAL.nightMin(W.night) - W.nightT));
    ph.innerHTML = '第 ' + W.night + ' 夜' + (isBlood(W.night) ? ' · 血月' : '') + `<span class="sub">剩余 ${left} 只${rest > 0 ? ' · 天亮还要 ' + Math.floor(rest / 60) + ':' + String(rest % 60).padStart(2, '0') : ''} · ${W.night}/${BAL.nights}</span>`;
  } else ph.textContent = W.phase === 'win' ? '获救' : '失守';
  // tasks: a one-line summary that opens on tap, and pops open for a few seconds when something changes
  if (UI.tkv !== W.tkv) {
    const changed = UI.tkv != null && UI.tkv >= 0 && W.tasks.some(t => t.done) !== UI.tkDone;
    if ((UI.tkv === -1 || changed) && !INP.touch) UI.tkOpenT = 5; // on phones it stays folded unless tapped
    UI.tkv = W.tkv; UI.tkDone = W.tasks.some(t => t.done);
    const nd = W.tasks.filter(t => t.done).length;
    $('tasks').innerHTML = `<div class="tksum">今日任务 ${nd}/${W.tasks.length} <span>▾</span></div>` + W.tasks.map(t => `<div class="tk${t.done ? ' done' : ''}"><i>${t.done ? '✔' : ''}</i><span class="tt">${t.txt}</span><b>${t.done ? '完成' : t.got + '/' + t.need}</b><span class="tr">${t.rt}</span></div>`).join('');
  }
  UI.tkOpenT = Math.max(0, (UI.tkOpenT || 0) - dt);
  $('tasks').classList.toggle('open', !!UI.tkPin || UI.tkOpenT > 0);
  const rb = $('readyBtn'); rb.classList.toggle('hidden', W.phase !== 'day');
  if (W.phase === 'day') { const n = activeP().filter(p => !p.dead && p.ready).length, tot = activeP().filter(p => !p.dead).length; rb.classList.toggle('on', me.ready); rb.innerHTML = (me.ready ? '已准备' : '准备入夜') + (tot > 1 ? ` ${n}/${tot}` : '') + ' <span class="kbd">(N)</span>'; }
  // resources
  for (const r of RES) { const el = $('res_' + r.k), v = W.res[r.k]; el.firstElementChild.textContent = v; if (UI.resPrev[r.k] != null && v > UI.resPrev[r.k]) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } UI.resPrev[r.k] = v; }
  // prompt
  let ptxt = '', prog = 0;
  if (!me.dead && !me.build) {
    const tgt = useTarget(me);
    const key = INP.touch ? '点「交互」' : '按 F ';
    if (tgt) { ptxt = key + tgt.name; prog = me.useT / tgt.t; }
    else if (nearBench(me)) ptxt = (INP.touch ? '点「交互」' : '按 F ') + '打开工作台';
    if (me.down) ptxt = me.meds > 0 ? (INP.touch ? '点「医疗」' : '按 H ') + '用医疗包自救' : (W.p.length > 1 ? '等待队友来扶你…' : '');
    if (me.medT > 0 && me.selfRev) { ptxt = '正在自救…'; prog = 1 - me.medT / 3; }
  }
  if (INP.touch) {
    const sh = $('stickHint'), on = INP.move.id == null && !me.dead && !panelOpen();
    sh.classList.toggle('on', on);
    if (on) { const R = STICK_R(), x = Math.max(R + 22, Math.min(VW * 0.16, 170)), y = VH - Math.max(R + 40, Math.min(VH * 0.24, 190)); sh.style.left = x + 'px'; sh.style.top = y + 'px'; sh.style.width = sh.style.height = R * 2 + 'px'; }
    const tgt = !me.dead && !me.build && !me.down ? useTarget(me) : null, bench = !tgt && !me.build && nearBench(me);
    const u = $('tUse'); u.classList.toggle('hidden', !(tgt || bench));
    if (tgt) { u.firstElementChild.textContent = INP.useLatch ? '进行中 · 再点停' : '点一下'; u.lastElementChild.textContent = tgt.name; u.style.setProperty('--p', clamp(me.useT / tgt.t, 0, 1)); }
    else if (bench) { u.firstElementChild.textContent = '点一下'; u.lastElementChild.textContent = '打开工作台'; u.style.setProperty('--p', 0); }
    if (tgt || bench) ptxt = ''; else if (me.down && me.meds > 0) ptxt = '点「自救」用医疗包站起来';
    const md = $('tMed'), showMed = me.meds > 0 && !me.dead && me.medT <= 0 && (me.down || me.hp < me.maxHp * 0.7);
    md.classList.toggle('hidden', !showMed); md.textContent = (me.down ? '自救' : '用医疗包') + ' ×' + me.meds;
    $('tWpn').firstElementChild.textContent = w.name; $('tWpn').lastElementChild.textContent = w.inf ? '∞' : me.mag[wi] + ' / ' + me.ammo[wi];
    $('tWpn').classList.toggle('hidden', me.down || me.owned.filter(Boolean).length < 2);
    $('tNadeN').textContent = me.nades; $('tNade').classList.toggle('empty', !me.nades);
    $('tFire').style.setProperty('--rl', rl);
    $('tLLbl').textContent = ((me.build && BUILD_HOVER ? BUILD_HOVER.L : buildL()) + 1) + 'F';
  }
  if (!ptxt && me.edgeK && !me.dead) ptxt = me.edgeK === 1 ? '继续往前走 · 下楼梯' : '继续推 · 从这里跳下去';
  $('prompt').classList.toggle('hidden', !ptxt); $('pTxt').textContent = ptxt; $('pPr').style.width = clamp(prog, 0, 1) * 100 + '%';
  $('prompt').querySelector('.pr').style.display = prog > 0 ? '' : 'none';
  if (me.build) uiBuildBar();
  uiView();
}
function uiView() {
  if (!W) return; const vl = viewL();
  $('vLbl').textContent = (VIEW.auto && vl >= ML - 1 ? '全部' : (vl + 1) + 'F') + ' ' + (VIEW.auto ? '自动' : '手动');
  $('vAuto').classList.toggle('on', VIEW.auto);
}
/* craft */
function openCraft() {
  if (!W || W.over) return; const me = W.p[ME];
  if (!nearBench(me)) { toast('要在营地小屋里的工作台旁才能制作'); return; }
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
  $('pauseT').textContent = NETROLE === 'solo' ? '暂停' : '菜单（游戏继续中）'; $('pQual').textContent = qualLabel();
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
  if (W.p[ME] && W.p[ME].build) toggleBuild(false);
}
function initUI() {
  $('nameIn').value = SET.name || '';
  $('nameIn').addEventListener('input', () => { SET.name = $('nameIn').value.trim().slice(0, 10); saveSet(); });
  diffButtons($('diffSeg')); diffButtons($('lDiffSeg'), () => { if (NETROLE === 'host') sendLobby(); });
  markDiff();
  $('soloBtn').onclick = () => {
    const b = $('soloBtn');
    if (loadSave() && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = '再点一次：新开一局会覆盖存档'; setTimeout(() => { delete b.dataset.sure; renderBest(); }, 3000); return; }
    delete b.dataset.sure; audioInit(); netLeave(); NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0);
  };
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
  confirmBtn($('pTitle'), () => { saveGame(true); netLeave(); W = null; STATE.paused = false; showScreen('title'); renderBest(); });
  $('pSave').onclick = () => { if (NETROLE === 'guest') { toast('联机时由房主存档'); return; } saveGame(false); sfx('click'); };
  $('contBtn').onclick = () => continueGame();
  confirmBtn($('pHub'), () => { netLeave(); location.href = '../'; });
  $('pauseBtn').onclick = () => togglePause();
  $('muteBtn').onclick = () => { setMute(!SET.mute); uiMute(); };
  $('pMute').onclick = () => { setMute(!SET.mute); uiMute(); };
  $('keys').addEventListener('pointerdown', e => { e.stopPropagation(); if (!e.target.closest('.kh')) return; SET.keysOff = !SET.keysOff; saveSet(); UI.keysK = ''; if (W && W.p[ME]) uiKeys(W.p[ME]); sfx('click'); });
  $('pQual').onclick = () => { const o = ['auto', 0, 1, 2], i = o.indexOf(SET.q == null ? 'auto' : SET.q); SET.q = o[(i + 1) % 4]; if (SET.q === 'auto') SET.qa = 0; saveSet(); applyQual(); $('pQual').textContent = qualLabel(); sfx('click'); };
  $('readyBtn').onclick = () => inGame() && toggleReady();
  $('tasks').addEventListener('pointerdown', e => { e.stopPropagation(); UI.tkPin = !UI.tkPin; UI.tkOpenT = 0; sfx('click'); });
  $('oAgain').onclick = () => { $('over').classList.add('hidden'); if (NETROLE === 'host') { if (!NET.gctl || !NET.gctl.open) { NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0); } else hostStart(); } else startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0); };
  $('oLobby').onclick = () => { netSendCtl({ t: 'toLobby' }); backToLobby(); };
  $('oEndless').onclick = () => { $('over').classList.add('hidden'); W.endless = true; W.over = null; W.phase = 'night'; dawn(); };
  $('oTitle').onclick = () => { netLeave(); W = null; showScreen('title'); };
  $('oHub').onclick = () => { netLeave(); location.href = '../'; };
  if (inArtifact()) { $('coopBox').classList.add('hidden'); $('artNote').classList.remove('hidden'); }
  uiMute(); renderBest();
}
