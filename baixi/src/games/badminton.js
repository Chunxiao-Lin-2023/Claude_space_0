/* 羽毛球 — side-view realtime badminton */
const D = BX.draw, C = BX.C, K = BX.data.spk;
const CW = 13.4, NETH = 1.55, G = 9.8;                 // court length (m), net height
const PH = 1.75, REACH = 1.05, SPD = 5.6, JV = 4.6;      // player height, racket reach, run speed, jump velocity
const DRAG = .22;                                        // shuttle quadratic drag coefficient (per m)

BX.register({
  id: 'badminton', title: '羽毛球', cat: 'sports', order: 2, sub: '扣杀吊球，网前斗智',
  desc: '侧视角羽毛球对战：跑位、起跳、挥拍，根据击球时机与位置打出高远球、吊球或跳杀。每球得分制，先到 11 分（可选 21 分）且领先 2 分获胜。',
  kind: 'realtime', seats: 2, noFirst: true, seatColors: ['#c23a2b', '#2f5d8a'], hint: false,
  options: [{key: 'to', label: '局分', choices: [[11, '11 分'], [21, '21 分']], def: 11}, {key: 'assist', label: '跑位辅助', choices: [[1, '开'], [0, '关']], def: 1}],
  howto: ['<b>点「挥」或直接点球场</b>击球；在球场上<b>向上划</b> = 重扣（球在头顶时自动起跳跳杀），<b>向下划</b> = 吊球/搓网前。',
    '「吊」键打轻球；◀ ▶（竖屏为 ▲ ▼）跑位，「跳」起跳。挥拍可以稍微提前按，球一进拍面就自动击出。',
    '开着「跑位辅助」时，你不按方向键会自动跑向落点；地上的圆圈是来球的预计落点。',
    '键盘：←→ 移动、↑ 跳、空格 挥拍、↓ 吊球；同屏左方 A/D/W/F/S，右方 ←→↑/回车/↓。'],
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
    /* swing queue items: [type, id] — 1 auto, 2 hard (clear/smash), 3 soft (drop/net), 4 jump + hard */
    ctx.on(window, 'keydown', e => {
      if (e.repeat) return; const ms = ctx.mySeats; if (!ms.length) return;
      const n = ms.length;
      if (n === 1 && ['Space', 'KeyJ', 'KeyF', 'Enter', 'KeyL'].includes(e.code)) swq[ms[0]].push(1);
      else if (n === 1 && ['ArrowDown', 'KeyS'].includes(e.code)) swq[ms[0]].push(3);
      else if (n === 2) {
        if (['KeyF', 'Space', 'KeyG'].includes(e.code)) swq[ms[0]].push(1); if (e.code === 'KeyS') swq[ms[0]].push(3);
        if (['Enter', 'KeyL', 'NumpadEnter', 'Numpad0'].includes(e.code)) swq[ms[1]].push(1); if (e.code === 'ArrowDown') swq[ms[1]].push(3);
      }
    });
    const screenDir = seat => { const v = view(); return v.vert ? (seat ? -1 : 1) : v.flip ? -1 : 1; };
    const lastSw = [false, false], lastDr = [false, false];
    function input(seat, slot, n) {
      const ks = keyState(slot, n), dir = screenDir(seat);
      let l = ks.l || pads.held('l', seat), r = ks.r || pads.held('r', seat), j = ks.j || pads.held('j', seat);
      if (pads.pressed({k: 'w', seat}) && !lastSw[seat]) swq[seat].push(1);
      lastSw[seat] = pads.held('w', seat);
      if (pads.pressed({k: 'd', seat}) && !lastDr[seat]) swq[seat].push(3);
      lastDr[seat] = pads.held('d', seat);
      let mx = (r ? 1 : 0) - (l ? 1 : 0);
      if (n === 2 && !view().vert) mx = (r ? 1 : 0) - (l ? 1 : 0); else mx *= dir;
      // portrait 2.5D court: ▲▼ buttons move toward / away from the net
      const f = pads.held('f', seat), bk = pads.held('b', seat);
      if (f || bk) mx = ((f ? 1 : 0) - (bk ? 1 : 0)) * (seat ? -1 : 1);
      return {mx, j: j ? 1 : 0, q: swq[seat].list(), as: ctx.opts.assist === 0 ? 0 : 1};
    }
    /* swipe / tap on the court (single local player): tap = auto shot, swipe up = smash (jumps for a high ball), swipe down = drop */
    const gest = new Map();
    pads.onDown((p, e) => {
      if (nLoc() !== 1) return; const v = view();
      if (v.ctrlH && p.y > v.H - v.ctrlH) return;
      for (const b of pads.list()) if (K.inR(p, b)) return;
      gest.set(e.pointerId, {x: p.x, y: p.y, t: performance.now(), done: false});
    });
    const fireG = (gs, type) => { if (gs.done) return; gs.done = true; const s = ctx.mySeats[0]; if (s != null) swq[s].push(type); };
    ctx.on(cv.cv, 'pointermove', e => {
      const gs = gest.get(e.pointerId); if (!gs || gs.done) return;
      const p = cv.pos(e), dx = p.x - gs.x, dy = p.y - gs.y;
      if (dx * dx + dy * dy < 22 * 22) return;
      fireG(gs, dy < -Math.abs(dx) * .6 ? 4 : dy > Math.abs(dx) * .6 ? 3 : 1);
    });
    const gUp = e => { const gs = gest.get(e.pointerId); if (gs) { if (performance.now() - gs.t < 450) fireG(gs, 1); gest.delete(e.pointerId); } };
    ctx.on(cv.cv, 'pointerup', gUp); ctx.on(cv.cv, 'pointercancel', e => gest.delete(e.pointerId));
    /* ---------- physics ---------- */
    function fxEv(k, ...a) { K.ev(st, k, ...a); }
    function stepPlayer(i, inp, dt) {
      const p = st.p[i], lo = i ? CW / 2 + .35 : .3, hi = i ? CW - .3 : CW / 2 - .35;
      const ground = p.y <= 0.001;
      let mx = BX.clamp(+inp.mx || 0, -1, 1);
      if (inp.as && !mx && !inp.ai) mx = assistMx(i);
      const tv = mx * SPD;
      p.vx += (tv - p.vx) * Math.min(1, dt * (ground ? 14 : 4));
      if (inp.j && ground && p.cd >= 0) { p.vy = JV; fxEv('jump', i); }
      p.vy -= G * 1.35 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < 0) { if (p.vy < -2) fxEv('land', i); p.y = 0; p.vy = 0; }
      p.x = BX.clamp(p.x, lo, hi);
      p.sw = Math.max(0, p.sw - dt); p.hitT = Math.max(0, p.hitT - dt);
      if (p.arm > 0) { p.arm -= dt; if (hitAttempt(i, p.armT)) { p.arm = 0; p.sw = .3; } }
      if (mx) p.f = i ? -1 : 1;
    }
    /* auto-run toward where the shuttle will be (Badminton-League style assist) — only when the player gives no direction */
    function assistMx(i) {
      const p = st.p[i], sx = i ? -1 : 1, home = i ? CW * .7 : CW * .3;
      let tx = home;
      if (st.ph === 'play' && st.last !== i && st.last >= 0) { const pr = predictLand(st.b, i); tx = (pr.hx != null ? pr.hx : pr.x) - sx * .5; }
      else if (st.ph !== 'play') return 0;
      tx = BX.clamp(tx, i ? CW / 2 + .5 : .4, i ? CW - .4 : CW / 2 - .5);
      const dx = tx - p.x; return Math.abs(dx) < .12 ? 0 : BX.clamp(dx * 2.2, -.92, .92);
    }
    function trySwing(i, type) {
      const p = st.p[i]; if (p.sw > .12) return;
      p.sw = .3; fxEv('swing', i);
      if (st.ph === 'serve') { if (i === st.srv && st.t <= 0) serve(i); return; }
      if (st.ph !== 'play') return;
      if (type === 4) { type = 2; if (p.y <= .001 && st.b.y > PH + .6 && st.last !== i) { p.vy = JV; fxEv('jump', i); p.arm = .5; p.armT = 2; return; } }
      if (!hitAttempt(i, type)) { p.arm = .2; p.armT = type; }    // early press is buffered for 0.2 s
    }
    function hitAttempt(i, type) {
      if (st.ph !== 'play') return false;
      const p = st.p[i];
      const b = st.b, sx = i ? -1 : 1;
      const cx = p.x + sx * .25, cy = p.y + PH * .95;            // racket pivot (shoulder)
      const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
      if (d > REACH + .35 || (b.x - p.x) * sx < -.9) return false;
      if (st.last === i) return false;
      const qual = BX.clamp(1 - Math.abs(d - REACH * .7) / (REACH * .9), .25, 1);
      const air = p.y > .15, high = b.y > p.y + PH * .9;
      const inp = (st._in && st._in[i]) || {};
      const fwd = type === 3 ? true : type === 2 ? false : inp.ai ? !!inp.f : (+inp.mx || 0) * sx > 0;
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
      return true;
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
    /* landscape / desktop: side view.  portrait: 2.5D court seen from behind the local player's baseline
       (court length → screen depth, shuttle height drawn above its ground shadow) so nothing is squeezed. */
    const viewSeat = () => ctx.mySeats.length === 1 ? ctx.mySeats[0] : 0;
    const DC = 20, HC = 14, LAT = 2.6, TOPO = (HC - 9) / (DC + CW), SPAN = HC / DC - TOPO;                         // 2.5D camera: distance behind baseline, height (m), half court width
    function view() {
      const W = cv.w, H = cv.h, port = H > W * 1.1;
      const two = nLoc() === 2 && W < 560;
      const ctrlH = touchUI() ? (two ? Math.min(H * .26, 190) : port ? Math.min(H * .2, 160) : Math.min(H * .26, 110)) : 0;
      const top = 44, avail = H - ctrlH - top;
      if (port) {
        const F = Math.min((avail - 18) / SPAN, W * .95 * DC / (LAT * 2)), hz = top + 6 - TOPO * F + Math.max(0, (avail - 18 - SPAN * F) * .5);
        return {W, H, port, vert: true, F, hz, cx: W / 2, ctrlH, top, flip: viewSeat() === 1, s: F / (DC + CW / 2), gy: hz + HC * F / (DC + CW / 2)};
      }
      const lw = CW + 1.6, lh = 6.2;
      const s = Math.min(W / lw, avail / lh);
      const gx = (W - CW * s) / 2, gy = top + avail - Math.max(14, avail * .06);
      return {W, H, port, s, sx: s, gx, gy, ctrlH, top, flip: viewSeat() === 1 && nLoc() === 1};
    }
    const touchUI = () => BX.TOUCH.matches || pads.touched;
    const X = (v, x) => v.flip ? v.gx + (CW - x) * v.sx : v.gx + x * v.sx;
    const Y = (v, y) => v.gy - y * v.s;
    /* project court point (x along length, y height, lat sideways) → screen {x, y, k px/m} */
    function P(v, x, y, lat = 0) {
      if (!v.vert) return {x: X(v, x), y: Y(v, y), k: v.s};
      const d = v.flip ? CW - x : x, k = v.F / (DC + d);
      return {x: v.cx + lat * k, y: v.hz + (HC - y) * k, k};
    }
    function ctrlBtns(v) {
      if (!touchUI()) return [];
      const out = [], H = v.H, W = v.W, h = v.ctrlH, y0 = H - h;
      const two = nLoc() === 2 && W < 560;
      const groups = nLoc() === 2 ? (two ? [[0, 0, W, y0 + h / 2, h / 2], [1, 0, W, y0, h / 2]] : [[0, 0, W / 2], [1, W / 2, W / 2]]) : [[viewSeat(), 0, W]];
      for (const [seat, gx, gw, ry, rh] of groups) {
        const pad = 8, hh = rh || h, yy = ry != null ? ry : y0, bh = Math.min(hh - pad * 2, 84), by = yy + (hh - bh) / 2;
        if (v.vert && nLoc() === 1) {   // portrait single player: ▲▼ stacked on the left, 跳 吊 挥 on the right
          const aw = Math.min(96, gw * .24), ah = (hh - pad * 3) / 2;
          out.push({k: 'f', seat, x: gx + pad, y: yy + pad, w: aw, h: ah}, {k: 'b', seat, x: gx + pad, y: yy + pad * 2 + ah, w: aw, h: ah});
          const rx = gx + pad * 2 + aw, rw = gw - aw - pad * 3, bw = (rw - pad * 2) / 3.4, bh2 = hh - pad * 2;
          out.push({k: 'j', seat, x: rx, y: yy + pad + bh2 * .3, w: bw, h: bh2 * .7}, {k: 'd', seat, x: rx + bw + pad, y: yy + pad + bh2 * .15, w: bw, h: bh2 * .85}, {k: 'w', seat, x: rx + bw * 2 + pad * 2, y: yy + pad, w: bw * 1.4, h: bh2});
          continue;
        }
        const bw = Math.min((gw - pad * 6) / 5, 110);
        const mirror = nLoc() === 2 && seat === 1 && !two;
        const mv = v.vert ? (seat === viewSeat() ? ['b', 'f'] : ['f', 'b']) : ['l', 'r'];
        const order = mirror ? ['w', 'd', 'j', ...mv] : [...mv, 'j', 'd', 'w'];
        const xs = mirror ? [gx + pad, gx + pad * 2 + bw, gx + pad * 3 + bw * 2, gx + gw - pad * 2 - bw * 2, gx + gw - pad - bw]
          : [gx + pad, gx + pad * 2 + bw, gx + gw - pad * 3 - bw * 3, gx + gw - pad * 2 - bw * 2, gx + gw - pad - bw];
        order.forEach((k, i) => out.push({k, seat, x: xs[i], y: by, w: bw, h: bh}));
      }
      return out;
    }
    /* ---------- events ---------- */
    let banner = null;
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const v = view(), k = e[0];
        if (k === 'hit') {
          const kd = e[3]; const hard = kd === 'smash' || kd === 'kill'; ctx.sfx(hard ? 'crash' : 'swish'); ctx.sfx(hard ? 'hit' : 'pop');
          const q = P(v, st.b.x, st.b.y), sc = BX.clamp(q.k / 40, .6, 1.4);
          fx.burst(q.x, q.y, {n: kd === 'smash' ? 22 : 8, color: kd === 'smash' ? ['#fff', '#ffd76a', '#ff8a5a'] : ['#fff', '#ffe8b0'], sp: (kd === 'smash' ? 300 : 140) * sc, size: 3});
          if (hard) { fx.shake(7); fx.text(q.x, q.y - 30, kd === 'kill' ? '扑！' : '杀！', {size: 34, color: '#ff8a5a', life: .8}); if (ctx.isLocal(1 - e[2]) && !ctx.isLocal(e[2])) ctx.buzz(15); }
          else if (kd === 'drop' || kd === 'net') fx.text(q.x, q.y - 26, kd === 'drop' ? '吊' : '搓', {size: 22, color: '#bfe8ff', life: .6});
          else if (kd === 'clear' && e[4] >= 90) fx.text(q.x, q.y - 26, '好球', {size: 18, color: '#ffe8b0', life: .6});
        } else if (k === 'net') ctx.sfx('bounce');
        else if (k === 'land') { ctx.sfx('move'); const q = P(v, e[3] / 10, 0); fx.burst(q.x, q.y, {n: 10, color: ['#fff', '#d9e8c0'], sp: 120, up: 60, size: 3}); }
        else if (k === 'jump') ctx.sfx('whoosh');
        else if (k === 'point') {
          ctx.sfx('score'); fx.flash(.6);
          banner = {t: 0, w: e[2], why: e[3] || '', rally: st.rally};
          if (nLoc() === 1 && ctx.isLocal(1 - e[2])) ctx.buzz(20);
        }
        else if (k === 'end') ctx.sfx('bell');
      });
    }
    function info() {
      ctx.info(0, st.s[0]); ctx.info(1, st.s[1]);
      ctx.status(st.over ? '比赛结束' : st.ph === 'serve' ? ctx.name(st.srv) + ' 发球' + (ctx.isLocal(st.srv) && nLoc() === 1 ? '（点「挥」发球）' : '') : st.ph === 'point' ? (st.why || '得分') : '先到 ' + TO + ' 分 · 领先 2 分');
    }
    /* predicted landing spot for the local human's incoming shuttle (pref 'hints') */
    function landMark() {
      if (st.ph !== 'play' || !ctx.pref('hints') || nLoc() === 0) return null;
      const tgt = 1 - st.last; if (!ctx.isLocal(tgt) || st.b.vy > 4 && st.b.y < 1) return null;
      return predictLand(st.b, tgt).x;
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
          stepPlayer(i, inp, dt);
          K.take(inp.q, seen, i, it => trySwing(i, it.length > 1 ? +it[0] || 1 : 1));
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
        if (st.ph === 'play') { trail.push([st.b.x, st.b.y]); if (trail.length > 10) trail.shift(); } else trail.length = 0;
        if (v.vert) drawVert(g, v); else drawSide(g, v);
        g.restore();
        drawHUD(g, v);
        fx.draw(g);
        drawCtrl(g, v);
        fx.drawFlash(g, v.W, v.H);
      },
    };
    function drawTrail(g, v) {
      for (let i = 1; i < trail.length; i++) {
        const a = P(v, trail[i - 1][0], trail[i - 1][1]), b = P(v, trail[i][0], trail[i][1]);
        g.strokeStyle = `rgba(255,255,255,${i / trail.length * .45})`; g.lineWidth = i / trail.length * 4; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    }
    function drawMark(g, v) {
      const lx = landMark(); if (lx == null) return;
      const q = P(v, BX.clamp(lx, -.5, CW + .5), 0), out = lx < 0 || lx > CW, r = Math.max(8, .32 * q.k), a = .55 + .25 * Math.sin(time * 8);
      g.strokeStyle = out ? `rgba(255,120,90,${a})` : `rgba(255,240,170,${a})`; g.lineWidth = 2.5; g.setLineDash([5, 4]);
      g.beginPath(); g.ellipse(q.x, q.y, r, v.vert ? r * .35 : r * .28, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      if (out) D.text(g, '出界', q.x, q.y - 12, {size: 11, color: '#ffb09a', weight: 800, stroke: 'rgba(0,0,0,.5)'});
    }
    function drawSide(g, v) {
      drawHall(g, v);
      drawMark(g, v);
      drawTrail(g, v);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(X(v, st.b.x), Y(v, 0) + 2, 6 * (1 - Math.min(.7, st.b.y / 8)), 2, 0, 0, Math.PI * 2); g.fill();
      st.p.forEach((p, i) => {
        const face = (i ? -1 : 1) * (v.flip ? -1 : 1);
        const swing = p.sw > 0 ? 1 - p.sw / .3 : -1;
        if (ctx.isLocal(i) && nLoc() === 1) { g.fillStyle = D.alpha(ctx.color(i), .35); g.beginPath(); g.ellipse(X(v, p.x), Y(v, 0) + 3, PH * v.s * .3, 5, 0, 0, Math.PI * 2); g.fill(); }
        drawPlayer(g, X(v, p.x), Y(v, p.y), PH * v.s, ctx.color(i), {face, swing, jump: p.y > .05 ? 1 : 0, run: Math.abs(p.vx) > .5 ? time * 14 : 0, high: st.b.y > p.y + PH * .9});
      });
      const ba = v.flip ? Math.PI - st.b.a : st.b.a;
      drawShuttle(g, X(v, st.b.x), Y(v, st.b.y), Math.max(7, .16 * v.s), st.ph === 'play' ? ba : -Math.PI / 2);
    }
    function drawVert(g, v) {
      const W = v.W, far = P(v, v.flip ? 0 : CW, 0), wallB = far.y - far.k * .6;
      K.hall(g, 0, 0, W, wallB, {});
      const fg = g.createLinearGradient(0, wallB, 0, v.H); fg.addColorStop(0, '#b8844a'); fg.addColorStop(1, '#d6a565'); g.fillStyle = fg; g.fillRect(0, wallB, W, v.H - wallB);
      g.strokeStyle = 'rgba(100,60,20,.18)'; g.lineWidth = 1; for (let i = -6; i <= 6; i++) { const a = P(v, v.flip ? CW + 6 : -6, 0, i * 1.4), b = P(v, v.flip ? -6 : CW + 6, 0, i * 1.4); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      // court surface + lines
      const quad = (x0, x1, l0, l1) => { const a = P(v, x0, 0, l0), b = P(v, x0, 0, l1), c = P(v, x1, 0, l1), d = P(v, x1, 0, l0); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); };
      quad(-.5, CW + .5, -LAT - .5, LAT + .5); g.fillStyle = '#2f6f45'; g.fill();
      quad(0, CW, -LAT, LAT); g.fillStyle = '#3f8f5b'; g.fill();
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
      const line = (x0, l0, x1, l1) => { const a = P(v, x0, 0, l0), b = P(v, x1, 0, l1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); };
      quad(0, CW, -LAT, LAT); g.stroke();
      for (const x of [CW / 2 - 1.98, CW / 2 + 1.98, .76, CW - .76]) line(x, -LAT, x, LAT);
      line(0, 0, CW / 2 - 1.98, 0); line(CW / 2 + 1.98, 0, CW, 0);
      drawMark(g, v);
      // depth-sorted: far player, net, near player, shuttle
      const items = [];
      st.p.forEach((p, i) => items.push({d: v.flip ? CW - p.x : p.x, f: () => vPlayer(g, v, i)}));
      items.push({d: CW / 2, f: () => vNet(g, v)});
      const bd = v.flip ? CW - st.b.x : st.b.x;
      items.push({d: bd - .01, f: () => vShuttle(g, v)});
      items.sort((a, b) => b.d - a.d).forEach(it => it.f());
    }
    function vNet(g, v) {
      const a = P(v, CW / 2, NETH, -LAT - .15), b = P(v, CW / 2, .78, LAT + .15), gnd = P(v, CW / 2, 0, 0).y;
      g.fillStyle = '#5e3a1a'; for (const x of [a.x, b.x]) g.fillRect(x - 2.5, a.y - 4, 5, gnd - a.y + 4);
      g.fillStyle = 'rgba(30,20,10,.3)'; g.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath();
      for (let y = a.y + 4; y < b.y; y += 4) { g.moveTo(a.x, y); g.lineTo(b.x, y); }
      for (let x = a.x; x <= b.x; x += 5) { g.moveTo(x, a.y); g.lineTo(x, b.y); }
      g.stroke();
      g.fillStyle = '#fff'; g.fillRect(a.x, a.y - 1, b.x - a.x, 4);
    }
    function vShuttle(g, v) {
      const b = st.b, q = P(v, b.x, b.y), sh = P(v, b.x, 0);
      drawTrail(g, v);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(sh.x, sh.y, Math.max(3, .18 * sh.k), Math.max(1.5, .06 * sh.k), 0, 0, Math.PI * 2); g.fill();
      if (st.ph === 'play' && b.y > .3) { g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(q.x, q.y); g.stroke(); }
      let ang = -Math.PI / 2;
      if (st.ph === 'play') { const q2 = P(v, b.x + b.vx * .03, b.y + b.vy * .03); ang = Math.atan2(q2.y - q.y, q2.x - q.x); if (Math.abs(q2.y - q.y) + Math.abs(q2.x - q.x) < .5) ang = -Math.PI / 2; }
      drawShuttle(g, q.x, q.y, BX.clamp(.2 * q.k, 5, 16), ang);
    }
    function vPlayer(g, v, i) {
      const p = st.p[i], near = (i === 0) !== v.flip, lat = near ? -.32 : .32, q = P(v, p.x, p.y, lat), sh = P(v, p.x, 0, lat);
      if (ctx.isLocal(i) && nLoc() === 1) { g.fillStyle = D.alpha(ctx.color(i), .4); g.beginPath(); g.ellipse(sh.x, sh.y, .45 * sh.k, .12 * sh.k, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(sh.x, sh.y, .25 * sh.k, .07 * sh.k, 0, 0, Math.PI * 2); g.fill();
      const swing = p.sw > 0 ? 1 - p.sw / .3 : -1;
      drawPlayerV(g, q.x, q.y, PH * q.k, ctx.color(i), {back: near, swing, jump: p.y > .05, run: Math.abs(p.vx) > .5 ? time * 14 : 0, high: st.b.y > p.y + PH * .9});
    }
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
      const midY = v.vert ? v.top + 30 : v.gy - 3.6 * v.s;
      if (st.ph === 'serve' && !st.over) { const loc = ctx.isLocal(st.srv); D.text(g, loc ? (touchUI() ? (nLoc() === 1 ? '点「挥」或点球场发球' : ctx.name(st.srv) + ' 点「挥」发球') : (nLoc() === 1 ? '按空格发球' : ctx.name(st.srv) + ' 按挥拍键发球')) : ctx.name(st.srv) + ' 发球', W / 2, midY, {size: Math.min(22, W * .05), color: '#fff6dc', font: 'deco', weight: 400, stroke: 'rgba(60,25,5,.8)'}); }
      const gp = !st.over && (st.s[0] >= TO - 1 || st.s[1] >= TO - 1) && st.s[0] !== st.s[1];
      if (gp) D.text(g, '局点', W / 2, 50, {size: 13, color: '#ff9a5a', weight: 800, stroke: 'rgba(0,0,0,.5)'});
      if (st.ph === 'play' && st.rally >= 4) D.text(g, '回合 ' + (st.rally + 1) + ' 拍', W - 10, 52, {size: 12, color: '#fff6dc', align: 'right', weight: 800, stroke: 'rgba(0,0,0,.5)'});
      if (banner) {
        banner.t += 1 / 60; if (banner.t > 1.5) banner = null;
        else {
          const by = v.vert ? v.top + 70 : v.gy - 4.6 * v.s + 50, mine = ctx.isLocal(banner.w) && nLoc() === 1;
          K.banner(g, (mine ? '你' : ctx.name(banner.w)) + ' 得分', W / 2, by, Math.min(34, W * .07), banner.t / 1.5, {color: mine ? '#ffe08a' : '#fbe9d0'});
          if (banner.why) D.text(g, banner.why + (banner.rally >= 6 ? ' · ' + (banner.rally + 1) + ' 拍回合' : ''), W / 2, by + Math.min(34, W * .07) * .9, {size: 15, color: '#fff6dc', weight: 800, stroke: 'rgba(60,25,5,.8)'});
        }
      }
    }
    function drawCtrl(g, v) {
      const bs = ctrlBtns(v); if (!bs.length) return;
      g.fillStyle = 'rgba(30,16,6,.55)'; g.fillRect(0, v.H - v.ctrlH, v.W, v.ctrlH);
      if (nLoc() === 2) { g.fillStyle = '#e6c57d'; if (v.W < 560) g.fillRect(0, v.H - v.ctrlH / 2 - 1, v.W, 2); else g.fillRect(v.W / 2 - 1, v.H - v.ctrlH, 2, v.ctrlH); }
      const lab = {l: '◀', r: '▶', f: '▲', b: '▼', j: '跳', d: '吊', w: '挥'}, col = {l: '#c8a052', r: '#c8a052', f: '#c8a052', b: '#c8a052', j: '#3f7f6b', d: '#2f5d8a', w: '#c23a2b'};
      for (const b of bs) {
        const top = v.vert && b.seat !== viewSeat();
        K.btn(g, b, b.k === 'f' ? (top ? '▼' : '▲') : b.k === 'b' ? (top ? '▲' : '▼') : lab[b.k], {color: col[b.k], fg: '#fff6e0', pressed: pads.held(b.k, b.seat), size: Math.min(b.h * .42, b.w * .5, 28), font: 'jdw'.includes(b.k) ? 'deco' : undefined});
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

/* front / back view player for the portrait 2.5D court: x,y = feet; s = height px */
function drawPlayerV(g, x, y, s, col, o = {}) {
  const side = o.back ? 1 : -1, run = o.run ? Math.sin(o.run) : 0;
  g.save(); g.translate(x, y); g.lineCap = 'round';
  g.strokeStyle = '#f0c89a'; g.lineWidth = s * .075;
  const lift = o.jump ? .06 : 0;
  g.beginPath(); g.moveTo(-s * .06, -s * .46); g.lineTo(-s * .1, -s * (.03 + Math.max(0, run) * .06 + lift)); g.moveTo(s * .06, -s * .46); g.lineTo(s * .1, -s * (.03 + Math.max(0, -run) * .06 + lift)); g.stroke();
  g.fillStyle = '#fffaf0'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * s * .1, -s * (.02 + (sx < 0 ? Math.max(0, run) : Math.max(0, -run)) * .06 + lift), s * .05, s * .03, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#2b2118'; D.rr(g, -s * .13, -s * .53, s * .26, s * .13, s * .03); g.fill();
  const gr = g.createLinearGradient(-s * .15, 0, s * .15, 0); gr.addColorStop(0, D.shade(col, 15)); gr.addColorStop(1, D.shade(col, -20));
  g.fillStyle = gr; D.rr(g, -s * .15, -s * .83, s * .3, s * .34, s * .08); g.fill();
  g.fillStyle = '#e6c57d'; g.fillRect(-s * .15, -s * .67, s * .3, s * .03);
  // head (back view: hair only)
  g.fillStyle = '#f0c89a'; D.circle(g, 0, -s * .92, s * .09); g.fill();
  g.fillStyle = '#2b2118';
  if (o.back) { D.circle(g, 0, -s * .93, s * .092); g.fill(); }
  else { g.beginPath(); g.arc(0, -s * .94, s * .093, Math.PI, 0); g.fill(); D.circle(g, -s * .03, -s * .91, s * .012); g.fill(); D.circle(g, s * .03, -s * .91, s * .012); g.fill(); }
  g.fillStyle = '#c23a2b'; g.fillRect(-s * .09, -s * .965, s * .18, s * .022);
  // racket arm: rest = raised beside the head; swing = sweep across the body
  const sw = o.swing != null ? o.swing : -1;
  let a;   // angle in screen plane (0 = right, −π/2 = up), mirrored by side
  if (sw >= 0) a = o.high ? BX.lerp(-1.1, -2.5, BX.ease.out(sw)) : BX.lerp(-.2, -2.2, BX.ease.out(sw));
  else a = o.high ? -1.25 : -.75;
  const sx0 = side * s * .14, sy0 = -s * .78, al = s * .3, ca = Math.cos(a) * side, sa = Math.sin(a);
  const hx = sx0 + ca * al, hy = sy0 + sa * al;
  g.strokeStyle = '#f0c89a'; g.lineWidth = s * .06; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(hx, hy); g.stroke();
  const rx = hx + ca * s * .2, ry = hy + sa * s * .2;
  g.strokeStyle = '#5e3a1a'; g.lineWidth = s * .025; g.beginPath(); g.moveTo(hx, hy); g.lineTo(rx, ry); g.stroke();
  g.save(); g.translate(rx + ca * s * .1, ry + sa * s * .1); g.rotate(Math.atan2(sa, ca));
  g.strokeStyle = '#c8a052'; g.lineWidth = s * .022; g.beginPath(); g.ellipse(0, 0, s * .12, s * .09, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * .04, -s * .075); g.lineTo(i * s * .04, s * .075); g.stroke(); }
  g.restore();
  if (sw >= 0 && sw < .6) { g.strokeStyle = `rgba(255,255,255,${.5 * (1 - sw / .6)})`; g.lineWidth = s * .05; const aa = Math.atan2(sa, ca); g.beginPath(); g.arc(sx0, sy0, al + s * .3, aa - .45, aa + .45); g.stroke(); }
  g.strokeStyle = D.shade('#f0c89a', -10); g.lineWidth = s * .055; g.beginPath(); g.moveTo(-side * s * .13, -s * .77); g.lineTo(-side * s * .22, -s * .55); g.stroke();
  g.restore();
}

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
