// node test/mobile.js [names] — screenshots of each screen at phone / iPad / desktop sizes into /tmp/claude-0/wmol/m_*
const { chromium } = require('playwright'); const D = '/tmp/claude-0/wmol'; require('fs').mkdirSync(D, { recursive: true });
const VPS = { phoneP: [393, 852, 1], se: [375, 667, 1], phoneL: [852, 393, 1], seL: [667, 375, 1], ipadL: [1180, 820, 1], ipadP: [820, 1180, 1], desk: [1280, 800, 0] };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const want = (process.argv[2] || Object.keys(VPS).join(',')).split(','); const errs = [];
  for (const k of want) { const [w, h, t] = VPS[k]; const ctx = await b.newContext(t ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA } : { viewport: { width: w, height: h } });
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(k + ': ' + e.message)); await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } });
    await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.waitForTimeout(200);
    const shot = async n => { await pg.waitForTimeout(250); await pg.screenshot({ path: `${D}/m_${k}_${n}.png` }); const ov = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) errs.push(k + ' ' + n + ': horizontal overflow ' + ov); };
    await shot('1title'); await pg.click('text=开始'); await pg.waitForTimeout(500); await shot('2dialog');
    await pg.evaluate(async () => { __dbg.auto = true; __dbg.instant = true; __dbg.dlgPick(-1); for (let i = 0; i < 60 && __dbg.STATE.scene; i++) await new Promise(r => setTimeout(r, 30));
      const C = __dbg.C; C.story.q = 11; Object.assign(C.story.f, { tomb: 1, bei: 1, deep: 1, moved: 1 }); C.lv = 8; C.sk = ['qly', 'sn']; C.bar = ['qly', 'sn']; C.gf.push('xixue', 'guwen', 'yaoding'); C.pets.maoqiu = { aff: 45 }; C.pet = 'maoqiu'; C.bag = { milk: 3, meat: 2, herb: 4, lingyao: 1, taiyi: 1 }; fullHeal(); __dbg.auto = false; __dbg.go('sc_street', false, true); });
    await shot('3play');
    await pg.evaluate(() => { __dbg.go('dh_forest', true, true); __dbg.startBattle({ mobs: [['wolf', 6], ['boar', 6], ['snake', 6]], title: '测试' }); }); await shot('4battle');
    await pg.evaluate(() => { __dbg.battleAct({ sk: 'qly' }); }); await pg.waitForTimeout(700); await shot('5battle2');
    await pg.evaluate(() => { __dbg.STATE.battle = null; __dbg.STATE.busy = false; document.body.classList.remove('inbattle'); __dbg.refresh(); });
    for (const tab of ['hero', 'pet', 'bag', 'map']) { await pg.evaluate(t => { if (document.body.classList.contains('narrow')) navTo(t); else showTab(t); }, tab); await shot('6' + tab); if (await pg.evaluate(() => document.body.classList.contains('narrow'))) await pg.evaluate(() => navTo('adv')); }
    await pg.evaluate(() => { __dbg.C.story.f.xushen = 1; __dbg.go('xs_hall', true, true); __dbg.openModal('arena'); }); await shot('7arena');
    await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
