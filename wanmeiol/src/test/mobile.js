// node test/mobile.js [names] — screenshots of each screen at phone / iPad / desktop sizes into /tmp/claude-0/wmol/m_*; fails on horizontal overflow
const { chromium } = require('playwright'); const D = '/tmp/claude-0/wmol'; require('fs').mkdirSync(D, { recursive: true });
const VPS = { phoneP: [393, 852, 1], se: [375, 667, 1], phoneL: [852, 393, 1], seL: [667, 375, 1], ipadL: [1180, 820, 1], ipadP: [820, 1180, 1], desk: [1280, 800, 0] };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const want = (process.argv[2] || Object.keys(VPS).join(',')).split(','); const errs = [];
  for (const k of want) { const [w, h, t] = VPS[k]; const ctx = await b.newContext(t ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: UA } : { viewport: { width: w, height: h } });
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(k + ': ' + e.message)); await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } });
    await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.evaluate(() => { __dbg.night = false; }); await pg.waitForTimeout(200);
    const shot = async n => { await pg.waitForTimeout(350); await pg.screenshot({ path: `${D}/m_${k}_${n}.png` }); const ov = await pg.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, ...[...document.querySelectorAll('#dlg,#vExplore .ex-r,#bacts,#sbody,#mb')].map(e => e.offsetParent ? e.scrollWidth - e.clientWidth : 0))); if (ov > 1) errs.push(k + ' ' + n + ': horizontal overflow ' + ov); };
    await shot('1title'); await pg.click('text=开始'); await pg.waitForTimeout(1200); await pg.click('#dlg'); await shot('2dialog');
    await pg.evaluate(async () => { __dbg.auto = true; __dbg.instant = true; __dbg.dlgPick(-1); for (let i = 0; i < 60 && __dbg.STATE.scene; i++) await new Promise(r => setTimeout(r, 30));
      const C = __dbg.C; C.story.q = __dbg.MAIN.findIndex(q => q.id === 'q_ruin'); Object.assign(C.story.f, { tomb: 1, bei: 1, deep: 1, moved: 1 }); C.lv = 8; C.sk = ['qly', 'sn', 'gw', 'lei']; C.bar = ['qly', 'sn', 'gw', 'lei']; C.prof = { qly: 44, sn: 12, gw: 104 }; C.gf.push('xixue', 'guwen', 'yaoding'); C.pets.maoqiu = { aff: 45 }; C.pet = 'maoqiu'; C.bag = { milk: 3, meat: 2, herb: 4, lingyao: 1, taiyi: 1 }; C.codex = { wolf: { wk: [] }, yuzu: { wk: ['lei'] }, rhino: { wk: [] } }; C.kills = { wolf: 12, yuzu: 3 }; fullHeal(); __dbg.auto = false;
      __dbg.JOURNAL.push({ t: '迎霞锻体', ch: 1, l: [['', '朝霞刚刚升起……'], ['石大壮', '小不点，又是你最后一个！'], ['▸', '去！我爬得最快。']] }); __dbg.go('sc_street', false, true); });
    await shot('3explore');
    await pg.evaluate(() => { __dbg.go('dh_forest', true, true); __dbg.startBattle({ mobs: [['wolf', 6], ['yuzu', 6], ['rhino', 6]], title: '测试' }); }); await shot('4battle');
    await pg.evaluate(() => { __dbg.battleAct({ sk: 'lei' }); }); await shot('5battle2');
    await pg.evaluate(() => { __dbg.STATE.battle = null; __dbg.STATE.busy = false; __dbg.refresh(); });
    for (const tab of ['hero', 'pet', 'bag', 'map']) { await pg.evaluate(t => __dbg.navTo(t), tab); await shot('6' + tab); }
    await pg.evaluate(() => { __dbg.navTo('log'); }); await shot('7log'); await pg.evaluate(() => { UI.logTab = 'memo'; renderSide(); }); await shot('7memo'); await pg.evaluate(() => { UI.memo = 0; renderSide(); }); await shot('7memo2'); await pg.evaluate(() => { UI.logTab = 'codex'; renderSide(); }); await shot('7codex');
    await pg.evaluate(() => { __dbg.navTo('adv'); __dbg.C.story.f.xushen = 1; __dbg.go('xs_hall', true, true); __dbg.openModal('arena'); }); await shot('8arena');
    await pg.evaluate(() => { __dbg.openModal('set'); }); await shot('8set'); await pg.evaluate(() => __dbg.closeModal());
    await pg.evaluate(() => { __dbg.night = true; __dbg.go('dh_forest', false, true); }); await shot('9night');
    await pg.evaluate(() => { runScene(async () => { await nar('测试骨文'); await runeGame('lei'); }); }); await pg.waitForTimeout(400); await pg.click('#dlg'); await shot('9rune');
    await pg.waitForTimeout(4400); await pg.evaluate(() => { const R = __dbg.DLG.rune; runeTap(R.seq[0]); runeTap(R.seq[1]); }); await shot('9rune2');
    await ctx.close(); }
  console.log('errors', errs); await b.close(); process.exit(errs.length ? 1 : 0); })();
