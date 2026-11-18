/* =================== start screen: shared TitleKit (shared/titlekit) ===================
   TitleKit draws the title menu (单人 / 联机 / 存档 / 记录 / 设置 / 玩法 / 游戏厅) and the hero pick (开局设置).
   The level select + armory (levelScreen) stays the game's own second-level screen; it also serves as the co-op room. */
let tkHeroes = null;
function tkHeroGrid() {
  if (tkHeroes) { for (const c of tkHeroes.children) c.classList.toggle('sel', c.dataset.k === SAVE.hero); return tkHeroes; }
  const hs = tkHeroes = document.createElement('div'); hs.className = 'cards';
  for (const k of Object.keys(HEROES)) {
    const H = HEROES[k], d = document.createElement('div'); d.className = 'hcard' + (SAVE.hero === k ? ' sel' : ''); d.dataset.k = k;
    d.innerHTML = `<canvas width="192" height="220"></canvas><div style="min-width:0"><h3 class="serif">${H.name} <span class="role">${H.role || ''}</span></h3><p>${H.desc}</p><p style="margin-top:5px;color:#cbbfa6">生命 ${H.hp} · 法力 ${H.mp} · ${H.primary.name} / ${H.alt.name} / ${H.skill.name} / ${H.dash.name}</p>${H.passive ? `<p style="margin-top:3px;color:#9fe3ff">${H.passive}</p>` : ''}</div>`;
    portraitCanvas(d.firstChild, k, true);
    d.onclick = () => { audioInit(); sfx('click'); SAVE.hero = k; saveGame(); for (const c of hs.children) c.classList.toggle('sel', c === d); TK.refresh(); };
    hs.appendChild(d);
  }
  return hs;
}
const tkHeroLine = () => { const H = HEROES[SAVE.hero]; return `${H.name} · ${H.role} · ${H.passive || ''}`; };
const TK = TitleKit.create({
  id: 'riftwardens', title: '裂隙守卫', hub: HUB, artifact: inArtifact(), z: 30, hidden: true,
  logo: '<div class="tk-t serif">裂隙守卫</div><div class="tk-s">陷阱塔防 · 动作 · 双人合作</div>',
  accent: '#f3d27a', accentInk: '#22180a', font: '"Noto Serif SC","Songti SC",serif',
  solo: { label: '单人游戏', sub: '选英雄 → 选关卡' },
  online: { label: '双人合作', sub: '创建房间 · 用房间码加入', hostText: '你当房主：选好英雄后进入关卡选择，房主选关，金币共享。把 4 位房间码或邀请链接发给队友。', joinText: '输入队友的房间码；加入后在关卡选择里等房主开战，可以先逛军械库。' },
  setup: {
    title: '选择英雄', start: '下一步：选关卡', wide: true,
    fields: [{ key: 'hero', type: 'node', node: () => tkHeroGrid() }, { type: 'note', html: () => '当前：<b>' + tkHeroLine() + '</b>' }]
  },
  saves: {
    label: '进度', slots: 1, continue: false, export: true, remove: true, import: true,
    note: '进度（骷髅、解锁、纪录）保存在这台设备的浏览器里。导出进度码可以搬到别的设备；删除会清空全部进度。',
    list: () => [{ slot: 1, title: '已获得 ☠ ' + skullsEarned() + ' · 可用 ☠ ' + skullsFree(), detail: '通关 ' + LEVELS.filter(L => (SAVE.best[L.id] || 0) > 0).length + ' / ' + LEVELS.length + ' 关 · 徽章 ' + (SAVE.badges || 0), time: SAVE.at || 0 }],
    load: () => levelScreen(),
    remove: () => { const keep = { name: SAVE.name, hero: SAVE.hero, mute: SAVE.mute, music: SAVE.music, bright: SAVE.bright }; SAVE = Object.assign(defSave(), keep); saveGame(); },
    export: () => 'RW1' + btoa(unescape(encodeURIComponent(JSON.stringify(SAVE)))),
    import: code => {
      try { code = code.replace(/\s+/g, ''); if (!code.startsWith('RW1')) return '进度码应以 RW1 开头'; const s = JSON.parse(decodeURIComponent(escape(atob(code.slice(3))))); if (!s || !s.best) return '进度码无法识别';
        localStorage.setItem(SAVE_KEY, JSON.stringify(s)); location.reload(); return { ok: true, msg: '已导入，正在重新载入…' }; } catch (e) { return '进度码无法识别'; }
    }
  },
  nick: { get: () => SAVE.name || '', set: v => { SAVE.name = v.slice(0, 8); saveGame(); } },
  sound: { get: () => !!AU.muted, set: v => { audioInit(); setMute(v); } },
  sfx: () => { audioInit(); sfx('click'); },
  settings: [
    { group: '声音', key: 'mute', label: '音效', type: 'toggle', get: () => !AU.muted, set: v => { audioInit(); setMute(!v); } },
    { key: 'music', label: '音乐', type: 'toggle', get: () => !!MUS.on, set: v => { audioInit(); setMusic(v); } },
    { key: 'shake', label: '震屏', type: 'toggle', get: () => SAVE.shake !== false, set: v => { SAVE.shake = v; saveGame(); } },
    { group: '画面', key: 'bright', label: '亮度', type: 'seg', options: [{ v: 1, label: '明亮' }, { v: 2, label: '标准' }, { v: 3, label: '昏暗' }], get: () => SAVE.bright || 2, set: v => { SAVE.bright = v; saveGame(); } }
  ],
  howto: () => { const d = document.createElement('div'); const keep = MENU.innerHTML, off = MENU.classList.contains('off'); helpScreen(() => {}); d.innerHTML = MENU.querySelector('.help').innerHTML; MENU.innerHTML = keep; MENU.classList.toggle('off', off); d.querySelectorAll('h2,.btns').forEach(x => x.remove()); return d.innerHTML; },
  records: () => { const r = [['已获得骷髅', '☠ ' + skullsEarned()], ['每日徽章', SAVE.badges || 0]]; for (const L of LEVELS) if (SAVE.endless[L.id]) r.push(['无尽 · ' + L.name, '第 ' + SAVE.endless[L.id] + ' 波']); return r; },
  recordsSub: () => '骷髅 ☠ ' + skullsEarned() + ' · 徽章 ' + (SAVE.badges || 0),
  foot: '',
  start: () => { if (NET.mode === 'online') netLeave(); MSEL.tab = 'lv'; levelScreen(); },
  host: () => { netHost(); MSEL.tab = 'lv'; levelScreen(); },
  join: ({ code }) => { audioInit(); netJoin(code); },
  leaveRoom: () => netLeave()
});
{
  const level0 = levelScreen;
  titleScreen = function (note = '') {
    STATE = 'title'; PAUSED = false; $('hud').classList.remove('on'); $('touch').classList.remove('on'); hideMenu();
    if (TK.visible && TK.screen === 'room') { if (NET.mode !== 'online') TK.roomFail(note || '已离开房间'); else TK.room({ status: note }); return; }
    TK.home(); TK.show(); if (note) TK.toast(note, 3600);
  };
  levelScreen = function () { TK.hide(); return level0(); };
  setTitleNote = function (s) {
    if (TK.visible && TK.screen === 'room') { if (NET.mode !== 'online') TK.roomFail(s); else TK.room({ status: s }); return; }
    if (TK.visible) TK.toast(s, 3600); else toast(s);
  };
}
