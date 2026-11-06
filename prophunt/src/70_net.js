/* ================= networking (PeerJS, host authoritative; guest owns its own position in realtime) ================= */
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', hostName: '', seen: 0, pingT: 0, sendT: 0, q: 0, lastQ: -1, tgt: null, lobby: { mode: 'rt', first: 'host' } };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const linkUp = () => NETROLE === 'host' ? !!(NET.gctl && NET.gctl.open) : NETROLE === 'guest' ? !!(NET.ctl && NET.ctl.open) : false;
const roundJSON = o => JSON.stringify(o, (k, v) => typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(3) : v);
function sendRaw(c, o) { try { if (c && c.open) c.send(typeof o === 'string' ? o : roundJSON(o)); } catch (e) { } }
function recvRaw(d, fn) { let m; try { m = JSON.parse(d); } catch (e) { return; } try { fn(m); } catch (e) { console.error(e); } }
const netSend = o => sendRaw(NETROLE === 'host' ? NET.gctl : NET.ctl, o);
const snapSend = o => { const c = NETROLE === 'host' ? (NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl) : (NET.snap && NET.snap.open ? NET.snap : NET.ctl); sendRaw(c, o); };
function netLeave() {
  try { netSend({ t: 'bye' }); } catch (e) { }
  try { NET.peer && NET.peer.destroy(); } catch (e) { }
  Object.assign(NET, { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', lastQ: -1, tgt: null });
  NETROLE = null;
}
addEventListener('pagehide', () => { try { netSend({ t: 'bye' }); } catch (e) { } });

/* ---------- host ---------- */
async function netHost() {
  if (inArtifact()) { titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); return; }
  netLeave(); NETROLE = 'host'; ME = 0; G = null; showScreen('lobby'); STATE.mode = 'lobby'; lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer('prophunt-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => lobbyUI(''));
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!linkUp()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (conn.label === 'snap') { conn.on('open', () => { NET.gsnap = conn; }); conn.on('data', d => recvRaw(d, hostRecv)); return; }
      if ((NET.gctl && NET.gctl.open) || STATE.mode === 'play') { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy' })); setTimeout(() => conn.close(), 300); }); return; }
      NET.gctl = conn;
      conn.on('open', () => { NET.seen = performance.now(); });
      conn.on('data', d => recvRaw(d, hostRecv));
      conn.on('close', () => { if (NET.gctl === conn) guestGone(); });
    });
  };
  open(0);
}
function hostRecv(m) {
  if (NETROLE !== 'host') return;
  NET.seen = performance.now();
  switch (m.t) {
    case 'hello': NET.guestName = (m.name || '玩家二').slice(0, 8); sendLobby(); lobbyUI(); sfx('ready'); return;
    case 'bye': guestGone(); return;
    case 'ping': return;
    case 'p':
      if (G && G.mode === 'rt' && (G.phase === 'hide' || G.phase === 'seek') && m.r === G.round) {
        const p = G.pl[1]; p.x = m.x; p.y = m.y; p.d = m.d; p.mv = m.mv; p.dg = m.dg && T[m.dg.k] ? m.dg : null;
      }
      return;
    case 'act': { if (!G || STATE.mode !== 'play') return; const err = doAct(1, m.a, m.v || {}); if (err) sendRaw(NET.gctl, { t: 'err', msg: err }); return; }
  }
}
function guestGone() {
  NET.gctl = null; NET.gsnap = null; NET.guestName = '';
  if (STATE.mode === 'play' || STATE.mode === 'end') { toast('对方断开了连接，可以用同一个房间码重新加入', 'bad'); hideEnd(); showScreen('lobby'); STATE.mode = 'lobby'; }
  if (STATE.mode === 'lobby') lobbyUI();
}
function sendLobby() { sendRaw(NET.gctl, { t: 'lobby', host: myName() || '房主', code: NET.code, lobby: NET.lobby, score: NET.score || [0, 0] }); }
function hostStart(next) {
  if (!linkUp()) return;
  const L = NET.lobby, prev = next && G ? G : null;
  const hider = prev ? 1 - prev.hider : L.first === 'host' ? 0 : L.first === 'guest' ? 1 : (Math.random() < .5 ? 0 : 1);
  newRound({ seed: (Math.random() * 1e9) | 0, mode: prev ? prev.mode : L.mode, hider, score: prev ? prev.score.slice() : (NET.score || [0, 0]).slice(), round: prev ? prev.round + 1 : 1, names: [myName() || '房主', NET.guestName || '玩家二'] });
  NET.q = 0; sendRaw(NET.gctl, { t: 'st', G }); enterGame();
}
function hostNetTick(dt) {
  if (!NET.gctl || !NET.gctl.open) return;
  if (performance.now() - NET.seen > 15000) { try { NET.gctl.close(); } catch (e) { } guestGone(); return; }
  if ((NET.pingT -= dt) <= 0) { NET.pingT = 3; sendRaw(NET.gctl, { t: 'ping' }); }
  if (G && (STATE.mode === 'play') && (NET.sendT -= dt) <= 0) { NET.sendT = 0.05; G.q = ++NET.q; snapSend({ t: 'st', G }); }
}

/* ---------- guest ---------- */
async function netJoin(code) {
  if (inArtifact()) { titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); return; }
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { titleStatus('房间码是 4 位'); return; }
  netLeave(); NETROLE = 'guest'; ME = 1; G = null; titleStatus('正在连接…');
  try { await loadPeer(); } catch (e) { NETROLE = null; titleStatus('联机组件加载失败，请检查网络'); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer; NET.code = code;
  peer.on('error', err => { if (!linkUp()) { titleStatus(err.type === 'peer-unavailable' ? '找不到这个房间' : '连接失败（' + err.type + '）'); NETROLE = null; } });
  peer.on('open', () => {
    const ctl = peer.connect('prophunt-' + code, { label: 'ctl', reliable: true, serialization: 'raw' });
    NET.ctl = ctl;
    ctl.on('open', () => {
      NET.seen = performance.now(); sendRaw(ctl, { t: 'hello', name: myName() }); titleStatus('');
      const sn = peer.connect('prophunt-' + code, { label: 'snap', reliable: false, serialization: 'raw' }); NET.snap = sn; sn.on('data', d => recvRaw(d, guestRecv));
      if (STATE.mode !== 'play') { showScreen('lobby'); STATE.mode = 'lobby'; lobbyUI(); }
    });
    ctl.on('data', d => recvRaw(d, guestRecv));
    ctl.on('close', () => { if (NET.ctl === ctl) hostGone(); });
  });
}
function hostGone() { const was = STATE.mode; netLeave(); hideEnd(); if (was !== 'title') { toTitle(); titleStatus('房主断开了连接'); } }
function guestRecv(m) {
  if (NETROLE !== 'guest') return;
  NET.seen = performance.now();
  switch (m.t) {
    case 'busy': titleStatus('房间已满或已经开始'); netLeave(); toTitle(); return;
    case 'bye': hostGone(); return;
    case 'ping': sendRaw(NET.ctl, { t: 'ping' }); return;
    case 'lobby': NET.hostName = m.host; NET.lobby = m.lobby; NET.score = m.score; lobbyUI(); return;
    case 'st': applyState(m.G); return;
    case 'ev': if (G) handleEv(m.ev); return;
    case 'err': toast(m.msg, 'bad'); sfx('err'); return;
  }
}
function applyState(ng) {
  const fresh = !G || ng.seed !== G.seed || ng.round !== G.round;
  if (!fresh) {
    if (ng.q <= NET.lastQ && ng.q) return;
    if (G.phase === 'end' && ng.phase !== 'end') return;
  }
  NET.lastQ = ng.q || 0;
  const mine = !fresh && ng.mode === 'rt' && (ng.phase === 'hide' || ng.phase === 'seek') ? G.pl[ME] : null;
  const prevO = !fresh && G ? G.pl[1 - ME] : null;
  G = ng;
  if (fresh) { MAP = genMap(G.seed); enterGame(); }
  if (mine) G.pl[ME] = mine;
  const o = G.pl[1 - ME]; NET.tgt = { x: o.x, y: o.y };
  if (prevO && Math.hypot(prevO.x - o.x, prevO.y - o.y) < 2.5) { o.x = prevO.x; o.y = prevO.y; }
}
function guestNetTick(dt) {
  if (!NET.ctl || !NET.ctl.open) return;
  if (performance.now() - NET.seen > 15000) { hostGone(); return; }
  if (G && NET.tgt) { const o = G.pl[1 - ME], k = 1 - Math.exp(-dt * 14); o.x += (NET.tgt.x - o.x) * k; o.y += (NET.tgt.y - o.y) * k; }
  if (G && STATE.mode === 'play' && G.mode === 'rt' && (NET.sendT -= dt) <= 0) { NET.sendT = 1 / 30; const p = G.pl[ME]; snapSend({ t: 'p', r: G.round, x: p.x, y: p.y, d: p.d, mv: p.mv, dg: p.dg }); }
}
