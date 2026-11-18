/* ================= start screen: shared TitleKit (shared/titlekit) =================
   Spliced into the game's IIFE (needs its locals) by build.py. TitleKit is the front door (开始闯关 / 双人联机 / 记录 / 设置 / 玩法);
   the game's own hero page (#menu: hero, skin, weapon, battlefield, difficulty, co-op panel) is the second-level 开局设置 / room screen. */
let tkLastToast = '', tkVia = 'solo';
{ const t0 = toast; toast = function (txt) { tkLastToast = txt; return t0(txt); }; }
const TK = TitleKit.create({
  id: 'jiqiao', title: '机巧百战', hub: HUB, artifact: inArtifact(), z: 30,
  logo: '<div class="tk-t" style="font-family:var(--font-display);color:var(--brass-hi,#e9c07a)">机巧百战</div><div class="tk-s">机关兽来袭 · 十六波闯关</div>',
  accent: '#d8a84e', accentInk: '#1c1406', panel: 'rgba(14,22,25,.86)',
  solo: { label: '开始闯关', sub: '选英雄、皮肤、武器、战场和难度', chev: true },
  online: { label: '双人联机', sub: '创建房间 · 用房间码加入', hostText: '你当房主，战场和难度由你定。两人各选英雄、皮肤和武器，金币和商店各算各的。', joinText: '输入队友的房间码。', nick: false },
  records: () => [['通关次数', best.wins || 0], ['最好成绩', best.wave ? '第 ' + best.wave + ' 波' : '—']],
  recordsSub: () => best.wins ? '已通关 ' + best.wins + ' 次' : best.wave ? '最好成绩：第 ' + best.wave + ' 波' : '首次挑战',
  sound: { get: () => !SFX.on, set: v => { sfxUnlock(); sfxSetOn(!v); sndSync(); } },
  settings: [{ group: '声音', key: 'sfx', label: '音效', sub: '战斗中按 M 也能开关', type: 'toggle', get: () => !!SFX.on, set: v => { sfxUnlock(); sfxSetOn(v); sndSync(); } }],
  howto: () => { const p = document.querySelector('#menu .howto'); return p ? '<p>' + p.innerHTML + '</p>' : ''; },
  foot: '',
  onShow: () => { if (state === 'menu') $('#menu').hidden = true; },
  onHide: () => { if (state === 'menu') $('#menu').hidden = false; },
  start: () => { tkVia = 'solo'; if (NET.mode !== 'solo') netLeave(); TK.hide(); renderMenu(); show('menu'); },
  host: () => { tkVia = 'online'; TK.hide(); renderMenu(); show('menu'); netHost(); },
  join: ({ code }) => { tkVia = 'online'; tkLastToast = ''; NET.joinCode = code; netJoin(code); },
  leaveRoom: () => { if (NET.mode !== 'solo') netLeave(); renderMenu(); }
});
{
  const show0 = show; show = function (id) { show0(id); if (TK.visible && id === 'menu') $('#menu').hidden = true; };
  const menu0 = renderMenu, net0 = netPanel;
  netPanel = function () { return tkVia === 'solo' && NET.mode === 'solo' ? '' : net0(); };
  renderMenu = function () {
    menu0();
    const hl = document.querySelector('#menu .hublink');
    const b = document.createElement('button'); b.className = 'hublink'; b.type = 'button'; b.textContent = '‹ 返回';
    b.onclick = () => { if (NET.mode !== 'solo') netLeave('已离开房间'); TK.home(); TK.show(tkVia === 'online' && !inArtifact() ? 'online' : 'main'); };
    if (hl) hl.replaceWith(b); else { const br = document.querySelector('#menu .brand'); if (br) br.prepend(b); }
    if (TK.visible && TK.screen === 'room') {
      if (NET.role === 'guest' && NET.status === 'joined') TK.hide();
      else if (NET.mode === 'solo') TK.roomFail(tkLastToast || '连接失败');
    }
  };
}
