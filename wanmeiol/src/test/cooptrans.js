// node test/cooptrans.js — the host's transition card shows on the guest's screen too (59_trans.js ptrDo → 'ptr' message). Needs `node test/peerserver.js` (port 9000) + serve.js on 8770.
const { chromium } = require('playwright'); const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [];
  const mk = async name => { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message));
    await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html?peerhost=127.0.0.1&peerport=9000'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); return pg; };
  const H = await mk('host'), G = await mk('guest');
  await H.evaluate(() => { __dbg.instant = true; __dbg.auto = true; }); await H.click('text=开始'); await H.waitForTimeout(300);
  await H.evaluate(async () => { __dbg.dlgPick(-1); for (let i = 0; i < 600 && (__dbg.STATE.scene || __dbg.STATE.battle); i++) await new Promise(r => setTimeout(r, 20)); const c = __dbg.C; c.story.q = __dbg.MAIN.findIndex(q => q.id === 'q_end'); __dbg.go('sc_street', true, true); __dbg.netHost(); });
  await H.waitForFunction(() => __dbg.NETROLE === 'host' && __dbg.NET.code, null, { timeout: 15000 }); const code = await H.evaluate(() => __dbg.NET.code);
  await G.fill('#tjoin', code); await G.click('text=加入'); await G.waitForFunction(() => __dbg.NETROLE === 'guest' && __dbg.C && __dbg.STATE.mode === 'play', null, { timeout: 15000 }); await G.waitForTimeout(500);
  await G.evaluate(() => { __dbg.trans = true; }); await H.evaluate(() => { __dbg.instant = false; __dbg.trans = true; goT('sc_gate'); });
  await G.waitForTimeout(700); const g = await G.evaluate(() => { const e = document.getElementById('ptr'); return e && { cls: e.className, t: e.querySelector('.pt-t').textContent }; });
  await G.waitForTimeout(1500); const g2 = await G.evaluate(() => ({ cls: document.getElementById('ptr').className, loc: __dbg.C.loc }));
  const res = { guestSeesCard: !!g && /on/.test(g.cls) && g.t === '村口', guestCardCloses: g2.cls === '' && g2.loc === 'sc_gate', noErrors: errs.length === 0 };
  let fail = 0; for (const [k, v] of Object.entries(res)) { console.log((v ? 'OK  ' : 'FAIL') + ' ' + k); if (!v) fail++; } if (errs.length) console.log(errs); await b.close(); process.exit(fail ? 1 : 0); })();
