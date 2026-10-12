/* ================= networking (PeerJS, host authoritative, up to 6 players) ================= */
const inArtifact = () => !!(window.claude && typeof window.claude.use === 'function') || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname) || !!window.__ARTIFACT__;
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const MAX_GUESTS = 5;
const NET = { role: null, peer: null, code: '', guests: new Map(), nextGid: 1, ctl: null, snap: null, lobby: null, sT: 0, pT: 0, snapInt: 1 / 20, timer: null, seen: 0 };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
/* "connected": guest → link to host is up; host → at least one guest */
const connected = () => NET.role === 'host' ? [...NET.guests.values()].some(g => g.ctl && g.ctl.open) : !!(NET.ctl && NET.ctl.open);
function sendRaw(c, s) { try { if (c && c.open) c.send(s); } catch (e) { } }
function netSend(o) { const s = JSON.stringify(o); if (NET.role === 'host') for (const g of NET.guests.values()) sendRaw(g.ctl, s); else sendRaw(NET.ctl, s); }
function netSendTo(gid, o) { const g = NET.guests.get(gid); if (g) sendRaw(g.ctl, JSON.stringify(o)); }
function netSendFast(o) { const c = NET.snap && NET.snap.open ? NET.snap : NET.ctl; sendRaw(c, JSON.stringify(o)); }
function netLeave() {
  try { netSend({ t: 'bye' }); } catch (e) { }
  clearTimeout(NET.timer); try { NET.peer && NET.peer.destroy(); } catch (e) { }
  Object.assign(NET, { role: null, peer: null, code: '', ctl: null, snap: null, lobby: null }); NET.guests = new Map(); NET.nextGid = 1;
}
const lobbyPlayers = () => [{ gid: 0, name: myName(), hero: SEL.hero, host: true }, ...[...NET.guests.values()].filter(g => g.hello).map(g => ({ gid: g.gid, name: g.name, hero: g.hero }))];
function broadcastLobby() { if (NET.role !== 'host') return; netSend({ t: 'lobby', players: lobbyPlayers(), mode: SEL.mode, versus: !!SEL.versus }); }

/* ---------- host ---------- */
async function netHost() {
  netLeave(); NET.role = 'host'; lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NET.role = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer('dunerumble-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => { lobbyUI(); });
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!connected()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (conn.label === 'snap') {
        const g = [...NET.guests.values()].find(x => x.peerId === conn.peer); if (!g) { conn.close(); return; }
        g.snap = conn; conn.on('data', d => { try { hostFast(g.gid, JSON.parse(d)); } catch (e) { } }); return;
      }
      if (NET.guests.size >= MAX_GUESTS || (G && STATE.mode !== 'menu')) { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy', full: NET.guests.size >= MAX_GUESTS })); setTimeout(() => conn.close(), 300); }); return; }
      const gid = NET.nextGid++, g = { gid, peerId: conn.peer, ctl: conn, snap: null, name: '玩家' + gid, hero: 0, sp: null, skin: 0, seen: performance.now(), hello: false };
      NET.guests.set(gid, g);
      conn.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } hostRecv(gid, m); });
      conn.on('close', () => { if (NET.guests.get(gid) === g) peerGone(gid); });
    });
  };
  open(0);
}
function guestBrawler(gid) { return G ? G.ents.find(e => e.human === 2 && e.gid === gid) : null; }
function peerGone(gid) {
  if (NET.role === 'host') {
    const g = NET.guests.get(gid); NET.guests.delete(gid);
    const b = guestBrawler(gid);
    if (b && STATE.mode !== 'menu') { b.human = 0; b.isBot = true; b.name += '(AI)'; toast((g ? g.name : '队友') + ' 断开了，TA 的英雄改由 AI 控制'); }
    else if (g && g.hello) toast(g.name + ' 离开了房间');
    broadcastLobby(); lobbyUI();
  } else if (NET.role === 'guest') {
    netLeave(); if (STATE.mode !== 'menu') quitToMenu(true); toast('与房主的连接断开了'); lobbyUI();
  }
}
const cleanName = s => String(s || '队友').replace(/[<>&"]/g, '').slice(0, 10) || '队友';
const validHero = h => PLAYABLE.includes(h | 0) ? h | 0 : PLAYABLE[0];
function hostRecv(gid, m) {
  const g = NET.guests.get(gid); if (!g) return; g.seen = performance.now();
  if (m.t === 'hello' || m.t === 'hero') {
    if (m.name != null) g.name = cleanName(m.name);
    g.hero = validHero(m.hero); g.sp = HEROES[g.hero].sps.includes(m.sp) ? m.sp : HEROES[g.hero].sps[0]; g.skin = clamp(m.skin | 0, 0, SKINS.length - 1);
    if (m.t === 'hello' && !g.hello) { g.hello = true; toast(g.name + ' 加入了房间'); sfx('respawn'); }
    broadcastLobby(); lobbyUI(); return;
  }
  if (m.t === 'bye') { peerGone(gid); return; }
  if (!G) return;
  const b = guestBrawler(gid); if (!b) return;
  if (m.t === 'f' || m.t === 'S' || m.t === 'g') {
    if (!b.alive) return;
    b.inp.aim = +m.a || 0; b.inp.tx = +m.tx || b.x; b.inp.tz = +m.tz || b.z;
    if (m.t === 'f') b.inp.fire = true; else if (m.t === 'S') b.inp.sup = true; else { b.inp.gad = true; if (m.mx != null) { b.inp.mx = +m.mx; b.inp.mz = +m.mz; } }
  } else if (m.t === 'emo') emote(b, String(m.e));
  else if (m.t === 'ping') addPing(b, clamp(+m.x || 0, 0, BAL.N), clamp(+m.z || 0, 0, BAL.N), m.tid | 0);
  else if (m.t === 'cmd') setCmd(b, m.c === 'follow' ? 'follow' : 'free');
}
function hostFast(gid, m) {
  const g = NET.guests.get(gid); if (g) g.seen = performance.now();
  if (m.t !== 'p' || !G) return; const b = guestBrawler(gid); if (!b) return;
  if ((m.ps | 0) !== b.posSeq || b.fm) return;
  b.remotePos = { x: clamp(+m.x, 1, BAL.N - 1), z: clamp(+m.z, 1, BAL.N - 1), m: m.m, mf: +m.mf || 0 };
  if (!b.burst && G.t - b.lastAtk > 0.5) b.face = +m.a || b.face; else if (m.a != null && G.t - b.lastAtk > 0.15) b.face = +m.a;
}
function hostStartOnline() {
  const guests = [...NET.guests.values()].filter(g => g.hello && g.ctl && g.ctl.open);
  const humans = [{ name: myName(), hero: SEL.hero, human: 1, sp: curSp(), skin: curSkin() }, ...guests.map(g => ({ name: g.name, hero: g.hero, human: 2, gid: g.gid, sp: g.sp, skin: g.skin }))];
  const cfg = { seed: (Math.random() * 1e9) | 0, theme: pickTheme(), mode: SEL.mode, diff: SEL.diff, roster: rosterFor(SEL.mode, humans, SEL.versus) };
  startGame(cfg);
  const ents = G.ents.map(e => ({ id: e.id, hero: e.hero, name: e.name, team: e.team, human: e.human, skin: e.skin, x: +e.x.toFixed(2), z: +e.z.toFixed(2), f: +e.face.toFixed(2) }));
  for (const g of guests) {
    const b = guestBrawler(g.gid); if (!b) continue;
    b.posSeq = 1; // guest positions are ignored until the guest has adopted this sequence from a snapshot
    netSendTo(g.gid, { t: 'start', cfg: { seed: cfg.seed, theme: cfg.theme, mode: cfg.mode, diff: cfg.diff }, ents, you: b.id });
  }
}
const BFL = { alive: 1, moving: 2, bush: 4, vis: 8, stun: 16, dash: 32, fm: 64, ring: 128, flash: 256, slow: 512, stealth: 1024, invuln: 2048, speed: 4096, armor: 8192 };
function msFor() {
  const ms = G.ms, r = v => Math.round(v * 100); if (!ms) return null;
  const o = { k: ms.k, tl: +(ms.tl || 0).toFixed(1) };
  if (ms.sc) o.sc = ms.sc;
  if (ms.k === 'gem') { o.cd = ms.cd ? [ms.cd.team, +ms.cd.t.toFixed(1)] : null; o.gems = ms.gems.map(g => [g.id, r(g.x), r(g.z)]); }
  if (ms.k === 'ball') { const B = ms.ball; o.b = [r(B.x), r(B.z), r(B.y), B.carrier]; o.rs = +ms.resetT.toFixed(1); }
  if (ms.k === 'boss') { o.ph = ms.phase; o.boss = ms.bossId; }
  if (ms.k === 'train') { o.step = ms.step; }
  return o;
}
function snapFor(gb) {
  const r = v => Math.round(v * 100), T = gb.team;
  return {
    t: 's', tm: +G.t.toFixed(2), gr: +G.gasR.toFixed(3),
    b: G.ents.map(e => [e.id, r(e.x), r(e.z), r(e.face), r(e.mface), Math.ceil(e.hp), Math.round(e.mhp), e.cubes,
      (e.alive ? 1 : 0) | (e.moving ? 2 : 0) | (e.inBush ? 4 : 0) | (visibleTo(e, T) ? 8 : 0) | (e.stunT > 0 ? 16 : 0) | (e.fm && e.fm.k === 'dash' ? 32 : 0) | (e.fm ? 64 : 0) | (e.burst && e.burst.k === 'ring' ? 128 : 0) | (e.flashT > 0 ? 256 : 0) | (e.slowT > 0 ? 512 : 0) | (e.stealthT > 0 ? 1024 : 0) | (e.invulnT > 0 ? 2048 : 0) | (e.speedT > 0 ? 4096 : 0) | (e.armorT > 0 ? 8192 : 0),
      r(e.ammo), r(e.sup), e.atkSeq, e.supSeq, e.posSeq, e.respawnT ? +(e.respawnT - G.t).toFixed(1) : 0, e.kills, Math.round(e.dmg), r(e.jy || 0), Math.ceil(e.shield || 0), e.gems, e.bounty, e.gadLeft, Math.ceil(e.gadCd * 10)]),
    zn: G.zones.map(z => [z.id, ZONE_KINDS.indexOf(z.k), r(z.x), r(z.z), r(z.r), z.team, +z.life.toFixed(2)]),
    p: G.projs.filter(p => !(p.delay > 0)).map(p => p.lob ? [p.id, PK_IDX[p.k], r(p.x), r(p.z), 0, 0, r(p.y), r(p.lob.tx), r(p.lob.tz), r(p.radius)] : [p.id, PK_IDX[p.k], r(p.x), r(p.z), r(p.vx), r(p.vz), r(p.y)]),
    c: G.cubes.map(c => [c.id, r(c.x), r(c.z)]),
    u: G.turrets.map(t => [t.id, r(t.x), r(t.z), Math.ceil(t.hp), Math.round(t.mhp), t.team, r(t.face), t.owner, t.flashT > 0 ? 1 : 0]),
    x: M.boxes.map(b => Math.max(0, Math.ceil(b.hp))),
    bx: M.boxes.slice(G.baseBoxes).map(b => [b.tx, b.tz, b.drop || 0]),
    w: G.destroyed,
    tr: G.traps.filter(t => t.team === T).map(t => [t.id, r(t.x), r(t.z), t.team]),
    wn: G.warns.map(w => [w.id, w.k === 'drop' ? 1 : 0, r(w.x), r(w.z), r(w.r), +w.t.toFixed(2), w.T]),
    ms: msFor(),
    ev: G.ev.filter(e => e.tt > G.t - 0.8),
    pl: G.placement, ov: G.over ? 1 : 0, wn2: G.winner, al: G.alive.size, dr: G.draw ? 1 : 0,
  };
}
function netHostTick(dt) {
  if (!G || !NET.guests.size) return;
  const nowMs = performance.now();
  if (nowMs - (NET.lastTick || 0) > 2000) for (const g of NET.guests.values()) g.seen = nowMs; // host tab was stalled: don't blame the guests
  NET.lastTick = nowMs;
  for (const g of [...NET.guests.values()]) if (g.hello && performance.now() - g.seen > 12000) { try { g.ctl.close(); } catch (e) { } peerGone(g.gid); }
  NET.sT += dt; if (NET.sT < NET.snapInt) return; NET.sT = 0;
  let big = 0;
  for (const g of NET.guests.values()) {
    const gb = guestBrawler(g.gid); if (!gb) continue;
    const s = JSON.stringify(snapFor(gb)); big = Math.max(big, s.length);
    sendRaw(g.snap && g.snap.open ? g.snap : g.ctl, s);
  }
  NET.snapInt = big > 24000 ? 1 / 15 : 1 / 20;
}

/* ---------- guest ---------- */
async function netJoin(code) {
  code = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(code)) { lobbyUI('请输入 4 位房间码'); return; }
  netLeave(); NET.role = 'guest'; NET.code = code; lobbyUI('正在连接房间 ' + code + ' …');
  try { await loadPeer(); } catch (e) { netLeave(); lobbyUI('联机组件加载失败，请检查网络'); return; }
  const peer = new Peer(undefined, PEER_OPTS); NET.peer = peer;
  NET.timer = setTimeout(() => { if (NET.role === 'guest' && !connected()) { netLeave(); lobbyUI('连接超时：检查房间码，并让房主保持页面在前台'); } }, 15000);
  peer.on('error', err => { if (NET.role !== 'guest' || STATE.mode === 'play') return; netLeave(); lobbyUI(err.type === 'peer-unavailable' ? '找不到房间 ' + code : '连接失败（' + err.type + '）'); });
  peer.on('open', () => {
    const ctl = peer.connect('dunerumble-' + code, { label: 'ctl', reliable: true, serialization: 'raw' }); NET.ctl = ctl;
    ctl.on('open', () => {
      clearTimeout(NET.timer);
      netSend({ t: 'hello', name: myName(), hero: SEL.hero, sp: curSp(), skin: curSkin() });
      const snap = peer.connect('dunerumble-' + code, { label: 'snap', reliable: false, serialization: 'raw' }); NET.snap = snap;
      snap.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } guestRecv(m); });
      lobbyUI();
    });
    ctl.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } guestRecv(m); });
    ctl.on('close', () => { if (NET.ctl === ctl) peerGone(); });
  });
}
const CL = { ents: new Map(), list: [], projs: new Map(), cubes: [], turrets: [], zones: [], traps: [], warns: [], ms: null, gasR: BAL.N / 2, t: 0, me: null, myId: 0, evSeq: 0, cfg: null, lastSnap: 0, sentFireT: -9, placement: {}, over: false, winner: -1, alive: 10, draw: false };
function guestRecv(m) {
  if (m.t === 'busy') { netLeave(); lobbyUI(m.full ? '房间已满（最多 6 人）' : '房间正在对局中，请稍后再加入'); return; }
  if (m.t === 'lobby') { NET.lobby = { players: m.players || [], mode: m.mode, versus: m.versus }; lobbyUI(); return; }
  if (m.t === 'back') { if (STATE.mode !== 'menu') quitToMenu(true); return; }
  if (m.t === 'bye') { peerGone(); return; }
  if (m.t === 'start') { guestStart(m); return; }
  if (m.t === 's') { if (STATE.mode === 'play' || STATE.mode === 'result' || STATE.mode === 'pause') guestSnap(m); return; }
}
function guestStart(m) {
  Object.assign(CL, { projs: new Map(), cubes: [], turrets: [], zones: [], traps: [], warns: [], ms: null, evSeq: 0, cfg: m.cfg, myId: m.you, placement: {}, over: false, winner: -1, t: 0, draw: false });
  CL.ents = new Map();
  if (MODES[m.cfg.mode].showdown) genMap(m.cfg.seed, m.cfg.theme); else genArena(m.cfg.seed, m.cfg.theme, m.cfg.mode);
  CL.baseBoxes = M.boxes.length;
  for (const e of m.ents) {
    const H = HEROES[e.hero];
    const o = { id: e.id, hero: e.hero, H, name: e.name, team: e.team, human: e.human, skin: e.skin || 0, x: e.x, z: e.z, tx: e.x, tz: e.z, face: e.f || 0, mface: e.f || 0, moving: false, hp: H.hp, mhp: H.hp, cubes: 0, ammo: 3, sup: 0, alive: true, inBush: false, vis: true, stunT: 0, fm: null, burst: null, flashT: 0, atkSeq: 0, supSeq: 0, posSeq: 0, kills: 0, dmg: 0, respawnIn: 0, gems: 0, bounty: 2, gadLeft: GADGET_USES, gadCd: 0, rad: H.rad || BAL.R, inp: { mx: 0, mz: 0, aim: 0, tx: 0, tz: 0, fire: false, sup: false, gad: false }, first: true };
    CL.ents.set(e.id, o);
  }
  CL.list = [...CL.ents.values()];
  CL.me = CL.ents.get(CL.myId);
  if (CL.me) CL.me.spSpd = curSp() === 'swift' ? 1.08 : 1;
  STATE.cfg = m.cfg;
  enterPlay();
}
function guestSnap(m) {
  CL.lastSnap = performance.now(); CL.t = m.tm; CL.gasR = m.gr;
  for (const a of m.b) {
    const o = CL.ents.get(a[0]); if (!o) continue;
    const f = a[8], isMe = o === CL.me;
    const nx = a[1] / 100, nz = a[2] / 100;
    const posSeq = a[13];
    if (isMe) {
      if (o.first || (f & BFL.fm) || posSeq !== o.posSeq || !(f & BFL.alive)) { o.x = nx; o.z = nz; }
      o.hostFm = !!(f & BFL.fm);
    } else { o.tx = nx; o.tz = nz; if (o.first || !o.alive || d2(o.x, o.z, nx, nz) > 9) { o.x = nx; o.z = nz; } o.face = a[3] / 100; o.mface = a[4] / 100; o.moving = !!(f & BFL.moving); }
    o.first = false; o.posSeq = posSeq;
    o.hp = a[5]; o.mhp = a[6]; o.cubes = a[7]; o.alive = !!(f & BFL.alive); o.inBush = !!(f & BFL.bush); o.vis = !!(f & BFL.vis);
    o.stunT = f & BFL.stun ? 0.1 : 0; o.fm = f & BFL.dash ? 'dash' : (f & BFL.fm ? 'kb' : null); o.burst = f & BFL.ring ? 'ring' : null; o.flashT = f & BFL.flash ? 0.1 : 0;
    if (!isMe || performance.now() - CL.sentFireT > 250) o.ammo = a[9] / 100;
    o.sup = a[10] / 100; o.atkSeq = a[11]; o.supSeq = a[12]; o.respawnIn = a[14]; o.kills = a[15]; o.dmg = a[16]; o.jy = (a[17] || 0) / 100; o.shield = a[18] || 0;
    o.slowT = f & BFL.slow ? 0.1 : 0; o.stealthT = f & BFL.stealth ? 0.1 : 0; o.invulnT = f & BFL.invuln ? 0.1 : 0; o.speedT = f & BFL.speed ? 0.1 : 0; o.armorT = f & BFL.armor ? 0.1 : 0;
    o.gems = a[19] || 0; o.bounty = a[20] || 0; o.gadLeft = a[21]; o.gadCd = (a[22] || 0) / 10;
  }
  const ps = new Set();
  for (const a of m.p) {
    ps.add(a[0]); let p = CL.projs.get(a[0]);
    if (!p) { p = { id: a[0], k: PROJ_KINDS[a[1]] }; CL.projs.set(a[0], p); }
    p.x = a[2] / 100; p.z = a[3] / 100; p.vx = a[4] / 100; p.vz = a[5] / 100; p.y = a[6] / 100;
    if (a.length > 7) { p.lob = { tx: a[7] / 100, tz: a[8] / 100 }; p.radius = a[9] / 100; }
  }
  for (const id of [...CL.projs.keys()]) if (!ps.has(id)) CL.projs.delete(id);
  CL.zones = (m.zn || []).map(a => ({ id: a[0], k: ZONE_KINDS[a[1]], x: a[2] / 100, z: a[3] / 100, r: a[4] / 100, team: a[5], life: a[6] }));
  CL.cubes = m.c.map(a => ({ id: a[0], x: a[1] / 100, z: a[2] / 100 }));
  CL.turrets = m.u.map(a => ({ id: a[0], x: a[1] / 100, z: a[2] / 100, hp: a[3], mhp: a[4], team: a[5], face: a[6] / 100, owner: a[7], flashT: a[8] ? 0.1 : 0 }));
  (m.bx || []).forEach((a, k) => { const i = CL.baseBoxes + k; if (!M.boxes[i]) { M.boxes[i] = { id: i, tx: a[0], tz: a[1], hp: 1, drop: a[2] }; M.box[tIdx(a[0], a[1])] = i; M.ver++; } });
  m.x.forEach((hp, i) => { const b = M.boxes[i]; if (!b) return; b.hp = hp; if (hp <= 0 && M.box[tIdx(b.tx, b.tz)] >= 0) M.box[tIdx(b.tx, b.tz)] = -1; });
  for (const i of m.w) if (M.t[i] !== T_FLOOR) { M.t[i] = T_FLOOR; visClearTile(i); }
  CL.traps = (m.tr || []).map(a => ({ id: a[0], x: a[1] / 100, z: a[2] / 100, team: a[3] }));
  CL.warns = (m.wn || []).map(a => ({ id: a[0], k: a[1] ? 'drop' : 'meteor', x: a[2] / 100, z: a[3] / 100, r: a[4] / 100, t: a[5], T: a[6] }));
  if (m.ms) {
    const s = m.ms, o = { k: s.k, tl: s.tl, sc: s.sc };
    if (s.gems) o.gems = s.gems.map(a => ({ id: a[0], x: a[1] / 100, z: a[2] / 100 }));
    if (s.k === 'gem') o.cd = s.cd ? { team: s.cd[0], t: s.cd[1] } : null;
    if (s.b) o.ball = { x: s.b[0] / 100, z: s.b[1] / 100, y: s.b[2] / 100, carrier: s.b[3] };
    if (s.rs != null) o.resetT = s.rs;
    if (s.ph) { o.phase = s.ph; o.bossId = s.boss; }
    if (s.step != null) o.step = s.step;
    CL.ms = o;
  }
  let mx = CL.evSeq;
  for (const e of m.ev) if (e.seq > CL.evSeq) { onLocalEvent(e); if (e.seq > mx) mx = e.seq; }
  CL.evSeq = mx;
  CL.placement = m.pl; CL.over = !!m.ov; CL.winner = m.wn2; CL.alive = m.al; CL.draw = !!m.dr;
}
function guestLocal(dt) {
  const me = CL.me; if (!me) return;
  CL.t += dt;
  for (const o of CL.list) if (o !== me) { o.x += (o.tx - o.x) * Math.min(1, dt * 14); o.z += (o.tz - o.z) * Math.min(1, dt * 14); o.flashT = Math.max(0, o.flashT - dt); }
  for (const p of CL.projs.values()) if (!p.lob) { p.x += p.vx * dt; p.z += p.vz * dt; }
  for (const w of CL.warns) w.t += dt;
  if (!me.alive || me.first) return;
  const show = STATE.mode === 'play' && !STATE.watching ? readInput(me) : null;
  showAim(me, show && show.mode, show && show.ang, show && show.tx, show && show.tz, show ? show.strength : 0);
  const inp = me.inp;
  if (!me.hostFm && me.stunT <= 0 && !(CL.ms && CL.ms.resetT > 0)) {
    const ox = me.x, oz = me.z, sp = me.H.spd * (me.burst === 'ring' ? 0.4 : 1) * (me.slowT > 0 ? 0.6 : 1) * (me.stealthT > 0 ? 1.25 : 1) * (me.speedT > 0 ? 1.45 : 1) * (me.spSpd || 1);
    moveCircle(me, inp.mx * sp * dt, inp.mz * sp * dt);
    me.moving = Math.hypot(inp.mx, inp.mz) > 0.15; if (me.moving) me.mface = Math.atan2(inp.mz, inp.mx);
    me.vx = (me.x - ox) / dt; me.vz = (me.z - oz) / dt;
  }
  me.inBush = inBush(me.x, me.z);
  me.face = (performance.now() - CL.sentFireT < 600 || INP.aimHeld) ? inp.aim : me.face;
  const carrying = CL.ms && CL.ms.ball && CL.ms.ball.carrier === me.id;
  if (inp.fire && (me.ammo >= 1 || carrying) && performance.now() - CL.sentFireT > BAL.minGap * 1000) { netSend({ t: 'f', a: +inp.aim.toFixed(3), tx: +inp.tx.toFixed(2), tz: +inp.tz.toFixed(2) }); CL.sentFireT = performance.now(); if (!carrying) me.ammo -= 1; me.face = inp.aim; }
  if (inp.sup && me.sup >= 1) { netSend({ t: 'S', a: +inp.aim.toFixed(3), tx: +inp.tx.toFixed(2), tz: +inp.tz.toFixed(2) }); CL.sentFireT = performance.now(); me.face = inp.aim; }
  if (inp.gad && me.gadLeft > 0 && me.gadCd <= 0) { netSend({ t: 'g', a: +inp.aim.toFixed(3), tx: +inp.tx.toFixed(2), tz: +inp.tz.toFixed(2), mx: +inp.mx.toFixed(2), mz: +inp.mz.toFixed(2) }); me.gadCd = 0.5; }
  inp.fire = false; inp.sup = false; inp.gad = false;
  NET.pT += dt; if (NET.pT >= 1 / 30) { NET.pT = 0; netSendFast({ t: 'p', x: +me.x.toFixed(3), z: +me.z.toFixed(3), m: me.moving ? 1 : 0, mf: +me.mface.toFixed(2), a: +me.face.toFixed(3), ps: me.posSeq }); }
  if (performance.now() - CL.lastSnap > 20000 && CL.lastSnap) peerGone();
}
/* keep-alive: guests ping the host every second (timers keep running in background tabs), host drops guests silent in the lobby */
setInterval(() => {
  if (NET.role === 'guest' && connected()) netSendFast({ t: 'hb' }); // also while dead / spectating / tab in background
  if (NET.role === 'host' && STATE.mode === 'menu') for (const g of [...NET.guests.values()]) if (g.hello && performance.now() - g.seen > 10000) { try { g.ctl.close(); } catch (e) { } peerGone(g.gid); }
}, 1000);
