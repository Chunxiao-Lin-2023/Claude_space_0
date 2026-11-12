// node test/house.js [N] — 白天接待（鬼屋地图）自动扮鬼打 N 场：胜率、吓退、剩多少氛围、被看见几次、拉了几次机关。MP0=1 = 精神为零时
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); if (process.env.MP0) await pg.evaluate(() => window.__mp0 = 1); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const N = +(process.argv[2] || 12);
  const r = await pg.evaluate(async (N) => { const D = __dbg; D.instant = true; D.SET.snd = 0; D.SET.mus = 0; const out = [];
    const cases = [[2, 'zombie', 3], [2, 'mh', 4], [3, 'ws', 8], [3, 'room', 9], [4, 'my', 12], [5, 'ward', 16], [5, 'ward', 19]];
    for (const [ch, sc, lv] of cases) { const agg = { win: 0, atm: 0, t: 0, exp: 0, perf: 0, dev: 0, pou: 0, sc: 0, n: 0, mp: 0 };
      for (let i = 0; i < N; i++) { D.slotNew(1); D.STATE.run++; D.STATE.scene = false; D.jumpTo(ch); const C = D.C; C.tick = 0; C.lv = Math.max(C.lv, lv); D.fullHeal(); if (window.__mp0) C.mp = 0; D.go("hh_door", true, true); if (!C.hh.scenes.includes(sc)) C.hh.scenes.push(sc); C.fun.pickyDay = C.day;
        D.STATE.scene = false; D.STATE.busy = false; window.__hsl = null; await D.receive(sc); const L = D.HS_LAST; if (!L) { out.push("no session " + sc + JSON.stringify([D.STATE.scene, !!D.STATE.battle, !!D.STATE.house, D.STATE.busy, D.isNight(), C.loc])); continue; } agg.win += L.res === 'win'; agg.atm += L.atm; agg.t += L.t; agg.exp += L.stats.exposed; agg.perf += L.stats.perfect; agg.dev += L.stats.dev; agg.pou += L.stats.pounce; agg.sc += L.scared; agg.n += L.n; agg.mp += L.mp; }
      const C = D.C; out.push(`ch${ch} ${sc.padEnd(6)} lv${C.lv} sk=${C.sk.filter(k => D.SKILLS[k].m !== 'n').length} pets=${Object.keys(C.pets).join('/')} | win ${Math.round(agg.win / N * 100)}% scared ${agg.sc}/${agg.n} atm ${Math.round(agg.atm / N)}% t ${Math.round(agg.t / N)}s exp ${(agg.exp / N).toFixed(1)} dev ${(agg.dev / N).toFixed(1)} perf ${(agg.perf / N).toFixed(1)} pounce ${(agg.pou / N).toFixed(1)} mpEnd ${Math.round(agg.mp / N)}`); }
    return out; }, N);
  console.log(r.join('\n')); console.log(errs.length ? errs.slice(0, 5).join('\n') : 'no errors'); await b.close(); })();
