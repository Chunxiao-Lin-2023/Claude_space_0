/* ================= simulation: players, weapons, building, gathering, crafting, day/night ================= */
function mkPlayer(i, name) {
  return {
    i, name, x: RADIO_XY[0] - 0.5 + i * 2, y: RADIO_XY[1] + 0.5 + i, L: 0, z: 0, r: 0.28, h: 1.0, vx: 0, vy: 0, kbx: 0, kby: 0, aim: -Math.PI / 2, aimPt: null,
    hp: BAL.pMaxHp, maxHp: BAL.pMaxHp, down: false, downT: 0, dead: false, gone: false,
    wpn: 1, owned: WPN.map((w, k) => k < 2 ? 1 : 0), mag: WPN.map((w, k) => k === 0 ? 12 : k === 1 ? 6 : 0), ammo: WPN.map((w, k) => k === 1 ? w.start : 0), bloom: 0, reloadT: 0, reloadW: 0, fireCD: 0, shoveCD: 0, shoveT: 0,
    nades: 2, meds: 2, gn: [1, 1, 1], gt: 0, lives: 3, fuel: 60, land: false, medT: 0, selfRev: false, useT: 0, useK: '', build: false, sel: 1, demo: false, sdir: 3, veh: 0, vehs: 0, shield: 0, melee: 0,
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
    phase: 'day', clock: BAL.dayLen[0], dayLen: BAL.dayLen[0], night: 0, res: Object.assign({}, BAL.startRes), upg: 0, kills: 0,
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
const rideK = p => p.ride ? { rate: 2.5, spread: 1 } : p.pass != null && p.pass >= 0 ? { rate: 1.43, spread: 1 } : { rate: 1, spread: 1 }; // only the rate drops; aim stays as true as on foot
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
const airborne = p => !!(p && p.ride && VEH[p.veh] && VEH[p.veh].fly);
// the level you would stand on at the top of this column (ground, a roof, a wall top)
function skyTop(x, y) {
  x = Math.floor(x); y = Math.floor(y); if (!inMap(x, y)) return 0;
  for (let L = ML - 1; L >= 0; L--) { const i = ci(x, y, L), b = W.blk[i]; if (b && B[b].P) return Math.min(ML - 1, L + 1); if (L > 0 && W.slab[i]) return L; }
  return 0;
}
// take off only from the ground or a roof: nothing overhead, and some fuel
function flyOK(p) {
  if (skyTop(p.x, p.y) > p.L) { emit({ k: 'deny', p: p.i, why: '旋翼机只能在地面或楼顶起飞：头顶不能有屋顶' }); return false; }
  if (!(p.fuel > 0.5)) { emit({ k: 'deny', p: p.i, why: '旋翼机没油了：进楼里按 F 加油' }); return false; }
  return true;
}
// owner-side flight: glide where you steer, hover 2.2 floors over whatever is below (looking ahead so it climbs before a building), come down when landing
function flyStep(p, dt) {
  const I = p.inp, m = Math.hypot(I.mx, I.my), k = m > 1 ? 1 / m : 1, V = VEH[p.veh];
  p.alt = clamp((p.alt || 0) + (p.land ? -BAL.flyDrop : BAL.flyClimb) * dt, 0, 1);
  const spd = BAL.pSpeed * V.spd * (0.3 + 0.7 * p.alt) * (p.land ? 0.7 : 1), a = Math.min(1, dt * 3.5);
  p.vx = lerp(p.vx, I.mx * k * spd, a); p.vy = lerp(p.vy, I.my * k * spd, a);
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
  // riding pillion on a teammate's motorbike: sit just behind the driver
  if (p.pass != null && p.pass >= 0) {
    const d = W.p[p.pass];
    if (!d || !d.ride || !vehSeats(d) || d.dead || d.down || d.gone) p.pass = -1;
    else { const a = d._ly != null ? d._ly : Math.atan2(d.vy || 0, d.vx || 1); p.x = d.x - Math.cos(a) * PILLION; p.y = d.y - Math.sin(a) * PILLION; /* (round 26) was -d._ly: the pillion sat mirrored, off the bike */ p.L = d.L; p.z = d.z; p.zv = d.zv; p.vx = d.vx; p.vy = d.vy; p._ly = d._ly; return; }
  }
  if (airborne(p)) { flyStep(p, dt); return; } // (round 29)
  const I = p.inp, m = Math.hypot(I.mx, I.my), k = m > 1 ? 1 / m : 1;
  if (p.jmp) { // mid-vault / mid-jump: a scripted arc
    const J = p.jmp; J.t += dt; const f = Math.min(1, J.t / J.T);
    p.x = lerp(J.x0, J.x1, f); p.y = lerp(J.y0, J.y1, f); p.jz = Math.sin(f * Math.PI) * J.h + (J.up ? J.up * FH * f : 0); // J.up: floors gained (jump pad), eased in so the landing doesn't pop
    p.vx = (J.x1 - J.x0) / J.T; p.vy = (J.y1 - J.y0) / J.T; p.anim += dt * 6;
    if (f >= 1) { const drop = p.L - J.L; p.L = J.L; p.jmp = null; p.jz = 0; p.vx *= 0.3; p.vy *= 0.3; if (drop > 0 || J.k) emitLocal('land'); }
    p.z = pZ(p); return;
  }
  if (p.dash) { const D = p.dash, f = Math.min(dt, D.T - D.t) / D.T; moveEnt(p, D.dx * f, D.dy * f, 'p', true); D.t += dt; if (D.t >= D.T) p.dash = null; p.z = pZ(p); p.anim += dt * 8; return; }
  const spd = BAL.pSpeed * (p.down ? 0.22 : 1) * (p.medT > 0 ? 0.45 : 1) * (p.build ? 0.9 : 1) * (inMud(p.x, p.y, p.L) ? MUD_SLOW : 1) * (p.ride && VEH[p.veh] ? VEH[p.veh].spd : 1);
  const tx = I.mx * k * spd, ty = I.my * k * spd, a = Math.min(1, dt * 14);
  p.vx = lerp(p.vx, tx, a); p.vy = lerp(p.vy, ty, a);
  p.kbx *= Math.max(0, 1 - dt * 6); p.kby *= Math.max(0, 1 - dt * 6);
  p.dropped = 0; p.edgeWant = 0;
  moveEnt(p, (p.vx + p.kbx) * dt, (p.vy + p.kby) * dt, 'p', true);
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
/* ---------- vaulting and jumping (local to each player, like walking) ---------- */
function vaultKind(b) { if (!b) return 0; const Bb = B[b]; if (Bb.vault || b === 27 || b === 29 || b === 26 || b === 32 || b === 37) return 1; if (b === 1 || b === 2 || b === 3 || b === 8 || b === 24 || b === 31 || b === 40) return 2; return 0; }
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
const shoulder = p => [p.x, p.y, pZ(p) + (p.down ? 0.25 : 0.72)];
function stepActions(p, dt) {
  if (p.gone) return;
  const I = p.inp;
  p.fireCD -= dt; p.shoveCD -= dt; p.emptyT -= dt; if (p.bloom) p.bloom = Math.max(0, p.bloom - dt * 2.2);
  // (round 29) gyrocopter: burns fuel while you're in it; empty → it comes down by itself; touching down gets you out
  if (airborne(p)) {
    p.fuel = Math.max(0, (p.fuel != null ? p.fuel : VEH[p.veh].fuel) - dt);
    if (p.fuel < BAL.fuelLow && !p._lowF) { p._lowF = 1; emit({ k: 'deny', p: p.i, why: '旋翼机油快没了（还剩 ' + Math.ceil(p.fuel) + ' 秒），没油会自己降落' }); }
    if (p.fuel <= 0 && !p.land) { p.land = true; emit({ k: 'deny', p: p.i, why: '旋翼机没油了，正在降落：进楼里按 F 加油' }); }
    const g = skyTop(p.x, p.y); if (p.land && p.z - surfZ(p.x, p.y, g) < 0.08) { p.ride = false; p.land = false; p.L = g; p.z = surfZ(p.x, p.y, g); p.alt = 0; emit({ k: 'sfx', n: 'land', x: p.x, y: p.y, o: p.i }); }
  } else { p._lowF = p.fuel < BAL.fuelLow ? p._lowF : 0; if (p.land) p.land = false; }
  // each gun has its own fire cooldown, and a reload keeps going in the holster (round 18: was one shared timer, swapping cancelled the reload)
  if (!p.cdW) p.cdW = WPN.map(() => 0); if (!p.rlBg) p.rlBg = WPN.map(() => 0);
  if (p.ride && VEH[p.veh] && VEH[p.veh].ram && Math.hypot(p.vx, p.vy) > BAL.ramSpd) for (const z of W.zs) { // (round 22) the armoured car shoves zombies aside
    if (z.hp <= 0 || z.L !== p.L || z.hidden || (z.ramT || 0) > W.t) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy) || 0.01;
    if (d < p.r + z.r + 0.3 && dx * p.vx + dy * p.vy > 0) { z.ramT = W.t + BAL.ramCD; const k = ZT[z.k].boss || z.k === 'brute' ? 1 : 5; hurtZombie(z, BAL.ramDmg, p, dx / d * k, dy / d * k); emit({ k: 'sfx', n: 'bash', x: z.x, y: z.y }); }
  }
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
  if (I.fire && !p.build && !airborne(p) && p.fireCD <= 0 && p.cdW[wi] <= 0 && p.reloadT <= 0 && p.medT <= 0) {
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
  if (!best && !p.ride && ownsVeh(p, 5) && (p.fuel || 0) < VEH[5].fuel - 1 && skyTop(p.x, p.y) > p.L) best = { k: 'fuel', i: -1, t: BAL.refuelT, name: '给旋翼机加油（' + Math.floor(p.fuel || 0) + '/' + VEH[5].fuel + ' 秒）' }; // (round 29) any roofed room refuels the gyrocopter
  return best;
}
function completeUse(p, tgt) {
  if (tgt.k === 'rez') { const q = W.p[tgt.i]; if (!q.dead || p.meds <= 0) return; p.meds--; q.dead = false; q.down = false; q.hp = Math.round(q.maxHp * BAL.rezHp); q.medT = 0; q.selfRev = false; emit({ k: 'revive', p: q.i, by: p.i, rez: 1 }); return; }
  if (tgt.k === 'rev') { const q = W.p[tgt.i]; if (!q.down) return; q.down = false; q.hp = 35; q.medT = 0; q.selfRev = false; emit({ k: 'revive', p: q.i, by: p.i }); return; }
  if (tgt.k === 'tur') { turretDone(p, tgt); return; }
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
/* ---------- daily tasks ---------- */
function rollTasks() {
  const d = W.night + 1, pool = [];
  for (const k in TASKS) { const T = TASKS[k]; if ((T.min || 1) <= d) pool.push(k); }
  const pick = [];
  while (pick.length < 3 && pool.length) {
    let tot = 0; for (const k of pool) tot += TASKS[k].w;
    let r = rand() * tot, j = 0;
    for (; j < pool.length - 1; j++) { r -= TASKS[pool[j]].w; if (r <= 0) break; }
    pick.push(pool.splice(j, 1)[0]);
  }
  W.tasks = pick.map(k => {
    const T = TASKS[k], need = Math.max(1, T.need(d)), rk = T.rw[Math.floor(rand() * T.rw.length)], rw = TASK_RW[rk](d);
    return { k, need, got: 0, done: 0, rw, txt: T.t(need), rt: taskRewardText(rw) };
  });
  W.tkv++;
}
function taskAdd(k, n = 1) {
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
  if (r.upg) W.upg = Math.min(5, W.upg + r.upg);
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
  const mul = 1 + 0.12 * W.upg, ends = [];
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
  if (z.sleep) { if (dmg >= z.hp) z.sleep = 0; else siegeWake(z); } // killed in its sleep: nobody else hears it
  z.hp -= dmg; if (!quiet) z.hitT = 0.12;
  if (kx || ky) { z.kbx = (z.kbx || 0) + kx; z.kby = (z.kby || 0) + ky; }
  if (z.hp <= 0) killZombie(z, p);
}
let KSRC = '';
function killZombie(z, p) {
  z.hp = 0; W.kills++; if (p) p.kills++;
  taskAdd('kill'); if (TASKS[z.k]) taskAdd(z.k); if (KSRC === 'nade') taskAdd('nade');
  if (ZT[z.k].blast) zBlast(z.x, z.y, z.z + 0.5);
  emit({ k: 'zdie', x: r2(z.x), y: r2(z.y), z: r2(z.z), t: z.k, f: r2(z.face), id: z.id });
  if (rand() < (z.k === 'boss' ? 1 : z.k === 'brute' ? 0.6 : 0.07)) { const n = z.k === 'boss' ? 15 : z.k === 'brute' ? 3 : 1; W.res.parts += n; emit({ k: 'loot', p: -1, x: z.x, y: z.y, z: z.z + z.h, text: '+' + n + ' 零件' }); }
}
function hurtPlayer(p, dmg, src) {
  if (p.gone || p.dead || (p.invT || 0) > 0) return; // invT: just respawned
  if (DBG && DBG.god) return;
  if (p.ride && VEH[p.veh] && VEH[p.veh].armor) dmg *= VEH[p.veh].armor;                                   // (round 22) inside the armoured car
  if (src && p.shield && p.melee === 1 && !p.down && !p.ride && Math.cos(angDiff(p.aim, Math.atan2(src.y - p.y, src.x - p.x))) > BAL.shieldCos) { // riot shield out: hits from the front lose half
    dmg *= 1 - BAL.shieldBlock; emit({ k: 'sfx', n: 'clank', x: p.x, y: p.y });
  }
  if (p.down) { p.downT -= dmg * 0.18; p.hurtT = 0.3; emit({ k: 'phurt', p: p.i, d: 1 }); return; }
  p.hp -= dmg; p.hurtT = 0.3; emit({ k: 'phurt', p: p.i, d: Math.round(dmg) });
  if (p.hp <= 0) { p.hp = 0; p.down = true; p.ride = false; p.pass = -1; for (const q of W.p) if (q.pass === p.i) q.pass = -1; if (W.phase === 'night') W.clean = false; p.downT = activeP().length > 1 ? BAL.downTime : BAL.soloDownTime; p.reloadT = 0; p.medT = 0; p.build = false; emit({ k: 'down', p: p.i }); checkLose(); }
}
function knock(p, kx, ky) { if (p.i === ME && NETROLE !== 'guest') { p.kbx += kx; p.kby += ky; } else emit({ k: 'kb', p: p.i, x: r2(kx), y: r2(ky) }); }
// a teammate on a motorbike with the back seat free, close enough to climb on
const vehSeats = d => !!(VEH[d.veh] && VEH[d.veh].seats);
const ownsVeh = (p, v) => !!((p.vehs || 0) >> v & 1) || (!p.vehs && v >= 1 && p.veh === v); // vehs = owned bitmask; a bare veh (older state) counts as owned
function pillionFor(p) { return W.p.find(d => d !== p && d.ride && vehSeats(d) && !d.dead && !d.down && !d.gone && Math.abs(d.L - p.L) <= 1 && Math.hypot(d.x - p.x, d.y - p.y) < 2.6 && !W.p.some(q => q.pass === d.i)) || null; } // (round 26) 1.8 → 2.6 tiles, a step up/down is fine
// (round 24) how many times each player may come back: difficulty, plus a bit more in the long modes
function livesFor(diff, mode) { return (BAL.lives[diff] != null ? BAL.lives[diff] : BAL.lives.normal) + (mode === 'classic' || mode === 'siege' ? BAL.livesLong : 0); }
function respawnP(p) {
  if (!(p.lives > 0)) return; p.lives--;
  let x = W.radio.x - 0.5 + p.i * 2, y = W.radio.y + 0.5, L = gAt(W.radio.x, W.radio.y);
  // (round 24) back at the base (the camp / start point), on the nearest free tile; was next to a living teammate
  const bx = W.radio.x, by = W.radio.y; let done = false;
  for (let r = 1; r <= 6 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !inMap(bx + dx, by + dy)) continue; const l = gAt(bx + dx, by + dy); if (!standable(bx + dx, by + dy, l, 'p') || W.zs.some(z => z.hp > 0 && Math.hypot(z.x - bx - dx - 0.5, z.y - by - dy - 0.5) < 1.2)) continue; x = bx + dx + 0.5; y = by + dy + 0.5; L = l; done = true; }
  const mate = null;
  p.dead = false; p.down = false; p.downT = 0; p.invT = BAL.respawnInv; p.hp = Math.round(p.maxHp * BAL.respawnHp); p.x = x; p.y = y; p.L = L; p.z = surfZ(x, y, L); p.vx = p.vy = 0;
  emit({ k: 'tp', p: p.i, x: p.x, y: p.y, l: p.L }); emit({ k: 'respawn', p: p.i, near: mate ? mate.i : -1 });
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
      if (p.pass != null && p.pass >= 0) { p.pass = -1; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); break; }     // hop off the back
      if (airborne(p)) { if (!p.land) { p.land = true; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); } break; } // (round 29) in the air: T / F brings it down, you get out on touchdown
      if (v >= 1 && ownsVeh(p, v)) { if (VEH[v].fly && !flyOK(p)) break; p.land = false; p.veh = v; p.ride = true; p.build = false; if (!vehSeats(p)) for (const q of W.p) if (q.pass === p.i) q.pass = -1; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); break; }
      const d = pillionFor(p);
      if (d && !p.ride) { p.pass = d.i; p.build = false; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); emit({ k: 'pillion', p: p.i, d: d.i }); break; } // get on behind a teammate
      if (!ownsVeh(p, p.veh)) p.veh = [4, 2, 3, 1, 5].find(k => ownsVeh(p, k)) || 0;
      if (p.veh && !p.ride && VEH[p.veh].fly && !flyOK(p)) break;
      if (p.veh) { p.land = false; p.ride = !p.ride; if (p.ride) p.build = false; else for (const q of W.p) if (q.pass === p.i) q.pass = -1; emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); }
    } break;
    case 'reload': if (!p.down) startReload(p); else if (p.mag[0] < WPN[0].mag) { p.reloadT = WPN[0].reload; p.reloadW = 0; } break;
    case 'wpn': if (!p.down && v >= 0 && v < NW && p.owned[v] && p.wpn !== v) {
      if (!p.rlBg) p.rlBg = WPN.map(() => 0); const o = p.wpn, ow = WPN[o];
      if (p.reloadT > 0 && p.reloadW === o) p.rlBg[o] = p.reloadT;                                    // the reload you started carries on in the holster
      else if (p.mag[o] === 0 && (ow.inf || p.ammo[o] > 0)) p.rlBg[o] = ow.reload;                  // an empty gun reloads itself while you use the other
      p.wpn = v; p.reloadT = 0; if (p.rlBg[v] > 0) { p.reloadT = p.rlBg[v]; p.reloadW = v; p.rlBg[v] = 0; } // back to a gun that was reloading: pick up where it was
      p.fireCD = Math.max(p.fireCD, 0.2); emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); } break;
    case 'knife': if (p.melee === 1 && p.shield) bash(p, v); else knife(p, typeof v === 'number' ? v : -1); break;
    case 'melee': p.melee = v === 1 && p.shield ? 1 : 0; break;
    case 'nade': throwNade(p, v); break;
    case 'med':
      if (p.medT > 0 || p.meds <= 0) break;
      if (p.down) { p.meds--; p.medT = 3; p.selfRev = true; emit({ k: 'sfx', n: 'med', x: p.x, y: p.y }); }
      else if (p.hp < p.maxHp) { p.meds--; p.medT = BAL.healTime; emit({ k: 'sfx', n: 'med', x: p.x, y: p.y }); }
      break;
    case 'ready': p.ready = !!v; checkReady(); break;
    case 'craft': doCraft(p, v); break;
    case 'build': doBuild(p, v.x, v.y, v.l, v.b, v.d); break;
    case 'demo': doDemolish(p, v.x, v.y, v.l); break;
    case 'vdef': if (v >= 1 && ownsVeh(p, v) && p.ride && (airborne(p) || VEH[v].fly) && v !== p.veh) { emit({ k: 'deny', p: p.i, why: airborne(p) ? '先落地再换车' : '先下车，再坐旋翼机起飞' }); break; } if (v >= 1 && ownsVeh(p, v)) { p.veh = v; if (p.ride && !vehSeats(p)) for (const q of W.p) if (q.pass === p.i) q.pass = -1; } break; // pick the default vehicle (switches the one you're on too)
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
  const T = 0.75 + dist * 0.03, g = 14;
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
function canCraft(p) { return !p.down && !p.dead && (nearBench(p) || houseInterior(Math.floor(p.x), Math.floor(p.y)) || inCamp(p)); }
const inCamp = p => Math.abs(p.x - W.radio.x - 0.5) <= 6.5 && Math.abs(p.y - W.radio.y - 0.5) <= 5.5;
function craftBlocked(p, c) {
  if (c.bp && !hasBP(c.bp)) return '需要蓝图';
  if (c.veh && ownsVeh(p, c.veh)) return '已拥有';
  if (c.shield && p.shield) return '已拥有';
  if (c.wpn && p.owned[c.wpn]) return '已拥有';
  if (c.ammo && !p.owned[c.ammo[0]]) return '没有这把枪';
  if (c.nade && gCount(p, c.gt || 0) >= gCap(c.gt || 0)) return '已满';
  if (c.med && p.meds >= BAL.medCap) return '已满';
  if (c.upg && W.upg >= 5) return '已满级';
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
  if (c.veh) { p.vehs = (p.vehs || 0) | 1 << c.veh; p.veh = c.veh; }                  // (round 22) it becomes your default: T gets on
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
  W.stats.built++; taskAdd('build'); if (L >= 2) taskAdd('high');
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
  const count = Math.round(BAL.nightSpawn(n) * D.n * (blood ? BAL.bloodMul : 1));
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
  q.sort((a, b) => a.t - b.t);
  W.spawnQ = q;
  const names = ['东', '南', '西', '北'];
  modeNight(n);
  emit({ k: 'night', n, blood: blood ? 1 : 0, count: q.length, from: front.map(s => names[s]).join('、') });
}
function dawn() {
  if (W.clean && W.night > 0) taskAdd('clean');
  if (W.mode === 'classic' && W.night >= BAL.nights && !W.endless) return endGame('win', '救援直升机到了');
  W.phase = 'day'; W.dayLen = W.clock = BAL.dayLen[1];
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
  const hpM = BAL.hpMul(n) * D.hp * (k === 'boss' ? 1 + n / 10 : 1) * (activeP().length > 1 ? 1.15 : 1);
  const z = { id: W.zid++, k, x: x + 0.5, y: y + 0.5, L, z: L * FH, r: Z.r, h: Z.h, hp: Z.hp * hpM, max: Z.hp * hpM, spd: Z.spd * BAL.spdMul(n) * (f || (0.85 + rand() * 0.3)), face: 0, cd: rand(), st: 'walk', stun: 0, kbx: 0, kby: 0, hitT: 0, atk: 0, anim: rand() * 6, seed: (rand() * 1e6) | 0, spitT: 1 + rand() * 2, climbT: 0 };
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
    while (W.spawnQ.length && W.spawnQ[0].t <= W.nightT && awake++ < BAL.zCap()) { const s = W.spawnQ.shift(); const z = spawnZombie(s.k, s.side, s.at, s.f, s.g); if (s.g) z.g = s.g; }
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
      if (solidFor(blkAt(Math.floor(nx), Math.floor(b.y), L), 'b') || solidFor(blkAt(Math.floor(nx), Math.floor(b.y), L), 'p')) b.vx *= -0.4; else b.x = nx;
      if (solidFor(blkAt(Math.floor(b.x), Math.floor(ny), L), 'b') || solidFor(blkAt(Math.floor(b.x), Math.floor(ny), L), 'p')) b.vy *= -0.4; else b.y = ny;
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
  if (t === 3) {
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
function cloudAt(x, y, z) { let m = 0; for (const c of W.cz || []) if (Math.abs(z - c.z) < 1.6 && Math.hypot(x - c.x, y - c.y) < c.r) m |= c.k === 1 ? 1 : 2; return m; }
function explode(x, y, z, p, R = BAL.nadeR, dmg = BAL.nadeDmg) {
  KSRC = 'nade';
  for (const zb of W.zs) {
    if (zb.hp <= 0) continue;
    const d = Math.hypot(zb.x - x, zb.y - y, (zb.z + zb.h / 2 - z) * 0.8);
    if (d < R + zb.r) { const f = 1 - Math.max(0, d - zb.r) / R; hurtZombie(zb, dmg * (BAL.nadeMin + (1 - BAL.nadeMin) * f) * (1 + 0.12 * W.upg), p, (zb.x - x) / (d || 1) * 5 * f, (zb.y - y) / (d || 1) * 5 * f); }
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
    stepZombies(dt);
    stepProj(dt);
    if (W.cz && W.cz.length) { for (const c of W.cz) c.t -= dt; W.cz = W.cz.filter(c => c.t > 0); }
    modeTick(dt); turretTick(dt);
    checkLose();
  }
}
