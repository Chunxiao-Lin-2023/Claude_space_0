/* ================= main loop ================= */
let lastT = performance.now(), titleA = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (STATE.mode === 'title' || STATE.mode === 'lobby') { titleA += dt * 0.05; CAM.x = Math.sin(titleA) * 160; CAM.y = N * TH / 2 - 10 + Math.cos(titleA * 0.7) * 50; }
  camStep(dt); keyPan(dt);
  if (NETROLE === 'host') hostNetTick(dt); else if (NETROLE === 'guest') guestNetTick(dt);
  render(dt);
  requestAnimationFrame(frame);
}
addEventListener('resize', () => { if (STATE.mode === 'play') renderUI(); });
PHONE.addEventListener && PHONE.addEventListener('change', () => { if (STATE.mode === 'play') renderUI(); });
