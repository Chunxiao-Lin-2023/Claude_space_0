/* ================= 尸城求生 (siege) — the default mode since round 19 =================
   Zombies hold half the town: sleeping crowds inside buildings (and a few out in the open) wake when you come close
   or make noise. Clear a building and it is yours: build anywhere (no camp-only zone), with blueprints found in the
   world unlocking the better pieces — barricades, mines, turrets — and two vehicles. Each night the horde comes for
   wherever you are and the sun comes up on time; survive SIEGE.nights nights. Searching pays double, ammo boxes lie about. */
const SIEGE = {
  nights: 10, sleepR: 6.5, noiseR: 13, boomR: 20, chainR: 4.5,           // waking: sight range, gunshot / explosion hearing, a woken zombie rouses its neighbours
  tRange: 9, tRate: 0.32, tDmg: 18, tAmmo: 240, tRefill: { parts: 3 },  // turret
  loot: 2, mineR: 2.4, mineDmg: 200, spawnR: 24, vSpd: [1, 1.6, 2.3],    // search yield multiplier, mines, horde ring radius, vehicle speed
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
const sleeperKind = () => { const r = rand(); return r < 0.14 ? 'crawler' : r < 0.2 ? 'runner' : r < 0.23 ? 'bloater' : r < 0.25 ? 'armored' : 'walker'; };
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
      const n = clamp(Math.round((x1 - x0) * (y1 - y0) / 24) + st * 2, 6, 18), id = O.occ.length;
      for (let j = 0; j < n; j++) { const [x, y, L] = cells[Math.floor(rand() * cells.length)]; const z = putZombie(sleeperKind(), x, y, L); z.sleep = 1; z.mz = 1; z.occ = id; z.face = rand() * 6.28; }
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
      W.wakeT = 0.2;
      for (const z of W.zs) {
        if (!z.sleep || z.hp <= 0) continue;
        if (z.wakeAt && W.t >= z.wakeAt) { siegeWake(z); continue; }
        let wake = false;
        for (const p of ap) { const d = Math.hypot(p.x - z.x, p.y - z.y); if (d < SIEGE.sleepR && Math.abs(p.L - z.L) <= 1 && (d < 2 || los(z.x, z.y, z.z + 1, p.x, p.y, p.z + 0.8))) { wake = true; break; } }
        if (!wake) for (const e of W.noise) if (Math.hypot(e.x - z.x, e.y - z.y) < e.r) { wake = true; break; }
        if (wake) siegeWake(z);
      }
    }
    // cleared buildings
    const alive = O.occ.map(() => 0); for (const z of W.zs) if (z.hp > 0 && z.occ != null && alive[z.occ] != null) alive[z.occ]++;
    O.occ.forEach((q, k) => {
      if (q.left !== alive[k]) { q.left = alive[k]; objChanged(); }
      if (!q.c && alive[k] === 0) { q.c = 1; for (const r in SIEGE.clearRw) W.res[r] += SIEGE.clearRw[r]; objChanged(); modeSay((q.out ? '野外尸群清掉了' : '清理完：' + q.name + '，现在是你们的据点了') + '（+' + SIEGE.clearRw.parts + ' 零件 +' + SIEGE.clearRw.steel + ' 钢材）', '#8fe39a', true); }
    });
    // turrets
    if (W.turV !== W.ver) { W.turV = W.ver; W.tur = []; for (let i = 0; i < NC; i++) if (W.blk[i] === 52) W.tur.push(i); }
    W.tcd = W.tcd || {};
    for (const i of W.tur) {
      if (W.blk[i] !== 52) continue;
      if (O.tam[i] == null) O.tam[i] = SIEGE.tAmmo;
      if ((W.tcd[i] = (W.tcd[i] || 0) - dt) > 0 || O.tam[i] <= 0) continue;
      const x = cx_(i) + 0.5, y = cy_(i) + 0.5, z0 = cl_(i) * FH + 0.95;
      let best = null, bd = SIEGE.tRange;
      for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.L - cl_(i)) > 1) continue; const d = Math.hypot(z.x - x, z.y - y); if (d < bd && los(x, y, z0, z.x, z.y, z.z + z.h * 0.6)) { bd = d; best = z; } }
      if (!best) { W.tcd[i] = 0.25; continue; }
      W.tcd[i] = SIEGE.tRate; O.tam[i]--; if (O.tam[i] === 0 || O.tam[i] % 40 === 0) objChanged();
      KSRC = 'turret'; hurtZombie(best, SIEGE.tDmg * (1 + 0.12 * W.upg), null, (best.x - x) / (bd || 1) * 0.6, (best.y - y) / (bd || 1) * 0.6); KSRC = '';
      emit({ k: 'tshot', i, x: r2(x), y: r2(y), z: r2(z0), tx: r2(best.x), ty: r2(best.y), tz: r2(best.z + best.h * 0.6) });
      W.noise.push({ x, y, r: SIEGE.noiseR * 0.6, t: W.t });
    }
  },
  use(p, i, b) { if (b !== 52) return null; const a = W.obj.tam[i] == null ? SIEGE.tAmmo : W.obj.tam[i]; return a < SIEGE.tAmmo * 0.5 ? { k: 'obj', i, t: 1, name: '给机枪塔装弹（' + a + '/' + SIEGE.tAmmo + '，3 零件）' } : null; },
  done(p, tgt) { if (W.blk[tgt.i] !== 52) return; if (!affordable(W.res, SIEGE.tRefill)) return emit({ k: 'deny', p: p.i, why: '零件不够（要 3 个）' }); for (const r in SIEGE.tRefill) W.res[r] -= SIEGE.tRefill[r]; W.obj.tam[tgt.i] = SIEGE.tAmmo; objChanged(); emit({ k: 'sfx', n: 'reload', x: p.x, y: p.y }); },
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
function siegeWake(z) {
  if (!z.sleep) return; z.sleep = 0; z.wakeAt = 0; z.rage = 1.2;
  for (const o of W.zs) if (o.sleep && !o.wakeAt && o.L === z.L && Math.hypot(o.x - z.x, o.y - z.y) < SIEGE.chainR) o.wakeAt = W.t + 0.3 + rand() * 0.9;
}
// a blueprint from a search (siege only): returns its name or ''
function siegeBlueprint(kind, sure) {
  if (!isSiege()) return '';
  const O = W.obj, left = BP_LIST.filter(k => !O.bp.includes(k));
  if (!left.length || (!sure && !(rand() < (SIEGE.bpOdds[kind] || 0)))) return '';
  const k = left[Math.floor(rand() * left.length)]; O.bp.push(k); objChanged();
  modeSay('找到蓝图：' + bpName(k) + (typeof k === 'number' ? '（建造栏里解锁了）' : '（制作里能造了）'), '#7fd0ff', true);
  return '蓝图·' + bpName(k);
}
// gunfire and blasts wake sleepers
function noiseAt(x, y, r) { if (isSiege()) (W.noise = W.noise || []).push({ x, y, r, t: W.t }); }
// the horde comes out on a ring round the survivors (or the camp if nobody is about)
function siegeEdges() {
  const ap = alivePl(); if (!ap.length) return edgeSpawns();
  const cx = Math.round(ap.reduce((s, p) => s + p.x, 0) / ap.length), cy = Math.round(ap.reduce((s, p) => s + p.y, 0) / ap.length);
  const e = edgeSpawns(cx, cy, SIEGE.spawnR, true); return [0, 1, 2, 3].some(s => e[s].length) ? e : edgeSpawns();
}
