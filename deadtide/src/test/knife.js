// Knife: auto-target + lunge, damage, backstab, no target through walls, riot armour, hold to repeat, slash pose screenshot.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.click('#soloBtn'); await p.waitForFunction(() => W && W.t > 0.5);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  await p.evaluate(() => { window.__dbg.god = true; window.__dbg.skipDraw = true; const me = W.p[0]; me.x = W.radio.x + 9.5; me.y = W.radio.y - 8.5; me.L = 0; me.z = 0;
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) { const i = ci(Math.floor(me.x) + x, Math.floor(me.y) + y, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++; W.navDirty = true; W.zs.length = 0;
    window.__put = (k, dx, dy, faceAway) => { const me = W.p[0]; W.zs.length = 0; const z = spawnZombie(k, 0); z.x = me.x + dx; z.y = me.y + dy; z.L = 0; z.z = 0; z.stun = 99; z.hp = z.max = ZT[k].hp; z.face = Math.atan2(me.y - z.y, me.x - z.x) + (faceAway ? Math.PI : 0); return z.id; };
    window.__home = () => { const me = W.p[0]; me.x = W.radio.x + 9.5; me.y = W.radio.y - 8.5; me.vx = me.vy = 0; me.dash = null; me.knCD = 0; me.knCDh = 0; me.aim = 0; };
  });
  const slash = async () => { await p.evaluate(() => { W.p[0].knCD = 0; W.p[0].knCDh = 0; doKnife(); }); await p.evaluate(() => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= 0.3 && !W.p[0].dash ? r() : setTimeout(f, 30); f(); })); };
  // facing zombie 1.8 away, off to the side of the aim: the knife finds it, lunges, hits
  let r = await p.evaluate(() => { __home(); __put('walker', 0.3, 1.8, false); return { x0: W.p[0].x, y0: W.p[0].y }; }); await slash();
  let s = await p.evaluate(() => ({ dist: Math.hypot(W.zs[0].x - W.p[0].x, W.zs[0].y - W.p[0].y), hp: W.zs[0] ? W.zs[0].hp : 0, moved: Math.hypot(W.p[0].x - (W.radio.x + 9.5), W.p[0].y - (W.radio.y - 8.5)), aimTo: Math.abs(angDiff(W.p[0].aim, Math.atan2(W.zs[0].y - W.p[0].y, W.zs[0].x - W.p[0].x))) }));
  check('auto-targets, lunges onto it and cuts 55', Math.abs(s.hp - 15) < 0.5 && s.moved > 0.8 && s.dist < 1.4, JSON.stringify(s));
  r = await p.evaluate(() => { __home(); __put('walker', 1.4, 0, true); }); await slash();
  check('backstab doubles it (walker 70 dies)', await p.evaluate(() => !W.zs.length || W.zs[0].hp <= 0));
  r = await p.evaluate(() => { __home(); __put('armored', 1.2, 0, false); }); await slash(); const af = await p.evaluate(() => W.zs[0].max - W.zs[0].hp);
  r = await p.evaluate(() => { __home(); __put('armored', 1.2, 0, true); }); await slash(); const ab = await p.evaluate(() => W.zs[0].max - W.zs[0].hp);
  check('riot armour: front cut is weak, back gets through', af < 20 && ab > 100, 'front ' + af.toFixed(1) + ' back ' + ab.toFixed(1));
  r = await p.evaluate(() => { __home(); __put('walker', 0, 1.8, false); const me = W.p[0]; const x = Math.floor(me.x), y = Math.floor(me.y) + 1; W.blk[ci(x, y, 0)] = 2; W.blk[ci(x - 1, y, 0)] = 2; W.blk[ci(x + 1, y, 0)] = 2; W.ver++; W.navDirty = true; }); await slash();
  check('no target through a wall', await p.evaluate(() => W.zs[0].hp === W.zs[0].max));
  await p.evaluate(() => { const me = W.p[0]; const x = Math.floor(me.x), y = Math.floor(me.y) + 1; for (const dx of [-1, 0, 1]) W.blk[ci(x + dx, y, 0)] = 0; W.ver++; __home(); __put('walker', 5, 0, false); }); await slash();
  check('nothing in reach: a swing, no lunge', await p.evaluate(() => Math.hypot(W.p[0].x - (W.radio.x + 9.5), W.p[0].y - (W.radio.y - 8.5)) < 0.05 && W.zs[0].hp === W.zs[0].max));
  // hold V: keeps slashing
  await p.evaluate(() => { __home(); __put('brute', 1.3, 0, false); W.zs[0].hp = W.zs[0].max = 5000; });
  await p.keyboard.down('v'); await p.evaluate(() => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= 2 ? r() : setTimeout(f, 30); f(); })); await p.keyboard.up('v');
  const hits = await p.evaluate(() => Math.round((W.zs[0].max - W.zs[0].hp) / BAL.knifeDmg));
  check('holding V keeps slashing (about 2 per second)', hits >= 3, 'hits ' + hits);
  check('legend says knife', /V 刀/.test(await p.evaluate(() => document.getElementById('keys').innerText.replace(/\s+/g, ' '))));
  // slash pose
  await p.evaluate(() => { window.__dbg.skipDraw = false; __home(); __put('walker', 1.2, 0.2, false); CAM.zoom = 3.2; CAM.rot = 1; CAM.tx = W.p[0].x; CAM.ty = W.p[0].y; document.getElementById('hud').style.opacity = 0.2; });
  await p.waitForTimeout(1500);
  for (const [k, t] of [['wind', 0.2], ['cut', 0.14]]) { await p.evaluate(t => { window.__dbg.speed = 0; W.p[0].knT = t; window.__freezeKn = setInterval(() => { W.p[0].knT = t; }, 5); }, t); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + '/knife_' + k + '.png' }); require('fs').writeFileSync(OUT + '/knife_' + k + '.json', JSON.stringify(await p.evaluate(() => w2s(W.p[0].x, W.p[0].y, W.p[0].z + 0.7)))); await p.evaluate(() => clearInterval(window.__freezeKn)); }
  check('no page errors', !errs.length, errs.join(' | ')); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
