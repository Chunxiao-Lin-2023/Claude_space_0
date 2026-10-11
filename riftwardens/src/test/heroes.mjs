// Each hero: spawn a pack in front, use primary / alt / skill / dash, screenshot, check damage dealt.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots';
const srv = http.createServer((q, s) => { fs.readFile(path.join(ROOT, q.url.split('?')[0]), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const page = await browser.newPage({viewport: {width: 1280, height: 760}});
const errs = []; page.on('pageerror', e => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'));
await page.waitForTimeout(1200); await page.screenshot({path: SH + '/h_title.png'});
const only = process.argv[2];
for (const hero of ['warmage', 'sorc', 'paladin', 'ranger', 'alch', 'blade']) {
  if (only && hero !== only) continue;
  await page.evaluate(h => { __dbg.SAVE.hero = h; __dbg.startLevel(1); const G = __dbg.G; __dbg.startWave(); G.spawnQ = [];
    const s = G.map.spawn; __dbg.tp(29 * 48, 11 * 48 + 24); // bridge end in level 2, facing west
    for (let i = 0; i < 9; i++) __dbg.spawnOrc(['grunt', 'grunt', 'archer', 'bat', 'kobold'][i % 5], 24 * 48 + (i % 3) * 30, 10.4 * 48 + Math.floor(i / 3) * 40); }, hero);
  await page.mouse.move(380, 330);
  const hp0 = await page.evaluate(() => __dbg.G.enemies.reduce((a, e) => a + e.hp, 0));
  await page.mouse.down(); await page.waitForTimeout(900);
  await page.mouse.click(400, 340, {button: 'right'}); await page.waitForTimeout(250);
  await page.screenshot({path: `${SH}/h_${hero}_1.png`});
  await page.keyboard.press('KeyQ'); await page.waitForTimeout(350);
  await page.screenshot({path: `${SH}/h_${hero}_2.png`});
  await page.waitForTimeout(800);
  await page.keyboard.press('Space'); await page.waitForTimeout(120);
  await page.screenshot({path: `${SH}/h_${hero}_3.png`});
  await page.mouse.up(); await page.waitForTimeout(300);
  const r = await page.evaluate(() => { const G = __dbg.G; return {dmg: Math.round(G.enemies.reduce((a, e) => a + (e.mhp - Math.max(0, e.hp)), 0)), kills: G.stats.kills, mp: Math.round(__dbg.ME.mp), turrets: G.turrets.length, pets: G.pets.length, zones: G.zones.length, x: Math.round(__dbg.ME.x)}; });
  console.log(hero, JSON.stringify(r));
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close();
