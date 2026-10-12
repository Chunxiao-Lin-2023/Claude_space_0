// UI walk-through: menu, modals, every mode through to its result screen (human slot handed to AI to finish fast).
const { chromium } = require('playwright');
const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const W = +(process.env.W || 1280), H = +(process.env.H || 720);
  const p = await b.newPage({ viewport: { width: W, height: H }, hasTouch: !!process.env.TOUCH });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html' + (process.env.Q || '')); await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT + '/u_menu.png' });
  await p.click('#setBtn'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/u_settings.png' });
  await p.click('#setClose'); await p.click('#questBtn'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/u_quests.png' }); await p.click('#qClose');
  const modes = (process.env.MODES || 'train,solo,gem,ball,bounty,boss,duo').split(',');
  for (const mode of modes) {
    await p.click(`#modeGrid [data-v="${mode}"]`); await p.waitForTimeout(150);
    await p.click('#startBtn'); await p.waitForTimeout(1800);
    await p.mouse.move(800, 300); await p.keyboard.down('w'); await p.waitForTimeout(500); await p.keyboard.up('w');
    await p.keyboard.press('q'); await p.keyboard.press('1'); await p.keyboard.press('t');
    await p.mouse.down(); await p.waitForTimeout(200); await p.mouse.up(); await p.waitForTimeout(600);
    await p.screenshot({ path: OUT + `/u_${mode}_play.png` });
    if (mode === 'train') {
      // drive the tutorial by satisfying each step directly
      await p.evaluate(() => { const me = STATE.me, ms = G.ms; me.x = ms.mark.x; me.z = ms.mark.z; });
      await p.waitForTimeout(400);
      await p.evaluate(() => { G.ms.hits = 3; }); await p.waitForTimeout(400);
      await p.evaluate(() => { STATE.me.supSeq++; }); await p.waitForTimeout(400);
      await p.evaluate(() => { STATE.me.gadUsed = 1; }); await p.waitForTimeout(400);
      await p.evaluate(() => { G.ms.bushT = 3; STATE.me.inBush = true; }); await p.waitForTimeout(1200);
      await p.screenshot({ path: OUT + `/u_train_mid.png` });
      await p.evaluate(() => { G.ms.step = 5; M.boxes[0].hp = 0; }); await p.waitForTimeout(400);
      await p.evaluate(() => { STATE.me.usedGimmick = true; }); await p.waitForTimeout(400);
    } else {
      await p.evaluate(() => { STATE.me.isBot = true; window.__dbg.speed = 8; window.__dbg.skipDraw = true; });
    }
    let r = null;
    for (let i = 0; i < 60; i++) { await p.waitForTimeout(1000); r = await p.evaluate(() => ({ mode: STATE.mode, t: G && +G.t.toFixed(0), over: G && G.over, err: window.__dbg.err || '' })); if (r.mode === 'result' || r.err) break; }
    await p.evaluate(() => { window.__dbg.speed = 1; window.__dbg.skipDraw = false; }); await p.waitForTimeout(2400);
    const info = await p.evaluate(() => ({ mode: STATE.mode, rank: document.getElementById('rRank').textContent, sub: document.getElementById('rSub').textContent, reward: document.getElementById('rReward').textContent, extra: document.getElementById('rExtra').textContent.slice(0, 160), mvp: document.getElementById('rMvp').textContent, trophies: PROG.trophies, coins: PROG.coins, err: window.__dbg.err || '' }));
    console.log(mode, JSON.stringify(r), JSON.stringify(info));
    await p.screenshot({ path: OUT + `/u_${mode}_result.png` });
    if (info.mode === 'result') await p.click('#rMenu'); else await p.evaluate(() => quitToMenu());
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: OUT + '/u_menu2.png' });
  console.log(errs.slice(0, 12).join('\n'));
  await b.close();
})();
