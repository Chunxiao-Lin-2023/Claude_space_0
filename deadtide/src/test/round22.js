// Round 22: shop tabs (gun + ammo on one card), shield + jump pad, item bar (merged kinds, tap again = next material, ladders pick their own side),
// vehicles (default + T, cargo trike searches from the seat, armoured car), 装备 quick weapons; touch: one fire button + 4 keys, tap / long press / drag, weapon fan
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  // ---------------- desktop
  {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.quick = [], $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    await p.evaluate(() => { window.__dbg.skipDraw = true; const me = W.p[0]; me.x = W.radio.x + 0.5; me.y = W.radio.y + 2.5; me.L = gAt(W.radio.x, W.radio.y + 2); for (const k in W.res) W.res[k] = 999; });
    // shop
    let s = await p.evaluate(() => { openCraft(); const tabs = [...document.querySelectorAll('#ctabs button')].map(b => b.textContent), cards = document.querySelectorAll('#clist .sc').length;
      const shot = [...document.querySelectorAll('#clist .sc')][1].textContent; [...document.querySelectorAll('#clist button[data-c="rifle"]')][0].click(); return { tabs, cards, shot, rifle: W.p[0].owned[2] }; });
    check('shop has 4 tabs; the gun tab has one card per gun, ammo on the gun\'s card', s.tabs.length === 4 && s.cards === 9 && /霰弹/.test(s.shot) && /买霰弹/.test(s.shot), JSON.stringify(s).slice(0, 200));
    check('buying a gun from its card works', s.rifle === 1);
    s = await p.evaluate(() => { SET.shopTab = 'gun'; renderCraft(); document.querySelector('#clist button[data-c="shield"]').click(); SET.shopTab = 'item'; renderCraft(); const n = document.querySelectorAll('#clist .sc.mini').length;
      SET.shopTab = 'veh'; renderCraft(); document.querySelector('#clist button[data-c="cargo"]').click(); document.querySelector('#clist button[data-c="armor"]').click(); renderCraft();
      const def = document.querySelector('#clist button.vdef'); if (def) def.click(); return { shield: W.p[0].shield, items: n, vehs: W.p[0].vehs, veh: W.p[0].veh }; });
    check('gun tab: shield bought (round 23: a melee weapon); item tab no longer lists placeables (round 25)', s.shield === 1 && s.items === 0, JSON.stringify(s));
    check('vehicle tab: cargo + armour owned, default switchable', (s.vehs & 24) === 24 && s.veh >= 3, JSON.stringify(s));
    await p.evaluate(() => closeCraft());
    // kit / quick weapons
    s = await p.evaluate(() => { openKit(); document.querySelector('#kslots button[data-s="0"]').click(); document.querySelector('#kwpn button[data-w="2"]').click(); closeKit(); return { q: SET.quick.slice(), list: quickList(W.p[0]) }; });
    await p.keyboard.press('1'); await simWait(0.1); const w1 = await p.evaluate(() => W.p[0].wpn);
    await p.keyboard.press('z'); await simWait(0.1); const wz = await p.evaluate(() => W.p[0].wpn);
    check('装备: rifle into slot 1, key 1 takes it, Z flips back', s.q[0] === 2 && w1 === 2 && wz !== 2, JSON.stringify([s, w1, wz]));
    // item bar
    await p.keyboard.press('b'); await p.keyboard.press('1'); let a = await p.evaluate(() => W.p[0].sel); await p.keyboard.press('1'); let b2 = await p.evaluate(() => W.p[0].sel); await p.keyboard.press('1'); let c3 = await p.evaluate(() => W.p[0].sel);
    s = await p.evaluate(() => ({ slots: document.querySelectorAll('#bbar button[data-g]').length, chips: document.querySelectorAll('#bvar button').length, varShown: !$('bvar').classList.contains('hidden'), rot: !!$('bRot') }));
    check('item bar: 6 kinds (round 25); pressing the wall slot again goes wood -> brick -> steel; chips over the bar; no turn button', s.slots === 6 && a === 1 && b2 === 2 && c3 === 3 && s.chips === 6 && s.varShown && !s.rot, JSON.stringify([a, b2, c3, s]));
    // ladder picks the wall it can climb
    s = await p.evaluate(() => { const me = W.p[0], x = Math.floor(me.x) + 3, y = Math.floor(me.y), L = me.L;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { W.blk[ci(x + dx, y + dy, L)] = 0; W.blk[ci(x + dx, y + dy, L + 1)] = 0; W.slab[ci(x + dx, y + dy, L + 1)] = 0; }
      W.blk[ci(x + 1, y, L)] = 1; W.blk[ci(x - 1, y, L)] = 1; W.blk[ci(x - 1, y, L + 1)] = 1; W.ver++; // east wall has a top to stand on; west wall goes up two floors
      return [0, 1, 2, 3].map(pref => ladderDir(x, y, L, pref)); });
    check('a ladder hangs on the wall you can climb onto, whichever way you face', s.every(d => d === 0), JSON.stringify(s));
    await p.keyboard.press('b');
    // shield / armour
    s = await p.evaluate(() => { const me = W.p[0]; me.hp = 100; me.aim = 0; hurtPlayer(me, 20, { x: me.x + 1, y: me.y }); const front = 100 - me.hp, sh = me.shield; me.hp = 100; hurtPlayer(me, 20, { x: me.x - 1, y: me.y }); const back = 100 - me.hp;
      me.hp = 100; me.veh = 4; me.ride = true; hurtPlayer(me, 20); const arm = 100 - me.hp; me.ride = false; me.hp = 100; return { front, sh, back, arm }; });
    check('shield out: a hit from the front loses half, from behind full; armoured car takes 35%', Math.abs(s.front - 10) < 0.01 && s.sh === 1 && s.back === 20 && Math.abs(s.arm - 7) < 0.01, JSON.stringify(s));
    // armoured car rams
    s = await p.evaluate(async () => { const me = W.p[0]; W.zs.length = 0; W.spawnQ = []; const z = spawnZombie('walker', 0); z.x = me.x + 0.55; z.y = me.y; z.L = me.L; z.z = me.z; z.stun = 99; const h0 = z.hp;
      me.ride = true; me.veh = 4; me.vx = 4; me.vy = 0; stepActions(me, 0.016); me.ride = false; me.vx = 0; return { h0, h: z.hp }; });
    check('armoured car at speed hurts a zombie it runs into', s.h < s.h0, JSON.stringify(s));
    // cargo trike: search from the seat, 2 tiles away, half the time
    s = await p.evaluate(() => { const me = W.p[0], x = Math.floor(me.x) + 2, y = Math.floor(me.y); W.zs.length = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 3; dx++) if (W.blk[ci(Math.floor(me.x) + dx, y + dy, me.L)] && !B[W.blk[ci(Math.floor(me.x) + dx, y + dy, me.L)]].cost) W.blk[ci(Math.floor(me.x) + dx, y + dy, me.L)] = 0;
      W.blk[ci(x, y, me.L)] = 26; W.ver++; me.x = Math.floor(me.x) + 0.5; const foot = useTarget(me); me.ride = true; me.veh = 3; const seat = useTarget(me); me.ride = false; return { foot: !!foot, seat: seat && seat.k, t: seat && seat.t }; });
    check('cargo trike: reaches a crate 2 tiles off from the seat, in half the time', !s.foot && s.seat === 'spot' && Math.abs(s.t - BAL_SEARCH / 2) < 0.01 || (!s.foot && s.seat === 'spot' && s.t < 1), JSON.stringify(s));
    // T: default vehicle; Shift+T cycles
    s = await p.evaluate(() => { const me = W.p[0]; me.ride = false; me.veh = 3; rideKey(false); const on = me.ride && me.veh === 3; rideKey(true); const sw = me.veh; rideKey(false); return { on, sw, off: !me.ride }; });
    check('T gets on the default vehicle; Shift+T switches to the next one', s.on && s.sw === 4 && s.off, JSON.stringify(s));
    s = await p.evaluate(() => { const me = W.p[0]; me.veh = 4; me.ride = true; me.pass = 1; const f = pFlags(me); me.ride = false; me.pass = -1; return [(f >> 9) & 7, ((f >> 12) & 7) - 1, !!(f & 256)]; });
    check('net flags carry vehicle 4 and the pillion', s[0] === 4 && s[1] === 1 && s[2], JSON.stringify(s));
    // jump pad
    s = await p.evaluate(async () => { const me = W.p[0]; me.ride = false; me.build = false; W.zs.length = 0; const x = Math.floor(me.x), y = Math.floor(me.y), L = me.L;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 11; dx++) { W.blk[ci(x + dx, y + dy, L)] = 0; W.blk[ci(x + dx, y + dy, L + 1)] = 0; W.slab[ci(x + dx, y + dy, L + 1)] = 0; W.blk[ci(x + dx, y + dy, L + 2)] = 0; W.slab[ci(x + dx, y + dy, L + 2)] = 0; W.slab[ci(x + dx, y + dy, L + 3)] = 0; W.blk[ci(x + dx, y + dy, L + 3)] = 0; } W.ver++;
      W.blk[ci(x + 1, y, L)] = 56; W.blk[ci(x + 6, y, L)] = 2; W.ver++; recomputeStab(); // a one-floor brick block 5 tiles on: land on top of it
      const x0 = x + 0.5; window.__dbg.aimAt = () => ({ x: me.x + 5, y: me.y, z: me.z + 0.5 }); me.x = x + 1.5; me.y = y + 0.5; me.padCD = 0;
      await new Promise(r => { const t0 = W.t; const f = () => W.t - t0 > 2 ? r() : setTimeout(f, 16); f(); }); window.__dbg.aimAt = null;
      return { pad: W.blk[ci(x + 1, y, L)], dx: +(me.x - x0).toFixed(1), L: me.L, L0: L }; });
    check('a jump pad flings you onto the block 5 tiles on (one floor up) and is used up', s.pad === 0 && s.dx > 3.5 && s.L === s.L0 + 1, JSON.stringify(s));
    check('desktop: no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  // ---------------- iPad
  {
    const c = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.guide22 = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5); await p.waitForTimeout(900);
    const cdp = await c.newCDPSession(p); const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    let s = await p.evaluate(() => ({ guide: document.body.classList.contains('guide'), vis: ['tFire', 'tWpn', 'tNade', 'tShove', 'tUse', 'tReload', 'tJump'].map(id => { const r = $(id).getBoundingClientRect(); return r.width > 0; }), use: $('tUse').textContent }));
    check('iPad: the first game shows the guide bubbles', s.guide, JSON.stringify(s));
    check('iPad: fire + 4 keys (weapon, grenade, knife, context); reload / jump keys gone; context says 交互', s.vis.join() === 'true,true,true,true,true,false,false' && /交互/.test(s.use), JSON.stringify(s));
    await p.evaluate(() => { window.__dbg.skipDraw = true; window.__dbg.god = true; const me = W.p[0]; me.x = W.radio.x + 9.5; me.y = W.radio.y - 8.5; me.L = 0; me.owned[2] = 1; me.ammo[2] = 300; me.mag[2] = 30; doAct(me, 'wpn', 2);
      for (let y = -12; y <= 4; y++) for (let x = -6; x <= 8; x++) { const i = ci(Math.floor(me.x) + x, Math.floor(me.y) + y, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++;
      W.zs.length = 0; W.spawnQ = []; const z = spawnZombie('walker', 0); z.x = me.x + 3; z.y = me.y; z.L = 0; z.z = 0; z.stun = 999; z.hp = z.max = 5000; W.phase = 'day'; });
    const fb = await p.evaluate(() => { const r = $('tFire').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    const mag = () => p.evaluate(() => W.p[0].mag[2]);
    let m0 = await mag(); await tch('touchStart', [{ x: fb[0], y: fb[1], id: 1 }]); await p.waitForTimeout(90); await tch('touchEnd', []); await simWait(0.4); let m1 = await mag();
    check('fire: a quick tap = a single shot (or two)', m0 - m1 >= 1 && m0 - m1 <= 2, m0 + ' -> ' + m1);
    m0 = await mag(); await tch('touchStart', [{ x: fb[0], y: fb[1], id: 1 }]); await simWait(1.2); await tch('touchEnd', []); m1 = await mag();
    check('fire: a long press keeps shooting', m0 - m1 >= 4 || m1 > m0, m0 + ' -> ' + m1);
    await simWait(2.2); m0 = await mag(); await p.evaluate(() => { INP.mark = null; });
    const dv = await p.evaluate(() => { const me = W.p[0], z = W.zs[0], a = w2s(me.x, me.y, me.z), q = w2s(z.x, z.y, z.z); const d = Math.hypot(q[0] - a[0], q[1] - a[1]); return [(q[0] - a[0]) / d, (q[1] - a[1]) / d]; });
    await tch('touchStart', [{ x: fb[0], y: fb[1], id: 1 }]); for (let k = 1; k <= 5; k++) { await tch('touchMove', [{ x: fb[0] + dv[0] * k * 10, y: fb[1] + dv[1] * k * 10, id: 1 }]); await p.waitForTimeout(40); } await p.waitForTimeout(250); await tch('touchEnd', []); await simWait(0.3); m1 = await mag();
    s = await p.evaluate(() => !!(INP.mark && INP.mark.hp > 0));
    check('fire: drag then let go = only picks the target (marked), no shots', s && m1 === m0, JSON.stringify({ mark: s, m0, m1 }));
    // weapon key: drag out a fan, slide onto a gun, let go
    const wk = await p.evaluate(() => { const r = $('tWpn').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await tch('touchStart', [{ x: wk[0], y: wk[1], id: 2 }]); await tch('touchMove', [{ x: wk[0] - 30, y: wk[1] - 10, id: 2 }]); await p.waitForTimeout(120);
    const opt = await p.evaluate(() => { const o = UI.wpOpts.find(o => o.k === 0); return o ? [o.x, o.y, UI.wpOpts.length] : null; });
    await tch('touchMove', [{ x: opt[0], y: opt[1], id: 2 }]); await p.waitForTimeout(80); await tch('touchEnd', []); await simWait(0.2);
    s = await p.evaluate(() => ({ w: W.p[0].wpn, open: !$('wpick').classList.contains('hidden') }));
    check('weapon key: drag opens the gun menu; slide onto the pistol and let go switches to it', opt && opt[2] >= 3 && s.w === 0 && !s.open, JSON.stringify([opt, s]));
    await tch('touchStart', [{ x: wk[0], y: wk[1], id: 2 }]); await p.waitForTimeout(60); await tch('touchEnd', []); await simWait(0.2);
    check('weapon key: a tap goes to the next quick weapon', await p.evaluate(() => W.p[0].wpn !== 0));
    check('iPad: no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
const BAL_SEARCH = 1.5;
