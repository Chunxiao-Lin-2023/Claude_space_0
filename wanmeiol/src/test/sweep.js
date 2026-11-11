// node test/sweep.js — for every 跳章 start: walk into every open place (arrival scenes run), explore wild places a few times,
// open every page and tab; fails on any page error or on "undefined"/"NaN" showing up in the UI
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { if (!sessionStorage.k) { localStorage.clear(); sessionStorage.k = 1; } }); await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始');
  const from = +(process.argv[2] || 0), to = +(process.argv[3] || 99);
  const r = await pg.evaluate(async ([from, to]) => { const w8 = ms => new Promise(r => setTimeout(r, ms)); const D = __dbg, S = () => D.STATE, bad = [], stats = { places: 0, scenes: 0, explores: 0 };
    const idle = async () => { for (let i = 0; i < 1500 && (S().scene || S().battle || S().dungeon || DLG); i++) { if (DLG && !DLG.mini && !DLG.rune && !DLG.choice) D.dlgPick(-1); await w8(15); } };
    const scan = where => { const t = (document.querySelector('#sbody') || {}).textContent || '', m = (document.querySelector('#mb') || {}).textContent || '', a = (document.querySelector('#acts') || document.body).textContent;
      for (const [k, x] of [['side', t], ['modal', m], ['acts', a]]) if (/undefined|NaN|\[object/.test(x)) bad.push(where + ' ' + k + ': ' + (x.match(/.{0,30}(undefined|NaN|\[object).{0,20}/) || [''])[0]); };
    D.auto = true; D.instant = true; D.noCD = true; D.dlgPick(-1); await idle();
    for (let j = from; j < Math.min(JUMPS.length, to); j++) { jumpTo(j); await w8(500); await idle(); const c = D.C; c.auto = true; c.money = 1e6; c.bag.bone = 200; c.bag.baoyao = 20;
      const open = Object.keys(PLACES).filter(id => placeOpen(id));
      for (const id of open) { const q0 = c.story.q, j0 = JOURNAL.length; try { go(id, true); await w8(160); await idle(); } catch (e) { bad.push(`J${j} go ${id}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); } stats.places++; if (JOURNAL.length > j0) stats.scenes++;
        if (c.story.q !== q0) { /* the main story moved on — fine */ }
        const P = PLACES[id]; if (P.mobs && P.mobs.length && !P.dungeon) for (let k = 0; k < 2; k++) { fullHeal(); try { await explore(); await idle(); } catch (e) { bad.push(`J${j} explore ${id}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); } stats.explores++; }
        fullHeal(); }
      for (const n of ['hero', 'pet', 'bag', 'map']) { navTo(n); await w8(20); scan(`J${j} ${n}`); }
      for (const t of ['log', 'rumor', 'memo', 'chars', 'codex']) { UI.logTab = t; navTo('log'); await w8(20); scan(`J${j} log:${t}`); }
      navTo('adv'); openModal('arena'); await w8(20); scan(`J${j} arena`); closeModal(); scan(`J${j} acts`); }
    return { bad, stats, end: D.C.story.q }; }, [from, to]);
  console.log(JSON.stringify(r)); console.log('errors', errs.slice(0, 8)); await b.close(); process.exit(r.bad.length || errs.length ? 1 : 0); })();
