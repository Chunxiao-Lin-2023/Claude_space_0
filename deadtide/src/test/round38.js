// Round 38: the remodelled beasts, drawn in the real game — each one evolves (entrance), attacks and uses its skill on camera; sculpt + frame timing
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt38';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 900, height: 600 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  // sculpt cost per beast (first build of each type: bodies are cached after)
  const tm = await p.evaluate(() => { const o = {}; for (let v = 1; v <= 6; v++) { const t0 = performance.now(); mkBeast(v); o[EVO[v].name] = Math.round(performance.now() - t0); const t1 = performance.now(); mkBeast(v); o[EVO[v].name] += '/' + Math.round(performance.now() - t1); } return o; });
  check('each beast sculpts once (ms first / cached)', Object.values(tm).every(s => +s.split('/')[1] < 60), JSON.stringify(tm));
  await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; W.phase = 'day'; W.strayT = 1e9; document.getElementById('hud').style.opacity = 0.2; const me = W.p[ME]; me.x = W.radio.x + 6.5; me.y = W.radio.y + 8.5; me.L = 0; me.z = pZ(me); W.zs.length = 0; CAM.zoom = 2.2; });
  const shot = n => p.screenshot({ path: OUT + '/b_' + n + '.png' });
  for (let v = 1; v <= 6; v++) {
    await p.evaluate(v => { const me = W.p[ME]; me.vehs |= 1 << v; me.veh = v; me.ride = true; me.mform = 1; me.mtr = 0; me.mh = []; me.bat = 120; me.mfly = v === 5; me.evoOn = false; me.evo = 100; me.aim = 0.6; W.zs.length = 0; doAct(me, 'xform'); }, v);
    await p.waitForTimeout(500); await shot(v + '_0intro');
    await p.waitForTimeout(1500); await shot(v + '_1idle');
    await p.evaluate(() => { const me = W.p[ME]; for (let k = 0; k < 3; k++) { const z = spawnZombie('walker', 0); z.x = me.x + 2 + k; z.y = me.y + 1; z.L = me.L; z.z = surfZ(z.x, z.y, z.L); z.hp = z.max = 9000; z.stun = 99; } me.gcd = 0; mechPunch(me); });
    await p.waitForTimeout(180); await shot(v + '_2atk');
    await p.waitForTimeout(800); await p.evaluate(() => { const me = W.p[ME]; me.mcd = 0; mechSkill(me, { x: me.x + 5, y: me.y + 1 }); });
    await p.waitForTimeout(350); await shot(v + '_3skill');
    const fr = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { if (++n < 30) requestAnimationFrame(f); else res((performance.now() - t0) / 30); }; requestAnimationFrame(f); }));
    console.log('  ', v, 'frame ms (swiftshader)', fr.toFixed(1));
    await p.waitForTimeout(3500); await p.evaluate(() => { const me = W.p[ME]; me.spinT = 0; me.rageT = 0; doAct(me, 'xform'); W.zs.length = 0; });
    await p.waitForTimeout(400);
  }
  const real = errs.filter(e => !/Failed to load resource/.test(e)); check('no page errors', !real.length, real.slice(0, 5).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
