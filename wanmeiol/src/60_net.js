/* ================= co-op: one shared screen (PeerJS) =================
   The host runs the game with their own save.  Friends who join see exactly the same thing
   (log, dialogue, battles, panels) and whoever presses “我来操作” controls 石昊.
   A guest's clicks are sent to the host as commands; the host's state is mirrored back. */
let NETROLE = null, MYID = 'local';
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', conn: null, conns: new Map(), ctrl: 'host', status: '', peers: 0, syncT: 0 };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => res(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
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
const CMD_NAMES = ['go', 'explore', 'rest', 'train', 'enterDungeon', 'fightRoam', 'autoWalk', 'npcTalk', 'battleAct', 'toggleAuto', 'useItem', 'feedPet', 'setPet', 'toggleBar', 'arenaFight', 'storyHereRun', 'runeTap', 'runeSkip', 'arenaClaim', 'battleUndo', 'equipRelic', 'teleport', 'tradeDo', 'bountyTake', 'enterDungeonHard', 'setTitle', 'trackTask', 'camp', 'sellItem', 'buyItem', 'togglePetMove', 'setDuo', 'petRankUp', 'miniTap', 'miniSkip'];
const CMDS = {};
UI.inClick = false; const markClick = () => { UI.inClick = true; setTimeout(() => { UI.inClick = false; }, 0); };
document.addEventListener('click', markClick, true); document.addEventListener('keydown', markClick, true);
for (const fn of CMD_NAMES) { const orig = window[fn]; CMDS[fn] = orig; window[fn] = function (...a) {
  if (UI.inClick && NETROLE) { if (!myControl()) { toast('现在是队友在操作（点上面的 🔗 可以接手）'); return; } if (NETROLE === 'guest') { netSend({ t: 'cmd', fn, a: JSON.parse(JSON.stringify(a)) }); return; } }
  return orig.apply(this, a); }; }
function netLeave() {
  const wasGuest = NETROLE === 'guest'; try { if (wasGuest) raw(NET.conn, { t: 'bye' }); netBroadcast({ t: 'bye' }); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { }
  NET.peer = null; NET.conn = null; NET.conns.clear(); NET.code = ''; NET.ctrl = 'host'; NET.peers = 0; NETROLE = null; MYID = 'local';
  if (wasGuest) { C = null; STATE.battle = null; STATE.dungeon = null; STATE.scene = null; DLG = null; toTitle(); } else refresh();
}
/* ---------- host ---------- */
async function netHost() {
  netLeave(); NET.status = '正在开房间…'; openModal('coop', 1);
  try { await loadPeer(); } catch (e) { NET.status = '联机组件加载失败，请检查网络'; openModal('coop', 1); return; }
  const open = tries => { const code = genCode(), peer = new Peer('wmol-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', id => { NETROLE = 'host'; MYID = id; NET.status = ''; NET.ctrl = 'host'; refresh(); openModal('coop', 1); logLine(`房间已开好，房间码 <b>${code}</b>。把它发给朋友。`, 'sys'); });
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else { NET.status = '房间出错（' + err.type + '）'; openModal('coop', 1); } });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (NET.conns.size >= 3) { conn.on('open', () => { raw(conn, { t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
      conn.on('open', () => { NET.conns.set(conn.peer, conn); NET.peers = NET.conns.size; const L = [...$('log').children].slice(-120).map(d => [d.innerHTML, d.className.replace(/^ln\s*/, '')]);
        raw(conn, { t: 'hello', log: L, code: NET.code }); raw(conn, snapshot()); logLine('有人加入了房间，正在和你看同一个画面。', 'sys'); sfx('level'); refresh(); });
      conn.on('data', d => { try { hostRecv(conn.peer, JSON.parse(d)); } catch (e) { console.error(e); } });
      conn.on('close', () => { if (NET.conns.get(conn.peer) === conn) { NET.conns.delete(conn.peer); NET.peers = NET.conns.size; if (NET.ctrl === conn.peer) { NET.ctrl = 'host'; toast('队友离开了，你接回了操作'); } logLine('队友离开了房间。', 'dim'); netSync(); refresh(); } });
    }); };
  open(0);
}
function hostRecv(pid, m) {
  if (m.t === 'take') { NET.ctrl = pid; netBroadcast({ t: 'ctrl', ctrl: pid }); toast('队友接手了操作'); refresh(); netSync(); return; }
  if (NET.ctrl !== pid) return;
  if (m.t === 'cmd' && CMDS[m.fn]) { try { CMDS[m.fn](...(m.a || [])); } catch (e) { console.error(e); } netSync(); }
  if (m.t === 'dlg' && DLG) { if (DLG.choice) { const i = m.i; if (DLG.choice[i] && !DLG.choice[i].dis) { const r = DLG.res; logLine('▸ ' + DLG.choice[i].t, 'say mine'); DLG = null; renderDlg(); r(i); } } else { const r = DLG.res; DLG = null; renderDlg(); r(); } netSync(); }
}
/* ---------- guest ---------- */
async function netJoin(code) {
  code = (code || '').toUpperCase().trim(); if (code.length !== 4) { toast('房间码是 4 位'); return; }
  if (C && NETROLE !== 'guest') save(true); netLeave(); NET.status = '正在连接 ' + code + '…'; if (STATE.mode === 'play') openModal('coop', 1); else titleStatus(NET.status);
  try { await loadPeer(); } catch (e) { NET.status = '联机组件加载失败'; titleStatus(NET.status); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer;
  peer.on('open', id => { MYID = id; const c = peer.connect('wmol-' + code, { reliable: true, serialization: 'raw', label: 'ctl' }); NET.conn = c;
    c.on('open', () => { NETROLE = 'guest'; NET.code = code; });
    c.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    c.on('close', () => { if (NETROLE === 'guest') { toast('房主离开了'); netLeave(); } }); });
  peer.on('error', err => { NET.status = '连接失败（' + err.type + '）。检查房间码，或者让房主重新开房间。'; NETROLE = null; MYID = 'local'; titleStatus(NET.status); });
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
