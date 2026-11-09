/* ================= rules: rounds, collisions, knocks, whistles, computer hider ================= */
const mkPl = () => ({ x: 0, y: 0, d: 0, mv: 0, dg: null, gone: 0 });
const seekerIdx = () => 1 - G.hider;
const amHider = () => G && ME === G.hider;
const isPlay = () => STATE.mode === 'play' && G;

function newRound(o) {
  useScene(o.scene || 'house');
  G = { seed: o.seed, scene: SCENE === SCENES[o.scene] ? o.scene : 'house', mode: o.mode, round: o.round || 1, score: o.score || [0, 0], hider: o.hider, ai: o.ai ? 1 : 0, names: o.names || ['你', '电脑'],
    phase: '', t: 0, wrong: 0, maxWrong: o.mode === 'rt' ? BAL.finalKnocks : BAL.turnWrong, kn: BAL.knockStart, regenT: BAL.knockRegen, fin: 0, kcd: 0, wT: 0, tauntCD: 0, turnN: 0, hints: [], res: null, aiT: 0, q: 0,
    pl: [mkPl(), mkPl()] };
  MAP = genMap(G.seed);
  const h = G.pl[G.hider], s = G.pl[seekerIdx()];
  [h.x, h.y] = SPAWN_HIDE; [s.x, s.y] = SPAWN_SEEK; s.d = Math.PI;
  if (G.mode === 'rt') { G.phase = 'hide'; G.t = G.ai ? BAL.hideTSolo : BAL.hideT; if (G.ai) { aiHide(); G.aiT = rr(14, 24); } }
  else { G.phase = 'place'; G.t = BAL.placeT; if (G.ai) { aiHide(); nextSeekTurn(); } }
}

/* ---------- geometry & collision ---------- */
const HB = 0.26;
function plBox(p, x, y) { return p.dg && !T[p.dg.k].flat ? fpOf(p.dg.k, p.dg.r, x, y) : [x - HB, y - HB, x + HB, y + HB]; }
const distFp = (x, y, f) => Math.hypot(Math.max(f[0] - x, 0, x - f[2]), Math.max(f[1] - y, 0, y - f[3]));
function blocked(box, self) {
  if (box[0] < -.2 || box[1] < -.2 || box[2] > HOUSE.w + .2 || box[3] > HOUSE.h + .2) return true;
  for (const w of WALLS) if (ovl(box, w.fp)) return true;
  for (const it of MAP.items) if (!it.flat && ovl(box, it.fp)) return true;
  if (G.mode === 'rt') { const o = G.pl[1 - self]; if (o && !o.gone && ovl(box, plBox(o, o.x, o.y))) return true; }
  return false;
}
function movePl(i, dx, dy) {
  const p = G.pl[i];
  if (blocked(plBox(p, p.x, p.y), i)) { p.x += dx; p.y += dy; return; }   // squeezed in: let it walk out
  if (dx && !blocked(plBox(p, p.x + dx, p.y), i)) p.x += dx;
  if (dy && !blocked(plBox(p, p.x, p.y + dy), i)) p.y += dy;
}
const OFFS = (() => { const o = [[0, 0]]; for (let r = .1; r <= .81; r += .1) for (let a = 0; a < 16; a++) o.push([Math.round(Math.cos(a / 16 * 6.2832) * r * 100) / 100, Math.round(Math.sin(a / 16 * 6.2832) * r * 100) / 100]); return o; })();
function findFit(i, dg, x, y) { const q = { dg }; for (const [ox, oy] of OFFS) if (!blocked(plBox(q, x + ox, y + oy), i)) return [x + ox, y + oy]; return null; }
function segHitsWall(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / .05);
  for (let i = 1; i < n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); for (const w of WALLS) if (x > w.fp[0] && x < w.fp[2] && y > w.fp[1] && y < w.fp[3]) return true; }
  return false;
}
// rooms the seeker can currently see (realtime). Turn mode: the whole house.
function litRooms() { if (!G || G.mode === 'turn') return ROOMS.map(r => r.i); const s = G.pl[seekerIdx()]; return roomsNear(s.x, s.y, .4); }
function hiderSeen() { if (G.mode === 'turn') return true; const lit = litRooms(), h = G.pl[G.hider]; return roomsNear(h.x, h.y, 0).some(i => lit.includes(i)); }

/* ---------- hider: copy / rotate / revert (run on the hider's own machine) ---------- */
function tryDisguise(i, it) {
  const p = G.pl[i], dg = { k: it.k, v: it.v, r: it.r };
  if (p.dg && p.dg.k === dg.k && p.dg.v === dg.v && p.dg.r === dg.r) return null;
  const sp = findFit(i, dg, p.x, p.y); if (!sp) return '这里放不下' + T[it.k].n;
  p.x = sp[0]; p.y = sp[1]; p.dg = dg; return null;
}
function rotateDisguise(i) {
  const p = G.pl[i]; if (!p.dg) return null;
  const dg = { k: p.dg.k, v: p.dg.v, r: (p.dg.r + 1) & 3 }, sp = findFit(i, dg, p.x, p.y);
  if (!sp) return '转不开'; p.x = sp[0]; p.y = sp[1]; p.dg = dg; return null;
}
function autoDisguise(i) {
  const p = G.pl[i]; const list = MAP.items.filter(it => !it.flat).map(it => [distFp(p.x, p.y, it.fp), it]).sort((a, b) => a[0] - b[0]);
  for (const [d, it] of list.slice(0, 12)) if (!tryDisguise(i, it)) { toast('时间到，自动变成了' + T[it.k].n); return; }
  toast('附近没有能变的东西，你还是人形！', 'bad');
}

/* ---------- actions (host/solo authoritative) ---------- */
function act(a, v) { if (NETROLE === 'guest') netSend({ t: 'act', a, v: v || {} }); else { const e = doAct(ME, a, v || {}); if (e) { toast(e, 'bad'); sfx('err'); } } }
function doAct(i, a, v) {
  if (!G || G.phase === 'end') return;
  switch (a) {
    case 'knock': {
      if (i === G.hider || G.phase !== 'seek') return;
      const s = G.pl[i], rt = G.mode === 'rt';
      if (rt && G.kcd > 0) return;
      if (rt && G.kn <= 0) return G.fin ? '最后的敲击次数用完了' : '没有敲击次数了，等它恢复';
      const h = G.pl[G.hider];
      if (v.id === -1) {
        if (!hiderSeen()) return;
        if (rt && distFp(s.x, s.y, plBox(h, h.x, h.y)) > BAL.reach + .6) return '太远了，走近一点';
        emit({ e: 'knock', id: -1, ok: 1 }); endRound('seeker', 'caught'); return;
      }
      const it = MAP.items[v.id]; if (!it) return;
      if (rt) { if (!litRooms().includes(it.room)) return; if (distFp(s.x, s.y, it.fp) > BAL.reach + .6) return '太远了，走近一点'; }
      if (!rt && G.hints.some(q => q[0] === it.id)) return '这件已经敲过了';
      G.kcd = BAL.knockCD; G.wrong++; if (rt) G.kn--;
      const dist = Math.hypot(it.x - h.x, it.y - h.y);
      if (rt) {
        const near = dist < BAL.nearHint ? 1 : 0; emit({ e: 'knock', id: it.id, ok: 0, near });
        if (near && G.ai) G.aiT = Math.min(G.aiT, 4);
        if (G.fin && G.kn <= 0) endRound('hider', 'taps');
      } else {
        const band = bandOf(dist); G.hints.push([it.id, band]); emit({ e: 'knock', id: it.id, ok: 0, band });
        if (G.wrong >= G.maxWrong) endRound('hider', 'taps');
        else { G.phase = 'hturn'; G.t = BAL.hideTurnT; G.aiT = 1.3; emit({ e: 'hturn' }); }
      }
      return;
    }
    case 'taunt':
      if (i !== G.hider || G.mode !== 'rt' || G.phase !== 'seek' || G.fin || G.tauntCD > 0) return;
      whistle(1); G.t = Math.max(BAL.finalT + .05, G.t - BAL.tauntCut); G.tauntCD = BAL.tauntCD; return;
    case 'place': case 'tmove': {
      if (i !== G.hider || G.mode !== 'turn' || G.phase !== (a === 'place' ? 'place' : 'hturn')) return;
      const e = checkPlace(i, v, a); if (e) return e;
      const p = G.pl[i]; p.x = v.x; p.y = v.y; p.dg = { k: v.k, v: v.v, r: v.r & 3 };
      if (a === 'place') emit({ e: 'placed' }); else emit({ e: 'hdone', moved: 1 });
      nextSeekTurn(); return;
    }
    case 'tpass':
      if (i !== G.hider || G.mode !== 'turn' || G.phase !== 'hturn') return;
      emit({ e: 'hdone', moved: 0 }); nextSeekTurn(); return;
  }
}
const typesInRoom = ri => new Set(MAP.items.filter(it => it.room === ri).map(it => it.k + '|' + it.v));
function checkPlace(i, v, a) {
  if (!v || !T[v.k] || !isFinite(v.x) || !isFinite(v.y)) return '无效位置';
  const room = roomAt(v.x, v.y); if (!room) return '要藏在房子或花园里';
  const box = T[v.k].flat ? [v.x - HB, v.y - HB, v.x + HB, v.y + HB] : fpOf(v.k, v.r & 3, v.x, v.y);
  if (blocked(box, i)) return '这里放不下';
  if (a === 'place') { if (!typesInRoom(room.i).has(v.k + '|' + v.v)) return room.n + '里没有这样的' + T[v.k].n + '，会很显眼'; return null; }
  const p = G.pl[i], same = p.dg && p.dg.k === v.k && p.dg.v === v.v;
  if (!same) {   // change form in place: needs a real one within reach
    if (Math.hypot(v.x - p.x, v.y - p.y) > .85) return '变形时不能同时挪动';
    if (!MAP.items.some(it => it.k === v.k && it.v === v.v && distFp(p.x, p.y, it.fp) <= BAL.turnMove)) return '附近 ' + BAL.turnMove + ' 米内没有这种东西';
    return null;
  }
  if (Math.hypot(v.x - p.x, v.y - p.y) > BAL.turnMove + .05) return '一回合最多挪 ' + BAL.turnMove + ' 米';
  if (segHitsWall(p.x, p.y, v.x, v.y)) return '不能穿墙';
  return null;
}
function nextSeekTurn() {
  G.turnN++; G.phase = 'seek'; G.t = 0;
  if (G.turnN % BAL.whistleTurns === 0) whistle(0);
  emit({ e: 'turn', n: G.turnN });
}
function whistle(taunt) {
  const h = G.pl[G.hider], a = rnd() * 6.2832, d = rnd() * BAL.whistleFuzz, room = roomAt(h.x, h.y);
  emit({ e: 'wh', x: +(h.x + Math.cos(a) * d).toFixed(2), y: +(h.y + Math.sin(a) * d).toFixed(2), hx: +h.x.toFixed(2), hy: +h.y.toFixed(2), room: room ? room.n : '外面', taunt: taunt ? 1 : 0 });
}
function endRound(win, why) {
  if (G.phase === 'end') return;
  G.phase = 'end'; G.res = { win, why }; G.score[win === 'hider' ? G.hider : seekerIdx()]++;
  const h = G.pl[G.hider];
  emit({ e: 'end', res: G.res, score: G.score, hx: h.x, hy: h.y, dg: h.dg });
}

function simTick(dt) {
  if (!G || G.phase === 'end') return;
  G.kcd = Math.max(0, G.kcd - dt);
  if (G.mode === 'rt') {
    G.t -= dt;
    if (G.phase === 'hide' && G.t <= 0) { G.phase = 'seek'; G.t = SCENE.seekT || BAL.seekT; G.kn = BAL.knockStart; G.regenT = BAL.knockRegen; emit({ e: 'seek' }); }
    else if (G.phase === 'seek') {
      G.tauntCD = Math.max(0, G.tauntCD - dt);
      if (!G.fin) {
        if (G.kn < BAL.knockMax) { if ((G.regenT -= dt) <= 0) { G.kn++; G.regenT = BAL.knockRegen; } } else G.regenT = BAL.knockRegen;
        if (G.t <= BAL.finalT) { G.fin = 1; G.kn = BAL.finalKnocks; G.wT = 0; emit({ e: 'final' }); }
      }
      if (G.fin && (G.wT -= dt) <= 0) { G.wT += BAL.finalWhistle; whistle(0); }
      if (G.ai && !G.fin) aiTick(dt);
      if (G.t <= 0) { G.t = 0; endRound('hider', 'time'); }
    }
  } else if (G.phase === 'place' || G.phase === 'hturn') {
    if (G.ai) { G.aiT -= dt; if (G.aiT <= 0 && G.phase === 'hturn') aiTurn(); }
    else if (!G.pl[G.hider].gone || G.hider === 0) {
      G.t -= dt;
      if (G.t <= 0) { if (G.phase === 'place') { const sp = aiChooseSpot(G.hider, {}); if (sp) doAct(G.hider, 'place', sp); } else doAct(G.hider, 'tpass'); }
    } else { G.t -= dt; if (G.t <= 0) { if (G.phase === 'place') { const sp = aiChooseSpot(G.hider, {}); if (sp) doAct(G.hider, 'place', sp); } else doAct(G.hider, 'tpass'); } }
  }
}

/* ---------- the computer hider ---------- */
const FREE_KINDS = new Set(['ball', 'beanbag', 'box', 'stool', 'bush', 'barrel', 'chair', 'suitcase', 'bench']);
function aiChooseSpot(hi, o) {
  let best = null, bs = -1e9;
  const avoid = o.avoid || [], pool = ROOMS.filter(r => !avoid.includes(r.i) && MAP.items.some(it => it.room === r.i && !it.flat));
  // pick one room up front so every room is equally likely (dense rooms would otherwise always win)
  let target = null; for (let k = 0; k < 6 && pool.length; k++) { target = pick(pool); if (!target.out || rnd() < .6) break; }
  for (let t = 0; t < 320; t++) {
    let room, x, y, tpl;
    if (o.near) { x = o.near[0] + rr(-o.near[2], o.near[2]); y = o.near[1] + rr(-o.near[2], o.near[2]); room = roomAt(x, y); if (!room) continue; }
    else { room = t < 220 && target ? target : pick(pool); if (!room) return null; }
    const its = MAP.items.filter(it => it.room === room.i && !it.flat); if (!its.length) continue;
    tpl = o.keep ? { k: o.keep.k, v: o.keep.v, r: o.keep.r } : pick(its);
    if (!o.keep && o.near && distFp(o.near[0], o.near[1], tpl.fp) > BAL.turnMove) continue;
    let r = rnd() < .7 ? tpl.r : Math.floor(rnd() * 4);
    if (!o.near) { const ib = inner(room); if (rnd() < .55 && tpl.fp) { x = tpl.x + rr(-1.7, 1.7); y = tpl.y + rr(-1.7, 1.7); } else { x = rr(ib[0] + .3, ib[2] - .3); y = rr(ib[1] + .3, ib[3] - .3); } }
    x = Math.round(x * 20) / 20; y = Math.round(y * 20) / 20;
    if (o.keep && o.inPlace) { x = o.near[0]; y = o.near[1]; }
    const f = fpOf(tpl.k, r, x, y), ib = inner(room);
    if (f[0] < ib[0] || f[1] < ib[1] || f[2] > ib[2] || f[3] > ib[3]) continue;
    if (DOORZ.some(z => ovl(f, z, -.3))) continue;
    if (blocked(f, hi)) continue;
    if (o.near) { if (Math.hypot(x - o.near[0], y - o.near[1]) > o.near[2]) continue; if (segHitsWall(o.near[0], o.near[1], x, y)) continue; }
    let sc = rnd() * 3, same = 0;
    for (const it of its) if (it.k === tpl.k && Math.hypot(it.x - x, it.y - y) < 2.4) same++;
    sc += Math.min(2, same) * 1.3;
    const wallD = Math.min(f[0] - ib[0], f[1] - ib[1], ib[2] - f[2], ib[3] - f[3]);
    if (!FREE_KINDS.has(tpl.k)) sc += wallD < .2 ? 1.6 : -1; else sc += .5;
    if (r === tpl.r) sc += .6;
    if (o.far) sc += Math.hypot(x - o.far[0], y - o.far[1]) * .5;
    if (sc > bs) { bs = sc; best = { x, y, k: tpl.k, v: tpl.v, r }; }
  }
  return best;
}
function aiHide() {
  const sp = aiChooseSpot(G.hider, {}) || { x: SPAWN_HIDE[0], y: SPAWN_HIDE[1], k: 'box', v: 0, r: 0 };
  const h = G.pl[G.hider]; h.x = sp.x; h.y = sp.y; h.dg = { k: sp.k, v: sp.v, r: sp.r };
}
function aiTick(dt) {
  G.aiT -= dt; if (G.aiT > 0) return;
  G.aiT = rr(15, 28);
  const s = G.pl[seekerIdx()], h = G.pl[G.hider], d = Math.hypot(s.x - h.x, s.y - h.y);
  if (!hiderSeen() && d > 5 && rnd() < .55) {
    const lit = litRooms(), sp = aiChooseSpot(G.hider, { avoid: lit });
    if (sp && !roomsNear(sp.x, sp.y, .2).some(i => lit.includes(i))) { h.x = sp.x; h.y = sp.y; h.dg = { k: sp.k, v: sp.v, r: sp.r }; return; }
  }
  if (d > 9 && G.tauntCD <= 0 && rnd() < .35) doAct(G.hider, 'taunt');
}
function aiTurn() {
  G.aiT = 1e9;
  const last = G.hints[G.hints.length - 1], band = last ? last[1] : 3, h = G.pl[G.hider];
  const pMove = [.85, .6, .25, .08][band];
  if (rnd() < pMove) {
    const it = MAP.items[last[0]];
    if (rnd() < .7) { const sp = aiChooseSpot(G.hider, { near: [h.x, h.y, BAL.turnMove], keep: h.dg, far: [it.x, it.y] }); if (sp && !doAct(G.hider, 'tmove', sp)) return; }
    const cands = MAP.items.filter(q => !q.flat && q.k !== h.dg.k && distFp(h.x, h.y, q.fp) <= BAL.turnMove);
    for (const q of cands.sort(() => rnd() - .5).slice(0, 6)) {
      const sp = findFit(G.hider, { k: q.k, v: q.v, r: q.r }, h.x, h.y);
      if (sp && Math.hypot(sp[0] - h.x, sp[1] - h.y) <= .8 && !doAct(G.hider, 'tmove', { x: sp[0], y: sp[1], k: q.k, v: q.v, r: q.r })) return;
    }
  }
  doAct(G.hider, 'tpass');
}
