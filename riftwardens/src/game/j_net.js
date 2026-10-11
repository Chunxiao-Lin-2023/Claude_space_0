/* =================== networking (PeerJS, host authoritative) =================== */
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? {host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1'} : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({length: 4}, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = {mode: 'solo', role: null, peer: null, ctl: null, snap: null, code: '', sT: 0, pT: 0, timer: null, peerInfo: null, snapInt: 1 / 20, tvSent: 0};
const PEER_PREFIX = 'riftwardens-';
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
function netSend(o) { try { if (NET.ctl && NET.ctl.open) NET.ctl.send(JSON.stringify(o)); } catch (e) {} }
function netSendFast(o) { try { const c = NET.snap && NET.snap.open ? NET.snap : NET.ctl; if (c && c.open) c.send(JSON.stringify(o)); } catch (e) {} }
const connected = () => !!(NET.ctl && NET.ctl.open);
function netLeave() { try { netSend({t: 'bye'}); } catch (e) {} clearTimeout(NET.timer); try { NET.peer && NET.peer.destroy(); } catch (e) {} Object.assign(NET, {mode: 'solo', role: null, peer: null, ctl: null, snap: null, code: '', peerInfo: null}); }
function refreshLobby() { if (STATE === 'title' && $('lvBody')) levelScreen(); }
async function netHost() {
  NET.mode = 'online'; NET.role = 'host';
  try { await loadPeer(); } catch (e) { toast('联机组件加载失败，仍可单人游戏'); NET.mode = 'solo'; NET.role = null; refreshLobby(); return; }
  const open = tries => {
    const code = genCode(), peer = new Peer(PEER_PREFIX + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => { refreshLobby(); toast('房间已创建：' + code); });
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) {} open(tries + 1); } else if (!connected()) { toast('房间出错（' + err.type + '）'); } });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) {} });
    peer.on('connection', conn => {
      if (conn.label === 'snap') { NET.snap = conn; conn.on('data', d => { try { hostFast(JSON.parse(d)); } catch (e) {} }); return; }
      if (connected()) { conn.on('open', () => { conn.send(JSON.stringify({t: 'busy'})); setTimeout(() => conn.close(), 300); }); return; }
      NET.ctl = conn;
      conn.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } hostRecv(m); });
      conn.on('close', () => { if (NET.ctl === conn) peerGone(); });
    });
  };
  open(0); refreshLobby();
}
async function netJoin(code) {
  code = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(code)) { setTitleNote('请输入 4 位房间码'); return; }
  if (NET.mode === 'online') netLeave();
  NET.mode = 'online'; NET.role = 'guest'; NET.code = code; setTitleNote('正在连接房间 ' + code + ' …');
  try { await loadPeer(); } catch (e) { netLeave(); setTitleNote('联机组件加载失败，请检查网络'); return; }
  const peer = new Peer(undefined, PEER_OPTS); NET.peer = peer;
  NET.timer = setTimeout(() => { if (NET.role === 'guest' && !NET.hello) { netLeave(); setTitleNote('连接超时：检查房间码，或让房主保持页面在前台'); } }, 15000);
  peer.on('error', err => { if (NET.role !== 'guest' || STATE === 'play') return; netLeave(); setTitleNote(err.type === 'peer-unavailable' ? '找不到房间 ' + code : '连接失败（' + err.type + '）'); });
  peer.on('open', () => {
    const ctl = peer.connect(PEER_PREFIX + code, {label: 'ctl', reliable: true, serialization: 'raw'}); NET.ctl = ctl;
    ctl.on('open', () => {
      netSend({t: 'hello', hero: SAVE.hero, name: myName(), lo: loadout()});
      const snap = peer.connect(PEER_PREFIX + code, {label: 'snap', reliable: false, serialization: 'raw'}); NET.snap = snap;
      snap.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } guestRecv(m); });
    });
    ctl.on('data', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } guestRecv(m); });
    ctl.on('close', () => { if (NET.ctl === ctl) peerGone(); });
  });
}
function netSendLoadout() { if (NET.mode === 'online' && NET.role === 'guest' && connected()) netSend({t: 'hello', hero: SAVE.hero, name: myName(), lo: loadout(), upd: 1}); }
function peerGone() {
  if (NET.role === 'host') {
    NET.ctl = null; NET.snap = null; NET.peerInfo = null;
    if (P[1]) { P.length = 1; toast('队友离开了，继续单人游戏'); if (G) checkReady(); }
    refreshLobby();
  } else if (NET.role === 'guest') {
    const wasPlay = STATE === 'play'; netLeave(); G = null; P = []; ME = null; IS_HOST = true; MEI = 0;
    titleScreen(wasPlay ? '与房主的连接断开了' : '房间已关闭');
  }
}
/* ---------- host side ---------- */
function hostRecv(m) {
  if (m.t === 'hello') {
    NET.peerInfo = {hero: HEROES[m.hero] ? m.hero : 'warmage', name: String(m.name || '队友').slice(0, 8), lo: m.lo || {up: 0, traps: {}}};
    if (m.upd) { if (P[1]) { P[1].trapLv = NET.peerInfo.lo.traps || {}; P[1].up = NET.peerInfo.lo.up | 0; } return; }
    netSend({t: 'welcome', code: NET.code, h: {hero: SAVE.hero, name: myName()}});
    toast(NET.peerInfo.name + ' 加入了房间'); sfx('ready');
    if (STATE === 'play' && G && G.phase !== 'won' && G.phase !== 'lost') { // join mid-level
      const pi = NET.peerInfo; P[1] = mkPlayer(1, pi.hero, pi.name, pi.lo); G.coop = true;
      netSend({t: 'start', li: G.li, diff: G.diff, h: {hero: SAVE.hero, name: myName()}}); NET.tvSent = 0;
    } else refreshLobby();
    return;
  }
  if (m.t === 'bye') { peerGone(); return; }
  if (m.t === 'lobbyReq') { refreshLobby(); return; }
  const p = P[1]; if (!p || !G || STATE !== 'play') return;
  if (['fire', 'alt', 'skill', 'dash', 'place', 'sell', 'ready'].includes(m.t)) {
    const r = doAction(p, m);
    if (r && (m.t === 'place' || m.t === 'sell')) netSend({t: 'err', s: r});
  }
}
function hostFast(m) {
  const p = P[1]; if (!p || m.t !== 'p' || !G) return; p.seen = performance.now();
  if (!p.dead) { p.x = clamp(+m.x, 0, G.map.w * T); p.y = clamp(+m.y, 0, G.map.h * T); }
  p.aim = +m.a || 0; p.anim = m.an === 1 ? 'walk' : 'idle'; p.cast = +m.c || 0; p.mvx = +m.mx || 0; p.mvy = +m.my || 0;
}
const r1 = v => Math.round(v);
function snapFor() {
  const o = P[0], me = P[1];
  return {t: 's', tm: +G.time.toFixed(2), ph: ['build', 'wave', 'won', 'lost'].indexOf(G.phase), w: G.wave, gold: G.gold, rift: G.rift, left: G.enemies.filter(alive).length + G.spawnQ.length, tv: G.trapsV,
    rdy: P.map(p => p && p.ready ? 1 : 0), res: G.result ? G.result.skulls : -1, sk: G.streak && G.time - G.streak.last < B.streakWin ? G.streak.n : 0,
    e: G.enemies.map(e => [e.id, ORC_KEYS.indexOf(e.type), r1(e.x), r1(e.y), e.dir,
      Math.round(1000 * Math.max(0, e.hp) / e.mhp),
      (e.flash > 0 ? 1 : 0) | (e.frz > 0 ? 2 : 0) | (e.charm > 0 ? 4 : 0) | (e.burn > 0 ? 8 : 0) | (e.dead ? 16 : 0) | (e.fall ? 32 : 0) | (e.leaked ? 64 : 0) | (e.hpShow > 0 ? 128 : 0) | (e.haste > 0 ? 256 : 0) | (e.enr ? 512 : 0),
      e.anim === 'attack' ? 2 : e.anim === 'idle' ? 1 : 0, Math.round((e.act ? e.act.t : e.at) * 100) % 100000, Math.round((e.z || 0) * 100), Math.round((e.dead || e.fall) * 100)]),
    pj: G.projs.filter(q => !(q.own === 1 && q.pred)).map(q => [q.id, PK.indexOf(q.k), r1(q.x), r1(q.y), r1(q.vx), r1(q.vy), Math.round(q.life * 100), Math.round((q.L || 0) * 100)]),
    tu: G.turrets.map(t => [t.id, r1(t.x), r1(t.y), t.dir, +t.t.toFixed(1)]), pe: G.pets.map(f => [f.id, r1(f.x), r1(f.y), +(f.dir || 0).toFixed(2)]), zo: G.zones.map(z => [z.id, z.k === 'fog' ? 0 : 1, r1(z.x), r1(z.y), z.r, +z.t.toFixed(1), z.T]),
    dr: G.drops.map(d => [d.id, d.k === 'hp' ? 0 : 1, r1(d.x), r1(d.y)]),
    ta: G.traps.filter(t => t.anim > 0 || (t.hp != null && t.hp < t.mhp) || t.cd > 0).map(t => [t.id, Math.round(t.anim * 100), t.hp != null ? Math.round(t.hp) : -1, Math.round(t.cd * 10)]),
    me: {hp: r1(me.hp), mp: r1(me.mp), d: me.dead ? 1 : 0, rt: +me.rt.toFixed(1), inv: +me.inv.toFixed(2), wp: me.warp, x: r1(me.x), y: r1(me.y), kb: me.kbSeq ? [me.kbSeq, +me.kbA.toFixed(2), me.kbS] : null},
    o: {x: r1(o.x), y: r1(o.y), a: +o.aim.toFixed(2), an: o.anim === 'walk' ? 1 : 0, c: +o.cast.toFixed(2), hp: r1(o.hp), mhp: o.mhp, d: o.dead ? 1 : 0, rt: +o.rt.toFixed(1), inv: +o.inv.toFixed(2), h: o.hero, n: o.name, mp: r1(o.mp), ht: +o.hurtT.toFixed(2), at: +(o.atk || 0).toFixed(2), sp: +(o.spin || 0).toFixed(2), gd: +(o.guard || 0).toFixed(2)},
    ev: G.ev.filter(e => e.tt > G.time - 0.7)};
}
function netHostTick(dt) {
  if (!connected() || !P[1] || !G) return;
  if (P[1].seen && performance.now() - P[1].seen > 12000) { try { NET.ctl.close(); } catch (e) {} peerGone(); return; }
  if (NET.tvSent !== G.trapsV) { NET.tvSent = G.trapsV; netSend({t: 'traps', v: G.trapsV, l: G.traps.map(t => [t.id, TRAP_KEYS.indexOf(t.k), t.tx, t.ty, t.rot, t.lv, t.hp != null ? Math.round(t.hp) : -1, t.mhp || 0])}); }
  NET.sT += dt; if (NET.sT < NET.snapInt) return; NET.sT = 0;
  const s = JSON.stringify(snapFor()); NET.snapInt = s.length > 24000 ? 1 / 15 : 1 / 20;
  try { const c = NET.snap && NET.snap.open ? NET.snap : NET.ctl; c.send(s); } catch (e) {}
}
/* ---------- guest side ---------- */
function guestRecv(m) {
  if (m.t === 'busy') { netLeave(); setTitleNote('房间已满（最多 2 人）'); return; }
  if (m.t === 'bye') { peerGone(); return; }
  if (m.t === 'welcome') { clearTimeout(NET.timer); NET.hello = true; NET.peerInfo = m.h; NET.code = m.code; MSEL.tab = 'lv'; levelScreen(); toast('已加入房间 ' + m.code); return; }
  if (m.t === 'start') {
    clearTimeout(NET.timer); NET.hello = true; NET.peerInfo = m.h;
    IS_HOST = false; MEI = 1;
    newWorld(m.li, 2, m.diff || 'normal');
    P = [mkPlayer(0, m.h.hero, m.h.name), mkPlayer(1, SAVE.hero, myName(), loadout())];
    ME = P[1]; NET.lastWp = -1;
    enterPlay(); return;
  }
  if (m.t === 'lobby') { if (STATE === 'play') { G = null; P = []; ME = null; IS_HOST = true; MEI = 0; levelScreen(); toast('房主返回了关卡选择'); } return; }
  if (m.t === 'err') { toast(m.s); sfx('deny'); return; }
  if (!G || IS_HOST) return;
  if (m.t === 'traps') {
    if (m.v < (G.trapsV || 0)) return; G.trapsV = m.v;
    const old = new Map(G.traps.map(t => [t.id, t]));
    G.traps = m.l.map(([id, ki, tx, ty, rot, lv, hp, mhp]) => { const o = old.get(id) || {anim: 0, cd: 0}; return Object.assign(o, {id, k: TRAP_KEYS[ki], tx, ty, rot, lv, hp: hp >= 0 ? hp : undefined, mhp: mhp || undefined}); });
    G.trapAt.fill(-1); for (const t of G.traps) G.trapAt[tIdx(t.tx, t.ty)] = t.id;
    refreshFlow();
    return;
  }
  if (m.t === 's') applySnap(m);
}
function applySnap(s) {
  G.time = s.tm; const ph = ['build', 'wave', 'won', 'lost'][s.ph]; if (ph !== G.phase) { G.phase = ph; if (ph === 'won' || ph === 'lost') { G.endT = 0; G.result = {won: ph === 'won', skulls: s.res}; } }
  G.wave = s.w; G.gold = s.gold; G.sk = s.sk || 0; G.rift = s.rift; G.left = s.left; if (s.res >= 0 && G.result) G.result.skulls = s.res;
  P.forEach((p, i) => { if (p && i !== MEI) p.ready = !!s.rdy[i]; }); ME.ready = !!s.rdy[MEI];
  // me
  const me = s.me, p = ME;
  p.hp = me.hp; p.mp = me.mp; p.dead = !!me.d; p.rt = me.rt; p.inv = Math.max(p.inv, me.inv);
  if (NET.lastWp !== me.wp) { if (NET.lastWp >= 0 || p.dead) { p.x = me.x; p.y = me.y; } NET.lastWp = me.wp; }
  if (me.kb && me.kb[0] !== NET.kbSeq) { NET.kbSeq = me.kb[0]; p.kbx = Math.cos(me.kb[1]) * me.kb[2]; p.kby = Math.sin(me.kb[1]) * me.kb[2]; p.kbT = 0.22; }
  // host avatar
  const o = s.o, h = P[0];
  Object.assign(h, {x: o.x, y: o.y, aim: o.a, anim: o.an ? 'walk' : 'idle', cast: o.c, hp: o.hp, mhp: o.mhp, dead: !!o.d, rt: o.rt, inv: o.inv, hero: o.h, name: o.n, mp: o.mp, hurtT: o.ht, atk: o.at, spin: o.sp, guard: o.gd});
  G.turrets = (s.tu || []).map(([id, x, y, dir, t]) => ({id, x, y, dir, t}));
  const opets = new Map((G.pets || []).map(f => [f.id, f])); G.pets = (s.pe || []).map(([id, x, y, dir]) => { const f = opets.get(id) || {id, x, y}; f.tx = x; f.ty = y; f.dir = dir; return f; });
  G.zones = (s.zo || []).map(([id, k, x, y, r, t, T]) => ({id, k: k ? 'smoke' : 'fog', x, y, r, t, T}));
  // enemies
  const seen = new Set();
  for (const a of s.e) {
    const [id, ti, x, y, dir, hp, fl, an, at, z, dt] = a; seen.add(id); let e = CL.enemies.get(id);
    const type = ORC_KEYS[ti];
    if (!e) { e = {id, type, x, y, rx: x, ry: y, at: 0, mhp: 1000}; CL.enemies.set(id, e); }
    e.x = x; e.y = y; e.dir = dir; e.hp = hp; e.mhp = 1000;
    e.flash = fl & 1 ? 0.1 : 0; e.frz = fl & 2 ? 1 : 0; e.charm = fl & 4 ? 1 : 0; e.burn = fl & 8 ? 1 : 0; e.hpShow = fl & 128 ? 1 : 0; e.leaked = fl & 64 ? 1 : 0; e.haste = fl & 256 ? 1 : 0; e.enr = fl & 512 ? 1 : 0;
    e.dead = fl & 16 ? Math.max(e.dead || 0, dt / 100) : 0; e.fall = fl & 32 ? Math.max(e.fall || 0, dt / 100) : 0;
    e.anim = an === 2 ? 'attack' : an === 1 ? 'idle' : 'walk'; e.z = z / 100;
    if (e.anim === 'attack') { e.act = {t: at / 100}; } else { e.act = null; if (Math.abs(e.at - at / 100) > 0.5) e.at = at / 100; }
  }
  for (const e of CL.enemies.values()) if (!seen.has(e.id) && !e.dead && !e.fall) e.dead = 0.3;
  CL.projs = s.pj.map(([id, k, x, y, vx, vy, life, L]) => ({id, k: PK[k], x, y, vx, vy, life: life / 100, L: L / 100}));
  CL.drops = s.dr.map(([id, k, x, y]) => ({id, k: k ? 'mp' : 'hp', x, y}));
  const ta = new Map(s.ta.map(a => [a[0], a]));
  for (const t of G.traps) { const a = ta.get(t.id); if (a) { t.anim = Math.max(t.anim > 0 ? t.anim : 0, a[1] / 100); if (a[2] >= 0) t.hp = a[2]; t.cd = a[3] / 10; } else { t.cd = 0; if (t.mhp) t.hp = t.mhp; } }
  for (const e of s.ev) if (e.id > CL.evMax) { CL.evMax = e.id; playEv(e); }
}
function guestInterp(dt) {
  const k = 1 - Math.exp(-14 * dt);
  for (const e of CL.enemies.values()) {
    e.rx += (e.x - e.rx) * k; e.ry += (e.y - e.ry) * k; e.at += dt;
    if (e.act) e.act.t += dt;
    if (e.dead) e.dead += dt; if (e.fall) e.fall += dt;
  }
  for (const [id, e] of CL.enemies) if ((e.dead || e.fall) > 1.0) CL.enemies.delete(id);
  for (const q of CL.projs) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.life != null) q.life -= dt; }
  for (const f of (G.pets || [])) if (f.tx != null) { f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k; }
  for (const t of G.traps) t.anim = Math.max(0, t.anim - dt);
  const h = P[0]; if (h) { if (h.rx == null || dist2(h.rx, h.ry, h.x, h.y) > 300 * 300) { h.rx = h.x; h.ry = h.y; } h.rx += (h.x - h.rx) * k; h.ry += (h.y - h.ry) * k; h.at = (h.at || 0) + dt; h.hurtT = Math.max(0, (h.hurtT || 0) - dt); }
}
function hostInterpGuest(dt) {
  const p = P[1]; if (!p) return; const k = 1 - Math.exp(-14 * dt);
  if (p.rx == null || dist2(p.rx, p.ry, p.x, p.y) > 300 * 300) { p.rx = p.x; p.ry = p.y; }
  p.rx += (p.x - p.rx) * k; p.ry += (p.y - p.ry) * k; p.at += dt; p.hurtT = Math.max(0, p.hurtT - dt); p.cast = Math.max(0, p.cast - dt);
}
let gSendT = 0;
function netGuestTick(dt) {
  gSendT += dt; if (gSendT < 1 / 30) return; gSendT = 0;
  const p = ME; netSendFast({t: 'p', x: r1(p.x), y: r1(p.y), a: +p.aim.toFixed(2), an: p.anim === 'walk' ? 1 : 0, c: +p.cast.toFixed(2), mx: +p.mvx.toFixed(2), my: +p.mvy.toFixed(2)});
}

/* =================== event playback (both sides) =================== */
function playEv(o) {
  const now = performance.now() / 1000;
  switch (o.k) {
    case 'hit': {
      burst(o.x, o.y, o.b ? 6 : 4, o.b ? '#9b7ab0' : '#6fbf3a', 120, 0.35, 2.5, 400);
      if (o.c === MEI || o.c < 0) ftxt(o.x + rnd(-8, 8), o.y - 10, o.d, o.c === MEI ? '#ffffff' : '#d0d0d0');
      sfx(o.b ? 'hitB' : 'hit', o.x, o.y, 0.8); break;
    }
    case 'gold': ftxt(o.x, o.y - 10, '+' + o.v, '#f3d27a'); sfx('coin', o.x, o.y, 0.6); break;
    case 'die': { const t = ORC_KEYS[o.t]; burst(o.x, o.y - 16, 12, t === 'bat' ? '#5a1822' : '#4f8a2a', 180, 0.6, 3, 500); fx({k: 'smoke', x: o.x, y: o.y - 8, vy: -20, life: 0.8, s: 10}); sfx(t === 'bat' ? 'batDie' : 'orcDie', o.x, o.y); break; }
    case 'fall': if (o.lava) { burst(o.x, o.y, 16, '#ffb02e', 160, 0.7, 3.5, -50); fx({k: 'glow', x: o.x, y: o.y, s: 60, life: 0.5, col: '255,140,40', light: 140, lc: '255,140,40'}); sfx('burn', o.x, o.y); } sfx('fall', o.x, o.y); break;
    case 'rift': if (G) G._riftFlash = now + 0.4; sfx('rift'); CAM.shake = 5; toast('裂隙受损 -' + o.v); fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: 70, life: 0.5, col: '#6be6ff', w: 5}); break;
    case 'shoot': sfx('arrow', o.x, o.y, 0.6); break;
    case 'slam': fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: 100, life: 0.5, col: '#c8b48a', w: 8}); burst(o.x, o.y, 14, '#8a7a5a', 200, 0.6, 4, 400); CAM.shake = 9; sfx('slam', o.x, o.y); break;
    case 'blast': { const a = o.a; fx({k: 'cone', x: o.x + Math.cos(a) * 10, y: o.y - 20 + Math.sin(a) * 10, ang: a, arc: HEROES.warmage.alt.arc, r1: HEROES.warmage.alt.r + 20, life: 0.35}); for (let i = 0; i < 10; i++) { const b = a + rnd(-0.9, 0.9), v = rnd(200, 420); fx({k: 'p', x: o.x, y: o.y - 20, vx: Math.cos(b) * v, vy: Math.sin(b) * v, life: 0.35, col: '#fff0c8', s: 2.5, drag: 4}); } sfx('blast', o.x, o.y); if (o.p === MEI) CAM.shake = 4; break; }
    case 'charm': for (let i = 0; i < 6; i++) fx({k: 'heart', x: o.x + rnd(-14, 14), y: o.y - 40 - rnd(10), vy: -50, vx: rnd(-20, 20), life: 0.9}); fx({k: 'ring', x: o.x, y: o.y, s: 8, r1: 40, life: 0.5, col: '#ff7adf', w: 4}); sfx('charm', o.x, o.y); break;
    case 'uncharm': break;
    case 'boom': fx({k: 'glow', x: o.x, y: o.y, s: 110, life: 0.45, col: '255,150,50', grow: 0.3, light: 260, lc: '255,140,40'}); fx({k: 'ring', x: o.x, y: o.y + 10, s: 20, r1: 110, life: 0.45, col: '#ffb46a', w: 8}); burst(o.x, o.y, 26, '#ff8a2a', 300, 0.6, 4, 100); for (let i = 0; i < 8; i++) fx({k: 'smoke', x: o.x + rnd(-30, 30), y: o.y + rnd(-20, 20), vy: -30, life: 1.2, s: 14}); CAM.shake = 8; sfx('boom', o.x, o.y); break;
    case 'fbcast': sfx('fireball', o.x, o.y); break;
    case 'nova': fx({k: 'ring', x: o.x, y: o.y, s: 20, r1: HEROES.sorc.skill.r, life: 0.5, col: '#bff4ff', w: 10, flat: 0.62}); fx({k: 'glow', x: o.x, y: o.y, s: 140, life: 0.4, col: '120,220,255', light: 240, lc: '140,220,255'}); for (let i = 0; i < 24; i++) { const a = rnd(TAU), v = rnd(200, 420); fx({k: 'shard', x: o.x, y: o.y - 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.62, life: 0.5, col: '#dff8ff', s: 5, rot: a, drag: 3}); } sfx('nova', o.x, o.y); break;
    case 'dash': if (o.p !== MEI) { const p = P[o.p]; if (p && o.h !== 'sorc') { for (let k = 0; k < 5; k++) fx({k: 'ghost', u: HEROES[p.hero].atlas, fi: 0, d: dirOf(Math.atan2(o.y - o.y0, o.x - o.x0)), x: lerp(o.x0, o.x, k / 5), y: lerp(o.y0, o.y, k / 5), life: 0.3, tint: 'rgba(255,220,160,.5)'}); } if (p && o.h === 'sorc') { for (let k = 0; k < 4; k++) fx({k: 'ghost', u: 'sorc', fi: 0, d: dirOf(p.aim), x: lerp(p.rx || p.x, o.x, k / 4), y: lerp(p.ry || p.y, o.y, k / 4), life: 0.35, tint: 'rgba(120,220,255,.6)'}); if (p.rx != null) { p.rx = o.x; p.ry = o.y; } } sfx(o.h === 'sorc' ? 'blink' : 'dash', o.x, o.y, 0.7); } break;
    case 'pfire': { const p = P[o.p]; if (p) sfx(HEROES[p.hero].primary.kind === 'orb' ? 'orb' : 'bolt', p.x, p.y, 0.45); break; }
    case 'place': fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: 34, life: 0.35, col: '#f3d27a', w: 3}); burst(o.x, o.y, 8, '#9a8a70', 100, 0.4, 2.5, 200); sfx('place', o.x, o.y); break;
    case 'sell': ftxt(o.x, o.y - 20, '+' + o.v, '#f3d27a', true); sfx('sell', o.x, o.y); break;
    case 'barHit': burst(o.x, o.y - 20, 4, '#9a6a38', 140, 0.4, 2.5, 500); sfx('barHit', o.x, o.y); break;
    case 'barBreak': burst(o.x, o.y - 20, 18, '#9a6a38', 220, 0.7, 3.5, 500); fx({k: 'smoke', x: o.x, y: o.y - 10, life: 0.9, s: 18}); sfx('barBreak', o.x, o.y); toast('路障被摧毁了！'); break;
    case 'trap':
      if (o.s === 'spike') { burst(o.x, o.y, 6, '#e0e6ee', 120, 0.3, 2, 400); sfx('spike', o.x, o.y); }
      else if (o.s === 'spring') { fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: 40, life: 0.3, col: '#ffe08a', w: 4}); sfx('spring', o.x, o.y); }
      else if (o.s === 'brim') { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) fx({k: 'pillar', x: o.x + dx * T, y: o.y + dy * T + 18, s: 18, h: 90, life: 1.0, col: '255,130,30'}); burst(o.x, o.y, 30, '#ffb02e', 220, 0.8, 4, -80); fx({k: 'glow', x: o.x, y: o.y, s: 120, life: 1, col: '255,120,30', light: 200, lc: '255,130,40'}); sfx('brim', o.x, o.y); }
      else if (o.s === 'frost') { fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: T * 1.6, life: 0.5, col: '#dff8ff', w: 8}); for (let i = 0; i < 18; i++) { const a = rnd(TAU), v = rnd(100, 260); fx({k: 'shard', x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, life: 0.5, col: '#dff8ff', s: 4, rot: a, drag: 3}); } fx({k: 'glow', x: o.x, y: o.y, s: 90, life: 0.6, col: '140,220,255', light: 180, lc: '140,220,255'}); sfx('frost', o.x, o.y); }
      else if (o.s === 'arrow') sfx('arrow', o.x, o.y, 0.7);
      break;
    case 'grind': burst(o.x, o.y - 16, 5, '#6fbf3a', 160, 0.35, 2.5, 500); sfx('grind', o.x, o.y, 0.6); break;
    case 'phit': { const p = P[o.p]; if (p) p.hurtT = 0.25; if (o.p === MEI) { sfx('pHurt'); CAM.shake = Math.max(CAM.shake || 0, 4); } break; }
    case 'pdie': burst(o.x, o.y - 20, 20, '#c02020', 200, 0.7, 3, 500); sfx('pDie', o.x, o.y); if (o.p === MEI) banner('你倒下了', B.respawn + ' 秒后复活'); else toast('队友倒下了'); break;
    case 'respawn': { const p = P[o.p]; if (p) { const s = spawnPoint(); fx({k: 'ring', x: s.x, y: s.y, s: 10, r1: 50, life: 0.6, col: '#9fe3ff', w: 4}); if (p.rx != null) { p.rx = s.x; p.ry = s.y; } } sfx('potion'); break; }
    case 'potion': ftxt(o.x, o.y - 20, o.k ? '法力' : '生命', o.k ? '#7fb8ff' : '#ff8a8a', true); sfx('potion', o.x, o.y); break;
    case 'ready': if (o.p !== MEI && o.v) toast('队友已准备'); break;
    case 'wave': banner('第 ' + (o.w + 1) + ' 波', '兽人来袭！'); sfx('horn'); if (ME) ME.placed = []; CAM.over = false; break;
    case 'waveEnd': banner('第 ' + o.w + ' 波已击退', '奖励 +' + o.b + ' 金币'); sfx('win', null, null, 0.6); break;
    case 'boss': banner('兽人督军来袭！', '集中火力！'); sfx('horn'); CAM.shake = 10; break;
    case 'end': break;
    case 'combo': ftxt(o.x, o.y, o.s + ' +' + o.b, '#ffb84a', true); fx({k: 'glow', x: o.x, y: o.y + 20, s: 40, life: 0.4, col: '255,170,60'}); sfx('coin', o.x, o.y); break;
    case 'streak': banner('连杀 ×' + o.n, '奖励 +' + o.b + ' 金币'); sfx('win', null, null, 0.5); break;
    case 'heal': fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: ORCS.shaman.healR, life: 0.6, col: '#7cff6a', w: 4}); for (let i = 0; i < 6; i++) fx({k: 'p', x: o.x + rnd(-60, 60), y: o.y - rnd(10, 40), vy: -50, life: 0.7, col: '#9dff8a', s: 2.5}); sfx('potion', o.x, o.y, 0.4); break;
    case 'sapBoom': fx({k: 'glow', x: o.x, y: o.y, s: 90, life: 0.4, col: '255,150,50', light: 200, lc: '255,140,40'}); burst(o.x, o.y, 22, '#ff9a3a', 260, 0.6, 4, 200); for (let i = 0; i < 5; i++) fx({k: 'smoke', x: o.x + rnd(-20, 20), y: o.y, vy: -30, life: 1, s: 14}); CAM.shake = Math.max(CAM.shake || 0, 6); sfx('boom', o.x, o.y, 0.8); toast('工兵炸毁了一个陷阱！'); break;
    case 'warcry': fx({k: 'ring', x: o.x, y: o.y, s: 20, r1: 260, life: 0.7, col: '#ff6a3a', w: 8}); banner('督军战吼！', '附近兽人加速'); sfx('horn'); break;
    case 'charge': sfx('slam', o.x, o.y); CAM.shake = 8; toast('督军冲锋！'); break;
    case 'enrage': banner('督军狂暴！', '攻击速度大幅提升'); sfx('horn'); break;
    case 'upg': fx({k: 'ring', x: o.x, y: o.y, s: 8, r1: 34, life: 0.4, col: '#9fe3ff', w: 3}); for (let i = 0; i < 8; i++) fx({k: 'p', x: o.x + rnd(-16, 16), y: o.y, vy: -90, life: 0.6, col: '#bfefff', s: 2}); sfx('ready', o.x, o.y); break;
    case 'block': burst(o.x, o.y, 4, '#ffe9a0', 140, 0.25, 2, 300); sfx('barHit', o.x, o.y, 0.6); break;
    case 'swing': if (o.p !== MEI) { const p = P[o.p]; if (p) { swingFx(p, o.a, false); sfx('swing', p.x, p.y, 0.6); } } break;
    case 'guard': fx({k: 'ring', x: o.x, y: o.y, s: 10, r1: HEROES.paladin.alt.taunt, life: 0.5, col: '#ffd86a', w: 5}); fx({k: 'glow', x: o.x, y: o.y - 30, s: 60, life: 0.4, col: '255,220,120'}); sfx('guard', o.x, o.y); break;
    case 'judg': fx({k: 'ring', x: o.x, y: o.y, s: 15, r1: HEROES.paladin.skill.r, life: 0.5, col: '#ffe9a0', w: 9}); fx({k: 'glow', x: o.x, y: o.y, s: 120, life: 0.4, col: '255,230,150', light: 220, lc: '255,230,150'}); burst(o.x, o.y, 16, '#b8a888', 220, 0.5, 4, 400); CAM.shake = Math.max(CAM.shake || 0, 7); sfx('judg', o.x, o.y); break;
    case 'volley': sfx('volley', o.x, o.y); break;
    case 'knives': sfx('throw', o.x, o.y); break;
    case 'falcon': for (let i = 0; i < 6; i++) fx({k: 'p', x: o.x + rnd(-10, 10), y: o.y - 60, vx: rnd(-60, 60), vy: rnd(-40, 20), g: 60, life: 0.8, col: '#a07850', s: 2.5}); sfx('falcon', o.x, o.y); break;
    case 'turret': burst(o.x, o.y, 8, '#c8a070', 100, 0.4, 2.5, 200); sfx('turret', o.x, o.y); break;
    case 'tshot': sfx('tshot', o.x, o.y, 0.5); break;
    case 'poof': fx({k: 'smoke', x: o.x, y: o.y, life: 0.7, s: 14}); break;
    case 'fog': sfx('fog', o.x, o.y); break;
    case 'storm': sfx('storm', P[o.p] ? P[o.p].x : null, P[o.p] ? P[o.p].y : null); break;
    case 'splash': burst(o.x, o.y - 6, 14, '#8cff5a', 170, 0.45, 3, 380); fx({k: 'ring', x: o.x, y: o.y, s: 8, r1: HEROES.alch.primary.r, life: 0.35, col: '#9dff7a', w: 4}); sfx('splash', o.x, o.y); break;
  }
}
