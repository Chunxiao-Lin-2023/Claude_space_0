/* 贪吃蛇对战 — realtime, host-authoritative, tick based. */
const D = BX.draw, C = BX.C;
const GW = 32, GH = 20, TICK = 1 / 20;           // sim tick 20 Hz; normal snake moves every 2 ticks (10 steps/s), boosted every tick
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // up right down left (grid)
const WINR = 2, MAXR = 7;
const COLS = [['#d8442f', '#f6b26b', '#7a1a10'], ['#2f7fb8', '#9fd3f0', '#123a5a']];

BX.register({
  id: 'snake', title: '贪吃蛇对战', cat: 'arcade', order: 3, sub: '抢食长身，逼对方撞墙',
  desc: '两条蛇同场争食：吃到果子变长，撞墙、撞身体就输掉本回合，迎头相撞同归于尽。偶尔出现加速果和双倍果，三局两胜。',
  kind: 'realtime', seats: 2, seatNames: ['赤蛇', '青蛇'], seatColors: ['#d8442f', '#2f7fb8'], noFirst: true,
  rules: `<p>两条蛇在 32×20 的格子场地上同时前进（约每秒 10 格）。用方向键控制蛇头转向，蛇不能直接掉头。</p>
<p><b>吃果子</b>：普通果子（桃）让蛇长 1 节、得 1 分。场上偶尔出现限时的<b>加速果</b>（闪电，5 秒内移动速度翻倍）和<b>双倍果</b>（金元宝，6 秒内吃到的果子长度和分数都翻倍），过一会儿会消失。</p>
<p><b>死亡</b>：蛇头撞到场地边墙、自己或对方的身体即死亡。两个蛇头撞到同一格或迎面相撞，<b>双方同时死亡</b>（本回合平局，重赛）。</p>
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
    function mkSnake(i) {
      const y = i ? GH / 2 - 1 : GH / 2, x0 = i ? GW - 6 : 5, d = i ? 3 : 1, body = [];
      for (let k = 0; k < 4; k++) body.push([x0 - DIRS[d][0] * k, y]);
      return {b: body, d, q: [], grow: 0, alive: true, boost: 0, dbl: 0, score: 0, lastIn: -1};
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
    function moveSnakes(movers) {
      const heads = st.s.map((s, i) => {
        if (!movers[i]) return null;
        while (s.q.length) { const nd = s.q.shift(); if ((nd + 2) % 4 !== s.d) { s.d = nd; break; } }
        return [s.b[0][0] + DIRS[s.d][0], s.b[0][1] + DIRS[s.d][1]];
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
        s.b.unshift(heads[i]);
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
    const pend = [[], []];            // per local slot queued screen dirs (+ counter so host sees every press)
    const cnt = [0, 0], held = [[], []];
    const push = (slot, sd) => { pend[slot].push(sd); if (pend[slot].length > 3) pend[slot].shift(); };
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
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e); const ph = padHit(p);
      if (ph) { push(ph.slot, ph.sd); padFlash.push({pd: ph.pd, sd: ph.sd, t: .18}); try { navigator.vibrate && navigator.vibrate(8); } catch (er) {} return; }
      sw.set(e.pointerId, {x: p.x, y: p.y, slot: slotOfPoint(p)});
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      const s = sw.get(e.pointerId); if (!s) return; const p = cv.pos(e);
      const dx = p.x - s.x, dy = p.y - s.y, th = 22;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      push(s.slot, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      s.x = p.x; s.y = p.y;
    });
    const up = e => sw.delete(e.pointerId);
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
      if (op.alive && (level >= 3 || (level === 2 && Math.random() < .8))) for (const [dx, dy] of DIRS) danger.add((opH[0] + dx) + (opH[1] + dy) * GW);
      const moves = [0, 1, 2, 3].filter(d => (d + 2) % 4 !== me.d && ok(H[0] + DIRS[d][0], H[1] + DIRS[d][1]));
      if (!moves.length) { m.out = {}; return m.out; }
      const flood = (sx, sy, cap) => {
        const seen = new Uint8Array(GW * GH); seen[sx + sy * GW] = 1; const qq = [[sx, sy]]; let n = 0;
        while (qq.length && n < cap) { const [x, y] = qq.pop(); n++; for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (ok(nx, ny) && !seen[nx + ny * GW]) { seen[nx + ny * GW] = 1; qq.push([nx, ny]); } } }
        return n;
      };
      // BFS distance map from head
      const targets = st.food.slice(); if (st.bonus && level >= 2) targets.push([st.bonus.x, st.bonus.y]);
      let pick = -1;
      if (level === 1) {
        if (Math.random() < .12) pick = moves[Math.floor(Math.random() * moves.length)];
        else { let bd = 1e9; const f = targets[0] || [GW / 2, GH / 2]; for (const d of moves) { const nx = H[0] + DIRS[d][0], ny = H[1] + DIRS[d][1], dd = Math.abs(nx - f[0]) + Math.abs(ny - f[1]) + Math.random() * .5; if (dd < bd) { bd = dd; pick = d; } } }
      } else {
        // BFS from each candidate first move
        const dist = new Int16Array(GW * GH).fill(-1), first = new Int8Array(GW * GH).fill(-1), q = [];
        for (const d of moves) { const nx = H[0] + DIRS[d][0], ny = H[1] + DIRS[d][1], i = nx + ny * GW; if (danger.has(i) && moves.length > 1) continue; dist[i] = 1; first[i] = d; q.push(i); }
        for (let qi = 0; qi < q.length; qi++) { const i = q[qi], x = i % GW, y = (i - x) / GW; for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, j = nx + ny * GW; if (ok(nx, ny) && dist[j] < 0) { dist[j] = dist[i] + 1; first[j] = first[i]; q.push(j); } } }
        let best = null, bs = -1e9;
        for (const f of targets) {
          const i = f[0] + f[1] * GW; if (dist[i] < 0) continue;
          let sc = -dist[i] + Math.random() * .3;
          if (level >= 3) { const od = Math.abs(opH[0] - f[0]) + Math.abs(opH[1] - f[1]); if (od < dist[i] - 1) sc -= 6; if (st.bonus && f[0] === st.bonus.x && f[1] === st.bonus.y) sc += 6; }
          if (sc > bs) { bs = sc; best = first[i]; }
        }
        const need = me.b.length + 2;
        const space = d => flood(H[0] + DIRS[d][0], H[1] + DIRS[d][1], level >= 3 ? 400 : 120);
        if (best != null && best >= 0) {
          if (level >= 3 || Math.random() < .9) { if (space(best) >= Math.min(need, level >= 3 ? 400 : 120)) pick = best; }
          else pick = best;
        }
        if (pick < 0) { let bv = -1; for (const d of moves) { const v = space(d) - (danger.has((H[0] + DIRS[d][0]) + (H[1] + DIRS[d][1]) * GW) ? 50 : 0) + Math.random(); if (v > bv) { bv = v; pick = d; } } }
      }
      m.out = {g: pick, n: (m.n = (m.n || 0) + 1)};
      return m.out;
    }
    /* ---------- events / effects ---------- */
    const curB = [null, null];
    let seenEv = 0, parts = [], shake = 0, flash = 0, lastHead = [null, null], moveT = [1, 1], prevB = [null, null], banner = null;
    function playEv() {
      for (const e of st.ev) if (e.id > seenEv) {
        seenEv = e.id;
        if (e.k === 'eat') { ctx.sfx(e.b > 1 ? 'coin' : 'pop'); burst(st.s[e.a].b[0], COLS[e.a][1], 10); }
        else if (e.k === 'bonus') { ctx.sfx(e.b ? 'coin' : 'swish'); burst(st.s[e.a].b[0], e.b ? '#ffd76a' : '#9fe0ff', 22); banner = {txt: ctx.name(e.a) + (e.b ? ' 双倍！' : ' 加速！'), t: 1.4}; }
        else if (e.k === 'die') { ctx.sfx('crash'); shake = 10; for (const c of st.s[e.a].b.slice(0, 12)) burst(c, COLS[e.a][0], 3); }
        else if (e.k === 'round') { ctx.sfx(e.a >= 0 ? 'gong' : 'draw'); flash = 1; }
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
    const lastN = [{}, {}];
    const inst = {
      st,
      input(seat, slot, nLocal) {
        const q = pend[slot]; if (!q.length) return held[slot].length ? held[slot] : {};
        const sd = q.shift(); cnt[slot]++;
        held[slot] = {g: s2g(sd), n: cnt[slot] + seat * 1e6};
        return held[slot];
      },
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        for (let i = 0; i < 2; i++) {
          const inp = inputs[i] || {};
          if (inp.g != null && inp.n != null && inp.n !== lastN[i].n) { lastN[i] = inp; const s = st.s[i]; if (s.q.length < 3) s.q.push(inp.g | 0); }
        }
        if (st.ph === 'ready') { st.t -= dt; if (st.t <= 0) { st.ph = 'play'; fx('go'); } }
        else if (st.ph === 'between') { st.t -= dt; if (st.t <= 0) { st.round++; newRound(); } }
        else if (st.ph === 'play') {
          st.acc = (st.acc || 0) + dt; st.rt += dt;
          for (const s of st.s) { s.boost = Math.max(0, s.boost - dt); s.dbl = Math.max(0, s.dbl - dt); }
          if (st.bonus) { st.bonus.t -= dt; if (st.bonus.t <= 0) { st.bonus = null; st.nextBonus = 6 + Math.random() * 6; } }
          else { st.nextBonus -= dt; if (st.nextBonus <= 0) { const c = freeCell(); if (c) { st.bonus = {x: c[0], y: c[1], k: Math.random() < .5 ? 'speed' : 'dbl', t: 7}; fx('spawn'); } else st.nextBonus = 3; } }
          while (st.acc >= TICK && st.ph === 'play') {
            st.acc -= TICK; st.tick++;
            const movers = st.s.map(s => s.alive && (s.boost > 0 || st.tick % 2 === 0));
            if (movers[0] || movers[1]) moveSnakes(movers);
          }
          if (st.ph === 'play' && st.rt >= roundLen) {
            const a = st.s[0].b.length * 100 + st.s[0].score, b = st.s[1].b.length * 100 + st.s[1].score;
            endRound(a === b ? -1 : a > b ? 0 : 1, a === b ? '时间到，长度相同，本回合重赛' : '时间到！' + ctx.name(a > b ? 0 : 1) + ' 更长，赢得本回合');
          }
        }
        playEv(); info(); status();
      },
      snapshot() {
        return {s: st.s.map(s => [s.b.map(c => c[0] + c[1] * GW), s.d, s.alive ? 1 : 0, +s.boost.toFixed(1), +s.dbl.toFixed(1), s.score]), f: st.food.map(f => f[0] + f[1] * GW),
          bo: st.bonus ? [st.bonus.x, st.bonus.y, st.bonus.k, +st.bonus.t.toFixed(1)] : null, w: st.wins, tt: st.tot, r: st.round, ph: st.ph, t: +st.t.toFixed(2), rt: +st.rt.toFixed(1), m: st.msg, ev: st.ev, o: st.over};
      },
      restore(d) {
        st.s = d.s.map(a => ({b: a[0].map(i => [i % GW, Math.floor(i / GW)]), d: a[1], alive: !!a[2], boost: a[3], dbl: a[4], score: a[5], q: []}));
        st.food = d.f.map(i => [i % GW, Math.floor(i / GW)]); st.bonus = d.bo ? {x: d.bo[0], y: d.bo[1], k: d.bo[2], t: d.bo[3]} : null;
        st.wins = d.w; st.tot = d.tt; st.round = d.r; st.ph = d.ph; st.t = d.t; st.rt = d.rt; st.msg = d.m; st.ev = d.ev; st.over = d.o;
        playEv(); info(); status();
      },
      key: onKey,
      resize() { V = lay(); },
      draw(dt) { draw(dt); },
    };
    /* ---------- drawing ---------- */
    function drawField(g) {
      const [x0, y0] = T(V.flip ? GW - 1 : 0, V.flip ? GH - 1 : 0);
      const fw = V.gw * V.s, fh = V.gh * V.s;
      const L0 = V.portrait ? V.ox : V.ox, T0 = V.oy;
      D.wood(g, L0 - V.s * .55, T0 - V.s * .55, fw + V.s * 1.1, fh + V.s * 1.1, {r: V.s * .6, base: '#6b3a1c', dark: '#2a1206', seed: 8, vertical: V.portrait});
      g.strokeStyle = 'rgba(230,197,125,.6)'; g.lineWidth = 1.5; D.rr(g, L0 - V.s * .3, T0 - V.s * .3, fw + V.s * .6, fh + V.s * .6, V.s * .4); g.stroke();
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
      const pts = s.b.map(c => T(c[0], c[1]));
      // interpolate head & tail for smooth motion
      const pb = prevB[i];
      if (pb && k < 1 && s.alive) {
        const ph = pb[0], h = s.b[0];
        if (Math.abs(ph[0] - h[0]) + Math.abs(ph[1] - h[1]) === 1) { const [ax, ay] = T(ph[0], ph[1]); pts[0] = [ax + (pts[0][0] - ax) * k, ay + (pts[0][1] - ay) * k]; }
        const pt = pb[pb.length - 1], t = s.b[s.b.length - 1];
        if (pb.length === s.b.length && Math.abs(pt[0] - t[0]) + Math.abs(pt[1] - t[1]) === 1) { const [ax, ay] = T(pt[0], pt[1]); pts[pts.length - 1] = [ax + (pts[pts.length - 1][0] - ax) * k, ay + (pts[pts.length - 1][1] - ay) * k]; }
      }
      const alpha = s.alive ? 1 : .45;
      g.save(); g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round';
      const path = (ox, oy) => { g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy)); if (pts.length === 1) g.lineTo(pts[0][0] + ox + .1, pts[0][1] + oy); };
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
      // movement interpolation
      for (let i = 0; i < 2; i++) {
        const s = st.s[i], hk = s.b.length ? s.b[0][0] + ',' + s.b[0][1] : '';
        if (lastHead[i] !== hk) { if (lastHead[i] != null) moveT[i] = 0; lastHead[i] = hk; prevB[i] = curB[i]; curB[i] = s.b.map(c => c.slice()); }
        moveT[i] = Math.min(1, moveT[i] + dt / ((s.boost > 0 ? 1 : 2) * TICK));
      }
      for (let i = 0; i < 2; i++) drawSnake(g, i, st.s[i], moveT[i]);
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
        g.fillStyle = 'rgba(20,10,4,.45)'; g.fillRect(V.ox - V.s / 2, cy - V.s * 2.2, V.gw * V.s, V.s * 4.4);
        D.text(g, st.msg, cx, cy - V.s * .5, {size: Math.min(V.s * 1.2, cv.w / 16), color: '#fff3d6', font: 'deco', weight: 400});
        D.text(g, st.wins[0] + '  :  ' + st.wins[1], cx, cy + V.s * 1.1, {size: V.s * 1.2, color: '#ffe39a', font: 'deco', weight: 400});
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
