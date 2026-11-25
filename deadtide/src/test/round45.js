// Round 45: a room opened from a save reaches the teammate whole (big messages go in pieces; Safari's 64 KB limit); the teammate's 神兽 progress comes back; 风暴陨击 reworked
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const ctx = await b.newContext({ viewport: { width: 600, height: 400 } }); await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; const mk = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(300000); p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); await p.evaluate(() => { window.__dbg.skipDraw = true; }); return p; };
  const A = await mk(), B = await mk();
  for (const map of ['town', 'city']) {
    // host: a built-up two-player save → open a room from it; the channel keeps what a Safari peer would accept (≤ 64 KB)
    const sent = await A.evaluate((map) => { for (let n = 1; n <= 5; n++) clearSave(n); NETROLE = 'host'; NET.guestName = '小青'; startGame(4242, ['房主', '小青'], 'normal', 0, 'classic', map); SLOT = 1;
      const me = W.p[0]; let put = 0; for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) { const x = Math.floor(me.x) + dx, y = Math.floor(me.y) + dy; for (let L = 0; L < 3; L++) { const i = ci(x, y, L); if (!W.blk[i] && (dx * dy + L) % 3 === 0) { W.blk[i] = 1 + (put % 5); W.bhp[i] = 37 + put % 900; put++; } } }
      W.p[1].evo = 33; W.p[1].vehs = 6; W.p[1].veh = 2; recomputeStab(); W.ver++; saveGame(true);
      const msgs = []; NET.gctl = { open: true, label: 'ctl', send: s => msgs.push(s) }; NET.gsnap = { open: true, label: 'snap', send: s => msgs.push(s) };
      startGame(1, ['房主', '小青'], 'normal', 0, 'classic', map); hostFromSave(loadSlot(1), 1);
      const h = a => { let x = 0; for (let i = 0; i < a.length; i++) x = (x * 31 + (a[i] | 0)) | 0; return x; };
      return { msgs, big: msgs.filter(s => s.length > 65536).length, max: Math.max(...msgs.map(s => s.length)), n: msgs.length, blk: h(W.blk), bhp: h(W.bhp), evo: W.p[1].evo, put }; }, map);
    const got = await B.evaluate((msgs) => { NETROLE = 'guest'; for (const s of msgs) if (s.length <= 65536) guestRecv(JSON.parse(s));
      const h = a => { let x = 0; for (let i = 0; i < a.length; i++) x = (x * 31 + (a[i] | 0)) | 0; return x; }; return { blk: W ? h(W.blk) : 0, bhp: W ? h(W.bhp) : 0 }; }, sent.msgs);
    check(map + ': every message the host sends fits a Safari / iPad peer (≤ 64 KB)', sent.big === 0, 'largest ' + sent.max + ' chars, ' + sent.n + ' messages');
    check(map + ': the teammate gets the saved world block for block (blocks and their hp)', got.blk === sent.blk && got.bhp === sent.bhp, JSON.stringify({ host: [sent.blk, sent.bhp], guest: [got.blk, got.bhp], built: sent.put }));
    check(map + ': the teammate\'s 神兽 progress comes back from the save', sent.evo === 33, 'evo ' + sent.evo);
  }
  // chunking also survives a message that would be over Chrome's 256 KB
  const r = await A.evaluate(() => { const out = []; NET.gctl = { open: true, label: 'ctl', send: s => out.push(s) }; NETROLE = 'host'; sendRaw(NET.gctl, { t: 'echo', d: 'x'.repeat(300000) }); let whole = null; for (const s of out) { const m = JSON.parse(s); if (m.t === 'chk') whole = netUnchunk(m) || whole; } return { n: out.length, max: Math.max(...out.map(s => s.length)), ok: whole && whole.d.length === 300000 }; });
  check('a 300 KB message goes in pieces and comes back whole', r.ok && r.max < 16000, JSON.stringify(r));
  // 风暴陨击 (铁卫 + 苍隼): the tornado sits on the aim point, pulls a walking crowd in and lifts it, the fusion rides up and lands on its eye
  const s = await A.evaluate(() => { NETROLE = 'solo'; W.fus = null; startGame(9, ['a'], 'normal', 0, 'classic', 'town'); const me = W.p[0];
    const spot = () => { for (let r = 0; r < 60; r++) for (let k = 0; k < 24; k++) { const x = Math.floor(me.x + Math.cos(k / 24 * 6.28) * r * 2), y = Math.floor(me.y + Math.sin(k / 24 * 6.28) * r * 2); let clear = true; for (let dy = -11; dy <= 11 && clear; dy++) for (let dx = -11; dx <= 11 && clear; dx++) if (!inMap(x + dx, y + dy) || gAt(x + dx, y + dy) !== gAt(x, y)) clear = false; if (clear) { for (let dy = -11; dy <= 11; dy++) for (let dx = -11; dx <= 11; dx++) for (let L = 0; L < ML; L++) { const i = ci(x + dx, y + dy, L); W.blk[i] = 0; W.slab[i] = 0; } recomputeStab(); W.ver++; W.navDirty = true; return { x: x + 0.5, y: y + 0.5, L: gAt(x, y) }; } } return null; };
    const o = spot(); Object.assign(me, { x: o.x, y: o.y, L: o.L }); me.z = pZ(me); W.zs.length = 0; W.spawnQ = []; W.phase = 'night'; W.nightT = 0; W.clock = 999; visTick();
    Object.assign(me, { vehs: 126, veh: 4, ride: true, mform: 1, mtr: 0, mh: [], bat: 120, mcd: 0, gcd: 0, evoOn: false, evo: 0, aim: 0, aimPt: null, invT: 0 });
    const q = mkPlayer(1, 'B'); W.p.push(q); Object.assign(q, { x: me.x + 1, y: me.y, L: me.L, z: me.z, vehs: 126, veh: 5, ride: true, mform: 1, mtr: 0, mh: [], evoOn: false, bat: 120, aim: 0 }); fuseStart(me, q); q.x = me.x; q.y = me.y; const F = W.fus, G = W.p[F.g];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const crowd = [];
    for (let k = 0; k < 20; k++) { const a = (rnd() - 0.5) * 2.2, d = 3 + rnd() * 7; const z = spawnZombie('walker', 0); z.x = me.x + Math.cos(a) * d; z.y = me.y + Math.sin(a) * d; z.L = me.L; z.z = me.z; z.hp = z.maxHp = 4000; z.sleep = false; crowd.push(z); } visTick();
    G.aimPt = { x: me.x + 7, y: me.y, z: me.z }; G.shl = 9; const evs = []; const f0 = window.fxEvent; window.fxEvent = e => { evs.push(e); return f0(e); };
    fuseSkill(G, { x: me.x + 7, y: me.y }); const w0 = W.whirl && W.whirl.find(w => w.big === 2); const at = w0 ? Math.hypot(w0.x - me.x, w0.y - me.y) : 0, cx = w0 ? w0.x : 0, cy = w0 ? w0.y : 0;
    let flew = false, lifted = 0, maxIn = 0;
    for (let k = 0; k < 11 * 60; k++) { W.t += 1 / 60; stepDelayed(1 / 60); fuseStep(1 / 60); whirlStep(1 / 60); stepZombies(1 / 60); if (W.p[F.d] && W.p[F.d].mfly) flew = true; lifted = Math.max(lifted, crowd.filter(z => z.air).length); if (k < 2.2 * 60) maxIn = Math.max(maxIn, crowd.filter(z => z.hp > 0 && Math.hypot(z.x - cx, z.y - cy) < 3.5).length); }
    window.fxEvent = f0; const lost = crowd.map(z => 4000 - Math.max(0, z.hp)); const D = W.p[F.d];
    return { name: fusUltName(F), at: +at.toFixed(1), flew, landed: D && !D.mfly, landD: D ? +Math.hypot(D.x - cx, D.y - cy).toFixed(1) : -1, lifted, maxIn, dmg: Math.round(lost.reduce((a, b) => a + b, 0)), hit: lost.filter(x => x > 0).length, big: lost.filter(x => x >= 400).length, meteor: evs.some(e => e.ek === 'meteor') }; });
  check('风暴陨击: the tornado stands on the aim point (7 ahead), not at your feet', s.name === '风暴陨击' && s.at > 6 && s.at < 8, JSON.stringify(s));
  check('风暴陨击: it pulls most of a walking crowd (20, spread 3–10) into its eye and lifts them', s.maxIn >= 10 && s.lifted >= 5, 'in 3.5 at once: ' + s.maxIn + ', lifted at once: ' + s.lifted);
  check('风暴陨击: 飞天要塞 rides up with it and comes down on the eye', s.flew && s.landed && s.landD < 1.5 && s.meteor, JSON.stringify({ flew: s.flew, landed: s.landed, landD: s.landD }));
  check('风暴陨击: more total damage on the walking crowd than before (10566) and nearly everyone hit hard', s.dmg > 12000 && s.big >= 15, 'total ' + s.dmg + ', hit ' + s.hit + ', ≥400: ' + s.big);
  const v = await B.evaluate(() => { NETROLE = 'guest'; showScreen('lobby'); STATE.mode = 'lobby'; guestRecv({ t: 'lobby', v: '第 43b 轮', ready: false, host: '房主', code: 'ABCD', diff: 'normal', mode: 'classic', map: 'town' }); const el = $('lVer'); const old = { shown: !el.classList.contains('hidden'), txt: el.textContent };
    guestRecv({ t: 'lobby', v: BUILD_TAG, ready: false, host: '房主', code: 'ABCD', diff: 'normal', mode: 'classic', map: 'town' }); return { old, same: el.classList.contains('hidden') }; });
  check('lobby: a teammate on another version gets a plain "refresh" warning; the same version shows none', v.old.shown && /版本不一样/.test(v.old.txt) && /刷新/.test(v.old.txt) && v.same, JSON.stringify(v));
  check('no errors', errs.length === 0, JSON.stringify(errs.slice(0, 3)));
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close();
})();
