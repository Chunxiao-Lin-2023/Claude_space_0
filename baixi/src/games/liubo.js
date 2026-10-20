/* 六博 — 汉代博戏（本馆复原规则） */
const D = BX.draw, C = BX.C;
const RING = 16, T_POS = 17, WATER = 18;
const START = [0, 8];                       // ring index where each side enters
const SAFE = new Set([2, 6, 10, 14]);       // four 角 (V 纹) stations
const PSTEP = [0, 6, 15, 20, 15, 6, 2].map(v => v / 64);   // probability of each step count (6 = 满采: 0 or 6 faces)
const RING_XY = [];
(function () {   // ring stations in board units [-1,1], counter-clockwise on screen starting bottom-middle
  const a = .8, q = .4;
  const pts = [[0, a], [q, a], [a, a], [a, q], [a, 0], [a, -q], [a, -a], [q, -a], [0, -a], [-q, -a], [-a, -a], [-a, -q], [-a, 0], [-a, q], [-a, a], [-q, a]];
  for (const p of pts) RING_XY.push(p);
})();
const NAMES = ['曲', '道', '高', '道', '曲', '道', '高', '道', '曲', '道', '高', '道', '曲', '道', '高', '道'];

/* node id of a side's path position */
function node(side, p) { if (p >= 1 && p <= RING) return (START[side] + p - 1) % RING; if (p === T_POS) return 100 + side; if (p >= WATER) return 200; return -1; }
function nodeXY(nd) { if (nd < 100) return RING_XY[nd]; if (nd === 200) return [0, 0]; return [0, nd === 100 ? .3 : -.3]; }
function occ(st, nd) { for (let s = 0; s < 2; s++) for (let i = 0; i < 6; i++) { const pc = st.pc[s][i]; if (pc.p > 0 && pc.p < WATER && node(s, pc.p) === nd) return {s, i}; } return null; }
/* legal moves for side with n steps → [{i, from, to, cap}] */
function legal(st, side, n) {
  const out = [], seenHome = {};
  if (n <= 0) return out;
  for (let i = 0; i < 6; i++) {
    const pc = st.pc[side][i];
    if (pc.p === 0) { if (seenHome[pc.k]) continue; seenHome[pc.k] = 1; }
    const to = Math.min(WATER, pc.p + n);
    let cap = -1;
    if (to < WATER) {
      const nd = node(side, to), o = occ(st, nd);
      if (o) {
        if (o.s === side) continue;
        if (SAFE.has(nd)) continue;
        const ek = st.pc[o.s][o.i].k;
        if (ek === 'x' && pc.k !== 'x') continue;          // 散不能犯枭
        cap = o.i;
      }
    }
    out.push({i, from: pc.p, to, cap});
  }
  return out;
}
/* apply a move on a plain state (used by rules and AI) → {fish, win} */
function doMove(st, side, m) {
  const pc = st.pc[side][m.i]; let fish = 0, win = false;
  if (m.cap >= 0) { const e = st.pc[1 - side][m.cap]; if (e.k === 'x') win = true; e.p = 0; }
  if (m.to >= WATER) { fish = pc.k === 'x' ? 2 : 1; st.fish[side] += fish; pc.p = 0; }
  else pc.p = m.to;
  return {fish, win};
}
/* ---------- AI evaluation ---------- */
function threat(st, victimSide) {   // expected loss for victimSide from opponent's next throw
  const op = 1 - victimSide; let loss = 0;
  for (let d = 1; d <= 6; d++) {
    const ms = legal(st, op, d); let worst = 0;
    for (const m of ms) if (m.cap >= 0) { const k = st.pc[victimSide][m.cap]; const v = k.k === 'x' ? 5000 : 18 + k.p * 2.2; if (v > worst) worst = v; }
    loss += PSTEP[d] * worst;
  }
  return loss;
}
function evalSide(st, side, goal) {
  if (st.fish[side] >= goal) return 1e5;
  if (st.fish[1 - side] >= goal) return -1e5;
  let v = (st.fish[side] - st.fish[1 - side]) * 60;
  for (let s = 0; s < 2; s++) {
    let sum = 0;
    for (const pc of st.pc[s]) sum += pc.p * (pc.k === 'x' ? 1.2 : 2.2) + (pc.p > 0 ? 3 : 0);
    v += s === side ? sum : -sum;
  }
  return v;
}
const cloneSt = st => ({pc: st.pc.map(a => a.map(p => ({k: p.k, p: p.p}))), fish: st.fish.slice()});
function scoreMove(st, side, m, goal, deep) {
  const s2 = cloneSt(st), r = doMove(s2, side, m);
  if (r.win || s2.fish[side] >= goal) return 1e6;
  let v = evalSide(s2, side, goal) - threat(s2, side) * (deep ? 1 : .8) + threat(s2, 1 - side) * .35;
  if (deep) {   // opponent's best greedy reply for every throw
    let exp = 0;
    for (let d = 1; d <= 6; d++) {
      const ms = legal(s2, 1 - side, d); if (!ms.length) continue;
      let best = -Infinity;
      for (const om of ms) {
        const s3 = cloneSt(s2), r3 = doMove(s3, 1 - side, om);
        const sv = r3.win || s3.fish[1 - side] >= goal ? 1e5 : evalSide(s3, 1 - side, goal) - threat(s3, 1 - side) * .8;
        if (sv > best) best = sv;
      }
      exp += PSTEP[d] * (best + evalSide(s2, side, goal));   // swing relative to now
    }
    v -= exp * .6;
  }
  return v;
}

BX.register({
  id: 'liubo', title: '六博', cat: 'folk', order: 5, sub: '掷箸行棋，入水牵鱼',
  desc: '汉代最流行的博戏。双方各执一枭五散，掷六根箸定步数，沿规矩纹博局绕行，入水牵鱼得筹；吃掉对方的枭立即获胜。',
  kind: 'turn', seats: 2, seatNames: ['朱方', '玄方'], seatColors: ['#b23a2b', '#2b2118'], firstLabel: '先掷', aiDelay: 650,
  options: [{key: 'goal', label: '牵鱼数', choices: [[3, '3 尾'], [6, '6 尾']], def: 3}],
  rules: `<p><b>说明：</b>六博盛行于战国秦汉，其行棋规则大半失传。传世文献（《古博经》“局分为十二道，两头当中名为水……棋行到处即竖之，名为骁棋，即入水食鱼，亦名牵鱼”）和出土博局（规矩纹 TLV 局）只留下零星线索。本馆采用以下<b>自洽的现代复原规则</b>，力求保留“掷箸、行棋、成枭、入水牵鱼、相杀”的神韵。</p>
<p><b>器具：</b>方形博局，中央方框为<b>水</b>；外圈 16 个落点（四“曲”位于四边正中，即 L 纹；四“高”在四角，即 V 纹；其间为“道”）。每方 <b>1 枭 5 散</b>，开局都在局外。</p>
<p><b>掷箸：</b>每回合先掷 6 根箸（一面有纹、一面素白），有纹面朝上几根就走几步。<b>六根全纹或全素</b>为“满采”：走 6 步并<b>再掷一次</b>。</p>
<p><b>行棋：</b>选一枚己方棋子前进相应步数：从局外入局时，本方入口的“曲”位算第 1 步；棋子沿外圈<b>逆时针</b>绕满一周（16 步）后，经本方的内“楬”位（第 17 步）进入<b>水</b>（第 18 步，步数有余也可入水）。无棋可走则本回合作罢。</p>
<p><b>相杀：</b>落在对方棋子上即将其吃回局外。己方棋子不能重叠；<b>四角“高”位为安全位</b>，不得在此吃子；<b>散不能吃枭</b>，枭可吃任何棋子。</p>
<p><b>牵鱼：</b>棋子入水即“竖为骁、入水牵鱼”：散牵 <b>1</b> 尾鱼，枭冒险入水可牵 <b>2</b> 尾；之后该棋子回到局外重新出发。</p>
<p><b>胜负：</b>吃掉对方的<b>枭</b>立即获胜；否则先牵满约定鱼数（3 或 6 尾）者胜。</p>
<p><b>操作：</b>点「掷箸」，可走的棋子会发光；点棋子（或局外的待命棋）显示落点，再点落点或再点一次棋子确认。只有一种走法时可直接点落点。</p>`,
  icon(g, w, h) {
    g.fillStyle = '#2a1a12'; g.fillRect(0, 0, w, h);
    const s = h * .86, x0 = w / 2 - s / 2, y0 = h * .07;
    g.fillStyle = '#1b120d'; D.rr(g, x0, y0, s, s, 6); g.fill();
    g.strokeStyle = '#c23a2b'; g.lineWidth = 3;
    const c = x0 + s / 2, m = y0 + s / 2;
    g.strokeRect(c - s * .14, m - s * .14, s * .28, s * .28);
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { g.beginPath(); g.moveTo(c + dx * s * .44, m + dy * s * .44); g.lineTo(c + dx * s * .32, m + dy * s * .32); g.stroke(); }
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { g.beginPath(); g.moveTo(c + dx * s * .14, m + dy * s * .14); g.lineTo(c + dx * s * .24, m + dy * s * .24); g.moveTo(c + dx * s * .24 + dy * s * .07, m + dy * s * .24 + dx * s * .07); g.lineTo(c + dx * s * .24 - dy * s * .07, m + dy * s * .24 - dx * s * .07); g.stroke(); }
    g.fillStyle = '#2f6f8a'; g.fillRect(c - s * .1, m - s * .1, s * .2, s * .2);
    fishShape(g, c, m, s * .09, '#f6e7c8', .4);
    blockPiece(g, x0 + s * .2, y0 + s * .78, s * .13, '#b23a2b', '枭', true);
    blockPiece(g, x0 + s * .8, y0 + s * .22, s * .11, '#2b2118', '散', false);
    for (let i = 0; i < 6; i++) stick(g, w * .06 + (i % 2) * 8, h * .2 + i * h * .1, w * .2, h * .045, -.1 + i * .03, i % 3 !== 0);
  },
  create(ctx) {
    const goal = ctx.opts.goal || 3;
    const mk = () => [{k: 'x', p: 0}, {k: 's', p: 0}, {k: 's', p: 0}, {k: 's', p: 0}, {k: 's', p: 0}, {k: 's', p: 0}];
    const st = {pc: [mk(), mk()], fish: [0, 0], turn: 0, ph: 'throw', sticks: null, steps: 0, extra: false, last: null, nt: 0, over: false, winner: null};
    const cv = ctx.canvas();
    let sel = -1, hover = null;
    const vis = {throwT: 0, throwSeed: 1, mv: null, poof: null, fishFx: null};
    const flip = () => ctx.mySeats.length === 1 && ctx.mySeats[0] === 1 || (ctx.hotseat && false);
    const now = () => performance.now();

    function layout() {
      const W = cv.w, H = cv.h, pad = Math.min(W, H) < 420 ? 6 : 12, land = W > H * 1.1;
      const L = {W, H, land};
      if (land) {
        const pw = BX.clamp(W * .3, 190, 340);
        const aw = W - pw - pad * 3, ah = H - pad * 2;
        const S = Math.min((aw - 24) / 1.3, ah);
        L.S = S; L.tray = S * .15; L.side = true;
        L.bx = pad + (aw - S) / 2; L.by = pad + (ah - S) / 2;
        L.panel = {x: W - pw - pad, y: pad, w: pw, h: H - 2 * pad};
      } else {
        const ph = BX.clamp(H * .26, 160, 240);
        const aw = W - pad * 2, ah = H - ph - pad * 3;
        const S = Math.min(aw, ah / 1.3);
        L.S = S; L.bx = pad + (aw - S) / 2; L.tray = S * .15; L.by = pad + (ah - S * 1.3) / 2 + L.tray;
        L.panel = {x: pad, y: H - ph - pad, w: W - 2 * pad, h: ph};
      }
      L.cx = L.bx + L.S / 2; L.cy = L.by + L.S / 2; L.u = L.S / 2 * .92;
      L.pr = Math.max(15, L.S * .052);
      const P = L.panel;
      if (land) {
        L.sticks = {x: P.x + 12, y: P.y + P.h * .26, w: P.w - 24, h: P.h * .3};
        L.btn = {x: P.x + 16, y: P.y + P.h - 16 - Math.min(64, P.h * .16), w: P.w - 32, h: Math.min(64, P.h * .16)};
        L.res = {x: P.x + P.w / 2, y: L.sticks.y + L.sticks.h + Math.min(34, P.h * .08)};
        L.score = {x: P.x + 12, y: P.y + 10, w: P.w - 24, h: P.h * .2};
      } else {
        const bw = Math.min(150, P.w * .36);
        L.score = {x: P.x + 10, y: P.y + 8, w: P.w - 20, h: Math.min(40, P.h * .22)};
        L.sticks = {x: P.x + 10, y: L.score.y + L.score.h + 6, w: P.w - bw - 30, h: P.h - L.score.h - 22};
        L.btn = {x: P.x + P.w - bw - 10, y: L.sticks.y + L.sticks.h * .5 - Math.min(56, L.sticks.h * .6) / 2 + 10, w: bw, h: Math.min(56, L.sticks.h * .6)};
        L.res = {x: L.btn.x + bw / 2, y: L.btn.y - 12};
      }
      return L;
    }
    /* board → screen */
    function B2S(L, x, y) { if (flip()) { x = -x; y = -y; } return [L.cx + x * L.u, L.cy + y * L.u]; }
    function trayRect(L, side) {
      const own = (side === 0) !== flip();
      if (L.side) return {x: own ? L.bx - L.tray - 8 : L.bx + L.S + 8, y: L.by, w: L.tray, h: L.S};
      return {x: L.bx, y: own ? L.by + L.S + 8 : L.by - L.tray, w: L.S, h: L.tray - 6};
    }
    function homeXY(L, side, i) {   // off-board tray slots
      const T = trayRect(L, side), own = (side === 0) !== flip();
      if (L.side) { const span = L.S * .6; return [T.x + T.w / 2, own ? T.y + T.h - L.S * .1 - (5 - i) * span / 5 : T.y + L.S * .1 + (5 - i) * span / 5]; }
      const span = L.S * .62; return [L.cx - span / 2 + i * span / 5 - (own ? L.S * .12 : -L.S * .12), T.y + T.h / 2];
    }
    function fishTrayXY(L, side, j) {
      const T = trayRect(L, side), own = (side === 0) !== flip();
      if (L.side) return [T.x + T.w / 2, own ? T.y + L.S * .05 + j * L.S * .045 : T.y + T.h - L.S * .05 - j * L.S * .045];
      return [own ? L.bx + L.S - L.S * .04 - j * L.S * .055 : L.bx + L.S * .04 + j * L.S * .055, T.y + T.h / 2];
    }
    function pieceXY(L, side, i, p) { if (p === 0) return homeXY(L, side, i); const [x, y] = nodeXY(node(side, p)); return B2S(L, x, y); }

    const curMoves = () => st.ph === 'move' ? legal(st, st.turn, st.steps) : [];
    const myTurn = () => !st.over && ctx.canAct(st.turn);

    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      const L = layout(), p = cv.pos(e);
      if (!myTurn()) return;
      if (st.ph === 'throw') {
        const b = L.btn; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { ctx.act({t: 'throw'}, st.turn); return; }
        return;
      }
      if (st.ph !== 'move' || now() - vis.throwT < 700) return;
      const ms = curMoves(), side = st.turn, R = L.pr * 1.25;
      // tap a target of selected piece
      const tgtXY = m => m.to >= WATER ? B2S(L, 0, 0) : pieceXY(L, side, m.i, m.to);
      const sm = ms.find(m => m.i === sel);
      if (sm) { const [tx, ty] = tgtXY(sm); if (Math.hypot(p.x - tx, p.y - ty) < R * (sm.to >= WATER ? 1.5 : 1)) { go(sm); return; } }
      // tap a piece
      for (const m of ms) {
        const [x, y] = pieceXY(L, side, m.i, m.from);
        if (Math.hypot(p.x - x, p.y - y) < R) { if (sel === m.i) { go(m); return; } sel = m.i; ctx.sfx('select'); return; }
      }
      // tap a target directly when unambiguous
      const hits = ms.filter(m => { const [tx, ty] = tgtXY(m); return Math.hypot(p.x - tx, p.y - ty) < R; });
      if (hits.length === 1) { go(hits[0]); return; }
      sel = -1;
    });
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cv.pos(e); });
    function go(m) { sel = -1; ctx.act({t: 'move', i: m.i}, st.turn); }
    ctx.on(window, 'keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && myTurn() && st.ph === 'throw') ctx.act({t: 'throw'}, st.turn); });

    function status() {
      ctx.info(0, '鱼 ' + st.fish[0] + '/' + goal); ctx.info(1, '鱼 ' + st.fish[1] + '/' + goal);
      if (st.over) { ctx.status(st.winner == null ? '和局' : ctx.name(st.winner) + (st.winReason === 'x' ? ' 吃枭获胜' : ' 牵满 ' + goal + ' 尾鱼')); return; }
      const who = ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) : '你') : ctx.name(st.turn);
      const mine = ctx.canAct(st.turn);
      if (st.ph === 'throw') ctx.status(mine ? `${ctx.hotseat ? who + '：' : ''}点「掷箸」` + (st.extra ? '（满采再掷）' : '') : `等待 ${who} 掷箸…`);
      else if (st.ph === 'move') ctx.status(`${who} 掷得 <b>${st.steps}</b> 步` + (mine ? '：选择棋子' : '，正在行棋…'));
      else if (st.ph === 'pass') ctx.status(`${who} 掷得 ${st.steps} 步，无棋可走`);
    }

    function nextTurn(again) {
      st.nt++; sel = -1;
      if (st.nt >= 400) { finish(st.fish[0] === st.fish[1] ? null : st.fish[0] > st.fish[1] ? 0 : 1, 'f'); return; }
      if (!again) st.turn = 1 - st.turn;
      st.ph = 'throw'; st.extra = !!again;
    }
    function finish(w, why) {
      st.over = true; st.ph = 'over'; st.winner = w; st.winReason = why; status();
      ctx.end({winner: w == null ? -1 : w, text: why === 'x' ? '吃掉了对方的枭！' : `牵鱼 ${st.fish[0]} : ${st.fish[1]}`, delay: 1400});
    }

    const inst = {
      st,
      toMove: () => st.over || st.ph === 'pass' ? null : st.turn,
      valid(a, by) {
        if (by !== st.turn) return false;
        if (a.t === 'throw') return st.ph === 'throw';
        if (a.t === 'move') return st.ph === 'move' && curMoves().some(m => m.i === a.i);
        return false;
      },
      sysMove() { return st.ph === 'pass' && !st.over ? {a: {t: 'pass'}, delay: 1300} : null; },
      apply(a, by) {
        if (a.t === 'throw') {
          if (st.ph !== 'throw') return;
          const sticks = []; for (let i = 0; i < 6; i++) sticks.push(ctx.rng() < .5 ? 1 : 0);
          const up = sticks.reduce((x, y) => x + y, 0);
          st.sticks = sticks; st.steps = up === 0 || up === 6 ? 6 : up; st.extra = up === 0 || up === 6;
          st.ph = legal(st, st.turn, st.steps).length ? 'move' : 'pass';
          st.bonus = st.extra;
          vis.throwT = now(); vis.throwSeed = Math.random() * 1000;
          if (!ctx.fast) { ctx.sfx('roll'); ctx.after(380, () => ctx.sfx('dice')); if (st.extra) ctx.after(800, () => { ctx.sfx('gong'); ctx.toast('满采！走六步再掷一次'); }); }
          sel = -1;
          const ms = legal(st, st.turn, st.steps); if (ms.length === 1) sel = ms[0].i;
        } else if (a.t === 'move') {
          if (st.ph !== 'move') return;
          const m = legal(st, st.turn, st.steps).find(x => x.i === a.i); if (!m) return;
          const side = st.turn, path = [];
          for (let p = m.from; p <= m.to; p++) path.push(p);
          const capK = m.cap >= 0 ? st.pc[1 - side][m.cap].k : null, capP = m.cap >= 0 ? st.pc[1 - side][m.cap].p : 0;
          const r = doMove(st, side, m);
          st.last = {side, i: m.i, from: m.from, to: m.to, cap: m.cap};
          if (!ctx.fast) {
            const mv = vis.mv = {side, i: m.i, path, k: 0, water: m.to >= WATER};
            ctx.anim(160 * (path.length - 1) + 60, k => mv.k = k, () => {
              if (vis.mv === mv) vis.mv = null;
              if (m.cap >= 0) { vis.poof = {nd: node(side, m.to), t0: now(), k: capK}; ctx.sfx(capK === 'x' ? 'boom' : 'capture'); }
              else ctx.sfx('place');
              if (r.fish) { vis.fishFx = {side, n: r.fish, t0: now()}; ctx.sfx('splash'); ctx.after(250, () => ctx.sfx('score')); }
            }, t => t);
            for (let s = 1; s < path.length - 1; s++) ctx.after(160 * s, () => ctx.sfx('tick'));
          }
          void capP;
          if (r.win) { finish(side, 'x'); return; }
          if (st.fish[side] >= goal) { finish(side, 'f'); return; }
          nextTurn(st.extra);
        } else if (a.t === 'pass') {
          if (st.ph !== 'pass') return;
          nextTurn(st.extra);
        }
        status();
      },
      aiMove(seat, level) {
        if (st.ph === 'throw') return {t: 'throw'};
        const ms = curMoves(); if (!ms.length) return null;
        if (level === 1) {
          const caps = ms.filter(m => m.cap >= 0 || m.to >= WATER);
          if (caps.length && Math.random() < .6) return {t: 'move', i: BX.pick(caps).i};
          return {t: 'move', i: BX.pick(ms).i};
        }
        const scored = ms.map(m => [m.i, scoreMove(st, seat, m, goal, level >= 3)]);
        return {t: 'move', i: BX.ai.byLevel(scored, level)};
      },
      onTurn: status,
      ready() { status(); },
      frame() {
        const g = cv.g; cv.clear(); const L = layout(), t = now();
        // table
        D.wood(g, 0, 0, L.W, L.H, {base: '#5a3420', dark: '#2a160b', seed: 21, grain: .22});
        // board: black lacquer with vermilion inlay
        const {bx, by, S} = L;
        g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = '#120b08'; D.rr(g, bx - 6, by - 6, S + 12, S + 12, 12); g.fill(); g.restore();
        const lg = g.createLinearGradient(bx, by, bx + S, by + S); lg.addColorStop(0, '#2a1a13'); lg.addColorStop(.5, '#1c120d'); lg.addColorStop(1, '#0f0907');
        g.fillStyle = lg; D.rr(g, bx, by, S, S, 8); g.fill();
        g.strokeStyle = '#c8a052'; g.lineWidth = 2; D.rr(g, bx + S * .02, by + S * .02, S * .96, S * .96, 6); g.stroke();
        g.strokeStyle = 'rgba(200,160,82,.35)'; g.lineWidth = 1; D.rr(g, bx + S * .035, by + S * .035, S * .93, S * .93, 5); g.stroke();
        // cloud scroll corners (decor)
        g.strokeStyle = 'rgba(194,58,43,.35)'; g.lineWidth = 1.5;
        for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const [x, y] = B2S(L, dx * .55, dy * .55); g.beginPath(); g.arc(x, y, S * .03, 0, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(x + S * .03, y, S * .015, Math.PI, Math.PI * 2.6); g.stroke();
        }
        const u = L.u, red = '#c23a2b';
        // ring path line
        g.strokeStyle = 'rgba(200,160,82,.35)'; g.lineWidth = Math.max(2, S * .008);
        { const [x0, y0] = B2S(L, -.8, -.8), [x1, y1] = B2S(L, .8, .8); g.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
        // T, L, V marks
        g.strokeStyle = red; g.lineWidth = Math.max(2.5, S * .014); g.lineCap = 'square';
        const line = (a, b, c, d) => { const [x0, y0] = B2S(L, a, b), [x1, y1] = B2S(L, c, d); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const px = -dy, py = dx;   // perpendicular
          line(dx * .2, dy * .2, dx * .36, dy * .36); line(dx * .36 + px * .1, dy * .36 + py * .1, dx * .36 - px * .1, dy * .36 - py * .1);   // T
          line(dx * .8 + px * .12, dy * .8 + py * .12, dx * .64 + px * .12, dy * .64 + py * .12); line(dx * .64 + px * .12, dy * .64 + py * .12, dx * .64 + px * .24, dy * .64 + py * .24);   // L
        }
        for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { line(dx * .92, dy * .92, dx * .66, dy * .66); line(dx * .66, dy * .66, dx * .66, dy * .82); line(dx * .66, dy * .66, dx * .82, dy * .66); }
        // center 水
        { const [x0, y0] = B2S(L, -.2, -.2), w = .4 * u; const qx = Math.min(x0, x0 + (flip() ? -w : w)), qy = Math.min(y0, y0 + (flip() ? -w : w));
          g.fillStyle = '#1f4f63'; g.fillRect(qx, qy, w, w);
          g.save(); g.beginPath(); g.rect(qx, qy, w, w); g.clip();
          g.strokeStyle = 'rgba(160,210,230,.35)'; g.lineWidth = 1.2;
          for (let i = 0; i < 6; i++) { g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = qy + w * (i + .5) / 6 + Math.sin(x * .12 + t / 400 + i) * 2; x ? g.lineTo(qx + x, y) : g.moveTo(qx, y); } g.stroke(); }
          const left = Math.max(0, 2 - 0); for (let j = 0; j < left; j++) fishShape(g, qx + w * (.3 + .4 * j) + Math.sin(t / 900 + j * 2) * w * .08, qy + w * (.35 + .3 * j), w * .13, '#f6e7c8', Math.sin(t / 700 + j) * .3 + (j ? Math.PI : 0));
          g.restore();
          g.strokeStyle = red; g.lineWidth = Math.max(2.5, S * .014); g.strokeRect(qx, qy, w, w);
          D.text(g, '水', qx + w / 2, qy + w * .14, {size: w * .16, color: 'rgba(246,231,200,.5)', font: 'serif', weight: 700});
        }
        // stations
        const sr = L.pr * .62;
        for (let r = 0; r < RING; r++) {
          const [x, y] = B2S(L, ...RING_XY[r]);
          g.fillStyle = SAFE.has(r) ? 'rgba(200,160,82,.35)' : 'rgba(246,231,200,.12)'; D.circle(g, x, y, sr); g.fill();
          g.strokeStyle = SAFE.has(r) ? '#c8a052' : 'rgba(246,231,200,.35)'; g.lineWidth = 1.2; g.stroke();
          D.text(g, NAMES[r], x, y + 1, {size: sr * .9, color: SAFE.has(r) ? 'rgba(230,197,125,.85)' : 'rgba(246,231,200,.45)', font: 'serif', weight: 700});
        }
        for (const s of [0, 1]) { const [x, y] = B2S(L, ...nodeXY(100 + s)); g.fillStyle = D.alpha(ctx.color(s) === '#2b2118' ? '#8a7a6a' : ctx.color(s), .3); D.circle(g, x, y, sr); g.fill(); g.strokeStyle = 'rgba(246,231,200,.4)'; g.stroke(); D.text(g, '楬', x, y + 1, {size: sr * .9, color: 'rgba(246,231,200,.55)', font: 'serif'}); }
        // entry arrows
        for (const s of [0, 1]) { const [x, y] = B2S(L, ...RING_XY[START[s]]); const [ax, ay] = B2S(L, ...RING_XY[(START[s] + 1) % RING]); g.strokeStyle = D.alpha(s ? '#e6dccb' : '#e0604c', .7); g.lineWidth = 2; const mx = (x + ax) / 2, my = (y + ay) / 2, dx = ax - x, dy = ay - y, l = Math.hypot(dx, dy); g.beginPath(); g.moveTo(mx - dx / l * 6 - dy / l * 5, my - dy / l * 6 + dx / l * 5); g.lineTo(mx + dx / l * 4, my + dy / l * 4); g.lineTo(mx - dx / l * 6 + dy / l * 5, my - dy / l * 6 - dx / l * 5); g.stroke(); }
        // trays
        for (const s of [0, 1]) {
          const T = trayRect(L, s);
          g.fillStyle = 'rgba(20,10,5,.45)'; D.rr(g, T.x, T.y, T.w, T.h, 10); g.fill();
          for (let j = 0; j < st.fish[s] && j < 12; j++) { const [fx, fy] = fishTrayXY(L, s, j); fishShape(g, fx, fy, L.S * .03, '#e6c57d', L.side ? 0 : -Math.PI / 2); }
          if (!L.side && L.S > 300) { const [lx, ly] = homeXY(L, s, 0); D.text(g, ctx.name(s), lx - L.S * .09, ly, {size: Math.min(14, L.S * .035), color: 'rgba(246,231,200,.65)', align: 'right', maxW: L.S * .14}); }
        }
        // last move trail
        if (st.last && !vis.mv) {
          const lm = st.last;
          if (lm.from > 0) { const [x, y] = pieceXY(L, lm.side, lm.i, lm.from); g.strokeStyle = 'rgba(230,197,125,.45)'; g.setLineDash([3, 3]); g.lineWidth = 1.5; D.circle(g, x, y, L.pr * .8); g.stroke(); g.setLineDash([]); }
        }
        // pieces
        const ms = curMoves(), mine = myTurn() && st.ph === 'move' && t - vis.throwT > 700;
        const movable = new Set(mine ? ms.map(m => m.i) : []);
        for (const s of [0, 1]) for (let i = 0; i < 6; i++) {
          const pc = st.pc[s][i];
          let [x, y] = pieceXY(L, s, i, pc.p);
          let lift = 0;
          if (vis.mv && vis.mv.side === s && vis.mv.i === i) {
            const path = vis.mv.path, f = vis.mv.k * (path.length - 1), j = Math.min(path.length - 2, Math.floor(f)), fr = f - j;
            const [ax, ay] = pieceXY(L, s, i, path[j]), [bx2, by2] = path[j + 1] >= WATER ? B2S(L, 0, 0) : pieceXY(L, s, i, path[j + 1]);
            x = BX.lerp(ax, bx2, fr); y = BX.lerp(ay, by2, fr); lift = Math.sin(fr * Math.PI) * L.pr * .7;
            if (vis.mv.k >= 1 && vis.mv.water) continue;
          }
          const isSel = s === st.turn && sel === i && mine;
          const glow = s === st.turn && movable.has(i);
          if (glow) { const a = .45 + .3 * Math.sin(t / 220); g.fillStyle = `rgba(255,215,106,${a * .5})`; D.circle(g, x, y, L.pr * 1.15); g.fill(); }
          blockPiece(g, x, y - lift, L.pr * (pc.k === 'x' ? 1.08 : .9), ctx.color(s), pc.k === 'x' ? '枭' : '散', pc.k === 'x', isSel);
        }
        // selected target
        if (mine) {
          const showT = ms.filter(m => m.i === sel);
          for (const m of showT) {
            const [x, y] = m.to >= WATER ? B2S(L, 0, 0) : pieceXY(L, st.turn, m.i, m.to);
            const a = .55 + .3 * Math.sin(t / 200);
            g.strokeStyle = m.cap >= 0 ? `rgba(255,90,70,${a})` : `rgba(120,230,170,${a})`; g.lineWidth = 3; D.circle(g, x, y, L.pr * (m.to >= WATER ? 1.5 : 1.05)); g.stroke();
            if (m.to >= WATER) D.text(g, '牵鱼', x, y + L.pr * 1.9, {size: L.pr * .8, color: '#e6c57d', weight: 800, stroke: '#000a', strokeW: 3});
            else if (m.cap >= 0) D.text(g, '吃', x, y - L.pr * 1.5, {size: L.pr * .8, color: '#ff8a70', weight: 900, stroke: '#000a', strokeW: 3});
          }
        }
        // capture poof
        if (vis.poof) {
          const k = (t - vis.poof.t0) / 700; if (k >= 1) vis.poof = null; else {
            const [x, y] = B2S(L, ...nodeXY(vis.poof.nd)); g.strokeStyle = `rgba(255,140,90,${1 - k})`; g.lineWidth = 3;
            for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4, r0 = L.pr * (.6 + k * 1.2); g.beginPath(); g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); g.lineTo(x + Math.cos(an) * (r0 + L.pr * .5), y + Math.sin(an) * (r0 + L.pr * .5)); g.stroke(); }
          }
        }
        if (vis.fishFx) {
          const k = (t - vis.fishFx.t0) / 1200; if (k >= 1) vis.fishFx = null; else {
            const [x, y] = B2S(L, 0, 0); g.globalAlpha = 1 - k;
            D.text(g, '牵鱼 +' + vis.fishFx.n, x, y - L.pr * (1 + k * 2), {size: L.pr * 1.1, color: '#ffe08a', weight: 900, font: 'serif', stroke: '#2a1206', strokeW: 4});
            g.globalAlpha = 1;
          }
        }
        drawPanel(g, L, t);
      },
    };
    function drawPanel(g, L, t) {
      const P = L.panel;
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; D.paper(g, P.x, P.y, P.w, P.h, {r: 14, color: '#efe0bd'}); g.restore();
      g.strokeStyle = 'rgba(122,28,18,.5)'; g.lineWidth = 1.5; D.rr(g, P.x + 4, P.y + 4, P.w - 8, P.h - 8, 10); g.stroke();
      // score
      const Sc = L.score, colw = Sc.w / 2;
      for (const s of [0, 1]) {
        const x = Sc.x + s * colw, cy = Sc.y + Math.min(Sc.h * .5, 20), turn = st.turn === s && !st.over;
        if (turn) { g.fillStyle = 'rgba(178,58,43,.14)'; D.rr(g, x + 2, Sc.y, colw - 4, Math.min(Sc.h, 40), 8); g.fill(); }
        g.fillStyle = ctx.color(s); D.rr(g, x + 8, cy - 7, 12, 14, 3); g.fill();
        D.text(g, ctx.name(s), x + 26, cy, {size: 13, color: C.ink, align: 'left', maxW: colw * .5});
        for (let j = 0; j < goal; j++) fishShape(g, x + colw - 12 - j * Math.min(16, colw * .4 / goal), cy, 6, j < st.fish[s] ? '#c8a052' : 'rgba(43,33,24,.18)', -Math.PI / 2);
      }
      if (L.land) {
        const capY = Sc.y + 46;
        D.text(g, '吃枭即胜 · 散不犯枭 · 角“高”为安全位', P.x + P.w / 2, capY, {size: 11, color: C.ink2, maxW: P.w - 16});
      }
      // sticks
      const Sk = L.sticks, k = st.sticks ? BX.clamp((t - vis.throwT) / 650, 0, 1) : 1;
      g.fillStyle = 'rgba(80,50,20,.08)'; D.rr(g, Sk.x, Sk.y, Sk.w, Sk.h, 10); g.fill();
      g.save(); D.rr(g, Sk.x, Sk.y, Sk.w, Sk.h, 10); g.clip();
      const sh = Math.min(Sk.h / 7.4, 16), sw = Math.min(Sk.w * .82, sh * 14);
      for (let i = 0; i < 6; i++) {
        const face = st.sticks ? st.sticks[i] : i % 2;
        const cy = Sk.y + Sk.h * (i + .7) / 6.4, cx = Sk.x + Sk.w / 2;
        const sd = vis.throwSeed + i * 13.7, e = 1 - k;
        const ox = Math.sin(sd) * Sk.w * .12 * e, oy = -Math.abs(Math.sin(sd * 1.7)) * Sk.h * .3 * e, rot = Math.sin(sd * 2.3) * .22 * e + (Math.sin(sd * 3.1) * .04);
        const showFace = k < 1 ? (Math.floor((t / 70) + i) % 2) : face;
        stick(g, cx + ox, cy + oy, sw, sh, rot, !!showFace);
      }
      g.restore();
      // result
      if (st.sticks && k >= 1 && st.ph !== 'throw' || (st.sticks && st.ph === 'throw' && st.extra)) {
        const up = st.sticks.reduce((a, b) => a + b, 0);
        const txt = st.ph === 'throw' && st.extra ? '满采 · 再掷' : (up === 0 || up === 6 ? '满采 六步' : '有纹 ' + up + ' · 行 ' + st.steps + ' 步');
        D.text(g, txt, L.res.x, L.res.y, {size: L.land ? 18 : 14, color: up === 0 || up === 6 ? C.red : C.ink, font: 'serif', weight: 800, maxW: L.land ? P.w - 20 : L.btn.w + 20});
      }
      // button
      const b = L.btn, can = myTurn() && st.ph === 'throw';
      const lbl = st.over ? '终局' : st.ph === 'throw' ? (can ? '掷 箸' : '对方掷箸') : st.ph === 'pass' ? '无棋可走' : (myTurn() ? '选择棋子' : '对方行棋');
      g.globalAlpha = can || st.ph === 'move' && myTurn() ? 1 : .55;
      g.fillStyle = '#6e1d14'; D.rr(g, b.x, b.y + 4, b.w, b.h - 4, 12); g.fill();
      const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, can ? '#d0533f' : '#a8803a'); gr.addColorStop(1, can ? '#a33022' : '#7a5a2a');
      g.fillStyle = gr; D.rr(g, b.x, b.y, b.w, b.h - 5, 12); g.fill();
      if (can) { const a = .3 + .3 * Math.sin(t / 250); g.strokeStyle = `rgba(255,215,106,${a})`; g.lineWidth = 3; D.rr(g, b.x - 2, b.y - 2, b.w + 4, b.h, 13); g.stroke(); }
      D.text(g, lbl, b.x + b.w / 2, b.y + (b.h - 5) / 2, {size: Math.min(22, b.h * .4), color: '#fff3e3', font: 'deco', weight: 400, maxW: b.w - 10});
      g.globalAlpha = 1;
    }
    status();
    return inst;
  },
});

/* ---------- shared drawing ---------- */
function blockPiece(g, x, y, r, color, ch, big, sel) {
  const w = r * 1.5, h = r * (big ? 1.7 : 1.45), dz = r * .32;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.4)'; D.rr(g, x - w / 2 + 2, y - h / 2 + dz + 3, w, h, r * .2); g.fill();
  g.fillStyle = D.shade(color === '#2b2118' ? '#3a3028' : color, -35); D.rr(g, x - w / 2, y - h / 2 + dz, w, h, r * .2); g.fill();
  const top = color === '#2b2118' ? '#3e342b' : color;
  const gr = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); gr.addColorStop(0, D.shade(top, 22)); gr.addColorStop(1, D.shade(top, -10));
  g.fillStyle = gr; D.rr(g, x - w / 2, y - h / 2, w, h, r * .2); g.fill();
  g.strokeStyle = big ? '#e6c57d' : 'rgba(246,231,200,.45)'; g.lineWidth = big ? Math.max(1.5, r * .1) : 1; D.rr(g, x - w / 2 + r * .12, y - h / 2 + r * .12, w - r * .24, h - r * .24, r * .12); g.stroke();
  D.text(g, ch, x, y + r * .03, {size: r * (big ? .95 : .8), color: big ? '#ffe7a8' : '#f6e7c8', font: 'serif', weight: 900});
  if (sel) { g.strokeStyle = '#ffd76a'; g.lineWidth = 3; D.rr(g, x - w / 2 - 4, y - h / 2 - 4, w + 8, h + dz + 8, r * .3); g.stroke(); }
  g.restore();
}
function stick(g, x, y, w, h, rot, face) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,.25)'; D.rr(g, -w / 2 + 2, -h / 2 + 3, w, h, h / 2); g.fill();
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
  if (face) { gr.addColorStop(0, '#d9a85a'); gr.addColorStop(1, '#a8723d'); } else { gr.addColorStop(0, '#f3e6c4'); gr.addColorStop(1, '#d8c494'); }
  g.fillStyle = gr; D.rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill();
  g.strokeStyle = 'rgba(80,50,20,.4)'; g.lineWidth = 1; g.stroke();
  if (face) {
    g.fillStyle = '#7a1c12';
    for (let i = -2; i <= 2; i++) { g.save(); g.translate(i * w * .16, 0); g.rotate(.6); g.fillRect(-h * .12, -h * .32, h * .24, h * .64); g.restore(); }
    g.fillStyle = '#1b1510'; g.fillRect(-w * .46, -h * .1, w * .06, h * .2); g.fillRect(w * .4, -h * .1, w * .06, h * .2);
  } else { g.strokeStyle = 'rgba(120,90,40,.25)'; g.beginPath(); g.moveTo(-w * .4, 0); g.lineTo(w * .4, 0); g.stroke(); }
  g.restore();
}
function fishShape(g, x, y, s, color, rot) {
  g.save(); g.translate(x, y); g.rotate(rot || 0);
  g.fillStyle = color; g.beginPath(); g.ellipse(0, 0, s, s * .45, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(-s * .8, 0); g.lineTo(-s * 1.5, -s * .45); g.lineTo(-s * 1.5, s * .45); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.6)'; D.circle(g, s * .5, -s * .08, s * .1); g.fill();
  g.restore();
}
