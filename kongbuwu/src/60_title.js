/* ================= start screen: shared TitleKit (shared/titlekit) =================
   #title keeps its canvas art (titleDraw); its own buttons and notes are hidden and TitleKit draws the menu on top:
   继续 · 新游戏 (开局设置: which slot) · 双人同屏 (开房间 / 加入; the host picks the save from the room) · 存档 (5) · 设置 · 玩法.
   Wraps toTitle / coopTitle / coopRender after 59_coop has wrapped them. */
{ const st = document.createElement('style'); st.textContent = '#title>*:not(canvas){display:none!important}'; document.head.appendChild(st); }
let tkArm = 0, tkLastToast = '', tkBusy = false;
{ const t0 = toast; toast = function (s) { tkLastToast = s; return t0.apply(this, arguments); }; }
const tkFree = () => { for (let n = 1; n <= SLOTS; n++) if (!slotInfo(n)) return n; return 0; };
const tkLine = s => rankOf(s.lv) + ' · ' + s.lv + ' 级 · ' + s.ch;
const TK = TitleKit.create({
  id: 'kongbuwu', title: '我有一座恐怖屋', hub: HUB, artifact: inArtifact(), z: 25, hidden: true, shade: false,
  logo: '<div class="tk-t" style="font-family:\'Songti SC\',\'Noto Serif SC\',serif;font-weight:500;letter-spacing:.18em;color:#e9e4d6;text-shadow:0 0 24px rgba(200,30,20,.55);font-size:clamp(34px,7vw,64px)">我有一座恐怖屋</div><div class="tk-s" style="color:#c44;letter-spacing:.5em">陈歌篇 · 文字版</div>',
  accent: '#b8312a', accentInk: '#fff2ee', panel: 'rgba(10,11,13,.84)',
  solo: { label: '新游戏', sub: '接手快倒闭的恐怖屋' },
  online: { label: '双人同屏', sub: '两台设备一起玩 · 开房间或用房间码加入', nick: false,
    hostText: '你当房主：开好房间后，在房间里选存档（继续 / 新开一局 / 读取）。两人看同一个画面、共用陈歌，同一时刻一人操作，可以交换。', joinText: '输入朋友的房间码。房主进游戏后你这边会自动跟上。' },
  setup: {
    fields: () => { const L = []; for (let n = 1; n <= SLOTS; n++) L.push([n, slotInfo(n)]);
      return [{ key: 'slot', label: '存到哪个存档位', type: 'cards', modes: ['solo'], def: tkFree() || SLOT, options: L.map(([n, s]) => ({ v: n, label: n + ' 号', sub: s ? '会覆盖：' + tkLine(s) : '空位' })) }]; }
  },
  saves: {
    label: '存档', slots: SLOTS, newInSlot: n => { slotNew(n); },
    list: () => Array.from({ length: SLOTS }, (_, i) => { const n = i + 1, s = slotInfo(n); return s ? { slot: n, title: tkLine(s), detail: '第 ' + s.day + ' 天 · ' + s.loc, time: s.at || 0 } : { slot: n, empty: true, title: '空位' }; }),
    load: n => slotPlay(n),
    remove: n => { store.del(saveKey(n)); store.del(jrKey(n)); if (n === SLOT && C) C = null; },
    export: n => { const c = store.get(saveKey(n), null); if (!c) return ''; try { return btoa(unescape(encodeURIComponent(JSON.stringify({ c, j: store.get(jrKey(n), []).slice(-60) })))); } catch (e) { return ''; } },
    import: code => { const t = tkFree(); if (!t) return '5 个存档位都满了，先删一个再导入'; const keep = SLOT; useSlot(t); C = null; if (importCode(code)) { C = null; return { ok: true, msg: '已导入到 ' + t + ' 号存档' }; } useSlot(keep); return '这串存档码读不出来'; }
  },
  sound: { get: () => !SET.snd, set: v => { SET.snd = v ? 0 : 1; saveSet(); audioInit(); applyMode(); } },
  settings: [
    { group: '声音', key: 'snd', label: '音效', type: 'toggle', get: () => !!SET.snd, set: v => { SET.snd = v ? 1 : 0; saveSet(); audioInit(); applyMode(); } },
    { key: 'mus', label: '音乐', type: 'toggle', get: () => !!SET.mus, set: v => { SET.mus = v ? 1 : 0; saveSet(); audioInit(); applyMode(); } },
    { group: '画面', key: 'scare', label: '惊吓画面', sub: '关掉后，突然出现的脸会换成一下红光', type: 'toggle', get: () => !!SET.scare, set: v => { SET.scare = v ? 1 : 0; saveSet(); } },
    { key: 'motion', label: '动画', type: 'toggle', get: () => !!SET.motion, set: v => { SET.motion = v ? 1 : 0; saveSet(); applyMode(); } },
    { key: 'font', label: '字号', type: 'seg', options: [{ v: 0, label: '标准' }, { v: 1, label: '大' }, { v: 2, label: '特大' }], get: () => SET.font, set: v => { SET.font = v; saveSet(); applyFont(); } },
    { group: '游戏', key: 'diff', label: '难度', type: 'seg', options: () => DIFF.map((d, i) => ({ v: i, label: d.n })), get: () => SET.diff, set: v => { SET.diff = v; saveSet(); } }
  ],
  howto: `<p>你是陈歌，九江西郊一座快倒闭的恐怖屋的老板。根据我会修空调《我有一座恐怖屋》改编：接手恐怖屋 → 平安公寓 → 西城私立学院 → 暮阳中学 → 第三病栋。</p>
    <h4>怎么玩</h4><ul><li>白天经营恐怖屋：接待游客、吓出尖叫攒钱，把请回来的怪谈安排成员工。</li><li>夜里接任务闯怪谈场景，像素俯视角探索、解谜、躲避或战斗。</li><li>点下方的行动按钮、地点和人物推进；对话可以一句句点下去。</li></ul>
    <h4>存档</h4><p>自动存档。5 个存档位互不影响；换设备前在「存档」里导出存档码，到新设备「存档 → 导入存档」粘贴。</p>
    <h4>双人同屏</h4><p>两台设备用房间码连上：两人看同一个画面、共用陈歌，同一时刻一人操作，另一人可以请求接手。白天接待时房主扮陈歌，朋友操作一名站岗员工。</p>
    <p class="mini">含突然出现的惊吓画面和声音，可在设置里关掉。</p>`,
  foot: '根据我会修空调《我有一座恐怖屋》改编',
  start: ({ setup }) => {
    const n = setup.slot || tkFree() || SLOT;
    if (slotInfo(n) && tkArm !== n) { tkArm = n; TK.toast(n + ' 号存档里已经有进度，再点一次「开始」会覆盖它'); setTimeout(() => { if (tkArm === n) tkArm = 0; }, 4000); return; }
    tkArm = 0; slotNew(n);
  },
  host: () => { tkLastToast = ''; tkBusy = true; Promise.resolve(netHost()).finally(() => { tkBusy = false; if (!NETROLE) TK.roomFail(tkLastToast || '开房间失败'); else tkRoom(); }); },
  join: ({ code }) => { tkLastToast = ''; tkBusy = true; Promise.resolve(netJoin(code)).finally(() => { tkBusy = false; if (!NETROLE) TK.roomFail(tkLastToast || '连接失败'); else tkRoom(); }); },
  leaveRoom: () => netLeave(),
  roomAction: a => {
    if (a === 'cont') slotPlay(SLOT);
    else if (a === 'new') { const n = tkFree(); if (!n) { TK.toast('5 个存档位都满了：点「读取存档」选一个，或先删一个'); return; } slotNew(n); }
    else if (a === 'saves') TK.go('saves');
  }
});
function tkRoom() {
  if (!NETROLE) return;
  const host = NETROLE === 'host', up = netUp(), has = !!slotInfo(SLOT);
  TK.room({
    host, code: NET.code || '', status: NET.status || '',
    players: [{ name: '房主' + (host ? '' : ''), sub: '扮演陈歌', me: host, color: '#b8312a' },
      up || !host ? { name: '队友', sub: '一起看、轮流操作', me: !host, color: '#5a8bd6' } : { empty: true, name: '等队友输入房间码', sub: '一起看、轮流操作' }],
    html: host ? (up ? '队友已加入：选一个存档开始，队友会自动跟上。' : '也可以先选存档进游戏，队友之后随时能加入。') : '等房主选存档……房主进游戏后你这边会自动跟上。',
    actions: host ? [has ? { id: 'cont', label: '继续 ' + SLOT + ' 号' } : null, { id: 'new', label: '新开一局' }, { id: 'saves', label: '读取存档…' }].filter(Boolean) : []
  });
}
{
  const tt = toTitle, ren = coopRender;
  toTitle = function () { const r = tt.apply(this, arguments); if (NETROLE && TK.visible && TK.screen === 'room') tkRoom(); else { TK.home(); TK.show(); if (NETROLE) { TK.show('room'); tkRoom(); } } return r; };
  coopRender = function () {
    const r = ren.apply(this, arguments);
    if (TK.visible && TK.screen === 'room' && !tkBusy) { if (!NETROLE) TK.roomFail(tkLastToast || '已离开房间'); else tkRoom(); }
    return r;
  };
  new MutationObserver(() => { const on = $('#title').classList.contains('on'); if (!on && TK.visible) TK.hide(); }).observe($('#title'), { attributes: true, attributeFilter: ['class'] });
}
