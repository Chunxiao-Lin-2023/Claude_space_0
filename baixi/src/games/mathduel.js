/* 速算对战 — realtime: both see the same question, first correct answer scores */
const D = BX.draw, C = BX.C, K = BX.data.spk;
const NQ = 10;
const LVN = {1: '口算', 2: '两位数', 3: '混合四则'};

function genQ(lv, R) {
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  let text, ans, t = lv === 3 ? ri(0, 5) : ri(0, 3);
  if (lv === 1) {
    if (t === 0) { const a = ri(2, 20), b = ri(2, 20); text = `${a} + ${b}`; ans = a + b; }
    else if (t === 1) { const a = ri(8, 30), b = ri(2, a - 1); text = `${a} − ${b}`; ans = a - b; }
    else if (t === 2) { const a = ri(2, 9), b = ri(2, 9); text = `${a} × ${b}`; ans = a * b; }
    else { const b = ri(2, 9), q = ri(2, 9); text = `${b * q} ÷ ${b}`; ans = q; }
  } else if (lv === 2) {
    if (t === 0) { const a = ri(15, 99), b = ri(15, 99); text = `${a} + ${b}`; ans = a + b; }
    else if (t === 1) { const a = ri(40, 99), b = ri(11, a - 5); text = `${a} − ${b}`; ans = a - b; }
    else if (t === 2) { const a = ri(11, 25), b = ri(3, 9); text = `${a} × ${b}`; ans = a * b; }
    else { const b = ri(3, 9), q = ri(11, 30); text = `${b * q} ÷ ${b}`; ans = q; }
  } else {
    if (t === 0) { const a = ri(2, 9), b = ri(2, 9), c = ri(2, 30); text = `${a} × ${b} + ${c}`; ans = a * b + c; }
    else if (t === 1) { const a = ri(2, 15), b = ri(2, 15), c = ri(2, 6); text = `(${a} + ${b}) × ${c}`; ans = (a + b) * c; }
    else if (t === 2) { const a = ri(30, 90), b = ri(2, 9), c = ri(2, 6); text = `${a} − ${b} × ${c}`; ans = a - b * c; }
    else if (t === 3) { const b = ri(2, 9), q = ri(2, 12), c = ri(2, 20); text = `${b * q} ÷ ${b} + ${c}`; ans = q + c; }
    else if (t === 4) { const a = ri(12, 60), b = ri(11, 40), c = ri(5, 30); text = `${a} + ${b} − ${c}`; ans = a + b - c; }
    else { const a = ri(3, 12), b = ri(3, 12), c = ri(2, 9), d = ri(2, 9); text = `${a} × ${b} − ${c} × ${d}`; ans = a * b - c * d; }
  }
  const set = new Set([ans]); const opts = [ans];
  const cands = [ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, ans + 9, ans + 11, ans - 9, ans + 5, ans * 2 === ans ? ans + 3 : ans + (ans % 10 >= 5 ? -5 : 5)];
  if (ans >= 10) { const s = String(ans); if (s.length === 2 && s[0] !== s[1] && s[1] !== '0') cands.unshift(+(s[1] + s[0])); }
  while (opts.length < 4) {
    let v = cands.length ? cands.splice(Math.floor(R() * Math.min(4, cands.length)), 1)[0] : ans + ri(-15, 15);
    if (v < 0 || set.has(v)) continue; set.add(v); opts.push(v);
  }
  for (let i = 3; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return {text, opts, a: opts.indexOf(ans), v: ans};
}

BX.register({
  id: 'mathduel', title: '速算对战', cat: 'speed', order: 1, sub: '抢答算术题，手快脑更快',
  desc: '两人看同一道算术题，各自从四个答案中抢答：先答对者得分，答错本题即被锁定。十题定胜负，同屏两人各占半边屏幕。',
  kind: 'realtime', seats: 2, noFirst: true, seatColors: ['#c23a2b', '#2f5d8a'],
  options: [{key: 'lv', label: '难度', choices: [[1, '口算'], [2, '两位数'], [3, '混合四则']], def: 1}],
  rules: `<p>双方同时看到同一道算术题，每人有<b>四个答案按钮</b>。</p>
<ul><li><b>先答对</b>的一方得 1 分，本题结束；</li><li>答<b>错</b>的一方本题被锁定，只能看对手作答；</li><li>每题限时 12 秒，双方都答错或超时则无人得分。</li></ul>
<p>共 <b>10 题</b>，得分高者获胜；若打平则进入<b>加赛</b>，逐题决胜直到有人得分。</p>
<p>难度：口算（20 以内加减、九九乘除）／两位数（两位数加减、乘除）／混合四则（先乘除后加减、括号）。</p>
<p>键盘：单人按 1–4；同屏两人时左方（或下方）玩家按 1–4，右方（或上方）玩家按 7、8、9、0。触屏同屏时两人各用自己那半边屏幕的按钮。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#7a4a24', seed: 4});
    D.paper(g, w * .12, h * .1, w * .76, h * .38, {r: 8}); g.strokeStyle = '#b23a2b'; g.lineWidth = 2; D.rr(g, w * .12, h * .1, w * .76, h * .38, 8); g.stroke();
    D.text(g, '7 × 8 = ?', w / 2, h * .29, {size: h * .2, color: '#2b2118', font: 'serif', weight: 900});
    const cols = ['#c23a2b', '#c8a052', '#3f7f6b', '#2f5d8a'], vals = ['54', '56', '48', '63'];
    for (let i = 0; i < 4; i++) { const x = w * (.08 + i * .225), y = h * .6; K.btn(g, {x, y, w: w * .2, h: h * .3}, vals[i], {color: cols[i], fg: '#fff', size: h * .14}); }
    g.strokeStyle = '#ffd76a'; g.lineWidth = 3; D.rr(g, w * .3, h * .58, w * .23, h * .33, 8); g.stroke();
  },
  create(ctx) {
    const lv = ctx.opts.lv || 1;
    const T = BX.test ? .3 : 1;
    const st = {q: 0, Q: null, ph: 'intro', t: 3 * T, s: [0, 0], lock: [0, 0], ans: [-1, -1], win: -1, ot: 0, ev: [], evId: 0, over: false};
    const cv = ctx.canvas(), fx = K.fx(), pads = K.pads(ctx, cv);
    const queues = [K.tq(), K.tq()], seen = {}, evSeen = {v: -1};
    const aiPlan = {};
    let pend = [-1, -1], time = 0, qShow = 0, lastQ = -1;

    function newQ() {
      st.q++; st.Q = genQ(lv, Math.random); st.lock = [0, 0]; st.ans = [-1, -1]; st.win = -1;
      st.ph = 'q'; st.t = 12 * (BX.test ? .4 : 1); K.ev(st, 'new');
    }
    function answer(s, qn, ch) {
      if (st.ph !== 'q' || qn !== st.q || st.lock[s] || st.ans[s] >= 0) return;
      st.ans[s] = ch;
      if (ch === st.Q.a) { st.s[s]++; st.win = s; st.ph = 'rev'; st.t = 1.5 * T; K.ev(st, 'ok', s, ch); }
      else { st.lock[s] = 1; K.ev(st, 'bad', s, ch); if (st.lock[0] && st.lock[1]) { st.ph = 'rev'; st.t = 1.5 * T; K.ev(st, 'none'); } }
    }
    function after() {
      if (st.q >= NQ && st.s[0] !== st.s[1]) {
        st.ph = 'over'; st.over = true; const w = st.s[0] > st.s[1] ? 0 : 1; K.ev(st, 'end', w);
        ctx.end({winner: w, text: st.s[0] + ' : ' + st.s[1]}); return;
      }
      if (st.q >= NQ) st.ot = 1;
      newQ();
    }
    /* ---------- layout ---------- */
    const nLoc = () => ctx.mySeats.length;
    function panels() {
      const W = cv.w, H = cv.h;
      if (nLoc() === 2) {
        if (W >= H) return [{seat: 0, x: 0, y: 0, w: W / 2, h: H, rot: 0}, {seat: 1, x: W / 2, y: 0, w: W / 2, h: H, rot: 0}];
        return [{seat: 0, x: 0, y: H / 2, w: W, h: H / 2, rot: 0}, {seat: 1, x: 0, y: 0, w: W, h: H / 2, rot: 1}];
      }
      return [{seat: ctx.mySeats.length ? ctx.mySeats[0] : 0, x: 0, y: 0, w: W, h: H, rot: 0, solo: true}];
    }
    function pLayout(p) {
      const w = p.w, h = p.h, pad = Math.max(8, Math.min(w, h) * .03), head = p.solo ? Math.min(64, h * .12) : Math.min(46, h * .13);
      const wide = w > h * 1.3;
      let qBox, btns = [];
      const qw = Math.min(w - pad * 2, 680);
      qBox = {x: (w - qw) / 2, y: head + pad, w: qw, h: Math.min((h - head) * (wide && !p.solo ? .38 : p.solo ? .34 : .34), 220)};
      const by = qBox.y + qBox.h + pad, bh = h - by - pad;
      const grid = wide && p.solo ? [4, 1] : [2, 2];
      const cw = (w - pad * (grid[0] + 1)) / grid[0], ch = (bh - pad * (grid[1] - 1)) / grid[1];
      const maxW = p.solo ? 300 : 260, bw = Math.min(cw, maxW * (grid[0] === 4 ? .9 : 1.2)), bhh = Math.min(ch, p.solo ? 150 : 130);
      const totW = bw * grid[0] + pad * (grid[0] - 1), x0 = (w - totW) / 2, totH = bhh * grid[1] + pad * (grid[1] - 1), y0 = by + (bh - totH) / 2;
      for (let i = 0; i < 4; i++) { const cx = i % grid[0], cy = Math.floor(i / grid[0]); btns.push({k: 'a' + i, i, x: x0 + cx * (bw + pad), y: y0 + cy * (bhh + pad), w: bw, h: bhh}); }
      return {head, qBox, btns, pad};
    }
    const toLocal = (p, pt) => p.rot ? {x: p.x + p.w - pt.x, y: p.y + p.h - pt.y} : {x: pt.x - p.x, y: pt.y - p.y};
    pads.onDown(pt => {
      for (const p of panels()) {
        if (!K.inR(pt, p) || !ctx.isLocal(p.seat)) continue;
        const l = toLocal(p, pt), L = pLayout(p);
        for (const b of L.btns) if (K.inR(l, b)) tap(p.seat, b.i);
      }
    });
    function tap(seat, i) {
      if (st.ph !== 'q' || st.lock[seat] || st.ans[seat] >= 0 || pend[seat] >= 0) return;
      pend[seat] = i; queues[seat].push(st.q, i); ctx.sfx('click');
    }
    /* ---------- AI ---------- */
    function aiInput(seat, level) {
      if (st.ph !== 'q') return {};
      let pl = aiPlan[seat];
      if (!pl || pl.q !== st.q) {
        const base = [0, [3.2, 6.5], [2, 4], [1.1, 2.4]][level], mul = [0, .8, 1, 1.45][lv];
        const err = [0, .25, .12, .04][level];
        let ch = st.Q.a; if (Math.random() < err) { ch = (ch + 1 + Math.floor(Math.random() * 3)) % 4; }
        pl = aiPlan[seat] = {q: st.q, at: performance.now() + (base[0] + Math.random() * (base[1] - base[0])) * mul * 1000 * (BX.test ? .22 : 1), ch, tq: (aiPlan[seat] && aiPlan[seat].tq) || K.tq()};
      }
      if (performance.now() >= pl.at && !pl.sent) { pl.sent = true; pl.tq.push(st.q, pl.ch); }
      return {q: pl.tq.list()};
    }
    /* ---------- events ---------- */
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const P = panels();
        if (e[0] === 'new') { ctx.sfx('flip'); pend = [-1, -1]; qShow = 0; }
        else if (e[0] === 'ok') {
          ctx.sfx('score'); fx.flash(.8); fx.shake(5);
          for (const p of P) { const L = pLayout(p), b = L.btns[e[3]]; const c = center(p, b); fx.burst(c.x, c.y, {n: 26, color: ['#ffd76a', '#fff', ctx.color(e[2])], sp: 260, square: true}); fx.text(c.x, c.y - 20, p.seat === e[2] ? '+1' : ctx.name(e[2]) + ' 抢到', {size: p.seat === e[2] ? 34 : 18, color: '#ffe08a'}); }
        } else if (e[0] === 'bad') {
          if (ctx.isLocal(e[2])) { ctx.sfx('buzz'); fx.shake(4); } else ctx.sfx('error');
          for (const p of P) if (p.seat === e[2]) { const L = pLayout(p), c = center(p, L.btns[e[3]]); fx.text(c.x, c.y, '错！', {size: 28, color: '#ff8a7a'}); }
        } else if (e[0] === 'none' || e[0] === 'to') ctx.sfx('draw');
        else if (e[0] === 'go') ctx.sfx('start');
        else if (e[0] === 'cd') ctx.sfx('tick');
      });
    }
    function center(p, b) { const lx = b.x + b.w / 2, ly = b.y + b.h / 2; return p.rot ? {x: p.x + p.w - lx, y: p.y + p.h - ly} : {x: p.x + lx, y: p.y + ly}; }
    function info() {
      ctx.info(0, st.s[0] + ' 分'); ctx.info(1, st.s[1] + ' 分');
      ctx.status(st.ph === 'intro' ? LVN[lv] + ' · 准备' : st.over ? '比赛结束' : (st.ot ? '加赛 · ' : '第 ' + st.q + ' / ' + NQ + ' 题 · ') + LVN[lv]);
    }
    let lastCd = 4;
    const inst = {
      st,
      input(seat) { return {q: queues[seat].list()}; },
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        for (let s = 0; s < 2; s++) K.take(inputs[s] && inputs[s].q, seen, s, it => answer(s, it[0], it[1]));
        st.t -= dt;
        if (st.ph === 'intro') { const c = Math.ceil(st.t); if (c < lastCd && c > 0) { lastCd = c; K.ev(st, 'cd'); } if (st.t <= 0) { K.ev(st, 'go'); newQ(); } }
        else if (st.ph === 'q' && st.t <= 0) { st.ph = 'rev'; st.t = 1.3 * T; K.ev(st, 'to'); }
        else if (st.ph === 'rev' && st.t <= 0) after();
        playEv(); info();
      },
      snapshot() { return {q: st.q, Q: st.Q, ph: st.ph, t: Math.round(st.t * 10) / 10, s: st.s, lock: st.lock, ans: st.ans, win: st.win, ot: st.ot, ev: st.ev, over: st.over}; },
      restore(d) { Object.assign(st, d); playEv(); info(); },
      key(e) {
        if (e.repeat) return;
        const m = {Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3}, m2 = {Digit7: 0, Digit8: 1, Digit9: 2, Digit0: 3};
        const ms = ctx.mySeats; if (!ms.length) return;
        if (e.code in m) tap(ms[0], m[e.code]);
        else if (e.code in m2) tap(ms.length > 1 ? ms[1] : ms[0], m2[e.code]);
      },
      draw(dt) {
        time += dt; fx.update(dt); qShow = Math.min(1, qShow + dt * 4);
        if (!ctx.isHost) st.t -= dt;
        for (let s = 0; s < 2; s++) if (st.ans[s] >= 0 || st.lock[s] || st.ph !== 'q') pend[s] = st.ph === 'q' ? pend[s] : -1;
        const g = cv.g; cv.clear('#2a190d');
        const [ox, oy] = fx.offset(); g.save(); g.translate(ox, oy);
        for (const p of panels()) drawPanel(g, p);
        g.restore();
        if (nLoc() === 2) { const W = cv.w, H = cv.h; g.fillStyle = '#e6c57d'; if (W >= H) g.fillRect(W / 2 - 1.5, 0, 3, H); else g.fillRect(0, H / 2 - 1.5, W, 3); }
        fx.draw(g); fx.drawFlash(g, cv.w, cv.h);
      },
    };
    function drawPanel(g, p) {
      const L = pLayout(p), s = p.seat, o = 1 - s;
      g.save(); g.translate(p.x, p.y); if (p.rot) { g.translate(p.w, p.h); g.rotate(Math.PI); }
      g.beginPath(); g.rect(0, 0, p.w, p.h); g.clip();
      D.wood(g, 0, 0, p.w, p.h, {base: s ? '#5f4a3a' : '#6b4426', dark: '#2a160a', seed: 13 + s});
      g.fillStyle = D.alpha(ctx.color(s), .12); g.fillRect(0, 0, p.w, p.h);
      // header: names + scores + progress pips
      const hh = L.head;
      g.fillStyle = 'rgba(20,10,4,.45)'; g.fillRect(0, 0, p.w, hh);
      const fs = Math.min(hh * .38, 18);
      const sideTxt = (seat, x, al) => {
        g.fillStyle = ctx.color(seat); D.circle(g, al === 'left' ? x + 6 : x - 6, hh / 2, 6); g.fill();
        D.text(g, ctx.name(seat) + (st.lock[seat] && st.ph === 'q' ? ' ✕' : ''), al === 'left' ? x + 18 : x - 18, hh / 2, {size: fs * .85, color: '#fbe9d0', align: al, maxW: p.w * .3});
      };
      sideTxt(s, L.pad, 'left'); sideTxt(o, p.w - L.pad, 'right');
      D.text(g, st.s[s] + ' : ' + st.s[o], p.w / 2, hh / 2, {size: hh * .62, color: '#ffe08a', font: 'deco', weight: 400});
      // question card
      const q = L.qBox; const sc = st.ph === 'q' ? .85 + .15 * BX.ease.back(qShow) : 1;
      g.save(); g.translate(q.x + q.w / 2, q.y + q.h / 2); g.scale(sc, sc); g.translate(-q.w / 2, -q.h / 2);
      g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, 3, 5, q.w, q.h, 14); g.fill();
      D.paper(g, 0, 0, q.w, q.h, {r: 14}); g.strokeStyle = C.red; g.lineWidth = 3; D.rr(g, 4, 4, q.w - 8, q.h - 8, 11); g.stroke();
      const qs = Math.min(q.h * .42, q.w / 7.5);
      if (st.ph === 'intro') {
        const c = Math.max(1, Math.ceil(st.t / T > 0 ? st.t : 1));
        D.text(g, st.t > 0 ? String(Math.ceil(st.t)) : '开始', q.w / 2, q.h / 2, {size: q.h * .6, color: C.red, font: 'deco', weight: 400});
        D.text(g, LVN[lv] + ' · ' + NQ + ' 题', q.w / 2, q.h * .86, {size: Math.min(14, q.h * .14), color: C.ink2});
        void c;
      } else if (st.Q) {
        D.text(g, (st.ot ? '加赛' : '第 ' + st.q + ' 题'), 14, 18, {size: Math.min(13, q.h * .12), color: C.ink2, align: 'left'});
        const showAns = st.ph !== 'q';
        D.text(g, st.Q.text + ' = ' + (showAns ? st.Q.v : '?'), q.w / 2, q.h * .5, {size: qs, color: C.ink, font: 'serif', weight: 900, maxW: q.w - 24});
        if (st.ph === 'q') { const k = BX.clamp(st.t / (12 * (BX.test ? .4 : 1)), 0, 1); g.fillStyle = 'rgba(60,40,20,.15)'; D.rr(g, 14, q.h - 16, q.w - 28, 7, 3); g.fill(); g.fillStyle = k < .3 ? C.red : C.jade; D.rr(g, 14, q.h - 16, (q.w - 28) * k, 7, 3); g.fill(); }
        else if (st.win >= 0) D.text(g, ctx.name(st.win) + ' 抢答成功', q.w / 2, q.h * .84, {size: Math.min(15, q.h * .13), color: ctx.color(st.win), weight: 800});
        else D.text(g, '无人答对', q.w / 2, q.h * .84, {size: Math.min(15, q.h * .13), color: C.ink2});
      }
      g.restore();
      // answer buttons
      const cols = ['#c23a2b', '#c8a052', '#3f7f6b', '#2f5d8a'], keys = nLoc() === 2 ? (s === ctx.mySeats[1] ? ['7', '8', '9', '0'] : ['1', '2', '3', '4']) : ['1', '2', '3', '4'];
      for (const b of L.btns) {
        const i = b.i, Q = st.Q, mine = st.ans[s] === i, theirs = st.ans[o] === i;
        let col = cols[i], alpha = 1, sel = null;
        const locked = st.lock[s] && st.ph === 'q';
        if (!Q || st.ph === 'intro') alpha = .5;
        if (locked && !mine) alpha = .4;
        if (st.ph !== 'q' && Q) { if (i === Q.a) sel = '#ffd76a'; else alpha = .45; }
        if (mine && Q && i !== Q.a) col = '#555';
        const pressed = pend[s] === i || mine;
        const wob = st.ph !== 'q' && Q && i === Q.a ? 1 + Math.sin(time * 10) * .03 : 1;
        g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2); g.scale(wob, wob); g.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
        K.btn(g, b, Q && st.ph !== 'intro' ? String(Q.opts[i]) : '?', {color: col, fg: '#fff', alpha, sel, pressed, font: 'serif', size: Math.min(b.h * .42, b.w * .3)});
        if (!BX.TOUCH.matches || !pads.touched) D.text(g, keys[i], b.x + 12, b.y + 13, {size: 11, color: 'rgba(255,255,255,.7)'});
        if (mine && Q && i !== Q.a) D.text(g, '✕', b.x + b.w - 16, b.y + 16, {size: 18, color: '#ff8a7a', weight: 900});
        if (theirs && st.ph !== 'q') { g.fillStyle = ctx.color(o); D.circle(g, b.x + b.w - 14, b.y + b.h - 18, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
        g.restore();
      }
      if (st.lock[s] && st.ph === 'q') {
        const y = L.btns[0].y - L.pad / 2;
        D.text(g, '答错了，本题锁定', p.w / 2, Math.max(L.qBox.y + L.qBox.h + 2, y), {size: 14, color: '#ff9a8a', weight: 800, stroke: 'rgba(0,0,0,.6)'});
      }
      g.restore();
    }
    info();
    return inst;
  },
});
