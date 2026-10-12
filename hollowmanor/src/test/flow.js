// Full single-floor playthrough driven through the real input/interaction code (solo test build).
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html?solo=1&seed=' + (process.env.SEED || 11), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
  const res = await p.evaluate(() => {
    window.__dbg.skipDraw = true; window.__dbg.noBot = true;
    const out = []; const L = W.p[0], S = W.p[1];
    W.huntCD = 1e9; W.eventCD = 1e9;
    const step = (s) => { for (let i = 0; i < s * 60; i++) stepGame(1 / 60); };
    const tp = (pl, x, z) => { pl.x = x; pl.z = z; pl.inp.mx = pl.inp.mz = 0; };
    const press = (pl, id) => { pl.inp.act = id; pl.inp.press++; pl.inp.hold = true; step(0.05); pl.inp.hold = false; step(0.05); };
    const hold = (pl, id, s) => { pl.inp.act = id; pl.inp.press++; pl.inp.hold = true; step(s); pl.inp.hold = false; step(0.05); };
    const inter = k => MAP.inter.find(i => i.k === k);
    const aimAt = (pl, x, z) => { pl.inp.aim = Math.atan2(z - pl.z, x - pl.x); pl.aim = pl.inp.aim; pl.a = pl.aim; };
    out.push('ghost=' + W.setup.gtype + ' needs ' + GHOSTS[W.setup.gtype].ev.join('+') + ' item ' + GHOSTS[W.setup.gtype].item);
    // evidence by the right role
    for (const e of W.setup.ev) {
      if (e.k === 'prints' || e.k === 'orbs') { const nx = e.x + Math.sin(e.r || 0) * 1.6, nz = e.z + Math.cos(e.r || 0) * 1.6; tp(S, e.k === 'orbs' ? e.x + 1 : nx, e.k === 'orbs' ? e.z : nz); }
      else { tp(L, e.x + 2.5, e.z); aimAt(L, e.x, e.z); }
      step(0.2);
    }
    if (GHOSTS[W.setup.gtype].ev.includes('mirror')) { const m = MAP.mirrors[0]; tp(L, m.x + Math.sin(m.r) * 2.2, m.z + Math.cos(m.r) * 2.2); aimAt(L, m.x, m.z); step(0.3); }
    out.push('evidence ' + JSON.stringify(W.evFound));
    // fuse item
    const fuse = W.items.find(i => i.k === 'fuse'); tp(L, fuse.x, fuse.z + 0.8); press(L, 1000 + fuse.i); out.push('inv after fuse ' + W.inv);
    // shelf (holder) – check seer can't
    const sh = inter('shelf'); tp(S, sh.x, sh.z); hold(S, sh.id, 1); out.push('seer pushed shelf? ' + W.f.shelf);
    tp(S, 17, 23); tp(L, sh.x, sh.z); hold(L, sh.id, BAL.shelfT + 0.3); out.push('shelf ' + W.f.shelf + ' door open ' + W.doors[MAP.doors.findIndex(d => d.kind === 'shelf')].tgt);
    // walk into the utility room through the real collision
    L.inp.mz = 1; L.inp.mx = 0; step(1.5); L.inp.mz = 0; out.push('holder now in ' + MAP.rooms[roomAt(L.x, L.z)].id);
    const fb = inter('fuse'); tp(L, fb.x, fb.z); hold(L, fb.id, BAL.fuseT + 0.3); out.push('power ' + W.f.power + ' cons door ' + W.doors[0].tgt);
    // rune
    const rn = inter('rune'); tp(L, rn.x, rn.z); press(L, rn.id); out.push('rune ui event ' + W.E.some(e => e.k === 'ui' && e.ui === 'rune'));
    W.setup.code.forEach((g, i) => setDial(0, i, g)); out.push('study ' + W.f.study);
    // collect every ritual item
    for (const it of W.items) if (!it.taken) { tp(L, it.x, it.z + 0.7); step(0.05); const best = bestInteract(L, W); press(L, best && best.k === 'item' ? best.id : 1000 + it.i); }
    out.push('inv ' + W.inv.join(','));
    // twin levers
    const lv0 = MAP.inter.find(i => i.k === 'lever' && i.lv === 0), lv1 = MAP.inter.find(i => i.k === 'lever' && i.lv === 1);
    tp(L, lv0.x, lv0.z); press(L, lv0.id); step(4); out.push('after one lever, chapel=' + W.f.chapel);
    tp(L, lv0.x, lv0.z); press(L, lv0.id); tp(S, lv1.x, lv1.z); press(S, lv1.id); out.push('both levers, chapel=' + W.f.chapel);
    step(1);
    // wrong item first, then the right one; holder stuns the ghost
    const al = inter('altar'), right = GHOSTS[W.setup.gtype].item, wrong = W.inv.find(k => RITUAL_ITEMS.includes(k) && k !== right);
    tp(S, al.x, al.z); tp(L, al.x + 1.2, al.z + 1.5);
    const ritual = (item) => { startRitual(1, item); const st0 = W.g.st; S.inp.act = al.id; S.inp.press++; S.inp.hold = true; let stuns = 0; for (let t = 0; t < 10 * 60 && (W.rit || t < 5); t++) { if (t % 20 === 0 && W.g.st !== 'stun' && dist(W.g.x, W.g.z, S.x, S.z) < 4.5) { aimAt(L, W.g.x, W.g.z); L.inp.boost++; stuns++; } stepGame(1 / 60); } S.inp.hold = false; step(0.1); return st0 + ' boosts=' + stuns; };
    out.push('ritual wrong: ' + ritual(wrong) + ' -> seal ' + W.f.seal + ' burned ' + W.f.burned + ' ghost ' + W.g.st + ' S.down ' + S.down);
    if (S.down) { tp(L, S.x + 0.5, S.z); hold(L, 2000, BAL.reviveT + 0.2); out.push('revived ' + !S.down); }
    // let the rage hunt pass
    W.g.huntT = 0; step(0.5); W.huntCD = 1e9; tp(S, al.x, al.z); tp(L, al.x + 1.2, al.z + 1.5);
    out.push('ritual right: ' + ritual(right) + ' -> seal ' + W.f.seal + ' ghost ' + W.g.st + ' S.down ' + S.down);
    step(4); out.push('ghost after ' + W.g.st);
    // stairs
    const stI = inter('stairs'); tp(L, stI.x, stI.z); tp(S, 30, 20); press(L, stI.id); out.push('stairs alone -> ' + W.phase);
    tp(S, stI.x + 1, stI.z + 0.3); press(L, stI.id); out.push('stairs together -> ' + W.phase + ' / ' + W.why);
    out.push('msgs: ' + W.E.filter(e => e.k === 'msg').slice(-6).map(e => e.txt).join(' | '));
    return out.join('\n');
  });
  console.log(res);
  console.log('errs', errs.slice(0, 10));
  await b.close();
})();
