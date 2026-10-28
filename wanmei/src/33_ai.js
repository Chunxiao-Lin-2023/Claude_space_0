/* ================= creatures & enemies: templates + AI ================= */
const MOBS = {
  wolf: { name: '山狼', spec: 'wolf', hp: 70, atk: 9, def: 2, spd: 5.6, r: 0.6, range: 1.9, cd: 1.5, skills: ['bite', 'bite', 'pounce'], xp: 26, loot: [{ id: 'meat', p: 0.6 }, { id: 'hide', p: 0.35 }, { id: 'fang', p: 0.3 }] },
  lynx: { name: '斑纹山猫', spec: 'lynx', hp: 60, atk: 11, def: 1, spd: 6.4, r: 0.55, range: 1.8, cd: 1.2, skills: ['swipe', 'pounce'], xp: 30, loot: [{ id: 'meat', p: 0.5 }, { id: 'hide', p: 0.5 }] },
  snake: { name: '蛇虺', spec: 'snake', hp: 45, atk: 8, def: 0, spd: 3.5, r: 0.5, range: 1.8, cd: 1.6, skills: ['venom'], xp: 22, loot: [{ id: 'herb', p: 0.5 }] },
  mangniu: { name: '莽牛', spec: 'mangniu', hp: 260, atk: 14, def: 6, spd: 5, r: 1.3, range: 2.8, cd: 2.4, skills: ['gore', 'charge'], xp: 70, neutral: true, heavy: true, loot: [{ id: 'meat', n: [2, 3] }, { id: 'hide', p: 0.8 }, { id: 'bone', p: 0.5 }] },
  biao: { name: '彪', title: '精英', spec: 'biao', hp: 900, atk: 22, def: 8, spd: 6.2, r: 1.6, range: 3.4, cd: 2.0, skills: ['swipeCone', 'leapSlam', 'gust'], xp: 260, elite: true, heavy: true, loot: [{ id: 'meat', n: [3, 5] }, { id: 'hide', n: [1, 2] }, { id: 'blood', p: 1 }, { id: 'bone', n: [1, 2] }] },
  bhunter: { name: '狈村猎手', spec: 'beiHunter', hp: 110, atk: 11, def: 3, spd: 4.6, r: 0.45, range: 16, cd: 2.0, skills: ['arrow', 'arrow', 'trap'], ranged: true, keep: 9, xp: 34, weapon: 'bow', loot: [{ id: 'arrow', n: [2, 5] }, { id: 'yaosan', p: 0.15 }] },
  bwarrior: { name: '狈村武士', spec: 'beiHunter', hp: 160, atk: 13, def: 5, spd: 4.8, r: 0.5, range: 2.4, cd: 1.6, skills: ['stab', 'stab', 'sweep'], xp: 36, weapon: 'spear', loot: [{ id: 'arrow', p: 0.4 }, { id: 'meat', p: 0.3 }] },
  beifeng: { name: '狈风', title: '狈村天才', spec: 'beifeng', hp: 2600, atk: 20, def: 8, spd: 5.4, r: 0.5, range: 15, cd: 1.3, skills: [], boss: true, xp: 520, weapon: 'bow', loot: [{ id: 'arrow', n: [6, 10] }, { id: 'blood', n: [1, 2] }] },
};
function spawnMob(kind, x, z, o = {}) {
  const T = MOBS[kind], lv = o.lv || T.lv || 1, k = 1 + 0.2 * (lv - 1);
  const specFn = CHARS[T.spec]; const seed = ri(1, 9999); const spec = specFn(seed);
  const e = mkEnt(Object.assign({ type: 'mob', kind, name: T.name, title: T.title || '', lv, team: T.neutral ? 2 : 1, x, z, rot: rr(0, TAU), spec, r: T.r, hp: Math.round(T.hp * k), hpMax: Math.round(T.hp * k), atk: Math.round(T.atk * k), def: T.def, spd: T.spd, xp: Math.round(T.xp * (1 + 0.15 * (lv - 1))), loot: T.loot, heavy: T.heavy, boss: T.boss, elite: T.elite,
    ai: { st: 'idle', tgt: null, cd: rr(0.5, 1.5), wt: 0, wx: x, wz: z, lock: 0 } }, o));
  if (T.weapon && e.R.kind === 'human') { const w = weaponMesh(T.weapon === 'bow' ? 'bow' : T.weapon, 1); attach(e.R, T.weapon === 'bow' ? 'L' : 'R', w, 0, -0.05, 0, T.weapon === 'bow' ? 0 : HP, 0, 0); e.weapon = w; }
  e.specRef = [T.spec, seed]; if (T.weapon) e.weaponRef = [T.weapon === 'bow' ? 'bow' : T.weapon, 1, T.weapon === 'bow' ? 'L' : 'R', T.weapon === 'bow' ? 0 : HP];
  if (o.respawn !== false && !T.boss && !o.story) e.respawn = { kind, x, z, lv, o };
  return e;
}
/* ---------- mob skills: each returns the lock time ---------- */
const MSK = {
  bite(e, t) { act(e.A, 'bite', 0.45); setTimeout(() => { if (e.alive) { if (meleeArc(e, e.R.spec.size ? 1.8 * e.R.spec.size : 1.9, 1.6, 1, { kb: 1.5 })) sfx('bite'); } }, 220); return 0.7; },
  swipe(e, t) { act(e.A, 'swipe', 0.4); setTimeout(() => { if (e.alive) meleeArc(e, 1.9, 2, 1.1, { kb: 2 }); }, 180); return 0.6; },
  venom(e, t) { act(e.A, 'bite', 0.45); setTimeout(() => { if (e.alive && edist(e, t) < 2.4) { hurt(e, t, 0.8, { col: 0x8aff5a }); addBuff(t, { id: 'venom', d: 5, dot: e.atk * 0.25, src: e, name: '蛇毒' }); } }, 220); return 0.8; },
  pounce(e, t) { const T = tele({ shape: 'circle', x: t.x, z: t.z, r: 1.6, d: 0.65, team: e.team, src: e, mul: 1.4, kb: 4 }); faceTo(e, t.x, t.z); act(e.A, 'pounce', 0.7); setTimeout(() => { if (e.alive) e.dash = { x0: e.x, z0: e.z, x1: T.x, z1: T.z, t: 0, d: 0.3, arc: 1.6 }; }, 350); return 1.1; },
  gore(e, t) { act(e.A, 'bite', 0.6); setTimeout(() => { if (e.alive) meleeArc(e, 3.0, 1.4, 1.2, { kb: 6, up: 3 }); }, 300); return 1.0; },
  charge(e, t) { const a = Math.atan2(t.x - e.x, t.z - e.z), L = Math.min(18, edist(e, t) + 4); faceTo(e, t.x, t.z); tele({ shape: 'line', x: e.x, z: e.z, ang: a, w: 2.8, len: L, d: 0.9, team: e.team, src: e }); act(e.A, 'roar', 0.8); sfx('roar', { k: 0.4 });
    setTimeout(() => { if (!e.alive) return; act(e.A, 'charge', 0.6); const x1 = e.x + Math.sin(a) * L, z1 = e.z + Math.cos(a) * L; e.dash = { x0: e.x, z0: e.z, x1, z1, t: 0, d: 0.55, hitR: 1.8, mul: 1.6, kb: 9, hit: new Set() }; }, 900); return 1.7; },
  swipeCone(e, t) { const a = Math.atan2(t.x - e.x, t.z - e.z); faceTo(e, t.x, t.z); tele({ shape: 'cone', x: e.x, z: e.z, ang: a, r: 5.5, arc: 2.0, d: 0.8, team: e.team, src: e, mul: 1.5, kb: 6 }); setTimeout(() => e.alive && act(e.A, 'swipe', 0.5), 550); return 1.3; },
  leapSlam(e, t) { const T = tele({ shape: 'circle', x: t.x, z: t.z, r: 4, d: 1.1, team: e.team, src: e, mul: 2.0, kb: 8, up: 5, onFire: T2 => { dust(T2.x, terrH(T2.x, T2.z), T2.z, 20); ringFX(T2.x, terrH(T2.x, T2.z), T2.z, 0xd8b080, 1, 5, 0.5); shake(0.3); sfx('boom'); } }); act(e.A, 'rear', 0.6); sfx('roar', { k: 0.8 }); setTimeout(() => { if (e.alive) { e.fly = false; e.dash = { x0: e.x, z0: e.z, x1: T.x, z1: T.z, t: 0, d: 0.5, arc: 6 }; } }, 600); return 1.9; },
  gust(e, t) { act(e.A, 'roar', 0.9); sfx('roar', { k: 1 }); tele({ shape: 'circle', x: e.x, z: e.z, r: 7, d: 1.0, team: e.team, src: e, mul: 0.9, kb: 12 }); return 1.6; },
  arrow(e, t) { faceTo(e, t.x, t.z); act(e.A, 'shoot', 0.9); setTimeout(() => { if (!e.alive) return; fireArrow(e, t, 1.0); }, 650); return 1.2; },
  trap(e, t) { const x = t.x + rr(-2, 2), z = t.z + rr(-2, 2); tele({ shape: 'circle', x, z, r: 1.5, d: 1.4, team: e.team, src: e, mul: 1.2, onFire: T => hitSpark(T.x, terrH(T.x, T.z) + 0.3, T.z, 0xaaaaaa, 12) }); act(e.A, 'throw', 0.5); return 1.0; },
  stab(e, t) { act(e.A, 'stab', 0.45); setTimeout(() => { if (e.alive) meleeArc(e, 2.6, 1.0, 1.05, { kb: 2 }); }, 220); return 0.75; },
  sweep(e, t) { tele({ shape: 'circle', x: e.x, z: e.z, r: 3, d: 0.7, team: e.team, src: e, mul: 1.2, kb: 5 }); setTimeout(() => e.alive && act(e.A, 'spin', 0.4), 500); return 1.2; },
};
function fireArrow(e, t, mul, o = {}) { const sx = e.x, sy = e.y + e.h * 0.75, sz = e.z, tx = t.x + (t.vx || 0) * 0.2, ty = t.y + t.h * 0.55, tz = t.z + (t.vz || 0) * 0.2, L = Math.hypot(tx - sx, ty - sy, tz - sz) || 1, sp = o.sp || 30, ang = o.ang || 0; let vx = (tx - sx) / L * sp, vz = (tz - sz) / L * sp; if (ang) { const c = Math.cos(ang), s = Math.sin(ang); [vx, vz] = [vx * c + vz * s, -vx * s + vz * c]; }
  shoot({ owner: e, x: sx, y: sy, z: sz, vx, vy: (ty - sy) / L * sp, vz, r: 0.35, vis: 'arrow', mesh: arrowMesh(), pitch: true, mul, kb: o.kb || 1, life: 1.6, col: 0xd8d0c0 }); sfx('bow'); }
/* ---------- AI tick ---------- */
function pickTarget(e) {
  let best = null, bs = -1; const players = W.P.filter(p => p && p.alive);
  if (e.threat) for (const p of players) { const s = (e.threat.get(p.id) || 0) / (1 + edist(e, p) * 0.05); if (s > bs) { bs = s; best = p; } }
  if (!best) { let bd = (e.aggroR || BAL.aggroR) ** 2; for (const p of players) { const d = d2(p.x, p.z, e.x, e.z); if (d < bd) { bd = d; best = p; } } }
  if (e.allyTargets) for (const n of e.allyTargets()) { if (n.alive && (!best || edist(e, n) < edist(e, best) - 2)) best = n; }
  return best;
}
function mobAI(e, dt) {
  const ai = e.ai; ai.cd -= dt; ai.lock -= dt; e.mvSpd = 0;
  if (!e.alive) { if (e.keep) return; e.deadT += dt; if (e.deadT > 2.5) { e.dy = -(e.deadT - 2.5) * 0.6; if (e.deadT > 5) { if (e.respawn) MOBQ.push({ t: BAL.mobRespawn, ...e.respawn }); rmEnt(e); } } return; }
  if (e.stun > 0) { e.stun -= dt; return; }
  if (e.dash) return;
  if (e.script) return; // story-controlled
  if (e.bossAI) { e.bossAI(e, dt); return; }
  if (e.team === 2 && !e.lastAtk) { wander(e, dt, 0.35); return; }
  if (e.team === 2 && e.lastAtk) e.team = 1;
  let t = ai.tgt; if (!t || !t.alive || (t.type !== 'npc' && edist(e, t) > BAL.leashR * 1.2)) { t = ai.tgt = pickTarget(e); }
  const homeD = dist(e.x, e.z, e.home.x, e.home.z);
  if (ai.st === 'return') { e.threat = null; ai.tgt = null; const a = Math.atan2(e.home.x - e.x, e.home.z - e.z); e.rot = angLerp(e.rot, a, dt * 8); moveEnt(e, Math.sin(a) * e.spd * 1.2 * dt, Math.cos(a) * e.spd * 1.2 * dt, dt); e.mvSpd = e.spd * 1.2; e.hp = Math.min(e.hpMax, e.hp + e.hpMax * dt * 0.5); if (homeD < 2) ai.st = 'idle'; return; }
  if (!t) { ai.st = 'idle'; wander(e, dt, 0.5); return; }
  if (homeD > (e.leash || BAL.leashR) && !e.noLeash) { ai.st = 'return'; return; }
  ai.st = 'chase'; e.inCombat = W.t;
  const d = edist(e, t) - t.r, T = MOBS[e.kind] || {};
  if (ai.lock > 0) { return; }
  const range = T.range || 2;
  if (T.ranged && d < (T.keep || 6) * 0.6) { // kite away
    const a = Math.atan2(e.x - t.x, e.z - t.z); e.rot = angLerp(e.rot, a, dt * 8); moveEnt(e, Math.sin(a) * e.spd * dt, Math.cos(a) * e.spd * dt, dt); e.mvSpd = e.spd; if (ai.cd <= 0 && d < range) { faceTo(e, t.x, t.z); ai.lock = MSK.arrow(e, t); ai.cd = T.cd; } return; }
  if (d <= range && ai.cd <= 0) { faceTo(e, t.x, t.z); const sk = pick(T.skills || ['bite']); ai.lock = MSK[sk](e, t); ai.cd = T.cd * rr(0.85, 1.25); return; }
  if (d > range * 0.85) { const a = Math.atan2(t.x - e.x, t.z - e.z); e.rot = angLerp(e.rot, a, dt * 8); const sp = e.spd * (d > 6 ? 1 : 0.7); moveEnt(e, Math.sin(a) * sp * dt, Math.cos(a) * sp * dt, dt); e.mvSpd = sp; }
  else faceTo(e, t.x, t.z, dt * 8);
}
function wander(e, dt, sp = 0.4) {
  const ai = e.ai; ai.wt -= dt;
  if (ai.wt <= 0) { ai.wt = rr(3, 8); const r = e.wanderR ?? 6; ai.wx = e.home.x + rr(-r, r); ai.wz = e.home.z + rr(-r, r); }
  const d = dist(e.x, e.z, ai.wx, ai.wz); if (d > 0.6) { const a = Math.atan2(ai.wx - e.x, ai.wz - e.z); e.rot = angLerp(e.rot, a, dt * 4); const s = e.spd * sp; moveEnt(e, Math.sin(a) * s * dt, Math.cos(a) * s * dt, dt); e.mvSpd = s; }
}
const MOBQ = [];
function tickRespawn(dt) { for (let i = MOBQ.length - 1; i >= 0; i--) { const q = MOBQ[i]; q.t -= dt; if (q.t <= 0) { const near = W.P.some(p => p && d2(p.x, p.z, q.x, q.z) < 30 * 30); if (near) { q.t = 5; continue; } spawnMob(q.kind, q.x, q.z, Object.assign({}, q.o, { lv: q.lv })); MOBQ.splice(i, 1); } } }
/* dashes (lunges, leaps, charges) shared by players and mobs */
function tickDash(e, dt) {
  const D = e.dash; if (!D) return; D.t += dt; const k = clamp(D.t / D.d, 0, 1), s = smooth(k);
  const nx = lerp(D.x0, D.x1, s), nz = lerp(D.z0, D.z1, s); moveEnt(e, nx - e.x, nz - e.z, dt);
  if (D.arc) { e.y = Math.max(groundH(e.x, e.z), lerp(e.y, groundH(e.x, e.z) + Math.sin(k * PI) * D.arc, 0.6)); e.vy = 0; }
  if (D.hitR) for (const t of W.ents) { if (!isFoe(e, t) || D.hit.has(t.id)) continue; if (d2(t.x, t.z, e.x, e.z) < (D.hitR + t.r) ** 2) { D.hit.add(t.id); hurt(e, t, D.mul || 1, { kb: D.kb || 4, up: 3 }); } }
  if (k >= 1) { e.dash = null; if (D.on) D.on(); }
}
