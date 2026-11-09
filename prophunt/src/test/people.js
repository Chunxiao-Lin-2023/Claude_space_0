// Character close-ups for every scene: front / side / back of both characters -> people_<scene>.png
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const c = await b.newContext({ viewport: { width: 1400, height: 760 }, deviceScaleFactor: 1 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/prophunt/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  const ids = await p.evaluate(() => SCENE_IDS);
  for (const id of ids) {
    await p.evaluate(id => {
      NETROLE = 'solo'; newRound({ seed: 5, scene: id, mode: 'rt', hider: 1, ai: 0 }); MAP.items = [];
      ME = 1; enterGame(); G.phase = 'seek'; G.t = 999; STATE.lastPhase = 'seek'; ['hud', 'toasts', 'banner'].forEach(k => $(k).style.display = 'none');
      simTick = () => {}; localControl = () => {}; computeFocus = () => { STATE.focus = null; }; drawMarks = () => {};
      const r = ROOMS.find(q => !q.water) || ROOMS[0]; window.__c = [(r.r[0] + r.r[2]) / 2, (r.r[1] + r.r[3]) / 2];
      camStep = () => { CAM.x = __c[0]; CAM.y = __c[1] - .65; CAM.S = 400; };
    }, id);
    for (const k of [0, 2, 4]) {
      await p.evaluate(k => { const a = k / 8 * Math.PI * 2; G.pl[0].x = __c[0] - .8; G.pl[0].y = __c[1]; G.pl[1].x = __c[0] + .8; G.pl[1].y = __c[1]; G.pl[0].d = G.pl[1].d = a; G.pl[0].mv = G.pl[1].mv = 0; G.pl[1].dg = null; STATE.t = 1.3; }, k);
      await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/pq_${id}_${k}.png`, clip: { x: 0, y: 60, width: 1400, height: 640 } });
    }
  }
  console.log('errs', errs); await b.close();
})();
