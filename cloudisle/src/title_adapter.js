/* ================= start screen: shared TitleKit (shared/titlekit) =================
   Injected after the game script by build.py. The old #sTitle panel is kept (other code renders into it) but never shown:
   TitleKit draws 继续 / 新建角色 / 联机 / 存档 / 设置 / 玩法. Character creation (#sCreate: class cards, name, difficulty)
   stays the game's own second-level screen. Characters are the save slots. */
(function () {
  const LASTK = 'cloudisle.tk.played';
  const played = () => { try { return JSON.parse(localStorage.getItem(LASTK) || '{}'); } catch (e) { return {}; } };
  const markPlayed = i => { const o = played(); o[i] = Date.now(); try { localStorage.setItem(LASTK, JSON.stringify(o)); } catch (e) { } };
  const charLine = sv => `${sv.name} · Lv.${sv.lv} ${CLS[sv.cls].name}`;
  const chars = () => loadSlots().map((sv, i) => sv ? { v: i, label: sv.name, sub: `Lv.${sv.lv} ${CLS[sv.cls].name} · ${(DIFF[sv.diff] || DIFF.normal).n}` } : null).filter(Boolean);
  const freeSlot = () => loadSlots().findIndex(x => !x);
  const HUBP = /\/cloudisle\/(index\.html)?$/.test(location.pathname);
  const newChar = () => { const f = freeSlot(); if (f < 0) { TK.toast('三个角色位都满了：先在「存档」里删一个'); TK.go('saves'); return; } slotSel = f; openCreate(); };
  const TK = window.TK = TitleKit.create({
    id: 'cloudisle', title: '云岛冒险', hub: HUBP, artifact: inArtifact(), z: 30, hidden: true, panel: 'rgba(30,26,51,.9)',
    logo: '<div class="tk-t logo" style="margin:0">云岛冒险</div><div class="tk-s" style="color:#3b2f5c;text-shadow:0 1px 0 rgba(255,255,255,.7)">横版刷怪 · 职业技能 · 双人联机</div>',
    accent: '#ffb648', accentInk: '#2a1a05', font: 'inherit', shade: false,
    solo: { label: '新建角色', sub: '选职业、起名字、定难度', chev: true },
    continueLabel: '继续冒险',
    online: {
      label: '双人联机', sub: '创建房间 · 用房间码加入',
      hostText: '你当房主，世界和难度以你为准。把 4 位房间码或邀请链接发给队友。', joinText: '输入队友的房间码，用下面选中的角色进入他的世界。',
      nick: false,
      fields: () => { const c = chars(); return c.length ? [{ key: 'slot', label: '用哪个角色', type: 'cards', options: c, def: () => (loadSlots()[slotSel] ? slotSel : c[0].v) }] : [{ type: 'note', text: '还没有角色：先回到上一页「新建角色」。' }]; }
    },
    saves: {
      label: '角色与存档', slots: 3, newInSlot: i => { slotSel = i; openCreate(); },
      list: () => { const P = played(); return loadSlots().map((sv, i) => sv ? { slot: i, no: i + 1, title: charLine(sv), detail: (DIFF[sv.diff] || DIFF.normal).n + ' · 金币 ' + (sv.meso || 0), time: P[i] || 0 } : { slot: i, no: i + 1, empty: true, title: '空位', detail: '点「新建」创建角色' }); },
      load: i => { auInit(); slotSel = i; markPlayed(i); startHost(false); },
      remove: i => { const a = loadSlots(); a[i] = null; storeSlots(a); renderSlots(); },
      export: i => { const sv = loadSlots()[i]; return sv ? JSON.stringify({ game: 'cloudisle', v: 1, at: new Date().toISOString(), slots: [sv] }) : ''; },
      import: txt => {
        try { const o = JSON.parse(txt), sl = (Array.isArray(o) ? o : o && o.slots || []).filter(x => x && CLS[x.cls]); if (!sl.length) return '不是有效的云岛冒险存档';
          const a = loadSlots(); let n = 0; for (const sv of sl) { const f = a.findIndex(x => !x); if (f < 0) break; a[f] = sv; n++; }
          if (!n) return '三个角色位都满了，先删一个再导入'; storeSlots(a); renderSlots(); return { ok: true, msg: '已导入 ' + n + ' 个角色' + (n < sl.length ? '（位置不够，少导入了 ' + (sl.length - n) + ' 个）' : '') };
        } catch (e) { return '不是有效的云岛冒险存档（.json 文件内容或存档码）'; }
      }
    },
    sound: { get: () => !!AU.muted, set: v => { auInit(); setMute(v); } },
    settings: [
      { group: '声音', key: 'snd', label: '声音', type: 'toggle', get: () => !AU.muted, set: v => { auInit(); setMute(!v); } },
      { key: 'mus', label: '音乐', type: 'toggle', get: () => !!MUS.on, set: v => { auInit(); setMusic(v); } },
      { group: '操作', key: 'keys', label: '按键设置…', sub: 'WASD / 方向键布局，或逐个改键', type: 'button', run: T => { T.hide(); $('bKeys0').click(); } }
    ],
    howto: () => { renderHelp(); return '<div class="kv">' + $('helpKv').innerHTML + '</div>'; },
    foot: '存档每 5 秒自动保存在这台设备的浏览器里',
    start: () => newChar(),
    host: ({ setup }) => { const i = setup.slot; if (!loadSlots()[i]) { TK.roomFail('先选一个角色'); return; } auInit(); slotSel = i; markPlayed(i); startHost(true); },
    join: ({ code, setup }) => { const i = setup.slot; if (!loadSlots()[i]) { TK.roomFail('先新建一个角色'); return; } auInit(); slotSel = i; markPlayed(i); netJoin(code); },
    leaveRoom: () => { if (NET.role) netLeave(); }
  });
  // the old title panel: whenever the game shows it, show TitleKit instead
  const sT = $('sTitle'), sC = $('sCreate');
  const sync = () => {
    if (sT.classList.contains('on')) { sT.classList.remove('on'); if (TK.visible && TK.screen === 'room') return; TK.home(); TK.show(); }
    if (sC.classList.contains('on') && TK.visible) TK.hide();
  };
  new MutationObserver(sync).observe(sT, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(sC, { attributes: true, attributeFilter: ['class'] });
  const play0 = startPlay; startPlay = function () { TK.hide(); return play0.apply(this, arguments); };
  setTitleNote = function (s) {
    if (!s) return;
    if (TK.visible && TK.screen === 'room') { if (NET.role !== 'guest' && NET.role !== 'host') TK.roomFail(s); else TK.room({ status: s }); return; }
  };
  // key settings is a game window: when it closes on the title, come back to TitleKit
  new MutationObserver(() => { if (state === 'title' && $('wKeys').classList.contains('hidden') && !TK.visible) TK.show(); }).observe($('wKeys'), { attributes: true, attributeFilter: ['class'] });
  sync(); if (state === 'title' && !TK.visible) { TK.home(); TK.show(); }
})();
