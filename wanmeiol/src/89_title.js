/* ================= start screen: shared TitleKit (shared/titlekit) =================
   #title keeps the ink-wash canvas (titleDraw); its old button box (#tbx) is hidden and TitleKit draws the menu on top:
   继续 · 新游戏 (开局设置: which slot) · 联机 (创建房间: which save / 加入) · 存档 (5 slots) · 设置 · 玩法. */
const tkSlotLine = v => { const q = MAIN[v.story.q] || MAIN[0]; return `${realmOf(v.lv).name} 第 ${v.lv} 层 · ${q.title}`; };
const tkSlotDetail = v => { const q = MAIN[v.story.q] || MAIN[0], P = PLACES[v.loc]; return [CH_NAMES[q.ch] || '', '第 ' + (v.day || 1) + ' 天', P ? P.name : ''].filter(Boolean).join(' · '); };
let tkArm = 0;
const TK = TitleKit.create({
  id: 'wanmeiol', title: '完美世界', hub: HUB, artifact: inArtifact(), z: 45, hidden: true, shade: false,
  logo: '<div class="tk-t">完美世界</div><div class="tk-s">石昊篇 · 文字版</div>',
  accent: '#d9b25f', accentInk: '#1c1408', font: 'var(--fh)',
  solo: { label: '新游戏', sub: '从石村开始，做回小不点' },
  online: { nick: false, label: '和朋友一起玩', sub: '开房间 · 用房间码加入', hostText: '你当房主：用一个存档开房间，或者新开一局。朋友进来后和你一起推进剧情。', joinText: '输入朋友的房间码。房主要停在游戏页面上。' },
  setup: {
    title: '开局设置',
    fields: () => {
      const L = []; for (let s = 1; s <= SLOTS; s++) L.push([s, loadSave(s)]);
      const free = L.find(x => !x[1]), freeS = free ? free[0] : 0;
      return [
        { key: 'slot', label: '存到哪个存档位', type: 'cards', modes: ['solo'], def: freeS || SLOT,
          options: L.map(([s, v]) => ({ v: s, label: '存档 ' + s, sub: v ? '会覆盖：' + tkSlotLine(v) : '空位' })) },
        { key: 'hslot', label: '用哪一段人生开房间', type: 'cards', modes: ['host'], def: loadSave(SLOT) ? 's' + SLOT : (freeS ? 'n' + freeS : 's' + SLOT),
          options: L.filter(x => x[1]).map(([s, v]) => ({ v: 's' + s, label: '继续存档 ' + s, sub: tkSlotLine(v) })).concat(freeS ? [{ v: 'n' + freeS, label: '新开一局', sub: '从石村开始 · 存到空位 ' + freeS }] : []) },
        { type: 'note', modes: ['host'], text: () => freeS ? '' : '5 个存档位都满了：要新开一局，先在「存档」里删一个。' }
      ];
    }
  },
  saves: {
    label: '存档', slots: SLOTS, newInSlot: s => slotNew(s),
    list: () => Array.from({ length: SLOTS }, (_, i) => { const s = i + 1, v = loadSave(s); return v ? { slot: s, title: tkSlotLine(v), detail: tkSlotDetail(v), time: v.savedAt || 0 } : { slot: s, empty: true, title: '空位', detail: '每个位置是一段独立的人生，回忆录也分开记' }; }),
    load: s => slotPlay(s),
    remove: s => { store.del(saveKey(s)); store.del(jKey(s)); if (s === SLOT) { JOURNAL = []; C = null; } },
    export: async s => { if (s === SLOT && C) save(true); const c = loadSave(s); if (!c) return ''; return 'WMOL1' + await b64z(JSON.stringify({ c, j: store.get(jKey(s), []) })); },
    import: async code => {
      const t = slotFree(); if (!t) return '5 个存档位都满了，先删一个再导入';
      const keep = SLOT; useSlot(t); C = null;
      try { await importCode(code); C = null; return { ok: true, msg: '已导入到存档 ' + t }; } catch (e) { useSlot(keep); return '存档码无法识别（应以 WMOL1 开头）'; }
    }
  },
  sound: { get: () => !!SET.mute, set: v => { SET.mute = v; saveSet(); musicMode(); } },
  settings: [
    { group: '声音', key: 'mute', label: '音效', type: 'toggle', get: () => !SET.mute, set: v => { SET.mute = !v; saveSet(); musicMode(); } },
    { key: 'music', label: '背景音乐', type: 'toggle', get: () => !!SET.music, set: v => { SET.music = v; saveSet(); musicMode(); } },
    { key: 'vol', label: '音量', type: 'range', min: 0, max: 1, step: 0.05, get: () => SET.vol, set: v => { SET.vol = v; if (AU.master) AU.master.gain.value = v; saveSet(); } },
    { group: '画面', key: 'fs', label: '字号', type: 'seg', options: [{ v: 0, label: '标准' }, { v: 1, label: '大' }, { v: 2, label: '特大' }], get: () => SET.fs, set: v => { SET.fs = v; saveSet(); applyFont(); } },
    { key: 'motion', label: '战斗动画、画面切换动画', type: 'toggle', get: () => SET.motion !== false, set: v => { SET.motion = v; saveSet(); applyAnimPref(); } },
    { group: '对话与战斗', key: 'textNow', label: '文字逐字出现', sub: '长的话分段，一次点出一段', type: 'toggle', get: () => !SET.textNow, set: v => { SET.textNow = !v; saveSet(); } },
    { key: 'fast', label: '自动战斗加快', sub: '也让逐字快一点', type: 'toggle', get: () => !!SET.fast, set: v => { SET.fast = v; saveSet(); } },
    { type: 'note', key: 'n1', text: '难度、跳章、存档码也可以在游戏里右上角的 ⚙️ 设置里改。' }
  ],
  howto: `<h4>你是谁</h4><p>你是石村的小不点。根据辰东《完美世界》改编：石村 → 出村 → 补天阁 → 百断山……一路走到界海，十五卷完整剧情。</p>
    <h4>怎么玩</h4><ul><li>点地点、人物和下方的行动按钮推进；任务列表里主线、支线、悬赏都能追踪。</li><li>战斗会提前显示敌人的意图：大招可以防御，也能打断。吃药不占回合，弱怪可以一键结算。</li><li>宝术、洞天、宝骨、伙伴都能一直成长；难度随时在 ⚙️ 设置里换。</li></ul>
    <h4>存档</h4><p>游戏会自动存档。5 个存档位互不影响；换设备前在「存档」里导出存档码，到新设备的「存档 → 导入存档」粘贴。</p>
    <h4>和朋友一起玩</h4><p>一人开房间（用现有存档或新开一局），把房间码或邀请链接发给朋友；朋友加入后可以轮流操作，同屏的话直接把设备递过去就行。</p>`,
  foot: '根据辰东《完美世界》改编',
  start: ({ setup }) => {
    const s = setup.slot || slotFree() || SLOT;
    if (loadSave(s) && tkArm !== s) { tkArm = s; TK.toast('存档 ' + s + ' 里已经有一段人生，再点一次「开始」会覆盖它'); setTimeout(() => { if (tkArm === s) tkArm = 0; }, 4000); return; }
    tkArm = 0; slotNew(s);
  },
  host: ({ setup }) => { const v = String(setup.hslot || ''), s = +v.slice(1); if (!s) { TK.roomFail('先选一个存档'); return; } if (v[0] === 'n') slotNewHost(s); else slotHost(s); },
  join: ({ code }) => netJoin(code),
  leaveRoom: () => { NET.tok = (NET.tok || 0) + 1; netLeave(); }
});
{
  const title0 = toTitle, enter0 = enterGame, recv0 = guestRecv;
  toTitle = function () { title0(); $('tbx').style.display = 'none'; TK.home(); TK.show(); };
  enterGame = function (fresh) { const r = enter0(fresh); if (STATE.mode === 'play') TK.hide(); return r; };
  guestRecv = function (m) { recv0(m); if (STATE.mode === 'play' && TK.visible) TK.hide(); };
  slotsShow = function () { TK.show(); TK.go('saves'); };
  titleCoop = function () { TK.show(); TK.go('online'); };
  titleStatus = function (t) {
    if (!t || !TK.visible) return;
    if (TK.screen !== 'room') { TK.toast(t, 3600); return; }
    if (!NETROLE && !NET.peer && !/^正在连接/.test(t)) TK.roomFail(t); else TK.room({ status: t });
  };
}
