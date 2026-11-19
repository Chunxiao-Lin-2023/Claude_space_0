// Single player with the AI teammate: the AI follows, does its role's jobs next to the human, guards, revives, talks.
// Runs the real sim + AI synchronously inside the page (no rendering). Out: one line per check.
const { chromium } = require('playwright');
(async () => {
  const exe = process.env.CHROME || require('fs').readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).flatMap(d => ['/chrome-linux/chrome', '/chrome-linux64/chrome'].map(s => '/opt/pw-browsers/' + d + s)).find(p => require('fs').existsSync(p));
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await p.route(/fonts\.(googleapis|gstatic)|unpkg|jsdelivr/, r => r.abort());
  await p.goto('http://localhost:8765/test.html', { waitUntil: 'load', timeout: 120000 }); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const setupT = () => p.evaluate(() => {
    window.__dbg.skipDraw = true; window.__dbg.noStage = 1; window.__dbg.speed = 0.00001; STAGE.sc = null; STAGE.held = false;
    window.T = {
      H: () => W.p[0], A: () => W.p[1],
      run: (s, until) => { for (let k = 0; k < s * 60; k++) { aiTick(1 / 60); stepGame(1 / 60); if (until && until()) return (k / 60).toFixed(1) + 's'; } return until ? 'TIMEOUT' : s + 's'; },
      tp: (pl, x, z) => { pl.x = x; pl.z = z; pl.inp.mx = pl.inp.mz = 0; },
      calm: () => { W.huntCD = 1e9; W.eventCD = 1e9; if (W.g.st !== 'banish' && W.g.st !== 'gone') { W.g.st = 'roam'; W.g.path = null; W.g.x = 2; W.g.z = 2; } },
      inter: k => MAP.inter.find(i => i.k === k), near: (it, d = 0.9) => [it.x + (it.x < MAP.W / 2 ? d : -d), it.z],
      d: () => dist(W.p[0].x, W.p[0].z, W.p[1].x, W.p[1].z).toFixed(1),
      log: () => W.E.filter(e => e.k === 'msg').map(e => e.txt).slice(-3).join(' | '),
      walk: (x, z, s) => { const H = W.p[0]; for (let k = 0; k < s * 60; k++) { const a = Math.atan2(z - H.z, x - H.x), dd = dist(H.x, H.z, x, z); H.inp.mx = dd > 0.3 ? Math.cos(a) : 0; H.inp.mz = dd > 0.3 ? Math.sin(a) : 0; H.inp.aim = a; H.aim = a; aiTick(1 / 60); stepGame(1 / 60); } H.inp.mx = H.inp.mz = 0; },
    };
  });
  // ---------- A: human = seer, AI = holder (floor 1) ----------
  await p.evaluate(() => startSolo('S', 0)); await setupT();
  console.log('A roles', await p.evaluate(() => W.p.map(q => q.role + ':' + q.name).join(' ')));
  console.log('A follow', await p.evaluate(() => { T.calm(); const H = T.H(), r = MAP.rooms.find(r => r.id === 'dining') || MAP.rooms[2]; T.walk(r.cx, r.cz, 14); return 'human in ' + MAP.rooms[roomAt(H.x, H.z)].id + ' ai in ' + MAP.rooms[roomAt(T.A().x, T.A().z)].id + ' dist=' + T.d(); }));
  console.log('A code', await p.evaluate(() => { T.calm(); const c = W.setup.codeSpot; T.tp(T.H(), c.x + Math.sin(c.r) * 1.6, c.z + Math.cos(c.r) * 1.6); T.run(2); const rn = T.inter('rune'); T.tp(T.H(), ...T.near(rn, 1.6)); const t = T.run(25, () => W.f[MAP.F.runeFlag]); return 'knowCode=' + AI.st.knowCode + ' rune open ' + t + ' / ' + T.log(); }));
  console.log('A levers', await p.evaluate(() => { T.calm(); const lv = MAP.inter.filter(i => i.k === 'lever'); T.tp(T.H(), ...T.near(lv[0], 0.9)); const H = T.H(); let t = 'TIMEOUT'; for (let k = 0; k < 40 * 60; k++) { if (k % 120 === 0) { H.inp.act = lv[0].id; H.inp.press++; } aiTick(1 / 60); stepGame(1 / 60); if (W.f[MAP.F.leverFlag]) { t = (k / 60).toFixed(1) + 's'; break; } } return 'chapel ' + t; }));
  console.log('A shelf', await p.evaluate(() => { T.calm(); const sh = T.inter('shelf'); if (!sh) return 'no shelf'; T.tp(T.H(), ...T.near(sh, 1.6)); const r = T.run(30, () => W.f.shelf); return 'shelf ' + r + ' at ' + sh.x + ',' + sh.z + ' human ' + T.H().x.toFixed(1) + ',' + T.H().z.toFixed(1) + ' ai ' + T.A().x.toFixed(1) + ',' + T.A().z.toFixed(1) + ' goal ' + JSON.stringify(AI.st.goal); }));
  console.log('A fuse', await p.evaluate(() => { T.calm(); W.inv.push('fuse'); const fz = T.inter('fuse'); T.tp(T.H(), ...T.near(fz, 1.5)); const t = T.run(30, () => W.f.power); return 'power ' + t; }));
  console.log('A revive', await p.evaluate(() => { T.calm(); const H = T.H(); H.down = true; H.downT = 45; return 'revived ' + T.run(30, () => !H.down) + ' / ' + T.log(); }));
  console.log('A guard', await p.evaluate(() => { const H = T.H(), A = T.A(); T.tp(A, H.x + 0.8, H.z); A.batt = 1; const G = W.g; G.x = H.x; G.z = H.z - 4.5; ghostStartHunt(false, 20); G.x = H.x; G.z = H.z - 4.5; G.tgt = H.id; const s0 = W.stats.stuns; const t = T.run(6, () => W.stats.stuns > s0); return 'stun ' + t + ' ghost=' + G.st + ' human down=' + H.down + ' ai batt=' + A.batt.toFixed(2) + ' aim=' + A.aim.toFixed(2) + ' toG=' + Math.atan2(G.z - A.z, G.x - A.x).toFixed(2) + ' dG=' + dist(G.x, G.z, A.x, A.z).toFixed(1); }));
  // ---------- B: human = holder, AI = seer (floor 1 ritual) ----------
  await p.evaluate(() => startSolo('L', 0)); await setupT();
  console.log('B roles', await p.evaluate(() => W.p.map(q => q.role + ':' + q.name).join(' ')));
  console.log('B code talk', await p.evaluate(() => { T.calm(); const c = W.setup.codeSpot; T.tp(T.A(), c.x + Math.sin(c.r) * 1.6, c.z + Math.cos(c.r) * 1.6); T.tp(T.H(), T.A().x + 1, T.A().z); T.run(1.5); return T.log(); }));
  console.log('B levers', await p.evaluate(() => { T.calm(); const lv = MAP.inter.filter(i => i.k === 'lever'); T.tp(T.H(), ...T.near(lv[0], 0.9)); const H = T.H(); let t = 'TIMEOUT'; for (let k = 0; k < 40 * 60; k++) { if (k % 120 === 0) { H.inp.act = lv[0].id; H.inp.press++; } aiTick(1 / 60); stepGame(1 / 60); if (W.f[MAP.F.leverFlag]) { t = (k / 60).toFixed(1) + 's'; break; } } return 'chapel by AI seer ' + t; }));
  console.log('B ritual', await p.evaluate(() => {
    T.calm(); W.f[MAP.F.leverFlag] = 1; for (const d of MAP.doors) if (d.id === MAP.F.leverDoor) unlockDoor(d.id);
    const gt = W.setup.gtype; W.evFound = {}; GT(gt).ev.forEach(k => W.evFound[k] = 1); W.inv.push(GT(gt).item);
    const al = T.inter('altar'); T.tp(T.H(), ...T.near(al, 1.8)); T.tp(T.A(), ...T.near(al, 2.4)); W.huntCD = 1e9;
    const H = T.H(); let t = 'TIMEOUT'; for (let k = 0; k < 60 * 60; k++) { const G = W.g; if (k % 30 === 0 && G.st !== 'stun' && dist(G.x, G.z, H.x, H.z) < 7) { H.inp.aim = H.aim = Math.atan2(G.z - H.z, G.x - H.x); H.inp.boost++; } if (W.p[1].down && k % 60 === 0) { T.tp(H, W.p[1].x + 0.5, W.p[1].z); H.inp.act = 2000; H.inp.press++; H.inp.hold = true; } else H.inp.hold = false; aiTick(1 / 60); stepGame(1 / 60); if (!W.f.seal) { t = (k / 60).toFixed(1) + 's'; break; } }
    return 'banished ' + t + ' ghost=' + W.g.st + ' / ' + T.log();
  }));
  console.log('B hide', await p.evaluate(() => { const A = T.A(), H = T.H(); const hd = MAP.inter.find(i => i.k === 'hide'); T.tp(A, hd.x + 1.2, hd.z + 0.5); T.tp(H, A.x + 2, A.z); ghostStartHunt(false, 20); W.g.x = A.x - 5; W.g.z = A.z; W.g.tgt = A.id; const t = T.run(8, () => A.hide >= 0); return 'ai hid ' + t; }));
  // ---------- C: floor 2 with AI seer: bolt through the crack, bell pings ----------
  await p.evaluate(() => startSolo('L', 1)); await setupT();
  console.log('C bolt', await p.evaluate(() => { T.calm(); const d = MAP.doors.find(x => x.id === 'closetD'); T.tp(T.H(), d.cx, d.cz + 1.2); T.tp(T.A(), d.cx + 1, d.cz + 1.4); const t = T.run(40, () => !W.doors[d.idx].locked); return 'closet unlocked ' + t + ' ai at ' + MAP.rooms[roomAt(T.A().x, T.A().z)].id; }));
  console.log('C bells', await p.evaluate(() => { T.calm(); const b0 = MAP.furn.find(f => f.o.bell === W.setup.bells[0]); T.tp(T.H(), b0.x + 1.5, b0.z + 1); T.tp(T.A(), b0.x + 2, b0.z + 1.5); T.run(2); const pings = W.E.filter(e => e.k === 'ping' && e.by === 1).length; const bells = MAP.inter.filter(i => i.k === 'bell'), H = T.H(); for (let n = 0; n < 5; n++) { const nx = bells.find(x => x.bi === W.setup.bells[W.bellN]); T.tp(H, nx.x + 0.6, nx.z + 0.6); H.inp.act = nx.id; H.inp.press++; T.run(1.2); } return 'ai pings ' + pings + ' bells done ' + W.f.bells + ' total pings ' + W.E.filter(e => e.k === 'ping' && e.by === 1).length; }));
  await p.evaluate(() => startSolo('S', 1)); await setupT();
  console.log('C bells by AI holder', await p.evaluate(() => { T.calm(); const b0 = MAP.furn.find(f => f.o.bell === W.setup.bells[0]); T.tp(T.H(), b0.x + 1.5, b0.z + 1); T.tp(T.A(), b0.x + 2, b0.z + 1.5); const t = T.run(60, () => W.f.bells); return 'bells ' + t + ' knowBells=' + AI.st.knowBells + ' bellN=' + W.bellN; }));
  console.log('C valve by AI holder', await p.evaluate(() => { T.calm(); const v = T.inter('valve'); T.tp(T.H(), ...T.near(v, 1.4)); return 'drained ' + T.run(30, () => W.f.drained); }));
  // ---------- D: floor 3 with AI seer: anchors + circle ----------
  await p.evaluate(() => startSolo('L', 2)); await setupT();
  console.log('D anchors', await p.evaluate(() => { T.calm(); const out = []; W.setup.anchors.forEach((a, i) => { T.calm(); T.tp(T.H(), a.x + 1.2, a.z + 0.8); T.tp(T.A(), a.x + 1.8, a.z + 1.2); const t = T.run(20, () => W.anchors[i] >= 1); const H = T.H(), it = interactList(H, W).find(x => x.k === 'anchor' && x.ai === i); if (W.anchors[i] === 1 && it) { T.tp(H, a.x + 0.7, a.z + 0.3); H.inp.act = it.id; H.inp.press++; H.inp.hold = true; T.run(BAL.smashT + 0.5); H.inp.hold = false; } out.push(i + ':unbind ' + t + ' state ' + W.anchors[i]); }); return out.join(' ; ') + ' sanctum=' + W.f.sanctum; }));
  console.log('D circle', await p.evaluate(() => { T.calm(); W.huntCD = 1e9; const ci = T.inter('circle'); T.tp(T.H(), ci.x + 1.5, ci.z + 1.5); T.tp(T.A(), ci.x + 1, ci.z + 2); const H = T.H(); let t = 'TIMEOUT'; for (let k = 0; k < 80 * 60; k++) { const G = W.g; if (k % 30 === 0 && G.st !== 'stun' && dist(G.x, G.z, H.x, H.z) < 7) { H.inp.aim = H.aim = Math.atan2(G.z - H.z, G.x - H.x); H.inp.boost++; } if (W.p[1].down && k % 60 === 0) { T.tp(H, W.p[1].x + 0.5, W.p[1].z); H.inp.act = 2000; H.inp.press++; H.inp.hold = true; } else if (!W.p[1].down) { H.inp.hold = false; if (dist(H.x, H.z, ci.x, ci.z) > 3) T.tp(H, ci.x + 1.5, ci.z + 1.5); } aiTick(1 / 60); stepGame(1 / 60); if (!W.f.seal) { t = (k / 60).toFixed(1) + 's'; break; } } return 'circle done ' + t + ' finP=' + (W.finP || 0).toFixed(2) + ' / ' + T.log(); }));
  console.log('D climb', await p.evaluate(() => { const hs = T.inter('hatch'); T.tp(T.H(), hs.x, hs.z + 1); T.tp(T.A(), hs.x + 4, hs.z + 4); T.run(10); const H = T.H(); H.inp.act = hs.id; H.inp.press++; T.run(0.5); return 'phase ' + W.phase + ' ai dist to hatch ' + dist(T.A().x, T.A().z, hs.x, hs.z).toFixed(1); }));
  console.log('errs', errs.slice(0, 6));
  await b.close();
})();
