/* 剧本杀 · 双人联机（PeerJS，房主权威：房主运行引擎和 AI，朋友只发操作） */
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }, { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' }] };
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : { config: PEER_ICE, pingInterval: 4000 };
const NET = { role: null, peer: null, conn: null, code: '', msg: '', lobby: null, tok: 0, sendT: 0 };
function loadPeer() {
  if (window.Peer) return Promise.resolve();
  return new Promise((ok, no) => { let i = 0; const next = () => { if (i >= PEER_SRC.length) return no(new Error('联机组件下载失败')); const s = document.createElement('script'); s.src = PEER_SRC[i++]; const to = setTimeout(() => { s.remove(); next(); }, 9000); s.onload = () => { clearTimeout(to); ok(); }; s.onerror = () => { clearTimeout(to); s.remove(); next(); }; document.head.appendChild(s); }; next(); });
}
const genCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
function netSay(m) { NET.msg = m; const e = $('#netmsg'); if (e) e.textContent = m; else if (U.scr === 'lobby') render(); }
NET.host = async function () {
  if (ARTIFACT) return toast('claude.ai 里的版本不能联机，请用游戏厅网址。', 3500);
  const tok = ++NET.tok; netSay('正在下载联机组件…');
  try { await loadPeer(); } catch (e) { return netSay('联机组件下载失败：检查网络后再试。'); }
  const open = tries => {
    if (NET.tok !== tok) return; const code = genCode(), peer = new Peer('jbs-' + code, PEER_OPTS); NET.peer = peer;
    const to = setTimeout(() => { try { peer.destroy(); } catch (e) { } if (tries < 2) { netSay('联机服务器没回应，换一条连接再试…'); open(tries + 1); } else netSay('连不上联机服务器（试了 3 次）。稍后再试，或换个网络。'); }, 12000);
    peer.on('open', () => { clearTimeout(to); NET.role = 'host'; NET.code = code; NET.lobby = { mode: 'sus', roles: [null, null] }; NET.msg = '把房间码发给朋友，让他在“和朋友联机”里输入。'; render(); });
    peer.on('error', e => { if (e.type === 'unavailable-id') { clearTimeout(to); try { peer.destroy(); } catch (x) { } open(tries); } else netSay('联机出错：' + (e.type || e.message)); });
    peer.on('disconnected', () => { if (NET.peer === peer && NET.role === 'host') try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', c => {
      if (NET.conn && NET.conn.open) { c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 500); }); return; }
      NET.conn = c;
      c.on('data', d => hostRecv(d));
      c.on('close', () => { if (NET.conn !== c) return; NET.conn = null; if (G && U.scr === 'game') { const gr = G.seats[1]; if (gr) { G.guestRole = gr; G.seats[1] = null; logPush(G, { k: 'sys', text: '朋友断开了，' + roleName(gr) + '由 AI 接手。把房间码再发给他就能接回来。' }); save(); render(); } } else render(); });
    });
  };
  open(0);
};
function hostRecv(d) {
  if (!d || !d.t) return;
  if (d.t === 'hello') {
    if (G && U.scr === 'game') { if (!G.seats[1] && G.guestRole) { G.seats[1] = G.guestRole; logPush(G, { k: 'sys', text: '朋友回来了，接回' + roleName(G.guestRole) + '。' }); } NET.conn.send({ t: 'state', g: G }); render(); }
    else { NET.conn.send({ t: 'lobby', lobby: NET.lobby, code: NET.code }); render(); }
    return;
  }
  if (d.t === 'pick' && !G) { const L = NET.lobby; if (L.roles[0] === d.role) return; if (L.mode === 'det' && d.role === 'det') return; L.roles[1] = d.role; netLobby(); return; }
  if (d.t === 'act' && G) { apply(G, d.a, 1); afterApply(); }
}
function netLobby() { if (NET.conn && NET.conn.open) NET.conn.send({ t: 'lobby', lobby: NET.lobby, code: NET.code }); render(); }
NET.pick = function (r) {
  if (NET.role === 'host') { const L = NET.lobby; if (L.roles[1] === r) return; L.roles[0] = r; netLobby(); }
  else if (NET.conn && NET.conn.open) NET.conn.send({ t: 'pick', role: r });
};
NET.setMode = function (m) { const L = NET.lobby; L.mode = m; L.roles = m === 'det' ? ['det', L.roles[1] === 'det' ? null : L.roles[1]] : [L.roles[0] === 'det' ? null : L.roles[0], L.roles[1]]; netLobby(); };
NET.start = function () { const L = NET.lobby; G = newGame('renchiren', 'net', L.roles); ME = { seat: 0 }; U.scr = 'game'; U.lastN = 0; U.sheet = null; U.tlShown = 0; save(); netSend(); render(); };
NET.restart = function () { G = newGame(G.sid, G.mode, G.seats.map((r, i) => r || (i === 1 ? G.guestRole : r))); U.lastN = 0; U.sheet = null; U.tlShown = 0; save(); netSend(); render(); };
function netSend() { if (NET.role !== 'host' || !NET.conn || !NET.conn.open) return; clearTimeout(NET.sendT); NET.sendT = setTimeout(() => { try { NET.conn.send({ t: 'state', g: G }); } catch (e) { } }, 60); }
NET.join = async function (raw) {
  const code = String(raw || '').trim().toUpperCase(); if (!/^[A-Z0-9]{4}$/.test(code)) return toast('房间码是 4 个字母或数字');
  if (ARTIFACT) return toast('claude.ai 里的版本不能联机，请用游戏厅网址。', 3500);
  const tok = ++NET.tok; netSay('正在下载联机组件…');
  try { await loadPeer(); } catch (e) { return netSay('联机组件下载失败：检查网络后再试。'); }
  const t0 = Date.now();
  const attempt = tries => {
    if (NET.tok !== tok) return; const peer = new Peer(PEER_OPTS); NET.peer = peer; netSay('正在连接联机服务器…');
    const to = setTimeout(() => { try { peer.destroy(); } catch (e) { } if (tries < 2) attempt(tries + 1); else netSay('连不上联机服务器。稍后再试，或换个网络。'); }, 15000);
    peer.on('open', () => {
      clearTimeout(to); netSay('找房间 ' + code + ' …');
      const knock = () => {
        if (NET.tok !== tok) return; const c = peer.connect('jbs-' + code, { reliable: true }); let got = 0;
        const hello = setInterval(() => { if (c.open && !got) c.send({ t: 'hello' }); }, 1500);
        c.on('open', () => { NET.conn = c; NET.role = 'guest'; NET.code = code; c.send({ t: 'hello' }); netSay('已连上房主，等待同步…'); });
        c.on('data', d => { got = 1; clearInterval(hello); guestRecv(d); });
        c.on('close', () => { clearInterval(hello); if (NET.conn === c) { NET.conn = null; NET.role = null; toast('和房主的连接断了。', 3500); G = null; U.scr = 'lobby'; render(); } });
        setTimeout(() => { if (!c.open && NET.tok === tok && !NET.conn) { clearInterval(hello); try { c.close(); } catch (e) { } if (Date.now() - t0 < 45000) { netSay('还没找到房间（房主可能还没开好），再敲一次门…'); knock(); } else netSay('找不到房间 ' + code + '：检查房间码，或让房主重新开房间。'); } }, 10000);
      };
      knock();
    });
    peer.on('error', e => { if (e.type === 'peer-unavailable') return; netSay('联机出错：' + (e.type || e.message)); });
  };
  attempt(0);
};
function guestRecv(d) {
  if (d.t === 'full') { toast('房间已满。'); return; }
  if (d.t === 'lobby') { NET.lobby = d.lobby; NET.code = d.code; if (U.scr !== 'lobby') U.scr = 'lobby'; render(); return; }
  if (d.t === 'state') { const first = !G || U.scr !== 'game'; G = d.g; ME = { seat: 1 }; U.scr = 'game'; if (first) U.lastN = G.log.length; render(); }
}
NET.leave = function () { NET.tok++; try { NET.conn && NET.conn.close(); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { } Object.assign(NET, { role: null, peer: null, conn: null, code: '', lobby: null, msg: '' }); };
