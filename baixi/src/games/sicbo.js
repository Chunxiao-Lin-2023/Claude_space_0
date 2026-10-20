/* 骰宝 — 澳门式骰宝：众人对庄家，同时下注，庄家摇盅开骰 */
const D = BX.draw, C = BX.C;
const SUMPAY = {4: 50, 5: 18, 6: 14, 7: 12, 8: 8, 9: 6, 10: 6, 11: 6, 12: 6, 13: 8, 14: 12, 15: 14, 16: 18, 17: 50};
const KEYS = ['big', 'small', 'odd', 'even', 'ta'];
for (let i = 1; i <= 6; i++) KEYS.push('n' + i, 'd' + i, 't' + i);
for (let s = 4; s <= 17; s++) KEYS.push('s' + s);
for (let a = 1; a <= 6; a++) for (let b = a + 1; b <= 6; b++) KEYS.push('c' + a + b);
const KSET = new Set(KEYS);
const CHIPV = [10, 50, 100, 500];
const CHIPC = {10: '#e9e1cf', 50: '#3f7f6b', 100: '#b23a2b', 500: '#1f1a2e'};
const START = 1000;
const PERS = ['', '随性', '稳健', '算计'];

/* payout multiple for bet k given dice d (0 = lose) */
function pay(k, d) {
  const s = d[0] + d[1] + d[2], tri = d[0] === d[1] && d[1] === d[2];
  const cnt = v => (d[0] === v) + (d[1] === v) + (d[2] === v);
  if (k === 'big') return !tri && s >= 11 ? 1 : 0;
  if (k === 'small') return !tri && s <= 10 ? 1 : 0;
  if (k === 'odd') return !tri && s % 2 ? 1 : 0;
  if (k === 'even') return !tri && s % 2 === 0 ? 1 : 0;
  if (k === 'ta') return tri ? 24 : 0;
  const c = k[0], v = +k.slice(1);
  if (c === 'n') return cnt(v);
  if (c === 'd') return cnt(v) >= 2 ? 8 : 0;
  if (c === 't') return cnt(v) === 3 ? 150 : 0;
  if (c === 's') return s === v ? SUMPAY[v] : 0;
  if (c === 'c') { const a = +k[1], b = +k[2]; return cnt(a) && cnt(b) ? 5 : 0; }
  return 0;
}
/* win probability / base odds for every bet (by enumeration of 216 outcomes) */
const PROB = {};
for (const k of KEYS) {
  let w = 0, ev = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) { const m = pay(k, [a, b, c]); if (m) { w++; ev += m; } else ev -= 1; }
  PROB[k] = {p: w / 216, ev: ev / 216, o: k[0] === 'n' ? 1 : pay(k, k === 'big' ? [6, 5, 4] : k === 'small' ? [1, 2, 3] : k === 'odd' ? [1, 2, 4] : k === 'even' ? [1, 2, 3] : k === 'ta' ? [1, 1, 1] : k[0] === 's' ? sumDice(+k.slice(1)) : k[0] === 'c' ? [+k[1], +k[2], +k[1]] : [+k[1], +k[1], +k[1]])};
}
function sumDice(s) { for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const c = s - a - b; if (c >= 1 && c <= 6) return [a, b, c]; } return [1, 1, 1]; }
const NAME = k => k === 'big' ? '大' : k === 'small' ? '小' : k === 'odd' ? '单' : k === 'even' ? '双' : k === 'ta' ? '全围' :
  k[0] === 'n' ? k[1] + '点' : k[0] === 'd' ? '对' + k[1] : k[0] === 't' ? '围' + k[1] : k[0] === 's' ? '和' + k.slice(1) : k[1] + '·' + k[2];
const ODDS = k => ['big', 'small', 'odd', 'even'].includes(k) ? '1赔1' : k === 'ta' ? '1赔24' : k[0] === 'n' ? '1赔1~3' : k[0] === 'd' ? '1赔8' : k[0] === 't' ? '1赔150' : k[0] === 's' ? '1赔' + SUMPAY[+k.slice(1)] : '1赔5';
const sumBets = b => { let t = 0; for (const k in b) t += b[k]; return t; };
const isTri = d => d[0] === d[1] && d[1] === d[2];
const resWord = d => isTri(d) ? '围' : d[0] + d[1] + d[2] >= 11 ? '大' : '小';

/* ---------- board rows (two layouts) ---------- */
const nums = (p, a, b) => BX.range(b - a + 1).map(i => [p + (a + i), 1]);
const COMBOS = []; for (let a = 1; a <= 6; a++) for (let b = a + 1; b <= 6; b++) COMBOS.push(['c' + a + b, 1]);
const ROWS_WIDE = [
  {h: 1.35, c: [['small', 2], ['odd', 1.3], ['t1', 1], ['t2', 1], ['t3', 1], ['ta', 1.4], ['t4', 1], ['t5', 1], ['t6', 1], ['even', 1.3], ['big', 2]]},
  {h: 1, c: nums('d', 1, 6)},
  {h: .95, c: nums('s', 4, 17)},
  {h: 1, c: COMBOS},
  {h: 1.1, c: nums('n', 1, 6)},
];
const ROWS_TALL = [
  {h: 1.3, c: [['small', 1.3], ['odd', 1], ['ta', 1], ['even', 1], ['big', 1.3]]},
  {h: 1, c: nums('t', 1, 6)},
  {h: 1, c: nums('d', 1, 6)},
  {h: .9, c: nums('s', 4, 10)},
  {h: .9, c: nums('s', 11, 17)},
  {h: .85, c: COMBOS.slice(0, 5)}, {h: .85, c: COMBOS.slice(5, 10)}, {h: .85, c: COMBOS.slice(10)},
  {h: 1.05, c: nums('n', 1, 6)},
];

/* ---------- AI bettors ---------- */
function aiBets(st, seat, level, rnd) {
  const chips = st.chips[seat], b = {};
  if (chips < 10) return b;
  const left = () => chips - sumBets(b);
  const add = (k, v) => { v = Math.min(Math.max(10, Math.round(v / 10) * 10), Math.floor(left() / 10) * 10); if (v >= 10) b[k] = (b[k] || 0) + v; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const lastD = st.hist.length ? st.hist[st.hist.length - 1] : null;
  if (level === 1) {            // 随性：东押一点西押一点，偏爱刺激的高赔率
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const k = rnd() < .45 ? pick(['big', 'small', 'odd', 'even']) : pick(KEYS);
      add(k, Math.min(pick([10, 10, 20, 30, 50, 100]), chips * .2));
    }
    return b;
  }
  if (level === 2) {            // 稳健：主押大小，小注搭配单双/单点
    let main = lastD && !isTri(lastD) ? (resWord(lastD) === '大' ? 'big' : 'small') : pick(['big', 'small']);
    if (rnd() < .35) main = main === 'big' ? 'small' : 'big';
    add(main, chips * (.07 + rnd() * .05));
    if (rnd() < .35) add(pick(['odd', 'even']), chips * .04);
    if (rnd() < .2) add('n' + (1 + Math.floor(rnd() * 6)), chips * .03);
    return b;
  }
  // 算计：看排名与剩余局数调节风险
  const others = st.chips.filter((_, i) => i !== seat);
  const target = others.length ? Math.max(...others) + 10 : START + 10;
  const deficit = target - chips, roundsLeft = st.rounds - st.round + 1;
  const evens = ['big', 'small', 'odd', 'even'];
  if (deficit <= 0) {           // 领先：守住
    if (roundsLeft === 1 && others.length) return b;   // 最后一局观望
    add(pick(['big', 'small']), Math.max(10, Math.min(chips * .04, -deficit * .3)));
    return b;
  }
  const need = roundsLeft <= 1 ? deficit : deficit / Math.max(1, roundsLeft - 1) * 1.2;
  const cap = roundsLeft <= 1 ? chips : roundsLeft <= 3 ? chips * .5 : chips * .25;
  if (need <= cap && (roundsLeft > 3 || need <= chips * .15)) { add(pick(['big', 'small']), Math.min(cap, need)); return b; }
  // 需要追分：在负担得起的投注里选胜率最高的
  let best = null;
  for (const k of KEYS) {
    if (k[0] === 'n') continue;
    const o = PROB[k].o, amt = Math.ceil(need / o / 10) * 10;
    if (amt > cap) continue;
    const sc = PROB[k].p - (evens.includes(k) ? 0 : .002);
    if (!best || sc > best.sc) best = {k, amt, sc};
  }
  if (best) add(best.k, best.amt);
  else add(pick(['s4', 's17', 'ta', 's5', 's16']), cap);
  return b;
}

BX.register({
  id: 'sicbo', title: '骰宝', cat: 'folk', order: 2, sub: '押大小，看庄家开盅',
  desc: '澳门式骰宝：三颗骰子扣在盅里，众人一齐押大小、单双、点数、对子、围骰，庄家摇盅开骰按赔率派彩。局数终了筹码最多者胜。',
  kind: 'turn', seats: [1, 4], defSeats: 2, noFirst: true, undo: false, aiDelay: 700,
  options: [{key: 'rounds', label: '局数', choices: [[8, '8 局'], [12, '12 局'], [20, '20 局']], def: 12}],
  rules: `<p>每位玩家起始 <b>1000</b> 筹码，与<b>庄家</b>对赌。每局所有玩家<b>同时下注</b>：选好筹码面额，点台面上的格子押注，可押多格；按「下注完成」确认（不押也可以，算观望）。所有人确认后庄家摇盅开骰，按下表派彩（赢时拿回本金并按赔率得彩金，输则本金归庄）。</p>
<ul>
<li><b>小</b>：三骰之和 4–10，1 赔 1；<b>大</b>：11–17，1 赔 1。开出<b>围骰</b>（三颗相同）时大小通杀。</li>
<li><b>单 / 双</b>：总和为单数 / 双数，1 赔 1，遇围骰同样通杀。</li>
<li><b>单点（1点…6点）</b>：所押点数出现一颗 1 赔 1，两颗 1 赔 2，三颗 1 赔 3。</li>
<li><b>两骰组合（如 2·5）</b>：两个点数同时出现，1 赔 5。</li>
<li><b>对子（对1…对6）</b>：指定点数至少出现两颗，1 赔 8。</li>
<li><b>指定围骰（围1…围6）</b>：三颗都是该点，1 赔 150；<b>全围</b>：任意围骰，1 赔 24。</li>
<li><b>总和</b>：4 或 17 1 赔 50；5/16 1 赔 18；6/15 1 赔 14；7/14 1 赔 12；8/13 1 赔 8；9/12 与 10/11 1 赔 6。</li>
</ul>
<p>局数可选 8 / 12 / 20 局。全部打完（或所有人输光）后<b>筹码最多者获胜</b>；独自一人对庄时，结束时筹码<b>多于 1000</b> 即算赢。</p>
<p>操作：底部选筹码面额，点格子加注；「撤销」退回最后一枚，「清空」全部退回，「重复」照上局押法再押一次。电脑玩家性格：初级<b>随性</b>、中级<b>稳健</b>、高级<b>算计</b>（领先时保守、落后时冒险追分）。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#5a2416', dark: '#2a0e08', seed: 5});
    g.fillStyle = '#1f5a43'; D.rr(g, w * .05, h * .58, w * .9, h * .38, 8); g.fill();
    g.strokeStyle = 'rgba(230,197,125,.8)'; g.lineWidth = 2; g.stroke();
    D.text(g, '小', w * .2, h * .77, {size: h * .2, color: '#f6e7c8', font: 'serif', weight: 900});
    D.text(g, '大', w * .8, h * .77, {size: h * .2, color: '#f6e7c8', font: 'serif', weight: 900});
    g.fillStyle = '#8a6a3a'; g.beginPath(); g.ellipse(w * .42, h * .5, w * .26, h * .14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c8a052'; g.beginPath(); g.ellipse(w * .42, h * .48, w * .24, h * .12, 0, 0, Math.PI * 2); g.fill();
    D.die(g, w * .26, h * .34, h * .2, 4, {rot: -.2}); D.die(g, w * .44, h * .32, h * .2, 5, {rot: .15}); D.die(g, w * .36, h * .43, h * .2, 6, {rot: .05});
    drawCup(g, w * .78, h * .3, h * .2, {rot: .35});
    for (let i = 0; i < 3; i++) chipDisc(g, w * .5 + i * 3, h * .8 - i * 4, h * .09, [100, 500, 50][i]);
  },
  create(ctx) {
    const n = ctx.n, rounds = ctx.opts.rounds || 12;
    const st = {round: 1, rounds, phase: 'bet', chips: Array(n).fill(START), bets: Array(n).fill(null).map(() => ({})), done: Array(n).fill(false),
      prev: Array(n).fill(null).map(() => ({})), dice: null, delta: Array(n).fill(0), hist: [], over: false};
    const cv = ctx.canvas();
    /* ---------- local (visual) state ---------- */
    const drafts = {};                      // seat -> {k: amount}
    const stacks = {};                      // seat -> [[k, v], ...] for 撤销
    let chipSel = 50, scroll = 0, lastL = null;
    const vis = {lift: 0, shake: 0, shown: true, banner: 0, bannerText: '', resultK: 0, pulse: 0};
    const shownChips = st.chips.slice();
    const fly = [], floats = [];
    let bg = null, bgKey = '';
    const draft = s => drafts[s] || (drafts[s] = {});
    const me = () => ctx.view;
    const myTurn = () => st.phase === 'bet' && ctx.canAct(me());
    const now = () => performance.now();

    /* ---------- layout ---------- */
    function layout() {
      const W = cv.w, H = cv.h, pad = W < 500 || H < 450 ? 6 : 10, portrait = H > W * 1.1;
      const L = {W, H, portrait, pad};
      if (!portrait) {
        const pw = BX.clamp(W * .26, 168, 320);
        L.panel = {x: pad, y: pad, w: pw, h: H - 2 * pad};
        const bx = pad * 2 + pw, bw = W - bx - pad, th = BX.clamp(H * .14, 54, 76);
        L.tray = {x: bx, y: H - pad - th, w: bw, h: th};
        L.board = {x: bx, y: pad, w: bw, h: H - 3 * pad - th};
        const P = L.panel, R = Math.min(P.w * .3, P.h * .17);
        L.cup = {cx: P.x + P.w / 2, cy: P.y + R * 1.75, R};
        L.res = {x: P.x + P.w / 2, y: L.cup.cy + R * 1.0};
        L.hist = {x: P.x + 8, y: L.cup.cy + R * 1.45, w: P.w - 16, h: Math.min(30, R * .6)};
        const py = L.hist.y + L.hist.h + 8;
        L.players = {x: P.x + 6, y: py, w: P.w - 12, h: P.y + P.h - py - 6};
        L.rows = ROWS_WIDE;
      } else {
        const ph = BX.clamp(H * .24, 160, 250), th = BX.clamp(H * .14, 104, 128);
        L.panel = {x: pad, y: pad, w: W - 2 * pad, h: ph};
        L.tray = {x: pad, y: H - pad - th, w: W - 2 * pad, h: th};
        L.board = {x: pad, y: pad * 2 + ph, w: W - 2 * pad, h: H - 4 * pad - ph - th};
        const P = L.panel, half = P.w * .5, R = Math.min(half * .3, P.h * .26);
        L.cup = {cx: P.x + half * .52, cy: P.y + P.h * .44, R};
        L.res = {x: L.cup.cx, y: P.y + P.h - 16};
        L.hist = {x: P.x + half, y: P.y + P.h - 32, w: half - 6, h: 26};
        L.players = {x: P.x + half, y: P.y + 6, w: half - 6, h: P.h - 44};
        L.rows = ROWS_TALL;
      }
      // board cells (content coords, y from 0)
      const B = L.board, tw = L.rows.reduce((a, r) => a + r.h, 0);
      const unit = Math.max(B.h / tw, 44 / .85);
      L.contentH = unit * tw; L.scrollMax = Math.max(0, L.contentH - B.h);
      L.cells = []; let y = 0;
      for (const r of L.rows) {
        const rh = r.h * unit, cw = r.c.reduce((a, c) => a + c[1], 0); let x = 0;
        for (const [k, wgt] of r.c) { const w = wgt / cw * B.w; L.cells.push({k, x, y, w, h: rh}); x += w; }
        y += rh;
      }
      // tray
      const T = L.tray;
      if (!portrait) {
        const s = Math.min(T.h - 14, 50), cx0 = T.x + 10;
        L.chips = CHIPV.map((v, i) => ({v, x: cx0 + s / 2 + i * (s + 6), y: T.y + T.h / 2, r: s / 2}));
        const balX = cx0 + 4 * (s + 6) + 4, balW = BX.clamp(T.w * .16, 74, 130);
        L.bal = {x: balX, y: T.y + T.h / 2, w: balW};
        const bx0 = balX + balW, bw = Math.min(118, (T.x + T.w - bx0 - 8) / 4 - 6);
        L.btns = ['undo', 'clear', 'rep', 'done'].map((id, i) => ({id, x: T.x + T.w - 8 - (4 - i) * (bw + 6) + 6, y: T.y + (T.h - Math.min(T.h - 12, 48)) / 2, w: bw, h: Math.min(T.h - 12, 48)}));
      } else {
        const r1 = T.h * .48, s = Math.min(r1 - 8, 48);
        L.chips = CHIPV.map((v, i) => ({v, x: T.x + 10 + s / 2 + i * (s + 8), y: T.y + r1 / 2 + 2, r: s / 2}));
        const balX = T.x + 10 + 4 * (s + 8) + 4;
        L.bal = {x: balX, y: T.y + r1 / 2 + 2, w: T.x + T.w - balX - 6};
        const bh = Math.min(T.h - r1 - 8, 46), bw = (T.w - 12 - 18) / 4;
        L.btns = ['undo', 'clear', 'rep', 'done'].map((id, i) => ({id, x: T.x + 6 + i * (bw + 6), y: T.y + r1 + 2, w: bw, h: bh}));
      }
      scroll = BX.clamp(scroll, 0, L.scrollMax);
      lastL = L; return L;
    }
    const cellScreen = (L, k) => { const c = L.cells.find(c => c.k === k); return c ? {x: L.board.x + c.x + c.w / 2, y: L.board.y + c.y - scroll + c.h / 2, c} : null; };

    /* ---------- input ---------- */
    let down = null;
    ctx.on(cv.cv, 'pointerdown', e => { const p = cv.pos(e); down = {x: p.x, y: p.y, sy: scroll, moved: false, id: e.pointerId}; });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!down || down.id !== e.pointerId) return; const p = cv.pos(e), L = lastL || layout();
      if (Math.abs(p.y - down.y) > 8) down.moved = true;
      if (down.moved && L.scrollMax > 0) scroll = BX.clamp(down.sy - (p.y - down.y), 0, L.scrollMax);
    });
    ctx.on(cv.cv, 'pointerup', e => { if (!down || down.id !== e.pointerId) return; const d = down; down = null; if (!d.moved) tap(d.x, d.y); });
    ctx.on(cv.cv, 'pointercancel', () => down = null);
    ctx.on(cv.cv, 'wheel', e => { const L = lastL; if (L && L.scrollMax > 0) { scroll = BX.clamp(scroll + e.deltaY, 0, L.scrollMax); e.preventDefault(); } }, {passive: false});
    const inR = (p, r) => p.x >= r.x && p.y >= r.y && p.x <= r.x + r.w && p.y <= r.y + r.h;
    function tap(x, y) {
      const L = lastL || layout(), p = {x, y};
      for (const c of L.chips) if (Math.hypot(x - c.x, y - c.y) < c.r + 4) { chipSel = c.v; ctx.sfx('chip'); return; }
      for (const b of L.btns) if (inR(p, b)) { button(b.id, L); return; }
      if (inR(p, L.board)) {
        const cy = y - L.board.y + scroll, cx = x - L.board.x;
        const c = L.cells.find(c => cx >= c.x && cx < c.x + c.w && cy >= c.y && cy < c.y + c.h);
        if (c) placeBet(c.k, L);
      }
    }
    function remaining(s) { return st.chips[s] - sumBets(draft(s)); }
    function placeBet(k, L) {
      if (st.phase !== 'bet' || st.over) return;
      if (!myTurn()) { ctx.toast(st.done[me()] ? '已下注，等待开盅' : '请等待'); return; }
      const s = me(), v = chipSel;
      if (remaining(s) < v) { const r = remaining(s); if (r >= 10) { const vv = CHIPV.filter(c => c <= r).pop(); chipSel = vv; return placeBet(k, L); } ctx.sfx('error'); ctx.toast('筹码不足'); return; }
      draft(s)[k] = (draft(s)[k] || 0) + v; (stacks[s] = stacks[s] || []).push([k, v]);
      ctx.sfx('chip');
      const ch = L.chips.find(c => c.v === v), to = cellScreen(L, k);
      if (ch && to) fly.push({x0: ch.x, y0: ch.y, x1: to.x, y1: to.y, v, t0: now(), dur: 220});
      updStatus();
    }
    function button(id, L) {
      if (!myTurn()) return;
      const s = me(), dr = draft(s);
      if (id === 'undo') { const st2 = stacks[s] || []; const last = st2.pop(); if (!last) return; dr[last[0]] -= last[1]; if (dr[last[0]] <= 0) delete dr[last[0]]; ctx.sfx('click'); }
      else if (id === 'clear') { drafts[s] = {}; stacks[s] = []; ctx.sfx('swish'); }
      else if (id === 'rep') {
        const pv = st.prev[s]; if (!pv || !sumBets(pv)) { ctx.toast('上局没有下注'); return; }
        if (sumBets(pv) > st.chips[s]) { ctx.toast('筹码不足以重复上局'); return; }
        drafts[s] = Object.assign({}, pv); stacks[s] = Object.entries(pv); ctx.sfx('chip');
      } else if (id === 'done') {
        const b = Object.assign({}, dr); ctx.sfx('select');
        ctx.act({t: 'bet', b}, s);
      }
      updStatus();
    }

    /* ---------- rules helpers ---------- */
    function clean(b, chips) {
      const out = {}; let tot = 0;
      if (b && typeof b === 'object') for (const k of Object.keys(b)) {
        const v = b[k]; if (!KSET.has(k) || !Number.isInteger(v) || v <= 0 || v % 10) continue;
        if (tot + v > chips) continue; out[k] = v; tot += v;
      }
      return out;
    }
    const alive = () => st.chips.some(c => c >= 10);

    /* ---------- visuals for the roll ---------- */
    function startRoll() {
      if (ctx.fast) { vis.lift = 1; vis.shake = 0; vis.shown = true; vis.resultK = 1; syncChips(); return; }
      vis.shown = false; vis.lift = 0; vis.resultK = 0;
      vis.banner = now(); vis.bannerText = '买定离手';
      ctx.sfx('gong');
      ctx.after(350, () => {
        for (let i = 0; i < 6; i++) ctx.after(i * 210, () => ctx.sfx('dice'));
        ctx.anim(1350, k => vis.shake = k, () => {
          vis.shake = 0; ctx.sfx('whoosh');
          ctx.anim(650, k => vis.lift = k, reveal, BX.ease.out);
        }, t => t);
      });
    }
    function reveal() {
      vis.shown = true; vis.pulse = now();
      ctx.anim(400, k => vis.resultK = k, null, BX.ease.back);
      const L = lastL || layout(), d = st.dice;
      ctx.sfx('flip');
      const v = me();
      let any = false;
      for (let s = 0; s < n; s++) {
        const bets = st.prev[s] || {};
        for (const k in bets) {
          const m = pay(k, d), to = cellScreen(L, k); if (!to) continue;
          if (s === v || n === 1) {
            if (m) { floats.push({x: to.x, y: to.y - 8, text: '+' + bets[k] * m, color: '#ffe08a', t0: now() + 250, dur: 1400}); fly.push({x0: L.cup.cx, y0: L.cup.cy, x1: to.x, y1: to.y, v: bets[k] >= 500 ? 500 : bets[k] >= 100 ? 100 : 50, t0: now() + 150, dur: 420}); any = true; }
            else fly.push({x0: to.x, y0: to.y, x1: L.cup.cx, y1: L.cup.cy, v: bets[k] >= 500 ? 500 : bets[k] >= 100 ? 100 : bets[k] >= 50 ? 50 : 10, t0: now() + 300, dur: 480});
          }
        }
      }
      ctx.after(500, () => { ctx.sfx(st.delta[v] > 0 ? 'coin' : st.delta[v] < 0 ? 'chip' : 'tick'); syncChips(); if (any) ctx.after(250, () => ctx.sfx('score')); });
      updStatus();
    }
    function syncChips() { for (let i = 0; i < n; i++) shownChips[i] = st.chips[i]; infos(); }
    const infos = () => { for (let i = 0; i < n; i++) ctx.info(i, shownChips[i]); };

    /* ---------- status ---------- */
    function updStatus() {
      const rd = `第 ${st.round}/${st.rounds} 局 · `;
      if (st.over) return ctx.status('终局 · ' + ranking());
      if (st.phase === 'bet') {
        const s = me();
        if (myTurn()) { const t = sumBets(draft(s)); return ctx.status(rd + (ctx.hotseat ? ctx.name(s) + ' ' : '') + (t ? `已押 <b>${t}</b>，按「下注完成」确认` : '选筹码，点格子下注')); }
        const wait = st.done.map((d, i) => d ? null : ctx.name(i)).filter(Boolean);
        return ctx.status(rd + (wait.length ? '等待 ' + wait.join('、') + ' 下注…' : '庄家摇盅…'));
      }
      if (!vis.shown) return ctx.status(rd + '买定离手，庄家摇盅…');
      const d = st.dice, s = me(), dl = st.delta[s];
      ctx.status(rd + `开 ${d.join('·')} = ${d[0] + d[1] + d[2]} <b>${resWord(d)}</b>` + (n === 1 || ctx.isLocal(s) ? (dl > 0 ? ` · 赢 <b style="color:#ffe08a">+${dl}</b>` : dl < 0 ? ` · 输 ${-dl}` : '') : ''));
    }
    const ranking = () => BX.range(n).sort((a, b) => st.chips[b] - st.chips[a]).map(i => ctx.name(i) + ' ' + st.chips[i]).join(' · ');

    /* ---------- drawing ---------- */
    function chipStack(g, x, y, r, amt, col) {
      const parts = []; let a = amt;
      for (const v of [500, 100, 50, 10]) while (a >= v && parts.length < 5) { parts.push(v); a -= v; }
      parts.reverse();
      parts.forEach((v, i) => chipDisc(g, x, y - i * r * .22, r, v, col));
      if (amt) D.text(g, amt >= 10000 ? Math.round(amt / 1000) + 'k' : String(amt), x, y - (parts.length - 1) * r * .22, {size: r * (amt >= 1000 ? .62 : .78), color: amt && parts[parts.length - 1] === 10 ? '#3a2410' : '#fff', weight: 800, stroke: parts[parts.length - 1] === 10 ? null : 'rgba(0,0,0,.45)', strokeW: 2});
    }
    function drawCell(g, c, ox, oy, L) {
      const x = ox + c.x + 1.5, y = oy + c.y + 1.5, w = c.w - 3, h = c.h - 3, k = c.k, m = Math.min(w, h);
      let bgc = 'rgba(255,255,255,.05)';
      if (k === 'big' || k === 'small') bgc = 'rgba(178,58,43,.75)';
      else if (k === 'odd' || k === 'even') bgc = 'rgba(63,127,107,.55)';
      else if (k[0] === 't' || k === 'ta') bgc = 'rgba(60,30,70,.55)';
      else if (k[0] === 'd') bgc = 'rgba(30,70,55,.6)';
      else if (k[0] === 'n') bgc = 'rgba(0,0,0,.18)';
      g.fillStyle = bgc; D.rr(g, x, y, w, h, Math.min(8, m * .15)); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.5)'; g.lineWidth = 1; g.stroke();
      const cx = x + w / 2, cy = y + h / 2, cream = '#f6e7c8', gold = '#e6c57d';
      const small = h < 50;
      if (k === 'big' || k === 'small') {
        D.text(g, k === 'big' ? '大' : '小', cx, cy - h * (small ? .08 : .14), {size: Math.min(h * .44, w * .4), color: cream, font: 'serif', weight: 900, shadow: true});
        D.text(g, (k === 'big' ? '11–17' : '4–10') + '  1赔1', cx, y + h * (small ? .84 : .76), {size: BX.clamp(h * .15, 9, 14), color: gold, maxW: w - 4});
        if (h > 70) D.text(g, '遇围骰通杀', cx, y + h * .91, {size: BX.clamp(h * .11, 9, 12), color: 'rgba(246,231,200,.6)'});
      } else if (k === 'odd' || k === 'even') {
        D.text(g, k === 'odd' ? '单' : '双', cx, cy - h * .1, {size: Math.min(h * .42, w * .5), color: cream, font: 'serif', weight: 900, shadow: true});
        D.text(g, '1赔1', cx, y + h * .82, {size: BX.clamp(h * .15, 9, 13), color: gold});
      } else if (k === 'ta') {
        D.text(g, '全围', cx, cy - h * .1, {size: Math.min(h * .32, w * .3), color: gold, font: 'serif', weight: 900, shadow: true});
        D.text(g, '1赔24', cx, y + h * .82, {size: BX.clamp(h * .15, 9, 13), color: cream});
      } else if (k[0] === 't') {
        const v = +k[1], s = Math.min(w * .3, h * .3);
        D.die(g, cx - s * .55 - s / 2, y + h * .1, s, v); D.die(g, cx + s * .55 - s / 2, y + h * .1, s, v); D.die(g, cx - s / 2, y + h * .1 + s * .9, s, v);
        if (h > 56) D.text(g, '1赔150', cx, y + h * .9, {size: BX.clamp(h * .12, 8, 12), color: gold});
      } else if (k[0] === 'd') {
        const v = +k[1], s = Math.min(w * .3, h * .42);
        D.die(g, cx - s - 1, y + h * (small ? .14 : .1), s, v); D.die(g, cx + 1, y + h * (small ? .14 : .1), s, v);
        if (!small || w > 70) D.text(g, '1赔8', cx, y + h * .84, {size: BX.clamp(h * .15, 8, 13), color: gold});
      } else if (k[0] === 's') {
        const v = +k.slice(1);
        D.text(g, String(v), cx, cy - h * .12, {size: Math.min(h * .4, w * .45), color: cream, font: 'serif', weight: 800});
        D.text(g, '1赔' + SUMPAY[v], cx, y + h * .8, {size: BX.clamp(Math.min(h * .17, w * .22), 8, 13), color: gold, maxW: w - 2});
      } else if (k[0] === 'c') {
        const s = Math.min(w * .32, h * .44);
        D.die(g, cx - s - 1, cy - s * (h > 56 ? .75 : .5), s, +k[1]); D.die(g, cx + 1, cy - s * (h > 56 ? .75 : .5), s, +k[2]);
        if (h > 56) D.text(g, '1赔5', cx, y + h * .85, {size: BX.clamp(h * .14, 8, 12), color: gold});
      } else if (k[0] === 'n') {
        const s = Math.min(w * .42, h * .5);
        D.die(g, cx - s / 2, y + h * .1, s, +k[1]);
        D.text(g, '1赔1·2·3', cx, y + h * .83, {size: BX.clamp(Math.min(h * .14, w * .13), 8, 12), color: gold, maxW: w - 2});
      }
      // result highlight
      if (st.phase === 'reveal' && vis.shown && st.dice) {
        const m2 = pay(k, st.dice);
        if (m2) { const pt = (now() - vis.pulse) / 1000, a = .35 + .25 * Math.sin(pt * 6); g.save(); g.shadowColor = '#ffd76a'; g.shadowBlur = 16; g.strokeStyle = `rgba(255,215,106,${.6 + a})`; g.lineWidth = 3; D.rr(g, x, y, w, h, Math.min(8, m * .15)); g.stroke(); g.restore(); g.fillStyle = `rgba(255,215,106,${a * .35})`; g.fill(); }
        else { g.fillStyle = 'rgba(0,0,0,.28)'; D.rr(g, x, y, w, h, Math.min(8, m * .15)); g.fill(); }
      }
      // bets on this cell
      const v = me(), cr = BX.clamp(m * .2, 9, 16);
      let mine = 0;
      if (st.phase === 'bet') mine = st.done[v] ? (st.bets[v][k] || 0) : (ctx.isLocal(v) ? draft(v)[k] || 0 : 0);
      else mine = (st.prev[v] || {})[k] || 0;
      if (st.phase === 'reveal' && vis.shown && mine && !pay(k, st.dice) && (now() - vis.pulse) > 700) mine = 0;
      if (mine) chipStack(g, x + w - cr - 3, y + h - cr - 3, cr, mine);
      let dx = 0;
      for (let s = 0; s < n; s++) {
        if (s === v) continue;
        const b = st.phase === 'bet' ? (st.done[s] ? st.bets[s] : null) : st.prev[s];
        if (b && b[k]) { g.fillStyle = ctx.color(s); D.circle(g, x + 7 + dx, y + 7, 4.5); g.fill(); g.strokeStyle = '#fff8'; g.lineWidth = 1; g.stroke(); dx += 10; }
      }
    }
    function drawPanel(g, L) {
      const P = L.panel;
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 12; g.fillStyle = '#2a120c'; D.rr(g, P.x, P.y, P.w, P.h, 14); g.fill(); g.restore();
      const gr = g.createLinearGradient(P.x, P.y, P.x, P.y + P.h); gr.addColorStop(0, '#4a1a12'); gr.addColorStop(1, '#2a0e09');
      g.fillStyle = gr; D.rr(g, P.x + 3, P.y + 3, P.w - 6, P.h - 6, 12); g.fill();
      g.strokeStyle = 'rgba(200,160,82,.55)'; g.lineWidth = 1.5; D.rr(g, P.x + 6, P.y + 6, P.w - 12, P.h - 12, 10); g.stroke();
      // plate + dice + cup
      const {cx, cy, R} = L.cup;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx + 3, cy + R * .2, R * 1.32, R * .62, 0, 0, Math.PI * 2); g.fill();
      const pg = g.createLinearGradient(cx - R, cy - R * .5, cx + R, cy + R * .5); pg.addColorStop(0, '#e6c57d'); pg.addColorStop(.5, '#a8803a'); pg.addColorStop(1, '#6e5222');
      g.fillStyle = pg; g.beginPath(); g.ellipse(cx, cy + R * .12, R * 1.3, R * .6, 0, 0, Math.PI * 2); g.fill();
      const ig = g.createRadialGradient(cx, cy, R * .1, cx, cy, R * 1.2); ig.addColorStop(0, '#d9b46a'); ig.addColorStop(1, '#8a6a30');
      g.fillStyle = ig; g.beginPath(); g.ellipse(cx, cy + R * .05, R * 1.12, R * .48, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(60,40,10,.5)'; g.lineWidth = 1; g.stroke();
      const showDice = st.dice && vis.lift > .05;
      if (showDice) {
        const d = st.dice, s = R * .46, sd = st.round * 7;
        const pos = [[-.5, -.12], [.08, -.2], [-.18, .2]];
        d.forEach((v, i) => { const rot = Math.sin(sd + i * 2.1) * .35 * (1 - vis.lift * .3); D.die(g, cx + pos[i][0] * R * 1.3 - s / 2 + R * .2, cy + pos[i][1] * R - s / 2, s, v, {rot}); });
      }
      if (vis.lift < 1) {
        const t = now() / 1000, sh = vis.shake, amp = sh > 0 ? Math.sin(sh * Math.PI) : 0;
        const o = {dx: Math.sin(t * 38) * R * .12 * amp + vis.lift * R * .9, dy: -Math.abs(Math.sin(t * 29)) * R * .25 * amp - vis.lift * R * 1.2, rot: Math.sin(t * 31) * .12 * amp + vis.lift * .5, alpha: 1 - vis.lift};
        drawCup(g, cx, cy, R, o);
      }
      // result seal
      if (st.dice && vis.shown && st.phase !== 'bet') {
        const d = st.dice, k = vis.resultK, w = resWord(d), sum = d[0] + d[1] + d[2];
        g.save(); g.translate(L.res.x, L.res.y); g.scale(k, k);
        const tw = Math.min(P.w * .8, 150), th = 26;
        g.fillStyle = w === '大' ? '#b23a2b' : w === '小' ? '#2f5d8a' : '#c8a052'; D.rr(g, -tw / 2, -th / 2, tw, th, 8); g.fill();
        D.text(g, `${d.join(' ')}  =  ${sum}  ${w}`, 0, 1, {size: 15, color: '#fff7e6', weight: 800, maxW: tw - 8});
        g.restore();
      } else if (st.phase === 'bet' && !st.over) {
        D.text(g, '请下注', L.res.x, L.res.y, {size: 15, color: 'rgba(246,231,200,.75)', font: 'serif', weight: 700});
      }
      // history road
      const Hh = L.hist, cnt = Math.max(1, Math.floor(Hh.w / (Hh.h + 3)));
      const hs = (vis.shown || st.phase === 'bet') ? st.hist : st.hist.slice(0, -1);
      const lst = hs.slice(-cnt);
      for (let i = 0; i < cnt; i++) {
        const x = Hh.x + i * (Hh.h + 3) + Hh.h / 2, y = Hh.y + Hh.h / 2, d = lst[i];
        if (!d) { g.strokeStyle = 'rgba(230,197,125,.2)'; g.lineWidth = 1; D.circle(g, x, y, Hh.h / 2 - 1); g.stroke(); continue; }
        const w = resWord(d); g.fillStyle = w === '大' ? '#b23a2b' : w === '小' ? '#2f5d8a' : '#c8a052'; D.circle(g, x, y, Hh.h / 2 - 1); g.fill();
        D.text(g, String(d[0] + d[1] + d[2]), x, y + 1, {size: Hh.h * .5, color: '#fff', weight: 800});
      }
      // players
      const Pl = L.players, rh = Math.min(34, Pl.h / Math.max(1, n));
      // bet slip (landscape: free space under the player list)
      const slipY = Pl.y + n * rh + 10, slipH = Pl.y + Pl.h - slipY;
      if (!L.portrait && slipH > 60) {
        const v = me(), b = st.phase === 'bet' ? (st.done[v] ? st.bets[v] : ctx.isLocal(v) ? draft(v) : {}) : (st.prev[v] || {});
        const ks = Object.keys(b), lh = 20, maxN = Math.floor((slipH - 30) / lh);
        g.strokeStyle = 'rgba(200,160,82,.35)'; g.beginPath(); g.moveTo(Pl.x + 4, slipY); g.lineTo(Pl.x + Pl.w - 4, slipY); g.stroke();
        D.text(g, (ctx.hotseat ? ctx.name(v) + ' ' : '') + '注单', Pl.x + 6, slipY + 14, {size: 13, color: 'rgba(243,226,192,.7)', align: 'left', font: 'serif'});
        D.text(g, ks.length ? '共 ' + sumBets(b) : '未下注', Pl.x + Pl.w - 6, slipY + 14, {size: 13, color: '#e6c57d', align: 'right', weight: 700});
        ks.slice(0, maxN).forEach((k, i) => {
          const y = slipY + 34 + i * lh, res = st.phase === 'reveal' && vis.shown && st.dice ? pay(k, st.dice) : -1;
          D.text(g, NAME(k), Pl.x + 10, y, {size: 13, color: '#f3e2c0', align: 'left'});
          D.text(g, ODDS(k), Pl.x + Pl.w * .42, y, {size: 11, color: 'rgba(243,226,192,.5)', align: 'left'});
          D.text(g, res < 0 ? String(b[k]) : res ? '+' + b[k] * res : '−' + b[k], Pl.x + Pl.w - 8, y, {size: 13, color: res < 0 ? '#e6c57d' : res ? '#ffe08a' : '#e88a7a', align: 'right', weight: 700});
        });
        if (ks.length > maxN) D.text(g, '…', Pl.x + Pl.w / 2, slipY + 34 + maxN * lh, {size: 13, color: '#f3e2c0'});
      }
      for (let s = 0; s < n; s++) {
        const y = Pl.y + s * rh, mid = y + rh / 2, turn = ctx.turn.includes(s);
        g.fillStyle = s === me() && ctx.isLocal(s) ? 'rgba(230,197,125,.18)' : 'rgba(255,255,255,.05)'; D.rr(g, Pl.x, y + 1, Pl.w, rh - 3, 8); g.fill();
        g.fillStyle = ctx.color(s); D.circle(g, Pl.x + 10, mid, 5); g.fill();
        const tag = ctx.isAI(s) ? '·' + PERS[ctx.level(s)] : '';
        const fs = BX.clamp(rh * .42, 10, 14);
        D.text(g, ctx.name(s) + tag, Pl.x + 20, mid, {size: fs, color: '#f3e2c0', align: 'left', maxW: Pl.w * .5});
        D.text(g, String(shownChips[s]), Pl.x + Pl.w - 24, mid, {size: fs + 1, color: '#e6c57d', align: 'right', weight: 800});
        if (st.phase === 'bet' && !st.over) D.text(g, st.done[s] ? '✓' : turn ? '…' : '', Pl.x + Pl.w - 10, mid, {size: fs, color: st.done[s] ? '#7fd1a8' : '#f3e2c0'});
        if (st.phase === 'reveal' && vis.shown && st.delta[s]) {
          const dl = st.delta[s]; D.text(g, (dl > 0 ? '+' : '') + dl, Pl.x + Pl.w * .62, mid, {size: fs - 1, color: dl > 0 ? '#ffe08a' : '#e88a7a', weight: 700});
        }
      }
    }
    function drawTray(g, L) {
      const T = L.tray;
      g.fillStyle = '#2a120c'; D.rr(g, T.x, T.y, T.w, T.h, 12); g.fill();
      g.strokeStyle = 'rgba(200,160,82,.45)'; g.lineWidth = 1; D.rr(g, T.x + 3, T.y + 3, T.w - 6, T.h - 6, 10); g.stroke();
      const s = me(), can = myTurn(), rem = ctx.isLocal(s) ? remaining(s) : 0;
      for (const c of L.chips) {
        const sel = c.v === chipSel, dis = !can || rem < c.v;
        g.globalAlpha = dis ? .45 : 1;
        chipDisc(g, c.x, c.y - (sel ? 3 : 0), c.r * (sel ? 1 : .9), c.v);
        D.text(g, String(c.v), c.x, c.y - (sel ? 3 : 0), {size: c.r * .62, color: c.v === 10 ? '#3a2410' : '#fff', weight: 800});
        g.globalAlpha = 1;
        if (sel) { g.strokeStyle = '#ffd76a'; g.lineWidth = 2.5; D.circle(g, c.x, c.y - 3, c.r + 3); g.stroke(); }
      }
      const B = L.bal, fs = BX.clamp(T.h * .2, 11, 15);
      if (ctx.isLocal(s)) {
        D.text(g, (ctx.hotseat ? ctx.name(s) : '可用'), B.x, B.y - fs * .7, {size: fs * .85, color: 'rgba(243,226,192,.7)', align: 'left', maxW: B.w});
        D.text(g, String(st.phase === 'bet' ? rem : shownChips[s]), B.x, B.y + fs * .55, {size: fs * 1.25, color: '#e6c57d', weight: 800, align: 'left', maxW: B.w});
      }
      const labels = {undo: '撤销', clear: '清空', rep: '重复', done: '下注完成'};
      for (const b of L.btns) {
        const dis = !can || (b.id === 'undo' && !(stacks[s] || []).length) || (b.id === 'clear' && !sumBets(draft(s))) || (b.id === 'rep' && !sumBets(st.prev[s] || {}));
        const red = b.id === 'done';
        g.globalAlpha = dis ? .4 : 1;
        g.fillStyle = red ? '#7a1c12' : '#6e5222'; D.rr(g, b.x, b.y + 3, b.w, b.h - 3, 10); g.fill();
        const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, red ? '#d0533f' : '#e6c57d'); gr.addColorStop(1, red ? '#a33022' : '#c8a052');
        g.fillStyle = gr; D.rr(g, b.x, b.y, b.w, b.h - 4, 10); g.fill();
        D.text(g, red && b.w < 80 ? '完成' : labels[b.id], b.x + b.w / 2, b.y + (b.h - 4) / 2, {size: BX.clamp(b.h * .34, 12, 16), color: red ? '#fff3e3' : '#3a2410', weight: 800, maxW: b.w - 6});
        g.globalAlpha = 1;
      }
    }

    const inst = {
      st,
      toMove() { if (st.over || st.phase !== 'bet') return null; const t = BX.range(n).filter(i => !st.done[i]); return t.length ? t : null; },
      valid(a, by) { return a && a.t === 'bet' && st.phase === 'bet' && !st.done[by] && a.b && typeof a.b === 'object' && sumBets(clean(a.b, st.chips[by])) === sumBets(a.b); },
      sysMove() {
        if (st.over) return null;
        if (st.phase === 'bet' && st.done.every(Boolean)) return {a: {t: 'roll'}, delay: 450};
        if (st.phase === 'reveal') return {a: {t: 'next'}, delay: 4700};
        return null;
      },
      apply(a, by) {
        if (a.t === 'bet') {
          if (by < 0 || st.phase !== 'bet' || st.done[by]) return;
          st.bets[by] = clean(a.b, st.chips[by]); st.done[by] = true;
          drafts[by] = {}; stacks[by] = [];
          if (!ctx.fast) ctx.sfx(sumBets(st.bets[by]) ? 'chip' : 'tick');
        } else if (a.t === 'roll') {
          if (st.phase !== 'bet') return;
          const d = [ctx.rng.int(6) + 1, ctx.rng.int(6) + 1, ctx.rng.int(6) + 1];
          st.dice = d; st.hist.push(d); if (st.hist.length > 30) st.hist.shift();
          for (let s = 0; s < n; s++) {
            const b = st.bets[s]; let dl = 0;
            for (const k in b) { const m = pay(k, d); dl += m ? b[k] * m : -b[k]; }
            st.delta[s] = dl; st.chips[s] += dl;
            st.prev[s] = b; st.bets[s] = {};
          }
          st.phase = 'reveal';
          startRoll();
        } else if (a.t === 'next') {
          if (st.phase !== 'reveal') return;
          syncChips();
          if (st.round >= st.rounds || !alive()) {
            st.over = true; st.phase = 'over';
            const text = ranking();
            if (n === 1) ctx.end({win: st.chips[0] > START, text: `最终筹码 ${st.chips[0]}（起始 ${START}）`, title: st.chips[0] > START ? '满载而归' : st.chips[0] === START ? '不输不赢' : '庄家通吃'});
            else { const mx = Math.max(...st.chips), w = BX.range(n).filter(i => st.chips[i] === mx); ctx.end({winner: w.length === n ? -1 : w.length === 1 ? w[0] : w, text}); }
          } else {
            st.round++; st.phase = 'bet'; st.delta = Array(n).fill(0);
            st.done = st.chips.map(c => c < 10);
            if (!ctx.fast) { ctx.anim(450, k => vis.lift = 1 - k, () => ctx.sfx('place')); ctx.sfx('swish'); }
            else vis.lift = 0;
            vis.shown = true;
          }
        }
        updStatus();
      },
      aiMove(seat, level) { return {t: 'bet', b: aiBets(st, seat, level, Math.random)}; },
      onTurn() { updStatus(); },
      onView() { updStatus(); },
      ready() { if (st.phase === 'reveal') { vis.lift = 1; vis.shown = true; vis.resultK = 1; } syncChips(); updStatus(); },
      frame() {
        const g = cv.g; cv.clear();
        const L = layout();
        const key = L.W + 'x' + L.H;
        if (bgKey !== key) {
          bgKey = key; bg = document.createElement('canvas'); bg.width = Math.ceil(L.W); bg.height = Math.ceil(L.H);
          const bgg = bg.getContext('2d'); D.wood(bgg, 0, 0, L.W, L.H, {base: '#4a2114', dark: '#22100a', seed: 9, grain: .25});
        }
        g.drawImage(bg, 0, 0, L.W, L.H);
        drawPanel(g, L);
        // board felt
        const B = L.board;
        g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.fillStyle = '#163f30'; D.rr(g, B.x - 3, B.y - 3, B.w + 6, B.h + 6, 12); g.fill(); g.restore();
        D.felt(g, B.x, B.y, B.w, B.h, {color: '#1f5a43', r: 10});
        g.save(); D.rr(g, B.x, B.y, B.w, B.h, 10); g.clip();
        for (const c of L.cells) { if (c.y - scroll > B.h || c.y + c.h - scroll < 0) continue; drawCell(g, c, B.x, B.y - scroll, L); }
        if (L.scrollMax > 0) {
          if (scroll < L.scrollMax - 2) { const gr = g.createLinearGradient(0, B.y + B.h - 26, 0, B.y + B.h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(B.x, B.y + B.h - 26, B.w, 26); D.text(g, '▾ 上下滑动', B.x + B.w / 2, B.y + B.h - 9, {size: 11, color: '#f3e2c0'}); }
          const sh = B.h * B.h / L.contentH; g.fillStyle = 'rgba(230,197,125,.5)'; D.rr(g, B.x + B.w - 5, B.y + scroll / L.contentH * B.h, 3, sh, 2); g.fill();
        }
        g.restore();
        g.strokeStyle = 'rgba(200,160,82,.8)'; g.lineWidth = 2; D.rr(g, B.x, B.y, B.w, B.h, 10); g.stroke();
        drawTray(g, L);
        // flying chips
        const t = now();
        for (let i = fly.length - 1; i >= 0; i--) {
          const f = fly[i], k = (t - f.t0) / f.dur; if (k < 0) continue;
          if (k >= 1) { fly.splice(i, 1); continue; }
          const e = BX.ease.out(k), x = BX.lerp(f.x0, f.x1, e), y = BX.lerp(f.y0, f.y1, e) - Math.sin(k * Math.PI) * 30;
          chipDisc(g, x, y, 12, f.v);
        }
        for (let i = floats.length - 1; i >= 0; i--) {
          const f = floats[i], k = (t - f.t0) / f.dur; if (k < 0) continue;
          if (k >= 1) { floats.splice(i, 1); continue; }
          g.globalAlpha = 1 - k * k; D.text(g, f.text, f.x, f.y - k * 34, {size: 18, color: f.color, weight: 900, stroke: 'rgba(60,20,0,.8)', strokeW: 3}); g.globalAlpha = 1;
        }
        // banner
        if (vis.banner) {
          const k = (t - vis.banner) / 1100;
          if (k >= 1) vis.banner = 0;
          else {
            const sc = k < .2 ? BX.ease.back(k / .2) : 1, al = k > .7 ? 1 - (k - .7) / .3 : 1;
            g.save(); g.globalAlpha = al; g.translate(B.x + B.w / 2, B.y + Math.min(B.h, 300) / 2); g.scale(sc, sc);
            const bw = Math.min(B.w * .8, 300), bh = 70;
            g.fillStyle = 'rgba(122,28,18,.92)'; D.rr(g, -bw / 2, -bh / 2, bw, bh, 12); g.fill(); g.strokeStyle = '#e6c57d'; g.lineWidth = 3; g.stroke();
            D.text(g, vis.bannerText, 0, 2, {size: 38, color: '#fff3e3', font: 'deco', weight: 400, shadow: true});
            g.restore();
          }
        }
      },
    };
    infos(); updStatus();
    return inst;
  },
});

function chipDisc(g, x, y, r, v, ring) {
  const col = CHIPC[v] || '#b23a2b';
  g.save();
  g.fillStyle = 'rgba(0,0,0,.35)'; D.circle(g, x + r * .08, y + r * .14, r); g.fill();
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
  gr.addColorStop(0, D.shade(col, 25)); gr.addColorStop(1, D.shade(col, -18));
  g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
  g.strokeStyle = v === 10 ? '#b23a2b' : '#f3e2c0'; g.lineWidth = r * .18; g.setLineDash([r * .35, r * .35]); D.circle(g, x, y, r * .86); g.stroke(); g.setLineDash([]);
  g.strokeStyle = ring || (v === 500 ? '#c8a052' : 'rgba(255,255,255,.5)'); g.lineWidth = Math.max(1, r * .08); D.circle(g, x, y, r * .62); g.stroke();
  g.restore();
}
function drawCup(g, cx, cy, R, o = {}) {
  g.save(); g.translate(cx + (o.dx || 0), cy + (o.dy || 0)); g.rotate(o.rot || 0); g.globalAlpha = o.alpha == null ? 1 : Math.max(0, o.alpha);
  const bw = R * 1.08, tw = R * .6, hg = R * 1.3, by = R * .3;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4, by + 4, bw, R * .2, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(-bw, by);
  g.bezierCurveTo(-bw, by - hg * .55, -tw * 1.1, by - hg * .8, -tw, by - hg);
  g.quadraticCurveTo(0, by - hg - R * .18, tw, by - hg);
  g.bezierCurveTo(tw * 1.1, by - hg * .8, bw, by - hg * .55, bw, by);
  g.closePath();
  const gr = g.createLinearGradient(-bw, 0, bw, 0); gr.addColorStop(0, '#4a0f0a'); gr.addColorStop(.35, '#c23a2b'); gr.addColorStop(.55, '#d9573f'); gr.addColorStop(1, '#4a0f0a');
  g.fillStyle = gr; g.fill(); g.strokeStyle = '#c8a052'; g.lineWidth = Math.max(1, R * .05); g.stroke();
  // gold bands
  g.strokeStyle = '#e6c57d'; g.lineWidth = R * .07;
  g.beginPath(); g.ellipse(0, by - hg * .2, bw * .93, R * .14, 0, 0, Math.PI); g.stroke();
  g.lineWidth = R * .04; g.beginPath(); g.ellipse(0, by - hg * .8, tw * 1.02, R * .09, 0, 0, Math.PI); g.stroke();
  // medallion
  g.fillStyle = '#e6c57d'; D.circle(g, 0, by - hg * .52, R * .27); g.fill();
  g.fillStyle = '#7a1c12'; D.circle(g, 0, by - hg * .52, R * .21); g.fill();
  D.text(g, '宝', 0, by - hg * .52 + R * .02, {size: R * .3, color: '#e6c57d', font: 'serif', weight: 900});
  // rim + knob
  g.fillStyle = '#a8803a'; g.beginPath(); g.ellipse(0, by, bw, R * .12, 0, 0, Math.PI * 2); g.fill();
  D.disc(g, 0, by - hg - R * .14, R * .17, '#c8a052', {shadow: false});
  // highlight
  g.globalAlpha *= .25; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-bw * .45, by - hg * .5, R * .1, hg * .3, -.15, 0, Math.PI * 2); g.fill();
  g.restore();
}
