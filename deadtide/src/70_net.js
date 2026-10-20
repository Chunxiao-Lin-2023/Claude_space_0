/* ================= networking (PeerJS, host authoritative, 2 players) ================= */
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', hostName: '', ready: false, seen: 0, sT: 0, iT: 0, inN: 0, lastT: 0, diff: 'normal' };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const linkUp = () => NETROLE === 'host' ? !!(NET.gctl && NET.gctl.open) : NETROLE === 'guest' ? !!(NET.ctl && NET.ctl.open) : NETROLE === 'solo';
function sendRaw(c, o) { try { if (c && c.open) c.send(JSON.stringify(o)); } catch (e) { } }
function netSendCtl(o) { sendRaw(NETROLE === 'host' ? NET.gctl : NET.ctl, o); }
function netSendFast(o) { const c = NETROLE === 'host' ? (NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl) : (NET.snap && NET.snap.open ? NET.snap : NET.ctl); sendRaw(c, o); }
function netLeave() {
  try { netSendCtl({ t: 'bye' }); } catch (e) { }
  try { NET.peer && NET.peer.destroy(); } catch (e) { }
  Object.assign(NET, { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', ready: false });
  NETROLE = null;
}
addEventListener('pagehide', () => { try { netSendCtl({ t: 'bye' }); } catch (e) { } });
/* ---------- host ---------- */
async function netHost() {
  netLeave(); NETROLE = 'host'; showScreen('lobby'); lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer('deadtide-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => lobbyUI(''));
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!linkUp()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (conn.label === 'snap') { if (NET.gctl && conn.peer === NET.gctl.peer) { NET.gsnap = conn; conn.on('data', d => { try { hostRecv(JSON.parse(d)); } catch (e) { } }); } else conn.close(); return; }
      if ((NET.gctl && NET.gctl.open) || STATE.mode === 'play') { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy' })); setTimeout(() => conn.close(), 300); }); return; }
      NET.gctl = conn;
      conn.on('open', () => { NET.seen = performance.now(); });
      conn.on('data', d => { try { hostRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
      conn.on('close', () => { if (NET.gctl === conn) guestGone(); });
    });
  };
  open(0);
}
function hostRecv(m) {
  NET.seen = performance.now();
  switch (m.t) {
    case 'hello': NET.guestName = (m.name || '队友').slice(0, 10); NET.ready = false; sendLobby(); lobbyUI(); sfx('ready'); return;
    case 'bye': guestGone(); return;
    case 'ready': NET.ready = !!m.v; sendLobby(); lobbyUI(); return;
  }
  if (!W || STATE.mode !== 'play' || !W.p[1]) return;
  const p = W.p[1];
  if (m.t === 'i') {
    if (m.n < (p.inSeq || 0)) return; p.inSeq = m.n;
    if (!p.dead) { p.x = m.x; p.y = m.y; p.L = m.l; p.vx = m.vx; p.vy = m.vy; p.z = surfZ(p.x, p.y, p.L); }
    p.aim = m.a; p.anim = m.an; p.sel = m.sel || 1; p.aimPt = m.ap ? { x: m.ap[0], y: m.ap[1], z: m.ap[2] } : null;
    p.inp.fire = m.f; p.inp.use = m.u; p.build = !!m.b;
  } else if (m.t === 'act') doAct(p, m.a, m.v);
}
function guestGone() {
  NET.gctl = null; NET.gsnap = null; NET.guestName = ''; NET.ready = false;
  if (STATE.mode === 'play' && W && W.p[1]) { W.p[1].gone = true; W.p[1].down = false; uiMsg('队友断开了连接，你可以继续单人守夜', '#ff6b5a'); }
  lobbyUI();
}
function sendLobby() { netSendCtl({ t: 'lobby', ready: NET.ready, host: SET.name || '房主', code: NET.code, diff: SET.diff }); }
function hostStart() {
  if (!NET.gctl || !NET.gctl.open) return;
  const seed = (Math.random() * 1e9) | 0, names = [SET.name || '房主', NET.guestName || '队友'];
  netSendCtl({ t: 'start', seed, names, diff: SET.diff });
  startGame(seed, names, SET.diff, 0);
}
const ZI = ZKEYS;
function pFlags(p) { return (p.down ? 1 : 0) | (p.dead ? 2 : 0) | (p.gone ? 4 : 0) | (p.build ? 32 : 0) | (p.ready ? 64 : 0) | (p.selfRev ? 128 : 0); }
function makeSnap() {
  const P = p => [r2(p.x), r2(p.y), p.L, r2(p.vx), r2(p.vy), r2(p.aim), Math.ceil(p.hp), pFlags(p), Math.round(p.downT * 10) / 10, p.wpn, p.mag.join(','), p.ammo.join(','), p.owned.join(''), p.nades, p.meds, Math.round(p.useT * 100), Math.round(p.medT * 10) / 10, Math.round(p.reloadT * 10) / 10, p.kills, Math.round(p.anim * 10) / 10, p.sel, p.aimPt ? [r2(p.aimPt.x), r2(p.aimPt.y), r2(p.aimPt.z)] : 0];
  const z = []; for (const q of W.zs) z.push(q.id, ZI.indexOf(q.k), Math.round(q.x * 100), Math.round(q.y * 100), q.L, Math.round(q.z * 100), Math.round(q.face * 100), Math.ceil(q.hp / q.max * 100), (q.climbing ? 1 : 0) | (q.atk > 0 ? 2 : 0) | (q.hitT > 0 ? 4 : 0) | (q.moving ? 8 : 0));
  const pr = []; for (const b of W.proj) pr.push(b.k === 'nade' ? 0 : 1, r2(b.x), r2(b.y), r2(b.z), r2(b.vx), r2(b.vy), r2(b.vz));
  const d = []; for (const i of W.dirty) d.push(i, Math.round(W.bhp[i]), Math.round(W.shp[i])); W.dirty.clear();
  return { t: 's', T: r2(W.t), ph: W.phase, cl: Math.round(W.clock * 10) / 10, dl: W.dayLen, n: W.night, r: [Math.round(W.radio.hp), Math.round(W.radio.max), W.radio.hitT > 0 ? 1 : 0], res: RES.map(r => W.res[r.k]), u: W.upg, k: W.kills, p: W.p.map(P), z, pr, d, sl: W.spawnQ.length };
}
function hostNetTick(dt) {
  if (!NET.gctl || !NET.gctl.open) return;
  if (performance.now() - NET.seen > 9000) { try { NET.gctl.close(); } catch (e) { } guestGone(); return; }
  NET.sT -= dt;
  if (NET.sT <= 0) { const js = JSON.stringify(makeSnap()); NET.sT = js.length > 24000 ? 1 / 15 : 1 / 20; try { const c = NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl; if (c && c.open) c.send(js); } catch (e) { } }
}
/* ---------- guest ---------- */
async function netJoin(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { titleStatus('房间码是 4 位'); return; }
  netLeave(); NETROLE = 'guest'; titleStatus('正在连接…');
  try { await loadPeer(); } catch (e) { NETROLE = null; titleStatus('联机组件加载失败，请检查网络'); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer; NET.code = code;
  peer.on('error', err => { if (!linkUp()) { titleStatus(err.type === 'peer-unavailable' ? '找不到这个房间' : '连接失败（' + err.type + '）'); NETROLE = null; } });
  peer.on('open', () => {
    const ctl = peer.connect('deadtide-' + code, { label: 'ctl', reliable: true, serialization: 'raw' }); NET.ctl = ctl;
    ctl.on('open', () => {
      NET.seen = performance.now(); sendRaw(ctl, { t: 'hello', name: SET.name || '' });
      const sn = peer.connect('deadtide-' + code, { label: 'snap', reliable: false, serialization: 'raw' }); NET.snap = sn;
      sn.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { } });
      titleStatus(''); showScreen('lobby'); lobbyUI();
    });
    ctl.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    ctl.on('close', () => { if (NET.ctl === ctl) hostGone(); });
  });
}
function hostGone() { const was = STATE.mode; netLeave(); if (was === 'play' || was === 'lobby') { W = null; showScreen('title'); titleStatus('房主断开了连接'); } }
function guestRecv(m) {
  NET.seen = performance.now();
  switch (m.t) {
    case 'busy': titleStatus('房间已满或已经开始'); netLeave(); showScreen('title'); return;
    case 'bye': hostGone(); return;
    case 'lobby': NET.ready = m.ready; NET.hostName = m.host; NET.diff = m.diff; lobbyUI(); return;
    case 'start': startGame(m.seed, m.names, m.diff, 1); return;
    case 'toLobby': backToLobby(); return;
    case 'ev': if (W && m.e.s > (W.seq || 0)) { W.seq = m.e.s; fxEvent(m.e); } return;
    case 's': if (W && STATE.mode === 'play') applySnap(m); return;
  }
}
function applySnap(s) {
  if (s.T < NET.lastT - 5) return; NET.lastT = s.T;
  W.t = s.T; W.phase = s.ph; W.clock = s.cl; W.dayLen = s.dl; W.night = s.n; W.upg = s.u; W.kills = s.k;
  W.radio.hp = s.r[0]; W.radio.max = s.r[1]; if (s.r[2]) W.radio.hitT = 0.2;
  RES.forEach((r, i) => W.res[r.k] = s.res[i]); W.spawnLeft = s.sl;
  s.p.forEach((a, i) => {
    const p = W.p[i]; if (!p) return;
    const [x, y, L, vx, vy, aim, hp, fl, downT, wpn, mag, ammo, owned, nades, meds, useT, medT, reloadT, kills, anim, sel, ap] = a;
    const mine = i === ME;
    p.hp = hp; p.down = !!(fl & 1); p.dead = !!(fl & 2); p.gone = !!(fl & 4); p.downT = downT; p.selfRev = !!(fl & 128);
    p.mag = mag.split(',').map(Number); p.ammo = ammo.split(',').map(Number); p.owned = owned.split('').map(Number);
    p.nades = nades; p.meds = meds; p.useT = useT / 100; p.medT = medT; p.reloadT = reloadT; p.kills = kills; p.ready = !!(fl & 64);
    if (!mine) { p.tx = x; p.ty = y; p.L = L; p.vx = vx; p.vy = vy; p.aim = aim; p.build = !!(fl & 32); p.wpn = wpn; p.anim = anim; p.sel = sel; p.aimPt = ap ? { x: ap[0], y: ap[1], z: ap[2] } : null; if (p.x == null || d2(p.x, p.y, x, y) > 4) { p.x = x; p.y = y; } }
    else if (performance.now() > (p.wpnLock || 0)) p.wpn = wpn;
  });
  const old = new Map(); for (const z of W.zs) old.set(z.id, z);
  const zs = [];
  for (let k = 0; k < s.z.length; k += 9) {
    const id = s.z[k], key = ZI[s.z[k + 1]], T = ZT[key];
    let z = old.get(id);
    if (!z) z = { id, k: key, x: s.z[k + 2] / 100, y: s.z[k + 3] / 100, z: s.z[k + 5] / 100, r: T.r, h: T.h, face: 0, hp: 100, max: 100, anim: Math.random() * 6, seed: id * 7, hitT: 0, atk: 0 };
    z.tx = s.z[k + 2] / 100; z.ty = s.z[k + 3] / 100; z.L = s.z[k + 4]; z.tz = s.z[k + 5] / 100; z.face = s.z[k + 6] / 100; z.hp = s.z[k + 7]; z.max = 100;
    const b = s.z[k + 8]; z.climbing = b & 1 ? {} : null; if (b & 2) z.atk = 0.3; if (b & 4) z.hitT = 0.12; z.moving = !!(b & 8);
    zs.push(z);
  }
  W.zs = zs;
  W.proj = []; for (let k = 0; k < s.pr.length; k += 7) W.proj.push({ k: s.pr[k] ? 'acid' : 'nade', x: s.pr[k + 1], y: s.pr[k + 2], z: s.pr[k + 3], vx: s.pr[k + 4], vy: s.pr[k + 5], vz: s.pr[k + 6] });
  for (let k = 0; k < s.d.length; k += 3) { const i = s.d[k]; if (W.blk[i]) W.bhp[i] = s.d[k + 1]; if (W.slab[i]) W.shp[i] = s.d[k + 2]; W.ver++; }
}
function guestNetTick(dt) {
  if (!NET.ctl || !NET.ctl.open || !W) return;
  if (performance.now() - NET.seen > 9000) { hostGone(); return; }
  for (const p of W.p) if (p.i !== ME && p.tx != null) { const k = Math.min(1, dt * 14); p.x = lerp(p.x, p.tx + p.vx * 0.03, k); p.y = lerp(p.y, p.ty + p.vy * 0.03, k); p.z = surfZ(p.x, p.y, p.L); }
  for (const z of W.zs) { z.anim += dt; z.hitT -= dt; z.atk -= dt; if (z.tx != null) { const k = Math.min(1, dt * 10); z.x = lerp(z.x, z.tx, k); z.y = lerp(z.y, z.ty, k); z.z = lerp(z.z, z.tz, k); } }
  for (const b of W.proj) { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= 12 * dt; }
  W.radio.hitT = Math.max(0, W.radio.hitT - dt);
  NET.iT -= dt;
  if (NET.iT <= 0) {
    NET.iT = 1 / 30; const p = W.p[ME], i = p.inp;
    netSendFast({ t: 'i', n: ++NET.inN, x: r3(p.x), y: r3(p.y), l: p.L, vx: r2(p.vx), vy: r2(p.vy), a: r2(p.aim), ap: p.aimPt ? [r2(p.aimPt.x), r2(p.aimPt.y), r2(p.aimPt.z)] : 0, an: Math.round(p.anim * 10) / 10, f: i.fire, u: i.use, b: p.build ? 1 : 0, sel: p.sel });
  }
}
function guestPredictFire(dt) {
  const p = W.p[ME]; p.lfCD = (p.lfCD || 0) - dt;
  if (p.reloadVis > 0) p.reloadVis -= dt;
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (!p.inp.fire || p.build || p.dead || p.lfCD > 0 || p.reloadT > 0 || p.reloadVis > 0 || p.medT > 0 || p.mag[wi] <= 0) return;
  p.lfCD = w.rate; p.mag[wi]--;
  const [sx, sy, sz] = shoulder(p), [ax, ay, az] = aimDir(p), ends = [];
  const yaw = Math.atan2(ay, ax), pitch = Math.asin(clamp(az, -1, 1));
  for (let k = 0; k < w.pellets; k++) {
    const yw = yaw + (Math.random() - 0.5) * 2 * w.spread, pt = pitch + (Math.random() - 0.5) * w.spread;
    const dx = Math.cos(pt) * Math.cos(yw), dy = Math.cos(pt) * Math.sin(yw), dz = Math.sin(pt);
    const wall = rayWorld(sx, sy, sz, dx, dy, dz, w.range); let d = wall.d, hz = 0;
    if (!w.pierce) for (const z of W.zs) { const e = rayBox(sx, sy, sz, dx, dy, dz, z.x - z.r, z.y - z.r, z.z, z.r * 2, z.r * 2, z.h, d); if (e >= 0 && e < d) { d = e; hz = 1; } }
    ends.push([sx + dx * d, sy + dy * d, sz + dz * d, !hz && wall.i >= 0 ? 1 : 0]);
  }
  shotFx(ME, wi, ends);
}
