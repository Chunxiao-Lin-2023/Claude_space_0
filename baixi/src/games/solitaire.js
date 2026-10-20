/* 纸牌接龙 — 克朗代克（翻一张/翻三张）与蜘蛛纸牌（单色/双色/四色）。单人游戏。 */
const D = BX.draw, K = BX.data.slkit;
const RK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const FACE = {11: '侍', 12: '后', 13: '王'};
const isRed = s => s === 1 || s === 3;
const SCOL = s => isRed(s) ? '#c0291f' : '#1d1a17';

/* suit glyphs drawn as paths (font independent). s: 0♠ 1♥ 2♣ 3♦ */
function suitPath(g, cx, cy, sz, s) {
  const k = sz / 2, P = (x, y) => [cx + x * k, cy + y * k];
  g.beginPath();
  if (s === 1 || s === 0) {
    const f = s === 0 ? -1 : 1, oy = s === 0 ? -.1 : 0, pt = (x, y) => P(x * .92, y * f + oy);
    g.moveTo(...pt(0, .9));
    g.bezierCurveTo(...pt(-.15, .62), ...pt(-1, .28), ...pt(-1, -.22));
    g.bezierCurveTo(...pt(-1, -.74), ...pt(-.36, -.98), ...pt(0, -.5));
    g.bezierCurveTo(...pt(.36, -.98), ...pt(1, -.74), ...pt(1, -.22));
    g.bezierCurveTo(...pt(1, .28), ...pt(.15, .62), ...pt(0, .9));
    g.closePath();
    if (s === 0) { g.moveTo(...P(0, .2)); g.quadraticCurveTo(...P(.08, .8), ...P(.42, 1)); g.lineTo(...P(-.42, 1)); g.quadraticCurveTo(...P(-.08, .8), ...P(0, .2)); g.closePath(); }
  } else if (s === 3) {
    g.moveTo(...P(0, -1)); g.quadraticCurveTo(...P(.3, -.38), ...P(.74, 0)); g.quadraticCurveTo(...P(.3, .38), ...P(0, 1));
    g.quadraticCurveTo(...P(-.3, .38), ...P(-.74, 0)); g.quadraticCurveTo(...P(-.3, -.38), ...P(0, -1)); g.closePath();
  } else {
    const c = (x, y, r) => { const [a, b] = P(x, y); g.moveTo(a + r * k, b); g.arc(a, b, r * k, 0, Math.PI * 2); };
    c(0, -.47, .35); c(-.45, .1, .35); c(.45, .1, .35); c(0, -.05, .22);
    g.moveTo(...P(0, .05)); g.quadraticCurveTo(...P(.06, .75), ...P(.42, 1)); g.lineTo(...P(-.42, 1)); g.quadraticCurveTo(...P(-.06, .75), ...P(0, .05)); g.closePath();
  }
  g.fill();
}
const PIPS = {2: [[1, 0], [1, 4]], 3: [[1, 0], [1, 2], [1, 4]], 4: [[0, 0], [2, 0], [0, 4], [2, 4]], 5: [[0, 0], [2, 0], [1, 2], [0, 4], [2, 4]],
  6: [[0, 0], [2, 0], [0, 2], [2, 2], [0, 4], [2, 4]], 7: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [0, 4], [2, 4]],
  8: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [1, 3], [0, 4], [2, 4]], 9: [[0, 0], [2, 0], [0, 4 / 3], [2, 4 / 3], [1, 2], [0, 8 / 3], [2, 8 / 3], [0, 4], [2, 4]],
  10: [[0, 0], [2, 0], [1, 2 / 3], [0, 4 / 3], [2, 4 / 3], [0, 8 / 3], [2, 8 / 3], [1, 10 / 3], [0, 4], [2, 4]]};

function drawFace(g, x, y, w, h, c) {
  const r = w * .08, col = SCOL(c.s), rk = RK[c.r];
  D.rr(g, x, y, w, h, r);
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#fffcf3'); gr.addColorStop(1, '#f0e4cb');
  g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(1, w * .014); g.strokeStyle = 'rgba(70,45,20,.5)'; g.stroke();
  const fs = w * (rk === '10' ? .32 : .36);
  g.font = `800 ${fs}px ${BX.F.sans}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = col;
  const maxW = w * .4, tw = Math.min(maxW, g.measureText(rk).width), bx = x + w * .07, by = y + w * .06 + fs * .74;
  g.fillText(rk, bx, by, maxW);
  g.fillStyle = col; suitPath(g, bx + tw + w * .15, by - fs * .34, w * .25, c.s);
  if (w >= 56) {   // bottom-right index
    g.save(); g.translate(x + w, y + h); g.rotate(Math.PI);
    g.font = `800 ${fs * .7}px ${BX.F.sans}`; g.fillStyle = col; g.fillText(rk, w * .07, w * .05 + fs * .52, maxW * .7);
    g.restore();
  }
  if (c.r > 10) {
    const px = x + w * .2, py = y + h * .36, pw = w * .6, ph = h * .55;
    D.rr(g, px, py, pw, ph, w * .06);
    const pg = g.createLinearGradient(px, py, px, py + ph); pg.addColorStop(0, isRed(c.s) ? '#fbe3d6' : '#e9e3d6'); pg.addColorStop(1, isRed(c.s) ? '#f1c9b4' : '#d6ccb8');
    g.fillStyle = pg; g.fill(); g.lineWidth = Math.max(1, w * .025); g.strokeStyle = '#c8a052'; g.stroke();
    g.lineWidth = Math.max(.6, w * .01); g.strokeStyle = col; D.rr(g, px + w * .04, py + w * .04, pw - w * .08, ph - w * .08, w * .04); g.stroke();
    D.text(g, FACE[c.r], x + w / 2, py + ph * .44, {size: w * .38, color: col, font: 'serif', weight: 900});
    g.fillStyle = col; suitPath(g, x + w / 2, py + ph * .8, w * .15, c.s);
  } else if (c.r === 1 || w < 70) {
    g.fillStyle = col; suitPath(g, x + w / 2, y + h * .63, w * (c.r === 1 ? .56 : .46), c.s);
    if (c.r === 1 && w >= 50) { g.strokeStyle = 'rgba(200,160,82,.7)'; g.lineWidth = Math.max(1, w * .015); D.circle(g, x + w / 2, y + h * .62, w * .38); g.stroke(); }
  } else {
    g.fillStyle = col;
    for (const [cx, ry] of PIPS[c.r]) suitPath(g, x + w * (.3 + cx * .2), y + h * (.37 + ry * .125), w * .17, c.s);
  }
}
function drawBack(g, x, y, w, h) {
  const r = w * .08;
  D.rr(g, x, y, w, h, r);
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#a3321f'); gr.addColorStop(1, '#5e160f');
  g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(1, w * .014); g.strokeStyle = 'rgba(40,10,5,.6)'; g.stroke();
  const m = w * .08;
  g.save(); D.rr(g, x + m, y + m, w - 2 * m, h - 2 * m, r * .6); g.clip();
  g.strokeStyle = 'rgba(230,197,125,.28)'; g.lineWidth = Math.max(.7, w * .016);
  const st = w * .14;
  for (let i = -h; i < w + h; i += st) { g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + h, y + h); g.moveTo(x + i + h, y); g.lineTo(x + i, y + h); g.stroke(); }
  g.restore();
  g.lineWidth = Math.max(1, w * .03); g.strokeStyle = '#d9b46a'; D.rr(g, x + m, y + m, w - 2 * m, h - 2 * m, r * .6); g.stroke();
  const cx = x + w / 2, cy = y + h / 2;
  g.fillStyle = '#6e1a12'; D.circle(g, cx, cy, w * .25); g.fill(); g.strokeStyle = '#e6c57d'; g.lineWidth = Math.max(1, w * .025); g.stroke();
  D.text(g, '戏', cx, cy + w * .02, {size: w * .3, color: '#f0d590', font: 'deco', weight: 400});
}

BX.register({
  id: 'solitaire', title: '纸牌接龙', cat: 'solo', order: 1, sub: '克朗代克与蜘蛛纸牌',
  desc: '最经典的单人纸牌：克朗代克（翻一张/翻三张）与蜘蛛纸牌（单色/双色/四色）。拖动或轻点即可移牌，无限撤销，附带提示与自动收牌。',
  kind: 'solo',
  options: [{key: 'v', label: '玩法', choices: [['k1', '克朗代克·翻一张'], ['k3', '克朗代克·翻三张'], ['s1', '蜘蛛·单色'], ['s2', '蜘蛛·双色'], ['s4', '蜘蛛·四色']], def: 'k1'}],
  rules: `<p><b>克朗代克</b>（一副 52 张）：7 列牌桌，第 n 列发 n 张，只有最上面一张翻开；左上为牌库，右侧为 4 个收牌区。</p>
<p>· 牌桌上按<b>红黑相间、点数递减</b>叠放（如黑 9 上放红 8），可以整串移动已排好的牌；空列只能放 <b>K</b>（或以 K 开头的牌串）。<br>
· 收牌区按<b>同花色从 A 到 K</b> 依次收牌，收齐四门即获胜；收牌区顶牌也可拖回牌桌。<br>
· 点牌库翻牌到废牌堆（翻一张或翻三张，翻三张时只能用最上面那张）；牌库翻完后点空位可把废牌堆重新翻回牌库，次数不限。<br>
· 牌桌上被移开后露出的暗牌会自动翻开。所有暗牌都翻开后会<b>自动收牌</b>。</p>
<p><b>蜘蛛纸牌</b>（两副 104 张）：10 列，前 4 列各 6 张、后 6 列各 5 张，余下 50 张分 5 次发。</p>
<p>· 任何花色都可按<b>点数递减</b>叠放，但只有<b>同花色</b>的连续递减牌串才能整串移动；空列可以放任意牌或牌串。<br>
· 点右上角牌库发一轮：给每列各发一张；<b>有空列时不能发牌</b>。<br>
· 在一列中凑成同花色 <b>K 到 A</b> 的完整一串时自动移走；移走全部 8 串即获胜。单色只有黑桃，双色为黑桃与红心，四色四门花色齐全。</p>
<p><b>操作</b>：拖动牌（串）到目标位置；或<b>轻点</b>一张牌自动移到最合适的位置（能收牌时优先收牌）。底部按钮：撤销（无限次）、提示（多次点击轮换不同提示）、自动收牌/发牌、新局。键盘：Z 撤销、H 提示、空格翻牌/发牌。</p>`,
  icon(g, w, h) {
    K.table(g, w, h, 'felt');
    const cw = h * .42, ch = cw * 1.4;
    g.save(); g.translate(w * .2, h * .2); g.rotate(-.08); g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; drawBack(g, 0, 0, cw, ch); g.restore(); g.restore();
    const fan = [{r: 13, s: 0}, {r: 12, s: 1}, {r: 1, s: 0}];
    fan.forEach((c, i) => { g.save(); g.translate(w * .48 + i * cw * .42, h * .2 + i * 4); g.rotate(-.18 + i * .18); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.shadowOffsetY = 2; drawFace(g, 0, 0, cw, ch, c); g.restore(); });
  },
  create(ctx) {
    const V = ctx.opts.v || 'k1', SP = V[0] === 's', DRAW = V === 'k3' ? 3 : 1, NS = SP ? +V[1] : 4, NT = SP ? 10 : 7;
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let cards = [], P = {}, up = [], moves = 0, time = 0, started = false, won = false;
    let undoS = [], vis = [], tgt = [], L = null, drag = null, hint = null, hintList = null, hintIdx = 0, autoT = 0, autoRun = false, autoOff = false, casc = null, banner = null;
    let lastTap = {t: 0, x: 0, y: 0};
    const tableaus = BX.range(NT).map(i => 't' + i), founds = SP ? BX.range(8).map(i => 'd' + i) : BX.range(4).map(i => 'f' + i);
    const bar = K.bar(ctx, [
      {k: 'undo', ic: '↶', t: '撤销', on: () => undo()},
      {k: 'hint', ic: '☞', t: '提示', on: () => showHint()},
      SP ? {k: 'deal', ic: '⇟', t: '发牌', on: () => dealRow()} : {k: 'auto', ic: '⇪', t: '自动收牌', on: () => { autoOff = false; if (canAuto()) runAuto(); }},
      {k: 'new', ic: '↻', t: '新局', on: async () => { if (started && !won && !(await BX.confirm('放弃这一局，重新发牌？', '新局'))) return; ctx.restart(); }},
    ]);

    function newDeal() {
      cards = [];
      if (!SP) for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) cards.push({r, s});
      else { const su = NS === 1 ? [0] : NS === 2 ? [0, 1] : [0, 1, 2, 3]; for (let k = 0; k < 8; k++) for (let r = 1; r <= 13; r++) cards.push({r, s: su[k % su.length]}); }
      const ids = ctx.rng.shuffle(cards.map((_, i) => i));
      P = {stock: [], waste: []}; for (const t of tableaus) P[t] = []; for (const f of founds) P[f] = [];
      up = cards.map(() => false);
      const order = [];
      if (!SP) { for (let row = 0; row < 7; row++) for (let c = row; c < 7; c++) { const id = ids.pop(); P['t' + c].push(id); order.push(id); if (c === row) up[id] = true; } }
      else { for (let k = 0; k < 54; k++) { const id = ids.pop(); P['t' + (k % 10)].push(id); order.push(id); } for (const t of tableaus) up[P[t][P[t].length - 1]] = true; }
      P.stock = ids;
      return order;
    }
    function resetVis(order) {
      vis = cards.map(() => ({x: null, y: null, vup: false, ft: 1, from: false, wait: 0, sh: 0}));
      order.forEach((id, k) => vis[id].wait = .25 + k * (SP ? .026 : .045));
    }
    resetVis(newDeal());
    ctx.after(200, () => ctx.sfx('shuffle'));

    /* ---------- rules ---------- */
    const topId = pk => P[pk][P[pk].length - 1];
    function runOk(pk, i) {
      const a = P[pk]; if (i < 0 || i >= a.length || !up[a[i]]) return false;
      for (let j = i + 1; j < a.length; j++) { const x = cards[a[j - 1]], y = cards[a[j]]; if (!up[a[j]] || x.r !== y.r + 1 || (SP ? x.s !== y.s : isRed(x.s) === isRed(y.s))) return false; }
      return true;
    }
    function movable(pk, i) {
      const a = P[pk]; if (!a || i < 0 || i >= a.length) return false;
      if (pk[0] === 't') return runOk(pk, i);
      if (pk === 'waste' || pk[0] === 'f') return i === a.length - 1;
      return false;
    }
    function canDrop(from, i, to) {
      if (from === to) return false;
      const a = P[from], c = cards[a[i]], n = a.length - i, b = P[to];
      if (to[0] === 't') { if (!b.length) return SP || c.r === 13; const tid = b[b.length - 1], t = cards[tid]; return up[tid] && t.r === c.r + 1 && (SP || isRed(t.s) !== isRed(c.s)); }
      if (to[0] === 'f') { if (n !== 1) return false; if (!b.length) return c.r === 1; const t = cards[b[b.length - 1]]; return t.s === c.s && t.r + 1 === c.r; }
      return false;
    }
    const snap = () => JSON.stringify({P, up, moves});
    function pushUndo() { undoS.push(snap()); if (undoS.length > 3000) undoS.shift(); }
    function start() { if (!started) { started = true; } hideBanner(); }
    function flipTop(pk) { const a = P[pk]; if (a.length && !up[a[a.length - 1]]) up[a[a.length - 1]] = true; }
    function doMove(from, i, to) {
      pushUndo(); start();
      const ids = P[from].splice(i); P[to].push(...ids); moves++;
      if (from[0] === 't') flipTop(from);
      ctx.sfx(to[0] === 'f' ? 'score' : 'card');
      if (to[0] === 'f') { const v = L && L.S[to]; if (v) fx.burst(v.x + L.cw / 2, v.y + L.ch / 2, 10, {sp: 140, size: 3, life: .5}); }
      if (SP && to[0] === 't') checkRun(to);
      afterChange();
    }
    function afterChange() { hint = null; hintList = null; saveCur(); checkWin(); }
    function checkRun(pk) {
      const a = P[pk]; if (a.length < 13) return false;
      const i = a.length - 13; if (cards[a[a.length - 1]].r !== 1 || cards[a[i]].r !== 13 || !runOk(pk, i)) return false;
      const k = founds.findIndex(f => !P[f].length); if (k < 0) return false;
      const ids = a.splice(i).reverse(); P[founds[k]].push(...ids);
      ids.forEach((id, j) => vis[id].wait = .15 + j * .035);
      flipTop(pk);
      ctx.after(300, () => { ctx.sfx('score'); const s = L && L.S[founds[k]]; if (s) fx.burst(s.x + L.cw / 2, s.y + L.ch / 2, 26, {sp: 200}); });
      return true;
    }
    function dealRow() {
      if (won || !SP) return;
      if (!P.stock.length) { ctx.toast('牌库已发完'); ctx.sfx('error'); return; }
      if (tableaus.some(t => !P[t].length)) { ctx.toast('有空列时不能发牌'); ctx.sfx('error'); return; }
      pushUndo(); start();
      tableaus.forEach((t, c) => { const id = P.stock.pop(); up[id] = true; P[t].push(id); vis[id].wait = c * .05; });
      moves++; ctx.sfx('deal');
      for (const t of tableaus) checkRun(t);
      afterChange();
    }
    function drawK() {
      if (won || SP) return;
      if (!P.stock.length) {
        if (!P.waste.length) return;
        pushUndo(); start(); P.stock = P.waste.reverse(); P.waste = []; P.stock.forEach(id => up[id] = false); moves++; ctx.sfx('shuffle'); afterChange(); return;
      }
      pushUndo(); start();
      const n = Math.min(DRAW, P.stock.length);
      for (let k = 0; k < n; k++) { const id = P.stock.pop(); up[id] = true; P.waste.push(id); vis[id].wait = k * .07; }
      moves++; ctx.sfx('flip'); afterChange();
    }
    function undo() {
      if (!undoS.length || won || autoRun) { ctx.sfx('error'); return; }
      const o = JSON.parse(undoS.pop()); P = o.P; up = o.up; moves = o.moves; hint = null; hintList = null;
      ctx.sfx('whoosh'); saveCur(); refreshBar();
    }
    function checkWin() {
      if (won) return;
      const ok = SP ? founds.every(f => P[f].length === 13) : founds.every(f => P[f].length === 13);
      if (ok) onWin(); else { refreshBar(); if (canAuto() && !autoOff && !autoRun && !autoT) autoT = ctx.after(500, () => { autoT = 0; if (canAuto() && !autoOff) runAuto(); }); }
    }
    const canAuto = () => !SP && !won && tableaus.every(t => P[t].every(id => up[id])) && (DRAW === 1 || (!P.stock.length && !P.waste.length)) && !founds.every(f => P[f].length === 13);
    function runAuto() {
      if (autoRun) return; autoRun = true; start(); refreshBar();
      const step = () => {
        if (won) { autoRun = false; return; }
        let best = null;
        const consider = (pk, i) => { const c = cards[P[pk][i]]; if (best && c.r >= best.r) return; for (const f of founds) { const b = P[f]; if ((!b.length && c.r === 1) || (b.length && cards[b[b.length - 1]].s === c.s && cards[b[b.length - 1]].r + 1 === c.r)) { best = {pk, i, f, r: c.r}; return; } } };
        for (const t of tableaus) if (P[t].length) consider(t, P[t].length - 1);
        if (P.waste.length) consider('waste', P.waste.length - 1);
        for (let i = 0; i < P.stock.length; i++) consider('stock', i);
        for (let i = 0; i < P.waste.length - 1; i++) consider('waste', i);
        if (!best) { autoRun = false; refreshBar(); return; }
        const id = P[best.pk].splice(best.i, 1)[0]; up[id] = true; P[best.f].push(id); moves++;
        ctx.sfx('card');
        if (founds.every(f => P[f].length === 13)) { autoRun = false; saveCur(); checkWin(); return; }
        ctx.after(75, step);
      };
      step();
    }
    function onWin() {
      won = true; hint = null; drag = null; ctx.save('cur_' + V, null);
      const secs = Math.floor(time), tb = ctx.best('t_' + V, secs, 'min'), mb = ctx.best('m_' + V, moves, 'min');
      ctx.save('wins_' + V, ctx.load('wins_' + V, 0) + 1);
      refreshBar(); say(`用时 ${K.fmt(secs)} · 步数 ${moves} · 完成！`);
      ctx.after(450, startCascade);
      ctx.end({win: true, title: '大功告成', text: `用时 ${K.fmt(secs)} 步数 ${moves}` + (tb.isNew ? ' · 最快纪录！' : tb.best != null ? ` · 最快 ${K.fmt(tb.best)}` : '') + (mb.isNew && !tb.isNew ? ' · 最少步数！' : ''), delay: 4200});
    }
    function refreshBar() {
      bar.dis('undo', !undoS.length || won || autoRun);
      bar.dis('hint', won || autoRun);
      if (SP) { bar.dis('deal', won || !P.stock.length); bar.label('deal', '发牌 ' + (P.stock.length / 10)); }
      else { bar.dis('auto', !canAuto() || autoRun); bar.on('auto', canAuto() && !autoRun); }
    }
    /* ---------- save / resume ---------- */
    function saveCur() { if (!won) ctx.save('cur_' + V, {cards, P, up, moves, time: Math.floor(time)}); }
    const saved = ctx.load('cur_' + V, null);
    if (saved && saved.P && saved.moves > 0) {
      K.css();
      banner = BX.h('div', {class: 'sk-ban'}, BX.h('span', {text: '上一局还没打完'}),
        BX.h('button', {class: 'bx-btn jade', text: '继续上局', on: {click: e => { e.stopPropagation(); cards = saved.cards; P = saved.P; up = saved.up; moves = saved.moves; time = saved.time || 0; started = true; undoS = []; resetVis(Object.values(P).flat()); hideBanner(); refreshBar(); ctx.sfx('deal'); }}}),
        BX.h('button', {class: 'bx-btn ghost', text: '✕', on: {click: e => { e.stopPropagation(); hideBanner(); }}}));
      banner.addEventListener('pointerdown', e => e.stopPropagation());
      ctx.el.append(banner);
    }
    function hideBanner() { if (banner) { banner.remove(); banner = null; } }

    /* ---------- hints ---------- */
    function computeHints() {
      const out = [];
      const add = (pk, i, to, pr) => out.push({pk, i, to, pr});
      if (!SP) {
        for (const src of [...tableaus, 'waste']) { const a = P[src]; if (!a.length) continue; for (const f of founds) if (canDrop(src, a.length - 1, f)) { add(src, a.length - 1, f, 100 - cards[a[a.length - 1]].r); break; } }
        for (const t of tableaus) {
          const a = P[t]; let i = a.findIndex(id => up[id]); if (i < 0) continue;
          const reveal = i > 0, isK = cards[a[i]].r === 13;
          for (const to of tableaus) {
            if (!canDrop(t, i, to)) continue;
            if (!P[to].length) { if (reveal) add(t, i, to, 50); }
            else if (reveal) add(t, i, to, 70); else if (!isK) add(t, i, to, 40);
          }
        }
        if (P.waste.length) { const i = P.waste.length - 1; for (const to of tableaus) if (canDrop('waste', i, to)) { add('waste', i, to, P[to].length ? 45 : 35); break; } }
        if (P.stock.length || P.waste.length) add('stock', -1, null, 1);
      } else {
        for (const t of tableaus) {
          const a = P[t];
          for (let i = a.length - 1; i >= 0 && runOk(t, i); i--) {
            const below = i > 0 ? a[i - 1] : -1, c = cards[a[i]];
            const natural = below >= 0 && up[below] && cards[below].s === c.s && cards[below].r === c.r + 1;
            const reveal = below >= 0 && !up[below];
            for (const to of tableaus) {
              if (!canDrop(t, i, to)) continue;
              const b = P[to];
              if (b.length) {
                const same = cards[b[b.length - 1]].s === c.s;
                if (same && !natural) add(t, i, to, 90 + (reveal ? 10 : 0) + (i === 0 ? 5 : 0));
                else if (!natural && (reveal || i === 0)) add(t, i, to, 40 + (reveal ? 10 : 0));
                else if (!natural && !same && below >= 0 && cards[below].r !== c.r + 1) add(t, i, to, 25);
              } else if (i > 0 && !natural) add(t, i, to, reveal ? 30 : 15);
            }
          }
        }
        if (P.stock.length && !tableaus.some(t => !P[t].length)) add('stock', -1, null, 1);
      }
      out.sort((a, b) => b.pr - a.pr);
      const seen = new Set();
      return out.filter(h => { const k = h.pk + h.i + h.to; if (seen.has(k)) return false; seen.add(k); return true; });
    }
    function showHint() {
      if (won || autoRun) return;
      if (!hintList) { hintList = computeHints(); hintIdx = 0; }
      if (!hintList.length) { ctx.toast(SP && P.stock.length ? '先把空列填上才能发牌' : '没有可走的步了，试试撤销或新局', 2500); ctx.sfx('error'); return; }
      hint = Object.assign({t: 0}, hintList[hintIdx % hintList.length]); hintIdx++;
      ctx.sfx('tick');
    }

    /* ---------- layout ---------- */
    function layout() {
      const A = bar.area(cv.w, cv.h), W = A.w, H = A.h, pad = Math.max(6, Math.min(W, H) * .02);
      const gT = Math.max(3, Math.min(10, W * .01));
      const needT = SP ? 6.1 : 5.7, needS = SP ? 5.0 : 4.7;
      const cwT = Math.min((W - 2 * pad - (NT - 1) * gT) / NT, (H - 2 * pad) / needT / 1.4);
      const extra = SP ? 1 : 2;
      const cwS = Math.min((W - 2 * pad - (NT - 1) * gT - extra * gT * 2) / (NT + extra), (H - 2 * pad) / needS / 1.4, SP ? 1e9 : (H - 2 * pad - 3 * gT) / 4 / 1.4);
      const side = cwS > cwT * 1.05;
      const cw = Math.floor(Math.min(side ? cwS : cwT, 128)), ch = Math.round(cw * 1.4), g = Math.max(3, Math.min(gT, cw * .12));
      const S = {};
      if (!side) {
        const tw = NT * cw + (NT - 1) * g, x0 = A.x + (W - tw) / 2, y0 = A.y + pad, cx = i => x0 + i * (cw + g);
        if (!SP) { S.stock = {x: cx(0), y: y0}; S.waste = {x: cx(1), y: y0, dx: cw * .3, dy: 0}; founds.forEach((f, i) => S[f] = {x: cx(3 + i), y: y0}); }
        else { S.stock = {x: cx(9), y: y0, sdx: -cw * .16, sdy: 0}; founds.forEach((f, i) => S[f] = {x: cx(0) + i * cw * .28, y: y0}); S.doneBox = {x: cx(0), y: y0, w: cw + 7 * cw * .28, h: ch}; }
        const ty = y0 + ch + g * 2.2;
        tableaus.forEach((t, i) => S[t] = {x: cx(i), y: ty});
      } else {
        const gap2 = g * 2, tw = (NT + extra) * cw + (NT - 1) * g + extra * gap2, y0 = A.y + pad;
        let x = A.x + (W - tw) / 2;
        if (!SP) { S.stock = {x, y: y0}; S.waste = {x, y: y0 + ch + g * 2, dx: 0, dy: ch * .2}; x += cw + gap2; }
        for (const t of tableaus) { S[t] = {x, y: y0}; x += cw + g; }
        x += gap2 - g;
        if (!SP) founds.forEach((f, i) => S[f] = {x, y: y0 + i * (ch + g)});
        else {
          S.stock = {x, y: y0, sdx: 0, sdy: ch * .07};
          const ys = y0 + ch + 4 * ch * .07 + g * 2.5, step = Math.max(4, Math.min(ch * .3, (A.y + H - pad - ys - ch) / 7));
          founds.forEach((f, i) => S[f] = {x, y: ys + i * step}); S.doneBox = {x, y: ys, w: cw, h: ch + 7 * step};
        }
      }
      L = {cw, ch, g, side, S, bottom: A.y + H - pad, A};
    }
    function computeTargets() {
      const {S, cw, ch} = L; tgt = [];
      const st = P.stock;
      for (let k = 0; k < st.length; k++) {
        if (SP) { const ng = Math.ceil(st.length / 10), grp = Math.floor(k / 10), o = ng - 1 - grp; tgt[st[k]] = {x: S.stock.x + S.stock.sdx * o, y: S.stock.y + S.stock.sdy * grp}; }
        else { const o = Math.floor(k / 8); tgt[st[k]] = {x: S.stock.x - o * .7, y: S.stock.y - o * .7}; }
      }
      if (!SP) {
        const a = P.waste, n = a.length;
        for (let k = 0; k < n; k++) { const v = DRAW === 3 ? Math.max(0, k - (n - 3)) : 0; tgt[a[k]] = {x: S.waste.x + v * S.waste.dx, y: S.waste.y + v * S.waste.dy}; }
      }
      for (const f of founds) { const a = P[f]; for (let k = 0; k < a.length; k++) tgt[a[k]] = {x: S[f].x, y: S[f].y - Math.min(k, 12) * .25}; }
      L.colH = {};
      for (const t of tableaus) {
        const a = P[t], s = S[t]; if (!a.length) { L.colH[t] = ch; continue; }
        const dn = ch * .11, upS = ch * (SP ? .25 : .27);
        let sum = 0; for (let k = 1; k < a.length; k++) sum += up[a[k - 1]] ? upS : dn;
        const avail = L.bottom - s.y - ch; let f = sum > avail && sum > 0 ? Math.max(.25, avail / sum) : 1;
        let y = s.y;
        for (let k = 0; k < a.length; k++) { if (k) y += (up[a[k - 1]] ? upS : dn) * (up[a[k - 1]] ? f : Math.max(f, .45)); tgt[a[k]] = {x: s.x, y}; }
        L.colH[t] = y + ch - s.y;
      }
    }
    function hit(p) {
      const {S, cw, ch} = L, inR = (x, y) => p.x >= x && p.x <= x + cw && p.y >= y && p.y <= y + ch;
      for (const t of tableaus) { const a = P[t]; for (let k = a.length - 1; k >= 0; k--) { const q = tgt[a[k]]; if (q && inR(q.x, q.y)) return {pk: t, i: k}; } }
      if (!SP && P.waste.length) { const q = tgt[topId('waste')]; if (inR(q.x, q.y)) return {pk: 'waste', i: P.waste.length - 1}; }
      if (!SP) for (const f of founds) if (P[f].length && inR(S[f].x, S[f].y)) return {pk: f, i: P[f].length - 1};
      if (SP) { const ng = Math.ceil(P.stock.length / 10); if (ng && p.x >= S.stock.x + S.stock.sdx * (ng - 1) - 2 && p.x <= S.stock.x + cw + 2 && p.y >= S.stock.y - 2 && p.y <= S.stock.y + ch + S.stock.sdy * (ng - 1) + 2) return {pk: 'stock', i: -1}; }
      else if (inR(S.stock.x, S.stock.y)) return {pk: 'stock', i: -1};
      return null;
    }

    /* ---------- input ---------- */
    function shake(id) { if (vis[id]) vis[id].sh = .35; ctx.sfx('error'); }
    function autoTap(pk, i) {
      const ids = P[pk].slice(i), c = cards[ids[0]], cand = [];
      if (!SP && ids.length === 1 && pk[0] !== 'f') for (const f of founds) if (canDrop(pk, i, f)) { cand.push([f, 0]); break; }
      for (const t of tableaus) {
        if (!canDrop(pk, i, t)) continue;
        const b = P[t];
        if (b.length) cand.push([t, SP && cards[b[b.length - 1]].s === c.s ? 1 : 2]);
        else if (!(pk[0] === 't' && i === 0)) cand.push([t, 3]);
      }
      if (!cand.length) { shake(ids[0]); return false; }
      cand.sort((a, b) => a[1] - b[1]);
      doMove(pk, i, cand[0][0]); return true;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (e.button > 0) return;
      if (casc) { casc.q.length = 0; casc.bodies.length = 0; return; }
      if (won || autoRun || drag || !L) return;
      const p = cv.pos(e), h = hit(p);
      if (!h) return;
      if (h.pk === 'stock') { SP ? dealRow() : drawK(); return; }
      const now = performance.now();
      if (now - lastTap.t < 320 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 30) return;   // swallow the 2nd click of a double-click
      if (!movable(h.pk, h.i)) { shake(P[h.pk][h.i]); return; }
      const ids = P[h.pk].slice(h.i), q0 = tgt[ids[0]];
      drag = {pk: h.pk, i: h.i, ids, sx: p.x, sy: p.y, ox: p.x - q0.x, oy: p.y - q0.y, rel: ids.map(id => [tgt[id].x - q0.x, tgt[id].y - q0.y]), moved: false, pid: e.pointerId, mouse: e.pointerType === 'mouse'};
      try { cv.cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const p = cv.pos(e);
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > (drag.mouse ? 4 : 9)) { drag.moved = true; hint = null; }
      if (drag.moved) drag.ids.forEach((id, k) => { vis[id].x = p.x - drag.ox + drag.rel[k][0]; vis[id].y = p.y - drag.oy + drag.rel[k][1]; vis[id].wait = 0; });
    });
    const endDrag = e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      if (won) return;
      if (!d.moved) { const p = cv.pos(e); if (autoTap(d.pk, d.i)) lastTap = {t: performance.now(), x: p.x, y: p.y}; return; }
      const v = vis[d.ids[0]], {cw, ch} = L; let best = null, bestA = 0;
      for (const to of [...founds, ...tableaus]) {
        if (!canDrop(d.pk, d.i, to)) continue;
        const s = L.S[to], hh = to[0] === 't' ? Math.max(ch, L.colH[to]) : ch;
        const ox = Math.min(v.x + cw, s.x + cw) - Math.max(v.x, s.x), oy = Math.min(v.y + ch, s.y + hh) - Math.max(v.y, s.y);
        if (ox > 0 && oy > 0 && ox * oy > bestA) { bestA = ox * oy; best = to; }
      }
      if (best) doMove(d.pk, d.i, best); else ctx.sfx('tick');
    };
    ctx.on(cv.cv, 'pointerup', endDrag);
    ctx.on(cv.cv, 'pointercancel', endDrag);

    /* ---------- drawing ---------- */
    const spr = new Map(); let sprKey = '';
    function sprite(id, faceUp) {
      const key = L.cw + '|' + cv.dpr; if (key !== sprKey) { spr.clear(); sprKey = key; }
      const c = cards[id], k = faceUp ? c.r + '_' + c.s : 'back';
      let s = spr.get(k); if (s) return s;
      const pad = Math.ceil(L.cw * .1) + 2, w = L.cw, h = L.ch, d = cv.dpr;
      const can = document.createElement('canvas'); can.width = Math.ceil((w + pad * 2) * d); can.height = Math.ceil((h + pad * 2) * d);
      const g = can.getContext('2d'); g.scale(d, d);
      g.save(); g.shadowColor = 'rgba(0,0,0,.38)'; g.shadowBlur = Math.max(2, w * .06); g.shadowOffsetY = Math.max(1, w * .025); D.rr(g, pad, pad, w, h, w * .08); g.fillStyle = '#3a2a1a'; g.fill(); g.restore();
      if (faceUp) drawFace(g, pad, pad, w, h, c); else drawBack(g, pad, pad, w, h);
      s = {can, pad}; spr.set(k, s); return s;
    }
    function blit(g, id, faceUp, x, y, sx) {
      const s = sprite(id, faceUp), W2 = L.cw + 2 * s.pad, H2 = L.ch + 2 * s.pad;
      if (sx == null || sx > .999) g.drawImage(s.can, x - s.pad, y - s.pad, W2, H2);
      else { g.save(); g.translate(x + L.cw / 2, y); g.scale(Math.max(.02, sx), 1); g.drawImage(s.can, -L.cw / 2 - s.pad, -s.pad, W2, H2); g.restore(); }
    }
    let bgC = null, bgKey = '';
    function drawBg(g) {
      const key = cv.w + 'x' + cv.h + '@' + cv.dpr;
      if (key !== bgKey) { bgKey = key; bgC = document.createElement('canvas'); bgC.width = Math.ceil(cv.w * cv.dpr); bgC.height = Math.ceil(cv.h * cv.dpr); const b = bgC.getContext('2d'); b.scale(cv.dpr, cv.dpr); K.table(b, cv.w, cv.h, 'felt'); }
      g.drawImage(bgC, 0, 0, cv.w, cv.h);
    }
    function slot(g, x, y, w, h, label, sub) {
      const {cw} = L;
      g.fillStyle = 'rgba(0,0,0,.16)'; D.rr(g, x, y, w, h, cw * .08); g.fill();
      g.strokeStyle = 'rgba(240,220,170,.32)'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.stroke(); g.setLineDash([]);
      if (label) D.text(g, label, x + w / 2, y + h / 2 - (sub ? cw * .08 : 0), {size: cw * .34, color: 'rgba(240,220,170,.38)', font: 'serif', weight: 700});
      if (sub) D.text(g, sub, x + w / 2, y + h / 2 + cw * .26, {size: Math.max(10, cw * .16), color: 'rgba(240,220,170,.38)'});
    }
    function drawSlots(g) {
      const {S, cw, ch} = L;
      if (!SP) {
        slot(g, S.stock.x, S.stock.y, cw, ch, P.stock.length ? '' : P.waste.length ? '↻' : '', P.stock.length ? '' : P.waste.length ? '重翻' : '空');
        founds.forEach(f => slot(g, S[f].x, S[f].y, cw, ch, 'A', '收牌'));
        tableaus.forEach(t => slot(g, S[t].x, S[t].y, cw, ch, 'K', ''));
      } else {
        const b = S.doneBox; slot(g, b.x, b.y, b.w, b.h, '', '');
        const nd = founds.filter(f => P[f].length).length;
        if (!nd) D.text(g, '已收 0/8', b.x + b.w / 2, b.y + b.h / 2, {size: Math.max(11, cw * .2), color: 'rgba(240,220,170,.45)'});
        if (!P.stock.length) slot(g, S.stock.x, S.stock.y, cw, ch, '', '发完');
        tableaus.forEach(t => slot(g, S[t].x, S[t].y, cw, ch, '', ''));
      }
    }
    function glow(g, x, y, w, h, a) {
      g.save(); g.shadowColor = 'rgba(255,214,110,' + a + ')'; g.shadowBlur = 16; g.strokeStyle = 'rgba(255,214,110,' + a + ')'; g.lineWidth = 3;
      D.rr(g, x - 2, y - 2, w + 4, h + 4, L.cw * .1); g.stroke(); g.restore();
    }
    function startCascade() {
      const q = []; for (let r = 12; r >= 0; r--) for (const f of founds) if (P[f][r] != null) q.push(P[f][r]);
      const tr = document.createElement('canvas'); tr.width = cv.cv.width; tr.height = cv.cv.height;
      const tg = tr.getContext('2d'); tg.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0);
      casc = {q, bodies: [], t: 0, tr, tg, gone: new Set(), W: cv.w, H: cv.h};
      fx.rain(cv.w, cv.h, 50);
    }
    function stepCascade(g, dt) {
      const c = casc, sc = L.cw / 80;
      c.t += dt;
      while (c.t > .12 && c.q.length) {
        c.t -= .12; const id = c.q.shift(), v = vis[id];
        c.gone.add(id); c.bodies.push({id, x: v.x, y: v.y, vx: (Math.random() < .5 ? -1 : 1) * (110 + Math.random() * 230) * sc, vy: -(60 + Math.random() * 280) * sc});
        if (c.bodies.length % 4 === 1) ctx.sfx('tick');
      }
      for (let i = c.bodies.length - 1; i >= 0; i--) {
        const b = c.bodies[i];
        for (let s = 0; s < 3; s++) {
          b.vy += 1500 * sc * dt / 3; b.x += b.vx * dt / 3; b.y += b.vy * dt / 3;
          if (b.y + L.ch > c.H) { b.y = c.H - L.ch; b.vy = -Math.abs(b.vy) * .74; }
          blit(c.tg, b.id, true, b.x, b.y);
        }
        if (b.x < -L.cw * 1.5 || b.x > c.W + L.cw * .5) c.bodies.splice(i, 1);
      }
      g.drawImage(c.tr, 0, 0, cv.w, cv.h);
    }

    let lastSec = -1;
    function status() {
      const s = Math.floor(time);
      say(`用时 ${K.fmt(s)} · 步数 ${moves}` + (SP ? ` · 余 ${P.stock.length / 10} 轮发牌` : ''));
      lastSec = s;
    }
    refreshBar();

    const inst = {
      frame(dt) {
        const g = cv.g; cv.clear();
        layout(); computeTargets();
        if (started && !won) time += dt;
        if (!won) status();
        drawBg(g); drawSlots(g);
        const {cw, ch, S} = L, dragSet = new Set(drag && drag.moved ? drag.ids : []);
        const k = 1 - Math.exp(-dt * 15);
        const order = [];
        for (const pk of ['stock', 'waste', ...founds, ...tableaus]) if (P[pk]) for (const id of P[pk]) order.push(id);
        const flying = [], still = [];
        for (const id of order) {
          const v = vis[id], t = tgt[id];
          if (casc && casc.gone.has(id)) continue;
          if (v.x == null) { v.x = S.stock.x; v.y = S.stock.y; }
          if (!dragSet.has(id)) {
            if (v.wait > 0) v.wait -= dt;
            else { v.x += (t.x - v.x) * k; v.y += (t.y - v.y) * k; if (Math.abs(t.x - v.x) < .3 && Math.abs(t.y - v.y) < .3) { v.x = t.x; v.y = t.y; } }
          }
          if (v.ft >= 1 && v.vup !== up[id] && Math.abs(v.x - t.x) + Math.abs(v.y - t.y) < ch * .7) { v.from = v.vup; v.vup = up[id]; v.ft = 0; if (v.vup && !ctx.fast && !casc) ctx.sfx('flip'); }
          if (v.ft < 1) v.ft = Math.min(1, v.ft + dt * 7);
          if (v.sh > 0) v.sh = Math.max(0, v.sh - dt);
          if (dragSet.has(id)) continue;
          (Math.abs(v.x - t.x) + Math.abs(v.y - t.y) > 1.5 ? flying : still).push(id);
        }
        const drawCard = id => {
          const v = vis[id], face = v.ft < .5 ? v.from : v.vup, sx = v.ft < 1 ? Math.abs(Math.cos(v.ft * Math.PI)) : 1;
          const ox = v.sh > 0 ? Math.sin(v.sh * 60) * cw * .07 * (v.sh / .35) : 0;
          blit(g, id, face, v.x + ox, v.y, sx);
        };
        still.forEach(drawCard); flying.forEach(drawCard);
        if (dragSet.size) {
          const v0 = vis[drag.ids[0]];
          g.fillStyle = 'rgba(0,0,0,.22)'; D.rr(g, v0.x + cw * .08, v0.y + ch * .1, cw, (vis[drag.ids[drag.ids.length - 1]].y - v0.y) + ch, cw * .08); g.fill();
          drag.ids.forEach(drawCard);
        }
        if (SP) { const nd = founds.filter(f => P[f].length).length; if (nd) { const b = S.doneBox; D.text(g, nd + '/8', b.x + b.w - 4, b.y + b.h - 4, {size: Math.max(11, cw * .2), color: '#f0d590', align: 'right', base: 'bottom', stroke: 'rgba(0,0,0,.55)', strokeW: 3}); } }
        if (hint) {
          hint.t += dt; const a = .55 + .45 * Math.sin(hint.t * 9);
          if (hint.pk === 'stock') { const ng = SP ? Math.ceil(P.stock.length / 10) : 1; glow(g, S.stock.x + (SP ? S.stock.sdx * (ng - 1) : 0), S.stock.y, cw + (SP ? -S.stock.sdx * (ng - 1) : 0), ch + (SP ? S.stock.sdy * (ng - 1) : 0), a); }
          else {
            const ids = P[hint.pk].slice(hint.i);
            if (ids.length && tgt[ids[0]]) { const q = tgt[ids[0]], ql = tgt[ids[ids.length - 1]]; glow(g, q.x, q.y, cw, ql.y - q.y + ch, a); }
            const s = S[hint.to]; if (s) { const b = P[hint.to], q = b.length ? tgt[b[b.length - 1]] : s; glow(g, q.x, q.y, cw, ch, a * .8); }
          }
          if (hint.t > 2.4) hint = null;
        }
        if (casc) stepCascade(g, dt);
        fx.draw(g, dt);
      },
      key(e) {
        if (e.code === 'KeyZ') undo();
        else if (e.code === 'KeyH') showHint();
        else if (e.code === 'Space') { SP ? dealRow() : drawK(); }
      },
      destroy() { hideBanner(); },
      debug: {
        get P() { return P; }, get cards() { return cards; }, get up() { return up; }, get won() { return won; }, get moves() { return moves; },
        get L() { return L; }, tgt: () => tgt,
        nearWin(noAuto) {
          autoOff = !!noAuto; hideBanner();
          for (const pk in P) P[pk] = [];
          up = cards.map(() => true);
          if (!SP) {
            for (let s = 0; s < 4; s++) {
              const ids = cards.map((c, i) => i).filter(i => cards[i].s === s).sort((a, b) => cards[a].r - cards[b].r);
              P['f' + s] = ids.slice(0, 12); P['t' + s] = [ids[12]];
            }
          } else {
            const pool = cards.map((c, i) => i), su = NS === 1 ? [0] : NS === 2 ? [0, 1] : [0, 1, 2, 3];
            for (let k = 0; k < 8; k++) {
              const set = []; for (let r = 13; r >= 1; r--) { const j = pool.findIndex(i => cards[i].s === su[k % su.length] && cards[i].r === r); set.push(pool.splice(j, 1)[0]); }
              if (k < 7) P['d' + k] = set.reverse(); else { P.t0 = set.slice(0, 12); P.t1 = [set[12]]; }
            }
          }
          started = true; undoS = []; refreshBar();
        },
      },
    };
    return inst;
  },
});
