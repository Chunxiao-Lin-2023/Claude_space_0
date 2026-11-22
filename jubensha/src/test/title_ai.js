// 标题画面 → 设置 → AI 玩家（Claude）能打开密钥面板（以前 G 为空时 modalHTML 直接返回空）
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../../index.html')); await p.waitForTimeout(800);
  await p.click('.tk-root button[aria-label="设置"]'); await p.waitForTimeout(300);
  await p.click('text=AI 玩家（Claude）'); await p.waitForTimeout(300);
  await p.fill('.mask input[type=password], .mask input[placeholder^="sk-ant"]', 'sk-ant-test123');
  await p.click('.mask button:has-text("保存密钥")'); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => ({ cfg: localStorage.getItem('hub.ai'), masks: document.querySelectorAll('.mask').length, txt: document.querySelector('.mask') && document.querySelector('.mask').innerText.slice(0, 60), tk: getComputedStyle(document.querySelector('.tk-root')).display })));
  await p.click('.mask button:has-text("✕")'); await p.waitForTimeout(200);
  console.log('after close: tk', await p.evaluate(() => getComputedStyle(document.querySelector('.tk-root')).display), 'masks', await p.evaluate(() => document.querySelectorAll('.mask').length));
  console.log(errs); await b.close(); })();
