/* ================= start screen: shared TitleKit (shared/titlekit) =================
   幽宅双影 is two-player only: the menu is 联机 (创建房间 / 加入) + 设置 + 玩法. The room reuses the game's own role cards
   (持灯者 / 灵视者) and floor picker, moved into the TitleKit room screen. The old #title / #lobby stay hidden. */
const tkRoleBox = document.createElement('div');
const TK = TitleKit.create({
  id: 'hollowmanor', title: '幽宅双影', hub: HUB, artifact: inArtifact(), z: 40, hidden: true,
  logo: document.querySelector('#title .logo'),
  accent: '#e6c27a', accentInk: '#1e1608', font: 'var(--title, inherit)',
  solo: false,
  online: { label: '双人联机', sub: '两个人一起进老宅 · 创建房间或用房间码加入', hostText: '你当房主。同伴加入后，在房间里选好谁拿灯、谁看灵。', joinText: '输入同伴发来的房间码。' },
  extra: [{ id: 'help', icon: 'help', label: '玩法说明', sub: '持灯者与灵视者 · 三层楼', run: T => T.go('howto') }],
  nick: { get: () => SET.name, set: v => { SET.name = v.slice(0, 10); saveSet(); $('nameIn').value = SET.name; } },
  sound: { get: () => !!AU.muted, set: v => { audioInit(); setMute(v); } },
  settings: [
    { group: '声音', key: 'mute', label: '声音', type: 'toggle', get: () => !AU.muted, set: v => { audioInit(); setMute(!v); } },
    { key: 'vol', label: '音量', type: 'range', min: 0, max: 1, step: 0.05, get: () => SET.vol, set: v => { SET.vol = v; saveSet(); $('volIn').value = v; if (AU.master && !AU.muted) AU.master.gain.value = v; } },
    { group: '画面', key: 'quality', label: '画质', sub: '下次进入时生效', type: 'seg', options: [{ v: 'low', label: '流畅' }, { v: 'high', label: '精致' }], get: () => SET.quality, set: v => { SET.quality = v; saveSet(); } },
    { key: 'grain', label: '胶片颗粒', type: 'toggle', get: () => !!SET.grain, set: v => { SET.grain = v; saveSet(); } },
    { key: 'shake', label: '震屏', type: 'toggle', get: () => !!SET.shake, set: v => { SET.shake = v; saveSet(); } }
  ],
  howto: () => { const c = $('help').querySelector('.card').cloneNode(true); c.querySelectorAll('h2,button').forEach(x => x.remove()); return c.innerHTML; },
  foot: '',
  host: () => { audioInit(); netHost(); },
  join: ({ code }) => { audioInit(); netJoin(code); },
  leaveRoom: () => { netLeave(); STATE.mode = 'title'; },
  roomReady: () => $('readyBtn').click(),
  roomStart: () => hostStart(),
  roomAction: id => { if (id === 'swap') $('swapBtn').click(); }
});
/* the role cards + floor picker live in a box parked inside TitleKit (still in the document, so $('floorSeg') etc. keep working) */
tkRoleBox.className = 'tk-hm-roles'; tkRoleBox.style.cssText = 'display:flex;flex-direction:column;gap:10px';
tkRoleBox.appendChild(document.querySelector('#lobby .roles')); tkRoleBox.appendChild($('floorRow')); TK.park(tkRoleBox);
function tkRoom() {
  if (STATE.mode !== 'lobby') return;
  const host = NETROLE === 'host', guestHere = NETROLE === 'guest' || !!(NET.gctl && NET.gctl.open);
  TK.room({
    host, code: NET.code || '', wide: true, node: tkRoleBox, status: $('lStatus').textContent, players: [],
    actions: guestHere ? [{ id: 'swap', label: '交换角色' }] : [],
    readyBtn: !host, ready: !!NET.ready[1], startBtn: host, canStart: !!(host && NET.gctl && NET.gctl.open && NET.ready[1]), startLabel: '开始'
  });
}
{
  const show0 = showScreen, lobby0 = lobbyUI;
  showScreen = function (s) {
    show0(s);
    $('title').classList.add('hidden'); $('lobby').classList.add('hidden'); $('hubBtn').classList.add('hidden');
    if (s === 'lobby') { TK.show(); return; }
    if (s !== 'title') { TK.hide(); return; }
    if (TK.visible && TK.screen === 'room') TK.room(null); else { TK.home(); TK.show(); }
  };
  lobbyUI = function (status) {
    lobby0(status);
    if (STATE.mode === 'lobby') { tkRoom(); return; }
    if (status && TK.visible && TK.screen === 'room') { if (!/^正在/.test(status) && !linkUp()) TK.roomFail(status); else TK.room({ status }); }
    else if (status && STATE.mode === 'title' && !/^正在/.test(status)) TK.toast(status, 3600);
  };
}
