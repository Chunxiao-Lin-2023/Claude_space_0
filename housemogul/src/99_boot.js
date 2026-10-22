/* ================= boot ================= */
resize(); initAmbient(); setSound(AU.on);
toTitle();
$('loading').classList.add('hidden');
window.__ready = true;
requestAnimationFrame(t => { lastT = t; frame(t); });
