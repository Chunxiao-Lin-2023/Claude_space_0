/* ================= simulation: players, weapons, building, gathering, crafting, day/night ================= */
function mkPlayer(i, name) {
  return {
    i, name, x: 31.5 + i * 2, y: 28.5 + i, L: 0, z: 0, r: 0.28, h: 1.0, vx: 0, vy: 0, kbx: 0, kby: 0, aim: -Math.PI / 2, aimPt: null,
    hp: BAL.pMaxHp, maxHp: BAL.pMaxHp, down: false, downT: 0, dead: false, gone: false,
    wpn: 1, owned: [1, 1, 0, 0], mag: [12, 6, 0, 0], ammo: [0, WPN[1].start, 0, 0], reloadT: 0, reloadW: 0, fireCD: 0, shoveCD: 0, shoveT: 0,
    nades: 1, meds: 1, medT: 0, selfRev: false, useT: 0, useK: '', build: false, sel: 1, demo: false, sdir: 3,
    inp: { mx: 0, my: 0, fire: 0, use: 0 }, kills: 0, hurtT: 0, anim: 0, emptyT: 0, ready: false, recoilT: 0,
  };
}
function newWorld(seed, names, diff) {
  const m = genMap(seed);
  W = {
    seed, t: 0, G: m.G, tt: m.tt, blk: m.blk, bhp: m.bhp, slab: m.slab, shp: m.shp, bdir: m.bdir, stab: new Int8Array(NC), spots: m.spots,
    radio: { x: m.radio.x, y: m.radio.y, hp: BAL.radioHp, max: BAL.radioHp, hitT: 0, alarmT: 0 }, bench: m.bench,
    p: names.map((n, i) => mkPlayer(i, n)), zs: [], proj: [], zid: 1,
    phase: 'day', clock: BAL.dayLen[0], dayLen: BAL.dayLen[0], night: 0, res: Object.assign({}, BAL.startRes), upg: 0, kills: 0,
    spawnQ: [], nightT: 0, strayT: 8, diff, D: BAL.diff[diff] || BAL.diff.normal, rng: mulberry(seed ^ 0x9e3779b9), seq: 0,
    dirty: new Set(), endless: false, over: null, stats: { built: 0, lost: 0 }, navDirty: true, ver: 1,
    ff: { rw: new Float32Array(NC), rc: new Float32Array(NC), pw: new Float32Array(NC), pc: new Float32Array(NC), rT: 0, pT: 0 },
  };
  recomputeStab();
  updateFields(0, true);
  W.edges = edgeSpawns();
  return W;
}
const rand = (a = 0, b = 1) => a + W.rng() * (b - a);
const activeP = () => W.p.filter(p => !p.gone);
const standingP = p => !p.gone && !p.dead && !p.down;
function emit(e) { if (!W) return; e.s = ++W.seq; fxEvent(e); if (NETROLE === 'host') netSendCtl({ t: 'ev', e }); }
function say(text, col) { emit({ k: 'say', text, col: col || '' }); }
const pZ = p => surfZ(p.x, p.y, p.L);

/* ---------- cells ---------- */
function setCell(i, b, s, d, cause) {
  W.blk[i] = b; W.bhp[i] = b ? (B[b].hp || 1) : 0; W.slab[i] = s; W.shp[i] = s ? (B[s].hp || 1) : 0; if (d != null) W.bdir[i] = d;
  W.navDirty = true; W.ver++;
  emit({ k: 'cell', i, b, s, d: W.bdir[i], c: cause || '' });
}
function damageCell(i, dmg, slabToo) {
  const b = W.blk[i];
  if (b && B[b].brk) { W.bhp[i] -= dmg; W.dirty.add(i); if (W.bhp[i] <= 0) return destroyBlk(i); return; }
  if (slabToo && W.slab[i] && B[W.slab[i]].brk) { W.shp[i] -= dmg; W.dirty.add(i); if (W.shp[i] <= 0) { W.stats.lost++; setCell(i, W.blk[i], 0, null, 'brk'); collapseCheck(); } }
}
function destroyBlk(i) {
  W.stats.lost++;
  setCell(i, 0, W.slab[i], null, 'brk');
  collapseCheck();
}
function collapseCheck() {
  recomputeStab();
  for (let pass = 0; pass < 8; pass++) {
    const u = unsupported(); if (!u.length) break;
    for (const i of u) { const water = cl_(i) === 0 && W.tt[cy_(i) * MW + cx_(i)] === TT.water; setCell(i, B[W.blk[i]].nat ? W.blk[i] : (water && W.slab[i] ? 23 : 0), 0, null, 'fall'); }
    if (u.length > 3) emit({ k: 'collapse', i: u[(u.length / 2) | 0], n: u.length });
    recomputeStab();
  }
}

/* ---------- player movement (owner-side) ---------- */
function stepMove(p, dt) {
  if (p.dead || p.gone) return;
  p.hurtT = Math.max(0, p.hurtT - dt);
  const I = p.inp, m = Math.hypot(I.mx, I.my), k = m > 1 ? 1 / m : 1;
  const spd = BAL.pSpeed * (p.down ? 0.22 : 1) * (p.medT > 0 ? 0.45 : 1) * (p.build ? 0.9 : 1);
  const tx = I.mx * k * spd, ty = I.my * k * spd, a = Math.min(1, dt * 14);
  p.vx = lerp(p.vx, tx, a); p.vy = lerp(p.vy, ty, a);
  p.kbx *= Math.max(0, 1 - dt * 6); p.kby *= Math.max(0, 1 - dt * 6);
  p.dropped = 0;
  moveEnt(p, (p.vx + p.kbx) * dt, (p.vy + p.kby) * dt, 'p', true);
  if (p.dropped) emitLocal('land');
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 0.3) p.anim += dt * sp * 2.6; else p.anim = lerp(p.anim, Math.round(p.anim / Math.PI) * Math.PI, Math.min(1, dt * 8));
  p.z = pZ(p);
}
function emitLocal(name) { fxEvent({ k: 'sfx', n: name, local: 1 }); }

/* ---------- player actions (host authoritative) ---------- */
const shoulder = p => [p.x, p.y, pZ(p) + (p.down ? 0.25 : 0.72)];
function stepActions(p, dt) {
  if (p.gone) return;
  const I = p.inp;
  p.fireCD -= dt; p.shoveCD -= dt; p.emptyT -= dt;
  if (p.dead) return;
  if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT <= 0) finishReload(p); }
  if (p.medT > 0) {
    p.medT -= dt;
    if (p.medT <= 0) {
      if (p.selfRev) { p.selfRev = false; if (p.down) { p.down = false; p.hp = 40; emit({ k: 'revive', p: p.i, by: p.i }); } }
      else { p.hp = Math.min(p.maxHp, p.hp + BAL.medHeal); emit({ k: 'sfx', n: 'heal', x: p.x, y: p.y }); }
    }
  }
  if (p.down) { p.downT -= dt; if (p.downT <= 0) { p.down = false; p.dead = true; p.reloadT = 0; p.medT = 0; emit({ k: 'dead', p: p.i }); checkLose(); return; } }
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (I.fire && !p.build && p.fireCD <= 0 && p.reloadT <= 0 && p.medT <= 0) {
    if (p.mag[wi] > 0) fireWeapon(p, wi);
    else if (w.inf || p.ammo[wi] > 0) startReload(p);
    else if (p.emptyT <= 0) { p.emptyT = 0.5; emit({ k: 'sfx', n: 'empty', x: p.x, y: p.y, o: p.i }); }
  }
  const tgt = I.use ? useTarget(p) : null;
  if (tgt) {
    const key = tgt.k + tgt.i;
    if (p.useK !== key) { p.useK = key; p.useT = 0; }
    p.useT += dt;
    if (p.useT >= tgt.t) { p.useT = 0; p.useK = ''; completeUse(p, tgt); }
  } else { p.useT = 0; p.useK = ''; }
}
// what the player would interact with: revive > search spot > gather tree/rock
function useTarget(p) {
  if (p.down || p.dead) return null;
  for (const q of W.p) if (q !== p && q.down && !q.dead && !q.gone && q.L === p.L && d2(q.x, q.y, p.x, p.y) < 1.5) return { k: 'rev', i: q.i, t: BAL.reviveTime, name: '扶起 ' + q.name };
  let best = null, bd = 1.45;
  const px = Math.floor(p.x), py = Math.floor(p.y);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = px + dx, y = py + dy; if (!inMap(x, y)) continue;
    const i = ci(x, y, p.L), b = W.blk[i]; if (!b) continue;
    const d = d2(x + 0.5, y + 0.5, p.x, p.y);
    if (d > bd) continue;
    if (B[b].spot) { const s = W.spots.find(s => s.i === i); if (s && !s.searched) { bd = d; best = { k: 'spot', i, t: BAL.searchTime, name: '搜索' + SPOTS[s.k].name }; } }
    else if (GATHER[b]) { bd = d; best = { k: 'gather', i, t: GATHER[b].t, name: GATHER[b].name }; }
  }
  return best;
}
function completeUse(p, tgt) {
  if (tgt.k === 'rev') { const q = W.p[tgt.i]; if (!q.down) return; q.down = false; q.hp = 35; q.medT = 0; q.selfRev = false; emit({ k: 'revive', p: q.i, by: p.i }); return; }
  const i = tgt.i, x = cx_(i), y = cy_(i), L = cl_(i), wx = x + 0.5, wy = y + 0.5, wz = L * FH + 1;
  const m = 1 + Math.max(0, radioDist(x, y) - 8) / BAL.lootFar;
  if (tgt.k === 'gather') {
    const g = GATHER[W.blk[i]]; if (!g) return;
    const n = Math.round(rand(g.n[0], g.n[1])); W.res[g.res] += n;
    setCell(i, 0, W.slab[i], null, W.blk[i] === 22 ? 'chop' : 'mine');
    emit({ k: 'loot', p: p.i, x: wx, y: wy, z: wz, text: '+' + n + ' ' + RES.find(r => r.k === g.res).name });
    return;
  }
  const s = W.spots.find(s => s.i === i); if (!s || s.searched) return;
  s.searched = true; emit({ k: 'spot', i, v: 1 });
  const S = SPOTS[s.k], got = [];
  for (const k in S.loot) { const [a, b] = S.loot[k]; const n = Math.round(rand(a, b) * m); W.res[k] += n; got.push('+' + n + ' ' + RES.find(r => r.k === k).name); }
  if (S.ammo) {
    for (const q of activeP()) { const give = [0, 8, 30, 4]; for (let wi = 1; wi < 4; wi++) if (q.owned[wi]) q.ammo[wi] += Math.round(give[wi] * m); }
    got.push('全队弹药');
    if (rand() < 0.35 && p.meds < 3) { p.meds++; got.push('医疗包'); }
    if (rand() < 0.35 && p.nades < 6) { p.nades++; got.push('手雷'); }
  }
  emit({ k: 'loot', p: p.i, x: wx, y: wy, z: wz, text: got.join('  ') });
}
function startReload(p) {
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (p.reloadT > 0 || p.mag[wi] >= w.mag || (!w.inf && p.ammo[wi] <= 0)) return;
  p.reloadT = w.reload; p.reloadW = wi; emit({ k: 'sfx', n: 'reload', x: p.x, y: p.y, o: p.i });
}
function finishReload(p) { const wi = p.reloadW, w = WPN[wi], need = w.mag - p.mag[wi], take = w.inf ? need : Math.min(need, p.ammo[wi]); p.mag[wi] += take; if (!w.inf) p.ammo[wi] -= take; }
// aim direction from the shoulder to the aim point (or level along the facing)
function aimDir(p) {
  const [sx, sy, sz] = shoulder(p);
  let tx, ty, tz;
  if (p.aimPt) { tx = p.aimPt.x; ty = p.aimPt.y; tz = p.aimPt.z; } else { tx = sx + Math.cos(p.aim) * 5; ty = sy + Math.sin(p.aim) * 5; tz = sz; }
  let dx = tx - sx, dy = ty - sy, dz = tz - sz; const hl = Math.hypot(dx, dy);
  if (hl < 0.4) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); dz = 0; }
  const L = Math.hypot(dx, dy, dz); return [dx / L, dy / L, dz / L];
}
function fireWeapon(p, wi) {
  const w = WPN[wi]; p.fireCD = w.rate; p.mag[wi]--;
  const [sx, sy, sz] = shoulder(p), [ax, ay, az] = aimDir(p);
  const yaw = Math.atan2(ay, ax), pitch = Math.asin(clamp(az, -1, 1));
  const mul = 1 + 0.12 * W.upg, ends = [];
  for (let k = 0; k < w.pellets; k++) {
    const sp = w.spread * (p.down ? 1.6 : 1);
    const yw = yaw + (rand() - 0.5) * 2 * sp, pt = pitch + (rand() - 0.5) * sp;
    const dx = Math.cos(pt) * Math.cos(yw), dy = Math.cos(pt) * Math.sin(yw), dz = Math.sin(pt);
    const wall = rayWorld(sx, sy, sz, dx, dy, dz, w.range);
    const hits = [];
    for (const z of W.zs) {
      if (z.hp <= 0) continue;
      const d = rayBox(sx, sy, sz, dx, dy, dz, z.x - z.r, z.y - z.r, z.z, z.r * 2, z.r * 2, z.h, wall.d);
      if (d >= 0) hits.push([d, z]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    let left = w.pierce || 1, endD = wall.d, hz = 0;
    for (const [d, z] of hits) {
      if (left <= 0) break;
      const hzv = sz + dz * d, head = hzv > z.z + z.h * 0.76;
      hurtZombie(z, w.dmg * mul * (head ? BAL.headshot : 1), p, dx * w.kick / (z.k === 'boss' ? 6 : z.k === 'brute' ? 3 : 1), dy * w.kick / (z.k === 'boss' ? 6 : z.k === 'brute' ? 3 : 1));
      if (k < 3 || head) emit({ k: 'hit', x: r2(sx + dx * d), y: r2(sy + dy * d), z: r2(hzv), h: head ? 1 : 0, g: z.k === 'spitter' ? 1 : 0 });
      left--; endD = d; hz = 1;
    }
    if (left > 0 || !hz) endD = wall.d;
    ends.push([r2(sx + dx * endD), r2(sy + dy * endD), r2(sz + dz * endD), !hz && wall.i >= 0 ? 1 : 0]);
  }
  emit({ k: 'shot', o: p.i, w: wi, e: ends });
}
function hurtZombie(z, dmg, p, kx, ky) {
  if (z.hp <= 0) return;
  z.hp -= dmg; z.hitT = 0.12;
  if (kx || ky) { z.kbx = (z.kbx || 0) + kx; z.kby = (z.kby || 0) + ky; }
  if (z.hp <= 0) killZombie(z, p);
}
function killZombie(z, p) {
  z.hp = 0; W.kills++; if (p) p.kills++;
  emit({ k: 'zdie', x: r2(z.x), y: r2(z.y), z: r2(z.z), t: z.k, f: r2(z.face), id: z.id });
  if (rand() < (z.k === 'boss' ? 1 : z.k === 'brute' ? 0.6 : 0.07)) { const n = z.k === 'boss' ? 15 : z.k === 'brute' ? 3 : 1; W.res.parts += n; emit({ k: 'loot', p: -1, x: z.x, y: z.y, z: z.z + z.h, text: '+' + n + ' 零件' }); }
}
function hurtPlayer(p, dmg) {
  if (p.gone || p.dead) return;
  if (DBG && DBG.god) return;
  if (p.down) { p.downT -= dmg * 0.18; p.hurtT = 0.3; emit({ k: 'phurt', p: p.i, d: 1 }); return; }
  p.hp -= dmg; p.hurtT = 0.3; emit({ k: 'phurt', p: p.i, d: Math.round(dmg) });
  if (p.hp <= 0) { p.hp = 0; p.down = true; p.downT = activeP().length > 1 ? BAL.downTime : BAL.soloDownTime; p.reloadT = 0; p.medT = 0; p.build = false; emit({ k: 'down', p: p.i }); checkLose(); }
}
function knock(p, kx, ky) { if (p.i === ME && NETROLE !== 'guest') { p.kbx += kx; p.kby += ky; } else emit({ k: 'kb', p: p.i, x: r2(kx), y: r2(ky) }); }
function checkLose() {
  if (W.over) return;
  if (W.radio.hp <= 0) return endGame('lose', '电台被摧毁了');
  const act = activeP(); if (!act.length) return;
  if (act.some(standingP)) return;
  if (act.some(p => p.down && (p.meds > 0 || p.selfRev))) return;
  endGame('lose', act.length > 1 ? '所有人都倒下了' : '你倒下了');
}
function endGame(kind, why) {
  if (W.over || W.demo) return;
  W.over = kind; W.phase = kind;
  lsSet('best', Math.max(lsGet('best', 0), kind === 'win' ? W.night : W.night - 1));
  emit({ k: 'over', v: kind, why, n: W.night, kills: W.kills, pk: W.p.map(p => p.kills), built: W.stats.built });
}

/* ---------- discrete actions ---------- */
function doAct(p, a, v) {
  if (!W || W.over || p.gone || p.dead) return;
  switch (a) {
    case 'reload': if (!p.down) startReload(p); else if (p.mag[0] < WPN[0].mag) { p.reloadT = WPN[0].reload; p.reloadW = 0; } break;
    case 'wpn': if (!p.down && v >= 0 && v < 4 && p.owned[v] && p.wpn !== v) { p.wpn = v; p.reloadT = 0; p.fireCD = Math.max(p.fireCD, 0.25); emit({ k: 'sfx', n: 'swap', x: p.x, y: p.y, o: p.i }); } break;
    case 'shove': shove(p); break;
    case 'nade': throwNade(p); break;
    case 'med':
      if (p.medT > 0 || p.meds <= 0) break;
      if (p.down) { p.meds--; p.medT = 3; p.selfRev = true; emit({ k: 'sfx', n: 'med', x: p.x, y: p.y }); }
      else if (p.hp < p.maxHp) { p.meds--; p.medT = BAL.healTime; emit({ k: 'sfx', n: 'med', x: p.x, y: p.y }); }
      break;
    case 'ready': p.ready = !!v; checkReady(); break;
    case 'craft': doCraft(p, v); break;
    case 'build': doBuild(p, v.x, v.y, v.l, v.b, v.d); break;
    case 'demo': doDemolish(p, v.x, v.y, v.l); break;
    case 'mode': p.build = !!v; break;
  }
}
function shove(p) {
  if (p.down || p.shoveCD > 0) return;
  p.shoveCD = BAL.shoveCD; p.shoveT = 0.18;
  let n = 0;
  for (const z of W.zs) {
    if (z.hp <= 0 || z.L !== p.L) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy);
    if (d > BAL.shoveRange + z.r || Math.abs(angDiff(p.aim, Math.atan2(dy, dx))) > 1.0) continue;
    const heavy = z.k === 'boss' ? 0.15 : z.k === 'brute' ? 0.3 : 1;
    z.kbx = (z.kbx || 0) + dx / (d || 1) * BAL.shoveKB * heavy; z.kby = (z.kby || 0) + dy / (d || 1) * BAL.shoveKB * heavy; z.stun = 0.45 * heavy;
    hurtZombie(z, BAL.shoveDmg * (1 + 0.12 * W.upg), p); n++;
  }
  emit({ k: 'shove', p: p.i, n });
}
function throwNade(p) {
  if (p.down || p.nades <= 0) return;
  p.nades--;
  const [sx, sy, sz] = shoulder(p), [ax, ay] = aimDir(p);
  let dist = p.aimPt ? Math.min(12, d2(p.aimPt.x, p.aimPt.y, sx, sy)) : 6; dist = Math.max(2, dist);
  const T = 0.75 + dist * 0.03, g = 14;
  W.proj.push({ k: 'nade', x: sx, y: sy, z: sz, vx: Math.cos(Math.atan2(ay, ax)) * dist / T, vy: Math.sin(Math.atan2(ay, ax)) * dist / T, vz: g * T / 2 + ((p.aimPt ? p.aimPt.z - 0.5 : sz - 0.72) - sz) / T, t: BAL.nadeFuse, o: p.i });
  emit({ k: 'sfx', n: 'throw', x: p.x, y: p.y });
}
function checkReady() {
  if (W.phase !== 'day') return;
  const act = activeP().filter(p => !p.dead);
  if (act.length && act.every(p => p.ready) && W.clock > 4) { W.clock = 4; say('全员就绪，夜晚提前到来', '#ffcf6b'); }
}
function nearBench(p) { return !p.down && p.L === gAt(W.bench.x, W.bench.y) && d2(p.x, p.y, W.bench.x + 0.5, W.bench.y + 0.5) < 2.2; }
function craftBlocked(p, c) {
  if (c.wpn && p.owned[c.wpn]) return '已拥有';
  if (c.ammo && !p.owned[c.ammo[0]]) return '没有这把枪';
  if (c.nade && p.nades >= 6) return '已满';
  if (c.med && p.meds >= 3) return '已满';
  if (c.upg && W.upg >= 5) return '已满级';
  if (c.radio && W.radio.max >= BAL.radioHp + 2000) return '已满';
  if (!affordable(W.res, c.cost)) return '材料不足';
  return '';
}
function doCraft(p, id) {
  const c = CRAFT.find(c => c.id === id); if (!c || !nearBench(p) || craftBlocked(p, c)) return;
  for (const k in c.cost) W.res[k] -= c.cost[k];
  if (c.wpn) { p.owned[c.wpn] = 1; p.mag[c.wpn] = WPN[c.wpn].mag; p.ammo[c.wpn] += c.wpn === 2 ? 60 : 10; p.wpn = c.wpn; }
  if (c.ammo) p.ammo[c.ammo[0]] += c.ammo[1];
  if (c.nade) p.nades = Math.min(6, p.nades + c.nade);
  if (c.med) p.meds = Math.min(3, p.meds + 1);
  if (c.radio) { W.radio.max += c.radio * 0.5; W.radio.hp = Math.min(W.radio.max, W.radio.hp + c.radio); }
  if (c.upg) W.upg++;
  emit({ k: 'craft', p: p.i, id, name: c.name });
}
function inReach(p, x, y, L) { return !p.down && Math.hypot(p.x - x - 0.5, p.y - y - 0.5, (pZ(p) - L * FH) * 0.8) <= BAL.pReach; }
function repairCost(Bb, frac) { const c = {}; for (const k in Bb.cost) c[k] = Math.max(1, Math.ceil(Bb.cost[k] * frac)); return c; }
function doBuild(p, x, y, L, id, dir) {
  if (!inMap(x, y) || L < 0 || L >= ML || !inReach(p, x, y, L) || !B[id] || !B[id].cost) return;
  const i = ci(x, y, L), Bi = B[id];
  // repair what is there
  const cur = Bi.slab ? W.slab[i] : W.blk[i];
  if (cur && B[cur].cost) {
    const hpNow = Bi.slab ? W.shp[i] : W.bhp[i], miss = 1 - hpNow / B[cur].hp; if (miss <= 0.02) return;
    const cost = repairCost(B[cur], miss);
    if (!affordable(W.res, cost)) return emit({ k: 'deny', p: p.i, why: '材料不足' });
    for (const k in cost) W.res[k] -= cost[k];
    if (Bi.slab) W.shp[i] = B[cur].hp; else W.bhp[i] = B[cur].hp;
    W.dirty.add(i); emit({ k: 'repair', i, p: p.i }); return;
  }
  const why = canPlace(x, y, L, id, dir);
  if (why) return emit({ k: 'deny', p: p.i, why });
  if (!affordable(W.res, Bi.cost)) return emit({ k: 'deny', p: p.i, why: '材料不足' });
  for (const k in Bi.cost) W.res[k] -= Bi.cost[k];
  if (Bi.slab) setCell(i, W.blk[i] === 23 ? 0 : W.blk[i], id, null, 'build');
  else setCell(i, id, W.slab[i], Bi.stairs ? (dir & 3) : null, 'build');
  W.stats.built++;
  recomputeStab();
}
function doDemolish(p, x, y, L) {
  if (!inMap(x, y) || L < 0 || L >= ML || !inReach(p, x, y, L)) return;
  const i = ci(x, y, L), b = W.blk[i], s = W.slab[i];
  let Bb, frac;
  if (b && B[b].cost) { Bb = B[b]; frac = W.bhp[i] / Bb.hp; setCell(i, 0, s, null, 'demo'); }
  else if (s && B[s].cost) { Bb = B[s]; frac = W.shp[i] / Bb.hp; const water = L === 0 && ttAt(x, y) === TT.water; setCell(i, water ? 23 : b, 0, null, 'demo'); }
  else return;
  for (const k in Bb.cost) W.res[k] += Math.floor(Bb.cost[k] * BAL.refund * frac);
  collapseCheck();
}

/* ---------- phases & waves ---------- */
function edgeSpawns() {
  const out = { 0: [], 1: [], 2: [], 3: [] }; // by side: 0 east, 1 south, 2 west, 3 north
  const add = (x, y, side) => { const L = gAt(x, y); if (standable(x, y, L, 'z') && W.ff.rw[ci(x, y, L)] < Infinity) out[side].push([x, y, L]); };
  for (let k = 0; k < MW; k++) { add(MW - 1, k, 0); add(k, MH - 1, 1); add(0, k, 2); add(k, 0, 3); }
  return out;
}
function startNight() {
  W.night++; W.phase = 'night'; W.nightT = 0;
  W.p.forEach(p => p.ready = false);
  const n = W.night, blood = isBlood(n), D = W.D;
  const count = Math.round(BAL.nightSpawn(n) * D.n * (blood ? BAL.bloodMul : 1));
  const wts = { walker: 10, runner: n >= 3 ? 2 + n * 0.35 : n === 2 ? 1.5 : 0, climber: n >= 4 ? 0.8 + n * 0.2 : 0, spitter: n >= 6 ? 1.3 + n * 0.1 : 0, brute: n >= 5 ? (0.5 + n * 0.07) * (blood ? 2 : 1) : 0 };
  const tot = Object.values(wts).reduce((a, b) => a + b, 0), dur = BAL.spawnDur(n), q = [];
  const sides = [0, 1, 2, 3].filter(s => W.edges[s].length);
  for (let k = sides.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [sides[k], sides[j]] = [sides[j], sides[k]]; }
  const front = blood ? sides : sides.slice(0, Math.min(sides.length, n < 3 ? 1 : 2));
  for (let k = 0; k < count; k++) {
    let r = rand() * tot, type = 'walker';
    for (const key in wts) { r -= wts[key]; if (r <= 0) { type = key; break; } }
    const frac = k / count, burst = Math.floor(frac * 6) / 6;
    q.push({ t: lerp(burst, frac, 0.55) * dur + rand() * 3, k: type, side: front[Math.floor(rand() * front.length)] });
  }
  if (blood) q.push({ t: dur * 0.55, k: 'boss', side: front[0] });
  q.sort((a, b) => a.t - b.t);
  W.spawnQ = q;
  const names = ['东', '南', '西', '北'];
  emit({ k: 'night', n, blood: blood ? 1 : 0, count: q.length, from: front.map(s => names[s]).join('、') });
}
function dawn() {
  if (W.night >= BAL.nights && !W.endless) return endGame('win', '救援直升机到了');
  W.phase = 'day'; W.dayLen = W.clock = BAL.dayLen[1];
  W.spots.forEach(s => s.searched = false);
  for (const p of activeP()) {
    p.ready = false;
    if (p.dead) { p.dead = false; p.down = false; p.hp = Math.round(p.maxHp * BAL.respawnHp); p.x = W.radio.x - 0.5 + p.i * 2; p.y = W.radio.y + 0.5; p.L = gAt(W.radio.x, W.radio.y); p.vx = p.vy = 0; emit({ k: 'tp', p: p.i, x: p.x, y: p.y, l: p.L }); }
    else if (p.down) { p.down = false; p.hp = 30; }
  }
  emit({ k: 'dawn', n: W.night });
}
function spawnZombie(k, side) {
  const Z = ZT[k], n = Math.max(1, W.night), D = W.D;
  const list = W.edges[side] && W.edges[side].length ? W.edges[side] : W.edges[0];
  const [x, y, L] = list[Math.floor(rand() * list.length)];
  const hpM = BAL.hpMul(n) * D.hp * (k === 'boss' ? 1 + n / 10 : 1) * (activeP().length > 1 ? 1.15 : 1);
  const z = { id: W.zid++, k, x: x + 0.5, y: y + 0.5, L, z: L * FH, r: Z.r, h: Z.h, hp: Z.hp * hpM, max: Z.hp * hpM, spd: Z.spd * BAL.spdMul(n) * (0.85 + rand() * 0.3), face: 0, cd: rand(), st: 'walk', stun: 0, kbx: 0, kby: 0, hitT: 0, atk: 0, anim: rand() * 6, seed: (rand() * 1e6) | 0, spitT: 1 + rand() * 2, climbT: 0 };
  W.zs.push(z);
  return z;
}
function stepPhase(dt) {
  if (W.over) return;
  if (W.phase === 'day') {
    W.clock -= dt; W.strayT -= dt;
    if (W.strayT <= 0 && W.night >= 1) { W.strayT = BAL.dayStragglerCD; if (W.zs.length < BAL.dayStragglers) spawnZombie(W.night >= 4 && rand() < 0.3 ? 'runner' : 'walker', Math.floor(rand() * 4)); }
    if (W.clock <= 0) startNight();
  } else if (W.phase === 'night') {
    W.nightT += dt;
    while (W.spawnQ.length && W.spawnQ[0].t <= W.nightT) { const s = W.spawnQ.shift(); spawnZombie(s.k, s.side); }
    if (!W.spawnQ.length && W.zs.length && W.zs.length <= 3 && W.nightT > BAL.spawnDur(W.night) + 240) { W.zs.forEach(z => { z.hp = 0; }); W.zs = []; say('残余的丧尸散去了'); }
    if (!W.spawnQ.length && !W.zs.length) dawn();
  }
}

/* ---------- projectiles ---------- */
function floorUnder(x, y, z) { const cx = Math.floor(x), cy = Math.floor(y); for (let L = Math.min(ML - 1, Math.floor(z / FH)); L >= 0; L--) if (support(cx, cy, L) || solidFor(blkAt(cx, cy, L - 1), 'b')) return L * FH; return 0; }
function stepProj(dt) {
  for (const b of W.proj) {
    b.vz -= (b.k === 'acid' ? 10 : 14) * dt;
    if (b.k === 'nade') {
      b.t -= dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt, nz = b.z + b.vz * dt;
      const L = Math.floor(b.z / FH);
      if (solidFor(blkAt(Math.floor(nx), Math.floor(b.y), L), 'b') || solidFor(blkAt(Math.floor(nx), Math.floor(b.y), L), 'p')) b.vx *= -0.4; else b.x = nx;
      if (solidFor(blkAt(Math.floor(b.x), Math.floor(ny), L), 'b') || solidFor(blkAt(Math.floor(b.x), Math.floor(ny), L), 'p')) b.vy *= -0.4; else b.y = ny;
      const fz = floorUnder(b.x, b.y, b.z + 0.01);
      if (nz <= fz && b.vz < 0) { b.z = fz; b.vz *= -0.35; b.vx *= 0.65; b.vy *= 0.65; if (Math.abs(b.vz) > 1.5) emit({ k: 'sfx', n: 'clink', x: b.x, y: b.y }); } else b.z = nz;
      if (b.t <= 0) { b.dead = true; explode(b.x, b.y, b.z + 0.2, W.p[b.o]); }
    } else {
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      const x = Math.floor(b.x), y = Math.floor(b.y), L = Math.floor(b.z / FH), blk = blkAt(x, y, L);
      let hit = false;
      if (solidFor(blk, 'b') || b.z <= floorUnder(b.x, b.y, b.z + 0.3) + 0.02) { if (inMap(x, y) && L >= 0 && L < ML) damageCell(ci(x, y, L), 9 * W.D.dmg); hit = true; }
      for (const p of W.p) if ((standingP(p) || p.down) && d2(p.x, p.y, b.x, b.y) < p.r + 0.15 && b.z > p.z - 0.1 && b.z < p.z + p.h + 0.1) { hurtPlayer(p, 11 * W.D.dmg); hit = true; }
      if (hit || b.z < -2) { b.dead = true; emit({ k: 'acid', x: r2(b.x), y: r2(b.y), z: r2(b.z) }); }
    }
  }
  W.proj = W.proj.filter(b => !b.dead);
}
function explode(x, y, z, p) {
  const R = BAL.nadeR;
  for (const zb of W.zs) {
    if (zb.hp <= 0) continue;
    const d = Math.hypot(zb.x - x, zb.y - y, (zb.z + zb.h / 2 - z) * 0.8);
    if (d < R + zb.r) { const f = 1 - Math.max(0, d - zb.r) / R; hurtZombie(zb, BAL.nadeDmg * (0.35 + 0.65 * f) * (1 + 0.12 * W.upg), p, (zb.x - x) / (d || 1) * 5 * f, (zb.y - y) / (d || 1) * 5 * f); }
  }
  emit({ k: 'boom', x: r2(x), y: r2(y), z: r2(z) });
}

/* ---------- one host/solo tick ---------- */
function simStep(dt) {
  W.t += dt;
  for (const p of W.p) { if (p.gone) continue; if (p.i === ME) stepMove(p, dt); stepActions(p, dt); }
  if (!W.over) {
    stepPhase(dt);
    updateFields(dt);
    stepZombies(dt);
    stepProj(dt);
    W.radio.hitT = Math.max(0, W.radio.hitT - dt); W.radio.alarmT -= dt;
    checkLose();
  }
}
