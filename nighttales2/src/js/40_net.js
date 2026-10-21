/* ================= 十夜怪谈 · 联机（PeerJS，主机权威，共享一个角色） ================= */
const NET = { role: 'solo', peer: null, ctl: null, snap: null, code: '', up: false, ctrlPref: 'h', snapT: 0, posT: 0, lastV: null, myK: -1, scene: 'title' };
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1', debug: 0 } : { debug: 0 };
const CODECH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() { let s = ''; for (let i = 0; i < 4; i++) s += CODECH[(Math.random() * CODECH.length) | 0]; return s; }
const NET_OK = typeof window.Peer === 'function' && !window.__ARTIFACT__;

function netSend(o) { const c = NET.ctl; if (c && c.open) try { c.send(JSON.stringify(o)); } catch (e) { } }
function netSendFast(o) { const c = (NET.snap && NET.snap.open) ? NET.snap : NET.ctl; if (c && c.open) try { c.send(JSON.stringify(o)); } catch (e) { } }
function netClose() {
  try { NET.ctl && NET.ctl.close(); } catch (e) { } try { NET.snap && NET.snap.close(); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { }
  Object.assign(NET, { role: 'solo', peer: null, ctl: null, snap: null, code: '', up: false, lastV: null, myK: -1 });
}

function hostRoom(onState) {
  netClose(); NET.role = 'host'; const code = NET.code = genCode();
  const peer = NET.peer = new Peer('nighttales2-' + code, PEER_OPTS);
  peer.on('open', () => onState('open', code));
  peer.on('error', err => { if (err.type === 'unavailable-id') { hostRoom(onState); return; } onState('error', err.type || String(err)); });
  peer.on('connection', c => {
    c.on('open', () => {
      if (c.label === 'snap') { NET.snap = c; return; }
      if (NET.ctl && NET.ctl.open) { c.close(); return; }   // 只接一位
      NET.ctl = c; NET.up = true; onState('joined');
      netSend({ t: 'hello', scene: UI.scene });
      if (W) netSnapshot(true);
    });
    c.on('data', d => { try { onNetHost(JSON.parse(d)); } catch (e) { console.error(e); } });
    c.on('close', () => { if (c === NET.ctl) { NET.ctl = null; NET.up = false; if (W) { W.ctrl = 'h'; W.req = null; voteFallback(); } UI.toast('对方已断开，你可以继续单人游玩'); UI.netChanged(); } });
  });
}
function joinRoom(code, onState) {
  netClose(); NET.role = 'guest'; NET.code = code;
  const peer = NET.peer = new Peer(undefined, PEER_OPTS);
  let to = setTimeout(() => onState('error', 'timeout'), 12000);
  peer.on('error', err => { clearTimeout(to); onState('error', err.type || String(err)); });
  peer.on('open', () => {
    const id = 'nighttales2-' + code;
    const ctl = NET.ctl = peer.connect(id, { label: 'ctl', reliable: true, serialization: 'raw' });
    ctl.on('open', () => {
      clearTimeout(to); NET.up = true; onState('joined');
      const snap = NET.snap = peer.connect(id, { label: 'snap', reliable: false, serialization: 'raw' });
      snap.on('data', d => { try { onNetGuest(JSON.parse(d)); } catch (e) { } });
    });
    ctl.on('data', d => { try { onNetGuest(JSON.parse(d)); } catch (e) { console.error(e); } });
    ctl.on('close', () => { NET.up = false; UI.toast('与房主的连接已断开'); netClose(); quitChapter(); UI.show('title'); UI.netChanged(); });
  });
}

/* ---------- 主机：收到客机消息 ---------- */
function onNetHost(m) {
  if (!W && m.t !== 'ping') return;
  switch (m.t) {
    case 'act':
      if (['retry', 'leave', 'replay'].includes(m.a)) doAct(m.a, m.v, 'g');
      else if (m.a === 'vote') doAct('vote', m.v, 'g');
      else if (m.a === 'mretry') { if (W && W.cp) retryFromCP(); }
      else if (W && W.ctrl === 'g') doAct(m.a, m.v, 'g');
      break;
    case 'pos':
      if (W && W.ctrl === 'g' && !W.busy && m.k === W.forceK && m.map === W.mapId) {
        const p = W.pl; p.x = m.x; p.y = m.y; p.px = m.px; p.py = m.py; p.dir = m.d; p.fr = m.fr; if (m.pv) p.prev = m.pv;
        p.rmv = !!m.mv; p.rrun = !!m.rn; p.rT = RT;
      } break;
    case 'req': if (W.ctrl === 'g') { W.ctrl = 'h'; W.req = null; UI.toast('对方把操作交给了你'); } else { W.req = 'g'; AU.sfx('select'); } break;
    case 'ans': if (W.req === 'h') { if (m.y) { W.ctrl = 'h'; UI.toast('对方同意了，你来操作'); } else UI.toast('对方暂时不想交出操作'); W.req = null; } break;
    case 'ping': PINGS.push({ x: m.x, y: m.y, t: RT, c: '#7ad7ff' }); AU.sfx('select'); netSend({ t: 'pingb', x: m.x, y: m.y }); break;
  }
}
/* ---------- 客机：收到主机消息 ---------- */
function onNetGuest(m) {
  switch (m.t) {
    case 'hello': case 'scene':
      if (m.scene === 'select' || m.scene === 'title') { if (W) quitChapter(); UI.show('select'); } break;
    case 'v': applyV(m); break;
    case 'fx': applyEmit(m.k, m.a); break;
    case 'note': { const got = store.get('notes', []); if (!got.includes(m.k)) { got.push(m.k); store.set('notes', got); } break; }
    case 'done': markDone(m.ch); break;
    case 'endrec': { const got = store.get('ends', []); if (!got.includes(m.k)) { got.push(m.k); store.set('ends', got); } break; }
    case 'pingb': PINGS.push({ x: m.x, y: m.y, t: RT, c: '#7ad7ff' }); break;
    case 'pingh': PINGS.push({ x: m.x, y: m.y, t: RT, c: '#ffcf5a' }); AU.sfx('select'); break;
  }
}

/* ---------- 主机快照 ---------- */
function netTick(dt) {
  if (NET.role !== 'host' || !NET.up) return;
  NET.snapT -= dt; if (NET.snapT > 0) return; NET.snapT = 1 / 20;
  netSnapshot();
}
function netSnapshot() {
  if (NET.role !== 'host' || !NET.up || !W) return;
  const m = curMap(), p = W.pl;
  const ents = m.ents.map((e, i) => {
    const fl = {}; let any = false; for (const k of VKEYS) if (e[k] !== undefined && e[k] !== e.def[k]) { fl[k] = e[k]; any = true; }
    const s = Object.keys(e.s).length ? e.s : 0;
    return [i, Math.round(e.px), Math.round(e.py), e.dir, e.fr, e.hidden ? 1 : 0, Math.round((e.alpha ?? 1) * 100), e.spr === e.def.spr ? 0 : e.spr, any ? fl : 0, s, e.light === e.def.light ? 0 : (e.light || null), e.bubble && e.bubble.until > RT ? [e.bubble.k, Math.round((e.bubble.until - RT) * 1000)] : 0, e.solid ? 1 : 0];
  });
  const v = {
    t: 'v', gen: GEN, ch: W.ch.id, map: W.mapId, k: W.forceK, pl: [p.x, p.y, Math.round(p.px), Math.round(p.py), p.dir, p.fr, p.hidden ? 1 : 0, p.spr, p.speed || 1, p.bubble && p.bubble.until > RT ? [p.bubble.k, Math.round((p.bubble.until - RT) * 1000)] : 0],
    ctrl: W.ctrl, req: W.req || null, busy: W.busy, fade: Math.round(W.fade * 100) / 100, dark: W.mapDark[W.mapId] ?? null, plr: W.plr, goal: W.goal, inv: W.inv,
    timer: W.timer ? [W.timer.label, Math.round(W.timer.left * 10) / 10] : null, nr: !!W.noRun, dlg: W.dlg, card: W.card, note: W.note, keypad: W.keypad, end: W.endScreen || null,
    ents, mods: m.mods, cf: W.camFocus || null, ended: W.ended, paused: false, xl: W.extraLights && W.extraLights.length ? W.extraLights : 0
  };
  const s = JSON.stringify(v);
  const c = (NET.snap && NET.snap.open && s.length < 15000) ? NET.snap : NET.ctl;
  if (c && c.open) try { c.send(s); } catch (e) { }
}
/* ---------- 客机：应用快照（镜像世界） ---------- */
function applyV(v) {
  const ch = CHAPTERS.find(c => c.id === v.ch); if (!ch) return;
  if (!W || W.ch.id !== v.ch || W._gen !== v.gen) { GEN++; W = newWorld(ch); W._gen = v.gen; if (UI.scene !== 'play') UI.show('play'); NET.myK = -1; FX.length = 0; }
  const mapChanged = W.mapId !== v.map; W.mapId = v.map;
  const m = curMap();
  if (JSON.stringify(m.mods) !== JSON.stringify(v.mods || {})) { m.mods = v.mods || {}; m.dirty = true; }
  for (const a of v.ents) {
    const e = m.ents[a[0]]; if (!e) continue;
    const wasHidden = e.hidden;
    e._tx = a[1]; e._ty = a[2]; e.dir = a[3]; e.fr = a[4]; e.hidden = !!a[5]; e.alpha = a[6] / 100;
    if (wasHidden || mapChanged || Math.abs(e.px - a[1]) + Math.abs(e.py - a[2]) > 40) { e.px = a[1]; e.py = a[2]; }
    e.spr = a[7] === 0 ? e.def.spr : a[7];
    for (const k of VKEYS) { if (a[8] && k in a[8]) e[k] = a[8][k]; else e[k] = e.def[k]; }
    e.s = a[9] || {}; e.light = a[10] === 0 ? e.def.light : a[10];
    e.bubble = a[11] ? { k: a[11][0], until: RT + a[11][1] / 1000 } : null;
    if (a[12] != null) e.solid = !!a[12];
  }
  const p = W.pl, P = v.pl;
  const local = v.ctrl === 'g' && !v.busy && NET.myK === v.k && !mapChanged;
  if (!local) {
    const jump = mapChanged || NET.myK !== v.k || Math.abs(p.px - P[2]) + Math.abs(p.py - P[3]) > 48;
    p.x = P[0]; p.y = P[1]; p._tx = P[2]; p._ty = P[3]; p.dir = P[4]; p.fr = P[5];
    if (jump) { p.px = P[2]; p.py = P[3]; p.mv = null; }
    NET.myK = v.k;
  }
  p.hidden = !!P[6]; p.spr = P[7]; p.speed = P[8]; p.bubble = P[9] ? { k: P[9][0], until: RT + P[9][1] / 1000 } : null;
  W.ctrl = v.ctrl; W.req = v.req; W.busy = v.busy; W.fade = v.fade; W.mapDark = { [v.map]: v.dark }; W.plr = v.plr; W.goal = v.goal; W.inv = v.inv;
  W.timer = v.timer ? { label: v.timer[0], left: v.timer[1] } : null; W.camFocus = v.cf; W.ended = v.ended; W.noRun = v.nr; W.extraLights = v.xl || [];
  const keepT = (cur, nv) => { if (!nv) return null; if (cur && cur.id === nv.id) { nv.t0 = cur.t0; } else nv.t0 = RT; return nv; };
  W.dlg = keepT(W.dlg, v.dlg); W.card = keepT(W.card, v.card); W.note = keepT(W.note, v.note); W.keypad = keepT(W.keypad, v.keypad);
  if (v.end) { if (!W.endScreen || W.endScreen.kind !== v.end.kind || W.endScreen.title !== v.end.title) { W.endScreen = v.end; W.endScreen.t0 = RT; } } else W.endScreen = null;
  if (mapChanged) camUpdate(0, true);
}
function guestTick(dt) {
  const m = curMap(); if (!m) return;
  const k = Math.min(1, dt * 14);
  for (const e of m.ents) if (e._tx != null) { e.px += (e._tx - e.px) * k; e.py += (e._ty - e.py) * k; if (Math.abs(e._tx - e.px) < .3) e.px = e._tx; if (Math.abs(e._ty - e.py) < .3) e.py = e._ty; }
  const p = W.pl;
  if (!(iControl() && !W.busy) && p._tx != null) { p.px += (p._tx - p.px) * k; p.py += (p._ty - p.py) * k; }
}
function guestSendPos(dt) {
  NET.posT -= dt; if (NET.posT > 0) return; NET.posT = 1 / 30;
  const p = W.pl;
  netSendFast({ t: 'pos', k: NET.myK, map: W.mapId, x: p.x, y: p.y, px: Math.round(p.px), py: Math.round(p.py), d: p.dir, fr: p.fr, pv: p.prev, mv: p.mv ? 1 : 0, rn: p.mv && p.run ? 1 : 0 });
}
/* ---------- 操作权交接 ---------- */
function ctrlButton() {   // T 键 / 按钮：操作者=交出，观看者=请求
  if (!W || NET.role === 'solo' || !NET.up) return;
  if (NET.role === 'host') {
    if (W.ctrl === 'h') { W.ctrl = 'g'; W.req = null; UI.toast('已把操作交给对方'); }
    else { W.req = W.req === 'h' ? null : 'h'; if (W.req) UI.toast('已请求操作，等待对方同意'); }
  } else {
    netSend({ t: 'req' });
    if (W.ctrl !== 'g') UI.toast('已请求操作，等待对方同意');
  }
  AU.sfx('select');
}
function ctrlAnswer(yes) {
  if (!W || !W.req) return;
  if (NET.role === 'host' && W.ctrl === 'h' && W.req === 'g') { if (yes) { W.ctrl = 'g'; UI.toast('已把操作交给对方'); } W.req = null; return true; }
  if (NET.role === 'guest' && W.ctrl === 'g' && W.req === 'h') { netSend({ t: 'ans', y: !!yes }); W.req = null; return true; }
  return false;
}
function sendAct(a, v) { if (NET.role === 'guest') netSend({ t: 'act', a, v }); else doAct(a, v); }
function sendPing(wx, wy) {
  if (NET.role === 'guest') netSend({ t: 'ping', x: wx, y: wy });
  else { PINGS.push({ x: wx, y: wy, t: RT, c: '#ffcf5a' }); if (NET.role === 'host') netSend({ t: 'pingh', x: wx, y: wy }); }
}
