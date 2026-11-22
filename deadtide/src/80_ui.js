/* ================= DOM UI: screens, HUD, panels ================= */
const $ = id => document.getElementById(id);
const UI = { hudT: 0, toastT: 0, bannerT: 0, resPrev: {} };
function showScreen(s) {
  for (const id of ['title', 'lobby']) $(id).classList.toggle('hidden', id !== s);
  $('hud').classList.toggle('hidden', s !== 'play');
  $('hubBtn').classList.toggle('hidden', !HUB || s !== 'title');
  if (s !== 'play') { for (const id of ['craft', 'kit', 'pause', 'over']) $(id).classList.add('hidden'); }
  if (s === 'title' && typeof renderBest === 'function') renderBest();
  if (s === 'title') { STATE.mode = 'title'; renderBest(); }
  if (s === 'lobby') STATE.mode = 'lobby';
  if (s === 'play' && W && W.p[ME]) W.p[ME].gt = SET.gt || 0;                          // (round 24) last grenade type picked
  if (s === 'play' && INP.touch && !SET.guide22) { SET.guide22 = 1; saveSet(); setTimeout(() => document.body.classList.add('guide'), 600); } // (round 22) the first touch game shows what each control does; the next tap hides it
  if (s !== 'play') document.body.classList.remove('guide');
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
  $('lDiffNote').textContent = host ? '' : '（房主决定）'; uiModeLbl();
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
  if (me.build) rows = [['左键', '放（拖动一排）'], ['右键', '拆'], ['1–9', '选道具（再按换材料）'], ['R', '换材料'], ['X', '拆除模式', me.demo ? 1 : 0], ['Enter', '确认'], ['Esc', '取消'], ['B', '收起道具', 1]];
  else {
    const canRl = me.mag[wi] < w.mag && (w.inf || me.ammo[wi] > 0) && !(me.reloadT > 0), ut = useTarget(me), bench = canCraft(me);
    rows = [['左键', '射击'], ['R', '换弹', me.mag[wi] === 0 && canRl ? 2 : canRl ? 0 : -1], ['G', GREN[me.gt || 0].sn + ' ×' + gCount(me, me.gt || 0) + ' 按住瞄', gCount(me, me.gt || 0) ? 0 : -1], ['5–8', '换手雷'],
      ['H', me.down ? '自救' : '医疗 ×' + me.meds, !me.meds ? -1 : (me.down || me.hp < me.maxHp * 0.4) ? 2 : me.hp >= me.maxHp ? -1 : 0],
      ['右键', me.melee === 1 && me.shield ? '盾推 / V' : '刀 / V'], ...(me.shield ? [['X', '换成' + (me.melee === 1 ? '刀' : '盾')]] : []), ['F', ut ? ut.name : '交互', ut ? 1 : 0], ['1–4', '快捷武器'], ['Z', '切回上一把'], ['I', '装备'], ['C', '商店', bench ? 1 : -1], ['B', '道具']];
    const pil = !me.ride && !(me.pass >= 0) && pillionFor(me);
    if (me.vehs || me.pass >= 0 || pil) rows.push(['T', me.ride || me.pass >= 0 ? '下车' : pil ? '坐后座' : '上' + (VEH[me.veh] ? VEH[me.veh].name : '车'), me.ride || me.pass >= 0 || pil ? 1 : 0]);
    if (me.vehs & (me.vehs - 1)) rows.push(['⇧T', '换一辆车']);
    if (W.phase === 'day') rows.push(['N', me.ready ? '取消准备' : '准备入夜', me.ready ? 1 : 0]);
  }
  rows.push(['M', '大地图（也可按 Tab）'], ['Q E', '转镜头'], ['Esc', '菜单']);
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
  if (B[id].slab) cube(6); else if (B[id].pad) { cube(8); g.fillStyle = '#2a1e0e'; g.font = 'bold 22px sans-serif'; g.fillText('⤒', 16, 36); } else if (B[id].dep) { g.fillStyle = col; g.fillRect(22, 14, 8, 30); if (B[id].lamp) { g.fillStyle = '#ffe9a8'; g.fillRect(16, 8, 20, 9); } else { g.strokeStyle = col; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(14 + k * 12, 36, 7, 0, 7); g.stroke(); } } }
  else if (B[id].stairs) { for (let k = 0; k < 4; k++) { g.fillStyle = shade(1 - k * 0.08); g.fillRect(8 + k * 9, 40 - k * 9, 36 - k * 9, 9 + k * 9); } }
  else cube(28);
  if (id === 8) { g.fillStyle = 'rgba(0,0,0,.45)'; for (let k = 0; k < 3; k++) g.fillRect(14 + k * 9, 20, 3, 22); }
  if (id === 7) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(12, 22, 10, 20); }
  return c;
}
function buildHudStatic() {
  $('resBox').innerHTML = RES.map(r => `<div id="res_${r.k}"><b style="color:${r.col}">0</b><small>${r.name}</small></div>`).join('');
  UI.wbK = '';
  // (round 22) the item bar: one slot per kind of placeable; the same slot again (or the chips above it) switches material
  const bb = $('bbar'); bb.innerHTML = '';
  ITEMS.forEach((g, n) => {
    const b = document.createElement('button'); b.dataset.g = n;
    b.innerHTML = `<span class="k kbd">${n + 1}</span><i class="ic"></i><span class="nm">${g.name}</span><small></small>` + (g.ids.length > 1 ? `<em class="vd">${g.ids.map(() => '·').join('')}</em>` : '');
    b.addEventListener('pointerdown', e => { e.stopPropagation(); selItem(n); });
    bb.appendChild(b);
  });
  const dm = document.createElement('button'); dm.id = 'bDemo'; dm.innerHTML = '<span style="font-size:20px">✕</span><span>拆除</span><small class="kbd">右键 / X</small>';
  dm.addEventListener('pointerdown', e => { e.stopPropagation(); const me = W.p[ME]; me.demo = !me.demo; uiBuildBar(); sfx('click'); }); bb.appendChild(dm);
  const cf = document.createElement('button'); cf.id = 'bConf'; cf.innerHTML = '<span style="font-size:16px">✓✓</span><span>二次确认</span><small></small>';
  cf.addEventListener('pointerdown', e => { e.stopPropagation(); SET.bconf = SET.bconf ? 0 : 1; saveSet(); uiBuildBar(); toast(SET.bconf ? '二次确认：开（先预览，点 ✓ 才建）' : '二次确认：关（点了就建）'); sfx('click'); }); bb.appendChild(cf);
  const ex = document.createElement('button'); ex.id = 'bExit'; ex.innerHTML = '<span style="font-size:18px">↩</span><span>收起</span><small class="kbd">B</small>';
  ex.addEventListener('pointerdown', e => { e.stopPropagation(); toggleBuild(false); }); bb.appendChild(ex);
}
function uiBuildBar() {
  if (!W) return; const me = W.p[ME];
  $('bbar').classList.toggle('hidden', !me.build); $('binfo').classList.toggle('hidden', !me.build);
  $('wbar').classList.toggle('hidden', !!me.build);
  const G = UI.gsel = UI.gsel || {};
  $('bbar').querySelectorAll('button[data-g]').forEach(b => { const g = ITEMS[+b.dataset.g], on = !me.demo && itemOf(me.sel) === g, open = g.ids.filter(id => hasBP(id)), id = on ? me.sel : open.includes(G[g.k]) ? G[g.k] : (open[0] || g.ids[0]);
    if (b.dataset.cur !== String(id)) { b.dataset.cur = id; const ic = b.querySelector('.ic'); ic.innerHTML = ''; ic.appendChild(blockIcon(id)); b.querySelector('small').textContent = (g.ids.length > 1 ? B[id].name + ' ' : '') + costText(B[id].cost); const vd = b.querySelector('.vd'); if (vd) vd.innerHTML = g.ids.map(q => q === id ? '●' : '○').join(''); }
    b.classList.toggle('sel', on); b.classList.toggle('na', !affordable(W.res, B[id].cost)); b.classList.toggle('lock', !open.length); });
  uiVariants(me);
  $('bDemo').classList.toggle('sel', !!me.demo);
  $('tBuild').classList.toggle('on', !!me.build); document.body.classList.toggle('building', !!me.build);
  const Bs = B[me.sel];
  const why = BUILD_HOVER && !BUILD_HOVER.ok && BUILD_HOVER.why ? ' · ' + BUILD_HOVER.why : '';
  $('binfo').textContent = (me.demo ? '拆除：点（或拖过）要拆的方块，' + (SET.bconf ? '再点 ✓ 确认，' : '') + '退还一半材料（按血量折算）' : Bs.name + ' · ' + costText(Bs.cost) + ' · ' + Bs.tip + (Bs.hp ? ' · 耐久 ' + Bs.hp : '')) + ' · 建在 ' + (buildL() + 1) + 'F' + why;
  const cf = $('bConf'); if (cf) { cf.classList.toggle('sel', !!SET.bconf); cf.lastElementChild.textContent = SET.bconf ? '开' : '关'; }
}
// the material / variant chips over the item bar (only for slots with more than one)
function uiVariants(me) {
  const el = $('bvar'), g = itemOf(me.sel), show = !!me.build && !me.demo && g.ids.length > 1;
  el.classList.toggle('hidden', !show); if (!show) return;
  const key = me.sel + ':' + g.ids.map(id => (hasBP(id) ? 1 : 0) + (affordable(W.res, B[id].cost) ? 2 : 0)).join(''); if (UI.bvK === key) return; UI.bvK = key;
  el.innerHTML = g.ids.map(id => `<button data-v="${id}" class="${id === me.sel ? 'sel' : ''}${hasBP(id) ? '' : ' lock'}${affordable(W.res, B[id].cost) ? '' : ' na'}"><b>${B[id].name}</b><small>${hasBP(id) ? costText(B[id].cost) : '要蓝图'}</small></button>`).join('');
  el.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); const id = +b.dataset.v; (UI.gsel = UI.gsel || {})[g.k] = id; selBlock(id); }));
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
  { const me = W && W.p[ME], lw = !!me && !me.dead && !me.gone && !W.over && (me.down || me.hp < (me.maxHp || 100) * 0.3) && !inMech(me), el = document.getElementById('lowhp'); if (el && el.classList.contains('on') !== lw) el.classList.toggle('on', lw); // (round 34d) low health: red pulsing edges and a heartbeat
    if (lw) { UI.hbT = (UI.hbT || 0) - dt; if (UI.hbT <= 0) { UI.hbT = me.down ? 0.7 : 0.85; sfx('heart'); } } else UI.hbT = 0; }
  uiPlanPos();
  if (UI.toastT > 0 && (UI.toastT -= dt) <= 0) $('toast').classList.remove('show');
  if (UI.bannerT > 0 && (UI.bannerT -= dt) <= 0) $('banner').classList.remove('show');
  UI.hudT -= dt; if (UI.hudT > 0) return; UI.hudT = 0.1;
  if (bigMapOpen() && (UI.bmT = (UI.bmT || 0) + 1) % 3 === 0) drawBigMap();
  uiObjective();
  const me = W.p[ME];
  // players
  $('pcards').innerHTML = W.p.map(p => {
    const st = p.gone ? '已离开' : p.dead ? '阵亡' : p.down ? '倒地 ' + Math.ceil(p.downT) + 's' : Math.ceil(p.hp);
    return `<div class="pbar p${p.i % 2}${p.i === ME ? '' : ' small'}"><div class="nm"><span>${p.name}${p.i === ME && W.p.length > 1 ? '（你）' : ''}</span><i>${st}</i></div><div class="bar"><i style="width:${p.dead || p.gone ? 0 : p.down ? 100 * p.downT / BAL.downTime : 100 * p.hp / p.maxHp}%;${p.down ? 'background:#7a2a24' : ''}"></i></div></div>`;
  }).join('');
  const wi = me.down ? 0 : me.wpn, w = WPN[wi];
  $('wName').textContent = me.build ? '拿着道具' : w.name;
  $('wMag').textContent = me.build ? '' : me.mag[wi];
  $('wRes').textContent = me.build ? '' : '/ ' + (w.inf ? '∞' : me.ammo[wi]);
  const rl = me.reloadT > 0 ? 1 - me.reloadT / WPN[me.reloadW != null ? me.reloadW : wi].reload : me.reloadVis > 0 ? 1 - me.reloadVis / w.reload : me.medT > 0 ? 1 - me.medT / (me.selfRev ? 3 : BAL.healTime) : 0;
  $('wRl').style.width = (rl * 100) + '%';
  if (inMech(me)) { $('iNadeL').textContent = mechOf(me).sn; $('iNade').textContent = (me.mcd || 0) > 0 ? Math.ceil(me.mcd) + 's' : '✓'; } else { $('iNadeL').textContent = GREN[me.gt || 0].sn; $('iNade').textContent = gCount(me, me.gt || 0); } // (round 34) in a mech the grenade key is its skill $('iMed').textContent = me.meds; $('iKill').textContent = me.kills; $('iLife').textContent = me.lives != null ? me.lives : '-';
  { const mw = $('iMechW'), sh = me.ride && MECHS[me.veh]; mw.classList.toggle('hidden', !sh); if (sh) { const M = MECHS[me.veh], im = inMech(me), h = mhpOf(me); $('iMech').textContent = INP.touch ? '装甲 ' + Math.round(h) + ' · 电 ' + Math.floor(me.bat != null ? me.bat : BAL.mechBat) + (me.mtr > 0 ? ' · 变形中' : '') : M.name + (me.mtr > 0 ? ' · 变形中' : im ? '' : '（X / 变形）') + ' · 装甲 ' + Math.round(h) + '/' + M.hp + ' · 电 ' + Math.floor(me.bat != null ? me.bat : BAL.mechBat) + 's' + (im ? ' · ' + M.sn + ((me.mcd || 0) > 0 ? ' ' + Math.ceil(me.mcd) + 's' : ' 好了') : ''); /* (round 36b) on touch the skill cooldown lives on the skill key; the line is just hull and energy */ mw.classList.toggle('low', (me.bat || 0) < BAL.mechLow || h < M.hp * 0.25); } } // (round 34b) mech line whenever you drive
  { const dv = String(me.ride ? me.veh : 0); if (document.body.dataset.veh !== dv) document.body.dataset.veh = dv; const im = inMech(me) || me.mtr > 0; if (document.body.classList.contains('inmech') !== im) document.body.classList.toggle('inmech', im); } // (round 36b) phones show only the info for what you're riding
  { const sw = $('iShlW'), ht = ownsVeh(me, 6); sw.classList.toggle('hidden', !ht); if (ht) $('iShl').textContent = me.shl || 0; } // (round 31) tank shells
  { const fw = $('iFuelW'), has = ownsVeh(me, 5); fw.classList.toggle('hidden', !has); if (has) { const f = Math.ceil(me.fuel || 0); $('iFuel').textContent = f + ' 秒 · 弹 ' + (me.gam || 0); fw.style.color = f < BAL.fuelLow ? '#ff7a6a' : airborne(me) ? '#9fe0ff' : ''; } } // (round 29) gyrocopter fuel
  uiKeys(me);
  const q = quickList(me), qk = q.join(','); if (UI.wbK !== qk) { UI.wbK = qk;
    $('wbar').innerHTML = q.map((k, j) => `<button data-w="${k}"><span><kbd>${j + 1}</kbd>${WPN[k].name}</span><small id="wb${k}"></small></button>`).join('') + `<i class="wsep"></i><button id="wbMel" class="mel"><span><kbd>X</kbd><b>刀</b></span><small>右键 / V</small></button>` + GREN.map((g, t) => `<button data-g="${t}" class="gr"><span><kbd>${t + 5}</kbd>${g.sn}</span><small id="wg${t}"></small></button>`).join('') + `<button id="wbKit" class="kit"><span><kbd>I</kbd>装备</span><small>换快捷枪</small></button><button id="wbItem" class="kit item"><span><kbd>B</kbd>道具</span><small>墙 · 陷阱 · 跳板</small></button>`;
    $('wbar').querySelectorAll('button[data-w]').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); if (inGame()) act('wpn', +b.dataset.w); }));
    $('wbKit').addEventListener('pointerdown', e => { e.stopPropagation(); openKit(); });
    $('wbItem').addEventListener('pointerdown', e => { e.stopPropagation(); if (inGame()) toggleBuild(true); });
    $('wbMel').addEventListener('pointerdown', e => { e.stopPropagation(); if (inGame()) switchMelee(); });
    $('wbar').querySelectorAll('button[data-g]').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); if (inGame()) setGren(+b.dataset.g); })); }
  { const mb = $('wbMel'), sh = me.melee === 1 && me.shield; mb.querySelector('b').textContent = sh ? '盾' : '刀'; mb.classList.toggle('dim', !me.shield); mb.lastElementChild.textContent = me.shield ? '右键 · X 换' + (sh ? '刀' : '盾') : '右键 / V';
    GREN.forEach((g, t) => { const b = $('wbar').querySelector('[data-g="' + t + '"]'), c = gCount(me, t); b.classList.toggle('sel', t === (me.gt || 0)); b.classList.toggle('dim', !c); $('wg' + t).textContent = '×' + c; }); }
  q.forEach(i => { const b = $('wbar').querySelector('[data-w="' + i + '"]'), w2 = WPN[i]; b.classList.toggle('sel', i === me.wpn); $('wb' + i).textContent = (me.rlBg && me.rlBg[i] > 0 ? '⟳ ' : '') + (w2.inf ? '∞' : me.mag[i] + '/' + me.ammo[i]); });
  if (!q.includes(me.wpn) && !me.build) { const b = $('wbKit'); if (b) b.lastElementChild.textContent = '在用：' + w.name; }
  // phase
  const ph = $('phase');
  if (W.phase === 'day') {
    const m = Math.max(0, Math.ceil(W.clock)); ph.className = '';
    const nl = BAL.nightLv(W.night + 1), up = W.night > 0 && nl > BAL.nightLv(W.night); /* (round 31) the next night's level */
    ph.innerHTML = (W.night ? '第 ' + (W.night + 1) + ' 夜前' : '第一个白天') + `<span class="sub">${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} 后入夜 · 今夜 Lv ${nl}${up ? '（升级）' : ''}</span>`;
  } else if (W.phase === 'night') {
    const left = W.zs.length + (NETROLE === 'guest' ? (W.spawnLeft || 0) : W.spawnQ.length);
    ph.className = isBlood(W.night) ? 'blood' : 'night';
    const rest = Math.max(0, Math.ceil(BAL.nightMin(W.night) - W.nightT));
    ph.innerHTML = '第 ' + W.night + ' 夜 · Lv ' + BAL.nightLv(W.night) + (isBlood(W.night) ? ' · 血月' : '') + `<span class="sub">剩余 ${left} 只${rest > 0 ? ' · 天亮还要 ' + Math.floor(rest / 60) + ':' + String(rest % 60).padStart(2, '0') : ''} · ${W.night}/${BAL.nights}</span>`;
  } else ph.textContent = W.phase === 'win' ? '获救' : '失守';
  // tasks: a one-line summary that opens on tap, and pops open for a few seconds when something changes
  if (UI.tkv !== W.tkv) {
    const changed = UI.tkv != null && UI.tkv >= 0 && W.tasks.some(t => t.done) !== UI.tkDone;
    if (changed && UI.tkv !== -1) UI.tkPing = 1; /* (round 33) never pops open by itself: the pill just flashes */
    UI.tkv = W.tkv; UI.tkDone = W.tasks.some(t => t.done);
    const nd = W.tasks.filter(t => t.done).length;
    const pk = W.perk ? Object.values(W.perk).reduce((a, b) => a + b, 0) : 0; /* (round 32) permanent tasks */
    $('tasks').innerHTML = `<div class="tksum${UI.tkPing ? ' ping' : ''}">任务 · 提升 ${pk} <span>▾</span></div><div class="tklist">` + W.tasks.map(t => `<div class="tk${t.done ? ' done' : ''}"><i>${t.done ? '✔' : ''}</i><span class="tt">${t.txt}</span><b>${t.done ? '完成' : t.got + '/' + t.need}</b><span class="tr">${t.rt}</span></div>`).join('') + '<span class="tkhide">点这里收起 ▴</span></div>'; UI.tkPing = 0;
  }
  UI.tkOpenT = Math.max(0, (UI.tkOpenT || 0) - dt);
  $('tasks').classList.toggle('open', !!UI.tkPin);
  const rb = $('readyBtn'); rb.classList.toggle('hidden', W.phase !== 'day');
  if (W.phase === 'day') { const n = activeP().filter(p => !p.dead && p.ready).length, tot = activeP().filter(p => !p.dead).length; rb.classList.toggle('on', me.ready); rb.innerHTML = (me.ready ? '已准备' : '准备入夜') + (tot > 1 ? ` ${n}/${tot}` : '') + ' <span class="kbd">(N)</span>'; }
  // resources
  for (const r of RES) { const el = $('res_' + r.k), v = W.res[r.k]; el.firstElementChild.textContent = v; if (UI.resPrev[r.k] != null && v > UI.resPrev[r.k]) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } UI.resPrev[r.k] = v; }
  // prompt
  let ptxt = '', prog = 0;
  if (!me.dead && !me.build && !me.ride && !(me.pass >= 0) && pillionFor(me)) ptxt = (INP.touch ? '点「坐后座」' : '按 T ') + '坐上 ' + pillionFor(me).name + ' 的' + VEH[pillionFor(me).veh].name + '后座（后座能开枪）';
  if (me.dead) ptxt = me.lives > 0 ? '你阵亡了 · ' + Math.ceil(me.downT) + ' 秒后在据点复活（还剩 ' + me.lives + ' 次）· 队友带医疗包到你身边按住交互 6 秒能马上救你' : '你阵亡了 · 复活次数用完了 · 只能等队友带医疗包来救你';
  if (!me.dead && !me.build) {
    const tgt = useTarget(me), inB = canCraft(me); if (inB && !UI.inB) UI.craftHintT = W.t; UI.inB = inB;
    const key = INP.touch ? '点「交互」' : '按 F ';
    if (tgt) { ptxt = key + tgt.name; prog = me.useT / tgt.t; }
    else if (nearBench(me)) ptxt = (INP.touch ? '点「交互」' : '按 F ') + '打开工作台';
    else if (canCraft(me) && !INP.touch && W.t - (UI.craftHintT || -99) < 4) ptxt = '在建筑里：按 C 逛商店（枪、弹药、盾、载具）';
    else if (!me.meds && W.p.some(q => q !== me && q.dead && !q.gone && q.L === me.L && Math.hypot(q.x - me.x, q.y - me.y) < 1.6)) ptxt = '要有医疗包才能把队友救回来（搜背包、柜子，或在「商店」里买）';
    if (me.down) ptxt = me.meds > 0 ? (INP.touch ? '点「医疗」' : '按 H ') + '用医疗包自救' : (W.p.length > 1 ? '等待队友来扶你…' : '');
    if (me.medT > 0 && me.selfRev) { ptxt = '正在自救…'; prog = 1 - me.medT / 3; }
  }
  if (INP.touch) {
    const sh = $('stickHint'), on = INP.move.id == null && !me.dead && !panelOpen();
    sh.classList.toggle('on', on);
    if (on) { const R = STICK_R(), x = Math.max(R + 22, Math.min(VW * 0.16, 170)), y = VH - Math.max(R + 40, Math.min(VH * 0.24, 190)); sh.style.left = x + 'px'; sh.style.top = y + 'px'; sh.style.width = sh.style.height = R * 2 + 'px'; }
    const tgt = !me.dead && !me.build && !me.down ? useTarget(me) : null, bench = !tgt && !me.build && canCraft(me);
    $('tCraft').classList.toggle('hidden', !canCraft(me) || !!me.build); const pil = !me.ride && !(me.pass >= 0) && pillionFor(me), tr = $('tRide');
    tr.classList.toggle('hidden', !(me.vehs || me.pass >= 0 || pil) || !!me.build); tr.classList.toggle('on', !!me.ride || me.pass >= 0);
    tr.textContent = me.ride || me.pass >= 0 ? '下车' : pil ? '坐后座' : (VEH[me.veh] ? VEH[me.veh].name : '载具');
    // (round 22) the context key on the ring: what F would do, else get off / jump
    const u = $('tUse'), useOK = tgt && !(me.ride && !(VEH[me.veh] && VEH[me.veh].search)); u.classList.toggle('hidden', !!me.dead);
    u.classList.toggle('hot', !!useOK); u.style.setProperty('--p', useOK ? clamp(me.useT / tgt.t, 0, 1) : 0);
    u.classList.toggle('dim', !useOK && !(me.ride || me.pass >= 0)); u.classList.remove('heal');               // (round 23c) the medkit has its own key again
    u.firstElementChild.textContent = useOK ? (INP.useLatch ? '再点停' : '交互') : ''; u.lastElementChild.textContent = useOK ? shortUse(tgt.name) : me.ride || me.pass >= 0 ? '下车' : '交互';
    if (useOK) ptxt = tgt.name + (INP.useLatch ? ' · 进行中' : ''); else if (me.down && me.meds > 0) ptxt = '点「自救」用医疗包站起来';
    const md = $('tMed'), canMed = me.meds > 0 && !me.dead && me.medT <= 0 && (me.down || me.hp < me.maxHp); // (round 23c) its own key left of the context key
    md.classList.toggle('hidden', !!me.dead); /* (round 36b) usable on a vehicle / in a mech too (it was hidden there, so mid-fight on a bike you couldn't heal) */ md.classList.toggle('dim', !canMed); md.classList.toggle('hot', canMed && (me.down || me.hp < me.maxHp * 0.7));
    md.firstElementChild.textContent = me.down ? '自救' : '医疗'; $('tMedN').textContent = '×' + me.meds;
    $('tWpn').firstElementChild.textContent = w.sn || w.name; $('tWpn').lastElementChild.textContent = w.inf ? '∞' : me.mag[wi] + '/' + me.ammo[wi];
    $('tWpn').classList.toggle('dim', me.down || me.owned.filter(Boolean).length < 2);
    const gt = me.gt || 0, im = inMech(me), gc = im ? ((me.mcd || 0) > 0 ? Math.ceil(me.mcd) : '✓') : gCount(me, gt), tn = $('tNade'), lb = im ? mechOf(me).sn : GREN[gt].sn; $('tNadeN').textContent = gc; tn.classList.toggle('empty', im ? (me.mcd || 0) > 0 : !gc); if (tn.firstChild.nodeValue !== lb) tn.firstChild.nodeValue = lb; // (round 24) shows the picked grenade type
    const sv = $('tShove'), svm = me.ride && MECHS[me.veh] ? (me.mform === 1 ? 'b' : 'x') : String(me.melee === 1 && me.shield ? 1 : 0); if (sv.dataset.m !== svm) { sv.dataset.m = svm; sv.textContent = svm === 'x' ? '变形' : svm === 'b' ? '变回' : svm === '1' ? '盾' : '刀'; } sv.classList.toggle('sw', !!me.shield && !me.ride); sv.classList.toggle('xf', !!me.ride); // (round 34b) driving: the melee key transforms
    $('tFire').style.setProperty('--rl', rl);
    $('tLLbl').textContent = ((me.build && BUILD_HOVER ? BUILD_HOVER.L : buildL()) + 1) + 'F';
  }
  if (!ptxt && me.edgeK && !me.dead) ptxt = me.edgeK === 1 ? '继续往前走 · 下楼梯' : '继续推 · 从这里跳下去';
  $('prompt').classList.toggle('hidden', !ptxt); $('pTxt').textContent = ptxt; $('pPr').style.width = clamp(prog, 0, 1) * 100 + '%';
  $('prompt').querySelector('.pr').style.display = prog > 0 ? '' : 'none';
  if (me.build) uiBuildBar();
  uiView();
}
// a short label for the round context key ('搜索汽车残骸' -> '搜索')
function shortUse(n) { const m = n.match(/^(搜索|扶起|用医疗包救回|砍树|采石|拆废铁|搬原木|砍灌木|启动|打开|装填|拆)/); return m ? (m[1] === '用医疗包救回' ? '救人' : m[1]) : n.slice(0, 4); }
function uiView() {
  if (!W) return; const vl = viewL();
  $('vLbl').textContent = (VIEW.auto && vl >= ML - 1 ? '全部' : (vl + 1) + 'F') + ' ' + (VIEW.auto ? '自动' : '手动');
  $('vAuto').classList.toggle('on', VIEW.auto);
}
/* craft */
function openCraft() {
  if (!W || W.over) return; const me = W.p[ME];
  if (!canCraft(me)) { toast('进到任何建筑里（或回营地）才能逛商店'); return; }
  renderCraft(); $('craft').classList.remove('hidden'); sfx('click');
}
function closeCraft() { $('craft').classList.add('hidden'); }
// (round 22) the shop: tabs by kind; a gun and its ammo share one card; vehicles have their own tab
const SHOP_TABS = [['gun', '武器 · 弹药'], ['item', '道具'], ['veh', '载具'], ['upg', '强化']];
function shopBuy(c) {
  const me = W.p[ME], why = craftBlocked(me, c);
  if (why) { toast(why, '#ff8a7a'); sfx('deny'); return; }
  act('craft', c.id); sfx('click');
  if (NETROLE === 'guest') { for (const k in c.cost) W.res[k] -= c.cost[k]; if (c.wpn) me.owned[c.wpn] = 1; if (c.shield) { me.shield = 1; me.melee = 1; UI.meleeT = performance.now() + 600; } if (c.veh) { me.vehs = (me.vehs || 0) | 1 << c.veh; me.veh = c.veh; } if (c.shield) me.shield = BAL.shieldHp; }
  setTimeout(() => { if (!$('craft').classList.contains('hidden')) renderCraft(); }, NETROLE === 'guest' ? 250 : 0);
}
function shopBtn(c, label) {
  const me = W.p[ME], why = craftBlocked(me, c), hard = why && why !== '材料不足';
  return `<button class="sbtn${why ? ' no' : ''}" data-c="${c.id}" ${hard ? 'disabled' : ''}><b>${label || c.name}</b><span>${hard ? why : (Object.keys(c.cost).length ? costText(c.cost) : '免费') + (why ? ' · 不够' : '')}</span></button>`;
}
function renderCraft() {
  const me = W.p[ME], tab = SET.shopTab && SHOP_TABS.some(t => t[0] === SET.shopTab) ? SET.shopTab : 'gun';
  $('ctabs').innerHTML = SHOP_TABS.map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'sel' : ''}">${n}</button>`).join('');
  $('ctabs').querySelectorAll('button').forEach(b => b.onclick = () => { SET.shopTab = b.dataset.t; saveSet(); renderCraft(); sfx('click'); });
  $('cres').textContent = '全队材料：' + RES.map(r => r.name + ' ' + W.res[r.k]).join(' · ');
  let h = '';
  if (tab === 'gun') {
    h = WPN.map((w, k) => {
      const buy = CRAFT.find(c => c.wpn === k), am = CRAFT.find(c => c.ammo && c.ammo[0] === k), own = me.owned[k];
      const st = own ? (w.inf ? '已有 · 子弹无限' : '已有 · ' + me.mag[k] + ' / ' + me.ammo[k] + '（最多 ' + ammoCap(k) + '）') : '没有'; // (round 32) backpack cap
      const btns = !own && buy ? shopBtn(buy, '造这把枪') : own && am ? shopBtn(am, '买' + am.name) : own && w.inf ? '<span class="sfree">不用买子弹</span>' : '';
      return `<div class="sc${own ? ' own' : ''}"><div class="sh"><b>${w.name}</b><em>${st}</em></div><small>${w.tag || ''}</small><div class="sb">${btns}</div></div>`;
    }).join('');
    { const g = CRAFT.find(c => c.gam), own = ownsVeh(me, 5); h += `<div class="sc${own ? ' own' : ''}"><div class="sh"><b>旋翼机机枪</b><em>${own ? '机上 ' + (me.gam || 0) + ' / ' + BAL.gyroCap : '要先有旋翼机'}</em></div><small>飞的时候按开火：一发 ${BAL.gyroDmg}，射速快，打你瞄的地方；子弹存在飞机上</small><div class="sb">${own ? shopBtn(g, '买' + g.name) : '<span class="sfree">「载具」栏造</span>'}</div></div>`; } // (round 30)
    { const g = CRAFT.find(c => c.shl), own = ownsVeh(me, 6); h += `<div class="sc${own ? ' own' : ''}"><div class="sh"><b>坦克炮</b><em>${own ? '车里 ' + (me.shl || 0) + ' / ' + BAL.tankCap : '要先有坦克'}</em></div><small>开坦克时按开火：炮弹打到哪炸到哪（${BAL.tankDmg}，半径 ${BAL.tankR}），${BAL.tankRate} 秒一发</small><div class="sb">${own ? shopBtn(g, '买' + g.name) : '<span class="sfree">「载具」栏造</span>'}</div></div>`; } // (round 31)
    // (round 23) melee: knife or riot shield, one at a time
    const sc = CRAFT.find(c => c.shield), useBtn = m => `<button class="sbtn mel" data-m="${m}"><b>${m ? '用盾' : '用刀'}</b><span>换成近战武器</span></button>`;
    h += `<div class="sgrp">近战 · 右键 / V（触屏「刀 / 盾」键）；X 或武器菜单里切换</div>`;
    h += `<div class="sc own"><div class="sh"><b>刀</b><em>${me.melee !== 1 || !me.shield ? '在用' : '已有'}</em></div><small>冲上去砍一只，背后砍双倍，睡着的一刀死</small><div class="sb">${me.melee === 1 && me.shield ? useBtn(0) : '<span class="sfree">在用</span>'}</div></div>`;
    h += `<div class="sc${me.shield ? ' own' : ''}"><div class="sh"><b>防暴盾</b><em>${me.shield ? (me.melee === 1 ? '在用' : '已有') : '没有'}</em></div><small>${sc.desc}</small><div class="sb">${!me.shield ? shopBtn(sc, '买') : me.melee === 1 ? '<span class="sfree">在用</span>' : useBtn(1)}</div></div>`;
  } else if (tab === 'item') {
    const st = { nade: '带着 ' + me.nades + ' / ' + BAL.nadeCap, med: '带着 ' + me.meds + ' / ' + BAL.medCap }; for (let t = 1; t < 4; t++) st['g' + GREN[t].k] = '带着 ' + gCount(me, t) + ' / ' + BAL.gnCap;
    h = CRAFT.filter(c => c.cat === 'item').map(c => `<div class="sc"><div class="sh"><b>${c.name}</b><em>${st[c.id] || ''}</em></div><small>${c.desc}</small><div class="sb">${shopBtn(c, c.shield && me.shield > 0 ? '修满' : '买')}</div></div>`).join('');
    h += `<div class="sgrp">墙、陷阱、地雷、机枪塔、跳板这些<b>放置类道具不在商店里</b>：随时随地点「道具」（电脑按 B）拿出来放，放一个扣一份材料</div>`;
  } else if (tab === 'veh') {
    h = `<div class="sgrp">选一辆当默认：T（触屏点「载具」）就上这辆；Shift+T / 长按「载具」换车</div>`;
    h += CRAFT.filter(c => c.cat === 'veh').map(c => { const v = c.veh, own = (me.vehs || 0) >> v & 1, def = own && me.veh === v, M = MECHS[v];
      return `<div class="sc${own ? ' own' : ''}"><div class="sh"><b>${c.name}</b><em>${def ? '默认 ✓' : own ? '已有' : '速度 ×' + VEH[v].spd}</em></div><small>${c.desc}${M ? `<br><b>二阶段 · ${M.name}</b>（骑着按 X / 「变形」，1 秒）：${M.tag}` : ''}</small><div class="sb">${own ? (def ? '<span class="sfree">按 T 上车</span>' : `<button class="sbtn vdef" data-v="${v}"><b>设为默认</b><span>T 就上这辆</span></button>`) : shopBtn(c, '造')}</div></div>`; }).join('');
    if (me.vehs & 126) { const fx = CRAFT.find(c => c.mfix), bt = CRAFT.find(c => c.mbat), hs = [1, 2, 3, 4, 5, 6].filter(v => ownsVeh(me, v)).map(v => MECHS[v].name + ' ' + Math.round(mhpOf(me, v)) + '/' + MECHS[v].hp).join('，'); h += `<div class="sc own"><div class="sh"><b>机甲维护</b><em>电 ${Math.floor(me.bat != null ? me.bat : BAL.mechBat)} / ${BAL.mechBat} 秒</em></div><small>装甲：${hs}。不是机甲形态时装甲和电会慢慢恢复；这里马上修好 / 充满（要先变回载具）</small><div class="sb">${shopBtn(fx, '修好装甲')}${shopBtn(bt, '充满电')}</div></div>`; } // (round 34b)
    if (ownsVeh(me, 5)) { const f = CRAFT.find(c => c.fuel); h += `<div class="sc own"><div class="sh"><b>旋翼机油箱</b><em>油 ${Math.floor(me.fuel || 0)} / ${VEH[5].fuel} 秒</em></div><small>在这里直接加满（免费、马上满）；也可以在有屋顶的房间里按 F 加。机枪子弹在「武器 · 弹药」栏买</small><div class="sb">${shopBtn(f, '加满油')}</div></div>`; } // (round 30)
  } else {
    h = CRAFT.filter(c => c.cat === 'upg').map(c => `<div class="sc"><div class="sh"><b>${c.name}</b><em>${W.upg} / 5 级</em></div><small>${c.desc}</small><div class="sb">${shopBtn(c, '升级')}</div></div>`).join('');
  }
  $('clist').innerHTML = h;
  $('clist').querySelectorAll('button[data-c]').forEach(b => b.addEventListener('click', () => shopBuy(CRAFT.find(c => c.id === b.dataset.c))));
  $('clist').querySelectorAll('button[data-g]').forEach(b => b.addEventListener('click', () => { closeCraft(); selItem(+b.dataset.g); }));
  $('clist').querySelectorAll('button.mel').forEach(b => b.addEventListener('click', () => { switchMelee(+b.dataset.m); setTimeout(renderCraft, NETROLE === 'guest' ? 250 : 0); }));
  $('clist').querySelectorAll('button.vdef').forEach(b => b.addEventListener('click', () => { const v = +b.dataset.v; act('vdef', v); if (NETROLE === 'guest') me.veh = v; sfx('click'); setTimeout(renderCraft, NETROLE === 'guest' ? 250 : 0); }));
}
/* (round 22) 装备: pick the 4 quick weapons and the default vehicle; works anywhere */
function openKit() { if (!W || W.over) return; UI.kitSlot = UI.kitSlot || 0; renderKit(); $('kit').classList.remove('hidden'); toggleWpick(false); sfx('click'); }
function closeKit() { $('kit').classList.add('hidden'); }
function renderKit() {
  const me = W.p[ME], q = quickList(me), sl = clamp(UI.kitSlot || 0, 0, 3);
  $('kslots').innerHTML = [0, 1, 2, 3].map(j => `<button data-s="${j}" class="${j === sl ? 'sel' : ''}"><kbd>${j + 1}</kbd><b>${q[j] != null ? WPN[q[j]].name : '空'}</b></button>`).join('');
  $('kwpn').innerHTML = WPN.map((w, k) => { const own = me.owned[k], j = q.indexOf(k);
    return `<button data-w="${k}" class="kw${own ? '' : ' no'}${k === me.wpn ? ' cur' : ''}" ${own ? '' : 'disabled'}><b>${w.name}${j >= 0 ? ' <i>' + (j + 1) + '</i>' : ''}</b><small>${own ? (w.inf ? '∞' : me.mag[k] + ' / ' + me.ammo[k]) : '商店里造'}</small><span>${w.tag || ''}</span></button>`; }).join('');
  $('kveh').innerHTML = [1, 2, 3, 4, 5, 6].map(v => { const own = (me.vehs || 0) >> v & 1;
    return `<button data-v="${v}" class="${own ? '' : 'no'}${own && me.veh === v ? ' sel' : ''}" ${own ? '' : 'disabled'}><b>${VEH[v].name}</b><small>${own ? (me.veh === v ? '默认 ✓' : '设为默认') : '商店里造'}</small></button>`; }).join('');
  $('kshield').innerHTML = [0, 1].map(m => { const own = !m || me.shield, on = (me.melee === 1 && me.shield ? 1 : 0) === m; return `<button data-m="${m}" class="${on ? 'sel' : ''}${own ? '' : ' no'}" ${own ? '' : 'disabled'}><b>${m ? '防暴盾' : '刀'}</b><small>${!own ? '商店 → 武器 里买' : on ? '在用 ✓' : '换成它'}</small></button>`; }).join('');
  $('kshield').querySelectorAll('button[data-m]').forEach(b => b.onclick = () => { switchMelee(+b.dataset.m); renderKit(); });
  $('kslots').querySelectorAll('button').forEach(b => b.onclick = () => { UI.kitSlot = +b.dataset.s; renderKit(); sfx('click'); });
  $('kwpn').querySelectorAll('button[data-w]').forEach(b => b.onclick = () => {
    const k = +b.dataset.w, cur = quickList(me), j = cur.indexOf(k), s0 = clamp(UI.kitSlot || 0, 0, 3);
    if (j >= 0 && j !== s0) { cur[j] = cur[s0]; cur[s0] = k; } else if (j < 0) cur[s0] = k;
    SET.quick = cur.filter(x => x != null); saveSet(); UI.kitSlot = (s0 + 1) % 4; UI.wbK = ''; renderKit(); sfx('click');
  });
  $('kveh').querySelectorAll('button[data-v]').forEach(b => b.onclick = () => { const v = +b.dataset.v; act('vdef', v); if (NETROLE === 'guest') me.veh = v; sfx('click'); setTimeout(renderKit, NETROLE === 'guest' ? 250 : 0); });
}
/* pause / help / over */
function togglePause(force) {
  if (STATE.mode !== 'play') return;
  const el = $('pause'), open = force != null ? force : el.classList.contains('hidden');
  if (!$('help').classList.contains('hidden')) { closeHelp(); return; }
  if (!$('craft').classList.contains('hidden')) { closeCraft(); return; }
  if (!$('kit').classList.contains('hidden')) { closeKit(); return; }
  el.classList.toggle('hidden', !open);
  $('pauseT').innerHTML = (NETROLE === 'solo' ? '暂停' : '菜单（游戏继续中）') + ' <small style="font-size:11px;opacity:.6;font-weight:400">版本：' + BUILD_TAG + '</small>'; $('pQual').textContent = qualLabel(); $('pAssist').textContent = '辅助瞄准：' + assistLv().name;
  $('pHub').classList.toggle('hidden', !HUB);
  STATE.paused = open && NETROLE === 'solo';
}
/* ---------- big map: tap the minimap (or Tab) ---------- */
const BTYPE = { apt: ['公寓', '#c9a46a'], villa: ['别墅', '#b46a4a'], ware: ['仓库', '#7f8a96'], shop: ['超市', '#5a9a6a'], clinic: ['诊所', '#e8e2d6'], police: ['警局', '#4a6aa8'], garage: ['修车厂', '#a8783a'], barn: ['谷仓', '#8a5a3a'] };
const BTIP = { apt: '房间多，柜子和补给箱', villa: '柜子、背包', ware: '补给箱、油桶、军用箱', shop: '货架上的柜子，仓库里有补给', clinic: '背包和柜子（医疗包多）', police: '军用物资箱（弹药、手雷）', garage: '工具箱、废铁、汽车（零件和钢材）', barn: '杂物' };
function bigMapOpen() { return !$('bigmap').classList.contains('hidden'); }
function toggleBigMap(force) {
  if (STATE.mode !== 'play' || !W) return;
  const open = force != null ? force : !bigMapOpen();
  $('bigmap').classList.toggle('hidden', !open); STATE.paused = open && NETROLE === 'solo';
  if (open) { drawBigMap(); $('bmLeg').innerHTML = Object.entries(BTYPE).map(([k, [n, c]]) => `<span title="${BTIP[k]}"><i style="background:${c}"></i>${n}：${BTIP[k]}</span>`).join('') + '<span><i style="background:#7fd36b"></i>营地</span><span><i style="background:#ff3b2f;border-radius:50%"></i>丧尸</span><span><i style="background:#9aa0a6"></i>汽车</span>'; }
  sfx('click');
}
function drawBigMap() {
  const cv = $('bigmapC'); if (!cv || !MM.base) return; const g = cv.getContext('2d'), S = cv.width / MW, R = CAM.yaw;
  const rot = (x, y) => { const cx = cv.width / 2, cy = cv.height / 2, dx = x * S - cx, dy = y * S - cy; return [cx + dx * Math.cos(R) - dy * Math.sin(R), cy + dx * Math.sin(R) + dy * Math.cos(R)]; };
  g.save(); g.clearRect(0, 0, cv.width, cv.height);
  g.translate(cv.width / 2, cv.height / 2); g.rotate(R); g.translate(-cv.width / 2, -cv.height / 2);
  g.imageSmoothingEnabled = false; g.globalAlpha = 0.85; g.drawImage(MM.base, 0, 0, cv.width, cv.height); g.globalAlpha = 1;
  TOWN_HOUSES.forEach(([x0, y0, x1, y1, st, t]) => { const c = (BTYPE[t] || ['', '#888'])[1]; g.fillStyle = c; g.globalAlpha = 0.8; g.fillRect(x0 * S, y0 * S, (x1 - x0 + 1) * S, (y1 - y0 + 1) * S); g.globalAlpha = 1; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.5; g.strokeRect(x0 * S, y0 * S, (x1 - x0 + 1) * S, (y1 - y0 + 1) * S); });
  if (!modeDef().anyBuild) g.strokeStyle = 'rgba(255,207,107,.8)', g.lineWidth = 2, g.strokeRect((W.radio.x - BUILD_R) * S, (W.radio.y - BUILD_R) * S, (BUILD_R * 2 + 1) * S, (BUILD_R * 2 + 1) * S);
  g.fillStyle = 'rgba(127,211,107,.85)'; g.fillRect((W.radio.x - 6) * S, (W.radio.y - 5) * S, 13 * S, 11 * S);
  for (let i = 0; i < NC; i++) { const b = W.blk[i]; if (b !== 25 && b !== 38) continue; g.fillStyle = W.srch.has(i) ? '#4a4a4a' : b === 38 ? '#e05a5a' : '#c8ccd0'; g.fillRect(cx_(i) * S - 2, cy_(i) * S - 2, 4, 4); }
  g.fillStyle = '#ff3b2f'; for (const z of W.zs) if (zSeen(z)) g.fillRect(z.x * S - 2, z.y * S - 2, 4, 4); /* (round 34d) only what someone can see */
  g.restore();
  // labels and players upright on top
  g.font = '600 13px ' + getComputedStyle(document.body).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle';
  TOWN_HOUSES.forEach(([x0, y0, x1, y1, st, t]) => { const [px, py] = rot((x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2), lab = (BTYPE[t] || [t])[0] + (st > 1 ? ' ' + st + '层' : ''); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(lab, px, py); g.fillStyle = '#fff'; g.fillText(lab, px, py); });
  for (const m of modeMarks()) { const [px, py] = rot(m.x, m.y); g.fillStyle = m.c; g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 2;
    if (m.r) { g.globalAlpha = 0.25; g.beginPath(); g.arc(px, py, m.r * S, 0, 7); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(px, py, m.r * S, 0, 7); g.strokeStyle = m.c; g.stroke(); }
    else { g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.stroke(); if (m.ring) { g.beginPath(); g.arc(px, py, m.ring * S, 0, 7); g.strokeStyle = m.c; g.stroke(); } }
    g.font = '700 12px ' + getComputedStyle(document.body).fontFamily; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(m.n, px, py - 14); g.fillStyle = m.c; g.fillText(m.n, px, py - 14); }
  { const [px, py] = rot(W.radio.x + 0.5, W.radio.y + 0.5); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText('营地', px, py); g.fillStyle = '#d8ffcc'; g.fillText('营地', px, py); }
  // (round 31) players: big arrows (you: white with a halo), name tags in a dark pill; a fallen teammate shows as a grey cross
  const ff = getComputedStyle(document.body).fontFamily, order = W.p.filter(p => !p.gone).sort((a, b) => (a.i === ME) - (b.i === ME));
  for (const p of order) { const [px, py] = rot(p.x, p.y), mine = p.i === ME; playerMark(g, px, py, p.aim + R, p, mine, 1.6);
    const lab = mine ? '你' : p.name + (p.dead ? ' ✝' : ''); g.font = '700 13px ' + ff; const w = g.measureText(lab).width + 12; g.fillStyle = 'rgba(0,0,0,.72)'; g.beginPath(); g.roundRect ? g.roundRect(px - w / 2, py - 34, w, 19, 9) : g.rect(px - w / 2, py - 34, w, 19); g.fill();
    g.fillStyle = mine ? '#fff' : PCOL[p.i % 2].j; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lab, px, py - 24.5); }
}
/* ---------- modes and maps: picker (title / lobby), objective panel ---------- */
const curMode = () => MODES[SET.mode] ? SET.mode : 'siege';
const curMap = () => MAPS[SET.map] ? SET.map : MODES[curMode()].map;
function uiModeLbl() {
  const m = MODES[curMode()], mp = MAPS[curMap()];
  $('modeLbl').textContent = m.icon + ' ' + m.name + ' ›'; $('mapLbl').textContent = '地图：' + mp.name + ' · 点这里换模式 / 地图';
  const gm = NETROLE === 'guest' ? (MODES[NET.mode] || MODES.classic) : m, gp = NETROLE === 'guest' ? (MAPS[NET.map] || MAPS[gm.map]) : mp;
  if ($('lModeLbl')) { $('lModeLbl').textContent = gm.icon + ' ' + gm.name; $('lMapLbl').textContent = '地图：' + gp.name + (NETROLE === 'host' ? ' · 点这里更换' : ''); $('lModeBtn').disabled = NETROLE === 'guest'; $('lModeNote').textContent = NETROLE === 'guest' ? '（房主决定）' : ''; }
}
const MAPTHUMB = {};
function mapThumb(id, cv) { // a little rendered overview of the map (generated once, cached)
  const paint = () => { const img = MAPTHUMB[id]; if (img) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, cv.width, cv.height); } };
  if (MAPTHUMB[id]) return paint();
  setTimeout(() => {
    const keep = MAP_ID; setMap(id); const m = genMap(31337); const c = document.createElement('canvas'); c.width = MW; c.height = MH; const g = c.getContext('2d');
    const MC = Object.assign({ [TT.grass]: '#55733e', [TT.hill]: '#7a8a5a', [TT.dirt]: '#6e5a42', [TT.road]: '#3c3d40', [TT.sand]: '#8a7f5a', [TT.forest]: '#3c5530', [TT.water]: '#2a6a86', [TT.mud]: '#4a3b2a', [TT.meadow]: '#6a8440', [TT.rocky]: '#6e6c62' }, MAPDEF.mc || {});
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { g.fillStyle = MC[m.tt[y * MW + x]] || '#555'; if (m.G[y * MW + x] >= 1) g.fillStyle = MC[TT.hill]; g.fillRect(x, y, 1, 1); }
    for (const [x0, y0, x1, y1, st, t] of TOWN_HOUSES) { g.fillStyle = (BTYPE[t] || ['', '#888'])[1]; g.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1); }
    g.fillStyle = '#7fd36b'; g.fillRect(RADIO_XY[0] - 6, RADIO_XY[1] - 5, 13, 11);
    setMap(keep); MAPTHUMB[id] = c; paint();
  }, 30);
}
function openModeSel() {
  if (NETROLE === 'guest') return;
  const draw = () => {
    $('mGrid').innerHTML = MODE_IDS.map(k => { const m = MODES[k]; return `<button class="mcard ghost${k === curMode() ? ' sel' : ''}" data-m="${k}"><b>${m.icon} ${m.name}</b><p>${m.desc}</p><i>推荐地图：${MAPS[m.map].name}</i></button>`; }).join('');
    $('mapGrid').innerHTML = MAP_IDS.map(k => `<button class="mapcard ghost${k === curMap() ? ' sel' : ''}" data-p="${k}"><canvas width="160" height="160"></canvas><b>${MAPS[k].name}${MODES[curMode()].map === k ? ' <em>推荐</em>' : ''}</b><p>${MAPS[k].desc}</p></button>`).join('');
    $('mapHint').textContent = '每种模式在哪张图上都能玩';
    $('mGrid').querySelectorAll('.mcard').forEach(b => b.onclick = () => { SET.mode = b.dataset.m; SET.map = MODES[SET.mode].map; saveSet(); sfx('click'); draw(); });
    $('mapGrid').querySelectorAll('.mapcard').forEach(b => { mapThumb(b.dataset.p, b.querySelector('canvas')); b.onclick = () => { SET.map = b.dataset.p; saveSet(); sfx('click'); draw(); }; });
  };
  draw(); $('modesel').classList.remove('hidden');
}
function closeModeSel() { $('modesel').classList.add('hidden'); uiModeLbl(); if (NETROLE === 'host') sendLobby(); if (STATE.mode === 'title' && (!W || W.demo) && MAP_ID !== curMap()) startDemo(); }
function uiObjective() {
  const el = $('objp'), h = W && modeHud(); if (!h) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden'); el.classList.toggle('boss', !!h.boss);
  $('objI').textContent = MODES[W.mode].icon + ' ' + MODES[W.mode].name; $('objT').textContent = h.t; $('objS').textContent = h.s || ''; $('objB').style.width = Math.round(clamp(h.p || 0, 0, 1) * 100) + '%';
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
  closeCraft(); closeKit(); $('pause').classList.add('hidden');
  if (W.p[ME] && W.p[ME].build) toggleBuild(false);
}
function initUI() {
  $('nameIn').value = SET.name || '';
  $('nameIn').addEventListener('input', () => { SET.name = $('nameIn').value.trim().slice(0, 10); saveSet(); });
  diffButtons($('diffSeg')); diffButtons($('lDiffSeg'), () => { if (NETROLE === 'host') sendLobby(); });
  markDiff();
  $('soloBtn').onclick = () => {
    const b = $('soloBtn');
    const n = newRunSlot(t => titleStatus(t)); if (!n) return; SLOT = n; // (round 27) an empty slot; never overwrites without asking
    audioInit(); netLeave(); NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0, SET.mode, SET.map);
  };
  $('hostBtn').onclick = () => { audioInit(); netHost(); };
  $('joinBtn').onclick = () => { audioInit(); netJoin($('codeIn').value); };
  $('codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('joinBtn').click(); });
  $('helpBtn').onclick = openHelp; $('pHelp').onclick = openHelp; $('helpClose').onclick = closeHelp;
  $('hubBtn').onclick = () => { location.href = '../'; };
  $('lReady').onclick = () => { NET.ready = !NET.ready; netSendCtl({ t: 'ready', v: NET.ready }); lobbyUI(); sfx('ready'); };
  $('lStart').onclick = () => hostStart();
  $('lLeave').onclick = () => { netLeave(); showScreen('title'); };
  $('craftClose').onclick = closeCraft; $('kitClose').onclick = closeKit;
  $('resumeBtn').onclick = () => togglePause(false);
  confirmBtn($('pTitle'), () => { saveGame(true); netLeave(); W = null; STATE.paused = false; showScreen('title'); renderBest(); });
  $('pSave').onclick = () => { if (NETROLE === 'guest') { toast('联机时由房主存档'); return; } saveGame(false); sfx('click'); };
  $('contBtn').onclick = () => continueGame();
  confirmBtn($('pHub'), () => { netLeave(); location.href = '../'; });
  $('pauseBtn').onclick = () => togglePause();
  $('muteBtn').onclick = () => { setMute(!SET.mute); uiMute(); };
  $('pMute').onclick = () => { setMute(!SET.mute); uiMute(); };
  $('modeBtn').onclick = () => { sfx('click'); openModeSel(); }; $('lModeBtn').onclick = () => { sfx('click'); openModeSel(); }; $('msOk').onclick = () => { sfx('click'); closeModeSel(); }; uiModeLbl();
  $('mini').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); toggleBigMap(true); });
  $('bigmap').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); toggleBigMap(false); });
  // (round 36b) the shop and the gear panel close like the map: tap / click anywhere outside the card
  for (const [id, close] of [['craft', () => closeCraft()], ['kit', () => closeKit()]]) $(id).addEventListener('pointerdown', e => { if (e.target !== e.currentTarget) return; e.stopPropagation(); e.preventDefault(); close(); });
  $('keys').addEventListener('pointerdown', e => { e.stopPropagation(); if (!e.target.closest('.kh')) return; SET.keysOff = !SET.keysOff; saveSet(); UI.keysK = ''; if (W && W.p[ME]) uiKeys(W.p[ME]); sfx('click'); });
  $('pAssist').onclick = () => { SET.assist = ((SET.assist == null ? 1 : SET.assist) + 1) % 3; saveSet(); $('pAssist').textContent = '辅助瞄准：' + assistLv().name; sfx('click'); };
  $('pQual').onclick = () => { const o = ['auto', 0, 1, 2], i = o.indexOf(SET.q == null ? 'auto' : SET.q); SET.q = o[(i + 1) % 4]; if (SET.q === 'auto') SET.qa = 0; saveSet(); applyQual(); $('pQual').textContent = qualLabel(); sfx('click'); };
  $('readyBtn').onclick = () => inGame() && toggleReady();
  $('tasks').addEventListener('pointerdown', e => { e.stopPropagation(); UI.tkPin = !UI.tkPin; UI.tkOpenT = 0; sfx('click'); });
  $('oAgain').onclick = () => { $('over').classList.add('hidden'); SLOT = freeSlot() || SLOT; /* (round 27) the run that just ended keeps its slot unless there's a free one */ if (NETROLE === 'host') { if (!NET.gctl || !NET.gctl.open) { NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0, W ? W.mode : SET.mode, W ? W.map : SET.map); } else hostStart(); } else startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0, W ? W.mode : SET.mode, W ? W.map : SET.map); };
  $('oLobby').onclick = () => { netSendCtl({ t: 'toLobby' }); backToLobby(); };
  $('oEndless').onclick = () => { $('over').classList.add('hidden'); W.endless = true; W.over = null; W.phase = 'night'; dawn(); };
  $('oTitle').onclick = () => { netLeave(); W = null; showScreen('title'); };
  $('oHub').onclick = () => { netLeave(); location.href = '../'; };
  if (inArtifact()) { $('coopBox').classList.add('hidden'); $('artNote').classList.remove('hidden'); }
  uiMute(); renderBest();
}
