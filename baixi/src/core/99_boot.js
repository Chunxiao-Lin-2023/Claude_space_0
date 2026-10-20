/* ===================== boot ===================== */
BX.data = BX.data || {};
(function boot() {
  const catIdx = id => BX.CATS.findIndex(c => c[0] === id);
  BX.list.sort((a, b) => catIdx(a.cat) - catIdx(b.cat) || (a.order || 50) - (b.order || 50));
  /* quick launch helper (tests / deep links): BX.quick('gomoku', {mode:'ai', level:3, n:2, opts:{}}) */
  BX.quick = function (id, o = {}) {
    const def = BX.games[id]; if (!def) throw new Error('no game ' + id);
    const mode = o.mode || def.modes[0];
    const opts = {}; for (const op of def.options || []) opts[op.key] = (o.opts && op.key in o.opts) ? o.opts[op.key] : op.def;
    const sel = {mode, n: o.n || def.defSeats || def.seats[0], humans: o.humans || 99, first: o.first || 'me', level: o.level || 2};
    if (mode === 'online') { BX.startOnline(def, opts, sel); return; }
    BX.launch(def, {mode, opts, seed: o.seed != null ? o.seed : BX.newSeed(), seats: BX.makeSeats(def, sel), sel});
  };
  BX.lobby.render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!$id('lobby').hidden) BX.lobby.render(); });
  const g = QS.get('game'); if (g && BX.games[g]) BX.quick(g, {mode: QS.get('mode') || undefined, level: +QS.get('level') || 2});
})();
