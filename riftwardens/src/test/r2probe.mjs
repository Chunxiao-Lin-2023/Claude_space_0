// Round-2 mechanics probe: shield block, sapper, shaman heal, boss phases, heavy vs spring, upgrade, undo, reuse, streak, combos.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots';
const srv = http.createServer((q, s) => { fs.readFile(path.join(ROOT, q.url.split('?')[0]), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const page = await browser.newPage({viewport: {width: 1280, height: 760}});
const errs = []; page.on('pageerror', e => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'));
const R = await page.evaluate(() => {
  const out = {}; const step = (n) => { for (let i = 0; i < n; i++) __dbg.updWorld(1 / 30); };
  __dbg.SAVE.traps = {spikes: 1, barricade: 1, tar: 1, arrow: 1, spring: 1, brim: 1, frost: 1, grinder: 1};
  __dbg.startLevel(0); let G = __dbg.G, ME = __dbg.ME; __dbg.give(50000); G.phase = 'wave'; G.spawnQ = [{t: 1e9, g: 0, type: 'grunt'}];
  // shield: bolt from the front vs from behind
  const sh = __dbg.spawnOrc('shield', 5 * 48, 12 * 48); sh.dir = 6; // facing north (up)
  const h0 = sh.hp; G.projs.push({id: G.nid++, k: 'bolt', x: sh.x, y: sh.y - 140, vx: 0, vy: 900, life: 1, dmg: 50, team: 'p', own: 0, r: 6, pierce: 0, hit: []});
  for (let i = 0; i < 12; i++) { sh.dir = 6; sh.act = {t: 0, tgt: null, hit: true}; sh.x = 5 * 48; sh.y = 12 * 48; __dbg.updWorld(1 / 60); }
  out.shieldFront = Math.round(h0 - sh.hp);
  const h1 = sh.hp; G.projs.push({id: G.nid++, k: 'bolt', x: sh.x, y: sh.y + 120, vx: 0, vy: -900, life: 1, dmg: 50, team: 'p', own: 0, r: 6, pierce: 0, hit: []});
  for (let i = 0; i < 12; i++) { sh.dir = 6; sh.act = {t: 0, tgt: null, hit: true}; sh.x = 5 * 48; sh.y = 12 * 48; __dbg.updWorld(1 / 60); }
  out.shieldBack = Math.round(h1 - sh.hp);
  G.enemies.length = 0;
  // sapper: trap near path gets blown up
  __dbg.tp(4 * 48 + 24, 10 * 48 + 24 + 40); out.spikePlaced = __dbg.placeTrap(ME, 'spikes', 4, 10, 0) === '';
  const sp = __dbg.spawnOrc('sapper', 4 * 48 + 24, 7 * 48 + 24); step(120);
  out.sapperTrapsLeft = G.traps.filter(t => t.tx === 4 && t.ty === 10).length; out.sapped = G.stats.sapped || 0;
  G.enemies.length = 0;
  // shaman heals
  const g1 = __dbg.spawnOrc('grunt', 5 * 48, 9 * 48); g1.hp = 20; const sm = __dbg.spawnOrc('shaman', 5 * 48 + 30, 9 * 48); step(60);
  out.healed = Math.round(g1.hp);
  G.enemies.length = 0;
  // heavy vs spring into pit: ogre on spring pointing at the pit row
  G.traps.length = 0; G.trapAt.fill(-1);
  __dbg.tp(12 * 48, 16 * 48); out.springPlaced = __dbg.placeTrap(ME, 'spring', 12, 17, 1);
  const og = __dbg.spawnOrc('ogre', 12 * 48 + 24, 17 * 48 + 24); const gr = __dbg.spawnOrc('grunt', 12 * 48 + 24, 17 * 48 + 24);
  step(40); out.ogreFell = !!og.fall; out.gruntFell = !!gr.fall; out.combos = G.stats.combos || 0;
  // upgrade + barricade cap
  G.phase = 'build'; G.enemies.length = 0;
  __dbg.tp(4 * 48, 12 * 48); __dbg.placeTrap(ME, 'spikes', 4, 12, 0);
  const g0 = G.gold; out.upg = doAction(ME, {t: 'upg', tx: 4, ty: 12}); out.upgLv = G.traps.find(t => t.tx === 4 && t.ty === 12).lv; out.upgCost = g0 - G.gold;
  let nb = 0; for (let y = 8; y < 16; y++) for (let x = 3; x < 7; x++) if (!__dbg.placeTrap(ME, 'barricade', x, y, 0)) nb++;
  out.barricades = nb; out.barCost = Math.round(G.barCost);
  // streak
  G.phase = 'wave'; for (let i = 0; i < 7; i++) { const e = __dbg.spawnOrc('kobold', 20 * 48, 12 * 48); killEnemy(e, {p: 0}); }
  const gs = G.gold; step(100); out.streakBonus = G.gold - gs;
  // boss phases
  G.enemies.length = 0; const b = __dbg.spawnOrc('chief', 20 * 48, 12 * 48); b.hp = b.mhp * 0.45; step(5); out.bossPh1 = b.ph; out.minions = G.enemies.length - 1;
  b.hp = b.mhp * 0.3; step(2); out.bossCharge = !!b.chg; b.hp = b.mhp * 0.15; step(60); out.bossPh = b.ph; out.enr = b.enr;
  return out;
});
console.log(JSON.stringify(R, null, 0));
// UI: undo + reuse + speed + overview via real input
await page.evaluate(() => { __dbg.startLevel(0); __dbg.give(5000); });
await page.keyboard.press('Digit2'); await page.mouse.move(640, 300); await page.waitForTimeout(100);
await page.mouse.click(640, 300); await page.mouse.click(700, 330); await page.waitForTimeout(200);
const n1 = await page.evaluate(() => __dbg.G.traps.length);
await page.keyboard.press('KeyZ'); await page.waitForTimeout(200);
const n2 = await page.evaluate(() => __dbg.G.traps.length);
await page.keyboard.press('KeyV'); await page.waitForTimeout(900); await page.screenshot({path: SH + '/r2_overview.png'});
await page.keyboard.press('KeyV'); await page.keyboard.press('Digit1'); await page.keyboard.press('KeyF');
const sc = await page.evaluate(() => TIME_SCALE);
await page.evaluate(() => { const ME = __dbg.ME; __dbg.placeTrap(ME, 'spikes', 4, 9, 0); __dbg.placeTrap(ME, 'tar', 4, 10, 0); saveLayout(); __dbg.startLevel(0); }); await page.waitForTimeout(300);
const reuseVisible = await page.evaluate(() => getComputedStyle(document.querySelector('#bReuse')).display !== 'none');
await page.evaluate(() => reuseLayout()); const n3 = await page.evaluate(() => __dbg.G.traps.length);
console.log('ui', {placed: n1, afterUndo: n2, speed: sc, reuseVisible, reused: n3});
// boss fight visual
await page.evaluate(() => { __dbg.SAVE.hero = 'warmage'; __dbg.startLevel(3); __dbg.startWave(); const G = __dbg.G; G.spawnQ = []; const g = G.map.gates[1]; const b = __dbg.spawnOrc('chief', g.x * 48 + 24, g.y * 48 + 90); b.hp = b.mhp * 0.49; __dbg.tp(b.x, b.y + 200); for (let i = 0; i < 3; i++) { __dbg.spawnOrc('shield', b.x - 60 + i * 50, b.y + 80); } __dbg.spawnOrc('shaman', b.x + 80, b.y); });
await page.waitForTimeout(1200); await page.screenshot({path: SH + '/r2_boss.png'});
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close();
