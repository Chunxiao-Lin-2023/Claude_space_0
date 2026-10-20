/* 炮弹对决 — turn-based artillery on destructible ink-wash terrain. The whole flight + blasts + falls are simulated
   deterministically inside apply (only + - * / sqrt); frame() replays the recorded trajectory. */
const D = BX.draw, C = BX.C, K = BX.data.pk;
const WW = 1000, WH = 640, COLW = 5, NC = WW / COLW + 1, GRAV = 300, VMAX = 660, DT = 1 / 60, MAXSTEP = 1500;
const TANK_R = 15, BARREL = 24, FLOOR = 18;
const WEAP = [
  {name: '普通弹', short: '普通', ammo: -1, r: 34, dmg: 42, col: '#2b2118'},
  {name: '散射弹', short: '散射', ammo: 3, r: 24, dmg: 24, col: '#3f7f6b'},
  {name: '穿地弹', short: '穿地', ammo: 2, r: 30, dmg: 40, col: '#2f5d8a'},
  {name: '火药桶', short: '火药', ammo: 1, r: 64, dmg: 62, col: '#b23a2b'},
];

/* ---------- terrain helpers (pure) ---------- */
function hAt(T, x) {
  if (x <= 0) return T[0]; if (x >= WW) return T[NC - 1];
  const f = x / COLW, i = Math.floor(f), t = f - i;
  return T[i] * (1 - t) + T[i + 1] * t;
}
function carve(T, cx, cy, r) {
  const i0 = Math.max(0, Math.ceil((cx - r) / COLW)), i1 = Math.min(NC - 1, Math.floor((cx + r) / COLW));
  for (let i = i0; i <= i1; i++) {
    const dx = i * COLW - cx, s = Math.sqrt(Math.max(0, r * r - dx * dx)), lo = cy - s, hi = cy + s;
    let h = T[i];
    if (h <= lo) continue;
    if (h <= hi) h = lo; else h -= 2 * s;
    T[i] = Math.max(FLOOR, Math.round(h * 100) / 100);
  }
}
function genTerrain(rng) {
  const T = new Array(NC).fill(0), pts = new Array(65).fill(0);
  const disp = (a, b, amp) => { if (b - a < 2) return; const m = (a + b) >> 1; pts[m] = (pts[a] + pts[b]) / 2 + (rng() - .5) * amp; disp(a, m, amp * .55); disp(m, b, amp * .55); };
  pts[0] = rng() * .6; pts[64] = rng() * .6; disp(0, 64, 2.2);
  let mn = Infinity, mx = -Infinity; for (const v of pts) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  const base = 90 + rng() * 40, amp = 230 + rng() * 120;
  for (let i = 0; i < NC; i++) { const f = i / (NC - 1) * 64, k = Math.floor(f), t = f - k, a = pts[k], b = pts[Math.min(64, k + 1)]; const v = (a * (1 - t) + b * t - mn) / (mx - mn || 1); T[i] = Math.round((base + v * amp) * 100) / 100; }
  // smooth twice
  for (let s = 0; s < 2; s++) for (let i = 1; i < NC - 1; i++) T[i] = Math.round((T[i - 1] + 2 * T[i] + T[i + 1]) / 4 * 100) / 100;
  return T;
}
/* ---------- the shot simulation (pure, deterministic) ----------
   S: {T, tanks:[{x,y,hp,alive}], wind}; me: shooter seat; a: {dx,dy,p,w}
   returns {T, tanks, frames:[[x,y,...]], ev:[[step,'boom',x,y,r,[[seat,dmg]...]] | [step,'split'] | [step,'dig',x,y]], steps, falls:[[seat,dist,dmg]] } */
function simulate(S, me, a, rec) {
  const T = S.T.slice(), tanks = S.tanks.map(t => ({x: t.x, y: t.y, hp: t.hp, alive: t.alive}));
  const W = WEAP[a.w], sh = tanks[me];
  const v = 120 + a.p * (VMAX - 120);
  let P = [{x: sh.x + a.dx * BARREL, y: sh.y + 10 + a.dy * BARREL, vx: a.dx * v, vy: a.dy * v, on: 1, kind: a.w, dig: 0}];
  const frames = rec ? [] : null, ev = [];
  let step, split = false;
  const boom = (x, y, r, dmg) => {
    carve(T, x, y, r);
    const hits = [];
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i]; if (!t.alive) continue;
      const dx = t.x - x, dy = t.y + 8 - y, d = Math.sqrt(dx * dx + dy * dy), R = r + TANK_R;
      if (d < R) { const dm = Math.round(dmg * (1 - d / R * .7)); t.hp = Math.max(0, t.hp - dm); hits.push([i, dm]); if (t.hp <= 0) t.alive = 0; }
    }
    ev.push([step, 'boom', Math.round(x * 10) / 10, Math.round(y * 10) / 10, r, hits]);
  };
  for (step = 1; step <= MAXSTEP; step++) {
    let live = 0;
    const add = [];
    for (const p of P) {
      if (!p.on) continue;
      if (p.dig > 0) {   // drilling straight along its heading through the ground
        p.x += p.vx * DT * .35; p.y += p.vy * DT * .35; p.dig -= 1;
        if (step % 3 === 0) { carve(T, p.x, p.y, 9); if (rec) ev.push([step, 'dig', Math.round(p.x), Math.round(p.y)]); }
        if (p.dig <= 0 || p.y < FLOOR + 4) { p.on = 0; boom(p.x, p.y, W.r, W.dmg); }
        live++; continue;
      }
      p.vx += S.wind * DT; p.vy -= GRAV * DT;
      p.x += p.vx * DT; p.y += p.vy * DT;
      if (p.kind === 1 && !split && p.vy < 0 && p.on) {   // cluster: split at the apex into three
        split = true; p.on = 0; ev.push([step, 'split', Math.round(p.x), Math.round(p.y)]);
        for (const k of [-1, 0, 1]) add.push({x: p.x, y: p.y, vx: p.vx + k * 55, vy: p.vy + 10 - (k ? 0 : 15), on: 1, kind: 9, dig: 0});
        continue;
      }
      if (p.x < -60 || p.x > WW + 60 || p.y < -50) { p.on = 0; ev.push([step, 'lost']); continue; }
      let hit = p.y <= hAt(T, p.x);
      if (!hit) for (let i = 0; i < tanks.length; i++) { const t = tanks[i]; if (!t.alive || (i === me && step < 12)) continue; const dx = t.x - p.x, dy = t.y + 8 - p.y; if (dx * dx + dy * dy < TANK_R * TANK_R) { hit = true; break; } }
      if (hit) {
        if (p.kind === 2) { const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1; p.vx = p.vx / sp * 200; p.vy = p.vy / sp * 200; if (p.vy > -60) { p.vy = -60; } p.dig = 34; ev.push([step, 'drill', Math.round(p.x), Math.round(p.y)]); live++; continue; }
        p.on = 0; const w = p.kind === 9 ? WEAP[1] : W; boom(p.x, p.y, w.r, w.dmg); continue;
      }
      live++;
    }
    if (add.length) P = P.concat(add);
    if (rec && (step & 1) === 0) { const f = []; for (const p of P) f.push(p.on ? Math.round(p.x * 10) / 10 : 9999, p.on ? Math.round(p.y * 10) / 10 : 0); frames.push(f); }
    if (!live) break;
  }
  // settle tanks onto the (possibly lowered) ground; fall damage
  const falls = [];
  for (let i = 0; i < tanks.length; i++) {
    const t = tanks[i], g = Math.round(hAt(T, t.x) * 100) / 100;
    if (t.y - g > .5) { const dist = t.y - g, dm = t.alive && dist > 30 ? Math.min(40, Math.round((dist - 30) / 4)) : 0; if (dm) { t.hp = Math.max(0, t.hp - dm); if (t.hp <= 0) t.alive = 0; } falls.push([i, Math.round(dist), dm]); }
    t.y = g;
  }
  return {T, tanks, frames, ev, steps: step, falls};
}

BX.register({
  id: 'artillery', title: '炮弹对决', cat: 'physics', order: 1, sub: '水墨山河，炮火对轰',
  desc: '在可被炸毁的水墨山峦上架炮对轰：看风向、定角度与力度，选用普通弹、散射弹、穿地弹或火药桶，把对手轰下山头。最后存活者胜。',
  kind: 'turn', seats: [2, 4], defSeats: 2, seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#c8902b'], aiDelay: 450,
  options: [{key: 'hp', label: '血量', choices: [[60, '60'], [100, '100'], [150, '150']], def: 100}],
  rules: `<p>每位玩家在山地上有一门炮，<b>轮流开炮</b>。炮弹受<b>重力</b>和<b>风</b>影响（风向风力每回合都会改变，见上方风标）。</p>
<p>爆炸会<b>炸毁地形</b>并对范围内的炮造成伤害（越靠近中心伤害越大，也会伤到自己）。脚下的山体被炸空，炮会掉落，落差较大时受到<b>摔落伤害</b>。生命值归零即被淘汰，<b>最后存活的一方获胜</b>；若最后的炮同时被毁则为平局。若回合数达到上限，剩余生命最多者胜。</p>
<p><b>弹药：</b></p>
<ul><li><b>普通弹</b>（无限）：标准爆炸。</li>
<li><b>散射弹</b>（每人 3 发）：飞到最高点后一分为三，覆盖面大，单颗威力小。</li>
<li><b>穿地弹</b>（每人 2 发）：落地后继续钻入山体一段再爆炸，可打穿掩体、挖出深坑。</li>
<li><b>火药桶</b>（每人 1 发）：超大范围、超高威力。</li></ul>
<p><b>操作：</b>先在下方选弹药，然后在画面上按住并<b>向后拉</b>：炮管朝拉动的反方向，拉得越长力度越大，松手开炮。虚线为炮弹出膛后的前段轨迹。键盘：←→ 角度、↑↓ 力度、1-4 选弹、空格开炮。</p>`,
  icon(g, w, h) {
    K.sky(g, 0, 0, w, h, {top: '#efe2c4', bot: '#e3d2ac', sunX: .82, sunY: .22, sunR: .1});
    K.mountains(g, 0, h * .1, w, h * .7, {seed: 6, layers: 2, top: .1, alpha: [.15, .25]});
    g.fillStyle = '#3a2c20'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * .72); g.quadraticCurveTo(w * .25, h * .5, w * .45, h * .78); g.quadraticCurveTo(w * .7, h * .9, w, h * .62); g.lineTo(w, h); g.fill();
    drawCannon(g, w * .16, h * .63, 1.15, '#c23a2b', -.7, 1);
    drawCannon(g, w * .86, h * .63, 1.15, '#2f5d8a', -2.4, 1);
    g.strokeStyle = 'rgba(40,25,10,.55)'; g.lineWidth = 2; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(w * .22, h * .5); g.quadraticCurveTo(w * .5, h * -.1, w * .74, h * .42); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ffd76a'; D.circle(g, w * .74, h * .42, 9); g.fill(); g.fillStyle = '#d0533f'; D.circle(g, w * .74, h * .42, 5); g.fill();
  },
  create(ctx) {
    K.css();
    const n = ctx.n, hp0 = BX.test ? 60 : (ctx.opts.hp || 100);
    const T = genTerrain(ctx.rng);
    const xs = BX.range(n).map(i => Math.round(WW * (.1 + .8 * i / (n - 1)) + (ctx.rng() - .5) * 40));
    const order = ctx.rng.shuffle(BX.range(n));   // shuffle positions
    const tanks = BX.range(n).map(i => ({x: xs[order[i]], y: 0, hp: hp0, alive: 1}));
    // flatten a small pad under each tank
    for (const t of tanks) { const i = Math.round(t.x / COLW), hh = T[i]; for (let k = -3; k <= 3; k++) if (T[i + k] != null) T[i + k] = hh; t.y = hh; }
    const st = {T, tanks, ammo: BX.range(n).map(() => WEAP.map(w => w.ammo)), turn: ctx.rng.int(n), wind: 0, turns: 0, cap: BX.test ? 30 : 30 * n,
      aim: tanks.map(t => t.x < WW / 2 ? [.707, .707] : [-.707, .707]), over: false, last: null, hp0};
    const newWind = () => { st.wind = Math.round((ctx.rng() * 2 - 1) * 70); };
    newWind();
    const cv = ctx.canvas(), pb = K.playback(ctx), fx = K.fx(), cache = K.cache();
    let show = null, Z = st, weapon = 0, aim = {dx: st.aim[0][0], dy: st.aim[0][1], p: .55}, keyT = 0, bgKey = '';
    const aims = BX.range(n).map(i => ({dx: st.aim[i][0], dy: st.aim[i][1], p: .55}));
    const ui = ctx.ui(''); const bar = BX.h('div', {class: 'pk-bar'}); ui.append(bar);
    const wseg = K.seg(bar, '', WEAP.map((w, i) => [i, w.short + '<small>' + (w.ammo < 0 ? '∞' : '×' + w.ammo) + '</small>']), () => weapon, v => { weapon = v; });
    function refreshAmmo() {
      const s = st.turn, am = st.ammo[s];
      wseg.bs.forEach((b, i) => { b.innerHTML = WEAP[i].short + '<small>' + (am[i] < 0 ? '∞' : '×' + am[i]) + '</small>'; b.disabled = am[i] === 0; });
      if (am[weapon] === 0) weapon = 0;
      wseg.refresh();
    }
    /* ---------- view ---------- */
    function layout() {
      const W = cv.w, H = cv.h, port = H > W * 1.05, barH = 60;
      const vh = 560;   // visible world height (sky above is clipped; off-screen shells get a marker)
      const f = BX.fit(W, H - barH - (port ? 70 : 0), WW, vh, port ? 4 : 8);
      const oy = port ? 70 + vh * f.s : f.y + vh * f.s;
      return {W, H, port, s: f.s, ox: f.x, oy, vh, barH};
    }
    let V = layout();
    const P = (x, y) => [V.ox + x * V.s, V.oy - y * V.s];
    /* ---------- input ---------- */
    const myTurn = () => !st.over && !pb.on && ctx.canAct(st.turn);
    const sling = K.sling(ctx, cv, {
      enabled: myTurn, max: () => Math.min(cv.w, cv.h) * .36, min: .05,
      change: s => { aim.dx = s.dx; aim.dy = Math.max(-.2, -s.dy); const l = Math.hypot(aim.dx, aim.dy); aim.dx /= l; aim.dy /= l; aim.p = s.p; },
      release: () => fire(),
    });
    function fire() {
      if (!myTurn()) return;
      Object.assign(aims[st.turn], aim);
      ctx.sfx('boom');
      ctx.act({dx: +aim.dx.toFixed(6), dy: +aim.dy.toFixed(6), p: +aim.p.toFixed(4), w: weapon}, st.turn);
    }
    function key(e) {
      if (!myTurn()) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { const a = Math.atan2(aim.dy, aim.dx) + (e.code === 'ArrowLeft' ? 1 : -1) * Math.PI / 180; aim.dx = Math.cos(a); aim.dy = Math.sin(a); keyT = performance.now(); }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { aim.p = BX.clamp(aim.p + (e.code === 'ArrowUp' ? .01 : -.01), .02, 1); keyT = performance.now(); }
      if (/^Digit[1-4]$/.test(e.code)) { const w = +e.code.slice(5) - 1; if (st.ammo[st.turn][w] !== 0) { weapon = w; wseg.refresh(); } }
      if (e.code === 'Space' || e.code === 'Enter') fire();
    }
    /* ---------- rules ---------- */
    const alive = () => BX.range(n).filter(i => st.tanks[i].alive);
    function status() {
      for (let i = 0; i < n; i++) ctx.info(i, st.tanks[i].alive ? '♥' + st.tanks[i].hp : '已毁');
      if (st.over) return ctx.status('战斗结束');
      if (pb.on) return ctx.status(ctx.name(Z.turn) + ' 开炮！');
      const who = ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + ' 瞄准' : '轮到你开炮') : '等待 ' + ctx.name(st.turn) + ' 开炮…';
      ctx.status(`${who} · 风 ${st.wind > 0 ? '→' : st.wind < 0 ? '←' : ''}${Math.abs(st.wind)}`);
    }
    function nextTurn() {
      st.turns++;
      const al = alive();
      if (al.length <= 1 || st.turns >= st.cap) { st.over = true; return; }
      let t = st.turn; do { t = (t + 1) % n; } while (!st.tanks[t].alive);
      st.turn = t; newWind();
    }
    const inst = {
      st,
      toMove: () => st.over || (pb.on && !ctx.isRemote(st.turn)) ? null : st.turn,
      valid: a => a && isFinite(a.dx) && isFinite(a.dy) && isFinite(a.p),
      apply(a, by) {
        const me = st.turn;
        let dx = +a.dx || 0, dy = +a.dy || 1; const l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
        let w = Math.max(0, Math.min(3, Math.floor(+a.w || 0)));
        if (st.ammo[me][w] === 0) w = 0;
        if (st.ammo[me][w] > 0) st.ammo[me][w]--;
        const p = Math.max(0, Math.min(1, +a.p || 0));
        const snap = {T: st.T, tanks: st.tanks.map(t => Object.assign({}, t)), turn: me, wind: st.wind, aim: st.aim.map(q => q.slice())};
        const r = simulate(st, me, {dx, dy, p, w}, !ctx.fast);
        st.T = r.T; st.tanks = r.tanks; st.aim[me] = [Math.round(dx * 1e4) / 1e4, Math.round(dy * 1e4) / 1e4];
        const dmgTotal = r.ev.filter(e => e[1] === 'boom').reduce((s2, e) => s2 + e[5].reduce((q, h) => q + (h[0] !== me ? h[1] : 0), 0), 0);
        st.last = {me, w, dmg: dmgTotal};
        nextTurn();
        if (!ctx.fast) {
          snap.aim[me] = st.aim[me].slice();
          show = {r, snap, w, me, done: false, ei: 0, T: snap.T.slice(), hp: snap.tanks.map(t => t.hp), fallT: 0};
          const simT = r.steps * DT, lastBoom = r.ev.filter(e => e[1] === 'boom').map(e => e[0] * DT).pop() || simT;
          pb.start(simT + 1.2, () => { show = null; status(); refreshAmmo(); }, [[lastBoom - .28, lastBoom + .1, .3]]);
        } else refreshAmmo();
        if (st.over) {
          const al = alive();
          let winner;
          if (al.length === 1) winner = al[0];
          else if (!al.length) winner = -1;
          else { const best = Math.max(...al.map(i => st.tanks[i].hp)); const ws = al.filter(i => st.tanks[i].hp === best); winner = ws.length === 1 ? ws[0] : ws; }
          const text = winner === -1 ? '同归于尽' : al.length > 1 ? '回合数已满，按剩余生命判定' : ctx.name(winner) + ' 屹立到最后';
          ctx.end({winner, text, delay: show ? (r.steps * DT / 1.5 + 1.8) * 1000 : 600});
        }
        status();
      },
      aiMove(seat, level) { return ai(seat, level); },
      onTurn() { status(); if (!pb.on) { aim = Object.assign({}, aims[st.turn]); refreshAmmo(); } },
      key,
      resize() { V = layout(); },
      frame(dt) {
        pb.tick(dt); fx.update(dt * (pb.on ? Math.max(.35, pb.rate) : 1));
        Z = show ? Object.assign({}, st, show.snap, {over: false}) : st; V = layout();
        bar.classList.toggle('hide', !myTurn());
        draw(dt);
      },
    };
    /* ---------- AI ---------- */
    function ai(seat, level) {
      const t0 = performance.now(), budget = BX.test ? 35 : 520;
      const am = st.ammo[seat], foes = BX.range(n).filter(i => i !== seat && st.tanks[i].alive);
      let best = null, bv = -1e9, nn = 0;
      const tryShot = (ang, p, w) => {
        const dx = Math.cos(ang), dy = Math.sin(ang), r = simulate(st, seat, {dx, dy, p, w}, false);
        let v = 0;
        for (const i of foes) { const d0 = st.tanks[i].hp - r.tanks[i].hp; v += d0 + (r.tanks[i].alive ? 0 : 60); }
        const self = st.tanks[seat].hp - r.tanks[seat].hp; v -= self * 1.6 + (r.tanks[seat].alive ? 0 : 200);
        if (v <= 0) { // closeness to nearest foe as a tie-breaker
          const bo = r.ev.filter(e => e[1] === 'boom');
          let md = 2000; for (const e of bo) for (const i of foes) md = Math.min(md, Math.abs(e[2] - st.tanks[i].x) + Math.abs(e[3] - st.tanks[i].y) * .5);
          v = -md / 40;
        }
        return v;
      };
      const angs = [], N = BX.test ? 18 : 40;
      for (let i = 0; i <= N; i++) angs.push((10 + 160 * i / N) * Math.PI / 180);
      const ps = []; for (let i = 0; i <= (BX.test ? 10 : 24); i++) ps.push(.2 + .8 * i / (BX.test ? 10 : 24));
      const order = []; for (const a of angs) for (const p of ps) order.push([a, p]);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      for (const [a, p] of order) {
        if (nn > 30 && performance.now() - t0 > budget * .75) break;
        nn++; const v = tryShot(a, p, 0) + Math.random() * .1;
        if (v > bv) { bv = v; best = {a, p, w: 0}; }
      }
      if (!best) best = {a: Math.PI / 4, p: .6, w: 0};
      // refine locally
      for (let k = 0; k < 40 && performance.now() - t0 < budget; k++) {
        const a = best.a + (Math.random() - .5) * .08, p = BX.clamp(best.p + (Math.random() - .5) * .05, .05, 1), v = tryShot(a, p, 0);
        if (v > bv) { bv = v; best = {a, p, w: 0}; }
      }
      // special weapons (level ≥2): try them on the chosen line
      if (level >= 2 && bv > 0) for (const w of [3, 1, 2]) {
        if (am[w] === 0) continue;
        const v = tryShot(best.a, best.p, w);
        if (v > bv * 1.25 + 4) { bv = v; best = {a: best.a, p: best.p, w}; }
      } else if (level === 1 && Math.random() < .25) { const w = [1, 2, 3].find(x => am[x] > 0); if (w) best.w = w; }
      const na = [0, 4.5, 1.6, .5][level] * Math.PI / 180, np = [0, .07, .025, .008][level];
      const g2 = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const ang = best.a + g2() * na, p = BX.clamp(best.p + g2() * np, .02, 1);
      if (!ctx.isRemote(seat)) { aims[seat] = {dx: Math.cos(ang), dy: Math.sin(ang), p}; }
      return {dx: +Math.cos(ang).toFixed(6), dy: +Math.sin(ang).toFixed(6), p: +p.toFixed(4), w: best.w};
    }
    /* ---------- drawing ---------- */
    function terrainPath(g, Tr) {
      g.beginPath(); g.moveTo(0, V.H); g.lineTo(0, P(0, Tr[0])[1]);
      for (let i = 0; i < NC; i++) { const [x, y] = P(i * COLW, Tr[i]); g.lineTo(x, y); }
      g.lineTo(V.W, P(WW, Tr[NC - 1])[1]); g.lineTo(V.W, V.H); g.closePath();
    }
    function background(g) {
      const [x0, ytop] = P(0, V.vh), [x1, ybot] = P(WW, 0);
      K.sky(g, 0, 0, V.W, V.H, {top: '#e8d9b8', mid: '#f3e8d0', bot: '#e6d4ae', sunX: .8, sunY: .14, sunR: .045});
      K.mountains(g, 0, ytop + (ybot - ytop) * .1, V.W, (ybot - ytop) * .8, {seed: 21, layers: 3, top: .05, base: .8, step: .12, alpha: [.1, .16, .24]});
      K.birds(g, x0 + (x1 - x0) * .3, ytop + (ybot - ytop) * .18, 6 * V.s + 3, 3);
    }
    function drawTerrain(g, Tr) {
      const [, ytop] = P(0, 420), ybot = Math.max(P(0, 0)[1], V.H - 40);
      g.save();
      terrainPath(g, Tr);
      const gr = g.createLinearGradient(0, ytop, 0, ybot + 40); gr.addColorStop(0, '#3a2e22'); gr.addColorStop(.45, '#5e4b38'); gr.addColorStop(1, '#8c7556');
      g.fillStyle = gr; g.fill();
      g.clip();
      // ink texture strokes (cun 皴)
      const rr = BX.rng(5); g.strokeStyle = 'rgba(20,14,8,.22)'; g.lineWidth = 1;
      for (let i = 0; i < 90; i++) { const x = rr() * WW, y = rr() * 380; const [sx, sy] = P(x, y); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 6 * V.s, sy + 8 * V.s, sx + 2 * V.s, sy + 18 * V.s); g.stroke(); }
      g.restore();
      // ridge brush line with moss
      g.beginPath(); g.moveTo(0, P(0, Tr[0])[1]); for (let i = 0; i < NC; i++) { const [x, y] = P(i * COLW, Tr[i]); g.lineTo(x, y); } g.lineTo(V.W, P(WW, Tr[NC - 1])[1]);
      g.strokeStyle = '#1b1510'; g.lineWidth = Math.max(2, 4 * V.s); g.lineJoin = 'round'; g.stroke();
      g.strokeStyle = 'rgba(90,160,138,.55)'; g.lineWidth = Math.max(1, 2 * V.s); g.stroke();
    }
    function draw(dt) {
      const g = cv.g; cv.clear();
      const key2 = V.W + 'x' + V.H + ':' + V.s;
      const bg = cache('bg' + key2, V.W, V.H, cv.dpr, c2 => background(c2));
      g.drawImage(bg, 0, 0, V.W, V.H);
      const [ox, oy] = fx.off(); g.save(); g.translate(ox, oy);
      const Tr = show ? show.T : Z.T;
      let tanks = Z.tanks.map((t, i) => ({x: t.x, y: t.y, hp: show ? show.hp[i] : t.hp, alive: show ? show.hp[i] > 0 || Z.tanks[i].alive : t.alive}));
      let shells = null;
      if (show) {
        const fr = show.r.frames, k = Math.min(fr.length - 1, Math.floor(pb.t / (DT * 2)));
        while (show.ei < show.r.ev.length && show.r.ev[show.ei][0] <= (k + 1) * 2) fireEv(show.r.ev[show.ei++]);
        shells = fr.length ? fr[Math.max(0, k)] : [];
        // trails
        for (let j = 0; j < shells.length; j += 2) {
          g.save(); g.lineCap = 'round';
          for (let i = Math.max(1, k - 24); i <= k; i++) { const a = fr[i - 1], b = fr[i]; if (!a || a[j] > 9000 || b[j] > 9000 || a[j] == null) continue; const [x1, y1] = P(a[j], a[j + 1]), [x2, y2] = P(b[j], b[j + 1]); g.strokeStyle = `rgba(40,28,18,${.45 * (1 - (k - i) / 24)})`; g.lineWidth = (1 + 4 * (1 - (k - i) / 24)) * Math.max(.6, V.s); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
          g.restore();
          if (shells[j] < 9000 && Math.random() < .6) fx.burst(shells[j], shells[j + 1], {n: 1, sp: 8, color: '90,80,70', kind: 'smoke', life: .8, size: 3, grow: 2});
        }
        const simEnd = pb.t >= show.r.steps * DT;
        if (simEnd) {
          if (!show.done) { show.done = true; endFx(); }
          show.fallT = Math.min(1, show.fallT + dt * 2.5);
          tanks = tanks.map((t, i) => Object.assign(t, {y: BX.lerp(Z.tanks[i].y, st.tanks[i].y, BX.ease.in(show.fallT)), hp: show.fallT >= 1 ? st.tanks[i].hp : t.hp, alive: show.fallT >= 1 ? st.tanks[i].alive : t.alive}));
        }
      }
      drawTerrain(g, Tr);
      // tanks
      const cs = Math.max(.8, V.s * 1.35);
      tanks.forEach((t, i) => {
        const [x, y] = P(t.x, t.y);
        const isTurn = i === Z.turn && !st.over;
        let ad = Z.aim[i];
        if (!show && i === st.turn && (myTurn() || sling.on)) ad = [aim.dx, aim.dy];
        else if (!show && i === st.turn) ad = [aims[i].dx, aims[i].dy];
        if (isTurn && !show) { g.fillStyle = D.alpha(ctx.color(i), .18 + .08 * Math.sin(performance.now() / 200)); D.circle(g, x, y - 10 * cs, 26 * cs); g.fill(); }
        drawCannon(g, x, y, cs, ctx.color(i), Math.atan2(-ad[1], ad[0]), t.alive ? 1 : 0);
        // hp bar
        const bw = Math.max(40, 46 * V.s), bh = Math.max(4, 5 * V.s), by = y - 34 * cs - 6;
        if (t.alive) {
          g.fillStyle = 'rgba(20,12,6,.7)'; D.rr(g, x - bw / 2 - 1, by - 1, bw + 2, bh + 2, 3); g.fill();
          const k = BX.clamp(t.hp / st.hp0, 0, 1); g.fillStyle = k > .5 ? '#5aa08a' : k > .25 ? '#d9a12b' : '#d0533f'; D.rr(g, x - bw / 2, by, bw * k, bh, 2); g.fill();
          D.text(g, ctx.name(i), x, by - 8, {size: Math.max(10, 12 * V.s + 2), color: '#1b1510', font: 'serif', weight: 700, stroke: 'rgba(255,248,232,.85)', strokeW: 3, maxW: 90});
        }
      });
      // shells
      if (shells) for (let j = 0; j < shells.length; j += 2) {
        if (shells[j] > 9000) continue;
        const [x, y] = P(shells[j], shells[j + 1]);
        if (y < 4) { g.fillStyle = C.red; g.beginPath(); g.moveTo(x, 6); g.lineTo(x - 7, 18); g.lineTo(x + 7, 18); g.fill(); D.text(g, Math.round(shells[j + 1]) + '', x, 28, {size: 11, color: C.red}); continue; }
        const w = show.w === 1 && j > 0 ? WEAP[1] : WEAP[show.w];
        D.disc(g, x, y, Math.max(3, (show.w === 3 ? 7 : 4.5) * V.s + 1), w.col, {shadow: false});
        if (show.w === 3) { g.fillStyle = '#ffd76a'; D.circle(g, x + 3, y - 4, 2 + Math.random() * 2); g.fill(); }
      }
      if (!show && !st.over) drawAim(g);
      fx.draw(g, P, Math.max(.6, V.s));
      g.restore();
      fx.drawFlash(g, V.W, V.H);
      if (V.port) drawCards(g);
      // HUD: wind + turn
      const wx = V.W / 2, wy = V.port ? 34 : 26;
      K.wind(g, wx, wy, BX.clamp(Z.wind / 70, -1, 1), 1, '风');
    }
    function drawCards(g) {
      const y0 = V.oy + 40, ch = 52, cw = V.W - 24;
      for (let i = 0; i < n; i++) {
        const y = y0 + i * (ch + 8); if (y + ch > V.H - V.barH) break;
        const t = Z.tanks[i], hp = show ? show.hp[i] : t.hp, on = i === Z.turn && !st.over;
        g.fillStyle = on ? 'rgba(243,226,192,.95)' : 'rgba(243,226,192,.75)'; D.rr(g, 12, y, cw, ch, 10); g.fill();
        if (on) { g.strokeStyle = ctx.color(i); g.lineWidth = 3; D.rr(g, 12, y, cw, ch, 10); g.stroke(); }
        drawCannon(g, 40, y + ch - 8, .95, ctx.color(i), -2.3 + (i % 2) * 1.6, hp > 0);
        D.text(g, ctx.name(i), 66, y + 16, {size: 14, color: C.ink, align: 'left', weight: 700, maxW: cw * .4});
        const bx = 66, bw = cw - 70 - 80;
        g.fillStyle = 'rgba(0,0,0,.2)'; D.rr(g, bx, y + 30, bw, 9, 4); g.fill();
        const k = BX.clamp(hp / st.hp0, 0, 1); g.fillStyle = k > .5 ? '#3f7f6b' : k > .25 ? '#c8902b' : '#b23a2b'; D.rr(g, bx, y + 30, bw * k, 9, 4); g.fill();
        D.text(g, hp > 0 ? '♥ ' + hp : '已毁', bx + bw + 10, y + 34, {size: 14, color: C.red, align: 'left', weight: 800});
        const am = st.ammo[i]; D.text(g, `散${am[1]} 穿${am[2]} 火${am[3]}`, 12 + cw - 10, y + 16, {size: 11, color: C.ink2, align: 'right'});
      }
    }
    function drawAim(g) {
      const t = st.tanks[st.turn]; if (!t) return;
      const mine = myTurn();
      const [x, y] = P(t.x, t.y + 10);
      if (!mine) { if (ctx.isAI(st.turn) || ctx.isRemote(st.turn)) D.text(g, '瞄准中…', x, y - 60 * V.s - 12, {size: 13, color: '#5a3416', font: 'serif', weight: 700}); return; }
      // guide: first part of the flight (ignores terrain & wind after a short while)
      const v = 120 + aim.p * (VMAX - 120); let px = t.x + aim.dx * BARREL, py = t.y + 10 + aim.dy * BARREL, vx = aim.dx * v, vy = aim.dy * v;
      const pts = []; for (let i = 0; i < 26; i++) { for (let k = 0; k < 2; k++) { vx += st.wind * DT; vy -= GRAV * DT; px += vx * DT; py += vy * DT; } pts.push(P(px, py)); }
      K.guide(g, pts, {color: '#3a2414', w: 2.5, alpha: .85, fade: .85});
      if (sling.on) K.drawPull(g, x, y, {dx: aim.dx, dy: -aim.dy, p: aim.p}, Math.min(cv.w, cv.h) * .2, ctx.color(st.turn));
      if (sling.on || performance.now() - keyT < 1500) {
        K.meter(g, V.W - 26, V.port ? 90 : 60, 14, Math.min(150, V.H * .3), aim.p, {});
        const deg = Math.round(Math.atan2(aim.dy, Math.abs(aim.dx)) * 180 / Math.PI);
        D.text(g, deg + '°', x + (aim.dx >= 0 ? 34 : -34) * Math.max(1, V.s), y - 30 * Math.max(1, V.s), {size: 13, color: '#1b1510', weight: 800, stroke: 'rgba(255,248,232,.9)', strokeW: 3});
      }
      if (st.turns < n && !sling.on && performance.now() - keyT > 3000) D.text(g, '按住画面向后拉瞄准，松手开炮', V.W / 2, V.port ? 62 : 56, {size: 14, color: '#3a2414', font: 'serif', weight: 700, stroke: 'rgba(255,248,232,.8)', strokeW: 4});
    }
    function fireEv(e) {
      if (e[1] === 'boom') {
        const [, , x, y, r, hits] = e;
        carve(show.T, x, y, r);
        const big = r > 50;
        ctx.sfx(big ? 'crash' : 'boom'); fx.shake(big ? 18 : 9); fx.flashOn(big ? 1 : .55, '255,210,140');
        fx.burst(x, y, {n: big ? 60 : 30, sp: r * 4, color: ['#ffd76a', '#ff9a3c', '#d0533f', '#fff1c0'], life: .55, kind: 'spark', size: 3});
        fx.burst(x, y, {n: big ? 24 : 12, sp: r * 1.6, color: '60,48,38', kind: 'smoke', life: 1.4, size: r * .25, grow: 2.5, g: 0});
        fx.burst(x, y, {n: big ? 30 : 14, sp: r * 4, color: ['#3a2e22', '#5e4b38'], life: 1, g: -500, size: 2.5, a0: Math.PI / 2, spread: 2.6});
        for (const [i, dm] of hits) { show.hp[i] = Math.max(0, show.hp[i] - dm); const t = show.snap.tanks[i]; fx.text(t.x, t.y + 30, '-' + dm, {size: 22, color: '#ffd0c0', life: 1.4, rise: 40}); }
        const kills = hits.filter(([i]) => show.hp[i] <= 0);
        for (const [i] of kills) { const t = show.snap.tanks[i]; fx.text(t.x, t.y + 70, '击毁！', {size: 30, color: '#ffe28a', life: 2, rise: 30}); fx.burst(t.x, t.y + 10, {n: 40, sp: 260, color: ['#ffd76a', '#d0533f', '#2b2118'], life: 1, g: -400, a0: Math.PI / 2, spread: 2}); }
      } else if (e[1] === 'split') { ctx.sfx('pop'); fx.burst(e[2], e[3], {n: 12, sp: 120, color: ['#e6c57d', '#fff'], life: .4, kind: 'spark'}); }
      else if (e[1] === 'drill') { ctx.sfx('crash'); fx.shake(4); }
      else if (e[1] === 'dig') { if (Math.random() < .5) fx.burst(e[2], e[3], {n: 3, sp: 60, color: ['#3a2e22', '#8c7556'], life: .5, g: -300}); }
      else if (e[1] === 'lost') { /* flew off the map */ }
    }
    function endFx() {
      const L = st.last;
      if (show.r.ev.every(e => e[1] !== 'boom')) fx.text(WW / 2, 420, '炮弹飞出了战场', {size: 20, life: 1.6});
      for (const [i, dist, dm] of show.r.falls) if (dm) { const t = show.snap.tanks[i]; fx.text(t.x, t.y - dist + 50, '摔落 -' + dm, {size: 18, color: '#ffd0c0', life: 1.4}); }
      if (L && L.dmg >= 40) ctx.sfx('score');
    }
    refreshAmmo();
    status();
    return inst;
  },
});

/* wooden-carriage bronze cannon; (x,y) = ground contact; ang = barrel angle in screen radians (0 = right, −π/2 = up) */
function drawCannon(g, x, y, s, col, ang, alive) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (!alive) { g.globalAlpha = .75; g.fillStyle = '#2b2118'; g.beginPath(); g.ellipse(0, -4, 18, 7, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(80,70,60,.5)'; D.circle(g, -4, -14, 7); g.fill(); D.circle(g, 5, -20, 5); g.fill(); g.restore(); return; }
  // barrel (behind the carriage front)
  g.save(); g.translate(0, -14); g.rotate(ang);
  const bg = g.createLinearGradient(0, -5, 0, 5); bg.addColorStop(0, '#d9bb6a'); bg.addColorStop(.5, '#a7843e'); bg.addColorStop(1, '#5d4a22');
  g.fillStyle = bg; D.rr(g, -4, -5, 28, 10, 4); g.fill();
  g.fillStyle = '#4a3a1a'; g.fillRect(20, -6, 4, 12); g.fillRect(6, -5.5, 2.5, 11);
  g.restore();
  // carriage
  g.fillStyle = '#6b4426'; D.rr(g, -16, -16, 32, 9, 3); g.fill();
  g.fillStyle = col; g.fillRect(-14, -14, 28, 3);
  // wheels
  for (const wx of [-10, 10]) { g.fillStyle = '#3a2414'; D.circle(g, wx, -6, 6.5); g.fill(); g.strokeStyle = '#c9955a'; g.lineWidth = 1.3; D.circle(g, wx, -6, 4.5); g.stroke(); g.beginPath(); g.moveTo(wx - 4.5, -6); g.lineTo(wx + 4.5, -6); g.moveTo(wx, -10.5); g.lineTo(wx, -1.5); g.stroke(); }
  // little banner
  g.strokeStyle = '#2b2118'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-15, -15); g.lineTo(-15, -32); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(-15, -32); g.lineTo(-5, -29); g.lineTo(-15, -25); g.fill();
  g.restore();
}
