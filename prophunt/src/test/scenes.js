// Every scene: whole-map overview (turn mode) + realtime close-up with both characters -> sc_<id>_{a,b}.png
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/prophunt/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  const ids = await p.evaluate(() => SCENE_IDS);
  for (const id of ids) {
    await p.evaluate(id => { NETROLE = 'solo'; ME = 0; newRound({ seed: 777, scene: id, mode: 'turn', hider: 1, ai: 1 }); enterGame(); ['hud', 'toasts', 'banner', 'curtain'].forEach(k => $(k).style.visibility = 'hidden'); }, id);
    await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/sc_${id}_a.png` });
    await p.evaluate(id => { newRound({ seed: 778, scene: id, mode: 'rt', hider: 1, ai: 0 }); ME = 1; enterGame(); G.phase = 'seek'; G.t = 150; STATE.lastPhase = 'seek';
      const s = G.pl[0], h = G.pl[1]; s.x = SPAWN_HIDE[0]; s.y = SPAWN_HIDE[1]; h.dg = null; const sp = findFit(1, null, s.x + 1, s.y) || [s.x + 1, s.y]; h.x = sp[0]; h.y = sp[1]; s.d = 0.4; h.d = -0.5; }, id);
    await p.waitForTimeout(1200); await p.screenshot({ path: `${OUT}/sc_${id}_b.png` });
    await p.evaluate(() => { ['hud', 'toasts', 'banner', 'curtain'].forEach(k => $(k).style.visibility = ''); });
  }
  console.log('errs', errs); await b.close();
})();
