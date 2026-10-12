// iPhone audit v2 (IPHONE.md): every screen incl. round-2/3 UI; checks primary buttons reachable without scroll,
// clipped-and-unscrollable content, off-screen controls and HUD overlaps. Desktop/iPad shots go to OUT for diffing.
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/claude/riftwork/out', OUT = process.env.SHOTS || '/home/claude/riftwork/test/shots/phone2';
fs.mkdirSync(OUT, {recursive: true});
const srv = http.createServer((q, s) => { let u = q.url.split('?')[0]; if (u.startsWith('/riftwardens/')) u = '/test.html'; fs.readFile(path.join(ROOT, u), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': 'text/html'}); s.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu']});
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const VPS = (process.argv[2] || 'p393x852,p375x667,l852x393,l852x340,l667x375,d1280x800,i1180x820,i820x1180').split(',');
const errs = [], issues = [];
const check = (pg, primary) => pg.evaluate((primary) => {
  const out = []; const W = innerWidth, H = innerHeight; const M = document.querySelector('#menu');
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none'; };
  // 1. clipped-and-unscrollable: anything in menu above the top when scrolled to top, or right/left overflow
  if (M && !M.classList.contains('off')) {
    M.scrollTop = 0; const box = M.firstElementChild;
    if (box) { const r = box.getBoundingClientRect(); if (r.top < -1) out.push('MENU TOP CLIPPED ' + Math.round(r.top)); if (r.left < -1 || r.right > W + 1) out.push('MENU X OVERFLOW ' + Math.round(r.left) + ',' + Math.round(r.right)); }
    for (const el of M.querySelectorAll('button,input')) { if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.right > W + 1 || r.left < -1) out.push('X-OFF ' + (el.id || el.textContent.trim().slice(0, 8))); }
  }
  // 2. primary button reachable without scrolling
  for (const id of primary) { const el = document.getElementById(id); if (!el) { out.push('MISSING #' + id); continue; } const r = el.getBoundingClientRect(); if (r.bottom > H + 1 || r.top < -1) out.push('PRIMARY NEEDS SCROLL #' + id + ' bottom=' + Math.round(r.bottom) + '/' + H); }
  // 3. HUD controls on screen, no overlaps
  const hud = [...document.querySelectorAll('#tl,#tc,#hudBtns,#mini,#bl,#bar,#ally,#perks,#tut,#touch .tb')].filter(e => vis(e) && (e.closest('#touch') ? e.closest('#touch').classList.contains('on') : true));
  for (const e of hud) { const r = e.getBoundingClientRect(); if (r.right > W + 1 || r.left < -1 || r.bottom > H + 1 || r.top < -1) out.push('HUD-OFF #' + (e.id || e.className) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round)); }
  for (let i = 0; i < hud.length; i++) for (let j = i + 1; j < hud.length; j++) { const a = hud[i].getBoundingClientRect(), b = hud[j].getBoundingClientRect(); if (a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2) out.push('OVERLAP ' + (hud[i].id || hud[i].className) + ' x ' + (hud[j].id || hud[j].className)); }
  // 4. small tap targets on phone
  if (matchMedia('(pointer:coarse) and (max-height:500px), (pointer:coarse) and (max-width:500px)').matches)
    for (const el of document.querySelectorAll('#menu button, #hud button, #touch.on .tb')) { if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.height < 39 && r.width < 200) out.push('SMALL ' + (el.id || el.className || el.textContent.trim().slice(0, 6)) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
  return out;
}, primary);
for (const v of VPS) {
  const kind = v[0], [w, h] = v.slice(1).split('x').map(Number), phone = kind === 'p' || kind === 'l';
  const ctx = await browser.newContext({viewport: {width: w, height: h}, hasTouch: kind !== 'd', isMobile: phone, deviceScaleFactor: 1, userAgent: phone ? UA : undefined});
  const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(v + ': ' + e.message));
  await pg.goto(`http://127.0.0.1:${port}/riftwardens/?unlockall`);
  await pg.waitForFunction(() => window.__dbg && document.querySelector('#bSolo'), null, {timeout: 30000});
  await pg.evaluate(() => { Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); });
  await pg.waitForTimeout(500);
  const shot = async (n, primary = [], still = true) => { if (still) await pg.evaluate(() => { const M = document.querySelector('#menu'); if (M) M.scrollTop = 0; }); await pg.screenshot({path: `${OUT}/${v}_${n}.png`}); const o = await check(pg, primary); if (o.length) issues.push(`${v} ${n}: ` + o.join(' | ')); };
  await shot('01title', ['bSolo']);
  await pg.evaluate(() => document.querySelector('#bHelp').click()); await pg.waitForTimeout(150); await shot('02help', ['bBack']);
  await pg.evaluate(() => __dbg.levelScreen()); await pg.waitForTimeout(150); await shot('03levels', ['bStart']);
  await pg.evaluate(() => document.querySelector('.mtab[data-m="endless"]').click()); await pg.waitForTimeout(150); await shot('04endless', ['bStart']);
  await pg.evaluate(() => document.querySelector('.mtab[data-m="daily"]').click()); await pg.waitForTimeout(150); await shot('05daily', ['bStart']);
  await pg.evaluate(() => document.querySelector('#tbArm').click()); await pg.waitForTimeout(150); await shot('06armory');
  await pg.evaluate(() => { const S = __dbg.SAVE; S.hero = 'paladin'; S.tut = 0; __dbg.startLevel(0); }); await pg.waitForTimeout(500); await shot('07tutorial');
  await pg.evaluate(() => { __dbg.SAVE.tut = 1; __dbg.startLevel(1); }); await pg.waitForTimeout(400); await shot('08build', ['readyBtn']);
  await pg.evaluate(() => { __dbg.startWave(); giveXp(0, 400); }); await pg.waitForTimeout(1200); await shot('09wave_perks');
  await pg.evaluate(() => togglePause()); await pg.waitForTimeout(150); await shot('10pause', ['pRes']);
  await pg.evaluate(() => document.querySelector('#pHelp').click()); await pg.waitForTimeout(150); await shot('11pausehelp');
  await pg.evaluate(() => { hideMenu(); PAUSED = false; __dbg.endLevel(true); __dbg.G.endT2 = 9; }); await pg.waitForTimeout(700); await shot('12result', ['rNext']);
  await pg.evaluate(() => { __dbg.startLevel(0, 'endless'); const G = __dbg.G; G.wave = 7; __dbg.endLevel(false); G.endT2 = 9; }); await pg.waitForTimeout(700); await shot('13endlessres');
  await pg.evaluate(() => { __dbg.startLevel(2); __dbg.endLevel(false); __dbg.G.endT2 = 9; }); await pg.waitForTimeout(700); await shot('14lost', ['rRe']);
  await ctx.close();
}
console.log(issues.length ? 'ISSUES:\n' + issues.join('\n') : 'no layout issues');
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
await browser.close(); srv.close();
