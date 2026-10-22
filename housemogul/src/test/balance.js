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
function run(opt, ai, agg, seed, diff) {
  newGame(seed, ['bot'], ai, opt, diff);
  while (!G.over) { bot(0, agg); if (G.over) break; G.pl[0].ready = true; endMonth(); }
  return G.over;
}
`, ctx);
const stat = (opt, ai, agg, diff, n = 60) => {
  const res = []; let wins = 0, aiw = 0;
  for (let s = 1; s <= n; s++) { const o = ctx.run(opt, ai, agg, s * 101, diff); if (o.reason === 'mansion' && o.winner === 0) { res.push(o.m + 1); wins++; } else if (o.winner === 1) aiw++; }
  res.sort((a, b) => a - b);
  return 'bot wins ' + wins + '/' + n + ' ai ' + aiw + '  months p25/p50/p75 ' + [0.25, 0.5, 0.75].map(q => res[Math.floor(q * (res.length - 1))]).join('/');
};
const P = ctx.PRESET;
for (const d of ['easy', 'normal', 'hard']) {
  console.log(d, 'pure  cautious', stat(P.pure, 0, 1, d));
  console.log(d, 'full  aggr    ', stat(P.full, 0, 2, d));
  console.log(d, 'pure  vs ai   ', stat(P.pure, 1, 1, d));
}
// a naive novice: buys anything labelled 超值/划算 it can afford, sells as soon as it is in profit
vm.runInContext(`function novice(i){ const pl=G.pl[i]; const man=mansionP(), need=man.list?man.list.ask*(1+buyFee()):1e9;
  if(pl.cash>=need){doAct(i,'buy',{id:man.id});return;}
  for(const p of ownedBy(i)){ const a=sellAdvice(p); if(a.k==='sell'||netWorth(i)>need) doAct(i,'sell',{id:p.id}); }
  for(const p of G.props.filter(p=>p.list&&p.owner===-1&&p.kind!=='mansion')){ const d=dealOf(p,i); if((d.k==='great'||d.k==='good')&&pl.cash>=buyCost(p.list.ask,false)) doAct(i,'buy',{id:p.id}); } }
function runN(opt,seed,diff){ newGame(seed,['n'],0,opt,diff); while(!G.over){ novice(0); if(G.over)break; G.pl[0].ready=true; endMonth(); } return G.over; }`, ctx);
for (const d of ['easy', 'normal']) { const r = []; let w = 0; for (let s = 1; s <= 60; s++) { const o = ctx.runN(P.pure, s * 13, d); if (o.reason === 'mansion') { w++; r.push(o.m + 1); } } r.sort((a, b) => a - b); console.log('novice pure', d, 'wins', w, '/60 p25/50/75', [.25, .5, .75].map(q => r[Math.floor(q * (r.length - 1))]).join('/')); }
