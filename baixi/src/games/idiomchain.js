/* 成语接龙 — turn game. Idiom list in _words_data.js (BX.data.idioms = [[成语, 首字拼音, 尾字拼音], ...], sorted by frequency). */
const D = BX.draw, C = BX.C;
const tl = p => String(p || '').replace(/[1-5]$/, '');          // toneless pinyin
let IX = null;
function index() {
  if (IX) return IX;
  const L = BX.data.idioms || [], at = new Map(), byC = new Map(), byP = new Map();
  const push = (m, k, i) => { let a = m.get(k); if (!a) m.set(k, a = []); a.push(i); };
  L.forEach((x, i) => { at.set(x[0], i); push(byC, x[0][0], i); push(byP, tl(x[1]), i); });
  IX = {L, at, byC, byP};
  return IX;
}
/* all idiom indices that may follow idiom j (ignores used) */
function nexts(j, homo) {
  const {L, byC, byP} = index(), w = L[j][0], last = w[3];
  const a = byC.get(last) || [];
  if (!homo) return a;
  const b = byP.get(tl(L[j][2])) || [];
  if (!b.length) return a;
  const s = new Set(a); for (const i of b) s.add(i);
  return [...s].sort((x, y) => x - y);
}
function follows(j, k, homo) {
  const {L} = index(), last = L[j][0][3], first = L[k][0][0];
  return first === last || (homo && tl(L[k][1]) === tl(L[j][2]));
}
const pyMark = p => { // yi1 -> yī
  const m = /^([a-zv]+)([1-5])$/.exec(p || ''); if (!m) return p || '';
  let s = m[1].replace(/v/g, 'ü'); const t = +m[2]; if (t === 5) return s;
  const V = {a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ'};
  let pos = s.search(/[ae]/); if (pos < 0) pos = s.indexOf('ou'); if (pos < 0) { for (let i = s.length - 1; i >= 0; i--) if (V[s[i]]) { pos = i; break; } }
  if (pos < 0) return s;
  return s.slice(0, pos) + V[s[pos]][t - 1] + s.slice(pos + 1);
};

BX.register({
  id: 'idiomchain', title: '成语接龙', cat: 'words', order: 1, sub: '首尾相接，接不上就出局',
  desc: '下一个成语必须以上一个成语的最后一个字开头。词库收录近五千条常用成语，可选同音也算；接不上、超时或认输就出局，坚持到最后者胜。',
  kind: 'turn', seats: [2, 4], defSeats: 2, aiDelay: 900,
  options: [
    {key: 'rule', label: '接法', choices: [['char', '同字相接'], ['sound', '同音也可']], def: 'char'},
    {key: 'time', label: '每步限时', choices: [[20, '20 秒'], [30, '30 秒'], [60, '60 秒']], def: 30},
  ],
  rules: `<p><b>基本规则</b>：系统先出一个成语，玩家依次接龙——下一个成语的<b>第一个字</b>必须与上一个成语的<b>最后一个字</b>相同。例：一心一<b>意</b> → <b>意</b>气风<b>发</b> → <b>发</b>扬光大……</p>
<p><b>同音也可</b>（可选）：首字与上一个尾字<b>读音相同</b>（不计声调）也算，例如「…风<b>发</b>」后可以接「<b>法</b>不容情」。默认为同字相接。</p>
<p>每局中<b>同一个成语不能重复使用</b>；只承认词库中收录的四字成语。</p>
<p><b>出局</b>：轮到你时在限时内（20/30/60 秒）接不上、超时或点「认输」即出局，由下一位玩家接同一个成语。两人对战时出局即负；多人时最后留下的一位获胜。</p>
<p><b>提示</b>：每人每局 3 次，点「提示」会亮出一个可接成语的前两个字。</p>
<p>输入：直接用输入法打出成语，按回车或「接龙」提交。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#f4ead2'});
    g.fillStyle = 'rgba(90,70,40,.08)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(w * (.1 + i * .18), h * .95, w * .2, h * .18, 0, Math.PI, 0); g.fill(); }
    const row = (txt, y, x0, s, seal) => {
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * s * 1.06;
        if (seal === i) { g.fillStyle = C.red; D.rr(g, x, y, s, s, s * .12); g.fill(); }
        else { g.strokeStyle = 'rgba(178,58,43,.45)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, s - 1, s - 1); g.setLineDash([2, 2]); g.beginPath(); g.moveTo(x, y + s / 2); g.lineTo(x + s, y + s / 2); g.moveTo(x + s / 2, y); g.lineTo(x + s / 2, y + s); g.stroke(); g.setLineDash([]); }
        D.text(g, txt[i], x + s / 2, y + s * .54, {size: s * .78, color: seal === i ? '#fbe9d0' : C.ink, font: 'serif', weight: 800});
      }
    };
    const s = h * .27;
    row('一心一意', h * .1, w * .06, s, 3);
    row('意气风发', h * .55, w * .06 + s * 1.06 * 3, s, 0);
    g.strokeStyle = C.red; g.lineWidth = 3; g.lineCap = 'round';
    const ax = w * .06 + s * 1.06 * 3 + s / 2; g.beginPath(); g.moveTo(ax, h * .1 + s + 3); g.lineTo(ax, h * .55 - 4); g.stroke();
    g.beginPath(); g.moveTo(ax - 5, h * .55 - 10); g.lineTo(ax, h * .55 - 3); g.lineTo(ax + 5, h * .55 - 10); g.stroke();
  },
  create(ctx) {
    const {L, at} = index();
    const n = ctx.n, homo = ctx.opts.rule === 'sound', LIMIT = +ctx.opts.time || 30;
    // starting idiom: a common one with plenty of continuations
    const pool = [];
    for (let i = 0; i < Math.min(L.length, 1500); i++) { const k = nexts(i, false).length; if (k >= 6) pool.push(i); }
    const start = pool.length ? pool[ctx.rng.int(pool.length)] : 0;
    const st = {chain: [start], by: [-1], used: {[start]: 1}, alive: BX.range(n).map(() => true), hints: BX.range(n).map(() => 3),
      turn: 0, turnNo: 0, hint: null, out: [], last: null, over: false, winner: -1};
    /* ---------- view ---------- */
    const cv = ctx.canvas();
    const css = document.createElement('style');
    css.textContent = `.ic-bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;padding:8px max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));background:linear-gradient(180deg,rgba(38,23,12,.0),rgba(38,23,12,.92) 30%)}
.ic-in{flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid #c8a052;background:#fffaf0;color:#2b2118;font:700 20px "Noto Serif SC","Songti SC",serif;padding:0 12px;outline:none;letter-spacing:3px}
.ic-in:focus{border-color:#b23a2b;box-shadow:0 0 0 3px rgba(178,58,43,.25)}
.ic-in:disabled{background:#e9dfc8;color:#8c7a63}
.ic-bar .bx-btn{flex:none;padding:8px 12px;min-width:56px}
@media (max-width:420px){.ic-bar .bx-btn{padding:8px 9px;min-width:48px;font-size:14px}.ic-in{font-size:18px;letter-spacing:1px}}`;
    ctx.el.append(css);
    const ui = ctx.ui();
    const bar = BX.h('div', {class: 'ic-bar'});
    const inp = BX.h('input', {class: 'ic-in', type: 'text', maxlength: 8, autocomplete: 'off', enterkeyhint: 'send', placeholder: ''});
    const bGo = BX.h('button', {class: 'bx-btn red', text: '接龙'});
    const bHint = BX.h('button', {class: 'bx-btn jade', text: '提示'});
    const bGive = BX.h('button', {class: 'bx-btn ghost', text: '认输'});
    bar.append(inp, bGo, bHint, bGive); ui.append(bar);
    const BAR_H = () => bar.offsetHeight || 62;
    let tStart = performance.now(), slide = 1, shake = 0, lastTick = -1, flashOut = 0;
    const cur = () => st.chain[st.chain.length - 1];
    const need = () => { const j = cur(); return {ch: L[j][0][3], py: L[j][2]}; };
    function submit() {
      const s = st.turn;
      if (!ctx.canAct(s)) return;
      const w = inp.value.replace(/[\s，。,.!！?？]/g, '');
      if (!w) return;
      const err = check(w);
      if (err) { ctx.toast(err); ctx.sfx('error'); shake = 1; return; }
      inp.value = '';
      ctx.act({t: 'play', w}, s);
    }
    function check(w) {
      if (w.length !== 4) return '请输入四字成语';
      const k = at.get(w);
      if (k == null) return '词库里没有「' + w + '」';
      if (st.used[k]) return '「' + w + '」已经用过了';
      if (!follows(cur(), k, homo)) { const nd = need(); return '要以「' + nd.ch + '」' + (homo ? '（' + pyMark(nd.py) + '）' : '') + '开头'; }
      return null;
    }
    ctx.on(inp, 'keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } });
    ctx.on(bGo, 'click', submit);
    ctx.on(bHint, 'click', () => { const s = st.turn; if (ctx.canAct(s) && st.hints[s] > 0 && !(st.hint && st.hint.k === st.turnNo)) ctx.act({t: 'hint'}, s); });
    ctx.on(bGive, 'click', async () => { const s = st.turn; if (!ctx.canAct(s)) return; if (await BX.confirm('确定认输吗？你将出局。', '认输')) { if (ctx.canAct(s)) ctx.act({t: 'give'}, s); } });
    function refreshUI() {
      const s = st.turn, mine = !st.over && ctx.canAct(s);
      inp.disabled = !mine; bGo.disabled = !mine; bGive.disabled = !mine;
      bHint.disabled = !mine || st.hints[s] <= 0 || !!(st.hint && st.hint.k === st.turnNo);
      bHint.textContent = '提示' + (mine ? '·' + st.hints[s] : '');
      const nd = need();
      inp.placeholder = st.over ? '本局结束' : mine ? '接「' + nd.ch + '」字开头的成语' : '等待 ' + ctx.name(s) + '…';
      if (!mine && document.activeElement === inp) inp.blur();
    }
    const status = () => {
      for (let i = 0; i < n; i++) ctx.info(i, st.alive[i] ? '提示' + st.hints[i] : '出局');
      if (st.over) { ctx.status(ctx.name(st.winner) + ' 胜出 · 共接 ' + (st.chain.length - 1) + ' 个'); refreshUI(); return; }
      const nd = need();
      ctx.status((ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + ' ' : '轮到你') : ctx.name(st.turn) + ' 思考中') + ' · 接「' + nd.ch + '」');
      refreshUI();
    };
    const newTurn = () => { tStart = performance.now(); lastTick = -1; };
    const nextAlive = s => { for (let k = 1; k <= n; k++) { const t = (s + k) % n; if (st.alive[t]) return t; } return s; };
    function eliminate(s, why) {
      st.alive[s] = false; st.out.push(s); st.last = {s, why}; st.turnNo++; st.hint = null;
      ctx.sfx('buzz'); flashOut = 1;
      if (!ctx.fast) ctx.toast(ctx.name(s) + (why === 'time' ? ' 超时' : ' 认输') + '，出局');
      const left = BX.range(n).filter(i => st.alive[i]);
      if (left.length <= 1) {
        st.over = true; st.winner = left[0]; status();
        ctx.end({winner: st.winner, text: '共接 ' + (st.chain.length - 1) + ' 个成语，最后一个是「' + L[cur()][0] + '」'});
        return;
      }
      st.turn = nextAlive(s); newTurn();
    }
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid(a, by) {
        if (by !== st.turn || st.over) return false;
        if (a.t === 'play') return typeof a.w === 'string' && !check(a.w);
        if (a.t === 'hint') return st.hints[by] > 0 && !(st.hint && st.hint.k === st.turnNo);
        return a.t === 'give';
      },
      apply(a, by) {
        if (st.over) return;
        if (a.t === 'timeout') { if (a.k === st.turnNo) eliminate(st.turn, 'time'); return; }
        if (a.t === 'give') { eliminate(st.turn, 'give'); return; }
        if (a.t === 'hint') {
          st.hints[st.turn]--;
          const c = nexts(cur(), homo).filter(i => !st.used[i]);
          const top = c.slice(0, 6);
          const k = top.length ? top[ctx.rng.int(top.length)] : -1;
          st.hint = {k: st.turnNo, s: st.turn, txt: k >= 0 ? L[k][0].slice(0, 2) : ''};
          ctx.sfx('bell'); return;
        }
        if (a.t === 'play') {
          const k = at.get(a.w); if (k == null) return;
          st.chain.push(k); st.by.push(st.turn); st.used[k] = 1; st.turnNo++; st.hint = null; st.last = null;
          st.turn = nextAlive(st.turn); newTurn();
          slide = 0; ctx.anim(320, t => slide = t, null, BX.ease.out);
          ctx.sfx('pen');
        }
      },
      sysMove() {
        if (st.over) return null;
        const left = BX.test ? LIMIT * 1000 : Math.max(0, LIMIT * 1000 - (performance.now() - tStart));
        return {a: {t: 'timeout', k: st.turnNo}, delay: left};
      },
      aiMove(seat, level) {
        const j = cur();
        const know = level === 1 ? 1500 : level === 2 ? 3200 : 1e9;
        const c = nexts(j, homo).filter(i => !st.used[i] && i < know);
        if (!c.length) return {t: 'give'};
        if (level === 1 && c.length <= 2 && Math.random() < .25) return {t: 'give'};
        const cont = k => nexts(k, homo).reduce((s, i) => s + (st.used[i] || i === k ? 0 : 1), 0);
        if (level === 1) return {t: 'play', w: L[BX.pick(c)][0]};
        const sample = c.length > 120 ? BX.shuffle(c.slice()).slice(0, 120) : c;
        if (level === 2 && Math.random() < .6) return {t: 'play', w: L[BX.pick(sample.filter(k => cont(k) > 0).length ? sample.filter(k => cont(k) > 0) : sample)][0]};
        const scored = sample.map(k => [k, -cont(k) + Math.random() * (level === 3 ? .5 : 2)]);
        return {t: 'play', w: L[BX.ai.byLevel(scored, level)][0]};
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear();
        const W = cv.w, H = cv.h - BAR_H() + 6;
        const land = W > H * 1.25;
        // table + scroll
        const m = Math.max(8, Math.min(W, H) * .03);
        const sx = m + (land ? 14 : 4), sy = m + (land ? 4 : 12), sw = W - 2 * sx, sh = H - 2 * sy;
        g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16; g.shadowOffsetY = 4; g.fillStyle = '#efe2c4'; g.fillRect(sx, sy, sw, sh); g.restore();
        D.paper(g, sx, sy, sw, sh, {color: '#f4ead2'});
        // faint ink mountains
        g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
        for (let i = 0; i < 3; i++) {
          g.fillStyle = `rgba(70,60,45,${.05 + i * .02})`; g.beginPath(); g.moveTo(sx, sy + sh);
          for (let x = 0; x <= sw; x += 12) g.lineTo(sx + x, sy + sh - sh * (.12 + i * .05) - Math.sin(x * .012 + i * 2) * sh * .05 - Math.sin(x * .031 + i) * sh * .03);
          g.lineTo(sx + sw, sy + sh); g.fill();
        }
        g.restore();
        // rollers
        const rl = (x, y, w2, h2) => { const gr = land ? g.createLinearGradient(x, 0, x + w2, 0) : g.createLinearGradient(0, y, 0, y + h2); gr.addColorStop(0, '#5a2e16'); gr.addColorStop(.5, '#a8643a'); gr.addColorStop(1, '#4a2410'); g.fillStyle = gr; D.rr(g, x, y, w2, h2, 5); g.fill(); };
        if (land) { rl(sx - 14, sy - 6, 14, sh + 12); rl(sx + sw, sy - 6, 14, sh + 12); } else { rl(sx - 6, sy - 12, sw + 12, 12); rl(sx - 6, sy + sh, sw + 12, 12); }
        // geometry
        const pad = Math.min(sw, sh) * .05;
        const B = Math.max(30, Math.min(sw * (land ? .1 : .19), sh * .17, 104));
        const timerR = B * .42;
        // big current idiom
        const j = cur(), w = L[j][0], pys = (BX.data.idiomPy || {})[w] || [];
        const bigW = B * 4 + B * .12 * 3;
        const histW = land ? sw * .42 : sw - 2 * pad;
        const bx0 = land ? sx + sw * .47 + (sw * .53 - bigW) / 2 : sx + (sw - bigW) / 2;
        const by0 = land ? sy + sh * .5 - B * .75 : sy + sh - pad - B * 2.15;
        const off = (1 - slide) * B * .8;
        g.globalAlpha = .3 + .7 * slide;
        for (let i = 0; i < 4; i++) {
          const x = bx0 + i * B * 1.12, y = by0 + off;
          if (i === 3 && !st.over) {
            g.save(); g.shadowColor = 'rgba(120,20,10,.35)'; g.shadowBlur = 8; g.fillStyle = C.red; D.rr(g, x, y, B, B, B * .1); g.fill(); g.restore();
            g.strokeStyle = 'rgba(255,230,200,.6)'; g.lineWidth = 1.5; D.rr(g, x + 3, y + 3, B - 6, B - 6, B * .08); g.stroke();
          } else {
            g.fillStyle = 'rgba(255,252,240,.7)'; g.fillRect(x, y, B, B);
            g.strokeStyle = 'rgba(178,58,43,.55)'; g.lineWidth = 1.5; g.strokeRect(x, y, B, B);
            g.setLineDash([3, 3]); g.lineWidth = 1; g.strokeStyle = 'rgba(178,58,43,.3)'; g.beginPath(); g.moveTo(x, y + B / 2); g.lineTo(x + B, y + B / 2); g.moveTo(x + B / 2, y); g.lineTo(x + B / 2, y + B); g.moveTo(x, y); g.lineTo(x + B, y + B); g.moveTo(x + B, y); g.lineTo(x, y + B); g.stroke(); g.setLineDash([]);
          }
          D.text(g, w[i], x + B / 2, y + B * .54, {size: B * .74, color: i === 3 && !st.over ? '#fff3e0' : C.ink, font: 'serif', weight: 800});
          D.text(g, pyMark(pys[i]), x + B / 2, y - B * .2, {size: Math.max(11, B * .2), color: C.ink2, font: 'sans', weight: 500});
        }
        g.globalAlpha = 1;
        const by = st.by[st.by.length - 1];
        D.text(g, by < 0 ? '开局题目' : ctx.name(by) + ' 接出', bx0, by0 - B * .55, {size: Math.max(12, B * .2), color: by < 0 ? C.ink2 : ctx.color(by), align: 'left', weight: 700});
        // prompt line
        const nd = need(), py0 = by0 + B * 1.42;
        if (!st.over) {
          const msg = '请接「' + nd.ch + '」' + (homo ? '或同音 ' + pyMark(nd.py).replace(/[āáǎà]/g, 'a') : '');
          D.text(g, '轮到 ' + ctx.name(st.turn) + ' · ' + msg, bx0 + bigW / 2, py0, {size: Math.max(13, B * .22), color: C.ink, font: 'serif', weight: 700, maxW: land ? sw * .5 : sw - 2 * pad});
          if (st.hint && st.hint.k === st.turnNo) {
            const t = st.hint.txt ? '提示：' + st.hint.txt + '□□' : '提示：此字已无成语可接';
            D.text(g, t, bx0 + bigW / 2, py0 + B * .42, {size: Math.max(13, B * .22), color: C.jade, font: 'serif', weight: 800});
          }
          // timer ring
          const left = Math.max(0, LIMIT - (performance.now() - tStart) / 1000), k = left / LIMIT;
          const tx = land ? bx0 + bigW / 2 : sx + sw - pad - timerR, ty = land ? by0 - B * 1.25 : sy + pad + timerR;
          g.fillStyle = 'rgba(255,250,235,.8)'; D.circle(g, tx, ty, timerR); g.fill();
          g.strokeStyle = 'rgba(60,40,20,.15)'; g.lineWidth = timerR * .2; D.circle(g, tx, ty, timerR * .82); g.stroke();
          g.strokeStyle = left < 6 ? C.red : C.jade; g.beginPath(); g.arc(tx, ty, timerR * .82, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
          D.text(g, String(Math.ceil(left)), tx, ty + 1, {size: timerR * .8, color: left < 6 ? C.red : C.ink, font: 'deco', weight: 400});
          const sec = Math.ceil(left);
          if (sec <= 5 && sec !== lastTick && sec > 0 && ctx.canAct(st.turn)) { lastTick = sec; ctx.sfx('tick'); }
        } else {
          D.text(g, '— ' + ctx.name(st.winner) + ' 胜 —', bx0 + bigW / 2, py0 + B * .1, {size: Math.max(16, B * .32), color: C.red, font: 'deco', weight: 400});
        }
        // history (previous idioms)
        const hx = land ? sx + pad : sx + pad, hy = land ? sy + pad : sy + pad;
        const rowH = Math.max(24, Math.min(B * .5, 40));
        const hBottom = land ? sy + sh - pad : by0 - B * .9;
        const rows = Math.max(0, Math.floor((hBottom - hy - rowH * .9) / rowH));
        D.text(g, '接龙谱 · 第 ' + (st.chain.length - 1) + ' 接', hx, hy + rowH * .4, {size: Math.max(13, rowH * .5), color: C.red, font: 'deco', weight: 400, align: 'left'});
        const hist = [];
        for (let i = st.chain.length - 2; i >= 0 && hist.length < rows; i--) hist.push(i);
        hist.forEach((ci, r) => {
          const y = hy + rowH * (1.4 + r), a = Math.max(.25, 1 - r * .12);
          g.globalAlpha = a;
          const b2 = st.by[ci], iw = L[st.chain[ci]][0];
          g.fillStyle = b2 < 0 ? C.ink2 : ctx.color(b2); D.circle(g, hx + 6, y, 4.5); g.fill();
          D.text(g, iw.slice(0, 3), hx + 16, y, {size: rowH * .58, color: C.ink, font: 'serif', weight: 700, align: 'left'});
          const w3 = g.measureText(iw.slice(0, 3)).width;
          D.text(g, iw[3], hx + 16 + w3, y, {size: rowH * .58, color: C.red, font: 'serif', weight: 800, align: 'left'});
          D.text(g, b2 < 0 ? '开局' : ctx.name(b2), Math.min(hx + histW, hx + 16 + rowH * 3.6), y, {size: Math.max(11, rowH * .36), color: C.ink2, weight: 500, align: 'left'});
          g.globalAlpha = 1;
        });
        // players eliminated marks
        if (flashOut > 0) { flashOut = Math.max(0, flashOut - dt * 1.5); g.fillStyle = `rgba(178,58,43,${flashOut * .18})`; g.fillRect(0, 0, W, cv.h); }
        if (shake > 0) { shake = Math.max(0, shake - dt * 3); bar.style.transform = `translateX(${Math.sin(shake * 30) * 6 * shake}px)`; } else if (bar.style.transform) bar.style.transform = '';
      },
    };
    status();
    return inst;
  },
});
