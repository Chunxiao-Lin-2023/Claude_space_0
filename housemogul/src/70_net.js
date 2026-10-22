/* ================= networking (PeerJS, host authoritative, whole-state sync) ================= */
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', ctl: null, gctl: null, guestName: '', hostName: '', ready: false, seen: 0, pingT: 0, ai: 0, opt: null, preset: 'pure', chunks: {} };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const linkUp = () => NETROLE === 'host' ? !!(NET.gctl && NET.gctl.open) : NETROLE === 'guest' ? !!(NET.ctl && NET.ctl.open) : false;
const roundJSON = o => JSON.stringify(o, (k, v) => typeof v === 'number' && !Number.isInteger(v) ? +v.toPrecision(6) : v);
let chunkId = 0;
function sendRaw(c, o) {
  try {
    if (!c || !c.open) return;
    const s = typeof o === 'string' ? o : roundJSON(o);
    if (s.length <= 12000) { c.send(s); return; }
    const id = ++chunkId, n = Math.ceil(s.length / 12000);
    for (let i = 0; i < n; i++) c.send(JSON.stringify({ t: 'ch', id, i, n, d: s.slice(i * 12000, (i + 1) * 12000) }));
  } catch (e) { }
}
function recvRaw(d, fn) {
  let m; try { m = JSON.parse(d); } catch (e) { return; }
  if (m.t === 'ch') {
    const b = NET.chunks[m.id] || (NET.chunks[m.id] = { n: m.n, got: 0, parts: [] });
    if (b.parts[m.i] == null) { b.parts[m.i] = m.d; b.got++; }
    if (b.got === b.n) { delete NET.chunks[m.id]; try { m = JSON.parse(b.parts.join('')); } catch (e) { return; } } else return;
  }
  try { fn(m); } catch (e) { console.error(e); }
}
const netSend = o => sendRaw(NETROLE === 'host' ? NET.gctl : NET.ctl, o);
function netLeave() {
  try { netSend({ t: 'bye' }); } catch (e) { }
  try { NET.peer && NET.peer.destroy(); } catch (e) { }
  Object.assign(NET, { peer: null, code: '', ctl: null, gctl: null, guestName: '', ready: false, chunks: {} });
  NETROLE = null;
}
addEventListener('pagehide', () => { try { netSend({ t: 'bye' }); } catch (e) { } });

/* ---------- host ---------- */
async function netHost() {
  if (inArtifact()) { titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); return; }
  netLeave(); NETROLE = 'host'; showScreen('lobby'); STATE.mode = 'lobby'; lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer('housemogul-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => lobbyUI(''));
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!linkUp()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      const rejoin = STATE.mode === 'play' && G && G.pl[1] && G.pl[1].gone;
      if ((NET.gctl && NET.gctl.open) || (STATE.mode === 'play' && !rejoin) || STATE.mode === 'end') { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy' })); setTimeout(() => conn.close(), 300); }); return; }
      NET.gctl = conn;
      conn.on('open', () => { NET.seen = performance.now(); });
      conn.on('data', d => recvRaw(d, hostRecv));
      conn.on('close', () => { if (NET.gctl === conn) guestGone(); });
    });
  };
  open(0);
}
function hostRecv(m) {
  NET.seen = performance.now();
  switch (m.t) {
    case 'hello':
      NET.guestName = (m.name || '玩家二').slice(0, 8);
      if (STATE.mode === 'play' && G && G.pl[1] && G.pl[1].gone) { G.pl[1].gone = false; sendRaw(NET.gctl, { t: 'start', G, me: 1 }); toast(NET.guestName + ' 重新连上了', 'gold'); renderUI(); return; }
      NET.ready = false; sendLobby(); lobbyUI(); sfx('ready'); return;
    case 'bye': guestGone(); return;
    case 'lready': NET.ready = !!m.v; sendLobby(); lobbyUI(); return;
    case 'ping': return;
    case 'act': {
      if (!G || STATE.mode !== 'play') return;
      const err = doAct(1, m.a, m.v);
      if (err) { sendRaw(NET.gctl, { t: 'err', msg: err }); return; }
      afterAct();
      return;
    }
  }
}
function guestGone() {
  NET.gctl = null; NET.guestName = ''; NET.ready = false;
  if (STATE.mode === 'play' && G && G.pl[1]) { G.pl[1].gone = true; toast('对方断开了连接，你可以继续玩（对方能用同一个房间码重新加入）', 'bad'); maybeAdvance(); renderUI(); }
  if (STATE.mode === 'lobby') lobbyUI();
}
function sendLobby() { sendRaw(NET.gctl, { t: 'lobby', ready: NET.ready, host: SET.name || '房主', code: NET.code, ai: NET.ai, opt: NET.opt, preset: NET.preset, diff: NET.diff }); }
function hostStart() {
  if (!NET.gctl || !NET.gctl.open || !NET.ready) return;
  const seed = (Math.random() * 1e9) | 0;
  newGame(seed, [SET.name || '房主', NET.guestName || '玩家二'], NET.ai, NET.opt, NET.diff); G.preset = NET.preset;
  sendRaw(NET.gctl, { t: 'start', G, me: 1 });
  enterGame(0);
}
function sync() { if (NETROLE === 'host') sendRaw(NET.gctl, { t: 'st', G }); }
function hostNetTick(dt) {
  if (!NET.gctl || !NET.gctl.open) return;
  if (performance.now() - NET.seen > 15000) { try { NET.gctl.close(); } catch (e) { } guestGone(); return; }
  if ((NET.pingT -= dt) <= 0) { NET.pingT = 3; sendRaw(NET.gctl, { t: 'ping' }); }
}

/* ---------- guest ---------- */
async function netJoin(code) {
  if (inArtifact()) { titleStatus('这个版本只能单人游玩，联机请到游戏厅网页版'); return; }
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { titleStatus('房间码是 4 位'); return; }
  netLeave(); NETROLE = 'guest'; titleStatus('正在连接…');
  try { await loadPeer(); } catch (e) { NETROLE = null; titleStatus('联机组件加载失败，请检查网络'); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer; NET.code = code;
  peer.on('error', err => { if (!linkUp()) { titleStatus(err.type === 'peer-unavailable' ? '找不到这个房间' : '连接失败（' + err.type + '）'); NETROLE = null; } });
  peer.on('open', () => {
    const ctl = peer.connect('housemogul-' + code, { label: 'ctl', reliable: true, serialization: 'raw' });
    NET.ctl = ctl;
    ctl.on('open', () => { NET.seen = performance.now(); sendRaw(ctl, { t: 'hello', name: SET.name || '' }); titleStatus(''); if (STATE.mode !== 'play') { showScreen('lobby'); STATE.mode = 'lobby'; lobbyUI(); } });
    ctl.on('data', d => recvRaw(d, guestRecv));
    ctl.on('close', () => { if (NET.ctl === ctl) hostGone(); });
  });
}
function hostGone() {
  const was = STATE.mode; netLeave();
  if (was === 'play' || was === 'lobby' || was === 'end') { toTitle(); titleStatus('房主断开了连接'); }
}
function guestRecv(m) {
  NET.seen = performance.now();
  switch (m.t) {
    case 'busy': titleStatus('房间已满或已经开始'); netLeave(); toTitle(); return;
    case 'bye': hostGone(); return;
    case 'ping': sendRaw(NET.ctl, { t: 'ping' }); return;
    case 'lobby': Object.assign(NET, { ready: m.ready, hostName: m.host, ai: m.ai, opt: m.opt, preset: m.preset, diff: m.diff }); lobbyUI(); return;
    case 'start': G = m.G; STATE.lastSeq = G.seq; enterGame(m.me); return;
    case 'st': if (G && (STATE.mode === 'play' || STATE.mode === 'end')) { const sel = STATE.sel; G = m.G; STATE.sel = sel; onState(); } return;
    case 'err': toast(m.msg, 'bad'); sfx('err'); return;
    case 'toLobby': return;
  }
}
function guestNetTick(dt) {
  if (!NET.ctl || !NET.ctl.open) return;
  if (performance.now() - NET.seen > 15000) hostGone();
}
