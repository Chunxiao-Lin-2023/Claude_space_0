// Round 42b: accepting a partner's fusion request — the 同意合体 card (desktop click / iPad tap), 不了, the glowing weapon key, J, 8 s timeout
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
    if (touch) { await S(() => setTouch(true)); await wait(0.3); }
    await S(() => { W.bps = []; });
    // ---- co-op: a partner in a mech next to you
    await S(() => { const me = W.p[ME], q = mkPlayer(1, '小青'); W.p.push(q); Object.assign(q, { x: me.x + 1.5, y: me.y, L: me.L, z: me.z, vehs: 126, veh: 2, ride: true, mform: 1, mtr: 0, mh: [], bat: 120, mcd: 0, gcd: 0, evoOn: false, aim: 0 }); q.rx = q.x; q.ry = q.y; me.mcd = 0; });
    await wait(0.2);
    const ask = async () => { await S(() => { W.fusReq = null; }); await clr(); await S(() => doAct(W.p[1], 'fuse')); await wait(0.3); };
    const vis = () => S(() => !$('fusAsk').classList.contains('hidden'));
    const clickSel = async sel => { if (touch) await tap(sel); else { const [x, y] = await ctr(sel); await p.mouse.click(x, y); await wait(0.2); } };
    await ask(); check(D + 'request shows the accept card', await vis(), await lbl('#fusAsk'));
    if (touch) check(D + 'weapon key glows and says 同意', /^同意/.test(await lbl('#tWpn')) && await S(() => $('tWpn').classList.contains('hot')), await lbl('#tWpn'));
    await S(() => { window.__dbg.skipDraw = false; }); await wait(1.5); await p.screenshot({ path: '/tmp/accept42b_' + dev + '.png' }); await S(() => { window.__dbg.skipDraw = true; });
    // 不了: the asker hears it, the card closes, no fusion
    await clickSel('#fusNo'); await wait(0.2);
    check(D + '不了 declines: card gone, request cleared, partner told', !(await vis()) && await S(() => !W.fusReq) && (await ev('deny')).some(e => e.p === 1 && /拒绝/.test(e.why)) && !(await fus()), [await vis(), await S(() => W.fusReq), await ev('deny'), await S(() => { const r = $('fusNo').getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && (e.id || e.className); })]);
    // the card's 同意合体
    await ask(); await clickSel('#fusYes'); await wait(0.3); let F = await fus(); check(D + 'card 同意合体 fuses (partner drives)', F && !F.v && F.d === 1, F);
    check(D + 'card hides once fused', !(await vis()));
    await S(() => { fuseSplit(W.fus, 'x'); W.p.forEach(q => { q.mtr = 0; q.mcd = 0; }); }); await wait(0.6);
    // and still: the weapon key on iPad / J on desktop
    await ask(); if (touch) await tap('#tWpn'); else await p.keyboard.press('j'); await wait(0.3); F = await fus(); check(D + (touch ? 'glowing weapon key' : 'J') + ' also agrees', F && !F.v && F.d === 1, F);
    // the card times out after 8 s
    await S(() => { fuseSplit(W.fus, 'x'); W.p.forEach(q => { q.mtr = 0; q.mcd = 0; }); }); await wait(0.6); await ask(); await S(() => { UI.fusAsk -= 8.1; }); await p.waitForTimeout(200); check(D + 'card disappears after 8 s', !(await vis()));
    check(D + 'no errors', !errs.length, errs);
    await c.close();
  }
  await b.close(); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
})();
