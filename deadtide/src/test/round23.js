// Round 23: gear items go down anywhere; riot shield = melee (bash shoves a bunch, halves frontal hits); grenade with a landing ring (PC hold G / touch drag) and an auto pick;
// no jump key (auto vault, auto gap leap); context key heals; compact weapon menu
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const clearAround = `(cx, cy, L, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (!inMap(cx + dx, cy + dy)) continue; for (let l = L; l < Math.min(ML, L + 3); l++) { const i = ci(cx + dx, cy + dy, l); W.blk[i] = 0; if (l > L) W.slab[i] = 0; } } W.ver++; }`;
  {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    await p.evaluate(cl => { window.__clr = eval(cl); window.__dbg.skipDraw = true; window.__dbg.god = true; W.phase = 'day'; for (const k in W.res) W.res[k] = 999; }, clearAround);
    // 1. gear outside the build zone
    let s = await p.evaluate(() => { const x = W.radio.x + 30, y = W.radio.y + 30, L = gAt(x, y); __clr(x, y, L, 2); const me = W.p[0]; me.x = x - 1.5; me.y = y + 0.5; me.L = L;
      const r = {}; for (const id of [1, 51, 52, 53, 12, 15, 10, 56]) r[id] = canPlace(x, y, L, id, 0) || 'OK'; return r; });
    check('classic: mines, turret, cover, traps, pad go down outside the build zone; walls still do not (lamp left the bar in round 25)', ['51', '52', '53', '12', '15', '56'].every(k => s[k] === 'OK') && s[1] !== 'OK', JSON.stringify(s));
    // 2. shield is a melee weapon
    s = await p.evaluate(() => { const me = W.p[0]; me.x = W.radio.x + 0.5; me.y = W.radio.y + 2.5; me.L = gAt(W.radio.x, W.radio.y + 2); /* (round 36f) the shop no longer sells the shield; the old mechanic is still tested by handing it over directly */ me.shield = 1; me.melee = 1;
      me.hp = 100; me.aim = 0; window.__dbg.god = false; hurtPlayer(me, 20, { x: me.x + 1, y: me.y }); const f1 = 100 - me.hp; me.hp = 100; hurtPlayer(me, 20, { x: me.x - 1, y: me.y }); const b1 = 100 - me.hp; me.hp = 100; window.__dbg.god = true;
      return { shield: me.shield, melee: me.melee, f1, b1 }; });
    check('(legacy) shield as the melee weapon: with it out a front hit loses half', s.shield === 1 && s.melee === 1 && s.f1 === 10 && s.b1 === 20, JSON.stringify(s));
    await p.keyboard.press('x'); await simWait(0.1); const m0 = await p.evaluate(() => W.p[0].melee); await p.keyboard.press('x'); await simWait(0.1); const m1 = await p.evaluate(() => W.p[0].melee);
    check('X switches knife <-> shield', m0 === 0 && m1 === 1, m0 + ',' + m1);
    // 3. bash
    s = await p.evaluate(cl => { const me = W.p[0], x = Math.floor(me.x) + 6, y = Math.floor(me.y); const L = gAt(x, y); __clr(x, y, L, 4); me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); me.aim = 0; me.knCD = 0; me.knCDh = 0;
      W.zs.length = 0; W.spawnQ = []; const zs = [[1.3, -0.5], [1.4, 0.5], [1.9, 0], [-1.4, 0]].map(([dx, dy]) => { const z = spawnZombie('walker', 0); z.x = me.x + dx; z.y = me.y + dy; z.L = L; z.z = me.z; z.stun = 0; return z; });
      const d0 = zs.map(z => Math.hypot(z.x - me.x, z.y - me.y)); window.__dbg.aimAt = () => ({ x: me.x + 4, y: me.y, z: me.z + 0.5 }); doKnife(); return { d0 }; }, clearAround);
    await simWait(0.5);
    let s2 = await p.evaluate(() => { const me = W.p[0]; window.__dbg.aimAt = null; return W.zs.map(z => ({ d: +Math.hypot(z.x - me.x, z.y - me.y).toFixed(2), st: +(z.stun || 0).toFixed(2), hp: z.hp | 0 })); });
    check('shield bash shoves the three in front ~2+ tiles back and stuns them; the one behind is left alone', s2.slice(0, 3).every((z, k) => z.d - s.d0[k] > 1.5 && z.hp < 70) && Math.abs(s2[3].d - s.d0[3]) < 0.6, JSON.stringify([s.d0, s2]));
    // 4. grenade: hold G = landing ring at the cursor; let go = it lands there
    s = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; me.nades = 3; window.__dbg.aimAt = () => ({ x: me.x + 7, y: me.y + 1, z: me.z }); const zs = [0, 0.6, -0.6].map(o => { const z = spawnZombie('walker', 0); z.x = me.x + 7 + o; z.y = me.y + 1; z.L = me.L; z.z = me.z; z.stun = 99; z.hp = z.max = 400; return z; }); return 1; });
    await simWait(0.2); await p.keyboard.down('g'); await simWait(0.3);
    const ring = await p.evaluate(() => INP.nadePt && [+(INP.nadePt.x - W.p[0].x).toFixed(1), +(INP.nadePt.y - W.p[0].y).toFixed(1)]);
    await p.keyboard.up('g'); await simWait(2.2);
    s = await p.evaluate(() => { window.__dbg.aimAt = null; return { n: W.p[0].nades, hp: W.zs.map(z => z.hp | 0), mark: !!INP.nadePt }; });
    check('PC: holding G shows the landing ring at the cursor; letting go throws it there (the bunch is hit)', ring && Math.abs(ring[0] - 7) < 0.3 && Math.abs(ring[1] - 1) < 0.3 && s.n === 2 && s.hp.every(h => h < 300) && !s.mark, JSON.stringify([ring, s]));
    // 5. no jump key; auto gap leap
    s = await p.evaluate(cl => { const me = W.p[0], x = Math.floor(me.x) - 12, y = Math.floor(me.y), L0 = gAt(x, y); __clr(x + 2, y, L0, 4); W.zs.length = 0;
      for (let dx = -1; dx <= 5; dx++) for (let dy = -1; dy <= 1; dy++) if (dx !== 2) W.slab[ci(x + dx, y + dy, L0 + 1)] = 4; W.ver++; recomputeStab();
      me.x = x - 0.5; me.y = y + 0.5; me.L = L0 + 1; me.z = surfZ(me.x, me.y, me.L); me.vx = me.vy = 0; me.runT = 0; const tr = [];
      for (let k = 0; k < 90; k++) { me.inp.mx = 1; me.inp.my = 0; stepMove(me, 1 / 60); if (k % 15 === 0) tr.push(+me.x.toFixed(2) + '/' + me.L); }
      me.inp.mx = 0; return { x: +(me.x - x).toFixed(2), L: me.L, L0, tr, space: typeof doJump }; }, clearAround);
    check('no jump key needed: walking at a one-tile gap leaps it (stays on the upper floor)', s.x > 3 && s.L === s.L0 + 1, JSON.stringify(s));
    s = await p.evaluate(() => { const r = (document.getElementById('keys') || {}).textContent || ''; return /空格/.test(r); });
    check('keys card has no 空格 / jump row', !s);
    // 6. brute: charge with a tell, then a slam up close
    s = await p.evaluate(cl => { const me = W.p[0], x = Math.floor(me.x) + 14, y = Math.floor(me.y), L = gAt(x, y); __clr(x, y, L, 8); window.__dbg.god = false; me.hp = me.maxHp = 1000; me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L);
      W.zs.length = 0; W.phase = 'night'; W.nightT = 0; W.strayT = 1e9; W.spawnQ = []; const z = spawnZombie('brute', 0); /* round 36b: brutes only charge by night */ z.x = me.x + 6; z.y = me.y; z.L = L; z.z = me.z; z.chgCD = 0; z.stun = 0; window.__bz = z; window.__tl = []; return 1; }, clearAround);
    for (let k = 0; k < 14; k++) { await simWait(0.12); await p.evaluate(() => __tl.push(__bz.tl || 0)); }
    s = await p.evaluate(() => ({ tl: __tl.join(''), hp: W.p[0].hp | 0 }));
    check('brute: red lane tell (1) then a rush (2) that hits hard', /1/.test(s.tl) && /2/.test(s.tl) && s.hp <= 1000 - 30, JSON.stringify(s));
    await p.evaluate(() => { const me = W.p[0], z = __bz; z.chg = null; z.chgCD = 99; z.slamCD = 0; z.stun = 0; z.x = me.x + 1.2; z.y = me.y; me.hp = 1000; window.__tl = []; });
    for (let k = 0; k < 10; k++) { await simWait(0.1); await p.evaluate(() => __tl.push(__bz.tl || 0)); }
    s = await p.evaluate(() => { window.__dbg.god = true; return { tl: __tl.join(''), hp: W.p[0].hp | 0 }; });
    check('brute: ground slam with a red ring (3) up close', /3/.test(s.tl) && s.hp < 1000, JSON.stringify(s));
    check('desktop: no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  {
    const c = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.guide22 = 1, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5); await p.waitForTimeout(600);
    const cdp = await c.newCDPSession(p); const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    await p.evaluate(cl => { window.__clr = eval(cl); window.__dbg.skipDraw = true; window.__dbg.god = true; W.phase = 'day'; const me = W.p[0]; me.x = W.radio.x + 20.5; me.y = W.radio.y - 14.5; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); me.z = surfZ(me.x, me.y, me.L); __clr(Math.floor(me.x), Math.floor(me.y), me.L, 9);
      me.owned[2] = me.owned[3] = me.owned[4] = 1; me.ammo[2] = 90; W.zs.length = 0; W.spawnQ = []; }, clearAround);
    // context key heals
    await p.evaluate(() => { const me = W.p[0]; me.hp = 50; me.meds = 2; });
    await simWait(0.3); let s = await p.evaluate(() => { const u = $('tUse').getBoundingClientRect(), m = $('tMed').getBoundingClientRect();
      return { use: $('tUse').textContent, med: $('tMed').textContent, hot: $('tMed').classList.contains('hot'), left: m.right <= u.left, sameRow: Math.abs((m.top + m.bottom) / 2 - (u.top + u.bottom) / 2) < 4, gap: Math.round(u.left - m.right) }; });
    const ub = await p.evaluate(() => { const r = $('tUse').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await tch('touchStart', [{ x: ub[0], y: ub[1], id: 3 }]); await p.waitForTimeout(60); await tch('touchEnd', []); await simWait(0.2);
    const afterUse = await p.evaluate(() => W.p[0].meds);
    const mb = await p.evaluate(() => { const r = $('tMed').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await tch('touchStart', [{ x: mb[0], y: mb[1], id: 3 }]); await p.waitForTimeout(60); await tch('touchEnd', []); await simWait(0.2);
    const med = await p.evaluate(() => W.p[0].meds);
    check('iPad: the medkit has its own green key just left of the context key (same row, gap); the context key does not use it', !/治疗/.test(s.use) && /医疗/.test(s.med) && s.hot && s.left && s.sameRow && s.gap >= 8 && afterUse === 2 && med === 1, JSON.stringify([s, afterUse, med]));
    // compact weapon menu
    await p.evaluate(() => toggleWpick(true)); await p.waitForTimeout(100);
    s = await p.evaluate(() => { const k = $('tWpn').getBoundingClientRect(), keys = ['tFire', 'tNade', 'tShove', 'tUse'].map(id => $(id).getBoundingClientRect()), ch = [...document.querySelectorAll('#wpick .wo')].map(e => e.getBoundingClientRect());
      const over = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const far = Math.max(...ch.map(r => Math.hypot(r.left + r.width / 2 - (k.left + k.width / 2), r.top + r.height / 2 - (k.top + k.height / 2))));
      return { n: ch.length, far: Math.round(far), hit: ch.some(r => keys.some(q => over(r, q))) }; });
    await p.evaluate(() => toggleWpick(false));
    check('iPad: the weapon menu is a small ring right above the key, clear of the other keys', s.n >= 5 && s.far < 280 && !s.hit, JSON.stringify(s));
    // swipe on the melee key swaps knife <-> shield
    await p.evaluate(() => { const me = W.p[0]; me.shield = 1; me.melee = 0; });
    const kb = await p.evaluate(() => { const r = $('tShove').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await tch('touchStart', [{ x: kb[0], y: kb[1], id: 6 }]); for (let k = 1; k <= 4; k++) { await tch('touchMove', [{ x: kb[0] - k * 10, y: kb[1], id: 6 }]); await p.waitForTimeout(30); } await tch('touchEnd', []); await simWait(0.3);
    s = await p.evaluate(() => ({ m: W.p[0].melee, t: $('tShove').textContent }));
    check('iPad: a swipe on the melee key swaps to the shield (key says 盾)', s.m === 1 && /盾/.test(s.t), JSON.stringify(s));
    // grenade: tap = the biggest bunch; drag = ring; drag back = cancel
    await p.evaluate(() => { const me = W.p[0]; me.nades = 3; W.zs.length = 0; const add = (dx, dy) => { const z = spawnZombie('walker', 0); z.x = me.x + dx; z.y = me.y + dy; z.L = me.L; z.z = me.z; z.stun = 99; z.hp = z.max = 900; return z; };
      add(0, 4); for (const o of [[0, 0], [0.7, 0.3], [-0.6, 0.4], [0.2, -0.7]]) add(7 + o[0], o[1]); });
    const nb = await p.evaluate(() => { const r = $('tNade').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await tch('touchStart', [{ x: nb[0], y: nb[1], id: 4 }]); await p.waitForTimeout(60); await tch('touchEnd', []); await simWait(2.2);
    s = await p.evaluate(() => ({ n: W.p[0].nades, hp: W.zs.map(z => z.hp | 0) }));
    check('iPad: tapping 手雷 throws it at the biggest bunch (the 4, not the lone one)', s.n === 2 && s.hp.slice(1).every(h => h < 860) && s.hp[0] >= 885, JSON.stringify(s));
    await tch('touchStart', [{ x: nb[0], y: nb[1], id: 5 }]); for (let k = 1; k <= 6; k++) { await tch('touchMove', [{ x: nb[0] - k * 12, y: nb[1] - k * 6, id: 5 }]); await p.waitForTimeout(30); } await simWait(0.15);
    const ring = await p.evaluate(() => !!INP.nadePt);
    await tch('touchMove', [{ x: nb[0] + 2, y: nb[1] + 1, id: 5 }]); await p.waitForTimeout(40); await tch('touchEnd', []); await simWait(0.3);
    s = await p.evaluate(() => ({ n: W.p[0].nades, ring: !!INP.nadePt }));
    check('iPad: dragging 手雷 shows the landing ring; dragging back to the middle cancels', ring && s.n === 2 && !s.ring, JSON.stringify([ring, s]));
    check('iPad: no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
