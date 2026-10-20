// Single-player smoke: title -> solo -> day actions (search, build, craft) -> night fight -> screenshots. node test/smoke.js (serve out/ on :8765)
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/lt';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://localhost:8765/test.html'); await p.waitForFunction(() => window.__ready);
  await p.waitForTimeout(1500); await p.screenshot({ path: OUT + '/01_title.png' });
  await p.click('#soloBtn'); await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/02_day.png' });
  const r = await p.evaluate(async () => {
    const me = W.p[0], out = {};
    // walk left
    me.inp.l = 1; const x0 = me.x;
    // search a spot
    const s = W.spots[0]; me.x = s.x; me.y = GY; INP.keys.e = true;
    await new Promise(r => setTimeout(r, 1800)); INP.keys.e = false;
    out.searched = s.searched; out.res = JSON.stringify(W.res);
    // build: wall next to house, outside right door
    me.x = 78 * T; me.y = GY;
    doBuild(me, 80, 39, 1); doBuild(me, 80, 38, 1); doBuild(me, 80, 37, 2); doBuild(me, 80, 36, 4); doBuild(me, 81, 36, 4);
    out.built = [tileAt(80, 39), tileAt(80, 38), tileAt(80, 37), tileAt(80, 36), tileAt(81, 36)].join(',');
    out.stab = [W.stab[ix(80, 39)], W.stab[ix(80, 36)], W.stab[ix(81, 36)]].join(',');
    // floating block should fail
    out.float = canPlace(85, 30, 1);
    // demolish the support -> the floors above should collapse
    doDemolish(me, 80, 39); doDemolish(me, 80, 38);
    out.afterDemo = [tileAt(80, 37), tileAt(80, 36), tileAt(81, 36)].join(',');
    // craft rifle
    me.x = BENCH.x; me.y = GY; W.res.parts += 40; W.res.steel += 20; doCraft(me, 'rifle');
    out.rifle = me.owned[2] + ' wpn ' + me.wpn + ' ammo ' + me.ammo[2];
    me.x = 70 * T; return out;
  });
  console.log('day', JSON.stringify(r));
  // ladder climb test
  const lad = await p.evaluate(async () => { const me = W.p[0]; me.x = 66.5 * T; me.y = GY; me.vx = me.vy = 0; INP.keys.w = true; await new Promise(r => setTimeout(r, 1300)); INP.keys.w = false; await new Promise(r => setTimeout(r, 400)); return [me.y / T, me.climbing, me.ground]; });
  console.log('ladder -> feet row', lad);
  await p.screenshot({ path: OUT + '/03_built.png' });
  // night
  await p.evaluate(() => { W.clock = 0.5; window.__dbg.god = true; });
  await p.waitForTimeout(2500); await p.screenshot({ path: OUT + '/04_night_start.png' });
  await p.evaluate(() => { window.__dbg.speed = 4; });
  await p.waitForTimeout(6000);
  const n1 = await p.evaluate(() => ({ phase: W.phase, night: W.night, zs: W.zs.length, q: W.spawnQ.length, radio: W.radio.hp, kinds: [...new Set(W.zs.map(z => z.k))].join(','), atk: W.zs.filter(z => z.st === 'attack').length, ride: W.zs.filter(z => z.ride).length }));
  console.log('night', JSON.stringify(n1));
  // shoot at zombies: aim at nearest and hold fire
  await p.evaluate(() => { window.__dbg.speed = 1; const me = W.p[0]; me.x = 70 * T; me.y = GY; });
  for (let k = 0; k < 20; k++) {
    await p.evaluate(() => { const me = W.p[0]; const z = W.zs.slice().sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0]; if (z) { const [mx, my] = w2s(z.x, z.y - z.h * 0.6); INP.mx = mx; INP.my = my; INP.mouseT = performance.now(); INP.mL = true; } });
    await p.waitForTimeout(150);
  }
  await p.evaluate(() => { INP.mL = false; });
  await p.screenshot({ path: OUT + '/05_fight.png' });
  console.log('kills', await p.evaluate(() => W.kills + ' mag ' + W.p[0].mag.join(',')));
  // grenade + shove
  await p.evaluate(() => { const me = W.p[0]; me.nades = 3; doAct(me, 'nade'); doAct(me, 'shove'); });
  // build mode screenshot
  await p.keyboard.press('b'); await p.mouse.move(800, 400); await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/06_build.png' }); await p.keyboard.press('b');
  // fast-forward to dawn
  await p.evaluate(() => { window.__dbg.speed = 6; });
  await p.waitForFunction(() => W.phase !== 'night' || W.night > 1, null, { timeout: 120000 }).catch(() => {});
  const n2 = await p.evaluate(() => ({ phase: W.phase, night: W.night, zs: W.zs.length, radio: Math.round(W.radio.hp), lost: W.stats.lost, kills: W.kills }));
  console.log('after night 1', JSON.stringify(n2));
  await p.evaluate(() => { window.__dbg.speed = 1; }); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/07_dawn.png' });
  // jump to blood moon night 5 with brute/boss
  await p.evaluate(() => { W.night = 4; W.clock = 0.2; W.p[0].x = 70 * T; W.p[0].y = GY; });
  await p.waitForTimeout(1200); await p.evaluate(() => { window.__dbg.speed = 5; }); await p.waitForTimeout(9000);
  const n3 = await p.evaluate(() => ({ night: W.night, zs: W.zs.length, kinds: [...new Set(W.zs.map(z => z.k))].join(','), lost: W.stats.lost, radio: Math.round(W.radio.hp), climb: W.zs.filter(z => z.climbing).length, ride: W.zs.filter(z => z.ride).length, proj: W.proj.length }));
  console.log('blood night', JSON.stringify(n3));
  await p.evaluate(() => { window.__dbg.speed = 1; }); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/08_blood.png' });
  // lose: destroy radio
  await p.evaluate(() => { W.radio.hp = 0; }); await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/09_over.png' });
  console.log('over visible', await p.evaluate(() => !document.getElementById('over').classList.contains('hidden') + ' ' + W.over));
  console.log('errs', errs.slice(0, 8), await p.evaluate(() => window.__dbg.err || ''));
  await b.close();
})();
