// node kongbuwu/night/tests/move.js — 夜晚任务：走路精度（按住/松开、点一下、拐弯、镜头、摇杆）
// 需要：从仓库根目录起 http 服务器（默认 http://localhost:8782/），NODE_PATH 里有 playwright。
// 环境变量：URL=页面地址（默认 http://localhost:8782/kongbuwu/night/out/night.html）
//           FILE=本地 html 文件（用它代替 URL 的内容，比如对比改之前的构建）
// 报告：过冲率（停的格子比松手时离得最近的格子多走了一格）、纯点一下的结果、拐弯卡顿、停下后镜头滑动、走路时人物在屏幕上的抖动、摇杆。
const { chromium } = require('playwright'); const fs = require('fs');
const EXE = process.env.CHROME || (fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d/.test(d)).map(d => '/opt/pw-browsers/' + d + '/chrome-linux64/chrome').find(p => fs.existsSync(p)) : undefined);
const URL = process.env.URL || 'http://localhost:8782/kongbuwu/night/out/night.html';
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--disable-gpu'] }); const pg = await b.newPage({ viewport: { width: 700, height: 500 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  if (process.env.FILE) await pg.route('**/night.html*', r => r.fulfill({ path: process.env.FILE, contentType: 'text/html' }));
  await pg.goto(URL + '?debug=1'); await pg.waitForTimeout(600);
  const CX = 12, CY = 5;   /* date 章节的校园：第 2–8 行整行是空地，这个窗口大小下镜头左右都跟得上 */
  await pg.evaluate(async () => { const D = __dbg; D.store.del('cp.date'); D.startChapter('date', false); const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 300; i++) { const W = D.W; if (W && canMove()) break; if (W && W.dlg && W.dlg.choices) D.doAct('pick', 0); else if (W && (W.dlg || W.card || W.note)) { if (W.dlg) W.dlg.full = true; D.doAct('adv'); } await sleep(60); }
    const m = curMap(); m.def.step = null; for (const e of m.ents) { e.touch = null; }
    /* 每帧记录：时间、是否在走、格子、像素、镜头 */
    window.__rec = []; window.__recOn = false; const loop = () => { if (window.__recOn) { const p = D.W.pl; __rec.push({ t: performance.now(), mv: p.mv ? 1 : 0, x: p.x, y: p.y, px: p.px, py: p.py, cx: CAM.x, cy: CAM.y, d: p.dir }); } requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    window.__rel = null; addEventListener('keyup', () => { const p = D.W.pl; window.__rel = { px: p.px, py: p.py, t: performance.now() }; }, true);
    window.__press = []; IN.handlers.push(n => { __press.push(n); return false; });
  });
  const ok = await pg.evaluate(() => canMove() && curMap().def && __dbg.W.mapId); if (!ok) { console.log('could not get control'); process.exit(2); }
  const tp = (x, y, d) => pg.evaluate(([x, y, d]) => { const p = __dbg.W.pl; p.mv = null; __dbg.tp(x, y, d); p.dir = d; camUpdate(0, true); }, [x, y, d]);
  const still = async () => { for (let i = 0; i < 200; i++) { const mv = await pg.evaluate(() => !!__dbg.W.pl.mv); if (!mv) break; await pg.waitForTimeout(10); } await pg.waitForTimeout(40); };
  const KEY = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'], DX = [[0, 1], [-1, 0], [1, 0], [0, -1]];
  /* ---------- 1. 按住 40–500 ms 再松开（已经朝着那个方向） ---------- */
  const trials = []; const N = +(process.env.N || 40);
  for (let i = 0; i < N; i++) {
    const D = Math.round(40 + i * 460 / (N - 1)), dir = i % 2 ? 1 : 2, x0 = dir === 2 ? CX - 4 : CX + 4, y0 = CY - 2 + (i % 5);
    await tp(x0, y0, dir); await pg.waitForTimeout(120);
    await pg.keyboard.down(KEY[dir]); await pg.waitForTimeout(D); await pg.keyboard.up(KEY[dir]); await still();
    const r = await pg.evaluate(() => ({ x: __dbg.W.pl.x, rel: window.__rel }));
    const moved = Math.abs(r.x - x0), atRel = Math.abs(r.rel.px / 16 - x0), want = Math.max(1, Math.round(atRel));
    trials.push({ D, moved, atRel: +atRel.toFixed(2), want });
  }
  const over = trials.filter(t => t.moved > t.want).length, under = trials.filter(t => t.moved < t.want).length;
  /* ---------- 2. 纯点一下 ---------- */
  const tap = async (dir, face, ms) => { await tp(CX, CY, face); await pg.waitForTimeout(150); await pg.keyboard.down(KEY[dir]); await pg.waitForTimeout(ms); await pg.keyboard.up(KEY[dir]); await still(); await pg.waitForTimeout(120); return pg.evaluate(([x0, y0]) => ({ tiles: Math.abs(__dbg.W.pl.x - x0) + Math.abs(__dbg.W.pl.y - y0), dir: __dbg.W.pl.dir }), [CX, CY]); };
  const sameTap = [], newTap = [], newHold = [], afterTurn = [];
  for (const ms of [40, 50, 60, 70, 80]) sameTap.push((await tap(2, 2, ms)).tiles);
  for (const ms of [40, 50, 60]) { const r = await tap(0, 2, ms); newTap.push(r.tiles + (r.dir === 0 ? 't' : '')); }
  for (const ms of [130, 160, 200]) { const r = await tap(0, 2, ms); newHold.push(r.tiles); }
  /* 先点一下转身（不走），再点一下同方向：应该立刻走一格 */
  for (let k = 0; k < 3; k++) { await tp(CX, CY, 2); await pg.waitForTimeout(150); await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(40); await pg.keyboard.up('ArrowDown'); await pg.waitForTimeout(250);
    await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(45); await pg.keyboard.up('ArrowDown'); await still(); await pg.waitForTimeout(100);
    afterTurn.push(await pg.evaluate(([x0, y0]) => (__dbg.W.pl.y - y0) + '@' + __dbg.W.pl.dir, [CX, CY])); }
  /* ---------- 3. 拐弯：按住右走，再按下（松开右）——中间停了多久 ---------- */
  const hitch = [];
  for (let k = 0; k < 4; k++) { await tp(CX - 4, CY - 3, 2); await pg.waitForTimeout(150); await pg.evaluate(() => { __rec = []; __recOn = true; });
    await pg.keyboard.down('ArrowRight'); await pg.waitForTimeout(430 + k * 40); await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(20); await pg.keyboard.up('ArrowRight'); await pg.waitForTimeout(500); await pg.keyboard.up('ArrowDown'); await still();
    const g = await pg.evaluate(() => { __recOn = false; const R = __rec; let i0 = R.findIndex(s => s.mv), last = -1; for (let i = R.length - 1; i >= 0; i--) if (R[i].mv) { last = i; break; } let gap = 0, cur = 0; for (let i = i0 + 1; i <= last; i++) { if (!R[i].mv) cur += R[i].t - R[i - 1].t; else { gap = Math.max(gap, cur); cur = 0; } } return Math.round(gap); });
    hitch.push(g); }
  /* ---------- 4. 停下后镜头滑多远；走路时人物在屏幕上抖不抖 ---------- */
  const slide = [], jit = [];
  for (let k = 0; k < 4; k++) { const dir = k % 2 ? 1 : 2; await tp(dir === 2 ? CX - 4 : CX + 4, CY + 2, dir); await pg.waitForTimeout(200); await pg.evaluate(() => { __rec = []; __recOn = true; });
    await pg.keyboard.down(KEY[dir]); await pg.waitForTimeout(620); await pg.keyboard.up(KEY[dir]); await still(); await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => { __recOn = false; const R = __rec; let s = -1; for (let i = R.length - 1; i > 0; i--) if (R[i - 1].mv && !R[i].mv) { s = i; break; } const fin = R[R.length - 1]; let mx = 0, until = 0; for (let i = s; i < R.length; i++) { const d = Math.abs(R[i].cx - fin.cx) + Math.abs(R[i].cy - fin.cy); if (d > .5) until = R[i].t - R[s].t; mx = Math.max(mx, d); }
      const sx = R.filter((q, i) => q.mv && i > 8 && i < s - 1).map(q => Math.round(q.px) - Math.round(q.cx)); return { slide: +mx.toFixed(1), ms: Math.round(until), jit: sx.length ? Math.max(...sx) - Math.min(...sx) : 0 }; });
    slide.push(r.slide + 'px/' + r.ms + 'ms'); jit.push(r.jit); }
  /* ---------- 5. 摇杆 ---------- */
  const joy = await pg.evaluate(async () => { const T = document.getElementById('touch'); T.classList.remove('hidden'); T.setPointerCapture = () => {}; const sleep = ms => new Promise(r => setTimeout(r, ms)); const p = __dbg.W.pl; p.mv = null; __dbg.tp(12, 5, 2);
    const ev = (type, x, y) => T.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true, isPrimary: true, pointerType: 'touch' }));
    const x0 = 200, y0 = 500, res = {}; __press.length = 0; ev('pointerdown', x0, y0); await sleep(30);
    ev('pointermove', x0 + 30, y0 + 2); await sleep(30); res.right = IN.joyDir;
    ev('pointermove', x0 + 30, y0 + 35); await sleep(30); res.diag117 = IN.joyDir;   /* 竖直分量只比水平大 1.17 倍 */
    ev('pointermove', x0 + 30, y0 + 45); await sleep(30); res.diag15 = IN.joyDir;    /* 1.5 倍：该换成下 */
    ev('pointermove', x0 - 2, y0 + 15); await sleep(30); res.dz15 = IN.joyDir;        /* 15 px：死区内 */
    ev('pointermove', x0 + 70, y0); await sleep(30); res.knob = Math.round(parseFloat(document.getElementById('joyk').style.left) - x0);
    res.presses = __press.filter(n => ['down', 'left', 'right', 'up'].includes(n)).join(',');
    document.getElementById('bRun').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); res.latchOn = IN.runLatch;
    ev('pointerup', x0 + 70, y0); await sleep(30); res.latchAfterRelease = IN.runLatch; IN.runLatch = false; document.getElementById('bRun').classList.remove('on'); T.classList.add('hidden'); p.mv = null; __dbg.tp(12, 5, 2); return res; });
  const R = {
    overshoot: over + '/' + trials.length + ' (' + Math.round(over / trials.length * 100) + '%)', undershoot: under + '/' + trials.length,
    sameDirTap_40to80ms_tiles: sameTap.join(' '), newDirTap_40to60ms: newTap.join(' '), newDirHold_130to200ms_tiles: newHold.join(' '), tapAfterTurnTap_dy_at_dir: afterTurn.join(' '),
    cornerHitch_ms: hitch.join(' '), cameraSlideAfterStop: slide.join(' '), spriteScreenJitter_px: jit.join(' '), joystick: joy, errors: errs.length ? errs.slice(0, 3) : 'none'
  };
  if (process.env.VERBOSE) console.log(trials.map(t => t.D + 'ms→' + t.moved + '(rel ' + t.atRel + ')').join('  '));
  console.log(JSON.stringify(R, null, 1));
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
