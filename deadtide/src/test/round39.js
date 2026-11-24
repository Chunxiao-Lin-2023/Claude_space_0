// Round 39: bespoke mech / gun upgrade looks, laser sights, trimmed build list, upgrade blueprints in 尸城求生, touch aim holds on target
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 500, height: 360 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(240000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'classic', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  const S = (fn, a) => p.evaluate(fn, a);
  // every mech builds its three upgrade levels, each level adds parts, the per-frame animations run without errors
  let s = await S(() => { window.requestAnimationFrame = () => 0; const out = {};
    for (let k = 1; k <= 6; k++) { const g = mkMech(k), J = g.userData.J; mechUpgSet(J, 3); const n = J.upg.map(L => L.length); const vis = J.upg.every(L => L.every(o => o.visible)); mechUpgSet(J, 1); const vis1 = J.upg[0].every(o => o.visible) && !J.upg[1].some(o => o.visible) && !J.upg[2].some(o => o.visible);
      const pp = { _mpT: 0.1, i: 0 }; for (let q = 0; q < 3; q++) { J._ul = 3; mechUpgTick(J, pp, 1 / 60, 3, 5); } out[k] = [n.join('/'), vis, vis1, MUPG_NAME[k].length]; }
    return out; });
  for (let k = 1; k <= 6; k++) check('mech ' + k + ': three levels of its own parts, shown level by level', s[k][0].split('/').every(x => +x >= 4) && s[k][1] && s[k][2] && s[k][3] === 3, JSON.stringify(s[k]));
  // guns: bespoke parts for all seven, and a laser beam from Lv2 (red) that turns gold at Lv3
  s = await S(() => { const me = W.p[ME], m = OBJ.pl[ME], out = {}; out.parts = m.guns.map(q => q.userData.up ? q.userData.up.map(u => u.children.length).join('/') : 'x');
    me.wpn = 2; me.ride = false; me.build = false; me.reloadT = 0; me.aimPt = { x: me.x + 6, y: me.y, z: me.z + 0.7 }; window.__dbg.aimAt = () => ({ x: me.x + 6, y: me.y, z: me.z + 0.7 });
    let T = performance.now(); const fr = n => { for (let i = 0; i < n; i++) { T += 16.7; frame(T); } };
    W.wlv[2] = 1; fr(20); out.b1 = m.guns[2].userData.beam.visible; W.wlv[2] = 2; fr(20); const bm = m.guns[2].userData.beam; out.b2 = bm.visible; out.col2 = bm.material.color.getHexString(); const v = new THREE.Vector3(), sc = new THREE.Vector3(); bm.getWorldScale(sc); out.len = Math.round(sc.x * 10) / 10;
    W.wlv[2] = 3; fr(10); out.col3 = bm.material.color.getHexString(); W.wlv[2] = 0; return out; });
  check('every gun has three levels of its own parts', s.parts.every(x => x !== 'x' && x.split('/').every(n => +n >= 1)), s.parts.join(' '));
  check('laser sight from Lv2 (red), reaching the aim point, gold at Lv3; none at Lv1', !s.b1 && s.b2 && s.col2 === 'ff3a3a' && s.len > 4 && s.len < 8 && s.col3 === 'ffd040', JSON.stringify(s));
  // trimmed build list: cover 2, traps 2, turrets 3; retired kinds can't be built through the action, but old ones still stand
  s = await S(() => { const me = W.p[ME], out = {}; out.items = ITEMS.map(g => g.k + ':' + g.ids.map(id => B[id].name).join('|')).join(' ');
    const x = Math.floor(me.x) + 2, y = Math.floor(me.y), L = me.L; W.res = { wood: 99, stone: 99, steel: 99, parts: 99 }; doAct(me, 'build', { x, y, l: L, b: 58, d: 0 }); out.frost = W.blk[ci(x, y, L)];
    me.sel = 14; uiBuildBar(); out.sel = me.sel; return out; });
  check('build list: 掩体 2, 陷阱 2, 炮塔 3', /cover:木板路障\|射击栅栏 trap:铁丝网\|地雷 turret:机枪塔\|霰弹塔\|狙击塔/.test(s.items), s.items);
  check('a retired kind is refused by the build action; an old selection falls back', s.frost !== 58 && s.sel === 1, JSON.stringify(s));
  // touch auto-aim never locks on to a zombie you can't see
  s = await S(() => { const me = W.p[ME]; W.zs.length = 0; SET.assist = 1; const z = spawnZombie('walker', 0); let a = null, seen = false;
    for (let k = 0; k < 16 && !(a && a.zb); k++) { const an = k / 16 * Math.PI * 2; z.x = me.x + Math.cos(an) * 4; z.y = me.y + Math.sin(an) * 4; z.L = me.L; z.z = me.z; z.sleep = false; visTick(); seen = zSeen(z); a = touchAutoAim(me, Math.cos(an), Math.sin(an), true, null); }
    VIS = [{ x: me.x, y: me.y, r2: 4 }]; const b2 = touchAutoAim(me, 1, 0, true, null); W.zs.length = 0; visTick(); return { seen, a: !!(a && a.zb), b: !!(b2 && b2.zb) }; });
  check('touch auto-aim skips zombies outside your view', s.seen && s.a && !s.b, JSON.stringify(s));
  // 尸城求生: searching also turns up mech / gun / armour blueprints (no vehicle ones: it has its own)
  s = await S(() => { const me = W.p[ME], out = {}; const md0 = W.mode; W.mode = 'siege'; try { W.bps = []; const kinds = {}; for (let i = 0; i < 300; i++) { const r = bpRoll(me); if (r) kinds[r[3] === '·' ? 'x' : r] = 1; }
      out.kinds = W.bps.map(b => b[0]).filter((v, i, a) => a.indexOf(v) === i).sort().join(''); out.veh = W.bps.some(b => b[0] === 'v'); out.upg = upgOn(); W.bps = ['a1']; const a0 = me.arm; me.arm = 0; W.res = { wood: 99, stone: 99, steel: 99, parts: 99 }; doAct(me, 'bpinst', 0); out.arm = me.arm; me.arm = a0; } finally { W.mode = md0; } return out; });
  check('尸城求生 drops armour / mech / gun blueprints and they install', /a/.test(s.kinds) && /g/.test(s.kinds) && !s.veh && s.upg && s.arm === 2, JSON.stringify(s));
  check('no page errors', !errs.length, errs.join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})();
