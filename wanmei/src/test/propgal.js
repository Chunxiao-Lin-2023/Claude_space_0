// node test/propgal.js [names] — props drawn at native pixel size, magnified (K)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready);
  await pg.evaluate(([names, K]) => { __dbg.skipDraw = true; document.querySelectorAll('body > *').forEach(e => e.style.display = 'none');
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; c.style.cssText = 'position:fixed;left:0;top:0;display:block'; document.body.appendChild(c); document.body.style.display = 'block';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#5e9e42'; g.fillRect(0, 0, 1600, 1000);
    let x = 4, y = 4, rh = 0; for (const n of names.split(',')) { const [nm, v] = n.split(':'); const P = getProto(nm), B = protoBitmap(P, +(v || 0)); if (x + B.cv.width * K > 1600) { x = 4; y += rh + 4; rh = 0; } g.drawImage(B.cv, x, y, B.cv.width * K, B.cv.height * K); x += B.cv.width * K + 6; rh = Math.max(rh, B.cv.height * K); }
  }, [process.argv[2] || 'house,house:1,house2,rock0,rock1,rock2,boulder,logpile,pot,ding', +(process.env.K || 3)]);
  await pg.screenshot({ path: process.env.OUT || '/tmp/claude-0/propgal.png' }); await b.close(); })();
