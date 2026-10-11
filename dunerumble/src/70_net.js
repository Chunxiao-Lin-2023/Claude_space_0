/* ================= networking (PeerJS, host authoritative) ================= */
const inArtifact = () => !!(window.claude && typeof window.claude.use === 'function') || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname) || !!window.__ARTIFACT__;
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { role: null, peer: null, ctl: null, snap: null, code: '', partner: null, sT: 0, pT: 0, snapInt: 1 / 20, timer: null, seen: 0 };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const connected = () => !!(NET.ctl && NET.ctl.open);
function netSend(o) { try { if (NET.ctl && NET.ctl.open) NET.ctl.send(JSON.stringify(o)); } catch (e) { } }
function netSendFast(o) { try { const c = NET.snap && NET.snap.open ? NET.snap : NET.ctl; if (c && c.open) c.send(JSON.stringify(o)); } catch (e) { } }
function netLeave() { try { netSend({ t: 'bye' }); } catch (e) { } clearTimeout(NET.timer); try { NET.peer && NET.peer.destroy(); } catch (e) { } Object.assign(NET, { role: null, peer: null, ctl: null, snap: null, code: '', partner: null }); }

async function netHost() {
  netLeave(); NET.role = 'host'; lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NET.role = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer('dunerumble-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => { lobbyUI(); });
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!connected()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (conn.label === 'snap') { NET.snap = conn; conn.on('data', d => { try { hostFast(JSON.parse(d)); } catch (e) { } }); return; }
      if (connected()) { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy' })); setTimeout(() => conn.close(), 300); }); return; }
      NET.ctl = conn;
      conn.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } hostRecv(m); });
      conn.on('close', () => { if (NET.ctl === conn) peerGone(); });
    });
  };
  open(0);
}
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
      netSend({ t: 'hello', name: myName(), hero: SEL.hero });
      const snap = peer.connect('dunerumble-' + code, { label: 'snap', reliable: false, serialization: 'raw' }); NET.snap = snap;
      snap.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } guestRecv(m); });
      lobbyUI();
    });
    ctl.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } guestRecv(m); });
    ctl.on('close', () => { if (NET.ctl === ctl) peerGone(); });
  });
}
function peerGone() {
  if (NET.role === 'host') {
    NET.ctl = null; NET.snap = null; const p = NET.partner; NET.partner = null;
    if (G && STATE.mode !== 'menu') { const b = G.ents.find(e => e.human === 2); if (b) { b.human = 0; b.isBot = true; b.name += '(AI)'; } toast('队友断开了，TA 的英雄改由 AI 控制'); }
    else toast((p ? p.name : '队友') + ' 离开了房间');
    lobbyUI();
  } else if (NET.role === 'guest') {
    netLeave(); if (STATE.mode !== 'menu') quitToMenu(true); toast('与房主的连接断开了'); lobbyUI();
  }
}
function hostRecv(m) {
  NET.seen = performance.now();
  if (m.t === 'hello') { NET.partner = { name: String(m.name || '队友').slice(0, 10), hero: clamp(m.hero | 0, 0, HEROES.length - 1) }; toast(NET.partner.name + ' 加入了房间'); sfx('respawn'); lobbyUI(); netSend({ t: 'lobby', host: myName(), hero: SEL.hero }); }
  else if (m.t === 'hero') { if (NET.partner) { NET.partner.hero = clamp(m.hero | 0, 0, HEROES.length - 1); lobbyUI(); } }
  else if (m.t === 'bye') peerGone();
  else if (m.t === 'f' || m.t === 'S') {
    if (!G) return; const b = G.ents.find(e => e.human === 2); if (!b || !b.alive) return;
    b.inp.aim = +m.a || 0; b.inp.tx = +m.tx || b.x; b.inp.tz = +m.tz || b.z;
    if (m.t === 'f') b.inp.fire = true; else b.inp.sup = true;
  }
}
function hostFast(m) {
  NET.seen = performance.now();
  if (m.t !== 'p' || !G) return; const b = G.ents.find(e => e.human === 2); if (!b) return;
  if ((m.ps | 0) !== b.posSeq || b.fm) return;
  b.remotePos = { x: clamp(+m.x, 1, BAL.N - 1), z: clamp(+m.z, 1, BAL.N - 1), m: m.m, mf: +m.mf || 0 };
  if (!b.burst && G.t - b.lastAtk > 0.5) b.face = +m.a || b.face; else if (m.a != null && G.t - b.lastAtk > 0.15) b.face = +m.a;
}
function hostStartOnline() {
  const roster = buildRoster(true);
  const cfg = { seed: (Math.random() * 1e9) | 0, theme: pickTheme(), mode: 'duo', diff: SEL.diff, roster };
  startGame(cfg);
  const g = G.ents.find(e => e.human === 2);
  g.posSeq = 1; // guest positions are ignored until the guest has adopted this sequence from a snapshot
  netSend({ t: 'start', cfg: { seed: cfg.seed, theme: cfg.theme, mode: cfg.mode, diff: cfg.diff }, ents: G.ents.map(e => ({ id: e.id, hero: e.hero, name: e.name, team: e.team, human: e.human, x: +e.x.toFixed(2), z: +e.z.toFixed(2), f: +e.face.toFixed(2) })), you: g.id });
}
const BFL = { alive: 1, moving: 2, bush: 4, vis: 8, stun: 16, dash: 32, fm: 64, ring: 128, flash: 256 };
function snapFor(gb) {
  const r = v => Math.round(v * 100), T = gb.team;
  return {
    t: 's', tm: +G.t.toFixed(2), gr: +G.gasR.toFixed(3),
    b: G.ents.map(e => [e.id, r(e.x), r(e.z), r(e.face), r(e.mface), Math.ceil(e.hp), Math.round(e.mhp), e.cubes,
      (e.alive ? 1 : 0) | (e.moving ? 2 : 0) | (e.inBush ? 4 : 0) | (visibleTo(e, T) ? 8 : 0) | (e.stunT > 0 ? 16 : 0) | (e.fm && e.fm.k === 'dash' ? 32 : 0) | (e.fm ? 64 : 0) | (e.burst && e.burst.k === 'ring' ? 128 : 0) | (e.flashT > 0 ? 256 : 0),
      r(e.ammo), r(e.sup), e.atkSeq, e.supSeq, e.posSeq, e.respawnT ? +(e.respawnT - G.t).toFixed(1) : 0, e.kills, Math.round(e.dmg)]),
    p: G.projs.filter(p => !(p.delay > 0)).map(p => p.lob ? [p.id, PK_IDX[p.k], r(p.x), r(p.z), 0, 0, r(p.y), r(p.lob.tx), r(p.lob.tz), r(p.radius)] : [p.id, PK_IDX[p.k], r(p.x), r(p.z), r(p.vx), r(p.vz), r(p.y)]),
    c: G.cubes.map(c => [c.id, r(c.x), r(c.z)]),
    u: G.turrets.map(t => [t.id, r(t.x), r(t.z), Math.ceil(t.hp), Math.round(t.mhp), t.team, r(t.face), t.owner, t.flashT > 0 ? 1 : 0]),
    x: M.boxes.map(b => Math.max(0, Math.ceil(b.hp))),
    w: G.destroyed,
    ev: G.ev.filter(e => e.tt > G.t - 0.8),
    pl: G.placement, ov: G.over ? 1 : 0, wn: G.winner, al: G.alive.size,
  };
}
function netHostTick(dt) {
  if (!connected() || !G) return;
  const gb = G.ents.find(e => e.human === 2); if (!gb) return;
  if (NET.seen && performance.now() - NET.seen > 8000) { try { NET.ctl.close(); } catch (e) { } peerGone(); return; }
  NET.sT += dt; if (NET.sT < NET.snapInt) return; NET.sT = 0;
  const s = JSON.stringify(snapFor(gb)); NET.snapInt = s.length > 24000 ? 1 / 15 : 1 / 20;
  try { const c = NET.snap && NET.snap.open ? NET.snap : NET.ctl; c.send(s); } catch (e) { }
}

/* ---------- guest side ---------- */
const CL = { ents: new Map(), list: [], projs: new Map(), cubes: [], turrets: [], gasR: BAL.N / 2, t: 0, me: null, myId: 0, evSeq: 0, cfg: null, lastSnap: 0, sentFireT: -9, pendAmmo: 0, placement: {}, over: false, winner: -1, alive: 10 };
function guestRecv(m) {
  if (m.t === 'busy') { netLeave(); lobbyUI('房间已满'); return; }
  if (m.t === 'lobby') { NET.partner = { name: String(m.host || '房主').slice(0, 10), hero: m.hero | 0 }; lobbyUI(); if (STATE.mode !== 'menu') quitToMenu(true); return; }
  if (m.t === 'bye') { peerGone(); return; }
  if (m.t === 'start') { guestStart(m); return; }
  if (m.t === 's') { if (STATE.mode === 'play' || STATE.mode === 'result' || STATE.mode === 'pause') guestSnap(m); return; }
}
function guestStart(m) {
  CL.ents.clear(); CL.projs.clear(); CL.cubes = []; CL.turrets = []; CL.evSeq = 0; CL.cfg = m.cfg; CL.myId = m.you; CL.placement = {}; CL.over = false; CL.winner = -1; CL.t = 0;
  genMap(m.cfg.seed, m.cfg.theme);
  for (const e of m.ents) {
    const H = HEROES[e.hero];
    const o = { id: e.id, hero: e.hero, H, name: e.name, team: e.team, human: e.human, x: e.x, z: e.z, tx: e.x, tz: e.z, face: e.f || 0, mface: e.f || 0, moving: false, hp: H.hp, mhp: H.hp, cubes: 0, ammo: 3, sup: 0, alive: true, inBush: false, vis: true, stunT: 0, fm: null, burst: null, flashT: 0, atkSeq: 0, supSeq: 0, posSeq: 0, kills: 0, dmg: 0, respawnIn: 0, inp: { mx: 0, mz: 0, aim: 0, tx: 0, tz: 0, fire: false, sup: false }, first: true };
    CL.ents.set(e.id, o);
  }
  CL.list = [...CL.ents.values()];
  CL.me = CL.ents.get(CL.myId);
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
    } else { o.tx = nx; o.tz = nz; if (o.first || !o.alive) { o.x = nx; o.z = nz; } o.face = a[3] / 100; o.mface = a[4] / 100; o.moving = !!(f & BFL.moving); }
    o.first = false; o.posSeq = posSeq;
    o.hp = a[5]; o.mhp = a[6]; o.cubes = a[7]; o.alive = !!(f & BFL.alive); o.inBush = !!(f & BFL.bush); o.vis = !!(f & BFL.vis);
    o.stunT = f & BFL.stun ? 0.1 : 0; o.fm = f & BFL.dash ? 'dash' : (f & BFL.fm ? 'kb' : null); o.burst = f & BFL.ring ? 'ring' : null; o.flashT = f & BFL.flash ? 0.1 : 0;
    if (!isMe || performance.now() - CL.sentFireT > 250) o.ammo = a[9] / 100;
    o.sup = a[10] / 100; o.atkSeq = a[11]; o.supSeq = a[12]; o.respawnIn = a[14]; o.kills = a[15]; o.dmg = a[16];
  }
  const ps = new Set();
  for (const a of m.p) {
    ps.add(a[0]); let p = CL.projs.get(a[0]);
    if (!p) { p = { id: a[0], k: PROJ_KINDS[a[1]] }; CL.projs.set(a[0], p); }
    p.x = a[2] / 100; p.z = a[3] / 100; p.vx = a[4] / 100; p.vz = a[5] / 100; p.y = a[6] / 100;
    if (a.length > 7) { p.lob = { tx: a[7] / 100, tz: a[8] / 100 }; p.radius = a[9] / 100; }
  }
  for (const id of [...CL.projs.keys()]) if (!ps.has(id)) CL.projs.delete(id);
  CL.cubes = m.c.map(a => ({ id: a[0], x: a[1] / 100, z: a[2] / 100 }));
  CL.turrets = m.u.map(a => ({ id: a[0], x: a[1] / 100, z: a[2] / 100, hp: a[3], mhp: a[4], team: a[5], face: a[6] / 100, owner: a[7], flashT: a[8] ? 0.1 : 0 }));
  m.x.forEach((hp, i) => { const b = M.boxes[i]; if (!b) return; b.hp = hp; if (hp <= 0 && M.box[tIdx(b.tx, b.tz)] >= 0) M.box[tIdx(b.tx, b.tz)] = -1; });
  for (const i of m.w) if (M.t[i] !== T_FLOOR) { M.t[i] = T_FLOOR; visClearTile(i); }
  let mx = CL.evSeq;
  for (const e of m.ev) if (e.seq > CL.evSeq) { onLocalEvent(e); if (e.seq > mx) mx = e.seq; }
  CL.evSeq = mx;
  CL.placement = m.pl; CL.over = !!m.ov; CL.winner = m.wn; CL.alive = m.al;
}
function guestLocal(dt) {
  const me = CL.me; if (!me) return;
  CL.t += dt;
  for (const o of CL.list) if (o !== me) { o.x += (o.tx - o.x) * Math.min(1, dt * 14); o.z += (o.tz - o.z) * Math.min(1, dt * 14); o.flashT = Math.max(0, o.flashT - dt); }
  for (const p of CL.projs.values()) if (!p.lob) { p.x += p.vx * dt; p.z += p.vz * dt; }
  if (!me.alive || me.first) return;
  const show = readInput(me);
  showAim(me, show && show.mode, show && show.ang, show && show.tx, show && show.tz, show ? show.strength : 0);
  const inp = me.inp;
  if (!me.hostFm && me.stunT <= 0) {
    const ox = me.x, oz = me.z, sp = me.H.spd * (me.burst === 'ring' ? 0.4 : 1);
    moveCircle(me, inp.mx * sp * dt, inp.mz * sp * dt);
    me.moving = Math.hypot(inp.mx, inp.mz) > 0.15; if (me.moving) me.mface = Math.atan2(inp.mz, inp.mx);
    me.vx = (me.x - ox) / dt; me.vz = (me.z - oz) / dt;
  }
  me.inBush = inBush(me.x, me.z);
  me.face = (performance.now() - CL.sentFireT < 600 || INP.aimHeld) ? inp.aim : me.face;
  if (inp.fire && me.ammo >= 1 && performance.now() - CL.sentFireT > BAL.minGap * 1000) { netSend({ t: 'f', a: +inp.aim.toFixed(3), tx: +inp.tx.toFixed(2), tz: +inp.tz.toFixed(2) }); CL.sentFireT = performance.now(); me.ammo -= 1; me.face = inp.aim; }
  if (inp.sup && me.sup >= 1) { netSend({ t: 'S', a: +inp.aim.toFixed(3), tx: +inp.tx.toFixed(2), tz: +inp.tz.toFixed(2) }); CL.sentFireT = performance.now(); me.face = inp.aim; }
  inp.fire = false; inp.sup = false;
  NET.pT += dt; if (NET.pT >= 1 / 30) { NET.pT = 0; netSendFast({ t: 'p', x: +me.x.toFixed(3), z: +me.z.toFixed(3), m: me.moving ? 1 : 0, mf: +me.mface.toFixed(2), a: +me.face.toFixed(3), ps: me.posSeq }); }
  if (performance.now() - CL.lastSnap > 12000 && CL.lastSnap) peerGone();
}
