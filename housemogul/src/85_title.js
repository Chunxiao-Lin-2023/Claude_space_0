/* ================= start screen: shared TitleKit (shared/titlekit) =================
   The old #title / #lobby stay in the page (other code still writes to them) but are never shown; TitleKit draws
   继续 / 新的一局 (开局设置: 难度、玩法、自定义开关、对手) / 双人联机 (room with the same options) / 记录 / 设置 / 玩法
   over the live city in the background. */
const TK_DIFF = () => Object.keys(DIFF).map(k => ({ v: k, label: DIFF[k].n, hint: DIFF[k].d }));
const TK_MODE = [{ v: 'pure', label: '纯粹', sub: '只有涨跌和买卖' }, { v: 'full', label: '完整', sub: '贷款、房租、装修、新闻…' }, { v: 'custom', label: '自定义', sub: '挑着开' }];
const tkSetupFields = () => [
  { key: 'diff', label: '难度', type: 'seg', options: TK_DIFF, def: () => SET.diff },
  { key: 'preset', label: '玩法', type: 'seg', options: TK_MODE, def: () => SET.preset },
  ...OPTS.map(o => ({ key: 'o_' + o.k, type: 'toggle', text: o.n + ' · ' + o.d, def: () => !!SET.opt[o.k], when: (m, v) => v.preset === 'custom' })),
  { key: 'ai', label: '对手', type: 'seg', modes: ['solo'], options: [{ v: 0, label: '无（竞速）' }, { v: 1, label: '王老板' }], def: () => SET.ai }
];
const tkApply = s => { SET.diff = s.diff; SET.preset = s.preset; for (const o of OPTS) SET.opt[o.k] = s['o_' + o.k] ? 1 : 0; if (s.ai != null) SET.ai = +s.ai; saveSet(); };
const TK = TitleKit.create({
  id: 'housemogul', title: '房产大亨', hub: HUB, hubLabel: '百戏茶馆', onHub: () => { location.href = '../baixi/'; }, artifact: inArtifact(), z: 40, hidden: true,
  logo: document.querySelector('#title .logo'),
  accent: '#f2b84b', accentInk: '#241804', font: 'var(--title, inherit)', panel: 'rgba(16,20,30,.84)',
  solo: { label: '新的一局', sub: '难度、玩法和对手' },
  online: { label: '双人联机', sub: '谁先买下豪宅谁赢 · 创建房间或用房间码加入', hostText: '你当房主，难度、玩法和要不要加电脑对手由你定。' },
  setup: { fields: tkSetupFields, start: '开始' },
  saves: {
    label: '存档', slots: 1, remove: true,
    note: '单人局会自动存档；只有一个存档位，新的一局会覆盖它。',
    list: () => { const sv = LS.get('save', null); return [sv && sv.v === 2 ? { slot: 1, title: '进行到 ' + clock(sv.t || 0) + ' · ' + presetName(sv.preset || 'pure', sv.opt || {}), detail: (DIFF[sv.diff] || DIFF.normal).n + (sv.players && sv.players.length > 1 ? ' · 有电脑对手' : ''), time: 1 } : { slot: 1, empty: true, title: '没有进行中的单人局' }]; },
    load: () => $('contBtn').click(),
    remove: () => LS.del('save')
  },
  nick: { get: () => SET.name, set: v => { SET.name = v.slice(0, 8); saveSet(); $('nameIn').value = SET.name; } },
  sound: { get: () => !AU.on, set: v => { audioInit(); setSound(!v); } },
  sfx: () => { audioInit(); sfx('click'); },
  settings: [{ group: '声音', key: 'snd', label: '声音', type: 'toggle', get: () => !!AU.on, set: v => { audioInit(); setSound(v); } }],
  howto: () => { const c = $('help').querySelector('.card').cloneNode(true); c.querySelectorAll('button').forEach(x => x.remove()); return c.innerHTML; },
  records: () => { const r = []; for (const d of Object.keys(DIFF)) for (const p of ['pure', 'full']) for (const ai of [0, 1]) { const b = LS.get('best_' + d + '_' + p + '_' + ai, null); if (b && b > 30) r.push([DIFF[d].n + ' · ' + (p === 'pure' ? '纯粹' : '完整') + (ai ? ' · 对王老板' : ''), clock(b)]); } return r; },
  recordsSub: () => '最快买下豪宅的时间',
  foot: '',
  start: ({ setup }) => { tkApply(setup); titleUI(); $('newBtn').click(); },
  host: ({ setup }) => { tkApply(setup); titleUI(); $('hostBtn').click(); },
  join: ({ code }) => { audioInit(); netJoin(code); },
  leaveRoom: () => { netLeave(); STATE.mode = 'title'; },
  roomReady: () => $('lReady').click(),
  roomStart: () => hostStart(),
  roomSet: (k, v) => {
    if (NETROLE !== 'host') return;
    if (k === 'diff') { NET.diff = SET.diff = v; }
    else if (k === 'preset') { NET.preset = SET.preset = v; NET.opt = optOf(v); }
    else if (k === 'ai') { NET.ai = SET.ai = +v; }
    else if (k.startsWith('o_')) { SET.opt[k.slice(2)] = v ? 1 : 0; NET.opt = optOf('custom'); }
    saveSet(); hostLobbyChanged();
  }
});
function tkRoom() {
  if (STATE.mode !== 'lobby') return;
  const host = NETROLE === 'host', ro = host ? '' : '（房主决定）', pr = NET.preset || 'pure', opt = NET.opt || PRESET.pure;
  const vals = { diff: NET.diff || 'easy', preset: pr, ai: +NET.ai || 0 }; for (const o of OPTS) vals['o_' + o.k] = !!opt[o.k];
  const guest = host ? NET.guestName : (SET.name || '玩家二');
  TK.room({
    host, code: NET.code || '', status: $('lStatus').textContent,
    players: [{ name: host ? (SET.name || '房主') : (NET.hostName || '房主'), sub: '房主', me: host, color: 'var(--p0)' },
      guest ? { name: guest, sub: '玩家二', me: !host, tag: NET.ready ? '已准备' : '未准备', ok: NET.ready, color: 'var(--p1)' } : { empty: true, name: '等朋友加入', sub: '玩家二' }],
    fields: [{ key: 'diff', label: '难度' + ro, type: 'seg', options: TK_DIFF }, { key: 'preset', label: '玩法' + ro, type: 'seg', options: TK_MODE },
      ...(pr === 'custom' ? OPTS.map(o => ({ key: 'o_' + o.k, type: 'toggle', text: o.n })) : []),
      { key: 'ai', label: '电脑对手' + ro, type: 'seg', options: [{ v: 0, label: '不加' }, { v: 1, label: '加入王老板' }] }],
    values: vals, readyBtn: !host, ready: !!NET.ready, startBtn: host, canStart: !!(host && NET.gctl && NET.gctl.open && NET.ready), startLabel: '开始'
  });
}
{
  const show0 = showScreen, lobby0 = lobbyUI;
  showScreen = function (id) {
    show0(id);
    $('title').classList.add('hidden'); $('lobby').classList.add('hidden');
    if (id === 'lobby') { TK.show(); return; }
    if (id !== 'title') { if (id === null || id === undefined) TK.hide(); return; }
    if (TK.visible && TK.screen === 'room') TK.room(null); else { TK.home(); TK.show(); }
  };
  lobbyUI = function (st) { lobby0(st); tkRoom(); };
  titleStatus = function (t) {
    if (!t || /只能单人游玩/.test(t)) return;
    if (!/^正在/.test(t)) TK.toast(t, 3600);
    if (TK.visible && TK.screen === 'room') { if (!/^正在/.test(t) && !linkUp()) TK.roomFail(t); else TK.room({ status: t }); }
  };
}
