/* ================= co-op: one shared screen (PeerJS) =================
   The host runs the game with their own save.  Friends who join see exactly the same thing
   (log, dialogue, battles, panels) and whoever presses “我来操作” controls 石昊.
   A guest's clicks are sent to the host as commands; the host's state is mirrored back. */
let NETROLE = null, MYID = 'local';
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
/* ICE: two public STUN servers plus PeerJS's own TURN relay, so two phones on different networks (mobile data, strict NATs) can still reach each other */
const PEER_ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }, { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' }] };
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : { config: PEER_ICE, pingInterval: 4000 };
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', conn: null, conns: new Map(), ctrl: 'host', status: '', peers: 0, syncT: 0 };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (window.Peer) return res(); if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); let done = false; const fail = () => { if (done) return; done = true; sc.remove(); next(); }; sc.src = PEER_SRC[i++]; sc.onload = () => { if (done) return; done = true; window.Peer ? res() : next(); }; sc.onerror = fail; setTimeout(fail, 9000); /* a CDN that hangs counts as down: try the next one */ document.head.appendChild(sc); }; next(); }); }
const NET_WAIT = 15000; /* the public PeerJS server sometimes takes minutes to answer: give up on a socket after this long and open a fresh one */
function netErrText(type, host) { return ({ 'browser-incompatible': '这个浏览器不支持联机，换 Chrome / Safari / Edge 试试。', 'peer-unavailable': '没找到这个房间：检查房间码；确认房主停在游戏页面上（手机切到别的应用时房间会暂停），或者让房主重新开房间。', 'unavailable-id': '房间码撞车了，再点一次。', nohost: '房主那边一直没回应：让房主回到游戏页面（手机上别切到别的应用），或者让他重新开一次房间，把新的房间码发过来。', ice: '找到了房间，但两边的网络打不通：让其中一个人换个网络（比如开手机热点），或者关掉 VPN，再试一次。', timeout: '联机服务器一直没回应（公共服务器偶尔很慢）。过一会儿再点一次；开着 VPN 或广告拦截的话，关掉或换个网络试试。', load: '联机组件下载不下来：检查网络，或者关掉广告拦截再试。' })[type] || `联机服务器连不上（${type}）。过一会儿再点一次${host ? '“开房间”' : '“加入”'}；开着 VPN 或广告拦截的话，关掉或换个网络试试。`; }
const raw = (c, o) => { try { if (c && c.open) c.send(JSON.stringify(o)); } catch (e) { } };
const myControl = () => !NETROLE || (NETROLE === 'host' ? NET.ctrl === 'host' : NET.ctrl === MYID);
function netSend(o) { if (NETROLE === 'guest') raw(NET.conn, o); }
function netBroadcast(o) { if (NETROLE === 'host') for (const c of NET.conns.values()) raw(c, o); }
function netPub() { netSync(); }
function netLog(html, cls) { if (NET.conns.size) netBroadcast({ t: 'log', html, cls }); }
function netSync() { if (NETROLE !== 'host' || !NET.conns.size || !C) return; clearTimeout(NET.syncT); NET.syncT = setTimeout(() => netBroadcast(snapshot()), 60); }
function snapshot() { return { t: 'st', C, st: { battle: STATE.battle, dungeon: STATE.dungeon, scene: !!STATE.scene, busy: STATE.busy, dtPending: !!STATE.dtPending }, dlg: DLG ? Object.assign(DLG.mini ? { mini: Object.assign({}, DLG.mini, { age: now() - DLG.mini.t0 }) } : DLG.rune ? { rune: DLG.rune } : DLG.choice ? { choice: DLG.choice.map(o => ({ t: o.t, dis: !!o.dis })) } : { o: DLG.o }, { ctx: dlgCtx() }) : null, roam: ROAM, ctrl: NET.ctrl, peers: NET.conns.size }; }
function takeControl() { if (NETROLE === 'host') { NET.ctrl = 'host'; netBroadcast({ t: 'ctrl', ctrl: 'host' }); } else netSend({ t: 'take' }); toast('你来操作'); refresh(); if (UI.modal === 'coop') openModal('coop', 1); }
/* commands a guest (or a host who handed over control) may trigger by clicking */
const CMD_NAMES = ['siegeStart', 'leitaiStart', 'go', 'explore', 'rest', 'train', 'enterDungeon', 'fightRoam', 'autoWalk', 'npcTalk', 'battleAct', 'toggleAuto', 'useItem', 'feedPet', 'setPet', 'toggleBar', 'arenaFight', 'storyHereRun', 'runeTap', 'runeSkip', 'arenaClaim', 'battleUndo', 'equipRelic', 'teleport', 'tradeDo', 'bountyTake', 'enterDungeonHard', 'setTitle', 'trackTask', 'camp', 'sellItem', 'buyItem', 'togglePetMove', 'setDuo', 'petRankUp', 'miniTap', 'miniSkip', 'fuseSkill', 'autoExplore', 'toggleAutoFight', 'miniRetry', 'miniGiveUp', 'runeRetry', 'runeAccept', 'bsPreset'];
const CMDS = {};
UI.inClick = false; const markClick = () => { UI.inClick = true; setTimeout(() => { UI.inClick = false; }, 0); };
document.addEventListener('click', markClick, true); document.addEventListener('keydown', markClick, true);
for (const fn of CMD_NAMES) { const orig = window[fn]; CMDS[fn] = orig; window[fn] = function (...a) {
  if (UI.inClick && NETROLE) { if (!myControl()) { toast('现在是队友在操作（点上面的 🔗 可以接手）'); return; } if (NETROLE === 'guest') { netSend({ t: 'cmd', fn, a: JSON.parse(JSON.stringify(a)) }); return; } }
  return orig.apply(this, a); }; }
function netLeave() {
  const wasGuest = NETROLE === 'guest'; try { if (wasGuest) raw(NET.conn, { t: 'bye' }); netBroadcast({ t: 'bye' }); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { }
  NET.tok = (NET.tok || 0) + 1; /* anything still connecting is now stale */
  NET.peer = null; NET.conn = null; NET.conns.clear(); NET.code = ''; NET.ctrl = 'host'; NET.peers = 0; NETROLE = null; MYID = 'local';
  if (wasGuest) { C = null; STATE.battle = null; STATE.dungeon = null; STATE.scene = null; DLG = null; toTitle(); } else refresh();
}
/* ---------- host ---------- */
async function netHost() {
  netLeave(); const tok = NET.tok = (NET.tok || 0) + 1; NET.status = '正在加载联机组件…'; openModal('coop', 1);
  try { await loadPeer(); } catch (e) { if (NET.tok === tok) { NET.status = netErrText('load', 1); openModal('coop', 1); } return; } if (NET.tok !== tok) return;
  const fail = type => { if (NET.tok !== tok) return; try { NET.peer && NET.peer.destroy(); } catch (e) { } NET.peer = null; NET.code = ''; NETROLE = null; MYID = 'local'; NET.status = netErrText(type, 1); if (UI.modal === 'coop' || STATE.mode === 'play') openModal('coop', 1); };
  const open = (tries, keep) => { if (NET.tok !== tok) return; const code = keep || genCode(), peer = new Peer('wmol-' + code, PEER_OPTS); NET.peer = peer; NET.code = code; NET.revive = () => revive(peer, code);
    NET.status = tries ? `联机服务器有点慢，换一条线再试（第 ${tries + 1} 次）…` : '正在连接联机服务器…'; if (UI.modal === 'coop') openModal('coop', 1);
    const retry = type => { clearTimeout(to); if (NET.peer !== peer || NET.tok !== tok) return; try { peer.destroy(); } catch (e) { } if (tries < 2) setTimeout(() => open(tries + 1), type === 'timeout' ? 0 : 1500); else fail(type); }; /* a quick refusal is often a blip: wait a moment before the next try */
    const to = setTimeout(() => { if (!NETROLE) retry('timeout'); }, NET_WAIT);
    peer.on('open', id => { clearTimeout(to); if (NET.peer !== peer || NET.tok !== tok) return; const back = NETROLE === 'host'; NET.reviving = 0; NETROLE = 'host'; MYID = id; NET.status = ''; NET.live = 1; if (back) { logLine('联机服务器重新连上了，房间码还是 <b>' + code + '</b>。', 'sys'); refresh(); if (UI.modal === 'coop') openModal('coop', 1); return; } NET.ctrl = 'host'; refresh(); openModal('coop', 1); logLine(`房间已开好，房间码 <b>${code}</b>。把它发给朋友，<b>然后回到这个页面等他</b>（手机切到别的应用时，这个页面会暂停）。`, 'sys'); });
    peer.on('error', err => { if (NET.peer !== peer) return; if (NETROLE === 'host') { if (err.type === 'peer-unavailable') return; if (!NET.reviving) logLine('联机连接断了一下（' + err.type + '），正在把房间接回来……', 'dim'); revive(peer, code); return; } /* an open room keeps its code: reconnect, or reopen it under the same code */
      if (err.type === 'unavailable-id' && tries < 4) { clearTimeout(to); try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (err.type === 'browser-incompatible') { clearTimeout(to); fail(err.type); } else retry(err.type); });
    peer.on('disconnected', () => { if (NET.peer !== peer || peer.destroyed) return; if (UI.modal === 'coop') openModal('coop', 1); revive(peer, code); });
    peer.on('connection', conn => { logLine('有人拿着房间码来敲门了，正在接通……', 'dim'); const t0 = setTimeout(() => { if (!conn.open) logLine('<span class="warn">有人想加入，但连接没建成（两边的网络打不通）。让朋友换个网络（比如手机热点）再试，或者关掉 VPN。</span>', 'sys'); }, 20000);
      conn.on('error', e => logLine('加入的连接出错了（' + (e && e.type || e) + '）。', 'dim')); conn.on('iceStateChanged', st => { if (st === 'failed') logLine('<span class="warn">和朋友之间的网络打不通（' + st + '）。换个网络或关掉 VPN 再试。</span>', 'sys'); });
      if (NET.conns.size >= 3) { conn.on('open', () => { raw(conn, { t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
      conn.on('open', () => { clearTimeout(t0); NET.conns.set(conn.peer, conn); NET.peers = NET.conns.size; const L = [...$('log').children].slice(-120).map(d => [d.innerHTML, d.className.replace(/^ln\s*/, '')]);
        raw(conn, { t: 'hello', log: L, code: NET.code }); raw(conn, snapshot()); logLine('有人加入了房间，正在和你看同一个画面。', 'sys'); sfx('level'); refresh(); });
      conn.on('data', d => { try { hostRecv(conn.peer, JSON.parse(d)); } catch (e) { console.error(e); } });
      conn.on('close', () => { if (NET.conns.get(conn.peer) === conn) { NET.conns.delete(conn.peer); NET.peers = NET.conns.size; if (NET.ctrl === conn.peer) { NET.ctrl = 'host'; toast('队友离开了，你接回了操作'); } logLine('队友离开了房间。', 'dim'); netSync(); refresh(); } });
    }); };
  /* the socket to the server dropped (the page was asleep, the network blinked): one reviver at a time — first reconnect, then reopen under the same code until the server lets go of it */
  const revive = (old, code) => { if (NET.tok !== tok || NETROLE !== 'host' || NET.peer !== old || old.open || NET.reviving) return; NET.reviving = tok; let n = 0;
    const step = () => { if (NET.tok !== tok || NETROLE !== 'host' || NET.reviving !== tok) { if (NET.reviving === tok) NET.reviving = 0; return; } const p = NET.peer; if (p && p.open) { NET.reviving = 0; return; }
      if (n === 0 && p && p.disconnected && !p.destroyed) { try { p.reconnect(); } catch (e) { } }
      else { if (n > 8) { NET.reviving = 0; logLine('<span class="warn">房间接不回来了。点「联机」重新开一个房间，把新的房间码发给朋友。</span>', 'sys'); return; } try { if (p && !p.destroyed) p.destroy(); } catch (e) { } open(0, code); }
      n++; setTimeout(step, n === 1 ? 4000 : 6000); };
    step(); };
  open(0);
}
/* coming back to the page (after sending the code in another app): make sure the room is still reachable */
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && NETROLE === 'host' && NET.peer && !NET.peer.open && NET.revive) NET.revive(); });
function hostRecv(pid, m) {
  if (m.t === 'take') { NET.ctrl = pid; netBroadcast({ t: 'ctrl', ctrl: pid }); toast('队友接手了操作'); refresh(); netSync(); return; }
  if (NET.ctrl !== pid) return;
  if (m.t === 'cmd' && CMDS[m.fn]) { try { CMDS[m.fn](...(m.a || [])); } catch (e) { console.error(e); } netSync(); }
  if (m.t === 'dlg' && DLG) { if (DLG.choice) { const i = m.i; if (DLG.choice[i] && !DLG.choice[i].dis) { const r = DLG.res; logLine('▸ ' + DLG.choice[i].t, 'say mine'); DLG = null; renderDlg(); r(i); } } else { const r = DLG.res; DLG = null; renderDlg(); r(); } netSync(); }
}
/* ---------- guest ---------- */
async function netJoin(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').replace(/1/g, 'I'); if (code.length !== 4) { toast('房间码是 4 位'); return; } if (/[OI]/.test(code)) { toast('房间码里没有 O/0/I/1，再看一眼？'); return; }
  if (C && NETROLE !== 'guest') save(true); netLeave(); const tok = NET.tok = (NET.tok || 0) + 1; const say = s => { NET.status = s; if (STATE.mode === 'play') openModal('coop', 1); else titleStatus(s); }; say('正在连接 ' + code + '…');
  try { await loadPeer(); } catch (e) { if (NET.tok === tok) say(netErrText('load')); return; } if (NET.tok !== tok) return;
  const give = type => { if (NET.tok !== tok || NETROLE) return; try { NET.peer && NET.peer.destroy(); } catch (e) { } NET.peer = null; NET.conn = null; MYID = 'local'; say(netErrText(type)); };
  /* three phases, each with its own patience: reach the server (retry with a fresh socket), find the room (ask again), open the channel (ICE can take a while through a relay) */
  const t0 = Date.now(); const attempt = tries => { if (NET.tok !== tok) return; const peer = new Peer(PEER_OPTS); NET.peer = peer; let found = 0, asked = 0, miss = 0;
    const toSrv = setTimeout(() => { if (NET.tok !== tok || NET.peer !== peer || peer.open) return; try { peer.destroy(); } catch (e) { } if (tries < 2) { say(`联机服务器有点慢，换一条线再试（第 ${tries + 2} 次）…`); attempt(tries + 1); } else give('timeout'); }, NET_WAIT);
    const ask = () => { if (NET.tok !== tok || NET.peer !== peer || NETROLE) return; asked++; const c = peer.connect('wmol-' + code, { reliable: true, serialization: 'raw', label: 'ctl' }); NET.conn = c;
      c.on('open', () => { if (NET.tok !== tok) return; NETROLE = 'guest'; NET.code = code; });
      c.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
      c.on('error', () => { }); c.on('iceStateChanged', st => { if (st === 'failed' && !NETROLE && NET.tok === tok) give('ice'); });
      c.on('close', () => { if (NETROLE === 'guest' && NET.conn === c) { toast('房主离开了'); netLeave(); } });
      setTimeout(() => { if (NET.tok !== tok || NETROLE || NET.peer !== peer || NET.conn !== c) return; if (asked < 3) { say(found ? `找到房间了，正在打通两边的网络（第 ${asked + 1} 次）…` : `房主那边还没回应，再敲一次门（第 ${asked + 1} 次）…`); try { c.close(); } catch (e) { } ask(); } else give(found ? 'ice' : 'nohost'); }, 15000); };
    peer.on('open', id => { clearTimeout(toSrv); if (NET.tok !== tok || NET.peer !== peer) return; MYID = id; say('已连上联机服务器，正在找房间 ' + code + '…'); ask(); });
    peer.on('error', err => { if (NET.tok !== tok || NET.peer !== peer || NETROLE === 'guest') return;
      if (err.type === 'peer-unavailable') { miss++; if (miss < 7) { say(`还没找到房间 ${code}，已经找了 ${Math.round((Date.now() - t0) / 1000)} 秒，继续找…（房主要停在游戏页面上）`); try { NET.conn && NET.conn.close(); } catch (e) { } NET.conn = null; asked = 0; setTimeout(ask, 4000); } else give('peer-unavailable'); return; } /* the room may simply not be open yet: keep knocking for ~40s */
      if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type) && tries < 2) { clearTimeout(toSrv); try { peer.destroy(); } catch (e) { } setTimeout(() => attempt(tries + 1), 1500); return; }
      clearTimeout(toSrv); give(err.type); });
    const oc = peer.connect.bind(peer); peer.connect = (...a) => { const c = oc(...a); c.on && c.on('iceStateChanged', st => { if (st === 'checking' || st === 'connected') found = 1; }); return c; }; };
  attempt(0);
}
function guestRecv(m) {
  if (m.t === 'full') { NET.status = '房间满了'; netLeave(); titleStatus(NET.status); return; }
  if (m.t === 'hello') { STATE.mode = 'play'; $('title').style.display = 'none'; closeModal(); $('log').innerHTML = ''; for (const [h, c] of m.log || []) $('log').appendChild(el('div', 'ln ' + c, h)); NET.status = ''; UI.nav = null; layout(); return; }
  if (m.t === 'log') { logLine(m.html, m.cls); return; }
  if (m.t === 'ctrl') { NET.ctrl = m.ctrl; refresh(); if (UI.modal === 'coop') openModal('coop', 1); return; }
  if (m.t === 'st') { const first = !C; C = m.C; STATE.battle = m.st.battle; STATE.dungeon = m.st.dungeon; STATE.scene = m.st.scene ? 'remote' : null; STATE.busy = m.st.busy; ROAM = m.roam; NET.ctrl = m.ctrl; NET.peers = m.peers;
    if (STATE.battle) { STATE.shown = STATE.battle.log.length; STATE.shownFor = STATE.battle.id; }
    DLG = m.dlg ? Object.assign({ res: () => { } }, m.dlg) : null; if (DLG && DLG.mini) { DLG.mini.t0 = now() - DLG.mini.age; miniLoop(); } renderDlg(); refresh(); bannerDraw(); return; }
  if (m.t === 'bye') { toast('房主关闭了房间'); netLeave(); }
}
function netCopyCode() { const t = NET.code; try { navigator.clipboard.writeText(t).then(() => toast('房间码 ' + t + ' 已复制'), () => toast('房间码：' + t)); } catch (e) { toast('房间码：' + t); } }
function netShareCode() { const url = location.href.split('#')[0].split('?')[0]; try { navigator.share({ title: '完美世界 · 一起玩', text: `来我的房间一起玩！房间码 ${NET.code}（打开游戏，在标题画面“加入”里输入）`, url }).catch(() => { }); } catch (e) { netCopyCode(); } }
