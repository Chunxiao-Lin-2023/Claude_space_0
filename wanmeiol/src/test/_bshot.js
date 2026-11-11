const { chromium } = require('playwright'); const D = '/tmp/claude-0/wmol';
(async () => { const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage(); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('http://localhost:8770/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready); await pg.click('text=开始'); await pg.waitForTimeout(600);
  const t = await pg.evaluate(async ([ids, NIGHT]) => { __dbg.dlgPick(-1); const cv = document.createElement('canvas'); cv.width = 680; cv.height = 200;
    const sheet = document.createElement('canvas'); sheet.width = 1380; sheet.height = Math.ceil(ids.length / 2) * 205; const s = sheet.getContext('2d');
    ids.forEach((id, i) => { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); paintScene(g, 680, 200, id, NIGHT, false, false); s.drawImage(cv, (i % 2) * 690, Math.floor(i / 2) * 205); s.fillStyle = '#fff'; s.font = '14px sans-serif'; s.fillText(id, (i % 2) * 690 + 6, Math.floor(i / 2) * 205 + 16); });
    return sheet.toDataURL('image/png'); }, [process.argv[2].split(','), process.argv[3] === 'night']);
  require('fs').writeFileSync(`${D}/sheet_${process.argv[3] || 'day'}.png`, Buffer.from(t.split(',')[1], 'base64')); await b.close(); })();
