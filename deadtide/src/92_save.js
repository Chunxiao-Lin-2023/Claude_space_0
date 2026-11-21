/* ================= save / continue =================
   One save slot in localStorage. Written automatically every dawn, from the pause menu, and when the page is hidden or
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
    v: SAVE_V, mw: MW, at: Date.now(), mode: W.mode, map: W.map, obj: W.obj, seed: W.seed, diff: W.diff, night: W.night, phase: W.phase, clock: W.clock, dayLen: W.dayLen, nightT: W.nightT,
    res: W.res, upg: W.upg, kills: W.kills, stats: W.stats, endless: W.endless, clean: W.clean, tasks: W.tasks, srch: [...W.srch], spotN: W.spotN, t: W.t,
    p: W.p.filter(p => !p.gone).map(p => ({ name: p.name, x: p.x, y: p.y, L: p.L, hp: p.hp, dead: p.dead, wpn: p.wpn, owned: p.owned, mag: p.mag, ammo: p.ammo, meds: p.meds, nades: p.nades, kills: p.kills, veh: p.veh || 0, vehs: p.vehs || 0, shield: p.shield ? 1 : 0, melee: p.melee || 0, gn: p.gn || [0, 0, 0], lives: p.lives || 0 })),
    zs: W.zs.filter(z => z.hp > 0).slice(0, 300).map(z => [z.k, +z.x.toFixed(2), +z.y.toFixed(2), z.L, Math.round(z.hp), Math.round(z.max), z.mz ? 1 : 0, z.g || 0, z.sleep ? 1 : 0, z.occ == null ? -1 : z.occ]),
    q: W.spawnQ.slice(0, 500).map(s => [+s.t.toFixed(1), s.k, s.side, s.at == null ? -1 : s.at, s.f ? +s.f.toFixed(2) : 0, s.g || 0]), gid: W.gid || 0,
    g: [rleEnc(W.blk), rleEnc(W.slab), rleEnc(W.bdir), rleEnc(hpPack(W.bhp)), rleEnc(hpPack(W.shp))].map(b64e),
  };
  try { localStorage.setItem(SKEY + 'save', JSON.stringify(S)); }
  catch (e) { if (!quiet) toast('存档失败：浏览器存储空间不够', '#ff8a7a'); return false; }
  if (!quiet) toast('已存档 · ' + saveLabel(S), '#7dff8a');
  return true;
}
function loadSave() { const s = lsGet('save', null); return s && s.v === SAVE_V && s.g && s.mw === MW ? s : null; }
function clearSave() { try { localStorage.removeItem(SKEY + 'save'); } catch (e) { } }
function saveLabel(s) { return (MODES[s.mode] && s.mode !== 'classic' ? MODES[s.mode].name + ' · ' : '') + (MAPS[s.map] ? MAPS[s.map].name + ' · ' : '') + (s.phase === 'night' ? '第 ' + s.night + ' 夜' : '第 ' + (s.night + 1) + ' 天') + ' · ' + ({ easy: '简单', normal: '普通', hard: '困难' }[s.diff] || ''); }
function continueGame() {
  const S = loadSave(); if (!S) return;
  audioInit(); netLeave(); NETROLE = 'solo';
  startGame(S.seed, [S.p[0] ? S.p[0].name : SET.name || '幸存者'], S.diff, 0, S.mode || 'classic', S.map || 'town');
  try { applySave(S); } catch (e) { console.error(e); toast('存档读取失败，已开始新的一局', '#ff8a7a'); return; }
  TIPS.forEach(clearTimeout); TIPS = [];
  banner('继续', saveLabel(S), '#ffe7b0');
}
function applySave(S) {
  const g = S.g.map(b64d);
  W.blk.set(rleDec(g[0], NC)); W.slab.set(rleDec(g[1], NC)); W.bdir.set(rleDec(g[2], NC));
  hpUnpack(rleDec(g[3], NC * 2), W.bhp); hpUnpack(rleDec(g[4], NC * 2), W.shp);
  Object.assign(W, { night: S.night, phase: S.phase, clock: S.clock, dayLen: S.dayLen, nightT: S.nightT || 0, res: S.res, upg: S.upg, kills: S.kills, stats: S.stats, endless: !!S.endless, clean: S.clean !== false, tasks: S.tasks || [], t: S.t || 0 });
  W.srch = new Set(S.srch || []); W.spotN = S.spotN || null; if (!W.spotN) { W.spotN = spotCount(); for (const k in W.spotN) W.spotN[k] = Math.round(W.spotN[k] * 2); } W.tkv++; W.rng = mulberry((S.seed ^ (S.night * 7919) ^ (S.at & 0xffff)) >>> 0);
  const p = W.p[0], P = S.p[0];
  if (P) { Object.assign(p, { x: P.x, y: P.y, L: P.L, hp: P.dead ? BAL.pMaxHp * 0.5 : P.hp, wpn: P.wpn, owned: P.owned, mag: P.mag, ammo: P.ammo, meds: P.meds, nades: P.nades, kills: P.kills, veh: P.veh || 0, vehs: P.vehs != null ? P.vehs : (P.veh ? 1 << P.veh : 0), shield: P.shield ? 1 : 0, melee: P.shield ? P.melee || 0 : 0, gn: P.gn || [0, 0, 0], lives: P.lives != null ? P.lives : livesFor(W.diff, W.mode) }); p.dead = false; p.down = false; } // (round 22) vehs = owned bitmask; older saves only knew the best one
  // older saves may have fewer weapons
  for (const k of ['owned', 'mag', 'ammo']) while (p[k].length < NW) p[k].push(0);
  p.z = pZ(p); p.zv = p.z; CAM.tx = p.x; CAM.ty = p.y;
  if (S.obj) { W.obj = S.obj; W.obv++; }
  W.zs = []; for (const [k, x, y, L, hp, max, mz, g, sl, occ] of S.zs || []) { if (!ZT[k]) continue; const z = spawnZombie(k, 0); Object.assign(z, { x, y, L, hp, max }); if (g) z.g = g; if (sl) z.sleep = 1; if (occ != null && occ >= 0) z.occ = occ; z.z = surfZ(x, y, L); if (mz || ZT[k].boss) z.mz = 1; if (ZT[k].boss && W.obj && W.obj.curK === k) W.obj.cur = z.id; }
  W.spawnQ = (S.q || []).map(([t, k, side, at, f, g]) => ({ t, k, side, at: at == null ? -1 : at, f: f || 0, g: g || 0 })); W.gid = S.gid || 0;
  recomputeStab(); W.navDirty = true; W.ver++; W.dirty = new Set(); updateFields(0, true); W.edges = edgeSpawns();
}
// autosave when the page goes away (tab switch, app switch, closing)
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(true); });
window.addEventListener('pagehide', () => saveGame(true));
