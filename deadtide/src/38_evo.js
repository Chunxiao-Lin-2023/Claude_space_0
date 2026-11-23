/* ---------- (round 37) 第二形态: beasts ----------
   A mech fills its 进化 meter by killing (in mech form). Full → X (tap) turns it into its beast for BAL.evoT seconds:
   疾风 → 青蛇, 赤刃 → 赤龙, 工蜂 → 玉兔, 铁卫 → 玄龟, 苍隼 → 火凤, 重炮 → 铁熊. Same hull; mechOf(p) returns the EVO entry while p.evoOn,
   so speed / armour / fire / skill keys all route here. X again (or the meter running out) → back to the mech; hold X → straight to the vehicle. */
const evoMul = p => mechMul() * (p && p.rageT > 0 ? 1.4 : 1);
function evoGainKill(p, z) {
  if (!p || !inMech(p) || !EVO[p.veh]) return; const T = ZT[z.k], big = T.boss || T.kaiju || T.elite || z.k === 'brute' || z.k === 'armored';
  if (p.evoOn) { p.evo = Math.min(100, (p.evo || 0) + (big ? 6 : 1.5)); if (p.veh === 6) { p.mh = p.mh || []; p.mh[6] = Math.min(MECHS[6].hp, mhpOf(p) + MECHS[6].hp * 0.015); } return; } // in beast form a kill stretches it a little; 铁熊 heals on kills
  const was = p.evo || 0; p.evo = Math.min(100, was + (T.kaiju ? 40 : big ? BAL.evoBig : BAL.evoKill));
  if (was < 100 && p.evo >= 100) emit({ k: 'evoready', p: p.i, n: EVO[p.veh].name });
}
function evolve(p) {
  const E = EVO[p.veh]; if (!E || !inMech(p) || p.evoOn || (p.evo || 0) < 100 || p.mtr > 0) return;
  p.evoOn = true; p.evo = 100; p.gcd = 0.4; p.mcd = Math.min(p.mcd || 0, 1); p.spinT = 0; p.rageT = 0; if (E.k === 'phoenix') { p.mfly = true; p.land = false; }
  p.mh = p.mh || []; p.mh[p.veh] = Math.min(MECHS[p.veh].hp, mhpOf(p) + MECHS[p.veh].hp * 0.3); // it comes out fresh: +30% hull
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.6) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > BAL.evoBurst + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 100 * mechMul(), p, dx / (d || 1) * (big ? 1 : 8), dy / (d || 1) * (big ? 1 : 8)); z.stun = Math.max(z.stun || 0, big ? 0.3 : 1); }
  emit({ k: 'evo', o: p.i, on: 1, v: p.veh, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); noiseAt(p.x, p.y, 10, p.z);
}
function devolve(p, why) {
  if (!p.evoOn) return; p.evoOn = false; p.spinT = 0; p.rageT = 0; p.gcd = 0.3; if (p.evo > 0 && why !== 'out') p.evo = Math.min(p.evo, 99);
  if (p.veh === 5 && p.mfly && (p.bat || 0) < 15) p.land = true; // 火凤 back to 苍隼: low on charge, it comes down
  emit({ k: 'evo', o: p.i, on: 0, v: p.veh, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); if (why === 'out') emit({ k: 'deny', p: p.i, why: EVO[p.veh].name + '的力量用完了，变回' + MECHS[p.veh].name });
}
// host, every step for every player
function evoStep(p, dt) {
  if (p.evoOn && (!inMech(p) || !EVO[p.veh])) { p.evoOn = false; p.spinT = 0; p.rageT = 0; }
  if (!p.evoOn) return;
  p.evo -= 100 / BAL.evoT * dt; if (p.evo <= 0) { p.evo = 0; devolve(p, 'out'); return; }
  if (p.rageT > 0) p.rageT -= dt;
  if (p.spinT > 0) { p.spinT -= dt; p.spinHit = (p.spinHit || 0) - dt; // 玄龟 旋甲: everything it touches gets knocked away
    if (p.spinHit <= 0) { p.spinHit = 0.4; let n = 0; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 2.6 + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 70 * evoMul(p), p, dx / (d || 1) * (big ? 1.5 : 9), dy / (d || 1) * (big ? 1.5 : 9)); z.stun = Math.max(z.stun || 0, big ? 0.1 : 0.6); n++; }
      if (n) emit({ k: 'mhit', o: p.i, h: 1, x: r2(p.x), y: r2(p.y), z: r2(p.z + 0.2), g: 1, r: 2.6 }); } }
}
// world: poison on zombies (z.psn) and the 毒雾 clouds (W.cz k 4: slow + damage)
function stepEvoWorld(dt) {
  W.evoTk = (W.evoTk || 0) - dt; const tick = W.evoTk <= 0; if (tick) W.evoTk = 0.25;
  for (const z of W.zs) { if (z.hp <= 0 || !(z.psn > 0)) continue; z.psn -= dt; hurtZombie(z, 12 * dt * (z.psnM || 1), W.p[z.psnBy] || null, 0, 0, true); }
  if (tick && W.cz) for (const c of W.cz) { if (c.k !== 4) continue; const o = W.p[c.o];
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - c.z) > 1.8 || Math.hypot(z.x - c.x, z.y - c.y) > c.r + z.r) continue; hurtZombie(z, 30 * 0.25 * (c.m || 1), o || null, 0, 0, true); z.psn = Math.max(z.psn || 0, 1); z.psnBy = c.o; z.psnM = c.m || 1; } }
}
// a round blow on the ground (shell bash, paw slam, landing): everything inside takes it
function evoRound(p, cx, cy, R, dmg, kb, stun) { let n = 0;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.6) continue; const dx = z.x - cx, dy = z.y - cy, d = Math.hypot(dx, dy); if (d > R + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, dmg, p, dx / (d || 1) * (big ? kb * 0.15 : kb), dy / (d || 1) * (big ? kb * 0.15 : kb)); z.stun = Math.max(z.stun || 0, big ? 0.1 : stun); n++; }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(cx), y: r2(cy), z: r2(p.z + 0.15), g: 1, r: R }); return n; }
// open ground near a point (for hops and the 月落 landing): standable, nothing overhead, not water
function evoLand(p, ang, D, rMax) {
  for (let r = 0; r <= rMax; r++) for (let k = 0; k < (r ? 12 : 1); k++) { const a2 = k / 12 * Math.PI * 2, x = p.x + Math.cos(ang) * D + Math.cos(a2) * r, y = p.y + Math.sin(ang) * D + Math.sin(a2) * r, cx = Math.floor(x), cy = Math.floor(y);
    if (!inMap(cx, cy)) continue; const g = gAt(cx, cy); if (skyTop(cx, cy) > g || !standable(cx, cy, g, 'p') || ttAt(cx, cy) === TT.water) continue; return { x: cx + 0.5, y: cy + 0.5, L: g }; }
  return null;
}
// the target a beast attack goes for (mechLock with the beast's reach), and the angle to it
function evoTarget(p, M, range) { const T = mechLock(p, Object.assign({}, M, { atk: 'kick', reach: range - 2.4 })); return T; }
function evoAttack(p, M) {
  const mul = evoMul(p); if (p.rageT > 0) p.gcd *= 0.75;
  p.mcmb = W.t - (p.mlastT || -9) < M.rate + 0.5 ? ((p.mcmb || 0) + 1) % 3 : 0; p.mlastT = W.t;
  let T = null, a = p.aim;
  if (M.atk === 'feather') { // 火凤: a fan of five burning feathers
    const A = p.aimPt && !p.aimPt.auto ? p.aimPt : null; if (!A) { T = mgunPick(p, M.range, p.x, p.y, (inAirZ(p) != null ? inAirZ(p) : p.z) + 0.6); if (T) a = Math.atan2(T.y - p.y, T.x - p.x); } else a = Math.atan2(A.y - p.y, A.x - p.x);
    const sz = (inAirZ(p) != null ? inAirZ(p) : p.z) + 0.6, tz = T ? T.z + T.h * 0.5 : A && A.z != null ? A.z + 0.4 : p.z + 0.4, ends = [];
    for (let k = -2; k <= 2; k++) { const aa = a + k * 0.16, hd = T ? Math.hypot(T.x - p.x, T.y - p.y) : 8, dz = (tz - sz) / Math.max(1, hd); let dx = Math.cos(aa), dy = Math.sin(aa), d3 = dz; const n = Math.hypot(dx, dy, d3); dx /= n; dy /= n; d3 /= n;
      const r = mgunRay(p.x, p.y, sz, dx, dy, d3, M.range); if (r.z) { hurtZombie(r.z, M.dmg * mul, p, dx * 0.6, dy * 0.6); r.z.burn = Math.max(r.z.burn || 0, 2.5); r.z.burnBy = p.i; } ends.push(r2(p.x + dx * r.d), r2(p.y + dy * r.d), r2(sz + d3 * r.d)); }
    p.mAim = a; emit({ k: 'efe', o: p.i, x: r2(p.x), y: r2(p.y), z: r2(sz), e: ends, a: r2(a) }); noiseAt(p.x, p.y, 8, p.z); return;
  }
  T = evoTarget(p, M, M.reach + 1); if (T) a = Math.atan2(T.y - p.y, T.x - p.x); p.mAim = a; const ca = Math.cos(a), sa = Math.sin(a);
  emit({ k: 'mpunch', o: p.i, s: p.mside, c: p.mcmb, a: r2(a) });
  if (M.atk === 'breath') { // 赤龙: a cone of fire
    let n = 0; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 3) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > M.reach + z.r || Math.cos(angDiff(Math.atan2(dy, dx), a)) < Math.cos(0.45) && d > 0.8) continue; if (!los(p.x, p.y, p.z + 1.2, z.x, z.y, z.z + z.h * 0.5)) continue;
      hurtZombie(z, M.dmg * mul, p, ca * 0.3, sa * 0.3, true); z.burn = Math.max(z.burn || 0, 3); z.burnBy = p.i; n++; }
    if (!(p._brT > W.t)) { p._brT = W.t + 0.1; emit({ k: 'ebr', o: p.i, a: r2(a) }); } noiseAt(p.x, p.y, 6, p.z); return;
  }
  if (M.atk === 'bite') { // 青蛇: strikes at the target, a short lunge, venom
    const d = T ? Math.hypot(T.x - p.x, T.y - p.y) : 0; if (T && d > 1.4) { const st = Math.min(d - 1.1, M.reach - 1); mechMove(p, { dash: { dx: ca * st, dy: sa * st, t: 0, T: 0.14 } }); }
    let n = 0; const hx = p.x + ca * Math.min(d || 1.4, M.reach), hy = p.y + sa * Math.min(d || 1.4, M.reach);
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.4) continue; if (Math.hypot(z.x - hx, z.y - hy) > 1.25 + z.r) continue; hurtZombie(z, M.dmg * mul, p, ca * 2, sa * 2); z.psn = Math.max(z.psn || 0, 4); z.psnBy = p.i; z.psnM = mul; z.stun = Math.max(z.stun || 0, 0.25); n++; }
    emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(hx), y: r2(hy), z: r2(p.z + 0.6), r: 1.2, bite: 1 }); return;
  }
  if (M.atk === 'hop') { // 玉兔: hop onto the target and stamp
    const d = T ? Math.min(M.reach, Math.hypot(T.x - p.x, T.y - p.y)) : 3, L = evoLand(p, a, d, 2) || { x: p.x, y: p.y, L: p.L };
    mechMove(p, { jmp: { t: 0, T: 0.45, x0: p.x, y0: p.y, x1: L.x, y1: L.y, L: L.L, h: 1.8, mech: 1 } });
    (W.dly = W.dly || []).push({ t: 0.45, stomp: 1, x: L.x, y: L.y, L: L.L, R: 2.4, dmg: M.dmg * mul, o: p.i, st: 0.9 }); return;
  }
  if (M.atk === 'shell') { // 玄龟: rams forward with the shell
    mechMove(p, { dash: { dx: ca * 0.8, dy: sa * 0.8, t: 0, T: 0.12 } }); (W.dly = W.dly || []).push({ t: 0.12, stomp: 1, x: p.x + ca * 1.6, y: p.y + sa * 1.6, L: p.L, R: 2.8, dmg: M.dmg * mul, o: p.i, st: 0.7, kb: 9 }); return;
  }
  if (M.atk === 'claw') { // 铁熊: left paw, right paw, then both paws slam down
    if (T) { const d = Math.hypot(T.x - p.x, T.y - p.y); if (d > M.reach * 0.75 + 0.2) { const st = Math.min(d - M.reach * 0.75, 2); mechMove(p, { dash: { dx: ca * st, dy: sa * st, t: 0, T: 0.12 } }); } }
    if (p.mcmb === 2) { (W.dly = W.dly || []).push({ t: 0.22, stomp: 1, x: p.x + ca * 1.9, y: p.y + sa * 1.9, L: p.L, R: 2.6, dmg: M.dmg * 1.5 * mul, o: p.i, st: 1.0, kb: 7 }); return; }
    (W.dly = W.dly || []).push({ t: 0.14, claw: 1, a, o: p.i, dmg: M.dmg * mul }); return;
  }
}
function evoClaw(p, a, dmg) { const M = mechOf(p); let n = 0;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.6) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > M.reach + z.r || Math.cos(angDiff(Math.atan2(dy, dx), a)) < Math.cos(M.arc || 1.5) && d > 0.6) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, dmg, p, dx / (d || 1) * (big ? 1 : 5), dy / (d || 1) * (big ? 1 : 5)); z.stun = Math.max(z.stun || 0, big ? 0.05 : 0.4); n++; }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(p.x + Math.cos(a) * 2), y: r2(p.y + Math.sin(a) * 2), z: r2(p.z + 0.4), r: 1, claw: 1 }); }
function evoSkill(p, M, ang, dist, tx, ty) {
  const mul = evoMul(p), ca = Math.cos(ang), sa = Math.sin(ang);
  if (M.skill === 'venom') { const D = clamp(dist, 0, 7), x = p.x + ca * D, y = p.y + sa * D; (W.cz = W.cz || []).push({ k: 4, x: r2(x), y: r2(y), z: r2(p.z), r: 4.5, t: 6, o: p.i, m: mul }); emit({ k: 'mskill', o: p.i, t: 'venom', x: r2(x), y: r2(y), z: r2(p.z) }); }
  else if (M.skill === 'dragdash') { const D = 10; let ex = p.x, ey = p.y; let L1 = p.L; for (let s = 0; s < D * 4; s++) { const nx = ex + ca * 0.25, ny = ey + sa * 0.25; if (Math.floor(nx) !== Math.floor(ex) || Math.floor(ny) !== Math.floor(ey)) { const L2_ = transition(Math.floor(ex), Math.floor(ey), Math.floor(nx), Math.floor(ny), L1, 'p', true); if (L2_ < 0) break; L1 = L2_; } ex = nx; ey = ny; }
    const L2 = Math.hypot(ex - p.x, ey - p.y);
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - p.z) > 2.6) continue; const rx = z.x - p.x, ry = z.y - p.y, t = clamp(rx * ca + ry * sa, 0, L2), off = Math.hypot(rx - ca * t, ry - sa * t); if (off > 1.6 + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju, sd = Math.sign(ca * ry - sa * rx) || 1, kb = big ? 1 : 6; hurtZombie(z, 260 * mul, p, -sa * sd * kb, ca * sd * kb); z.burn = Math.max(z.burn || 0, 4); z.burnBy = p.i; z.stun = Math.max(z.stun || 0, big ? 0.2 : 0.8); }
    mechMove(p, { dash: { t: 0, T: 0.42, dx: ex - p.x, dy: ey - p.y } }); emit({ k: 'mskill', o: p.i, t: 'dragdash', x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(ang), d: r2(L2) }); }
  else if (M.skill === 'moon') { const L = evoLand(p, ang, clamp(dist, 3, 14), 3); if (!L) { emit({ k: 'deny', p: p.i, why: '那里落不了地：要空旷的地面' }); return; }
    mechMove(p, { jmp: { t: 0, T: 0.95, x0: p.x, y0: p.y, x1: L.x, y1: L.y, L: L.L, h: 5.5, mech: 1 } }); (W.dly = W.dly || []).push({ t: 0.95, stomp: 1, moon: 1, x: L.x, y: L.y, L: L.L, R: 6, dmg: 320 * mul, o: p.i, st: 1.5, kb: 9 });
    emit({ k: 'mskill', o: p.i, t: 'moon', x: r2(p.x), y: r2(p.y), z: r2(p.z), e: [r2(L.x), r2(L.y)] }); }
  else if (M.skill === 'spin') { p.spinT = 4; p.spinHit = 0; emit({ k: 'mskill', o: p.i, t: 'spin', x: r2(p.x), y: r2(p.y), z: r2(p.z) }); }
  else if (M.skill === 'rebirth') { const cz = inAirZ(p) != null ? inAirZ(p) : p.z;
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 6 + z.r || Math.abs(z.z - cz) > 6) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 240 * mul, p, dx / (d || 1) * (big ? 1 : 6), dy / (d || 1) * (big ? 1 : 6)); z.burn = Math.max(z.burn || 0, 4); z.burnBy = p.i; }
    p.mh = p.mh || []; p.mh[p.veh] = Math.min(MECHS[p.veh].hp, mhpOf(p) + MECHS[p.veh].hp * 0.4);
    for (const q of W.p) { if (q.gone || q.dead || q === p || Math.hypot(q.x - p.x, q.y - p.y) > 8) continue; if (q.down) continue; q.hp = Math.min(q.maxHp, q.hp + 60); emit({ k: 'sfx', n: 'heal', x: q.x, y: q.y }); }
    emit({ k: 'mskill', o: p.i, t: 'rebirth', x: r2(p.x), y: r2(p.y), z: r2(cz) }); }
  else if (M.skill === 'roar') { for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 9 + z.r || Math.abs(z.z - p.z) > 3) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju;
      if (d < 4) hurtZombie(z, 120 * mul, p, dx / (d || 1) * (big ? 1 : 5), dy / (d || 1) * (big ? 1 : 5)); z.stun = Math.max(z.stun || 0, big ? 0.6 : 2.5); }
    p.rageT = 8; emit({ k: 'mskill', o: p.i, t: 'roar', x: r2(p.x), y: r2(p.y), z: r2(p.z) }); }
  p.mcd = M.cd; noiseAt(p.x, p.y, 10, p.z);
}
