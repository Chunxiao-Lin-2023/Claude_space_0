/* ================= start screen: shared TitleKit (shared/titlekit) =================
   The old #title / #lobby DOM stays in the page (other code still writes to it) but is never shown;
   TitleKit draws the menu, 开局设置, 联机, 房间, 设置, 玩法 and 记录 over the attract-mode demo. */
const DIFFS = [{ v: 'easy', label: '简单', sub: '丧尸少，资源多' }, { v: 'normal', label: '普通', sub: '推荐' }, { v: 'hard', label: '困难', sub: '尸潮更凶' }];
const TK = TitleKit.create({
  id: 'lasttower', title: '尸夜孤楼', hub: HUB, artifact: inArtifact(),
  logo: document.querySelector('#title .logo'),
  accent: '#ffb347', accentInk: '#1f1206', font: 'var(--title)', z: 40, hidden: true,
  solo: { label: '单人守夜', sub: '一个人撑过十五夜' },
  online: { label: '双人联机', sub: '创建房间 · 用房间码加入', hostText: '你当房主，难度由你决定。把 4 位房间码或邀请链接发给队友。' },
  setup: { fields: [{ key: 'diff', label: '难度', type: 'seg', options: DIFFS, def: () => SET.diff, change: v => { SET.diff = v; saveSet(); markDiff(); } }], start: '开始守夜' },
  nick: { get: () => SET.name, set: v => { SET.name = v.slice(0, 10); saveSet(); $('nameIn').value = SET.name; } },
  sound: { get: () => !!SET.mute, set: v => { audioInit(); setMute(v); uiMute(); } },
  sfx: () => { audioInit(); sfx('click'); },
  settings: [
    { group: '声音', key: 'mute', label: '静音', type: 'toggle', get: () => !!SET.mute, set: v => { audioInit(); setMute(v); uiMute(); } },
    { group: '画面', key: 'zoom', label: '镜头', sub: '游戏中也可以按 Z 切换', type: 'seg', options: [{ v: 1, label: '远景' }, { v: 2, label: '近景' }], get: () => SET.zoom, set: v => { SET.zoom = v; saveSet(); } }
  ],
  howto: () => $('help').querySelector('.help').innerHTML,
  records: () => { const b = lsGet('best', 0); return b ? [['最佳纪录', '撑过 ' + b + ' 夜']] : []; },
  recordsSub: () => { const b = lsGet('best', 0); return b ? '最佳：撑过 ' + b + ' 夜' : '还没有记录'; },
  foot: '',
  start: ({ setup }) => { SET.diff = setup.diff || SET.diff; saveSet(); audioInit(); netLeave(); NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0); },
  host: ({ setup }) => { SET.diff = setup.diff || SET.diff; saveSet(); audioInit(); netHost(); },
  join: ({ code }) => { audioInit(); netJoin(code); },
  leaveRoom: () => { netLeave(); STATE.mode = 'title'; },
  roomReady: () => $('lReady').click(),
  roomStart: () => hostStart(),
  roomSet: (k, v) => { if (k === 'diff' && NETROLE === 'host') { SET.diff = v; saveSet(); markDiff(); sendLobby(); tkRoom(); } }
});
function tkRoom() {
  if (STATE.mode !== 'lobby') return;
  const host = NETROLE === 'host', hostName = host ? (SET.name || '房主') : (NET.hostName || '房主'), guest = host ? NET.guestName : (SET.name || '你');
  TK.room({
    host, code: NET.code || '', status: guest && NET.code ? (NET.ready ? (host ? '队友准备好了，可以开始' : '等房主开始') : (host ? '等队友点「准备」' : '准备好了就点「准备」')) : $('lStatus').textContent,
    players: [
      { name: hostName, sub: '房主 · 橙色', me: host, color: '#ff9a3c' },
      guest ? { name: guest, sub: '队友 · 青色', me: !host, tag: NET.ready ? '已准备' : '未准备', ok: NET.ready, color: '#4fd1c5' } : { empty: true, name: '等待队友加入', sub: '队友 · 青色' }
    ],
    fields: [{ key: 'diff', label: host ? '难度' : '难度（房主决定）', type: 'seg', options: DIFFS }], values: { diff: host ? SET.diff : NET.diff },
    readyBtn: !host, ready: NET.ready, startBtn: host, canStart: !!(host && NET.guestName && NET.ready), startLabel: '开始守夜'
  });
}
{
  const show0 = showScreen, lobby0 = lobbyUI;
  showScreen = function (s) {
    show0(s);
    $('title').classList.add('hidden'); $('lobby').classList.add('hidden'); $('hubBtn').classList.add('hidden');
    if (s === 'play') { TK.hide(); return; }
    if (s === 'lobby') { TK.show(); return; }
    if (TK.visible && TK.screen === 'room') TK.room(null); else { TK.home(); TK.show(); }
  };
  lobbyUI = function (st) { lobby0(st); tkRoom(); };
  titleStatus = function (t) {
    if (!t) return;
    if (!/^正在/.test(t)) TK.toast(t, 3600);
    if (TK.visible && TK.screen === 'room') { if (!/^正在/.test(t) && !linkUp()) TK.roomFail(t); else TK.room({ status: t }); }
  };
}
