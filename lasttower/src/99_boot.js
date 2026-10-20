/* ================= boot ================= */
(function boot() {
  initArt(); initUI(); buildHudStatic(); HUD_BUILT = true;
  showScreen('title');
  if (QS.get('join')) $('codeIn').value = QS.get('join').toUpperCase().slice(0, 4);
  $('loading').classList.add('hidden');
  window.__ready = true;
  requestAnimationFrame(frame);
})();
