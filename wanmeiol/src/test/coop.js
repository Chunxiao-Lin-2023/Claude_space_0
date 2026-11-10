// node test/coop.js — needs `node test/peerserver.js` (port 9000) and the out/ server on 8770
const { chromium } = require('playwright');
const PJ = require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'), 'utf8');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [];
  const mk = async (name, cls) => { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.route(/unpkg\.com|jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: PJ })); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' })); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts/.test(m.text())) console.log(name, 'console', m.text()); });
    await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html?peerhost=127.0.0.1&peerport=9000'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
    await pg.click('text=创建角色'); await pg.click('.clsc >> nth=' + cls); await pg.fill('#nm', name); await pg.evaluate(() => { __dbg.auto = true; __dbg.noCD = true; }); await pg.click('text=进入大荒');
    await pg.waitForFunction(() => __dbg.curQ().id !== 'q_wake' && !__dbg.STATE.scene); await pg.evaluate(() => { __dbg.C.auto = true; SET.fast = true; __dbg.gainExp(300, true); }); return pg; };
  const H = await mk('房主', 0), G = await mk('客人', 2);
  await H.evaluate(() => __dbg.netHost()); await H.waitForFunction(() => __dbg.NET.code && __dbg.NETROLE === 'host', null, { timeout: 15000 }); const code = await H.evaluate(() => __dbg.NET.code); console.log('code', code);
  await G.evaluate(c => __dbg.netJoin(c), code); await G.waitForFunction(() => __dbg.NETROLE === 'guest' && Object.keys(__dbg.NET.roster).length === 2, null, { timeout: 15000 }); console.log('joined');
  // host walks: guest follows
  await G.evaluate(() => __dbg.go('sc_street', true, true)); await H.evaluate(() => __dbg.go('sc_street', true, true)); await H.waitForTimeout(500);
  await H.evaluate(() => __dbg.go('sc_gate')); await G.waitForFunction(() => __dbg.C.loc === 'sc_gate', null, { timeout: 5000 }); await H.evaluate(() => __dbg.go('fl_path')); await G.waitForFunction(() => __dbg.C.loc === 'fl_path', null, { timeout: 5000 }); console.log('follow ok');
  await H.waitForTimeout(400);
  const g0 = await G.evaluate(() => __dbg.C.exp + __dbg.C.lv * 1e6), h0 = await H.evaluate(() => __dbg.C.exp + __dbg.C.lv * 1e6);
  console.log('roster', JSON.stringify(await H.evaluate(() => Object.values(__dbg.NET.roster).map(p => [p.name, p.loc, p.busy, p.pid === __dbg.MYID()]))), await G.evaluate(() => JSON.stringify({ sc: __dbg.STATE.scene, b: !!__dbg.STATE.battle, d: __dbg.STATE.dungeon, busy: __dbg.STATE.busy })));
  // host starts a fight
  await H.evaluate(() => { __dbg.startBattle({ mobs: [['wolf', 2], ['boar', 1]], title: '联机测试' }); }); await H.waitForTimeout(300); console.log('host units', await H.evaluate(() => __dbg.STATE.battle && __dbg.STATE.battle.units.map(u => u.name + ':' + u.pid).join(',')), await H.evaluate(() => JSON.stringify(partnersHere().map(p=>p.name)))); await G.waitForFunction(() => !!__dbg.STATE.battle, null, { timeout: 5000 }); console.log('guest in battle');
  await H.waitForFunction(() => !__dbg.STATE.battle, null, { timeout: 60000 }); await G.waitForFunction(() => !__dbg.STATE.battle, null, { timeout: 60000 });
  const g1 = await G.evaluate(() => __dbg.C.exp + __dbg.C.lv * 1e6), h1 = await H.evaluate(() => __dbg.C.exp + __dbg.C.lv * 1e6); console.log('exp gain host', h1 - h0, 'guest', g1 - g0);
  // guest starts one → host runs it
  await H.waitForTimeout(500); await G.evaluate(() => { __dbg.startBattle({ mobs: [['boar', 1]], title: '客人发起' }); }); await H.waitForFunction(() => !!__dbg.STATE.battle, null, { timeout: 5000 }); console.log('host pulled into guest battle');
  await G.waitForFunction(() => !__dbg.STATE.battle, null, { timeout: 60000 }); await H.waitForFunction(() => !__dbg.STATE.battle, null, { timeout: 60000 });
  // chat
  await G.evaluate(() => __dbg.sendChat('world', '大家好，测试')); await H.waitForTimeout(800);
  const hc = await H.evaluate(() => __dbg.CHAT.world.filter(m => m.text === '大家好，测试').length), gc = await G.evaluate(() => __dbg.CHAT.world.filter(m => m.text === '大家好，测试').length); console.log('chat host', hc, 'guest', gc);
  await G.evaluate(() => __dbg.sendChat('party', '队伍消息')); await H.waitForTimeout(600); console.log('party', await H.evaluate(() => __dbg.CHAT.party.filter(m => m.text === '队伍消息').length), await G.evaluate(() => __dbg.CHAT.party.filter(m => m.text === '队伍消息').length));
  // gift
  await H.evaluate(() => { __dbg.addItem('elixir', 2, true); giftTo(Object.keys(__dbg.NET.roster).find(k => k !== __dbg.MYID()), 'item', 'elixir'); }); await G.waitForTimeout(800); console.log('gift', await G.evaluate(() => __dbg.C.bag.elixir || 0));
  // guest leaves
  await G.evaluate(() => netLeave()); await H.waitForTimeout(1500); console.log('roster after leave', await H.evaluate(() => Object.keys(__dbg.NET.roster).length));
  console.log('errors', errs.slice(0, 8)); await b.close(); process.exit(errs.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
