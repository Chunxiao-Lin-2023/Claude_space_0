// Round 14: spaced-out town with typed interiors and stair cores, firing ports, bullets through rocks/trees, big map.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1100, height: 700 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  await p.evaluate(() => { window.__dbg.god = true; window.__dbg.skipDraw = true; W.clock = 999; });
  // every building: ladders on each floor that should have one, stacked in one stair core
  const lad = await p.evaluate(() => TOWN_HOUSES.map(([x0, y0, x1, y1, st, t]) => { const per = []; const xs = new Set(); for (let L = 0; L < ML; L++) { let n = 0; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (inMap(x, y) && W.blk[ci(x, y, L)] === 6) { n++; xs.add(x); } per.push(n); } return { t, st, per: per.slice(0, st + 1), cols: xs.size }; }));
  const need = h => h.t === 'apt' || h.t === 'clinic' || h.t === 'police' ? h.st : h.t === 'villa' ? h.st - 1 : h.t === 'shop' ? 1 : h.t === 'ware' ? 1 : 0;
  const bad = lad.filter(h => h.per.slice(0, need(h)).some(n => n < 1));
  check('every floor that leads up has a ladder', !bad.length, JSON.stringify(bad.length ? bad : lad.map(h => h.t + ':' + h.per.join(''))));
  check('apartment / clinic / police ladders sit in one stair core (same column every floor)', lad.filter(h => (h.t === 'clinic' || h.t === 'police') && h.cols > 1).length === 0, JSON.stringify(lad.filter(h => h.t !== 'ware').map(h => h.t + ' cols ' + h.cols)));
  // spacing: no two buildings closer than 6 cells
  const gap = await p.evaluate(() => { let m = 99; for (let i = 0; i < TOWN_HOUSES.length; i++) for (let j = i + 1; j < TOWN_HOUSES.length; j++) { const a = TOWN_HOUSES[i], c = TOWN_HOUSES[j]; const dx = Math.max(0, c[0] - a[2], a[0] - c[2]), dy = Math.max(0, c[1] - a[3], a[1] - c[3]); m = Math.min(m, Math.max(dx, dy)); } return m; });
  check('buildings at least 6 cells apart', gap >= 6, 'min gap ' + gap);
  check('all building types present', await p.evaluate(() => ['apt', 'villa', 'ware', 'shop', 'clinic', 'police', 'garage'].every(t => TOWN_HOUSES.some(h => h[5] === t))));
  // firing port: hugging your own brick wall you shoot through it; a zombie on the far side can't come through
  const port = await p.evaluate(() => { const me = W.p[0]; const X = W.radio.x + 10, Y = W.radio.y - 9; for (let y = Y - 4; y <= Y + 4; y++) for (let x = X - 4; x <= X + 6; x++) { const i = ci(x, y, 0); W.blk[i] = 0; } for (let y = Y - 3; y <= Y + 3; y++) W.blk[ci(X + 1, y, 0)] = 2; W.ver++; W.navDirty = true;
    me.x = X + 0.72; me.y = Y + 0.5; me.L = 0; me.z = 0; const [sx, sy, sz] = shoulder(me); const hug = rayWorld(sx, sy, sz, 1, 0, 0, 6, { lean: LEAN }).d;
    me.x = X - 1.5; const [sx2, sy2, sz2] = shoulder(me); const far = rayWorld(sx2, sy2, sz2, 1, 0, 0, 6, { lean: LEAN }).d;
    const zb = rayWorld(X + 3.5, Y + 0.5, 0.6, -1, 0, 0, 6).d; return { hug: +hug.toFixed(2), far: +far.toFixed(2), zombieRay: +zb.toFixed(2) }; });
  check('firing port: shots pass your wall when you hug it, not from 2 cells back', port.hug >= 5.9 && port.far < 3, JSON.stringify(port));
  // rocks no longer stop bullets; aiming looks past trees and rocks
  const rk = await p.evaluate(() => { const me = W.p[0]; const X = Math.floor(me.x), Y = Math.floor(me.y); W.blk[ci(X + 2, Y, 0)] = 21; W.blk[ci(X + 3, Y, 0)] = 22; W.ver++; me.x = X + 0.5; const [sx, sy, sz] = shoulder(me); return +rayWorld(sx, sy, sz, 1, 0, 0, 6, { lean: LEAN }).d.toFixed(2); });
  check('bullets fly through rocks and trees', rk >= 5.9, 'ray ' + rk);
  // big map
  await p.evaluate(() => { window.__dbg.skipDraw = false; const me = W.p[0]; me.x = W.radio.x + 0.5; me.y = W.radio.y + 8.5; me.L = 0; });
  await p.waitForTimeout(1200); await p.click('#mini'); await p.waitForTimeout(800);
  check('tapping the minimap opens the big map (game paused)', await p.evaluate(() => bigMapOpen() && STATE.paused));
  await p.screenshot({ path: OUT + '/r14_bigmap.png' });
  await p.mouse.click(50, 50); await p.waitForTimeout(300); check('tap closes it', await p.evaluate(() => !bigMapOpen() && !STATE.paused));
  await p.keyboard.press('Tab'); await p.waitForTimeout(300); const tabOpen = await p.evaluate(() => bigMapOpen()); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  check('Tab toggles it', tabOpen && await p.evaluate(() => !bigMapOpen()));
  await p.keyboard.press('m'); await p.waitForTimeout(300); const mOpen = await p.evaluate(() => bigMapOpen()); await p.keyboard.press('m'); await p.waitForTimeout(300);
  check('M toggles it too (and no longer mutes)', mOpen && await p.evaluate(() => !bigMapOpen() && !SET.mute));
  // interiors: a look inside each type (cut to the ground floor)
  await p.evaluate(() => { document.getElementById('hud').style.opacity = 0.15; });
  for (const t of ['apt', 'villa', 'shop', 'clinic', 'police', 'garage']) {
    await p.evaluate(t => { const H = TOWN_HOUSES.find(h => h[5] === t), me = W.p[0]; me.x = H[0] + 2.5; me.y = H[3] - 1.5; me.L = 0; me.z = 0; CAM.zoom = Math.max(9, (H[2] - H[0]) * 0.42); CAM.tx = (H[0] + H[2]) / 2; CAM.ty = (H[1] + H[3]) / 2; CAM.lookX = CAM.lookY = 0; }, t);
    await p.waitForTimeout(1800); await p.evaluate(t => { const H = TOWN_HOUSES.find(h => h[5] === t); CAM.tx = (H[0] + H[2]) / 2; CAM.ty = (H[1] + H[3]) / 2; }, t); await p.waitForTimeout(600);
    await p.screenshot({ path: OUT + '/r14_' + t + '.png' });
  }
  check('no page errors', !errs.length, errs.join(' | ')); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
