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
  /* ---------- game start screen: shared TitleKit (shared/titlekit), the same one every game in the hub uses ----------
     main menu 继续上局 / 人机对战 / 同屏对战 / 联机对战 / 记录, second level 开局设置 (人数、电脑难度、先后手、玩法选项、辅助模式),
     联机 (创建 / 加入 the tea-house room) and 房间; top bar ‹ 茶馆 · 玩法 · 设置 · 声音. */
  let curKit = null, kitDef = null;
  const KM = {solo: 'ai', local: 'local', host: 'online'};
  function kitClose() { if (curKit) { const k = curKit; curKit = null; kitDef = null; k.destroy(); } }
  const kitSettings = () => [
    {group: '声音', key: 'snd', label: '声音', type: 'toggle', get: () => !BX.sfx.muted, set: v => BX.sfx.setMuted(!v)},
    {group: '操作', key: 'speed', label: '动画速度', type: 'seg', options: [{v: 1, label: '正常'}, {v: 2, label: '快速'}], get: () => BX.pref('speed'), set: v => BX.setPref('speed', v)},
    {key: 'confirm', label: '落子确认', type: 'seg', options: [{v: 'auto', label: '触屏点两下'}, {v: 'on', label: '总是'}, {v: 'off', label: '点一下'}], get: () => BX.pref('confirm'), set: v => BX.setPref('confirm', v)},
    {key: 'hints', label: '走法提示', sub: '能走的位置、上一步', type: 'toggle', get: () => !!BX.pref('hints'), set: v => BX.setPref('hints', v)},
    {key: 'vibrate', label: '震动反馈', type: 'toggle', get: () => !!BX.pref('vibrate'), set: v => BX.setPref('vibrate', v)},
    {key: 'assist', label: '辅助模式', sub: '局面提示、概率、更宽松的判定等；默认关（经典）', type: 'toggle', get: () => !!BX.pref('assist'), set: v => BX.setPref('assist', v)}
  ];
  const kitLogo = def => { const d = h('div', {style: {display: 'flex', flexDirection: 'column', alignItems: 'center'}}); const ic = iconCanvas(def, 132, 99); ic.style.borderRadius = '14px'; ic.style.boxShadow = '0 8px 24px rgba(0,0,0,.35)'; ic.style.marginBottom = '10px'; d.append(ic, h('div', {class: 'tk-t', text: def.title}), h('div', {class: 'tk-s', text: def.sub || ''})); return d; };
  const kitCommon = {escHub: true, theme: 'light', accent: '#b8322a', accentInk: '#fff6ee', font: '"Noto Serif SC","Songti SC",serif', bg: 'rgba(246,236,218,.86)', blur: 6, panel: 'rgba(255,251,243,.94)', z: 60, hub: true, hubLabel: '茶馆',
    sound: {get: () => !!BX.sfx.muted, set: v => BX.sfx.setMuted(v)}, settings: kitSettings, sfx: () => BX.sfx.play('tap')};
  function openSheet(def) {
    if (def.kind === 'solo' && def.resume === false && def.hint === false) { kitClose(); BX.closeModals(); BX.launch(def, {mode: def.modes[0], opts: {}, seed: BX.newSeed(), seats: BX.makeSeats(def, {mode: def.modes[0]}), sel: {mode: def.modes[0]}}); return; }   // embedded games bring their own start screen
    BX.closeModals(); kitClose();
    const saved = BX.store.get('sel.' + def.id, {}), net = BX.net, solo = def.kind === 'solo';
    const has = m => def.modes.includes(m);
    let kit;
    const cur = () => (kit ? kit.setup : {});
    const nOf = v => BX.clamp(+v.n || def.defSeats || def.seats[0], def.seats[0], def.seats[1]);
    const fields = () => {
      const F = [];
      if (!solo) {
        if (def.seats[1] > def.seats[0]) F.push({key: 'n', label: '人数', type: 'seg', def: BX.clamp(saved.n || def.defSeats || def.seats[0], def.seats[0], def.seats[1]), options: BX.range(def.seats[1] - def.seats[0] + 1).map(i => ({v: def.seats[0] + i, label: (def.seats[0] + i) + ' 人'}))});
        F.push({key: 'humans', label: '本机玩家', type: 'seg', modes: ['local'], def: saved.humans || 2, when: (m, v) => nOf(v) > 2, options: () => BX.range(nOf(cur()) - 1).map(i => ({v: i + 2, label: (i + 2) + ' 人' + (i + 2 < nOf(cur()) ? '（其余电脑）' : '')}))});
        if (def.aiLevels !== false) F.push({key: 'level', label: '电脑难度', type: 'seg', def: saved.level || 2, options: [{v: 1, label: '初级'}, {v: 2, label: '中级'}, {v: 3, label: '高级'}],
          when: (m, v) => m === 'solo' || (m === 'local' && BX.clamp(+v.humans || 2, 2, nOf(v)) < nOf(v)) || (m === 'host' && nOf(v) > 2)});
        if (!def.noFirst) F.push({key: 'first', label: def.firstLabel || '先后手', type: 'seg', def: saved.first || 'me', modes: ['solo', 'host'],
          options: () => nOf(cur()) > 2 ? [{v: 'me', label: '我坐首位'}, {v: 'rand', label: '随机'}] : [{v: 'me', label: '我先'}, {v: 'other', label: '对方先'}, {v: 'rand', label: '随机'}]});
        if (!def.noFirst && def.seats[1] > 2) F.push({key: 'lfirst', label: '座位', type: 'seg', def: saved.first === 'rand' ? 'rand' : 'me', modes: ['local'], options: [{v: 'me', label: '按顺序'}, {v: 'rand', label: '随机'}]});
      }
      for (const o of def.options || []) F.push({key: 'o_' + o.key, label: o.label, type: 'seg', def: o.choices.some(c => c[0] === (saved.opts || {})[o.key]) ? saved.opts[o.key] : o.def,
        modes: o.modes ? Object.keys(KM).filter(k => o.modes.includes(KM[k])) : undefined, options: o.choices.map(c => ({v: c[0], label: c[1]}))});
      F.push({key: 'assist', label: '辅助模式', type: 'seg', def: !!BX.pref('assist'), options: [{v: false, label: '关 · 经典'}, {v: true, label: '开', sub: '局面提示、概率等'}]});
      if (has('local') && def.hidden) F.push({type: 'note', modes: ['local'], text: '同屏对战时有隐藏信息，轮到谁时会提示把设备交给谁。'});
      return F;
    };
    const selOf = (mode, s) => { const n = solo ? def.seats[0] : nOf(s); const sel = {mode, n, humans: BX.clamp(+s.humans || 2, 2, n), first: mode === 'local' ? (s.lfirst || 'me') : (s.first || 'me'), level: +s.level || 2, opts: {}};
      for (const o of def.options || []) sel.opts[o.key] = s['o_' + o.key] !== undefined ? s['o_' + o.key] : o.def; return sel; };
    const remember = sel => BX.store.set('sel.' + def.id, sel);
    const launch = (mode, s) => { const sel = selOf(mode, s); remember(sel); BX.setPref('assist', !!s.assist); kitClose();
      const s2 = {mode, n: sel.n, humans: sel.humans, first: sel.first, level: sel.level};
      BX.launch(def, {mode, opts: Object.assign({}, sel.opts), seed: BX.newSeed(), seats: BX.makeSeats(def, s2), sel: s2}); };
    let pending = null;
    const startOnline = s => { const sel = selOf('online', s); remember(sel); BX.setPref('assist', !!s.assist); kitClose(); BX.startOnline(def, sel.opts, {n: sel.n, first: sel.first, level: sel.level}); };
    const st = BX.store.get('stats', {})[def.id];
    const netUp = net.up, online = has('online') && !BX.ARTIFACT;
    const extra = [];
    if (online && netUp) extra.push(net.isGuest ? {id: 'sug', icon: 'net', label: '联机对战', sub: '与 ' + net.other.name + ' 同桌 · 由房主开局，点这里提议', chev: false, run: () => { net.send({t: 'suggest', id: def.id}); kit.toast('已告诉房主，等他开这一局'); }}
      : {id: 'on', icon: 'net', label: '联机对战', sub: '与 ' + net.other.name + ' 同桌', run: () => kit.startMode('host')});
    kit = curKit = TitleKit.create(Object.assign({}, kitCommon, {
      id: 'baixi-' + def.id, title: def.title, logo: kitLogo(def), onHub: () => kitClose(),
      solo: solo ? {label: '开始游戏', sub: def.desc ? '' : ''} : has('ai') ? {label: BX.MODE_NAMES.ai || '人机对战', sub: '和电脑下' + (def.aiLevels !== false ? ' · 三档难度' : '')} : false,
      local: has('local') ? {label: BX.MODE_NAMES.local || '同屏对战', sub: '一台设备，轮流操作'} : false,
      online: online && !netUp ? {label: BX.MODE_NAMES.online || '联机对战', sub: '创建房间 · 用房间码加入', hostText: '你当房主，开局设置由你决定。房间建好后，在这里点「开局」。', joinText: '输入对方的房间码。进了房间由房主开局，你可以提议玩哪个。'} : false,
      extra: () => extra,
      setup: {fields, start: '开始', hostStart: () => (net.up && net.isHost ? '开局' : '创建房间')},
      saves: {label: '继续上局', slots: 1, continue: true, menu: false,
        list: () => { const r = BX.getResume(def.id); return r && r.log && r.log.length && r.mode !== 'online' ? [{slot: 1, title: (BX.MODE_NAMES[r.mode] || '') + ' · 已走 ' + r.log.length + ' 步', detail: r.assist ? '辅助模式' : '经典', time: r.at || r.t || 0}] : []; },
        load: () => { const r = BX.getResume(def.id); if (!r) return; kitClose(); BX.launch(def, {mode: r.mode, opts: r.opts, seed: r.seed, seats: r.seats, sel: r.sel, log: r.log, assist: !!r.assist}); }},
      nick: {get: () => BX.myName(), set: v => { if (v) { BX.store.set('name', v.slice(0, 10)); BX.net.sendName && BX.net.sendName(); } }},
      records: st && st.n ? () => solo ? [['已玩', st.n + ' 局']] : [['已玩', st.n + ' 局'], ['胜', st.w || 0], ['负', st.l || 0]].concat(st.d ? [['和', st.d]] : []) : null,
      recordsSub: () => st && st.n ? (solo ? '已玩 ' + st.n + ' 局' : '已玩 ' + st.n + ' 局 · 胜 ' + (st.w || 0) + ' · 负 ' + (st.l || 0)) : '',
      howto: () => (def.howto && def.howto.length ? '<h4>操作</h4><ul>' + def.howto.map(x => '<li>' + BX.esc(x) + '</li>').join('') + '</ul>' : '') + '<h4>规则</h4>' + (def.rules || '暂无说明'),
      foot: def.desc || '',
      start: ({mode, setup}) => launch(solo ? def.modes[0] : KM[mode], setup),
      host: ({setup}) => { if (net.up && net.isHost) { startOnline(setup); return; } pending = setup; net.host(); kitRoom(); },
      join: ({code}) => { net.join(code); kitRoom(); },
      leaveRoom: () => net.leave(),
      roomAction: a => { if (a === 'go' && pending) startOnline(pending); else if (a === 'go') kit.startMode('host'); else if (a === 'sug') { net.send({t: 'suggest', id: def.id}); kit.toast('已告诉房主'); } }
    }));
    kitDef = def;
    kit._room = () => {
      if (!net.role) { if (kit.screen === 'room') kit.roomFail(net.status || '已离开房间'); return; }
      const host = net.role === 'host', other = net.other;
      kit.room({host, code: net.code || '', status: net.status || (other ? (host ? '对方已进茶馆，可以开局了' : '等房主开局') : host ? '把房间码发给对方' : ''),
        players: [{name: BX.myName(), sub: host ? '房主' : '客人', me: true}, other ? {name: other.name, sub: host ? '客人' : '房主', color: '#2f7d6b'} : {empty: true, name: '等对方加入'}],
        actions: other ? (host ? [{id: 'go', label: '开局 · ' + def.title}] : [{id: 'sug', label: '提议房主开这局'}]) : []});
    };
    function kitRoom() { if (kit === curKit) kit._room(); }
    curSheet = {isConnected: true, _redraw: () => {}};
  }
  let curSheet = null;
  document.addEventListener('bx-net', () => { if (curKit && curKit.visible && curKit.screen === 'room' && curKit._room) curKit._room(); });
  const closeModals0 = BX.closeModals; BX.closeModals = function () { kitClose(); return closeModals0.apply(this, arguments); };

  /* ---------- tea-house room (⇄ 联机 in the lobby header): the same TitleKit 联机 / 房间 screens ---------- */
  function roomModal() {
    BX.closeModals(); kitClose();
    const net = BX.net; let kit;
    kit = curKit = TitleKit.create(Object.assign({}, kitCommon, {
      id: 'baixi-room', title: '联机房间', hidden: true, onHub: () => kitClose(),
      logo: '<div class="tk-t">联机房间</div><div class="tk-s">同一个房间里可以连着玩所有游戏</div>',
      solo: false, local: false,
      online: {label: '联机', hostText: '你当房主：建好房间后，打开任意游戏，选「联机对战」开局。', joinText: '输入对方的房间码。进房间后等房主开局，也可以在游戏里提议。'},
      nick: {get: () => BX.myName(), set: v => { if (v) { BX.store.set('name', v.slice(0, 10)); BX.net.sendName && BX.net.sendName(); } }},
      host: () => { net.host(); kit._room(); }, join: ({code}) => { net.join(code); kit._room(); },
      leaveRoom: () => net.leave(), roomAction: a => { if (a === 'pick') kitClose(); },
      onScreen: s => { if (s === 'main') kitClose(); }
    }));
    kit._room = () => {
      if (!net.role) { if (kit.screen === 'room') kit.roomFail(net.status || '已离开房间'); return; }
      const host = net.role === 'host', other = net.other;
      kit.room({host, code: net.code || '', status: net.status || (other ? (host ? '打开任意游戏，选「联机对战」开局' : '等房主开局；也可以在游戏里点「提议」') : host ? '把房间码发给对方' : ''),
        players: [{name: BX.myName(), sub: host ? '房主' : '客人', me: true}, other ? {name: other.name, sub: host ? '客人' : '房主', color: '#2f7d6b'} : {empty: true, name: '等对方加入'}],
        actions: other ? [{id: 'pick', label: '去选游戏'}] : []});
    };
    kit.show(net.role ? 'room' : 'online'); if (net.role) kit._room();
  }
  document.addEventListener('bx-net', () => {
    if (!$id('lobby').hidden) { const L = $id('lobby'); const old = L.querySelector('.lb-head'); if (old) { render(); } }
    if (curSheet && curSheet.isConnected) curSheet._redraw();
  });

  function settings() {
    const name = h('input', {class: 'txt', value: BX.myName(), maxLength: 10});
    const body = h('div', {style: {textAlign: 'left'}},
      h('div', {class: 'fld'}, h('label', {text: '你的名字（联机时对方看到）'}), name),
      h('div', {class: 'fld'}, h('label', {text: '游戏设置（所有游戏通用，游戏内「⋯」菜单也能改）'}), h('div', {class: 'mlist'}, BX.prefRows())),
      h('div', {class: 'fld'}, h('label', {text: '新手指引'}), h('div', {class: 'seg'}, h('button', {text: '重新显示各游戏的操作说明', on: {click: e => { for (const k of Object.keys(localStorage)) if (k.startsWith('baixi.seen.')) localStorage.removeItem(k); e.target.textContent = '已重置'; }}}))),
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
