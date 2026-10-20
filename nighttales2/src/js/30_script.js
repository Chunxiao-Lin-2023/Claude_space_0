/* ================= 十夜怪谈 · 剧本 API ================= */
let GEN = 1;
const ABORT = { abort: true };
addEventListener('unhandledrejection', e => { if (e.reason === ABORT) e.preventDefault(); });
function isHost() { return NET.role !== 'guest'; }
function iControl() { return NET.role === 'solo' || (NET.role === 'host' ? W && W.ctrl !== 'g' : W && W.ctrl === 'g'); }
function canMove() { return W && !W.busy && !W.dlg && !W.card && !W.note && !W.keypad && !W.ended && !W.paused && iControl() && !UI.modal; }

let DLGWAIT = null;
function runScript(fn, ent) {
  if (!fn || !W) return;
  const myGen = GEN; W.busy++; W.hint = null;
  (async () => {
    try { await fn(SAPI, ent); }
    catch (e) { if (e !== ABORT) { console.error(e); } }
    finally { if (myGen === GEN && W) W.busy = Math.max(0, W.busy - 1); }
  })();
}
function runScriptP(p) { if (!W) return; const myGen = GEN; W.busy++; p.catch(e => { if (e !== ABORT) console.error(e); }).finally(() => { if (myGen === GEN && W) W.busy = Math.max(0, W.busy - 1); }); }
function chk(g) { if (g !== GEN) throw ABORT; }
let DLGID = 0;
function waitInput(kind, data) {
  return new Promise((res, rej) => { DLGWAIT = { res, rej, kind }; Object.assign(W, data); });
}
/* 打断正在等待输入的剧本（倒计时到点时用）：关掉对话/密码盘/卡片，原剧本以 ABORT 结束 */
function interruptWait() {
  const r = DLGWAIT; DLGWAIT = null;
  if (W) { W.dlg = null; W.keypad = null; W.card = null; W.note = null; }
  if (r && r.rej) r.rej(ABORT);
}
function emit(t, a) { applyEmit(t, a); if (NET.role === 'host') netSend({ t: 'fx', k: t, a }); }
function applyEmit(t, a) {
  if (t === 'sfx') AU.sfx(a);
  else if (t === 'amb') AU.ambient(a);
  else if (t === 'fx') addFX(a[0], a[1] || {});
  else if (t === 'shake') { if (W) W.shake = { until: RT + a[0] / 1000, amt: a[1] }; }
  else if (t === 'toast') UI.toast(a);
  else if (t === 'item') UI.toast(a);
  else if (t === 'tone') AU.tone(...a);
}
function itemName(id) { const it = W.ch.items && W.ch.items[id]; return it ? it.name : id; }

const SAPI = {
  get f() { return W.f; },
  get pl() { return W.pl; },
  get map() { return W.mapId; },
  /* 玩家此刻是否在走 / 在跑（客机操作时用客机上报的状态） */
  get moving() { const p = W.pl; if (isHost() && !iControl()) return !!(p.rmv && RT - p.rT < .3); return !!p.mv; },
  get running() { const p = W.pl; if (isHost() && !iControl()) return !!(p.rmv && p.rrun && RT - p.rT < .3); return !!(p.mv && p.run); },
  get coop() { return NET.role !== 'solo' && NET.up; },
  async say(who, text, o = {}) {
    const g = GEN; const pages = Array.isArray(text) ? text : [text];
    for (const t of pages) {
      await waitInput('dlg', { dlg: { id: ++DLGID, who: who || '', text: t, choices: null, sel: 0, full: false, t0: RT, style: o.style || '', face: o.face || null } });
      chk(g);
    }
    W.dlg = null;
  },
  narr(text, o) { return SAPI.say('', text, o); },
  think(text) { return SAPI.say('', text, { style: 'think' }); },
  async ask(text, opts, who, o = {}) {
    const g = GEN;
    const r = await waitInput('dlg', { dlg: { id: ++DLGID, who: who || '', text, choices: opts, sel: 0, full: false, t0: RT, style: o.style || '' } });
    chk(g); W.dlg = null; return r;
  },
  async card(title, sub, body) {
    const g = GEN; await waitInput('card', { card: { id: ++DLGID, title, sub: sub || '', body: body || '', t0: RT } }); chk(g); W.card = null;
  },
  async note(title, text, id) {   // note('id') 读取 ch.notes[id]；或 note(标题, 正文, id)
    if (text === undefined && W.ch.notes && W.ch.notes[title]) { id = title; text = W.ch.notes[id].text; title = W.ch.notes[id].title; }
    const g = GEN; AU.sfx('paper'); if (NET.role === 'host') netSend({ t: 'fx', k: 'sfx', a: 'paper' });
    if (id) { const k = W.ch.id + ':' + id; const got = store.get('notes', []); if (!got.includes(k)) { got.push(k); store.set('notes', got); } if (NET.role === 'host') netSend({ t: 'note', k }); }
    await waitInput('note', { note: { id: ++DLGID, title, text, t0: RT } }); chk(g); W.note = null;
  },
  async keypad(prompt, keys, len, o = {}) {
    /* keys 可以是多字符（'10'、'开'）；len = 要按几下；返回按下的键拼成的字符串（o.sep 为分隔符，默认无） */
    const g = GEN; const r = await waitInput('keypad', { keypad: { id: ++DLGID, prompt, keys, len, val: '', parts: [], sep: o.sep || '', alias: o.alias || null, t0: RT, cancel: o.cancel !== false } }); chk(g); W.keypad = null; return r;
  },
  async wait(ms) { const g = GEN; await new Promise(r => setTimeout(r, ms / FAST)); chk(g); },
  async fade(to, ms = 500) {
    const g = GEN, from = W.fade, t0 = now(); ms /= FAST;
    await new Promise(res => { const st = () => { if (g !== GEN) return res(); const a = Math.min(1, (now() - t0) / ms); W.fade = lerp(from, to, a); a < 1 ? requestAnimationFrame(st) : res(); }; st(); });
    chk(g);
  },
  async go(map, x, y, dir, o = {}) {
    const g = GEN;
    if (o.fade !== false) await SAPI.fade(1, o.ms || 350);
    if (o.sfx !== false && o.sfx) emit('sfx', o.sfx);
    const p = W.pl; W.mapId = map; p.x = x; p.y = y; p.px = x * TS; p.py = y * TS; p.mv = null; p.prev = [x, y]; if (dir != null) p.dir = dir;
    for (const e of W.maps[map].ents) if (e.follow && !e.hidden) { e.px = p.px; e.py = p.py; e.mv = null; const d = DIRS[(p.dir + 3) % 4 === 0 ? 3 : 0]; void d; }
    W.forceK++; lastPTile = map + ':' + x + ',' + y; W.camFocus = null;
    camUpdate(0, true);
    const md = W.maps[map].def;
    if (md.amb) emit('amb', md.amb);
    if (o.fade !== false) await SAPI.fade(0, o.ms || 350);
    chk(g);
    if (md.enter) { const first = !W.f['_v_' + map]; W.f['_v_' + map] = true; await md.enter(SAPI, first); chk(g); }
    else W.f['_v_' + map] = true;
  },
  give(id, silent) { if (!W.inv.includes(id)) W.inv.push(id); if (!silent) { emit('sfx', 'item'); emit('toast', '获得：' + itemName(id)); } },
  take(id) { W.inv = W.inv.filter(i => i !== id); },
  has(id) { return W.inv.includes(id); },
  goal(t) { if (W.goal !== t) { W.goal = t; if (t) emit('toast', '目标：' + t); } },
  toast(t) { emit('toast', t); },
  ent(id) { const e = getEnt(id); if (!e) console.warn('no ent', id); return e; },
  show(id, v = true) { const e = getEnt(id); if (e) e.hidden = !v; },
  hide(id) { SAPI.show(id, false); },
  place(id, x, y, dir) { const e = getEnt(id); if (!e) return; e.px = x * TS; e.py = y * TS; e.x = x; e.y = y; e.mv = null; if (dir != null) e.dir = dir; e.hidden = false; },
  moveTo(id, map, x, y, dir) { let e = null, from = null; for (const k in W.maps) { const i = W.maps[k].ents.findIndex(z => z.id === id); if (i >= 0) { from = W.maps[k]; e = from.ents[i]; from.ents.splice(i, 1); break; } } if (!e) return; W.maps[map].ents.push(e); e.px = x * TS; e.py = y * TS; e.mv = null; e.hidden = false; if (dir != null) e.dir = dir; },
  async walk(id, path, spd = 3) {
    /* path: 'uulr' 方向串 | [x,y] 目标格（自动寻路）| [[x,y],[x,y]] 依次经过 */
    const g = GEN; const e = id === 'pl' ? W.pl : getEnt(id); if (!e) return; const m = curMap();
    if (Array.isArray(path) && Array.isArray(path[0])) { for (const pt of path) await SAPI.walk(id, pt, spd); return; }
    if (Array.isArray(path)) {
      const [tx, ty] = path; let guard = 300;
      while (guard-- > 0) { const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS); if (ex === tx && ey === ty) break; const d = bfsStep(m, ex, ey, tx, ty, e); if (d < 0) break; await new Promise(res => startMove(e, d, spd, res)); chk(g); if (e === W.pl) { e.prev = [ex, ey]; for (const f of m.ents) if (f.follow && !f.hidden) followStep(f); } }
    } else {
      for (const c of path) { const d = { d: 0, s: 0, l: 1, r: 2, u: 3 }[c]; if (d == null) continue; const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS); await new Promise(res => startMove(e, d, spd, res)); chk(g); if (e === W.pl) { e.prev = [ex, ey]; for (const f of m.ents) if (f.follow && !f.hidden) followStep(f); } }
    }
    e.fr = 0; if (e === W.pl) { W.forceK++; lastPTile = W.mapId + ':' + e.x + ',' + e.y; }
  },
  face(id, dir) { const e = id === 'pl' ? W.pl : getEnt(id); if (!e) return; if (typeof dir === 'string') { const o = dir === 'pl' ? W.pl : getEnt(dir); const dx = o.px - e.px, dy = o.py - e.py; dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); } e.dir = dir; if (e === W.pl) W.forceK++; },
  turn(dir) { W.pl.dir = dir; W.forceK++; },
  bubble(id, k, ms = 1200) { const e = id === 'pl' ? null : getEnt(id); const b = { k, until: RT + ms / 1000 }; if (e) e.bubble = b; else W.pl.bubble = b; },
  chase(id, o = {}) { const e = getEnt(id); if (!e) return; e.hidden = false; e.chase = Object.assign({ spd: 3 }, o); },
  stop(id) { const e = getEnt(id); if (!e) return; e.chase = null; e.frozen = false; if (e.mv) { const mv = e.mv; e.mv = null; e.px = mv.fx * TS; e.py = mv.fy * TS; e.x = mv.fx; e.y = mv.fy; } e.fr = 0; },
  /* 原地定住追逐者（被注视时等）：不再走下一步，也停在当前位置；freeze(id,false) 解除 */
  freeze(id, b = true) { const e = getEnt(id); if (e) e.frozen = !!b; },
  isFrozen(id) { const e = getEnt(id); return !!(e && e.frozen); },
  follow(id, on = true) { const e = getEnt(id); if (e) { e.follow = on; e.solid = !on; } },
  async scare(kind = 'face', o = {}) {
    emit('sfx', o.sfx || 'scare'); emit('fx', [kind, o]); emit('shake', [o.shakeMs || 500, o.shake || 3]);
    if (o.wait !== false) await SAPI.wait((o.dur || .9) * 1000);
  },
  fx(kind, o) { emit('fx', [kind, o || {}]); },
  shake(ms = 400, amt = 2) { emit('shake', [ms, amt]); },
  sfx(n) { emit('sfx', n); },
  amb(n) { emit('amb', n); },
  dark(v, map) { W.mapDark[map || W.mapId] = v; },   // 当前地图（或指定地图）的黑暗度覆盖；null 恢复默认
  after(ms, fn) { W.queue.push({ at: W.t + ms / 1000 / FAST, fn }); },   // 空闲时延后运行一段剧本
  plr(r) { W.plr = r; },
  tile(x, y, ch, map) { const m = W.maps[map || W.mapId]; m.mods[y * m.w + x] = ch; m.dirty = true; },
  /* o.during=true：对话/密码盘打开时也照样计时，到点会打断当前对话 */
  timer(sec, label, fn, o = {}) { W.timer = { left: sec, label, fn, during: !!o.during }; },
  clearTimer() { W.timer = null; },
  focus(x, y) { W.camFocus = x == null ? null : [x, y]; },
  hidePlayer(b = true) { W.pl.hidden = b; },
  wear(spr) { W.pl.spr = spr; },
  speed(m) { W.pl.speed = m; },
  norun(b = true) { W.noRun = b; },   // 禁止奔跑（潜行段）
  pos(x, y, dir) { const p = W.pl; p.x = x; p.y = y; p.px = x * TS; p.py = y * TS; p.mv = null; if (dir != null) p.dir = dir; W.forceK++; lastPTile = W.mapId + ':' + x + ',' + y; },
  cp(name) { W.cp = makeCP(name); store.set('cp.' + W.ch.id, W.cp); },
  async die(msg, title) {
    const g = GEN; emit('sfx', 'bad'); W.timer = null;
    for (const k in W.maps) for (const e of W.maps[k].ents) e.chase = null;
    await waitInput('end', { endScreen: { kind: 'die', title: title || '你没能逃出去', text: msg || '', t0: RT } });
    chk(g);
  },
  async end(o = {}) {
    W.ended = true; W.timer = null; emit('sfx', o.bad ? 'bad' : 'good');
    for (const k in W.maps) for (const e of W.maps[k].ents) e.chase = null;
    if (!o.bad) { markDone(W.ch.id); store.del('cp.' + W.ch.id); }   // 坏结局保留检查点
    if (o.id) { const k = W.ch.id + ':' + o.id, got = store.get('ends', []); if (!got.includes(k)) { got.push(k); store.set('ends', got); } if (NET.role === 'host') netSend({ t: 'endrec', k }); }   // 结局收集（ch.endings 列出全部）
    if (NET.role === 'host' && !o.bad) netSend({ t: 'done', ch: W.ch.id });
    await waitInput('end', { endScreen: { kind: o.bad ? 'badend' : 'end', title: o.title || '完', text: o.text || '', t0: RT } });
  },
  rand(n) { return Math.floor(Math.random() * n); },
  once(k) { if (W.f['_o_' + k]) return false; W.f['_o_' + k] = true; return true; },
  async alpha(id, to, ms = 600) {   // 实体淡入淡出
    const g = GEN, e = getEnt(id); if (!e) return; if (to > 0) e.hidden = false; const from = e.alpha ?? 1, t0 = now(); ms /= FAST;
    await new Promise(res => { const st = () => { if (g !== GEN) return res(); const a = Math.min(1, (now() - t0) / ms); e.alpha = lerp(from, to, a); a < 1 ? requestAnimationFrame(st) : res(); }; st(); });
    chk(g); if (to <= 0) { e.hidden = true; e.alpha = 1; }
  },
  async bells(n, gap = 420, name = 'bell') { for (let i = 0; i < n; i++) { emit('sfx', name); await SAPI.wait(gap); } },
  /* 双方都能听到的单音：tone(type, f0, f1, dur, vol, delay, lp) */
  tone(...a) { emit('tone', a); },
  /* 额外光源（双方同步）：[[世界x, 世界y, 半径格, 强度]...]；null 清除 */
  lights(arr) { W.extraLights = arr || []; },
  /* 双人投票：两人各选一次。返回 {v, agree, h, g}；不一致时 v 取操作者的选择。单人时等同 ask */
  async vote(text, opts, who, o = {}) {
    const g = GEN;
    if (!SAPI.coop) { const v = await SAPI.ask(text, opts, who, o); return { v, agree: true, h: v, g: v }; }
    const r = await waitInput('dlg', { dlg: { id: ++DLGID, who: who || '', text, choices: opts, sel: 0, full: false, t0: RT, style: o.style || '', vote: { h: null, g: null } } });
    chk(g); W.dlg = null; return r;
  },
};
function markDone(id) { const d = store.get('done', []); if (!d.includes(id)) { d.push(id); store.set('done', d); } }

/* ---------------- 检查点 ---------------- */
function makeCP(name) {
  const maps = {};
  for (const k in W.maps) {
    const m = W.maps[k];
    maps[k] = { mods: Object.assign({}, m.mods), ents: m.ents.map(e => { const o = { id: e.id, px: e.px, py: e.py, dir: e.dir, hidden: e.hidden, alpha: e.alpha, spr: e.spr, solid: e.solid, s: e.s, follow: !!e.follow, light: e.light || null }; for (const v of VKEYS) if (e[v] !== undefined && typeof e[v] !== 'function') o[v] = e[v]; return o; }) };
  }
  const p = W.pl;
  return JSON.parse(JSON.stringify({ name: name || '', map: W.mapId, pl: { x: p.x, y: p.y, dir: p.dir, spr: p.spr, speed: p.speed, hidden: p.hidden }, inv: W.inv, f: W.f, goal: W.goal, mapDark: W.mapDark, plr: W.plr, amb: AU.ambName, maps }));
}
function applyCP(cp) {
  W.mapId = cp.map; W.inv = cp.inv.slice(); W.f = JSON.parse(JSON.stringify(cp.f)); W.goal = cp.goal; W.mapDark = Object.assign({}, cp.mapDark || {}); W.plr = cp.plr;
  for (const k in cp.maps) {
    const m = W.maps[k]; if (!m) continue; m.mods = Object.assign({}, cp.maps[k].mods); m.dirty = true;
    cp.maps[k].ents.forEach((o, i) => {
      let e = m.ents[i]; if (!e || e.id !== o.id) e = m.ents.find(z => z.id === o.id && o.id); if (!e) return;
      Object.assign(e, { px: o.px, py: o.py, dir: o.dir, hidden: o.hidden, alpha: o.alpha, spr: o.spr, solid: o.solid, s: Object.assign({}, o.s), follow: o.follow, light: o.light, chase: null, mv: null });
      for (const v of VKEYS) { if (typeof e[v] === 'function') continue; if (o[v] !== undefined) e[v] = o[v]; else if (e[v] !== undefined && !(v in e.def)) delete e[v]; }
      e.frozen = false;
    });
  }
  const p = W.pl; Object.assign(p, { x: cp.pl.x, y: cp.pl.y, px: cp.pl.x * TS, py: cp.pl.y * TS, dir: cp.pl.dir, spr: cp.pl.spr, speed: cp.pl.speed || 1, hidden: !!cp.pl.hidden, mv: null, prev: [cp.pl.x, cp.pl.y] });
  W.forceK++; lastPTile = W.mapId + ':' + p.x + ',' + p.y; W.cp = cp;
  if (cp.amb) emit('amb', cp.amb);
}

/* ---------------- 章节生命周期 ---------------- */
function startChapter(id, fromCp) {
  const ch = CHAPTERS.find(c => c.id === id); if (!ch) return;
  GEN++; DLGWAIT = null; FX.length = 0;
  W = newWorld(ch); W.ctrl = W.ctrl || 'h';
  if (NET.role !== 'solo') W.ctrl = NET.ctrlPref || 'h';
  lastPTile = W.mapId + ':' + W.pl.x + ',' + W.pl.y;
  UI.show('play'); camUpdate(0, true);
  const md = W.maps[W.mapId].def;
  emit('amb', md.amb || ch.amb || 'drone');
  const cp = fromCp ? store.get('cp.' + id, null) : null;
  if (cp) {
    applyCP(cp); camUpdate(0, true);
    const r = cp.name && ch.resume && ch.resume[cp.name];
    if (r) runScript(r);
  } else {
    W.cp = null;
    runScript(async S => {
      W.fade = 1;
      if (ch.intro) await ch.intro(S);
      await S.fade(0, 700);
      W.f['_v_' + W.mapId] = true;
      if (md.enter) await md.enter(S, true);
      if (!W.cp) S.cp();
    });
  }
  if (NET.role === 'host') netSnapshot(true);
}
function retryFromCP() {
  const ch = W.ch, cp = W.cp, ctrl = W.ctrl;
  GEN++; DLGWAIT = null; FX.length = 0;
  W = newWorld(ch); W.ctrl = ctrl;
  if (cp) applyCP(cp);
  camUpdate(0, true);
  runScript(async S => { W.fade = 1; await S.fade(0, 600); const r = cp && cp.name && ch.resume && ch.resume[cp.name]; if (r) await r(S); });
}
function quitChapter() { GEN++; DLGWAIT = null; W = null; FX.length = 0; AU.ambient('none'); }

/* ---------------- 动作处理（主机执行；客机发给主机） ---------------- */
function doAct(a, v, from) {
  if (!W) return;
  if (W.endScreen) {
    const es = W.endScreen; if (RT - es.t0 < .8) return;
    if ((es.kind === 'die' || es.kind === 'badend') && a === 'retry') { W.endScreen = null; const r = DLGWAIT; DLGWAIT = null; retryFromCP(); if (r) r.res(); }
    else if (a === 'leave') { W.endScreen = null; DLGWAIT = null; goSelect(); }
    else if (a === 'replay') { W.endScreen = null; DLGWAIT = null; store.del('cp.' + W.ch.id); startChapter(W.ch.id, false); }
    return;
  }
  if (W.card) { if ((a === 'adv' || a === 'use') && RT - W.card.t0 > .5) resolveWait(); return; }
  if (W.note) { if ((a === 'adv' || a === 'use') && RT - W.note.t0 > .3) resolveWait(); return; }
  if (W.keypad) {
    const k = W.keypad;
    if (a === 'key' && k.parts.length < k.len && k.keys.includes(v)) { k.parts.push(v); k.val = k.parts.join(k.sep); emit('sfx', 'select'); if (k.parts.length >= k.len) { const val = k.val; setTimeout(() => { if (W && W.keypad === k) resolveWait(val); }, 350); } }
    else if (a === 'keydel') { k.parts.pop(); k.val = k.parts.join(k.sep); }
    else if (a === 'keycancel' && k.cancel) resolveWait(null);
    return;
  }
  if (W.dlg && W.dlg.vote) {
    const d = W.dlg, full = d.full || (RT - d.t0) * CPS >= d.text.length;
    if (a === 'adv' && !full) { d.full = true; d.tFull = RT; return; }
    if (a === 'vote' && full && v != null && v >= 0 && v < d.choices.length) {
      if (RT - Math.max(d.t0 + d.text.length / CPS, d.tFull || 0) < .35) return;
      const who = from === 'g' ? 'g' : 'h'; if (d.vote[who] != null) return;
      d.vote[who] = v; emit('sfx', 'select');
      if (d.vote.h != null && d.vote.g != null) { const vt = d.vote; setTimeout(() => { if (W && W.dlg === d) { const agree = vt.h === vt.g; resolveWait({ v: agree ? vt.h : (W.ctrl === 'g' ? vt.g : vt.h), agree, h: vt.h, g: vt.g }); } }, 700); }
    }
    return;
  }
  if (W.dlg) {
    const d = W.dlg, full = d.full || (RT - d.t0) * CPS >= d.text.length;
    if (a === 'adv' || a === 'use') { if (!full) { d.full = true; d.tFull = RT; return; } if (RT - d.t0 < .15) return; if (d.choices) { if (RT - Math.max(d.t0 + d.text.length / CPS, d.tFull || 0) < .35) return; resolveWait(dlgRes(d, d.sel)); } else resolveWait(); }
    else if (a === 'sel' && d.choices && full) { d.sel = (d.sel + v + d.choices.length) % d.choices.length; emit('sfx', 'select'); }
    else if (a === 'pick' && d.choices) { if (RT - d.t0 < .2) return; d.full = true; d.sel = v; resolveWait(dlgRes(d, v)); }
    return;
  }
  if (a === 'use') interact();
}
const CPS = 38;
/* 投票对话在对方断线后退化为普通选择，返回值仍保持 vote 的形状 */
function dlgRes(d, x) { return d.wasVote ? { v: x, agree: true, h: x, g: x } : x; }
function voteFallback() { const d = W && W.dlg; if (d && d.vote) { const h = d.vote.h; d.vote = null; d.wasVote = true; if (h != null) resolveWait(dlgRes(d, h)); } }
function resolveWait(v) { const r = DLGWAIT; DLGWAIT = null; if (r) r.res(v); }
