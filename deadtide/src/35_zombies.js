let NAV_FAR = null;
/* ================= zombie AI (host only): flow fields, smashing, climbing, spitting ================= */
function zAttackCell(z, i) {
  z.st = 'attack'; z.atk = 0.3;
  z.face = Math.atan2(cy_(i) + 0.5 - z.y, cx_(i) + 0.5 - z.x);
  if (z.cd > 0) return;
  z.cd = ZT[z.k].cd;
  if (!W.blk[i]) return;
  const thorns = B[W.blk[i]].thorns; damageCell(i, ZT[z.k].bdmg * W.D.dmg);
  if (thorns) hurtZombie(z, thorns, null);
  emit({ k: 'bash', i, z: z.k });
}
function stepZombies(dt) {
  const F = W.ff, zs = W.zs;
  const grid = new Map();
  for (const z of zs) { if (z.hp <= 0) continue; const key = ci(Math.floor(z.x), Math.floor(z.y), z.L); let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(z); }
  // herds: how far along the way each herd is on average (player field), so stragglers can hurry and the ones out in front hang back
  const herd = new Map();
  for (const z of zs) { if (z.hp <= 0 || !z.g) continue; const v = F.pw[ci(Math.floor(z.x), Math.floor(z.y), z.L)]; if (!(v < Infinity)) continue; const h = herd.get(z.g) || { s: 0, n: 0 }; h.s += v; h.n++; herd.set(z.g, h); }
  for (const z of zs) {
    if (z.hp <= 0) continue;
    const Z = ZT[z.k], climbT = !!Z.climb;
    z.cd -= dt; z.hitT -= dt; z.atk -= dt; z.anim += dt;
    if (z.stun > 0) z.stun -= dt;
    if (ZT[z.k].boss && bossStep(z, dt)) continue;
    if (ZT[z.k].kaiju && kaijuStep(z, dt)) continue; // (round 34)
    if (z.rage > 0) z.rage -= dt;
    if (z.scr > 0) z.scr -= dt;
    // burning: damage over time, and the fire jumps to zombies right next to it
    if (z.burn > 0) {
      z.burn -= dt; hurtZombie(z, BAL.burnDps * dt, W.p[z.burnBy] || null, 0, 0, true); if (z.hp <= 0) continue;
      if (rand() < dt * BAL.burnSpread) { const fx = Math.floor(z.x), fy = Math.floor(z.y); for (let gy = fy - 2; gy <= fy + 2; gy++) for (let gx = fx - 2; gx <= fx + 2; gx++) { const a = inMap(gx, gy) && grid.get(ci(gx, gy, z.L)); if (a) for (const o of a) if (o !== z && o.hp > 0 && !(o.burn > 0) && Math.hypot(o.x - z.x, o.y - z.y) < BAL.burnSpreadR) { o.burn = 2.5; o.burnBy = z.burnBy; } } }
    }
    if (z.sleep) { z.moving = false; z.st = 'walk'; continue; } // a sleeper in a building: still until something wakes it (41_siege)
    z.st = 'walk';
    // wall climbing in progress
    if (z.climbing) {
      const c = z.climbing; c.t += dt / 0.75;
      z.x = lerp(c.x0, c.x1, Math.max(0, c.t * 1.4 - 0.4)); z.y = lerp(c.y0, c.y1, Math.max(0, c.t * 1.4 - 0.4)); z.z = lerp(c.z0, c.L * FH, Math.min(1, c.t * 1.3));
      if (c.t >= 1) { z.L = c.L; z.x = c.x1; z.y = c.y1; z.climbing = null; }
      continue;
    }
    const cx = Math.floor(z.x), cy = Math.floor(z.y), i = ci(cx, cy, z.L);
    // barbed wire
    let slow = inMud(z.x, z.y, z.L) ? MUD_SLOW : 1;
    const cz = W.cz && W.cz.length ? cloudAt(z.x, z.y, z.z) : 0; if (cz & 1) slow *= BAL.slowMul; if (cz & 2) z.conf = BAL.smokeConf; else if (z.conf > 0) z.conf -= dt; // (round 24) slow field / smoke
    // (round 28) traps act on the open floor around them (W.trapAt), not just their own cell
    if (z.limp > 0) { z.limp -= dt; slow *= BAL.limpMul; } if (z.trapCD > 0) z.trapCD -= dt;
    scanCells(); const ti = W.trapAt[i], tb = ti >= 0 ? W.blk[ti] : 0;
    if (tb && B[tb].mine) { const mx = cx_(ti) + 0.5, my = cy_(ti) + 0.5, mz = cl_(ti) * FH; setCell(ti, 0, W.slab[ti], null, 'mine'); explode(mx, my, mz + 0.3, null, BAL.mineR, BAL.mineDmg); (W.cz = W.cz || []).push({ k: 1, x: mx, y: my, z: mz, r: BAL.mineSlowR, t: BAL.mineSlowT }); for (const q of W.zs) if (q.hp > 0 && Math.hypot(q.x - mx, q.y - my) < BAL.mineR) q.limp = Math.max(q.limp || 0, BAL.limpT); if (z.hp <= 0) continue; }
    else if (tb && B[tb].trap && !(z.trapCD > 0)) {
      z.stun = BAL.trapStun; z.limp = BAL.limpT; z.trapCD = 6; hurtZombie(z, BAL.trapDmg, null); emit({ k: 'sfx', n: 'brk', x: z.x, y: z.y });
      W.bhp[ti] -= B[tb].hp / BAL.trapUses; W.dirty.add(ti); if (W.bhp[ti] <= 0.5) setCell(ti, 0, W.slab[ti], null, 'trap');
      if (z.hp <= 0) continue;
    }
    if (B[W.blk[i]].stairs && !B[W.blk[i]].nat) slow = climbT ? 0.75 : 0.38; // ladders are slow going for zombies
    if (tb && B[tb].wire) {
      slow = Math.min(slow, BAL.wireSlow); hurtZombie(z, BAL.wireDps * dt, null);
      W.bhp[ti] -= BAL.wireWear * dt * (z.k === 'brute' || z.k === 'boss' ? 4 : 1); W.dirty.add(ti);
      if (W.bhp[ti] <= 0) destroyBlk(ti);
      if (z.hp <= 0) continue;
    }
    const rf = climbT ? F.rc : F.rw, pf = climbT ? F.pc : F.pw;
    // pure survival: always hunt the nearest reachable player (smashing through walls if needed)
    let field = pf[i] < Infinity ? pf : rf;
    if (!(pf[i] < Infinity)) { let nd = 1e9; for (const p of W.p) if (standingP(p)) nd = Math.min(nd, Math.abs(p.x - z.x) + Math.abs(p.y - z.y)); if (nd > NAV_PR * 0.75) field = NAV_FAR || (NAV_FAR = new Float32Array(NC).fill(Infinity)); } // (round 33) out past the players' field: walk straight at the nearest player
    // spitter: lob acid at a visible player in range
    let hold = false;
    if (z.k === 'spitter' && !(z.conf > 0)) {
      z.spitT -= dt;
      let tp = null, td = 1e9;
      for (const p of W.p) { if (p.gone || p.dead) continue; const d = d2(p.x, p.y, z.x, z.y); if (d < Z.range && d < td && los(z.x, z.y, z.z + 0.9, p.x, p.y, p.z + 0.6)) { td = d; tp = p; } }
      if (tp) {
        hold = td < Z.range * 0.85; z.face = Math.atan2(tp.y - z.y, tp.x - z.x);
        if (z.spitT <= 0) {
          z.spitT = Z.spitCD * (0.8 + W.rng() * 0.4);
          const T = 0.8 + td / 16, sx = z.x + Math.cos(z.face) * 0.3, sy = z.y + Math.sin(z.face) * 0.3, sz = z.z + 0.9;
          W.proj.push({ k: 'acid', x: sx, y: sy, z: sz, vx: (tp.x - sx) / T, vy: (tp.y - sy) / T, vz: (tp.z + 0.5 - sz) / T + 5 * T });
          emit({ k: 'sfx', n: 'spit', x: sx, y: sy });
        }
      }
    }
    // screamer: keeps its distance and shrieks, enraging every zombie around it (and calling more at night)
    if (Z.scream) {
      z.scrT = (z.scrT == null ? 2 + rand() * 3 : z.scrT) - dt;
      let tp = null, td = 1e9; for (const p of W.p) { if (!standingP(p)) continue; const d = d2(p.x, p.y, z.x, z.y); if (d < td) { td = d; tp = p; } }
      if (tp && td < 6.5) { hold = true; z.face = Math.atan2(tp.y - z.y, tp.x - z.x); }
      if (tp && td < BAL.screamR * 1.3 && z.scrT <= 0 && los(z.x, z.y, z.z + 0.9, tp.x, tp.y, tp.z + 0.6)) {
        z.scrT = BAL.screamCD; z.scr = 1.3;
        for (const o of zs) if (o !== z && o.hp > 0 && d2(o.x, o.y, z.x, z.y) < BAL.screamR) o.rage = 5;
        if (W.phase === 'night') for (let k = 0; k < 2; k++) spawnZombie('walker', Math.floor(rand() * 4));
        emit({ k: 'scream', x: r2(z.x), y: r2(z.y), z: r2(z.z) });
      }
    }
    // (round 23) brute: wind up (red line on the ground) then a straight rush that flattens you and smashes what it hits; up close, a ground slam (red ring)
    z.tl = 0; if (z.stun > 0 && (z.chg || z.slam)) { z.chg = z.slam = null; z.chgCD = BAL.chgCD * 0.5; } // a stun breaks the wind-up
    if (Z.charge && z.stun <= 0 && !z.climbing) {
      z.chgCD = (z.chgCD == null ? 2 + rand() * 2 : z.chgCD) - dt; z.slamCD = (z.slamCD || 0) - dt;
      if (z.chg) {
        const Cg = z.chg; Cg.t += dt; hold = true; z.face = Cg.a;
        if (Cg.ph === 0) { z.tl = 1; if (Cg.t >= BAL.chgWind) { Cg.ph = 1; Cg.t = 0; emit({ k: 'sfx', n: 'smash', x: z.x, y: z.y }); } }
        else {
          z.tl = 2; const ox = z.x, oy = z.y, ca = Math.cos(Cg.a), sa = Math.sin(Cg.a);
          moveEnt(z, ca * BAL.chgSpd * dt, sa * BAL.chgSpd * dt, 'z', false); z.z = surfZ(z.x, z.y, z.L);
          for (const p of W.p) { if (p.gone || p.dead || Cg.hit.includes(p.i) || Math.abs(p.z - z.z) > 0.9) continue; if (d2(p.x, p.y, z.x, z.y) < p.r + z.r + 0.35) { Cg.hit.push(p.i); hurtPlayer(p, BAL.chgDmg * W.D.dmg, z); knock(p, ca * BAL.chgKB - sa * 2, sa * BAL.chgKB + ca * 2); emit({ k: 'sfx', n: 'smash', x: p.x, y: p.y }); } }
          for (const o of zs) { if (o === z || o.hp <= 0 || o.L !== z.L) continue; const dx = o.x - z.x, dy = o.y - z.y, d = Math.hypot(dx, dy); if (d < z.r + o.r + 0.2 && d > 0.01) { const side = dx * -sa + dy * ca >= 0 ? 1 : -1; o.kbx += -sa * side * 6; o.kby += ca * side * 6; } } // shoved aside
          if (Math.hypot(z.x - ox, z.y - oy) < BAL.chgSpd * dt * 0.35) { // ran into something
            if (z.bump >= 0 && B[W.blk[z.bump]].brk) { W.bhp[z.bump] -= BAL.chgWall; W.dirty.add(z.bump); if (W.bhp[z.bump] <= 0) destroyBlk(z.bump); }
            z.stun = BAL.chgStun; z.chg = null; z.chgCD = BAL.chgCD; emit({ k: 'sfx', n: 'smash', x: z.x, y: z.y }); emit({ k: 'slam', x: r2(z.x + ca * 0.5), y: r2(z.y + sa * 0.5), z: r2(z.z), r: 1 });
          } else if (Cg.t >= BAL.chgTime) { z.chg = null; z.chgCD = BAL.chgCD; }
        }
      } else if (z.slam) {
        hold = true; z.tl = 3; z.slam.t += dt;
        if (z.slam.t >= BAL.slamWind) {
          for (const p of W.p) { if (p.gone || p.dead || Math.abs(p.z - z.z) > 1) continue; const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy); if (d < BAL.slamR) { hurtPlayer(p, BAL.slamDmg * W.D.dmg * (d < 1.4 ? 1 : 0.6)); knock(p, dx / (d || 1) * BAL.slamKB, dy / (d || 1) * BAL.slamKB); } }
          z.slam = null; z.slamCD = BAL.slamCD; emit({ k: 'sfx', n: 'smash', x: z.x, y: z.y }); emit({ k: 'slam', x: r2(z.x), y: r2(z.y), z: r2(z.z), r: BAL.slamR });
        }
      } else {
        let tp = null, td = 1e9; for (const p of W.p) { if (!standingP(p) || Math.abs(p.z - z.z) > 0.9) continue; const d = d2(p.x, p.y, z.x, z.y); if (d < td) { td = d; tp = p; } }
        if (tp && td < BAL.slamR - 0.5 && z.slamCD <= 0) { z.slam = { t: 0 }; hold = true; z.tl = 3; z.face = Math.atan2(tp.y - z.y, tp.x - z.x); emit({ k: 'sfx', n: 'groan', x: z.x, y: z.y }); }
        else if (tp && z.chgCD <= 0 && td > BAL.chgMin && td < BAL.chgMax && los(z.x, z.y, z.z + 1, tp.x, tp.y, tp.z + 0.8)) { z.chg = { ph: 0, t: 0, a: Math.atan2(tp.y - z.y, tp.x - z.x), hit: [] }; hold = true; z.tl = 1; z.face = z.chg.a; emit({ k: 'sfx', n: 'groan', x: z.x, y: z.y }); }
      }
    }
    // choose the next step
    let tx = null, ty = null, attackI = -1, planU = -1;
    if (field[i] < Infinity && !hold) {
      let bestV = Infinity, bx = -1, by = -1, bl = -1, bex = 0;
      navNbrs(cx, cy, z.L, climbT, (nx, ny, nl, ex) => { const u = ci(nx, ny, nl), v = field[u] + enterCost(u) + ex + hash2(nx * 7 + z.seed, ny) * 0.01; if (v < bestV) { bestV = v; bx = nx; by = ny; bl = nl; bex = ex; } });
      if (bx >= 0 && (bestV <= field[i] + 0.02 || field[ci(bx, by, bl)] < field[i] - 0.01)) { /* the field is built from the target outwards, so a climb-up step (1.5) can look dearer than the climb-down (0.5) it was costed with: still go if it's downhill */
        const u = ci(bx, by, bl), ub = W.blk[u]; planU = u;
        if (bl === z.L + 1 && climbT && bex > 0) {
          if (Math.abs(z.x - (cx + 0.5)) < 0.3 && Math.abs(z.y - (cy + 0.5)) < 0.3 || d2(z.x, z.y, bx + 0.5, by + 0.5) < 0.95) { z.climbing = { t: 0, x0: z.x, y0: z.y, z0: z.z, x1: bx + 0.5, y1: by + 0.5, L: bl }; z.face = Math.atan2(by - cy, bx - cx); continue; }
          tx = cx + 0.5; ty = cy + 0.5;
        } else if (ub && B[ub].Z && !B[ub].stairs && B[ub].brk) attackI = u;
        else if (ub && B[ub].trunk) { // a tree in the way: aim past the side of the trunk we're already on, not at the trunk
          const fx = bx - cx, fy = by - cy, px = -fy, py = fx, side = ((z.x - (bx + 0.5)) * px + (z.y - (by + 0.5)) * py) >= 0 ? 1 : -1, off = B[ub].trunk + z.r + 0.08;
          tx = bx + 0.5 + px * side * off + fx * 0.35; ty = by + 0.5 + py * side * off + fy * 0.35;
        } else { tx = bx + 0.5; ty = by + 0.5; }
      }
    } else if (!hold) {
      let best = null, bd = 1e9; for (const p of W.p) { if (!standingP(p) && !p.down) continue; const d = d2(p.x, p.y, z.x, z.y); if (d < bd) { bd = d; best = p; } }
      if (best) { tx = best.x; ty = best.y; } else { tx = W.radio.x + 0.5; ty = W.radio.y + 0.5; }
    }
    if (z.conf > 0) { if (z.wa == null || rand() < dt * 0.9) z.wa = rand() * Math.PI * 2; tx = z.x + Math.cos(z.wa); ty = z.y + Math.sin(z.wa); attackI = -1; z.chg = z.slam = null; z.tl = 0; } // lost in the smoke: wander
    if (attackI >= 0) { zAttackCell(z, attackI); tx = null; }
    // bite players in reach
    for (const p of W.p) {
      if (p.gone || p.dead || Math.abs(p.z - z.z) > 0.8 || z.conf > 0) continue;
      const d = d2(p.x, p.y, z.x, z.y);
      if (d < p.r + z.r + 0.28 + (inMech(p) ? 0.7 : 0)) { /* (round 34) a mech is big: they claw at its legs */
        z.st = 'attack'; z.atk = 0.3; z.face = Math.atan2(p.y - z.y, p.x - z.x); tx = null;
        if (z.cd <= 0) { z.cd = Z.cd; hurtPlayer(p, Z.dmg * W.D.dmg, z); if (Z.kb) knock(p, (p.x - z.x) / (d || 1) * Z.kb, (p.y - z.y) / (d || 1) * Z.kb); }
        break;
      }
    }
    // move
    let mx = 0, my = 0;
    if (tx != null && z.stun <= 0) {
      const dx = tx - z.x, dy = ty - z.y, d = Math.hypot(dx, dy);
      let rg = z.rage > 0 ? BAL.rageMul : 1;
      const hd = z.g && herd.get(z.g); if (hd && hd.n >= 3 && field === pf) rg *= clamp(1 + (field[i] - hd.s / hd.n) * 0.06, 0.78, 1.22);
      if (d > 0.02) { mx = dx / d * z.spd * slow * rg; my = dy / d * z.spd * slow * rg; z.face = Math.atan2(dy, dx); }
    }
    z.kbx *= Math.max(0, 1 - dt * 6); z.kby *= Math.max(0, 1 - dt * 6);
    // wedged against a tree trunk for a second (a gap too narrow round it): squeeze past it for a moment
    if (z.squeeze > 0) z.squeeze -= dt;
    if (tx != null && z.stun <= 0) { z.wT = (z.wT || 0) + dt; if (z.wT > 1) { if (z.wx != null && Math.hypot(z.x - z.wx, z.y - z.wy) < 0.15) z.squeeze = 1.5; z.wT = 0; z.wx = z.x; z.wy = z.y; } }
    moveEnt(z, (mx + z.kbx) * dt, (my + z.kby) * dt, 'z', climbT);
    if (z.bump >= 0 && tx != null && B[W.blk[z.bump]].brk && B[W.blk[z.bump]].Z && (z.bump === planU || !B[W.blk[z.bump]].nat)) zAttackCell(z, z.bump); // only what's in the way of its path (or something you built)
    z.moving = Math.hypot(mx, my) > 0.05;
    z.z = surfZ(z.x, z.y, z.L);
  }
  // separation within a cell neighbourhood
  for (const z of zs) {
    if (z.hp <= 0 || z.climbing) continue;
    const cx = Math.floor(z.x), cy = Math.floor(z.y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const a = grid.get(inMap(cx + dx, cy + dy) ? ci(cx + dx, cy + dy, z.L) : -1); if (!a) continue;
      for (const o of a) {
        if (o === z || o.hp <= 0 || o.id < z.id || o.L !== z.L) continue;
        const ex = o.x - z.x, ey = o.y - z.y, d = Math.hypot(ex, ey), min = (o.r + z.r) * 0.85;
        if (d < min && d > 1e-4) { const push = (min - d) * 0.5, ux = ex / d * push, uy = ey / d * push; moveEnt(z, -ux, -uy, 'z', false); moveEnt(o, ux, uy, 'z', false); }
        else if (d <= 1e-4) { moveEnt(o, 0.05, 0.03, 'z', false); }
      }
    }
  }
  for (const z of zs) if (z.hp > 0 && !z.climbing) z.z = surfZ(z.x, z.y, z.L);
  W.zs = zs.filter(z => z.hp > 0);
}
