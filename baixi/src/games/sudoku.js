/* 数独 — 单人。唯一解生成器（按提示数 + 解题技巧分级），笔记、高亮、冲突标记、提示、撤销、计时。 */
const D = BX.draw, K = BX.data.slkit;
const LVN = {0: '入门', 1: '简单', 2: '中等', 3: '困难'};
const ROW = i => (i / 9) | 0, COL = i => i % 9, BOX = i => ((ROW(i) / 3) | 0) * 3 + ((COL(i) / 3) | 0);
const UNITS = []; for (let r = 0; r < 9; r++) UNITS.push(BX.range(9).map(c => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push(BX.range(9).map(r => r * 9 + c));
for (let b = 0; b < 9; b++) UNITS.push(BX.range(9).map(k => (((b / 3) | 0) * 3 + ((k / 3) | 0)) * 9 + (b % 3) * 3 + (k % 3)));
const PEERS = BX.range(81).map(i => { const s = new Set(); for (const u of UNITS) if (u.includes(i)) for (const j of u) if (j !== i) s.add(j); return [...s]; });
const CELLU = BX.range(81).map(i => [ROW(i), 9 + COL(i), 18 + BOX(i)]);
const POP = new Uint8Array(512); for (let m = 1; m < 512; m++) POP[m] = POP[m >> 1] + (m & 1);
const BITV = m => { for (let v = 0; v < 9; v++) if (m === 1 << v) return v + 1; return 0; };

/* count solutions (stop at limit) — bitmask backtracking with MRV */
function countSol(b, limit = 2, out) {
  const g = b.slice(); const rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
  for (let i = 0; i < 81; i++) if (g[i]) { const m = 1 << (g[i] - 1); if ((rm[ROW(i)] | cm[COL(i)] | bm[BOX(i)]) & m) return 0; rm[ROW(i)] |= m; cm[COL(i)] |= m; bm[BOX(i)] |= m; }
  let n = 0;
  const rec = () => {
    let best = -1, bc = 10, bmask = 0;
    for (let i = 0; i < 81; i++) if (!g[i]) { const av = ~(rm[ROW(i)] | cm[COL(i)] | bm[BOX(i)]) & 511, c = POP[av]; if (c < bc) { bc = c; best = i; bmask = av; if (c <= 1) break; } }
    if (best < 0) { n++; if (out && n === 1) out.push(...g); return n >= limit; }
    if (!bc) return false;
    const r = ROW(best), c = COL(best), x = BOX(best);
    for (let v = 0; v < 9; v++) if (bmask & (1 << v)) {
      const m = 1 << v; g[best] = v + 1; rm[r] |= m; cm[c] |= m; bm[x] |= m;
      if (rec()) return true;
      rm[r] &= ~m; cm[c] &= ~m; bm[x] &= ~m; g[best] = 0;
    }
    return false;
  };
  rec(); return n;
}
function fullGrid(rng) {
  const g = new Array(81).fill(0);
  const rec = i => {
    if (i === 81) return true;
    const used = new Set(PEERS[i].map(j => g[j]));
    for (const v of rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) if (!used.has(v)) { g[i] = v; if (rec(i + 1)) return true; }
    g[i] = 0; return false;
  };
  rec(0); return g;
}
/* logical solver; returns max technique level used (0 naked/hidden singles … 1 pairs/pointing/box-line … 2 triples/x-wing) or 9 if stuck */
function rate(b, maxLv = 2) {
  const g = b.slice(), cand = new Uint16Array(81);
  for (let i = 0; i < 81; i++) if (!g[i]) { let m = 511; for (const j of PEERS[i]) if (g[j]) m &= ~(1 << (g[j] - 1)); cand[i] = m; }
  const set = (i, v) => { g[i] = v; cand[i] = 0; const m = ~(1 << (v - 1)); for (const j of PEERS[i]) cand[j] &= m; };
  let used = 0, left = g.filter(x => !x).length;
  const singles = () => {
    let any = false;
    for (let i = 0; i < 81; i++) if (!g[i]) { if (!cand[i]) return -1; if (POP[cand[i]] === 1) { set(i, BITV(cand[i])); left--; any = true; } }
    for (const u of UNITS) for (let v = 0; v < 9; v++) {
      const m = 1 << v; let pos = -1, c = 0, has = false;
      for (const i of u) { if (g[i] === v + 1) { has = true; break; } if (cand[i] & m) { c++; pos = i; } }
      if (has) continue; if (!c) return -1; if (c === 1) { set(pos, v + 1); left--; any = true; }
    }
    return any ? 1 : 0;
  };
  const elim1 = () => {   // naked pairs, pointing pairs, box/line reduction, hidden pairs
    let any = false;
    for (const u of UNITS) {
      const cells = u.filter(i => !g[i]);
      for (let a = 0; a < cells.length; a++) if (POP[cand[cells[a]]] === 2) for (let b2 = a + 1; b2 < cells.length; b2++) if (cand[cells[b2]] === cand[cells[a]]) {
        for (const k of cells) if (k !== cells[a] && k !== cells[b2] && (cand[k] & cand[cells[a]])) { cand[k] &= ~cand[cells[a]]; any = true; }
      }
      for (let v = 0; v < 9; v++) for (let w = v + 1; w < 9; w++) {
        const pv = cells.filter(i => cand[i] & (1 << v)), pw = cells.filter(i => cand[i] & (1 << w));
        if (pv.length === 2 && pw.length === 2 && pv[0] === pw[0] && pv[1] === pw[1]) { const m = (1 << v) | (1 << w); for (const i of pv) if (cand[i] !== m) { cand[i] = m; any = true; } }
      }
    }
    for (let u = 0; u < 27; u++) for (let v = 0; v < 9; v++) {
      const m = 1 << v, pos = UNITS[u].filter(i => !g[i] && (cand[i] & m)); if (pos.length < 2) continue;
      for (let k = 0; k < 3; k++) {   // all candidates share another unit
        const ou = CELLU[pos[0]][k]; if (ou === u || !pos.every(i => CELLU[i][k] === ou)) continue;
        for (const j of UNITS[ou]) if (!g[j] && !pos.includes(j) && (cand[j] & m)) { cand[j] &= ~m; any = true; }
      }
    }
    return any;
  };
  const elim2 = () => {   // naked triples + X-wing
    let any = false;
    for (const u of UNITS) {
      const cells = u.filter(i => !g[i] && POP[cand[i]] <= 3);
      for (let a = 0; a < cells.length; a++) for (let b2 = a + 1; b2 < cells.length; b2++) for (let c = b2 + 1; c < cells.length; c++) {
        const m = cand[cells[a]] | cand[cells[b2]] | cand[cells[c]]; if (POP[m] !== 3) continue;
        for (const k of u) if (!g[k] && k !== cells[a] && k !== cells[b2] && k !== cells[c] && (cand[k] & m)) { cand[k] &= ~m; any = true; }
      }
    }
    for (let v = 0; v < 9; v++) { const m = 1 << v;
      for (const off of [0, 9]) {
        const lines = BX.range(9).map(r => UNITS[off + r].filter(i => !g[i] && (cand[i] & m)).map(i => off ? ROW(i) : COL(i)));
        for (let r1 = 0; r1 < 9; r1++) if (lines[r1].length === 2) for (let r2 = r1 + 1; r2 < 9; r2++) if (lines[r2].length === 2 && lines[r2][0] === lines[r1][0] && lines[r2][1] === lines[r1][1]) {
          for (const cc of lines[r1]) for (const j of UNITS[(off ? 0 : 9) + cc]) { const rr = off ? COL(j) : ROW(j); if (rr !== r1 && rr !== r2 && !g[j] && (cand[j] & m)) { cand[j] &= ~m; any = true; } }
        }
      }
    }
    return any;
  };
  for (let guard = 0; guard < 400 && left > 0; guard++) {
    const s = singles(); if (s < 0) return 9; if (s) continue;
    if (maxLv >= 1 && elim1()) { used = Math.max(used, 1); continue; }
    if (maxLv >= 2 && elim2()) { used = Math.max(used, 2); continue; }
    return 9;
  }
  return left ? 9 : used;
}
/* generate: returns {p, s} */
function generate(lv, rng) {
  const target = [44, 36, 30, 24][lv];
  let best = null;
  const t0 = performance.now();
  for (let attempt = 0; attempt < 30; attempt++) {
    const sol = fullGrid(rng), p = sol.slice();
    const order = rng.shuffle(BX.range(81));
    let clues = 81;
    for (const i of order) {
      if (clues <= target) break;
      const j = 80 - i; const pair = j !== i && p[j] && lv >= 1 && rng() < .55;   // symmetric digging looks classic
      const v1 = p[i], v2 = p[j]; if (!v1) continue;
      p[i] = 0; if (pair) p[j] = 0;
      let ok = countSol(p, 2) === 1;
      if (ok && lv <= 1) ok = rate(p, 0) === 0;
      if (ok && lv === 2) ok = rate(p, 2) <= 2;
      if (ok) clues -= pair ? 2 : 1; else { p[i] = v1; if (pair) p[j] = v2; }
    }
    const r = rate(p, 2);
    const good = lv <= 1 ? r === 0 : lv === 2 ? r >= 1 && r <= 2 : r >= 2;
    const score = (good ? 0 : 100) + Math.abs(clues - target);
    if (!best || score < best.score) best = {p, s: sol, score, clues, r};
    if (good && clues <= target + (lv === 3 ? 3 : 2)) break;
    if (performance.now() - t0 > 1400) break;
  }
  return best;
}

BX.register({
  id: 'sudoku', title: '数独', cat: 'solo', order: 3, sub: '九宫格填数，逻辑推理',
  desc: '每道题都有唯一解，难度按提示数与所需推理技巧分为入门、简单、中等、困难四级。支持笔记、高亮、冲突提示、提示与撤销。',
  kind: 'solo',
  options: [
    {key: 'lv', label: '难度', choices: [[0, '入门'], [1, '简单'], [2, '中等'], [3, '困难']], def: 1},
    {key: 'mis', label: '错误', choices: [[0, '不限错误'], [3, '错 3 次结束']], def: 0},
  ],
  rules: `<p>在 9×9 的盘面中填入数字 1–9，使<b>每一行、每一列、每个 3×3 宫</b>内的数字都不重复。题目给出的数字（深色）不能修改，每道题有且只有一个解。</p>
<p><b>操作</b>：点选格子，再点下方数字键填入（也可以先选数字再连续点格子）。键盘可用 1–9、方向键、退格删除、N 切换笔记。<br>
· <b>笔记</b>：打开后填入的是小号候选数，再点一次同一数字可去掉；填入正式数字时，同行同列同宫的相关笔记会自动清除。<br>
· 选中格子时会高亮所在行、列、宫以及盘面上所有相同的数字；违反规则的重复数字会标红。<br>
· <b>提示</b>：替你正确填出一格（优先填选中的格子）。<b>撤销</b>次数不限。</p>
<p><b>难度</b>：入门/简单只需"唯一候选数"与"排除法"即可解出；中等需要数对、区块等技巧；困难需要三链数、X-Wing 等进阶技巧或更细致的推理。</p>
<p>选择"错 3 次结束"时，填入与答案不符的数字记一次错误，满 3 次本局失败。数字键上的小数字表示该数字还剩几个未填。进度自动保存。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#f3e9d2'});
    const s = h * .8 / 9, ox = (w - 9 * s) / 2, oy = h * .1;
    g.fillStyle = 'rgba(200,160,82,.25)'; g.fillRect(ox + 3 * s, oy, 3 * s, 9 * s); g.fillRect(ox, oy + 3 * s, 9 * s, 3 * s);
    D.grid(g, ox, oy, 9, 9, s, 'rgba(60,40,20,.35)', .7); D.grid(g, ox, oy, 3, 3, s * 3, '#2b2118', 1.6);
    const v = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
    for (let i = 0; i < 81; i++) if (v[i] !== '.') D.text(g, v[i], ox + (i % 9 + .5) * s, oy + ((i / 9 | 0) + .55) * s, {size: s * .8, color: i % 7 === 3 ? '#b23a2b' : '#2b2118', weight: 700, font: 'serif'});
    K.seal(g, w * .9, h * .82, h * .2, '独');
  },
  create(ctx) {
    const lv = +(ctx.opts.lv != null ? ctx.opts.lv : 1), MIS = +ctx.opts.mis || 0;
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let P, S, cur, notes, given, time = 0, sel = -1, numSel = 0, noteMode = false, mistakes = 0, won = false, lost = false, undoS = [], hintCnt = 0, moves = 0;
    let pulse = new Float32Array(81), unitFlash = [], banner = null, errCell = -1, errT = 0;
    const key = 'cur_' + lv + '_' + MIS;
    function fresh() {
      const r = generate(lv, ctx.rng);
      P = r.p; S = r.s; cur = P.slice(); notes = new Array(81).fill(0); given = P.map(v => !!v); time = 0; mistakes = 0; undoS = []; hintCnt = 0; moves = 0;
      BX.range(81).forEach(i => pulse[i] = given[i] ? -(ROW(i) + COL(i)) * .03 : 1);
    }
    fresh();
    const bar = K.bar(ctx, [
      {k: 'undo', ic: '↶', t: '撤销', on: () => undo()},
      {k: 'erase', ic: '⌫', t: '擦除', on: () => erase()},
      {k: 'note', ic: '✎', t: '笔记', on: () => { noteMode = !noteMode; bar.on('note', noteMode); ctx.sfx('tick'); }},
      {k: 'hint', ic: '☞', t: '提示', on: () => hint()},
      {k: 'new', ic: '↻', t: '新题', on: async () => { if (moves && !won && !lost && !(await BX.confirm('放弃这道题，换一道新题？', '新题'))) return; ctx.save(key, null); ctx.restart(); }},
    ]);
    const sv = ctx.load(key, null);
    if (sv && sv.P && sv.moves > 0) {
      K.css();
      banner = BX.h('div', {class: 'sk-ban'}, BX.h('span', {text: '有未完成的题目'}),
        BX.h('button', {class: 'bx-btn jade', text: '继续', on: {click: e => { e.stopPropagation(); P = sv.P; S = sv.S; cur = sv.cur; notes = sv.notes; given = P.map(v => !!v); time = sv.time; mistakes = sv.mistakes; moves = sv.moves; hintCnt = sv.hintCnt || 0; undoS = []; pulse.fill(1); hideBan(); ctx.sfx('flip'); }}}),
        BX.h('button', {class: 'bx-btn ghost', text: '✕', on: {click: e => { e.stopPropagation(); hideBan(); }}}));
      banner.addEventListener('pointerdown', e => e.stopPropagation());
      ctx.el.append(banner);
    }
    function hideBan() { if (banner) { banner.remove(); banner = null; } }
    const save = () => { if (!won && !lost) ctx.save(key, {P, S, cur, notes, time: Math.floor(time), mistakes, moves, hintCnt}); };
    const push = () => { undoS.push(JSON.stringify([cur, notes, mistakes])); if (undoS.length > 500) undoS.shift(); hideBan(); };
    function undo() { if (!undoS.length || won || lost) { ctx.sfx('error'); return; } [cur, notes, mistakes] = JSON.parse(undoS.pop()); ctx.sfx('whoosh'); save(); }
    const conflict = i => cur[i] && PEERS[i].some(j => cur[j] === cur[i]);
    const countOf = v => cur.reduce((a, x) => a + (x === v), 0);
    function place(i, v, viaHint) {
      if (won || lost || i < 0 || given[i]) return;
      if (noteMode && !viaHint) {
        if (cur[i]) { ctx.sfx('error'); return; }
        push(); notes[i] ^= 1 << (v - 1); ctx.sfx('pen'); moves++; save(); return;
      }
      if (cur[i] === v) { if (!viaHint) { push(); cur[i] = 0; moves++; ctx.sfx('tick'); save(); } return; }
      push(); cur[i] = v; notes[i] = 0; moves++;
      for (const j of PEERS[i]) notes[j] &= ~(1 << (v - 1));
      pulse[i] = 0;
      if (v !== S[i] && MIS) {
        mistakes++; errCell = i; errT = .6; ctx.sfx('buzz');
        if (mistakes >= MIS) { lost = true; ctx.save(key, null); ctx.end({win: false, title: '错误已满 3 次', text: `用时 ${K.fmt(time)} · 已填 ${cur.filter((x, k) => x && x === S[k]).length}/81`, delay: 900}); }
        save(); return;
      }
      ctx.sfx(conflict(i) ? 'error' : 'stone');
      // completed units flash
      for (const u of CELLU[i]) if (UNITS[u].every(k => cur[k] && cur[k] === S[k])) { unitFlash.push({u, t: 0}); }
      if (cur.every((x, k) => x === S[k])) win();
      save();
    }
    function erase() { if (sel < 0 || given[sel] || won || lost) return; if (!cur[sel] && !notes[sel]) return; push(); cur[sel] = 0; notes[sel] = 0; moves++; ctx.sfx('tick'); save(); }
    function hint() {
      if (won || lost) return;
      let i = sel >= 0 && !given[sel] && cur[sel] !== S[sel] ? sel : -1;
      if (i < 0) { // easiest: empty cell with fewest candidates
        let bc = 10; for (let k = 0; k < 81; k++) if (cur[k] !== S[k]) { let m = 511; for (const j of PEERS[k]) if (cur[j]) m &= ~(1 << (cur[j] - 1)); const c = POP[m] || 9; if (c < bc) { bc = c; i = k; } }
      }
      if (i < 0) return;
      const nm = noteMode; noteMode = false; sel = i; numSel = S[i]; hintCnt++;
      place(i, S[i], true); noteMode = nm; pulse[i] = -.15;
      ctx.sfx('bell');
    }
    function win() {
      won = true; ctx.save(key, null);
      const secs = Math.floor(time), b = ctx.best('t_' + lv, secs, 'min');
      ctx.save('solved_' + lv, ctx.load('solved_' + lv, 0) + 1);
      for (let k = 0; k < 81; k++) pulse[k] = -(Math.abs(ROW(k) - 4) + Math.abs(COL(k) - 4)) * .06;
      fx.rain(cv.w, cv.h, 60);
      ctx.end({win: true, title: '解题成功', text: `用时 ${K.fmt(secs)} 步数 ${moves}` + (hintCnt ? ` · 提示 ${hintCnt} 次` : '') + (b.isNew ? ' · 新纪录！' : ` · 最快 ${K.fmt(b.best)}`), delay: 1600});
    }

    /* ---------- layout ---------- */
    let L = null;
    function layout() {
      const A = bar.area(cv.w, cv.h), pad = 10, W = A.w - 2 * pad, H = A.h - 2 * pad;
      const land = W > H * 1.15;
      let bs, pad2;
      if (land) {
        bs = Math.min(H, W * .64); const pw = Math.min(W - bs - 16, bs * .62), ks = Math.min(pw / 3, bs / 3.4);
        const tot = bs + 16 + ks * 3, x0 = A.x + pad + (W - tot) / 2, y0 = A.y + pad + (H - bs) / 2;
        L = {bx: x0, by: y0, bs, keys: BX.range(9).map(k => ({x: x0 + bs + 16 + (k % 3) * ks, y: y0 + (bs - ks * 3.3) / 2 + ((k / 3) | 0) * ks * 1.1, w: ks - 6, h: ks * 1.1 - 6}))};
        L.info = {x: x0 + bs + 16, y: y0 + (bs - ks * 3.3) / 2 - 30, w: ks * 3 - 6};
      } else {
        const two = H > W * 1.45, ks0 = two ? Math.min(W / 5, 74) : Math.min(W / 9, 64), kh = two ? Math.min(ks0 * .8, 60) : ks0 * 1.25, kRows = two ? 2 : 1;
        bs = Math.min(W, H - kRows * kh - 60); const ks = two ? ks0 : Math.min(W / 9, bs / 8);
        const tot = 34 + bs + 14 + kRows * kh, y0 = A.y + pad + Math.max(0, (H - tot) / 2), x0 = A.x + pad + (W - bs) / 2;
        L = {bx: x0, by: y0 + 34, bs, keys: BX.range(9).map(k => {
          if (!two) return {x: A.x + pad + (W - ks * 9) / 2 + k * ks, y: y0 + 34 + bs + 14, w: ks - 5, h: kh};
          const row = k < 5 ? 0 : 1, n = row ? 4 : 5, c = row ? k - 5 : k;
          return {x: A.x + pad + (W - ks * n) / 2 + c * ks, y: y0 + 34 + bs + 14 + row * kh, w: ks - 6, h: kh - 6};
        })};
        L.info = {x: x0, y: y0 + 14, w: bs};
      }
      L.cs = L.bs / 9;
    }
    const cellAt = p => { const c = Math.floor((p.x - L.bx) / L.cs), r = Math.floor((p.y - L.by) / L.cs); return c >= 0 && r >= 0 && c < 9 && r < 9 ? r * 9 + c : -1; };
    const keyAt = p => L.keys.findIndex(k => p.x >= k.x - 2 && p.x <= k.x + k.w + 2 && p.y >= k.y - 2 && p.y <= k.y + k.h + 2);
    let keyPress = -1;
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!L || won || lost) return; const p = cv.pos(e);
      const i = cellAt(p);
      if (i >= 0) {
        hideBan();
        if (numSel && !cur[i] && !given[i] && sel === i) { place(i, numSel); return; }
        sel = i; if (cur[i]) numSel = cur[i]; else if (numSel && !given[i] && e.pointerType !== 'mouse' && false) place(i, numSel);
        ctx.sfx('click'); return;
      }
      const k = keyAt(p);
      if (k >= 0) {
        keyPress = k; ctx.after(120, () => keyPress = -1);
        if (sel >= 0 && !given[sel]) place(sel, k + 1);
        numSel = k + 1; if (sel < 0 || given[sel]) ctx.sfx('tick');
        return;
      }
      sel = -1; numSel = 0;
    });

    /* ---------- drawing ---------- */
    let bgC = null, bgKey = '';
    const inst = {
      frame(dt) {
        const g = cv.g; cv.clear(); layout();
        if (!won && !lost && moves) time += dt;
        const key2 = cv.w + 'x' + cv.h + cv.dpr;
        if (key2 !== bgKey) { bgKey = key2; bgC = document.createElement('canvas'); bgC.width = Math.ceil(cv.w * cv.dpr); bgC.height = Math.ceil(cv.h * cv.dpr); const b = bgC.getContext('2d'); b.scale(cv.dpr, cv.dpr); K.table(b, cv.w, cv.h, 'wood'); }
        g.drawImage(bgC, 0, 0, cv.w, cv.h);
        const {bx, by, bs, cs} = L;
        g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = '#f3e9d2'; D.rr(g, bx - 6, by - 6, bs + 12, bs + 12, 8); g.fill(); g.restore();
        D.paper(g, bx - 6, by - 6, bs + 12, bs + 12, {r: 8, color: '#f6edd8'});
        const sv2 = sel >= 0 ? cur[sel] || 0 : 0, hv = sv2 || numSel;
        for (let i = 0; i < 81; i++) {
          const x = bx + COL(i) * cs, y = by + ROW(i) * cs;
          let bgc = BOX(i) % 2 ? 'rgba(200,160,82,.07)' : null;
          if (sel >= 0 && (ROW(i) === ROW(sel) || COL(i) === COL(sel) || BOX(i) === BOX(sel))) bgc = 'rgba(63,127,107,.13)';
          if (hv && cur[i] === hv) bgc = 'rgba(200,160,82,.42)';
          if (i === sel) bgc = 'rgba(63,127,107,.38)';
          if (bgc) { g.fillStyle = bgc; g.fillRect(x, y, cs, cs); }
          if (cur[i] && conflict(i)) { g.fillStyle = 'rgba(208,83,63,.2)'; g.fillRect(x, y, cs, cs); }
        }
        for (const f of unitFlash) { f.t += dt; const a = Math.sin(Math.min(1, f.t / .7) * Math.PI) * .45; g.fillStyle = `rgba(230,197,125,${a})`; for (const i of UNITS[f.u]) g.fillRect(bx + COL(i) * cs, by + ROW(i) * cs, cs, cs); }
        unitFlash = unitFlash.filter(f => f.t < .7);
        D.grid(g, bx, by, 9, 9, cs, 'rgba(70,45,20,.35)', 1);
        D.grid(g, bx, by, 3, 3, cs * 3, '#3a2414', 2.4);
        g.strokeStyle = '#2b2118'; g.lineWidth = 3; g.strokeRect(bx, by, bs, bs);
        if (errT > 0) errT -= dt;
        for (let i = 0; i < 81; i++) {
          const x = bx + COL(i) * cs + cs / 2, y = by + ROW(i) * cs + cs / 2;
          if (pulse[i] < 1) pulse[i] = Math.min(1, pulse[i] + dt * 3.5);
          const pk = pulse[i] < 0 ? 0 : pulse[i], sc = pk < 1 ? BX.ease.back(pk) : 1;
          if (cur[i]) {
            if (pulse[i] < 0) continue;
            const wrong = conflict(i) || (MIS && !given[i] && cur[i] !== S[i]);
            const col = given[i] ? '#2b2118' : wrong ? '#c0291f' : '#2f5d8a';
            let ox = 0; if (i === errCell && errT > 0) ox = Math.sin(errT * 50) * cs * .06;
            D.text(g, String(cur[i]), x + ox, y + cs * .04, {size: cs * .64 * sc, color: col, weight: given[i] ? 800 : 600, font: given[i] ? 'serif' : 'sans'});
          } else if (notes[i]) {
            for (let v = 0; v < 9; v++) if (notes[i] & (1 << v)) {
              const nx = x + ((v % 3) - 1) * cs * .3, ny = y + (((v / 3) | 0) - 1) * cs * .3;
              if (hv === v + 1) { g.fillStyle = 'rgba(200,160,82,.55)'; D.circle(g, nx, ny, cs * .14); g.fill(); }
              D.text(g, String(v + 1), nx, ny + 1, {size: cs * .24, color: '#6b5640', weight: 600});
            }
          }
        }
        // info line
        const I = L.info;
        D.text(g, `${LVN[lv]}  ·  ${K.fmt(time)}` + (MIS ? `  ·  错误 ${mistakes}/${MIS}` : ''), I.x + (L.keys[0].y > by + bs ? I.w / 2 : I.w / 2), I.y, {size: 16, color: '#f3e2c0', weight: 700, shadow: true});
        // keypad
        L.keys.forEach((k, j) => {
          const v = j + 1, left = 9 - countOf(v), on = numSel === v, pr = keyPress === j;
          g.save(); if (pr) { g.translate(0, 2); }
          g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.shadowOffsetY = pr ? 1 : 3;
          D.rr(g, k.x, k.y, k.w, k.h, Math.min(k.w, k.h) * .18);
          const gr = g.createLinearGradient(k.x, k.y, k.x, k.y + k.h);
          if (on) { gr.addColorStop(0, '#d0533f'); gr.addColorStop(1, '#a33022'); } else { gr.addColorStop(0, '#fbf3e0'); gr.addColorStop(1, '#e3d0a8'); }
          g.fillStyle = gr; g.fill(); g.restore();
          g.globalAlpha = left ? 1 : .35;
          const sz = Math.min(k.w, k.h);
          D.text(g, String(v), k.x + k.w / 2, k.y + k.h * .45, {size: sz * .55, color: on ? '#fff3e3' : noteMode ? '#6b5640' : '#2b2118', weight: 800, font: noteMode ? 'sans' : 'serif'});
          if (left) D.text(g, String(left), k.x + k.w / 2, k.y + k.h * .82, {size: Math.max(9, sz * .2), color: on ? '#ffd9c8' : '#8c7a63', weight: 600});
          else D.text(g, '✓', k.x + k.w / 2, k.y + k.h * .82, {size: Math.max(9, sz * .22), color: '#3f7f6b', weight: 800});
          g.globalAlpha = 1;
        });
        fx.draw(g, dt);
        say(noteMode ? '笔记模式：填入候选数' : sel < 0 ? '点选格子，再点数字填入' : given[sel] ? '题目给定的数字不能修改' : '选择数字填入');
        bar.dis('undo', !undoS.length || won || lost); bar.dis('hint', won || lost); bar.dis('erase', sel < 0 || given[sel] || (!cur[sel] && !notes[sel]));
      },
      key(e) {
        if (won || lost) return;
        const d = /^Digit([1-9])$|^Numpad([1-9])$/.exec(e.code);
        if (d) { const v = +(d[1] || d[2]); numSel = v; if (sel >= 0) place(sel, v); return; }
        if (e.code === 'Backspace' || e.code === 'Delete' || e.code === 'Digit0') { erase(); return; }
        if (e.code === 'KeyN') { noteMode = !noteMode; bar.on('note', noteMode); return; }
        if (e.code === 'KeyZ') { undo(); return; }
        if (e.code === 'KeyH') { hint(); return; }
        const mv = {ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1}[e.code];
        if (mv) { if (sel < 0) sel = 40; else { const r = ROW(sel) + (mv === -9 ? -1 : mv === 9 ? 1 : 0), c = COL(sel) + (mv === -1 ? -1 : mv === 1 ? 1 : 0); sel = ((r + 9) % 9) * 9 + (c + 9) % 9; } }
      },
      destroy() { hideBan(); },
      debug: {get S() { return S; }, get P() { return P; }, get cur() { return cur; }, get L() { return L; }, rate: () => rate(P, 2), clues: () => P.filter(x => x).length, unique: () => countSol(P, 2)},
    };
    return inst;
  },
});
