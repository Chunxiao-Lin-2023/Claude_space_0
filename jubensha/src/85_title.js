/* 剧本杀 · 开始界面：共用的 TitleKit（shared/titlekit）
   标题页交给 TitleKit：继续上次 / 开始新的案件 / 和朋友联机 / 存档 / 设置 / 玩法说明 / 游戏厅。
   选剧本（setup）和联机大厅（lobby：剧本、模式、难度、各自的角色）仍是游戏自己的二级界面。 */
/* 看真相时刷新也能回来接着看（以前真相页的存档不算，刷新就没了） */
const tkSave = () => loadSave(DEFAULT_SID);
const TK = TitleKit.create({
  id: 'jubensha', title: '夜半推理馆', hub: HUB, onHub: () => { NET.leave(); location.href = '../'; }, artifact: ARTIFACT, z: 50, hidden: true, shade: false,
  logo: '<div class="tk-s" style="letter-spacing:.5em;margin:0 0 6px">剧本杀</div><div class="tk-t" style="font-family:var(--serif);color:#e8c77a;letter-spacing:.12em">夜半推理馆</div>',
  accent: '#d9b062', accentInk: '#1e1606', panel: 'rgba(16,18,26,.84)',
  continueLabel: '继续上次',
  solo: { label: '开始新的案件', sub: '当侦探，或者入局当嫌疑人', chev: true },
  online: { label: '和朋友联机', sub: '两人各用自己的设备 · 开房间或用房间码加入', nick: false,
    hostText: '你开房间并运行 AI。进房间后选模式、难度和各自的角色，朋友连上后就能开始。', joinText: '输入朋友的房间码，进房间后挑你的角色。' },
  saves: {
    label: '存档', slots: 1, remove: true,
    note: '每一步都会自动存档。只有一个存档位：开始新的案件会覆盖上次没下完的局。',
    list: () => { const sv = tkSave(); return [sv ? { slot: 1, title: SCRIPTS[sv.sid].title + ' · ' + PHASES[phaseIdx(sv.phase)].name + (sv.mode === 'net' ? ' · 联机局' + (sv.room ? '（房间 ' + sv.room + '）' : '') : ''), detail: DIFF[sv.diff] ? DIFF[sv.diff].name : '', time: sv.pt0 || sv.t0 || 0 } : { slot: 1, empty: true, title: '没有进行中的案件' }]; },
    load: () => { const sv = tkSave(); if (!sv) return; TK.hide(); if (sv.mode === 'net' && sv.phase !== 'reveal' && (sv.seats.filter(Boolean).length > 1 || sv.guestRole)) UI.modal('resumeNet'); else UI.resume(); },
    remove: () => lsSet('save-' + DEFAULT_SID, null)
  },
  sound: { get: () => !OPT.sound, set: v => { OPT.sound = !v; saveOpt(); } },
  settings: [
    { group: '画面与台词', key: 'anim', label: '动画', sub: '破防演出、淡入', type: 'toggle', get: () => !!OPT.anim, set: v => { OPT.anim = v; saveOpt(); } },
    { key: 'typing', label: '台词逐字出现', type: 'toggle', get: () => !!OPT.typing, set: v => { OPT.typing = v; saveOpt(); } },
    { group: '声音', key: 'sound', label: '声音', type: 'toggle', get: () => !!OPT.sound, set: v => { OPT.sound = v; saveOpt(); } },
    { group: 'AI', key: 'autoAI', label: 'AI 自动插话', sub: '每两次操作后', type: 'toggle', get: () => !!OPT.autoAI, set: v => { OPT.autoAI = v; saveOpt(); } },
    { key: 'aikit', label: 'AI 玩家（Claude）', sub: '用你的 API 密钥让 Claude 扮演 AI 玩家', type: 'button', run: () => UI.modal('ai') },
    { key: 'tut', label: '重新显示新手引导', type: 'button', run: T => { lsSet('tut', 0); T.toast('下一局会重新显示新手引导'); } }
  ],
  howto: () => { const d = document.createElement('div'); d.innerHTML = modalHTML('rules') || ''; const b = d.querySelector('.db'); return b ? b.innerHTML : ''; },
  foot: '',
  start: () => { TK.hide(); UI.go('setup'); },
  host: () => { TK.hide(); UI.go('lobby'); NET.host(); },
  join: ({ code }) => { TK.hide(); UI.go('lobby'); NET.join(code); },
  leaveRoom: () => NET.leave()
});
{
  renderTitle = function () { app().innerHTML = '<div class="scr" style="position:relative"></div>'; if (!TK.visible) { TK.home(); TK.show(); } };
  const c0 = UI.close; UI.close = function () { const r = c0.apply(this, arguments); if (U.scr === 'title' && !TK.visible) TK.show(); return r; };
  const g0 = UI.go; UI.go = function (s) { if (s !== 'title' && TK.visible) TK.hide(); return g0.apply(this, arguments); };
}
