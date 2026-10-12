// Solo smoke test: boot, simulate, exercise puzzles through the real functions, screenshot.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 650 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html?solo=1&seed=' + (process.env.SEED || 7) + '&role=' + (process.env.ROLE || 'L'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000, polling: 500 });
  await p.evaluate(() => { window.__dbg.skipDraw = true; });
  console.log('setup', await p.evaluate(() => JSON.stringify({ g: W.setup.gtype, haunt: MAP.rooms[W.setup.haunt].id, ev: W.setup.ev.map(e => e.k + '@' + MAP.rooms[e.room].id), code: W.setup.code, codeRoom: MAP.rooms[W.setup.codeSpot.room].id, items: W.items.map(i => i.k + '@' + i.slot) })));
  // simulate 3 minutes headless
  console.log('sim', await p.evaluate(() => { const log = []; let last = ''; for (let i = 0; i < 60 * 180; i++) { stepGame(1 / 60); if (W.g.st !== last) { log.push((W.t | 0) + ':' + W.g.st); last = W.g.st; } if (W.phase !== 'play') break; } return JSON.stringify({ t: W.t | 0, phase: W.phase, log: log.slice(0, 20), fear: W.p.map(p => p.fear | 0), downs: W.stats.downs }); }));
  await p.evaluate(() => { window.__dbg.skipDraw = false; });
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/sm_play.png', timeout: 120000 });
  console.log('errs', errs.slice(0, 10));
  await b.close();
})();
