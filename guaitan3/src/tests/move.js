/* 百物语 · 移动手感测试（真实键盘事件）
 *
 * 用法：NODE_PATH=/home/claude/work/node_modules node guaitan3/src/tests/move.js [--url URL] [--ch 章节id] [--seed N] [--chrome PATH]
 *   URL 默认 http://127.0.0.1:8781/guaitan3/index.html（需要先在仓库根起一个静态服务器：python3 -m http.server 8781）
 *
 * 做法：进入章节、翻完开场，找一段「直线 ≥ 9 格、没有实体、两侧有拐角空间」的空地，关掉本图的踩踏/计时/追逐脚本，
 * 然后用 page.keyboard.down/up 按不同时长按方向键，记录松手瞬间（页面里 keyup 捕获阶段）的位置和最终停下的格子。
 *
 * 判定规则（越界 overshoot）：
 *   松手时角色「看起来所在的格子」N = round(像素位置 / 16)（沿移动方向）。
 *   - 松手时还在「第一步」里（新按下的那一步，还没走到第一格）：期望正好停在第一格（轻点=一格，不算越界）。
 *   - 否则：停在 N 算准确；停在 N 之后 1 格 = 越界（overshoot）；N 之后 ≥2 格 = 严重越界；停在 N 之前 = 回退（undershoot）。
 *   容差：overshoot 率只统计第二步及以后松手的试次（已经连走的情况）。
 * 其他指标：
 *   - 原地转身：站定、面朝下，按「右」不同时长 → 只转身 / 转身并走一格
 *   - 拐角卡顿：按住右走，中途再按下（不松右），统计拐角处位置不动的最长时间
 *   - 停下后镜头滑动：松手停下后 CAM 还在变化的帧数
 *   - 角色相对背景抖动：连续行走时角色屏幕坐标（round(px) - round(CAM.x)）来回跳的次数
 */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const URL0 = arg('--url', 'http://127.0.0.1:8781/guaitan3/index.html');
const CH = arg('--ch', null);
let seed = +arg('--seed', 7);
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
function findChrome() {
  const c = arg('--chrome', null); if (c) return c;
  const base = '/opt/pw-browsers';
  try { for (const d of fs.readdirSync(base)) if (/^chromium-\d+$/.test(d)) { const p = path.join(base, d, 'chrome-linux64', 'chrome'); if (fs.existsSync(p)) return p; } } catch (e) { }
  return undefined;
}

/* 页面里用的辅助函数 */
const PAGE_JS = `
window.__mv = {
  log: [],
  snap() { const W = window.__dbg.W, p = W.pl; return { t: performance.now(), x: p.x, y: p.y, px: p.px, py: p.py, dir: p.dir, mv: p.mv ? { fx: p.mv.fx, fy: p.mv.fy, tx: p.mv.tx, ty: p.mv.ty, p: p.mv.p } : null, cx: CAM.x, cy: CAM.y }; },
  rec: null,
  startRec() { this.rec = []; const loop = () => { if (!this.rec) return; this.rec.push(this.snap()); requestAnimationFrame(loop); }; requestAnimationFrame(loop); },
  stopRec() { const r = this.rec; this.rec = null; return r; },
};
addEventListener('keydown', e => { if (!e.repeat && window.__dbg && window.__dbg.W) window.__mv.down = window.__mv.snap(); }, true);
addEventListener('keyup', e => { if (window.__dbg && window.__dbg.W) window.__mv.up = window.__mv.snap(); }, true);
`;

async function advance(page, maxMs = 30000) {
  return page.evaluate(async maxMs => {
    const D = window.__dbg, t0 = performance.now(), sleep = ms => new Promise(r => setTimeout(r, ms));
    let idle = 0;
    while (performance.now() - t0 < maxMs) {
      const W = D.W; if (!W) { await sleep(60); continue; }
      if (W.endScreen) return 'end';
      if (W.dlg && W.dlg.choices) { W.dlg.full = true; await sleep(260); D.doAct('pick', 0); await sleep(40); idle = 0; continue; }
      if (W.dlg || W.card || W.note) { if (W.dlg) W.dlg.full = true; await sleep(W.card ? 520 : 170); D.doAct('adv'); idle = 0; continue; }
      if (W.keypad) { D.doAct('keycancel'); await sleep(200); continue; }
      if (W.busy) { idle = 0; await sleep(50); continue; }
      if (++idle > 4) return 'idle';
      await sleep(50);
    }
    return 'timeout';
  }, maxMs);
}

/* 找空地：横向（或纵向）直线 ≥ 9 格，全部可走且没有实体；第 4 格的上/下还有 ≥ 2 格空地（拐角测试） */
async function findSpot(page) {
  return page.evaluate(() => {
    const W = window.__dbg.W, m = W.maps[W.mapId];
    const free = (x, y) => passable(m, x, y, W.pl) && entsAt(m, x, y).length === 0;
    let best = null;
    for (const [ax, dir, back] of [[1, 2, 1], [0, 0, 3]]) {   // 横向往右 / 纵向往下
      for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
        let n = 0; while (free(ax ? x + n : x, ax ? y : y + n)) n++;
        if (n < 9) continue;
        // 拐角：第 3 格往垂直方向
        const cxk = ax ? x + 3 : x, cyk = ax ? y : y + 3;
        let perp = -1;
        for (const pd of (ax ? [0, 3] : [2, 1])) { const [dx, dy] = DIRS[pd]; if (free(cxk + dx, cyk + dy) && free(cxk + 2 * dx, cyk + 2 * dy)) { perp = pd; break; } }
        if (perp < 0) continue;
        // 镜头要能跟着滚动：这段路上有 ≥ 6 格时镜头不被地图边夹住
        let scroll = 0;
        for (let k = 0; k < Math.min(n, 12); k++) {
          const c = ax ? (x + k) * TS + 8 - VW / 2 : (y + k) * TS + 4 - VH / 2, lim = ax ? m.w * TS - VW : m.h * TS - VH;
          if (c > 2 && c < lim - 2) scroll++; else break;   // 从起点开始连续可滚动
        }
        if (scroll < 6) continue;
        const score = Math.min(n, 14) * 10 + scroll;
        if (!best || score > best.score) best = { x, y, dir, n, perp, score, map: W.mapId, mw: m.w, mh: m.h };
      }
    }
    return best;
  });
}

async function neutralize(page) {
  await page.evaluate(() => {
    const W = window.__dbg.W, m = W.maps[W.mapId];
    m.def = Object.assign({}, m.def, { step: null, tick: null });
    W.ch = Object.assign({}, W.ch, { tick: null });
    W.timer = null; W.queue = []; W.noRun = false;
    for (const e of m.ents) { e.chase = null; e.touch = null; e.bump = null; }
  });
}

async function place(page, s, dir) {
  await page.evaluate(([x, y, d]) => { window.__dbg.tp(x, y, d); camUpdate(0, true); window.__mv.up = window.__mv.down = null; }, [s.x, s.y, dir]);
  await page.waitForTimeout(120);
}
async function waitStop(page) {
  for (let i = 0; i < 200; i++) {
    const st = await page.evaluate(() => { const p = window.__dbg.W.pl; return !p.mv; });
    if (st) { await page.waitForTimeout(60); const st2 = await page.evaluate(() => !window.__dbg.W.pl.mv); if (st2) return; }
    await page.waitForTimeout(20);
  }
}

const KEY = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome() });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.route('**/peerjs.min.js', r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.addInitScript(PAGE_JS);
  await page.goto(URL0 + '?debug=1&fast=8');
  await page.waitForFunction(() => window.__dbg);
  const ids = await page.evaluate(() => window.__dbg.CHAPTERS.map(c => c.id));
  let spot = null, cid = null;
  for (const id of (CH ? [CH] : ids)) {
    await page.evaluate(id => { window.__dbg.store.del('cp.' + id); window.__dbg.startChapter(id, false); }, id);
    await page.waitForTimeout(200);
    await advance(page);
    const s = await findSpot(page);
    if (s && s.n >= 9) { spot = s; cid = id; break; }
  }
  if (!spot) { console.log('no open spot found'); process.exit(2); }
  await neutralize(page);
  console.log(`chapter ${cid} map ${spot.map} start (${spot.x},${spot.y}) dir ${spot.dir} run ${spot.n} tiles`);
  const ax = spot.dir === 2 ? 'x' : 'y', pax = 'p' + ax, key = KEY[spot.dir];
  const T = await page.evaluate(() => [TS, WALK_SPD, RUN_SPD]); const TS = T[0];
  console.log(`walk tile time ${(1000 / T[1]).toFixed(0)} ms, run ${(1000 / T[2]).toFixed(0)} ms`);

  /* ---- 1. 越界率 ---- */
  const durs = [40, 80, 120, 200, 260, 300, 400, 500];
  const trials = [];
  for (let r = 0; r < 3; r++) for (const d of durs) trials.push({ d, run: false });
  for (let i = 0; i < 16; i++) trials.push({ d: Math.round(150 + rnd() * 750), run: false });
  for (let i = 0; i < 10; i++) trials.push({ d: Math.round(120 + rnd() * 600), run: true });
  const res = [];
  for (const tr of trials) {
    await place(page, spot, spot.dir);
    if (tr.run) await page.keyboard.down('Shift');
    await page.keyboard.down(key);
    await page.waitForTimeout(tr.d);
    await page.keyboard.up(key);
    if (tr.run) await page.keyboard.up('Shift');
    await waitStop(page);
    const o = await page.evaluate(() => ({ up: window.__mv.up, down: window.__mv.down, fin: window.__mv.snap() }));
    const start = spot[ax], up = o.up;
    const N = Math.round(up[pax] / TS) - start;          // 松手时看起来所在的格（相对起点）
    const fin = o.fin[ax] - start;
    const firstStep = up.mv && up.mv['f' + ax] === start && fin <= 1;
    const atStart = !up.mv && up[ax] === start;          // 还没开始走（转身/起步前就松了）
    let cls;
    if (firstStep || atStart) cls = fin === 1 ? 'tap1' : fin === 0 ? 'tap0' : 'tapX';
    else if (fin === N) cls = 'ok';
    else if (fin === N + 1) cls = 'over1';
    else if (fin > N + 1) cls = 'over2';
    else cls = 'under';
    res.push({ ...tr, held: Math.round(up.t - (o.down ? o.down.t : up.t)), N, fin, prog: up.mv ? +up.mv.p.toFixed(2) : null, cls });
  }
  const cnt = (f) => res.filter(f).length;
  const chained = res.filter(r => !r.cls.startsWith('tap'));
  console.log('\n trial  run  hold(ms)  N(rel)  final  prog@release  class');
  res.forEach((r, i) => console.log(`${String(i).padStart(5)}  ${r.run ? 'R' : ' '}  ${String(r.held).padStart(7)}  ${String(r.N).padStart(6)}  ${String(r.fin).padStart(5)}  ${String(r.prog).padStart(12)}  ${r.cls}`));
  const taps = res.filter(r => r.cls.startsWith('tap'));
  console.log(`\nSUMMARY overshoot: ${cnt(r => r.cls === 'over1')}/${chained.length} chained releases overshot by 1 tile (${(100 * cnt(r => r.cls === 'over1') / Math.max(1, chained.length)).toFixed(0)}%), ` +
    `${cnt(r => r.cls === 'over2')} by >=2, ${cnt(r => r.cls === 'under')} undershoot, ${cnt(r => r.cls === 'ok')} exact`);
  console.log(`SUMMARY first-step taps (facing): ${taps.filter(r => r.cls === 'tap1').length}/${taps.length} moved exactly one tile, ${taps.filter(r => r.cls === 'tap0').length} did not move, ${taps.filter(r => r.cls === 'tapX').length} other`);

  /* ---- 2. 原地转身 ---- */
  const turnDir = spot.dir === 2 ? 0 : 2;   // 面朝垂直方向，再按前进方向
  const tapRes = [];
  for (const d of [30, 50, 70, 90, 110, 150]) {
    for (let r = 0; r < 2; r++) {
      await place(page, spot, turnDir);
      await page.keyboard.down(key); await page.waitForTimeout(d); await page.keyboard.up(key);
      await waitStop(page);
      const o = await page.evaluate(() => ({ up: window.__mv.up, down: window.__mv.down, fin: window.__mv.snap() }));
      tapRes.push({ d, held: Math.round(o.up.t - o.down.t), turned: o.fin.dir === spot.dir, moved: o.fin[ax] - spot[ax] });
    }
  }
  console.log('\nturn-in-place (facing perpendicular, press forward):');
  for (const t of tapRes) console.log(`  hold ${String(t.held).padStart(4)} ms -> ${t.turned ? 'turned' : 'NOT turned'}${t.moved ? ', stepped ' + t.moved : ', no step'}`);
  // 残留：转身期间松开，再立刻按另一个方向
  console.log(`SUMMARY turn: ${tapRes.filter(t => t.held < 70 && !t.moved && t.turned).length}/${tapRes.filter(t => t.held < 70).length} presses <70ms were pure turns; ` +
    `${tapRes.filter(t => t.held >= 100 && t.moved).length}/${tapRes.filter(t => t.held >= 100).length} presses >=100ms stepped`);

  /* ---- 3. 拐角卡顿 ---- */
  const hitches = [];
  for (let r = 0; r < 4; r++) {
    await place(page, spot, spot.dir);
    await page.evaluate(() => window.__mv.startRec());
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.round(1000 / T[1] * 2.5) + r * 25);   // 第 3 格中途按垂直方向
    await page.keyboard.down(KEY[spot.perp]);
    await page.waitForTimeout(700);
    await page.keyboard.up(KEY[spot.perp]); await page.keyboard.up(key);
    await waitStop(page);
    const rec = await page.evaluate(() => window.__mv.stopRec());
    // 拐角：方向从前进变成垂直的那一刻前后，位置不变的最长时长
    let i0 = rec.findIndex(s => s.mv && s.dir === spot.perp);
    // 拐角前后各 12 帧里，位置没变的帧的时长之和（连续行走时应为 0）
    let still = 0;
    if (i0 > 0) for (let i = Math.max(1, i0 - 12); i < Math.min(rec.length, i0 + 12); i++) if (rec[i].px === rec[i - 1].px && rec[i].py === rec[i - 1].py) still += rec[i].t - rec[i - 1].t;
    hitches.push({ still: Math.round(still), turned: i0 > 0 });
  }
  console.log(`SUMMARY corner hitch (ms with no movement within +-12 frames of the corner, both keys held): ${hitches.map(h => h.turned ? h.still + 'ms' : 'no-turn').join(', ')}`);

  /* ---- 4. 停下后的镜头滑动 & 角色抖动 ---- */
  const cams = [], jit = [];
  for (let r = 0; r < 4; r++) {
    await place(page, spot, spot.dir);
    await page.evaluate(() => window.__mv.startRec());
    await page.keyboard.down(key); await page.waitForTimeout(700 + r * 60); await page.keyboard.up(key);
    await waitStop(page); await page.waitForTimeout(700);
    const rec = await page.evaluate(() => window.__mv.stopRec());
    let iStop = -1; for (let i = rec.length - 1; i > 0; i--) if (rec[i].px !== rec[i - 1].px || rec[i].py !== rec[i - 1].py) { iStop = i; break; }
    let iCam = iStop; for (let i = rec.length - 1; i > iStop; i--) if (Math.round(rec[i].cx) !== Math.round(rec[i - 1].cx) || Math.round(rec[i].cy) !== Math.round(rec[i - 1].cy)) { iCam = i; break; }
    cams.push({ frames: iCam - iStop, ms: Math.round(rec[iCam].t - rec[iStop].t) });
    // 抖动：行走期间（第 2 帧到停下）角色屏幕坐标的变化方向反转次数
    const sx = rec.slice(0, iStop + 1).map(s => Math.round(s[pax]) - Math.round(ax === 'x' ? s.cx : s.cy));
    let rev = 0, last = 0, span = [Math.min(...sx), Math.max(...sx)];
    for (let i = 1; i < sx.length; i++) { const dd = Math.sign(sx[i] - sx[i - 1]); if (dd && last && dd !== last) rev++; if (dd) last = dd; }
    jit.push({ rev, span: span[1] - span[0] });
  }
  console.log(`SUMMARY camera slide after stop: ${cams.map(c => c.frames + 'f/' + c.ms + 'ms').join(', ')}`);
  console.log(`SUMMARY player screen-pos while walking: reversals ${jit.map(j => j.rev).join(',')}; drift range ${jit.map(j => j.span + 'px').join(',')}`);
  /* ---- 5. 退回的一步不重复触发踩踏脚本 ---- */
  const trig = [];
  for (const extra of [20, 50, 80]) {
    await place(page, spot, spot.dir);
    await page.evaluate(() => { const W = window.__dbg.W, m = W.maps[W.mapId]; window.__mv.steps = []; m.def = Object.assign({}, m.def, { step: (S, x, y) => { window.__mv.steps.push(x + ',' + y); } }); });
    await page.keyboard.down(key); await page.waitForTimeout(Math.round(1000 / T[1]) + extra); await page.keyboard.up(key);
    await waitStop(page);
    const o = await page.evaluate(() => ({ steps: window.__mv.steps, fin: window.__mv.snap(), up: window.__mv.up }));
    trig.push(`hold ${Math.round(1000 / T[1]) + extra}ms: final +${o.fin[ax] - spot[ax]}, step triggers [${o.steps.join(' ')}]`);
  }
  await page.evaluate(() => { const W = window.__dbg.W, m = W.maps[W.mapId]; m.def = Object.assign({}, m.def, { step: null }); });
  console.log('SUMMARY step triggers on late release: ' + trig.join(' | '));
  if (errs.length) console.log('PAGE ERRORS:\n' + errs.join('\n'));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
