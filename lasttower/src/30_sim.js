/* ================= simulation: players, weapons, building, scavenging, crafting, day/night ================= */
function mkPlayer(i, name) {
  return {
    i, name, x: (i ? 71.5 : 67.8) * T, y: GY, vx: 0, vy: 0, w: 0.7 * T, h: 1.8 * T, face: i ? -1 : 1, aim: i ? Math.PI : 0,
    hp: BAL.pMaxHp, maxHp: BAL.pMaxHp, down: false, downT: 0, dead: false, gone: false,
    wpn: 1, owned: [1, 1, 0, 0], mag: [12, 6, 0, 0], ammo: [0, WPN[1].start, 0, 0], reloadT: 0, fireCD: 0, shoveCD: 0, shoveT: 0,
    nades: 1, meds: 1, medT: 0, selfRev: false, useT: 0, useK: '', useI: -1, climbing: false, drop: false, ground: true,
    build: false, sel: 1, demo: false, inp: { l: 0, r: 0, up: 0, dn: 0, jump: 0, fire: 0, use: 0 }, kills: 0, hurtT: 0, anim: 0, emptyT: 0, ready: false,
  };
}
function newWorld(seed, names, diff) {
  const m = genMap(seed);
  W = {
    seed, t: 0, tiles: m.tiles, thp: m.thp, stab: new Int8Array(MW * MH), spots: m.spots,
    p: names.map((n, i) => mkPlayer(i, n)), zs: [], proj: [], zid: 1,
    radio: { hp: BAL.radioHp, max: BAL.radioHp, hitT: 0, alarmT: 0 },
    phase: 'day', clock: BAL.dayLen[0], dayLen: BAL.dayLen[0], night: 0, res: Object.assign({}, BAL.startRes), upg: 0, kills: 0,
    spawnQ: [], nightT: 0, strayT: 8, diff, D: BAL.diff[diff] || BAL.diff.normal, rng: mulberry(seed ^ 0x9e3779b9), E: [], seq: 0,
    dirty: new Set(), endless: false, over: null, stats: { built: 0, lost: 0 }, best: 0,
  };
  recomputeStab();
  return W;
}
const rand = (a = 0, b = 1) => a + W.rng() * (b - a);
const activeP = () => W.p.filter(p => !p.gone);
const standing = p => !p.gone && !p.dead && !p.down;
function emit(e) {
  if (!W) return;
  e.s = ++W.seq; fxEvent(e);
  if (NETROLE === 'host') netSendCtl({ t: 'ev', e });
}
function say(text, col) { emit({ k: 'say', text, col: col || '' }); }

/* ---------- tiles ---------- */
function setTile(i, id, cause) {
  W.tiles[i] = id; W.thp[i] = id ? TF[id].hp : 0;
  emit({ k: 'tile', i, v: id, c: cause || '' });
}
function damageTile(i, dmg) {
  const t = W.tiles[i]; if (!t || t === DIRT) return;
  W.thp[i] -= dmg; W.dirty.add(i);
  if (W.thp[i] <= 0) { destroyTile(i, 'brk'); }
}
function destroyTile(i, cause) {
  if (!W.tiles[i]) return;
  W.stats.lost++;
  setTile(i, 0, cause);
  collapseCheck();
}
function collapseCheck() {
  recomputeStab();
  for (let pass = 0; pass < 6; pass++) {
    const u = unsupported(); if (!u.length) break;
    u.forEach(i => setTile(i, 0, 'fall'));
    if (u.length > 3) emit({ k: 'collapse', i: u[(u.length / 2) | 0], n: u.length });
    recomputeStab();
  }
}

/* ---------- player movement (run by whoever owns the player: host for itself, guest for itself) ---------- */
function stepMove(p, dt) {
  if (p.dead || p.gone) return;
  const I = p.inp;
  p.hurtT = Math.max(0, p.hurtT - dt);
  if (p.down) {
    p.climbing = false; p.drop = false;
    p.vx = ((I.r ? 1 : 0) - (I.l ? 1 : 0)) * 42;
    p.vy = Math.min(1400, p.vy + GRAV * dt); p.h = 0.8 * T; moveBody(p, dt, 'p');
    return;
  }
  if (p.h !== 1.8 * T) { // stand up: make sure there is head room
    if (!boxSolid(p.x, p.y, p.w, 1.8 * T, 'p')) p.h = 1.8 * T;
  }
  const dir = (I.r ? 1 : 0) - (I.l ? 1 : 0);
  const spd = BAL.pSpeed * (p.medT > 0 ? 0.45 : 1) * (p.build ? 0.9 : 1);
  const acc = p.ground ? 2600 : 1500;
  p.vx = p.vx < dir * spd ? Math.min(dir * spd, p.vx + acc * dt) : Math.max(dir * spd, p.vx - acc * dt);
  if (p.kbT > 0) p.kbT -= dt;
  const tx = Math.floor(p.x / T);
  const ladBody = () => { for (let ty = Math.floor((p.y - p.h + 2) / T); ty <= Math.floor((p.y - 2) / T); ty++) if (TF[tileAt(tx, ty)].lad) return true; return false; };
  const ladBelow = () => TF[tileAt(tx, Math.floor((p.y + 2) / T))].lad;
  if (!p.climbing && ((I.up && ladBody()) || (I.dn && (ladBody() || ladBelow())))) { p.climbing = true; p.vx *= 0.3; }
  if (p.climbing) {
    if (!ladBody() && !(I.dn && ladBelow())) { p.climbing = false; if (p.vy < 0) p.vy = 0; }
    else {
      p.vy = ((I.dn ? 1 : 0) - (I.up ? 1 : 0)) * BAL.pClimb;
      if (!dir) p.x = lerp(p.x, (tx + 0.5) * T, Math.min(1, dt * 12));
      p.vx *= 0.5;
      if (I.jumpP) { p.climbing = false; p.vy = -BAL.pJump * 0.6; }
    }
  }
  if (!p.climbing) {
    p.vy = Math.min(1400, p.vy + GRAV * dt);
    if (I.jumpP && p.ground) { p.vy = -BAL.pJump; emitLocal('jump'); }
  }
  p.drop = !!I.dn && !p.climbing;
  moveBody(p, dt, 'p');
  if (p.climbing) p.ground = false;
  I.jumpP = false;
  if (Math.abs(p.vx) > 20 && p.ground) p.anim += dt * Math.abs(p.vx) / 38; else if (p.climbing && p.vy) p.anim += dt * 6; else p.anim = lerp(p.anim, Math.round(p.anim / Math.PI) * Math.PI, Math.min(1, dt * 8));
  if (p.y > (MH + 2) * T) { p.x = RADIO.x; p.y = GY; p.vy = 0; }
}
function emitLocal(name) { fxEvent({ k: 'sfx', n: name, local: 1 }); }

/* ---------- player actions (host authoritative for everyone) ---------- */
const muzzle = p => { const sx = p.x, sy = p.y - (p.down ? 0.5 : 1.3) * T; return [sx + Math.cos(p.aim) * 0.75 * T, sy + Math.sin(p.aim) * 0.75 * T, sx, sy]; };
function stepActions(p, dt) {
  if (p.gone) return;
  const I = p.inp;
  p.fireCD -= dt; p.shoveCD -= dt; p.emptyT -= dt;
  if (p.dead) return;
  p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
  if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT <= 0) finishReload(p); }
  if (p.medT > 0) {
    p.medT -= dt;
    if (p.medT <= 0) {
      if (p.selfRev) { p.selfRev = false; if (p.down) { p.down = false; p.hp = 40; emit({ k: 'revive', p: p.i, by: p.i }); } }
      else { p.hp = Math.min(p.maxHp, p.hp + BAL.medHeal); emit({ k: 'sfx', n: 'heal', x: p.x, y: p.y }); }
    }
  }
  if (p.down) {
    p.downT -= dt;
    if (p.downT <= 0) { p.down = false; p.dead = true; p.reloadT = 0; p.medT = 0; emit({ k: 'dead', p: p.i }); checkLose(); return; }
  }
  // firing
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (I.fire && !p.build && p.fireCD <= 0 && p.reloadT <= 0 && p.medT <= 0) {
    if (p.mag[wi] > 0) fireWeapon(p, wi);
    else if (w.inf || p.ammo[wi] > 0) startReload(p);
    else if (p.emptyT <= 0) { p.emptyT = 0.5; emit({ k: 'sfx', n: 'empty', x: p.x, y: p.y, o: p.i }); }
  }
  // interaction (hold)
  const tgt = I.use ? useTarget(p) : null;
  if (tgt) {
    const key = tgt.k + tgt.i;
    if (p.useK !== key) { p.useK = key; p.useT = 0; }
    p.useT += dt;
    const need = tgt.k === 'rev' ? BAL.reviveTime : BAL.searchTime;
    if (p.useT >= need) { p.useT = 0; p.useK = ''; completeUse(p, tgt); }
  } else { p.useT = 0; p.useK = ''; }
}
function useTarget(p) {
  if (p.down || p.dead) return null;
  for (const q of W.p) if (q !== p && q.down && !q.dead && !q.gone && Math.abs(q.x - p.x) < 1.6 * T && Math.abs(q.y - p.y) < 1.2 * T) return { k: 'rev', i: q.i };
  let best = null, bd = 1e9;
  for (const s of W.spots) {
    if (s.searched) continue; const d = Math.abs(s.x - p.x);
    if (d < SPOTS[s.k].w * T / 2 + 0.7 * T && Math.abs(p.y - GY) < 1.2 * T && d < bd) { bd = d; best = { k: 'spot', i: s.i }; }
  }
  return best;
}
function completeUse(p, tgt) {
  if (tgt.k === 'rev') {
    const q = W.p[tgt.i]; if (!q.down) return;
    q.down = false; q.hp = 35; q.medT = 0; q.selfRev = false; emit({ k: 'revive', p: q.i, by: p.i }); return;
  }
  const s = W.spots[tgt.i]; if (s.searched) return;
  s.searched = true; emit({ k: 'spot', i: s.i, v: 1 });
  const S = SPOTS[s.k], m = 1 + Math.abs(s.x - RADIO.x) / (BAL.lootFar * T), got = [];
  for (const k in S.loot) { const [a, b] = S.loot[k]; const n = Math.round((a + rand() * (b - a)) * m); W.res[k] += n; got.push('+' + n + ' ' + RES.find(r => r.k === k).name); }
  if (S.ammo) {
    for (const p2 of activeP()) {
      const give = [0, 8, 30, 4];
      for (let wi = 1; wi < 4; wi++) if (p2.owned[wi]) p2.ammo[wi] += Math.round(give[wi] * m);
    }
    got.push('全队弹药');
    if (rand() < 0.35 && p.meds < 3) { p.meds++; got.push('医疗包'); }
    if (rand() < 0.35 && p.nades < 6) { p.nades++; got.push('手雷'); }
  }
  emit({ k: 'loot', p: p.i, x: s.x, y: GY - T, text: got.join('  ') });
}
function startReload(p) {
  const wi = p.down ? 0 : p.wpn, w = WPN[wi];
  if (p.reloadT > 0 || p.mag[wi] >= w.mag || (!w.inf && p.ammo[wi] <= 0)) return;
  p.reloadT = w.reload; p.reloadW = wi; emit({ k: 'sfx', n: 'reload', x: p.x, y: p.y, o: p.i });
}
function finishReload(p) {
  const wi = p.reloadW, w = WPN[wi], need = w.mag - p.mag[wi], take = w.inf ? need : Math.min(need, p.ammo[wi]);
  p.mag[wi] += take; if (!w.inf) p.ammo[wi] -= take;
}
function fireWeapon(p, wi) {
  const w = WPN[wi]; p.fireCD = w.rate; p.mag[wi]--;
  const [mx, my, sx, sy] = muzzle(p);
  // muzzle inside a wall? fire from the shoulder instead so you can't shoot through walls you hug
  const ox = solidFor(tileAt(Math.floor(mx / T), Math.floor(my / T)), 'b') ? sx : mx, oy = ox === sx ? sy : my;
  const mul = (1 + 0.12 * W.upg), ends = [];
  for (let k = 0; k < w.pellets; k++) {
    const a = p.aim + (rand() - 0.5) * 2 * w.spread * (p.down ? 1.6 : 1);
    const dx = Math.cos(a), dy = Math.sin(a);
    const wall = rayTiles(ox, oy, dx, dy, w.range);
    const hits = [];
    for (const z of W.zs) {
      if (z.hp <= 0) continue;
      const d = rayBox(ox, oy, dx, dy, z.x - z.w / 2, z.y - z.h, z.w, z.h, wall.d);
      if (d >= 0) hits.push([d, z]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    let left = w.pierce || 1, endD = wall.d, hitZ = 0;
    for (const [d, z] of hits) {
      if (left <= 0) break;
      const hy = oy + dy * d, head = hy - (z.y - z.h) < z.h * 0.26;
      hurtZombie(z, w.dmg * mul * (head ? BAL.headshot : 1), p, dx * w.kick / (z.k === 'boss' ? 6 : z.k === 'brute' ? 3 : 1));
      if (k < 3 || head) emit({ k: 'hit', x: ox + dx * d, y: hy, h: head ? 1 : 0, g: z.k === 'spitter' ? 1 : 0 });
      left--; endD = d; hitZ = 1;
    }
    if (left > 0 || !hitZ) endD = wall.d;
    ends.push([r1(ox + dx * endD), r1(oy + dy * endD), !hitZ && wall.i >= 0 ? 1 : 0]);
  }
  emit({ k: 'shot', o: p.i, w: wi, x: r1(ox), y: r1(oy), e: ends });
}
function hurtZombie(z, dmg, p, kb) {
  if (z.hp <= 0) return;
  z.hp -= dmg; z.hitT = 0.12;
  if (kb) z.vx += kb;
  if (z.hp <= 0) killZombie(z, p);
}
function killZombie(z, p) {
  z.hp = 0; z.dead = true;
  W.kills++; if (p) p.kills++;
  emit({ k: 'zdie', x: r1(z.x), y: r1(z.y), z: z.k, f: z.face, id: z.id });
  if (rand() < (z.k === 'boss' ? 1 : z.k === 'brute' ? 0.6 : 0.07)) {
    const n = z.k === 'boss' ? 15 : z.k === 'brute' ? 3 : 1; W.res.parts += n;
    emit({ k: 'loot', p: -1, x: z.x, y: z.y - z.h, text: '+' + n + ' 零件' });
  }
}
function hurtPlayer(p, dmg, src) {
  if (!standing(p) && !p.down) return;
  if (DBG && DBG.god) return;
  if (p.down) { p.downT -= dmg * 0.18; p.hurtT = 0.3; emit({ k: 'phurt', p: p.i, d: 1 }); return; }
  p.hp -= dmg; p.hurtT = 0.3;
  emit({ k: 'phurt', p: p.i, d: Math.round(dmg) });
  if (p.hp <= 0) {
    p.hp = 0; p.down = true; p.downT = activeP().length > 1 ? BAL.downTime : BAL.soloDownTime; p.reloadT = 0; p.medT = 0; p.build = false; p.climbing = false;
    emit({ k: 'down', p: p.i });
    checkLose();
  }
}
function knock(p, vx, vy) {
  if (p.i === ME && NETROLE !== 'guest') { p.vx = vx; p.vy = vy; p.kbT = 0.25; p.climbing = false; }
  else emit({ k: 'kb', p: p.i, vx: Math.round(vx), vy: Math.round(vy) });
}
function checkLose() {
  if (W.over) return;
  if (W.radio.hp <= 0) return endGame('lose', '电台被摧毁了');
  const act = activeP(); if (!act.length) return;
  if (act.some(standing)) return;
  if (act.some(p => p.down && (p.meds > 0 || p.selfRev))) return; // someone can still pick himself up
  endGame('lose', act.length > 1 ? '所有人都倒下了' : '你倒下了');
}
function endGame(kind, why) {
  if (W.over || W.demo) return;
  W.over = kind; W.phase = kind;
  const best = Math.max(lsGet('best', 0), kind === 'win' ? W.night : W.night - 1);
  lsSet('best', best);
  emit({ k: 'over', v: kind, why, n: W.night, kills: W.kills, pk: W.p.map(p => p.kills) });
}

/* ---------- discrete actions (requested by local input or by the guest over the network) ---------- */
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
    case 'build': doBuild(p, v.x, v.y, v.b); break;
    case 'demo': doDemolish(p, v.x, v.y); break;
    case 'mode': p.build = !!v; break;
  }
}
function shove(p) {
  if (p.down || p.shoveCD > 0) return;
  p.shoveCD = BAL.shoveCD; p.shoveT = 0.18;
  let n = 0;
  for (const z of W.zs) {
    if (z.hp <= 0) continue;
    const dx = (z.x - p.x) * p.face;
    if (dx > -0.2 * T && dx < BAL.shoveRange * T + z.w / 2 && z.y - z.h < p.y && z.y > p.y - p.h) {
      const heavy = z.k === 'boss' ? 0.15 : z.k === 'brute' ? 0.3 : 1;
      z.vx = p.face * BAL.shoveKB * heavy; z.vy = -160 * heavy; z.stun = 0.45 * heavy; z.ride = 0;
      hurtZombie(z, BAL.shoveDmg * (1 + 0.12 * W.upg), p, 0); n++;
    }
  }
  emit({ k: 'shove', p: p.i, n });
}
function throwNade(p) {
  if (p.down || p.nades <= 0) return;
  p.nades--;
  const [, , sx, sy] = muzzle(p);
  W.proj.push({ k: 'nade', x: sx, y: sy, vx: Math.cos(p.aim) * 640 + p.vx * 0.5, vy: Math.sin(p.aim) * 640 - 180, t: BAL.nadeFuse, o: p.i });
  emit({ k: 'sfx', n: 'throw', x: p.x, y: p.y });
}
function checkReady() {
  if (W.phase !== 'day') return;
  const act = activeP().filter(p => !p.dead);
  if (act.length && act.every(p => p.ready) && W.clock > 4) { W.clock = 4; say('全员就绪，夜晚提前到来', '#ffcf6b'); }
}
function nearBench(p) { return Math.abs(p.x - BENCH.x) < 2.6 * T && Math.abs(p.y - GY) < 1.2 * T && !p.down; }
function craftBlocked(p, c) {
  if (c.wpn && p.owned[c.wpn]) return '已拥有';
  if (c.ammo && !p.owned[c.ammo[0]]) return '没有这把枪';
  if (c.nade && p.nades >= 6) return '已满';
  if (c.med && p.meds >= 3) return '已满';
  if (c.upg && W.upg >= 5) return '已满级';
  if (c.radio && W.radio.hp >= W.radio.max + 2000) return '已满';
  if (!affordable(W.res, c.cost)) return '材料不足';
  return '';
}
function doCraft(p, id) {
  const c = CRAFT.find(c => c.id === id); if (!c || !nearBench(p)) return;
  if (craftBlocked(p, c)) return;
  for (const k in c.cost) W.res[k] -= c.cost[k];
  if (c.wpn) { p.owned[c.wpn] = 1; p.mag[c.wpn] = WPN[c.wpn].mag; p.ammo[c.wpn] += c.wpn === 2 ? 60 : 10; p.wpn = c.wpn; }
  if (c.ammo) p.ammo[c.ammo[0]] += c.ammo[1];
  if (c.nade) p.nades = Math.min(6, p.nades + c.nade);
  if (c.med) p.meds = Math.min(3, p.meds + 1);
  if (c.radio) { W.radio.max += c.radio * 0.5; W.radio.hp = Math.min(W.radio.max, W.radio.hp + c.radio); }
  if (c.upg) W.upg++;
  emit({ k: 'craft', p: p.i, id, name: c.name });
}
function inReach(p, tx, ty) { return dist(p.x, p.y - p.h / 2, (tx + 0.5) * T, (ty + 0.5) * T) <= BAL.pReach * T && !p.down; }
function doBuild(p, tx, ty, id) {
  if (!inReach(p, tx, ty) || !TF[id] || !TF[id].cost) return;
  const t = tileAt(tx, ty);
  if (t && t !== DIRT) { // repair
    const i = ix(tx, ty), B = TF[t], miss = 1 - W.thp[i] / B.hp; if (miss <= 0.02) return;
    const cost = {}; for (const k in B.cost) cost[k] = Math.max(1, Math.ceil(B.cost[k] * miss));
    if (!affordable(W.res, cost)) return emit({ k: 'deny', p: p.i, why: '材料不足' });
    for (const k in cost) W.res[k] -= cost[k];
    W.thp[i] = B.hp; W.dirty.add(i); emit({ k: 'repair', i, p: p.i }); return;
  }
  const why = canPlace(tx, ty, id);
  if (why) return emit({ k: 'deny', p: p.i, why });
  if (!affordable(W.res, TF[id].cost)) return emit({ k: 'deny', p: p.i, why: '材料不足' });
  for (const k in TF[id].cost) W.res[k] -= TF[id].cost[k];
  setTile(ix(tx, ty), id, 'build'); W.stats.built++;
  recomputeStab();
}
function doDemolish(p, tx, ty) {
  if (!inReach(p, tx, ty)) return;
  const i = ix(tx, ty), t = W.tiles[i]; if (!t || t === DIRT) return;
  const B = TF[t], f = BAL.refund * W.thp[i] / B.hp;
  for (const k in B.cost) W.res[k] += Math.floor(B.cost[k] * f);
  setTile(i, 0, 'demo'); collapseCheck();
}

/* ---------- phases & waves ---------- */
function startNight() {
  W.night++; W.phase = 'night'; W.nightT = 0;
  W.p.forEach(p => p.ready = false);
  const n = W.night, blood = isBlood(n), D = W.D;
  let count = Math.round(BAL.nightSpawn(n) * D.n * (blood ? BAL.bloodMul : 1));
  const wts = { walker: 10, runner: n >= 3 ? 2 + n * 0.35 : 0, climber: n >= 4 ? 1.6 + n * 0.25 : 0, spitter: n >= 6 ? 1.3 + n * 0.1 : 0, brute: n >= 5 ? (0.5 + n * 0.07) * (blood ? 2 : 1) : 0 };
  if (n === 2) wts.runner = 1.5;
  const tot = Object.values(wts).reduce((a, b) => a + b, 0), dur = BAL.spawnDur(n), q = [];
  for (let k = 0; k < count; k++) {
    let r = rand() * tot, type = 'walker';
    for (const key in wts) { r -= wts[key]; if (r <= 0) { type = key; break; } }
    const frac = k / count, burst = Math.floor(frac * 6) / 6;
    q.push({ t: lerp(burst, frac, 0.55) * dur + rand() * 3, k: type, side: rand() < 0.5 ? -1 : 1 });
  }
  if (blood) q.push({ t: dur * 0.55, k: 'boss', side: rand() < 0.5 ? -1 : 1 });
  q.sort((a, b) => a.t - b.t);
  W.spawnQ = q;
  emit({ k: 'night', n, blood: blood ? 1 : 0, count: q.length });
}
function dawn() {
  if (W.night >= BAL.nights && !W.endless) return endGame('win', '救援直升机到了');
  W.phase = 'day'; W.dayLen = W.clock = BAL.dayLen[1];
  W.spots.forEach(s => s.searched = false);
  for (const p of activeP()) {
    p.ready = false;
    if (p.dead) { p.dead = false; p.down = false; p.hp = Math.round(p.maxHp * BAL.respawnHp); p.x = RADIO.x + (p.i ? 1.2 : -1.2) * T; p.y = GY; p.vx = p.vy = 0; emit({ k: 'tp', p: p.i, x: p.x, y: p.y }); }
    else if (p.down) { p.down = false; p.hp = 30; }
  }
  emit({ k: 'dawn', n: W.night });
}
function spawnZombie(k, side) {
  const Z = ZT[k], n = Math.max(1, W.night), D = W.D;
  const hpM = BAL.hpMul(n) * D.hp * (k === 'boss' ? 1 + n / 10 : 1) * (activeP().length > 1 ? 1.15 : 1);
  const x = side < 0 ? (1 + rand() * 2.5) * T : (MW - 1 - rand() * 2.5) * T;
  const z = {
    id: W.zid++, k, x, y: GY, vx: 0, vy: 0, w: Z.w * T, h: Z.h * T, hp: Z.hp * hpM, max: Z.hp * hpM,
    spd: Z.spd * BAL.spdMul(n) * (0.85 + rand() * 0.3), face: -side, cd: rand(), st: 'walk', tgt: null, retT: 0, stun: 0, ride: 0,
    climbing: false, spitT: 1 + rand() * 2, hitT: 0, anim: rand() * 6, seed: (rand() * 1e6) | 0, bash: -1, atk: 0, lvl: 0,
  };
  W.zs.push(z);
  return z;
}
function stepPhase(dt) {
  if (W.over) return;
  if (W.phase === 'day') {
    W.clock -= dt;
    W.strayT -= dt;
    if (W.strayT <= 0 && W.night >= 1) {
      W.strayT = BAL.dayStragglerCD;
      if (W.zs.length < BAL.dayStragglers) spawnZombie(W.night >= 4 && rand() < 0.3 ? 'runner' : 'walker', rand() < 0.5 ? -1 : 1);
    }
    if (W.clock <= 0) startNight();
  } else if (W.phase === 'night') {
    W.nightT += dt;
    while (W.spawnQ.length && W.spawnQ[0].t <= W.nightT) { const s = W.spawnQ.shift(); spawnZombie(s.k, s.side); }
    if (!W.spawnQ.length && W.zs.length && W.zs.length <= 3 && W.nightT > BAL.spawnDur(W.night) + 240) { W.zs.forEach(z => { z.hp = 0; }); W.zs = []; say('残余的丧尸散去了'); }
    if (!W.spawnQ.length && !W.zs.length) dawn();
  }
}

/* ---------- projectiles ---------- */
function stepProj(dt) {
  for (const b of W.proj) {
    b.vy += GRAV * (b.k === 'acid' ? 0.55 : 0.75) * dt;
    if (b.k === 'nade') {
      b.t -= dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      if (solidFor(tileAt(Math.floor(nx / T), Math.floor(b.y / T)), 'p') || solidFor(tileAt(Math.floor(nx / T), Math.floor(b.y / T)), 'z')) { b.vx *= -0.4; } else b.x = nx;
      const ty = Math.floor(ny / T), tt = tileAt(Math.floor(b.x / T), ty);
      if (solidFor(tt, 'p') || solidFor(tt, 'z') || (b.vy > 0 && isPlat(Math.floor(b.x / T), ty) && b.y <= ty * T)) { if (b.vy > 0) b.y = ty * T - 1; b.vy *= -0.35; b.vx *= 0.7; if (Math.abs(b.vy) > 60) emit({ k: 'sfx', n: 'clink', x: b.x, y: b.y }); } else b.y = ny;
      if (b.t <= 0) { b.dead = true; explode(b.x, b.y, W.p[b.o]); }
    } else if (b.k === 'acid') {
      b.x += b.vx * dt; b.y += b.vy * dt;
      const tx = Math.floor(b.x / T), ty = Math.floor(b.y / T), t = tileAt(tx, ty);
      let hit = false;
      if (solidFor(t, 'b') || (b.vy > 0 && TF[t].plat)) { if (t !== DIRT) damageTile(ix(tx, ty), 9 * W.D.dmg); hit = true; }
      for (const p of W.p) if (standing(p) || p.down) if (Math.abs(p.x - b.x) < p.w / 2 + 6 && b.y > p.y - p.h && b.y < p.y + 2) { hurtPlayer(p, 11 * W.D.dmg); hit = true; }
      if (hit || b.y > MH * T) { b.dead = true; emit({ k: 'acid', x: r1(b.x), y: r1(b.y) }); }
    }
  }
  W.proj = W.proj.filter(b => !b.dead);
}
function explode(x, y, p) {
  const R = BAL.nadeR * T;
  for (const z of W.zs) {
    if (z.hp <= 0) continue;
    const d = dist(x, y, z.x, z.y - z.h / 2);
    if (d < R + z.w / 2) { const f = 1 - Math.max(0, d - z.w / 2) / R; hurtZombie(z, BAL.nadeDmg * (0.35 + 0.65 * f) * (1 + 0.12 * W.upg), p, sgn(z.x - x) * 380 * f); z.vy = -300 * f; z.ride = 0; }
  }
  emit({ k: 'boom', x: r1(x), y: r1(y) });
}

/* ---------- one host/solo tick ---------- */
function simStep(dt) {
  W.t += dt;
  for (const p of W.p) {
    if (p.gone) continue;
    if (p.i === ME) stepMove(p, dt);
    stepActions(p, dt);
  }
  if (!W.over) {
    stepPhase(dt);
    stepZombies(dt);
    stepProj(dt);
    W.radio.hitT = Math.max(0, W.radio.hitT - dt); W.radio.alarmT -= dt;
    checkLose();
  }
}
