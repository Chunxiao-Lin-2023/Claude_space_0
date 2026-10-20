/* 彩牌接龙 — classic color-matching shedding card game (108 cards, 2–4 players). Table helpers from _cards_ddz.js. */
const D = BX.draw;
const COL = ['#c8372d', '#d9a12b', '#2f8a5b', '#2f5a9a'], CN = ['朱', '金', '翠', '靛'];
/* card table: id → [color 0..3 | 4 = wild, kind 0..9 number, 10 禁(跳过), 11 转(反转), 12 +2, 13 变色, 14 变色+4] */
const CARDS = [];
for (let c = 0; c < 4; c++) { CARDS.push([c, 0]); for (let k = 1; k <= 12; k++) CARDS.push([c, k], [c, k]); }
for (let i = 0; i < 4; i++) CARDS.push([4, 13]); for (let i = 0; i < 4; i++) CARDS.push([4, 14]);
const colOf = id => CARDS[id][0], kOf = id => CARDS[id][1];
const SYM = k => k < 10 ? String(k) : ['禁', '转', '+2', '变', '+4'][k - 10];
const pts = id => { const k = kOf(id); return k < 10 ? k : k < 13 ? 20 : 50; };
const KN = k => k < 10 ? String(k) : ['跳过', '反转', '加二', '变色', '变色加四'][k - 10];
const handSort = (a, b) => colOf(a) - colOf(b) || kOf(a) - kOf(b) || a - b;

function drawCard(g, x, y, w, h, id, o = {}) {
  const r = w * .1;
  g.save();
  if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = w * .09; g.shadowOffsetY = w * .035; }
  D.rr(g, x, y, w, h, r); g.fillStyle = '#fbf3e2'; g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.stroke();
  const m = w * .07, ix = x + m, iy = y + m, iw = w - 2 * m, ih = h - 2 * m;
  if (id == null) {
    const gr = g.createLinearGradient(ix, iy, ix + iw, iy + ih); gr.addColorStop(0, '#3a1a12'); gr.addColorStop(1, '#170806');
    g.fillStyle = gr; D.rr(g, ix, iy, iw, ih, r * .7); g.fill();
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-.5);
    g.fillStyle = '#b23a2b'; g.beginPath(); g.ellipse(0, 0, iw * .44, ih * .3, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e6c57d'; g.lineWidth = Math.max(1, w * .03); g.stroke(); g.restore();
    D.text(g, '接龙', x + w / 2, y + h / 2, {size: w * .25, color: '#ffe7a8', font: 'deco', weight: 400, stroke: 'rgba(60,15,5,.8)', strokeW: w * .04});
    g.restore(); return;
  }
  const c = colOf(id), k = kOf(id), wild = c === 4;
  if (wild) { g.fillStyle = '#1d1712'; } else { const gr = g.createLinearGradient(ix, iy, ix, iy + ih); gr.addColorStop(0, D.shade(COL[c], 12)); gr.addColorStop(1, D.shade(COL[c], -14)); g.fillStyle = gr; }
  D.rr(g, ix, iy, iw, ih, r * .7); g.fill();
  // centre oval
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-.5);
  if (wild) {
    for (let q = 0; q < 4; q++) { g.fillStyle = COL[q]; g.beginPath(); g.moveTo(0, 0); g.ellipse(0, 0, iw * .44, ih * .32, 0, q * Math.PI / 2, (q + 1) * Math.PI / 2); g.closePath(); g.fill(); }
    g.strokeStyle = '#fbf3e2'; g.lineWidth = Math.max(1.5, w * .035); g.beginPath(); g.ellipse(0, 0, iw * .44, ih * .32, 0, 0, Math.PI * 2); g.stroke();
  } else { g.fillStyle = '#fbf3e2'; g.beginPath(); g.ellipse(0, 0, iw * .44, ih * .32, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
  const s = SYM(k), big = s.length > 1 ? w * .36 : w * .5;
  const fc = wild ? '#fff8ea' : COL[c];
  if (k === 11) { // 转: two curved arrows
    g.save(); g.translate(x + w / 2, y + h / 2); g.strokeStyle = fc; g.fillStyle = fc; g.lineWidth = w * .07; g.lineCap = 'round';
    for (const a0 of [0, Math.PI]) { g.beginPath(); g.arc(0, 0, w * .17, a0 + .3, a0 + 2.5); g.stroke(); const ax = Math.cos(a0 + 2.5) * w * .17, ay = Math.sin(a0 + 2.5) * w * .17; g.save(); g.translate(ax, ay); g.rotate(a0 + 2.5 + Math.PI / 2); g.beginPath(); g.moveTo(w * .07, 0); g.lineTo(-w * .05, -w * .06); g.lineTo(-w * .05, w * .06); g.closePath(); g.fill(); g.restore(); }
    g.restore();
  } else if (k === 10) { // 禁: circle with bar + glyph
    g.save(); g.strokeStyle = fc; g.lineWidth = w * .06; D.circle(g, x + w / 2, y + h / 2, w * .2); g.stroke();
    g.beginPath(); g.moveTo(x + w / 2 - w * .14, y + h / 2 + w * .14); g.lineTo(x + w / 2 + w * .14, y + h / 2 - w * .14); g.stroke(); g.restore();
  } else D.text(g, s, x + w / 2, y + h / 2 + w * .02, {size: big, color: fc, font: k === 13 ? 'deco' : 'sans', weight: 900, stroke: wild ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.0)', strokeW: wild ? w * .05 : 0});
  if (k === 6 || k === 9) { g.fillStyle = fc; g.fillRect(x + w / 2 - w * .1, y + h / 2 + big * .38, w * .2, Math.max(1.5, w * .03)); }
  // corners
  const cs = s.length > 1 ? w * .2 : w * .26, cc = k === 10 ? '禁' : k === 11 ? '转' : s;
  D.text(g, cc, ix + w * .13, iy + cs * .62, {size: cs, color: '#fff8ea', weight: 900, stroke: 'rgba(0,0,0,.45)', strokeW: Math.max(1.5, w * .03)});
  if (!o.mini) { g.save(); g.translate(ix + iw - w * .13, iy + ih - cs * .62); g.rotate(Math.PI); D.text(g, cc, 0, 0, {size: cs, color: '#fff8ea', weight: 900, stroke: 'rgba(0,0,0,.45)', strokeW: Math.max(1.5, w * .03)}); g.restore(); }
  if (o.sel) { g.lineWidth = Math.max(2.5, w * .05); g.strokeStyle = o.sel; D.rr(g, x - 1, y - 1, w + 2, h + 2, r); g.stroke(); }
  if (o.dim) { g.fillStyle = 'rgba(20,10,5,.38)'; D.rr(g, x, y, w, h, r); g.fill(); }
  g.restore();
}

BX.register({
  id: 'uno', title: '彩牌接龙', cat: 'cards', order: 3, sub: '同色同号接龙，先出完者胜',
  desc: '朱、金、翠、靛四色彩牌，同色或同号即可接上，禁、转、+2、变色、变色+4 搅局。剩一张记得「喊一张」！',
  kind: 'turn', seats: [2, 4], defSeats: 2, hidden: true, firstLabel: '座位', aiDelay: 600, anyTimeActs: true,
  seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'],
  rules: `<p><b>牌组</b>：共 108 张。朱、金、翠、靛四色，每色 0 一张、1～9 各两张，以及功能牌「禁」（跳过）、「转」（反转）、「+2」各两张；另有黑色「变色」4 张、「变色+4」4 张。</p>
<p><b>开局</b>：每人 7 张，翻开一张作为起始牌（翻到黑牌则放回重翻；翻到功能牌时其效果对第一位出牌者生效）。</p>
<p><b>出牌</b>：轮到你时，出一张与弃牌堆顶<b>同色</b>或<b>同数字/同符号</b>的牌，或任意一张黑牌。没有可出的牌（或不想出）就<b>摸一张</b>；摸到的牌若能出，可以立刻打出，否则轮到下家。</p>
<p><b>功能牌</b>：<b>禁</b>：下家被跳过；<b>转</b>：出牌方向反转（两人对局时等同于「禁」）；<b>+2</b>：下家摸 2 张并跳过；<b>变色</b>：任意时候可出，由你指定接下来的颜色；<b>变色+4</b>：指定颜色，下家摸 4 张并跳过——只有当你手中<b>没有当前颜色</b>的牌时才能出（本版不设质疑）。</p>
<p><b>喊一张</b>：出完牌后手里只剩一张时，要按「喊一张」。可以在出倒数第二张牌之前先按（按钮会亮起），也可以出完后、下家行动前补喊。下家行动前还没喊，罚摸 2 张。</p>
<p><b>胜负</b>：最先出完手牌者赢得本局，得分为其他玩家手中剩余牌的点数之和（数字牌按面值，禁/转/+2 各 20 分，黑牌各 50 分）。</p>
<p><b>操作</b>：点一下选中（抬起），再点一次或按「出牌」打出；出黑牌时选择颜色。灰暗的牌表示现在不能出。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#4a1f14', '#1f0c06');
    const ids = [CARDS.findIndex(c => c[0] === 0 && c[1] === 7), CARDS.findIndex(c => c[0] === 1 && c[1] === 12), CARDS.findIndex(c => c[0] === 2 && c[1] === 11), CARDS.findIndex(c => c[0] === 3 && c[1] === 10), 104];
    const cw = h * .42, chh = cw * 1.5;
    ids.forEach((id, i) => { g.save(); g.translate(w / 2 + (i - 2) * cw * .45, h * 1.02); g.rotate((i - 2) * .2); drawCard(g, -cw / 2, -chh - h * .12, cw, chh, id, {}); g.restore(); });
    for (let q = 0; q < 4; q++) { g.fillStyle = COL[q]; g.beginPath(); g.moveTo(w * .13, h * .2); g.arc(w * .13, h * .2, h * .11, q * Math.PI / 2, (q + 1) * Math.PI / 2); g.closePath(); g.fill(); }
  },
  create(ctx) {
    const U = BX.data.ddz.ui, N = ctx.n;
    const st = {ph: 'deal', hands: [], pile: [], disc: [], col: 0, dir: 1, turn: 0, drawn: -1, unoP: -1, lack: [], said: [], ev: null, res: null, seq: 0, moves: 0};
    const cv = ctx.canvas();
    const ui = {dealT: 1, sel: -1, pick: -1, unoArm: false, fx: [], fly: null, t: 0, btns: [], lay: null, shake: 0, petals: []};
    const nxt = (s, k = 1) => ((s + st.dir * k) % N + N) % N;
    const top = () => st.disc[st.disc.length - 1];
    /* ---------- rules ---------- */
    function canPlay(seat, id) {
      const c = colOf(id), k = kOf(id), t = top(), tk = kOf(t);
      if (st.drawn >= 0 && id !== st.drawn) return false;
      if (k === 13) return true;
      if (k === 14) return !st.hands[seat].some(i => i !== id && colOf(i) === st.col);
      return c === st.col || (tk < 13 && k === tk);
    }
    const playable = seat => st.hands[seat].filter(id => canPlay(seat, id));
    function drawN(seat, n) {
      const got = [];
      for (let i = 0; i < n; i++) {
        if (!st.pile.length) {
          if (st.disc.length <= 1) break;
          const t = st.disc.pop(); st.pile = ctx.rng.shuffle(st.disc); st.disc = [t];
          if (!ctx.fast) ctx.toast('牌堆用完，弃牌洗回');
        }
        const id = st.pile.pop(); st.hands[seat].push(id); got.push(id);
      }
      st.hands[seat].sort(handSort); return got;
    }
    function deal() {
      const deck = ctx.rng.shuffle(BX.range(108));
      for (let s = 0; s < N; s++) { st.hands[s] = deck.splice(0, 7).sort(handSort); st.lack[s] = 0; st.said[s] = 0; }
      // starting card: never a black card
      let i = deck.length - 1; while (colOf(deck[i]) === 4) i--;
      const start = deck.splice(i, 1)[0]; st.pile = deck; st.disc = [start]; st.col = colOf(start);
      const dealer = ctx.rng.int(N); st.dir = 1; st.turn = nxt(dealer);
      const k = kOf(start);
      if (k === 10) st.turn = nxt(dealer, 2);
      else if (k === 11) { if (N === 2) st.turn = nxt(dealer, 2); else { st.dir = -1; st.turn = dealer; } }
      else if (k === 12) { const v = nxt(dealer); drawN(v, 2); st.turn = nxt(dealer, 2); }
      st.startK = k;
      ui.dealT = 0; ctx.anim(1100, kk => ui.dealT = kk, null, BX.ease.out); ctx.sfx('shuffle'); ctx.after(400, () => ctx.sfx('deal'));
    }
    function fx(text, color, big) { if (ctx.fast) return; const e = {text, color, big, k: 0}; ui.fx.push(e); ctx.anim(big ? 1100 : 900, k => e.k = k, () => ui.fx.splice(ui.fx.indexOf(e), 1), x => x); }
    function finish(w) {
      st.ph = 'over'; let score = 0; const det = [];
      for (let s = 0; s < N; s++) if (s !== w) { const p = st.hands[s].reduce((a, id) => a + pts(id), 0); score += p; det.push(ctx.name(s) + ' 余' + st.hands[s].length + '张 ' + p + '分'); }
      st.res = {w, score};
      ctx.sfx('gong');
      ctx.end({winner: w, text: ctx.name(w) + ' 率先出完，得 ' + score + ' 分（' + det.join('，') + '）', delay: 1300});
    }
    function apply(a, by) {
      st.seq++;
      if (a.t === 'go') { st.ph = 'play'; if (st.startK >= 10) fx(KN(st.startK), '#ffe2a0'); return; }
      if (a.t === 'uno') { if (st.unoP === by) { st.unoP = -1; st.said[by] = 1; ctx.sfx('bell'); fx(ctx.name(by) + '：喊一张！', '#ffd76a'); } return; }
      // the next player is acting: anyone who reached one card without calling gets caught
      if (st.unoP >= 0 && st.unoP !== by) {
        const p = st.unoP; st.unoP = -1;
        if (st.hands[p].length === 1) { drawN(p, 2); ctx.sfx('buzz'); fx(ctx.name(p) + ' 忘喊一张，罚摸 2', '#ff9a7a'); }
      }
      st.moves++;
      if (a.t === 'draw') {
        st.lack[by] |= 1 << st.col;
        const got = drawN(by, 1); ctx.sfx('flip'); st.ev = {k: 'draw', s: by, n: got.length, q: st.seq};
        if (!ctx.fast && got.length) { ui.fly = {draw: true, seat: by, id: got[0], k: 0}; ctx.anim(300, k => { if (ui.fly) ui.fly.k = k; }, () => ui.fly = null, BX.ease.out); }
        if (got.length && canPlay(by, got[0])) { st.drawn = got[0]; if (by === ctx.view) ui.sel = got[0]; }
        else { st.drawn = -1; st.turn = nxt(by); }
        if (st.moves > 2000) finish(st.hands.reduce((b, h, s) => h.length < st.hands[b].length ? s : b, 0));
        return;
      }
      if (a.t === 'keep') { st.drawn = -1; st.turn = nxt(by); st.ev = {k: 'keep', s: by, q: st.seq}; ctx.sfx('tick'); return; }
      if (a.t === 'play') {
        const id = a.id, hand = st.hands[by];
        if (!hand.includes(id) || !canPlay(by, id)) throw new Error('illegal ' + JSON.stringify(a));
        if (!ctx.fast) {
          let from = null;
          if (by === ctx.view && ui.lay) { const j = ui.lay.ids.indexOf(id), r = ui.lay.hand.rects[j]; if (r) from = {x: r.x, y: r.y - (ui.sel === id ? ui.lay.raise : 0), w: r.w}; }
          ui.fly = {seat: by, id, from, k: 0, rot: (Math.random() - .5) * .5}; ctx.anim(280, k => { if (ui.fly) ui.fly.k = k; }, () => ui.fly = null, BX.ease.out);
        }
        hand.splice(hand.indexOf(id), 1); st.disc.push(id); st.drawn = -1;
        const k = kOf(id);
        st.col = k >= 13 ? (a.col | 0) & 3 : colOf(id);
        st.lack[by] &= ~(1 << st.col);
        if (by === ctx.view) { ui.sel = -1; ui.pick = -1; }
        ctx.sfx('card');
        st.ev = {k: 'play', s: by, q: st.seq};
        if (hand.length === 1) { if (a.uno) { st.said[by] = 1; ctx.sfx('bell'); fx(ctx.name(by) + '：喊一张！', '#ffd76a'); } else st.unoP = by; }
        if (by === ctx.view) ui.unoArm = false;
        let next = nxt(by);
        if (k === 10) { fx('禁！' + ctx.name(next) + ' 跳过', '#ffe2a0'); next = nxt(by, 2); }
        else if (k === 11) { st.dir = -st.dir; fx(N === 2 ? '转！再出一手' : '转！方向反转', '#ffe2a0'); next = N === 2 ? by : nxt(by); ctx.sfx('whoosh'); }
        else if (k === 12) { drawN(next, 2); fx(ctx.name(next) + ' 摸 2 张', '#ff9a7a'); next = nxt(by, 2); ctx.sfx('hit'); }
        else if (k === 13) { fx('变色 · ' + CN[st.col], COL[st.col]); }
        else if (k === 14) { drawN(next, 4); fx('变色+4 · ' + CN[st.col] + '！', COL[st.col], true); next = nxt(by, 2); ui.shake = 1; ctx.sfx('boom'); }
        if (!hand.length) { finish(by); return; }
        st.turn = next;
      }
    }
    /* ---------- AI ---------- */
    function aiColor(seat, without, level) {
      const cnt = [0, 0, 0, 0];
      for (const id of st.hands[seat]) if (id !== without && colOf(id) < 4) cnt[colOf(id)] += 1 + (kOf(id) >= 10 ? .3 : 0);
      if (level >= 3) { const v = nxt(seat); for (let c = 0; c < 4; c++) if (st.lack[v] & (1 << c)) cnt[c] += 1.2; }
      let best = 0; for (let c = 1; c < 4; c++) if (cnt[c] > cnt[best]) best = c;
      if (level === 1 && Math.random() < .5) best = Math.floor(Math.random() * 4);
      return best;
    }
    function aiMove(seat, level) {
      if (st.unoP === seat) return {t: 'uno'};
      const pl = playable(seat), hand = st.hands[seat];
      if (!pl.length) return st.drawn >= 0 ? {t: 'keep'} : {t: 'draw'};
      const callUno = hand.length === 2 && (level >= 2 || Math.random() < .6);
      let pick;
      if (level === 1) {
        if (st.drawn < 0 && Math.random() < .08) return {t: 'draw'};
        pick = pl[Math.floor(Math.random() * pl.length)];
      } else {
        const v = nxt(seat), vn = st.hands[v].length, prev = nxt(seat, -1);
        const myCnt = [0, 0, 0, 0]; for (const id of hand) if (colOf(id) < 4) myCnt[colOf(id)]++;
        const minOpp = Math.min(...BX.range(N).filter(s => s !== seat).map(s => st.hands[s].length));
        const sc = pl.map(id => {
          const c = colOf(id), k = kOf(id); let s = 0;
          if (k < 10) s += 10 + k * .8;
          else if (k < 13) s += 12 + (vn <= 2 ? 40 : vn <= 4 ? 8 : -2);
          if (k === 11 && N > 2) s += st.hands[prev].length > vn ? 6 : -6;
          if (k >= 13) s += minOpp <= 2 || hand.length <= 2 ? 30 : -25;
          if (k === 14) s += vn <= 3 ? 25 : -10;
          if (c < 4) s += myCnt[c] * 2.2;                 // keep playing my long colour
          if (level >= 3) {
            if (c < 4 && (st.lack[v] & (1 << c))) s += 9;   // next player drew on this colour before
            if (k < 10 && c < 4 && myCnt[c] === 1 && hand.length > 3) s -= 3;
            if (hand.length === 2 && k >= 10 && k < 13) s += 15;  // finish strong
          }
          return [id, s + Math.random() * (level === 2 ? 4 : 1)];
        });
        sc.sort((a, b) => b[1] - a[1]); pick = sc[0][0];
      }
      const a = {t: 'play', id: pick};
      if (kOf(pick) >= 13) a.col = aiColor(seat, pick, level);
      if (callUno) a.uno = 1;
      return a;
    }
    /* ---------- layout ---------- */
    const rel = s => (s - ctx.view + N) % N;
    function layout() {
      const w = cv.w, h = cv.h, portrait = h > w * 1.1, pad = Math.max(8, Math.min(w, h) * .025);
      const cw = portrait ? BX.clamp(w / 6.2, 48, 86) : BX.clamp(Math.min(w / 12.5, h / 4.4), 44, 94), ch = cw * 1.5;
      const ids = st.hands[ctx.view] || [];
      let showIds = ids; if (st.ph === 'deal') showIds = ids.slice(0, Math.floor(ui.dealT * 7.99));
      const hand = U.handRects(showIds.length, pad, w - pad, h - pad * .7, cw, ch, portrait);
      if (!showIds.length) hand.top = h - pad - ch;
      const bh = BX.clamp(cw * .56, 44, 52), btnY = hand.top - bh - 12 - cw * .14;
      const PW = BX.clamp(w * (portrait ? .3 : .15), 104, 170), PH = BX.clamp(PW * .4, 46, 62);
      const seats = [], opp = BX.range(N - 1);
      for (let s = 0; s < N; s++) {
        const r = rel(s); if (!r) { seats[s] = null; continue; }
        let x, y;
        if (portrait) { const k = N - 1, gw = (w - 2 * pad - PW) / Math.max(1, k - 1); x = k === 1 ? w / 2 - PW / 2 : pad + (r - 1) * gw; y = pad + (k === 3 && r === 2 ? 0 : k === 3 ? PH * .25 : 0); }
        else if (N === 2) { x = w / 2 - PW / 2; y = pad; }
        else if (N === 3) { x = r === 1 ? pad : w - pad - PW; y = h * .12; }
        else { x = r === 1 ? pad : r === 2 ? w / 2 - PW / 2 : w - pad - PW; y = r === 2 ? pad : h * .18; }
        seats[s] = {x, y};
      }
      // the centre (pile + ring) sits between the opponents above it and my buttons
      let topLim = pad;
      for (const sp of seats) if (sp && (portrait || Math.abs(sp.x + PW / 2 - w / 2) < w * .25)) topLim = Math.max(topLim, sp.y + PH + 8 + cw * .75 + 22);
      const avail = btnY - topLim, pw = BX.clamp(Math.min(cw * .95, avail * .62 / 1.5), 30, cw), cy = topLim + avail / 2;
      return {w, h, portrait, pad, cw, ch, ids: showIds, hand, raise: ch * .16, bh, btnY, PW, PH, seats, cx: w / 2, cy, opp, pw, avail};
    }
    /* ---------- input ---------- */
    const myTurn = () => st.ph === 'play' && ctx.canAct(st.turn);
    const meIdx = () => ctx.view;
    function buttons(lay) {
      const out = [], me = meIdx();
      if (st.ph !== 'play') return out;
      const late = st.unoP === me && ctx.isLocal(me) && !BX.bot;
      if (myTurn()) {
        const defs = [];
        if (st.drawn >= 0) defs.push({label: '不出', kind: 'ghost', act: 'keep'});
        else defs.push({label: '摸牌', kind: 'ghost', act: 'draw'});
        if (st.hands[me].length === 2) defs.push({label: ui.unoArm ? '已喊 ✓' : '喊一张', kind: ui.unoArm ? 'jade' : 'gold', act: 'arm'});
        if (late) defs.push({label: '喊一张！', kind: 'gold', act: 'late'});
        defs.push({label: '出牌', kind: 'red', dis: !(ui.sel >= 0 && canPlay(me, ui.sel)), act: 'play'});
        return U.row(defs, lay.w / 2, lay.btnY, lay.bh, Math.min(lay.w - 2 * lay.pad, 420));
      }
      if (late) return U.row([{label: '喊一张！', kind: 'red', act: 'late'}], lay.w / 2, lay.btnY, lay.bh, 200);
      return out;
    }
    function playSel() {
      const me = meIdx(), id = ui.sel; if (id < 0 || !canPlay(me, id)) return;
      if (kOf(id) >= 13) { ui.pick = id; ctx.sfx('select'); return; }
      send({t: 'play', id, uno: st.hands[me].length === 2 && ui.unoArm ? 1 : 0});
    }
    function send(a) { if (!a.uno) delete a.uno; ctx.sfx('click'); ctx.act(a, meIdx()); }
    function press(b) {
      if (b.act === 'draw') send({t: 'draw'});
      else if (b.act === 'keep') send({t: 'keep'});
      else if (b.act === 'arm') { ui.unoArm = !ui.unoArm; ctx.sfx(ui.unoArm ? 'bell' : 'tick'); }
      else if (b.act === 'play') playSel();
      else if (b.act === 'late') { ctx.sfx('click'); ctx.act({t: 'uno'}, meIdx()); }
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e), lay = ui.lay; if (!lay) return;
      if (ui.pick >= 0) {
        const hit = ui.petals.find(q => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 <= q.r * q.r);
        if (hit && myTurn()) { const me = meIdx(); send({t: 'play', id: ui.pick, col: hit.c, uno: st.hands[me].length === 2 && ui.unoArm ? 1 : 0}); }
        ui.pick = -1; return;
      }
      const b = U.hitBtn(ui.btns, p); if (b) { b.down = true; press(b); return; }
      if (st.ph !== 'play') return;
      const i = U.hitHand(lay.hand.rects, p, j => lay.ids[j] === ui.sel ? lay.raise : 0);
      if (i < 0) { ui.sel = -1; return; }
      const id = lay.ids[i], me = meIdx();
      if (!myTurn()) { ui.sel = ui.sel === id ? -1 : id; ctx.sfx('tick'); return; }
      if (!canPlay(me, id)) { ctx.sfx('error'); ui.sel = id; ui.bad = {id, t: .35}; return; }
      if (ui.sel === id) playSel(); else { ui.sel = id; ctx.sfx('select'); }
    });
    /* ---------- status ---------- */
    function status() {
      for (let s = 0; s < N; s++) ctx.info(s, st.ph === 'deal' ? '' : st.hands[s].length + '张');
      if (st.ph === 'over') { ctx.status(ctx.name(st.res.w) + ' 出完了！'); return; }
      if (st.ph === 'deal') { ctx.status('洗牌发牌中…'); return; }
      const c = '<b style="color:' + D.shade(COL[st.col], 25) + '">' + CN[st.col] + '色</b>';
      if (myTurn()) ctx.status((ctx.hotseat ? ctx.name(st.turn) + '：' : '') + (st.drawn >= 0 ? '摸到能出的牌，出还是不出？' : '轮到你 · 当前 ' + c));
      else ctx.status('等待 ' + ctx.name(st.turn) + ' · 当前 ' + c);
    }
    /* ---------- drawing ---------- */
    function frame(dt) {
      const g = cv.g; cv.clear(); ui.t += dt;
      const lay = ui.lay = layout(), {w, h, cw, ch, cx, cy} = lay, me = meIdx();
      g.save();
      if (ui.shake > 0) { ui.shake = Math.max(0, ui.shake - dt * 2.4); const a = ui.shake * 6; g.translate((Math.random() - .5) * a, (Math.random() - .5) * a); }
      U.table(g, w, h, '#6b2a22');
      // colour ring + direction arrows
      const R = Math.min(lay.pw * 1.85, w * .3, lay.avail * .5);
      g.save(); g.globalAlpha = .9; g.strokeStyle = COL[st.col]; g.lineWidth = Math.max(5, R * .08); g.shadowColor = COL[st.col]; g.shadowBlur = 16;
      D.circle(g, cx, cy, R); g.stroke(); g.restore();
      g.save(); g.translate(cx, cy); g.rotate(ui.t * .6 * st.dir);
      g.fillStyle = 'rgba(255,240,210,.75)';
      for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; g.save(); g.rotate(a); g.translate(R, 0); g.rotate(st.dir > 0 ? 0 : Math.PI); g.beginPath(); g.moveTo(0, R * .1); g.lineTo(-R * .07, -R * .02); g.lineTo(R * .07, -R * .02); g.closePath(); g.fill(); g.restore(); }
      g.restore();
      // draw pile & discard
      const pw = lay.pw, ph = pw * 1.5, px = cx - pw - pw * .2, py = cy - ph / 2, dx = cx + pw * .2;
      const pileN = Math.min(6, Math.ceil(st.pile.length / 15));
      for (let i = 0; i < pileN; i++) drawCard(g, px - i * 1.4, py - i * 1.4, pw, ph, null, {shadow: i === pileN - 1});
      if (myTurn() && st.drawn < 0 && !playable(me).length) { g.strokeStyle = `rgba(255,215,106,${.5 + .5 * Math.sin(ui.t * 6)})`; g.lineWidth = 3; D.rr(g, px - pileN * 1.4 - 3, py - pileN * 1.4 - 3, pw + 6, ph + 6, pw * .12); g.stroke(); }
      D.text(g, st.pile.length + '', px + pw / 2, py + ph + 11, {size: BX.clamp(cw * .2, 11, 14), color: 'rgba(243,226,192,.7)'});
      const nd = st.disc.length, flying = ui.fly && !ui.fly.draw ? ui.fly : null;
      for (let i = Math.max(0, nd - 4); i < nd; i++) {
        const id = st.disc[i]; if (flying && i === nd - 1) continue;
        const rot = (((id * 37 + i * 11) % 13) - 6) * .03;
        g.save(); g.translate(dx + pw / 2, cy); g.rotate(rot); drawCard(g, -pw / 2, -ph / 2, pw, ph, id, {}); g.restore();
      }
      if (flying) {
        const k = flying.k, sp = flying.from || seatAnchor(lay, flying.seat), ww = BX.lerp(sp.w || pw * .6, pw, k);
        const x = BX.lerp(sp.x, dx, k), y = BX.lerp(sp.y, cy - ph / 2, k);
        g.save(); g.translate(x + ww / 2, y + ww * .75); g.rotate(flying.rot * k); drawCard(g, -ww / 2, -ww * .75, ww, ww * 1.5, flying.id, {}); g.restore();
      }
      if (ui.fly && ui.fly.draw) {
        const k = ui.fly.k, to = rel(ui.fly.seat) === 0 ? {x: w / 2, y: lay.hand.top} : seatAnchor(lay, ui.fly.seat);
        drawCard(g, BX.lerp(px, to.x, k), BX.lerp(py, to.y, k), pw * (1 - .3 * k), ph * (1 - .3 * k), null, {});
      }
      // deal flying backs
      if (st.ph === 'deal' && ui.dealT < 1) {
        const f = (ui.dealT * 7 * N) % 1, s = Math.floor(ui.dealT * 7 * N) % N, to = rel(s) === 0 ? {x: w / 2, y: lay.hand.top} : seatAnchor(lay, s);
        drawCard(g, BX.lerp(px, to.x, f), BX.lerp(py, to.y, f), pw * .8, ph * .8, null, {});
      }
      // opponents
      for (let s = 0; s < N; s++) {
        const sp = lay.seats[s]; if (!sp) continue;
        const n = st.ph === 'deal' ? Math.min(st.hands[s].length, Math.floor(ui.dealT * 7.99)) : st.hands[s].length;
        // fan of backs under the plaque
        const bw = cw * .5, bhh = bw * 1.5, k = Math.min(n, 12), step = Math.min(bw * .35, (lay.PW - bw) / Math.max(1, k - 1));
        const fx0 = sp.x + lay.PW / 2 - (bw + step * (k - 1)) / 2, fy = sp.y + lay.PH + 6;
        if (st.ph !== 'over') for (let i = 0; i < k; i++) drawCard(g, fx0 + i * step, fy, bw, bhh, null, {shadow: false});
        else { const pos = U.fanPos(n, sp.x + lay.PW / 2, fy, bw * 1.1, bhh * 1.1, 'c', Math.max(lay.PW, cw * 3)); st.hands[s].forEach((id, i) => drawCard(g, pos[i].x, pos[i].y, bw * 1.1, bhh * 1.1, id, {shadow: false})); }
        U.plaque(g, sp.x, sp.y, lay.PW, lay.PH, {name: ctx.name(s), color: ctx.color(s), active: st.turn === s && st.ph === 'play', count: n, alarm: st.ph === 'play' && n === 1, t: ui.t, sub: ctx.isAI(s) ? BX.LEVELS[ctx.level(s)] : ''});
        if (st.ph === 'play' && st.ev && st.ev.s === s && (st.ev.k === 'draw' || st.ev.k === 'keep') && st.turn !== s) U.bubble(g, sp.x + lay.PW / 2, fy + bhh + 16, st.ev.k === 'draw' ? '摸牌' : '不出', BX.clamp(cw * .22, 12, 16));
        if (st.turn === s && st.ph === 'play') { const t = ui.t; for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(255,230,170,${.35 + .65 * Math.max(0, Math.sin(t * 5 - i * .8))})`; D.circle(g, sp.x + lay.PW / 2 + (i - 1) * 11, fy + bhh + 14, 3.5); g.fill(); } }
      }
      // my hand
      const mineN = st.hands[me] ? st.hands[me].length : 0;
      if (st.ph !== 'deal') D.text(g, mineN + ' 张' + (mineN === 1 ? (st.said[me] ? ' · 已喊' : '') : ''), lay.pad + 4, lay.btnY + lay.bh / 2, {size: BX.clamp(cw * .22, 12, 16), color: mineN === 1 ? '#ff9a7a' : '#f3e2c0', align: 'left', shadow: true, maxW: lay.portrait ? 60 : 120});
      const mt = myTurn();
      if (ui.bad) { ui.bad.t -= dt; if (ui.bad.t <= 0) ui.bad = null; }
      lay.hand.rects.forEach((r, i) => {
        const id = lay.ids[i], sel = ui.sel === id, ok = mt && canPlay(me, id);
        let x = r.x; if (ui.bad && ui.bad.id === id) x += Math.sin(ui.bad.t * 60) * 4;
        drawCard(g, x, r.y - (sel ? lay.raise : 0) - (ok && !sel ? lay.raise * .18 : 0), r.w, r.h, id, {sel: sel ? '#ffd76a' : false, dim: mt && !ok});
      });
      // buttons
      ui.btns = buttons(lay); for (const b of ui.btns) U.btn(g, b);
      if (mt && ui.sel >= 0 && canPlay(me, ui.sel) && lay.ids.includes(ui.sel)) D.text(g, '再点一下或按「出牌」', w / 2, lay.btnY - 12, {size: BX.clamp(cw * .2, 11, 14), color: '#ffe9a8', shadow: true});
      // fx
      for (const e of ui.fx) {
        const a = e.k < .15 ? e.k / .15 : e.k > .75 ? (1 - e.k) / .25 : 1, sc = e.big ? 1 + (1 - Math.min(1, e.k * 4)) * .5 : 1;
        g.save(); g.globalAlpha = a; g.translate(cx, cy - R - 10 - e.k * 16); g.scale(sc, sc);
        D.text(g, e.text, 0, 0, {size: Math.min(w * .07, 30) * (e.big ? 1.4 : 1), color: e.color, font: 'deco', weight: 400, stroke: 'rgba(40,10,5,.9)', strokeW: 5});
        g.restore();
      }
      if (st.ph === 'over' && st.res) U.bubble(g, cx, cy + R + 22, ctx.name(st.res.w) + ' 获胜 · ' + st.res.score + ' 分', BX.clamp(cw * .3, 15, 22), {bg: 'rgba(178,58,43,.95)', color: '#fff3e0'});
      // colour picker
      ui.petals = [];
      if (ui.pick >= 0) {
        g.fillStyle = 'rgba(15,8,3,.6)'; g.fillRect(0, 0, w, h);
        const pr = Math.min(w, h) * .15, ox = w / 2, oy = h * .45;
        D.text(g, '选择颜色', ox, oy - pr * 2.25, {size: Math.min(26, w * .07), color: '#f3e2c0', font: 'deco', weight: 400});
        for (let c = 0; c < 4; c++) {
          const x = ox + (c % 2 ? 1 : -1) * pr * 1.08, y = oy + (c < 2 ? -1 : 1) * pr * 1.08;
          D.disc(g, x, y, pr, COL[c], {ring: 'rgba(255,240,210,.6)'});
          D.text(g, CN[c], x, y + 2, {size: pr * .8, color: '#fff8ea', font: 'serif', weight: 900});
          ui.petals.push({x, y, r: pr, c});
        }
        D.text(g, '点空白处取消', ox, oy + pr * 2.45, {size: 13, color: 'rgba(243,226,192,.7)'});
      }
      g.restore();
    }
    function seatAnchor(lay, s) { const sp = lay.seats[s]; return sp ? {x: sp.x + lay.PW / 2 - lay.cw * .3, y: sp.y + lay.PH, w: lay.cw * .5} : {x: lay.w / 2, y: lay.hand.top, w: lay.cw}; }
    deal();
    return {
      st,
      toMove: () => st.ph === 'play' ? st.turn : null,
      sysMove: () => st.ph === 'deal' ? {a: {t: 'go'}, delay: 1200} : null,
      valid(a, by) {
        if (st.ph !== 'play') return false;
        if (a.t === 'uno') return st.unoP === by;
        if (by !== st.turn) return false;
        if (a.t === 'draw') return st.drawn < 0;
        if (a.t === 'keep') return st.drawn >= 0;
        if (a.t === 'play') return Number.isInteger(a.id) && st.hands[by].includes(a.id) && canPlay(by, a.id) && (kOf(a.id) < 13 || (Number.isInteger(a.col) && a.col >= 0 && a.col < 4));
        return false;
      },
      apply, aiMove, onTurn: status,
      onView() { ui.sel = -1; ui.pick = -1; ui.unoArm = false; },
      key(e) {
        if (!myTurn()) return;
        if (e.code === 'Enter') playSel();
        else if (e.code === 'Space' || e.code === 'KeyD') press({act: st.drawn >= 0 ? 'keep' : 'draw'});
        else if (e.code === 'KeyU') press({act: 'arm'});
      },
      frame,
    };
  },
});
