// Round 25: placeables are separate from the shop (道具 anywhere), gear goes on bushes / searched spots, and snaps to a free tile nearby
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  let s = await p.evaluate(() => { window.__dbg.skipDraw = true; window.__dbg.god = true; W.phase = 'day'; for (const k in W.res) W.res[k] = 999; const me = W.p[0];
    const x = W.radio.x + 28, y = W.radio.y + 26, L = gAt(x, y); for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { W.blk[ci(x + dx, y + dy, L)] = 0; W.blk[ci(x + dx, y + dy, L + 1)] = 0; W.slab[ci(x + dx, y + dy, L + 1)] = 0; } W.ver++;
    me.x = x - 1.5; me.y = y + 0.5; me.L = L; me.z = surfZ(me.x, me.y, L);
    W.blk[ci(x, y, L)] = 41; const bush = { trap: canPlace(x, y, L, 15, 0) || 'OK', wall: canPlace(x, y, L, 1, 0) || 'OK' };
    W.blk[ci(x + 1, y, L)] = 33; const sp = ci(x + 1, y, L); const fresh = canPlace(x + 1, y, L, 51, 0) || 'OK'; W.srch.add(sp); const done = canPlace(x + 1, y, L, 51, 0) || 'OK';
    doBuild(me, x, y, L, 15, 0); doBuild(me, x + 1, y, L, 51, 0);
    return { bush, fresh, done, now: [W.blk[ci(x, y, L)], W.blk[ci(x + 1, y, L)]], srch: W.srch.has(sp), x, y, L }; });
  check('gear goes on a bush or a searched backpack (replacing it); walls do not; unsearched loot is kept', s.bush.trap === 'OK' && s.bush.wall !== 'OK' && s.fresh !== 'OK' && s.done === 'OK' && s.now.join() === '15,51' && !s.srch, JSON.stringify(s));
  // snapping: point at an occupied tile with a mine selected -> a free tile next to it is offered
  const r = await p.evaluate(({ x, y, L }) => { const me = W.p[0]; W.blk[ci(x + 2, y, L)] = 26; W.ver++; me.build = true; me.sel = 51; me.demo = false; const [sx, sy] = w2s(x + 2.5, y + 0.5, surfZ(x + 2.5, y + 0.5, L) + 0.2); const c = pickBuild(sx, sy, me, false); me.build = false; return c && { ok: c.ok, snap: !!c.snap, d: Math.hypot(c.x - x - 2, c.y - y), occupied: W.blk[ci(c.x, c.y, c.L)] }; }, s);
  check('pointing at a crate with a mine selected snaps the placement to a free tile right beside it', r && r.ok && r.d <= 2.1 && !r.occupied, JSON.stringify(r));
  s = await p.evaluate(() => { const me = W.p[0]; SET.shopTab = 'gun'; me.x = W.radio.x + 0.5; me.y = W.radio.y + 2.5; me.L = gAt(W.radio.x, W.radio.y + 2); openCraft(); const mini = document.querySelectorAll('#clist .sc.mini').length, txt = $('clist').textContent; closeCraft();
    me.x += 30; const bt = $('wbItem'); bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); const on = me.build; toggleBuild(false); return { mini, hint: /不在商店/.test(txt), on, out: !canCraft(me) }; });
  check('the shop has no placeables any more (just a pointer to 道具); the 道具 button works far from any building', s.mini === 0 && s.on && s.out, /* (round 36f) the shop's pointer line went with the hint text cleanup */ JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
