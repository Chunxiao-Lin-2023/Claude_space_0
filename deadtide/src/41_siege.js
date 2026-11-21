/* ================= 尸城求生 (siege) — the default mode since round 19 =================
   Zombies hold half the town: sleeping crowds inside buildings (and a few out in the open) wake when you come close
   or make noise. Clear a building and it is yours: build anywhere (no camp-only zone), with blueprints found in the
   world unlocking the better pieces — barricades, mines, turrets — and two vehicles. Each night the horde comes for
   wherever you are and the sun comes up on time; survive SIEGE.nights nights. Searching pays double, ammo boxes lie about. */
const SIEGE = {
  nights: 10, sleepR: 5.5, noiseR: 12, boomR: 18, chainR: 2.6, chainP: 0.5,  // (round 19b) noticing range, loudest gun / explosion hearing, a woken zombie may rouse one close by
  noticeRate: 1.4, noticeDecay: 0.4, wallMuffle: 0.6,                     // time to notice you: 2 cells ≈ 1.4 s, 3 cells ≈ 2.3 s, 4 cells ≈ 6 s (×2.2 with its back to you); walls cut hearing to 60%
  gunNoise: { pistol: 8, shotgun: 12, rifle: 11, sniper: 14, crossbow: 2.5, flamer: 6, launcher: 12 },
  tRange: 9, tRate: 0.32, tDmg: 18, tAmmo: 240, tRefill: { parts: 3 },  // turret
  loot: 2, mineR: 2.4, mineDmg: 200, spawnR: 24, vSpd: VEH.map(v => v ? v.spd : 1),    // search yield multiplier, mines, horde ring radius, vehicle speed (motorbike 2.3 -> 1.9 in round 20)
  occFrac: 0.55, clearRw: { parts: 6, steel: 4 },
  bpOdds: { milcrate: 0.5, toolbox: 0.3, backpack: 0.18, cabinet: 0.14, crate: 0.14, car: 0.1, ammobox: 0.08 },
};
MODE_IDS.unshift('siege');
MODES.siege = { name: '尸城求生', icon: '🏚', map: 'town', timed: 1, anyBuild: 1, ring: 1, desc: '丧尸占了半座城：清掉楼里的尸群，就在那里搭临时据点。搜蓝图解锁路障、地雷、机枪塔和车。每夜到点就天亮，撑过 10 夜就赢。' };
// round 19: the new mode becomes everyone's default once (a later pick on the title screen sticks)
if (!SET.m19) { SET.mode = 'siege'; SET.map = 'town'; SET.m19 = 1; saveSet(); }
const isSiege = () => !!(W && W.mode === 'siege');
const hasBP = k => !isSiege() || BP_BASE.includes(k) || (W.obj && W.obj.bp && W.obj.bp.includes(k));
// a zombie put straight onto a cell (during world setup the edge spawn lists don't exist yet)
function putZombie(k, x, y, L) { const keep = W.edges; W.edges = { 0: [[x, y, L]] }; const z = spawnZombie(k, 0); W.edges = keep; z.x = x + 0.3 + rand() * 0.4; z.y = y + 0.3 + rand() * 0.4; z.L = L; z.z = surfZ(z.x, z.y, L); return z; }
const sleeperKind = () => { const r = rand(); return r < 0.12 ? 'crawler' : r < 0.2 ? 'runner' : r < 0.26 ? 'bloater' : r < 0.31 ? 'spitter' : r < 0.35 ? 'armored' : r < 0.38 ? 'screamer' : r < 0.4 ? 'brute' : r < 0.44 ? 'climber' : 'walker'; };
Object.assign(MODES.siege, {
  init() {
    const O = W.obj = { bp: [], occ: [], phase: 'siege', tam: {} };
    const ks = TOWN_HOUSES.map((h, k) => k).filter(k => TOWN_HOUSES[k][5] !== 'barn');
    for (let k = ks.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [ks[k], ks[j]] = [ks[j], ks[k]]; }
    const NAME = { apt: '公寓', villa: '别墅', ware: '仓库', shop: '超市', clinic: '诊所', police: '警局', garage: '修车厂' };
    for (const k of ks.slice(0, Math.ceil(ks.length * SIEGE.occFrac))) {
      const [x0, y0, x1, y1, st, type] = TOWN_HOUSES[k], cells = [];
      for (let L = 0; L < Math.max(1, st); L++) for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) if (standable(x, y, L, 'z') && (L === 0 || W.slab[ci(x, y, L)])) cells.push([x, y, L]);
      if (cells.length < 8) continue;
      const deep = cells.filter(([x, y]) => x >= x0 + 3 && x <= x1 - 3 && y >= y0 + 3 && y <= y1 - 3), zc = deep.length >= 8 ? deep : cells; // not right inside the door
      const n = clamp(Math.round((x1 - x0) * (y1 - y0) / 24) + st * 2, 6, 18), id = O.occ.length;
      for (let j = 0; j < n; j++) { const [x, y, L] = zc[Math.floor(rand() * zc.length)]; const z = putZombie(sleeperKind(), x, y, L); z.sleep = 1; z.mz = 1; z.occ = id; z.face = rand() * 6.28; }
      // the reward: a blueprint case somewhere upstairs if there is an upstairs
      const up = cells.filter(c => c[2] === Math.max(0, Math.min(st - 1, 1 + Math.floor(rand() * st)))), pool = up.length ? up : cells;
      for (let t = 0; t < 40; t++) { const [x, y, L] = pool[Math.floor(rand() * pool.length)], i = ci(x, y, L); if (!W.blk[i] && !DIRS.some(([dx, dy]) => W.blk[ci(x + dx, y + dy, L)] === 6)) { W.blk[i] = 55; W.bhp[i] = 1; break; } }
      O.occ.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, n, left: n, c: 0, name: NAME[type] || '楼', h: k });
    }
    // a few crowds out in the open, round a supply crate
    for (const [x, y, L] of farSites(3, 22, 30)) {
      const id = O.occ.length, n = 6 + Math.floor(rand() * 4); W.blk[ci(x, y, L)] = 36; W.bhp[ci(x, y, L)] = 1;
      for (let j = 0; j < n; j++) { const a = rand() * 6.28, d = 1.5 + rand() * 2.5, zx = Math.floor(x + Math.cos(a) * d), zy = Math.floor(y + Math.sin(a) * d); if (!inMap(zx, zy) || !standable(zx, zy, gAt(zx, zy), 'z')) continue; const z = putZombie(sleeperKind(), zx, zy, gAt(zx, zy)); z.sleep = 1; z.mz = 1; z.occ = id; }
      O.occ.push({ x: x + 0.5, y: y + 0.5, n, left: n, c: 0, name: '野外尸群', out: 1 });
    }
    for (const q of O.occ) q.left = q.n = W.zs.filter(z => z.occ === O.occ.indexOf(q)).length;
  },
  tick(dt) {
    const O = W.obj;
    // waking: someone in sight close by, a gunshot / blast within earshot, or a woken neighbour
    W.noise = (W.noise || []).filter(e => W.t - e.t < 0.6);
    const ap = alivePl();
    if ((W.wakeT = (W.wakeT || 0) - dt) <= 0) {
      const st = 0.2 - W.wakeT; W.wakeT = 0.2;
      for (const z of W.zs) {
        if (!z.sleep || z.hp <= 0) continue;
        if (z.wakeAt && W.t >= z.wakeAt) { siegeWake(z, true); continue; }
        // noticing you takes a moment: quicker the closer you are, slower behind its back, faster if you roar up on a motorbike
        let gain = 0;
        for (const p of ap) {
          const d = Math.hypot(p.x - z.x, p.y - z.y); if (d >= SIEGE.sleepR || p.L !== z.L) continue;
          if (d > 1.2 && !los(z.x, z.y, z.z + 1, p.x, p.y, p.z + 0.8)) continue;
          const facing = Math.cos(angDiff(z.face || 0, Math.atan2(p.y - z.y, p.x - z.x))) > 0 ? 1 : 0.45;
          gain = Math.max(gain, (d < 1.2 ? 4 : Math.pow(1 - d / SIEGE.sleepR, 1.5) * SIEGE.noticeRate) * facing * (p.ride ? 1.6 : 1));
        }
        z.aw = Math.max(0, (z.aw || 0) + (gain > 0 ? gain : -SIEGE.noticeDecay) * st);
        let wake = z.aw >= 1;
        if (!wake) for (const e of W.noise) { const d = Math.hypot(e.x - z.x, e.y - z.y); if (d < e.r && (d < e.r * SIEGE.wallMuffle || los(e.x, e.y, (e.z || 0) + 1, z.x, z.y, z.z + 1))) { wake = true; break; } }
        if (wake) siegeWake(z);
      }
    }
    // cleared buildings
    const alive = O.occ.map(() => 0); for (const z of W.zs) if (z.hp > 0 && z.occ != null && alive[z.occ] != null) alive[z.occ]++;
    O.occ.forEach((q, k) => {
      if (q.left !== alive[k]) { q.left = alive[k]; objChanged(); }
      if (!q.c && alive[k] === 0) { q.c = 1; for (const r in SIEGE.clearRw) W.res[r] += SIEGE.clearRw[r]; objChanged(); modeSay((q.out ? '野外尸群清掉了' : '清理完：' + q.name + '，现在是你们的据点了') + '（+' + SIEGE.clearRw.parts + ' 零件 +' + SIEGE.clearRw.steel + ' 钢材）', '#8fe39a', true); }
    });
    // (round 28) turrets moved to turretTick (every mode); refilling is turretUse / turretDone
  },
  night(n) { modeSay('第 ' + n + ' 夜：尸潮冲你们来了，撑到天亮（' + fmtT(BAL.nightMin(n)) + '）', '#ff9a6a', true); },
  // the sun comes up on time: whatever is still far from you wanders off, the rest stay (and stop counting for the next dawn)
  dawn() { for (const z of W.zs) { if (z.hp <= 0 || z.mz) continue; if (!nearPl(z.x, z.y, 14)) z.hp = 0; else z.mz = 1; } W.zs = W.zs.filter(z => z.hp > 0); if (W.night >= SIEGE.nights) { endGame('win', '撑过了 ' + SIEGE.nights + ' 夜，救援车队开进了城'); return true; } return false; },
  hud() {
    const O = W.obj, c = O.occ.filter(q => q.c).length;
    if (W.phase === 'night') { const L = BAL.nightMin(W.night); return { t: '第 ' + W.night + ' 夜 · 天亮还有 ' + fmtT(L - W.nightT), s: '躲进清理过的楼，封门封窗、埋雷、架机枪塔，撑到天亮', p: W.nightT / L }; }
    return { t: '尸占区 已清 ' + c + '/' + O.occ.length + ' · 蓝图 ' + O.bp.length + '/' + BP_LIST.length + ' · 第 ' + (W.night + 1) + '/' + SIEGE.nights + ' 夜', s: c < O.occ.length ? '红色是丧尸占着的楼：清掉里面的尸群，拿图纸箱，就地搭据点' : '全城都清过了：搜物资、加固据点', p: c / Math.max(1, O.occ.length) };
  },
  marks() {
    const me = W.p[ME], O = W.obj; let near = -1, nd = 1e9;
    O.occ.forEach((q, k) => { if (q.c) return; const d = Math.hypot(q.x - me.x, q.y - me.y); if (d < nd) { nd = d; near = k; } });
    return O.occ.map((q, k) => ({ x: q.x, y: q.y, n: q.c ? '✓' + (q.out ? '' : q.name) : (q.out ? '尸群' : '尸占') + ' ' + q.left, c: q.c ? '#8fe39a' : '#ff6a5a', a: !q.c && k === near && W.phase === 'day' ? 1 : 0, r: 6 }));
  },
});
// a zombie wakes (and groans): one close neighbour may stir a second or two later; those don't pass it on
function siegeWake(z, chained) {
  if (!z.sleep) return; z.sleep = 0; z.wakeAt = 0; z.aw = 0; z.wokeT = W.t;
  if (chained) return;
  for (const o of W.zs) if (o.sleep && !o.wakeAt && o.L === z.L && Math.hypot(o.x - z.x, o.y - z.y) < SIEGE.chainR && rand() < SIEGE.chainP) o.wakeAt = W.t + 1 + rand() * 2;
}
// a blueprint from a search (siege only): returns its name or ''
function siegeBlueprint(kind, sure) {
  if (!isSiege()) return '';
  const O = W.obj, left = BP_LIST.filter(k => !O.bp.includes(k));
  if (!left.length || (!sure && !(rand() < (SIEGE.bpOdds[kind] || 0)))) return '';
  const k = left[Math.floor(rand() * left.length)]; O.bp.push(k); objChanged();
  modeSay('找到蓝图：' + bpName(k) + (typeof k === 'number' ? '（道具栏里解锁了）' : '（商店 → 载具 里能造了）'), '#7fd0ff', true);
  return '蓝图·' + bpName(k);
}
// gunfire and blasts wake sleepers
function noiseAt(x, y, r, z) { if (isSiege()) (W.noise = W.noise || []).push({ x, y, z: z || 0, r, t: W.t }); }
// the horde comes out on a ring round the survivors (or the camp if nobody is about)
function siegeEdges() {
  const ap = alivePl(); if (!ap.length) return edgeSpawns();
  const cx = Math.round(ap.reduce((s, p) => s + p.x, 0) / ap.length), cy = Math.round(ap.reduce((s, p) => s + p.y, 0) / ap.length);
  const e = edgeSpawns(cx, cy, SIEGE.spawnR, true); return [0, 1, 2, 3].some(s => e[s].length) ? e : edgeSpawns();
}

/* ---------- (round 28) turrets and trap patches, in every mode ---------- */
// turret cells, trap cells, and which trap acts on each floor cell (W.trapAt: trap cell index or -1), redone when the world changes
function scanCells() {
  if (W.scanV === W.ver && W.trapAt) return; W.scanV = W.ver; W.tur = []; W.traps = [];
  for (let i = 0; i < NC; i++) { const b = W.blk[i]; if (!b) continue; if (TUR[b]) W.tur.push(i); else if (B[b].trap || B[b].wire || B[b].mine) W.traps.push(i); }
  const A = W.trapAt && W.trapAt.length === NC ? W.trapAt : (W.trapAt = new Int32Array(NC)); A.fill(-1); W.trapCells = [];
  for (const t of W.traps) {
    const x0 = cx_(t), y0 = cy_(t), L = cl_(t);
    const open = (x, y) => { if (!inMap(x, y)) return false; const j = ci(x, y, L), b = W.blk[j]; if (j !== t && b && (B[b].Z || B[b].P || B[b].B || TUR[b] || B[b].trap || B[b].wire || B[b].mine || B[b].stairs)) return false; return support(x, y, L); };
    for (let dy = -TRAP_R; dy <= TRAP_R; dy++) for (let dx = -TRAP_R; dx <= TRAP_R; dx++) {
      const x = x0 + dx, y = y0 + dy; if (!inMap(x, y)) continue; const j = ci(x, y, L);
      if (j !== t && (A[j] >= 0 || !open(x, y) || (dx && dy && !open(x0 + dx, y0) && !open(x0, y0 + dy)))) continue; // only open floor next to it, never through a wall corner: a tight spot just gets a smaller patch
      A[j] = t; W.trapCells.push(j);
    }
  }
}
function turretTick(dt) {
  scanCells(); const O = W.obj || (W.obj = {}); O.tam = O.tam || {}; W.tcd = W.tcd || {};
  for (const i of W.tur) {
    const b = W.blk[i], T = TUR[b]; if (!T) continue;
    O.tamB = O.tamB || {}; if (O.tam[i] == null || O.tamB[i] !== b) { O.tamB[i] = b; O.tam[i] = T.ammo; W.tcd[i] = 0; } // a new turret on this cell starts full
    if ((W.tcd[i] = (W.tcd[i] || 0) - dt) > 0 || O.tam[i] <= 0) continue;
    const x = cx_(i) + 0.5, y = cy_(i) + 0.5, L = cl_(i), z0 = L * FH + 0.95;
    let best = null, bs = -1e9;
    for (const z of W.zs) {
      if (z.hp <= 0 || z.hidden || z.sleep || Math.abs(z.L - L) > 1) continue; const d = Math.hypot(z.x - x, z.y - y); if (d > T.range) continue;
      let sc = -d;
      if (T.k === 'snipe') sc = z.hp + (ZT[z.k].boss ? 1e4 : 0) - d;                                   // the toughest thing in range
      if (T.k === 'frost') { sc = -d * 0.1 - (cloudAt(z.x, z.y, z.z) & 1 ? 4 : 0); for (const q of W.zs) if (q !== z && q.hp > 0 && Math.abs(q.x - z.x) < 1.8 && Math.abs(q.y - z.y) < 1.8) sc++; } // the thickest knot not already slowed
      if (sc <= bs || !los(x, y, z0, z.x, z.y, z.z + z.h * 0.6)) continue; bs = sc; best = z;
    }
    if (!best) { W.tcd[i] = 0.25; continue; }
    W.tcd[i] = T.rate; O.tam[i]--; if (O.tam[i] === 0 || O.tam[i] % (T.ammo >= 100 ? 40 : 10) === 0) objChanged();
    const bd = Math.hypot(best.x - x, best.y - y) || 1, ux = (best.x - x) / bd, uy = (best.y - y) / bd, mul = 1 + 0.12 * W.upg, yaw = Math.atan2(uy, ux);
    KSRC = 'turret';
    if (T.k === 'shot') { // a cone: everything in it close by gets the full load and is pushed back
      let n = 0;
      for (const z of W.zs) {
        if (n >= 8 || z.hp <= 0 || z.hidden || Math.abs(z.L - L) > 1) continue; const dx = z.x - x, dy = z.y - y, d = Math.hypot(dx, dy) || 0.1;
        if (d > T.range + z.r || Math.abs(angDiff(yaw, Math.atan2(dy, dx))) > T.cone + z.r / Math.max(d, 0.5) || !los(x, y, z0, z.x, z.y, z.z + z.h * 0.5)) continue;
        const f = d < 2 ? 1 : Math.max(0.4, 1 - (d - 2) / (T.range - 2) * 0.6), heavy = ZT[z.k].boss ? 6 : z.k === 'brute' ? 3 : z.k === 'armored' ? 2 : 1;
        hurtZombie(z, T.dmg * T.pellets * f * mul, null, dx / d * T.kb * f / heavy, dy / d * T.kb * f / heavy); n++;
      }
    } else if (T.k === 'frost') { (W.cz = W.cz || []).push({ k: 1, x: r2(best.x), y: r2(best.y), z: r2(Math.max(0, best.z - 0.2)), r: 1.8, t: 2.5 }); hurtZombie(best, T.dmg * mul, null, 0, 0); }
    else { const kb = T.k === 'snipe' ? 2.5 : 0.6; hurtZombie(best, T.dmg * mul, null, ux * kb, uy * kb); }
    KSRC = '';
    emit({ k: 'tshot', i, w: T.k, x: r2(x), y: r2(y), z: r2(z0), tx: r2(best.x), ty: r2(best.y), tz: r2(best.z + best.h * 0.6) });
    noiseAt(x, y, T.k === 'frost' ? 3 : T.k === 'snipe' ? 12 : 7, z0 - 0.95);
  }
}
function turretUse(p, i, b) { const T = TUR[b]; if (!T) return null; const a = W.obj && W.obj.tam && W.obj.tam[i] != null ? W.obj.tam[i] : T.ammo; return a < T.ammo * 0.5 ? { k: 'tur', i, t: 1, name: '给' + B[b].name + '装弹（' + a + '/' + T.ammo + '，' + T.refill.parts + ' 零件）' } : null; }
function turretDone(p, tgt) {
  const b = W.blk[tgt.i], T = TUR[b]; if (!T) return;
  if (!affordable(W.res, T.refill)) return emit({ k: 'deny', p: p.i, why: '零件不够（要 ' + T.refill.parts + ' 个）' });
  for (const r in T.refill) W.res[r] -= T.refill[r]; (W.obj.tam = W.obj.tam || {})[tgt.i] = T.ammo; objChanged(); emit({ k: 'sfx', n: 'reload', x: p.x, y: p.y });
}
