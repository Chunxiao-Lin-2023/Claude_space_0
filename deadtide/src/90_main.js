/* ================= game start, main loop, title-screen attract mode ================= */
let ACC = 0, LAST = 0, HUD_BUILT = false, TIPS = [];
function startGame(seed, names, diff, me, mode, map) {
  TIPS.forEach(clearTimeout); TIPS = [];
  mode = MODES[mode] ? mode : (MODES[SET.mode] ? SET.mode : 'classic'); setMap(map || SET.map || MODES[mode].map);
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
  const tips = INP.touch
    ? ['出门砍树、采石，点一下「交互」搜汽车和补给箱（会自动搜完）', '点「建造」后手指指哪就盖哪：点墙顶往上叠，点墙面贴着盖，拖动一次盖一排', '上方「今日任务」点开能看到今天的 3 个任务，完成就有奖励', '小屋里的工作台可以造步枪和狙击枪', '楼上的矮墙可以探身开枪，天黑前回到堡垒']
    : ['出门砍树、采石，按 F 搜汽车和补给箱（会自动搜完，走开就停）', '按 B 建造：鼠标指哪就盖哪——指墙顶往上叠、指墙面贴着盖，按住拖动一次盖一排，右键拆除', '上方「今日任务」点开能看到今天的 3 个任务，完成就有奖励', '在小屋里的工作台按 F 造步枪和狙击枪', '楼上外墙是半人高的矮墙，可以探身朝下开枪。按 N 可以提前入夜'];
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
function smoothZ(dt) { for (const p of W.p) { if (p.zv == null) p.zv = p.z; if (p.z < p.zv - 0.05) p.zv = Math.max(p.z, p.zv - 7 * dt); else p.zv = lerp(p.zv, p.z, Math.min(1, dt * 20)); } }
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
          guestPredictFire(dt); guestNetTick(dt);
        } else {
          ACC += dt * sp; let n = 0;
          while (ACC >= 1 / 60 && n++ < 8 * Math.max(1, sp)) { simStep(1 / 60); ACC -= 1 / 60; }
          if (NETROLE === 'host') hostNetTick(dt);
        }
      }
      smoothZ(dt);
      if (!(DBG && DBG.skipDraw)) { draw(dt); drawMinimap(dt); } else updateCamera(dt);
      hudTick(dt); audioTick(dt);
    } else {
      if (!W || !W.demo) startDemo();
      demoStep(dt);
      if (!(DBG && DBG.skipDraw)) draw(dt);
    }
  } catch (e) { console.error(e); if (DBG) DBG.err = (DBG.err || '') + e.message + ' @ ' + (e.stack || '').split('\n')[1] + '\n'; }
}
