/* ================= start screen: shared TitleKit (shared/titlekit) =================
   幽宅双影 is two-player only: 双人同屏 (one device) or 联机 (创建房间 / 加入) + 设置 + 玩法. The room reuses the game's own role cards
   (持灯者 / 灵视者) and floor picker, moved into the TitleKit room screen. The old #title / #lobby stay hidden. */
const tkRoleBox = document.createElement('div');
const TK = TitleKit.create({
  id: 'hollowmanor', title: '幽宅双影', hub: HUB, artifact: inArtifact(), z: 40, hidden: true,
  logo: document.querySelector('#title .logo'),
  accent: '#e6c27a', accentInk: '#1e1608', font: 'var(--title, inherit)',
  solo: false,
  local: { label: '双人同屏', sub: '一台电脑或平板 · 两个人一起进老宅' },
  setup: { title: '双人同屏', start: '进入老宅', localStart: '进入老宅', fields: () => [
    { key: 'floor', label: '从哪一层开始', type: 'seg', modes: ['local'], def: 0, options: FLOORS.map((F, i) => ({ v: i, label: F.name || ['一楼', '二楼', '阁楼'][i], dis: i > (LS.get('prog', { max: 0 }).max || 0) })).filter(o => !o.dis) },
    { type: 'note', modes: ['local'], text: '键盘：阿岩 WASD 移动、鼠标瞄准、E 互动、F / 空格 强光、左 Shift 跑；小雾 方向键移动、回车 互动、右 Shift 跑。平板：左摇杆 + 左边按钮是阿岩，右摇杆 + 右边按钮是小雾。也支持两个手柄。' }] },
  start: ({ mode, setup }) => { if (mode === 'local') { TK.hide(); startLocal(+(setup && setup.floor) || 0); } },
  online: { label: '双人联机', sub: '两个人一起进老宅 · 创建房间或用房间码加入', hostText: '你当房主。同伴加入后，在房间里选好谁拿灯、谁看灵。', joinText: '输入同伴发来的房间码。' },
  extra: [{ id: 'help', icon: 'help', label: '玩法说明', sub: '持灯者与灵视者 · 三层楼', run: T => T.go('howto') }],
  nick: { get: () => SET.name, set: v => { SET.name = v.slice(0, 10); saveSet(); $('nameIn').value = SET.name; } },
  sound: { get: () => !!AU.muted, set: v => { audioInit(); setMute(v); } },
  settings: [
    { group: '声音', key: 'mute', label: '声音', type: 'toggle', get: () => !AU.muted, set: v => { audioInit(); setMute(!v); } },
    { key: 'vol', label: '音量', type: 'range', min: 0, max: 1, step: 0.05, get: () => SET.vol, set: v => { SET.vol = v; saveSet(); $('volIn').value = v; if (AU.master && !AU.muted) AU.master.gain.value = v; } },
    { group: '画面', key: 'quality', label: '画质', sub: '流畅：手电光锥更粗糙、没有浮尘', type: 'seg', options: [{ v: 'low', label: '流畅' }, { v: 'high', label: '精致' }], get: () => SET.quality, set: v => { SET.quality = v; saveSet(); } },
    { key: 'grain', label: '胶片颗粒', type: 'toggle', get: () => !!SET.grain, set: v => { SET.grain = v; saveSet(); } },
    { key: 'shake', label: '震屏', type: 'toggle', get: () => !!SET.shake, set: v => { SET.shake = v; saveSet(); } },
    { group: '惊吓', key: 'scare', label: '贴脸惊吓', sub: '关掉后改成红光和心跳', type: 'toggle', get: () => SET.scare !== false, set: v => { SET.scare = v; saveSet(); } }
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
