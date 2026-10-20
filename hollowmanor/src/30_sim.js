/* ================= simulation (host authoritative) =================
   W = world state for the current floor. The host owns it; the guest keeps a mirror built from snapshots.
   Player index 0 = host, 1 = guest. Each player has a role 'L' (持灯者) or 'S' (灵视者).
   A floor's puzzles are data in FLOORS[i]; their behaviour lives in the PZ registry below. */
let W = null;
function newPlayer(id, role, x, z) {
  return { id, role, x, z, a: -HP, aim: -HP, spd: 0, run: false, stam: BAL.stamMax, fear: 8, batt: 1, boostT: 0, down: false, downT: 0, hide: -1, act: null, name: '',
    inp: { mx: 0, mz: 0, run: false, aim: -HP, act: -1, hold: false, press: 0, boost: 0 }, lastPress: 0, lastBoost: 0, noise: 0 };
}
/* deterministic per-floor setup (host and guest compute the same thing from the seed) */
function genSetup(fi, seed, used) {
  RNG = mulberry32(seed);
  const F = FLOORS[fi], ridx = id => MAP.rooms.findIndex(r => r.id === id);
  let gtype = 'boss';
  if (F.ghost !== 'boss') { const pool = Object.keys(GHOSTS).filter(k => !(used || []).includes(k)); gtype = pick(pool.length ? pool : Object.keys(GHOSTS)); }
  const G = GT(gtype), haunt = ridx(pick(F.haunts));
  const ev = [], spots = [];
  for (const k of G.ev) {
    if (k === 'mirror') continue;
    const rooms = [haunt, haunt, ...shuffle(MAP.rooms.map(r => r.idx).filter(i => i !== haunt && !(F.evExclude || []).includes(MAP.rooms[i].id))).slice(0, 3)];
    for (const room of rooms) {
      if (k === 'prints') { const s = randomWallSpot(room, spots); if (s) { ev.push(Object.assign({ k, room }, s)); spots.push(s); } }
      else { const [x, z] = randomFloorIn(room, 0.9); ev.push({ k, room, x, z, y: k === 'orbs' ? rr(1.0, 1.7) : 0 }); }
    }
  }
  const setup = { fi, seed, gtype, haunt, ev, items: [] };
  if (F.codeRooms) {
    setup.code = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 4);
    for (let t = 0; t < 20 && !setup.codeSpot; t++) { const room = ridx(pick(F.codeRooms)); const sp = randomWallSpot(room, spots); if (sp) { sp.room = room; setup.codeSpot = sp; } }
  }
  if (MAP.furn.some(f => f.o.bell != null)) setup.bells = shuffle([0, 1, 2, 3, 4]);
  if (F.planItems) {
    const others = shuffle(RITUAL_ITEMS.filter(k => k !== G.item));
    setup.items = F.planItems(G.item, others).map(([k, slot], i) => { const s = MAP.slots[slot]; return { i, k, slot, x: s[0], z: s[1], y: s[2], need: s[4] || null }; });
  }
  if (F.anchorRooms) {
    const kinds = shuffle(Object.keys(ANCHORS));
    setup.anchors = shuffle(F.anchorRooms.slice()).slice(0, 3).map((id, i) => { const room = ridx(id); const [x, z] = randomFloorIn(room, 1.0); return { i, k: kinds[i], room, x, z }; });
  }
  return setup;
}
function newFloor(fi, seed, roles, names, carry) {
  buildMap(fi);
  const F = FLOORS[fi], setup = genSetup(fi, seed, carry && carry.used);
  const st = F.start;
  W = {
    floor: fi, t: 0, now: 0, phase: 'play', setup, seq: carry ? carry.seq : 0, E: carry ? carry.E : [],
    p: [newPlayer(0, roles[0], st[0][0], st[0][1]), newPlayer(1, roles[1], st[1][0], st[1][1])],
    g: { x: MAP.rooms[setup.haunt].cx, z: MAP.rooms[setup.haunt].cz, a: 0, st: 'roam', stT: 0, man: 0, spd: 0, path: null, goal: null, dwell: 3, tgt: -1, lastX: 0, lastZ: 0, lost: 0, stuns: 0, huntT: 0, rage: 0, fade: 1 },
    doors: MAP.doors.map(d => ({ open: d.kind === 'arch' ? 1 : 0, tgt: d.kind === 'arch' ? 1 : 0, locked: !!d.locked })),
    lv: [0, 0], dials: [1, 3, 5, 0], f: Object.assign({ power: F.power ? 1 : 0, seal: 1, burned: [] }, F.flags || {}),
    items: setup.items.map(it => Object.assign({ taken: 0 }, it)), inv: [], evFound: {}, evSeen: setup.ev.map(() => 0), flick: 0, flickT: 0,
    hideA: MAP.hides.map(() => -9), occ: MAP.hides.map(() => -1), bellN: 0, lamps: MAP.lamps.map(() => 0), anchors: (setup.anchors || []).map(() => 0), finP: 0,
    huntCD: B('firstHunt'), eventCD: rr(...BAL.eventCD), rit: null, chime: 30,
    stats: carry ? carry.stats : { downs: 0, hunts: 0, stuns: 0, t: 0 }, used: carry ? carry.used : [],
  };
  W.p.forEach((p, i) => { p.name = names && names[i] || ROLES[p.role].who; p.a = p.aim = p.inp.aim = F.startA != null ? F.startA : -HP; });
  if (setup.code && setup.code.every((g, i) => W.dials[i] === g)) W.dials[0] = (W.dials[0] + 1) % 6;
  return W;
}
const carryOf = W => ({ seq: W.seq, E: W.E, stats: Object.assign({}, W.stats, { t: (W.stats.t || 0) + W.t }), used: W.setup.gtype === 'boss' ? W.used : [...W.used, W.setup.gtype] });
/* ---------- events (sounds, messages, effects) ---------- */
function emit(e) { e.s = ++W.seq; e.at = W.t; W.E.push(e); if (W.E.length > 80) W.E.shift(); if (typeof onEmit === 'function') onEmit(e); return e; }
const say = (txt, to = -1, c) => emit({ k: 'msg', txt, to, c });
const snd = (n, x, z, v = 1, to = -1) => emit({ k: 'snd', n, x, z, v, to });
const doorIdx = id => MAP.doors.findIndex(d => d.id === id);
function unlockDoor(id, open = true) { const i = typeof id === 'number' ? id : doorIdx(id); if (i < 0) return; W.doors[i].locked = false; if (open) W.doors[i].tgt = 1; }
function rightItemHeld(W) { const g = GT(W.setup.gtype); return !!g.item && W.inv.includes(g.item) && Object.keys(W.evFound).length >= 2; }

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
  if (p.act && p.act.p > 0 && inp.hold) sp = 0; // channeling an interaction roots you
  if (Wm.phase !== 'play') sp = 0;
  const dx = mx * sp * Math.min(1, L) * dt, dz = mz * sp * Math.min(1, L) * dt;
  const ox = p.x, oz = p.z;
  [p.x, p.z] = moveCircle(p.x, p.z, dx, dz, BAL.R, Wm, d => bumpDoor(Wm, d), p.role);
  p.spd = dist(ox, oz, p.x, p.z) / Math.max(dt, 1e-4);
  if (moving) p.a = Math.atan2(mz, mx);
  p.aim = inp.aim;
  if (!moving && p.role === 'L') p.a = p.a + angDiff(p.a, p.aim) * Math.min(1, dt * 6);
  if (p.role === 'S' && !moving) p.a = p.a + angDiff(p.a, p.aim) * Math.min(1, dt * 4);
}
/* walking into a closed, unlocked door pushes it open */
function bumpDoor(Wm, d) {
  const st = Wm.doors[d.idx];
  if (st.locked) return;
  if (st.tgt < 1) { st.tgt = 1; if (NETROLE === 'guest') netSendCtl({ t: 'door', i: d.idx }); else snd('doorOpen', d.cx, d.cz, 0.8); }
}

/* ---------- interactables visible to a player (static + dynamic) ---------- */
const roleOf = (it, Wm) => typeof it.role === 'function' ? it.role(Wm) : it.role;
function interactList(p, Wm = W) {
  const out = MAP.inter.slice();
  for (const it of Wm.items) if (!it.taken && (!it.need || Wm.f[it.need])) out.push({ k: 'item', id: 1000 + it.i, ii: it.i, x: it.x, z: it.z, role: '*' });
  (Wm.setup.anchors || []).forEach((a, i) => { const st = Wm.anchors[i]; if (st < 2) out.push({ k: 'anchor', id: 3000 + i, ai: i, x: a.x, z: a.z, role: st === 0 ? 'S' : 'L' }); });
  const o = Wm.p[1 - p.id];
  if (o.down) out.push({ k: 'revive', id: 2000, x: o.x, z: o.z, role: '*' });
  return out;
}
function interactById(p, id) {
  if (id >= 1000) return interactList(p).find(i => i.id === id) || null;
  return MAP.inter[id];
}
const idist = (p, it) => Math.min(dist(p.x, p.z, it.x, it.z), it.x2 != null ? dist(p.x, p.z, it.x2, it.z2) : 1e9);
/* best interactable for a player (client side; also used by host for validation) */
function bestInteract(p, Wm) {
  if (p.hide >= 0) return MAP.inter.find(i => i.k === 'hide' && i.hid === p.hide);
  let best = null, bs = 1e9;
  for (const it of interactList(p, Wm)) {
    const d = idist(p, it); if (d > BAL.reach + (it.k === 'item' ? 0.2 : it.k === 'anchor' ? 0.3 : 0)) continue;
    const pz = PZ[it.k]; if (pz && pz.skip && pz.skip(it, Wm, p)) continue;
    if (it.k === 'revive' && p.down) continue;
    if (p.down && it.k !== 'revive') continue;
    const tx = it.x2 != null && dist(p.x, p.z, it.x2, it.z2) < dist(p.x, p.z, it.x, it.z) ? it.x2 : it.x, tz = tx === it.x2 ? it.z2 : it.z;
    const facing = Math.abs(angDiff(p.a, Math.atan2(tz - p.z, tx - p.x)));
    const sc = d + facing * 0.35; if (sc < bs) { bs = sc; best = it; }
  }
  return best;
}
const need = r => '需要' + ROLES[r].name;
/* text for the prompt (client) */
function promptFor(p, it, Wm) {
  if (!it) return null;
  const pz = PZ[it.k]; if (!pz) return null;
  const wrong = roleOf(it, Wm) !== '*' && roleOf(it, Wm) !== p.role;
  return pz.prompt(p, it, Wm, wrong);
}
/* ---------- puzzle registry ----------
   prompt(p,it,W,wrong) → {t, ok, hold}; press(p,it); hold(p,it) → seconds (0 = not a hold action); finish(p,it); skip(it,W,p) hides it; noise = sound while holding */
const PZ = {
  hide: { prompt: p => ({ t: p.hide >= 0 ? '离开柜子' : '躲进柜子', ok: true }),
    press(p, it) {
      const h = MAP.hides[it.hid];
      if (p.hide >= 0) { p.hide = -1; p.x = h.fx; p.z = h.fz; W.occ[it.hid] = -1; W.hideA[it.hid] = W.t; snd('wardrobe', h.x, h.z, 0.8); }
      else if (W.occ[it.hid] >= 0) say('柜子里已经有人了', p.id);
      else if (!p.down) { p.hide = it.hid; W.occ[it.hid] = p.id; W.hideA[it.hid] = W.t; snd('wardrobe', h.x, h.z, 0.8); p.hiddenSeen = W.g.st === 'hunt' && W.g.tgt === p.id && dist(W.g.x, W.g.z, p.x, p.z) < 7 && los(W.g.x, W.g.z, p.x, p.z, W); }
    } },
  lever: { prompt: (p, it, Wm) => ({ t: Wm.lv[it.lv] > 0 ? '拉杆已拉下…' : '拉下拉杆', ok: true }),
    press(p, it) { if (W.lv[it.lv] > 0) return; W.lv[it.lv] = BAL.leverHold; snd('lever', it.x, it.z, 1); if (!W.f[MAP.F.leverFlag] && W.lv[1 - it.lv] <= 0) say('拉杆在慢慢弹回……另一根拉杆也得同时拉下', p.id, '#ffd36b'); } },
  fuse: { prompt: (p, it, Wm, wrong) => Wm.f.power ? { t: '电闸已恢复', ok: false } : wrong ? { t: '保险丝盒（' + need('L') + '）', ok: false } : Wm.inv.includes('fuse') ? { t: '装上保险丝（按住）', ok: true, hold: 1 } : { t: '缺一根保险丝', ok: false },
    press(p) { if (!W.inv.includes('fuse') && !W.f.power) say('保险丝盒缺了一根保险丝', p.id); },
    hold: () => W.inv.includes('fuse') && !W.f.power ? BAL.fuseT : 0, noise: 'spark',
    finish(p, it) { W.f.power = 1; W.inv.splice(W.inv.indexOf('fuse'), 1); unlockDoor(MAP.F.fuseDoor); snd('power', it.x, it.z, 1.3); say(MAP.F.fuseMsg, -1, '#ffd36b'); emit({ k: 'fx', fx: 'power' }); } },
  rune: { prompt: (p, it, Wm, wrong) => Wm.f[MAP.F.runeFlag] ? { t: '符文锁已经打开', ok: false } : wrong ? { t: '符文转盘（' + need('L') + '转动）', ok: false } : { t: '转动符文转盘', ok: true },
    press(p) { if (!W.f[MAP.F.runeFlag]) emit({ k: 'ui', ui: 'rune', to: p.id }); } },
  shelf: { skip: (it, Wm) => Wm.f.shelf, prompt: (p, it, Wm, wrong) => wrong ? { t: '沉重的书架（' + need('L') + '推动）', ok: false } : { t: '推开书架（按住）', ok: true, hold: 1 },
    hold: () => W.f.shelf ? 0 : BAL.shelfT, noise: 'scrape',
    finish(p, it) { W.f.shelf = 1; unlockDoor(it.door); snd('scrapeBig', it.x, it.z, 1.2); say('书架后面露出一条暗道。', -1, '#ffd36b'); } },
  altar: { skip: (it, Wm) => it.needFlag && !Wm.f[it.needFlag],
    prompt: (p, it, Wm, wrong) => Wm.f.seal === 0 ? { t: '仪式已完成', ok: false } : wrong ? { t: (it.label || '祭坛') + '（' + need('S') + '主持仪式）', ok: false } : Wm.rit ? { t: '主持仪式（按住）', ok: true, hold: 1 } : { t: '献上遗物', ok: true },
    press(p) { if (W.rit || !W.f.seal) return; if (!W.inv.some(k => RITUAL_ITEMS.includes(k))) say('你们还没有任何可以献上的遗物', p.id); else emit({ k: 'ui', ui: 'altar', to: p.id }); },
    hold: p => W.rit && W.rit.by === p.id ? BAL.ritualT : 0, finish: p => completeRitual(p) },
  stairs: { prompt: (p, it, Wm) => Wm.f.seal ? { t: '楼梯被灵封挡住了', ok: false } : { t: it.label || '上楼', ok: true },
    press(p, it) {
      if (W.f.seal) { say('灵封还在。先驱散这里的怨灵。', p.id); return; }
      const o = W.p[1 - p.id];
      if (dist(o.x, o.z, it.x, it.z) > 3.4 || o.down) { say('等等你的同伴，一起上楼', p.id, '#ffd36b'); return; }
      W.phase = 'ascend'; W.ascT = 1.4; W.ascTo = it.to; emit({ k: 'fx', fx: 'ascend', to: it.to }); snd('stairsUp', it.x, it.z, 1);
    } },
  front: { prompt: () => ({ t: '推推大门', ok: true }), press(p, it) { say('大门从外面被锁死了。只能往深处走。', p.id); snd('rattle', it.x, it.z, 0.9); } },
  locked: { skip: (it, Wm) => !Wm.doors[it.door].locked,
    prompt(p, it, Wm) { const d = MAP.doors[it.door]; if (d.key && Wm.inv.includes(d.key)) return { t: '用' + ITEMS[d.key].name + '开门', ok: true }; return { t: d.lockWhy || '锁住了', ok: false }; },
    press(p, it) { const d = MAP.doors[it.door]; if (d.key && W.inv.includes(d.key)) { W.inv.splice(W.inv.indexOf(d.key), 1); unlockDoor(it.door); snd('unlock', d.cx, d.cz, 1.1); say(d.openMsg || '门锁“咔”地一声开了。', -1, '#ffd36b'); return; } say(d.lockWhy || '锁住了', p.id); snd('rattle', d.cx, d.cz, 0.7); } },
  item: { prompt: (p, it, Wm) => ({ t: '拾起 ' + ITEMS[Wm.items[it.ii].k].name, ok: true }),
    press(p, it) { const st = W.items[it.ii]; if (st && !st.taken) { st.taken = 1; W.inv.push(st.k); snd('pick', st.x, st.z, 1); say(ROLES[p.role].name + '拾起了 ' + ITEMS[st.k].icon + ' ' + ITEMS[st.k].name, -1, '#9dff9d'); } } },
  revive: { prompt: (p, it, Wm) => ({ t: '扶起' + ROLES[Wm.p[1 - p.id].role].name + '（按住）', ok: true, hold: 1 }), hold: () => BAL.reviveT,
    finish(p) { const o = W.p[1 - p.id]; o.down = false; o.fear = 55; o.downT = 0; snd('revive', o.x, o.z, 1); say(ROLES[o.role].name + '被扶了起来', -1, '#9dff9d'); } },
  /* --- floor 2 --- */
  valve: { prompt: (p, it, Wm, wrong) => Wm.f.drained ? { t: '浴缸的水已经放干了', ok: false } : wrong ? { t: '生锈的阀门（' + need('L') + '拧开）', ok: false } : { t: '拧开放水阀（按住）', ok: true, hold: 1 },
    hold: () => W.f.drained ? 0 : BAL.valveT, noise: 'water',
    finish(p, it) { W.f.drained = 1; snd('drain', it.x, it.z, 1.3); say('浑浊的水打着旋儿流走了……浴缸底露出了什么东西。', -1, '#ffd36b'); } },
  bolt: { skip: (it, Wm) => !Wm.doors[it.door].locked, prompt: () => ({ t: '拉开门闩（按住）', ok: true, hold: 1 }), hold: () => BAL.boltT,
    finish(p, it) { unlockDoor(it.door); const d = MAP.doors[it.door]; snd('unlock', d.cx, d.cz, 1); say('门闩“咔嗒”一声滑开了。', -1, '#ffd36b'); } },
  bell: { prompt: (p, it, Wm, wrong) => Wm.f.bells ? { t: '铃铛', ok: false } : wrong ? { t: '小铜铃（' + need('L') + '摇）', ok: false } : { t: '摇响铜铃', ok: true },
    press(p, it) {
      const pitch = 'bell' + it.bi; snd(pitch, it.x, it.z, 1);
      if (W.f.bells) return;
      if (W.setup.bells[W.bellN] === it.bi) { W.bellN++; if (W.bellN >= 5) { W.f.bells = 1; unlockDoor(MAP.F.bellDoor); snd('chimeDone', it.x, it.z, 1.2); say(MAP.F.bellMsg, -1, '#ffd36b'); } }
      else { W.bellN = 0; snd('bellWrong', it.x, it.z, 1.2); W.flick = 0.8; W.flickT = 1.2; fearSpike(it.x, it.z, 10, 8); W.huntCD = Math.max(5, W.huntCD - 8); say('铃声乱了——屋子里有什么东西不高兴地动了一下。顺序要从头再来。', -1, '#ff9a8a'); }
    } },
  /* --- floor 3 --- */
  lamp: { skip: (it, Wm) => !!Wm.lamps[it.li], prompt: (p, it, Wm, wrong) => Wm.lamps[it.li] ? { t: '油灯亮着', ok: false } : wrong ? { t: '油灯（' + need('L') + '点亮）', ok: false } : { t: '点亮油灯', ok: true },
    press(p, it) { if (W.lamps[it.li]) return; W.lamps[it.li] = 1; snd('ignite', it.x, it.z, 1); } },
  anchor: { prompt(p, it, Wm, wrong) { const st = Wm.anchors[it.ai], a = ANCHORS[Wm.setup.anchors[it.ai].k]; if (st === 0) return wrong ? { t: '这里有股说不出的寒意……（' + need('S') + '）', ok: false } : { t: '解开「' + a.name + '」的灵缚（按住）', ok: true, hold: 1 }; return wrong ? { t: a.name + '（' + need('L') + '砸碎）', ok: false } : { t: '砸碎「' + a.name + '」（按住）', ok: true, hold: 1 }; },
    hold: (p, it) => W.anchors[it.ai] === 0 ? BAL.unbindT : BAL.smashT, noise: 'smash',
    finish(p, it) {
      const a = W.setup.anchors[it.ai], nm = ANCHORS[a.k].name;
      if (W.anchors[it.ai] === 0) { W.anchors[it.ai] = 1; snd('unbind', a.x, a.z, 1.2); say('灵视者解开了「' + nm + '」上的灵缚——持灯者，现在你也能看见它了，快砸碎它！', -1, '#c8a8ff'); return; }
      W.anchors[it.ai] = 2; const n = W.anchors.filter(v => v === 2).length; snd('shatter', a.x, a.z, 1.4); emit({ k: 'fx', fx: 'anchor', n });
      const G = W.g; G.rage = Math.min(3, (G.rage || 0) + 1);
      if (n >= 3) { W.f.sanctum = 1; unlockDoor(MAP.F.sanctumDoor); snd('bigDoor', 17, 10, 1.3); say('第三件镇物碎了！阁楼深处，那扇被封住的门自己开了……', -1, '#c8a8ff'); }
      else say('「' + nm + '」碎了（' + n + '/3）。她尖叫起来——她要来了！', -1, '#ff9a8a');
      if (G.st === 'roam') { W.huntCD = 0.5; }
    } },
  circle: { skip: (it, Wm) => !Wm.f.sanctum,
    prompt: (p, it, Wm, wrong) => Wm.f.seal === 0 ? { t: '法阵已经熄灭', ok: false } : wrong ? { t: '法阵（' + need('S') + '主持，你守在旁边）', ok: false } : { t: '在法阵中念出她的名字（按住）', ok: true, hold: 1 },
    press(p) { if (!W.rit && W.f.seal) { W.rit = { item: 'final', by: p.id, p: W.finP, t: 0 }; say('灵视者走进法阵，开始念诵。持灯者，守在法阵旁边！', -1, '#c8a8ff'); snd('ritualStart', p.x, p.z, 1.3); ghostRitual(); } },
    hold: p => W.rit && W.rit.by === p.id ? BAL.finalT : 0, finish: p => completeRitual(p) },
  hatch: { prompt: (p, it, Wm) => Wm.f.seal ? { t: '天窗被铁链锁着', ok: false } : { t: '推开天窗，爬上屋顶', ok: true },
    press(p, it) {
      if (W.f.seal) { say('天窗上缠满了铁链。先结束这一切。', p.id); snd('rattle', it.x, it.z, 0.8); return; }
      const o = W.p[1 - p.id];
      if (dist(o.x, o.z, it.x, it.z) > 3.4 || o.down) { say('等等你的同伴，一起出去', p.id, '#ffd36b'); return; }
      endGame('won', '你们推开天窗，爬上了湿漉漉的屋顶。雨停了，东边的天空泛起了鱼肚白。');
    } },
};

/* ---------- host step ---------- */
function stepGame(dt) {
  if (!W) return;
  if (W.phase === 'ascend') { W.ascT -= dt; if (W.ascT <= 0) hostAscend(); return; }
  if (W.phase !== 'play') return;
  W.t += dt; W.now = W.t;
  const [A, Bp] = W.p;
  for (const d of W.doors) d.open += clamp(d.tgt - d.open, -dt * 2.4, dt * 2.4);
  // twin levers
  if (MAP.F.leverDoor) {
    for (let i = 0; i < 2; i++) if (W.lv[i] > 0) { W.lv[i] = Math.max(0, W.lv[i] - dt); if (W.lv[i] === 0) { const w = MAP.wallDecor.find(w => w.o.lever === i); snd('leverUp', w.x, w.z, 0.6); } }
    if (!W.f[MAP.F.leverFlag] && W.lv[0] > 0 && W.lv[1] > 0) { W.f[MAP.F.leverFlag] = 1; unlockDoor(MAP.F.leverDoor); const d = MAP.doors[doorIdx(MAP.F.leverDoor)]; snd('bigDoor', d.cx, d.cz, 1.2); say(MAP.F.leverMsg, -1, '#ffd36b'); }
  }
  for (const p of W.p) {
    if (p.id === 0 || NETROLE === 'solo') movePlayer(p, dt, W);
    hostPlayerLogic(p, dt);
  }
  stepGhost(dt);
  stepEvidence();
  stepFear(dt);
  if (W.flickT > 0) { W.flickT -= dt; if (W.flickT <= 0) W.flick = 0; }
  if (W.rit) stepRitual(dt);
  if (A.down && Bp.down) endGame('lost', '两个人都倒下了……');
  for (const p of W.p) if (p.down && p.downT <= 0) endGame('lost', ROLES[p.role].name + '没能被及时扶起……');
}
function endGame(phase, why) { if (W.phase !== 'play') return; W.phase = phase; W.why = why; emit({ k: 'end', phase, why }); }
/* both players climbed the stairs: build the next floor and tell the guest */
function hostAscend() {
  const to = W.ascTo, seed = (Math.random() * 1e9) | 0, roles = W.p.map(p => p.role), names = W.p.map(p => p.name);
  enterFloor(to, seed, roles, names, carryOf(W));
  emit({ k: 'floor', f: to, seed });
}
function hostPlayerLogic(p, dt) {
  const inp = p.inp;
  if (p.down) p.downT -= dt;
  p.noise = Math.max(0, p.noise - dt * 2);
  if (p.role === 'L') {
    if (p.boostT > 0) p.boostT -= dt; else p.batt = Math.min(1, p.batt + BAL.battRegen * dt);
    if (inp.boost !== p.lastBoost) { p.lastBoost = inp.boost; if (!p.down && p.hide < 0) { if (p.batt >= BAL.boostCost) { p.batt -= BAL.boostCost; p.boostT = BAL.boostT; snd('boost', p.x, p.z, 1); boostHit(p); } else { snd('click', p.x, p.z, 0.6); if (W.t - (p.lowMsg || -9) > 4) { p.lowMsg = W.t; say('电量不足——等手电慢慢充回来', p.id); } } } }
  }
  const pressed = inp.press !== p.lastPress; p.lastPress = inp.press;
  let it = inp.act >= 0 ? interactById(p, inp.act) : null;
  if (it && it.k !== 'hide' && idist(p, it) > BAL.reach + 0.7) it = null;
  if (it && it.k === 'hide' && p.hide < 0 && idist(p, it) > BAL.reach + 0.6) it = null;
  if (it && PZ[it.k] && PZ[it.k].skip && PZ[it.k].skip(it, W, p)) it = null;
  const wrong = it && roleOf(it, W) !== '*' && roleOf(it, W) !== p.role;
  if (!it || !inp.hold || wrong || (p.act && p.act.id !== it.id)) { if (p.act && W.rit && W.rit.by === p.id && (p.act.k === 'altar' || p.act.k === 'circle')) cancelRitual(); p.act = null; }
  if (it && wrong && pressed) say('这件事需要' + ROLES[roleOf(it, W)].name + '来做', p.id, '#ffb36b');
  if (!it || wrong) return;
  const pz = PZ[it.k]; if (!pz) return;
  if (pressed && pz.press) pz.press(p, it);
  const holdT = pz.hold ? pz.hold(p, it) : 0;
  if (holdT > 0 && inp.hold && !p.down) {
    if (!p.act) p.act = { id: it.id, k: it.k, p: it.k === 'circle' ? W.finP : 0 };
    let rate = 1;
    if (it.k === 'circle') { const o = W.p[1 - p.id]; if (o.down || dist(o.x, o.z, it.x, it.z) > BAL.finalGuard) { rate = 0; if (W.t - (W.guardMsg || -9) > 4) { W.guardMsg = W.t; say('法阵在减弱——持灯者必须守在法阵旁边！', -1, '#ffb36b'); } } }
    p.act.p = Math.min(1, p.act.p + dt / holdT * rate);
    if (pz.noise) { p.noise = 1; if (Math.random() < dt * 3) snd(pz.noise, it.x, it.z, 0.6); }
    if (W.rit && W.rit.by === p.id) { W.rit.p = p.act.p; if (it.k === 'circle') W.finP = p.act.p; }
    if (p.act.p >= 1) { pz.finish(p, it); p.act = null; }
  }
}
/* dial change from the rune UI */
function setDial(pid, i, v) {
  const fl = MAP.F.runeFlag; if (!fl || W.f[fl]) return; const p = W.p[pid]; if (p.role !== 'L') return;
  const it = MAP.inter.find(x => x.k === 'rune'); if (dist(p.x, p.z, it.x, it.z) > BAL.reach + 0.8) return;
  W.dials[i] = ((v % 6) + 6) % 6; snd('dial', it.x, it.z, 0.7);
  if (W.setup.code.every((g, k) => W.dials[k] === g)) { W.f[fl] = 1; unlockDoor(MAP.F.runeDoor); snd('unlock', it.x, it.z, 1.2); say(MAP.F.runeMsg, -1, '#ffd36b'); emit({ k: 'ui', ui: 'close', to: pid }); }
}
/* ---------- ritual ---------- */
function startRitual(pid, item) {
  const p = W.p[pid]; if (p.role !== 'S' || W.rit || !W.f.seal) return;
  if (!W.inv.includes(item) || !RITUAL_ITEMS.includes(item)) return;
  const al = MAP.inter.find(x => x.k === 'altar'); if (!al || (al.needFlag && !W.f[al.needFlag]) || dist(p.x, p.z, al.x, al.z) > BAL.reach + 0.8) return;
  W.rit = { item, by: pid, p: 0, t: 0 };
  say('灵视者把 ' + ITEMS[item].icon + ' ' + ITEMS[item].name + ' 放上' + (al.label || '祭坛') + '。按住 E 主持仪式——持灯者，守住她！', -1, '#c8a8ff');
  snd('ritualStart', al.x, al.z, 1.2);
  ghostRitual();
}
function cancelRitual(why) {
  if (!W.rit) return; const fin = W.rit.item === 'final'; if (fin) W.finP = W.rit.p;
  W.rit = null; say(why || (fin ? '念诵中断了！法阵的光暗了下去，但还没有熄灭。' : '仪式被打断了'), -1, '#ffb36b');
  if (fin) { const G = W.g; if (G.st === 'ritual' || G.st === 'stun') { G.st = 'hunt'; G.huntT = 8; } } else ghostEndHunt(true);
}
function stepRitual(dt) { W.rit.t += dt; const s = W.p[W.rit.by]; if (s.down) cancelRitual(W.rit.item === 'final' ? '灵视者倒下了，念诵中断……' : '仪式中断了……遗物还在祭坛上，可以再试一次'); }
function completeRitual(p) {
  const item = W.rit.item, G = W.g, gt = GT(W.setup.gtype);
  if (item === 'final') {
    W.rit = null; W.f.seal = 0; G.st = 'banish'; G.stT = 5; W.flick = 0; W.finP = 1;
    snd('banishBoss', G.x, G.z, 1.5); emit({ k: 'fx', fx: 'banish', boss: 1 });
    say('「温夫人……」灵视者念出了她的名字。宅主发出一声长长的、像是解脱的叹息，化成了灰白的光。头顶的天窗“哗啦”一声，铁链全断了。', -1, '#c8a8ff');
    return;
  }
  const right = item === gt.item; W.rit = null;
  W.inv.splice(W.inv.indexOf(item), 1);
  if (right) {
    W.f.seal = 0; G.st = 'banish'; G.stT = 3.5; W.flick = 0;
    snd('banish', G.x, G.z, 1.4); emit({ k: 'fx', fx: 'banish' });
    say('「' + gt.name + '」发出一声长长的叹息，消散了。楼梯上的灵封碎裂了！', -1, '#c8a8ff');
  } else {
    W.f.burned.push(item);
    snd('wrong', G.x, G.z, 1.4); emit({ k: 'fx', fx: 'wrong' });
    say(ITEMS[item].icon + ' ' + ITEMS[item].name + ' 化为灰烬——不是它要的东西！怨灵暴怒了！', -1, '#ff6b6b');
    G.rage = 1; ghostStartHunt(true, BAL.huntLen[1] + 6);
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
  if (GT(W.setup.gtype).ev.includes('mirror') && !W.evFound.mirror) {
    for (const m of MAP.mirrors) if (dist(h.x, h.z, m.x, m.z) < 6.5 && beamFactor(W, m.x, 1.2, m.z, m.r) > 0.3) { foundEvidence('mirror', m.x, m.z); break; }
  }
}
function foundEvidence(k, x, z) {
  if (W.evFound[k]) return; W.evFound[k] = 1;
  snd('evidence', x, z, 1); emit({ k: 'evidence', ev: k });
  const n = Object.keys(W.evFound).length;
  say('发现证据：' + EVID[k].icon + ' ' + EVID[k].name + (n >= 2 ? '　——打开日志（J）看看是哪种怨灵' : ''), -1, '#9fe8ff');
  if (n >= 2) emit({ k: 'fx', fx: 'reveal' });
}
/* ---------- fear ---------- */
const nearLitLamp = (Wm, x, z, r = BAL.lampR) => MAP.lamps.some((l, i) => Wm.lamps[i] && d2(l.x, l.z, x, z) < r * r);
function stepFear(dt) {
  const G = W.g, hunting = G.st === 'hunt' || G.st === 'ritual' || G.st === 'stun';
  for (const p of W.p) {
    if (p.down) { p.fear = Math.min(100, p.fear + dt * 2); continue; }
    const o = W.p[1 - p.id], sep = dist(p.x, p.z, o.x, o.z);
    let d = 0;
    if (sep > BAL.sepDist) d += BAL.fearSep * clamp((sep - BAL.sepDist) / 6 + 0.5, 0.5, 1.6); else if (sep < BAL.nearDist && !o.down) d += BAL.fearNear;
    const room = roomAt(p.x, p.z), lit = (room >= 0 && W.f.power && MAP.rooms[room].light) || nearLitLamp(W, p.x, p.z);
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
