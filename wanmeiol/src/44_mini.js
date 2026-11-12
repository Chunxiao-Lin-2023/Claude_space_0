/* ================= small games for things that are not fights =================
   举石锁 (timing bar) · 引雷 (shrinking ring) · 破阵 (lights-out) · 潜行 (step while the beast sleeps) · 搬石 (tap fast)
   They run in the 对话 screen like the 骨文 game. State lives in DLG.mini on the host; a co-op partner's taps arrive through
   miniTap (in CMD_NAMES). Moving parts are drawn from M.t0 (shifted to the guest's clock on arrival), so both screens agree.
   Every game can be skipped; story scenes treat a skip as passing without the bonus. A failed round never ends on its own:
   the player chooses 再试一次 (same game, fresh start) or 跳过 (the scene goes on with its failure text). */
const MINI = {
  lift: { title: '举石锁', hint: '石锁在晃。指针走到<b>红色区域</b>时点“发力”。',
    init: o => ({ rounds: o.rounds || 3, need: o.need || 2, r: 0, hits: 0, T: [1300, 1050, 860, 760], Z: [[38, 62], [43, 60], [46, 57], [48, 56]] }),
    pos: (M, t) => { const T = M.T[M.r] || 760, ph = (t % (2 * T)) / T; return (ph < 1 ? ph : 2 - ph) * 100; },
    tap(M) { const p = this.pos(M, now() - M.t0), z = M.Z[M.r] || M.Z[3], ok = p >= z[0] && p <= z[1]; M.hits += ok; M.last = ok ? '稳住了！' : p < z[0] ? '劲没使够' : '使猛了'; M.lastOk = ok; sfx(ok ? 'level' : 'miss'); M.r++; M.t0 = now();
      if (M.r >= M.rounds) return { end: M.hits >= M.need, score: M.hits }; },
    html(M) { const T = M.T[M.r] || 760, z = M.Z[M.r] || M.Z[3], age = now() - M.t0;
      return `<div class="mstack">${Array.from({ length: M.rounds }, (_, i) => `<span class="${i < M.r ? (i < M.hits ? 'ok' : 'no') : ''}">🪨</span>`).join('')}</div>
        <div class="mbar"><div class="mzone" style="left:${z[0]}%;width:${z[1] - z[0]}%"></div><div class="mmark" style="animation-duration:${T}ms;animation-delay:-${Math.max(0, age)}ms"></div></div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || `第 ${M.r + 1} / ${M.rounds} 下`}</div><button class="mbtn" onclick="miniTap()">💪 发力！</button>`; } },
  thunder: { title: '引雷', hint: '雷光落下来时圈会收紧。<b>圈刚好套住指尖</b>那一刻点“引雷”。',
    init: o => ({ n: o.strikes || 5, need: o.need || 3, i: 0, hits: 0, T: [1300, 1150, 1000, 900, 820, 760] }),
    T_(M) { return M.T[M.i] || 760; }, best: 0.727,
    tap(M) { const f = (now() - M.t0) / this.T_(M), ok = Math.abs(f - this.best) < 0.16; return this.next(M, ok, ok ? '雷光顺着手指钻了进去！' : f < this.best ? '早了，雷还没落下' : '晚了，被劈了个正着'); },
    next(M, ok, msg) { M.hits += ok; M.last = msg; M.lastOk = ok; sfx(ok ? 'magic' : 'hit'); M.i++; M.t0 = now(); if (M.i >= M.n) return { end: M.hits >= M.need, score: M.hits }; },
    check(M) { if (now() - M.t0 > this.T_(M) * 1.15) return this.next(M, false, '雷劈下来了，你没接住'); },
    html(M) { const T = this.T_(M), age = now() - M.t0;
      return `<div class="mstack">${Array.from({ length: M.n }, (_, i) => `<span class="${i < M.i ? 'ok' : ''}">${i < M.i ? '⚡' : '·'}</span>`).join('')}<small> 接住 ${M.hits}/${M.need}</small></div>
        <div class="mring"><div class="hand">☝️</div><div class="ring" style="animation-duration:${T}ms;animation-delay:-${Math.max(0, age)}ms"></div><div class="bolt" style="animation-duration:${T}ms;animation-delay:-${Math.max(0, age)}ms"></div></div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || '屏住呼吸……'}</div><button class="mbtn" onclick="miniTap()">⚡ 引雷！</button>`; } },
  /* 追光 (was lights-out, where a press also flipped its neighbours — too hard): one rune lights up at a time; tap it before it fades. Only that one changes. */
  lights: { title: '破阵', hint: '阵纹一道一道亮起来，<b>趁它还亮着点它</b>，就按灭了。按灭够数，阵就破了；漏掉几道也没关系。',
    init(o) { const n = 3; return { n, need: (o.presses || 4) + 3, hits: 0, miss: 0, lim: o.miss || 3, lit: rint(0, n * n - 1), T: o.T || 2200, bad: -1 }; },
    next(M) { let k; do k = rint(0, M.n * M.n - 1); while (k === M.lit); M.lit = k; M.t0 = now(); M.bad = -1; M._dirty = 1; },
    over(M) { if (M.hits >= M.need) return { end: true, score: M.miss === 0 ? 3 : M.miss <= 1 ? 2 : 1 }; if (M.miss > M.lim) return { end: false }; },
    tap(M, a) { if (typeof a !== 'number') return; if (a === M.lit) { M.hits++; M.last = '灭了'; M.lastOk = true; sfx('hit'); this.next(M); } else { M.miss++; M.bad = a; M.last = '不是那一道'; M.lastOk = false; sfx('miss'); M._dirty = 1; } return this.over(M); },
    check(M) { const T = M.T * Math.max(0.7, 1 - M.hits * 0.03); if (now() - M.t0 > T) { M.miss++; M.last = '那一道熄回去了'; M.lastOk = false; sfx('miss'); this.next(M); return this.over(M); } },
    tick(M, D) { const e = D.querySelector('.cell.on'); if (e) e.style.opacity = String(Math.max(0.45, 1 - (now() - M.t0) / (M.T * 1.4))); },
    html(M) { return `<div class="mgrid" style="grid-template-columns:repeat(${M.n},1fr)">${Array.from({ length: M.n * M.n }, (_, i) => `<button class="cell ${i === M.lit ? 'on' : ''} ${i === M.bad ? 'bad' : ''}" onclick="miniTap(${i})">${i === M.lit ? '符' : ''}</button>`).join('')}</div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || ''}　按灭 ${M.hits}/${M.need} · 漏掉 <span class="${M.miss >= M.lim ? 'bad' : ''}">${M.miss}/${M.lim}</span></div>`; } },
  sneak: { title: '潜行', hint: '老虎<b>睡熟（😴）</b>的时候点“迈一步”；它<b>眼皮在动（👀）</b>时千万别动。走 6 步就到了。',
    init(o) { const seg = []; let t = 0; for (let i = 0; i < 40; i++) { const s = i % 2 === 0 ? rint(1100, 1900) : rint(650, 1000); seg.push([t, i % 2 === 0 ? 'sleep' : 'stir']); t += s; } return { seg, need: o.steps || 6, steps: 0, alert: 0 }; },
    st(M) { const t = now() - M.t0; let s = 'sleep'; for (const [a, k] of M.seg) { if (a <= t) s = k; else break; } return s; },
    tap(M) { if (this.st(M) === 'sleep') { M.steps++; M.last = '……没醒。'; M.lastOk = true; sfx('step'); if (M.steps >= M.need) return { end: true, score: 3 - M.alert }; }
      else { M.alert++; M.last = M.alert >= 2 ? '老虎睁开了眼睛！' : '它耳朵动了一下……你僵在原地。'; M.lastOk = false; sfx('fail'); if (M.alert >= 2) return { end: false, score: 0 }; } },
    tick(M, D) { const s = this.st(M), e = D.querySelector('.tiger'); if (e) { e.textContent = s === 'sleep' ? '🐯😴' : '🐯👀'; e.classList.toggle('stir', s !== 'sleep'); } },
    html(M) { return `<div class="msneak"><div class="tiger">🐯😴</div><div class="path">${Array.from({ length: M.need }, (_, i) => `<span class="${i < M.steps ? 'ok' : ''}">${i < M.steps ? '👣' : '·'}</span>`).join('')}<span>🪷</span></div></div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || '屏住呼吸。'}${M.alert ? `　<span class="bad">惊动 ${M.alert}/2</span>` : ''}</div><button class="mbtn" onclick="miniTap()">🦶 迈一步</button>`; } },
  mash: { title: '搬石', hint: '<b>使劲连点</b>“用力”，在力气泄掉之前把它顶起来！',
    init: o => ({ m: 0, last: 0, lim: o.time || 7000, rate: o.rate || 9 }),
    val(M) { return Math.max(0, M.m - 28 * Math.max(0, now() - M.last) / 1000); },
    tap(M) { M.m = this.val(M) + M.rate; M.last = now(); sfx('step'); if (M.m >= 100) return { end: true, score: (now() - M.t0) < M.lim * 0.55 ? 3 : 2 }; },
    check(M) { if (now() - M.t0 > M.lim) return { end: false, score: 0 }; },
    tick(M, D) { const v = Math.min(100, this.val(M)), e = D.querySelector('.meter i'), t = D.querySelector('.mtime'); if (e) e.style.width = v + '%'; if (t) t.textContent = Math.max(0, (M.lim - (now() - M.t0)) / 1000).toFixed(1) + ' 秒'; },
    html(M) { return `<div class="meter"><i style="width:${Math.min(100, this.val(M))}%"></i></div><div class="mmsg">还剩 <span class="mtime"></span></div><button class="mbtn huge" onclick="miniTap()">💪 用力！</button>`; } },
};
function miniGame(kind, o = {}) {
  if (window.__dbg && __dbg.auto) return Promise.resolve({ ok: !__dbg.miniFail, score: __dbg.miniFail ? 0 : 3 });
  return new Promise(res => { DLG = { mini: miniNew(kind, o), res }; renderDlg(); netSync(); miniLoop(); });
}
function miniNew(kind, o, tries = 0) { const G = MINI[kind]; return Object.assign({ kind, o, tries, k: uid(), t0: now() + 600, title: o.title || G.title, desc: o.desc || '' }, G.init.call(G, o)); }
function miniLoop() { clearInterval(UI.miniT); UI.miniT = setInterval(() => { const M = DLG && DLG.mini; if (!M) { clearInterval(UI.miniT); return; } if (M.done) return; const G = MINI[M.kind];
  if (G.check && NETROLE !== 'guest' && now() > M.t0) { const r = G.check.call(G, M); if (r && r.end !== undefined) return miniEnd(r.end, r.score); if (r !== undefined || M._dirty) { M._dirty = 0; renderDlg(); netSync(); } }
  if (!M.started && now() >= M.t0) { M.started = 1; renderDlg(); }
  if (G.tick) G.tick.call(G, M, $('dlg')); }, 90); }
function miniTap(a) { const M = DLG && DLG.mini; if (!M || M.done || NETROLE === 'guest' || now() < M.t0) return; const G = MINI[M.kind], r = G.tap.call(G, M, a);
  if (r && r.end !== undefined) return miniEnd(r.end, r.score); renderDlg(); netSync(); }
function miniSkip() { const M = DLG && DLG.mini; if (!M || M.done || NETROLE === 'guest') return; miniEnd(false, 0, true); }
function miniEnd(ok, score, skip) { const M = DLG.mini; M.done = true; M.ok = ok; M.skip = !!skip; M.score = score || 0; sfx(ok ? 'epic' : skip ? 'click' : 'fail'); if (!ok && !skip) { M.ask = true; renderDlg(); netSync(); return; } renderDlg(); netSync();
  setTimeout(() => { const D_ = DLG; if (!D_ || D_.mini !== M) return; DLG = null; clearInterval(UI.miniT); renderDlg(); netSync(); D_.res({ ok, score: score || 0, skip: !!skip }); }, skip ? 50 : 1100); }
function miniRetry() { const M = DLG && DLG.mini; if (!M || !M.ask || NETROLE === 'guest') return; sfx('click'); DLG.mini = miniNew(M.kind, M.o, (M.tries || 0) + 1); renderDlg(); netSync(); miniLoop(); }
function miniGiveUp() { const D_ = DLG, M = D_ && D_.mini; if (!M || !M.ask || NETROLE === 'guest') return; sfx('click'); DLG = null; clearInterval(UI.miniT); renderDlg(); netSync(); D_.res({ ok: false, score: M.score || 0, skip: false, gaveUp: true }); }
function miniHtml(M) { const G = MINI[M.kind];
  if (M.ask) return `<div class="line"><div>${sealHtml({ n: M.title, c: '#7a4a1a' })}</div><div class="tx nar">没成……${M.tries ? `（已经试了 ${M.tries + 1} 回）` : ''}要再来一次吗？</div></div><div class="ch"><button class="chb" onclick="miniRetry()">↻ 再试一次</button><button class="chb" onclick="miniGiveUp()">跳过，接着往下</button></div>`;
  if (M.done) return `<div class="line"><div>${sealHtml({ n: M.title, c: '#7a4a1a' })}</div><div class="tx nar">${M.skip ? '先不玩了。' : '<b>成了！</b>'}</div></div>`;
  return `<div class="line"><div>${sealHtml({ n: M.title, c: '#7a4a1a' })}</div><div class="tx nar">${M.desc || ''}<div class="mhint">${(M.o && M.o.hint) || G.hint}</div></div></div>
    <div class="mini m-${M.kind}">${now() < M.t0 ? '<div class="mready">准备……</div>' : ''}${G.html.call(G, M)}</div><div class="ch"><button class="chb" onclick="miniSkip()">先不玩了（跳过）</button></div>`; }
addEventListener('keydown', e => { if (DLG && DLG.mini && !DLG.mini.done && (e.key === ' ' || e.key === 'Enter') && DLG.mini.kind !== 'lights') { e.preventDefault(); miniTap(); } }, true);
