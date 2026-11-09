/* 猜数字 1A2B — Bulls & Cows, 4 distinct digits, two players crack each other's code. */
const D = BX.draw, C = BX.C;
const ALLS = {};
const allOf = n => ALLS[n] || (ALLS[n] = (() => { const r = [], M = 10 ** n; for (let k = 0; k < M; k++) { const s = String(k).padStart(n, '0'); if (new Set(s).size === n) r.push(s); } return r; })());
function score(code, g) { let a = 0, b = 0; for (let i = 0; i < g.length; i++) { if (g[i] === code[i]) a++; else if (code.includes(g[i])) b++; } return [a, b]; }
const validN = (s, n) => typeof s === 'string' && s.length === n && /^\d+$/.test(s) && new Set(s).size === n;

BX.register({
  id: 'bullscows', title: '猜数字', cat: 'deduce', order: 2, sub: '1A2B，看谁先破译',
  desc: '双方各设一个四位不重复的密码，轮流猜对方的数字。系统用 A、B 提示：A 是数字对且位置对，B 是数字对但位置错。先得到 4A 者破译成功！',
  kind: 'turn', seats: 2, hidden: true, seatNames: ['甲方', '乙方'], firstLabel: '先猜',
  options: [{key: 'len', label: '密码位数', choices: [[3, '3 位（入门）'], [4, '4 位（经典）'], [5, '5 位（烧脑）']], def: 4}],
  howto: ['用数字键盘输入（数字不能重复），点「确定」。设密码时可点「随机」。', '上方一排<b>笔记格</b>：点数字在 空白 → ✓（一定有）→ ✗（一定没有）间切换；键盘对应数字也会变暗 / 变绿。', '开启「提示标记」偏好时，已能推出的数字会自动加细框（绿 = 必有，红 = 必无），并显示「还剩 N 种可能」。', '点自己的历史记录可把那次猜测填回输入框再改；💡 提示会填入一个推荐猜测。键盘可直接输入数字，回车确定。'],
  rules: `<p>开局时双方各自秘密设定一个<b>四位数密码</b>，四个数字<b>互不相同</b>（0 可以放在首位，如 0371）。</p>
<p>双方轮流猜对方的密码。每猜一次，会得到提示 <b>xAyB</b>：</p>
<ul><li><b>A</b>：数字正确且位置也正确的个数；</li><li><b>B</b>：数字正确但位置不对的个数。</li></ul>
<p>例如密码是 1234，猜 1325 得到 <b>1A2B</b>（1 位置对；3、2 数字对位置错）。</p>
<p>先猜出 <b>4A0B</b>（全对）者破译成功。为公平起见，若先手先猜中，后手还有<b>最后一次</b>机会：也猜中则为平局。</p>
<p>用屏幕上的数字键盘输入，同一个数字不能重复。选项里可把密码改为 3 位（入门）或 5 位（烧脑），默认经典 4 位。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#3a2a4a', '#1e1428');
    const digits = '5307';
    for (let i = 0; i < 4; i++) {
      const x = w * .1 + i * w * .205, y = h * .14, cw = w * .18, ch = h * .38;
      g.fillStyle = i === 1 ? '#c8a052' : '#f3e9d2'; D.rr(g, x, y, cw, ch, 8); g.fill();
      D.text(g, digits[i], x + cw / 2, y + ch / 2 + 2, {size: ch * .7, color: C.ink, font: 'deco', weight: 400});
    }
    g.fillStyle = '#b23a2b'; D.rr(g, w * .18, h * .62, w * .28, h * .26, 10); g.fill();
    g.fillStyle = '#3f7f6b'; D.rr(g, w * .54, h * .62, w * .28, h * .26, 10); g.fill();
    D.text(g, '2A', w * .32, h * .75, {size: h * .17, color: '#fff', font: 'deco', weight: 400});
    D.text(g, '1B', w * .68, h * .75, {size: h * .17, color: '#fff', font: 'deco', weight: 400});
  },
  create(ctx) {
    const LEN = BX.clamp(+ctx.opts.len || 4, 3, 5), ALL = allOf(LEN), valid4 = s => validN(s, LEN);
    const st = {code: [null, null], set: [false, false], hist: [[], []], turn: 0, ph: 'set', over: false, solved: [false, false], last: null, res: null};
    const cv = ctx.canvas();
    const me = () => ctx.view;
    const markStore = [new Array(10).fill(0), new Array(10).fill(0)];   // per-viewer scratch marks: 0 none, 1 ✓, 2 ✗
    let entry = '', marks = markStore[ctx.view] || markStore[0];
    let reveal = {k: 1, seat: -1};

    /* ---------- DOM keypad ---------- */
    const ui = ctx.ui();
    const pad = document.createElement('div'); ui.append(pad);
    pad.style.cssText = 'position:absolute;display:grid;gap:6px;pointer-events:auto';
    const keys = [];
    const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'bx-btn ' + cls; b.textContent = txt; b.style.cssText = 'min-height:44px;padding:0;font-size:20px;min-width:0'; b.onclick = fn; pad.append(b); return b; };
    for (const d of '1234567890') keys.push(mk(d, 'ghost', () => press(d)));
    const bDel = mk('⌫', 'ghost', () => { entry = entry.slice(0, -1); ctx.sfx('click'); sync(); });
    const bMark = mk('随机', 'ghost', () => {
      if (!canType()) return;
      if (st.ph === 'set') entry = ALL[(Math.random() * ALL.length) | 0];
      else entry = '';
      ctx.sfx('click'); sync();
    });
    const bOk = mk('确定', 'red', submit);
    /* notes row: one chip per digit, tap cycles none / ✓ / ✗ */
    const notes = document.createElement('div'); ui.append(notes);
    notes.style.cssText = 'position:absolute;display:grid;grid-template-columns:repeat(10,1fr);gap:4px;pointer-events:auto';
    const chips = '1234567890'.split('').map(d => {
      const b = document.createElement('button'); b.className = 'bx-btn ghost'; b.style.cssText = 'min-height:36px;min-width:0;padding:0;font-size:16px;position:relative';
      b.onclick = () => { marks[+d] = (marks[+d] + 1) % 3; ctx.sfx('tick'); sync(); }; notes.append(b); return b;
    });
    let candN = -1, autoMk = new Array(10).fill(0), flash = {k: 1, s: -1};
    function deduce() {   // what the viewer can infer from their own clues (only shown with the hints pref)
      const v = me(), hs = st.hist[v];
      if (st.ph !== 'play' || !ctx.isLocal(v)) { candN = -1; autoMk.fill(0); return; }
      const cand = ALL.filter(c => hs.every(h => { const [a, b] = score(c, h.g); return a === h.a && b === h.b; }));
      candN = cand.length;
      for (let d = 0; d < 10; d++) { const ch = String(d); let inAll = true, inAny = false; for (const c of cand) { if (c.includes(ch)) inAny = true; else inAll = false; if (inAny && !inAll) break; } autoMk[d] = !inAny ? 2 : inAll ? 1 : 0; }
    }
    function press(d) {
      if (!canType() || entry.length >= LEN || entry.includes(d)) { ctx.sfx('error'); return; }
      entry += d; ctx.sfx('click'); sync();
    }
    function canType() { const v = me(); return ctx.canAct(v) && !st.over && (st.ph === 'set' ? !st.set[v] : st.turn === v); }
    function submit() {
      if (!canType() || entry.length !== LEN) { ctx.sfx('error'); return; }
      const v = me(), e = entry; entry = '';
      ctx.act(st.ph === 'set' ? {set: e} : {g: e}, v); sync();
    }
    function key(e) {
      if (/^\d$/.test(e.key) && !e.altKey) press(e.key); else if (e.key === 'Backspace') { entry = entry.slice(0, -1); sync(); } else if (e.key === 'Enter') submit();
    }
    function sync() {
      const ok = canType(), showPad = ctx.isLocal(me()) && !st.over && !BX.bot;
      deduce(); const hintsOn = ctx.pref('hints');
      pad.style.display = showPad ? 'grid' : 'none';
      notes.style.display = showPad && st.ph === 'play' ? 'grid' : 'none';
      keys.forEach(b => { const d = +b.textContent; const used = entry.includes(b.textContent); b.disabled = !ok || used; const m = marks[d] || (hintsOn ? autoMk[d] : 0); b.style.background = marks[d] === 1 ? 'rgba(63,127,107,.75)' : ''; b.style.opacity = !b.disabled && m === 2 ? '.45' : ''; });
      chips.forEach((b, k) => {
        const d = (k + 1) % 10, m = marks[d], am = hintsOn ? autoMk[d] : 0;
        b.textContent = String(d) + (m === 1 ? '✓' : m === 2 ? '✗' : '');
        b.style.background = m === 1 ? '#3f7f6b' : m === 2 ? '#4a1810' : '';
        b.style.color = m === 2 ? 'rgba(243,226,192,.5)' : '';
        b.style.textDecoration = m === 2 ? 'line-through' : '';
        b.style.boxShadow = am === 1 ? 'inset 0 0 0 2px #7fd0b0' : am === 2 ? 'inset 0 0 0 2px rgba(255,110,90,.75)' : '';
      });
      bDel.disabled = !ok || !entry.length; bOk.disabled = !ok || entry.length !== LEN;
      bMark.style.fontSize = '15px'; bMark.textContent = st.ph === 'set' ? '随机' : '清空'; bMark.disabled = !ok;
      status();
    }

    /* ---------- layout ---------- */
    function L() {
      const W = cv.w, H = cv.h, portrait = H > W * 1.05;
      const pw = portrait ? Math.min(W - 16, 380) : Math.min(300, W * .34), ph = portrait ? Math.min(176, H * .24) : Math.min(300, H * .5);
      const cols = portrait ? 7 : 4, nh = st.ph === 'play' && ctx.isLocal(me()) && !BX.bot && !st.over ? 40 : 0;
      const px = portrait ? (W - pw) / 2 : W - pw - 12, py = portrait ? H - ph - 10 : H - ph - 12;
      return {portrait, W, H, pw, ph, px, py, cols, nh, ny: py - nh, top: py - nh};
    }
    function placePad() {
      const l = L();
      pad.style.left = l.px + 'px'; pad.style.top = l.py + 'px'; pad.style.width = l.pw + 'px'; pad.style.height = l.ph + 'px';
      Object.assign(notes.style, {left: l.px + 'px', top: (l.ny - 2) + 'px', width: l.pw + 'px', height: '36px'});
      if (l.portrait) {
        pad.style.gridTemplateColumns = 'repeat(6,1fr)'; pad.style.gridTemplateRows = 'repeat(3,1fr)';
        keys.forEach((b, k) => { b.style.gridColumn = String(k % 5 + 1); b.style.gridRow = String(Math.floor(k / 5) + 1); });
        bDel.style.gridColumn = '6'; bDel.style.gridRow = '1'; bMark.style.gridColumn = '6'; bMark.style.gridRow = '2';
        bOk.style.gridColumn = '1 / 7'; bOk.style.gridRow = '3';
      } else {
        pad.style.gridTemplateColumns = 'repeat(4,1fr)'; pad.style.gridTemplateRows = 'repeat(4,1fr)';
        keys.forEach((b, k) => { b.style.gridColumn = String(k % 4 + 1); b.style.gridRow = String(Math.floor(k / 4) + 1); });
        bDel.style.gridColumn = '3'; bDel.style.gridRow = '3'; bMark.style.gridColumn = '4'; bMark.style.gridRow = '3';
        bOk.style.gridColumn = '1 / 5'; bOk.style.gridRow = '4';
      }
    }

    function status() {
      ctx.info(0, st.hist[0].length + ' 次'); ctx.info(1, st.hist[1].length + ' 次');
      if (st.over) return ctx.status(st.res);
      const v = me();
      if (st.ph === 'set') {
        if (ctx.isLocal(v) && !st.set[v]) return ctx.status((ctx.hotseat ? ctx.name(v) + '：' : '') + '设定你的四位密码（数字不重复）');
        return ctx.status('等待对方设定密码…');
      }
      const last = st.solved[0] && !st.solved[1] ? '<b style="color:#e6c57d">最后一次机会！</b> ' : '';
      if (ctx.canAct(st.turn)) return ctx.status(last + (ctx.hotseat ? ctx.name(st.turn) + ' 猜数' : '轮到你猜') + (candN > 0 && ctx.pref('hints') ? ` · 还剩 <b style="color:#e6c57d">${candN}</b> 种可能` : ''));
      ctx.status(last + '等待 ' + ctx.name(st.turn) + ' 猜…');
    }

    function finish() {
      st.over = true;
      const [s0, s1] = st.solved, w = s0 && s1 ? -1 : s0 ? 0 : 1;
      st.res = w < 0 ? '双方都破译了，平局' : ctx.name(w) + ' 破译成功';
      reveal = {k: 0, seat: -1}; ctx.anim(700, k => reveal.k = k);
      sync(); placePad();
      ctx.end({winner: w, html: `${BX.esc(ctx.name(0))} 的密码 <b>${st.code[0]}</b>（被猜 ${st.hist[1].length} 次）<br>${BX.esc(ctx.name(1))} 的密码 <b>${st.code[1]}</b>（被猜 ${st.hist[0].length} 次）`, delay: 1300});
    }
    const inst = {
      st,
      toMove: () => st.over ? null : st.ph === 'set' ? [0, 1].filter(s => !st.set[s]) : st.turn,
      valid: (a, by) => st.ph === 'set' ? !st.set[by] && valid4(a.set) : by === st.turn && valid4(a.g),
      apply(a, by) {
        if (a.set) {
          st.code[by] = a.set; st.set[by] = true; ctx.sfx('chip');
          if (st.set[0] && st.set[1]) { st.ph = 'play'; ctx.sfx('gong'); placePad(); }
          sync(); return;
        }
        const s = by, o = 1 - s, [A, B] = score(st.code[o], a.g);
        st.hist[s].push({g: a.g, a: A, b: B}); st.last = {s, k: st.hist[s].length - 1};
        ctx.sfx(A === LEN ? 'win' : A + B ? 'pop' : 'tick');
        if (!ctx.fast) { flash = {k: 0, s}; ctx.anim(1400, k => flash.k = k); }
        if (A === LEN) st.solved[s] = true;
        if (s === 1) { if (st.solved[0] || st.solved[1]) { finish(); return; } }
        else if (st.solved[0]) { /* seat 1 gets a final guess */ }
        st.turn = o;
        if (st.hist[0].length >= 30 && st.hist[1].length >= 30) { finish(); return; }
        sync();
      },
      aiMove(seat, level) {
        if (st.ph === 'set') return {set: ALL[(Math.random() * ALL.length) | 0]};
        let cand = ALL.filter(c => st.hist[seat].every(h => { const [a, b] = score(c, h.g); return a === h.a && b === h.b; }));
        if (level === 1) {   // only partially uses feedback: consistent with the last 2 clues
          const rec = st.hist[seat].slice(-2);
          const pool = ALL.filter(c => rec.every(h => { const [a, b] = score(c, h.g); return a === h.a && b === h.b; }) && !st.hist[seat].some(h => h.g === c));
          if (Math.random() < .35 || !cand.length) return {g: pool[(Math.random() * pool.length) | 0] || ALL[0]};
          return {g: cand[(Math.random() * cand.length) | 0]};
        }
        if (level === 2 || cand.length <= 2 || !st.hist[seat].length) {
          if (!st.hist[seat].length) return {g: ALL[(Math.random() * ALL.length) | 0]};
          return {g: cand[(Math.random() * cand.length) | 0]};
        }
        // level 3: minimax partition over (sampled) guesses, prefer consistent ones
        const t0 = performance.now(), lim = BX.test ? 30 : 500;
        const pool = cand.length > 300 ? ALL.filter((_, i) => i % 7 === (Date.now() % 7)) : ALL;
        let best = cand[0], bw = 1e9, bc = true;
        const tryG = gs => {
          const cnt = new Uint16Array(25); let w = 0;
          for (const c of cand) { const [a, b] = score(c, gs); const k = a * 5 + b; if (++cnt[k] > w) { w = cnt[k]; if (w > bw) return; } }
          const isC = cand.includes(gs);
          if (w < bw || (w === bw && isC && !bc)) { bw = w; best = gs; bc = isC; }
        };
        for (const gs of cand) { tryG(gs); if (performance.now() - t0 > lim * .5) break; }
        for (const gs of pool) { if (performance.now() - t0 > lim) break; tryG(gs); }
        return {g: best};
      },
      onTurn() { sync(); },
      onView() { entry = ''; marks = markStore[me()]; placePad(); sync(); },
      resize() { placePad(); },
      showHint(a) {
        if (a.set) entry = a.set; else if (a.g) { entry = a.g; ctx.toast('💡 推荐猜 ' + a.g + '（已填入，按确定即可）'); }
        ctx.sfx('select'); sync();
      },
      key,
      frame() {
        const g = cv.g; cv.clear(); const l = L(), v = me(), o = 1 - v;
        D.wood(g, 0, 0, cv.w, cv.h, {seed: 41, base: '#5a3a24', dark: '#2a160a', grain: .2});
        // panels: my guesses (cracking opponent) and opponent's guesses (on my code)
        let x0, y0, w0, h0, x1, y1, w1, h1;
        if (l.portrait) {
          const top = 112, avail = l.top - top - 8;
          x0 = 8; y0 = top; w0 = (l.W - 24) / 2; h0 = avail; x1 = x0 + w0 + 8; y1 = top; w1 = w0; h1 = avail;
        } else {
          const avail = l.px - 24; x0 = 10; y0 = 10; w0 = avail * .5; h0 = l.H - 20; x1 = x0 + w0 + 8; y1 = 10; w1 = avail * .5; h1 = l.H - 20;
        }
        rowHits = [];
        hist(g, x0, y0, w0, h0, '我的猜测', st.hist[v], v === st.turn && st.ph === 'play' && !st.over, v);
        hist(g, x1, y1, w1, h1, ctx.name(o) + ' 的猜测', st.hist[o], o === st.turn && st.ph === 'play' && !st.over, o);
        // entry display + own code
        let ex, ey, ew, eh;
        if (l.portrait) { ex = 8; ey = 8; ew = l.W - 16; eh = 96; } else { ex = l.px; ey = 12; ew = l.pw; eh = l.top - 24; }
        g.fillStyle = 'rgba(20,12,5,.5)'; D.rr(g, ex, ey, ew, eh, 12); g.fill();
        const mine = st.code[v], showMine = ctx.isLocal(v);
        const ent = st.ph === 'set' && st.set[v] ? '' : entry;
        const lbl = st.ph === 'set' ? (st.set[v] ? '密码已设定' : '设定密码') : st.over ? '对方密码' : '本次猜测';
        const roomy = !l.portrait && eh > 170;
        let cy = ey + 8;
        D.text(g, lbl, ex + 12, cy + 8, {size: 13, color: 'rgba(243,226,192,.75)', align: 'left'});
        if (st.ph === 'play' && showMine && mine && !roomy) D.text(g, '我的密码 ' + mine, ex + ew - 12, cy + 8, {size: 13, color: '#e6c57d', align: 'right'});
        cy += 20;
        const sz = Math.min(ew / (LEN + 2.2), (l.portrait ? eh - 34 : roomy ? eh * .3 : eh - 34) / 1.2, 52);
        for (let i = 0; i < LEN; i++) {
          const sx = ex + ew / 2 - LEN / 2 * sz * 1.12 + i * sz * 1.12 + sz * .06;
          g.fillStyle = '#f3e9d2'; D.rr(g, sx, cy, sz, sz * 1.2, sz * .14); g.fill();
          let ch = ent[i] || '';
          if (st.over) { ch = st.code[o][i]; g.globalAlpha = reveal.k; }
          if (st.ph === 'set' && st.set[v]) ch = mine[i];
          if (ch) D.text(g, ch, sx + sz / 2, cy + sz * .62, {size: sz * .85, color: st.over ? C.red : C.ink, font: 'deco', weight: 400});
          g.globalAlpha = 1;
          if (!ch && i === ent.length && canType()) { g.fillStyle = C.red; g.fillRect(sx + sz * .25, cy + sz * 1.02, sz * .5, 3); }
        }
        cy += sz * 1.2 + 14;
        if (roomy && st.ph === 'play' && showMine && mine) {
          D.text(g, '我的密码：' + mine, ex + ew / 2, cy + 8, {size: 16, color: '#e6c57d'}); cy += 22;
          D.text(g, ctx.name(o) + ' 目前最好 ' + best(st.hist[o]), ex + ew / 2, cy + 8, {size: 12, color: 'rgba(243,226,192,.6)'}); cy += 22;
          if (candN > 0 && ctx.pref('hints') && cy + 10 < ey + eh) D.text(g, '还剩 ' + candN + ' 种可能', ex + ew / 2, cy + 8, {size: 13, color: '#7fd0b0'});
        } else if (l.portrait && st.ph === 'play' && candN > 0 && ctx.pref('hints')) D.text(g, '剩 ' + candN + ' 种', ex + 12, ey + eh - 10, {size: 11, color: '#7fd0b0', align: 'left'});
      },
    };
    function best(hs) { let b = '—'; for (const h of hs) if (b === '—' || h.a * 5 + h.b > b[0] * 5 + b[1]) b = [h.a, h.b]; return b === '—' ? b : b[0] + 'A' + b[1] + 'B'; }
    let rowHits = [];
    ctx.on(cv.cv, 'pointerdown', e => {   // tap one of my earlier guesses to load it into the entry
      const p = cv.pos(e), r = rowHits.find(q => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h);
      if (!r || !canType() || st.ph !== 'play') return;
      entry = r.g; ctx.sfx('click'); sync();
    });
    function hist(g, x, y, w, h, title, arr, active, seat) {
      g.fillStyle = 'rgba(243,233,210,.94)'; D.rr(g, x, y, w, h, 12); g.fill();
      if (active) { g.strokeStyle = '#e6c57d'; g.lineWidth = 3; D.rr(g, x, y, w, h, 12); g.stroke(); }
      D.text(g, title, x + w / 2, y + 16, {size: 14, color: C.ink, font: 'serif', weight: 800, maxW: w - 12});
      g.strokeStyle = 'rgba(60,40,20,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 8, y + 30); g.lineTo(x + w - 8, y + 30); g.stroke();
      const rowH = Math.max(20, Math.min(30, (h - 38) / 10)), maxN = Math.floor((h - 38) / rowH);
      const items = arr.slice(-maxN), off = arr.length - items.length;
      items.forEach((it, k) => {
        const yy = y + 36 + k * rowH + rowH / 2, fs = Math.min(rowH * .68, w * .1);
        if ((off + k) % 2) { g.fillStyle = 'rgba(200,160,82,.12)'; g.fillRect(x + 4, yy - rowH / 2, w - 8, rowH); }
        const newest = off + k === arr.length - 1;
        if (newest && flash.s === seat && flash.k < 1) { g.fillStyle = `rgba(230,197,125,${.55 * (1 - flash.k)})`; g.fillRect(x + 4, yy - rowH / 2, w - 8, rowH); }
        if (seat === me() && !st.over) rowHits.push({x: x + 4, y: yy - rowH / 2, w: w - 8, h: rowH, g: it.g});
        D.text(g, String(off + k + 1), x + 14, yy, {size: fs * .7, color: C.ink2});
        D.text(g, it.g.split('').join(' '), x + w * .42, yy, {size: fs, color: C.ink, font: 'sans', weight: 700});
        const tagW = Math.min(52, w * .28), tx = x + w - tagW - 8;
        g.fillStyle = it.a === LEN ? C.red : it.a ? '#3f7f6b' : it.b ? '#c8a052' : 'rgba(60,40,20,.25)'; D.rr(g, tx, yy - rowH * .38, tagW, rowH * .76, rowH * .3); g.fill();
        D.text(g, it.a + 'A' + it.b + 'B', tx + tagW / 2, yy + 1, {size: fs * .78, color: '#fff', weight: 800});
      });
      if (!arr.length) D.text(g, '暂无', x + w / 2, y + 56, {size: 13, color: C.ink2});
    }
    placePad(); sync();
    return inst;
  },
});
