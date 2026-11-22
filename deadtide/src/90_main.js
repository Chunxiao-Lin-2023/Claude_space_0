/* ================= game start, main loop, title-screen attract mode ================= */
let ACC = 0, LAST = 0, HUD_BUILT = false, TIPS = [];
function startGame(seed, names, diff, me, mode, map) {
  TIPS.forEach(clearTimeout); TIPS = [];
  mode = MODES[mode] ? mode : (MODES[SET.mode] ? SET.mode : 'siege'); setMap(map || SET.map || MODES[mode].map);
  ME = me; newWorld(seed, names, diff, mode); buildTerrain(); archTown();
  Object.assign(RND, { parts: [], tracers: [], corpses: [], floats: [], flashes: [], booms: [], hurtV: 0 });
  STATE.mode = 'play'; STATE.paused = false; ACC = 0; NET.lastT = 0; VIEW.auto = true; CUT_KEY = '';
  if (SET.zv !== 2) { SET.zv = 2; SET.zoom = 8; saveSet(); } /* round 8: default view one step closer, applied once */
  CAM.zoom = clamp(+SET.zoom || 8, 4, 22); if (CAM.zoom < 4.5) CAM.zoom = 8;
  showScreen('play');
  if (!HUD_BUILT) { buildHudStatic(); HUD_BUILT = true; }
  $('over').classList.add('hidden'); $('log').innerHTML = '';
  const p = W.p[ME]; CAM.tx = p.x; CAM.ty = p.y;
  uiBuildBar(); markDiff(); uiView();
  banner(MODES[W.mode].icon + ' ' + MODES[W.mode].name + ' · ' + MAPDEF.name, W.mode === 'classic' ? '撑过 ' + BAL.nights + ' 夜就能等到救援 · 完成每日任务拿奖励' : MODES[W.mode].desc, '#ffe7b0'); UI.tkv = -1;
  const tips = W.mode === 'siege' ? (INP.touch
    ? ['点一下丧尸选中（蓝圈），再点它一下就开火，一直打到倒下；点空地停火', '睡着的丧尸头上有「z」：摸过去用刀一刀一个，没声音', '「?」变大是它快发现你了——绕到背后或者先退开', '红色标记的楼里睡着丧尸：少开枪就不会吵醒一整屋', '清掉一栋楼会拿到图纸箱：蓝图解锁地雷、机枪塔、车', '哪里都能建：点「建造」就地封门、放木板路障', '每夜到点就天亮——找栋清理过的楼守住', '地上的弹药盒、箱子都比以前给得多']
    : ['睡着的丧尸头上有「z」：摸过去用刀（右键）一刀一个，没声音', '「?」变大是它快发现你了——绕到背后或者先退开', '红色标记的楼里睡着丧尸：少开枪就不会吵醒一整屋（弩几乎没声音）', '清掉一栋楼会拿到图纸箱：蓝图解锁地雷、机枪塔、自行车和摩托车', '哪里都能建：按 B 就地封门、放木板路障', '每夜到点就天亮——找栋清理过的楼守住', '有车以后按 T 上下车，骑着走得快但不能开枪']) : INP.touch
    ? ['出门砍树、采石，点一下「交互」搜汽车和补给箱（会自动搜完）', '点「建造」后手指指哪就盖哪：点墙顶往上叠，点墙面贴着盖，拖动一次盖一排', '上方「今日任务」点开能看到今天的 3 个任务，完成就有奖励', '进到任何建筑里，点右上「制作」就能造枪、买弹药', '楼上的矮墙可以探身开枪，天黑前回到堡垒', '丧尸成群结队地来：手雷、喷火器、榴弹专打扎堆的，红色油桶打一枪就炸']
    : ['出门砍树、采石，按 F 搜汽车和补给箱（会自动搜完，走开就停）', '按 B 建造：鼠标指哪就盖哪——指墙顶往上叠、指墙面贴着盖，按住拖动一次盖一排，右键拆除', '上方「今日任务」点开能看到今天的 3 个任务，完成就有奖励', '进到任何建筑里按 C 就能造枪、买弹药（营地工作台也行）', '楼上外墙是半人高的矮墙，可以探身朝下开枪。按 N 可以提前入夜', '丧尸成群结队地来：手雷（G）、喷火器、榴弹专打扎堆的，红色油桶打一枪就炸'];
  tips.forEach((t, k) => TIPS.push(setTimeout(() => { if (W && W.night === 0 && STATE.mode === 'play') uiMsg(t, '#ffd27a'); }, 2500 + k * 7000)));
}
function startDemo() {
  setMap(MAPS[SET.map] ? SET.map : 'town'); ME = 0; newWorld(777, ['demo'], 'normal', 'classic'); W.demo = true; W.p[0].gone = true;
  W.phase = 'night'; W.night = 4; W.demoT = 0; buildTerrain(); archTown(); VIEW.auto = false; VIEW.L = 1; CUT_KEY = ''; CAM.zoom = 11;
}
function demoStep(dt) {
  W.t += dt; W.demoT += dt;
  if (W.zs.length < 16 && Math.random() < dt * 1.2) spawnZombie(Math.random() < 0.15 ? 'climber' : Math.random() < 0.08 ? 'brute' : 'walker', Math.floor(Math.random() * 4));
  updateFields(dt); stepZombies(dt); stepProj(dt);
  if (W.demoT > 120) startDemo();
}
function smoothZ(dt) { for (const p of W.p) { const z = p.rz != null ? p.rz : p.z; if (p.zv == null) p.zv = z; if (z < p.zv - 0.05) p.zv = Math.max(z, p.zv - 7 * dt); else p.zv = lerp(p.zv, z, Math.min(1, dt * 20)); } }
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (LAST || now)) / 1000); LAST = now;
  const sp = DBG && DBG.speed != null ? DBG.speed : 1;
  try {
    if (STATE.mode === 'play' && W && !W.demo) {
      readInput(dt);
      if (!STATE.paused) {
        if (NETROLE === 'guest') {
          const n = Math.ceil(dt / (1 / 60)); for (let k = 0; k < n; k++) stepMove(W.p[ME], dt / n);
          for (const p of W.p) { p.rx = p.x; p.ry = p.y; p.rz = p.z; p.rjz = p.jz || 0; }
          guestPredictFire(dt); guestNetTick(dt);
        } else {
          ACC += dt * sp; let n = 0; const me = W.p[ME];
          while (ACC >= 1 / 60 && n++ < 8 * Math.max(1, sp)) { if (me) { me._ox = me.x; me._oy = me.y; me._oz = me.z; me._ojz = me.jz || 0; } simStep(1 / 60); ACC -= 1 / 60; }
          // (round 34) the sim steps at a fixed 60 Hz; draw your own survivor between the last two steps so a 120 Hz screen (or an uneven frame) doesn't stutter
          const al = clamp(ACC * 60, 0, 1);
          for (const p of W.p) { if (p === me && me._ox != null && Math.abs(p.x - me._ox) + Math.abs(p.y - me._oy) < 1.5) { p.rx = lerp(me._ox, p.x, al); p.ry = lerp(me._oy, p.y, al); p.rz = lerp(me._oz, p.z, al); p.rjz = lerp(me._ojz, p.jz || 0, al); } else { p.rx = p.x; p.ry = p.y; p.rz = p.z; p.rjz = p.jz || 0; } }
          if (NETROLE === 'host') hostNetTick(dt);
        }
      }
      smoothZ(dt); visTick(); // (round 34d) who can see what (also with drawing off)
      if (!(DBG && DBG.skipDraw)) { draw(dt); drawMinimap(dt); } else updateCamera(dt);
      hudTick(dt); audioTick(dt);
    } else {
      if (!W || !W.demo) startDemo();
      demoStep(dt);
      if (!(DBG && DBG.skipDraw)) draw(dt);
    }
  } catch (e) { console.error(e); if (DBG) DBG.err = (DBG.err || '') + e.message + ' @ ' + (e.stack || '').split('\n')[1] + '\n'; }
}
