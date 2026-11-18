// CPU-side cost per frame: cell rebuild time, draw calls, triangles, how often a walk triggers a rebuild.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 852, height: 393 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000);
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.evaluate(() => $('soloBtn').click()); await p.waitForFunction(() => W && W.t > 0.5);
  await p.evaluate(() => { window.__dbg.god = true; window.__dbg.skipDraw = true; W.clock = 999; });
  const at = (n, x, y, L, zoom) => p.evaluate(([x, y, L, zoom]) => {
    const me = W.p[0]; me.x = x; me.y = y; me.L = L; me.z = pZ(me); CAM.zoom = zoom; CAM.tx = x; CAM.ty = y; CAM.lookX = CAM.lookY = 0; LC_KEY = ''; viewL();
    let t = performance.now(); for (let k = 0; k < 5; k++) rebuildCells(); const rb = (performance.now() - t) / 5;
    RENDER.info.reset(); RENDER.info.autoReset = false; t = performance.now(); RENDER.render(SCN, CAMO); const rd = performance.now() - t; const inf = RENDER.info.render; RENDER.info.autoReset = true;
    let inst = 0, meshes = 0; SCN.traverse(o => { if (o.isMesh && o.visible) { meshes++; if (o.isInstancedMesh) inst += o.count; } });
    return { rebuild_ms: +rb.toFixed(1), calls: inf.calls, tris: inf.triangles, instances: inst, meshes, gl_ms: +rd.toFixed(0) };
  }, [x, y, L, zoom]).then(r => console.log(n.padEnd(12), JSON.stringify(r)));
  await at('camp z9', 48.5, 41.5, 0, 9);
  await at('town z9', 100.5, 70.5, 0, 9);
  await at('town z13', 100.5, 70.5, 0, 13);
  await at('town z20', 100.5, 70.5, 0, 20);
  // walking: rebuilds per simulated second
  console.log('walk', await p.evaluate(() => new Promise(r => { let n = 0; const orig = rebuildCells; window.rebuildCells = rebuildCells = function () { n++; return orig(); }; window.__dbg.skipDraw = false; INP.keys.d = true; const t0 = W.t; const f = () => { if (W.t - t0 >= 3) { INP.keys.d = false; window.__dbg.skipDraw = true; r('rebuilds in 3s walking: ' + n); } else setTimeout(f, 50); }; f(); })));
  await b.close();
})();
