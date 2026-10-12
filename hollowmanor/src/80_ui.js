/* ================= DOM UI: screens, HUD, modals, overlays ================= */
const UI = { modal: null, lastSeq: 0, log: [], pings: [], bubbles: [], best: null, dialSel: 0, hudT: 0, tagEls: {} };
const $ = id => document.getElementById(id);
function showScreen(s) {
  STATE.mode = s;
  for (const id of ['title', 'lobby', 'result']) $(id).classList.toggle('hidden', id !== s);
  $('hud').classList.toggle('hidden', s !== 'play');
  $('touchUI').classList.toggle('hidden', !(s === 'play' && IS_TOUCH));
  if (s !== 'play') { closeModal(); $('quickPanel').classList.add('hidden'); }
  $('hubBtn').classList.toggle('hidden', !HUB || s !== 'title');
}
function toast(t, c) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; if (c) d.style.color = c; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
/* ---------- title + lobby ---------- */
function lobbyUI(status) {
  if (status != null) { $('tStatus').textContent = status; $('lStatus').textContent = status; }
  const inRoom = (NETROLE === 'host' && NET.peer && NET.peer.open) || (NETROLE === 'guest' && NET.ctl && NET.ctl.open);
  if (STATE.mode === 'play' || STATE.mode === 'result') return;
  if (!inRoom) { if (STATE.mode === 'lobby') showScreen('title'); return; }
  if (STATE.mode !== 'lobby') showScreen('lobby');
  $('lCode').textContent = NET.code || '····';
  const myIdx = NETROLE === 'host' ? 0 : 1, names = [SET.name || '房主', NETROLE === 'host' ? (NET.guestName || '') : (SET.name || '我')];
  if (NETROLE === 'guest') names[0] = NET.hostName || '房主';
  const guestHere = NETROLE === 'guest' || !!(NET.gctl && NET.gctl.open && NET.guestName !== undefined && NET.gctl);
  for (const r of ['L', 'S']) {
    const i = NET.roles.indexOf(r), el = $('pl' + r);
    if (i === 1 && !guestHere) { el.textContent = '等待同伴…'; el.className = 'pl'; continue; }
    el.textContent = (i === myIdx ? '你' : names[i] || '同伴') + (NET.ready[i] || i === 0 ? '' : ' · 未准备');
    el.className = 'pl' + (i === myIdx ? ' me' : '');
  }
  $('startBtn').classList.toggle('hidden', NETROLE !== 'host'); $('readyBtn').classList.toggle('hidden', NETROLE !== 'guest');
  $('readyBtn').textContent = NET.ready[1] ? '取消准备' : '准备';
  const canStart = NETROLE === 'host' && NET.gctl && NET.gctl.open && NET.ready[1];
  $('startBtn').disabled = !canStart;
  if (status == null) $('lStatus').textContent = NETROLE === 'host' ? (!(NET.gctl && NET.gctl.open) ? '把房间码发给同伴，等待加入…' : !NET.ready[1] ? '同伴已加入，等待对方准备' : '都准备好了') : NET.ready[1] ? '等待房主开始…' : '准备好了就点「准备」';
}
function initMenus() {
  $('nameIn').value = SET.name || '';
  $('nameIn').addEventListener('input', () => { SET.name = $('nameIn').value.trim().slice(0, 10); saveSet(); });
  $('hostBtn').onclick = () => { audioInit(); netHost(); };
  $('joinBtn').onclick = () => { audioInit(); netJoin($('codeIn').value); };
  $('codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('joinBtn').click(); });
  if (QS.get('room')) $('codeIn').value = QS.get('room').toUpperCase();
  $('leaveBtn').onclick = () => { netLeave(); showScreen('title'); lobbyUI(''); };
  $('swapBtn').onclick = () => { if (NETROLE === 'host') { NET.roles = [NET.roles[1], NET.roles[0]]; NET.ready = [false, false]; sendLobby(); lobbyUI(); } else netSendCtl({ t: 'role', v: NET.roles[0] }); };
  $('readyBtn').onclick = () => { NET.ready[1] = !NET.ready[1]; netSendCtl({ t: 'ready', v: NET.ready[1] }); lobbyUI(); };
  $('startBtn').onclick = () => hostStart();
  $('helpBtn').onclick = () => openModal('help');
  $('setBtn').onclick = () => openModal('mPause', true);
  for (const b of document.querySelectorAll('.muteBtn')) b.onclick = () => { audioInit(); setMute(!AU.muted); };
  setMute(AU.muted);
  $('jBtn').onclick = () => toggleJournal(); $('pBtn').onclick = () => togglePause();
  $('resumeBtn').onclick = () => closeModal();
  $('lobbyBtn').onclick = () => { if (NETROLE === 'host') { netSendCtl({ t: 'toLobby' }); backToLobby(); } else if (NETROLE === 'guest') { netLeave(); showScreen('title'); lobbyUI(''); } else { showScreen('title'); } closeModal(); };
  const hub = () => { location.href = '../'; };
  $('hubBtn').onclick = hub;
  $('hubBtn2').onclick = e => { const b = e.currentTarget; if (STATE.mode === 'play' && !b.dataset.arm) { b.dataset.arm = '1'; b.textContent = '再点一次确认'; setTimeout(() => { delete b.dataset.arm; b.textContent = '返回游戏厅'; }, 2500); return; } netLeave(); hub(); };
  $('hubBtn2').classList.toggle('hidden', !HUB);
  $('volIn').value = SET.vol; $('volIn').oninput = () => { SET.vol = +$('volIn').value; saveSet(); if (AU.master && !AU.muted) AU.master.gain.value = SET.vol; };
  const seg = (id, key, conv) => { const el = $(id); const upd = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('sel', String(conv ? (SET[key] ? '1' : '0') : SET[key]) === b.dataset.v)); el.onclick = e => { const b = e.target.closest('button'); if (!b) return; SET[key] = conv ? b.dataset.v === '1' : b.dataset.v; saveSet(); upd(); if (key === 'quality') toast('画质设置会在下次进入时生效'); }; upd(); };
  seg('qSeg', 'quality'); seg('gSeg', 'grain', 1); seg('sSeg', 'shake', 1);
  $('rAgain').onclick = () => { if (NETROLE === 'host') { netSendCtl({ t: 'toLobby' }); backToLobby(); } else $('rStatus').textContent = '等待房主…'; };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeModal());
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('pointerdown', e => { if (e.target === m) closeModal(); }));
  // quick chat + glyph buttons
  $('quickPanel').innerHTML = QUICK.map((q, i) => `<button data-q="${q.k}" style="border-color:${q.c}">${i + 1} · ${q.t}</button>`).join('');
  $('quickPanel').onclick = e => { const b = e.target.closest('[data-q]'); if (b) requestQuick(b.dataset.q); };
  $('glyphBtns').innerHTML = GLYPHS.map((g, i) => `<button data-g="${i}">${g}</button>`).join('');
  $('glyphBtns').onclick = e => { const b = e.target.closest('[data-g]'); if (b) requestGlyph(+b.dataset.g); };
  $('dials').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; const i = +b.dataset.i; UI.dialSel = i; requestDial(i, W.dials[i] + +b.dataset.d); renderDials(); };
  $('altarItems').onclick = e => { const b = e.target.closest('[data-it]'); if (!b) return; requestRitual(b.dataset.it); closeModal(); };
}
/* ---------- modals ---------- */
function openModal(id, fromTitle) { closeModal(); UI.modal = id; $(id).classList.remove('hidden'); if (id === 'mRune') renderDials(); if (id === 'mJournal') renderJournal(); if (id === 'mAltar') renderAltar(); if (id === 'mPause') { $('lobbyBtn').classList.toggle('hidden', !!fromTitle); $('hubBtn2').classList.toggle('hidden', !!fromTitle || !HUB); $('resumeBtn').textContent = fromTitle ? '好' : '继续'; } INP.eHeld = false; }
function closeModal() { if (UI.modal) $(UI.modal).classList.add('hidden'); UI.modal = null; }
function toggleJournal() { if (UI.modal === 'mJournal') closeModal(); else if (STATE.mode === 'play') openModal('mJournal'); }
function toggleGlyphs() { if (UI.modal === 'mGlyph') closeModal(); else if (STATE.mode === 'play') openModal('mGlyph'); }
function togglePause() { if (UI.modal) closeModal(); else if (STATE.mode === 'play') openModal('mPause'); }
function modalKey(k, e) {
  if (k === 'Escape') { closeModal(); return; }
  if (UI.modal === 'mJournal' && (k === 'j' || k === 'Tab')) { closeModal(); return; }
  if (UI.modal === 'mGlyph') { if (k === 'g') closeModal(); else if ('123456'.includes(k)) requestGlyph(+k - 1); return; }
  if (UI.modal === 'mRune') {
    if (k === 'ArrowLeft' || k === 'a') UI.dialSel = (UI.dialSel + 3) % 4;
    if (k === 'ArrowRight' || k === 'd') UI.dialSel = (UI.dialSel + 1) % 4;
    if (k === 'ArrowUp' || k === 'w') requestDial(UI.dialSel, W.dials[UI.dialSel] + 1);
    if (k === 'ArrowDown' || k === 's') requestDial(UI.dialSel, W.dials[UI.dialSel] + 5);
    if (k === 'e') closeModal();
    renderDials(); return;
  }
  if (UI.modal === 'mAltar' && '1234'.includes(k)) { const b = $('altarItems').querySelectorAll('button')[+k - 1]; if (b) b.click(); }
}
function renderDials() { $('dials').innerHTML = W.dials.map((v, i) => `<div class="dial ${i === UI.dialSel ? 'f' : ''}"><button data-i="${i}" data-d="1">▲</button><div class="gl">${GLYPHS[v]}</div><button data-i="${i}" data-d="5">▼</button></div>`).join(''); }
function renderAltar() { const its = W.inv.filter(k => RITUAL_ITEMS.includes(k)); $('altarItems').innerHTML = its.map((k, i) => `<button data-it="${k}"><span>${ITEMS[k].icon}</span>${i + 1} · ${ITEMS[k].name}</button>`).join('') || '<div style="color:var(--sub)">没有可以献上的遗物</div>'; }
function candidates() { const f = Object.keys(W.evFound); return Object.keys(GHOSTS).filter(k => f.every(e => GHOSTS[k].ev.includes(e))); }
function renderJournal() {
  $('jEv').innerHTML = Object.entries(EVID).map(([k, e]) => `<div class="ev ${W.evFound[k] ? 'on' : ''}"><div class="ic">${e.icon}</div><div>${e.name}${W.evFound[k] ? '　✔' : ''}<small>${e.desc}（${ROLES[e.who].name}）</small></div></div>`).join('');
  const cand = candidates(), sure = Object.keys(W.evFound).length >= 2 && cand.length === 1;
  $('jGhosts').innerHTML = Object.entries(GHOSTS).map(([k, g]) => { const c = cand.includes(k) ? (sure ? 'yes' : '') : 'no'; return `<div class="n ${c}">${g.name}${sure && c === 'yes' ? '　← 就是它' : ''}<div style="font-size:12px;color:var(--sub)">${g.desc}</div></div><div class="${c}">${g.ev.map(e => EVID[e].icon).join(' ')}</div><div class="${c}" title="惧怕">${ITEMS[g.item].icon} ${ITEMS[g.item].name}</div>`; }).join('');
  $('jObj').innerHTML = objectives().map(o => `<div class="${o.done ? 'd' : ''}">${o.done ? '✔' : '○'} ${o.t}</div>`).join('');
  $('jHints').innerHTML = hints().map(h => `<div>· ${h}</div>`).join('');
}
function objectives() {
  const n = Object.keys(W.evFound).length, hasRit = W.inv.some(k => RITUAL_ITEMS.includes(k));
  return [
    { t: '收集证据，确认怨灵种类（' + Math.min(n, 2) + '/2）', done: n >= 2 },
    { t: '找到它惧怕的遗物', done: hasRit && n >= 2 && W.inv.includes(GHOSTS[candidates()[0]] ? GHOSTS[candidates()[0]].item : '') },
    { t: '同时拉下客厅和餐厅的两根拉杆，打开祈祷室', done: !!W.f.chapel },
    { t: '在祭坛举行驱灵仪式（灵视者主持，持灯者守护）', done: !W.f.seal },
    { t: '一起登上门厅的楼梯', done: W.phase === 'won' },
  ];
}
function hints() {
  const h = [];
  if (!W.f.study) h.push('书房的门上有符文锁。密码写在某面墙上，只有灵视者能看见；只有持灯者能转动转盘。');
  if (!W.f.power) h.push(W.f.shelf ? '杂物间里有保险丝盒，缺一根保险丝。恢复电力能打开温室，房间亮起来也不那么可怕。' : '温室的卷帘门需要电。客厅里有个书架后面在漏风——灵视者看得见。');
  if (!W.f.chapel) h.push('祈祷室的铁门由两根拉杆控制：一根在客厅，一根在餐厅，要同时拉下。');
  if (W.f.burned.length) h.push('已经烧掉：' + W.f.burned.map(k => ITEMS[k].icon + ITEMS[k].name).join('、') + '。');
  h.push('灯开始乱闪就是猎杀的前兆：躲进柜子，或者用强光定住它。');
  return h;
}
/* ---------- HUD ---------- */
function curObjective() { const o = objectives().find(x => !x.done); return o ? o.t : ''; }
function updateHUD(me, dt) {
  UI.hudT -= dt; const slow = UI.hudT <= 0; if (slow) UI.hudT = 0.2;
  const o = W.p[1 - ME];
  if (slow) {
    $('hBadge').innerHTML = `<span style="color:${ROLES[me.role].color}">${ROLES[me.role].name}</span><small>${me.name}</small>`;
    $('battRow').classList.toggle('hidden', me.role !== 'L');
    const ob = curObjective(); const hd = W.f.seal === 0 && W.phase === 'play' ? '<small>灵封碎了——回到门厅的楼梯</small>' : '';
    $('obj').innerHTML = ob + hd;
    $('hInv').innerHTML = W.inv.map(k => `<div class="slot" title="${ITEMS[k].name}">${ITEMS[k].icon}</div>`).join('') + Object.keys(W.evFound).map(k => `<div class="slot" style="border-color:rgba(143,211,255,.5);font-size:18px" title="${EVID[k].name}">${EVID[k].icon}</div>`).join('');
    $('partnerRow').innerHTML = `<span style="color:${ROLES[o.role].color}">${ROLES[o.role].name}</span>　${o.down ? '<b style="color:#ff6b6b;width:auto">倒地 ' + Math.max(0, o.downT) + 's</b>' : o.hide >= 0 ? '躲在柜子里' : '恐惧 ' + Math.round(o.fear)}${W.dc ? '　<b style="color:#ff6b6b;width:auto">断线</b>' : ''}`;
    if (UI.modal === 'mJournal') renderJournal();
    if (UI.modal === 'mRune' && W.f.study) closeModal();
  }
  $('fearBar').firstChild.style.width = me.fear + '%'; $('stamBar').firstChild.style.width = me.stam / BAL.stamMax * 100 + '%'; $('battBar').firstChild.style.width = me.batt * 100 + '%';
  $('battBar').firstChild.style.opacity = me.batt < BAL.boostCost ? 0.45 : 1;
  // prompt
  const pr = promptFor(me, UI.best, W);
  const pe = $('prompt');
  if (pr && !UI.modal) { pe.classList.remove('hidden'); pe.classList.toggle('no', !pr.ok); $('pText').textContent = pr.t; $('pKey').textContent = IS_TOUCH ? '✋' : 'E'; const prog = me.act && UI.best && me.act.id === UI.best.id ? me.act.p : 0; $('pRing').setAttribute('stroke-dashoffset', 113 * (1 - prog)); }
  else pe.classList.add('hidden');
  // downed / hidden banners
  const db = $('downBanner');
  if (me.down) { db.classList.remove('hidden'); db.innerHTML = `<b>${Math.max(0, me.downT)}</b>你倒下了……慢慢爬向同伴，等待被扶起`; } else if (o.down) { db.classList.remove('hidden'); db.innerHTML = `<b style="color:#ffcf6b">${Math.max(0, o.downT)}</b>${ROLES[o.role].name}倒下了！快去扶起来`; } else db.classList.add('hidden');
  $('hidden').classList.toggle('hidden', me.hide < 0);
  $('tBoost').classList.toggle('hidden', me.role !== 'L'); $('tGlyph').classList.toggle('hidden', me.role !== 'S');
  updateOverlays(me, dt);
}
/* name tags, pings, bubbles, partner arrow */
function overlayEl(key, cls, html) { let e = UI.tagEls[key]; if (!e) { e = document.createElement('div'); e.className = cls; $('tags').appendChild(e); UI.tagEls[key] = e; } if (html != null && e._h !== html) { e.innerHTML = html; e._h = html; } return e; }
function dropEl(key) { const e = UI.tagEls[key]; if (e) { e.remove(); delete UI.tagEls[key]; } }
function updateOverlays(me, dt) {
  const o = W.p[1 - ME], now = performance.now();
  // partner tag
  const s = toScreen(o.x, o.down ? 0.7 : 1.9, o.z), col = ROLES[o.role].color;
  const tag = overlayEl('ptag', 'tag3d', `<span style="color:${col}">${o.name}</span>${o.down ? ' <b style="color:#ff6b6b">✚ ' + Math.max(0, o.downT) + '</b>' : ''}`);
  const onScr = s.on && s.x > 30 && s.x < innerWidth - 30 && s.y > 60 && s.y < innerHeight - 40;
  tag.style.display = onScr && o.hide < 0 ? 'block' : 'none'; tag.style.left = s.x + 'px'; tag.style.top = s.y + 'px';
  const arr = overlayEl('parr', 'edgeArrow'); arr.style.setProperty('--c', o.down ? '#ff6b6b' : col);
  if (!onScr) { const cx = innerWidth / 2, cy = innerHeight / 2, a = Math.atan2(s.y - cy, s.x - cx), R = Math.min(cx, cy) - 50; arr.style.display = 'block'; arr.style.left = cx + Math.cos(a) * R - 9 + 'px'; arr.style.top = cy + Math.sin(a) * R - 8 + 'px'; arr.style.transform = `rotate(${a + HP}rad)`; } else arr.style.display = 'none';
  // pings
  UI.pings = UI.pings.filter(p => now - p.t < 6000);
  const keep = new Set();
  for (const p of UI.pings) { const k = 'ping' + p.id; keep.add(k); const e = overlayEl(k, 'ping', '<i></i><b></b>'); e.style.setProperty('--c', p.c); const ss = toScreen(p.x, 0.3, p.z); e.style.left = clamp(ss.x, 20, innerWidth - 20) + 'px'; e.style.top = clamp(ss.y, 60, innerHeight - 20) + 'px'; e.style.opacity = 1 - Math.max(0, (now - p.t - 4500) / 1500); }
  UI.bubbles = UI.bubbles.filter(b => now - b.t < 3800);
  for (const b of UI.bubbles) { const k = 'bub' + b.id; keep.add(k); const pl = W.p[b.by]; const e = overlayEl(k, 'bubble', b.html); const ss = toScreen(pl.x, 2.3, pl.z); e.style.left = clamp(ss.x, 60, innerWidth - 60) + 'px'; e.style.top = clamp(ss.y, 80, innerHeight - 20) + 'px'; e.style.opacity = 1 - Math.max(0, (now - b.t - 3000) / 800); }
  for (const k of Object.keys(UI.tagEls)) if ((k.startsWith('ping') || k.startsWith('bub')) && !keep.has(k)) dropEl(k);
}
function addLog(txt, c) { if (!txt) return; const el = document.createElement('div'); el.textContent = txt; if (c) el.style.borderLeftColor = c, el.style.color = c; $('log').appendChild(el); while ($('log').children.length > 4) $('log').firstChild.remove(); setTimeout(() => { el.style.transition = 'opacity 1s'; el.style.opacity = 0; setTimeout(() => el.remove(), 1000); }, 7000); }
/* ---------- events (host and guest run the same code) ---------- */
let bubId = 0;
function processEvents() {
  for (const e of W.E) {
    if (e.s <= UI.lastSeq) continue; UI.lastSeq = e.s;
    if (e.to != null && e.to >= 0 && e.to !== ME) continue;
    switch (e.k) {
      case 'snd': sfx(e.n, e.x, e.z, e.v); break;
      case 'msg': addLog(e.txt, e.c); break;
      case 'ui': if (e.ui === 'close') { if (UI.modal === 'mRune') closeModal(); } else openModal(e.ui === 'rune' ? 'mRune' : 'mAltar'); break;
      case 'ping': UI.pings.push({ id: ++bubId, x: e.x, z: e.z, t: performance.now(), c: e.by === ME ? '#e2b45c' : ROLES[W.p[e.by].role].color }); sfx('ping', e.x, e.z, 0.8); break;
      case 'quick': { const q = QUICK.find(x => x.k === e.q); UI.bubbles.push({ id: ++bubId, by: e.by, t: performance.now(), html: `<span style="color:${q.c}">${q.t}</span>` }); sfx('quick'); if (e.by !== ME) addLog(W.p[e.by].name + '：' + q.t, q.c); break; }
      case 'glyph': UI.bubbles.push({ id: ++bubId, by: e.by, t: performance.now(), html: `<span class="g">${GLYPHS[e.g]}</span>` }); sfx('quick'); if (e.by !== ME) addLog(W.p[e.by].name + ' 发来符文：' + GLYPHS[e.g], '#8fd3ff'); break;
      case 'evidence': break;
      case 'fx':
        if (e.fx === 'hunt') { R3.shake = Math.max(R3.shake, 0.6); }
        if (e.fx === 'power') toast('电力恢复了', '#ffd36b');
        if (e.fx === 'banish') { R3.flash = 1; R3.flash2 = 0.9; toast('怨灵消散了', '#c8a8ff'); }
        if (e.fx === 'wrong') { R3.shake = 1.2; }
        if (e.fx === 'caught' && e.who === ME) R3.shake = 1.5;
        break;
      case 'end': showResult(e.phase, e.why); break;
    }
  }
}
function showResult(phase, why) {
  closeModal();
  setTimeout(() => {
    if (STATE.mode !== 'play') return;
    showScreen('result'); sfx(phase === 'won' ? 'win' : 'lose');
    $('rTitle').textContent = phase === 'won' ? '上楼' : '永夜'; $('rTitle').style.color = phase === 'won' ? '#e8d7a8' : '#d0453f';
    $('rWhy').textContent = why || '';
    const m = Math.floor(W.t / 60), s2 = Math.floor(W.t % 60);
    $('rStats').innerHTML = `<div>用时　<b>${m} 分 ${s2} 秒</b></div><div>怨灵　<b>${GHOSTS[W.setup.gtype].name}</b></div><div>经历猎杀　<b>${W.stats ? W.stats.hunts : '-'}</b></div><div>强光定住　<b>${W.stats ? W.stats.stuns : '-'}</b></div><div>倒地次数　<b>${W.stats ? W.stats.downs : '-'}</b></div><div>证据　<b>${Object.keys(W.evFound).map(k => EVID[k].icon).join(' ') || '无'}</b></div>`;
    $('rAgain').textContent = NETROLE === 'host' ? '返回房间' : '等待房主'; $('rAgain').disabled = NETROLE !== 'host'; $('rStatus').textContent = phase === 'won' ? '二楼……敬请期待。' : '';
  }, phase === 'won' ? 1800 : 2600);
}
