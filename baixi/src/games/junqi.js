/* 军棋 — 两人暗棋（陆战棋，裁判判决） */
const D = BX.draw, C = BX.C;
const NAME = {2: '工兵', 3: '排长', 4: '连长', 5: '营长', 6: '团长', 7: '旅长', 8: '师长', 9: '军长', 10: '司令', 11: '炸弹', 12: '地雷', 13: '军旗'};
const CNT = {10: 1, 9: 1, 8: 2, 7: 2, 6: 2, 5: 2, 4: 3, 3: 3, 2: 3, 12: 3, 11: 2, 13: 1};
const VAL = {2: 14, 3: 6, 4: 9, 5: 13, 6: 19, 7: 27, 8: 38, 9: 55, 10: 80, 11: 34, 12: 12, 13: 1000};
const TYPES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const QUIET = 100;
/* ---- board geometry (global: row 0 = 绿方底线, row 11 = 红方底线, 5 columns) ---- */
const id = (r, c) => r * 5 + c;
const CAMP = new Uint8Array(60), HQ = new Uint8Array(60), RAIL = new Uint8Array(60);
for (const r of [2, 4, 7, 9]) { CAMP[id(r, 1)] = CAMP[id(r, 3)] = 1; }
CAMP[id(3, 2)] = CAMP[id(8, 2)] = 1;
for (const c of [1, 3]) { HQ[id(0, c)] = HQ[id(11, c)] = 1; }
for (const r of [1, 5, 6, 10]) for (let c = 0; c < 5; c++) RAIL[id(r, c)] = 1;
for (let r = 1; r <= 10; r++) { RAIL[id(r, 0)] = RAIL[id(r, 4)] = 1; }
const ROAD = BX.range(60).map(() => []), RN = BX.range(60).map(() => []);   // RN: [neighbour, dir 0..3]
const link = (a, b) => { if (!ROAD[a].includes(b)) { ROAD[a].push(b); ROAD[b].push(a); } };
for (let r = 0; r < 12; r++) for (let c = 0; c < 5; c++) {
  const a = id(r, c);
  if (c < 4) link(a, id(r, c + 1));
  if (r < 11 && !(r === 5 && (c === 1 || c === 3))) link(a, id(r + 1, c));
  if (CAMP[a]) for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 12 && cc >= 0 && cc < 5 && (rr <= 5) === (r <= 5)) link(a, id(rr, cc)); }
}
const railPair = (a, b, d) => { RN[a].push([b, d]); RN[b].push([a, d ^ 1]); };   // d: 0 right/1 left, 2 down/3 up
for (const r of [1, 5, 6, 10]) for (let c = 0; c < 4; c++) railPair(id(r, c), id(r, c + 1), 0);
for (const c of [0, 4]) for (let r = 1; r < 10; r++) railPair(id(r, c), id(r + 1, c), 2);
railPair(id(5, 2), id(6, 2), 2);
/* side-relative layout index (r 0 = 底线 … 5 = 前线, c from that player's left) <-> global cell */
const toG = (s, i) => { const r = (i / 5) | 0, c = i % 5; return s === 0 ? id(11 - r, c) : id(r, 4 - c); };
const sideRow = (s, g) => s === 0 ? 11 - ((g / 5) | 0) : (g / 5) | 0;
const SCAMP = i => CAMP[toG(0, i)] === 1;
/* distance (moves) to the opponent's two 大本营 */
function bfs(srcs) { const d = new Array(60).fill(99), q = srcs.slice(); for (const s of srcs) d[s] = 0; for (let k = 0; k < q.length; k++) { const u = q[k]; for (const v of ROAD[u].concat(RN[u].map(x => x[0]))) if (d[v] > d[u] + 1) { d[v] = d[u] + 1; q.push(v); } } return d; }
const DHQ = [bfs([id(0, 1), id(0, 3)]), bfs([id(11, 1), id(11, 3)])];   // DHQ[seat] = distance to the enemy HQ for that seat

const P = (s) => s.split(' ').map(x => x === '-' ? 0 : {司: 10, 军: 9, 师: 8, 旅: 7, 团: 6, 营: 5, 连: 4, 排: 3, 工: 2, 炸: 11, 雷: 12, 旗: 13}[x]);
const PRESETS = [
  ['稳守', P('连 旗 雷 排 连 雷 雷 团 工 营 旅 - 炸 - 排 工 团 - 师 连 军 - 工 - 炸 营 师 排 司 旅')],
  ['猛攻', P('雷 排 雷 旗 连 排 营 工 雷 连 团 - 炸 - 营 旅 工 - 排 团 师 - 炸 - 工 师 司 连 军 旅')],
  ['铁桶', P('雷 旗 雷 排 连 工 雷 营 炸 排 连 - 团 - 工 旅 师 - 营 团 排 - 军 - 炸 工 旅 司 连 师')],
];
function layoutError(L) {
  if (!Array.isArray(L) || L.length !== 30) return '布阵数据错误';
  const n = {}; for (const t of TYPES) n[t] = 0;
  for (let i = 0; i < 30; i++) {
    const t = L[i];
    if (SCAMP(i)) { if (t) return '行营里开局不能放棋子'; continue; }
    if (!CNT[t]) return '布阵数据错误';
    n[t]++; const r = (i / 5) | 0;
    if (t === 13 && !(r === 0 && (i % 5 === 1 || i % 5 === 3))) return '军旗只能放在大本营';
    if (t === 12 && r > 1) return '地雷只能放在最后两排';
    if (t === 11 && r === 5) return '炸弹不能放在第一排';
  }
  for (const t of TYPES) if (n[t] !== CNT[t]) return '棋子数量不对';
  return null;
}
function randomLayout(rnd = Math.random) {
  for (;;) {
    const L = new Array(30).fill(0), free = BX.range(30).filter(i => !SCAMP(i));
    const take = ok => { const c = free.filter(ok); if (!c.length) return -1; const i = c[Math.floor(rnd() * c.length)]; free.splice(free.indexOf(i), 1); return i; };
    const fl = rnd() < .5 ? 1 : 3; L[fl] = 13; free.splice(free.indexOf(fl), 1);
    for (let k = 0; k < 3; k++) { const i = take(i => i < 10 && (k > 0 || Math.abs(i % 5 - fl) + ((i / 5) | 0) === 1)); L[i] = 12; }
    for (let k = 0; k < 2; k++) L[take(i => i < 25)] = 11;
    const rest = []; for (const t of [10, 9, 8, 7, 6, 5, 4, 3, 2]) for (let k = 0; k < CNT[t]; k++) rest.push(t);
    BX.shuffle(free, rnd); rest.forEach((t, k) => L[free[k]] = t);
    if (!layoutError(L)) return L;
  }
}
function presetLayout(k, mirror) { const L = PRESETS[k][1].slice(); return mirror ? L.map((_, i) => L[((i / 5) | 0) * 5 + 4 - i % 5]) : L; }
/* ---- rules ---- */
const movable = (b, f) => { const p = b[f]; return !!p && p.t !== 12 && p.t !== 13 && !HQ[f]; };
function targets(b, f, asEng) {
  const p = b[f], out = []; if (!movable(b, f)) return out;
  const add = v => { if (!out.includes(v)) out.push(v); };
  for (const v of ROAD[f]) { const q = b[v]; if (!q) add(v); else if (q.o !== p.o && !CAMP[v]) add(v); }
  if (RAIL[f]) {
    if (asEng != null ? asEng : p.t === 2) {
      const seen = new Uint8Array(60), q = [f]; seen[f] = 1;
      for (let k = 0; k < q.length; k++) for (const [v] of RN[q[k]]) {
        if (seen[v]) continue; seen[v] = 1;
        if (!b[v]) { add(v); q.push(v); } else if (b[v].o !== p.o) add(v);
      }
    } else for (let d = 0; d < 4; d++) {
      let u = f;
      for (;;) {
        const e = RN[u].find(x => x[1] === d); if (!e) break; const v = e[0];
        if (!b[v]) { add(v); u = v; continue; }
        if (b[v].o !== p.o) add(v);
        break;
      }
    }
  }
  return out;
}
function allMoves(b, s) { const out = []; for (let f = 0; f < 60; f++) if (b[f] && b[f].o === s) for (const t of targets(b, f)) out.push([f, t]); return out; }
function fight(at, dt) {
  if (dt === 13) return 'win';
  if (at === 11 || dt === 11) return 'both';
  if (dt === 12) return at === 2 ? 'win' : 'lose';
  return at > dt ? 'win' : at < dt ? 'lose' : 'both';
}

BX.register({
  id: 'junqi', title: '军棋', cat: 'heavy', order: 2, sub: '暗棋布阵，夺旗制胜',
  desc: '经典两人陆战棋（暗棋）。双方各 25 子秘密布阵，翻不开的棋子由裁判判定大小；铁路飞驰、工兵排雷、炸弹同归于尽，先夺下对方军旗者胜。',
  kind: 'turn', seats: 2, hidden: true, seatNames: ['红方', '绿方'], seatColors: ['#c23a2b', '#3f7f4b'],
  rules: `<p><b>棋盘</b>：5 列 × 12 行，双方各占 6 行，中间隔着“山界”，只有左、中、右三条铁路可以通过。棋盘上有<b>兵站</b>（普通位置）、<b>行营</b>（圆圈，5 个）、<b>大本营</b>（底线两个）以及粗黑白相间的<b>铁路</b>线。</p>
<p><b>棋子</b>（每方 25 枚，从大到小）：司令 1、军长 1、师长 2、旅长 2、团长 2、营长 2、连长 3、排长 3、工兵 3；另有地雷 3、炸弹 2、军旗 1。</p>
<p><b>布阵</b>：双方同时秘密布阵。军旗必须放在大本营；地雷只能放在最后两排；炸弹不能放在第一排；开局时行营内不放棋子。可以选“随机布阵”或预设阵型，再点两枚棋子互换位置，完成后点“布阵完成”。</p>
<p><b>走法</b>：红方先走，每次移动一枚棋子。公路上每步走一格（直线连接的相邻点；行营与四周斜线相连）。在铁路上可沿直线走任意格，但不能越过棋子、不能拐弯；<b>工兵</b>在铁路上可以拐弯、任意行走。地雷、军旗不能移动；进入大本营的棋子不能再移动。</p>
<p><b>交战</b>：走到对方棋子所在的位置即发起进攻，由裁判判定（双方都看不到对方棋子是什么）：</p>
<ul><li>官大的吃掉官小的；同级同归于尽。</li><li>炸弹与任何棋子相碰同归于尽。</li><li>地雷：任何棋子撞上地雷都会阵亡（地雷保留），只有工兵可以排除地雷；炸弹碰地雷同归于尽。</li><li>行营里的棋子不能被攻击。</li></ul>
<p><b>司令阵亡</b>后，这一方的军旗要亮明给对方。</p>
<p><b>胜负</b>：吃掉对方军旗获胜；轮到某方时已无棋可走（没有可移动的棋子）判负；双方连续 ${QUIET} 步（各 ${QUIET / 2} 步）没有交战判为和棋。轮到自己时可以认输。</p>
<p><b>操作</b>：点己方棋子选中（显示可走位置），再点目标位置走棋；交战结果会在棋盘中间和状态栏显示。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#efe0bd'});
    g.strokeStyle = '#2b2118'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, h * .3); g.lineTo(w, h * .3); g.moveTo(w * .14, 0); g.lineTo(w * .14, h); g.stroke();
    g.strokeStyle = '#f3e9d2'; g.lineWidth = 2; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(w * .55, h * .62, h * .13, 0, 7); g.stroke();
    const tile = (x, y, txt, col, back, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot || 0);
      g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, -26, -15, 56, 34, 6); g.fill();
      const gr = g.createLinearGradient(0, -16, 0, 16);
      if (back) { gr.addColorStop(0, D.shade(col, 15)); gr.addColorStop(1, D.shade(col, -20)); } else { gr.addColorStop(0, '#fbf0d6'); gr.addColorStop(1, '#e2c58f'); }
      g.fillStyle = gr; D.rr(g, -28, -17, 56, 34, 6); g.fill(); g.strokeStyle = back ? 'rgba(255,240,210,.6)' : col; g.lineWidth = 2; D.rr(g, -25, -14, 50, 28, 4); g.stroke();
      D.text(g, txt, 0, 1, {size: 18, color: back ? 'rgba(255,240,210,.85)' : col, font: 'serif', weight: 900});
      g.restore();
    };
    tile(w * .3, h * .3, '', '#3f7f4b', true, -.05);
    tile(w * .72, h * .26, '', '#3f7f4b', true, .04);
    tile(w * .55, h * .62, '司令', '#b23a2b', false, .03);
    tile(w * .22, h * .76, '炸弹', '#b23a2b', false, -.06);
    tile(w * .84, h * .72, '军旗', '#3f7f4b', false, .08);
    D.text(g, '⚔', w * .5, h * .44, {size: 22, color: '#b23a2b'});
  },
  create(ctx) {
    const st = {ph: 'setup', b: new Array(60).fill(null), done: [false, false], turn: 0, last: null, quiet: 0, ply: 0, rev: [false, false], fx: null, lost: [[], []], res: null, nid: 0};
    const cv = ctx.canvas();
    const drafts = [null, null], presetIdx = [0, 0];
    let sel = -1, setupSel = -1, mv = null, fade = null, banner = null, think = 0;
    const V = () => ctx.view;
    const enemy = s => 1 - s;
    const draft = s => { if (!drafts[s]) drafts[s] = presetLayout(Math.floor(Math.random() * PRESETS.length), Math.random() < .5); return drafts[s]; };

    /* ---------------- layout ---------------- */
    function layout() {
      const W = cv.w, H = cv.h, port = H > W * 1.05;
      // vertical board: 5 cols x 13 rows(+gap) ; horizontal: 13 x 5
      let L;
      if (port) {
        const ph = 50, availH = H - 2 * ph - 16, s = Math.min((W - 8) / (5 * 1.55), availH / 13);
        const bw = 5 * 1.55 * s, bh = 13 * s, ox = (W - bw) / 2, oy = Math.max(ph + 8, (H - bh) / 2);
        L = {m: 'v', s, px: 1.55 * s, py: s, ox, oy, bw, bh};
        const pw = Math.min(W - 12, Math.max(bw, 340)), px0 = (W - pw) / 2;
        L.top = {x: px0, y: oy - ph - 6, w: pw, h: ph}; L.bot = {x: px0, y: oy + bh + 6, w: pw, h: ph}; L.ctrl = {x: px0, y: oy + bh + 6, w: pw, h: ph, row: true};
        if (L.bot.y + ph > H) { L.bot.y = H - ph - 2; L.ctrl.y = L.bot.y; }
        return L;
      }
      const PW = BX.clamp(W * .2, 128, 230), aw = W - PW - 24, ah = H - 12;
      const sv = Math.min(aw / (5 * 1.55), ah / 13), sh = Math.min(aw / (13 * 1.4), ah / 5.2);
      if (sv >= sh * .9) {
        const s = sv, bw = 5 * 1.55 * s, bh = 13 * s, tot = bw + 16 + PW, ox = (W - tot) / 2, oy = (H - bh) / 2;
        L = {m: 'v', s, px: 1.55 * s, py: s, ox, oy, bw, bh};
      } else {
        const s = sh, py = Math.min(ah / 5.2, s * 1.5), bw = 13 * 1.4 * s, bh = 5 * py, tot = bw + 12 + PW, ox = (W - tot) / 2, oy = (H - bh) / 2;
        L = {m: 'h', s, px: 1.4 * s, py, ox, oy, bw, bh};
      }
      const x = L.ox + L.bw + (L.m === 'v' ? 16 : 12), ph = Math.min(92, L.bh * .26);
      const top = Math.max(6, L.oy), bottom = Math.min(H - 6, L.oy + L.bh);
      L.top = {x, y: top, w: PW, h: ph}; L.bot = {x, y: bottom - ph, w: PW, h: ph}; L.ctrl = {x, y: top + ph + 8, w: PW, h: bottom - top - 2 * ph - 16, row: false};
      return L;
    }
    function cellXY(g, L) {
      let r = (g / 5) | 0, c = g % 5;
      if (V() === 1) { r = 11 - r; c = 4 - c; }
      const yy = r + (r >= 6 ? 1 : 0);
      return L.m === 'v' ? [L.ox + (c + .5) * L.px, L.oy + (yy + .5) * L.py] : [L.ox + (12 - yy + .5) * L.px, L.oy + (c + .5) * L.py];
    }
    const tileWH = L => [1.24 * L.s, .74 * L.s];
    function cellAt(p, L) {
      const [tw, th] = tileWH(L); let best = -1, bd = 1e9;
      for (let g = 0; g < 60; g++) { const [x, y] = cellXY(g, L), dx = Math.abs(p.x - x) / (tw * .62), dy = Math.abs(p.y - y) / (th * .75); const d = Math.max(dx, dy); if (d < bd) { bd = d; best = g; } }
      return bd <= 1 ? best : -1;
    }

    /* ---------------- DOM controls ---------------- */
    const ui = ctx.ui();
    const box = BX.h('div', {style: {position: 'absolute', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto'}});
    ui.append(box);
    const mk = (txt, cls, fn) => { const b = BX.h('button', {class: 'bx-btn ' + cls, text: txt, on: {click: fn}}); b.style.padding = '8px 12px'; box.append(b); return b; };
    const setupSeat = () => { const s = V(); return ctx.canAct(s) && st.ph === 'setup' && !st.done[s] ? s : -1; };
    const bRand = mk('随机布阵', 'ghost', () => { const s = setupSeat(); if (s < 0) return; drafts[s] = randomLayout(); setupSel = -1; ctx.sfx('shuffle'); });
    const bPre = mk('换个阵型', 'ghost', () => { const s = setupSeat(); if (s < 0) return; presetIdx[s] = (presetIdx[s] + 1) % (PRESETS.length * 2); const k = presetIdx[s]; drafts[s] = presetLayout(k >> 1, k & 1); setupSel = -1; ctx.sfx('deal'); ctx.toast('阵型：' + PRESETS[k >> 1][0] + (k & 1 ? '（镜像）' : '')); });
    const bDone = mk('布阵完成', 'red', () => { const s = setupSeat(); if (s < 0) return; const e = layoutError(draft(s)); if (e) { ctx.toast(e); return; } setupSel = -1; ctx.act({t: 'setup', L: draft(s).slice()}, s); });
    const bResign = mk('认输', 'ghost', async () => {
      const s = V(); if (!ctx.canAct(s) || st.ph !== 'play') return;
      if (!(await BX.confirm('确定要认输吗？', '认输'))) return;
      if (ctx.canAct(s) && st.ph === 'play') ctx.act({t: 'resign'}, s);
    });
    let boxKey = '';
    function placeBox(L) {
      const su = st.ph === 'setup', me = setupSeat() >= 0;
      bRand.style.display = bPre.style.display = bDone.style.display = su && me ? '' : 'none';
      bResign.style.display = st.ph === 'play' ? '' : 'none'; bResign.disabled = !ctx.canAct(V());
      const r = L.ctrl, row = r.row;
      const x = row ? r.x + r.w * .36 : r.x, w = row ? r.w * .64 : r.w;
      const k = [x, r.y, w, r.h, row].map(v => typeof v === 'number' ? Math.round(v) : v).join(',');
      if (k === boxKey) return; boxKey = k;
      Object.assign(box.style, {left: x + 'px', top: r.y + 'px', width: w + 'px', height: r.h + 'px', flexDirection: row ? 'row' : 'column', justifyContent: row ? 'flex-end' : 'center', flexWrap: row ? 'nowrap' : 'wrap'});
      const tight = !row && r.h < 170;
      box.style.gap = tight ? '5px' : '8px'; box.style.flexWrap = 'nowrap';
      for (const b of [bRand, bPre, bDone, bResign]) { b.style.fontSize = row || tight ? '13px' : '15px'; b.style.padding = row || tight ? '4px 9px' : '8px 12px'; b.style.minWidth = row ? '0' : Math.min(140, w) + 'px'; b.style.minHeight = tight ? '40px' : '42px'; }
    }

    /* ---------------- input ---------------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      const L = layout(), g = cellAt(cv.pos(e), L);
      if (st.ph === 'setup') {
        const s = setupSeat(); if (s < 0 || g < 0) return;
        if (sideRow(s, g) > 5) return;
        const i = BX.range(30).find(k => toG(s, k) === g); const Ld = draft(s);
        if (!Ld[i]) return;
        if (setupSel < 0 || setupSel === i) { setupSel = setupSel === i ? -1 : i; ctx.sfx('tick'); return; }
        const T = Ld.slice(); [T[i], T[setupSel]] = [T[setupSel], T[i]];
        const err = layoutError(T); if (err) { ctx.sfx('error'); ctx.toast(err); setupSel = -1; return; }
        drafts[s] = T; setupSel = -1; ctx.sfx('place'); return;
      }
      if (st.ph !== 'play' || !ctx.canAct(st.turn) || V() !== st.turn) return;
      if (g < 0) { sel = -1; return; }
      const p = st.b[g];
      if (p && p.o === st.turn) { if (movable(st.b, g)) { sel = sel === g ? -1 : g; ctx.sfx('select'); } else { ctx.sfx('error'); ctx.toast(p.t === 12 ? '地雷不能移动' : p.t === 13 ? '军旗不能移动' : '大本营里的棋子不能移动'); } return; }
      if (sel >= 0 && targets(st.b, sel).includes(g)) { const f = sel; sel = -1; ctx.act({t: 'm', f, to: g}, st.turn); return; }
      if (sel >= 0 && p && CAMP[g]) ctx.toast('行营里的棋子不能被攻击');
      sel = -1;
    });

    /* ---------------- text ---------------- */
    function battleText(fx, v) {
      if (!fx) return '';
      let s;
      if (v === fx.a) s = '我方' + NAME[fx.at] + '进攻：' + (fx.res === 'win' ? (fx.dt === 13 ? '夺得军旗！' : '胜') : fx.res === 'lose' ? '阵亡' : '同归于尽');
      else s = '敌方进攻我方' + NAME[fx.dt] + '：' + (fx.res === 'win' ? (fx.dt === 13 ? '军旗失守' : '我方阵亡') : fx.res === 'lose' ? '击退敌军' : '同归于尽');
      if (fx.cmd != null) s += '｜' + (fx.cmd === v ? '我方' : '敌方') + '司令阵亡，军旗亮明';
      return s;
    }
    function status() {
      const alive = s => st.b.filter(p => p && p.o === s).length;
      ctx.info(0, alive(0) + '子'); ctx.info(1, alive(1) + '子');
      if (st.ph === 'setup') {
        const s = V();
        if (setupSeat() >= 0) return ctx.status('布阵：点两枚棋子互换位置，完成后点「布阵完成」');
        return ctx.status(st.done[s] ? '布阵完成，等待对方布阵…' : '等待对方布阵…');
      }
      if (st.ph === 'over') return ctx.status(st.res || '对局结束');
      const bt = st.fx && st.fx.ply === st.ply ? battleText(st.fx, V()) + ' · ' : '';
      if (ctx.canAct(st.turn)) ctx.status(bt + (ctx.hotseat ? ctx.name(st.turn) + '走棋' : '轮到你走棋'));
      else ctx.status(bt + (ctx.isAI(st.turn) ? ctx.name(st.turn) + ' 思考中…' : '等待 ' + ctx.name(st.turn) + ' 走棋…'));
    }

    /* ---------------- AI ---------------- */
    function beliefs(me, level) {
      const op = enemy(me), out = new Map(), cnt = Object.assign({}, CNT), pcs = [];
      if (st.rev[op]) { cnt[10] = 0; }
      for (let g = 0; g < 60; g++) { const q = st.b[g]; if (q && q.o === op) pcs.push([g, q]); }
      const allow = (g, q, t) => {
        if (st.rev[op]) { if (q.t === 13) return t === 13; if (t === 13 || t === 10) return false; }
        if (q.mv && (t === 12 || t === 13)) return false;
        if (q.eng) return t === 2;
        if (t === 13 && !HQ[g]) return false;
        if (level >= 2) {
          const hr = (q.home / 5) | 0;
          if (t === 12 && hr > 1) return false;
          if (t === 13 && !(hr === 0 && (q.home % 5 === 1 || q.home % 5 === 3))) return false;
          if (t === 11 && hr === 5) return false;
          if (q.beat) { if (t === 11) return false; if (t === 12) return !q.mv; if (t <= q.beat) return false; }
        }
        return true;
      };
      const cand = {}; for (const t of TYPES) cand[t] = 0;
      const al = pcs.map(([g, q]) => TYPES.map(t => { const a = allow(g, q, t); if (a) cand[t]++; return a; }));
      pcs.forEach(([g, q], k) => {
        let tot = 0; const w = TYPES.map((t, j) => { const v = al[k][j] && cnt[t] ? cnt[t] / cand[t] : 0; tot += v; return v; });
        if (tot <= 0) { const u = TYPES.map((t, j) => al[k][j] ? 1 : 0), su = u.reduce((a, b) => a + b, 0) || 1; out.set(q.id, TYPES.map((t, j) => [t, u[j] / su])); return; }
        out.set(q.id, TYPES.map((t, j) => [t, w[j] / tot]).filter(x => x[1] > 0));
      });
      return out;
    }
    function battleEV(at, bel) {
      let ev = 0, pw = 0;
      for (const [t, p] of bel) {
        const r = fight(at, t);
        ev += p * (r === 'win' ? VAL[t] : r === 'lose' ? -VAL[at] : VAL[t] - VAL[at]);
        if (r !== 'lose') pw += p;
      }
      return {ev, pw};
    }
    function reachMap(b, me, bel) {
      const op = enemy(me), R = BX.range(60).map(() => []);
      for (let g = 0; g < 60; g++) {
        const q = b[g]; if (!q || q.o !== op || HQ[g]) continue;
        const bl = bel.get(q.id) || []; let pm = 0, pe = 0; for (const [t, p] of bl) { if (t !== 12 && t !== 13) pm += p; if (t === 2) pe += p; }
        if (pm < .05) continue;
        const tg = targets(b, g, false); if (pe > .15 && RAIL[g]) for (const v of targets(b, g, true)) if (!tg.includes(v)) tg.push(v);
        for (const v of tg) R[v].push(q.id);
      }
      return R;
    }
    function threatOn(cell, tm, R, bel) {
      if (CAMP[cell]) return 0; let worst = 0;
      for (const qid of R[cell]) {
        let d = 0; for (const [t, p] of bel.get(qid) || []) { if (t === 12 || t === 13) continue; const r = fight(t, tm); d += p * (r === 'win' ? VAL[tm] : r === 'both' ? Math.max(0, VAL[tm] - VAL[t]) : 0); }
        if (d > worst) worst = d;
      }
      return worst * .75;
    }
    function totalDanger(b, me, bel) {
      const R = reachMap(b, me, bel); let s = 0;
      for (let g = 0; g < 60; g++) { const p = b[g]; if (!p || p.o !== me) continue; if (p.t === 13) { if (R[g].length) s += 400; continue; } s += threatOn(g, p.t, R, bel); }
      return s;
    }
    function aiSetup() {
      const k = Math.floor(Math.random() * (PRESETS.length + 1));
      let L = k < PRESETS.length ? presetLayout(k, Math.random() < .5) : randomLayout();
      for (let n = 0; n < 6; n++) {   // light shuffling of similar pieces for variety
        const a = Math.floor(Math.random() * 30), c = Math.floor(Math.random() * 30); const T = L.slice(); [T[a], T[c]] = [T[c], T[a]];
        if (!layoutError(T) && T[a] !== 13 && T[c] !== 13 && Math.abs(VAL[T[a]] - VAL[T[c]]) < 20) L = T;
      }
      return {t: 'setup', L};
    }
    function aiMove(seat, level) {
      if (st.ph === 'setup') return aiSetup();
      if (BX.test && level >= 3) level = 2;
      const me = seat, b = st.b, moves = allMoves(b, me);
      if (!moves.length) return {t: 'resign'};
      const bel = beliefs(me, level), R = level >= 2 ? reachMap(b, me, bel) : null;
      const agg = 1 + st.quiet / 25;
      const myFlag = b.findIndex(p => p && p.o === me && p.t === 13);
      const flagThreats = new Set(myFlag >= 0 && R ? R[myFlag] : []);
      const base = level >= 3 ? totalDanger(b, me, bel) : 0;
      const scored = moves.map(([f, to]) => {
        const p = b[f], q = b[to]; let sc = 0, surv = 1;
        if (q) {
          const bl = bel.get(q.id) || [[6, 1]], r = battleEV(p.t, bl);
          sc += r.ev * (1 + (agg - 1) * .3) + 6 * agg; surv = r.pw;
          if (flagThreats.has(q.id)) sc += 300 * r.pw;
          // don't gamble the commander on unknown unmoved back pieces (possible mines)
        } else {
          const dv = DHQ[me][f] - DHQ[me][to];
          const w = p.t === 2 ? 1 : p.t === 11 ? 1.5 : p.t >= 9 && p.t <= 10 ? 2 : 3;
          sc += dv * w * agg;
          if (CAMP[to]) sc += 3; if (CAMP[f]) sc -= 2;
          if (HQ[to]) sc -= 40;
        }
        if (level === 2) {
          sc += threatOn(f, p.t, R, bel);
          if (surv > 0) sc -= threatOn(to, p.t, R, bel) * surv;
        } else if (level >= 3) {
          const save = [b[f], b[to]];
          const r = q ? null : 'move';
          // simulate optimistic outcome (piece occupies target) for danger evaluation
          b[to] = p; b[f] = null;
          const dang = totalDanger(b, me, bel);
          b[f] = save[0]; b[to] = save[1];
          sc += (base - dang) * (q ? surv : 1);
          if (r && p.t === 2 && DHQ[me][to] <= 2) sc += 4;
          if (myFlag >= 0 && Math.abs(((f / 5) | 0) - ((myFlag / 5) | 0)) <= 1 && Math.abs(f % 5 - myFlag % 5) <= 1 && !q && st.ply < 60) sc -= 3;
        }
        sc += (Math.random() - .5) * (level === 1 ? 30 : level === 2 ? 6 : 1.5);
        return [[f, to], sc];
      });
      const pick = BX.ai.byLevel(scored, level === 1 ? 1 : 3);
      return {t: 'm', f: pick[0], to: pick[1]};
    }

    /* ---------------- instance ---------------- */
    const endGame = (winner, text) => { st.ph = 'over'; st.res = text; status(); ctx.end({winner, text}); };
    const inst = {
      st,
      toMove() { if (st.ph === 'setup') return [0, 1].filter(s => !st.done[s]); if (st.ph === 'play') return st.turn; return null; },
      valid(a, by) {
        if (!a) return false;
        if (a.t === 'setup') return st.ph === 'setup' && !st.done[by] && !layoutError(a.L);
        if (a.t === 'resign') return st.ph === 'play' && by === st.turn;
        if (a.t === 'm') return st.ph === 'play' && by === st.turn && Number.isInteger(a.f) && Number.isInteger(a.to) && !!st.b[a.f] && st.b[a.f].o === by && targets(st.b, a.f).includes(a.to);
        return false;
      },
      apply(a, by) {
        if (a.t === 'setup') {
          if (st.done[by] || layoutError(a.L)) return;
          for (let i = 0; i < 30; i++) if (a.L[i]) { const g = toG(by, i); st.b[g] = {o: by, t: a.L[i], id: st.nid++, mv: 0, home: i, beat: 0}; }
          st.done[by] = true; ctx.sfx('deal');
          if (st.done[0] && st.done[1]) { st.ph = 'play'; st.turn = 0; ctx.sfx('gong'); }
          status(); return;
        }
        if (a.t === 'resign') { endGame(1 - by, ctx.name(by) + ' 认输'); return; }
        const b = st.b, p = b[a.f], q = b[a.to];
        if (!p || p.o !== by || !targets(b, a.f).includes(a.to)) return;
        p.mv = 1; st.ply++; sel = -1;
        const anim = {id: p.id, p: Object.assign({}, p), f: a.f, to: a.to, t: 0, q: q ? Object.assign({}, q) : null, res: null};
        let flagTaken = false;
        if (!q) { b[a.to] = p; b[a.f] = null; st.quiet++; ctx.sfx('move'); }
        else {
          const r = fight(p.t, q.t); anim.res = r; st.quiet = 0;
          const fx = {ply: st.ply, a: by, at: p.t, dt: q.t, res: r, cmd: null, to: a.to};
          b[a.f] = null;
          if (r === 'win') { b[a.to] = p; st.lost[q.o].push(q.t); if (q.t === 12) p.eng = 1; else if (q.t <= 10) p.beat = Math.max(p.beat, q.t); if (q.t === 13) flagTaken = true; }
          else if (r === 'lose') { st.lost[p.o].push(p.t); q.beat = Math.max(q.beat, p.t); }
          else { b[a.to] = null; st.lost[p.o].push(p.t); st.lost[q.o].push(q.t); }
          for (const [x, alive] of [[p, r !== 'lose' && r !== 'both'], [q, r === 'lose']]) if (x.t === 10 && !alive) { st.rev[x.o] = true; fx.cmd = x.o; }
          st.fx = fx; anim.fx = fx;
          if (!ctx.fast) {
            ctx.after(230, () => ctx.sfx(r === 'both' ? 'boom' : q.t === 12 && r === 'lose' ? 'boom' : 'hit'));
            if (fx.cmd != null) ctx.after(700, () => ctx.sfx('gong'));
          }
        }
        st.last = {f: a.f, to: a.to};
        if (!ctx.fast) {
          mv = anim; const dist = Math.hypot(((a.f / 5) | 0) - ((a.to / 5) | 0), a.f % 5 - a.to % 5);
          ctx.anim(Math.min(520, 180 + dist * 45), k => anim.t = k, () => {
            if (mv === anim) mv = null;
            if (anim.q) {
              const fd = {list: [], t: 0, at: a.to};
              if (anim.res !== 'win') fd.list.push(anim.p); if (anim.res !== 'lose') fd.list.push(anim.q);
              fade = fd; ctx.anim(420, k => fd.t = k, () => { if (fade === fd) fade = null; });
              const bn = {txt: battleText(anim.fx, V()), t: 0, res: anim.res, mine: anim.p.o === V()};
              banner = bn; ctx.anim(1900, k => bn.t = k, () => { if (banner === bn) banner = null; }, k => k);
            }
          });
        }
        if (flagTaken) { endGame(by, ctx.name(by) + ' 夺得对方军旗'); return; }
        if (st.quiet >= QUIET) { endGame(-1, '双方连续 ' + QUIET + ' 步没有交战，和棋'); return; }
        st.turn = 1 - st.turn;
        if (!allMoves(b, st.turn).length) { endGame(by, ctx.name(st.turn) + ' 无棋可走'); return; }
        status();
      },
      aiMove,
      onTurn: status,
      onView() { sel = -1; setupSel = -1; status(); },
      frame(dt) {
        const g = cv.g; cv.clear(); think += dt;
        const L = layout(); placeBox(L);
        drawBoard(g, L);
        drawPieces(g, L);
        drawPanels(g, L);
        if (banner) {
          const k = banner.t, al = k < .1 ? k / .1 : k > .8 ? (1 - k) / .2 : 1;
          const bw = Math.min(L.bw * .96, 380), bh = Math.min(54, L.s * 1.15), cx = L.ox + L.bw / 2, cy = L.oy + L.bh / 2;
          g.globalAlpha = al; D.paper(g, cx - bw / 2, cy - bh / 2, bw, bh, {r: 10});
          g.strokeStyle = banner.res === 'both' ? C.ink2 : (banner.res === 'win') === banner.mine ? C.jade : C.red; g.lineWidth = 2.5; D.rr(g, cx - bw / 2 + 3, cy - bh / 2 + 3, bw - 6, bh - 6, 8); g.stroke();
          D.text(g, banner.txt, cx, cy, {size: Math.min(18, bh * .36), color: C.ink, weight: 700, maxW: bw - 20, font: 'serif'});
          g.globalAlpha = 1;
        }
      },
    };

    /* ---------------- drawing ---------------- */
    function drawBoard(g, L) {
      const pad = L.s * .25;
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = '#b98a4c'; D.rr(g, L.ox - pad, L.oy - pad, L.bw + 2 * pad, L.bh + 2 * pad, 10); g.fill(); g.restore();
      D.wood(g, L.ox - pad, L.oy - pad, L.bw + 2 * pad, L.bh + 2 * pad, {r: 10, seed: 41, base: '#c9955a'});
      D.paper(g, L.ox, L.oy, L.bw, L.bh, {r: 6, color: '#f1e3c2'});
      // frontier band
      const [fx1, fy1] = cellXY(id(5, 0), L), [fx2, fy2] = cellXY(id(6, 4), L);
      g.save();
      if (L.m === 'v') { const y = (fy1 + fy2) / 2; g.fillStyle = 'rgba(120,150,110,.18)'; g.fillRect(L.ox, y - L.py * .5, L.bw, L.py); mountains(g, L.ox, y, L.bw, L.py, false); }
      else { const x = (fx1 + fx2) / 2; g.fillStyle = 'rgba(120,150,110,.18)'; g.fillRect(x - L.px * .5, L.oy, L.px, L.bh); mountains(g, x, L.oy, L.bh, L.px, true); }
      g.restore();
      // roads
      g.strokeStyle = 'rgba(70,45,20,.55)'; g.lineWidth = Math.max(1, L.s * .035); g.beginPath();
      for (let a = 0; a < 60; a++) for (const v of ROAD[a]) if (v > a) { const [x1, y1] = cellXY(a, L), [x2, y2] = cellXY(v, L); g.moveTo(x1, y1); g.lineTo(x2, y2); }
      g.stroke();
      // rails
      const rw = Math.max(3, L.s * .13);
      g.beginPath(); for (let a = 0; a < 60; a++) for (const [v] of RN[a]) if (v > a) { const [x1, y1] = cellXY(a, L), [x2, y2] = cellXY(v, L); g.moveTo(x1, y1); g.lineTo(x2, y2); }
      g.strokeStyle = '#2b2118'; g.lineWidth = rw; g.lineCap = 'butt'; g.stroke();
      g.strokeStyle = '#f3e9d2'; g.lineWidth = rw * .45; g.setLineDash([rw * 1.4, rw * 1.4]); g.stroke(); g.setLineDash([]);
      // posts
      const [tw, th] = tileWH(L);
      for (let a = 0; a < 60; a++) {
        const [x, y] = cellXY(a, L);
        if (CAMP[a]) { g.fillStyle = 'rgba(90,160,138,.35)'; D.circle(g, x, y, th * .78); g.fill(); g.strokeStyle = 'rgba(40,90,70,.8)'; g.lineWidth = 1.5; g.stroke(); }
        else if (HQ[a]) { g.fillStyle = 'rgba(178,58,43,.12)'; D.rr(g, x - tw * .56, y - th * .64, tw * 1.12, th * 1.28, th * .5); g.fill(); g.strokeStyle = 'rgba(140,40,30,.7)'; g.lineWidth = 1.5; g.stroke(); }
        else { g.fillStyle = '#f6ead0'; D.rr(g, x - tw * .42, y - th * .4, tw * .84, th * .8, 3); g.fill(); g.strokeStyle = 'rgba(70,45,20,.5)'; g.lineWidth = 1; g.stroke(); }
        if (HQ[a] && !st.b[a]) D.text(g, '大本营', x, y, {size: th * .34, color: 'rgba(140,40,30,.6)', font: 'serif'});
        if (CAMP[a] && !st.b[a]) D.text(g, '行营', x, y, {size: th * .3, color: 'rgba(40,90,70,.7)', font: 'serif'});
      }
      // last move
      if (st.last && st.ph !== 'setup') {
        for (const c of [st.last.f, st.last.to]) { const [x, y] = cellXY(c, L); g.strokeStyle = 'rgba(200,160,82,.9)'; g.lineWidth = 2; g.setLineDash([4, 3]); D.rr(g, x - tw * .56, y - th * .6, tw * 1.12, th * 1.2, 5); g.stroke(); g.setLineDash([]); }
      }
    }
    function mountains(g, x0, c, len, thick, vert) {
      g.fillStyle = 'rgba(70,90,70,.35)';
      const n = Math.max(4, Math.round(len / (thick * 1.3)));
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n, w = thick * .55, hgt = thick * (.35 + .12 * ((i * 7) % 3));
        g.beginPath();
        if (!vert) { const x = x0 + t * len; g.moveTo(x - w, c + thick * .3); g.lineTo(x, c + thick * .3 - hgt); g.lineTo(x + w, c + thick * .3); }
        else { const y = c + t * len; g.moveTo(x0 - thick * .3, y - w); g.lineTo(x0 - thick * .3 + hgt, y); g.lineTo(x0 - thick * .3, y + w); }
        g.fill();
      }
      if (!vert) D.text(g, '山 界', x0 + len / 2, c, {size: thick * .42, color: 'rgba(60,80,60,.55)', font: 'deco', weight: 400});
    }
    const COL = ['#b23a2b', '#2f6b3f'];
    function tile(g, x, y, L, p, faceUp, o = {}) {
      const [tw, th] = tileWH(L), s = o.scale || 1, w = tw * s, h = th * s;
      g.save(); g.globalAlpha = o.alpha != null ? o.alpha : 1;
      g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, x - w / 2 + 1.5, y - h / 2 + 3, w, h, h * .18); g.fill();
      const col = COL[p.o];
      const gr = g.createLinearGradient(x, y - h / 2, x, y + h / 2);
      if (faceUp) { gr.addColorStop(0, '#fcf2da'); gr.addColorStop(1, '#e0c48e'); } else { gr.addColorStop(0, D.shade(col, 18)); gr.addColorStop(1, D.shade(col, -22)); }
      g.fillStyle = gr; D.rr(g, x - w / 2, y - h / 2, w, h, h * .18); g.fill();
      g.strokeStyle = faceUp ? col : 'rgba(255,236,200,.55)'; g.lineWidth = Math.max(1, h * .06); D.rr(g, x - w / 2 + h * .1, y - h / 2 + h * .1, w - h * .2, h - h * .2, h * .12); g.stroke();
      if (faceUp) D.text(g, NAME[p.t], x, y + h * .03, {size: h * .5, color: col, font: 'serif', weight: 900, maxW: w * .86});
      else D.text(g, p.o ? '绿' : '红', x, y + h * .03, {size: h * .42, color: 'rgba(255,236,200,.45)', font: 'deco', weight: 400});
      if (!faceUp && p.mv && !o.nomv) { g.fillStyle = 'rgba(255,236,200,.8)'; D.circle(g, x + w / 2 - h * .2, y - h / 2 + h * .2, h * .07); g.fill(); }
      if (o.sel) { g.strokeStyle = '#ffd76a'; g.lineWidth = Math.max(2, h * .1); D.rr(g, x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, h * .22); g.stroke(); }
      g.restore();
    }
    const faceUp = p => st.ph === 'over' || p.o === V() || (p.t === 13 && st.rev[p.o]);
    function drawPieces(g, L) {
      const v = V(), [tw, th] = tileWH(L);
      if (st.ph === 'setup') {
        for (const s of [0, 1]) {
          if (s === v && !st.done[s]) { const Ld = draft(s); for (let i = 0; i < 30; i++) if (Ld[i]) { const [x, y] = cellXY(toG(s, i), L); tile(g, x, y, L, {o: s, t: Ld[i]}, true, {sel: setupSel === i}); } }
          else if (st.done[s]) for (let gi = 0; gi < 60; gi++) { const p = st.b[gi]; if (p && p.o === s) { const [x, y] = cellXY(gi, L); tile(g, x, y, L, p, s === v); } }
        }
        return;
      }
      const skip = new Set(); if (mv) { skip.add(mv.id); if (mv.q) skip.add(mv.q.id); }
      const fset = new Set(fade ? fade.list.map(p => p.id) : []);
      for (let gi = 0; gi < 60; gi++) { const p = st.b[gi]; if (!p || skip.has(p.id) || fset.has(p.id)) continue; const [x, y] = cellXY(gi, L); tile(g, x, y, L, p, faceUp(p), {sel: sel === gi}); }
      if (mv) {
        if (mv.q) { const [x, y] = cellXY(mv.to, L); tile(g, x, y, L, mv.q, faceUp(mv.q)); }
        const [x1, y1] = cellXY(mv.f, L), [x2, y2] = cellXY(mv.to, L), k = mv.t;
        tile(g, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k - Math.sin(k * Math.PI) * th * .35, L, mv.p, faceUp(mv.p), {scale: 1 + .08 * Math.sin(k * Math.PI)});
      }
      if (fade) {
        const [x, y] = cellXY(fade.at, L), k = fade.t;
        for (const p of fade.list) tile(g, x, y, L, p, faceUp(p), {alpha: 1 - k, scale: 1 + k * .3});
        g.globalAlpha = Math.max(0, 1 - k); g.strokeStyle = '#ffd76a'; g.lineWidth = 3;
        for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, r1 = th * (.4 + k * .6), r2 = th * (.7 + k * 1.1); g.beginPath(); g.moveTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); g.lineTo(x + Math.cos(an) * r2, y + Math.sin(an) * r2); g.stroke(); }
        g.globalAlpha = 1;
      }
      // legal targets
      if (sel >= 0 && st.ph === 'play' && ctx.canAct(st.turn)) for (const t of targets(st.b, sel)) {
        const [x, y] = cellXY(t, L);
        if (st.b[t]) { g.strokeStyle = C.red; g.lineWidth = 3; D.rr(g, x - tw * .58, y - th * .62, tw * 1.16, th * 1.24, 6); g.stroke(); }
        else D.hint(g, x, y, th * .22, 'rgba(63,140,110,.75)');
      }
    }
    function drawPanels(g, L) {
      const v = V();
      for (const [r, s] of [[L.top, 1 - v], [L.bot, v]]) {
        const turn = st.ph === 'play' && st.turn === s && !ctx.ended;
        const w = L.ctrl.row && r === L.bot ? r.w * .36 - 6 : r.w;
        g.save(); if (turn) { g.shadowColor = 'rgba(230,197,125,.8)'; g.shadowBlur = 14; }
        D.paper(g, r.x, r.y, w, r.h, {r: 10}); g.restore();
        g.strokeStyle = turn ? C.gold2 : 'rgba(120,90,50,.45)'; g.lineWidth = turn ? 2.5 : 1; D.rr(g, r.x + 1, r.y + 1, w - 2, r.h - 2, 9); g.stroke();
        const alive = st.b.filter(p => p && p.o === s).length;
        const big = r.h > 70, cx = r.x + 10, cy = r.y + r.h / 2;
        g.fillStyle = COL[s]; D.rr(g, cx, cy - 9, 8, 18, 3); g.fill();
        let sub = st.ph === 'setup' ? (st.done[s] ? '已布阵' : '布阵中…') : '存活 ' + alive + ' 子' + (st.rev[s] ? ' · 军旗已亮' : '');
        if (turn && ctx.isAI(s)) sub = '思考中' + '.'.repeat(1 + ((think * 3) | 0) % 3);
        D.text(g, ctx.name(s), cx + 16, cy - (big ? 12 : 9), {size: big ? 16 : 13, align: 'left', color: C.ink, weight: 700, maxW: w - 34, font: 'serif'});
        D.text(g, sub, cx + 16, cy + (big ? 12 : 9), {size: big ? 13 : 11, align: 'left', color: turn ? C.red : C.ink2, weight: 600, maxW: w - 34});
      }
    }
    status();
    return inst;
  },
});
