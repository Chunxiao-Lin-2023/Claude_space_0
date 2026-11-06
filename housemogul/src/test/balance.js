// Headless balance for the real-time sim: node test/balance.js
// Bots act once per second of game time; reports seconds to buy the mansion.
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = path.join(__dirname, '..');
function mk() {
  const ctx = { console, Math, JSON, Object, Array, Set, Map, Number, String, URLSearchParams, location: { search: '' }, localStorage: null, document: {} };
  vm.createContext(ctx);
  for (const f of ['00_core.js', '10_world.js', '30_sim.js']) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8').replace(/^'use strict';/, '').replace(/\bconst (\w+) =/g, 'var $1 =').replace(/\blet G\b/, 'var G'), ctx);
  vm.runInContext(`
  function smart(i) {
    const pl = G.pl[i]; if (!pl.alive) return;
    const man = mansionP(), need = mansionPrice() * (1 + buyFee());
    if (man.owner === -1 && pl.cash >= need) { doAct(i, 'buy', { id: man.id }); return; }
    const goal = netWorth(i) > need * 1.03;
    for (const p of ownedBy(i)) { if (!canSell(p)) continue; const g = p.offer * (1 - sellFee()) / p.paid; if (goal || g > 1.10 || p.hotT > 0) doAct(i, 'sell', { id: p.id }); }
    if (goal) return;
    const ls = G.props.filter(p => p.list && p.owner === -1 && p.kind !== 'mansion' && !p.stage).sort((a, b) => a.list.ask / val(a) - b.list.ask / val(b));
    for (const p of ls) {
      if (p.list.ask / estOf(p) > 0.93) break;
      if (OP('insp') && !knows(p, i)) doAct(i, 'inspect', { id: p.id });
      if (p.list.ask / val(p) > 0.94) continue;
      const loan = OP('loan') && pl.cash < p.list.ask * 1.1, cost = buyCost(p.list.ask, loan), res = (debtOf(i) + (loan ? p.list.ask * 0.7 : 0)) * G.rate * 6;
      if (pl.cash - cost > res) { doAct(i, 'buy', { id: p.id, loan }); return; }
    }
  }
  // follows the easy-mode labels only: buys anything 超值/划算 it can afford, sells on 可以卖
  function novice(i) {
    const pl = G.pl[i]; const man = mansionP(), need = mansionPrice() * (1 + buyFee());
    if (man.owner === -1 && pl.cash >= need) { doAct(i, 'buy', { id: man.id }); return; }
    for (const p of ownedBy(i)) { const a = sellAdvice(p); if (a.k === 'sell' || (netWorth(i) > need && canSell(p))) doAct(i, 'sell', { id: p.id }); }
    for (const p of G.props.filter(p => p.list && p.owner === -1 && p.kind !== 'mansion' && !p.stage)) { const d = dealOf(p, i); if ((d.k === 'great' || d.k === 'good') && pl.cash >= buyCost(p.list.ask, false)) { doAct(i, 'buy', { id: p.id }); return; } }
  }
  var BOT_DT = 3;   // a human looks at the map and acts roughly every 3 s
  function run(bot, opt, ai, seed, diff) {
    newGame(seed, ['bot'], ai, opt, diff); let acc = 0;
    while (!G.over) { step(SIM_DT); acc += SIM_DT; if (acc >= BOT_DT) { acc = 0; bot(0); } }
    const s = { builds: G.props.filter(p => p.id > 0).length, gone: G.props.filter(p => p.gone).length };
    return Object.assign({}, G.over, s);
  }`, ctx);
  return ctx;
}
const ctx = mk(), P = ctx.PRESET;
const stat = (bot, opt, ai, diff, n = 30) => {
  const r = []; let w = 0, aiw = 0, b = 0, g = 0;
  for (let s = 1; s <= n; s++) { const o = ctx.run(ctx[bot], opt, ai, s * 101, diff); b += o.builds; g += o.gone; if (o.reason === 'mansion' && o.winner === 0) { w++; r.push(o.t); } else if (o.winner === 1) aiw++; }
  r.sort((a, b) => a - b); const q = x => r.length ? ctx.clock(r[Math.floor(x * (r.length - 1))]) : '-';
  return `${bot.padEnd(7)} wins ${w}/${n} ai ${aiw}  p25/p50/p75 ${q(.25)}/${q(.5)}/${q(.75)}`;
};
const only = process.argv[2];
for (const d of ['easy', 'normal', 'hard']) {
  if (only && only !== d) continue;
  console.log(d, 'pure ', stat('smart', P.pure, 0, d));
  console.log(d, 'pure ', stat('novice', P.pure, 0, d));
  console.log(d, 'full ', stat('smart', P.full, 0, d));
  console.log(d, 'pure vs ai', stat('smart', P.pure, 1, d));
}
// city growth sanity
vm.runInContext(`newGame(7, ['x'], 0, PRESET.pure, 'normal'); var n0 = G.props.filter(p=>!p.gone).length; for (let k = 0; k < 6000; k++) step(SIM_DT);
  console.log('city after 10 min: houses', n0, '->', G.props.filter(p=>!p.gone).length, 'built', G.props.length - n0 - 0, 'demolished', G.props.filter(p=>p.gone).length, 'listed', G.props.filter(p=>p.list&&p.kind!=='mansion').length, 'idx', G.d.map(d=>d.idx.toFixed(2)).join(' '))`, ctx);
