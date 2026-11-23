/* ================= simulation: players, weapons, building, gathering, crafting, day/night ================= */
function mkPlayer(i, name) {
  return {
    i, name, x: RADIO_XY[0] - 0.5 + i * 2, y: RADIO_XY[1] + 0.5 + i, L: 0, z: 0, r: 0.28, h: 1.0, vx: 0, vy: 0, kbx: 0, kby: 0, aim: -Math.PI / 2, aimPt: null,
    hp: BAL.pMaxHp, maxHp: BAL.pMaxHp, down: false, downT: 0, dead: false, gone: false,
    wpn: 1, owned: WPN.map((w, k) => k < 2 ? 1 : 0), mag: WPN.map((w, k) => k === 0 ? 12 : k === 1 ? 6 : 0), ammo: WPN.map((w, k) => k === 1 ? w.start : 0), bloom: 0, reloadT: 0, reloadW: 0, fireCD: 0, shoveCD: 0, shoveT: 0,
    nades: 2, meds: 2, gn: [1, 1, 1], gt: 0, lives: 3, fuel: 60, land: false, gam: 0, gcd: 0, shl: 0, mform: 0, mtr: 0, mto: 0, mh: [], bat: 120, mcd: 0, medT: 0, selfRev: false, useT: 0, useK: '', build: false, sel: 1, demo: false, sdir: 3, veh: 0, vehs: 0, shield: 0, melee: 0,
    inp: { mx: 0, my: 0, fire: 0, use: 0 }, kills: 0, hurtT: 0, anim: 0, emptyT: 0, ready: false, recoilT: 0,
  };
}
function newWorld(seed, names, diff, mode) {
  const m = genMap(seed);
  W = {
    mode: MODES[mode] ? mode : 'classic', map: MAP_ID, obj: {}, obv: 1,
    seed, t: 0, G: m.G, tt: m.tt, blk: m.blk, bhp: m.bhp, slab: m.slab, shp: m.shp, bdir: m.bdir, stab: new Int8Array(NC), srch: new Set(),
    radio: { x: m.radio.x, y: m.radio.y }, bench: m.bench, tasks: [], tkv: 0, clean: true,
    p: names.map((n, i) => mkPlayer(i, n)), zs: [], proj: [], zid: 1, gid: 0,
    phase: 'day', clock: BAL.dayLen[0], dayLen: BAL.dayLen[0], night: 0, res: Object.assign({}, BAL.startRes), upg: BAL.upgStart, kills: 0,
    spawnQ: [], nightT: 0, strayT: 8, diff, D: BAL.diff[diff] || BAL.diff.normal, rng: mulberry(seed ^ 0x9e3779b9), seq: 0,
    dirty: new Set(), endless: false, over: null, stats: { built: 0, lost: 0 }, navDirty: true, ver: 1,
    ff: { rw: new Float32Array(NC), rc: new Float32Array(NC), pw: new Float32Array(NC), pc: new Float32Array(NC), rT: 0, pT: 0 },
  };
  recomputeStab();
  restockSpots(true);
  // day one also gets supplies out in the open (the buildings are already stocked by the generator)
  for (const k of ['crate', 'toolbox', 'rubble']) for (let j = Math.round(SPOTS[k].n * 1.2); j > 0; j--) { const i = pickSpot(k, true); if (i >= 0) { W.blk[i] = SPOT_IDS[k]; W.bhp[i] = 1; } }
  W.spotN = spotCount();
  modeInit();
  updateFields(0, true);
  W.edges = edgeSpawns();
  { const n = livesFor(W.diff, W.mode); for (const p of W.p) p.lives = n; }                   // (round 24) respawns per player
  rollTasks();
  return W;
}
const rand = (a = 0, b = 1) => a + W.rng() * (b - a);
const activeP = () => W.p.filter(p => !p.gone);
const standingP = p => !p.gone && !p.dead && !p.down;
// shooting from a vehicle (round 20): the driver fires at 40% the rate, a pillion rider at 70% (same accuracy as on foot)
const rideK = p => p.ride ? { rate: VEH[p.veh] && VEH[p.veh].quiet ? 1.0 : 2.1, spread: 1 } : p.pass != null && p.pass >= 0 ? { rate: paxVeh(p) && paxVeh(p).port ? 1.0 : 1.3, spread: 1 } : { rate: 1, spread: 1 }; /* (round 36n) bike 1.1 → 1.0, armoured-car back seat 1.3 → 1.0 */
const paxVeh = p => p && p.pass != null && p.pass >= 0 && W.p[p.pass] && W.p[p.pass].ride && !inMech(W.p[p.pass]) ? VEH[W.p[p.pass].veh] : null; /* (round 36n) the vehicle someone sits on the back of */
const rideVeh = p => p && p.ride && !inMech(p) ? VEH[p.veh] : null; /* (round 36b) firing from a vehicle, a little quicker: cooldown driver ×2.5 → ×2.1, bicycle ×1.2 → ×1.1, back seat ×1.43 → ×1.3 */ // only the rate drops; aim stays as true as on foot
function emit(e) { if (!W) return; e.q = ++W.seq; /* NB: `q`, not `s` — cell events carry the slab id in `s` */ fxEvent(e); if (NETROLE === 'host') netSendCtl({ t: 'ev', e }); }
function say(text, col) { emit({ k: 'say', text, col: col || '' }); }
const pZ = p => surfZ(p.x, p.y, p.L);

/* ---------- cells ---------- */
function setCell(i, b, s, d, cause) {
  W.blk[i] = b; W.bhp[i] = b ? (B[b].hp || 1) : 0; W.slab[i] = s; W.shp[i] = s ? (B[s].hp || 1) : 0; if (d != null) W.bdir[i] = d;
  W.navDirty = true; W.ver++;
  emit({ k: 'cell', i, b, s, d: W.bdir[i], c: cause || '' });
}
function damageCell(i, dmg, slabToo) {
  const b = W.blk[i];
  if (b && B[b].brk) { W.bhp[i] -= dmg; W.dirty.add(i); if (W.bhp[i] <= 0) return destroyBlk(i); return; }
  if (slabToo && W.slab[i] && B[W.slab[i]].brk) { W.shp[i] -= dmg; W.dirty.add(i); if (W.shp[i] <= 0) { W.stats.lost++; setCell(i, W.blk[i], 0, null, 'brk'); collapseCheck(); } }
}
function destroyBlk(i) {
  W.stats.lost++;
  setCell(i, 0, W.slab[i], null, 'brk');
  collapseCheck();
}
function collapseCheck() {
  recomputeStab();
  for (let pass = 0; pass < 8; pass++) {
    const u = unsupported(); if (!u.length) break;
    for (const i of u) { const water = cl_(i) === 0 && W.tt[cy_(i) * MW + cx_(i)] === TT.water; setCell(i, B[W.blk[i]].nat ? W.blk[i] : (water && W.slab[i] ? 23 : 0), 0, null, 'fall'); }
    if (u.length > 3) emit({ k: 'collapse', i: u[(u.length / 2) | 0], n: u.length });
    recomputeStab();
  }
}

/* ---------- (round 29) flying: the gyrocopter ---------- */
const airborne = p => !!(p && p.ride && VEH[p.veh] && VEH[p.veh].fly && (p.mform !== 1 || p.mfly)); // (round 34b) a gyrocopter stood up as a mech walks; (34d) unless 苍隼 is flying
// the level you would stand on at the top of this column (ground, a roof, a wall top)
// (round 30) the gyrocopter's chin gun: its own ammo (p.gam), a hitscan burst toward where you aim
function gyroFire(p) {
  if (p.gcd > 0) return;
  if (!(p.gam > 0)) { if (!(p.emptyT > 0)) { p.emptyT = 1.5; emit({ k: 'deny', p: p.i, why: '旋翼机机枪没子弹了：商店「武器 · 弹药」里买' }); } return; }
  p.gcd = BAL.gyroRate; p.gam--;
  const a = p.aim, sx = p.x + Math.cos(a) * 0.55, sy = p.y + Math.sin(a) * 0.55, sz = p.z + 0.25;
  const T = p.aimPt || { x: sx + Math.cos(a) * 6, y: sy + Math.sin(a) * 6, z: Math.max(0, sz - 3) };
  let dx = T.x - sx, dy = T.y - sy, dz = T.z - sz; const n = Math.hypot(dx, dy, dz) || 1; dx /= n; dy /= n; dz /= n;
  dx += (rand() - 0.5) * 2 * BAL.gyroSpread; dy += (rand() - 0.5) * 2 * BAL.gyroSpread; dz += (rand() - 0.5) * BAL.gyroSpread; const m = Math.hypot(dx, dy, dz); dx /= m; dy /= m; dz /= m;
  const wall = rayWorld(sx, sy, sz, dx, dy, dz, BAL.gyroRange, { lean: LEAN }); let best = null, bd = wall.d;
  for (const z of W.zs) { if (z.hp <= 0) continue; const d = rayBox(sx, sy, sz, dx, dy, dz, z.x - z.r, z.y - z.r, z.z, z.r * 2, z.r * 2, z.h, bd); if (d >= 0 && d < bd) { bd = d; best = z; } }
  if (best) hurtZombie(best, BAL.gyroDmg * (1 + 0.12 * W.upg), p, dx * 0.4, dy * 0.4);
  noiseAt(p.x, p.y, 11, p.z);
  emit({ k: 'gshot', o: p.i, x: r2(sx), y: r2(sy), z: r2(sz), e: [r2(sx + dx * bd), r2(sy + dy * bd), r2(sz + dz * bd)], h: best ? 1 : 0 });
}
// (round 34d) vision: zombies are only shown (on screen and on the maps) within sight of a survivor — shared between teammates.
// Higher floors see further; each vehicle / mech has its own reach (the armoured car's slits least, flying most); nights are shorter-sighted.
function visR(p) { if (!p || p.gone || p.dead) return 0; const V = BAL.vis; let r = V.foot + Math.max(0, (p.L || 0) - gAt(Math.floor(p.x), Math.floor(p.y))) * V.floor;
  if (p.ride && VEH[p.veh]) r = inMech(p) ? (airborne(p) ? V.fly : V.mech) : airborne(p) ? VEH[p.veh].vis : (VEH[p.veh].vis || V.foot) + (r - V.foot);
  return r * (W.phase === 'night' ? V.night : 1); }
let VIS = [];
function visTick() { VIS = W.p.filter(p => !p.gone && !p.dead).map(p => ({ x: p.rx != null ? p.rx : p.x, y: p.ry != null ? p.ry : p.y, r2: visR(p) ** 2 })); }
const zSeen = z => { if (W.demo) return true; if (z.ck || z.ckF) { for (const v of VIS) if ((z.x - v.x) ** 2 + (z.y - v.y) ** 2 < 25) return true; return false; } /* (round 36) the shimmer shows from 5 tiles (was 3.5) */ // (round 35) a cloaked 隐身者: only a shimmer, and only up close
  for (const v of VIS) { const dx = z.x - v.x, dy = z.y - v.y; if (dx * dx + dy * dy < v.r2) return true; } return !VIS.length; };
const vehGun = p => p && p.ride ? (inMech(p) ? 'mech' : p.mtr > 0 ? 'busy' : VEH[p.veh] && VEH[p.veh].gun || null) : null; // (round 34b) mid-transform nothing fires
/* ---------- (round 34) mechs ---------- */
// why you can't climb into the mech right now ('' = you can)
// (round 34b) 变形: vehicle ⇄ mech, 1 s during which you can't move or shoot; why not ('' = go)
function xformDeny(p, to) {
  if (!p.ride || p.down || p.dead || !MECHS[p.veh]) return '先上车才能变形';
  if (p.mtr > 0) return '正在变形';
  if (to) { if (mhpOf(p) <= 0) return MECHS[p.veh].name + '的装甲还没修好（慢慢会恢复，或在商店修）'; if ((p.bat || 0) < 5) return '机甲电量不够（慢慢会充回来，或在商店充电）'; if (skyTop(p.x, p.y) > (airborne(p) ? skyTop(p.x, p.y) : p.L)) return '头顶有屋顶，站不起来：到室外再变形'; }
  return '';
}
function startXform(p, to, why) {
  p.mto = to ? 1 : 0; p.mtr = BAL.xformT; if (!to) { p.mform = 0; p.mfly = false; p.evoOn = false; p.spinT = 0; p.rageT = 0; } // (turning back, it is a vehicle again as soon as it starts folding: the mech's guard drops)
  if (to) for (const q of W.p) if (q.pass === p.i) q.pass = -1; // the back seat folds away
  if (why) emit({ k: 'deny', p: p.i, why });
  emit({ k: 'xform', o: p.i, to: p.mto, v: p.veh });
}
function mechEject(p, why) { if (inMech(p)) startXform(p, 0, why); }
// fire: a punch / blade swing in front, hits everything in the arc (alternating arms)
// (round 35) what a mech's next attack goes for: the zombie you picked if it is in range, else the best one in front of you (closer to where you aim
// and nearer scores higher), in sight, awake and not cloaked. Melee looks a little past its reach (it steps in); ranged within its range.
const mechRanged = M => M.atk === 'rocket' || M.atk === 'cannon' || M.atk === 'parcel';
// (round 36k) smart aim for a mech's lobbed / explosive shot when nobody aimed by hand (touch auto-aim, or no aim at all):
// every zombie in range is a candidate centre, each at its predicted spot when the shot lands; a centre scores the threat-weighted zombies its blast would catch
// (big ones and elites count more, near ones and ones coming at you count more, a little preference for where you face); the shot goes to the weighted middle of the best group
function mechSmart(p, M, range) {
  const lob = M.atk === 'parcel', R = (M.blast || 1.5) * 0.9, spd = M.atk === 'rocket' ? 20 : M.atk === 'cannon' ? 45 : 0, pz = p.z + 1.6, C = [];
  for (const z of W.zs) {
    if (!(z.hp > 0) || z.hidden || z.sleep || z.ck || z.ckF || Math.abs(z.z - p.z) > 6) continue; const fly = ZT[z.k].fly; if (lob && fly) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > range + z.r || d < 0.8) continue; if (!lob && !los(p.x, p.y, pz, z.x, z.y, z.z + z.h * 0.5)) continue;
    let tt = spd ? d / spd : 0.25 + Math.min(range, d) / 14, x = z.x + (z.evx || 0) * tt, y = z.y + (z.evy || 0) * tt; { const d2 = Math.hypot(x - p.x, y - p.y); tt = spd ? d2 / spd : 0.25 + Math.min(range, d2) / 14; x = z.x + (z.evx || 0) * tt; y = z.y + (z.evy || 0) * tt; }
    const T = ZT[z.k], big = T.boss || T.kaiju || T.elite || z.k === 'brute' || z.k === 'riot', vr = -((z.evx || 0) * dx + (z.evy || 0) * dy) / (d || 1);
    const w = (big ? 2.5 : 1) * (1 + 1.6 * (1 - d / (range + 1))) * (1 + 0.12 * clamp(vr, 0, 5)) * (0.85 + 0.15 * Math.cos(angDiff(Math.atan2(dy, dx), p.aim)));
    C.push({ z, x, y, w, zz: z.z + z.h * 0.45 });
  }
  if (!C.length) return null; let best = null, bs = -1;
  for (const c of C) { let s = 0; for (const o of C) if (Math.hypot(o.x - c.x, o.y - c.y) < R) s += o.w; if (c.z.id === p._smZ) s *= 1.15; if (s > bs) { bs = s; best = c; } } // a slight stickiness so it doesn't flick between equal groups
  let sx = 0, sy = 0, sw = 0, sz = 0; for (const o of C) if (Math.hypot(o.x - best.x, o.y - best.y) < R) { sx += o.x * o.w; sy += o.y * o.w; sz += o.zz * o.w; sw += o.w; }
  p._smZ = best.z.id; return { z: best.z, pt: { x: sx / sw, y: sy / sw, z: sz / sw } };
}
// (round 36n) 疾风's machine gun: hitscan, endless, no reload. Mouse aim shoots where you point; touch / no aim picks the best target in front (flyers too)
function mgunPick(p, range, sx, sy, sz) {
  let best = null, bs = -1e9;
  for (const z of W.zs) { if (!(z.hp > 0) || z.hidden || z.sleep || z.ck || z.ckF || !zSeen(z)) continue; const dx = z.x - sx, dy = z.y - sy, d = Math.hypot(dx, dy); if (d > range + z.r || d < 0.3) continue;
    const c = Math.cos(angDiff(Math.atan2(dy, dx), p.aim)), sc = c * 1.2 - d / range + (ZT[z.k].elite || ZT[z.k].kaiju ? 0.3 : 0); if (c < 0.2 && d > 2) continue; if (sc > bs && los(sx, sy, sz, z.x, z.y, z.z + z.h * 0.5)) { bs = sc; best = z; } }
  return best;
}
function mgunRay(sx, sy, sz, dx, dy, dz, range) {
  const wall = rayWorld(sx, sy, sz, dx, dy, dz, range, { lean: LEAN }); let best = null, bd = wall.d;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const d = rayBox(sx, sy, sz, dx, dy, dz, z.x - z.r - 0.05, z.y - z.r - 0.05, z.z, z.r * 2 + 0.1, z.r * 2 + 0.1, z.h, bd); if (d >= 0 && d < bd) { bd = d; best = z; } }
  return { z: best, d: bd };
}
function mechGun(p, M) {
  const S = J_MECHS_S(p), a0 = p.aim, side = -1, sx0 = p.x + Math.cos(a0) * 0.85 * S + Math.cos(a0 + Math.PI / 2) * side * 0.3 * S, sy0 = p.y + Math.sin(a0) * 0.85 * S + Math.sin(a0 + Math.PI / 2) * side * 0.3 * S, sz = p.z + 1.45 * S;
  let T = null; const A = p.aimPt; if (A && !A.auto) T = A.zb && A.zb.hp > 0 ? { x: A.zb.x, y: A.zb.y, z: A.zb.z + A.zb.h * 0.55 } : { x: A.x, y: A.y, z: A.z != null ? A.z + 0.5 : p.z + 0.6 };
  else { const z = mgunPick(p, M.range, sx0, sy0, sz); if (z) T = { x: z.x, y: z.y, z: z.z + z.h * 0.55 }; }
  if (!T) T = { x: sx0 + Math.cos(a0) * 8, y: sy0 + Math.sin(a0) * 8, z: p.z + 0.7 };
  const a = Math.atan2(T.y - p.y, T.x - p.x); p.mAim = a;
  let dx = T.x - sx0, dy = T.y - sy0, dz = T.z - sz; const n = Math.hypot(dx, dy, dz) || 1; dx /= n; dy /= n; dz /= n; const sp = BAL.mgSpread;
  dx += (rand() - 0.5) * 2 * sp; dy += (rand() - 0.5) * 2 * sp; dz += (rand() - 0.5) * sp; const m = Math.hypot(dx, dy, dz); dx /= m; dy /= m; dz /= m;
  const r = mgunRay(sx0, sy0, sz, dx, dy, dz, M.range);
  if (r.z) hurtZombie(r.z, M.dmg * (1 + 0.12 * W.upg), p, dx * 0.25, dy * 0.25);
  noiseAt(p.x, p.y, 9, p.z);
  emit({ k: 'gshot', o: p.i, mg: 1, a: r2(a), x: r2(sx0), y: r2(sy0), z: r2(sz), e: [r2(sx0 + dx * r.d), r2(sy0 + dy * r.d), r2(sz + dz * r.d)], h: r.z ? 1 : 0 });
}
const J_MECHS_S = p => (MECH_DIM[(MECHS[p.veh] || {}).style] || {}).s || 1;
// where drone k of a 浮游炮 swarm hovers at time t (host and screens work it out the same way)
function dronePos(o, k, t) { const N = BAL.droneN, a = t * 1.1 + k / N * Math.PI * 2, r = 2.1 + (k % 2) * 0.7; return { x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r, z: o.z + 2.3 + (k % 2) * 0.5 + Math.sin(t * 2.3 + k) * 0.18 }; }
function stepDrones(dt) {
  if (!W.drones || !W.drones.length) return;
  for (const D of W.drones) { const o = W.p[D.o]; D.t -= dt; if (!o || o.dead || o.gone || !inMech(o) || mechOf(o).skill !== 'drones') D.t = Math.min(D.t, 0); if (D.t <= 0) { emit({ k: 'drones', o: D.o, t: 0 }); continue; }
    for (let k = 0; k < BAL.droneN; k++) { D.cd[k] -= dt; if (D.cd[k] > 0) continue; D.cd[k] += BAL.droneRate; const q = dronePos(o, k, W.t);
      let best = null, bd = BAL.droneRange; for (const z of W.zs) { if (!(z.hp > 0) || z.hidden || z.sleep || z.ck || z.ckF || !zSeen(z)) continue; const d = Math.hypot(z.x - q.x, z.y - q.y); if (d < bd && los(q.x, q.y, q.z, z.x, z.y, z.z + z.h * 0.5)) { bd = d; best = z; } }
      if (!best) continue; const tz = best.z + best.h * 0.5; let dx = best.x - q.x, dy = best.y - q.y, dz = tz - q.z; const n = Math.hypot(dx, dy, dz) || 1; dx /= n; dy /= n; dz /= n;
      const r = mgunRay(q.x, q.y, q.z, dx, dy, dz, BAL.droneRange + 1); if (r.z) hurtZombie(r.z, BAL.droneDmg * (1 + 0.12 * W.upg), o, dx * 0.15, dy * 0.15, true);
      D.buf.push(k, r2(q.x + dx * r.d), r2(q.y + dy * r.d), r2(q.z + dz * r.d)); }
    if (D.buf.length && W.t - D.eT > 0.1) { emit({ k: 'dsh', o: D.o, s: D.buf }); D.buf = []; D.eT = W.t; } }
  W.drones = W.drones.filter(D => D.t > 0);
}
function mechLock(p, M, far) {
  M = M || mechOf(p); if (!M) return null; const ranged = mechRanged(M) || far, range = far || (ranged ? M.range || 16 : M.reach + 2.4), cmin = ranged ? 0.64 : 0.17, a = p.aim;
  const ok = z => z && z.hp > 0 && !z.hidden && !z.sleep && !(z.ck || z.ckF) && Math.abs(z.z - p.z) < (ranged ? 6 : 2.6);
  p._smPt = null; if (mechRanged(M) && !far && (!p.aimPt || p.aimPt.auto)) { const sm = mechSmart(p, M, M.range || 16); if (sm) { p._smPt = sm.pt; return sm.z; } } // (round 36k) no hand aim: smart aim
  const pz = p.z + 1.6, lob = M.atk === 'parcel' && !far; let zb = p.aimPt && p.aimPt.zb; /* (round 36j) a lobbed parcel goes over walls: no line of sight needed */
  if (ranged && !far && p.aimPt && !zb) { const A = p.aimPt; let nz = null, nd = 1e9; for (const z of W.zs) { if (!ok(z)) continue; const d = Math.hypot(z.x - A.x, z.y - A.y); if (d < z.r + 0.55 && d < nd) { nd = d; nz = z; } } // (round 36j) a lobbed / explosive mech shot goes where you point: on a zombie = that zombie (led), on the ground = that spot (no auto-lock)
    if (!nz && Math.hypot(A.x - p.x, A.y - p.y) <= range + 1) return null; zb = nz; }
  if (ok(zb) && Math.hypot(zb.x - p.x, zb.y - p.y) <= range + zb.r && (lob || los(p.x, p.y, pz, zb.x, zb.y, zb.z + zb.h * 0.5))) return zb;
  let best = null, bs = -1e9;
  for (const z of W.zs) { if (!ok(z)) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > range + z.r || d < 0.3) continue; const c = Math.cos(angDiff(Math.atan2(dy, dx), a)); if (c < cmin && d > 1.2) continue;
    const sc = c * 1.5 - d / range + (ZT[z.k].fly && !ranged ? -0.5 : 0); if (sc > bs && (lob || los(p.x, p.y, pz, z.x, z.y, z.z + z.h * 0.5))) { bs = sc; best = z; } }
  return best;
}
function mechPunch(p) {
  if (p.gcd > 0) return; const M = mechOf(p); p.gcd = M.rate; p.mside = 1 - (p.mside || 0); if (M.atk === 'mgun') return mechGun(p, M); /* (round 36n) 疾风's machine gun */ if (M.evo) return evoAttack(p, M); /* (round 37) beast form */
  p.mcmb = W.t - (p.mlastT || -9) < M.rate + 0.5 ? ((p.mcmb || 0) + 1) % 3 : 0; p.mlastT = W.t; // (round 34d) a quick follow-up continues the combo (the host decides, every screen shows the same move)
  // (round 35) turn to the target (and step in if it is just out of reach) so the blow / shot goes where the zombie is
  const fistN = false, /* (round 36n) 铁卫's third blow is a pound now, not the fist cannon */ T = mechLock(p, M, fistN ? 7 : 0), ranged = mechRanged(M) || fistN; let a = p.aim; // the fist cannon reaches 7
  if (T) { a = Math.atan2(T.y - p.y, T.x - p.x); const d = Math.hypot(T.x - p.x, T.y - p.y), want = M.reach * 0.75;
    if (!ranged && d > want + 0.2 && !airborne(p)) { const st = Math.min(d - want, 2.2); mechMove(p, { dash: { dx: Math.cos(a) * st, dy: Math.sin(a) * st, t: 0, T: 0.12 } }); } }
  p.mAim = a; p.mTgt = T ? T.id : -1;
  emit({ k: 'mpunch', o: p.i, s: p.mside, c: p.mcmb, a: r2(a) });
  if (M.atk === 'rocket' || M.atk === 'cannon' || M.atk === 'parcel') return mechShoot(p, M.atk === 'heavy' ? 'fist' : M.atk, T, a);
  (W.dly = W.dly || []).push({ t: 0.13, punch: p.i, c: p.mcmb, a }); // the blow lands when the swing does (after the wind-up)
}
// a melee blow lands: every style hits the ground in front of the mech (zombie height), some in a sector, some round a point
function mechPunchHit(p, cmb, aa) {
  if (!inMech(p)) return; const M = mechOf(p), a = aa != null ? aa : p.aim, ca = Math.cos(a), sa = Math.sin(a); let n = 0;
  const stomp = false, hammer = M.atk === 'heavy', dbl = hammer && cmb === 2, cleave = M.atk === 'chop' && cmb === 2, spin = M.atk === 'kick' && cmb === 2; /* (round 36n) 铁卫: every blow pounds the ground (left, right, both fists) */
  const cx = spin ? p.x : p.x + ca * (hammer ? (dbl ? 1.9 : 2.0) : M.reach * 0.7), cy = spin ? p.y : p.y + sa * (hammer ? (dbl ? 1.9 : 2.0) : M.reach * 0.7), R = spin ? 2.7 : hammer ? (dbl ? 3.1 : 2.5) : 0; /* (round 35) hammer 1.7 / r 1.5 → 2.2 / 2.2, stomp r 2.0 → 2.8 */
  for (const z of W.zs) {
    if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.6) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy);
    let hit; if (R) hit = Math.hypot(z.x - cx, z.y - cy) < R + z.r; else hit = d <= M.reach + z.r && (d <= 0.6 || Math.cos(angDiff(Math.atan2(dy, dx), a)) >= Math.cos(M.arc));
    if (!hit) continue;
    const big = ZT[z.k].boss || ZT[z.k].kaiju, dm = M.dmg * mechMul() * (dbl ? 1.6 : stomp ? 1.1 : hammer || cleave || spin ? 1.3 : 1), k = big ? M.kb * 0.15 : M.kb, ex = R ? z.x - cx : dx, ey = R ? z.y - cy : dy, el = Math.hypot(ex, ey) || 1;
    hurtZombie(z, dm, p, ex / el * k, ey / el * k); z.stun = Math.max(z.stun || 0, big ? 0.05 : dbl ? 1.0 : hammer ? 0.5 : spin ? 0.7 : 0.35); n++;
  }
  // knocks over light stuff in front (fences, barricades; not walls, not what you built)
  const fx = Math.floor(p.x + ca * 1.6), fy = Math.floor(p.y + sa * 1.6);
  if (inMap(fx, fy)) for (let l = p.L; l < p.L + 2 && l < ML; l++) { const i = ci(fx, fy, l); if (W.blk[i] && B[W.blk[i]].brk && !B[W.blk[i]].st && !(W.mine && W.mine.has(i))) { const b0 = W.blk[i], d0 = W.bdir[i]; damageCell(i, M.dmg * 1.5); if (!W.blk[i]) mechScar(i, b0, d0); } }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(cx), y: r2(cy), z: r2(p.z + 0.15), g: R || M.atk === 'chop' || M.atk === 'shovel' ? 1 : 0, r: R || 1 }); noiseAt(p.x, p.y, 6, p.z);
}
// (round 34d) ranged mech attacks: 苍隼's shoulder rockets, 重炮's arm cannon, 铁卫's fist cannon (the third blow of its combo).
// A straight shot to the first zombie / wall / where you aim; rockets and the cannon burst there, the fist hits the first zombie hard.
function mechShoot(p, kind, LK, aa) {
  const M = mechOf(p), a = aa != null ? aa : p.aim, fist = kind === 'fist', range = fist ? 7 : M.range || 16, side = p.mside ? 1 : -1, ca = Math.cos(a), sa = Math.sin(a);
  const sh = kind === 'rocket' ? [-0.1, side * 0.42, 2.75] : kind === 'cannon' ? [1.5, -0.6, 2.05] : kind === 'parcel' ? [-0.55, side * 0.25, 2.35] : [1.3, side * 0.6, 1.9]; /* (round 35) rockets from the shoulder pods, shells from the arm barrel's muzzle, parcels off the back rack */ // where it leaves the mech (forward, left, up), at the mech's own size
  const s = (MECH_DIM[M.style] || {}).s || 1, sx = p.x + (ca * sh[0] - sa * sh[1]) * s, sy = p.y + (sa * sh[0] + ca * sh[1]) * s, z0 = pZ(p) + sh[2] * s;
  let T = p.aimPt ? { x: p.aimPt.x, y: p.aimPt.y, z: p.aimPt.z } : { x: p.x + ca * 10, y: p.y + sa * 10, z: pZ(p) + 0.6 };
  { const best = LK && LK.hp > 0 && Math.hypot(LK.x - p.x, LK.y - p.y) <= range + LK.r ? LK : LK === undefined ? mechLock(p, M) : null; // (round 35) the target mechPunch picked (mechLock: a wider cone, in sight)
    if (best && p._smPt) { T = { x: p._smPt.x, y: p._smPt.y, z: p._smPt.z }; p._smPt = null; } /* (round 36k) the smart-aim point already has the lead and the group centre */
    else if (best) { T = { x: best.x, y: best.y, z: best.z + best.h * 0.45 }; // (round 36j) lead it: aim where it will be when the shot arrives (its smoothed velocity × flight time)
      const spd = kind === 'rocket' ? 20 : kind === 'cannon' ? 45 : 0; let tt = 0; for (let it = 0; it < 3; it++) { const d = Math.hypot(T.x - p.x, T.y - p.y); tt = spd ? d / spd : 0.25 + Math.min(range, d) / 14; T.x = best.x + (best.evx || 0) * tt; T.y = best.y + (best.evy || 0) * tt; } } }
  if (kind === 'parcel') { const d = Math.min(range, Math.hypot(T.x - p.x, T.y - p.y)), ex = p.x + Math.cos(Math.atan2(T.y - p.y, T.x - p.x)) * d, ey = p.y + Math.sin(Math.atan2(T.y - p.y, T.x - p.x)) * d, cx = Math.floor(ex), cy = Math.floor(ey), L = inMap(cx, cy) ? gAt(cx, cy) : p.L, gz = L * FH + 0.15, tt = 0.25 + d / 14; // a parcel lobbed in an arc
    const ua = Math.atan2(ey - p.y, ex - p.x), px_ = -Math.sin(ua), py_ = Math.cos(ua); /* (round 36n) three parcels a throw: one on the spot, one each side */
    for (let k = 0; k < 3; k++) { const off = k === 0 ? 0 : (k === 1 ? -1 : 1) * (0.9 + rand() * 0.3), fw = k ? frnd(-0.5, 0.5) : 0, x = ex + px_ * off + Math.cos(ua) * fw, y = ey + py_ * off + Math.sin(ua) * fw, c3x = Math.floor(x), c3y = Math.floor(y), L3 = inMap(c3x, c3y) ? gAt(c3x, c3y) : L, g3 = L3 * FH + 0.15, t3 = tt * (k ? frnd(0.9, 1.12) : 1);
      emit({ k: 'mrkt', o: p.i, kd: 'parcel', x: r2(sx), y: r2(sy), z: r2(z0), e: [r2(x), r2(y), r2(g3)], t: r2(t3) }); (W.dly = W.dly || []).push({ t: t3, box: 1, x, y, zz: g3, R: M.blast, dmg: M.dmg * mechMul(), o: p.i }); }
    noiseAt(p.x, p.y, 5, p.z); return; }
  let dx = T.x - sx, dy = T.y - sy, dz = (T.z != null ? T.z : z0 - 1) - z0; const hl = Math.hypot(dx, dy) || 1; dz = clamp(dz / hl, airborne(p) ? -6 : -1.2, 0.4) * hl; /* (round 36b) from the air it can shoot steeply down (was capped at -1.2: rockets at close targets flew over them) */ const n = Math.hypot(dx, dy, dz) || 1; dx /= n; dy /= n; dz /= n;
  const want = Math.min(range, Math.hypot(T.x - sx, T.y - sy) + 0.3), wall = rayWorld(sx, sy, z0, dx, dy, dz, range, { lean: LEAN }); let bd = Math.min(wall.d, p.aimPt && !fist ? want : range), hz = null;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const d = rayBox(sx, sy, z0, dx, dy, dz, z.x - z.r - 0.15, z.y - z.r - 0.15, z.z, z.r * 2 + 0.3, z.r * 2 + 0.3, z.h, bd); if (d >= 0 && d < bd) { bd = d; hz = z; } }
  const ex = sx + dx * bd, ey = sy + dy * bd, ez = Math.max(z0 + dz * bd, 0), spd = kind === 'rocket' ? 20 : kind === 'cannon' ? 45 : 26, tt = bd / spd;
  emit({ k: 'mrkt', o: p.i, kd: kind, x: r2(sx), y: r2(sy), z: r2(z0), e: [r2(ex), r2(ey), r2(ez)], t: r2(tt) });
  const salvo = kind === 'rocket' && airborne(p), dmK = salvo ? BAL.flyRkMul : 1; /* (round 36n) 苍隼 flying: a salvo of three, each harder */
  if (salvo) for (let k = 1; k < BAL.flyRk; k++) { const side2 = k === 1 ? -1 : 1, px_ = -dy, py_ = dx, pl = Math.hypot(px_, py_) || 1, off = 1.3 * side2, x = ex + px_ / pl * off, y = ey + py_ / pl * off, c4x = Math.floor(x), c4y = Math.floor(y), gz4 = inMap(c4x, c4y) ? surfZ(x, y, gAt(c4x, c4y)) + 0.2 : ez, t4 = tt * frnd(1.0, 1.15);
    emit({ k: 'mrkt', o: p.i, kd: kind, x: r2(sx - side2 * 0.3 * sa), y: r2(sy + side2 * 0.3 * ca), z: r2(z0), e: [r2(x), r2(y), r2(gz4)], t: r2(t4) }); (W.dly = W.dly || []).push({ t: t4, x, y, L: Math.max(0, Math.floor(gz4 / FH)), R: M.blast || 1.5, dmg: M.dmg * dmK, o: p.i, shell: 1, zz: gz4 }); }
  if (fist) { if (hz) (W.dly = W.dly || []).push({ t: tt, fistZ: hz.id, o: p.i, dx, dy }); }
  else (W.dly = W.dly || []).push({ t: tt, x: ex, y: ey, L: Math.max(0, Math.floor(ez / FH)), R: M.blast || 1.5, dmg: M.dmg * dmK, o: p.i, shell: 1, zz: ez });
  noiseAt(p.x, p.y, kind === 'cannon' ? 12 : 9, p.z);
}
// the skill (grenade key): slam / dash / leap toward v = { x, y }
function mechSkill(p, v) {
  const M = mechOf(p); if ((p.mcd || 0) > 0) { emit({ k: 'deny', p: p.i, why: M.sn + '冷却中（' + Math.ceil(p.mcd) + ' 秒）' }); return; }
  let tx = v && v.x != null ? v.x : p.x + Math.cos(p.aim) * 8, ty = v && v.y != null ? v.y : p.y + Math.sin(p.aim) * 8;
  const ang = Math.atan2(ty - p.y, tx - p.x), dist = Math.hypot(tx - p.x, ty - p.y);
  if (M.evo) return evoSkill(p, M, ang, dist, tx, ty); /* (round 37) beast skills */
  if (M.skill === 'fly') { // (round 34d) 苍隼: take off / come down
    if (!p.mfly) { if ((p.bat || 0) < 15) { emit({ k: 'deny', p: p.i, why: '电量不够起飞' }); return; } if (skyTop(p.x, p.y) > p.L) { emit({ k: 'deny', p: p.i, why: '头顶有屋顶，飞不起来' }); return; } p.mfly = true; p.alt = 0; p.land = false; p._cz = null; }
    else p.land = true;
    emit({ k: 'mskill', o: p.i, t: 'fly', x: r2(p.x), y: r2(p.y), z: r2(p.z) }); p.mcd = M.cd; return;
  }
  if (M.skill === 'drones') { // (round 36n) 疾风 浮游炮: ten hovering guns orbit you for a while and shoot whatever they can see
    W.drones = (W.drones || []).filter(d => d.o !== p.i); W.drones.push({ o: p.i, t: BAL.droneT, cd: [...Array(BAL.droneN)].map((_, k) => k * BAL.droneRate / BAL.droneN), buf: [], eT: 0 });
    emit({ k: 'drones', o: p.i, t: BAL.droneT }); emit({ k: 'mskill', o: p.i, t: 'drones', x: r2(p.x), y: r2(p.y), z: r2(p.z) });
    p.mcd = M.cd; return;
  }
  if (M.skill === 'parcels') { // (round 34d) 工蜂: a heap of big parcels rains down round the target
    const D = clamp(dist, 3, 12), cx0 = p.x + Math.cos(ang) * D, cy0 = p.y + Math.sin(ang) * D, s2 = (MECH_DIM[M.style] || {}).s || 1;
    const N = BAL.rainN; for (let k = 0; k < N; k++) { const a2 = rand() * Math.PI * 2, r2_ = BAL.rainR * Math.sqrt(rand()), x = cx0 + Math.cos(a2) * r2_, y = cy0 + Math.sin(a2) * r2_, c2x = Math.floor(x), c2y = Math.floor(y), L = inMap(c2x, c2y) ? gAt(c2x, c2y) : p.L, gz = L * FH + 0.2, go = 0.15 + k / N * BAL.rainT; /* (round 36n) a torrent: 36 big parcels poured out over 2 s */
      (W.dly = W.dly || []).push({ t: go, launch: 1, o: p.i, x, y, zz: gz, ft: 0.5 + D / 18, s2 }); }
    emit({ k: 'mskill', o: p.i, t: 'parcels', x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(ang) }); p.mcd = M.cd; noiseAt(p.x, p.y, 7, p.z); return;
  }
  if (M.skill === 'throw') { // 工蜂: grab the zombie in front and hurl it at the target
    let g = null, gd = 9; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || z.sleep || ZT[z.k].boss || ZT[z.k].kaiju || z.k === 'boss' || Math.abs(z.z - p.z) > 2) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d < 3.4 && d < gd && Math.cos(angDiff(Math.atan2(dy, dx), p.aim)) > 0.2) { gd = d; g = z; } }
    if (!g) { emit({ k: 'deny', p: p.i, why: '面前没有抓得起来的丧尸（太大的抓不动）' }); return; }
    const D = clamp(dist, 3, 9), lx = p.x + Math.cos(ang) * D, ly = p.y + Math.sin(ang) * D, cx = Math.floor(lx), cy = Math.floor(ly), L = inMap(cx, cy) ? gAt(cx, cy) : p.L;
    g.stun = 2; (W.dly = W.dly || []).push({ t: 0.6, T: 0.6, thr: g.id, x0: g.x, y0: g.y, z0: g.z, x: lx, y: ly, L, o: p.i });
    emit({ k: 'mskill', o: p.i, t: 'throw', x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(ang) }); p.mcd = M.cd; return;
  }
  if (M.skill === 'volley') { // 重炮: three shells from the shoulder guns, using the tank's ammo
    const n = Math.min(3, p.shl || 0); if (!n) { emit({ k: 'deny', p: p.i, why: '没炮弹了：商店「武器 · 弹药」里买坦克炮弹' }); return; }
    p.shl -= n; const D = Math.min(18, Math.max(4, dist)), cx0 = p.x + Math.cos(ang) * D, cy0 = p.y + Math.sin(ang) * D, offs = [[0, 0], [1.3, 0.8], [-1.1, -1.0]];
    for (let k = 0; k < n; k++) { const [ox, oy] = offs[k], x = cx0 + ox * Math.cos(ang) - oy * Math.sin(ang), y = cy0 + ox * Math.sin(ang) + oy * Math.cos(ang), c2x = Math.floor(x), c2y = Math.floor(y), L = inMap(c2x, c2y) ? gAt(c2x, c2y) : p.L;
      (W.dly = W.dly || []).push({ t: 0.3 + k * 0.18, x, y, L, R: 2.2, dmg: 110, o: p.i, shell: 1 }); emit({ k: 'cshot', o: p.i, x: r2(p.x), y: r2(p.y), z: r2(p.z + 2.6), e: [r2(x), r2(y), r2(L * FH + 0.3)] }); }
    emit({ k: 'mskill', o: p.i, t: 'volley', x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(ang) }); p.mcd = M.cd; noiseAt(p.x, p.y, SIEGE.boomR, p.z); return;
  }
  if (M.skill === 'slam') { // (round 36n) 铁卫 掀地: heaves the ground up all round — everything within 7 is thrown into the air and lands stunned
    const RQ = BAL.quakeR;
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.5) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > RQ + z.r) continue;
      const Zt = ZT[z.k], big = Zt.boss || Zt.kaiju, f = d < 3 ? 1 : 1 - 0.45 * (d - 3) / (RQ - 3); hurtZombie(z, BAL.quakeDmg * mechMul() * f, p, 0, 0); if (z.hp <= 0) continue;
      z.stun = Math.max(z.stun || 0, big ? 0.7 : 2.0); if (!big && !Zt.fly) { const u = dx / (d || 1), v = dy / (d || 1), out = 1.6 + 1.6 * (1 - d / RQ), T = 0.9; z.air = { t: 0, T, h: 2.0 + 1.4 * (1 - d / RQ), vx: u * out / T, vy: v * out / T }; } }
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + rand() * 0.3, r = 2 + rand() * (RQ - 2), x = Math.floor(p.x + Math.cos(a) * r), y = Math.floor(p.y + Math.sin(a) * r); if (!inMap(x, y)) continue; const i = ci(x, y, p.L); if (W.blk[i] && B[W.blk[i]].brk && !B[W.blk[i]].st && !(W.mine && W.mine.has(i))) { const b0 = W.blk[i], d0 = W.bdir[i]; damageCell(i, 200); if (!W.blk[i]) mechScar(i, b0, d0); } }
    emit({ k: 'mskill', o: p.i, t: 'quake', x: r2(p.x), y: r2(p.y), z: r2(p.z), r: RQ }); noiseAt(p.x, p.y, 14, p.z);
  } else if (M.skill === 'dash') {
    const D = Math.min(8, Math.max(3, dist)), ex = p.x + Math.cos(ang) * D, ey = p.y + Math.sin(ang) * D;
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2) continue; // anything within 1.5 of the path
      const ux = Math.cos(ang), uy = Math.sin(ang), rx = z.x - p.x, ry = z.y - p.y, t = clamp(rx * ux + ry * uy, 0, D), off = Math.hypot(rx - ux * t, ry - uy * t); if (off > 1.5 + z.r) continue;
      const big = ZT[z.k].boss || ZT[z.k].kaiju, sx = -uy * Math.sign(ux * ry - uy * rx || 1); hurtZombie(z, 180 * mechMul(), p, sx * (big ? 1 : 6), (ux * Math.sign(ux * ry - uy * rx || 1)) * (big ? 1 : 6)); z.stun = Math.max(z.stun || 0, big ? 0.2 : 0.8); }
    mechMove(p, { dash: { t: 0, T: 0.32, dx: ex - p.x, dy: ey - p.y } });
    emit({ k: 'mskill', o: p.i, t: 'dash', x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(ang) });
  } else { // leap: over roofs to open ground near the target, a shockwave where it lands
    let D = Math.min(12, dist), best = null;
    for (let r = 0; r <= 3 && !best; r++) for (let k = 0; k < 12 && !best; k++) { const a2 = k / 12 * Math.PI * 2, x = p.x + Math.cos(ang) * D + Math.cos(a2) * r, y = p.y + Math.sin(ang) * D + Math.sin(a2) * r, cx = Math.floor(x), cy = Math.floor(y);
      if (!inMap(cx, cy)) continue; const g = gAt(cx, cy); if (skyTop(cx, cy) > g || !standable(cx, cy, g, 'p') || ttAt(cx, cy) === TT.water) continue; best = { x: cx + 0.5, y: cy + 0.5, L: g }; }
    if (!best) { emit({ k: 'deny', p: p.i, why: '那里落不了地：要空旷的地面' }); return; }
    mechMove(p, { jmp: { t: 0, T: 1.05, x0: p.x, y0: p.y, x1: best.x, y1: best.y, L: best.L, h: 4.2, mech: 1 } });
    (W.dly = W.dly || []).push({ t: 1.05, x: best.x, y: best.y, L: best.L, R: 3, dmg: 150, o: p.i });
    emit({ k: 'mskill', o: p.i, t: 'leap', x: r2(p.x), y: r2(p.y), z: r2(p.z), e: [r2(best.x), r2(best.y)] });
  }
  p.mcd = M.cd; noiseAt(p.x, p.y, SIEGE.boomR, p.z);
}
// movement belongs to whoever plays that survivor: do it here, or tell their screen to
function mechMove(p, m) { if (p.i === ME && NETROLE !== 'guest') { if (m.dash) p.dash = m.dash; if (m.jmp) p.jmp = m.jmp; } else emit({ k: 'mmove', p: p.i, m }); }
// delayed shockwaves (the leap landing)
function stepDelayed(dt) {
  if (!W.dly || !W.dly.length) return;
  for (const q of W.dly) { q.t -= dt;
    if (q.thr != null) { const z = W.zs.find(z => z.id === q.thr); if (z && z.hp > 0) { const f = clamp(1 - q.t / q.T, 0, 1), gz = surfZ(q.x, q.y, q.L); z.x = lerp(q.x0, q.x, f); z.y = lerp(q.y0, q.y, f); z.z = lerp(q.z0, gz, f) + Math.sin(f * Math.PI) * 3; z.stun = Math.max(z.stun || 0, 0.3);
      if (q.t <= 0) { z.L = q.L; z.z = gz; const o = W.p[q.o]; hurtZombie(z, 200 * mechMul(), o, 0, 0); for (const y of W.zs) { if (y === z || y.hp <= 0 || y.hidden) continue; const d = Math.hypot(y.x - q.x, y.y - q.y); if (d < 2) { hurtZombie(y, 100, o, (y.x - q.x) / (d || 1) * 5, (y.y - q.y) / (d || 1) * 5); y.stun = Math.max(y.stun || 0, 0.8); } } emit({ k: 'slam', x: r2(q.x), y: r2(q.y), z: r2(gz), r: 2 }); emit({ k: 'sfx', n: 'smash', x: q.x, y: q.y }); } } else q.t = 0; continue; } // (round 34b) a thrown zombie flies, then smashes down
    if (q.t > 0) continue; if (q.punch != null) { if (W.p[q.punch]) mechPunchHit(W.p[q.punch], q.c, q.a); continue; } const o = W.p[q.o];
    if (q.stomp) { if (o) { evoRound(o, q.x, q.y, q.R, q.dmg, q.kb || 8, q.st || 1, q.psn, q.psnM, q.ring); if (q.moon) { const gz = surfZ(q.x, q.y, q.L); emit({ k: 'moonfx', x: r2(q.x), y: r2(q.y), z: r2(gz), r: q.R }); if (q.zone) { (W.evz = W.evz || []).push({ k: 'moon', x: q.x, y: q.y, z: gz, r: q.R, t: q.zone, o: q.o, m: q.dmg / 320 }); (W.cz = W.cz || []).push({ k: 5, x: r2(q.x), y: r2(q.y), z: r2(gz), r: q.R, t: q.zone }); emit({ k: 'ezone', zk: 'moon', x: r2(q.x), y: r2(q.y), z: r2(gz), r: q.R, t: q.zone }); } } } continue; } if (q.claw) { if (o && inMech(o)) evoClaw(o, q.a, q.dmg); continue; } if (q.ears) { if (o && inMech(o)) evoEars(o, q.a, q.dmg, q.big); continue; } /* (round 38d) 玉兔 */ /* (round 37) beast blows */
    if (q.launch) { if (o && inMech(o)) { const ft = q.ft * frnd(0.85, 1.1), sd = rand() < 0.5 ? -1 : 1, ca2 = Math.cos(o.aim), sa2 = Math.sin(o.aim); emit({ k: 'mrkt', o: q.o, kd: 'bigparcel', x: r2(o.x - ca2 * 0.5 * q.s2 - sa2 * sd * 0.3), y: r2(o.y - sa2 * 0.5 * q.s2 + ca2 * sd * 0.3), z: r2(pZ(o) + 2.4 * q.s2), e: [r2(q.x), r2(q.y), r2(q.zz)], t: r2(ft) }); W.dly.push({ t: ft, box: 1, big: 1, x: q.x, y: q.y, zz: q.zz, R: 1.5, dmg: BAL.rainDmg * mechMul(), o: q.o }); } continue; } /* (round 36n) one parcel of the 快递雨 torrent leaves the rack */
    if (q.fistZ != null) { const z = W.zs.find(z => z.id === q.fistZ); if (z && z.hp > 0) { const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 140 * mechMul(), o, q.dx * (big ? 2 : 9), q.dy * (big ? 2 : 9)); z.stun = Math.max(z.stun || 0, big ? 0.2 : 1); emit({ k: 'mhit', o: q.o, h: 1, x: r2(z.x), y: r2(z.y), z: r2(z.z + 0.8), r: 1 }); } continue; }
    if (q.shell) { explode(q.x, q.y, q.zz != null ? q.zz : surfZ(q.x, q.y, q.L) + 0.3, o, q.R, q.dmg); continue; }
    if (q.box) { let n = 0; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - q.zz) > 2) continue; const dx = z.x - q.x, dy = z.y - q.y, d = Math.hypot(dx, dy); if (d > q.R + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, q.dmg * (d < q.R * 0.5 ? 1 : 0.7), o, dx / (d || 1) * (big ? 1 : 4), dy / (d || 1) * (big ? 1 : 4)); z.stun = Math.max(z.stun || 0, big ? 0.1 : q.big ? 0.8 : 0.3); n++; } emit({ k: 'mhit', o: q.o, h: n ? 1 : 0, x: r2(q.x), y: r2(q.y), z: r2(q.zz), g: 1, r: q.R, box: q.big ? 2 : 1 }); continue; } // (round 34d) a parcel smashes down
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - surfZ(q.x, q.y, q.L)) > 2) continue; const dx = z.x - q.x, dy = z.y - q.y, d = Math.hypot(dx, dy); if (d > q.R) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, q.dmg, o, dx / (d || 1) * (big ? 2 : 8), dy / (d || 1) * (big ? 2 : 8)); z.stun = Math.max(z.stun || 0, big ? 0.4 : 1.2); }
    emit({ k: 'boom', x: r2(q.x), y: r2(q.y), z: r2(surfZ(q.x, q.y, q.L) + 0.2), s: 1 }); }
  W.dly = W.dly.filter(q => q.t > 0);
}
// (round 31) tank cannon: a shell flies flat from the muzzle to the first thing in the way (or where you aim) and bursts there
function tankFire(p) {
  if (p.gcd > 0) return;
  if (!(p.shl > 0)) { if (!(p.emptyT > 0)) { p.emptyT = 1.5; emit({ k: 'deny', p: p.i, why: '坦克没炮弹了：商店「武器 · 弹药」里买' }); } return; }
  p.gcd = BAL.tankRate; p.shl--;
  const a = p.aim, z0 = pZ(p) + 0.82, sx = p.x + Math.cos(a) * 1.4, sy = p.y + Math.sin(a) * 1.4;
  const T = p.aimPt || { x: sx + Math.cos(a) * 10, y: sy + Math.sin(a) * 10, z: z0 - 0.5 };
  let dx = T.x - sx, dy = T.y - sy, dz = T.z - z0; const hl = Math.hypot(dx, dy) || 1; dz = clamp(dz / hl, -0.3, 0.6) * hl; const n = Math.hypot(dx, dy, dz) || 1; dx /= n; dy /= n; dz /= n;
  const want = Math.min(BAL.tankRange, Math.hypot(T.x - sx, T.y - sy, T.z - z0) + 0.2), wall = rayWorld(sx, sy, z0, dx, dy, dz, BAL.tankRange, { lean: LEAN }); let bd = Math.min(wall.d, p.aimPt ? want : BAL.tankRange);
  for (const z of W.zs) { if (z.hp <= 0) continue; const d = rayBox(sx, sy, z0, dx, dy, dz, z.x - z.r, z.y - z.r, z.z, z.r * 2, z.r * 2, z.h, bd); if (d >= 0 && d < bd) bd = d; }
  const ex = sx + dx * bd, ey = sy + dy * bd, ez = Math.max(z0 + dz * bd, 0);
  emit({ k: 'cshot', o: p.i, x: r2(sx), y: r2(sy), z: r2(z0), e: [r2(ex), r2(ey), r2(ez)] });
  explode(ex, ey, ez, p, BAL.tankR, BAL.tankDmg); noiseAt(p.x, p.y, SIEGE.boomR, p.z);
}
function skyTop(x, y) {
  x = Math.floor(x); y = Math.floor(y); if (!inMap(x, y)) return 0;
  for (let L = ML - 1; L >= 0; L--) { const i = ci(x, y, L), b = W.blk[i]; if (b && B[b].P) return Math.min(ML - 1, L + 1); if (L > 0 && W.slab[i]) return L; }
  return 0;
}
// (round 32) getting off a back seat: if the seat was over something you can't stand in (a railing, a crate), step onto the driver's spot or the nearest free one
function offSeat(p, d) {
  const fx = Math.floor(p.x), fy = Math.floor(p.y); if (p.L <= skyTop(p.x, p.y) && standable(fx, fy, p.L, 'p')) return;
  if (d && !d.gone && standable(Math.floor(d.x), Math.floor(d.y), d.L, 'p') && !airborne(d)) { p.x = d.x; p.y = d.y; p.L = d.L; }
  else { const t = landSpot(p.x, p.y); if (t) { p.x = t[0]; p.y = t[1]; p.L = skyTop(t[0], t[1]); } }
  p.z = pZ(p); p.zv = p.z;
}
const landOK = (x, y) => { x = Math.floor(x); y = Math.floor(y); return inMap(x, y) && standable(x, y, skyTop(x, y), 'p'); };
function landSpot(x, y) { let best = null, bd = 1e9; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const cx = Math.floor(x) + dx, cy = Math.floor(y) + dy, d = dx * dx + dy * dy; if (d < bd && landOK(cx, cy)) { bd = d; best = [cx + 0.5, cy + 0.5]; } } return best; }
// take off only from the ground or a roof: nothing overhead, and some fuel
function flyOK(p) {
  if (skyTop(p.x, p.y) > p.L) { emit({ k: 'deny', p: p.i, why: '旋翼机只能在地面或楼顶起飞：头顶不能有屋顶' }); return false; }
  if (!(p.fuel > 0.5)) { emit({ k: 'deny', p: p.i, why: '旋翼机没油了：进楼里按 F 加油' }); return false; }
  return true;
}
// owner-side flight: glide where you steer, hover 2.2 floors over whatever is below (looking ahead so it climbs before a building), come down when landing
function flyStep(p, dt) {
  const I = p.inp, m = Math.hypot(I.mx, I.my), k = m > 1 ? 1 / m : 1, V = VEH[p.veh];
  p.spool = p.mform === 1 ? 2 : (p.spool || 0) + dt; // (round 30) 1.2 s of rotor spin-up on the ground first: time for a teammate to hop in the back (34d: 苍隼's jets don't need it)
  let lx = I.mx * k, ly = I.my * k, hold = false;
  if (p.land && !landOK(p.x, p.y)) { const t = landSpot(p.x, p.y); if (t) { const dx = t[0] - p.x, dy = t[1] - p.y, d = Math.hypot(dx, dy) || 1; lx = dx / d; ly = dy / d; } hold = p.alt < 0.35; } // (round 31) never set down on a car, a crate or a fence: slide to the nearest spot you can stand on
  p.alt = clamp((p.alt || 0) + (p.land ? (hold ? 0 : -BAL.flyDrop) : p.spool > 1.2 ? BAL.flyClimb : 0) * dt, 0, 1);
  const spd = BAL.pSpeed * (p.mform === 1 ? mechOf(p).spd * 1.15 : V.spd) * (0.3 + 0.7 * p.alt) * (p.land ? 0.7 : 1), a = Math.min(1, dt * 3.5);
  p.vx = lerp(p.vx, lx * spd, a); p.vy = lerp(p.vy, ly * spd, a);
  const nx = clamp(p.x + p.vx * dt, 1.5, MW - 1.5), ny = clamp(p.y + p.vy * dt, 1.5, MH - 1.5);
  if (skyTop(nx, ny) * FH <= p.z + 0.25) { p.x = nx; p.y = ny; } else { p.vx *= 0.3; p.vy *= 0.3; }  // low down, a wall still stops you
  let top = 0; const ax = p.x + p.vx * 0.7, ay = p.y + p.vy * 0.7;
  for (const [qx, qy] of [[p.x, p.y], [ax, ay]]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) top = Math.max(top, skyTop(qx + dx, qy + dy));
  const g = skyTop(p.x, p.y), gz = surfZ(p.x, p.y, g), cz = (top + BAL.flyHover) * FH;
  p._cz = p._cz == null ? cz : lerp(p._cz, cz, Math.min(1, dt * (cz > p._cz ? 3 : 0.7)));
  p.z = lerp(gz, Math.max(p._cz, gz + 0.6), ease(p.alt)); p.zv = p.z; p.jz = 0;
  p.L = p.alt <= 0 ? g : clamp(Math.floor(p.z / FH + 0.01), g, ML - 1);
  p.anim += dt * 3;
}

/* ---------- player movement (owner-side) ---------- */
function stepMove(p, dt) {
  if (p.dead || p.gone) return;
  p.hurtT = Math.max(0, p.hurtT - dt);
  if (p._wasPass != null && p._wasPass >= 0 && !(p.pass >= 0)) offSeat(p, W.p[p._wasPass]); p._wasPass = p.pass; // (round 32) however the back seat ended (landing, the driver went down, synced from the host), step off onto free ground
  // riding pillion on a teammate's motorbike: sit just behind the driver
  if (p.pass != null && p.pass >= 0) {
    const d = W.p[p.pass];
    if (!d || !d.ride || !vehSeats(d) || d.dead || d.down || d.gone) { p.pass = -1; offSeat(p, d); }
    else { const a = d._ly != null ? d._ly : Math.atan2(d.vy || 0, d.vx || 1); p.x = d.x - Math.cos(a) * PILLION; p.y = d.y - Math.sin(a) * PILLION; /* (round 26) was -d._ly: the pillion sat mirrored, off the bike */ p.L = d.L; p.z = d.z; p.zv = d.zv; p.vx = d.vx; p.vy = d.vy; p._ly = d._ly; return; }
  }
  if (airborne(p)) { flyStep(p, dt); return; } // (round 29)
  p.spool = 0;
  const I = p.inp, m = Math.hypot(I.mx, I.my), k = m > 1 ? 1 / m : 1;
  if (p.jmp) { // mid-vault / mid-jump: a scripted arc
    const J = p.jmp; J.t += dt; const f = Math.min(1, J.t / J.T);
    p.x = lerp(J.x0, J.x1, f); p.y = lerp(J.y0, J.y1, f); p.jz = Math.sin(f * Math.PI) * J.h + (J.up ? J.up * FH * f : 0); // J.up: floors gained (jump pad), eased in so the landing doesn't pop
    p.vx = (J.x1 - J.x0) / J.T; p.vy = (J.y1 - J.y0) / J.T; p.anim += dt * 6;
    if (f >= 1) { const drop = p.L - J.L; p.L = J.L; p.jmp = null; p.jz = 0; p.vx *= 0.3; p.vy *= 0.3; if (drop > 0 || J.k) emitLocal('land'); }
    p.z = pZ(p); return;
  }
  if (p.dash) { const D = p.dash, f = Math.min(dt, D.T - D.t) / D.T; moveEnt(p, D.dx * f, D.dy * f, 'p', true); D.t += dt; if (D.t >= D.T) p.dash = null; p.z = pZ(p); p.anim += dt * 8; return; }
  if (p.L > 0 && p.L > skyTop(p.x, p.y)) { p.L = skyTop(p.x, p.y); p.z = pZ(p); } // (round 31) knocked down mid-air, or a save made in flight: fall to what is below
  const spd = BAL.pSpeed * (p.down ? 0.22 : 1) * (p.medT > 0 && !p.ride ? 0.45 : 1) * (p.build ? 0.9 : 1) * (inMud(p.x, p.y, p.L) && !(p.ride && VEH[p.veh] && VEH[p.veh].mud) ? MUD_SLOW : 1) * (p.ride && VEH[p.veh] ? (inMech(p) ? mechOf(p).spd * (p.spinT > 0 ? 1.7 : 1) : VEH[p.veh].spd) : 1) * (p.mtr > 0 ? 0 : 1); // (round 34b) standing still while it transforms
  const tx = I.mx * k * spd, ty = I.my * k * spd, a = Math.min(1, dt * 14);
  p.vx = lerp(p.vx, tx, a); p.vy = lerp(p.vy, ty, a);
  p.kbx *= Math.max(0, 1 - dt * 6); p.kby *= Math.max(0, 1 - dt * 6);
  p.dropped = 0; p.edgeWant = 0;
  const ox = p.x, oy = p.y, oL = p.L; moveEnt(p, (p.vx + p.kbx) * dt, (p.vy + p.kby) * dt, 'p', true);
  if (p.ride && VEH[p.veh] && (VEH[p.veh].outdoor || p.mform === 1) && skyTop(p.x, p.y) > p.L) { p.x = ox; p.y = oy; p.L = oL; p.vx *= 0.2; p.vy *= 0.2; } // (round 31) the tank doesn't fit under a roof
  if (inMech(p) && !p.jmp && !airborne(p)) { const r = 0.8 * ((MECH_DIM[mechOf(p).style] || {}).s || 1); // (round 34d) rocks, bushes, fences, trees in the way get flattened, not in the way
    for (const [ox2, oy2] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, -r * 0.7]]) { const cx = Math.floor(p.x + ox2 + p.vx * 0.12), cy = Math.floor(p.y + oy2 + p.vy * 0.12); if (!inMap(cx, cy)) continue;
      const i = ci(cx, cy, p.L), b = W.blk[i]; if (b && MECH_CRUSH.has(b)) { p._crT = p._crT || {}; if (!(p._crT[i] > W.t)) { p._crT[i] = W.t + 0.6; act('crush', i); } } } }
  p.edgeK = p.edgeWant; p.edgeT = p.edgeWant && m > 0.3 ? (p.edgeT || 0) + dt : 0;
  // keep pushing into a low obstacle (or a wall) to vault over it
  let vk = 0;
  if (p.bump >= 0 && m > 0.5 && !p.down) {
    const bx = cx_(p.bump) - Math.floor(p.x), by = cy_(p.bump) - Math.floor(p.y);
    if (Math.abs(bx) + Math.abs(by) === 1 && (bx * I.mx + by * I.my) / m > 0.7 && jumpTarget(p, bx, by)) { vk = vaultKind(W.blk[p.bump]); p.vaultT = (p.vaultT || 0) + dt; if (p.vaultT >= (vk === 2 ? 0.2 : 0.06)) { p.vaultT = 0; startJump(p, bx, by); } }
  }
  if (!vk) p.vaultT = 0; else p.edgeK = 3;
  // (round 23, no jump button any more) running at a one-tile gap leaps it; walking up to the edge and pushing still drops you down it
  p.runT = m > 0.6 ? (p.runT || 0) + dt : 0;
  if (!vk && p.edgeWant && m > 0.6 && !p.down && !p.ride && p.runT > 0.35 && p.edgeT <= dt * 1.5) {
    const ax = Math.abs(I.mx), ay = Math.abs(I.my), dx = ax > ay * 1.6 ? Math.sign(I.mx) : 0, dy = ay > ax * 1.6 ? Math.sign(I.my) : 0;
    if (dx || dy) { const t = jumpTarget(p, dx, dy); if (t && t.k === 3) startJump(p, dx, dy); }
  }
  if (p.dropped) emitLocal('land');
  // a jump pad under your feet (round 22): fling yourself the way you're going; the host takes the pad away
  if ((p.padCD = Math.max(0, (p.padCD || 0) - dt)) <= 0 && !p.down && !p.ride && W.blk[ci(Math.floor(p.x), Math.floor(p.y), p.L)] === 56) {
    const t = padTarget(p), px = Math.floor(p.x), py = Math.floor(p.y), pl = p.L; p.padCD = 0.6;
    if (t) { p.jmp = { t: 0, T: 0.5 + t.d * 0.06, x0: p.x, y0: p.y, x1: t.x, y1: t.y, L: t.L, h: 1.2 + t.d * 0.12 + Math.max(0, t.L - p.L) * 0.4, up: t.L - p.L, k: 4 }; emitLocal('jump'); if (typeof act === 'function' && p.i === ME) act('pad', { x: px, y: py, l: pl }); else doAct(p, 'pad', { x: px, y: py, l: pl }); }
  }
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 0.3) p.anim += dt * sp * 2.6; else p.anim = lerp(p.anim, Math.round(p.anim / Math.PI) * Math.PI, Math.min(1, dt * 8));
  p.z = pZ(p);
}
// (round 34d) a thrown grenade only bounces off what is as tall as it is: it sails over rocks, bushes, logs, fences, crates
const NADE_LOW = { 21: 0.45, 27: 0.6, 29: 0.4, 32: 0.6, 39: 0.4, 40: 0.4, 41: 0.6, 26: 0.55, 36: 0.45, 37: 0.74, 25: 0.95 };
function nadeStop(blk, hz) { if (!blk) return false; if (solidFor(blk, 'b') && !NADE_LOW[blk] && !B[blk].low) return true; if (!solidFor(blk, 'b') && !solidFor(blk, 'p')) return false; const h = B[blk].low || NADE_LOW[blk]; return h ? hz < h : true; }
/* ---------- vaulting and jumping (local to each player, like walking) ---------- */
function vaultKind(b) { if (!b) return 0; const Bb = B[b]; if (Bb.vault || b === 27 || b === 29 || b === 26 || b === 32 || b === 37 || b === 21 || b === 39 || b === 40) return 1; /* (round 34d) you hop over rocks, scrap and logs */ if (b === 1 || b === 2 || b === 3 || b === 8 || b === 24 || b === 31 || b === 40) return 2; return 0; }
function jumpTarget(p, dx, dy) {
  const cx = Math.floor(p.x), cy = Math.floor(p.y), L = p.L, ax = cx + dx, ay = cy + dy, bx = cx + 2 * dx, by = cy + 2 * dy;
  if (!inMap(ax, ay)) return null;
  const vk = vaultKind(W.blk[ci(ax, ay, L)]);
  const land = (x, y) => { if (!inMap(x, y)) return -1; for (let l = L; l >= Math.max(0, L - 2); l--) { if (standable(x, y, l, 'p')) return l; if (!enterable(x, y, l, 'p')) return -1; } return -1; };
  if (vk) {
    if (vk === 2 && L + 1 < ML && (W.blk[ci(ax, ay, L + 1)] || W.slab[ci(ax, ay, L + 1)])) return null; // that wall goes up to the ceiling
    const l2 = land(bx, by); if (l2 >= 0) return { x: bx + 0.5, y: by + 0.5, L: l2, T: vk === 2 ? 0.55 : 0.36, h: vk === 2 ? 0.95 : 0.55, k: vk };
    return null;
  }
  // a gap: leap one empty tile to the same floor
  if (enterable(ax, ay, L, 'p') && !standable(ax, ay, L, 'p') && standable(bx, by, L, 'p')) return { x: bx + 0.5, y: by + 0.5, L, T: 0.45, h: 0.55, k: 3 };
  return null;
}
function startJump(p, dx, dy, hop) {
  if (p.jmp || p.down || p.dead || p.medT > 0) return false;
  const t = jumpTarget(p, dx, dy);
  if (!t) { if (!hop) return false; p.jmp = { t: 0, T: 0.34, x0: p.x, y0: p.y, x1: p.x + dx * 0.25 * (standable(Math.floor(p.x + dx * 0.6), Math.floor(p.y + dy * 0.6), p.L, 'p') ? 1 : 0), y1: p.y + dy * 0.25 * (standable(Math.floor(p.x + dx * 0.6), Math.floor(p.y + dy * 0.6), p.L, 'p') ? 1 : 0), L: p.L, h: 0.4, k: 0 }; emitLocal('jump'); return true; }
  p.jmp = { t: 0, T: t.T, x0: p.x, y0: p.y, x1: t.x, y1: t.y, L: t.L, h: t.h + Math.max(0, p.L - t.L) * 0.15, k: t.k };
  emitLocal(t.k === 2 ? 'vault' : 'jump'); return true;
}
// where a jump pad throws you: up to BAL.padDist tiles along your walk (else your aim), the highest floor (up to padUp above) with room to land
function padTarget(p) {
  let ax = p.inp.mx, ay = p.inp.my; if (Math.hypot(ax, ay) < 0.3) { ax = Math.cos(p.aim); ay = Math.sin(p.aim); }
  const m = Math.hypot(ax, ay) || 1; ax /= m; ay /= m;
  const roof = p.L + 1 < ML && !!W.slab[ci(Math.floor(p.x), Math.floor(p.y), p.L + 1)], upMax = roof ? 0 : BAL.padUp;
  let best = null;
  for (let d = BAL.padDist; d >= 1.5; d -= 0.5) {
    const x = Math.floor(p.x + ax * d), y = Math.floor(p.y + ay * d); if (!inMap(x, y) || (x === Math.floor(p.x) && y === Math.floor(p.y))) continue;
    for (let l = Math.min(ML - 2, p.L + upMax); l >= Math.max(0, p.L - 2); l--) {
      if (!standable(x, y, l, 'p')) continue;
      const top = roof ? p.L : Math.max(l, p.L) + 1; let clear = true;
      for (let s = 0.5; s < d && clear; s += 0.5) {
        const xx = Math.floor(p.x + ax * s), yy = Math.floor(p.y + ay * s);
        if (roof) { if (!enterable(xx, yy, p.L, 'p')) clear = false; }
        else if (top < ML && (W.slab[ci(xx, yy, top)] || B[W.blk[ci(xx, yy, top)]].P)) clear = false;
      }
      if (clear && (!best || l > best.L)) best = { x: x + 0.5, y: y + 0.5, L: l, d };   // (round 25) the farthest spot on the highest roof in reach
      break;
    }
  }
  return best;
}
function emitLocal(name) { fxEvent({ k: 'sfx', n: name, local: 1 }); }

/* ---------- player actions (host authoritative) ---------- */
const inAirZ = p => airborne(p) ? p.z : p.pass != null && p.pass >= 0 && airborne(W.p[p.pass]) ? W.p[p.pass].z : null; // (round 30) the real height of someone flying (pilot) or sitting behind a pilot
const shoulder = p => { const az = inAirZ(p); return [p.x, p.y, (az != null ? az : pZ(p)) + (p.down ? 0.25 : 0.72)]; };
function stepActions(p, dt) {
  if (p.gone) return;
  const I = p.inp;
  p.fireCD -= dt; p.shoveCD -= dt; p.emptyT -= dt; if (p.bloom) p.bloom = Math.max(0, p.bloom - dt * 2.2);
  for (let wi = 1; wi < NW; wi++) if (!WPN[wi].inf && p.ammo[wi] > ammoCap(wi)) p.ammo[wi] = ammoCap(wi); // (round 32) backpack: ammo you carry is capped (grows with the upgrade)
  // (round 29) gyrocopter: burns fuel while you're in it; empty → it comes down by itself; touching down gets you out
  if (airborne(p) && p.mform === 1 && !p.evoOn) { // (round 34d) 苍隼 in flight: twice the energy (the other half is the usual mech drain below); low → it comes down; touching down it stands again
    p.bat = Math.max(0, (p.bat || 0) - dt);
    if (p.bat < 10 && !p.land) { p.land = true; emit({ k: 'deny', p: p.i, why: '苍隼电量低，正在降落' }); }
    const g = skyTop(p.x, p.y); if (p.land && p.z - surfZ(p.x, p.y, g) < 0.08 && landOK(p.x, p.y)) { p.mfly = false; p.land = false; p.L = g; p.z = surfZ(p.x, p.y, g); p.alt = 0; emit({ k: 'sfx', n: 'land', x: p.x, y: p.y, o: p.i }); }
  } else if (airborne(p)) {
    p.fuel = Math.max(0, (p.fuel != null ? p.fuel : VEH[p.veh].fuel) - dt);
    if (p.fuel < BAL.fuelLow && !p._lowF) { p._lowF = 1; emit({ k: 'deny', p: p.i, why: '旋翼机油快没了（还剩 ' + Math.ceil(p.fuel) + ' 秒），没油会自己降落' }); }
    if (p.fuel <= 0 && !p.land) { p.land = true; emit({ k: 'deny', p: p.i, why: '旋翼机没油了，正在降落：进楼里按 F 加油' }); }
    const g = skyTop(p.x, p.y); if (p.land && p.z - surfZ(p.x, p.y, g) < 0.08 && landOK(p.x, p.y)) { p.ride = false; p.land = false; p.L = g; p.z = surfZ(p.x, p.y, g); p.alt = 0; emit({ k: 'sfx', n: 'land', x: p.x, y: p.y, o: p.i }); }
  } else { p._lowF = p.fuel < BAL.fuelLow ? p._lowF : 0; if (p.land) p.land = false; }
  if (p.mcd > 0) p.mcd = Math.max(0, p.mcd - dt);
  if (!p.ride && (p.mform || p.mtr || p.mfly)) { p.mform = 0; p.mtr = 0; p.mfly = false; } // off the vehicle (got out, knocked down): it is a vehicle again
  if (p.mtr > 0) { p.mtr -= dt; if (p.mtr <= 0) { p.mtr = 0; p.mform = p.mto || 0; if (p.mform && VEH[p.veh] && VEH[p.veh].fly) { const g = skyTop(p.x, p.y); p.L = g; p.z = surfZ(p.x, p.y, g); p.alt = 0; p.land = false; } } } // (round 34b) a gyrocopter that stood up drops to the ground
  if (p.bat == null) p.bat = BAL.mechBat;
  evoStep(p, dt); /* (round 37) */
  if (inMech(p)) { // the energy runs down while you're a mech; out of it you fold back into the vehicle
    if (!p.evoOn) p.bat = Math.max(0, p.bat - dt); /* (round 37) a beast runs on its 进化 meter instead */
    if (p.bat < BAL.mechLow && !p._lowB) { p._lowB = 1; emit({ k: 'deny', p: p.i, why: '机甲电量低（还剩 ' + Math.ceil(p.bat) + ' 秒），没电会变回载具' }); }
    if (p.bat <= 0) mechEject(p, '机甲没电了，变回载具：电会慢慢充回来，商店里能马上充满');
  } else { if (p.bat >= BAL.mechLow) p._lowB = 0; p.bat = Math.min(BAL.mechBat, p.bat + BAL.batRegen * dt); if (p.mh) for (let v = 1; v < p.mh.length; v++) if (p.mh[v] != null && MECHS[v] && p.mh[v] < MECHS[v].hp) p.mh[v] = Math.min(MECHS[v].hp, p.mh[v] + MECHS[v].hp * BAL.mechRegen * dt); }
  // each gun has its own fire cooldown, and a reload keeps going in the holster (round 18: was one shared timer, swapping cancelled the reload)
  if (!p.cdW) p.cdW = WPN.map(() => 0); if (!p.rlBg) p.rlBg = WPN.map(() => 0);
  if (p.ride && VEH[p.veh] && (inMech(p) ? mechOf(p).noise : VEH[p.veh].noise) && Math.hypot(p.vx, p.vy) > 0.5 && (p.engT = (p.engT || 0) - dt) <= 0) { p.engT = 0.5; noiseAt(p.x, p.y, inMech(p) ? mechOf(p).noise : VEH[p.veh].noise, p.z); } // (round 33) engines are loud in 攻楼 (the bike isn't)
  if (p.ride && VEH[p.veh] && VEH[p.veh].ram && Math.hypot(p.vx, p.vy) > BAL.ramSpd) for (const z of W.zs) { // (round 22) the armoured car shoves zombies aside
    if (z.hp <= 0 || z.L !== p.L || z.hidden || (z.ramT || 0) > W.t) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy) || 0.01;
    if (d < p.r + z.r + 0.3 && dx * p.vx + dy * p.vy > 0) { z.ramT = W.t + BAL.ramCD; const k = ZT[z.k].boss || z.k === 'brute' ? 1 : 5; hurtZombie(z, BAL.ramDmg, p, dx / d * k, dy / d * k); if (k > 1) z.stun = Math.max(z.stun || 0, 0.8); emit({ k: 'sfx', n: 'bash', x: z.x, y: z.y }); }
  }
  { const hv = rideVeh(p) || paxVeh(p); if (hv && hv.heal && !p.down && !p.dead && p.hp < p.maxHp && W.t - (p.hitAt || -9) > 3) p.hp = Math.min(p.maxHp, p.hp + hv.heal * dt); } /* (round 36n) the armoured car is a mobile first-aid post */
  if (p.invT > 0) p.invT -= dt;
  for (let k = 0; k < NW; k++) { if (p.cdW[k] > 0) p.cdW[k] -= dt; if (p.rlBg[k] > 0) { p.rlBg[k] -= dt; if (p.rlBg[k] <= 0) { p.rlBg[k] = 0; reloadInto(p, k); } } }
  if (p.dead) return;
  if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT <= 0) finishReload(p); }
  if (p.medT > 0) {
    p.medT -= dt;
    if (p.medT <= 0) {
      if (p.selfRev) { p.selfRev = false; if (p.down) { p.down = false; p.hp = 40; emit({ k: 'revive', p: p.i, by: p.i }); } }
      else { p.hp = Math.min(p.maxHp, p.hp + BAL.medHeal); emit({ k: 'sfx', n: 'heal', x: p.x, y: p.y }); }
    }
  }
  if (p.down) { p.downT -= dt; if (p.downT <= 0) { p.down = false; p.dead = true; p.reloadT = 0; p.medT = 0; p.ride = false; p.downT = W.phase === 'night' ? BAL.respawnNight : BAL.respawnDay; emit({ k: 'dead', p: p.i, t: p.lives > 0 ? Math.round(p.downT) : -1, n: p.lives || 0 }); checkLose(); return; } }
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  p.gcd = (p.gcd || 0) - dt; if (I.fire && vehGun(p) && vehGun(p) !== 'busy') (vehGun(p) === 'cannon' ? tankFire(p) : vehGun(p) === 'mech' ? mechPunch(p) : gyroFire(p)); // (round 30 / 31) the aircraft's chin gun or the tank's cannon fires instead of your gun
  if (I.fire && !p.build && !vehGun(p) && p.fireCD <= 0 && p.cdW[wi] <= 0 && p.reloadT <= 0 && p.medT <= 0) {
    if (p.mag[wi] > 0) fireWeapon(p, wi);
    else if (w.inf || p.ammo[wi] > 0) startReload(p);
    else if (p.emptyT <= 0) { p.emptyT = 0.5; emit({ k: 'sfx', n: 'empty', x: p.x, y: p.y, o: p.i }); }
  }
  const tgt = I.use ? useTarget(p) : null;
  if (tgt) {
    const key = tgt.k + tgt.i;
    if (p.useK !== key) { p.useK = key; p.useT = 0; }
    p.useT += dt;
    if (p.useT >= tgt.t) { p.useT = 0; p.useK = ''; completeUse(p, tgt); }
  } else { p.useT = 0; p.useK = ''; }
}
// what the player would interact with: revive > search spot > gather tree/rock
function useTarget(p) {
  if (p.down || p.dead) return null;
  for (const q of W.p) if (q !== p && q.down && !q.dead && !q.gone && q.L === p.L && d2(q.x, q.y, p.x, p.y) < 1.5) return { k: 'rev', i: q.i, t: BAL.reviveTime, name: '扶起 ' + q.name };
  for (const q of W.p) if (q !== p && q.dead && !q.gone && p.meds > 0 && q.L === p.L && d2(q.x, q.y, p.x, p.y) < 1.6) return { k: 'rez', i: q.i, t: BAL.rezTime, name: '用医疗包救回 ' + q.name };
  const cargo = p.ride && VEH[p.veh] && VEH[p.veh].search, tk = cargo ? BAL.cargoSearch : 1, R = cargo ? 2 : 1;
  let best = null, bd = cargo ? BAL.cargoReach : 1.45;
  const px = Math.floor(p.x), py = Math.floor(p.y);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const x = px + dx, y = py + dy; if (!inMap(x, y)) continue;
    const i = ci(x, y, p.L), b = W.blk[i]; if (!b) continue;
    const d = d2(x + 0.5, y + 0.5, p.x, p.y);
    if (d > bd) continue;
    if (B[b].turret) { const t = turretUse(p, i, b); if (t) { bd = d; best = t; } } // (round 28) every mode
    else if (B[b].obj) { const t = modeUse(p, i, b); if (t) { bd = d; best = t; } }
    else if (B[b].spot) { const S = SPOTS[B[b].spot]; if (S && (S.vanish || !W.srch.has(i))) { bd = d; best = { k: 'spot', i, t: BAL.searchTime * tk, name: '搜索' + S.name }; } }
    else if (GATHER[b]) { bd = d; best = { k: 'gather', i, t: GATHER[b].t * tk, name: GATHER[b].name }; }
  }
  if (!p.ride && !p.down && !(best && (best.k === 'revive' || best.k === 'rez'))) { const dead = W.p.find(q => q !== p && q.dead && !q.gone && q.lives > 0); const ix = Math.floor(p.x), iy = Math.floor(p.y); // (round 34d) a teammate is waiting to respawn: inside any building or at the camp you can bring them back right here
    if (dead && (houseInterior(ix, iy) || skyTop(p.x, p.y) > p.L || inCamp(p))) best = { k: 'rezhere', i: -1, t: 3, name: '在这里让 ' + dead.name + ' 复活（' + Math.ceil(dead.downT) + ' 秒后会自己回据点）', who: dead.i }; }
  if (!best && !p.ride && ownsVeh(p, 5) && (p.fuel || 0) < VEH[5].fuel - 1 && skyTop(p.x, p.y) > p.L) best = { k: 'fuel', i: -1, t: BAL.refuelT, name: '给旋翼机加油（' + Math.floor(p.fuel || 0) + '/' + VEH[5].fuel + ' 秒）' }; // (round 29) any roofed room refuels the gyrocopter
  return best;
}
function completeUse(p, tgt) {
  if (tgt.k === 'rez') { const q = W.p[tgt.i]; if (!q.dead || p.meds <= 0) return; p.meds--; q.dead = false; q.down = false; q.hp = Math.round(q.maxHp * BAL.rezHp); q.medT = 0; q.selfRev = false; emit({ k: 'revive', p: q.i, by: p.i, rez: 1 }); return; }
  if (tgt.k === 'rev') { const q = W.p[tgt.i]; if (!q.down) return; q.down = false; q.hp = 35; q.medT = 0; q.selfRev = false; emit({ k: 'revive', p: q.i, by: p.i }); return; }
  if (tgt.k === 'tur') { turretDone(p, tgt); return; }
  if (tgt.k === 'rezhere') { const q = W.p.find(q => q !== p && q.dead && !q.gone && q.lives > 0); if (q) respawnP(q, p); return; } // (round 34d)
  if (tgt.k === 'fuel') { p.fuel = VEH[5].fuel; emit({ k: 'sfx', n: 'reload', x: p.x, y: p.y }); return; } // (round 29)
  if (tgt.k === 'obj') { modeDone(p, tgt); return; }
  const i = tgt.i, x = cx_(i), y = cy_(i), L = cl_(i), wx = x + 0.5, wy = y + 0.5, wz = L * FH + 1;
  const m = (1 + Math.min(40, Math.max(0, radioDist(x, y) - 8)) / BAL.lootFar) * (isSiege() ? SIEGE.loot : 1) * (p.ride && VEH[p.veh] && VEH[p.veh].search ? BAL.cargoLoot : 1); // capped where the old 96-map edge was; 尸城求生 pays double
  if (tgt.k === 'gather') {
    const g = GATHER[W.blk[i]]; if (!g) return;
    const n = Math.round(rand(g.n[0], g.n[1]) * (p.ride && VEH[p.veh] && VEH[p.veh].search ? BAL.cargoLoot : 1)); W.res[g.res] += n;
    setCell(i, 0, W.slab[i], null, W.blk[i] === 22 ? 'chop' : 'mine'); taskAdd('gather');
    emit({ k: 'loot', p: p.i, x: wx, y: wy, z: wz, text: '+' + n + ' ' + RES.find(r => r.k === g.res).name });
    return;
  }
  const S = SPOTS[B[W.blk[i]].spot]; if (!S || (!S.vanish && W.srch.has(i))) return;
  // containers are gone once searched (new ones turn up at dawn); cars and machines are marked searched
  if (S.vanish) setCell(i, 0, W.slab[i], null, 'loot'); else { W.srch.add(i); W.ver++; emit({ k: 'spot', i, v: 1 }); }
  taskAdd('search'); if (!inZone(x, y)) taskAdd('far');
  const got = [];
  for (const k in S.loot) { const [a, b] = S.loot[k]; const n = Math.round(rand(a, b) * m); if (n > 0) { W.res[k] += n; got.push('+' + n + ' ' + RES.find(r => r.k === k).name); } }
  if (S.ammo) { for (const q of activeP()) for (let wi = 1; wi < NW; wi++) if (q.owned[wi] || S.allAmmo) q.ammo[wi] += Math.round(WPN[wi].loot * S.ammo * m * (q.owned[wi] ? 1 : 0.5)); got.push(S.allAmmo ? '各种子弹' : '全队弹药'); }
  const bpk = siegeBlueprint(Object.keys(SPOTS).find(k => SPOTS[k] === S), !!S.bp); if (bpk) got.push(bpk);
  if (S.fuel && activeP().some(q => q.owned[5])) { for (const q of activeP()) if (q.owned[5]) q.ammo[5] += Math.round(S.fuel * m); got.push('燃料'); }
  if (S.med && rand() < S.med && p.meds < BAL.medCap) { p.meds++; got.push('医疗包'); }
  if (S.nade && rand() < S.nade) { const t = rand() < 0.4 ? 1 + Math.floor(rand() * 3) : 0, n = S.nade >= 1 ? 2 : 1;           // (round 24) 4 in 10 finds are a special grenade
    if (gCount(p, t) < gCap(t)) { if (t) p.gn[t - 1] = Math.min(BAL.gnCap, p.gn[t - 1] + n); else p.nades = Math.min(BAL.nadeCap, p.nades + n); got.push(GREN[t].name); } }
  if (!got.length) got.push('什么也没有');
  emit({ k: 'loot', p: p.i, x: wx, y: wy, z: wz, text: got.join('  ') });
}
/* ---------- (round 32) permanent tasks: the counters build up over the whole run, every tier reached is a permanent team upgrade ---------- */
// W.perm[k] = { got, tier }, W.perk[upgrade] = level; W.tasks is just what the panel shows (same shape as the old daily tasks, so the sync and save code stay)
function rollTasks() {
  W.perm = W.perm || {}; W.perk = W.perk || { hp: 0, bag: 0, med: 0, nade: 0, life: 0, upg: 0 };
  const rows = [];
  for (const P of PERM) { const q = W.perm[P.k] || (W.perm[P.k] = { got: 0, tier: 0 }); if (q.tier >= P.need.length) continue; const need = P.need[q.tier]; rows.push({ k: P.k, need, got: Math.min(q.got, need), done: 0, txt: P.name + ' ' + need + (P.need.length > 1 ? '（' + (q.tier + 1) + '/' + P.need.length + '）' : ''), rt: PERK[P.perk][0], f: q.got / need }); }
  rows.sort((x, y) => y.f - x.f); W.tasks = rows; W.tkv++; /* (round 36f) every task still open (the list scrolls) */ // the four closest to done: a taller panel pushed the 准备入夜 button into the middle of the screen
}
function grantPerk(k) {
  W.perk[k] = (W.perk[k] || 0) + 1;
  for (const p of W.p) { if (p.gone) continue;
    if (k === 'hp') { p.maxHp = BAL.pMaxHp; if (!p.dead && !p.down) p.hp = Math.min(p.maxHp, p.hp + PERK.hp[1]); }
    if (k === 'life') p.lives = (p.lives || 0) + 1; }
  if (k === 'upg') W.upg = Math.min(BAL.upgMax, W.upg + 1);
  modeSay('永久提升：' + PERK[k][0], '#9fe0ff', true);
}
function taskAdd(k, n = 1) {
  if (!W || W.demo || W.over || NETROLE === 'guest' || !W.perm) return;
  const P = PERM.find(q => q.k === k); if (!P) return; const q = W.perm[k] || (W.perm[k] = { got: 0, tier: 0 });
  q.got += n; let up = false;
  while (q.tier < P.need.length && q.got >= P.need[q.tier]) { q.tier++; grantPerk(P.perk); up = true; }
  if (up || (W.tkN = (W.tkN || 0) + 1) % 3 === 0) rollTasks(); else { const r = W.tasks.find(t => t.k === k); if (r) { r.got = Math.min(q.got, r.need); W.tkv++; } }
}
function oldDailyTaskAdd(k, n = 1) { /* (before round 32) */
  if (!W || W.demo || W.over || NETROLE === 'guest') return;
  for (const t of W.tasks) {
    if (t.k !== k || t.done) continue;
    t.got = Math.min(t.need, t.got + n); W.tkv++;
    if (t.got >= t.need) { t.done = 1; payTask(t); }
  }
}
function payTask(t) {
  const r = t.rw;
  if (r.res) for (const k in r.res) W.res[k] += r.res[k];
  for (const q of activeP()) {
    if (r.ammo) { for (let wi = 1; wi < NW; wi++) if (q.owned[wi]) q.ammo[wi] += WPN[wi].loot * r.ammo; }
    if (r.med) q.meds = Math.min(BAL.medCap, q.meds + r.med);
    if (r.nade) q.nades = Math.min(BAL.nadeCap, q.nades + r.nade);
  }
  if (r.upg) W.upg = Math.min(BAL.upgMax, W.upg + r.upg);
  emit({ k: 'task', txt: t.txt, rt: t.rt });
}
/* ---------- bloaters: a burst that hurts people, zombies and walls ---------- */
function zBlast(x, y, z) {
  const R = BAL.blastR;
  for (const p of W.p) { if (p.gone || p.dead) continue; const d = Math.hypot(p.x - x, p.y - y, (pZ(p) + 0.5 - z) * 0.8); if (d < R) { const f = 1 - d / R; hurtPlayer(p, BAL.blastDmgP * (0.4 + 0.6 * f) * W.D.dmg); knock(p, (p.x - x) / (d || 1) * 6 * f, (p.y - y) / (d || 1) * 6 * f); } }
  for (const zb of W.zs) { if (zb.hp <= 0) continue; const d = Math.hypot(zb.x - x, zb.y - y); if (d < R && Math.abs(zb.z - z) < 1.5) hurtZombie(zb, 70 * (1 - d / R), null, (zb.x - x) / (d || 1) * 4, (zb.y - y) / (d || 1) * 4); }
  const cx = Math.floor(x), cy = Math.floor(y), L = Math.floor(z / FH);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) for (let l = L - 1; l <= L + 1; l++) {
    const xx = cx + dx, yy = cy + dy, d = Math.hypot(dx, dy); if (!inMap(xx, yy) || l < 0 || l >= ML || d > R) continue;
    const i = ci(xx, yy, l); if (W.blk[i] && B[W.blk[i]].brk) damageCell(i, BAL.blastDmgB * (1 - d / (R + 0.6)) * W.D.dmg);
  }
  emit({ k: 'boom', x: r2(x), y: r2(y), z: r2(z), g: 1 });
}
// what turns up between waves / in daylight
function strayKind(n) {
  const r = rand();
  if (n >= 2 && r < 0.08) return 'dog'; if (r < 0.18) return 'crawler'; if (r < 0.26) return 'runner';
  if (n >= 2 && r < 0.31) return 'bloater'; if (n >= 3 && r < 0.34) return 'spitter'; if (n >= 4 && r < 0.37) return 'armored'; return 'walker';
}
/* ---------- daily restock of searchable containers ---------- */
const SPOT_IDS = { crate: 26, rubble: 29, trash: 32, backpack: 33, cabinet: 34, toolbox: 35, milcrate: 36, barrel: 37, ammobox: 54 };
function spotCount() { const c = {}; for (let i = 0; i < NC; i++) { const s = B[W.blk[i]].spot; if (s) c[s] = (c[s] || 0) + 1; } return c; }
function spotFree(x, y, L) {
  if (!inMap(x, y) || L < 0 || L >= ML) return false;
  const i = ci(x, y, L); if (W.blk[i] || !support(x, y, L) || W.tt[y * MW + x] === TT.water) return false;
  if (radioDist(x, y) <= BUILD_R + 1) return false;
  for (const p of W.p) if (Math.floor(p.x) === x && Math.floor(p.y) === y) return false;
  return true;
}
function pickSpot(kind, out) {
  for (let tries = 0; tries < 400; tries++) {
    let x, y, L;
    const indoor = !out && (kind === 'cabinet' || ((kind === 'rubble' || kind === 'toolbox' || kind === 'crate' || kind === 'ammobox') && rand() < 0.4));
    if (indoor) {
      const H = TOWN_HOUSES[Math.floor(rand() * TOWN_HOUSES.length)];
      x = H[0] + 1 + Math.floor(rand() * (H[2] - H[0] - 1)); y = H[1] + 1 + Math.floor(rand() * (H[3] - H[1] - 1));
      L = Math.floor(rand() * Math.max(1, H[4])); if (L > 0 && !W.slab[ci(x, y, L)]) L = gAt(x, y);
      if (kind === 'cabinet' && !DIRS.some(([dx, dy]) => { const b = blkAt(x + dx, y + dy, L); return b === 24 || b === 2 || b === 1; })) continue; // against a wall
    } else {
      x = Math.floor(rand() * MW); y = Math.floor(rand() * MH); L = gAt(x, y);
      const t = W.tt[y * MW + x];
      if (kind === 'trash') { if (t === TT.road || !DIRS.some(([dx, dy]) => inMap(x + dx * 2, y + dy * 2) && (W.tt[(y + dy) * MW + x + dx] === TT.road || W.tt[(y + dy * 2) * MW + x + dx * 2] === TT.road))) continue; }
      else if (t === TT.road) continue;
      if (kind === 'milcrate' && radioDist(x, y) < 34) continue;
      if (kind === 'backpack' && t !== TT.forest && t !== TT.grass && t !== TT.hill && t !== TT.meadow && t !== TT.rocky) continue;
    }
    if (spotFree(x, y, L)) return ci(x, y, L);
  }
  return -1;
}
function restockSpots(initial) {
  const c = spotCount();
  for (const k in SPOT_IDS) {
    let need = Math.max(SPOTS[k].n || 0, (W.spotN && W.spotN[k]) || 0) - (c[k] || 0); // back up to the day-one amount
    while (need-- > 0) { const i = pickSpot(k); if (i < 0) break; if (initial) { W.blk[i] = SPOT_IDS[k]; W.bhp[i] = 1; } else setCell(i, SPOT_IDS[k], W.slab[i], null, 'spawn'); }
  }
}
function startReload(p) {
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (p.reloadT > 0 || p.mag[wi] >= w.mag || (!w.inf && p.ammo[wi] <= 0)) return;
  p.reloadT = w.reload; p.reloadW = wi; emit({ k: 'sfx', n: 'reload', x: p.x, y: p.y, o: p.i });
}
function finishReload(p) { reloadInto(p, p.reloadW); }
function reloadInto(p, wi) { const w = WPN[wi], need = w.mag - p.mag[wi], take = w.inf ? need : Math.min(need, p.ammo[wi]); p.mag[wi] += take; if (!w.inf) p.ammo[wi] -= take; }
// aim direction from the shoulder to the aim point (or level along the facing)
function aimDir(p) {
  const [sx, sy, sz] = shoulder(p);
  let tx, ty, tz;
  if (p.aimPt) { tx = p.aimPt.x; ty = p.aimPt.y; tz = p.aimPt.z; } else { tx = sx + Math.cos(p.aim) * 5; ty = sy + Math.sin(p.aim) * 5; tz = sz; }
  let dx = tx - sx, dy = ty - sy, dz = tz - sz; const hl = Math.hypot(dx, dy);
  if (hl < 0.4) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); dz = 0; }
  const L = Math.hypot(dx, dy, dz); return [dx / L, dy / L, dz / L];
}
function fireWeapon(p, wi) {
  const w = WPN[wi], rk = rideK(p); if (p.cdW) p.cdW[wi] = w.rate * rk.rate; else p.fireCD = w.rate * rk.rate; p.mag[wi]--;
  noiseAt(p.x, p.y, SIEGE.gunNoise[w.k] || SIEGE.noiseR, p.z);
  const [sx, sy, sz] = shoulder(p), [ax, ay, az] = aimDir(p);
  const yaw = Math.atan2(ay, ax), pitch = Math.asin(clamp(az, -1, 1));
  const mul = (1 + 0.12 * W.upg) * (rideVeh(p) && rideVeh(p).rideDmg || 1), ends = []; /* (round 36n) 骑射: +15% on the bike */
  if (w.gl) { // launcher: an explosive shell on a flat arc that bursts on whatever it touches
    const v = 17; W.proj.push({ k: 'gl', ox: p.x, oy: p.y, x: sx + ax * 0.45, y: sy + ay * 0.45, z: sz, vx: Math.cos(pitch) * Math.cos(yaw) * v, vy: Math.cos(pitch) * Math.sin(yaw) * v, vz: Math.sin(pitch) * v + 1.2, o: p.i, t: 2.6 });
    emit({ k: 'shot', o: p.i, w: wi, e: [] }); return;
  }
  if (w.flame) { // a cone of fire: everything in front, in range and in sight catches fire
    for (const z of W.zs) {
      if (z.hp <= 0 || Math.abs(z.L - p.L) > 1) continue;
      const dx = z.x - sx, dy = z.y - sy, d = Math.hypot(dx, dy); if (d > w.range + z.r) continue;
      if (Math.abs(angDiff(yaw, Math.atan2(dy, dx))) > w.spread + z.r / Math.max(d, 0.5)) continue;
      if (!los(sx, sy, sz, z.x, z.y, z.z + z.h * 0.5, LEAN)) continue;
      hurtZombie(z, w.dmg * mul, p, 0, 0, true); z.burn = Math.max(z.burn || 0, w.burn); z.burnBy = p.i;
    }
    modeAreaHit(sx + Math.cos(yaw) * w.range * 0.5, sy + Math.sin(yaw) * w.range * 0.5, w.range * 0.5, w.dmg * mul * 0.8);
    emit({ k: 'shot', o: p.i, w: wi, e: [] }); return;
  }
  if (w.bloom) p.bloom = Math.min(2.2, (p.bloom || 0) + w.bloom);
  for (let k = 0; k < w.pellets; k++) {
    const sp = w.spread * rk.spread * (p.down ? 1.6 : 1) * (1 + (w.bloom ? p.bloom : 0)) * (p.inp.auto ? p.inp.auto : 1); // auto-aim fires looser
    const yw = yaw + (rand() - 0.5) * 2 * sp, pt = pitch + (rand() - 0.5) * sp;
    const dx = Math.cos(pt) * Math.cos(yw), dy = Math.cos(pt) * Math.sin(yw), dz = Math.sin(pt);
    const wall = rayWorld(sx, sy, sz, dx, dy, dz, w.range, { lean: LEAN });
    const hits = [];
    for (const z of W.zs) {
      if (z.hp <= 0) continue;
      const d = rayBox(sx, sy, sz, dx, dy, dz, z.x - z.r, z.y - z.r, z.z, z.r * 2, z.r * 2, z.h, wall.d);
      if (d >= 0) hits.push([d, z]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    let left = w.pierce || 1, endD = wall.d, hz = 0;
    for (const [d, z] of hits) {
      if (left <= 0) break;
      const hzv = sz + dz * d, head = hzv > z.z + z.h * 0.76;
      let dmg = w.dmg * mul * (head ? (w.hs || BAL.headshot) : 1);
      if (w.falloff) dmg *= d < 3 ? 1 : Math.max(0.35, 1 - (d - 3) / (w.range - 3) * 0.65); // shotgun: brutal up close
      let armor = false;
      if (ZT[z.k].armor && !(w.pierce >= 3) && Math.cos(angDiff(z.face, Math.atan2(-dy, -dx))) > 0.2) { dmg *= ZT[z.k].armor; armor = true; } // riot gear: only piercing shots or a flank get through
      const heavy = z.k === 'boss' ? 6 : z.k === 'brute' ? 3 : z.k === 'armored' ? 2 : 1;
      hurtZombie(z, dmg, p, dx * w.kick / heavy, dy * w.kick / heavy);
      if (w.stun && !armor) z.stun = Math.max(z.stun || 0, w.stun / heavy);
      if (w.pin) z.stun = Math.max(z.stun || 0, w.pin / (heavy > 2 ? 3 : 1));
      if (k < 3 || head) emit({ k: 'hit', x: r2(sx + dx * d), y: r2(sy + dy * d), z: r2(hzv), h: head ? 1 : 0, g: z.k === 'spitter' || z.k === 'bloater' ? 1 : 0, a: armor ? 1 : 0 });
      left--; endD = d; hz = 1;
    }
    if (left > 0 || !hz) { endD = wall.d; if (wall.i >= 0 && W.blk[wall.i] === 44) modeHit(wall.i, w.dmg * mul * (w.falloff ? 0.7 : 1)); if (wall.i >= 0 && redBarrel(wall.i)) barrelBoom(wall.i, p); }
    ends.push([r2(sx + dx * endD), r2(sy + dy * endD), r2(sz + dz * endD), !hz && wall.i >= 0 ? 1 : 0]);
  }
  emit({ k: 'shot', o: p.i, w: wi, e: ends });
}
function hurtZombie(z, dmg, p, kx, ky, quiet) {
  if (z.hp <= 0 || z.hidden) return;
  if (dmg > 0 && z.xpT > 0) dmg *= BAL.xposeMul; /* (round 36l) 破绽: an opening doubles the damage */ if (dmg > 0 && z.ks && z.kt === 1) z.ks.dm = (z.ks.dm || 0) + dmg; if (dmg > 0 && z.es) z.es.dm = (z.es.dm || 0) + dmg;
  if (dmg > 0 && W.wardens && W.wardens.length) { const w = shieldFor(z, p); if (w) { // (round 35) inside a 护盾者's bubble: the bubble takes it first
    const a = Math.min(w.sh, dmg); w.sh -= a; dmg -= a; if (kx || ky) { kx *= 0.3; ky *= 0.3; }
    if (!(W.shFx > W.t)) { W.shFx = W.t + 0.12; emit({ k: 'elx', a: 'shhit', id: w.id, x: r2(z.x), y: r2(z.y), z: r2(z.z + z.h * 0.6) }); }
    if (w.sh <= 0) { w.sh = 0; w.shT = ZT.warden.elite.cd; emit({ k: 'elx', a: 'break', id: w.id, x: r2(w.x), y: r2(w.y), z: r2(w.z) }); zExpose(w, 2.0, 'break'); } /* (round 36l) a broken bubble leaves it open */
    if (dmg <= 0) return; } }
  if (z.ck && dmg > 0) { z.ck = 0; z.ckT = 3; emit({ k: 'elx', a: 'reveal', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); } // (round 35) a hit shows the 隐身者
  if (z.sleep) { if (dmg >= z.hp) z.sleep = 0; else siegeWake(z); } // killed in its sleep: nobody else hears it
  z.hp -= dmg; if (!quiet) z.hitT = 0.12;
  if (kx || ky) { z.kbx = (z.kbx || 0) + kx; z.kby = (z.kby || 0) + ky; }
  if (z.hp <= 0) killZombie(z, p);
}
let KSRC = '';
function killZombie(z, p) {
  z.hp = 0; W.kills++; if (p) p.kills++; if (z.mins && z.mins.length) for (const o of W.zs) if (o.hp > 0 && z.mins.includes(o.id)) { o.mins = null; killZombie(o, null); } /* (round 36l) the ones a 唤尸者 raised drop with it */ if (p && inMech(p)) { p.bat = Math.min(BAL.mechBat, (p.bat || 0) + 1.5); evoGainKill(p, z); } // (round 36) a mech recharges a little on every kill
  taskAdd('kill'); if (ZT[z.k].boss || ZT[z.k].elite || z.k === 'brute' || z.k === 'armored') taskAdd('elite'); if (KSRC === 'nade') taskAdd('nade'); // (round 32) permanent task counters
  if (ZT[z.k].blast) zBlast(z.x, z.y, z.z + 0.5);
  emit({ k: 'zdie', x: r2(z.x), y: r2(z.y), z: r2(z.z), t: z.k, f: r2(z.face), id: z.id, gz: ZT[z.k].fly ? r2(skyTop(z.x, z.y) * FH) : undefined }); // (round 35) gz: where a shot bird lands
  if (ZT[z.k].elite) { W.res.parts += 6; W.res.steel += 4; for (const q of activeP()) { const t = Math.floor(rand() * 3); q.gn = q.gn || [0, 0, 0]; if (q.gn[t] < BAL.gnCap) q.gn[t]++; } emit({ k: 'loot', p: -1, x: z.x, y: z.y, z: z.z + z.h, text: '能力者倒下：+6 零件 +4 钢材 +1 特殊手雷' }); } // (round 35)
  else if (ZT[z.k].kaiju) { W.res.parts += 20; W.res.steel += 12; emit({ k: 'loot', p: -1, x: z.x, y: z.y, z: z.z + z.h, text: '+20 零件 +12 钢材' }); } // (round 34)
  else if (rand() < (z.k === 'boss' ? 1 : z.k === 'brute' ? 0.6 : 0.07)) { const n = z.k === 'boss' ? 15 : z.k === 'brute' ? 3 : 1; W.res.parts += n; emit({ k: 'loot', p: -1, x: z.x, y: z.y, z: z.z + z.h, text: '+' + n + ' 零件' }); }
}
function hurtPlayer(p, dmg, src) {
  if (p.gone || p.dead || (p.invT || 0) > 0) return; // invT: just respawned
  if (src && src.k && ZT[src.k] && (ZT[src.k].kaiju || ZT[src.k].elite) && !inMech(p)) dmg *= BAL.bigFoot; // (round 36) kaiju / 能力者 hit people on foot softer (they're tuned against mechs)
  if (W.phase === 'day' && src && src.k && ZT[src.k]) dmg *= BAL.day.dmg; // (round 36b) softer bites by day
  if (DBG && DBG.god) return;
  if (p.evoOn && inMech(p)) { if (p.spinT > 0) return; if (p.veh === 1 && rand() < 0.35) { emit({ k: 'dodge', p: p.i, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); return; } } /* (round 37) 玄龟 spinning: untouchable; 青蛇: slips away */
  for (const q of W.p) if (q !== p && q.evoOn && q.veh === 4 && inMech(q) && !q.gone && !q.dead && Math.hypot(q.x - p.x, q.y - p.y) < BAL.evoAura) { dmg *= BAL.evoAuraMul; break; } /* (round 37) 玄甲 aura */
  if (inMech(p)) { // (round 34b) the hull takes the hit (by how armoured that mech is); a little still gets through to you; at zero it falls back into a vehicle
    const M = mechOf(p); p.mh = p.mh || []; p.mh[p.veh] = Math.max(0, mhpOf(p) - dmg * M.armor); emit({ k: 'phurt', p: p.i, d: 0 });
    if (p.mh[p.veh] <= 0) mechEject(p, M.name + '的装甲被打穿了，变回载具：装甲会慢慢恢复，商店里能马上修好');
    dmg *= BAL.mechPass; if (dmg < 0.5) return;
  }
  if (p.ride && VEH[p.veh] && VEH[p.veh].armor) dmg *= VEH[p.veh].armor;                                   // (round 22) inside the armoured car
  else if (paxVeh(p) && paxVeh(p).armor && paxVeh(p).port) dmg *= paxVeh(p).armor; /* (round 36n) the armoured car's back seat is inside the armour too */
  { const bv = rideVeh(p); if (bv && bv.dodge && Math.hypot(p.vx || 0, p.vy || 0) > 1.5 && rand() < bv.dodge) { emit({ k: 'dodge', p: p.i, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); return; } } /* (round 36n) 自行车 闪避 */
  if (src && p.shield && p.melee === 1 && !p.down && !p.ride && Math.cos(angDiff(p.aim, Math.atan2(src.y - p.y, src.x - p.x))) > BAL.shieldCos) { // riot shield out: hits from the front lose half
    dmg *= 1 - BAL.shieldBlock; emit({ k: 'sfx', n: 'clank', x: p.x, y: p.y });
  }
  if (p.down) { p.downT -= dmg * 0.18; p.hurtT = 0.3; emit({ k: 'phurt', p: p.i, d: 1 }); return; }
  p.hp -= dmg; p.hurtT = 0.3; p.hitAt = W.t; emit({ k: 'phurt', p: p.i, d: Math.round(dmg) });
  if (p.hp <= 0) { p.hp = 0; p.down = true; p.ride = false; p.pass = -1; for (const q of W.p) if (q.pass === p.i) q.pass = -1; if (W.phase === 'night') W.clean = false; p.downT = activeP().length > 1 ? BAL.downTime : BAL.soloDownTime; p.reloadT = 0; p.medT = 0; p.build = false; emit({ k: 'down', p: p.i }); checkLose(); }
}
function knock(p, kx, ky) { if (p.i === ME && NETROLE !== 'guest') { p.kbx += kx; p.kby += ky; } else emit({ k: 'kb', p: p.i, x: r2(kx), y: r2(ky) }); }
// a teammate on a motorbike with the back seat free, close enough to climb on
const vehSeats = d => !!(VEH[d.veh] && VEH[d.veh].seats);
const ownsVeh = (p, v) => !!((p.vehs || 0) >> v & 1) || (!p.vehs && v >= 1 && p.veh === v); // vehs = owned bitmask; a bare veh (older state) counts as owned
function pillionFor(p) { return W.p.find(d => d !== p && d.ride && vehSeats(d) && !d.dead && !d.down && !d.gone && (airborne(d) ? Math.abs(d.z - (p.z != null ? p.z : pZ(p))) < 2 : Math.abs(d.L - p.L) <= 1) && Math.hypot(d.x - p.x, d.y - p.y) < 2.6 && !W.p.some(q => q.pass === d.i)) || null; } // (round 26) 1.8 → 2.6 tiles, a step up/down is fine
// (round 24) how many times each player may come back: difficulty, plus a bit more in the long modes
function livesFor(diff, mode) { return (BAL.lives[diff] != null ? BAL.lives[diff] : BAL.lives.normal) + (mode === 'classic' || mode === 'siege' ? BAL.livesLong : 0); }
function respawnP(p, at) {
  if (!(p.lives > 0)) return; p.lives--;
  let x = W.radio.x - 0.5 + p.i * 2, y = W.radio.y + 0.5, L = gAt(W.radio.x, W.radio.y);
  if (at) { // (round 34d) a teammate brought you back where they stand (in a building / at the camp): the free tile next to them
    let spot = null; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const cx = Math.floor(at.x) + dx, cy = Math.floor(at.y) + dy; if (inMap(cx, cy) && standable(cx, cy, at.L, 'p') && (dx || dy)) { spot = [cx + 0.5, cy + 0.5]; break; } }
    const [sx, sy] = spot || [at.x, at.y]; p.dead = false; p.down = false; p.downT = 0; p.invT = BAL.respawnInv; p.hp = Math.round(p.maxHp * BAL.respawnHp); p.x = sx; p.y = sy; p.L = at.L; p.z = surfZ(sx, sy, at.L); p.vx = p.vy = 0;
    emit({ k: 'tp', p: p.i, x: p.x, y: p.y, l: p.L }); emit({ k: 'respawn', p: p.i, near: at.i }); return;
  }
  // (round 24) back at the base (the camp / start point), on the nearest free tile; was next to a living teammate
  const bx = W.radio.x, by = W.radio.y; let done = false;
  for (let r = 1; r <= 6 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !inMap(bx + dx, by + dy)) continue; const l = gAt(bx + dx, by + dy); if (!standable(bx + dx, by + dy, l, 'p') || W.zs.some(z => z.hp > 0 && Math.hypot(z.x - bx - dx - 0.5, z.y - by - dy - 0.5) < 1.2)) continue; x = bx + dx + 0.5; y = by + dy + 0.5; L = l; done = true; }
  const mate = null;
  p.dead = false; p.down = false; p.downT = 0; p.invT = BAL.respawnInv; p.hp = Math.round(p.maxHp * BAL.respawnHp); p.x = x; p.y = y; p.L = L; p.z = surfZ(x, y, L); p.vx = p.vy = 0;
  emit({ k: 'tp', p: p.i, x: p.x, y: p.y, l: p.L }); emit({ k: 'respawn', p: p.i, near: mate ? mate.i : -1 });
  for (const z of W.zs) { if (z.hp <= 0 || z.L !== p.L) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d < 4) { z.kbx += dx / (d || 1) * 9; z.kby += dy / (d || 1) * 9; z.stun = Math.max(z.stun || 0, 1.5); } } // (round 34d) a shockwave clears the spot you come back on
}
function checkLose() {
  if (W.over) return;
  const act = activeP(); if (!act.length) return;
  if (act.some(standingP)) return;
  if (act.some(p => p.down && (p.meds > 0 || p.selfRev || p.lives > 0))) return;
  if (act.some(p => p.dead && p.lives > 0)) return;                                       // (round 24) somebody will respawn at the base
  endGame('lose', act.length > 1 ? '所有人都倒下了' : '你倒下了');
}
function endGame(kind, why) {
  if (W.over || W.demo) return;
  W.over = kind; W.phase = kind;
  lsSet('best', Math.max(lsGet('best', 0), kind === 'win' ? W.night : W.night - 1));
  if (NETROLE !== 'guest') clearSave(); // the run is over
  emit({ k: 'over', v: kind, why, n: W.night, kills: W.kills, pk: W.p.map(p => p.kills), built: W.stats.built });
}

/* ---------- discrete actions ---------- */
function doAct(p, a, v) {
  if (!W || W.over || p.gone || p.dead) return;
  switch (a) {
    case 'ride': if (!p.down && !p.dead) {
      if (p.pass != null && p.pass >= 0) { const d = W.p[p.pass]; if (airborne(d) && d.z - surfZ(d.x, d.y, skyTop(d.x, d.y)) > 0.5) { emit({ k: 'deny', p: p.i, why: '在天上不能跳下去：等驾驶员降落（落地后自动下来）' }); break; } p.pass = -1; offSeat(p, d); emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); break; }     // hop off the back
      if (airborne(p)) { if (!p.land) { p.land = true; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); } break; } // (round 29) in the air: T / F brings it down, you get out on touchdown
      if (v >= 1 && ownsVeh(p, v)) { if (VEH[v].fly && !flyOK(p)) break; if (VEH[v].outdoor && skyTop(p.x, p.y) > p.L) { emit({ k: 'deny', p: p.i, why: VEH[v].name + '太大，只能在室外开' }); break; } p.land = false; p.veh = v; p.ride = true; p.build = false; if (!vehSeats(p)) for (const q of W.p) if (q.pass === p.i) q.pass = -1; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); break; }
      const d = pillionFor(p);
      if (d && !p.ride) { p.pass = d.i; p.build = false; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); emit({ k: 'pillion', p: p.i, d: d.i }); break; } // get on behind a teammate
      if (!ownsVeh(p, p.veh)) p.veh = [4, 2, 3, 1, 5].find(k => ownsVeh(p, k)) || 0;
      if (p.veh && !p.ride && VEH[p.veh].fly && !flyOK(p)) break;
      if (p.veh && !p.ride && VEH[p.veh].outdoor && skyTop(p.x, p.y) > p.L) { emit({ k: 'deny', p: p.i, why: VEH[p.veh].name + '太大，只能在室外开' }); break; }
      if (p.veh) { p.land = false; p.ride = !p.ride; p.mform = 0; p.mtr = 0; if (p.ride) p.build = false; else for (const q of W.p) if (q.pass === p.i) q.pass = -1; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); }
    } break;
    case 'reload': if (!p.down) startReload(p); else if (p.mag[0] < WPN[0].mag) { p.reloadT = WPN[0].reload; p.reloadW = 0; } break;
    case 'wpn': if (!p.down && v >= 0 && v < NW && p.owned[v] && p.wpn !== v) {
      if (!p.rlBg) p.rlBg = WPN.map(() => 0); const o = p.wpn, ow = WPN[o];
      if (p.reloadT > 0 && p.reloadW === o) p.rlBg[o] = p.reloadT;                                    // the reload you started carries on in the holster
      else if (p.mag[o] < ow.mag && (ow.inf || p.ammo[o] > 0)) p.rlBg[o] = ow.reload;               // (round 33) any gun that isn't full reloads itself in the holster while you use the other
      p.wpn = v; p.reloadT = 0; if (p.rlBg[v] > 0) { p.reloadT = p.rlBg[v]; p.reloadW = v; p.rlBg[v] = 0; } // back to a gun that was reloading: pick up where it was
      else if (p.mag[v] === 0) startReload(p);                                                       // (round 33) drew an empty gun: it starts reloading at once
      p.fireCD = Math.max(p.fireCD, 0.2); emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); } break;
    case 'knife': if (p.melee === 1 && p.shield) bash(p, v); else knife(p, typeof v === 'number' ? v : -1); break;
    case 'melee': p.melee = v === 1 && p.shield ? 1 : 0; break;
    case 'nade': if (inMech(p)) mechSkill(p, v); else throwNade(p, v); break; // (round 34) in a mech the grenade key is its skill
    case 'med':
      if (p.medT > 0 || p.meds <= 0) break;
      if (p.down) { p.meds--; p.medT = 3; p.selfRev = true; emit({ k: 'sfx', n: 'med', x: p.x, y: p.y }); }
      else if (p.hp < p.maxHp) { p.meds--; p.medT = BAL.healTime; emit({ k: 'sfx', n: 'med', x: p.x, y: p.y }); }
      break;
    case 'ready': p.ready = !!v; checkReady(); break;
    case 'craft': doCraft(p, v); break;
    case 'build': doBuild(p, v.x, v.y, v.l, v.b, v.d); break;
    case 'demo': doDemolish(p, v.x, v.y, v.l); break;
    case 'crush': if (inMech(p) && typeof v === 'number' && v >= 0 && v < NC && MECH_CRUSH.has(W.blk[v]) && !(W.mine && W.mine.has(v)) && Math.hypot(cx_(v) + 0.5 - p.x, cy_(v) + 0.5 - p.y) < 2.6) { const r = B[W.blk[v]].res, g = GATHER[W.blk[v]]; if (p.veh === 3 && g) { mechScar(v, null, null, BAL.workerRegrow); const n = Math.max(1, Math.round(rand(g.n[0], g.n[1]) * BAL.workerGather)); W.res[g.res] += n; taskAdd('gather'); emit({ k: 'loot', p: p.i, x: cx_(v) + 0.5, y: cy_(v) + 0.5, z: cl_(v) * FH + 1, text: '+' + n + ' ' + RES.find(q => q.k === g.res).name }); setCell(v, 0, W.slab[v], null, 'mine'); } /* (round 36) 工蜂's passive: what it flattens is gathered (and so doesn't grow back) */ else { mechScar(v); setCell(v, 0, W.slab[v], null, 'brk'); if (r && rand() < 0.5) W.res[r] = (W.res[r] || 0) + 1; } emit({ k: 'sfx', n: 'bash', x: cx_(v) + 0.5, y: cy_(v) + 0.5 }); } break; // (round 34d) a mech flattens what is in its way
    case 'xform': { if (p.mtr > 0) break; if (v === 'veh') { if (p.mform === 1) { devolve(p); startXform(p, 0); } break; } /* (round 37) hold X: straight back to the vehicle */
      if (p.evoOn) { devolve(p); break; } if (p.mform === 1 && (p.evo || 0) >= 100 && EVO[p.veh]) { evolve(p); break; } /* tap X: a full meter evolves the mech; in beast form it turns back */
      const to = p.mform === 1 ? 0 : 1, why = xformDeny(p, to); if (why) emit({ k: 'deny', p: p.i, why }); else startXform(p, to); } break; // (round 34b)
    case 'vdef': if (v >= 1 && ownsVeh(p, v) && p.ride && v !== p.veh && (p.mform === 1 || p.mtr > 0)) { emit({ k: 'deny', p: p.i, why: '先变回载具再换车' }); break; } if (v >= 1 && ownsVeh(p, v) && p.ride && VEH[v].outdoor && v !== p.veh && skyTop(p.x, p.y) > p.L) { emit({ k: 'deny', p: p.i, why: VEH[v].name + '太大，只能在室外开' }); break; } if (v >= 1 && ownsVeh(p, v) && p.ride && (airborne(p) || VEH[v].fly) && v !== p.veh) { emit({ k: 'deny', p: p.i, why: airborne(p) ? '先落地再换车' : '先下车，再坐旋翼机起飞' }); break; } if (v >= 1 && ownsVeh(p, v)) { p.veh = v; if (p.ride && !vehSeats(p)) for (const q of W.p) if (q.pass === p.i) q.pass = -1; } break; // pick the default vehicle (switches the one you're on too)
    case 'pad': if (v && inMap(v.x, v.y) && v.l >= 0 && v.l < ML) { const i = ci(v.x, v.y, v.l); if (W.blk[i] === 56) { setCell(i, 0, W.slab[i], null, 'demo'); emit({ k: 'sfx', n: 'jump', x: v.x + 0.5, y: v.y + 0.5 }); } } break;
    case 'mode': p.build = !!v; break;
  }
}
/* ---------- knife: auto-targets the best zombie within reach, lunges onto it and slashes ---------- */
// dir: the way you're facing / walking; a zombie must be in sight, on (about) your level and within knifeRange
function knifeTarget(p, dir) {
  const [sx, sy, sz] = shoulder(p), f = dir != null ? dir : p.aim; let best = null, bs = 1e9;
  for (const z of W.zs) {
    if (z.hp <= 0 || Math.abs(z.z - p.z) > 0.9) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > BAL.knifeRange + z.r) continue;
    const score = d + Math.abs(angDiff(f, Math.atan2(dy, dx))) * 0.6;
    if (score < bs && los(sx, sy, sz, z.x, z.y, z.z + z.h * 0.5, 0)) { bs = score; best = z; }
  }
  return best;
}
// (round 23) riot shield bash: shove everything in front of you back and stun it (dir = where the client faced)
function bash(p, dir) {
  if (p.down || p.build || p.medT > 0 || (p.knCDh || 0) > W.t) return;
  p.knCDh = W.t + BAL.bashCD * 0.8; p.knT = 0.3;
  const f = dir && dir.a != null ? +dir.a : p.aim, [sx, sy, sz] = shoulder(p); p.aim = f;
  const hit = W.zs.filter(z => z.hp > 0 && !z.hidden && Math.abs(z.z - p.z) < 0.9).map(z => ({ z, dx: z.x - p.x, dy: z.y - p.y })).map(o => (o.d = Math.hypot(o.dx, o.dy) || 0.01, o))
    .filter(o => o.d < BAL.bashR + o.z.r && (o.d < p.r + o.z.r + 0.1 || Math.cos(angDiff(f, Math.atan2(o.dy, o.dx))) > BAL.bashCos) && los(sx, sy, sz, o.z.x, o.z.y, o.z.z + o.z.h * 0.5, 0))
    .sort((a, b) => a.d - b.d).slice(0, BAL.bashMax);
  for (const { z, dx, dy, d } of hit) {
    const heavy = ZT[z.k].boss ? 0.15 : z.k === 'brute' ? 0.35 : 1;
    z.stun = Math.max(z.stun || 0, BAL.bashStun * Math.max(heavy, 0.4)); if (z.sleep) siegeWake && siegeWake(z);
    hurtZombie(z, BAL.bashDmg * (1 + 0.1 * W.upg), p, dx / d * BAL.bashKB * heavy, dy / d * BAL.bashKB * heavy);
  }
  if (hit.length) taskAdd('shove', hit.length);
  emit({ k: 'sbash', p: p.i, n: hit.length, x: r2(p.x + Math.cos(f) * 0.8), y: r2(p.y + Math.sin(f) * 0.8), z: r2(p.z + 0.9) });
}
function knife(p, zid) {
  if (p.down || p.build || p.medT > 0 || (p.knCDh || 0) > W.t) return;
  p.knCDh = W.t + BAL.knifeCD * 0.8; p.knT = 0.28;
  // the client picked the target and lunged; trust it if it's still in reach (a little slack for lag), else pick here
  let z = zid >= 0 ? W.zs.find(q => q.id === zid && q.hp > 0) : null;
  if (z && Math.hypot(z.x - p.x, z.y - p.y) > BAL.knifeRange + BAL.knifeLunge * 0.6 + z.r) z = null;
  if (!z) { z = knifeTarget(p); if (z && Math.hypot(z.x - p.x, z.y - p.y) > z.r + p.r + 0.9) z = null; } // no lunge happened: only what's in arm's reach
  if (!z) { modeAreaHit(p.x + Math.cos(p.aim), p.y + Math.sin(p.aim), 0.9, BAL.knifeDmg * 1.3); emit({ k: 'knife', p: p.i, n: 0 }); return; }
  const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy) || 1;
  const back = Math.cos(angDiff(z.face || 0, Math.atan2(-dy, -dx))) < -0.2;          // it was facing away from you
  const heavy = z.k === 'boss' ? 0 : z.k === 'brute' ? 0.25 : 1;
  let dmg = BAL.knifeDmg * (1 + 0.12 * W.upg) * (back ? BAL.knifeBack : 1);
  if (ZT[z.k].armor && !back) dmg *= ZT[z.k].armor;                                     // riot gear: go round the back
  if (z.sleep && !ZT[z.k].boss) dmg = z.hp + 1;                                          // 尸城求生: a sleeper dies to one quiet stab
  z.stun = Math.max(z.stun || 0, 0.4 * Math.max(heavy, 0.3));
  hurtZombie(z, dmg, p, dx / d * BAL.knifeKB * heavy, dy / d * BAL.knifeKB * heavy);
  taskAdd('shove', 1);
  emit({ k: 'knife', p: p.i, n: 1, x: r2(z.x), y: r2(z.y), z: r2(z.z + z.h * 0.6), b: back ? 1 : 0, g: z.k === 'spitter' ? 1 : 0 });
}
// (round 23) v = {x, y, z}: where it should land (the player picked it, or the auto pick for the biggest bunch); else along the aim
function throwNade(p, v) {
  const t = v && v.t >= 1 && v.t <= 3 ? v.t | 0 : 0;                                     // (round 24) grenade type
  if (p.down || gCount(p, t) <= 0) return;
  if (t) p.gn[t - 1]--; else p.nades--;
  if (v && v.x != null) { p.aim = Math.atan2(v.y - p.y, v.x - p.x); p.aimPt = { x: v.x, y: v.y, z: v.z != null ? v.z : surfZ(v.x, v.y, gAt(Math.floor(v.x), Math.floor(v.y))) }; }
  const [sx, sy, sz] = shoulder(p), [ax, ay] = aimDir(p);
  let dist = p.aimPt ? Math.min(BAL.nadeRange, d2(p.aimPt.x, p.aimPt.y, sx, sy)) : 6; dist = Math.max(2, dist);
  const T = 0.95 + dist * 0.035, g = 14; // (round 34d) a higher lob (apex ~2.4 at 6 m) so a low wall or a rock doesn't knock it back (was 0.75 + 0.03 d)
  W.proj.push({ k: 'nade', x: sx, y: sy, z: sz, vx: Math.cos(Math.atan2(ay, ax)) * dist / T, vy: Math.sin(Math.atan2(ay, ax)) * dist / T, vz: g * T / 2 + ((p.aimPt ? p.aimPt.z - 0.5 : sz - 0.72) - sz) / T, t: Math.min(BAL.nadeFuse, T + BAL.nadeLand), o: p.i, gt: t });
  emit({ k: 'sfx', n: 'throw', x: p.x, y: p.y });
}
function checkReady() {
  if (W.phase !== 'day') return;
  const act = activeP().filter(p => !p.dead);
  if (act.length && act.every(p => p.ready) && W.clock > 4) { W.clock = 4; say('全员就绪，夜晚提前到来', '#ffcf6b'); }
}
function nearBench(p) { return !p.down && p.L === gAt(W.bench.x, W.bench.y) && d2(p.x, p.y, W.bench.x + 0.5, W.bench.y + 0.5) < 2.2; }
// crafting / buying works at the camp bench or anywhere inside a building (round 18)
// (round 34d) two players share what they've built: every vehicle and every gun (and the riot shield) one of you has, the other has too (ammo stays your own)
function teamShare() {
  const ps = W.p.filter(p => !p.gone); if (ps.length < 2) return; let vehs = 0, sh = 0; const own = WPN.map(() => 0);
  for (const p of ps) { vehs |= p.vehs || 0; if (p.shield) sh = 1; p.owned.forEach((o, k) => { if (o) own[k] = 1; }); }
  for (const p of ps) { p.vehs = vehs; if (sh) p.shield = 1; own.forEach((o, k) => { if (o && !p.owned[k]) { p.owned[k] = 1; p.mag[k] = p.mag[k] || WPN[k].mag; if (!WPN[k].inf) p.ammo[k] = Math.max(p.ammo[k] || 0, WPN[k].loot * 2 || 10); } }); if (!p.veh && vehs) p.veh = [4, 2, 3, 1, 5, 6].find(k => vehs >> k & 1) || 0; }
}
function canCraft(p) { return !p.down && !p.dead && (nearBench(p) || houseInterior(Math.floor(p.x), Math.floor(p.y)) || inCamp(p)); }
const inCamp = p => Math.abs(p.x - W.radio.x - 0.5) <= 6.5 && Math.abs(p.y - W.radio.y - 0.5) <= 5.5;
function craftBlocked(p, c) {
  if (c.bp && !hasBP(c.bp)) return '需要蓝图';
  if (c.veh && ownsVeh(p, c.veh)) return '已拥有';
  if ((c.mfix || c.mbat) && inMech(p)) return '先变回载具';
  if ((c.mfix || c.mbat) && !(p.vehs & 126)) return '没有载具';
  if (c.mfix && [1, 2, 3, 4, 5, 6].every(v => !ownsVeh(p, v) || mhpOf(p, v) >= MECHS[v].hp - 1)) return '装甲完好';
  if (c.mbat && (p.bat || 0) >= BAL.mechBat - 0.5) return '电是满的';
  if (c.shield && p.shield) return '已拥有';
  if (c.wpn && p.owned[c.wpn]) return '已拥有';
  if (c.ammo && !p.owned[c.ammo[0]]) return '没有这把枪';
  if (c.ammo && p.ammo[c.ammo[0]] >= ammoCap(c.ammo[0])) return '背包满了'; // (round 32)
  if ((c.gam || c.fuel) && !ownsVeh(p, 5)) return '没有旋翼机';
  if (c.shl && !ownsVeh(p, 6)) return '没有坦克';
  if (c.shl && (p.shl || 0) >= BAL.tankCap) return '已满';
  if (c.fuel && airborne(p)) return '先落地';
  if (c.fuel && (p.fuel || 0) >= VEH[5].fuel - 0.5) return '油是满的';
  if (c.gam && (p.gam || 0) >= BAL.gyroCap) return '已满';
  if (c.nade && gCount(p, c.gt || 0) >= gCap(c.gt || 0)) return '已满';
  if (c.med && p.meds >= BAL.medCap) return '已满';
  if (c.upg && W.upg >= BAL.upgMax) return '已满级';
  if (!affordable(W.res, c.cost)) return '材料不足';
  return '';
}
function doCraft(p, id) {
  const c = CRAFT.find(c => c.id === id); if (!c || !canCraft(p) || craftBlocked(p, c)) return;
  for (const k in c.cost) W.res[k] -= c.cost[k];
  if (c.wpn) { p.owned[c.wpn] = 1; p.mag[c.wpn] = WPN[c.wpn].mag; p.ammo[c.wpn] += WPN[c.wpn].loot * 2 || 10; p.wpn = c.wpn; }
  if (c.ammo) p.ammo[c.ammo[0]] += c.ammo[1];
  if (c.nade) { const t = c.gt || 0; if (t) { p.gn = p.gn || [0, 0, 0]; p.gn[t - 1] = Math.min(BAL.gnCap, p.gn[t - 1] + c.nade); } else p.nades = Math.min(BAL.nadeCap, p.nades + c.nade); }
  if (c.med) p.meds = Math.min(BAL.medCap, p.meds + 1);
  if (c.upg) W.upg++;
  if (c.gam) p.gam = Math.min(BAL.gyroCap, (p.gam || 0) + c.gam);
  if (c.fuel) p.fuel = VEH[5].fuel;
  if (c.shl) p.shl = Math.min(BAL.tankCap, (p.shl || 0) + c.shl);
  if (c.mfix) p.mh = [];
  if (c.mbat) p.bat = BAL.mechBat;
  if (c.veh) { p.vehs = (p.vehs || 0) | 1 << c.veh; p.veh = c.veh; if (VEH[c.veh].fly) p.gam = Math.max(p.gam || 0, BAL.gyroStart); if (VEH[c.veh].gun === 'cannon') p.shl = Math.max(p.shl || 0, BAL.tankStart); }                  // (round 22) it becomes your default: T gets on
  if (c.shield) { p.shield = 1; p.melee = 1; }
  emit({ k: 'craft', p: p.i, id, name: c.name });
}
function inReach(p, x, y, L) { return !p.down && Math.hypot(p.x - x - 0.5, p.y - y - 0.5, (pZ(p) - L * FH) * 0.8) <= BAL.pReach; }
function repairCost(Bb, frac) { const c = {}; for (const k in Bb.cost) c[k] = Math.max(1, Math.ceil(Bb.cost[k] * frac)); return c; }
function doBuild(p, x, y, L, id, dir) {
  if (!inMap(x, y) || L < 0 || L >= ML || !inReach(p, x, y, L) || !B[id] || !B[id].cost) return;
  const i = ci(x, y, L), Bi = B[id];
  // repair what is there
  const cur = Bi.slab ? W.slab[i] : W.blk[i];
  if (cur && B[cur].cost) {
    const hpNow = Bi.slab ? W.shp[i] : W.bhp[i], miss = 1 - hpNow / B[cur].hp; if (miss <= 0.02) return;
    const cost = repairCost(B[cur], miss);
    if (!affordable(W.res, cost)) return emit({ k: 'deny', p: p.i, why: '材料不足' });
    for (const k in cost) W.res[k] -= cost[k];
    if (Bi.slab) W.shp[i] = B[cur].hp; else W.bhp[i] = B[cur].hp;
    W.dirty.add(i); emit({ k: 'repair', i, p: p.i }); return;
  }
  const why = canPlace(x, y, L, id, dir);
  if (why) return emit({ k: 'deny', p: p.i, why });
  if (!affordable(W.res, Bi.cost)) return emit({ k: 'deny', p: p.i, why: '材料不足' });
  for (const k in Bi.cost) W.res[k] -= Bi.cost[k];
  if (Bi.slab) setCell(i, W.blk[i] === 23 ? 0 : W.blk[i], id, null, 'build');
  else { if (W.blk[i] && W.srch) W.srch.delete(i); setCell(i, id, W.slab[i], Bi.stairs ? (dir & 3) : null, 'build'); } // (round 25) gear may replace a bush / searched spot
  W.stats.built++; taskAdd('build'); if (L >= 2) taskAdd('high'); (W.mine = W.mine || new Set()).add(i); // (round 32) cells players built on (for the dawn re-occupation)
  recomputeStab();
}
function doDemolish(p, x, y, L) {
  if (!inMap(x, y) || L < 0 || L >= ML || !inReach(p, x, y, L)) return;
  const i = ci(x, y, L), b = W.blk[i], s = W.slab[i];
  if (!(modeDef().anyBuild || inZone(x, y) || (b && B[b].any))) return;
  let Bb, frac;
  if (b && B[b].cost) { Bb = B[b]; frac = W.bhp[i] / Bb.hp; setCell(i, 0, s, null, 'demo'); }
  else if (s && B[s].cost) { Bb = B[s]; frac = W.shp[i] / Bb.hp; const water = L === 0 && ttAt(x, y) === TT.water; setCell(i, water ? 23 : b, 0, null, 'demo'); }
  else return;
  for (const k in Bb.cost) W.res[k] += Math.floor(Bb.cost[k] * BAL.refund * frac);
  collapseCheck();
}

/* ---------- phases & waves ---------- */
function edgeSpawns(RX = W.radio.x, RY = W.radio.y, D = 27, toPlayers = false) {
  // zombies come out of the wilds on a square ring around the radio (or round the survivors in 尸城求生), or the map edge if that is closer
  const out = { 0: [], 1: [], 2: [], 3: [] }; // by side: 0 east, 1 south, 2 west, 3 north
  const F = toPlayers ? W.ff.pw : W.ff.rw;
  const add = (x, y, side) => { x = clamp(x, 0, MW - 1); y = clamp(y, 0, MH - 1); const L = gAt(x, y); if (standable(x, y, L, 'z') && F[ci(x, y, L)] < Infinity && !houseInterior(x, y)) out[side].push([x, y, L]); };
  for (let k = -D; k <= D; k++) { add(RX + D, RY + k, 0); add(RX + k, RY + D, 1); add(RX - D, RY + k, 2); add(RX + k, RY - D, 3); }
  return out;
}
function startNight() {
  W.night++; W.phase = 'night'; W.nightT = 0; W.clean = true;
  if (modeDef().ring) { updateFields(0, true); W.edges = siegeEdges(); }
  W.p.forEach(p => p.ready = false);
  const n = W.night, blood = isBlood(n), D = W.D;
  const count = Math.round(BAL.nightSpawn(BAL.lvN(n)) * D.n * (blood ? BAL.bloodMul : 1)); // (round 34b) climbs every night
  // (round 18: every kind arrives 1-2 nights earlier; night 1 already has runners)
  // (round 21) every kind can turn up from night 1-2, rarely at first and more each night
  const wts = { walker: 10, crawler: 1.4, runner: 1 + n * 0.4, dog: 0.35 + n * 0.1, bloater: 0.4 + n * 0.08, climber: 0.35 + n * 0.18,
    spitter: n >= 2 ? 0.3 + n * 0.14 : 0, screamer: n >= 2 ? 0.2 + n * 0.05 : 0, brute: n >= 2 ? (0.15 + n * 0.07) * (blood ? 2 : 1) : 0, armored: n >= 3 ? 0.3 + n * 0.09 : 0 };
  const tot = Object.values(wts).reduce((a, b) => a + b, 0), dur = BAL.spawnDur(n), q = [];
  const sides = [0, 1, 2, 3].filter(s => W.edges[s].length);
  for (let k = sides.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [sides[k], sides[j]] = [sides[j], sides[k]]; }
  const front = blood ? sides : sides.slice(0, Math.min(sides.length, n < 2 ? 1 : n < 4 ? 2 : 3)); // (was 1 side before night 3, then 2)
  const PACK = { walker: [5, 9], crawler: [3, 5], runner: [3, 5], dog: [3, 3], climber: [2, 4], bloater: [1, 2], spitter: [1, 2], screamer: [1, 1], brute: [1, 1], armored: [2, 3] };
  for (let k = 0; k < count;) {
    let r = rand() * tot, type = 'walker';
    for (const key in wts) { r -= wts[key]; if (r <= 0) { type = key; break; } }
    const [a, b] = PACK[type] || [1, 1], size = Math.min(type === 'dog' ? 3 : count - k, a + Math.floor(rand() * (b - a + 1)));
    const frac = k / count, burst = Math.floor(frac * 6) / 6;
    const t0 = (frac < 0.25 ? frac * 12 : lerp(burst, frac, 0.55) * dur) + rand() * 2.5, side = front[Math.floor(rand() * front.length)]; // a quarter rushes in at once
    // a herd: comes out of the wilds in roughly the same stretch of the edge over a few seconds, mostly one kind with a few others mixed in;
    // each keeps its own pace, the herd just loosely keeps together on the way (stepZombies: stragglers hurry, leaders hang back)
    const L = W.edges[side] || [], at = L.length ? Math.floor(rand() * L.length) : -1, g = W.gid = (W.gid || 0) + 1;
    for (let j = 0; j < size; j++) {
      let kk = type; if (type !== 'dog' && j > 0 && rand() < 0.25) { let r2 = rand() * tot; for (const key in wts) { r2 -= wts[key]; if (r2 <= 0) { kk = key === 'dog' ? 'walker' : key; break; } } }
      const off = Math.round((rand() + rand() + rand() - 1.5) * 3);
      q.push({ t: t0 + j * 0.5 + rand() * 1.2, k: kk, side, at: at < 0 ? -1 : clamp(at + off, 0, L.length - 1), f: 0, g });
    }
    k += type === 'dog' ? 1 : size;
  }
  if (blood) q.push({ t: dur * 0.55, k: 'boss', side: front[0] });
  // (round 35) flocks of crows from night 2 (bats too from night 4), one 能力者 elite from night 3 (one more every 3 nights, at most 4)
  if (n >= 2) for (let f = 0, nf = Math.min(5, 1 + Math.floor((n - 2) / 2)); f < nf; f++) { const bat = n >= 4 && rand() < 0.45, k = bat ? 'bat' : 'crow', sz = bat ? 3 + Math.floor(rand() * 3) : 4 + Math.floor(rand() * 4), side = front[Math.floor(rand() * front.length)], E = W.edges[side] || [], at = E.length ? Math.floor(rand() * E.length) : -1, t0 = dur * (0.15 + rand() * 0.7), fk = W.gid = (W.gid || 0) + 1; for (let j = 0; j < sz; j++) q.push({ t: t0 + j * 0.25, k, side, at, f: 0, fk }); if (n >= 3 && !bat && rand() < 0.6) for (let j = 0, nv = n >= 7 ? 2 : 1; j < nv; j++) q.push({ t: t0 + 0.4 + j * 0.5, k: 'vult', side, at, f: 0, fk }); } /* (round 36l) 尸鹫 bombers ride with crow flocks from night 3 */
  if (n >= 3) for (let e = 0, ne = Math.min(4, 1 + Math.floor((n - 3) / 3)); e < ne; e++) q.push({ t: dur * (0.25 + rand() * 0.55), k: ELITES[Math.floor(rand() * ELITES.length)], side: front[e % front.length] });
  if (KAIJU_ON && n >= 5 && n % 2 === 1) for (let k = 0; k < (n >= 11 ? 2 : 1); k++) q.push({ t: dur * (0.35 + k * 0.3), k: (n >= 7 ? ['kjaw', 'ktail', 'kdig', 'kwing'] : ['kjaw', 'ktail', 'kdig'])[Math.floor(rand() * (n >= 7 ? 4 : 3))], side: front[k % front.length], km: n >= 11 ? BAL.kaijuPair : 1 }); // (round 34) a kaiju every other night from night 5 (two from night 11)
  q.sort((a, b) => a.t - b.t);
  W.spawnQ = q;
  const names = ['东', '南', '西', '北'];
  modeNight(n);
  emit({ k: 'night', n, lv: BAL.nightLv(n), up: n > 1 && BAL.nightLv(n) > BAL.nightLv(n - 1) ? 1 : 0, blood: blood ? 1 : 0, count: q.length, from: front.map(s => names[s]).join('、') });
}
// (round 35) what a mech flattened (rocks, bushes, fences, trees…) grows / gets put back at dawn, unless something now stands there
function mechScar(i, b, d, ch) { (W.scar = W.scar || []).push([i, b != null ? b : W.blk[i], d != null ? d : W.bdir[i], ch == null ? 1 : ch]); if (W.scar.length > 3000) W.scar.shift(); }
function scarRegrow() {
  if (!W.scar || !W.scar.length) return; let n = 0;
  for (const [i, b, d, ch] of W.scar) { if (W.blk[i] || ch < 1 && rand() >= ch) continue; /* (round 36b) what 工蜂 gathered comes back 60% of the time */ const x = cx_(i) + 0.5, y = cy_(i) + 0.5, L = cl_(i);
    if (W.p.some(p => !p.gone && p.L === L && Math.abs(p.x - x) < 0.9 && Math.abs(p.y - y) < 0.9) || W.zs.some(z => z.L === L && Math.abs(z.x - x) < 0.8 && Math.abs(z.y - y) < 0.8)) continue;
    setCell(i, b, W.slab[i], d, 'grow'); n++; }
  W.scar = [];
}
function dawn() {
  scarRegrow();
  if (W.clean && W.night > 0) taskAdd('clean');
  if (W.mode === 'classic' && W.night >= BAL.nights && !W.endless) return endGame('win', '救援直升机到了');
  W.phase = 'day'; W.dayLen = W.clock = BAL.dayFor(W.night + 1); // (round 34b) days get shorter
  rollTasks();
  setTimeout(() => saveGame(true), 0); // autosave every morning
  for (const i of [...W.srch]) { const S = SPOTS[B[W.blk[i]].spot]; if (!S || rand() < (S.refill || 1)) { W.srch.delete(i); emit({ k: 'spot', i, v: 0 }); } }
  W.ver++; restockSpots(false);
  for (const p of activeP()) {
    p.ready = false;
    if (p.dead) respawnP(p);
    else if (p.down) { p.down = false; p.hp = 30; }
  }
  emit({ k: 'dawn', n: W.night });
}
function spawnZombie(k, side, at, f, g) {
  const Z = ZT[k], n = Math.max(1, W.night), D = W.D;
  const list = W.edges[side] && W.edges[side].length ? W.edges[side] : W.edges[0];
  let [x, y, L] = list[at != null && at >= 0 && at < list.length ? at : Math.floor(rand() * list.length)];
  if (g) { const o = Math.round(rand() * 4 - 2), nx = x + Math.sign(W.radio.x - x) * o, ny = y + Math.sign(W.radio.y - y) * o, nL = inMap(nx, ny) ? gAt(nx, ny) : -1; if (nL >= 0 && standable(nx, ny, nL, 'z') && W.ff.rw[ci(nx, ny, nL)] < Infinity) { x = nx; y = ny; L = nL; } } // a herd is a crowd, not a queue
  const hpM = (Z.kaiju ? 1 + BAL.kaijuHpPer * (BAL.lvN(n) - 1) : BAL.hpMul(BAL.lvN(n))) * D.hp * (k === 'boss' ? 1 + n / 10 : 1) * (activeP().length > 1 ? 1.15 : 1); /* (round 36l) kaiju grow half as fast */
  const z = { id: W.zid++, k, x: x + 0.5, y: y + 0.5, L, z: L * FH, r: Z.r, h: Z.h, hp: Z.hp * hpM, max: Z.hp * hpM, spd: Z.spd * BAL.spdMul(BAL.lvN(n)) * (f || (0.85 + rand() * 0.3)), face: 0, cd: rand(), st: 'walk', stun: 0, kbx: 0, kby: 0, hitT: 0, atk: 0, anim: rand() * 6, seed: (rand() * 1e6) | 0, spitT: 1 + rand() * 2, climbT: 0 };
  if (Z.fly) z.z += Z.fly.alt; // (round 35) a flyer comes in already up in the air
  if (Z.elite) { z.eCD = 2 + rand() * 2; if (Z.elite.k === 'shield') z.sh = z.shMax = z.max * 0.6; if (Z.elite.k === 'cloak') z.ck = 1; }
  W.zs.push(z);
  return z;
}
function stepPhase(dt) {
  if (W.over) return;
  for (const p of activeP()) if (p.dead && p.lives > 0 && (p.downT -= dt) <= 0) respawnP(p); // (round 24) the dead come back at the base after 20 s while they have respawns left (solo too)
  if (W.phase === 'day') {
    W.clock -= dt; W.strayT -= dt;
    if (W.strayT <= 0 && W.night >= 1) { W.strayT = BAL.dayStragglerCD; if (W.zs.length < BAL.dayStragglers) spawnZombie(strayKind(W.night), Math.floor(rand() * 4)); }
    if (W.clock <= 0) startNight();
  } else if (W.phase === 'night') {
    W.nightT += dt;
    let awake = 0; for (const z of W.zs) if (!z.sleep) awake++;
    while (W.spawnQ.length && W.spawnQ[0].t <= W.nightT && awake++ < BAL.zCap()) { const s = W.spawnQ.shift(); const z = spawnZombie(s.k, s.side, s.at, s.f, s.g); if (s.km) { z.hp *= s.km; z.max *= s.km; } if (s.g) z.g = s.g; if (s.fk) z.fk = s.fk; if (ZT[s.k].elite) say('能力者出现：' + ZT[s.k].name + '——' + ZT[s.k].elite.tip, ZT[s.k].elite.col); }
    const minT = BAL.nightMin(W.night);
    // after the horde, small groups keep coming until the night has run its minimum length
    if (!W.spawnQ.length && W.nightT < minT) {
      W.strayT -= dt;
      if (W.strayT <= 0) { W.strayT = BAL.nightTrickleCD; if (W.zs.filter(z => !z.sleep && !z.mz).length < BAL.nightTrickleMax) { const n = W.night; for (let k = 0; k < 1 + (rand() < 0.5 ? 1 : 0); k++) spawnZombie(strayKind(n), Math.floor(rand() * 4)); } }
    }
    if (modeDef().timed) { if (W.nightT >= minT && !modeDef().dawn()) dawn(); return; } // 尸城求生: the sun comes up on time
    const wz = W.zs.filter(z => !z.mz && !(z.nest != null && W.nightT > minT + 30)); // a nest that keeps hatching can't keep the night going for ever
    if (!W.spawnQ.length && wz.length && wz.length <= 3 && W.nightT > Math.max(BAL.spawnDur(W.night) + 240, minT + 60)) { wz.forEach(z => { z.hp = 0; }); W.zs = W.zs.filter(z => z.mz); say('残余的丧尸散去了'); }
    if (!W.spawnQ.length && !wz.length && W.nightT >= minT) dawn();
  }
}

/* ---------- projectiles ---------- */
function floorUnder(x, y, z) { const cx = Math.floor(x), cy = Math.floor(y); for (let L = Math.min(ML - 1, Math.floor(z / FH)); L >= 0; L--) if (support(cx, cy, L) || solidFor(blkAt(cx, cy, L - 1), 'b')) return L * FH; return 0; }
function stepProj(dt) {
  for (const b of W.proj) {
    b.vz -= (b.k === 'acid' ? 10 : b.k === 'gl' ? 7 : 14) * dt;
    if (b.k === 'gl') {
      b.t -= dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt, nz = b.z + b.vz * dt, cx = Math.floor(nx), cy = Math.floor(ny);
      const hb = blkAt(cx, cy, Math.floor(nz / FH)), port = hb && B[hb].cost && b.ox != null && Math.hypot(nx - b.ox, ny - b.oy) < PORT + 0.4;
      let boom = b.t <= 0 || !inMap(cx, cy) || (solidFor(hb, 'b') && !port) || nz <= floorUnder(nx, ny, b.z + 0.05);
      if (!boom) for (const z of W.zs) if (z.hp > 0 && d2(z.x, z.y, nx, ny) < z.r + 0.2 && nz > z.z - 0.1 && nz < z.z + z.h + 0.15) { boom = true; break; }
      if (boom) { b.dead = true; explode(b.x, b.y, Math.max(b.z, floorUnder(b.x, b.y, b.z + 0.05)) + 0.15, W.p[b.o], WPN[6].blastR, WPN[6].dmg); } else { b.x = nx; b.y = ny; b.z = nz; }
    } else if (b.k === 'nade') {
      b.t -= dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt, nz = b.z + b.vz * dt;
      const L = Math.floor(b.z / FH);
      if (nadeStop(blkAt(Math.floor(nx), Math.floor(b.y), L), b.z - L * FH)) b.vx *= -0.4; else b.x = nx;
      if (nadeStop(blkAt(Math.floor(b.x), Math.floor(ny), L), b.z - L * FH)) b.vy *= -0.4; else b.y = ny;
      const fz = floorUnder(b.x, b.y, b.z + 0.01);
      if (nz <= fz && b.vz < 0) { b.z = fz; b.vz *= -0.25; b.vx *= 0.4; b.vy *= 0.4; if (Math.abs(b.vz) > 1.5) emit({ k: 'sfx', n: 'clink', x: b.x, y: b.y }); } else b.z = nz;
      if (b.t <= 0) { b.dead = true; if (b.gt) gSpecial(b.gt, b.x, b.y, b.z + 0.2, W.p[b.o]); else explode(b.x, b.y, b.z + 0.2, W.p[b.o]); }
    } else {
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      const x = Math.floor(b.x), y = Math.floor(b.y), L = Math.floor(b.z / FH), blk = blkAt(x, y, L);
      let hit = false;
      if (solidFor(blk, 'b') || b.z <= floorUnder(b.x, b.y, b.z + 0.3) + 0.02) { if (inMap(x, y) && L >= 0 && L < ML) damageCell(ci(x, y, L), 9 * W.D.dmg); hit = true; }
      for (const p of W.p) if ((standingP(p) || p.down) && d2(p.x, p.y, b.x, b.y) < p.r + 0.15 && b.z > p.z - 0.1 && b.z < p.z + p.h + 0.1) { hurtPlayer(p, 11 * W.D.dmg, b); hit = true; }
      if (hit || b.z < -2) { b.dead = true; if (b.pool) acidPool(b.x, b.y); emit({ k: 'acid', x: r2(b.x), y: r2(b.y), z: r2(b.z) }); }
    }
  }
  W.proj = W.proj.filter(b => !b.dead);
}
// (round 24) the special grenades: a slow field or a smoke cloud (W.cz, ticked here, sent to guests), or a blast that throws zombies aside
function gSpecial(t, x, y, z, p) {
  noiseAt(x, y, t === 3 ? SIEGE.boomR : 6, z);
  if (t === 3) { eliteCounter(x, y, BAL.blastR, true);
    for (const zb of W.zs) { if (zb.hp <= 0) continue; const dx = zb.x - x, dy = zb.y - y, d = Math.hypot(dx, dy, (zb.z + zb.h / 2 - z) * 0.8); if (d > BAL.blastR + zb.r) continue;
      const f = 1 - Math.max(0, d - zb.r) / BAL.blastR, heavy = ZT[zb.k].boss ? 0.2 : zb.k === 'brute' ? 0.45 : 1, n = Math.hypot(dx, dy) || 1;
      zb.stun = Math.max(zb.stun || 0, (0.5 + BAL.blastStun * f) * Math.max(heavy, 0.5)); if (zb.chg || zb.slam) { zb.chg = zb.slam = null; }
      hurtZombie(zb, BAL.blastDmg * (0.5 + 0.5 * f), p, dx / n * BAL.blastKB * (0.45 + 0.55 * f) * heavy, dy / n * BAL.blastKB * (0.45 + 0.55 * f) * heavy); }
    emit({ k: 'boom', x: r2(x), y: r2(y), z: r2(z), r: BAL.blastR, b: 1 }); return;
  }
  (W.cz = W.cz || []).push({ k: t, x: r2(x), y: r2(y), z: r2(Math.max(0, z - 0.2)), r: t === 1 ? BAL.slowR : BAL.smokeR, t: t === 1 ? BAL.slowT : BAL.smokeT });
  emit({ k: 'sfx', n: t === 1 ? 'acid' : 'throw', x, y });
}
// which clouds a point is in: bit 1 = slow field, bit 2 = smoke
function cloudAt(x, y, z) { let m = 0; for (const c of W.cz || []) if (Math.abs(z - c.z) < 1.6 && Math.hypot(x - c.x, y - c.y) < c.r) m |= c.k === 1 || c.k === 4 || c.k === 5 ? 1 : 2; return m; } /* (round 37) k 4 = 毒雾: slows like the slow field (its damage is in stepEvoWorld) */
function explode(x, y, z, p, R = BAL.nadeR, dmg = BAL.nadeDmg) {
  KSRC = 'nade'; eliteCounter(x, y, R, false);
  for (const zb of W.zs) {
    if (zb.hp <= 0) continue;
    const d = Math.hypot(zb.x - x, zb.y - y, (zb.z + zb.h / 2 - z) * 0.8);
    if (d < R + zb.r) { const f = 1 - Math.max(0, d - zb.r) / R, Zt = ZT[zb.k], tough = Zt.boss || Zt.kaiju || zb.k === 'boss' ? 0.6 : 1; hurtZombie(zb, dmg * (BAL.nadeMin + (1 - BAL.nadeMin) * f) * (1 + 0.08 * W.upg) * tough, p, (zb.x - x) / (d || 1) * 5 * f, (zb.y - y) / (d || 1) * 5 * f); }
  }
  KSRC = '';
  modeAreaHit(x, y, R, dmg * 0.8); noiseAt(x, y, SIEGE.boomR, z);
  emit({ k: 'boom', x: r2(x), y: r2(y), z: r2(z), r: R });
  const cx = Math.floor(x), cy = Math.floor(y), L0 = Math.floor(z / FH), rr = Math.ceil(R);
  for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) for (let l = L0 - 1; l <= L0 + 1; l++) { const xx = cx + dx, yy = cy + dy; if (!inMap(xx, yy) || l < 0 || l >= ML || Math.hypot(dx, dy) > R) continue; const i = ci(xx, yy, l); if (redBarrel(i)) barrelBoom(i, p); }
}
// red oil barrels: shoot one (or blow it up) and it goes up in a ball of fire
const redBarrel = i => W.blk[i] === 37 && Math.floor(hash2(cx_(i) * 3 + cl_(i), cy_(i) * 7) * 3) === 0;
function barrelBoom(i, p) {
  if (W.blk[i] !== 37) return;
  const x = cx_(i) + 0.5, y = cy_(i) + 0.5, z = cl_(i) * FH + 0.4;
  setCell(i, 0, W.slab[i], null, 'boom');
  explode(x, y, z, p, BAL.barrelR, BAL.barrelDmg);
  for (const zb of W.zs) if (zb.hp > 0 && Math.hypot(zb.x - x, zb.y - y) < BAL.barrelR && Math.abs(zb.z - z) < 1.6) { zb.burn = Math.max(zb.burn || 0, BAL.barrelBurn); if (p) zb.burnBy = p.i; }
}

/* ---------- one host/solo tick ---------- */
function simStep(dt) {
  W.t += dt;
  for (const p of W.p) { if (p.gone) continue; if (p.i === ME) stepMove(p, dt); stepActions(p, dt); }
  if (!W.over) {
    stepPhase(dt);
    updateFields(dt);
    stepZombies(dt); stepDrones(dt); stepEvoWorld(dt); /* (round 36n) 浮游炮; (round 37) poison */
    stepProj(dt);
    if (W.cz && W.cz.length) { for (const c of W.cz) c.t -= dt; W.cz = W.cz.filter(c => c.t > 0); }
    modeTick(dt); turretTick(dt); stepDelayed(dt); if ((W.shareT = (W.shareT || 0) - dt) <= 0) { W.shareT = 1; teamShare(); }
    checkLose();
  }
}
