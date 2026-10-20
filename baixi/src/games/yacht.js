/* 快艇骰子 — classic 5-dice / 13-category game (Yahtzee-style rules under an original name). */
const D = BX.draw, C = BX.C;
const CAT = ['一点', '二点', '三点', '四点', '五点', '六点', '三条', '四条', '葫芦', '小顺', '大顺', '快艇', '全计'];
const CAT_HINT = ['1 的点数和', '2 的点数和', '3 的点数和', '4 的点数和', '5 的点数和', '6 的点数和', '三个相同·总和', '四个相同·总和', '三带二·25', '四连·30', '五连·40', '五个相同·50', '五骰总和'];
const Y = 11, PCOL = ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'];
const EXPV = [2.1, 5.3, 8.6, 12.2, 15.7, 19.2, 21.7, 13.1, 22.6, 29.5, 32.7, 16.9, 22.0];
const sum = d => d.reduce((a, b) => a + b, 0);
const counts = d => { const c = [0, 0, 0, 0, 0, 0, 0]; for (const v of d) c[v]++; return c; };
function rawScore(d, k) {
  const c = counts(d), mx = Math.max(...c);
  if (k < 6) return c[k + 1] * (k + 1);
  switch (k) {
    case 6: return mx >= 3 ? sum(d) : 0;
    case 7: return mx >= 4 ? sum(d) : 0;
    case 8: return c.includes(3) && c.includes(2) ? 25 : 0;
    case 9: return (c[1] && c[2] && c[3] && c[4]) || (c[2] && c[3] && c[4] && c[5]) || (c[3] && c[4] && c[5] && c[6]) ? 30 : 0;
    case 10: return (c[2] && c[3] && c[4] && c[5]) && (c[1] || c[6]) ? 40 : 0;
    case 11: return mx === 5 ? 50 : 0;
    case 12: return sum(d);
  }
  return 0;
}
/* legal categories + score, honoring the forced joker rule */
function options(d, card) {
  const isY = counts(d).includes(5), out = [];
  const open = k => card[k] == null;
  if (isY && card[Y] != null) {
    const up = d[0] - 1;
    if (open(up)) return [[up, rawScore(d, up)]];
    const lower = [6, 7, 8, 9, 10, 12].filter(open);
    if (lower.length) return lower.map(k => [k, k === 8 ? 25 : k === 9 ? 30 : k === 10 ? 40 : sum(d)]);
    return [0, 1, 2, 3, 4, 5].filter(open).map(k => [k, 0]);
  }
  for (let k = 0; k < 13; k++) if (open(k)) out.push([k, rawScore(d, k)]);
  return out;
}
const upperSum = card => { let s = 0; for (let k = 0; k < 6; k++) s += card[k] || 0; return s; };
const total = (card, yb) => { const u = upperSum(card); let s = u + (u >= 63 ? 35 : 0) + yb * 100; for (let k = 6; k < 13; k++) s += card[k] || 0; return s; };

/* ---------- AI tables: 252 sorted dice states, keeps and transition distributions ---------- */
const STATES = [], SIDX = new Map();
(function gen(cur, min) { if (cur.length === 5) { SIDX.set(cur.join(''), STATES.length); STATES.push(cur.slice()); return; } for (let v = min; v <= 6; v++) { cur.push(v); gen(cur, v); cur.pop(); } })([], 1);
const keyOf = arr => arr.slice().sort().join('');
const OUTC = {};   // n dice rolled -> [[sortedArr, prob]]
for (let n = 0; n <= 5; n++) {
  const m = new Map(); const tot = Math.pow(6, n);
  const rec = (cur) => { if (cur.length === n) { const k = keyOf(cur); m.set(k, (m.get(k) || 0) + 1); return; } for (let v = 1; v <= 6; v++) { cur.push(v); rec(cur); cur.pop(); } };
  rec([]); OUTC[n] = [...m].map(([k, c]) => [k ? k.split('').map(Number) : [], c / tot]);
}
const TRANS = new Map();   // keep key -> [[stateIdx, p]]
function trans(keep) {
  const k = keyOf(keep); let t = TRANS.get(k); if (t) return t;
  t = OUTC[5 - keep.length].map(([o, p]) => [SIDX.get(keyOf(keep.concat(o))), p]); TRANS.set(k, t); return t;
}
const KEEPS = STATES.map(s => {     // distinct sub-multisets for each state, with a mask of positions
  const seen = new Map();
  for (let m = 0; m < 32; m++) { const kp = []; for (let i = 0; i < 5; i++) if (m & (1 << i)) kp.push(s[i]); const k = keyOf(kp); if (!seen.has(k)) seen.set(k, kp); }
  return [...seen.values()];
});

BX.register({
  id: 'yacht', title: '快艇骰子', cat: 'dice', order: 1, sub: '五颗骰子，十三格计分',
  desc: '每回合最多掷三次五颗骰子，可以留下想要的骰子再掷，然后填入计分表的一格。十三轮后总分最高者获胜，五颗相同就是“快艇”！',
  kind: 'turn', seats: [1, 4], defSeats: 2, seatColors: PCOL, firstLabel: '先掷', aiDelay: 380, anyTimeActs: true,
  rules: `<p>每位玩家轮流进行回合，共 <b>13 轮</b>。每回合最多掷骰 <b>3 次</b>：第一次掷全部五颗，之后可以点选想<b>保留</b>的骰子，只重掷其余的。</p>
<p>掷完（或随时停手）后，必须在自己计分表中选<b>一个空格</b>填分，每格整局只能填一次；不符合条件的格子也可以填，记 0 分。</p>
<ul><li><b>一点～六点</b>：该点数骰子的点数之和。上半区合计 <b>≥ 63</b> 分时奖励 <b>35</b> 分。</li>
<li><b>三条</b> / <b>四条</b>：至少三个 / 四个相同点数，记五颗骰子总和。</li>
<li><b>葫芦</b>：三个相同加两个相同，<b>25</b> 分。</li>
<li><b>小顺</b>：四个连续点数，<b>30</b> 分；<b>大顺</b>：五个连续点数，<b>40</b> 分。</li>
<li><b>快艇</b>：五颗点数全部相同，<b>50</b> 分。<b>全计</b>：任意组合，记五颗总和。</li></ul>
<p><b>快艇奖励与百搭</b>：快艇格已填 50 分后再掷出快艇，额外奖励 <b>100</b> 分；此时必须优先填对应点数的上半区格，若已填则可把它当作百搭，在下半区任意空格拿满分（葫芦 25、小顺 30、大顺 40），下半区也满了才在上半区空格填 0。若快艇格填的是 0，则没有奖励，但百搭规则照样适用。</p>
<p>十三轮结束后总分最高者获胜。操作：点「掷骰」，点骰子切换保留，点计分表中自己那一列的格子填分（触屏点两次确认）。</p>`,
  icon(g, w, h) {
    D.felt(g, 0, 0, w, h, {color: '#2a5f74'});
    g.strokeStyle = 'rgba(230,197,125,.5)'; g.lineWidth = 3; D.rr(g, 8, 8, w - 16, h - 16, 14); g.stroke();
    const s = h * .3;
    [[.16, .2, 5, -.2], [.43, .14, 5, .15], [.7, .22, 5, -.05], [.27, .55, 5, .3], [.58, .55, 5, -.25]].forEach(([x, y, v, r]) => D.die(g, w * x, h * y, s, v, {rot: r}));
    // a little sail
    g.fillStyle = '#f3e2c0'; g.beginPath(); g.moveTo(w * .86, h * .5); g.lineTo(w * .86, h * .85); g.lineTo(w * .97, h * .85); g.closePath(); g.fill();
  },
  create(ctx) {
    const N = ctx.n;
    const st = {dice: [1, 2, 3, 4, 5], held: [0, 0, 0, 0, 0], rolls: 0, turn: 0, round: 1, cards: BX.range(N).map(() => new Array(13).fill(null)), yb: new Array(N).fill(0), last: null, rollId: 0, over: false};
    const cv = ctx.canvas();
    let tumble = {id: -1, k: 1, from: [], rot: []}, pend = -1, flash = null, t = 0;
    const myTurn = () => !st.over && ctx.canAct(st.turn);
    /* ---------- layout ---------- */
    function layout() {
      const W = cv.w, H = cv.h, land = W > H * 1.15;
      if (land) {
        const sheetW = Math.min(W * .56, 120 + 74 * N + 40), sheet = {x: W - sheetW - 8, y: 8, w: sheetW, h: H - 16};
        const tray = {x: 8, y: 8, w: W - sheetW - 24, h: H - 16};
        return {land, sheet, tray};
      }
      const trayH = Math.min(H * .34, W * .62, 260);
      return {land, tray: {x: 8, y: 6, w: W - 16, h: trayH}, sheet: {x: 8, y: trayH + 12, w: W - 16, h: H - trayH - 18}};
    }
    function trayGeo(L) {
      const tr = L.tray, btnH = Math.max(44, Math.min(56, tr.h * .22));
      const ds = Math.min((tr.w - 40) / 5.6, (tr.h - btnH - 40) * .8, 92), gap = ds * .15;
      const dw = ds * 5 + gap * 4, dx = tr.x + (tr.w - dw) / 2, dy = tr.y + Math.max(26, (tr.h - btnH - ds) / 2 - 6);
      const bw = Math.min(tr.w - 32, 220);
      return {ds, gap, dx, dy, btn: {x: tr.x + (tr.w - bw) / 2, y: tr.y + tr.h - btnH - 12, w: bw, h: btnH}};
    }
    function sheetGeo(L) {
      const sh = L.sheet, rows = 17, rh = Math.min(sh.h / (rows + .4), 40);
      const labW = Math.min(sh.w * .42, 120 + (N < 3 ? 40 : 0)), colW = (sh.w - labW - 8) / N;
      const h = rh * (rows + .4), y0 = sh.y + (sh.h - h) / 2;
      return {rh, labW, colW, x0: sh.x + 4, y0, w: sh.w - 8, h};
    }
    // row index mapping: 0..5 upper, 6 = 上半合计, 7 = 奖励, 8..14 lower (cat 6..12), 15 = 快艇奖励, 16 = 总分
    const rowOfCat = k => k < 6 ? k : k + 2;
    const catOfRow = r => r < 6 ? r : r >= 8 && r <= 14 ? r - 2 : -1;
    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e), L = layout(), tg = trayGeo(L);
      if (!myTurn()) return;
      // roll button
      const b = tg.btn;
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { if (st.rolls < 3) { pend = -1; ctx.act({t: 'roll'}, st.turn); } return; }
      // dice
      if (st.rolls > 0 && st.rolls < 3) for (let i = 0; i < 5; i++) {
        const x = tg.dx + i * (tg.ds + tg.gap), y = tg.dy + (st.held[i] ? -tg.ds * .12 : 0);
        if (p.x >= x - 4 && p.x <= x + tg.ds + 4 && p.y >= y - 8 && p.y <= y + tg.ds + 16) { ctx.act({t: 'hold', i}, st.turn); return; }
      }
      // score sheet
      if (st.rolls > 0) {
        const sg = sheetGeo(L), r = Math.floor((p.y - sg.y0 - sg.rh * .4) / sg.rh), c = Math.floor((p.x - sg.x0 - sg.labW) / sg.colW);
        const k = catOfRow(r);
        if (k >= 0 && p.x >= sg.x0 && p.x <= sg.x0 + sg.w) {
          if (c !== st.turn && p.x > sg.x0 + sg.labW) { /* tapped another player's column: treat as own row */ }
          const ok = options(st.dice, st.cards[st.turn]).find(o => o[0] === k);
          if (!ok) { ctx.sfx('error'); return; }
          if (e.pointerType !== 'mouse' && pend !== k) { pend = k; ctx.sfx('tick'); return; }
          pend = -1; ctx.act({t: 'score', k}, st.turn);
        }
      }
    });
    /* ---------- status ---------- */
    const info = () => { for (let s = 0; s < N; s++) ctx.info(s, total(st.cards[s], st.yb[s]) + ' 分'); };
    const status = () => {
      info();
      if (st.over) return ctx.status('终局');
      const who = myTurn() ? (ctx.hotseat || N === 1 ? ctx.name(st.turn) + ' · ' : '你 · ') : ctx.name(st.turn) + ' · ';
      const r = '第 ' + st.round + '/13 轮 · ';
      ctx.status(r + who + (st.rolls === 0 ? '掷骰' : st.rolls < 3 ? '第 ' + st.rolls + ' 掷，可保留后重掷或填分' : '请填分'));
    };
    /* ---------- AI ---------- */
    function catValue(card, yb, k, s, w) {
      let v = s - w * EXPV[k];
      if (k < 6) {
        const u = upperSum(card);
        if (u < 63) { const par = 3 * (k + 1); v += (s - par) * .55; if (u + s >= 63) v += 22; }
      }
      if (k === Y && s === 0) v -= 6;
      return v;
    }
    function finalValue(d, card, yb, w) {
      const ops = options(d, card); let best = -Infinity, bk = ops[0][0];
      const bonus = counts(d).includes(5) && card[Y] === 50 ? 100 : 0;
      for (const [k, s] of ops) { const v = catValue(card, yb, k, s, w) + bonus; if (v > best) { best = v; bk = k; } }
      return [best, bk];
    }
    function bestKeep(seat, level) {
      const card = st.cards[seat], yb = st.yb[seat], w = level >= 3 ? 1 : .6;
      const V2 = new Float64Array(STATES.length); STATES.forEach((s, i) => V2[i] = finalValue(s, card, yb, w)[0]);
      const ev = (keep, V) => { let e = 0; for (const [si, p] of trans(keep)) e += V[si] * p; return e; };
      let Vn = V2;
      const rollsLeft = 3 - st.rolls;
      if (level >= 3 && rollsLeft >= 2) {
        const V1 = new Float64Array(STATES.length);
        STATES.forEach((s, i) => { let m = V2[i]; for (const kp of KEEPS[i]) { const e = ev(kp, V2); if (e > m) m = e; } V1[i] = m; });
        Vn = V1;
      }
      const cur = st.dice.slice().sort(), ci = SIDX.get(cur.join(''));
      let best = V2[ci], bk = null;   // stopping now is always allowed
      for (const kp of KEEPS[ci]) { const e = ev(kp, Vn); if (e > best + 1e-9) { best = e; bk = kp; } }
      return bk;   // null = stop and score
    }
    function aiAct(seat, level) {
      if (st.rolls === 0) return {t: 'roll'};
      const card = st.cards[seat], yb = st.yb[seat];
      if (st.rolls < 3) {
        let keep;
        if (level === 1) {
          const c = counts(st.dice); let f = 6; for (let v = 6; v >= 1; v--) if (c[v] > c[f]) f = v;
          const ops = options(st.dice, card), raw = Math.max(...ops.map(o => o[1]));
          if (raw >= 30 && Math.random() < .7) keep = null;
          else if (Math.random() < .25) { const k = []; for (const v of st.dice) if (v >= 4) k.push(v); keep = k; }
          else keep = st.dice.filter(v => v === f);
        } else keep = bestKeep(seat, level);
        if (keep === null) return scoreAct(seat, level);
        const hold = [0, 0, 0, 0, 0], need = counts(keep);
        st.dice.forEach((v, i) => { if (need[v] > 0) { need[v]--; hold[i] = 1; } });
        if (hold.every(x => x)) return scoreAct(seat, level);
        return {t: 'roll', hold};
      }
      return scoreAct(seat, level);
    }
    function scoreAct(seat, level) {
      const card = st.cards[seat], yb = st.yb[seat];
      if (level === 1) {
        const ops = options(st.dice, card).map(([k, s]) => [k, s - (k === 12 ? 8 : 0) - (k === Y ? 0 : 0) + Math.random() * 4 - (s === 0 ? EXPV[k] * .3 : 0)]);
        return {t: 'score', k: BX.ai.byLevel(ops, 3)};
      }
      return {t: 'score', k: finalValue(st.dice, card, yb, level >= 3 ? 1 : .6)[1]};
    }
    /* ---------- apply ---------- */
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid(a, by) {
        if (by !== st.turn || st.over) return false;
        if (a.t === 'roll') return st.rolls < 3 && (!a.hold || (Array.isArray(a.hold) && a.hold.length === 5 && st.rolls > 0));
        if (a.t === 'hold') return st.rolls > 0 && st.rolls < 3 && a.i >= 0 && a.i < 5;
        if (a.t === 'score') return st.rolls > 0 && options(st.dice, st.cards[st.turn]).some(o => o[0] === a.k);
        return false;
      },
      apply(a) {
        if (a.t === 'hold') { st.held[a.i] = st.held[a.i] ? 0 : 1; ctx.sfx('click'); status(); return; }
        if (a.t === 'roll') {
          if (a.hold && st.rolls > 0) st.held = a.hold.map(x => x ? 1 : 0);
          if (st.rolls === 0) st.held = [0, 0, 0, 0, 0];
          const from = st.dice.slice();
          for (let i = 0; i < 5; i++) if (!st.held[i]) st.dice[i] = 1 + ctx.rng.int(6);
          st.rolls++; st.rollId++; pend = -1;
          const tb = {id: st.rollId, k: 0, from, rot: st.dice.map(() => (Math.random() - .5) * 9), mask: st.held.slice()}; tumble = tb;
          ctx.anim(560, k => tb.k = k, null, BX.ease.out); ctx.sfx('dice');
          if (counts(st.dice).includes(5)) ctx.after(560, () => { ctx.sfx('win'); flash = {txt: '快艇！', t: 1.6}; });
          status(); return;
        }
        if (a.t === 'score') {
          const s = st.turn, card = st.cards[s];
          const isY = counts(st.dice).includes(5);
          const val = options(st.dice, card).find(o => o[0] === a.k)[1];
          if (isY && card[Y] === 50) { st.yb[s]++; ctx.toast('快艇奖励 +100'); }
          card[a.k] = val; st.last = {s, k: a.k};
          ctx.sfx(val > 0 ? 'chip' : 'buzz');
          st.rolls = 0; st.held = [0, 0, 0, 0, 0];
          st.turn = (st.turn + 1) % N;
          if (st.turn === 0) st.round++;
          if (st.round > 13) {
            st.over = true; status();
            const tots = BX.range(N).map(i => total(st.cards[i], st.yb[i])), mx = Math.max(...tots);
            const win = BX.range(N).filter(i => tots[i] === mx);
            const text = BX.range(N).map(i => ctx.name(i) + ' ' + tots[i]).join('　');
            ctx.end(N === 1 ? {win: true, title: '总分 ' + mx, text: '本局得分 ' + mx + (ctx.best('score', mx).isNew ? '（新纪录！）' : '')} : {winner: win.length === N ? -1 : win.length === 1 ? win[0] : win, text});
            return;
          }
          status();
        }
      },
      aiMove(seat, level) { return aiAct(seat, level); },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); t += dt;
        const L = layout(), tg = trayGeo(L), sg = sheetGeo(L);
        /* tray */
        const tr = L.tray;
        D.wood(g, tr.x, tr.y, tr.w, tr.h, {r: 16, seed: 9, base: '#7a4524', dark: '#3a1a0a'});
        D.felt(g, tr.x + 10, tr.y + 10, tr.w - 20, tr.h - 20, {r: 12, color: '#2a5f74'});
        g.strokeStyle = 'rgba(230,197,125,.35)'; g.lineWidth = 1.5; D.rr(g, tr.x + 16, tr.y + 16, tr.w - 32, tr.h - 32, 9); g.stroke();
        const col = PCOL[st.turn % 4];
        D.text(g, ctx.name(st.turn) + (st.rolls ? '  ·  第 ' + st.rolls + '/3 掷' : ''), tr.x + tr.w / 2, tr.y + 26, {size: Math.min(17, tr.w / 18), color: '#f3e2c0', weight: 700});
        g.fillStyle = col; D.circle(g, tr.x + 28, tr.y + 26, 7); g.fill();
        // pips for rolls left
        for (let i = 0; i < 3; i++) { g.fillStyle = i < st.rolls ? 'rgba(243,226,192,.25)' : C.gold2; D.circle(g, tr.x + tr.w - 28 - i * 16, tr.y + 26, 5); g.fill(); }
        // dice
        const tb = tumble, rolling = tb.id === st.rollId && tb.k < 1;
        for (let i = 0; i < 5; i++) {
          let x = tg.dx + i * (tg.ds + tg.gap), y = tg.dy, v = st.dice[i], rot = 0;
          if (st.rolls === 0) { g.globalAlpha = .35; D.die(g, x, y, tg.ds, v); g.globalAlpha = 1; continue; }
          const moving = rolling && !tb.mask[i];
          if (moving) {
            const k = tb.k; rot = tb.rot[i] * (1 - k); y -= Math.sin(k * Math.PI) * tg.ds * .5 * (1 - k * .5); x += Math.sin(k * 9 + i) * tg.ds * .08 * (1 - k);
            if (k < .85) v = 1 + Math.floor((t * 23 + i * 3.7) % 6);
          }
          if (st.held[i]) y -= tg.ds * .12;
          D.die(g, x, y, tg.ds, v, {rot, sel: st.held[i] ? C.red2 : false});
          if (st.held[i]) { D.text(g, '留', x + tg.ds / 2, y + tg.ds + 13, {size: 13, color: C.gold2, weight: 800}); }
        }
        // roll button
        const b = tg.btn, can = myTurn() && st.rolls < 3;
        g.save(); g.globalAlpha = can ? 1 : .45;
        const bg = g.createLinearGradient(0, b.y, 0, b.y + b.h); bg.addColorStop(0, '#d0533f'); bg.addColorStop(1, '#a33022');
        g.fillStyle = '#6e1d14'; D.rr(g, b.x, b.y + 3, b.w, b.h, 12); g.fill(); g.fillStyle = bg; D.rr(g, b.x, b.y, b.w, b.h, 12); g.fill();
        D.text(g, st.rolls === 0 ? '掷 骰' : st.rolls < 3 ? '重 掷（' + (3 - st.rolls) + '）' : '请 填 分', b.x + b.w / 2, b.y + b.h / 2, {size: Math.min(20, b.h * .42), color: '#fff3e3', weight: 800});
        g.restore();
        if (myTurn() && st.rolls > 0 && st.rolls < 3) D.text(g, '点骰子保留 · 点计分表填分', tr.x + tr.w / 2, b.y - 12, {size: 12, color: 'rgba(243,226,192,.7)', weight: 500});
        /* sheet */
        const sh = L.sheet;
        D.paper(g, sh.x, sh.y, sh.w, sh.h, {r: 12, color: '#f5ead2'});
        g.strokeStyle = 'rgba(120,80,40,.4)'; g.lineWidth = 1; D.rr(g, sh.x + .5, sh.y + .5, sh.w - 1, sh.h - 1, 12); g.stroke();
        const {rh, labW, colW, x0, y0} = sg, fs = Math.min(15, rh * .48);
        // header
        for (let s = 0; s < N; s++) {
          const cx = x0 + labW + s * colW;
          if (s === st.turn && !st.over) { g.fillStyle = D.alpha(PCOL[s], .14); g.fillRect(cx, y0, colW, rh * 17.4); }
          g.fillStyle = PCOL[s]; D.rr(g, cx + 3, y0 + 2, colW - 6, rh * .4 - 3, 4); g.fill();
        }
        const opts = myTurn() || (st.rolls > 0 && !st.over) ? options(st.dice, st.cards[st.turn]) : [];
        for (let r = 0; r < 17; r++) {
          const y = y0 + rh * .4 + r * rh, k = catOfRow(r);
          const special = r === 6 || r === 7 || r === 15 || r === 16;
          if (special) { g.fillStyle = r === 16 ? 'rgba(178,58,43,.12)' : 'rgba(120,80,40,.08)'; g.fillRect(x0, y, sg.w, rh); }
          g.strokeStyle = 'rgba(120,80,40,.22)'; g.beginPath(); g.moveTo(x0, y + rh); g.lineTo(x0 + sg.w, y + rh); g.stroke();
          const lab = k >= 0 ? CAT[k] : ['上半合计', '奖励 ≥63', '', '', '', '', '', '', '', '快艇奖励', '总分'][r - 6];
          D.text(g, lab, x0 + 8, y + rh / 2 + (labW > 100 && k >= 0 ? -fs * .28 : 0), {size: fs, align: 'left', color: special ? C.red : C.ink, weight: special ? 800 : 700, font: 'serif'});
          if (k >= 0 && labW > 100 && rh > 26) D.text(g, CAT_HINT[k], x0 + 8, y + rh / 2 + fs * .55, {size: Math.max(9, fs * .62), align: 'left', color: C.ink2, weight: 400});
          for (let s = 0; s < N; s++) {
            const cx = x0 + labW + s * colW + colW / 2, card = st.cards[s];
            let txt = '', color = C.ink, wgt = 700;
            if (k >= 0) {
              if (card[k] != null) { txt = String(card[k]); if (st.last && st.last.s === s && st.last.k === k) color = C.red; }
              else if (s === st.turn && st.rolls > 0) {
                const o = opts.find(q => q[0] === k);
                if (o) {
                  const sel = pend === k;
                  g.fillStyle = sel ? 'rgba(63,127,107,.85)' : o[1] > 0 ? 'rgba(63,127,107,.16)' : 'rgba(0,0,0,.04)';
                  D.rr(g, cx - colW / 2 + 3, y + 3, colW - 6, rh - 6, 6); g.fill();
                  txt = String(o[1]); color = sel ? '#fff' : o[1] > 0 ? C.jade : 'rgba(43,33,24,.35)'; wgt = 600;
                  if (sel) D.text(g, '再点确认', cx, y + rh - 5, {size: 8.5, color: '#e8fff6', weight: 500});
                }
              }
            } else if (r === 6) txt = String(upperSum(card));
            else if (r === 7) { const u = upperSum(card); txt = u >= 63 ? '35' : (card.slice(0, 6).every(x => x != null) ? '0' : '差' + (63 - u)); color = u >= 63 ? C.jade : C.ink2; wgt = u >= 63 ? 800 : 500; }
            else if (r === 15) txt = st.yb[s] ? String(st.yb[s] * 100) : '';
            else if (r === 16) { txt = String(total(card, st.yb[s])); color = C.red; wgt = 900; }
            if (txt) D.text(g, txt, cx, y + rh / 2 - (k >= 0 && pend === k && s === st.turn && card[k] == null ? 4 : 0), {size: r === 16 ? fs * 1.15 : r === 7 && txt.startsWith('差') ? fs * .78 : fs, color, weight: wgt});
          }
        }
        // column separators
        g.strokeStyle = 'rgba(120,80,40,.25)';
        for (let s = 0; s <= N; s++) { const x = x0 + labW + s * colW; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + rh * 17.4); g.stroke(); }
        // yacht flash
        if (flash) {
          flash.t -= dt; if (flash.t <= 0) flash = null;
          else { const a = Math.min(1, flash.t); D.text(g, flash.txt, tr.x + tr.w / 2, tg.dy + tg.ds / 2, {size: Math.min(64, tr.w / 6), color: `rgba(255,220,120,${a})`, font: 'deco', weight: 400, stroke: `rgba(90,20,10,${a})`, strokeW: 6}); }
        }
      },
    };
    status();
    return inst;
  },
});
