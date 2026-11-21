// Round 28: a quick click fires; turrets work in every mode (MG nerfed, + shotgun / slow / sniper turrets); traps cover the open floor around them (3×3, smaller in tight spots)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
  // quick click (down + up in the same frame) still fires the sniper rifle
  let s = await p.evaluate(() => { window.__dbg.god = true; W.zs.length = 0; W.spawnQ = []; const me = W.p[0]; me.owned[3] = 1; me.mag[3] = 5; me.wpn = 3; me.cdW = me.cdW.map(() => 0); return me.mag[3]; });
  await p.mouse.move(700, 380); await simWait(0.2);
  await p.evaluate(() => { const cv = document.querySelector('canvas'), o = { clientX: INP.mx, clientY: INP.my, button: 0, bubbles: true }; cv.dispatchEvent(new MouseEvent('mousedown', o)); window.dispatchEvent(new MouseEvent('mouseup', o)); });
  await simWait(0.4);
  const m1 = await p.evaluate(() => W.p[0].mag[3]);
  check('PC: a quick click on the ground fires the sniper rifle (no zombie needed)', m1 === s - 1, s + ' -> ' + m1);
  // a clear field to work in
  const spot = await p.evaluate(() => { window.__dbg.skipDraw = true; W.phase = 'day'; W.clock = 999; for (const k in W.res) W.res[k] = 999; const x = W.radio.x + 24, y = W.radio.y + 24, L = gAt(x, y);
    for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) for (let l = L; l < L + 3; l++) { W.blk[ci(x + dx, y + dy, l)] = 0; if (l > L) W.slab[ci(x + dx, y + dy, l)] = 0; } W.ver++; const me = W.p[0]; me.x = x - 3.5; me.y = y - 3.5; me.L = L; me.z = surfZ(me.x, me.y, L); return { x, y, L }; });
  const put = (k, x, y, hp) => p.evaluate(([k, x, y, hp, L]) => { const z = putZombie(k, x, y, L); z.hp = z.max = hp; z.sleep = 0; z.mz = 1; z.stun = 99; return W.zs.indexOf(z); }, [k, x, y, hp, spot.L]);
  const clear = () => p.evaluate(() => { W.zs.length = 0; W.spawnQ = []; W.cz = []; });
  // machine gun turret, classic mode
  await p.evaluate(({ x, y, L }) => doBuild(W.p[0], x, y, L, 52), spot); await put('walker', spot.x + 5.5, spot.y + 0.5, 900);
  await simWait(1.2);
  s = await p.evaluate(({ x, y, L }) => { const z = W.zs[0], i = ci(x, y, L); return { lost: Math.round(900 - z.hp), shots: 240 - W.obj.tam[i], upg: W.upg }; }, spot);
  check('the machine gun turret fires in classic mode too, 11 damage a shot (was 18)', s.shots > 0 && Math.abs(s.lost / s.shots - 11 * (1 + 0.12 * s.upg)) < 0.6, JSON.stringify(s));
  s = await p.evaluate(({ x, y, L }) => { const i = ci(x, y, L), me = W.p[0]; W.obj.tam[i] = 10; me.x = x + 1.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); const t = useTarget(me), parts = W.res.parts; if (t) completeUse(me, t); me.x = x - 3.5; me.y = y - 3.5; return { t: t && t.name, ammo: W.obj.tam[i], paid: parts - W.res.parts }; }, spot);
  check('F refills a turret in any mode (3 parts)', s.t && s.ammo === 240 && s.paid === 3, JSON.stringify(s));
  await p.evaluate(({ x, y, L }) => { W.blk[ci(x, y, L)] = 0; W.ver++; }, spot); await clear();
  // shotgun turret: a cone, several at once, pushed back
  await p.evaluate(({ x, y, L }) => doBuild(W.p[0], x, y, L, 57), spot);
  for (const dy of [-0.5, 0.5, 1.4]) await put('walker', spot.x + 3.5, spot.y + 0.5 + dy, 500);
  await p.evaluate(() => W.zs.forEach(z => { z._x0 = z.x; z.stun = 0; z.spd = 0; })); await simWait(1.4);
  s = await p.evaluate(() => W.zs.map(z => ({ lost: Math.round(500 - z.hp), push: +(z.x - z._x0).toFixed(2) })));
  check('the shotgun turret hits several zombies in its cone at once', s.filter(q => q.lost > 0).length >= 2, JSON.stringify(s));
  await p.evaluate(({ x, y, L }) => { W.blk[ci(x, y, L)] = 0; W.ver++; }, spot); await clear();
  // slow turret: drops a slow field on the knot
  await p.evaluate(({ x, y, L }) => doBuild(W.p[0], x, y, L, 58), spot);
  for (const [dx, dy] of [[4, 0], [4.6, 0.5], [4.2, -0.6], [-4, 2]]) await put('walker', spot.x + 0.5 + dx, spot.y + 0.5 + dy, 500);
  await simWait(0.6);
  s = await p.evaluate(({ x, y }) => (W.cz || []).map(c => ({ k: c.k, dx: +(c.x - x - 0.5).toFixed(1), r: c.r })), spot);
  check('the slow turret drops a sticky patch on the biggest knot (3 zombies, not the lone one)', s.length >= 1 && s[0].k === 1 && s[0].dx > 3, JSON.stringify(s));
  await p.evaluate(({ x, y, L }) => { W.blk[ci(x, y, L)] = 0; W.ver++; }, spot); await clear();
  // sniper turret: picks the toughest thing in range
  await put('walker', spot.x + 4.5, spot.y + 0.5, 300); await put('brute', spot.x + 12.5, spot.y + 0.5, 3000);
  await p.evaluate(({ x, y, L }) => doBuild(W.p[0], x, y, L, 59), spot);
  await simWait(0.5);
  s = await p.evaluate(() => W.zs.map(z => ({ k: z.k, lost: Math.round(z.max - z.hp) })));
  check('the sniper turret shoots the brute 12 tiles away, not the walker next to it', s[1].lost >= 100 && s[0].lost === 0, JSON.stringify(s));
  await p.evaluate(({ x, y, L }) => { W.blk[ci(x, y, L)] = 0; W.ver++; }, spot); await clear();
  // traps: a 3×3 patch on open ground, smaller in a corridor
  s = await p.evaluate(({ x, y, L }) => { const me = W.p[0]; doBuild(me, x, y, L, 9); scanCells(); const open = W.trapCells.length;
    for (let k = -3; k <= 3; k++) { W.blk[ci(x + k, y + 3, L)] = 3; W.blk[ci(x + k, y + 5, L)] = 3; } W.ver++; me.x = x - 2.5; me.y = y + 0.5; doBuild(me, x, y + 4, L, 15); scanCells(); const tight = W.trapCells.filter(j => W.trapAt[j] === ci(x, y + 4, L)).length;
    return { open, tight }; }, spot);
  check('wire on open ground covers 3×3; a bear trap in a 1-wide corridor covers just the 3 cells along it', s.open === 9 && s.tight === 3, JSON.stringify(s));
  await put('walker', spot.x + 1.5, spot.y + 1.5, 400); await p.evaluate(() => { const z = W.zs[0]; z.stun = 0; z._x = z.x; }); await simWait(1);
  s = await p.evaluate(() => { const z = W.zs[0]; return { lost: +(400 - z.hp).toFixed(1) }; });
  check('a zombie on the corner of the wire patch (not the wire cell) is cut (8 a second)', s.lost > 4 && s.lost < 14, JSON.stringify(s));
  await clear();
  await put('walker', spot.x + 1.5, spot.y + 4.5, 400); await p.evaluate(() => { W.zs[0].stun = 0; }); await simWait(0.3);
  s = await p.evaluate(({ x, y, L }) => { const z = W.zs[0], i = ci(x, y + 4, L); return { stun: +(z.stun || 0).toFixed(1), limp: +(z.limp || 0).toFixed(1), lost: Math.round(400 - z.hp), trap: W.blk[i], hp: Math.round(W.bhp[i]) }; }, spot);
  check('a bear trap catches a zombie beside it: 1.8 s stuck, 18 damage, then a limp; one of its 3 uses gone', s.stun > 1.2 && s.stun <= 1.8 && s.limp > 2 && s.lost === 18 && s.trap === 15 && s.hp === 40, JSON.stringify(s));
  await clear();
  // mine: set off from the next cell, 120 damage, a slow patch left behind
  await p.evaluate(({ x, y, L }) => { for (let k = -3; k <= 3; k++) { W.blk[ci(x + k, y + 3, L)] = 0; W.blk[ci(x + k, y + 5, L)] = 0; W.blk[ci(x + k, y + 4, L)] = 0; } W.blk[ci(x, y, L)] = 0; W.ver++; doBuild(W.p[0], x, y, L, 51); }, spot);
  await put('walker', spot.x - 0.5, spot.y + 0.5, 400); await put('walker', spot.x + 3.2, spot.y + 0.5, 400); await p.evaluate(() => { W.zs[0].stun = 0; }); await simWait(0.3);
  s = await p.evaluate(({ x, y, L }) => ({ mine: W.blk[ci(x, y, L)], lost: W.zs.map(z => Math.round(400 - z.hp)), cz: (W.cz || []).map(c => [c.k, c.r]), limp: W.zs.map(z => +(z.limp || 0).toFixed(1)) }), spot);
  check('a mine goes off when a zombie steps next to it: about 120 damage, reaches 3 tiles, leaves a slow patch, they limp', s.mine === 0 && s.lost[0] >= 90 && s.lost[0] <= 140 && s.lost[1] > 0 && s.cz.some(c => c[0] === 1) && s.limp[0] > 2, JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
