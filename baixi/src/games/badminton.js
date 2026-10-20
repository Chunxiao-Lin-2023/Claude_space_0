/* 羽毛球 — side-view realtime badminton */
const D = BX.draw, C = BX.C, K = BX.data.spk;
const CW = 13.4, NETH = 1.55, G = 9.8;                 // court length (m), net height
const PH = 1.75, REACH = 1.05, SPD = 5.6, JV = 4.6;      // player height, racket reach, run speed, jump velocity
const DRAG = .22;                                        // shuttle quadratic drag coefficient (per m)

BX.register({
  id: 'badminton', title: '羽毛球', cat: 'sports', order: 2, sub: '扣杀吊球，网前斗智',
  desc: '侧视角羽毛球对战：跑位、起跳、挥拍，根据击球时机与位置打出高远球、吊球或跳杀。每球得分制，先到 11 分（可选 21 分）且领先 2 分获胜。',
  kind: 'realtime', seats: 2, noFirst: true, seatColors: ['#c23a2b', '#2f5d8a'],
  options: [{key: 'to', label: '局分', choices: [[11, '11 分'], [21, '21 分']], def: 11}],
  rules: `<p>每球得分制：每个回合胜者得 1 分并获得发球权。先到 <b>11 分</b>（或 21 分）且领先对手 <b>2 分</b>获胜；打到 <b>14:14</b>（21 分制为 29:29）后先得下一分者胜（封顶 15 / 30 分）。</p>
<p>球落在对方场内、对方击球出界、球未过网或碰网落在本方，即为本方/对方得分。发球：发球方在本方场地后场低手发球，按挥拍键发出。</p>
<p><b>击球</b>（在球拍够得到时按挥拍键）：</p>
<ul><li>在空中且球高于头顶：<b>跳杀</b>，又快又狠；</li>
<li>在地面且球在头顶：<b>高远球</b>，打到对方底线；按住「前」方向则打<b>吊球</b>，轻轻落在网前；</li>
<li>球低于肩部：<b>挑球</b>（网前挑高）或<b>搓球</b>（按住前方向）。</li></ul>
<p>击球时机越准（球正好在拍面中心），球速越快、越精准。</p>
<p>键盘：单人用 ←→ 移动、↑ 跳、空格挥拍（也可 A/D/W/J）。同屏两人：左方 A/D 移动、W 跳、F 挥拍；右方 ←→ 移动、↑ 跳、回车（或 L）挥拍。触屏：每人自己那半边屏幕下方有 ◀ ▶ 跳 挥 四个按钮。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f3e2c0'); gr.addColorStop(1, '#e0c890'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3f8f5b'; g.fillRect(0, h * .78, w, h * .22); g.fillStyle = '#fff'; g.fillRect(0, h * .78, w, 2);
    g.fillStyle = '#5e3a1a'; g.fillRect(w / 2 - 2, h * .45, 4, h * .33); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(w / 2 - 1, h * .45, 2, h * .22);
    g.strokeStyle = 'rgba(40,20,8,.4)'; for (let y = h * .47; y < h * .67; y += 4) { g.beginPath(); g.moveTo(w / 2 - 3, y); g.lineTo(w / 2 + 3, y); g.stroke(); }
    g.fillStyle = '#c23a2b'; g.fillRect(w / 2 - 4, h * .44, 8, 3);
    drawPlayer(g, w * .25, h * .78, h * .42, '#c23a2b', {jump: .2, swing: .8, face: 1});
    drawPlayer(g, w * .78, h * .78, h * .42, '#2f5d8a', {swing: 0, face: -1});
    drawShuttle(g, w * .55, h * .25, h * .08, -.6);
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.setLineDash([3, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(w * .35, h * .3); g.lineTo(w * .53, h * .26); g.stroke(); g.setLineDash([]);
  },
  create(ctx) {
    const TO = BX.test ? 3 : (ctx.opts.to || 11), CAP = TO === 21 ? 30 : TO === 11 ? 15 : TO + 2;
    const mkP = side => ({x: side ? CW * .75 : CW * .25, y: 0, vx: 0, vy: 0, sw: 0, cd: 0, f: side ? -1 : 1, hitT: 0});
    const st = {p: [mkP(0), mkP(1)], b: {x: 0, y: 0, vx: 0, vy: 0, a: 0}, s: [0, 0], srv: ctx.rng() < .5 ? 0 : 1, ph: 'serve', t: 1.2, last: -1, ev: [], evId: 0, over: false, rally: 0, why: ''};
    const cv = ctx.canvas(), fx = K.fx(), pads = K.pads(ctx, cv);
    const evSeen = {v: -1}, trail = [];
    let time = 0;
    const swq = [K.tq(), K.tq()], seen = {};
    function resetServe() {
      const s = st.srv; st.p[0] = mkP(0); st.p[1] = mkP(1);
      st.p[s].x = s ? CW - 2.2 : 2.2;
      st.b = {x: st.p[s].x + (s ? -.45 : .45), y: 1.0, vx: 0, vy: 0, a: 0};
      st.ph = 'serve'; st.t = BX.test ? .3 : 1.0; st.last = -1; st.rally = 0;
    }
    resetServe();
    /* ---------- input ---------- */
    const nLoc = () => ctx.mySeats.length;
    function keyState(slot, n) {
      const k = ctx.keys;
      const L = n === 1 ? ['ArrowLeft', 'KeyA'] : slot === 0 ? ['KeyA'] : ['ArrowLeft'];
      const R = n === 1 ? ['ArrowRight', 'KeyD'] : slot === 0 ? ['KeyD'] : ['ArrowRight'];
      const U = n === 1 ? ['ArrowUp', 'KeyW', 'KeyK'] : slot === 0 ? ['KeyW'] : ['ArrowUp'];
      return {l: K.keyAny(ctx, L), r: K.keyAny(ctx, R), j: K.keyAny(ctx, U)};
    }
    ctx.on(window, 'keydown', e => {
      if (e.repeat) return; const ms = ctx.mySeats; if (!ms.length) return;
      const n = ms.length;
      if (n === 1 && ['Space', 'KeyJ', 'KeyF', 'Enter', 'KeyL'].includes(e.code)) swq[ms[0]].push(1);
      else if (n === 2) { if (['KeyF', 'Space', 'KeyG'].includes(e.code)) swq[ms[0]].push(1); if (['Enter', 'KeyL', 'NumpadEnter', 'Numpad0'].includes(e.code)) swq[ms[1]].push(1); }
    });
    const screenDir = seat => view().flip ? -1 : 1;
    function input(seat, slot, n) {
      const ks = keyState(slot, n), dir = screenDir(seat);
      let l = ks.l || pads.held('l', seat), r = ks.r || pads.held('r', seat), j = ks.j || pads.held('j', seat);
      if (pads.pressed({k: 'w', seat}) && !lastSw[seat]) swq[seat].push(1);
      lastSw[seat] = pads.held('w', seat);
      let mx = (r ? 1 : 0) - (l ? 1 : 0);
      if (n === 2) mx = (r ? 1 : 0) - (l ? 1 : 0); else mx *= dir;
      return {mx, j: j ? 1 : 0, q: swq[seat].list()};
    }
    const lastSw = [false, false];
    /* ---------- physics ---------- */
    function fxEv(k, ...a) { K.ev(st, k, ...a); }
    function stepPlayer(i, inp, dt) {
      const p = st.p[i], lo = i ? CW / 2 + .35 : .3, hi = i ? CW - .3 : CW / 2 - .35;
      const ground = p.y <= 0.001;
      const mx = BX.clamp(+inp.mx || 0, -1, 1);
      const tv = mx * SPD;
      p.vx += (tv - p.vx) * Math.min(1, dt * (ground ? 14 : 4));
      if (inp.j && ground && p.cd >= 0) { p.vy = JV; fxEv('jump', i); }
      p.vy -= G * 1.35 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < 0) { if (p.vy < -2) fxEv('land', i); p.y = 0; p.vy = 0; }
      p.x = BX.clamp(p.x, lo, hi);
      p.sw = Math.max(0, p.sw - dt); p.hitT = Math.max(0, p.hitT - dt);
      if (mx) p.f = i ? -1 : 1;
    }
    function trySwing(i) {
      const p = st.p[i]; if (p.sw > .12) return;
      p.sw = .3; fxEv('swing', i);
      if (st.ph === 'serve') { if (i === st.srv && st.t <= 0) serve(i); return; }
      if (st.ph !== 'play' || st.last === i && st.rally > 0 && false) return;
      const b = st.b, sx = i ? -1 : 1;
      const cx = p.x + sx * .25, cy = p.y + PH * .95;            // racket pivot (shoulder)
      const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
      if (d > REACH + .35 || (b.x - p.x) * sx < -.9) return;
      if (st.last === i) return;
      const qual = BX.clamp(1 - Math.abs(d - REACH * .7) / (REACH * .9), .25, 1);
      const air = p.y > .15, high = b.y > p.y + PH * .9;
      const inp = st._in[i] || {}, fwd = inp.ai ? !!inp.f : (+inp.mx || 0) * sx > 0;
      let kind, tx, ang = null, sp = null;
      const err = (Math.random() - .5) * (1 - qual) * 2.6;
      const nearNet = Math.abs(b.x - CW / 2) < 2.2;
      if (nearNet && b.y > NETH + .35 && !fwd && b.vy < 1) { kind = 'kill'; tx = CW / 2 + sx * (1.5 + Math.random() * 3) + err; sp = 17 + qual * 6; }
      else if (air && high && Math.abs(b.x - CW / 2) < 5.2) { kind = 'smash'; tx = CW / 2 + sx * (2.8 + Math.random() * 3) + err; sp = 22 + qual * 8; }
      else if (high) { if (fwd) { kind = 'drop'; tx = CW / 2 + sx * (.6 + Math.random() * 1.4) + err * .5; ang = .5; } else { kind = 'clear'; tx = CW / 2 + sx * (5.3 + Math.random() * 1.2) + err; ang = .95; } }
      else if (fwd) { kind = 'net'; tx = CW / 2 + sx * (.5 + Math.random() * 1.2) + err * .4; ang = 1.0; }
      else { kind = 'lift'; tx = CW / 2 + sx * (4.8 + Math.random() * 1.6) + err; ang = 1.08; }
      const [vx, vy] = aim(b.x, b.y, tx, sx, ang, sp);
      b.vx = vx; b.vy = vy; st.last = i; st.rally++; st.hitK = kind; p.hitT = .25;
      fxEv('hit', i, kind, Math.round(qual * 100));
    }
    function serve(i) {
      const b = st.b, sx = i ? -1 : 1, [vx, vy] = aim(b.x, b.y, CW / 2 + sx * (4.2 + Math.random() * 1.5), sx, .82, null);
      b.vx = vx; b.vy = vy; st.ph = 'play'; st.last = i; st.rally = 0; fxEv('hit', i, 'serve', 80);
    }
    function point(w, why) {
      st.s[w]++; st.srv = w; st.ph = 'point'; st.t = BX.test ? .5 : 1.6; st.why = why; fxEv('point', w, why);
      const [a, c] = st.s, done = (a >= TO || c >= TO) && Math.abs(a - c) >= 2 || a >= CAP || c >= CAP;
      if (done) { st.over = true; st.ph = 'over'; const win = a > c ? 0 : 1; fxEv('end', win); ctx.end({winner: win, text: a + ' : ' + c}); }
    }
    function simLand(x, y, vx, vy) {
      const dt = 1 / 60; let netY = null;
      for (let i = 0; i < 400; i++) { const sp = Math.hypot(vx, vy); vx -= DRAG * sp * vx * dt; vy -= (G + DRAG * sp * vy) * dt; const px = x; x += vx * dt; y += vy * dt; if ((px - CW / 2) * (x - CW / 2) <= 0 && netY == null) netY = y; if (y <= 0) break; }
      return {x, netY};
    }
    /* find launch velocity reaching target tx: fixed angle → bisect speed; fixed speed (smash) → bisect angle */
    function aim(x, y, tx, sx, ang, sp) {
      const dist = t => (t.x - x) * sx, want = (tx - x) * sx;
      let lo, hi, best;
      if (sp == null) { lo = 2; hi = 45; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2, r = simLand(x, y, Math.cos(ang) * m * sx, Math.sin(ang) * m); if (dist(r) < want) lo = m; else hi = m; } best = [Math.cos(ang) * hi * sx, Math.sin(ang) * hi]; }
      else {
        lo = -1.3; hi = .7; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2, r = simLand(x, y, Math.cos(m) * sp * sx, Math.sin(m) * sp); if (dist(r) < want) lo = m; else hi = m; }
        let a = hi; const r = simLand(x, y, Math.cos(a) * sp * sx, Math.sin(a) * sp); if (r.netY != null && r.netY < NETH + .15) a += .08;
        best = [Math.cos(a) * sp * sx, Math.sin(a) * sp];
      }
      return best;
    }
    function stepShuttle(dt) {
      const b = st.b, sp = Math.hypot(b.vx, b.vy);
      const px = b.x, py = b.y;
      b.vx -= DRAG * sp * b.vx * dt; b.vy -= (G + DRAG * sp * b.vy) * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.a = Math.atan2(b.vy, b.vx);
      // net
      if ((px - CW / 2) * (b.x - CW / 2) <= 0 && b.y < NETH) {
        b.x = CW / 2 + (px < CW / 2 ? -.06 : .06); b.vx = -b.vx * .15; b.vy = Math.min(b.vy, 0) * .3; fxEv('net');
      }
      if (b.y <= 0) {
        b.y = 0; const x = b.x; fxEv('land', -1, Math.round(x * 10));
        const side = x < CW / 2 ? 0 : 1, out = x < 0 || x > CW;
        if (st.last < 0) { point(1 - side, ''); return; }
        if (out) point(1 - st.last, '出界');
        else if (side === st.last) point(1 - st.last, '未过网');
        else point(st.last, '落地得分');
      }
      if (b.x < -2.5 || b.x > CW + 2.5) point(1 - st.last, '出界');
    }
    /* ---------- AI ---------- */
    const aiS = [{}, {}];
    function predictLand(b, side) {
      // simulate the shuttle forward; return {x, t} where it crosses height h on the given side
      let x = b.x, y = b.y, vx = b.vx, vy = b.vy, t = 0; const dt = 1 / 60; const out = {x, t: 0, hx: null, ht: 0};
      for (let i = 0; i < 300; i++) {
        const sp = Math.hypot(vx, vy); vx -= DRAG * sp * vx * dt; vy -= (G + DRAG * sp * vy) * dt; x += vx * dt; y += vy * dt; t += dt;
        if (out.hx == null && vy < 0 && y < 2.6 && (side ? x > CW / 2 : x < CW / 2)) { out.hx = x; out.ht = t; out.hy = y; }
        if (y <= 0) break;
      }
      out.x = x; out.t = t; return out;
    }
    function aiInput(seat, level) {
      const A = aiS[seat], p = st.p[seat], b = st.b, sx = seat ? -1 : 1, home = seat ? CW * .72 : CW * .28;
      A.q = A.q || K.tq();
      let tx = home, j = 0, fwdWant = false;
      if (st.ph === 'serve') {
        if (st.srv === seat && st.t <= 0) { if (!A.st) A.st = performance.now() + (BX.test ? 50 : 400 + Math.random() * 600); if (performance.now() > A.st) { A.st = 0; A.q.push(1); } }
        tx = p.x;
      } else if (st.ph === 'play') {
        const coming = st.last !== seat;
        if (coming) {
          const pr = predictLand(b, seat);
          const err = [0, 1.1, .45, .12][level];
          if (A.rally !== st.rally) { A.rally = st.rally; A.err = (Math.random() - .5) * 2 * err; A.plan = Math.random(); const lk = st.hitK === 'smash' || st.hitK === 'kill'; A.whiff = Math.random() < [0, .16, .08, .03][level] + (lk ? [0, .3, .2, .12][level] : 0) + (BX.test ? .3 : 0); }
          const hx = pr.hx != null ? pr.hx : pr.x;
          tx = hx - sx * .55 + A.err;
          const cx = p.x + sx * .25, cy = p.y + PH * .95, d = Math.hypot(b.x - cx, b.y - cy);
          const highBall = b.y > PH + .5 && b.vy < 0;
          if (level >= 2 && highBall && Math.abs(b.x - p.x) < 1.3 && b.y < PH + 2.3 && b.y > PH + .7 && A.plan < [0, 0, .45, .7][level] && Math.abs(CW / 2 - p.x) < 4.5) j = 1;
          if (!A.whiff && d < REACH * (level === 3 ? .85 : .95) && (b.x - p.x) * sx > -.6) {
            fwdWant = level >= 2 && A.plan > .72 && Math.abs(CW / 2 - p.x) > 2.4;
            A.q.push(1);
          }
        } else tx = home + (b.x - CW / 2) * .1;
      }
      const dx = tx - p.x, dz = [0, .25, .12, .06][level];
      let mx = Math.abs(dx) < dz ? 0 : Math.sign(dx);
      if (fwdWant && Math.abs(dx) < .4) mx = sx;
      if (level === 1 && Math.random() < .3) fwdWant = Math.random() < .5;
      if (level === 1 && Math.random() < .1) mx = 0;
      return {mx, j, f: fwdWant ? 1 : 0, q: A.q.list(), ai: 1};
    }
    /* ---------- view ---------- */
    const viewSeat = () => ctx.mySeats.length === 1 ? ctx.mySeats[0] : 0;
    function view() {
      const W = cv.w, H = cv.h, port = H > W * 1.1;
      const two = nLoc() === 2 && W < 560;
      const ctrlH = touchUI() ? (two ? Math.min(H * .26, 190) : port ? Math.min(H * .2, 150) : Math.min(H * .26, 110)) : 0;
      const top = 44, avail = H - ctrlH - top;
      const lw = CW + 1.6, lh = port ? 6.5 : 6.2;
      const sx = Math.min(W / lw, avail / lh), s = port ? Math.min(avail / lh, sx * 2.6) : sx;
      const gx = (W - CW * sx) / 2, gy = top + avail - Math.max(14, avail * .06);
      return {W, H, port, s, sx, gx, gy, ctrlH, flip: viewSeat() === 1 && nLoc() === 1};
    }
    const touchUI = () => BX.TOUCH.matches || pads.touched;
    const X = (v, x) => v.flip ? v.gx + (CW - x) * v.sx : v.gx + x * v.sx;
    const Y = (v, y) => v.gy - y * v.s;
    function ctrlBtns(v) {
      if (!touchUI()) return [];
      const out = [], H = v.H, W = v.W, h = v.ctrlH, y0 = H - h;
      const two = nLoc() === 2 && W < 560;
      const groups = nLoc() === 2 ? (two ? [[0, 0, W, y0 + h / 2, h / 2], [1, 0, W, y0, h / 2]] : [[0, 0, W / 2], [1, W / 2, W / 2]]) : [[viewSeat(), 0, W]];
      for (const [seat, gx, gw, ry, rh] of groups) {
        const pad = 8, hh = rh || h, yy = ry != null ? ry : y0, bh = Math.min(hh - pad * 2, 84), by = yy + (hh - bh) / 2;
        const bw = Math.min((gw - pad * 5) / 4, 110);
        const mirror = nLoc() === 2 && seat === 1 && !two;
        const ks = ['l', 'r', 'j', 'w'];
        const xs = mirror ? [gx + pad, gx + pad * 2 + bw, gx + gw - pad * 2 - bw * 2, gx + gw - pad - bw] : [gx + pad, gx + pad * 2 + bw, gx + gw - pad * 2 - bw * 2, gx + gw - pad - bw];
        // movement on outer side, actions on inner side for right player
        const order = mirror ? ['j', 'w', 'l', 'r'] : ks;
        order.forEach((k, i) => out.push({k, seat, x: xs[i], y: by, w: bw, h: bh}));
      }
      return out;
    }
    /* ---------- events ---------- */
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const v = view(), k = e[0];
        if (k === 'hit') {
          const kd = e[3]; const hard = kd === 'smash' || kd === 'kill'; ctx.sfx(hard ? 'crash' : 'swish'); ctx.sfx(hard ? 'hit' : 'pop');
          const bx = X(v, st.b.x), by = Y(v, st.b.y);
          fx.burst(bx, by, {n: kd === 'smash' ? 22 : 8, color: kd === 'smash' ? ['#fff', '#ffd76a', '#ff8a5a'] : ['#fff', '#ffe8b0'], sp: kd === 'smash' ? 300 : 140, size: 3});
          if (hard) { fx.shake(7); fx.text(bx, by - 30, kd === 'kill' ? '扑！' : '杀！', {size: 34, color: '#ff8a5a', life: .8}); }
          if (kd === 'drop' || kd === 'net') fx.text(bx, by - 26, kd === 'drop' ? '吊' : '搓', {size: 22, color: '#bfe8ff', life: .6});
        } else if (k === 'net') ctx.sfx('bounce');
        else if (k === 'land') { ctx.sfx('move'); fx.burst(X(v, e[3] / 10), Y(v, 0), {n: 10, color: ['#fff', '#d9e8c0'], sp: 120, up: 60, size: 3}); }
        else if (k === 'jump') ctx.sfx('whoosh');
        else if (k === 'point') { ctx.sfx('score'); fx.flash(.6); fx.text(v.W / 2, v.gy - 4.6 * v.s, ctx.name(e[2]) + ' 得分', {size: Math.min(34, v.W * .06), color: '#ffe08a', life: 1.4, vy: -10}); }
        else if (k === 'end') ctx.sfx('bell');
      });
    }
    function info() {
      ctx.info(0, st.s[0]); ctx.info(1, st.s[1]);
      ctx.status(st.over ? '比赛结束' : st.ph === 'serve' ? ctx.name(st.srv) + ' 发球' + (ctx.isLocal(st.srv) && nLoc() === 1 ? '（按挥拍发球）' : '') : st.ph === 'point' ? st.why : '先到 ' + TO + ' 分 · 领先 2 分');
    }
    const inst = {
      st,
      input,
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        st._in = inputs;
        for (let i = 0; i < 2; i++) {
          const inp = inputs[i] || {};
          // remote / guest views send mx in screen terms when flipped; normalise: for seat 1 single view (flipped) screen-right = table-left
          stepPlayer(i, inp, dt);
          K.take(inp.q, seen, i, () => trySwing(i));
        }
        if (st.ph === 'serve') { st.t -= dt; const s = st.srv, p = st.p[s]; st.b.x = p.x + (s ? -.45 : .45); st.b.y = p.y + 1.0; }
        else if (st.ph === 'play') stepShuttle(dt);
        else if (st.ph === 'point') { st.t -= dt; if (st.t <= 0) resetServe(); }
        delete st._in;
        playEv(); info();
      },
      snapshot() {
        const r = v => Math.round(v * 100) / 100;
        return {p: st.p.map(p => [r(p.x), r(p.y), r(p.vx), r(p.vy), r(p.sw), p.f, r(p.hitT)]), b: [r(st.b.x), r(st.b.y), r(st.b.vx), r(st.b.vy)], s: st.s, srv: st.srv, ph: st.ph, t: r(st.t), last: st.last, ev: st.ev, over: st.over, why: st.why, rally: st.rally};
      },
      restore(d) {
        d.p.forEach((a, i) => Object.assign(st.p[i], {x: a[0], y: a[1], vx: a[2], vy: a[3], sw: a[4], f: a[5], hitT: a[6]}));
        Object.assign(st.b, {x: d.b[0], y: d.b[1], vx: d.b[2], vy: d.b[3], a: Math.atan2(d.b[3], d.b[2])});
        Object.assign(st, {s: d.s, srv: d.srv, ph: d.ph, t: d.t, last: d.last, ev: d.ev, over: d.over, why: d.why, rally: d.rally});
        playEv(); info();
      },
      draw(dt) {
        time += dt; fx.update(dt);
        if (!ctx.isHost && st.ph === 'play') { const b = st.b; b.x += b.vx * dt * .5; b.y = Math.max(0, b.y + b.vy * dt * .5); }
        const g = cv.g, v = view(); cv.clear('#2a190d');
        const [ox, oy] = fx.offset(); g.save(); g.translate(ox, oy);
        drawHall(g, v);
        // shuttle trail
        if (st.ph === 'play') { trail.push([st.b.x, st.b.y]); if (trail.length > 10) trail.shift(); } else trail.length = 0;
        for (let i = 1; i < trail.length; i++) { g.strokeStyle = `rgba(255,255,255,${i / trail.length * .45})`; g.lineWidth = i / trail.length * 4; g.beginPath(); g.moveTo(X(v, trail[i - 1][0]), Y(v, trail[i - 1][1])); g.lineTo(X(v, trail[i][0]), Y(v, trail[i][1])); g.stroke(); }
        // shadow of shuttle
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(X(v, st.b.x), Y(v, 0) + 2, 6 * (1 - Math.min(.7, st.b.y / 8)), 2, 0, 0, Math.PI * 2); g.fill();
        st.p.forEach((p, i) => {
          const face = (i ? -1 : 1) * (v.flip ? -1 : 1);
          const swing = p.sw > 0 ? 1 - p.sw / .3 : -1;
          drawPlayer(g, X(v, p.x), Y(v, p.y), PH * v.s, ctx.color(i), {face, swing, jump: p.y > .05 ? 1 : 0, run: Math.abs(p.vx) > .5 ? time * 14 : 0, high: st.b.y > p.y + PH * .9});
        });
        const ba = v.flip ? Math.PI - st.b.a : st.b.a;
        drawShuttle(g, X(v, st.b.x), Y(v, st.b.y), Math.max(7, .16 * v.s), st.ph === 'play' ? ba : -Math.PI / 2);
        g.restore();
        drawHUD(g, v);
        fx.draw(g);
        drawCtrl(g, v);
        fx.drawFlash(g, v.W, v.H);
      },
    };
    function drawHall(g, v) {
      const W = v.W, gy = v.gy;
      K.hall(g, 0, 0, W, gy - 4.3 * v.s, {});
      const wg = g.createLinearGradient(0, gy - 4.3 * v.s, 0, gy); wg.addColorStop(0, '#e9d8b0'); wg.addColorStop(1, '#d6be8a'); g.fillStyle = wg; g.fillRect(0, gy - 4.3 * v.s, W, 4.3 * v.s);
      // banner scroll
      const bw = Math.min(W * .4, 280), bx = W / 2 - bw / 2, by = gy - 4.3 * v.s + 6;
      g.fillStyle = '#b23a2b'; D.rr(g, bx, by, bw, 26, 4); g.fill(); D.text(g, '以 球 会 友', W / 2, by + 13, {size: 15, color: '#fbe9d0', font: 'deco', weight: 400});
      // floor
      const fg = g.createLinearGradient(0, gy, 0, v.H); fg.addColorStop(0, '#3f8f5b'); fg.addColorStop(1, '#2f6f45'); g.fillStyle = fg; g.fillRect(0, gy, W, v.H - gy);
      // court line in perspective strip
      g.fillStyle = '#4fa06a'; g.beginPath(); g.moveTo(X(v, 0) - 10, gy); g.lineTo(X(v, CW) + 10, gy); g.lineTo(X(v, CW) + 30, gy + 14); g.lineTo(X(v, 0) - 30, gy + 14); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(X(v, 0), gy); g.lineTo(X(v, CW), gy); g.stroke();
      for (const x of [0, CW, CW / 2 - 1.98, CW / 2 + 1.98]) { g.beginPath(); g.moveTo(X(v, x), gy - 2); g.lineTo(X(v, x), gy + 12); g.stroke(); }
      // net
      const nx = X(v, CW / 2), ny = Y(v, NETH), nw = Math.max(5, v.sx * .22), nb = Y(v, .78);
      g.fillStyle = '#5e3a1a'; g.fillRect(nx - 2.5, ny - 4, 5, gy - ny + 4);
      g.fillStyle = 'rgba(30,20,10,.35)'; g.fillRect(nx - nw, ny, nw * 2, nb - ny);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
      for (let y = ny + 4; y < nb; y += 5) { g.beginPath(); g.moveTo(nx - nw, y); g.lineTo(nx + nw, y); g.stroke(); }
      for (let x = -nw; x <= nw; x += 4) { g.beginPath(); g.moveTo(nx + x, ny); g.lineTo(nx + x, nb); g.stroke(); }
      g.fillStyle = '#fff'; g.fillRect(nx - nw, ny - 1, nw * 2, 4); g.fillStyle = '#c23a2b'; D.circle(g, nx, ny - 6, 4); g.fill();
    }
    function drawHUD(g, v) {
      const W = v.W, y = 22;
      D.wood(g, W / 2 - 110, 2, 220, 38, {base: '#5a3418', dark: '#2a160a', r: 10, seed: 8});
      const L = v.flip ? 1 : 0, R = 1 - L;
      D.text(g, String(st.s[L]), W / 2 - 34, y, {size: 26, color: ctx.color(L) === '#c23a2b' ? '#ff9a8a' : '#a8c8ff', font: 'deco', weight: 400});
      D.text(g, ':', W / 2, y, {size: 22, color: '#e6c57d'});
      D.text(g, String(st.s[R]), W / 2 + 34, y, {size: 26, color: ctx.color(R) === '#c23a2b' ? '#ff9a8a' : '#a8c8ff', font: 'deco', weight: 400});
      for (const [s, x] of [[L, W / 2 - 80], [R, W / 2 + 80]]) { g.fillStyle = ctx.color(s); D.circle(g, x, y, 7); g.fill(); if (st.srv === s && !st.over) { g.strokeStyle = '#ffe08a'; g.lineWidth = 2.5; D.circle(g, x, y, 10); g.stroke(); } }
      if (st.ph === 'serve' && !st.over) { const loc = ctx.isLocal(st.srv); D.text(g, loc ? (touchUI() ? '点「挥」发球' : '按挥拍键发球') : ctx.name(st.srv) + ' 发球', W / 2, v.gy - 3.6 * v.s, {size: Math.min(22, W * .05), color: '#fff6dc', font: 'deco', weight: 400, stroke: 'rgba(60,25,5,.8)'}); }
      const tp = (st.s[0] >= TO - 1 || st.s[1] >= TO - 1) && !st.over && Math.abs(st.s[0] - st.s[1]) >= 1 ? '局点' : '';
      if (tp) D.text(g, tp, W / 2, 50, {size: 13, color: '#ff9a5a', weight: 800});
    }
    function drawCtrl(g, v) {
      const bs = ctrlBtns(v); if (!bs.length) return;
      g.fillStyle = 'rgba(30,16,6,.55)'; g.fillRect(0, v.H - v.ctrlH, v.W, v.ctrlH);
      if (nLoc() === 2) { g.fillStyle = '#e6c57d'; if (v.W < 560) g.fillRect(0, v.H - v.ctrlH / 2 - 1, v.W, 2); else g.fillRect(v.W / 2 - 1, v.H - v.ctrlH, 2, v.ctrlH); }
      const lab = {l: '◀', r: '▶', j: '跳', w: '挥'}, col = {l: '#c8a052', r: '#c8a052', j: '#3f7f6b', w: '#c23a2b'};
      for (const b of bs) {
        let L = lab[b.k];
        if (v.flip && nLoc() === 1) L = lab[b.k];
        K.btn(g, b, L, {color: col[b.k], fg: '#fff6e0', pressed: pads.held(b.k, b.seat), size: Math.min(b.h * .42, 28), font: b.k === 'j' || b.k === 'w' ? 'deco' : undefined});
        if (nLoc() === 2) { g.fillStyle = ctx.color(b.seat); g.fillRect(b.x + 6, b.y + b.h - 10, 10, 3); }
      }
    }
    // collect buttons every frame so pads.held() hit-tests the current layout
    const _draw = inst.draw;
    inst.draw = dt => { pads.begin(); for (const b of ctrlBtns(view())) pads.add(b); _draw(dt); };
    info();
    return inst;
  },
});

function drawShuttle(g, x, y, s, ang) {
  g.save(); g.translate(x, y); g.rotate(ang + Math.PI);
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.moveTo(s * .2, -s * .22); g.lineTo(s * 1.5, -s * .6); g.lineTo(s * 1.6, s * .6); g.lineTo(s * .2, s * .22); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,100,80,.6)'; g.lineWidth = 1; for (const f of [-.35, 0, .35]) { g.beginPath(); g.moveTo(s * .3, 0); g.lineTo(s * 1.55, f * s * 1.4); g.stroke(); }
  g.fillStyle = '#c23a2b'; g.fillRect(s * .45, -s * .3, s * .12, s * .6);
  g.fillStyle = '#f3e2c0'; D.circle(g, 0, 0, s * .32); g.fill(); g.strokeStyle = '#a8723d'; g.stroke();
  g.restore();
}
/* side-view player: x,y = feet; s = height in px; o.face ±1; swing 0..1 (−1 none) */
function drawPlayer(g, x, y, s, col, o = {}) {
  const f = o.face || 1, sw = o.swing != null ? o.swing : -1;
  g.save(); g.translate(x, y);
  if (!o.jump) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, s * .22, s * .05, 0, 0, Math.PI * 2); g.fill(); }
  const sq = o.jump ? 1.05 : 1; g.scale(f / Math.sqrt(sq), sq);
  const run = o.run ? Math.sin(o.run) : 0;
  g.lineCap = 'round';
  // legs
  g.strokeStyle = '#f0c89a'; g.lineWidth = s * .07;
  const l1 = o.jump ? .35 : run * .35, l2 = o.jump ? -.15 : -run * .35;
  g.beginPath(); g.moveTo(0, -s * .45); g.lineTo(Math.sin(l1) * s * .42, -s * .45 + Math.cos(l1) * s * .43); g.moveTo(0, -s * .45); g.lineTo(Math.sin(l2) * s * .42, -s * .45 + Math.cos(l2) * s * .43); g.stroke();
  g.fillStyle = '#fffaf0'; for (const l of [l1, l2]) { g.beginPath(); g.ellipse(Math.sin(l) * s * .42 + s * .04, -s * .02 + (Math.cos(l) - 1) * s * .43, s * .07, s * .035, 0, 0, Math.PI * 2); g.fill(); }
  // shorts + shirt
  g.fillStyle = '#2b2118'; D.rr(g, -s * .1, -s * .52, s * .2, s * .14, s * .03); g.fill();
  const gr = g.createLinearGradient(-s * .12, 0, s * .12, 0); gr.addColorStop(0, D.shade(col, 15)); gr.addColorStop(1, D.shade(col, -20));
  g.fillStyle = gr; D.rr(g, -s * .12, -s * .82, s * .24, s * .34, s * .07); g.fill();
  g.fillStyle = '#e6c57d'; g.fillRect(-s * .12, -s * .66, s * .24, s * .03);
  // head
  g.fillStyle = '#f0c89a'; D.circle(g, s * .02, -s * .91, s * .09); g.fill();
  g.fillStyle = '#2b2118'; g.beginPath(); g.arc(s * .0, -s * .93, s * .095, Math.PI * .9, Math.PI * 2.05); g.fill();
  g.fillStyle = '#c23a2b'; g.fillRect(-s * .09, -s * .96, s * .18, s * .025);
  g.fillStyle = '#1b1510'; D.circle(g, s * .07, -s * .91, s * .015); g.fill();
  // racket arm
  let ang;
  if (sw >= 0) ang = o.high ? BX.lerp(-2.6, .6, BX.ease.out(sw)) : BX.lerp(1.9, -.7, BX.ease.out(sw));
  else ang = o.high ? -2.2 : -1.0;
  const sx = s * .02, sy = -s * .78, al = s * .3;
  const hx = sx + Math.cos(ang) * al, hy = sy + Math.sin(ang) * al;
  g.strokeStyle = '#f0c89a'; g.lineWidth = s * .06; g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
  g.strokeStyle = '#5e3a1a'; g.lineWidth = s * .025; const rx = hx + Math.cos(ang) * s * .22, ry = hy + Math.sin(ang) * s * .22; g.beginPath(); g.moveTo(hx, hy); g.lineTo(rx, ry); g.stroke();
  g.save(); g.translate(rx + Math.cos(ang) * s * .1, ry + Math.sin(ang) * s * .1); g.rotate(ang);
  g.strokeStyle = '#c8a052'; g.lineWidth = s * .022; g.beginPath(); g.ellipse(0, 0, s * .12, s * .085, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * .04, -s * .07); g.lineTo(i * s * .04, s * .07); g.stroke(); g.beginPath(); g.moveTo(-s * .1, i * s * .03); g.lineTo(s * .1, i * s * .03); g.stroke(); }
  g.restore();
  if (sw >= 0 && sw < .6) { g.strokeStyle = `rgba(255,255,255,${.5 * (1 - sw / .6)})`; g.lineWidth = s * .05; g.beginPath(); g.arc(sx, sy, al + s * .3, ang - .9 * (o.high ? -1 : 1), ang, o.high); g.stroke(); }
  // off arm
  g.strokeStyle = D.shade('#f0c89a', -10); g.lineWidth = s * .055; g.beginPath(); g.moveTo(-s * .02, -s * .76); g.lineTo(-s * .2, -s * (o.high ? .95 : .6)); g.stroke();
  g.restore();
}
