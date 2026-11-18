// Save / continue: build something, change resources and the clock, save, reload the page, continue, compare.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0; const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i ? '  ' + i : '')); if (!c) fails++; };
  const c = await b.newContext({ viewport: { width: 1280, height: 760 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.evaluate(() => localStorage.removeItem(SKEY + 'save'));
  ok('no continue button without a save', await p.evaluate(() => document.getElementById('contBtn').classList.contains('hidden')));
  await p.evaluate(() => $('soloBtn').click()); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  const before = await p.evaluate(() => {
    const me = W.p[0], X = W.radio.x + 8, Y = W.radio.y + 8; W.res.wood = 321; W.res.parts = 45; W.night = 3; W.clock = 77; me.owned[4] = 1; me.ammo[4] = 17; me.meds = 2; me.x = X + 2.5; me.y = Y + 0.5;
    setCell(ci(X, Y, 0), 2, 0, null, 'build'); W.bhp[ci(X, Y, 0)] = 123; setCell(ci(X, Y, 1), 0, 4, null, 'build');
    const z = spawnZombie('armored', 0); z.x = X + 5.5; z.y = Y + 0.5; z.L = 0; z.hp = 77;
    let ci0 = -1; for (let i = 0; i < NC; i++) if (W.blk[i] === 26) { ci0 = i; break; } setCell(ci0, 0, W.slab[ci0], null, 'loot');
    const saved = saveGame(false), len = localStorage.getItem(SKEY + 'save').length;
    return { X, Y, saved, len, ci0, seed: W.seed, tasks: W.tasks.map(t => t.txt).join('|') };
  });
  ok('saved', before.saved, 'size ' + (before.len / 1024).toFixed(0) + ' KB');
  await p.reload(); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const lbl = await p.evaluate(() => { const b = document.getElementById('contBtn'); return b.classList.contains('hidden') ? '' : b.textContent; });
  ok('continue button shows the day', /第 4 天/.test(lbl), lbl);
  await p.click('#contBtn'); await p.waitForFunction(() => W && STATE.mode === 'play', null, { timeout: 90000 });
  const after = await p.evaluate(b => ({ seed: W.seed, wood: W.res.wood, parts: W.res.parts, night: W.night, clock: Math.round(W.clock), wall: W.blk[ci(b.X, b.Y, 0)], hp: Math.round(W.bhp[ci(b.X, b.Y, 0)]), slab: W.slab[ci(b.X, b.Y, 1)], crate: W.blk[b.ci0], bow: W.p[0].owned[4] + ':' + W.p[0].ammo[4], meds: W.p[0].meds, zs: W.zs.map(z => z.k + ':' + z.hp).join(','), tasks: W.tasks.map(t => t.txt).join('|'), px: Math.floor(W.p[0].x) - b.X }), before);
  ok('world, resources, player and zombies restored', after.seed === before.seed && after.wood === 321 && after.parts === 45 && after.night === 3 && after.wall === 2 && after.hp === 123 && after.slab === 4 && after.crate === 0 && after.bow === '1:17' && after.meds === 2 && after.zs === 'armored:77' && after.tasks === before.tasks && after.px === 2, JSON.stringify(after));
  await p.evaluate(() => { W.night = BAL.nights; W.phase = 'night'; W.zs.length = 0; W.spawnQ = []; W.nightT = 9999; dawn(); });
  ok('winning clears the save', await p.evaluate(() => !localStorage.getItem(SKEY + 'save')));
  ok('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(fails ? fails + ' FAILED' : 'ALL PASS'); await b.close();
})();
