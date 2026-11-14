// node test/night.js — 夜晚任务和主游戏之间的桥：真开 iframe，走完 / 中途离开 / 下次接着走 / 死了跳过
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 900, height: 640 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(() => { if (window === window.top) localStorage.clear(); }); /* 只清主页面：iframe 也会跑 initScript，清了就丢检查点 */ await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const ok = [], bad = []; const chk = (n, v) => (v ? ok : bad).push(n);
  const frame = async () => { for (let i = 0; i < 60; i++) { const f = pg.frames().find(f => f !== pg.mainFrame()); if (f) { try { if (await f.evaluate(() => !!(window.__kn && __kn.W))) return f; } catch (e) { } } await pg.waitForTimeout(100); } return null; };
  const runQ = async id => pg.evaluate(id => { const D = __dbg; D.C.q = id; const q = D.curQ(); D.C.loc = D.questWhere(q); window.__qdone = 0; const p = D.storyHereRun(); (p || Promise.resolve()).then(() => window.__qdone = 1); }, id);
  await pg.evaluate(async () => { const D = __dbg; D.instant = true; D.auto = true; D.nosave = true; D.slotNew(1); const w = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 300 && D.STATE.scene; i++) await w(10); D.auto = true; D.nightReal = true; D.pick = o => 0; });
  // 1. 三楼的旧箱子：走完，带回“相信”的选择
  await runQ('q_attic'); let f = await frame(); chk('attic iframe opened', !!f);
  chk('management UI hidden under overlay', await pg.evaluate(() => document.body.classList.contains('nightup') && !!document.querySelector('#nightov')));
  if (f) { await f.evaluate(() => { __kn.W.f.k_believe = 1; __kn.finish('end'); }); }
  await pg.waitForFunction(() => window.__qdone, null, { timeout: 8000 }).catch(() => 0);
  chk('attic: overlay removed', await pg.evaluate(() => !document.querySelector('#nightov') && !document.body.classList.contains('nightup')));
  chk('attic: believe=1 carried back', await pg.evaluate(() => __dbg.C.f.believe === 1));
  chk('attic: phone + ragdoll given', await pg.evaluate(() => !!__dbg.C.bag.phone && !!__dbg.C.bag.ragdoll));
  chk('attic: quest advanced', await pg.evaluate(() => __dbg.C.q === 'q_daily1'));
  // 2. 修人偶：中途离开 → 不推进；再进 → 从检查点接着走；走完 → 推进
  await runQ('q_daily1'); f = await frame(); if (f) await f.evaluate(() => { __kn.SAPI.cp('mid'); __kn.finish('quit'); });
  await pg.waitForFunction(() => window.__qdone, null, { timeout: 8000 }).catch(() => 0);
  chk('daily1 quit: quest NOT advanced', await pg.evaluate(() => __dbg.C.q === 'q_daily1'));
  chk('daily1 quit: resume flag stored', await pg.evaluate(() => !!(__dbg.C.f.ntq && __dbg.C.f.ntq.daily1)));
  chk('daily1 quit: no reward yet', await pg.evaluate(() => !__dbg.C.bag.cd));
  await runQ('q_daily1'); f = await frame(); chk('daily1 resumed from checkpoint', !!f && await f.evaluate(() => !!__kn.W.cp && __kn.W.cp.name === 'mid'));
  if (f) await f.evaluate(() => __kn.finish('end'));
  await pg.waitForFunction(() => window.__qdone, null, { timeout: 8000 }).catch(() => 0);
  chk('daily1 end: advanced + cd', await pg.evaluate(() => __dbg.C.q === 'q_mirror' && !!__dbg.C.bag.cd && !(__dbg.C.f.ntq || {}).daily1));
  // 3. 镜子游戏：死了选“跳过这一夜”→ 剧情照常往下走，记作失败
  await runQ('q_mirror'); f = await frame(); if (f) await f.evaluate(() => __kn.finish('skip'));
  await pg.waitForFunction(() => window.__qdone, null, { timeout: 8000 }).catch(() => 0);
  chk('mirror skip: advanced + mirrorFail', await pg.evaluate(() => __dbg.C.q === 'q_firstday' && __dbg.C.f.mirrorFail === 1 && __dbg.C.talents.includes('lianrong')));
  console.log('night bridge', ok.length + '/' + (ok.length + bad.length), bad.length ? 'FAIL: ' + bad.join(' | ') : 'OK'); console.log('errors', errs);
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
