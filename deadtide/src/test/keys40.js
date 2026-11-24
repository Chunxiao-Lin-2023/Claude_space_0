// Round 40e: every new key works on a desktop (keyboard + mouse) and on an iPad (touch): capsule fusion, co-op fusion, skill, swap, split, the 蓝图 tab
const { chromium } = require('playwright');
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v)); if (!c) ok = false; };
  for (const dev of ['desktop', 'ipad']) {
    const touch = dev === 'ipad';
    const c = await b.newContext(touch ? { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, userAgent: IPAD } : { viewport: { width: 1280, height: 800 } });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
    const S = (fn, a) => p.evaluate(fn, a);
    const wait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 20); f(); }), s);
    await S(() => { window.__dbg.skipDraw = true; window.__dbg.god = true; W.clock = 999; W.strayT = 1e9; W.phase = 'day'; W.zs.length = 0; W.spawnQ = [];
      const R = W.radio; let o = null; for (let r = 4; r < 60 && !o; r++) for (let k = 0; k < 64 && !o; k++) { const a = k / 64 * 6.28, x = Math.floor(R.x + Math.cos(a) * r), y = Math.floor(R.y + Math.sin(a) * r); if (!inMap(x, y)) continue; let clear = true; for (let dy = -3; dy <= 3 && clear; dy++) for (let dx = -3; dx <= 3; dx++) if (!inMap(x + dx, y + dy) || skyTop(x + dx, y + dy) > gAt(x + dx, y + dy) || W.blk[ci(x + dx, y + dy, gAt(x + dx, y + dy))]) { clear = false; break; } if (clear) o = { x: x + 0.5, y: y + 0.5, L: gAt(x, y) }; }
      const me = W.p[ME]; Object.assign(me, { x: o.x, y: o.y, L: o.L, vehs: 126, veh: 4, ride: true, mform: 1, mtr: 0, mh: [], bat: 120, mcd: 0, gcd: 0, evoOn: false }); me.z = pZ(me); me.rx = me.x; me.ry = me.y; window.__o = o;
      window.__ev = []; const f0 = window.fxEvent; window.fxEvent = e => { window.__ev.push(e); return f0(e); }; W.bps = ['c2', 'c5']; });
    await wait(0.3);
    const ev = k => S(k => window.__ev.filter(e => e.k === k), k), clr = () => S(() => { window.__ev.length = 0; });
    const fus = () => S(() => W.fus ? { v: W.fus.v || 0, kp: W.fus.kp, d: W.fus.d } : null);
    const keysTxt = () => S(() => { uiKeys(W.p[ME]); return $('keys').innerText.replace(/\s+/g, ' '); });
    const lbl = id => S(id => document.querySelector(id).innerText.replace(/\s+/g, ' ').trim(), id);
    const cdp = touch ? await c.newCDPSession(p) : null;
    const ctr = sel => S(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
    const tap = async (sel, hold) => { const [x, y] = await ctr(sel); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); if (hold) await wait(hold); else await p.waitForTimeout(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(0.15); };
    const D = dev + ': ';
    // ---- solo, two capsules
    if (!touch) { const t = await keysTxt(); check(D + 'in a mech the hints show the mech keys (attack, skill, capsule) and not the gun / grenade / knife ones', /J 合体胶囊：赤刃（共 2 个）/.test(t) && /左键 铁卫攻击/.test(t) && !/换弹|快捷武器|刀 \/ V/.test(t), t); }
    else { await S(() => setTouch(true)); await wait(0.3); check(D + 'weapon key offers the capsule, transform key says 变回, skill key shows the mech skill', (await lbl('#tWpn')) === '合体 胶囊×2' && /^变回/.test(await lbl('#tShove')) && /掀地/.test(await lbl('#tNade')), [await lbl('#tWpn'), await lbl('#tShove'), await lbl('#tNade')]); }
    if (touch) await tap('#tWpn'); else { await p.keyboard.press('j'); await wait(0.2); }
    let F = await fus(); check(D + (touch ? 'tap 合体' : 'J') + ' uses the first capsule (赤刃)', F && F.v === 1 && F.kp === 2, F);
    if (!touch) { const t = await keysTxt(); check(D + 'fused hints: fire = both attacks, G = combined skill, X / J = split, each key once', /左键 铁卫 \+ 赤刃 一起打/.test(t) && /G 合体技/.test(t) && /X \/ J 解除合体/.test(t) && !/K 换手|变回载具/.test(t) && (t.match(/ G /g) || []).length === 1, t); }
    else check(D + 'fused labels: weapon key 解除 + time left, transform key 解除合体, skill key 合体技 ✓', /^解除 剩 4\ds$/.test(await lbl('#tWpn')) && (await lbl('#tShove')) === '解除合体' && /^合体技/.test(await lbl('#tNade')), [await lbl('#tWpn'), await lbl('#tShove'), await lbl('#tNade')]);
    // fire: both the body and the module swing
    await clr(); if (touch) await tap('#tFire', 1.2); else { await p.mouse.move(640, 300); await p.mouse.down(); await wait(1.2); await p.mouse.up(); }
    let mp = await ev('mpunch'); check(D + 'holding fire swings the body and the module together', mp.some(e => e.fm === 1) && mp.some(e => !e.fm), mp.map(e => e.fm).join(''));
    await clr(); await wait(0.5); mp = await ev('mpunch'); check(D + 'not firing: the module stays still (no AI)', !mp.length, mp.length);
    // skill
    await clr(); if (touch) await tap('#tNade'); else { await p.keyboard.down('g'); await wait(0.25); await p.keyboard.up('g'); } await wait(0.3);
    check(D + (touch ? 'tap the skill key' : 'G') + ' fires the combined skill', (await ev('fskill')).length === 1, (await ev('deny')).map(e => e.why).join('|'));
    if (touch) { await tap('#tNade', 0.7); check(D + 'holding the skill key in a mech does not open the grenade wheel', await S(() => $('wpick').classList.contains('hidden'))); }
    else { await clr(); await p.keyboard.press('k'); await wait(0.15); check(D + 'K alone is refused with a reason', (await ev('deny')).some(e => /一个人/.test(e.why))); }
    // split with the transform key / X
    if (touch) await tap('#tShove'); else { await p.keyboard.press('x'); } await wait(0.6);
    check(D + (touch ? 'tap 解除合体' : 'X') + ' splits (and does not turn the mech back into a vehicle)', !(await fus()) && await S(() => inMech(W.p[ME])), await S(() => [W.p[ME].mform, W.p[ME].mtr]));
    await S(() => { W.p[ME].mcd = 0; W.p[ME].mtr = 0; }); await wait(0.2);
    if (touch) await tap('#tWpn'); else { await p.keyboard.press('j'); await wait(0.2); } F = await fus(); check(D + 'the second capsule (苍隼)', F && F.kp === 5, F);
    if (touch) await tap('#tWpn'); else { await p.keyboard.press('j'); await wait(0.2); } check(D + (touch ? 'tap 解除' : 'J again') + ' splits', !(await fus()));
    if (!touch) { const t = await keysTxt(); check(D + 'no capsules left and alone: no J hint', !/合体/.test(t), t); }
    else { await wait(0.2); check(D + 'no capsules left and alone: the weapon key is the weapon again', !/合体|胶囊/.test(await lbl('#tWpn')), await lbl('#tWpn')); }
    // ---- co-op: a partner in a mech next to you
    await S(() => { const me = W.p[ME], q = mkPlayer(1, '小青'); W.p.push(q); Object.assign(q, { x: me.x + 1.5, y: me.y, L: me.L, z: me.z, vehs: 126, veh: 2, ride: true, mform: 1, mtr: 0, mh: [], bat: 120, mcd: 0, gcd: 0, evoOn: false, aim: 0 }); q.rx = q.x; q.ry = q.y; me.mcd = 0; });
    await wait(0.2);
    if (!touch) check(D + 'with a partner close: J 请求合体', /J 请求合体/.test(await keysTxt()), await keysTxt()); else check(D + 'with a partner close: the weapon key says 合体', /^合体/.test(await lbl('#tWpn')), await lbl('#tWpn'));
    if (touch) await tap('#tWpn'); else { await p.keyboard.press('j'); await wait(0.2); }
    check(D + 'asking sends a request', await S(() => !!W.fusReq && W.fusReq.from === ME));
    await S(() => doAct(W.p[1], 'fuse')); await wait(0.2); F = await fus(); check(D + 'partner agrees: fused, you drive', F && !F.v && F.d === 0, F);
    if (!touch) { const t = await keysTxt(); check(D + 'driver hints: K swap, G greyed (the gunner fires it)', /K 换手（现在是驾驶）/.test(t) && /G 合体技归炮手/.test(t), t); }
    else check(D + 'driver labels: weapon key 换手 / 驾驶, skill key greyed (炮手)', (await lbl('#tWpn')) === '换手 驾驶' && /炮手/.test(await lbl('#tNade')) && await S(() => $('tNade').classList.contains('empty')), [await lbl('#tWpn'), await lbl('#tNade')]);
    await clr(); if (touch) await tap('#tNade'); else { await p.keyboard.down('g'); await wait(0.25); await p.keyboard.up('g'); } await wait(0.2);
    check(D + 'the driver\'s skill key is refused with a reason', (await ev('deny')).some(e => /炮手/.test(e.why)) && !(await ev('fskill')).length);
    if (touch) await tap('#tWpn'); else { await p.keyboard.press('k'); await wait(0.2); } F = await fus(); check(D + (touch ? 'tap 换手' : 'K') + ' swaps: you are the gunner', F && F.d === 1, F);
    await clr(); if (touch) await tap('#tNade'); else { await p.keyboard.down('g'); await wait(0.25); await p.keyboard.up('g'); } await wait(0.3);
    check(D + 'the gunner fires the combined skill', (await ev('fskill')).length === 1, (await ev('deny')).map(e => e.why).join('|'));
    if (touch) await tap('#tShove'); else await p.keyboard.press('x'); await wait(0.6); check(D + 'split', !(await fus()));
    // the 蓝图 tab in the shop
    await S(() => { renderCraft(); $('craft').classList.remove('hidden'); }); const [bx, by] = await ctr('#ctabs button[data-t="bp"]');
    if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bx, y: by, id: 2 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); } else await p.mouse.click(bx, by);
    await p.waitForTimeout(200); check(D + 'the shop\'s 蓝图 tab opens the blueprint book', await S(() => !!document.querySelector('#clist .bpbook') && /蓝图收集/.test($('clist').innerText)));
    await S(() => { SET.shopTab = 'gun'; $('craft').classList.add('hidden'); });
    check(D + 'no page errors', !errs.length, errs.join(' | '));
    await c.close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})();
