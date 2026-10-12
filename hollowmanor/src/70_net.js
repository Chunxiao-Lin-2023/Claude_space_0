/* ================= networking (PeerJS, host authoritative, exactly 2 players) ================= */
const inArtifact = () => !!(window.claude && typeof window.claude.use === 'function') || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname) || !!window.__ARTIFACT__;
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', hostName: '', roles: ['L', 'S'], ready: [false, false], seen: 0, sT: 0, iT: 0, lastSnap: 0 };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const linkUp = () => NETROLE === 'host' ? !!(NET.gctl && NET.gctl.open) : NETROLE === 'guest' ? !!(NET.ctl && NET.ctl.open) : NETROLE === 'solo';
function sendRaw(c, o) { try { if (c && c.open) c.send(JSON.stringify(o)); } catch (e) { } }
function netSendCtl(o) { sendRaw(NETROLE === 'host' ? NET.gctl : NET.ctl, o); }
function netSendFast(o) { const c = NETROLE === 'host' ? (NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl) : (NET.snap && NET.snap.open ? NET.snap : NET.ctl); sendRaw(c, o); }
function netLeave() {
  try { netSendCtl({ t: 'bye' }); } catch (e) { }
  try { NET.peer && NET.peer.destroy(); } catch (e) { }
  Object.assign(NET, { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', ready: [false, false] });
  NETROLE = null;
}
function onEmit(e) { if (NETROLE === 'host') netSendCtl({ t: 'ev', e }); }
/* ---------- host ---------- */
async function netHost() {
  netLeave(); NETROLE = 'host'; lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer('hollowmanor-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => lobbyUI());
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!linkUp()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (conn.label === 'snap') { if (NET.gctl && conn.peer === NET.gctl.peer) { NET.gsnap = conn; conn.on('data', d => { try { hostRecv(JSON.parse(d), true); } catch (e) { } }); } else conn.close(); return; }
      if (NET.gctl && NET.gctl.open) { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy' })); setTimeout(() => conn.close(), 300); }); return; }
      NET.gctl = conn;
      conn.on('open', () => { NET.seen = performance.now(); });
      conn.on('data', d => { try { hostRecv(JSON.parse(d), false); } catch (e) { console.error(e); } });
      conn.on('close', () => { if (NET.gctl === conn) guestGone(); });
    });
  };
  open(0);
}
function hostRecv(m, fast) {
  NET.seen = performance.now();
  if (m.t === 'hello') { NET.guestName = (m.name || '朋友').slice(0, 10); NET.ready[1] = false; sendLobby(); lobbyUI(); sfx('quick'); return; }
  if (m.t === 'bye') { guestGone(); return; }
  if (m.t === 'ready') { NET.ready[1] = !!m.v; sendLobby(); lobbyUI(); return; }
  if (m.t === 'role') { if (STATE.mode === 'lobby') { NET.roles = m.v === 'L' ? ['S', 'L'] : ['L', 'S']; NET.ready = [false, false]; sendLobby(); lobbyUI(); } return; }
  if (!W || STATE.mode !== 'play') return;
  const p = W.p[1];
  switch (m.t) {
    case 'i': // guest input + its own position (client-authoritative movement)
      if (m.n < (p.inSeq || 0)) return; p.inSeq = m.n;
      if (p.hide < 0) { p.x = m.x; p.z = m.z; p.spd = m.s; p.run = !!m.r; p.stam = m.st; }
      p.a = m.a; p.aim = m.aim;
      Object.assign(p.inp, { aim: m.aim, act: m.act, hold: !!m.h, press: m.pr, boost: m.b, run: !!m.r });
      break;
    case 'door': { const st = W.doors[m.i]; if (st && !st.locked && st.tgt < 1) { st.tgt = 1; const d = MAP.doors[m.i]; snd('doorOpen', d.cx, d.cz, 0.8); } break; }
    case 'dial': setDial(1, m.i, m.v); break;
    case 'rit': startRitual(1, m.item); break;
    case 'ping': emit({ k: 'ping', by: 1, x: m.x, z: m.z, kind: m.kind }); break;
    case 'quick': emit({ k: 'quick', by: 1, q: m.q }); break;
    case 'glyph': emit({ k: 'glyph', by: 1, g: m.g }); break;
  }
}
addEventListener('pagehide', () => { try { netSendCtl({ t: 'bye' }); } catch (e) { } });
function guestGone() {
  NET.gctl = null; NET.gsnap = null; NET.guestName = ''; NET.ready[1] = false;
  if (STATE.mode === 'play') { say('同伴断开了连接。等待重连……（按 Esc 返回大厅）', -1, '#ff6b6b'); W.dc = 1; }
  lobbyUI();
}
function sendLobby() { netSendCtl({ t: 'lobby', roles: NET.roles, ready: NET.ready, host: SET.name || '房主', code: NET.code }); }
function hostStart() {
  if (!NET.gctl || !NET.gctl.open) return;
  const seed = (Math.random() * 1e9) | 0, names = [SET.name || ROLES[NET.roles[0]].who, NET.guestName || ROLES[NET.roles[1]].who];
  netSendCtl({ t: 'start', seed, roles: NET.roles, names });
  startGame(seed, NET.roles, names, 0);
}
/* snapshot: compact arrays */
const GST = ['roam', 'warn', 'hunt', 'stun', 'ritual', 'banish', 'gone'];
const r2 = v => Math.round(v * 100) / 100;
function makeSnap() {
  const P = p => [r2(p.x), r2(p.z), r2(p.a), r2(p.aim), r2(p.spd), p.run ? 1 : 0, Math.round(p.fear), Math.round(p.batt * 100), p.boostT > 0 ? 1 : 0, p.down ? 1 : 0, Math.round(p.downT), p.hide, p.act ? p.act.id : -1, p.act ? Math.round(p.act.p * 100) : 0, r2(p.stam)];
  const G = W.g;
  return { t: 's', T: r2(W.t), ph: W.phase, p: W.p.map(P), g: [r2(G.x), r2(G.z), r2(G.a), GST.indexOf(G.st), r2(G.man), r2(G.fade), r2(G.spd)],
    d: W.doors.map(d => [Math.round(d.open * 100), d.tgt, d.locked ? 1 : 0]), lv: W.lv.map(r2), dl: W.dials, f: W.f, it: W.items.map(i => i.taken), inv: W.inv, ef: W.evFound,
    fl: r2(W.flick), hA: W.hideA.map(r2), occ: W.occ, st: W.stats, rit: W.rit ? [W.rit.item, W.rit.by, r2(W.rit.p)] : null, sq: W.seq };
}
function hostNetTick(dt) {
  if (!NET.gctl || !NET.gctl.open) return;
  if (performance.now() - NET.seen > 8000) { try { NET.gctl.close(); } catch (e) { } guestGone(); return; }
  NET.sT -= dt; if (NET.sT <= 0) { NET.sT = 1 / 20; const s = makeSnap(); sendRaw(NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl, s); }
}
/* ---------- guest ---------- */
async function netJoin(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { lobbyUI('房间码是 4 位'); return; }
  netLeave(); NETROLE = 'guest'; lobbyUI('正在连接…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer; NET.code = code;
  peer.on('error', err => { if (!linkUp()) { lobbyUI(err.type === 'peer-unavailable' ? '找不到这个房间' : '连接失败（' + err.type + '）'); NETROLE = null; } });
  peer.on('open', () => {
    const ctl = peer.connect('hollowmanor-' + code, { label: 'ctl', reliable: true, serialization: 'raw' });
    NET.ctl = ctl;
    ctl.on('open', () => { sendRaw(ctl, { t: 'hello', name: SET.name || '' }); const sn = peer.connect('hollowmanor-' + code, { label: 'snap', reliable: false, serialization: 'raw' }); NET.snap = sn; sn.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { } }); lobbyUI(); });
    ctl.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    ctl.on('close', () => { if (NET.ctl === ctl) hostGone(); });
  });
}
function hostGone() { const wasPlay = STATE.mode === 'play'; netLeave(); if (wasPlay) { toast('房主断开了连接', '#ff6b6b'); } showScreen('title'); lobbyUI('房主断开了连接'); }
function guestRecv(m) {
  NET.seen = performance.now();
  switch (m.t) {
    case 'busy': lobbyUI('房间已满或已经开始'); netLeave(); return;
    case 'bye': hostGone(); return;
    case 'lobby': NET.roles = m.roles; NET.ready = m.ready; NET.hostName = m.host; lobbyUI(); return;
    case 'start': startGame(m.seed, m.roles, m.names, 1); return;
    case 'toLobby': backToLobby(); return;
    case 'ev': if (W && m.e.s > (W.seq || 0)) { W.E.push(m.e); if (W.E.length > 80) W.E.shift(); W.seq = m.e.s; } return;
    case 's': if (W) applySnap(m); return;
  }
}
function applySnap(s) {
  if (s.T < (NET.lastT || 0) - 5) return; NET.lastT = s.T; NET.lastSnap = performance.now();
  W.t = s.T; W.now = s.T; W.phase = s.ph;
  s.p.forEach((a, i) => {
    const p = W.p[i], mine = i === ME;
    const [x, z, ang, aim, spd, run, fear, batt, boost, down, downT, hide, act, actP, stam] = a;
    const wasHide = p.hide, wasDown = p.down;
    p.fear = fear; p.batt = batt / 100; p.boostT = boost ? 0.2 : 0; p.down = !!down; p.downT = downT; p.hide = hide; p.act = act >= 0 ? { id: act, p: actP / 100 } : null;
    if (!mine) { p.tx = x; p.tz = z; p.a = ang; p.aim = aim; p.spd = spd; p.run = !!run; p.stam = stam; if (p.x == null || dist(p.x, p.z, x, z) > 4) { p.x = x; p.z = z; } }
    else if ((wasHide >= 0 && hide < 0) || (wasHide < 0 && hide >= 0) || wasDown !== p.down || dist(p.x, p.z, x, z) > 3) { p.x = x; p.z = z; }
  });
  const G = W.g, [gx, gz, ga, gst, man, fade, gspd] = s.g;
  G.tx = gx; G.tz = gz; G.a = ga; G.st = GST[gst]; G.man = man; G.fade = fade; G.spd = gspd; if (G.x == null || dist(G.x, G.z, gx, gz) > 5) { G.x = gx; G.z = gz; }
  s.d.forEach((d, i) => { W.doors[i].open = d[0] / 100; W.doors[i].tgt = d[1]; W.doors[i].locked = !!d[2]; });
  W.lv = s.lv; W.dials = s.dl; W.f = s.f; s.it.forEach((v, i) => W.items[i].taken = v); W.inv = s.inv; W.evFound = s.ef; W.flick = s.fl; W.hideA = s.hA; W.occ = s.occ; W.stats = s.st;
  W.rit = s.rit ? { item: s.rit[0], by: s.rit[1], p: s.rit[2] } : null;
}
function guestNetTick(dt) {
  if (!NET.ctl || !NET.ctl.open || !W) return;
  if (performance.now() - NET.seen > 8000) { hostGone(); return; }
  // smooth remote entities
  const o = W.p[1 - ME]; if (o.tx != null) { const k = Math.min(1, dt * 12); o.x = lerp(o.x, o.tx, k); o.z = lerp(o.z, o.tz, k); }
  const G = W.g; if (G.tx != null) { const k = Math.min(1, dt * 10); G.x = lerp(G.x, G.tx, k); G.z = lerp(G.z, G.tz, k); }
  NET.iT -= dt; if (NET.iT <= 0) { NET.iT = 1 / 30; const p = W.p[ME], i = p.inp; NET.inN = (NET.inN || 0) + 1;
    netSendFast({ t: 'i', n: NET.inN, x: r2(p.x), z: r2(p.z), a: r2(p.a), aim: r2(i.aim), s: r2(p.spd), r: p.run ? 1 : 0, st: r2(p.stam), act: i.act, h: i.hold ? 1 : 0, pr: i.press, b: i.boost }); }
}
/* actions that need the host */
function requestPing() {
  if (!W || STATE.mode !== 'play') return; const me = W.p[ME];
  let x, z; const usingMouse = performance.now() - INP.mouseT < 4000 && performance.now() - INP.lastTouch > 1500;
  if (usingMouse) { const gp = groundAt(INP.mx, INP.my); if (gp) { x = gp.x; z = gp.z; } }
  if (x == null) { x = me.x + Math.cos(me.aim) * 3; z = me.z + Math.sin(me.aim) * 3; }
  const it = MAP.inter.concat(W.items.filter(i => !i.taken).map(i => ({ k: 'item', x: i.x, z: i.z }))).find(i => dist(i.x, i.z, x, z) < 1.2);
  const kind = it ? 'thing' : 'here';
  if (NETROLE === 'guest') netSendCtl({ t: 'ping', x: r2(x), z: r2(z), kind }); else emit({ k: 'ping', by: ME, x, z, kind });
}
function requestQuick(q) { if (!W || STATE.mode !== 'play') return; document.getElementById('quickPanel').classList.add('hidden'); if (NETROLE === 'guest') netSendCtl({ t: 'quick', q }); else emit({ k: 'quick', by: ME, q }); }
function requestGlyph(g) { if (!W || STATE.mode !== 'play') return; if (NETROLE === 'guest') netSendCtl({ t: 'glyph', g }); else emit({ k: 'glyph', by: ME, g }); }
function requestDial(i, v) { if (NETROLE === 'guest') { netSendCtl({ t: 'dial', i, v }); W.dials[i] = ((v % 6) + 6) % 6; } else setDial(ME, i, v); }
function requestRitual(item) { if (NETROLE === 'guest') netSendCtl({ t: 'rit', item }); else startRitual(ME, item); }
