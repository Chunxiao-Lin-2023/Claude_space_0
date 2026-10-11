/* ================= bot AI ================= */
function botInit(b) {
  b.ai = { thinkT: Math.random() * 0.2, goal: null, dir: null, path: [], pathT: 0, pathKey: -1, strafe: Math.random() < .5 ? 1 : -1, strafeT: 0, targetId: 0, reactAt: 0, lastSeen: null, wander: null, wanderT: 0, dodge: null, dodgeT: 0, stuckT: 0, lx: 0, lz: 0, unstick: null, unstickT: 0, mode: 'roam' };
  return b.ai;
}
function botThink(b, dt) {
  const A = b.ai || botInit(b), D = DIFF[G.cfg.diff];
  A.thinkT -= dt;
  if (A.thinkT <= 0) { A.thinkT = D.think * rr(0.8, 1.25); botDecide(b, A, D); }
  botSteer(b, A, dt);
}
function safePoint(b, margin) {
  const h = H2(), R = Math.max(0.5, G.gasR - margin);
  let x = clamp(b.x, h - R, h + R), z = clamp(b.z, h - R, h + R);
  if (x !== b.x || z !== b.z) { x = lerp(x, h, 0.25); z = lerp(z, h, 0.25); }
  return { x, z };
}
function freeTileNear(x, z) {
  for (let r = 0; r < 4; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    const tx = Math.floor(x) + dx, tz = Math.floor(z) + dz; if (!solidTile(tx, tz)) return { x: tx + .5, z: tz + .5 };
  }
  return { x, z };
}
function aimAt(b, tx, tz, tvx, tvz, a, err) {
  const dd = dist(b.x, b.z, tx, tz);
  const tFlight = a.flight ? a.flight : (a.type === 'melee' || a.type === 'chain') ? 0.05 : a.type === 'zone' ? 0.6 : a.type === 'leap' ? 0.5 : dd / (a.speed || 15);
  const lead = rr(0.55, 1.0);
  let px = tx + tvx * tFlight * lead, pz = tz + tvz * tFlight * lead;
  const ang = Math.atan2(pz - b.z, px - b.x) + (Math.random() - 0.5) * 2 * err;
  const L = dist(b.x, b.z, px, pz) * (1 + (Math.random() - 0.5) * err);
  b.inp.aim = ang; b.inp.tx = b.x + Math.cos(ang) * L; b.inp.tz = b.z + Math.sin(ang) * L;
}
function botDecide(b, A, D) {
  const H = b.H, inp = b.inp, hpF = b.hp / b.mhp;
  // pick target
  let tgt = null, best = 1e9;
  // aggro radius grows over the match; being shot makes a bot retaliate at full range
  const hurtRecent = G.t - b.lastHurt < 2.5;
  let aggro = G.t < 28 ? 2.2 : clamp(3.2 + (G.t - 28) / 12 + G.cfg.diff * 0.4 + (b.cubes > 2 ? 1.5 : 0), 3.2, 12.5);
  if (hpF < 0.65 && G.t < 120) aggro = Math.min(aggro, 3);
  for (const e of G.ents) {
    if (!e.alive || e.team === b.team || !visibleTo(e, b.team)) continue;
    const dd = dist(b.x, b.z, e.x, e.z);
    const revenge = hurtRecent && e.id === b.lastHurtBy && (dd < aggro + 4 || hpF > 0.6) && dd < 12.5;
    if (dd > aggro && !revenge && !(e.hp / e.mhp < 0.3 && dd < 8)) continue;
    const sc = dd + (e.hp / e.mhp) * 3.5 - (e.id === A.targetId ? 1.8 : 0);
    if (sc < best) { best = sc; tgt = e; }
  }
  let tur = null;
  if (!tgt || dist(b.x, b.z, tgt.x, tgt.z) > 7) for (const t of G.turrets) if (t.team !== b.team && t.hp > 0 && d2(b.x, b.z, t.x, t.z) < 8 * 8) { tur = t; break; }
  if (tgt && tgt.id !== A.targetId) { A.targetId = tgt.id; A.reactAt = G.t + D.react * rr(0.7, 1.4); }
  if (tgt) A.lastSeen = { x: tgt.x, z: tgt.z, t: G.t };
  // dodge incoming projectiles
  if (Math.random() < D.dodge) {
    for (const p of G.projs) {
      if (p.team === b.team || p.lob) { if (p.lob && p.team !== b.team && d2(p.lob.tx, p.lob.tz, b.x, b.z) < (p.radius + 0.6) ** 2) { const dx = b.x - p.lob.tx, dz = b.z - p.lob.tz, L = Math.hypot(dx, dz) || 1; A.dodge = { x: dx / L, z: dz / L }; A.dodgeT = G.t + 0.4; break; } continue; }
      const dx = b.x - p.x, dz = b.z - p.z; if (dx * dx + dz * dz > 16) continue;
      const sp = Math.hypot(p.vx, p.vz) || 1, ux = p.vx / sp, uz = p.vz / sp, along = dx * ux + dz * uz; if (along < 0) continue;
      const perp = dx * uz - dz * ux; if (Math.abs(perp) > 0.9) continue;
      const s = perp >= 0 ? 1 : -1; A.dodge = { x: uz * s, z: -ux * s }; A.dodgeT = G.t + 0.32; break;
    }
  }
  A.goal = null; A.dir = null;
  const gasDanger = inGas(b.x, b.z, G.gasR - 1.3) || (G.t > BAL.gasStart - 3 && inGas(b.x, b.z, gasRAt(G.t + 4) - 0.6));
  const atk = H.atk, isLob = ignoresWalls(atk);
  const fireAt = (x, z, vx, vz, range, needLos) => {
    const dd = dist(b.x, b.z, x, z);
    if (dd > range || G.t < A.reactAt) return false;
    if (needLos && !isLob && !los(b.x, b.z, x, z)) return false;
    if (b.ammo < 1) return false;
    aimAt(b, x, z, vx, vz, atk, D.err); inp.fire = true; return true;
  };
  if (tgt) {
    const dd = dist(b.x, b.z, tgt.x, tgt.z), pref = H.ai.pref, losOk = isLob || los(b.x, b.z, tgt.x, tgt.z);
    const tHp = tgt.hp / tgt.mhp;
    if (gasDanger) { A.goal = safePoint(b, 3); A.mode = 'gas'; }
    else if (!(dd < atk.range + 1.2 && (atk.type === 'melee' || atk.type === 'dash') && hpF > 0.12) && ((hpF < 0.32 && tHp > hpF + 0.12 && dd < 9) || (hpF < 0.5 && b.ammo < 1 && tHp > 0.5))) {
      A.mode = 'flee';
      let bp = null, bs = -1e9;
      for (let k = 0; k < 12; k++) {
        const a = k * TAU / 12, x = b.x + Math.cos(a) * 5, z = b.z + Math.sin(a) * 5;
        if (!inMap(Math.floor(x), Math.floor(z)) || solidTile(Math.floor(x), Math.floor(z)) || inGas(x, z, G.gasR - 1)) continue;
        const sc = dist(x, z, tgt.x, tgt.z) + (inBush(x, z) ? 3 : 0) + (los(x, z, tgt.x, tgt.z) ? 0 : 2);
        if (sc > bs) { bs = sc; bp = { x, z }; }
      }
      A.goal = bp || safePoint(b, 3);
    } else if (dd > pref + 1.3 || !losOk) { A.goal = { x: tgt.x, z: tgt.z }; A.mode = 'chase'; }
    else {
      if (G.t > A.strafeT) { A.strafe = -A.strafe; A.strafeT = G.t + rr(0.5, 1.4); }
      const dx = (b.x - tgt.x) / (dd || 1), dz = (b.z - tgt.z) / (dd || 1);
      const back = dd < pref - 1.2 ? 1 : dd > pref + 0.6 ? -0.5 : 0;
      A.dir = { x: dx * back + -dz * A.strafe * 0.9, z: dz * back + dx * A.strafe * 0.9 }; A.mode = 'fight';
    }
    // attack
    const keep = D.keep && hpF > 0.6 && dd > atk.range * 0.75 ? 2 : 1;
    if (b.ammo >= keep && G.t - b.lastAtk >= D.fireCd) fireAt(tgt.x, tgt.z, tgt.vx, tgt.vz, atk.range * (isLob ? 1 : 0.95), true);
    // super
    if (b.sup >= 1 && G.t >= A.reactAt && Math.random() < D.superP) {
      const s = H.sup; let ok = false;
      if (s.type === 'spread') ok = dd < 5.5 && losOk;
      else if (s.type === 'fan') ok = dd < s.range * 0.9 && los(b.x, b.z, tgt.x, tgt.z);
      else if (s.type === 'dash') ok = dd < 5.8 && los(b.x, b.z, tgt.x, tgt.z);
      else if (s.type === 'lob') ok = dd < s.range;
      else if (s.type === 'ring') ok = dd < 4.6;
      else if (s.type === 'turret') ok = dd < 8.5;
      else if (s.type === 'zone') ok = s.zone.k === 'heal' ? (hpF < 0.6 || (dd < 5 && hpF < 0.85)) : dd < s.range;
      else if (s.type === 'leap') ok = dd < s.range && (tHp < 0.75 || dd > 3);
      else if (s.type === 'stealth') ok = (dd < 7 && dd > 2.5) || hpF < 0.35;
      else if (s.type === 'shield') ok = dd < 6.5;
      if (ok) {
        if (s.type === 'zone' && s.zone.k === 'heal') { inp.aim = Math.atan2(tgt.z - b.z, tgt.x - b.x); inp.tx = b.x; inp.tz = b.z; }
        else if (s.type === 'turret') { const a = Math.atan2(tgt.z - b.z, tgt.x - b.x); inp.aim = a; inp.tx = b.x + Math.cos(a) * 3; inp.tz = b.z + Math.sin(a) * 3; }
        else aimAt(b, tgt.x, tgt.z, tgt.vx, tgt.vz, s.type === 'lob' ? s : Object.assign({}, s, { speed: s.speed || 16 }), D.err * 0.7);
        inp.sup = true; inp.fire = false;
      }
    }
    return;
  }
  if (tur) {
    const dd = dist(b.x, b.z, tur.x, tur.z);
    if (dd > atk.range * 0.9 || (!isLob && !los(b.x, b.z, tur.x, tur.z))) A.goal = { x: tur.x, z: tur.z };
    fireAt(tur.x, tur.z, 0, 0, atk.range * 0.92, true);
    if (gasDanger) A.goal = safePoint(b, 3);
    return;
  }
  if (gasDanger) { A.goal = safePoint(b, 3); A.mode = 'gas'; return; }
  const ls = A.lastSeen && entById(A.targetId);
  if (A.lastSeen && G.t - A.lastSeen.t < 2.2 && (G.t > 35 || (ls && ls.alive && ls.hp / ls.mhp < 0.4))) {
    A.goal = { x: A.lastSeen.x, z: A.lastSeen.z }; A.mode = 'hunt';
    if (b.ammo >= 2.5 && inBush(A.lastSeen.x, A.lastSeen.z) && Math.random() < 0.35) fireAt(A.lastSeen.x, A.lastSeen.z, 0, 0, atk.range, true);
    return;
  }
  // wounded: hide in a nearby bush and regenerate
  if (hpF < 0.7 && G.t - b.lastHurt < 8) {
    if (!A.heal || G.t > A.healT) {
      let bp = null, bs = 1e9;
      for (let k = 0; k < 40; k++) {
        const x = b.x + rr(-7, 7), z = b.z + rr(-7, 7);
        if (!inMap(Math.floor(x), Math.floor(z)) || tileAt(x, z) !== T_BUSH || inGas(x, z, G.gasR - 1.5)) continue;
        let sc = dist(b.x, b.z, x, z); for (const o of G.ents) if (o.alive && o.team !== b.team && d2(o.x, o.z, x, z) < 25) sc += 8;
        if (sc < bs) { bs = sc; bp = { x: Math.floor(x) + .5, z: Math.floor(z) + .5 }; }
      }
      A.heal = bp || safePoint(b, 3); A.healT = G.t + 4;
    }
    if (b.sup >= 1 && ((H.sup.type === 'zone' && H.sup.zone.k === 'heal') || H.sup.type === 'shield' || H.sup.type === 'stealth')) { inp.tx = b.x; inp.tz = b.z; inp.sup = true; }
    A.goal = A.heal; A.mode = 'heal'; return;
  }
  // nearby cubes first, then boxes
  let cube = null, cb = 100;
  for (const c of G.cubes) { const dd = d2(b.x, b.z, c.x, c.z); if (dd < cb && !inGas(c.x, c.z, G.gasR - 0.5)) { cb = dd; cube = c; } }
  if (cube && cb < 10 * 10) { A.goal = { x: cube.x, z: cube.z }; A.mode = 'cube'; return; }
  let box = null, bb = 15 * 15;
  let bs = 1e9;
  for (const bx of M.boxes) {
    if (bx.hp <= 0) continue; const x = bx.tx + .5, z = bx.tz + .5; if (inGas(x, z, G.gasR - 1)) continue;
    const dd = d2(b.x, b.z, x, z); if (dd > bb) continue;
    let sc = Math.sqrt(dd);
    for (const o of G.ents) if (o !== b && o.alive && o.team !== b.team && d2(o.x, o.z, x, z) < 3.5 * 3.5) { sc += 6; break; }
    if (G.t < 25 && d2(x, z, H2(), H2()) < 36) sc += 4;
    if (sc < bs) { bs = sc; box = bx; }
  }
  if (box) bb = d2(b.x, b.z, box.tx + .5, box.tz + .5);
  if (box) {
    const x = box.tx + .5, z = box.tz + .5, dd = Math.sqrt(bb), rng = Math.min(atk.range * 0.85, Math.max(1.6, H.ai.pref));
    const losOk = isLob || los(b.x, b.z, x, z, true);
    if (dd > rng || !losOk) A.goal = { x, z };
    else { A.dir = { x: 0, z: 0 }; }
    A.mode = 'box';
    // don't spray a box while a stranger is standing next to it (that starts fights)
    let crowd = false;
    if (G.t < 40) for (const o of G.ents) { if (o === b || !o.alive || o.team === b.team) continue; if (d2(o.x, o.z, x, z) < 2.8 * 2.8 || segDist(b.x, b.z, x, z, o.x, o.z) < 1.3) { crowd = true; break; } }
    if (crowd) { A.goal = null; A.dir = null; A.wander = null; A.mode = 'roam'; return; }
    if (b.ammo >= 1 && dd <= atk.range * 0.95 && losOk) { aimAt(b, x, z, 0, 0, atk, D.err * 0.5); inp.fire = true; }
    return;
  }
  // wander
  if (!A.wander || G.t > A.wanderT || d2(b.x, b.z, A.wander.x, A.wander.z) < 1 || inGas(A.wander.x, A.wander.z, G.gasR - 2)) {
    const h = H2(), R = Math.max(1, G.gasR - 3), lr = G.t < 60 ? 6 : 10;
    let w = null;
    for (let k = 0; k < 24 && !w; k++) {
      const x = clamp(b.x + rr(-lr, lr), h - R, h + R), z = clamp(b.z + rr(-lr, lr), h - R, h + R), t = tileAt(x, z);
      if (t === T_FLOOR || (t === T_BUSH && Math.random() < 0.8)) w = { x: Math.floor(x) + .5, z: Math.floor(z) + .5 };
    }
    A.wander = w || { x: h, z: h }; A.wanderT = G.t + rr(4, 8);
  }
  A.goal = A.wander; A.mode = 'roam';
}
function botSteer(b, A, dt) {
  let mx = 0, mz = 0;
  if (A.unstick && G.t < A.unstickT) { mx = A.unstick.x; mz = A.unstick.z; }
  else if (A.dodge && G.t < A.dodgeT) { mx = A.dodge.x; mz = A.dodge.z; }
  else if (A.dir) {
    mx = A.dir.x; mz = A.dir.z;
    const L = Math.hypot(mx, mz);
    if (L > 0.05) {
      mx /= L; mz /= L;
      let ok = false;
      for (const rot of [0, 0.6, -0.6, 1.2, -1.2, 2.0, -2.0]) {
        const c = Math.cos(rot), s = Math.sin(rot), nx = mx * c - mz * s, nz = mx * s + mz * c;
        const ax = b.x + nx * 0.75, az = b.z + nz * 0.75;
        if (!solidTile(Math.floor(ax), Math.floor(az)) && !inGas(ax, az, G.gasR - 0.6)) { mx = nx; mz = nz; ok = true; break; }
      }
      if (!ok) { mx = 0; mz = 0; }
    }
  } else if (A.goal) {
    const gk = tIdx(clamp(Math.floor(A.goal.x), 0, M.N - 1), clamp(Math.floor(A.goal.z), 0, M.N - 1));
    if (gk !== A.pathKey || G.t > A.pathT || !A.path.length) { A.path = astar(b.x, b.z, A.goal.x, A.goal.z); A.pathT = G.t + rr(0.6, 1.0); A.pathKey = gk; }
    while (A.path.length && d2(b.x, b.z, A.path[0].x, A.path[0].z) < 0.3 * 0.3) A.path.shift();
    // shortcut: aim at the second waypoint if reachable straight
    let wp = A.path[0];
    if (A.path.length > 1 && walkLine(b.x, b.z, A.path[1].x, A.path[1].z)) wp = A.path[1];
    if (!wp) wp = A.goal;
    mx = wp.x - b.x; mz = wp.z - b.z;
    const L = Math.hypot(mx, mz);
    if (L < 0.15 && A.path.length <= 1) { mx = mz = 0; } else { mx /= L || 1; mz /= L || 1; }
  }
  // separation from nearby teammates
  for (const o of G.ents) {
    if (o === b || !o.alive || o.team !== b.team) continue;
    const dx = b.x - o.x, dz = b.z - o.z, dd = dx * dx + dz * dz;
    if (dd < 1.2 && dd > 1e-4) { const d = Math.sqrt(dd); mx += dx / d * 0.5 * (1.1 - d); mz += dz / d * 0.5 * (1.1 - d); }
  }
  // stuck detection
  const want = Math.hypot(mx, mz) > 0.3;
  if (want && d2(b.x, b.z, A.lx, A.lz) < 0.0004) { A.stuckT += dt; if (A.stuckT > 0.5) { const a = Math.random() * TAU; A.unstick = { x: Math.cos(a), z: Math.sin(a) }; A.unstickT = G.t + 0.45; A.stuckT = 0; A.pathT = 0; } }
  else A.stuckT = 0;
  A.lx = b.x; A.lz = b.z;
  b.inp.mx = mx; b.inp.mz = mz;
  // aim facing when not attacking: look where walking
  if (!b.inp.fire && Math.hypot(mx, mz) > 0.1 && G.t - b.lastAtk > 0.5) b.inp.aim = Math.atan2(mz, mx);
}
function segDist(ax, az, bx, bz, px, pz) { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1); return dist(ax + dx * t, az + dz * t, px, pz); }
function walkLine(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), n = Math.ceil(L / 0.3);
  const nx = -dz / (L || 1) * BAL.R, nz = dx / (L || 1) * BAL.R;
  for (let i = 1; i <= n; i++) {
    const x = ax + dx * i / n, z = az + dz * i / n;
    if (solidTile(Math.floor(x + nx), Math.floor(z + nz)) || solidTile(Math.floor(x - nx), Math.floor(z - nz))) return false;
  }
  return true;
}
