/* ===================== game registry + session runtime ===================== */
BX.CATS = [
  ['classic', '经典棋类', '象', '#b23a2b'], ['heavy', '重度棋类', '弈', '#3d2716'], ['cards', '牌类', '牌', '#8a2a20'], ['party', '派对棋', '趣', '#d9822b'],
  ['dice', '骰子', '骰', '#6c4a8a'], ['brain', '益智对弈', '智', '#2f5d8a'], ['arcade', '街机对战', '斗', '#c2321f'], ['social', '联机社交', '聚', '#3f7f6b'],
  ['physics', '物理弹射', '弹', '#a8723d'], ['sports', '体育对战', '球', '#3f8f5b'], ['deduce', '推理猜谜', '谜', '#4a3a6a'], ['speed', '手速脑力', '速', '#d9a12b'],
  ['words', '文字游戏', '文', '#5e4b38'], ['folk', '传统民间', '俗', '#9a3a2a'], ['coop', '双人合作', '合', '#3a9aa0'], ['solo', '单人休闲', '闲', '#6b7a3a'],
];
BX.LEVELS = ['', '初级', '中级', '高级'];
BX.AI_NAMES = ['掌柜', '说书先生', '账房先生', '茶博士', '琴师', '跑堂小二'];
BX.MODE_NAMES = {ai: '人机对战', local: '同屏对战', online: '联机对战', solo: '开始游戏'};

BX.register = function (def) {
  def.kind = def.kind || 'turn';
  if (def.kind === 'solo') { def.seats = [1, 1]; def.modes = ['solo']; }
  if (typeof def.seats === 'number') def.seats = [def.seats, def.seats];
  def.seats = def.seats || [2, 2];
  def.modes = def.modes || ['ai', 'local', 'online'];
  if (!BX.CATS.find(c => c[0] === def.cat)) console.warn('unknown cat', def.id, def.cat);
  if (BX.games[def.id]) console.warn('duplicate game id', def.id);
  BX.games[def.id] = def; BX.list.push(def);
};

/* Build the seat list for a launch.  sel = {mode, n, humans, first:'me'|'other'|'rand', level} */
BX.makeSeats = function (def, sel) {
  const mode = sel.mode; let n = BX.clamp(sel.n || def.seats[0], def.seats[0], def.seats[1]);
  if ((mode === 'online' || mode === 'local') && n < 2) n = Math.min(2, def.seats[1]);
  const lv = sel.level || 2, names = BX.shuffle(BX.AI_NAMES.slice());
  const ai = k => ({name: names[k % names.length], ctrl: 'ai', level: lv});
  if (mode === 'solo') return [{name: BX.myName(), ctrl: 'local'}];
  const pickIdx = () => sel.first === 'other' ? 1 + Math.floor(Math.random() * (n - 1)) : sel.first === 'rand' ? Math.floor(Math.random() * n) : 0;
  if (mode === 'ai') { const me = pickIdx(); let k = 0; return BX.range(n).map(i => i === me ? {name: BX.myName(), ctrl: 'local'} : ai(k++)); }
  if (mode === 'local') {
    const hn = BX.clamp(sel.humans || n, Math.min(2, n), n);
    let order = BX.range(n); if (sel.first === 'rand') BX.shuffle(order);
    const humanSet = new Set(order.slice(0, hn)); let k = 0, p = 0;
    return BX.range(n).map(i => humanSet.has(i) ? {name: (def.seatNames && hn === n ? def.seatNames[i] : '玩家' + '一二三四五六'[p++]), ctrl: 'local'} : ai(k++));
  }
  if (mode === 'online') {   // owner: host | guest | ai (from host's perspective)
    const hs = pickIdx(); let gs = hs === 0 ? 1 : 0; if (sel.first === 'rand' && n > 2) { const rest = BX.range(n).filter(i => i !== hs); gs = rest[Math.floor(Math.random() * rest.length)]; }
    let k = 0;
    return BX.range(n).map(i => i === hs ? {name: BX.myName(), owner: 'host'} : i === gs ? {name: (BX.net.other || {}).name || '对手', owner: 'guest'} : Object.assign(ai(k++), {owner: 'ai'}));
  }
};

let S = null;            // current session
BX.session = () => S;
const STEP = 1 / 60;
const tScale = () => BX.test ? .04 : 1;

function rethrow(e, where) {
  console.error('[' + where + ']', e);
  (BX.errors = BX.errors || []).push(where + ': ' + (e && e.message));
  if (BX.test) setTimeout(() => { throw e; });
  else if (!BX._errShown) { BX._errShown = true; BX.toast('出了点小问题，可尝试重开本局'); setTimeout(() => BX._errShown = false, 5000); }
}

/* cfg: {mode, opts, seed, seats:[{name, ctrl:'local'|'ai'|'remote', level}], isHost, log?, g?} */
BX.launch = function (def, cfg) {
  BX.closeModals(); teardown();
  $id('lobby').hidden = true; $id('game').hidden = false;
  S = {def, cfg, log: [], gen: 0, alive: true, ended: null, anims: [], timers: new Set(), cleanups: [], aiTok: {}, sysTok: -1, reqPending: false,
    remoteIn: {}, acc: 0, snT: 0, inT: 0, paused: false, last: performance.now(), raf: 0, g: cfg.g || 0, prevTurn: []};
  S.localHumans = cfg.seats.filter(s => s.ctrl === 'local').length;
  if (cfg.mode !== 'online') { const rec = BX.store.get('recent', []).filter(x => x !== def.id); rec.unshift(def.id); BX.store.set('recent', rec.slice(0, 12)); }
  buildBar();
  makeInstance(cfg.log || []);
  S.raf = requestAnimationFrame(frame);
  if (!cfg.log || !cfg.log.length) BX.sfx.play('start');
};

function makeInstance(log) {
  const old = S.inst; if (old) { try { old.destroy && old.destroy(); } catch (e) {} }
  for (const f of S.cleanups.splice(0)) try { f(); } catch (e) {}
  for (const t of S.timers) clearTimeout(t); S.timers.clear(); S.anims.length = 0;
  S.gen++; S.ended = null; S.aiTok = {}; S.sysTok = -1; S.reqPending = false; S.log = [];
  const stage = $id('gmStage'); stage.innerHTML = '';
  const root = h('div', {class: 'gm-root'}); stage.append(root);
  const ctx = makeCtx(S.gen, root); S.ctx = ctx;
  BX.fastReplay = true; ctx.fast = true;
  try {
    S.inst = S.def.create(ctx) || {};
    for (const [a, by] of log) { S.log.push([a, by]); S.inst.apply(a, by); }
  } catch (e) { rethrow(e, 'create/replay ' + S.def.id); }
  BX.fastReplay = false; ctx.fast = false;
  if (S.ended && log.length) { /* replayed into a finished game */ }
  try { S.inst.ready && S.inst.ready(); } catch (e) { rethrow(e, 'ready'); }
  refreshBar(); check();
}

function makeCtx(gen, root) {
  const cfg = S.cfg, def = S.def;
  const seats = cfg.seats.map((s, i) => Object.assign({i, color: (def.seatColors || BX.C.seat)[i % 6]}, s));
  const live = () => S && S.gen === gen && S.alive;
  const mySeats = seats.filter(s => s.ctrl === 'local').map(s => s.i);
  const ctx = {
    def, id: def.id, mode: cfg.mode, opts: cfg.opts || {}, seed: cfg.seed, seats, n: seats.length,
    isHost: cfg.mode !== 'online' || !!cfg.isHost, online: cfg.mode === 'online', hotseat: cfg.mode === 'local' && mySeats.length > 1,
    mySeats, me: mySeats.length ? mySeats[0] : -1, view: mySeats.length ? mySeats[0] : 0, turn: [],
    fast: false, el: root, keys: new Set(), rng: BX.rng(cfg.seed),
    isLocal: s => !!seats[s] && seats[s].ctrl === 'local',
    isAI: s => !!seats[s] && seats[s].ctrl === 'ai',
    isRemote: s => !!seats[s] && seats[s].ctrl === 'remote',
    isBot: s => !!seats[s] && (seats[s].ctrl === 'ai' || (BX.bot && seats[s].ctrl === 'local')),
    name: s => seats[s] ? seats[s].name : '', color: s => seats[s] ? seats[s].color : '#888',
    level: s => (seats[s] && seats[s].level) || 2,
    canAct: s => { if (s == null) s = ctx.view; return live() && !S.ended && ctx.isLocal(s) && !(BX.bot) && ctx.turn.includes(s) && !S.reqPending && !S.handoff; },
    act(a, by) {
      if (!live()) return false;
      if (by == null) by = ctx.view;
      if (cfg.mode === 'online') {
        if (!ctx.isHost) { if (S.reqPending) return false; S.reqPending = true; BX.net.send({t: 'req', a, by, g: S.g}); return true; }
        BX.net.send({t: 'act', a, by, n: S.log.length, g: S.g});
      }
      applyAct(a, by); return true;
    },
    status(s) { const e = $id('gmStatus'); if (e && live()) e.innerHTML = s == null ? '' : s; },
    info(s, text) { if (!live()) return; S.info = S.info || {}; S.info[s] = text; refreshSeats(); },
    end(res) {
      if (!live() || S.ended) return;
      if (def.kind === 'realtime' && ctx.online && !ctx.isHost) return;
      S.ended = res || {}; refreshBar();
      if (ctx.fast) return;
      if (def.kind === 'realtime' && ctx.online) BX.net.send({t: 'end', res: S.ended, g: S.g});
      finish(S.ended);
    },
    get ended() { return S && S.gen === gen ? S.ended : true; },
    sfx: name => { if (!ctx.fast && live()) BX.sfx.play(name); },
    toast: (m, ms) => { if (!ctx.fast && live()) BX.toast(m, ms); },
    after(ms, fn) { if (ctx.fast) { fn(); return 0; } const t = setTimeout(() => { S && S.timers.delete(t); if (live()) try { fn(); } catch (e) { rethrow(e, 'after'); } }, ms * tScale()); S.timers.add(t); return t; },
    cancel(t) { clearTimeout(t); S && S.timers.delete(t); },
    anim(ms, fn, done, ease) {
      const a = {t0: performance.now(), ms: Math.max(1, ms * tScale()), fn, done, ease: ease || BX.ease.inOut, gen, dead: false, cancel() { a.dead = true; }};
      if (ctx.fast) { try { fn && fn(1); done && done(); } catch (e) { rethrow(e, 'anim'); } return a; }
      S.anims.push(a); return a;
    },
    on(target, type, fn, opt) { const w = e => { if (live()) try { fn(e); } catch (er) { rethrow(er, 'event ' + type); } }; target.addEventListener(type, w, opt); S.cleanups.push(() => target.removeEventListener(type, w, opt)); },
    canvas(o = {}) {
      const cv = h('canvas', {class: 'gm-cv'}); (o.parent || root).append(cv);
      const c = {cv, g: cv.getContext('2d'), w: 1, h: 1, dpr: 1,
        pos(e) { const r = cv.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; },
        clear(color) { c.g.setTransform(c.dpr, 0, 0, c.dpr, 0, 0); if (color) { c.g.fillStyle = color; c.g.fillRect(0, 0, c.w, c.h); } else c.g.clearRect(0, 0, c.w, c.h); }};
      const fit = () => {
        const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
        const d = Math.min(window.devicePixelRatio || 1, o.maxDpr || 2);
        cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); c.dpr = d; c.w = r.width; c.h = r.height;
        c.g.setTransform(d, 0, 0, d, 0, 0);
        if (live()) try { o.onResize && o.onResize(c.w, c.h); S.inst && S.inst.resize && S.inst.resize(c.w, c.h, c); } catch (e) { rethrow(e, 'resize'); }
      };
      const ro = new ResizeObserver(fit); ro.observe(cv); S.cleanups.push(() => ro.disconnect()); fit();
      return c;
    },
    ui(cls) { const d = h('div', {class: 'gm-ui ' + (cls || '')}); root.append(d); return d; },
    poke() { setTimeout(() => { if (live()) check(); }); },
    send(m) { if (ctx.online && live()) BX.net.send({t: 'gm', m, by: ctx.me, g: S.g}); },
    save(k, v) { BX.store.set('g.' + def.id + '.' + k, v); },
    load(k, d) { return BX.store.get('g.' + def.id + '.' + k, d); },
    best(k, v, dir = 'max') { const key = 'g.' + def.id + '.best.' + k, old = BX.store.get(key, null); const isNew = old == null || (dir === 'max' ? v > old : v < old); if (isNew && !BX.test) BX.store.set(key, v); return {best: isNew ? v : old, isNew, old}; },
    get log() { return S.log; },
    restart() { BX.restart(); },
  };
  return ctx;
}

function applyAct(a, by) {
  S.log.push([a, by]); S.reqPending = false;
  try { S.inst.apply(a, by); } catch (e) { rethrow(e, 'apply ' + S.def.id + ' ' + JSON.stringify(a)); }
  saveResume();
  const gen = S.gen; setTimeout(() => { if (S && S.gen === gen) check(); });
}

/* turn bookkeeping: whose move, handoff, AI and system moves */
function check() {
  if (!S || !S.alive || !S.inst) return;
  const def = S.def, ctx = S.ctx, inst = S.inst;
  if (def.kind !== 'turn') return;
  let tm = []; if (!S.ended) { try { tm = inst.toMove ? inst.toMove() : []; } catch (e) { rethrow(e, 'toMove'); } }
  tm = tm == null || tm === -1 ? [] : Array.isArray(tm) ? tm : [tm];
  ctx.turn = tm; refreshSeats();
  try { inst.onTurn && inst.onTurn(tm); } catch (e) { rethrow(e, 'onTurn'); }
  const L = S.log.length, gen = S.gen;
  const stale = () => !S || S.gen !== gen || S.log.length !== L || S.ended || !S.alive;
  if (S.ended) return;
  // view / hot-seat handoff
  if (S.cfg.mode === 'local') {
    const hum = tm.filter(s => ctx.isLocal(s));
    if (hum.length && !hum.includes(ctx.view)) {
      const nv = hum[0];
      if (def.hidden && S.localHumans > 1 && !BX.bot) { showHandoff(nv); return; }
      setView(nv);
    }
  }
  if (S.handoff) return;
  // your-turn chime when control returns to a local human in AI / online games
  const mine = tm.some(s => ctx.isLocal(s)), wasMine = S.prevTurn.some(s => ctx.isLocal(s));
  if (mine && !wasMine && L > 0 && S.cfg.mode !== 'local' && !BX.bot && !def.noTurnChime) BX.sfx.play('your');
  S.prevTurn = tm;
  // system move (timers that change state, e.g. flip cards back) — host only
  if (ctx.isHost && inst.sysMove && S.sysTok !== L) {
    let sm = null; try { sm = inst.sysMove(); } catch (e) { rethrow(e, 'sysMove'); }
    if (sm) { S.sysTok = L; const t = setTimeout(() => { S && S.timers.delete(t); if (!stale()) ctx.act(sm.a, -1); }, (sm.delay == null ? 600 : sm.delay) * tScale()); S.timers.add(t); }
  }
  // AI moves
  for (const s of tm) {
    const run = (ctx.isAI(s) && ctx.isHost) || (BX.bot && ctx.isLocal(s));
    if (!run || S.aiTok[s] === L || !inst.aiMove) continue;
    S.aiTok[s] = L;
    const delay = BX.test ? 5 : (def.aiDelay != null ? def.aiDelay : 420) + Math.random() * 200;
    const t = setTimeout(async () => {
      S && S.timers.delete(t); if (stale()) return;
      let a = null; try { a = await inst.aiMove(s, ctx.level(s)); } catch (e) { rethrow(e, 'aiMove ' + def.id); return; }
      if (stale() || a == null) return;
      ctx.act(a, s);
    }, delay);
    S.timers.add(t);
  }
}
function setView(s) { const ctx = S.ctx; if (ctx.view === s) return; ctx.view = s; ctx.me = s; try { S.inst.onView && S.inst.onView(s); } catch (e) { rethrow(e, 'onView'); } refreshSeats(); }
function showHandoff(s) {
  if (S.handoff) return;
  const ctx = S.ctx, gen = S.gen;
  const ov = h('div', {class: 'handoff'},
    h('div', {class: 'seal', style: {width: '64px', height: '64px', fontSize: '38px'}, text: '交'}),
    h('h2', {text: '请交给 ' + ctx.name(s)}),
    h('p', {text: '其他人请不要偷看哦'}),
    h('button', {class: 'bx-btn', text: '我是 ' + ctx.name(s) + '，开始', on: {click: () => { ov.remove(); if (!S || S.gen !== gen) return; S.handoff = null; setView(s); check(); }}}));
  S.handoff = ov; $id('layer').append(ov);
}

/* ---------------- frame loop ---------------- */
function frame(t) {
  if (!S || !S.alive) return;
  S.raf = requestAnimationFrame(frame);
  const dt = Math.min(.05, Math.max(0, (t - S.last) / 1000)); S.last = t;
  // anims
  if (S.anims.length) {
    const now = performance.now();
    for (const a of S.anims.slice()) {
      if (a.dead || a.gen !== S.gen) { S.anims.splice(S.anims.indexOf(a), 1); continue; }
      const k = Math.min(1, (now - a.t0) / a.ms);
      try { a.fn && a.fn(a.ease(k), k); } catch (e) { rethrow(e, 'anim'); a.dead = true; }
      if (k >= 1) { S.anims.splice(S.anims.indexOf(a), 1); try { a.done && a.done(); } catch (e) { rethrow(e, 'anim done'); } }
    }
  }
  const inst = S.inst, ctx = S.ctx; if (!inst) return;
  try {
    if (S.def.kind === 'realtime') {
      if (ctx.isHost) {
        if (!S.paused && !S.ended) {
          S.acc += dt; let k = 0;
          while (S.acc >= STEP && k < 4) { inst.step(STEP, ctx.seats.map(seatInput)); S.acc -= STEP; k++; }
          if (k >= 4) S.acc = 0;
        }
        if (ctx.online && BX.net.up) { S.snT += dt; if (S.snT >= .05) { S.snT = 0; BX.net.fast({t: 'snap', d: inst.snapshot(), g: S.g}); } }
      } else if (BX.net.up) {
        S.inT += dt; if (S.inT >= 1 / 30) { S.inT = 0; BX.net.fast({t: 'in', d: inst.input(ctx.me, 0, 1), g: S.g}); }
      }
      inst.draw && inst.draw(dt);
    } else inst.frame && inst.frame(dt);
  } catch (e) { rethrow(e, 'frame ' + S.def.id); }
}
function seatInput(s) {
  const inst = S.inst, ctx = S.ctx;
  if (s.ctrl === 'ai' || (BX.bot && s.ctrl === 'local')) return inst.aiInput ? inst.aiInput(s.i, s.level || 2) : {};
  if (s.ctrl === 'local') { const loc = ctx.mySeats; return inst.input ? inst.input(s.i, loc.indexOf(s.i), loc.length) : {}; }
  return S.remoteIn[s.i] || {};
}

/* ---------------- keyboard ---------------- */
addEventListener('keydown', e => {
  if (!S || !S.alive || $id('game').hidden) return;
  const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) return;
  if (BX._modals.size || S.handoff) return;
  S.ctx.keys.add(e.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape') { /* games may handle */ }
  try { S.inst && S.inst.key && S.inst.key(e); } catch (er) { rethrow(er, 'key'); }
});
addEventListener('keyup', e => { if (S && S.ctx) S.ctx.keys.delete(e.code); });
addEventListener('blur', () => { if (S && S.ctx) S.ctx.keys.clear(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.def.kind === 'realtime' && !S.ctx.online && !S.ended) setPaused(true); });

/* ---------------- end of game ---------------- */
function finish(res) {
  clearResume();
  const def = S.def, ctx = S.ctx, mode = S.cfg.mode;
  // stats
  if (!BX.test && !BX.bot) {
    const st = BX.store.get('stats', {}); const r = st[def.id] = st[def.id] || {n: 0, w: 0, l: 0, d: 0}; r.n++;
    const o = outcome(res);
    if (o === 'win' && mode !== 'local') r.w++; else if (o === 'lose' && mode !== 'local') r.l++; else if (o === 'draw') r.d++;
    BX.store.set('stats', st);
  }
  const gen = S.gen;
  setTimeout(() => { if (S && S.gen === gen && S.alive) showResult(res); }, (res.delay != null ? res.delay : 900) * tScale());
}
function winners(res) { const w = res.winner; return w == null || w === -1 ? [] : Array.isArray(w) ? w : [w]; }
function outcome(res) {
  if (S.def.kind === 'solo' || res.win != null) return res.win ? 'win' : res.win === false ? 'lose' : 'done';
  const w = winners(res); if (!w.length) return 'draw';
  if (S.ctx.hotseat) return 'hot';
  return w.some(s => S.ctx.isLocal(s)) ? 'win' : 'lose';
}
function showResult(res) {
  const ctx = S.ctx, o = outcome(res), w = winners(res);
  let title = res.title, big;
  if (!title) {
    if (o === 'win') { title = S.def.kind === 'solo' ? (res.win ? '大功告成' : '本局结束') : '你赢了'; big = '胜'; }
    else if (o === 'lose') { title = S.def.kind === 'solo' ? '再接再厉' : (S.def.coop ? '挑战失败' : '惜败'); big = '负'; }
    else if (o === 'draw') { title = '平局'; big = '和'; }
    else if (o === 'hot') { title = w.map(s => ctx.name(s)).join('、') + ' 获胜'; big = '胜'; }
    else { title = '本局结束'; big = '终'; }
  }
  if (S.def.coop && o === 'win') title = res.title || '合作成功';
  BX.sfx.play(o === 'lose' ? 'lose' : o === 'draw' ? 'draw' : 'win');
  const canRe = !ctx.online || ctx.isHost;
  const btns = [];
  if (canRe) btns.push({label: '再来一局', value: 're', cls: 'red'});
  btns.push({label: '看看局面', value: 'look', cls: 'ghost'}, {label: '返回大厅', value: 'lobby'});
  let html = res.text ? BX.esc(res.text) : '';
  if (res.html) html = res.html;
  if (ctx.online && !ctx.isHost) html += (html ? '<br>' : '') + '<span style="color:var(--ink3);font-size:13px">等待房主开下一局…</span>';
  BX.modal({title, big: res.big || big, html, buttons: btns, cls: o === 'win' || o === 'hot' ? 'res-win' : '', dismiss: 'look'}).then(v => {
    if (v === 're') BX.rematch(); else if (v === 'lobby') BX.toLobby();
  });
}
BX.rematch = function () {
  if (!S) return; const cfg = S.cfg, def = S.def;
  if (cfg.mode === 'online') { if (BX.net.isHost) BX.startOnline(def, cfg.opts, cfg.hostSeats); return; }
  let seats = cfg.seats;
  if (cfg.sel && cfg.sel.first === 'rand') seats = BX.makeSeats(def, cfg.sel);
  BX.launch(def, Object.assign({}, cfg, {seed: BX.newSeed(), log: [], seats}));
};
BX.restart = function () { if (!S) return; if (S.cfg.mode === 'online') { BX.rematch(); return; } BX.launch(S.def, Object.assign({}, S.cfg, {seed: BX.newSeed(), log: []})); };

/* ---------------- undo / resume ---------------- */
function canUndo() { return S && S.def.kind === 'turn' && S.cfg.mode !== 'online' && S.def.undo !== false && S.log.some(([a, by]) => S.ctx.isLocal(by)); }
BX.undo = function () {
  if (!canUndo()) return;
  const ctx = S.ctx; let i = S.log.length - 1;
  while (i >= 0 && !ctx.isLocal(S.log[i][1])) i--;
  if (i < 0) return;
  const keep = S.log.slice(0, i);
  BX.closeModals(); makeInstance(keep); saveResume(); BX.sfx.play('whoosh');
};
let resumeT = 0;
function saveResume() {
  if (!S || S.def.kind !== 'turn' || S.cfg.mode === 'online' || S.def.resume === false || BX.test || S.ended) return;
  clearTimeout(resumeT); const snap = {mode: S.cfg.mode, opts: S.cfg.opts, seed: S.cfg.seed, seats: S.cfg.seats, sel: S.cfg.sel, log: S.log, t: Date.now()}, id = S.def.id;
  resumeT = setTimeout(() => BX.store.set('resume.' + id, snap), 250);
}
function clearResume() { clearTimeout(resumeT); if (S) BX.store.del('resume.' + S.def.id); }
BX.getResume = id => BX.store.get('resume.' + id, null);

/* ---------------- pause (offline realtime) ---------------- */
function setPaused(p) {
  if (!S || S.def.kind !== 'realtime' || S.ctx.online) return;
  S.paused = p; refreshBar();
  try { S.inst.onPause && S.inst.onPause(p); } catch (e) {}
  if (p) BX.modal({title: '暂停', html: '休息一下，喝口茶', buttons: [{label: '继续', value: 1, cls: 'red'}], dismiss: 1}).then(() => { if (S) { S.paused = false; S.last = performance.now(); refreshBar(); try { S.inst.onPause && S.inst.onPause(false); } catch (e) {} } });
}

/* ---------------- leaving ---------------- */
function teardown() {
  if (!S) return;
  S.alive = false; cancelAnimationFrame(S.raf);
  try { S.inst && S.inst.destroy && S.inst.destroy(); } catch (e) {}
  for (const f of S.cleanups) try { f(); } catch (e) {}
  for (const t of S.timers) clearTimeout(t);
  if (S.handoff) S.handoff.remove();
  $id('gmStage').innerHTML = ''; S = null;
}
BX.toLobby = function (silent) {
  if (S && S.cfg.mode === 'online' && !silent) BX.net.send({t: BX.net.role === 'host' ? 'lobby' : 'left', g: S.g});
  BX.closeModals(); teardown();
  $id('game').hidden = true; $id('lobby').hidden = false;
  BX.lobby && BX.lobby.refresh();
};

/* ---------------- top bar ---------------- */
let backArm = 0;
function buildBar() {
  const bar = $id('gmBar'); bar.innerHTML = '';
  const def = S.def;
  const back = h('button', {class: 'gb', id: 'gbBack', text: '‹ 大厅', on: {click: () => {
    const risky = S && !S.ended && S.log.length > 0 && (S.cfg.mode === 'online' || S.def.kind !== 'turn' || S.def.resume === false);
    if (risky && backArm < performance.now()) { backArm = performance.now() + 2500; back.textContent = '再点确认'; back.classList.add('warn'); setTimeout(() => { back.textContent = '‹ 大厅'; back.classList.remove('warn'); }, 2500); return; }
    BX.toLobby();
  }}});
  bar.append(back, h('div', {class: 'gm-title', text: def.title}),
    h('div', {class: 'gm-mid'}, h('div', {class: 'seats', id: 'gmSeats'}), h('div', {class: 'gm-status', id: 'gmStatus'})));
  if (def.kind === 'turn' && S.cfg.mode !== 'online' && def.undo !== false) bar.append(h('button', {class: 'gb', id: 'gbUndo', title: '悔棋', text: '↶', on: {click: () => BX.undo()}}));
  if (def.kind === 'realtime' && S.cfg.mode !== 'online') bar.append(h('button', {class: 'gb', id: 'gbPause', title: '暂停', text: '❚❚', on: {click: () => setPaused(true)}}));
  if (S.cfg.mode === 'online') bar.append(h('button', {class: 'gb', id: 'gbEmo', title: '表情', text: '☺', on: {click: emoPop}}));
  bar.append(h('button', {class: 'gb', id: 'gbRules', title: '规则', text: '?', on: {click: () => BX.modal({title: def.title + ' · 规则', body: h('div', {class: 'rules', style: {textAlign: 'left'}, html: def.rules || '暂无说明'}), buttons: [{label: '知道了', value: 1}], dismiss: 1, width: 560})}}));
  const re = h('button', {class: 'gb', id: 'gbRe', title: '重开', text: '↻', on: {click: async () => {
    if (S && S.cfg.mode === 'online' && !BX.net.isHost) { BX.toast('只有房主可以重开'); return; }
    if (S && !S.ended && S.log.length && !(await BX.confirm('放弃这一局，重新开始？', '重开'))) return; BX.restart();
  }}});
  const snd = h('button', {class: 'gb', id: 'gbSnd', title: '声音', text: BX.sfx.muted ? '🔇' : '🔊', on: {click: () => { BX.sfx.toggle(); }}});
  bar.append(re, snd);
}
document.addEventListener('bx-mute', () => { const b = $id('gbSnd'); if (b) b.textContent = BX.sfx.muted ? '🔇' : '🔊'; });
function refreshBar() {
  if (!S) return;
  const u = $id('gbUndo'); if (u) u.disabled = !canUndo();
  const p = $id('gbPause'); if (p) p.disabled = !!S.ended;
  refreshSeats();
}
function refreshSeats() {
  if (!S || !S.ctx) return; const el = $id('gmSeats'); if (!el) return;
  const ctx = S.ctx; if (S.def.kind === 'solo' || S.def.hideSeats) { el.innerHTML = ''; return; }
  el.innerHTML = '';
  for (const s of ctx.seats) {
    const you = s.ctrl === 'local' && !ctx.hotseat ? '（你）' : '';
    const lv = s.ctrl === 'ai' ? '·' + BX.LEVELS[s.level || 2][0] : '';
    const inf = S.info && S.info[s.i] != null ? S.info[s.i] : '';
    el.append(h('div', {class: 'seat' + (ctx.turn.includes(s.i) && !S.ended ? ' turn' : '') + (s.gone ? ' off' : '')},
      h('i', {style: {background: s.color}}), h('span', {text: s.name + lv + you}), inf !== '' ? h('em', {text: inf}) : null));
  }
  const u = $id('gbUndo'); if (u) u.disabled = !canUndo();
}

/* ---------------- emotes ---------------- */
const EMO = ['😀', '😂', '😮', '😭', '😡', '👍', '🍵', '🎉'], PHR = ['好棋！', '快点吧～', '失误了', '再来一局'];
function emoPop() {
  const old = document.querySelector('.emo-pop'); if (old) { old.remove(); return; }
  const pop = h('div', {class: 'emo-pop'}, EMO.map(e => h('button', {text: e, on: {click: () => sendEmo(e)}})), PHR.map(p => h('button', {class: 'ph', text: p, on: {click: () => sendEmo(p)}})));
  $id('game').append(pop); setTimeout(() => addEventListener('pointerdown', function f(ev) { if (!pop.contains(ev.target)) { pop.remove(); removeEventListener('pointerdown', f, true); } }, true), 0);
  function sendEmo(e) { pop.remove(); BX.net.send({t: 'emo', e}); bubble(e, true); }
}
function bubble(e, mine) {
  const b = h('div', {class: 'bubble', text: e, style: mine ? {right: '20px', top: '70px'} : {left: '20px', top: '70px'}});
  $id('layer').append(b); setTimeout(() => b.remove(), 2500); if (!mine) BX.sfx.play('pop');
}

/* ---------------- online glue ---------------- */
BX.startOnline = function (def, opts, sel) {
  if (!BX.net.isHost) return;
  const seats = BX.makeSeats(def, Object.assign({}, sel, {mode: 'online'}));
  const seed = BX.newSeed(), g = (BX._g = (BX._g || 0) + 1);
  BX.net.send({t: 'start', id: def.id, opts, seed, seats, g});
  BX.launch(def, {mode: 'online', opts, seed, isHost: true, g, hostSeats: sel, seats: seats.map(s => ({name: s.name, level: s.level, ctrl: s.owner === 'host' ? 'local' : s.owner === 'guest' ? 'remote' : 'ai'}))});
};
BX.onNet = function (m) {
  if (m.t === 'start') {
    const def = BX.games[m.id]; if (!def) { BX.toast('版本不一致：对方的游戏这里没有'); return; }
    BX.launch(def, {mode: 'online', opts: m.opts, seed: m.seed, isHost: false, g: m.g, seats: m.seats.map(s => ({name: s.name, level: s.level, ctrl: s.owner === 'guest' ? 'local' : s.owner === 'host' ? 'remote' : 'ai'}))});
    return;
  }
  if (m.t === 'suggest') { const def = BX.games[m.id]; if (def && BX.lobby) BX.lobby.suggested(def); return; }
  if (m.t === 'emo') { if (S && S.ctx && S.ctx.online) bubble(String(m.e).slice(0, 8)); else BX.toast((BX.net.other || {}).name + '：' + String(m.e).slice(0, 8)); return; }
  if (m.t === 'lobby') { if (S && S.cfg.mode === 'online') { BX.toLobby(true); BX.toast('房主回到了大厅'); } return; }
  if (!S || S.cfg.mode !== 'online' || m.g !== S.g) {
    if (m.t === 'needsync' && S && BX.net.isHost) BX.net.send({t: 'sync', log: S.log, g: S.g});
    return;
  }
  const ctx = S.ctx, inst = S.inst;
  switch (m.t) {
    case 'act':   // guest receives authoritative action
      if (ctx.isHost) return;
      if (m.n !== S.log.length) { BX.net.send({t: 'needsync', g: S.g}); return; }
      applyAct(m.a, m.by); break;
    case 'req': { // host receives guest action request
      if (!ctx.isHost) return;
      let ok = ctx.isRemote(m.by) && !S.ended;
      if (ok && S.def.kind === 'turn' && !S.def.anyTimeActs) { let tm = []; try { tm = inst.toMove ? inst.toMove() : []; } catch (e) {} tm = tm == null || tm === -1 ? [] : Array.isArray(tm) ? tm : [tm]; ok = tm.includes(m.by); }
      if (ok && inst.valid) { try { ok = inst.valid(m.a, m.by) !== false; } catch (e) { ok = false; } }
      if (ok) ctx.act(m.a, m.by); else BX.net.send({t: 'rej', g: S.g});
      break;
    }
    case 'rej': { S.reqPending = false; if (!BX.bot) BX.sfx.play('error'); S.aiTok = {}; const gen = S.gen; setTimeout(() => { if (S && S.gen === gen) check(); }, 150); break; }
    case 'needsync': if (ctx.isHost) BX.net.send({t: 'sync', log: S.log, g: S.g}); break;
    case 'sync': if (!ctx.isHost) { makeInstance(m.log); } break;
    case 'snap': if (!ctx.isHost && inst.restore) try { inst.restore(m.d); } catch (e) { rethrow(e, 'restore'); } break;
    case 'in': if (ctx.isHost) { const rs = ctx.seats.find(s => s.ctrl === 'remote'); if (rs) S.remoteIn[rs.i] = m.d || {}; } break;
    case 'end': if (!ctx.isHost && !S.ended) { S.ended = m.res || {}; refreshBar(); finish(S.ended); } break;
    case 'gm': try { inst.onMsg && inst.onMsg(m.m, m.by); } catch (e) { rethrow(e, 'onMsg'); } break;
    case 'left': remoteGone('对方回到了大厅'); break;
  }
};
BX.onNetGone = function () { if (S && S.cfg.mode === 'online') { if (S.ctx.isHost) remoteGone('对方断线了'); else { BX.toLobby(true); } } };
function remoteGone(msg) {
  if (!S || S.cfg.mode !== 'online' || !S.ctx.isHost) return;
  const ctx = S.ctx, rs = ctx.seats.filter(s => s.ctrl === 'remote');
  if (S.ended) { BX.toast(msg); return; }
  const canAI = S.def.kind === 'turn' ? !!S.inst.aiMove : S.def.kind === 'realtime' ? !!S.inst.aiInput : false;
  if (canAI && !S.def.noAI) { rs.forEach(s => { s.ctrl = 'ai'; s.level = 2; s.name += '(电脑)'; }); BX.toast(msg + '，由电脑接手'); refreshSeats(); check(); }
  else { BX.toast(msg); BX.toLobby(true); }
}
