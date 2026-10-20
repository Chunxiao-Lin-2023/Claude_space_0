/* ================= game start, main loop, title-screen attract mode ================= */
let ACC = 0, LAST = 0, HUD_BUILT = false, TIPS = [];
function startGame(seed, names, diff, me) {
  TIPS.forEach(clearTimeout); TIPS = [];
  ME = me; newWorld(seed, names, diff); buildTerrain();
  Object.assign(RND, { parts: [], tracers: [], corpses: [], floats: [], flashes: [], booms: [], hurtV: 0 });
  STATE.mode = 'play'; STATE.paused = false; ACC = 0; NET.lastT = 0; VIEW.auto = true; CUT_KEY = '';
  CAM.zoom = clamp(+SET.zoom || 9, 4, 22); if (CAM.zoom < 4.5) CAM.zoom = 9;
  showScreen('play');
  if (!HUD_BUILT) { buildHudStatic(); HUD_BUILT = true; }
  $('over').classList.add('hidden'); $('log').innerHTML = '';
  const p = W.p[ME]; CAM.tx = p.x; CAM.ty = p.y;
  uiBuildBar(); markDiff(); uiView();
  banner('第一个白天', '电台在呼救 · 撑过 ' + BAL.nights + ' 夜就能等到救援', '#ffe7b0');
  const tips = INP.touch
    ? ['出门砍树、采石，按住「交互」搜汽车和补给箱', '点「建造」盖墙、楼板、楼梯——只能盖在电台周围的黄框里', '右上角可以缩放、转镜头、切换楼层视图', '电台旁的工作台可以造步枪和狙击枪', '天黑前回到堡垒，丧尸会过桥、翻山涌来']
    : ['出门砍树、采石，按住 F 搜汽车和补给箱', '按 B 建造：墙、楼板、楼梯、门、射击栅栏——只能盖在电台周围的黄框里', '滚轮缩放，Q / E 转镜头，PageUp / PageDown 切换楼层视图', '在电台旁的工作台按 F 造步枪和狙击枪', '天黑前回到堡垒，丧尸会过桥、翻山涌来。按 N 可以提前入夜'];
  tips.forEach((t, k) => TIPS.push(setTimeout(() => { if (W && W.night === 0 && STATE.mode === 'play') uiMsg(t, '#ffd27a'); }, 2500 + k * 7000)));
}
function startDemo() {
  ME = 0; newWorld(777, ['demo'], 'normal'); W.demo = true; W.p[0].gone = true;
  W.phase = 'night'; W.night = 4; W.demoT = 0; buildTerrain(); VIEW.auto = false; VIEW.L = 1; CUT_KEY = ''; CAM.zoom = 11;
}
function demoStep(dt) {
  W.t += dt; W.demoT += dt;
  if (W.zs.length < 16 && Math.random() < dt * 1.2) spawnZombie(Math.random() < 0.15 ? 'climber' : Math.random() < 0.08 ? 'brute' : 'walker', Math.floor(Math.random() * 4));
  updateFields(dt); stepZombies(dt); stepProj(dt);
  if (W.radio.hp <= 0 || W.demoT > 120) startDemo();
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
