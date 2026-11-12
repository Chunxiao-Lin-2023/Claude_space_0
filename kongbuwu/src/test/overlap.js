// node test/overlap.js [视口,…] — 鬼屋地图各画面（布置/选机关/开门/收工/追逐）在 6 种屏幕上互相盖住或出屏就报出来
const { chromium } = require('playwright');
const VPS = { phoneP: [393, 852, 1], se: [375, 667, 1], phoneL: [852, 393, 1], ipadL: [1180, 820, 1], ipadP: [820, 1180, 1], desk: [1280, 800, 0] };
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const out = [];
  for (const k of (process.argv[2] || Object.keys(VPS).join(',')).split(',')) { const [w, h, t] = VPS[k]; const ctx = await b.newContext(t ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true } : { viewport: { width: w, height: h } }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
    const check = async tag => { await pg.waitForTimeout(500); await pg.screenshot({ path: `/tmp/kbw/ov_${k}_${tag}.png` }); const r = await pg.evaluate(() => { const sel = ['#top', '#nav', '.hs-top', '#hsroom', '#hsmm', '#hstick', '.hs-bot', '#hsset:not(.picking) .hs-st', '.hs-sb', '#hspick.on', '.hs-end', '#toast.on', '#hspause', '#hcv'];
        const E = sel.map(s => [s, document.querySelector(s)]).filter(([s, e]) => e && e.offsetParent !== null && e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== 'hidden').map(([s, e]) => [s, e.getBoundingClientRect()]); const bad = [];
        for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { if ([E[i][0], E[j][0]].includes('#hcv') && [E[i][0], E[j][0]].some(q => ['#hsroom', '#hsmm', '#hstick', '.hs-end', '#toast.on', '#hspause', '#hspick.on'].includes(q))) continue; const a = E[i][1], c = E[j][1]; const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ox > 2 && oy > 2) bad.push(E[i][0] + '×' + E[j][0] + ' ' + Math.round(ox) + 'x' + Math.round(oy)); }
        const vw = innerWidth, vh = innerHeight; for (const [s, r] of E) if (r.right > vw + 1 || r.bottom > vh + 1 || r.left < -1 || r.top < -1) bad.push(s + ' 出屏'); return bad; }); if (r.length) out.push(k + ' ' + tag + ': ' + r.join('; ')); };
    await pg.evaluate(() => { const D = __dbg; D.SET.snd = 0; D.SET.mus = 0; D.slotNew(1); D.STATE.run++; D.STATE.scene = false; D.jumpTo(4); const C = D.C; C.seen.tuth = 1; C.seen.tutc = 1; C.tick = 0; D.go('hh_door', true, true); C.hh.scenes = ['zombie', 'mh', 'ws', 'room', 'my', 'ward']; D.STATE.scene = false; window.__r = D.receive('my'); });
    await pg.waitForFunction(() => !!document.querySelector('#hsset .hs-sb')); await check('setup');
    await pg.evaluate(() => { const H = __dbg.HS; __dbg.hsPickSlot(H, H.M.slots[2], 0); }); await check('pick');
    await pg.evaluate(() => { hsPickClose(); __dbg.hsOpen(); __dbg.hsAuto(); }); await pg.waitForTimeout(5000); await check('live');
    await pg.evaluate(() => { const H = __dbg.HS; H.auto = true; while (!H.done) __dbg.hStep(H, .1); }); await pg.waitForTimeout(1800); await check('end'); await pg.evaluate(() => __dbg.hsClose());
    await pg.evaluate(() => { window.__c = __dbg.chaseRun(__dbg.HCHASE.dean); }); await pg.waitForTimeout(1500); await check('chase');
    if (errs.length) out.push(k + ' errors ' + errs.join(' | ')); await ctx.close(); }
  console.log(out.join('\n') || 'no overlaps'); await b.close(); })();
