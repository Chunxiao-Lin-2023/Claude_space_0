/* 反应力大比拼 — best of 5 rounds cycling 找不同 / 抢灯 / 颜色字 */
const D = BX.draw, C = BX.C, K = BX.data.spk;
const GN = ['找不同', '抢灯', '颜色字'];
const GHINT = ['两幅茶馆画有 5 处不同，点中即得，先找到 3 处者胜', '灯笼变绿的瞬间拍下去！灯没变绿就拍算犯规', '看字的颜色而不是字的意思，抢先点出墨色，先得 3 分者胜'];
const COLS = [['红', '#d0302a'], ['绿', '#2f9a4a'], ['蓝', '#2f5dc8'], ['黄', '#e0a810'], ['紫', '#8a3ab0'], ['黑', '#222222']];
const PAL = ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b', '#7a4a9a', '#e07a3a'];
const WALL = ['lan', 'scr', 'fan', 'cage', 'moon'], FLOOR = ['pot', 'cup', 'pla', 'vas', 'boo', 'cat', 'plt'];
const SLOTS = [[.1, .3, 0], [.3, .27, 0], [.52, .3, 0], [.74, .26, 0], [.92, .32, 0],
  [.07, .7, 1], [.2, .62, 1], [.33, .71, 1], [.46, .63, 1], [.59, .72, 1], [.72, .62, 1], [.84, .71, 1], [.95, .62, 1]];

/* deterministic scene from seed: objects + 5 diffs (applied to picture B) */
function makeScene(seed) {
  const R = BX.rng(seed);
  const objs = SLOTS.map(([x, y, fl]) => {
    const list = fl ? FLOOR : WALL;
    return {t: list[Math.floor(R() * list.length)], x: x + (R() - .5) * .03, y: y + (R() - .5) * .02, s: (fl ? .09 : .1) * (.85 + R() * .3), c: Math.floor(R() * PAL.length), f: R() < .5 ? -1 : 1, fl};
  });
  const idx = R.shuffle(BX.range(objs.length)).slice(0, 5), diffs = [];
  const kinds = R.shuffle(['gone', 'color', 'size', 'type', 'color']);
  idx.forEach((i, k) => {
    const o = objs[i], kd = kinds[k], d = {i, k: kd};
    if (kd === 'color') d.c = (o.c + 1 + Math.floor(R() * (PAL.length - 1))) % PAL.length;
    if (kd === 'type') { const list = o.fl ? FLOOR : WALL; let t; do t = list[Math.floor(R() * list.length)]; while (t === o.t); d.t = t; }
    diffs.push(d);
  });
  return {objs, diffs};
}
const diffCenter = (sc, d) => { const o = sc.objs[d.i]; const s = d.k === 'size' ? o.s * 1.4 : o.s; return {x: o.x, y: o.y - s * .5, r: Math.max(.06, s * .7)}; };

function drawObj(g, o, X, Y, S, t, c, sz) {
  const col = PAL[c], s = S * sz;
  g.save(); g.translate(X, Y);
  g.fillStyle = 'rgba(0,0,0,.18)'; if (o.fl) { g.beginPath(); g.ellipse(0, 0, s * .5, s * .1, 0, 0, Math.PI * 2); g.fill(); }
  g.scale(o.f, 1);
  const lw = Math.max(1, s * .05);
  g.lineWidth = lw; g.strokeStyle = 'rgba(40,20,8,.7)';
  if (t === 'lan') {
    g.strokeStyle = '#3a1e0a'; g.beginPath(); g.moveTo(0, -s * 1.3); g.lineTo(0, -s * .9); g.stroke();
    g.fillStyle = col; g.beginPath(); g.ellipse(0, -s * .55, s * .38, s * .34, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#c8a052'; g.fillRect(-s * .2, -s * .92, s * .4, s * .08); g.fillRect(-s * .2, -s * .24, s * .4, s * .08);
    g.strokeStyle = '#e6c57d'; g.beginPath(); g.moveTo(0, -s * .16); g.lineTo(0, 0); g.stroke();
  } else if (t === 'scr') {
    g.fillStyle = '#f3e9d2'; g.fillRect(-s * .3, -s * 1.1, s * .6, s * 1.05); g.strokeRect(-s * .3, -s * 1.1, s * .6, s * 1.05);
    g.fillStyle = '#5e4b38'; g.fillRect(-s * .36, -s * 1.14, s * .72, s * .07); g.fillRect(-s * .36, -s * .08, s * .72, s * .07);
    g.fillStyle = 'rgba(60,60,60,.6)'; g.beginPath(); g.moveTo(-s * .26, -s * .2); g.lineTo(-s * .08, -s * .6); g.lineTo(s * .05, -s * .35); g.lineTo(s * .15, -s * .5); g.lineTo(s * .26, -s * .2); g.fill();
    g.fillStyle = col; D.circle(g, s * .12, -s * .85, s * .08); g.fill();
  } else if (t === 'fan') {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, -s * .15); g.arc(0, -s * .15, s * .6, Math.PI * 1.15, Math.PI * 1.85); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 7; i++) { const a = Math.PI * (1.15 + i * .7 / 6); g.beginPath(); g.moveTo(0, -s * .15); g.lineTo(Math.cos(a) * s * .6, -s * .15 + Math.sin(a) * s * .6); g.stroke(); }
    g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(0, -s * .15, s * .22, Math.PI * 1.15, Math.PI * 1.85); g.lineTo(0, -s * .15); g.fill();
  } else if (t === 'cage') {
    g.strokeStyle = '#8a5a2a'; g.beginPath(); g.moveTo(0, -s * 1.3); g.lineTo(0, -s * 1.05); g.stroke();
    g.beginPath(); g.arc(0, -s * .7, s * .35, Math.PI, 0); g.lineTo(s * .35, 0); g.lineTo(-s * .35, 0); g.closePath(); g.stroke();
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * .14, -s * .7 - Math.sqrt(Math.max(0, .1225 - (i * .14) ** 2)) * s); g.lineTo(i * s * .14, 0); g.stroke(); }
    g.fillStyle = col; g.beginPath(); g.ellipse(0, -s * .3, s * .14, s * .1, 0, 0, Math.PI * 2); g.fill(); D.circle(g, s * .1, -s * .4, s * .07); g.fill();
    g.fillStyle = '#e6a020'; g.beginPath(); g.moveTo(s * .16, -s * .42); g.lineTo(s * .24, -s * .39); g.lineTo(s * .16, -s * .36); g.fill();
  } else if (t === 'moon') {
    g.fillStyle = '#3a2410'; D.circle(g, 0, -s * .55, s * .5); g.fill();
    g.fillStyle = '#1d2a4a'; D.circle(g, 0, -s * .55, s * .42); g.fill();
    g.fillStyle = col; D.circle(g, -s * .1, -s * .65, s * .18); g.fill();
    g.strokeStyle = '#6b4426'; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(-s * .42, -s * .55); g.lineTo(s * .42, -s * .55); g.moveTo(0, -s * .97); g.lineTo(0, -s * .13); g.stroke();
  } else if (t === 'pot') {
    g.fillStyle = col; g.beginPath(); g.ellipse(0, -s * .32, s * .34, s * .3, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(s * .3, -s * .35); g.quadraticCurveTo(s * .55, -s * .45, s * .58, -s * .62); g.lineWidth = s * .08; g.strokeStyle = col; g.stroke();
    g.lineWidth = lw; g.strokeStyle = 'rgba(40,20,8,.7)'; g.beginPath(); g.arc(-s * .36, -s * .35, s * .14, Math.PI * .5, Math.PI * 1.5); g.stroke();
    g.fillStyle = D.shade(col, -25); g.fillRect(-s * .14, -s * .66, s * .28, s * .08); D.circle(g, 0, -s * .7, s * .05); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-s * .12, -s * .42, s * .06, s * .1, -.5, 0, Math.PI * 2); g.fill();
  } else if (t === 'cup') {
    g.fillStyle = '#f3ead8'; g.beginPath(); g.moveTo(-s * .28, -s * .4); g.lineTo(s * .28, -s * .4); g.lineTo(s * .18, -s * .04); g.lineTo(-s * .18, -s * .04); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = col; g.fillRect(-s * .24, -s * .3, s * .48, s * .07);
    g.fillStyle = '#a8723d'; g.beginPath(); g.ellipse(0, -s * .4, s * .26, s * .05, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(-s * .05, -s * .5); g.quadraticCurveTo(s * .05, -s * .62, -s * .02, -s * .75); g.stroke();
  } else if (t === 'pla') {
    g.fillStyle = col; g.beginPath(); g.moveTo(-s * .3, -s * .28); g.lineTo(s * .3, -s * .28); g.lineTo(s * .22, 0); g.lineTo(-s * .22, 0); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#5e3a1a'; g.lineWidth = s * .07; g.beginPath(); g.moveTo(0, -s * .28); g.quadraticCurveTo(-s * .15, -s * .55, s * .05, -s * .75); g.stroke();
    g.fillStyle = '#3f8f5b'; for (const [dx, dy, r] of [[-.2, -.65, .17], [.1, -.8, .2], [.25, -.6, .14], [-.05, -.95, .13]]) { D.circle(g, dx * s, dy * s, r * s); g.fill(); }
  } else if (t === 'vas') {
    g.fillStyle = col; g.beginPath(); g.moveTo(-s * .1, -s * .9); g.quadraticCurveTo(-s * .12, -s * .6, -s * .3, -s * .35); g.quadraticCurveTo(-s * .3, 0, 0, 0); g.quadraticCurveTo(s * .3, 0, s * .3, -s * .35); g.quadraticCurveTo(s * .12, -s * .6, s * .1, -s * .9); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#fff6dc'; g.lineWidth = lw * 1.4; g.beginPath(); g.arc(0, -s * .3, s * .14, 0, Math.PI * 2); g.stroke();
  } else if (t === 'boo') {
    for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? col : ['#d9c49a', '#5e4b38', '#b23a2b'][i]; g.fillRect(-s * .38 + i * s * .03, -s * (.16 + i * .16), s * .72, s * .15); g.strokeRect(-s * .38 + i * s * .03, -s * (.16 + i * .16), s * .72, s * .15); }
  } else if (t === 'cat') {
    g.fillStyle = col; g.beginPath(); g.ellipse(0, -s * .22, s * .32, s * .22, 0, 0, Math.PI * 2); g.fill();
    D.circle(g, s * .26, -s * .48, s * .18); g.fill();
    g.beginPath(); g.moveTo(s * .14, -s * .58); g.lineTo(s * .18, -s * .78); g.lineTo(s * .28, -s * .64); g.moveTo(s * .3, -s * .64); g.lineTo(s * .4, -s * .78); g.lineTo(s * .42, -s * .56); g.fill();
    g.strokeStyle = col; g.lineWidth = s * .08; g.beginPath(); g.moveTo(-s * .3, -s * .2); g.quadraticCurveTo(-s * .55, -s * .3, -s * .45, -s * .6); g.stroke();
    g.fillStyle = '#1b1510'; D.circle(g, s * .21, -s * .5, s * .03); g.fill(); D.circle(g, s * .33, -s * .5, s * .03); g.fill();
  } else if (t === 'plt') {
    g.fillStyle = '#f3ead8'; g.beginPath(); g.ellipse(0, -s * .08, s * .42, s * .1, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = col; g.fillRect(-s * .4, -s * .1, s * .8, s * .03);
    g.fillStyle = '#fbf3e0'; for (const [dx, dy] of [[-.18, -.2], [.18, -.2], [0, -.34]]) { g.beginPath(); g.ellipse(dx * s, dy * s, s * .15, s * .12, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(120,90,50,.5)'; g.stroke(); }
  }
  g.restore();
}
function drawScene(g, sc, x, y, w, B, seed) {
  const h = w * .75;
  g.save(); D.rr(g, x, y, w, h, Math.max(4, w * .02)); g.clip();
  const wg = g.createLinearGradient(0, y, 0, y + h * .52); wg.addColorStop(0, '#8a5a30'); wg.addColorStop(1, '#a06a38'); g.fillStyle = wg; g.fillRect(x, y, w, h * .52);
  g.strokeStyle = 'rgba(60,30,10,.25)'; g.lineWidth = 1; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(x + w * i / 10, y); g.lineTo(x + w * i / 10, y + h * .52); g.stroke(); }
  g.fillStyle = '#5e3a1a'; g.fillRect(x, y, w, h * .04); g.fillStyle = '#b23a2b'; g.fillRect(x, y + h * .04, w, h * .015);
  const fg = g.createLinearGradient(0, y + h * .52, 0, y + h); fg.addColorStop(0, '#d6a565'); fg.addColorStop(1, '#b8844a'); g.fillStyle = fg; g.fillRect(x, y + h * .52, w, h * .48);
  g.fillStyle = '#5e3a1a'; g.fillRect(x, y + h * .5, w, h * .03);
  g.strokeStyle = 'rgba(100,60,20,.25)'; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x, y + h * (.53 + i * .09)); g.lineTo(x + w, y + h * (.53 + i * .09)); g.stroke(); }
  for (let i = 0; i < sc.objs.length; i++) {
    const o = sc.objs[i]; let t = o.t, c = o.c, sz = 1;
    if (B) { const d = sc.diffs.find(d => d.i === i); if (d) { if (d.k === 'gone') continue; if (d.k === 'color') c = d.c; if (d.k === 'size') sz = 1.4; if (d.k === 'type') t = d.t; } }
    drawObj(g, o, x + o.x * w, y + o.y * w, o.s * w, t, c, sz);
  }
  g.restore();
  g.strokeStyle = '#3a1e0a'; g.lineWidth = 3; D.rr(g, x, y, w, h, Math.max(4, w * .02)); g.stroke();
}

BX.register({
  id: 'reflex', title: '反应力大比拼', cat: 'speed', order: 3, sub: '找不同·抢灯·颜色字',
  desc: '五局三胜的反应力对决，轮流进行三种小游戏：在两幅茶馆画中找不同、灯笼变绿瞬间抢拍、无视字义只认墨色。考眼力、手速与专注力。',
  kind: 'realtime', seats: 2, noFirst: true, seatColors: ['#c23a2b', '#2f5d8a'],
  rules: `<p><b>五局三胜</b>，依次循环三种小游戏（找不同 → 抢灯 → 颜色字 → …），先赢 3 局者获胜。某局打平不计分，继续加局（最多 9 局）。</p>
<p><b>找不同</b>：两幅茶馆小画有 <b>5 处不同</b>（消失、变色、变大、换物）。在自己区域的任一幅画上点中不同处即归你；先找到 3 处者赢下本局。点错会被罚停 1 秒。</p>
<p><b>抢灯</b>：灯笼先暗着，随机一段时间后<b>变绿</b>，谁先拍谁赢。灯还没变绿就拍算<b>犯规</b>，直接判负。</p>
<p><b>颜色字</b>：屏幕上的字（如「红」）用另一种墨色写成，请在四个按钮中点出<b>墨色</b>的名字，别被字义骗了。先答对得 1 分，答错本题锁定；先得 3 分者赢下本局。</p>
<p>操作：直接点击/触摸。同屏两人各用自己的半边屏幕。键盘：抢灯时左方按 空格/S、右方按 回车/↓；颜色字左方 1–4、右方 7–0。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#7a4a24', seed: 6});
    const sc = makeScene(5);
    drawScene(g, sc, w * .04, h * .1, w * .44, false); drawScene(g, sc, w * .52, h * .1, w * .44, true);
    const d = diffCenter(sc, sc.diffs[0]); g.strokeStyle = '#ffd76a'; g.lineWidth = 3; D.circle(g, w * .52 + d.x * w * .44, h * .1 + d.y * w * .44, d.r * w * .44); g.stroke();
    g.save(); g.fillStyle = 'rgba(40,20,8,.75)'; D.rr(g, w * .08, h * .62, w * .84, h * .3, 10); g.fill(); g.restore();
    D.text(g, '红', w * .3, h * .77, {size: h * .22, color: '#2f5dc8', font: 'serif', weight: 900});
    D.text(g, '绿', w * .5, h * .77, {size: h * .22, color: '#e0a810', font: 'serif', weight: 900});
    g.fillStyle = '#2f9a4a'; D.circle(g, w * .74, h * .77, h * .1); g.fill(); g.fillStyle = 'rgba(120,255,160,.5)'; D.circle(g, w * .74, h * .77, h * .14); g.fill();
  },
  create(ctx) {
    const T = BX.test ? .3 : 1;
    const st = {r: 0, gm: 0, ph: 'card', t: 2.4 * T, rw: [0, 0], pt: [0, 0], rwin: -2, ev: [], evId: 0, over: false,
      seed: 0, cl: [-1, -1, -1, -1, -1], lk: [0, 0], lamp: {ph: 'wait', wt: 0, gt: 0, cand: null, foul: -1}, Q: null, qn: 0, ans: [-1, -1], lock: [0, 0], qw: -1, qt: 0, rt: [0, 0]};
    const cv = ctx.canvas(), fx = K.fx(), pads = K.pads(ctx, cv);
    const queues = [K.tq(), K.tq()], seen = {}, evSeen = {v: -1};
    let scene = null, sceneSeed = -1, greenAt = {}, time = 0, wrong = [], lastCd = 0;
    const aiP = [{}, {}];
    const getScene = () => { if (sceneSeed !== st.seed) { sceneSeed = st.seed; scene = makeScene(st.seed); } return scene; };

    /* ---------- host round logic ---------- */
    function startRound() {
      st.gm = st.r % 3; st.pt = [0, 0]; st.rwin = -2; st.ph = 'play';
      if (st.gm === 0) { st.seed = (Math.random() * 1e9) >>> 0; st.cl = [-1, -1, -1, -1, -1]; st.lk = [0, 0]; st.t = BX.test ? 10 : 45; }
      else if (st.gm === 1) { st.lamp = {ph: 'wait', wt: (BX.test ? .6 : 1.6) + Math.random() * (BX.test ? 1 : 3.4), gt: 0, cand: null, foul: -1, cw: 0}; st.t = 99; }
      else { st.qn = 0; newQ(); }
      K.ev(st, 'go', st.gm);
    }
    function newQ() {
      st.qn++; const w = Math.floor(Math.random() * 6); let i; do i = Math.floor(Math.random() * 6); while (i === w);
      const others = BX.shuffle(BX.range(6).filter(x => x !== w && x !== i)).slice(0, 2);
      const opts = BX.shuffle([i, w, ...others]).map(c => { let ink; do ink = Math.floor(Math.random() * 6); while (ink === c); return [c, ink]; });
      st.Q = {w, i, opts, a: opts.findIndex(o => o[0] === i)}; st.ans = [-1, -1]; st.lock = [0, 0]; st.qw = -1; st.qt = 8;
    }
    function endRound(w) {
      st.rwin = w; st.ph = 'res'; st.t = 2 * T;
      if (w >= 0) st.rw[w]++;
      K.ev(st, 'rw', w);
    }
    function nextRound() {
      st.r++;
      const done = st.rw[0] >= 3 || st.rw[1] >= 3 || st.r >= 9;
      if (done) {
        st.over = true; st.ph = 'over'; const w = st.rw[0] === st.rw[1] ? -1 : st.rw[0] > st.rw[1] ? 0 : 1;
        K.ev(st, 'end', w); ctx.end({winner: w, text: '局分 ' + st.rw[0] + ' : ' + st.rw[1]}); return;
      }
      st.ph = 'card'; st.t = 2.4 * T; st.gm = st.r % 3; lastCd = 0;
    }
    function onItem(s, it) {
      if (st.ph !== 'play' || it[1] !== st.r) return;
      if (it[0] === 'd' && st.gm === 0) {
        if (st.lk[s] > 0) return;
        const sc = getScene(); let hit = -1;
        sc.diffs.forEach((d, k) => { if (st.cl[k] >= 0) return; const c = diffCenter(sc, d); if (Math.hypot(c.x - it[2], c.y - it[3]) < c.r) hit = k; });
        if (hit >= 0) { st.cl[hit] = s; st.pt[s]++; K.ev(st, 'find', s, hit); if (st.pt[s] >= 3) endRound(s); }
        else { st.lk[s] = 1; K.ev(st, 'miss', s, Math.round(it[2] * 1000) / 1000, Math.round(it[3] * 1000) / 1000); }
      } else if (it[0] === 'l' && st.gm === 1) {
        const L = st.lamp; if (L.foul >= 0) return;
        if (it[2] < 0) { if (L.ph === 'wait') { L.foul = s; K.ev(st, 'foul', s); endRound(1 - s); return; } it = [it[0], it[1], Math.round(L.gt * 1000) / 1000]; }
        if (L.ph !== 'green') return;
        if (!L.cand) { L.cand = [s, it[2]]; L.cw = .25; } else if (L.cand[0] !== s && it[2] < L.cand[1]) L.cand = [s, it[2]];
      } else if (it[0] === 's' && st.gm === 2) {
        if (it[2] !== st.qn || st.qw >= 0 || st.lock[s] || st.ans[s] >= 0) return;
        st.ans[s] = it[3];
        if (it[3] === st.Q.a) { st.pt[s]++; st.qw = s; st.qt = 1.1 * T; K.ev(st, 'ok', s, it[3]); }
        else { st.lock[s] = 1; K.ev(st, 'bad', s, it[3]); if (st.lock[0] && st.lock[1]) { st.qw = 2; st.qt = 1.1 * T; } }
      }
    }
    function playStep(dt) {
      if (st.gm === 0) {
        st.t -= dt; for (let s = 0; s < 2; s++) if (st.lk[s] > 0) st.lk[s] = Math.max(0, st.lk[s] - dt);
        if (st.t <= 0) endRound(st.pt[0] === st.pt[1] ? -1 : st.pt[0] > st.pt[1] ? 0 : 1);
      } else if (st.gm === 1) {
        const L = st.lamp;
        if (L.ph === 'wait') { L.wt -= dt; if (L.wt <= 0) { L.ph = 'green'; L.gt = 0; K.ev(st, 'green'); } }
        else if (L.ph === 'green') {
          L.gt += dt;
          if (L.cand) { L.cw -= dt; if (L.cw <= 0) { L.ph = 'done'; st.rt[L.cand[0]] = L.cand[1]; K.ev(st, 'lw', L.cand[0], Math.round(L.cand[1] * 1000)); endRound(L.cand[0]); } }
          else if (L.gt > 4) { L.ph = 'done'; endRound(-1); }
        }
      } else {
        st.qt -= dt;
        if (st.qw >= 0 || st.qt <= 0) {
          if (st.qw < 0) { st.qw = 2; st.qt = 1 * T; K.ev(st, 'to'); }
          else if (st.qt <= 0) { if (st.pt[0] >= 3 || st.pt[1] >= 3) endRound(st.pt[0] >= 3 ? 0 : 1); else if (st.qn >= 12) endRound(st.pt[0] === st.pt[1] ? -1 : st.pt[0] > st.pt[1] ? 0 : 1); else newQ(); }
        }
      }
    }
    /* ---------- AI ---------- */
    function aiInput(seat, level) {
      const P = aiP[seat]; P.q = P.q || K.tq();
      if (st.ph === 'play') {
        if (P.r !== st.r) { P.r = st.r; P.next = null; P.lamp = null; P.qn = -1; }
        if (st.gm === 0) {
          if (P.next == null) P.next = st.t - ([0, [5, 8], [3.5, 5.5], [2, 3.4]][level][0] + Math.random() * ([0, 3, 2, 1.4][level])) * (BX.test ? .15 : 1);
          if (st.t <= P.next && st.lk[seat] <= 0) {
            const sc = getScene(), free = sc.diffs.map((d, k) => k).filter(k => st.cl[k] < 0);
            if (free.length) {
              if (Math.random() < [0, .2, .1, .03][level]) P.q.push('d', st.r, Math.random(), Math.random() * .75);
              else { const c = diffCenter(sc, sc.diffs[BX.pick(free)]); P.q.push('d', st.r, c.x + (Math.random() - .5) * c.r * .6, c.y + (Math.random() - .5) * c.r * .6); }
            }
            P.next = null;
          }
        } else if (st.gm === 1) {
          const L = st.lamp;
          if (!P.lamp) P.lamp = {rt: [0, [.42, .7], [.3, .45], [.2, .3]][level].reduce((a, b) => a + Math.random() * (b - a)), foul: Math.random() < [0, .1, .04, .01][level], sent: false};
          if (!P.lamp.sent && L.ph === 'wait' && P.lamp.foul && L.wt < .3) { P.lamp.sent = true; P.q.push('l', st.r, -1); }
          if (!P.lamp.sent && L.ph === 'green' && L.gt >= P.lamp.rt) { P.lamp.sent = true; P.q.push('l', st.r, Math.round(P.lamp.rt * 1000) / 1000); }
        } else if (st.Q && st.qw < 0) {
          if (P.qn !== st.qn) { P.qn = st.qn; P.at = st.qt - ([0, [1.8, 3.4], [1.2, 2.2], [.75, 1.4]][level].reduce((a, b) => a + Math.random() * (b - a))) * (BX.test ? .3 : 1); P.ch = Math.random() < [0, .2, .1, .03][level] ? st.Q.opts.findIndex(o => o[0] === st.Q.w) : st.Q.a; P.sent = false; }
          if (!P.sent && st.qt <= P.at) { P.sent = true; P.q.push('s', st.r, st.qn, P.ch); }
        }
      }
      return {q: P.q.list()};
    }
    /* ---------- layout ---------- */
    const nLoc = () => ctx.mySeats.length;
    function panels() {
      const W = cv.w, H = cv.h;
      if (nLoc() === 2) return W >= H ? [{seat: 0, x: 0, y: 0, w: W / 2, h: H, rot: 0}, {seat: 1, x: W / 2, y: 0, w: W / 2, h: H, rot: 0}]
        : [{seat: 0, x: 0, y: H / 2, w: W, h: H / 2, rot: 0}, {seat: 1, x: 0, y: 0, w: W, h: H / 2, rot: 1}];
      return [{seat: ctx.mySeats.length ? ctx.mySeats[0] : 0, x: 0, y: 0, w: W, h: H, rot: 0, solo: true}];
    }
    const head = p => p.solo ? Math.min(56, p.h * .1) : Math.min(44, p.h * .12);
    function body(p) { const hh = head(p), pad = 8; return {x: pad, y: hh + pad, w: p.w - pad * 2, h: p.h - hh - pad * 2}; }
    function scenes(p) {
      const B = body(p), gap = 8;
      const side = B.w / B.h > 1.15;            // side by side if wide
      let sw = side ? Math.min((B.w - gap) / 2, B.h / .75) : Math.min(B.w, (B.h - gap) / 2 / .75);
      const sh = sw * .75, tw = side ? sw * 2 + gap : sw, th = side ? sh : sh * 2 + gap;
      const x0 = B.x + (B.w - tw) / 2, y0 = B.y + (B.h - th) / 2;
      return [{x: x0, y: y0, w: sw}, side ? {x: x0 + sw + gap, y: y0, w: sw} : {x: x0, y: y0 + sh + gap, w: sw}];
    }
    function stroopL(p) {
      const B = body(p), wide = B.w > B.h * 1.25, pad = 8;
      const card = wide ? {x: B.x, y: B.y, w: B.w * .45, h: B.h} : {x: B.x, y: B.y, w: B.w, h: B.h * .42};
      const area = wide ? {x: B.x + B.w * .45 + pad, y: B.y, w: B.w * .55 - pad, h: B.h} : {x: B.x, y: B.y + B.h * .42 + pad, w: B.w, h: B.h * .58 - pad};
      const bw = (area.w - pad) / 2, bh = Math.min((area.h - pad) / 2, 120);
      const y0 = area.y + (area.h - bh * 2 - pad) / 2;
      return {card, btns: BX.range(4).map(i => ({i, x: area.x + (i % 2) * (bw + pad), y: y0 + Math.floor(i / 2) * (bh + pad), w: bw, h: bh}))};
    }
    const toLocal = (p, pt) => p.rot ? {x: p.x + p.w - pt.x, y: p.y + p.h - pt.y} : {x: pt.x - p.x, y: pt.y - p.y};
    const toScreen = (p, pt) => p.rot ? {x: p.x + p.w - pt.x, y: p.y + p.h - pt.y} : {x: p.x + pt.x, y: p.y + pt.y};
    pads.onDown(pt => {
      if (st.ph !== 'play') return;
      for (const p of panels()) {
        if (!K.inR(pt, p) || !ctx.isLocal(p.seat)) continue;
        const l = toLocal(p, pt), s = p.seat;
        if (st.gm === 0) {
          for (const sc of scenes(p)) if (l.x >= sc.x && l.x <= sc.x + sc.w && l.y >= sc.y && l.y <= sc.y + sc.w * .75) {
            if (st.lk[s] > 0) { ctx.sfx('error'); return; }
            queues[s].push('d', st.r, (l.x - sc.x) / sc.w, (l.y - sc.y) / sc.w); ctx.sfx('click');
          }
        } else if (st.gm === 1) lampTap(s);
        else for (const b of stroopL(p).btns) if (K.inR(l, b)) stroopTap(s, b.i);
      }
    });
    function lampTap(s) {
      if (st.ph !== 'play' || st.gm !== 1 || (aiP[s].tapped === st.r)) return;
      aiP[s].tapped = st.r;
      const ga = greenAt[st.r];
      queues[s].push('l', st.r, ga != null ? Math.round((performance.now() - ga) / 1000 * 1000) / 1000 : -1);
      ctx.sfx('hit');
    }
    function stroopTap(s, i) {
      if (st.gm !== 2 || st.qw >= 0 || st.lock[s] || st.ans[s] >= 0 || (aiP[s].sq === st.qn && aiP[s].sr === st.r)) return;
      aiP[s].sq = st.qn; aiP[s].sr = st.r; aiP[s].si = i;
      queues[s].push('s', st.r, st.qn, i); ctx.sfx('click');
    }
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const k = e[0];
        if (k === 'go') { ctx.sfx(e[2] === 1 ? 'tick' : 'start'); }
        else if (k === 'green') { ctx.sfx('bell'); }
        else if (k === 'foul') { ctx.sfx('buzz'); fx.shake(8); fx.flash(.7, '255,80,60'); }
        else if (k === 'lw') { ctx.sfx('score'); fx.flash(.8); fx.shake(5); for (const p of panels()) { const c = toScreen(p, {x: p.w / 2, y: p.h * .5}); fx.burst(c.x, c.y, {n: 30, color: ['#7fe0a0', '#ffd76a', '#fff'], sp: 300, square: true}); fx.text(c.x, c.y - 70, e[3] + ' 毫秒', {size: 26, color: '#ffe08a'}); } }
        else if (k === 'find') {
          ctx.sfx('score'); const sc = getScene(), c = diffCenter(sc, sc.diffs[e[3]]);
          for (const p of panels()) for (const s2 of scenes(p)) { const q = toScreen(p, {x: s2.x + c.x * s2.w, y: s2.y + c.y * s2.w}); fx.burst(q.x, q.y, {n: 10, color: [ctx.color(e[2]), '#ffd76a'], sp: 140, size: 3}); }
          if (ctx.isLocal(e[2])) fx.flash(.35);
        } else if (k === 'miss') {
          if (ctx.isLocal(e[2])) { ctx.sfx('error'); fx.shake(4); }
          wrong.push({s: e[2], x: e[3], y: e[4], t: 0});
        } else if (k === 'ok') { ctx.sfx('score'); fx.flash(.5); for (const p of panels()) { const b = stroopL(p).btns[e[3]], c = toScreen(p, {x: b.x + b.w / 2, y: b.y + b.h / 2}); fx.burst(c.x, c.y, {n: 18, color: ['#ffd76a', ctx.color(e[2])], sp: 220, square: true}); } }
        else if (k === 'bad') { if (ctx.isLocal(e[2])) { ctx.sfx('buzz'); fx.shake(4); } else ctx.sfx('error'); }
        else if (k === 'to') ctx.sfx('draw');
        else if (k === 'rw') { ctx.sfx(e[2] >= 0 ? 'gong' : 'draw'); fx.flash(.6); }
        else if (k === 'end') ctx.sfx('bell');
      });
    }
    function info() {
      ctx.info(0, st.rw[0] + ' 局'); ctx.info(1, st.rw[1] + ' 局');
      ctx.status(st.over ? '比赛结束' : '第 ' + (st.r + 1) + ' 局 · ' + GN[st.gm] + (st.ph === 'play' && st.gm !== 1 ? ' · ' + st.pt[0] + ':' + st.pt[1] : ''));
    }
    const inst = {
      st,
      input(seat) { return {q: queues[seat].list()}; },
      aiInput,
      step(dt, inputs) {
        if (st.over) return;
        for (let s = 0; s < 2; s++) K.take(inputs[s] && inputs[s].q, seen, s, it => onItem(s, it));
        if (st.ph === 'card') { st.t -= dt; if (st.t <= 0) startRound(); }
        else if (st.ph === 'play') playStep(dt);
        else if (st.ph === 'res') { st.t -= dt; if (st.t <= 0) nextRound(); }
        playEv(); info();
      },
      snapshot() {
        const r3 = v => Math.round(v * 100) / 100;
        return {r: st.r, gm: st.gm, ph: st.ph, t: r3(st.t), rw: st.rw, pt: st.pt, rwin: st.rwin, ev: st.ev, over: st.over, seed: st.seed, cl: st.cl, lk: st.lk.map(r3),
          lamp: {ph: st.lamp.ph, foul: st.lamp.foul, cand: st.lamp.cand}, Q: st.Q, qn: st.qn, ans: st.ans, lock: st.lock, qw: st.qw, qt: r3(st.qt), rt: st.rt};
      },
      restore(d) { Object.assign(st, d); playEv(); info(); },
      key(e) {
        if (e.repeat) return; const ms = ctx.mySeats; if (!ms.length) return;
        const s2 = ms.length > 1 ? ms[1] : ms[0];
        if (st.gm === 1 && st.ph === 'play') { if (['Space', 'KeyS'].includes(e.code)) lampTap(ms[0]); else if (['Enter', 'ArrowDown', 'NumpadEnter'].includes(e.code)) lampTap(s2); }
        if (st.gm === 2 && st.ph === 'play') {
          const m = {Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3}, m2 = {Digit7: 0, Digit8: 1, Digit9: 2, Digit0: 3};
          if (e.code in m) stroopTap(ms[0], m[e.code]); else if (e.code in m2) stroopTap(s2, m2[e.code]);
        }
      },
      draw(dt) {
        time += dt; fx.update(dt);
        if (st.ph === 'play' && st.gm === 1 && st.lamp.ph !== 'wait' && greenAt[st.r] == null) greenAt[st.r] = performance.now();
        if (!ctx.isHost) { if (st.ph === 'play' && st.gm === 0) st.t -= dt; }
        const g = cv.g; cv.clear('#2a190d');
        const [ox, oy] = fx.offset(); g.save(); g.translate(ox, oy);
        for (const p of panels()) drawPanel(g, p, dt);
        g.restore();
        for (let i = wrong.length - 1; i >= 0; i--) { wrong[i].t += dt; if (wrong[i].t > 1) wrong.splice(i, 1); }
        if (nLoc() === 2) { g.fillStyle = '#e6c57d'; if (cv.w >= cv.h) g.fillRect(cv.w / 2 - 1.5, 0, 3, cv.h); else g.fillRect(0, cv.h / 2 - 1.5, cv.w, 3); }
        fx.draw(g);
        fx.drawFlash(g, cv.w, cv.h);
      },
    };
    function drawPanel(g, p) {
      const s = p.seat, o = 1 - s, hh = head(p);
      g.save(); g.translate(p.x, p.y); if (p.rot) { g.translate(p.w, p.h); g.rotate(Math.PI); }
      g.beginPath(); g.rect(0, 0, p.w, p.h); g.clip();
      D.wood(g, 0, 0, p.w, p.h, {base: '#6b4426', dark: '#2a160a', seed: 3 + s});
      g.fillStyle = D.alpha(ctx.color(s), .1); g.fillRect(0, 0, p.w, p.h);
      // header
      g.fillStyle = 'rgba(20,10,4,.55)'; g.fillRect(0, 0, p.w, hh);
      const fs = Math.min(hh * .4, 18);
      g.fillStyle = ctx.color(s); D.circle(g, 14, hh / 2, 6); g.fill();
      D.text(g, ctx.name(s), 26, hh / 2, {size: fs * .85, color: '#fbe9d0', align: 'left', maxW: p.w * .28});
      g.fillStyle = ctx.color(o); D.circle(g, p.w - 14, hh / 2, 6); g.fill();
      D.text(g, ctx.name(o), p.w - 26, hh / 2, {size: fs * .85, color: '#fbe9d0', align: 'right', maxW: p.w * .28});
      // round pips (best of 5)
      const pr = Math.min(hh * .17, 8);
      for (let i = 0; i < 3; i++) {
        for (const [sd, seat] of [[-1, s], [1, o]]) { const x = p.w / 2 + sd * (pr * 3.2 + i * pr * 2.6); g.beginPath(); g.arc(x, hh * .36, pr, 0, Math.PI * 2); if (st.rw[seat] > i) { g.fillStyle = ctx.color(seat); g.fill(); g.strokeStyle = '#ffe08a'; } else g.strokeStyle = 'rgba(251,233,208,.45)'; g.lineWidth = 1.5; g.stroke(); }
      }
      D.text(g, '第 ' + (st.r + 1) + ' 局 · ' + GN[st.gm], p.w / 2, hh * .78, {size: Math.min(12, hh * .26), color: '#e6c57d'});
      if (st.ph === 'card' || (st.ph === 'over' && false)) drawCard(g, p);
      else if (st.gm === 0) drawSpot(g, p);
      else if (st.gm === 1) drawLamp(g, p);
      else drawStroop(g, p);
      if (st.ph === 'res') {
        const B = body(p), w = st.rwin;
        g.fillStyle = 'rgba(20,10,4,.45)'; g.fillRect(0, hh, p.w, p.h - hh);
        const k = 1 - st.t / (2 * T);
        K.banner(g, w < 0 ? '本局打平' : w === s ? (nLoc() === 2 || ctx.isLocal(s) ? '赢下本局！' : ctx.name(s) + ' 赢') : ctx.name(w) + ' 赢下本局', p.w / 2, B.y + B.h / 2, Math.min(B.w * .1, 44), BX.clamp(k * 2, 0, 1), {color: w === s ? '#ffe08a' : '#fbe9d0'});
        if (st.gm === 1 && st.lamp.foul >= 0) D.text(g, ctx.name(st.lamp.foul) + ' 抢跑犯规', p.w / 2, B.y + B.h / 2 + 46, {size: 16, color: '#ff9a8a', weight: 800, stroke: 'rgba(0,0,0,.6)'});
      }
      g.restore();
    }
    function drawCard(g, p) {
      const B = body(p), k = BX.clamp(1 - st.t / (2.4 * T), 0, 1), cw = Math.min(B.w * .9, 460), ch = Math.min(B.h * .8, 260);
      const sc = .7 + BX.ease.back(Math.min(1, k * 3)) * .3;
      g.save(); g.translate(B.x + B.w / 2, B.y + B.h / 2); g.scale(sc, sc);
      g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, -cw / 2 + 4, -ch / 2 + 6, cw, ch, 16); g.fill();
      D.paper(g, -cw / 2, -ch / 2, cw, ch, {r: 16}); g.strokeStyle = C.red; g.lineWidth = 3; D.rr(g, -cw / 2 + 6, -ch / 2 + 6, cw - 12, ch - 12, 12); g.stroke();
      D.text(g, '第 ' + (st.r + 1) + ' 局', 0, -ch * .3, {size: Math.min(18, ch * .1), color: C.ink2});
      D.text(g, GN[st.gm], 0, -ch * .05, {size: Math.min(56, ch * .26, cw * .2), color: C.red, font: 'deco', weight: 400});
      D.text(g, GHINT[st.gm], 0, ch * .22, {size: Math.min(14, cw * .036), color: C.ink, maxW: cw - 30});
      g.fillStyle = C.red; D.rr(g, cw / 2 - 58, ch / 2 - 52, 40, 40, 6); g.fill(); D.text(g, '戏', cw / 2 - 38, ch / 2 - 32, {size: 26, color: '#fbe9d0', font: 'deco', weight: 400});
      g.restore();
    }
    function drawSpot(g, p) {
      const sc = getScene(), s = p.seat, S = scenes(p);
      S.forEach((r, k) => drawScene(g, sc, r.x, r.y, r.w, k === 1));
      for (const r of S) {
        sc.diffs.forEach((d, k) => {
          const owner = st.cl[k]; if (owner < 0) return; const c = diffCenter(sc, d);
          g.strokeStyle = ctx.color(owner); g.lineWidth = 4; D.circle(g, r.x + c.x * r.w, r.y + c.y * r.w, c.r * r.w); g.stroke();
          g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
        });
        for (const w of wrong) if (w.s === s) { const a = 1 - w.t; g.globalAlpha = a; D.text(g, '✕', r.x + w.x * r.w, r.y + w.y * r.w, {size: 30, color: '#ff4a3a', weight: 900, stroke: '#fff'}); g.globalAlpha = 1; }
      }
      // progress
      const B = body(p);
      const tag = `${st.pt[s]} / 3   剩余 ${Math.max(0, Math.ceil(st.t))}s`;
      D.text(g, tag, p.w / 2, B.y + B.h + 1 - 2, {size: 12, color: '#fbe9d0', base: 'bottom'});
      for (let k = 0; k < 5; k++) { const x = p.w / 2 + (k - 2) * 18, y = B.y - 1; g.fillStyle = st.cl[k] >= 0 ? ctx.color(st.cl[k]) : 'rgba(255,255,255,.2)'; D.circle(g, x, y, 5); g.fill(); }
      if (st.lk[s] > 0 && st.ph === 'play') { g.fillStyle = 'rgba(120,20,10,.25)'; g.fillRect(B.x, B.y, B.w, B.h); D.text(g, '点错了，稍候…', p.w / 2, B.y + B.h / 2, {size: 20, color: '#fff', weight: 800, stroke: 'rgba(90,10,5,.8)'}); }
    }
    function drawLamp(g, p) {
      const B = body(p), s = p.seat, L = st.lamp, green = L.ph !== 'wait' && L.foul < 0;
      const r = Math.min(B.w, B.h) * .22, cx = B.x + B.w / 2, cy = B.y + B.h * .42;
      // beam
      g.strokeStyle = '#3a1e0a'; g.lineWidth = 6; g.beginPath(); g.moveTo(B.x, B.y + 6); g.lineTo(B.x + B.w, B.y + 6); g.stroke();
      const col = green ? '#2fbf5a' : '#7a2a1f';
      if (green) { const gr = g.createRadialGradient(cx, cy, r * .3, cx, cy, r * 3); gr.addColorStop(0, 'rgba(120,255,160,.45)'); gr.addColorStop(1, 'rgba(120,255,160,0)'); g.fillStyle = gr; g.fillRect(B.x, B.y, B.w, B.h); }
      const sw = Math.sin(time * 2) * .04;
      g.save(); g.translate(cx, B.y + 6); g.rotate(sw); g.translate(-cx, -(B.y + 6));
      g.strokeStyle = '#e6c57d'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, B.y + 6); g.lineTo(cx, cy - r * 1.1); g.stroke();
      K.lantern(g, cx, cy, r, col, green ? 1 : .1);
      D.text(g, green ? '拍' : '等', cx, cy, {size: r * .8, color: green ? '#fff' : 'rgba(255,220,200,.5)', font: 'deco', weight: 400});
      g.restore();
      const tapped = aiP[s].tapped === st.r;
      const msg = L.foul >= 0 ? '' : L.ph === 'wait' ? (tapped ? '已出手…' : '屏住呼吸，等灯变绿…') : L.ph === 'green' ? (tapped ? '已拍！' : '快拍！') : '';
      D.text(g, msg, cx, B.y + B.h * .78, {size: Math.min(26, B.w * .07), color: green ? '#bfffd0' : '#fbe9d0', font: 'deco', weight: 400, stroke: 'rgba(0,0,0,.5)'});
      if (ctx.isLocal(s)) D.text(g, nLoc() === 2 ? '点这半边屏幕' : '点任意位置' + (BX.TOUCH.matches ? '' : ' / 空格'), cx, B.y + B.h * .9, {size: 12, color: 'rgba(251,233,208,.7)'});
      if (st.rt[0] || st.rt[1]) { const best = [0, 1].filter(i => st.rt[i]).map(i => ctx.name(i) + ' ' + Math.round(st.rt[i] * 1000) + 'ms').join('  '); D.text(g, '上次最快：' + best, cx, B.y + B.h - 6, {size: 11, color: 'rgba(251,233,208,.55)', base: 'bottom'}); }
    }
    function drawStroop(g, p) {
      const s = p.seat, o = 1 - s, Lt = stroopL(p), Q = st.Q; if (!Q) return;
      const c = Lt.card;
      D.paper(g, c.x, c.y, c.w, c.h, {r: 14}); g.strokeStyle = C.gold; g.lineWidth = 3; D.rr(g, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 10); g.stroke();
      D.text(g, '点出这个字的「墨色」', c.x + c.w / 2, c.y + 18, {size: Math.min(13, c.w * .06), color: C.ink2});
      const pulse = 1 + Math.sin(time * 6) * .02;
      D.text(g, COLS[Q.w][0], c.x + c.w / 2, c.y + c.h * .56, {size: Math.min(c.h * .62, c.w * .55) * pulse, color: COLS[Q.i][1], font: 'serif', weight: 900});
      D.text(g, `${st.pt[s]} : ${st.pt[o]}   先得 3 分`, c.x + c.w / 2, c.y + c.h - 12, {size: 11, color: C.ink2});
      for (const b of Lt.btns) {
        const [cc, ink] = Q.opts[b.i], mine = st.ans[s] === b.i, rev = st.qw >= 0;
        let alpha = 1, sel = null;
        if (st.lock[s] && !mine && !rev) alpha = .45;
        if (rev) { if (b.i === Q.a) sel = '#ffd76a'; else alpha = .45; }
        K.btn(g, b, '', {color: '#efe2c4', alpha, sel, pressed: mine || (aiP[s].sq === st.qn && aiP[s].sr === st.r && aiP[s].si === b.i)});
        g.globalAlpha = alpha; D.text(g, COLS[cc][0], b.x + b.w / 2, b.y + b.h * .45, {size: Math.min(b.h * .5, b.w * .4), color: COLS[ink][1], font: 'serif', weight: 900}); g.globalAlpha = 1;
        if (mine && b.i !== Q.a) D.text(g, '✕', b.x + b.w - 14, b.y + 14, {size: 18, color: '#d0302a', weight: 900});
        if (rev && st.ans[o] === b.i) { g.fillStyle = ctx.color(o); D.circle(g, b.x + b.w - 12, b.y + b.h - 16, 6); g.fill(); }
        if (ctx.isLocal(s) && (!BX.TOUCH.matches || !pads.touched)) D.text(g, (nLoc() === 2 && s === ctx.mySeats[1] ? '7890' : '1234')[b.i], b.x + 10, b.y + 12, {size: 10, color: 'rgba(60,40,20,.6)'});
      }
      if (st.qw === s) D.text(g, '+1', c.x + c.w / 2, c.y + c.h * .2, {size: 26, color: C.jade, font: 'deco', weight: 400});
    }
    info();
    return inst;
  },
});
