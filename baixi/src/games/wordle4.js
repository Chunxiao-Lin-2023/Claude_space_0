/* 汉字猜词 — guess the hidden 四字成语 in 6 tries (Wordle-style). Shared board; 2 players race alternately. */
const D = BX.draw, C = BX.C;
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
const pyMark = p => { // yi1 -> yī
  const m = /^([a-zv]+)([1-5])$/.exec(p || ''); if (!m) return p || '';
  let s = m[1].replace(/v/g, 'ü'); const t = +m[2]; if (t === 5) return s;
  const V = {a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ'};
  let pos = s.search(/[ae]/); if (pos < 0) pos = s.indexOf('ou'); if (pos < 0) { for (let i = s.length - 1; i >= 0; i--) if (V[s[i]]) { pos = i; break; } }
  return pos < 0 ? s : s.slice(0, pos) + V[s[pos]][t - 1] + s.slice(pos + 1);
};
/* 汉兜-style pinyin feedback per char: {i,f,t} strings + colour class 2 (same position) / 1 (elsewhere in the answer) / 0 */
function pyParts(gw, sw) {
  const P = BX.data.idiomPy || {}, gp = (P[gw] || []).map(split), sp = (P[sw] || []).map(split);
  return [0, 1, 2, 3].map(i => {
    const a = gp[i] || {i: '', f: '', t: ''}, cl = (k, v) => !v ? 0 : sp[i] && sp[i][k] === v ? 2 : sp.some(x => x[k] === v) ? 1 : 0;
    return {i: a.i, f: a.f.replace(/v/g, 'ü'), t: a.t, ci: cl('i', a.i), cf: cl('f', a.f), ct: cl('t', a.t)};
  });
}
const TONE = {1: 'ˉ', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', 5: '·'};
const meanOf = w => { const i = index().at.get(w); return i == null ? '' : (BX.data.idiomMean || [])[i] || ''; };
/* daily puzzle: local calendar day number → a fixed permutation of the 1200 most common idioms */
const DAILY_POOL = 1200;
const dayNo = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const dayStr = n => { const d = new Date(n * 864e5); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
const dayIdx = n => ((n % DAILY_POOL) * 7919 + 101) % DAILY_POOL;
/* could w be the answer, given every past guess h (guess h.w got colours h.r)? */
const consistent = (w, hist) => hist.every(h => { const r = score(h.w, w); return r.every((v, i) => v === h.r[i]); });

BX.register({
  id: 'wordle4', title: '汉字猜词', cat: 'words', order: 2, sub: '六次机会猜出四字成语',
  desc: '藏起一个四字成语，每猜一次，每个字会亮出颜色：绿色字对位置也对，黄色有这个字但位置不对，灰色没有。单人解谜，或两人轮流在同一块板上抢答。',
  kind: 'turn', seats: [1, 2], defSeats: 2, firstLabel: '先猜',
  options: [
    {key: 'day', label: '题目', choices: [[0, '随机出题'], [1, '每日一题']], def: 0},
    {key: 'py', label: '拼音提示', choices: [[0, '关闭'], [1, '显示拼音对照']], def: 0},
    {key: 'tries', label: '机会', choices: [[6, '6 次'], [8, '8 次'], [10, '10 次']], def: 6},
    {key: 'pool', label: '谜底范围', choices: [[800, '常用'], [2000, '较广'], [4000, '全部']], def: 800},
  ],
  rules: `<p>系统暗中选定一个<b>四字成语</b>。你有 <b>6 次</b>机会（可在开局时改成 8 或 10 次）把它猜出来，每次必须输入词库里的一个四字成语。</p>
<p>每次猜完，每个字会翻牌显示颜色：</p>
<ul><li><b style="color:#3f8f5b">绿色</b>：这个字在成语里，而且位置正确；</li>
<li><b style="color:#c8962a">黄色</b>：成语里有这个字，但不在这个位置；</li>
<li><b style="color:#7a7068">灰色</b>：成语里没有这个字。</li></ul>
<p>字重复时按经典规则计数：谜底里有几个就最多标几个绿/黄。</p>
<p><b>拼音提示</b>（可选）：每格下方显示这个字的拼音，<b>声母、韵母、声调</b>分别上色——绿色＝与谜底同一位置的相同，黄色＝谜底别的位置有，灰色＝谜底里没有。</p>
<p><b>每日一题</b>（可选）：按日期出题，同一天所有人的谜底相同，可以把结果格子复制给朋友比一比。</p>
<p><b>单人</b>：在规定次数内猜中即过关。<b>双人</b>：两人轮流在同一块板上猜同一个谜底，谁先猜中谁赢；次数用完都没人猜中则平局。</p>
<p>输入：用输入法打出成语后回车；也可以点下方「字盘」里已经出现过的字快速填入。</p>`,
  howto: ['在下方输入框打出一个四字成语，回车或点「猜」提交；开启辅助模式后输入框会实时变绿（词库里有）/变红（没有或已猜过）。', '字盘里列出猜过的字（绿/黄/灰），点一下即可填入，⌫ 删一个字。', '💡 提示会推荐下一步猜什么（开启辅助模式后还会告诉你还剩多少种可能）。觉得太难，开局时可把机会改成 8/10 次或打开拼音对照。', '点已经翻开的一行可查看该成语的拼音和释义；结束后可「复制成绩」分享格子。'],
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
    const TRIES = +ctx.opts.tries || 6;
    const n = ctx.n, poolN = Math.min(L.length, +ctx.opts.pool || 800), showPy = !!+ctx.opts.py;
    const secretI = ctx.rng.int(poolN), daily = !!+ctx.opts.day;
    const st = {sec: daily ? -1 : secretI, day: 0, rows: [], turn: 0, over: false, winner: -1};
    const secret = () => st.sec >= 0 ? L[st.sec][0] : '';
    /* ---------- view ---------- */
    const cv = ctx.canvas();
    const css = document.createElement('style');
    css.textContent = `.w4-bar{position:absolute;left:0;right:0;bottom:0;padding:6px max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));background:linear-gradient(180deg,rgba(38,23,12,0),rgba(38,23,12,.93) 22%)}
.w4-row{display:flex;gap:8px;align-items:center;max-width:640px;margin:0 auto}
.w4-in{flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid #c8a052;background:#fffaf0;color:#2b2118;font:700 20px "Noto Serif SC","Songti SC",serif;padding:0 12px;outline:none;letter-spacing:4px}
.w4-in:focus{border-color:#b23a2b}.w4-in:disabled{background:#e9dfc8}
.w4-in.ok{border-color:#3f8f5b;box-shadow:0 0 0 3px rgba(63,143,91,.25)}.w4-in.bad{border-color:#b23a2b;background:#fff1ea}
.w4-row .bx-btn.share{flex:1}
.w4-bar .bx-btn{flex:none;padding:8px 12px;min-width:52px}
.w4-keys{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-width:640px;margin:0 auto 6px;max-height:96px;overflow-y:auto}
.w4-keys button{min-width:40px;height:40px;border:none;border-radius:8px;font:700 19px "Noto Serif SC","Songti SC",serif;color:#fff;padding:0 4px;box-shadow:0 2px 0 rgba(0,0,0,.35)}
.w4-keys button.k2{background:#3f8f5b}.w4-keys button.k1{background:#c8962a}.w4-keys button.k0{background:#6d655d;color:#d8d0c6}
@media (max-height:500px){.w4-keys{max-height:46px}.w4-keys button{height:38px;min-width:38px}}
.w4-bar.side{left:auto;top:0;width:min(46%,400px);display:flex;flex-direction:column;justify-content:flex-end;padding-top:10px;background:linear-gradient(90deg,rgba(38,23,12,0),rgba(38,23,12,.9) 10%)}
.w4-bar.side .w4-keys{max-height:none;overflow-y:auto;flex:0 1 auto;margin-bottom:8px}.w4-bar.side .w4-row{width:100%}`;
    ctx.el.append(css);
    const ui = ctx.ui();
    const bar = BX.h('div', {class: 'w4-bar'});
    const keys = BX.h('div', {class: 'w4-keys'});
    const inp = BX.h('input', {class: 'w4-in', type: 'text', maxlength: 6, autocomplete: 'off', enterkeyhint: 'send'});
    const bDel = BX.h('button', {class: 'bx-btn ghost', text: '⌫'});
    const bGo = BX.h('button', {class: 'bx-btn red', text: '猜'});
    const bShare = BX.h('button', {class: 'bx-btn jade share', text: '复制成绩', hidden: true});
    const bAgain = BX.h('button', {class: 'bx-btn red share', text: '再来一局', hidden: true});
    bar.append(keys, BX.h('div', {class: 'w4-row'}, inp, bDel, bGo, bShare, bAgain)); ui.append(bar);
    const fine = window.matchMedia && matchMedia('(pointer:fine)').matches;
    let rowHits = [], focusN = -1;
    function liveCheck() {
      const w = inp.value.replace(/[\s，。,.]/g, ''), len = [...w].length;
      inp.className = 'w4-in' + (!ctx.assist || len < 4 ? '' : err(w) ? ' bad' : ' ok');   // live 词库 check = 辅助模式
    }
    ctx.on(inp, 'input', liveCheck);
    function shareText() {
      const head = '汉字猜词 ' + (daily ? '每日一题 ' + dayStr(st.day) : '随机题') + ' ' + (st.winner >= 0 ? st.rows.length : 'X') + '/' + TRIES;
      return head + '\n' + st.rows.map(r => r.r.map(v => ['⬜', '🟨', '🟩'][v]).join('')).join('\n');
    }
    ctx.on(bShare, 'click', async () => {
      const t = shareText(); let ok = false;
      try { await navigator.clipboard.writeText(t); ok = true; } catch (e) {}
      ctx.sfx('pop'); ctx.toast(ok ? '已复制，可以粘贴给朋友' : t.replace(/\n/g, ' '), 3000);
    });
    ctx.on(bAgain, 'click', () => BX.restart && BX.restart());
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e), h = rowHits.find(r => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
      if (!h) return;
      const w = h.word, py = ((BX.data.idiomPy || {})[w] || []).map(pyMark).join(' '), m = meanOf(w);
      ctx.sfx('tick'); ctx.toast('「' + w + '」' + py + (m ? '：' + m : ''), 4200);
    });
    let flip = {row: -1, t: 1}, shake = 0, keySig = '';
    function submit() {
      const s = st.turn; if (!ctx.canAct(s)) return;
      const w = inp.value.replace(/[\s，。,.]/g, '');
      const e = err(w); if (e) { ctx.toast(e); ctx.sfx('error'); ctx.buzz(30); shake = 1; return; }
      inp.value = ''; inp.className = 'w4-in'; ctx.act({w}, s);
    }
    const err = w => w.length !== 4 ? '请输入四个字' : !at.has(w) ? '词库里没有「' + w + '」' : st.rows.some(r => r.w === w) ? '这个已经猜过了' : null;
    ctx.on(inp, 'keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } });
    ctx.on(bGo, 'click', submit);
    ctx.on(bDel, 'click', () => { inp.value = [...inp.value].slice(0, -1).join(''); liveCheck(); });
    ctx.on(keys, 'click', e => { const b = e.target.closest('button'); if (!b || !ctx.canAct(st.turn)) return; if ([...inp.value].length < 4) inp.value += b.dataset.c; ctx.sfx('tick'); liveCheck(); });
    function knowledge() {   // best status per char seen so far
      const k = new Map();
      for (const r of st.rows) for (let i = 0; i < 4; i++) { const c = r.w[i]; k.set(c, Math.max(k.has(c) ? k.get(c) : -1, r.r[i])); }
      return k;
    }
    function refreshUI() {
      const mine = !st.over && st.sec >= 0 && ctx.canAct(st.turn);
      inp.disabled = bGo.disabled = bDel.disabled = !mine;
      for (const el of [inp, bDel, bGo]) el.hidden = st.over;
      bShare.hidden = !st.over; bAgain.hidden = !st.over || (ctx.online && !ctx.isHost);
      if (mine && fine && focusN !== st.rows.length && !ctx.fast) { focusN = st.rows.length; setTimeout(() => { if (!inp.disabled) inp.focus(); }, 30); }
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
      const left = TRIES - st.rows.length, tag = daily && st.day ? '每日一题 ' + (+dayStr(st.day).slice(5, 7)) + '月' + (+dayStr(st.day).slice(8)) + '日 · ' : '';
      if (st.sec < 0) ctx.status('正在出题…');
      else if (st.over) ctx.status(st.winner >= 0 ? (n === 1 ? '猜中了！' : ctx.name(st.winner) + ' 猜中') + ' · 谜底「' + secret() + '」' : '谜底是「' + secret() + '」');
      else if (n === 1) ctx.status(tag + '还剩 ' + left + ' 次机会');
      else ctx.status(tag + (ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + ' 猜' : '轮到你猜') : ctx.name(st.turn) + ' 思考中…') + ' · 剩 ' + left + ' 次');
      refreshUI();
    };
    let hintW = '';
    function endHtml(win) {
      const sw = secret(), py = ((BX.data.idiomPy || {})[sw] || []).map(pyMark).join(' '), m = meanOf(sw);
      const grid = '<div style="display:flex;flex-wrap:wrap;gap:5px 9px;justify-content:center;margin:4px 0">' + st.rows.map(r => '<span style="display:inline-flex;gap:2px">' + r.r.map(v => '<i style="width:12px;height:12px;border-radius:2px;display:inline-block;background:' + ['#7a7068', '#c8962a', '#3f8f5b'][v] + '"></i>').join('') + '</span>').join('') + '</div>';
      let html = '谜底：<b style="font-size:20px;color:#b23a2b">' + BX.esc(sw) + '</b><div style="font-size:13px;color:var(--ink3)">' + BX.esc(py) + '</div>' + (m ? '<div style="font-size:14px;margin:4px 0 8px">' + BX.esc(m) + '</div>' : '') + grid;
      if (n === 1 && !ctx.fast && !BX.test && !BX.bot) {
        const key = daily ? 'statD' : 'statR', s0 = ctx.load(key, {p: 0, w: 0, cur: 0, max: 0, last: 0, dist: [0, 0, 0, 0, 0, 0]});
        if (!(daily && s0.last === st.day)) {
          s0.p++; if (win) { s0.w++; s0.dist[st.rows.length - 1]++; }
          s0.cur = win ? (daily && s0.last && s0.last !== st.day - 1 ? 1 : s0.cur + 1) : 0; s0.max = Math.max(s0.max, s0.cur); s0.last = st.day || s0.last;
          ctx.save(key, s0);
        }
        html += '<div style="font-size:13px;color:var(--ink3);margin-top:8px">' + (daily ? '每日一题' : '单人') + '：玩了 ' + s0.p + ' 局 · 胜率 ' + Math.round(100 * s0.w / Math.max(1, s0.p)) + '% · 当前连胜 ' + s0.cur + ' · 最长 ' + s0.max + '</div>';
        if (daily) html += '<div style="font-size:12px;color:var(--ink3)">明天再来挑战新的一题；结束后可点下方「复制成绩」分享。</div>';
      }
      return html;
    }
    const inst = {
      st,
      toMove: () => st.over || st.sec < 0 ? null : st.turn,
      valid: (a, by) => by === st.turn && st.sec >= 0 && typeof a.w === 'string' && !err(a.w),
      sysMove: () => daily && st.sec < 0 ? {a: {t: 'day', d: dayNo()}, delay: 0} : null,
      apply(a, by) {
        if (st.over) return;
        if (a.t === 'day') { if (st.sec < 0 && by < 0) { st.day = a.d | 0; st.sec = dayIdx(st.day); } return; }
        if (st.sec < 0) return;
        hintW = '';
        const r = score(a.w, secret());
        st.rows.push({w: a.w, r, by});
        flip = {row: st.rows.length - 1, t: 0}; ctx.anim(900, t => flip.t = t, null, t => t);
        ctx.sfx('flip');
        if (!ctx.fast) ctx.after(420, () => ctx.sfx('flip'));
        const win = r.every(v => v === 2);
        if (win || st.rows.length >= TRIES) {
          st.over = true; st.winner = win ? by : -1; status();
          const res = n === 1 ? {win} : {winner: win ? by : -1};
          res.html = endHtml(win);
          res.delay = 1500;
          ctx.end(res); return;
        }
        if (n === 2) st.turn = 1 - st.turn;
      },
      aiMove(seat, level) {
        const pn = daily ? DAILY_POOL : poolN, sz = Math.min(L.length, level === 1 ? pn * 3 : level === 2 ? pn * 1.5 : pn);   // the answer pool size is public (option)
        const used = new Set(st.rows.map(r => r.w));
        const cand = [];
        // weaker levels "forget" part of the feedback: 中级 sometimes ignores the latest row, 初级 only uses a random half
        let know = st.rows;
        if (level === 2 && know.length > 1 && Math.random() < .45) know = know.slice(0, -1);
        if (level === 1) know = know.filter(() => Math.random() < .5);
        for (let i = 0; i < sz; i++) { const w = L[i][0]; if (!used.has(w) && consistent(w, know)) cand.push(w); }
        if (level === 1 && st.rows.length && Math.random() < .35) { // sloppy: ignore part of the feedback
          const loose = []; const last = st.rows[st.rows.length - 1];
          for (let i = 0; i < sz && loose.length < 300; i++) { const w = L[i][0]; if (!used.has(w) && [...w].some(c => last.w.includes(c) && last.r[last.w.indexOf(c)] > 0)) loose.push(w); }
          if (loose.length) return {w: BX.pick(loose)};
        }
        if (!cand.length) { // fall back: any unused idiom
          for (let i = 0; i < L.length; i++) if (!used.has(L[i][0])) { cand.push(L[i][0]); if (cand.length > 50) break; }
          return {w: BX.pick(cand)};
        }
        if (level === 3 && cand.length > 2) {   // pick the guess that splits the remaining set best
          const sample = cand.length > 120 ? BX.shuffle(cand.slice()).slice(0, 120) : cand.slice();
          const left = TRIES - st.rows.length;
          // with many possibilities left, also consider "probe" idioms that can't be the answer but test many likely characters
          if (cand.length > 12 && left > 2) for (let k = 0; k < 120; k++) { const w = L[Math.floor(Math.random() * Math.min(L.length, pn * 2))][0]; if (!used.has(w)) sample.push(w); }
          const cs = new Set(cand);
          const tgt = cand.length > 400 ? BX.shuffle(cand.slice()).slice(0, 400) : cand;
          let best = sample[0], bs = Infinity;
          for (const g of sample) {
            const buckets = new Map();
            for (const t of tgt) { const k = score(g, t).join(''); buckets.set(k, (buckets.get(k) || 0) + 1); }
            let e = 0; for (const v of buckets.values()) e += v * v;
            e /= tgt.length; if (cs.has(g)) e -= 1;     // a possible answer may win outright
            if (e < bs) { bs = e; best = g; }
          }
          return {w: best};
        }
        return {w: level === 2 ? cand[Math.floor(Math.random() * Math.min(cand.length, 30))] : BX.pick(cand)};
      },
      onTurn: status,
      showHint(a) {
        if (!a || !a.w) return;
        let c = 0; if (ctx.assist) for (let i = 0; i < (daily ? DAILY_POOL : poolN); i++) if (consistent(L[i][0], st.rows) && !st.rows.some(r => r.w === L[i][0])) c++;
        hintW = a.w; inp.value = a.w; liveCheck();
        const maybe = consistent(a.w, st.rows);
        ctx.toast((ctx.assist && st.rows.length ? '谜底范围内还有 ' + c + ' 个成语符合所有线索。' : '') + '试试「' + a.w + '」' + (maybe ? (st.rows.length ? '，说不定就是它' : '') : '——它不是答案，但能一次排除很多可能'), 4000);
      },
      frame(dt) {
        const g = cv.g; cv.clear();
        const side = cv.w > cv.h * 1.3 && cv.h < 560;      // landscape phone: input panel goes to the right
        if (bar.classList.contains('side') !== side) bar.classList.toggle('side', side);
        const bh = side ? 0 : bar.offsetHeight || 110;
        const W = side ? cv.w - (bar.offsetWidth || cv.w * .45) : cv.w, H = cv.h - bh;
        const land = W > H * 1.3;
        const cell = Math.max(24, Math.min((H - 24) / (TRIES * (showPy ? 1.38 : 1.17) + (showPy ? 1.1 : .3)), (land ? W * .55 : W - 28) / (4 * 1.12 + (n === 2 ? 1.1 : 0)), 78));
        const gap = cell * .12, rowGap = cell * (showPy ? .38 : .17);
        rowHits = [];
        const gw = 4 * cell + 3 * gap, gh = TRIES * cell + (TRIES - 1) * rowGap;
        const ox = (W - gw) / 2 + (n === 2 ? cell * .5 : 0), oy = Math.max(10, (H - gh) / 2);
        // board paper
        const px = ox - cell * .5 - (n === 2 ? cell * 1.05 : 0), py = oy - cell * .32, pw = gw + cell + (n === 2 ? cell * 1.05 : 0), ph = gh + cell * (showPy ? 1.25 : .64);
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
          if (row) rowHits.push({x: ox - gap, y: y - rowGap / 2, w: gw + gap * 2, h: cell + rowGap, word: row.w});
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
              const q = pyParts(row.w, secret())[i], PC = ['#8a8178', '#b8841c', '#2f8a52'];
              const fs = Math.max(10, Math.min(16, cell * .24)), segs = [[q.i, q.ci], [q.f, q.cf], [TONE[q.t] || '', q.ct]].filter(z => z[0]);
              g.font = `700 ${fs}px ${BX.F.sans}`;
              const tw = segs.reduce((a2, z) => a2 + g.measureText(z[0]).width, 0) + (segs.length - 1) * 1.5;
              let xx = x + cell / 2 - tw / 2;
              for (const [t, c] of segs) { D.text(g, t, xx, y + cell + rowGap * .48, {size: fs, color: PC[c], weight: 700, align: 'left'}); xx += g.measureText(t).width + 1.5; }
            }
          }
        }
        if (showPy) {
          const ly = py + ph - cell * .22, lx = px + pw / 2, fs = Math.max(10, Math.min(13, cell * .2));
          D.text(g, '拼音：绿＝同位相同 · 黄＝别处有 · 灰＝没有', lx, ly, {size: fs, color: C.ink2, weight: 600, maxW: pw - 16});
        }
        if (hintW && !st.over && !inp.value) hintW = '';
        // reveal answer when lost
        if (st.over) {
          const fs2 = Math.max(15, cell * .32), yy = Math.min(H - 14 - (land ? 0 : fs2 * .9), py + ph + 18);
          if (st.winner < 0) D.text(g, '谜底：' + secret(), W / 2, yy, {size: fs2, color: '#ffd9a0', font: 'serif', weight: 800, shadow: true});
          const m = meanOf(secret());
          if (m) D.text(g, m, W / 2, Math.min(H - 10, yy + (st.winner < 0 ? fs2 * 1.05 : 0)), {size: Math.max(12, fs2 * .6), color: '#f3e2c0', weight: 500, shadow: true, maxW: W - 24});
        }
        if (!st.over && st.rows.length && !land && H - (py + ph) > 30) D.text(g, '点已翻开的一行看释义', W / 2, py + ph + 14, {size: 12, color: 'rgba(243,226,192,.6)', weight: 500});
        if (shake > 0) { shake = Math.max(0, shake - dt * 3); bar.style.transform = `translateX(${Math.sin(shake * 30) * 6 * shake}px)`; } else if (bar.style.transform) bar.style.transform = '';
      },
    };
    status();
    return inst;
  },
});
