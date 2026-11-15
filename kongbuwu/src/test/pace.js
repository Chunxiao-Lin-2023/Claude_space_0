// node test/pace.js — 第十九轮（RULES 36）：大地图 + 员工通道、紧张—释放 / 习惯 / 恢复、声东击西、游客性格、房间剧情点、
// 起哄只来自无聊、员工回岗走通道、沉浸模式、监控画面。SHOT=目录 存截图（俯瞰监控、沉浸模式、注意力）
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 760 } }); const errs = [], ok = [], bad = []; const chk = (n, v) => (v ? ok : bad).push(n);
  pg.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.evaluate(() => { const D = __dbg; D.SET.snd = 0; D.SET.mus = 0; D.nosave = true;
    window.__open = async (k, aff, paused = true, scene = 'mh') => { D.slotNew(1); await new Promise(r => setTimeout(r, 60)); D.STATE.run++; D.STATE.scene = null; D.STATE.busy = false; D.DLG.cur = null; D.DLG.res = null; document.querySelector('#card').classList.remove('on'); document.querySelector('#cine').className = ''; D.refresh(); D.auto = false; D.instant = false; const C = D.C; C.tick = 0; C.seen.tuth = 1; for (const q in C.pets) delete C.pets[q]; if (k) { gainPet(k); C.pets[k].aff = aff; } D.go('hh_door', true, true); C.hh.lay = {}; if (!C.hh.scenes.includes(scene)) C.hh.scenes.push(scene);
      window.__hs = null; startBattle({ scare: 1, scene, mobs: [0, 1, 2].map(i => [SCENES[scene].pool[i % SCENES[scene].pool.length], 2]), ppl: 6, title: '测试' }).then(r => window.__hs = r || 1);
      for (let i = 0; i < 60 && !(D.HS && D.HS.phase === 'setup' && D.HS.lay); i++) await new Promise(r => setTimeout(r, 100));
      const H = D.HS; if (k) hsSetPick(H.M.staff[0].i, k, 1); D.hsOpen(); for (let i = 0; i < 30 && H.phase !== 'live'; i++) await new Promise(r => setTimeout(r, 50)); if (paused) H.paused = true; for (const v of H.vis) { v.st = 'wait'; v.at = 1e9; } return H; };
    window.__close = H => { H.done = true; H.res = H.res || 'quit'; try { hsClose(); } catch (e) { } };
    window.__step = (H, s) => { for (let i = 0; i < Math.round(s / .05); i++) hStep(H, .05); };
    window.__put = (H, v, p, st) => { v.st = st || 'walk'; v.at = 0; v.x = v.tx = p[0]; v.y = v.ty = p[1]; v.mv = null; v.ftrail = []; v.seeCd = 99; v.u.hp = v.u.mhp; v.root = 0; v.att = null; v.tense = 0; v.hab = {}; v.lastHit = undefined; v.inT = undefined; if (st === 'phone') v.wait = 999; }; });
  // 1. 地图
  const mp = await pg.evaluate(() => ['mh', 'ws', 'zombie', 'room', 'my', 'ward'].map(id => { const M = hmBuild(id), O = HMAPS[id + '_c']; let stw = 0, nicheOk = 0; for (let i = 0; i < M.w * M.h; i++) if (M.stw && M.stw[i]) stw++; for (const s of M.staff) if (M.sec[s.y * M.w + s.x] && !M.vs[(s.front[1]) * M.w + s.front[0]]) nicheOk++;
    return { id, area: Math.round(M.w * M.h / (O.w * O.h) * 10) / 10, rooms: new Set(M.rooms.map(r => r.n)).size, stw, staff: M.staff.length, nicheOk, beats: (M.D.beats || []).length, path: M.path.length, oldPath: hmBuild(id + '_c').path.length }; }));
  chk('maps ~5× bigger, 9+ rooms, staff corridors, posts are wall niches (' + JSON.stringify(mp.map(m => [m.id, m.area, m.rooms, m.stw, m.nicheOk + '/' + m.staff, m.path + '/' + m.oldPath])) + ')', mp.every(m => m.area >= 4.5 && m.rooms >= 9 && m.stw > 200 && m.nicheOk === m.staff && m.staff >= 6 && m.beats >= 9));
  // 2. 紧张度 / 习惯 / 恢复
  const pc = await pg.evaluate(async () => { const H = await __open(null, 0), v = H.vis[0]; __put(H, v, H.M.path[20], 'phone'); v.u.trait = ''; __step(H, 9.2); const tense = v.tense, m1 = hPace(H, v, 'jump', H.hero, 'jump'); hReact(H, v, H.hero); v.st = 'phone'; v.wait = 999; const m2 = hPace(H, v, 'jump', H.hero, 'jump'), m3 = hPace(H, v, 'jump', H.hero, 'jump'), m4 = hPace(H, v, 'doll', H.hero, 'doll');
    v.u.hp = Math.round(v.u.mhp * .5); v.lastHit = H.t - 10; const h0 = v.u.hp; __step(H, 10); const h1 = v.u.hp; v.u.hp = Math.round(v.u.mhp * .7); __step(H, 20); const h2 = v.u.hp / v.u.mhp; const r = { tense, m1, m2, m3, m4, rec: [h0, h1], cap: h2 }; __close(H); return r; });
  chk('quiet builds tension → bigger scare (' + JSON.stringify(pc) + ')', pc.tense >= .99 && pc.m1 >= 1.55);
  chk('same scare repeated loses power, a different one does not', pc.m3 < pc.m2 && pc.m3 <= .53 && pc.m4 > pc.m3 * 1.5);
  chk('SAN recovers slowly when quiet, capped at 75%', pc.rec[1] > pc.rec[0] && pc.cap <= .751 && pc.cap > .72);
  // 3. 声东击西：注意力被拉走、从背后出手
  const cb = await pg.evaluate(async () => { const H = await __open(null, 0), v = H.vis[0], p = H.M.path[30]; __put(H, v, p, 'walk'); v.u.trait = ''; hAttend(H, v, p[0] + 4, p[1], 3, '那边？'); const st = v.st, has = !!v.att; const front = hPace(H, v, 'a', { x: p[0] + 3, y: p[1] }, 'jump'); hAttend(H, v, p[0] + 4, p[1], 3); v.hab = {}; const back = hPace(H, v, 'b', { x: p[0] - 2, y: p[1] }, 'jump'); const r = { st, has, front, back, combo: H.stats.combo || 0 }; __close(H); return r; });
  chk('distracted visitor stares; scare from behind ×1.6 (' + JSON.stringify(cb) + ')', cb.st === 'stare' && cb.has && cb.back >= cb.front * 1.55 && cb.combo === 1);
  const da = await pg.evaluate(async () => { const H = await __open(null, 0), M = H.M, sl = M.slots.find(s => s.k && !s.sp && M.path.some(q => q[0] === s.x && q[1] === s.y)); if (!sl) { __close(H); return 'no slot'; } const pi = M.path.findIndex(q => q[0] === sl.x && q[1] === sl.y), [v0, v1] = H.vis; __put(H, v0, [sl.x, sl.y], 'phone'); const far = M.path.slice(pi + 4, pi + 9).find(q => hmLos(M, q[0], q[1], sl.x, sl.y) && Math.hypot(q[0] - sl.x, q[1] - sl.y) > HB.zone + .6); if (!far) { __close(H); return 'no far'; } __put(H, v1, far, 'walk'); H.hero.x = H.hero.tx = sl.x; H.hero.y = H.hero.ty = sl.y; sl.cd = 0; const ok = hTrigger(H, sl, true); const r = { ok, att: !!v1.att }; __close(H); return r; });
  chk('a trap going off pulls the attention of others nearby (' + JSON.stringify(da) + ')', da.ok && da.att);
  // 4. 游客性格
  const rl = await pg.evaluate(async () => { const H = await __open(null, 0), v = H.vis[0], p = H.M.path.find((q, i) => i > 20 && hmRoomAt(H.M, q[0], q[1])); const out = {}; const t = (tr, kind, el, setup) => { __put(H, v, p, 'phone'); v.u.trait = tr; v.laugh = undefined; v.laughEnd = 0; v.hug = 0; if (setup) setup(); return Math.round(hRoleMul(H, v, kind, el, 1) * 100) / 100; };
    out.calm = [t('calm', 'a', 'jump'), (() => hRoleMul(H, v, 'a', 'jump', 1))(), (() => hRoleMul(H, v, 'a', 'jump', 1))()];
    const r = hmRoomAt(H.M, p[0], p[1]); out.darkLight = t('darkfear', 'a', 'jump', () => { H.lit[r.n] = true; }); out.darkDark = t('darkfear', 'a', 'jump', () => { H.lit[r.n] = false; }); H.lit[r.n] = true;
    out.pair = [t('pair', 'a', 'jump'), t('pair', 'a', 'jump', () => { v.hug = H.t + 2; })]; out.corpse = [t('corpse', 'a', 'doll'), t('corpse', 'a', 'sound')]; __close(H); return out; });
  chk('roles: skeptic laughs twice then breaks, brave fears the dark, couple cling, med student (' + JSON.stringify(rl) + ')', rl.calm[0] === .4 && rl.calm[1] === .4 && rl.calm[2] === 1.25 && rl.darkLight === .8 && rl.darkDark === 1.4 && rl.pair[0] === 1 && rl.pair[1] === 1.4 && rl.corpse[0] === .6 && rl.corpse[1] === 1.3);
  // 5. 房间剧情点
  const bt = await pg.evaluate(async () => { const H = await __open(null, 0), M = H.M, out = {}; const v = H.vis[0];
    for (const b of M.D.beats) { if (out[b.k]) continue; const rr = M.rooms.filter(r => r.n === b.room); const cell = M.path.find(q => rr.some(r => q[0] >= r.x0 && q[0] <= r.x1 && q[1] >= r.y0 && q[1] <= r.y1)); if (!cell) continue; __put(H, v, cell, 'walk'); v.rooms = {}; v.u.trait = ''; v.tense = 0; H.lit[b.room] = true; delete (H.litT || {})[b.room]; hPaceTick(H, v, .01);
      out[b.k] = b.k === 'look' ? (v.st === 'stare' && !!v.att) : b.k === 'dark' ? (H.lit[b.room] === false && !!(H.litT && H.litT[b.room])) : v.tense >= .34; if (b.k === 'dark') { __step(H, 6.3); out.relight = H.lit[b.room] !== false; } }
    __close(H); return out; });
  chk('room beats: look makes them stare, dark cuts the lights for 6 s, story raises tension (' + JSON.stringify(bt) + ')', bt.look && bt.dark && bt.relight && bt.story);
  // 6. 起哄只来自无聊
  const bo = await pg.evaluate(async () => { const H = await __open(null, 0), v = H.vis[0]; __put(H, v, H.M.path[15], 'phone'); hPaceTick(H, v, .01); const a = hBored(H, v); __step(H, 26); const c = hBored(H, v); hReact(H, v, H.hero); const d = hBored(H, v); __close(H); return [a, c, d]; });
  chk('visitors only heckle when bored (' + bo + ')', bo[0] === false && bo[1] === true && bo[2] === false);
  // 7. 员工回岗走员工通道；在明处被看见会让游客放松；陈歌躲在通道里不会被看见
  const co = await pg.evaluate(async () => { const H = await __open('wan', 0), M = H.M, st = H.staff[0]; let far = null; for (const s of M.staff) if (Math.hypot(s.x - st.home[0], s.y - st.home[1]) > 14) { far = s.front; break; } if (!far) { __close(H); return 'no far'; }
    let x = far[0], y = far[1], inSec = 0, steps = 0; const f = hmFieldW(M, st.home[0], st.home[1]); for (; steps < 300; steps++) { const n = hmNext(M, f, x, y, 'h'); if (!n) break; [x, y] = n; if (M.sec[y * M.w + x]) inSec++; }
    const v = H.vis[0], p = H.M.path[40]; __put(H, v, p, 'phone'); v.tense = .8; st.tx = st.x = p[0] + 1; st.ty = st.y = p[1]; v.dir = hDirTo(v, st); const sec0 = M.sec[st.ty * M.w + st.tx]; hStaffSeen(H, st);
    let ci = -1; for (let i = 0; i < M.w * M.h; i++) if (M.stw && M.stw[i]) { ci = i; break; } H.hero.x = H.hero.tx = ci % M.w; H.hero.y = H.hero.ty = (ci / M.w) | 0; H.hero.hidden = false; const v2 = H.vis[1]; __put(H, v2, [H.hero.tx, Math.min(M.h - 1, H.hero.ty + 1)], 'walk'); const seen = hSee(H, v2);
    const r = { steps, inSec, home: x === st.home[0] && y === st.home[1], seenRelax: sec0 ? 'skip' : v.tense === 0, heroInCorridorSeen: seen }; __close(H); return r; });
  chk('staff walk home through corridors (' + JSON.stringify(co) + ')', co.home && co.inSec >= co.steps * .4);
  chk('staff seen walking in the open relaxes the visitor', co.seenRelax === true || co.seenRelax === 'skip');
  chk('hero inside a staff corridor is not seen', co.heroInCorridorSeen === false);
  // 8. 沉浸模式、监控画面
  const im = await pg.evaluate(async () => { const H = await __open(null, 0, false); const n0 = H.txt.length; hsImm(); const on = __dbg.SET.imm; hFloat(H, 5, 5, '-23', 'dmg'); hFloat(H, 5, 5, '声东击西！', 'crit'); const n1 = H.txt.length; hsImm(); const off = __dbg.SET.imm; H.zoomOut = true; hsSize(); let err = ''; try { hsDraw(H); } catch (e) { err = e.message; } H.zoomOut = false; hsSize(); const r = { on, off, added: n1 - n0, err, btn: !!document.querySelector('#hsimm') }; __close(H); return r; });
  chk('immersion mode hides numbers, keeps words; 👁 button (' + JSON.stringify(im) + ')', im.on === 1 && !im.off && im.added === 1 && im.btn);
  chk('overview draws as CCTV without errors', im.err === '');
  // 9. 自动接待在大地图上照样赢（每张图 1 场）
  if (process.env.SHOT) { const fs = require('fs'); fs.mkdirSync(process.env.SHOT, { recursive: true });
    await pg.evaluate(async () => { const H = await __open('xiaoxiao', 0, false, 'ws'); const p = H.M.path[28]; const [v0, v1] = H.vis; __put(H, v0, p, 'walk'); __put(H, v1, H.M.path[24], 'walk'); hAttend(H, v0, p[0] + 3, p[1] - 1, 9, '那边……什么声音？'); H.hero.x = H.hero.tx = p[0] - 2; H.hero.y = H.hero.ty = p[1]; H.focusPt = [p[0], p[1]]; hsCam(H, 1); });
    await pg.waitForTimeout(400); await pg.screenshot({ path: process.env.SHOT + '/att.png' });
    await pg.evaluate(() => { hsImm(); }); await pg.waitForTimeout(300); await pg.screenshot({ path: process.env.SHOT + '/imm.png' }); await pg.evaluate(() => { hsImm(); const H = __dbg.HS; H.focusPt = null; hsZoom(); }); await pg.waitForTimeout(500); await pg.screenshot({ path: process.env.SHOT + '/cctv.png' }); await pg.evaluate(() => { hsZoom(); __close(__dbg.HS); }); }
  console.log('pace', ok.length + '/' + (ok.length + bad.length), bad.length ? 'FAIL:\n  ' + bad.join('\n  ') : 'OK'); console.log('errors', errs.slice(0, 6));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
