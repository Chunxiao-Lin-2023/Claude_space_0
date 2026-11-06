// Character close-ups: both characters in 8 facings (idle + walking) -> people_sheet.png
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const c = await b.newContext({ viewport: { width: 1400, height: 760 }, deviceScaleFactor: 1 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/prophunt/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => {
    NETROLE = 'solo'; newRound({ seed: 5, mode: 'rt', hider: 1, ai: 0 }); MAP.items = MAP.items.filter(i => i.room !== 8);
    ME = 1; enterGame(); G.phase = 'seek'; G.t = 999; STATE.lastPhase = 'seek'; ['hud', 'toasts', 'banner'].forEach(id => $(id).style.display = 'none');
    simTick = () => {}; localControl = () => {}; computeFocus = () => { STATE.focus = null; }; drawMarks = () => {};
    camStep = () => { CAM.x = 8.2; CAM.y = 18.35; CAM.S = 400; };
  });
  const shots = [];
  for (const mv of [0, 1]) for (let k = 0; k < 8; k++) {
    await p.evaluate(([k, mv]) => { const a = k / 8 * Math.PI * 2; G.pl[0].x = 7.2; G.pl[0].y = 19; G.pl[1].x = 8.8; G.pl[1].y = 19; G.pl[0].d = G.pl[1].d = a; G.pl[0].mv = G.pl[1].mv = mv; G.pl[1].dg = null; STATE.t = 1.3; }, [k, mv]);
    await p.waitForTimeout(120);
    const f = `${OUT}/pp_${mv}_${k}.png`; await p.screenshot({ path: f, clip: { x: 0, y: 0, width: 1400, height: 760 } }); shots.push(f);
  }
  console.log('errs', errs); await b.close();
})();
