// node test/coopnew.js — the title's 和朋友一起玩 door: host on the current save or start fresh in an empty slot; a friend joins either way
const { chromium } = require('playwright');
const URL = 'http://localhost:8770/index.html?peerhost=localhost&peerport=9000';
(async () => { const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [], out = [];
  const mk = async (vp, mob) => { const ctx = await b.newContext(Object.assign({ viewport: vp }, mob ? { isMobile: true, hasTouch: true } : {})); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message)); await pg.route(/unpkg|jsdelivr/, r => r.fulfill({ path: require.resolve('peerjs/dist/peerjs.min.js') })); await pg.goto(URL); await pg.waitForTimeout(600); return pg; };
  const st = pg => pg.evaluate(() => JSON.stringify([STATE.mode, SLOT, NETROLE, NET.code, NET.peer && NET.peer.open, NET.status]));
  const H = await mk({ width: 390, height: 844 }, 1);
  await H.click('text=开始'); await H.waitForTimeout(800); await H.evaluate(() => { save(true); toTitle(); }); await H.waitForTimeout(300);
  await H.click('button:has-text("和朋友一起玩")'); await H.waitForTimeout(300);
  out.push('一起玩页面: ' + (await H.evaluate(() => [...document.querySelectorAll('#tbx button')].map(b => b.innerText.split('\n')[0]).join(' | '))));
  await H.click('button:has-text("新开一局，开房间")');
  try { await H.waitForFunction(() => NETROLE === 'host' && NET.peer && NET.peer.open, null, { timeout: 20000 }); } catch (e) { out.push('房主没开成: ' + await st(H)); }
  out.push('新开一局: ' + await st(H));
  const G = await mk({ width: 1280, height: 800 }); await G.evaluate(() => { const o = guestRecv; guestRecv = m => { (window.__rx = window.__rx || []).push(m.t); return o(m); }; }); await G.fill('#tjoin', await H.evaluate(() => NET.code)); await G.click('button:has-text("加入")');
  try { await G.waitForFunction(() => NETROLE === 'guest' && C, null, { timeout: 30000 }); out.push('朋友加入: 第 ' + (await G.evaluate(() => C.lv)) + ' 层 · 对话框 ' + (await G.evaluate(() => !!DLG))); } catch (e) { out.push('朋友没加进来: ' + await st(G) + ' 收到: ' + (await G.evaluate(() => (window.__rx || []).join(','))) + ' | 房主日志: ' + (await H.evaluate(() => [...$('log').children].slice(-6).map(d => d.textContent.slice(0, 40)).join(' / '))) + ' | 房主连接数 ' + (await H.evaluate(() => NET.conns.size))); }
  const H2 = await mk({ width: 1280, height: 800 }); await H2.evaluate(() => slotsShow()); out.push('空存档位的按钮: ' + (await H2.evaluate(() => [...document.querySelectorAll('.slot')].map(x => [...x.querySelectorAll('button')].map(b => b.textContent).join('/'))[0])));
  console.log(out.join('\n')); console.log('errors', errs); await b.close(); })();
