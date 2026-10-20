// Difficulty benchmark: the human slot is played by a "casual player" proxy profile (fixed across runs),
// bots use the chosen difficulty. Reports solo placement / survival and 3v3 win rate per difficulty.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !document.getElementById('loading'), { timeout: 60000 });
  const runs = +(process.env.RUNS || 12), diffs = (process.env.DIFFS || '0,1,2').split(',').map(Number), modes = (process.env.MODES || 'solo,gem,bounty').split(',');
  for (const mode of modes) for (const diff of diffs) {
    const r = await p.evaluate(([mode, diff, runs]) => {
      window.__dbg.skipDraw = true;
      // casual human: decent aim, slowish reactions, rarely dodges, fires as soon as it can
      const PROXY = { name: 'proxy', err: 0.24, react: 0.45, dodge: 0.15, think: 0.15, superP: 0.8, supDelay: [0.2, 0.8], keep: 0, fireCd: 0.45, lead: [0.3, 0.7], warm: 1.3 };
      const out = { rank: [], surv: [], kills: [], deaths: [], win: 0, dmgTaken: [] };
      for (let k = 0; k < runs; k++) {
        const hero = PLAYABLE[k % PLAYABLE.length];
        startGame({ seed: 1000 + k * 7, theme: 'desert', mode, diff, roster: rosterFor(mode, [{ name: 'P', hero, human: 1, sp: HEROES[hero].sps[0] }], false) });
        const me = STATE.me; me.isBot = true; me.diffP = PROXY; // still human:1 so bots treat it as the player
        let dead = null, taken = 0; const hp0 = me.hp;
        for (let i = 0; i < 60 * 240 && !G.over; i++) { const h = me.hp; stepGame(1 / 60); if (me.alive && me.hp < h) taken += h - me.hp; if (!me.alive && dead == null) dead = G.t; if (mode === 'solo' && !me.alive) break; }
        out.rank.push(G.placement[me.team] || (me.alive ? 1 : 0)); out.surv.push(Math.round(dead == null ? G.t : dead)); out.kills.push(me.kills); out.deaths.push(me.st.deaths);
        if (G.over && G.winner === me.team) out.win++;
        quitToMenu();
      }
      const avg = a => +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1);
      return { mode, diff: DIFF[diff].name, avgRank: avg(out.rank), top3: out.rank.filter(r => r && r <= 3).length + '/' + runs, survS: avg(out.surv), kills: avg(out.kills), deaths: avg(out.deaths), win: out.win + '/' + runs };
    }, [mode, diff, runs]);
    console.log(JSON.stringify(r));
  }
  await b.close();
})();
