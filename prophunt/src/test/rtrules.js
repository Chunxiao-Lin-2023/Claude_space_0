// Realtime rules: charges regenerate, final 20 s = auto whistle every 5 s + exactly 3 knocks.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 760 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/prophunt/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.click('#soloBtn'); await p.waitForFunction(() => G.phase === 'seek', null, { timeout: 8000 });
  const knockFar = () => p.evaluate(() => { const h = G.pl[1], s = G.pl[0]; const it = MAP.items.filter(i => !i.flat && Math.hypot(i.x - h.x, i.y - h.y) > 4).sort((a, c) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(c.x - s.x, c.y - s.y))[0]; s.x = it.x; s.y = it.y; const f = it.fp; s.x = f[0] - .3; s.y = (f[1] + f[3]) / 2; G.kcd = 0; return doAct(0, 'knock', { id: it.id }) || 'ok'; });
  console.log('start kn', await p.evaluate(() => G.kn));
  for (let i = 0; i < 4; i++) console.log('knock', i, await knockFar(), await p.evaluate(() => G.kn + ' phase ' + G.phase));
  await p.evaluate(() => { G.regenT = .2; }); await p.waitForTimeout(500); console.log('regen ->', await p.evaluate(() => G.kn));
  await p.evaluate(() => { G.t = 20.3; }); await p.waitForTimeout(700);
  console.log('final', await p.evaluate(() => G.fin + ' kn ' + G.kn + ' banner ' + $('banner').textContent + ' chip ' + $('hTaps').textContent));
  const wh0 = await p.evaluate(() => STATE.ripples.length); await p.waitForTimeout(5300); console.log('ripples during 5s', wh0, '->', await p.evaluate(() => STATE.ripples.length + ' lastWh ' + STATE.lastWh));
  console.log('taunt blocked', await p.evaluate(() => { const t = G.t; G.tauntCD = 0; doAct(1, 'taunt'); return Math.abs(G.t - t) < .5; }));
  await p.screenshot({ path: '/tmp/ph/rt_final.png' });
  for (let i = 0; i < 3; i++) console.log('final knock', i, await knockFar(), await p.evaluate(() => G.kn + ' ' + G.phase));
  await p.waitForTimeout(2200); console.log('end', await p.evaluate(() => JSON.stringify(G.res) + ' ' + $('eWhy').textContent));
  console.log('errs', errs); await b.close();
})();
