// node test/chase.js [N] — 夜里大战前的追逐：全程不动 / 只躲进最近的柜子 / 机器人，各打 N 次。目标：不动必输，躲对地方能过
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); const N = +(process.argv[2] || 10);
  const r = await pg.evaluate(async (N) => { const D = __dbg; D.SET.snd = 0; const out = []; D.slotNew(1); D.STATE.run++; D.jumpTo(3);
    for (const k in D.HCHASE) { const res = { idle: 0, hide: 0, bot: 0 }, ts = [];
      for (const how of ['idle', 'hide', 'bot']) for (let i = 0; i < N; i++) { const H = D.chaseNewT(D.HCHASE[k]); H.phase = 'live'; if (how === 'bot') H.auto = true; if (how === 'hide') { const h = H.hero; let best = null, bd = 1e9; for (const e of H.M.hides) { const d = Math.hypot(e.x - h.x, e.y - h.y); if (d < bd) { bd = d; best = e; } } D.hGo(H, best.x, best.y); }
        let n = 0; while (!H.done && n++ < 2000) D.hStep(H, .1); if (H.res === 'ok') res[how]++; if (how === 'bot') ts.push(Math.round(H.t)); }
      out.push(k.padEnd(10) + ' 不动 ' + Math.round(res.idle / N * 100) + '%  只躲 ' + Math.round(res.hide / N * 100) + '%  机器人 ' + Math.round(res.bot / N * 100) + '%  用时 ' + ts.join(',')); }
    return out; }, N);
  console.log(r.join('\n')); console.log(errs.length ? errs.slice(0, 5).join('\n') : 'no errors'); await b.close(); })();
