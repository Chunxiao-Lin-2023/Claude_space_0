// Every hero: normal attack and super at a dummy enemy standing 2.5 tiles away; reports damage dealt and side effects.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://localhost:8765/test.html'); await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    window.__dbg.norender = true;
    const out = {};
    for (let h = 0; h < HEROES.length; h++) {
      SEL.hero = h; SEL.mode = 'solo';
      startGame({ seed: 11 + h, theme: 'desert', mode: 'solo', diff: 1, roster: buildRoster(false) });
      // open arena: clear tiles around the center and place me + one dummy
      for (let z = 14; z < 26; z++) for (let x = 14; x < 26; x++) { const i = tIdx(x, z); M.t[i] = T_FLOOR; M.box[i] = -1; }
      const me = STATE.me, foe = G.ents[1];
      for (const e of G.ents.slice(2)) e.alive = false;
      me.isBot = false; foe.isBot = false; me.x = 18; me.z = 20; foe.x = 20.5; foe.z = 20; foe.hp = foe.mhp = 1e6;
      const step = n => { for (let i = 0; i < n; i++) stepGame(1 / 60); };
      const hp0 = foe.hp;
      me.inp.aim = 0; me.inp.tx = foe.x; me.inp.tz = foe.z; me.inp.fire = true; step(90);
      const atkDmg = Math.round(hp0 - foe.hp);
      const hp1 = foe.hp; me.sup = 1; me.hp = me.mhp * 0.5;
      me.inp.aim = 0; me.inp.tx = h === HERO_IDX.spore ? me.x : foe.x; me.inp.tz = me.z; me.inp.sup = true; step(150);
      out[me.H.k] = { atk: atkDmg, sup: Math.round(hp1 - foe.hp), supSeq: me.supSeq, zones: G.zones.length, shield: Math.round(me.shield), stealth: +me.stealthT.toFixed(1), foeSlow: +foe.slowT.toFixed(1), foeStun: +foe.stunT.toFixed(1), meHp: Math.round(me.hp / me.mhp * 100) + '%', turrets: G.turrets.length, err: window.__dbg.err || '' };
    }
    return out;
  });
  console.table(res); console.log(errs.slice(0, 5));
  await b.close();
})();
