// iPhone portrait/landscape + iPad + desktop screenshots of each screen. Repo root on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const VPS = [['p393', 393, 852, 1], ['l852', 852, 340, 1], ['ipad', 1180, 820, 1], ['desk', 1280, 800, 0]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  for (const [n, w, h, touch] of VPS) {
    const c = await b.newContext(touch ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: n !== 'ipad', deviceScaleFactor: 1, userAgent: n !== 'ipad' ? UA : undefined } : { viewport: { width: w, height: h } });
    await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/prophunt/'); await p.waitForFunction(() => window.__ready);
    await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/ph_${n}_1title.png` });
    console.log(n, 'hub btn', await p.evaluate(() => !$('hubBtn').classList.contains('hidden')), 'solo in view', await p.evaluate(() => { const r = $('soloBtn').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }));
    await p.evaluate(() => startSolo(false)); await p.waitForFunction(() => G.phase === 'seek', null, { timeout: 8000 }); await p.waitForTimeout(2400);
    await p.screenshot({ path: `${OUT}/ph_${n}_2rt.png` });
    await p.evaluate(() => { G.kcd = 0; doAct(0, 'knock', { id: -1 }); }); await p.waitForTimeout(2200);
    await p.screenshot({ path: `${OUT}/ph_${n}_3end.png` });
    await p.evaluate(() => { toTitle(); PICK_MODE = 'turn'; startSolo(false); }); await p.waitForTimeout(2600);
    await p.screenshot({ path: `${OUT}/ph_${n}_4turn.png` });
    await p.evaluate(() => openMenu()); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/ph_${n}_5menu.png` });
    await p.evaluate(() => { closeMenu(); $('help').classList.remove('hidden'); }); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/ph_${n}_6help.png` });
    console.log(n, 'errs', errs);
    await c.close();
  }
  await b.close();
})();
