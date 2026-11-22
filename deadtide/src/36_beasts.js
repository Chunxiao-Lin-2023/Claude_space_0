/* ================= (round 35) flyers and 能力者 elites (host side AI) ================= */
// Flyers (尸鸦 / 尸蝠) ignore walls and paths: they cruise over the roofs toward the nearest survivor, circle overhead and take turns diving in.
// They can only get at you in the open (no roof over your cell) or in the air — a building is a shelter, a gyrocopter is not.
// Elites (能力者) walk like any zombie but carry one strong, telegraphed skill (eliteStep): blink behind you, raise more zombies, shield the pack, go invisible.

// someone the birds can reach: out under the sky, or flying
function zExposed(p) { if (!p || p.gone || p.dead) return false; if (inAirZ(p) != null) return true; return skyTop(p.x, p.y) <= p.L; }
// the height a bird dives at: the chest, a mech's cockpit, a pilot's seat
const flyAimZ = p => inAirZ(p) != null ? inAirZ(p) + 0.6 : inMech(p) ? p.z + 2.2 : p.z + (p.down ? 0.35 : 0.95);
const flyFloor = (x, y) => skyTop(x, y) * FH;

function flyerStep(z, Z, dt) {
  const F = Z.fly; z.st = 'walk'; z.kt = 0; z.atk = 0;
  z.dvCD = (z.dvCD == null ? 0.8 + rand() * F.cd : z.dvCD) - dt;
  if (z.fa == null) z.fa = rand() * Math.PI * 2;
  let tp = null, td = 1e9; // the nearest survivor (the ones under a roof count as further away: the birds prefer someone they can reach)
  for (const p of W.p) { if (p.gone || p.dead) continue; const d = Math.hypot(p.x - z.x, p.y - z.y) * (zExposed(p) ? 1 : 1.6); if (d < td) { td = d; tp = p; } }
  const cruise = () => Math.max(flyFloor(z.x, z.y), flyFloor(z.x + Math.cos(z.face) * 1.3, z.y + Math.sin(z.face) * 1.3)) + F.alt;
  let gx = z.x, gy = z.y, gz = z.z, spd = z.spd, vzMax = 3.5;
  const D = z.dv;
  if (z.latch) { // (round 36l) a bat hanging on you: it drains you until you hit it (the knife does) or it has had enough
    const L = z.latch, p = W.p[L.p]; L.t -= dt; L.tick = (L.tick || 0) - dt;
    if (!p || p.dead || p.down || L.t <= 0 || z.hp < L.hp || z.stun > 0 || inAirZ(p) != null || (p.ride && Math.hypot(p.vx || 0, p.vy || 0) > 5)) { z.latch = null; z.dvCD = F.cd; z.z += 0.6; z.kbx = (rand() - 0.5) * 6; z.kby = (rand() - 0.5) * 6; }
    else { z.x = p.x - Math.cos(p.aim) * 0.15; z.y = p.y - Math.sin(p.aim) * 0.15; z.z = flyAimZ(p) + 0.35; z.face = p.aim; z.kt = 2; z.atk = 0.3; if (L.tick <= 0) { L.tick = 0.5; hurtPlayer(p, 2 * W.D.dmg, z); z.hp = Math.min(z.max, z.hp + 2); L.hp = z.hp; } return; } }
  if (F.bomb && z.bomb) { const Bm = z.bomb; Bm.t += dt; if (Bm.t >= 1.0) { for (const p of W.p) { if (p.gone || p.dead || !zExposed(p)) continue; if (Math.hypot(p.x - Bm.x, p.y - Bm.y) < 1.5 && Math.abs(flyAimZ(p) - 0.9 - Bm.z) < 2) hurtPlayer(p, Z.dmg * W.D.dmg, z); } emit({ k: 'vbomb', x: r2(Bm.x), y: r2(Bm.y), z: r2(Bm.z) }); z.bomb = null; } }
  if (z.stun > 0) { z.dv = null; spd = 0; gz = Math.max(flyFloor(z.x, z.y) + 0.5, z.z - 1.4); } // stunned: flutters down a little
  else if (z.conf > 0 || !tp) { z.dv = null; if (z.wa == null || rand() < dt * 0.8) z.wa = rand() * Math.PI * 2; gx = z.x + Math.cos(z.wa) * 3; gy = z.y + Math.sin(z.wa) * 3; gz = cruise(); }
  else if (D) {
    D.t += dt; const ex = zExposed(tp);
    if (D.ph === 0) { // (round 36) a hover and a cry, then it dives at the spot you were in when it cried (marked on the ground): step aside and it misses
      z.kt = 1; spd = 0; gz = z.z + 0.3; z.face += angDiff(z.face, Math.atan2(D.y - z.y, D.x - z.x)) * Math.min(1, dt * 10);
      if (D.t > 0.42) { D.ph = 1; D.t = 0; } // (round 36b) tell 0.55 → 0.42 s
    } else if (D.ph === 1) { // the dive: straight at the marked spot, no homing; whoever is there when it arrives gets pecked
      z.kt = 2; z.atk = 0.3; spd = z.spd * F.spd; vzMax = 9; gx = D.x; gy = D.y; gz = D.z;
      if (D.strafe) { gz = D.z; const ex = D.x2 - D.x0, ey = D.y2 - D.y0, el = Math.hypot(ex, ey) || 1; gx = D.x2; gy = D.y2; spd = z.spd * F.spd * 1.15; if (!D.dn && Math.abs(z.z - D.z) > 0.25) { spd *= 0.35; } else D.dn = 1; } // (round 36l) a strafing run: low along the marked line
      for (const p of W.p) { if (p.gone || p.dead || D.hit) continue; const az = flyAimZ(p); if (Math.hypot(p.x - z.x, p.y - z.y, az - z.z) < (p.r || 0.3) + z.r + (D.strafe ? 0.38 : 0.22) + (inMech(p) ? 0.7 : 0) && zExposed(p)) {
        D.hit = 1; hurtPlayer(p, Z.dmg * W.D.dmg, z); if (F.drain) z.hp = Math.min(z.max, z.hp + F.drain); emit({ k: 'sfx', n: 'peck', x: z.x, y: z.y });
        if (z.k === 'bat' && !inMech(p) && !p.ride && rand() < 0.6) { z.latch = { p: p.i, t: 2.4, hp: z.hp }; z.dv = null; if (p.i === ME || !W.batTip) { W.batTip = 1; say('尸蝠扒在你身上吸血——用刀（右键 / 刀键）把它打下来'); } return; } } } // (round 36l) a bat may cling on
      if (D.hit && !D.strafe || (D.strafe ? Math.hypot(D.x2 - z.x, D.y2 - z.y) < 0.4 || D.t > 1.8 : Math.hypot(D.x - z.x, D.y - z.y, D.z - z.z) < 0.3 || D.t > 1.4)) { D.ph = 2; D.t = 0; D.a = z.face + (rand() - 0.5) * 1.4; } // carries on past and pulls up
    } else { // pull up and away, then back to circling
      spd = z.spd * 1.1; gx = z.x + Math.cos(D.a) * 3; gy = z.y + Math.sin(D.a) * 3; gz = cruise() + 0.6;
      if (D.t > 0.8) { z.dv = null; z.dvCD = F.cd * (0.75 + rand() * 0.5); z.fa = Math.atan2(z.y - tp.y, z.x - tp.x); }
    }
  } else { // circle over the target's head (over the roof when it is indoors)
    const R = F.orbit + (z.seed % 7) * 0.12, dir = z.seed % 2 ? 1 : -1, dist = Math.hypot(tp.x - z.x, tp.y - z.y);
    if (dist < R + 3) z.fa += dir * z.spd / R * dt * 0.8; else z.fa = Math.atan2(z.y - tp.y, z.x - tp.x);
    gx = tp.x + Math.cos(z.fa) * R; gy = tp.y + Math.sin(z.fa) * R;
    gz = Math.max(cruise(), flyFloor(tp.x, tp.y) + F.alt, inAirZ(tp) != null ? inAirZ(tp) + 0.4 : 0);
    if (z.dvCD <= 0 && zExposed(tp) && dist < F.dive && zSeen(z) && W.phase !== 'day' && los(z.x, z.y, z.z, tp.x, tp.y, flyAimZ(tp))) {
      let busy = 0; for (const o of W.zs) if (o !== z && o.fk && o.fk === z.fk && o.dv && o.hp > 0) busy++;
      if (F.bomb) { if (!z.bomb && dist < F.dive + 2) { const lx = clamp(tp.x + (tp.vx || 0) * 1.0, 1, MW - 1), ly = clamp(tp.y + (tp.vy || 0) * 1.0, 1, MH - 1), gz2 = flyAimZ(tp) - (inAirZ(tp) != null ? 0.6 : inMech(tp) ? 2.2 : 0.95); z.bomb = { t: 0, x: lx, y: ly, z: gz2 }; z.dvCD = F.cd * (0.8 + rand() * 0.4); emit({ k: 'ktell', s: 'disc', x: r2(lx), y: r2(ly), z: r2(gz2), r: 1.5, t: 1.0 }); emit({ k: 'sfx', n: 'caw', x: z.x, y: z.y }); } else z.dvCD = 0.5; } // (round 36l) 尸鹫 drops an acid glob where you are heading
      else if (busy < 3 && z.k === 'crow' && rand() < 0.4) { const az = flyAimZ(tp), a = Math.atan2(tp.y - z.y, tp.x - z.x), x2 = clamp(tp.x + Math.cos(a) * 4, 1, MW - 1), y2 = clamp(tp.y + Math.sin(a) * 4, 1, MH - 1); z.dv = { ph: 0, t: 0, strafe: 1, x: tp.x, y: tp.y, z: az, x0: z.x, y0: z.y, x2, y2 }; emit({ k: 'sfx', n: 'caw', x: z.x, y: z.y }); emit({ k: 'ktell', s: 'line', x: r2(z.x), y: r2(z.y), z: r2(az - 0.95), x2: r2(x2), y2: r2(y2), w: 1.0, t: 0.5 }); } // (round 36l) a crow strafing run along a marked line: step sideways
      else if (busy < 3) { const az = flyAimZ(tp), lead = 0.55, lx = clamp(tp.x + (tp.vx || 0) * lead, 1, MW - 1), ly = clamp(tp.y + (tp.vy || 0) * lead, 1, MH - 1); z.dv = { ph: 0, t: 0, x: lx, y: ly, z: az }; /* (round 36b) three at a time, aimed where you're heading: turn or stop to dodge */ emit({ k: 'sfx', n: z.k === 'bat' ? 'screech' : 'caw', x: z.x, y: z.y }); emit({ k: 'fdive', x: r2(lx), y: r2(ly), z: r2(az - (inAirZ(tp) != null ? 0.6 : inMech(tp) ? 2.2 : 0.95)) }); } // the flock takes turns, two at a time
      else z.dvCD = 0.4 + rand() * 0.6;
    }
  }
  // steer toward (gx, gy), ease the height toward gz (never into a roof or a wall: the floor is the top of whatever is under it)
  const dx = gx - z.x, dy = gy - z.y, d = Math.hypot(dx, dy);
  let mx = 0, my = 0; if (d > 0.05 && spd > 0) { const v = Math.min(spd, d / Math.max(dt, 1e-3)); mx = dx / d * v; my = dy / d * v; }
  for (const o of W.zs) { if (o === z || o.hp <= 0 || !ZT[o.k].fly) continue; const ex = z.x - o.x, ey = z.y - o.y, e = Math.hypot(ex, ey); if (e < 0.6 && e > 1e-3 && Math.abs(o.z - z.z) < 0.7) { mx += ex / e * 1.6; my += ey / e * 1.6; } }
  if (z.kt !== 1 && Math.hypot(mx, my) > 0.1) z.face += angDiff(z.face, Math.atan2(my, mx)) * Math.min(1, dt * 8);
  z.kbx = (z.kbx || 0) * Math.max(0, 1 - dt * 5); z.kby = (z.kby || 0) * Math.max(0, 1 - dt * 5);
  z.x = clamp(z.x + (mx + z.kbx) * dt, 1, MW - 1.01); z.y = clamp(z.y + (my + z.kby) * dt, 1, MH - 1.01);
  z.z += clamp((gz - z.z) * 3, -vzMax, vzMax) * dt; z.z = Math.max(z.z, flyFloor(z.x, z.y) + 0.25);
  z.L = clamp(Math.floor((z.z - 1.0) / FH), 0, ML - 1); z.moving = true;
}

// a spot for something next to (x, y) on floor L: open, walkable, in sight of (x, y)
function zSpotNear(x, y, L, rmin, rmax, tries) {
  for (let t = 0; t < (tries || 24); t++) {
    const a = rand() * Math.PI * 2, d = rmin + rand() * (rmax - rmin), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, cx = Math.floor(px), cy = Math.floor(py);
    if (!inMap(cx, cy) || !navNode(cx, cy, L) || solidFor(W.blk[ci(cx, cy, L)], 'z') || ttAt(cx, cy) === TT.water && L === 0) continue;
    if (!los(x, y, L * FH + 0.8, cx + 0.5, cy + 0.5, L * FH + 0.8)) continue;
    return { x: cx + 0.5, y: cy + 0.5, L };
  }
  return null;
}
const SHIELD_R = 3.2;
// (round 36) counters for people on foot: any blast close by shows a cloaked 隐身者 (and slows it), a 爆破弹 (blast grenade) shatters a 护盾者's bubble outright
function eliteCounter(x, y, R, blast) {
  for (const z of W.zs) { if (z.hp <= 0 || !ZT[z.k].elite) continue; const d = Math.hypot(z.x - x, z.y - y);
    if (z.ck && d < R + 3) { z.ck = 0; z.ckT = 5; z.limp = Math.max(z.limp || 0, 2); emit({ k: 'elx', a: 'reveal', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); }
    if (blast && z.k === 'warden' && z.sh > 0 && d < R + SHIELD_R) { z.sh = 0; z.shT = ZT.warden.elite.cd; z.stun = Math.max(z.stun || 0, 1.2); emit({ k: 'elx', a: 'break', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); } }
}
// (round 35) a 护盾者's bubble covers the zombies near it: hits from outside go into the bubble; you can shoot from inside it
function shieldFor(z, p) {
  for (const w of W.wardens || []) {
    if (w.hp <= 0 || !(w.sh > 0) || Math.abs(w.z - z.z) > 2 || Math.hypot(z.x - w.x, z.y - w.y) > SHIELD_R) continue;
    if (p && Math.hypot(p.x - w.x, p.y - w.y) < SHIELD_R && Math.abs(p.z - w.z) < 2) continue;
    return w;
  }
  return null;
}
// (round 36l) an opening (破绽): stunned and taking double damage for a moment — shared by kaiju and 能力者
function zExpose(z, t, w) { z.xpT = t; z.stun = Math.max(z.stun || 0, t * 0.9); z.es = null; emit({ k: 'kxp', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z + ZT[z.k].h + 0.3), t: r2(t), w }); }
// (round 36l) every 能力者 move now has an answer that opens it up:
//  闪影者 — after it appears behind you there is a beat before the cut: hit it then (parry) or step away (it whiffs and stumbles);
//  唤尸者 — keeps its distance (chase it); enough damage while it calls breaks the call; its raised zombies fall when it dies;
//  护盾者 — shoot from inside its bubble, but it pulses people out (marked): hit it hard during the pulse tell to break bubble and all;
//  隐身者 — it leaves faint marks as it creeps near and flickers just before it strikes: face it (or hit it) and the ambush is turned back on it.
// returns true while a skill holds the zombie still (it does its own thing this frame)
function eliteStep(z, Z, dt) {
  const E = Z.elite; z.kt = 0;
  z.eCD = (z.eCD == null ? 2 + rand() * 3 : z.eCD) - dt; if (z.xpT > 0) z.xpT -= dt; // (round 36l) while open it is stunned, so no skill starts
  if (E.k === 'shield') { // the bubble: recharges after it breaks; people inside get pulsed out
    if (!(z.sh > 0)) { z.es = null; z.shT = (z.shT == null ? 0 : z.shT) - dt; if (z.shT <= 0) { z.sh = z.shMax = z.max * 0.6; emit({ k: 'elx', a: 'shield', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); } return false; }
    const S = z.es;
    if (S) { S.t += dt; z.kt = 1; z.moving = false;
      if ((S.dm || 0) >= 70 || z.stun > 0.3) { z.sh = 0; z.shT = E.cd; emit({ k: 'elx', a: 'break', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); zExpose(z, 2.2, 'break'); return false; } // hit it hard in the tell: bubble and all go
      if (S.t >= 0.9) { for (const p of W.p) { if (!standingP(p) || Math.abs(p.z - z.z) > 2) continue; const ex = p.x - z.x, ey = p.y - z.y, e = Math.hypot(ex, ey); if (e < SHIELD_R + 0.3) { hurtPlayer(p, 12 * W.D.dmg, z); knock(p, ex / (e || 1) * 11, ey / (e || 1) * 11); } }
        emit({ k: 'kroar', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z + 2) }); z.es = null; z.eCD = 6 + rand() * 3; }
      return true; }
    if (z.eCD <= 0 && !(z.stun > 0) && W.phase !== 'day' && zSeen(z) && W.p.some(p => standingP(p) && Math.hypot(p.x - z.x, p.y - z.y) < SHIELD_R && Math.abs(p.z - z.z) < 2)) { z.es = { t: 0, ph: 0 }; emit({ k: 'ktell', s: 'disc', x: r2(z.x), y: r2(z.y), z: r2(z.z), r: SHIELD_R + 0.3, t: 0.9 }); emit({ k: 'sfx', n: 'shield', x: z.x, y: z.y }); return true; }
    return false;
  }
  if (E.k === 'cloak') {
    if (z.ckT > 0) z.ckT -= dt;
    let near = 1e9, tp = null; for (const p of W.p) { if (!standingP(p) || Math.abs(p.z - z.z) > 1.2) continue; const d = Math.hypot(p.x - z.x, p.y - z.y); if (d < near) { near = d; tp = p; } }
    if ((z.burn > 0 || W.cz && W.cz.length && cloudAt(z.x, z.y, z.z) & 1) && z.ck) { /* (round 36) a slow field shows it too */ z.ck = 0; z.ckT = 2; emit({ k: 'elx', a: 'reveal', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); }
    if (z.ck && tp && near < 6 && (z.stepT = (z.stepT || 0) - dt) <= 0 && z.moving) { z.stepT = 0.55; emit({ k: 'ktell', s: 'disc', x: r2(z.x), y: r2(z.y), z: r2(z.z), r: 0.32, t: 0.45 }); } // faint marks where it creeps
    const S = z.es;
    if (S && S.amb) { S.t += dt; z.moving = false; const p = W.p[S.p]; if (p) z.face = Math.atan2(p.y - z.y, p.x - z.x);
      if (S.t >= 0.4) { z.es = null; if (!p || !standingP(p)) return false; const toZ = Math.atan2(z.y - p.y, z.x - p.x), facing = Math.cos(angDiff(p.aim, toZ)) > 0.55;
        if ((S.dm || 0) > 0 || facing) { z.ck = 0; z.ckT = 5; emit({ k: 'elx', a: 'reveal', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); zExpose(z, 2.2, 'parry'); return false; } // seen coming: turned back on it
        z.ck = 0; z.ckT = 4; z.atk = 0.3; z.cd = Z.cd; hurtPlayer(p, 24 * W.D.dmg, z); knock(p, Math.cos(z.face) * 5, Math.sin(z.face) * 5);
        emit({ k: 'elx', a: 'ambush', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); return false; }
      return true; }
    if (z.ck && tp && near < 1.9 && z.stun <= 0 && los(z.x, z.y, z.z + 0.8, tp.x, tp.y, tp.z + 0.8)) { // the ambush: a 0.4 s flicker first (a red mark under it, a hiss), then a heavy blow
      z.es = { amb: 1, t: 0, p: tp.i }; emit({ k: 'ktell', s: 'disc', x: r2(z.x), y: r2(z.y), z: r2(z.z), r: 0.9, t: 0.4 }); emit({ k: 'sfx', n: 'ambush', x: z.x, y: z.y }); return true;
    }
    if (!z.ck && !(z.ckT > 0) && !(z.burn > 0) && near > 4) { z.ck = 1; emit({ k: 'elx', a: 'cloak', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); }
    return false;
  }
  if (z.sleep || z.climbing) return false;
  const S = z.es;
  if (S && S.ph === 0 && (z.stun > 0.2 || (S.dm || 0) >= (E.k === 'call' ? 60 : 50))) { z.eCD = E.cd * 0.5; emit({ k: 'elx', a: 'stop', id: z.id }); zExpose(z, 2.0, 'break'); return false; } // (round 36l) a stun, or enough damage, breaks the wind-up and opens it up
  let tp = null, td = 1e9; for (const p of W.p) { if (!standingP(p) || inAirZ(p) != null) continue; const d = Math.hypot(p.x - z.x, p.y - z.y); if (d < td && Math.abs(p.z - z.z) < 2.7) { td = d; tp = p; } }
  if (E.k === 'blink') {
    if (S) {
      S.t += dt; z.moving = false;
      if (S.ph === 0) { z.kt = 1; if (tp) z.face = Math.atan2(tp.y - z.y, tp.x - z.x); if (S.t >= 0.8) { /* (round 36) tell 0.6 → 0.8 s */ const ox = z.x, oy = z.y, oz = z.z; z.x = S.x; z.y = S.y; z.L = S.L; z.z = surfZ(z.x, z.y, z.L); S.ph = 1; S.t = 0; S.dm = 0; S.tp = tp ? tp.i : -1; S.px = tp ? tp.x : 0; S.py = tp ? tp.y : 0; if (tp) z.face = Math.atan2(tp.y - z.y, tp.x - z.x); emit({ k: 'sfx', n: 'clink', x: z.x, y: z.y }); emit({ k: 'elx', a: 'blink1', id: z.id, x: r2(ox), y: r2(oy), z: r2(oz), tx: r2(z.x), ty: r2(z.y), tz: r2(z.z) }); } return true; }
      z.kt = 2; z.atk = 0.3; if (tp) z.face += angDiff(z.face, Math.atan2(tp.y - z.y, tp.x - z.x)) * Math.min(1, dt * 6);
      if ((S.dm || 0) >= 40) { zExpose(z, 2.0, 'parry'); z.eCD = E.cd; return false; } // (round 36l) hit it in the beat after it appears: parried
      if (S.t >= 0.45) { // the slash (round 36l: 0.32 → 0.45 s to react)
        const q = W.p[S.tp]; if (q && Math.hypot(q.x - S.px, q.y - S.py) > 1.2 && !(Math.hypot(q.x - z.x, q.y - z.y) < 1.4)) { emit({ k: 'elx', a: 'slash', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z), f: r2(z.face) }); zExpose(z, 1.6, 'whiff'); z.eCD = E.cd; return false; } // stepped away: it cuts air and stumbles
        for (const p of W.p) { if (!standingP(p) || Math.abs(p.z - z.z) > 1.1) continue; const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy); if (d < 1.8 && (d < 0.6 || Math.cos(angDiff(Math.atan2(dy, dx), z.face)) > 0.1)) { hurtPlayer(p, 20 * W.D.dmg, z); knock(p, dx / (d || 1) * 4, dy / (d || 1) * 4); } }
        emit({ k: 'elx', a: 'slash', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z), f: r2(z.face) }); z.es = null; z.eCD = E.cd * (0.8 + rand() * 0.4);
      }
      return true;
    }
    if (tp && z.eCD <= 0 && z.stun <= 0 && !(z.conf > 0) && td > 2.6 && td < 13 && zSeen(z) && W.phase !== 'day' && los(z.x, z.y, z.z + 1, tp.x, tp.y, tp.z + 1)) {
      const back = tp.aim + Math.PI; let to = null;
      for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9]) { const px = tp.x + Math.cos(back + da) * 1.35, py = tp.y + Math.sin(back + da) * 1.35, cx = Math.floor(px), cy = Math.floor(py);
        if (inMap(cx, cy) && navNode(cx, cy, tp.L) && !solidFor(W.blk[ci(cx, cy, tp.L)], 'z') && los(px, py, tp.z + 0.8, tp.x, tp.y, tp.z + 0.8)) { to = { x: px, y: py, L: tp.L }; break; } }
      if (to) { z.es = { ph: 0, t: 0, x: to.x, y: to.y, L: to.L }; z.kt = 1; emit({ k: 'elx', a: 'blink0', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z), tx: r2(to.x), ty: r2(to.y), tz: r2(surfZ(to.x, to.y, to.L)) }); emit({ k: 'sfx', n: 'blink', x: z.x, y: z.y }); return true; }
      z.eCD = 1;
    }
    return false;
  }
  if (E.k === 'call') {
    if (S) {
      S.t += dt; z.kt = 1; z.moving = false; z.scr = 0.4; if (tp) z.face = Math.atan2(tp.y - z.y, tp.x - z.x);
      if (S.t >= 1.1) { // up they come
        const n = W.night || 1, pool = n < 5 ? ['crawler', 'walker', 'runner'] : ['crawler', 'runner', 'dog', 'climber'], cnt = 2 + (n >= 6 ? 1 : 0) + (rand() < 0.5 ? 1 : 0), pts = [];
        let awake = 0; for (const o of W.zs) if (!o.sleep && o.hp > 0) awake++;
        z.mins = (z.mins || []).filter(id => W.zs.some(o => o.id === id && o.hp > 0)); /* (round 36) at most 6 of its own up at once */
        for (let k = 0; k < cnt && awake < BAL.zCap() + 6 && z.mins.length < 6; k++) { const at = zSpotNear(z.x, z.y, z.L, 1, 2.6); if (!at) continue; const q = spawnZombie(pool[Math.floor(rand() * pool.length)], 0); q.x = at.x; q.y = at.y; q.L = at.L; q.z = surfZ(q.x, q.y, q.L); q.stun = 0.6; q.rage = 4; z.mins.push(q.id); pts.push([r2(q.x), r2(q.y), r2(q.z)]); awake++; }
        for (const o of W.zs) if (o !== z && o.hp > 0 && Math.hypot(o.x - z.x, o.y - z.y) < 5) o.rage = Math.max(o.rage || 0, 4);
        emit({ k: 'elx', a: 'call1', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z), p: pts }); z.es = null; z.eCD = E.cd * (0.8 + rand() * 0.4);
      }
      return true;
    }
    if (tp && td < 4.5 && z.stun <= 0 && zSeen(z) && W.phase !== 'day') { const a = Math.atan2(z.y - tp.y, z.x - tp.x); moveEnt(z, Math.cos(a) * z.spd * 1.15 * dt, Math.sin(a) * z.spd * 1.15 * dt, 'z', false); z.z = surfZ(z.x, z.y, z.L); z.face = a; z.moving = true; return true; } // (round 36l) keeps its distance: you have to chase it down
    if (tp && z.eCD <= 0 && z.stun <= 0 && td < 14 && zSeen(z) && W.phase !== 'day') { z.es = { ph: 0, t: 0 }; z.kt = 1; emit({ k: 'elx', a: 'call0', id: z.id, x: r2(z.x), y: r2(z.y), z: r2(z.z) }); emit({ k: 'sfx', n: 'groan', x: z.x, y: z.y }); return true; }
    return false;
  }
  return false;
}
