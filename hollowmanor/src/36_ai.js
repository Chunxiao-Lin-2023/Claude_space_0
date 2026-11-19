/* ================= AI teammate (single player) =================
   The human is W.p[0]; the AI plays W.p[1] with the other role. It runs on the host like a second local player:
   it follows, does the jobs only its role can do when the human is close by, keeps the human alive, and talks.
   It never wanders off to solve the floor on its own. Q pings and the 1–4 quick calls steer it. */
const AI = { st: null };
function aiReset() { AI.st = { path: null, pathT: 0, goal: null, task: null, holdT: 0, stuck: 0, lastPos: null, say: {}, wait: 0, ping: null, seq: 0, knowCode: false, knowBells: false, sweep: 0, told: {} , pressGap: 0, mood: 0, bad: {} }; AI.grid = null; }
/* ---------- grid for walking (0.5 m cells): furniture blocks, locked doors block, the crack only lets the seer through ---------- */
function aiGrid() {
  if (AI.grid && AI.grid.fi === MAP.fi) return AI.grid;
  const { GW, GH, CS } = MAP, blk = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    if (MAP.cell[cellIdx(i, j)] < 0) { blk[cellIdx(i, j)] = 1; continue; }
    const cx = (i + 0.5) * CS, cz = (j + 0.5) * CS;
    for (const b of MAP.boxes) if (b.f != null && cx > b.x0 - 0.12 && cx < b.x1 + 0.12 && cz > b.z0 - 0.12 && cz < b.z1 + 0.12) { blk[cellIdx(i, j)] = 1; break; }
  }
  AI.grid = { fi: MAP.fi, blk }; return AI.grid;
}
function aiEdgeOK(code, did, role) {
  if (code === 0) return true; if (code !== 3) return false;
  const d = MAP.doors[did], st = W.doors[did];
  if (d.kind === 'crack') return role === 'S';
  return !st.locked;
}
function aiPath(p, tx, tz) {
  const { GW, GH, CS } = MAP, G = aiGrid(), n = GW * GH;
  const ci = (x, z) => cellIdx(clamp(Math.floor(x / CS), 0, GW - 1), clamp(Math.floor(z / CS), 0, GH - 1));
  const s = ci(p.x, p.z), t0 = ci(tx, tz);
  const from = new Int32Array(n).fill(-1), q = new Int32Array(n); let h = 0, e = 0; q[e++] = s; from[s] = s;
  let t = -1, best = s, bd = d2((s % GW + 0.5) * CS, (((s / GW) | 0) + 0.5) * CS, tx, tz);
  while (h < e) {
    const c = q[h++]; if (c === t0) { t = c; break; } const i = c % GW, j = (c / GW) | 0;
    const cd = d2((i + 0.5) * CS, (j + 0.5) * CS, tx, tz); if (cd < bd) { bd = cd; best = c; }
    const tryN = (nc, code, did) => { if (from[nc] >= 0 || G.blk[nc]) return; if (!aiEdgeOK(code, did, p.role)) return; from[nc] = c; q[e++] = nc; };
    if (i > 0) tryN(c - 1, MAP.vE[vIdx(i, j)], MAP.vD[vIdx(i, j)]);
    if (i < GW - 1) tryN(c + 1, MAP.vE[vIdx(i + 1, j)], MAP.vD[vIdx(i + 1, j)]);
    if (j > 0) tryN(c - GW, MAP.hE[hIdx(i, j)], MAP.hD[hIdx(i, j)]);
    if (j < GH - 1) tryN(c + GW, MAP.hE[hIdx(i, j + 1)], MAP.hD[hIdx(i, j + 1)]);
  }
  if (t < 0) { if (Math.sqrt(bd) > (p._reach || 1.6)) return null; t = best; } // can't stand on it: the closest reachable spot
  if (t === s) return [[tx, tz]];
  const pts = []; for (let c = t; c !== s; c = from[c]) pts.push([(c % GW + 0.5) * CS, (((c / GW) | 0) + 0.5) * CS]);
  pts.reverse();
  // string-pull: drop waypoints we can walk to directly
  const out = []; let ax = p.x, az = p.z;
  for (let k = 0; k < pts.length; k++) { const nx = pts[k + 1]; if (nx && aiClear(ax, az, nx[0], nx[1], p.role)) continue; out.push(pts[k]); ax = pts[k][0]; az = pts[k][1]; }
  if (!out.length && pts.length) out.push(pts[pts.length - 1]);
  return out;
}
function aiClear(x0, z0, x1, z1, role) {
  const G = aiGrid(), CS = MAP.CS, L = dist(x0, z0, x1, z1), n = Math.max(1, Math.ceil(L / 0.15));
  let ci = Math.floor(x0 / CS), cj = Math.floor(z0 / CS);
  for (let s = 1; s <= n; s++) {
    for (const off of [-0.22, 0.22]) { // the body is ~0.5 m wide: test both shoulders
      const nx = -(z1 - z0) / (L || 1) * off, nz = (x1 - x0) / (L || 1) * off, x = x0 + (x1 - x0) * s / n + nx, z = z0 + (z1 - z0) * s / n + nz;
      if (G.blk[cellIdx(clamp(Math.floor(x / CS), 0, MAP.GW - 1), clamp(Math.floor(z / CS), 0, MAP.GH - 1))]) return false;
    }
    const x = x0 + (x1 - x0) * s / n, z = z0 + (z1 - z0) * s / n, ni = Math.floor(x / CS), nj = Math.floor(z / CS);
    if (ni !== ci) { const c = MAP.vE[vIdx(Math.max(ci, ni), cj)]; if (!aiEdgeOK(c, MAP.vD[vIdx(Math.max(ci, ni), cj)], role)) return false; ci = ni; }
    if (nj !== cj) { const c = MAP.hE[hIdx(ci, Math.max(cj, nj))]; if (!aiEdgeOK(c, MAP.hD[hIdx(ci, Math.max(cj, nj))], role)) return false; cj = nj; }
  }
  return true;
}
/* walk toward (tx, tz); returns true when within r */
function aiGo(p, tx, tz, r, run) {
  const S = AI.st, d = dist(p.x, p.z, tx, tz), i = p.inp; p._reach = Math.max(r + 0.4, 1.0);
  if (d <= r) { i.mx = i.mz = 0; S.path = null; return true; }
  const repath = !S.path || !S.path.length || S.goal == null || dist(S.goal[0], S.goal[1], tx, tz) > 0.8 || W.t > S.pathT;
  if (repath) { S.path = aiClear(p.x, p.z, tx, tz, p.role) ? [[tx, tz]] : aiPath(p, tx, tz); S.goal = [tx, tz]; S.pathT = W.t + 1.2; }
  if (!S.path || !S.path.length) { i.mx = i.mz = 0; return false; }
  if (S.path.length === 1 && dist(S.path[0][0], S.path[0][1], tx, tz) > 0.3 && dist(p.x, p.z, S.path[0][0], S.path[0][1]) < 0.3 && d < r + 0.5) { i.mx = i.mz = 0; return true; }
  let wp = S.path[0]; if (dist(p.x, p.z, wp[0], wp[1]) < 0.3 && S.path.length > 1) { S.path.shift(); wp = S.path[0]; }
  const a = Math.atan2(wp[1] - p.z, wp[0] - p.x); i.mx = Math.cos(a); i.mz = Math.sin(a); i.run = !!run && p.stam > 0.6;
  // unstick: if we barely moved for a while, side-step and repath
  if (!S.lastPos || W.t - S.lastPos[2] > 0.6) { if (S.lastPos && dist(p.x, p.z, S.lastPos[0], S.lastPos[1]) < 0.12) { S.stuck++; S.pathT = 0; if (S.stuck > 1) { i.mx = Math.cos(a + HP * (S.stuck % 2 ? 1 : -1)); i.mz = Math.sin(a + HP * (S.stuck % 2 ? 1 : -1)); } } else S.stuck = 0; S.lastPos = [p.x, p.z, W.t]; }
  return false;
}
/* ---------- talking ---------- */
function aiSay(key, text, cd = 20) {
  const S = AI.st, ai = W.p[1]; if (W.t - (S.say[key] ?? -999) < cd) return; S.say[key] = W.t;
  emit({ k: 'bubble', by: ai.id, txt: text });
  say(ROLES[ai.role].who + '：' + text, -1, ROLES[ai.role].color);
}
/* ---------- the brain ---------- */
function aiTick(dt) {
  if (!W || W.phase !== 'play') return;
  if (!AI.st) aiReset();
  const S = AI.st, ai = W.p[1], me = W.p[0], i = ai.inp, G = W.g, R = ai.role;
  i.hold = false; i.mx = i.mz = 0; i.run = false;
  // react to the human's pings and quick calls
  for (const e of W.E) { if (e.s <= S.seq) continue; S.seq = e.s; if (e.by !== 0) continue;
    if (e.k === 'ping') { S.ping = { x: e.x, z: e.z, t: W.t }; S.wait = 0; aiSay('ping', pick(['好，我过去看看。', '收到。', '去那边？好。']), 3); }
    if (e.k === 'quick') { if (e.q === 'come') { S.ping = null; S.wait = 0; aiSay('come', '来了！', 2); } if (e.q === 'wait') { S.wait = W.t + 25; S.ping = null; aiSay('wait', '我在这儿等你。', 2); } if (e.q === 'danger') { S.hideNow = W.t + 12; aiSay('danger', '躲起来！', 2); } if (e.q === 'found') aiSay('found', '干得好！', 6); } }
  if (ai.down) return;
  aiChatter(ai, me);
  const hunting = G && (G.st === 'hunt' || (G.st === 'ritual' && !(W.rit && W.rit.by === ai.id))), dG = G ? dist(G.x, G.z, ai.x, ai.z) : 99, dMe = dist(me.x, me.z, ai.x, ai.z);
  const holder = R === 'L', seer = !holder;
  // the flashlight: track the ghost when it's close, otherwise sweep ahead; boost to save whoever it's chasing
  if (holder) {
    let aim = Math.hypot(ai.inp.mx, ai.inp.mz) > 0.1 ? Math.atan2(ai.inp.mz, ai.inp.mx) : ai.aim;
    S.sweep += dt * 0.9; aim += Math.sin(S.sweep) * 0.45;
    const gVis = G && G.st !== 'gone' && G.st !== 'banish' && dG < BAL.beamRange && los(ai.x, ai.z, G.x, G.z, W);
    if (gVis && (hunting || dG < 6)) aim = Math.atan2(G.z - ai.z, G.x - ai.x);
    // look at mirrors and the floor around for evidence when idle
    if (!gVis && !hunting && Math.floor(W.t / 4) % 3 === 0) { const m = MAP.mirrors.find(m => dist(m.x, m.z, ai.x, ai.z) < 6 && los(ai.x, ai.z, m.x, m.z, W)); if (m) aim = Math.atan2(m.z - ai.z, m.x - ai.x); }
    i.aim = ai.inp.aim + angDiff(ai.inp.aim, aim) * Math.min(1, dt * 8); ai.aim = i.aim;
    if (gVis && hunting && G.st !== 'stun' && dG < BAL.boostRange - 0.5 && ai.batt >= BAL.boostCost && Math.abs(angDiff(i.aim, Math.atan2(G.z - ai.z, G.x - ai.x))) < 0.3) {
      const threat = dist(G.x, G.z, me.x, me.z) < 5 || dG < 4.5 || (W.rit && W.rit.by === me.id);
      if (threat && W.t - (S.lastBoost || -9) > 0.8) { i.boost++; S.lastBoost = W.t; aiSay('boost', pick(['照住它了！快跑！', '别过来！', '定住了——快！']), 6); }
    }
  }
  // 1) the human is down: go and help them up
  if (me.down) { if (aiGo(ai, me.x, me.z, 0.9, true)) { i.act = 2000; if (!S.revStart) { i.press++; S.revStart = W.t; } i.hold = true; } aiSay('rev', '撑住，我来扶你！', 8); return; }
  S.revStart = 0;
  // 2) a hunt: the seer hides when it comes for her; the holder holds its ground near the human (and boosts, above)
  if (hunting || (S.hideNow && W.t < S.hideNow)) {
    const chasingMe = G.tgt === ai.id && dG < 8;
    if (ai.hide >= 0) { if (!hunting && W.t > (S.hideNow || 0)) { const hh = MAP.inter.find(x => x.k === 'hide' && x.hid === ai.hide); if (hh) { i.act = hh.id; i.press++; } } return; }
    if ((seer && dG < 9) || (holder && chasingMe && ai.batt < BAL.boostCost) || (S.hideNow && W.t < S.hideNow)) {
      const h = MAP.inter.filter(x => x.k === 'hide' && W.occ[x.hid] < 0).sort((a, b) => dist(a.x, a.z, ai.x, ai.z) - dist(b.x, b.z, ai.x, ai.z))[0];
      if (h && dist(h.x, h.z, ai.x, ai.z) < 7 && dist(h.x, h.z, G.x, G.z) > 2) { if (aiGo(ai, h.x, h.z, BAL.reach - 0.3, true)) { i.act = h.id; i.press++; aiSay('hid', '我躲起来了……', 10); } return; }
      // nowhere to hide: run away from it
      const a = Math.atan2(ai.z - G.z, ai.x - G.x); aiGo(ai, ai.x + Math.cos(a) * 4, ai.z + Math.sin(a) * 4, 0.5, true); return;
    }
    if (holder) { aiGo(ai, me.x, me.z, 2.2, true); return; }
  }
  if (ai.hide >= 0) { const hh = MAP.inter.find(x => x.k === 'hide' && x.hid === ai.hide); if (hh && W.t > S.pressGap) { i.act = hh.id; i.press++; S.pressGap = W.t + 1; } return; }
  // 3) a ritual is running: the holder guards the seer, the seer keeps chanting
  if (W.rit) {
    const by = W.p[W.rit.by];
    if (by === ai) { const it = MAP.inter.find(x => x.k === (W.rit.item === 'final' ? 'circle' : 'altar')); if (it) { i.act = it.id; i.hold = true; if (aiGo(ai, it.x, it.z, BAL.reach - 0.4)) { i.mx = i.mz = 0; } } if (W.rit.item === 'final' && dMe > BAL.finalGuard - 0.5) aiSay('guard', '阿岩，回到法阵旁边来！', 6); return; }
    if (holder) { const circ = W.rit.item === 'final' ? MAP.inter.find(x => x.k === 'circle') : null, cx = circ ? circ.x : by.x, cz = circ ? circ.z : by.z; aiGo(ai, cx + 1.4, cz + 1.2, circ ? BAL.finalGuard - 2.5 : 2.4); aiSay('guardL', '我守着你，念吧！', 30); return; }
  }
  // 4) waiting / going to a ping
  if (S.wait > W.t) return;
  if (S.ping) { if (aiGo(ai, S.ping.x, S.ping.z, 1.0, dist(ai.x, ai.z, S.ping.x, S.ping.z) > 5) || W.t - S.ping.t > 14) { if (W.t - S.ping.t > 3) S.ping = null; } else return; }
  // 5) a job for my role, close to the human
  const job = aiJob(ai, me);
  if (job) {
    if (job.say) aiSay(job.key || job.it.k, job.say, job.cd || 25);
    const reach = job.it.k === 'hide' ? BAL.reach : BAL.reach - 0.35;
    const arrived = aiGo(ai, job.x != null ? job.x : job.it.x, job.z != null ? job.z : job.it.z, job.r || reach, dist(ai.x, ai.z, job.it.x, job.it.z) > 6);
    if (!arrived && !S.path) { S.bad[job.it.id] = W.t + 10; return; } // can't get there (locked away): forget it for a while
    if (arrived) {
      if (job.run) { job.run(); return; }
      i.act = job.it.id; const tx = job.it.x2 != null && idist(ai, job.it) < dist(ai.x, ai.z, job.it.x, job.it.z) ? job.it.x2 : job.it.x, tz = tx === job.it.x2 ? job.it.z2 : job.it.z; ai.a = Math.atan2(tz - ai.z, tx - ai.x);
      const holdT = PZ[job.it.k].hold ? PZ[job.it.k].hold(ai, job.it) : 0;
      if (holdT > 0) { if (!ai.act || ai.act.id !== job.it.id) { if (W.t > S.pressGap) { i.press++; S.pressGap = W.t + 0.4; } } i.hold = true; }
      else if (W.t > S.pressGap) { i.press++; S.pressGap = W.t + (job.gap || 1.2); }
    }
    return;
  }
  // 6) follow the human: a step behind, beside their light
  const back = me.aim + PI + (holder ? -0.6 : 0.6), fx = me.x + Math.cos(back) * 1.6, fz = me.z + Math.sin(back) * 1.6;
  if (dMe > 2.4) aiGo(ai, fx, fz, 0.6, dMe > 3.5); else if (dMe < 1.0) { const a = Math.atan2(ai.z - me.z, ai.x - me.x); i.mx = Math.cos(a) * 0.5; i.mz = Math.sin(a) * 0.5; }
  if (seer) { ai.inp.aim = Math.atan2(me.z - ai.z, me.x - ai.x); ai.aim = ai.inp.aim; }
}
/* what useful thing can I do right now (only things near the human, so the AI never runs the floor alone) */
function aiJob(ai, me) {
  const S = AI.st, R = ai.role, near = (x, z, r = 9) => dist(x, z, me.x, me.z) < r || dist(x, z, ai.x, ai.z) < 3.5;
  const list = interactList(ai, W).filter(it => { const pz = PZ[it.k]; if (!pz) return false; if ((S.bad[it.id] || 0) > W.t) return false; if (pz.skip && pz.skip(it, W, ai)) return false; const r = roleOf(it, W); return r === '*' || r === R; });
  const by = k => list.filter(it => it.k === k).sort((a, b) => dist(a.x, a.z, ai.x, ai.z) - dist(b.x, b.z, ai.x, ai.z));
  const ok = it => { const pr = promptFor(ai, it, W); return pr && pr.ok; };
  // climb together: when the seal is gone and the human heads for the stairs / hatch, go with them
  if (!W.f.seal) { const st = MAP.inter.find(x => x.k === 'stairs' || x.k === 'hatch'); if (st && dist(me.x, me.z, st.x, st.z) < 6) return { it: st, say: st.k === 'hatch' ? '一起出去！' : '走，上楼。', key: 'climb', cd: 15, r: 1.6, run: () => { } }; }
  // items I can see nearby (the bag is shared)
  for (const it of by('item')) if (dist(it.x, it.z, ai.x, ai.z) < 5 && los(ai.x, ai.z, it.x, it.z, W) && near(it.x, it.z)) return { it, say: '这里有东西，我去拿。', key: 'item', cd: 12 };
  // twin levers: pull the one the human isn't at, when they're at the other
  const levers = by('lever'); if (levers.length === 2 && !W.f[MAP.F.leverFlag]) { const mine = levers.find(l => dist(l.x, l.z, me.x, me.z) > 3), theirs = levers.find(l => l !== mine && dist(l.x, l.z, me.x, me.z) < 2.2); if (mine && (theirs || W.lv[1 - mine.lv] > 0) && W.lv[mine.lv] <= 0) return { it: mine, say: '你拉那根，我拉这根——一起！', key: 'lever', cd: 10 }; }
  if (R === 'L') {
    for (const it of by('fuse')) if (W.inv.includes('fuse') && !W.f.power && near(it.x, it.z)) return { it, say: '保险丝给我，我来装。' };
    for (const it of by('valve')) if (!W.f.drained && near(it.x, it.z, 7)) return { it, say: '我来拧开阀门。' };
    for (const it of by('shelf')) if (near(it.x, it.z, 6) && dist(me.x, me.z, it.x, it.z) < 4) return { it, say: '这个书架？我来推。' };
    for (const it of by('anchor')) if (W.anchors[it.ai] === 1 && near(it.x, it.z)) return { it, say: '它现形了——我来砸碎！', key: 'smash', cd: 8 };
    for (const it of by('lamp')) if (dist(it.x, it.z, ai.x, ai.z) < 5 && near(it.x, it.z)) return { it, say: '点灯，她怕光。', key: 'lamp', cd: 40, gap: 0.5 };
    for (const it of by('locked')) if (ok(it) && near(it.x, it.z, 6)) return { it, say: '钥匙在这儿，我来开。' };
    // rune lock: once the seer has read the code, turn the dials
    const rn = by('rune')[0]; if (rn && S.knowCode && near(rn.x, rn.z, 8)) return { it: rn, say: '密码我记住了，我来转。', run: () => { W.setup.code.forEach((g, k) => setDial(ai.id, k, g)); } };
    // bells: ring them in the order the seer has seen
    const bl = by('bell'); if (bl.length && !W.f.bells && S.knowBells) { const nx = W.setup.bells[W.bellN], it = bl.find(b => b.bi === nx); if (it) return { it, say: '按你说的顺序敲。', key: 'bells', cd: 30, gap: 1.0 }; }
  } else {
    for (const it of by('bolt')) if (near(it.x, it.z, 10)) return { it, say: '裂缝我挤得过去，我去开门闩。', key: 'bolt' };
    for (const it of by('anchor')) if (W.anchors[it.ai] === 0 && near(it.x, it.z) && dist(it.x, it.z, ai.x, ai.z) < 6) return { it, say: '这里有镇物——我先解开灵缚。', key: 'unbind', cd: 8 };
    // ritual: once we know what it is and have its relic
    const al = by('altar')[0], gt = W.setup.gtype, known = gt === 'boss' || Object.keys(W.evFound || {}).length >= 2, item = gt !== 'boss' && GT(gt).item;
    if (al && W.f.seal && !W.rit && known && item && W.inv.includes(item) && near(al.x, al.z, 9)) return { it: al, say: '是「' + GT(gt).name + '」。' + ITEMS[item].name + '在我们手里——我去' + (al.label || '祭坛') + '，你守着我！', key: 'ritual', cd: 30, run: () => { startRitual(ai.id, item); ai.inp.act = al.id; ai.inp.press++; ai.inp.hold = true; } };
    const ci = by('circle')[0]; if (ci && W.f.seal && !W.rit && dist(me.x, me.z, ci.x, ci.z) < BAL.finalGuard - 1) return { it: ci, say: '我进法阵了。别离开我身边！', key: 'circle', cd: 20 };
  }
  return null;
}
/* the seer tells what only she can see; the holder reacts */
function aiChatter(ai, me) {
  const S = AI.st, st = W.setup; if (!st) return;
  const seerP = ai.role === 'S' ? ai : me, holder = ai.role === 'L';
  // the code on the wall
  if (st.codeSpot && MAP.F.runeFlag && !W.f[MAP.F.runeFlag] && dist(seerP.x, seerP.z, st.codeSpot.x, st.codeSpot.z) < 4.5 && los(seerP.x, seerP.z, st.codeSpot.x, st.codeSpot.z, W)) {
    if (holder) { if (!S.knowCode) { S.knowCode = true; aiSay('codeL', '你看到墙上的符文了？记住了，带我去转盘。', 999); } }
    else aiSay('code', '墙上写着符文：' + st.code.map(g => GLYPHS[g]).join(' ') + '——符文锁要按这个顺序转。', 60);
  }
  // the bell order
  if (st.bells && !W.f.bells) { const b0 = MAP.furn.find(f => f.o.bell === st.bells[0]); if (b0 && dist(seerP.x, seerP.z, b0.x, b0.z) < 7) {
    if (holder) { if (!S.knowBells) { S.knowBells = true; aiSay('bellsL', '铃上有数字？你看着，我来按顺序敲。', 999); } }
    else { const nx = MAP.furn.find(f => f.o.bell === st.bells[W.bellN]); if (nx && S.told.bell !== W.bellN) { S.told.bell = W.bellN; emit({ k: 'ping', x: nx.x, z: nx.z, by: ai.id }); aiSay('bellN' + W.bellN, (W.bellN ? '下一只' : '第一只') + '是这只——我标出来了。', 3); } } } }
  // the draft behind the shelf
  const shelf = MAP.doors.find(d => d.kind === 'shelf'); if (shelf && !holder && W.doors[shelf.idx].open < 0.5 && dist(ai.x, ai.z, shelf.cx, shelf.cz) < 5) { if (!S.told.shelf) { S.told.shelf = 1; emit({ k: 'ping', x: shelf.cx, z: shelf.cz, by: ai.id }); } aiSay('shelf', '这个书架后面在漏冷风……推开它试试？', 90); }
  // evidence the seer notices
  if (!holder && st.ev) st.ev.forEach((e, k) => { if (W.evSeen[k] && (e.k === 'prints' || e.k === 'orbs') && !S.told['ev' + k]) { S.told['ev' + k] = 1; aiSay('ev' + k, e.k === 'prints' ? '墙上有发光的手印……是灵痕。' : '这里飘着灵球。', 2); } });
  if (holder && W.evFound && W.evFound.frost && !S.told.frost) { S.told.frost = 1; aiSay('frost', '手电照到霜了！地板上结了一层冰。', 2); }
  if (holder && W.evFound && W.evFound.mirror && !S.told.mirror) { S.told.mirror = 1; aiSay('mirror', '镜子里……站着一个人。', 2); }
  // the ghost, seen only by the seer
  if (!holder && W.g && W.g.st !== 'gone' && dist(W.g.x, W.g.z, ai.x, ai.z) < 8 && los(ai.x, ai.z, W.g.x, W.g.z, W)) { const a = Math.atan2(W.g.z - me.z, W.g.x - me.x), dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? '右边' : '左边') : (Math.sin(a) > 0 ? '下方' : '上方'); aiSay('ghost', '它在你' + dir + '……别出声。', 25); }
  // the right relic, once the type is known
  const gt = st.gtype; if (gt !== 'boss' && Object.keys(W.evFound || {}).length >= 2 && !S.told.type) { S.told.type = 1; aiSay('type', '两种证据都齐了——是「' + GT(gt).name + '」，它怕' + ITEMS[GT(gt).item].name + '。', 2); }
  // remind what's next
  if (W.t - (S.lastHint || 0) > 70) { S.lastHint = W.t; const o = MAP.F.objectives ? MAP.F.objectives(W).find(x => !x.done) : null; if (o) aiSay('hint', '接下来：' + o.t, 1); }
}
