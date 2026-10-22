// Hub cover: staged city + title -> cover_raw.png (python step resizes to covers/housemogul.webp 800x450)
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/hm';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/housemogul/src/out/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => {
    NETROLE = 'solo'; newGame(777, ['我', '小青'], 1, PRESET.full); enterGame(0);
    document.getElementById('hud').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
    const own = (i, n) => G.props.filter(q => q.owner === -1 && q.kind !== 'mansion' && !q.list).slice(n, n + 3).forEach(q => { q.owner = i; q.paid = val(q) * 0.85; q.offer = val(q) * 1.12; });
    own(0, 4); own(1, 30); own(2, 50);
    STATE.sel = -1; window.__dbg.notags = 1; CAM.z = 1.0; CAM.x = -10; CAM.y = 380; CAM.tx = CAM.ty = CAM.tz = null;
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const d = document.createElement('div');
    const sh = document.createElement('div'); sh.style.cssText = 'position:fixed;inset:0;z-index:98;pointer-events:none;background:linear-gradient(100deg,rgba(10,18,30,.72) 0%,rgba(10,18,30,.35) 34%,rgba(10,18,30,0) 52%)'; document.body.appendChild(sh);
    d.style.cssText = 'position:fixed;left:56px;top:250px;z-index:99;font-family:"Noto Serif CJK SC","Noto Sans CJK SC",serif;pointer-events:none';
    d.innerHTML = '<div style="font-size:104px;font-weight:900;color:#fff6dc;letter-spacing:.06em;line-height:1;text-shadow:0 0 26px rgba(245,196,81,.55),0 5px 0 #6b4a12,0 10px 22px rgba(0,0,0,.55)">房产大亨</div><div style="margin-top:12px;font:600 18px Oswald,sans-serif;letter-spacing:.55em;color:#ffe7a8;text-shadow:0 2px 4px #000">REAL ESTATE MOGUL</div><div style="margin-top:10px;font-size:22px;color:#fff;letter-spacing:.12em;text-shadow:0 2px 6px #000">低买高卖 · 买下终极豪宅</div>';
    document.body.appendChild(d);
  });
  await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/cover_raw.png' });
  await b.close();
})();
