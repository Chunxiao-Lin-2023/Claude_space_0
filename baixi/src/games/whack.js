/* 打地鼠 — realtime split-screen race on identical spawn schedules */
const D = BX.draw, C = BX.C, K = BX.data.spk;

BX.register({
  id: 'whack', title: '打地鼠', cat: 'speed', order: 2, sub: '同一批地鼠，看谁敲得多',
  desc: '两人各有一块九宫格地鼠田，冒出来的地鼠完全相同，比谁手快。金地鼠加 3 分，炸弹鼠扣 3 分千万别敲，连击还有额外奖励。',
  kind: 'realtime', seats: 2, noFirst: true, seatColors: ['#c23a2b', '#2f5d8a'], hint: false, snapHz: 30, inputHz: 60,
  options: [{key: 'len', label: '时长', choices: [[30, '30 秒'], [45, '45 秒'], [60, '60 秒']], def: 45},
    {key: 'pace', label: '节奏', choices: [[1, '悠闲'], [2, '标准'], [3, '疯狂']], def: 2},
    {key: 'hel', label: '铁盔鼠', choices: [[0, '无'], [1, '有']], def: 0}],
  howto: ['直接<b>点地鼠</b>（整格都算），手指放在下方你自己的田里；上方小田是对手的进度。',
    '金地鼠 +3，炸弹鼠 −3 千万别敲；<b>连击</b>越高每只加分越多，连击条满 10 进入「火力全开」。',
    '敲空、放跑地鼠、敲中炸弹都会断连击。可选「铁盔鼠」：要敲两下，得 2 分。',
    '键盘九宫格：Q W E / A S D / Z X C（同屏右方用小键盘 7–9 或 U I O / J K L / M , .）。'],
  rules: `<p>每位玩家有自己的 <b>3×3 地鼠田</b>，双方田里冒出的地鼠<b>时间、位置、种类完全一样</b>，公平比拼手速。</p>
<ul><li>普通地鼠：<b>+1</b> 分；</li><li><b>金地鼠</b>（闪金光）：<b>+3</b> 分；</li><li><b>炸弹鼠</b>（黑色、头顶引线）：敲中 <b>−3</b> 分，别碰！</li>
<li><b>连击</b>：连续敲中不失手，连击达到 5 起每只额外 +1，达到 10 起额外 +2。敲空、放跑地鼠或敲中炸弹都会中断连击。</li></ul>
<p>每局默认 <b>45 秒</b>，时间到分高者胜。</p>
<p>操作：鼠标或手指直接点地鼠。键盘九宫格：左方（下方）玩家 Q W E / A S D / Z X C；右方（上方）玩家用小键盘 7 8 9 / 4 5 6 / 1 2 3（没有小键盘可用 U I O / J K L / M , .）。单人时两套键都可以。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fbf6a'); gr.addColorStop(1, '#4f8f45'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { const x = w * (.2 + i * .3), y = h * .7; g.fillStyle = '#3a2410'; g.beginPath(); g.ellipse(x, y, w * .12, h * .07, 0, 0, Math.PI * 2); g.fill(); }
    mole(g, w * .5, h * .7, w * .1, 'n', 1, 0);
    mole(g, w * .2, h * .7, w * .1, 'g', .7, 0);
    mole(g, w * .8, h * .7, w * .1, 'b', .55, 0);
    for (let i = 0; i < 3; i++) { const x = w * (.2 + i * .3), y = h * .7; g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(x, y + h * .02, w * .13, h * .05, 0, 0, Math.PI); g.fill(); }
    g.save(); g.translate(w * .64, h * .3); g.rotate(-.7); D.wood(g, -4, 0, 8, h * .4, {base: '#a8723d', seed: 2}); g.fillStyle = '#b23a2b'; D.rr(g, -18, -12, 36, 22, 6); g.fill(); g.fillStyle = '#e6c57d'; g.fillRect(-18, -3, 36, 4); g.restore();
    for (let i = 0; i < 5; i++) { g.fillStyle = '#ffd76a'; D.circle(g, w * .5 + Math.cos(i * 1.3) * w * .12, h * .4 + Math.sin(i * 1.3) * h * .08, 3); g.fill(); }
  },
  create(ctx) {
    const LEN = BX.test ? 12 : (ctx.opts.len || 45), PACE = [0, 1.3, 1, .78][ctx.opts.pace || 2], HEL = !!ctx.opts.hel;
    const st = {ph: 'intro', t: 3, time: 0, m: [], mid: 0, s: [0, 0], cb: [0, 0], best: [0, 0], ev: [], evId: 0, over: false, nextT: 0, hit: [0, 0], miss: [0, 0], bomb: [0, 0]};
    // m: [{i id, h hole, k 'n'|'g'|'b', t0, d, hit:[0|1|2,0|1|2]}]  hit: 0 up, 1 whacked, 2 bomb-hit
    const cv = ctx.canvas(), fx = K.fx(), pads = K.pads(ctx, cv);
    const queues = [K.tq(), K.tq()], seen = {}, evSeen = {v: -1};
    const hamm = [];       // local visual hammer swings {x,y,t}
    const pred = new Map();   // local prediction: 'seat:moleId' → {t, k} — the mole reacts on the tap frame, the host confirms later
    const pops = new Map();   // 'seat:moleId' → local time of the (confirmed or predicted) hit, for the squash-pop animation
    let freeze = 0;
    let time = 0, lastCd = 4, lastTick = 99, rT = 0, vt = 0;   // vt: visual clock that stops during hit-stop
    const aiSeen = [{}, {}];

    function spawnStep(dt) {
      st.nextT -= dt;
      const prog = st.time / LEN;
      const live = st.m.filter(m => st.time < m.t0 + m.d).length;
      if (st.nextT <= 0 && live < 2 + Math.floor(prog * 2.5)) {
        const busy = new Set(st.m.filter(m => st.time < m.t0 + m.d + .15).map(m => m.h));
        const free = BX.range(9).filter(h => !busy.has(h));
        if (free.length) {
          const r = Math.random(); let k = r < .1 ? 'g' : r < .1 + .1 + prog * .1 ? 'b' : 'n';
          if (HEL && k === 'n' && Math.random() < .22) k = 'h';
          const d = (k === 'g' ? .75 : k === 'b' ? 1.5 : k === 'h' ? 1.6 : 1.15) * (1 - prog * .35) * PACE;
          st.m.push({i: ++st.mid, h: BX.pick(free), k, t0: Math.round(st.time * 100) / 100, d: Math.round(d * 100) / 100, hit: [0, 0], dent: [0, 0]});
        }
        st.nextT = (.62 - prog * .3) * (.6 + Math.random() * .8) * PACE;
      }
      // expire
      for (let i = st.m.length - 1; i >= 0; i--) {
        const m = st.m[i];
        if (st.time > m.t0 + m.d) {
          if (!m.done) { m.done = 1; for (let s = 0; s < 2; s++) if (!m.hit[s] && m.k !== 'b' && st.cb[s] > 0) { st.cb[s] = 0; K.ev(st, 'esc', s, m.h); } }
          if (st.time > m.t0 + m.d + .5) st.m.splice(i, 1);
        }
      }
    }
    function whack(s, h) {
      const m = st.m.find(m => m.h === h && st.time >= m.t0 && st.time < m.t0 + m.d && !m.hit[s]);
      if (!m) { const lost = st.cb[s]; st.cb[s] = 0; st.miss[s]++; K.ev(st, 'air', s, h, lost); return; }
      if (m.k === 'b') { m.hit[s] = 2; st.s[s] -= 3; st.cb[s] = 0; st.bomb[s]++; K.ev(st, 'bomb', s, h); return; }
      if (m.k === 'h' && !m.dent[s]) { m.dent[s] = 1; K.ev(st, 'clang', s, h); return; }
      m.hit[s] = 1; st.cb[s]++; st.hit[s]++; st.best[s] = Math.max(st.best[s], st.cb[s]);
      const pts = (m.k === 'g' ? 3 : m.k === 'h' ? 2 : 1) + (st.cb[s] >= 10 ? 2 : st.cb[s] >= 5 ? 1 : 0);
      st.s[s] += pts; K.ev(st, 'hit', s, h, m.k, pts, st.cb[s]);
    }
    /* ---------- layout ---------- */
    const nLoc = () => ctx.mySeats.length;
    function fields() {
      const W = cv.w, H = cv.h, land = W >= H;
      if (nLoc() === 2) return land ? [{seat: 0, x: 0, y: 0, w: W / 2, h: H, rot: 0, act: true}, {seat: 1, x: W / 2, y: 0, w: W / 2, h: H, rot: 0, act: true}]
        : [{seat: 0, x: 0, y: H / 2, w: W, h: H / 2, rot: 0, act: true}, {seat: 1, x: 0, y: 0, w: W, h: H / 2, rot: 1, act: true}];
      const me = ctx.mySeats.length ? ctx.mySeats[0] : 0, op = 1 - me;
      if (land) { const mw = W * .66; return [{seat: me, x: 0, y: 0, w: mw, h: H, act: nLoc() > 0}, {seat: op, x: mw, y: 0, w: W - mw, h: H, mini: true}]; }
      const oh = H * .28; return [{seat: me, x: 0, y: oh, w: W, h: H - oh, act: nLoc() > 0}, {seat: op, x: 0, y: 0, w: W, h: oh, mini: true}];
    }
    function grid(f) {
      const head = f.mini ? Math.min(30, f.h * .16) : Math.min(54, f.h * .11), pad = Math.max(6, Math.min(f.w, f.h) * .03);
      const aw = f.w - pad * 2, ah = f.h - head - pad * 2;
      const cell = Math.min(aw / 3, ah / 3 / .86);
      const gw = cell * 3, gh = cell * .86 * 3;
      return {head, cell, ch: cell * .86, x: (f.w - gw) / 2, y: head + pad + (ah - gh) / 2};
    }
    const holeC = (G, h) => ({x: G.x + (h % 3 + .5) * G.cell, y: G.y + (Math.floor(h / 3) + .72) * G.ch});
    const toLocal = (f, p) => f.rot ? {x: f.x + f.w - p.x, y: f.y + f.h - p.y} : {x: p.x - f.x, y: p.y - f.y};
    const toScreen = (f, p) => f.rot ? {x: f.x + f.w - p.x, y: f.y + f.h - p.y} : {x: f.x + p.x, y: f.y + p.y};
    pads.onDown(p => {
      if (st.ph !== 'play') return;
      for (const f of fields()) {
        if (!f.act || !K.inR(p, f) || !ctx.isLocal(f.seat)) continue;
        const l = toLocal(f, p), G = grid(f), h = pickHole(f.seat, G, l);
        if (h < 0) continue;
        hit(f.seat, h, p);
      }
    });
    /* generous hit test: the tapped cell if its mole is up; else the nearest up mole whose drawn body is under the finger
       (heads poke into the cell above); else the cell itself (an air swing), with a margin around the field */
    const liveAt = (seat, h, t = st.time) => st.m.find(m => m.h === h && t >= m.t0 && t < m.t0 + m.d && !m.hit[seat] && !pred.has(seat + ':' + m.i));
    function pickHole(seat, G, l) {
      const fx_ = (l.x - G.x) / G.cell, fy = (l.y - G.y) / G.ch;
      if (fx_ < -.3 || fx_ > 3.3 || fy < -.45 || fy > 3.3) return -1;
      const cell = BX.clamp(Math.floor(fy), 0, 2) * 3 + BX.clamp(Math.floor(fx_), 0, 2);
      if (st.ph === 'play' && liveAt(seat, cell)) return cell;
      let best = -1, bd = 1e9;
      for (let h = 0; h < 9; h++) {
        if (!liveAt(seat, h)) continue;
        const c = holeC(G, h), mx = c.x, my = c.y - G.ch * .42, dx = (l.x - mx) / (G.cell * .5), dy = (l.y - my) / (G.ch * .72), d = dx * dx + dy * dy;
        if (d < 1 && d < bd) { bd = d; best = h; }
      }
      return best >= 0 ? best : cell;
    }
    function hit(seat, h, scr) {
      queues[seat].push(h); ctx.sfx('swish');
      const m = st.ph === 'play' && liveAt(seat, h);
      if (m) {                                  // predict the outcome locally (certain for this seat's own field)
        const key = seat + ':' + m.i, f = fields().find(f => f.seat === seat && !f.mini);
        if (m.k === 'h' && !(m.dent && m.dent[seat]) && !pred.has(key + 'd')) { pred.set(key + 'd', {t: time}); impact(seat, h, 'clang', f); }
        else { pred.set(key, {t: time, k: m.k}); pops.set(key, vt); impact(seat, h, m.k === 'b' ? 'bomb' : m.k, f); }
      }
      if (!scr) { const f = fields().find(f => f.seat === seat); if (f) { const G = grid(f); scr = toScreen(f, holeC(G, h)); scr.y -= G.ch * .25; } }
      if (scr) hamm.push({x: scr.x, y: scr.y, t: 0, rot: fields().find(f => f.seat === seat && f.rot) ? Math.PI : 0});
    }
    /* ---------- AI ---------- */
    function aiInput(seat, level) {
      const q = aiSeen[seat].q || (aiSeen[seat].q = K.tq()), plan = aiSeen[seat];
      if (st.ph === 'play') for (const m of st.m) {
        if (m.hit[seat] || plan[m.i] === 'x') continue;
        if (plan[m.i] == null) {
          const rt = [0, .62, .42, .26][level] * (.75 + Math.random() * .6) * (BX.test ? .6 : 1);
          const bombErr = [0, .22, .08, .015][level], skip = [0, .25, .1, .03][level];
          if (m.k === 'b') plan[m.i] = Math.random() < bombErr ? m.t0 + rt + .25 : 'x';
          else plan[m.i] = Math.random() < skip ? 'x' : m.t0 + rt;
        }
        if (plan[m.i] !== 'x' && st.time >= plan[m.i]) { if (m.k === 'h' && !m.dent[seat]) { plan[m.i] = st.time + [0, .3, .2, .12][level]; q.push(m.h); } else { plan[m.i] = 'x'; q.push(m.h); } }
      }
      return {q: q.list()};
    }
    function info() {
      ctx.info(0, st.s[0] + ' 分'); ctx.info(1, st.s[1] + ' 分');
      const left = Math.max(0, Math.ceil(LEN - st.time));
      if (st.ph === 'play' && left <= 5 && left !== lastTick) { lastTick = left; if (left > 0) ctx.sfx('tick'); }
      ctx.status(st.ph === 'intro' ? '准备…' : st.over ? '时间到' : '剩余 ' + left + ' 秒');
    }
    /* immediate impact feedback (sound + burst + hit-stop), shared by prediction and confirmed remote hits */
    function impact(s, h, kind, f) {
      if (!f) return; const G = grid(f), up = toScreen(f, {x: holeC(G, h).x, y: holeC(G, h).y - G.ch * .35}), sc = f.mini ? .5 : 1;
      if (kind === 'b') kind = 'bomb';
      if (kind === 'bomb') { ctx.sfx('boom'); if (!f.mini) { fx.shake(12); fx.flash(.9, '255,90,60'); freeze = .07; if (ctx.isLocal(s)) ctx.buzz(60); } fx.burst(up.x, up.y, {n: 34, color: ['#ff6a3a', '#ffd76a', '#333', '#888'], sp: 300 * sc, size: 6 * sc, grav: 120}); }
      else if (kind === 'clang') { ctx.sfx('bounce'); fx.burst(up.x, up.y - G.ch * .2, {n: 10, color: ['#ddd', '#fff', '#999'], sp: 180 * sc, size: 3 * sc}); fx.text(up.x, up.y - 12 * sc, '当！', {size: 22 * sc, color: '#e8eef5'}); if (!f.mini) fx.shake(2); }
      else {
        const gold = kind === 'g';
        ctx.sfx(gold ? 'coin' : 'hit'); if (!f.mini) { fx.shake(gold ? 6 : 2.5); if (gold) { freeze = .06; ctx.buzz(14); } }
        fx.burst(up.x, up.y, {n: gold ? 26 : 12, color: gold ? ['#ffd76a', '#fff3b0', '#e6a020'] : ['#ffd76a', '#fff'], sp: 220 * sc, size: 4 * sc, up: 60});
        if (ctx.isLocal(s) && !f.mini && gold) fx.flash(.4, '255,220,120');
      }
    }
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const k = e[0];
        if (k === 'cd') ctx.sfx('tick'); else if (k === 'go') { ctx.sfx('gong'); fx.flash(.5); }
        else if (k === 'end') { ctx.sfx('bell'); fx.flash(.7); }
        else {
          const s = e[2], h = e[3], f = fields().find(f => f.seat === s); if (!f) return;
          const G = grid(f), p = toScreen(f, holeC(G, h)), up = toScreen(f, {x: holeC(G, h).x, y: holeC(G, h).y - G.ch * .35}), sc = f.mini ? .5 : 1;
          const m = st.m.find(m => m.h === h && m.hit[s]) || null, key = m ? s + ':' + m.i : '', was = m && pred.has(key);
          if (k === 'hit') {
            if (m && !pops.has(key)) pops.set(key, vt);
            if (!was) impact(s, h, e[4], f);
            fx.text(up.x, up.y - 10 * sc, '+' + e[5] + (e[6] >= 3 && !f.mini ? '' : ''), {size: (e[4] === 'g' ? 34 : 26) * sc, color: e[4] === 'g' ? '#ffd76a' : '#fff'});
            if (e[6] >= 3 && !f.mini) fx.text(up.x + G.cell * .32, up.y - 34 * sc, '×' + e[6], {size: 16 + Math.min(10, e[6]), color: e[6] >= 10 ? '#ff7a4a' : e[6] >= 5 ? '#ff9a5a' : '#ffe08a', life: .6, vy: -70});
            if (e[6] >= 5 && e[6] % 5 === 0 && !f.mini) { ctx.sfx('score'); fx.text(p.x, toScreen(f, {x: 0, y: G.y + G.ch * .2}).y, e[6] + ' 连击！', {size: 30, color: '#ff9a5a', life: 1.2}); }
          } else if (k === 'bomb') {
            if (m && !pops.has(key)) pops.set(key, vt);
            if (!was) impact(s, h, 'bomb', f);
            fx.text(up.x, up.y, '−3', {size: 34 * sc, color: '#ff6a5a'});
          } else if (k === 'clang') { const m2 = st.m.find(m => m.h === h && m.dent && m.dent[s]); if (!(m2 && pred.has(s + ':' + m2.i + 'd'))) impact(s, h, 'clang', f); }
          else if (k === 'air') for (const m3 of st.m) if (m3.h === h) { pred.delete(s + ':' + m3.i); pops.delete(s + ':' + m3.i); }   // mis-prediction → undo
          if (k === 'air' && ctx.isLocal(s) && !f.mini) { ctx.sfx('move'); fx.burst(p.x, p.y - G.ch * .1, {n: 6, color: '#8a5a2a', sp: 90, size: 3}); if (e[4] >= 3) { fx.text(p.x, p.y - G.ch * .3, '连击中断', {size: 18, color: '#e6c57d'}); ctx.buzz(10); } }
          else if (k === 'esc' && !f.mini && ctx.isLocal(s)) fx.text(p.x, p.y - G.ch * .2, '溜了', {size: 18, color: '#e6c57d'});
        }
      });
    }
    const inst = {
      st,
      input(seat) { return {q: queues[seat].list()}; },
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        if (st.ph === 'intro') {
          st.t -= dt; const c = Math.ceil(st.t); if (c < lastCd && c > 0) { lastCd = c; K.ev(st, 'cd'); }
          if (st.t <= 0) { st.ph = 'play'; K.ev(st, 'go'); }
          for (let s = 0; s < 2; s++) K.take(inputs[s] && inputs[s].q, seen, s, () => {});
        } else {
          st.time += dt;
          for (let s = 0; s < 2; s++) K.take(inputs[s] && inputs[s].q, seen, s, it => whack(s, it[0]));
          spawnStep(dt);
          if (st.time >= LEN) {
            st.over = true; st.ph = 'over'; K.ev(st, 'end');
            const w = st.s[0] === st.s[1] ? -1 : st.s[0] > st.s[1] ? 0 : 1;
            const acc = i => { const t = st.hit[i] + st.miss[i] + st.bomb[i]; return t ? Math.round(st.hit[i] / t * 100) + '%' : '—'; };
            ctx.end({winner: w, text: st.s[0] + ' : ' + st.s[1] + '　最高连击 ' + st.best[0] + ' / ' + st.best[1] + '　命中率 ' + acc(0) + ' / ' + acc(1)});
          }
        }
        playEv(); info();
      },
      snapshot() { return {ph: st.ph, t: Math.round(st.t * 100) / 100, time: Math.round(st.time * 100) / 100, m: st.m.map(m => [m.i, m.h, m.k, m.t0, m.d, m.hit[0], m.hit[1], m.dent[0], m.dent[1]]), s: st.s, cb: st.cb, best: st.best, ev: st.ev, over: st.over}; },
      restore(d) {
        const drift = d.time - st.time, keep = st.ph === 'play' && d.ph === 'play' && Math.abs(drift) < .2;
        Object.assign(st, {ph: d.ph, t: d.t, time: keep ? st.time + drift * .35 : d.time, s: d.s, cb: d.cb, best: d.best || st.best, ev: d.ev, over: d.over});   // ease the guest clock, no jumps
        st.m = d.m.map(a => ({i: a[0], h: a[1], k: a[2], t0: a[3], d: a[4], hit: [a[5], a[6]], dent: [a[7] || 0, a[8] || 0]}));
        playEv(); info();
      },
      key(e) {
        if (e.repeat || st.ph !== 'play') return;
        const ms = ctx.mySeats; if (!ms.length) return;
        if (e.code in K.QWE) hit(ms[0], K.QWE[e.code]);
        else if (e.code in K.NUMPAD || e.code in K.UIO) hit(ms.length > 1 ? ms[1] : ms[0], e.code in K.NUMPAD ? K.NUMPAD[e.code] : K.UIO[e.code]);
      },
      draw(dt) {
        time += dt; fx.update(dt); if (freeze > 0) freeze -= dt; else vt += dt;
        if (!ctx.isHost && st.ph === 'play') st.time += dt;
        // render clock: host interpolates within the fixed 60 Hz step (smooth rise on 90/120 Hz screens)
        if (freeze <= 0) rT = ctx.isHost && st.ph === 'play' ? Math.max(0, st.time - (1 - ctx.alpha) / 60) : st.time;
        if (pred.size || pops.size) { const ids = new Set(st.m.map(m => m.i)); for (const k of [...pred.keys()]) if (!ids.has(+k.split(':')[1].replace('d', ''))) pred.delete(k); for (const k of [...pops.keys()]) if (!ids.has(+k.split(':')[1])) pops.delete(k); }
        const g = cv.g; cv.clear('#2a190d');
        const [ox, oy] = fx.offset(); g.save(); g.translate(ox, oy);
        for (const f of fields()) drawField(g, f);
        g.restore();
        if (nLoc() === 2) { g.fillStyle = '#e6c57d'; if (cv.w >= cv.h) g.fillRect(cv.w / 2 - 1.5, 0, 3, cv.h); else g.fillRect(0, cv.h / 2 - 1.5, cv.w, 3); }
        // hammers
        for (let i = hamm.length - 1; i >= 0; i--) { const hm = hamm[i]; if (freeze <= 0) hm.t += dt; if (hm.t > .2) { hamm.splice(i, 1); continue; } drawHammer(g, hm); }
        fx.draw(g);
        fx.drawFlash(g, cv.w, cv.h);
      },
    };
    function drawHammer(g, hm) {
      const k = hm.t / .2, ang = k < .12 ? -.55 + k / .12 * .75 : .2 - Math.min(1, (k - .12) / .5) * .75;   // lands within ~1 frame of the tap
      g.save(); g.translate(hm.x, hm.y); if (hm.rot) g.rotate(Math.PI); g.translate(34, 40); g.rotate(ang);
      D.wood(g, -4, -70, 8, 78, {base: '#a8723d', seed: 3});
      g.fillStyle = '#b23a2b'; D.rr(g, -26, -92, 52, 30, 8); g.fill(); g.fillStyle = '#e6c57d'; g.fillRect(-26, -80, 52, 5); g.fillRect(-20, -92, 5, 30); g.fillRect(15, -92, 5, 30);
      g.restore();
    }
    function drawField(g, f) {
      const G = grid(f), s = f.seat;
      g.save(); g.translate(f.x, f.y); if (f.rot) { g.translate(f.w, f.h); g.rotate(Math.PI); }
      g.beginPath(); g.rect(0, 0, f.w, f.h); g.clip();
      // grass + bamboo fence
      const gr = g.createLinearGradient(0, 0, 0, f.h); gr.addColorStop(0, '#86c46e'); gr.addColorStop(1, '#4e8c44'); g.fillStyle = gr; g.fillRect(0, 0, f.w, f.h);
      g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 30; i++) { const x = (i * 97 % 100) / 100 * f.w, y = (i * 61 % 100) / 100 * f.h; g.beginPath(); g.ellipse(x, y, 8, 3, 0, 0, Math.PI * 2); g.fill(); }
      if (f.mini) { g.fillStyle = 'rgba(30,20,10,.25)'; g.fillRect(0, 0, f.w, f.h); }
      // header
      g.fillStyle = 'rgba(40,22,8,.78)'; g.fillRect(0, 0, f.w, G.head); g.fillStyle = ctx.color(s); g.fillRect(0, G.head - 3, f.w, 3);
      const fs = Math.min(G.head * .48, 20);
      D.text(g, ctx.name(s) + (f.mini ? '' : ctx.isLocal(s) && nLoc() === 1 ? '（你）' : ''), 10, G.head / 2, {size: fs * .8, color: '#fbe9d0', align: 'left', maxW: f.w * .4});
      D.text(g, st.s[s] + ' 分', f.w / 2, G.head / 2, {size: fs * 1.15, color: '#ffe08a', font: 'deco', weight: 400});
      if (f.mini && st.cb[s] >= 2) D.text(g, '连击 ×' + st.cb[s], f.w - 10, G.head / 2, {size: fs * .75, color: st.cb[s] >= 5 ? '#ff9a5a' : '#fbe9d0', align: 'right', weight: 800});
      else if (!f.mini) D.text(g, Math.max(0, Math.ceil(LEN - st.time)) + 's', f.w - 10, G.head / 2, {size: fs * .8, color: '#fbe9d0', align: 'right'});
      // timer bar
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, G.head, f.w, 4); g.fillStyle = LEN - st.time < 10 ? (LEN - st.time < 5 && Math.sin(time * 12) > 0 ? '#ff8a6a' : '#e0533f') : '#e6c57d'; g.fillRect(0, G.head, f.w * BX.clamp(1 - st.time / LEN, 0, 1), 4);
      // combo meter: 0→5 (+1 per mole) → 10 (+2, 火力全开)
      if (!f.mini) {
        const cb = st.cb[s], tier = cb >= 10 ? 2 : cb >= 5 ? 1 : 0, k = tier === 2 ? 1 : tier === 1 ? (cb - 5) / 5 : cb / 5, by = G.head + 5, bw = Math.min(f.w * .6, 260), bx = (f.w - bw) / 2;
        g.fillStyle = 'rgba(30,15,5,.45)'; D.rr(g, bx, by, bw, 10, 5); g.fill();
        g.fillStyle = ['#e6c57d', '#ff9a5a', Math.sin(time * 14) > 0 ? '#ff5a3a' : '#ffd76a'][tier]; D.rr(g, bx, by, Math.max(10, bw * k), 10, 5); g.fill();
        D.text(g, tier === 2 ? '火力全开 每只+2' : tier === 1 ? '连击 ×' + cb + ' · 每只+1' : cb ? '连击 ×' + cb : '连击条', f.w / 2, by + 20, {size: 11, color: tier ? '#ffe08a' : 'rgba(255,250,230,.75)', weight: 800, stroke: 'rgba(40,20,5,.6)'});
        if (tier === 2) { g.strokeStyle = `rgba(255,120,60,${.45 + .3 * Math.sin(time * 10)})`; g.lineWidth = 6; g.strokeRect(3, 3, f.w - 6, f.h - 6); }
      }
      // holes back halves, moles, front lips
      const keys = nLoc() === 2 ? (s === ctx.mySeats[0] ? 'QWEASDZXC' : '789456123') : 'QWEASDZXC';
      for (let h = 0; h < 9; h++) {
        const c = holeC(G, h), rw = G.cell * .36, rh = G.ch * .13;
        g.fillStyle = '#6b4426'; g.beginPath(); g.ellipse(c.x, c.y + rh * .3, rw * 1.18, rh * 1.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#24150a'; g.beginPath(); g.ellipse(c.x, c.y, rw, rh, 0, 0, Math.PI * 2); g.fill();
        const T = rT, m = st.m.find(m => m.h === h && T >= m.t0 && T < m.t0 + m.d + .35);
        if (m) {
          const key = s + ':' + m.i, pr = pred.get(key), hs = m.hit[s] || (pr ? (pr.k === 'b' ? 2 : 1) : 0), age = T - m.t0, left = m.t0 + m.d - T;
          let up = BX.ease.out(BX.clamp(Math.min(age / .09, Math.max(0, left) / .12), 0, 1));
          let sq = 1;
          if (hs) {                                                          // squash-pop: hold briefly, then sink
            const ht = pops.has(key) ? vt - pops.get(key) : 1, k = BX.clamp(ht / .16, 0, 1);
            sq = ht < .16 ? .62 + .3 * BX.ease.back(k) : .9;
            up = ht < .2 ? 1 : Math.max(0, 1 - (ht - .2) / .22) * .9;
            if (!pops.has(key)) up = Math.max(0, Math.min(1, (left + .35) / .35)) * .9;
          }
          if (up > 0) {
            g.save(); g.beginPath(); g.rect(c.x - G.cell / 2, c.y - G.ch * 1.2, G.cell, G.ch * 1.2); g.clip();
            mole(g, c.x, c.y + (1 - up) * G.ch * .55, rw * .9, m.k, 1, time, hs, f.mini, (m.dent && m.dent[s]) || pred.has(key + 'd'), sq);
            g.restore();
          }
        }
        g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(c.x, c.y + rh * .15, rw * 1.12, rh * 1.05, 0, 0, Math.PI); g.fill();
        g.strokeStyle = '#a8723d'; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y + rh * .15, rw * 1.12, rh * 1.05, 0, 0, Math.PI); g.stroke();
        if (!f.mini && ctx.isLocal(s) && (!BX.TOUCH.matches || !pads.touched)) D.text(g, keys[h], c.x + rw * 1.05, c.y + rh * 1.8, {size: 11, color: 'rgba(255,250,230,.65)', weight: 800});
      }
      if (!f.mini) {
        const m = Math.min(f.w, f.h);
        if (st.ph === 'intro') {
          K.banner(g, String(Math.max(1, Math.ceil(st.t))), f.w / 2, f.h / 2, m * .3, 1 - (st.t % 1));
          const L = [['n', '+1'], ['g', '+3'], ['b', '−3 别敲'], ...(HEL ? [['h', '敲两下 +2']] : [])], lw = Math.min(f.w / L.length, 120), ly = f.h - Math.min(f.h * .12, 60), r = Math.min(lw * .16, 16);
          g.fillStyle = 'rgba(30,15,5,.55)'; D.rr(g, f.w / 2 - lw * L.length / 2, ly - r * 2.8, lw * L.length, r * 4.4, 10); g.fill();
          L.forEach(([k2, t2], i) => { const x = f.w / 2 + (i - (L.length - 1) / 2) * lw; mole(g, x - r * 1.9, ly + r * .4, r, k2, 1, time, 0, true); D.text(g, t2, x - r * .5, ly - r * .4, {size: Math.min(14, lw * .13), maxW: lw * .62, color: k2 === 'b' ? '#ff9a8a' : '#ffe08a', weight: 800, align: 'left'}); });
        }
        else if (st.ph === 'play' && st.time < .8) K.banner(g, '开敲！', f.w / 2, f.h / 2, m * .2, st.time / .8, {color: '#ffe08a'});
        else if (st.ph === 'over') K.banner(g, '时间到', f.w / 2, f.h / 2, m * .18, 1, {color: '#ffe08a'});
      }
      g.restore();
    }
    info();
    return inst;
  },
});

/* mole sprite: x,y = base point at hole centre, r = body radius; k: n/g/b; hs: 1 whacked, 2 bomb-hit */
function mole(g, x, y, r, k, a, time, hs, mini, dent, squash) {
  g.save(); g.globalAlpha = a;
  const sq = squash != null ? squash : hs ? .78 : 1;
  g.translate(x, y); g.scale(1 / Math.sqrt(sq), sq);
  if (k === 'b') {
    const gr = g.createRadialGradient(-r * .3, -r * 1.3, r * .1, 0, -r, r * 1.1); gr.addColorStop(0, '#666'); gr.addColorStop(1, '#151515');
    g.fillStyle = gr; D.circle(g, 0, -r, r); g.fill(); g.fillRect(-r, -r, r * 2, r * 1.2);
    g.fillStyle = '#444'; g.fillRect(-r * .2, -r * 2.1, r * .4, r * .2);
    g.strokeStyle = '#c8a052'; g.lineWidth = r * .1; g.beginPath(); g.moveTo(0, -r * 2.05); g.quadraticCurveTo(r * .3, -r * 2.5, r * .5, -r * 2.35); g.stroke();
    if (!hs) { const fl = .7 + Math.sin(time * 30) * .3; g.fillStyle = '#ffb030'; D.circle(g, r * .5, -r * 2.35, r * .18 * fl); g.fill(); g.fillStyle = '#fff6a0'; D.circle(g, r * .5, -r * 2.35, r * .08); g.fill(); }
    // angry face
    g.strokeStyle = '#ff5a3a'; g.lineWidth = r * .1;
    g.beginPath(); g.moveTo(-r * .55, -r * 1.25); g.lineTo(-r * .2, -r * 1.08); g.moveTo(r * .55, -r * 1.25); g.lineTo(r * .2, -r * 1.08); g.stroke();
    g.fillStyle = '#ff5a3a'; D.circle(g, -r * .35, -r * .95, r * .1); g.fill(); D.circle(g, r * .35, -r * .95, r * .1); g.fill();
    g.strokeStyle = '#ddd'; g.lineWidth = r * .07; g.beginPath(); g.arc(0, -r * .55, r * .25, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    D.text(g, '炸', 0, -r * .2, {size: r * .5, color: '#ff8a5a', font: 'deco', weight: 400});
  } else {
    const gold = k === 'g';
    const body = gold ? '#e6b030' : '#8a5a34', belly = gold ? '#fff0b0' : '#d9b48a';
    if (gold && !hs) { const gl = g.createRadialGradient(0, -r, r * .3, 0, -r, r * 2.2); gl.addColorStop(0, 'rgba(255,230,120,.6)'); gl.addColorStop(1, 'rgba(255,230,120,0)'); g.fillStyle = gl; D.circle(g, 0, -r, r * 2.2); g.fill(); }
    const gr = g.createLinearGradient(-r, 0, r, 0); gr.addColorStop(0, D.shade(body, 15)); gr.addColorStop(1, D.shade(body, -20));
    g.fillStyle = gr; g.beginPath(); g.moveTo(-r, r * .2); g.lineTo(-r, -r); g.arc(0, -r, r, Math.PI, 0); g.lineTo(r, r * .2); g.fill();
    g.fillStyle = belly; g.beginPath(); g.ellipse(0, -r * .2, r * .62, r * .7, 0, 0, Math.PI * 2); g.fill();
    // little scholar cap (tea-house flavour)
    if (k !== 'h') { g.fillStyle = gold ? '#b23a2b' : '#2b2118'; g.beginPath(); g.ellipse(0, -r * 1.85, r * .62, r * .2, 0, 0, Math.PI * 2); g.fill(); D.rr(g, -r * .38, -r * 2.25, r * .76, r * .42, r * .12); g.fill(); }
    else if (!dent) { const hg = g.createLinearGradient(-r, 0, r, 0); hg.addColorStop(0, '#d8dde3'); hg.addColorStop(1, '#7d8690'); g.fillStyle = hg; g.beginPath(); g.arc(0, -r * 1.25, r * 1.02, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fill(); g.fillStyle = '#5d646c'; g.fillRect(-r * 1.1, -r * 1.3, r * 2.2, r * .16); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-r * .5, -r * 2.05, r * .25, r * .5); }
    else { g.save(); g.translate(r * .7, -r * 2.1); g.rotate(.6); g.fillStyle = '#8d959e'; g.beginPath(); g.arc(0, 0, r * .5, Math.PI, 0); g.fill(); g.restore(); }
    if (gold) { g.fillStyle = '#ffd76a'; D.circle(g, 0, -r * 2.05, r * .1); g.fill(); }
    if (hs) {
      g.strokeStyle = '#2b2118'; g.lineWidth = r * .1;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * r * .45, -r * 1.2); g.lineTo(sx * r * .2, -r * .98); g.moveTo(sx * r * .2, -r * 1.2); g.lineTo(sx * r * .45, -r * .98); g.stroke(); }
      if (!mini) for (let i = 0; i < 3; i++) { const a = time * 6 + i * 2.1; D.text(g, '★', Math.cos(a) * r * .9, -r * 2.2 + Math.sin(a) * r * .25, {size: r * .4, color: '#ffd76a'}); }
    } else {
      g.fillStyle = '#1b1510'; D.circle(g, -r * .33, -r * 1.08, r * .13); g.fill(); D.circle(g, r * .33, -r * 1.08, r * .13); g.fill();
      g.fillStyle = '#fff'; D.circle(g, -r * .29, -r * 1.13, r * .05); g.fill(); D.circle(g, r * .37, -r * 1.13, r * .05); g.fill();
    }
    g.fillStyle = '#e07a7a'; g.beginPath(); g.ellipse(-r * .55, -r * .82, r * .14, r * .08, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(r * .55, -r * .82, r * .14, r * .08, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c0605a'; g.beginPath(); g.ellipse(0, -r * .82, r * .16, r * .11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.fillRect(-r * .1, -r * .7, r * .2, r * .16);
    g.strokeStyle = 'rgba(40,20,10,.6)'; g.lineWidth = r * .03; for (const sx of [-1, 1]) for (const dy of [-.05, .05]) { g.beginPath(); g.moveTo(sx * r * .25, -r * .8); g.lineTo(sx * r * .7, -r * (.8 + dy * 3)); g.stroke(); }
    g.fillStyle = '#f0b0a0'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * .55, -r * .1, r * .18, r * .12, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}
