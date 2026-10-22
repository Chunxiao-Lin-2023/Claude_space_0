// Headless balance: runs the sim (00/10/30) in node with bots. node test/balance.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = path.join(__dirname, '..');
const ctx = { console, Math, JSON, Object, Array, Set, Map, Number, String, URLSearchParams, location: { search: '' }, localStorage: null, document: {} };
vm.createContext(ctx);
for (const f of ['00_core.js', '10_world.js', '30_sim.js']) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8').replace(/^'use strict';/, '').replace(/\bconst (\w+) =/g, 'var $1 =').replace(/\blet G\b/, 'var G'), ctx);
vm.runInContext(`
function bot(i, agg) {
  const pl = G.pl[i]; if (!pl.alive) return;
  const man = mansionP(), need = man.list ? man.list.ask * (1 + buyFee()) : 1e9;
  if (pl.cash >= need) { doAct(i, 'buy', { id: man.id }); return; }
  const goal = netWorth(i) > need * 1.04;
  for (const p of ownedBy(i)) { if (p.reno) continue; const g = p.offer * (1 - sellFee()) / p.paid; if (goal || g > 1 + 0.10 * agg || p.offer > val(p) * 1.06 || (p.loan && heat() < -0.04)) doAct(i, 'sell', { id: p.id }); }
  if (goal) { if (pl.cash >= need) doAct(i, 'buy', { id: man.id }); return; }
  const ls = G.props.filter(p => p.list && p.owner === -1 && p.kind !== 'mansion').sort((a, b) => a.list.ask / estOf(a) - b.list.ask / estOf(b));
  for (const p of ls) {
    if (p.list.ask / estOf(p) > 0.93) break;
    if (OP('insp') && !knows(p, i)) doAct(i, 'inspect', { id: p.id });
    if (p.list.ask / val(p) > 0.94) continue;
    const loan = OP('loan') && agg > 1 && pl.cash < p.list.ask * 1.1;
    const cost = buyCost(p.list.ask, loan), res = (debtOf(i) + (loan ? p.list.ask * 0.7 : 0)) * G.rate * 6;
    if (pl.cash - cost > res) doAct(i, 'buy', { id: p.id, loan });
  }
  if (OP('reno')) for (const p of ownedBy(i)) { const R = renoInfo(p); if (R && !p.reno && pl.cash > R.cost * 2) doAct(i, 'reno', { id: p.id }); }
}
function run(opt, ai, agg, seed) {
  newGame(seed, ['bot'], ai, opt);
  while (!G.over) { bot(0, agg); if (G.over) break; G.pl[0].ready = true; endMonth(); }
  return G.over;
}
`, ctx);
const stat = (opt, ai, agg, n = 60) => {
  const res = []; let wins = 0, aiw = 0;
  for (let s = 1; s <= n; s++) { const o = ctx.run(opt, ai, agg, s * 101); if (o.reason === 'mansion' && o.winner === 0) { res.push(o.m + 1); wins++; } else if (o.winner === 1) aiw++; }
  res.sort((a, b) => a - b);
  return 'bot wins ' + wins + '/' + n + ' ai ' + aiw + '  months p25/p50/p75 ' + [0.25, 0.5, 0.75].map(q => res[Math.floor(q * (res.length - 1))]).join('/');
};
const P = ctx.PRESET;
console.log('pure,  no ai, cautious', stat(P.pure, 0, 1));
console.log('pure,  no ai, aggr    ', stat(P.pure, 0, 2));
console.log('full,  no ai, cautious', stat(P.full, 0, 1));
console.log('full,  no ai, aggr    ', stat(P.full, 0, 2));
console.log('pure,  vs ai          ', stat(P.pure, 1, 1));
console.log('full,  vs ai          ', stat(P.full, 1, 2));
// AI alone: bot never acts
ctx.vm_noop = 1;
vm.runInContext(`function runAI(opt, seed){ newGame(seed, ['idle'], 1, opt); while(!G.over){ G.pl[0].ready=true; endMonth(); } return G.over; }`, ctx);
for (const [k, o] of [['pure', P.pure], ['full', P.full]]) { const r = []; let w = 0; for (let s = 1; s <= 60; s++) { const x = ctx.runAI(o, s * 7); if (x.winner === 1 && x.reason === 'mansion') { w++; r.push(x.m + 1); } } r.sort((a, b) => a - b); console.log('AI alone', k, 'wins', w, '/60 median', r[r.length >> 1]); }
