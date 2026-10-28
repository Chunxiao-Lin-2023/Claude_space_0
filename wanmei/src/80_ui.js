/* ================= UI: MMO-style HUD, nameplates, minimap, dialogue, modals ================= */
const UI = { modal: null, target: null, choice: null, chatOpen: false, dirty: true, plates: new Map(), portraits: {}, mapImg: null, toastT: 0, bannerT: 0 };
const STATE = { mode: 'title' };
const $ = id => document.getElementById(id);
function hudDirty() { UI.dirty = true; }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function say(text, col = '#f4ead6') { const c = $('chat'); const d = document.createElement('div'); d.style.color = col; d.textContent = text; c.appendChild(d); while (c.children.length > 40) c.firstChild.remove(); if (NETROLE === 'host' && !text.startsWith('获得')) netEv({ k: 'say', text, col }); }
function toast(msg, d = 2) { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; UI.toastT = d; }
function banner(a, b = '', d = 3.5) { if (UI.chapterOn) { setTimeout(() => banner(a, b, d), 700); return; } if (UI.bannerT > 0.6 && UI.bannerTxt !== a) { setTimeout(() => banner(a, b, d), (UI.bannerT - 0.4) * 1000); return; } UI.bannerTxt = a; const B = $('banner'); B.querySelector('.b1').textContent = a; B.querySelector('.b2').textContent = b; B.style.opacity = 1; UI.bannerT = d; }
function flashHurt() { const h = $('hurt'); h.style.boxShadow = 'inset 0 0 140px rgba(200,20,10,.55)'; setTimeout(() => h.style.boxShadow = 'inset 0 0 120px rgba(200,20,10,0)', 120); }
function uiFade(out, d) { const f = $('fade'); f.style.transition = `opacity ${d}s`; f.style.opacity = out ? 1 : 0; }
function uiChapter(c1, c2) { const C = $('chapter'); C.querySelector('.c1').textContent = c1; const e2 = C.querySelector('.c2'); e2.textContent = c2 || ''; e2.style.fontSize = (c2 || '').length > 8 ? 'min(30px,6vw)' : ''; e2.style.letterSpacing = (c2 || '').length > 8 ? '4px' : ''; C.style.opacity = 1; UI.chapterOn = true; clearTimeout(UI.chT); UI.chT = setTimeout(() => { C.style.opacity = 0; UI.chapterOn = false; }, 3000); }
function uiCine(on) { document.body.classList.toggle('cine', !!on); $('skip').classList.toggle('hide', !on || NETROLE === 'guest'); }
function skipCine() { if (NETROLE === 'guest' || !STORY.running) return; W.skip = true; if (DLG.open) closeDlg(); }
function uiProgress(label, k) { const P = $('progress'); if (!label) { P.classList.add('hide'); return; } P.classList.remove('hide'); P.querySelector('.pl').textContent = label; P.querySelector('i').style.width = (clamp(k, 0, 1) * 100) + '%'; }
/* ---------- portraits: painted busts (chibi heads; beasts cropped around the head) ---------- */
const BEASTBUST = new Map();
function beastBust(P, size) {
  const key = P.key + '|' + size; let c = BEASTBUST.get(key); if (c) return c;
  const N = 512, big = cnv(N, N), g = big.getContext('2d'); const ext = (P.len || 110) * 1.9 + 120, px = N / ext; g.translate(N * 0.45, N * 0.78); g.scale(px, px); drawBeast(g, P, { t: 0, view: 'side', mood: P.mood }, px);
  const d = g.getImageData(0, 0, N, N).data; let x0 = N, y0 = N, x1 = 0, y1 = 0; for (let y = 0; y < N; y += 2) for (let x = 0; x < N; x += 2) if (d[(y * N + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const bh = Math.max(20, y1 - y0), side = Math.min(bh * 1.05, x1 - x0); c = cnv(size, size); const cg = c.getContext('2d'); cg.drawImage(big, x1 - side * 1.02, y0 - side * 0.04, side, side, 0, 0, size, size); BEASTBUST.set(key, c); return c;
}
const PRTURL = new Map(), HALF = new Map();
function halfBody(e, mood = 'open') { // big half-length 立绘 for the dialogue box
  const P = e.R.spec, key = P.key + '|' + mood; let u = HALF.get(key); if (u) return u;
  const H = 640, Wd = 540, c = cnv(Wd, H), g = c.getContext('2d');
  try {
    if (P.rig === 'chibi') { const B = BUILD[P.build || 'kid'], tot = chibiHeight(P), z = H * 0.97 / (tot - B.leg * 0.55); g.translate(Wd / 2, H * 0.03 + tot * z); g.scale(z, z); drawChibi(g, P, { view: 'front', mood, t: 0 }, z); }
    else { const b = beastBust(P, 420); g.drawImage(b, (Wd - 470) / 2, H - 470, 470, 470); }
  } catch (err) { console.warn(err); }
  u = c.toDataURL(); HALF.set(key, u); return u;
}
function portrait(e, mood = 'open', size = 160) {
  if (!e || !e.R) return ''; const P = e.R.spec, key = P.key + '|' + mood + '|' + size; let u = PRTURL.get(key); if (u) return u;
  try { const c = P.rig === 'chibi' ? chibiPortrait(P, mood, size) : beastBust(P, size); u = c.toDataURL(); PRTURL.set(key, u); return u; } catch (err) { console.warn(err); return ''; }
}
/* ---------- dialogue box ---------- */
function uiDialog(name, text, e, col) {
  const D = $('dlg'); if (name === null) { D.classList.add('hide'); return; }
  D.classList.remove('hide'); D.classList.toggle('narr', !name); D.querySelector('.dn').textContent = name; D.querySelector('.dn').style.color = col || ''; D.querySelector('.dt').textContent = '';
  D.querySelector('.dp').style.backgroundImage = e ? `url(${portrait(e, e.A && e.A.face || 'open', 320)})` : 'none';
  const L = $('lih'); if (e && e.R && name) { L.style.backgroundImage = `url(${halfBody(e, e.A && e.A.face || 'open')})`; L.classList.add('on'); L.classList.toggle('r', !(e === W.P[0] || e === W.P[1])); D.classList.add('lih'); } else { L.classList.remove('on'); D.classList.remove('lih'); }
}
function uiDialogText(t, done) { const D = $('dlg'); D.querySelector('.dt').textContent = t; D.querySelector('.dm').style.visibility = done ? 'visible' : 'hidden'; }
function uiChoice(prompt, opts, cb) {
  const C = $('choice'); if (prompt === null) { C.classList.add('hide'); UI.choice = null; return; }
  C.innerHTML = `<h3>${esc(prompt)}</h3>` + opts.map((o, i) => `<button class="btn" data-i="${i}"><span class="kbd">${i + 1}</span>${esc(o)}</button>`).join(''); C.classList.remove('hide');
  UI.choice = i => { if (i >= 0 && i < opts.length) { sfx('ui'); cb(i); } }; C.querySelectorAll('button').forEach(b => b.onclick = () => UI.choice(+b.dataset.i));
}
/* ---------- floating combat text, speech bubbles ---------- */
const FT = [];
function floatText(e, txt, col, sc = 1) { if (!SET.dmgNum && /^\d/.test(txt)) return; const d = document.createElement('div'); d.className = 'ft'; d.textContent = txt; d.style.color = col; d.style.fontSize = (17 * sc) + 'px'; $('plates').appendChild(d); FT.push({ d, x: e.x + rr(-0.4, 0.4), y: e.y + e.h + 0.3, z: e.z + rr(-0.4, 0.4), t: 0, vy: 1.6 }); if (NETROLE === 'host') netEv({ k: 'ft', id: e.id, txt, col, sc }); }
function floatXP(n) { const me = W.P[W.me]; if (me) floatText(me, '经验 +' + Math.round(n), '#d8b8ff', 0.8); }
const BUBS = [];
function bubble(e, txt, d = 3) { const b = document.createElement('div'); b.className = 'bub'; b.textContent = txt; $('plates').appendChild(b); BUBS.push({ b, e, t: d }); if (NETROLE === 'host') netEv({ k: 'bub', id: e.id, txt, d }); }
function project(x, y, z) { const p = w2s(x, z, y - groundH(x, z)); if (p[0] < -200 || p[1] < -200 || p[0] > V.W + 200 || p[1] > V.H + 200) return null; return p; }
function tickFloat(dt) {
  for (let i = FT.length - 1; i >= 0; i--) { const f = FT[i]; f.t += dt; f.y += f.vy * dt; f.vy *= 0.96; const p = project(f.x, f.y, f.z); if (!p || f.t > 1.1) { if (f.t > 1.1) { f.d.remove(); FT.splice(i, 1); } else f.d.style.display = 'none'; continue; } f.d.style.display = ''; f.d.style.left = p[0] + 'px'; f.d.style.top = p[1] + 'px'; f.d.style.opacity = 1 - sstep(0.6, 1.1, f.t); }
  for (let i = BUBS.length - 1; i >= 0; i--) { const B = BUBS[i]; B.t -= dt; const e = B.e; const p = e.removed ? null : project(e.x, e.y + e.h + 0.7, e.z); if (B.t <= 0 || e.removed) { B.b.remove(); BUBS.splice(i, 1); continue; } if (!p) { B.b.style.display = 'none'; continue; } B.b.style.display = ''; B.b.style.left = p[0] + 'px'; B.b.style.top = p[1] + 'px'; }
}
/* ---------- nameplates ---------- */
function plateClass(e) { if (e === W.P[W.me]) return 'me'; if (e.type === 'player' || e.type === 'partner') return 'friend'; if (e.team === 1) return 'foe'; if (e.type === 'mob' && e.team === 2) return 'neutral'; return 'friend'; }
function tickPlates() {
  const me = W.P[W.me]; const seen = new Set();
  for (const e of W.ents) {
    if (!e.root || !e.root.visible || e.noPlate || !e.name) continue; if (!me) continue; const pd2 = d2(e.x, e.z, me.x, me.z), imp = e.type === 'mob' || e.type === 'player' || e.type === 'partner' || e === UI.target || (e.type === 'npc' && (npcMark(e) || ['chief', 'linhu', 'feijiao', 'ermeng', 'pihou', 'dazhuang'].includes(e.tag))); if (pd2 > (imp ? 42 * 42 : 14 * 14)) continue;
    const mk = e.type === 'npc' ? npcMark(e) : null; const showHp = e.type === 'mob' && e.alive && (e.hp < e.hpMax || UI.target === e || e.team === 1);
    const p = project(e.x, e.y + e.h + 0.35 + (e.plateY || 0), e.z); if (!p) continue; seen.add(e.id);
    let P = UI.plates.get(e.id); if (!P) { P = document.createElement('div'); P.className = 'plate'; $('plates').appendChild(P); UI.plates.set(e.id, P); e.plate = P; }
    const cls = 'plate ' + plateClass(e); if (P.className !== cls) P.className = cls;
    const lvTxt = e.type === 'mob' ? `Lv.${e.lv} ` : ''; const html = (mk ? `<div class="mk ${mk.main ? '' : 'side'}">${mk.m}</div>` : '') + (e.title && e.type !== 'mob' ? `<div class="pt">「${esc(e.title)}」</div>` : '') + `<div class="pn">${lvTxt}${esc(e.name)}${e.elite ? ' ★' : ''}</div>` + (showHp ? `<div class="ph"><i style="width:${Math.max(0, e.hp / e.hpMax * 100)}%"></i></div>` : '');
    if (P._h !== html) { P.innerHTML = html; P._h = html; }
    P.style.left = p[0] + 'px'; P.style.top = p[1] + 'px'; P.style.opacity = e.alive || e.type === 'npc' ? 1 : 0.4;
  }
  for (const [id, P] of UI.plates) if (!seen.has(id)) { P.remove(); UI.plates.delete(id); }
}
/* ---------- target ---------- */
function setTarget(e, soft) { if (e && (e.type === 'player' || e === W.P[W.me])) e = e === W.P[W.me] ? null : e; UI.target = e; UI.softT = soft; hudDirty(); }
/* ---------- HUD refresh ---------- */
function unitHTML(e, small) { const sh = e.buffs.reduce((s, b) => s + (b.shield || 0), 0); return `<div class="unit frame ${small ? 'small' : ''}"><div class="pic" style="background-image:url(${portrait(e)})"><span class="lv">${PARTY.lv}</span></div><div class="ubody"><div class="uname"><span>${esc(e.name)}<small>${esc(e.title || '')}</small></span><span style="color:#9ad8ff">${e.downed ? '倒地' : ''}</span></div><div class="bar sh"><i style="width:${e.hp / e.hpMax * 100}%"></i>${sh > 0 ? `<i class="s" style="left:${e.hp / e.hpMax * 100}%;width:${Math.min(100 - e.hp / e.hpMax * 100, sh / e.hpMax * 100)}%"></i>` : ''}<b>${Math.ceil(e.hp)} / ${e.hpMax}</b></div><div class="bar mp"><i style="width:${e.mp / e.mpMax * 100}%"></i><b>符力 ${Math.floor(e.mp)}</b></div><div class="buffs">${e.buffs.filter(b => b.name).map(b => `<span>${esc(b.name)} ${Math.ceil(b.t)}</span>`).join('')}</div></div></div>`; }
let hudT = 0;
function updateHUD(dt) {
  hudT += dt; tickFloat(dt); tickPlates();
  if (UI.toastT > 0) { UI.toastT -= dt; if (UI.toastT <= 0) $('toast').style.opacity = 0; }
  if (UI.bannerT > 0) { UI.bannerT -= dt; if (UI.bannerT <= 0) $('banner').style.opacity = 0; }
  const me = W.P[W.me];
  if (hudT > 0.1 || UI.dirty) {
    hudT = 0;
    $('party').innerHTML = W.P.filter(Boolean).map((p, i) => unitHTML(p, p !== me)).join('');
    const T = UI.target; const tf = $('target');
    if (T && !T.removed && (T.alive || T.type === 'npc') && me && edist(T, me) < 60) { tf.classList.remove('hide'); tf.className = 'frame ' + (T.team === 1 ? '' : T.team === 2 && T.type === 'mob' ? 'neutral' : 'friendly'); tf.innerHTML = `<div class="tn"><span>${esc(T.name)} ${T.elite ? '★精英' : ''}${T.boss ? '◆首领' : ''}</span><span>${T.type === 'mob' ? 'Lv.' + T.lv : esc(T.title || '')}</span></div>` + (T.hpMax && T.type !== 'npc' ? `<div class="bar"><i style="width:${T.hp / T.hpMax * 100}%"></i><b>${Math.ceil(T.hp)} / ${T.hpMax}</b></div>` : '') + `<div class="buffs">${T.buffs.filter(b => b.name).map(b => `<span>${esc(b.name)}</span>`).join('')}</div>`; }
    else { tf.classList.add('hide'); if (T && (!T.alive || T.removed)) UI.target = null; }
    const boss = W.ents.find(e => e.boss && e.alive && me && edist(e, me) < 70); const bb = $('boss');
    if (boss) { bb.classList.remove('hide'); bb.querySelector('.bn').textContent = `${boss.title ? boss.title + ' · ' : ''}${boss.name}`; bb.querySelector('i').style.width = (boss.hp / boss.hpMax * 100) + '%'; bb.querySelector('b').textContent = `${Math.ceil(boss.hp)} / ${boss.hpMax}`; } else bb.classList.add('hide');
    // tracker
    const q = curQ(); let h = '';
    if (q) h += `<h4>主线 · ${esc(q.chapter || '')}</h4><div class="tq"><div class="t">${esc(q.title)}</div><div class="s">◇ ${esc(stepText())}</div></div>`; else if (STORY.done) h += `<h4>主线</h4><div class="tq"><div class="s">${esc(stepText())}</div></div>`;
    for (const sq of Object.values(SIDEQ)) if (sq.st === 1 || sq.st === 2) h += `<div class="tq side"><div class="t">【支线】${esc(sq.title)}</div><div class="s">◇ ${sq.st === 2 ? '回去交付' : esc(sq.text || '')}${sq.need && sq.st === 1 ? `（${sq.item ? Math.min(PARTY.items[sq.item] || 0, sq.need) : sq.n || 0}/${sq.need}）` : ''}</div></div>`;
    $('tracker').innerHTML = h; $('tracker').classList.toggle('hide', !h);
    // xp
    const need = BAL.xpCurve(PARTY.lv); $('xpb').querySelector('i').style.width = (PARTY.xp / need * 100) + '%'; $('xpt').textContent = `${PARTY.lv} 级 · 经验 ${PARTY.xp} / ${need}`;
    $('zname').textContent = W.zone ? W.zone.name : '';
    UI.dirty = false;
  }
  updateSlots(); drawMinimap(); updatePrompt();
}
function updatePrompt() {
  const me = W.P[W.me], P = $('prompt'); if (!me || W.cine || DLG.open || UI.modal) { P.classList.add('hide'); return; }
  const t = findInteract(me); UI.interact = t; if (!t) { P.classList.add('hide'); return; }
  P.classList.remove('hide'); const lab = interactLabel(t); const h = (IS_TOUCH ? '' : '<kbd>F</kbd>') + esc(lab); if (P._h !== h) { P.innerHTML = h; P._h = h; }
}
/* ---------- hotbar ---------- */
function buildHotbar() {
  const me = W.P[W.me]; if (!me) return; const bar = me.type === 'player' ? P1_BAR : partnerBar(); const keys = ['J', '1', '2', '3', '4', '5'];
  $('slots').innerHTML = bar.map((id, i) => { const S = SK[id]; return `<div class="slot ${i === 0 ? 'basic' : ''}" data-i="${i}" title="${esc(S.name)}"><span>${S.icon}</span><span class="k">${keys[i]}</span><div class="cd"></div><div class="cdt"></div></div>`; }).join('') + `<div class="slot" data-i="dodge" title="翻滚"><span>💨</span><span class="k">⇧</span><div class="cd"></div><div class="cdt"></div></div>`;
  $('slots').querySelectorAll('.slot').forEach(s => { s.onclick = () => heroAction(s.dataset.i === 'dodge' ? 'dodge' : s.dataset.i === '0' ? 'attack' : 's' + s.dataset.i); const id = s.dataset.i === 'dodge' ? 'dodge' : bar[+s.dataset.i]; s.title = SK[id].name + '\n' + SK[id].desc(rankOf(id)); });
  buildTouchButtons();
}
function updateSlots() {
  const me = W.P[W.me]; if (!me) return; const bar = me.type === 'player' ? P1_BAR : partnerBar();
  const els = IS_TOUCH ? $('tbtns').querySelectorAll('button[data-sk]') : $('slots').querySelectorAll('.slot');
  els.forEach(el => { const i = el.dataset.i ?? el.dataset.sk; const id = i === 'dodge' ? 'dodge' : bar[+i]; if (!id) return; const S = SK[id], cd = me.cds[id] || 0; const p = cd > 0 ? cd / S.cd : 0; const c = el.querySelector('.cd'); if (c) c.style.setProperty('--p', (p * 100) + '%'); const ct = el.querySelector('.cdt'); if (ct) ct.textContent = cd > 0.9 && !S.basic ? Math.ceil(cd) : '';
    const lock = S.unlock && !PARTY.flags[S.unlock] && me.type === 'player'; el.classList.toggle('lock', !!lock); el.classList.toggle('nomp', !lock && me.mp < S.mp); });
}
function buildTouchButtons() {
  const T = $('tbtns'); if (!IS_TOUCH) return; T.classList.remove('hide'); document.body.classList.add('touch');
  const me = W.P[W.me]; const bar = me.type === 'player' ? P1_BAR : partnerBar();
  const pos = [[150, 150, 76], [72, 176, 54], [92, 106, 54], [150, 72, 54], [212, 82, 50], [228, 0, 44]];
  let h = ''; bar.forEach((id, i) => { const [x, y, s] = pos[i] || [0, 0, 44]; if (i === 5) return; h += `<button data-sk="${i}" style="left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px">${SK[id].icon}<div class="cd"></div></button>`; });
  h += `<button data-sk="dodge" style="left:${10}px;top:${110}px;width:46px;height:46px">💨<div class="cd"></div></button>`;
  h += `<button data-a="jump" style="left:${200}px;top:${140}px;width:46px;height:46px">⤴</button>`;
  h += `<button data-a="int" style="left:${20}px;top:${40}px;width:50px;height:50px;font-size:15px">互动</button>`;
  if (bar[5]) h += `<button data-sk="5" style="left:${100}px;top:${30}px;width:46px;height:46px">${SK[bar[5]].icon}<div class="cd"></div></button>`;
  T.innerHTML = h;
  T.querySelectorAll('button').forEach(b => { b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); audioInit(); if (DLG.open) { advanceOrSend(); return; } const sk = b.dataset.sk, a = b.dataset.a; if (sk === 'dodge') heroAction('dodge'); else if (sk === '0') heroAction('attack'); else if (sk) heroAction('s' + sk); else if (a === 'jump') { INP.jump = true; INP.jumpHeld = true; } else if (a === 'int') { INP.intHeld = true; const me2 = W.P[W.me]; if (me2) doInteract(me2, findInteract(me2)); } }, { passive: false }); b.addEventListener('touchend', e => { e.preventDefault(); INP.jumpHeld = false; INP.intHeld = false; }); });
}
function buildMenuButtons() {
  const B = [['🗺', 'map', '地图 M'], ['📜', 'quests', '任务 L'], ['🎒', 'bag', '背包 B'], ['🌙', 'skills', '宝术 K'], ['👤', 'char', '角色 C'], ['⚙', 'pause', '菜单 Esc']];
  $('mmbtns').innerHTML = B.map(([ic, k, t]) => `<button data-k="${k}" title="${t}">${ic}</button>`).join('');
  $('mmbtns').querySelectorAll('button').forEach(b => b.onclick = () => { sfx('ui'); b.dataset.k === 'pause' ? togglePause() : openModal(b.dataset.k); });
}
/* ---------- minimap ---------- */
function buildMapImage() {
  const N = 384, c = cnv(N, N), g = c.getContext('2d'), id = g.createImageData(N, N), S = TER.size, col = [0, 0, 0];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -S / 2 + (i + 0.5) / N * S, z = -S / 2 + (j + 0.5) / N * S; groundColor(x, z, col); const q = (j * N + i) * 4; id.data[q] = col[0]; id.data[q + 1] = col[1]; id.data[q + 2] = col[2]; id.data[q + 3] = 255; }
  g.putImageData(id, 0, 0);
  for (const it of STATIC.list) { const nm = it.P.name, px = (it.x / S + 0.5) * N, pz = (it.z / S + 0.5) * N; if (nm.startsWith('house') || nm === 'chiefhouse' || nm === 'tent') { g.fillStyle = '#7a5a3a'; g.fillRect(px - 2, pz - 2, 4, 4); } else if (nm === 'oak' || nm === 'pine' || nm === 'ancient') { g.fillStyle = 'rgba(20,60,30,.45)'; g.beginPath(); g.arc(px, pz, nm === 'ancient' ? 4 : 1.6, 0, TAU); g.fill(); } }
  UI.mapImg = c;
}
function w2m(x, z, cx, cz, R, size) { return [size / 2 + (x - cx) / R * size / 2, size / 2 + (z - cz) / R * size / 2]; }
function drawMinimap() {
  const c = $('mmc'), g = c.getContext('2d'), N = c.width, me = W.P[W.me]; if (!me || !UI.mapImg) return; const R = 70, S = TER.size, M = UI.mapImg.width;
  g.save(); g.clearRect(0, 0, N, N); g.beginPath(); g.arc(N / 2, N / 2, N / 2, 0, TAU); g.clip();
  const sx = (me.x - R + S / 2) / S * M, sz = (me.z - R + S / 2) / S * M, sw = 2 * R / S * M; g.drawImage(UI.mapImg, sx, sz, sw, sw, 0, 0, N, N);
  // view cone
  g.strokeStyle = 'rgba(255,240,200,.35)'; g.lineWidth = 2; { const K = k(), vw = V.W / K, vh = V.H / K, q = N / (2 * R); g.strokeRect(N / 2 - vw / 2 * q, N / 2 - vh / 2 * q, vw * q, vh * q); }
  for (const e of W.ents) { if (e === me || !e.alive && e.type !== 'npc') continue; const [x, y] = w2m(e.x, e.z, me.x, me.z, R, N); if ((x - N / 2) ** 2 + (y - N / 2) ** 2 > (N / 2) ** 2) continue;
    if (e.type === 'mob') { g.fillStyle = e.team === 1 ? (e.boss || e.elite ? '#ff3a2a' : '#e86a5a') : '#e8d06a'; g.beginPath(); g.arc(x, y, e.boss || e.elite ? 7 : 4.5, 0, TAU); g.fill(); }
    else if (e.type === 'npc') { const mk = npcMark(e); if (mk) { g.font = 'bold 26px serif'; g.fillStyle = mk.main ? '#ffd84a' : '#8ad8ff'; g.textAlign = 'center'; g.fillText(mk.m, x, y + 9); } else { g.fillStyle = '#9aff9a'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); } }
    else if (e.type === 'partner' || e.type === 'player') { g.fillStyle = '#6ad8ff'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); } }
  if (W.sniffT > 0) for (const s of (W.secrets || [])) { if (s.got) continue; const [x, y] = w2m(s.x, s.z, me.x, me.z, R, N); g.fillStyle = '#ffe08a'; g.font = '22px serif'; g.textAlign = 'center'; g.fillText('✦', x, y + 7); }
  // quest marker (clamped to the rim)
  const qt = stepTarget(); if (qt) { let [x, y] = w2m(qt.x, qt.z, me.x, me.z, R, N); const dx = x - N / 2, dy = y - N / 2, d = Math.hypot(dx, dy), rim = N / 2 - 14; if (d > rim) { x = N / 2 + dx / d * rim; y = N / 2 + dy / d * rim; } g.fillStyle = '#ffd84a'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - HP, r = i % 2 ? 6 : 14; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke(); g.fill(); }
  // me
  g.translate(N / 2, N / 2); g.rotate(-me.rot + PI); g.fillStyle = '#ffe6a0'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -14); g.lineTo(10, 10); g.lineTo(0, 5); g.lineTo(-10, 10); g.closePath(); g.stroke(); g.fill();
  g.restore();
  g.font = '20px serif'; g.fillStyle = '#f0d38a'; g.textAlign = 'center'; g.fillText('北', N / 2, 22);
}
/* ---------- modals ---------- */
function openModal(k) { if (DLG.open || W.cine) return; if (UI.modal === k) { closeModal(); return; } UI.modal = k; const M = $('modal'); M.classList.remove('hide'); renderModal(); sfx('ui'); }
function closeModal() { UI.modal = null; $('modal').classList.add('hide'); if (STATE.paused) { STATE.paused = false; } }
function togglePause() { if (UI.modal === 'pause') { closeModal(); return; } UI.modal = 'pause'; STATE.paused = !NETROLE; $('modal').classList.remove('hide'); renderModal(); }
function renderModal() {
  const M = $('modal'), k = UI.modal, me = W.P[W.me]; let h = '';
  const head = t => `<h2><span>${t}</span><button class="x" onclick="closeModal()">✕</button></h2>`;
  if (k === 'bag') {
    const ids = Object.keys(PARTY.items); h = head('行囊') + `<div class="grid">${ids.map(id => { const it = ITEMS[id] || { icon: '?', name: id }; return `<div class="cell" data-id="${id}">${it.icon}<b>${PARTY.items[id]}</b></div>`; }).join('') || '<div style="color:var(--dim)">空空如也</div>'}</div><div class="desc" id="bdesc">点一下物品查看；能用的物品再点“使用”。快捷键 R：优先使用药散 / 百兽奶 / 兽肉 / 红浆果。</div>`;
    M.innerHTML = h; M.querySelectorAll('.cell').forEach(c => c.onclick = () => { const it = ITEMS[c.dataset.id]; $('bdesc').innerHTML = `<b style="color:var(--gold)">${it.icon} ${esc(it.name)}</b><br>${esc(it.desc || '')}` + (it.use ? `<br><button class="btn sm" id="buse">使用</button>` : ''); const u = $('buse'); if (u) u.onclick = () => { useItem(c.dataset.id); renderModal(); }; }); return;
  }
  if (k === 'skills') {
    const isP1 = me.type === 'player', bar = isP1 ? P1_BAR : partnerBar(); const F = PARTNER_FORMS[PARTY.form];
    h = head(isP1 ? '宝术 · 小不点' : `天赋 · ${esc(PARTY.pname || F.name)}（${F.name}）`) + `<div style="color:var(--dim);margin-bottom:6px">宝术点：<b style="color:var(--gold)">${PARTY.sp}</b>　每升一级得 1 点，可提升已领悟的宝术（最高 5 阶）。</div>`;
    h += bar.concat(['dodge']).map(id => { const S = SK[id]; const lock = isP1 && S.unlock && !PARTY.flags[S.unlock]; const r = rankOf(id); const canUp = !lock && !S.basic && id !== 'dodge' && PARTY.sp > 0 && r < 5; return `<div class="skrow ${lock ? 'lock' : ''}"><div class="ic">${S.icon}</div><div style="flex:1"><div class="nm">${esc(S.name)} ${S.basic || id === 'dodge' ? '' : `<small style="color:var(--dim)">${r} 阶</small>`} ${lock ? '<small style="color:#e88">（剧情中领悟）</small>' : ''}</div><div class="dd">${esc(S.desc(r))}</div><div class="dd" style="color:var(--dim)">${S.cd > 1 ? '冷却 ' + S.cd + ' 秒' : ''}${S.mp ? ' · 符力 ' + S.mp : ''}</div></div>${canUp ? `<button class="btn sm" data-up="${id}">提升</button>` : ''}</div>`; }).join('');
    if (!isP1) h += `<div class="desc"><b style="color:var(--gold)">${F.name}</b>（${F.role}）　${esc(F.desc)}<br><span style="color:var(--dim)">进化路线：绒灵 → 青鳞鹰（第11章）→ 朱厌（第53章）→ ……补天阁篇继续</span></div>`;
    M.innerHTML = h; M.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { if (NETROLE === 'guest') { netSendCtl({ t: 'skup', id: b.dataset.up }); return; } PARTY.skills[b.dataset.up] = rankOf(b.dataset.up) + 1; PARTY.sp--; sfx('levelup'); renderModal(); saveGame(); }); return;
  }
  if (k === 'quests') {
    h = head('任务'); h += QUESTS.map((q, i) => i < STORY.qi ? `<div class="qrow done"><span class="t">✔ ${esc(q.chapter || '')} · ${esc(q.title)}</span></div>` : i === STORY.qi ? `<div class="qrow"><span class="t">▶ ${esc(q.chapter || '')} · ${esc(q.title)}</span><br>${esc(q.desc || '')}<br><span style="color:var(--gold)">当前：${esc(stepText())}</span></div>` : '').join('');
    const side = Object.values(SIDEQ).filter(s => s.st != null); if (side.length) h += `<h2 style="font-size:16px;margin-top:12px">支线</h2>` + side.map(s => `<div class="qrow ${s.st === 3 ? 'done' : ''}"><span class="t" style="color:#9ad8ff">${s.st === 3 ? '✔ ' : ''}${esc(s.title)}</span><br>${esc(s.desc || s.text || '')}</div>`).join('');
    M.innerHTML = h; return;
  }
  if (k === 'char') {
    const F = PARTNER_FORMS[PARTY.form]; const p2 = W.P[1];
    h = head('角色') + `<div style="display:flex;gap:16px;flex-wrap:wrap">${W.P.filter(Boolean).map(p => `<div class="frame" style="padding:12px;flex:1;min-width:240px"><div style="display:flex;gap:10px;align-items:center"><div class="pic" style="width:72px;height:72px;background-image:url(${portrait(p)})"></div><div><div style="color:var(--gold);font-size:17px">${esc(p.name)}</div><div style="color:var(--dim)">${p.type === 'player' ? '石村 · 小不点（石昊）' : esc(F.name + ' · ' + F.role)}</div></div></div><div class="desc">等级 ${PARTY.lv}<br>气血 ${Math.ceil(p.hp)} / ${p.hpMax}<br>力量 ${p.atk}　防御 ${p.def}<br>符力 ${Math.floor(p.mp)} / ${p.mpMax}</div></div>`).join('')}</div>`;
    M.innerHTML = h; return;
  }
  if (k === 'map') {
    h = head('地图') + `<div class="tabs"><button class="btn sm sel" id="tz">${esc(W.zone.name)}</button><button class="btn sm" id="tw">荒域 · 世界</button></div><div id="mapbody"></div>`; M.innerHTML = h;
    const zoneTab = () => { $('mapbody').innerHTML = `<canvas id="mapc" width="640" height="640"></canvas>`; const c = $('mapc'), g = c.getContext('2d'); g.drawImage(UI.mapImg, 0, 0, 640, 640); const S = TER.size, w = (x, z) => [(x / S + 0.5) * 640, (z / S + 0.5) * 640];
      g.font = '15px serif'; g.textAlign = 'center'; for (const p of W.zone.pois) { const [x, y] = w(p.x, p.z); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(p.name, x + 1, y + 1); g.fillStyle = '#ffe8b0'; g.fillText((p.icon || '') + p.name, x, y); }
      const qt = stepTarget(); if (qt) { const [x, y] = w(qt.x, qt.z); g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
      for (const p of W.P) if (p) { const [x, y] = w(p.x, p.z); g.fillStyle = p === me ? '#fff0b0' : '#6ad8ff'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); g.strokeStyle = '#000'; g.stroke(); } };
    const worldTab = () => { $('mapbody').innerHTML = WORLD.map(z => `<div class="qrow ${z.open ? '' : 'done'}"><span class="t">${z.open ? '◉' : '🔒'} ${esc(z.name)}</span> <small style="color:var(--dim)">${esc(z.ch)}</small><br>${esc(z.desc)}</div>`).join(''); };
    zoneTab(); $('tz').onclick = () => { $('tz').classList.add('sel'); $('tw').classList.remove('sel'); zoneTab(); }; $('tw').onclick = () => { $('tw').classList.add('sel'); $('tz').classList.remove('sel'); worldTab(); }; return;
  }
  if (k === 'pause') {
    h = head('菜单') + `<div style="display:flex;flex-direction:column;gap:8px;max-width:360px;margin:0 auto">
      <button class="btn" onclick="closeModal()">继续</button>
      <div class="frame" style="padding:10px;text-align:left;line-height:2">音量 <input type="range" min="0" max="1" step="0.05" value="${SET.vol}" oninput="SET.vol=+this.value;setVol();saveSet()"><br>音乐 <input type="range" min="0" max="1" step="0.05" value="${SET.music}" oninput="SET.music=+this.value;setVol();saveSet()"><br>镜头灵敏度 <input type="range" min="0.3" max="2" step="0.1" value="${SET.camSens}" oninput="SET.camSens=+this.value;saveSet()"><br>
      <label><input type="checkbox" ${SET.shake ? 'checked' : ''} onchange="SET.shake=this.checked;saveSet()"> 画面震动</label>　<label><input type="checkbox" ${SET.dmgNum ? 'checked' : ''} onchange="SET.dmgNum=this.checked;saveSet()"> 伤害数字</label><br>
      画质 <select onchange="SET.quality=this.value;saveSet();toast('刷新页面后生效')"><option value="high" ${SET.quality === 'high' ? 'selected' : ''}>高</option><option value="mid" ${SET.quality === 'mid' ? 'selected' : ''}>中</option><option value="low" ${SET.quality === 'low' ? 'selected' : ''}>低</option></select></div>
      <div class="frame" style="padding:10px;text-align:left;font-size:13px;line-height:1.7;color:var(--dim)">WASD 移动　鼠标拖动 转镜头　滚轮 缩放<br>左键 / J 普攻　1–5 宝术　Shift 翻滚　空格 跳<br>F 互动（长按扶起同伴）　Tab 切换目标　R 吃药<br>B 背包　K 宝术　L 任务　M 地图　C 角色　Q/E 转镜头　N 静音</div>
      ${HUB ? `<button class="btn" id="hubq">返回游戏厅</button>` : ''}
      <button class="btn" id="titq">回到标题</button></div>`;
    M.innerHTML = h;
    const two = (id, fn) => { const b = $(id); if (!b) return; b.onclick = () => { if (b.dataset.c) { saveGame(); fn(); } else { b.dataset.c = 1; b.textContent = '再点一次确认'; } }; };
    two('hubq', () => { location.href = '../'; }); two('titq', () => { location.reload(); });
  }
}
const WORLD = [
  { name: '苍莽山脉 · 石村', ch: '第1–48章', desc: '石村、柳神、石林、梧木巢、狩猎区。小不点长大的地方。', open: true },
  { name: '狻猊殒落地', ch: '第17–24章', desc: '山脉深处，狻猊入山洞而亡，群兽暴动，三巨头大战。', open: false },
  { name: '小孤山镇', ch: '第30–48章', desc: '苍莽山脉外部的小镇，各大部族在此聚集。', open: false },
  { name: '新石村 · 碧湖', ch: '第50–68章', desc: '柳神带着石村遁入混沌，重回大地时已在一片新的宝地。乱石瀑布、战场废墟、干涸的大泽。', open: false },
  { name: '大荒血路', ch: '第68–72章', desc: '锁着青色巨爪的灰褐秃山、寒潭、五色孔雀、太阴河。', open: false },
  { name: '石国 · 冲云镇', ch: '第72–86章', desc: '石国西部边陲重镇，金刚岩城墙。', open: false },
  { name: '虚神界', ch: '第87–95章', desc: '精神进入的世界，所有人被压到搬血境。石碑记下“最爱吃兽奶”。', open: false },
  { name: '补天阁', ch: '第96–117章', desc: '净土、闯关、第二战场、天才营。', open: false },
  { name: '百断山', ch: '第117–172章', desc: '由无数区域组成的小世界，天上的太阳是太古金乌的尸体。', open: false },
];
/* ---------- chat (quick phrases for co-op) ---------- */
const QUICK = ['跟我来！', '等等我', '小心！', '这边有东西', '我去引怪', '救我！', '咿呀～', '好呀'];
function openChat() { if (UI.chatOpen) return; UI.chatOpen = true; uiChoice('快捷发言', QUICK.concat(['取消']), i => { uiChoice(null); UI.chatOpen = false; if (i < QUICK.length) { const me = W.P[W.me]; bubble(me, QUICK[i], 2.5); say(`[${me.name}] ${QUICK[i]}`, '#9ad8ff'); if (NETROLE === 'guest') netSendCtl({ t: 'chat', q: i }); } }); }
