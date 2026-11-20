// Touch: a finger on the map aims (reticle above the finger, like the mouse: head / body / magnet) but does not fire;
// the fire button confirms. Fire button alone = auto-aim that needs a moment to lock on.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
const UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  for (const [vp, w, h] of [['ipad', 1180, 820], ['phoneP', 393, 852]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
    const cdp = await c.newCDPSession(p); const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const simWait = s => p.evaluate(s => new Promise(r => { const t0 = W.t; const f = () => W.t - t0 >= s ? r() : setTimeout(f, 30); f(); }), s);
    await p.evaluate(() => { window.__dbg.god = true; const me = W.p[0]; me.x = W.radio.x + 9.5; me.y = W.radio.y - 8.5; me.L = 0; me.wpn = 0;
      for (let y = -12; y <= 4; y++) for (let x = -6; x <= 8; x++) { const i = ci(Math.floor(me.x) + x, Math.floor(me.y) + y, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++;
      W.zs.length = 0; const cr = camRight(), cf = camFwd(); const z = spawnZombie('walker', 0); z.x = me.x + cr[0] * 2.5 + cf[0] * 3; z.y = me.y + cr[1] * 2.5 + cf[1] * 3; z.L = 0; z.z = 0; z.stun = 999; z.hp = z.max = 3000; CAM.lookX = CAM.lookY = 0; });
    await p.waitForTimeout(1500);
    const sp = fr => p.evaluate(fr => { const z = W.zs[0]; return w2s(z.x, z.y, z.z + z.h * fr); }, fr);
    const UP = await p.evaluate(() => FINGER_UP);
    let s = await sp(1.0); await tch('touchStart', [{ x: s[0], y: s[1] + 2 + UP, id: 3 }]); await simWait(0.15);
    for (let k = 0; k < 4; k++) { s = await sp(1.0); await tch('touchMove', [{ x: s[0], y: s[1] + 2 + UP, id: 3 }]); await p.waitForTimeout(300); }
    let r = await p.evaluate(() => ({ zb: !!(W.p[0].aimPt && W.p[0].aimPt.zb), head: !!(W.p[0].aimPt && W.p[0].aimPt.head), fire: W.p[0].inp.fire, ring: OBJ.lockI.count }));
    r.ret = await p.evaluate(() => document.getElementById('reticle').className + ' ' + document.getElementById('rtTag').textContent);
    check(vp + ' finger aims at its head (reticle above the finger) but does not fire', r.zb && r.head && r.fire === 0 && r.ring === 1 && !/hidden/.test(r.ret), JSON.stringify(r));
    const fb = await p.evaluate(() => { const r = document.getElementById('tFire').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    s = await sp(1.0); await tch('touchMove', [{ x: s[0], y: s[1] + 2 + UP, id: 3 }, { x: fb[0], y: fb[1], id: 4 }]); await tch('touchStart', [{ x: s[0], y: s[1] + 2 + UP, id: 3 }, { x: fb[0], y: fb[1], id: 4 }]);
    await simWait(1.2); const dmg = await p.evaluate(() => W.zs[0].max - W.zs[0].hp);
    check(vp + ' fire button confirms: headshots at the finger aim', dmg > 60 && await p.evaluate(() => W.p[0].aimPt && W.p[0].aimPt.head), 'dmg ' + dmg.toFixed(0));
    await tch('touchEnd', []); await p.waitForTimeout(300);
    s = await sp(1.0); await tch('touchStart', [{ x: s[0], y: s[1] + 2 + UP, id: 3 }]); await p.waitForTimeout(400);
    s = await sp(0.5); await tch('touchMove', [{ x: s[0] + 40, y: s[1] + UP, id: 3 }]); await p.waitForTimeout(400);
    r = await p.evaluate(() => ({ zb: !!(W.p[0].aimPt && W.p[0].aimPt.zb), mag: !!(W.p[0].aimPt && W.p[0].aimPt.mag) })); check(vp + ' finger 40 px beside it: pulled on (finger magnet)', r.zb && r.mag, JSON.stringify(r));
    await tch('touchMove', [{ x: s[0] + 160, y: s[1] - 60, id: 3 }]); await p.waitForTimeout(400);
    check(vp + ' finger dragged away: free aim follows', await p.evaluate(() => !(W.p[0].aimPt && W.p[0].aimPt.zb) && W.p[0].inp.fire === 0));
    await tch('touchEnd', []); await p.waitForTimeout(400); check(vp + ' release: reticle gone', await p.evaluate(() => document.getElementById('reticle').classList.contains('hidden')), await p.evaluate(() => JSON.stringify({t: INP.touch, a: INP.tAim.id, aim: INP.aim.id, mv: INP.move.id, tp: Object.keys(INP.tp), b: document.body.className})));
    // fire button alone: auto-aim locks on (grey ring) for ~0.3 s before the first shot, and the shots are flagged as looser
    const fb2 = await p.evaluate(() => { const r = document.getElementById('tFire').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    // tap to mark (round 20): a quick tap on the zombie marks it (cyan ring), then the fire button — same thumb — shoots it at once
    await p.evaluate(() => { INP.mark = null; W.p[0].mag[0] = 12; W.zs[0].hp = W.zs[0].max; window.__dbg.skipDraw = true; }); await p.waitForTimeout(400); /* fast frames so a quick tap is quick */
    s = await sp(0.6); await tch('touchStart', [{ x: s[0], y: s[1], id: 8 }]); await p.waitForTimeout(90); await tch('touchEnd', []); await p.waitForTimeout(250);
    let mk = await p.evaluate(() => ({ marked: INP.mark === W.zs[0], ring: INP.lockShow && INP.lockShow.zb === W.zs[0] ? 1 : 0, fire: W.p[0].inp.fire }));
    check(vp + ' a quick tap on a zombie marks it (ring shows) without shooting', mk.marked && mk.ring === 1 && mk.fire === 0, JSON.stringify(mk));
    await tch('touchStart', [{ x: fb2[0], y: fb2[1], id: 9 }]); await simWait(0.12); const m1 = await p.evaluate(() => ({ fire: W.p[0].inp.fire, auto: W.p[0].inp.auto })); await simWait(0.8); await tch('touchEnd', []);
    const md = await p.evaluate(() => W.zs[0].max - W.zs[0].hp);
    check(vp + ' then the fire button shoots the marked zombie straight away (no lock-on wait, normal spread)', m1.fire === 1 && !m1.auto && md > 30, JSON.stringify([m1, md]));
    // aim with the finger, lift it: that zombie stays marked
    await p.evaluate(() => { INP.mark = null; });
    s = await sp(1.0); await tch('touchStart', [{ x: s[0], y: s[1] + 2 + UP, id: 10 }]); await p.waitForTimeout(450); s = await sp(1.0); await tch('touchMove', [{ x: s[0] + 3, y: s[1] + 2 + UP, id: 10 }]); await p.waitForTimeout(300); await tch('touchEnd', []); await p.waitForTimeout(200);
    check(vp + ' aiming with the finger and lifting it leaves that zombie marked', await p.evaluate(() => INP.mark === W.zs[0]));
    // tap empty ground clears the mark
    const sg = await p.evaluate(() => { for (const [fx, fy] of [[0.6, 0.45], [0.7, 0.35], [0.55, 0.3], [0.65, 0.6], [0.75, 0.5]]) { const x = VW * fx, y = VH * fy; if (!nearUI(x, y) && !aimPick(x, y, 64).zb) return [x, y]; } return [VW * 0.6, VH * 0.4]; });
    await tch('touchStart', [{ x: sg[0], y: sg[1], id: 11 }]); await p.waitForTimeout(90); await tch('touchEnd', []); await p.waitForTimeout(200);
    check(vp + ' tapping empty ground clears the mark', await p.evaluate(() => INP.mark == null));
    await p.evaluate(() => { INP.mark = null; W.p[0].mag[0] = 12; window.__dbg.skipDraw = false; });
    await tch('touchStart', [{ x: fb2[0], y: fb2[1], id: 7 }]); await simWait(0.08);
    const a0 = await p.evaluate(() => ({ fire: W.p[0].inp.fire, acq: INP.lockAcq, lock: !!(W.p[0].aimPt && W.p[0].aimPt.zb) }));
    await simWait(0.6); const a1 = await p.evaluate(() => ({ fire: W.p[0].inp.fire, acq: INP.lockAcq, auto: W.p[0].inp.auto })); await tch('touchEnd', []);
    check(vp + ' auto-aim: holds fire while locking on, then shoots looser', a0.lock && a0.fire === 0 && a0.acq < 1 && a1.fire === 1 && a1.auto > 1, JSON.stringify([a0, a1]));
    // the move stick still works on the left, and two fingers still pinch
    await p.evaluate(() => { window.__dbg.skipDraw = true; }); await p.waitForTimeout(1500); const z0 = await p.evaluate(() => { INP.tp = {}; INP.tAim.id = null; INP.pinch = null; return CAM.zoom; }); const mx = w * 0.65, my = h * 0.55;
    await tch('touchStart', [{ x: mx, y: my, id: 5 }]); await p.waitForTimeout(60); await tch('touchStart', [{ x: mx, y: my, id: 5 }, { x: mx + 120, y: my, id: 6 }]);
    await tch('touchMove', [{ x: mx - 60, y: my, id: 5 }, { x: mx + 180, y: my, id: 6 }]); await p.waitForTimeout(300); await tch('touchEnd', []); await p.waitForTimeout(300);
    check(vp + ' two fingers on the right still pinch-zoom, no shooting left on', await p.evaluate(z0 => CAM.zoom < z0 * 0.8 && INP.tAim.id == null && W.p[0].inp.fire === 0, z0), 'zoom ' + z0.toFixed(1) + ' -> ' + (await p.evaluate(() => CAM.zoom)).toFixed(1));
    check(vp + ' no page errors', !errs.length, errs.join(' | ')); await c.close();
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
