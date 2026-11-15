// node test/trans.js — 换地点的过场（RULES 38）：走路过场、打车过场、点一下跳过、自动走（分段）、关掉动画就没有。SHOT=目录 存截图
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 760 } }); const errs = [], ok = [], bad = []; const chk = (n, v) => (v ? ok : bad).push(n);
  pg.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.evaluate(async () => { const D = __dbg; D.nosave = true; D.SET.snd = 0; D.SET.mus = 0; D.slotNew(1); await new Promise(r => setTimeout(r, 60)); D.STATE.run++; D.STATE.scene = null; D.STATE.busy = false; D.DLG.cur = null; D.DLG.res = null; document.querySelector('#card').classList.remove('on'); document.querySelector('#cine').className = ''; D.C.tick = 0; D.go('pk_gate', true, true); D.C.f.a_pingan = 1; D.C.f.a_muyang = 1; D.refresh(); D.trans = true; });
  const shot = async n => { if (process.env.SHOT) await pg.screenshot({ path: process.env.SHOT + '/' + n + '.png' }); };
  // 1. 点出口：过场中地点在中途换掉，过场结束后到了
  const ex = await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /goT\(/.test(x.getAttribute('onclick') || '')); return b ? b.getAttribute('onclick') : null; });
  chk('exit buttons use the walking transition (' + ex + ')', !!ex);
  const to = await pg.evaluate(() => exitsOf(__dbg.C.loc)[0][1]);
  await pg.evaluate(to => { window.__p = goT(to); }, to); await pg.waitForTimeout(150);
  const mid0 = await pg.evaluate(() => ({ on: document.querySelector('#ptr').classList.contains('on'), loc: __dbg.C.loc }));
  await pg.waitForTimeout(500); await shot('walk'); const mid1 = await pg.evaluate(to => ({ want: PLACES[to].name, t: document.querySelector('#ptr .pt-t').textContent, show: document.querySelector('#ptr').classList.contains('show'), loc: __dbg.C.loc }), to);
  await pg.evaluate(() => window.__p); const end = await pg.evaluate(() => ({ on: document.querySelector('#ptr').classList.contains('on'), loc: __dbg.C.loc }));
  chk('walk: overlay on, still at the old place at first (' + JSON.stringify(mid0) + ')', mid0.on && mid0.loc === 'pk_gate');
  chk('walk: place name shows and the move happens under the black (' + JSON.stringify(mid1) + ')', mid1.show && mid1.loc === to && mid1.t === mid1.want);
  chk('walk: overlay gone at the end, arrived', !end.on && end.loc === to);
  // 2. 点一下跳过
  const sk = await pg.evaluate(async () => { const D = __dbg; D.go('pk_gate', true, true); D.refresh(); const to = exitsOf('pk_gate')[0][1]; const t0 = performance.now(); const p = goT(to); await new Promise(r => setTimeout(r, 60)); document.querySelector('#ptr').click(); await p; return { ms: Math.round(performance.now() - t0), loc: D.C.loc === to }; });
  chk('tap skips the transition (' + JSON.stringify(sk) + ')', sk.loc && sk.ms < 500);
  // 3. 打车
  await pg.evaluate(() => { const D = __dbg; D.go('pk_gate', true, true); D.refresh(); window.__p = travel('pingan'); }); await pg.waitForTimeout(1300); await shot('taxi');
  const tx = await pg.evaluate(() => ({ taxi: document.querySelector('#ptr').classList.contains('taxi'), t: document.querySelector('#ptr .pt-t').textContent, n: document.querySelector('#ptr .pt-n').textContent }));
  await pg.evaluate(() => window.__p); const tloc = await pg.evaluate(() => PLACES[__dbg.C.loc].area);
  chk('taxi: road animation, area name and a line from the ride (' + JSON.stringify(tx) + ')', tx.taxi && tx.t === '平安公寓' && tx.n.length > 4 && tloc === 'pingan');
  // 4. 自动走：跨区域 = 打车过场 + 走路过场
  const aw = await pg.evaluate(async () => { const D = __dbg; D.go('pk_shop', true, true); D.refresh(); const seen = []; const o = ptrShow; window.ptrShow = function (x, m) { seen.push(x.kind + ':' + x.title); return o(x, m); }; const tgt = Object.keys(PLACES).find(k => PLACES[k].area === 'pingan' && k !== ENTRY.pingan && route(D.C.loc, k)); const r = await autoWalk(tgt); window.ptrShow = o; return { r, seen, loc: D.C.loc === tgt }; });
  chk('auto-walk across areas: walk, taxi, walk (' + JSON.stringify(aw) + ')', aw.r && aw.loc && aw.seen.some(s => s.startsWith('taxi:')) && aw.seen.length >= 2);
  // 5. 关掉动画：瞬间
  const off = await pg.evaluate(() => { const D = __dbg; D.SET.motion = 0; D.go('pk_gate', true, true); D.refresh(); const to = exitsOf('pk_gate')[0][1]; goT(to); const r = D.C.loc === to && !document.querySelector('#ptr').classList.contains('on'); D.SET.motion = 1; return r; });
  chk('motion off → instant, no overlay', off);
  // 6. 夜里去凶地：红字
  const red = await pg.evaluate(async () => { const D = __dbg; D.night = true; const p = Object.keys(PLACES).find(k => PLACES[k].area === 'pingan' && !PLACES[k].town && exitsOf(D.C.loc).length >= 0 && exitsOf(k).length); D.go(p, true, true); D.refresh(); const to = exitsOf(p).map(e => e[1]).find(k => !PLACES[k].town) || exitsOf(p)[0][1]; const pr = goT(to); await new Promise(r => setTimeout(r, 200)); const c = document.querySelector('#ptr').className; await pr; D.night = null; return { night: isNight(), c }; });
  chk('night + creepy place → red title (' + JSON.stringify(red) + ')', /red/.test(red.c));
  console.log('trans', ok.length + '/' + (ok.length + bad.length), bad.length ? 'FAIL:\n  ' + bad.join('\n  ') : 'OK'); console.log('errors', errs.slice(0, 6));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
