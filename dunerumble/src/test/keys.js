// Keyboard movement: plain WASD, arrows, CapsLock/Shift, IME composition ("Process" keys), focus left in an input.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/test.html', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !document.getElementById('loading'), { timeout: 60000 });
  const start = async () => { await p.evaluate(() => { startLocal('boss'); window.__dbg.god = true; window.__dbg.skipDraw = true; }); await p.waitForTimeout(800); };
  const pos = () => p.evaluate(() => ({ x: +STATE.me.x.toFixed(2), z: +STATE.me.z.toFixed(2) }));
  const hold = async (key, ms = 600) => { const a = await pos(); await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(100); const c = await pos(); return { dx: +(c.x - a.x).toFixed(2), dz: +(c.z - a.z).toFixed(2) }; };
  // synthetic events the way an IME / other layouts deliver them
  const synth = async (key, code, ms = 600) => { const a = await pos(); await p.evaluate(([key, code]) => dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true })), [key, code]); await p.waitForTimeout(ms); await p.evaluate(([key, code]) => dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true })), [key === 'Process' ? code.slice(3).toLowerCase() : key, code]); await p.waitForTimeout(100); const c = await pos(); return { dx: +(c.x - a.x).toFixed(2), dz: +(c.z - a.z).toFixed(2) }; };
  await start();
  const r = {};
  r.w0 = await hold('w'); r.w0b = await hold('w');
  for (const k of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft']) r[k] = await hold(k);
  await p.keyboard.down('Shift'); r.shiftW = await hold('W'); await p.keyboard.up('Shift');
  r.imeW = await synth('Process', 'KeyW'); r.imeD = await synth('Process', 'KeyD');
  r.azertyZ = await synth('z', 'KeyW');
  r.stuck = await p.evaluate(() => JSON.stringify(Object.entries(INP.keys).filter(([k, v]) => v)));
  // focus left in a text field (Safari doesn't move focus to a clicked button)
  await p.evaluate(() => quitToMenu()); await p.waitForTimeout(300);
  await p.focus('#nameIn'); await start();
  r.focusInput = await p.evaluate(() => document.activeElement.id || document.activeElement.tagName);
  r.afterInputW = await hold('w');
  console.log(JSON.stringify(r, null, 1), errs.slice(0, 3));
  await b.close();
})();
