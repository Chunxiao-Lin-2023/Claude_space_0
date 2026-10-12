// Headless run of every mode with the human slot driven by AI: outcome, duration, mode-specific counters, errors.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html'); await p.waitForTimeout(1500);
  const modes = (process.env.MODES || 'solo,duo,gem,ball,bounty,boss').split(','), runs = +(process.env.RUNS || 3);
  for (const mode of modes) for (let r = 0; r < runs; r++) {
    const res = await p.evaluate(([mode, diff]) => {
      window.__dbg.norender = true;
      const hero = PLAYABLE[Math.floor(Math.random() * PLAYABLE.length)];
      const roster = rosterFor(mode, [{ name: 'P', hero, human: 1, sp: HEROES[hero].sps[0] }], false);
      startGame({ seed: (Math.random() * 1e9) | 0, theme: 'desert', mode, diff, roster });
      const me = STATE.me; me.isBot = true; me.human = 0;
      let i = 0; const t0 = performance.now(); let err = '';
      try { for (; i < 60 * 300 && !G.over; i++) stepGame(1 / 60); } catch (e) { err = String(e.stack).slice(0, 400); }
      const ms = G.ms || {};
      return { mode, t: +G.t.toFixed(1), over: G.over, winner: G.winner, ms: Math.round(performance.now() - t0), err,
        sc: ms.sc, gemsGround: ms.gems ? ms.gems.length : undefined, boss: mode === 'boss' ? Math.round(entById(ms.bossId) ? entById(ms.bossId).hp : -1) : undefined,
        minions: G.ents.filter(e => e.minion).length, kills: G.ents.reduce((s, e) => s + e.kills, 0), gad: G.ents.reduce((s, e) => s + (e.gadUsed || 0), 0),
        pads: M.pads.length, ports: M.ports.length, springs: M.springs.length, boxes: M.boxes.length, warns: (G.warns || []).length, dbgErr: window.__dbg.err || '' };
    }, [mode, +(process.env.DIFF || 1)]);
    console.log(JSON.stringify(res));
    await p.evaluate(() => quitToMenu());
  }
  console.log(errs.slice(0, 6).join('\n'));
  await b.close();
})();
