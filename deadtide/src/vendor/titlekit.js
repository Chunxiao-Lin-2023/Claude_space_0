/* TitleKit v1 — one start screen for every game in the Claude_space_0 hub.
   Canonical copy: shared/titlekit/  (README.md there documents the API; sync.py copies it into each <game>/src/vendor/).

   Main menu (always the same order; rows a game does not support are left out):
     继续 (newest save) · 新游戏 / 单人 · 双人同屏 · 联机 · 存档 · 记录      + top bar: ‹ 游戏厅 · 设置 · 玩法 · 音效
   Second-level screens: 开局设置 (game-specific options) · 联机 (创建房间 / 加入房间) · 房间 (code, players, ready/start)
     · 存档 (slots: 读取 / 导出 / 删除, 导入) · 设置 · 玩法 · 记录.
*/
(function () {
  'use strict';
  const ICON = {
    play: '<path d="M7 5l12 7-12 7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    duo: '<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9" r="3"/><path d="M2.5 19c.6-3 3-4.6 5.5-4.6s4.9 1.6 5.5 4.6M11.5 15.2c1.2-.5 2.7-.8 5-.8 2.6 0 4.6 1.6 5 4.6"/>',
    net: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.7 3.8 9S14.6 18.4 12 21M12 3C9.4 5.6 8.2 8.7 8.2 12s1.2 6.4 3.8 9"/>',
    save: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H15l5 5v8.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M8 4v5h7M8 20v-6h8v6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 5 4 5M16 6h3.5c0 3-1.5 5-4 5M12 13v4M8.5 20h7M10 17h4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.3-2.5 4M12 17.3v.1"/>',
    snd: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    chev: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
    home: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>'
  };
  const svg = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICON[k] || '') + '</svg>';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CODE_RE = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g;
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  function when(t) {
    if (!t) return '';
    const d = new Date(t), now = new Date(), p = n => String(n).padStart(2, '0');
    const s = (now - d) / 1000;
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
    const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const dd = Math.round((day(now) - day(d)) / 864e5);
    const hm = p(d.getHours()) + ':' + p(d.getMinutes());
    if (dd === 0) return '今天 ' + hm;
    if (dd === 1) return '昨天 ' + hm;
    if (d.getFullYear() === now.getFullYear()) return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm;
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }
  function copyText(t) {
    try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, () => fallback()); } catch (e) { }
    return Promise.resolve(fallback());
    function fallback() {
      try { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
    }
  }

  function create(cfg) {
    cfg = Object.assign({ theme: 'dark', newLabel: '新游戏', online: false, local: false, solo: true }, cfg);
    const id = cfg.id || 'game';
    const K = k => id + '.tk.' + k;
    const T = {}; // public api
    let scr = 'main', stack = [], setupMode = 'solo', setupVals = Object.assign({}, ls.get(K('setup'), {})), room = null, visible = true, toastT = 0;
    let invited = false, armed = null, armT = 0, joinCode = '', importOpen = false, focusIdx = -1, lastSaves = null, exportShown = null;

    // ---------- root ----------
    const root = document.createElement('div');
    root.className = 'tk-root' + (cfg.theme === 'light' ? ' tk-light' : '') + (cfg.shade === false ? ' tk-noshade' : '');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', cfg.title || '');
    if (cfg.accent) root.style.setProperty('--tk-accent', cfg.accent);
    if (cfg.accentInk) root.style.setProperty('--tk-ink-on', cfg.accentInk);
    if (cfg.font) root.style.setProperty('--tk-font', cfg.font);
    if (cfg.ui) root.style.setProperty('--tk-ui', cfg.ui);
    if (cfg.panel) root.style.setProperty('--tk-panel', cfg.panel);
    if (cfg.z) root.style.zIndex = cfg.z;
    if (cfg.vars) for (const k in cfg.vars) root.style.setProperty(k, cfg.vars[k]);
    root.innerHTML = '<div class="tk-shade"></div><div class="tk-top"></div><div class="tk-body"><div class="tk-logo"></div><div class="tk-card"></div></div><div class="tk-toast"></div>';
    const $top = root.querySelector('.tk-top'), $body = root.querySelector('.tk-body'), $logo = root.querySelector('.tk-logo'), $card = root.querySelector('.tk-card'), $toast = root.querySelector('.tk-toast');
    if (cfg.logo && cfg.logo.nodeType) $logo.appendChild(cfg.logo);
    else if (cfg.logo) $logo.innerHTML = cfg.logo;
    else $logo.innerHTML = '<div class="tk-t">' + esc(cfg.title || '') + '</div>' + (cfg.sub ? '<div class="tk-s">' + esc(cfg.sub) + '</div>' : '');
    (cfg.parent || document.body).appendChild(root);

    // ---------- helpers ----------
    const call = (fn, ...a) => { try { return typeof fn === 'function' ? fn(...a) : undefined; } catch (e) { console.error('[TitleKit]', e); T.toast('出错了：' + (e && e.message || e)); } };
    const val = v => typeof v === 'function' ? call(v) : v;
    const onlineOK = () => !!cfg.online && !cfg.artifact;
    const fields = () => (val(cfg.setup && cfg.setup.fields) || []).filter(f => !f.when || f.when(setupMode, setupVals));
    const hasSetup = mode => fields().some(f => f.type !== 'note' && (mode !== 'host' || f.host !== false) && (!f.modes || f.modes.indexOf(mode) >= 0));
    T.nick = () => { const g = cfg.nick && cfg.nick.get ? call(cfg.nick.get) : null; return (g || ls.get('hub.nick', '') || '').slice(0, 12); };
    function setNick(v) { v = String(v || '').trim().slice(0, 12); ls.set('hub.nick', v); if (cfg.nick && cfg.nick.set) call(cfg.nick.set, v); }
    function defaults() { for (const f of fields()) if (f.key && setupVals[f.key] === undefined && f.def !== undefined) setupVals[f.key] = val(f.def); }
    function saves() { if (!cfg.saves) return []; const l = call(cfg.saves.list) || []; lastSaves = l; return l; }
    function latest(l) { let b = null; for (const s of l) if (!s.empty && s.time && (!b || s.time > b.time)) b = s; if (!b) b = l.find(s => !s.empty && s.canLoad !== false) || null; return b; }
    function btn(o) {
      return '<button class="tk-btn' + (o.primary ? ' tk-primary' : '') + (o.cls ? ' ' + o.cls : '') + '" data-a="' + o.a + '"' + (o.arg != null ? ' data-arg="' + esc(o.arg) + '"' : '') + (o.dis ? ' disabled' : '') + '>' +
        (o.icon ? svg(o.icon) : '') + '<span class="tk-l"><b>' + esc(o.label) + '</b>' + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span>' + (o.chev ? '<span class="tk-chev">' + svg('chev') + '</span>' : '') + '</button>';
    }
    const head = title => '<div class="tk-hd"><button class="tk-back" data-a="back">' + svg('back') + '返回</button><h2>' + esc(title) + '</h2></div>';
    function arm(key, el, fn) {
      if (armed === key && Date.now() - armT < 3000) { armed = null; fn(); return; }
      armed = key; armT = Date.now();
      if (el) { el.classList.add('tk-armed'); el.dataset.lbl = el.dataset.lbl || el.innerHTML; el.textContent = '再点一次确认'; setTimeout(() => { if (armed === key) { armed = null; } if (el.isConnected && el.dataset.lbl) { el.innerHTML = el.dataset.lbl; el.classList.remove('tk-armed'); } }, 3000); }
    }

    // ---------- top bar ----------
    function renderTop() {
      let h = '';
      if (cfg.hub && cfg.hubBack !== false) h += '<button class="tk-pill" data-a="hub">' + svg('home') + '游戏厅</button>';
      if (cfg.topLeft) h += cfg.topLeft;
      h += '<span class="tk-sp"></span>';
      if (cfg.topRight) h += cfg.topRight;
      if (cfg.sound) { const m = !!call(cfg.sound.get); h += '<button class="tk-pill tk-ico" data-a="snd" title="' + (m ? '已静音' : '音效开') + '" aria-label="音效">' + svg(m ? 'mute' : 'snd') + '</button>'; }
      if (cfg.howto) h += '<button class="tk-pill tk-ico" data-a="go" data-arg="howto" title="玩法说明" aria-label="玩法说明">' + svg('help') + '</button>';
      if (cfg.settings) h += '<button class="tk-pill tk-ico" data-a="go" data-arg="settings" title="设置" aria-label="设置">' + svg('gear') + '</button>';
      $top.innerHTML = h;
    }

    // ---------- screens ----------
    const SCR = {};
    SCR.main = () => {
      const l = saves(), last = cfg.saves && cfg.saves.continue !== false ? latest(l) : null;
      const used = l.filter(s => !s.empty).length;
      let h = '';
      if (cfg.mainTop) h += val(cfg.mainTop) || '';
      if (last) h += btn({ a: 'continue', icon: 'play', label: cfg.continueLabel || '继续', sub: [last.title, when(last.time)].filter(Boolean).join(' · '), primary: true });
      if (cfg.solo) { const s = typeof cfg.solo === 'object' ? cfg.solo : {}; h += btn({ a: 'new', arg: 'solo', icon: last ? 'plus' : 'play', label: s.label || cfg.newLabel, sub: s.sub, primary: !last, chev: hasSetup('solo') }); }
      if (cfg.local) { const s = typeof cfg.local === 'object' ? cfg.local : {}; h += btn({ a: 'new', arg: 'local', icon: 'duo', label: s.label || '双人同屏', sub: s.sub || '一台设备，两人一起玩', chev: hasSetup('local') }); }
      if (cfg.online) {
        const s = typeof cfg.online === 'object' ? cfg.online : {};
        h += btn({ a: 'go', arg: 'online', icon: 'net', label: s.label || '联机', sub: cfg.artifact ? '这里是单人版，联机请打开游戏厅网页版' : (s.sub || '创建房间 · 用房间码加入'), dis: !onlineOK(), chev: true, primary: !cfg.solo && !last });
      }
      if (cfg.saves) h += btn({ a: 'go', arg: 'saves', icon: 'save', label: cfg.saves.label || '存档', sub: (cfg.saves.slots ? cfg.saves.slots + ' 个位置 · ' : '') + (used ? '已用 ' + used : '还没有存档'), chev: true });
      if (cfg.records) h += btn({ a: 'go', arg: 'records', icon: 'trophy', label: cfg.recordsLabel || '记录', sub: val(cfg.recordsSub) || '', chev: true });
      if (cfg.extra) for (const x of val(cfg.extra) || []) h += btn({ a: 'extra', arg: x.id, icon: x.icon || 'doc', label: x.label, sub: x.sub, chev: x.chev !== false });
      const foot = val(cfg.foot);
      const ft = foot != null ? foot : (cfg.saves ? '存档保存在这台设备的浏览器里' : '');
      if (ft || cfg.version) h += '<div class="tk-foot"><span>' + esc(ft) + '</span><span>' + esc(cfg.version || '') + '</span></div>';
      return h;
    };
    SCR.setup = () => {
      defaults();
      const m = setupMode, host = m === 'host', s = cfg.setup || {};
      let h = head(s.title || (host ? '房间设置' : '开局设置'));
      h += renderFields(fields().filter(f => (!f.modes || f.modes.indexOf(m) >= 0) && (!host || f.host !== false)), false);
      const lbl = host ? '创建房间' : (m === 'local' ? (s.localStart || '开始') : (s.start || '开始'));
      h += '<div class="tk-sep"></div>' + btn({ a: 'go-start', label: lbl, primary: true, icon: host ? 'net' : 'play' });
      return h;
    };
    function renderFields(list, ro, vals) {
      vals = vals || setupVals;
      let h = '';
      for (const f of list) {
        const v = vals[f.key];
        if (f.type === 'note') { h += '<div class="tk-note">' + (val(f.html) || esc(val(f.text))) + '</div>'; continue; }
        if (f.type === 'group') { h += '<div class="tk-group">' + esc(f.label) + '</div>'; continue; }
        if (f.type === 'node') { h += '<div class="tk-f">' + (f.label ? '<label>' + esc(f.label) + '</label>' : '') + '<div class="tk-node" data-node="' + esc(f.key) + '"></div></div>'; continue; }
        const opts = val(f.options) || [];
        const sub = opts.find(o => o.v === v);
        h += '<div class="tk-f"><label><span>' + esc(f.label || '') + '</span><i>' + esc(f.hint ? val(f.hint) : (sub && sub.hint) || '') + '</i></label>';
        if (f.type === 'toggle') h += '<div class="tk-tog"><span>' + esc(f.text || '') + '</span><button class="tk-sw' + (v ? ' tk-on' : '') + '" data-a="f-tog" data-arg="' + esc(f.key) + '" role="switch" aria-checked="' + !!v + '"' + (ro ? ' disabled' : '') + '></button></div>';
        else if (f.type === 'text') h += '<input class="tk-in" data-f="' + esc(f.key) + '" maxlength="' + (f.max || 16) + '" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(v || '') + '"' + (ro ? ' disabled' : '') + '>';
        else if (f.type === 'cards') h += '<div class="tk-cards' + (ro ? ' tk-ro' : '') + '">' + opts.map(o => '<button class="' + (o.v === v ? 'tk-on' : '') + '" data-a="f-set" data-arg="' + esc(f.key) + '" data-v="' + esc(JSON.stringify(o.v)) + '"' + (ro ? ' disabled' : '') + '><b>' + (o.icon ? o.icon + ' ' : '') + esc(o.label) + '</b>' + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</button>').join('') + '</div>';
        else h += '<div class="tk-seg' + (ro ? ' tk-ro' : '') + '">' + opts.map(o => '<button class="' + (o.v === v ? 'tk-on' : '') + '" data-a="f-set" data-arg="' + esc(f.key) + '" data-v="' + esc(JSON.stringify(o.v)) + '">' + (o.icon ? o.icon + ' ' : '') + esc(o.label) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</button>').join('') + '</div>';
        if (f.note) h += '<div class="tk-note">' + esc(val(f.note)) + '</div>';
        h += '</div>';
      }
      return h;
    }
    SCR.online = () => {
      const s = typeof cfg.online === 'object' ? cfg.online : {};
      let h = head(s.title || '联机');
      if (s.nick !== false) h += '<div class="tk-f"><label><span>昵称</span><i>对方会看到这个名字</i></label><input class="tk-in" data-a="nick" maxlength="12" placeholder="' + esc(s.nickPlaceholder || '给自己起个名字') + '" value="' + esc(T.nick()) + '"></div>';
      h += '<div class="tk-two">';
      h += '<div class="tk-box"><h3>创建房间</h3><p>' + esc(s.hostText || '你当房主，开局设置由你决定。把 4 位房间码或邀请链接发给朋友。') + '</p>' + btn({ a: 'host', label: '创建房间', primary: true, icon: 'plus', cls: 'tk-sm' }) + '</div>';
      h += '<div class="tk-box"><h3>加入房间</h3><p>' + esc(s.joinText || '输入朋友发来的房间码。') + '</p><input class="tk-in tk-code" data-a="code" maxlength="4" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="····" value="' + esc(joinCode) + '">' + btn({ a: 'join', label: '加入', icon: 'link', cls: 'tk-sm', dis: joinCode.length !== 4 }) + '</div>';
      h += '</div>';
      const rc = ls.get(K('recent'), null);
      if (rc && rc.code && Date.now() - rc.t < 3 * 3600e3 && rc.code !== joinCode) h += '<div class="tk-note">最近加入过 <button class="tk-mini" data-a="recent">' + esc(rc.code) + '</button></div>';
      if (s.note) h += '<div class="tk-note">' + esc(val(s.note)) + '</div>';
      return h;
    };
    SCR.room = () => {
      const r = room || {};
      let h = head(r.title || (r.host ? '我的房间' : '房间'));
      if (r.code) {
        h += '<div class="tk-lbl" style="justify-content:center">' + (r.host ? '房间码 · 发给朋友' : '房间码') + '</div><div class="tk-roomcode">' + esc(r.code) + '</div>';
        if (r.host) h += '<div class="tk-row"><button class="tk-mini" data-a="copy-code">' + svg('copy') + '复制房间码</button><button class="tk-mini" data-a="copy-link">' + svg('link') + '复制邀请链接</button></div>';
      } else h += '<div class="tk-roomcode tk-dots" style="letter-spacing:.2em"><i>·</i><i>·</i><i>·</i></div>';
      const pl = r.players || [];
      if (pl.length) {
        h += '<div class="tk-players">';
        pl.forEach((p, i) => {
          if (p.empty) h += '<div class="tk-pl tk-empty"><span class="tk-av">' + (i + 1) + '</span><span class="tk-nm">' + esc(p.name || '等待加入') + '<span class="tk-dots"><i>.</i><i>.</i><i>.</i></span>' + (p.sub ? '<small>' + esc(p.sub) + '</small>' : '') + '</span></div>';
          else h += '<div class="tk-pl"><span class="tk-av"' + (p.color ? ' style="background:' + esc(p.color) + '"' : '') + '>' + esc((p.name || '?').slice(0, 1)) + '</span><span class="tk-nm">' + esc(p.name || '') + (p.me ? '（你）' : '') + (p.sub ? '<small>' + esc(p.sub) + '</small>' : '') + '</span>' + (p.tag ? '<span class="tk-tag' + (p.ok ? ' tk-ok' : '') + '">' + esc(p.tag) + '</span>' : '') + '</div>';
        });
        h += '</div>';
      }
      const rf = (r.fields || []).length ? r.fields : null;
      if (rf) h += renderRoomFields(rf, r);
      if (r.html) h += '<div class="tk-note">' + r.html + '</div>';
      h += '<div class="tk-status' + (r.error ? ' tk-err' : '') + '">' + esc(r.error || r.status || '') + '</div>';
      const bs = [];
      if (r.readyBtn) bs.push(btn({ a: 'r-ready', label: r.ready ? '取消准备' : '准备', cls: 'tk-sm', primary: !r.ready }));
      if (r.startBtn) bs.push(btn({ a: 'r-start', label: r.startLabel || '开始', cls: 'tk-sm', primary: true, dis: !r.canStart }));
      if (bs.length) h += '<div class="tk-row">' + bs.join('') + '</div>';
      h += btn({ a: 'r-leave', label: r.leaveLabel || '离开房间', cls: 'tk-sm' });
      return h;
    };
    function renderRoomFields(list, r) {
      let h = '';
      for (const f of list) {
        const ro = f.ro != null ? f.ro : (!r.host && f.each !== true);
        h += renderFields([f], ro, r.values || {}).replace(/data-a="f-set"/g, 'data-a="rf-set"').replace(/data-a="f-tog"/g, 'data-a="rf-tog"');
      }
      return h;
    }
    SCR.saves = () => {
      const l = saves(), last = latest(l), sv = cfg.saves;
      let h = head(sv.label || '存档');
      h += '<div class="tk-saves">';
      for (const s of l) {
        const no = s.no != null ? s.no : (s.slot != null ? s.slot : '');
        if (s.empty) { h += '<div class="tk-sv tk-emptyslot"><span class="tk-no">' + esc(no) + '</span><span class="tk-l"><b>' + esc(s.title || '空位') + '</b>' + (s.detail ? '<small>' + esc(s.detail) + '</small>' : '') + '</span>' + (sv.newInSlot ? '<button class="tk-mini" data-a="s-new" data-arg="' + esc(s.slot) + '">' + svg('plus') + '新建</button>' : '') + '</div>'; continue; }
        h += '<div class="tk-sv' + (s === last ? ' tk-latest' : '') + '"><span class="tk-no">' + esc(no) + '</span><span class="tk-l"><b>' + esc(s.title || '存档') + '</b><small>' + esc([s.detail, when(s.time)].filter(Boolean).join(' · ')) + '</small></span>';
        if (s.canLoad !== false) h += '<button class="tk-mini tk-primary" data-a="s-load" data-arg="' + esc(s.slot) + '">读取</button>';
        if (sv.export) h += '<button class="tk-mini" data-a="s-exp" data-arg="' + esc(s.slot) + '" title="导出存档码">导出</button>';
        if (sv.remove) h += '<button class="tk-mini" data-a="s-del" data-arg="' + esc(s.slot) + '" title="删除">删除</button>';
        h += '</div>';
        if (exportShown && String(exportShown.slot) === String(s.slot)) h += '<textarea class="tk-ta" readonly data-sel>' + esc(exportShown.text) + '</textarea><div class="tk-row"><button class="tk-mini" data-a="s-copy">' + svg('copy') + '复制</button><button class="tk-mini" data-a="s-file">下载文件</button></div>';
      }
      if (!l.length) h += '<div class="tk-note">还没有存档。</div>';
      h += '</div>';
      if (sv.import) {
        if (importOpen) h += '<div class="tk-f"><label>粘贴存档码<i>或选择存档文件</i></label><textarea class="tk-ta" data-imp placeholder="把导出的存档码粘贴到这里"></textarea><div class="tk-row"><button class="tk-mini tk-primary" data-a="s-imp-go">导入</button><button class="tk-mini" data-a="s-imp-file">选择文件…</button><button class="tk-mini" data-a="s-imp-x">取消</button></div></div>';
        else h += btn({ a: 's-imp', label: '导入存档', icon: 'plus', cls: 'tk-sm' });
      }
      h += '<div class="tk-note">' + esc(sv.note || '存档保存在这台设备的浏览器里；换设备或清理浏览器前，可以先导出存档码备份。') + '</div>';
      return h;
    };
    SCR.settings = () => {
      let h = head('设置'), g = null;
      for (const r of val(cfg.settings) || []) {
        if (r.group && r.group !== g) { g = r.group; h += '<div class="tk-group">' + esc(g) + '</div>'; }
        const v = call(r.get);
        if (r.type === 'toggle') h += '<div class="tk-tog"><span>' + esc(r.label) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span><button class="tk-sw' + (v ? ' tk-on' : '') + '" data-a="set-tog" data-arg="' + esc(r.key) + '" role="switch" aria-checked="' + !!v + '"></button></div>';
        else if (r.type === 'range') h += '<div class="tk-tog"><span>' + esc(r.label) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span><input type="range" class="tk-range" data-set="' + esc(r.key) + '" min="' + (r.min || 0) + '" max="' + (r.max != null ? r.max : 1) + '" step="' + (r.step || 0.05) + '" value="' + v + '"></div>';
        else if (r.type === 'button') h += btn({ a: 'set-btn', arg: r.key, label: r.label, sub: r.sub, cls: 'tk-sm' + (r.danger ? ' tk-danger' : '') });
        else if (r.type === 'note') h += '<div class="tk-note">' + esc(val(r.text)) + '</div>';
        else h += '<div class="tk-f"><label><span>' + esc(r.label) + '</span><i>' + esc(r.sub || '') + '</i></label><div class="tk-seg">' + (val(r.options) || []).map(o => '<button class="' + (o.v === v ? 'tk-on' : '') + '" data-a="set-seg" data-arg="' + esc(r.key) + '" data-v="' + esc(JSON.stringify(o.v)) + '">' + esc(o.label) + '</button>').join('') + '</div></div>';
      }
      return h;
    };
    SCR.howto = () => head(cfg.howtoTitle || '玩法说明') + '<div class="tk-howto">' + (val(cfg.howto) || '') + '</div>';
    SCR.records = () => {
      const r = val(cfg.records) || [];
      let h = head(cfg.recordsLabel || '记录');
      if (Array.isArray(r)) h += r.length ? '<div class="tk-recs">' + r.map(x => '<div class="tk-rec"><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b></div>').join('') + '</div>' : '<div class="tk-note">还没有记录，先去玩一局吧。</div>';
      else h += r;
      return h;
    };
    SCR.custom = () => { const c = T._custom || {}; return head(c.title || '') + (val(c.html) || ''); };

    const WIDE = { setup: 1, online: 1, room: 0, saves: 1, settings: 0, howto: 1, records: 0, custom: 1 };
    function render(keepScroll) {
      if (!visible) return;
      const st = keepScroll ? $card.scrollTop : 0;
      const fn = SCR[scr] || SCR.main;
      $card.className = 'tk-card' + (WIDE[scr] ? ((scr === 'setup' && cfg.setup && cfg.setup.wide) || (scr === 'custom' && T._custom && T._custom.wide) ? ' tk-xwide' : ' tk-wide') : '');
      $body.classList.toggle('tk-sub', scr !== 'main');
      $card.innerHTML = fn();
      // re-mount game-provided nodes (setup fields of type 'node')
      $card.querySelectorAll('[data-node]').forEach(h => { const f = fields().find(x => x.key === h.dataset.node); const n = f && val(f.node); if (n && n.nodeType) { h.appendChild(n); if (f.mount) call(f.mount, n, setupMode); } });
      if (room && scr === 'room' && room.node && room.node.nodeType) $card.insertBefore(room.node, $card.querySelector('.tk-status'));
      $card.scrollTop = st;
      renderTop();
      if (!keepScroll) { $card.style.animation = 'none'; void $card.offsetWidth; $card.style.animation = ''; }
      const ta = $card.querySelector('[data-sel]'); if (ta) { ta.focus(); ta.select(); }
      if (scr === 'online' && !keepScroll) { const c = $card.querySelector('[data-a=code]'); if (c && joinCode && !matchMedia('(pointer:coarse)').matches) c.focus(); }
      focusIdx = -1;
      call(cfg.onScreen, scr);
    }
    function go(s, push = true) { if (push && s !== scr) stack.push(scr); scr = s; exportShown = null; importOpen = false; render(); }
    function back() {
      if (scr === 'room') { leaveRoom(); return; }
      scr = stack.pop() || 'main'; if (scr === 'room' && !room) scr = stack.pop() || 'main'; exportShown = null; importOpen = false; render();
    }
    function leaveRoom() { const r = room; room = null; if (r) call(cfg.leaveRoom); stack = stack.filter(s => s !== 'room' && s !== 'setup'); scr = onlineOK() ? 'online' : 'main'; if (!stack.length || stack[stack.length - 1] !== 'main') stack = ['main']; render(); }
    function persistSetup() { ls.set(K('setup'), setupVals); }

    function startNew(mode) {
      setupMode = mode;
      if (hasSetup(mode)) { go('setup'); return; }
      doStart();
    }
    function doStart() {
      defaults(); persistSetup();
      if (setupMode === 'host') { hostRoom(); return; }
      call(cfg.start, { mode: setupMode, setup: Object.assign({}, setupVals), nick: T.nick() });
    }
    function hostRoom() {
      room = { host: true, status: '正在创建房间…', players: [] };
      stack = ['main', 'online']; scr = 'room'; render();
      call(cfg.host, { setup: Object.assign({}, setupVals), nick: T.nick() });
    }
    function joinRoom(code) {
      code = String(code || '').toUpperCase().replace(CODE_RE, '').slice(0, 4);
      if (code.length !== 4) { T.toast('房间码是 4 位字母或数字'); return; }
      ls.set(K('recent'), { code, t: Date.now() });
      room = { host: false, code, status: '正在连接房间 ' + code + '…', players: [] };
      stack = ['main', 'online']; scr = 'room'; render();
      call(cfg.join, { code, nick: T.nick() });
    }

    // ---------- events ----------
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || b.disabled) return;
      const a = b.dataset.a, arg = b.dataset.arg;
      if (a !== 'code' && a !== 'nick') call(cfg.sfx, 'click');
      switch (a) {
        case 'hub': if (cfg.onHub) call(cfg.onHub); else location.href = '../'; break;
        case 'snd': call(cfg.sound.set, !call(cfg.sound.get)); renderTop(); break;
        case 'go': go(arg); break;
        case 'back': back(); break;
        case 'continue': { const l = lastSaves || saves(), s = latest(l); if (s) call(cfg.saves.load, s.slot, s); break; }
        case 'new': startNew(arg); break;
        case 'go-start': doStart(); break;
        case 'extra': { const x = (val(cfg.extra) || []).find(q => q.id === arg); if (x) call(x.run, T); break; }
        case 'f-set': setupVals[arg] = JSON.parse(b.dataset.v); persistSetup(); { const f = fields().find(x => x.key === arg); if (f && f.change) call(f.change, setupVals[arg], setupVals); } render(true); break;
        case 'f-tog': setupVals[arg] = !setupVals[arg]; persistSetup(); render(true); break;
        case 'rf-set': call(cfg.roomSet, arg, JSON.parse(b.dataset.v)); break;
        case 'rf-tog': { const f = (room && room.fields || []).find(x => x.key === arg); call(cfg.roomSet, arg, !(f && room.values && room.values[arg])); break; }
        case 'host': setupMode = 'host'; if (hasSetup('host')) go('setup'); else hostRoom(); break;
        case 'join': joinRoom(joinCode); break;
        case 'recent': { const rc = ls.get(K('recent'), null); if (rc) { joinCode = rc.code; render(true); } break; }
        case 'copy-code': copyText(room && room.code || '').then(ok => T.toast(ok ? '房间码已复制' : '复制失败，请手动记下房间码')); break;
        case 'copy-link': copyText(T.inviteLink()).then(ok => T.toast(ok ? '邀请链接已复制，发给朋友点开就能加入' : '复制失败')); break;
        case 'r-ready': call(cfg.roomReady, !(room && room.ready)); break;
        case 'r-start': call(cfg.roomStart); break;
        case 'r-leave': leaveRoom(); break;
        case 's-load': call(cfg.saves.load, slotArg(arg), (lastSaves || []).find(s => String(s.slot) === arg)); break;
        case 's-new': call(cfg.saves.newInSlot, slotArg(arg)); break;
        case 's-del': arm('del' + arg, b, () => { call(cfg.saves.remove, slotArg(arg)); T.toast('存档已删除'); render(true); }); break;
        case 's-exp': Promise.resolve(call(cfg.saves.export, slotArg(arg))).then(t => { if (t) { exportShown = { slot: arg, text: String(t) }; render(true); } }); break;
        case 's-copy': copyText(exportShown ? exportShown.text : '').then(ok => T.toast(ok ? '存档码已复制' : '复制失败，请手动全选复制')); break;
        case 's-file': if (exportShown) { const bl = new Blob([exportShown.text], { type: 'text/plain' }), u = URL.createObjectURL(bl), aEl = document.createElement('a'); aEl.href = u; aEl.download = id + '-save-' + exportShown.slot + '.txt'; document.body.appendChild(aEl); aEl.click(); aEl.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); } break;
        case 's-imp': importOpen = true; render(true); { const t = $card.querySelector('[data-imp]'); if (t) t.focus(); } break;
        case 's-imp-x': importOpen = false; render(true); break;
        case 's-imp-go': doImport(($card.querySelector('[data-imp]') || {}).value || ''); break;
        case 's-imp-file': { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.txt,.json,text/plain,application/json'; inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => doImport(String(rd.result || '')); rd.readAsText(f); }; inp.click(); break; }
        case 'set-tog': { const r = (val(cfg.settings) || []).find(x => x.key === arg); if (r) { call(r.set, !call(r.get)); render(true); } break; }
        case 'set-seg': { const r = (val(cfg.settings) || []).find(x => x.key === arg); if (r) { call(r.set, JSON.parse(b.dataset.v)); render(true); } break; }
        case 'set-btn': { const r = (val(cfg.settings) || []).find(x => x.key === arg); if (r) { if (r.danger) arm('set' + arg, b, () => { call(r.run, T); render(true); }); else call(r.run, T); } break; }
      }
    });
    const slotArg = a => (/^-?\d+$/.test(a) ? +a : a);
    function doImport(txt) {
      txt = String(txt).trim(); if (!txt) { T.toast('先粘贴存档码'); return; }
      Promise.resolve(call(cfg.saves.import, txt)).then(r => {
        if (r === true || (r && r.ok)) { importOpen = false; T.toast((r && r.msg) || '导入成功'); render(true); }
        else T.toast(typeof r === 'string' ? r : '存档码无法识别');
      });
    }
    root.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.a === 'code') { const v = t.value.toUpperCase().replace(CODE_RE, '').slice(0, 4); if (v !== t.value) t.value = v; joinCode = v; const jb = $card.querySelector('[data-a=join]'); if (jb) jb.disabled = v.length !== 4; }
      else if (t.dataset.a === 'nick') setNick(t.value);
      else if (t.dataset.f) { setupVals[t.dataset.f] = t.value; persistSetup(); }
      else if (t.dataset.set) { const r = (val(cfg.settings) || []).find(x => x.key === t.dataset.set); if (r) call(r.set, +t.value); }
    });
    root.addEventListener('keydown', e => {
      const t = e.target;
      if (t.dataset && t.dataset.a === 'code' && e.key === 'Enter') { e.preventDefault(); joinRoom(t.value); }
    });
    // keyboard navigation (↑↓ / W S, Enter, Esc)
    const navKeys = e => {
      if (!visible) return;
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Escape') { if (scr !== 'main') { e.preventDefault(); e.stopPropagation(); if (typing) e.target.blur(); back(); } return; }
      if (typing) return;
      const up = e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W', dn = e.key === 'ArrowDown' || e.key === 's' || e.key === 'S';
      if (!up && !dn) return;
      const items = Array.from($card.querySelectorAll('button:not([disabled]), input:not([disabled])')).filter(x => x.offsetParent);
      if (!items.length) return;
      e.preventDefault(); e.stopPropagation();
      let i = items.indexOf(document.activeElement);
      i = i < 0 ? (dn ? 0 : items.length - 1) : (i + (dn ? 1 : -1) + items.length) % items.length;
      items[i].focus();
    };
    window.addEventListener('keydown', navKeys, true);

    // ---------- public ----------
    T.root = root;
    T.show = (s) => { visible = true; root.classList.remove('tk-hidden'); if (s) { stack = s === 'main' ? [] : ['main']; scr = s; } else if (scr === 'room' && !room) { scr = 'main'; stack = []; } render(); call(cfg.onShow); return T; };
    T.hide = () => { visible = false; root.classList.add('tk-hidden'); call(cfg.onHide); return T; };
    Object.defineProperty(T, 'visible', { get: () => visible });
    Object.defineProperty(T, 'screen', { get: () => scr });
    Object.defineProperty(T, 'setup', { get: () => Object.assign({}, setupVals) });
    T.setSetup = (o) => { Object.assign(setupVals, o); persistSetup(); if (visible) render(true); };
    T.go = (s) => go(s);
    T.home = () => { room = null; if (invited) { invited = false; stack = ['main']; scr = 'online'; } else { stack = []; scr = 'main'; } if (visible) render(); return T; };
    T.refresh = () => { if (visible) render(true); return T; };
    T.toast = (msg, ms) => { $toast.textContent = msg; $toast.classList.add('tk-show'); clearTimeout(toastT); toastT = setTimeout(() => $toast.classList.remove('tk-show'), ms || 2600); };
    T.room = (o) => {
      if (o === null) { room = null; if (scr === 'room') { scr = onlineOK() ? 'online' : 'main'; stack = scr === 'main' ? [] : ['main']; render(); } return T; }
      room = Object.assign(room || {}, o); if (o.error === undefined && (o.status !== undefined || o.code)) room.error = null;
      if (visible && scr !== 'room') { stack = ['main', 'online']; scr = 'room'; }
      if (visible) render(true);
      return T;
    };
    T.roomFail = (msg) => { room = null; stack = ['main']; scr = onlineOK() ? 'online' : 'main'; if (visible) render(); T.toast(msg || '连接失败', 3600); return T; };
    T.inviteLink = () => { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('room', (room && room.code) || ''); return u.toString(); };
    T.custom = (o) => { T._custom = o; go('custom'); };
    T.when = when; T.esc = esc; T.svg = svg;
    T.destroy = () => { window.removeEventListener('keydown', navKeys, true); root.remove(); };

    // invite link: ?room=ABCD → open 联机 with the code filled in
    try {
      const q = new URLSearchParams(location.search), rc = (q.get('room') || q.get('join') || '').toUpperCase().replace(CODE_RE, '').slice(0, 4);
      if (rc.length === 4 && onlineOK()) {
        joinCode = rc; stack = ['main']; scr = 'online'; invited = true;
        q.delete('room'); q.delete('join'); const u = new URL(location.href); u.search = q.toString(); history.replaceState(null, '', u.toString());
        setTimeout(() => T.toast('朋友邀请你加入房间 ' + rc + '，填好昵称后点「加入」', 4200), 400);
      }
    } catch (e) { }
    if (cfg.hidden) { visible = false; root.classList.add('tk-hidden'); } else render();
    return T;
  }
  window.TitleKit = { create, version: 1 };
})();
