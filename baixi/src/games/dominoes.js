/* 多米诺骨牌 — classic double-six Draw game (2–4 players). */
const D = BX.draw, C = BX.C, h = BX.h;
const TILES = []; for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) TILES.push([a, b]);
const pipsOf = id => TILES[id][0] + TILES[id][1];
const isDbl = id => TILES[id][0] === TILES[id][1];
const PIP = {0: [], 1: [[.5, .5]], 2: [[.25, .25], [.75, .75]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.25, .25], [.75, .25], [.25, .75], [.75, .75]],
  5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.25, .22], [.75, .22], [.25, .5], [.75, .5], [.25, .78], [.75, .78]]};
const PIPCOL = ['#000', '#1b1510', '#1b1510', '#1b1510', '#1b1510', '#1b1510', '#1b1510'];

/* draw a tile in rect (x,y,w,h). if w>=h horizontal: v[0] left, v[1] right; else v[0] top, v[1] bottom. */
function tile(g, x, y, w, h, v, o = {}) {
  const r = Math.min(w, h) * .14;
  g.save();
  if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = Math.min(w, h) * .18; g.shadowOffsetY = Math.min(w, h) * .08; }
  D.rr(g, x, y, w, h, r);
  if (!v) {
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#9a3a2a'); gr.addColorStop(1, '#6b2318'); g.fillStyle = gr; g.fill();
    g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(243,226,192,.55)'; g.lineWidth = Math.max(1, Math.min(w, h) * .06);
    D.rr(g, x + Math.min(w, h) * .14, y + Math.min(w, h) * .14, w - Math.min(w, h) * .28, h - Math.min(w, h) * .28, r * .6); g.stroke();
    D.text(g, '戏', x + w / 2, y + h / 2, {size: Math.min(w, h) * .5, color: 'rgba(243,226,192,.8)', font: 'deco', weight: 400});
    g.restore(); return;
  }
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, o.dim ? '#cfc6b2' : '#fffaf0'); gr.addColorStop(1, o.dim ? '#b9ae96' : '#e9dcc0');
  g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 1; g.strokeStyle = 'rgba(60,40,20,.45)'; g.stroke();
  const hor = w >= h, s = hor ? h : w;
  g.strokeStyle = 'rgba(60,40,20,.55)'; g.lineWidth = Math.max(1, s * .04);
  g.beginPath(); if (hor) { g.moveTo(x + w / 2, y + s * .14); g.lineTo(x + w / 2, y + h - s * .14); } else { g.moveTo(x + s * .14, y + h / 2); g.lineTo(x + w - s * .14, y + h / 2); } g.stroke();
  g.fillStyle = '#b8902e'; D.circle(g, x + w / 2, y + h / 2, s * .055); g.fill();
  for (let k = 0; k < 2; k++) {
    const hx = hor ? x + k * s : x, hy = hor ? y : y + k * s, n = v[k];
    for (const [px, py] of PIP[n]) {
      // rotate pip layout for horizontal halves so 2/3/6 look natural
      const qx = hor ? py : px, qy = hor ? 1 - px : py;
      g.fillStyle = n === 1 ? '#b23a2b' : '#1b1510';
      D.circle(g, hx + (s * .12) + qx * s * .76, hy + (s * .12) + qy * s * .76, s * .085); g.fill();
    }
  }
  if (o.sel) { g.strokeStyle = o.sel === true ? '#e0a020' : o.sel; g.lineWidth = Math.max(2, s * .09); D.rr(g, x - 1, y - 1, w + 2, h + 2, r); g.stroke(); }
  if (o.dim) { g.fillStyle = 'rgba(40,25,10,.25)'; D.rr(g, x, y, w, h, r); g.fill(); }
  g.restore();
}

/* ---- snake layout of the line of play, in "units" (tile = 2×1). returns [{x,y,w,h,v}] plus ghost rects ---- */
function layoutLine(chain, K, extra) {
  const out = [], S = 2.2;
  if (!chain.length) return out;
  const c = chain[0];
  if (c.v[0] === c.v[1]) out.push({x: -.5, y: -1, w: 1, h: 2, v: c.v, id: c.id});
  else out.push({x: -1, y: -.5, w: 2, h: 1, v: c.v, id: c.id});
  const first = out[0];
  const arms = {R: chain.filter(t => t.arm === 'R'), L: chain.filter(t => t.arm === 'L')};
  if (extra) arms[extra.arm] = arms[extra.arm].concat([extra]);
  for (const arm of ['R', 'L']) {
    const sgnY = arm === 'R' ? 1 : -1;
    let dir = arm === 'R' ? 1 : -1, x = arm === 'R' ? first.x + first.w : first.x, y = 0, afterTurn = false;
    for (const t of arms[arm]) {
      const dbl = t.v[0] === t.v[1], cross = dbl && !afterTurn, len = cross ? 1 : 2;
      const lim = K;
      if (!afterTurn && (dir > 0 ? x + len > lim : x - len < -lim)) {
        // corner tile: vertical, attached end toward the current row
        const cx = dir > 0 ? x : x - 1;
        const r = sgnY > 0 ? {x: cx, y: y - .5, w: 1, h: 2, v: [t.v[0], t.v[1]]} : {x: cx, y: y - 1.5, w: 1, h: 2, v: [t.v[1], t.v[0]]};
        r.id = t.id; r.ghost = t.ghost; out.push(r);
        y += S * sgnY; x = dir > 0 ? cx + 1 : cx; dir = -dir; afterTurn = true; continue;
      }
      let r;
      if (cross) r = {x: dir > 0 ? x : x - 1, y: y - 1, w: 1, h: 2, v: t.v};
      else r = {x: dir > 0 ? x : x - 2, y: y - .5, w: 2, h: 1, v: dir > 0 ? [t.v[0], t.v[1]] : [t.v[1], t.v[0]]};
      r.id = t.id; r.ghost = t.ghost; out.push(r);
      x += dir * len; afterTurn = false;
    }
  }
  return out;
}

BX.register({
  id: 'dominoes', title: '多米诺骨牌', cat: 'folk', order: 4, sub: '接龙出牌，先出完者胜',
  desc: '经典双六多米诺「摸牌接龙」：28 张骨牌，点数相同才能相接，出不了就去骨堆摸牌。先出完手牌者赢得对手剩余点数，先到目标分获胜。',
  kind: 'turn', seats: [2, 4], defSeats: 2, hidden: true, aiDelay: 520,
  seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'],
  options: [{key: 'target', label: '目标分', choices: [[100, '100 分'], [0, '一局定胜负']], def: 100}],
  rules: `<p>使用一副<b>双六</b>多米诺骨牌（0–0 到 6–6，共 28 张）。2 人每人摸 <b>7 张</b>，3–4 人每人 <b>5 张</b>，其余背面朝下作为<b>骨堆</b>。</p>
<p><b>开局</b>：第一局由持有<b>最大对子</b>（6–6、5–5……）的玩家打出这张牌开局；若无人持有对子，则由持有点数最大的牌者打出该牌。之后每局由上一局的赢家先出，可出任意牌。</p>
<p><b>出牌</b>：按顺序轮流出牌，骨牌的一端必须与桌上牌列某一端的<b>点数相同</b>才能相接。对子横着摆放（与牌列垂直）。牌列可以向两端延伸，到桌边时会转弯。</p>
<p><b>摸牌</b>：轮到你却没有可出的牌时，必须从骨堆<b>逐张摸牌</b>，直到摸到能出的牌为止；骨堆摸完仍出不了则<b>过</b>。有牌可出时不能摸牌。</p>
<p><b>一局结束</b>：某位玩家出完全部手牌（「出完」），他获得所有对手手中剩余的点数之和。若所有人都无法出牌（<b>堵死</b>），手中点数<b>最少</b>者获胜，获得其他玩家剩余点数之和；若最少点数并列，本局不计分。</p>
<p><b>胜负</b>：先累计达到<b>目标分（默认 100 分）</b>者获胜；也可选择「一局定胜负」。</p>
<p><b>操作</b>：点选手中的骨牌，再点牌列一端的虚线位置放置；只有一端可接时自动放下。无牌可出时点「摸牌」/「过」。</p>`,
  icon(g, w, h) {
    D.felt(g, 0, 0, w, h, {color: '#2f6b4f'});
    tile(g, 18, 58, 60, 30, [6, 3]); tile(g, 78, 43, 30, 60, [3, 3]); tile(g, 108, 58, 60, 30, [3, 5]);
    tile(g, 138, 88, 30, 60, [5, 1]);
    g.save(); g.translate(40, 110); g.rotate(-.25); tile(g, 0, 0, 26, 52, null); g.restore();
    g.save(); g.translate(54, 8); g.rotate(.2); tile(g, 0, 0, 26, 46, [2, 4]); g.restore();
  },
  create(ctx) {
    const n = ctx.n, rng = ctx.rng;
    const target = BX.test ? 0 : +ctx.opts.target || 0;
    const st = {hands: [], bone: [], chain: [], ends: [-1, -1], cur: 0, must: -1, passes: 0, score: Array(n).fill(0), round: 0, ph: 'play',
      res: null, lack: BX.range(n).map(() => []), last: -1, lastBy: -1, over: false, starter: -1, target};
    function deal(lead) {
      const ids = rng.shuffle(BX.range(28)), per = n === 2 ? 7 : 5;
      st.hands = BX.range(n).map(k => ids.slice(k * per, k * per + per).sort((a, b) => a - b));
      st.bone = ids.slice(n * per); st.chain = []; st.ends = [-1, -1]; st.passes = 0; st.res = null; st.lack = BX.range(n).map(() => []);
      st.last = -1; st.lastBy = -1; st.round++; st.ph = 'play';
      if (lead >= 0) { st.cur = lead; st.must = -1; }
      else {
        let best = -1, who = 0;
        for (let s = 0; s < n; s++) for (const id of st.hands[s]) { const sc = (isDbl(id) ? 100 : 0) + pipsOf(id) * 2 + TILES[id][1] * .1; if (sc > best) { best = sc; who = s; } }
        st.cur = who; st.must = st.hands[who].find(id => (isDbl(id) ? 100 : 0) + pipsOf(id) * 2 + TILES[id][1] * .1 === best);
      }
      st.starter = st.cur;
    }
    deal(-1);

    /* ---- rules ---- */
    function fits(id) {
      if (!st.chain.length) return st.must < 0 || id === st.must ? ['C'] : [];
      const [a, b] = TILES[id], out = [];
      if (a === st.ends[0] || b === st.ends[0]) out.push('L');
      if ((a === st.ends[1] || b === st.ends[1]) && !(st.ends[0] === st.ends[1] && out.length)) out.push('R');
      return out;
    }
    const playable = s => st.hands[s].filter(id => fits(id).length);
    const handPips = s => st.hands[s].reduce((a, id) => a + pipsOf(id), 0);
    function legal(a, by) {
      if (!a || st.over || st.ph !== 'play' || by !== st.cur) return false;
      if (a.t === 'play') return st.hands[by].includes(a.id) && fits(a.id).includes(a.side);
      if (a.t === 'draw') return !playable(by).length && st.bone.length > 0;
      if (a.t === 'pass') return !playable(by).length && !st.bone.length;
      return false;
    }
    const nextSeat = s => (s + 1) % n;
    function endRound(winner, how) {
      const rem = BX.range(n).map(handPips);
      let pts = 0;
      if (winner >= 0) { for (let s = 0; s < n; s++) if (s !== winner) pts += rem[s]; st.score[winner] += pts; }
      st.res = {w: winner, how, pts, rem};
      st.ph = 'end';
      const tgt = st.target;
      const top = Math.max(...st.score);
      if (!tgt) {
        st.over = true;
        ctx.end({winner: winner >= 0 ? winner : -1, text: winner >= 0 ? (how === 'out' ? ctx.name(winner) + ' 出完手牌' : '堵死，' + ctx.name(winner) + ' 点数最少') + '，得 ' + pts + ' 分' : '堵死且点数并列，平局', delay: 1800});
      } else if (top >= tgt) {
        st.over = true;
        const ws = BX.range(n).filter(s => st.score[s] === top);
        ctx.end({winner: ws.length === 1 ? ws[0] : ws, html: '最终比分：<br>' + BX.range(n).map(s => BX.esc(ctx.name(s)) + '　' + st.score[s] + ' 分').join('<br>'), delay: 2000});
      }
      if (!ctx.fast) { ctx.sfx(winner >= 0 && ctx.isLocal(winner) ? 'score' : 'gong'); }
    }
    function apply(a, by) {
      if (a.t === 'next') { if (st.ph === 'end' && !st.over) { const lead = st.res.w >= 0 ? st.res.w : nextSeat(st.starter); deal(lead); ctx.sfx('shuffle'); } return; }
      if (!legal(a, by)) return;
      const s = by;
      if (a.t === 'play') {
        const id = a.id, [p, q] = TILES[id];
        st.hands[s].splice(st.hands[s].indexOf(id), 1);
        if (a.side === 'C') { st.chain.push({id, v: [p, q], arm: 'C'}); st.ends = [p, q]; }
        else if (a.side === 'R') { const at = st.ends[1], v = p === at ? [p, q] : [q, p]; st.chain.push({id, v, arm: 'R'}); st.ends[1] = v[1]; }
        else { const at = st.ends[0], v = p === at ? [p, q] : [q, p]; st.chain.push({id, v, arm: 'L'}); st.ends[0] = v[1]; }
        st.must = -1; st.passes = 0; st.last = id; st.lastBy = s;
        if (!ctx.fast) { placeFx = {id, t: 0, by: s}; ctx.anim(260, k => placeFx && (placeFx.t = k), () => placeFx = null); ctx.sfx(isDbl(id) ? 'hit' : 'place'); }
        if (!st.hands[s].length) { endRound(s, 'out'); return; }
        st.cur = nextSeat(s);
      } else if (a.t === 'draw') {
        const id = st.bone.pop(); st.hands[s].push(id); st.hands[s].sort((x, y) => x - y);
        for (const e of st.ends) if (e >= 0 && !st.lack[s].includes(e)) st.lack[s].push(e);
        if (!ctx.fast) { drawFx = {s, id, t: 0}; ctx.anim(280, k => drawFx && (drawFx.t = k), () => drawFx = null); ctx.sfx('deal'); }
      } else if (a.t === 'pass') {
        for (const e of st.ends) if (e >= 0 && !st.lack[s].includes(e)) st.lack[s].push(e);
        st.passes++; ctx.sfx('tick');
        if (!ctx.fast) bubble = {s, text: '过', t: 0};
        if (st.passes >= n) {
          const rem = BX.range(n).map(handPips), lo = Math.min(...rem), ws = BX.range(n).filter(k => rem[k] === lo);
          endRound(ws.length === 1 ? ws[0] : -1, 'block'); return;
        }
        st.cur = nextSeat(s);
      }
      sel = -1;
    }

    /* ---- AI ---- */
    function aiMove(s, lv) {
      const moves = [];
      for (const id of st.hands[s]) for (const side of fits(id)) moves.push({t: 'play', id, side});
      if (!moves.length) return st.bone.length ? {t: 'draw'} : {t: 'pass'};
      if (lv === 1) return Math.random() < .5 ? BX.pick(moves) : moves.slice().sort((x, y) => pipsOf(y.id) - pipsOf(x.id))[0];
      const opp = BX.range(n).filter(k => k !== s), nxt = nextSeat(s);
      const scored = moves.map(m => {
        const [p, q] = TILES[m.id];
        let ends;
        if (m.side === 'C') ends = [p, q];
        else { const at = m.side === 'L' ? st.ends[0] : st.ends[1], free = p === at ? q : p; ends = m.side === 'L' ? [free, st.ends[1]] : [st.ends[0], free]; }
        let sc = pipsOf(m.id) + (isDbl(m.id) ? 4 : 0);
        if (lv >= 3) {
          const rest = st.hands[s].filter(i => i !== m.id);
          // keep control: how many of my remaining tiles fit the new ends
          sc += 2.2 * rest.filter(i => TILES[i].some(v => v === ends[0] || v === ends[1])).length;
          // block: next player known to lack both ends
          if (st.lack[nxt].includes(ends[0]) && st.lack[nxt].includes(ends[1])) sc += 9;
          else if (st.lack[nxt].includes(ends[0]) || st.lack[nxt].includes(ends[1])) sc += 3;
          // count visible tiles of each end number (played + my hand): many seen → others unlikely to hold it
          for (const e of new Set(ends)) {
            let seen = st.chain.filter(t => t.v[0] === e || t.v[1] === e).length + rest.filter(i => TILES[i].includes(e)).length;
            if (TILES[m.id].includes(e)) seen++;
            sc += seen * .8;
          }
          if (rest.length === 0) sc += 1000;
        }
        return [m, sc];
      });
      return BX.ai.byLevel(scored, lv === 2 ? 2 : 3);
    }

    /* ---- view ---- */
    const cv = ctx.canvas();
    const ui = ctx.ui();
    const bar = h('div', {style: {position: 'absolute', display: 'flex', gap: '8px'}}); ui.append(bar);
    const bDraw = h('button', {class: 'bx-btn red', text: '摸牌', on: {click: () => tryAct({t: 'draw'})}});
    const bPass = h('button', {class: 'bx-btn', text: '过', on: {click: () => tryAct({t: 'pass'})}});
    bar.append(bDraw, bPass);
    let sel = -1, placeFx = null, drawFx = null, bubble = null, hand = [], ghosts = [], G = null;
    const me = () => ctx.view;
    function tryAct(a) { if (!ctx.canAct(st.cur)) return; if (!legal(a, st.cur)) { ctx.sfx('error'); return; } sel = -1; ctx.act(a, st.cur); }
    function geom() {
      const W = cv.w, H = cv.h, ph = W < 560 || H < 560;
      const cnt = Math.max(5, (st.hands[ctx.view] || []).length);
      const htw = BX.clamp(Math.min((W - 24) / cnt / 1.18, H * .065), 22, 50);
      const handH = htw * 2 + 30, topH = BX.clamp(H * .16, 62, 108);
      const table = {x: 8, y: topH, w: W - 16, h: H - topH - handH - 12};
      return {W, H, handH, topH, table, ph, htw};
    }
    function lineGeom(gm, extra) {
      const tb = gm.table, aspect = tb.w / Math.max(1, tb.h);
      const K = BX.clamp(aspect * 4.6, 4.2, 13);
      const rects = layoutLine(st.chain, K, extra);
      return {rects, K};
    }
    function fitRects(gm, rects) {
      const tb = gm.table;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const r of rects) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
      if (!rects.length) { x0 = -1; x1 = 1; y0 = -1; y1 = 1; }
      x0 = Math.min(x0, -3); x1 = Math.max(x1, 3); y0 = Math.min(y0, -2.3); y1 = Math.max(y1, 2.3);
      const u = Math.min(tb.w / (x1 - x0 + 1), tb.h / (y1 - y0 + 1), gm.ph ? 34 : 44);
      const ox = tb.x + tb.w / 2 - (x0 + x1) / 2 * u, oy = tb.y + tb.h / 2 - (y0 + y1) / 2 * u;
      return {u, ox, oy};
    }
    function computeGhosts(gm, fit) {
      ghosts = [];
      if (sel < 0 || !ctx.canAct(st.cur) || st.cur !== me()) return;
      const sides = fits(sel);
      for (const side of sides) {
        if (side === 'C') { const d = isDbl(sel); ghosts.push({side, x: fit.ox + (d ? -.5 : -1) * fit.u, y: fit.oy + (d ? -1 : -.5) * fit.u, w: (d ? 1 : 2) * fit.u, h: (d ? 2 : 1) * fit.u}); continue; }
        const [p, q] = TILES[sel], at = side === 'L' ? st.ends[0] : st.ends[1], v = p === at ? [p, q] : [q, p];
        const rs = layoutLine(st.chain, G.K, {id: sel, v, arm: side, ghost: true}), r = rs.find(x => x.ghost);
        if (r) ghosts.push({side, x: fit.ox + r.x * fit.u, y: fit.oy + r.y * fit.u, w: r.w * fit.u, h: r.h * fit.u, v: r.v});
      }
    }
    function handLayout(gm) {
      const ids = st.hands[me()] || [], cnt = ids.length;
      let tw = gm.htw, gap = tw * .18;
      const maxW = gm.W - 24;
      let rows = 1;
      if (cnt * (tw + gap) > maxW) { rows = 2; tw = Math.min((gm.handH - 30) / 4.2, maxW / Math.ceil(cnt / 2) / 1.18); gap = tw * .18; }
      const th = tw * 2, per = Math.ceil(cnt / rows);
      const out = [];
      ids.forEach((id, k) => {
        const row = Math.floor(k / per), col = k % per, inRow = Math.min(per, cnt - row * per);
        const x = gm.W / 2 - (inRow * (tw + gap) - gap) / 2 + col * (tw + gap);
        const y = gm.H - 8 - (rows - row) * (th + 4);
        out.push({id, x, y, w: tw, h: th});
      });
      return out;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e);
      for (const gh of ghosts) if (p.x >= gh.x - 8 && p.x <= gh.x + gh.w + 8 && p.y >= gh.y - 8 && p.y <= gh.y + gh.h + 8) { tryAct({t: 'play', id: sel, side: gh.side}); return; }
      for (const t of hand) if (p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y - 10 && p.y <= t.y + t.h) {
        if (!ctx.canAct(st.cur) || st.cur !== me()) { ctx.sfx('error'); return; }
        const sides = fits(t.id);
        if (!sides.length) { ctx.sfx('error'); ctx.toast(st.must >= 0 ? '开局须打出 ' + TILES[st.must].join('-') : '这张牌接不上'); return; }
        if (sel === t.id || sides.length === 1) { tryAct({t: 'play', id: t.id, side: sides[0]}); sel = -1; return; }
        sel = t.id; ctx.sfx('select'); return;
      }
      sel = -1;
    });
    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.score[s] + (st.target ? '分' : '') + ' · ' + st.hands[s].length + '张');
      if (st.ph === 'end') {
        const r = st.res;
        ctx.status(r.w >= 0 ? (r.how === 'out' ? ctx.name(r.w) + ' 出完！' : '堵死，' + ctx.name(r.w) + ' 点数最少') + ' 得 ' + r.pts + ' 分' : '堵死，点数并列，本局不计分');
        return;
      }
      const you = ctx.canAct(st.cur);
      let t = (you ? (ctx.hotseat ? ctx.name(st.cur) + '：' : '') + (playable(st.cur).length ? (st.must >= 0 ? '请打出 ' + TILES[st.must].join('-') + ' 开局' : '选一张牌接上') : st.bone.length ? '没有能接的牌，请摸牌' : '无牌可出，只能过') : '等待 ' + ctx.name(st.cur) + '…');
      if (st.target) t = '第 ' + st.round + ' 局 · ' + t;
      ctx.status(t);
    }
    function seatSpots(gm) {
      const others = []; for (let k = 1; k < n; k++) others.push((me() + k) % n);
      return others.map((s, k) => ({s, x: gm.W * (k + .5) / others.length, y: gm.topH / 2 + 2}));
    }
    function frame(dt) {
      const g = cv.g; cv.clear();
      const gm = geom(); G = lineGeom(gm);
      // table
      D.wood(g, 0, 0, gm.W, gm.H, {base: '#6b4426', dark: '#3d2716', seed: 9});
      D.felt(g, 4, gm.topH - 4, gm.W - 8, gm.table.h + 8, {r: 16, color: '#2f6b4f'});
      g.strokeStyle = 'rgba(230,197,125,.35)'; g.lineWidth = 2; D.rr(g, 10, gm.topH + 2, gm.W - 20, gm.table.h - 4, 12); g.stroke();
      const fit = fitRects(gm, G.rects);
      computeGhosts(gm, fit);
      // line of play
      if (!st.chain.length) D.text(g, st.ph === 'play' ? (st.must >= 0 ? ctx.name(st.cur) + ' 以 ' + TILES[st.must].join('-') + ' 开局' : ctx.name(st.cur) + ' 先出') : '', gm.W / 2, gm.table.y + gm.table.h / 2, {size: 16, color: 'rgba(255,240,210,.7)', font: 'serif'});
      for (const r of G.rects) {
        let x = fit.ox + r.x * fit.u, y = fit.oy + r.y * fit.u, w = r.w * fit.u, hh = r.h * fit.u;
        let al = 1;
        if (placeFx && placeFx.id === r.id) {
          const k = placeFx.t, sp = seatSpots(gm).find(q => q.s === placeFx.by);
          const sx = sp ? sp.x : gm.W / 2, sy = sp ? sp.y : gm.H - gm.handH / 2;
          x = BX.lerp(sx - w / 2, x, k); y = BX.lerp(sy - hh / 2, y, k); al = .4 + .6 * k;
        }
        g.globalAlpha = al;
        tile(g, x + 1, y + 1, w - 2, hh - 2, r.v, {sel: r.id === st.last && !placeFx ? 'rgba(224,160,32,.85)' : null});
        g.globalAlpha = 1;
      }
      // end markers
      if (st.chain.length && st.ph === 'play') {
        const pul = .5 + .5 * Math.sin(performance.now() / 300);
        for (const gh of ghosts) {
          g.save(); g.setLineDash([6, 4]); g.strokeStyle = `rgba(255,215,106,${.6 + .4 * pul})`; g.lineWidth = 2.5; D.rr(g, gh.x + 1, gh.y + 1, gh.w - 2, gh.h - 2, 6); g.stroke();
          g.globalAlpha = .45; if (gh.v) tile(g, gh.x + 1, gh.y + 1, gh.w - 2, gh.h - 2, gh.v, {shadow: false}); g.restore();
        }
      } else for (const gh of ghosts) { g.save(); g.setLineDash([6, 4]); g.strokeStyle = '#ffd76a'; g.lineWidth = 2.5; D.rr(g, gh.x, gh.y, gh.w, gh.h, 6); g.stroke(); g.restore(); }
      // opponents
      const showAll = st.ph === 'end';
      for (const sp of seatSpots(gm)) {
        const ids = st.hands[sp.s], cnt = ids.length, turn = st.cur === sp.s && st.ph === 'play';
        const th0 = gm.topH - 34, tw = Math.max(6, Math.min(th0 / 2, (gm.W / (n - 1) - 24) / (Math.max(4, cnt) * .62 + .4))), th = tw * 2;
        const span = cnt ? (cnt - 1) * tw * .62 + tw : 0, x0 = sp.x - span / 2, y0 = gm.topH - th - 6;
        g.fillStyle = turn ? 'rgba(255,215,106,.22)' : 'rgba(0,0,0,.18)'; D.rr(g, sp.x - gm.W / (n - 1) / 2 + 4, 4, gm.W / (n - 1) - 8, gm.topH - 8, 10); g.fill();
        if (turn) { g.strokeStyle = 'rgba(255,215,106,.8)'; g.lineWidth = 2; g.stroke(); }
        D.disc(g, sp.x - gm.W / (n - 1) / 2 + 18, 18, 7, ctx.color(sp.s), {shadow: false});
        D.text(g, ctx.name(sp.s) + (ctx.isAI(sp.s) ? '' : '') + '  ' + cnt + ' 张', sp.x - gm.W / (n - 1) / 2 + 30, 18, {size: 13, color: '#f3e2c0', align: 'left', weight: 700, maxW: gm.W / (n - 1) - 40});
        ids.forEach((id, k) => tile(g, x0 + k * tw * .62, y0, tw, th, showAll ? TILES[id] : null, {shadow: true}));
        if (showAll && st.res) D.text(g, st.res.rem[sp.s] + ' 点', sp.x + gm.W / (n - 1) / 2 - 12, 18, {size: 13, color: '#ffd76a', align: 'right', weight: 800});
        if (bubble && bubble.s === sp.s) { bubble.t += dt / Math.max(1, n - 1); D.text(g, bubble.text, sp.x, gm.topH + 18, {size: 22, color: '#ffd76a', font: 'deco', weight: 400, stroke: 'rgba(0,0,0,.6)', strokeW: 4}); }
      }
      if (bubble) { if (bubble.s === me()) { bubble.t += dt; D.text(g, '过', gm.W / 2, gm.H - gm.handH - 22, {size: 24, color: '#ffd76a', font: 'deco', weight: 400, stroke: 'rgba(0,0,0,.6)', strokeW: 4}); } if (bubble.t > 1.1) bubble = null; }
      // boneyard
      const bw = gm.ph ? 14 : 20, bx = gm.W - 18 - bw * 2.6, by = gm.table.y + 10;
      for (let k = 0; k < Math.min(st.bone.length, 8); k++) tile(g, bx + (k % 4) * 4, by + Math.floor(k / 4) * 4 - k * .6, bw, bw * 2, null, {shadow: k === 0});
      D.text(g, '骨堆 ' + st.bone.length, bx + bw * .9, by + bw * 2 + 16, {size: 12, color: '#f3e2c0', weight: 700});
      // my hand
      hand = handLayout(gm);
      const myTurn = ctx.canAct(st.cur) && st.cur === me() && st.ph === 'play';
      g.fillStyle = myTurn ? 'rgba(255,215,106,.12)' : 'rgba(0,0,0,.15)'; D.rr(g, 6, gm.H - gm.handH - 4, gm.W - 12, gm.handH, 12); g.fill();
      D.disc(g, 20, gm.H - gm.handH + 10, 6, ctx.color(me()), {shadow: false});
      D.text(g, (ctx.hotseat ? ctx.name(me()) : '我的手牌') + ' · ' + hand.length + ' 张 · ' + handPips(me()) + ' 点', 32, gm.H - gm.handH + 10, {size: 12, color: '#f3e2c0', align: 'left', weight: 700});
      for (const t of hand) {
        const can = myTurn && fits(t.id).length > 0, lift = t.id === sel ? 10 : can ? 3 : 0;
        let y = t.y - lift, al = 1;
        if (drawFx && drawFx.id === t.id && drawFx.s === me()) { y = BX.lerp(by, y, drawFx.t); al = drawFx.t; }
        g.globalAlpha = al;
        tile(g, t.x, y, t.w, t.h, TILES[t.id], {sel: t.id === sel ? true : can ? 'rgba(90,200,150,.9)' : null, dim: myTurn && !can});
        g.globalAlpha = 1;
      }
      // buttons
      const showDraw = myTurn && !playable(me()).length;
      bDraw.style.display = showDraw && st.bone.length ? '' : 'none';
      bPass.style.display = showDraw && !st.bone.length ? '' : 'none';
      Object.assign(bar.style, {left: '50%', transform: 'translateX(-50%)', top: (gm.H - gm.handH - 58) + 'px'});
      // round result overlay
      if (st.ph === 'end' && st.res) {
        const r = st.res, msg = r.w >= 0 ? ctx.name(r.w) + (r.how === 'out' ? ' 出完！' : ' 点数最少') + '  +' + r.pts : '堵死 · 点数并列';
        const fs = Math.max(16, Math.min(28, gm.W / 18));
        g.font = `400 ${fs}px ${BX.F.deco}`; const tw = g.measureText(msg).width + fs * 2;
        const cy = gm.table.y + gm.table.h - fs * 1.4;
        g.fillStyle = 'rgba(30,18,8,.85)'; D.rr(g, gm.W / 2 - tw / 2, cy - fs, tw, fs * 2, fs); g.fill();
        D.text(g, msg, gm.W / 2, cy, {size: fs, color: '#ffd76a', font: 'deco', weight: 400});
      }
    }
    return {
      st, toMove: () => st.over || st.ph !== 'play' ? null : st.cur,
      valid: legal, apply,
      sysMove: () => st.ph === 'end' && !st.over ? {a: {t: 'next'}, delay: 3200} : null,
      aiMove(s, lv) { const a = aiMove(s, lv); return legal(a, s) ? a : (st.bone.length ? {t: 'draw'} : {t: 'pass'}); },
      onTurn: status, onView() { sel = -1; },
      frame,
    };
  },
});
