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
    const code = genCode(), peer = new Peer('lasttower-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
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
    case 'ping': return;
  }
  if (!W || STATE.mode !== 'play' || !W.p[1]) return;
  const p = W.p[1];
  if (m.t === 'i') {
    if (m.n < (p.inSeq || 0)) return; p.inSeq = m.n;
    if (!p.dead) { p.x = m.x; p.y = m.y; p.vx = m.vx; p.vy = m.vy; p.climbing = !!m.cl; p.ground = !!m.g; p.h = p.down ? 0.8 * T : 1.8 * T; }
    p.aim = m.a; p.anim = m.an; p.sel = m.sel || 1;
    Object.assign(p.inp, { fire: m.f, use: m.u });
    p.build = !!m.b;
  } else if (m.t === 'act') doAct(p, m.a, m.v);
}
function guestGone() {
  NET.gctl = null; NET.gsnap = null; NET.guestName = ''; NET.ready = false;
  if (STATE.mode === 'play' && W && W.p[1]) { W.p[1].gone = true; uiMsg('队友断开了连接，你可以继续单人守夜', '#ff6b5a'); W.p[1].down = false; }
  lobbyUI();
}
function sendLobby() { netSendCtl({ t: 'lobby', ready: NET.ready, host: SET.name || '房主', code: NET.code, diff: SET.diff }); }
function hostStart() {
  if (!NET.gctl || !NET.gctl.open) return;
  const seed = (Math.random() * 1e9) | 0, names = [SET.name || '房主', NET.guestName || '队友'];
  netSendCtl({ t: 'start', seed, names, diff: SET.diff });
  startGame(seed, names, SET.diff, 0);
}
/* snapshot */
const ZI = ZKEYS;
function pFlags(p) { return (p.down ? 1 : 0) | (p.dead ? 2 : 0) | (p.gone ? 4 : 0) | (p.climbing ? 8 : 0) | (p.ground ? 16 : 0) | (p.build ? 32 : 0) | (p.ready ? 64 : 0) | (p.selfRev ? 128 : 0); }
function makeSnap() {
  const P = p => [r1(p.x), r1(p.y), Math.round(p.vx), Math.round(p.vy), r2(p.aim), Math.ceil(p.hp), pFlags(p), r1(p.downT), p.wpn, p.mag.join(','), p.ammo.join(','), p.owned.join(''), p.nades, p.meds, Math.round(p.useT * 100), r1(p.medT), r1(p.reloadT), p.kills, r1(p.anim), p.sel];
  const z = []; for (const q of W.zs) z.push(q.id, ZI.indexOf(q.k), Math.round(q.x), Math.round(q.y), Math.round(q.vx), q.face, Math.ceil(q.hp / q.max * 100), (q.climbing === 'wall' ? 1 : q.climbing === 'lad' ? 16 : 0) | (q.atk > 0 ? 2 : 0) | (q.hitT > 0 ? 4 : 0));
  const pr = []; for (const b of W.proj) pr.push(b.k === 'nade' ? 0 : 1, Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy));
  const d = []; for (const i of W.dirty) d.push(i, Math.round(W.thp[i])); W.dirty.clear();
  return { t: 's', T: r2(W.t), ph: W.phase, cl: r1(W.clock), dl: W.dayLen, n: W.night, r: [Math.round(W.radio.hp), Math.round(W.radio.max), W.radio.hitT > 0 ? 1 : 0], res: RES.map(r => W.res[r.k]), u: W.upg, k: W.kills, p: W.p.map(P), z, pr, d, sl: W.spawnQ.length };
}
function hostNetTick(dt) {
  if (!NET.gctl || !NET.gctl.open) return;
  if (performance.now() - NET.seen > 9000) { try { NET.gctl.close(); } catch (e) { } guestGone(); return; }
  NET.sT -= dt;
  if (NET.sT <= 0) {
    const s = makeSnap(), js = JSON.stringify(s);
    NET.sT = js.length > 24000 ? 1 / 15 : 1 / 20;
    try { const c = NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl; if (c && c.open) c.send(js); } catch (e) { }
  }
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
    const ctl = peer.connect('lasttower-' + code, { label: 'ctl', reliable: true, serialization: 'raw' });
    NET.ctl = ctl;
    ctl.on('open', () => {
      NET.seen = performance.now();
      sendRaw(ctl, { t: 'hello', name: SET.name || '' });
      const sn = peer.connect('lasttower-' + code, { label: 'snap', reliable: false, serialization: 'raw' }); NET.snap = sn;
      sn.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { } });
      titleStatus(''); showScreen('lobby'); lobbyUI();
    });
    ctl.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    ctl.on('close', () => { if (NET.ctl === ctl) hostGone(); });
  });
}
function hostGone() { const was = STATE.mode; netLeave(); if (was === 'play' || was === 'lobby') { showScreen('title'); titleStatus('房主断开了连接'); STATE.mode = 'title'; } }
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
  RES.forEach((r, i) => W.res[r.k] = s.res[i]);
  W.spawnLeft = s.sl;
  s.p.forEach((a, i) => {
    const p = W.p[i]; if (!p) return;
    const [x, y, vx, vy, aim, hp, fl, downT, wpn, mag, ammo, owned, nades, meds, useT, medT, reloadT, kills, anim, sel] = a;
    const mine = i === ME, wasDown = p.down;
    p.hp = hp; p.down = !!(fl & 1); p.dead = !!(fl & 2); p.gone = !!(fl & 4); p.downT = downT; p.selfRev = !!(fl & 128);
    p.mag = mag.split(',').map(Number); p.ammo = ammo.split(',').map(Number); p.owned = owned.split('').map(Number);
    p.nades = nades; p.meds = meds; p.useT = useT / 100; p.medT = medT; p.reloadT = reloadT; p.kills = kills; p.ready = !!(fl & 64);
    if (!mine) { p.tx = x; p.ty = y; p.vx = vx; p.vy = vy; p.aim = aim; p.climbing = !!(fl & 8); p.ground = !!(fl & 16); p.build = !!(fl & 32); p.wpn = wpn; p.anim = anim; p.sel = sel; if (p.x == null || dist(p.x, p.y, x, y) > 5 * T) { p.x = x; p.y = y; } p.h = p.down ? 0.8 * T : 1.8 * T; }
    else { if (performance.now() > (p.wpnLock || 0)) p.wpn = wpn; if (wasDown && !p.down) p.h = 1.8 * T; }
  });
  // zombies
  const old = new Map(); for (const z of W.zs) old.set(z.id, z);
  const zs = [];
  for (let k = 0; k < s.z.length; k += 8) {
    const id = s.z[k], key = ZI[s.z[k + 1]], Z = ZT[key];
    let z = old.get(id);
    if (!z) z = { id, k: key, x: s.z[k + 2], y: s.z[k + 3], w: Z.w * T, h: Z.h * T, vx: 0, vy: 0, face: 1, hp: 100, max: 100, anim: Math.random() * 6, seed: id * 7, hitT: 0, atk: 0, climbing: false };
    z.tx = s.z[k + 2]; z.ty = s.z[k + 3]; z.vx = s.z[k + 4]; z.face = s.z[k + 5]; z.hp = s.z[k + 6]; z.max = 100;
    const b = s.z[k + 7]; z.climbing = b & 1 ? 'wall' : b & 16 ? 'lad' : false; if (b & 2) z.atk = 0.25; if (b & 4) z.hitT = 0.12;
    zs.push(z);
  }
  W.zs = zs;
  W.proj = []; for (let k = 0; k < s.pr.length; k += 5) W.proj.push({ k: s.pr[k] ? 'acid' : 'nade', x: s.pr[k + 1], y: s.pr[k + 2], vx: s.pr[k + 3], vy: s.pr[k + 4] });
  for (let k = 0; k < s.d.length; k += 2) if (W.tiles[s.d[k]]) W.thp[s.d[k]] = s.d[k + 1];
}
function guestNetTick(dt) {
  if (!NET.ctl || !NET.ctl.open || !W) return;
  if (performance.now() - NET.seen > 9000) { hostGone(); return; }
  for (const p of W.p) if (p.i !== ME && p.tx != null) { const k = Math.min(1, dt * 14); p.x = lerp(p.x, p.tx + p.vx * 0.03, k); p.y = lerp(p.y, p.ty, k); }
  for (const z of W.zs) { z.anim += dt; z.hitT -= dt; z.atk -= dt; if (z.tx != null) { const k = Math.min(1, dt * 10); z.x = lerp(z.x, z.tx, k); z.y = lerp(z.y, z.ty, k); } }
  for (const b of W.proj) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += GRAV * 0.6 * dt; }
  W.radio.hitT = Math.max(0, W.radio.hitT - dt);
  NET.iT -= dt;
  if (NET.iT <= 0) {
    NET.iT = 1 / 30; const p = W.p[ME], i = p.inp;
    netSendFast({ t: 'i', n: ++NET.inN, x: r1(p.x), y: r1(p.y), vx: Math.round(p.vx), vy: Math.round(p.vy), a: r2(p.aim), an: r1(p.anim), cl: p.climbing ? 1 : 0, g: p.ground ? 1 : 0, f: i.fire, u: i.use, b: p.build ? 1 : 0, sel: p.sel });
  }
}
// guest: show its own shots immediately (host is authoritative for hits)
function guestPredictFire(dt) {
  const p = W.p[ME]; p.lfCD = (p.lfCD || 0) - dt;
  if (p.reloadVis > 0) p.reloadVis -= dt;
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (!p.inp.fire || p.build || p.dead || p.lfCD > 0 || p.reloadT > 0 || p.reloadVis > 0 || p.medT > 0 || p.mag[wi] <= 0) return;
  p.lfCD = w.rate; p.mag[wi]--;
  const [mx, my, sx, sy] = muzzle(p);
  const ox = solidFor(tileAt(Math.floor(mx / T), Math.floor(my / T)), 'b') ? sx : mx, oy = ox === sx ? sy : my, ends = [];
  for (let k = 0; k < w.pellets; k++) {
    const a = p.aim + (Math.random() - 0.5) * 2 * w.spread, dx = Math.cos(a), dy = Math.sin(a);
    const wall = rayTiles(ox, oy, dx, dy, w.range); let d = wall.d, hz = 0;
    if (!w.pierce) for (const z of W.zs) { const e = rayBox(ox, oy, dx, dy, z.x - z.w / 2, z.y - z.h, z.w, z.h, d); if (e >= 0 && e < d) { d = e; hz = 1; } }
    ends.push([ox + dx * d, oy + dy * d, !hz && wall.i >= 0 ? 1 : 0]);
  }
  shotFx(ME, wi, ox, oy, ends);
}
