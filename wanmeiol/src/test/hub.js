// node test/hub.js — needs `python3 -m http.server 8790` in the repo root: cover shot, hub card, ‹ 游戏厅 button
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8790/wanmeiol/'); await pg.waitForTimeout(800); await pg.evaluate(() => document.querySelector('.hub').style.display = 'none'); await pg.screenshot({ path: '/tmp/claude-0/wmol/cover_src.png' });
  await pg.evaluate(() => document.querySelector('.hub').style.display = ''); await pg.click('.hub'); await pg.click('.hub'); await pg.waitForTimeout(800); console.log('after hub', pg.url());
  console.log('card', !!(await pg.$('[href*="wanmeiol"], [onclick*="wanmeiol"]'))); console.log(errs); await b.close(); })();
