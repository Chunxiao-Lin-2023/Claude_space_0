// node test/sidegal.js [keys] — big view of human sprites: front / side / back / 6 walk frames side + front
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n')[1]));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready);
  await pg.evaluate(([keys, K]) => {
    __dbg.skipDraw = true; document.querySelectorAll('body > *').forEach(e => e.style.display = 'none');
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; c.style.cssText = 'position:fixed;left:0;top:0;display:block'; document.body.appendChild(c); document.body.style.display = 'block';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#7a9a52'; g.fillRect(0, 0, 1600, 1000);
    const lo = document.createElement('canvas'); lo.width = 1600 / K; lo.height = 1000 / K; const lg = lo.getContext('2d');
    let y = 4; for (const k of keys.split(',')) { const P = k.startsWith('vil') ? CHARS.villager(+k.slice(3, 4), k.slice(4)) : CHARS[k](); const R = buildRig(P); let x = 4, rh = 0;
      const put = (A, rot) => { SPR.budget = 1e9; const [bw, bh, ax, ay] = sprBox(R, A); lg.save(); lg.translate(x + bw * ax, y + bh * ay); drawRigged(lg, R, A, 20, rot, 1); lg.restore(); x += Math.round(R.hpx * 0.75); rh = Math.max(rh, R.hpx + 8); };
      for (const rot of [0, HP, PI]) put({ t: 0, walk: 0, ph: 0 }, rot); x += 6;
      for (let f = 0; f < WALKF; f++) put({ t: 0, walk: 1, ph: (f + 0.5) / WALKF * TAU }, HP); x += 6;
      for (let f = 0; f < WALKF; f++) put({ t: 0, walk: 1, ph: (f + 0.5) / WALKF * TAU }, 0);
      y += rh; }
    g.drawImage(lo, 0, 0, 1600, 1000);
  }, [process.argv[2] || 'xiaobudian,chief,linhu,vil2woman,ermeng', +(process.env.K || 4)]);
  await pg.screenshot({ path: '/tmp/claude-0/sidegal.png' }); await b.close(); })();
