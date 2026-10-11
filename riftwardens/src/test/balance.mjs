// Balance bot: scripted trap building + auto-aiming hero; reports leaks per level/difficulty.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out';
const srv = http.createServer((q, s) => { fs.readFile(path.join(ROOT, q.url.split('?')[0]), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const page = await browser.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'));
const hero = process.argv[2] || 'warmage', heroOn = process.argv[3] !== 'nohero';
const rows = [];
for (const diff of (process.argv[4] || 'easy,normal,nightmare').split(',')) for (let li = 0; li < 4; li++) {
  const r = await page.evaluate(([li, diff, hero, heroOn]) => {
    const S = __dbg.SAVE; S.diff = diff; S.hero = hero; S.traps = {spikes: 2, barricade: 1, tar: 1, arrow: 2, spring: 1, brim: 1, frost: 1, grinder: 1, pendulum: 1, gxbow: 1, gknight: 1}; S.equip = []; S.tut = 1;
    __dbg.startLevel(li); const G = __dbg.G, ME = __dbg.ME; const m = G.map;
    const build = () => { // walk outward from rift along the flow field, alternating floor traps; arrow walls on side walls
      const tiles = []; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const d = G.flow[y * m.w + x]; if (d > 2 && d < 1e8) tiles.push([d, x, y]); }
      tiles.sort((a, b) => a[0] - b[0]); let i = 0;
      const plan = ['spikes', 'tar', 'spikes', 'arrow', 'brim', 'spikes', 'frost', 'arrow'];
      for (const [, x, y] of tiles) { if (G.gold < 300) break; const k = plan[i % plan.length];
        if (k === 'arrow') { for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (m.t[(y + dy) * m.w + x + dx] === 1) { ME.x = x * 48 + 24; ME.y = y * 48 + 24; if (!__dbg.placeTrap(ME, 'arrow', x + dx, y + dy, 0)) { i++; break; } } }
        else { ME.x = x * 48 + 24; ME.y = y * 48 + 24; __dbg.placeTrap(ME, k, x, y, 0); i++; } }
      // spend leftovers on upgrades nearest the rift
      for (const t of G.traps.slice().sort((a, b) => G.flow[b.ty * m.w + b.tx] - G.flow[a.ty * m.w + a.tx]).reverse()) { if (G.gold < 400) break; ME.x = t.tx * 48 + 24; ME.y = t.ty * 48 + 24; __dbg.upgradeTrap && __dbg.upgradeTrap(ME, t.tx, t.ty); }
      const s = spawnPoint(); ME.x = s.x; ME.y = s.y;
    };
    const perWave = []; let guard = 0;
    while (G.phase !== 'won' && G.phase !== 'lost' && guard++ < 20) {
      build(); const r0 = G.rift; __dbg.startWave(); let t = 0, ft = 0;
      while (G.phase === 'wave' && t < 400) {
        if (heroOn && !ME.dead) { // simple hero AI: shoot nearest enemy within 460
          ft -= 1 / 30; let best = null, bd = 460 * 460; for (const e of G.enemies) { if (!alive(e)) continue; const d = dist2(e.x, e.y, ME.x, ME.y); if (d < bd) { bd = d; best = e; } }
          if (best && ft <= 0) { ft = 1 / primOf(ME).rate; const a = Math.atan2(best.y - 14 - (ME.y - 26), best.x - ME.x); ME.aim = a; doAction(ME, {t: 'fire', a, x: best.x, y: best.y}); if (ME.mp > 60) doAction(ME, {t: 'skill', a, x: best.x, y: best.y}); }
        }
        __dbg.updWorld(1 / 30); t += 1 / 30;
      }
      perWave.push(r0 - G.rift);
    }
    return {li, diff, res: G.phase, rift: G.rift + '/' + G.riftMax, skulls: G.result ? G.result.skulls : 0, leaks: perWave.join(' '), gold: G.gold, kills: G.stats.kills};
  }, [li, diff, hero, heroOn]);
  rows.push(r); console.log(`${diff.padEnd(9)} L${li + 1}  ${r.res.padEnd(4)} rift ${r.rift.padEnd(6)} skulls ${r.skulls}  leaks/wave [${r.leaks}]  kills ${r.kills}  goldLeft ${r.gold}`);
}
console.log(errs.length ? 'ERRORS: ' + errs.join('\n') : 'no page errors');
await browser.close(); srv.close();
