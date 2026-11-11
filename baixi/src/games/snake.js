/* 贪吃蛇对战 — realtime, host-authoritative, tick based. */
const D = BX.draw, C = BX.C;
const GW = 32, GH = 20;                          // each snake moves rate·dt cells per 60 Hz step (7 / 10 / 13 per s, ×1.8 boosted)
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // up right down left (grid)
const WINR = 2, MAXR = 7;
const COLS = [['#d8442f', '#f6b26b', '#7a1a10'], ['#2f7fb8', '#9fd3f0', '#123a5a']];

BX.register({
  id: 'snake', title: '贪吃蛇对战', cat: 'arcade', order: 3, sub: '抢食长身，逼对方撞墙',
  desc: '两条蛇同场争食：吃到果子变长，撞墙、撞身体就输掉本回合，迎头相撞同归于尽。偶尔出现加速果和双倍果，三局两胜。',
  kind: 'realtime', seats: 2, seatNames: ['赤蛇', '青蛇'], seatColors: ['#d8442f', '#2f7fb8'], noFirst: true, hint: false, snapHz: 30, inputHz: 60,
  options: [{key: 'speed', label: '速度', choices: [[1, '慢'], [2, '标准'], [3, '快']], def: 2}, {key: 'wrap', label: '边墙', choices: [[0, '撞墙即死'], [1, '穿墙而过']], def: 0}],
  howto: ['在场地上任意处<b>滑动</b>即可转向（滑一下转一次，可以连续快速滑两下完成掉头），也可以按右下的方向盘。', '键盘：方向键或 WASD；同屏双人左方 WASD、右方方向键。', '连续按键会被记住、按顺序执行，不会丢；蛇头前方有危险时会闪红圈提醒，快撞上时蛇会稍稍停顿，给你最后一刻转向的机会。'],
  rules: `<p>两条蛇在 32×20 的格子场地上同时前进（标准速度约每秒 10 格，开局前可选慢 / 快）。用方向键控制蛇头转向，蛇不能直接掉头。</p>
<p><b>吃果子</b>：普通果子（桃）让蛇长 1 节、得 1 分。场上偶尔出现限时的<b>加速果</b>（闪电，5 秒内移动速度翻倍）和<b>双倍果</b>（金元宝，6 秒内吃到的果子长度和分数都翻倍），过一会儿会消失。</p>
<p><b>死亡</b>：蛇头撞到场地边墙（选了“穿墙而过”时从对边出来）、自己或对方的身体即死亡。两个蛇头撞到同一格或迎面相撞，<b>双方同时死亡</b>（本回合平局，重赛）。</p>
<p><b>回合</b>：只剩一条蛇存活时它赢得本回合。每回合限时 75 秒，时间到时身体更长的一方获胜，长度相同则重赛。<b>三局两胜</b>；若因平局赛满 7 回合仍未分出胜负，则按赢得回合数、再按累计吃到的果子数决定胜负。</p>
<p><b>操作</b>：单人可用方向键或 WASD；同屏双人时左（下）方玩家用 WASD，右（上）方玩家用方向键。触屏上在场地上<b>滑动</b>即可转向，也可以按屏幕上的方向键；同屏双人各用自己那半边屏幕。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#3d5a2a', '#1f3315');
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 15) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 15) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const body = (pts, c, c2) => {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 15; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + 2, y + 3) : g.moveTo(x + 2, y + 3)); g.stroke();
      g.strokeStyle = c; g.lineWidth = 14; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      g.strokeStyle = c2; g.lineWidth = 4; g.setLineDash([3, 6]); g.stroke(); g.setLineDash([]);
      const [hx, hy] = pts[pts.length - 1]; D.disc(g, hx, hy, 10, c);
      g.fillStyle = '#fff'; D.circle(g, hx + 3, hy - 4, 3.2); g.fill(); D.circle(g, hx + 3, hy + 4, 3.2); g.fill();
      g.fillStyle = '#111'; D.circle(g, hx + 4, hy - 4, 1.6); g.fill(); D.circle(g, hx + 4, hy + 4, 1.6); g.fill();
    };
    body([[18, 128], [18, 100], [60, 100], [60, 70], [96, 70]], '#d8442f', '#f6b26b');
    body([[186, 22], [186, 50], [150, 50], [150, 112], [118, 112]], '#2f7fb8', '#9fd3f0');
    D.disc(g, 116, 72, 8, '#f08a7a'); g.fillStyle = '#3f8f3b'; g.beginPath(); g.ellipse(120, 63, 5, 2.5, -.6, 0, 7); g.fill();
  },
  create(ctx) {
    const st = {
      s: [mkSnake(0), mkSnake(1)], food: [], bonus: null, wins: [0, 0], tot: [0, 0], round: 1, ph: 'ready', t: 2.2, rt: 0,
      tick: 0, ev: [], evId: 0, over: false, msg: '', nextBonus: 8,
    };
    const roundLen = BX.test ? 8 : 75, MAXRT = BX.test ? 3 : MAXR, RDY = BX.test ? 1 : 2.2, BTW = BX.test ? 1.2 : 2.6;
    const WRAP = +ctx.opts.wrap === 1, RATE = [10, 7, 10, 13][+ctx.opts.speed || 2], BOOST = 1.8;
    const rateOf = s => RATE * (s.boost > 0 ? BOOST : 1);
    /* neighbour cell in grid dir d (wraps around in 穿墙 mode) */
    const nb = (x, y, d) => WRAP ? [(x + DIRS[d][0] + GW) % GW, (y + DIRS[d][1] + GH) % GH] : [x + DIRS[d][0], y + DIRS[d][1]];
    function mkSnake(i) {
      const y = i ? GH / 2 - 1 : GH / 2, x0 = i ? GW - 6 : 5, d = i ? 3 : 1, body = [];
      for (let k = 0; k < 4; k++) body.push([x0 - DIRS[d][0] * k, y]);
      return {b: body, d, q: [], grow: 0, alive: true, boost: 0, dbl: 0, score: 0, lastIn: -1, mv: 0, pt: null, hold: 0, mvd: 0, mc: 0};
    }
    const fx = (k, a, b) => { st.ev.push({k, a, b, id: ++st.evId}); if (st.ev.length > 10) st.ev.shift(); };
    const occ = () => { const o = new Set(); for (const s of st.s) for (const c of s.b) o.add(c[0] + c[1] * GW); return o; };
    function freeCell() {
      const o = occ(); for (const f of st.food) o.add(f[0] + f[1] * GW); if (st.bonus) o.add(st.bonus.x + st.bonus.y * GW);
      for (const s of st.s) { const h = s.b[0]; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) o.add(h[0] + dx + (h[1] + dy) * GW); }
      for (let k = 0; k < 300; k++) { const x = 1 + Math.floor(Math.random() * (GW - 2)), y = 1 + Math.floor(Math.random() * (GH - 2)); if (!o.has(x + y * GW)) return [x, y]; }
      for (let i = 0; i < GW * GH; i++) if (!o.has(i)) return [i % GW, Math.floor(i / GW)];
      return null;
    }
    function newRound() {
      st.s = [mkSnake(0), mkSnake(1)]; st.food = []; st.bonus = null; st.ph = 'ready'; st.t = RDY; st.rt = 0; st.nextBonus = 6 + Math.random() * 5;
      // symmetric opening fruit
      st.food.push([GW / 2 - 1, GH / 2 - 4], [GW / 2, GH / 2 + 3]);
    }
    newRound();
    function endRound(w, why) {
      st.ph = 'between'; st.t = BTW; st.msg = why;
      if (w >= 0) st.wins[w]++;
      fx('round', w);
      st.tot[0] += st.s[0].score; st.tot[1] += st.s[1].score;
      if (w >= 0 && st.wins[w] >= WINR) { st.over = true; st.ph = 'over'; ctx.end({winner: w, text: st.wins[0] + ' : ' + st.wins[1] + '（回合）'}); }
      else if (st.round >= MAXRT) {
        const a = st.wins[0] * 1000 + st.tot[0], b = st.wins[1] * 1000 + st.tot[1];
        st.over = true; st.ph = 'over'; st.msg = '已赛满 ' + MAXR + ' 回合';
        ctx.end({winner: a === b ? -1 : a > b ? 0 : 1, text: '赛满 ' + MAXR + ' 回合 · 回合 ' + st.wins[0] + ' : ' + st.wins[1] + ' · 累计果子 ' + st.tot[0] + ' : ' + st.tot[1]});
      }
    }
    /* grace: a snake about to crash with no turn queued waits up to GRACE s at the cell centre for a last-instant turn */
    const validTurn = (s, nd) => nd !== s.d && (nd + 2) % 4 !== s.d;
    function deadlyAhead(i) {
      const s = st.s[i], [x, y] = nb(s.b[0][0], s.b[0][1], s.d);
      if (x < 0 || y < 0 || x >= GW || y >= GH) return true;
      for (const o of st.s) for (let k = 0; k < o.b.length - (o.grow > 0 ? 0 : 1); k++) if (o.b[k][0] === x && o.b[k][1] === y) return true;
      return false;
    }
    function moveSnakes(movers) {
      const heads = st.s.map((s, i) => {
        if (!movers[i]) return null;
        // buffered turns: skip no-ops (same dir / reversal) so the next real turn happens on this very step
        while (s.q.length) { const nd = s.q.shift(); if (nd !== s.d && (nd + 2) % 4 !== s.d) { s.d = nd; break; } }
        return nb(s.b[0][0], s.b[0][1], s.d);
      });
      // tails move first (unless growing)
      const popped = [null, null];
      st.s.forEach((s, i) => { if (heads[i]) { if (s.grow > 0) s.grow--; else popped[i] = s.b.pop(); } });
      const o = occ(), dead = [false, false];
      heads.forEach((h, i) => { if (h && (h[0] < 0 || h[1] < 0 || h[0] >= GW || h[1] >= GH || o.has(h[0] + h[1] * GW))) dead[i] = true; });
      if (heads[0] && heads[1] && heads[0][0] === heads[1][0] && heads[0][1] === heads[1][1]) dead[0] = dead[1] = true;
      // swap through each other
      const h0 = st.s[0].b[0], h1 = st.s[1].b[0];
      if (heads[0] && heads[1] && heads[0][0] === h1[0] && heads[0][1] === h1[1] && heads[1][0] === h0[0] && heads[1][1] === h0[1]) dead[0] = dead[1] = true;
      // a still snake's head being run into by a mover
      for (let i = 0; i < 2; i++) { const j = 1 - i; if (heads[i] && !heads[j]) { const hj = st.s[j].b[0]; if (heads[i][0] === hj[0] && heads[i][1] === hj[1]) dead[i] = true; } }
      st.s.forEach((s, i) => {
        if (!heads[i]) return;
        if (dead[i]) { if (popped[i]) s.b.push(popped[i]); return; }
        s.b.unshift(heads[i]); s.pt = popped[i]; s.mvd = 1; s.hold = 0; s.mc = (s.mc + 1) % 1000;
        const h = heads[i];
        const fi = st.food.findIndex(f => f[0] === h[0] && f[1] === h[1]);
        if (fi >= 0) { st.food.splice(fi, 1); const m = s.dbl > 0 ? 2 : 1; s.grow += m; s.score += m; fx('eat', i, m); const c = freeCell(); if (c) st.food.push(c); }
        if (st.bonus && st.bonus.x === h[0] && st.bonus.y === h[1]) {
          if (st.bonus.k === 'speed') s.boost = 5; else s.dbl = 6;
          fx('bonus', i, st.bonus.k === 'speed' ? 0 : 1); st.bonus = null; st.nextBonus = 7 + Math.random() * 6;
        }
      });
      if (dead[0] || dead[1]) {
        dead.forEach((d, i) => { if (d) { st.s[i].alive = false; fx('die', i); } });
        if (dead[0] && dead[1]) endRound(-1, heads[0] && heads[1] ? '迎头相撞，同归于尽！本回合重赛' : '双双撞毁，本回合重赛');
        else { const w = dead[0] ? 1 : 0; endRound(w, ctx.name(w) + ' 赢得本回合'); }
      }
    }
    /* ---------- view ---------- */
    const cv = ctx.canvas();
    const touch = () => BX.TOUCH.matches;
    const nLoc = () => ctx.mySeats.length;
    const viewSeat = () => nLoc() === 1 ? ctx.mySeats[0] : 0;
    function lay() {
      const w = cv.w, h = cv.h, portrait = h > w * 1.05, two = nLoc() === 2, tc = touch();
      const gw = portrait ? GH : GW, gh = portrait ? GW : GH;
      let ax = 0, ay = 0, aw = w, ah = h, pads = [];
      const PS = Math.min(170, Math.max(120, Math.min(w, h) * .32));
      if (tc) {
        if (portrait) {
          if (two) { const ps = BX.clamp(Math.min(w * .44, h * .2), 110, 175); ay = ps + 6; ah = h - 2 * ps - 12; pads = [{x: w / 2, y: h - ps / 2 - 3, s: ps, seat: 0}, {x: w / 2, y: ps / 2 + 3, s: ps, seat: 1}]; }
          else { const ps = BX.clamp(Math.min(w * .5, h * .24), 120, 200); ah = h - ps - 10; pads = [{x: w / 2, y: h - ps / 2 - 5, s: ps, seat: viewSeat()}]; }
        } else {
          if (two) { ax = PS + 6; aw = w - 2 * PS - 12; pads = [{x: PS / 2 + 4, y: h - PS / 2 - 6, s: PS, seat: 0}, {x: w - PS / 2 - 4, y: h - PS / 2 - 6, s: PS, seat: 1}]; }
          else { aw = w - PS - 14; pads = [{x: w - PS / 2 - 6, y: h - PS / 2 - 6, s: PS, seat: viewSeat()}]; }
        }
      }
      const f = BX.fit(aw, ah, gw + 1, gh + 1, 6);
      return {portrait, s: f.s, ox: ax + f.x + f.s / 2, oy: ay + f.y + f.s / 2, gw, gh, pads, w, h, flip: viewSeat() === 1};
    }
    let V = lay();
    // grid cell centre (fractional ok) -> screen
    function T(x, y) {
      if (V.flip) { x = GW - 1 - x; y = GH - 1 - y; }
      return V.portrait ? [V.ox + (GH - 1 - y + .5) * V.s, V.oy + (x + .5) * V.s] : [V.ox + (x + .5) * V.s, V.oy + (y + .5) * V.s];
    }
    // screen dir (0 up 1 right 2 down 3 left) -> grid dir
    function s2g(sd) {
      const [ax, ay] = T(5, 5);
      for (let d = 0; d < 4; d++) { const [bx, by] = T(5 + DIRS[d][0], 5 + DIRS[d][1]); const vx = Math.sign(Math.round(bx - ax)), vy = Math.sign(Math.round(by - ay)); if (vx === DIRS[sd][0] && vy === DIRS[sd][1]) return d; }
      return sd;
    }
    /* ---------- input ---------- */
    const pend = [[], []];            // per local slot queued screen dirs
    // every press gets a sequence number; input() always resends the last few so a lost packet never drops a turn
    const hist = [[], []], seq0 = Math.floor(performance.now()) * 4, seq = [seq0, seq0];
    const intent = [null, null];
    const push = (slot, sd) => { const q = pend[slot]; if (q.length && q[q.length - 1] === sd) return; q.push(sd); if (q.length > 3) q.shift(); intent[slot] = {sd, t: .3}; };
    const KM = [{KeyW: 0, KeyD: 1, KeyS: 2, KeyA: 3}, {ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3}];
    const sw = new Map();
    const slotOfPoint = p => {
      if (nLoc() < 2) return 0;
      return V.portrait ? (p.y > cv.h / 2 ? 0 : 1) : (p.x < cv.w / 2 ? 0 : 1);
    };
    function padHit(p) {
      for (const pd of V.pads) {
        const dx = p.x - pd.x, dy = p.y - pd.y, r = pd.s / 2;
        if (Math.abs(dx) > r || Math.abs(dy) > r) continue;
        if (Math.hypot(dx, dy) < r * .22) return null;
        let sd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        return {slot: nLoc() < 2 ? 0 : pd.seat === 0 ? 0 : 1, sd, pd};
      }
      return null;
    }
    let padFlash = [];
    const padP = new Map();
    const swTh = () => BX.clamp(V.s * .7, 11, 22);           // swipe distance threshold ≈ 0.7 cell
    function padDir(pd, p) {
      const dx = p.x - pd.x, dy = p.y - pd.y;
      if (Math.hypot(dx, dy) < pd.s * .11) return -1;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e); const ph = padHit(p);
      if (ph) {
        push(ph.slot, ph.sd); padFlash.push({pd: ph.pd, sd: ph.sd, t: .18}); ctx.buzz(8);
        padP.set(e.pointerId, {pd: ph.pd, slot: ph.slot, sd: ph.sd});   // thumb can roll to another arrow without lifting
        try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
        return;
      }
      sw.set(e.pointerId, {x: p.x, y: p.y, slot: slotOfPoint(p), smp: [{x: p.x, y: p.y, t: e.timeStamp}], last: -1});
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      const pp = padP.get(e.pointerId);
      if (pp) {
        const p = cv.pos(e), sd = padDir(pp.pd, p);
        if (sd >= 0 && sd !== pp.sd) { pp.sd = sd; push(pp.slot, sd); padFlash.push({pd: pp.pd, sd, t: .18}); ctx.buzz(6); }
        return;
      }
      const s = sw.get(e.pointerId); if (!s) return;
      const th = swTh();
      for (const p of ctx.points(e, cv.cv)) {
        s.smp.push(p); if (s.smp.length > 16) s.smp.shift();
        const dx = p.x - s.x, dy = p.y - s.y, ax = Math.abs(dx), ay = Math.abs(dy);
        if (Math.max(ax, ay) < th) continue;
        if (Math.max(ax, ay) < th * 1.8 && Math.max(ax, ay) < Math.min(ax, ay) * 1.3) continue;   // too diagonal to judge yet
        const sd = ax > ay ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        if (sd !== s.last) push(s.slot, sd);
        s.last = sd; s.x = p.x; s.y = p.y;
      }
    });
    const up = e => {
      padP.delete(e.pointerId);
      const s = sw.get(e.pointerId); sw.delete(e.pointerId);
      if (!s || e.type === 'pointercancel' || s.last >= 0) return;
      // short quick flick that never reached the distance threshold: judge it by velocity over the last ~80 ms
      const a = s.smp[s.smp.length - 1]; let b0 = s.smp[0];
      for (let i = s.smp.length - 2; i >= 0; i--) { b0 = s.smp[i]; if (a.t - b0.t >= 80) break; }
      const dx = a.x - b0.x, dy = a.y - b0.y, d = Math.hypot(dx, dy), dt = Math.max(1, a.t - b0.t);
      if (d >= 7 && d / dt >= .3) push(s.slot, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    function onKey(e) {
      if (e.repeat) return;
      for (let k = 0; k < 2; k++) if (e.code in KM[k]) { const slot = nLoc() < 2 ? 0 : k; push(slot, KM[k][e.code]); }
    }
    /* ---------- AI ---------- */
    const aiMem = [{}, {}];
    function aiInput(seat, level) {
      const me = st.s[seat], op = st.s[1 - seat];
      if (st.ph !== 'play' || !me.alive) return {};
      const m = aiMem[seat], hk = me.b[0][0] + ',' + me.b[0][1] + ',' + me.b.length;
      if (m.key === hk) return m.out || {};
      m.key = hk;
      const blocked = new Uint8Array(GW * GH);
      for (const s of st.s) for (let k = 0; k < s.b.length - (s === me ? 1 : 0); k++) blocked[s.b[k][0] + s.b[k][1] * GW] = 1;
      const H = me.b[0], ok = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && !blocked[x + y * GW];
      const opH = op.b[0], danger = new Set();
      if (op.alive && (level >= 3 || (level === 2 && Math.random() < .8))) for (let d = 0; d < 4; d++) { const [x, y] = nb(opH[0], opH[1], d); danger.add(x + y * GW); }
      const moves = [0, 1, 2, 3].filter(d => (d + 2) % 4 !== me.d && ok(...nb(H[0], H[1], d)));
      if (!moves.length) { m.out = {}; return m.out; }
      const flood = (sx, sy, cap) => {
        const seen = new Uint8Array(GW * GH); seen[sx + sy * GW] = 1; const qq = [[sx, sy]]; let n = 0;
        while (qq.length && n < cap) { const [x, y] = qq.pop(); n++; for (let d = 0; d < 4; d++) { const [nx, ny] = nb(x, y, d); if (ok(nx, ny) && !seen[nx + ny * GW]) { seen[nx + ny * GW] = 1; qq.push([nx, ny]); } } }
        return n;
      };
      // BFS distance map from head
      const targets = st.food.slice(); if (st.bonus && level >= 2) targets.push([st.bonus.x, st.bonus.y]);
      let pick = -1;
      if (level === 1) {
        if (Math.random() < .12) pick = moves[Math.floor(Math.random() * moves.length)];
        else { let bd = 1e9; const f = targets[0] || [GW / 2, GH / 2]; for (const d of moves) { const [nx, ny] = nb(H[0], H[1], d), dd = Math.abs(nx - f[0]) + Math.abs(ny - f[1]) + Math.random() * .5; if (dd < bd) { bd = dd; pick = d; } } }
      } else {
        // BFS from each candidate first move
        const dist = new Int16Array(GW * GH).fill(-1), first = new Int8Array(GW * GH).fill(-1), q = [];
        for (const d of moves) { const [nx, ny] = nb(H[0], H[1], d), i = nx + ny * GW; if (danger.has(i) && moves.length > 1) continue; dist[i] = 1; first[i] = d; q.push(i); }
        for (let qi = 0; qi < q.length; qi++) { const i = q[qi], x = i % GW, y = (i - x) / GW; for (let dd = 0; dd < 4; dd++) { const [nx, ny] = nb(x, y, dd), j = nx + ny * GW; if (ok(nx, ny) && dist[j] < 0) { dist[j] = dist[i] + 1; first[j] = first[i]; q.push(j); } } }
        let best = null, bs = -1e9;
        for (const f of targets) {
          const i = f[0] + f[1] * GW; if (dist[i] < 0) continue;
          let sc = -dist[i] + Math.random() * .3;
          if (level >= 3) { const od = Math.abs(opH[0] - f[0]) + Math.abs(opH[1] - f[1]); if (od < dist[i] - 1) sc -= 6; if (st.bonus && f[0] === st.bonus.x && f[1] === st.bonus.y) sc += 6; }
          if (sc > bs) { bs = sc; best = first[i]; }
        }
        const need = me.b.length + 2;
        const space = d => flood(...nb(H[0], H[1], d), level >= 3 ? 400 : 120);
        if (best != null && best >= 0) {
          if (level >= 3 || Math.random() < .9) { if (space(best) >= Math.min(need, level >= 3 ? 400 : 120)) pick = best; }
          else pick = best;
        }
        if (pick < 0) { let bv = -1; for (const d of moves) { const c2 = nb(H[0], H[1], d), v = space(d) - (danger.has(c2[0] + c2[1] * GW) ? 50 : 0) + Math.random(); if (v > bv) { bv = v; pick = d; } } }
      }
      m.out = {g: pick, n: (m.n = (m.n || 0) + 1)};
      return m.out;
    }
    /* ---------- events / effects ---------- */
    let seenEv = 0, parts = [], shake = 0, flash = 0, banner = null;
    const gk = [1, 1], gHead = ['', ''], gMv = [0, 0];   // guest: progress toward the next cell, extrapolated between snapshots
    function playEv() {
      for (const e of st.ev) if (e.id > seenEv) {
        seenEv = e.id;
        if (e.k === 'eat') { ctx.sfx(e.b > 1 ? 'coin' : 'pop'); burst(st.s[e.a].b[0], COLS[e.a][1], 10); }
        else if (e.k === 'bonus') { ctx.sfx(e.b ? 'coin' : 'swish'); burst(st.s[e.a].b[0], e.b ? '#ffd76a' : '#9fe0ff', 22); banner = {txt: ctx.name(e.a) + (e.b ? ' 双倍！' : ' 加速！'), t: 1.4}; }
        else if (e.k === 'die') { ctx.sfx('crash'); shake = 10; for (const c of st.s[e.a].b.slice(0, 12)) burst(c, COLS[e.a][0], 3); if (ctx.mySeats.includes(e.a) && !ctx.isAI(e.a)) ctx.buzz(40); }
        else if (e.k === 'go') ctx.sfx('start');
        else if (e.k === 'round') { ctx.sfx(e.a >= 0 ? 'gong' : 'draw'); flash = 1; }
        else if (e.k === 'cd') ctx.sfx('tick');
      }
    }
    function burst(c, col, n) { if (!c) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 1.5 + Math.random() * 5; parts.push({x: c[0], y: c[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: .5 + Math.random() * .4, c: col}); } }
    const info = () => { for (const i of [0, 1]) ctx.info(i, '胜' + st.wins[i] + ' · 长' + st.s[i].b.length); };
    let lastStatus = '';
    function status() {
      let s;
      if (st.over) s = '比赛结束';
      else if (st.ph === 'ready') s = '第 ' + st.round + ' 回合 · 准备';
      else if (st.ph === 'between') s = st.msg;
      else { const left = Math.max(0, Math.ceil(roundLen - st.rt)); s = '第 ' + st.round + ' 回合 · 剩余 ' + left + ' 秒 · 三局两胜'; }
      if (s !== lastStatus) { lastStatus = s; ctx.status(s); }
    }
    const lastN = [{}, {}], lastSeq = [0, 0];
    const inst = {
      st,
      input(seat, slot, nLocal) {
        const q = pend[slot], h = hist[slot];
        while (q.length) h.push([++seq[slot], s2g(q.shift())]);
        if (h.length > 4) h.splice(0, h.length - 4);
        return h.length ? {h} : {};
      },
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        for (let i = 0; i < 2; i++) {
          const inp = inputs[i] || {};
          if (inp.g != null && inp.n != null && inp.n !== lastN[i].n) { lastN[i] = inp; const s = st.s[i]; if (s.q.length < 3) s.q.push(inp.g | 0); }
          if (Array.isArray(inp.h)) for (const e of inp.h) {
            const n = +e[0]; if (!(n > lastSeq[i] || n < lastSeq[i] - 1e5)) continue;   // new press (or the device restarted its counter)
            lastSeq[i] = n; const s = st.s[i]; if (s.q.length < 3) s.q.push(e[1] & 3);
          }
        }
        if (st.ph === 'ready') { const c0 = Math.ceil(st.t - .2); st.t -= dt; const c1 = Math.ceil(st.t - .2); if (c1 !== c0 && c1 > 0) fx('cd'); if (st.t <= 0) { st.ph = 'play'; fx('go'); } }
        else if (st.ph === 'between') { st.t -= dt; if (st.t <= 0) { st.round++; newRound(); } }
        else if (st.ph === 'play') {
          st.rt += dt;
          for (const s of st.s) { s.boost = Math.max(0, s.boost - dt); s.dbl = Math.max(0, s.dbl - dt); }
          if (st.bonus) { st.bonus.t -= dt; if (st.bonus.t <= 0) { st.bonus = null; st.nextBonus = 6 + Math.random() * 6; } }
          else { st.nextBonus -= dt; if (st.nextBonus <= 0) { const c = freeCell(); if (c) { st.bonus = {x: c[0], y: c[1], k: Math.random() < .5 ? 'speed' : 'dbl', t: 7}; fx('spawn'); } else st.nextBonus = 3; } }
          for (const s of st.s) if (s.alive) s.mv = (s.mv || 0) + rateOf(s) * dt;
          const held = st.s.map((s, i) => {
            if (!s.alive || s.mv < 1 || s.q.some(nd => validTurn(s, nd)) || !deadlyAhead(i)) { s.hold = 0; return false; }
            if (s.hold >= Math.min(.13, 1.25 / rateOf(s))) return false;
            s.hold += dt; s.mv = 1; return true;
          });
          for (let k = 0; k < 3 && st.ph === 'play'; k++) {
            const movers = st.s.map((s, i) => s.alive && s.mv >= 1 && !held[i]);
            if (!movers[0] && !movers[1]) break;
            st.tick++; st.s.forEach((s, i) => { if (movers[i]) s.mv -= 1; });
            moveSnakes(movers);
          }
          if (st.ph === 'play' && st.rt >= roundLen) {
            const a = st.s[0].b.length * 100 + st.s[0].score, b = st.s[1].b.length * 100 + st.s[1].score;
            endRound(a === b ? -1 : a > b ? 0 : 1, a === b ? '时间到，长度相同，本回合重赛' : '时间到！' + ctx.name(a > b ? 0 : 1) + ' 更长，赢得本回合');
          }
        }
        playEv(); info(); status();
      },
      snapshot() {
        return {s: st.s.map(s => [s.b.map(c => c[0] + c[1] * GW), s.d, s.alive ? 1 : 0, +s.boost.toFixed(1), +s.dbl.toFixed(1), s.score, +Math.min(1, s.mv || 0).toFixed(2), s.pt ? s.pt[0] + s.pt[1] * GW : -1, s.mvd ? 1 : 0, s.mc]), f: st.food.map(f => f[0] + f[1] * GW),
          bo: st.bonus ? [st.bonus.x, st.bonus.y, st.bonus.k, +st.bonus.t.toFixed(1)] : null, w: st.wins, tt: st.tot, r: st.round, ph: st.ph, t: +st.t.toFixed(2), rt: +st.rt.toFixed(1), m: st.msg, ev: st.ev, o: st.over};
      },
      restore(d) {
        st.s = d.s.map(a => ({b: a[0].map(i => [i % GW, Math.floor(i / GW)]), d: a[1], alive: !!a[2], boost: a[3], dbl: a[4], score: a[5], q: [], mv: a[6] || 0, pt: a[7] >= 0 ? [a[7] % GW, Math.floor(a[7] / GW)] : null, mvd: a[8] || 0, mc: a[9] | 0}));
        // keep the drawn progress continuous: it may run up to ~0.7 cell past the newest known cell while the next snapshot is in flight
        st.s.forEach((s, i) => { const dm = (s.mc - gMv[i] + 1000) % 1000; gMv[i] = s.mc; gk[i] = dm > 3 ? s.mv : BX.clamp(gk[i] - dm, s.mv, s.mv + .5); });
        st.food = d.f.map(i => [i % GW, Math.floor(i / GW)]); st.bonus = d.bo ? {x: d.bo[0], y: d.bo[1], k: d.bo[2], t: d.bo[3]} : null;
        st.wins = d.w; st.tot = d.tt; st.round = d.r; st.ph = d.ph; st.t = d.t; st.rt = d.rt; st.msg = d.m; st.ev = d.ev; st.over = d.o;
        playEv(); info(); status();
      },
      key: onKey,
      get _dbg() { return {gk: gk.slice()}; },   // diagnostics for probes
      resize() { V = lay(); },
      draw(dt) { draw(dt); },
    };
    /* ---------- drawing ---------- */
    function drawField(g) {
      const [x0, y0] = T(V.flip ? GW - 1 : 0, V.flip ? GH - 1 : 0);
      const fw = V.gw * V.s, fh = V.gh * V.s;
      const L0 = V.portrait ? V.ox : V.ox, T0 = V.oy;
      D.wood(g, L0 - V.s * .55, T0 - V.s * .55, fw + V.s * 1.1, fh + V.s * 1.1, {r: V.s * .6, base: '#6b3a1c', dark: '#2a1206', seed: 8, vertical: V.portrait});
      g.strokeStyle = WRAP ? 'rgba(120,220,180,.85)' : 'rgba(230,197,125,.6)'; g.lineWidth = WRAP ? 2.5 : 1.5; if (WRAP) g.setLineDash([V.s * .5, V.s * .4]);
      D.rr(g, L0 - V.s * .3, T0 - V.s * .3, fw + V.s * .6, fh + V.s * .6, V.s * .4); g.stroke(); g.setLineDash([]);
      // grass-tea field: checker tiles
      for (let y = 0; y < V.gh; y++) for (let x = 0; x < V.gw; x++) {
        g.fillStyle = (x + y) % 2 ? '#5d7f3a' : '#668a40'; g.fillRect(L0 + x * V.s, T0 + y * V.s, V.s + .5, V.s + .5);
      }
      const vg = g.createRadialGradient(L0 + fw / 2, T0 + fh / 2, fh * .2, L0 + fw / 2, T0 + fh / 2, Math.max(fw, fh) * .7);
      vg.addColorStop(0, 'rgba(255,240,180,.08)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = vg; g.fillRect(L0, T0, fw, fh);
      g.globalAlpha = .08; D.text(g, '百戏', L0 + fw / 2, T0 + fh / 2, {size: Math.min(fw, fh) * .3, color: '#fff3c0', font: 'deco', weight: 400}); g.globalAlpha = 1;
    }
    function drawSnake(g, i, s, k) {
      if (!s.b.length) return;
      const col = COLS[i], r = V.s * .42;
      /* smooth movement: the body is the head's trail, so the snake at progress k (0..1 toward the cell it just entered) is the
         chain b[0..] with the head slid back toward b[1] and the tail slid back toward the cell it just left (s.pt) */
      const adjC = (a, c) => Math.abs(a[0] - c[0]) + Math.abs(a[1] - c[1]) === 1;
      const lerpC = (a, c, t) => adjC(a, c) ? [c[0] + (a[0] - c[0]) * t, c[1] + (a[1] - c[1]) * t] : (t >= .5 ? a : c);
      const n = s.b.length, cells = s.b.map(c => [c[0], c[1]]), brk = [];
      if (k < 1 && n > 1) cells[0] = lerpC(s.b[0], s.b[1], k);
      if (k < 1 && s.pt && n > 1) cells[n - 1] = lerpC(s.b[n - 1], s.pt, k);
      if (k > 1 && n > 1) {   // guest only: head already partly into the next cell along its heading
        const e = k - 1, h = s.b[0]; cells.unshift([h[0] + DIRS[s.d][0] * e, h[1] + DIRS[s.d][1] * e]); cells[n] = lerpC(s.b[n - 2], s.b[n - 1], e);
      }
      for (let j = 1; j < cells.length; j++) brk[j] = Math.abs(cells[j][0] - cells[j - 1][0]) + Math.abs(cells[j][1] - cells[j - 1][1]) > 1.01;
      const pts = cells.map(c => T(c[0], c[1]));
      const alpha = s.alive ? 1 : .45;
      g.save(); g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round';
      const path = (ox, oy) => { g.beginPath(); pts.forEach(([x, y], j) => j && !brk[j] ? g.lineTo(x + ox, y + oy) : (g.moveTo(x + ox, y + oy), g.lineTo(x + ox + .1, y + oy))); };
      g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = r * 2; path(r * .18, r * .3); g.stroke();
      if (s.boost > 0) { g.strokeStyle = 'rgba(160,230,255,.35)'; g.lineWidth = r * 2.9; path(0, 0); g.stroke(); }
      if (s.dbl > 0) { g.strokeStyle = 'rgba(255,215,106,.4)'; g.lineWidth = r * 2.7; path(0, 0); g.stroke(); }
      g.strokeStyle = col[2]; g.lineWidth = r * 2; path(0, 0); g.stroke();
      g.strokeStyle = col[0]; g.lineWidth = r * 1.7; path(0, 0); g.stroke();
      g.strokeStyle = D.alpha(col[1], .9); g.lineWidth = r * .55; g.setLineDash([r * .5, r * 1.1]); path(0, -r * .1); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = r * .3; path(-r * .25, -r * .35); g.stroke();
      // head
      const [hx, hy] = pts[0], dv = T(s.b[0][0] + DIRS[s.d][0], s.b[0][1] + DIRS[s.d][1]), [tx, ty] = T(s.b[0][0], s.b[0][1]);
      const fx2 = (dv[0] - tx) / V.s, fy2 = (dv[1] - ty) / V.s, px = -fy2, py = fx2;
      D.disc(g, hx, hy, r * 1.12, col[0], {shadow: false});
      for (const sg of [-1, 1]) {
        const ex = hx + fx2 * r * .35 + px * sg * r * .5, ey = hy + fy2 * r * .35 + py * sg * r * .5;
        g.fillStyle = '#fff'; D.circle(g, ex, ey, r * .34); g.fill();
        g.fillStyle = s.alive ? '#111' : '#555'; D.circle(g, ex + fx2 * r * .12, ey + fy2 * r * .12, r * .18); g.fill();
        if (!s.alive) { g.strokeStyle = '#111'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ex - r * .2, ey - r * .2); g.lineTo(ex + r * .2, ey + r * .2); g.moveTo(ex + r * .2, ey - r * .2); g.lineTo(ex - r * .2, ey + r * .2); g.stroke(); }
      }
      if (s.alive && (performance.now() / 300 | 0) % 4 === 0) { g.strokeStyle = '#c0291f'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx + fx2 * r, hy + fy2 * r); g.lineTo(hx + fx2 * r * 1.7, hy + fy2 * r * 1.7); g.stroke(); }
      // own head marker + danger warning (next cell straight ahead is deadly)
      if (s.alive && ctx.mySeats.includes(i) && !ctx.isAI(i) && st.ph === 'play') {
        const [nx, ny] = nb(s.b[0][0], s.b[0][1], s.d);
        let bad = nx < 0 || ny < 0 || nx >= GW || ny >= GH;
        if (!bad) for (const o of st.s) for (let k = 0; k < o.b.length - 1 && !bad; k++) if (o.b[k][0] === nx && o.b[k][1] === ny) bad = true;
        if (bad) { g.strokeStyle = `rgba(255,70,50,${.55 + .4 * Math.sin(performance.now() / 70)})`; g.lineWidth = Math.max(2, r * .3); D.circle(g, hx, hy, r * 1.75); g.stroke(); }
        else if (nLoc() === 1) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; D.circle(g, hx, hy, r * 1.5); g.stroke(); }
      }
      g.restore();
    }
    function drawPeach(g, x, y, r) {
      D.disc(g, x, y + r * .05, r, '#f08a7a');
      g.fillStyle = 'rgba(255,240,200,.55)'; D.circle(g, x - r * .3, y - r * .25, r * .3); g.fill();
      g.strokeStyle = 'rgba(160,40,40,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - r * .8); g.quadraticCurveTo(x + r * .3, y, x, y + r * .9); g.stroke();
      g.fillStyle = '#3f8f3b'; g.beginPath(); g.ellipse(x + r * .4, y - r * .85, r * .45, r * .2, -.6, 0, 7); g.fill();
    }
    function drawBonus(g, b) {
      const [x, y] = T(b.x, b.y), r = V.s * .5, pul = 1 + Math.sin(performance.now() / 120) * .08;
      const blink = b.t < 2 && (performance.now() / 120 | 0) % 2;
      if (blink) return;
      g.fillStyle = b.k === 'speed' ? 'rgba(120,210,255,.3)' : 'rgba(255,215,106,.35)'; D.circle(g, x, y, r * 1.5 * pul); g.fill();
      if (b.k === 'speed') {
        D.disc(g, x, y, r * .95, '#2f6f9a', {shadow: false});
        g.fillStyle = '#ffe36a'; g.beginPath(); g.moveTo(x + r * .15, y - r * .7); g.lineTo(x - r * .35, y + r * .1); g.lineTo(x, y + r * .1); g.lineTo(x - r * .15, y + r * .7); g.lineTo(x + r * .35, y - r * .1); g.lineTo(x, y - r * .1); g.closePath(); g.fill();
      } else {
        // gold ingot
        g.fillStyle = '#c8901f'; g.beginPath(); g.moveTo(x - r, y - r * .1); g.quadraticCurveTo(x, y + r * .25, x + r, y - r * .1); g.lineTo(x + r * .7, y + r * .55); g.lineTo(x - r * .7, y + r * .55); g.closePath(); g.fill();
        D.disc(g, x, y - r * .2, r * .45, '#ffd76a', {shadow: false});
        D.text(g, '双', x, y + r * .25, {size: r * .6, color: '#7a4a10', font: 'serif', weight: 900});
      }
    }
    function drawPad(g, pd) {
      const r = pd.s / 2, mine = true;
      g.save(); g.globalAlpha = .9;
      g.fillStyle = 'rgba(30,18,8,.55)'; D.circle(g, pd.x, pd.y, r); g.fill();
      g.strokeStyle = D.alpha(ctx.color(pd.seat), .7); g.lineWidth = 2; g.stroke();
      for (let sd = 0; sd < 4; sd++) {
        const [dx, dy] = DIRS[sd], cx = pd.x + dx * r * .58, cy = pd.y + dy * r * .58;
        const lit = padFlash.some(f => f.pd === pd && f.sd === sd);
        g.fillStyle = lit ? 'rgba(230,197,125,.9)' : 'rgba(243,226,192,.16)'; D.circle(g, cx, cy, r * .34); g.fill();
        g.fillStyle = lit ? '#3a2410' : '#f3e2c0'; g.beginPath();
        const a = r * .15; g.moveTo(cx + dx * a * 1.2, cy + dy * a * 1.2); g.lineTo(cx - dx * a * .6 + dy * a, cy - dy * a * .6 + dx * a); g.lineTo(cx - dx * a * .6 - dy * a, cy - dy * a * .6 - dx * a); g.closePath(); g.fill();
      }
      g.restore(); void mine;
    }
    function draw(dt) {
      const g = cv.g; cv.clear();
      if (V.w !== cv.w || V.h !== cv.h) V = lay();
      shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt * 1.5);
      g.save(); if (shake) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      drawField(g);
      // food
      for (const f of st.food) { const [x, y] = T(f[0], f[1]); drawPeach(g, x, y + Math.sin(performance.now() / 300 + f[0]) * V.s * .04, V.s * .38); }
      if (st.bonus) drawBonus(g, st.bonus);
      // movement interpolation: progress since the last grid step (host: exact, incl. the sub-step ctx.alpha; guest: extrapolated)
      for (let i = 0; i < 2; i++) {
        const s = st.s[i]; let k = 1;
        if (st.ph === 'play' && s.alive && s.mvd) {
          if (ctx.isHost) k = Math.min(1, (s.mv || 0) + rateOf(s) * ctx.alpha / 60);
          else {
            const [nx, ny] = nb(s.b[0][0], s.b[0][1], s.d), open = nx >= 0 && ny >= 0 && nx < GW && ny < GH && Math.abs(nx - s.b[0][0]) + Math.abs(ny - s.b[0][1]) === 1;
            gk[i] = Math.min(open ? 1.7 : 1, gk[i] + rateOf(s) * dt); k = gk[i];
          }
        }
        drawSnake(g, i, s, k);
      }
      // turn intent: an arrow at your own head the moment you swipe / press (shows the turn that will happen at the next cell)
      for (let sl = 0; sl < 2; sl++) {
        const it = intent[sl]; if (!it) continue; it.t -= dt; if (it.t <= 0) { intent[sl] = null; continue; }
        const seat = nLoc() < 2 ? viewSeat() : sl, s = st.s[seat]; if (!s || !s.alive || st.ph !== 'play' || !ctx.mySeats.includes(seat)) continue;
        const gd = s2g(it.sd); if ((gd + 2) % 4 === s.d) continue;
        const [hx, hy] = T(s.b[0][0], s.b[0][1]), [ex, ey] = T(s.b[0][0] + DIRS[gd][0], s.b[0][1] + DIRS[gd][1]);
        const ux = (ex - hx) / V.s, uy = (ey - hy) / V.s, cx2 = hx + ux * V.s * .95, cy2 = hy + uy * V.s * .95, a = V.s * .32;
        g.globalAlpha = Math.min(1, it.t * 5) * .9; g.fillStyle = '#fff6d8'; g.beginPath();
        g.moveTo(cx2 + ux * a, cy2 + uy * a); g.lineTo(cx2 - ux * a * .6 - uy * a, cy2 - uy * a * .6 + ux * a); g.lineTo(cx2 - ux * a * .6 + uy * a, cy2 - uy * a * .6 - ux * a); g.closePath(); g.fill();
        g.globalAlpha = 1;
      }
      // particles (grid units)
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .9; p.vy *= .9;
        const [x, y] = T(p.x, p.y); g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = p.c; D.circle(g, x, y, V.s * .14); g.fill();
      }
      g.globalAlpha = 1;
      // overlays
      const [cx, cy] = [V.ox + V.gw * V.s / 2 - V.s / 2, V.oy + V.gh * V.s / 2 - V.s / 2];
      if (st.ph === 'ready') {
        const n = Math.ceil(st.t - .2);
        D.text(g, n > 0 ? String(n) : '开始', cx, cy, {size: V.s * 4, color: '#fff3d6', font: 'deco', weight: 400, stroke: 'rgba(60,20,5,.7)', strokeW: 6});
        D.text(g, '第 ' + st.round + ' 回合', cx, cy - V.s * 3.2, {size: V.s * 1.4, color: '#ffe39a', font: 'deco', weight: 400, stroke: 'rgba(60,20,5,.7)', strokeW: 4});
        // start arrows near own snake
        for (const i of ctx.mySeats) { const s = st.s[i], [hx, hy] = T(s.b[0][0], s.b[0][1]); D.text(g, nLoc() === 2 ? ctx.name(i) : '你', hx, hy - V.s * 1.3, {size: Math.max(12, V.s * .8), color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 3}); }
      } else if (st.ph === 'between' || st.ph === 'over') {
        g.fillStyle = 'rgba(20,10,4,.45)'; g.fillRect(V.ox - V.s / 2, cy - V.s * 2.2, V.gw * V.s, V.s * 5.2);
        D.text(g, st.msg, cx, cy - V.s * .5, {size: Math.min(V.s * 1.2, cv.w / 16), color: '#fff3d6', font: 'deco', weight: 400});
        D.text(g, st.wins[0] + '  :  ' + st.wins[1], cx, cy + V.s * 1.1, {size: V.s * 1.2, color: '#ffe39a', font: 'deco', weight: 400});
        D.text(g, '本回合长度  ' + st.s[0].b.length + ' : ' + st.s[1].b.length, cx, cy + V.s * 2.3, {size: Math.max(11, V.s * .6), color: 'rgba(255,243,214,.8)'});
      }
      if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; else D.text(g, banner.txt, cx, V.oy + V.s * 1.2, {size: Math.max(14, V.s * .9), color: '#fff3d6', stroke: 'rgba(40,20,5,.7)', strokeW: 4}); }
      g.restore();
      // touch pads
      for (const f of padFlash) f.t -= dt; padFlash = padFlash.filter(f => f.t > 0);
      for (const pd of V.pads) drawPad(g, pd);
      if (flash > 0) { g.fillStyle = `rgba(255,230,160,${flash * .2})`; g.fillRect(0, 0, cv.w, cv.h); }
    }
    info(); status();
    return inst;
  },
});
