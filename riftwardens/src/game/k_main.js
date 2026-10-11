/* =================== title-screen demo (live backdrop) =================== */
function demoInit() {
  IS_HOST = true; MEI = 0; P = []; ME = null;
  newWorld(0, 1); G.demo = true; G.phase = 'demo'; G.gold = 1e6; G.dT = 0.5;
  const fake = {x: 0, y: 0, trapLv: {spikes: 2, arrow: 2, tar: 1}};
  const put = (k, tx, ty) => { fake.x = tc(tx); fake.y = tc(ty) + (TRAPS[k].place === 'wall' ? T : 0); placeTrap(fake, k, tx, ty, 0); };
  put('spikes', 4, 9); put('spikes', 5, 12); put('tar', 4, 15); put('spikes', 10, 15); put('spikes', 11, 16);
  fake.x = tc(5); fake.y = tc(10); placeTrap(fake, 'arrow', 7, 10, 0);
  fake.x = tc(14); fake.y = tc(15); placeTrap(fake, 'arrow', 14, 13, 0);
  G.ev.length = 0; FX.length = 0;
  prerenderMap(); resize();
  CAM.x = tc(6); CAM.y = tc(8);
}
function demoTick(dt) {
  G.dT -= dt;
  if (G.dT <= 0) { G.dT = rnd(0.8, 1.6); const gt = G.map.gates[0]; spawnOrc(['grunt', 'grunt', 'kobold', 'archer', 'grunt'][rint(0, 4)], tc(gt.x) + rnd(-8, 8), tc(gt.y) + rnd(-8, 8)); if (Math.random() < 0.06) spawnOrc('ogre', tc(gt.x), tc(gt.y)); }
  updWorld(dt); G.rift = G.riftMax; G.ev.length = 0;
  // slow cinematic pan following the pack
  const lead = G.enemies.filter(alive).sort((a, b) => a.id - b.id)[Math.floor(G.enemies.length / 3)];
  if (lead) { const k = 1 - Math.exp(-0.6 * dt); CAM.x += (lead.x - CAM.x) * k; CAM.y += (lead.y - CAM.y) * k; }
}

/* =================== main loop =================== */
let lastT = performance.now();
const FXT = {stop: 0, slow: 0};
function frame(t) {
  requestAnimationFrame(frame);
  const rdt = Math.min(0.05, Math.max(0, (t - lastT) / 1000)); lastT = t; const now = t / 1000;
  let dt = STATE === 'play' && NET.mode !== 'online' ? rdt * TIME_SCALE : rdt;
  if (NET.mode !== 'online') { if (FXT.stop > 0) { FXT.stop -= rdt; dt = 0; } else if (FXT.slow > 0) { FXT.slow -= rdt; dt *= 0.3; } }
  if (G && G.demo) { if (STATE === 'title') demoTick(dt); }
  else if (STATE === 'play' && G) {
    if (!PAUSED) {
      updLocal(dt);
      if (IS_HOST) { updWorld(dt); hostInterpGuest(dt); netHostTick(dt); }
      else { updLocalCosmetics(dt); guestInterp(dt); netGuestTick(dt); }
      if (G.phase === 'won' || G.phase === 'lost') { G.endT2 = (G.endT2 || 0) + dt; if (G.endT2 > 2.6 && !G.resShown) showResult(); }
    }
    updCamera(rdt); updHud(rdt); tutTick(rdt); updPerkUI();
  } else if (STATE === 'title' && !G) demoInit();
  if (!PAUSED) updFx(dt);
  render(now);
}
/*__DBG__*/
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('#menu')) e.preventDefault(); }, {passive: false});
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden && STATE === 'play' && NET.mode !== 'online' && !PAUSED) togglePause(); });
// boot
resize(); setMute(AU.muted);
showMenu('<div class="note" style="font-size:18px">正在加载…</div>');
loadSheets().then(() => {
  titleScreen();
  requestAnimationFrame(frame);
  if (QS.get('join')) { $('code').value = QS.get('join'); }
});
</script>
</body></html>
