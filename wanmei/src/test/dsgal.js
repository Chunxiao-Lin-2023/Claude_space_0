// node test/dsgal.js — beast sheet: states incl. flying eagle
const { chromium } = require('playwright');
(async () => { const args = []; const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const seen = new Set(); pg.on('pageerror', e => { if (seen.has(e.message)) return; seen.add(e.message); console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready);
  await pg.evaluate(([K, R0]) => {
    __dbg.skipDraw = true; document.querySelectorAll('body > *').forEach(e => e.style.display = 'none');
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; c.style.cssText = 'position:fixed;left:0;top:0;display:block'; document.body.appendChild(c); document.body.style.display = 'block';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#7a9a52'; g.fillRect(0, 0, 1600, 1000);
    const W0 = 1600 / K, H0 = 1000 / K, lo = document.createElement('canvas'); lo.width = W0; lo.height = H0; const lg = lo.getContext('2d'); lg.imageSmoothingEnabled = false;
    const rows = [
      [['wolf', {}], ['wolf', { walk: 1, ph: 1.2 }], ['wolf', { act: { k: 'bite', k01: 0.5 } }], ['wolf', { act: { k: 'roar', k01: 0.5 } }], ['lynx', {}], ['lynx', { act: { k: 'claw', k01: 0.5 } }], ['dog', {}]],
      [['mangniu', {}], ['mangniu', { act: { k: 'charge', k01: 0.5 } }], ['biao', {}]],
      [['qingying', {}], ['qingying', { fly: 1, t: 0.0 }], ['qingying', { fly: 1, t: 0.22 }], ['qingying', { fly: 1, act: { k: 'dive', k01: 0.5 } }]],
      [['dapeng', {}], ['xiaoqing', {}], ['ziyun', {}], ['wuseque', {}], ['P:rongling', {}], ['P:rongling', { act: { k: 'pounce', k01: 0.5 } }], ['P:qinglin', {}], ['P:zhuyan', {}], ['snake', {}], ['zjsnake', { act: { k: 'bite', k01: 0.5 } }], ['stakeS', {}]],
    ];
    let y = 4; const sel = R0 ? R0.split(',').map(Number) : null;
    for (const row of rows.filter((r, i) => !sel || sel.includes(i))) { let x = 4, rh = 0;
      for (const [k, a] of row) { const P = k.startsWith('P:') ? Object.values(PARTNER_FORMS).find(f => f.spec(12).key.includes(k.slice(2))).spec(14) : CHARS[k](); const R = buildRig(P); R.hpx = R.hpx || specHeight(P) * 20; const A = Object.assign({ t: 0.3, walk: 0, ph: 0 }, a); const [bw, bh, ax, ay] = sprBox(R, A); SPR.budget = 1e9;
        lg.save(); lg.translate(x + bw * ax, y + bh * ay); drawRigged(lg, R, A, 20, HP, 1); lg.restore(); x += bw * 0.8; rh = Math.max(rh, bh); }
      y += rh * 0.85; }
    g.drawImage(lo, 0, 0, 1600, 1000);
  }, [+(process.env.K || 3), process.env.ROWS || '']);
  await pg.screenshot({ path: '/tmp/claude-0/dsgal.png' }); await b.close(); })();
