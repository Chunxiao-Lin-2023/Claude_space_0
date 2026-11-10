/* ================= co-op (PeerJS, host authoritative, up to 4 real players) =================
   Each player keeps their own character and story.  The host runs the shared server: world chat,
   world boss, the roster, and every battle that has more than one real player in it. */
let NETROLE = null;
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', conn: null, conns: new Map(), roster: {}, status: '', pubT: 0 };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => res(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const raw = (c, o) => { try { if (c && c.open) c.send(JSON.stringify(o)); } catch (e) { } };
const netHumans = () => Object.values(NET.roster).filter(p => p.pid !== MYID);
function myPub() { const s = charStats(); return { pid: MYID, name: C.name, cls: C.cls, lv: C.lv, hp: C.hp, mp: C.mp, stats: s, skills: skillsOf(), loc: C.loc, busy: !!(STATE.battle || STATE.scene || STATE.dungeon || STATE.busy), power: s.power, title: C.title || '', realm: realmOf(C.lv).name, bots: partyBots(), host: NETROLE === 'host' }; }
function netPub() { if (!NETROLE || !C) return; clearTimeout(NET.pubT); NET.pubT = setTimeout(() => { const p = myPub(); if (NETROLE === 'host') { NET.roster[MYID] = p; netBroadcast({ t: 'roster', roster: NET.roster }); refresh(); } else netSend({ t: 'pub', p }); }, 120); }
function netSend(o) { if (NETROLE === 'guest') raw(NET.conn, o); else if (NETROLE === 'host') hostRecv(MYID, o); }
function netBroadcast(o) { if (NETROLE !== 'host') return; for (const c of NET.conns.values()) raw(c, o); }
function netSendTo(who, o) { // who = pid or player name
  if (NETROLE !== 'host') return; let pid = who; if (!NET.roster[pid]) { const p = Object.values(NET.roster).find(x => x.name === who); if (!p) return; pid = p.pid; }
  if (pid === MYID) { guestRecv(o); return; } raw(NET.conns.get(pid), o); }
function netLeave() { try { if (NETROLE === 'guest') raw(NET.conn, { t: 'bye' }); netBroadcast({ t: 'bye' }); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { }
  NET.peer = null; NET.conn = null; NET.conns.clear(); NET.roster = {}; NET.code = ''; NETROLE = null; MYID = 'local'; dropRemoteBattle(); refresh(); }
function dropRemoteBattle() { if (STATE.battle && !AUTH[STATE.battle.id]) { const B = STATE.battle; const u = B.units.find(x => x.pid === MYID || x.kind === 'pc'); STATE.battle = null; STATE.busy = false; const res = STATE.battleRes; STATE.battleRes = null; logLine('与房主的连接断开，战斗中止。', 'sys'); if (res) res({ win: false, fled: true }); refresh(); } STATE.busy = false; }
/* ---------- host ---------- */
async function netHost() {
  if (STATE.battle || STATE.scene || STATE.dungeon) { toast('先结束眼前的事'); return; }
  netLeave(); NET.status = '正在创建房间…'; refresh();
  try { await loadPeer(); } catch (e) { NET.status = '联机组件加载失败，请检查网络'; refresh(); return; }
  const open = tries => { const code = genCode(), peer = new Peer('wmol-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', id => { NETROLE = 'host'; MYID = id; NET.status = ''; NET.roster = { [MYID]: myPub() }; refresh(); sysMsg(`队伍房间已创建，房间码 <b>${code}</b>。把房间码发给朋友，他们在“联机”里输入即可加入。`); });
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else { NET.status = '房间出错（' + err.type + '）'; refresh(); } });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (NET.conns.size >= BAL.partyMax - 1) { conn.on('open', () => { raw(conn, { t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
      conn.on('open', () => { NET.conns.set(conn.peer, conn); });
      conn.on('data', d => { try { hostRecv(conn.peer, JSON.parse(d)); } catch (e) { console.error(e); } });
      conn.on('close', () => { if (NET.conns.get(conn.peer) === conn) { NET.conns.delete(conn.peer); const p = NET.roster[conn.peer]; delete NET.roster[conn.peer]; if (p) { chatPush('party', '', `${esc(p.name)} 离开了队伍`); sfx('fail'); } netBroadcast({ t: 'roster', roster: NET.roster }); hostDropFromBattles(conn.peer); refresh(); } });
    }); };
  open(0);
}
function hostDropFromBattles(pid) { for (const k in AUTH) { const B = AUTH[k].B; const u = B.units.find(x => x.pid === pid); if (u && !B.over) { u.alive = false; u.hp = 0; blog(B, `${uName(u)} 掉线了`); battleCheckEnd(B); if (!needInput(B).length && !B.over) battleResolve(B); battlePush(B); } } }
function hostRecv(pid, m) {
  switch (m.t) {
    case 'hello': NET.roster[pid] = Object.assign(m.p, { pid }); raw(NET.conns.get(pid), { t: 'welcome', pid, roster: NET.roster, WB, chat: CHAT.world.slice(-12), code: NET.code }); netBroadcast({ t: 'roster', roster: NET.roster });
      chatPush('party', '', `<b>${esc(m.p.name)}</b> 加入了队伍！`); sfx('level'); refresh(); break;
    case 'pub': if (NET.roster[pid] || pid === MYID) { NET.roster[pid] = Object.assign(m.p, { pid }); netBroadcast({ t: 'roster', roster: NET.roster }); refresh(); } break;
    case 'chat': { const p = NET.roster[pid]; if (!p || pid === MYID) break; const ch = ['world', 'near', 'party'].includes(m.m.ch) ? m.m.ch : 'world'; chatPush(ch, p.name, m.m.text, { real: true, cls: p.cls }); if (ch === 'world') fakeReply(m.m.text); break; }
    case 'wev': sysMsg(m.s); break;
    case 'bstart': hostStartFor(pid, m.spec); break;
    case 'bact': { const B = AUTH[m.bid] && AUTH[m.bid].B; if (B && B.seq === m.seq) battleInput(B, m.uid, m.act); break; }
    case 'gift': netSendTo(m.to, { t: 'gift', from: NET.roster[pid]?.name || '?', item: m.item, n: m.n, eq: m.eq }); break;
    case 'bye': break;
  }
}
/* ---------- guest ---------- */
async function netJoin(code) {
  if (STATE.battle || STATE.scene || STATE.dungeon) { toast('先结束眼前的事'); return; }
  netLeave(); code = (code || '').toUpperCase().trim(); if (code.length !== 4) { toast('房间码是 4 位'); return; } NET.status = '正在连接 ' + code + '…'; refresh();
  try { await loadPeer(); } catch (e) { NET.status = '联机组件加载失败'; refresh(); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer;
  peer.on('open', id => { MYID = id; const c = peer.connect('wmol-' + code, { reliable: true, serialization: 'raw', label: 'ctl' }); NET.conn = c;
    c.on('open', () => { NETROLE = 'guest'; NET.code = code; raw(c, { t: 'hello', p: myPub() }); });
    c.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    c.on('close', () => { if (NETROLE === 'guest') { sysMsg('与房主断开了连接，回到单人模式。'); toast('与房主断开了连接'); netLeave(); } }); });
  peer.on('error', err => { NET.status = '连接失败（' + err.type + '）。检查房间码，或让房主重开房间。'; NETROLE = null; MYID = 'local'; refresh(); });
}
function guestRecv(m) {
  switch (m.t) {
    case 'full': NET.status = '队伍已满（最多 4 人）'; netLeave(); break;
    case 'welcome': NET.roster = m.roster; NET.status = ''; if (m.WB) WB = m.WB; for (const x of m.chat || []) { CHAT.world.push(x); } sysMsg(`已加入队伍（房间 ${m.code}）。房主移动时你会自动跟随，可以在设置里关掉。`); sfx('level'); refresh(); break;
    case 'roster': NET.roster = m.roster; if (NETROLE === 'guest' && !NET.roster[MYID]) netPub(); refresh(); break;
    case 'chat': if (NETROLE === 'guest') { const x = Object.assign({}, m.m, { me: m.m.from === C.name && m.m.real }); const L = CHAT[x.ch] || CHAT.world; L.push(x); if (L.length > 80) L.shift(); if (x.ch !== 'world' || SET.chatWorld) uiChat(x); } break;
    case 'wb': WB = m.WB; break;
    case 'b': { const B = m.B; if (!STATE.battle || STATE.battle.id !== B.id) { if (!B.units.some(u => u.pid === MYID)) break; STATE.battle = B; STATE.busy = true; if (!STATE.battleRes) logLine('队友遇敌，你加入了战斗！', 'enc'); } STATE.battle = B; renderBattle(); break; }
    case 'bend': if (STATE.battle && STATE.battle.id === m.bid) { const B = STATE.battle; B.over = true; setTimeout(() => battleApply(m.r, B), 300); } break;
    case 'lead': if (NETROLE === 'guest' && SET.autoFollow && C.loc === m.from && !STATE.battle && !STATE.scene && !STATE.dungeon) { STATE.followLock = 1; go(m.loc, false, false); STATE.followLock = 0; logLine('<span class="dim">（跟随队长）</span>', 'dim'); } break;
    case 'mail': sendMail(m.m); break;
    case 'gift': if (m.item) addItem(m.item, m.n || 1); if (m.eq) addEquip(m.eq); logLine(`<b>${esc(m.from)}</b> 送给你一份礼物！`, 'loot'); sfx('loot'); save(); refresh(); break;
    case 'bye': break;
  }
}
function sendChat(ch, text) { text = text.trim().slice(0, 80); if (!text) return;
  const bots = () => { if (ch === 'party' && STATE.party.length) setTimeout(() => { const b = pick(STATE.party), f = FAKES.find(x => x.id === b.id); if (f) chatPush('party', f.name, pick(['好', '收到', '哈哈', 'ok', '冲']), { cls: f.cls }); }, rint(1000, 3000)); };
  if (ch === 'guild') { chatPush('guild', C.name, text, { me: true, cls: C.cls }); if (C.guild) setTimeout(() => { const m = FAKES.filter(f => f.guild === C.guild); if (m.length) fakeSay('guild', pick(m), pick(['哈哈哈', '+1', '是的', '同意', '会长呢？'])); }, rint(1500, 4000)); return; }
  if (NETROLE === 'guest') { netSend({ t: 'chat', m: { ch, text } }); bots(); return; } // the host echoes it back to everyone
  chatPush(ch, C.name, text, { me: true, cls: C.cls }); if (ch === 'world' || ch === 'near') fakeReply(text); bots();
}
function giftTo(pid, kind, ref) { const p = NET.roster[pid]; if (!p) return;
  if (kind === 'item') { if (!takeItem(ref, 1)) return; netSend({ t: 'gift', to: pid, item: ref, n: 1 }); }
  else { const i = C.gear.findIndex(g => g.u === ref); if (i < 0) return; const e = C.gear.splice(i, 1)[0]; netSend({ t: 'gift', to: pid, eq: e }); }
  toast(`已送给 ${p.name}`); save(); refresh(); }
