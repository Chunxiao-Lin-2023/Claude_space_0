// Drives the whole main line programmatically (teleport / interact / kill), screenshots each quest. env: UNTIL (quest index), SHOTS
const { chromium } = require('playwright');
(async () => {
  const shots = process.env.SHOTS || '/tmp/claude-0/flow'; require('fs').mkdirSync(shots, { recursive: true });
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  const pg = await b.newPage({ viewport: { width: 560, height: 315 } });
  const errs = []; pg.on('pageerror', e => console.log('LIVEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | '))); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 4).join(' | '))); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await pg.goto('http://localhost:8765/test.html?q=low'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 });
  await pg.evaluate(() => { localStorage.clear(); __dbg.autoDlg = 0.15; __dbg.skipDraw = true; __dbg.speed = +(new URLSearchParams(location.search).get('spd') || 8); });
  await pg.click('#bnew'); await pg.waitForTimeout(200); await pg.fill('#pn', '团团'); await pg.click('#pok');
  const until = +(process.env.UNTIL || 99); let lastQ = -1, stuck = 0, lastKey = '';
  for (let iter = 0; iter < 9000; iter++) {
    const st = await pg.evaluate(async () => {
      const s = curStep(), q = curQ(); if (!q) return { done: true };
      const me = W.P[0]; const key = STORY.qi + ':' + STORY.si;
      if (STORY.running || DLG.open) { if (UI.choice) UI.choice(0); return { key, qi: STORY.qi, busy: 1 }; }
      if (UI.choice) { UI.choice(0); return { key, qi: STORY.qi }; }
      const tp = (x, z) => { teleport(me, x, z); if (W.P[1]) teleport(W.P[1], x + 1, z + 1); };
      const tgt = stepTarget();
      switch (s.t) {
        case 'goto': tp(s.x, s.z); break;
        case 'talk': case 'interact': { const e = entByTag(s.npc); if (e) { tp(e.x + 1.2, e.z + 1.2); doInteract(me, e); } break; }
        case 'kill': { const ms = W.ents.filter(e => e.type === 'mob' && e.alive && (e.kind === s.mob || e.tag === s.mob)); if (ms.length) { const m = ms[0]; tp(m.x + 2, m.z + 2); m.invuln = false; hurt(me, m, 999); } else if (tgt) tp(tgt.x, tgt.z); break; }
        case 'collect': addItem(s.item, s.n || 1); break;
        case 'boss': { const m = entByTag(s.tag); if (m && m.alive) { tp(m.x + 3, m.z + 3); hurt(me, m, 0, { flat: Math.ceil(m.hpMax / 6) }); } break; }
        case 'cond': {
          if (q.id === 'q1' && s.text.includes('出拳')) { tp(YARD.x, YARD.z); for (let i = 0; i < 9; i++) STORY.castHook(me, 'fist'); }
          else if (s.text.includes('五色雀')) { const bd = entByTag('wuse'); STORY.birdI = 9; if (bd) { bd.walk = null; tp(bd.x + 1, bd.z + 1); } }
          else if (s.text.includes('孩子')) { for (const k of ['ermeng', 'pihou', 'dazhuang']) catchKid(entByTag(k)); }
          else if (s.text.includes('莽牛')) { const o = entByTag('yardox'); if (o) { tp(o.x + 3, o.z); hurt(me, o, 0, { flat: Math.ceil(o.hpMax * 0.4) }); } }
          else if (s.text.includes('铁矛')) { STORY.eyeHits = (STORY.eyeHits || 0) + 1; }
          else if (s.text.includes('兽坑')) { for (const t of ['beitrap0', 'beitrap1', 'beitrap2']) { const e = entByTag(t); if (e) e.interact.fn(me, e); } }
          break; }
      }
      return { key, qi: STORY.qi, t: s.t, text: s.text };
    });
    if (st.done) { console.log('STORY DONE'); break; }
    if (st.qi !== lastQ) { lastQ = st.qi; await pg.evaluate(() => { __dbg.skipDraw = false; __dbg.speed = 1; }); await pg.waitForTimeout(2500); await pg.screenshot({ path: `${shots}/q${String(st.qi).padStart(2, '0')}.png`, timeout: 120000 }); await pg.evaluate(() => { __dbg.skipDraw = true; __dbg.speed = 8; }); console.log('quest', st.qi, st.text || ''); if (st.qi > until) break; }
    if (st.key === lastKey && !st.busy) { stuck++; if (stuck > 60) { console.log('FORCED past', st.key, st.t, st.text); await pg.evaluate(() => stepDone()); stuck = 0; } } else stuck = 0; lastKey = st.key;
    if (iter % 40 === 0) console.log('at', st.key, st.busy ? 'busy' : '', st.t || '', (st.text || '').slice(0, 20));
    await pg.waitForTimeout(st.busy ? 400 : 250);
  }
  await pg.evaluate(() => { __dbg.skipDraw = false; __dbg.speed = 1; }); await pg.waitForTimeout(2500); await pg.screenshot({ path: `${shots}/end.png`, timeout: 120000 });
  const info = await pg.evaluate(() => ({ lv: PARTY.lv, form: PARTY.form, qi: STORY.qi, items: PARTY.items }));
  console.log(JSON.stringify(info)); console.log(errs.slice(0, 15).join('\n') || 'no errors'); await b.close();
})();
