// node test/flow.js — plays the whole story (auto dialogue + auto battle), levelling 石昊 to each step's suggested level
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); else if (m.text().startsWith('FLOW')) console.log(m.text()); });
  await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.evaluate(() => { __dbg.auto = true; __dbg.noCD = true; __dbg.instant = true; SET.fast = true; __dbg.pick = ts => { const i = ts.findIndex(t => /云曦|蛋在我这儿|我陪你练|我要把我的骨头/.test(t)); return i >= 0 ? i : 0; }; }); await pg.click('text=开始');
  const res = await pg.evaluate(async () => { try {
    const D = __dbg, S = () => D.STATE, C = () => D.C; C().auto = true; const w8 = ms => new Promise(r => setTimeout(r, ms));
    const idle = async (ms = 180000) => { const t0 = Date.now(); await w8(30); while (S().scene || S().battle || S().dungeon || S().busy) { if (Date.now() - t0 > ms) throw new Error('stuck ' + JSON.stringify({ q: D.curQ().id, scene: S().scene, b: !!S().battle, d: S().dungeon })); await w8(30); } };
    const npcLoc = n => npcLocNow(n) || Object.values(D.PLACES).find(p => (p.npcs || []).includes(n)).id;
    const walk = async to => { if (C().loc === to) return; for (let t = 0; t < 4 && C().loc !== to; t++) { await idle(); D.autoWalk(to); for (let i = 0; i < 600 && C().loc !== to; i++) await w8(20); } /* arrival scenes on the way can stop the walk: start again */ if (C().loc !== to) throw new Error('cannot walk to ' + to + ' from ' + C().loc + ' route=' + JSON.stringify(route(C().loc, to)) + ' st=' + JSON.stringify({ sc: S().scene, b: !!S().battle, d: S().dungeon, f: C().story.f })); await w8(150); await idle(); };
    const lvTo = n => { for (let k = 0; k < 40 && C().lv < n; k++) { const l0 = C().lv; D.gainExp(BAL.expNext(C().lv), true); if (C().lv === l0) break; } };
    const talk = async n => { await walk(npcLoc(n)); await idle(); const o = D.questTalkOptions(n).filter(x => x.t.startsWith('❗') || x.t.startsWith('✔') || x.t.startsWith('🔒')); if (!o.length) throw new Error('no talk option ' + n + ' at ' + D.curQ().id); await o[0].f(); await idle(); };
    const log = []; let guard = 0;
    while (D.curQ().id !== 'q_fin' && guard++ < 320) {
      const q = D.curQ(); log.push(q.id); console.log('FLOW', q.id, 'lv', C().lv); if (q.rec) lvTo(q.rec + 1); if (q.lvNeed) lvTo(q.lvNeed); D.addItem('baoyao', 2, true); D.addItem('meat', 2, true); await idle();
      if (q.type === 'auto') { await D.storyPoll(); await idle(); }
      else if (q.type === 'enter') { if (C().loc === q.loc) await D.questComplete(q); else await walk(q.loc); await idle(); if (D.curQ() === q) await D.questComplete(q); await idle(); }
      else if (q.type === 'talk') await talk(q.npc);
      else if (q.type === 'kill') { await walk(q.loc); for (let i = 0; i < 400 && C().story.n < q.n; i++) { if (C().hp < charStats().hpMax * 0.5) fullHeal(); await D.explore(); await idle(); if (C().loc !== q.loc) await walk(q.loc); } await talk(q.npc); }
      else if (q.type === 'dungeon') { await walk(q.loc); for (let k = 0; k < 6 && C().story.n < 1; k++) { fullHeal(); await D.enterDungeon(q.dungeon); await idle(); if (C().loc !== q.loc) await walk(q.loc); } await idle(); if (q.npc) await talk(q.npc); else for (let i = 0; i < 50 && D.curQ() === q; i++) await w8(50); }
      else if (q.type === 'arena') { await walk(q.loc); for (let i = 0; i < 12 && D.curQ() === q; i++) { C().arena.tries = 5; await D.arenaFight(D.arenaOpponents()[0]); await idle(); } await w8(800); await idle(); }
      await idle(); if (D.curQ() === q) throw new Error('did not advance ' + q.id + ' ' + JSON.stringify({ n: C().story.n, loc: C().loc, lv: C().lv }));
    }
    // after the story: 云曦 at 不老泉, wild events, 虚神界 milestones + 石毅, save code round trip
    await walk('bd_spring'); await idle(); const yunxi = !!C().story.f.yunxiHelp;
    const wild = []; for (const e of D.WILD) { const P = D.PLACES[C().loc]; await D.runWild(e); await idle(); wild.push(e.id); }
    C().arena.rank = 9; D.arenaMilestones(); await w8(900); await idle(); D.arenaClaim(); const shiyi = !!C().story.f.shiyi;
    const code = await D.exportCode(); const lv0 = C().lv; const c2 = await D.importCode(code); const roundtrip = c2.lv === lv0 && c2.story.q === C().story.q && D.JOURNAL.length > 30;
    return { end: D.curQ().id, lv: C().lv, yunxi, shiyi, wild: wild.length, journal: D.JOURNAL.length, codeLen: code.length, roundtrip, prof: C().prof, codex: Object.keys(C().codex).length, flags: ['lure', 'vow', 'qf', 'qfIn', 'bully', 'ding', 'chick', 'carve'].map(k => k + '=' + C().story.f[k]).join(' '), pets: Object.keys(C().pets), sk: C().sk, gf: C().gf, dt: C().dt, f: C().story.f, deaths: C().stats.deaths, rank: C().arena.rank }; } catch (e) { return { fail: e.message }; }
  });
  console.log(JSON.stringify(res)); console.log('errors', errs.slice(0, 10)); await pg.screenshot({ path: '/tmp/claude-0/wmol/flow_end.png' }); await b.close(); process.exit(errs.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
process.on('exit', () => {});
