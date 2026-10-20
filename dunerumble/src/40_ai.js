/* ================= bot AI ================= */
/* personality tweaks: aggro = engage-radius bonus, bush = how much the bot likes sitting in bushes, farm = box/cube priority */
const PERS = {
  balanced: { aggro: 0, bush: 0.3, farm: 1 },
  aggro: { aggro: 2.2, bush: 0.1, farm: 0.7 },
  camper: { aggro: -0.8, bush: 0.9, farm: 0.8 },
  farmer: { aggro: -1.2, bush: 0.25, farm: 1.8 },
};
function botInit(b) {
  b.ai = { thinkT: Math.random() * 0.2, goal: null, dir: null, path: [], pathT: 0, pathKey: -1, strafe: Math.random() < .5 ? 1 : -1, strafeT: 0, targetId: 0, reactAt: 0, lastSeen: null, wander: null, wanderT: 0, dodge: null, dodgeT: 0, stuckT: 0, lx: 0, lz: 0, unstick: null, unstickT: 0, mode: 'roam', bias: 0, shotTid: 0, shotN: 0, supWait: -1 };
  return b.ai;
}
function botThink(b, dt) {
  const A = b.ai || botInit(b), D = b.diffP || DIFF[G.cfg.diff];
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
/* human-like aim: partial lead, slowly drifting bias (misses cluster), sloppier first shots at a new target */
function aimAt(b, tx, tz, tvx, tvz, a, err, tid) {
  const A = b.ai || botInit(b), D = b.diffP || DIFF[G.cfg.diff];
  const dd = dist(b.x, b.z, tx, tz);
  const tFlight = a.flight ? a.flight : (a.type === 'melee' || a.type === 'chain') ? 0.05 : a.type === 'zone' ? 0.6 : a.type === 'leap' ? 0.5 : dd / (a.speed || 15);
  const lead = rr(D.lead[0], D.lead[1]);
  if (tid !== A.shotTid) { A.shotTid = tid; A.shotN = 0; }
  const e = err * (A.shotN === 0 && tid ? D.warm : 1); A.shotN++;
  A.bias = clamp(A.bias * 0.85 + (Math.random() - 0.5) * err * 0.5, -err * 0.7, err * 0.7);
  let px = tx + tvx * tFlight * lead, pz = tz + tvz * tFlight * lead;
  const ang = Math.atan2(pz - b.z, px - b.x) + A.bias + (Math.random() - 0.5) * e;
  const L = dist(b.x, b.z, px, pz) * (1 + (Math.random() - 0.5) * err);
  b.inp.aim = ang; b.inp.tx = b.x + Math.cos(ang) * L; b.inp.tz = b.z + Math.sin(ang) * L;
}
const persOf = b => PERS[b.pers] || PERS.balanced;
const teamFocus = team => G.focus && G.focus[team] && G.t - G.focus[team].t < 6 ? G.focus[team] : null;

/* choose an enemy to fight: closest/weakest, sticky, at most 2 bots of a team on the same target, honours pings */
function pickTarget(b, A, aggro) {
  const hpF = b.hp / b.mhp, hurtRecent = G.t - b.lastHurt < 2.5, F = teamFocus(b.team);
  let tgt = null, best = 1e9;
  for (const e of G.ents) {
    if (!e.alive || e.team === b.team || !visibleTo(e, b.team) || e.H.k === 'dummy') continue;
    const dd = dist(b.x, b.z, e.x, e.z);
    const revenge = hurtRecent && e.id === b.lastHurtBy && (dd < aggro + 4 || hpF > 0.6) && dd < 12.5;
    const focus = F && F.tid === e.id && dd < 13;
    if (dd > aggro && !revenge && !focus && !(e.hp / e.mhp < 0.3 && dd < 8)) continue;
    let sc = dd + (e.hp / e.mhp) * 3.5 - (e.id === A.targetId ? 1.8 : 0) - (focus ? 6 : 0) - (e.H.k === 'boss' ? 1 : 0);
    let n = 0; for (const o of G.ents) if (o !== b && o.alive && o.isBot && o.team === b.team && o.ai && o.ai.targetId === e.id) n++;
    if (n >= 2) sc += 5;
    if (e.human && !b.human) sc += (b.diffP || DIFF[G.cfg.diff]).hAvoid || 0;
    if (sc < best) { best = sc; tgt = e; }
  }
  return tgt;
}
function dodgeCheck(b, A, D) {
  if (Math.random() >= D.dodge) return;
  for (const p of G.projs) {
    if (p.team === b.team || p.lob) { if (p.lob && p.team !== b.team && d2(p.lob.tx, p.lob.tz, b.x, b.z) < (p.radius + 0.6) ** 2) { const dx = b.x - p.lob.tx, dz = b.z - p.lob.tz, L = Math.hypot(dx, dz) || 1; A.dodge = { x: dx / L, z: dz / L }; A.dodgeT = G.t + 0.4; return; } continue; }
    const dx = b.x - p.x, dz = b.z - p.z; if (dx * dx + dz * dz > 16) continue;
    const sp = Math.hypot(p.vx, p.vz) || 1, ux = p.vx / sp, uz = p.vz / sp, along = dx * ux + dz * uz; if (along < 0) continue;
    const perp = dx * uz - dz * ux; if (Math.abs(perp) > 0.9) continue;
    const s = perp >= 0 ? 1 : -1; A.dodge = { x: uz * s, z: -ux * s }; A.dodgeT = G.t + 0.32; return;
  }
  for (const w of G.warns || []) if (d2(w.x, w.z, b.x, b.z) < (w.r + 0.6) ** 2) { const dx = b.x - w.x, dz = b.z - w.z, L = Math.hypot(dx, dz) || 1; A.dodge = { x: dx / L, z: dz / L }; A.dodgeT = G.t + 0.45; return; }
}
function fleePoint(b, from, gasOk) {
  let bp = null, bs = -1e9;
  for (let k = 0; k < 12; k++) {
    const a = k * TAU / 12, x = b.x + Math.cos(a) * 5, z = b.z + Math.sin(a) * 5;
    if (!inMap(Math.floor(x), Math.floor(z)) || solidTile(Math.floor(x), Math.floor(z)) || (!gasOk && inGas(x, z, G.gasR - 1))) continue;
    const sc = dist(x, z, from.x, from.z) + (inBush(x, z) ? 3 : 0) + (los(x, z, from.x, from.z) ? 0 : 2);
    if (sc > bs) { bs = sc; bp = { x, z }; }
  }
  return bp;
}
/* fight a target: positioning + attack + super. allowFlee=false for objective carriers/defenders */
function engage(b, A, D, tgt, allowFlee = true) {
  const H = b.H, inp = b.inp, hpF = b.hp / b.mhp, atk = H.atk, isLob = ignoresWalls(atk);
  const dd = dist(b.x, b.z, tgt.x, tgt.z), pref = H.ai.pref, losOk = isLob || los(b.x, b.z, tgt.x, tgt.z), tHp = tgt.hp / tgt.mhp;
  if (tgt.id !== A.targetId) { A.targetId = tgt.id; A.reactAt = G.t + D.react * rr(0.7, 1.4); }
  A.lastSeen = { x: tgt.x, z: tgt.z, t: G.t };
  const melee = atk.type === 'melee' || atk.type === 'dash';
  if (allowFlee && !(dd < atk.range + 1.2 && melee && hpF > 0.12) && ((hpF < 0.32 && tHp > hpF + 0.12 && dd < 9) || (hpF < 0.5 && b.ammo < 1 && tHp > 0.5))) {
    A.mode = 'flee'; A.goal = fleePoint(b, tgt, !isShowdown()) || (isShowdown() ? safePoint(b, 3) : (b.spawn || { x: b.x, z: b.z }));
  } else if (dd > pref + 1.3 || !losOk) { A.goal = { x: tgt.x, z: tgt.z }; A.mode = 'chase'; }
  else {
    if (G.t > A.strafeT) { A.strafe = -A.strafe; A.strafeT = G.t + rr(0.5, 1.4); }
    const dx = (b.x - tgt.x) / (dd || 1), dz = (b.z - tgt.z) / (dd || 1);
    const back = dd < pref - 1.2 ? 1 : dd > pref + 0.6 ? -0.5 : 0;
    A.dir = { x: dx * back + -dz * A.strafe * 0.9, z: dz * back + dx * A.strafe * 0.9 }; A.mode = 'fight';
  }
  // attack
  const keep = D.keep && hpF > 0.6 && dd > atk.range * 0.75 ? 2 : 1;
  if (b.ammo >= keep && G.t - b.lastAtk >= D.fireCd && G.t >= A.reactAt && dd <= atk.range * (isLob ? 1 : 0.95) && (isLob || los(b.x, b.z, tgt.x, tgt.z))) {
    aimAt(b, tgt.x, tgt.z, tgt.vx || 0, tgt.vz || 0, atk, D.err, tgt.id); inp.fire = true;
  }
  // super (with a human-ish hesitation once it is ready)
  if (b.sup >= 1) { if (A.supWait < 0) A.supWait = G.t + rr(D.supDelay[0], D.supDelay[1]); }
  else A.supWait = -1;
  if (b.sup >= 1 && A.supWait >= 0 && G.t >= A.supWait && G.t >= A.reactAt) {
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
    if (ok && Math.random() < D.superP + 0.3) {
      if (s.type === 'zone' && s.zone.k === 'heal') { inp.aim = Math.atan2(tgt.z - b.z, tgt.x - b.x); inp.tx = b.x; inp.tz = b.z; }
      else if (s.type === 'turret') { const a = Math.atan2(tgt.z - b.z, tgt.x - b.x); inp.aim = a; inp.tx = b.x + Math.cos(a) * 3; inp.tz = b.z + Math.sin(a) * 3; }
      else aimAt(b, tgt.x, tgt.z, tgt.vx || 0, tgt.vz || 0, s.type === 'lob' ? s : Object.assign({}, s, { speed: s.speed || 16 }), D.err * 0.7, tgt.id);
      inp.sup = true; inp.fire = false; A.supWait = -1;
    }
  }
  botGadget(b, A, D, tgt, dd);
}
/* gadgets: used when the situation calls for it, not on cooldown */
function botGadget(b, A, D, tgt, dd) {
  if (b.gadLeft <= 0 || b.gadCd > 0 || Math.random() > (G.cfg.diff === 2 ? 0.55 : 0.28)) return;
  const k = b.H.gad, hpF = b.hp / b.mhp, inp = b.inp;
  let use = false;
  if (k === 'heal') use = hpF < 0.42;
  else if (k === 'armor') use = tgt && dd < 5 && G.t - b.lastHurt < 1 && hpF < 0.75;
  else if (k === 'nova' || k === 'freeze') use = tgt && dd < 2.3;
  else if (k === 'reload') use = tgt && b.ammo < 0.6 && dd < b.H.atk.range;
  else if (k === 'trap') use = (tgt && dd < 3.2 && A.mode === 'flee') || (b.pers === 'camper' && b.inBush && Math.random() < 0.1);
  else if (k === 'speed') use = A.mode === 'flee' || (tgt && A.mode === 'chase' && dd > b.H.ai.pref + 2.5);
  else if (k === 'blink' || k === 'dash') {
    if (A.mode === 'flee' && tgt && hpF < 0.4) { const a = Math.atan2(b.z - tgt.z, b.x - tgt.x); inp.aim = a; inp.mx = Math.cos(a); inp.mz = Math.sin(a); use = true; }
    else if (tgt && b.H.ai.pref < 3 && dd > 3 && dd < 5.5) { const a = Math.atan2(tgt.z - b.z, tgt.x - b.x); inp.aim = a; inp.mx = Math.cos(a); inp.mz = Math.sin(a); use = true; }
  }
  if (use) inp.gad = true;
}
function botEmote(b, k) { if (Math.random() < 0.3) emote(b, k); }

function botDecide(b, A, D) {
  A.goal = null; A.dir = null;
  dodgeCheck(b, A, D);
  if (isShowdown()) decideShowdown(b, A, D); else decideTeam(b, A, D);
  // follow command from a human teammate
  const lead = G.cmd && G.cmd[b.team] === 'follow' ? G.ents.find(e => e.alive && e.human && e.team === b.team) : null;
  if (lead && A.mode !== 'fight' && A.mode !== 'flee' && dist(b.x, b.z, lead.x, lead.z) > 3.5 && !(G.ms.k === 'ball' && G.ms.ball.carrier === b.id)) { A.goal = { x: lead.x, z: lead.z }; A.dir = null; A.mode = 'follow'; }
}

/* ---------- showdown ---------- */
function decideShowdown(b, A, D) {
  const H = b.H, inp = b.inp, hpF = b.hp / b.mhp, P = persOf(b);
  const calm = D.calm || 28;
  let aggro = G.t < calm ? 2.2 : clamp(3.2 + (G.t - calm) / 12 + G.cfg.diff * 0.4 + (b.cubes > 2 ? 1.5 : 0), 3.2, 12.5);
  aggro = clamp(aggro + P.aggro, 1.8, 12.5);
  if (b.pers === 'farmer' && b.cubes < 4 && G.t < 100) aggro = Math.min(aggro, 3);
  if (hpF < 0.65 && G.t < 120) aggro = Math.min(aggro, 3);
  const tgt = pickTarget(b, A, aggro);
  let tur = null;
  if (!tgt || dist(b.x, b.z, tgt.x, tgt.z) > 7) for (const t of G.turrets) if (t.team !== b.team && t.hp > 0 && d2(b.x, b.z, t.x, t.z) < 8 * 8) { tur = t; break; }
  const gasDanger = inGas(b.x, b.z, G.gasR - 1.3) || (G.t > BAL.gasStart - 3 && inGas(b.x, b.z, gasRAt(G.t + 4) - 0.6));
  const atk = H.atk, isLob = ignoresWalls(atk);
  if (tgt) {
    engage(b, A, D, tgt, true);
    if (gasDanger && A.mode !== 'flee') { A.goal = safePoint(b, 3); A.dir = null; A.mode = 'gas'; }
    return;
  }
  if (tur) {
    const dd = dist(b.x, b.z, tur.x, tur.z);
    if (dd > atk.range * 0.9 || (!isLob && !los(b.x, b.z, tur.x, tur.z))) A.goal = { x: tur.x, z: tur.z };
    if (b.ammo >= 1 && dd < atk.range * 0.92 && (isLob || los(b.x, b.z, tur.x, tur.z))) { aimAt(b, tur.x, tur.z, 0, 0, atk, D.err, tur.id); inp.fire = true; }
    if (gasDanger) A.goal = safePoint(b, 3);
    return;
  }
  if (gasDanger) { A.goal = safePoint(b, 3); A.mode = 'gas'; return; }
  const ls = A.lastSeen && entById(A.targetId);
  if (A.lastSeen && G.t - A.lastSeen.t < 2.2 && (G.t > 35 || (ls && ls.alive && ls.hp / ls.mhp < 0.4)) && b.pers !== 'camper') {
    A.goal = { x: A.lastSeen.x, z: A.lastSeen.z }; A.mode = 'hunt';
    if (b.ammo >= 2.5 && inBush(A.lastSeen.x, A.lastSeen.z) && Math.random() < 0.35 && dist(b.x, b.z, A.lastSeen.x, A.lastSeen.z) < atk.range) { aimAt(b, A.lastSeen.x, A.lastSeen.z, 0, 0, atk, D.err); inp.fire = true; }
    return;
  }
  // a ping on the ground: go there
  const F = teamFocus(b.team);
  if (F && !F.tid && dist(b.x, b.z, F.x, F.z) > 1.5) { A.goal = { x: F.x, z: F.z }; A.mode = 'ping'; return; }
  // wounded: hide in a nearby bush and regenerate
  if (hpF < 0.7 && G.t - b.lastHurt < 8) {
    if (!A.heal || G.t > A.healT) { A.heal = bushNear(b, 7) || safePoint(b, 3); A.healT = G.t + 4; }
    if (b.sup >= 1 && ((H.sup.type === 'zone' && H.sup.zone.k === 'heal') || H.sup.type === 'shield' || H.sup.type === 'stealth')) { inp.tx = b.x; inp.tz = b.z; inp.sup = true; }
    if (b.gadLeft > 0 && b.gadCd <= 0 && H.gad === 'heal' && hpF < 0.45) inp.gad = true;
    A.goal = A.heal; A.mode = 'heal'; return;
  }
  // nearby cubes first, then boxes
  let cube = null, cb = 100;
  for (const c of G.cubes) { const dd = d2(b.x, b.z, c.x, c.z); if (dd < cb && !inGas(c.x, c.z, G.gasR - 0.5)) { cb = dd; cube = c; } }
  if (cube && cb < (10 * P.farm) ** 2) { A.goal = { x: cube.x, z: cube.z }; A.mode = 'cube'; return; }
  let box = null, bs = 1e9; const bb = (15 * P.farm) ** 2;
  for (const bx of M.boxes) {
    if (bx.hp <= 0) continue; const x = bx.tx + .5, z = bx.tz + .5; if (inGas(x, z, G.gasR - 1)) continue;
    const dd = d2(b.x, b.z, x, z); if (dd > bb) continue;
    let sc = Math.sqrt(dd) - (bx.drop ? 4 : 0);
    for (const o of G.ents) if (o !== b && o.alive && o.team !== b.team && d2(o.x, o.z, x, z) < 3.5 * 3.5) { sc += 6; break; }
    if (G.t < 25 && d2(x, z, H2(), H2()) < 36) sc += 4;
    if (sc < bs) { bs = sc; box = bx; }
  }
  if (box && !(b.pers === 'camper' && b.cubes >= 3 && Math.random() < 0.5)) {
    const x = box.tx + .5, z = box.tz + .5, dd = dist(b.x, b.z, x, z), rng = Math.min(atk.range * 0.85, Math.max(1.6, H.ai.pref));
    const losOk = isLob || los(b.x, b.z, x, z, true);
    if (dd > rng || !losOk) A.goal = { x, z }; else A.dir = { x: 0, z: 0 };
    A.mode = 'box';
    let crowd = false;
    if (G.t < 40) for (const o of G.ents) { if (o === b || !o.alive || o.team === b.team) continue; if (d2(o.x, o.z, x, z) < 2.8 * 2.8 || segDist(b.x, b.z, x, z, o.x, o.z) < 1.3) { crowd = true; break; } }
    if (crowd) { A.goal = null; A.dir = null; A.wander = null; A.mode = 'roam'; return; }
    if (b.ammo >= 1 && dd <= atk.range * 0.95 && losOk) { aimAt(b, x, z, 0, 0, atk, D.err * 0.5); inp.fire = true; }
    return;
  }
  // wander (campers settle into bushes)
  if (!A.wander || G.t > A.wanderT || d2(b.x, b.z, A.wander.x, A.wander.z) < 1 || inGas(A.wander.x, A.wander.z, G.gasR - 2)) {
    const h = H2(), R = Math.max(1, G.gasR - 3), lr = G.t < 60 ? 6 : 10;
    let w = Math.random() < P.bush ? bushNear(b, lr) : null;
    for (let k = 0; k < 24 && !w; k++) {
      const x = clamp(b.x + rr(-lr, lr), h - R, h + R), z = clamp(b.z + rr(-lr, lr), h - R, h + R), t = tileAt(x, z);
      if (t === T_FLOOR || (t === T_BUSH && Math.random() < 0.8)) w = { x: Math.floor(x) + .5, z: Math.floor(z) + .5 };
    }
    if (w && inGas(w.x, w.z, G.gasR - 2)) w = null;
    A.wander = w || { x: h, z: h }; A.wanderT = G.t + rr(4, 8) * (b.pers === 'camper' ? 2 : 1);
  }
  A.goal = A.wander; A.mode = 'roam';
}
function bushNear(b, r) {
  let bp = null, bs = 1e9;
  for (let k = 0; k < 40; k++) {
    const x = b.x + rr(-r, r), z = b.z + rr(-r, r);
    if (!inMap(Math.floor(x), Math.floor(z)) || tileAt(x, z) !== T_BUSH || inGas(x, z, G.gasR - 1.5)) continue;
    let sc = dist(b.x, b.z, x, z); for (const o of G.ents) if (o.alive && o.team !== b.team && d2(o.x, o.z, x, z) < 25) sc += 8;
    if (sc < bs) { bs = sc; bp = { x: Math.floor(x) + .5, z: Math.floor(z) + .5 }; }
  }
  return bp;
}

/* ---------- team & PvE modes ---------- */
function decideTeam(b, A, D) {
  const ms = G.ms, k = ms.k, hpF = b.hp / b.mhp, inp = b.inp, P = persOf(b);
  if (ms.resetT > 0) return;
  let aggro = (k === 'boss' ? 16 : k === 'bounty' ? 10 : 8.5) + P.aggro * 0.5;
  // priority targets
  let prio = null;
  if (k === 'ball' && ms.ball.carrier) { const c = entById(ms.ball.carrier); if (c && c.team !== b.team && c.alive) prio = c; }
  if (k === 'gem') { let best = 2; for (const e of G.ents) if (e.alive && e.team !== b.team && e.gems > best && visibleTo(e, b.team) && d2(e.x, e.z, b.x, b.z) < 144) { best = e.gems; prio = e; } }
  let tgt = prio && visibleTo(prio, b.team) && dist(b.x, b.z, prio.x, prio.z) < 12 ? prio : pickTarget(b, A, aggro);
  if (k === 'train') return;
  if (k === 'ball') { decideBall(b, A, D, tgt); return; }
  if (k === 'gem') {
    const my = ms.sc[b.team] || 0, their = ms.sc[1 - b.team] || 0;
    const retreat = (b.gems >= 4 && (my > their || ms.cd)) || (b.gems >= 2 && hpF < 0.45);
    if (retreat) {
      const home = b.spawn || teamSpawnPoint(b.team, 0);
      if (tgt && dist(b.x, b.z, tgt.x, tgt.z) < 4.5) { engage(b, A, D, tgt, true); if (A.mode !== 'flee') { A.goal = home; A.dir = null; A.mode = 'carry'; } }
      else { A.goal = home; A.mode = 'carry'; }
      return;
    }
    let gem = null, gd = 14 * 14; for (const g of ms.gems) { const dd = d2(b.x, b.z, g.x, g.z); if (dd < gd) { gd = dd; gem = g; } }
    if (tgt && (!gem || dist(b.x, b.z, tgt.x, tgt.z) < 5 || tgt === prio)) { engage(b, A, D, tgt, true); return; }
    if (gem) { A.goal = { x: gem.x, z: gem.z }; A.mode = 'gem'; return; }
    const side = b.team === 0 ? 2.5 : -2.5; A.goal = { x: ms.mine.x + rr(-2, 2), z: ms.mine.z + side }; A.mode = 'mine'; return;
  }
  if (k === 'bounty') {
    if (b.bounty >= 5 && hpF < 0.55 && tgt) { engage(b, A, D, tgt, true); if (A.mode !== 'fight') { A.goal = b.spawn; A.mode = 'protect'; } return; }
    if (tgt) { engage(b, A, D, tgt, true); return; }
    const F = teamFocus(b.team); if (F && !F.tid) { A.goal = { x: F.x, z: F.z }; A.mode = 'ping'; return; }
    if (!A.wander || G.t > A.wanderT || d2(b.x, b.z, A.wander.x, A.wander.z) < 1) { A.wander = freeTileNear(H2() + rr(-6, 6), H2() + rr(-5, 5) + (b.team === 0 ? 2 : -2)); A.wanderT = G.t + rr(3, 6); }
    A.goal = A.wander; A.mode = 'roam'; return;
  }
  if (k === 'boss') {
    if (tgt) { engage(b, A, D, tgt, b.team === 0); return; }
    const boss = entById(ms.bossId); if (boss && boss.alive) { A.goal = { x: boss.x, z: boss.z }; A.mode = 'chase'; }
    return;
  }
}
function decideBall(b, A, D, tgt) {
  const ms = G.ms, B = ms.ball, inp = b.inp;
  const myGoal = M.goals.find(g => g.team === b.team), theirGoal = M.goals.find(g => g.team !== b.team);
  const gx = (theirGoal.x0 + theirGoal.x1) / 2, gz = theirGoal.team === 0 ? theirGoal.z + 0.5 : theirGoal.z + 0.5;
  if (B.carrier === b.id) {
    const dG = dist(b.x, b.z, gx, gz);
    const sup = b.sup >= 1 && dG < 11;
    if (dG < 8 || sup) {
      const a = Math.atan2(gz - b.z, gx - b.x) + (Math.random() - 0.5) * D.err;
      if (sup) { inp.aim = a; inp.sup = true; } else { inp.aim = a; inp.fire = true; }
    }
    // pass/clear if an enemy is right on top of us far from goal
    const close = G.ents.find(e => e.alive && e.team !== b.team && d2(e.x, e.z, b.x, b.z) < 2.2 * 2.2);
    if (close && dG > 10 && Math.random() < 0.3) { inp.aim = Math.atan2(gz - b.z, gx - b.x) + rr(-0.5, 0.5); inp.fire = true; }
    A.goal = { x: gx, z: gz + (theirGoal.team === 0 ? -1.5 : 1.5) }; A.mode = 'dribble'; return;
  }
  if (!B.carrier) {
    // the two closest teammates chase the ball, the rest hang back
    const mates = G.ents.filter(e => e.alive && e.team === b.team).sort((p, q) => d2(p.x, p.z, B.x, B.z) - d2(q.x, q.z, B.x, B.z));
    const rank = mates.indexOf(b);
    if (rank <= 1) {
      if (tgt && dist(b.x, b.z, tgt.x, tgt.z) < 3.5) engage(b, A, D, tgt, false);
      A.goal = { x: B.x, z: B.z }; A.dir = null; A.mode = 'ball'; return;
    }
  }
  const carrier = B.carrier ? entById(B.carrier) : null;
  if (carrier && carrier.team !== b.team) { engage(b, A, D, carrier, false); if (A.mode === 'fight' && dist(b.x, b.z, carrier.x, carrier.z) > 2) { A.goal = { x: carrier.x, z: carrier.z }; A.dir = null; } return; }
  if (tgt) { engage(b, A, D, tgt, true); return; }
  // support or defend
  if (carrier) { A.goal = { x: lerp(carrier.x, gx, 0.35) + rr(-2, 2), z: lerp(carrier.z, gz, 0.35) }; A.mode = 'support'; return; }
  const mgx = (myGoal.x0 + myGoal.x1) / 2, mgz = myGoal.z + (myGoal.team === 0 ? -3 : 3.5);
  A.goal = freeTileNear(lerp(mgx, B.x, 0.35), lerp(mgz, B.z, 0.35)); A.mode = 'defend';
}

/* ---------- steering ---------- */
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
        if (!solidTile(Math.floor(ax), Math.floor(az)) && (G.noGas || !inGas(ax, az, G.gasR - 0.6))) { mx = nx; mz = nz; ok = true; break; }
      }
      if (!ok) { mx = 0; mz = 0; }
    }
  } else if (A.goal) {
    const gk = tIdx(clamp(Math.floor(A.goal.x), 0, M.N - 1), clamp(Math.floor(A.goal.z), 0, M.N - 1));
    if (gk !== A.pathKey || G.t > A.pathT || !A.path.length) { A.path = astar(b.x, b.z, A.goal.x, A.goal.z); A.pathT = G.t + rr(0.6, 1.0); A.pathKey = gk; }
    while (A.path.length && d2(b.x, b.z, A.path[0].x, A.path[0].z) < 0.3 * 0.3) A.path.shift();
    let wp = A.path[0];
    if (A.path.length > 1 && walkLine(b.x, b.z, A.path[1].x, A.path[1].z)) wp = A.path[1];
    if (!wp) wp = A.goal;
    mx = wp.x - b.x; mz = wp.z - b.z;
    const L = Math.hypot(mx, mz);
    if (L < 0.15 && A.path.length <= 1) { mx = mz = 0; } else { mx /= L || 1; mz /= L || 1; }
  }
  for (const o of G.ents) {
    if (o === b || !o.alive || o.team !== b.team) continue;
    const dx = b.x - o.x, dz = b.z - o.z, dd = dx * dx + dz * dz;
    if (dd < 1.2 && dd > 1e-4) { const d = Math.sqrt(dd); mx += dx / d * 0.5 * (1.1 - d); mz += dz / d * 0.5 * (1.1 - d); }
  }
  const want = Math.hypot(mx, mz) > 0.3;
  if (want && d2(b.x, b.z, A.lx, A.lz) < 0.0004) { A.stuckT += dt; if (A.stuckT > 0.5) { const a = Math.random() * TAU; A.unstick = { x: Math.cos(a), z: Math.sin(a) }; A.unstickT = G.t + 0.45; A.stuckT = 0; A.pathT = 0; } }
  else A.stuckT = 0;
  A.lx = b.x; A.lz = b.z;
  if (!b.inp.gad || Math.hypot(b.inp.mx, b.inp.mz) < 0.1) { b.inp.mx = mx; b.inp.mz = mz; }
  if (!b.inp.fire && !b.inp.gad && Math.hypot(mx, mz) > 0.1 && G.t - b.lastAtk > 0.5) b.inp.aim = Math.atan2(mz, mx);
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
