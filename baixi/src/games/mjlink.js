/* 麻将连连看 — 单人。两张相同的牌若能用不超过两次转弯的折线（经过空位或棋盘外沿）连起来即可消除。 */
const D = BX.draw, K = BX.data.slkit;
const LV = {e: [10, 6, 300, '简单'], m: [12, 7, 400, '普通'], h: [14, 8, 480, '困难']};
const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
/* kinds: 0-8 万, 9-17 条, 18-26 筒, 27-33 东南西北中发白, 34-37 梅兰竹菊 */
const NK = 38;
const PIP = {1: [[.5, .5]], 2: [[.5, .27], [.5, .73]], 3: [[.25, .22], [.5, .5], [.75, .78]], 4: [[.28, .27], [.72, .27], [.28, .73], [.72, .73]],
  5: [[.27, .23], [.73, .23], [.5, .5], [.27, .77], [.73, .77]], 6: [[.3, .2], [.7, .2], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
  7: [[.22, .16], [.5, .25], [.78, .34], [.3, .58], [.7, .58], [.3, .84], [.7, .84]], 8: [[.3, .14], [.7, .14], [.3, .38], [.7, .38], [.3, .62], [.7, .62], [.3, .86], [.7, .86]],
  9: [[.22, .18], [.5, .18], [.78, .18], [.22, .5], [.5, .5], [.78, .5], [.22, .82], [.5, .82], [.78, .82]]};

function drawFaceKind(g, k, x, y, w, h) {
  if (k < 9) {
    D.text(g, CN[k + 1], x + w / 2, y + h * .3, {size: w * .52, color: '#1d2a4a', font: 'serif', weight: 900});
    D.text(g, '萬', x + w / 2, y + h * .7, {size: w * .5, color: '#b8241a', font: 'serif', weight: 900});
  } else if (k < 18) {
    const n = k - 8;
    if (n === 1) {   // 一条: a little bird
      const cx = x + w / 2, cy = y + h / 2, r = w * .3;
      g.fillStyle = '#2f7f4b'; g.beginPath(); g.ellipse(cx, cy + r * .2, r * .75, r * .95, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c8302a'; g.beginPath(); g.arc(cx + r * .1, cy - r * .7, r * .42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e0a020'; g.beginPath(); g.moveTo(cx + r * .45, cy - r * .75); g.lineTo(cx + r * .85, cy - r * .62); g.lineTo(cx + r * .45, cy - r * .5); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + r * .2, cy - r * .78, r * .1, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1d5a35'; g.lineWidth = w * .04; g.beginPath(); g.moveTo(cx - r * .4, cy + r * .9); g.lineTo(cx - r * .9, cy + r * 1.3); g.moveTo(cx, cy + r * 1.05); g.lineTo(cx - r * .3, cy + r * 1.45); g.stroke();
      return;
    }
    const bw = w * .11, bh = h * (n > 6 ? .2 : n > 4 ? .24 : .3);
    for (const [px, py] of PIP[n]) {
      const cx = x + w * (.12 + px * .76), cy = y + h * (.1 + py * .8), red = (n === 5 || n === 9) && px === .5 && py === .5 || (n === 7 && py < .3);
      g.fillStyle = red ? '#b8241a' : '#2f7f4b'; D.rr(g, cx - bw / 2, cy - bh / 2, bw, bh, bw * .45); g.fill();
      g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(cx - bw * .5, cy - bh * .05, bw, Math.max(1, bh * .08));
    }
  } else if (k < 27) {
    const n = k - 17, cols = ['#1d4a8a', '#2f7f4b', '#b8241a'];
    const r = w * (n === 1 ? .34 : n === 2 ? .2 : n <= 4 ? .17 : n <= 6 ? .14 : .12);
    PIP[n].forEach(([px, py], i) => {
      const cx = x + w * (.1 + px * .8), cy = y + h * (.08 + py * .84), c = cols[(i + n) % 3];
      g.fillStyle = c; D.circle(g, cx, cy, r); g.fill();
      g.fillStyle = '#fbf3e0'; D.circle(g, cx, cy, r * .66); g.fill();
      g.fillStyle = c; D.circle(g, cx, cy, r * .4); g.fill();
      if (n === 1) { g.strokeStyle = '#fbf3e0'; g.lineWidth = r * .08; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(cx + Math.cos(a * .785) * r * .45, cy + Math.sin(a * .785) * r * .45); g.lineTo(cx + Math.cos(a * .785) * r * .62, cy + Math.sin(a * .785) * r * .62); g.stroke(); } }
    });
  } else if (k < 34) {
    const ch = '东南西北中发白'[k - 27];
    if (ch === '白') { g.strokeStyle = '#1d4a8a'; g.lineWidth = w * .07; D.rr(g, x + w * .2, y + h * .2, w * .6, h * .6, w * .06); g.stroke(); g.lineWidth = w * .03; D.rr(g, x + w * .29, y + h * .28, w * .42, h * .44, w * .04); g.stroke(); return; }
    D.text(g, ch, x + w / 2, y + h * .52, {size: w * .72, color: ch === '中' ? '#b8241a' : ch === '发' ? '#1f7a3f' : '#1d1a17', font: 'serif', weight: 900});
  } else {
    const ch = '梅兰竹菊'[k - 34], col = ['#c2304a', '#6a3a9a', '#1f7a3f', '#c88a10'][k - 34];
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g.fillStyle = D.alpha(col, .22); D.circle(g, x + w * .5 + Math.cos(a) * w * .2, y + h * .38 + Math.sin(a) * w * .2, w * .16); g.fill(); }
    D.text(g, ch, x + w / 2, y + h * .4, {size: w * .5, color: col, font: 'serif', weight: 900});
    D.text(g, ['春', '夏', '秋', '冬'][k - 34], x + w / 2, y + h * .8, {size: w * .26, color: '#8c5a30', font: 'serif', weight: 700});
  }
}
/* tile with body (thickness to bottom-right) */
function drawTile(g, k, x, y, w, h, o = {}) {
  const d = Math.max(2, w * .09), r = w * .14;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, x + d * .6, y + d * 1.4, w, h, r); g.fill();
  const back = g.createLinearGradient(x, y, x + w, y + h); back.addColorStop(0, '#3f9a6b'); back.addColorStop(1, '#1f5a3c');
  g.fillStyle = back; D.rr(g, x + d * .5, y + d, w - d * .5, h - d * .2, r); g.fill();
  g.fillStyle = '#efe4c8'; D.rr(g, x + d * .25, y + d * .5, w - d * .5, h - d * .6, r); g.fill();
  const fw = w - d, fh = h - d;
  const gr = g.createLinearGradient(x, y, x, y + fh); gr.addColorStop(0, o.sel ? '#fff1b8' : '#fffcf2'); gr.addColorStop(1, o.sel ? '#f2d27a' : '#ece0c4');
  g.fillStyle = gr; D.rr(g, x, y, fw, fh, r); g.fill();
  g.lineWidth = 1; g.strokeStyle = 'rgba(80,60,30,.35)'; g.stroke();
  drawFaceKind(g, k, x + fw * .06, y + fh * .05, fw * .88, fh * .9);
  g.restore();
}

BX.register({
  id: 'mjlink', title: '麻将连连看', cat: 'solo', order: 6, sub: '两张相同的牌连线消除',
  desc: '用麻将牌玩的连连看：万、条、筒、字牌与花牌。两张相同的牌之间若能用不超过两次转弯的线连通即可消除，限时清空全盘，连击得高分。',
  kind: 'solo',
  options: [
    {key: 'lv', label: '难度', choices: [['e', '简单 10×6'], ['m', '普通 12×7'], ['h', '困难 14×8']], def: 'e'},
    {key: 'tm', label: '计时', choices: [[1, '限时'], [0, '不限时']], def: 1},
  ],
  rules: `<p>依次点选两张<b>完全相同</b>的牌（同花色同点数，花牌须同一字），如果两张牌之间能用一条<b>最多转两个弯</b>的折线连起来，且线经过的都是空位（可以绕到棋盘外沿），两张牌就会消除。</p>
<p>消除全部牌即获胜。限时模式下，上方进度条是剩余时间，<b>时间耗尽则失败</b>；每次消除会补回少许时间。</p>
<p>· <b>连击</b>：3 秒内连续消除可累积连击，得分越来越高。<br>· <b>提示</b>：显示一对可以消除的牌（限时模式扣 10 秒）。<br>· <b>洗牌</b>：把剩下的牌重新打乱，每局 3 次；如果局面无牌可消会自动免费洗牌。<br>· 牌局保证有解。</p>
<p>牌面：万子（一至九萬）、条子（一条为小鸟）、筒子、东南西北中发白、梅兰竹菊。</p>`,
  icon(g, w, h) {
    D.felt(g, 0, 0, w, h, {color: '#2f6b4f'});
    const tw = w * .2, th = tw * 1.3;
    const ks = [4, 31, 22, 4, 13, 34];
    ks.forEach((k, i) => drawTile(g, k, w * .08 + (i % 3) * tw * 1.12, h * .08 + Math.floor(i / 3) * th * 1.08, tw, th, {sel: k === 4}));
    g.strokeStyle = '#ffd76a'; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();
    g.moveTo(w * .08 + tw * .45, h * .08 + th * .5); g.lineTo(w * .03, h * .08 + th * .5); g.lineTo(w * .03, h * .08 + th * 1.08 + th * .5); g.lineTo(w * .08 + tw * .45, h * .08 + th * 1.08 + th * .5); g.stroke();
  },
  create(ctx) {
    const lvK = ctx.opts.lv || 'e', TIMED = ctx.opts.tm == null ? 1 : +ctx.opts.tm, [W, H, LIMIT] = LV[lvK];
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let grid = new Array(W * H).fill(-1), sel = -1, time = 0, left = LIMIT, score = 0, combo = 0, lastMatch = -9, moves = 0, shuffles = 3, hints = 0, over = false, started = false;
    let effects = [], pathFx = null, hintPair = null, dying = [], floaters = [], shake = {i: -1, t: 0};
    const bar = K.bar(ctx, [
      {k: 'hint', ic: '☞', t: '提示', on: () => hint()},
      {k: 'shuf', ic: '⟲', t: '洗牌 3', on: () => { if (shuffles > 0 && !over) { shuffles--; reshuffle(true); } }},
      {k: 'new', ic: '↻', t: '新局', on: async () => { if (started && !over && !(await BX.confirm('放弃这一局？', '新局'))) return; ctx.restart(); }},
    ]);
    const idx = (x, y) => y * W + x;
    /* ---------- path finding: ≤2 turns, through empty cells or the outer ring ---------- */
    function connect(g, a, b) {
      if (a === b || g[a] < 0 || g[a] !== g[b]) return null;
      const PW = W + 2, PH = H + 2, N = PW * PH;
      const free = (x, y) => x < 0 || y < 0 || x >= W || y >= H || g[idx(x, y)] < 0;
      const ax = a % W, ay = (a / W) | 0, bx = b % W, by = (b / W) | 0;
      const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
      const best = new Int8Array(N * 4).fill(9), par = new Int32Array(N * 4).fill(-1);
      const P = (x, y) => (y + 1) * PW + x + 1;
      let q = [];
      for (let d = 0; d < 4; d++) { best[P(ax, ay) * 4 + d] = 0; q.push([ax, ay, d, 0]); }
      for (let turns = 0; turns <= 2; turns++) {
        const nq = [];
        while (q.length) {
          const [x, y, d, t] = q.shift(); if (t !== turns) { nq.push([x, y, d, t]); continue; }
          let cx = x + DX[d], cy = y + DY[d], prev = P(x, y) * 4 + d;
          while (cx >= -1 && cy >= -1 && cx <= W && cy <= H) {
            if (cx === bx && cy === by) {   // reconstruct corners
              const pts = [[bx, by]]; let s = prev, lx = bx, ly = by, ld = d;
              const st = []; let cur = prev;
              while (cur >= 0) { const cell = (cur / 4) | 0, dd = cur % 4; st.push([cell % PW - 1, ((cell / PW) | 0) - 1, dd]); cur = par[cur]; }
              // st: list of turn points from b back to a
              for (const [px, py] of st) pts.push([px, py]);
              return pts.reverse();
            }
            if (!free(cx, cy)) break;
            const key = P(cx, cy) * 4 + d;
            if (best[key] > t) { best[key] = t; }
            // turning here
            if (t < 2) for (const nd of [(d + 1) % 4, (d + 3) % 4]) { const k2 = P(cx, cy) * 4 + nd; if (best[k2] > t + 1) { best[k2] = t + 1; par[k2] = prev; nq.push([cx, cy, nd, t + 1]); } }
            cx += DX[d]; cy += DY[d];
          }
        }
        q = nq;
      }
      return null;
    }
    function findPair(g) {
      const by = {}; g.forEach((k, i) => { if (k >= 0) (by[k] = by[k] || []).push(i); });
      const kinds = Object.keys(by); BX.shuffle(kinds);
      for (const k of kinds) { const l = by[k]; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) { const p = connect(g, l[i], l[j]); if (p) return [l[i], l[j], p]; } }
      return null;
    }
    function solvable(g0) { const g = g0.slice(); let n = g.filter(k => k >= 0).length; while (n) { const p = findPair(g); if (!p) return false; g[p[0]] = g[p[1]] = -1; n -= 2; } return true; }
    function deal() {
      const n = W * H, nk = n / 4, kinds = ctx.rng.shuffle(BX.range(NK)).slice(0, nk), tiles = [];
      for (const k of kinds) tiles.push(k, k, k, k);
      for (let t = 0; t < 30; t++) { ctx.rng.shuffle(tiles); if (solvable(tiles)) break; }
      grid = tiles.slice();
      dying = []; effects = grid.map((k, i) => ({d: .2 + ((i % W) + ((i / W) | 0)) * .025, s: 0}));
      ctx.sfx('shuffle');
    }
    deal();
    function reshuffle(manual) {
      const pos = [], ks = []; grid.forEach((k, i) => { if (k >= 0) { pos.push(i); ks.push(k); } });
      for (let t = 0; t < 40; t++) { BX.shuffle(ks); const g = grid.slice(); pos.forEach((p, j) => g[p] = ks[j]); if (solvable(g) || t === 39) { grid = g; break; } }
      pos.forEach(p => effects[p] = {d: Math.random() * .25, s: 0});
      sel = -1; hintPair = null; ctx.sfx('shuffle');
      if (!manual) ctx.toast('无牌可消，已自动洗牌');
      bar.label('shuf', '洗牌 ' + shuffles); bar.dis('shuf', shuffles <= 0);
    }
    function hint() {
      if (over) return;
      const p = findPair(grid); if (!p) { reshuffle(false); return; }
      hintPair = {a: p[0], b: p[1], t: 0}; hints++;
      if (TIMED) { left = Math.max(1, left - 10); floaters.push({x: L ? L.timerX : 0, y: 30, t: 0, s: '-10 秒', c: '#ff8a70'}); }
      ctx.sfx('tick');
    }
    function tryMatch(a, b) {
      const p = connect(grid, a, b);
      if (!p) return false;
      const k = grid[a]; grid[a] = grid[b] = -1; moves++; started = true;
      const now = time; combo = now - lastMatch < 3 ? combo + 1 : 1; lastMatch = now;
      const gain = 10 * combo; score += gain;
      if (TIMED) left = Math.min(LIMIT, left + 2);
      pathFx = {pts: p, t: 0};
      dying.push({i: a, k, t: 0}, {i: b, k, t: 0});
      const A = cellXY(a), B = cellXY(b);
      fx.burst(A.x, A.y, 12, {sp: 160, size: 3.5, life: .6}); fx.burst(B.x, B.y, 12, {sp: 160, size: 3.5, life: .6});
      floaters.push({x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, t: 0, s: combo > 1 ? `连击×${combo}  +${gain}` : `+${gain}`, c: combo > 2 ? '#ffd76a' : '#fff3e0', big: combo > 2});
      ctx.sfx(combo > 2 ? 'score' : 'pop');
      if (hintPair && (hintPair.a === a || hintPair.a === b || hintPair.b === a || hintPair.b === b)) hintPair = null;
      if (grid.every(x => x < 0)) { win(); return true; }
      if (!findPair(grid)) ctx.after(500, () => { if (!over) reshuffle(false); });
      return true;
    }
    function win() {
      over = true; sel = -1;
      const secs = Math.floor(time), tb = ctx.best('t_' + lvK + TIMED, secs, 'min'), sb = ctx.best('s_' + lvK + TIMED, score, 'max');
      ctx.after(400, () => { fx.rain(cv.w, cv.h, 70); });
      ctx.end({win: true, title: '满堂清', text: `用时 ${K.fmt(secs)} 步数 ${moves} · 得分 ${score}` + (sb.isNew ? ' · 最高分！' : ` · 最高 ${sb.best}`) + (tb.isNew ? ' · 最快！' : ''), delay: 1500});
    }
    function lose() {
      over = true; sel = -1; ctx.sfx('lose');
      const n = grid.filter(k => k >= 0).length;
      ctx.end({win: false, title: '时间到', text: `还剩 ${n} 张牌 · 得分 ${score} · 步数 ${moves}`, delay: 900});
    }

    /* ---------- layout (portrait shows the board transposed) ---------- */
    let L = null;
    function layout() {
      const A = bar.area(cv.w, cv.h), top = 40, aw = A.w - 12, ah = A.h - top - 8;
      const ratio = 1.3;
      const fit = (cw, ch) => Math.min(aw / (cw + .9), ah / ((ch + .9) * ratio));
      const sN = fit(W, H), sT = fit(H, W), tr = sT > sN * 1.08;
      const DW = tr ? H : W, DH = tr ? W : H, tw = Math.min(tr ? sT : sN, 76), th = tw * ratio;
      L = {tr, tw, th, DW, DH, ox: A.x + 6 + (aw - DW * tw) / 2, oy: top + (ah - DH * th) / 2, A, top, timerX: A.x + A.w / 2};
    }
    const disp = i => { const x = i % W, y = (i / W) | 0; return L.tr ? [y, x] : [x, y]; };
    const cellXY = i => { const [dx, dy] = disp(i); return {x: L.ox + (dx + .5) * L.tw, y: L.oy + (dy + .5) * L.th}; };
    const ptXY = ([x, y]) => { const [dx, dy] = L.tr ? [y, x] : [x, y]; return [L.ox + (dx + .5) * L.tw, L.oy + (dy + .5) * L.th]; };
    function cellAt(p) {
      const dx = Math.floor((p.x - L.ox) / L.tw), dy = Math.floor((p.y - L.oy) / L.th);
      if (dx < 0 || dy < 0 || dx >= L.DW || dy >= L.DH) return -1;
      return L.tr ? idx(dy, dx) : idx(dx, dy);
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (over || !L) return;
      const i = cellAt(cv.pos(e)); if (i < 0 || grid[i] < 0) { sel = -1; return; }
      started = true;
      if (sel < 0) { sel = i; ctx.sfx('click'); return; }
      if (sel === i) { sel = -1; ctx.sfx('tick'); return; }
      if (grid[sel] === grid[i]) {
        if (tryMatch(sel, i)) { sel = -1; return; }
        shake = {i, t: .3}; ctx.sfx('error'); sel = i; return;
      }
      sel = i; ctx.sfx('click');
    });

    /* ---------- drawing ---------- */
    const spr = new Map(); let sprKey = '';
    function tileSprite(k, s) {
      const key = L.tw + '|' + cv.dpr; if (key !== sprKey) { spr.clear(); sprKey = key; }
      const id = k + (s ? 's' : ''); let c = spr.get(id); if (c) return c;
      c = document.createElement('canvas'); const pad = 4, w = L.tw - 2, h = L.th - 2;
      c.width = Math.ceil((w + pad * 2) * cv.dpr); c.height = Math.ceil((h + pad * 2) * cv.dpr);
      const g = c.getContext('2d'); g.scale(cv.dpr, cv.dpr); drawTile(g, k, pad, pad, w, h, {sel: s}); c.pad = pad; spr.set(id, c); return c;
    }
    let bgC = null, bgKey = '';
    return {
      frame(dt) {
        const g = cv.g; cv.clear(); layout();
        if (started && !over) { time += dt; if (TIMED) { left -= dt; if (left <= 0) { left = 0; lose(); } } }
        const key = cv.w + 'x' + cv.h + cv.dpr;
        if (key !== bgKey) { bgKey = key; bgC = document.createElement('canvas'); bgC.width = Math.ceil(cv.w * cv.dpr); bgC.height = Math.ceil(cv.h * cv.dpr); const b = bgC.getContext('2d'); b.scale(cv.dpr, cv.dpr); K.table(b, cv.w, cv.h, 'felt'); }
        g.drawImage(bgC, 0, 0, cv.w, cv.h);
        const {tw, th, ox, oy, A} = L;
        // HUD: timer bar + score
        const bw = Math.min(A.w - 140, 460), bx = A.x + (A.w - bw) / 2 - 40, by = 12;
        g.fillStyle = 'rgba(20,12,5,.55)'; D.rr(g, bx, by, bw, 16, 8); g.fill();
        const frac = TIMED ? left / LIMIT : 1;
        if (TIMED) { const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, frac < .2 ? '#e05a40' : '#d9a12b'); gr.addColorStop(1, frac < .2 ? '#ff8a60' : '#f3d080'); g.fillStyle = gr; D.rr(g, bx + 2, by + 2, Math.max(0, (bw - 4) * frac), 12, 6); g.fill(); }
        D.text(g, TIMED ? `剩余 ${K.fmt(left)}` : `用时 ${K.fmt(time)}`, bx + bw / 2, by + 8.5, {size: 11.5, color: '#fff', weight: 800, stroke: 'rgba(0,0,0,.5)', strokeW: 3});
        D.text(g, `得分 ${score}`, bx + bw + 12, by + 8.5, {size: 15, color: '#f3e2c0', weight: 800, align: 'left', shadow: true});
        // tiles (draw in row order so thickness overlaps properly)
        for (let dy = 0; dy < L.DH; dy++) for (let dx = 0; dx < L.DW; dx++) {
          const i = L.tr ? idx(dy, dx) : idx(dx, dy), k = grid[i]; if (k < 0) continue;
          const ef = effects[i]; let sc = 1, oyy = 0;
          if (ef && ef.s < 1) { if (ef.d > 0) { ef.d -= dt; continue; } ef.s = Math.min(1, ef.s + dt * 4); sc = BX.ease.back(ef.s); oyy = (1 - ef.s) * -20; }
          let x = ox + dx * tw + 1, y = oy + dy * th + 1 + oyy;
          if (shake.i === i && shake.t > 0) x += Math.sin(shake.t * 60) * 3;
          const isSel = sel === i, hl = hintPair && (hintPair.a === i || hintPair.b === i);
          if (isSel) y -= 3;
          const c = tileSprite(k, isSel || (hl && Math.sin(hintPair.t * 8) > 0));
          if (sc !== 1) { g.save(); g.translate(x + tw / 2, y + th / 2); g.scale(sc, sc); g.drawImage(c, -tw / 2 - c.pad, -th / 2 - c.pad, c.width / cv.dpr, c.height / cv.dpr); g.restore(); }
          else g.drawImage(c, x - c.pad, y - c.pad, c.width / cv.dpr, c.height / cv.dpr);
          if (isSel) { g.strokeStyle = '#ffd76a'; g.lineWidth = 2.5; D.rr(g, x - 1, y - 1, tw - 2 - tw * .09 + 2, th - 2 - tw * .09 + 2, tw * .14); g.stroke(); }
        }
        if (shake.t > 0) shake.t -= dt;
        if (hintPair) { hintPair.t += dt; if (hintPair.t > 4) hintPair = null; }
        // dying tiles fly up and fade
        for (const d of dying) {
          d.t += dt; const p = cellXY(d.i), a = Math.max(0, 1 - d.t * 2.2);
          if (a <= 0) continue;
          g.save(); g.globalAlpha = a; g.translate(p.x, p.y - d.t * 40); g.scale(1 + d.t * .6, 1 + d.t * .6);
          const c = tileSprite(d.k, true); g.drawImage(c, -tw / 2 - c.pad, -th / 2 - c.pad, c.width / cv.dpr, c.height / cv.dpr); g.restore();
        }
        dying = dying.filter(d => d.t < .5);
        // connection path
        if (pathFx) {
          pathFx.t += dt; const a = Math.max(0, 1 - pathFx.t * 2.5);
          g.save(); g.globalAlpha = a; g.lineJoin = g.lineCap = 'round';
          g.shadowColor = '#ffe08a'; g.shadowBlur = 12; g.strokeStyle = '#ffd76a'; g.lineWidth = Math.max(3, tw * .1);
          g.beginPath(); pathFx.pts.forEach((pt, j) => { const [x, y] = ptXY(pt); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
          g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, tw * .03); g.stroke(); g.restore();
          if (a <= 0) pathFx = null;
        }
        fx.draw(g, dt);
        for (const f of floaters) { f.t += dt; D.text(g, f.s, f.x, f.y - f.t * 50, {size: f.big ? 22 : 16, color: f.c, weight: 900, stroke: 'rgba(60,20,0,.7)', strokeW: 4}); }
        floaters = floaters.filter(f => f.t < 1);
        if (!over) say(`${LV[lvK][3]} · 剩 ${grid.filter(k => k >= 0).length} 张` + (combo > 1 && time - lastMatch < 3 ? ` · 连击 ${combo}` : ''));
        bar.dis('hint', over); bar.dis('shuf', over || shuffles <= 0);
      },
      key(e) { if (e.code === 'KeyH') hint(); },
      debug: {
        get grid() { return grid; }, findPair: () => findPair(grid), W, H,
        cellXY: i => { const p = cellXY(i), r = cv.cv.getBoundingClientRect(); return {x: p.x + r.left, y: p.y + r.top}; },
        get tr() { return L && L.tr; },
      },
    };
  },
});
