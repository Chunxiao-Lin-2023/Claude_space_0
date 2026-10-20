/* 你画我猜 — draw & guess. Turn game: every finished stroke / guess is an action (replayable); live strokes stream via ctx.send. */
const D = BX.draw, C = BX.C;
const BW = 800, BH = 600;                       // board logical size
const COLS = ['#1b1510', '#b23a2b', '#d9822b', '#e3b22c', '#3f8f5b', '#2f5d8a', '#7a4a9a', '#8a5a2b'];
const PAPER = '#fbf6e9', ERASER = 8;
const SIZES = [4, 9, 18];
const DRAW_T = 80, PICK_T = 15, SHOW_T = 4.5;
const words = () => BX.data.pictWords || [['猫', '动物']];
const norm = s => String(s || '').replace(/[\s，。,.!！?？、'"“”]/g, '');

BX.register({
  id: 'pictionary', title: '你画我猜', cat: 'social', order: 2, sub: '一人作画，众人抢答',
  desc: '轮流当画手：从三个词里挑一个画出来，其他人看图猜词，猜得越快分越高。联机时各自输入答案；同屏时大家口头抢答，画手点选猜对的人。',
  kind: 'turn', seats: [2, 6], defSeats: 2, modes: ['local', 'online'], aiLevels: false, undo: false, hidden: true, noFirst: true, noTurnChime: true,
  options: [{key: 'cyc', label: '每人作画', choices: [[1, '1 次'], [2, '2 次'], [3, '3 次']], def: 2}],
  rules: `<p>玩家轮流担任<b>画手</b>。画手从系统给出的 <b>3 个词</b>中选一个，在 <b>${DRAW_T} 秒</b>内把它画出来——<b>不许写字、不许画数字和拼音</b>。</p>
<p>其他人是<b>猜词者</b>：</p>
<ul><li><b>联机对战</b>：在输入框里打出答案，猜错的话所有人可见，猜对只显示“猜对了”。</li>
<li><b>同屏对战</b>：画手拿着设备给大家看画，其他人<b>口头抢答</b>，画手点选猜对的人的名字。画手可以按住「看词」偷看词语。</li></ul>
<p><b>计分</b>：第一个猜对得 10 分，之后依次 8、6、4…（最少 4 分），另按速度加 0～5 分；每有一人猜对，画手得 3 分，全员猜对再奖励 2 分。</p>
<p>所有猜词者都猜对或时间到，本轮结束并公布答案。每人作画的轮数可在开局时选择，总分最高者获胜。</p>
<p>工具：8 种颜色、3 种笔粗、橡皮、撤销一笔、清空画布。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 21, base: '#8a5a32'});
    // easel paper
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.fillStyle = PAPER; g.fillRect(w * .1, h * .1, w * .58, h * .72); g.restore();
    // a cat drawn in brush strokes
    g.strokeStyle = '#1b1510'; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
    const cx = w * .39, cy = h * .5, r = h * .17;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cx - r * .85, cy - r * .5); g.lineTo(cx - r * .75, cy - r * 1.35); g.lineTo(cx - r * .25, cy - r * .95);
    g.moveTo(cx + r * .85, cy - r * .5); g.lineTo(cx + r * .75, cy - r * 1.35); g.lineTo(cx + r * .25, cy - r * .95); g.stroke();
    g.fillStyle = '#1b1510'; D.circle(g, cx - r * .38, cy - r * .1, 2.5); g.fill(); D.circle(g, cx + r * .38, cy - r * .1, 2.5); g.fill();
    g.strokeStyle = '#b23a2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy + r * .2); g.lineTo(cx - r * .2, cy + r * .4); g.moveTo(cx, cy + r * .2); g.lineTo(cx + r * .2, cy + r * .4); g.stroke();
    g.strokeStyle = '#1b1510'; g.lineWidth = 1.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * .5, cy + r * .2); g.lineTo(cx + s * r * 1.3, cy + r * .05); g.moveTo(cx + s * r * .5, cy + r * .32); g.lineTo(cx + s * r * 1.3, cy + r * .4); g.stroke(); }
    // brush
    g.save(); g.translate(w * .64, h * .74); g.rotate(-.7);
    g.fillStyle = '#c8a052'; g.fillRect(-3, -h * .45, 6, h * .38); g.fillStyle = '#1b1510'; g.beginPath(); g.moveTo(-4, -h * .07); g.lineTo(4, -h * .07); g.lineTo(0, 6); g.fill(); g.restore();
    // bubble
    g.fillStyle = '#fffaf0'; D.rr(g, w * .68, h * .12, w * .27, h * .3, 10); g.fill();
    g.beginPath(); g.moveTo(w * .72, h * .4); g.lineTo(w * .68, h * .5); g.lineTo(w * .78, h * .41); g.fill();
    D.text(g, '猫？', w * .815, h * .27, {size: h * .15, color: C.red, font: 'serif', weight: 800});
  },
  create(ctx) {
    const n = ctx.n, local = ctx.mode === 'local';
    const cyc = BX.test ? 1 : (+ctx.opts.cyc || 2);
    const total = BX.test ? Math.min(n, 2) : n * cyc;
    const st = {round: 0, total, drawer: 0, ph: 'pick', rk: 0, choices: [], word: -1, usedW: {}, strokes: [], solved: [], guesses: [], score: BX.range(n).map(() => 0), last: null, over: false};
    let phaseT = performance.now(), ver = 0;
    const W = words();
    function deal() {
      const ch = [], cats = new Set();
      let guard = 0;
      while (ch.length < 3 && guard++ < 400) {
        const i = ctx.rng.int(W.length);
        if (st.usedW[i] || ch.includes(i) || (cats.has(W[i][1]) && guard < 200)) continue;
        ch.push(i); cats.add(W[i][1]);
      }
      st.choices = ch;
    }
    function startRound() {
      st.drawer = st.round % n; st.ph = 'pick'; st.rk++; st.word = -1; st.strokes = []; st.solved = []; st.guesses = []; st.last = null;
      deal(); phaseT = performance.now(); ver++;
    }
    startRound();
    const guessers = () => BX.range(n).filter(i => i !== st.drawer);
    const unsolved = () => guessers().filter(i => !st.solved.some(s => s.s === i));
    const word = () => st.word >= 0 ? W[st.word][0] : '';
    const elapsed = () => (performance.now() - phaseT) / 1000;
    function scribble() {   // bot drawer: a wobbly random stroke
      const p = []; let x = 150 + Math.random() * 500, y = 120 + Math.random() * 360, a = Math.random() * 6.28;
      const k = 8 + Math.floor(Math.random() * 14);
      for (let i = 0; i < k; i++) { p.push(Math.round(BX.clamp(x, 5, BW - 5)), Math.round(BX.clamp(y, 5, BH - 5))); a += (Math.random() - .5) * 1.4; x += Math.cos(a) * 28; y += Math.sin(a) * 28; }
      return {t: 's', c: Math.floor(Math.random() * COLS.length), z: Math.floor(Math.random() * 3), p};
    }
    /* ---------- DOM ---------- */
    const cv = ctx.canvas();
    const css = document.createElement('style');
    css.textContent = `.pc-panel{position:absolute;display:flex;flex-direction:column;gap:8px;overflow:hidden;pointer-events:auto}
.pc-tools{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.pc-tools button{width:40px;height:40px;border-radius:50%;border:3px solid rgba(255,255,255,.25);padding:0;box-shadow:0 2px 4px rgba(0,0,0,.35);color:#f3e2c0;font-size:16px;background:rgba(255,255,255,.08)}
.pc-tools button.on{border-color:#ffd76a;box-shadow:0 0 0 2px #ffd76a,0 2px 6px rgba(0,0,0,.4)}
.pc-tools .sz i{display:block;margin:auto;border-radius:50%;background:#f3e2c0}
.pc-feed{flex:1;min-height:40px;overflow-y:auto;background:rgba(250,244,228,.94);border-radius:12px;padding:6px 10px;font-size:15px;line-height:1.55;color:#2b2118;box-shadow:inset 0 0 0 1px rgba(120,80,40,.2)}
.pc-feed div{border-bottom:1px dashed rgba(120,80,40,.15);padding:1px 0}
.pc-feed b{font-weight:700}.pc-feed .ok{color:#3f7f6b;font-weight:700}.pc-feed .sys{color:#8c7a63;font-size:13px}
.pc-row{display:flex;gap:8px;align-items:center}
.pc-in{flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid #c8a052;background:#fffaf0;color:#2b2118;font:700 18px "Noto Serif SC","Songti SC",serif;padding:0 12px;outline:none}
.pc-in:focus{border-color:#b23a2b}
.pc-row .bx-btn{flex:none;padding:8px 14px}
.pc-who{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.pc-who button{min-height:44px;border-radius:12px;border:none;padding:6px 12px;color:#fff;font-weight:700;font-size:15px;box-shadow:0 3px 0 rgba(0,0,0,.35)}
.pc-who button:disabled{opacity:.4}
.pc-lbl{color:#e6c57d;font-size:13px;text-align:center;letter-spacing:1px}
.pc-pick{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,92%);text-align:center}
.pc-pick h3{margin:0 0 4px;font-family:"ZCOOL XiaoWei","Noto Serif SC",serif;font-weight:400;font-size:24px;letter-spacing:3px;color:#ffd9a0}
.pc-pick p{margin:0 0 12px;font-size:13px;opacity:.8}
.pc-pick .bx-btn{display:block;width:100%;margin:8px 0;font-size:20px;min-height:52px;font-family:"Noto Serif SC","Songti SC",serif}
.pc-pick .bx-btn small{font-size:12px;opacity:.75;margin-left:8px;font-family:sans-serif}
.pc-peek{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}`;
    ctx.el.append(css);
    const ui = ctx.ui();
    const panel = BX.h('div', {class: 'pc-panel'});
    const pick = BX.h('div', {class: 'pc-pick bx-panel', hidden: true});
    ui.append(panel, pick);
    // tool state (local only)
    let col = 0, sz = 1, eraser = false, peek = false;
    const tools = BX.h('div', {class: 'pc-tools'});
    const colBtns = COLS.map((c, i) => BX.h('button', {style: {background: c}, title: '颜色', on: {click: () => { col = i; eraser = false; ctx.sfx('tick'); syncTools(); }}}));
    const szBtns = SIZES.map((s, i) => BX.h('button', {class: 'sz', title: '粗细', on: {click: () => { sz = i; ctx.sfx('tick'); syncTools(); }}}, BX.h('i', {style: {width: (4 + i * 6) + 'px', height: (4 + i * 6) + 'px'}})));
    const bErase = BX.h('button', {text: '擦', title: '橡皮', on: {click: () => { eraser = !eraser; ctx.sfx('tick'); syncTools(); }}});
    const bUndo = BX.h('button', {text: '↶', title: '撤销一笔', on: {click: () => { if (canDraw() && st.strokes.length) queue.push({t: 'undo'}); }}});
    const bClear = BX.h('button', {text: '✕', title: '清空', on: {click: () => { if (canDraw() && st.strokes.length) queue.push({t: 'clear'}); }}});
    tools.append(...colBtns, ...szBtns, bErase, bUndo, bClear);
    function syncTools() {
      colBtns.forEach((b, i) => b.classList.toggle('on', !eraser && i === col));
      szBtns.forEach((b, i) => b.classList.toggle('on', i === sz));
      bErase.classList.toggle('on', eraser);
    }
    syncTools();
    const feed = BX.h('div', {class: 'pc-feed'});
    const inp = BX.h('input', {class: 'pc-in', type: 'text', maxlength: 12, autocomplete: 'off', enterkeyhint: 'send', placeholder: '输入你的答案'});
    const bSend = BX.h('button', {class: 'bx-btn red', text: '猜'});
    const inRow = BX.h('div', {class: 'pc-row'}, inp, bSend);
    const who = BX.h('div', {class: 'pc-who'});
    const bPeek = BX.h('button', {class: 'bx-btn pc-peek', text: '按住看词'});
    const bEnd = BX.h('button', {class: 'bx-btn ghost', text: '结束本轮'});
    const locRow = BX.h('div', {class: 'pc-row', style: {justifyContent: 'center'}}, bPeek, bEnd);
    const whoLbl = BX.h('div', {class: 'pc-lbl', text: '谁猜对了？按猜对的先后点名字'});
    const setPeek = v => e => { peek = v; if (e && e.cancelable) e.preventDefault(); };
    ctx.on(bPeek, 'pointerdown', setPeek(true)); ctx.on(bPeek, 'pointerup', setPeek(false)); ctx.on(bPeek, 'pointerleave', setPeek(false)); ctx.on(bPeek, 'pointercancel', setPeek(false));
    ctx.on(bPeek, 'contextmenu', e => e.preventDefault());
    ctx.on(bEnd, 'click', async () => { if (!canDraw()) return; if (await BX.confirm('提前结束本轮并公布答案？', '结束')) { if (canDraw()) queue.push({t: 'end'}); } });
    function sendGuess() {
      const me = ctx.me, txt = norm(inp.value).slice(0, 12);
      if (!txt || !canGuess(me)) return;
      inp.value = '';
      ctx.act({t: 'g', txt, el: Math.round(Math.min(DRAW_T, elapsed()))}, me);
    }
    ctx.on(inp, 'keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendGuess(); } });
    ctx.on(bSend, 'click', sendGuess);
    /* ---------- action queue (drawer's strokes; a guest may have only one request in flight) ---------- */
    const queue = [];
    const canDraw = () => !st.over && st.ph === 'draw' && ctx.isLocal(st.drawer) && ctx.canAct(st.drawer);
    const canGuess = s => !local && !st.over && st.ph === 'draw' && s !== st.drawer && ctx.canAct(s);
    function flush() {
      if (!queue.length) return;
      if (st.ph !== 'draw' || !ctx.isLocal(st.drawer)) { queue.length = 0; return; }
      if (!ctx.canAct(st.drawer)) return;
      const a = queue[0];
      if (a.t === 'end' && local) {} // fine
      if (ctx.act(a, st.drawer) !== false) queue.shift();
    }
    /* ---------- layout ---------- */
    let G = null, uiSig = '';
    function layout() {
      const Wd = cv.w, Hd = cv.h, land = Wd > Hd * 1.15;
      const pad = 8;
      let hdr, bx, by, bw, bh, px, py, pw, ph;
      if (land) {
        pw = BX.clamp(Wd * .34, 220, 380); hdr = Math.min(46, Hd * .12);
        const aw = Wd - pw - pad * 3, ah = Hd - hdr - pad * 2;
        bw = Math.min(aw, ah * BW / BH); bh = bw * BH / BW;
        bx = pad + (aw - bw) / 2; by = hdr + pad + (ah - bh) / 2;
        px = Wd - pw - pad; py = pad; ph = Hd - pad * 2;
      } else {
        hdr = 46;
        bw = Math.min(Wd - pad * 2, (Hd - hdr - 170) * BW / BH); bh = bw * BH / BW;
        bx = (Wd - bw) / 2; by = hdr + 4;
        px = pad; py = by + bh + pad; pw = Wd - pad * 2; ph = Hd - py - pad;
      }
      G = {land, hdr, bx, by, bw, bh, s: bw / BW, hx: land ? bx : pad, hw: land ? bw : Wd - pad * 2};
      const sig = [px, py, pw, ph].map(Math.round).join(',');
      if (sig !== panel._sig) { panel._sig = sig; Object.assign(panel.style, {left: px + 'px', top: py + 'px', width: pw + 'px', height: ph + 'px'}); }
    }
    function refreshUI() {
      const me = ctx.me, dr = st.drawer;
      const amDrawer = ctx.isLocal(dr) && (local ? ctx.view === dr : me === dr);
      const sig = [st.ph, st.rk, amDrawer, st.solved.length, st.guesses.length, ctx.view, st.over, unsolved().includes(me)].join('|');
      if (sig === uiSig) return; uiSig = sig;
      panel.innerHTML = '';
      // pick overlay
      if (st.ph === 'pick' && !st.over && ctx.isLocal(dr) && ctx.canAct(dr)) {
        pick.hidden = false; pick.innerHTML = '';
        pick.append(BX.h('h3', {text: '请选择要画的词'}), BX.h('p', {text: local ? '只有你能看到，选好后开始 ' + DRAW_T + ' 秒计时' : PICK_T + ' 秒内不选将自动选择第一个'}));
        st.choices.forEach((wi, k) => pick.append(BX.h('button', {class: 'bx-btn' + (k === 0 ? ' red' : ''), html: BX.esc(W[wi][0]) + '<small>' + BX.esc(W[wi][1]) + '</small>', on: {click: () => { if (st.ph === 'pick' && ctx.canAct(dr)) { ctx.sfx('select'); ctx.act({t: 'pick', i: k}, dr); } }}})));
      } else pick.hidden = true;
      if (st.ph === 'draw' && amDrawer) {
        panel.append(tools);
        if (local) {
          panel.append(locRow, whoLbl, who); who.innerHTML = '';
          for (const s of guessers()) {
            const done = st.solved.find(x => x.s === s);
            who.append(BX.h('button', {style: {background: ctx.color(s)}, disabled: !!done, text: (done ? '✓ ' : '') + ctx.name(s), on: {click: () => { if (canDraw() && !st.solved.some(x => x.s === s)) { ctx.sfx('score'); queue.push({t: 'ok', s, el: Math.round(Math.min(DRAW_T, elapsed()))}); } }}}));
          }
        }
      }
      if (!local) {
        panel.append(feed);
        if (st.ph === 'draw' && !amDrawer && unsolved().includes(me) && ctx.isLocal(me)) panel.append(inRow);
        renderFeed();
      } else if (st.ph !== 'draw' || !amDrawer) {
        panel.append(feed); renderFeed();
      }
      if (!panel.contains(inp) && document.activeElement === inp) inp.blur();
    }
    function renderFeed() {
      feed.innerHTML = '';
      const add = (html, cls) => feed.append(BX.h('div', {class: cls || '', html}));
      add('第 ' + (st.round + 1) + '/' + total + ' 轮 · 画手 <b style="color:' + ctx.color(st.drawer) + '">' + BX.esc(ctx.name(st.drawer)) + '</b>', 'sys');
      if (st.ph === 'pick') add(BX.esc(ctx.name(st.drawer)) + ' 正在选词…', 'sys');
      for (const g of st.guesses) {
        if (g.ok) add('<b style="color:' + ctx.color(g.by) + '">' + BX.esc(ctx.name(g.by)) + '</b> 猜对了！+' + g.pts, 'ok');
        else add('<b style="color:' + ctx.color(g.by) + '">' + BX.esc(ctx.name(g.by)) + '</b>：' + BX.esc(g.txt));
      }
      if (st.ph === 'show' || st.over) add('答案：<b>' + BX.esc(word() || '（未选词）') + '</b>', 'ok');
      if (local && st.ph === 'draw') add('大家口头抢答，画手点名字记分', 'sys');
      feed.scrollTop = feed.scrollHeight;
    }
    /* ---------- drawing input ---------- */
    let curStroke = null, sendT = 0, sid = 0;
    const live = {};      // seat -> {c, z, p}
    const toBoard = e => { const p = cv.pos(e); return [Math.round(BX.clamp((p.x - G.bx) / G.s, 0, BW)), Math.round(BX.clamp((p.y - G.by) / G.s, 0, BH))]; };
    const inBoard = e => { const p = cv.pos(e); return G && p.x >= G.bx - 10 && p.x <= G.bx + G.bw + 10 && p.y >= G.by - 10 && p.y <= G.by + G.bh + 10; };
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!canDraw() || !inBoard(e) || curStroke) return;
      const [x, y] = toBoard(e);
      curStroke = {c: eraser ? ERASER : col, z: sz, p: [x, y], id: e.pointerId};
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!curStroke || e.pointerId !== curStroke.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const [x, y] = toBoard(ev), p = curStroke.p, lx = p[p.length - 2], ly = p[p.length - 1];
        if (Math.abs(x - lx) + Math.abs(y - ly) >= 3) p.push(x, y);
      }
      if (curStroke.p.length >= 600) { finishStroke(); const p = cv.pos(e); curStroke = null; }
      const now = performance.now();
      if (ctx.online && now - sendT > 70 && curStroke) { sendT = now; ctx.send({k: 'live', c: curStroke.c, z: curStroke.z, p: curStroke.p}); }
    });
    const up = e => { if (curStroke && e.pointerId === curStroke.id) finishStroke(); };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    function finishStroke() {
      const s = curStroke; curStroke = null; if (!s) return;
      if (s.p.length === 2) s.p.push(s.p[0] + 1, s.p[1]);
      queue.push({t: 's', c: s.c, z: s.z, p: s.p}); ctx.sfx('pen');
      if (ctx.online) ctx.send({k: 'live', c: s.c, z: s.z, p: s.p});
    }
    /* ---------- rendering ---------- */
    const layer = document.createElement('canvas'); const lg = layer.getContext('2d');
    let layerSig = '';
    function strokePath(g, s, k) {
      const p = s.p; if (p.length < 2) return;
      g.strokeStyle = s.c === ERASER ? PAPER : COLS[s.c] || COLS[0];
      g.lineWidth = (s.c === ERASER ? SIZES[s.z] * 2.2 : SIZES[s.z] || 6) * k; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(p[0] * k, p[1] * k);
      if (p.length === 2) g.lineTo(p[0] * k + .1, p[1] * k);
      for (let i = 2; i < p.length - 2; i += 2) { const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2; g.quadraticCurveTo(p[i] * k, p[i + 1] * k, mx * k, my * k); }
      g.lineTo(p[p.length - 2] * k, p[p.length - 1] * k); g.stroke();
    }
    function drawBoard(g) {
      const {bx, by, bw, bh, s} = G, dpr = cv.dpr;
      // easel frame
      D.wood(g, bx - 9, by - 9, bw + 18, bh + 18, {r: 6, base: '#7a4a28', dark: '#3a1f0e', seed: 5});
      const sig = [ver, Math.round(bw * dpr), Math.round(bh * dpr)].join(',');
      if (sig !== layerSig) {
        layerSig = sig; layer.width = Math.max(1, Math.round(bw * dpr)); layer.height = Math.max(1, Math.round(bh * dpr));
        lg.setTransform(1, 0, 0, 1, 0, 0); lg.fillStyle = PAPER; lg.fillRect(0, 0, layer.width, layer.height);
        const k = s * dpr; for (const st2 of st.strokes) strokePath(lg, st2, k);
      }
      g.drawImage(layer, bx, by, bw, bh);
      g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip(); g.translate(bx, by);
      for (const k in live) if (live[k]) strokePath(g, live[k], s);
      for (const a of queue) if (a.t === 's') strokePath(g, a, s);
      if (curStroke) strokePath(g, curStroke, s);
      g.restore();
    }
    const fmt = t => Math.max(0, Math.ceil(t));
    let lastSec = -1, peekWas = false;
    const status = () => {
      for (let i = 0; i < n; i++) ctx.info(i, st.score[i] + '分');
      if (st.over) return ctx.status('游戏结束');
      const dr = ctx.name(st.drawer), mine = ctx.isLocal(st.drawer) && ctx.canAct(st.drawer);
      if (st.ph === 'pick') ctx.status(mine ? '请选择要画的词' : dr + ' 正在选词…');
      else if (st.ph === 'draw') ctx.status(mine ? (local ? '画给大家看，点选猜对的人' : '开始作画！') : (local ? dr + ' 作画中' : '看图猜词'));
      else ctx.status('答案：' + word());
    };
    /* ---------- instance ---------- */
    const pts = k => Math.max(4, 10 - 2 * k);
    function solve(s, el) {
      const k = st.solved.length, sp = Math.floor(Math.max(0, DRAW_T - BX.clamp(el | 0, 0, DRAW_T)) / 16);
      const p = pts(k) + sp;
      st.solved.push({s, p}); st.score[s] += p; st.score[st.drawer] += 3;
      return p;
    }
    function endRound(why) {
      if (st.solved.length && st.solved.length === n - 1) st.score[st.drawer] += 2;
      st.ph = 'show'; st.rk++; st.last = {why}; phaseT = performance.now(); queue.length = 0;
      for (const k in live) delete live[k];
      ctx.sfx(st.solved.length ? 'gong' : 'bell');
    }
    function finish() {
      st.over = true; st.ph = 'over';
      const mx = Math.max(...st.score), w = BX.range(n).filter(i => st.score[i] === mx);
      const tbl = BX.range(n).sort((a, b) => st.score[b] - st.score[a]).map(i => BX.esc(ctx.name(i)) + ' <b>' + st.score[i] + '</b> 分').join('<br>');
      ctx.end({winner: w.length === n ? -1 : w.length === 1 ? w[0] : w, html: tbl, delay: 1200});
    }
    const inst = {
      st,
      toMove() {
        if (st.over || st.ph === 'show') return null;
        if (st.ph === 'pick') return st.drawer;
        if (local) return st.drawer;
        return [st.drawer, ...unsolved()];
      },
      valid(a, by) {
        if (st.over) return false;
        if (a.t === 'pick') return st.ph === 'pick' && by === st.drawer && a.i >= 0 && a.i < 3;
        if (st.ph !== 'draw') return false;
        if (a.t === 'g') return !local && by !== st.drawer && unsolved().includes(by) && typeof a.txt === 'string' && a.txt.length <= 16;
        if (['s', 'undo', 'clear', 'end', 'ok', 'skip'].includes(a.t)) return by === st.drawer && (a.t !== 's' || (Array.isArray(a.p) && a.p.length <= 1200));
        return false;
      },
      apply(a, by) {
        if (st.over) return;
        const t = a.t;
        if (t === 'pickT' || t === 'pick') {
          if (st.ph !== 'pick' || (t === 'pickT' && a.k !== st.rk)) return;
          const wi = st.choices[BX.clamp(a.i | 0, 0, st.choices.length - 1)];
          st.word = wi; st.usedW[wi] = 1; st.ph = 'draw'; st.rk++; phaseT = performance.now(); ver++; lastSec = -1;
          ctx.sfx('start'); return;
        }
        if (t === 'timeup' || t === 'next') {
          if (a.k !== st.rk) return;
          if (t === 'timeup' && st.ph === 'draw') { endRound('time'); return; }
          if (t === 'next' && st.ph === 'show') { st.round++; if (st.round >= st.total) finish(); else startRound(); }
          return;
        }
        if (st.ph !== 'draw') return;
        if (t === 's') { st.strokes.push({c: a.c | 0, z: BX.clamp(a.z | 0, 0, 2), p: a.p.map(v => v | 0)}); if (by >= 0) delete live[by]; ver++; return; }
        if (t === 'undo') { st.strokes.pop(); ver++; return; }
        if (t === 'clear') { st.strokes = []; ver++; ctx.sfx('whoosh'); return; }
        if (t === 'skip') { endRound('skip'); return; }
        if (t === 'end') { endRound('end'); return; }
        if (t === 'ok') {
          if (st.solved.some(x => x.s === a.s) || a.s === st.drawer || !(a.s >= 0 && a.s < n)) return;
          const p = solve(a.s, a.el); st.guesses.push({by: a.s, ok: 1, pts: p}); ctx.sfx('score');
          if (!unsolved().length) endRound('all');
          return;
        }
        if (t === 'g') {
          if (by === st.drawer || st.solved.some(x => x.s === by)) return;
          const g = norm(a.txt), w = word();
          if (g === w || (g.length <= w.length + 2 && g.includes(w))) {
            const p = solve(by, a.el); st.guesses.push({by, ok: 1, pts: p}); ctx.sfx('score');
            if (!unsolved().length) endRound('all');
          } else { st.guesses.push({by, txt: g.slice(0, 12)}); if (st.guesses.length > 60) st.guesses.splice(0, st.guesses.length - 60); ctx.sfx('pop'); }
        }
      },
      sysMove() {
        if (st.over) return null;
        const el = elapsed() * 1000, k = st.rk;
        if (st.ph === 'pick') return local ? null : {a: {t: 'pickT', i: 0, k}, delay: Math.max(0, PICK_T * 1000 - el)};
        if (st.ph === 'draw') return {a: {t: 'timeup', k}, delay: Math.max(0, DRAW_T * 1000 - el)};
        if (st.ph === 'show') return {a: {t: 'next', k}, delay: Math.max(0, SHOW_T * 1000 - el)};
        return null;
      },
      async aiMove(seat) {
        const bot = BX.bot && ctx.isLocal(seat);
        if (!bot && st.ph === 'draw' && seat !== st.drawer) await BX.sleep(1800 + Math.random() * 3500);   // a computer guesser "thinks" before each guess
        if (st.ph === 'pick') return {t: 'pick', i: Math.floor(Math.random() * 3)};
        if (st.ph !== 'draw') return null;
        if (seat === st.drawer) {
          if (!bot) return {t: 'skip'};                 // a computer can't really draw — it passes its turn
          const nS = st.strokes.length;
          if (local) {
            if (nS < 3) return scribble();
            const un = unsolved();
            if (Math.random() < .2 || !un.length) return {t: 'end'};
            return {t: 'ok', s: BX.pick(un), el: Math.round(Math.min(DRAW_T, elapsed()))};
          }
          return nS < 6 ? scribble() : null;
        }
        // guesser
        const nS = st.strokes.length;
                const pOk = bot ? .3 : Math.min(.45, .04 + nS * .03);
        const w = Math.random() < pOk ? word() : W[Math.floor(Math.random() * W.length)][0];
        return {t: 'g', txt: w, el: Math.round(Math.min(DRAW_T, elapsed()))};
      },
      onTurn() { status(); uiSig = ''; refreshUI(); },
      onView() { uiSig = ''; refreshUI(); },
      onMsg(m, by) {
        if (!m || m.k !== 'live' || st.ph !== 'draw' || by === ctx.me || !Array.isArray(m.p)) return;
        live[by] = {c: m.c | 0, z: m.z | 0, p: m.p.slice(0, 1200)};
      },
      frame() {
        const g = cv.g; cv.clear();
        layout(); flush(); refreshUI();
        drawBoard(g);
        // header strip
        const {hx, hw, hdr, land} = G, hy = land ? 8 : 4, hh = hdr - (land ? 10 : 8);
        g.fillStyle = 'rgba(250,244,228,.95)'; D.rr(g, hx, hy, hw, hh, 10); g.fill();
        g.strokeStyle = 'rgba(178,58,43,.4)'; g.lineWidth = 1.5; D.rr(g, hx + 3, hy + 3, hw - 6, hh - 6, 8); g.stroke();
        const cy = hy + hh / 2, fs = Math.min(20, hh * .5);
        // timer
        let tl = null;
        if (st.ph === 'pick' && !local) tl = PICK_T - elapsed(); else if (st.ph === 'draw') tl = DRAW_T - elapsed();
        if (tl != null && !st.over) {
          const r = hh * .38, tx = hx + hw - r - 8;
          g.fillStyle = tl < 10 ? C.red : C.jade; D.circle(g, tx, cy, r); g.fill();
          D.text(g, String(fmt(tl)), tx, cy + 1, {size: r * 1.05, color: '#fff', weight: 800});
          const sec = fmt(tl);
          if (st.ph === 'draw' && sec <= 5 && sec > 0 && sec !== lastSec) { lastSec = sec; ctx.sfx('tick'); }
        }
        // word / hint
        const w = word(), dr = st.drawer;
        const amDrawer = ctx.isLocal(dr) && (local ? ctx.view === dr : ctx.me === dr);
        let txt = '', color = C.ink;
        if (st.over) txt = '游戏结束';
        else if (st.ph === 'pick') txt = (amDrawer ? '请选词' : ctx.name(dr) + ' 选词中…');
        else if (st.ph === 'draw') {
          if (amDrawer && (!local || peek)) { txt = '画：' + w; color = C.red; }
          else if (amDrawer) txt = '按住「看词」查看词语';
          else {
            const solved = st.solved.some(x => x.s === ctx.me);
            if (solved) { txt = '你猜对了：' + w; color = C.jade; }
            else { txt = '　'.repeat(0) + w.length + ' 个字' + (elapsed() > DRAW_T / 2 ? ' · ' + W[st.word][1] : ''); }
          }
        } else if (st.ph === 'show') { txt = '答案：' + w; color = C.red; }
        D.text(g, txt, hx + 12, cy + 1, {size: fs, color, font: 'serif', weight: 800, align: 'left', maxW: hw - hh - 30});
        if (st.ph === 'draw' && !amDrawer && !st.solved.some(x => x.s === ctx.me)) {
          // blanks
          const bw2 = fs * 1.1, x0 = hx + 12 + g.measureText(txt).width + 14;
          if (x0 + w.length * bw2 < hx + hw - hh - 12) for (let i = 0; i < w.length; i++) { g.fillStyle = C.ink2; g.fillRect(x0 + i * bw2, cy + fs * .45, bw2 * .8, 2); }
        }
        // round label on board
        D.text(g, '第 ' + (Math.min(st.round, total - 1) + 1) + '/' + total + ' 轮 · 画手 ' + ctx.name(dr), G.bx + 8, G.by + 14, {size: 12, color: 'rgba(60,40,20,.55)', weight: 600, align: 'left'});
        // reveal card
        if (st.ph === 'show') {
          const cw = Math.min(G.bw * .8, 340), ch2 = Math.min(G.bh * .7, 200), cx = G.bx + (G.bw - cw) / 2, cyy = G.by + (G.bh - ch2) / 2;
          g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 16; g.fillStyle = 'rgba(255,250,236,.97)'; D.rr(g, cx, cyy, cw, ch2, 14); g.fill(); g.restore();
          g.fillStyle = C.red; D.rr(g, cx + cw - 50, cyy + 10, 40, 40, 6); g.fill(); D.text(g, '揭', cx + cw - 30, cyy + 31, {size: 26, color: '#fbe9d0', font: 'deco', weight: 400});
          D.text(g, '答案', cx + cw / 2, cyy + ch2 * .18, {size: 14, color: C.ink2});
          D.text(g, w || '—', cx + cw / 2, cyy + ch2 * .42, {size: Math.min(48, ch2 * .25), color: C.red, font: 'serif', weight: 900, maxW: cw - 70});
          const sol = st.solved.map(x => ctx.name(x.s) + ' +' + x.p).join('  ');
          D.text(g, st.solved.length ? sol : '没有人猜中', cx + cw / 2, cyy + ch2 * .68, {size: 14, color: C.jade, weight: 700, maxW: cw - 20});
          D.text(g, st.last && st.last.why === 'skip' ? ctx.name(dr) + '（电脑）跳过作画' : '画手 ' + ctx.name(dr) + ' +' + (st.solved.length * 3 + (st.solved.length === n - 1 && st.solved.length ? 2 : 0)), cx + cw / 2, cyy + ch2 * .86, {size: 13, color: C.ink2, maxW: cw - 20});
        }
        if (peek !== peekWas) peekWas = peek;
      },
      destroy() { queue.length = 0; },
    };
    status();
    return inst;
  },
});
