/* ================= game start, main loop, title-screen attract mode ================= */
let ACC = 0, LAST = 0, HUD_BUILT = false, TIPS = [];
function startGame(seed, names, diff, me) {
  TIPS.forEach(clearTimeout); TIPS = [];
  ME = me; newWorld(seed, names, diff);
  Object.assign(RND, { parts: [], tracers: [], corpses: [], floats: [], flashes: [], booms: [], bgDirty: true, hurtV: 0 });
  STATE.mode = 'play'; STATE.paused = false; ACC = 0; NET.lastT = 0;
  showScreen('play');
  if (!HUD_BUILT) { buildHudStatic(); HUD_BUILT = true; }
  $('over').classList.add('hidden'); $('log').innerHTML = '';
  const p = W.p[ME]; CAM.x = p.x; CAM.y = p.y - 1.6 * T;
  uiBuildBar(); markDiff();
  banner('第一个白天', '修好的电台在呼救 · 撑过 ' + BAL.nights + ' 夜就能等到救援', '#ffe7b0');
  const tips = INP.touch
    ? ['出门往两边走，按住「交互」搜索废墟、车子和补给箱', '点「建造」盖墙、楼板、梯子——只能盖在两根黄色标杆之间', '电台旁的工作台可以造步枪和狙击枪', '天黑前回到楼里，丧尸会从两边涌来']
    : ['出门往两边走，按住 E 搜索废墟、车子和补给箱', '按 B 建造：墙、楼板、梯子、门、射击栅栏——只能盖在两根黄色标杆之间', '在电台旁的工作台按 E 造步枪和狙击枪', '天黑前回到楼里，丧尸会从两边涌来。按 N 可以提前入夜'];
  tips.forEach((t, k) => TIPS.push(setTimeout(() => { if (W && W.night === 0 && STATE.mode === 'play') uiMsg(t, '#ffd27a'); }, 2500 + k * 7000)));
}
function startDemo() {
  ME = 0; newWorld(777, ['demo'], 'normal');
  W.demo = true; W.p[0].gone = true; W.p[0].x = RADIO.x - 3 * T; W.phase = 'night'; W.night = 3; W.demoT = 0;
  CAM.x = W.p[0].x; CAM.y = GY - 6 * T;
}
function demoStep(dt) {
  W.t += dt; W.demoT += dt;
  if (W.zs.length < 12 && Math.random() < dt * 0.8) spawnZombie(Math.random() < 0.15 ? 'climber' : Math.random() < 0.1 ? 'brute' : 'walker', Math.random() < 0.5 ? -1 : 1);
  stepZombies(dt); stepProj(dt);
  if (W.radio.hp <= 0 || W.demoT > 90) startDemo();
  CAM.lookX = Math.sin(W.t * 0.12) * 7 * T; CAM.lookY = -2 * T;
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (LAST || now)) / 1000); LAST = now;
  const sp = DBG && DBG.speed || 1;
  try {
    if (STATE.mode === 'play' && W && !W.demo) {
      readInput(dt);
      if (!STATE.paused) {
        if (NETROLE === 'guest') {
          const n = Math.ceil(dt / (1 / 60)); for (let k = 0; k < n; k++) stepMove(W.p[ME], dt / n);
          guestPredictFire(dt); guestNetTick(dt);
        } else {
          ACC += dt * sp; let n = 0;
          while (ACC >= 1 / 60 && n++ < 8 * sp) { simStep(1 / 60); ACC -= 1 / 60; }
          if (NETROLE === 'host') hostNetTick(dt);
        }
      }
      if (!(DBG && DBG.skipDraw)) draw(dt);
      hudTick(dt); audioTick(dt);
    } else {
      if (!W || !W.demo) startDemo();
      demoStep(dt);
      if (!(DBG && DBG.skipDraw)) draw(dt);
    }
  } catch (e) { console.error(e); if (DBG) DBG.err = (DBG.err || '') + e.message + '\n'; }
}
