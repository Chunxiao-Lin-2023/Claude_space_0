/* 方块对战 — realtime versus falling blocks (host authoritative). */
const D = BX.draw, C = BX.C;
const BW = 10, BH = 22, HID = 2;                 // 22 rows, top 2 hidden
const NAMES = 'IJLOSTZ';
const PCOL = ['#3aa6a0', '#2f5d9a', '#d9822b', '#e0b040', '#5a9a3a', '#8a4a9a', '#c8402c', '#6b5a4a'];   // + garbage
const BASE = [[[0, 1], [1, 1], [2, 1], [3, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]]];
const BOX = [4, 3, 3, 4, 3, 3, 3];
const ROT = BASE.map((cells, t) => { const n = BOX[t], out = [cells]; for (let r = 1; r < 4; r++) out.push(t === 3 ? cells : out[r - 1].map(([x, y]) => [n - 1 - y, x])); return out; });
/* SRS kicks (y up in the tables → negated when applied) */
const KJ = {'01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]};
const KI = {'01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], '32': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], '03': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]};
const SPEED = [0, 1, 1.4, 1.9, 2.6, 3.5, 4.7, 6.3, 8.5, 11, 15, 20, 28, 40, 60, 60];
const ATK = [0, 0, 1, 2, 4];

function fits(b, t, r, x, y) {
  for (const [cx, cy] of ROT[t][r]) { const X = x + cx, Y = y + cy; if (X < 0 || X >= BW || Y >= BH) return false; if (Y >= 0 && b[Y * BW + X]) return false; }
  return true;
}
function dropY(b, t, r, x, y) { while (fits(b, t, r, x, y + 1)) y++; return y; }
/* ---------- AI evaluation (Dellacherie / El-Tetris weights) ---------- */
function evalPlace(b, t, r, x, y) {
  const nb = b.slice();
  for (const [cx, cy] of ROT[t][r]) { const Y = y + cy; if (Y < 0) return -1e9; nb[Y * BW + x + cx] = 9; }
  let cleared = 0, pieceInCleared = 0;
  const rows = [];
  for (let Y = 0; Y < BH; Y++) {
    let full = true, pc = 0; for (let X = 0; X < BW; X++) { const v = nb[Y * BW + X]; if (!v) { full = false; break; } if (v === 9) pc++; }
    if (full) { cleared++; pieceInCleared += pc; } else rows.push(Y);
  }
  // build compacted board
  const cb = new Array(BW * BH).fill(0); let ry = BH - 1;
  for (let i = rows.length - 1; i >= 0; i--, ry--) for (let X = 0; X < BW; X++) cb[ry * BW + X] = nb[rows[i] * BW + X];
  let minY = 99, maxY = -1; for (const [, cy] of ROT[t][r]) { minY = Math.min(minY, cy); maxY = Math.max(maxY, cy); }
  const landing = BH - (y + (minY + maxY) / 2);
  let rowT = 0, colT = 0, holes = 0, wells = 0;
  for (let Y = 0; Y < BH; Y++) { let prev = 1; for (let X = 0; X < BW; X++) { const f = cb[Y * BW + X] ? 1 : 0; if (f !== prev) rowT++; prev = f; } if (!prev) rowT++; }
  for (let X = 0; X < BW; X++) {
    let prev = 0, seen = false;
    for (let Y = 0; Y < BH; Y++) { const f = cb[Y * BW + X] ? 1 : 0; if (f !== prev) colT++; prev = f; if (f) seen = true; else if (seen) holes++; }
    if (!prev) colT++;
    let depth = 0;
    for (let Y = 0; Y < BH; Y++) {
      const f = cb[Y * BW + X], lf = X === 0 || cb[Y * BW + X - 1], rf = X === BW - 1 || cb[Y * BW + X + 1];
      if (f) break;
      if (lf && rf) { depth++; wells += depth; } else depth = 0;
    }
  }
  let maxH = 0; for (let X = 0; X < BW; X++) for (let Y = 0; Y < BH; Y++) if (cb[Y * BW + X]) { maxH = Math.max(maxH, BH - Y); break; }
  const score = -4.5 * landing + 3.42 * cleared * pieceInCleared - 3.22 * rowT - 9.35 * colT - 7.9 * holes - 3.39 * wells - (maxH > 14 ? (maxH - 14) * 12 : 0);
  return {score, cb, cleared};
}
function candidates(b, t, y0) {
  const out = [], seenK = new Set();
  for (let r = 0; r < (t === 3 ? 1 : 4); r++) {
    if (!fits(b, t, r, 3, y0)) continue;
    for (let x = -2; x < BW; x++) {
      if (!fits(b, t, r, x, y0)) continue;
      let ok = true; for (let xx = Math.min(3, x); xx <= Math.max(3, x); xx++) if (!fits(b, t, r, xx, y0)) { ok = false; break; }
      if (!ok) continue;
      const y = dropY(b, t, r, x, y0), key = ROT[t][r].map(([cx, cy]) => (x + cx) + ',' + (y + cy)).sort().join('|');
      if (seenK.has(key)) continue; seenK.add(key);
      out.push({r, x, y});
    }
  }
  return out;
}

BX.register({
  id: 'tetris', title: '方块对战', cat: 'arcade', order: 4, sub: '消行攻击，把对手顶出局',
  desc: '经典下落方块的双人对战：七种方块随机成包，可暂存、可硬降；一次消多行就会给对手送去带缺口的垃圾行，先被顶到顶的一方输。',
  kind: 'realtime', seats: 2, seatColors: ['#c8402c', '#2f5d9a'], noFirst: true,
  rules: `<p>每人一个 10 列 × 20 行的井，七种方块（I、O、T、S、Z、J、L）以“<b>七个一包</b>”的方式随机出现，每一包里七种各一块，双方方块顺序相同。</p>
<p>移动、旋转（带墙踢）让方块落下拼满整行即可<b>消行</b>。方块触底后约半秒锁定，期间移动或旋转可以延长（最多 15 次）。可以<b>暂存</b>一块方块（每块只能换一次）；屏幕上显示后面 5 块与落点虚影。</p>
<p><b>攻击</b>：一次消 2 行送对方 1 行垃圾，3 行送 2 行，4 行送 4 行；连续消行（连击）每次额外 +1，连续两次四消（背靠背）再 +1。垃圾行从底部升起，每行有一个缺口。自己有待收的垃圾时，消行会先抵消它们；放下一块却没有消行时，待收垃圾就会升上来（井边红条显示待收数量）。</p>
<p><b>胜负</b>：新方块无法出现、或垃圾把方块顶出井口的一方输。下落速度每 30 秒提高一级。开局 2 分钟后进入<b>压力阶段</b>：每 10 秒双方各收到 1 行垃圾（加入待收队列，可用消行抵消）。</p>
<p><b>键盘</b>（单人）：← → 移动，↓ 软降，↑ 或 X 顺时针转，Z 逆时针转，空格硬降，C / Shift 暂存。<br>同屏双人：左方 A D 移动、S 软降、W 顺转、Q 逆转、E 硬降、R 暂存；右方 ← → 移动、↓ 软降、↑ 顺转、<b>,</b> 逆转、<b>.</b> 或回车 硬降、<b>/</b> 暂存。<br><b>触屏</b>：使用屏幕上的按钮，按住 ← → 可连续移动。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#3a2414', '#1a0e06');
    const cs = 11;
    const well = (ox, rows, sel) => {
      g.fillStyle = '#120a05'; g.fillRect(ox - 3, 8, cs * 7 + 6, h - 16); g.strokeStyle = '#c8a052'; g.lineWidth = 2; g.strokeRect(ox - 3, 8, cs * 7 + 6, h - 16);
      rows.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') block(ox + i * cs, h - 11 - (rows.length - j) * cs, cs, PCOL[+c]); }));
    };
    const block = (x, y, s, col) => { g.fillStyle = col; g.fillRect(x, y, s, s); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, s, 2); g.fillRect(x, y, 2, s); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y + s - 2, s, 2); g.fillRect(x + s - 2, y, 2, s); };
    well(14, ['......5', '.1..555', '11.4466', '2224466', '7777.33', '2203333'], 0);
    well(112, ['3......', '33.....', '.3..1..', '7777777', '7777.77', '7.77777'], 1);
    [[2, 0], [3, 0], [3, 1], [4, 1]].forEach(([x, y]) => block(14 + x * cs, 24 + y * cs, cs, PCOL[6]));
    g.fillStyle = '#d0533f'; g.beginPath(); g.moveTo(96, 70); g.lineTo(108, 76); g.lineTo(96, 82); g.closePath(); g.fill(); g.fillRect(88, 74, 8, 4);
  },
  create(ctx) {
    const st = {p: [mkP(), mkP()], seq: [], ph: 'ready', t: 2.2, time: 0, lvl: 1, ev: [], evId: 0, over: false, winner: -1};
    function mkP() { return {b: new Array(BW * BH).fill(0), t: 0, r: 0, x: 3, y: 0, hold: -1, hu: false, qi: 0, g: 0, lk: 0, lr: 0, low: 0, pend: [], combo: -1, b2b: false, lines: 0, sent: 0, alive: true, pid: 0, nx: [], das: 0, dasT: 0}; }
    const PRESS = BX.test ? 10 : 120, PRESSI = BX.test ? 1.5 : 10;
    const fx = (k, s, a, b) => { st.ev.push({k, s, a, b, id: ++st.evId}); if (st.ev.length > 14) st.ev.shift(); };
    function refill() { while (st.seq.length < Math.max(st.p[0].qi, st.p[1].qi) + 8) { const bag = BX.shuffle([0, 1, 2, 3, 4, 5, 6]); st.seq.push(...bag); } }
    function spawn(i, t) {
      const p = st.p[i];
      if (t == null) { refill(); t = st.seq[p.qi++]; refill(); }
      p.t = t; p.r = 0; p.x = 3; p.y = 0; p.g = 0; p.lk = 0; p.lr = 0; p.pid++;
      p.nx = st.seq.slice(p.qi, p.qi + 5);
      if (!fits(p.b, t, 0, 3, 0)) { lose(i, '新方块无法出现'); return; }
      if (fits(p.b, t, 0, 3, 1)) p.y = 1;
      p.low = p.y;
    }
    function lose(i, why) {
      const p = st.p[i]; if (!p.alive || st.over) return;
      p.alive = false; st.over = true; st.winner = 1 - i; st.ph = 'over'; fx('ko', i);
      ctx.end({winner: 1 - i, text: ctx.name(i) + ' ' + why + ' · 消行 ' + st.p[0].lines + ' : ' + st.p[1].lines});
    }
    for (const i of [0, 1]) spawn(i);
    /* ---------- core moves (host) ---------- */
    function onGround(p) { return !fits(p.b, p.t, p.r, p.x, p.y + 1); }
    function touched(p) { if (onGround(p) && p.lr < 15) { p.lk = 0; p.lr++; } }
    function move(p, dx) { if (fits(p.b, p.t, p.r, p.x + dx, p.y)) { p.x += dx; touched(p); return true; } return false; }
    function rotate(p, dir) {
      if (p.t === 3) return false;
      const nr = (p.r + dir + 4) % 4, kt = (p.t === 0 ? KI : KJ)[p.r + '' + nr];
      for (const [kx, ky] of kt) if (fits(p.b, p.t, nr, p.x + kx, p.y - ky)) { p.x += kx; p.y -= ky; p.r = nr; touched(p); return true; }
      return false;
    }
    function hold(i) {
      const p = st.p[i]; if (p.hu) return;
      const cur = p.t; p.hu = true;
      if (p.hold < 0) { p.hold = cur; spawn(i); } else { const h = p.hold; p.hold = cur; spawn(i, h); }
      p.hu = true; fx('hold', i);
    }
    function lock(i) {
      const p = st.p[i]; let above = true;
      for (const [cx, cy] of ROT[p.t][p.r]) { const Y = p.y + cy; if (Y >= 0) p.b[Y * BW + p.x + cx] = p.t + 1; if (Y >= HID) above = false; }
      const rows = [];
      for (let Y = 0; Y < BH; Y++) { let full = true; for (let X = 0; X < BW; X++) if (!p.b[Y * BW + X]) { full = false; break; } if (full) rows.push(Y); }
      if (rows.length) {
        for (const Y of rows) { p.b.splice(Y * BW, BW); p.b.unshift(...new Array(BW).fill(0)); }
        p.combo++; p.lines += rows.length;
        let atk = ATK[rows.length] + (p.combo >= 1 ? 1 : 0);
        if (rows.length === 4) { if (p.b2b) atk++; p.b2b = true; } else p.b2b = false;
        let perfect = p.b.every(v => !v); if (perfect) atk += 4;
        fx('clr', i, rows.length * 100 + Math.min(p.combo, 99), rows.map(y => y - HID));
        // cancel own incoming first
        while (atk > 0 && p.pend.length) { const c = Math.min(atk, p.pend[0].n); p.pend[0].n -= c; atk -= c; if (!p.pend[0].n) p.pend.shift(); }
        if (atk > 0) { const o = st.p[1 - i], last = o.pend.length ? o.pend[o.pend.length - 1].h : o.lastHole; o.pend.push({n: atk, h: last != null && Math.random() < .7 ? last : Math.floor(Math.random() * BW)}); o.lastHole = o.pend[o.pend.length - 1].h; p.sent += atk; fx('atk', i, atk); }
      } else {
        p.combo = -1;
        fx('lock', i);
        if (above) { lose(i, '方块锁定在井口之外'); return; }
        // receive garbage
        let budget = 8, got = 0;
        while (budget > 0 && p.pend.length) {
          const gq = p.pend[0], n = Math.min(budget, gq.n);
          for (let k = 0; k < n; k++) {
            for (let X = 0; X < BW; X++) if (p.b[X]) { lose(i, '被垃圾行顶出了井口'); return; }
            p.b.splice(0, BW); const row = new Array(BW).fill(8); row[gq.h] = 0; p.b.push(...row);
          }
          gq.n -= n; budget -= n; got += n; if (!gq.n) p.pend.shift();
        }
        if (got) fx('gar', i, got);
      }
      if (st.over) return;
      p.hu = false; spawn(i);
    }
    /* ---------- host input processing ---------- */
    const lastIn = [{lc: 0, rc: 0, cw: 0, ccw: 0, hd: 0, ho: 0}, {lc: 0, rc: 0, cw: 0, ccw: 0, hd: 0, ho: 0}];
    const delta = (I, L, k) => { const v = I[k] | 0, d = v - (L[k] | 0); L[k] = v; return d > 0 && d < 6 ? d : 0; };
    function stepPlayer(i, I, dt) {
      const p = st.p[i], L = lastIn[i];
      if (!p.alive) return;
      for (let k = delta(I, L, 'ho'); k > 0; k--) hold(i);
      for (let k = delta(I, L, 'ccw'); k > 0; k--) rotate(p, -1);
      for (let k = delta(I, L, 'cw'); k > 0; k--) rotate(p, 1);
      for (let k = delta(I, L, 'lc'); k > 0; k--) move(p, -1);
      for (let k = delta(I, L, 'rc'); k > 0; k--) move(p, 1);
      const dir = I.l && !I.r ? -1 : I.r && !I.l ? 1 : 0;
      if (dir !== p.das) { p.das = dir; p.dasT = 0; }
      else if (dir) { p.dasT += dt; if (p.dasT > .16) { let n = 0; while (p.dasT > .16 + .033 && n < 3) { p.dasT -= .033; move(p, dir); n++; } } }
      if (delta(I, L, 'hd') > 0) { const y = dropY(p.b, p.t, p.r, p.x, p.y); fx('hd', i, y - p.y, p.x); p.y = y; lock(i); return; }
      const G = SPEED[st.lvl] * (I.d ? 20 : 1) + (I.d ? 18 : 0);
      p.g += G * dt;
      while (p.g >= 1) { p.g -= 1; if (fits(p.b, p.t, p.r, p.x, p.y + 1)) { p.y++; if (p.y > p.low) { p.low = p.y; p.lr = 0; } } else { p.g = 0; break; } }
      if (onGround(p)) { p.lk += dt; if (p.lk >= .5) lock(i); } else p.lk = 0;
    }
    /* ---------- AI ---------- */
    const mem = [{}, {}];
    function plan(i, level) {
      const p = st.p[i], b = p.b;
      const opts = [{t: p.t, hold: false}];
      if (level >= 3 && !p.hu) opts.push({t: p.hold >= 0 ? p.hold : p.nx[0], hold: true});
      const all = [];
      for (const o of opts) for (const c of candidates(b, o.t, p.y)) {
        const e = evalPlace(b, o.t, c.r, c.x, c.y); let sc = e.score;
        if (level >= 3 && e.cleared >= 2) sc += e.cleared * 6;
        all.push({sc, r: c.r, x: c.x, hold: o.hold, cb: e.cb, t: o.t});
      }
      if (!all.length) return {r: p.r, x: p.x, hold: false};
      all.sort((a, b2) => b2.sc - a.sc);
      if (level >= 3) {   // one-piece look-ahead on the best few
        const nt = all[0].hold && p.hold < 0 ? p.nx[1] : p.nx[0];
        for (const c of all.slice(0, 6)) {
          let best = -1e9; for (const d of candidates(c.cb, nt, 1)) { const e = evalPlace(c.cb, nt, d.r, d.x, d.y); if (e.score > best) best = e.score; }
          c.sc2 = c.sc + best * .9;
        }
        const top = all.slice(0, 6).sort((a, b2) => b2.sc2 - a.sc2);
        return top[0];
      }
      if (level === 2) return Math.random() < .88 ? all[0] : all[Math.floor(Math.random() * Math.min(3, all.length))];
      return Math.random() < .62 ? all[0] : all[Math.floor(Math.random() * Math.min(7, all.length))];
    }
    function aiInput(i, level) {
      const p = st.p[i], m = mem[i];
      if (!m.c) m.c = {l: 0, r: 0, d: 0, lc: 0, rc: 0, cw: 0, ccw: 0, hd: 0, ho: 0};
      const c = m.c; c.d = 0;
      if (st.ph !== 'play' || !p.alive) return c;
      if (m.pid !== p.pid) { m.pid = p.pid; m.plan = plan(i, level); m.wait = [0, 26, 11, 4][level] + (level === 1 ? Math.random() * 20 : 0); m.stuck = 0; m.lastK = ''; }
      if (--m.wait > 0) return c;
      const pl = m.plan, iv = [0, 13, 6, 2][level];
      const k = p.r + ',' + p.x; if (k === m.lastK) m.stuck++; else { m.stuck = 0; m.lastK = k; }
      m.wait = iv;
      if (pl.hold && !p.hu) { c.ho++; pl.hold = false; return c; }
      if (m.stuck < 4 && p.r !== pl.r) { if ((pl.r - p.r + 4) % 4 === 3) c.ccw++; else c.cw++; return c; }
      if (m.stuck < 4 && p.x !== pl.x) { if (p.x < pl.x) c.rc++; else c.lc++; return c; }
      if (level === 1) { c.d = 1; m.wait = 1; return c; }
      c.hd++; m.wait = 30; return c;
    }
    /* ---------- local input ---------- */
    const cnt = [{lc: 0, rc: 0, cw: 0, ccw: 0, hd: 0, ho: 0}, {lc: 0, rc: 0, cw: 0, ccw: 0, hd: 0, ho: 0}];
    const tHeld = [{l: new Set(), r: new Set(), d: new Set()}, {l: new Set(), r: new Set(), d: new Set()}];
    const nLoc = () => ctx.mySeats.length;
    const KEY1 = {ArrowLeft: 'lc', KeyA: 'lc', ArrowRight: 'rc', KeyD: 'rc', ArrowUp: 'cw', KeyX: 'cw', KeyW: 'cw', KeyZ: 'ccw', KeyQ: 'ccw', ControlLeft: 'ccw', Space: 'hd', Enter: 'hd', KeyE: 'hd', KeyC: 'ho', ShiftLeft: 'ho', ShiftRight: 'ho', KeyR: 'ho'};
    const KEY2 = [{KeyA: 'lc', KeyD: 'rc', KeyW: 'cw', KeyQ: 'ccw', KeyE: 'hd', KeyR: 'ho'}, {ArrowLeft: 'lc', ArrowRight: 'rc', ArrowUp: 'cw', Comma: 'ccw', Period: 'hd', Enter: 'hd', Slash: 'ho'}];
    function press(slot, a) {
      cnt[slot][a]++;
      if (a === 'cw' || a === 'ccw') ctx.sfx('tick'); else if (a === 'lc' || a === 'rc') ctx.sfx('click');
    }
    function key(e) {
      if (e.repeat || st.over) return;
      if (nLoc() >= 2) { for (let s = 0; s < 2; s++) if (KEY2[s][e.code]) { press(s, KEY2[s][e.code]); e.preventDefault && e.preventDefault(); } }
      else if (KEY1[e.code]) { press(0, KEY1[e.code]); }
    }
    const kh = (...codes) => codes.some(c => ctx.keys.has(c));
    /* ---------- layout ---------- */
    const cv = ctx.canvas();
    const viewSeat = () => nLoc() === 1 ? ctx.mySeats[0] : 0;
    let V = null;
    const PW = {full: [19.5, 21.6], compact: [19.5, 21.6], narrow: [10.6, 24.6]};
    function lay() {
      const w = cv.w, h = cv.h, touch = BX.TOUCH.matches, n = nLoc(), portrait = h > w;
      let A = {x: 0, y: 0, w, h}; const cl = [];
      const me = viewSeat(), other = 1 - me;
      let kinds;
      if (touch && n >= 1) {
        if (portrait) {
          const CH = BX.clamp(h * (n === 2 ? .27 : .25), 160, 240); A.h -= CH;
          if (n === 2) { cl.push({x: 0, y: h - CH, w: w / 2, h: CH, kind: 'full', slot: 0, seat: 0}, {x: w / 2, y: h - CH, w: w / 2, h: CH, kind: 'full', slot: 1, seat: 1}); kinds = [['narrow', 0], ['narrow', 1]]; }
          else { cl.push({x: 0, y: h - CH, w: w * .55, h: CH, kind: 'move', slot: 0, seat: me}, {x: w * .55, y: h - CH, w: w * .45, h: CH, kind: 'rot', slot: 0, seat: me}); kinds = [['compact', me]]; }
        } else {
          const CW = BX.clamp(w * .18, 136, 200); A.x = CW; A.w = w - 2 * CW;
          if (n === 2) { cl.push({x: 0, y: 0, w: CW, h, kind: 'full', slot: 0, seat: 0}, {x: w - CW, y: 0, w: CW, h, kind: 'full', slot: 1, seat: 1}); kinds = [['full', 0], ['full', 1]]; }
          else { cl.push({x: 0, y: 0, w: CW, h, kind: 'move', slot: 0, seat: me}, {x: w - CW, y: 0, w: CW, h, kind: 'rot', slot: 0, seat: me}); kinds = [['compact', me]]; }
        }
      } else if (portrait && w < 700) kinds = [['narrow', me], ['narrow', other]];
      else kinds = [['full', me], ['full', other]];
      const gap = 1.4, tw = kinds.reduce((s, k) => s + PW[k[0]][0], 0) + gap * (kinds.length - 1), th = Math.max(...kinds.map(k => PW[k[0]][1]));
      const f = BX.fit(A.w, A.h, tw, th, 6), cs = Math.min(f.s, 40);
      let x = A.x + (A.w - tw * cs) / 2; const y0 = A.y + (A.h - th * cs) / 2;
      const panels = kinds.map(([kind, seat]) => { const p = {kind, seat, x, y: y0 + (th - PW[kind][1]) * cs / 2, cs}; x += (PW[kind][0] + gap) * cs; return p; });
      // touch buttons
      const btns = [];
      for (const c of cl) {
        const G = {full: [[['ho', '暂存'], ['ccw', '↺'], ['cw', '↻']], [['l', '←'], ['d', '↓'], ['r', '→']], [['hd', '硬降', 3]]],
          move: [[['ho', '暂存', 3]], [['l', '←'], ['d', '↓'], ['r', '→']]], rot: [[['ccw', '↺'], ['cw', '↻']], [['hd', '硬降', 2]]]}[c.kind];
        const cols = Math.max(...G.map(r => r.reduce((s, b) => s + (b[2] || 1), 0))), rows = G.length, gp = 8;
        const bs = Math.min((c.w - 16 - gp * (cols - 1)) / cols, (c.h - 16 - gp * (rows - 1)) / rows, 86);
        const gw = cols * bs + gp * (cols - 1), gh = rows * bs + gp * (rows - 1);
        const gx = c.x + (c.w - gw) / 2, gy = portrait ? c.y + (c.h - gh) / 2 : c.y + c.h - gh - 14;
        G.forEach((row, ri) => { let cx = gx; for (const [a, lb, span = 1] of row) { const bw = span * bs + (span - 1) * gp; const hh = (c.kind !== 'full' && ri === 0 && a === 'ho') ? bs * .7 : bs; btns.push({a, lb, x: cx, y: gy + ri * (bs + gp) + (bs - hh), w: bw, h: hh, slot: c.slot, seat: c.seat}); cx += bw + gp; } });
      }
      return {w, h, panels, btns, touch, portrait};
    }
    /* ---------- touch ---------- */
    const ptr = new Map();
    let flashB = [];
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!V) return; const p = cv.pos(e);
      for (const b of V.btns) {
        if (p.x < b.x - 4 || p.x > b.x + b.w + 4 || p.y < b.y - 4 || p.y > b.y + b.h + 4) continue;
        const slot = nLoc() >= 2 ? b.slot : 0;
        if (b.a === 'l' || b.a === 'r' || b.a === 'd') { tHeld[slot][b.a].add(e.pointerId); ptr.set(e.pointerId, [slot, b.a]); if (b.a !== 'd') press(slot, b.a + 'c'); }
        else press(slot, b.a);
        flashB.push({b, t: .15}); try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
        try { navigator.vibrate && navigator.vibrate(6); } catch (er) {}
        return;
      }
    });
    const up = e => { const q = ptr.get(e.pointerId); if (q) { tHeld[q[0]][q[1]].delete(e.pointerId); ptr.delete(e.pointerId); } };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    /* ---------- effects ---------- */
    let seenEv = 0, parts = [], pops = [], flashes = [], shakeP = [0, 0], koT = 0;
    function playEv() {
      for (const e of st.ev) if (e.id > seenEv) {
        seenEv = e.id;
        if (e.k === 'lock') ctx.sfx('place');
        else if (e.k === 'hd') { ctx.sfx('hit'); shakeP[e.s] = Math.max(shakeP[e.s], 3); }
        else if (e.k === 'hold') ctx.sfx('swish');
        else if (e.k === 'clr') {
          const n = Math.floor(e.a / 100), combo = e.a % 100;
          ctx.sfx(n >= 4 ? 'boom' : n >= 2 ? 'score' : 'pop');
          flashes.push({s: e.s, rows: e.b, t: .35});
          for (const y of e.b) for (let k = 0; k < 10; k++) parts.push({s: e.s, x: Math.random() * BW, y: y + .5, vx: (Math.random() - .5) * 14, vy: -Math.random() * 10, t: .7, c: k % 2 ? '#ffe39a' : '#fff'});
          const txt = ['', '', '双消', '三消', '四消！'][n] + (combo >= 1 ? (n >= 2 ? ' · ' : '') + '连击 ' + combo : '');
          if (txt) pops.push({s: e.s, txt, t: 1.2});
          if (n >= 4) shakeP[e.s] = 8;
        } else if (e.k === 'atk') { pops.push({s: 1 - e.s, txt: '+' + e.a + ' 垃圾', t: 1, red: true}); ctx.sfx('whoosh'); }
        else if (e.k === 'gar') { shakeP[e.s] = Math.max(shakeP[e.s], 6); ctx.sfx('crash'); }
        else if (e.k === 'ko') { ctx.sfx('gong'); koT = 1; }
        else if (e.k === 'press') { ctx.sfx('tick'); for (const i of [0, 1]) pops.push({s: i, txt: '压力 +1', t: .9, red: true}); }
      }
    }
    const info = () => { for (const i of [0, 1]) ctx.info(i, '消' + st.p[i].lines + ' 攻' + st.p[i].sent); };
    let lastStatus = '';
    function status() {
      const s = st.over ? '对局结束' : st.ph === 'ready' ? '准备…' : st.time >= PRESS ? '等级 ' + st.lvl + ' · 压力阶段：垃圾行定时上涨！' : '等级 ' + st.lvl + ' · 消行攻击，把对手顶出局';
      if (s !== lastStatus) { lastStatus = s; ctx.status(s); }
    }
    /* ---------- drawing ---------- */
    const sprites = new Map();
    function sprite(ci, s) {
      const k = ci + '@' + Math.round(s * cv.dpr); let c = sprites.get(k); if (c) return c;
      const px = Math.max(2, Math.round(s * cv.dpr)); c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
      const col = PCOL[ci], bv = Math.max(1, px * .13);
      const gr = g.createLinearGradient(0, 0, px, px); gr.addColorStop(0, D.shade(col, 18)); gr.addColorStop(1, D.shade(col, -18));
      g.fillStyle = gr; g.fillRect(0, 0, px, px);
      g.fillStyle = 'rgba(255,255,255,.38)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(px, 0); g.lineTo(px - bv, bv); g.lineTo(bv, bv); g.lineTo(bv, px - bv); g.lineTo(0, px); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(px, px); g.lineTo(0, px); g.lineTo(bv, px - bv); g.lineTo(px - bv, px - bv); g.lineTo(px - bv, bv); g.lineTo(px, 0); g.closePath(); g.fill();
      if (ci < 7) { g.strokeStyle = 'rgba(255,240,200,.28)'; g.lineWidth = Math.max(1, px * .06); g.strokeRect(px * .3, px * .3, px * .4, px * .4); }
      else { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(px * .25, px * .45, px * .5, px * .1); }
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.strokeRect(.5, .5, px - 1, px - 1);
      if (sprites.size > 120) sprites.clear(); sprites.set(k, c); return c;
    }
    const blk = (g, x, y, s, ci) => g.drawImage(sprite(ci, s), x, y, s, s);
    function miniPiece(g, t, cx, cy, s, dim) {
      const cells = ROT[t][0]; let minx = 9, maxx = -1, miny = 9, maxy = -1;
      for (const [x, y] of cells) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
      const ox = cx - (maxx - minx + 1) * s / 2 - minx * s, oy = cy - (maxy - miny + 1) * s / 2 - miny * s;
      if (dim) g.globalAlpha = .4; for (const [x, y] of cells) blk(g, ox + x * s, oy + y * s, s, t); g.globalAlpha = 1;
    }
    function drawWell(g, i, wx, wy, cs, mini) {
      const p = st.p[i], ww = BW * cs, wh = (BH - HID) * cs;
      D.wood(g, wx - cs * .45, wy - cs * .45, ww + cs * .9, wh + cs * .9, {r: cs * .35, base: '#6e2a16', dark: '#250a03', seed: 13 + i, vertical: true});
      g.strokeStyle = 'rgba(230,197,125,.7)'; g.lineWidth = Math.max(1, cs * .08); D.rr(g, wx - cs * .22, wy - cs * .22, ww + cs * .44, wh + cs * .44, cs * .2); g.stroke();
      const bgG = g.createLinearGradient(0, wy, 0, wy + wh); bgG.addColorStop(0, '#1d140d'); bgG.addColorStop(1, '#120b06'); g.fillStyle = bgG; g.fillRect(wx, wy, ww, wh);
      // danger tint
      let topY = BH; for (let Y = 0; Y < BH && topY === BH; Y++) for (let X = 0; X < BW; X++) if (p.b[Y * BW + X]) { topY = Y; break; }
      if (topY < 8 && p.alive) { g.fillStyle = `rgba(200,40,30,${.12 + .1 * Math.sin(performance.now() / 150)})`; g.fillRect(wx, wy, ww, wh); }
      if (!mini) {
        g.strokeStyle = 'rgba(230,197,125,.06)'; g.lineWidth = 1; g.beginPath();
        for (let X = 1; X < BW; X++) { g.moveTo(wx + X * cs, wy); g.lineTo(wx + X * cs, wy + wh); }
        for (let Y = 1; Y < BH - HID; Y++) { g.moveTo(wx, wy + Y * cs); g.lineTo(wx + ww, wy + Y * cs); }
        g.stroke();
      }
      g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
      for (let Y = HID; Y < BH; Y++) for (let X = 0; X < BW; X++) { const v = p.b[Y * BW + X]; if (v) blk(g, wx + X * cs, wy + (Y - HID) * cs, cs, v - 1); }
      if (p.alive && st.ph !== 'ready') {
        const gy = dropY(p.b, p.t, p.r, p.x, p.y), col = PCOL[p.t];
        if (!mini) for (const [cx, cy] of ROT[p.t][p.r]) {
          const X = wx + (p.x + cx) * cs, Y = wy + (gy + cy - HID) * cs;
          g.fillStyle = D.alpha(col, .18); g.fillRect(X + 1, Y + 1, cs - 2, cs - 2); g.strokeStyle = D.alpha(col, .7); g.lineWidth = 1.5; g.strokeRect(X + 1.5, Y + 1.5, cs - 3, cs - 3);
        }
        const lockGlow = p.lk > 0 ? Math.min(1, p.lk / .5) : 0;
        for (const [cx, cy] of ROT[p.t][p.r]) blk(g, wx + (p.x + cx) * cs, wy + (p.y + cy - HID) * cs, cs, p.t);
        if (lockGlow && !mini) { g.fillStyle = `rgba(255,255,255,${lockGlow * .25})`; for (const [cx, cy] of ROT[p.t][p.r]) g.fillRect(wx + (p.x + cx) * cs, wy + (p.y + cy - HID) * cs, cs, cs); }
      }
      // line clear flashes
      for (const f of flashes) if (f.s === i) { g.fillStyle = `rgba(255,245,210,${f.t / .35 * .85})`; for (const y of f.rows) g.fillRect(wx, wy + y * cs - cs * (1 - f.t / .35) * .3, ww, cs * (1 + (1 - f.t / .35) * .6)); }
      for (const q of parts) if (q.s === i) { g.globalAlpha = Math.min(1, q.t * 2); g.fillStyle = q.c; g.fillRect(wx + q.x * cs, wy + q.y * cs, cs * .18, cs * .18); }
      g.globalAlpha = 1;
      if (!p.alive) { g.fillStyle = 'rgba(10,5,2,.55)'; g.fillRect(wx, wy, ww, wh); }
      g.restore();
      // spawn-zone pieces above the rim (rows 0..1)
      // pending garbage bar
      const pend = p.pendN != null ? p.pendN : p.pend.reduce((s, q) => s + q.n, 0);
      const bx = wx - cs * .62, bw2 = cs * .34;
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(bx, wy, bw2, wh);
      if (pend) { const hh = Math.min(wh, pend * cs); const gr = g.createLinearGradient(0, wy + wh - hh, 0, wy + wh); gr.addColorStop(0, '#ff6a4a'); gr.addColorStop(1, '#a8231a'); g.fillStyle = gr; g.fillRect(bx, wy + wh - hh, bw2, hh); }
      if (!p.alive) D.text(g, '出局', wx + ww / 2, wy + wh / 2, {size: cs * (mini ? 2.6 : 2.4), color: '#ffd0c0', font: 'deco', weight: 400, stroke: 'rgba(0,0,0,.6)', strokeW: 4});
      else if (st.over && st.winner === i) D.text(g, '胜', wx + ww / 2, wy + wh / 2, {size: cs * 4, color: '#ffe39a', font: 'deco', weight: 400, stroke: 'rgba(80,30,5,.7)', strokeW: 5});
    }
    function drawPanel(g, P) {
      const i = P.seat, p = st.p[i], cs = P.cs, sh = shakeP[i];
      g.save(); if (sh > .3) g.translate((Math.random() - .5) * sh, (Math.random() - .5) * sh);
      const nameS = Math.max(12, Math.min(18, cs * .75));
      if (P.kind === 'narrow') {
        const wx = P.x + .6 * cs, wy = P.y + 4.8 * cs;
        D.text(g, ctx.name(i), P.x + 5.6 * cs, P.y + .7 * cs, {size: nameS, color: ctx.color(i) === '#c8402c' ? '#ffb4a0' : '#a8c8ff', maxW: 10 * cs});
        g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, wx, P.y + 1.4 * cs, 10 * cs, 3 * cs, cs * .3); g.fill();
        D.text(g, '暂存', wx + 1.2 * cs, P.y + 1.85 * cs, {size: Math.max(9, cs * .45), color: 'rgba(243,226,192,.6)'});
        if (p.hold >= 0) miniPiece(g, p.hold, wx + 1.4 * cs, P.y + 3.2 * cs, cs * .55, p.hu);
        D.text(g, '下一块', wx + 4.2 * cs, P.y + 1.85 * cs, {size: Math.max(9, cs * .45), color: 'rgba(243,226,192,.6)'});
        (p.nx || []).slice(0, 3).forEach((t, k) => miniPiece(g, t, wx + (4.3 + k * 2.3) * cs, P.y + 3.2 * cs, cs * (k ? .45 : .6)));
        drawWell(g, i, wx, wy, cs, false);
      } else {
        const wx = P.x + 4.9 * cs, wy = P.y + 1.6 * cs;
        const nameCol = i === 0 ? '#ffb4a0' : '#a8c8ff';
        D.text(g, ctx.name(i) + (ctx.isAI(i) ? ' · ' + BX.LEVELS[ctx.level(i)] : ''), wx + 5 * cs, P.y + .55 * cs, {size: nameS, color: nameCol, maxW: 14 * cs, font: 'serif', weight: 700});
        // hold box
        const box = (x, y, w2, h2, title) => { g.fillStyle = 'rgba(20,12,6,.7)'; D.rr(g, x, y, w2, h2, cs * .3); g.fill(); g.strokeStyle = 'rgba(230,197,125,.45)'; g.lineWidth = 1; g.stroke(); D.text(g, title, x + w2 / 2, y + cs * .5, {size: Math.max(10, cs * .5), color: 'rgba(243,226,192,.75)'}); };
        box(P.x, wy, 4.1 * cs, 3.6 * cs, '暂存');
        if (p.hold >= 0) miniPiece(g, p.hold, P.x + 2.05 * cs, wy + 2.2 * cs, cs * .7, p.hu);
        box(P.x + 15.3 * cs, wy, 4.2 * cs, 14.4 * cs, '下一块');
        (p.nx || []).slice(0, 5).forEach((t, k) => miniPiece(g, t, P.x + 17.4 * cs, wy + (2.3 + k * 2.6) * cs, cs * (k ? .6 : .75)));
        // stats
        const sx = P.x + 2.05 * cs; let sy = wy + 4.6 * cs;
        if (P.kind === 'compact') {
          const o = 1 - i, ms = cs * .38;
          D.text(g, ctx.name(o), sx, sy, {size: Math.max(10, cs * .48), color: o === 0 ? '#ffb4a0' : '#a8c8ff', maxW: 4 * cs});
          drawWell(g, o, sx - 5 * ms, sy + .6 * cs, ms, true);
          sy += .6 * cs + 20 * ms + cs * 1.1;
        }
        const stat = (lb, v) => { D.text(g, lb, sx, sy, {size: Math.max(9, cs * .42), color: 'rgba(243,226,192,.6)'}); D.text(g, String(v), sx, sy + cs * .75, {size: Math.max(13, cs * .8), color: '#f3e2c0', font: 'deco', weight: 400}); sy += cs * 1.9; };
        if (P.kind === 'full') { stat('消行', p.lines); stat('攻击', p.sent); stat('等级', st.lvl); }
        else { stat('消行 / 攻击', p.lines + ' / ' + p.sent); }
        drawWell(g, i, wx, wy, cs, false);
      }
      // popups
      for (const q of pops) if (q.s === i) {
        const k = 1 - q.t / 1.2, wx = P.kind === 'narrow' ? P.x + 5.6 * cs : P.x + 9.9 * cs, wy = P.y + (P.kind === 'narrow' ? 12 : 9) * cs;
        g.globalAlpha = Math.min(1, q.t * 2);
        D.text(g, q.txt, wx, wy - k * cs * 2, {size: Math.max(16, cs * 1.1), color: q.red ? '#ff8a6a' : '#ffe39a', font: 'deco', weight: 400, stroke: 'rgba(40,15,5,.8)', strokeW: 4});
        g.globalAlpha = 1;
      }
      g.restore();
    }
    function drawBtns(g) {
      for (const b of V.btns) {
        const lit = flashB.some(f => f.b === b) || (b.a === 'l' || b.a === 'r' || b.a === 'd') && tHeld[nLoc() >= 2 ? b.slot : 0][b.a].size;
        g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, b.x + 1, b.y + 3, b.w, b.h, 14); g.fill();
        const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h);
        if (b.a === 'hd') { gr.addColorStop(0, lit ? '#e8705a' : '#c8402c'); gr.addColorStop(1, '#8a2418'); }
        else { gr.addColorStop(0, lit ? '#6a4a2c' : '#4a3020'); gr.addColorStop(1, '#2a180c'); }
        g.fillStyle = gr; D.rr(g, b.x, b.y, b.w, b.h, 14); g.fill();
        g.strokeStyle = lit ? '#ffe39a' : 'rgba(230,197,125,.45)'; g.lineWidth = 1.5; g.stroke();
        D.text(g, b.lb, b.x + b.w / 2, b.y + b.h / 2, {size: Math.min(26, b.h * (b.lb.length > 1 ? .32 : .45)), color: '#f3e2c0', weight: 700});
      }
      if (nLoc() >= 2 && V.btns.length) {
        for (const s of [0, 1]) { const b = V.btns.find(q => q.slot === s); if (b) D.text(g, ctx.name(s), b.x + 4, b.y - 10, {size: 11, color: s === 0 ? '#ffb4a0' : '#a8c8ff', align: 'left'}); }
      }
    }
    function draw(dt) {
      const g = cv.g; cv.clear();
      if (!V || V.w !== cv.w || V.h !== cv.h) V = lay();
      for (const s of [0, 1]) shakeP[s] = Math.max(0, shakeP[s] - dt * 30);
      for (const f of flashes) f.t -= dt; flashes = flashes.filter(f => f.t > 0);
      for (const q of pops) q.t -= dt; pops = pops.filter(q => q.t > 0);
      for (const q of parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 30 * dt; } parts = parts.filter(q => q.t > 0);
      for (const f of flashB) f.t -= dt; flashB = flashB.filter(f => f.t > 0);
      for (const P of V.panels) drawPanel(g, P);
      drawBtns(g);
      if (st.ph === 'ready') {
        const n = Math.ceil(st.t - .2);
        D.text(g, n > 0 ? String(n) : '开始', V.w / 2, V.h * .42, {size: Math.min(V.w, V.h) * .16, color: '#fff3d6', font: 'deco', weight: 400, stroke: 'rgba(60,20,5,.75)', strokeW: 6});
      }
      if (!V.touch && st.ph !== 'over' && V.panels[0].kind === 'full') {
        const P = V.panels[0], y = P.y + 22.4 * P.cs;
        if (y < V.h - 8) D.text(g, nLoc() >= 2 ? '左：A D 移动 · S 软降 · W/Q 旋转 · E 硬降 · R 暂存　　右：← → · ↓ · ↑/, 旋转 · . 硬降 · / 暂存' : '← → 移动 · ↓ 软降 · ↑ / Z 旋转 · 空格 硬降 · C 暂存',
          V.w / 2, Math.min(V.h - 10, y), {size: 12, color: 'rgba(243,226,192,.55)'});
      }
      if (koT > 0) { koT = Math.max(0, koT - dt); g.fillStyle = `rgba(255,230,160,${koT * .25})`; g.fillRect(0, 0, V.w, V.h); }
    }
    info(); status();
    return {
      st,
      input(seat, slot, nLocal) {
        const c = cnt[slot], th = tHeld[slot];
        let l, r, d;
        if (nLocal >= 2) { const k = slot === 0 ? ['KeyA', 'KeyD', 'KeyS'] : ['ArrowLeft', 'ArrowRight', 'ArrowDown']; l = kh(k[0]); r = kh(k[1]); d = kh(k[2]); }
        else { l = kh('ArrowLeft', 'KeyA'); r = kh('ArrowRight', 'KeyD'); d = kh('ArrowDown', 'KeyS'); }
        return {l: l || th.l.size ? 1 : 0, r: r || th.r.size ? 1 : 0, d: d || th.d.size ? 1 : 0, lc: c.lc, rc: c.rc, cw: c.cw, ccw: c.ccw, hd: c.hd, ho: c.ho};
      },
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        if (st.ph === 'ready') { st.t -= dt; if (st.t <= 0) { st.ph = 'play'; ctx.sfx('start'); for (let i = 0; i < 2; i++) { const I = inputs[i] || {}; for (const k in lastIn[i]) lastIn[i][k] = I[k] | 0; } } }
        else {
          st.time += dt; st.lvl = Math.min(15, 1 + Math.floor(st.time / (BX.test ? 3 : 30)));
          const order = Math.random() < .5 ? [0, 1] : [1, 0];
          for (const i of order) { if (st.over) break; stepPlayer(i, inputs[i] || {}, dt); }
          // 压力阶段: after PRESS seconds both wells get one garbage line every PRESSI seconds (same hole for both)
          if (!st.over && st.time >= PRESS) {
            st.pr = (st.pr || 0) + dt;
            if (st.pr >= PRESSI) { st.pr -= PRESSI; const h = Math.floor(Math.random() * BW); for (const p of st.p) p.pend.push({n: 1, h}); fx('press', -1); }
          }
        }
        playEv(); info(); status();
      },
      snapshot() {
        return {p: st.p.map(p => [p.b.join(''), p.t, p.r, p.x, p.y, p.hold, p.hu ? 1 : 0, p.nx.join(''), p.pend.reduce((s, q) => s + q.n, 0), p.lines, p.sent, p.alive ? 1 : 0, +p.lk.toFixed(2)]),
          ph: st.ph, t: +st.t.toFixed(2), lv: st.lvl, ev: st.ev, o: st.over, w: st.winner};
      },
      restore(d) {
        d.p.forEach((a, i) => { const p = st.p[i]; p.b = [...a[0]].map(Number); p.t = a[1]; p.r = a[2]; p.x = a[3]; p.y = a[4]; p.hold = a[5]; p.hu = !!a[6]; p.nx = [...a[7]].map(Number); p.pendN = a[8]; p.lines = a[9]; p.sent = a[10]; p.alive = !!a[11]; p.lk = a[12]; });
        st.ph = d.ph; st.t = d.t; st.lvl = d.lv; st.ev = d.ev; st.over = d.o; st.winner = d.w;
        playEv(); info(); status();
      },
      key,
      resize() { V = null; },
      draw,
    };
  },
});
