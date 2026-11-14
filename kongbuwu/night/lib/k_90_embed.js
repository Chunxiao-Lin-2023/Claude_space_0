/* ================= 嵌进恐怖屋：开始 / 结束 / 跳过 / 中途离开 =================
   - 结束画面：好结局 = 「继续」（回到恐怖屋）；死亡 / 坏结局 = 「从检查点重来」+「跳过这一夜（剧情照常往下走）」
   - 暂停菜单的「离开」：下次从检查点接着走（恐怖屋那边这一步不算完成）
   - 没有标题页、选章页、联机 */
function kPost(o) { try { if (window.parent !== window) window.parent.postMessage(Object.assign({ kbwNight: 1 }, o), '*'); } catch (e) { } window.__kbwLast = o; }
function kResult(kind) { const o = { t: 'done', id: W && W.ch.id, kind, f: {}, inv: [] }; if (W) { for (const k in W.f) if (k.startsWith('k_')) o.f[k] = W.f[k]; o.inv = W.inv.slice(); }
  if (kind !== 'quit') { const gr = kGrade(kind); o.grade = gr.g; o.why = gr.why; } o.deaths = KST.deaths; o.aids = Object.assign({}, KST.aids); o.log = KLOG.slice(); o.title = W && W.ch.title; return o; }
function kFinish(kind) { const o = kResult(kind); if (W && kind !== 'quit') store.del('cp.' + W.ch.id); quitChapter(); UI.show('play'); $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); ['endov', 'dlg', 'card', 'note', 'keypad'].forEach(i => $(i) && $(i).classList.add('hidden')); kPost(o); }
goSelect = function () { kFinish('quit'); };
drawTitleBG = function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH); };
{ const _sync = UI.sync.bind(UI);
  UI.sync = function (dt) { _sync(dt); const cd = $('card'); if (cd) { const ep = !!(W && W.card && KEPIC); cd.classList.toggle('epic', ep); const sl = cd.querySelector('.kseal'); if (ep && sl && sl.textContent !== KEPIC.seal) sl.textContent = KEPIC.seal; }
    const es = W && W.endScreen; if (!es) return; const B = $('enB'), key = es.kind + '|' + es.title; if (B.dataset.k === key && B.querySelector('[data-kb]')) return; B.dataset.k = key; B.innerHTML = '';
    const add = (t, f, pri) => { const b = document.createElement('button'); b.className = 'btn' + (pri ? ' primary' : ''); b.dataset.kb = 1; b.textContent = t; b.onclick = f; B.appendChild(b); };
    if (es.kind === 'end') { add('继续', () => kFinish('end'), true); const gr = kGrade('end'), L = $('enL'); L.classList.remove('hidden'); L.innerHTML = '<b style="color:#e8c070;font-size:20px;letter-spacing:.2em">评价 ' + gr.g + '</b>　<span style="opacity:.8">' + esc(gr.why) + '</span>'; setTimeout(() => this.focusFirst(), 900); return; }
    else { add('从检查点重来', () => sendAct('retry'), true); add('跳过这一夜（剧情照常往下走）', () => kFinish('skip')); }
    $('enL').classList.add('hidden'); setTimeout(() => this.focusFirst(), 900); }; }
window.addEventListener('message', ev => { const m = ev.data; if (!m || !m.kbwNight) return;
  if (m.t === 'coopGuest') { KENV = Object.assign({ lv: 1, items: [], pets: [], flags: {} }, m.env || {}); if (m.mute != null) AU.setMute(!!m.mute); kDmInit(); return; }
  if (m.t === 'play') { KENV = Object.assign({ lv: 1, items: [], pets: [], flags: {} }, m.env || {}); if (m.mute != null) AU.setMute(!!m.mute); const has = !!store.get('cp.' + m.id, null); if (!m.fromCp) store.del('cp.' + m.id); startChapter(m.id, !!(m.fromCp && has)); if (m.coop === 'host') { kCoopStart('host'); kTell({ f: 'live', on: KDM.on, hot: document.querySelector('#klive b') ? document.querySelector('#klive b').textContent : '' }); } }
  if (m.t === 'mute') AU.setMute(!!m.mute); });
{ const _open = UI.open.bind(UI); UI.open = function (id) { _open(id); if (id === 'menu') { $('mHub').classList.add('hidden'); $('mQuit').textContent = '离开这一夜（下次从检查点接着走）'; $('mQuit').classList.toggle('hidden', KCOOP === 'guest'); $('mRetry').classList.toggle('hidden', KCOOP === 'guest' && !(W && W.cp)); } }; }
/* 恐怖屋测试用的小钩子（iframe 里没有 ?debug=1） */
window.__kn = { get W() { return W; }, doAct, SAPI, startChapter, retryFromCP, store, finish: kFinish };
