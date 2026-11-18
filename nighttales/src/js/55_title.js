/* ================= start screen: shared TitleKit (shared/titlekit) =================
   Same file in nighttales / guaitan2 / guaitan3 (百物语·壹/贰/叁). #title keeps its backdrop; its own buttons are hidden and
   TitleKit draws 继续 / 独自开始 / 双人联机 / 存档 / 怪谈档案 / 设置 / 操作说明. The chapter grid (#select) stays the game's own
   second-level screen; the co-op lobby is the TitleKit room. Checkpoints (cp.<chapter>) are the saves. */
{ const st = document.createElement('style'); st.textContent = '#title>*{visibility:hidden}'; document.head.appendChild(st); }
const tkCpAt = () => store.get('tk.cpat', {});
{ const s0 = store.set.bind(store); store.set = (k, v) => { s0(k, v); if (String(k).startsWith('cp.')) { const o = tkCpAt(); o[k.slice(3)] = Date.now(); s0('tk.cpat', o); } }; }
const tkChLine = ch => '第' + cnum(ch.n || CHAPTERS.indexOf(ch) + 1) + '夜 · ' + ch.title;
const tkTitleEl = $('title');
const TK = TitleKit.create({
  id: LSP.replace(/[^a-z0-9]/gi, '') || 'baiwuyu', title: tkTitleEl.querySelector('h1').textContent, hub: HUB, hubLabel: '百物语目录', onHub: () => { location.href = '../baiwuyu/'; },
  artifact: !NET_OK, z: 40, hidden: true, shade: false,
  logo: '<div class="tk-t" style="font-family:var(--serif);letter-spacing:.3em;padding-left:.3em;color:#d9cdb8;text-shadow:0 0 30px rgba(179,38,43,.45)">' + tkTitleEl.querySelector('h1').textContent + '</div>'
    + Array.from(tkTitleEl.querySelectorAll('.tag')).map((t, i) => '<div class="tk-s"' + (i === 0 && t.getAttribute('style') ? ' style="' + t.getAttribute('style') + ';margin:6px 0 0"' : '') + '>' + t.textContent + '</div>').join(''),
  accent: '#8e1f24', accentInk: '#f6e8e2', panel: 'rgba(14,10,14,.82)', font: 'var(--serif)',
  continueLabel: '继续',
  solo: { label: '独自开始', sub: '选一则今晚要听的怪谈', chev: true },
  online: { label: '双人联机', sub: '两人同看一盏灯 · 创建房间或用房间码加入', nick: false, hostText: '你当房主，选章节由你决定。两人看同一个画面，同一时刻一人操作，另一人可以请求接手。', joinText: '输入朋友给你的 4 位房间码。' },
  saves: {
    label: '存档', continue: true, remove: true,
    note: '每章到了检查点会自动存档；通关后那一章的存档会清掉（坏结局保留）。',
    list: () => { const at = tkCpAt(); return CHAPTERS.filter(ch => store.get('cp.' + ch.id, null)).map(ch => ({ slot: ch.id, no: ch.n || CHAPTERS.indexOf(ch) + 1, title: tkChLine(ch), detail: ch.sub || '', time: at[ch.id] || 0 })); },
    load: id => { netClose(); startChapter(id, true); },
    remove: id => store.del('cp.' + id)
  },
  extra: [{ id: 'arch', icon: 'doc', label: '怪谈档案', sub: '通关一章解锁它的来历与流变', run: () => { UI._archBack = 'title'; UI.show('archive'); } }],
  sound: { get: () => !!AU.muted, set: v => { AU.init(); AU.setMute(v); muteBtn(); } },
  settings: [{ group: '声音', key: 'mute', label: '声音', sub: '建议戴耳机、关灯游玩', type: 'toggle', get: () => !AU.muted, set: v => { AU.init(); AU.setMute(!v); muteBtn(); } }],
  howto: () => { const c = $('help').querySelector('.panel').cloneNode(true); c.querySelectorAll('h2,.row').forEach(x => x.remove()); return c.innerHTML; },
  foot: '像素恐怖探索 · 剧情含惊吓与死亡描写',
  start: () => { netClose(); UI.show('select'); },
  host: () => hostRoom((st, a) => {
    if (st === 'open') TK.room({ code: a, status: '等待对方加入…', players: [{ name: '你', sub: '房主 · 选章节', me: true }, { empty: true, name: '等待对方加入' }] });
    if (st === 'joined') { UI.toast('对方已加入'); UI.show('select'); }
    if (st === 'error') TK.roomFail('连接失败：' + a);
  }),
  join: ({ code }) => joinRoom(code, (st, a) => {
    if (st === 'joined') { UI.toast('已加入房间'); UI.show('select'); }
    if (st === 'error') TK.roomFail(a === 'peer-unavailable' ? '找不到这个房间' : a === 'timeout' ? '连接超时，请检查房间码' : '连接失败：' + a);
  }),
  leaveRoom: () => netClose()
});
{
  const show0 = UI.show;
  UI.show = function (s) { const r = show0.call(this, s); if (s === 'title') { if (TK.visible && TK.screen === 'room') TK.room(null); else { TK.home(); TK.show(); } } else if (s !== 'lobby') TK.hide(); return r; };
}
