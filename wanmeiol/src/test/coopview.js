// node test/coopview.js — co-op 跟随画面: the watcher's pages / tabs / pop-ups / scroll follow the player in control; following can be switched off
const { chromium } = require('playwright');
const URL = 'http://localhost:8770/index.html?peerhost=localhost&peerport=9000';
(async () => { const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [], out = [];
  const mk = async (vp, mob) => { const ctx = await b.newContext(Object.assign({ viewport: vp }, mob ? { isMobile: true, hasTouch: true } : {})); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message)); await pg.route(/unpkg|jsdelivr/, r => r.fulfill({ path: require.resolve('peerjs/dist/peerjs.min.js') })); await pg.goto(URL); await pg.waitForTimeout(600); return pg; };
  const H = await mk({ width: 1280, height: 800 }), G = await mk({ width: 390, height: 844 }, 1);
  await H.click('text=开始'); await H.waitForTimeout(1000); for (let i = 0; i < 200; i++) { const busy = await H.evaluate(() => { if (DLG && !DLG.choice) { if (UI.tw) UI.tw.done = 1; dlgPick(-1); } else if (DLG && DLG.choice) dlgPick(0); return !!(STATE.scene || DLG); }); if (!busy) break; await H.waitForTimeout(150); }
  await H.evaluate(() => { C.arena = C.arena || {}; }); await H.evaluate(() => netHost()); await H.waitForFunction(() => NETROLE === 'host' && NET.peer.open); const code = await H.evaluate(() => NET.code); await H.evaluate(() => closeModal());
  await G.fill('#tjoin', code); await G.click('button:has-text("加入")'); await G.waitForFunction(() => NETROLE === 'guest' && C); await G.waitForTimeout(800);
  const gv = () => G.evaluate(() => ({ nav: UI.nav, bag: UI.bagTab, modal: UI.modal, sheet: !!document.querySelector('#sheet') && getComputedStyle(document.querySelector('#sheet')).display !== 'none', title: (document.querySelector('#sht') || {}).textContent, sy: Math.round(($('sbody').scrollTop / Math.max(1, $('sbody').scrollHeight - $('sbody').clientHeight)) * 100) }));
  const step = async (name, fn, wait = 500) => { await H.evaluate(fn); await G.waitForTimeout(wait); out.push(name + ' → 队友: ' + JSON.stringify(await gv())); };
  await step('房主打开「石昊」', () => navTo('hero'));
  await step('房主滚到页面中间', () => { const s = $('sbody'); s.scrollTop = (s.scrollHeight - s.clientHeight) / 2; s.dispatchEvent(new Event('scroll')); });
  await step('房主打开「背包」·商店', () => { UI.bagTab = 'shop'; navTo('bag'); });
  await step('房主打开「地图」', () => navTo('map'));
  await step('房主关掉页面', () => navTo('adv'));
  await step('房主打开虚神界弹窗', () => openModal('arena'));
  await step('房主关掉弹窗', () => closeModal());
  await G.evaluate(() => toggleFollow()); await G.evaluate(() => closeModal());
  await step('（队友关了跟随）房主打开「石昊」', () => navTo('hero'));
  await G.evaluate(() => toggleFollow()); await G.evaluate(() => { closeModal(); takeControl(); }); await G.waitForTimeout(800);
  await G.evaluate(() => navTo('bag')); await H.waitForTimeout(600); out.push('队友接手后打开「背包」 → 房主: ' + JSON.stringify(await H.evaluate(() => ({ nav: UI.nav, title: (document.querySelector('#sht') || {}).textContent }))));
  await G.screenshot({ path: '/tmp/claude-0/wmol/view_guest.png' });
  console.log(out.join('\n')); console.log('errors', errs); await b.close(); })();
