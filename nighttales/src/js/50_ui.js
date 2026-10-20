/* ================= 十夜怪谈 · 界面 ================= */
const HUB = /\/nighttales\/(index\.html)?$/.test(location.pathname);
const SCREENS = ['title', 'select', 'lobby', 'archive'];
const UI = {
  scene: 'title', modal: null, _dlgId: -1, _n: -1, _cardId: -1, _noteId: -1, _kpId: -1, _endKey: '', _selIdx: 0,
  show(s) {
    this.scene = s;
    for (const id of SCREENS) $(id).classList.toggle('hidden', id !== s);
    $('hud').classList.toggle('hidden', s !== 'play');
    $('touch').classList.toggle('hidden', s !== 'play');
    if (s !== 'play') { this.closeModal(); ['card', 'note', 'keypad', 'endov'].forEach(i => $(i).classList.add('hidden')); this._dlgId = -1; this._cardId = -1; this._noteId = -1; this._kpId = -1; this._endKey = ''; }
    if (s === 'select') this.buildSelect();
    if (s === 'archive') this.buildArchive();
    if (s === 'title' || s === 'select') { if (!W) AU.ambient(s === 'title' ? 'drone' : 'wind'); }
    NET.scene = s;
    setTimeout(() => this.focusFirst(), 30);
  },
  focusFirst() {
    if (TOUCH) return;
    const c = this.activeRoot(); if (!c) return;
    const f = c.querySelector('.btn.primary:not(.hidden),.card,.btn:not(.hidden)'); if (f) f.focus({ preventScroll: true });
  },
  activeRoot() {
    if (this.modal) return $(this.modal);
    if (W && W.endScreen) return $('endov');
    if (W && W.keypad && this.scene === 'play') return $('keypad');
    if (this.scene !== 'play') return $(this.scene);
    return null;
  },
  nav(n) {
    const root = this.activeRoot(); if (!root) return false;
    const els = [...root.querySelectorAll('.btn:not(.hidden):not(:disabled),.card,input,.it.clk')].filter(e => e.offsetParent !== null);
    if (!els.length) return false;
    let i = els.indexOf(document.activeElement);
    if (n === 'a') { if (i >= 0 && document.activeElement.tagName !== 'INPUT') { document.activeElement.click(); return true; } if (i < 0) { els[0].focus(); return true; } return false; }
    if (n === 'b' || n === 'menu') { const back = root.querySelector('[data-back]'); if (back) { back.click(); return true; } return false; }
    const grid = root.id === 'select' && document.activeElement && document.activeElement.classList.contains('card');
    let step = (n === 'down' || n === 'right') ? 1 : (n === 'up' || n === 'left') ? -1 : 0;
    if (grid && (n === 'up' || n === 'down')) { const cols = getComputedStyle($('chgrid')).gridTemplateColumns.split(' ').length; step *= cols; }
    if (!step) return false;
    i = i < 0 ? 0 : clamp(i + step, 0, els.length - 1);
    els[i].focus(); els[i].scrollIntoView({ block: 'nearest' }); return true;
  },
  toast(t) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; $('toasts').appendChild(el);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
    setTimeout(() => el.remove(), 2600);
  },
  open(id) {
    this.closeModal(); this.modal = id; $(id).classList.remove('hidden');
    if (id === 'inv') this.buildInv(); if (id === 'journal') this.buildJournal();
    if (id === 'menu') { $('mHub').classList.toggle('hidden', !HUB); $('mNote').textContent = NET.role !== 'solo' && NET.up ? '双人模式下游戏不会暂停' : ''; this._hubArm = false; $('mHub').textContent = '返回游戏厅'; $('mQuit').textContent = NET.role === 'guest' ? '离开房间' : '返回章节选择'; $('mRetry').classList.toggle('hidden', !W || !W.cp); }
    if (W && NET.role === 'solo') W.paused = true;
    setTimeout(() => this.focusFirst(), 30);
  },
  closeModal() { if (this.modal) $(this.modal).classList.add('hidden'); this.modal = null; if (W) W.paused = false; },
  buildInv() {
    const L = $('invL'); L.innerHTML = '';
    if (!W || !W.inv.length) { L.innerHTML = '<div class="empty">口袋里什么也没有</div>'; return; }
    for (const id of W.inv) { const it = (W.ch.items || {})[id] || { name: id }; const d = document.createElement('div'); d.className = 'it'; d.innerHTML = `<b>${esc(it.name)}</b><div>${esc(it.desc || '')}</div>`; L.appendChild(d); }
  },
  buildJournal() {
    const L = $('jrL'); L.innerHTML = ''; const got = store.get('notes', []);
    const ns = W && W.ch.notes ? Object.entries(W.ch.notes).filter(([k]) => got.includes(W.ch.id + ':' + k)) : [];
    if (!ns.length) { L.innerHTML = '<div class="empty">这一章还没有捡到笔记</div>'; return; }
    for (const [k, n] of ns) { const d = document.createElement('div'); d.className = 'it clk'; d.tabIndex = 0; d.innerHTML = `<b>${esc(n.title)}</b><div>${esc(n.text.slice(0, 40))}…</div>`; d.onclick = () => { this.closeModal(); showLocalNote(n); }; L.appendChild(d); }
  },
  buildSelect() {
    const G = $('chgrid'); G.innerHTML = ''; const done = store.get('done', []);
    $('selSub').textContent = NET.role === 'guest' ? '已加入房间 · 等待房主选择章节' : NET.role === 'host' && NET.up ? '对方已加入 · 选择今晚要讲的故事' : '选择今晚要听的故事';
    $('sBack').textContent = NET.role === 'guest' ? '离开房间' : '‹ 返回';
    CHAPTERS.forEach((ch, i) => {
      const c = document.createElement('div'); c.className = 'card'; c.tabIndex = 0;
      const cv2 = mk(160, 90); drawThumb(cv2, ch);
      const hasCp = !!store.get('cp.' + ch.id, null);
      c.appendChild(cv2);
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = `<div class="no">第${'一二三四五六七八九十'[i] || i + 1}夜 · ${esc(ch.origin || '')}</div><div class="tt">${esc(ch.title)}</div><div class="tl">${esc(ch.sub || '')}</div>`;
      c.appendChild(meta);
      if (done.includes(ch.id)) { const b = document.createElement('div'); b.className = 'badge done'; b.textContent = '已通关'; c.appendChild(b); }
      else if (hasCp) { const b = document.createElement('div'); b.className = 'badge cp'; b.textContent = '有存档'; c.appendChild(b); }
      c.onclick = () => this.pickChapter(ch);
      G.appendChild(c);
    });
  },
  pickChapter(ch) {
    if (NET.role === 'guest') { this.toast('由房主选择章节'); return; }
    const hasCp = !!store.get('cp.' + ch.id, null);
    if (!hasCp) { startChapter(ch.id, false); return; }
    this.open('menu'); // 复用面板：继续/重开
    const L = $('mList'); const saved = L.innerHTML;
    L.innerHTML = `<div style="text-align:center;font-family:var(--serif);font-size:18px;margin-bottom:6px">${esc(ch.title)}</div><button class="btn primary" id="pkC">从存档继续</button><button class="btn" id="pkN">从头开始</button><button class="btn" id="pkX" data-back>取消</button>`;
    const restore = () => { L.innerHTML = saved; bindMenu(); this.closeModal(); };
    $('pkC').onclick = () => { restore(); startChapter(ch.id, true); };
    $('pkN').onclick = () => { restore(); store.del('cp.' + ch.id); startChapter(ch.id, false); };
    $('pkX').onclick = restore;
    $('mNote').textContent = ''; setTimeout(() => $('pkC').focus(), 30);
  },
  buildArchive() {
    const L = $('archL'); L.innerHTML = ''; const done = store.get('done', []), got = store.get('notes', []), ends = store.get('ends', []);
    CHAPTERS.forEach((ch, i) => {
      const d = document.createElement('div');
      const ok = done.includes(ch.id);
      const ns = Object.entries(ch.notes || {}); const have = ns.filter(([k]) => got.includes(ch.id + ':' + k));
      const es = Object.entries(ch.endings || {}), eh = es.filter(([k]) => ends.includes(ch.id + ':' + k));
      d.innerHTML = `<h3>第${'一二三四五六七八九十'[i]}夜　${esc(ch.title)}　<span style="font-size:12px;color:var(--dim)">${esc(ch.origin || '')}</span></h3>` +
        (ok ? `<div class="legend">${esc(ch.legend || '')}</div>` : `<div class="lock">通关后解锁</div>`) +
        (ns.length ? `<div class="nlist">笔记 ${have.length}/${ns.length}${have.length ? '：' + have.map(([k, n]) => esc(n.title)).join('、') : ''}</div>` : '') +
        (es.length ? `<div class="nlist">结局 ${eh.length}/${es.length}${eh.length ? '：' + eh.map(([k, n]) => esc(n)).join('、') : ''}</div>` : '');
      L.appendChild(d);
    });
  },
  netChanged() { if (this.scene === 'select') this.buildSelect(); },
  /* ---------- 每帧同步 ---------- */
  sync(dt) {
    if (this.scene !== 'play' || !W) return;
    $('hct').textContent = W.ch.title;
    $('hgoal').textContent = W.goal ? '◆ ' + W.goal : '';
    const coop = NET.role !== 'solo' && NET.up;
    $('ctrlbar').classList.toggle('hidden', !coop);
    if (coop) {
      const me = iControl(); const w = $('cbWho'); w.textContent = me ? '你在操作' : '对方在操作'; w.classList.toggle('me', me);
      const myReq = NET.role === 'host' ? W.req === 'h' : W.req === 'g';
      $('cbBtn').innerHTML = me ? '交出操作 <kbd>T</kbd>' : (myReq ? '等待同意…' : '请求操作 <kbd>T</kbd>');
      const incoming = me && W.req && !myReq;
      $('reqp').classList.toggle('hidden', !incoming); if (incoming) $('rqTxt').textContent = '对方请求接手操作';
    } else $('reqp').classList.add('hidden');
    const tb = $('timerb'); if (W.timer && W.timer.label != null) { tb.classList.remove('hidden'); const s = Math.max(0, Math.ceil(W.timer.left)); tb.textContent = (W.timer.label ? W.timer.label + ' ' : '') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); } else tb.classList.add('hidden');
    // 对话
    const D = $('dlg'), d = W.dlg;
    if (d && !W.card && !W.note) {
      D.classList.remove('hidden');
      if (d.id !== this._dlgId) {
        this._dlgId = d.id; this._n = -1;
        D.className = d.style || ''; D.querySelector('.who').textContent = d.who || '';
        const C = D.querySelector('.chs'); C.innerHTML = '';
        this._vsel = 0;
        if (d.choices) d.choices.forEach((t, i) => { const b = document.createElement('button'); b.className = 'ch'; b.textContent = t; b.onclick = ev => { ev.stopPropagation(); if (W.dlg && W.dlg.vote) { this._vsel = i; sendAct('vote', i); } else if (iControl()) sendAct('pick', i); else this.toast('对方在操作'); }; C.appendChild(b); });
      }
      const len = d.text.length, n = d.full ? len : Math.min(len, Math.floor((RT - d.t0) * CPS));
      if (n !== this._n) { D.querySelector('.txt').textContent = d.text.slice(0, n); if (n > this._n && n < len && n % 2 === 0) AU.sfx('blip'); this._n = n; }
      const full = n >= len, C = D.querySelector('.chs');
      C.classList.toggle('hidden', !(d.choices && full));
      const me = NET.role === 'guest' ? 'g' : 'h', oth = me === 'h' ? 'g' : 'h';
      const mine = d.vote ? d.vote[me] : null;
      [...C.children].forEach((b, i) => { b.classList.toggle('sel', d.vote ? (mine != null ? i === mine : i === this._vsel) : i === d.sel); b.classList.toggle('voted', !!(d.vote && mine === i)); });
      D.querySelector('.more').classList.toggle('hidden', !full || !!d.choices);
      const Wt = D.querySelector('.watch');
      if (d.vote) { Wt.classList.toggle('hidden', !full); const o = d.vote[oth]; Wt.textContent = mine == null ? (o == null ? '两人一起决定 · 各选一个' : '对方已经选好了 · 轮到你') : (o == null ? '你选好了 · 等对方……' : (o === mine ? '你们选了同一个' : '你们的选择不一样……')); }
      else { Wt.textContent = '对方操作中'; Wt.classList.toggle('hidden', !coop || iControl()); }
    } else if (!D.classList.contains('hidden')) { D.classList.add('hidden'); this._dlgId = -1; }
    document.body.classList.toggle('dlgup', !!(d || W.card || W.note || W.keypad || W.endScreen));
    // 标题卡
    const cd = W.card;
    if (cd) { if (cd.id !== this._cardId) { this._cardId = cd.id; const C = $('card'); C.classList.remove('hidden'); C.querySelector('.t').textContent = cd.title; C.querySelector('.s').textContent = cd.sub; C.querySelector('.b').textContent = cd.body; C.style.animation = 'none'; void C.offsetWidth; C.style.animation = ''; } }
    else if (this._cardId !== -1) { $('card').classList.add('hidden'); this._cardId = -1; }
    const nt = W.note;
    if (nt) { if (nt.id !== this._noteId) { this._noteId = nt.id; const N = $('note'); N.classList.remove('hidden'); N.querySelector('h3').textContent = nt.title; N.querySelector('.tx').textContent = nt.text; N.querySelector('.paper').scrollTop = 0; } }
    else if (this._noteId !== -1 && !this._localNote) { $('note').classList.add('hidden'); this._noteId = -1; }
    const kp = W.keypad;
    if (kp) {
      if (kp.id !== this._kpId) { this._kpId = kp.id; $('keypad').classList.remove('hidden'); $('kpP').textContent = kp.prompt; const K = $('kpK'); K.innerHTML = ''; kp.keys.forEach(k => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = k; b.onclick = () => iControl() ? sendAct('key', k) : this.toast('对方在操作'); K.appendChild(b); }); $('kpX').classList.toggle('hidden', !kp.cancel); setTimeout(() => this.focusFirst(), 20); }
      const parts = kp.parts || kp.val.split(''), sep = kp.sep || (kp.keys.some(k => k.length > 1) ? ' ' : '');
      $('kpV').textContent = parts.concat(Array(Math.max(0, kp.len - parts.length)).fill('·')).join(sep);
    } else if (this._kpId !== -1) { $('keypad').classList.add('hidden'); this._kpId = -1; }
    const es = W.endScreen;
    if (es) {
      const key = es.kind + '|' + es.title;
      if (key !== this._endKey) {
        this._endKey = key; const E = $('endov'); E.classList.remove('hidden'); E.className = 'ov ' + (es.kind === 'die' ? 'die' : '');
        $('enT').textContent = es.title; $('enX').textContent = es.text || '';
        $('enL').innerHTML = es.kind === 'end' && W.ch.legend ? '<b>怪谈档案 · ' + esc(W.ch.title) + '</b>\n' + esc(W.ch.legend) : ''; $('enL').classList.toggle('hidden', es.kind !== 'end');
        const B = $('enB'); B.innerHTML = '';
        const add = (t, a, pri) => { const b = document.createElement('button'); b.className = 'btn' + (pri ? ' primary' : ''); b.textContent = t; b.onclick = () => sendAct(a); B.appendChild(b); };
        if (es.kind === 'die' || es.kind === 'badend') add('从检查点重来', 'retry', true);
        if (es.kind !== 'die') add('再玩一次', 'replay', es.kind === 'end' ? false : false);
        if (NET.role !== 'guest') add('返回章节', 'leave', es.kind === 'end');
        setTimeout(() => this.focusFirst(), 900);
      }
    } else if (this._endKey) { $('endov').classList.add('hidden'); this._endKey = ''; }
    // 触屏调查键高亮
    $('bA').classList.toggle('hot', !!(W.hint && iControl() && canMove()));
    $('bA').textContent = (d || W.card || W.note) ? '继续' : '调查';
  }
};
function showLocalNote(n) {
  UI._localNote = true; const N = $('note'); N.classList.remove('hidden'); N.querySelector('h3').textContent = n.title; N.querySelector('.tx').textContent = n.text;
  UI.modal = 'note'; if (W && NET.role === 'solo') W.paused = true;
}
function closeLocalNote() { UI._localNote = false; $('note').classList.add('hidden'); UI.modal = null; UI._noteId = -1; if (W) W.paused = false; }

/* ---------- 章节缩略图 ---------- */
function drawThumb(c, ch) {
  const g = c.getContext('2d'), w = c.width, h = c.height; g.imageSmoothingEnabled = false;
  const col = ch.color || '#3a1a22';
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, shade(col, -.55)); gr.addColorStop(1, shade(col, -.15)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${hash(i, 1, ch.n) * .06})`; g.fillRect((hash(i, 2, ch.n) * w) | 0, (hash(i, 3, ch.n) * h) | 0, 1, 1); }
  g.fillStyle = shade(col, -.7); g.fillRect(0, h - 22, w, 22);
  if (ch.thumb) ch.thumb(g, w, h);
  const P = typeof ch.icon === 'string' ? (ch.people && ch.people[ch.icon.slice(1)]) : ch.icon;
  if (P) { const s = personSprite(P, ch.iconDir ?? 0, 0); g.drawImage(s, w / 2 - 24 + (ch.iconX || 18), h - 22 - 66, 48, 72); }
  const vg = g.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
/* ---------- 标题背景 ---------- */
let TB = { face: 0, next: 5 };
function drawTitleBG(g) {
  const t = RT; g.fillStyle = '#060508'; g.fillRect(0, 0, VW, VH);
  const fy = Math.floor(VH * .58);
  for (let y = fy; y < VH; y += 16) for (let x = 0; x < VW; x += 16) { const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); }; TILE.darkwood.paint(R, x / 16 | 0, y / 16 | 0); }
  g.fillStyle = '#16121a'; g.fillRect(0, 0, VW, fy);
  for (let x = 0; x < VW; x += 5) { g.fillStyle = '#1c1720'; g.fillRect(x, 0, 1, fy); }
  g.fillStyle = '#0c0a0e'; g.fillRect(0, fy - 3, VW, 3);
  // 镜子（2 倍）
  const mx = Math.floor(VW / 2) - 16, my = fy - 40;
  const mc = mk(16, 16), m2 = mc.getContext('2d'); const Rm = (a, b, w, h, col) => { if (!col) return; m2.fillStyle = col; m2.fillRect(a, b + 2, w, h); };
  if (t > TB.next) { TB.face = t + .25 + Math.random() * .2; TB.next = t + 6 + Math.random() * 7; }
  SPR.mirror(m2, { face: t < TB.face ? 'red' : null }, t, Rm);
  g.drawImage(mc, mx, my - 4, 32, 32);
  // 蜡烛
  const cR = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(Math.floor(VW / 2) - 8 + a, fy + 6 + b, w, h); };
  SPR.candle(g, { x: 0 }, t, cR);
  // 光
  const lr = 70 + Math.sin(t * 11) * 2 + (Math.random() < .03 ? -12 : 0);
  if (lightCv.width !== VW || lightCv.height !== VH) { lightCv.width = VW; lightCv.height = VH; }
  const L = lx; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, VW, VH); L.fillStyle = 'rgba(3,2,6,.95)'; L.fillRect(0, 0, VW, VH);
  L.globalCompositeOperation = 'destination-out';
  const gr = L.createRadialGradient(VW / 2, fy + 10, 4, VW / 2, fy + 10, lr); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.beginPath(); L.arc(VW / 2, fy + 10, lr, 0, 7); L.fill();
  L.globalCompositeOperation = 'source-over'; g.drawImage(lightCv, 0, 0);
  g.globalCompositeOperation = 'lighter'; const wg = g.createRadialGradient(VW / 2, fy + 10, 0, VW / 2, fy + 10, lr * .7); wg.addColorStop(0, 'rgba(255,150,60,.18)'); wg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = wg; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over';
  if (t < TB.face && Math.random() < .5) { g.fillStyle = 'rgba(120,0,0,.08)'; g.fillRect(0, 0, VW, VH); }
  vignette(g);
}

/* ---------- 绑定 ---------- */
function goSelect() {
  quitChapter(); UI.show('select');
  if (NET.role === 'host') netSend({ t: 'scene', scene: 'select' });
}
function bindMenu() {
  $('mRes').onclick = () => UI.closeModal();
  $('mInv').onclick = () => UI.open('inv');
  $('mJour').onclick = () => UI.open('journal');
  $('mHelp').onclick = () => UI.open('help');
  $('mRetry').onclick = () => { UI.closeModal(); if (NET.role === 'guest') netSend({ t: 'act', a: 'mretry' }); else if (W && W.cp) retryFromCP(); };
  $('mQuit').onclick = () => { UI.closeModal(); if (NET.role === 'guest') { netClose(); quitChapter(); UI.show('title'); } else goSelect(); };
  $('mHub').onclick = () => { if (!UI._hubArm) { UI._hubArm = true; $('mHub').textContent = '再点一次确认（进度会保存到检查点）'; return; } location.href = '../'; };
}
function bindUI() {
  bindMenu();
  $('tStart').onclick = () => { netClose(); UI.show('select'); };
  $('tHost').onclick = () => {
    if (!NET_OK) { UI.toast(window.__ARTIFACT__ ? '这个预览版只能单人游玩，双人请打开游戏厅网址' : '联机组件没有加载成功'); return; }
    UI.show('lobby'); $('lbT').textContent = '创建房间'; $('lbHost').classList.remove('hidden'); $('lbJoin').classList.add('hidden'); $('lbCode').textContent = '····'; $('lbS').textContent = '正在连接…';
    hostRoom((st, a) => {
      if (st === 'open') { $('lbCode').textContent = a; $('lbS').textContent = '等待对方加入…'; }
      if (st === 'joined') { UI.toast('对方已加入'); UI.show('select'); }
      if (st === 'error') $('lbS').textContent = '连接失败：' + a;
    });
  };
  $('tJoin').onclick = () => {
    if (!NET_OK) { UI.toast(window.__ARTIFACT__ ? '这个预览版只能单人游玩，双人请打开游戏厅网址' : '联机组件没有加载成功'); return; }
    UI.show('lobby'); $('lbT').textContent = '加入房间'; $('lbHost').classList.add('hidden'); $('lbJoin').classList.remove('hidden'); $('lbS').textContent = ''; $('joinCode').value = ''; setTimeout(() => $('joinCode').focus(), 50);
  };
  const doJoin = () => {
    const code = $('joinCode').value.trim().toUpperCase(); if (code.length !== 4) { $('lbS').textContent = '房间码是 4 位'; return; }
    $('lbS').textContent = '正在连接…';
    joinRoom(code, (st, a) => {
      if (st === 'joined') { UI.toast('已加入房间'); UI.show('select'); }
      if (st === 'error') $('lbS').textContent = a === 'peer-unavailable' ? '找不到这个房间' : a === 'timeout' ? '连接超时，请检查房间码' : '连接失败：' + a;
    });
  };
  $('lbGo').onclick = doJoin;
  $('joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); e.stopPropagation(); });
  $('lbX').onclick = () => { netClose(); UI.show('title'); }; $('lbX').dataset.back = 1;
  $('tArch').onclick = () => UI.show('archive');
  $('tHelp').onclick = () => UI.open('help');
  $('hpX').onclick = () => UI.closeModal(); $('hpX').dataset.back = 1;
  $('tHub').classList.toggle('hidden', !HUB); $('tHub').onclick = () => { location.href = '../'; };
  $('sBack').onclick = () => { if (NET.role !== 'solo') netClose(); UI.show('title'); }; $('sBack').dataset.back = 1;
  $('sArch').onclick = () => { UI._archBack = 'select'; UI.show('archive'); };
  $('arX').onclick = () => { UI.show(UI._archBack || 'title'); UI._archBack = null; }; $('arX').dataset.back = 1;
  $('tArch').onclick = () => { UI._archBack = 'title'; UI.show('archive'); };
  $('hInv').onclick = () => UI.open('inv'); $('hJour').onclick = () => UI.open('journal'); $('hMenu').onclick = () => UI.open('menu');
  $('hMute').onclick = () => { AU.init(); AU.setMute(!AU.muted); muteBtn(); };
  $('invX').onclick = () => UI.closeModal(); $('invX').dataset.back = 1;
  $('jrX').onclick = () => UI.closeModal(); $('jrX').dataset.back = 1;
  $('mRes').dataset.back = 1;
  $('cbBtn').onclick = () => ctrlButton();
  $('rqY').onclick = () => ctrlAnswer(true); $('rqN').onclick = () => ctrlAnswer(false);
  $('kpDel').onclick = () => iControl() && sendAct('keydel'); $('kpX').onclick = () => iControl() && sendAct('keycancel');
  $('dlg').addEventListener('pointerdown', e => { if (e.target.classList.contains('ch')) return; e.preventDefault(); advanceTap(); });
  $('card').addEventListener('pointerdown', e => { e.preventDefault(); advanceTap(); });
  $('note').addEventListener('pointerdown', e => { e.preventDefault(); if (UI._localNote) { closeLocalNote(); return; } advanceTap(); });
  for (const id of ['menu', 'inv', 'journal', 'help']) $(id).addEventListener('pointerdown', e => { if (e.target === $(id)) UI.closeModal(); });
  muteBtn();
  // 画布：点击 = 翻页 / 标记
  cv.addEventListener('pointerdown', e => { if (UI.scene !== 'play' || !W) return; canvasTap(e.clientX, e.clientY); });
  // 触屏摇杆
  const T = $('touch'), jb = $('joyb'), jk = $('joyk');
  T.addEventListener('pointerdown', e => {
    if (e.target !== T) return; AU.init();
    if (e.clientX < SW * .5 && !IN.joy) { IN.joy = { id: e.pointerId, x: e.clientX, y: e.clientY }; jb.style.left = jk.style.left = e.clientX + 'px'; jb.style.top = jk.style.top = e.clientY + 'px'; jb.classList.remove('hidden'); jk.classList.remove('hidden'); T.setPointerCapture(e.pointerId); }
    else canvasTap(e.clientX, e.clientY);
    e.preventDefault();
  });
  T.addEventListener('pointermove', e => {
    const j = IN.joy; if (!j || e.pointerId !== j.id) return;
    let dx = e.clientX - j.x, dy = e.clientY - j.y; const l = Math.hypot(dx, dy), mx = 40;
    if (l > mx) { dx = dx / l * mx; dy = dy / l * mx; }
    jk.style.left = (j.x + dx) + 'px'; jk.style.top = (j.y + dy) + 'px';
    const pd = IN.joyDir;
    IN.joyDir = l < 14 ? -1 : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
    if (IN.joyDir !== pd && IN.joyDir >= 0) IN.press(['down', 'left', 'right', 'up'][IN.joyDir]);
  });
  const endJ = e => { const j = IN.joy; if (!j || e.pointerId !== j.id) return; IN.joy = null; IN.joyDir = -1; jb.classList.add('hidden'); jk.classList.add('hidden'); };
  T.addEventListener('pointerup', endJ); T.addEventListener('pointercancel', endJ);
  $('bA').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AU.init(); IN.press('a'); });
  $('bRun').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); IN.runLatch = !IN.runLatch; $('bRun').classList.toggle('on', IN.runLatch); });
  // 键盘：密码盘
  addEventListener('keydown', e => {
    if (!W || !W.keypad || !iControl() || UI.modal) return;
    const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    const al = W.keypad.alias && W.keypad.alias[k];   // 键盘别名，如 {'0':'10', O:'开', C:'关'}
    if (al && W.keypad.keys.includes(al)) { sendAct('key', al); e.preventDefault(); }
    else if (k !== ' ' && W.keypad.keys.includes(k)) { sendAct('key', k); e.preventDefault(); }
  });
}
function muteBtn() { $('hMute').textContent = AU.muted ? '✕' : '♪'; }
function advanceTap() { if (!W) return; if (!iControl()) { if (NET.role !== 'solo') UI.toast('对方在操作 · 按 T 或顶部按钮请求'); return; } sendAct('adv'); }
function canvasTap(x, y) {
  if (!W) return;
  if (W.dlg || W.card || W.note) { advanceTap(); return; }
  if (NET.role !== 'solo' && NET.up) { const wx = CAM.x + x / SC, wy = CAM.y + y / SC; sendPing(Math.round(wx), Math.round(wy)); }
}
/* 全局按键分发 */
IN.handlers.push(n => {
  if (n === 'mute') { AU.setMute(!AU.muted); muteBtn(); return true; }
  if (n === 'del' && !(W && W.keypad && UI.scene === 'play' && !UI.modal)) n = 'b';
  if (UI.modal) {
    if (UI.modal === 'note' && UI._localNote) { if (n === 'a' || n === 'b' || n === 'menu' || n === 'journal') { closeLocalNote(); } return true; }
    if (n === 'menu' || n === 'b' || (n === 'inv' && UI.modal === 'inv') || (n === 'journal' && UI.modal === 'journal')) { UI.closeModal(); return true; }
    UI.nav(n); return true;
  }
  if (UI.scene !== 'play') { if (n === 'b' || n === 'menu') { UI.nav('b'); return true; } UI.nav(n); return true; }
  if (!W) return true;
  if (W.endScreen) { UI.nav(n); return true; }
  if (n === 'menu') { UI.open('menu'); return true; }
  if (n === 'inv') { UI.open('inv'); return true; }
  if (n === 'journal') { UI.open('journal'); return true; }
  if (n === 'ctrl') { ctrlButton(); return true; }
  if (n === 'yes' && ctrlAnswer(true)) return true;
  if (n === 'no' && ctrlAnswer(false)) return true;
  if (W.keypad) {
    if (!iControl()) return true;
    if (n === 'del') sendAct('keydel');
    else if (n === 'b') sendAct('keycancel');
    else if (['up', 'down', 'left', 'right', 'a'].includes(n)) { if (!UI.nav(n) && n === 'a') { const f = $('kpK').querySelector('.btn'); if (f) f.focus(); } }
    return true;
  }
  if (W.dlg && W.dlg.vote) {   // 投票：两人各自选择
    const d = W.dlg, full = d.full || (RT - d.t0) * CPS >= d.text.length;
    if (n === 'a') { if (!full) sendAct('adv'); else sendAct('vote', UI._vsel || 0); return true; }
    if ((n === 'up' || n === 'down') && full) { UI._vsel = ((UI._vsel || 0) + (n === 'up' ? -1 : 1) + d.choices.length) % d.choices.length; AU.sfx('select'); return true; }
    return true;
  }
  if (!iControl()) { if (n === 'a' && NET.role !== 'solo') UI.toast('对方在操作 · 按 T 请求操作'); return true; }
  if (n === 'a') { sendAct(W.dlg || W.card || W.note ? 'adv' : 'use'); return true; }
  if (W.dlg && W.dlg.choices && (n === 'up' || n === 'down')) { sendAct('sel', n === 'up' ? -1 : 1); return true; }
  return false;
});
