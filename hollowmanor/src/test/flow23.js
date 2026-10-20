// Floors 2 and 3 through the real interaction code (solo test build): stairs → floor change, valve/key, bells, spirit crack + bolt,
// vanity ritual, attic lamps, anchors (unbind + smash), final circle with the guard rule, roof hatch → won.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html?solo=1&seed=' + (process.env.SEED || 11), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
  const run = js => p.evaluate(js);
  await run(() => {
    window.__dbg.skipDraw = true; window.__dbg.noBot = true;
    window.T = {
      step: s => { for (let i = 0; i < s * 60; i++) stepGame(1 / 60); },
      tp: (pl, x, z) => { pl.x = x; pl.z = z; pl.inp.mx = pl.inp.mz = 0; },
      press: (pl, id) => { pl.inp.act = id; pl.inp.press++; pl.inp.hold = true; T.step(0.05); pl.inp.hold = false; T.step(0.05); },
      hold: (pl, id, s) => { pl.inp.act = id; pl.inp.press++; pl.inp.hold = true; T.step(s); pl.inp.hold = false; T.step(0.05); },
      inter: (k, f) => MAP.inter.find(i => i.k === k && (!f || f(i))),
      aim: (pl, x, z) => { pl.inp.aim = Math.atan2(z - pl.z, x - pl.x); pl.aim = pl.inp.aim; pl.a = pl.aim; },
      calm: () => { W.huntCD = 1e9; W.eventCD = 1e9; if (W.g.st !== 'banish' && W.g.st !== 'gone') { W.g.st = 'roam'; W.g.path = null; } },
      L: () => W.p.find(q => q.role === 'L'), S: () => W.p.find(q => q.role === 'S'),
      climb: () => { const st = T.inter('stairs'); T.tp(T.L(), st.x, st.z); T.tp(T.S(), st.x + 0.8, st.z); T.press(T.L(), st.id); const f0 = W.floor; for (let i = 0; i < 200 && W.floor === f0; i++) stepGame(1 / 30); processEvents(); return W.floor; },
    };
  });
  // ---- floor 1 → 2
  console.log(await run(() => { T.calm(); W.f.seal = 0; W.g.st = 'gone'; const f = T.climb(); return 'after climb floor=' + f + ' map=' + MAP.F.key + ' phase=' + W.phase + ' rooms=' + MAP.rooms.length + ' worldChildren=' + R3.world.children.length + ' doors=' + R3.doors.length + ' bells=' + R3.bells.length + ' tub=' + !!R3.tub + ' cracks=' + R3.cracks.length; }));
  console.log(await run(() => {
    const out = [], L = T.L(), S = T.S(); T.calm(); try {
    out.push('ghost=' + W.setup.gtype + ' used=' + W.used + ' ev=' + GT(W.setup.gtype).ev + ' item=' + GT(W.setup.gtype).item + ' bells=' + W.setup.bells + ' items=' + W.items.map(i => i.k + '@' + i.slot).join(','));
    for (const e of W.setup.ev) { if (e.k === 'prints' || e.k === 'orbs') { T.tp(S, e.k === 'orbs' ? e.x + 1 : e.x + Math.sin(e.r || 0) * 1.6, e.k === 'orbs' ? e.z : e.z + Math.cos(e.r || 0) * 1.6); } else { T.tp(L, e.x + 2.5, e.z); T.aim(L, e.x, e.z); } T.step(0.2); }
    if (GT(W.setup.gtype).ev.includes('mirror')) { for (const m of MAP.mirrors) { if (W.evFound.mirror) break; T.tp(L, m.x + Math.sin(m.r) * 2.2, m.z + Math.cos(m.r) * 2.2); T.aim(L, m.x, m.z); T.step(0.3); } }
    out.push('evidence ' + JSON.stringify(W.evFound));
    // valve: seer can't, holder can
    const v = T.inter('valve'); T.tp(S, v.x, v.z); T.hold(S, v.id, 1); out.push('seer valve? ' + !!W.f.drained);
    T.tp(S, 17, 15); T.tp(L, v.x, v.z); T.hold(L, v.id, BAL.valveT + 0.3); out.push('drained ' + W.f.drained);
    const key = W.items.find(i => i.k === 'brass'); T.tp(L, key.x, key.z + 0.6); T.step(0.05); const bi = bestInteract(L, W); out.push('best near tub: ' + (bi && bi.k));
    T.press(L, 1000 + key.i); out.push('inv ' + W.inv);
    const mk = MAP.inter.find(i => i.k === 'locked' && MAP.doors[i.door].id === 'masterD'); T.tp(L, mk.x, mk.z); T.press(L, mk.id); out.push('master locked? ' + W.doors[doorIdx('masterD')].locked + ' inv ' + W.inv);
    // bells: one wrong ring first, then the right order
    const bell = i => T.inter('bell', x => x.bi === i);
    const wrongB = W.setup.bells[1]; T.tp(L, bell(wrongB).x, bell(wrongB).z); T.press(L, bell(wrongB).id); out.push('after wrong ring bellN=' + W.bellN);
    for (const i of W.setup.bells) { T.tp(L, bell(i).x, bell(i).z); T.press(L, bell(i).id); }
    out.push('bells ' + W.f.bells + ' studio locked? ' + W.doors[doorIdx('studioD')].locked);
    // spirit crack: holder blocked, seer passes
    T.tp(L, 8.4, 15.8); L.inp.mx = 1; T.step(1.2); L.inp.mx = 0; out.push('holder after pushing crack x=' + L.x.toFixed(2) + ' room=' + MAP.rooms[roomAt(L.x, L.z)].id);
    T.tp(S, 8.4, 15.8); S.inp.mx = 1; T.step(1.2); S.inp.mx = 0; out.push('seer after pushing crack x=' + S.x.toFixed(2) + ' room=' + MAP.rooms[roomAt(S.x, S.z)].id);
    const bo = T.inter('bolt'); S.inp.mz = -1; T.step(1.4); S.inp.mz = 0; out.push('seer walked to ' + S.x.toFixed(1) + ',' + S.z.toFixed(1) + ' bolt at ' + bo.x.toFixed(1) + ',' + bo.z.toFixed(1));
    T.tp(S, bo.x, bo.z); T.hold(S, bo.id, BAL.boltT + 0.2); out.push('closet locked? ' + W.doors[doorIdx('closetD')].locked);
    for (const it of W.items) if (!it.taken) { T.tp(L, it.x, it.z + 0.7); T.press(L, 1000 + it.i); }
    out.push('inv ' + W.inv);
    // vanity ritual: wrong item, then right
    const al = T.inter('altar'), right = GT(W.setup.gtype).item, wrong = W.inv.find(k => RITUAL_ITEMS.includes(k) && k !== right);
    const ritual = item => { T.calm(); T.tp(S, al.x, al.z); T.tp(L, al.x - 1.0, al.z + 1.6); startRitual(S.id, item); const st0 = W.g.st; S.inp.act = al.id; S.inp.press++; S.inp.hold = true; for (let t = 0; t < 10 * 60 && (W.rit || t < 5); t++) { if (t % 20 === 0 && W.g.st !== 'stun' && dist(W.g.x, W.g.z, S.x, S.z) < 4.5) { T.aim(L, W.g.x, W.g.z); L.inp.boost++; } stepGame(1 / 60); } S.inp.hold = false; T.step(0.1); return st0; };
    out.push('wrong: ' + ritual(wrong) + ' burned=' + W.f.burned + ' seal=' + W.f.seal + ' S.down=' + S.down);
    if (S.down) { T.tp(L, S.x + 0.5, S.z); T.hold(L, 2000, BAL.reviveT + 0.2); }
    W.g.huntT = 0; T.step(0.5); T.calm();
    out.push('right: ' + ritual(right) + ' seal=' + W.f.seal + ' ghost=' + W.g.st);
    T.step(4);
    out.push('objectives ' + MAP.F.objectives(W).map(o => (o.done ? '✔' : '○') + o.t).join(' | '));
    const f = T.climb(); out.push('after climb floor=' + f + ' map=' + MAP.F.key + ' lamps=' + MAP.lamps.length + ' anchors=' + W.setup.anchors.map(a => a.k + '@' + MAP.rooms[a.room].id).join(','));
    } catch (e) { out.push('ERR ' + e.message + ' phase=' + W.phase + ' seal=' + W.f.seal + ' ' + W.E.filter(e => e.k === 'msg').slice(-4).map(e => e.txt).join(' | ')); }
    return out.join('\n');
  }));
  await p.evaluate(() => { window.__dbg.skipDraw = false; }); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + '/f3_start.png', timeout: 120000 }); await p.evaluate(() => { window.__dbg.skipDraw = true; });
  console.log(await run(() => {
    const out = [], L = T.L(), S = T.S(); T.calm();
    out.push('boss form=' + W.setup.gtype + ' huntCD after calm ' + W.huntCD);
    const lamp = T.inter('lamp'); T.tp(S, lamp.x, lamp.z); T.press(S, lamp.id); out.push('seer lamp? ' + W.lamps[lamp.li]); T.tp(L, lamp.x, lamp.z); T.press(L, lamp.id); out.push('holder lamp ' + W.lamps[lamp.li]);
    W.setup.anchors.forEach((a, i) => {
      T.calm(); const it = () => interactList(L).find(x => x.k === 'anchor' && x.ai === i);
      T.tp(L, a.x + 0.8, a.z); T.step(0.05); T.hold(L, it().id, 1); const afterL = W.anchors[i];
      T.tp(S, a.x + 0.8, a.z); T.hold(S, it().id, BAL.unbindT + 0.3); const afterS = W.anchors[i];
      T.calm(); T.hold(L, it().id, BAL.smashT + 0.3);
      out.push('anchor ' + a.k + ': L-first=' + afterL + ' S-unbind=' + afterS + ' L-smash=' + W.anchors[i] + ' huntCD=' + W.huntCD.toFixed(1) + ' rage=' + W.g.rage);
    });
    out.push('sanctum ' + W.f.sanctum + ' door locked? ' + W.doors[doorIdx('sanctumD')].locked);
    // final circle: holder too far → no progress; holder near → progress; seer released midway keeps progress
    const c = T.inter('circle'); T.calm(); T.tp(S, c.x, c.z); T.tp(L, 30, 22);
    const chant = (sec, guard) => { let downs = 0; for (let t = 0; t < sec * 60 && W.f.seal; t++) { if (!W.rit) { S.inp.act = c.id; S.inp.press++; } S.inp.hold = true; if (guard && t % 15 === 0 && W.g.st !== 'stun' && dist(W.g.x, W.g.z, S.x, S.z) < 5) { T.aim(L, W.g.x, W.g.z); L.inp.boost++; L.batt = 1; } if (S.down) { downs++; S.down = false; S.fear = 50; } stepGame(1 / 60); } return downs; };
    T.press(S, c.id); chant(1.2, false); out.push('far guard p=' + (W.rit ? W.rit.p.toFixed(2) : 'none') + ' ghost=' + W.g.st);
    T.tp(L, c.x + 1.5, c.z + 1.5); const d1 = chant(5, true); out.push('near guard p=' + (W.rit ? W.rit.p.toFixed(2) : W.finP.toFixed(2)) + ' seer downs=' + d1); S.inp.hold = false; T.step(0.2); out.push('released: rit=' + !!W.rit + ' finP=' + W.finP.toFixed(2) + ' ghost=' + W.g.st);
    const d2 = chant(20, true); S.inp.hold = false; out.push('final: seal=' + W.f.seal + ' ghost=' + W.g.st + ' finP=' + W.finP.toFixed(2) + ' seer downs=' + d2);
    T.step(5);
    const h = T.inter('hatch'); T.tp(L, h.x, h.z); T.tp(S, 30, 22); T.press(L, h.id); out.push('hatch alone → ' + W.phase);
    T.tp(S, h.x + 0.9, h.z + 0.3); T.press(L, h.id); out.push('hatch together → ' + W.phase + ' / ' + W.why);
    out.push('msgs: ' + W.E.filter(e => e.k === 'msg').slice(-5).map(e => e.txt).join(' | '));
    return out.join('\n');
  }));
  console.log('errs', errs.slice(0, 10));
  await b.close();
})();
