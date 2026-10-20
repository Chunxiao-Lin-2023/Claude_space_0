/* ================= zombie AI (host only): flow fields, smashing, climbing, spitting ================= */
function zAttackCell(z, i) {
  z.st = 'attack'; z.atk = 0.3;
  z.face = Math.atan2(cy_(i) + 0.5 - z.y, cx_(i) + 0.5 - z.x);
  if (z.cd > 0) return;
  z.cd = ZT[z.k].cd;
  if (!W.blk[i]) return;
  damageCell(i, ZT[z.k].bdmg * W.D.dmg);
  emit({ k: 'bash', i, z: z.k });
}
function stepZombies(dt) {
  const F = W.ff, zs = W.zs;
  const grid = new Map();
  for (const z of zs) { if (z.hp <= 0) continue; const key = ci(Math.floor(z.x), Math.floor(z.y), z.L); let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(z); }
  for (const z of zs) {
    if (z.hp <= 0) continue;
    const Z = ZT[z.k], climbT = !!Z.climb;
    z.cd -= dt; z.hitT -= dt; z.atk -= dt; z.anim += dt;
    if (z.stun > 0) z.stun -= dt;
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
    let slow = 1;
    if (B[W.blk[i]].wire) {
      slow = BAL.wireSlow; hurtZombie(z, BAL.wireDps * dt, null);
      W.bhp[i] -= BAL.wireWear * dt * (z.k === 'brute' || z.k === 'boss' ? 4 : 1); W.dirty.add(i);
      if (W.bhp[i] <= 0) destroyBlk(i);
      if (z.hp <= 0) continue;
    }
    const rf = climbT ? F.rc : F.rw, pf = climbT ? F.pc : F.pw;
    let field = rf;
    if (pf[i] < BAL.aggro * (climbT ? 1.6 : 1) && pf[i] < rf[i] + 8) field = pf;
    // spitter: lob acid at a visible player in range
    let hold = false;
    if (z.k === 'spitter') {
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
    // choose the next step
    let tx = null, ty = null, attackI = -1;
    if (field[i] < Infinity && !hold) {
      let bestV = Infinity, bx = -1, by = -1, bl = -1, bex = 0;
      navNbrs(cx, cy, z.L, climbT, (nx, ny, nl, ex) => { const u = ci(nx, ny, nl), v = field[u] + enterCost(u) + ex + hash2(nx * 7 + z.seed, ny) * 0.01; if (v < bestV) { bestV = v; bx = nx; by = ny; bl = nl; bex = ex; } });
      if (bx >= 0 && bestV <= field[i] + 0.02) {
        const u = ci(bx, by, bl), ub = W.blk[u];
        if (bl === z.L + 1 && climbT && bex > 0) {
          if (Math.abs(z.x - (cx + 0.5)) < 0.3 && Math.abs(z.y - (cy + 0.5)) < 0.3 || d2(z.x, z.y, bx + 0.5, by + 0.5) < 0.95) { z.climbing = { t: 0, x0: z.x, y0: z.y, z0: z.z, x1: bx + 0.5, y1: by + 0.5, L: bl }; z.face = Math.atan2(by - cy, bx - cx); continue; }
          tx = cx + 0.5; ty = cy + 0.5;
        } else if (ub && B[ub].Z && !B[ub].stairs && B[ub].brk) attackI = u;
        else { tx = bx + 0.5; ty = by + 0.5; }
      }
    } else if (!hold) { tx = W.radio.x + 0.5; ty = W.radio.y + 0.5; }
    // at the radio
    const rL = gAt(W.radio.x, W.radio.y);
    if (z.L === rL && Math.abs(cx - W.radio.x) + Math.abs(cy - W.radio.y) === 1 && field === rf) {
      z.st = 'attack'; z.atk = 0.3; z.face = Math.atan2(W.radio.y + 0.5 - z.y, W.radio.x + 0.5 - z.x); tx = null;
      if (z.cd <= 0) {
        z.cd = Z.cd; W.radio.hp -= Z.bdmg * BAL.radioDmg * W.D.dmg; W.radio.hitT = 0.2; emit({ k: 'rhit' });
        if (W.radio.alarmT <= 0) { W.radio.alarmT = 6; say('电台正在被攻击！', '#ff6b6b'); }
        if (W.radio.hp <= 0) { W.radio.hp = 0; checkLose(); }
      }
    }
    if (attackI >= 0) { zAttackCell(z, attackI); tx = null; }
    // bite players in reach
    for (const p of W.p) {
      if (p.gone || p.dead || Math.abs(p.z - z.z) > 0.8) continue;
      const d = d2(p.x, p.y, z.x, z.y);
      if (d < p.r + z.r + 0.28) {
        z.st = 'attack'; z.atk = 0.3; z.face = Math.atan2(p.y - z.y, p.x - z.x); tx = null;
        if (z.cd <= 0) { z.cd = Z.cd; hurtPlayer(p, Z.dmg * W.D.dmg); if (Z.kb) knock(p, (p.x - z.x) / (d || 1) * Z.kb, (p.y - z.y) / (d || 1) * Z.kb); }
        break;
      }
    }
    // move
    let mx = 0, my = 0;
    if (tx != null && z.stun <= 0) {
      const dx = tx - z.x, dy = ty - z.y, d = Math.hypot(dx, dy);
      if (d > 0.02) { mx = dx / d * z.spd * slow; my = dy / d * z.spd * slow; z.face = Math.atan2(dy, dx); }
    }
    z.kbx *= Math.max(0, 1 - dt * 6); z.kby *= Math.max(0, 1 - dt * 6);
    moveEnt(z, (mx + z.kbx) * dt, (my + z.kby) * dt, 'z', climbT);
    if (z.bump >= 0 && tx != null && B[W.blk[z.bump]].brk && B[W.blk[z.bump]].Z) zAttackCell(z, z.bump);
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
