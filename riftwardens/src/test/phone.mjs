// iPhone audit per IPHONE.md: screenshots of every screen in phone viewports + desktop/iPad regression.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', SH = '/home/claude/riftwork/test/shots/phone';
fs.mkdirSync(SH, {recursive: true});
const srv = http.createServer((q, s) => { let u = q.url.split('?')[0]; if (u.startsWith('/riftwardens/')) u = '/test.html'; fs.readFile(path.join(ROOT, u), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const VPS = (process.argv[2] || 'p393x852,p375x667,l852x393,l852x340,l667x375,d1280x800,i1180x820,i820x1180').split(',');
const errs = [], issues = [];
async function offscreen(pg, tag) {
  return pg.evaluate(() => { const out = []; const W = innerWidth, H = innerHeight;
    for (const el of document.querySelectorAll('#menu button, #menu input, #hud button, #hud .slot, #hud .pnl, #touch .tb, #mini')) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue; const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
      const sc = el.closest('#menu'); const inScroll = sc && sc.scrollHeight > sc.clientHeight + 2;
      if (r.right > W + 1 || r.left < -1 || (!inScroll && (r.bottom > H + 1 || r.top < -1))) out.push((el.id || el.className || el.tagName) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(','));
    }
    // overlaps among HUD controls
    const hud = [...document.querySelectorAll('#hud .pnl, #hud #hudBtns, #mini, #touch .tb')].filter(e => { const r = e.getBoundingClientRect(); return r.width && getComputedStyle(e).display !== 'none' && e.offsetParent !== null || (e.closest('#touch.on') && getComputedStyle(e).display !== 'none'); });
    for (let i = 0; i < hud.length; i++) for (let j = i + 1; j < hud.length; j++) { const a = hud[i].getBoundingClientRect(), b = hud[j].getBoundingClientRect(); if (!a.width || !b.width) continue; if (a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2) out.push('OVERLAP ' + (hud[i].id || hud[i].className) + ' x ' + (hud[j].id || hud[j].className)); }
    return out; });
}
for (const v of VPS) {
  const kind = v[0], [w, h] = v.slice(1).split('x').map(Number);
  const touch = kind !== 'd';
  const ctx = await browser.newContext({viewport: {width: w, height: h}, hasTouch: touch, isMobile: kind === 'p' || kind === 'l', deviceScaleFactor: 1, userAgent: kind === 'p' || kind === 'l' ? UA : undefined});
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(v + ': ' + e.message));
  await pg.goto(`http://127.0.0.1:${port}/riftwardens/?unlockall`);
  await pg.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'), null, {timeout: 30000});
  await pg.waitForTimeout(600);
  const shot = async (n) => { await pg.screenshot({path: `${SH}/${v}_${n}.png`}); const o = await offscreen(pg, n); if (o.length) issues.push(`${v} ${n}: ` + o.join(' | ')); };
  await shot('1title');
  await pg.evaluate(() => __dbg.levelScreen()); await pg.waitForTimeout(200); await shot('2levels');
  await pg.evaluate(() => { document.querySelector('#tbArm').click(); }); await pg.waitForTimeout(200); await shot('3armory');
  await pg.evaluate(() => { __dbg.SAVE.hero = 'paladin'; __dbg.startLevel(1); }); await pg.waitForTimeout(500); await shot('4build');
  await pg.evaluate(() => { __dbg.startWave(); }); await pg.waitForTimeout(1500); await shot('5wave');
  await pg.evaluate(() => togglePause()); await pg.waitForTimeout(200); await shot('6pause');
  await pg.evaluate(() => { document.querySelector('#pHelp').click(); }); await pg.waitForTimeout(200); await shot('7help');
  await pg.evaluate(() => { hideMenu(); PAUSED = false; __dbg.endLevel(true); __dbg.G.endT2 = 9; }); await pg.waitForTimeout(600); await shot('8result');
  await ctx.close();
}
console.log(issues.length ? 'ISSUES:\n' + issues.join('\n') : 'no layout issues');
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
await browser.close(); srv.close();
