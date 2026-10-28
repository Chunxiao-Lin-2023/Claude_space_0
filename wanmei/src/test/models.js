// close-up shots of every character model. usage: node test/models.js [outdir]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/claude-0/models'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 480, height: 480 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await pg.goto('http://localhost:8765/test.html?q=' + (process.env.QL || 'mid')); await pg.waitForFunction(() => window.__dbg && window.__dbg.ready, null, { timeout: 90000 });
  await pg.evaluate(() => { localStorage.clear(); __dbg.speed = 1; });
  await pg.evaluate(() => { PARTY.pname = '团团'; startSolo(null); }); await pg.waitForTimeout(500);
  await pg.evaluate(() => { W.skip = true; });
  await pg.waitForFunction(() => !STORY.running, null, { timeout: 120000 });
  const list = (process.env.LIST || 'xbd,pet,chief,linhu,feijiao,ermeng,pihou,dazhuang,vil1,vil2,dog,beifeng,wolf,lynx,biao,mangniu,eagle,ziyun,qinglin').split(',');
  await pg.evaluate(() => { setLight('day', true); STORY.running = () => { }; W.cine = true; uiCine(false); document.body.classList.add('notplay'); PARTY.flags.hatched = 1; hidePet(false); const me = W.P[0]; teleport(me, 30, 60, 0); teleport(W.P[1], 31.5, 60.5, 0); });
  for (const k of list) {
    const ok = await pg.evaluate(k => {
      const X = 30, Z = 60; let e = null;
      if (k === 'xbd') e = W.P[0]; else if (k === 'pet') e = W.P[1];
      else if (k === 'qinglin') { evolvePartner('qinglin'); e = W.P[1]; teleport(e, X, Z, 0); }
      else if (['beifeng', 'wolf', 'lynx', 'biao', 'mangniu'].includes(k)) { e = spawnMob(k, X, Z, { story: true, respawn: false }); e.script = true; e.rot = 0; }
      else if (k === 'eagle') { e = eagleEnt(X, Z, { flyH: 0.01 }); e.fly = false; e.rot = 0; }
      else if (k === 'ziyun') { e = npc('ziyun', 'ziyun', X, Z, { rot: 0 }); }
      else { e = entByTag(k); if (e) { teleport(e, X, Z, 0); e.wanderR = 0; e.script = true; } }
      if (!e) return false;
      for (const o of W.ents) if (o !== e && o.root && d2(o.x, o.z, X, Z) < 100) o.vis = false; e.vis = true;
      e.rot = 0.5; const h = e.h * (e.scale || 1); const d = Math.max(2.2, h * 1.5);
      camShot([e.x + Math.sin(0.5) * d, e.y + h * 0.75, e.z + Math.cos(0.5) * d], [e.x, e.y + h * 0.55, e.z], 0.01); W.cine = true; window.__cur = e; return true;
    }, k);
    if (!ok) { console.log('missing', k); continue; }
    await pg.waitForTimeout(1200); await pg.screenshot({ path: `${out}/${k}.png`, timeout: 120000 });
    await pg.evaluate(() => { const e = window.__cur; if (e && e.type === 'mob') rmEnt(e); for (const o of W.ents) o.vis = true; });
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
