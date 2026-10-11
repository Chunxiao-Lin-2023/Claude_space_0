// AI vs AI 1v1 duels in an open arena: win rate of HERO (env, default quill) against every other hero.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html'); await p.waitForTimeout(1200);
  const res = await p.evaluate(k => {
    window.__dbg.norender = true;
    const me = HERO_IDX[k], out = {}; const gs = BAL.gasStart; BAL.gasStart = 1e9;
    for (let h = 0; h < HEROES.length; h++) {
      if (h === me) continue; let w = 0, d = 0, n = 16, tsum = 0;
      for (let r = 0; r < n; r++) {
        startGame({ seed: 100 + r, theme: 'desert', mode: 'solo', diff: 1, roster: [{ name: 'A', hero: me, human: 0, team: 0 }, { name: 'B', hero: h, human: 0, team: 1 }] });
        STATE.me = null;
        for (let z = 10; z < 30; z++) for (let x = 10; x < 30; x++) { const i = tIdx(x, z); if (M.t[i] !== T_BUSH) M.t[i] = T_FLOOR; M.box[i] = -1; }
        const [A, B] = G.ents; A.x = 15; A.z = 20; B.x = 25; B.z = 20; G.t = 200; // full aggro range; gas disabled above
        let i = 0; for (; i < 60 * 40 && !G.over; i++) stepGame(1 / 60);
        if (G.winner === 0) w++; else if (G.winner !== 1) d++; tsum += i / 60;
      }
      out[HEROES[h].k] = Math.round(w / n * 100) + (d ? '(' + d + 'draw)' : '');
    }
    BAL.gasStart = gs; return out;
  }, process.env.HERO || 'quill');
  console.log(process.env.HERO || 'quill', JSON.stringify(res));
  await b.close();
})();
