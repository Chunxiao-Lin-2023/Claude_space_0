/* ================= zombie AI (host only) ================= */
function zTarget(z) {
  const Z = ZT[z.k];
  let best = { kind: 'r', x: RADIO.x, y: GY }, bc = Math.abs(RADIO.x - z.x) * 0.9 + 6 * T;
  for (const p of W.p) {
    if (p.gone || p.dead) continue;
    const dx = Math.abs(p.x - z.x), dy = p.y - z.y;
    const reachY = z.k === 'climber' ? 14 * T : z.k === 'spitter' ? 12 * T : 3.2 * T;
    if (dx > 13 * T || Math.abs(dy) > reachY) continue;
    const c = dx + Math.abs(dy) * (z.k === 'climber' ? 0.6 : 1.6) - (p.down ? 1.5 * T : 0);
    if (c < bc) { bc = c; best = { kind: 'p', i: p.i, x: p.x, y: p.y }; }
  }
  return best;
}
// nearest block the zombie can reach to smash when it can't get at its target (target above / below)
function findBash(z, up) {
  const fr = Math.floor((z.y - 1) / T), cx = Math.floor(z.x / T);
  let best = -1, bd = 1e9;
  if (!up) { // target below: smash the floor we stand on
    const i = ix(cx, Math.floor((z.y + 1) / T)), t = W.tiles[i];
    if (t && t !== DIRT) return i;
  }
  for (let dx = -5; dx <= 5; dx++) for (let r = fr; r >= fr - 1; r--) {
    const tx = cx + dx, t = tileAt(tx, r); if (!t || t === DIRT || TF[t].wire || TF[t].lamp) continue;
    const d = Math.abs(dx) + (TF[t].lad ? -0.5 : 0) + (r < fr ? 0.3 : 0);
    if (d < bd) { bd = d; best = ix(tx, r); }
  }
  return best;
}
function zAttackTile(z, i) {
  z.st = 'attack'; z.atk = 0.25; z.vx *= 0.2;
  if (z.cd > 0) return;
  z.cd = ZT[z.k].cd;
  const t = W.tiles[i]; if (!t) return;
  damageTile(i, ZT[z.k].bdmg * W.D.dmg);
  emit({ k: 'bash', i, z: z.k, brk: W.tiles[i] ? 0 : 1 });
}
function stepZombies(dt) {
  const zs = W.zs;
  const byId = new Map(); for (const z of zs) byId.set(z.id, z);
  for (const z of zs) {
    if (z.hp <= 0) continue;
    const Z = ZT[z.k];
    z.cd -= dt; z.hitT -= dt; z.atk -= dt; z.anim += dt;
    if (z.stun > 0) z.stun -= dt;
    // targeting
    z.retT -= dt;
    if (z.retT <= 0 || !z.tgt) { z.retT = 0.35 + W.rng() * 0.2; z.tgt = zTarget(z); z.bash = -1; }
    const tg = z.tgt; if (tg.kind === 'p') { const p = W.p[tg.i]; if (p && !p.dead && !p.gone) { tg.x = p.x; tg.y = p.y; } else z.retT = 0; }
    let tx = tg.x;
    const dyT = tg.y - z.y;
    // can't reach target vertically -> smash something nearby
    const under = Math.abs(tx - z.x) < 1.2 * T && (dyT < -1.5 * T || dyT > 1.5 * T) && z.k !== 'climber' && z.k !== 'spitter';
    if (under) {
      if (z.bash < 0 || !W.tiles[z.bash]) z.bash = findBash(z, dyT < 0);
      if (z.bash >= 0) tx = ((z.bash % MW) + 0.5) * T;
    } else z.bash = -1;
    // spitter keeps range and lobs acid
    let dir = Math.abs(tx - z.x) < 0.3 * T ? 0 : sgn(tx - z.x);
    if (z.k === 'spitter' && tg.kind === 'p') {
      const d = Math.abs(tg.x - z.x);
      if (d < Z.range * 0.8 && Math.abs(dyT) < 12 * T) dir = d < Z.range * 0.45 ? -sgn(tg.x - z.x) : 0;
      z.spitT -= dt;
      if (z.spitT <= 0 && d < Z.range * 1.1) {
        z.spitT = Z.spitCD * (0.8 + W.rng() * 0.4);
        const sx = z.x + z.face * 0.4 * T, sy = z.y - z.h * 0.75, fl = 0.9 + d / (Z.range * 2);
        const vx = (tg.x - sx) / fl, vy = (tg.y - T - sy - 0.5 * GRAV * 0.55 * fl * fl) / fl;
        W.proj.push({ k: 'acid', x: sx, y: sy, vx, vy });
        emit({ k: 'sfx', n: 'spit', x: sx, y: sy });
      }
    }
    if (dir) z.face = dir;
    z.st = 'walk';
    // wire
    const wireI = ix(clamp(Math.floor(z.x / T), 0, MW - 1), clamp(Math.floor((z.y - 2) / T), 0, MH - 1));
    let slow = 1;
    if (TF[W.tiles[wireI]] && TF[W.tiles[wireI]].wire) {
      slow = BAL.wireSlow; hurtZombie(z, BAL.wireDps * dt, null, 0);
      W.thp[wireI] -= BAL.wireWear * dt * (z.k === 'brute' || z.k === 'boss' ? 4 : 1); W.dirty.add(wireI);
      if (W.thp[wireI] <= 0) destroyTile(wireI, 'brk');
      if (z.hp <= 0) continue;
    }
    // riding on another zombie
    if (z.ride) {
      const o = byId.get(z.ride);
      if (!o || o.hp <= 0 || Math.abs(o.x - z.x) > (o.w + z.w) / 2 * 0.8) { z.ride = 0; z.lvl = 0; }
      else { z.y = o.y - o.h; z.vy = 0; z.lvl = o.lvl + 1; }
    }
    const want = z.stun > 0 ? 0 : dir * z.spd * slow;
    z.vx = lerp(z.vx, want, Math.min(1, dt * (z.stun > 0 ? 2 : 6)));
    // climber on a wall or a ladder
    if (z.k === 'climber') {
      const onLad = TF[tileAt(Math.floor(z.x / T), Math.floor((z.y - 2) / T))].lad || TF[tileAt(Math.floor(z.x / T), Math.floor((z.y - z.h + 2) / T))].lad;
      if (z.climbing === 'lad' && (!onLad || dyT > -0.5 * T)) z.climbing = false;
      if (!z.climbing && onLad && dyT < -1.2 * T && Math.abs(tg.x - z.x) < 6 * T) z.climbing = 'lad';
      if (z.climbing === 'wall') {
        const fx = z.x + z.face * (z.w / 2 + 3), fr0 = Math.floor((z.y - z.h + 1) / T), fr1 = Math.floor((z.y - 1) / T);
        let wall = false; for (let r = fr0; r <= fr1; r++) if (solidFor(tileAt(Math.floor(fx / T), r), 'z')) wall = true;
        if (!wall) { z.climbing = false; z.vx = z.face * z.spd; z.vy = -160; }
      }
      if (z.climbing) {
        z.vy = -Z.climb * slow;
        if (z.climbing === 'lad') { z.vx = 0; z.x = lerp(z.x, (Math.floor(z.x / T) + 0.5) * T, Math.min(1, dt * 8)); }
        else z.vx = z.face * 25;
        z.ride = 0;
      }
    }
    if (!z.climbing && !z.ride) z.vy = Math.min(1300, z.vy + GRAV * dt);
    const py = z.y;
    if (z.ride) { z.climbing = false; const ry = z.y; moveBody(z, dt, 'z'); z.y = ry; z.ground = true; }
    else moveBody(z, dt, 'z');
    if (z.climbing === 'wall' && z.hitHead) { z.climbing = false; zAttackTile(z, z.headTile); }
    // landing on other zombies (pile-ups)
    if (!z.ground && z.vy > 0 && !z.climbing) {
      for (const o of zs) {
        if (o === z || o.hp <= 0 || o.ride === z.id) continue;
        const top = o.y - o.h;
        if (Math.abs(o.x - z.x) < (o.w + z.w) / 2 * 0.55 && py <= top + 2 && z.y >= top) { z.y = top; z.vy = 0; z.ride = o.id; z.ground = true; z.lvl = o.lvl + 1; break; }
      }
    }
    // blocked by a block: climb it or smash it
    if (z.blockX && z.blockTile >= 0 && dir) {
      if (z.k === 'climber' && !z.climbing) { z.climbing = 'wall'; }
      else if (!z.climbing) zAttackTile(z, z.blockTile);
    }
    // smash target block within reach
    if (z.bash >= 0 && W.tiles[z.bash]) {
      const bx = ((z.bash % MW) + 0.5) * T, by = (((z.bash / MW) | 0) + 0.5) * T;
      if (Math.abs(bx - z.x) < z.w / 2 + T * 0.75 && by > z.y - z.h - T && by < z.y + T) zAttackTile(z, z.bash);
    }
    // pile up: hop onto a stalled zombie in front
    if (dir && !z.climbing && z.ground && z.k !== 'brute' && z.k !== 'boss' && z.lvl < 3 && z.st !== 'attack') {
      for (const o of zs) {
        if (o === z || o.hp <= 0 || o.ride === z.id || z.ride === o.id) continue;
        const ahead = (o.x - z.x) * dir;
        if (ahead > 0 && ahead < (o.w + z.w) / 2 + 2 && Math.abs(o.y - z.y) < 6 && (o.st === 'attack' || Math.abs(o.vx) < 12 || o.climbing)) {
          if (!boxSolid(z.x, z.y - o.h, z.w, z.h, 'z')) { z.vy = -Math.sqrt(2 * GRAV * (o.h + 8)); z.ground = false; }
          break;
        }
      }
    }
    // radio
    if (tg.kind === 'r' && Math.abs(z.x - RADIO.x) < RADIO.w / 2 + z.w / 2 + 6 && Math.abs(z.y - GY) < T) {
      z.st = 'attack'; z.atk = 0.25; z.vx *= 0.2;
      if (z.cd <= 0) {
        z.cd = Z.cd; W.radio.hp -= Z.bdmg * BAL.radioDmg * W.D.dmg; W.radio.hitT = 0.2;
        emit({ k: 'rhit', z: z.k });
        if (W.radio.alarmT <= 0) { W.radio.alarmT = 6; say('电台正在被攻击！', '#ff6b6b'); }
        if (W.radio.hp <= 0) { W.radio.hp = 0; checkLose(); }
      }
    }
    // bite players in reach
    for (const p of W.p) {
      if (p.gone || p.dead) continue;
      if (Math.abs(p.x - z.x) < (p.w + z.w) / 2 + 0.3 * T && p.y > z.y - z.h + 4 && p.y - p.h < z.y - 4) {
        z.st = 'attack'; z.atk = 0.25; z.face = sgn(p.x - z.x) || z.face;
        if (z.cd <= 0) {
          z.cd = Z.cd; hurtPlayer(p, Z.dmg * W.D.dmg, z);
          if (Z.kb) knock(p, sgn(p.x - z.x) * Z.kb, -260);
        }
        break;
      }
    }
    if (z.y > (MH + 3) * T) z.hp = 0;
  }
  // soft separation on the same level
  for (let a = 0; a < zs.length; a++) {
    const A = zs[a]; if (A.hp <= 0 || A.climbing) continue;
    for (let b = a + 1; b < zs.length; b++) {
      const B = zs[b]; if (B.hp <= 0 || B.climbing || A.ride === B.id || B.ride === A.id) continue;
      const dx = B.x - A.x, minD = (A.w + B.w) / 2 * 0.62;
      if (Math.abs(dx) < minD && Math.abs(A.y - B.y) < 8) {
        const push = (minD - Math.abs(dx)) * 0.5 * Math.min(1, dt * 10) * (sgn(dx) || 1);
        if (!boxSolid(A.x - push, A.y, A.w, A.h, 'z')) A.x -= push;
        if (!boxSolid(B.x + push, B.y, B.w, B.h, 'z')) B.x += push;
      }
    }
  }
  W.zs = zs.filter(z => z.hp > 0);
}
