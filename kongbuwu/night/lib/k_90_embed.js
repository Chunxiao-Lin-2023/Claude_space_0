/* ================= 嵌进恐怖屋：开始 / 结束 / 跳过 / 中途离开 =================
   - 结束画面：好结局 = 「继续」（回到恐怖屋）；死亡 / 坏结局 = 「从检查点重来」+「跳过这一夜（剧情照常往下走）」
   - 暂停菜单的「离开」：下次从检查点接着走（恐怖屋那边这一步不算完成）
   - 没有标题页、选章页、联机 */
function kPost(o) { try { if (window.parent !== window) window.parent.postMessage(Object.assign({ kbwNight: 1 }, o), '*'); } catch (e) { } window.__kbwLast = o; }
function kResult(kind) { const o = { t: 'done', id: W && W.ch.id, kind, f: {}, inv: [] }; if (W) { for (const k in W.f) if (k.startsWith('k_')) o.f[k] = W.f[k]; o.inv = W.inv.slice(); } return o; }
function kFinish(kind) { const o = kResult(kind); if (W && kind !== 'quit') store.del('cp.' + W.ch.id); quitChapter(); UI.show('play'); $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); ['endov', 'dlg', 'card', 'note', 'keypad'].forEach(i => $(i) && $(i).classList.add('hidden')); kPost(o); }
goSelect = function () { kFinish('quit'); };
drawTitleBG = function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH); };
{ const _sync = UI.sync.bind(UI);
  UI.sync = function (dt) { _sync(dt); const es = W && W.endScreen; if (!es) return; const B = $('enB'), key = es.kind + '|' + es.title; if (B.dataset.k === key && B.querySelector('[data-kb]')) return; B.dataset.k = key; B.innerHTML = '';
    const add = (t, f, pri) => { const b = document.createElement('button'); b.className = 'btn' + (pri ? ' primary' : ''); b.dataset.kb = 1; b.textContent = t; b.onclick = f; B.appendChild(b); };
    if (es.kind === 'end') add('继续', () => kFinish('end'), true);
    else { add('从检查点重来', () => sendAct('retry'), true); add('跳过这一夜（剧情照常往下走）', () => kFinish('skip')); }
    $('enL').classList.add('hidden'); setTimeout(() => this.focusFirst(), 900); }; }
window.addEventListener('message', ev => { const m = ev.data; if (!m || !m.kbwNight) return;
  if (m.t === 'play') { KENV = Object.assign({ lv: 1, items: [], pets: [], flags: {} }, m.env || {}); if (m.mute != null) AU.setMute(!!m.mute); const has = !!store.get('cp.' + m.id, null); if (!m.fromCp) store.del('cp.' + m.id); startChapter(m.id, !!(m.fromCp && has)); }
  if (m.t === 'mute') AU.setMute(!!m.mute); });
{ const _open = UI.open.bind(UI); UI.open = function (id) { _open(id); if (id === 'menu') { $('mHub').classList.add('hidden'); $('mQuit').textContent = '离开这一夜（下次从检查点接着走）'; } }; }
/* 恐怖屋测试用的小钩子（iframe 里没有 ?debug=1） */
window.__kn = { get W() { return W; }, doAct, SAPI, startChapter, retryFromCP, store, finish: kFinish };
