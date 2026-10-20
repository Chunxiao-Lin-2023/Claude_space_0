/* 斗兽棋 — 经典 7×9 规则 + alpha-beta */
const D = BX.draw, C = BX.C, L = BX.data.cls;
const NC = 7, NR = 9, NS = 63;
const RT = 1, CT = 2, DG = 3, WF = 4, LP = 5, TG = 6, LN = 7, EL = 8;
const NAME = ['', '鼠', '猫', '狗', '狼', '豹', '虎', '狮', '象'];
const rc = s => [Math.floor(s / NC), s % NC];
const SQ = (r, c) => r * NC + c;
const WATER = new Uint8Array(NS); for (const r of [3, 4, 5]) for (const c of [1, 2, 4, 5]) WATER[SQ(r, c)] = 1;
const DEN = [SQ(8, 3), SQ(0, 3)];                        // den of side 0 (red, bottom) / side 1 (blue, top)
const TRAP = new Int8Array(NS).fill(-1);                 // owner side of each trap square
for (const s of [SQ(8, 2), SQ(8, 4), SQ(7, 3)]) TRAP[s] = 0;
for (const s of [SQ(0, 2), SQ(0, 4), SQ(1, 3)]) TRAP[s] = 1;
/* neighbours + jump targets: JMP[s] = [[to, [water squares between]]] */
const NBR = [], JMP = [];
for (let s = 0; s < NS; s++) {
  const [r, c] = rc(s); NBR[s] = []; JMP[s] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const r2 = r + dr, c2 = c + dc; if (r2 < 0 || r2 >= NR || c2 < 0 || c2 >= NC) continue;
    const t = SQ(r2, c2); NBR[s].push(t);
    if (!WATER[s] && WATER[t]) { const mid = []; let rr = r2, cc = c2; while (rr >= 0 && rr < NR && cc >= 0 && cc < NC && WATER[SQ(rr, cc)]) { mid.push(SQ(rr, cc)); rr += dr; cc += dc; } if (rr >= 0 && rr < NR && cc >= 0 && cc < NC) JMP[s].push([SQ(rr, cc), mid]); }
  }
}
/* piece code: side*16 + rank (0 = empty) */
const START = (() => {
  const b = new Array(NS).fill(0);
  const top = [[0, 0, LN], [0, 6, TG], [1, 1, DG], [1, 5, CT], [2, 0, RT], [2, 2, LP], [2, 4, WF], [2, 6, EL]];
  for (const [r, c, k] of top) { b[SQ(r, c)] = 16 + k; b[SQ(8 - r, 6 - c)] = k; }
  return b;
})();
const VAL = [0, 450, 200, 260, 330, 420, 760, 860, 950];
const Z = L.zob(32 * NS + 1, 7979);
function canCap(b, f, t, p, q) {
  const ra = p & 15, rd = q & 15, me = p >> 4;
  if (WATER[f] !== WATER[t]) return false;               // rat between water and land cannot capture
  if (TRAP[t] === me) return true;                        // enemy standing in my trap
  if (ra === RT && rd === EL) return true;
  if (ra === EL && rd === RT) return false;
  return ra >= rd;
}
function Eng(b0, side0) {
  const b = Int8Array.from(b0); let side = side0, h1 = 0, h2 = 0; const cnt = [0, 0], mat = [0, 0], stk = [];
  const pst = (p, s) => { const me = p >> 4, [r, c] = rc(s), [dr, dc] = rc(DEN[me ^ 1]); const d = Math.abs(r - dr) + Math.abs(c - dc); const k = p & 15; return (k === RT || k === CT || k === DG) && Math.abs(r - (me ? 0 : 8)) <= 2 ? 0 : (12 - d) * (k >= LP ? 9 : 5); };
  const sc = [0, 0];
  for (let s = 0; s < NS; s++) { const p = b[s]; if (!p) continue; h1 ^= Z.a[p * NS + s]; h2 ^= Z.b[p * NS + s]; cnt[p >> 4]++; mat[p >> 4] += VAL[p & 15]; sc[p >> 4] += pst(p, s); }
  if (side) { h1 ^= Z.a[32 * NS]; h2 ^= Z.b[32 * NS]; }
  function dest(s, p, out, capOnly) {
    const me = p >> 4, k = p & 15, base = s * 64;
    for (const t of NBR[s]) {
      if (t === DEN[me]) continue;
      if (WATER[t] && k !== RT) continue;
      const q = b[t];
      if (q) { if ((q >> 4) !== me && canCap(b, s, t, p, q)) out.push(base + t); }
      else if (!capOnly || t === DEN[me ^ 1]) out.push(base + t);
    }
    if (k === LN || k === TG) for (const [t, mid] of JMP[s]) {
      let blocked = false; for (const w of mid) if (b[w]) { blocked = true; break; }
      if (blocked) continue;
      const q = b[t];
      if (q) { if ((q >> 4) !== me && canCap(b, s, t, p, q)) out.push(base + t); }
      else if (!capOnly) out.push(base + t);
    }
  }
  const E = {
    b, side: () => side,
    hash: () => L.key(h1, h2),
    evaluate() {
      let v = mat[side] - mat[side ^ 1] + sc[side] - sc[side ^ 1];
      // danger: enemies close to my den
      return v + 8;
    },
    score(m) { const t = m & 63, q = b[t]; if (t === DEN[side ^ 1]) return 1e6; return q ? 2000 + VAL[q & 15] * 8 - VAL[b[m >> 6] & 15] : 0; },
    moves(capOnly) { const out = []; for (let s = 0; s < NS; s++) { const p = b[s]; if (p && (p >> 4) === side) dest(s, p, out, capOnly); } return out; },
    make(m) {
      const f = m >> 6, t = m & 63, p = b[f], q = b[t], me = side;
      stk.push(m, q, h1, h2);
      h1 ^= Z.a[p * NS + f] ^ Z.a[p * NS + t] ^ Z.a[32 * NS]; h2 ^= Z.b[p * NS + f] ^ Z.b[p * NS + t] ^ Z.b[32 * NS];
      sc[me] += pst(p, t) - pst(p, f);
      if (q) { h1 ^= Z.a[q * NS + t]; h2 ^= Z.b[q * NS + t]; cnt[me ^ 1]--; mat[me ^ 1] -= VAL[q & 15]; sc[me ^ 1] -= pst(q, t); }
      b[t] = p; b[f] = 0; side ^= 1; return true;
    },
    unmake() {
      h2 = stk.pop(); h1 = stk.pop(); const q = stk.pop(), m = stk.pop(), f = m >> 6, t = m & 63, p = b[t];
      side ^= 1; const me = side; b[f] = p; b[t] = q; sc[me] -= pst(p, t) - pst(p, f);
      if (q) { cnt[me ^ 1]++; mat[me ^ 1] += VAL[q & 15]; sc[me ^ 1] += pst(q, t); }
    },
    /* side to move has lost if an enemy sits in its den or it has no pieces */
    over(ply) { const d = b[DEN[side]]; if ((d && (d >> 4) !== side) || !cnt[side]) return -(L.MATE - ply); return null; },
    noMove: ply => -(L.MATE - ply),
    legal: () => E.moves(false),
  };
  return E;
}
const RED = '#c23a2b', BLUE = '#2f5d8a';
const sideCol = s => s ? BLUE : RED;
/* cute token: round disc in side color, ears by animal, big character */
function token(g, x, y, r, p, o = {}) {
  const k = p & 15, side = p >> 4, col = sideCol(side), dark = D.shade(col, -30), face = side ? '#e8f0fa' : '#fbeee4';
  g.save();
  g.fillStyle = 'rgba(0,0,0,.3)'; D.circle(g, x + r * .06, y + r * .16, r); g.fill();
  // ears / mane behind the disc
  g.fillStyle = col; g.strokeStyle = dark; g.lineWidth = r * .07;
  const ear = (ang, sz, pointed) => {
    const ex = x + Math.cos(ang) * r * .82, ey = y + Math.sin(ang) * r * .82;
    g.beginPath();
    if (pointed) { const a1 = ang - .42, a2 = ang + .42; g.moveTo(x + Math.cos(a1) * r * .8, y + Math.sin(a1) * r * .8); g.lineTo(x + Math.cos(ang) * r * (1.05 + sz), y + Math.sin(ang) * r * (1.05 + sz)); g.lineTo(x + Math.cos(a2) * r * .8, y + Math.sin(a2) * r * .8); g.closePath(); }
    else g.arc(ex, ey, r * sz, 0, Math.PI * 2);
    g.fill(); g.stroke();
  };
  const up = -Math.PI / 2;
  if (k === RT) { ear(up - .8, .36, false); ear(up + .8, .36, false); }
  else if (k === CT) { ear(up - .62, .3, true); ear(up + .62, .3, true); }
  else if (k === DG) { ear(up - 1.05, .3, false); ear(up + 1.05, .3, false); }
  else if (k === WF) { ear(up - .55, .42, true); ear(up + .55, .42, true); }
  else if (k === LP || k === TG) { ear(up - .78, .24, false); ear(up + .78, .24, false); }
  else if (k === LN) { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92, r * .2, 0, Math.PI * 2); g.fillStyle = side ? '#5a7aa0' : '#d9822b'; g.fill(); } }
  else if (k === EL) { for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(x + sx * r * .92, y - r * .05, r * .34, r * .5, sx * .2, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.stroke(); } }
  const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
  gr.addColorStop(0, D.shade(col, 30)); gr.addColorStop(1, dark);
  g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
  g.fillStyle = face; D.circle(g, x, y, r * .78); g.fill();
  if (k === TG) { g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = r * .07; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(x + sx * r * .74, y - r * .2); g.lineTo(x + sx * r * .5, y - r * .1); g.moveTo(x + sx * r * .74, y + r * .12); g.lineTo(x + sx * r * .52, y + r * .12); g.stroke(); } }
  if (k === LP) { g.fillStyle = 'rgba(60,40,20,.28)'; for (const [dx, dy] of [[-.55, -.25], [.55, -.25], [-.5, .3], [.52, .32], [0, .58]]) { D.circle(g, x + dx * r, y + dy * r, r * .07); g.fill(); } }
  D.text(g, NAME[k], x, y + r * .02, {size: r * 1.0, color: dark, font: 'serif', weight: 900});
  // rank badge
  const bx = x + r * .68, by = y + r * .62;
  g.fillStyle = C.gold2; D.circle(g, bx, by, r * .27); g.fill(); g.strokeStyle = dark; g.lineWidth = r * .05; g.stroke();
  D.text(g, String(k), bx, by + r * .02, {size: r * .34, color: '#3a2410', weight: 800});
  if (o.sel) { g.strokeStyle = '#ffd76a'; g.lineWidth = r * .13; D.circle(g, x, y, r * 1.1); g.stroke(); }
  g.restore();
}

BX.register({
  id: 'jungle', title: '斗兽棋', cat: 'heavy', order: 4, sub: '象狮虎豹，鼠能吃象',
  desc: '八种动物各有大小，大吃小、鼠吃象。只有老鼠会游泳，狮虎能跳河，谁先闯进对方兽穴谁就赢。',
  kind: 'turn', seats: 2, seatNames: ['红方', '蓝方'], seatColors: ['#c23a2b', '#2f5d8a'], firstLabel: '执子',
  rules: `<p><b>棋盘</b>：7 列 × 9 行。中间有两条<b>小河</b>；双方底线中央是自己的<b>兽穴</b>，兽穴周围三格是<b>陷阱</b>。红方先走。</p>
<p><b>动物大小</b>：象 8 &gt; 狮 7 &gt; 虎 6 &gt; 豹 5 &gt; 狼 4 &gt; 狗 3 &gt; 猫 2 &gt; 鼠 1（棋子右下角的数字）。</p>
<p><b>走法</b>：每次把一只动物向上下左右走一格，不能走进自己的兽穴。</p>
<p><b>吃子</b>：大的可以吃同级或更小的对方动物。例外：<b>鼠可以吃象</b>，<b>象不能吃鼠</b>。</p>
<p><b>河</b>：只有<b>鼠</b>能下河游泳。鼠在水中时，岸上的动物吃不到它；鼠也不能从水中直接上岸吃子（水中的鼠可以互吃）。<br>
<b>狮、虎</b>可以横向或纵向<b>跳过整条河</b>，落在对岸（可以吃子），但如果河中路线上有任何一只鼠挡住就不能跳。</p>
<p><b>陷阱</b>：动物走进<b>对方</b>的陷阱后，对方任何一只动物都可以吃掉它。在自己的陷阱里不受影响。</p>
<p><b>胜负</b>：任何一只动物走进<b>对方兽穴</b>即获胜；吃光对方所有动物、或对方无子可走时也获胜。</p>
<p><b>和棋</b>：同一局面重复出现三次，或连续 50 回合（双方共 100 步）无吃子，判和。</p>
<p><b>操作</b>：点选自己的动物，绿点为可走位置，红圈为可吃，再点目标格。</p>`,
  icon(g, w, h) {
    g.fillStyle = '#9cc47a'; g.fillRect(0, 0, w, h);
    const s = h / 4; g.strokeStyle = 'rgba(40,70,30,.35)'; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); }
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
    const wg = g.createLinearGradient(0, s, 0, 3 * s); wg.addColorStop(0, '#5aa0c8'); wg.addColorStop(1, '#3a7aa8');
    g.fillStyle = wg; g.fillRect(s * 1, s * 1, s * 2, s * 2); g.fillRect(s * 4, s * 1, s * 2, s * 2);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5;
    for (const x0 of [s, 4 * s]) for (let j = 0; j < 3; j++) { g.beginPath(); for (let t = 0; t <= 2 * s; t += 4) { const yy = s * 1.4 + j * s * .55 + Math.sin(t * .2) * 2; t ? g.lineTo(x0 + t, yy) : g.moveTo(x0 + t, yy); } g.stroke(); }
    token(g, w * .27, h * .3, s * .42, EL);
    token(g, w * .56, h * .63, s * .42, 16 + LN);
    token(g, w * .8, h * .28, s * .42, 16 + RT);
    token(g, w * .3, h * .78, s * .42, TG);
  },
  create(ctx) {
    const st = {b: START.slice(), turn: 0, ply: 0, noCap: 0, keys: [Eng(START, 0).hash()], caps: [[], []], last: null, over: false, result: null};
    const cv = ctx.canvas(), boardImg = L.cache();
    let sel = -1, legal = [], anim = null, call = null, t = 0;
    const flip = () => ctx.mySeats.length === 1 && ctx.mySeats[0] === 1;
    function geo() {
      const W = cv.w, H = cv.h, land = W > H * 1.08;
      const f = land ? BX.fit(W, H, 7.6 + 2 * 3.4, 9.6, 6) : BX.fit(W, H, 7.6, 9.6 + 2 * 1.25, 6);
      const s = Math.min(f.s, 80), ox = Math.round(W / 2 - 3.5 * s), oy = Math.round(H / 2 - 4.5 * s), m = .3 * s;
      let pl;
      if (land) { const pw = Math.min(s * 3.2, (W - 7.6 * s) / 2 - 14), ph = Math.min(s * 4.2, 260); pl = [{x: ox - m - 10 - pw, y: oy, w: pw, h: ph, v: true}, {x: ox + 7 * s + m + 10, y: oy + 9 * s - ph, w: pw, h: ph, v: true}]; }
      else { const ph = Math.min(s * 1.05, 54), pw = 7 * s + 2 * m; pl = [{x: ox - m, y: oy - m - 8 - ph, w: pw, h: ph}, {x: ox - m, y: oy + 9 * s + m + 8, w: pw, h: ph}]; }
      return {s, ox, oy, pl, m};
    }
    const scr = (sq, G) => { let [r, c] = rc(sq); if (flip()) { r = 8 - r; c = 6 - c; } return [G.ox + (c + .5) * G.s, G.oy + (r + .5) * G.s]; };
    const hit = (p, G) => { let c = Math.floor((p.x - G.ox) / G.s), r = Math.floor((p.y - G.oy) / G.s); if (r < 0 || r >= NR || c < 0 || c >= NC) return -1; if (flip()) { r = 8 - r; c = 6 - c; } return SQ(r, c); };
    const refresh = () => { legal = st.over ? [] : Eng(st.b, st.turn).legal(); };
    function status() {
      for (const s of [0, 1]) ctx.info(s, st.b.filter(p => p && (p >> 4) === s).length + '兽');
      if (st.over) return ctx.status(st.result);
      const nm = ctx.name(st.turn);
      ctx.status(ctx.canAct(st.turn) ? (ctx.hotseat ? nm + '走棋' : '轮到你走棋') : '等待 ' + nm + ' 走棋…');
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!ctx.canAct(st.turn) || st.over) return;
      const G = geo(), sq = hit(cv.pos(e), G); if (sq < 0) { sel = -1; return; }
      if (sel >= 0 && legal.includes(sel * 64 + sq)) { const f = sel; sel = -1; ctx.act({f, t: sq}, st.turn); return; }
      const p = st.b[sq];
      if (p && (p >> 4) === st.turn) { if (sel === sq) { sel = -1; return; } sel = sq; ctx.sfx('select'); if (!legal.some(m => (m >> 6) === sq)) ctx.toast('这只动物现在走不了'); return; }
      if (sel >= 0) ctx.sfx('error'); sel = -1;
    });
    function finish(w, text, big) { st.over = true; st.result = text; if (big) { call = {t: big, k: 0}; ctx.anim(1700, k => { if (call) call.k = k; }, () => call = null, x => x); } ctx.end({winner: w, text}); }
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => a && Number.isInteger(a.f) && Number.isInteger(a.t) && Eng(st.b, st.turn).legal().includes(a.f * 64 + a.t),
      apply(a) {
        const E = Eng(st.b, st.turn), mover = st.turn, p = st.b[a.f], q = st.b[a.t];
        E.make(a.f * 64 + a.t);
        st.b[a.t] = p; st.b[a.f] = 0; st.turn ^= 1; st.ply++; st.last = [a.f, a.t];
        if (q) { st.caps[mover].push(q); st.noCap = 0; } else st.noCap++;
        st.keys.push(E.hash()); sel = -1;
        const jump = !NBR[a.f].includes(a.t);
        anim = {f: a.f, t: a.t, p, q, k: 0, jump};
        ctx.anim(jump ? 420 : 240, k => { if (anim) anim.k = k; }, () => anim = null);
        ctx.sfx(q ? 'capture' : jump ? 'whoosh' : WATER[a.t] ? 'splash' : 'place');
        const nm = ctx.name(mover);
        if (a.t === DEN[1 - mover]) { ctx.after(150, () => ctx.sfx('gong')); finish(mover, nm + ' 的' + NAME[p & 15] + '闯入兽穴获胜', '入穴'); }
        else if (!st.b.some(x => x && (x >> 4) === st.turn)) finish(mover, nm + ' 吃光了对方动物', '全歼');
        else if (!E.legal().length) finish(mover, ctx.name(st.turn) + ' 无路可走，' + nm + ' 获胜', '困毙');
        else if (st.keys.filter(k => k === st.keys[st.keys.length - 1]).length >= 3) finish(-1, '同一局面重复三次，和棋');
        else if (st.noCap >= 100) finish(-1, '50 回合无吃子，和棋');
        else if (q && !ctx.fast) { const k = q & 15; if ((p & 15) === RT && k === EL) ctx.toast('鼠吃象！'); else if (TRAP[a.t] === mover) ctx.toast('落入陷阱被吃'); }
        refresh(); status();
      },
      aiMove(seat, level) {
        const E = Eng(st.b, st.turn), all = E.legal(); if (!all.length) return null;
        const toA = m => ({f: m >> 6, t: m & 63});
        const past = new Set(st.keys);
        if (level === 1) { const r = L.search(E, {depth: 2, all: true, past, timeMs: BX.test ? 25 : 250}); return toA(L.noisy(r.list, 120, .2)); }
        const r = L.search(E, {timeMs: L.levelTime(level), depth: level === 2 ? 4 : 30, past});
        return toA(r.move != null ? r.move : all[0]);
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); const G = geo(), s = G.s; t += dt;
        g.drawImage(boardImg(g, cv.w + 'x' + cv.h + (flip() ? 'f' : ''), cv.w, cv.h, c => {
          const m = G.m;
          c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = s * .5; c.shadowOffsetY = s * .12; c.fillStyle = '#4a2a14'; D.rr(c, G.ox - m, G.oy - m, 7 * s + 2 * m, 9 * s + 2 * m, s * .25); c.fill(); c.restore();
          D.wood(c, G.ox - m, G.oy - m, 7 * s + 2 * m, 9 * s + 2 * m, {r: s * .25, base: '#8a5a2c', dark: '#3a1a08', seed: 13, grain: .3});
          for (let sq = 0; sq < NS; sq++) {
            const [x, y] = scr(sq, G), x0 = x - s / 2, y0 = y - s / 2, [r0, c0] = rc(sq);
            if (WATER[sq]) { const wg = c.createLinearGradient(x0, y0, x0, y0 + s); wg.addColorStop(0, '#6aaed0'); wg.addColorStop(1, '#4a8cb8'); c.fillStyle = wg; c.fillRect(x0, y0, s, s); }
            else { c.fillStyle = (r0 + c0) & 1 ? '#a9cf86' : '#b6d892'; c.fillRect(x0, y0, s, s); }
          }
          // waves
          c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = Math.max(1, s * .03);
          for (let sq = 0; sq < NS; sq++) if (WATER[sq]) { const [x, y] = scr(sq, G); for (let j = -1; j <= 1; j++) { c.beginPath(); for (let k = -.35; k <= .35; k += .05) { const xx = x + k * s, yy = y + j * s * .25 + Math.sin((k + j * .3) * 14) * s * .03; k === -.35 ? c.moveTo(xx, yy) : c.lineTo(xx, yy); } c.stroke(); } }
          // grass tufts
          const rr = BX.rng(5); c.strokeStyle = 'rgba(60,110,40,.35)'; c.lineWidth = 1;
          for (let sq = 0; sq < NS; sq++) if (!WATER[sq] && TRAP[sq] < 0 && DEN[0] !== sq && DEN[1] !== sq) { const [x, y] = scr(sq, G); for (let i = 0; i < 2; i++) { const gx = x + (rr() - .5) * s * .7, gy = y + (rr() - .5) * s * .7; c.beginPath(); c.moveTo(gx - 3, gy); c.lineTo(gx - 1, gy - 5); c.moveTo(gx, gy); c.lineTo(gx + 1, gy - 6); c.moveTo(gx + 3, gy); c.lineTo(gx + 3, gy - 4); c.stroke(); } }
          // traps
          for (let sq = 0; sq < NS; sq++) if (TRAP[sq] >= 0) {
            const [x, y] = scr(sq, G); c.fillStyle = '#c9a874'; c.fillRect(x - s / 2, y - s / 2, s, s);
            c.save(); c.beginPath(); c.rect(x - s / 2, y - s / 2, s, s); c.clip(); c.strokeStyle = 'rgba(90,55,20,.55)'; c.lineWidth = Math.max(1, s * .04);
            for (let k = -1; k <= 1; k += .25) { c.beginPath(); c.moveTo(x + k * s - s, y - s); c.lineTo(x + k * s + s, y + s); c.stroke(); c.beginPath(); c.moveTo(x + k * s + s, y - s); c.lineTo(x + k * s - s, y + s); c.stroke(); }
            c.restore();
            c.fillStyle = 'rgba(255,245,220,.8)'; D.circle(c, x, y, s * .24); c.fill();
            D.text(c, '阱', x, y + 1, {size: s * .3, color: D.shade(sideCol(TRAP[sq]), -20), font: 'serif', weight: 900});
          }
          for (const sd of [0, 1]) {
            const [x, y] = scr(DEN[sd], G); c.fillStyle = D.alpha(sideCol(sd), .25); c.fillRect(x - s / 2, y - s / 2, s, s);
            c.fillStyle = '#5a3a1a'; c.beginPath(); c.ellipse(x, y + s * .12, s * .38, s * .3, 0, Math.PI, 0); c.lineTo(x + s * .38, y + s * .3); c.lineTo(x - s * .38, y + s * .3); c.closePath(); c.fill();
            c.fillStyle = '#20140a'; c.beginPath(); c.ellipse(x, y + s * .3, s * .22, s * .26, 0, Math.PI, 0); c.fill();
            D.text(c, '穴', x, y - s * .28, {size: s * .26, color: sideCol(sd), font: 'serif', weight: 900});
          }
          c.strokeStyle = 'rgba(40,60,30,.35)'; c.lineWidth = 1;
          c.beginPath(); for (let i = 0; i <= 7; i++) { c.moveTo(G.ox + i * s, G.oy); c.lineTo(G.ox + i * s, G.oy + 9 * s); } for (let j = 0; j <= 9; j++) { c.moveTo(G.ox, G.oy + j * s); c.lineTo(G.ox + 7 * s, G.oy + j * s); } c.stroke();
        }), 0, 0, cv.w, cv.h);
        const bot = flip() ? 1 : 0;
        for (const seat of [0, 1]) {
          const pr = G.pl[seat === bot ? 1 : 0];
          L.plate(g, pr.x, pr.y, pr.w, pr.h, {active: !st.over && st.turn === seat, color: sideCol(seat), title: ctx.name(seat), tag: (seat ? '蓝方' : '红方') + (!st.over && st.turn === seat ? ' · 走棋' : ''), vertical: pr.v,
            items: st.caps[seat].slice().sort((a, b) => (b & 15) - (a & 15)), itemR: s * .26, drawItem: (g2, x, y, r, it) => token(g2, x, y, r * .78, it)});
        }
        const R0 = s * .36;
        if (st.last) {
          const [fx, fy] = scr(st.last[0], G), [tx, ty] = scr(st.last[1], G);
          g.fillStyle = 'rgba(255,230,120,.28)'; g.fillRect(fx - s / 2, fy - s / 2, s, s); g.fillStyle = 'rgba(255,220,90,.38)'; g.fillRect(tx - s / 2, ty - s / 2, s, s);
        }
        for (let i = 0; i < NS; i++) {
          const p = st.b[i]; if (!p || (anim && i === anim.t)) continue;
          const [x, y] = scr(i, G), bob = WATER[i] ? Math.sin(t * 3 + i) * s * .03 : 0;
          token(g, x, y + bob - (i === sel ? s * .05 : 0), R0 * (i === sel ? 1.06 : 1), p, {sel: i === sel});
        }
        if (anim) {
          const [fx, fy] = scr(anim.f, G), [tx, ty] = scr(anim.t, G), k = anim.k, lift = Math.sin(k * Math.PI) * s * (anim.jump ? .7 : .1);
          if (anim.q && k < .85) { g.globalAlpha = 1 - k / .85; token(g, tx, ty, R0, anim.q); g.globalAlpha = 1; }
          token(g, BX.lerp(fx, tx, k), BX.lerp(fy, ty, k) - lift, R0 * (1 + lift / s * .4), anim.p);
        }
        if (sel >= 0 && ctx.canAct(st.turn)) for (const m of legal) {
          if ((m >> 6) !== sel) continue; const to = m & 63, [x, y] = scr(to, G);
          if (st.b[to]) { g.strokeStyle = 'rgba(220,40,30,.9)'; g.lineWidth = Math.max(3, s * .07); D.circle(g, x, y, R0 * 1.15); g.stroke(); }
          else { D.hint(g, x, y, Math.max(6, s * .14), 'rgba(30,120,80,.8)'); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; g.stroke(); }
        }
        if (call) L.callout(g, G.ox + 3.5 * s, G.oy + 4.5 * s, s * .8, call.t, call.k);
      },
    };
    refresh(); status();
    return inst;
  },
});
