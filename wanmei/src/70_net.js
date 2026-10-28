/* ================= co-op networking (PeerJS, host authoritative, 2 players) =================
   host = 小不点 (P1), runs the world, story and all mobs.  guest = the divine-beast partner (P2):
   moves itself locally (30 Hz position reports), casts are executed by the host. */
const inArtifact = () => !!(window.claude && typeof window.claude.use === 'function') || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname) || !!window.__ARTIFACT__;
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_OPTS = QS.get('peerhost') ? { host: QS.get('peerhost'), port: +(QS.get('peerport') || 9000), path: QS.get('peerpath') || '/', secure: QS.get('peersecure') === '1' } : {};
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '', sT: 0, iT: 0, dT: 0, seen: 0, known: new Set(), gp: new Map() };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = next; document.head.appendChild(sc); }; next(); }); }
const linkUp = () => NETROLE === 'host' ? !!(NET.gctl && NET.gctl.open) : NETROLE === 'guest' ? !!(NET.ctl && NET.ctl.open) : false;
function sendRaw(c, o) { try { if (c && c.open) c.send(JSON.stringify(o)); } catch (e) { } }
function netSendCtl(o) { sendRaw(NETROLE === 'host' ? NET.gctl : NET.ctl, o); }
function netSendFast(o) { const c = NETROLE === 'host' ? (NET.gsnap && NET.gsnap.open ? NET.gsnap : NET.gctl) : (NET.snap && NET.snap.open ? NET.snap : NET.ctl); sendRaw(c, o); }
function netEv(e) { if (NETROLE === 'host' && linkUp()) netSendCtl({ t: 'ev', e }); }
function netLeave() { try { netSendCtl({ t: 'bye' }); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { } Object.assign(NET, { peer: null, code: '', ctl: null, snap: null, gctl: null, gsnap: null, guestName: '' }); NET.known.clear(); }
/* ---------- host ---------- */
async function netHost() {
  netLeave(); NETROLE = 'host'; lobbyUI('正在创建房间…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败，请检查网络'); return; }
  const open = tries => { const code = genCode(), peer = new Peer('wanmei-' + code, PEER_OPTS); NET.peer = peer; NET.code = code;
    peer.on('open', () => lobbyUI());
    peer.on('error', err => { if (err.type === 'unavailable-id' && tries < 4) { try { peer.destroy(); } catch (e) { } open(tries + 1); } else if (!linkUp()) lobbyUI('房间出错（' + err.type + '）'); });
    peer.on('disconnected', () => { if (NET.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on('connection', conn => {
      if (conn.label === 'snap') { if (NET.gctl && conn.peer === NET.gctl.peer) { NET.gsnap = conn; conn.on('data', d => { try { hostRecv(JSON.parse(d)); } catch (e) { } }); } else conn.close(); return; }
      if (NET.gctl && NET.gctl.open) { conn.on('open', () => { conn.send(JSON.stringify({ t: 'busy' })); setTimeout(() => conn.close(), 300); }); return; }
      NET.gctl = conn; conn.on('open', () => { NET.seen = performance.now(); });
      conn.on('data', d => { try { hostRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
      conn.on('close', () => { if (NET.gctl === conn) guestGone(); });
    }); };
  open(0);
}
function hostRecv(m) {
  NET.seen = performance.now();
  if (m.t === 'hello') { NET.guestName = (m.name || '伙伴').slice(0, 8); if (!PARTY.pname || STATE.mode === 'lobby') PARTY.pname = NET.guestName; lobbyUI(); sfx('quest'); if (STATE.mode === 'play') sendStart(); return; }
  if (m.t === 'bye') { guestGone(); return; }
  if (STATE.mode !== 'play') return; const p = W.P[1]; if (!p) return;
  switch (m.t) {
    case 'i': if (m.n < (p.inSeq || 0)) return; p.inSeq = m.n; if (p.alive) { p.x = m.x; p.y = m.y; p.z = m.z; p.rot = m.r; p.mvSpd = m.s; p.fly = !!m.f; } p.ctrl = 'remote'; p.remoteT = W.t; break;
    case 'cast': { if (p.alive) { p.rot = m.rot; const t = W.byId.get(m.tgt); const S = SK[m.id]; if (S && p.mp >= S.mp - 0.5) { p.mp -= S.mp; p.inCombat = W.t; S.cast(p, t, rankOf(m.id), m.rot); } } break; }
    case 'hit': { const t = W.byId.get(m.id); if (t) hurt(p, t, m.mul, { kb: m.kb }); break; }
    case 'int': { const t = W.byId.get(m.id); if (t) { if ((t.type === 'player') && !t.alive) revive(t, p); else doInteract(p, t); } break; }
    case 'adv': advanceDlg(); break;
    case 'choice': if (UI.choice) UI.choice(m.i); break;
    case 'use': { const it = ITEMS[m.id]; if (it && it.use && takeItem(m.id)) { it.use(p); sfx('drink'); } break; }
    case 'skup': if (PARTY.sp > 0 && rankOf(m.id) < 5) { PARTY.skills[m.id] = rankOf(m.id) + 1; PARTY.sp--; netEv({ k: 'party', P: partyPub() }); } break;
    case 'chat': bubble(p, QUICK[m.q], 2.5); say(`[${p.name}] ${QUICK[m.q]}`, '#9ad8ff'); break;
  }
}
function guestGone() { NET.gctl = null; NET.gsnap = null; NET.known.clear(); if (STATE.mode === 'play') { say('同伴断开了连接，伙伴改由 AI 跟随。', '#ff8a7a'); if (W.P[1]) W.P[1].ctrl = 'ai'; } else lobbyUI(); }
function partyPub() { return { lv: PARTY.lv, xp: PARTY.xp, sp: PARTY.sp, skills: PARTY.skills, items: PARTY.items, form: PARTY.form, pname: PARTY.pname, flags: PARTY.flags }; }
function sendStart() { netSendCtl({ t: 'start', zone: W.zone.id, P: partyPub(), qi: STORY.qi, si: STORY.si, side: Object.fromEntries(Object.entries(SIDEQ).map(([k, v]) => [k, v.st])) }); NET.known.clear(); }
const PROJVIS = { moon: () => crescentMesh(0xbfe8ff, 0.8), qmoon: () => crescentMesh(0x5ae8c8, 0.6), orb: () => orbMesh(0x8ae0ff, 0.3), arrow: () => arrowMesh(), rock: () => rockMesh(0.6), bird: () => birdFX(0xff5a2a) };
function hostTick(dt) {
  if (!linkUp()) return; NET.sT += dt; NET.dT += dt;
  if (NET.dT > 1) { NET.dT = 0; const add = [], live = new Set(); for (const e of W.ents) { if (!e.specRef || e === W.P[1]) continue; live.add(e.id); if (!NET.known.has(e.id)) { NET.known.add(e.id); add.push({ id: e.id, s: e.specRef, n: e.name, ti: e.title, ty: e.type, tm: e.team, tag: e.tag, sc: e.scale || 1, lv: e.lv, el: e.elite, bo: e.boss, w: e.weaponRef }); } } const gone = [...NET.known].filter(id => !live.has(id)); gone.forEach(id => NET.known.delete(id)); if (add.length || gone.length) netSendCtl({ t: 'ents', add, gone }); }
  if (NET.sT < 0.05) return; NET.sT = 0;
  const E = []; for (const e of W.ents) { if (!e.specRef || e === W.P[1]) continue; const a = e.A.act; E.push([e.id, +e.x.toFixed(2), +e.y.toFixed(2), +e.z.toFixed(2), +e.rot.toFixed(2), Math.round(e.hp), e.hpMax, e.alive ? 1 : 0, +(e.mvSpd || 0).toFixed(1), a ? a.k : 0, a ? +a.d.toFixed(2) : 0, a ? +a.t.toFixed(2) : 0, e.A.pose || 0, e.vis ? 1 : 0, e.fly ? 1 : 0, e.A.face || 0, e.A.talking ? 1 : 0]); }
  const p2 = W.P[1]; const pr = PROJ.filter(p => p.vis).map(p => [p.nid || (p.nid = W.nid++), p.vis, +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +p.vx.toFixed(1), +p.vy.toFixed(1), +p.vz.toFixed(1)]);
  netSendFast({ t: 's', E, pr, p2: p2 ? [Math.round(p2.hp), p2.hpMax, Math.round(p2.mp), p2.mpMax, p2.alive ? 1 : 0, p2.buffs.filter(b => b.name).map(b => [b.name, +b.t.toFixed(1), Math.round(b.shield || 0)])] : null, cine: W.cine ? 1 : 0, story: [STORY.qi, STORY.si, curStep() ? curStep()._n || 0 : 0], sniff: W.sniffT || 0 });
}
/* ---------- guest ---------- */
async function netJoin(code, name) {
  netLeave(); NETROLE = 'guest'; code = (code || '').toUpperCase().trim(); lobbyUI('正在连接 ' + code + '…');
  try { await loadPeer(); } catch (e) { NETROLE = null; lobbyUI('联机组件加载失败'); return; }
  const peer = new Peer(PEER_OPTS); NET.peer = peer;
  peer.on('open', () => { const c = peer.connect('wanmei-' + code, { reliable: true, serialization: 'raw', label: 'ctl' }); NET.ctl = c;
    c.on('open', () => { sendRaw(c, { t: 'hello', name }); const s = peer.connect('wanmei-' + code, { reliable: false, serialization: 'raw', label: 'snap' }); NET.snap = s; s.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { } }); lobbyUI('已连接，等待房主开始…'); });
    c.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    c.on('close', () => { if (STATE.mode === 'play') { say('与房主断开了连接。', '#ff8a7a'); toast('与房主断开了连接'); } lobbyUI('连接已断开'); }); });
  peer.on('error', err => lobbyUI('连接失败（' + err.type + '）。检查房间码，或让房主重开房间。'));
}
function guestRecv(m) {
  if (m.t === 'busy') { lobbyUI('房间已满'); return; }
  if (m.t === 'start') { Object.assign(PARTY, m.P); STORY.qi = m.qi; STORY.si = m.si; for (const [k, v] of Object.entries(m.side || {})) if (SIDEQ[k]) SIDEQ[k].st = v; startGuestWorld(m.zone); return; }
  if (STATE.mode !== 'play') return;
  if (m.t === 'ents') { for (const d of m.add) guestSpawn(d); for (const id of m.gone) { const e = W.byId.get(id); if (e && e !== W.P[1]) rmEnt(e); } return; }
  if (m.t === 's') { guestSnap(m); return; }
  if (m.t === 'ev') guestEv(m.e);
}
function guestSpawn(d) {
  if (W.byId.has(d.id)) return; const [fn, a, b] = d.s; let spec;
  if (fn === '@pet') return; if (fn === '@p1') spec = CHARS.xiaobudian(); else if (fn === '@raw') spec = a; else spec = CHARS[fn](a, b);
  const id0 = W.nid; const e = mkEnt({ type: d.ty, team: d.tm, tag: d.tag, name: d.n, title: d.ti, spec, scale: d.sc !== 1 ? d.sc : undefined, lv: d.lv, elite: d.el, boss: d.bo, ai: { st: 'net' }, ghost: true, fixed: true });
  W.byId.delete(e.id); e.id = d.id; W.byId.set(e.id, e); W.nid = id0; e.net = { x: e.x, y: e.y, z: e.z, r: 0 }; e.specRef = d.s;
  if (d.w && e.R.kind === 'human') { const w = weaponMesh(d.w[0], d.w[1] || 1); attach(e.R, d.w[2] || 'R', w, 0, -0.05, 0, d.w[3] ?? HP, 0, 0); }
  if (fn === '@p1') { W.P[0] = e; e.type = 'player'; SPEAKERS['小不点'] = { tag: '@me', col: '#ffe6a0' }; }
}
function guestSnap(m) {
  for (const r of m.E) { const e = W.byId.get(r[0]); if (!e || e === W.P[1]) continue; e.net = { x: r[1], y: r[2], z: r[3], r: r[4] }; e.hp = r[5]; e.hpMax = r[6]; e.alive = !!r[7]; e.mvSpd = r[8]; if (r[9] && (!e.A.act || e.A.act.k !== r[9] || e.A.act.t > r[11] + 0.15)) e.A.act = { k: r[9], d: r[10], t: r[11] }; e.A.pose = r[12] || null; e.vis = !!r[13]; e.fly = !!r[14]; e.A.face = r[15] || 'open'; e.A.talking = !!r[16]; e.downed = !e.alive && e.type === 'player'; }
  const live = new Set(); for (const p of m.pr) { live.add(p[0]); let g = NET.gp.get(p[0]); if (!g) { const mk = (PROJVIS[p[1]] || PROJVIS.orb)(); R3.scene.add(mk); g = { m: mk }; NET.gp.set(p[0], g); } g.x = p[2]; g.y = p[3]; g.z = p[4]; g.vx = p[5]; g.vy = p[6]; g.vz = p[7]; g.m.position.set(g.x, g.y, g.z); g.m.rotation.y = Math.atan2(g.vx, g.vz); }
  for (const [id, g] of NET.gp) if (!live.has(id)) { g.m.removeFromParent(); NET.gp.delete(id); }
  const p2 = W.P[1]; if (p2 && m.p2) { p2.hp = m.p2[0]; p2.hpMax = m.p2[1]; p2.mp = m.p2[2]; p2.mpMax = m.p2[3]; const wasAlive = p2.alive; p2.alive = !!m.p2[4]; p2.downed = !p2.alive; if (!p2.alive) p2.A.pose = p2.R.kind === 'human' ? 'down' : 'dead'; else if (!wasAlive) p2.A.pose = null; p2.buffs = m.p2[5].map(([name, t, sh]) => ({ name, t, shield: sh || undefined, id: name })); }
  if (!!m.cine !== W.cine) { W.cine = !!m.cine; uiCine(W.cine); }
  if (m.story[0] !== STORY.qi || m.story[1] !== STORY.si) { STORY.qi = m.story[0]; STORY.si = m.story[1]; hudDirty(); } const s = curStep(); if (s) s._n = m.story[2];
  W.sniffT = m.sniff;
}
function guestTick(dt) {
  for (const e of W.ents) { if (!e.net || e === W.P[1]) continue; const k = Math.min(1, dt * 12); e.x = lerp(e.x, e.net.x, k); e.y = lerp(e.y, e.net.y, k); e.z = lerp(e.z, e.net.z, k); e.rot = angLerp(e.rot, e.net.r, k); }
  for (const g of NET.gp.values()) { g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt; g.m.position.set(g.x, g.y, g.z); }
  NET.iT += dt; const p = W.P[1]; if (NET.iT > 0.033 && p) { NET.iT = 0; NET.seq = (NET.seq || 0) + 1; netSendFast({ t: 'i', n: NET.seq, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), r: +p.rot.toFixed(2), s: +(p.mvSpd || 0).toFixed(1), f: p.fly ? 1 : 0 }); }
}
function guestEv(e) {
  switch (e.k) {
    case 'dlg': DLG.open = true; DLG.lines = e.lines; DLG.i = 0; DLG.res = null; DLG.o = {}; showLine(); break;
    case 'dlgi': DLG.i = e.i; showLine(); break;
    case 'dlgx': DLG.open = false; uiDialog(null); if (DLG.prevE && DLG.prevE.A) DLG.prevE.A.talking = false; break;
    case 'say': say(e.text, e.col); break;
    case 'ft': { const t = W.byId.get(e.id) || (e.id === -1 ? W.P[1] : null); if (t) floatText(t, e.txt, e.col, e.sc); break; }
    case 'bub': { const t = W.byId.get(e.id); if (t) bubble(t, e.txt, e.d); break; }
    case 'chap': uiChapter(e.ch, e.sub); sfx('chapter'); break;
    case 'banner': banner(e.a, e.b); break;
    case 'lv': PARTY.lv = e.lv; for (const p of W.P) if (p) { p.lv = e.lv; } pillarFX(W.P[1].x, W.P[1].y, W.P[1].z, 0xffd86a, 10, 1.6, 1.2); sfx('levelup'); banner(`境界提升 · ${e.lv} 级`, ''); hudDirty(); break;
    case 'items': PARTY.items = e.items; hudDirty(); break;
    case 'party': Object.assign(PARTY, e.P); hudDirty(); buildHotbar(); break;
    case 'evolve': { PARTY.form = e.form; const old = W.P[1]; const p2 = makePartner(old.x, old.z); p2.ctrl = 'local'; if (old.glowL) old.glowL.removeFromParent(); rmEnt(old); W.P[1] = p2; W.me = 1; buildHotbar(); banner('进化 · ' + PARTNER_FORMS[e.form].name, PARTNER_FORMS[e.form].desc); sfx('evolve'); break; }
    case 'fx': { const f = { ring: ringFX, pillar: pillarFX, burst, spark: hitSpark, dust }[e.f]; if (f) f(...e.a); break; }
    case 'tele': tele(Object.assign({}, e.o, { mul: null, team: 9 })); break;
    case 'sfx': sfx(e.s, e.o || {}); break;
    case 'light': setLight(e.n); break;
    case 'tp': { const p = W.P[1]; if (p) teleport(p, e.x, e.z); break; }
    case 'flag': PARTY.flags[e.f] = e.v; buildHotbar(); break;
    case 'fade': uiFade(e.o, e.d); break;
    case 'shake': shake(e.s); break;
    case 'willow': if (WILLOWOBJ) WILLOWOBJ.boost = e.b; break;
  }
}
/* host mirrors visual effects to the guest */
function wrapFX() { const map = { ringFX: 'ring', pillarFX: 'pillar', burst: 'burst', hitSpark: 'spark', dust: 'dust' }; for (const [fn, k] of Object.entries(map)) { const orig = window[fn]; window[fn] = function (...a) { if (NETROLE === 'host' && linkUp() && k !== 'spark' || NETROLE === 'host' && k === 'spark' && Math.random() < 0.5) netEv({ k: 'fx', f: k, a: a.map(v => typeof v === 'number' ? +v.toFixed(2) : v) }); return orig.apply(this, a); }; } const ot = window.tele; window.tele = function (o) { const T = ot(o); if (NETROLE === 'host' && linkUp()) netEv({ k: 'tele', o: { shape: o.shape, x: +o.x.toFixed(2), z: +o.z.toFixed(2), r: o.r, r0: o.r0, arc: o.arc, ang: o.ang, w: o.w, len: o.len, d: o.d, col: o.col } }); return T; }; const os = window.sfx; window.sfx = function (k, o) { if (NETROLE === 'host' && linkUp() && ['roar', 'roar2', 'boom', 'eagle', 'chapter', 'questdone', 'evolve', 'glow', 'moon', 'fire', 'bow'].includes(k)) netEv({ k: 'sfx', s: k, o }); return os(k, o); }; }
