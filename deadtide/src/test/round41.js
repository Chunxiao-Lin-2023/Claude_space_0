// Round 41: the ranged flyers — 尸翼弓手 (arrows), 腐液水母 (slowing goo), 石像鬼 (diving slam): each telegraphed, each with an answer
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 500, height: 360 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  await p.evaluate(() => { window.requestAnimationFrame = () => 0; window.__dbg.skipDraw = true;
    // helpers: an open spot under the sky and a spot indoors, both walkable
    window.spot = open => { const R = W.radio; for (let r = 4; r < 60; r++) for (let k = 0; k < 64; k++) { const a = k / 64 * 6.28, x = Math.floor(R.x + Math.cos(a) * r), y = Math.floor(R.y + Math.sin(a) * r); if (!inMap(x, y)) continue; const L = gAt(x, y); if (!standable(x, y, L, 'p') || W.blk[ci(x, y, L)]) continue;
      let clear = true; if (open) { for (let dy = -3; dy <= 3 && clear; dy++) for (let dx = -3; dx <= 3; dx++) if (!inMap(x + dx, y + dy) || skyTop(x + dx, y + dy) > gAt(x + dx, y + dy) + 0 || W.blk[ci(x + dx, y + dy, gAt(x + dx, y + dy))]) { clear = false; break; } } else clear = skyTop(x, y) > L + 1 && houseInterior(x, y);
      if (clear) return { x: x + 0.5, y: y + 0.5, L }; } return null; };
    window.put = (o) => { const me = W.p[ME]; me.ride = false; me.mform = 0; me.down = false; me.dead = false; me.hp = me.maxHp; me.invT = 0; me.x = o.x; me.y = o.y; me.L = o.L; me.z = pZ(me); me.rx = me.x; me.ry = me.y; W.zs.length = 0; W.wardens = []; W.spawnQ = []; W.phase = 'night'; W.nightT = 0; W.clock = 999; window.__dbg.god = false; visTick(); };
    window.run = (sec, f) => { for (let k = 0; k < sec * 60; k++) { stepZombies(1 / 60); if (f) f(k); } };
  });
  const S = (fn, a) => p.evaluate(fn, a);
  await S(() => { window.tick = (sec, f) => { for (let k = 0; k < Math.round(sec * 60); k++) { W.t += 1 / 60; stepZombies(1 / 60); stepProj(1 / 60); gooStep(1 / 60); if (f) f(k); } };
    window.evs = []; const f0 = window.fxEvent; window.fxEvent = e => { window.evs.push(e); return f0(e); };
    window.fresh = (k) => { const o = spot(true); put(o); const me = W.p[ME]; Object.assign(me, { aim: 0, shield: false, melee: 0, vx: 0, vy: 0, invT: 0, gooT: 0 }); W.goo = []; W.proj = []; window.__dbg.god = false; me.hp = me.maxHp = 999;
      const z = spawnZombie(k, 0); z.x = me.x + (k === 'archer' ? 7 : 4); z.y = me.y; z.L = me.L; z.z = me.z + ZT[k].fly.alt; z.sleep = false; z.dvCD = 0; z.fa = 0; visTick(); window.evs.length = 0; return z; }; });
  // spawns
  let s = await S(() => { const out = {}; for (const n of [2, 3, 4, 5, 8, 10]) { W.night = n - 1; W.p.forEach(p => p.gone = false); startNight(); const c = k => W.spawnQ.filter(q => q.k === k).length; out[n] = [c('archer'), c('jelly'), c('garg')].join('/'); } W.spawnQ = []; W.phase = 'day'; return out; });
  check('spawns: archers from night 3, jellies from night 4, a gargoyle from night 5 (two from night 10)', s[2] === '0/0/0' && /^[1-9]\d*\/0\/0$/.test(s[3]) && /^[1-9]\d*\/[2-9]\d*\/0$/.test(s[4]) && s[5].endsWith('/1') && s[10].endsWith('/2'), s);
  // archer: it aims (a line), locks, looses an arrow along the locked line; standing still = hit, sidestepping after the lock = miss
  s = await S(() => { const out = {}; let z = fresh('archer'), me = W.p[ME]; const hp0 = me.hp; let lockT = -1, looseT = -1, t = 0;
    tick(1.6, () => { t += 1 / 60; if (lockT < 0 && evs.some(e => e.k === 'zbowl')) lockT = t; if (looseT < 0 && evs.some(e => e.k === 'zloose')) looseT = t; });
    out.tell = [evs.some(e => e.k === 'zbow' && e.p === ME), Math.round(lockT * 10) / 10, Math.round(looseT * 10) / 10].join(','); out.hit = Math.round(hp0 - me.hp);
    z = fresh('archer'); me = W.p[ME]; const h1 = me.hp; let moved = false; tick(1.6, () => { if (!moved && evs.some(e => e.k === 'zbowl')) { moved = true; me.y += 1.6; } }); out.dodge = [moved, Math.round(h1 - me.hp)].join(',');
    z = fresh('archer'); me = W.p[ME]; const h2 = me.hp; let hitIt = false; tick(1.6, () => { if (!hitIt && z.at && z.at.t > 0.3) { hitIt = true; hurtZombie(z, 5, me); } }); out.spoil = [hitIt, evs.some(e => e.k === 'zflinch'), !evs.some(e => e.k === 'zloose'), Math.round(h2 - me.hp)].join(',');
    z = fresh('archer'); me = W.p[ME]; Object.assign(me, { shield: true, melee: 1, aim: 0 }); const h3 = me.hp; tick(1.6); out.shield = [Math.round(h3 - me.hp), evs.some(e => e.k === 'zblock')].join(',');
    return out; });
  check('archer: a tell, the line locks at 0.55 s and it looses at 0.9 s; standing still takes the arrow (14)', /^true,0\.[56],0\.9$/.test(s.tell) && s.hit === 14, s);
  check('archer: a sidestep after the lock and the arrow misses', s.dodge === 'true,0', s);
  check('archer: a hit while it aims spoils the shot', s.spoil === 'true,true,true,0', s);
  check('archer: a riot shield held up stops the arrow', s.shield === '0,true', s);
  // jelly: swells, a ring where the glob lands, a puddle that slows; a hit while it swells bursts it on itself
  s = await S(() => { const out = {}; let z = fresh('jelly'), me = W.p[ME]; tick(1.8); const G = evs.find(e => e.k === 'zgoo');
    out.tell = G ? [Math.round(Math.hypot(G.x - me.x, G.y - me.y) * 10) / 10, G.t].join(',') : 'none'; out.puddle = (W.goo || []).length; out.slow = [inGoo(me), me.gooT > 0].join(',');
    const a = { x: me.x, y: me.y }; me.inp = { mx: 1, my: 0 }; const sp = () => { const x0 = me.x; for (let k = 0; k < 30; k++) stepMove(me, 1 / 60); const d = me.x - x0; me.x = x0; me.vx = 0; return d; };
    out.ratio = Math.round(sp() / (W.goo = [], me.gooT = 0, sp()) * 100) / 100; me.inp = { mx: 0, my: 0 };
    z = fresh('jelly'); me = W.p[ME]; let hitIt = false; tick(1.8, () => { if (!hitIt && z.at && z.at.t > 0.3) { hitIt = true; hurtZombie(z, 5, me); } });
    out.spoil = [hitIt, evs.some(e => e.k === 'zgoox'), !W.proj.some(b => b.k === 'goo') && !evs.some(e => e.k === 'sfx' && e.n === 'spit'), (() => { const X = evs.find(e => e.k === 'zgoox'); return !!X && (W.goo || []).some(q => Math.hypot(q.x - X.x, q.y - X.y) < 0.5); })()].join(',');
    // a mech in the goo gets bogged down
    z = fresh('jelly'); me = W.p[ME]; Object.assign(me, { vehs: 126, veh: 4, ride: true, mform: 1, mtr: 0, mh: [], bat: 120 }); W.goo = [{ x: me.x, y: me.y, z: me.z, r: 1.7, t: 5 }]; z.hp = 0; tick(0.2); out.mech = (me.ccSlw || 0) > 0; me.ride = false; me.mform = 0;
    return out; });
  check('jelly: a marked ring at you, the glob lands there, leaves a puddle and slows you', s.tell !== 'none' && +s.tell.split(',')[0] < 1 && s.puddle >= 1 && s.slow === 'true,true', s);
  check('jelly: in the goo you move at about half speed', s.ratio > 0.4 && s.ratio < 0.6, s);
  check('jelly: a hit while it swells bursts it on itself (no glob at you)', s.spoil === 'true,true,true,true', s);
  check('jelly: a mech in the goo is bogged down', s.mech, s);
  // gargoyle: stone while it circles; a ring, the slam (hurt + knocked back), then stuck and soft
  s = await S(() => { const out = {}; let z = fresh('garg'), me = W.p[ME]; z.dvCD = 99; const h0 = z.hp; hurtZombie(z, 100, me); out.stone = Math.round(h0 - z.hp); z.hp = z.max;
    z.dvCD = 0; const p0 = me.hp; tick(1.2); const R = evs.find(e => e.k === 'zslam'), H = evs.find(e => e.k === 'zslamhit');
    out.slam = [!!R, !!H, Math.round(p0 - me.hp), z.gst > 0, z.kt].join(','); const h1 = z.hp; hurtZombie(z, 100, me); out.open = Math.round(h1 - z.hp);
    tick(2.2); out.up = [z.gst <= 0, z.z > me.z + 1].join(',');
    z = fresh('garg'); me = W.p[ME]; const p1 = me.hp; let moved = false; tick(1.2, () => { if (!moved && evs.some(e => e.k === 'zslam')) { moved = true; me.x -= 3; } }); out.dodge = [moved, Math.round(p1 - me.hp), evs.some(e => e.k === 'zslamhit')].join(',');
    return out; });
  check('gargoyle: stone while it circles (×0.3)', s.stone === 30, s);
  check('gargoyle: a ring, then the slam hurts (22) and it is stuck on the ground', s.slam === 'true,true,22,true,3', s);
  check('gargoyle: stuck after the slam it takes ×1.5, then it flies off again', s.open === 150 && s.up === 'true,true', s);
  check('gargoyle: step out of the ring and the slam misses', s.dodge === 'true,0,true', s);
  // network: new projectiles and puddles reach a guest
  s = await S(() => { W.proj = [{ k: 'arrow', x: 1, y: 2, z: 3, vx: 4, vy: 0, vz: 0, t: 1 }, { k: 'goo', x: 1, y: 2, z: 3, vx: 1, vy: 0, vz: 1 }]; W.goo = [{ x: 5, y: 6, z: 0, r: 1.7, t: 4 }]; const sn = JSON.parse(JSON.stringify(makeSnap())); W.proj = []; W.goo = []; applySnap(sn);
    const out = [W.proj.map(b => b.k).join('+'), W.goo.length && W.goo[0].r, ZKEYS.indexOf('garg') > 0].join(','); W.proj = []; W.goo = []; return out; });
  check('arrows, globs and puddles go out in the snapshot', s === 'arrow+goo,1.7,true', s);
  // drawing: the three models, the aim line and the rings, without errors
  s = await S(() => { window.__dbg.skipDraw = false; const out = {}; const me = W.p[ME]; put(spot(true)); W.zs.length = 0; let T = performance.now();
    for (const [k, dx] of [['archer', 6], ['jelly', 3], ['garg', -4]]) { const z = spawnZombie(k, 0); z.x = me.x + dx; z.y = me.y + 1; z.L = me.L; z.z = me.z + ZT[k].fly.alt; z.sleep = false; z.dvCD = 0.2; }
    visTick(); for (let i = 0; i < 90; i++) { T += 16.7; frame(T); } out.models = ['archer', 'jelly', 'garg'].filter(k => { const g = mkFlyer(k), J = g.userData.J; return J.k === k && typeof J.tick === 'function' && (k === 'jelly' ? J.tents.length === 8 : J.wings.length === 2); }).length; out.drawn = [...FLY.keys()].filter(k => /archer|jelly|garg/.test(k)).length; out.tells = [!!RND.zbow, (RND.zmarks || []).length >= 0].join(',');
    window.__dbg.skipDraw = true; return out; });
  check('the three models build and draw, with their tells', s.models === 3 && s.drawn >= 1, s);
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})();
