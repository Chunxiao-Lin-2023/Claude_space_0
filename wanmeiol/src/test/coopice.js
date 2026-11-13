// node test/coopice.js — the network fallbacks: relay credentials compute; a join with the full ICE list; relay-only with no reachable relay falls back once, then says what this device could reach (~60s)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [], out = [];
  const mk = async url => { const pg = await b.newPage(); pg.on('pageerror', e => errs.push(e.message)); await pg.route(/unpkg|jsdelivr/, r => r.fulfill({ path: require.resolve('peerjs/dist/peerjs.min.js') })); await pg.goto(url); await pg.waitForTimeout(600); return pg; };
  const base = 'http://localhost:8770/index.html?peerhost=localhost&peerport=9000';
  // 1. credentials compute, and a normal join works with the full ICE list
  const H = await mk(base + '&icecfg=1'); await H.click('text=开始'); await H.waitForTimeout(800);
  out.push('中转凭证: ' + JSON.stringify(await H.evaluate(async () => { const l = await iceRelay(); return l.length ? { user: l[0].username, credLen: l[0].credential.length, urls: l[0].urls.length } : null; })));
  await H.evaluate(() => netHost()); await H.waitForFunction(() => NETROLE === 'host' && NET.peer && NET.peer.open, null, { timeout: 30000 }); const code = await H.evaluate(() => NET.code);
  const G = await mk(base + '&icecfg=1'); const t0 = Date.now(); await G.evaluate(c => netJoin(c), code);
  try { await G.waitForFunction(() => NETROLE === 'guest' && C, null, { timeout: 40000 }); out.push('完整 ICE 配置下加入: 成功 ' + Math.round((Date.now() - t0) / 1000) + 's'); } catch (e) { out.push('完整 ICE 配置下加入: 失败 ' + await G.evaluate(() => NET.status)); }
  await G.close();
  // 2. relay-only with no reachable relay (this sandbox can't reach TURN): must fall back once, then explain
  const G2 = await mk(base + '&icecfg=relay'); const seen = []; const t1 = Date.now(); await G2.evaluate(c => { const o = titleStatus; titleStatus = s => { (window.__st = window.__st || []).push(Math.round(performance.now() / 1000) + 's ' + s); o(s); }; netJoin(c); }, code);
  await G2.waitForFunction(() => /打不通/.test(NET.status) && /直连和中转都试过了/.test(NET.status), null, { timeout: 150000 }).catch(() => {});
  out.push('只能走中转、又连不上中转: ' + Math.round((Date.now() - t1) / 1000) + 's\n  ' + (await G2.evaluate(() => (window.__st || []).join('\n  '))));
  console.log(out.join('\n')); console.log('errors', errs); await b.close(); })();
