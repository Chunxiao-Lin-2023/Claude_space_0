// Round-3 probe: guardians, pendulum, alt weapons, trinkets, perks, endless, daily, challenges, hazards, doors, ping/revive, tutorial.
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
  const out = {}; const step = n => { for (let i = 0; i < n; i++) __dbg.updWorld(1 / 30); };
  const S = __dbg.SAVE; S.traps = {spikes: 1, barricade: 1, tar: 1, arrow: 1, spring: 1, brim: 1, frost: 1, grinder: 1, pendulum: 1, gxbow: 1, gknight: 1}; S.weapons = {warmage: 1, sorc: 1, paladin: 1, ranger: 1, alch: 1, blade: 1}; S.trinkets = ['heart', 'purse']; S.equip = ['heart', 'purse']; S.tut = 1;
  __dbg.startLevel(0); let G = __dbg.G, ME = __dbg.ME; __dbg.give(50000);
  out.mhpWithHeart = ME.mhp;
  // guardians + pendulum on the corridor
  __dbg.tp(4 * 48, 9 * 48); out.gk = __dbg.placeTrap(ME, 'gknight', 4, 11, 0); out.gx = __dbg.placeTrap(ME, 'gxbow', 5, 13, 0); out.pd = __dbg.placeTrap(ME, 'pendulum', 4, 15, 0);
  out.flowBlockedByKnight = barricadeAt(4, 11);
  G.phase = 'wave'; G.spawnQ = [{t: 1e9, g: 0, type: 'grunt'}];
  for (let i = 0; i < 6; i++) __dbg.spawnOrc('grunt', 4 * 48 + 24 + (i % 2) * 20, 6 * 48 + i * 10);
  const k0 = G.stats.kills; step(400);
  out.kills = G.stats.kills - k0; out.trapKills = G.stats.trapKills; const kn = G.traps.find(t => t.k === 'gknight'); out.knightHp = kn ? Math.round(kn.hp) : 'destroyed';
  out.goldTrinket = ME.mods.gold; out.xp = ME.xp; out.lvl = ME.lvl; out.pick = ME.pick.length;
  if (ME.pick.length) { const id = ME.pick[0][0]; doAction(ME, {t: 'perk', id}); out.perkTaken = id; out.perks = JSON.stringify(ME.perks); }
  // alternate weapons fire
  const res = {};
  for (const h of ['warmage', 'sorc', 'paladin', 'ranger', 'alch', 'blade']) {
    S.hero = h; __dbg.startLevel(1); G = __dbg.G; ME = __dbg.ME; G.phase = 'wave'; G.spawnQ = [{t: 1e9, g: 0, type: 'grunt'}];
    __dbg.tp(29 * 48, 11 * 48 + 24); ME.wpn = 1;
    for (let i = 0; i < 5; i++) { const e = __dbg.spawnOrc('grunt', 26 * 48, 10.5 * 48 + i * 18); e.atkCd = 99; }
    const hp0 = G.enemies.reduce((a, e) => a + e.hp, 0);
    for (let i = 0; i < 6; i++) { doAction(ME, {t: 'fire', a: Math.PI, x: 26 * 48, y: 11 * 48, w: 1}); step(6); }
    step(20); res[h] = Math.round(hp0 - G.enemies.reduce((a, e) => a + Math.max(0, e.hp), 0));
  }
  out.altWeaponDmg = res;
  // endless waves
  __dbg.startLevel(0, 'endless'); G = __dbg.G; out.endlessW1 = JSON.stringify(waveDef(0)).length > 5; out.endlessW10boss = waveDef(9).some(g => g[1] === 'chief'); out.nWaves = String(G.nWaves);
  // daily
  const ds = dailySpec(); __dbg.startLevel(ds.li, 'daily'); G = __dbg.G; out.daily = {mod: G.mod, li: ds.li, allowT: G.allowT, gold: G.gold};
  // lava eruption on map 2
  __dbg.startLevel(1); G = __dbg.G; G.phase = 'wave'; G.spawnQ = [{t: 1e9, g: 0, type: 'grunt'}]; G.hz.t = 0; const nl = G.hz.lava.length; step(80); out.lavaTiles = nl; out.erupted = G.ev.some(e => e.k === 'erupt') || 'n/a(ev pruned)';
  // doors on map 4
  __dbg.startLevel(3); G = __dbg.G; const before = G.flow[tIdx(G.map.gates[2].x, G.map.gates[2].y)]; G.wave = 4; G.phase = 'wave'; G.spawnQ = [{t: 1e9, g: 0, type: 'grunt'}]; step(2); out.doorsOpen = G.doorOpen; out.gateCPath = [Math.round(before), Math.round(G.flow[tIdx(G.map.gates[2].x, G.map.gates[2].y)])];
  // revive speed
  __dbg.startLevel(0); G = __dbg.G; ME = __dbg.ME; const other = initPlayer(mkPlayer(1, 'sorc', 'B', {})); __dbg.P[1] = other; other.dead = true; other.rt = 6; other.x = ME.x + 20; other.y = ME.y; step(30); out.reviveRt = +other.rt.toFixed(2);
  // challenges evaluation
  out.chalM1 = CHALLENGES.m1.map(c => c.ok({falls: 9, bars: 0}));
  return out;
});
console.log(JSON.stringify(R));
// visual: guardians & pendulum & perk picker & tutorial
await page.evaluate(() => { __dbg.SAVE.tut = 0; __dbg.SAVE.hero = 'paladin'; __dbg.startLevel(0); const ME = __dbg.ME, G = __dbg.G; __dbg.give(9000); __dbg.tp(28 * 48, 9 * 48); __dbg.placeTrap(ME, 'gknight', 27, 10, 0); __dbg.placeTrap(ME, 'gxbow', 26, 8, 0); __dbg.placeTrap(ME, 'pendulum', 29, 10, 1); __dbg.startWave(); G.spawnQ = []; for (let i = 0; i < 4; i++) __dbg.spawnOrc('grunt', 24 * 48, 9 * 48 + i * 20); giveXp(0, 200); });
await page.waitForTimeout(1500); await page.screenshot({path: SH + '/r3_guard.png'});
await page.evaluate(() => __dbg.levelScreen()); await page.waitForTimeout(300); await page.click('.mtab[data-m="daily"]'); await page.waitForTimeout(200); await page.screenshot({path: SH + '/r3_daily.png'});
await page.click('#tbArm'); await page.waitForTimeout(200); await page.evaluate(() => document.querySelector('#armT').scrollIntoView()); await page.screenshot({path: SH + '/r3_armory.png'});
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close();
