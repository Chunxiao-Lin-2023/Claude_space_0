/* ================= game flow + main loop ================= */
const STATE = { mode: 'title' };
let ME = 0;
const STEP = 1 / 60;
let acc = 0, lastT = performance.now();
function startGame(seed, roles, names, me, floor = 0) {
  ME = me; UI.lastSeq = 0; UI.pings = []; UI.bubbles = []; $('log').innerHTML = '';
  enterFloor(floor, seed, roles, names, null);
  showScreen('play');
  const r = ROLES[W.p[ME].role];
  addLog('你是' + r.name + '。' + (r.k === 'L' ? '你的手电照得出霜痕和镜中影；机关交给你。' : '你看得见怨灵和灵痕；仪式由你主持。'), r.color);
  if (floor === 0) setTimeout(() => addLog('大门锁死了，楼梯被灵封挡住。先四处找找证据。按 J 打开日志。', '#cfc3ae'), 2500);
}
/* build a floor (sim + map + 3D) — the host calls this directly, the guest when the 'floor' event arrives */
function enterFloor(fi, seed, roles, names, carry) {
  newFloor(fi, seed, roles, names, carry);
  buildWorld(W.setup);
  R3.camT.set(W.p[ME].x, 0, W.p[ME].z); MENU_W = null;
  INP.ePress = 0; INP.boost = 0; INP.eHeld = false; INP.aimAng = W.p[0].aim;
  W.p.forEach(p => { p.inp.press = 0; p.inp.boost = 0; p.lastPress = 0; p.lastBoost = 0; });
  NET.lastT = 0; NET.inN = 0;
  const F = FLOORS[fi]; UI.card = { t0: performance.now(), title: F.title, sub: F.sub }; UI.ascending = false;
  try { const pr = LS.get('prog', { max: 0 }); if (fi > pr.max) LS.set('prog', { max: fi }); } catch (e) { }
  if (fi > 0) setTimeout(() => { if (W && W.floor === fi) addLog(fi === 1 ? '你们回头看了一眼——楼梯口的灵封又亮了起来。只能往上走。' : '阁楼里很冷。你们能感觉到，她就在这里。', '#cfc3ae'); }, 2600);
  sfx('evidence');
}
function guestFloor(e) { if (!W || W.floor === e.f) return; enterFloor(e.f, e.seed, W.p.map(p => p.role), W.p.map(p => p.name), carryOf(W)); }
function backToLobby() { W = null; STATE.mode = 'lobby'; NET.ready = [false, false]; showScreen('lobby'); lobbyUI(); if (R3.world) { buildMap(0); buildWorld(null); MENU_W = null; } }
/* fake partner for local tests (?solo=1, test build only) */
function soloBot(dt) {
  const b = W.p[1], a = W.p[0], d = dist(a.x, a.z, b.x, b.z);
  const i = b.inp; i.run = false;
  if (d > 2.2) { const ang = Math.atan2(a.z - b.z, a.x - b.x); i.mx = Math.cos(ang); i.mz = Math.sin(ang); } else { i.mx = 0; i.mz = 0; }
  i.aim = Math.atan2(a.z - b.z, a.x - b.x);
}
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now(); let dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (window.__dbg && window.__dbg.speed) dt *= window.__dbg.speed;
  if (STATE.mode === 'play' && W) {
    const me = W.p[ME];
    if (W.phase === 'play') readInput(me); else { me.inp.mx = me.inp.mz = 0; me.inp.hold = false; }
    if (NETROLE === 'guest') { movePlayer(me, dt, W); guestNetTick(dt); }
    else {
      if (NETROLE === 'solo' && !(window.__dbg && window.__dbg.noBot)) soloBot(dt);
      acc += dt; let n = 0; while (acc >= STEP && n < 6) { stepGame(STEP); acc -= STEP; n++; } if (n === 6) acc = 0;
      hostNetTick(dt);
    }
    // footsteps (local presentation)
    for (const p of W.p) { p._ph = (p._ph || 0) + dt * (p.spd > 0.2 ? 1.6 + p.spd * 0.55 : 0); if (p._ph >= 1) { p._ph -= 1; if (p.hide < 0) sfx('step', p.x, p.z, (p.run ? 1 : 0.55) * (p.id === ME ? 0.8 : 1)); } }
    processEvents();
    AU.lx = me.x; AU.lz = me.z; updateAmbience(W, me, dt);
    if (!(window.__dbg && window.__dbg.skipDraw)) renderFrame(W, ME, dt);
    updateHUD(me, dt);
  } else if (R3.world) {
    // title / lobby: slow drift outside the front of the house in the rain
    const t = now / 1000;
    if (!MENU_W) MENU_W = menuWorld();
    MENU_W.p[0].x = 17 + Math.sin(t * 0.05) * 5; MENU_W.p[0].z = 31.5; MENU_W.p[1].x = MENU_W.p[0].x - 1.1; MENU_W.p[1].z = 31.9; MENU_W.p[0].aim = -HP + Math.sin(t * 0.3) * 0.3;
    if (!(window.__dbg && window.__dbg.skipDraw)) renderFrame(MENU_W, 0, dt);
  }
}
let MENU_W = null;
function menuWorld() {
  const p = newPlayer(0, 'L', 17, 33), q = newPlayer(1, 'S', 15.8, 33.4); p.hide = -1; q.hide = -1; p.fear = 30; q.fear = 30;
  return { menu: true, t: 0, now: 0, p: [p, q], g: { x: 17, z: 18, a: 0, st: 'roam', man: 0, fade: 1, spd: 0 }, doors: MAP.doors.map(d => ({ open: d.kind === 'arch' ? 1 : 0 })), lv: [0, 0], dials: [0, 0, 0, 0], f: { power: 0, seal: 1 }, items: [], flick: 0, hideA: [], E: [], setup: null };
}
