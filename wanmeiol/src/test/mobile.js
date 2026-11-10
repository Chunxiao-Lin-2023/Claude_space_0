// node test/mobile.js [names] — screenshots every key screen at phone / iPad / desktop sizes into /tmp/claude-0/wmol/m_*
const { chromium } = require('playwright'); const D = '/tmp/claude-0/wmol';
const VPS = { phoneP: [393, 852, 1], se: [375, 667, 1], phoneL: [852, 393, 1], seL: [667, 375, 1], ipadL: [1180, 820, 1], ipadP: [820, 1180, 1], desk: [1280, 800, 0] };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const want = (process.argv[2] || Object.keys(VPS).join(',')).split(','); const errs = [];
  for (const k of want) { const [w, h, t] = VPS[k]; const ctx = await b.newContext(t ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA } : { viewport: { width: w, height: h } });
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(k + ': ' + e.message)); await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } });
    await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.waitForTimeout(200);
    await pg.screenshot({ path: `${D}/m_${k}_1title.png` }); await pg.click('text=创建角色'); await pg.fill('#nm', '石小凡'); await pg.screenshot({ path: `${D}/m_${k}_2create.png` }); await pg.click('text=进入大荒'); await pg.waitForTimeout(700);
    await pg.screenshot({ path: `${D}/m_${k}_3dialog.png` });
    await pg.evaluate(async () => { __dbg.auto = true; if (__dbg.DLG) document.getElementById('dlg').click(); for (let i = 0; i < 80 && __dbg.STATE.scene; i++) { if (__dbg.DLG) { const c = document.querySelector('#dlg .chb'); if (c) c.click(); else document.getElementById('dlg').click(); } await new Promise(r => setTimeout(r, 30)); } __dbg.go('sc_street', false, true); });
    await pg.waitForTimeout(500); await pg.screenshot({ path: `${D}/m_${k}_4play.png` });
    await pg.evaluate(async () => { __dbg.go('fl_path', true, true); __dbg.startBattle({ mobs: [['wolf', 2], ['boar', 1], ['snake', 2]], title: '测试战斗' }); }); await pg.waitForTimeout(500); await pg.screenshot({ path: `${D}/m_${k}_5battle.png` });
    await pg.evaluate(() => { __dbg.battleAct({ sk: 'kp_wing' }); }); await pg.waitForTimeout(900); await pg.screenshot({ path: `${D}/m_${k}_6battle2.png` });
    await pg.evaluate(() => { __dbg.STATE.battle = null; __dbg.STATE.busy = false; __dbg.refresh(); __dbg.openModal('market'); }); await pg.waitForTimeout(300); await pg.screenshot({ path: `${D}/m_${k}_7market.png` });
    await pg.evaluate(() => { __dbg.closeModal(); if (document.body.classList.contains('narrow')) navTo('soc'); else openSide('chat'); }); await pg.waitForTimeout(300); await pg.screenshot({ path: `${D}/m_${k}_8chat.png` });
    await pg.evaluate(() => { if (document.body.classList.contains('narrow')) navTo('bag'); else openSide('bag'); }); await pg.waitForTimeout(300); await pg.screenshot({ path: `${D}/m_${k}_9bag.png` });
    // overflow check: nothing wider than the viewport
    const ov = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) errs.push(k + ': horizontal overflow ' + ov);
    await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
