/* ================= game modes: objectives on top of the day / night survival loop =================
   W.mode picks one of MODES; W.obj holds its state (plain JSON: saved, and sent to the guest when W.obv changes).
   Hooks (host side unless noted): init() right after the world is generated (host and guest, same rng => same layout),
   tick(dt), use(p, i, b) -> interaction target for an objective block, done(p, tgt), hit(i, dmg) (players hurting a nest),
   hud() -> { t, s, p } (guest too), marks() -> [{ x, y, n, c, a }] for the big map and the screen-edge arrow (guest too). */
const MODE_IDS = ['classic', 'escape', 'nests', 'towers', 'airdrop', 'boss'];
const MODES = {
  classic: { name: '经典守夜', icon: '🌙', map: 'town', desc: '撑过 15 夜等来救援。每天三个小任务，白天搜刮建造，夜里守住堡垒。' },
  escape: { name: '修车逃离', icon: '🚚', map: 'town', desc: '营地边有辆坏卡车。6 个零件散在不同的楼里（修车厂、警局、超市…），找齐装好，发动引擎后守住 2 分钟就能冲出去。' },
  nests: { name: '摧毁尸巢', icon: '☣', map: 'forest', desc: '野外有 5 个尸巢，会不停孵出丧尸，每个活着的尸巢都让夜里多来一批。全部炸掉后母巢现身，打掉它就赢。' },
  towers: { name: '信号塔', icon: '📡', map: 'desert', desc: '启动 4 座信号塔：站在塔边守住校准，丧尸会从四面围上来。全部完成后直升机飞来营地，守到它降落。' },
  airdrop: { name: '抢空投', icon: '🪂', map: 'islands', desc: '军方不停往野外空投物资，落地会引来尸群。抢到空投拿好东西和信标，集齐 6 个信标后去撤离点守住 90 秒。' },
  boss: { name: '尸王狩猎', icon: '👑', map: 'snow', desc: '第 2–5 夜各来一只尸王：会飞扑的、会钻地的、会召唤小弟的、会喷毒的。四只全部击杀就赢。' },
};
const modeDef = () => MODES[(W && W.mode) || 'classic'] || MODES.classic;
const objChanged = () => { W.obv = (W.obv || 0) + 1; };

/* ---------- placement helpers (use the seeded rand so host and guest agree) ---------- */
const inLot = (x, y, pad = 0) => TOWN_HOUSES.some(([x0, y0, x1, y1]) => x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad);
function openCell(x, y, r = 1) { // dry, flat, empty ground with an empty ring around it
  if (!inMap(x, y)) return false; const g = gAt(x, y);
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (!inMap(xx, yy) || gAt(xx, yy) !== g || ttAt(xx, yy) === TT.water || W.blk[ci(xx, yy, g)] || W.slab[ci(xx, yy, g)]) return false; }
  return true;
}
// n sites far from the camp and from each other; pref(x, y) scores candidates (higher is better)
function farSites(n, minCamp, minSep, pref) {
  const out = [];
  for (let pass = 0; pass < 3 && out.length < n; pass++) {
    const cand = [];
    for (let k = 0; k < 900; k++) { const x = 4 + Math.floor(rand() * (MW - 8)), y = 4 + Math.floor(rand() * (MH - 8)); if (radioDist(x, y) < minCamp * (1 - pass * 0.25) || inLot(x, y, 3) || !openCell(x, y, 1)) continue; cand.push([x, y, (pref ? pref(x, y) : 0) + rand()]); }
    cand.sort((a, b) => b[2] - a[2]);
    for (const [x, y] of cand) { if (out.length >= n) break; if (out.every(([a, b]) => Math.hypot(a - x, b - y) >= minSep * (1 - pass * 0.25))) out.push([x, y, gAt(x, y)]); }
  }
  return out;
}
// a free floor cell inside a building of one of the types (any building if none of that type)
function bldCell(types) {
  let hs = TOWN_HOUSES.filter(h => types.includes(h[5])); if (!hs.length) hs = TOWN_HOUSES.filter(h => h[5] !== 'barn'); if (!hs.length) return null;
  for (let k = 0; k < 600; k++) {
    const [x0, y0, x1, y1, st] = hs[Math.floor(rand() * hs.length)], x = x0 + 1 + Math.floor(rand() * (x1 - x0 - 1)), y = y0 + 1 + Math.floor(rand() * (y1 - y0 - 1)), L = Math.floor(rand() * Math.max(1, st));
    const i = ci(x, y, L); if (W.blk[i] || !support(x, y, L) || (L > 0 && !W.slab[i])) continue;
    if (DIRS.some(([dx, dy]) => W.blk[ci(x + dx, y + dy, L)] === 6)) continue;
    return [x, y, L];
  }
  return null;
}
function placeObj(x, y, L, id) { const i = ci(x, y, L); W.blk[i] = id; W.bhp[i] = B[id].hp || 1; return i; }
// a zombie of kind k on open ground ring rmin..rmax around (x, y); mz marks it as a mode zombie (doesn't hold back the dawn)
function zAround(k, x, y, rmin, rmax) {
  for (let t = 0; t < 30; t++) {
    const a = rand() * Math.PI * 2, d = rmin + rand() * (rmax - rmin), zx = Math.floor(x + Math.cos(a) * d), zy = Math.floor(y + Math.sin(a) * d);
    if (!inMap(zx, zy)) continue; const L = gAt(zx, zy); if (!standable(zx, zy, L, 'z') || ttAt(zx, zy) === TT.water) continue;
    const z = spawnZombie(k, 0); z.x = zx + 0.5; z.y = zy + 0.5; z.L = L; z.z = surfZ(z.x, z.y, L); z.mz = 1; return z;
  }
  return null;
}
const modeKind = n => { const r = rand(); return n >= 3 && r < 0.25 ? 'runner' : n >= 4 && r < 0.33 ? 'dog' : n >= 5 && r < 0.4 ? 'armored' : r < 0.55 ? 'crawler' : 'walker'; };
const alivePl = () => W.p.filter(p => !p.gone && !p.dead);
const nearPl = (x, y, r) => alivePl().some(p => Math.hypot(p.x - x, p.y - y) < r);
function modeSay(text, col, big) { say(text, col || '#ffd76a'); if (big) emit({ k: 'mbanner', t: text, c: col || '#ffd76a' }); }
function giveAmmo(mul) { for (const p of activeP()) WPN.forEach((w, k) => { if (p.owned[k] && !w.inf) p.ammo[k] += Math.round(w.mag * mul); }); }
const fmtT = s => Math.floor(Math.max(0, s) / 60) + ':' + String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');

/* ---------- 修车逃离 ---------- */
const PARTS = [['发动机', ['garage', 'ware']], ['轮胎', ['garage', 'ware', 'shop']], ['电瓶', ['shop', 'police', 'garage']], ['汽油', ['ware', 'garage', 'shop']], ['火花塞', ['garage', 'shop', 'clinic']], ['车钥匙', ['police', 'apt', 'villa', 'clinic']]];
Object.assign(MODES.escape, {
  init() {
    const tx = W.radio.x + 10, ty = W.radio.y + 1;
    for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 2; x++) if (inMap(x, y)) W.blk[ci(x, y, gAt(x, y))] = 0;
    const tci = placeObj(tx, ty, gAt(tx, ty), 47); W.bdir[tci] = 0;
    const parts = PARTS.map(([n, types], k) => { const c = bldCell(types) || [W.radio.x + 20 + k * 3, W.radio.y + 20, 0]; const i = placeObj(c[0], c[1], c[2], 43); return { n, x: c[0], y: c[1], L: c[2], ci: i, got: 0, ox: Math.round((rand() - 0.5) * 12), oy: Math.round((rand() - 0.5) * 12) }; });
    W.obj = { truck: { x: tx, y: ty, ci: tci }, parts, inst: 0, phase: 'collect', t: 0, spT: 0 };
  },
  use(p, i, b) {
    const O = W.obj; if (O.phase === 'done') return null;
    if (b === 43) { const q = O.parts.find(q => q.ci === i && !q.got); return q ? { k: 'obj', i, t: 1.5, name: '拾取 ' + q.n } : null; }
    if (b === 47) { const got = O.parts.filter(q => q.got).length; if (got > O.inst) return { k: 'obj', i, t: 2.5, name: '安装零件（' + (got - O.inst) + ' 个）' }; if (O.inst === PARTS.length && O.phase === 'collect') return { k: 'obj', i, t: 1.5, name: '发动引擎' }; }
    return null;
  },
  done(p, tgt) {
    const O = W.obj, b = W.blk[tgt.i];
    if (b === 43) { const q = O.parts.find(q => q.ci === tgt.i); if (!q || q.got) return; q.got = 1; setCell(tgt.i, 0, W.slab[tgt.i], null, 'loot'); const n = O.parts.filter(q => q.got).length; modeSay('找到了' + q.n + '（' + n + '/' + PARTS.length + '）——带回营地装到卡车上', '#ffd76a'); sfx('craft'); }
    else if (b === 47) {
      const got = O.parts.filter(q => q.got).length;
      if (got > O.inst) { O.inst = got; modeSay(O.inst === PARTS.length ? '零件装齐了！准备好就发动引擎（引擎响了尸群会围过来）' : '装好了 ' + O.inst + '/' + PARTS.length + ' 个零件', '#8fe39a'); }
      else if (O.inst === PARTS.length && O.phase === 'collect') { O.phase = 'start'; O.t = 120; modeSay('引擎启动中！守住卡车 2 分钟', '#ff8a6a', true); }
    }
    objChanged();
  },
  tick(dt) {
    const O = W.obj; if (O.phase !== 'start') return;
    O.t -= dt; O.spT -= dt;
    if (O.spT <= 0) { O.spT = 2.2; const n = Math.max(2, W.night); for (let k = 0; k < 2; k++) { const z = spawnZombie(rand() < 0.08 ? 'brute' : modeKind(n), Math.floor(rand() * 4)); z.mz = 1; } }
    if (Math.floor(O.t) !== Math.floor(O.t + dt)) objChanged();
    if (O.t <= 0) { O.phase = 'done'; objChanged(); endGame('win', '卡车发动了！你们冲出了尸潮'); }
  },
  hud() {
    const O = W.obj, got = O.parts.filter(q => q.got).length;
    if (O.phase === 'start') return { t: '引擎启动中 ' + fmtT(O.t), s: '守住卡车，别让尸群把你们拖住', p: 1 - O.t / 120 };
    const next = O.parts.find(q => !q.got);
    return { t: '零件 ' + got + '/' + PARTS.length + ' · 已装 ' + O.inst, s: next ? '去找「' + next.n + '」（大地图上的问号附近）' : O.inst < PARTS.length ? '回营地把零件装到卡车上' : '到卡车旁「发动引擎」', p: (got + O.inst) / (PARTS.length * 2) };
  },
  marks() {
    const O = W.obj, m = [{ x: O.truck.x + 0.5, y: O.truck.y + 0.5, n: '卡车', c: '#8fe39a', a: O.inst < O.parts.filter(q => q.got).length || O.phase !== 'collect' || O.inst === PARTS.length }];
    for (const q of O.parts) if (!q.got) m.push({ x: q.x + 0.5 + q.ox, y: q.y + 0.5 + q.oy, n: q.n + '?', c: '#ffd76a', a: 1, r: 9 });
    return m;
  },
});

/* ---------- 摧毁尸巢 ---------- */
Object.assign(MODES.nests, {
  init() {
    const hp = 1500 * (1 + 0.35 * (W.p.length - 1)) * (W.D.hp || 1);
    const nests = farSites(5, 28, 26).map(([x, y, L]) => { const i = placeObj(x, y, L, 44); W.bhp[i] = hp; return { x, y, L, ci: i, alive: 1, cd: 2, hp, max: hp }; });
    W.obj = { nests, mother: null, phase: 'nests' };
  },
  hit(i, dmg) { if (W.blk[i] !== 44) return; W.bhp[i] -= dmg; W.dirty.add(i); const q = (W.obj.mother && W.obj.mother.ci === i) ? W.obj.mother : W.obj.nests.find(q => q.ci === i); if (q) { q.hp = Math.max(0, W.bhp[i]); if (Math.random() < 0.3) objChanged(); } if (W.bhp[i] <= 0) setCell(i, 0, W.slab[i], null, 'brk'); },
  tick(dt) {
    const O = W.obj, night = W.phase === 'night';
    const all = O.mother ? [O.mother] : O.nests;
    for (const q of all) {
      if (!q.alive) continue;
      if (W.blk[q.ci] !== 44) { // destroyed
        q.alive = 0; W.res.parts += 10; giveAmmo(1); objChanged();
        if (q === O.mother) { O.phase = 'done'; endGame('win', '母巢被摧毁了，尸潮退去'); return; }
        const left = O.nests.filter(q => q.alive).length;
        modeSay(left ? '摧毁了一个尸巢！还剩 ' + left + ' 个（+10 零件、弹药）' : '所有尸巢都毁了——母巢出现了！', '#8fe39a', !left);
        if (!left) { const s = farSites(1, 40, 0, (x, y) => radioDist(x, y) / 40)[0]; if (s) { const hp = 4200 * (1 + 0.35 * (W.p.length - 1)) * (W.D.hp || 1), i = placeObj(s[0], s[1], s[2], 44); W.bhp[i] = hp; emit({ k: 'cell', i, b: 44, s: W.slab[i], d: 0, c: 'spawn' }); O.mother = { x: s[0], y: s[1], L: s[2], ci: i, alive: 1, cd: 1, hp, max: hp, big: 1 }; O.phase = 'mother'; const g = zAround('boss', s[0], s[1], 2, 4); if (g) g.mz = 1; } }
        continue;
      }
      q.cd -= dt;
      const near = nearPl(q.x, q.y, 26);
      if (q.cd <= 0 && (near || night)) {
        q.cd = (night ? 5 : 7) * (q.big ? 0.6 : 1);
        const mine = W.zs.filter(z => z.nest === q.ci).length;
        if (mine < (q.big ? 14 : 8)) for (let k = 0; k < (q.big ? 3 : rand() < 0.5 ? 2 : 1); k++) { const z = zAround(modeKind(W.night + 1), q.x, q.y, 1.5, 3.5); if (z) { z.nest = q.ci; if (night && !near) z.mz = 0; } }
      }
    }
  },
  hud() {
    const O = W.obj;
    if (O.mother) return { t: '母巢', s: '去大地图上的母巢，把它打掉（有巨尸守着）', p: 1 - O.mother.hp / O.mother.max };
    const left = O.nests.filter(q => q.alive).length; return { t: '尸巢 剩余 ' + left + '/5', s: '尸巢会不停孵丧尸；子弹、刀、手雷、喷火都能伤它', p: (5 - left) / 5 };
  },
  marks() { const O = W.obj; return (O.mother ? [O.mother] : O.nests).filter(q => q.alive).map(q => ({ x: q.x + 0.5, y: q.y + 0.5, n: q.big ? '母巢' : '尸巢', c: '#ff5a6a', a: 1, hp: q.hp / q.max })); },
});

/* ---------- 信号塔 ---------- */
const TOWER_R = 9, TOWER_T = 75;
Object.assign(MODES.towers, {
  init() {
    const towers = farSites(4, 26, 30, (x, y) => gAt(x, y) * 0.6).map(([x, y, L]) => ({ x, y, L, ci: placeObj(x, y, L, 45), st: 0, prog: 0, spT: 0 }));
    W.obj = { towers, phase: 'towers', t: 0, spT: 0 };
  },
  use(p, i, b) { if (b !== 45) return null; const q = W.obj.towers.find(q => q.ci === i); return q && q.st === 0 ? { k: 'obj', i, t: 2, name: '启动信号塔' } : null; },
  done(p, tgt) { const q = W.obj.towers.find(q => q.ci === tgt.i); if (!q || q.st) return; q.st = 1; modeSay('信号塔开始校准——站在塔边的圈里守住，离开会停下', '#ffd76a'); objChanged(); },
  tick(dt) {
    const O = W.obj, night = W.phase === 'night';
    for (const q of O.towers) {
      if (q.st !== 1) continue;
      const on = nearPl(q.x + 0.5, q.y + 0.5, TOWER_R);
      const before = q.prog; q.prog = clamp(q.prog + (on ? dt / TOWER_T : -dt / 400), 0, 1);
      if (Math.floor(before * 20) !== Math.floor(q.prog * 20)) objChanged();
      q.spT -= dt;
      if (on && q.spT <= 0) { q.spT = night ? 2.4 : 3.4; for (let k = 0; k < 2; k++) zAround(modeKind(W.night + 1), q.x, q.y, 15, 22); }
      if (q.prog >= 1) { q.st = 2; W.res.parts += 8; giveAmmo(1); const n = O.towers.filter(q => q.st === 2).length; modeSay(n < O.towers.length ? '信号塔校准完成（' + n + '/' + O.towers.length + '）+8 零件、弹药' : '四座塔都连上了！直升机 2 分 30 秒后到营地，守住！', '#8fe39a', n === O.towers.length); if (n === O.towers.length) { O.phase = 'evac'; O.t = 150; } objChanged(); }
    }
    if (O.phase === 'evac') {
      O.t -= dt; O.spT -= dt;
      if (O.spT <= 0) { O.spT = 2.6; for (let k = 0; k < 2; k++) { const z = spawnZombie(modeKind(W.night + 2), Math.floor(rand() * 4)); z.mz = 1; } }
      if (Math.floor(O.t) !== Math.floor(O.t + dt)) objChanged();
      if (O.t <= 0) { if (alivePl().some(p => inZone(Math.floor(p.x), Math.floor(p.y)))) { O.phase = 'done'; objChanged(); endGame('win', '直升机降落在营地，你们撤离了'); } else if (Math.random() < dt / 6) say('直升机到了——回营地（黄框里）登机！', '#ffd76a'); }
    }
  },
  hud() {
    const O = W.obj;
    if (O.phase === 'evac') return { t: '直升机 ' + (O.t > 0 ? fmtT(O.t) + ' 后到达' : '到了！回营地'), s: '守住营地，时间到时要有人在黄框里', p: 1 - Math.max(0, O.t) / 150 };
    const done = O.towers.filter(q => q.st === 2).length, act = O.towers.find(q => q.st === 1);
    return { t: '信号塔 ' + done + '/' + O.towers.length + (act ? ' · 校准 ' + Math.floor(act.prog * 100) + '%' : ''), s: act ? (nearPl(act.x, act.y, TOWER_R) ? '守住！丧尸会围上来' : '回到塔边的圈里，离开会停下') : '去塔边按「交互」启动校准', p: (done + (act ? act.prog : 0)) / O.towers.length };
  },
  marks() { const O = W.obj; const m = O.towers.filter(q => q.st < 2).map(q => ({ x: q.x + 0.5, y: q.y + 0.5, n: q.st === 1 ? '校准中 ' + Math.floor(q.prog * 100) + '%' : '信号塔', c: q.st === 1 ? '#ffd76a' : '#9ad0ff', a: 1, ring: q.st === 1 ? TOWER_R : 0 })); if (O.phase === 'evac') m.push({ x: W.radio.x + 0.5, y: W.radio.y + 0.5, n: '直升机', c: '#8fe39a', a: 1 }); return m; },
});

/* ---------- 抢空投 ---------- */
const DROP_NEED = 6, EVAC_R = 6, EVAC_T = 90;
Object.assign(MODES.airdrop, {
  init() { W.obj = { got: 0, drops: [], next: 45, phase: 'drops', ev: null }; },
  use(p, i, b) { if (b !== 46) return null; return W.obj.drops.find(q => q.ci === i && q.st === 1) ? { k: 'obj', i, t: 2.5, name: '打开空投' } : null; },
  done(p, tgt) {
    const O = W.obj, q = O.drops.find(q => q.ci === tgt.i && q.st === 1); if (!q) return;
    q.st = 2; setCell(tgt.i, 0, W.slab[tgt.i], null, 'loot');
    const parts = 10 + Math.floor(rand() * 7); W.res.parts += parts; giveAmmo(2); for (const pl of activeP()) { pl.meds++; pl.nades++; }
    const lock = WPN.map((w, k) => k).filter(k => !p.owned[k]); let gun = '';
    if (lock.length && rand() < 0.4) { const k = lock[Math.floor(rand() * lock.length)]; p.owned[k] = 1; p.ammo[k] += WPN[k].mag * 2; gun = '、' + WPN[k].name; }
    O.got++; modeSay('空投到手：信标 ' + O.got + '/' + DROP_NEED + '，+' + parts + ' 零件、弹药、医疗包、手雷' + gun, '#8fe39a');
    if (O.got >= DROP_NEED && O.phase === 'drops') { const s = farSites(1, 30, 0)[0] || [W.radio.x, W.radio.y + 20, 0]; O.phase = 'evac'; O.ev = { x: s[0], y: s[1], t: 0 }; modeSay('信标够了！去大地图上的撤离点守住 90 秒', '#ffd76a', true); }
    objChanged();
  },
  tick(dt) {
    const O = W.obj;
    O.next -= dt;
    if (O.next <= 0 && O.phase === 'drops') {
      O.next = 95 + rand() * 45;
      if (O.drops.filter(q => q.st < 2).length < 3) { const s = farSites(1, 22, 0)[0]; if (s) { O.drops.push({ x: s[0], y: s[1], L: s[2], st: 0, t: 10, ci: -1 }); modeSay('空投正在落下！看屏幕边的箭头 / 大地图', '#9ad0ff', true); emit({ k: 'sfx', n: 'plane' }); } }
      objChanged();
    }
    for (const q of O.drops) if (q.st === 0) {
      q.t -= dt;
      if (q.t <= 0) { q.st = 1; const i = placeObj(q.x, q.y, q.L, 46); q.ci = i; emit({ k: 'cell', i, b: 46, s: W.slab[i], d: 0, c: 'spawn' }); const n = 5 + 2 * W.night; for (let k = 0; k < n; k++) zAround(modeKind(W.night + 1), q.x, q.y, 9, 16); emit({ k: 'boom', x: q.x + 0.5, y: q.y + 0.5, z: q.L * FH + 0.3, s: 1 }); objChanged(); }
    }
    if (O.phase === 'evac') {
      const e = O.ev, on = nearPl(e.x + 0.5, e.y + 0.5, EVAC_R);
      if (on || e.t > 0) { const b0 = e.t; if (on) e.t += dt; if (Math.floor(b0) !== Math.floor(e.t)) objChanged(); e.sp = (e.sp || 0) - dt; if (e.sp <= 0) { e.sp = 2.2; for (let k = 0; k < 2; k++) zAround(modeKind(W.night + 2), e.x, e.y, 13, 20); } }
      if (e.t >= EVAC_T) { O.phase = 'done'; objChanged(); endGame('win', '撤离直升机接到了你们'); }
    }
  },
  hud() {
    const O = W.obj;
    if (O.phase === 'evac') return { t: '撤离点 ' + fmtT(EVAC_T - O.ev.t), s: nearPl(O.ev.x, O.ev.y, EVAC_R) ? '守在圈里！' : '去撤离点（大地图），站在圈里计时', p: O.ev.t / EVAC_T };
    const fall = O.drops.find(q => q.st === 0), open = O.drops.filter(q => q.st === 1).length;
    return { t: '信标 ' + O.got + '/' + DROP_NEED + (fall ? ' · 空投落下中' : ' · 下个空投 ' + fmtT(O.next)), s: open ? '有 ' + open + ' 个空投还没打开——尸群在附近' : '空投落地会引来尸群，小心', p: O.got / DROP_NEED };
  },
  marks() { const O = W.obj; const m = O.drops.filter(q => q.st < 2).map(q => ({ x: q.x + 0.5, y: q.y + 0.5, n: q.st === 0 ? '空投落下 ' + Math.ceil(q.t) : '空投', c: '#9ad0ff', a: 1 })); if (O.phase === 'evac') m.push({ x: O.ev.x + 0.5, y: O.ev.y + 0.5, n: '撤离点', c: '#8fe39a', a: 1, ring: EVAC_R }); return m; },
});

/* ---------- 尸王狩猎 ---------- */
const BOSSES = ['leaper', 'digger', 'summoner', 'venom'];
Object.assign(MODES.boss, {
  init() { const order = BOSSES.slice(); for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; } W.obj = { order, dead: [], cur: null, pools: [] }; },
  night(n) { // nights 2..5 bring one boss each, with the horde
    const O = W.obj, k = O.order[n - 2]; if (!k || O.dead.includes(k)) return;
    const z = spawnZombie(k, Math.floor(rand() * 4)); z.mz = 1; z.max = z.hp = ZT[k].hp * (1 + 0.25 * (W.p.length - 1)) * (W.D.hp || 1) * (1 + (n - 2) * 0.12); O.cur = z.id;
    modeSay('尸王来了：' + ZT[k].name + '！', '#ff6a5a', true); objChanged();
  },
  tick(dt) {
    const O = W.obj;
    if (O.cur != null) { const z = W.zs.find(q => q.id === O.cur); O.curK = z ? z.k : O.curK; if (!z || z.hp <= 0) { if (O.curK && !O.dead.includes(O.curK)) { O.dead.push(O.curK); W.res.parts += 15; giveAmmo(2); modeSay(ZT[O.curK].name + ' 倒下了！（' + O.dead.length + '/4）+15 零件、弹药', '#8fe39a', true); } O.cur = null; objChanged(); if (O.dead.length >= BOSSES.length) { endGame('win', '四只尸王都被你们猎杀了'); return; } } else if (Math.random() < dt * 2) objChanged(); }
    // acid pools from the venom king
    for (const q of O.pools) { q.t -= dt; for (const p of alivePl()) if (!p.down && Math.hypot(p.x - q.x, p.y - q.y) < q.r) hurtPlayer(p, 12 * dt * W.D.dmg); }
    const n0 = O.pools.length; O.pools = O.pools.filter(q => q.t > 0); if (n0 !== O.pools.length) objChanged();
  },
  hud() {
    const O = W.obj, z = O.cur != null ? W.zs.find(q => q.id === O.cur) : null;
    if (z) return { t: ZT[z.k].name + ' ' + Math.ceil(z.hp / z.max * 100) + '%', s: { leaper: '它会跳过墙扑向你——别站在一起', digger: '它会钻进地下从你脚下冒出来——看到土包就跑', summoner: '它会召唤小弟——先打它本体', venom: '它会喷毒，地上的绿圈别站' }[z.k], p: 1 - z.hp / z.max, boss: 1 };
    const nx = O.order.find(k => !O.dead.includes(k)), when = O.order.indexOf(nx) + 2;
    return { t: '尸王 ' + O.dead.length + '/4', s: nx ? '第 ' + when + ' 夜：' + ZT[nx].name + '（' + (W.night >= when ? '在附近徘徊' : '还没来') + '）' : '', p: O.dead.length / 4 };
  },
  marks() { const O = W.obj, z = O.cur != null ? W.zs.find(q => q.id === O.cur) : null; return z ? [{ x: z.x, y: z.y, n: ZT[z.k].name, c: '#ff6a5a', a: 1, hp: z.hp / z.max }] : []; },
});

/* ---------- hooks used by the rest of the game ---------- */
function modeInit() { const M = modeDef(); W.obj = {}; W.obv = 1; if (M.init) M.init(); }
function modeUse(p, i, b) { const M = modeDef(); return M.use && W.obj ? M.use(p, i, b) : null; }
function modeDone(p, tgt) { const M = modeDef(); if (M.done) M.done(p, tgt); }
function modeTick(dt) { const M = modeDef(); if (M.tick && W.obj && !W.over) M.tick(dt); }
function modeNight(n) { const M = modeDef(); if (M.night) M.night(n); }
function modeHit(i, dmg) { const M = modeDef(); if (M.hit) M.hit(i, dmg); }
function modeHud() { const M = modeDef(); return M.hud && W.obj && Object.keys(W.obj).length ? M.hud() : null; }
function modeMarks() { const M = modeDef(); try { return M.marks && W.obj && Object.keys(W.obj).length ? M.marks() : []; } catch (e) { return []; } }
// nests within reach of an explosion / a flame cone / a knife swing take damage
function modeAreaHit(x, y, R, dmg) { if (W.mode !== 'nests' || !W.obj.nests) return; for (const q of (W.obj.mother ? [W.obj.mother] : W.obj.nests)) if (q.alive && Math.hypot(q.x + 0.5 - x, q.y + 0.5 - y) < R + 0.6) modeHit(q.ci, dmg); }

/* ---------- boss abilities (host) ---------- */
function bossStep(z, dt) {
  const T = ZT[z.k]; if (!T.boss) return false;
  const tgt = alivePl().filter(p => !p.down).sort((a, b) => Math.hypot(a.x - z.x, a.y - z.y) - Math.hypot(b.x - z.x, b.y - z.y))[0];
  z.abT = (z.abT == null ? 3 : z.abT) - dt;
  if (z.leap) { // a big arcing jump that ignores walls
    const J = z.leap; J.t += dt; const f = Math.min(1, J.t / J.T);
    z.x = lerp(J.x0, J.x1, f); z.y = lerp(J.y0, J.y1, f); z.z = lerp(J.z0, J.z1, f) + Math.sin(f * Math.PI) * 3; z.face = Math.atan2(J.y1 - J.y0, J.x1 - J.x0);
    if (f >= 1) { z.leap = null; z.L = J.L1; z.z = J.z1; bossSlam(z, 1.9, 30); }
    return true;
  }
  if (z.dig) { // underground: invisible, invulnerable, homing in on the target, then bursts out
    const D = z.dig; D.t += dt;
    if (tgt) { D.tx = tgt.x; D.ty = tgt.y; D.L = tgt.L; }
    const dx = D.tx - z.x, dy = D.ty - z.y, d = Math.hypot(dx, dy), sp = 5.5 * dt;
    if (d > 0.1) { z.x += dx / d * Math.min(d, sp); z.y += dy / d * Math.min(d, sp); }
    if (Math.random() < dt * 12) emit({ k: 'dig', x: r2(z.x), y: r2(z.y), z: r2(z.z) });
    if (D.t > 2.4 || d < 0.3) { z.dig = null; z.hidden = 0; z.L = D.L; z.z = surfZ(z.x, z.y, z.L); bossSlam(z, 2.1, 36); }
    return true;
  }
  if (!tgt) return false;
  const d = Math.hypot(tgt.x - z.x, tgt.y - z.y);
  if (z.abT <= 0) {
    if (z.k === 'leaper' && d > 2.5 && d < 13) { z.abT = 6; z.leap = { t: 0, T: 0.95, x0: z.x, y0: z.y, z0: z.z, x1: tgt.x, y1: tgt.y, z1: tgt.z, L1: tgt.L }; emit({ k: 'sfx', n: 'jump', x: z.x, y: z.y }); return true; }
    if (z.k === 'digger' && d > 3 && d < 24) { z.abT = 9; z.dig = { t: 0, tx: tgt.x, ty: tgt.y, L: tgt.L }; z.hidden = 1; emit({ k: 'dig', x: r2(z.x), y: r2(z.y), z: r2(z.z), big: 1 }); return true; }
    if (z.k === 'summoner' && d < 26) { z.abT = 6; const mine = W.zs.filter(q => q.sum === z.id).length; if (mine < 12) for (let k = 0; k < 3; k++) { const m = zAround(rand() < 0.5 ? 'crawler' : 'walker', z.x, z.y, 1.5, 3); if (m) { m.sum = z.id; m.mz = 1; } } emit({ k: 'scream', x: r2(z.x), y: r2(z.y), z: r2(z.z) }); }
    if (z.k === 'venom' && d < T.range) { z.abT = 2.8; const [sx, sy, sz] = [z.x, z.y, z.z + z.h * 0.8], dz = (tgt.z + 0.3) - sz, t = Math.max(0.6, d / 8); W.proj.push({ k: 'acid', x: sx, y: sy, z: sz, vx: (tgt.x - sx) / t, vy: (tgt.y - sy) / t, vz: dz / t + 10 * t / 2, o: -1, pool: 1, t: 4 }); emit({ k: 'sfx', n: 'spit', x: z.x, y: z.y }); }
  }
  return false;
}
function bossSlam(z, R, dmg) {
  for (const p of alivePl()) { const d = Math.hypot(p.x - z.x, p.y - z.y); if (d < R && !p.down) { hurtPlayer(p, dmg * W.D.dmg); knock(p, (p.x - z.x) / (d || 1) * 7, (p.y - z.y) / (d || 1) * 7); } }
  const x0 = Math.floor(z.x), y0 = Math.floor(z.y);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = x0 + dx, y = y0 + dy; if (!inMap(x, y)) continue; const i = ci(x, y, z.L); if (W.blk[i] && B[W.blk[i]].brk && B[W.blk[i]].cost) damageCell(i, 140); }
  emit({ k: 'boom', x: r2(z.x), y: r2(z.y), z: r2(z.z + 0.2), s: 1 });
}
function acidPool(x, y) { if (W.mode === 'boss' && W.obj.pools) { W.obj.pools.push({ x: r2(x), y: r2(y), r: 1.7, t: 7 }); objChanged(); } }
