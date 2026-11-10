const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8790/wanmeiol/'); await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/claude-0/wmol/cover_src.png' });
  console.log('hub btn', await pg.$$eval('.hub', x => x.length));
  await pg.goto('http://localhost:8790/'); await pg.waitForTimeout(800); const card = await pg.$('a[href*="wanmeiol"], [onclick*="wanmeiol"]'); console.log('card', !!card);
  await pg.click('.hub').catch(() => {}); 
  await pg.goto('http://localhost:8790/wanmeiol/'); await pg.waitForTimeout(500); await pg.click('.hub'); await pg.click('.hub'); await pg.waitForTimeout(800); console.log('after hub', pg.url());
  console.log(errs); await b.close(); })();
