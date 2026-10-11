// Single-player smoke test: title -> level -> traps -> waves; collects pageerrors and screenshots.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots';
fs.mkdirSync(SH, {recursive: true});
const srv = http.createServer((q, s) => { const f = path.join(ROOT, q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const page = await browser.newPage({viewport: {width: 1280, height: 760}});
const errs = [];
page.on('pageerror', e => { errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')); });
page.on('console', m => { if (m.type() === 'error' && !/404|ERR_/.test(m.text())) errs.push('console: ' + m.text()); });
const lvl = +(process.argv[2] || 0), hero = process.argv[3] || 'warmage';
await page.goto(`http://127.0.0.1:${port}/test.html?unlockall`);
await page.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'), null, {timeout: 30000});
await page.waitForTimeout(1500);
await page.screenshot({path: SH + '/01_title.png'});
await page.evaluate(h => { __dbg.SAVE.hero = h; __dbg.SAVE.traps = {spikes: 2, barricade: 1, tar: 1, arrow: 2, spring: 1, brim: 1, frost: 1, grinder: 1}; }, hero);
await page.click('#bSolo'); await page.waitForTimeout(400);
await page.screenshot({path: SH + '/02_levels.png'});
await page.evaluate(l => __dbg.startLevel(l), lvl);
await page.waitForTimeout(800);
await page.screenshot({path: SH + '/03_build.png'});
// auto-place traps along the orc path using the flow field
const placed = await page.evaluate(() => {
  const G = __dbg.G, ME = __dbg.ME; __dbg.give(20000); let n = 0;
  const m = G.map; const cand = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const d = G.flow[y * m.w + x]; if (d < 1e8 && d > 4) cand.push([d, x, y]); }
  cand.sort((a, b) => a[0] - b[0]);
  const kinds = ['spikes', 'tar', 'spring', 'brim', 'frost', 'barricade'];
  for (let i = 0; i < cand.length && n < 16; i += 5) { const [, x, y] = cand[i]; __dbg.tp(x * 48 + 24, y * 48 + 24 + 30); const r = __dbg.placeTrap(ME, kinds[n % kinds.length], x, y, 1); if (!r) n++; }
  // wall traps
  let w = 0; for (let i = 0; i < cand.length && w < 6; i += 3) { const [, x, y] = cand[i]; for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) { if (G.map.t[(y + dy) * m.w + x + dx] === 1) { __dbg.tp(x * 48 + 24, y * 48 + 24); if (!__dbg.placeTrap(ME, w % 2 ? 'grinder' : 'arrow', x + dx, y + dy, 0)) { w++; break; } } } }
  const s = G.map.spawn; __dbg.tp(s.x * 48 + 24, s.y * 48 + 24);
  return [n, w, G.traps.length];
});
console.log('placed', placed);
await page.keyboard.press('Digit2'); await page.mouse.move(700, 400); await page.waitForTimeout(300);
await page.screenshot({path: SH + '/04_ghost.png'});
await page.keyboard.press('Digit1');
await page.keyboard.press('KeyG');
await page.waitForTimeout(300);
// play: hold fire toward mouse, run sim for a while; teleport player near the action
for (let k = 0; k < 14; k++) {
  await page.evaluate(() => { const e = __dbg.G.enemies.find(e => !e.dead && !e.fall); if (e) { __dbg.tp(e.x + 120, e.y + 60); } });
  await page.mouse.move(560, 330); await page.mouse.down();
  await page.waitForTimeout(1000);
  if (k === 2) { await page.keyboard.press('KeyQ'); await page.mouse.click(600, 360, {button: 'right'}); }
  if (k === 4) await page.screenshot({path: SH + '/05_fight.png'});
  if (k === 8) { await page.keyboard.press('Space'); await page.screenshot({path: SH + '/06_fight2.png'}); }
}
await page.mouse.up();
const st = await page.evaluate(() => ({phase: __dbg.G.phase, wave: __dbg.G.wave, rift: __dbg.G.rift, gold: __dbg.G.gold, kills: __dbg.G.stats.kills, falls: __dbg.G.stats.falls, en: __dbg.G.enemies.length, hp: __dbg.ME.hp}));
console.log('state', JSON.stringify(st));
// fast-forward remaining waves with the sim
const fin = await page.evaluate(() => { const G = __dbg.G; for (let w = 0; w < 20 && G.phase !== 'won' && G.phase !== 'lost'; w++) { if (G.phase === 'build') __dbg.startWave(); for (let i = 0; i < 60 * 120 && G.phase === 'wave'; i++) { __dbg.updWorld(1 / 60); if (i % 300 === 0) __dbg.skip(); } } return {phase: G.phase, wave: G.wave, rift: G.rift, res: G.result}; });
console.log('final', JSON.stringify(fin));
await page.waitForTimeout(3500);
await page.screenshot({path: SH + '/07_result.png'});
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close();
