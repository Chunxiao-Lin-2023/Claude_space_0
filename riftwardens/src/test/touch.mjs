// Touch / iPad test: two viewports, CDP touch input for sticks, trap bar, placement.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots';
const srv = http.createServer((q, s) => { const f = path.join(ROOT, q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const errs = [];
for (const [tag, vp] of [['ipad', {width: 1180, height: 820}], ['phone', {width: 844, height: 390}]]) {
  const ctx = await browser.newContext({viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2});
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(tag + ': ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  await pg.goto(`http://127.0.0.1:${port}/test.html?unlockall`);
  await pg.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'), null, {timeout: 30000});
  const coarse = await pg.evaluate(() => document.documentElement.classList.contains('coarse'));
  await pg.screenshot({path: `${SH}/t_${tag}_0title.png`});
  await pg.tap('#bSolo'); await pg.waitForTimeout(300);
  await pg.screenshot({path: `${SH}/t_${tag}_1levels.png`});
  await pg.tap('#bStart'); await pg.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(pg);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: pts.map(([x, y, id]) => ({x, y, id}))});
  const p0 = await pg.evaluate(() => [__dbg.ME.x, __dbg.ME.y]);
  // left stick: drag left for 1s ; right stick: aim right & fire
  const L = [vp.width * 0.15, vp.height * 0.7], Rr = [vp.width * 0.8, vp.height * 0.55];
  await touch('touchStart', [[L[0], L[1], 1]]); await touch('touchMove', [[L[0] - 40, L[1] - 10, 1]]);
  await touch('touchStart', [[L[0] - 40, L[1] - 10, 1], [Rr[0], Rr[1], 2]]); await touch('touchMove', [[L[0] - 40, L[1] - 10, 1], [Rr[0] + 40, Rr[1] - 20, 2]]);
  await pg.waitForTimeout(900);
  await pg.screenshot({path: `${SH}/t_${tag}_2sticks.png`});
  const st = await pg.evaluate(() => ({x: __dbg.ME.x, y: __dbg.ME.y, aim: __dbg.ME.aim, projs: __dbg.G.projs.length}));
  await touch('touchEnd', []);
  console.log(tag, 'coarse', coarse, 'moved', Math.round(st.x - p0[0]), Math.round(st.y - p0[1]), 'aim', st.aim.toFixed(2), 'projs', st.projs);
  // trap: tap slot 2, tap a floor tile twice
  const slot = await pg.$$('#bar .slot'); await slot[1].tap(); await pg.waitForTimeout(200);
  const tile = await pg.evaluate(() => { const G = __dbg.G, s = G.map.spawn; for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1]]) { const x = s.x + dx, y = s.y + dy; if (G.map.t[y * G.map.w + x] === 0) { const sx = (x * 48 + 24 - CAM.x) * CAM.z + innerWidth / 2, sy = (y * 48 + 24 - CAM.y) * CAM.z + innerHeight / 2; return [x, y, sx, sy]; } } });
  await touch('touchStart', [[tile[2], tile[3], 5]]); await touch('touchEnd', []); await pg.waitForTimeout(200);
  await pg.screenshot({path: `${SH}/t_${tag}_3ghost.png`});
  await pg.tap('#tPlace'); await pg.waitForTimeout(300);
  const traps = await pg.evaluate(() => __dbg.G.traps.map(t => [t.k, t.tx, t.ty]));
  console.log(tag, 'tile', tile.slice(0, 2), 'traps', JSON.stringify(traps));
  await pg.tap('#tCancel'); await pg.tap('#readyBtn'); await pg.waitForTimeout(1500);
  await pg.screenshot({path: `${SH}/t_${tag}_4wave.png`});
  console.log(tag, 'phase', await pg.evaluate(() => __dbg.G.phase));
  await ctx.close();
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close();
