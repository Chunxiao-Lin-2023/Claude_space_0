/* ===================== lobby ===================== */
BX.lobby = (function () {
  const HUB = /\/baixi\/(index\.html)?$/.test(location.pathname);
  let cat = BX.store.get('cat', 'all'), q = '';
  const iconCache = new Map();
  function iconCanvas(def, w = 200, hh = 150) {
    const cv = h('canvas'); const d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * d; cv.height = hh * d; const g = cv.getContext('2d'); g.scale(d, d);
    const c = BX.CATS.find(c => c[0] === def.cat) || BX.CATS[0];
    try { if (def.icon) def.icon(g, w, hh); else BX.draw.glyphIcon(g, w, hh, def.glyph || def.title[0], c[3]); }
    catch (e) { console.error('icon', def.id, e); BX.draw.glyphIcon(g, w, hh, def.title[0], c[3]); }
    return cv;
  }
  function tags(def) {
    const t = [];
    if (def.kind === 'solo') t.push(['单人', '']);
    else {
      if (def.modes.includes('ai')) t.push(['人机', '']);
      if (def.modes.includes('online')) t.push(['联机', 'net']);
      if (def.seats[1] > 2) t.push([def.seats[0] === def.seats[1] ? def.seats[0] + '人' : def.seats[0] + '-' + def.seats[1] + '人', '']);
    }
    return t;
  }
  function tile(def) {
    const favs = BX.store.get('fav', []);
    const fav = h('button', {class: 'fav' + (favs.includes(def.id) ? ' on' : ''), text: '★', title: '收藏', on: {click: e => { e.stopPropagation(); let f = BX.store.get('fav', []); f = f.includes(def.id) ? f.filter(x => x !== def.id) : [...f, def.id]; BX.store.set('fav', f); fav.classList.toggle('on'); if (cat === 'fav') render(); }}});
    return h('button', {class: 'tile', on: {click: () => openSheet(def)}},
      iconCanvas(def), h('div', {class: 'tags'}, tags(def).map(([t, c]) => h('span', {class: 'tag ' + c, text: t}))), fav,
      h('div', {class: 'tt'}, h('b', {text: def.title}), h('small', {text: def.sub || ''})));
  }
  function header() {
    const net = BX.net, other = net.other;
    const roomTxt = other ? '同桌：' + other.name : net.role === 'host' && net.code ? '房间 ' + net.code : '联机';
    return h('div', {class: 'lb-head'},
      h('div', {class: 'lanterns'}, h('div', {class: 'lantern'}), h('div', {class: 'lantern'})),
      h('div', {class: 'lb-row'},
        HUB ? h('button', {class: 'hb', id: 'lbHub', text: '‹ 游戏厅', on: {click: () => { location.href = '../'; }}}) : null,
        h('div', {class: 'lb-logo'}, h('div', {class: 'seal', text: '戏'}),
          h('div', {style: {minWidth: 0}}, h('div', {class: 'lb-title', text: '百戏茶馆'}), h('div', {class: 'lb-subt', text: BX.list.length + ' 款棋牌与小游戏 · 人机 · 同屏 · 联机'}))),
        BX.ARTIFACT ? null : h('button', {class: 'hb' + (other ? ' on' : ''), id: 'lbRoom', on: {click: roomModal}}, h('span', {text: '⇄'}), h('span', {class: 'lbl', text: roomTxt})),
        h('button', {class: 'hb', id: 'lbSet', title: '设置', on: {click: settings}}, h('span', {text: '⚙'}), h('span', {class: 'lbl', text: BX.myName()}))));
  }
  function render() {
    const L = $id('lobby'); const st = L.scrollTop; L.innerHTML = '';
    const body = h('div', {class: 'lb-body'});
    L.append(header(), body);
    const net = BX.net;
    if (net.isGuest) body.append(h('div', {class: 'note', html: `已加入 <b>${BX.esc(net.other.name)}</b> 的房间。联机对局由房主开局，你可以打开任意游戏点「提议」告诉房主想玩什么。`}));
    else if (net.isHost) body.append(h('div', {class: 'note', html: `<b>${BX.esc(net.other.name)}</b> 已入座。打开任意游戏，选「联机对战」开局。`}));
    // search
    const search = h('input', {class: 'lb-search', id: 'lbSearch', placeholder: '搜索游戏…', value: q, on: {input: e => { q = e.target.value.trim(); renderList(list); }}});
    body.append(h('div', {class: 'lb-tools'}, search, h('span', {class: 'lb-count', text: '共 ' + BX.list.length + ' 款'})));
    // featured
    if (BX.list.length) {
      const d = new Date(); const k = (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) * 2654435761 >>> 0;
      const fd = BX.list[k % BX.list.length];
      body.append(h('div', {class: 'feat', id: 'lbFeat', on: {click: () => openSheet(fd)}}, iconCanvas(fd), h('div', {}, h('h3', {text: fd.title}), h('p', {text: fd.desc || fd.sub || ''}))));
    }
    // category chips
    const cats = [['all', '全部'], ['recent', '最近'], ['fav', '收藏'], ...BX.CATS.filter(c => BX.list.some(d => d.cat === c[0])).map(c => [c[0], c[1]])];
    const chips = h('div', {class: 'lb-cats', id: 'lbCats'}, cats.map(([id, n]) => h('button', {class: 'chip' + (cat === id ? ' on' : ''), 'data-cat': id, text: n, on: {click: () => {
      cat = id; BX.store.set('cat', cat); for (const c of chips.children) c.classList.toggle('on', c.dataset.cat === id); renderList(list);
      if (id !== 'all' && id !== 'recent' && id !== 'fav') { /* jump */ }
    }}})));
    const list = h('div', {id: 'lbList'});
    body.append(chips, list, h('div', {class: 'lb-foot', html: '百戏茶馆 · 战绩和存档只保存在这台设备上<br>联机：一人在右上角「联机」创建房间，另一人输入房间码加入'}));
    renderList(list);
    L.scrollTop = st;
  }
  function renderList(list) {
    list.innerHTML = '';
    const match = d => !q || (d.title + (d.sub || '') + (d.desc || '') + (d.alias || '')).toLowerCase().includes(q.toLowerCase());
    if (q || cat === 'recent' || cat === 'fav') {
      let arr;
      if (q) arr = BX.list.filter(match);
      else if (cat === 'recent') arr = BX.store.get('recent', []).map(id => BX.games[id]).filter(Boolean);
      else arr = BX.store.get('fav', []).map(id => BX.games[id]).filter(Boolean);
      if (!arr.length) list.append(h('div', {class: 'empty', text: q ? '没有找到「' + q + '」' : cat === 'fav' ? '还没有收藏，点游戏右上角的 ★ 收藏' : '还没有玩过游戏'}));
      else list.append(h('div', {class: 'grid'}, arr.map(tile)));
      return;
    }
    for (const c of BX.CATS) {
      if (cat !== 'all' && cat !== c[0]) continue;
      const arr = BX.list.filter(d => d.cat === c[0]); if (!arr.length) continue;
      list.append(h('section', {class: 'sec', id: 'sec-' + c[0]},
        h('div', {class: 'sec-h'}, h('div', {class: 'seal', style: {background: c[3]}, text: c[2]}), h('h2', {text: c[1]}), h('span', {text: arr.length + ' 款'})),
        h('div', {class: 'grid'}, arr.map(tile))));
    }
  }

  /* ---------- game sheet ---------- */
  function openSheet(def) {
    BX.closeModals();
    const saved = BX.store.get('sel.' + def.id, {});
    const sel = {mode: saved.mode && def.modes.includes(saved.mode) ? saved.mode : def.modes[0], n: saved.n || def.defSeats || def.seats[0], humans: saved.humans || 2, first: saved.first || 'me', level: saved.level || 2, opts: {}};
    if (BX.net.up && def.modes.includes('online')) sel.mode = 'online';
    for (const o of def.options || []) { const v = saved.opts && saved.opts[o.key]; sel.opts[o.key] = o.choices.some(c => c[0] === v) ? v : o.def; }
    sel.n = BX.clamp(sel.n, def.seats[0], def.seats[1]);
    let ov;
    const close = () => ov.remove();
    const body = h('div', {class: 'sheet-b'}), foot = h('div', {class: 'sheet-f'});
    const seg = (label, items, cur, set, id) => h('div', {class: 'fld', id}, h('label', {text: label}), h('div', {class: 'seg'}, items.map(([v, t, dis]) => h('button', {class: v === cur ? 'on' : '', text: t, disabled: !!dis, 'data-v': String(v), on: {click: () => { set(v); draw(); }}}))));
    function draw() {
      body.innerHTML = ''; foot.innerHTML = '';
      const net = BX.net;
      if (def.kind !== 'solo') {
        body.append(seg('对局方式', def.modes.map(m => [m, BX.MODE_NAMES[m]]), sel.mode, v => sel.mode = v, 'fMode'));
        if (def.seats[1] > def.seats[0]) body.append(seg('人数', BX.range(def.seats[1] - def.seats[0] + 1).map(i => [def.seats[0] + i, (def.seats[0] + i) + ' 人']), sel.n, v => sel.n = v, 'fN'));
        const n = BX.clamp(sel.n, def.seats[0], def.seats[1]);
        if (sel.mode === 'local' && n > 2) body.append(seg('本机玩家', BX.range(n - 1).map(i => [i + 2, (i + 2) + ' 人' + (i + 2 < n ? '（其余电脑）' : '')]), BX.clamp(sel.humans, 2, n), v => sel.humans = v, 'fHum'));
        const hasAI = sel.mode === 'ai' || (sel.mode === 'local' && BX.clamp(sel.humans, 2, n) < n) || (sel.mode === 'online' && n > 2);
        if (hasAI && def.aiLevels !== false) body.append(seg('电脑难度', [[1, '初级'], [2, '中级'], [3, '高级']], sel.level, v => sel.level = v, 'fLv'));
        if (sel.mode !== 'local' && !def.noFirst) body.append(seg(def.firstLabel || (n > 2 ? '座位' : '先后手'), n > 2 ? [['me', '我坐首位'], ['rand', '随机']] : [['me', '我先'], ['other', '对方先'], ['rand', '随机']], sel.first, v => sel.first = v, 'fFirst'));
        if (sel.mode === 'local' && !def.noFirst && def.seats[1] > 2) body.append(seg('座位', [['me', '按顺序'], ['rand', '随机']], sel.first === 'rand' ? 'rand' : 'me', v => sel.first = v, 'fFirst'));
      }
      for (const o of def.options || []) {
        if (o.modes && !o.modes.includes(sel.mode)) continue;
        body.append(seg(o.label, o.choices.map(c => [c[0], c[1]]), sel.opts[o.key], v => sel.opts[o.key] = v, 'fo-' + o.key));
      }
      if (sel.mode === 'online') {
        if (!net.up) body.append(h('div', {class: 'note warn', html: '还没有联机房间。点下面的「联机房间」创建房间，或输入对方的房间码加入。'}));
        else if (net.isGuest) body.append(h('div', {class: 'note', html: `联机对局由房主 <b>${BX.esc(net.other.name)}</b> 开局。可以点「提议」请房主开这个游戏。`}));
        else body.append(h('div', {class: 'note', html: `与 <b>${BX.esc(net.other.name)}</b> 联机对战。`}));
      }
      if (sel.mode === 'local' && def.hidden) body.append(h('div', {class: 'note', html: '同屏对战时有隐藏信息，轮到谁时会提示把设备交给谁。'}));
      body.append(h('details', {class: 'rd'}, h('summary', {text: '玩法规则'}), h('div', {class: 'rules', html: def.rules || '暂无说明'})));
      const st = BX.store.get('stats', {})[def.id];
      if (st && st.n) body.append(h('div', {class: 'stats', text: def.kind === 'solo' ? `已玩 ${st.n} 局` : `已玩 ${st.n} 局 · 胜 ${st.w} · 负 ${st.l}` + (st.d ? ` · 和 ${st.d}` : '')}));
      // footer buttons
      const res = BX.getResume(def.id);
      if (sel.mode === 'online') {
        if (!net.up) foot.append(h('button', {class: 'bx-btn', text: '联机房间', on: {click: () => { roomModal(); }}}));
        else if (net.isGuest) foot.append(h('button', {class: 'bx-btn jade', id: 'bSuggest', text: '提议房主开这局', on: {click: () => { net.send({t: 'suggest', id: def.id}); BX.toast('已告诉房主'); }}}));
        else foot.append(h('button', {class: 'bx-btn red', id: 'bStart', text: '开局', on: {click: () => { remember(); close(); BX.startOnline(def, sel.opts, {n: sel.n, first: sel.first, level: sel.level}); }}}));
      } else {
        if (res && res.log && res.log.length && res.mode !== 'online') foot.append(h('button', {class: 'bx-btn jade', id: 'bResume', text: '继续上局', on: {click: () => { close(); BX.launch(def, {mode: res.mode, opts: res.opts, seed: res.seed, seats: res.seats, sel: res.sel, log: res.log}); }}}));
        foot.append(h('button', {class: 'bx-btn red', id: 'bStart', text: res && res.log && res.log.length ? '新开一局' : BX.MODE_NAMES[sel.mode] === '开始游戏' ? '开始游戏' : '开始', on: {click: () => {
          remember(); close();
          const s2 = {mode: sel.mode, n: sel.n, humans: sel.humans, first: sel.first, level: sel.level};
          BX.launch(def, {mode: sel.mode, opts: Object.assign({}, sel.opts), seed: BX.newSeed(), seats: BX.makeSeats(def, s2), sel: s2});
        }}}));
      }
    }
    function remember() { BX.store.set('sel.' + def.id, sel); }
    const ic = iconCanvas(def, 96, 72);
    const sheet = h('div', {class: 'sheet', id: 'gSheet'},
      h('div', {class: 'sheet-h'}, ic, h('div', {}, h('h3', {text: def.title}), h('p', {text: def.desc || def.sub || ''}))),
      h('button', {class: 'sheet-x', text: '✕', on: {click: () => close()}}), body, foot);
    ov = h('div', {class: 'ov', on: {click: e => { if (e.target === ov) close(); }}}, sheet);
    ov._close = close; BX._modals.add(ov); const rm = ov.remove.bind(ov); ov.remove = () => { BX._modals.delete(ov); rm(); };
    draw(); $id('layer').append(ov);
    ov._redraw = draw; curSheet = ov;
  }
  let curSheet = null;

  /* ---------- room ---------- */
  function roomModal() {
    BX.closeModals();
    const box = h('div', {class: 'mbox'}); let ov;
    const close = () => { ov.remove(); document.removeEventListener('bx-net', draw); };
    function draw() {
      const net = BX.net; box.innerHTML = '';
      box.append(h('h3', {text: '联机房间'}));
      if (net.other) {
        box.append(h('div', {class: 'msg', html: `已与 <b>${BX.esc(net.other.name)}</b> 同桌${net.role === 'host' ? '（你是房主）' : ''}<br>${net.role === 'host' ? '打开任意游戏，选「联机对战」开局。' : '等房主开局；也可以在游戏里点「提议」。'}`}),
          h('div', {class: 'btns'}, h('button', {class: 'bx-btn', text: '去选游戏', on: {click: close}}), h('button', {class: 'bx-btn ghost', text: '离开房间', on: {click: () => net.leave()}})));
      } else if (net.role === 'host') {
        box.append(h('div', {class: 'msg', text: '把房间码告诉对方：'}), h('div', {class: 'code', id: 'roomCode', text: net.code || '····'}), h('div', {class: 'msg', style: {fontSize: '13px'}, text: net.status}),
          h('div', {class: 'btns'}, h('button', {class: 'bx-btn ghost', text: '取消', on: {click: () => net.leave()}})));
      } else {
        const name = h('input', {class: 'txt', id: 'roomName', value: BX.myName(), maxLength: 10, on: {change: e => { BX.store.set('name', e.target.value.trim().slice(0, 10)); }}});
        const code = h('input', {class: 'txt', id: 'roomJoin', placeholder: '4 位房间码', maxLength: 4, style: {textTransform: 'uppercase', letterSpacing: '6px', textAlign: 'center', fontWeight: 700}});
        box.append(h('div', {style: {textAlign: 'left'}}, h('div', {class: 'fld'}, h('label', {text: '你的名字'}), name)),
          h('div', {class: 'btns'}, h('button', {class: 'bx-btn red', id: 'bHost', text: '创建房间', on: {click: () => { BX.store.set('name', name.value.trim().slice(0, 10)); net.host(); }}})),
          h('div', {class: 'msg', style: {margin: '14px 0 6px'}, text: '或加入别人的房间'}), code,
          h('div', {class: 'btns'}, h('button', {class: 'bx-btn jade', id: 'bJoin', text: '加入', on: {click: () => { BX.store.set('name', name.value.trim().slice(0, 10)); net.join(code.value); }}})),
          net.status ? h('div', {class: 'msg', style: {marginTop: '10px', fontSize: '13px', color: 'var(--red)'}, text: net.status}) : null);
      }
    }
    document.addEventListener('bx-net', draw); draw();
    const sheet = h('div', {class: 'sheet', style: {width: 'min(400px,100%)'}}, box, h('button', {class: 'sheet-x', text: '✕', on: {click: close}}));
    ov = h('div', {class: 'ov', id: 'roomOv', on: {click: e => { if (e.target === ov) close(); }}}, sheet);
    ov._close = close; BX._modals.add(ov); const rm = ov.remove.bind(ov); ov.remove = () => { BX._modals.delete(ov); rm(); };
    $id('layer').append(ov);
  }
  document.addEventListener('bx-net', () => {
    if (!$id('lobby').hidden) { const L = $id('lobby'); const old = L.querySelector('.lb-head'); if (old) { render(); } }
    if (curSheet && curSheet.isConnected) curSheet._redraw();
  });

  function settings() {
    const name = h('input', {class: 'txt', value: BX.myName(), maxLength: 10});
    const body = h('div', {style: {textAlign: 'left'}},
      h('div', {class: 'fld'}, h('label', {text: '你的名字（联机时对方看到）'}), name),
      h('div', {class: 'fld'}, h('label', {text: '声音'}), h('div', {class: 'seg'}, h('button', {class: BX.sfx.muted ? '' : 'on', text: '开', on: {click: e => { BX.sfx.setMuted(false); e.target.classList.add('on'); e.target.nextSibling.classList.remove('on'); }}}), h('button', {class: BX.sfx.muted ? 'on' : '', text: '关', on: {click: e => { BX.sfx.setMuted(true); e.target.classList.add('on'); e.target.previousSibling.classList.remove('on'); }}}))),
      h('div', {class: 'fld'}, h('label', {text: '数据'}), h('div', {class: 'seg'}, h('button', {text: '清除战绩', on: {click: async () => { if (await BX.confirm('清除所有游戏的战绩和存档？', '清除')) { for (const k of Object.keys(localStorage)) if (k.startsWith('baixi.stats') || k.startsWith('baixi.resume.') || k.startsWith('baixi.g.')) localStorage.removeItem(k); BX.toast('已清除'); } }}}))));
    BX.modal({title: '设置', body, buttons: [{label: '保存', value: 1}], dismiss: 0}).then(v => {
      const nm = name.value.trim().slice(0, 10); if (nm) { BX.store.set('name', nm); BX.net.sendName(); } render();
    });
  }
  function suggested(def) {
    BX.sfx.play('bell');
    BX.modal({title: '对方的提议', html: `<b>${BX.esc((BX.net.other || {}).name || '对方')}</b> 想玩「${BX.esc(def.title)}」`, buttons: [{label: '稍后', value: 0, cls: 'ghost'}, {label: '打开', value: 1, cls: 'red'}], dismiss: 0}).then(v => { if (v && $id('game').hidden) openSheet(def); else if (v) BX.toast('先回到大厅再开局'); });
  }
  return {render, refresh: render, openSheet, roomModal, suggested, HUB};
})();
