// Neighbouring / occluding buildings are cut down to your floor so their doors and rooms show.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(150000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5, null, { timeout: 90000 });
  await p.evaluate(() => { window.__dbg.god = true; W.clock = 999; document.getElementById('hud').style.opacity = 0.15; W.zs.length = 0; });
  const hk = await p.evaluate(() => TOWN_HOUSES.findIndex(h => h[5] === 'apt' && h[4] >= 4));
  console.log('apt', hk, await p.evaluate(hk => TOWN_HOUSES[hk].join(','), hk));
  const shot = async (n, f) => { await p.evaluate(f, hk); await p.evaluate(() => { const me = W.p[0]; CAM.tx = me.x; CAM.ty = me.y; CAM.tz = me.L * FH; CAM.lookX = CAM.lookY = 0; }); await p.waitForTimeout(1500);
    console.log(n, await p.evaluate(() => 'cuts=' + LCUTS.map(c => c.k + '@' + c.L).join(' ') + ' inside=' + (LCUT ? LCUT.k : '-')));
    await p.screenshot({ path: OUT + '/cut_' + n + '.png' }); };
  const free = (x, y, L) => `(()=>{for(let r=0;r<4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(standable(${x}+dx,${y}+dy,${L},'p')){const me=W.p[0];me.x=${x}+dx+0.5;me.y=${y}+dy+0.5;me.L=${L};me.z=pZ(me);return;}})()`;
  await shot('far', new Function('hk', `const H=TOWN_HOUSES[hk]; CAM.zoom=11; ${free('H[0]-10', 'H[3]+10', 0).replace(/H\[/g, 'TOWN_HOUSES[hk][')}`));
  await shot('near', new Function('hk', `const H=TOWN_HOUSES[hk]; CAM.zoom=11; ${free('H[0]-2', '((H[1]+H[3])>>1)', 0).replace(/H\[/g, 'TOWN_HOUSES[hk][')}`));
  await shot('behind', new Function('hk', `const H=TOWN_HOUSES[hk]; CAM.zoom=11; ${free('H[2]-3', 'H[1]-3', 0).replace(/H\[/g, 'TOWN_HOUSES[hk][')}`));
  await shot('inside2', new Function('hk', `const H=TOWN_HOUSES[hk]; CAM.zoom=11; ${free('((H[0]+H[2])>>1)', '((H[1]+H[3])>>1)', 2).replace(/H\[/g, 'TOWN_HOUSES[hk][')}`));
  await shot('camp_out', () => { const me = W.p[0]; me.x = W.radio.x + 9.5; me.y = W.radio.y - 7.5; me.L = 0; me.z = 0; CAM.zoom = 9; });
  // picking ignores what's cut: aim at the screen point over the player in 'behind' must not land on a hidden upper floor
  console.log('errs', errs.slice(0, 3)); await b.close();
})();
