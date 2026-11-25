/* ================= start screen: shared TitleKit (shared/titlekit) =================
   The old #title / #lobby DOM stays in the page (other code still writes to it) but is never shown;
   TitleKit draws 继续 / 单人 / 联机 / 存档 / 记录, the 开局设置 (difficulty, mode, map), the room, settings and help
   over the attract-mode demo. */
const TK_DIFFS = [{ v: 'easy', label: '简单', sub: '丧尸少，资源多' }, { v: 'normal', label: '普通', sub: '推荐' }, { v: 'hard', label: '困难', sub: '尸潮更凶' }];
const tkModes = () => MODE_IDS.map(k => ({ v: k, icon: MODES[k].icon, label: MODES[k].name, sub: MODES[k].desc }));
const tkMaps = (mode) => MAP_IDS.map(k => ({ v: k, label: MAPS[k].name + (MODES[mode] && MODES[mode].map === k ? ' · 推荐' : ''), sub: MAPS[k].desc }));
/* (round 45) a room from a save: the save decides difficulty / mode / map, so those give way to a summary of the save; the choice of save is remembered;
   your own new-game choices (SET.diff / mode / map) are never overwritten by a save's */
const tkEsc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fromOn = v => { const n = +(v && v.from || 0); return n > 0 && !!loadSlot(n); }; /* a save that still exists */
const tkFixFrom = () => { try { if (TK.setup.from && !loadSlot(+TK.setup.from)) TK.setSetup({ from: 0 }); } catch (e) { } };
const hostSave = () => { const n = SET.hostFrom || 0, S = n ? loadSlot(n) : null; return S ? { n, S } : null; };
const fromDef = () => hostSave() ? SET.hostFrom : 0;
const saveSummary = (n, S) => { const P = S.p || [], mine = P.find(q => q && q.name === SET.name), kits = P.filter(Boolean).map(q => q.name).join('、');
  return '继续存档 ' + n + (S.name ? '「' + tkEsc(S.name) + '」' : '') + '：' + tkEsc(saveLabel(S)) + '<br><small>难度、模式和地图跟着存档，不能改。存档里的装备：' + tkEsc(kits || '—') + (mine ? '（你的会还给你）' : '') + '；队友用同一个名字进来就能拿回他的装备。</small>'; };
const tkFields = (vals, host) => [
  { key: 'from', label: '从哪开始', hint: '可以用存档开房间：队友进来后接着这个存档玩（装备按名字还给各自）', type: 'cards', modes: ['host'], options: () => [{ v: 0, label: '新开一局', sub: '用下面的难度、模式和地图' }].concat([1, 2, 3, 4, 5].map(n => { const s = loadSlot(n); return s ? { v: n, label: '存档 ' + n, sub: saveLabel(s) + (s.p && s.p.length > 1 ? ' · 双人' : '') } : null; }).filter(Boolean)), def: fromDef, change: v => { SET.hostFrom = +v || 0; saveSet(); } }, // (round 32 / 45)
  { key: 'fromNote', type: 'note', modes: ['host'], when: (m, v) => m === 'host' && fromOn(v), html: () => { const n = +(TK.setup && TK.setup.from || 0), S = n && loadSlot(n); return S ? saveSummary(n, S) : ''; } },
  { key: 'diff', label: '难度', type: 'seg', options: TK_DIFFS, when: (m, v) => !(m === 'host' && fromOn(v)), def: () => SET.diff, change: v => { SET.diff = v; saveSet(); markDiff(); } },
  { key: 'mode', label: '模式', type: 'cards', options: tkModes, when: (m, v) => !(m === 'host' && fromOn(v)), def: () => curMode(), change: (v, o) => { SET.mode = v; SET.map = o.map = MODES[v].map; saveSet(); uiModeLbl(); tkDemo(); } },
  { key: 'map', label: '地图', hint: '每种模式在哪张图上都能玩', type: 'cards', options: () => tkMaps((vals || TK.setup).mode || curMode()), when: (m, v) => !(m === 'host' && fromOn(v)), def: () => curMap(), change: v => { SET.map = v; saveSet(); uiModeLbl(); tkDemo(); } }
];
const tkDemo = () => { if (STATE.mode === 'title' && (!W || W.demo) && MAP_ID !== curMap()) startDemo(); };
let tkArm = 0;
const TK = TitleKit.create({
  id: 'deadtide', title: '尸潮堡垒', hub: HUB, artifact: inArtifact(),
  logo: document.querySelector('#title .logo'),
  accent: '#ff9d3c', accentInk: '#1f1104', font: 'var(--title)', z: 40, hidden: true,
  solo: { label: '单人开始', sub: '选难度、模式和地图' },
  continueLabel: '继续上次',
  online: { label: '双人联机', sub: '创建房间 · 用房间码加入', hostText: '你当房主，难度、模式和地图由你决定。把 4 位房间码或邀请链接发给队友。' },
  setup: { fields: () => tkFields(), start: '开始守夜', wide: true },
  saves: {
    label: '存档', slots: 5, export: true, remove: true, import: true, rename: (n, name) => renameSave(+n, name),
    note: '一共 5 个存档位。新开一局会用一个空位，不会覆盖别的存档；5 个都满了才会提示覆盖最早的那个。每个天亮、暂停菜单里点「存档」、以及关掉页面时自动写入（单人或房主）。双人时房主存档会同时给队友存一份（同一局总是存在同一个位置），所以下次谁开房间都行；用存档开房间时难度、模式和地图跟着存档，装备按名字还给各自。',
    list: () => { const l = []; for (let n = 1; n <= NSLOT; n++) { const s = loadSlot(n); l.push(s ? { slot: n, name: s.name || '', title: (s.name ? s.name + ' · ' : '') + saveLabel(s), detail: (s.p && s.p[0] ? s.p[0].name : '') + (s.p && s.p.length > 1 ? ' · 双人' : ''), time: s.at } : { slot: n, empty: true, title: '空位', detail: '新开一局会存到这里' }); } return l; },
    load: n => continueGame(+n),
    remove: n => { clearSave(+n); if (SET.hostFrom === +n) { SET.hostFrom = 0; saveSet(); } tkFixFrom(); }, /* (round 45) */
    export: n => { try { const raw = localStorage.getItem(SKEY + slotKey(+n)); return raw ? 'DTS1' + btoa(unescape(encodeURIComponent(raw))) : ''; } catch (e) { return ''; } },
    import: code => {
      try {
        code = code.replace(/\s+/g, ''); if (!code.startsWith('DTS1')) return '存档码应以 DTS1 开头';
        const raw = decodeURIComponent(escape(atob(code.slice(4)))), S = JSON.parse(raw);
        if (!S || S.v !== SAVE_V || S.mw !== MW || !S.g) return '这个存档码来自旧版本，读不了';
        const n = freeSlot(); if (!n) return '5 个存档位都满了，先删掉一个再导入';
        localStorage.setItem(SKEY + slotKey(n), raw); return { ok: true, msg: '已导入到存档 ' + n + '：' + saveLabel(S) };
      } catch (e) { return '存档码无法识别'; }
    }
  },
  nick: { get: () => SET.name, set: v => { SET.name = v.slice(0, 10); saveSet(); $('nameIn').value = SET.name; } },
  sound: { get: () => !!SET.mute, set: v => { audioInit(); setMute(v); uiMute(); } },
  sfx: () => { audioInit(); sfx('click'); },
  settings: [
    { group: '声音', key: 'mute', label: '静音', type: 'toggle', get: () => !!SET.mute, set: v => { audioInit(); setMute(v); uiMute(); } },
    { group: '画面', key: 'fps', label: '帧率', sub: '锁 60 帧：高刷屏（120 Hz）不再多画一倍，不容易发热；30 帧最省电', type: 'seg', options: [{ v: 60, label: '60' }, { v: 30, label: '30 省电' }, { v: 0, label: '不限' }], get: () => fpsCap(), set: v => { SET.fps = v; saveSet(); uiMute(); } },
    { group: '画面', key: 'q', label: '画质', sub: '自动：太卡时会自己降一档', type: 'seg', options: [{ v: 'auto', label: '自动' }, { v: 0, label: '高' }, { v: 1, label: '中' }, { v: 2, label: '低' }], get: () => SET.q == null ? 'auto' : SET.q, set: v => { SET.q = v; if (v === 'auto') SET.qa = 0; saveSet(); applyQual(); uiMute(); } },
    { key: 'shadows', label: '阴影', type: 'toggle', get: () => !!SET.shadows, set: v => { SET.shadows = v ? 1 : 0; saveSet(); toast('阴影设置在下次进入游戏时生效'); } },
    { group: '操作', key: 'assist', label: '辅助瞄准', type: 'seg', options: ASSIST.map((a, i) => ({ v: i, label: a.name })), get: () => SET.assist == null ? 1 : SET.assist, set: v => { SET.assist = v; saveSet(); } },
    { key: 'bconf', label: '建造先预览再确认', type: 'toggle', get: () => !!SET.bconf, set: v => { SET.bconf = v ? 1 : 0; saveSet(); } }
  ],
  howto: () => $('help').querySelector('.help').innerHTML,
  records: () => { const b = lsGet('best', 0); return b ? [['最佳纪录', '撑过 ' + b + ' 夜']] : []; },
  recordsSub: () => { const b = lsGet('best', 0); return b ? '最佳：撑过 ' + b + ' 夜' : '还没有记录'; },
  foot: '',
  start: ({ setup }) => {
    const n = newRunSlot(t => TK.toast(t, 4500)); if (!n) return; SLOT = n; // (round 27) an empty slot; never overwrites without asking
    Object.assign(SET, { diff: setup.diff, mode: setup.mode, map: setup.map }); saveSet();
    audioInit(); netLeave(); NETROLE = 'solo'; startGame((Math.random() * 1e9) | 0, [SET.name || '幸存者'], SET.diff, 0, SET.mode, SET.map);
  },
  host: ({ setup }) => { SET.hostFrom = fromOn(setup) ? +setup.from : 0; if (!SET.hostFrom) Object.assign(SET, { diff: setup.diff, mode: setup.mode, map: setup.map }); saveSet(); audioInit(); netHost(); }, // (round 32) from: 0 = a new run, n = save slot n; (round 45) a save leaves your new-game choices alone
  join: ({ code }) => { audioInit(); netJoin(code); },
  leaveRoom: () => { netLeave(); STATE.mode = 'title'; },
  roomReady: () => $('lReady').click(),
  roomStart: () => hostStart(),
  roomSet: (k, v) => {
    if (NETROLE !== 'host') return;
    if (k === 'from') { SET.hostFrom = +v || 0; saveSet(); sendLobby(); tkRoom(); return; } /* (round 45) switch between a new run and a save in the room */
    if (hostSave()) return; /* a save's settings are fixed */
    if (k === 'diff') { SET.diff = v; markDiff(); }
    if (k === 'mode') { SET.mode = v; SET.map = MODES[v].map; }
    if (k === 'map') SET.map = v;
    saveSet(); uiModeLbl(); sendLobby(); tkRoom();
  }
});
function tkRoom() {
  if (STATE.mode !== 'lobby') return;
  const host = NETROLE === 'host', hostName = host ? (SET.name || '房主') : (NET.hostName || '房主'), guest = host ? NET.guestName : (SET.name || '你');
  const HS = host ? hostSave() : null, vals = HS ? { from: HS.n, diff: HS.S.diff, mode: HS.S.mode || 'classic', map: HS.S.map || 'town' } : host ? { from: 0, diff: SET.diff, mode: curMode(), map: curMap() } : { diff: NET.diff, mode: NET.mode || 'classic', map: NET.map || MODES[NET.mode || 'classic'].map }; /* (round 45) a room from a save shows the save's settings */
  const fromSave = HS || (!host && NET.fromLbl);
  TK.room({
    host, code: NET.code || '',
    status: guest && NET.code ? (NET.ready ? (host ? '队友准备好了，可以开始' : '等房主开始') : (host ? '等队友点「准备」' : '准备好了就点「准备」')) : $('lStatus').textContent,
    players: [
      { name: hostName, sub: '房主 · 橙色', me: host, color: '#ff9a3c' },
      guest ? { name: guest, sub: '队友 · 青色', me: !host, tag: NET.ready ? '已准备' : '未准备', ok: NET.ready, color: '#4fd1c5' } : { empty: true, name: '等待队友加入', sub: '队友 · 青色' }
    ],
    fields: tkFields(vals, host).filter(f => f.key !== 'fromNote' && (host || f.key !== 'from')).map(f => Object.assign({}, f, { label: (f.label || '') + (host ? (fromSave && f.key !== 'from' ? '（跟着存档）' : '') : '（房主决定）'), ro: f.key === 'from' ? !host : (!host || !!fromSave), when: undefined }))
      .concat(fromSave ? [{ key: 'fromNote', type: 'note', html: HS ? saveSummary(HS.n, HS.S) : tkEsc(NET.fromLbl) }] : []).sort((a, b) => (a.key === 'fromNote' ? 0.5 : a.key === 'from' ? 0 : 1) - (b.key === 'fromNote' ? 0.5 : b.key === 'from' ? 0 : 1)), values: vals,
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
