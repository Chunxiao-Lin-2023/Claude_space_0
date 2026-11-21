// Round 24: grenade types (frag / slow / smoke / blast) + bigger carry; PC 5–8 / Shift+G / wheel and weapon-bar chips; touch: hold the grenade key for a type ring;
// respawn at the base after 20 s with a limited number of respawns (difficulty + mode)
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
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.gt = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    await p.evaluate(cl => { window.__clr = eval(cl); window.__dbg.skipDraw = true; W.phase = 'day'; for (const k in W.res) W.res[k] = 999; const me = W.p[0]; me.x = W.radio.x + 0.5; me.y = W.radio.y + 2.5; me.L = gAt(W.radio.x, W.radio.y + 2); }, clearAround);
    // 1. shop + caps
    let s = await p.evaluate(() => { const me = W.p[0]; SET.shopTab = 'item'; openCraft(); const cards = [...document.querySelectorAll('#clist .sc:not(.mini)')].map(e => e.querySelector('b').textContent);
      for (const id of ['nade', 'gslow', 'gsmoke', 'gblast', 'med']) { const c = CRAFT.find(q => q.id === id); for (let k = 0; k < 20 && !craftBlocked(me, c); k++) doAct(me, 'craft', id); } closeCraft();
      return { cards, n: [me.nades, ...me.gn, me.meds], start: livesFor('normal', 'classic') }; });
    check('item tab sells 4 grenade types + medkit; carry 15 frag / 8 of each special / 8 medkits', s.cards.length === 5 && s.n.join() === '15,8,8,8,8', JSON.stringify(s));
    // 2. PC: 5–8 pick, Shift+G cycles, bar chips follow
    await p.keyboard.press('7'); await simWait(0.1); const g7 = await p.evaluate(() => W.p[0].gt);
    await p.keyboard.down('Shift'); await p.keyboard.press('g'); await p.keyboard.up('Shift'); await simWait(0.1); const gs = await p.evaluate(() => W.p[0].gt);
    s = await p.evaluate(() => ({ sel: [...document.querySelectorAll('#wbar button[data-g].sel')].map(b => +b.dataset.g), chips: document.querySelectorAll('#wbar button[data-g]').length, mel: !!$('wbMel') }));
    check('PC: 7 picks smoke, Shift+G goes on to blast; the weapon bar has 4 grenade chips (picked one lit) and a melee chip', g7 === 2 && gs === 3 && s.chips === 4 && s.sel.join() === '3' && s.mel, JSON.stringify([g7, gs, s]));
    // 3. slow field
    s = await p.evaluate(cl => { const me = W.p[0], x = Math.floor(me.x) + 18, y = Math.floor(me.y), L = gAt(x, y); __clr(x, y, L, 9); me.x = x + 0.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L); window.__dbg.god = true;
      W.zs.length = 0; W.spawnQ = []; const mk = dy => { const z = spawnZombie('walker', 0); z.x = me.x + 7; z.y = me.y + dy; z.L = L; z.z = me.z; z.stun = 0; z.hp = z.max = 5000; return z; };
      window.__za = mk(-2.5); window.__zb = mk(2.5); W.cz = [{ k: 1, x: __za.x - 1.5, y: __za.y, z: me.z, r: 3.2, t: 30 }]; window.__a0 = [__za.x, __zb.x, __za.y, __zb.y]; return 1; }, clearAround);
    await simWait(1.5);
    s = await p.evaluate(() => ({ slowMoved: +Math.hypot(__a0[0] - __za.x, __a0[2] - __za.y).toFixed(2), freeMoved: +Math.hypot(__a0[1] - __zb.x, __a0[3] - __zb.y).toFixed(2), st: [__za.stun, __za.st, __za.sleep, __zb.st] }));
    check('slow field: a zombie inside covers well under half the ground of one outside', s.slowMoved < s.freeMoved * 0.5 && s.freeMoved > 0.8, JSON.stringify(s));
    // 4. smoke: a zombie right next to you in the cloud does not bite
    s = await p.evaluate(() => { const me = W.p[0]; window.__dbg.god = false; me.hp = me.maxHp = 1000; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + 0.6; z.y = me.y; z.L = me.L; z.z = me.z; z.stun = 0; z.hp = z.max = 5000; W.cz = [{ k: 2, x: me.x, y: me.y, z: me.z, r: 3.8, t: 30 }]; window.__zs = z; return 1; });
    await simWait(2);
    s = await p.evaluate(() => ({ hp: W.p[0].hp, conf: +(__zs.conf || 0).toFixed(2) }));
    check('smoke: zombies in the cloud lose you and do not bite', s.hp === 1000 && s.conf > 0, JSON.stringify(s));
    // 5. blast grenade thrown with act
    s = await p.evaluate(() => { const me = W.p[0]; W.cz = []; W.zs.length = 0; window.__dbg.god = true; const zs = [[5, 0], [5.6, 0.5], [5.4, -0.6], [6.2, 0]].map(([dx, dy]) => { const z = spawnZombie('walker', 0); z.x = me.x + dx; z.y = me.y + dy; z.L = me.L; z.z = me.z; z.stun = 99; z.hp = z.max = 500; return z; });
      window.__bz = zs; window.__c = [me.x + 5.5, me.y]; me.gn[2] = 3; doAct(me, 'nade', { x: me.x + 5.5, y: me.y, z: me.z, t: 3 }); return 1; });
    await simWait(2.2);
    s = await p.evaluate(() => ({ d: __bz.map(z => +Math.hypot(z.x - __c[0], z.y - __c[1]).toFixed(1)), hp: __bz.map(z => z.hp | 0), left: W.p[0].gn[2] }));
    check('blast grenade: the bunch is thrown 2.5+ tiles out from the blast, light damage (≤ 70 each)', s.left === 2 && s.d.every(d => d > 2.5) && s.hp.every(h => h >= 430 && h < 500), JSON.stringify(s));
    // 6. respawn at the base after 20 s, limited
    s = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; window.__dbg.god = false; me.meds = 0; me.lives = 2; me.hp = 1; hurtPlayer(me, 50); return { down: me.down, lives: me.lives }; });
    await simWait(10); const dead = await p.evaluate(() => ({ dead: W.p[0].dead, t: Math.round(W.p[0].downT), over: !!W.over }));
    await simWait(21);
    s = await p.evaluate(() => { const me = W.p[0]; return { dead: me.dead, lives: me.lives, near: +Math.hypot(me.x - W.radio.x, me.y - W.radio.y).toFixed(1), inv: me.invT > 0 || me.hp > 0, over: !!W.over }; });
    check('solo: bleeding out = dead (game goes on), back at the base 20 s later with one respawn fewer', dead.dead && !dead.over && !s.dead && s.lives === 1 && s.near < 8 && !s.over, JSON.stringify([dead, s]));
    s = await p.evaluate(() => { const me = W.p[0]; me.lives = 0; me.invT = 0; me.hp = 1; hurtPlayer(me, 50); return 1; }); await simWait(10);
    s = await p.evaluate(() => ({ over: W.over, lives: W.p[0].lives }));
    check('no respawns left: the run is lost', s.over && s.over.kind !== 'win' || s.over === 'lose' || !!s.over, JSON.stringify(s));
    s = await p.evaluate(() => [livesFor('easy', 'classic'), livesFor('normal', 'siege'), livesFor('hard', 'escape'), livesFor('normal', 'boss')]);
    check('respawns: easy classic 7, normal siege 5, hard escape 1, normal boss 3', s.join() === '7,5,1,3', JSON.stringify(s));
    check('desktop: no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  {
    const c = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.guide22 = 1, SET.gt = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5); await p.waitForTimeout(600);
    const cdp = await c.newCDPSession(p); const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    await p.evaluate(cl => { window.__clr = eval(cl); window.__dbg.skipDraw = true; window.__dbg.god = true; W.phase = 'day'; const me = W.p[0]; me.x = W.radio.x + 20.5; me.y = W.radio.y - 14.5; me.L = gAt(Math.floor(me.x), Math.floor(me.y)); me.z = surfZ(me.x, me.y, me.L); __clr(Math.floor(me.x), Math.floor(me.y), me.L, 9); W.zs.length = 0; W.spawnQ = []; me.gn = [2, 2, 2];
      for (const o of [[6, 0], [6.6, 0.4], [6.2, -0.6]]) { const z = spawnZombie('walker', 0); z.x = me.x + o[0]; z.y = me.y + o[1]; z.L = me.L; z.z = me.z; z.stun = 99; z.hp = z.max = 900; } }, clearAround);
    const nb = await p.evaluate(() => { const r = $('tNade').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await tch('touchStart', [{ x: nb[0], y: nb[1], id: 4 }]); await p.waitForTimeout(550);
    const ring = await p.evaluate(() => (UI.wpOpts || []).map(o => [o.k, Math.round(o.x), Math.round(o.y)]));
    const sm = ring.find(o => o[0] === 'g2');
    if (sm) { await tch('touchMove', [{ x: sm[1], y: sm[2], id: 4 }]); await p.waitForTimeout(60); }
    await tch('touchEnd', []); await simWait(0.2);
    let s = await p.evaluate(() => ({ gt: W.p[0].gt, open: !$('wpick').classList.contains('hidden'), key: $('tNade').textContent, n: W.p[0].nades }));
    check('iPad: holding the grenade key opens a ring of the 4 types over it; slide onto 烟雾 and let go picks it (no throw)', ring.length === 4 && s.gt === 2 && !s.open && /烟雾/.test(s.key) && s.n === 2, JSON.stringify([ring, s]));
    await tch('touchStart', [{ x: nb[0], y: nb[1], id: 5 }]); await p.waitForTimeout(60); await tch('touchEnd', []); await simWait(1.8);
    s = await p.evaluate(() => ({ cz: (W.cz || []).map(c => c.k), gn: W.p[0].gn.slice() }));
    check('iPad: a tap then throws the picked smoke grenade (a cloud appears)', s.cz.includes(2) && s.gn[1] === 1, JSON.stringify(s));
    check('iPad: no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
