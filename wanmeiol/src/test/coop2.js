// node test/coop2.js — co-op when the network misbehaves: the host's socket drops / the host is away a while / the friend types the code before the room is up / a wrong code
const { chromium } = require('playwright');
const URL = 'http://localhost:8770/index.html?peerhost=localhost&peerport=9000';
(async () => { const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [];
  const mk = async () => { const pg = await b.newPage(); pg.on('pageerror', e => errs.push(e.message)); await pg.route(/unpkg|jsdelivr/, r => r.fulfill({ path: require.resolve('peerjs/dist/peerjs.min.js') })); await pg.goto(URL); await pg.waitForTimeout(600); return pg; };
  const host = async () => { const H = await mk(); await H.click('text=开始'); await H.waitForTimeout(1200); for (let i = 0; i < 20; i++) { if (!await H.$('#dlg .tx')) break; await H.keyboard.press('Enter'); await H.waitForTimeout(120); } await H.evaluate(() => netHost()); await H.waitForFunction(() => NETROLE === 'host' && NET.peer.open, null, { timeout: 30000 }); return H; };
  const join = async (code, ms = 60000) => { const G = await mk(); const t0 = Date.now(); await G.evaluate(c => netJoin(c), code); let st = ''; try { await G.waitForFunction(() => NETROLE === 'guest' && C, null, { timeout: ms }); st = 'joined'; } catch (e) { st = 'FAILED: ' + await G.evaluate(() => NET.status); } return [G, st + ' (' + Math.round((Date.now() - t0) / 1000) + 's)']; };
  const out = [];
  // 1. host's socket drops (page asleep): socket closed underneath
  { const H = await host(); const code = await H.evaluate(() => NET.code); await H.evaluate(() => { NET.peer.socket._socket.close(); }); await H.waitForTimeout(1500); await H.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    const [G, st] = await join(code); out.push('1 房主掉线后好友加入: ' + st + ' | 房间码不变: ' + (code === await H.evaluate(() => NET.code))); await G.close(); await H.close(); }
  // 2. host's server id is lost entirely (destroyed peer, as if the server dropped it): revive under the same code
  { const H = await host(); const code = await H.evaluate(() => NET.code); await H.evaluate(() => { NET.peer.disconnect(); }); await H.waitForTimeout(12000);
    const [G, st] = await join(code); out.push('2 房主断开一阵后: ' + st + ' | 房间码不变: ' + (code === await H.evaluate(() => NET.code))); await G.close(); await H.close(); }
  // 3. friend types the code before the host's room is up
  { const G = await mk(); const H0 = await mk(); await H0.click('text=开始'); await H0.waitForTimeout(1000); for (let i = 0; i < 20; i++) { if (!await H0.$('#dlg .tx')) break; await H0.keyboard.press('Enter'); await H0.waitForTimeout(120); }
    const code = 'AAAA'; await H0.evaluate(() => loadPeer());
    const t0 = Date.now(); await G.evaluate(c => netJoin(c), code); await G.waitForTimeout(4000); await H0.evaluate(() => { const r = Math.random; let n = 0; Math.random = () => (n++ < 4 ? 0 : r()); netHost(); });
    let st; try { await G.waitForFunction(() => NETROLE === 'guest' && C, null, { timeout: 60000 }); st = 'joined'; } catch (e) { st = 'FAILED: ' + await G.evaluate(() => NET.status); } out.push('3 好友先输码、房主后开房: ' + st + ' (' + Math.round((Date.now() - t0) / 1000) + 's)'); await G.close(); await H0.close(); }
  // 4. a code nobody holds
  { const [G, st] = await join('ZZZZ', 80000); out.push('4 错误房间码: ' + st); await G.close(); }
  console.log(out.join('\n')); console.log('errors', errs.slice(0, 5)); await b.close(); })();
