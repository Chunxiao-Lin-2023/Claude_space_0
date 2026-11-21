// Round 27: three save slots — a new game takes an empty slot (the old run stays), continue picks a slot, all full asks before overwriting the oldest
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 900, height: 600 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(40000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  const run = async (night, diff) => { // start a new solo run from the title and save it with a marker
    const r = await p.evaluate(([night, diff]) => { SET.mode = 'classic'; SET.map = 'town'; SET.diff = diff; $('soloBtn').click(); return { started: STATE.mode === 'play', slot: SLOT, msg: $('tStatus').textContent, armed: slotArm > 0 }; }, [night, diff]);
    console.log('run', night, JSON.stringify(r)); if (!r.started) return r;
    await p.waitForFunction(() => W && W.t > 0.3);
    return p.evaluate(night => { W.night = night; W.p[0].name = 'run' + night; saveGame(true); const s = SLOT; W = null; showScreen('title'); renderBest(); return { started: true, slot: s }; }, night);
  };
  const a = await run(3, 'easy'), bb = await run(5, 'normal');
  let s = await p.evaluate(() => [1, 2, 3].map(n => { const v = loadSlot(n); return v ? v.night : null; }));
  check('a second new game goes into slot 2; the first run is still in slot 1', a.slot === 1 && bb.slot === 2 && s.join() === '3,5,', JSON.stringify({ a, bb, s }));
  // continue an older slot explicitly
  await p.evaluate(() => continueGame(1)); await p.waitForFunction(() => W && W.t > 0.1);
  s = await p.evaluate(() => { const r = { slot: SLOT, night: W.night, diff: W.diff }; saveGame(true); W = null; showScreen('title'); return r; });
  check('continuing slot 1 loads that run and keeps saving into slot 1', s.slot === 1 && s.night === 3 && s.diff === 'easy', JSON.stringify(s));
  const c3 = await run(7, 'hard');
  check('third new game: slot 3', c3.slot === 3, JSON.stringify(c3));
  const full1 = await run(9, 'hard');
  check('all full: the first press does not start and warns', !full1.started && full1.armed, JSON.stringify(full1));
  const full2 = await run(9, 'hard');
  s = await p.evaluate(() => [1, 2, 3].map(n => { const v = loadSlot(n); return v ? v.night : null; }));
  check('second press overwrites the oldest slot (slot 2, the night-5 run) and nothing else', full2.started && full2.slot === 2 && s.join() === '3,9,7', JSON.stringify({ full2, s }));
  s = await p.evaluate(() => { clearSave(3); return [freeSlot(), latestSlot()]; });
  check('deleting slot 3 frees it', s[0] === 3, JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
