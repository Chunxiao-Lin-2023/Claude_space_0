/* ================= game modes, map gimmicks, events, gadgets, star powers ================= */
const MODES = {
  solo: { name: '单人吃鸡', icon: '🏜', desc: '10 人各自为战，活到最后', showdown: true, teams: 10, size: 1 },
  duo: { name: '双人吃鸡', icon: '👥', desc: '5 支双人队，队友活着就能复活', showdown: true, teams: 5, size: 2 },
  gem: { name: '宝石争霸', icon: '💎', desc: '3v3 抢宝石，先攒够 10 颗并守住 15 秒', teams: 2, size: 3, respawn: 5, time: 150 },
  ball: { name: '乱斗足球', icon: '⚽', desc: '3v3 把球踢进对方球门，先进 2 球获胜', teams: 2, size: 3, respawn: 5, time: 150 },
  bounty: { name: '赏金猎人', icon: '⭐', desc: '3v3 击杀拿星星，时间到星多者胜', teams: 2, size: 3, respawn: 4, time: 120 },
  boss: { name: '机甲 Boss', icon: '🤖', desc: '组队打倒钢铁巨像和它的机兵', teams: 1, size: 3, respawn: 7, time: 240, pve: true },
  train: { name: '训练场', icon: '🎯', desc: '新手教学：一步步学会所有操作', teams: 1, size: 1, respawn: 2, pve: true, solo: true },
};
const isShowdown = () => G && MODES[G.cfg.mode].showdown;
const GAD_KEYS = Object.keys(GADGETS);

/* ---------- arenas for team / PvE modes (2-fold point symmetry) ---------- */
function genArena(seed, theme, kind) {
  const N = BAL.N, rng = mulberry32(seed * 7919 + 3), ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  M.N = N; M.seed = seed; M.theme = theme; M.ver++;
  M.t = new Uint8Array(N * N).fill(T_BORDER); M.sty = new Uint8Array(N * N); M.box = new Int16Array(N * N).fill(-1); M.boxes = []; M.deco = []; M.spawns = [];
  const R = kind === 'boss' ? { x0: 8, x1: 31, z0: 8, z1: 31 } : kind === 'train' ? { x0: 9, x1: 30, z0: 9, z1: 30 } : { x0: 9, x1: 30, z0: 4, z1: 35 };
  M.arena = R;
  const set = (x, z, v, s) => { if (x < R.x0 || x > R.x1 || z < R.z0 || z > R.z1) return; M.t[tIdx(x, z)] = v; if (s != null) M.sty[tIdx(x, z)] = s; const mx = N - 1 - x, mz = N - 1 - z; M.t[tIdx(mx, mz)] = v; if (s != null) M.sty[tIdx(mx, mz)] = s; };
  for (let z = R.z0; z <= R.z1; z++) for (let x = R.x0; x <= R.x1; x++) M.t[tIdx(x, z)] = T_FLOOR;
  const cx = N / 2, cz = N / 2;
  if (kind === 'train') {
    for (let x = 12; x <= 17; x++) for (let z = 12; z <= 14; z++) M.t[tIdx(x, z)] = T_BUSH;
    for (let x = 22; x <= 26; x++) M.t[tIdx(x, 16)] = T_WALL;
    for (let z = 22; z <= 24; z++) M.t[tIdx(13, z)] = T_WALL;
    M.t[tIdx(26, 26)] = T_WATER; M.t[tIdx(27, 26)] = T_WATER;
  } else {
    // build the top half (z < cz) and mirror it through the centre
    const zTop = kind === 'boss' ? R.z0 + 1 : R.z0 + 4, zMid = cz - (kind === 'ball' ? 3 : 2);
    const nW = kind === 'boss' ? ri(4, 6) : ri(6, 9);
    for (let i = 0; i < nW; i++) {
      const x = ri(R.x0 + 1, R.x1 - 2), z = ri(zTop, zMid - 1), s = rng() < 0.6 ? 0 : 1, k = ri(0, 3);
      if (kind === 'ball' && Math.abs(x - cx) < 3 && z < R.z0 + 6) continue; // keep goal mouths open
      if (k === 0) { const L = ri(2, 4); for (let j = 0; j < L; j++) set(x + j, z, T_WALL, s); }
      else if (k === 1) { const L = ri(2, 3); for (let j = 0; j < L; j++) set(x, z + j, T_WALL, s); }
      else if (k === 2) { set(x, z, T_WALL, s); set(x + 1, z, T_WALL, s); set(x, z + 1, T_WALL, s); set(x + 1, z + 1, T_WALL, s); }
      else { set(x, z, T_WALL, s); }
    }
    const nB = kind === 'boss' ? 3 : ri(4, 6);
    for (let i = 0; i < nB; i++) {
      let x = ri(R.x0, R.x1), z = ri(zTop, zMid); const n = ri(4, 9);
      for (let j = 0; j < n; j++) { if (M.t[tIdx(x, z)] === T_FLOOR) set(x, z, T_BUSH); const d = ri(0, 3); x += [1, -1, 0, 0][d]; z += [0, 0, 1, -1][d]; x = clamp(x, R.x0, R.x1); z = clamp(z, zTop, zMid); }
    }
    if (kind !== 'boss' && rng() < 0.6) { const x = ri(R.x0 + 2, R.x1 - 4), z = ri(zTop + 2, zMid - 2); set(x, z, T_WATER); set(x + 1, z, T_WATER); }
    // centre plaza
    for (let z = cz - 3; z <= cz + 2; z++) for (let x = cx - 3; x <= cx + 2; x++) if (M.t[tIdx(x, z)] !== T_BUSH) M.t[tIdx(x, z)] = T_FLOOR;
  }
  // team spawns: team 0 at the bottom (large z), team 1 mirrored at the top
  M.teamSpawns = [[], []];
  const sz = kind === 'boss' ? R.z1 - 2 : kind === 'train' ? R.z1 - 2 : R.z1 - 1.5;
  for (const dx of [-2.5, 0, 2.5]) M.teamSpawns[0].push({ x: cx + dx, z: sz });
  for (const dx of [-2.5, 0, 2.5]) M.teamSpawns[1].push({ x: N - (cx + dx), z: N - sz });
  for (const t of [0, 1]) for (const p of M.teamSpawns[t]) for (let z = Math.floor(p.z) - 1; z <= Math.floor(p.z) + 1; z++) for (let x = Math.floor(p.x) - 1; x <= Math.floor(p.x) + 1; x++) if (inMap(x, z) && M.t[tIdx(x, z)] !== T_BORDER) M.t[tIdx(x, z)] = T_FLOOR;
  if (kind === 'ball') {
    // goal mouths: one row opened in the top and bottom border, 4 tiles wide
    M.goals = [];
    for (const [team, zRow] of [[0, R.z1 + 1], [1, R.z0 - 1]]) { for (let x = cx - 2; x <= cx + 1; x++) M.t[tIdx(x, zRow)] = T_FLOOR; M.goals.push({ team, x0: cx - 2, x1: cx + 2, z: zRow, line: team === 0 ? R.z1 + 1 : R.z0 }); }
  } else M.goals = null;
  // connectivity from the centre; unreachable pockets become walls
  const seen = new Uint8Array(N * N), st = [tIdx(cx, cz)]; seen[st[0]] = 1;
  while (st.length) { const i = st.pop(), x = i % N, z = (i / N) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (!inMap(nx, nz)) continue; const j = tIdx(nx, nz), t = M.t[j]; if (seen[j] || t === T_WALL || t === T_BORDER || t === T_WATER) continue; seen[j] = 1; st.push(j); } }
  for (let i = 0; i < N * N; i++) if (!seen[i] && (M.t[i] === T_FLOOR || M.t[i] === T_BUSH)) { M.t[i] = T_WALL; M.sty[i] = 0; }
  if (kind === 'train') { const addB = (x, z) => { const b = { id: M.boxes.length, tx: x, tz: z, hp: BAL.boxHp * 0.5 }; M.boxes.push(b); M.box[tIdx(x, z)] = b.id; }; addB(25, 21); addB(27, 21); }
  for (let i = 0; i < N * N; i++) if (M.t[i] === T_FLOOR && rng() < 0.06) M.deco.push({ x: (i % N) + 0.2 + rng() * 0.6, z: ((i / N) | 0) + 0.2 + rng() * 0.6, k: ri(0, 2), r: rng() * TAU, s: 0.7 + rng() * 0.6 });
  genGimmicks(rng, kind);
}

/* ---------- jump pads, portals, healing springs (deterministic from the seed) ---------- */
function genGimmicks(rng, kind) {
  M.pads = []; M.ports = []; M.springs = [];
  const N = M.N, free = (x, z) => inMap(x, z) && M.t[tIdx(x, z)] === T_FLOOR && M.box[tIdx(x, z)] < 0;
  const farFromSpawns = (x, z) => !(M.spawns || []).some(s => d2(s.x, s.z, x + .5, z + .5) < 6) && !(M.teamSpawns || [[], []]).flat().some(s => d2(s.x, s.z, x + .5, z + .5) < 6);
  const pickTile = (x0, x1, z0, z1) => { for (let k = 0; k < 80; k++) { const x = x0 + Math.floor(rng() * (x1 - x0 + 1)), z = z0 + Math.floor(rng() * (z1 - z0 + 1)); if (free(x, z) && farFromSpawns(x, z)) return { x, z }; } return null; };
  const mirror = p => ({ x: N - 1 - p.x, z: N - 1 - p.z });
  const addPad = (p, toCentre) => {
    if (!p) return;
    const sx = p.x + .5, sz = p.z + .5; let dx = N / 2 - sx, dz = N / 2 - sz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const D = Math.min(toCentre, L - 1.5); const t = freeTileNear(sx + dx * D, sz + dz * D);
    M.pads.push({ x: sx, z: sz, tx: t.x, tz: t.z });
  };
  if (kind === 'train') {
    M.pads.push({ x: 15.5, z: 25.5, tx: 15.5, tz: 19.5 }); M.ports.push({ a: { x: 11.5, z: 28.5 }, b: { x: 28.5, z: 11.5 } }); M.springs.push({ x: 20.5, z: 27.5, r: 1.3 });
    return;
  }
  if (kind === 'solo' || kind === 'duo' || !kind) {
    for (let i = 0; i < 2; i++) { const p = pickTile(3, 17, 3, 17); addPad(p, 7); if (p) { addPad({ x: N - 1 - p.x, z: p.z }, 7); addPad({ x: p.x, z: N - 1 - p.z }, 7); addPad(mirror(p), 7); } }
    const a = pickTile(4, 14, 4, 14); if (a) { const b = mirror(a); M.ports.push({ a: { x: a.x + .5, z: a.z + .5 }, b: { x: b.x + .5, z: b.z + .5 } }); }
    for (let i = 0; i < 2; i++) { const p = pickTile(6, 16, 6, 33); if (p) { M.springs.push({ x: p.x + .5, z: p.z + .5, r: 1.2 }); const m = mirror(p); M.springs.push({ x: m.x + .5, z: m.z + .5, r: 1.2 }); } }
  } else if (kind === 'boss') {
    const R = M.arena; for (let i = 0; i < 2; i++) { const p = pickTile(R.x0 + 1, R.x1 - 1, R.z0 + 1, R.z0 + 7); if (p) { M.springs.push({ x: p.x + .5, z: p.z + .5, r: 1.2 }); const m = mirror(p); M.springs.push({ x: m.x + .5, z: m.z + .5, r: 1.2 }); } }
  } else {
    const R = M.arena; const p = pickTile(R.x0, R.x0 + 4, N / 2 + 3, R.z1 - 4); if (p) { const sx = p.x + .5, sz = p.z + .5, t = freeTileNear(sx + 5, sz - 6); M.pads.push({ x: sx, z: sz, tx: t.x, tz: t.z }); M.pads.push({ x: N - sx, z: N - sz, tx: N - t.x, tz: N - t.z }); }
    const q = pickTile(R.x1 - 4, R.x1, N / 2 + 2, R.z1 - 3); if (q) { M.springs.push({ x: q.x + .5, z: q.z + .5, r: 1.1 }); M.springs.push({ x: N - 1 - q.x + .5, z: N - 1 - q.z + .5, r: 1.1 }); }
  }
}

/* ---------- mode setup ---------- */
function initMode() {
  const mode = G.cfg.mode, md = MODES[mode];
  G.ms = { k: mode, tl: md.time || 0, over: false };
  G.warns = []; G.traps = []; G.extraBoxes = 0; G.baseBoxes = M.boxes.length; G.events = { drop: [rr(55, 70), rr(105, 125)], meteor: rr(75, 95), surge: rr(90, 110) };
  if (md.showdown) return;
  G.noGas = true;
  if (mode === 'gem') Object.assign(G.ms, { mine: { x: BAL.N / 2, z: BAL.N / 2 }, gemT: 4, gems: [], cd: null, sc: [0, 0] });
  if (mode === 'ball') Object.assign(G.ms, { ball: { x: BAL.N / 2, z: BAL.N / 2, y: 0.3, vx: 0, vz: 0, vy: 0, carrier: 0, touch: -1 }, sc: [0, 0], resetT: 0 });
  if (mode === 'bounty') Object.assign(G.ms, { sc: [0, 0] });
  if (mode === 'boss') Object.assign(G.ms, { bossId: 0, phase: 1, waveT: 18, act: null, actT: 2.5 });
  if (mode === 'train') Object.assign(G.ms, { step: 0, stepT: 0, hits: 0, bushT: 0, done: false, mark: { x: 20, z: 22 } });
}
function teamSpawnPoint(team, i) {
  const list = M.teamSpawns[team] || M.teamSpawns[0];
  return list[i % list.length];
}
/* place everyone for team/PvE modes */
function placeTeamMode() {
  const cnt = {};
  for (const b of G.ents) {
    if (b.H.k === 'boss') { b.x = BAL.N / 2; b.z = BAL.N / 2 - 4; continue; }
    if (b.H.k === 'dummy') { b.spawn = { x: b.x, z: b.z }; continue; }
    const i = cnt[b.team] = (cnt[b.team] || 0) + 1, p = teamSpawnPoint(b.team, i - 1);
    b.x = p.x; b.z = p.z; b.face = b.aim = b.team === 0 ? -Math.PI / 2 : Math.PI / 2; b.spawn = p;
  }
}

/* ---------- per-step mode logic ---------- */
function stepMode(dt) {
  const ms = G.ms, mode = ms.k;
  stepTraps(dt); stepWarns(dt);
  if (isShowdown()) { stepShowdownEvents(dt); return; }
  if (G.over) return;
  if (ms.tl > 0) { ms.tl -= dt; if (ms.tl <= 0) { ms.tl = 0; timeUp(); return; } }
  if (mode === 'gem') stepGem(dt);
  else if (mode === 'ball') stepBall(dt);
  else if (mode === 'boss') stepBoss(dt);
  else if (mode === 'train') stepTrain(dt);
}
function endTeams(winner) {
  if (G.over) return;
  G.over = true; G.winner = winner;
  const teams = [...new Set(G.ents.map(e => e.team))];
  for (const t of teams) G.placement[t] = winner < 0 ? 2 : (t === winner ? 1 : 2);
  if (winner < 0) G.draw = true;
  ev('end', { team: winner, draw: winner < 0 ? 1 : 0 });
}
function timeUp() {
  const ms = G.ms;
  if (ms.k === 'gem') { const a = teamGems(0), b = teamGems(1); endTeams(a > b ? 0 : b > a ? 1 : -1); }
  else if (ms.k === 'ball' || ms.k === 'bounty') endTeams(ms.sc[0] > ms.sc[1] ? 0 : ms.sc[1] > ms.sc[0] ? 1 : -1);
  else if (ms.k === 'boss') endTeams(9);
}
/* gem grab */
const teamGems = t => G.ents.reduce((s, e) => s + (e.team === t && e.alive ? e.gems : 0), 0);
function stepGem(dt) {
  const ms = G.ms;
  ms.gemT -= dt;
  if (ms.gemT <= 0 && ms.gems.length < 29 && !ms.cd) { ms.gemT = 6.5; const a = Math.random() * TAU, r = rr(0.6, 1.5); ms.gems.push({ id: G.id++, x: ms.mine.x + Math.cos(a) * r, z: ms.mine.z + Math.sin(a) * r, born: G.t }); ev('gemspawn', { x: ms.mine.x, z: ms.mine.z }); }
  ms.gems = ms.gems.filter(g => {
    if (G.t - g.born < 0.4) return true;
    for (const b of G.ents) if (b.alive && b.H.k !== 'dummy' && d2(b.x, b.z, g.x, g.z) < 0.7 * 0.7) { b.gems++; b.st.maxGems = Math.max(b.st.maxGems || 0, b.gems); ev('gem', { id: b.id, x: g.x, z: g.z }); return false; }
    return true;
  });
  ms.sc = [teamGems(0), teamGems(1)];
  const lead = ms.sc[0] >= 10 && ms.sc[0] > ms.sc[1] ? 0 : ms.sc[1] >= 10 && ms.sc[1] > ms.sc[0] ? 1 : -1;
  if (lead < 0) { if (ms.cd) { ms.cd = null; ev('cdstop', {}); } }
  else if (!ms.cd || ms.cd.team !== lead) { ms.cd = { team: lead, t: 15 }; ev('cdstart', { team: lead }); }
  else { ms.cd.t -= dt; if (ms.cd.t <= 0) endTeams(lead); }
}
function dropGems(b) {
  if (!b.gems) return;
  for (let i = 0; i < b.gems; i++) { const a = i / b.gems * TAU + Math.random() * 0.4, r = 0.4 + Math.random() * 0.8; let x = b.x + Math.cos(a) * r, z = b.z + Math.sin(a) * r; if (solidTile(Math.floor(x), Math.floor(z))) { x = b.x; z = b.z; } G.ms.gems.push({ id: G.id++, x, z, born: G.t }); }
  b.gems = 0;
}
/* brawl ball */
function stepBall(dt) {
  const ms = G.ms, B = ms.ball;
  if (ms.resetT > 0) { ms.resetT -= dt; if (ms.resetT <= 0) ev('kickoff', {}); return; }
  const car = B.carrier ? entById(B.carrier) : null;
  if (car) {
    if (!car.alive || car.stunT > 0.05 || (car.fm && car.fm.k === 'kb')) { B.carrier = 0; B.vx = (Math.random() - .5) * 3; B.vz = (Math.random() - .5) * 3; car.ballCd = 0.6; }
    else { B.x = car.x + Math.cos(car.face) * 0.55; B.z = car.z + Math.sin(car.face) * 0.55; B.y = 0.25; B.vx = B.vz = B.vy = 0; B.touch = car.team; }
  }
  if (!B.carrier) {
    // physics: friction, bounce off solids, small hop
    B.vy -= 22 * dt; B.y += B.vy * dt; if (B.y < 0.25) { B.y = 0.25; B.vy = Math.abs(B.vy) > 2 ? -B.vy * 0.45 : 0; }
    const sp = Math.hypot(B.vx, B.vz), fr = Math.max(0, sp - 6.5 * dt) / (sp || 1); B.vx *= fr; B.vz *= fr;
    const n = Math.max(1, Math.ceil(Math.hypot(B.vx, B.vz) * dt / 0.15));
    for (let s = 0; s < n; s++) {
      const nx = B.x + B.vx * dt / n, nz = B.z + B.vz * dt / n;
      const goal = M.goals.find(g => nx >= g.x0 && nx <= g.x1 && (g.team === 0 ? nz > g.line + 0.15 : nz < g.line - 0.15));
      if (goal) { scoreGoal(1 - goal.team); return; }
      const solid = (x, z) => { const tx = Math.floor(x), tz = Math.floor(z); if (!inMap(tx, tz)) return true; const t = M.t[tIdx(tx, tz)]; return t === T_WALL || t === T_BORDER || t === T_WATER || M.box[tIdx(tx, tz)] >= 0; };
      if (solid(nx, B.z)) { B.vx = -B.vx * 0.7; } else B.x = nx;
      if (solid(B.x, nz)) { B.vz = -B.vz * 0.7; } else B.z = nz;
    }
    if (B.y < 0.8) for (const b of G.ents) {
      if (!b.alive || b.ballCd > 0 || b.H.k === 'dummy' || b.stunT > 0) continue;
      if (d2(b.x, b.z, B.x, B.z) < 0.8 * 0.8) { B.carrier = b.id; B.touch = b.team; B.lastId = b.id; ev('ballget', { id: b.id }); break; }
    }
  }
}
function kickBall(b, aim, power) {
  const B = G.ms.ball; if (B.carrier !== b.id) return false;
  B.carrier = 0; B.lastId = b.id; B.vx = Math.cos(aim) * power; B.vz = Math.sin(aim) * power; B.vy = power > 16 ? 6 : 3; b.ballCd = 0.45; b.lastAtk = G.t; b.atkSeq++;
  ev('kick', { id: b.id, x: +B.x.toFixed(2), z: +B.z.toFixed(2), p: power > 16 ? 1 : 0 });
  return true;
}
function scoreGoal(team) {
  const ms = G.ms; ms.sc[team]++; const by = entById(ms.ball.lastId); if (by && by.team === team) by.st.goals = (by.st.goals || 0) + 1;
  ev('goal', { team, sc: ms.sc.slice(), by: by ? by.id : 0 });
  if (ms.sc[team] >= 2) { endTeams(team); return; }
  ms.resetT = 3; Object.assign(ms.ball, { x: BAL.N / 2, z: BAL.N / 2, y: 0.3, vx: 0, vz: 0, vy: 0, carrier: 0 });
  for (const b of G.ents) { if (b.alive && b.spawn) { b.x = b.spawn.x; b.z = b.spawn.z; b.posSeq++; b.fm = null; } }
}
/* bounty: handled in onKillMode */
function onKillMode(v, k) {
  const ms = G.ms; if (!ms || isShowdown()) return;
  if (ms.k === 'gem') dropGems(v);
  if (ms.k === 'ball' && ms.ball.carrier === v.id) { ms.ball.carrier = 0; }
  if (ms.k === 'bounty') {
    if (k && k.kind === 'b' && k.team !== v.team) { ms.sc[k.team] += v.bounty; k.bounty = Math.min(7, k.bounty + 1); k.st.maxBounty = Math.max(k.st.maxBounty || 0, k.bounty); ev('stars', { team: k.team, n: v.bounty, x: v.x, z: v.z }); }
    v.bounty = 2;
  }
  if (ms.k === 'boss' && v.H.k === 'boss') { endTeams(v.team === 0 ? 9 : 0); }
}
/* respawn for non-showdown modes */
function respawnAtBase(b) {
  const p = b.spawn || teamSpawnPoint(b.team, 0);
  Object.assign(b, { alive: true, x: p.x, z: p.z, hp: b.baseHp, mhp: b.baseHp, ammo: BAL.ammoMax, lastHurt: -9, fm: null, stunT: 0, born: G.t, invulnT: 2, respawnT: 0 });
  b.posSeq++; ev('respawn', { id: b.id, x: b.x, z: b.z });
}
/* boss fight */
function stepBoss(dt) {
  const ms = G.ms, boss = entById(ms.bossId); if (!boss || !boss.alive) return;
  const players = G.ents.filter(e => e.alive && e.team === 0);
  if (!players.length) return;
  // lose if every hero is down at the same time
  if (G.ents.filter(e => e.team === 0).every(e => !e.alive)) { endTeams(9); return; }
  if (ms.phase === 1 && boss.hp < boss.mhp * 0.5) { ms.phase = 2; ev('phase', { x: boss.x, z: boss.z }); boss.invulnT = 1.5; ms.actT = 1.6; }
  ms.waveT -= dt;
  if (ms.waveT <= 0) { ms.waveT = ms.phase === 2 ? 14 : 20; spawnMinions(ms.phase === 2 ? 3 : 2); }
  // movement: drift towards the nearest hero, keep ~4 tiles
  let tgt = null, bd = 1e9; for (const p of players) { const d = dist(boss.x, boss.z, p.x, p.z); if (d < bd) { bd = d; tgt = p; } }
  boss.inp.mx = boss.inp.mz = 0;
  if (!boss.fm && tgt) { const dx = tgt.x - boss.x, dz = tgt.z - boss.z, L = Math.hypot(dx, dz) || 1, k = L > 4.5 ? 1 : L < 3 ? -0.6 : 0; boss.inp.mx = dx / L * k; boss.inp.mz = dz / L * k; boss.face = Math.atan2(dz, dx); }
  ms.actT -= dt;
  if (ms.actT <= 0 && tgt && !boss.fm && !boss.burst) {
    const acts = ms.phase === 2 ? ['barrage', 'rockets', 'sweep', 'charge', 'rockets'] : ['barrage', 'rockets', 'sweep', 'charge'];
    let act = pick(acts); if (act === ms.last) act = pick(acts); ms.last = act;
    const fast = ms.phase === 2 ? 0.75 : 1;
    const a = Math.atan2(tgt.z - boss.z, tgt.x - boss.x);
    ev('bossact', { k: act, x: boss.x, z: boss.z });
    if (act === 'barrage') { boss.burst = { k: 'ring', left: ms.phase === 2 ? 4 : 3, next: G.t + 0.4, aim: a, i: 0, a: boss.H.sup, sup: true }; ms.actT = 3.4 * fast; }
    else if (act === 'rockets') {
      for (const p of players) for (let k = 0; k < (ms.phase === 2 ? 2 : 1); k++) {
        const tx = p.x + rr(-1.2, 1.2), tz = p.z + rr(-1.2, 1.2);
        spawnProj(boss, 'rocket', boss.x, boss.z, a, { speed: 1, range: 1, dmg: 900 }, true, { lob: { sx: boss.x, sz: boss.z, tx, tz, t: -k * 0.35, T: 1.25, h: 5 }, radius: 1.4, life: 99, y: 2 });
      }
      ms.actT = 3 * fast;
    } else if (act === 'sweep') { boss.sweep = { a0: a - 1.1, a1: a + 1.1, t: 0, T: 1.6, cd: 0 }; ms.actT = 3.2 * fast; }
    else if (act === 'charge') { const sp = 13; boss.fm = { k: 'dash', vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, t: Math.min(8, bd + 1) / sp, dmg: 1400, kb: 2.5, hit: new Set(), breakWalls: true, sup: true, windup: 0.6 }; ms.actT = 2.6 * fast; }
  }
  if (boss.sweep) {
    const S = boss.sweep; S.t += dt; S.cd -= dt;
    if (S.cd <= 0) { S.cd = 0.06; const an = lerp(S.a0, S.a1, S.t / S.T); spawnProj(boss, 'bossshot', boss.x + Math.cos(an) * 1.1, boss.z + Math.sin(an) * 1.1, an, { speed: 17, range: 10, dmg: 260, size: 0.22 }, true); boss.face = an; }
    if (S.t >= S.T) boss.sweep = null;
  }
}
function spawnMinions(n) {
  const boss = entById(G.ms.bossId); if (!boss) return;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + Math.random(), p = freeTileNear(boss.x + Math.cos(a) * 2.2, boss.z + Math.sin(a) * 2.2);
    const m = mkBrawler({ name: '机兵', hero: HERO_IDX.minion, human: 0, team: boss.team });
    m.x = p.x; m.z = p.z; m.minion = true; m.invulnT = 0.8; G.ents.push(m);
    ev('minion', { id: m.id, x: m.x, z: m.z });
  }
}
/* training ground */
const TRAIN_STEPS = [
  { t: '移动到黄色圆圈', d: '键盘 WASD／左半屏摇杆' },
  { t: '攻击木桩 3 次', d: '左键／右下摇杆（轻点可自动瞄准）' },
  { t: '大招已充满，对木桩放大招', d: 'E 或右键按住瞄准、松开释放／黄色摇杆' },
  { t: '使用副技能', d: 'Q 键／右下角绿色按钮（每局 3 次）' },
  { t: '躲进草丛 2 秒', d: '在草丛里敌人看不见你，除非离得很近' },
  { t: '打开一个能量箱', d: '箱子会掉出能量块，捡起来能加血量和伤害' },
  { t: '踩上跳板，或者走进传送门', d: '地图机关能帮你快速转移' },
];
function stepTrain(dt) {
  const ms = G.ms, me = G.ents.find(e => e.human === 1); if (!me || ms.done) return;
  for (const d of G.ents) if (d.H.k === 'dummy' && d.alive) { d.hp = Math.min(d.mhp, d.hp + d.mhp * 0.2 * dt); if (d.patrol) { d.inp.mx = Math.sin(G.t * 0.8); d.inp.mz = 0; } }
  const s = ms.step;
  let ok = false;
  if (s === 0) ok = d2(me.x, me.z, ms.mark.x, ms.mark.z) < 1;
  else if (s === 1) ok = ms.hits >= 3;
  else if (s === 2) { if (me.sup < 1 && ms.supGiven !== true) { me.sup = 1; ms.supGiven = true; } ok = me.supSeq > 0; }
  else if (s === 3) ok = me.gadUsed > 0;
  else if (s === 4) { ms.bushT = me.inBush ? ms.bushT + dt : 0; ok = ms.bushT > 2; }
  else if (s === 5) ok = M.boxes.some(b => b.hp <= 0);
  else if (s === 6) ok = me.usedGimmick;
  if (ok) { ms.step++; ev('trainstep', { s: ms.step }); if (ms.step >= TRAIN_STEPS.length) { ms.done = true; G.over = true; G.winner = 0; G.placement[0] = 1; ev('end', { team: 0, train: 1 }); } }
}

/* ---------- showdown events: supply drops, meteor shower, gas surge ---------- */
function stepShowdownEvents(dt) {
  const E = G.events;
  for (let i = E.drop.length - 1; i >= 0; i--) if (G.t >= E.drop[i]) {
    E.drop.splice(i, 1);
    const R = Math.max(3, G.gasR - 3), h = H2();
    let p = null; for (let k = 0; k < 40 && !p; k++) { const x = Math.floor(h + rr(-R, R)), z = Math.floor(h + rr(-R, R)); if (inMap(x, z) && M.t[tIdx(x, z)] === T_FLOOR && M.box[tIdx(x, z)] < 0 && !G.ents.some(e => e.alive && d2(e.x, e.z, x + .5, z + .5) < 1)) p = { x, z }; }
    if (p) { G.warns.push({ id: G.id++, k: 'drop', x: p.x + .5, z: p.z + .5, r: 0.9, t: 0, T: 4, tx: p.x, tz: p.z }); ev('dropwarn', { x: p.x + .5, z: p.z + .5 }); }
  }
  if (E.meteor && G.t >= E.meteor) { E.meteor = 0; E.meteorLeft = 12; E.meteorNext = G.t; ev('meteors', {}); }
  if (E.meteorLeft > 0 && G.t >= E.meteorNext) {
    E.meteorLeft--; E.meteorNext = G.t + rr(0.35, 0.7);
    const alive = G.ents.filter(e => e.alive); if (alive.length) { const t = pick(alive); const x = t.x + rr(-2.5, 2.5), z = t.z + rr(-2.5, 2.5); G.warns.push({ id: G.id++, k: 'meteor', x, z, r: 1.5, t: 0, T: 1.4 }); }
  }
  if (E.surge && G.t >= E.surge) { E.surge = 0; G.gasSurge = (G.gasSurge || 0) + 18; ev('surge', {}); }
}
function stepWarns(dt) {
  G.warns = G.warns.filter(w => {
    w.t += dt; if (w.t < w.T) return true;
    if (w.k === 'meteor') explode({ x: w.x, z: w.z, radius: w.r, dmg: 1300, team: -1, owner: 0, breakWalls: true, sup: true });
    else if (w.k === 'drop') {
      const i = tIdx(w.tx, w.tz);
      if (M.t[i] === T_FLOOR && M.box[i] < 0) { const b = { id: M.boxes.length, tx: w.tx, tz: w.tz, hp: BAL.boxHp * 0.75, drop: 3 }; M.boxes.push(b); M.box[i] = b.id; M.ver++; G.extraBoxes++; ev('dropland', { x: w.x, z: w.z }); }
    }
    return false;
  });
}

/* ---------- traps (gadget) ---------- */
function stepTraps(dt) {
  G.traps = G.traps.filter(tr => {
    tr.life -= dt; if (tr.life <= 0) return false;
    for (const e of G.ents) if (e.alive && e.team !== tr.team && d2(e.x, e.z, tr.x, tr.z) < 0.55 * 0.55) {
      hurt(e, 700, entById(tr.owner), { sup: true, stun: 1.1 }); ev('trap', { x: tr.x, z: tr.z }); return false;
    }
    return true;
  });
}

/* ---------- gadgets ---------- */
function useGadget(b) {
  if (b.gadLeft <= 0 || b.gadCd > 0 || b.stunT > 0 || !b.alive) return false;
  const k = b.H.gad; b.gadLeft--; b.gadCd = GADGETS[k].cd; b.gadUsed = (b.gadUsed || 0) + 1; b.st.gad++;
  if (b.stealthT > 0) b.stealthT = 0;
  if (k === 'nova' || k === 'freeze') {
    for (const e of G.ents) if (e.alive && e.team !== b.team && d2(e.x, e.z, b.x, b.z) < 2.6 * 2.6) {
      const dx = e.x - b.x, dz = e.z - b.z; hurt(e, 300 * dmgMul(b), b, k === 'nova' ? { sup: true, kb: 2.2, dx, dz } : { sup: true, stun: 1.0, slow: 2 });
    }
    ev('gadget', { id: b.id, k, x: b.x, z: b.z });
  } else if (k === 'blink') {
    const a = b.inp.aim; let p = null;
    for (let D = 3.5; D > 0.5 && !p; D -= 0.25) { const x = b.x + Math.cos(a) * D, z = b.z + Math.sin(a) * D; if (!solidTile(Math.floor(x), Math.floor(z)) && x > 1.5 && z > 1.5 && x < BAL.N - 1.5 && z < BAL.N - 1.5) p = { x, z }; }
    ev('gadget', { id: b.id, k, x: b.x, z: b.z });
    if (p) { b.x = p.x; b.z = p.z; b.posSeq++; ev('gadget', { id: b.id, k: 'blink2', x: p.x, z: p.z }); }
  } else if (k === 'armor') { b.armorT = 2.5; ev('gadget', { id: b.id, k, x: b.x, z: b.z }); }
  else if (k === 'trap') { G.traps.push({ id: G.id++, x: b.x, z: b.z, team: b.team, owner: b.id, life: 20 }); ev('gadget', { id: b.id, k, x: b.x, z: b.z }); }
  else if (k === 'reload') { b.ammo = BAL.ammoMax; ev('gadget', { id: b.id, k, x: b.x, z: b.z }); }
  else if (k === 'heal') { const v = Math.min(b.mhp - b.hp, b.mhp * 0.3); b.hp += v; b.st.heal += v; ev('heal', { id: b.id, x: +b.x.toFixed(2), z: +b.z.toFixed(2), v: Math.round(v) }); ev('gadget', { id: b.id, k, x: b.x, z: b.z }); }
  else if (k === 'speed') { b.speedT = 3; ev('gadget', { id: b.id, k, x: b.x, z: b.z }); }
  else if (k === 'dash') {
    let mx = b.inp.mx, mz = b.inp.mz; if (Math.hypot(mx, mz) < 0.2) { mx = Math.cos(b.inp.aim); mz = Math.sin(b.inp.aim); }
    const L = Math.hypot(mx, mz) || 1; b.fm = { k: 'roll', vx: mx / L * 14, vz: mz / L * 14, t: 3 / 14 }; b.posSeq++; ev('gadget', { id: b.id, k, x: b.x, z: b.z });
  }
  return true;
}

/* ---------- star powers ---------- */
function applyStar(b) {
  const sp = b.sp;
  b.spPow = sp === 'power' ? 1.1 : 1;
  b.spSpd = sp === 'swift' ? 1.08 : 1;
  b.spReload = sp === 'quick' ? 1.15 : 1;
  b.spCharge = sp === 'charge' ? 1.25 : 1;
  if (sp === 'tough') { b.baseHp *= 1.15; b.hp = b.mhp = b.baseHp; }
}

/* ---------- gimmicks touched by a brawler ---------- */
function stepGimmicks(b, dt) {
  if (b.fm || !b.alive) return;
  b.portCd = Math.max(0, (b.portCd || 0) - dt);
  for (const p of M.pads) if (d2(b.x, b.z, p.x, p.z) < 0.45 * 0.45) {
    const D = dist(p.x, p.z, p.tx, p.tz);
    b.fm = { k: 'leap', sx: b.x, sz: b.z, tx: p.tx, tz: p.tz, t: 0, T: 0.45 + D * 0.05, dmg: 0, r: 0, pad: true };
    b.posSeq++; b.usedGimmick = true; ev('pad', { x: p.x, z: p.z }); return;
  }
  if (b.portCd <= 0) for (const P of M.ports) for (const [s, d] of [[P.a, P.b], [P.b, P.a]]) if (d2(b.x, b.z, s.x, s.z) < 0.5 * 0.5) {
    ev('port', { x: s.x, z: s.z }); b.x = d.x; b.z = d.z + 0.01; b.posSeq++; b.portCd = 2.5; b.usedGimmick = true; ev('port', { x: d.x, z: d.z }); return;
  }
  for (const s of M.springs) if (d2(b.x, b.z, s.x, s.z) < s.r * s.r && b.hp < b.mhp) { const v = Math.min(b.mhp - b.hp, b.mhp * 0.12 * dt); b.hp += v; b.st.heal += v; if (Math.random() < dt * 3) ev('spring', { x: b.x, z: b.z }); }
}

/* ---------- social: emotes, pings, teammate commands (host side; guests send requests) ---------- */
const EMOTES = { thumb: '👍', laugh: '😂', angry: '😡', gg: 'GG', come: '跟我来！', care: '小心！' };
function emote(b, k) { if (!EMOTES[k] || (b.emoteT && G.t - b.emoteT < 1.2)) return; b.emoteT = G.t; ev('emote', { id: b.id, e: k }); }
function addPing(b, x, z, tid) { G.focus = G.focus || {}; G.focus[b.team] = { x, z, tid: tid || 0, t: G.t }; ev('ping', { team: b.team, x: +x.toFixed(2), z: +z.toFixed(2), tid: tid || 0, by: b.id }); }
function setCmd(b, c) { G.cmd = G.cmd || {}; G.cmd[b.team] = c; ev('cmd', { team: b.team, c, by: b.id }); }

/* ---------- rosters: humans = [{name, hero, sp, skin, gid, human}] (host first) ---------- */
function botPicks(n) {
  const out = []; let pool = [];
  for (let i = 0; i < n; i++) { if (!pool.length) pool = PLAYABLE.slice().sort(() => Math.random() - .5); out.push(pool.pop()); }
  return out;
}
function rosterFor(mode, humans, versus) {
  const md = MODES[mode], R = [], names = BOT_NAMES.slice().sort(() => Math.random() - .5);
  let ni = 0, pool = [];
  const taken = new Set(humans.map(h => h.hero));
  const nextHero = () => { if (!pool.length) { pool = PLAYABLE.filter(h => !taken.has(h)).sort(() => Math.random() - .5); taken.clear(); } return pool.pop(); };
  const bot = (team, extra) => { const h = nextHero(); return Object.assign({ name: names[ni++ % names.length], hero: h, human: 0, team, sp: pick(HEROES[h].sps), skin: Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 2) : 0 }, extra || {}); };
  const H = humans.map(h => Object.assign({}, h));
  if (mode === 'solo') {
    H.forEach((h, i) => R.push(Object.assign(h, { team: i })));
    for (let t = H.length; t < 10; t++) R.push(bot(t));
  } else if (mode === 'duo') {
    H.forEach((h, i) => R.push(Object.assign(h, { team: versus ? i : Math.floor(i / 2) })));
    for (let t = 0; t < 5; t++) { const n = R.filter(o => o.team === t).length; for (let k = n; k < 2; k++) { const b = bot(t); if (t === 0 && n > 0) b.name += '(队友)'; R.push(b); } }
  } else if (mode === 'boss') {
    H.forEach(h => R.push(Object.assign(h, { team: 0 })));
    for (let k = H.length; k < 3; k++) { const b = bot(0); b.name += '(队友)'; R.push(b); }
    R.push({ name: '钢铁巨像', hero: HERO_IDX.boss, human: 0, team: 9 });
  } else if (mode === 'train') {
    R.push(Object.assign(H[0], { team: 0 }));
    for (const [x, z, patrol] of [[20.5, 18.5, 0], [17.5, 18.5, 0], [23.5, 18.5, 1]]) R.push({ name: patrol ? '移动木桩' : '木桩', hero: HERO_IDX.dummy, human: 0, team: 1, x, z, patrol });
  } else {
    H.forEach((h, i) => { const t = versus ? i % 2 : (i < 3 ? 0 : 1); R.push(Object.assign(h, { team: t })); });
    for (const t of [0, 1]) { const n = R.filter(o => o.team === t).length; for (let k = n; k < 3; k++) { const b = bot(t); if (t === 0 && R.some(o => o.human && o.team === 0)) b.name += '(队友)'; R.push(b); } }
  }
  return R;
}
