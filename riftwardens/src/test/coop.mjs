// Two-client co-op test with a local PeerJS server.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import {spawn} from 'node:child_process';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots';
const peerSrv = spawn('node', ['/home/claude/riftwork/test/peersrv.cjs', '9123'], {stdio: 'ignore'});
await new Promise(r => setTimeout(r, 1500));
const srv = http.createServer((q, s) => { const f = path.join(ROOT, q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const port = srv.address().port;
const unpkg = fs.readFileSync('/home/claude/riftwork/node_modules/peerjs/dist/peerjs.min.js', 'utf8');
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu', '--disable-features=WebRtcHideLocalIpsWithMdns', '--use-fake-ui-for-media-stream']});
const errs = [];
async function mk(name, vp) {
  const ctx = await browser.newContext({viewport: vp});
  await ctx.route(/peerjs\.min\.js/, r => r.fulfill({status: 200, contentType: 'text/javascript', body: unpkg}));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(name + ': ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  pg.on('console', m => { if (m.type() === 'error' && !/404|ERR_|favicon/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/test.html?unlockall&peerhost=127.0.0.1&peerport=9123`);
  await pg.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'), null, {timeout: 30000});
  return pg;
}
const H = await mk('host', {width: 1100, height: 680});
const Gp = await mk('guest', {width: 1024, height: 700});
await Gp.evaluate(() => { __dbg.SAVE.hero = 'alch'; __dbg.SAVE.name = '小明'; });
await H.evaluate(() => { __dbg.SAVE.name = '房主'; __dbg.SAVE.hero = 'paladin'; });
await H.click('#bHost');
await H.waitForFunction(() => __dbg.NET.peer && __dbg.NET.peer.open, null, {timeout: 20000});
const code = await H.evaluate(() => __dbg.NET.code);
console.log('room', code);
await Gp.fill('#code', code); await Gp.click('#bJoin');
await H.waitForFunction(() => !!__dbg.NET.peerInfo, null, {timeout: 20000});
await Gp.waitForTimeout(800);
await H.screenshot({path: SH + '/c01_host_lobby.png'}); await Gp.screenshot({path: SH + '/c02_guest_lobby.png'});
await H.evaluate(() => __dbg.startLevel(0));
await Gp.waitForFunction(() => __dbg.STATE === 'play', null, {timeout: 10000});
console.log('guest in play');
// guest places a trap via the real action path
await Gp.waitForTimeout(500);
const gp = await Gp.evaluate(() => { const G = __dbg.G, ME = __dbg.ME; const s = G.map.spawn; // nearest floor tile with flow
  for (let r = 2; r < 6; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { const x = s.x + dx, y = s.y + dy; if (G.map.t[y * G.map.w + x] === 0 && G.trapAt[y * G.map.w + x] < 0 && !(x === s.x && y === s.y) && !G.map.rifts.some(q => q.x === x && q.y === y)) { __dbg.act({t: 'place', k: 'spikes', tx: x, ty: y, r: 0}); return [x, y]; } } });
await Gp.waitForTimeout(700);
const ht = await H.evaluate(() => __dbg.G.traps.map(t => [t.k, t.tx, t.ty, t.own]));
const gt = await Gp.evaluate(() => __dbg.G.traps.map(t => [t.k, t.tx, t.ty]));
console.log('guest placed', gp, 'host traps', JSON.stringify(ht), 'guest view', JSON.stringify(gt), 'gold H/G', await H.evaluate(() => __dbg.G.gold), await Gp.evaluate(() => __dbg.G.gold));
// both ready
await H.keyboard.press('KeyG'); await Gp.waitForTimeout(300);
console.log('phase after host ready', await H.evaluate(() => __dbg.G.phase));
await Gp.keyboard.press('KeyG'); await Gp.waitForTimeout(800);
console.log('phase after both ready', await H.evaluate(() => __dbg.G.phase), await Gp.evaluate(() => __dbg.G.phase));
// move both players toward gate; guest shoots
for (let i = 0; i < 6; i++) {
  await H.evaluate(() => { const e = __dbg.G.enemies.find(e => !e.dead); if (e) __dbg.tp(e.x + 140, e.y + 40); });
  const target = await H.evaluate(() => { const e = __dbg.G.enemies.find(e => !e.dead); return e ? [e.x, e.y] : null; });
  if (target) await Gp.evaluate(([x, y]) => { __dbg.tp(x - 150, y + 30); }, target);
  await Gp.mouse.move(400, 300); await Gp.mouse.down(); await H.mouse.move(450, 300); await H.mouse.down();
  await Gp.waitForTimeout(1200);
  await Gp.mouse.up(); await H.mouse.up();
  if (i === 3) { await Gp.keyboard.press('KeyQ'); await H.keyboard.press('KeyQ'); await Gp.mouse.click(420, 300, {button: 'right'}); }
}
await H.screenshot({path: SH + '/c03_host_fight.png'}); await Gp.screenshot({path: SH + '/c04_guest_fight.png'});
const hs = await H.evaluate(() => ({ph: __dbg.G.phase, kills: __dbg.G.stats.kills, en: __dbg.G.enemies.length, p1: __dbg.P[1] && [Math.round(__dbg.P[1].x), Math.round(__dbg.P[1].y), __dbg.P[1].hp], hitsByGuest: 0}));
const gs = await Gp.evaluate(() => ({ph: __dbg.G.phase, gold: __dbg.G.gold, en: [...CL.enemies.values()].length, host: [Math.round(__dbg.P[0].x), Math.round(__dbg.P[0].y)], me: [Math.round(__dbg.ME.x), Math.round(__dbg.ME.y), __dbg.ME.hp, Math.round(__dbg.ME.mp)]}));
console.log('host', JSON.stringify(hs)); console.log('guest', JSON.stringify(gs));
// finish level on host fast, check guest result
await H.evaluate(() => { const G = __dbg.G; for (let w = 0; w < 20 && G.phase !== 'won'; w++) { if (G.phase === 'build') __dbg.startWave(); for (let i = 0; i < 60 * 120 && G.phase === 'wave'; i++) { __dbg.updWorld(1 / 60); if (i % 200 === 0) __dbg.skip(); } } });
await Gp.waitForTimeout(4000);
await H.screenshot({path: SH + '/c05_host_result.png'}); await Gp.screenshot({path: SH + '/c06_guest_result.png'});
console.log('guest best', await Gp.evaluate(() => JSON.stringify(__dbg.SAVE.best)));
// host goes to next level; guest should follow
await H.evaluate(() => __dbg.startLevel(1));
await Gp.waitForFunction(() => __dbg.G && __dbg.G.li === 1 && !__dbg.G.resShown, null, {timeout: 10000});
console.log('guest followed to level 2');
// disconnect guest -> host continues solo
await Gp.close();
await H.waitForTimeout(2500);
console.log('host after guest left: players', await H.evaluate(() => __dbg.P.length), 'state', await H.evaluate(() => __dbg.STATE));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n---\n') : 'no page errors');
await browser.close(); srv.close(); peerSrv.kill();
