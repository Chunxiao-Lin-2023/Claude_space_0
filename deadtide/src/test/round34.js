// Round 34: smooth riding (the drawn survivor moves every frame, between the 60 Hz sim steps), explosives toned down
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 500, height: 360 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  // drive frames by hand at an uneven ~120 Hz: the bike / gyrocopter on screen must move every frame and keep its heading
  let s = await p.evaluate(async () => {
    window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 100));
    const out = {}, ri = readInput;
    for (const v of [5, 1]) {
      const me = W.p[ME]; W.zs.length = 0; W.spawnQ = []; W.phase = 'day'; W.clock = 999; window.__dbg.god = true;
      me.vehs |= 1 << v; me.veh = v; me.fuel = 60; me.x = W.radio.x + 0.5; me.y = W.radio.y + 20.5; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); me.z = pZ(me); me.ride = true; if (v === 5) me.alt = 1; me._uy = null; me.aim = 0;
      const press = () => { me.inp.mx = 1; me.inp.my = 0; }; window.readInput = press; let t = performance.now(); const xs = [], ly = [];
      for (let k = 0; k < 120; k++) { t += k % 2 ? 7.2 : 9.5; press(); frame(t); if (k > 60) { xs.push(OBJ.pl[ME].g.position.x); ly.push(me._ly); } }
      const d = xs.slice(1).map((x, i) => x - xs[i]);
      out[v] = { still: d.filter(q => Math.abs(q) < 1e-5).length, n: d.length, ly: +(Math.max(...ly) - Math.min(...ly)).toFixed(3) };
      me.ride = false;
    }
    window.readInput = ri; return out; });
  check('riding at 120 Hz: the drawn bike moves on (almost) every frame and keeps its heading (was: stood still every other frame)', s[1].still <= 6 && s[1].ly < 0.1, JSON.stringify(s[1]));
  check('riding at 120 Hz: the drawn gyrocopter moves on every frame and keeps its heading', s[5].still === 0 && s[5].ly < 0.15, JSON.stringify(s[5]));
  // explosives: smaller radius, steeper falloff, bosses take less; fewer frag grenades and launcher shells
  s = await p.evaluate(() => {
    const me = W.p[ME]; W.zs.length = 0; const mk = (k, dx) => { const z = spawnZombie(k, 0); z.x = me.x + 6 + dx; z.y = me.y; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 5000; return z; };
    const a = mk('walker', 0), e = mk('walker', 2.4), bz = mk('boss', -0.01); W.upg = 0;
    explode(me.x + 6, me.y, a.z + 0.6, me, BAL.nadeR, BAL.nadeDmg);
    return { centre: 5000 - a.hp, edge: 5000 - e.hp, boss: 5000 - bz.hp, cap: BAL.nadeCap, gl: ammoCap(6), R: BAL.nadeR, tank: BAL.tankDmg, tankR: BAL.tankR, glDmg: WPN[6].dmg };
  });
  check('grenade: ~220 in the middle, about half near the edge, a boss takes 40% less; carry 10 frags, 60 launcher shells; tank 120 / r 2.3, launcher 160',
    s.centre > 180 && s.centre <= 220 && s.edge < 130 && s.edge > 0 && s.boss < s.centre * 0.65 && s.cap === 10 && s.gl === 60 && s.R === 3 && s.tank === 120 && s.tankR === 2.3 && s.glDmg === 160, JSON.stringify(s));
  // a two-player save carried on alone keeps the teammate's kit (and a teammate who dropped out is still saved)
  s = await p.evaluate(() => {
    NETROLE = 'host'; startGame(4242, ['甲', '乙'], 'normal', 0, 'classic', 'town'); SLOT = 1; const g = W.p[1]; g.owned[3] = 1; g.ammo[3] = 77; g.meds = 5; g.vehs = 1 << 4; g.gone = true; W.res.steel = 321;
    saveGame(true); const a = loadSlot(1); NETROLE = 'solo'; continueGame(1); const one = W.p.length; saveGame(true); const b = loadSlot(1);
    return { a: a.p.length, a1: a.p[1] && a.p[1].ammo[3], one, b: b.p.length, b1: b.p[1] && b.p[1].ammo[3], meds: b.p[1] && b.p[1].meds, vehs: b.p[1] && b.p[1].vehs, steel: b.res.steel };
  });
  check('save: a teammate who dropped out is saved; carrying on alone keeps their guns / ammo / medkits / vehicles in the save; shared materials kept', s.a === 2 && s.a1 === 77 && s.one === 1 && s.b === 2 && s.b1 === 77 && s.meds === 5 && s.vehs === 16 && s.steel === 321, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
