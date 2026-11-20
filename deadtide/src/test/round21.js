// Round 21: each gun has its own job (rifle > pistol per shot), special zombies take real work, every kind can turn up from night 1-2.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 900, height: 600 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const s = await p.evaluate(() => {
    window.__dbg.skipDraw = true; NETROLE = 'solo';
    const by = k => WPN.find(w => w.k === k), kindsAt = n => { const ks = new Set(); for (let i = 0; i < 5; i++) { startGame(100 + i, ['甲'], 'normal', 0, 'classic', 'town'); W.night = n - 1; startNight(); for (const q of W.spawnQ) ks.add(q.k); } return [...ks]; };
    return { pr: [by('pistol').dmg, by('rifle').dmg], tags: WPN.filter(w => !w.tag).map(w => w.k), elite: ['spitter', 'screamer', 'bloater', 'armored'].map(k => Math.ceil(ZT[k].hp / by('rifle').dmg)),
      brute: Math.ceil(ZT.brute.hp / by('sniper').dmg), n1: kindsAt(1), n2: kindsAt(2), n3: kindsAt(3) };
  });
  check('rifle hits harder per shot than the pistol', s.pr[1] > s.pr[0], JSON.stringify(s.pr));
  check('every gun says what it is for', !s.tags.length, JSON.stringify(s.tags));
  check('specials take 5+ rifle body shots, a brute 4+ sniper shots (night 1)', s.elite.every(n => n >= 5) && s.brute >= 4, JSON.stringify([s.elite, s.brute]));
  check('night 1 brings 5+ kinds, night 2 brings 8+, night 3 has all 10', s.n1.length >= 5 && s.n2.length >= 8 && s.n3.length >= 10, JSON.stringify([s.n1, s.n2, s.n3]));
  await p.evaluate(() => { W.p[0].owned[2] = 1; window.__toasts = []; const t0 = window.toast; window.toast = m => { __toasts.push(m); t0(m); }; act('wpn', 2); });
  check('switching to a gun tells you what it is for', (await p.evaluate(() => __toasts.join('|'))).includes('步枪 · 持续火力'), await p.evaluate(() => __toasts.join('|')));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
