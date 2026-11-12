const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); pg.on('pageerror', e => console.log('PERR', e.message)); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  const r = await pg.evaluate(() => { const out = {}; for (const k of ['face', 'mirror', 'eyes', 'hand', 'red']) out[k] = [.12, .4, .7, .95].map(p => { const c = mk(120, 160), x = c.getContext('2d'); paintScare(x, 120, 160, k, p); return c.toDataURL(); }); return out; });
  let i = 0; for (const k in r) r[k].forEach((d, j) => fs.writeFileSync(`/tmp/kbw/sc_${k}_${j}.png`, Buffer.from(d.split(',')[1], 'base64'))); await b.close(); })();
