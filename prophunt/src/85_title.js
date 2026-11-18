/* ================= start screen: shared TitleKit (shared/titlekit) =================
   The old #title / #lobby DOM stays in the page (other code still writes to it) but is never shown;
   TitleKit draws 单人 / 联机, the 开局设置 (玩法 + 地图), the room (玩法 / 地图 / 谁先藏), settings and help
   over the live 2.5D house in the background. */
const TK_MODES = [{ v: 'rt', label: '实时追逐', sub: '30 秒藏好，抓方只看得见所在房间' }, { v: 'turn', label: '回合推理', sub: '整栋房子摊开，敲错有 烫/热/温/冷 提示' }];
const tkMaps = () => SCENE_IDS.map(id => ({ v: id, icon: SCENES[id].icon, label: SCENES[id].n })).concat([{ v: 'rand', icon: '🎲', label: '随机' }]);
const tkPickMap = v => { PICK_MAP = v; LS.set('map', v); modeUI(); if (v !== 'rand' && STATE.mode === 'title') { useScene(v); MAP = genMap((Math.random() * 1e9) | 0); } };
const TK = TitleKit.create({
  id: 'prophunt', title: '百变迷藏', hub: HUB, artifact: inArtifact(), z: 40, hidden: true,
  logo: '<div class="tk-t">百变迷藏</div><div class="tk-s">变身捉迷藏 · 一个藏成家具，一个来敲</div>',
  accent: '#ffc94d', accentInk: '#241a04',
  solo: { label: '单人：电脑藏，你来找', sub: '选玩法和地图' },
  online: { label: '双人联机', sub: '一个藏、一个找 · 创建房间或用房间码加入', hostText: '你当房主，玩法、地图和谁先藏由你决定。把 4 位房间码或邀请链接发给对手。' },
  setup: {
    start: '开始找', wide: true,
    fields: [
      { key: 'mode', label: '玩法', type: 'cards', options: TK_MODES, def: () => PICK_MODE, change: v => { PICK_MODE = v; LS.set('mode', v); modeUI(); } },
      { key: 'map', label: '地图', type: 'seg', options: tkMaps, def: () => PICK_MAP, change: v => tkPickMap(v) }
    ]
  },
  nick: { get: () => LS.get('name', ''), set: v => { $('nameIn').value = v.slice(0, 8); LS.set('name', myName()); } },
  sound: { get: () => !AU.on, set: v => { audioInit(); setSound(!v); } },
  sfx: () => { audioInit(); sfx('click'); },
  settings: [{ group: '声音', key: 'snd', label: '音效', type: 'toggle', get: () => !!AU.on, set: v => { audioInit(); setSound(v); } }],
  howto: () => { const c = $('help').querySelector('.card').cloneNode(true); c.querySelectorAll('h2,#helpClose,button').forEach(x => x.remove()); return c.innerHTML; },
  foot: '',
  start: ({ setup }) => { PICK_MODE = setup.mode; LS.set('mode', PICK_MODE); tkPickMap(setup.map); audioInit(); startSolo(false); },
  host: ({ setup }) => { PICK_MODE = setup.mode; LS.set('mode', PICK_MODE); tkPickMap(setup.map); audioInit(); NET.lobby.mode = PICK_MODE; NET.lobby.map = PICK_MAP; NET.score = [0, 0]; netHost(); },
  join: ({ code }) => { audioInit(); netJoin(code); },
  leaveRoom: () => toTitle(),
  roomStart: () => hostStart(false),
  roomSet: (k, v) => { if (NETROLE !== 'host') return; NET.lobby[k] = v; sendLobby(); lobbyUI(); }
});
function tkRoom() {
  if (STATE.mode !== 'lobby') return;
  const host = NETROLE === 'host', L = NET.lobby, sc = NET.score || [0, 0];
  const hostName = host ? (myName() || '房主') : (NET.hostName || '房主'), guest = host ? NET.guestName : (myName() || '你');
  const ro = host ? '' : '（房主决定）';
  TK.room({
    host, code: NET.code || '', status: $('lStatus').textContent,
    players: [{ name: hostName, sub: '房主' + (sc[0] || sc[1] ? ' · ' + sc[0] + ' 胜' : ''), me: host, color: '#ffb84d' },
      guest ? { name: guest, sub: '对手' + (sc[0] || sc[1] ? ' · ' + sc[1] + ' 胜' : ''), me: !host, color: '#6fc3ff' } : { empty: true, name: '等待对手加入', sub: '对手' }],
    fields: [
      { key: 'mode', label: '玩法' + ro, type: 'cards', options: TK_MODES },
      { key: 'map', label: '地图' + ro, type: 'seg', options: tkMaps },
      { key: 'first', label: '第一局谁来藏（之后每局交换）' + ro, type: 'seg', options: [{ v: 'host', label: '房主' }, { v: 'guest', label: '客人' }, { v: 'rand', label: '随机' }] }
    ],
    values: { mode: L.mode, map: L.map || 'rand', first: L.first },
    startBtn: host, canStart: !!(host && NET.guestName), startLabel: '开始'
  });
}
{
  const show0 = showScreen, lobby0 = lobbyUI;
  showScreen = function (s) {
    show0(s);
    $('title').classList.add('hidden'); $('lobby').classList.add('hidden'); $('hubBtn').classList.add('hidden');
    if (s === 'hud') { TK.hide(); return; }
    if (s === 'lobby') { TK.show(); return; }
    if (TK.visible && TK.screen === 'room') TK.room(null); else { TK.home(); TK.show(); }
  };
  lobbyUI = function (st) { lobby0(st); tkRoom(); };
  titleStatus = function (t) {
    if (!t || /只能单人游玩/.test(t)) return;
    if (!/^正在/.test(t)) TK.toast(t, 3600);
    if (TK.visible && TK.screen === 'room') { if (!/^正在/.test(t) && !linkUp()) TK.roomFail(t); else TK.room({ status: t }); }
  };
}
