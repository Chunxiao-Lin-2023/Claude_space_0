// node test/flow.js [fromCh] — 用真实寻路把整条主线自动走完（跳过动画、小游戏自动成功、战斗交给自动对峙）
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 393, height: 852 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(() => { localStorage.clear(); }); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const from = +(process.argv[2] || 1), mini = process.argv[3] === 'fail' ? 0 : 1;
  const res = await pg.evaluate(async ([from, mini]) => { const D = __dbg; D.auto = true; D.instant = true; D.nosave = true; D.mini = mini; let s = 12345; D.rng = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; let fails = 0, tot = 0; D.pick = o => { if (o.choices[0][0] === '再来一次') { tot++; D.lost = (D.lost || []).concat(D.C.q); const n = D.lost.filter(x => x === D.C.q).length; return n >= 4 ? 2 : (n === 2 ? 1 : 0); } return 0; };
    const wait = async (f, n) => { for (let i = 0; i < (n || 4000) && !f(); i++) await new Promise(r => setTimeout(r, 2)); return f(); };
    D.slotNew(1); await wait(() => !D.STATE.scene); if (from > 1) { D.jumpTo(from); D.auto = true; }
    const log = []; let guard = 0;
    let grind = 0, grindDays = 0;
    while (D.C.q !== 'q_end' && guard++ < 200) { const q = D.curQ(), lv0 = D.C.lv;
      if (questBlocked(q)) { /* 门槛：白天在门口接待游客，夜里回去睡觉 */ grind++; if (grind > 400) return { fail: 'grind forever at ' + q.id + ': ' + q.need(), log };
        if (D.isNight()) { await D.autoWalk('hh_rest'); D.sleepBed(); grindDays++; continue; } await D.autoWalk('hh_door'); const best = sceneList().sort((a, b) => sceneStar(b) - sceneStar(a))[0]; await D.receive(best); await wait(() => !D.STATE.scene && !D.STATE.battle, 3000); continue; }
      const at = D.questWhere(q); if (D.STATE.scene || D.STATE.battle) { if (!await wait(() => !D.STATE.scene && !D.STATE.battle, 3000)) return { fail: 'stuck in scene ' + q.id, log, err: D.err }; continue; }
      if (D.C.loc !== at) { const r = D.route(D.C.loc, at); if (!r) return { fail: 'no route to ' + at + ' for ' + q.id + ' from ' + D.C.loc, log }; const ok = await D.autoWalk(at); await wait(() => !D.STATE.scene && !D.STATE.battle, 3000); if (D.C.q !== q.id) { log.push(q.id + ' lv' + lv0 + ' (auto)'); continue; } if (!ok && D.C.loc !== at) return { fail: 'walk failed to ' + at + ' (' + q.id + ') at ' + D.C.loc, log }; }
      if (D.C.q === q.id) { D.storyHereRun(); if (!await wait(() => !D.STATE.scene && !D.STATE.battle && D.C.q !== q.id, 4000)) return { fail: 'step did not finish: ' + q.id + ' scene=' + D.STATE.scene + ' battle=' + !!D.STATE.battle, log, err: D.err }; }
      log.push(q.id + ' lv' + lv0 + '→' + D.C.lv + ' hp' + D.C.hp + ' diff' + D.SET.diff); if (D.err) return { fail: 'scene error', err: D.err, log }; }
    const C = D.C; const code = D.exportCode(), ok = D.importCode(code);
    return { end: C.q, lv: C.lv, day: C.day, money: C.money, fans: C.fans, sk: C.sk, bar: C.bar, pets: Object.keys(C.pets), titles: C.titles, talents: C.talents, scenes: C.hh.scenes, flags: Object.keys(C.f).join(','), jr: D.JOURNAL().length, lost: D.lost, grind, grindDays, month: C.hh.month, good: C.hh.good, bad: C.hh.bad, batches: C.hh.batches, aff: Object.fromEntries(Object.entries(C.pets).map(([k, v]) => [k, v.aff])), codeOk: ok, log, err: D.err }; }, [from, mini]);
  console.log(JSON.stringify(res, null, 1)); console.log('errors', errs); await b.close(); process.exit(errs.length || res.fail || res.end !== 'q_end' ? 1 : 0); })();
