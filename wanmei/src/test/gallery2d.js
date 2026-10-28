// node test/gallery2d.js — every prop proto + every character/beast in one sheet
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await pg.goto('http://localhost:8765/test.html'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 60000 });
  const which = process.argv[2] || 'props';
  await pg.evaluate(which => {
    __dbg.skipDraw = true; document.querySelectorAll('body > *:not(#gl)').forEach(e => e.style.display = 'none');
    const g = V.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#7a9a5a'; g.fillRect(0, 0, V.cv.width, V.cv.height);
    if (which === 'props') { const names = Object.keys(PROTO).filter(n => n !== 'ancient'); let x = 10, y = 10, rowH = 0; const S = +(window.__GS || 16); for (const n of names) { const P = PROTO[n], B = protoBitmap(P, 0), q = S / B.s, w = P.w * S, h = P.h * S; if (x + w > 1590) { x = 10; y += rowH + 18; rowH = 0; } g.drawImage(B.cv, x, y, B.cv.width * q, B.cv.height * q); g.fillStyle = '#000'; g.font = '11px sans-serif'; g.fillText(n, x, y + h + 11); x += w + 10; rowH = Math.max(rowH, h); } }
    else { const keys = Object.keys(CHARS).filter(k => k !== 'beiHunter' && k !== 'villager'); const specs = keys.map(k => [k, CHARS[k](3)]).concat([['villager1', CHARS.villager(1, 'man')], ['villager2', CHARS.villager(2, 'woman')], ['villager3', CHARS.villager(3, 'old')], ['villager4', CHARS.villager(4, 'child')], ['hunter', CHARS.beiHunter(2)]]).concat(Object.entries(PARTNER_FORMS).map(([k, f]) => [k, f.spec(12)]));
      let x = 80, y = 200; const K = 150; for (const [k, P] of specs) { const R = buildRig(P); const w = Math.max(1.2, R.h * (R.kind === 'human' ? 0.9 : 1.6)) * K; if (x + w > 1580) { x = 80; y += 300; } g.save(); g.translate(x + w / 2, y); shadowBlob(g, 0, 0, 30, 10); drawRigged(g, R, R.A, K, R.kind === 'human' ? 0 : HP, 1); g.restore(); g.fillStyle = '#000'; g.font = '12px sans-serif'; g.fillText(k, x, y + 16); x += w + 20; } }
  }, which);
  await pg.screenshot({ path: `/tmp/claude-0/gallery_${which}.png` }); await b.close();
})();
