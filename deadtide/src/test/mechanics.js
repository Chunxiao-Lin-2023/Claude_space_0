// This round's mechanics: daily tasks, parapets, surface build targeting + row painting, stairs hold/rails, entrances, floating stick.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
require('fs').mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!cond) fails++; };
  // ---------- desktop ----------
  {
    const c = await b.newContext({ viewport: { width: 1280, height: 760 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.click('#soloBtn'); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
    await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; W.res.wood = W.res.stone = W.res.steel = W.res.parts = 999; });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
    // tasks
    const tk = await p.evaluate(() => W.tasks.map(t => t.k + ':' + t.need + ':' + t.rt));
    ok('three tasks rolled', tk.length === 3, tk.join(' | '));
    ok('task panel rendered', await p.evaluate(() => document.querySelectorAll('#tasks .tk').length === 3));
    ok('no radio left', await p.evaluate(() => !W.blk.some(b => b === 30) && !CRAFT.some(c => c.id === 'radio')));
    const pay = await p.evaluate(() => { W.tasks = [{ k: 'build', need: 2, got: 0, done: 0, rw: { res: { parts: 7 } }, txt: 't', rt: 'r' }]; W.tkv++; const p0 = W.res.parts; taskAdd('build'); taskAdd('build'); return [W.tasks[0].done, W.res.parts - p0]; });
    ok('task completes and pays', pay[0] === 1 && pay[1] === 7, pay.join(','));
    const roll = await p.evaluate(() => { const s = new Set(); for (let n = 0; n < 14; n++) { W.night = n; rollTasks(); W.tasks.forEach(t => s.add(t.k)); } W.night = 0; rollTasks(); return [...s].join(','); });
    ok('task variety over nights', roll.split(',').length >= 9, roll);
    // zombies hunt players, not the camp
    const hunt = await p.evaluate(() => { const me = W.p[0]; me.x = W.radio.x + 0.5; me.y = W.radio.y + 14.5; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); updateFields(0, true); const z = spawnZombie('walker', 0); z.x = W.radio.x + 9.5; z.y = W.radio.y + 14.5; z.L = gAt(Math.floor(z.x), Math.floor(z.y)); z.z = surfZ(z.x, z.y, z.L); const d0 = Math.hypot(z.x - me.x, z.y - me.y); return d0; });
    await simWait(2);
    const hunt2 = await p.evaluate(() => { const me = W.p[0], z = W.zs[W.zs.length - 1]; const d = Math.hypot(z.x - me.x, z.y - me.y); W.zs.length = 0; return d; });
    ok('zombie walks toward the player', hunt2 < hunt - 1, hunt.toFixed(1) + ' -> ' + hunt2.toFixed(1));
    // parapets: starter house upper-floor walls on the north side; ground walls stay full
    const para = await p.evaluate(() => {
      const X = W.radio.x, Y0 = W.radio.y - 5, i1 = ci(X - 1, Y0, 2), i0 = ci(X - 1, Y0, 0);
      const r = { up: isParapet(i1), ground: isParapet(i0) };
      // shoot north from upstairs behind the parapet, level and slightly down
      const sx = X - 0.5, sy = Y0 + 1.5, sz = 2 * FH + 0.72;
      r.level = rayWorld(sx, sy, sz, 0, -1, 0, 20, { lean: LEAN }).d;
      const n = Math.hypot(1, 0.12); r.down = rayWorld(sx, sy, sz, 0, -1 / n, -0.12 / n, 20, { lean: LEAN }).d;
      r.noLeanFar = rayWorld(X - 0.5, Y0 + 3.5, sz, 0, -1 / Math.hypot(1, 0.25), -0.25 / Math.hypot(1, 0.25), 20).d;
      r.groundShot = rayWorld(X - 0.5, Y0 + 1.5, 0.72, 0, -1, 0, 20).d;
      return r;
    });
    ok('upper wall is a parapet, ground wall is not', para.up && !para.ground, JSON.stringify(para));
    ok('bullets fly over the parapet', para.level > 5 && para.down > 3);
    ok('steep shot from far back hits the parapet', para.noLeanFar < 3.2);
    ok('ground wall still stops bullets', para.groundShot < 2);
    // build targeting: pointing at the top of a wall stacks, at the floor builds on it, drag paints a row
    const bt = await p.evaluate(() => {
      const me = W.p[0], X = W.radio.x + 10, Y = W.radio.y + 2; me.x = X - 1.5; me.y = Y + 1.5; me.L = 0; me.z = 0; me.sel = 1; me.build = true; me.demo = false;
      for (let x = X - 1; x <= X + 6; x++) for (let y = Y - 3; y <= Y + 5; y++) for (let L = 0; L < 3; L++) { const i = ci(x, y, L); if (W.blk[i] && W.blk[i] !== 20 && W.blk[i] !== 23) W.blk[i] = 0; W.slab[i] = 0; }
      W.ver++; recomputeStab(); CAM.tx = me.x; CAM.ty = me.y; CAM.zoom = 9; updateCamera(1); updateCamera(1);
      const r = {};
      let [sx, sy] = w2s(X + 0.5, Y + 0.5, 0.02); r.floor = pickBuild(sx, sy, me, false);
      act('build', { x: X, y: Y, l: 0, b: 1, d: 0 }); recomputeStab();
      [sx, sy] = w2s(X + 0.5, Y + 0.5, FH + 0.01); r.top = pickBuild(sx, sy, me, false);
      me.sel = 4; r.slabTop = pickBuild(sx, sy, me, false); me.sel = 1;
      [sx, sy] = w2s(X + 0.5, Y + 0.5, 0.01); r.demo = pickBuild(sx, sy - 25, me, true);
      return JSON.stringify(r);
    });
    const B1 = JSON.parse(bt);
    ok('floor point -> build on the ground', B1.floor && B1.floor.L === 0 && B1.floor.ok, bt);
    ok('wall top -> stack one layer up', B1.top && B1.top.L === 1 && B1.top.ok);
    ok('floor item on wall top -> slab on the wall', B1.slabTop && B1.slabTop.L === 1 && B1.slabTop.ok);
    ok('demolish picks the wall', B1.demo && B1.demo.L === 0);
    const row = await p.evaluate(async () => {
      const me = W.p[0], X = W.radio.x + 10, Y = W.radio.y + 2 + 2; me.sel = 2;
      const a = w2s(X + 0.5, Y + 0.5, 0.02), c = w2s(X + 4.5, Y + 0.8, 0.02);
      paintBuild(a[0], a[1], true, false);
      for (let k = 1; k <= 6; k++) paintBuild(a[0] + (c[0] - a[0]) * k / 6, a[1] + (c[1] - a[1]) * k / 6, false, false);
      const pv = PREV ? PREV.cells.map(c => (c.x - X) + ':' + (buildWhy(me, c.x, c.y, c.L) || 'ok')).join(' ') : 'noprev', mp = [me.x - X, me.y - Y].map(v => v.toFixed(1)).join(',');
      finishPaint(); const pl = PLAN ? PLAN.cells.map(c => (c.x - X) + ',' + (c.y - Y) + ',' + c.L).join(' ') : 'none'; confirmPlan();
      await new Promise(r => setTimeout(r, 300));
      let n = 0; for (let x = X; x <= X + 4; x++) if (W.blk[ci(x, Y, 0)] === 2) n++; return n === 5 ? n : n + ' plan ' + pl + ' prev ' + pv + ' me ' + mp;
    });
    ok('drag paints a straight row', row === 5, 'row ' + row);
    // stairs: walking off the top requires a push; side entry is blocked by rails
    const st = await p.evaluate(() => {
      const sx = W.radio.x + 1, sy = W.radio.y - 4; // ladder hung on the hall wall, facing east, up to (sx+1, sy, 1)
      return { st: B[W.blk[ci(sx, sy, 0)]].stairs, dir: W.bdir[ci(sx, sy, 0)], wall: B[W.blk[ci(sx + 1, sy, 0)]].key, side: transition(sx - 1, sy, sx, sy, 1, 'p', true), front: transition(sx + 1, sy, sx, sy, 1, 'p', true), sx, sy };
    });
    ok('ladder hangs on a wall; side entry blocked, front entry allowed', st.st && st.dir === 0 && st.wall === 'brick' && st.side === -1 && st.front === 0, JSON.stringify(st));
    const hold = await p.evaluate(async () => {
      const me = W.p[0], sx = W.radio.x + 1, sy = W.radio.y - 4; me.build = false;
      me.x = sx + 1.3; me.y = sy + 0.5; me.L = 1; me.vx = me.vy = 0; me.edgeT = 0;
      const want = W.p[0];
      INP.keys = {}; const [fx, fy] = camFwd();
      // walk "south" (+y) in world terms using a direct input override
      const r = { L0: me.L };
      for (let k = 0; k < 3; k++) { me.inp.mx = -1; me.inp.my = 0; stepMove(me, 1 / 60); }
      r.afterTap = me.L;
      for (let k = 0; k < 40; k++) { me.inp.mx = -1; me.inp.my = 0; stepMove(me, 1 / 60); }
      r.afterPush = me.L; me.inp.mx = 0; return r;
    });
    ok('brief step does not go down, pushing does', hold.afterTap === 1 && hold.afterPush === 0, JSON.stringify(hold));
    // entrances: starter house has 4 doors; every town house opens on >= 3 sides
    const ent = await p.evaluate(() => {
      const X0 = W.radio.x - 6, X1 = W.radio.x + 6, Y0 = W.radio.y - 5, Y1 = W.radio.y + 5; let doors = 0;
      for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) if (W.blk[ci(x, y, 0)] === 7) doors++;
      const fam = TOWN_HOUSES.filter(h => h[5] !== 'barn').map(([x0, y0, x1, y1]) => {
        const side = (ax, bx, ay, by) => { for (let x = ax; x <= bx; x++) for (let y = ay; y <= by; y++) if ((!W.blk[ci(x, y, 0)] || W.blk[ci(x, y, 0)] === 7) && W.tt[y * MW + x] !== TT.water) return 1; return 0; };
        return side(x0 + 1, x1 - 1, y0, y0) + side(x0 + 1, x1 - 1, y1, y1) + side(x0, x0, y0 + 1, y1 - 1) + side(x1, x1, y0 + 1, y1 - 1);
      });
      return { doors, min: Math.min(...fam), houses: fam.length };
    });
    ok('starter house has 4 doors', ent.doors === 4, JSON.stringify(ent));
    ok('town houses open on 3+ sides', ent.min >= 3);
    // screenshot: upstairs parapets
    await p.evaluate(() => { const me = W.p[0]; me.build = false; me.x = W.radio.x - 1.5; me.y = W.radio.y - 2.5; me.L = 1; me.z = FH; CAM.zoom = 8; W.clock = 999; });
    await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/m_parapet.png' });
    await p.evaluate(() => { CAM.rot = 2; CAM.yaw = camYawTarget(); }); await p.waitForTimeout(600); await p.screenshot({ path: OUT + '/m_parapet2.png' });
    ok('desktop no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  // ---------- phone: floating stick ----------
  {
    const c = await b.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.tap('#soloBtn'); await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; }); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
    const cdp = await c.newCDPSession(p); const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await p.waitForTimeout(300);
    ok('stick hint visible', await p.evaluate(() => getComputedStyle(document.getElementById('stickHint')).display !== 'none'));
    await tch('touchStart', [{ x: 150, y: 280, id: 1 }]);
    await tch('touchMove', [{ x: 250, y: 280, id: 1 }]); await p.waitForTimeout(100);
    const s1 = await p.evaluate(() => ({ ox: INP.move.ox, x: INP.move.x, hint: getComputedStyle(document.getElementById('stickHint')).display }));
    await tch('touchMove', [{ x: 160, y: 280, id: 1 }]); await p.waitForTimeout(100);
    const s2 = await p.evaluate(() => ({ ox: INP.move.ox, x: INP.move.x }));
    await tch('touchEnd', []);
    ok('base follows the thumb past the ring', s1.ox > 150 + 10 && s1.x > 1.1, JSON.stringify(s1));
    ok('reversing gives full travel back immediately', s2.x < -0.8, JSON.stringify(s2));
    ok('hint hides while the stick is held', s1.hint === 'none');
    const snap = await p.evaluate(() => { INP.move.id = 99; const [fx, fy] = camFwd(), [rx, ry] = camRight(); // a world-axis direction (+x), nudged by ~8 degrees, in screen stick terms
      const a = 0.14, wx = Math.cos(a), wy = Math.sin(a); const sx = wx * rx + wy * ry, sy = wx * fx + wy * fy; INP.move.x = sx; INP.move.y = -sy; readInput(1 / 60); const r = [W.p[0].inp.mx, W.p[0].inp.my]; INP.move.id = null; INP.move.x = INP.move.y = 0; return r; });
    ok('near-axis input snaps to the grid axis', Math.abs(snap[1]) < 1e-6 && snap[0] > 0.9, snap.map(v => v.toFixed(3)).join(','));
    ok('phone no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  await b.close();
})();
