// Feature probe: staged scenarios with screenshots.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots';
const srv = http.createServer((q, s) => { fs.readFile(path.join(ROOT, q.url.split('?')[0]), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const page = await browser.newPage({viewport: {width: 1280, height: 760}});
const errs = []; page.on('pageerror', e => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
await page.goto(`http://127.0.0.1:${port()}/test.html?unlockall`);
function port() { return srv.address().port; }
await page.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'));
await page.evaluate(() => { __dbg.SAVE.traps = {spikes: 3, barricade: 2, tar: 2, arrow: 3, spring: 3, brim: 3, frost: 3, grinder: 3}; });
// Scene A: lava bridge (level 2) with springs + arrow walls + frost
const a = await page.evaluate(() => {
  __dbg.startLevel(1); const G = __dbg.G, ME = __dbg.ME; __dbg.give(30000);
  const put = (k, x, y, r, px, py) => { __dbg.tp(px ?? x * 48 + 24, py ?? y * 48 + 24 + 40); return __dbg.placeTrap(ME, k, x, y, r); };
  const res = [];
  // springs on bridge row 10 pushing north (r=3) into lava row 9, row 12 pushing south (r=1)
  for (const x of [20, 23, 26]) { res.push(put('spring', x, 10, 3)); res.push(put('spring', x + 1, 12, 1)); }
  res.push(put('frost', 22, 11, 0)); res.push(put('brim', 25, 11, 0)); res.push(put('tar', 28, 11, 0));
  res.push(put('spikes', 19, 11, 0)); res.push(put('spikes', 21, 11, 0));
  res.push(put('arrow', 31, 8, 0, 31 * 48 + 24, 10 * 48)); res.push(put('grinder', 33, 14, 0, 33 * 48 + 24, 12 * 48));
  res.push(put('barricade', 31, 11, 0, 30 * 48, 11 * 48 + 24)); res.push(put('barricade', 31, 10, 0, 30 * 48, 10 * 48 + 24));
  __dbg.tp(31 * 48, 11 * 48 + 30);
  __dbg.startWave();
  return res;
});
console.log('A place', JSON.stringify(a));
await page.evaluate(() => { const G = __dbg.G; for (let i = 0; i < 12; i++) __dbg.spawnOrc(['grunt', 'grunt', 'kobold', 'ogre'][i % 4], 15 * 48 + (i % 3) * 20, 11 * 48 + (i % 2) * 20); });
for (let k = 0; k < 4; k++) { await page.waitForTimeout(1600); await page.screenshot({path: `${SH}/p_A${k}.png`}); }
console.log('A stats', await page.evaluate(() => JSON.stringify(__dbg.G.stats)));
// Scene B: boss level 4, hero sorc
await page.evaluate(() => { __dbg.SAVE.hero = 'sorc'; __dbg.startLevel(3); const G = __dbg.G; __dbg.startWave(); G.spawnQ = []; const g = G.map.gates[1]; const b = __dbg.spawnOrc('chief', g.x * 48 + 24, g.y * 48 + 60); for (let i = 0; i < 6; i++) __dbg.spawnOrc('bat', g.x * 48 + i * 10, g.y * 48 + 40); __dbg.tp(b.x - 60, b.y + 160); });
await page.mouse.move(600, 280); await page.mouse.down();
await page.waitForTimeout(1500); await page.keyboard.press('KeyQ'); await page.waitForTimeout(150);
await page.screenshot({path: `${SH}/p_B0.png`});
await page.mouse.click(640, 300, {button: 'right'});
await page.waitForTimeout(1500);
await page.screenshot({path: `${SH}/p_B1.png`});
await page.mouse.up();
console.log('B', await page.evaluate(() => JSON.stringify({boss: __dbg.G.enemies.filter(e => e.type === 'chief').map(e => Math.round(e.hp)), hp: Math.round(__dbg.ME.hp), dead: __dbg.ME.dead})));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close();
