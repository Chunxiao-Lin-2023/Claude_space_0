// node test/balance.js — fight 30 random encounters per (class, place) at the place's level with 良品 gear of that tier, full HP each time; prints death rate and HP used
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage(); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.text().startsWith('BAL')) console.log(m.text()); });
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.click('text=创建角色'); await pg.fill('#nm', 'b'); await pg.evaluate(() => { __dbg.auto = true; __dbg.noCD = true; __dbg.instant = true; }); await pg.click('text=进入大荒'); await pg.waitForTimeout(800);
  const out = await pg.evaluate(async () => { const D = __dbg; SET.fast = true; const res = [];
    for (const cls of ['mangniu', 'kunpeng', 'liushen']) for (const [loc, lv] of [['fl_path', 2], ['mn_slope', 4], ['st_forest', 5], ['fl_deep', 7], ['bei_ruin', 8], ['th_marsh', 11], ['road', 12], ['bt_bdgate', 17], ['bt_wild', 22]]) {
      const c = D.newChar('b', cls); c.lv = lv; c.story.q = 3; c.auto = true; const tier = EQ_BASES.filter(x => x.lv <= lv).slice(-3); for (const t of ['weapon', 'armor', 'acc']) { const bb = EQ_BASES.filter(x => x.slot === t && x.lv <= lv).pop(); c.eq[t] = makeEquip(bb.id, 1); }
      C = c; let dead = 0, n = 0, used = 0, rounds = 0; for (let i = 0; i < 16; i++) { fullHeal(); C.loc = loc; const P = PLACES[loc]; const k = wpick([{ v: 1, w: 6 }, { v: 2, w: 3 }, { v: 3, w: 1 }]).v; const mobs = []; for (let j = 0; j < k; j++) mobs.push([wpick(P.mobs, x => x[1])[0], rint(P.lv[0], P.lv[1])]);
        const hp0 = charStats().hpMax; const r = await startBattle({ mobs, title: 't', flee: false, noLose: true }); n++; if (!r.win) dead++; else used += 1 - C.hp / hp0; rounds += STATE.lastBattle.round; }
      console.log('BAL ' + `${cls.padEnd(8)} ${loc.padEnd(10)} lv${lv}  死亡 ${Math.round(dead / n * 100)}%  平均耗血 ${Math.round(used / Math.max(1, n - dead) * 100)}%  平均回合 ${(rounds / n).toFixed(1)}`); }
    return res; });
   await b.close(); })();
