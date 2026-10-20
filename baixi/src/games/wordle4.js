/* 汉字猜词 — guess the hidden 四字成语 in 6 tries (Wordle-style). Shared board; 2 players race alternately. */
const D = BX.draw, C = BX.C;
const TRIES = 6;
let IX = null;
function index() {
  if (IX) return IX;
  const L = BX.data.idioms || [], at = new Map();
  L.forEach((x, i) => at.set(x[0], i));
  return IX = {L, at};
}
/* classic Wordle scoring with duplicate handling: 2 = right place, 1 = present elsewhere, 0 = absent */
function score(guess, secret) {
  const r = [0, 0, 0, 0], left = {};
  for (let i = 0; i < 4; i++) { if (guess[i] === secret[i]) r[i] = 2; else left[secret[i]] = (left[secret[i]] || 0) + 1; }
  for (let i = 0; i < 4; i++) if (r[i] !== 2 && left[guess[i]] > 0) { r[i] = 1; left[guess[i]]--; }
  return r;
}
const split = p => { const m = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw]?)([a-z]*)([1-5])$/.exec(p || ''); return m ? {i: m[1], f: m[2], t: m[3]} : {i: '', f: p, t: ''}; };
/* pinyin hint per char: [initial match, final match, tone match] each true/false (positional) */
function pyHint(gw, sw) {
  const P = BX.data.idiomPy || {}, gp = P[gw] || [], sp = P[sw] || [];
  return [0, 1, 2, 3].map(i => { const a = split(gp[i]), b = split(sp[i]); return [a.i === b.i ? 1 : 0, a.f === b.f ? 1 : 0, a.t === b.t ? 1 : 0]; });
}
const consistent = (w, hist) => hist.every(h => { const r = score(w, h.w); return r.every((v, i) => v === h.r[i]); });

BX.register({
  id: 'wordle4', title: '汉字猜词', cat: 'words', order: 2, sub: '六次机会猜出四字成语',
  desc: '藏起一个四字成语，每猜一次，每个字会亮出颜色：绿色字对位置也对，黄色有这个字但位置不对，灰色没有。单人解谜，或两人轮流在同一块板上抢答。',
  kind: 'turn', seats: [1, 2], defSeats: 2, firstLabel: '先猜',
  options: [
    {key: 'py', label: '拼音提示', choices: [[0, '关闭'], [1, '显示声母韵母']], def: 0},
    {key: 'pool', label: '谜底范围', choices: [[800, '常用'], [2000, '较广'], [4000, '全部']], def: 800},
  ],
  rules: `<p>系统暗中选定一个<b>四字成语</b>。你有 <b>6 次</b>机会把它猜出来，每次必须输入词库里的一个四字成语。</p>
<p>每次猜完，每个字会翻牌显示颜色：</p>
<ul><li><b style="color:#3f8f5b">绿色</b>：这个字在成语里，而且位置正确；</li>
<li><b style="color:#c8962a">黄色</b>：成语里有这个字，但不在这个位置；</li>
<li><b style="color:#7a7068">灰色</b>：成语里没有这个字。</li></ul>
<p>字重复时按经典规则计数：谜底里有几个就最多标几个绿/黄。</p>
<p><b>拼音提示</b>（可选）：每格下方显示三个小点，分别表示该位置的<b>声母、韵母、声调</b>是否与谜底相同（亮=相同）。</p>
<p><b>单人</b>：6 次内猜中即过关。<b>双人</b>：两人轮流在同一块板上猜同一个谜底，谁先猜中谁赢；6 次都没人猜中则平局。</p>
<p>输入：用输入法打出成语后回车；也可以点下方「字盘」里已经出现过的字快速填入。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#f2e6cc'});
    const s = h * .2, gap = s * .14, x0 = (w - (4 * s + 3 * gap)) / 2;
    const rows = [['画龙点睛', [0, 1, 2, 0]], ['画蛇添足', [2, 2, 0, 0]], ['画蛇', null]];
    const col = ['#8a8178', '#c8962a', '#3f8f5b'];
    rows.forEach(([t, r], y) => {
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (s + gap), yy = h * .1 + y * (s + gap * 2);
        if (r) { g.fillStyle = col[r[i]]; D.rr(g, x, yy, s, s, s * .14); g.fill(); }
        else { g.fillStyle = 'rgba(255,255,255,.6)'; D.rr(g, x, yy, s, s, s * .14); g.fill(); g.strokeStyle = 'rgba(80,60,40,.35)'; g.lineWidth = 1.5; g.stroke(); }
        if (t[i]) D.text(g, t[i], x + s / 2, yy + s * .54, {size: s * .66, color: r ? '#fff' : C.ink, font: 'serif', weight: 800});
      }
    });
    g.fillStyle = C.red; D.rr(g, w * .8, h * .74, h * .2, h * .2, 4); g.fill();
    D.text(g, '猜', w * .8 + h * .1, h * .845, {size: h * .14, color: '#fbe9d0', font: 'deco', weight: 400});
  },
  create(ctx) {
    const {L, at} = index();
    const n = ctx.n, poolN = Math.min(L.length, +ctx.opts.pool || 800), showPy = !!+ctx.opts.py;
    const secretI = ctx.rng.int(poolN);
    const st = {sec: secretI, rows: [], turn: 0, over: false, winner: -1};
    const secret = () => L[st.sec][0];
    /* ---------- view ---------- */
    const cv = ctx.canvas();
    const css = document.createElement('style');
    css.textContent = `.w4-bar{position:absolute;left:0;right:0;bottom:0;padding:6px max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));background:linear-gradient(180deg,rgba(38,23,12,0),rgba(38,23,12,.93) 22%)}
.w4-row{display:flex;gap:8px;align-items:center;max-width:640px;margin:0 auto}
.w4-in{flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid #c8a052;background:#fffaf0;color:#2b2118;font:700 20px "Noto Serif SC","Songti SC",serif;padding:0 12px;outline:none;letter-spacing:4px}
.w4-in:focus{border-color:#b23a2b}.w4-in:disabled{background:#e9dfc8}
.w4-bar .bx-btn{flex:none;padding:8px 12px;min-width:52px}
.w4-keys{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-width:640px;margin:0 auto 6px;max-height:96px;overflow-y:auto}
.w4-keys button{min-width:40px;height:40px;border:none;border-radius:8px;font:700 19px "Noto Serif SC","Songti SC",serif;color:#fff;padding:0 4px;box-shadow:0 2px 0 rgba(0,0,0,.35)}
.w4-keys button.k2{background:#3f8f5b}.w4-keys button.k1{background:#c8962a}.w4-keys button.k0{background:#6d655d;color:#d8d0c6}
@media (max-height:500px){.w4-keys{max-height:46px}.w4-keys button{height:38px;min-width:38px}}`;
    ctx.el.append(css);
    const ui = ctx.ui();
    const bar = BX.h('div', {class: 'w4-bar'});
    const keys = BX.h('div', {class: 'w4-keys'});
    const inp = BX.h('input', {class: 'w4-in', type: 'text', maxlength: 6, autocomplete: 'off', enterkeyhint: 'send'});
    const bDel = BX.h('button', {class: 'bx-btn ghost', text: '⌫'});
    const bGo = BX.h('button', {class: 'bx-btn red', text: '猜'});
    bar.append(keys, BX.h('div', {class: 'w4-row'}, inp, bDel, bGo)); ui.append(bar);
    let flip = {row: -1, t: 1}, shake = 0, keySig = '';
    function submit() {
      const s = st.turn; if (!ctx.canAct(s)) return;
      const w = inp.value.replace(/[\s，。,.]/g, '');
      const e = err(w); if (e) { ctx.toast(e); ctx.sfx('error'); shake = 1; return; }
      inp.value = ''; ctx.act({w}, s);
    }
    const err = w => w.length !== 4 ? '请输入四个字' : !at.has(w) ? '词库里没有「' + w + '」' : st.rows.some(r => r.w === w) ? '这个已经猜过了' : null;
    ctx.on(inp, 'keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } });
    ctx.on(bGo, 'click', submit);
    ctx.on(bDel, 'click', () => { inp.value = [...inp.value].slice(0, -1).join(''); });
    ctx.on(keys, 'click', e => { const b = e.target.closest('button'); if (!b || !ctx.canAct(st.turn)) return; if ([...inp.value].length < 4) inp.value += b.dataset.c; ctx.sfx('tick'); });
    function knowledge() {   // best status per char seen so far
      const k = new Map();
      for (const r of st.rows) for (let i = 0; i < 4; i++) { const c = r.w[i]; k.set(c, Math.max(k.has(c) ? k.get(c) : -1, r.r[i])); }
      return k;
    }
    function refreshUI() {
      const mine = !st.over && ctx.canAct(st.turn);
      inp.disabled = bGo.disabled = bDel.disabled = !mine;
      inp.placeholder = st.over ? '本局结束' : mine ? '输入一个四字成语' : '等待 ' + ctx.name(st.turn) + '…';
      const k = knowledge(), arr = [...k.entries()].sort((a, b) => b[1] - a[1]);
      const sig = arr.map(x => x.join('')).join(',');
      if (sig !== keySig) {
        keySig = sig; keys.innerHTML = '';
        if (!arr.length) keys.append(BX.h('span', {style: {color: '#d8c8a8', fontSize: '13px', padding: '8px'}, text: '猜过的字会出现在这里，可点选填入'}));
        for (const [c, v] of arr) keys.append(BX.h('button', {class: 'k' + v, 'data-c': c, text: c}));
      }
      if (!mine && document.activeElement === inp) inp.blur();
    }
    const status = () => {
      if (n === 2) for (let i = 0; i < 2; i++) ctx.info(i, st.rows.filter(r => r.by === i).length + ' 次');
      const left = TRIES - st.rows.length;
      if (st.over) ctx.status(st.winner >= 0 ? (n === 1 ? '猜中了！' : ctx.name(st.winner) + ' 猜中') + ' · 谜底「' + secret() + '」' : '谜底是「' + secret() + '」');
      else if (n === 1) ctx.status('还剩 ' + left + ' 次机会');
      else ctx.status((ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + ' 猜' : '轮到你猜') : ctx.name(st.turn) + ' 思考中…') + ' · 剩 ' + left + ' 次');
      refreshUI();
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: (a, by) => by === st.turn && typeof a.w === 'string' && !err(a.w),
      apply(a, by) {
        if (st.over) return;
        const r = score(a.w, secret());
        st.rows.push({w: a.w, r, by});
        flip = {row: st.rows.length - 1, t: 0}; ctx.anim(900, t => flip.t = t, null, t => t);
        ctx.sfx('flip');
        if (!ctx.fast) ctx.after(420, () => ctx.sfx('flip'));
        const win = r.every(v => v === 2);
        if (win || st.rows.length >= TRIES) {
          st.over = true; st.winner = win ? by : -1; status();
          const res = n === 1 ? {win, text: '谜底：' + secret() + (win ? '（第 ' + st.rows.length + ' 次猜中）' : '')} : {winner: win ? by : -1, text: '谜底：' + secret()};
          res.delay = 1500;
          if (n === 1) ctx.best('solved', win ? 1 : 0);
          ctx.end(res); return;
        }
        if (n === 2) st.turn = 1 - st.turn;
      },
      aiMove(seat, level) {
        const sz = level === 1 ? 900 : level === 2 ? 2500 : L.length;
        const used = new Set(st.rows.map(r => r.w));
        const cand = [];
        for (let i = 0; i < sz; i++) { const w = L[i][0]; if (!used.has(w) && consistent(w, st.rows)) cand.push(w); }
        if (level === 1 && st.rows.length && Math.random() < .35) { // sloppy: ignore part of the feedback
          const loose = []; const last = st.rows[st.rows.length - 1];
          for (let i = 0; i < sz && loose.length < 300; i++) { const w = L[i][0]; if (!used.has(w) && [...w].some(c => last.w.includes(c) && last.r[last.w.indexOf(c)] > 0)) loose.push(w); }
          if (loose.length) return {w: BX.pick(loose)};
        }
        if (!cand.length) { // fall back: any unused idiom
          for (let i = 0; i < L.length; i++) if (!used.has(L[i][0])) { cand.push(L[i][0]); if (cand.length > 50) break; }
          return {w: BX.pick(cand)};
        }
        if (level === 3 && cand.length > 2) {   // pick the candidate that splits the remaining set best
          const sample = cand.length > 60 ? BX.shuffle(cand.slice()).slice(0, 60) : cand;
          const tgt = cand.length > 200 ? BX.shuffle(cand.slice()).slice(0, 200) : cand;
          let best = sample[0], bs = Infinity;
          for (const g of sample) {
            const buckets = new Map();
            for (const t of tgt) { const k = score(g, t).join(''); buckets.set(k, (buckets.get(k) || 0) + 1); }
            let e = 0; for (const v of buckets.values()) e += v * v;
            if (e < bs) { bs = e; best = g; }
          }
          return {w: best};
        }
        return {w: level === 2 ? cand[Math.floor(Math.random() * Math.min(cand.length, 30))] : BX.pick(cand)};
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear();
        const bh = bar.offsetHeight || 110;
        const W = cv.w, H = cv.h - bh;
        const land = W > H * 1.3;
        const cell = Math.max(24, Math.min((H - 24) / (TRIES * (showPy ? 1.3 : 1.17) + (showPy ? .9 : .3)), (land ? W * .55 : W - 28) / (4 * 1.12 + (n === 2 ? 1.1 : 0)), 78));
        const gap = cell * .12, rowGap = cell * (showPy ? .3 : .17);
        const gw = 4 * cell + 3 * gap, gh = TRIES * cell + (TRIES - 1) * rowGap;
        const ox = (W - gw) / 2 + (n === 2 ? cell * .5 : 0), oy = Math.max(10, (H - gh) / 2);
        // board paper
        const px = ox - cell * .5 - (n === 2 ? cell * 1.05 : 0), py = oy - cell * .32, pw = gw + cell + (n === 2 ? cell * 1.05 : 0), ph = gh + cell * (showPy ? 1.05 : .64);
        g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 5; g.fillStyle = '#efe2c4'; D.rr(g, px, py, pw, ph, 10); g.fill(); g.restore();
        D.paper(g, px, py, pw, ph, {r: 10, color: '#f4ead2'});
        g.strokeStyle = 'rgba(178,58,43,.35)'; g.lineWidth = 2; D.rr(g, px + 5, py + 5, pw - 10, ph - 10, 7); g.stroke();
        const COL = ['#7a7068', '#c8962a', '#3f8f5b'];
        for (let r = 0; r < TRIES; r++) {
          const row = st.rows[r], y = oy + r * (cell + rowGap);
          const cur = !row && r === st.rows.length && !st.over;
          if (n === 2 && row) { g.fillStyle = ctx.color(row.by); D.circle(g, ox - cell * .62, y + cell / 2, cell * .2); g.fill(); D.text(g, ctx.name(row.by).slice(0, 1), ox - cell * .62, y + cell / 2, {size: cell * .22, color: '#fff', weight: 700}); }
          if (n === 2 && cur) { g.strokeStyle = ctx.color(st.turn); g.lineWidth = 2; D.circle(g, ox - cell * .62, y + cell / 2, cell * .2); g.stroke(); }
          const typed = cur && ctx.canAct(st.turn) ? [...inp.value].slice(0, 4) : [];
          for (let i = 0; i < 4; i++) {
            const x = ox + i * (cell + gap);
            let sy = 1, revealed = !!row;
            if (row && r === flip.row && flip.t < 1) { const k = BX.clamp(flip.t * 4 - i * .7, 0, 1); sy = Math.abs(1 - 2 * k); revealed = k > .5; }
            g.save(); g.translate(x + cell / 2, y + cell / 2); g.scale(1, Math.max(.02, sy)); g.translate(-cell / 2, -cell / 2);
            if (revealed) {
              g.fillStyle = COL[row.r[i]]; D.rr(g, 0, 0, cell, cell, cell * .12); g.fill();
              g.fillStyle = 'rgba(255,255,255,.12)'; D.rr(g, 2, 2, cell - 4, cell * .4, cell * .1); g.fill();
              D.text(g, row.w[i], cell / 2, cell * .54, {size: cell * .64, color: '#fff', font: 'serif', weight: 800});
            } else {
              g.fillStyle = cur ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.4)'; D.rr(g, 0, 0, cell, cell, cell * .12); g.fill();
              g.strokeStyle = cur ? 'rgba(178,58,43,.6)' : 'rgba(90,70,45,.28)'; g.lineWidth = cur ? 2 : 1.2; g.stroke();
              const ch = row ? row.w[i] : typed[i];
              if (ch) D.text(g, ch, cell / 2, cell * .54, {size: cell * .64, color: C.ink, font: 'serif', weight: 800});
            }
            g.restore();
            if (showPy && row && (r !== flip.row || flip.t >= 1)) {
              const hp = pyHint(row.w, secret())[i];
              for (let d = 0; d < 3; d++) { g.fillStyle = hp[d] ? ['#2f5d8a', '#3f8f5b', '#b23a2b'][d] : 'rgba(90,70,45,.2)'; D.circle(g, x + cell / 2 + (d - 1) * cell * .2, y + cell + rowGap * .5, Math.max(2.5, cell * .055)); g.fill(); }
            }
          }
        }
        if (showPy) {
          const ly = py + ph - cell * .2, lx = px + pw / 2, fs = Math.max(10, Math.min(13, cell * .2));
          ['声母', '韵母', '声调'].forEach((t, d) => { const x = lx + (d - 1) * fs * 4.2; g.fillStyle = ['#2f5d8a', '#3f8f5b', '#b23a2b'][d]; D.circle(g, x - fs * 1.3, ly, fs * .3); g.fill(); D.text(g, t, x + fs * .15, ly, {size: fs, color: C.ink2, weight: 600}); });
        }
        // reveal answer when lost
        if (st.over && st.winner < 0) D.text(g, '谜底：' + secret(), W / 2, Math.min(H - 14, py + ph + 18), {size: Math.max(15, cell * .32), color: '#ffd9a0', font: 'serif', weight: 800, shadow: true});
        if (st.over && st.winner < 0) { /* answer also shown in status line */ }
        if (shake > 0) { shake = Math.max(0, shake - dt * 3); bar.style.transform = `translateX(${Math.sin(shake * 30) * 6 * shake}px)`; } else if (bar.style.transform) bar.style.transform = '';
      },
    };
    ctx.on(inp, 'input', () => {});
    status();
    return inst;
  },
});
