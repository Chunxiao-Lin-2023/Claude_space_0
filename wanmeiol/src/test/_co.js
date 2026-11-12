const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.route(/unpkg|jsdelivr/, r => r.fulfill({ path: require.resolve('peerjs/dist/peerjs.min.js') }));
  await pg.goto('http://localhost:8770/index.html?peerhost=localhost&peerport=9000'); await pg.waitForTimeout(800); await pg.click('text=开始'); await pg.waitForTimeout(1500);
  for (let i = 0; i < 20; i++) { const d = await pg.$('#dlg .tx'); if (!d) break; await pg.keyboard.press('Enter'); await pg.waitForTimeout(150); }
  await pg.click('#top .tb[title], #top button:has-text("🔗")').catch(e => errs.push('no 🔗: ' + e.message.slice(0, 80)));
  await pg.waitForTimeout(500); await pg.click('button:has-text("开房间")').catch(e => errs.push('no 开房间 ' + e.message.slice(0, 80))); await pg.waitForTimeout(3000);
  console.log(await pg.evaluate(() => document.querySelector('.modal, #modal')?.innerText.slice(0, 300))); console.log(errs, await pg.evaluate(() => [NETROLE, NET.code, NET.status, !!window.Peer])); await pg.screenshot({ path: '/tmp/claude-0/wmol/co.png' }); await b.close(); })();
