// Desktop aim: head / body / near-miss magnet / away, reticle state, headshot damage; touch target stickiness.
const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp/dt';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  await p.evaluate(() => { window.__dbg.god = true; const me = W.p[0]; me.x = W.radio.x + 9.5; me.y = W.radio.y - 8.5; me.L = 0; me.wpn = 0; me.nades = 2; me.meds = 1;
    for (let y = -12; y <= 0; y++) for (let x = -3; x <= 6; x++) { const i = ci(Math.floor(me.x) + x, Math.floor(me.y) + y, 0); if (W.blk[i] && !B[W.blk[i]].cost) W.blk[i] = 0; } W.ver++;
    const z = spawnZombie('walker', 0); z.x = me.x + 1.5; z.y = me.y - 6; z.L = 0; z.z = 0; z.stun = 999; z.hp = z.max = 500; });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const aimAt = async (fr, dx, dy) => { let last = null; for (let k = 0; k < 12; k++) { const s = await p.evaluate(fr => { const z = W.zs[0]; return w2s(z.x, z.y, z.z + z.h * fr); }, fr); await p.mouse.move(s[0] + dx, s[1] + dy); await p.waitForTimeout(350); if (last && Math.hypot(s[0] - last[0], s[1] - last[1]) < 0.8) break; last = s; }
    return p.evaluate(() => { const a = W.p[0].aimPt || {}; return { zb: !!a.zb, head: !!a.head, mag: !!a.mag, ret: document.getElementById('reticle').className, tag: document.getElementById('rtTag').textContent, ring: OBJ.lockI.count }; }); };
  let r = await aimAt(1.0, 0, 2); check('cursor on the top of the head -> headshot aim, yellow reticle', r.zb && r.head && /head/.test(r.ret) && r.tag === '爆头' && r.ring === 1, JSON.stringify(r));
  r = await aimAt(0.3, 0, 0); check('cursor on the body -> body aim, red reticle', r.zb && !r.head && /lock/.test(r.ret), JSON.stringify(r));
  r = await aimAt(0.55, 30, 0); check('30 px beside it -> magnet pulls the aim on', r.zb && r.mag, JSON.stringify(r));
  r = await aimAt(0.55, 70, 40); check('far from it -> free aim, plain reticle', !r.zb && !/lock|head/.test(r.ret) && r.ring === 0, JSON.stringify(r));
  await p.screenshot({ path: OUT + '/aim_free.png' });
  // headshots really land: pistol at the head vs at the body
  const shoot = async fr => { await aimAt(fr, 0, fr > 0.9 ? 2 : 0); const h0 = await p.evaluate(() => { W.p[0].mag[0] = 12; W.zs[0].hp = W.zs[0].max = 2000; return 2000; }); await p.mouse.down(); await p.waitForFunction(() => W.p[0].mag[0] <= 6, null, { timeout: 60000 }); await p.mouse.up(); await p.waitForTimeout(300);
    return p.evaluate(h0 => (h0 - W.zs[0].hp) / Math.max(1, 12 - W.p[0].mag[0]), h0); };
  const dh = await shoot(1.0); await p.screenshot({ path: OUT + '/aim_head.png' }); const db = await shoot(0.3);
  check('head shots deal more per shot than body shots', dh > db * 1.4, 'per shot: head ' + dh.toFixed(1) + ' body ' + db.toFixed(1));
  // key legend
  const kl = await p.evaluate(() => document.getElementById('keys').innerText.replace(/\s+/g, ' '));
  check('key legend lists reload / grenade / meds (no jump since round 23)', /R 换弹/.test(kl) && /G (手雷|破片) ×2/.test(kl) && /H 医疗 ×1/.test(kl) && !/空格/.test(kl), kl);
  await p.evaluate(() => { W.p[0].mag[0] = 0; UI.hudT = 0; }); await p.waitForTimeout(400);
  check('empty mag lights R', await p.evaluate(() => !!document.querySelector('#keys kbd.warn')));
  await p.mouse.move(640, 600); await p.keyboard.press('b'); await p.waitForTimeout(600);
  { const t = await p.evaluate(() => W.p[0].build + ' ' + document.getElementById('keys').innerText.replace(/\s+/g, ' ')); check('build mode swaps the legend', /右键 拆/.test(t), t.slice(0, 50)); }
  await p.keyboard.press('b');
  await p.waitForTimeout(400); await p.click('#keys .kh'); await p.waitForTimeout(300); check('legend collapses', await p.evaluate(() => document.getElementById('keys').classList.contains('min') && SET.keysOff));
  await p.click('#keys .kh'); await p.waitForTimeout(300);
  check('weapon bar shows the number keys', /1手枪/.test(await p.evaluate(() => document.getElementById('wbar').innerText.replace(/\s+/g, ''))));
  // touch stickiness: two zombies at nearly the same distance — the current target is kept
  const st = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; const a = spawnZombie('walker', 0), b = spawnZombie('walker', 0); for (const [z, dx] of [[a, -0.6], [b, 0.6]]) { z.x = me.x + dx; z.y = me.y - 5; z.L = 0; z.z = 0; z.stun = 999; }
    let t = touchAutoAim(me, 0, -1, true, null).zb, flips = 0; for (let k = 0; k < 20; k++) { b.y = me.y - 5 + (k % 2 ? 0.15 : -0.15); a.y = me.y - 5; const n = touchAutoAim(me, 0, -1, true, t).zb; if (n !== t) flips++; t = n; }
    const close = spawnZombie('walker', 0); close.x = me.x + 1.2; close.y = me.y + 1; close.L = 0; close.z = 0; close.stun = 999; const n2 = touchAutoAim(me, 0, -1, true, t).zb;
    return { flips, closeWins: n2 === close }; });
  check('touch lock does not flicker between two similar zombies', st.flips === 0, JSON.stringify(st)); check('a zombie right next to you takes the lock', st.closeWins);
  // assist levels: off = no lock and no magnet, strong = old full lock; the pause button cycles 标准 → 强 → 关
  const lv = await p.evaluate(() => { const me = W.p[0]; W.zs.length = 0; const z = spawnZombie('walker', 0); z.x = me.x + 0.4; z.y = me.y - 6; z.L = 0; z.z = 0; z.stun = 999;
    const out = {}; for (const a of [0, 1, 2]) { SET.assist = a; const t = touchAutoAim(me, 0, -1, true, null); const [px, py] = w2s(z.x, z.y, z.z + z.h * 0.55); out[a] = { lock: !!t.zb, magnet: !!aimPick(px + 30, py).zb }; } SET.assist = 1;
    return out; });
  check('assist off: no lock, no magnet; standard and strong lock', !lv[0].lock && !lv[0].magnet && lv[1].lock && lv[2].lock && lv[1].magnet, JSON.stringify(lv));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const cyc = []; for (let k = 0; k < 3; k++) { cyc.push(await p.evaluate(() => document.getElementById('pAssist').textContent)); await p.click('#pAssist'); }
  check('pause button cycles the assist level', cyc.join('|') === '辅助瞄准：标准|辅助瞄准：强|辅助瞄准：关' && await p.evaluate(() => SET.assist === 1), cyc.join(' → '));
  await p.keyboard.press('Escape');
  await p.evaluate(() => { document.getElementById('hud').style.opacity = 1; }); await p.screenshot({ path: OUT + '/aim_hud.png' });
  check('no page errors', !errs.length, errs.join(' | ')); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
