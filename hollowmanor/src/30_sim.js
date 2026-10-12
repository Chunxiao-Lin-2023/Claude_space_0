/* ================= simulation (host authoritative) =================
   W = world state. The host owns it; the guest keeps a mirror built from snapshots.
   Player index 0 = host, 1 = guest. Each player has a role 'L' (持灯者) or 'S' (灵视者). */
let W = null;
function newPlayer(id, role, x, z) {
  return { id, role, x, z, a: -HP, aim: -HP, spd: 0, run: false, stam: BAL.stamMax, fear: 8, batt: 1, boostT: 0, down: false, downT: 0, hide: -1, act: null, name: '',
    inp: { mx: 0, mz: 0, run: false, aim: -HP, act: -1, hold: false, press: 0, boost: 0 }, lastPress: 0, lastBoost: 0, noise: 0 };
}
function newGame(seed, roles, names) {
  RNG = mulberry32(seed);
  const gtype = pick(Object.keys(GHOSTS)), G = GHOSTS[gtype];
  const ridx = id => MAP.rooms.findIndex(r => r.id === id);
  const haunt = ridx(pick(['music', 'study', 'parlor', 'dining', 'nursery', 'kitchen', 'cons']));
  const ev = [], spots = [];
  for (const k of G.ev) {
    if (k === 'mirror') continue;
    const rooms = [haunt, haunt, ...shuffle(MAP.rooms.map(r => r.idx).filter(i => i !== haunt && MAP.rooms[i].id !== 'util')).slice(0, 3)];
    for (const room of rooms) {
      if (k === 'prints') { const s = randomWallSpot(room, spots); if (s) { ev.push(Object.assign({ k, room }, s)); spots.push(s); } }
      else { const [x, z] = randomFloorIn(room, 0.9); ev.push({ k, room, x, z, y: k === 'orbs' ? rr(1.0, 1.7) : 0 }); }
    }
  }
  const code = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 4);
  let codeSpot = null; for (let t = 0; t < 20 && !codeSpot; t++) { const room = ridx(pick(['music', 'parlor', 'dining', 'nursery', 'kitchen', 'gallery', 'foyer'])); codeSpot = randomWallSpot(room, spots); if (codeSpot) codeSpot.room = room; }
  // items
  const others = shuffle(RITUAL_ITEMS.filter(k => k !== G.item));
  const gated = shuffle(['cons', 'study']);
  const open = shuffle(['music', 'nursery', 'kitchen', 'dining', 'parlor', 'gallery', 'foyer']);
  const place = [[G.item, gated[0]], [others[0], gated[1]], [others[1], 'util'], [others[2], open[0]], ['fuse', open[1]]];
  const items = place.map(([k, slot], i) => { const s = SLOTS[slot]; return { i, k, slot, x: s[0], z: s[1], y: s[2], taken: 0 }; });
  const setup = { seed, gtype, haunt, ev, code, codeSpot, items: items.map(it => ({ i: it.i, k: it.k, x: it.x, y: it.y, z: it.z })) };
  W = {
    t: 0, now: 0, phase: 'play', setup, seq: 0, E: [],
    p: [newPlayer(0, roles[0], 16.4, 23.6), newPlayer(1, roles[1], 18.6, 23.6)],
    g: { x: MAP.rooms[haunt].cx, z: MAP.rooms[haunt].cz, a: 0, st: 'roam', stT: 0, man: 0, spd: 0, path: null, goal: null, dwell: 3, tgt: -1, lastX: 0, lastZ: 0, lost: 0, stuns: 0, huntT: 0, rage: 0, fade: 1 },
    doors: MAP.doors.map(d => ({ open: d.kind === 'arch' ? 1 : 0, tgt: d.kind === 'arch' ? 1 : 0, locked: !!d.locked })),
    lv: [0, 0], dials: [1, 3, 5, 0], f: { power: 0, seal: 1, chapel: 0, study: 0, shelf: 0, burned: [] },
    items, inv: [], evFound: {}, evSeen: ev.map(() => 0), mirrorSeen: 0, flick: 0, flickT: 0, hideA: MAP.hides.map(() => -9), occ: MAP.hides.map(() => -1),
    huntCD: BAL.firstHunt, eventCD: rr(...BAL.eventCD), rit: null, stats: { downs: 0, hunts: 0, stuns: 0 }, chime: 30,
  };
  W.p.forEach((p, i) => { p.name = names && names[i] || ROLES[p.role].who; });
  if (code.every((g, i) => W.dials[i] === g)) W.dials[0] = (W.dials[0] + 1) % 6;
  return W;
}
/* ---------- events (sounds, messages, effects) ---------- */
function emit(e) { e.s = ++W.seq; e.at = W.t; W.E.push(e); if (W.E.length > 80) W.E.shift(); if (typeof onEmit === 'function') onEmit(e); return e; }
const say = (txt, to = -1, c) => emit({ k: 'msg', txt, to, c });
const snd = (n, x, z, v = 1, to = -1) => emit({ k: 'snd', n, x, z, v, to });

/* ---------- player movement (used by host for its own player and by the guest locally) ---------- */
function movePlayer(p, dt, Wm) {
  const inp = p.inp;
  if (p.hide >= 0) { p.spd = 0; return; }
  let mx = inp.mx, mz = inp.mz; const L = Math.hypot(mx, mz); if (L > 1) { mx /= L; mz /= L; }
  const moving = L > 0.08;
  let sp = p.down ? BAL.crawl : BAL.walk;
  const wantRun = inp.run && moving && !p.down;
  if (wantRun && p.stam > 0.05) { sp = BAL.run; p.stam = Math.max(0, p.stam - dt); p.run = true; }
  else { p.run = false; p.stam = Math.min(BAL.stamMax, p.stam + dt * BAL.stamRegen * (moving ? 0.7 : 1.2)); if (p.stam < 1.2 && inp.run) sp *= 0.85; }
  // channeling an interaction roots you
  if (p.act && p.act.p > 0 && inp.hold) sp = 0;
  const dx = mx * sp * Math.min(1, L) * dt, dz = mz * sp * Math.min(1, L) * dt;
  const ox = p.x, oz = p.z;
  [p.x, p.z] = moveCircle(p.x, p.z, dx, dz, BAL.R, Wm, d => bumpDoor(Wm, d));
  p.spd = dist(ox, oz, p.x, p.z) / Math.max(dt, 1e-4);
  if (moving) p.a = Math.atan2(mz, mx);
  p.aim = inp.aim;
  if (!moving && p.role === 'L') p.a = p.a + angDiff(p.a, p.aim) * Math.min(1, dt * 6);
  if (p.role === 'S' && !moving) p.a = p.a + angDiff(p.a, p.aim) * Math.min(1, dt * 4);
}
/* walking into a closed, unlocked door pushes it open */
function bumpDoor(Wm, d) {
  const st = Wm.doors[d.idx];
  if (st.locked) { if (NETROLE !== 'guest') lockedHint(d); return; }
  if (st.tgt < 1) { st.tgt = 1; if (NETROLE === 'guest') netSendCtl({ t: 'door', i: d.idx }); else snd('doorOpen', d.cx, d.cz, 0.8); }
}
let lockHintT = 0;
function lockedHint(d) { if (W.t - lockHintT < 2.5) return; lockHintT = W.t; }

/* ---------- interactables visible to a player (static + dynamic) ---------- */
function interactList(p) {
  const out = [];
  for (const it of MAP.inter) out.push(it);
  for (const it of W.items) if (!it.taken) out.push({ k: 'item', id: 1000 + it.i, ii: it.i, x: it.x, z: it.z, role: '*', prompt: '拾起 ' + ITEMS[it.k].name });
  const o = W.p[1 - p.id];
  if (o.down) out.push({ k: 'revive', id: 2000, x: o.x, z: o.z, role: '*', prompt: '扶起' + ROLES[o.role].name, hold: BAL.reviveT });
  return out;
}
function interactById(p, id) {
  if (id >= 2000) return interactList(p).find(i => i.id === id);
  if (id >= 1000) { const it = W.items[id - 1000]; return it && !it.taken ? { k: 'item', id, ii: it.i, x: it.x, z: it.z, role: '*' } : null; }
  return MAP.inter[id];
}
/* best interactable for a player (client side; also used by host for validation) */
function bestInteract(p, Wm) {
  if (p.hide >= 0) { const h = MAP.inter.find(i => i.k === 'hide' && i.hid === p.hide); return h; }
  let best = null, bs = 1e9;
  for (const it of interactList(p)) {
    const d = dist(p.x, p.z, it.x, it.z); if (d > BAL.reach + (it.k === 'item' ? 0.2 : 0)) continue;
    if (it.k === 'locked') { const ds = Wm.doors[it.door]; if (!ds.locked) continue; }
    if (it.k === 'shelf' && Wm.f.shelf) continue;
    if (it.k === 'stairs' && false) continue;
    if (it.k === 'revive' && p.down) continue;
    if (p.down && it.k !== 'revive') continue;
    const facing = Math.abs(angDiff(p.a, Math.atan2(it.z - p.z, it.x - p.x)));
    const sc = d + facing * 0.35; if (sc < bs) { bs = sc; best = it; }
  }
  return best;
}
/* text for the prompt (client) */
function promptFor(p, it, Wm) {
  if (!it) return null;
  const role = p.role, wrong = it.role !== '*' && it.role !== role;
  const need = r => '需要' + ROLES[r].name;
  switch (it.k) {
    case 'hide': return { t: p.hide >= 0 ? '离开柜子' : '躲进柜子', ok: true };
    case 'lever': return { t: Wm.lv[it.lv] > 0 ? '拉杆已拉下…' : '拉下拉杆', ok: true };
    case 'fuse': return Wm.f.power ? { t: '电闸已恢复', ok: false } : wrong ? { t: '保险丝盒（' + need('L') + '）', ok: false } : Wm.inv.includes('fuse') ? { t: '装上保险丝（按住）', ok: true, hold: 1 } : { t: '缺一根保险丝', ok: false };
    case 'rune': return Wm.f.study ? { t: '书房已打开', ok: false } : wrong ? { t: '符文转盘（' + need('L') + '转动）', ok: false } : { t: '转动符文转盘', ok: true };
    case 'shelf': return wrong ? { t: '沉重的书架（' + need('L') + '推动）', ok: false } : { t: '推开书架（按住）', ok: true, hold: 1 };
    case 'altar': return !Wm.f.chapel ? null : Wm.f.seal === 0 ? { t: '仪式已完成', ok: false } : wrong ? { t: '祭坛（' + need('S') + '主持仪式）', ok: false } : Wm.rit ? { t: '主持仪式（按住）', ok: true, hold: 1 } : { t: '在祭坛献上遗物', ok: true };
    case 'stairs': return Wm.f.seal ? { t: '楼梯被灵封挡住了', ok: false } : { t: '登上二楼', ok: true };
    case 'front': return { t: '推推大门', ok: true };
    case 'locked': { const d = MAP.doors[it.door]; return { t: d.lockWhy || '锁住了', ok: false }; }
    case 'item': return { t: it.prompt || '拾起', ok: true };
    case 'revive': return { t: it.prompt + '（按住）', ok: true, hold: 1 };
  }
  return { t: it.prompt, ok: true };
}

/* ---------- host step ---------- */
function stepGame(dt) {
  if (!W || W.phase !== 'play') return;
  W.t += dt; W.now = W.t;
  const [A, B] = W.p;
  // doors animate
  for (const d of W.doors) d.open += clamp(d.tgt - d.open, -dt * 2.4, dt * 2.4);
  // levers
  for (let i = 0; i < 2; i++) if (W.lv[i] > 0) { W.lv[i] = Math.max(0, W.lv[i] - dt); if (W.lv[i] === 0) snd('leverUp', MAP.wallDecor.find(w => w.o.lever === i).x, MAP.wallDecor.find(w => w.o.lever === i).z, 0.6); }
  if (!W.f.chapel && W.lv[0] > 0 && W.lv[1] > 0) { W.f.chapel = 1; const di = MAP.doors.findIndex(d => d.id === 'chapelD'); W.doors[di].locked = false; W.doors[di].tgt = 1; snd('bigDoor', 29, 8, 1.2); say('远处传来铁门开启的轰鸣声——祈祷室打开了。', -1, '#ffd36b'); }
  // players
  for (const p of W.p) {
    if (p.id === 0 || NETROLE === 'solo') movePlayer(p, dt, W);
    hostPlayerLogic(p, dt);
  }
  stepGhost(dt);
  stepEvidence();
  stepFear(dt);
  // flicker decay
  if (W.flickT > 0) { W.flickT -= dt; if (W.flickT <= 0) W.flick = 0; }
  // ritual
  if (W.rit) stepRitual(dt);
  // lose: both down, or a down timer ran out
  if (A.down && B.down) endGame('lost', '两个人都倒下了……');
  for (const p of W.p) if (p.down && p.downT <= 0) endGame('lost', ROLES[p.role].name + '没能被及时扶起……');
}
function endGame(phase, why) { if (W.phase !== 'play') return; W.phase = phase; W.why = why; emit({ k: 'end', phase, why }); }
function hostPlayerLogic(p, dt) {
  const inp = p.inp, o = W.p[1 - p.id];
  if (p.down) { p.downT -= dt; }
  p.noise = Math.max(0, p.noise - dt * 2);
  // flashlight battery + boost
  if (p.role === 'L') {
    if (p.boostT > 0) p.boostT -= dt; else p.batt = Math.min(1, p.batt + BAL.battRegen * dt);
    if (inp.boost !== p.lastBoost) { p.lastBoost = inp.boost; if (!p.down && p.hide < 0) { if (p.batt >= BAL.boostCost) { p.batt -= BAL.boostCost; p.boostT = BAL.boostT; snd('boost', p.x, p.z, 1); boostHit(p); } else { snd('click', p.x, p.z, 0.6); if (W.t - (p.lowMsg || -9) > 4) { p.lowMsg = W.t; say('电量不足——等手电慢慢充回来', p.id); } } } }
  }
  // interaction
  const pressed = inp.press !== p.lastPress; p.lastPress = inp.press;
  let it = inp.act >= 0 ? interactById(p, inp.act) : null;
  if (it && it.k !== 'hide' && dist(p.x, p.z, it.x, it.z) > BAL.reach + 0.6) it = null;
  if (it && it.k === 'hide' && p.hide < 0 && dist(p.x, p.z, it.x, it.z) > BAL.reach + 0.6) it = null;
  const wrong = it && it.role !== '*' && it.role !== p.role;
  if (!it || !inp.hold || wrong || (p.act && p.act.id !== it.id)) { if (p.act && p.act.k === 'altar' && W.rit && W.rit.by === p.id) cancelRitual('仪式被打断了'); p.act = null; }
  if (it && wrong && pressed) say('这件事需要' + ROLES[it.role].name + '来做', p.id, '#ffb36b');
  if (!it || wrong) return;
  if (pressed) pressAction(p, it);
  // hold actions
  const holdT = it.k === 'fuse' ? (W.inv.includes('fuse') && !W.f.power ? BAL.fuseT : 0) : it.k === 'shelf' ? (W.f.shelf ? 0 : BAL.shelfT) : it.k === 'revive' ? BAL.reviveT : it.k === 'altar' && W.rit && W.rit.by === p.id ? BAL.ritualT : 0;
  if (holdT > 0 && inp.hold && !p.down) {
    if (!p.act) p.act = { id: it.id, k: it.k, p: 0 };
    p.act.p = Math.min(1, p.act.p + dt / holdT);
    if (it.k === 'fuse' || it.k === 'shelf') { p.noise = 1; if (Math.random() < dt * 3) snd(it.k === 'fuse' ? 'spark' : 'scrape', it.x, it.z, 0.6); }
    if (it.k === 'altar') W.rit.p = p.act.p;
    if (p.act.p >= 1) { finishHold(p, it); p.act = null; }
  }
}
function pressAction(p, it) {
  switch (it.k) {
    case 'hide': {
      const h = MAP.hides[it.hid];
      if (p.hide >= 0) { p.hide = -1; p.x = h.fx; p.z = h.fz; W.occ[it.hid] = -1; W.hideA[it.hid] = W.t; snd('wardrobe', h.x, h.z, 0.8); }
      else if (W.occ[it.hid] >= 0) say('柜子里已经有人了', p.id);
      else if (!p.down) { p.hide = it.hid; W.occ[it.hid] = p.id; W.hideA[it.hid] = W.t; snd('wardrobe', h.x, h.z, 0.8); p.hiddenSeen = W.g.st === 'hunt' && W.g.tgt === p.id && dist(W.g.x, W.g.z, p.x, p.z) < 7 && los(W.g.x, W.g.z, p.x, p.z, W); }
      break;
    }
    case 'lever': if (W.lv[it.lv] <= 0) { W.lv[it.lv] = BAL.leverHold; snd('lever', it.x, it.z, 1); if (!W.f.chapel) say(W.lv[1 - it.lv] > 0 ? '' : '拉杆在慢慢弹回……另一根拉杆也得同时拉下', p.id, '#ffd36b'); } break;
    case 'rune': emit({ k: 'ui', ui: 'rune', to: p.id }); break;
    case 'altar': if (!W.rit) { if (!W.inv.some(k => RITUAL_ITEMS.includes(k))) say('你们还没有任何可以献上的遗物', p.id); else emit({ k: 'ui', ui: 'altar', to: p.id }); } break;
    case 'stairs': {
      if (W.f.seal) { say('灵封还在。先驱散这里的怨灵。', p.id); break; }
      const o = W.p[1 - p.id];
      if (dist(o.x, o.z, it.x, it.z) > 3.2 || o.down) { say('等等你的同伴，一起上楼', p.id, '#ffd36b'); break; }
      endGame('won', '你们驱散了「' + GHOSTS[W.setup.gtype].name + '」，登上了二楼。');
      break;
    }
    case 'front': say('大门从外面被锁死了。只能往深处走。', p.id); snd('rattle', it.x, it.z, 0.9); break;
    case 'locked': { const d = MAP.doors[it.door]; say(d.lockWhy || '锁住了', p.id); snd('rattle', d.cx, d.cz, 0.7); break; }
    case 'item': { const st = W.items[it.ii]; if (st && !st.taken) { st.taken = 1; W.inv.push(st.k); snd('pick', st.x, st.z, 1); say((ROLES[p.role].name) + '拾起了 ' + ITEMS[st.k].icon + ' ' + ITEMS[st.k].name, -1, '#9dff9d'); } break; }
    case 'fuse': if (!W.inv.includes('fuse') && !W.f.power) say('保险丝盒缺了一根保险丝', p.id); break;
  }
}
function finishHold(p, it) {
  if (it.k === 'fuse') {
    W.f.power = 1; W.inv.splice(W.inv.indexOf('fuse'), 1);
    const di = MAP.doors.findIndex(d => d.id === 'consD'); W.doors[di].locked = false; W.doors[di].tgt = 1;
    snd('power', it.x, it.z, 1.3); say('电灯一盏盏亮了起来。温室的卷帘门升起了。', -1, '#ffd36b');
    emit({ k: 'fx', fx: 'power' });
  }
  if (it.k === 'shelf') { W.f.shelf = 1; const di = MAP.doors.findIndex(d => d.kind === 'shelf'); W.doors[di].locked = false; W.doors[di].tgt = 1; snd('scrapeBig', it.x, it.z, 1.2); say('书架后面露出一条暗道。', -1, '#ffd36b'); }
  if (it.k === 'revive') { const o = W.p[1 - p.id]; o.down = false; o.fear = 55; o.downT = 0; snd('revive', o.x, o.z, 1); say(ROLES[o.role].name + '被扶了起来', -1, '#9dff9d'); }
  if (it.k === 'altar') completeRitual(p);
}
/* dial change from the rune UI */
function setDial(pid, i, v) {
  if (W.f.study) return; const p = W.p[pid]; if (p.role !== 'L') return;
  const it = MAP.inter.find(x => x.k === 'rune'); if (dist(p.x, p.z, it.x, it.z) > BAL.reach + 0.8) return;
  W.dials[i] = ((v % 6) + 6) % 6; snd('dial', it.x, it.z, 0.7);
  if (W.setup.code.every((g, k) => W.dials[k] === g)) { W.f.study = 1; const di = MAP.doors.findIndex(d => d.id === 'studyD'); W.doors[di].locked = false; W.doors[di].tgt = 1; snd('unlock', it.x, it.z, 1.2); say('符文锁“咔哒”一声转开了，书房的门开了。', -1, '#ffd36b'); emit({ k: 'ui', ui: 'close', to: pid }); }
}
/* ---------- ritual ---------- */
function startRitual(pid, item) {
  const p = W.p[pid]; if (p.role !== 'S' || W.rit || !W.f.chapel || !W.f.seal) return;
  if (!W.inv.includes(item) || !RITUAL_ITEMS.includes(item)) return;
  const al = MAP.inter.find(x => x.k === 'altar'); if (dist(p.x, p.z, al.x, al.z) > BAL.reach + 0.8) return;
  W.rit = { item, by: pid, p: 0, t: 0 };
  say('灵视者把 ' + ITEMS[item].icon + ' ' + ITEMS[item].name + ' 放上祭坛。按住 E 主持仪式——持灯者，守住她！', -1, '#c8a8ff');
  snd('ritualStart', al.x, al.z, 1.2);
  ghostRitual();
}
function cancelRitual(why) { if (!W.rit) return; W.rit = null; say(why, -1, '#ffb36b'); ghostEndHunt(true); }
function stepRitual(dt) { W.rit.t += dt; const s = W.p[W.rit.by]; if (s.down) cancelRitual('仪式中断了……遗物还在祭坛上，可以再试一次'); }
function completeRitual(p) {
  const item = W.rit.item, right = item === GHOSTS[W.setup.gtype].item; W.rit = null;
  if (right) {
    W.inv.splice(W.inv.indexOf(item), 1); W.f.seal = 0; W.g.st = 'banish'; W.g.stT = 3.5; W.flick = 0;
    snd('banish', W.g.x, W.g.z, 1.4); emit({ k: 'fx', fx: 'banish' });
    say('「' + GHOSTS[W.setup.gtype].name + '」发出一声长长的叹息，消散了。楼梯上的灵封碎裂了！', -1, '#c8a8ff');
  } else {
    W.inv.splice(W.inv.indexOf(item), 1); W.f.burned.push(item);
    snd('wrong', W.g.x, W.g.z, 1.4); emit({ k: 'fx', fx: 'wrong' });
    say(ITEMS[item].icon + ' ' + ITEMS[item].name + ' 在祭坛上化为灰烬——不是它要的东西！怨灵暴怒了！', -1, '#ff6b6b');
    W.g.rage = 1; ghostStartHunt(true, BAL.huntLen[1] + 6);
  }
}
/* ---------- evidence discovery ---------- */
function stepEvidence() {
  const s = W.p.find(p => p.role === 'S'), h = W.p.find(p => p.role === 'L');
  W.setup.ev.forEach((e, i) => {
    if (W.evSeen[i]) return;
    let seen = false;
    if ((e.k === 'prints' || e.k === 'orbs') && s.hide < 0 && !s.down) { const d = dist(s.x, s.z, e.x, e.z); if (d < 3.6 && los(s.x, s.z, e.x + Math.sin(e.r || 0) * 0.2, e.z + Math.cos(e.r || 0) * 0.2, W)) seen = true; }
    if (e.k === 'frost' && beamFactor(W, e.x, 0.1, e.z) > 0.3 && dist(h.x, h.z, e.x, e.z) < 7.5) seen = true;
    if (seen) { W.evSeen[i] = 1; foundEvidence(e.k, e.x, e.z); }
  });
  if (GHOSTS[W.setup.gtype].ev.includes('mirror') && !W.evFound.mirror) {
    for (const m of MAP.mirrors) if (dist(h.x, h.z, m.x, m.z) < 6.5 && beamFactor(W, m.x, 1.2, m.z, m.r) > 0.3) { foundEvidence('mirror', m.x, m.z); break; }
  }
}
function foundEvidence(k, x, z) {
  if (W.evFound[k]) return; W.evFound[k] = 1;
  snd('evidence', x, z, 1); emit({ k: 'evidence', ev: k });
  const n = Object.keys(W.evFound).length;
  say('发现证据：' + EVID[k].icon + ' ' + EVID[k].name + (n >= 2 ? '　——打开日志（J）看看是哪种怨灵' : ''), -1, '#9fe8ff');
}
/* ---------- fear ---------- */
function stepFear(dt) {
  const G = W.g, hunting = G.st === 'hunt' || G.st === 'ritual' || G.st === 'stun';
  for (const p of W.p) {
    if (p.down) { p.fear = Math.min(100, p.fear + dt * 2); continue; }
    const o = W.p[1 - p.id], sep = dist(p.x, p.z, o.x, o.z);
    let d = 0;
    if (sep > BAL.sepDist) d += BAL.fearSep * clamp((sep - BAL.sepDist) / 6 + 0.5, 0.5, 1.6); else if (sep < BAL.nearDist && !o.down) d += BAL.fearNear;
    const room = roomAt(p.x, p.z), lit = room >= 0 && W.f.power && MAP.rooms[room].light;
    d += lit ? BAL.fearLit : BAL.fearDark;
    const gd = dist(p.x, p.z, G.x, G.z);
    if (G.st !== 'gone' && G.st !== 'banish' && gd < BAL.ghostFearR) { const sees = p.role === 'S' || G.man > 0.3; if (sees) d += BAL.fearGhost * (1 - gd / BAL.ghostFearR); }
    if (hunting) d += BAL.fearHunt;
    if (p.hide >= 0) d = hunting ? 0.4 : -1.2;
    p.fear = clamp(p.fear + d * dt, 0, 100);
  }
}
function fearSpike(x, z, amt, r = 7) { for (const p of W.p) { const d = dist(p.x, p.z, x, z); if (d < r && p.hide < 0) p.fear = Math.min(100, p.fear + amt * (1 - d / r * 0.6)); } }
/* strong flash: stuns the ghost if it is in the beam */
function boostHit(p) {
  const G = W.g; if (G.st === 'gone' || G.st === 'banish') return;
  const d = dist(p.x, p.z, G.x, G.z); if (d > BAL.boostRange) return;
  const ang = Math.abs(angDiff(p.aim, Math.atan2(G.z - p.z, G.x - p.x))); if (ang > BAL.beamHalf * 1.35 + (d < 1.2 ? 0.6 : 0)) return;
  if (!los(p.x, p.z, G.x, G.z, W)) return;
  ghostStunned(p);
}
