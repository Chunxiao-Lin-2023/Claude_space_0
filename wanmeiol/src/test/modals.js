// node test/modals.js — screenshots of each modal / panel on desktop and phone
const { chromium } = require('playwright'); const D = '/tmp/claude-0/wmol';
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const errs = [];
  for (const [k, w, h, t] of [['d', 1280, 800, 0], ['p', 393, 852, 1]]) { const ctx = await b.newContext(t ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true } : { viewport: { width: w, height: h } }); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
    await pg.click('text=创建角色'); await pg.fill('#nm', '石小凡'); await pg.evaluate(() => { __dbg.auto = true; }); await pg.click('text=进入大荒'); await pg.waitForTimeout(600);
    await pg.evaluate(() => { __dbg.auto = false; const C = __dbg.C; while (C.lv < 12) { if (C.lv === 9) __dbg.addItem('jinghua', 1, true); __dbg.gainExp(2000, true); __dbg.breakthrough(); } __dbg.addItem('stone', 20, true); __dbg.addItem('herb', 4, true); C.gold = 5000; for (let i = 0; i < 6; i++) C.gear.push(rollEquip(12, 1, 1)); C.daily.bounty[0].taken = true; C.story.f.city = 1; __dbg.go('bc_market', true, true); __dbg.joinGuild('g1'); });
    for (const m of ['sign', 'mail', 'rank', 'market', 'enhance', 'arena', 'bounty', 'coop', 'set', 'shop:smith', 'guild']) { await pg.evaluate(m => __dbg.openModal(m), m); await pg.waitForTimeout(150); await pg.screenshot({ path: `${D}/x_${k}_${m.replace(':', '_')}.png` }); }
    await pg.evaluate(() => __dbg.closeModal()); await pg.evaluate(() => { __dbg.npcTalk('smith'); }); await pg.waitForTimeout(300); await pg.screenshot({ path: `${D}/x_${k}_npc.png` });
    await pg.click('#dlg'); await pg.waitForTimeout(200); await pg.screenshot({ path: `${D}/x_${k}_npc2.png` });
    await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
