// Hub round-trip: lobby card -> game -> back (title button and 2-tap menu button). Repo root on :8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(800);
  const link = await p.$('a[href*="prophunt"]'); console.log('card', !!link);
  await link.click(); await p.waitForFunction(() => window.__ready, null, { timeout: 10000 }); console.log('in game', p.url());
  await p.click('#hubBtn'); await p.waitForTimeout(800); console.log('back', p.url());
  await p.goto('http://localhost:8765/prophunt/'); await p.waitForFunction(() => window.__ready);
  await p.click('#soloBtn'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.click('#mHub'); console.log('armed', await p.textContent('#mHub')); await p.click('#mHub'); await p.waitForTimeout(800); console.log('back2', p.url());
  console.log('errs', errs); await b.close();
})();
