/* 飞行棋 — classic Chinese aeroplane chess on a 15×15 cross board.
   Progress d per plane: -1 hangar, 0 take-off spot, 1..51 outer track, 52..56 home runway, 57 home (center). */
const D = BX.draw, C = BX.C;
const KC = ['#c23a2b', '#d9a12b', '#2f5d8a', '#3f8f5b'];          // board colour by position (clockwise: 红 黄 蓝 绿)
const KN = ['红', '黄', '蓝', '绿'];
const SEAT_POS = {2: [0, 2], 3: [0, 2, 1], 4: [0, 2, 1, 3]};
const HOME = 57, FLY_FROM = 19, FLY_TO = 31;
/* 52-square track (cell coords) starting at red's entry square */
const PATH = [];
(function () {
  const seg = (x0, y0, dx, dy, n) => { for (let k = 0; k < n; k++) PATH.push([x0 + dx * k, y0 + dy * k]); };
  seg(1, 6, 1, 0, 5); seg(6, 5, 0, -1, 6); seg(7, 0, 0, 0, 1); seg(8, 0, 0, 1, 6); seg(9, 6, 1, 0, 6); seg(14, 7, 0, 0, 1);
  seg(14, 8, -1, 0, 6); seg(8, 9, 0, 1, 6); seg(7, 14, 0, 0, 1); seg(6, 14, 0, -1, 6); seg(5, 8, -1, 0, 6); seg(0, 7, 0, 0, 1); seg(0, 6, 0, 0, 1);
})();
const trackColor = i => (((i - 2) % 4) + 4) % 4;
const absIdx = (pos, d) => (13 * pos + d - 1) % 52;
const isOwn = d => d >= 1 && d <= 51 && d % 4 === 3;
/* continuous board coordinates (0..15) of a plane */
const rot = (p, k) => { let [x, y] = p; for (let i = 0; i < k; i++) [x, y] = [15 - y, x]; return [x, y]; };
const HANGAR = [[1.55, 1.55], [3.45, 1.55], [1.55, 3.45], [3.45, 3.45]];
const FINISH = [[6.42, 7.08], [6.42, 7.92], [6.88, 7.32], [6.88, 7.68]];
function xy(pos, d, i) {
  if (d < 0) return rot(HANGAR[i], pos);
  if (d === 0) return rot([0.5, 5.5], pos);
  if (d <= 51) { const c = PATH[absIdx(pos, d)]; return [c[0] + .5, c[1] + .5]; }
  if (d < HOME) return rot([d - 51 + .5, 7.5], pos);
  return rot(FINISH[i], pos);
}
/* resolve a move: returns {d, path:[d...], caps:[[seat,i]], events:[]} without mutating */
function resolve(pl, posOf, n, s, i, r, takeoff5) {
  const pos = posOf[s], d0 = pl[s][i], path = [], ev = [];
  if (d0 < 0) return {d: 0, path: [0], caps: [], ev: ['takeoff']};
  let d = d0;
  for (let k = 1; k <= r; k++) { const nd = d0 + k <= HOME ? d0 + k : HOME - (d0 + k - HOME); path.push(nd); }
  d = path[path.length - 1];
  if (d0 + r > HOME) ev.push('bounce');
  const caps = [];
  const hit = (dd) => {
    if (dd < 1 || dd > 51) return;
    const a = absIdx(pos, dd);
    for (let q = 0; q < n; q++) if (q !== s) pl[q].forEach((qd, j) => { if (qd >= 1 && qd <= 51 && absIdx(posOf[q], qd) === a && !caps.some(c => c[0] === q && c[1] === j)) caps.push([q, j]); });
  };
  hit(d);
  if (d0 + r <= HOME && d <= 51) {
    if (d === FLY_FROM) {
      flyOver(); d = FLY_TO; path.push(d); hit(d); ev.push('fly');
      d = FLY_TO + 4; path.push(d); hit(d); ev.push('jump');
    } else if (isOwn(d) && d + 4 <= 51) {
      d += 4; path.push(d); hit(d); ev.push('jump');
      if (d === FLY_FROM) { flyOver(); d = FLY_TO; path.push(d); hit(d); ev.push('fly'); }
    }
  }
  function flyOver() {   // planes on the crossed runway square (opposite colour, d=56) are knocked out too
    const op = (pos + 2) % 4;
    for (let q = 0; q < n; q++) if (q !== s && posOf[q] === op) pl[q].forEach((qd, j) => { if (qd === 56) caps.push([q, j]); });
  }
  return {d, path, caps, ev};
}

BX.register({
  id: 'ludo', title: '飞行棋', cat: 'party', order: 1, sub: '掷骰起飞，先回家者胜',
  desc: '经典飞行棋：红黄蓝绿四色飞机从机场起飞，绕场一周飞回终点。踩到同色格可以跳，遇到飞棋点能沿虚线飞越，还能把对手撞回机场！',
  kind: 'turn', seats: [2, 4], defSeats: 4, seatColors: [KC[0], KC[2], KC[1], KC[3]], seatNames: ['红方', '蓝方', '黄方', '绿方'], firstLabel: '先掷', aiDelay: 650, anyTimeActs: true,
  options: [{key: 'take', label: '起飞', choices: [[6, '掷 6 起飞'], [5, '5 或 6 起飞']], def: 6}],
  rules: `<p>每人四架飞机停在自己颜色的<b>机场</b>。轮到你时点骰子掷骰：</p>
<ul><li><b>起飞</b>：掷出 6 点（选项可改为 5 或 6 点）才能让一架飞机从机场飞到<b>起飞点</b>；之后从起飞点出发沿顺时针绕场飞行。</li>
<li><b>奖励</b>：掷出 6 点可以再掷一次；但<b>连续第三次掷出 6 点</b>，则上一步走动的那架飞机被罚回机场，并结束本回合。</li>
<li><b>跳子</b>：走完点数正好停在<b>自己颜色</b>的格子上，可以再向前跳到下一个同色格。</li>
<li><b>飞棋</b>：停在自己颜色的<b>飞棋点</b>（带箭头的格），沿虚线飞越对面颜色的跑道，到达虚线另一端，再跳一格；跳子后正好到飞棋点也可以飞。飞越时，停在被横穿的那格跑道上的对手飞机会被撞回机场。</li>
<li><b>撞子</b>：停下的格子上有对手的飞机（不论几架），都被撞回各自机场。自己的飞机可以停在同一格。</li>
<li><b>回家</b>：绕场一周后转入自己颜色的跑道，必须<b>正好</b>走到中心终点；点数多出来的部分要倒退回来。</li></ul>
<p>没有可以走的飞机时本次掷骰作废。只有一种走法时会自动走。<b>最先让四架飞机全部到达终点的玩家获胜</b>，其余玩家按飞行进度排名。</p>
<p>操作：点右侧（或下方）的骰子掷骰，再点闪光的飞机走棋。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 4, base: '#c99a5e'});
    const s = h / 15 * 1.05, ox = (w - 15 * s) / 2, oy = (h - 15 * s) / 2;
    for (let k = 0; k < 4; k++) { const [x, y] = rot([0, 0], k); g.fillStyle = KC[k]; const X = Math.min(x, x - 6 * (x > 7 ? 1 : 0)); }
    [[0, 0, 0], [9, 0, 1], [9, 9, 2], [0, 9, 3]].forEach(([x, y, k]) => { g.fillStyle = KC[k]; D.rr(g, ox + x * s + 2, oy + y * s + 2, 6 * s - 4, 6 * s - 4, s); g.fill(); g.fillStyle = 'rgba(255,250,235,.35)'; D.rr(g, ox + x * s + s, oy + y * s + s, 4 * s, 4 * s, s * .6); g.fill(); });
    PATH.forEach(([x, y], i) => { g.fillStyle = KC[trackColor(i)]; D.rr(g, ox + x * s + .8, oy + y * s + .8, s - 1.6, s - 1.6, 2); g.fill(); });
    for (let k = 0; k < 4; k++) { g.fillStyle = KC[k]; g.beginPath(); const c = [[6, 6], [6, 9], [7.5, 7.5]].map(p => rot(p, k)); g.moveTo(ox + c[0][0] * s, oy + c[0][1] * s); g.lineTo(ox + c[1][0] * s, oy + c[1][1] * s); g.lineTo(ox + c[2][0] * s, oy + c[2][1] * s); g.fill(); for (let d = 52; d < 57; d++) { const [x, y] = xy(k, d, 0); D.rr(g, ox + (x - .5) * s + .8, oy + (y - .5) * s + .8, s - 1.6, s - 1.6, 2); g.fill(); } }
    planeShape(g, ox + 3 * s, oy + 3 * s, s * 2.2, KC[0], .8);
    planeShape(g, ox + 12 * s, oy + 12 * s, s * 2.2, KC[2], -2.3);
    planeShape(g, ox + 12 * s, oy + 3 * s, s * 1.6, KC[1], 2.4);
    D.die(g, w * .5 - s * 1.6, h * .5 - s * 1.6, s * 3.2, 6, {rot: .25});
  },
  create(ctx) {
    const n = ctx.n, posOf = SEAT_POS[n], t5 = +ctx.opts.take === 5;
    const seatAt = k => posOf.indexOf(k);
    const st = {pl: BX.range(n).map(() => [-1, -1, -1, -1]), turn: 0, phase: 'roll', die: 0, sixes: 0, lastMoved: -1, pending: null, last: null, msg: '', over: false, rank: null};
    const cv = ctx.canvas();
    const vis = {};           // visual tweens: key s*4+i -> {pts:[[x,y]], k}
    let roll = {k: 1, faces: [1, 1]}, t = 0, btnDie = null, flash = null;
    const myTurn = () => !st.over && ctx.canAct(st.turn);
    const canTake = r => r === 6 || (t5 && r === 5);
    const nextSeat = s => { for (let k = 1; k <= 4; k++) { const q = seatAt((posOf[s] + k) % 4); if (q >= 0) return q; } return s; };
    function options(s, r) {
      const out = [], seen = new Set();
      st.pl[s].forEach((d, i) => {
        if (d === HOME || (d < 0 && !canTake(r))) return;
        const key = d < 0 ? 'h' : 'd' + d; if (seen.has(key)) return; seen.add(key); out.push(i);
      });
      return out;
    }
    /* ---------- layout ---------- */
    function layout() {
      const W = cv.w, H = cv.h, land = W > H * 1.15;
      if (land) { const bs = Math.min(H - 12, W - 150); const pw = Math.min(260, W - bs - 18); const tot = bs + pw + 10, x0 = (W - tot) / 2; return {land, B: {x: x0, y: (H - bs) / 2, s: bs}, P: {x: x0 + bs + 10, y: (H - bs) / 2, w: pw, h: bs}}; }
      const ph = Math.max(118, Math.min(170, H * .2)), bs = Math.min(W - 12, H - ph - 14), y0 = (H - bs - ph - 8) / 2;
      return {land, B: {x: (W - bs) / 2, y: y0, s: bs}, P: {x: (W - bs) / 2, y: y0 + bs + 8, w: bs, h: ph}};
    }
    const toScr = (B, p) => [B.x + p[0] * B.s / 15, B.y + p[1] * B.s / 15];
    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn()) return;
      const p = cv.pos(e), L = layout(), B = L.B, cell = B.s / 15;
      if (st.phase === 'roll') {
        const b = btnDie; if (b && p.x >= b.x - 10 && p.x <= b.x + b.w + 10 && p.y >= b.y - 10 && p.y <= b.y + b.h + 10) { ctx.act({t: 'roll'}, st.turn); return; }
        // tapping anywhere on the panel also rolls
        if (p.x >= L.P.x && p.x <= L.P.x + L.P.w && p.y >= L.P.y && p.y <= L.P.y + L.P.h) { ctx.act({t: 'roll'}, st.turn); return; }
        return;
      }
      if (st.phase === 'move') {
        const opts = options(st.turn, st.die); let best = -1, bd = Math.max(cell * 1.4, 30);
        for (const i of opts) {
          const d = st.pl[st.turn][i];
          const cand = d < 0 ? st.pl[st.turn].map((dd, j) => dd < 0 ? j : -1).filter(j => j >= 0) : [i];
          for (const j of cand) { const [x, y] = toScr(B, xy(posOf[st.turn], st.pl[st.turn][j], j)); const dd = Math.hypot(p.x - x, p.y - y); if (dd < bd) { bd = dd; best = i; } }
        }
        if (best >= 0) ctx.act({t: 'move', p: best}, st.turn); else ctx.sfx('error');
      }
    });
    /* ---------- status ---------- */
    const done = s => st.pl[s].filter(d => d === HOME).length;
    const status = () => {
      for (let s = 0; s < n; s++) ctx.info(s, '到达 ' + done(s) + '/4');
      if (st.over) return ctx.status('<b>' + ctx.name(st.rank[0]) + '</b> 四机全部到达');
      const who = myTurn() ? (ctx.hotseat ? ctx.name(st.turn) + '：' : '轮到你：') : ctx.name(st.turn) + ' ';
      const dot = '<span style="color:' + ctx.color(st.turn) + '">✈</span> ';
      const ph = st.phase === 'roll' ? (myTurn() ? '点骰子掷骰' : '掷骰中…') : st.phase === 'move' ? (myTurn() ? '掷出 ' + st.die + '，点选要走的飞机' : '掷出 ' + st.die + '，思考中…') : (st.msg || '');
      ctx.status(dot + who + ph);
    };
    /* ---------- AI ---------- */
    function threat(s, pos, dd, deep) {
      if (dd < 1 || dd > 51) return 0;
      const a = absIdx(pos, dd); let th = 0;
      for (let q = 0; q < n; q++) {
        if (q === s) continue; const qp = posOf[q];
        st.pl[q].forEach(qd => {
          if (qd < 0 || qd > 51) return;
          let ways = 0;
          for (let r = 1; r <= 6; r++) {
            let x = qd + r; if (x > 51) continue;
            if (absIdx(qp, x) === a) { ways++; continue; }
            if (deep) { if (x === FLY_FROM) { if (absIdx(qp, FLY_TO) === a || absIdx(qp, FLY_TO + 4) === a) ways++; } else if (isOwn(x) && x + 4 <= 51) { if (absIdx(qp, x + 4) === a) ways++; else if (x + 4 === FLY_FROM && absIdx(qp, FLY_TO) === a) ways++; } }
          }
          th += ways / 6;
        });
      }
      return th;
    }
    function scoreMove(s, i, lvl) {
      const pos = posOf[s], d0 = st.pl[s][i], R = resolve(st.pl, posOf, n, s, i, st.die, t5), d = R.d;
      let v = 0;
      if (d0 < 0) v += 28 + (lvl >= 3 ? 4 * st.pl[s].filter(x => x < 0).length - 6 * st.pl[s].filter(x => x >= 0 && x < HOME).length : 0);
      else v += (d - d0) * 1.0;
      if (d === HOME) v += 45;
      else if (d >= 52 && d0 <= 51) v += 22;
      for (const [q, j] of R.caps) v += 40 + Math.max(0, st.pl[q][j]) * (lvl >= 3 ? .6 : .3);
      if (R.ev.includes('fly')) v += 6; if (R.ev.includes('jump')) v += 3;
      if (R.ev.includes('bounce')) v -= 4;
      const deep = lvl >= 3;
      v -= threat(s, pos, d, deep) * (lvl >= 3 ? 34 : 22) * (d >= 1 && d <= 51 ? 1 + Math.max(0, d) / 80 : 0);
      if (lvl >= 3 && d0 >= 1 && d0 <= 51) v += threat(s, pos, d0, true) * 26 * (1 + d0 / 80);
      if (lvl >= 3 && d0 >= 52 && d < HOME) v -= 3;          // don't waste rolls in the runway
      return v;
    }
    /* ---------- apply ---------- */
    function animMove(s, i, path, d0) {
      const pos = posOf[s], pts = [xy(pos, d0, i)].concat(path.map(d => xy(pos, d, i)));
      const v = vis[s * 4 + i] = {pts, k: 0}; ctx.anim(Math.min(1400, 120 * path.length + 80), k => v.k = k, () => { if (vis[s * 4 + i] === v) delete vis[s * 4 + i]; }, x => x);
    }
    function animHome(q, j, from) {
      const v = vis[q * 4 + j] = {pts: [from, xy(posOf[q], -1, j)], k: 0, delayK: .35};
      ctx.anim(900, k => v.k = k, () => { if (vis[q * 4 + j] === v) delete vis[q * 4 + j]; }, BX.ease.inOut);
    }
    function endTurn(again) {
      st.pending = null;
      if (again) { st.phase = 'roll'; return; }
      st.sixes = 0; st.lastMoved = -1; st.turn = nextSeat(st.turn); st.phase = 'roll';
    }
    const inst = {
      st,
      toMove: () => st.over || st.phase === 'wait' ? null : st.turn,
      valid(a, by) {
        if (by !== st.turn || st.over) return false;
        if (a.t === 'roll') return st.phase === 'roll';
        if (a.t === 'move') return st.phase === 'move' && options(st.turn, st.die).includes(a.p);
        return false;
      },
      sysMove: () => !st.over && st.phase === 'wait' && st.pending ? {a: st.pending, delay: st.pending.t === 'pass' ? 1000 : 600} : null,
      apply(a, by) {
        const s = st.turn;
        if (a.t === 'roll') {
          const r = 1 + ctx.rng.int(6); st.die = r; st.msg = '';
          roll = {k: 0, faces: [1 + Math.floor(Math.random() * 6), r]}; const rr = roll; ctx.anim(520, k => rr.k = k, null, BX.ease.out); ctx.sfx('dice');
          if (r === 6) st.sixes++; else st.sixes = 0;
          if (st.sixes === 3) {
            const lm = st.lastMoved;
            if (lm >= 0 && st.pl[s][lm] !== HOME && st.pl[s][lm] >= 0) { const from = xy(posOf[s], st.pl[s][lm], lm); st.pl[s][lm] = -1; animHome(s, lm, from); }
            st.msg = '连掷三个 6，飞机被罚回机场！'; ctx.toast('连掷三个 6，罚回机场'); ctx.sfx('buzz');
            st.phase = 'wait'; st.pending = {t: 'pass', again: false}; status(); return;
          }
          const op = options(s, r);
          if (!op.length) { st.phase = 'wait'; st.pending = {t: 'pass', again: r === 6}; st.msg = r === 6 ? '掷出 6 点但无棋可走，再掷一次' : '掷出 ' + r + ' 点，无棋可走'; }
          else if (op.length === 1) { st.phase = 'wait'; st.pending = {t: 'move', p: op[0]}; st.msg = '掷出 ' + r + ' 点'; }
          else st.phase = 'move';
          status(); return;
        }
        if (a.t === 'pass') { endTurn(a.again); status(); return; }
        if (a.t === 'move') {
          const i = a.p, d0 = st.pl[s][i], R = resolve(st.pl, posOf, n, s, i, st.die, t5);
          st.pl[s][i] = R.d; st.lastMoved = i; st.last = {s, i};
          animMove(s, i, R.path, d0);
          ctx.sfx(d0 < 0 ? 'whoosh' : 'move');
          if (R.ev.includes('fly')) ctx.after(300, () => ctx.sfx('whoosh'));
          if (R.caps.length) {
            for (const [q, j] of R.caps) { const from = xy(posOf[q], st.pl[q][j], j); st.pl[q][j] = -1; animHome(q, j, from); }
            ctx.after(Math.min(900, 110 * R.path.length), () => ctx.sfx('crash'));
            flash = {txt: '撞子！', t: 1.2, c: ctx.color(s)};
          } else if (R.ev.includes('fly')) flash = {txt: '飞棋！', t: 1, c: ctx.color(s)};
          else if (R.ev.includes('jump')) flash = {txt: '跳子', t: .8, c: ctx.color(s)};
          if (R.d === HOME) { ctx.after(Math.min(900, 110 * R.path.length), () => ctx.sfx('score')); flash = {txt: '到达终点', t: 1, c: ctx.color(s)}; }
          if (done(s) === 4) {
            st.over = true; st.phase = 'over';
            const prog = q => st.pl[q].reduce((a2, d) => a2 + (d < 0 ? -2 : d), 0);
            st.rank = [s].concat(BX.range(n).filter(q => q !== s).sort((x, y) => (done(y) - done(x)) || (prog(y) - prog(x))));
            status();
            ctx.end({winner: s, delay: 1500, text: st.rank.map((q, k) => '第' + '一二三四'[k] + '名 ' + ctx.name(q) + '（' + done(q) + '/4）').join('　')});
            return;
          }
          endTurn(st.die === 6); status();
        }
      },
      aiMove(s, lvl) {
        if (st.phase === 'roll') return {t: 'roll'};
        const op = options(s, st.die);
        if (lvl === 1) {
          if (Math.random() < .5) return {t: 'move', p: op[Math.floor(Math.random() * op.length)]};
          return {t: 'move', p: BX.ai.byLevel(op.map(i => [i, scoreMove(s, i, 1) + Math.random() * 25]), 1)};
        }
        return {t: 'move', p: BX.ai.byLevel(op.map(i => [i, scoreMove(s, i, lvl)]), lvl)};
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); t += dt;
        const L = layout(), B = L.B, cs = B.s / 15;
        const S = p => toScr(B, p);
        /* board */
        g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, B.x + 4, B.y + 8, B.s, B.s, cs * .6); g.fill();
        D.wood(g, B.x, B.y, B.s, B.s, {r: cs * .6, seed: 4, base: '#c99a5e', dark: '#7a4a24'});
        D.paper(g, B.x + cs * .15, B.y + cs * .15, B.s - cs * .3, B.s - cs * .3, {r: cs * .5, color: '#f4e8cc'});
        // hangars
        for (let k = 0; k < 4; k++) {
          const used = seatAt(k) >= 0, c = KC[k];
          const a = S(rot([.35, .35], k)), b = S(rot([4.65, 4.65], k));
          const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
          g.fillStyle = used ? c : D.alpha(c, .35); D.rr(g, x, y, w, h, cs * .7); g.fill();
          g.fillStyle = 'rgba(255,250,235,.28)'; D.rr(g, x + cs * .3, y + cs * .3, w - cs * .6, h - cs * .6, cs * .5); g.fill();
          for (let i = 0; i < 4; i++) { const [px, py] = S(rot(HANGAR[i], k)); g.fillStyle = 'rgba(255,255,255,.55)'; D.circle(g, px, py, cs * .62); g.fill(); g.strokeStyle = D.shade(c, -25); g.lineWidth = 1.5; g.stroke(); }
          // take-off spot
          const [tx, ty] = S(rot([.5, 5.5], k)); g.fillStyle = D.alpha(c, used ? .9 : .4); D.circle(g, tx, ty, cs * .44); g.fill(); g.strokeStyle = '#fff6e0'; g.lineWidth = 1.5; g.stroke();
          D.text(g, '起', tx, ty + 1, {size: cs * .48, color: '#fff', weight: 900, font: 'serif'});
          // seat name in the hangar corner
          const q = seatAt(k);
          if (q >= 0) { const [nx, ny] = S(rot([2.5, 4.95], k)); D.text(g, KN[k] + (st.turn === q && !st.over ? ' ◀' : ''), nx, ny, {size: Math.max(10, cs * .45), color: D.shade(c, -40), weight: 800}); }
        }
        // track
        PATH.forEach(([x, y], i) => {
          const k = trackColor(i), [px, py] = S([x, y]);
          g.fillStyle = KC[k]; D.rr(g, px + 1, py + 1, cs - 2, cs - 2, cs * .22); g.fill();
          g.fillStyle = 'rgba(255,255,255,.18)'; D.rr(g, px + 2, py + 2, cs - 4, (cs - 4) * .45, cs * .18); g.fill();
        });
        // fly lines + markers
        for (let k = 0; k < 4; k++) {
          const a = S(xy(k, FLY_FROM, 0)), b = S(xy(k, FLY_TO, 0));
          g.strokeStyle = KC[k]; g.lineWidth = Math.max(2, cs * .12); g.setLineDash([cs * .22, cs * .16]);
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]);
          const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          g.save(); g.translate(a[0], a[1]); g.rotate(ang); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cs * .3, 0); g.lineTo(-cs * .15, -cs * .22); g.lineTo(-cs * .15, cs * .22); g.fill(); g.restore();
        }
        // runways + center
        for (let k = 0; k < 4; k++) {
          for (let d = 52; d < HOME; d++) { const [x, y] = S(xy(k, d, 0)); g.fillStyle = KC[k]; D.rr(g, x - cs / 2 + 1, y - cs / 2 + 1, cs - 2, cs - 2, cs * .22); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; D.circle(g, x, y, cs * .12); g.fill(); }
          const tri = [[6, 6], [6, 9], [7.5, 7.5]].map(p => S(rot(p, k)));
          g.fillStyle = KC[k]; g.beginPath(); g.moveTo(...tri[0]); g.lineTo(...tri[1]); g.lineTo(...tri[2]); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255,250,235,.8)'; g.lineWidth = 1.5; g.stroke();
          // turn-in arrow on the last outer square
          const [ax, ay] = S(xy(k, 51, 0)), [bx, by] = S(xy(k, 52, 0)), an = Math.atan2(by - ay, bx - ax);
          g.save(); g.translate(ax, ay); g.rotate(an); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(cs * .28, 0); g.lineTo(-cs * .12, -cs * .2); g.lineTo(-cs * .12, cs * .2); g.fill(); g.restore();
        }
        const [ccx, ccy] = S([7.5, 7.5]); g.fillStyle = '#f4e8cc'; D.circle(g, ccx, ccy, cs * .42); g.fill(); D.text(g, '家', ccx, ccy + 1, {size: cs * .5, color: C.red, font: 'serif', weight: 900});
        /* planes */
        const movable = st.phase === 'move' && myTurn() ? options(st.turn, st.die) : [];
        const movSet = new Set();
        for (const i of movable) { if (st.pl[st.turn][i] < 0) st.pl[st.turn].forEach((d, j) => { if (d < 0) movSet.add(j); }); else st.pl[st.turn].forEach((d, j) => { if (d === st.pl[st.turn][i]) movSet.add(j); }); }
        const stackCount = {};
        const items = [];
        for (let s = 0; s < n; s++) st.pl[s].forEach((d, i) => {
          const pos = posOf[s]; let p = xy(pos, d, i), ang;
          const v = vis[s * 4 + i];
          if (v && v.k < 1) {
            const pts = v.pts, k = v.delayK ? Math.max(0, (v.k - v.delayK) / (1 - v.delayK)) : v.k, f = k * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(f)), u = f - j;
            p = [BX.lerp(pts[j][0], pts[j + 1][0], u), BX.lerp(pts[j][1], pts[j + 1][1], u)];
            ang = Math.atan2(pts[j + 1][1] - pts[j][1], pts[j + 1][0] - pts[j][0]);
            items.push({s, i, p, ang, moving: true, z: 2}); return;
          }
          const nx = d < 0 ? xy(pos, 0, i) : d >= HOME ? [7.5, 7.5] : xy(pos, d + 1, i);
          ang = d >= HOME ? Math.atan2(7.5 - p[1], 7.5 - p[0]) : d < 0 ? Math.atan2(7.5 - p[1], 7.5 - p[0]) : Math.atan2(nx[1] - p[1], nx[0] - p[0]);
          const key = d >= 1 && d <= 51 ? 'a' + absIdx(pos, d) : d >= 52 && d < HOME ? 's' + s + 'd' + d : d === 0 ? 'o' + s : null;
          let off = 0; if (key) { off = stackCount[key] = (stackCount[key] || 0) + 1; }
          items.push({s, i, p, ang, off: off - 1, z: movSet.has(i) && st.turn === s ? 1 : 0});
        });
        items.sort((a, b) => a.z - b.z);
        for (const it of items) {
          let [x, y] = S(it.p); const o = it.off || 0;
          x += (o % 2 ? 1 : -1) * Math.min(o, 1) * cs * .14 + (o >= 2 ? cs * .1 : 0); y -= o * cs * .1;
          const d = st.pl[it.s][it.i], sz = d >= HOME && !it.moving ? cs * .62 : cs * (it.moving ? 1.12 : .98);
          const hl = !it.moving && it.s === st.turn && movSet.has(it.i);
          if (hl) { const pul = .5 + .5 * Math.sin(t * 6); g.fillStyle = `rgba(255,230,120,${.35 + .35 * pul})`; D.circle(g, x, y, cs * (.62 + .1 * pul)); g.fill(); g.strokeStyle = '#fff3c4'; g.lineWidth = 2; g.stroke(); }
          if (st.last && st.last.s === it.s && st.last.i === it.i && !it.moving && !hl && d >= 0 && d < HOME) { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5; D.circle(g, x, y, cs * .55); g.stroke(); }
          planeShape(g, x, y, sz, ctx.color(it.s), it.ang + Math.PI / 2);
        }
        /* flash text */
        if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; else { const a = Math.min(1, flash.t * 2); D.text(g, flash.txt, ccx, B.y + B.s * .5 - cs * 1.4, {size: cs * 1.25, color: `rgba(255,248,225,${a})`, font: 'deco', weight: 400, stroke: D.alpha(flash.c, a), strokeW: 6}); } }
        /* panel */
        drawPanel(g, L.P);
      },
    };
    function drawPanel(g, P) {
      g.fillStyle = 'rgba(30,18,8,.82)'; D.rr(g, P.x, P.y, P.w, P.h, 14); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.3)'; g.lineWidth = 1; g.stroke();
      const s = st.turn, col = ctx.color(s), vert = P.h > P.w * .9;
      const ds = Math.min(vert ? P.w * .42 : P.h * .6, 96);
      const dx = vert ? P.x + (P.w - ds) / 2 : P.x + P.w - ds - 22, dy = vert ? P.y + P.h * .3 : P.y + (P.h - ds) / 2 - 6;
      btnDie = {x: dx, y: dy, w: ds, h: ds};
      // whose turn
      const tx = vert ? P.x + P.w / 2 : P.x + 16, al = vert ? 'center' : 'left';
      g.fillStyle = col; if (vert) { D.rr(g, P.x + 14, P.y + 14, P.w - 28, 6, 3); g.fill(); } else { D.rr(g, P.x + 8, P.y + 12, 6, P.h - 24, 3); g.fill(); }
      D.text(g, st.over ? '对局结束' : ctx.name(s), tx + (vert ? 0 : 10), P.y + (vert ? 40 : P.h * .28), {size: 17, color: '#f3e2c0', weight: 800, align: al, maxW: vert ? P.w - 20 : P.w - ds - 60});
      const sub = st.over ? '' : st.phase === 'roll' ? (myTurn() ? '点骰子掷骰' : '等待掷骰…') : st.phase === 'move' ? (myTurn() ? '点闪光的飞机' : '思考中…') : (st.msg || '');
      D.text(g, sub, tx + (vert ? 0 : 10), P.y + (vert ? 64 : P.h * .5), {size: 13, color: 'rgba(243,226,192,.8)', weight: 500, align: al, maxW: vert ? P.w - 16 : P.w - ds - 60});
      if (st.sixes > 0 && !st.over && st.phase !== 'wait') D.text(g, '连续 6 点 ×' + st.sixes, tx + (vert ? 0 : 10), P.y + (vert ? 84 : P.h * .7), {size: 12, color: C.gold2, weight: 700, align: al});
      // die
      const rr = roll, rolling = rr.k < 1;
      const face = rolling ? 1 + Math.floor((t * 20) % 6) : (st.die || 6);
      const ready = myTurn() && st.phase === 'roll';
      if (ready) { const pul = .5 + .5 * Math.sin(t * 5); g.fillStyle = `rgba(255,215,106,${.18 + .2 * pul})`; D.rr(g, dx - 8, dy - 8, ds + 16, ds + 16, ds * .25); g.fill(); }
      const jump = rolling ? -Math.sin(rr.k * Math.PI) * ds * .25 : 0;
      g.globalAlpha = st.die || rolling || ready ? 1 : .5;
      D.die(g, dx, dy + jump, ds, face, {rot: rolling ? (1 - rr.k) * 6 : 0, color: ready ? '#fffaf0' : '#f2e6cf', sel: ready ? '#ffd76a' : false});
      g.globalAlpha = 1;
      if (ready) D.text(g, '点 我 掷 骰', dx + ds / 2, dy + ds + 16, {size: 12, color: C.gold2, weight: 700});
      // finished counts per seat (mini)
      if (vert) {
        const yy = P.y + P.h - 26;
        for (let q = 0; q < n; q++) { const x = P.x + P.w / 2 + (q - (n - 1) / 2) * Math.min(56, P.w / n); planeShape(g, x - 10, yy, 16, ctx.color(q), 0); D.text(g, done(q) + '/4', x + 10, yy, {size: 12, color: '#f3e2c0', weight: 700}); }
      }
    }
    status();
    return inst;
  },
});
/* top-down aeroplane, nose pointing at angle `ang` (0 = up) */
function planeShape(g, x, y, size, color, ang) {
  const s = size / 2;
  g.save(); g.translate(x, y); g.rotate(ang || 0);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.translate(s * .08, s * .14);
  body(); g.fill(); g.translate(-s * .08, -s * .14);
  const gr = g.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, D.shade(color, 35)); gr.addColorStop(.6, color); gr.addColorStop(1, D.shade(color, -30));
  g.fillStyle = gr; body(); g.fill();
  g.strokeStyle = 'rgba(255,250,235,.85)'; g.lineWidth = Math.max(1, s * .08); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(0, -s * .52, s * .1, s * .16, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  function body() {
    g.beginPath();
    g.moveTo(0, -s * .95);
    g.quadraticCurveTo(s * .16, -s * .8, s * .16, -s * .35);
    g.lineTo(s * .95, s * .05); g.lineTo(s * .95, s * .25); g.lineTo(s * .16, s * .1);
    g.lineTo(s * .13, s * .6); g.lineTo(s * .42, s * .8); g.lineTo(s * .42, s * .95); g.lineTo(0, s * .85);
    g.lineTo(-s * .42, s * .95); g.lineTo(-s * .42, s * .8); g.lineTo(-s * .13, s * .6);
    g.lineTo(-s * .16, s * .1); g.lineTo(-s * .95, s * .25); g.lineTo(-s * .95, s * .05); g.lineTo(-s * .16, -s * .35);
    g.quadraticCurveTo(-s * .16, -s * .8, 0, -s * .95); g.closePath();
  }
}
