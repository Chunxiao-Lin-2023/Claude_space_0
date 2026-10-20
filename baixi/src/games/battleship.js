/* 海战棋 — classic 10×10 battleship: secret simultaneous setup, alternate single shots. */
const D = BX.draw, C = BX.C;
const N = 10, FLEET = [5, 4, 3, 3, 2], SHIPN = ['楼船', '斗舰', '艨艟', '走舸', '游艇'];
const ROWL = '甲乙丙丁戊己庚辛壬癸', COLL = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const PCOL = ['#b23a2b', '#2f5d8a'];
const cellsOf = sh => BX.range(sh.len).map(k => sh.h ? sh.y * N + sh.x + k : (sh.y + k) * N + sh.x);
function fits(sh) { return sh.x >= 0 && sh.y >= 0 && (sh.h ? sh.x + sh.len <= N && sh.y < N : sh.y + sh.len <= N && sh.x < N); }
function validFleet(ships) {
  if (!Array.isArray(ships) || ships.length !== FLEET.length) return false;
  const occ = new Set();
  for (let k = 0; k < FLEET.length; k++) {
    const s = ships[k]; if (!s || s.len !== FLEET[k] || !Number.isInteger(s.x) || !Number.isInteger(s.y) || typeof s.h !== 'boolean' || !fits(s)) return false;
    for (const c of cellsOf(s)) { if (occ.has(c)) return false; occ.add(c); }
  }
  return true;
}
function randomFleet(rnd, spread) {
  for (let tries = 0; tries < 500; tries++) {
    const ships = [], occ = new Set(); let ok = true;
    for (const len of FLEET) {
      let placed = false;
      for (let a = 0; a < 200 && !placed; a++) {
        const h = rnd() < .5, x = Math.floor(rnd() * (h ? N - len + 1 : N)), y = Math.floor(rnd() * (h ? N : N - len + 1));
        const sh = {x, y, h, len}, cs = cellsOf(sh);
        if (cs.some(c => occ.has(c))) continue;
        if (spread && cs.some(c => { const cx = c % N, cy = (c / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && occ.has(ny * N + nx)) return true; } return false; })) continue;
        cs.forEach(c => occ.add(c)); ships.push(sh); placed = true;
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return ships;
  }
  return [{x: 0, y: 0, h: true, len: 5}, {x: 0, y: 2, h: true, len: 4}, {x: 0, y: 4, h: true, len: 3}, {x: 0, y: 6, h: true, len: 3}, {x: 0, y: 8, h: true, len: 2}];
}

BX.register({
  id: 'battleship', title: '海战棋', cat: 'party', order: 4, sub: '暗布舰队，炮击敌船',
  desc: '双方各自在海图上秘密布置五艘战船，然后轮流向对方海域开炮。命中、击沉都会播报，先击沉对方全部战船者获胜。',
  kind: 'turn', seats: 2, hidden: true, seatNames: ['赤水师', '青水师'], seatColors: PCOL, firstLabel: '先开炮', aiDelay: 500, anyTimeActs: true,
  rules: `<p>每方有一片 <b>10×10</b> 的海域，在其中<b>秘密</b>布置五艘战船（横放或竖放，不能重叠、不能出界）：</p>
<ul><li>楼船 5 格、斗舰 4 格、艨艟 3 格、走舸 3 格、游艇 2 格</li></ul>
<p>双方布阵完毕后轮流开炮，<b>每回合只开一炮</b>：在对方海图上选一格，对方报告“<b>命中</b>”或“<b>落空</b>”；当一艘船的所有格子都被击中时报告“<b>击沉</b>”，并公开这艘船的位置。</p>
<p><b>先击沉对方全部五艘船</b>的一方获胜。</p>
<p>布阵操作：点「随机布置」可一键摆好；点一艘船选中它，再点海面空格把它移过去，再点一次已选中的船可以旋转（电脑上也可以直接拖动）。确认后等待对方。<br>
开炮操作：点上方/左侧的敌方海图；触屏上第一次点击瞄准，再点一次开火。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f6f8a'); gr.addColorStop(1, '#173c4e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = h / 7; g.strokeStyle = 'rgba(200,230,240,.18)'; g.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
    drawShip(g, s * 1, s * 2, s * 5, s, true, '#7a4a28', 5);
    drawShip(g, s * 9, s * 1, s, s * 3, false, '#7a4a28', 3);
    for (const [x, y] of [[3, 2], [4, 2]]) { fire(g, (x + .5) * s, (y + .5) * s, s * .38, 1); }
    for (const [x, y] of [[6, 5], [2, 5], [7, 3]]) { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; D.circle(g, (x + .5) * s, (y + .5) * s, s * .2); g.stroke(); }
  },
  create(ctx) {
    const st = {phase: 'setup', ships: [null, null], shots: [new Array(N * N).fill(0), new Array(N * N).fill(0)], sunk: [[], []], hits: [0, 0], turn: 0, last: null, pend: false, over: false, winner: -1};
    const cv = ctx.canvas();
    let lay = randomFleet(Math.random), sel = -1, drag = null, aim = -1, hover = -1, btns = [], t = 0, ann = null, boom = null;
    const viewer = () => ctx.view >= 0 ? ctx.view : 0;
    const myTurn = () => st.phase === 'play' && !st.pend && !st.over && ctx.canAct(st.turn);
    const needSetup = () => st.phase === 'setup' && ctx.isLocal(viewer()) && !st.ships[viewer()] && ctx.canAct(viewer());
    /* ---------- layout ---------- */
    function layout() {
      const W = cv.w, H = cv.h, land = W > H * 1.1;
      if (st.phase === 'setup') {
        if (land) { const s = Math.min(H - 40, W - 220, 560); const bx = (W - s - 200) / 2; return {land, setup: {x: bx, y: (H - s) / 2 + 10, s}, side: {x: bx + s + 24, y: (H - s) / 2 + 10, w: 176}}; }
        const s = Math.min(W - 40, H - 200, 560); return {land, setup: {x: (W - s) / 2 + 8, y: Math.max(28, (H - s - 150) / 2 + 20), s}, side: null};
      }
      if (land) {
        const s1 = Math.min((W - 64) / 1.78, H - 44, 600), s2 = s1 * .78, gap = 40, tot = s1 + s2 + gap + 16, x0 = (W - tot) / 2 + 16;
        return {land, tgt: {x: x0, y: (H - s1) / 2 + 12, s: s1}, own: {x: x0 + s1 + gap, y: (H - s2) / 2 + 12, s: s2}};
      }
      const s1 = Math.min(W - 40, (H - 70) / 1.72, 560), s2 = s1 * .72, tot = s1 + s2 + 66, y0 = (H - tot) / 2 + 22;
      return {land, tgt: {x: (W - s1) / 2 + 8, y: y0, s: s1}, own: {x: (W - s2) / 2 + 8, y: y0 + s1 + 44, s: s2}};
    }
    const cellAt = (B, p) => { const c = B.s / N, x = Math.floor((p.x - B.x) / c), y = Math.floor((p.y - B.y) / c); return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1; };
    const shipAtLay = i => lay.findIndex(sh => cellsOf(sh).includes(i));
    const overlaps = (k, sh) => { const cs = new Set(cellsOf(sh)); return lay.some((o, j) => j !== k && cellsOf(o).some(c => cs.has(c))); };
    function tryPlace(k, sh, quiet) { if (!fits(sh) || overlaps(k, sh)) { if (!quiet) ctx.sfx('error'); return false; } lay[k] = sh; ctx.sfx('place'); return true; }
    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e);
      for (const b of btns) if (b.on && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.fn(); return; }
      const L = layout();
      if (needSetup()) {
        const i = cellAt(L.setup, p); if (i < 0) { sel = -1; return; }
        const k = shipAtLay(i);
        if (k >= 0) { const sh = lay[k]; drag = {k, off: sh.h ? (i % N) - sh.x : ((i / N) | 0) - sh.y, start: i, cur: i, wasSel: sel === k}; sel = k; ctx.sfx('select'); try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
        if (sel >= 0) { const sh = lay[sel]; const nx = sh.h ? Math.min(i % N, N - sh.len) : i % N, ny = sh.h ? (i / N) | 0 : Math.min((i / N) | 0, N - sh.len); tryPlace(sel, {x: nx, y: ny, h: sh.h, len: sh.len}); }
        return;
      }
      if (myTurn()) {
        const i = cellAt(L.tgt, p); if (i < 0 || st.shots[st.turn][i]) { aim = -1; return; }
        if (e.pointerType !== 'mouse' && aim !== i) { aim = i; ctx.sfx('tick'); return; }
        aim = -1; ctx.act({t: 'fire', i}, st.turn);
      }
    });
    ctx.on(cv.cv, 'pointermove', e => {
      const p = cv.pos(e), L = layout();
      if (drag && needSetup()) { const i = cellAt(L.setup, p); if (i >= 0) drag.cur = i; return; }
      if (e.pointerType === 'mouse' && L.tgt) hover = cellAt(L.tgt, p);
    });
    const up = e => {
      if (!drag) return; const d = drag; drag = null; if (!needSetup()) return;
      const sh = lay[d.k];
      if (d.cur !== d.start && e.type === 'pointerup') {
        const cx = d.cur % N, cy = (d.cur / N) | 0;
        const ns = {x: sh.h ? cx - d.off : cx, y: sh.h ? cy : cy - d.off, h: sh.h, len: sh.len};
        ns.x = BX.clamp(ns.x, 0, sh.h ? N - sh.len : N - 1); ns.y = BX.clamp(ns.y, 0, sh.h ? N - 1 : N - sh.len);
        tryPlace(d.k, ns);
      } else if (d.wasSel) rotate(d.k);
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    function rotate(k) {
      const sh = lay[k];
      // rotate around the first cell; if it does not fit, try shifting back
      for (let back = 0; back < sh.len; back++) {
        const ns = {x: sh.h ? sh.x : sh.x - back, y: sh.h ? sh.y - back : sh.y, h: !sh.h, len: sh.len};
        if (fits(ns) && !overlaps(k, ns)) { lay[k] = ns; ctx.sfx('whoosh'); return; }
      }
      ctx.sfx('error');
    }
    /* ---------- status ---------- */
    const status = () => {
      ctx.info(0, '击中 ' + st.hits[0]); ctx.info(1, '击中 ' + st.hits[1]);
      if (st.over) return ctx.status('<b>' + ctx.name(st.winner) + '</b> 全歼敌舰');
      if (st.phase === 'setup') return ctx.status(needSetup() ? (ctx.hotseat ? ctx.name(viewer()) + '：' : '') + '秘密布置你的舰队' : '等待对方布阵…');
      if (st.pend) return ctx.status(st.last ? (st.last.res === 0 ? '落空' : st.last.res === 1 ? '命中！' : '击沉' + SHIPN[st.last.k] + '！') : '');
      ctx.status(myTurn() ? (ctx.hotseat ? ctx.name(st.turn) + ' 开炮' : '轮到你开炮') : '等待 ' + ctx.name(st.turn) + ' 开炮…');
    };
    /* ---------- AI ---------- */
    function aiShot(seat, level) {
      const sh = st.shots[seat], opp = 1 - seat, sunkCells = new Set(), remain = [];
      FLEET.forEach((len, k) => { if (st.sunk[opp].includes(k)) cellsOf(st.ships[opp][k]).forEach(c => sunkCells.add(c)); else remain.push(len); });
      const unknown = [], liveHits = [];
      for (let i = 0; i < N * N; i++) { if (!sh[i]) unknown.push(i); else if (sh[i] === 2 && !sunkCells.has(i)) liveHits.push(i); }
      const rnd = a => a[Math.floor(Math.random() * a.length)];
      const nbrs = i => { const x = i % N, y = (i / N) | 0, o = []; if (x > 0) o.push(i - 1); if (x < N - 1) o.push(i + 1); if (y > 0) o.push(i - N); if (y < N - 1) o.push(i + N); return o; };
      if (level === 1) {
        if (liveHits.length && Math.random() < .55) { const c = liveHits.flatMap(nbrs).filter(i => !sh[i]); if (c.length) return rnd(c); }
        return rnd(unknown);
      }
      if (level === 2) {
        if (liveHits.length) {
          // extend lines of 2+ adjacent hits first
          const set = new Set(liveHits), line = [];
          for (const h of liveHits) for (const [d, ok] of [[1, x => x % N < N - 1], [N, () => true]]) {
            if (set.has(h + d) && ok(h)) {
              let a = h; while (set.has(a - d) && (d === N || a % N > 0)) a -= d;
              let b = h; while (set.has(b + d) && (d === N || b % N < N - 1)) b += d;
              if (d === 1) { if (a % N > 0 && !sh[a - 1]) line.push(a - 1); if (b % N < N - 1 && !sh[b + 1]) line.push(b + 1); }
              else { if (a - N >= 0 && !sh[a - N]) line.push(a - N); if (b + N < N * N && !sh[b + N]) line.push(b + N); }
            }
          }
          if (line.length) return rnd(line);
          const c = liveHits.flatMap(nbrs).filter(i => !sh[i]); if (c.length) return rnd(c);
        }
        const par = unknown.filter(i => ((i % N) + ((i / N) | 0)) % 2 === 0);
        return rnd(par.length ? par : unknown);
      }
      // level 3: probability density over every placement consistent with public information
      const dens = new Float64Array(N * N), hitSet = new Set(liveHits);
      for (const len of remain) for (const h of [true, false]) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const s = {x, y, h, len}; if (!fits(s)) continue;
        const cs = cellsOf(s); let bad = false, nh = 0;
        for (const c of cs) { if (sh[c] === 1 || sunkCells.has(c)) { bad = true; break; } if (hitSet.has(c)) nh++; }
        if (bad) continue;
        if (liveHits.length && !nh) { for (const c of cs) if (!sh[c]) dens[c] += 1; continue; }
        const w = liveHits.length ? Math.pow(40, nh) : 1;
        for (const c of cs) if (!sh[c]) dens[c] += w;
      }
      let best = [], bv = -1;
      for (const i of unknown) { let v = dens[i]; if (!liveHits.length && ((i % N) + ((i / N) | 0)) % 2) v *= .9; if (v > bv + 1e-9) { bv = v; best = [i]; } else if (Math.abs(v - bv) < 1e-9) best.push(i); }
      return best.length ? rnd(best) : rnd(unknown);
    }
    /* ---------- apply ---------- */
    const inst = {
      st,
      toMove() {
        if (st.over) return null;
        if (st.phase === 'setup') return [0, 1].filter(s => !st.ships[s]);
        return st.pend ? null : st.turn;
      },
      valid(a, by) {
        if (a.t === 'place') return st.phase === 'setup' && !st.ships[by] && validFleet(a.ships);
        if (a.t === 'fire') return st.phase === 'play' && !st.pend && by === st.turn && Number.isInteger(a.i) && a.i >= 0 && a.i < N * N && !st.shots[by][a.i];
        return false;
      },
      sysMove: () => st.pend && !st.over ? {a: {t: 'next'}, delay: 1000} : null,
      apply(a, by) {
        if (a.t === 'place') {
          st.ships[by] = a.ships.map(s => ({x: s.x, y: s.y, h: !!s.h, len: s.len}));
          ctx.sfx('chip');
          if (st.ships[0] && st.ships[1]) { st.phase = 'play'; st.turn = 0; ctx.sfx('gong'); ann = {txt: '开战！', t: 1.4, c: '#ffe6a8'}; }
          status(); return;
        }
        if (a.t === 'next') { st.pend = false; st.turn = 1 - st.turn; status(); return; }
        if (a.t === 'fire') {
          const s = st.turn, opp = 1 - s, ships = st.ships[opp];
          const k = ships.findIndex(sh => cellsOf(sh).includes(a.i));
          let res = 0;
          if (k < 0) { st.shots[s][a.i] = 1; }
          else {
            st.shots[s][a.i] = 2; st.hits[s]++; res = 1;
            if (cellsOf(ships[k]).every(c => st.shots[s][c] === 2)) { st.sunk[opp].push(k); res = 2; }
          }
          st.last = {by: s, i: a.i, res, k}; st.pend = true;
          boom = {by: s, i: a.i, res, k: 0}; const bm = boom; ctx.anim(650, q => bm.k = q, null, BX.ease.out);
          ctx.sfx(res === 0 ? 'splash' : res === 1 ? 'boom' : 'crash');
          const shooterIsMe = s === viewer();
          ann = {txt: res === 0 ? '落空' : res === 1 ? '命中！' : '击沉' + SHIPN[k] + '！', t: 1.1, c: res === 0 ? '#cfe6f0' : res === 1 ? '#ffb070' : '#ff7a5a', on: shooterIsMe ? 'tgt' : 'own'};
          if (st.sunk[opp].length === FLEET.length) {
            st.over = true; st.winner = s; st.pend = false; status();
            ctx.end({winner: s, delay: 1500, text: ctx.name(s) + ' 共开炮 ' + st.shots[s].filter(x => x).length + ' 次，全歼敌舰'});
            return;
          }
          status();
        }
      },
      aiMove(seat, level) {
        if (st.phase === 'setup') return {t: 'place', ships: randomFleet(Math.random, level >= 3)};
        return {t: 'fire', i: aiShot(seat, level)};
      },
      onTurn: status,
      onView() { lay = randomFleet(Math.random); sel = -1; aim = -1; },
      frame(dt) {
        const g = cv.g; cv.clear(); t += dt; btns = [];
        const L = layout(), me = viewer();
        if (st.phase === 'setup') {
          if (needSetup()) {
            const B = L.setup;
            D.text(g, '布置你的舰队', B.x + B.s / 2, B.y - 30, {size: 17, color: '#f3e2c0', font: 'deco', weight: 400});
            drawSea(g, B, 'own');
            lay.forEach((sh, k) => {
              let s2 = sh;
              if (drag && drag.k === k && drag.cur !== drag.start) {
                const cx = drag.cur % N, cy = (drag.cur / N) | 0;
                s2 = {x: BX.clamp(sh.h ? cx - drag.off : cx, 0, sh.h ? N - sh.len : N - 1), y: BX.clamp(sh.h ? cy : cy - drag.off, 0, sh.h ? N - 1 : N - sh.len), h: sh.h, len: sh.len};
                g.globalAlpha = .35; shipOn(g, B, sh, PCOL[me]); g.globalAlpha = .85;
              }
              shipOn(g, B, s2, PCOL[me], k === sel); g.globalAlpha = 1;
            });
            const bw = L.side ? L.side.w : Math.min(150, (B.s - 20) / 3), bh = 46;
            const items = [['随机布置', () => { lay = randomFleet(Math.random); sel = -1; ctx.sfx('shuffle'); }, {}],
              ['旋转选中', () => sel >= 0 ? rotate(sel) : ctx.toast('先点一艘船'), {on: sel >= 0}],
              ['确认布阵', () => { if (validFleet(lay)) { sel = -1; ctx.act({t: 'place', ships: lay.map(s => ({x: s.x, y: s.y, h: s.h, len: s.len}))}, me); } }, {red: true}]];
            items.forEach(([lb, fn, o], i) => {
              const x = L.side ? L.side.x : B.x + B.s / 2 - (bw * 3 + 20) / 2 + i * (bw + 10), y = L.side ? L.side.y + 30 + i * (bh + 14) : B.y + B.s + 22;
              button(g, x, y, bw, bh, lb, Object.assign({fn}, o));
            });
            const tip = sel >= 0 ? '点海面移动 · 再点该船旋转' : '点一艘船选中它';
            if (L.side) { D.text(g, tip, L.side.x + bw / 2, L.side.y + 30 + 3 * (bh + 14) + 8, {size: 12, color: 'rgba(243,226,192,.75)', weight: 500, maxW: bw}); }
            else D.text(g, tip, B.x + B.s / 2, B.y + B.s + 22 + bh + 22, {size: 13, color: 'rgba(243,226,192,.75)', weight: 500});
            // fleet legend
            if (L.side) FLEET.forEach((len, k) => D.text(g, SHIPN[k] + ' ' + len + ' 格', L.side.x + 4, L.side.y + 30 + 3 * (bh + 14) + 36 + k * 20, {size: 13, color: k === sel ? C.gold2 : 'rgba(243,226,192,.6)', align: 'left', weight: 600}));
          } else {
            const W = cv.w, H = cv.h, s = Math.min(W - 40, H - 120, 420), B = {x: (W - s) / 2, y: (H - s) / 2 + 10, s};
            drawSea(g, B, 'own');
            if (st.ships[me] && ctx.isLocal(me)) st.ships[me].forEach(sh => shipOn(g, B, sh, PCOL[me]));
            const dots = '.'.repeat(1 + Math.floor(t * 2) % 3);
            D.text(g, '等待对方布阵' + dots, W / 2, B.y - 26, {size: 18, color: '#f3e2c0', font: 'deco', weight: 400});
          }
          drawAnn(g, L);
          return;
        }
        // play phase: target board (opponent's sea, my shots) and own board
        const opp = 1 - me;
        const T = L.tgt, O = L.own;
        const turnMine = st.turn === me && !st.over;
        D.text(g, '敌方海域 · ' + ctx.name(opp), T.x + T.s / 2, T.y - 24, {size: Math.min(16, T.s / 22), color: turnMine ? C.gold2 : 'rgba(243,226,192,.7)', weight: 700});
        D.text(g, '我方舰队 · ' + ctx.name(me), O.x + O.s / 2, O.y - 24, {size: Math.min(15, O.s / 20), color: !turnMine && !st.over ? C.gold2 : 'rgba(243,226,192,.7)', weight: 700});
        drawSea(g, T, 'tgt', turnMine);
        const c1 = T.s / N;
        // sunk enemy ships revealed (all at the end)
        st.ships[opp].forEach((sh, k) => { if (st.sunk[opp].includes(k) || st.over) { g.globalAlpha = st.sunk[opp].includes(k) ? 1 : .6; shipOn(g, T, sh, PCOL[opp], false, st.sunk[opp].includes(k)); g.globalAlpha = 1; } });
        drawMarks(g, T, st.shots[me], me);
        // aim / hover
        const gh = aim >= 0 ? aim : hover;
        if (myTurn() && gh >= 0 && !st.shots[me][gh]) {
          const x = T.x + (gh % N + .5) * c1, y = T.y + (((gh / N) | 0) + .5) * c1, pul = 1 + .08 * Math.sin(t * 8);
          g.strokeStyle = aim >= 0 ? '#ff6a4a' : 'rgba(255,220,170,.8)'; g.lineWidth = 2.5;
          D.circle(g, x, y, c1 * .38 * pul); g.stroke();
          g.beginPath(); g.moveTo(x - c1 * .5, y); g.lineTo(x - c1 * .18, y); g.moveTo(x + c1 * .18, y); g.lineTo(x + c1 * .5, y); g.moveTo(x, y - c1 * .5); g.lineTo(x, y - c1 * .18); g.moveTo(x, y + c1 * .18); g.lineTo(x, y + c1 * .5); g.stroke();
          if (aim >= 0) D.text(g, '再点开火', x, y - c1 * .72, {size: 12, color: '#fff', weight: 800, stroke: 'rgba(0,0,0,.6)', strokeW: 3});
        }
        // own board
        drawSea(g, O, 'own');
        st.ships[me].forEach((sh, k) => shipOn(g, O, sh, PCOL[me], false, st.sunk[me].includes(k)));
        drawMarks(g, O, st.shots[opp], opp);
        // shot effect
        if (boom && boom.k < 1) {
          const B = boom.by === me ? T : O, c = B.s / N, x = B.x + (boom.i % N + .5) * c, y = B.y + (((boom.i / N) | 0) + .5) * c, k = boom.k;
          if (boom.res === 0) { g.strokeStyle = `rgba(230,245,255,${1 - k})`; g.lineWidth = 3; D.circle(g, x, y, c * (.2 + k * 1.1)); g.stroke(); D.circle(g, x, y, c * (.1 + k * .6)); g.stroke(); }
          else { g.fillStyle = `rgba(255,${150 + 80 * (1 - k) | 0},60,${1 - k})`; D.circle(g, x, y, c * (.3 + k * 1.4)); g.fill(); g.fillStyle = `rgba(255,250,200,${1 - k})`; D.circle(g, x, y, c * (.2 + k * .6)); g.fill(); }
        }
        // fleet status: remaining enemy ships
        const fy = T.y + T.s + 8, fs = Math.min(12, T.s / 32);
        if (!L.land || true) {
          let x = T.x;
          FLEET.forEach((len, k) => { const sunk = st.sunk[opp].includes(k); D.text(g, SHIPN[k], x, fy + 7, {size: fs, color: sunk ? 'rgba(243,226,192,.3)' : '#f3e2c0', align: 'left', weight: 700}); if (sunk) { g.strokeStyle = C.red2; g.lineWidth = 2; g.beginPath(); g.moveTo(x, fy + 7); g.lineTo(x + fs * 2, fy + 7); g.stroke(); } x += T.s / 5; });
        }
        drawAnn(g, L);
      },
    };
    function button(g, x, y, w, h, label, o = {}) {
      const on = o.on !== false;
      g.save(); g.globalAlpha = on ? 1 : .4;
      const c1 = o.red ? '#d0533f' : '#e6c57d', c2 = o.red ? '#a33022' : '#c8a052', sh = o.red ? '#6e1d14' : '#8a6a2c';
      g.fillStyle = sh; D.rr(g, x, y + 3, w, h, 11); g.fill();
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; D.rr(g, x, y, w, h, 11); g.fill();
      D.text(g, label, x + w / 2, y + h / 2 + 1, {size: Math.min(16, w / 5.2), color: o.red ? '#fff3e3' : '#3a2410', weight: 800});
      g.restore(); btns.push({x, y, w, h: h + 4, on, fn: o.fn});
    }
    function drawSea(g, B, kind, active) {
      const c = B.s / N;
      g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, B.x - 4, B.y + 2, B.s + 12, B.s + 10, 10); g.fill();
      D.wood(g, B.x - 6, B.y - 6, B.s + 12, B.s + 12, {r: 8, seed: kind === 'tgt' ? 3 : 8, base: '#7a4a28', dark: '#3a1a0a'});
      const gr = g.createLinearGradient(B.x, B.y, B.x + B.s, B.y + B.s);
      if (kind === 'tgt') { gr.addColorStop(0, '#1f4f66'); gr.addColorStop(1, '#123445'); } else { gr.addColorStop(0, '#2f6f8a'); gr.addColorStop(1, '#1d4b60'); }
      g.fillStyle = gr; g.fillRect(B.x, B.y, B.s, B.s);
      // waves
      g.save(); g.beginPath(); g.rect(B.x, B.y, B.s, B.s); g.clip();
      g.strokeStyle = 'rgba(200,235,250,.08)'; g.lineWidth = 1.2;
      for (let j = 0; j < 14; j++) { g.beginPath(); const yy = B.y + (j + .5) * B.s / 14; for (let x = 0; x <= B.s; x += 6) { const v = yy + Math.sin(x * .07 + t * 1.2 + j) * 2; x ? g.lineTo(B.x + x, v) : g.moveTo(B.x, v); } g.stroke(); }
      g.restore();
      D.grid(g, B.x, B.y, N, N, c, 'rgba(200,230,240,.2)', 1);
      if (active) { g.strokeStyle = `rgba(255,215,120,${.55 + .3 * Math.sin(t * 4)})`; g.lineWidth = 3; g.strokeRect(B.x - 2, B.y - 2, B.s + 4, B.s + 4); }
      const fs = Math.max(8, Math.min(12, c * .36));
      for (let i = 0; i < N; i++) {
        D.text(g, COLL[i], B.x + (i + .5) * c, B.y - 6 - fs * .55, {size: fs, color: 'rgba(243,226,192,.6)', weight: 500});
        D.text(g, ROWL[i], B.x - 6 - fs * .6, B.y + (i + .5) * c, {size: fs, color: 'rgba(243,226,192,.6)', weight: 500});
      }
    }
    function shipOn(g, B, sh, col, selected, sunk) {
      const c = B.s / N, x = B.x + sh.x * c, y = B.y + sh.y * c, w = sh.h ? sh.len * c : c, h = sh.h ? c : sh.len * c;
      drawShip(g, x, y, w, h, sh.h, sunk ? '#4a3a30' : '#8a5a34', sh.len, col);
      if (sunk) { g.fillStyle = 'rgba(20,10,5,.45)'; D.rr(g, x + 2, y + 2, w - 4, h - 4, c * .3); g.fill(); }
      if (selected) { g.strokeStyle = '#ffd76a'; g.lineWidth = 3; D.rr(g, x + 1, y + 1, w - 2, h - 2, c * .4); g.stroke(); }
    }
    function drawMarks(g, B, shots) {
      const c = B.s / N;
      for (let i = 0; i < N * N; i++) {
        const v = shots[i]; if (!v) continue;
        const x = B.x + (i % N + .5) * c, y = B.y + (((i / N) | 0) + .5) * c;
        if (v === 1) { g.fillStyle = 'rgba(230,245,255,.75)'; D.circle(g, x, y, c * .13); g.fill(); g.strokeStyle = 'rgba(230,245,255,.35)'; g.lineWidth = 1; D.circle(g, x, y, c * .27); g.stroke(); }
        else fire(g, x, y, c * .36, t);
        if (st.last && st.last.i === i && shots === st.shots[st.last.by]) { g.strokeStyle = '#ffd76a'; g.lineWidth = 2; g.strokeRect(x - c / 2 + 1.5, y - c / 2 + 1.5, c - 3, c - 3); }
      }
    }
    function drawAnn(g, L) {
      if (!ann) return; ann.t -= 1 / 60; if (ann.t <= 0) { ann = null; return; }
      const B = ann.on === 'own' ? L.own : ann.on === 'tgt' ? L.tgt : null;
      const x = B ? B.x + B.s / 2 : cv.w / 2, y = B ? B.y + B.s / 2 : cv.h / 2, a = Math.min(1, ann.t * 2), z = Math.min(48, (B ? B.s : 300) / 7);
      D.text(g, ann.txt, x, y, {size: z * (1 + (1 - Math.min(1, (1.1 - ann.t) * 6)) * .3), color: D.alpha(ann.c, a), font: 'deco', weight: 400, stroke: `rgba(30,10,5,${a * .8})`, strokeW: 6});
    }
    status();
    return inst;
  },
});
function drawShip(g, x, y, w, h, horiz, wood, len, flag) {
  const pad = Math.min(w, h) * .12, L = horiz ? w : h, S = horiz ? h : w;
  g.save(); g.translate(x + w / 2, y + h / 2); if (!horiz) g.rotate(Math.PI / 2);
  const hl = L / 2 - pad, hs = S / 2 - pad;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 3, hl, hs * .9, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(0, -hs, 0, hs); gr.addColorStop(0, D.shade(wood, 25)); gr.addColorStop(.5, wood); gr.addColorStop(1, D.shade(wood, -35));
  g.fillStyle = gr; g.beginPath();
  g.moveTo(-hl, -hs * .55); g.quadraticCurveTo(-hl * .7, -hs, -hl * .4, -hs); g.lineTo(hl * .55, -hs); g.quadraticCurveTo(hl, -hs * .6, hl, 0); g.quadraticCurveTo(hl, hs * .6, hl * .55, hs); g.lineTo(-hl * .4, hs); g.quadraticCurveTo(-hl * .7, hs, -hl, hs * .55); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,20,8,.6)'; g.lineWidth = 1; g.stroke();
  // deck planks
  g.strokeStyle = 'rgba(40,20,8,.25)'; g.beginPath(); g.moveTo(-hl * .8, 0); g.lineTo(hl * .85, 0); g.stroke();
  // cabins / masts per cell
  const cell = L / len;
  for (let k = 0; k < len; k++) {
    const cx = -L / 2 + (k + .5) * cell;
    if (k === 0) { g.fillStyle = D.shade(wood, -20); D.rr(g, cx - cell * .28, -hs * .55, cell * .56, hs * 1.1, 3); g.fill(); }
    else { g.fillStyle = '#efe2c4'; D.circle(g, cx, 0, Math.min(cell, S) * .13); g.fill(); g.strokeStyle = 'rgba(40,20,8,.5)'; g.stroke(); }
  }
  if (flag) { g.fillStyle = flag; g.beginPath(); g.moveTo(hl * .55, -2); g.lineTo(hl * .55 + Math.min(cell, S) * .3, -hs * .45); g.lineTo(hl * .55, -hs * .7); g.closePath(); g.fill(); }
  g.restore();
}
function fire(g, x, y, r, t) {
  const f = 1 + .12 * Math.sin(t * 12 + x);
  const gr = g.createRadialGradient(x, y, 0, x, y, r * f); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.35, '#ffb040'); gr.addColorStop(.75, '#d0381f'); gr.addColorStop(1, 'rgba(120,20,10,0)');
  g.fillStyle = gr; D.circle(g, x, y, r * f); g.fill();
  g.strokeStyle = 'rgba(40,10,5,.8)'; g.lineWidth = Math.max(1.5, r * .16); g.beginPath(); g.moveTo(x - r * .5, y - r * .5); g.lineTo(x + r * .5, y + r * .5); g.moveTo(x + r * .5, y - r * .5); g.lineTo(x - r * .5, y + r * .5); g.stroke();
}
