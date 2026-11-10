// node test/flow.js — plays the whole main story with auto dialogue + auto battle, levelling the hero to each step's recommended level
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); else if (m.text().startsWith('FLOW')) console.log(m.text()); });
  await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.click('text=创建角色'); await pg.click('.clsc >> nth=' + (+(process.env.CLS || 2))); await pg.fill('#nm', '测试员'); await pg.click('text=进入大荒');
  const res = await pg.evaluate(async () => {
    const D = __dbg; D.auto = true; D.noCD = true; D.instant = true; const S = () => D.STATE; const C = () => D.C; C().auto = true; window.SET && (SET.fast = true);
    const idle = async (ms = 60000) => { const t0 = Date.now(); while (S().scene || S().battle || S().dungeon || S().busy) { if (Date.now() - t0 > ms) throw new Error('stuck ' + JSON.stringify({ q: D.curQ().id, scene: S().scene, b: !!S().battle, d: S().dungeon })); await new Promise(r => setTimeout(r, 50)); } };
    const npcLoc = n => Object.values(D.PLACES).find(p => (p.npcs || []).includes(n)).id;
    const walk = async to => { if (C().loc === to) return; D.autoWalk(to); for (let i = 0; i < 400 && C().loc !== to; i++) await new Promise(r => setTimeout(r, 40)); await new Promise(r => setTimeout(r, 200)); await idle(); };
    const lvTo = n => { while (C().lv < n) { if (C().lv === 9 && !C().bag.jinghua) D.addItem('jinghua', 1, true); if (C().lv === 19 && !C().bag.baoxue) D.addItem('baoxue', 1, true); D.gainExp(99999, true); D.breakthrough(); } };
    const talk = async n => { await walk(npcLoc(n)); await idle(); const o = D.questTalkOptions(n); if (!o.length) throw new Error('no talk option ' + n + ' at ' + D.curQ().id); await o[0].f(); await idle(); };
    const log = []; let guard = 0;
    while (D.curQ().id !== 'q_end' && guard++ < 80) {
      const q = D.curQ(); log.push(q.id); console.log('FLOW', q.id, 'lv', C().lv); if (q.rec) lvTo(q.rec + 2); D.addItem('elixir', 3, true); D.addItem('meat', 1, true); for (const e of C().gear.slice()) { const cur = C().eq[EQB[e.b].slot]; if (C().lv >= EQB[e.b].lv && (!cur || eqPower(e) > eqPower(cur))) equipItem(e.u); }
      await idle();
      if (q.type === 'auto' || q.type === 'level') { lvTo(q.lv || 1); await D.storyPoll(); await idle(); }
      else if (q.type === 'enter') { if (C().loc === q.loc) { await D.questComplete(q); } else await walk(q.loc); await idle(); if (D.curQ() === q) await D.questComplete(q); await idle(); }
      else if (q.type === 'talk') await talk(q.npc);
      else if (q.type === 'kill') { await walk(q.loc); await idle(); for (let i = 0; i < 300 && C().story.n < q.n; i++) { if (C().hp < charStats().hpMax * 0.5) fullHeal(); await D.explore(); await idle(); if (C().loc !== q.loc) await walk(q.loc); } await talk(q.npc); }
      else if (q.type === 'dungeon') { await walk(q.loc); for (let k = 0; k < 4 && C().story.n < 1; k++) { await D.enterDungeon(q.dungeon); await idle(); if (C().loc !== q.loc) await walk(q.loc); } await talk(q.npc); }
      else if (q.type === 'multi') {
        for (const s of q.subs) { if (q.need && q.subs.filter(x => x.check ? x.check() : (C().story.subs || {})[x.k]).length >= q.need) break;
          if (s.k === 'arena') { await walk('bc_arena'); for (let i = 0; i < 5 && !s.check(); i++) { await D.arenaFight(D.arenaOpponents()[0]); await idle(); } }
          else if (s.k === 'bounty') { const b = C().daily.bounty[0]; b.taken = true; await walk(b.loc); for (let i = 0; i < 300 && b.got < b.n; i++) { if (C().hp < charStats().hpMax * 0.5) fullHeal(); await D.explore(); await idle(); if (C().loc !== b.loc) await walk(b.loc); } await walk('bc_hall'); D.bountyClaim(0); }
          else if (s.type === 'enter') { await walk(s.loc); await idle(); if (!(C().story.subs || {})[s.k]) await D.subComplete(q, s); await idle(); }
          else if (s.type === 'talk') { if (s.k === 'form') { D.addItem('ore', 3, true); D.addItem('lingyao', 2, true); } await walk(npcLoc(s.npc)); const o = D.questTalkOptions(s.npc).find(x => x.t.startsWith('❗')); if (o) await o.f(); await idle(); } }
        await talk(q.npc); }
      if (D.curQ() === q) throw new Error('did not advance ' + q.id + ' ' + JSON.stringify({ n: C().story.n, subs: C().story.subs, loc: C().loc }));
    }
    return { log, end: D.curQ().id, lv: C().lv, gold: C().gold, title: C().title, f: C().story.f, kills: C().stats.kills, deaths: C().stats.deaths };
  });
  console.log(JSON.stringify(res)); console.log('errors', errs.slice(0, 10)); await pg.screenshot({ path: '/tmp/claude-0/wmol/flow_end.png' }); await b.close(); process.exit(errs.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
