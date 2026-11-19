// node test/move_house.js — 白天鬼屋：陈歌走路精度（按住/松开、点一下、拐弯、镜头）、点地面不被旁边的柜子/游客/机关抢走、
// 方向键关掉自动、点地面不绕员工通道、双人队友员工的按键保活。
// 需要：从仓库根目录起 http 服务器（默认 http://localhost:8782/），NODE_PATH 里有 playwright。
// 环境变量：URL=页面（默认 http://localhost:8782/kongbuwu/src/out/test.html）；FILE=本地 html 代替页面内容（对比改之前的构建）。
const { chromium } = require('playwright'); const fs = require('fs');
const EXE = process.env.CHROME || (fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d/.test(d)).map(d => '/opt/pw-browsers/' + d + '/chrome-linux64/chrome').find(p => fs.existsSync(p)) : undefined);
const URL = process.env.URL || 'http://localhost:8782/kongbuwu/src/out/test.html';
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 1100, height: 760 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  if (process.env.FILE) await pg.route('**/test.html*', r => r.fulfill({ path: process.env.FILE, contentType: 'text/html' }));
  await pg.addInitScript(() => localStorage.clear()); await pg.goto(URL); await pg.waitForFunction(() => window.__dbg && __dbg.ready);
  await pg.evaluate(() => { const D = __dbg; D.SET.snd = 0; D.SET.mus = 0; D.nosave = true;
    window.__open = async (k, aff, paused = true, scene = 'mh') => { D.slotNew(1); await new Promise(r => setTimeout(r, 60)); D.STATE.run++; D.STATE.scene = null; D.STATE.busy = false; D.DLG.cur = null; D.DLG.res = null; document.querySelector('#card').classList.remove('on'); document.querySelector('#cine').className = ''; D.refresh(); D.auto = false; D.instant = false; const C = D.C; C.tick = 0; C.seen.tuth = 1; for (const q in C.pets) delete C.pets[q]; if (k) { gainPet(k); C.pets[k].aff = aff; } D.go('hh_door', true, true); C.hh.lay = {}; if (!C.hh.scenes.includes(scene)) C.hh.scenes.push(scene);
      window.__hs = null; startBattle({ scare: 1, scene, mobs: [0, 1, 2].map(i => [SCENES[scene].pool[i % SCENES[scene].pool.length], 2]), ppl: 6, title: '测试' }).then(r => window.__hs = r || 1);
      for (let i = 0; i < 60 && !(D.HS && D.HS.phase === 'setup' && D.HS.lay); i++) await new Promise(r => setTimeout(r, 100));
      const H = D.HS; if (k) hsSetPick(H.M.staff[0].i, k, 1); D.hsOpen(); for (let i = 0; i < 30 && H.phase !== 'live'; i++) await new Promise(r => setTimeout(r, 50)); if (paused) H.paused = true; for (const v of H.vis) { v.st = 'wait'; v.at = 1e9; } return H; };
    window.__put = (H, v, p, st) => { v.st = st || 'walk'; v.at = 0; v.x = v.tx = p[0]; v.y = v.ty = p[1]; v.mv = null; v.ftrail = []; v.seeCd = 99; v.u.hp = v.u.mhp; v.root = 0; v.att = null; v.tense = 0; v.hab = {}; v.lastHit = undefined; v.inT = undefined; if (st === 'phone') v.wait = 999; };
    /* 一段 ≥ 9 格的横向空地（不在员工通道/门帘里，没有柜子、机关位），上 1 行、下 2 行也是空地 */
    window.__open9 = H => { const M = H.M, ok = (x, y) => !hmSolid(M, M.hs, x, y) && !hBackAt(M, x, y) && !M.hides.some(e => e.x === x && e.y === y) && !M.slots.some(s => s.x === x && s.y === y) && !M.staff.some(s => s.x === x && s.y === y);
      for (let y = 3; y < M.h - 4; y++) for (let x = 2; x < M.w - 11; x++) { let g = true; for (let k = 0; k < 9 && g; k++) for (let dy = -1; dy <= 2 && g; dy++) if (!ok(x + k, y + dy)) g = false; if (g) return [x, y]; } return null; };
    window.__rec = []; window.__recOn = false; const loop = () => { const H = D.HS; if (window.__recOn && H) { const h = H.hero; __rec.push({ t: performance.now(), mv: h.mv ? 1 : 0, x: h.x, y: h.y, tx: h.tx, cx: H.cam.x, cy: H.cam.y }); } requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    window.__rel = null; document.addEventListener('keyup', () => { const H = D.HS; if (H) window.__rel = { x: H.hero.x, y: H.hero.y }; }, true);
    window.__tapAt = (H, x, y) => { const cv = document.querySelector('#hcv'), r = cv.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * s) / 2, oy = (r.height - cv.height * s) / 2;
      const cx = r.left + ox + ((x + .5) * 16 - H.cam.x) * s, cy = r.top + oy + ((y + .5) * 16 - H.cam.y) * s; const o = { clientX: cx, clientY: cy, pointerId: 3, bubbles: true, isPrimary: true };
      cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); };
  });
  const H0 = await pg.evaluate(async () => { const H = await __open(null, 0, false); const o = __open9(H); window.__o = o; return o; });
  if (!H0) { console.log('no open floor'); process.exit(2); }
  const [OX, OY] = H0;
  const tp = (x, y, d) => pg.evaluate(([x, y, d]) => { const H = __dbg.HS, h = H.hero; h.mv = null; h.path = null; h.chase = null; h.x = h.tx = x; h.y = h.ty = y; h.dir = d; h.hidden = false; H.kd = []; H.auto = false; H.focus = null; H.focusPt = null; hsCam(H, true); }, [x, y, d]);
  const still = async () => { for (let i = 0; i < 300; i++) { const mv = await pg.evaluate(() => !!(__dbg.HS.hero.mv || __dbg.HS.hero.path)); if (!mv) break; await pg.waitForTimeout(10); } await pg.waitForTimeout(40); };
  const KEY = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];
  /* 1. 按住 40–500 ms */
  const trials = []; const N = +(process.env.N || 40);
  for (let i = 0; i < N; i++) {
    const D = Math.round(40 + i * 460 / (N - 1)), dir = i % 2 ? 1 : 2, x0 = dir === 2 ? OX : OX + 8, y0 = OY - 1 + (i % 4);
    await tp(x0, y0, dir); await pg.waitForTimeout(120);
    await pg.keyboard.down(KEY[dir]); await pg.waitForTimeout(D); await pg.keyboard.up(KEY[dir]); await still();
    const r = await pg.evaluate(() => ({ x: __dbg.HS.hero.tx, rel: window.__rel }));
    const moved = Math.abs(r.x - x0), atRel = Math.abs(r.rel.x - x0), want = Math.max(1, Math.round(atRel));
    trials.push({ D, moved, atRel: +atRel.toFixed(2), want });
  }
  const over = trials.filter(t => t.moved > t.want).length, under = trials.filter(t => t.moved < t.want).length;
  /* 2. 纯点一下 */
  const taps = []; for (const ms of [40, 50, 60, 70, 80, 40, 50, 60]) { const dir = taps.length % 4 < 2 ? 2 : 0; await tp(OX + 4, OY, dir === 2 ? 2 : 2); await pg.waitForTimeout(120); await pg.keyboard.down(KEY[dir]); await pg.waitForTimeout(ms); await pg.keyboard.up(KEY[dir]); await still(); taps.push(await pg.evaluate(([x0, y0]) => Math.abs(__dbg.HS.hero.tx - x0) + Math.abs(__dbg.HS.hero.ty - y0), [OX + 4, OY])); }
  /* 3. 拐弯 */
  const hitch = []; for (let k = 0; k < 3; k++) { await tp(OX, OY - 1, 2); await pg.waitForTimeout(150); await pg.evaluate(() => { __rec = []; __recOn = true; });
    await pg.keyboard.down('ArrowRight'); await pg.waitForTimeout(420 + k * 50); await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(20); await pg.keyboard.up('ArrowRight'); await pg.waitForTimeout(450); await pg.keyboard.up('ArrowDown'); await still();
    hitch.push(await pg.evaluate(() => { __recOn = false; const R = __rec; const i0 = R.findIndex(s => s.mv); let last = -1; for (let i = R.length - 1; i >= 0; i--) if (R[i].mv) { last = i; break; } let gap = 0, cur = 0; for (let i = i0 + 1; i <= last; i++) { if (!R[i].mv) cur += R[i].t - R[i - 1].t; else { gap = Math.max(gap, cur); cur = 0; } } return Math.round(gap); })); }
  /* 4. 停下后镜头；走路时人物在屏幕上的抖动 */
  const slide = [], jit = []; for (let k = 0; k < 3; k++) { const dir = k % 2 ? 1 : 2; await tp(dir === 2 ? OX : OX + 8, OY + 2, dir); await pg.waitForTimeout(200); await pg.evaluate(() => { __rec = []; __recOn = true; });
    await pg.keyboard.down(KEY[dir]); await pg.waitForTimeout(650); await pg.keyboard.up(KEY[dir]); await still(); await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => { __recOn = false; const R = __rec; let s = -1; for (let i = R.length - 1; i > 0; i--) if (R[i - 1].mv && !R[i].mv) { s = i; break; } const fin = R[R.length - 1]; let mx = 0, until = 0; for (let i = s; i < R.length; i++) { const d = Math.abs(R[i].cx - fin.cx) + Math.abs(R[i].cy - fin.cy); if (d > .5) until = R[i].t - R[s].t; mx = Math.max(mx, d); }
      const sx = R.filter((q, i) => q.mv && i > 8 && i < s - 1).map(q => Math.round(q.x * 16) - Math.round(q.cx)); return { slide: +mx.toFixed(1), ms: Math.round(until), jit: sx.length ? Math.max(...sx) - Math.min(...sx) : 0 }; });
    slide.push(r.slide + 'px/' + r.ms + 'ms'); jit.push(r.jit); }
  /* 5. 自动模式下按方向键：松开以后不该再自己走 */
  const auto = await pg.evaluate(async () => { const H = __dbg.HS; H.auto = true; await new Promise(r => setTimeout(r, 50)); return 1; }) && await (async () => { await pg.keyboard.down('ArrowRight'); await pg.waitForTimeout(200); await pg.keyboard.up('ArrowRight'); await pg.waitForTimeout(400);
    const a = await pg.evaluate(() => ({ auto: __dbg.HS.auto, x: __dbg.HS.hero.tx, y: __dbg.HS.hero.ty })); await pg.waitForTimeout(1500); const b2 = await pg.evaluate(() => ({ x: __dbg.HS.hero.tx, y: __dbg.HS.hero.ty })); await pg.evaluate(() => { __dbg.HS.auto = false; });
    return { autoAfterKey: a.auto, walkedAfterRelease: Math.abs(b2.x - a.x) + Math.abs(b2.y - a.y) }; })();
  /* 6. 点旁边的空地：柜子 / 游客 / 机关旁边 */
  const tapTests = await pg.evaluate(async () => { const H = __dbg.HS, M = H.M, h = H.hero, out = [];
    const free = (x, y) => !hmSolid(M, M.hs, x, y) && !M.hides.some(e => e.x === x && e.y === y) && !M.slots.some(s => s.x === x && s.y === y) && !M.staff.some(s => s.x === x && s.y === y) && !hBackAt(M, x, y);
    const run = async (lab, tx, ty, ox, oy, start) => { h.mv = null; h.path = null; h.chase = null; h.hidden = false; h.x = h.tx = start[0]; h.y = h.ty = start[1]; H.kd = []; H.focus = null; H.focusPt = [tx, ty]; hsCam(H, true); await new Promise(r => requestAnimationFrame(r));
      __tapAt(H, tx + ox, ty + oy); const chase = !!h.chase, slotFired = M.slots.some(s => s.fx > 0); let t = 0; while ((h.mv || h.path) && t < 8) { hStep(H, .05); t += .05; } out.push({ lab, ok: h.tx === tx && h.ty === ty && !h.hidden && !chase, at: [h.tx - tx, h.ty - ty], hid: h.hidden, chase }); for (const s of M.slots) s.fx = 0; h.chase = null; };
    const far = (x, y) => { for (let r = 3; r <= 6; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, r]]) if (free(x + dx, y + dy) && hmField(M, x, y, 'h')[(y + dy) * M.w + x + dx] >= 0) return [x + dx, y + dy]; return null; };
    /* 柜子：旁边和下面的空地，点格子中央和靠近柜子那一侧（离边 0.1 格） */
    let nc = 0; for (const e of M.hides) { if (nc >= 4) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) { const x = e.x + dx, y = e.y + dy; if (!free(x, y)) continue; const s = far(x, y); if (!s) continue; await run('cabinet' + (dy ? 'below' : 'side') + '-center', x, y, 0, 0, s); await run('cabinet' + (dy ? 'below' : 'side') + '-edge', x, y, -dx * .4, -dy * .4, s); nc++; break; } }
    /* 游客：站在空地中间，点上、左右、下面的格子 */
    const o = __o, v = H.vis[0], vp = [o[0] + 4, o[1] + 1]; __put(H, v, vp, 'phone'); v.dir = 3;
    for (const [dx, dy, l] of [[0, -1, 'above'], [1, 0, 'side'], [-1, 0, 'side'], [0, 1, 'below']]) { await run('visitor-' + l + '-center', vp[0] + dx, vp[1] + dy, 0, 0, [vp[0] + dx * 4 || vp[0] - 3, vp[1] + dy * 2 || vp[1] + 2]); }
    await run('visitor-side-edge', vp[0] + 1, vp[1], -.3, 0, [vp[0] + 4, vp[1] + 2]);
    v.st = 'wait'; v.at = 1e9; v.x = v.tx = -9; v.y = v.ty = -9;
    /* 机关位（有机关的）：旁边的空地 */
    let ns = 0; for (const s of M.slots) { if (!s.k || ns >= 3) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = s.x + dx, y = s.y + dy; if (!free(x, y)) continue; const st = far(x, y); if (!st) continue; await run('slot-edge', x, y, -dx * .3, -dy * .3, st); ns++; break; } }
    return out; });
  /* 7. 点墙：只吸到 1 格内的空地 */
  const snap = await pg.evaluate(async () => { const H = __dbg.HS, M = H.M, h = H.hero, o = __o; let w1 = null, w2 = null;
    for (let y = 2; y < M.h - 2 && !(w1 && w2); y++) for (let x = 2; x < M.w - 2; x++) { if (!hmSolid(M, M.hs, x, y)) continue; let n1 = 0, n2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (hmSolid(M, M.hs, x + dx, y + dy)) continue; if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1) n1++; else n2++; } if (!w1 && n1 && hmField(M, o[0], o[1], 'h')) w1 = [x, y]; if (!w2 && !n1 && n2) w2 = [x, y]; }
    const go = async p => { h.mv = null; h.path = null; h.x = h.tx = o[0]; h.y = h.ty = o[1]; H.focusPt = p; hsCam(H, true); await new Promise(r => requestAnimationFrame(r)); __tapAt(H, p[0], p[1]); return h.path ? Math.max(Math.abs(h.path[0] - p[0]), Math.abs(h.path[1] - p[1])) : -1; };
    return { wallNextToFloor: w1 ? await go(w1) : 'n/a', wall2FromFloor: w2 ? await go(w2) : 'n/a' }; });
  /* 8. 点地面找路：目的地不在员工通道里时，路线有多少格在墙里的员工通道（M.stw）上 */
  const back = await pg.evaluate(async () => { const H = __dbg.HS, M = H.M, h = H.hero, P = M.path; let worst = 0, n = 0, tot = 0;
    for (const [a, z] of [[10, 120], [30, 90], [5, 60], [40, 140]]) { const p0 = P[a], p1 = P[Math.min(P.length - 1, z)]; if (hBackAt(M, p1[0], p1[1])) continue; h.mv = null; h.path = null; h.x = h.tx = p0[0]; h.y = h.ty = p0[1]; H.focusPt = p1; hsCam(H, true); await new Promise(r => requestAnimationFrame(r)); __tapAt(H, p1[0], p1[1]);
      let b = 0, s = 0, t = 0; while ((h.mv || h.path) && t < 60) { hStep(H, .05); t += .05; if (h.mv) { s++; const i = Math.round(h.y) * M.w + Math.round(h.x); if (M.stw && M.stw[i]) b++; } } const sh = b / Math.max(1, s); worst = Math.max(worst, sh); tot += sh; n++; }
    return { routesTested: n, backstageShareAvg: +(tot / Math.max(1, n)).toFixed(2), worst: +worst.toFixed(2) }; });
  /* 9. 新点的目的地在身后：不要先把这一步走完 */
  const turnback = await pg.evaluate(async () => { const H = __dbg.HS, h = H.hero, o = __o; h.mv = null; h.path = null; h.x = h.tx = o[0] + 4; h.y = h.ty = o[1]; H.focusPt = [o[0] + 4, o[1]]; hsCam(H, true); await new Promise(r => requestAnimationFrame(r)); hGo(H, o[0] + 8, o[1]); hStep(H, .05); hStep(H, .03);
    const p0 = h.mv ? +h.mv.p.toFixed(2) : -1; const t0 = H.t; __tapAt(H, o[0], o[1]); let t = 0, back = null; while ((h.mv || h.path) && t < 6) { hStep(H, .02); t += .02; if (back == null && h.x < o[0] + 4 - .01) back = +(H.t - t0).toFixed(2); } return { progressWhenRetapped: p0, secsUntilHeadingBack: back, arrived: h.tx === o[0] }; });
  /* 9b. 拖地图：镜头跟着手指；拖开以后陈歌一走就回到陈歌身上 */
  const pan = await pg.evaluate(async () => { const H = __dbg.HS, h = H.hero, o = __o, cv = document.querySelector('#hcv'), r = cv.getBoundingClientRect(), s = r.width / cv.width; h.mv = null; h.path = null; h.x = h.tx = o[0] + 4; h.y = h.ty = o[1]; H.focus = null; H.focusPt = null; hsCam(H, true);
    const raf = () => new Promise(q => requestAnimationFrame(q)), c0 = H.cam.x, X = r.left + r.width / 2, Y = r.top + r.height / 2, ev = (t, x) => cv.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: Y, pointerId: 5, bubbles: true }));
    ev('pointerdown', X); for (let k = 1; k <= 6; k++) { ev('pointermove', X - k * 20); await raf(); } await raf(); const dragged = Math.round(H.cam.x - c0), want = Math.round(120 / s); ev('pointerup', X - 120); await raf(); await new Promise(q => setTimeout(q, 300)); const stays = Math.round(H.cam.x - c0);
    hGo(H, o[0] + 5, o[1]); await new Promise(q => setTimeout(q, 1200)); const back = Math.abs(H.cam.x - (Math.round(h.x * 16) + 8 - Math.floor(cv.width / 2))) < 1; return { draggedPx: dragged, fingerPx: want, staysAfterRelease: stays, recentersWhenHeroMoves: back }; });
  /* 10. 双人：队友员工按住方向键，键状态不再刷新（掉线/丢了 keyup）→ 下一格停下；一直刷新 → 一直走 */
  const coop = await pg.evaluate(async () => { const H1 = __dbg.HS; H1.done = true; H1.res = 'quit'; try { hsClose(); } catch (e) { } const H = await __open('wan', 30, false); const st = H.staff[0], M = H.M, o = __open9(H); if (!st || !o) return 'n/a ' + !!st + ' ' + !!o + ' ' + H.staff.length; st.p2 = true; st.cast = null; st.mv = null; st.x = st.tx = o[0]; st.y = st.ty = o[1]; st.home = [o[0], o[1]]; st.kd = null; st.kds = [];
    coopHsIn({ a: 'key', d: 2 }); await new Promise(r => setTimeout(r, 1200)); const lost = st.tx - o[0];
    st.mv = null; st.x = st.tx = o[0]; st.y = st.ty = o[1]; st.kd = null; st.kds = []; coopHsIn({ a: 'key', d: 2 }); const iv = setInterval(() => coopHsIn({ a: 'kh', d: 2 }), 60); await new Promise(r => setTimeout(r, 700)); clearInterval(iv); coopHsIn({ a: 'key', d: 2, up: 1 }); await new Promise(r => setTimeout(r, 400)); const held = st.tx - o[0];
    /* 队友那边：按住时发的消息（把自己临时当成队友，截下 netSend） */
    const role = NETROLE, ns = netSend, sent = []; let guestMsgs = 'n/a';
    try { NETROLE = 'guest'; netSend = m => sent.push(m); hsKey({ key: 'ArrowRight' }); await new Promise(r => setTimeout(r, 330)); hsKeyUp({ key: 'ArrowRight' }); await new Promise(r => setTimeout(r, 150));
      guestMsgs = sent.filter(m => m.t === 'hs').map(m => m.a + (m.up ? '-up' : '') + JSON.stringify(m.ds || [])).join(' '); } finally { NETROLE = role; netSend = ns; }
    return { tilesAfterKeyDownWithNoRefreshFor1200ms: lost, tilesWithRefreshFor700ms: held, guestSends: guestMsgs }; });
  const R = { overshoot: over + '/' + trials.length + ' (' + Math.round(over / trials.length * 100) + '%)', undershoot: under + '/' + trials.length, pureTap_40to80ms_tiles: taps.join(' '), cornerHitch_ms: hitch.join(' '), cameraSlideAfterStop: slide.join(' '), spriteScreenJitter_px: jit.join(' '), auto,
    tapNextTo: tapTests.filter(t => t.ok).length + '/' + tapTests.length + ' walked to the tapped tile', tapFails: tapTests.filter(t => !t.ok).map(t => t.lab + (t.hid ? ':hid' : t.chase ? ':chase' : ':' + t.at)).join(' '), snap, tapRouteBackstage: back, retapBehind: turnback, pan, coop, errors: errs.length ? errs.slice(0, 3) : 'none' };
  if (process.env.VERBOSE) console.log(trials.map(t => t.D + 'ms→' + t.moved + '(rel ' + t.atRel + ')').join('  '));
  console.log(JSON.stringify(R, null, 1));
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
