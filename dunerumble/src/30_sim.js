/* ================= simulation (host / solo authoritative) ================= */
let G = null;
const H2 = () => BAL.N / 2;

function newGame(cfg) {
  // cfg: {seed, theme, mode:'solo'|'duo', diff, roster:[{name,hero,human,team}]}
  genMap(cfg.seed, cfg.theme);
  G = { t: 0, cfg, ents: [], projs: [], cubes: [], turrets: [], ev: [], evSeq: 0, id: 1, destroyed: [], alive: new Set(), placement: {}, over: false, winner: -1, gasR: H2(), gasTick: 0 };
  const teams = {};
  for (const o of cfg.roster) (teams[o.team] = teams[o.team] || []).push(o);
  const teamIds = Object.keys(teams).map(Number);
  // shuffle spawn slots
  const slots = M.spawns.map((s, i) => i);
  const srng = mulberry32(cfg.seed + 5);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(srng() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  teamIds.forEach((tm, ti) => {
    const members = teams[tm];
    const sp = M.spawns[cfg.mode === 'duo' ? slots[ti * 2] : slots[ti]];
    members.forEach((o, mi) => {
      const b = mkBrawler(o);
      const off = members.length > 1 ? (mi ? 0.6 : -0.6) : 0;
      // offset along the tangent of the spawn ring
      const ang = Math.atan2(sp.z - H2(), sp.x - H2());
      b.x = sp.x + Math.cos(ang + Math.PI / 2) * off; b.z = sp.z + Math.sin(ang + Math.PI / 2) * off;
      b.face = b.aim = Math.atan2(H2() - b.z, H2() - b.x);
      G.ents.push(b);
    });
    G.alive.add(tm);
  });
  return G;
}
function mkBrawler(o) {
  const H = HEROES[o.hero];
  return {
    id: G.id++, kind: 'b', hero: o.hero, H, name: o.name, team: o.team, human: o.human || 0, isBot: !o.human,
    x: 0, z: 0, vx: 0, vz: 0, face: 0, aim: 0, mface: 0, moving: false,
    hp: H.hp * BAL.hpMul, mhp: H.hp * BAL.hpMul, cubes: 0, lastHurtBy: 0, ammo: BAL.ammoMax, sup: 0, alive: true,
    lastHurt: -9, lastAtk: -9, atkSeq: 0, supSeq: 0, revealT: 0, stunT: 0, fm: null, burst: null, inBush: false,
    kills: 0, dmg: 0, deathT: 0, respawnT: 0, posSeq: 0, flashT: 0, gasAcc: 0, supReadySent: false, born: G.t,
    inp: { mx: 0, mz: 0, aim: 0, tx: 0, tz: 0, fire: false, sup: false, hold: false }, ai: null, remotePos: null,
  };
}
function ev(k, o) { o.k = k; o.seq = ++G.evSeq; o.tt = G.t; G.ev.push(o); if (G.ev.length > 300) G.ev.splice(0, G.ev.length - 300); onLocalEvent(o); }
const entById = id => G.ents.find(e => e.id === id);

/* ---------- movement & collision ---------- */
function resolveCircle(e, r) {
  const x0 = Math.floor(e.x - r), x1 = Math.floor(e.x + r), z0 = Math.floor(e.z - r), z1 = Math.floor(e.z + r);
  for (let tz = z0; tz <= z1; tz++) for (let tx = x0; tx <= x1; tx++) {
    if (!solidTile(tx, tz)) continue;
    const cx = clamp(e.x, tx, tx + 1), cz = clamp(e.z, tz, tz + 1);
    let dx = e.x - cx, dz = e.z - cz; const dd = dx * dx + dz * dz;
    if (dd >= r * r) continue;
    if (dd < 1e-8) { // center inside tile: push out along shortest axis
      const pl = e.x - tx, pr = tx + 1 - e.x, pu = e.z - tz, pd = tz + 1 - e.z, m = Math.min(pl, pr, pu, pd);
      if (m === pl) e.x = tx - r; else if (m === pr) e.x = tx + 1 + r; else if (m === pu) e.z = tz - r; else e.z = tz + 1 + r;
      continue;
    }
    const d = Math.sqrt(dd), push = r - d; e.x += dx / d * push; e.z += dz / d * push;
  }
}
function moveCircle(e, dx, dz, r = BAL.R) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.2));
  for (let i = 0; i < steps; i++) { e.x += dx / steps; resolveCircle(e, r); e.z += dz / steps; resolveCircle(e, r); }
  e.x = clamp(e.x, 1 + r, BAL.N - 1 - r); e.z = clamp(e.z, 1 + r, BAL.N - 1 - r);
}

/* ---------- visibility (bushes) ---------- */
function visibleTo(e, team) {
  if (e.team === team) return true;
  if (!e.inBush || e.revealT > 0) return true;
  for (const a of G.ents) if (a.alive && a.team === team && d2(a.x, a.z, e.x, e.z) < BAL.bushSeeR * BAL.bushSeeR) return true;
  for (const t of G.turrets) if (t.team === team && d2(t.x, t.z, e.x, e.z) < BAL.bushSeeR * BAL.bushSeeR) return true;
  return false;
}
function gasRAt(t) {
  if (t < BAL.gasStart) return H2();
  return lerp(H2() - 0.5, BAL.gasMin, clamp((t - BAL.gasStart) / (BAL.gasEnd - BAL.gasStart), 0, 1));
}
const inGas = (x, z, R) => Math.abs(x - H2()) > R || Math.abs(z - H2()) > R;

/* ---------- attacks ---------- */
function dmgMul(b) { return 1 + BAL.cubeDmg * b.cubes; }
function spawnProj(b, kind, x, z, ang, a, isSup, extra) {
  const p = Object.assign({
    id: G.id++, k: kind, team: b.team, owner: b.id, x, z, y: 0.72, vx: Math.cos(ang) * a.speed, vz: Math.sin(ang) * a.speed,
    life: a.range / a.speed, dmg: a.dmg * dmgMul(b), size: a.size || 0.2, pierce: !!a.pierce, hit: null, kb: a.kb || 0,
    breakWalls: !!a.breakWalls, wallBreaks: 0, bounces: a.bounces || 0, sup: isSup,
  }, extra || {});
  if (p.pierce) p.hit = new Set();
  G.projs.push(p); return p;
}
function fire(b, isSup, aim, tx, tz) {
  const H = b.H, a = isSup ? H.sup : H.atk;
  b.lastAtk = G.t; b.face = aim; b.aim = aim;
  if (b.inBush) b.revealT = BAL.revealT;
  if (isSup) b.supSeq++; else b.atkSeq++;
  const cs = Math.cos(aim), sn = Math.sin(aim), mx = b.x + cs * 0.45, mz = b.z + sn * 0.45;
  switch (a.type) {
    case 'spread': for (let i = 0; i < a.n; i++) { const an = aim + (i / (a.n - 1) - 0.5) * a.spread + rr(-0.025, 0.025); spawnProj(b, a.proj, mx, mz, an, a, isSup); } break;
    case 'single': spawnProj(b, a.proj, mx, mz, aim, a, isSup); break;
    case 'fan': { const hs = new Set(); for (let i = 0; i < a.n; i++) { const an = aim + (i / (a.n - 1) - 0.5) * a.spread; spawnProj(b, a.proj, mx, mz, an, a, isSup).hit = hs; } } break;
    case 'flame': for (let i = 0; i < a.n; i++) { const an = aim + rr(-0.5, 0.5) * a.spread, sp = a.speed * rr(0.85, 1.12); spawnProj(b, a.proj, mx, mz, an, Object.assign({}, a, { speed: sp }), isSup, { life: a.range / sp * rr(0.9, 1.05), delay: i * 0.035 }); } break;
    case 'lob': {
      let dx = tx - b.x, dz = tz - b.z, L = Math.hypot(dx, dz);
      if (L < 0.01) { dx = cs; dz = sn; L = 1; }
      const D = Math.min(L, a.range);
      const ex = b.x + dx / L * D, ez = b.z + dz / L * D;
      spawnProj(b, a.proj, mx, mz, aim, Object.assign({ speed: 1 }, a), isSup, { lob: { sx: mx, sz: mz, tx: ex, tz: ez, t: 0, T: a.flight, h: 1.6 + D * 0.2 }, radius: a.radius, life: 99 });
    } break;
    case 'burst': b.burst = { k: 'burst', left: a.n, next: G.t, aim, i: 0, a, sup: isSup }; break;
    case 'ring': b.burst = { k: 'ring', left: a.waves, next: G.t, aim, i: 0, a, sup: isSup }; break;
    case 'bounce': spawnProj(b, a.proj, mx, mz, aim, a, isSup); break;
    case 'dash': {
      b.fm = { k: 'dash', vx: cs * a.speed, vz: sn * a.speed, t: a.range / a.speed, dmg: a.dmg * dmgMul(b), kb: a.kb, hit: new Set(), breakWalls: true };
      b.stunT = 0;
    } break;
    case 'turret': {
      let dx = tx - b.x, dz = tz - b.z, L = Math.hypot(dx, dz);
      if (L < 0.01) { dx = cs; dz = sn; L = 1; }
      const D = Math.min(L, a.range);
      let px = b.x + dx / L * D, pz = b.z + dz / L * D;
      // nudge to a free tile
      if (solidTile(Math.floor(px), Math.floor(pz))) { px = b.x + cs * 0.9; pz = b.z + sn * 0.9; if (solidTile(Math.floor(px), Math.floor(pz))) { px = b.x; pz = b.z; } }
      const old = G.turrets.filter(t => t.owner === b.id); for (const t of old) { t.hp = 0; }
      G.turrets.push({ id: G.id++, kind: 't', owner: b.id, team: b.team, x: px, z: pz, hp: BAL.turretHp * dmgMul(b), mhp: BAL.turretHp * dmgMul(b), life: BAL.turretLife, cd: 0.6, face: aim, born: G.t, flashT: 0 });
      ev('turret', { x: px, z: pz });
    } break;
  }
  ev('shot', { id: b.id, h: b.hero, s: isSup ? 1 : 0, x: b.x, z: b.z, a: aim });
}
function stepBurst(b) {
  const B = b.burst; if (!B) return;
  while (b.burst && G.t >= B.next) {
    const a = B.a;
    if (B.k === 'burst') {
      const side = (B.i % 2 ? 1 : -1) * 0.2, aim = B.aim + rr(-0.03, 0.03);
      const cs = Math.cos(B.aim), sn = Math.sin(B.aim);
      spawnProj(b, a.proj, b.x + cs * 0.45 - sn * side, b.z + sn * 0.45 + cs * side, aim, a, B.sup);
      B.next += a.gap;
    } else {
      const off = B.i * Math.PI / a.n;
      for (let j = 0; j < a.n; j++) { const an = B.aim + off + j * TAU / a.n; spawnProj(b, a.proj, b.x + Math.cos(an) * 0.4, b.z + Math.sin(an) * 0.4, an, a, B.sup); }
      B.next += 0.28; ev('shot', { id: b.id, h: b.hero, s: 2, x: b.x, z: b.z, a: B.aim });
    }
    B.i++; B.left--;
    if (B.left <= 0) b.burst = null;
  }
}

/* ---------- damage ---------- */
function hurt(t, dmg, src, o = {}) {
  if (t.kind === 'b' && !t.alive) return;
  if (t.kind === 't' && t.hp <= 0) return;
  if (window.__dbg && window.__dbg.god && t.human === 1) return;
  dmg = Math.round(dmg);
  t.hp -= dmg; t.flashT = 0.12;
  if (t.kind === 'b') {
    t.lastHurt = G.t; if (src && src.kind === 'b') t.lastHurtBy = src.id; if (t.inBush) t.revealT = BAL.revealT;
    if (o.kb) {
      const L = Math.hypot(o.dx, o.dz) || 1;
      t.fm = { k: 'kb', vx: o.dx / L * o.kb / 0.28, vz: o.dz / L * o.kb / 0.28, t: 0.28 }; t.stunT = 0.35; t.burst = null; t.posSeq++;
    }
  }
  ev('hit', { id: t.id, x: +t.x.toFixed(2), z: +t.z.toFixed(2), v: dmg, g: o.gas ? 1 : 0, s: src ? src.id : 0 });
  if (src && src.kind === 'b' && src.alive !== undefined) {
    src.dmg += dmg;
    if (t.kind === 'b' && !o.sup && !o.gas) src.sup = Math.min(1, src.sup + src.H.charge * (o.chargeMul || 1));
  }
  if (t.hp <= 0) { if (t.kind === 'b') kill(t, src); else { t.hp = 0; } }
}
function kill(b, src) {
  b.alive = false; b.hp = 0; b.deathT = G.t; b.fm = null; b.burst = null;
  const n = Math.max(1, b.cubes);
  for (let i = 0; i < n; i++) dropCube(b.x, b.z, i, n);
  b.cubes = 0; b.mhp = b.H.hp * BAL.hpMul;
  if (src && src.kind === 'b' && src !== b) src.kills++;
  ev('kill', { v: b.id, by: src ? src.id : 0 });
  if (G.cfg.mode === 'duo') {
    const mate = G.ents.find(e => e !== b && e.team === b.team);
    if (mate && mate.alive) { b.respawnT = G.t + BAL.duoRespawn; return; }
    if (mate) mate.respawnT = 0;
  }
  teamOut(b.team);
}
function teamOut(team) {
  if (!G.alive.has(team)) return;
  const rank = G.alive.size; G.placement[team] = rank; G.alive.delete(team);
  ev('out', { team, rank });
  if (G.alive.size <= 1 && !G.over) {
    const w = [...G.alive][0]; G.winner = w == null ? -1 : w; if (w != null) G.placement[w] = 1; G.over = true;
    ev('end', { team: G.winner });
  }
}
function respawn(b) {
  const mate = G.ents.find(e => e !== b && e.team === b.team && e.alive);
  b.respawnT = 0; if (!mate) return;
  let bx = mate.x, bz = mate.z;
  for (let k = 0; k < 16; k++) { const a = k * TAU / 16, x = mate.x + Math.cos(a) * 1.1, z = mate.z + Math.sin(a) * 1.1; if (!solidTile(Math.floor(x), Math.floor(z))) { bx = x; bz = z; break; } }
  Object.assign(b, { alive: true, x: bx, z: bz, hp: b.H.hp * BAL.hpMul, mhp: b.H.hp * BAL.hpMul, ammo: BAL.ammoMax, cubes: 0, lastHurt: -9, fm: null, stunT: 0, born: G.t });
  b.posSeq++;
  ev('respawn', { id: b.id, x: bx, z: bz });
}
function dropCube(x, z, i, n) {
  const a = (i / n) * TAU + Math.random() * 0.5, r = n > 1 ? 0.7 + Math.random() * 0.3 : 0;
  let cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
  if (solidTile(Math.floor(cx), Math.floor(cz))) { cx = x; cz = z; }
  G.cubes.push({ id: G.id++, x: cx, z: cz, born: G.t });
}
function damageBox(i, dmg, src) {
  const bi = M.box[i]; if (bi < 0) return;
  const bx = M.boxes[bi]; bx.hp -= dmg; bx.flashT = 0.1;
  ev('bhit', { b: bi, v: Math.round(dmg), x: bx.tx + .5, z: bx.tz + .5 });
  if (bx.hp <= 0) { bx.hp = 0; M.box[i] = -1; M.ver++; dropCube(bx.tx + .5, bx.tz + .5, 0, 1); ev('box', { b: bi, x: bx.tx + .5, z: bx.tz + .5 }); }
}
function destroyTile(i) {
  const t = M.t[i]; if (t !== T_WALL && t !== T_BUSH) return false;
  M.t[i] = T_FLOOR; M.ver++; G.destroyed.push(i);
  ev('wall', { i, w: t === T_WALL ? 1 : 0, s: M.sty[i] });
  return t === T_WALL;
}
function explode(p) {
  const r = p.radius, owner = entById(p.owner);
  for (const e of G.ents) if (e.alive && e.team !== p.team && d2(e.x, e.z, p.x, p.z) < (r + BAL.R) ** 2) hurt(e, p.dmg, owner, { sup: p.sup });
  for (const t of G.turrets) if (t.team !== p.team && d2(t.x, t.z, p.x, p.z) < (r + 0.4) ** 2) hurt(t, p.dmg, owner, { sup: p.sup });
  const x0 = Math.floor(p.x - r - 1), x1 = Math.floor(p.x + r + 1), z0 = Math.floor(p.z - r - 1), z1 = Math.floor(p.z + r + 1);
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (!inMap(x, z)) continue; const i = tIdx(x, z);
    if (d2(x + .5, z + .5, p.x, p.z) > (r + 0.45) ** 2) continue;
    if (M.box[i] >= 0) damageBox(i, p.dmg, owner);
    else if (p.breakWalls) destroyTile(i);
  }
  ev('boom', { x: +p.x.toFixed(2), z: +p.z.toFixed(2), r, big: p.breakWalls ? 1 : 0 });
}

/* ---------- step ---------- */
function stepProj(p, dt) {
  if (p.delay > 0) { p.delay -= dt; return true; }
  if (p.lob) {
    const L = p.lob; L.t += dt; const f = Math.min(1, L.t / L.T);
    p.x = lerp(L.sx, L.tx, f); p.z = lerp(L.sz, L.tz, f); p.y = 0.8 + Math.sin(f * Math.PI) * L.h - f * 0.6;
    if (f >= 1) { p.x = L.tx; p.z = L.tz; explode(p); return false; }
    return true;
  }
  const sp = Math.hypot(p.vx, p.vz), n = Math.max(1, Math.ceil(sp * dt / 0.14));
  for (let s = 0; s < n; s++) {
    const px = p.x, pz = p.z;
    p.x += p.vx * dt / n; p.z += p.vz * dt / n;
    const tx = Math.floor(p.x), tz = Math.floor(p.z);
    if (blockShotTile(tx, tz)) {
      const i = inMap(tx, tz) ? tIdx(tx, tz) : -1;
      if (i >= 0 && M.box[i] >= 0) { damageBox(i, p.dmg, entById(p.owner)); ev('spark', { x: +px.toFixed(2), z: +pz.toFixed(2), c: 0 }); return false; }
      if (p.breakWalls && i >= 0 && M.t[i] === T_WALL) { destroyTile(i); if (++p.wallBreaks > 2) return false; continue; }
      if (p.bounces > 0) {
        p.bounces--;
        const bx = blockShotTile(Math.floor(p.x), Math.floor(pz)), bz = blockShotTile(Math.floor(px), Math.floor(p.z));
        if (bx || (!bx && !bz)) p.vx = -p.vx;
        if (bz || (!bx && !bz)) p.vz = -p.vz;
        p.x = px; p.z = pz; p.life += 0.05; ev('spark', { x: +px.toFixed(2), z: +pz.toFixed(2), c: 2 });
        continue;
      }
      ev('spark', { x: +px.toFixed(2), z: +pz.toFixed(2), c: p.k === 'flame' ? 1 : 0 });
      return false;
    }
    if (p.breakWalls && inMap(tx, tz) && M.t[tIdx(tx, tz)] === T_BUSH && p.sup) destroyTile(tIdx(tx, tz));
    // hit brawlers
    for (const e of G.ents) {
      if (!e.alive || e.team === p.team) continue;
      if (p.hit && p.hit.has(e.id)) continue;
      if (d2(e.x, e.z, p.x, p.z) < (p.size + BAL.R) ** 2) {
        const owner = entById(p.owner) || G.turrets.find(t => t.id === p.owner) || null;
        const src = owner && owner.kind === 'b' ? owner : (owner ? entById(owner.owner) : null);
        hurt(e, p.dmg, src, { sup: p.sup, kb: p.kb, dx: p.vx, dz: p.vz, chargeMul: p.k === 'tshot' ? 0 : 1 });
        if (p.hit) p.hit.add(e.id); else return false;
      }
    }
    for (const t of G.turrets) {
      if (t.team === p.team || t.hp <= 0) continue;
      if (p.hit && p.hit.has(t.id)) continue;
      if (d2(t.x, t.z, p.x, p.z) < (p.size + 0.42) ** 2) { hurt(t, p.dmg, entById(p.owner), { sup: true }); if (p.hit) p.hit.add(t.id); else return false; }
    }
  }
  p.life -= dt;
  return p.life > 0;
}
function stepTurret(t, dt) {
  t.life -= dt; t.flashT = Math.max(0, t.flashT - dt);
  if (t.life <= 0 || t.hp <= 0) { ev('tdie', { x: t.x, z: t.z }); return false; }
  t.cd -= dt;
  let best = null, bd = BAL.turretRange * BAL.turretRange;
  for (const e of G.ents) { if (!e.alive || e.team === t.team || !visibleTo(e, t.team)) continue; const dd = d2(e.x, e.z, t.x, t.z); if (dd < bd && los(t.x, t.z, e.x, e.z)) { bd = dd; best = e; } }
  if (best) {
    const a = Math.atan2(best.z - t.z, best.x - t.x); t.face = a;
    if (t.cd <= 0) {
      t.cd = BAL.turretRate; const own = entById(t.owner);
      const p = { id: G.id++, k: 'tshot', team: t.team, owner: t.owner, x: t.x + Math.cos(a) * 0.4, z: t.z + Math.sin(a) * 0.4, y: 0.9, vx: Math.cos(a) * 14, vz: Math.sin(a) * 14, life: BAL.turretRange / 14, dmg: BAL.turretDmg * (own ? dmgMul(own) : 1), size: 0.14, pierce: false, kb: 0, bounces: 0, sup: true };
      G.projs.push(p); ev('tshot', { x: t.x, z: t.z });
    }
  }
  return true;
}
function stepBrawler(b, dt) {
  if (!b.alive) { if (b.respawnT && G.t >= b.respawnT) respawn(b); return; }
  b.revealT = Math.max(0, b.revealT - dt); b.stunT = Math.max(0, b.stunT - dt); b.flashT = Math.max(0, b.flashT - dt);
  const inp = b.inp;
  if (b.isBot && !G.over) botThink(b, dt);
  const remote = b.human === 2 && NET.role === 'host';
  if (b.fm) {
    const f = b.fm, ox = b.x, oz = b.z;
    if (f.k === 'dash') {
      // break walls/bushes ahead
      const ax = b.x + Math.sign(f.vx) * 0.0 + f.vx * dt * 2, az = b.z + f.vz * dt * 2;
      for (const [cx, cz] of [[ax, az], [ax + f.vz / 40, az - f.vx / 40], [ax - f.vz / 40, az + f.vx / 40]]) {
        const tx = Math.floor(cx), tz = Math.floor(cz); if (!inMap(tx, tz)) continue; const i = tIdx(tx, tz);
        if (M.t[i] === T_WALL || M.t[i] === T_BUSH) destroyTile(i); else if (M.box[i] >= 0) damageBox(i, f.dmg, b);
      }
      for (const e of G.ents) if (e.alive && e.team !== b.team && !f.hit.has(e.id) && d2(e.x, e.z, b.x, b.z) < 0.9 * 0.9) { f.hit.add(e.id); hurt(e, f.dmg, b, { sup: true, kb: f.kb, dx: f.vx, dz: f.vz }); }
      for (const t of G.turrets) if (t.team !== b.team && !f.hit.has(t.id) && d2(t.x, t.z, b.x, b.z) < 0.9 * 0.9) { f.hit.add(t.id); hurt(t, f.dmg, b, { sup: true }); }
    }
    moveCircle(b, f.vx * dt, f.vz * dt);
    b.vx = (b.x - ox) / dt; b.vz = (b.z - oz) / dt; b.moving = true;
    f.t -= dt;
    if (f.k === 'dash' && Math.hypot(b.x - ox, b.z - oz) < Math.hypot(f.vx, f.vz) * dt * 0.25) f.t = 0; // blocked by water/border
    if (f.t <= 0) { b.fm = null; b.posSeq++; }
  } else if (remote) {
    if (b.remotePos) { const ox = b.x, oz = b.z; b.x = b.remotePos.x; b.z = b.remotePos.z; b.vx = (b.x - ox) / dt; b.vz = (b.z - oz) / dt; b.moving = !!b.remotePos.m; b.mface = b.remotePos.mf; }
  } else if (b.stunT <= 0) {
    let mx = inp.mx, mz = inp.mz; const L = Math.hypot(mx, mz);
    if (L > 1) { mx /= L; mz /= L; }
    const sp = b.H.spd * (b.burst && b.burst.k === 'ring' ? 0.4 : 1);
    const ox = b.x, oz = b.z;
    moveCircle(b, mx * sp * dt, mz * sp * dt);
    b.vx = (b.x - ox) / dt; b.vz = (b.z - oz) / dt;
    b.moving = L > 0.15; if (b.moving) b.mface = Math.atan2(mz, mx);
  } else { b.vx = b.vz = 0; b.moving = false; }
  b.inBush = inBush(b.x, b.z);
  // reload & regen
  b.ammo = Math.min(BAL.ammoMax, b.ammo + dt / b.H.reload);
  if (G.t - b.lastHurt > BAL.regenDelay && G.t - b.lastAtk > BAL.regenDelay && b.hp < b.mhp) b.hp = Math.min(b.mhp, b.hp + b.mhp * BAL.regenPct * dt);
  // gas
  if (inGas(b.x, b.z, G.gasR)) {
    b.gasAcc += dt;
    if (b.gasAcc >= 0.5) { b.gasAcc -= 0.5; hurt(b, (BAL.gasDps + BAL.gasDpsGrow * Math.max(0, G.t - BAL.gasStart)) * 0.5, null, { gas: true }); if (!b.alive) return; }
  } else b.gasAcc = 0;
  stepBurst(b);
  const canAct = b.stunT <= 0 && !b.fm && !b.burst;
  if (inp.fire) { if (canAct && b.ammo >= 1 && G.t - b.lastAtk >= BAL.minGap) { b.ammo -= 1; fire(b, false, inp.aim, inp.tx, inp.tz); } }
  if (inp.sup) { if (canAct && b.sup >= 1) { b.sup = 0; b.supReadySent = false; fire(b, true, inp.aim, inp.tx, inp.tz); } }
  inp.fire = false; inp.sup = false;
  if (b.sup >= 1 && !b.supReadySent) { b.supReadySent = true; ev('supready', { id: b.id }); }
}
function stepGame(dt) {
  if (!G) return;
  G.t += dt;
  G.gasR = gasRAt(G.t);
  for (const b of G.ents) stepBrawler(b, dt);
  G.projs = G.projs.filter(p => stepProj(p, dt));
  G.turrets = G.turrets.filter(t => stepTurret(t, dt));
  for (const bx of M.boxes) if (bx.flashT > 0) bx.flashT -= dt;
  // cubes pickup
  G.cubes = G.cubes.filter(c => {
    if (G.t - c.born < 0.45) return true;
    for (const b of G.ents) if (b.alive && d2(b.x, b.z, c.x, c.z) < 0.75 * 0.75) {
      b.cubes++; const add = b.H.hp * BAL.hpMul * BAL.cubeHp; b.mhp += add; b.hp += add;
      ev('cube', { id: b.id, x: c.x, z: c.z }); return false;
    }
    return true;
  });
}
