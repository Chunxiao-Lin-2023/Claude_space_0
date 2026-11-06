// Hub cover: staged dining room + title -> cover_raw.png (python step resizes to covers/prophunt.webp 800x450)
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/ph';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/prophunt/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => {
    NETROLE = 'solo'; let seed = 11;
    for (; seed < 400; seed++) { newRound({ seed, mode: 'rt', hider: 1, ai: 0 }); if (MAP.items.filter(i => i.room === 1 && i.k === 'chair').length >= 6) break; }
    ME = 1; enterGame(); G.phase = 'seek'; G.t = 99; STATE.lastPhase = 'seek';
    const ch = MAP.items.find(i => i.room === 1 && i.k === 'chair'), h = G.pl[1], s = G.pl[0];
    h.dg = { k: 'chair', v: ch.v, r: 2 }; const t = MAP.items.find(i => i.room === 1 && i.k === 'dtable');
    h.x = t.x + 1.5; h.y = t.y + 1.3; s.x = t.x - .2; s.y = t.y + 2.2; s.d = Math.PI * .85;
    document.getElementById('hud').style.display = 'none'; document.getElementById('toasts').style.display = 'none'; document.getElementById('banner').style.display = 'none';
    ME = 0; window.__coverCam = [t.x - 1.2, t.y + .6];
  });
  await p.evaluate(() => { const f = camStep; camStep = dt => { f(dt); CAM.x = __coverCam[0]; CAM.y = __coverCam[1]; CAM.S = 105; }; litRooms = () => ROOMS.map(r => r.i); STATE.focus = null; computeFocus = () => { STATE.focus = { kind: 'pl', i: 1, ok: true }; }; });
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const sh = document.createElement('div'); sh.style.cssText = 'position:fixed;inset:0;z-index:98;pointer-events:none;background:linear-gradient(100deg,rgba(14,16,26,.78) 0%,rgba(14,16,26,.4) 34%,rgba(14,16,26,0) 52%)'; document.body.appendChild(sh);
    const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:56px;top:240px;z-index:99;font-family:"Noto Sans CJK SC",sans-serif;pointer-events:none';
    d.innerHTML = '<div style="font-size:110px;font-weight:900;color:#ffd36a;letter-spacing:.06em;line-height:1;text-shadow:0 5px 0 #8a5a1a,0 10px 24px rgba(0,0,0,.55)">百变迷藏</div><div style="margin-top:14px;font:700 18px sans-serif;letter-spacing:.5em;color:#ffe7a8;text-shadow:0 2px 4px #000">PROP HUNT</div><div style="margin-top:10px;font-size:24px;color:#fff;letter-spacing:.12em;text-shadow:0 2px 6px #000">哪一把椅子是人变的？</div>';
    document.body.appendChild(d);
  });
  await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/cover_raw.png' });
  await b.close();
})();
