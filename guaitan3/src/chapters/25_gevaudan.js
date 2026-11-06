/* ================= 第二十五夜 · 热沃当怪兽 ================= */
(() => {
  const N = t => async S => S.narr(t);
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }
  const dst = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const ex_ = e => Math.round(e.px / TS), ey_ = e => Math.round(e.py / TS);
  const SHEEP = ['sh1', 'sh2', 'sh3', 'sh4', 'sh5', 'sh6'];
  const SNAME = { sh1: '白额', sh2: '卷毛', sh3: '黑脸', sh4: '瘸腿', sh5: '胖墩', sh6: '小不点' };
  const COMPASS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];
  const compass = a => COMPASS[(Math.round(((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (Math.PI / 4))) % 8];

  /* ---------- 声音（S.tone 合成，双方都听得到；都是短音，不提前排长串） ---------- */
  const SND = {
    bark(S, v = .1) { S.tone('square', 300, 170, .08, v, 0, 1100); S.tone('square', 280, 150, .1, v * .9, .16, 1000); },
    growl(S, v = .1) { S.tone('sawtooth', 92, 70, .7, v, 0, 260); S.tone('sawtooth', 61, 55, .7, v * .7, .05, 200); },
    baa(S, v = .05, d = 0) { S.tone('sawtooth', 520, 470, .12, v, d, 1400); S.tone('sawtooth', 505, 430, .3, v, d + .12, 1300); },
    sbell(S, v = .05, d = 0) { S.tone('triangle', 1560, 1550, .5, v, d); S.tone('sine', 2340, 2330, .35, v * .5, d + .02); },
    cbell(S, v = .13) { S.tone('sine', 392, 390, 2.2, v); S.tone('sine', 784, 780, 1.4, v * .4); S.tone('triangle', 1176, 1170, .7, v * .2); },
    howl(S, v = .07) { S.tone('sine', 360, 620, .9, v, 0, 1600); S.tone('sine', 620, 400, 1.6, v, .9, 1500); },
    horn(S, v = .1) { [[392, 0, .3], [392, .35, .3], [523, .7, .35], [659, 1.1, .9]].forEach(([f, t, d]) => S.tone('triangle', f, f, d, v, t, 1800)); },
    snarl(S, v = .14) { S.tone('sawtooth', 180, 90, .35, v, 0, 700); S.tone('square', 140, 70, .3, v * .6, .02, 500); },
    yelp(S, v = .1) { S.tone('triangle', 900, 1400, .12, v); S.tone('triangle', 1300, 700, .25, v, .12); },
    crackle(S, v = .04) { for (let i = 0; i < 4; i++) S.tone('square', 1800 + Math.random() * 900, 900, .03, v, i * .07 + Math.random() * .05, 3000); }
  };

  /* ---------- 跟随：狗、弟弟、羊排成一串，踩着玩家走过的格子走 ---------- */
  let TRAIL = [];
  function trailReset() { const p = W.pl; TRAIL = []; for (let i = 0; i < 16; i++) TRAIL.push([p.x, p.y]); }
  function trailTick() { const p = W.pl; if (!TRAIL.length) trailReset(); const h = TRAIL[0]; if (h[0] !== p.x || h[1] !== p.y) { TRAIL.unshift([p.x, p.y]); TRAIL.length = 16; } }
  function folTick(S) {
    const m = curMap(), L = S.f.fol || []; let k = 0;
    for (const id of L) {
      const e = m.ents.find(z => z.id === id); if (!e || e.hidden) continue; k++;
      if (e.mv) continue;
      const t = TRAIL[Math.min(k, TRAIL.length - 1)], x = ex_(e), y = ey_(e);
      if (x === t[0] && y === t[1]) continue;
      const far = Math.abs(x - t[0]) + Math.abs(y - t[1]);
      if (far > 9) { e.px = t[0] * TS; e.py = t[1] * TS; e.x = t[0]; e.y = t[1]; continue; }
      const d = bfsStep(m, x, y, t[0], t[1], e, 900); if (d < 0) continue;
      startMove(e, d, far > 2 ? 7.4 : 4.8);
    }
  }
  /* 换图：跟随者先搬过去（S.go 不会替自定义跟随者搬家） */
  async function goWith(S, map, x, y, dir) {
    for (const id of (S.f.fol || [])) { const e = S.ent(id); if (!e) continue; S.moveTo(id, map, x, y); e.x = x; e.y = y; }
    await S.go(map, x, y, dir);
  }
  /* 站在跟随者身上按调查：转给面前的东西 */
  function frontEnt(self) { const p = W.pl, m = curMap(), x = p.x + DIRS[p.dir][0], y = p.y + DIRS[p.dir][1]; const es = entsAt(m, x, y, e => typeof e.on === 'function' && e !== self); return es.length ? pickTop(m, es) : null; }
  const pass = fn => async (S, e) => { const p = W.pl; if (e && ex_(e) === p.x && ey_(e) === p.y) { const o = frontEnt(e); if (o) return o.on(S, o); } return fn(S, e); };

  /* ---------- 吃草：没跟着走的羊在原地附近慢慢挪 ---------- */
  const WT = {}, HOME = {};
  function grazeTick(S, dt, box) {
    const m = curMap(), fol = S.f.fol || [];
    for (const id of SHEEP) {
      const e = m.ents.find(z => z.id === id); if (!e || e.hidden || e.mv || fol.includes(id) || e.s.stuck) continue;
      if (!HOME[id] || HOME[id][2] !== W.mapId) HOME[id] = [ex_(e), ey_(e), W.mapId];
      WT[id] = (WT[id] ?? Math.random() * 3) - dt; if (WT[id] > 0) continue; WT[id] = 2.2 + Math.random() * 3;
      const d = (Math.random() * 4) | 0, nx = ex_(e) + DIRS[d][0], ny = ey_(e) + DIRS[d][1];
      if (Math.abs(nx - HOME[id][0]) + Math.abs(ny - HOME[id][1]) > 2) continue;
      if (box && !box(nx, ny)) continue;
      if (!passable(m, nx, ny, e) || dst(nx, ny, W.pl.x, W.pl.y) < 1.5) continue;
      startMove(e, d, 1.6);
    }
  }
  const inPen = (x, y) => x >= 11 && x <= 17 && y >= 17 && y <= 21;

  /* ================= 野兽 ================= */
  /* 规则：面向它站定（矛尖对着它），它就不敢扑、慢慢退开；它绕到你背后、你又没转过来，它就扑。
     夜里它进不了火光；你站在火光里，它扑不到你。追上的判定按「不到一格」算。 */
  const BID = { pasture: 'beastP', forest: 'beastF', village: 'beastV' };
  const B = { mode: 'off', x: 0, y: 0, dir: 1, th: 0, r: 3, fear: 0, behind: 0, t: 0, cool: 0, anim: 0, bark: 0, growl: 0, litT: 0, rth: 0, flee: null };
  let NOON_DIED = 0, NIGHT_DIED = 0, NIGHT_LEFT = null, BELL_T = 0, CUE_T = 0;
  const FA = [Math.PI / 2, Math.PI, 0, -Math.PI / 2];
  const DAYP = { fear: 1.5, lunge: .75, om: 1.75, ls: 9.5, stalk: 4.2 };
  const NIGHTP = { fear: 1.3, lunge: .85, om: 1.5, ls: 9.5, stalk: 4.6 };
  function ad(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function bEnt() { const m = W.maps[W.mapId]; return m.ents.find(e => e.id === BID[W.mapId]); }
  function bSet(mode, o) { B.mode = mode; B.t = 0; B.fear = 0; B.behind = 0; B.litT = 0; if (o) Object.assign(B, o); }
  function bSync(e, moved) {
    e.px = Math.round(B.x * TS); e.py = Math.round(B.y * TS); e.x = Math.round(B.x); e.y = Math.round(B.y); e.dir = B.dir;
    if (moved > 0) { B.anim += moved; e.fr = [1, 0, 3, 0][((B.anim * 3) | 0) % 4]; } else e.fr = 0;
  }
  function bPlace(x, y, dir) { const e = bEnt(); B.x = x; B.y = y; if (dir != null) B.dir = dir; if (e) { e.hidden = false; e.alpha = 1; bSync(e, 0); } }
  function bStep(gx, gy, spd, dt) { const dx = gx - B.x, dy = gy - B.y, d = Math.hypot(dx, dy); if (d < .03) return 0; const s = Math.min(d, spd * dt); B.x += dx / d * s; B.y += dy / d * s; B.dir = Math.abs(dx) >= Math.abs(dy) * .7 ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); return s; }
  function bFaceP() { const p = W.pl, dx = p.px / TS - B.x, dy = p.py / TS - B.y; B.dir = Math.abs(dx) >= Math.abs(dy) * .7 ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); }
  function rel() { const p = W.pl, px = p.px / TS, py = p.py / TS, dx = B.x - px, dy = B.y - py, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx); return { px, py, d, th, off: Math.abs(ad(th, FA[p.dir])) }; }

  /* ---------- 夜里的火 ---------- */
  const FIRES = [['fireW', 8, 19], ['fireSW', 11, 24]];
  const FN = ['西边栅门', '西南缺口'];
  const AP_ANG = [Math.PI + .55, Math.PI * .75];        // 它在火光外面蹲守的方向
  const GAP = [[9.3, 19], [11, 22.4]];                  // 火灭了，它从这里钻进羊圈
  const BURN = 2.5, LOG = 50, NIGHT_T = 100, BAPT_N = [19, 20];
  function fireR(i) { const fu = W.f.fuel ? W.f.fuel[i] : 0; return fu > 0 ? 1.7 + 2.5 * fu / 100 : 0; }
  function litAt(x, y, pad) { if (W.f.ph !== 'night') return -1; for (let i = 0; i < FIRES.length; i++) { const r = fireR(i); if (r > 0 && dst(x, y, FIRES[i][1], FIRES[i][2]) < r + pad) return i; } return -1; }
  function pushOut(x, y) {
    for (let i = 0; i < FIRES.length; i++) {
      const r = fireR(i); if (r <= 0) continue;
      const fx = FIRES[i][1], fy = FIRES[i][2], d = dst(x, y, fx, fy);
      if (d < r + .1) { const k = (r + .15) / Math.max(.01, d); x = fx + (x - fx) * k; y = fy + (y - fy) * k; }
    }
    return [x, y];
  }
  function fireVis(S) {
    for (let i = 0; i < FIRES.length; i++) {
      const e = S.ent(FIRES[i][0]); if (!e) continue;
      const fu = S.f.fuel ? S.f.fuel[i] : 100, lv = fu <= 0 ? 0 : Math.ceil(fu / 25);
      if (e.num !== lv) e.num = lv;
      const r = S.f.fuel ? fireR(i) : 4.2, cur = e.light ? e.light.r : 0;
      if (Math.abs(cur - r) > .12 || (r === 0) !== (cur === 0)) e.light = r > 0 ? { r: +r.toFixed(2), col: 'rgba(255,140,50,.22)', flick: true } : null;
    }
  }
  function woodMax(S) { return Math.max(7, 10 - (S.f.woodLost || 0)); }

  /* ---------- 野兽每帧 ---------- */
  function bTick(S, dt) {
    const e = bEnt(); if (!e || B.mode === 'off') return;
    const f = S.f, night = f.ph === 'night';
    if (night) S.lights(e.hidden ? null : [[B.x * TS + (B.dir === 2 ? 13 : B.dir === 1 ? 3 : 8), B.y * TS + 3, .85, .9]]);
    if (B.mode === 'hold' || W.busy) { bSync(e, 0); return; }
    const P = night ? NIGHTP : DAYP, R = rel(), p = W.pl;
    const plLit = night && litAt(R.px, R.py, -.6) >= 0;
    const faced = R.off < .98 && R.d < 4.8;
    let moved = 0; B.t += dt;
    switch (B.mode) {
      case 'stalk': {
        if (night && plLit) { bSet('prowl'); break; }
        let gx = R.px + Math.cos(R.th) * 3.1, gy = R.py + Math.sin(R.th) * 3.1;
        if (night) [gx, gy] = pushOut(gx, gy);
        moved = bStep(gx, gy, P.stalk, dt); if (night) [B.x, B.y] = pushOut(B.x, B.y);
        if (R.d <= 3.6) bSet('circle', { th: R.th, r: Math.max(2.4, R.d) });
        break;
      }
      case 'circle': {
        if (night && plLit) { B.litT += dt; if (B.litT > 2.2) { bSet('prowl'); break; } } else B.litT = 0;
        if (faced) {
          B.fear += dt; B.behind = 0; B.th = R.th; B.r = Math.max(1.25, Math.min(B.r, R.d) - .55 * dt);
          B.growl -= dt; if (B.growl <= 0) { B.growl = 1.2; SND.growl(S, .08); }
          if (B.fear >= P.fear) { repel(S, false); break; }
        } else {
          B.fear = Math.max(0, B.fear - dt * .5);
          const want = FA[p.dir] + Math.PI, dd = ad(want, B.th);
          B.th += Math.sign(dd) * Math.min(Math.abs(dd), P.om * dt);
          B.r += (3 - B.r) * Math.min(1, dt * 1.5);
          if (R.off > 2.0 && !plLit) { B.behind += dt; if (B.behind >= P.lunge) { bSet('lunge'); SND.snarl(S); break; } }
          else B.behind = Math.max(0, B.behind - dt * 2);
        }
        let gx = R.px + Math.cos(B.th) * B.r, gy = R.py + Math.sin(B.th) * B.r;
        if (night) [gx, gy] = pushOut(gx, gy);
        moved = bStep(gx, gy, 7.5, dt); if (night) [B.x, B.y] = pushOut(B.x, B.y);
        bFaceP();
        break;
      }
      case 'lunge': {
        if (faced && R.d > .95) { bSet('circle', { th: R.th, r: R.d, fear: P.fear * .45 }); break; }   // 扑到半路你转过来了：它刹住
        const ox = B.x, oy = B.y;
        moved = bStep(R.px, R.py, P.ls, dt);
        if (night && litAt(B.x, B.y, -.1) >= 0) { B.x = ox; B.y = oy; bSet('circle', { th: R.th, r: R.d }); break; }
        if (dst(B.x, B.y, R.px, R.py) < .8) { hit(S); break; }     // 不到一格：扑中
        if (B.t > 1.5) bSet('circle', { th: R.th, r: R.d });
        break;
      }
      case 'retreat': {
        let gx = R.px + Math.cos(B.rth) * 7.5, gy = R.py + Math.sin(B.rth) * 7.5;
        if (night) [gx, gy] = pushOut(gx, gy);
        moved = bStep(gx, gy, 6.5, dt); bFaceP();
        if (moved < .001 || B.t > 2.2) bSet('cool');
        break;
      }
      case 'cool': {
        B.cool -= dt;
        if (night) moved = prowlMove(S, dt, true);
        else { const a = Math.atan2(B.y - R.py, B.x - R.px) + dt * .75, rr = Math.max(6, Math.min(8, R.d)); moved = bStep(R.px + Math.cos(a) * rr, R.py + Math.sin(a) * rr, 4, dt); bFaceP(); }
        if (B.mode === 'cool' && B.cool <= 0) { if (night && plLit) bSet('prowl'); else { bSet('stalk'); if (night) stalkCue(S); } }
        break;
      }
      case 'prowl': {   // 你站在火光里：它在光圈外面转；你盯住它，它一样会退
        if (faced) { B.fear += dt; B.growl -= dt; if (B.growl <= 0) { B.growl = 1.2; SND.growl(S, .06); } if (B.fear >= P.fear) { repel(S, false); break; } }
        else B.fear = Math.max(0, B.fear - dt * .5);
        moved = prowlMove(S, dt, false);
        if (B.mode === 'prowl' && !plLit) { bSet('stalk'); stalkCue(S); }
        break;
      }
      case 'flee': {
        moved = bStep(B.flee[0], B.flee[1], 7, dt);
        if (moved < .001) { B.mode = 'off'; e.hidden = true; }
        break;
      }
    }
    const m = curMap(); B.x = clamp(B.x, .3, m.w - 1.3); B.y = clamp(B.y, .3, m.h - 1.3);
    if (B.mode !== 'off') bSync(e, moved);
    dogBark(S, R, dt);
  }
  function prowlMove(S, dt, slow) {
    const f = S.f, best = f.fuel[1] < f.fuel[0] ? 1 : 0;
    let gx, gy;
    if (f.fuel[best] <= 0) [gx, gy] = GAP[best];
    else { const fr = FIRES[best], r = fireR(best) + .9, a = AP_ANG[best] + Math.sin(W.t * .5) * .45; gx = fr[1] + Math.cos(a) * r; gy = fr[2] + Math.sin(a) * r; }
    const mv = bStep(gx, gy, slow ? 1.6 : 2.6, dt);
    [B.x, B.y] = pushOut(B.x, B.y);
    if (f.fuel[best] <= 0 && dst(B.x, B.y, GAP[best][0], GAP[best][1]) < .7) breach(S, best);
    return mv;
  }
  function stalkCue(S) {
    const R = rel();
    if (!S.f.belled) { S.f.belled = true; SND.cbell(S); S.toast('钟楼上，神父敲响了钟——它来了'); return; }
    if (W.t - CUE_T > 6) { CUE_T = W.t; S.toast('罗兰冲着' + compass(R.th) + '边低吼'); }
  }
  function dogBark(S, R, dt) {
    if (!['stalk', 'circle', 'lunge'].includes(B.mode) || R.d > 7) return;
    const d = S.ent('dog'); if (!d || d.hidden || !curMap().ents.includes(d)) return;
    B.bark -= dt; if (B.bark > 0) return; B.bark = 1.05;
    SND.bark(S, .08); S.bubble('dog', '!', 600);
    const dx = B.x - d.px / TS, dy = B.y - d.py / TS; if (!d.mv) d.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
  }
  function repel(S, stab) {
    const R = rel(), f = S.f; B.rth = R.th; SND.yelp(S, .07);
    if (f.ph === 'noon') {
      f.rep = (f.rep || 0) + 1;
      if (f.rep >= 3 || stab) { B.mode = 'hold'; S.run(noonWin); return; }
      S.toast(f.rep === 1 ? '它退开了……还会再来（1/3）' : '又退开了。再挡住它一次！（2/3）');
      B.cool = 1.6; bSet('retreat'); return;
    }
    B.cool = stab ? 9 : 4.5; bSet('retreat');
  }
  function hit(S) { const f = S.f; B.mode = 'hold'; f.hits = (f.hits || 0) + 1; S.run(f.hits === 1 ? dogSave : mauled); }
  function breach(S, i) { if (B.mode === 'hold') return; const f = S.f; B.mode = 'hold'; f.breach = (f.breach || 0) + 1; S.run(f.breach === 1 ? (S => breachWarn(S, i)) : breachDie); }

  /* 扎它一矛：它在一步之内、你正对着它 */
  async function stab(S) {
    const f = S.f, R = rel();
    if (!['circle', 'lunge', 'stalk'].includes(B.mode) || R.d > 1.7 || R.off > .98) return S.narr(f.ph === 'night' ? '黑暗里那两点光。……先别动。' : '它就在那儿。别把后背给它。');
    S.sfx('cut'); S.shake(300, 2); SND.yelp(S, .12);
    f.stabbed = true;
    await S.narr(S.once('stab1') ? '你咬着牙，把矛往前一送——\n刺刀扎进了它的肩膀，又被它一扭身挣了出来。它嚎了一声，掉头就蹿。' : '矛尖又扎中了它。它嚎叫着蹿开了。');
    repel(S, true);
  }

  /* ---------- 罗兰救你一次（第一次犯规 = 警告） ---------- */
  async function dogSave(S) {
    const f = S.f, d = S.ent('dog'), p = S.pl;
    SND.snarl(S, .16); S.shake(400, 3); S.fx('red');
    if (d && curMap().ents.includes(d)) { d.mv = null; d.px = Math.round((B.x * TS + p.px) / 2); d.py = Math.round((B.y * TS + p.py) / 2); d.x = ex_(d); d.y = ey_(d); }
    await S.narr('后背上一阵腥风——\n一团白影从你身边扑了过去。是罗兰！');
    SND.yelp(S, .1); S.sfx('thud');
    await S.narr('项圈上的铁刺扎进了那东西的嘴。它嚎了一声，甩开罗兰，' + (f.ph === 'night' ? '缩回了黑暗里。' : '退进了草丛里。'));
    await S.think('（不能背对它。它一直在等这个。）');
    S.toast('再背对它一次，罗兰就护不住你了');
    B.rth = rel().th; B.cool = f.ph === 'night' ? 5 : 2; bSet('retreat');
  }
  async function mauled(S) {
    const f = S.f, night = f.ph === 'night';
    if (night) { NIGHT_DIED++; NIGHT_LEFT = S.timerLeft; } else NOON_DIED++;
    B.mode = 'hold'; S.clearTimer();
    await S.scare('face', { face: 'beast', dur: 1.1 });
    await S.die(night ? '你把后背留给了黑暗。\n火光照不到的地方，有什么东西，一下子扑了过来。' : '你只想回头看一眼艾蒂安还在不在石头上。\n就那么一转身——\n身后的草，被什么东西一下子压倒了一大片。', night ? '火光之外' : '你把后背给了它');
  }

  /* ================= 屋里（早上） ================= */
  async function houseEnter(S, first) {
    const f = S.f; trailReset();
    if (first) {
      await S.narr('天刚亮。炉膛里的火噼啪响，屋里一股烟和羊奶的味道。');
      S.face('motherH', 'pl');
      await S.say('妈妈', ['阿涅丝，醒了就过来。', '今天得把羊赶到西边的高地上去。圈里的干草，撑不过这个礼拜了。']);
      S.bubble('eti', '!', 900);
      await S.say('艾蒂安', '我也去！我也去！');
      await S.say('妈妈', ['……带上他吧。两个人总比一个人强。罗兰也跟着你们。', '拿上你爸的棍子，让铁匠给你绑上刀子。不许离开羊群，不许靠近林子边。', '太阳偏西就回来。听见没有？']);
      S.goal('拿上墙角爸爸的棍子');
    }
  }
  async function motherTalk(S) {
    const f = S.f; S.face('motherH', 'pl');
    if (!S.has('stick') && !S.has('pike')) return S.say('妈妈', '棍子在墙角。去吧，早去早回。');
    return S.say('妈妈', ['记住了：不许离开羊群，不许靠近林子边。', '……你爸要是在家就好了。', '路口的圣母像，路过的时候画个十字。'][(f._mt = ((f._mt ?? -1) + 1) % 3)]);
  }
  async function etiTalk(S) {
    const f = S.f; S.face('eti', 'pl');
    if (f.ph === 'morn') return S.say('艾蒂安', W.mapId === 'house' ? ['姐，那个怪兽真的有牛犊子那么大吗？', '我不怕。我有这个——', '（他从兜里掏出一块尖尖的石头，得意地晃了晃。）'] : ['姐，我们也去找铁匠要一把刀吧！', '……我就要一把小的。'][0]);
    if (f.ph === 'past') return S.say('艾蒂安', ['姐，你看，白额又去啃人家地边上的草了。', '……姐。刚才林子边上，是不是有东西在动？'][(f._et = ((f._et ?? -1) + 1) % 2)]);
    if (f.ph === 'noon') return S.say('艾蒂安', '姐……', { style: 'whisper' });
    if (f.ph === 'gather' || f.ph === 'home') { const n = SHEEP.filter(id => (f.fol || []).includes(id)).length; return S.say('艾蒂安', n >= 6 ? '六只！一只都不少！姐，快回家吧。' : '我帮你数着呢——现在是 ' + n + ' 只。'); }
    if (f.ph === 'dusk' || f.ph === 'puzzle') return S.say('艾蒂安', f.stabbed ? '妈！姐拿矛扎它了！真的扎中了！' : '妈，姐一点都没跑。她就那么站着，盯着它。');
    return S.say('艾蒂安', '……姐，你也小心。');
  }
  async function dogTalk(S) {
    const f = S.f;
    if (f.ph === 'night') return S.narr('罗兰贴着你的腿，喉咙里一直在低低地响。');
    if (f.hits) return S.narr('罗兰的嘴边破了一道口子，它却一直摇着尾巴。\n你蹲下来抱了抱它。');
    return S.narr('罗兰，一条大白狗，比艾蒂安还重。\n脖子上套着铁匠打的项圈，一圈铁刺朝外——山里的狗都戴这个，防狼咬喉咙。');
  }
  async function stickUse(S) {
    S.give('stick'); S.hide('stick');
    await S.narr('爸爸的放羊棍，白蜡木的，比你还高。\n手握的地方被磨得发亮。');
    S.goal('去铁匠铺（村子东头），给棍子绑上刀');
  }
  async function houseExit(S) {
    const f = S.f;
    if (!S.has('stick') && !S.has('pike')) { S.pos(5, 6, 3); return S.think('（爸爸的棍子还在墙角。）'); }
    if (f.ph === 'morn') f.fol = ['dog', 'eti'];
    await goWith(S, 'village', 6, 7, 0);
  }

  /* ================= 村子 ================= */
  async function villageEnter(S, first) {
    const f = S.f; trailReset();
    if (f.ph === 'morn' && first) {
      await S.narr('村子不大，十来户人家，挤在小教堂周围。\n灰色的石板屋顶上冒着烟。山坡背阴的地方，还剩着一块一块的残雪。');
      if (!S.has('pike')) S.goal('去铁匠铺（村子东头），给棍子绑上刀');
    }
    if (f.ph === 'home') return duskEnter(S);
  }
  async function houseDoor(S) {
    const f = S.f;
    if (f.ph !== 'morn') return S.narr('屋里没点灯。妈妈在羊圈那边。');
    S.sfx('open'); await goWith(S, 'house', 5, 7, 3);
  }
  async function smithTalk(S) {
    const f = S.f; S.face('smith', 'pl');
    if (f.ph === 'morn' && S.has('stick') && !S.has('pike')) {
      await S.say('铁匠', '棍子给我。');
      S.sfx('cut');
      await S.narr('他从墙上摘下一把旧刺刀，用泡软的牛皮条，在棍子头上一圈一圈地缠紧，又拿锤子砸了两下铁箍。');
      S.take('stick'); S.give('pike'); S.wear('@mePike');
      await S.say('铁匠', ['主教老爷说了，放羊的孩子都得带一根这个。', '一月里，北边七个放牛的娃娃，最大的才十二岁，就是靠这玩意儿把它捅跑的。国王还赏了他们钱。', '记住：碰上了别跑。跑了，它就扑你的后背。矛尖冲着它，盯着它，喊人。']);
      S.goal('打开羊圈，把羊放出来（村子南边）');
      return;
    }
    if (f.ph === 'morn') return S.say('铁匠', ['巴蒂斯特老爹在羊圈那儿等你呢。', '这刺刀是我爹从前打仗带回来的。……没想到最后拿来捅野兽。'][(f._sm = ((f._sm ?? -1) + 1) % 2)]);
    return S.say('铁匠', '东边交给我。我的炉子一夜都不会灭。');
  }
  async function cureTalk(S) {
    const f = S.f; S.face('cure', 'pl');
    if (f.ph !== 'morn') return S.say('神父', '天主与你同在，孩子。');
    if (!f.cureMet) {
      f.cureMet = true;
      await S.say('神父', ['阿涅丝。带弟弟去放羊？……愿天主保佑你们。', '主教大人从芒德寄来了训谕，礼拜天我念过了。我抄了一段，你拿回去让你妈妈晚上再念给你们听。']);
      await S.note('mandement');
      await S.say('神父', ['……主教大人说，这是天主降下的灾祸，因为我们的罪。', '可我在这个教区待了二十年。那些没回家的孩子，我每一个都认识。'], { style: 'whisper' });
      await S.say('神父', '去给路口的圣母点一支蜡烛吧。不为别的——求她看着你们回来。');
      S.give('candle');
      return;
    }
    return S.say('神父', S.f.candle ? '圣母会看着你们的。去吧。' : ['蜡烛点了吗？路口的圣母像，就在教堂东边。', '钟楼上那只铁公鸡，是我小时候就在的。风再大，它都站得稳稳的。'][(f._cu = ((f._cu ?? -1) + 1) % 2)]);
  }
  async function churchUse(S) {
    const f = S.f;
    await S.narr('石头砌的小教堂。钟楼尖顶上立着一只铁公鸡，尾巴像一面小帆，被风推着转。\n' + (f.ph === 'night' ? '天太黑，看不清它朝哪边。' : '此刻，鸡头正冲着东北。'));
    if (f.ph === 'puzzle' && S.once('vaneT')) await S.think('（老爹的口诀里，头一句就是说这只铁公鸡的。）');
  }
  async function churchDoor(S) { await S.narr('教堂的门半掩着。里面黑洞洞的，只有祭坛上一盏长明灯。\n这几个月，来做弥撒的人一礼拜比一礼拜多。'); }
  async function madonnaUse(S, e) {
    const f = S.f;
    if (f.candle) return S.narr('小小的火苗在风里一歪一歪的，一直没有灭。\n圣母披着褪了色的蓝斗篷，低头看着路口。');
    await S.narr('路口的石柱上有个小龛，里面站着一尊巴掌大的圣母像，披着褪了色的蓝斗篷。\n龛底下摆着几截烧剩的蜡烛头，还有一束干了的野花。');
    if (!S.has('candle')) return;
    const r = await S.ask('点上神父给的蜡烛吗？', ['点上', '先不了']);
    if (r) return;
    S.take('candle'); f.candle = true; e.lit = true; e.light = { r: 1.6, col: 'rgba(255,200,120,.18)', flick: true }; S.sfx('match');
    await S.narr('你把蜡烛点上，护着火苗插进龛里。\n你替爸爸、妈妈、艾蒂安各念了一遍圣母经，又替罗兰念了半遍。');
  }
  async function sgtTalk(S) {
    const f = S.f; S.face('sgt', 'pl');
    if (!f.sgtMet) {
      f.sgtMet = true;
      await S.narr('一个穿蓝军服的龙骑兵中士，正往马鞍袋里塞东西。');
      await S.say('中士', ['小姑娘，赶羊去？去吧去吧。那东西早被我们打怕了。', '……就是一头狼。大一点的狼。我们打死过好几头了。']);
      await S.narr('井边的老太太啐了一口：「打死的都是狼。它还在。」');
      await S.say('中士', ['哼。反正上头把我们撤了，说国王另派了人——诺曼底来的猎狼人，听说明早就到你们这一带。', '我们在这山里耗了一冬天。还扮成放羊的女人，穿着裙子在雪地里蹲着等它——它连看都不来看一眼！', '拿着，城里的报纸。上面画着它呢，画得跟真的一样——哈！']);
      await S.note('gazette');
      return;
    }
    return S.say('中士', ['我的马都比你们的山路懂事。', '猎狼人？哼，一辈子打过上千头狼又怎样。这头不是普通的……我是说，这头特别狡猾。'][(f._sg = ((f._sg ?? -1) + 1) % 2)]);
  }
  async function oldwTalk(S) {
    S.face('oldw', 'pl');
    await S.say('井边的老太太', ['龙骑兵？他们在山里放了一冬天的枪，打死的全是狼。', '那东西不是狼。狼见了羊会不吃？', '……我年轻那会儿，老人们管这种东西叫「卢加鲁」。白天是人，夜里披上狼皮。'], {});
  }
  async function penGate(S) {
    const f = S.f, g = S.ent('pgate');
    if (f.ph === 'morn') {
      if (!S.has('pike')) { S.face('bapt', 'pl'); return S.say('巴蒂斯特', '空着手，别把羊赶出去。先去铁匠那儿，把你爸的棍子绑上刀。'); }
      if (f.out) return S.narr('羊圈空了。地上一层踩烂的干草。');
      S.face('bapt', 'pl');
      await S.say('巴蒂斯特', ['阿涅丝。高地上的草冒尖了，是该去了。', '我这条老腿走不动那么远的山路了。……这个你拿着。神父照我说的写下来的。']);
      await S.note('saying');
      await S.say('巴蒂斯特', '记牢了。尤其是最后几句。');
      return openPen(S);
    }
    if (f.ph === 'dusk') return penIn(S);
    if (f.ph === 'night') return S.narr('栅门上了闩。羊挤在圈里，一声不吭。');
    return S.narr(g.open ? '羊圈的门开着。' : '羊圈的门关得严严实实。');
  }
  async function openPen(S) {
    const f = S.f, g = S.ent('pgate');
    S.sfx('open'); g.open = true; g.solid = false; f.out = true;
    SND.sbell(S, .06); SND.baa(S, .05, .2);
    await S.narr('你拔开门闩。头羊白额脖子上的铃铛「叮」地一响，六只羊挤挤挨挨地跟了出来。');
    S.pos(14, 13, 0);
    const line = [[14, 13], [14, 14], [14, 15], [14, 16], [14, 17], [13, 17], [15, 17], [13, 18], [15, 18]];
    TRAIL = line.concat(Array(16 - line.length).fill([14, 18]));
    f.fol = ['dog', 'eti'].concat(SHEEP);
    f.fol.forEach((id, i) => { const e = S.ent(id); if (e) { S.place(id, line[i + 1][0], line[i + 1][1]); e.solid = false; } });
    S.goal('把羊赶到西边的高地去（村子西头的路）');
  }
  async function westExit(S) {
    const f = S.f;
    if (f.ph === 'morn' && !f.out) { S.pos(1, W.pl.y, 2); return S.think(S.has('pike') ? '（羊还关在圈里呢。）' : '（空着手可不能上山。先去铁匠铺。）'); }
    if (f.ph !== 'morn') { S.pos(1, W.pl.y, 2); return S.think('（天黑了，哪儿也别去。）'); }
    await goWith(S, 'pasture', 38, W.pl.y, 1);
  }

  /* ================= 高地 ================= */
  const GRAZE = { sh1: [24, 11], sh2: [21, 12], sh3: [26, 15], sh4: [19, 16], sh5: [28, 12], sh6: [22, 17] };
  const SCATTER = { sh2: [6, 8], sh3: [35, 6], sh4: [9, 21], sh5: [35, 20], sh6: [14, 13] };
  async function pastureEnter(S, first) {
    const f = S.f; trailReset();
    if (f.ph === 'morn') {
      f.ph = 'past'; f.pastT = 0;
      await S.narr('高地上风很大。枯黄的草底下钻出了一点绿，石头缝里卡着残雪。\n北边，是黑压压的松林。');
      await S.fade(1, 300);
      f.fol = ['dog'];
      for (const id of SHEEP) { const e = S.ent(id); S.place(id, GRAZE[id][0], GRAZE[id][1], (Math.random() * 3) | 0); e.solid = true; }
      S.place('eti', 23, 14, 0); S.place('dog', 37, 10, 1);
      await S.fade(0, 300);
      await S.narr('羊群一散开，就低下头啃起了草。艾蒂安跑到那块大石头底下坐着，拿小石子打水漂。');
      S.goal('看好羊。顺便四处看看');
      return;
    }
    if (f.wait) {   // 从林子里出来：等在林子边的狗、弟弟和羊重新跟上
      f.fol = f.wait.concat((f.fol || []).filter(id => !f.wait.includes(id))); f.wait = null;
      gatherGoal(S);
    }
  }
  const clueN = f => Object.keys(f.cl || {}).length;
  const CLUE = { print: '比狼大得多的爪印', hair: '红褐色夹着黑的硬毛', cross: '它不碰牲口，只找人', boot: '爪印旁边的靴子印', chain: '窝棚门口带毛的铁链' };
  function clue(S, k) { const f = S.f; f.cl = f.cl || {}; if (f.cl[k]) return false; f.cl[k] = true; S.toast('记在心里：' + CLUE[k]); return true; }
  async function printUse(S) {
    await S.narr('一片没化的残雪上，印着一串爪印。\n每一个都比罗兰的大出一倍。四个趾头，爪尖扎得很深。');
    if (clue(S, 'print')) await S.think(['（你把棍子横过来比了比：两个爪印之间，比你迈一大步还远。）', '（狼的爪印你见过。没有这么大的。）']);
  }
  async function gorseUse(S) {
    await S.narr('一丛金雀花，刚开出几朵黄花。\n刺上挂着一撮硬毛——红褐色的，里面夹着几根黑的，粗得像猪鬃。');
    if (clue(S, 'hair')) await S.think('（告示上说，它背上有一道黑。）');
  }
  async function crossUse(S) {
    await S.narr('草里插着一个小十字架，两根树枝用麻绳绑的，底下压着几块石头。\n去年秋天，邻村一个放牛的姑娘，就是在这儿没能回家。');
    if (clue(S, 'cross')) { await S.narr('大人们说，她的牛一头也没少。\n那些牛围成了一圈，牛角朝外，一直站到天黑。'); await S.think('（它不要牛，也不要羊。它要的是人。）'); }
    else await S.narr('你在十字架前画了个十字。');
  }
  async function forestEdge(S) {
    const f = S.f;
    if (f.ph === 'past' || f.ph === 'noon') { S.pos(W.pl.x, 4, 0); return S.think('（妈妈说过，不许靠近林子边。）'); }
    if (f.ph !== 'gather' || f.foundW) { S.pos(W.pl.x, 4, 0); return S.think('（不能再进去了。天要黑了。）'); }
    S.pos(W.pl.x, 4, 3);
    await S.narr('罗兰在林子边上站住了，脖子上的毛全竖了起来。怎么叫它，它都不肯往前走一步。');
    await S.say('艾蒂安', '姐，我……我不进去。', { style: 'whisper' });
    const r = await S.ask('白额的铃铛声，就在林子里头。', ['一个人进去找（很快就出来）', '先别去']);
    if (r) return;
    await S.say('你', '你和罗兰看着羊，就在这儿等我。哪儿也别去。');
    f.wait = (f.fol || []).slice(); f.fol = [];
    await S.go('forest', 12, 16, 3);
  }
  async function eastExit(S) {
    const f = S.f;
    if (f.ph === 'past' || f.ph === 'noon') { S.pos(37, W.pl.y, 1); return S.think('（太阳还高着呢，羊才刚吃上草。）'); }
    if (f.ph === 'gather') { const n = SHEEP.filter(id => (f.fol || []).includes(id)).length; S.pos(37, W.pl.y, 1); return S.think('（羊还没找齐，才 ' + n + ' 只。）'); }
    await goWith(S, 'village', 1, W.pl.y, 2);
  }
  function gatherGoal(S) {
    const f = S.f, n = SHEEP.filter(id => (f.fol || []).includes(id)).length;
    if (n >= 6) { f.ph = 'home'; S.dark(.32, 'pasture'); S.goal('天快黑了，把羊赶回村里的羊圈（往东）'); return; }
    if (n === 5 && !f.foundW) return S.goal('头羊白额不见了——铃铛声从北边林子里来');
    S.goal('把跑散的羊找回来（' + n + '/6）');
  }
  async function sheepUse(S, e) {
    const f = S.f, id = e.id, nm = SNAME[id], fol = f.fol || [];
    if (id === 'sh1' && W.mapId === 'forest' && !f.foundW) return freeWhite(S, e);
    if (f.ph === 'gather' && W.mapId === 'pasture' && !fol.includes(id)) {
      fol.push(id); f.fol = fol; e.solid = false; SND.baa(S, .06);
      S.toast('「' + nm + '」跟上来了');
      return gatherGoal(S);
    }
    if (fol.includes(id)) { SND.baa(S, .04); return S.narr('「' + nm + '」咩了一声，跟得紧紧的。'); }
    const T = { sh1: '头羊白额，额头上一块白，脖子上挂着铃铛。它走到哪儿，别的羊就跟到哪儿。', sh2: '卷毛的毛卷得像一团乱麻，剪毛的时候最费事。', sh3: '黑脸。整张脸黑得像炭，眼睛却是黄的。', sh4: '瘸腿小时候被石头砸过，走起来一颠一颠的，可从来不掉队。', sh5: '胖墩又在吃。它一天到晚都在吃。', sh6: '小不点是去年冬天才生的，跟妈妈屋里那只小羊羔是一窝的。' };
    if (f.ph === 'dusk' || f.ph === 'puzzle' || f.ph === 'night') return S.narr('「' + nm + '」挤在羊群当中，耳朵一抖一抖的。');
    SND.baa(S, .04);
    return S.narr(T[id]);
  }
  /* ---------- 正午：它从林子里出来了 ---------- */
  async function noonEvent(S) {
    const f = S.f; f.ph = 'noon0';
    S.amb('none'); await S.wait(400);
    SND.sbell(S, .05);
    await S.narr('羊群忽然一起抬起了头。\n连胖墩都不嚼了。');
    SND.growl(S, .09); S.bubble('dog', '!', 1500);
    await S.narr('罗兰站了起来，冲着北边，喉咙里呼噜呼噜地响。');
    S.focus(19, 6);
    const e = S.ent('beastP'); S.place('beastP', 19, 2, 0); e.alpha = 0; await S.alpha('beastP', 1, 700);
    await S.walk('beastP', [19, 6], 2.2); B.x = 19; B.y = 6; B.dir = 0;
    S.sfx('heart');
    await S.narr('松林边上，走出来一个东西。\n比狼大。大得多。一身红褐色的毛，背上一道黑，尾巴又长又粗，拖在地上。');
    await S.narr('羊就在它眼前。它连看都没看一眼。\n它在看那块大石头——看石头底下的艾蒂安。');
    S.focus(null);
    await S.say('你', '艾蒂安！爬到石头上去！快！');
    S.place('eti', 23, 13, 0); S.ent('eti').oy = -10; S.ent('eti').solid = false;
    S.sfx('step');
    await S.think(['（老爹的口诀：碰上了，别跑。别把后背给它。）', '（转过身，冲着它站定，矛尖对着它。）']);
    S.amb('wind');
    S.goal('别背对它！转身面向它，矛尖对着它');
    S.cp('noon');
    startNoon(S);
  }
  function startNoon(S) {
    const f = S.f; f.ph = 'noon'; f.rep = 0; f.hits = 0;
    bSet('stalk'); B.cool = 0; const e = S.ent('beastP'); B.x = ex_(e); B.y = ey_(e); e.hidden = false; e.alpha = 1;
    S.toast('提示：轻点方向键能原地转身。它在你正前方，它就不敢扑');
  }
  async function noonWin(S) {
    const f = S.f; B.mode = 'hold';
    SND.yelp(S, .08);
    await S.narr(f.stabbed ? '它往后一跳，肩膀上的毛湿了一片。\n它喉咙里呼噜呼噜地响，盯着你看了很久——然后掉头就跑。' : '它往后退了几步，喉咙里呼噜呼噜地响。\n然后，它掉头跑了，几个起落就钻回了松林。');
    B.mode = 'off';
    await S.walk('beastP', [19, 3], 6.5); SND.howl(S, .05);
    await S.alpha('beastP', 0, 400); S.hide('beastP');
    await S.narr('你这才发现，手里的棍子抖得厉害。');
    const eti = S.ent('eti'); eti.oy = 0; S.place('eti', 22, 14, 3);
    await S.say('艾蒂安', ['姐……姐！', '它走了？它真的走了？']);
    await S.narr('羊群早就炸了窝，跑得满山都是。远处，白额的铃铛声，一下一下的，越来越远——是往北边林子里去了。');
    for (const id of SHEEP) { const s = S.ent(id); s.solid = true; if (id === 'sh1') { S.moveTo('sh1', 'forest', 18, 4, 1); s.s.stuck = true; s.x = 18; s.y = 4; } else S.place(id, SCATTER[id][0], SCATTER[id][1]); delete HOME[id]; }
    f.ph = 'gather'; f.fol = ['dog', 'eti']; trailReset();
    gatherGoal(S);
    S.cp('gather');
  }

  /* ================= 林子 ================= */
  async function forestEnter(S, first) {
    const f = S.f; trailReset();
    if (f.ph === 'chase') {
      S.dark(.62);
      await S.narr('林子里还是夜里。\n松针上一行脚印，往深处去了。旁边落着暗色的点子。');
      S.goal('跟着脚印，往林子深处追');
      return;
    }
    if (first) await S.narr('林子里一下子暗了。松针厚厚地铺在地上，踩上去一点声音也没有。\n远远地，有铃铛在响。');
    S.goal(f.foundW ? '带白额回到林子外面（南边）' : '循着铃铛声，找到白额');
  }
  async function bootUse(S) {
    await S.narr('松针被踩乱的地方，那种大爪印又出现了。\n爪印旁边，还有一行靴子印——鞋底钉着铁钉，和爪印朝着同一个方向。');
    if (clue(S, 'boot')) await S.think('（是猎人在追它？……还是，有人跟它走在一起？）');
  }
  async function hutUse(S) {
    const f = S.f;
    await S.narr('烧炭人的窝棚，木头和泥巴糊成一个尖顶。\n里面是空的。炭灰冷透了，至少一个冬天没人来过。' + (f.cl && f.cl.chain ? '' : '\n门口的地上，好像扔着什么东西。'));
  }
  async function chainUse(S) {
    await S.narr('窝棚门口，扔着一截生了锈的铁链，一头连着个大铁环。\n链环里夹着几根红褐色的毛。');
    if (clue(S, 'chain')) await S.think('（也许只是拴过一条狗。……也许不是。）');
  }
  async function freeWhite(S, e) {
    const f = S.f;
    SND.sbell(S, .07); SND.baa(S, .07, .1);
    await S.narr('白额被一丛荆棘缠住了，越挣越紧，铃铛响个不停。\n你用刺刀一根一根地割开荆棘。');
    e.s.stuck = false; f.foundW = true; f.fol = ['sh1']; e.solid = false; trailReset();
    await S.narr('它一脱身，就把脑袋拱进你怀里，咩咩地叫。');
    await S.wait(500);
    SND.growl(S, .06); S.sfx('heart');
    bPlace(21, 8, 1); const b = S.ent('beastF'); b.alpha = 0;
    S.lights([[21 * TS + 3, 8 * TS + 3, .85, .9]]);
    await S.alpha('beastF', .55, 800);
    await S.narr('……荆棘那头的树影里，有两点光。\n不高，离地一两尺。一眨不眨。');
    await S.think(['（别跑。）', '（它在林子里，比在外面更有耐心。）']);
    await S.alpha('beastF', 0, 900); S.hide('beastF'); S.lights(null); B.mode = 'off';
    await S.narr('再看的时候，那里只有松树。');
    S.goal('带白额回到林子外面（南边）');
  }
  async function forestOut(S) {
    const f = S.f;
    if (f.ph === 'chase') { S.pos(W.pl.x, 16, 3); return S.think('（脚印往里去了。）'); }
    await goWith(S, 'pasture', W.pl.x === 12 ? 19 : 20, 4, 0);
  }
  async function chaseEnd(S) {
    await S.narr('脚印在空地当中断了。\n四面都是松树。没有风。连鸟都不叫。');
    await S.wait(800); S.sfx('step'); await S.wait(600);
    await S.narr('你身后，松针被踩响了一下。');
    await S.scare('face', { face: 'beast', dur: 1.2 });
    await S.end({ bad: true, id: 'forest', title: '一个人进了林子', text: '那天上午，猎人们在林子边上，找到了一根绑着刺刀的白蜡木棍子。\n\n后来，村里的老人这样教孩子：\n碰上了它，别跑。\n也别追。\n\n——坏结局「一个人进了林子」' });
  }

  /* ================= 黄昏：回村、对证、推理 ================= */
  async function duskEnter(S) {
    const f = S.f; f.ph = 'dusk';
    S.dark(.48);
    ['mother', 'bapt', 'cure', 'smith'].forEach(id => S.show(id));
    S.place('mother', 16, 15, 1); S.place('bapt', 12, 15, 2); S.place('cure', 13, 13, 0); S.place('smith', 16, 13, 0);
    S.hide('sgt'); S.hide('oldw');
    await S.narr('回到村子的时候，太阳已经压在西边的山梁上了。\n羊圈门口站着好几个人。');
    S.goal('把羊赶进羊圈（羊圈北边的门）');
  }
  async function penIn(S) {
    const f = S.f, g = S.ent('pgate');
    await S.fade(1, 400);
    const spots = [[12, 18], [14, 19], [16, 18], [12, 20], [14, 21], [16, 20]];
    SHEEP.forEach((id, i) => { const e = S.ent(id); S.place(id, spots[i][0], spots[i][1]); e.solid = true; delete HOME[id]; });
    g.open = false; g.solid = true;
    f.fol = ['dog']; S.place('eti', 17, 15, 1); S.pos(14, 15, 3);
    await S.fade(0, 400);
    S.sfx('close'); SND.baa(S, .05);
    await S.narr('六只羊挤进了圈，门闩「咔哒」一声落下。');
    S.face('mother', 'pl');
    await S.narr('妈妈扑过来，一把搂住你们两个，搂得那么紧，你的矛都快拿不住了。');
    await S.say('艾蒂安', f.stabbed ? '妈！它出来了！比牛犊子还大！姐拿矛扎它了，扎中了！' : '妈！它出来了！比牛犊子还大！姐一点都没跑，就那么盯着它，它就跑了！');
    S.face('bapt', 'pl');
    const L = Object.keys(f.cl || {}).map(k => CLUE[k]);
    await S.narr('你把这一天看见的，一样一样说了出来' + (L.length ? '：\n' + L.join('；') + '。' : '。'));
    const r = await S.ask('「依你看，那是个什么东西？」', ['一头狼——特别大的狼', '不是狼。是别的什么野兽', '是人……是人弄出来的', '我说不清'], '神父');
    f.verdict = r;
    if (r === 0) { await S.say('铁匠', '我就说嘛，大一点的狼也是狼！'); await S.say('巴蒂斯特', '狼会放着一圈羊不吃，专找放羊的？'); }
    if (r === 1) { await S.say('铁匠', '报纸上说是鬣狗。……鬣狗是个啥？'); await S.say('神父', '非洲的野兽。谁也没见过。'); }
    if (r === 2) { await S.say('巴蒂斯特', '……我早说了。是人。是夜里披上狼皮的人。'); await S.say('神父', '巴蒂斯特！别当着孩子说这个。'); }
    if (r === 3) await S.say('神父', '说不清，就照实说说不清。明天猎人来了，你就这么告诉他们。');
    await S.say('巴蒂斯特', ['不管它是个啥——它记住你的味道了，今晚准来。猎狼人明早到，熬过今晚就行。', '可它从哪边来，得先弄清楚。柴火就那么点，不能满村子都点上。']);
    f.ph = 'puzzle';
    S.goal('弄清它今晚从哪边来，告诉巴蒂斯特老爹');
    if (S.coop) S.toast('联机：一个人翻笔记念口诀，一个人去看风向');
    S.cp('puzzle');
  }
  async function swTrack(S) {
    await S.narr('羊圈西南角，矮墙塌了一段。\n墙外的残雪上，有一串很大的爪印——不是今天的，边上已经化开了。');
    if (S.f.ph === 'puzzle') await S.think('（它绕着羊圈走过一圈……在这个角上，停了很久。）');
  }
  const DIRK = ['西北', '北', '东北', '西', '羊圈', '东', '西南', '南', '东南'];
  async function baptTalk(S) {
    const f = S.f; S.face('bapt', 'pl');
    if (f.ph === 'morn') return S.say('巴蒂斯特', S.has('pike') ? '来，开圈吧。' : '空着手，别把羊赶出去。先去铁匠那儿。');
    if (f.ph === 'night') return S.say('巴蒂斯特', ['火！盯着火！', '柴在西北边草垛那儿。一次抱两根。'][(f._bn = ((f._bn ?? -1) + 1) % 2)]);
    if (f.ph !== 'puzzle') return S.say('巴蒂斯特', '……');
    const r = await S.ask('「想好了？它今晚从哪边来？」', ['想好了，说给他听', '再看一遍口诀', '还没想好'], '巴蒂斯特');
    if (r === 1) return S.note('saying');
    if (r === 2) return S.say('巴蒂斯特', (f.wrongP || 0) ? '想想我口诀里的头两句。' : '去看看风。我的口诀里都写着呢。');
    const v = await S.keypad('先按：风从哪边来\n再按：它会从哪边摸过来\n（点按方向；方向键选、回车确认）', DIRK, 2, { sep: '→', alias: { 7: '西北', 8: '北', 9: '东北', 4: '西', 5: '羊圈', 6: '东', 1: '西南', 2: '南', 3: '东南' } });
    if (v == null) return;
    const [w, b] = v.split('→');
    if (w === '东北' && b === '西南') return puzzleSolved(S, false);
    const n = f.wrongP = (f.wrongP || 0) + 1;
    f.woodLost = Math.min(3, (f.woodLost || 0) + 1);
    S.sfx('bad');
    let why;
    if (w !== '东北' && b === '西南') why = '……它从哪边来，你倒说对了。可风向不对——你是猜的吧？';
    else if (w !== '东北') why = '风不是从那边来的。';
    else if (b === '东北') why = '从上风口来？那羊老远就闻见它了。它可没那么傻。';
    else if (b === '羊圈') why = '从羊圈当中？它又不是从地底下钻出来的。';
    else why = '风向你看对了。可它从哪边摸过来？';
    const tip = n === 1 ? (w !== '东北' ? '抬头看看钟楼上的铁公鸡，再念念我口诀的头一句。' : '想想口诀第二句。') :
      n === 2 ? '头一句说铁公鸡：鸡头冲哪边，风就从哪边来。第二句说下风口：风把羊的味道往哪边吹，它就蹲在哪边。' :
      n === 3 ? '去羊圈西南角的矮墙外头看看。昨天夜里，它已经来踩过点了。' : null;
    if (n >= 4) { await S.say('巴蒂斯特', ['……风从东北来，它从西南来。', '记住了，下回得自己想。']); return puzzleSolved(S, true); }
    await S.say('巴蒂斯特', [why, tip]);
    await S.narr('天又暗了一截。铁匠嘟囔着，少劈了一捆柴。（今晚的柴少了一根）');
  }
  async function puzzleSolved(S, byHint) {
    const f = S.f; f.ph = 'prep';
    if (!byHint) await S.say('巴蒂斯特', ['对喽。风从东北山口刮下来，羊身上的味道全往西南飘。', '它就蹲在下风口，闻着味儿摸过来。']);
    await S.say('巴蒂斯特', '西南角那段塌了的矮墙，西边那扇栅门——这两处，各点一堆火。');
    await S.fade(1, 400);
    FIRES.forEach(([id]) => S.show(id));
    f.fuel = [100, 100]; fireVis(S);
    S.show('woodpile'); S.ent('woodpile').num = woodMax(S);
    S.dark(.7); S.amb('wind');
    S.pos(9, 21, 1);
    await S.fade(0, 400);
    SND.crackle(S, .05);
    await S.narr('铁匠回铺子把炉子烧旺，守东边；神父上了钟楼：「看见它，我就敲钟。」\n妈妈带艾蒂安进了窝棚。临走前，她把你的头巾往下拉了拉，系紧了。');
    await S.say('巴蒂斯特', ['柴码在西北边的草垛旁边，一次抱两根。火不能灭——火一灭，它就敢往圈里钻。', '离了火光，它会贴上来。记住口诀：转过身，盯着它。']);
    ['mother', 'eti', 'cure', 'smith'].forEach(id => S.hide(id));
    S.place('bapt', BAPT_N[0], BAPT_N[1], 0);
    S.ent('cabane').lit = true;
    await S.fade(1, 500);
    await S.card('夜里', '', '月亮被云遮住了。\n风还是从东北山口刮下来，冷得刺骨。\n\n火堆噼啪地响。羊挤成一团。\n离天亮，还有很久。');
    S.dark(.88); S.plr(1.7);
    await S.fade(0, 500);
    S.goal('守住两堆火，熬到天亮（柴在西北边）');
    f.ph = 'night0';
    S.cp('night');
    startNight(S, NIGHT_T);
  }

  /* ================= 守夜 ================= */
  function startNight(S, left) {
    const f = S.f; f.ph = 'night';
    f.fuel = [100, 100]; f.logs = 0; f.wood = woodMax(S); f.hits = 0; f.breach = 0; f.belled = false;
    S.ent('woodpile').num = f.wood; fireVis(S);
    S.dark(.88); S.plr(1.7); S.amb('wind'); S.ent('dog').solid = false;
    f.fol = ['dog'];
    bPlace(3, 26, 2); B.cool = 4; bSet('cool'); S.ent('beastV').alpha = 1;
    BELL_T = 0; CUE_T = 0;
    S.timer(left, '天亮', dawnScene, { during: true });
    if (S.coop) S.toast('联机：一个人搬柴添火，另一个人盯着狗叫和火光');
  }
  function nightTick(S, dt) {
    const f = S.f; if (W.busy || !f.fuel) return;
    for (let i = 0; i < 2; i++) {
      const was = f.fuel[i]; f.fuel[i] = Math.max(0, was - dt * BURN);
      if (was > 30 && f.fuel[i] <= 30) S.toast(FN[i] + '的火弱下去了');
      if (was > 0 && f.fuel[i] <= 0) { S.toast(FN[i] + '的火灭了！羊在叫'); SND.baa(S, .07); SND.baa(S, .05, .3); }
    }
    fireVis(S);
  }
  async function woodUse(S, e) {
    const f = S.f;
    if (f.ph !== 'night') return S.narr('劈好的柴火码得整整齐齐。' + (f.ph === 'morn' ? '\n这是全村凑出来过冬的，剩得不多了。' : ''));
    if ((f.logs || 0) >= 2) return S.toast('抱不下了——先去添火');
    if (f.wood <= 0) return S.toast('柴堆空了');
    const k = Math.min(2 - (f.logs || 0), f.wood); f.wood -= k; f.logs = (f.logs || 0) + k; e.num = f.wood; S.sfx('item');
    S.toast('抱起 ' + k + ' 根柴（柴堆还剩 ' + f.wood + ' 根）');
  }
  async function fireUse(S, e) {
    const f = S.f, i = e.id === 'fireW' ? 0 : 1;
    if (f.ph !== 'night') return S.narr('火堆噼啪地响，烤得脸发烫。');
    if (!f.logs) return S.toast((f.fuel[i] <= 0 ? '火灭了！' : '') + '手里没柴——柴在西北边草垛旁');
    if (f.fuel[i] >= 95) return S.toast('火正旺，先留着柴');
    f.logs--; f.fuel[i] = Math.min(100, f.fuel[i] + LOG); fireVis(S); SND.crackle(S, .05);
    S.toast('添了一根柴（手里还有 ' + f.logs + ' 根）');
  }
  async function breachWarn(S, i) {
    const f = S.f;
    SND.baa(S, .08); SND.baa(S, .07, .25); S.shake(300, 2);
    await S.narr('羊圈里一下子炸了锅！\n羊挤成一团往石墙上撞，咩咩地乱叫。');
    S.place('bapt', FIRES[i][1] + 1, FIRES[i][2] + (i ? -1 : 1), 1);
    await S.say('巴蒂斯特', '滚！滚开！畜生！');
    f.fuel[i] = 40; fireVis(S); SND.crackle(S, .06);
    await S.narr('老爹举着火把冲过来，把火堆重新点着了。\n那东西退回了黑暗里。');
    await S.say('巴蒂斯特', ['丫头！火不能灭！', '我这把老骨头，只能替你救这一回。']);
    S.place('bapt', BAPT_N[0], BAPT_N[1], 0);
    const a = AP_ANG[i]; bPlace(FIRES[i][1] + Math.cos(a) * 7, FIRES[i][2] + Math.sin(a) * 7); B.cool = 5; bSet('cool');
  }
  async function breachDie(S) {
    NIGHT_DIED++; NIGHT_LEFT = S.timerLeft; S.clearTimer(); B.mode = 'hold';
    SND.baa(S, .09); SND.baa(S, .08, .2); SND.baa(S, .07, .45); S.shake(700, 3);
    await S.scare('red', { dur: .8 });
    await S.die('火灭了。\n羊群撞开栅门，像炸开的棉絮，散进了黑夜里。\n天亮以后，你们在山坡上只找回了两只。', '羊圈破了');
  }
  async function dawnScene(S) {
    const f = S.f; B.mode = 'hold'; f.ph = 'dawn0'; S.lights(null);
    await S.wait(300);
    S.dark(.7);
    await S.narr('东边的山梁上，透出了一线灰白。');
    S.dark(.55); SND.horn(S, .06);
    await S.narr('远远地，山谷那头传来一声号角。\n……是猎人。猎人进村了。');
    S.cp('dawn');
    return dawnChoice(S);
  }
  async function dawnChoice(S) {
    const f = S.f; f.ph = 'dawn'; S.dark(.45); S.plr(3); S.lights(null); S.clearTimer();
    const e = S.ent('beastV'); bPlace(4, 25, 2); B.mode = 'hold'; e.alpha = 1;
    S.focus(7, 23);
    await S.narr(f.stabbed ? '晨雾里，它站在西南边的林子边上。\n肩膀上的毛湿了一大片，一条前腿有点拖。' : '晨雾里，它站在西南边的林子边上。\n一身的毛被露水打湿了，颜色更深了。');
    await S.narr('它看着你。看了很久。\n然后转过身，慢慢往林子里走。走得不快——像是在等你跟上去。');
    S.focus(null);
    await S.think(f.stabbed ? '（它受伤了。它走不快。国王的赏金……六千里弗尔。）' : '（它走得那么慢。国王的赏金……六千里弗尔。）');
    const r = await S.ask('它要进林子了。', ['一个人追上去', '站在火边，等猎人来']);
    if (r === 0) return chaseStart(S);
    return goodEnd(S);
  }
  async function chaseStart(S) {
    const f = S.f; f.ph = 'chase';
    await S.narr('你抓起矛，跨过火堆，追了上去。\n身后有人在喊你的名字。罗兰呜呜地叫着，没有跟上来。');
    S.hide('beastV'); f.fol = []; S.plr(null);
    await S.go('forest', 12, 16, 3);
  }
  async function goodEnd(S) {
    const f = S.f;
    await S.narr('你没有动。你站在火边，矛尖冲着林子。\n它在树影边上停了一下，再也没回头。');
    S.hide('beastV'); B.mode = 'off'; S.dark(.3);
    S.place('mother', 19, 19, 0); S.place('eti', 18, 19, 0);
    S.place('hunt1', 14, 10, 0); S.place('hunt2', 15, 10, 0); S.place('hound', 13, 10, 0);
    SND.bark(S, .05);
    await S.walk('hunt1', [14, 14], 4);
    S.place('hunt2', 15, 14, 0); S.place('hound', 13, 14, 0);
    S.face('hunt1', 'pl');
    await S.say('猎人', ['……昨夜是你们守的羊圈？', '林子边上的脚印我们看见了。是它。', '你见过它？说说——它长什么样，怕什么，从哪边来。']);
    const V = ['「是狼。特别大的狼。」', '「不是狼。是别的什么野兽。」', '「是人弄出来的。」', '「我说不清。」'][f.verdict ?? 3];
    await S.narr('你把这两天看见的，一样一样说给他们听。\n说到最后，你说：' + V);
    const hidden = f.candle && clueN(f) >= 4;
    if (hidden) {
      await S.narr('那个上了年纪的猎人一直没插话。听到你说「风从东北来，它从西南来」，他点了点头。');
      await S.say('老猎人', ['丫头，你这双眼睛，比我那几个徒弟都尖。', '……路口那支蜡烛，是你点的？']);
    } else await S.say('猎人', '好。我们进林子。你们回屋去睡一觉吧。');
    if (hidden) return S.end({ id: 'blessed', title: '第二十五夜　完·圣母的蜡烛', text: '那天，猎人们在林子里搜到天黑，没有找到它。\n\n两年后，1767年6月，莫歇山下的一片沼地里，一个本地的老猎人打死了一头红褐色的大野兽。从那以后，山里再也没有人被它找上。\n\n很多年以后，有人在书里写：那个老猎人去朝过博略的圣母，他的子弹是祝过圣的——再往后，又有人说，是银的。\n妈妈听到这种故事，总是摇摇头，然后去路口的圣母像前，点上一支蜡烛。\n\n——第二十五夜　完（隐藏结局「圣母的蜡烛」）' });
    return S.end({ id: 'dawn', title: '第二十五夜　完', text: '那天，猎人们在林子里搜到天黑，没有找到它。\n\n那年夏天，猎狼人走了，国王的火枪手来了；秋天，火枪手打死了一头大狼，做成标本送去了凡尔赛，说事情结束了。\n可到了冬天，山里又有人没能回家。\n\n这些，都是后来的事。\n那一夜，村里谁也没有出事。\n\n——第二十五夜　完' });
  }

  /* ================= 精灵 ================= */
  const FUR = '#8a4620', FUR2 = '#6a3214', DK = '#2a1408', CR = '#d9b88e', EYE = '#f2d24a';
  const SPRITES = {
    beast(g, e, t, R) {
      const st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0;
      if (e.dir === 0) {
        R(-1, 13, 18, 3, 'rgba(0,0,0,.35)');
        R(2, 5, 12, 8, FUR2); R(3, 9 + Math.max(0, st), 3, 6, FUR2); R(10, 9 + Math.max(0, -st), 3, 6, FUR2);
        R(1, -5, 14, 11, FUR); R(-1, -2, 2, 7, FUR2); R(15, -2, 2, 7, FUR2);
        R(7, -6, 2, 6, DK); R(1, -9, 3, 5, FUR2); R(12, -9, 3, 5, FUR2); R(2, -8, 1, 3, DK); R(13, -8, 1, 3, DK);
        R(4, -1, 8, 6, CR); R(6, 0, 4, 2, '#1a0e08');
        R(3, -3, 2, 2, EYE); R(11, -3, 2, 2, EYE); R(3, -3, 1, 1, '#fff8c0'); R(11, -3, 1, 1, '#fff8c0');
        R(5, 3, 6, 2, '#3a0a08'); R(5, 3, 1, 1, '#eee'); R(10, 3, 1, 1, '#eee'); R(5, 6, 6, 4, CR);
        return;
      }
      if (e.dir === 3) {
        R(-1, 13, 18, 3, 'rgba(0,0,0,.35)');
        R(3, 9 + Math.max(0, st), 3, 6, FUR2); R(10, 9 + Math.max(0, -st), 3, 6, FUR2);
        R(2, -1, 12, 12, FUR); R(7, -1, 2, 12, DK); R(6, 9, 4, 7, FUR); R(7, 14, 2, 2, DK);
        R(3, -6, 10, 6, FUR); R(2, -9, 3, 4, FUR2); R(11, -9, 3, 4, FUR2); R(7, -6, 2, 5, DK);
        return;
      }
      const mi = e.dir === 2, Q = (x, y, w, h, c) => R(mi ? 16 - x - w : x, y, w, h, c);
      Q(-5, 13, 26, 3, 'rgba(0,0,0,.35)');
      Q(15, 6, 3, 9 - (st > 0 ? 1 : 0), FUR2); Q(1, 6, 3, 9 - (st < 0 ? 1 : 0), FUR2);
      Q(-1, 0, 21, 9, FUR); Q(0, 7, 18, 2, FUR2); Q(-1, 0, 21, 2, DK); Q(2, -1, 15, 1, DK);
      Q(19, 1, 4, 3, FUR); Q(21, 3, 3, 7, FUR); Q(21, 9, 3, 3, DK);
      Q(4 + st, 8, 3, 7, FUR); Q(17 - st, 8, 3, 7, FUR); Q(4 + st, 14, 3, 1, DK); Q(17 - st, 14, 3, 1, DK);
      Q(-2, 3, 5, 6, CR);
      Q(-7, -5, 9, 8, FUR); Q(-11, -2, 5, 4, FUR); Q(-11, 1, 5, 2, CR); Q(-12, -2, 2, 2, '#140a06'); Q(-10, 2, 4, 1, '#3a0a08'); Q(-9, 2, 1, 1, '#eee');
      Q(-4, -8, 3, 4, FUR2); Q(-1, -7, 2, 3, FUR2); Q(-3, -7, 1, 2, DK);
      Q(-5, -3, 2, 1, EYE); Q(-4, -5, 7, 1, DK);
    },
    sheep(g, e, t, R) {
      const mi = e.dir === 2, Q = (x, y, w, h, c) => R(mi ? 16 - x - w : x, y, w, h, c);
      const W1 = e.col || '#e8e2d2', W2 = shade(W1, -.15), FC = e.dark ? '#151210' : '#2a2420';
      const st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0, bob = !e.fr && Math.sin(t * 1.3 + e.px * .37) > .55 ? 2 : 0;
      Q(1, 13, 14, 2, 'rgba(0,0,0,.3)');
      Q(4 + st, 10, 2, 4, FC); Q(11 - st, 10, 2, 4, FC);
      Q(2, 3, 13, 8, W1); Q(3, 2, 11, 1, W1); Q(2, 9, 13, 2, W2); Q(4, 4, 2, 2, shade(W1, .06)); Q(9, 3, 3, 2, shade(W1, .06)); Q(14, 4, 2, 3, W1);
      Q(-1, 3 + bob, 5, 5, FC); Q(1, 2 + bob, 2, 2, FC); Q(0, 5 + bob, 1, 1, '#d8c870');
      if (e.bell) { Q(0, 3 + bob, 2, 1, '#f0ece0'); Q(2, 8 + bob, 2, 2, '#c9a03a'); }
      if (e.stuck) { const c = '#3a2a1e'; for (let i = 0; i < 5; i++) { Q(-2 + i * 4, 1 + (i % 2) * 3, 5, 1, c); Q(i * 4, 6 - (i % 2) * 2, 1, 5, c); } Q(3, 1, 1, 1, '#7a2a2a'); Q(11, 7, 1, 1, '#7a2a2a'); }
    },
    dog(g, e, t, R) {
      const mi = e.dir === 2, Q = (x, y, w, h, c) => R(mi ? 16 - x - w : x, y, w, h, c);
      const W1 = '#ece6d6', W2 = '#cfc6b0', st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0, wag = Math.sin(t * 9) > 0 ? 1 : 0;
      Q(0, 13, 16, 2, 'rgba(0,0,0,.3)');
      Q(3 + st, 9, 2, 5, W2); Q(11 - st, 9, 2, 5, W2); Q(5 - st, 9, 2, 5, W1); Q(13 + st, 9, 2, 5, W1);
      Q(2, 3, 13, 7, W1); Q(3, 8, 11, 2, W2); Q(14, 1 - wag, 2, 4, W1);
      Q(-2, -1, 6, 6, W1); Q(-3, 2, 2, 2, W1); Q(-4, 2, 1, 1, '#222'); Q(-1, 1, 1, 1, '#222'); Q(2, -1, 2, 4, W2);
      Q(2, 4, 3, 2, '#3a3a3a'); Q(2, 3, 1, 1, '#c8c8c8'); Q(4, 3, 1, 1, '#c8c8c8'); Q(3, 6, 1, 1, '#c8c8c8'); Q(1, 5, 1, 1, '#c8c8c8');
    },
    fire(g, e, t, R) {
      const lv = e.num ?? 4;
      R(1, 10, 14, 5, '#2a2622'); for (let i = 0; i < 5; i++) R(1 + i * 3, 11 + (i % 2), 3, 3, i % 2 ? '#5a554e' : '#6a645c');
      R(3, 8, 10, 2, '#4a2e18'); R(5, 7, 6, 2, '#3a2412');
      if (lv <= 0) { R(5, 8, 6, 2, '#2a1a0e'); if (Math.sin(t * 3 + e.px) > .2) R(7, 8, 2, 1, '#a0381a'); R(7, 4 + Math.sin(t) * 2, 1, 3, 'rgba(160,160,160,.3)'); return; }
      const h = 2 + lv * 3, fl = Math.sin(t * 14 + e.px) * 1.2, fl2 = Math.sin(t * 19 + 1.3) * 1;
      R(4, 9 - h, 8, h, '#b03a16'); R(5 + fl2, 9 - h * .85 + fl, 6, h * .85, '#f08a2a'); R(6, 9 - h * .5, 4, h * .5, '#ffd66a');
      if (lv >= 3) { R(7 + fl, 6 - h, 1, 2, '#ffb040'); R(9 - fl2, 4 - h + ((t * 9) % 4), 1, 1, '#ffe090'); }
    },
    woodpile(g, e, t, R) {
      const n = e.num ?? 10;
      R(-1, 12, 18, 3, 'rgba(0,0,0,.3)'); R(0, 4, 16, 10, '#3a2816');
      for (let i = 0; i < 10; i++) { const x = 1 + (i % 5) * 3, y = 10 - ((i / 5) | 0) * 4; if (i < n) { R(x, y, 3, 3, '#b08a5a'); R(x + 1, y + 1, 1, 1, '#7a5a34'); } else R(x, y, 3, 3, '#24180c'); }
      R(0, 3, 16, 1, '#2a1c0e');
    },
    gate(g, e, t, R) {
      R(0, 2, 2, 13, '#4a3420'); R(14, 2, 2, 13, '#4a3420');
      if (e.open) { R(2, 3, 2, 12, '#7a5a34'); R(2, 5, 3, 1, '#5a3a20'); R(2, 11, 3, 1, '#5a3a20'); return; }
      for (let x = 2; x < 14; x += 2) R(x, 3, 1, 11, x % 4 ? '#7a5a34' : '#6a4a2a');
      R(2, 5, 12, 2, '#8a6a40'); R(2, 10, 12, 2, '#8a6a40'); R(7, 6, 2, 1, '#c8b890');
    },
    hay(g, e, t, R) { R(0, 12, 16, 3, 'rgba(0,0,0,.3)'); R(1, 2, 14, 12, '#a08a4a'); R(3, -2, 10, 5, '#b09a58'); R(5, -4, 6, 3, '#b8a262'); for (let i = 0; i < 8; i++) R(2 + (i * 5) % 12, (i * 3) % 12, 1, 3, '#7a6a34'); },
    front(g, e, t, R) {
      const w = e.w * 16, c = e.wallC || '#8a8274';
      R(0, -6, w, 22, c); R(-1, -8, w + 2, 3, '#2a2a32');
      for (let y = -4; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < w; x += 8) R(x, y, 7, 1, shade(c, -.12));
      for (const wi of (e.wins || [])) { const x = wi * 16 + 3; R(x - 2, -3, 2, 8, '#4a3220'); R(x + 10, -3, 2, 8, '#4a3220'); R(x, -3, 10, 8, e.lit ? '#d8a050' : '#1e1a18'); R(x + 4, -3, 1, 8, '#3a2a1a'); }
      if (e.door != null) { const x = e.door * 16 + 3; R(x - 1, -1, 12, 17, '#4a3a2a'); R(x, 0, 10, 16, '#5a3a20'); R(x + 1, 1, 8, 1, '#6a4a2a'); R(x + 7, 8, 1, 2, '#c9a35a'); }
    },
    church(g, e, t, R) {
      const S0 = '#8e877a', S1 = '#7a7468';
      R(0, -8, 112, 24, S0); R(-1, -10, 114, 3, '#2a2a32');
      for (let y = -6; y < 16; y += 4) for (let x = (y / 4 % 2) * 5; x < 112; x += 10) R(x, y, 9, 1, S1);
      R(16, -4, 6, 10, '#2a2a3a'); R(90, -4, 6, 10, '#2a2a3a'); R(17, -3, 4, 8, '#4a5a7a'); R(91, -3, 4, 8, '#4a5a7a');
      R(46, -46, 20, 40, '#837c70'); R(46, -46, 20, 2, '#6a645a'); for (let y = -42; y < -8; y += 4) R(46, y, 20, 1, S1);
      R(50, -40, 4, 9, '#120e0c'); R(58, -40, 4, 9, '#120e0c'); R(54, -38, 4, 5, '#5a4a2a');
      for (let i = 0; i < 16; i++) { const wd = 2 + i * 1.3; R(56 - wd / 2, -62 + i, wd, 1, i % 3 ? '#3e3e48' : '#4a4a56'); }
      R(55, -70, 2, 8, '#1a1a1a'); R(52, -71, 6, 2, '#222'); R(57, -73, 2, 2, '#222'); R(58, -74, 1, 1, '#a02020'); R(51, -73, 2, 2, '#222'); R(50, -74, 2, 1, '#222');
      R(52, -20, 8, 7, '#5a4a6a'); R(55, -20, 2, 7, '#3a2a4a'); R(52, -17, 8, 1, '#3a2a4a');
      R(49, -2, 14, 18, '#4a3a2a'); R(50, -4, 12, 2, '#4a3a2a'); R(51, -1, 10, 17, '#5a3a20'); R(56, -1, 1, 17, '#3a2412');
    },
    madonna(g, e, t, R) {
      R(3, 12, 10, 3, 'rgba(0,0,0,.3)'); R(5, -2, 6, 15, '#8e877a'); R(4, 11, 8, 3, '#7a7468');
      R(3, -13, 10, 12, '#7a7468'); R(2, -15, 12, 3, '#4a4a52'); R(5, -11, 6, 9, '#2a2420');
      R(7, -10, 2, 2, '#e8dcc8'); R(6, -8, 4, 6, '#4a6aa8'); R(7, -8, 2, 5, '#e8e0d0');
      R(4, 0, 2, 2, '#9a8a50'); R(10, 0, 2, 2, '#a07a40');
      if (e.lit) { R(10, -2, 1, 3, '#f0ece0'); R(10, -4 + (Math.sin(t * 13) > 0 ? 0 : 1), 1, 2, '#ffd060'); }
    },
    forge(g, e, t, R) {
      const w = e.w * 16, c = '#7e766a';
      R(0, -6, w, 22, c); R(-1, -8, w + 2, 3, '#2a2a32');
      for (let y = -4; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < w; x += 8) R(x, y, 7, 1, shade(c, -.12));
      R(52, -2, 40, 18, '#1a120c'); R(50, -4, 44, 2, '#4a3a2a');
      const fl = Math.sin(t * 11) * 1.5; R(62, 6, 20, 8, '#3a1a0c'); R(64, 7 + fl * .3, 16, 5, '#d06020'); R(68, 8, 8, 3, '#ffb040');
      R(86, -30, 10, 26, '#5a554e'); R(85, -32, 12, 3, '#3a3632'); R(89, -36 - ((t * 6) % 4), 3, 3, 'rgba(160,160,160,.25)');
      R(10, -2, 12, 8, '#1e1a18'); R(12, 0, 3, 2, '#c8a050');
    },
    placard(g, e, t, R) { R(7, -2, 2, 16, '#5a4030'); R(0, -12, 16, 11, '#6a4a2e'); R(2, -11, 12, 9, '#e8e0c8'); for (let i = 0; i < 4; i++) R(3, -10 + i * 2, 9 - (i % 2) * 3, 1, '#7a7060'); R(10, -4, 2, 2, '#a02020'); R(3, -11, 3, 1, '#2a2a2a'); },
    cabane(g, e, t, R) {
      R(0, 13, 32, 3, 'rgba(0,0,0,.35)'); R(3, 9, 6, 6, '#2a1c10'); R(23, 9, 6, 6, '#2a1c10'); R(5, 11, 2, 2, '#6a5030'); R(25, 11, 2, 2, '#6a5030');
      R(0, -6, 32, 16, '#6a4a2a'); for (let x = 0; x < 32; x += 4) R(x, -6, 1, 16, '#4a3018');
      R(-2, -11, 36, 6, '#3e3e46'); R(0, -13, 32, 3, '#4a4a54');
      R(12, -3, 8, 12, '#3a2412'); R(18, 2, 1, 2, '#c9a35a'); R(23, -3, 6, 5, e.lit ? '#d8a050' : '#1e1a18'); R(25, -3, 1, 5, '#3a2a1a');
    },
    tor(g, e, t, R) { R(-1, 12, 34, 4, 'rgba(0,0,0,.35)'); R(1, -6, 30, 20, '#77736c'); R(3, -9, 24, 4, '#86827a'); R(0, -2, 2, 14, '#6a665f'); R(30, -3, 2, 15, '#625e58'); R(4, -8, 10, 2, '#9a968c'); R(20, 2, 6, 3, '#6e8a5a'); R(6, 8, 4, 2, '#6e8a5a'); R(2, 12, 28, 2, '#5a5650'); },
    gorse(g, e, t, R) { R(0, 12, 16, 3, 'rgba(0,0,0,.3)'); R(1, 2, 14, 12, '#2e4a24'); R(3, 0, 10, 3, '#355628'); for (let i = 0; i < 9; i++) R(2 + (i * 5) % 12, 1 + (i * 7) % 11, 2, 1, '#e8c640'); R(11, 4, 3, 2, FUR); R(12, 3, 1, 2, DK); },
    woodcross(g, e, t, R) { R(3, 12, 10, 3, '#6a6660'); R(5, 11, 6, 2, '#7a766e'); R(7, -4, 2, 16, '#6a5034'); R(4, -1, 8, 2, '#6a5034'); R(7, -1, 2, 2, '#c8b890'); R(5, 10, 2, 2, '#c8b040'); },
    bprint(g, e, t, R) {
      const c = 'rgba(70,84,100,.75)', P = (x, y) => { R(x, y, 3, 3, c); R(x - 1, y - 2, 1, 1, c); R(x + 1, y - 3, 1, 1, c); R(x + 3, y - 2, 1, 1, c); R(x - 1, y - 3, 1, 1, 'rgba(40,40,50,.8)'); };
      P(3, 5); P(10, 12); if (e.w > 1) { P(19, 4); P(27, 11); }
    },
    bootp(g, e, t, R) { const c = 'rgba(30,22,14,.7)'; R(9, 2, 3, 5, c); R(9, 8, 3, 2, c); R(12, 9, 3, 4, c); R(12, 14, 3, 1, c); const p = 'rgba(70,84,100,.7)'; R(3, 4, 3, 3, p); R(2, 2, 1, 1, p); R(4, 1, 1, 1, p); R(5, 11, 3, 3, p); R(4, 9, 1, 1, p); R(6, 8, 1, 1, p); },
    charhut(g, e, t, R) { R(0, 13, 32, 3, 'rgba(0,0,0,.35)'); for (let i = 0; i < 20; i++) { const wd = 4 + i * 1.4; R(16 - wd / 2, -8 + i, wd, 1, i % 3 ? '#4a3a28' : '#3a2c1c'); } R(16, -12, 1, 5, '#3a2c1c'); R(13, 4, 6, 8, '#120c08'); R(2, 11, 28, 2, '#2a2016'); },
    chain(g, e, t, R) { const c = '#7a4a2a', d = '#4a2a14'; for (let i = 0; i < 5; i++) { R(2 + i * 2, 8 + (i % 2), 2, 1, c); R(2 + i * 2, 10 - (i % 2), 1, 1, d); } R(12, 6, 3, 3, c); R(13, 7, 1, 1, '#1a1410'); R(6, 9, 1, 1, FUR); R(8, 8, 1, 2, FUR); },
    staff(g, e, t, R) { R(6, 13, 6, 2, 'rgba(0,0,0,.3)'); R(8, -12, 2, 26, '#c8a878'); R(8, -12, 2, 2, '#a88858'); R(8, 0, 2, 3, '#8a6a44'); },
    rouet(g, e, t, R) { R(2, 12, 12, 3, 'rgba(0,0,0,.3)'); R(3, -2, 1, 12, '#6a4a2a'); R(11, -2, 1, 12, '#6a4a2a'); R(3, -6, 9, 1, '#7a5a34'); R(3, 4, 9, 1, '#7a5a34'); R(3, -6, 1, 11, '#7a5a34'); R(11, -6, 1, 11, '#7a5a34'); R(7, -1, 1, 1, '#3a2a1a'); R(4, 10, 8, 3, '#5a3a20'); R(12, 2, 3, 3, '#e8e0cc'); },
    crucifix(g, e, t, R) { R(7, 1, 2, 11, '#5a3a22'); R(4, 3, 8, 2, '#5a3a22'); R(7, 3, 2, 5, '#e0d4bc'); R(7, 2, 2, 1, '#e0d4bc'); R(5, 12, 6, 2, '#6a5a3a'); },
    lambbox(g, e, t, R) { R(1, 12, 14, 3, 'rgba(0,0,0,.3)'); R(2, 6, 12, 8, '#8a6a3a'); for (let x = 3; x < 14; x += 2) R(x, 7, 1, 6, '#6a4a24'); R(4, 3, 8, 5, '#f0ece0'); R(3, 2 + (Math.sin(t * 2) > .8 ? 1 : 0), 3, 3, '#f0ece0'); R(3, 3, 1, 1, '#2a2a2a'); R(8, 2, 5, 2, '#9a8a6a'); },
    hearth(g, e, t, R) {
      R(0, -8, 32, 24, '#6a6258'); R(-1, -10, 34, 3, '#4a443e'); for (let y = -6; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < 32; x += 8) R(x, y, 7, 1, '#5a534a');
      R(4, 1, 24, 15, '#140c08'); const fl = Math.sin(t * 12) * 1.2; R(8, 11, 16, 4, '#4a2a14'); R(9, 8 + fl * .4, 14, 4, '#d06020'); R(12, 9, 8, 3, '#ffb040');
      R(15, -2, 2, 6, '#3a3a3a'); R(11, 3, 10, 6, '#262626'); R(12, 4, 8, 1, '#3a3a3a');
    },
    chest(g, e, t, R) { R(1, 12, 14, 3, 'rgba(0,0,0,.3)'); R(1, 4, 14, 10, '#6a4a2a'); R(1, 4, 14, 2, '#7a5a34'); R(3, 4, 1, 10, '#3a3a3a'); R(12, 4, 1, 10, '#3a3a3a'); R(7, 7, 2, 2, '#c9a35a'); },
    anvil(g, e, t, R) { R(2, 12, 12, 3, 'rgba(0,0,0,.3)'); R(4, 9, 8, 5, '#4a3020'); R(3, 5, 10, 3, '#3a3a40'); R(5, 8, 6, 2, '#2a2a30'); R(0, 5, 3, 2, '#3a3a40'); R(4, 5, 6, 1, '#6a6a74'); },
    ruin(g, e, t, R) { R(0, 12, 32, 3, 'rgba(0,0,0,.3)'); R(0, -2, 4, 15, '#6e6a62'); R(4, 4, 10, 9, '#6e6a62'); R(18, 0, 14, 13, '#6e6a62'); R(26, -4, 6, 5, '#6e6a62'); for (let y = 0; y < 13; y += 3) R(0, y, 32, 1, 'rgba(0,0,0,.18)'); R(14, 8, 4, 5, '#3a3630'); R(8, 12, 4, 2, '#7a766e'); },
    cairn(g, e, t, R) { R(2, 12, 12, 3, 'rgba(0,0,0,.3)'); R(3, 8, 10, 5, '#7a766e'); R(4, 4, 8, 4, '#8a867e'); R(5, 1, 6, 3, '#7a766e'); R(6, -2, 4, 3, '#9a968c'); }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    snow: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#d9dee2'); for (let i = 0; i < 10; i++) R((hash(X, Y, i) * 15) | 0, (hash(Y, X, i + 9) * 15) | 0, 2, 1, i % 2 ? '#c4ccd2' : '#eef2f4'); if (hash(X, Y, 3) < .5) R(0, 14, 16, 2, '#b8c2c8'); } },
    drystone: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4f5a3a'); R(0, 3, 16, 12, '#5e5a52'); for (let i = 0; i < 6; i++) { const x = (i % 3) * 5 + ((Y + (i / 3 | 0)) % 2) * 2, y = 4 + ((i / 3) | 0) * 5; R(x, y, 5, 4, shade('#7a766c', (hash(X, Y, i) - .5) * .3)); R(x, y + 4, 5, 1, '#3a3630'); } R(0, 14, 16, 2, '#33302a'); } },
    slate: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3c3f48'); for (let y = 0; y < 16; y += 4) { R(0, y + 3, 16, 1, '#26282e'); for (let x = (y / 4 % 2) * 3; x < 16; x += 6) R(x, y, 1, 3, '#4c505a'); } } },
    rubble: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#4f5a3a'); for (let i = 0; i < 6; i++) R((hash(X, Y, i) * 13) | 0, (hash(Y, X, i + 4) * 13) | 0, 3, 2, i % 2 ? '#7a766c' : '#5e5a52'); } },
    needles: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#2a2418'); for (let i = 0; i < 14; i++) R((hash(X, Y, i) * 15) | 0, (hash(Y, X, i + 7) * 15) | 0, 2, 1, i % 3 ? '#3a3020' : '#4a3a24'); } },
    bramble: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2a2418'); R(1, 3, 14, 11, '#1e2a16'); for (let i = 0; i < 9; i++) { const x = (hash(X, Y, i) * 14) | 0, y = 2 + ((hash(Y, X, i) * 12) | 0); R(x, y, 3, 1, '#3a2a1e'); R(x + 1, y - 1, 1, 1, '#5a3a2a'); } R(4, 6, 1, 1, '#7a1a2a'); R(10, 9, 1, 1, '#7a1a2a'); } }
  };
  const LEG = { S: 'snow', V: 'drystone', Q: 'slate', G: 'rubble', F: 'needles', M: 'bramble' };

  /* ---------- 惊吓大头像：红褐色的大脑袋、背脊那道黑一直通到额头、黄眼睛、慢慢张开的嘴 ---------- */
  const FACES = {
    beast(R, a, t) {
      R(0, 0, 32, 32, '#070504');
      R(2, 0, 7, 10, FUR2); R(23, 0, 7, 10, FUR2); R(4, 2, 3, 7, DK); R(25, 2, 3, 7, DK);
      R(4, 6, 24, 18, FUR); R(2, 10, 28, 11, FUR); R(6, 5, 20, 3, FUR);
      R(0, 14, 5, 12, FUR2); R(27, 14, 5, 12, FUR2); for (let i = 0; i < 4; i++) { R(1 + i, 16 + i * 2, 1, 4, DK); R(30 - i, 16 + i * 2, 1, 4, DK); }
      R(14, 3, 4, 13, DK); R(15, 1, 2, 3, DK);
      R(7, 10, 7, 4, '#000'); R(18, 10, 7, 4, '#000');
      const bl = Math.sin(t * 7) > .96;
      if (!bl) { R(8, 11, 5, 2, EYE); R(19, 11, 5, 2, EYE); R(11, 11, 1, 2, '#000'); R(21, 11, 1, 2, '#000'); R(8, 11, 1, 1, '#fff6c0'); R(19, 11, 1, 1, '#fff6c0'); }
      R(10, 15, 12, 8, CR); R(12, 15, 8, 3, '#1a0e08'); R(13, 15, 2, 1, '#4a3a30');
      const k = Math.min(1, a * 1.8), h = 2 + Math.round(k * 8);
      R(8, 22, 16, h, '#3a0806'); R(10, 23, 12, h - 2, '#120202');
      for (let i = 0; i < 5; i++) { R(10 + i * 3, 22, 1, 2, '#f0ece0'); R(10 + i * 3, 22 + h - 2, 1, 2, '#e0d8c8'); }
      R(8, 22, 2, 4, '#ffffff'); R(22, 22, 2, 4, '#ffffff');
      R(9, 29, 14, 3, CR);
    }
  };

  /* ---------- 地图 ---------- */
  function houseRows() {
    const G = grid(12, 9, 'W');
    G.rect(0, 0, 11, 1, '#'); G.rect(0, 0, 0, 8, '#'); G.rect(11, 0, 11, 8, '#'); G.rect(0, 7, 11, 8, '#');
    G.set(5, 7, 'W'); G.set(5, 8, 'W');
    return G.rows();
  }
  function villageRows() {
    const G = grid(38, 30, '"');
    G.rect(0, 0, 37, 1, 'P'); G.rect(0, 28, 37, 29, 'P'); G.rect(0, 2, 0, 27, 'P'); G.rect(37, 2, 37, 27, 'P');
    G.rect(0, 9, 0, 10, 'd');
    G.rect(4, 3, 9, 6, 'Q'); G.rect(17, 2, 23, 5, 'Q'); G.rect(29, 3, 35, 6, 'Q');
    G.rect(1, 9, 13, 10, 'd'); G.rect(6, 7, 6, 8, 'd'); G.rect(12, 7, 28, 12, 'd'); G.rect(28, 7, 35, 8, 'd'); G.rect(14, 13, 14, 15, 'd');
    G.rect(10, 16, 18, 22, 'V'); G.rect(11, 17, 17, 21, 'd');
    G.set(14, 16, 'd'); G.set(10, 19, 'd'); G.set(11, 22, 'G');
    [[2, 16], [3, 16], [2, 17], [27, 18], [28, 18], [27, 19], [33, 11], [34, 11], [22, 24], [23, 24], [23, 25], [5, 25], [6, 26], [30, 25]].forEach(([x, y]) => G.set(x, y, 'S'));
    [[2, 3], [12, 3], [13, 4], [25, 2], [36, 5], [34, 14], [31, 17], [29, 22], [24, 21], [26, 26], [33, 24], [2, 21], [1, 7]].forEach(([x, y]) => G.set(x, y, 'T'));
    [[24, 14], [25, 14], [26, 14], [20, 23], [16, 25], [35, 19]].forEach(([x, y]) => G.set(x, y, 'B'));
    [[3, 24], [32, 13], [19, 26]].forEach(([x, y]) => G.set(x, y, 'K'));
    return G.rows();
  }
  function pastureRows() {
    const G = grid(40, 26, '"');
    G.rect(0, 0, 39, 3, 'P'); G.rect(0, 24, 39, 25, 'P'); G.rect(0, 4, 0, 23, 'P'); G.rect(39, 4, 39, 23, 'P');
    G.rect(39, 9, 39, 10, 'd'); G.rect(19, 2, 20, 3, 'd');
    G.rect(31, 4, 31, 23, '~'); G.set(31, 9, 'o'); G.set(31, 10, 'o'); G.set(31, 18, 'o');
    G.rect(32, 9, 38, 10, 'd'); G.rect(24, 9, 30, 10, 'd');
    G.rect(12, 7, 16, 9, 'S'); G.set(13, 6, 'S'); G.set(17, 8, 'S'); [[5, 12], [6, 12], [27, 20], [28, 20], [35, 15], [36, 15], [8, 4], [9, 4]].forEach(([x, y]) => G.set(x, y, 'S'));
    [[4, 6], [10, 10], [17, 19], [27, 7], [34, 12], [36, 22], [3, 15], [12, 22], [25, 21], [7, 17]].forEach(([x, y]) => G.set(x, y, 'K'));
    [[6, 14], [15, 4], [24, 4], [29, 15], [33, 4], [11, 18], [2, 9], [37, 7], [21, 21]].forEach(([x, y]) => G.set(x, y, 'B'));
    [[1, 4], [1, 5], [38, 4], [1, 23], [38, 23], [2, 23]].forEach(([x, y]) => G.set(x, y, 'P'));
    return G.rows();
  }
  function forestRows() {
    return [
      'PPPPPPPPPPPPPPPPPPPPPPPPPP',
      'PPPPPPPPPPPPPPPPPPPPPPPPPP',
      'PPPPPFFFFFFFFFFFFFFFPPPPPP',
      'PPPPFFFFFFFFFFFFFFFFFPPPPP',
      'PPPFFFFFFFFFFFFFFFFMFPPPPP',
      'PPPFFFFFFFFFFFFFFFMMFFPPPP',
      'PPPPFFFFFFFFFFFFFFFFFPPPPP',
      'PPPPPPFFPFFFFFFPPFFPPPPPPP',
      'PPPPPPPFFFFPPFFFPPPPPPPPPP',
      'PPPPPPPPFFFPPPFFPPPPPPPPPP',
      'PPPPPPPPFFFPPPPFFPPPPPPPPP',
      'PPPPPPPFFFFPPPPPFFPPPPPPPP',
      'PPPPPPPFFFFFFFFFFPPPPPPPPP',
      'PPPPPPPPPPFFFFFFPPPPPPPPPP',
      'PPPPPPPPPPPFFFFPPPPPPPPPPP',
      'PPPPPPPPPPPFFFFPPPPPPPPPPP',
      'PPPPPPPPPPPFFFFPPPPPPPPPPP',
      'PPPPPPPPPPPPFFPPPPPPPPPPPP'
    ];
  }

  const TRI = (R, hT, c) => { R(2, hT - 1, 12, 2, c); R(4, hT - 3, 8, 2, c); R(1, hT, 2, 1, c); R(13, hT, 2, 1, c); R(4, hT - 1, 8, 1, '#c9a35a'); };
  const ME = { skin: '#f0c8a0', hair: '#5a3a22', hs: 'bun', hat: 'scarf', hatC: '#e8e0cc', top: '#6a4a3a', top2: '#e8e0cc', bottom: '#7a3a2a', skirt: true, apron: '#d8cfb8', shoes: '#3a2a1a' };

  defChapter({
    id: 'gevaudan', n: 25, title: '热沃当怪兽', sub: '1765 年春，山里的牧场上，一头比狼还大的野兽。它放着羊群不碰，专找放羊的孩子。', origin: '法国 1764—1767 年真实事件', color: '#6a3a1e',
    amb: 'wind', floor: 'darkwood', wall: 'stone', dark: .1, plr: 3.4, darkC: '#04060c',
    people: {
      me: Object.assign({ key: 'gv-agnes' }, ME),
      mePike: Object.assign({}, ME, { key: 'gv-agnes-pike', extra(g, d, fr, G, R) { if (d === 0) { R(13, 3, 1, 20, '#9a7a50'); R(12, 0, 3, 4, '#c8ccd0'); R(13, 0, 1, 1, '#f0f0f0'); R(12, 4, 3, 1, '#5a3a20'); } else if (d === 3) { R(2, 3, 1, 20, '#9a7a50'); R(1, 0, 3, 4, '#c8ccd0'); } else { R(4, 3, 1, 20, '#9a7a50'); R(3, 0, 3, 4, '#c8ccd0'); R(3, 4, 3, 1, '#5a3a20'); } } }),
      eti: { skin: '#f2cca6', hair: '#4a3020', hs: 'messy', child: true, top: '#7a6a4a', top2: '#5a4a3a', bottom: '#4a4038', shoes: '#3a2a1a', hat: 'cap', hatC: '#3a3a5a' },
      mother: { skin: '#e8c09a', hair: '#3a2a1a', hs: 'bun', hat: 'scarf', hatC: '#ece4d2', top: '#4a3a4a', bottom: '#5a4a3a', skirt: true, apron: '#cfc6b0', shoes: '#2a2018' },
      bapt: { skin: '#d4a07a', hair: '#d8d4cc', hs: 'short', hat: 'straw', hatC: '#3a3028', top: '#6a5a44', top2: '#4a3a2a', bottom: '#3a3028', coat: true, shoes: '#2a2018' },
      cure: { skin: '#e8c4a0', hair: '#7a7470', hs: 'bald', top: '#1a1a20', top2: '#e8e8e8', bottom: '#1a1a20', robe: true, shoes: '#111111' },
      smith: { skin: '#c89070', hair: '#2a2018', hs: 'bald', top: '#8a7a68', top2: '#5a4a3a', bottom: '#3a3430', apron: '#4a3020', shoes: '#1a1a1a' },
      oldw: { skin: '#d8b090', hair: '#cfcac2', hs: 'bun', hat: 'scarf', hatC: '#2a2a2a', top: '#2e2a2e', bottom: '#2a2628', skirt: true, shoes: '#1a1a1a' },
      sgt: { key: 'gv-sgt', skin: '#e8c09a', hair: '#e8e4dc', hs: 'short', top: '#2a3a7a', top2: '#c02a2a', bottom: '#e0d8c4', coat: true, shoes: '#111111', extra(g, d, fr, G, R) { TRI(R, G.hT, '#1a1a1e'); } },
      hunt1: { key: 'gv-hunt1', skin: '#d8a882', hair: '#8a8580', hs: 'short', top: '#4a5a3a', top2: '#3a4a2a', bottom: '#5a4a32', coat: true, shoes: '#2a1a10', extra(g, d, fr, G, R) { TRI(R, G.hT, '#2a2420'); if (d !== 3) { R(d === 0 ? 13 : 3, 4, 1, 18, '#3a2a1a'); R(d === 0 ? 13 : 3, 2, 1, 3, '#8a8a90'); } } },
      hunt2: { key: 'gv-hunt2', skin: '#e0b48e', hair: '#3a2a1a', hs: 'short', top: '#5a4a32', top2: '#3a3a2a', bottom: '#4a4030', coat: true, shoes: '#2a1a10', extra(g, d, fr, G, R) { TRI(R, G.hT, '#2a2420'); if (d !== 3) { R(d === 0 ? 2 : 3, 4, 1, 18, '#3a2a1a'); R(d === 0 ? 2 : 3, 2, 1, 3, '#8a8a90'); } } }
    },
    items: {
      stick: { name: '爸爸的放羊棍', desc: '白蜡木的，比你还高。手握的地方磨得发亮。' },
      pike: { name: '绑了刺刀的棍子', desc: '铁匠用牛皮条把一把旧刺刀缠在棍子头上。\n碰上了别跑——矛尖冲着它。' },
      candle: { name: '一支蜡烛', desc: '神父给的。「去给路口的圣母点上吧。」' }
    },
    notes: {
      placard: { title: '教堂门口的告示', text: '（神父念过好几遍，村里人都背得出来。）\n\n奉国王陛下之命：\n凡能除掉在热沃当一带伤人之猛兽者，赏银六千里弗尔。\n\n据见过它的人说：此兽比狼大得多，身长如牛犊；毛色红褐，背脊上一道黑纹，胸前发白；尾巴又长又粗；头大，嘴长，耳朵短而直立。\n\n它多在白天出没，专找独自放牧的人，尤其是妇女和孩子。\n\n放牧者务必结伴，随身带长矛，或绑了刀的棍子。' },
      mandement: { title: '主教训谕（神父抄的一段）', text: '（神父的字很工整。他说这只是大意。）\n\n……这头猛兽，是天主为惩罚我们的罪而降下的灾祸。\n我们的心变硬了；我们在酒馆里打发主日，对穷人吝啬，对天主冷淡。\n\n因此，各堂区当举行四十小时的祈祷。人人当悔改、告解，求天主收回祂的手。\n\n——芒德主教\n\n（抄录的末尾，神父又用小字添了一行：\n「可那些孩子，有什么罪呢？」）' },
      saying: { title: '巴蒂斯特老爹的放羊口诀', text: '（老爹不识字。神父照他念的，替他写了下来。）\n\n一、看风先看钟楼顶：\n　铁公鸡的头冲哪边，风就从哪边来。\n\n二、狼不走上风口：\n　它总从下风口摸过来，好叫羊闻不见它。\n\n三、火堆不灭，羊群不散。\n\n四、碰上了，莫跑，也莫叫小的跑。\n　转过身，冲着它站定，矛尖对着它的脸。\n　你看着它，它就不敢扑；\n　你把后背给它，它就扑上来。' },
      gazette: { title: '城里的报纸（大意）', text: '（龙骑兵中士塞给你的。你不识字，上面那张画倒看得懂。后来神父念给你听，说只是大意。）\n\n热沃当来信：那头怪兽仍在山中横行……\n有人说它是鬣狗，有人说是从哪位老爷的兽园里逃出来的狮子；有人说它能用后腿站起来走路，有人说子弹打在它身上会弹开。\n\n画上的东西长着狮子的鬃毛、野猪的獠牙，尾巴像一根鞭子，正扑向一个举着镰刀的女人。\n\n（中士笑着说：「英国人的报纸更绝，说咱们整个法国的军队，打不过一头狼。」）' }
    },
    legend: '「热沃当怪兽」（la Bête du Gévaudan）是法国历史上真实发生过的一连串野兽袭人事件。从1764年夏天到1767年6月，在热沃当（大致是今天的洛泽尔省一带）和相邻的马尔热里德山区，牧场上接连有人遇袭。遇难者大多是独自放牧的妇女和孩子，各家统计不一，常见的说法是八九十人到一百多人，伤者更多。目击者说它比狼大得多，毛色红褐，背上一道黑纹，尾巴又长又粗，胸前发白；它常常对近在眼前的牲畜不理不睬，专找放牧的人。\n\n【有出处的说法】事件惊动了宫廷。1764年秋起，龙骑兵进山驻扎搜捕，据说还让士兵扮成农妇引它出来；1765年1月，七个放牧的孩子用绑了刀的棍子把它赶跑，得到国王的赏赐；同年诺曼底的猎狼人奉命前来，夏天由国王的火枪手接手，9月在沙兹修道院附近打死一头大狼，做成标本送往凡尔赛，宣布事情结束——可到了冬天，袭击又开始了。1767年6月19日，一个本地猎人在莫歇山的一片沼地里打死了一头大型犬科动物，此后袭击基本停止。芒德主教的训谕称它是天主降下的惩罚；各地报纸争相报道，配上越画越怪的版画，英国报纸则拿法国捉不到一头狼来取笑。\n\n【后世的说法与各种猜测】「猎人用祝过圣的子弹打死怪兽」的故事出现得很晚，一般认为要到19世纪末一位本地神父写的书里才有「子弹在博略圣母堂祝过圣」的说法，「银弹」更是20世纪的小说和电影加上去的。它到底是什么，至今没有定论：一头或几头特别大的狼、狼与狗的杂交、从兽园逃出的鬣狗或狮子、被人驯养唆使的猛兽，乃至借野兽之名的杀人者——每一种都有人主张，也都缺少决定性的证据（「狼人」和「有人驯养」两种说法查无实据）。\n\n【游戏虚构】本章的村子、阿涅丝一家、巴蒂斯特老爹、神父、铁匠、龙骑兵中士和猎人都是虚构的；告示、训谕、报纸三张笔记是按史料大意改写的；放羊口诀、「风向与下风口」的推理、守夜的火堆规则、「正对着它，它就不敢扑」、林中窝棚的铁链和靴子印，都是为游戏编写的情节。文中不提任何真实遇难者与当事人的姓名，谨向那三年里失去生命的人们致哀。',
    start: { map: 'house', x: 4, y: 4, dir: 0 },
    faces: FACES,
    endings: { dawn: '第二十五夜　完', blessed: '圣母的蜡烛（隐藏）', forest: '一个人进了林子' },
    thumb(g, w, h) {
      const gy = h - 22;
      const sk = g.createLinearGradient(0, 0, 0, gy); sk.addColorStop(0, '#0e1220'); sk.addColorStop(1, '#3a2a2a'); g.fillStyle = sk; g.fillRect(0, 0, w, gy);
      g.fillStyle = '#e8e2cc'; g.beginPath(); g.arc(w * .78, 22, 9, 0, 7); g.fill(); g.fillStyle = '#0e1220'; g.beginPath(); g.arc(w * .78 + 4, 19, 8, 0, 7); g.fill();
      g.fillStyle = '#10180f'; for (let i = 0; i < 14; i++) { const x = i * (w / 13), ph = 18 + hash(i, 2, 25) * 16; g.beginPath(); g.moveTo(x - 7, gy - 24); g.lineTo(x, gy - 24 - ph); g.lineTo(x + 7, gy - 24); g.fill(); }
      g.fillStyle = '#c8ccd0'; g.beginPath(); g.moveTo(0, gy); g.lineTo(0, gy - 22); g.quadraticCurveTo(w * .5, gy - 34, w, gy - 20); g.lineTo(w, gy); g.fill();
      g.fillStyle = '#9aa2aa'; for (let i = 0; i < 20; i++) g.fillRect((hash(i, 5, 25) * w) | 0, gy - 16 + ((hash(i, 6, 25) * 14) | 0), 4, 1);
      const sc = 3, ox = w * .5 - 4 * sc, oy = gy - 30;
      const R = (x, y, ww, hh, c) => { if (!c) return; g.fillStyle = c; g.fillRect(ox + x * sc, oy + y * sc, ww * sc, hh * sc); };
      SPRITES.beast(g, { dir: 1, fr: 1 }, 0, R);
      g.fillStyle = 'rgba(255,220,80,.25)'; g.beginPath(); g.arc(ox - 4 * sc, oy - 2.5 * sc, 7, 0, 7); g.fill();
      const R2 = (x, y, ww, hh, c) => { if (!c) return; g.fillStyle = c; g.fillRect(14 + x * 2, gy - 34 + y * 2, ww * 2, hh * 2); };
      SPRITES.sheep(g, { dir: 2, fr: 0, px: 0, bell: true }, 0, R2);
    },
    resume: {
      noon: async S => {
        TRAIL = []; S.amb('wind'); S.lights(null);
        const eti = S.ent('eti'); eti.oy = -10; eti.solid = false; S.place('eti', 23, 13, 0);
        S.place('beastP', 19, 6, 0); S.f.fol = ['dog'];
        if (NOON_DIED) await S.think(NOON_DIED > 1 ? '（它在正前方，它就只敢低吼。它绕到哪边，我就转到哪边——一下都不能让它在背后。）' : '（转过去，对着它。它绕，我就跟着转。别把后背给它。）');
        startNoon(S);
      },
      gather: async S => { TRAIL = []; B.mode = 'off'; S.lights(null); },
      puzzle: async S => { TRAIL = []; B.mode = 'off'; S.lights(null); S.dark(.48); },
      night: async S => {
        TRAIL = []; S.lights(null);
        if (NIGHT_DIED) await S.think(NIGHT_DIED > 1 ? '（火光里，它扑不到我。抱柴的时候，它一贴上来，就站住、转身、盯着它，等它退了再走。火弱了就先添。）' : '（站在火光里，它就扑不到我。离开火光，就得一直对着它。）');
        const left = NIGHT_LEFT == null ? NIGHT_T : clamp(NIGHT_LEFT + 15, 45, NIGHT_T);
        startNight(S, left);
      },
      dawn: async S => { TRAIL = []; S.lights(null); await dawnChoice(S); }
    },
    async intro(S) {
      TRAIL = []; B.mode = 'off'; NOON_DIED = 0; NIGHT_DIED = 0; NIGHT_LEFT = null;
      for (const k in HOME) delete HOME[k];
      S.f.ph = 'morn'; S.f.fol = [];
      await S.card('第二十五夜　热沃当怪兽', '1765年4月　法国南部　热沃当，马尔热里德山区', '去年夏天开始，山里的牧场上不断有人出事。\n放羊的、放牛的，大多是女人和孩子。\n\n人们说，那是一头比狼还大的野兽。\n国王派来的龙骑兵在山里搜了整整一个冬天。\n\n它还在。');
    },
    tick(S, dt) {
      const f = S.f; if (!f) return;
      trailTick(); folTick(S);
      const mp = W.mapId;
      if (mp === 'pasture' && ['past', 'noon0', 'noon', 'gather', 'home'].includes(f.ph)) grazeTick(S, dt, null);
      if (mp === 'village') grazeTick(S, dt, inPen);
      bTick(S, dt);
      if (f.ph === 'night') nightTick(S, dt);
      if (W.busy) return;
      if (f.ph === 'past' && mp === 'pasture') { f.pastT = (f.pastT || 0) + dt; if ((clueN(f) >= 2 || f.pastT > 75) && S.once('noonGo')) S.run(noonEvent); }
      if (f.ph === 'chase' && mp === 'forest' && W.pl.y <= 5 && S.once('chaseEnd')) S.run(chaseEnd);
      if (f.ph === 'gather' && !f.foundW && (mp === 'pasture' || mp === 'forest')) {
        BELL_T -= dt;
        if (BELL_T <= 0) { BELL_T = 3.2; const d = mp === 'forest' ? dst(W.pl.x, W.pl.y, 18, 4) : dst(W.pl.x, W.pl.y, 19.5, 1) + 8; SND.sbell(S, clamp(.08 - d * .003, .012, .07)); }
      }
    },
    sprites: SPRITES,
    tiles: TILES,
    maps: {
      /* ---------------- 家里 ---------------- */
      house: {
        amb: 'room', dark: .3, plr: 3.4, wall: 'stone', floor: 'darkwood', legend: LEG,
        rows: houseRows(),
        ents: [
          { id: 'hearth', x: 1, y: 1, w: 2, spr: 'hearth', light: { r: 4.2, col: 'rgba(255,150,70,.22)', flick: true, dx: 16, dy: 14 }, on: N('炉膛上吊着一口黑铁锅，汤里漂着几颗栗子。\n火光一跳一跳地映在墙上。') },
          { id: 'hwin', x: 4, y: 1, spr: 'window', lit: true, on: N('窗外，山坡背阴的地方还有一块一块没化的雪。\n更远处是西边的高地，再远，是黑压压的林子。') },
          { id: 'crucifix', x: 6, y: 1, spr: 'crucifix', on: N('墙上的木十字架。妈妈每天晚上都对着它念一遍玫瑰经。\n入冬以来，她念两遍。') },
          { id: 'shelf', x: 8, y: 1, spr: 'shelf', on: N('架子上摆着几只陶碗、一罐盐、一块用布包着的奶酪。') },
          { id: 'hwin2', x: 10, y: 1, spr: 'window', lit: true, on: N('窗台上晾着一排艾蒂安捡回来的石子。') },
          { id: 'table', x: 5, y: 3, w: 2, spr: 'table', on: N('桌上有半块黑面包。艾蒂安把面包屑都捡着吃了。') },
          { id: 'bed', x: 9, y: 2, h: 2, spr: 'bed', col: '#6a4a3a', on: N('墙边的床挂着一块旧布帘。爸爸去下边的平原打短工了，这半张床空了一个冬天。') },
          { id: 'rouet', x: 1, y: 3, spr: 'rouet', on: N('妈妈的纺车。一团没纺完的羊毛还搭在上面。') },
          { id: 'chest', x: 10, y: 5, spr: 'chest', on: N('妈妈的嫁妆箱。最底下压着爸爸的一件旧外套，还有你小时候的一双木鞋。') },
          { id: 'lamb', x: 2, y: 6, spr: 'lambbox', on: N('篮子里卧着一只早产的小羊羔，裹着破布。\n它咩了一声，舔了舔你的手指。') },
          { id: 'stick', x: 1, y: 6, spr: 'staff', on: stickUse },
          { id: 'motherH', x: 3, y: 3, spr: '@mother', dir: 0, on: motherTalk },
          { id: 'eti', x: 7, y: 5, spr: '@eti', dir: 1, solid: false, on: pass(etiTalk) },
          { id: 'dog', x: 8, y: 6, spr: 'dog', dir: 1, solid: false, on: pass(dogTalk) },
          { id: 'hexit', x: 5, y: 8, spr: 'invisible', touch: houseExit }
        ],
        enter: houseEnter
      },
      /* ---------------- 村子 ---------------- */
      village: {
        amb: 'wind', dark: .12, plr: 3.4, wall: 'stone', legend: LEG,
        tileOpts: { grassC: '#4c5a38', treeC: '#22341e' },
        rows: villageRows(),
        ents: [
          { id: 'houseF', x: 4, y: 6, w: 6, spr: 'front', wallC: '#8a8274', door: 2, wins: [0, 4], on: N('你家的石头房子。屋顶的石板是爷爷那一辈铺的，漏雨的那块一直没换。') },
          { id: 'hdoor', x: 6, y: 6, spr: 'invisible', solid: true, on: houseDoor },
          { id: 'church', x: 17, y: 5, w: 7, spr: 'church', on: churchUse },
          { id: 'cdoor', x: 20, y: 5, spr: 'invisible', solid: true, on: churchDoor },
          { id: 'madonna', x: 25, y: 5, spr: 'madonna', on: madonnaUse },
          { id: 'forgeF', x: 29, y: 6, w: 7, spr: 'forge', light: { r: 3.4, col: 'rgba(255,130,50,.24)', flick: true, dx: 72, dy: 8 }, on: N('铁匠铺。炉膛里的火终年不灭，铁砧上叮叮当当的。\n门口靠着一排新打的矛头。') },
          { id: 'anvil', x: 31, y: 8, spr: 'anvil', on: N('铁砧被锤得发亮，一边磕出了好几个豁口。') },
          { id: 'smith', x: 33, y: 8, spr: '@smith', dir: 1, on: smithTalk },
          { id: 'well', x: 15, y: 10, spr: 'well', on: N('村里的井。辘轳上的绳子磨得发白。\n井沿上有人用刀刻了一个小小的十字。') },
          { id: 'oldw', x: 16, y: 11, spr: '@oldw', dir: 1, on: oldwTalk },
          { id: 'placard', x: 22, y: 7, spr: 'placard', on: S => S.note('placard') },
          { id: 'cure', x: 19, y: 7, spr: '@cure', dir: 0, on: cureTalk },
          { id: 'sgt', x: 26, y: 10, spr: '@sgt', dir: 1, on: sgtTalk },
          { id: 'hay', x: 3, y: 12, spr: 'hay', on: N('草垛。去年秋天割的草，只剩下小半垛了。') },
          { id: 'woodpile', x: 4, y: 13, spr: 'woodpile', num: 10, on: woodUse },
          { id: 'pgate', x: 14, y: 16, spr: 'gate', on: penGate },
          { id: 'wgate', x: 10, y: 19, spr: 'gate', solid: true, on: N('西边的栅门，用树枝编的，上了麻绳。\n结实是结实，可挡不住什么真想进来的东西。') },
          { id: 'swtrack', x: 9, y: 22, spr: 'bprint', decal: true, solid: false, on: swTrack },
          { id: 'cabane', x: 20, y: 18, w: 2, spr: 'cabane', on: S => S.narr(S.f.ph === 'night' || S.f.ph === 'dawn' ? '窝棚的小窗透出一点灯光。妈妈和艾蒂安在里面。\n你听见妈妈在小声念玫瑰经。' : '放羊人的窝棚，装着两个木轮子，夏天推上山，冬天推回来。') },
          { id: 'fireW', x: 8, y: 19, spr: 'fire', hidden: true, num: 4, on: fireUse },
          { id: 'fireSW', x: 11, y: 24, spr: 'fire', hidden: true, num: 4, on: fireUse },
          ...SHEEP.map((id, i) => ({ id, x: [12, 14, 16, 12, 14, 16][i], y: [18, 18, 18, 20, 20, 20][i], spr: 'sheep', solid: true, s: id === 'sh1' ? { bell: true } : id === 'sh3' ? { dark: true } : {}, dir: i % 2 ? 2 : 1, on: pass(sheepUse) })),
          { id: 'bapt', x: 13, y: 14, spr: '@bapt', dir: 0, on: baptTalk },
          { id: 'mother', x: 16, y: 15, spr: '@mother', hidden: true, on: S => S.say('妈妈', S.f.ph === 'puzzle' ? '巴蒂斯特老爹问你话呢。好好想想。' : '回来就好。回来就好。') },
          { id: 'beastV', x: 2, y: 26, spr: 'beast', hidden: true, solid: false, on: stab },
          { id: 'hunt1', x: 14, y: 10, spr: '@hunt1', hidden: true, on: N('猎人的火枪擦得锃亮，枪托上刻满了道道。') },
          { id: 'hunt2', x: 15, y: 10, spr: '@hunt2', hidden: true, on: N('年轻的猎人打着哈欠，靴子上全是泥。') },
          { id: 'hound', x: 13, y: 10, spr: 'dog', hidden: true, solid: false, on: N('猎犬冲着西南边的林子，鼻子一抽一抽的。') },
          { id: 'wexit1', x: 0, y: 9, spr: 'invisible', touch: westExit },
          { id: 'wexit2', x: 0, y: 10, spr: 'invisible', touch: westExit }
        ],
        enter: villageEnter
      },
      /* ---------------- 西边的高地 ---------------- */
      pasture: {
        amb: 'wind', dark: .05, plr: 3.6, legend: LEG,
        tileOpts: { grassC: '#56603c', treeC: '#1e3020' },
        rows: pastureRows(),
        ents: [
          { id: 'tor', x: 23, y: 13, w: 2, spr: 'tor', on: N('一块大花岗岩，被风磨得圆溜溜的。\n艾蒂安最喜欢爬上去，假装自己是国王的哨兵。') },
          { id: 'print', x: 14, y: 8, spr: 'bprint', decal: true, solid: false, on: printUse },
          { id: 'gorse', x: 9, y: 15, spr: 'gorse', on: gorseUse },
          { id: 'wcross', x: 26, y: 5, spr: 'woodcross', on: crossUse },
          { id: 'ruin', x: 5, y: 19, w: 2, spr: 'ruin', on: N('塌了一半的石头窝棚。从前夏天放羊的人在这里过夜、做奶酪。\n现在，谁也不敢在山上过夜了。') },
          { id: 'cairn', x: 34, y: 14, spr: 'cairn', on: N('一堆垒起来的石头，给赶路的人指方向。\n最上面那块，不知道是谁新放上去的。') },
          { id: 'beastP', x: 19, y: 2, spr: 'beast', hidden: true, solid: false, on: stab },
          { id: 'fedge1', x: 19, y: 3, spr: 'invisible', touch: forestEdge },
          { id: 'fedge2', x: 20, y: 3, spr: 'invisible', touch: forestEdge },
          { id: 'eexit1', x: 39, y: 9, spr: 'invisible', touch: eastExit },
          { id: 'eexit2', x: 39, y: 10, spr: 'invisible', touch: eastExit }
        ],
        enter: pastureEnter
      },
      /* ---------------- 北边的松林 ---------------- */
      forest: {
        amb: 'night', dark: .52, plr: 3, legend: LEG, fog: .12,
        tileOpts: { grassC: '#24301e', treeC: '#14221a' },
        rows: forestRows(),
        ents: [
          { id: 'charhut', x: 9, y: 3, w: 2, spr: 'charhut', on: hutUse },
          { id: 'chain', x: 11, y: 4, spr: 'chain', solid: false, on: chainUse },
          { id: 'boots', x: 9, y: 10, spr: 'bootp', decal: true, solid: false, on: bootUse },
          { id: 'paws1', x: 13, y: 14, spr: 'bprint', decal: true, solid: false, on: N('松针上又是那种大爪印，往北去了。') },
          { id: 'paws2', x: 9, y: 8, spr: 'bprint', decal: true, solid: false, on: N('爪印在这里转了个圈，又往空地那边去了。') },
          { id: 'stump', x: 15, y: 6, spr: 'cairn', on: N('一截烧过的树桩，上面压着几块石头。烧炭人留下的记号。') },
          { id: 'beastF', x: 21, y: 8, spr: 'beast', hidden: true, solid: false, on: stab },
          { id: 'fout1', x: 12, y: 17, spr: 'invisible', touch: forestOut },
          { id: 'fout2', x: 13, y: 17, spr: 'invisible', touch: forestOut }
        ],
        enter: forestEnter
      }
    }
  });
})();
