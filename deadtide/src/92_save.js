/* ================= save / continue =================
   (round 27) Save slots in localStorage (deadtide.save, deadtide.save2 … deadtide.save5; 5 since round 30); a new game takes an empty slot, so it never
   silently overwrites an old run. Written automatically every dawn, from the pause menu, and when the page is hidden or
   closed (solo / host only). The map itself is regenerated from the seed; what changed (blocks, floors, hp, facing) is
   stored as run-length-encoded byte arrays, plus resources, players, the clock, tasks and any zombies on the field. */
const SAVE_V = 2; // bump when the map size or layout changes: older saves are ignored
// byte RLE with varint run lengths: [value, len...]
function rleEnc(u8) {
  const out = []; let i = 0;
  while (i < u8.length) {
    const v = u8[i]; let n = 1; while (i + n < u8.length && u8[i + n] === v) n++;
    out.push(v); let m = n; while (m >= 128) { out.push((m & 127) | 128); m >>>= 7; } out.push(m); i += n;
  }
  return Uint8Array.from(out);
}
function rleDec(src, len) {
  const out = new Uint8Array(len); let i = 0, o = 0;
  while (i < src.length && o < len) { const v = src[i++]; let n = 0, s = 0, b; do { b = src[i++]; n |= (b & 127) << s; s += 7; } while (b & 128); out.fill(v, o, Math.min(len, o + n)); o += n; }
  return out;
}
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const hpPack = f => { const u = new Uint16Array(f.length); for (let i = 0; i < f.length; i++) u[i] = Math.max(0, Math.min(65535, Math.round(f[i]))); return new Uint8Array(u.buffer); };
const hpUnpack = (u8, f) => { const u = new Uint16Array(u8.buffer, u8.byteOffset, f.length); for (let i = 0; i < f.length; i++) f[i] = u[i]; };
function canSave() { return W && !W.demo && !W.over && STATE.mode === 'play' && NETROLE !== 'guest'; }
function saveGame(quiet) {
  if (!canSave()) return false;
  const S = {
    v: SAVE_V, mw: MW, at: Date.now(), name: W.saveName || '', mode: W.mode, map: W.map, obj: W.obj, seed: W.seed, diff: W.diff, night: W.night, phase: W.phase, clock: W.clock, dayLen: W.dayLen, nightT: W.nightT,
    res: W.res, upg: W.upg, bp: { vbp: W.vbp || null, n: W.bpN || 0, mlv: W.mlv || null, wlv: W.wlv || null, bps: W.bps || [] }, /* (round 38i/j) */ kills: W.kills, stats: W.stats, endless: W.endless, clean: W.clean, tasks: W.tasks, srch: [...W.srch], spotN: W.spotN, t: W.t,
    p: W.p.map(p => ({ name: p.name, x: p.x, y: p.y, L: inAirZ(p) != null ? skyTop(p.x, p.y) : p.L, /* (round 31) saved in flight: put them on what is below */ hp: p.hp, dead: p.dead, wpn: p.wpn, owned: p.owned, mag: p.mag, ammo: p.ammo, meds: p.meds, nades: p.nades, kills: p.kills, veh: p.veh || 0, vehs: p.vehs || 0, shield: p.shield ? 1 : 0, melee: p.melee || 0, gn: p.gn || [0, 0, 0], lives: p.lives || 0, fuel: p.fuel != null ? +p.fuel.toFixed(1) : 60, gam: p.gam || 0, shl: p.shl || 0, mh: (p.mh || []).map(h => h == null ? null : Math.round(h)), bat: +(p.bat != null ? p.bat : BAL.mechBat).toFixed(1), evo: Math.round(p.evo || 0) })).concat(W.p.length < 2 && W.p2keep ? [W.p2keep] : []), /* (round 34) a two-player save played on alone still keeps the teammate's kit */
    zs: W.zs.filter(z => z.hp > 0).slice(0, 300).map(z => [z.k, +z.x.toFixed(2), +z.y.toFixed(2), z.L, Math.round(z.hp), Math.round(z.max), z.mz ? 1 : 0, z.g || 0, z.sleep ? 1 : 0, z.occ == null ? -1 : z.occ]),
    q: W.spawnQ.slice(0, 500).map(s => [+s.t.toFixed(1), s.k, s.side, s.at == null ? -1 : s.at, s.f ? +s.f.toFixed(2) : 0, s.g || 0]), gid: W.gid || 0,
    g: [rleEnc(W.blk), rleEnc(W.slab), rleEnc(W.bdir), rleEnc(hpPack(W.bhp)), rleEnc(hpPack(W.shp))].map(b64e),
    perm: W.perm || null, perk: W.perk || null, mine: W.mine ? [...W.mine].filter(i => W.blk[i] || W.slab[i]) : [], // (round 32)
  };
  if (!SLOT) SLOT = freeSlot() || oldestSlot();
  try { localStorage.setItem(SKEY + slotKey(SLOT), JSON.stringify(S)); }
  catch (e) { if (!quiet) toast('存档失败：浏览器存储空间不够', '#ff8a7a'); return false; }
  if (!quiet) toast('已存档（存档 ' + SLOT + '）· ' + saveLabel(S), '#7dff8a');
  return true;
}
const NSLOT = 5; let SLOT = 0; // (round 30) 3 → 5 slots                                   // the slot this run saves into (0 = not chosen yet)
const slotKey = n => n > 1 ? 'save' + n : 'save';
// (round 34d) give a save slot your own name (kept when the game saves into it again)
function renameSave(n, name) { try { const k = SKEY + slotKey(n), raw = localStorage.getItem(k); if (!raw) return; const S = JSON.parse(raw); S.name = String(name || '').slice(0, 20); localStorage.setItem(k, JSON.stringify(S)); if (SLOT === n && W) W.saveName = S.name; } catch (e) { } }
function loadSlot(n) { const s = lsGet(slotKey(n), null); return s && s.v === SAVE_V && s.g && (s.mw === MW || s.mw === MW0) ? s : null; } // (round 33) saves from the 160×160 maps still load (moved into the middle)
function latestSlot() { let b = 0, t = -1; for (let n = 1; n <= NSLOT; n++) { const s = loadSlot(n); if (s && (s.at || 0) > t) { t = s.at || 0; b = n; } } return b; }
function freeSlot() { for (let n = 1; n <= NSLOT; n++) if (!loadSlot(n)) return n; return 0; }
function oldestSlot() { let b = 1, t = Infinity; for (let n = 1; n <= NSLOT; n++) { const s = loadSlot(n); const a = s ? s.at || 0 : -1; if (a < t) { t = a; b = n; } } return b; }
function loadSave(n) { n = n || latestSlot(); return n ? loadSlot(n) : null; }   // no slot given: the most recent run
function clearSave(n) { n = n || SLOT; if (!n) return; try { localStorage.removeItem(SKEY + slotKey(n)); } catch (e) { } } // no slot yet: nothing of this run was saved
// pick the slot for a new run: an empty one; all full → the oldest, but only after a second press (returns 0 on the first)
let slotArm = 0;
function newRunSlot(warn) {
  const f = freeSlot(); if (f) { slotArm = 0; return f; }
  const o = oldestSlot(); if (slotArm && Date.now() - slotArm < 4500) { slotArm = 0; return o; }
  slotArm = Date.now(); warn(NSLOT + ' 个存档位都满了：再点一次会覆盖最早的存档（存档 ' + o + '：' + saveLabel(loadSlot(o)) + '）。不想覆盖就先去「存档」里删掉一个'); return 0;
}
function saveLabel(s) { return (MODES[s.mode] && s.mode !== 'classic' ? MODES[s.mode].name + ' · ' : '') + (MAPS[s.map] ? MAPS[s.map].name + ' · ' : '') + (s.phase === 'night' ? '第 ' + s.night + ' 夜' : '第 ' + (s.night + 1) + ' 天') + ' · ' + ({ easy: '简单', normal: '普通', hard: '困难' }[s.diff] || ''); }
function continueGame(n) {
  n = n || latestSlot(); const S = n && loadSlot(n); if (!S) return;
  audioInit(); netLeave(); NETROLE = 'solo'; SLOT = n;
  startGame(S.seed, [S.p[0] ? S.p[0].name : SET.name || '幸存者'], S.diff, 0, S.mode || 'classic', S.map || 'town');
  try { applySave(S); } catch (e) { console.error(e); toast('存档读取失败，已开始新的一局', '#ff8a7a'); return; }
  TIPS.forEach(clearTimeout); TIPS = [];
  banner('继续 · 存档 ' + n, saveLabel(S), '#ffe7b0');
}
// (round 32) the world part of a save: blocks, floors, facing, hp (also sent to a teammate when the host opens a room from a save)
// (round 33) a cell index from a 160×160 save → the same cell in the middle of the 240×240 map
const NC0 = MW0 * MW0 * ML, legIdx = i => { const L = Math.floor(i / (MW0 * MW0)), q = i % (MW0 * MW0); return ci(q % MW0 + MOFF, Math.floor(q / MW0) + MOFF, L); };
function applyWorld(gs, legacy) {
  const g = gs.map(b64d);
  if (!legacy) { W.blk.set(rleDec(g[0], NC)); W.slab.set(rleDec(g[1], NC)); W.bdir.set(rleDec(g[2], NC)); hpUnpack(rleDec(g[3], NC * 2), W.bhp); hpUnpack(rleDec(g[4], NC * 2), W.shp); }
  else { // the old world goes into the middle; the new outskirts stay as generated
    const b = rleDec(g[0], NC0), s = rleDec(g[1], NC0), d = rleDec(g[2], NC0), h = new Float32Array(NC0), h2 = new Float32Array(NC0); hpUnpack(rleDec(g[3], NC0 * 2), h); hpUnpack(rleDec(g[4], NC0 * 2), h2);
    for (let i = 0; i < NC0; i++) { const j = legIdx(i); W.blk[j] = b[i]; W.slab[j] = s[i]; W.bdir[j] = d[i]; W.bhp[j] = h[i]; W.shp[j] = h2[i]; } }
  recomputeStab(); W.navDirty = true; W.ver++; W.dirty = new Set();
}
// shift everything with a position or a cell index inside an old save's objective data
function legObj(o) { if (!o || typeof o !== 'object') return o; if (Array.isArray(o)) { o.forEach(legObj); return o; }
  if (typeof o.x === 'number' && typeof o.y === 'number') { o.x += MOFF; o.y += MOFF; } if (typeof o.ci === 'number') o.ci = legIdx(o.ci);
  for (const k of ['tam', 'tamB']) if (o[k] && typeof o[k] === 'object') { const m = {}; for (const i in o[k]) m[legIdx(+i)] = o[k][i]; o[k] = m; }
  for (const k in o) if (k !== 'tam' && k !== 'tamB' && o[k] && typeof o[k] === 'object') legObj(o[k]); return o; }
function applySave(S) {
  const leg = S.mw === MW0 && MW !== MW0; // (round 33) an old 160×160 save
  if (leg) { S = JSON.parse(JSON.stringify(S)); S.srch = (S.srch || []).map(legIdx); S.mine = (S.mine || []).map(legIdx); for (const z of S.zs || []) { z[1] += MOFF; z[2] += MOFF; } for (const P of S.p || []) { P.x += MOFF; P.y += MOFF; } legObj(S.obj); }
  applyWorld(S.g, leg);
  W.p2keep = S.p && S.p[1] ? JSON.parse(JSON.stringify(S.p[1])) : null; // (round 34) the teammate's kit stays in the save even when you carry on alone
  W.saveName = S.name || ''; W.perm = S.perm || null; W.perk = S.perk || null; W.mine = new Set(S.mine || []);
  Object.assign(W, { night: S.night, phase: S.phase, clock: S.clock, dayLen: S.dayLen, nightT: S.nightT || 0, res: S.res, upg: Math.max(S.upg || 0, BAL.upgStart), kills: S.kills, stats: S.stats, endless: !!S.endless, clean: S.clean !== false, tasks: S.tasks || [], t: S.t || 0 });
  W.vbp = S.bp && S.bp.vbp ? S.bp.vbp.slice() : VEH.filter(Boolean).map(q => q.k); W.bpN = S.bp ? S.bp.n || 0 : 0; W.mlv = S.bp && S.bp.mlv ? S.bp.mlv.map(x => Math.min(UPG_MAX, x)) : [0, 0, 0, 0, 0, 0, 0]; W.wlv = S.bp && S.bp.wlv ? S.bp.wlv.slice() : WPN.map(() => 0); W.bps = S.bp && S.bp.bps ? S.bp.bps.slice() : []; /* (round 38i/j) older saves: every vehicle unlocked */
  W.srch = new Set(S.srch || []); W.spotN = S.spotN || null; if (!W.spotN) { W.spotN = spotCount(); for (const k in W.spotN) W.spotN[k] = Math.round(W.spotN[k] * 2); } W.tkv++; W.rng = mulberry((S.seed ^ (S.night * 7919) ^ (S.at & 0xffff)) >>> 0);
  const p = W.p[0], P = S.p[0];
  if (P) { Object.assign(p, { x: P.x, y: P.y, L: P.L, hp: P.dead ? BAL.pMaxHp * 0.5 : P.hp, wpn: P.wpn, owned: P.owned, mag: P.mag, ammo: P.ammo, meds: P.meds, nades: P.nades, kills: P.kills, veh: P.veh || 0, vehs: P.vehs != null ? P.vehs : (P.veh ? 1 << P.veh : 0), shield: 0, melee: 0, /* (round 36f) no more riot shield */ gn: P.gn || [0, 0, 0], lives: P.lives != null ? P.lives : livesFor(W.diff, W.mode), fuel: P.fuel != null ? P.fuel : 60, gam: P.gam || 0, shl: P.shl || 0, mh: P.mh || [], bat: P.bat != null ? P.bat : BAL.mechBat, evo: Math.min(BAL.evoCap, P.evo || 0) }); p.vehs &= 127; if (p.veh === 7) p.veh = [4, 2, 3, 1, 5, 6].find(k => p.vehs >> k & 1) || 0; p.dead = false; /* (round 34b) the stand-alone mech of 34a became the vehicles' second stage */ p.down = false; } // (round 22) vehs = owned bitmask; older saves only knew the best one
  // older saves may have fewer weapons
  for (const k of ['owned', 'mag', 'ammo']) while (p[k].length < NW) p[k].push(0);
  p.z = pZ(p); p.zv = p.z; CAM.tx = p.x; CAM.ty = p.y;
  if (S.obj) { W.obj = S.obj; W.obv++; }
  W.zs = []; for (const [k, x, y, L, hp, max, mz, g, sl, occ] of S.zs || []) { if (!ZT[k]) continue; const z = spawnZombie(k, 0); Object.assign(z, { x, y, L, hp, max }); if (g) z.g = g; if (sl) z.sleep = 1; if (occ != null && occ >= 0) z.occ = occ; z.z = surfZ(x, y, L); if (mz || ZT[k].boss) z.mz = 1; if (ZT[k].boss && W.obj && W.obj.curK === k) W.obj.cur = z.id; }
  W.spawnQ = (S.q || []).map(([t, k, side, at, f, g]) => ({ t, k, side, at: at == null ? -1 : at, f: f || 0, g: g || 0 })); W.gid = S.gid || 0;
  recomputeStab(); W.navDirty = true; W.ver++; W.dirty = new Set(); updateFields(0, true); W.edges = edgeSpawns();
  rollTasks(); for (const q of W.p) q.maxHp = BAL.pMaxHp; // (round 32) permanent tasks / upgrades carry on
}
// autosave when the page goes away (tab switch, app switch, closing)
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(true); });
window.addEventListener('pagehide', () => saveGame(true));
