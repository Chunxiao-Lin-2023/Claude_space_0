const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 640, height: 360 } });
  await pg.goto('http://localhost:8765/test.html?q=low'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 });
  const r = await pg.evaluate(() => { const out = []; for (const [name, list] of STATIC.byProto) { const P = getProto(name); const t = P.parts.reduce((s, p) => s + (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3, 0); out.push([name, list.length, Math.round(t), Math.round(t * list.length)]); } out.sort((a, b) => b[3] - a[3]); return out; });
  console.log(r.map(x => x.join('\t')).join('\n')); await b.close();
})();
