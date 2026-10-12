/* ================= the ghost ================= */
function ghostGo(x, z) { const G = W.g; G.path = pathFind(G.x, G.z, x, z); G.goal = [x, z]; }
function ghostFollow(dt, speed) {
  const G = W.g; if (!G.path || !G.path.length) { G.spd = 0; return true; }
  const [tx, tz] = G.path[0], d = dist(G.x, G.z, tx, tz), step = speed * dt;
  if (d <= step) { G.x = tx; G.z = tz; G.path.shift(); }
  else { G.x += (tx - G.x) / d * step; G.z += (tz - G.z) / d * step; }
  const want = Math.atan2(tz - G.z, tx - G.x); if (d > 0.05) G.a += angDiff(G.a, want) * Math.min(1, dt * 6);
  G.spd = speed; return !G.path.length;
}
function playerVisibleToGhost(p) {
  const G = W.g; if (p.hide >= 0 || p.down) return false;
  const d = dist(G.x, G.z, p.x, p.z); if (d > 14) return false;
  return los(G.x, G.z, p.x, p.z, W);
}
function stepGhost(dt) {
  const G = W.g, gt = GHOSTS[W.setup.gtype];
  G.stT -= dt;
  // manifestation level (what the holder can see without the beam)
  if (G.st === 'hunt' || G.st === 'ritual') G.man = 0.75 + (Math.random() < 0.08 ? -0.6 : 0);
  else if (G.st === 'stun') G.man = 1;
  else if (G.st === 'warn') G.man = Math.random() < 0.1 ? 0.5 : 0;
  else G.man = Math.max(0, G.man - dt * 0.8);
  if (G.st === 'banish') { G.fade = clamp(G.stT / 3.5, 0, 1); G.man = 1; if (G.stT <= 0) { G.st = 'gone'; G.fade = 0; } return; }
  if (G.st === 'gone') return;
  // clock chime (atmosphere; the keeper hunts right after it)
  W.chime -= dt; if (W.chime <= 0) { W.chime = rr(70, 110); snd('chime', 21.7, 12.6, 1.2); if (gt.quirk === 'clock' && G.st === 'roam' && W.t > 60) W.huntCD = Math.min(W.huntCD, 4); }
  const avgFear = (W.p[0].fear + W.p[1].fear) / 2;
  if (G.st === 'roam') {
    W.huntCD -= dt * (0.7 + avgFear / 70 + G.rage * 0.4);
    if (W.huntCD <= 0 && !W.rit) { ghostWarn(); return; }
    // wander
    if (!G.path || !G.path.length) {
      G.dwell -= dt; G.spd = 0;
      if (G.dwell <= 0) {
        const r = RNG() < 0.55 ? W.setup.haunt : RNG() < 0.5 ? roomAt(...nearestPlayerPos()) : Math.floor(RNG() * MAP.rooms.length);
        const [x, z] = randomFloorIn(r >= 0 ? r : W.setup.haunt, 0.8); ghostGo(x, z); G.dwell = rr(3, 9);
      }
    } else ghostFollow(dt, BAL.gRoam);
    // ambient events
    W.eventCD -= dt * (0.8 + avgFear / 120);
    if (W.eventCD <= 0) { W.eventCD = rr(...BAL.eventCD); ghostEvent(); }
    // flashed / seen ghosts drift away
    return;
  }
  if (G.st === 'warn') {
    W.flick = 0.8; W.flickT = 0.5;
    if (G.stT <= 0) ghostStartHunt(false);
    return;
  }
  if (G.st === 'stun') { G.spd = 0; if (G.stT <= 0) { if (G.stuns >= BAL.stunsToBreak && !W.rit) ghostEndHunt(false); else { G.st = W.rit ? 'ritual' : 'hunt'; } } return; }
  if (G.st === 'hunt' || G.st === 'ritual') {
    G.huntT -= dt; W.flick = 0.55; W.flickT = 0.4;
    if (G.st === 'hunt' && G.huntT <= 0) { ghostEndHunt(false); return; }
    // choose / keep target
    const ps = W.p.filter(p => !p.down);
    if (!ps.length) return;
    let tgt = W.p[G.tgt];
    if (G.st === 'ritual') tgt = W.p[W.rit ? W.rit.by : G.tgt];
    if (!tgt || tgt.down) { tgt = ps.reduce((a, b) => (a.fear - dist(G.x, G.z, a.x, a.z) * 3 > b.fear - dist(G.x, G.z, b.x, b.z) * 3 ? a : b)); G.tgt = tgt.id; }
    // switch to a visible player if the target is out of sight
    if (G.st === 'hunt' && !playerVisibleToGhost(tgt)) { const v = ps.find(p => playerVisibleToGhost(p)); if (v) { tgt = v; G.tgt = v.id; } }
    // hearing: running players nearby
    for (const p of ps) { const d = dist(G.x, G.z, p.x, p.z); if (p.hide < 0 && ((p.run && d < BAL.hearRun) || (p.noise > 0 && d < BAL.hearRun) || d < BAL.hearWalk)) { G.lastX = p.x; G.lastZ = p.z; G.lost = 0; if (G.st === 'hunt') { tgt = p; G.tgt = p.id; } } }
    const sees = playerVisibleToGhost(tgt);
    if (sees) { G.lastX = tgt.x; G.lastZ = tgt.z; G.lost = 0; } else G.lost += dt;
    // speed: slowed by the flashlight beam
    const lit = beamFactor(W, G.x, 1.2, G.z) > 0.15;
    let sp = (lit ? BAL.gHuntSlow : BAL.gHunt) * (1 + G.rage * 0.12) * (G.st === 'ritual' ? 0.75 : 1);
    G.repath = (G.repath || 0) - dt;
    if (tgt.hide >= 0) {
      // hidden target: only found if the ghost saw them get in
      const h = MAP.hides[tgt.hide];
      if (tgt.hiddenSeen) { if (G.repath <= 0) { ghostGo(h.fx, h.fz); G.repath = 0.5; } ghostFollow(dt, sp); if (dist(G.x, G.z, h.fx, h.fz) < 0.9) { W.hideA[tgt.hide] = W.t; tgt.hide = -1; W.occ[h.id] = -1; tgt.x = h.fx; tgt.z = h.fz; tgt.hiddenSeen = false; ghostCatch(tgt); } return; }
      else { G.tgt = -1; if (G.repath <= 0) { const [x, z] = randomFloorIn(roomAt(G.x, G.z) >= 0 ? roomAt(G.x, G.z) : W.setup.haunt, 0.8); ghostGo(x, z); G.repath = 3; } ghostFollow(dt, sp * 0.6); return; }
    }
    if (sees || G.lost < BAL.loseSight || G.st === 'ritual') {
      const tx = sees || G.st === 'ritual' ? tgt.x : G.lastX, tz = sees || G.st === 'ritual' ? tgt.z : G.lastZ;
      if (G.repath <= 0 || !G.path || !G.path.length) { if (los(G.x, G.z, tx, tz, null, true)) G.path = [[tx, tz]]; else ghostGo(tx, tz); G.repath = 0.35; }
      ghostFollow(dt, sp);
    } else {
      // search around the last known position
      if (!G.path || !G.path.length) { const r = roomAt(G.lastX, G.lastZ); const [x, z] = randomFloorIn(r >= 0 ? r : W.setup.haunt, 0.8); ghostGo(x, z); }
      ghostFollow(dt, sp * 0.7);
    }
    // catch
    for (const p of ps) if (p.hide < 0 && dist(G.x, G.z, p.x, p.z) < BAL.catchR) { ghostCatch(p); break; }
  }
}
function nearestPlayerPos() { const G = W.g; const p = W.p.reduce((a, b) => dist(G.x, G.z, a.x, a.z) < dist(G.x, G.z, b.x, b.z) ? a : b); return [p.x, p.z]; }
function ghostWarn() {
  const G = W.g, gt = GHOSTS[W.setup.gtype];
  G.st = 'warn'; G.stT = BAL.warnT; G.path = null;
  // a hunt far from everyone teleports closer so it is never toothless
  const [px, pz] = nearestPlayerPos();
  if (dist(G.x, G.z, px, pz) > 14) { const r = roomAt(px, pz), cand = MAP.rooms.filter(q => q.idx !== r && dist(q.cx, q.cz, px, pz) < 13 && q.id !== 'util'); const room = cand.length ? pick(cand).idx : W.setup.haunt; [G.x, G.z] = randomFloorIn(room, 0.8); }
  snd('huntWarn', G.x, G.z, 1.5); if (gt.quirk === 'wail') snd('wail', G.x, G.z, 1.3); if (gt.quirk === 'giggle') snd('giggle', G.x, G.z, 1.2);
  emit({ k: 'fx', fx: 'warn' });
}
function ghostStartHunt(enraged, len) {
  const G = W.g; G.st = 'hunt'; G.huntT = len || rr(...BAL.huntLen); G.stuns = 0; G.tgt = -1; G.lost = 0; G.path = null; G.repath = 0;
  W.stats.hunts++; snd('huntStart', G.x, G.z, 1.5); emit({ k: 'fx', fx: 'hunt' }); fearSpike(G.x, G.z, 14, 12);
}
function ghostEndHunt(fromRitual) {
  const G = W.g; if (G.st === 'banish' || G.st === 'gone') return;
  G.st = 'roam'; G.path = null; G.dwell = rr(2, 5); W.huntCD = rr(...BAL.huntCD) * (G.rage ? 0.7 : 1); G.rage = Math.max(0, G.rage - 0.5);
  // vanish and reappear in the haunt room
  [G.x, G.z] = randomFloorIn(W.setup.haunt, 0.8); W.flick = 0;
  snd('huntEnd', G.x, G.z, 1); emit({ k: 'fx', fx: 'huntEnd' });
  if (!fromRitual) say('四周突然安静了下来……', -1, '#8fd3ff');
}
function ghostRitual() {
  const G = W.g, al = MAP.inter.find(x => x.k === 'altar');
  // the ghost comes in through the chapel doors
  G.st = 'ritual'; G.tgt = W.rit.by; G.stuns = 0; G.path = null; G.repath = 0;
  if (dist(G.x, G.z, al.x, al.z) < 5) { G.x = 29; G.z = 9.5; }
  if (roomAt(G.x, G.z) !== roomAt(al.x, al.z)) { G.x = 29 + rr(-1.5, 1.5); G.z = 9.6; }
  snd('huntStart', G.x, G.z, 1.5); emit({ k: 'fx', fx: 'hunt' });
}
function ghostStunned(by) {
  const G = W.g;
  if (G.st === 'hunt' || G.st === 'ritual' || G.st === 'stun') { G.st = 'stun'; G.stT = BAL.stunT; G.stuns++; W.stats.stuns++; snd('ghostHit', G.x, G.z, 1.3); say(G.stuns >= BAL.stunsToBreak && !W.rit ? '强光击退了怨灵！' : '怨灵被强光定住了！', -1, '#ffe08a'); return; }
  // outside hunts: a flash makes it shriek and flee, delaying the next hunt
  if (G.st === 'roam' || G.st === 'warn') { snd('ghostHit', G.x, G.z, 1); G.man = 1; W.huntCD += 8; [G.x, G.z] = randomFloorIn(W.setup.haunt, 0.8); G.path = null; if (G.st === 'warn') { G.st = 'roam'; W.flick = 0; } }
}
function ghostCatch(p) {
  if (p.down) return;
  p.down = true; p.downT = BAL.downT; p.act = null; p.fear = 100; W.stats.downs++;
  snd('caught', p.x, p.z, 1.5); emit({ k: 'fx', fx: 'caught', who: p.id });
  say(ROLES[p.role].name + '被怨灵抓住，倒下了！快去扶起来（' + BAL.downT + ' 秒）', -1, '#ff6b6b');
  if (W.rit && W.rit.by === p.id) { W.rit = null; say('仪式被打断了……遗物还在，可以再试一次', -1, '#ffb36b'); }
  const o = W.p[1 - p.id];
  if (!o.down) { const G = W.g; G.tgt = -1; G.huntT = Math.min(G.huntT, 4); if (G.st === 'ritual') ghostEndHunt(true); }
}
/* ambient haunting */
function ghostEvent() {
  const G = W.g, gt = GHOSTS[W.setup.gtype], roll = RNG();
  const near = W.p.filter(p => dist(p.x, p.z, G.x, G.z) < 10);
  if (roll < 0.22) { // slam a door near the ghost
    let best = null, bd = 9; MAP.doors.forEach((d, i) => { const st = W.doors[i]; if (d.kind !== 'door' || st.locked || st.tgt < 1) return; const dd = dist(d.cx, d.cz, G.x, G.z); if (dd < bd && !W.p.some(p => dist(p.x, p.z, d.cx, d.cz) < 1.2)) { bd = dd; best = i; } });
    if (best != null) { W.doors[best].tgt = 0; const d = MAP.doors[best]; snd('slam', d.cx, d.cz, 1.4); fearSpike(d.cx, d.cz, BAL.fearEvent); return; }
  }
  if (roll < 0.36 && W.f.power) { W.flick = 0.7; W.flickT = rr(1.2, 2.4); snd('buzz', G.x, G.z, 0.8); fearSpike(G.x, G.z, BAL.fearEvent * 0.6, 10); return; }
  if (roll < 0.52 && near.length) { // brief apparition near a player
    const p = pick(near); G.man = 0.9; snd('stinger', G.x, G.z, 1); fearSpike(G.x, G.z, BAL.fearEvent * 1.3, 9); return;
  }
  if (roll < 0.64 && MAP.rooms[roomAt(G.x, G.z)] && MAP.rooms[roomAt(G.x, G.z)].id === 'music') { snd('piano', 11.4, 3.4, 1.2); fearSpike(G.x, G.z, BAL.fearEvent, 12); return; }
  if (roll < 0.76) { const q = gt.quirk === 'giggle' ? 'giggle' : gt.quirk === 'wail' ? 'wail' : 'whisper'; snd(q, G.x, G.z, 1); fearSpike(G.x, G.z, BAL.fearEvent * 0.6); return; }
  if (roll < 0.88 && near.length) { const p = pick(near); const a = RNG() * TAU; snd(gt.quirk === 'silent' ? 'creak' : 'steps', p.x + Math.cos(a) * 3, p.z + Math.sin(a) * 3, 1); fearSpike(p.x, p.z, BAL.fearEvent * 0.5); return; }
  snd('knock', G.x, G.z, 1.1); fearSpike(G.x, G.z, BAL.fearEvent * 0.5);
}
