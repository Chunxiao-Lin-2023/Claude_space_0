// Solo smoke: realtime + turn mode. Repo root served on :8765.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/prophunt/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/01_title.png' });
  console.log('items', await p.evaluate(() => MAP.items.length), 'per room', await p.evaluate(() => ROOMS.map(r => r.n + MAP.items.filter(i => i.room === r.i).length).join(' ')));
  // realtime solo
  await p.click('#soloBtn'); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/02_blind.png' });
  await p.waitForFunction(() => G.phase === 'seek', null, { timeout: 8000 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/03_seek.png' });
  console.log('hider', await p.evaluate(() => JSON.stringify(G.pl[1]) + ' room ' + roomAt(G.pl[1].x, G.pl[1].y).n));
  // walk up into the hall
  await p.keyboard.down('w'); await p.waitForTimeout(1600); await p.keyboard.up('w');
  console.log('seeker at', await p.evaluate(() => G.pl[0].x.toFixed(2) + ',' + G.pl[0].y.toFixed(2) + ' lit ' + litRooms().map(i => ROOMS[i].n)));
  await p.screenshot({ path: OUT + '/04_walk.png' });
  // teleport next to the hider and knock a wrong item then the hider
  await p.evaluate(() => { const h = G.pl[1]; const it = MAP.items.find(i => i.room === roomAt(h.x, h.y).i && !i.flat); const s = G.pl[0]; s.x = it.x; s.y = it.y + 1.2; const sp = findFit(0, null, s.x, s.y); });
  await p.evaluate(() => { const s = G.pl[0], h = G.pl[1]; // find a free spot near hider
    for (const [ox, oy] of OFFS.concat(OFFS.map(([a, b]) => [a * 2, b * 2]))) { const x = h.x + ox + .9, y = h.y + oy; if (!blocked([x - .26, y - .26, x + .26, y + .26], 0)) { s.x = x; s.y = y; break; } } });
  await p.waitForTimeout(600); await p.screenshot({ path: OUT + '/05_near.png' });
  const wrongId = await p.evaluate(() => { const s = G.pl[0]; const it = MAP.items.filter(i => litRooms().includes(i.room) && !i.flat).sort((a, b) => distFp(s.x, s.y, a.fp) - distFp(s.x, s.y, b.fp))[0]; return it.id; });
  await p.evaluate(id => act('knock', { id }), wrongId); await p.waitForTimeout(900);
  console.log('wrong', await p.evaluate(() => G.wrong));
  await p.screenshot({ path: OUT + '/06_knock.png' });
  await p.evaluate(() => { G.kcd = 0; act('knock', { id: -1 }); }); await p.waitForTimeout(2600);
  console.log('phase', await p.evaluate(() => G.phase + ' ' + JSON.stringify(G.res) + ' score ' + G.score));
  await p.screenshot({ path: OUT + '/07_end.png' });
  // turn mode
  await p.click('#eTitle2'); await p.waitForTimeout(300);
  await p.click('#modeSeg button[data-m="turn"]'); await p.click('#soloBtn'); await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/08_turn.png' });
  console.log('turn phase', await p.evaluate(() => G.phase + ' turn ' + G.turnN));
  for (let k = 0; k < 4; k++) {
    const id = await p.evaluate(k => { const h = G.pl[1]; const its = MAP.items.filter(i => !i.flat && !G.hints.some(q => q[0] === i.id)).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y)); return its[3 + k].id; }, k);
    await p.evaluate(id => { STATE.sel = { kind: 'item', it: MAP.items[id] }; turnConfirm(); }, id);
    await p.waitForTimeout(2200);
    console.log('after knock', k, await p.evaluate(() => G.phase + ' hints ' + JSON.stringify(G.hints) + ' hider ' + G.pl[1].x.toFixed(1) + ',' + G.pl[1].y.toFixed(1) + ' ' + G.pl[1].dg.k));
  }
  await p.screenshot({ path: OUT + '/09_turn_hints.png' });
  console.log('errs', errs);
  await b.close();
})();
