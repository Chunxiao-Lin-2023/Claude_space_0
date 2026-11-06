/* ================= main loop ================= */
let lastT = performance.now(), titleA = 0, simAcc = 0, hudAcc = 0, saveAcc = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (STATE.mode === 'title' || STATE.mode === 'lobby') {
    titleA += dt * 0.05; CAM.x = Math.sin(titleA) * 160; CAM.y = N * TH / 2 - 10 + Math.cos(titleA * 0.7) * 50;
    if (NETROLE === 'backdrop' && G && !G.over) { simAcc += dt; while (simAcc >= SIM_DT) { step(SIM_DT); simAcc -= SIM_DT; } }   // the city keeps building behind the title
  } else if (simRuns()) {
    simAcc += dt * (NETROLE === 'solo' ? STATE.speed : 1);
    let n = 0; while (simAcc >= SIM_DT && n++ < 12) { step(SIM_DT); simAcc -= SIM_DT; }
    if (G.seq !== STATE.lastSeq || G.over) onState();
  }
  camStep(dt); keyPan(dt);
  if (NETROLE === 'host') hostNetTick(dt); else if (NETROLE === 'guest') guestNetTick(dt);
  render(dt);
  if (STATE.mode === 'play') {
    if ((hudAcc -= dt) <= 0) { hudAcc = 0.2; renderHUD(false); }
    if (STATE.sel >= 0) placeQC();
    if (NETROLE === 'solo' && (saveAcc -= dt) <= 0) { saveAcc = 5; saveGame(); }
  }
  requestAnimationFrame(frame);
}
addEventListener('resize', () => { if (STATE.mode === 'play') renderHUD(true); });
PHONE.addEventListener && PHONE.addEventListener('change', () => { if (STATE.mode === 'play') renderHUD(true); });
addEventListener('pagehide', () => { if (STATE.mode === 'play') saveGame(); });
