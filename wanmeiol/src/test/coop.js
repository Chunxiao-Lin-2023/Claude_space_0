// node test/coop.js — shared-screen co-op: guest mirrors the host, control can be handed over. Needs `node test/peerserver.js` (port 9000).
const { chromium } = require('playwright'); const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [];
  const mk = async name => { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html?peerhost=127.0.0.1&peerport=9000'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); return pg; };
  const H = await mk('host'), G = await mk('guest');
  await H.evaluate(() => { __dbg.instant = true; }); await H.click('text=开始'); await H.waitForSelector('#dlg.on');
  await H.evaluate(() => __dbg.netHost()); await H.waitForFunction(() => __dbg.NETROLE === 'host' && __dbg.NET.code, null, { timeout: 15000 }); const code = await H.evaluate(() => __dbg.NET.code);
  await G.fill('#tjoin', code); await G.click('text=加入'); await G.waitForFunction(() => __dbg.NETROLE === 'guest' && __dbg.C && __dbg.STATE.mode === 'play', null, { timeout: 15000 }); console.log('guest sees host game, quest', await G.evaluate(() => __dbg.curQ().id));
  // guest without control cannot advance the dialogue
  const t0 = await H.evaluate(() => __dbg.DLG && __dbg.DLG.o && __dbg.DLG.o.text); await G.click('#dlg'); await G.waitForTimeout(400); console.log('blocked while host controls:', t0 === await H.evaluate(() => __dbg.DLG && __dbg.DLG.o && __dbg.DLG.o.text));
  // guest takes control and clicks through the opening scene
  await G.evaluate(() => __dbg.takeControl()); await H.waitForFunction(() => __dbg.NET.ctrl !== 'host'); console.log('control handed to guest');
  for (let i = 0; i < 30; i++) { const ch = await G.$('#dlg .chb'); if (ch) await ch.click(); else if (await G.$('#dlg.on')) await G.click('#dlg'); else break; await G.waitForTimeout(120); }
  await H.waitForTimeout(400); console.log('host quest after guest clicked:', await H.evaluate(() => __dbg.curQ().id));
  // guest moves 石昊 (host state changes), host is blocked meanwhile
  await G.evaluate(() => document.querySelector('#acts .ab.dir').click()); await H.waitForTimeout(500); console.log('host loc after guest move:', await H.evaluate(() => __dbg.C.loc), 'guest sees', await G.evaluate(() => __dbg.C.loc));
  const loc0 = await H.evaluate(() => __dbg.C.loc); await H.evaluate(() => document.querySelector('#acts .ab.dir').click()); await H.waitForTimeout(300); console.log('host blocked while guest controls:', loc0 === await H.evaluate(() => __dbg.C.loc));
  // battle mirrored
  await H.evaluate(() => { __dbg.takeControl(); __dbg.go('dh_forest', true, true); __dbg.startBattle({ mobs: [['boar', 1]], title: '联机测试' }); }); await G.waitForFunction(() => !!__dbg.STATE.battle, null, { timeout: 5000 }); console.log('guest sees battle');
  await G.evaluate(() => __dbg.takeControl()); await H.waitForFunction(() => __dbg.NET.ctrl !== 'host'); await G.waitForTimeout(300);
  for (let i = 0; i < 20; i++) { if (!(await H.evaluate(() => !!__dbg.STATE.battle))) break; await G.evaluate(() => { const b = document.querySelector('#acts .skb:not([disabled])'); if (b) b.click(); }); await G.waitForTimeout(250); }
  console.log('battle finished by guest clicks:', !(await H.evaluate(() => !!__dbg.STATE.battle)));
  const hl = await H.evaluate(() => document.getElementById('log').children.length), gl = await G.evaluate(() => document.getElementById('log').children.length); console.log('log lines host/guest', hl, gl);
  await G.evaluate(() => netLeave()); await H.waitForTimeout(1200); console.log('host ctrl after guest left:', await H.evaluate(() => __dbg.NET.ctrl), 'guest back on title:', await G.evaluate(() => __dbg.STATE.mode));
  console.log('errors', errs.slice(0, 8)); await b.close(); process.exit(errs.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
