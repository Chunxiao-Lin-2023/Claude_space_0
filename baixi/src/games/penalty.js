/* 点球大战 — simultaneous secret choice turn game */
const D = BX.draw, C = BX.C, K = BX.data.spk;
const COLU = [.17, .5, .83], ROWV = [.8, .5, .17];          // zone centres in goal space (u: 0 left..1 right, v: 0 ground..1 bar)
const ROWN = ['高', '中', '低'], COLN = ['左', '中', '右'], POWN = ['轻推', '标准', '大力'];
const MISS = [[0, 0, 0], [.1, .02, 0], [.33, .12, .04]];      // [power][row] over-the-bar / wide chance
const SIDE = [0, .03, .07];                                  // extra miss chance for side columns
const SAVE = [1, .92, .55];                                  // save chance when keeper covers the zone
function covers(kc, kh, c, r) { return kc === c && (r === 1 || (r === 0 && kh === 0) || (r === 2 && kh === 1)); }
function saveProb(kc, kh, c, r, p) {
  if (covers(kc, kh, c, r)) return SAVE[p];
  if (p === 0 && Math.abs(kc - c) === 1 && (r === 1 || (r === 0 && kh === 0) || (r === 2 && kh === 1))) return .4;
  return 0;
}
const missProb = (c, r, p) => MISS[p][r] + (c !== 1 ? SIDE[p] : 0);

BX.register({
  id: 'penalty', title: '点球大战', cat: 'sports', order: 1, sub: '五轮点球，斗智斗勇',
  desc: '每一脚点球都是一次心理博弈：罚球者暗中选择角度与力度，守门员暗中选择扑救方向，同时揭晓。五轮定胜负，平局进入突然死亡。',
  kind: 'turn', seats: 2, hidden: true, firstLabel: '先罚', seatColors: ['#c23a2b', '#2f5d8a'], aiDelay: 650,
  rules: `<p>双方轮流罚点球，<b>各罚 5 球</b>，进球多者胜；若一方已无法追平则提前结束。5 轮后仍平局，进入<b>突然死亡</b>：每轮各罚一球，一方进而另一方不进即分胜负。</p>
<p>每一脚都是<b>同时暗选</b>：</p>
<ul><li><b>罚球者</b>在球门的 3×3 区域（高/中/低 × 左/中/右）中选目标，并选力度：<b>轻推</b>不会打偏但守门员扑向相邻一侧也可能够到；<b>标准</b>略有打高风险；<b>大力</b>即使被猜中也难扑，但瞄高位时很容易打飞或打偏。</li>
<li><b>守门员</b>选择扑救方向（左/中/右）和高度（高/低）。猜中方向且高度覆盖（高覆盖高与中、低覆盖中与低）即可能扑出。</li></ul>
<p>双方都选好后揭晓：射门、扑救、进球或打飞。下方圆点为比分记录：绿色为进球，红色为未进。</p>
<p>操作：点选球门区域，再点「射门」/「扑救」。键盘：小键盘 1–9 选区域（7 为左上），Q/W/E 选力度，回车确认。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a3418'); gr.addColorStop(.42, '#7a4a24'); gr.addColorStop(.42, '#58a35a'); gr.addColorStop(1, '#3e8a48'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) K.lantern(g, 25 + i * 50, 14, 7, '#d23a26', .4);
    const gx = w * .14, gy = h * .2, gw = w * .72, gh = h * .4;
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(gx + gw * i / 12, gy); g.lineTo(gx + gw * i / 12, gy + gh); g.stroke(); } for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(gx, gy + gh * i / 5); g.lineTo(gx + gw, gy + gh * i / 5); g.stroke(); }
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.moveTo(gx, gy + gh); g.lineTo(gx, gy); g.lineTo(gx + gw, gy); g.lineTo(gx + gw, gy + gh); g.stroke();
    g.save(); g.translate(w * .32, h * .38); g.rotate(-.9); g.fillStyle = '#2f5d8a'; D.rr(g, -9, -18, 18, 34, 6); g.fill(); g.fillStyle = '#f0c89a'; D.circle(g, 0, -25, 7); g.fill(); g.fillStyle = '#e6c57d'; D.circle(g, -10, -30, 5); g.fill(); D.circle(g, 10, -30, 5); g.fill(); g.restore();
    D.disc(g, w * .7, h * .32, 9, '#fffaf0', {ring: '#2b2118'});
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.setLineDash([4, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(w * .5, h * .9); g.quadraticCurveTo(w * .66, h * .55, w * .7, h * .36); g.stroke(); g.setLineDash([]);
  },
  create(ctx) {
    const st = {first: 0, k: 0, res: [[], []], ph: 'choose', pk: null, pg: null, last: null, hist: [{z: [0, 0, 0, 0, 0, 0, 0, 0, 0], n: 0}, {c: [0, 0, 0], h: [0, 0], n: 0}, {z: [0, 0, 0, 0, 0, 0, 0, 0, 0], n: 0}, {c: [0, 0, 0], h: [0, 0], n: 0}], over: false, win: -1};
    // hist[seat*2] = that seat's kicking history, hist[seat*2+1] = its keeping history
    const cv = ctx.canvas(), fx = K.fx();
    const shooter = () => (st.k % 2 === 0) ? st.first : 1 - st.first;
    const keeper = () => 1 - shooter();
    let sel = {z: -1, p: 1, d: -1};
    let rv = null;          // reveal animation {t, last}
    let crowd = null;

    function goalsOf(s) { return st.res[s].reduce((a, b) => a + b, 0); }
    function decide() {
      const a = st.res[0].length, b = st.res[1].length, ga = goalsOf(0), gb = goalsOf(1);
      if (a <= 5 && b <= 5) {
        const ra = 5 - a, rb = 5 - b;
        if (ga > gb + rb) return 0; if (gb > ga + ra) return 1;
        if (a === 5 && b === 5 && ga !== gb) return ga > gb ? 0 : 1;
        return -1;
      }
      if (a === b && ga !== gb) return ga > gb ? 0 : 1;
      return -1;
    }
    function status() {
      ctx.info(0, goalsOf(0) + ' 球'); ctx.info(1, goalsOf(1) + ' 球');
      if (st.over) return ctx.status(ctx.name(st.win) + ' 赢得点球大战！');
      const sd = st.res[0].length >= 5 && st.res[1].length >= 5 && st.k >= 10;
      const pre = sd ? '突然死亡 · ' : '第 ' + (Math.floor(st.k / 2) + 1) + ' 轮 · ';
      if (st.ph === 'reveal') return ctx.status(pre + resText(st.last.res));
      const me = ctx.view, sh = shooter(), kp = keeper();
      if (ctx.canAct(sh) && (!ctx.canAct(kp) || me === sh)) ctx.status(pre + (ctx.hotseat ? ctx.name(sh) + ' 罚球：' : '你来罚球：') + '选角度和力度');
      else if (ctx.canAct(kp)) ctx.status(pre + (ctx.hotseat ? ctx.name(kp) + ' 守门：' : '你来守门：') + '选扑救方向');
      else ctx.status(pre + '等待对方做出选择…');
    }
    const resText = r => ({goal: '球进了！', save: '被扑出！', over: '打飞了！', wide: '偏出了！', post: '击中门柱！'}[r] || '');

    function startReveal() {
      sel = {z: -1, p: 1, d: -1};
      if (ctx.fast) { rv = null; return; }
      fx.clear();
      rv = {t: 0, last: st.last, jx: (Math.random() - .5) * .06, jy: (Math.random() - .5) * .06, done: false};
      const L = st.last;
      ctx.sfx('whoosh');
      ctx.anim(1900, (k, raw) => { rv.t = raw; }, null, t => t);
      ctx.after(560, () => ctx.sfx('hit'));
      ctx.after(1130, () => {
        const P = layout(), gp = goalPt(P, L);
        if (L.res === 'goal') { ctx.sfx('score'); ctx.sfx('splash'); fx.flash(1); fx.shake(8); fx.burst(gp.x, gp.y, {n: 40, color: ['#ffd76a', '#ff8a5a', '#fff', '#5aa08a'], sp: 320, up: 120, square: true, grav: 260, life: 1.2}); fx.text(P.S.x + P.S.w / 2, P.goal.y + P.goal.h * .45, '球进了！', {size: BX.clamp(P.goal.h * .26, 28, 54), color: '#ffe08a', life: 1.4, vy: -20}); }
        else if (L.res === 'save') { ctx.sfx('hit'); ctx.sfx('crash'); fx.shake(6); fx.burst(gp.x, gp.y, {n: 18, color: ['#fff', '#cfe0ff'], sp: 220}); fx.text(P.S.x + P.S.w / 2, P.goal.y + P.goal.h * .45, '扑出！', {size: BX.clamp(P.goal.h * .26, 28, 54), color: '#cfe0ff', life: 1.4, vy: -20}); }
        else if (L.res === 'post') { ctx.sfx('bell'); fx.shake(5); fx.burst(gp.x, gp.y, {n: 12, color: '#fff', sp: 160}); fx.text(P.S.x + P.S.w / 2, P.goal.y + P.goal.h * .45, '中柱！', {size: BX.clamp(P.goal.h * .24, 26, 50), color: '#ffd0a0', life: 1.4, vy: -20}); }
        else { ctx.sfx('lose'); fx.text(P.S.x + P.S.w / 2, P.goal.y + P.goal.h * .45, L.res === 'over' ? '打飞了！' : '偏出了！', {size: BX.clamp(P.goal.h * .24, 26, 50), color: '#ffd0a0', life: 1.4, vy: -20}); }
      });
    }

    const inst = {
      st,
      toMove() {
        if (st.over || st.ph !== 'choose') return null;
        const t = []; if (!st.pk) t.push(shooter()); if (!st.pg) t.push(keeper()); return t;
      },
      valid(a, by) {
        if (st.ph !== 'choose') return false;
        if (a.t === 'kick') return by === shooter() && !st.pk && Number.isInteger(a.z) && a.z >= 0 && a.z < 9 && [0, 1, 2].includes(a.p);
        if (a.t === 'dive') return by === keeper() && !st.pg && Number.isInteger(a.z) && a.z >= 0 && a.z < 6;
        return false;
      },
      sysMove() { return st.ph === 'reveal' && !st.over ? {a: {t: 'next'}, delay: 2900} : null; },
      apply(a, by) {
        if (a.t === 'kick') { st.pk = {z: a.z, p: a.p}; ctx.sfx('click'); }
        else if (a.t === 'dive') { st.pg = {z: a.z}; ctx.sfx('click'); }
        else if (a.t === 'next') { st.ph = 'choose'; st.last = null; ctx.sfx('tick'); status(); return; }
        if (!(st.pk && st.pg)) { status(); return; }
        // ---- reveal: resolve the kick ----
        const sh = shooter(), kp = keeper(), z = st.pk.z, c = z % 3, r = Math.floor(z / 3), p = st.pk.p, kc = st.pg.z >> 1, kh = st.pg.z & 1;
        let res;
        const mp = missProb(c, r, p), roll = ctx.rng(), roll2 = ctx.rng(), roll3 = ctx.rng();
        if (roll < mp) res = r === 0 && roll2 < .7 ? 'over' : c !== 1 && roll2 < .85 ? 'post' : (r === 0 ? 'over' : 'wide');
        else res = roll3 < saveProb(kc, kh, c, r, p) ? 'save' : 'goal';
        st.res[sh].push(res === 'goal' ? 1 : 0);
        const hk = st.hist[sh * 2], hg = st.hist[kp * 2 + 1]; hk.z[z]++; hk.n++; hg.c[kc]++; hg.h[kh]++; hg.n++;
        st.last = {z, p, d: st.pg.z, res, sh, n: st.k};
        st.k++; st.pk = null; st.pg = null; st.ph = 'reveal';
        startReveal();
        const w = decide();
        if (w >= 0) { st.over = true; st.win = w; status(); ctx.end({winner: w, text: goalsOf(0) + ' : ' + goalsOf(1), delay: 2600}); return; }
        status();
      },
      aiMove(seat, level) {
        const rnd = Math.random;
        if (seat === shooter() && !st.pk) {
          if (level === 1) return {t: 'kick', z: Math.floor(rnd() * 9), p: Math.floor(rnd() * 3)};
          const opp = st.hist[keeper() * 2 + 1];
          const pc = level === 3 ? [0, 1, 2].map(i => (opp.c[i] + 1) / (opp.n + 3)) : [1 / 3, 1 / 3, 1 / 3];
          const ph = level === 3 ? [0, 1].map(i => (opp.h[i] + 1) / (opp.n + 2)) : [.5, .5];
          const cand = [];
          for (let z = 0; z < 9; z++) for (let p = 0; p < 3; p++) {
            const c = z % 3, r = Math.floor(z / 3); let sv = 0;
            for (let kc = 0; kc < 3; kc++) for (let kh = 0; kh < 2; kh++) sv += pc[kc] * ph[kh] * saveProb(kc, kh, c, r, p);
            cand.push([{t: 'kick', z, p}, (1 - missProb(c, r, p)) * (1 - sv)]);
          }
          const temp = level === 3 ? 14 : 6;
          return softPick(cand, temp);
        }
        // keeper
        if (level === 1) return {t: 'dive', z: Math.floor(rnd() * 6)};
        const opp = st.hist[shooter() * 2];
        const pz = BX.range(9).map(z => level === 3 ? (opp.z[z] + .7) / (opp.n + 6.3) : 1 / 9);
        const cand = [];
        for (let d = 0; d < 6; d++) { let ev = 0; for (let z = 0; z < 9; z++) ev += pz[z] * saveProb(d >> 1, d & 1, z % 3, Math.floor(z / 3), 1); cand.push([{t: 'dive', z: d}, ev]); }
        return softPick(cand, level === 3 ? 16 : 4);
      },
      onTurn: status,
      ready() { status(); },
      key(e) {
        const role = myRole(); if (!role) return;
        const nm = {Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8, Digit7: 0, Digit8: 1, Digit9: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit1: 6, Digit2: 7, Digit3: 8};
        if (e.code in nm) { const z = nm[e.code]; if (role === 'k') sel.z = z; else sel.d = (z % 3) * 2 + (z >= 6 ? 1 : 0); ctx.sfx('select'); }
        else if (role === 'k' && ['KeyQ', 'KeyW', 'KeyE'].includes(e.code)) { sel.p = ['KeyQ', 'KeyW', 'KeyE'].indexOf(e.code); ctx.sfx('click'); }
        else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') confirm(role);
      },
      frame(dt) { draw(dt); },
    };
    function softPick(cand, temp) {
      const mx = Math.max(...cand.map(c => c[1])); let tot = 0; const w = cand.map(c => { const v = Math.exp((c[1] - mx) * temp); tot += v; return v; });
      let r = Math.random() * tot; for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) return cand[i][0]; } return cand[cand.length - 1][0];
    }
    function confirm(role) {
      if (role === 'k' && sel.z >= 0 && ctx.canAct(shooter())) { const a = {t: 'kick', z: sel.z, p: sel.p}; sel = {z: -1, p: 1, d: -1}; ctx.act(a, shooter()); }
      else if (role === 'g' && sel.d >= 0 && ctx.canAct(keeper())) { const a = {t: 'dive', z: sel.d}; sel = {z: -1, p: 1, d: -1}; ctx.act(a, keeper()); }
      else ctx.sfx('error');
    }
    const myRole = () => { if (st.over || st.ph !== 'choose') return null; const sh = shooter(), kp = keeper(); if (ctx.canAct(sh) && !st.pk && (!ctx.canAct(kp) || ctx.view === sh || st.pg)) return 'k'; if (ctx.canAct(kp) && !st.pg) return 'g'; return null; };

    /* ---------------- layout ---------------- */
    function layout() {
      const W = cv.w, H = cv.h, sbH = BX.clamp(H * .1, 52, 74);
      let S, P;
      if (W > H * 1.25) { const cw = BX.clamp(W * .26, 176, 290); S = {x: 0, y: sbH, w: W - cw, h: H - sbH}; P = {x: W - cw, y: sbH, w: cw, h: H - sbH, side: true}; }
      else { const ch = BX.clamp(H * .22, 140, 190); S = {x: 0, y: sbH, w: W, h: H - sbH - ch}; P = {x: 0, y: H - ch, w: W, h: ch, side: false}; }
      const port = S.h > S.w, gw = Math.min(S.w * (port ? .94 : .86), S.h * 1.55), gh = gw * (port ? .5 : .38);
      const goal = {x: S.x + (S.w - gw) / 2, y: S.y + S.h * (port ? .2 : .14), w: gw, h: gh};
      const spot = {x: S.x + S.w / 2, y: S.y + S.h * .87};
      return {W, H, sbH, S, P, goal, spot};
    }
    const zoneRect = (P, z) => ({x: P.goal.x + P.goal.w * (z % 3) / 3, y: P.goal.y + P.goal.h * Math.floor(z / 3) / 3, w: P.goal.w / 3, h: P.goal.h / 3});
    const diveRect = (P, d) => ({x: P.goal.x + P.goal.w * (d >> 1) / 3, y: P.goal.y + P.goal.h * (d & 1) / 2, w: P.goal.w / 3, h: P.goal.h / 2});
    function goalPt(P, L) {
      const c = L.z % 3, r = Math.floor(L.z / 3); let u = COLU[c], v = ROWV[r];
      if (L.res === 'over') v = 1.35; else if (L.res === 'wide') u = c === 0 ? -.12 : c === 2 ? 1.12 : u + .7;
      else if (L.res === 'post') u = c === 0 ? 0 : 1;
      if (rv && L === rv.last && L.res !== 'post') { u += rv.jx; v += rv.jy; }
      return {x: P.goal.x + u * P.goal.w, y: P.goal.y + (1 - v) * P.goal.h};
    }
    function ctrlButtons(P) {
      const R = P.P, role = myRole(), out = [];
      if (!role) return out;
      const pad = 10;
      if (R.side) {
        const bw = R.w - pad * 2, top = R.y + 34;
        if (role === 'k') {
          const bh = Math.min(56, (R.h - 34 - pad * 5) / 4.3);
          for (let p = 0; p < 3; p++) out.push({k: 'p' + p, x: R.x + pad, y: top + p * (bh + 8), w: bw, h: bh});
          out.push({k: 'go', x: R.x + pad, y: top + 3 * (bh + 8) + 6, w: bw, h: Math.min(66, bh * 1.2)});
        } else out.push({k: 'go', x: R.x + pad, y: R.y + R.h / 2 - 30, w: bw, h: 62});
      } else {
        const top = R.y + 30;
        if (role === 'k') {
          const bw = (R.w - pad * 4) / 3, bh = Math.min(54, (R.h - 30 - pad * 3) / 2);
          for (let p = 0; p < 3; p++) out.push({k: 'p' + p, x: R.x + pad + p * (bw + pad), y: top, w: bw, h: bh});
          out.push({k: 'go', x: R.x + pad, y: top + bh + pad, w: R.w - pad * 2, h: Math.min(58, R.y + R.h - (top + bh + pad) - 8)});
        } else out.push({k: 'go', x: R.x + R.w * .15, y: top + 18, w: R.w * .7, h: 62});
      }
      return out;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e), P = layout(), role = myRole(); if (!role) return;
      for (const b of ctrlButtons(P)) if (K.inR(p, b)) {
        if (b.k === 'go') confirm(role); else { sel.p = +b.k[1]; ctx.sfx('click'); }
        return;
      }
      const G = P.goal;
      if (p.x >= G.x - 6 && p.x <= G.x + G.w + 6 && p.y >= G.y - 6 && p.y <= G.y + G.h + 6) {
        const cx = BX.clamp(Math.floor((p.x - G.x) / G.w * 3), 0, 2);
        if (role === 'k') { const r = BX.clamp(Math.floor((p.y - G.y) / G.h * 3), 0, 2); const z = r * 3 + cx; sel.z = z; }
        else { const hh = p.y < G.y + G.h / 2 ? 0 : 1; sel.d = cx * 2 + hh; }
        ctx.sfx('select');
      }
    });

    /* ---------------- drawing ---------------- */
    function person(g, x, y, s, col, o = {}) {
      // y = feet, s = height
      g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.sx) g.scale(o.sx, o.sy || 1); if (o.pivot) g.translate(0, s * .5);
      g.fillStyle = 'rgba(0,0,0,.25)'; if (!o.noShadow) { g.beginPath(); g.ellipse(0, 0, s * .28, s * .06, 0, 0, Math.PI * 2); g.fill(); }
      const skin = '#f0c89a', legs = o.legs || 0, arms = o.arms != null ? o.arms : .3;
      g.lineCap = 'round'; g.strokeStyle = '#2b2118'; g.lineWidth = s * .09;
      g.beginPath(); g.moveTo(-s * .07, -s * .42); g.lineTo(-s * .1 - legs * s * .15, -s * .02); g.moveTo(s * .07, -s * .42); g.lineTo(s * .1 + legs * s * .15, -s * .02); g.stroke();
      g.strokeStyle = skin; g.lineWidth = s * .075;
      g.beginPath(); g.moveTo(-s * .15, -s * .72); g.lineTo(-s * .26 - arms * s * .1, -s * .72 + Math.cos(arms * 2.6) * s * .3); g.moveTo(s * .15, -s * .72); g.lineTo(s * .26 + arms * s * .1, -s * .72 + Math.cos(arms * 2.6) * s * .3); g.stroke();
      if (o.gloves) { g.fillStyle = '#e6c57d'; for (const sg of [-1, 1]) { D.circle(g, sg * (s * .26 + arms * s * .1), -s * .72 + Math.cos(arms * 2.6) * s * .3, s * .07); g.fill(); } }
      g.fillStyle = D.shade(col, -30); D.rr(g, -s * .15, -s * .5, s * .3, s * .14, s * .04); g.fill();
      const gr = g.createLinearGradient(-s * .17, 0, s * .17, 0); gr.addColorStop(0, D.shade(col, 18)); gr.addColorStop(1, D.shade(col, -18));
      g.fillStyle = gr; D.rr(g, -s * .17, -s * .82, s * .34, s * .38, s * .08); g.fill();
      if (o.num) D.text(g, o.num, 0, -s * .64, {size: s * .16, color: 'rgba(255,255,255,.85)', weight: 800});
      g.fillStyle = skin; D.circle(g, 0, -s * .91, s * .1); g.fill();
      g.fillStyle = '#2b2118'; g.beginPath(); g.arc(0, -s * .93, s * .105, Math.PI, 0); g.fill();
      if (o.back) { D.circle(g, 0, -s * .91, s * .1); g.fill(); g.fillStyle = '#2b2118'; D.circle(g, 0, -s * 1.02, s * .045); g.fill(); }
      g.restore();
    }
    function drawBall(g, x, y, r, rot = 0) {
      g.save(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + r * .2, y + r * .9, r, r * .3, 0, 0, Math.PI * 2); g.fill();
      D.disc(g, x, y, r, '#fffaf0', {shadow: false});
      g.translate(x, y); g.rotate(rot); g.fillStyle = '#2b2118';
      g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r * .38, Math.sin(a) * r * .38); } g.fill();
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; g.beginPath(); g.arc(Math.cos(a) * r * .92, Math.sin(a) * r * .92, r * .25, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    function initCrowd() { const r = BX.rng(77); crowd = BX.range(90).map(() => ({u: r(), v: r(), c: ['#c23a2b', '#2f5d8a', '#e6c57d', '#3f8f5b', '#f3e2c0', '#d9822b'][Math.floor(r() * 6)], ph: r() * 6})); }
    function drawScene(g, P, time) {
      const S = P.S, G = P.goal, ground = G.y + G.h;
      // stands (tea-house gallery)
      const sg = g.createLinearGradient(0, S.y, 0, ground); sg.addColorStop(0, '#4a2a12'); sg.addColorStop(1, '#7a4a24');
      g.fillStyle = sg; g.fillRect(S.x, S.y, S.w, ground - S.y + 2);
      if (!crowd) initCrowd();
      const ch = G.y - S.y + G.h * .5;
      for (const p of crowd) {
        const x = S.x + p.u * S.w, y = S.y + 8 + p.v * ch * .8, r = Math.max(3, S.w * .011);
        const bob = (rv && rv.last.res === 'goal' && rv.t > .6) ? Math.abs(Math.sin(time * 12 + p.ph)) * r * 1.2 : Math.sin(time * 2 + p.ph) * r * .15;
        g.fillStyle = p.c; D.rr(g, x - r, y - bob + r * .9, r * 2, r * 2, r * .6); g.fill();
        g.fillStyle = '#f0c89a'; D.circle(g, x, y - bob, r * .8); g.fill();
      }
      g.fillStyle = '#3a1e0a'; g.fillRect(S.x, S.y, S.w, 5); g.fillStyle = '#b23a2b'; g.fillRect(S.x, S.y + 5, S.w, 3);
      const nl = Math.max(3, Math.round(S.w / 110));
      for (let i = 0; i < nl; i++) K.lantern(g, S.x + (i + .5) * S.w / nl, S.y + 18, Math.max(7, S.w * .018), '#d23a26', .5);
      // ad boards (wood + paper)
      const bh = Math.max(10, G.h * .14);
      D.wood(g, S.x, ground - bh - G.h * .02, S.w, bh, {base: '#a8723d', seed: 5});
      const tags = ['百戏茶馆', '清茶一盏', '以球会友', '好球！'];
      for (let i = 0; i < 4; i++) D.text(g, tags[i], S.x + (i + .5) * S.w / 4, ground - bh / 2 - G.h * .02, {size: bh * .6, color: '#fbe9d0', font: 'deco', weight: 400});
      // pitch with perspective stripes
      const pg = g.createLinearGradient(0, ground, 0, S.y + S.h); pg.addColorStop(0, '#4f9a52'); pg.addColorStop(1, '#3b8444');
      g.fillStyle = pg; g.fillRect(S.x, ground, S.w, S.y + S.h - ground);
      g.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 7; i++) { const y0 = ground + (S.y + S.h - ground) * Math.pow(i / 7, 1.4), y1 = ground + (S.y + S.h - ground) * Math.pow((i + .5) / 7, 1.4); if (i % 2 === 0) g.fillRect(S.x, y0, S.w, y1 - y0); }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(S.x, ground); g.lineTo(S.x + S.w, ground); g.stroke();
      const cx = S.x + S.w / 2, by = ground + (P.spot.y - ground) * .35;
      g.beginPath(); g.moveTo(G.x - G.w * .18, ground); g.lineTo(G.x - G.w * .32, by); g.lineTo(G.x + G.w * 1.32, by); g.lineTo(G.x + G.w * 1.18, ground); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, P.spot.y + 4, 5, 2.4, 0, 0, Math.PI * 2); g.fill();
      // net
      const L = rv && rv.last, rip = L && L.res === 'goal' && rv.t > .58 ? Math.max(0, 1 - (rv.t - .58) * 2.2) : 0;
      const gp = L ? goalPt(P, L) : null;
      g.fillStyle = 'rgba(25,40,25,.5)'; g.fillRect(G.x, G.y, G.w, G.h);
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1;
      const dx = G.w / 22, dy = G.h / 8;
      const bend = (x, y) => { if (!rip) return [x, y]; const d = Math.hypot(x - gp.x, y - gp.y), f = Math.max(0, 1 - d / (G.w * .3)) * rip; return [x + (x - gp.x) * f * .15, y + (y - gp.y) * f * .15 - f * 6]; };
      for (let i = 0; i <= 22; i++) { g.beginPath(); for (let j = 0; j <= 8; j++) { const [x, y] = bend(G.x + i * dx, G.y + j * dy); j ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      for (let j = 0; j <= 8; j++) { g.beginPath(); for (let i = 0; i <= 22; i++) { const [x, y] = bend(G.x + i * dx, G.y + j * dy); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      // posts
      g.strokeStyle = '#fffaf0'; g.lineWidth = Math.max(4, G.w * .016); g.lineCap = 'square';
      g.beginPath(); g.moveTo(G.x, ground); g.lineTo(G.x, G.y); g.lineTo(G.x + G.w, G.y); g.lineTo(G.x + G.w, ground); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(G.x + 3, ground); g.lineTo(G.x + 3, G.y + 3); g.lineTo(G.x + G.w - 3, G.y + 3); g.stroke();
      // keeper
      const ks = G.h * .64, kcol = ctx.color(L ? 1 - L.sh : keeper());
      let kx = G.x + G.w / 2, ky = ground - ks * .5, krot = 0, arms = .3 + Math.sin(time * 4) * .08, legs = .2;
      if (L && rv) {
        const kc = L.d >> 1, kh = L.d & 1, k = BX.clamp((rv.t - .3) / .3, 0, 1), e = BX.ease.out(k);
        const tx = G.x + COLU[kc] * G.w, ty = ground - G.h * (kh === 0 ? (kc === 1 ? .62 : .66) : (kc === 1 ? .5 : .2));
        kx = BX.lerp(kx, tx, e); ky = BX.lerp(ky, ty, e) - Math.sin(e * Math.PI) * G.h * .1;
        krot = (kc === 0 ? -1 : kc === 2 ? 1 : 0) * e * (kh === 0 ? 1.15 : 1.45); arms = .3 + e * 1.0; legs = e * .6;
        if (kc === 1) { krot = 0; arms = .3 + e * (kh === 0 ? 1.2 : .7); legs = kh ? e * 1.1 : e * .3; if (kh) ky = BX.lerp(ground - ks * .5, ground - ks * .42, e); }
      }
      if (!(L && rv && rv.t > .3)) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(kx, ground, ks * .28, ks * .06, 0, 0, Math.PI * 2); g.fill(); }
      person(g, kx, ky, ks, kcol, {rot: krot, arms, legs, gloves: true, num: '1', noShadow: true, pivot: true});
      // kicker + ball
      const bs = Math.max(8, G.w * .045), shCol = ctx.color(L ? L.sh : shooter());
      let bx = P.spot.x, by2 = P.spot.y - bs * .8, br = bs, brot = 0;
      let px = P.spot.x - S.h * .18, py = P.spot.y + S.h * .08, plegs = 0;
      if (L && rv) {
        const k1 = BX.clamp(rv.t / .3, 0, 1); px = BX.lerp(P.spot.x - S.h * .18, P.spot.x - bs * 1.4, BX.ease.inOut(k1)); py = BX.lerp(P.spot.y + S.h * .08, P.spot.y + bs * .4, k1); plegs = Math.sin(k1 * 14) * .5;
        if (rv.t > .3) plegs = .9;
        const k2 = BX.clamp((rv.t - .3) / .3, 0, 1);
        if (k2 > 0) {
          let tp = gp;
          const e = BX.ease.out(k2), arc = Math.sin(k2 * Math.PI) * G.h * (L.p === 2 ? .1 : .35);
          bx = BX.lerp(P.spot.x, tp.x, e); by2 = BX.lerp(P.spot.y - bs * .8, tp.y, e) - arc; br = BX.lerp(bs, bs * .55, e); brot = k2 * 12;
          if (rv.t > .6) {
            const k3 = BX.clamp((rv.t - .6) / .4, 0, 1);
            if (L.res === 'save') { const dir = (L.d >> 1) === 0 ? -1 : (L.d >> 1) === 2 ? 1 : (L.n % 2 ? 1 : -1); bx = tp.x + dir * k3 * G.w * .35; by2 = tp.y - Math.sin(k3 * Math.PI) * G.h * .4 + k3 * G.h * .9; br = bs * .55 + k3 * bs * .2; }
            else if (L.res === 'post') { const dir = (L.z % 3) === 0 ? -1 : 1; bx = tp.x + dir * k3 * G.w * .25; by2 = tp.y + k3 * G.h * .9 - Math.sin(k3 * Math.PI) * G.h * .3; }
            else if (L.res === 'over') { by2 = tp.y - k3 * G.h * .5; br = bs * .5 * (1 - k3 * .3); }
            else if (L.res === 'goal') { by2 = Math.min(ground - br, tp.y + k3 * k3 * G.h); }
            brot = 12 + k3 * 6;
          }
          // trail
          g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = br * .9; g.lineCap = 'round';
          if (k2 < 1) { g.beginPath(); g.moveTo(BX.lerp(P.spot.x, tp.x, Math.max(0, e - .2)), BX.lerp(P.spot.y - bs * .8, tp.y, Math.max(0, e - .2)) - Math.sin(Math.max(0, k2 - .15) * Math.PI) * G.h * (L.p === 2 ? .1 : .35)); g.lineTo(bx, by2); g.stroke(); }
        }
      }
      const role = myRole();
      // zone overlay (choosing)
      if (role === 'k') {
        for (let z = 0; z < 9; z++) { const r = zoneRect(P, z); g.strokeStyle = 'rgba(255,240,200,.35)'; g.setLineDash([5, 5]); g.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); g.setLineDash([]); if (z === sel.z) { g.fillStyle = 'rgba(230,197,125,.45)'; g.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); D.text(g, '◎', r.x + r.w / 2, r.y + r.h / 2, {size: Math.min(r.h * .7, 34), color: '#b23a2b', weight: 900}); } }
      } else if (role === 'g') {
        for (let d = 0; d < 6; d++) { const r = diveRect(P, d); g.strokeStyle = 'rgba(200,225,255,.4)'; g.setLineDash([5, 5]); g.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); g.setLineDash([]); if (d === sel.d) { g.fillStyle = 'rgba(120,170,230,.45)'; g.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); D.text(g, '扑', r.x + r.w / 2, r.y + r.h / 2, {size: Math.min(r.h * .45, 32), color: '#fff', font: 'deco', weight: 400, stroke: '#1d3a5a'}); } }
      }
      const behind = L && rv && rv.t > .62 && L.res === 'goal';
      if (behind) drawBall(g, bx, by2, br, brot);
      person(g, px, py, Math.max(40, S.h * .3), shCol, {back: true, legs: plegs, arms: .2, num: String((L ? L.n : st.k) % 9 + 2)});
      if (!behind) drawBall(g, bx, by2, br, brot);
      // aim line preview for kicker
      if (role === 'k' && sel.z >= 0) {
        const r = zoneRect(P, sel.z); g.strokeStyle = 'rgba(255,240,200,.6)'; g.setLineDash([6, 8]); g.lineWidth = 2;
        g.beginPath(); g.moveTo(P.spot.x, P.spot.y - bs); g.quadraticCurveTo((P.spot.x + r.x + r.w / 2) / 2, (P.spot.y + r.y) / 2 - G.h * .2, r.x + r.w / 2, r.y + r.h / 2); g.stroke(); g.setLineDash([]);
      }
    }
    function drawBoard(g, P) {
      const W = P.W, h = P.sbH;
      D.wood(g, 0, 0, W, h, {base: '#5a3418', dark: '#2a160a', seed: 9});
      g.fillStyle = 'rgba(230,197,125,.5)'; g.fillRect(0, h - 2, W, 2);
      const total = Math.max(5, st.res[0].length, st.res[1].length + (st.res[1].length < st.res[0].length ? 1 : 0), st.res[0].length + (st.res[0].length < st.res[1].length ? 1 : 0));
      const rowH = h / 2, nameW = Math.min(W * .28, 150), scW = 34;
      const dotsW = W - nameW - scW - 20, dr = Math.max(5, Math.min(rowH * .3, dotsW / total / 2.6));
      for (let s = 0; s < 2; s++) {
        const y = rowH * (s + .5), cur = !st.over && st.ph === 'choose' && shooter() === s;
        g.fillStyle = ctx.color(s); D.rr(g, 8, y - rowH * .32, 6, rowH * .64, 3); g.fill();
        D.text(g, ctx.name(s), 20, y, {size: Math.min(15, rowH * .48), color: '#fbe9d0', align: 'left', maxW: nameW - 24});
        for (let i = 0; i < total; i++) {
          const x = nameW + dr * 1.4 + i * (dotsW / total), v = st.res[s][i];
          const live = rv && rv.last && rv.last.sh === s && i === st.res[s].length - 1 && rv.t < .62;
          if (v == null || live) { g.strokeStyle = cur && i === st.res[s].length ? '#ffd76a' : 'rgba(251,233,208,.4)'; g.lineWidth = cur && i === st.res[s].length ? 2.5 : 1.5; D.circle(g, x, y, dr); g.stroke(); if (i >= 5) { g.fillStyle = 'rgba(251,233,208,.12)'; g.fill(); } }
          else if (v) { D.disc(g, x, y, dr, '#4fae7a', {shadow: false}); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - dr * .45, y); g.lineTo(x - dr * .1, y + dr * .35); g.lineTo(x + dr * .5, y - dr * .35); g.stroke(); }
          else { D.disc(g, x, y, dr, '#c23a2b', {shadow: false}); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - dr * .38, y - dr * .38); g.lineTo(x + dr * .38, y + dr * .38); g.moveTo(x + dr * .38, y - dr * .38); g.lineTo(x - dr * .38, y + dr * .38); g.stroke(); }
        }
        const shown = st.res[s].reduce((a, b, i) => a + (rv && rv.last && rv.last.sh === s && i === st.res[s].length - 1 && rv.t < .62 ? 0 : b), 0);
        D.text(g, String(shown), W - 22, y, {size: rowH * .7, color: '#ffe08a', font: 'deco', weight: 400});
      }
    }
    function drawPanel(g, P) {
      const R = P.P, role = myRole();
      D.wood(g, R.x, R.y, R.w, R.h, {base: '#6b4426', dark: '#2a160a', seed: 21, vertical: R.side});
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(R.x, R.y, R.w, R.h);
      const sz = Math.min(16, R.w * .07);
      if (!role) {
        let t = st.over ? '比赛结束' : st.ph === 'reveal' ? '揭晓！' : '对方正在思考…';
        if (!st.over && st.ph === 'choose') { const mine = [shooter(), keeper()].filter(s => ctx.isLocal(s)); if (mine.length && (st.pk && ctx.isLocal(shooter()) || st.pg && ctx.isLocal(keeper()))) t = '已选好，等待对方…'; }
        D.text(g, t, R.x + R.w / 2, R.y + R.h / 2 - 10, {size: sz * 1.3, color: '#fbe9d0', font: 'deco', weight: 400});
        if (st.last && st.ph === 'reveal') { const L = st.last; D.text(g, `${ROWN[Math.floor(L.z / 3)]}${COLN[L.z % 3]} · ${POWN[L.p]} ｜ 门将扑${COLN[L.d >> 1]}${L.d & 1 ? '下' : '上'}`, R.x + R.w / 2, R.y + R.h / 2 + 20, {size: sz * .85, color: '#e6c57d', maxW: R.w - 16}); }
        return;
      }
      D.text(g, role === 'k' ? '① 点球门选角度  ② 选力度' : '点球门选扑救方向', R.x + R.w / 2, R.y + 17, {size: sz, color: '#fbe9d0', maxW: R.w - 12});
      for (const b of ctrlButtons(P)) {
        if (b.k === 'go') {
          const ok = role === 'k' ? sel.z >= 0 : sel.d >= 0;
          K.btn(g, b, role === 'k' ? '射门！' : '扑救！', {color: ok ? '#c23a2b' : '#7a6a5a', fg: '#fff3e3', size: Math.min(b.h * .42, 24), font: 'deco'});
        } else {
          const p = +b.k[1];
          K.btn(g, b, POWN[p], {color: sel.p === p ? '#e6c57d' : '#a88a5a', sub: ['稳·可能被够到', '中规中矩', '难扑·易打飞'][p], sel: sel.p === p ? '#fff' : null, size: Math.min(b.h * .34, 18)});
        }
      }
    }
    let time = 0;
    function draw(dt) {
      time += dt; fx.update(dt);
      const g = cv.g; cv.clear('#2a190d'); const P = layout();
      const [ox, oy] = fx.offset();
      g.save(); g.translate(ox, oy); drawScene(g, P, time); g.restore();
      fx.draw(g);
      drawBoard(g, P); drawPanel(g, P);
      if (st.ph === 'choose' && !st.over && !rv) {
        const sd = st.k >= 10;
        if (sd && st.k % 2 === 0) D.text(g, '突然死亡', P.S.x + P.S.w / 2, P.goal.y - 14, {size: 18, color: '#ffd76a', font: 'deco', weight: 400, stroke: '#3a1e0a'});
      }
      if (rv && rv.t >= 1) rv = st.ph === 'reveal' ? rv : null;
      fx.drawFlash(g, P.W, P.H);
    }
    return inst;
  },
});
