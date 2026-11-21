// Touch controls must never overlap each other (use button shown, med shown), on phone landscape / portrait and iPad.
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0;
  for (const [vp, w, h] of [['phoneL', 852, 393], ['phoneP', 393, 852], ['ipad', 1180, 820], ['ipadP', 820, 1180]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, userAgent: UA }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await c.newPage(); await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.3, null, { timeout: 90000 });
    const r = await p.evaluate(() => {
      for (const id of ['tUse', 'tMed']) { const e = document.getElementById(id); e.classList.remove('hidden'); e.style.display = 'flex'; }
      const ids = ['tFire', 'tNade', 'tShove', 'tWpn', 'tUse', 'tMed'] /* round 22+: reload and jump keys are gone */, R = {};
      for (const id of ids) { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') continue; R[id] = e.getBoundingClientRect(); }
      const bad = []; const k = Object.keys(R);
      for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = R[k[i]], c = R[k[j]]; const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (!(ox > 1 && oy > 1)) continue;
        const f = k[i] === 'tFire' ? a : k[j] === 'tFire' ? c : null, o = f === a ? c : a;
        const rnd = id => ['tFire', 'tReload', 'tNade', 'tShove', 'tJump'].includes(id);
        if (rnd(k[i]) && rnd(k[j])) { if (Math.hypot((a.left + a.right - c.left - c.right) / 2, (a.top + a.bottom - c.top - c.bottom) / 2) >= (a.width + c.width) / 2 - 2) continue; }
        else if (f) { const cx = (f.left + f.right) / 2, cy = (f.top + f.bottom) / 2, rr = f.width / 2, nx = Math.max(o.left, Math.min(cx, o.right)), ny = Math.max(o.top, Math.min(cy, o.bottom)); if (Math.hypot(nx - cx, ny - cy) >= rr - 1) continue; } // the fire button is round
        bad.push(k[i] + '/' + k[j]); }
      const off = k.filter(id => R[id].left < 0 || R[id].top < 0 || R[id].right > innerWidth || R[id].bottom > innerHeight);
      return { bad, off, use: [R.tUse.left | 0, R.tUse.top | 0, R.tUse.width | 0] };
    });
    const ok = !r.bad.length && !r.off.length; if (!ok) fails++;
    console.log((ok ? 'PASS ' : 'FAIL ') + vp, JSON.stringify(r));
    await p.screenshot({ path: '/tmp/dt/tc_' + vp + '.png' });
    await c.close();
  }
  console.log(fails ? fails + ' FAILED' : 'ALL PASS'); await b.close();
})();
