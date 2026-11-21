// Round 32: permanent tasks with permanent upgrades (hp, backpack, medkits, grenades, lives); dawn takes cleared buildings back; a room can start from a save
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await c.newPage(); p.setDefaultTimeout(200000); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => (SET.mode = 'siege', SET.map = 'town', SET.bconf = 0, $('soloBtn').click())); await p.waitForFunction(() => W && W.t > 0.5);
  let s = await p.evaluate(() => { window.__dbg.skipDraw = true; const me = W.p[0];
    const before = { hp: me.maxHp, med: BAL.medCap, nade: BAL.nadeCap, gn: BAL.gnCap, lives: me.lives, cap: ammoCap(2), rows: W.tasks.length, txt: document.getElementById('tasks').textContent.slice(0, 40) };
    taskAdd('kill', 60); taskAdd('search', 25); taskAdd('build', 40); taskAdd('nade', 15); taskAdd('clean', 2);
    return { before, after: { hp: me.maxHp, med: BAL.medCap, nade: BAL.nadeCap, gn: BAL.gnCap, lives: me.lives, cap: ammoCap(2), perk: W.perk, next: W.tasks.find(t => t.k === 'kill').need } }; });
  check('permanent tasks: each first tier gives a permanent upgrade (hp +10, backpack +25%, medkits +2, grenades +3 / +2, a life), and the next tier asks for more',
    s.after.hp === s.before.hp + 10 && s.after.med === s.before.med + 2 && s.after.nade === s.before.nade + 3 && s.after.gn === s.before.gn + 2 && s.after.lives === s.before.lives + 1 && s.after.cap === Math.round(s.before.cap * 1.25) && s.after.next === 200 && s.before.rows === 4, JSON.stringify(s));
  s = await p.evaluate(() => { const me = W.p[0]; me.owned[2] = 1; me.ammo[2] = 9999; return new Promise(r => setTimeout(() => r({ ammo: me.ammo[2], cap: ammoCap(2), blk: craftBlocked(me, CRAFT.find(c => c.id === 'rounds')) }), 400)); });
  check('the backpack caps carried ammo, and the shop says so when full', s.ammo === s.cap && s.blk === '背包满了', JSON.stringify(s));
  s = await p.evaluate(() => { const txt = document.getElementById('tasks').textContent; return { has: /永久任务/.test(txt), up: /已拿 5 项提升/.test(txt) }; });
  check('the panel says 永久任务 with the number of upgrades', s.has && s.up, JSON.stringify(s));
  // save → load keeps it all
  s = await p.evaluate(() => { saveGame(true); const n = SLOT; continueGame(n); const me = W.p[0]; return { perk: W.perk, hp: me.maxHp, kill: W.perm.kill, med: BAL.medCap }; });
  check('the permanent upgrades and progress survive save / load', s.perk && s.perk.hp === 1 && s.hp === 110 && s.kill.got === 60 && s.kill.tier === 1 && s.med === 10, JSON.stringify(s));
  // dawn: cleared buildings get taken back (forced odds for the test)
  s = await p.evaluate(() => { const O = W.obj; const bld = O.occ.filter(q => !q.out); for (const z of W.zs) if (z.occ != null) z.hp = 0; W.zs = W.zs.filter(z => z.hp > 0); bld.forEach(q => q.c = 1);
    const q0 = bld[0], [x0, y0, x1, y1] = TOWN_HOUSES[q0.h]; let placed = 0; W.mine = new Set();
    for (let y = y0 + 1; y < y1 && placed < 7; y++) for (let x = x0 + 1; x < x1 && placed < 7; x++) if (!W.blk[ci(x, y, 0)] && support(x, y, 0)) { W.blk[ci(x, y, 0)] = 53; W.bhp[ci(x, y, 0)] = B[53].hp; W.mine.add(ci(x, y, 0)); placed++; }
    W.ver++; const keep = [SIEGE.reocc, SIEGE.reoccHeld]; SIEGE.reocc = 1; SIEGE.reoccHeld = 0; W.p[0].x = 1.5; W.p[0].y = 1.5; siegeReoccupy(); SIEGE.reocc = keep[0]; SIEGE.reoccHeld = keep[1];
    const back = bld.filter(q => !q.c).length, held = !!q0.c, sleepers = W.zs.filter(z => z.sleep).length;
    return { n: bld.length, back, held, sleepers }; });
  check('at dawn cleared buildings fill with sleepers again; one with 6+ things you built is held', s.back >= s.n - 1 && s.held && s.sleepers > 10, JSON.stringify(s));
  // a room from a save: the start / world messages the guest gets
  s = await p.evaluate(() => { const sent = []; const keep = window.netSendCtl; window.netSendCtl = m => sent.push(m); saveGame(true); const n = SLOT, S = loadSlot(n);
    NET.guestName = '小青'; startGame(1, ['a', 'b'], 'normal', 0, 'siege', 'town'); W.p.push(W.p[1] || mkPlayer(1, '小青')); hostFromSave(S, n); window.netSendCtl = keep;
    const st = sent.find(m => m.t === 'start'), ws = sent.find(m => m.t === 'wsync'); return { start: st && st.seed === S.seed && st.mode === S.mode, world: ws && ws.g && ws.g.length === 5, me: ws && ws.me, perk: W.perk && W.perk.hp, slot: SLOT === n }; });
  check('opening a room from a save sends the saved seed / mode, then the built world and where the teammate stands; the host carries on the save', s.start && s.world && s.me && s.perk === 1 && s.slot, JSON.stringify(s));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
