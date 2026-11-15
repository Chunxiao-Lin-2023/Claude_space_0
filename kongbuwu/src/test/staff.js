// node test/staff.js — 鬼屋员工的招（RULES 35）：每个员工两招都能放出来并吓到人；会挑时机（等人凑齐）；点员工马上放；
// 「送不走」抓住脚踝原地不动；被吓到的游客只往前跑；方向键按住一直走、松开就停。SHOT=目录 存每招蓄力 / 放出的截图
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 760 } }); const errs = [], ok = [], bad = []; const chk = (n, v) => (v ? ok : bad).push(n);
  pg.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto('http://localhost:8771/test.html'); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.evaluate(() => { const D = __dbg; D.SET.snd = 0; D.SET.mus = 0; D.nosave = true;
    /* 开一场：只有员工 k，好感 aff；暂停实时循环，手动推进 */
    window.__open = async (k, aff, paused = true) => { D.slotNew(1); await new Promise(r => setTimeout(r, 60)); D.STATE.run++; D.STATE.scene = null; D.STATE.busy = false; D.DLG.cur = null; D.DLG.res = null; document.querySelector('#card').classList.remove('on'); document.querySelector('#cine').className = ''; D.refresh(); D.auto = false; D.instant = false; const C = D.C; C.tick = 0; C.seen.tuth = 1; for (const q in C.pets) delete C.pets[q]; if (k) { gainPet(k); C.pets[k].aff = aff; } D.go('hh_door', true, true); C.hh.lay = {};
      window.__hs = null; startBattle({ scare: 1, scene: 'mh', mobs: [0, 1, 2].map(i => [SCENES.mh.pool[i % SCENES.mh.pool.length], 2]), ppl: 6, title: '测试' }).then(r => window.__hs = r || 1);
      for (let i = 0; i < 60 && !(D.HS && D.HS.phase === 'setup' && D.HS.lay); i++) await new Promise(r => setTimeout(r, 100));
      const H = D.HS; if (!H) throw new Error('no house ' + JSON.stringify([!!D.STATE.scene, !!D.STATE.battle, !!D.STATE.house, D.STATE.busy, D.isNight(), C.loc, document.querySelector('#toast') && document.querySelector('#toast').textContent])); if (k) { try { hsSetPick(H.M.staff[0].i, k, 1); } catch (e) { throw new Error('pick ' + k + aff + ' ' + JSON.stringify(H.lay) + ' ' + (H === HS) + ' ' + H.phase); } } D.hsOpen(); for (let i = 0; i < 30 && H.phase !== 'live'; i++) await new Promise(r => setTimeout(r, 50));
      if (paused) H.paused = true; for (const v of H.vis) { v.st = 'wait'; v.at = 1e9; } return H; };
    window.__close = H => { H.done = true; H.res = H.res || 'quit'; try { hsClose(); } catch (e) { } };
    window.__step = (H, s) => { for (let i = 0; i < Math.round(s / .05); i++) hStep(H, .05); };
    /* 在员工周围找一格：距离 d0..d1、看得见、游客能走 */
    window.__near = (H, s, d0, d1, not) => { const M = H.M; let best = null; for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { if (hmSolid(M, M.vs, x, y) || (not || []).some(p => p[0] === x && p[1] === y)) continue; const d = Math.hypot(x - s.x, y - s.y); if (d < d0 || d > d1 || !hmLos(M, s.x, s.y, x, y)) continue; if (!best || Math.abs(d - (d0 + d1) / 2) < best[2]) best = [x, y, Math.abs(d - (d0 + d1) / 2)]; } return best; };
    window.__put = (H, v, p, st) => { v.st = st || 'walk'; v.at = 0; v.x = v.tx = p[0]; v.y = v.ty = p[1]; v.mv = null; v.ftrail = []; v.seeCd = 99; v.u.hp = v.u.mhp; v.root = 0; if (st === 'phone') v.wait = 99; };
    window.__casts = []; const hc = hSkCast; window.hSkCast = function (H, st, p, man) { __casts.push(p.S.id + (man ? '!' : '')); return hc.apply(this, arguments); }; });
  // 1. 每个员工两招都能自己放出来、吓到人
  for (const [k, sks] of [['wan', ['bride', 'slam']], ['xiaoxiao', ['scream', 'hide']], ['bixian', ['scrawl', 'bind']], ['canmian', ['turn', 'call']]]) {
    const r = await pg.evaluate(async ([k, sks]) => { const out = {}; for (const [aff, sk] of [[0, sks[0]], [30, sks[1]]]) { const H = await __open(k, aff); const st = H.staff[0]; if (!st) { out[sk] = 'no staff'; continue; }
      const S = HSK[sk], p = __near(H, st, Math.min(2, S.r - .6), Math.min(2.6, S.r - .3)); const v = H.vis[0]; __put(H, v, p, 'phone'); v.dir = hDirTo(st, v); st.cd = 0; __casts = [];
      /* 只留这一招，看它会不会自己放 */ const hl = hSkList; window.hSkList = s => s === st ? [S] : hl(s); __step(H, 3); window.hSkList = hl;
      out[sk] = { cast: __casts.slice(), hp: Math.round(v.u.hp / v.u.mhp * 100), st: v.st, known: hSkList(st).map(q => q.id) }; __close(H); } return out; }, [k, sks]);
    for (const sk of sks) { const o = r[sk]; chk(k + ' ' + sk + ' fires and scares (' + JSON.stringify(o) + ')', o && o.cast && o.cast.includes(sk) && o.hp < 100); }
    chk(k + ' second skill locked at aff 0, open at 30', r[sks[0]].known.length === 1 && r[sks[1]].known.length === 2);
  }
  // 2. 挑时机：一个人在范围里、另一个快过来了 → 先等；第二个进来 → 放
  const hold = await pg.evaluate(async () => { const H = await __open('wan', 0), st = H.staff[0], p0 = __near(H, st, 1.6, 2.2), p1 = __near(H, st, 3.6, 4.6), [v0, v1] = H.vis; __put(H, v0, p0, 'phone'); __put(H, v1, p1, 'phone'); st.cd = 0; __casts = [];
    __step(H, .8); const early = __casts.length; const p2 = __near(H, st, 1.4, 2.4, [p0]); __put(H, v1, p2, 'phone'); __step(H, .15); const r = { early, late: __casts.slice() }; __close(H); return r; });
  chk('staff waits for the second visitor (' + JSON.stringify(hold) + ')', hold.early === 0 && hold.late.includes('bride'));
  // 3. 只有一个人、旁边没人：很快就放
  const solo = await pg.evaluate(async () => { const H = await __open('wan', 0), st = H.staff[0], v = H.vis[0]; __put(H, v, __near(H, st, 1.6, 2.2), 'phone'); st.cd = 0; __casts = []; __step(H, .6); const r = __casts.slice(); __close(H); return r; });
  chk('lone visitor gets scared quickly (' + solo + ')', solo.length === 1);
  // 4. 点员工 = 马上放；没人时不放
  const man = await pg.evaluate(async () => { const H = await __open('xiaoxiao', 0), st = H.staff[0]; st.cd = 0; const none = hStaffGo(H, st); const v = H.vis[0]; __put(H, v, __near(H, st, 2, 3), 'walk'); const yes = hStaffGo(H, st), c = !!st.cast; __close(H); return { none, yes, c }; });
  chk('click staff casts now, not when nobody is near (' + JSON.stringify(man) + ')', man.none === false && man.yes === true && man.c);
  // 5. 「送不走」：抓住以后原地不动
  const root = await pg.evaluate(async () => { const H = await __open('bixian', 30), st = H.staff[0], v = H.vis[0]; __put(H, v, __near(H, st, 2, 3), 'walk'); st.cd = 0; hSkCast(H, st, hSkEval(H, st, HSK.bind, v), 1); __step(H, HSK.bind.wind + HB.react + .1); const p0 = [v.x, v.y], rooted = v.root > H.t; __step(H, 1.2); const p1 = [v.x, v.y]; __close(H); return { rooted, p0, p1 }; });
  chk('bind roots the visitor (' + JSON.stringify(root) + ')', root.rooted && root.p0[0] === root.p1[0] && root.p0[1] === root.p1[1]);
  // 6. 被吓到只往前跑：吓人的站在他前面，他也不往回跑
  const fwd = await pg.evaluate(async () => { const H = await __open(null, 0), M = H.M, v = H.vis[0], res = [];
    for (const wi of [2, 3, 4, 5]) { if (wi >= M.route.length - 1) break; const a = M.route[wi - 1], tg = M.route[wi]; __put(H, v, a, 'walk'); v.wi = wi; const f = hmField(M, tg[0], tg[1], 'v'), n = hmNext(M, f, v.tx, v.ty, 'v') || tg;
      hReact(H, v, { x: n[0], y: n[1] }, 1); const prog = () => v.wi * 1000 - hmField(M, M.route[Math.min(v.wi, M.route.length - 1)][0], M.route[Math.min(v.wi, M.route.length - 1)][1], 'v')[v.ty * M.w + v.tx]; let last = prog(), back = 0, runT = 0;
      for (let i = 0; i < 80; i++) { hStep(H, .05); if (v.st === 'run') runT += .05; const pr = prog(); if (pr < last - .01) back++; last = pr; if (v.st === 'walk' && runT > 0) break; } res.push({ wi, back, runT: Math.round(runT * 10) / 10 }); }
    __close(H); return res; });
  chk('scared visitors only run forward (' + JSON.stringify(fwd) + ')', fwd.length >= 2 && fwd.every(r => r.back === 0 && r.runT > .5));
  // 6b. 放完招追出去补吓，不超过 6 格，追完回岗位
  const ch = await pg.evaluate(async () => { const H = await __open('wan', 0), st = H.staff[0], v = H.vis[0]; let sd = 7; __dbg.rng = () => (sd = (sd * 16807) % 2147483647) / 2147483647; /* 随机的东西写成确定的 */ __put(H, v, __near(H, st, 1.6, 2.2), 'walk'); v.wi = Math.max(1, hmRouteIdx(H.M, v)); st.cd = 0; const hp0 = v.u.hp; let away = 0, maxd = 0, hit = 0, back = -1, hpCast = null;
    for (let i = 0; i < 260; i++) { hStep(H, .05); if (st.cast && st.cast.done && hpCast == null) hpCast = v.u.hp; if (st.away) away++; maxd = Math.max(maxd, Math.hypot(st.x - st.home[0], st.y - st.home[1])); hit = H.stats.staffChase || 0; if (away && !st.away && back < 0) back = i * .05; }
    const r = { away, maxd: Math.round(maxd * 10) / 10, hit, back, hp0, hpCast, hp: v.u.hp, home: st.tx === st.home[0] && st.ty === st.home[1] }; __dbg.rng = null; __close(H); return r; });
  chk('after a skill the staff chases, lands a hit, stays within 6 tiles, returns (' + JSON.stringify(ch) + ')', ch.away > 0 && ch.hit >= 1 && ch.hit <= 2 && ch.maxd <= 6.01 && ch.home && ch.back > 0);
  // 6c. 闲着的员工：受惊游客从旁边跑过也追
  const join = await pg.evaluate(async () => { const H = await __open('xiaoxiao', 0), st = H.staff[0], v = H.vis[0]; __put(H, v, __near(H, st, 1.6, 2.6), 'walk'); v.wi = Math.max(1, hmRouteIdx(H.M, v)); st.cd = 99; hReact(H, v, H.hero, 1); let saw = 0; for (let i = 0; i < 60; i++) { hStep(H, .05); if (st.ch || st.away) saw = 1; } __close(H); return saw; });
  chk('idle staff joins the chase of a fleeing visitor nearby', join === 1);
  // 7. 方向键按住一直走，松开就停
  await pg.evaluate(async () => { const H = await __open(null, 0, false); H.hero.path = null; });
  const dir = await pg.evaluate(() => { const H = __dbg.HS, M = H.M, h = H.hero, ks = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']; let best = 0, bn = -1; for (let d = 0; d < 4; d++) { let n = 0; while (n < 6 && !hmSolid(M, M.hs, h.tx + HD[d][0] * (n + 1), h.ty + HD[d][1] * (n + 1))) n++; if (n > bn) { bn = n; best = d; } } return [ks[best], bn, h.tx, h.ty]; });
  await pg.keyboard.down(dir[0]); await pg.waitForTimeout(900); const mid = await pg.evaluate(() => [__dbg.HS.hero.tx, __dbg.HS.hero.ty]); await pg.keyboard.up(dir[0]); await pg.waitForTimeout(500); const end1 = await pg.evaluate(() => [__dbg.HS.hero.tx, __dbg.HS.hero.ty]); await pg.waitForTimeout(500); const end2 = await pg.evaluate(() => [__dbg.HS.hero.tx, __dbg.HS.hero.ty]);
  await pg.evaluate(() => __close(__dbg.HS)); await pg.waitForTimeout(300);
  const moved = Math.abs(mid[0] - dir[2]) + Math.abs(mid[1] - dir[3]);
  chk('held arrow key keeps walking (' + dir[0] + ' ' + moved + ' tiles in 0.9s, room ' + dir[1] + ')', moved >= Math.min(3, dir[1]));
  chk('release stops (' + end1 + ' → ' + end2 + ')', end1[0] === end2[0] && end1[1] === end2[1]);
  // 8. 截图：每招蓄力（红框范围）和放出去
  if (process.env.SHOT) { const fs = require('fs'); fs.mkdirSync(process.env.SHOT, { recursive: true });
    for (const [k, aff, sk] of [['wan', 0, 'bride'], ['wan', 30, 'slam'], ['xiaoxiao', 0, 'scream'], ['xiaoxiao', 30, 'hide'], ['bixian', 0, 'scrawl'], ['bixian', 30, 'bind'], ['canmian', 0, 'turn'], ['canmian', 30, 'call']]) {
      const S = await pg.evaluate(async ([k, aff, sk]) => { const H = await __open(k, aff), st = H.staff[0], vs = H.vis.slice(0, 3); const ps = []; for (const v of vs) { const p = __near(H, st, 1.6, Math.min(3.2, HSK[sk].r - .3), ps); if (p) { ps.push(p); __put(H, v, p, 'phone'); v.dir = hDirTo(st, v); } }
        H.focusPt = [st.x, st.y]; st.cd = 0; const pl = hSkEval(H, st, HSK[sk], HSK[sk].kind === 'aoe' || HSK[sk].kind === 'ring' ? null : vs[0]); hSkCast(H, st, pl, 1); __step(H, HSK[sk].wind * .7); return HSK[sk]; }, [k, aff, sk]);
      await pg.evaluate(() => { const H = __dbg.HS; hsCam(H, 1); hsDraw(H); hsTextLayer(H); }); await pg.screenshot({ path: process.env.SHOT + '/' + sk + '_a.png' });
      await pg.evaluate(s => { const H = __dbg.HS; __step(H, s.wind * .3 + Math.min(.35, s.dur * .3)); hsCam(H, 1); hsDraw(H); hsTextLayer(H); }, S); await pg.screenshot({ path: process.env.SHOT + '/' + sk + '_b.png' });
      await pg.evaluate(() => { const H = __dbg.HS; __close(H); }); } }
  if (process.env.SHOT) { await pg.evaluate(async () => { const H = await __open('xiaoxiao', 0), st = H.staff[0], v = H.vis[0]; __put(H, v, __near(H, st, 1.6, 2.2), 'walk'); v.wi = Math.max(1, hmRouteIdx(H.M, v)); st.cd = 0; for (let i = 0; i < 200 && !(st.away && Math.hypot(st.x - st.home[0], st.y - st.home[1]) > 1.5); i++) hStep(H, .05); H.focusPt = [st.x, st.y]; hsCam(H, 1); hsDraw(H); hsTextLayer(H); }); await pg.screenshot({ path: process.env.SHOT + '/chase.png' }); await pg.evaluate(() => __close(__dbg.HS)); }
  console.log('staff', ok.length + '/' + (ok.length + bad.length), bad.length ? 'FAIL:\n  ' + bad.join('\n  ') : 'OK'); console.log('errors', errs.slice(0, 6));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
