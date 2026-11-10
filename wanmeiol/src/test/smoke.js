// node test/smoke.js — desktop smoke: title → create → first scenes → explore fights; screenshots to /tmp/claude-0/wmol
const { chromium } = require('playwright'); const fs = require('fs'); const D = '/tmp/claude-0/wmol'; fs.mkdirSync(D, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const vp = { width: +(process.env.W || 1440), height: +(process.env.H || 900) };
  const pg = await b.newPage({ viewport: vp }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.screenshot({ path: D + '/a_title.png' });
  await pg.click('text=创建角色'); await pg.fill('#nm', '叶凡'); await pg.screenshot({ path: D + '/b_create.png' }); await pg.click('text=进入大荒');
  await pg.waitForTimeout(1200); await pg.screenshot({ path: D + '/c_wake.png' });
  // click through dialogue manually for a few lines
  for (let i = 0; i < 40; i++) { const ch = await pg.$('#dlg .chb'); if (ch) await ch.click(); else if (await pg.$('#dlg.on')) await pg.click('#dlg'); else break; await pg.waitForTimeout(60); }
  await pg.waitForTimeout(500); await pg.screenshot({ path: D + '/d_after.png' });
  console.log(await pg.evaluate(() => ({ q: __dbg.curQ().id, loc: __dbg.C.loc, lv: __dbg.C.lv })));
  console.log('errors', errs.slice(0, 10)); await b.close(); })();
