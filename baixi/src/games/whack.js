/* 打地鼠 — realtime split-screen race on identical spawn schedules */
const D = BX.draw, C = BX.C, K = BX.data.spk;

BX.register({
  id: 'whack', title: '打地鼠', cat: 'speed', order: 2, sub: '同一批地鼠，看谁敲得多',
  desc: '两人各有一块九宫格地鼠田，冒出来的地鼠完全相同，比谁手快。金地鼠加 3 分，炸弹鼠扣 3 分千万别敲，连击还有额外奖励。',
  kind: 'realtime', seats: 2, noFirst: true, seatColors: ['#c23a2b', '#2f5d8a'],
  options: [{key: 'len', label: '时长', choices: [[30, '30 秒'], [45, '45 秒'], [60, '60 秒']], def: 45}],
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
    const LEN = BX.test ? 12 : (ctx.opts.len || 45);
    const st = {ph: 'intro', t: 3, time: 0, m: [], mid: 0, s: [0, 0], cb: [0, 0], best: [0, 0], ev: [], evId: 0, over: false, nextT: 0};
    // m: [{i id, h hole, k 'n'|'g'|'b', t0, d, hit:[0|1|2,0|1|2]}]  hit: 0 up, 1 whacked, 2 bomb-hit
    const cv = ctx.canvas(), fx = K.fx(), pads = K.pads(ctx, cv);
    const queues = [K.tq(), K.tq()], seen = {}, evSeen = {v: -1};
    const hamm = [];       // local visual hammer swings {x,y,t}
    let time = 0, lastCd = 4;
    const aiSeen = [{}, {}];

    function spawnStep(dt) {
      st.nextT -= dt;
      const prog = st.time / LEN;
      const live = st.m.filter(m => st.time < m.t0 + m.d).length;
      if (st.nextT <= 0 && live < 2 + Math.floor(prog * 2.5)) {
        const busy = new Set(st.m.filter(m => st.time < m.t0 + m.d + .15).map(m => m.h));
        const free = BX.range(9).filter(h => !busy.has(h));
        if (free.length) {
          const r = Math.random(), k = r < .1 ? 'g' : r < .1 + .1 + prog * .1 ? 'b' : 'n';
          const d = (k === 'g' ? .75 : k === 'b' ? 1.5 : 1.15) * (1 - prog * .35);
          st.m.push({i: ++st.mid, h: BX.pick(free), k, t0: Math.round(st.time * 100) / 100, d: Math.round(d * 100) / 100, hit: [0, 0]});
        }
        st.nextT = (.62 - prog * .3) * (.6 + Math.random() * .8);
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
      if (!m) { if (st.cb[s]) { st.cb[s] = 0; } K.ev(st, 'air', s, h); return; }
      if (m.k === 'b') { m.hit[s] = 2; st.s[s] -= 3; st.cb[s] = 0; K.ev(st, 'bomb', s, h); return; }
      m.hit[s] = 1; st.cb[s]++; st.best[s] = Math.max(st.best[s], st.cb[s]);
      const pts = (m.k === 'g' ? 3 : 1) + (st.cb[s] >= 10 ? 2 : st.cb[s] >= 5 ? 1 : 0);
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
        const l = toLocal(f, p), G = grid(f);
        const cx = Math.floor((l.x - G.x) / G.cell), cy = Math.floor((l.y - G.y) / G.ch);
        if (cx < 0 || cx > 2 || cy < 0 || cy > 2) continue;
        hit(f.seat, cy * 3 + cx, p);
      }
    });
    function hit(seat, h, scr) {
      queues[seat].push(h); ctx.sfx('swish');
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
        if (plan[m.i] !== 'x' && st.time >= plan[m.i]) { plan[m.i] = 'x'; q.push(m.h); }
      }
      return {q: q.list()};
    }
    function info() {
      ctx.info(0, st.s[0] + ' 分'); ctx.info(1, st.s[1] + ' 分');
      ctx.status(st.ph === 'intro' ? '准备…' : st.over ? '时间到' : '剩余 ' + Math.max(0, Math.ceil(LEN - st.time)) + ' 秒');
    }
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const k = e[0];
        if (k === 'cd') ctx.sfx('tick'); else if (k === 'go') { ctx.sfx('gong'); fx.flash(.5); }
        else if (k === 'end') { ctx.sfx('bell'); fx.flash(.7); }
        else {
          const s = e[2], h = e[3], f = fields().find(f => f.seat === s); if (!f) return;
          const G = grid(f), p = toScreen(f, holeC(G, h)), up = toScreen(f, {x: holeC(G, h).x, y: holeC(G, h).y - G.ch * .35}), sc = f.mini ? .5 : 1;
          if (k === 'hit') {
            ctx.sfx(e[4] === 'g' ? 'coin' : 'hit'); if (!f.mini) fx.shake(e[4] === 'g' ? 6 : 3);
            fx.burst(up.x, up.y, {n: e[4] === 'g' ? 26 : 12, color: e[4] === 'g' ? ['#ffd76a', '#fff3b0', '#e6a020'] : ['#ffd76a', '#fff'], sp: 220 * sc, size: 4 * sc, up: 60});
            fx.text(up.x, up.y - 10 * sc, '+' + e[5], {size: (e[4] === 'g' ? 34 : 26) * sc, color: e[4] === 'g' ? '#ffd76a' : '#fff'});
            if (e[6] >= 5 && e[6] % 5 === 0 && !f.mini) { ctx.sfx('score'); fx.text(p.x, toScreen(f, {x: 0, y: G.y + G.ch * .2}).y, e[6] + ' 连击！', {size: 30, color: '#ff9a5a', life: 1.2}); }
            if (ctx.isLocal(s) && !f.mini && e[4] === 'g') fx.flash(.4, '255,220,120');
          } else if (k === 'bomb') {
            ctx.sfx('boom'); if (!f.mini) { fx.shake(14); fx.flash(.9, '255,90,60'); }
            fx.burst(up.x, up.y, {n: 34, color: ['#ff6a3a', '#ffd76a', '#333', '#888'], sp: 300 * sc, size: 6 * sc, grav: 120});
            fx.text(up.x, up.y, '−3', {size: 34 * sc, color: '#ff6a5a'});
          } else if (k === 'air' && ctx.isLocal(s) && !f.mini) { ctx.sfx('move'); fx.burst(p.x, p.y - G.ch * .1, {n: 6, color: '#8a5a2a', sp: 90, size: 3}); }
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
            ctx.end({winner: w, text: st.s[0] + ' : ' + st.s[1] + '　（最高连击 ' + st.best[0] + ' / ' + st.best[1] + '）'});
          }
        }
        playEv(); info();
      },
      snapshot() { return {ph: st.ph, t: Math.round(st.t * 100) / 100, time: Math.round(st.time * 100) / 100, m: st.m.map(m => [m.i, m.h, m.k, m.t0, m.d, m.hit[0], m.hit[1]]), s: st.s, cb: st.cb, ev: st.ev, over: st.over}; },
      restore(d) {
        Object.assign(st, {ph: d.ph, t: d.t, time: d.time, s: d.s, cb: d.cb, ev: d.ev, over: d.over});
        st.m = d.m.map(a => ({i: a[0], h: a[1], k: a[2], t0: a[3], d: a[4], hit: [a[5], a[6]]}));
        playEv(); info();
      },
      key(e) {
        if (e.repeat || st.ph !== 'play') return;
        const ms = ctx.mySeats; if (!ms.length) return;
        if (e.code in K.QWE) hit(ms[0], K.QWE[e.code]);
        else if (e.code in K.NUMPAD || e.code in K.UIO) hit(ms.length > 1 ? ms[1] : ms[0], e.code in K.NUMPAD ? K.NUMPAD[e.code] : K.UIO[e.code]);
      },
      draw(dt) {
        time += dt; fx.update(dt);
        if (!ctx.isHost && st.ph === 'play') st.time += dt;
        const g = cv.g; cv.clear('#2a190d');
        const [ox, oy] = fx.offset(); g.save(); g.translate(ox, oy);
        for (const f of fields()) drawField(g, f);
        g.restore();
        if (nLoc() === 2) { g.fillStyle = '#e6c57d'; if (cv.w >= cv.h) g.fillRect(cv.w / 2 - 1.5, 0, 3, cv.h); else g.fillRect(0, cv.h / 2 - 1.5, cv.w, 3); }
        // hammers
        for (let i = hamm.length - 1; i >= 0; i--) { const hm = hamm[i]; hm.t += dt; if (hm.t > .22) { hamm.splice(i, 1); continue; } drawHammer(g, hm); }
        fx.draw(g);
        fx.drawFlash(g, cv.w, cv.h);
      },
    };
    function drawHammer(g, hm) {
      const k = hm.t / .22, ang = k < .45 ? -1.1 + k / .45 * 1.3 : .2 - (k - .45) * .4;
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
      if (st.cb[s] >= 2) D.text(g, '连击 ×' + st.cb[s], f.w - 10, G.head / 2, {size: fs * .75, color: st.cb[s] >= 5 ? '#ff9a5a' : '#fbe9d0', align: 'right', weight: 800});
      else if (!f.mini) D.text(g, Math.max(0, Math.ceil(LEN - st.time)) + 's', f.w - 10, G.head / 2, {size: fs * .8, color: '#fbe9d0', align: 'right'});
      // timer bar
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, G.head, f.w, 4); g.fillStyle = LEN - st.time < 10 ? '#e0533f' : '#e6c57d'; g.fillRect(0, G.head, f.w * BX.clamp(1 - st.time / LEN, 0, 1), 4);
      // holes back halves, moles, front lips
      const keys = nLoc() === 2 ? (s === ctx.mySeats[0] ? 'QWEASDZXC' : '789456123') : 'QWEASDZXC';
      for (let h = 0; h < 9; h++) {
        const c = holeC(G, h), rw = G.cell * .36, rh = G.ch * .13;
        g.fillStyle = '#6b4426'; g.beginPath(); g.ellipse(c.x, c.y + rh * .3, rw * 1.18, rh * 1.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#24150a'; g.beginPath(); g.ellipse(c.x, c.y, rw, rh, 0, 0, Math.PI * 2); g.fill();
        const m = st.m.find(m => m.h === h && st.time >= m.t0 && st.time < m.t0 + m.d + .35);
        if (m) {
          const age = st.time - m.t0, left = m.t0 + m.d - st.time, hs = m.hit[s];
          let up = Math.min(1, age / .1, Math.max(0, left) / .12);
          if (hs) up = Math.max(0, Math.min(1, (left + .35) / .35)) * .9;
          if (up > 0) {
            g.save(); g.beginPath(); g.rect(c.x - G.cell / 2, c.y - G.ch * 1.2, G.cell, G.ch * 1.2); g.clip();
            mole(g, c.x, c.y + (1 - up) * G.ch * .55, rw * .9, m.k, 1, time, hs, f.mini);
            g.restore();
          }
        }
        g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(c.x, c.y + rh * .15, rw * 1.12, rh * 1.05, 0, 0, Math.PI); g.fill();
        g.strokeStyle = '#a8723d'; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y + rh * .15, rw * 1.12, rh * 1.05, 0, 0, Math.PI); g.stroke();
        if (!f.mini && ctx.isLocal(s) && (!BX.TOUCH.matches || !pads.touched)) D.text(g, keys[h], c.x + rw * 1.05, c.y + rh * 1.8, {size: 11, color: 'rgba(255,250,230,.65)', weight: 800});
      }
      if (!f.mini) {
        const m = Math.min(f.w, f.h);
        if (st.ph === 'intro') K.banner(g, String(Math.max(1, Math.ceil(st.t))), f.w / 2, f.h / 2, m * .3, 1 - (st.t % 1));
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
function mole(g, x, y, r, k, a, time, hs, mini) {
  g.save(); g.globalAlpha = a;
  const sq = hs ? .78 : 1;
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
    g.fillStyle = gold ? '#b23a2b' : '#2b2118'; g.beginPath(); g.ellipse(0, -r * 1.85, r * .62, r * .2, 0, 0, Math.PI * 2); g.fill(); D.rr(g, -r * .38, -r * 2.25, r * .76, r * .42, r * .12); g.fill();
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
