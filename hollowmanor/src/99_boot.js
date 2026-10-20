/* ================= boot ================= */
function boot() {
  buildMap(); buildTextures(); buildMaterials(); initRender(); buildWorld(null);
  initInput(); initMenus(); showScreen('title'); lobbyUI('');
  const ld = document.getElementById('loading'); ld.style.transition = 'opacity .8s'; ld.style.opacity = 0; setTimeout(() => ld.remove(), 800);
  if (window.__dbg && QS.get('solo') === '1') { NETROLE = 'solo'; startGame(+(QS.get('seed') || 7), [QS.get('role') === 'S' ? 'S' : 'L', QS.get('role') === 'S' ? 'L' : 'S'], ['测试', '机器人'], 0, +(QS.get('floor') || 0)); }
  window.__ready = true;
  requestAnimationFrame(frame);
}
window.addEventListener('load', () => setTimeout(() => { try { boot(); } catch (e) { console.error(e); const ld = document.getElementById('loading'); if (ld) ld.lastChild.textContent = '启动失败：' + e.message; } }, 30));
