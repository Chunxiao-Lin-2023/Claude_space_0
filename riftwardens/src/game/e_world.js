/* =================== world state =================== */
let G = null;            // shared world; host authoritative
let P = [];              // players (index = network slot)
let MEI = 0, IS_HOST = true, ME = null;
let STATE = 'title';     // title | play
let PAUSED = false;
let CAM = {x: 0, y: 0, z: 1};
const FX = [];           // local-only visuals
const TXT = [];          // floating texts

/* ---------- map ---------- */
function buildMap(id) {
  const rows = MAPS[id], h = rows.length, w = rows[0].length;
  const m = {id, w, h, t: new Uint8Array(w * h), gates: [], rifts: [], spawn: {x: 1, y: 1}, torches: [], decor: [], pillars: [], lights: []};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x], i = y * w + x; let t = TF;
    if (ch === '#') t = TW;
    else if (ch === 't') { t = TW; m.torches.push({x, y}); }
    else if (ch === '_') t = TP;
    else if (ch === '~') t = TL;
    else if (ch === 'o') { t = TO; m.pillars.push({x, y}); }
    else if (ch === 'b') { t = TD; m.decor.push({x, y, k: 'barrel'}); }
    else if (ch === 'c') { t = TD; m.decor.push({x, y, k: 'crate'}); }
    else if (ch === 'f') { t = TD; m.decor.push({x, y, k: 'brazier'}); }
    else if (ch === 'k') m.decor.push({x, y, k: 'bones', flat: 1});
    else if (ch === 'G') m.gates.push({x, y});
    else if (ch === 'R') m.rifts.push({x, y});
    else if (ch === 'P') m.spawn = {x, y};
    m.t[i] = t;
  }
  return m;
}
const tAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= G.map.w || ty >= G.map.h) ? TW : G.map.t[ty * G.map.w + tx];
const tIdx = (tx, ty) => ty * G.map.w + tx;
const tc = v => v * T + T / 2;
const isSpecialTile = (tx, ty) => G.map.gates.some(g => g.x === tx && g.y === ty) || G.map.rifts.some(g => g.x === tx && g.y === ty) || (G.map.spawn.x === tx && G.map.spawn.y === ty);
function barricadeAt(tx, ty) { if (tx < 0 || ty < 0 || tx >= G.map.w || ty >= G.map.h) return false; const id = G.trapAt[tIdx(tx, ty)]; if (id < 0) return false; const tr = trapById(id); return !!tr && tr.k === 'barricade'; }
// solidity predicates (tile coords)
const solidWalk = (tx, ty) => { const t = tAt(tx, ty); return t !== TF; };
const solidOrc = (tx, ty) => solidWalk(tx, ty) || barricadeAt(tx, ty);
const solidKnock = (tx, ty) => { const t = tAt(tx, ty); return t === TW || t === TO || t === TD || barricadeAt(tx, ty); };
const solidFly = (tx, ty) => { const t = tAt(tx, ty); return t === TW || t === TO; };
const solidShot = (tx, ty) => { const t = tAt(tx, ty); return t === TW || t === TO; };
function blockedAt(x, y, r, solid) {
  const x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r) / T), y0 = Math.floor((y - r) / T), y1 = Math.floor((y + r) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) {
    const cx = clamp(x, tx * T, tx * T + T), cy = clamp(y, ty * T, ty * T + T);
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}
function moveCircle(o, dx, dy, r, solid) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (r * 0.7)));
  let hit = false;
  for (let s = 0; s < n; s++) {
    const nx = o.x + dx / n; if (!blockedAt(nx, o.y, r, solid)) o.x = nx; else hit = true;
    const ny = o.y + dy / n; if (!blockedAt(o.x, ny, r, solid)) o.y = ny; else hit = true;
  }
  return hit;
}
function los(ax, ay, bx, by, solid = solidShot) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / (T / 3));
  for (let i = 1; i < n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; if (solid(Math.floor(x / T), Math.floor(y / T))) return false; }
  return true;
}

/* ---------- flow fields (Dijkstra from rift tiles) ---------- */
function computeFlow(fly) {
  const m = G.map, N = m.w * m.h, d = new Float64Array(N).fill(1e9);
  const heap = []; const push = (c, i) => { heap.push([c, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let s = k; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; k = s; } } return top; };
  const ok = (x, y) => { const t = tAt(x, y); return fly ? (t !== TW && t !== TO) : t === TF; };
  for (const r of m.rifts) { d[tIdx(r.x, r.y)] = 0; push(0, tIdx(r.x, r.y)); }
  while (heap.length) {
    const [c, i] = pop(); if (c > d[i]) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!ok(nx, ny)) continue;
      if (dx && dy && (!ok(x + dx, y) || !ok(x, y + dy))) continue;
      const ni = tIdx(nx, ny);
      const step = (dx && dy ? 1.414 : 1) + (!fly && barricadeAt(nx, ny) ? 30 : 0) + (!fly && dx && dy && (barricadeAt(x + dx, y) || barricadeAt(x, y + dy)) ? 30 : 0);
      if (c + step < d[ni]) { d[ni] = c + step; push(c + step, ni); }
    }
  }
  return d;
}
function refreshFlow() { G.flow = computeFlow(false); G.flowF = computeFlow(true); }
// best next tile center toward rift
function nextStep(e, fly) {
  const d = fly ? G.flowF : G.flow, m = G.map;
  const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
  const here = d[tIdx(clamp(tx, 0, m.w - 1), clamp(ty, 0, m.h - 1))];
  let best = here, bx = tx, by = ty;
  const ok = (x, y) => fly ? !solidFly(x, y) : tAt(x, y) === TF;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue; const nx = tx + dx, ny = ty + dy; if (!ok(nx, ny)) continue;
    if (dx && dy && (!ok(tx + dx, ty) || !ok(tx, ty + dy))) continue;
    const v = d[tIdx(nx, ny)]; if (v < best - 0.01) { best = v; bx = nx; by = ny; }
  }
  if (here >= 1e8) { // off-field (knocked somewhere odd): head to rift directly
    const r = m.rifts[0]; return {x: tc(r.x), y: tc(r.y), tx: r.x, ty: r.y, here};
  }
  return {x: tc(bx), y: tc(by), tx: bx, ty: by, here};
}

/* ---------- world creation ---------- */
function newWorld(li, nPlayers) {
  const L = LEVELS[li];
  G = {li, map: buildMap(L.id), phase: 'build', wave: 0, nWaves: L.waves.length, waveT: 0, spawnQ: [],
    gold: Math.round(L.gold * (nPlayers > 1 ? B.coopGold : 1)), rift: B.riftHP, riftMax: B.riftHP,
    enemies: [], projs: [], traps: [], drops: [], ev: [], evId: 1, time: 0, nid: 1, trapsV: 1,
    hpMul: L.hp * (nPlayers > 1 ? B.coopHp : 1), coop: nPlayers > 1, endT: 0, result: null,
    stats: {kills: 0, trapKills: 0, falls: 0, leaks: 0, gold: 0, built: 0}};
  G.trapAt = new Int32Array(G.map.w * G.map.h).fill(-1);
  refreshFlow();
  return G;
}
function spawnPoint() { const s = G.map.spawn; return {x: tc(s.x), y: tc(s.y)}; }

/* ---------- events (host → everyone) ---------- */
function ev(k, o = {}) {
  o.k = k; o.id = G.evId++; o.tt = G.time;
  if (IS_HOST) { G.ev.push(o); playEv(o); }
}

/* ---------- players ---------- */
function mkPlayer(i, hero, name, lv) {
  const H = HEROES[hero], s = spawnPoint();
  return {i, hero, name: name || H.name, x: s.x + (i ? 20 : -20), y: s.y, aim: -Math.PI / 2, hp: H.hp, mhp: H.hp, mp: H.mp, mmp: H.mp,
    dead: false, rt: 0, inv: 0, slot: 0, rot: 0, fireT: 0, cdAlt: 0, cdSkill: 0, cdDash: 0, dash: 0, dvx: 0, dvy: 0,
    anim: 'idle', at: 0, cast: 0, mvx: 0, mvy: 0, ready: false, up: (lv && lv.up) || 0, trapLv: (lv && lv.traps) || {}, warp: 0, hurtT: 0, firing: false, seen: performance.now()};
}
function hurtPlayer(p, dmg, src) {
  if (!p || p.dead || p.inv > 0 || G.phase === 'won' || G.phase === 'lost') return;
  p.hp -= dmg; p.hurtT = 0.25;
  ev('phit', {p: p.i, d: Math.round(dmg)});
  if (p.hp <= 0) { p.hp = 0; p.dead = true; p.rt = B.respawn; ev('pdie', {p: p.i, x: Math.round(p.x), y: Math.round(p.y)}); }
}
function heroDmgMul(p) { return 1 + B.heroUpDmg * (p.up || 0); }

/* ---------- enemies ---------- */
const ATK_DUR = {}; // seconds of attack anim per type
function atkDur(type) { if (!ATK_DUR[type]) { const a = ATLAS.units[type].anims.attack; ATK_DUR[type] = (a ? a[1] : 6) / B.animFps; } return ATK_DUR[type]; }
function spawnOrc(type, x, y) {
  const D = ORCS[type];
  const e = {id: G.nid++, type, x, y, vx: 0, vy: 0, hp: D.hp * G.hpMul, mhp: D.hp * G.hpMul, dir: 2, anim: 'walk', at: Math.random(),
    act: null, atkCd: rnd(0.4), slowF: 1, burn: 0, burnDps: 0, frz: 0, charm: 0, charmBy: -1, air: 0, z: D.fly ? 1 : 0, fall: 0, dead: 0, flash: 0,
    chase: 0, chaseCd: 0, ox: rnd(-10, 10), oy: rnd(-10, 10), lastX: x, lastY: y, stuckT: 0, hpShow: 0, stun: 0};
  G.enemies.push(e); return e;
}
const enemyById = id => G.enemies.find(e => e.id === id);
const alive = e => !e.dead && !e.fall;
function hurtEnemy(e, dmg, src, dot) {
  if (!alive(e)) return;
  if (e.charm > 0 && src && src.trap) return;
  e.hp -= dmg; e.hpShow = 2.5;
  if (!dot) { e.flash = 0.12; if (IS_HOST && dmg >= 1) ev('hit', {x: Math.round(e.x), y: Math.round(e.y - 20), d: Math.round(dmg), b: ORCS[e.type].mass >= 4 ? 1 : 0, c: src && src.p != null ? src.p : -1}); }
  if (e.hp <= 0) killEnemy(e, src);
}
function reward(e, src) {
  const D = ORCS[e.type]; G.gold += D.gold; G.stats.gold += D.gold; G.stats.kills++;
  if (src && src.trap) G.stats.trapKills++;
  ev('gold', {x: Math.round(e.x), y: Math.round(e.y - 34), v: D.gold});
  if (Math.random() < B.potionChance * (D.mass >= 4 ? 4 : 1)) G.drops.push({id: G.nid++, k: Math.random() < 0.6 ? 'hp' : 'mp', x: e.x, y: e.y, t: 0});
}
function killEnemy(e, src) {
  e.dead = 0.001; e.hp = 0; e.act = null;
  reward(e, src);
  ev('die', {x: Math.round(e.x), y: Math.round(e.y), t: ORC_KEYS.indexOf(e.type), d: e.dir});
}
function startFall(e) {
  if (!alive(e)) return;
  const lava = tAt(Math.floor(e.x / T), Math.floor(e.y / T)) === TL;
  e.fall = 0.001; e.act = null; G.stats.falls++;
  reward(e, {trap: 'fall'});
  ev('fall', {x: Math.round(e.x), y: Math.round(e.y), lava: lava ? 1 : 0});
}
function launch(e, ax, ay, speed, air) {
  const m = ORCS[e.type].mass; const s = speed / Math.sqrt(Math.max(0.6, m));
  e.vx = ax * s; e.vy = ay * s; e.act = null;
  if (air) { e.air = air; e.airMax = air; }
}
function pushImpulse(e, ax, ay, imp) { const m = ORCS[e.type].mass; e.vx += ax * imp / m; e.vy += ay * imp / m; e.act = null; e.stun = Math.max(e.stun, 0.25); }
function enemiesOnTile(tx, ty, fly) {
  const out = [];
  for (const e of G.enemies) { if (!alive(e) || e.air > 0 || e.charm > 0) continue; if (!fly && ORCS[e.type].fly) continue; if (Math.floor(e.x / T) === tx && Math.floor(e.y / T) === ty) out.push(e); }
  return out;
}
function enemiesInRect(tx0, ty0, tx1, ty1, fly) {
  const out = [];
  for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; if (!fly && ORCS[e.type].fly) continue; const x = Math.floor(e.x / T), y = Math.floor(e.y / T); if (x >= tx0 && x <= tx1 && y >= ty0 && y <= ty1) out.push(e); }
  return out;
}
function nearestPlayer(e, maxD, needLos) {
  let best = null, bd = maxD * maxD;
  for (const p of P) { if (!p || p.dead) continue; const d = dist2(e.x, e.y, p.x, p.y); if (d < bd && (!needLos || los(e.x, e.y, p.x, p.y))) { bd = d; best = p; } }
  return best;
}
const crad = D => Math.min(D.r * 0.75, 14);
function steer(e, tx, ty, spd, dt) {
  const D = ORCS[e.type]; const dx = tx - e.x, dy = ty - e.y, L = Math.hypot(dx, dy) || 1;
  const step = Math.min(spd * dt, L);
  moveCircle(e, dx / L * step, dy / L * step, crad(D), D.fly ? solidFly : solidOrc);
  e.dir = dirOf(Math.atan2(dy, dx)); e.anim = 'walk';
}
function beginAttack(e, tgt) {
  e.act = {t: 0, tgt, hit: false}; e.anim = 'attack'; e.at = 0;
  const p = tgtPos(tgt); if (p) e.dir = dirOf(Math.atan2(p.y - e.y, p.x - e.x));
}
function tgtPos(t) {
  if (!t) return null;
  if (t.k === 'p') { const p = P[t.i]; return p && !p.dead ? p : null; }
  if (t.k === 'e') { const o = enemyById(t.id); return o && alive(o) ? o : null; }
  if (t.k === 't') { const tr = trapById(t.id); return tr ? {x: tc(tr.tx), y: tc(tr.ty)} : null; }
  return null;
}
function resolveHit(e) {
  const D = ORCS[e.type], t = e.act.tgt, p = tgtPos(t); if (!p) return;
  const reach = D.range + (t.k === 'p' ? 14 : t.k === 't' ? 26 : ORCS[p.type].r) + 22;
  if (D.ranged) {
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    G.projs.push({id: G.nid++, k: 'arrow', x: e.x + Math.cos(a) * 16, y: e.y - 18 + Math.sin(a) * 16, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: 1.2, dmg: D.dmg, team: 'e', own: e.id, r: 5, hit: []});
    ev('shoot', {x: Math.round(e.x), y: Math.round(e.y)});
    return;
  }
  if (D.boss || D.smash >= 5) { // ground slam AoE in front
    const a = Math.atan2(p.y - e.y, p.x - e.x), sx = e.x + Math.cos(a) * 46, sy = e.y + Math.sin(a) * 46;
    ev('slam', {x: Math.round(sx), y: Math.round(sy)});
    for (const q of P) if (q && !q.dead && dist2(q.x, q.y, sx, sy) < 95 * 95) { hurtPlayer(q, D.dmg, e); if (q.i === MEI || IS_HOST) knockPlayer(q, Math.atan2(q.y - sy, q.x - sx), 340); }
    if (t.k === 't') hurtTrap(trapById(t.id), D.dmg * D.smash);
    if (t.k === 'e') { const o = enemyById(t.id); if (o) hurtEnemy(o, D.dmg, {e: e.id}); }
    return;
  }
  if (dist2(e.x, e.y, p.x, p.y) > reach * reach) return;
  if (t.k === 'p') hurtPlayer(P[t.i], D.dmg, e);
  else if (t.k === 't') { hurtTrap(trapById(t.id), D.dmg * (D.smash || 1)); ev('barHit', {x: Math.round(p.x), y: Math.round(p.y)}); }
  else if (t.k === 'e') hurtEnemy(enemyById(t.id), D.dmg * 1.5, {e: e.id});
}
function knockPlayer(p, a, s) { if (p.i === MEI) { p.kbx = Math.cos(a) * s; p.kby = Math.sin(a) * s; p.kbT = 0.22; } else { p.kbSeq = (p.kbSeq || 0) + 1; p.kbA = a; p.kbS = s; } }
function updEnemy(e, dt) {
  const D = ORCS[e.type];
  e.flash = Math.max(0, e.flash - dt); e.hpShow = Math.max(0, e.hpShow - dt);
  if (e.dead) { e.dead += dt; return; }
  if (e.fall) { e.fall += dt; e.x += e.vx * dt * 0.3; e.y += e.vy * dt * 0.3; return; }
  e.at += dt;
  if (e.burn > 0) { e.burn -= dt; hurtEnemy(e, e.burnDps * dt, {trap: 'brim', p: e.burnBy}, true); if (!alive(e)) return; }
  // airborne (spring)
  if (e.air > 0) {
    e.air -= dt;
    moveCircle(e, e.vx * dt, e.vy * dt, crad(D), solidFly);
    e.z = Math.sin(Math.PI * (1 - e.air / e.airMax)) * 0.9;
    if (e.air <= 0) { e.air = 0; e.z = D.fly ? 1 : 0; e.vx *= 0.2; e.vy *= 0.2; e.stun = 0.35; const t = tAt(Math.floor(e.x / T), Math.floor(e.y / T)); if (!D.fly && (t === TP || t === TL)) startFall(e); }
    return;
  }
  // knockback slide
  if (Math.abs(e.vx) + Math.abs(e.vy) > 8) {
    moveCircle(e, e.vx * dt, e.vy * dt, crad(D), D.fly ? solidFly : solidKnock);
    const f = Math.exp(-7 * dt); e.vx *= f; e.vy *= f;
    if (!D.fly) { const t = tAt(Math.floor(e.x / T), Math.floor(e.y / T)); if (t === TP || t === TL) { startFall(e); return; } }
  } else { e.vx = e.vy = 0; }
  if (e.frz > 0) { e.frz -= dt; e.act = null; e.anim = 'idle'; return; }
  if (e.stun > 0) { e.stun -= dt; e.anim = 'idle'; return; }
  if (e.charm > 0) { e.charm -= dt; if (e.charm <= 0) ev('uncharm', {id: e.id}); }
  e.atkCd -= dt; e.chaseCd -= dt;
  const spd = D.speed * e.slowF; e.slowF = 1;
  // attacking
  if (e.act) {
    e.act.t += dt; const dur = atkDur(e.type) / Math.max(0.5, Math.min(1, spd / D.speed + 0.3));
    const p = tgtPos(e.act.tgt); if (p) e.dir = dirOf(Math.atan2(p.y - e.y, p.x - e.x));
    if (!e.act.hit && e.act.t >= dur * D.atk) { e.act.hit = true; resolveHit(e); }
    if (e.act.t >= dur) { e.act = null; e.atkCd = D.cd; e.anim = 'walk'; }
    return;
  }
  const canAtk = e.atkCd <= 0;
  const inReach = (o, extra) => dist2(e.x, e.y, o.x, o.y) < Math.pow(D.range + extra, 2);
  // charmed: hunt other orcs
  if (e.charm > 0) {
    let best = null, bd = 320 * 320;
    for (const o of G.enemies) { if (o === e || !alive(o) || o.charm > 0 || o.air > 0) continue; if (ORCS[o.type].fly && !D.fly && !D.ranged) continue; const d = dist2(e.x, e.y, o.x, o.y); if (d < bd) { bd = d; best = o; } }
    if (best) { if (inReach(best, ORCS[best.type].r + D.r * 0.5)) { if (canAtk) beginAttack(e, {k: 'e', id: best.id}); else e.anim = 'idle'; } else steer(e, best.x, best.y, spd, dt); }
    else e.anim = 'idle';
    return;
  }
  // hostile to charmed orcs nearby
  for (const o of G.enemies) {
    if (o.charm > 0 && alive(o) && inReach(o, ORCS[o.type].r + D.r * 0.5)) { if (canAtk) { beginAttack(e, {k: 'e', id: o.id}); return; } }
  }
  // players
  if (!D.sneaky && D.aggro > 0) {
    const pl = nearestPlayer(e, D.aggro, true);
    if (pl) {
      if (D.ranged) {
        if (canAtk) { beginAttack(e, {k: 'p', i: pl.i}); return; }
      } else if (inReach(pl, 14 + D.r * 0.3)) {
        if (canAtk) { beginAttack(e, {k: 'p', i: pl.i}); return; }
        e.anim = 'idle'; e.dir = dirOf(Math.atan2(pl.y - e.y, pl.x - e.x)); return;
      } else if (e.chaseCd <= 0) {
        e.chase += dt; if (e.chase > B.chaseTime) { e.chase = 0; e.chaseCd = B.chaseCool; }
        steer(e, pl.x, pl.y, spd, dt); sepFix(e); return;
      }
    } else e.chase = Math.max(0, e.chase - dt);
  }
  // follow the flow field
  const st = nextStep(e, D.fly);
  if (st.here <= 0.5 || (G.map.rifts.some(r => dist2(e.x, e.y, tc(r.x), tc(r.y)) < 30 * 30))) { leak(e); return; }
  if (!D.fly && barricadeAt(st.tx, st.ty)) {
    const id = G.trapAt[tIdx(st.tx, st.ty)];
    if (dist2(e.x, e.y, tc(st.tx), tc(st.ty)) < Math.pow(T * 0.5 + D.r + 16, 2)) { if (canAtk) beginAttack(e, {k: 't', id}); else e.anim = 'idle'; return; }
  }
  steer(e, st.x + e.ox * 0.6, st.y + e.oy * 0.6, spd, dt);
  // stuck detection
  if (dist2(e.x, e.y, e.lastX, e.lastY) < 0.25 * dt * dt * spd * spd) { e.stuckT += dt; if (e.stuckT > 0.8) { e.ox = 0; e.oy = 0; const cx = tc(Math.floor(e.x / T)), cy = tc(Math.floor(e.y / T)); moveCircle(e, (cx - e.x) * 0.5, (cy - e.y) * 0.5, crad(D), D.fly ? solidFly : solidOrc); e.stuckT = 0; } } else e.stuckT = 0;
  e.lastX = e.x; e.lastY = e.y;
}
function sepFix(e) { e.lastX = e.x; e.lastY = e.y; }
function leak(e) {
  const D = ORCS[e.type];
  G.rift = Math.max(0, G.rift - D.rift); G.stats.leaks += D.rift;
  e.dead = 0.6; e.leaked = 1;
  ev('rift', {x: Math.round(e.x), y: Math.round(e.y), v: D.rift});
  if (G.rift <= 0 && G.phase === 'wave') endLevel(false);
}
function separate() {
  const es = G.enemies; const n = es.length;
  for (let i = 0; i < n; i++) {
    const a = es[i]; if (!alive(a) || a.air > 0) continue; const ra = ORCS[a.type].r, fa = !!ORCS[a.type].fly;
    for (let j = i + 1; j < n; j++) {
      const b = es[j]; if (!alive(b) || b.air > 0 || fa !== !!ORCS[b.type].fly) continue;
      const rb = ORCS[b.type].r, dx = b.x - a.x, dy = b.y - a.y, rr = (ra + rb) * 0.85, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.01) {
        const d = Math.sqrt(d2), push = (rr - d) * 0.5, ux = dx / d, uy = dy / d;
        const ma = ORCS[a.type].mass, mb = ORCS[b.type].mass, wa = mb / (ma + mb), wb = ma / (ma + mb);
        const ax = a.x - ux * push * wa * 2, ay = a.y - uy * push * wa * 2, bx = b.x + ux * push * wb * 2, by = b.y + uy * push * wb * 2;
        const sa = fa ? solidFly : solidOrc;
        if (!blockedAt(ax, ay, crad(ORCS[a.type]), sa)) { a.x = ax; a.y = ay; }
        if (!blockedAt(bx, by, crad(ORCS[b.type]), sa)) { b.x = bx; b.y = by; }
      }
    }
  }
}

/* ---------- traps ---------- */
const trapById = id => G.traps.find(t => t.id === id);
function wallFacing(tx, ty, px, py) {
  let best = -1, bd = -1e9;
  for (let r = 0; r < 4; r++) {
    const [dx, dy] = DIRV[r]; if (tAt(tx + dx, ty + dy) !== TF) continue;
    const s = dx * (px - tc(tx)) + dy * (py - tc(ty));
    if (s > bd) { bd = s; best = r; }
  }
  return best;
}
function canPlace(k, tx, ty, p) {
  const D = TRAPS[k]; if (!D) return '无效';
  if (tx < 0 || ty < 0 || tx >= G.map.w || ty >= G.map.h) return '无效位置';
  if (G.trapAt[tIdx(tx, ty)] >= 0) return '已有陷阱';
  const t = tAt(tx, ty);
  if (D.place === 'floor') { if (t !== TF || isSpecialTile(tx, ty)) return '只能放在地面'; if (D.tall && enemiesOnTile(tx, ty, false).length) return '有敌人'; }
  else { if (t !== TW) return '只能装在墙上'; if (wallFacing(tx, ty, p.x, p.y) < 0) return '墙面前方没有通路'; }
  if (dist2(p.x, p.y, tc(tx), tc(ty)) > B.placeRange * B.placeRange) return '太远了';
  if (G.gold < D.cost) return '金币不足';
  return '';
}
function placeTrap(p, k, tx, ty, rot) {
  const why = canPlace(k, tx, ty, p); if (why) return why;
  const D = TRAPS[k], lv = clamp((p.trapLv[k] || 1) - 1, 0, 2);
  G.gold -= D.cost; G.stats.built++;
  const tr = {id: G.nid++, k, tx, ty, rot: D.place === 'wall' ? wallFacing(tx, ty, p.x, p.y) : (D.dir ? (rot | 0) & 3 : 0), lv, cd: 0, anim: 0, fuse: 0, spent: D.cost, own: p.i};
  if (k === 'barricade') { tr.hp = tr.mhp = D.hp[lv]; }
  G.traps.push(tr); G.trapAt[tIdx(tx, ty)] = tr.id; G.trapsV++;
  if (k === 'barricade') refreshFlow();
  ev('place', {x: tc(tx), y: tc(ty), p: p.i});
  return '';
}
function removeTrap(tr) {
  G.traps = G.traps.filter(t => t !== tr); G.trapAt[tIdx(tr.tx, tr.ty)] = -1; G.trapsV++;
  if (tr.k === 'barricade') refreshFlow();
}
function sellTrap(p, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= G.map.w || ty >= G.map.h) return '无效';
  const id = G.trapAt[tIdx(tx, ty)]; if (id < 0) return '这里没有陷阱';
  const tr = trapById(id); if (!tr) return '无效';
  let v = Math.round(tr.spent * (G.phase === 'wave' ? B.sellWave : B.sellBuild));
  if (tr.k === 'barricade') v = Math.round(v * tr.hp / tr.mhp);
  G.gold += v; removeTrap(tr);
  ev('sell', {x: tc(tx), y: tc(ty), v});
  return '';
}
function hurtTrap(tr, dmg) {
  if (!tr || tr.k !== 'barricade') return;
  tr.hp -= dmg; if (tr.hp <= 0) { removeTrap(tr); ev('barBreak', {x: tc(tr.tx), y: tc(tr.ty)}); }
}
function updTraps(dt) {
  for (const tr of G.traps.slice()) {
    const D = TRAPS[tr.k], lv = tr.lv; tr.cd = Math.max(0, tr.cd - dt); tr.anim = Math.max(0, tr.anim - dt);
    const cx = tc(tr.tx), cy = tc(tr.ty);
    switch (tr.k) {
      case 'spikes': if (tr.cd <= 0) { const vs = enemiesOnTile(tr.tx, tr.ty, false); if (vs.length) { tr.cd = D.cd[lv]; tr.anim = 0.45; ev('trap', {i: tr.id, s: 'spike', x: cx, y: cy}); for (const e of vs) hurtEnemy(e, D.dmg[lv], {trap: 'spikes'}); } } break;
      case 'tar': for (const e of enemiesOnTile(tr.tx, tr.ty, false)) e.slowF = Math.min(e.slowF, 1 - D.slow[lv]); break;
      case 'spring': if (tr.cd <= 0) { const vs = enemiesOnTile(tr.tx, tr.ty, false); if (vs.length) { tr.cd = D.cd[lv]; tr.anim = 0.5; const [dx, dy] = DIRV[tr.rot]; ev('trap', {i: tr.id, s: 'spring', x: cx, y: cy}); for (const e of vs) { hurtEnemy(e, 8, {trap: 'spring'}); if (alive(e)) launch(e, dx, dy, D.push[lv], 0.6); } } } break;
      case 'brim':
        if (tr.fuse > 0) { tr.fuse -= dt; if (tr.fuse <= 0) { tr.anim = 1.1; ev('trap', {i: tr.id, s: 'brim', x: cx, y: cy}); for (const e of enemiesInRect(tr.tx - 1, tr.ty - 1, tr.tx + 1, tr.ty + 1, false)) { hurtEnemy(e, D.dmg[lv], {trap: 'brim'}); e.burn = 3; e.burnDps = D.burn[lv]; } } }
        else if (tr.cd <= 0 && enemiesOnTile(tr.tx, tr.ty, false).length) { tr.fuse = 0.3; tr.cd = D.cd[lv]; tr.anim = 0.3; }
        break;
      case 'frost': if (tr.cd <= 0 && enemiesOnTile(tr.tx, tr.ty, true).length) { tr.cd = D.cd[lv]; tr.anim = 0.9; ev('trap', {i: tr.id, s: 'frost', x: cx, y: cy}); for (const e of enemiesInRect(tr.tx - 1, tr.ty - 1, tr.tx + 1, tr.ty + 1, true)) { e.frz = Math.max(e.frz, D.freeze[lv] * (ORCS[e.type].boss ? 0.4 : 1)); e.act = null; } } break;
      case 'arrow': {
        if (tr.cd > 0) break; const [dx, dy] = DIRV[tr.rot]; let found = false, len = 0;
        for (let k = 1; k <= D.range; k++) { const x = tr.tx + dx * k, y = tr.ty + dy * k; if (solidShot(x, y)) break; len = k; }
        const x0 = tc(tr.tx) + dx * T / 2, y0 = tc(tr.ty) + dy * T / 2;
        for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const rx = e.x - x0, ry = e.y - y0; const along = rx * dx + ry * dy, lat = Math.abs(rx * dy - ry * dx); if (along > 0 && along < len * T && lat < T * 0.6) { found = true; break; } }
        if (found) { tr.cd = D.cd[lv]; tr.anim = 0.2; ev('trap', {i: tr.id, s: 'arrow', x: x0, y: y0});
          for (const off of [-11, 11]) G.projs.push({id: G.nid++, k: 'tarrow', x: x0 + dy * off, y: y0 + dx * off, vx: dx * 780, vy: dy * 780, life: len * T / 780 + 0.02, dmg: D.dmg[lv] / 2, team: 't', r: 6, pierce: 1, hit: []}); }
        break; }
      case 'grinder': {
        const [dx, dy] = DIRV[tr.rot]; const vs = enemiesOnTile(tr.tx + dx, tr.ty + dy, false);
        if (vs.length) { tr.anim = 0.35; for (const e of vs) { hurtEnemy(e, D.dps[lv] * dt, {trap: 'grinder'}, true); if (Math.random() < dt * 8) { e.flash = 0.08; ev('grind', {x: Math.round(e.x), y: Math.round(e.y)}); } } }
        break; }
    }
  }
}

/* ---------- projectiles ---------- */
function updProjs(dt) {
  for (const q of G.projs) {
    if (q.k === 'orb') { // gentle homing
      let best = null, bd = 150 * 150;
      for (const e of G.enemies) { if (!alive(e) || e.charm > 0 || q.hit.includes(e.id)) continue; const d = dist2(q.x, q.y, e.x, e.y - 14); if (d < bd && (e.x - q.x) * q.vx + (e.y - q.y) * q.vy > 0) { bd = d; best = e; } }
      if (best) { const sp = Math.hypot(q.vx, q.vy), a = Math.atan2(q.vy, q.vx), b = Math.atan2(best.y - 14 - q.y, best.x - q.x); const na = a + clamp(angDiff(a, b), -5 * dt, 5 * dt); q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp; }
    }
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (solidShot(Math.floor(q.x / T), Math.floor((q.y + (q.k === 'tarrow' ? 0 : 14)) / T))) { if (q.k === 'fireball') explode(q); q.life = -1; continue; }
    if (q.team === 'e') {
      for (const p of P) if (p && !p.dead && dist2(q.x, q.y + 14, p.x, p.y - 4) < Math.pow(q.r + 15, 2)) { hurtPlayer(p, q.dmg); q.life = -1; break; }
      continue;
    }
    for (const e of G.enemies) {
      if (!alive(e) || q.hit.includes(e.id) || (e.charm > 0 && q.team !== 'x')) continue;
      const D = ORCS[e.type]; const ey = e.y - (D.fly ? 40 : D.r);
      if (dist2(q.x, q.y, e.x, ey) < Math.pow(q.r + D.r + 4, 2)) {
        if (q.k === 'fireball') { explode(q); q.life = -1; break; }
        q.hit.push(e.id);
        hurtEnemy(e, q.dmg, q.team === 't' ? {trap: 'arrow'} : {p: q.own});
        if (q.k === 'bolt' && alive(e)) pushImpulse(e, q.vx / 980, q.vy / 980, 22);
        if (!(q.pierce > 0)) { q.life = -1; break; } q.pierce--;
      }
    }
    if (q.life <= 0 && q.k === 'fireball' && !q.done) explode(q);
  }
  G.projs = G.projs.filter(q => q.life > 0);
}
function explode(q) {
  if (q.done) return; q.done = true;
  const S = HEROES.warmage.skill, p = P[q.own]; const mul = p ? heroDmgMul(p) : 1;
  ev('boom', {x: Math.round(q.x), y: Math.round(q.y)});
  for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const d = Math.hypot(e.x - q.x, e.y - 14 - q.y); if (d < S.r + ORCS[e.type].r) { hurtEnemy(e, S.dmg * mul * (1 - 0.4 * d / S.r), {p: q.own}); if (alive(e)) { e.burn = 3; e.burnDps = S.burn * mul; e.burnBy = q.own; const a = Math.atan2(e.y - q.y, e.x - q.x); pushImpulse(e, Math.cos(a), Math.sin(a), 160); } } }
}

/* ---------- hero actions (executed on host) ---------- */
function doAction(p, m) {
  if (!p || p.dead || !G || G.phase === 'won' || G.phase === 'lost') return '';
  const H = HEROES[p.hero];
  switch (m.t) {
    case 'fire': {
      const a = +m.a || 0, Pr = H.primary, ox = Math.cos(a) * 22, oy = Math.sin(a) * 22 - 26;
      G.projs.push({id: G.nid++, k: Pr.kind, x: p.x + ox, y: p.y + oy, vx: Math.cos(a) * Pr.speed, vy: Math.sin(a) * Pr.speed, life: Pr.life, dmg: Pr.dmg * heroDmgMul(p), team: 'p', own: p.i, r: Pr.kind === 'orb' ? 8 : 6, pierce: Pr.pierce || 0, hit: []});
      if (p.i !== MEI) ev('pfire', {p: p.i});
      return '';
    }
    case 'alt': {
      const A = H.alt; if (p.mp < A.mp - 1) return 'mp'; p.mp = Math.max(0, p.mp - A.mp);
      if (p.hero === 'warmage') {
        const a = +m.a || 0; ev('blast', {x: Math.round(p.x), y: Math.round(p.y), a: +a.toFixed(2), p: p.i});
        for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > A.r + ORCS[e.type].r) continue; if (Math.abs(angDiff(a, Math.atan2(dy, dx))) > A.arc && d > 30) continue; hurtEnemy(e, A.dmg * heroDmgMul(p), {p: p.i}); if (alive(e)) { const ea = Math.atan2(dy, dx); e.vx = 0; e.vy = 0; pushImpulse(e, Math.cos(ea * 0.5 + a * 0.5), Math.sin(ea * 0.5 + a * 0.5), A.push); } }
      } else {
        let best = null, bd = 95 * 95; const tx = +m.x, ty = +m.y;
        for (const e of G.enemies) { if (!alive(e) || e.charm > 0 || ORCS[e.type].boss) continue; const d = dist2(e.x, e.y - 16, tx, ty); if (d < bd && dist2(e.x, e.y, p.x, p.y) < 560 * 560) { bd = d; best = e; } }
        if (!best) { // fallback: nearest along aim
          let sc = 1e9; const a = +m.a || 0;
          for (const e of G.enemies) { if (!alive(e) || e.charm > 0 || ORCS[e.type].boss) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > 480) continue; const da = Math.abs(angDiff(a, Math.atan2(dy, dx))); if (da > 0.5) continue; const s = d * (1 + da * 2); if (s < sc) { sc = s; best = e; } }
        }
        if (!best) { p.mp += A.mp; return 'none'; }
        best.charm = A.dur * (ORCS[best.type].mass >= 4 ? 0.6 : 1); best.charmBy = p.i; best.act = null; best.frz = 0;
        ev('charm', {id: best.id, x: Math.round(best.x), y: Math.round(best.y), p: p.i});
      }
      return '';
    }
    case 'skill': {
      const S = H.skill; if (p.mp < S.mp - 1) return 'mp'; p.mp = Math.max(0, p.mp - S.mp);
      if (p.hero === 'warmage') {
        const a = +m.a || 0, d = clamp(Math.hypot(+m.x - p.x, +m.y - p.y), 60, 640);
        G.projs.push({id: G.nid++, k: 'fireball', x: p.x + Math.cos(a) * 20, y: p.y - 26 + Math.sin(a) * 20, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, life: d / 640, dmg: 0, team: 'p', own: p.i, r: 12, hit: []});
        ev('fbcast', {p: p.i, x: Math.round(p.x), y: Math.round(p.y)});
      } else {
        ev('nova', {x: Math.round(p.x), y: Math.round(p.y), p: p.i});
        for (const e of G.enemies) { if (!alive(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d > S.r + ORCS[e.type].r || e.charm > 0) continue; hurtEnemy(e, S.dmg * heroDmgMul(p), {p: p.i}); if (alive(e)) { e.frz = Math.max(e.frz, S.freeze * (ORCS[e.type].boss ? 0.4 : 1)); e.act = null; } }
      }
      return '';
    }
    case 'dash': p.inv = Math.max(p.inv, 0.3); ev('dash', {p: p.i, x: Math.round(+m.x || p.x), y: Math.round(+m.y || p.y), h: p.hero === 'sorc' ? 1 : 0}); return '';
    case 'place': return placeTrap(p, m.k, m.tx | 0, m.ty | 0, m.r | 0);
    case 'sell': return sellTrap(p, m.tx | 0, m.ty | 0);
    case 'ready': if (G.phase === 'build') { p.ready = !!m.v; ev('ready', {p: p.i, v: p.ready ? 1 : 0}); checkReady(); } return '';
  }
  return '';
}
function checkReady() {
  const ps = P.filter(Boolean);
  if (G.phase === 'build' && ps.length && ps.every(p => p.ready)) startWave();
}
function startWave() {
  const W = LEVELS[G.li].waves[G.wave]; if (!W) return;
  G.phase = 'wave'; G.waveT = 0; G.spawnQ = [];
  for (const [g, type, n, delay, gap] of W) for (let k = 0; k < n; k++) G.spawnQ.push({t: delay + k * gap + rnd(0, 0.25), g: Math.min(g, G.map.gates.length - 1), type});
  G.spawnQ.sort((a, b) => a.t - b.t);
  for (const p of P) if (p) p.ready = false;
  ev('wave', {w: G.wave});
}
function endWave() {
  const bonus = B.waveBonus[0] + B.waveBonus[1] * G.wave;
  G.wave++;
  if (G.wave >= G.nWaves) { endLevel(true); return; }
  G.phase = 'build'; G.gold += bonus; G.stats.gold += bonus;
  ev('waveEnd', {w: G.wave, b: bonus});
}
function skullsFor(won) { if (!won) return 0; const f = G.rift / G.riftMax; return f >= 1 ? 5 : f >= 0.8 ? 4 : f >= 0.55 ? 3 : f >= 0.3 ? 2 : 1; }
function endLevel(won) {
  if (G.phase === 'won' || G.phase === 'lost') return;
  G.phase = won ? 'won' : 'lost'; G.endT = 0; G.result = {won, skulls: skullsFor(won)};
  ev('end', {won: won ? 1 : 0, s: G.result.skulls});
}

/* ---------- host world tick ---------- */
function updWorld(dt) {
  G.time += dt;
  if (G.phase === 'wave') {
    G.waveT += dt;
    while (G.spawnQ.length && G.spawnQ[0].t <= G.waveT) {
      const s = G.spawnQ.shift(), gt = G.map.gates[s.g];
      const e = spawnOrc(s.type, tc(gt.x) + rnd(-10, 10), tc(gt.y) + rnd(-10, 10));
      if (ORCS[s.type].boss) ev('boss', {id: e.id});
    }
    if (!G.spawnQ.length && !G.enemies.some(e => alive(e))) endWave();
  } else if (G.phase === 'won' || G.phase === 'lost') G.endT += dt;
  updTraps(dt);
  for (const e of G.enemies) updEnemy(e, dt);
  separate();
  G.enemies = G.enemies.filter(e => !(e.dead > 0.9 || e.fall > 0.9));
  updProjs(dt);
  // drops
  for (const d of G.drops) {
    d.t += dt;
    for (const p of P) if (p && !p.dead && dist2(p.x, p.y, d.x, d.y) < 30 * 30) {
      if (d.k === 'hp') p.hp = Math.min(p.mhp, p.hp + p.mhp * 0.4); else p.mp = Math.min(p.mmp, p.mp + p.mmp * 0.6);
      d.t = 99; ev('potion', {p: p.i, k: d.k === 'hp' ? 0 : 1, x: Math.round(d.x), y: Math.round(d.y)}); break;
    }
  }
  G.drops = G.drops.filter(d => d.t < 30);
  // players: regen / respawn (authoritative for all)
  for (const p of P) {
    if (!p) continue; const H = HEROES[p.hero];
    p.inv = Math.max(0, p.inv - dt);
    if (p.dead) { p.rt -= dt; if (p.rt <= 0) { const s = spawnPoint(); p.dead = false; p.hp = p.mhp; p.mp = p.mmp; p.inv = B.respawnInv; p.x = s.x; p.y = s.y; p.warp++; ev('respawn', {p: p.i}); } continue; }
    p.mp = Math.min(p.mmp, p.mp + H.mpRegen * dt);
    if (G.phase !== 'wave') p.hp = Math.min(p.mhp, p.hp + p.mhp * 0.08 * dt);
  }
  G.ev = G.ev.filter(e => e.tt > G.time - 1.0);
}
