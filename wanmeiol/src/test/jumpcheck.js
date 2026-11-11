// node test/jumpcheck.js — every 跳章 start must already hold what the story before it gives (宝术, 功法, 伙伴, story flags),
// the next quest must be reachable, and the story must carry on from there for a few steps without getting stuck
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始');
  const STEPS = +(process.argv[2] || 4);
  const r = await pg.evaluate(async STEPS => { const w8 = ms => new Promise(r => setTimeout(r, ms)); const D = __dbg, S = () => D.STATE, bad = [], info = [];
    const idle = async () => { for (let i = 0; i < 2000 && (S().scene || S().battle || S().dungeon || DLG); i++) { if (DLG && !DLG.mini && !DLG.rune && !DLG.choice && !DLG.party) D.dlgPick(-1); await w8(15); } };
    D.auto = true; D.instant = true; D.noCD = true; D.dlgPick(-1); await idle();
    const src = q => { const fns = [q.scene, q.onEnter && q.onEnter.scene].filter(Boolean); let s = fns.map(f => f.toString()).join('\n');
      for (const m of s.matchAll(/\b(S_\w+)\(/g)) { const f = window[m[1]] || (typeof eval(m[1]) === 'function' ? eval(m[1]) : null); if (f) s += '\n' + f.toString(); } return s; };
    const OPTIONAL_F = ['ding', 'held7', 'xiaoqiSafe', 'yinkunGate', 'huoGuard', 'heldShihai', 'baxiMem', 'tahuaOk', 'carveHuang', 'wallName', 'zaohuaLetter', 'huoNight', 'qhAdvice', 'stoneLate']; /* set only by some choices or by holding out */
    const grab = (s, re) => [...s.matchAll(re)].map(m => m[1]);
    for (let j = 0; j < JUMPS.length; j++) { const J = JUMPS[j]; jumpTo(j); await w8(300); const c = D.C, qi0 = c.story.q, miss = [];
      for (let k = 0; k < qi0; k++) { const q = MAIN[k], s = src(q);
        for (const id of grab(s, /learnSkill\('(\w+)'\)/g)) if (!c.sk.includes(id)) miss.push(`宝术 ${id}（${q.id}）`);
        for (const id of grab(s, /learnGongfa\('(\w+)'\)/g)) if (!c.gf.includes(id)) miss.push(`功法 ${id}（${q.id}）`);
        for (const id of grab(s, /gainPet\('(\w+)'\)/g)) if (!c.pets[id]) miss.push(`伙伴 ${id}（${q.id}）`);
        for (const id of grab(s, /F\(\)\.(\w+) = 1/g)) if (!c.story.f[id] && !OPTIONAL_F.includes(id)) miss.push(`旗标 ${id}（${q.id}）`); }
      const q = curQ(); let where = q.type === 'enter' ? q.loc : q.type === 'talk' ? npcLocNow(q.npc) : null;
      if ((q.type === 'enter' || q.type === 'talk') && (!where || !route(c.loc, where))) miss.push(`去不了下一步 ${q.id}（${q.type} ${q.loc || q.npc} → ${where}）`);
      if (c.bar.some(id => !c.sk.includes(id))) miss.push('宝术栏里有没学会的');
      if (miss.length) bad.push(`${jumpName(J)}: ${[...new Set(miss)].join('、')}`);
      // carry on for a few steps
      c.auto = true; const start = c.story.q; for (let n = 0; n < STEPS && c.story.q < MAIN.length - 1; n++) { const q2 = curQ(), before = c.story.q;
        try { if (q2.rec) for (let t = 0; t < 10 && c.lv < q2.rec + 1; t++) gainExp(BAL.expNext(c.lv), true); fullHeal(); D.addItem('baoyao', 3, true);
          if (q2.type === 'enter') { const w = q2.loc; if (c.loc !== w) { const R = route(c.loc, w) || []; for (const p of R.slice(1)) { go(p, true); await w8(30); await idle(); if (c.story.q !== before) break; } } await storyPoll(); }
          else if (q2.type === 'talk') { const w = npcLocNow(q2.npc); if (w && c.loc !== w) { for (const p of (route(c.loc, w) || []).slice(1)) { go(p, true); await w8(30); await idle(); if (c.story.q !== before) break; } } if (c.story.q === before) await npcTalk(q2.npc); }
          else if (q2.type === 'auto' || q2.type === 'none') await storyPoll();
          else if (q2.type === 'dungeon') { go(DUNGEONS[q2.dungeon].loc, true, true); await enterDungeon(q2.dungeon); await w8(900); }
          else if (q2.type === 'kill') { for (let t = 0; t < 30 && c.story.q === before; t++) { go(q2.loc || c.loc, true, true); await explore(); await idle(); } }
          await w8(50); await idle(); } catch (e) { bad.push(`${jumpName(J)}: 往下走时报错 ${q2.id}: ${e.message}`); break; }
        if (c.story.q === before) { if (q2.type !== 'none') bad.push(`${jumpName(J)}: 卡在 ${q2.id}（${q2.type}）`); break; } }
      info.push(`${jumpName(J)}: ${MAIN[start].id} → ${MAIN[c.story.q].id}`); }
    return { bad, info }; }, STEPS);
  console.log(r.info.join('\n')); console.log('BAD\n' + r.bad.join('\n')); console.log('errors', errs.slice(0, 8)); await b.close(); process.exit(r.bad.length || errs.length ? 1 : 0); })();
