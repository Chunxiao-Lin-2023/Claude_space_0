// node test/mobile.js [outdir] — screenshots of every UI state on phone/tablet viewports (IPHONE.md)
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const UAPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS || 'ipadL:1180x820,ipadP:820x1180,phoneL:852x393,phoneLs:852x340,phoneP:393x852,se:667x375').split(',').map(s => { const [n, d] = s.split(':'); const [w, h] = d.split('x').map(Number); return { n, w, h }; });
(async () => {
  const out = process.argv[2] || '/tmp/claude-0/mobile'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  for (const vp of VPS) {
    const pad = vp.n.startsWith('ipad');
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: pad ? UAPAD : UA });
    const pg = await ctx.newPage(); const seen = new Set(); pg.on('pageerror', e => { if (!seen.has(e.message)) { seen.add(e.message); console.log(vp.n, 'PAGEERR', e.message); } });
    await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
    const shot = async (k, w = 900) => { await pg.waitForTimeout(w); await pg.screenshot({ path: `${out}/${vp.n}_${k}.png` }); };
    await shot('a_title', 1500);
    await pg.evaluate(() => { localStorage.clear(); PARTY.pname = '团团'; SET.petName = '团团'; startSolo(null); });
    for (let i = 0; i < 300; i++) { const st = await pg.evaluate(() => { W.skip = true; if (DLG.open) { DLG.typing = 1e9; advanceDlg(); } if (UI.choice) UI.choice(0); return [STORY.qi, !!STORY.running || STORY.hold, DLG.open, STORY.si]; }); if (st[0] >= 1 && !st[1] && !st[2] && st[3] >= 1) break; await pg.waitForTimeout(50); }
    await pg.evaluate(() => { W.skip = false; W.cine = false; uiCine(false); hidePet(false); for (const p of W.P) p.script = false; PARTY.flags.sk_shenli = PARTY.flags.sk_yinyue = 1; setLight('day', true); });
    await shot('b_hud', 2000);
    await pg.evaluate(() => { talk([['族长', '小不点，你又偷喝兽奶了？嘴角还白白的呢。今天的锻体可不能偷懒，去村前空地和大家一起迎霞。', 'happy']]); }); await shot('c_dialog', 1800);
    await pg.evaluate(() => { while (DLG.open) { DLG.typing = 1e9; advanceDlg(); } });
    for (const m of ['bag', 'skills', 'quests', 'map', 'char']) { await pg.evaluate(m => { closeModal && closeModal(); openModal(m); }, m); await shot('d_' + m, 700); }
    await pg.evaluate(() => { closeModal(); togglePause(); }); await shot('e_menu', 700);
    await ctx.close(); console.log('done', vp.n);
  }
  await b.close();
})();
