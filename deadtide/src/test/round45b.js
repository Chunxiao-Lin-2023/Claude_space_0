// Round 45b: rooms and saves — a save picked for a room shows its own settings (not your new-game choices, which stay as they were); the room shows them read-only to both;
// the teammate gets a copy of the run (same slot every time); kits follow names, so either of you can host it next time
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = true; const check = (n, c, v) => { console.log((c ? 'PASS ' : 'FAIL ') + n, v || ''); if (!c) ok = false; };
  const errs = []; const mk = async () => { const ctx = await b.newContext({ viewport: { width: 900, height: 760 } }); await ctx.route(/fonts\.(googleapis|gstatic)|peerjs/, r => r.abort()); const p = await ctx.newPage(); p.setDefaultTimeout(300000); p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8766/test.html'); await p.waitForFunction(() => window.__ready); return p; };
  const A = await mk(), B = await mk();   // two devices (separate storage)
  // device A: a two-player run on 困难 / 雪原, 阿明 hosting 小青; saved into slot 1
  const S = await A.evaluate(() => { window.__dbg.skipDraw = true; for (let n = 1; n <= 5; n++) clearSave(n); SET.name = '阿明'; NETROLE = 'host'; NET.guestName = '小青'; startGame(321, ['阿明', '小青'], 'hard', 0, 'classic', 'snow'); SLOT = 1;
    W.p[0].kills = 11; W.p[0].meds = 1; W.p[1].kills = 22; W.p[1].meds = 4; const sent = []; NET.gctl = { open: true, label: 'ctl', send: s => sent.push(s) }; saveGame(true, true); NET.gctl = null;
    W = null; NETROLE = null; STATE.mode = 'title'; showScreen('title'); Object.assign(SET, { diff: 'easy', mode: 'classic', map: 'town', hostFrom: 0 }); saveSet(); TK.setSetup({ from: 0, diff: 'easy', mode: 'classic', map: 'town' });
    return { slot: loadSlot(1) && loadSlot(1).diff, copy: sent.map(s => JSON.parse(s)).filter(m => m.t === 'savecopy' || m.t === 'chk').length, raw: localStorage.getItem(SKEY + 'save') }; });
  check('the host\'s save goes to the teammate too (savecopy)', S.slot === 'hard' && S.copy > 0, JSON.stringify({ slot: S.slot, msgs: S.copy }));
  // the host setup
  const clk = (sel) => A.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; e.click(); return true; }, sel);
  const ui = () => A.evaluate(() => { const q = s => [...document.querySelectorAll(s)]; return { diff: q('[data-arg="diff"]').length, map: q('[data-arg="map"]').length, from: q('[data-arg="from"]').length, note: q('.tk-note').map(e => e.textContent).join(' | '), on: q('.tk-on').map(e => e.dataset.arg + '=' + e.dataset.v).join(',') }; });
  await A.evaluate(() => TK.show()); await clk('[data-a="go"][data-arg="online"]'); await clk('[data-a="host"]'); let u = await ui();
  check('host setup opens with 从哪开始 and, on 新开一局, your own choices (简单 / 小镇)', u.from >= 2 && u.diff === 3 && /diff="easy"/.test(u.on) && /map="town"/.test(u.on), JSON.stringify(u));
  await clk('[data-arg="from"][data-v="1"]'); u = await ui();
  check('picking 存档 1 hides difficulty / mode / map and shows the save: 困难 · 雪原 · its kits', u.diff === 0 && u.map === 0 && /继续存档 1/.test(u.note) && /困难/.test(u.note) && /雪原/.test(u.note) && /阿明/.test(u.note) && /小青/.test(u.note), JSON.stringify(u));
  await clk('[data-arg="from"][data-v="0"]'); u = await ui();
  check('back to 新开一局: your choices are still 简单 / 小镇 (the save did not overwrite them)', u.diff === 3 && /diff="easy"/.test(u.on) && /map="town"/.test(u.on), JSON.stringify(u));
  await clk('[data-arg="from"][data-v="1"]');
  const r = await A.evaluate(() => { const sent = []; window.netHost = () => { NETROLE = 'host'; NET.code = 'ABCD'; NET.gctl = { open: true, label: 'ctl', send: s => sent.push(JSON.parse(s)) }; NET.guestName = '小青'; STATE.mode = 'lobby'; showScreen('lobby'); lobbyUI(''); };
    document.querySelector('[data-a="go-start"]').click(); sendLobby(); const L = sent.filter(m => m.t === 'lobby').pop() || {}; const q = s => [...document.querySelectorAll(s)];
    return { set: [SET.diff, SET.map, SET.hostFrom], lobby: [L.diff, L.mode, L.map, L.fromLbl], diffBtns: q('[data-arg="diff"]').map(e => (e.disabled || e.closest('.tk-ro') ? 'ro:' : '') + (e.classList.contains('tk-on') ? '*' : '') + e.dataset.v).join(','), note: q('.tk-note').map(e => e.textContent).join(' | '), mem: TK.setup.from }; });
  check('creating the room from the save keeps your new-game choices (简单 / 小镇) and remembers 存档 1', r.set.join() === 'easy,town,1' && r.mem === 1, JSON.stringify(r.set) + ' remembered ' + r.mem);
  check('the room shows the save\'s difficulty, read-only, with the save summary', /ro:\*"hard"/.test(r.diffBtns) && !/(^|,)"/.test(r.diffBtns) && /继续存档 1/.test(r.note), r.diffBtns + ' || ' + r.note.slice(0, 80));
  check('the teammate\'s lobby gets the save\'s settings (困难 / 雪原) and a line saying it is a save — with their kit', r.lobby[0] === 'hard' && r.lobby[2] === 'snow' && /存档/.test(r.lobby[3]) && /装备会还给你/.test(r.lobby[3]), JSON.stringify(r.lobby));
  // device B (小青) gets the copy; again later → the same slot
  const c = await B.evaluate((raw) => { window.__dbg.skipDraw = true; for (let n = 1; n <= 5; n++) clearSave(n); SET.name = '小青'; saveSet(); const fill = JSON.parse(JSON.stringify(JSON.parse(raw))); fill.rid = 'other'; localStorage.setItem(SKEY + slotKey(1), JSON.stringify(fill)); /* slot 1 holds some other run */
    const S = JSON.parse(raw); keepSaveCopy(S); const where = []; for (let n = 1; n <= 5; n++) { const q = loadSlot(n); if (q) where.push(n + ':' + q.rid.slice(0, 4)); } S.night = 9; keepSaveCopy(S); const where2 = []; for (let n = 1; n <= 5; n++) { const q = loadSlot(n); if (q) where2.push(n + ':' + q.night); } return { where, where2 }; }, S.raw);
  check('the teammate\'s copy goes into an empty slot (never over another run), and the next copy of the same run into that same slot', c.where.length === 2 && c.where2.length === 2 && c.where2[1] === '2:9', JSON.stringify(c));
  // 小青 hosts from the copy, 阿明 joins: each gets their own kit
  const k = await B.evaluate(() => { NETROLE = 'host'; NET.guestName = '阿明'; NET.gctl = { open: true, label: 'ctl', send: () => 0 }; const S = loadSlot(2); startGame(1, ['小青', '阿明'], 'normal', 0, 'classic', 'town'); hostFromSave(S, 2);
    const r = { host: [W.p[0].name, W.p[0].kills, W.p[0].meds], guest: [W.p[1].name, W.p[1].kills, W.p[1].meds], diff: W.diff, map: W.map }; NET.gctl = null; NETROLE = 'solo'; continueGame(2); r.solo = [W.p[0].name, W.p[0].kills, W.p[2] ? 1 : 0, W.p2keep && W.p2keep.name]; return r; });
  check('swapping who hosts: 小青 (now host) gets 小青\'s kit, 阿明 gets 阿明\'s; settings from the save', k.host.join() === '小青,22,4' && k.guest.join() === '阿明,11,1' && k.diff === 'hard' && k.map === 'snow', JSON.stringify(k));
  check('小青 carrying on alone from the copy plays her own kit and keeps 阿明\'s for later', k.solo[0] === '小青' && k.solo[1] === 22 && k.solo[3] === '阿明', JSON.stringify(k.solo));
  check('no errors', errs.length === 0, JSON.stringify(errs.slice(0, 3)));
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); await b.close();
})();
