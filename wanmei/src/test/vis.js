const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 640, height: 360 } });
  await pg.goto('http://localhost:8765/test.html?q=low'); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 }); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => { const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(R3.cam.projectionMatrix, R3.cam.matrixWorldInverse)); const m = {}; R3.scene.traverseVisible(o => { if (!o.isMesh && !o.isPoints) return; const g = o.geometry; let t = (g.index ? g.index.count : g.attributes.position.count) / 3; if (o.isInstancedMesh) t *= o.count; if (g.isInstancedBufferGeometry) t *= g.instanceCount; let k = o.isInstancedMesh ? 'inst:' + (o.parent.children.length) : o.name || o.type; if (o.isInstancedMesh) { for (const [n, l] of STATIC.byProto) { if (getProto(n).parts.some(p => p.geo === g) || (getProto(n).lod || []).some(p => p.geo === g)) { k = n + ':' + o.userData.lod; break; } } } m[k] = (m[k] || 0) + t; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 15); });
  console.log(r.map(x => x[0] + '\t' + Math.round(x[1])).join('\n')); await b.close();
})();
