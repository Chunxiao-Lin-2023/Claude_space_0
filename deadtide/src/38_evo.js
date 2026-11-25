/* ---------- (round 37) 第二形态: beasts ----------
   A mech fills its 进化 meter by killing (in mech form). Full → X (tap) turns it into its beast for BAL.evoT seconds:
   疾风 → 青蛇, 赤刃 → 赤龙, 工蜂 → 玉兔, 铁卫 → 玄龟, 苍隼 → 火凤, 重炮 → 铁熊. Same hull; mechOf(p) returns the EVO entry while p.evoOn,
   so speed / armour / fire / skill keys all route here. X again (or the meter running out) → back to the mech; hold X → straight to the vehicle. */
const evoMul = p => mechMul() * (p && p.rageT > 0 ? 1.4 : 1);
function evoGainKill(p, z) {
  if (!p || p.i == null || !(inMech(p) || (p.vehs || 0) & 126)) return; const T = ZT[z.k], big = T.boss || T.kaiju || T.elite || z.k === 'brute' || z.k === 'armored'; /* (round 38i) any kill counts once you have a vehicle (= a mech) */
  if (p.evoOn) { p.evo = Math.min(BAL.evoCap, (p.evo || 0) + (big ? 6 : 1.5)); if (p.veh === 6) { p.mh = p.mh || []; p.mh[6] = Math.min(MECHS[6].hp, mhpOf(p) + MECHS[6].hp * 0.015); } return; } // in beast form a kill stretches it a little; 铁熊 heals on kills
  const was = p.evo || 0; p.evo = Math.min(BAL.evoCap, was + (T.kaiju ? 40 : big ? BAL.evoBig : BAL.evoKill));
  if (was < 100 && p.evo >= 100) emit({ k: 'evoready', p: p.i, n: EVO[p.veh] ? EVO[p.veh].name : '神兽', m: inMech(p) ? 1 : 0 });
}
function evolve(p) {
  const E = EVO[p.veh]; if (!E || !inMech(p) || p.evoOn || (p.evo || 0) < 100 || p.mtr > 0) return;
  ccClear(p); /* (round 38g) evolving breaks every hold */ p.evoOn = true; p.gcd = 0.4; /* (round 38i) the meter keeps what was banked over 100: it just lasts longer */ p.mcd = Math.min(p.mcd || 0, 1); p.spinT = 0; p.rageT = 0; if (E.k === 'phoenix') { p.mfly = true; p.land = false; }
  p.mh = p.mh || []; if (W.t - (p.evoLastT || -99) > 30) p.mh[p.veh] = Math.min(MECHS[p.veh].hp, mhpOf(p) + MECHS[p.veh].hp * 0.3); p.evoLastT = W.t; // it comes out fresh: +30% hull (once per 30 s, so switching back and forth doesn't heal)
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.6)) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > BAL.evoBurst + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 100 * mechMul(), p, dx / (d || 1) * (big ? 1 : 8), dy / (d || 1) * (big ? 1 : 8)); z.stun = Math.max(z.stun || 0, big ? 0.3 : 1); }
  emit({ k: 'evo', o: p.i, on: 1, v: p.veh, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); noiseAt(p.x, p.y, 10, p.z);
}
function devolve(p, why) {
  if (!p.evoOn) return; p.evoOn = false; p.spinT = 0; p.rageT = 0; p.rebT = 0; p.gcd = 0.3; /* (round 38i) turning back keeps what is left in the meter (banked time is not lost) */
  if (p.veh === 5 && p.mfly && (p.bat || 0) < 15) p.land = true; // 火凤 back to 苍隼: low on charge, it comes down
  emit({ k: 'evo', o: p.i, on: 0, v: p.veh, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); if (why === 'out') emit({ k: 'deny', p: p.i, why: EVO[p.veh].name + '的力量用完了，变回' + MECHS[p.veh].name });
}
// host, every step for every player
function evoStep(p, dt) {
  if (p.evoOn && (!inMech(p) || !EVO[p.veh])) { p.evoOn = false; p.spinT = 0; p.rageT = 0; p.rebT = 0; }
  if (!p.evoOn) return;
  p.evo -= 100 / BAL.evoT * dt; if (p.evo <= 0) { p.evo = 0; devolve(p, 'out'); return; }
  if (p.rageT > 0) p.rageT -= dt;
  if (p.rebT > 0) { p.rebT -= dt; p.rebTk = (p.rebTk || 0) - dt; if (p.rebTk <= 0) { p.rebTk = 0.25; const cz = inAirZ(p) != null ? inAirZ(p) : p.z, mul = evoMul(p); // (round 38c) 火凤 涅槃之火: burns what is near, keeps the team going
      for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.hypot(z.x - p.x, z.y - p.y) > 4.2 + z.r || Math.abs(z.z - cz) > 5) continue; hurtZombie(z, 30 * 0.25 * mul, p, 0, 0, true); z.burn = Math.max(z.burn || 0, 1.5); z.burnBy = p.i; }
      for (const q of W.p) { if (q.gone || q.dead || q.down || Math.hypot(q.x - p.x, q.y - p.y) > 8) continue; if (q === p) { p.mh = p.mh || []; p.mh[p.veh] = Math.min(MECHS[p.veh].hp, mhpOf(p) + MECHS[p.veh].hp * 0.0025); } else q.hp = Math.min(q.maxHp, q.hp + 2); } } }
  if (p.spinT > 0) { p.spinT -= dt; p.spinHit = (p.spinHit || 0) - dt; // 玄龟 旋甲: everything it touches gets knocked away
    if (p.spinHit <= 0) { p.spinHit = 0.4; let n = 0; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2)) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 2.6 + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 70 * evoMul(p), p, dx / (d || 1) * (big ? 1.5 : 9), dy / (d || 1) * (big ? 1.5 : 9)); z.stun = Math.max(z.stun || 0, big ? 0.1 : 0.6); n++; }
      if (n) emit({ k: 'mhit', o: p.i, h: 1, x: r2(p.x), y: r2(p.y), z: r2(p.z + 0.2), g: 1, r: 2.6 }); } }
}
// world: poison on zombies (z.psn) and the 毒雾 clouds (W.cz k 4: slow + damage)
function stepEvoWorld(dt) {
  W.evoTk = (W.evoTk || 0) - dt; const tick = W.evoTk <= 0; if (tick) W.evoTk = 0.25;
  for (const z of W.zs) { if (z.hp <= 0 || !(z.psn > 0)) continue; z.psn -= dt; hurtZombie(z, 12 * dt * (z.psnM || 1), W.p[z.psnBy] || null, 0, 0, true); }
  if (W.evz && W.evz.length) { for (const Zn of W.evz) { Zn.t -= dt; if (!tick) continue; const o = W.p[Zn.o] || null; // (round 38c) lingering skill zones: 赤龙's fire trail, 玉兔's moonlight
      for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - Zn.z) > 1.8) continue; let d;
        if (Zn.k === 'fire') { const ax = Zn.x2 - Zn.x, ay = Zn.y2 - Zn.y, l2 = ax * ax + ay * ay || 1, u = clamp(((z.x - Zn.x) * ax + (z.y - Zn.y) * ay) / l2, 0, 1); d = Math.hypot(z.x - Zn.x - ax * u, z.y - Zn.y - ay * u); } else d = Math.hypot(z.x - Zn.x, z.y - Zn.y);
        if (d > Zn.r + z.r) continue; if (Zn.k === 'fire') { hurtZombie(z, 30 * 0.25 * Zn.m, o, 0, 0, true); z.burn = Math.max(z.burn || 0, 2); z.burnBy = Zn.o; } else { hurtZombie(z, 22 * 0.25 * Zn.m, o, 0, 0, true); z.stun = Math.max(z.stun || 0, 0.15); } } }
    W.evz = W.evz.filter(Zn => Zn.t > 0); }
  if (tick && W.cz) for (const c of W.cz) { if (c.k !== 4) continue; const o = W.p[c.o];
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - c.z) > 1.8 || Math.hypot(z.x - c.x, z.y - c.y) > c.r + z.r) continue; hurtZombie(z, 30 * 0.25 * (c.m || 1), o || null, 0, 0, true); z.psn = Math.max(z.psn || 0, 1); z.psnBy = c.o; z.psnM = c.m || 1; } }
}
// a round blow on the ground (shell bash, paw slam, landing): everything inside takes it
function evoRound(p, cx, cy, R, dmg, kb, stun, psn, psnM, ring) { let n = 0;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.6)) continue; const dx = z.x - cx, dy = z.y - cy, d = Math.hypot(dx, dy); if (d > R + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, dmg, p, dx / (d || 1) * (big ? kb * 0.15 : kb), dy / (d || 1) * (big ? kb * 0.15 : kb)); z.stun = Math.max(z.stun || 0, big ? 0.1 : stun); if (psn) { z.psn = Math.max(z.psn || 0, psn); z.psnBy = p.i; z.psnM = psnM || 1; } n++; }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(cx), y: r2(cy), z: r2(p.z + 0.15), g: ring === 'whip' ? 0 : 1, r: R, ev: ring || undefined }); return n; }
// open ground near a point (for hops and the 月落 landing): standable, nothing overhead, not water
function evoLand(p, ang, D, rMax) {
  for (let r = 0; r <= rMax; r++) for (let k = 0; k < (r ? 12 : 1); k++) { const a2 = k / 12 * Math.PI * 2, x = p.x + Math.cos(ang) * D + Math.cos(a2) * r, y = p.y + Math.sin(ang) * D + Math.sin(a2) * r, cx = Math.floor(x), cy = Math.floor(y);
    if (!inMap(cx, cy)) continue; const g = gAt(cx, cy); if (skyTop(cx, cy) > g || !standable(cx, cy, g, 'p') || ttAt(cx, cy) === TT.water) continue; return { x: cx + 0.5, y: cy + 0.5, L: g }; }
  return null;
}
// how far it can go along a line before a wall or a drop it can't take
function evoLineEnd(p, ang, D) { const ca = Math.cos(ang), sa = Math.sin(ang); let ex = p.x, ey = p.y, L1 = p.L;
  for (let s = 0; s < D * 4; s++) { const nx = ex + ca * 0.25, ny = ey + sa * 0.25; if (Math.floor(nx) !== Math.floor(ex) || Math.floor(ny) !== Math.floor(ey)) { const L2 = transition(Math.floor(ex), Math.floor(ey), Math.floor(nx), Math.floor(ny), L1, 'p', true); if (L2 < 0) break; L1 = L2; } ex = nx; ey = ny; }
  return { x: ex, y: ey }; }
// the target a beast attack goes for (mechLock with the beast's reach), and the angle to it
const EVO_AA = { snake: 'venom', dragon: 'fire', rabbit: 'moon', turtle: 'water', bear: 'rock' }; /* (round 44) what each beast throws at a flyer it can't reach */
function evoTarget(p, M, range) { const T = mechLock(p, Object.assign({}, M, { atk: 'kick', reach: range - 2.4 })); return T; }
function evoAttack(p, M) {
  const mul = evoMul(p); if (p.rageT > 0) p.gcd *= 0.75;
  p.mcmb = W.t - (p.mlastT || -9) < M.rate + 0.5 ? ((p.mcmb || 0) + 1) % 3 : 0; p.mlastT = W.t;
  let T = null, a = p.aim;
  if (M.atk === 'feather') { // 火凤: a fan of five burning feathers
    const A = p.aimPt && !p.aimPt.auto ? p.aimPt : null; if (!A) { T = mgunPick(p, M.range, p.x, p.y, (inAirZ(p) != null ? inAirZ(p) : p.z) + 0.6); if (T) a = Math.atan2(T.y - p.y, T.x - p.x); } else a = Math.atan2(A.y - p.y, A.x - p.x);
    const sz = (inAirZ(p) != null ? inAirZ(p) : p.z) + 0.9, tz = T ? T.z + T.h * 0.5 : A && A.z != null ? A.z + 0.4 : p.z + 0.4, ends = [], starts = [], px_ = -Math.sin(a), py_ = Math.cos(a); /* (round 38b) the wings flap and the feathers leave from the wing tips */
    for (let k = -2; k <= 2; k++) { const wing = k < 0 ? -1 : k > 0 ? 1 : (p._fw = -(p._fw || 1)), off = wing * (0.7 + Math.abs(k) * 0.35), ox = p.x + px_ * off * 1.25, oy = p.y + py_ * off * 1.25, oz = sz + 0.25 - Math.abs(k) * 0.08;
      const gx = T ? T.x : A ? A.x : p.x + Math.cos(a) * 8, gy = T ? T.y : A ? A.y : p.y + Math.sin(a) * 8, aa = Math.atan2(gy - oy, gx - ox) + k * 0.07, hd = Math.max(1, Math.hypot(gx - ox, gy - oy)), /* each feather converges on the target from its wing */ dz = (tz - oz) / Math.max(1, hd); let dx = Math.cos(aa), dy = Math.sin(aa), d3 = dz; const n = Math.hypot(dx, dy, d3); dx /= n; dy /= n; d3 /= n;
      const r = mgunRay(ox, oy, oz, dx, dy, d3, M.range); if (r.z) { hurtZombie(r.z, M.dmg * mul, p, dx * 0.6, dy * 0.6); r.z.burn = Math.max(r.z.burn || 0, 2.5); r.z.burnBy = p.i; } starts.push(r2(ox), r2(oy), r2(oz)); ends.push(r2(ox + dx * r.d), r2(oy + dy * r.d), r2(oz + d3 * r.d)); }
    p.mAim = a; emit({ k: 'efe', o: p.i, x: r2(p.x), y: r2(p.y), z: r2(sz), s: starts, e: ends, a: r2(a) }); noiseAt(p.x, p.y, 8, p.z); return;
  }
  T = evoTarget(p, M, M.reach + 1); if (T) a = Math.atan2(T.y - p.y, T.x - p.x);
  { const far = !T || Math.hypot(T.x - p.x, T.y - p.y) > M.reach + T.r + 0.4 || ZT[T.k].fly && Math.abs(T.z - p.z) > 2.6 && Math.hypot(T.x - p.x, T.y - p.y) > M.reach * 0.75; const AA = far ? aaPick(p, M) : null; /* (round 44) a flyer out of reach: each beast has its own anti-air throw */
    if (AA) { const aa = Math.atan2(AA.y - p.y, AA.x - p.x); p.mAim = aa; emit({ k: 'mpunch', o: p.i, s: p.mside, c: p.mcmb, a: r2(aa) }); aaShot(p, AA, EVO_AA[M.k] || 'fire', M.dmg * mul * BAL.aaMul); return; } }
  p.mAim = a; const ca = Math.cos(a), sa = Math.sin(a);
  emit({ k: 'mpunch', o: p.i, s: p.mside, c: p.mcmb, a: r2(a) });
  if (M.atk === 'breath') { // 赤龙: a cone of fire
    let n = 0; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 3)) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > M.reach + z.r || Math.cos(angDiff(Math.atan2(dy, dx), a)) < Math.cos(0.45) && d > 0.8) continue; if (!los(p.x, p.y, p.z + 1.2, z.x, z.y, z.z + z.h * 0.5)) continue;
      hurtZombie(z, M.dmg * mul, p, ca * 0.3, sa * 0.3, true); z.burn = Math.max(z.burn || 0, 3); z.burnBy = p.i; n++; }
    if (!(p._brT > W.t)) { p._brT = W.t + 0.1; emit({ k: 'ebr', o: p.i, a: r2(a) }); } noiseAt(p.x, p.y, 6, p.z); return;
  }
  if (M.atk === 'bite') { // (round 38c) 青蛇 fights with its tail only: two big whips round a full circle, then the tail comes over its head and slams down in front
    if (p.mcmb < 2) (W.dly = W.dly || []).push({ t: 0.33, stomp: 1, x: p.x - ca * 0.4, y: p.y - sa * 0.4, L: p.L, R: 3.6, dmg: M.dmg * 1.6 * mul, o: p.i, st: 1.0, kb: 11, psn: 3, psnM: mul, ring: 'whip' });
    else (W.dly = W.dly || []).push({ t: 0.43, stomp: 1, x: p.x + ca * 2.6, y: p.y + sa * 2.6, L: p.L, R: 2.7, dmg: M.dmg * 2.2 * mul, o: p.i, st: 1.6, kb: 6, psn: 3, psnM: mul, ring: 'tslam' });
    return;
  }
  if (M.atk === 'bite_old') { // (unused since round 38c) the old lunge bite
    const d = T ? Math.hypot(T.x - p.x, T.y - p.y) : 0; if (T && d > 1.4) { const st = Math.min(d - 1.1, M.reach - 1); mechMove(p, { dash: { dx: ca * st, dy: sa * st, t: 0, T: 0.14 } }); }
    let n = 0; const hx = p.x + ca * Math.min(d || 1.4, M.reach), hy = p.y + sa * Math.min(d || 1.4, M.reach);
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.4)) continue; if (Math.hypot(z.x - hx, z.y - hy) > 1.25 + z.r) continue; hurtZombie(z, M.dmg * mul, p, ca * 2, sa * 2); z.psn = Math.max(z.psn || 0, 4); z.psnBy = p.i; z.psnM = mul; z.stun = Math.max(z.stun || 0, 0.25); n++; }
    emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(hx), y: r2(hy), z: r2(p.z + 0.6), r: 1.2, bite: 1 }); return;
  }
  if (M.atk === 'ears') { // (round 38d) 玉兔: both ears stretch out and lash down in front; the third lash hits harder
    if (p.mcmb === 2) (W.dly = W.dly || []).push({ t: 0.32, earspin: 1, o: p.i, dmg: M.dmg * mul * 1.6 }); /* the third one spins round, ears out */
    else (W.dly = W.dly || []).push({ t: 0.27, ears: 1, a, o: p.i, dmg: M.dmg * mul }); return;
  }
  if (M.atk === 'shell') { // (round 38b) 玄龟: pulls in and charges with the shell — 3.6 tiles, everything on the way is rammed aside, a thump where it stops
    const E2 = evoLineEnd(p, a, 3.6), L2 = Math.hypot(E2.x - p.x, E2.y - p.y); let n = 0;
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.4)) continue; const rx = z.x - p.x, ry = z.y - p.y, t = clamp(rx * ca + ry * sa, 0, L2 + 0.8), off = Math.hypot(rx - ca * t, ry - sa * t); if (off > 1.5 + z.r) continue;
      const big = ZT[z.k].boss || ZT[z.k].kaiju, sd = Math.sign(ca * ry - sa * rx) || 1, kb = big ? 1 : 7; hurtZombie(z, M.dmg * mul, p, ca * kb * 0.7 - sa * sd * kb * 0.7, sa * kb * 0.7 + ca * sd * kb * 0.7); z.stun = Math.max(z.stun || 0, big ? 0.15 : 0.8); n++; }
    mechMove(p, { dash: { t: 0, T: 0.3, dx: E2.x - p.x, dy: E2.y - p.y } }); (W.dly = W.dly || []).push({ t: 0.3, stomp: 1, x: E2.x + ca * 0.8, y: E2.y + sa * 0.8, L: p.L, R: 1.8, dmg: M.dmg * 0.4 * mul, o: p.i, st: 0.4, kb: 6, ring: 'ram' }); return;
  }
  if (M.atk === 'claw') { // 铁熊 (round 43): a shoulder charge into them, then the paw comes down — left, right, then a pounce and both paws; no zombie within BAL.bearSee: slaps on the spot
    const third = p.mcmb === 2, want = third ? BAL.bearLunge3 : BAL.bearLunge; let E2 = { x: p.x, y: p.y };
    if (T && Math.hypot(T.x - p.x, T.y - p.y) <= BAL.bearSee + T.r) { const st = clamp(Math.hypot(T.x - p.x, T.y - p.y) - (third ? 1.5 : 1.7), 0, want);
      if (st > 0.3) { E2 = evoLineEnd(p, a, st); const L2 = Math.hypot(E2.x - p.x, E2.y - p.y);
        for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.4)) continue; const rx = z.x - p.x, ry = z.y - p.y, tt = clamp(rx * ca + ry * sa, 0, L2), off = Math.hypot(rx - ca * tt, ry - sa * tt); if (off > 1.1 + z.r) continue; /* rammed on the way: half a blow, shoved aside */
          const big = ZT[z.k].boss || ZT[z.k].kaiju, sd = Math.sign(ca * ry - sa * rx) || 1, kb = big ? 0.8 : 5; hurtZombie(z, M.dmg * BAL.bearRam * mul, p, ca * kb * 0.6 - sa * sd * kb * 0.7, sa * kb * 0.6 + ca * sd * kb * 0.7); z.stun = Math.max(z.stun || 0, big ? 0.1 : 0.4); }
        mechMove(p, { dash: { t: 0, T: 0.13, dx: E2.x - p.x, dy: E2.y - p.y } }); emit({ k: 'blunge', o: p.i, x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(a), d: r2(L2) }); } }
    if (third) { (W.dly = W.dly || []).push({ t: 0.24, stomp: 1, x: E2.x + ca * 1.9, y: E2.y + sa * 1.9, L: p.L, R: 2.6, dmg: M.dmg * 1.5 * mul, o: p.i, st: 1.0, kb: 7 }); return; }
    (W.dly = W.dly || []).push({ t: 0.18, stomp: 1, x: E2.x + ca * 2.1, y: E2.y + sa * 2.1, L: p.L, R: 1.9, dmg: M.dmg * mul, o: p.i, st: 0.6, kb: 4, ring: 'slap' }); return; /* (round 38b) a paw raised high and slapped down on them */
  }
}
function evoEars(p, a, dmg, hard) { const M = mechOf(p), ca = Math.cos(a), sa = Math.sin(a), R = M.reach || 6.2; let n = 0; // a strip 3 tiles wide straight ahead
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.6)) continue; const rx = z.x - p.x, ry = z.y - p.y, t = rx * ca + ry * sa, off = Math.abs(rx * sa - ry * ca); if (t < -0.3 || t > R + z.r || off > 1.5 + z.r) continue;
    const big = ZT[z.k].boss || ZT[z.k].kaiju, kb = big ? 0.8 : hard ? 8 : 5; hurtZombie(z, dmg, p, ca * kb, sa * kb); z.stun = Math.max(z.stun || 0, big ? 0.15 : hard ? 1.0 : 0.45); n++; }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(p.x + ca * R * 0.75), y: r2(p.y + sa * R * 0.75), z: r2(p.z + 0.3), r: hard ? 1.6 : 1.1, claw: 1 }); noiseAt(p.x, p.y, 6, p.z); }
function evoEarSpin(p, dmg) { const R = 5.8; let n = 0; // (round 38e) 玉兔's third lash: a full turn with the ears stretched out — everything around is flung away
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.6)) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > R + z.r) continue;
    const big = ZT[z.k].boss || ZT[z.k].kaiju, kb = big ? 1 : 9; hurtZombie(z, dmg, p, dx / (d || 1) * kb, dy / (d || 1) * kb); z.stun = Math.max(z.stun || 0, big ? 0.2 : 1.0); n++; }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(p.x), y: r2(p.y), z: r2(p.z + 0.3), r: R, g: 0 }); noiseAt(p.x, p.y, 8, p.z); }
function evoClaw(p, a, dmg) { const M = mechOf(p); let n = 0;
  for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.6)) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > M.reach + z.r || Math.cos(angDiff(Math.atan2(dy, dx), a)) < Math.cos(M.arc || 1.5) && d > 0.6) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, dmg, p, dx / (d || 1) * (big ? 1 : 5), dy / (d || 1) * (big ? 1 : 5)); z.stun = Math.max(z.stun || 0, big ? 0.05 : 0.4); n++; }
  emit({ k: 'mhit', o: p.i, h: n ? 1 : 0, x: r2(p.x + Math.cos(a) * 2), y: r2(p.y + Math.sin(a) * 2), z: r2(p.z + 0.4), r: 1, claw: 1 }); }
function evoSkill(p, M, ang, dist, tx, ty) {
  const mul = evoMul(p), ca = Math.cos(ang), sa = Math.sin(ang);
  if (M.skill === 'venom') { const D = clamp(dist, 0, 7), x = p.x + ca * D, y = p.y + sa * D; (W.cz = W.cz || []).push({ k: 4, x: r2(x), y: r2(y), z: r2(p.z), r: 4.5, t: 9, o: p.i, m: mul }); /* (round 38c) 6 → 9 s */ emit({ k: 'mskill', o: p.i, t: 'venom', x: r2(x), y: r2(y), z: r2(p.z) }); }
  else if (M.skill === 'dragdash') { const D = 12; /* (round 38c) 10 → 12, and it leaves a burning trail */ let ex = p.x, ey = p.y; let L1 = p.L; for (let s = 0; s < D * 4; s++) { const nx = ex + ca * 0.25, ny = ey + sa * 0.25; if (Math.floor(nx) !== Math.floor(ex) || Math.floor(ny) !== Math.floor(ey)) { const L2_ = transition(Math.floor(ex), Math.floor(ey), Math.floor(nx), Math.floor(ny), L1, 'p', true); if (L2_ < 0) break; L1 = L2_; } ex = nx; ey = ny; }
    const L2 = Math.hypot(ex - p.x, ey - p.y);
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden || !zReach(z, p, 2.6)) continue; const rx = z.x - p.x, ry = z.y - p.y, t = clamp(rx * ca + ry * sa, 0, L2), off = Math.hypot(rx - ca * t, ry - sa * t); if (off > 1.6 + z.r) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju, sd = Math.sign(ca * ry - sa * rx) || 1, kb = big ? 1 : 6; hurtZombie(z, 260 * mul, p, -sa * sd * kb, ca * sd * kb); z.burn = Math.max(z.burn || 0, 4); z.burnBy = p.i; z.stun = Math.max(z.stun || 0, big ? 0.2 : 0.8); }
    (W.evz = W.evz || []).push({ k: 'fire', x: p.x, y: p.y, x2: ex, y2: ey, z: p.z, r: 1.3, t: 5, o: p.i, m: mul }); emit({ k: 'ezone', zk: 'fire', x: r2(p.x), y: r2(p.y), x2: r2(ex), y2: r2(ey), z: r2(p.z), r: 1.3, t: 5 });
    mechMove(p, { dash: { t: 0, T: 0.42, dx: ex - p.x, dy: ey - p.y } }); emit({ k: 'mskill', o: p.i, t: 'dragdash', x: r2(p.x), y: r2(p.y), z: r2(p.z), a: r2(ang), d: r2(L2) }); }
  else if (M.skill === 'moon') { const L = evoLand(p, ang, clamp(dist, 3, 14), 3); if (!L) { emit({ k: 'deny', p: p.i, why: '那里落不了地：要空旷的地面' }); return; }
    mechMove(p, { jmp: { t: 0, T: 0.95, x0: p.x, y0: p.y, x1: L.x, y1: L.y, L: L.L, h: 5.5, mech: 1 } }); (W.dly = W.dly || []).push({ t: 0.95, stomp: 1, moon: 1, x: L.x, y: L.y, L: L.L, R: 6, dmg: 320 * mul, o: p.i, st: 1.5, kb: 9, zone: 6 }); /* (round 38c) then 6 s of moonlight on the crater */
    emit({ k: 'mskill', o: p.i, t: 'moon', x: r2(p.x), y: r2(p.y), z: r2(p.z), e: [r2(L.x), r2(L.y)] }); }
  else if (M.skill === 'spin') { p.spinT = 6; p.spinHit = 0; /* (round 38c) 4 → 6 s */ emit({ k: 'mskill', o: p.i, t: 'spin', x: r2(p.x), y: r2(p.y), z: r2(p.z) }); }
  else if (M.skill === 'rebirth') { const cz = inAirZ(p) != null ? inAirZ(p) : p.z;
    for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 6 + z.r || Math.abs(z.z - cz) > 6) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju; hurtZombie(z, 240 * mul, p, dx / (d || 1) * (big ? 1 : 6), dy / (d || 1) * (big ? 1 : 6)); z.burn = Math.max(z.burn || 0, 4); z.burnBy = p.i; }
    p.mh = p.mh || []; p.mh[p.veh] = Math.min(MECHS[p.veh].hp, mhpOf(p) + MECHS[p.veh].hp * 0.4);
    for (const q of W.p) { if (q.gone || q.dead || q === p || Math.hypot(q.x - p.x, q.y - p.y) > 8) continue; if (q.down) continue; q.hp = Math.min(q.maxHp, q.hp + 60); emit({ k: 'sfx', n: 'heal', x: q.x, y: q.y }); }
    p.rebT = 7; p.rebTk = 0; /* (round 38c) then 7 s of the rebirth fire around it */ emit({ k: 'mskill', o: p.i, t: 'rebirth', x: r2(p.x), y: r2(p.y), z: r2(cz) }); }
  else if (M.skill === 'roar') { for (const z of W.zs) { if (z.hp <= 0 || z.hidden) continue; const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 9 + z.r || !zReach(z, p, 3)) continue; const big = ZT[z.k].boss || ZT[z.k].kaiju;
      if (d < 4) hurtZombie(z, 120 * mul, p, dx / (d || 1) * (big ? 1 : 5), dy / (d || 1) * (big ? 1 : 5)); z.stun = Math.max(z.stun || 0, big ? 0.8 : 3.5); }
    p.rageT = 12; /* (round 38c) stun 2.5 → 3.5 s, rage 8 → 12 s */ emit({ k: 'mskill', o: p.i, t: 'roar', x: r2(p.x), y: r2(p.y), z: r2(p.z) }); }
  p.mcd = M.cd; noiseAt(p.x, p.y, 10, p.z);
}

/* ---------- (round 38g) control on mechs only: stagger (硬直), slow (减速), armour break (破甲), climbers hanging on (扒住) ----------
   Every one is telegraphed by its source and has an answer; the same kind landing again within 5 s lasts half as long; evolving clears them all. */
const CC_NAME = { stg: '硬直', slw: '减速', brk: '破甲', lat: '扒住' };
function mechCC(p, k, t, m, quiet) {
  if (!p || !inMech(p) || p.dead || p.mtr > 0 || p.spinT > 0) return false;
  const was = k === 'stg' ? p.ccStg > 0 : k === 'slw' ? p.ccSlw > 0 : p.ccBrk > 0;
  p.ccL = p.ccL || {}; if (!quiet) { if (W.t - (p.ccL[k] || -9) < 5) t *= 0.5; p.ccL[k] = W.t; }
  if (k === 'stg') { if ((p.ccStg || 0) >= t) return false; p.ccStg = t; }
  else if (k === 'slw') { p.ccSlw = Math.max(p.ccSlw || 0, t); p.ccSlm = Math.max(p.ccSlw > t ? p.ccSlm || 0 : 0, m || 0.4); }
  else if (k === 'brk') p.ccBrk = Math.max(p.ccBrk || 0, t);
  if (!was) emit({ k: 'mcc', p: p.i, c: k, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); return true;
}
function ccClear(p) { p.ccStg = p.ccSlw = p.ccBrk = 0; shakeOff(p, 99); }
function shakeOff(p, n) { let k = 0; // climbers clinging to this mech are thrown off (one per attack, all on a skill / transform / evolve)
  for (const z of W.zs) { if (k >= n) break; if (z.hp <= 0 || z.mlat !== p.i) continue; z.mlat = null; const a = rand() * Math.PI * 2; z.x = p.x + Math.cos(a) * 1.2; z.y = p.y + Math.sin(a) * 1.2; z.L = p.L; z.z = surfZ(z.x, z.y, z.L); z.stun = 1.2; z.kbx = Math.cos(a) * 6; z.kby = Math.sin(a) * 6; k++; }
  if (k) emit({ k: 'mcc', p: p.i, c: 'off', n: k, x: r2(p.x), y: r2(p.y), z: r2(p.z) }); return k; }
function stepCC(p, dt) { if (p.ccStg > 0) p.ccStg -= dt; if (p.ccSlw > 0) p.ccSlw -= dt; if (p.ccBrk > 0) p.ccBrk -= dt;
  if (!inMech(p)) { if (p.ccStg > 0 || p.ccSlw > 0 || p.ccBrk > 0 || p.ccLat) ccClear(p); p.ccLat = 0; return; }
  let n = 0; for (const z of W.zs) if (z.hp > 0 && z.mlat === p.i) n++; p.ccLat = n; }
const ccSpeed = p => inMech(p) ? (p.ccStg > 0 ? 0 : 1) * (p.ccSlw > 0 ? 1 - (p.ccSlm || 0.4) : 1) * (1 - 0.15 * Math.min(3, p.ccLat || 0)) : 1;
function climberLatch(z, dt) { const p = W.p[z.mlat], Z = ZT[z.k]; // a climber riding a mech: stays on it and claws the hull
  if (!p || p.dead || p.gone || !inMech(p) || p.spinT > 0) { z.mlat = null; z.z = surfZ(z.x, z.y, z.L); return; }
  z.mla = (z.mla || 0) + dt * 0.6; const a = (z.mlo || 0) + Math.sin(z.mla) * 0.4; z.x = p.x + Math.cos(a) * 0.45; z.y = p.y + Math.sin(a) * 0.45; z.L = p.L; z.z = p.z + 1.1 + Math.sin(z.mla * 3) * 0.1; z.face = a + Math.PI; z.st = 'attack'; z.atk = 0.3; z.moving = false;
  if (z.cd <= 0) { z.cd = Z.cd; hurtPlayer(p, Z.dmg * W.D.dmg, z); } }
