/* ================= (round 33) outskirts: themed scenes in the ring around the classic 160×160 map ================= */
// Each map grew to 240×240 with the old layout in the middle (MOFF). The 40-tile ring around it gets about a dozen scenes picked from
// ten scene types that fit the map's theme, each a small cluster of buildings (normal lots, so they get interiors, loot, sleepers)
// and props, joined to the old roads by a short road (a bridge over water). Placement is fixed per map (seeded by the map id).
const SC = {};
// helpers each scene builder gets, in its own local coordinates: at(x, y, id, d), lot(x0, y0, x1, y1, tt), ring(x0, y0, x1, y1, id, gapEvery), scatter(id, n, x0, y0, x1, y1), r()
SC.farm = { w: 30, h: 26, lots: [[2, 2, 15, 11, 1, 'barn'], [18, 2, 29, 11, 2, 'villa']], props(P) { P.lot(2, 14, 27, 24, TT.dirt); for (let y = 15; y <= 23; y += 2) for (let x = 3; x <= 26; x++) P.lot(x, y, x, y, TT.grass); P.ring(1, 13, 28, 25, 27, 7); P.scatter(26, 4, 3, 14, 26, 24); P.at(16, 13, 25, 0); P.scatter(22, 3, 0, 0, 29, 1); } };
SC.gas = { w: 26, h: 20, lots: [[2, 2, 15, 11, 1, 'shop']], props(P) { P.lot(0, 12, 25, 19, TT.road); P.lot(17, 2, 25, 11, TT.road); for (const [x, y] of [[19, 5], [22, 5], [19, 8], [22, 8]]) P.at(x, y, 37); P.at(16, 3, 38); P.at(24, 14, 25, 1); P.at(5, 16, 25, 0); P.at(13, 15, 32); } };
SC.motel = { w: 30, h: 18, lots: [[2, 2, 27, 9, 2, 'apt']], props(P) { P.lot(0, 11, 29, 17, TT.road); for (let x = 3; x <= 27; x += 5) if (P.r() < 0.7) P.at(x, 14, 25, P.r() < 0.5 ? 1 : 3); P.at(1, 10, 38); P.at(28, 10, 32); } };
SC.yard = { w: 30, h: 24, lots: [[2, 2, 19, 15, 2, 'ware']], props(P) { P.lot(0, 17, 29, 23, TT.dirt); P.lot(21, 0, 29, 23, TT.dirt); for (let k = 0; k < 7; k++) { const x = 22 + Math.floor(P.r() * 6), y = 2 + Math.floor(P.r() * 19); P.at(x, y, P.r() < 0.5 ? 26 : 36); } P.scatter(39, 4, 2, 18, 28, 22); P.at(10, 20, 25, 0); P.ring(0, 0, 29, 23, 27, 6); } };
SC.police = { w: 26, h: 22, lots: [[2, 2, 19, 13, 2, 'police']], props(P) { P.lot(0, 15, 25, 21, TT.road); for (const x of [4, 8, 16]) P.at(x, 18, 25, 0); for (let x = 1; x <= 24; x += 3) P.at(x, 15, 12); P.scatter(36, 3, 20, 2, 25, 13); P.at(22, 18, 37); } };
SC.clinic = { w: 26, h: 22, lots: [[2, 2, 17, 13, 2, 'clinic']], props(P) { P.lot(0, 15, 25, 21, TT.road); P.at(6, 18, 25, 0); P.at(13, 18, 25, 2); for (let k = 0; k < 4; k++) P.at(19 + (k % 2) * 3, 4 + Math.floor(k / 2) * 4, 26); P.at(20, 16, 31); P.at(23, 16, 31); } };
SC.camp = { w: 22, h: 18, lots: [], props(P) { P.lot(6, 5, 15, 12, TT.dirt); P.at(10, 8, 37); for (const [x, y] of [[7, 6], [14, 6], [7, 11], [14, 11]]) P.at(x, y, 26); P.scatter(40, 3, 3, 3, 18, 14); P.scatter(33, 2, 6, 5, 15, 12); P.scatter(32, 1, 6, 5, 15, 12); P.scatter(22, 8, 0, 0, 21, 17); } };
SC.junk = { w: 26, h: 22, lots: [[2, 2, 15, 11, 1, 'garage']], props(P) { P.lot(0, 13, 25, 21, TT.dirt); P.lot(17, 0, 25, 21, TT.dirt); P.scatter(39, 9, 1, 13, 24, 20); for (let k = 0; k < 5; k++) P.at(18 + Math.floor(P.r() * 7), 2 + Math.floor(P.r() * 18), 25, Math.floor(P.r() * 4)); P.ring(0, 0, 25, 21, 27, 5); } };
SC.mill = { w: 30, h: 24, lots: [[2, 2, 17, 13, 1, 'ware']], props(P) { P.lot(0, 15, 29, 23, TT.dirt); for (let k = 0; k < 8; k++) P.at(3 + Math.floor(P.r() * 25), 16 + Math.floor(P.r() * 7), 40); P.at(20, 4, 35); P.at(24, 9, 25, 1); P.scatter(22, 6, 19, 0, 29, 14); } };
SC.checkpoint = { w: 24, h: 16, lots: [], props(P) { P.lot(0, 6, 23, 9, TT.road); for (let x = 0; x <= 23; x++) if (x < 9 || x > 14) { P.at(x, 4, 27); P.at(x, 11, 27); } for (const x of [9, 14]) { P.at(x, 5, 12); P.at(x, 10, 12); } P.at(11, 2, 36); P.at(12, 13, 36); P.at(4, 7, 25, 0); P.at(19, 8, 25, 2); P.at(2, 2, 37); P.at(21, 13, 37); } };
SC.ruins = { w: 26, h: 22, lots: [], props(P) { P.lot(1, 1, 24, 20, TT.dirt); for (let k = 0; k < 4; k++) { const x0 = 2 + Math.floor(P.r() * 14), y0 = 2 + Math.floor(P.r() * 10), w = 5 + Math.floor(P.r() * 5), h = 4 + Math.floor(P.r() * 5); for (let x = x0; x <= x0 + w; x++) for (const y of [y0, y0 + h]) if (P.r() < 0.6) P.at(x, y, 24); for (let y = y0; y <= y0 + h; y++) for (const x of [x0, x0 + w]) if (P.r() < 0.6) P.at(x, y, 24); } P.scatter(29, 8, 1, 1, 24, 20); P.scatter(41, 6, 0, 0, 25, 21); } };
SC.houses = { w: 30, h: 24, lots: [[2, 2, 13, 11, 2, 'villa'], [16, 2, 27, 11, 2, 'villa'], [2, 13, 14, 22, 1, 'garage']], props(P) { P.lot(16, 14, 29, 23, TT.grass); P.scatter(41, 6, 16, 14, 29, 23); P.scatter(22, 3, 17, 15, 28, 22); P.at(20, 18, 25, 1); P.ring(15, 13, 29, 23, 27, 4); } };
SC.tower = { w: 24, h: 22, lots: [[2, 2, 21, 17, 5, 'apt']], props(P) { P.lot(0, 19, 23, 21, TT.road); P.at(4, 20, 25, 0); P.at(16, 20, 25, 0); P.at(22, 19, 32); P.at(1, 19, 38); } };
SC.park = { w: 26, h: 22, lots: [], props(P) { P.lot(2, 10, 23, 11, TT.dirt); P.lot(12, 2, 13, 19, TT.dirt); P.scatter(22, 9, 1, 1, 24, 20); P.scatter(41, 10, 1, 1, 24, 20); for (const [x, y] of [[8, 9], [17, 12], [11, 6], [14, 15]]) P.at(x, y, 31); P.at(14, 9, 32); P.ring(0, 0, 25, 21, 41, 3); } };
SC.quarry = { w: 24, h: 20, lots: [[13, 9, 23, 19, 1, 'garage']], props(P) { P.lot(0, 0, 12, 19, TT.dirt); for (let k = 0; k < 14; k++) P.at(Math.floor(P.r() * 12), Math.floor(P.r() * 19), 21); P.scatter(39, 3, 0, 0, 12, 19); P.at(16, 4, 25, 1); P.scatter(40, 2, 14, 0, 23, 7); } };
SC.base = { w: 30, h: 26, lots: [[2, 2, 17, 13, 2, 'police'], [19, 2, 29, 12, 1, 'garage']], props(P) { P.lot(0, 15, 29, 25, TT.road); P.ring(0, 0, 29, 25, 27, 9); for (const x of [6, 13, 22]) P.at(x, 19, 25, 0); P.scatter(36, 5, 1, 16, 28, 24); for (let x = 2; x <= 27; x += 4) P.at(x, 15, 12); } };
SC.shopblock = { w: 30, h: 18, lots: [[2, 2, 15, 11, 1, 'shop'], [16, 2, 28, 11, 1, 'shop']], props(P) { P.lot(0, 13, 29, 17, TT.road); for (const x of [4, 12, 20, 26]) if (P.r() < 0.7) P.at(x, 15, 25, 0); P.at(15, 12, 38); P.at(29, 12, 32); } };
SC.cabin = { w: 20, h: 18, lots: [[3, 3, 15, 12, 1, 'villa']], props(P) { P.lot(5, 13, 13, 16, TT.dirt); P.at(9, 15, 37); P.scatter(40, 3, 0, 13, 19, 17); P.scatter(22, 7, 0, 0, 19, 17); P.at(17, 6, 26); } };
SC.harbor = { w: 30, h: 20, lots: [[2, 2, 17, 12, 1, 'ware']], props(P) { P.lot(0, 14, 29, 19, TT.road); for (let k = 0; k < 8; k++) P.at(19 + Math.floor(P.r() * 10), 1 + Math.floor(P.r() * 12), [26, 36, 37][k % 3]); P.at(6, 16, 25, 0); P.at(14, 16, 25, 2); } };
SC.resort = { w: 30, h: 22, lots: [[2, 2, 14, 12, 2, 'villa'], [16, 2, 28, 12, 2, 'villa']], props(P) { P.lot(0, 14, 29, 21, TT.sand); for (const x of [4, 9, 20, 25]) P.at(x, 17, 31); P.scatter(22, 5, 0, 14, 29, 21); P.at(15, 18, 38); } };
SC.lighthouse = { w: 20, h: 20, lots: [[4, 4, 15, 15, 4, 'apt']], props(P) { P.lot(0, 0, 19, 19, TT.sand); P.at(2, 17, 37); P.at(17, 2, 26); P.at(17, 17, 26); P.scatter(21, 4, 0, 0, 19, 19); } };
const SCENES = {
  town: ['farm', 'gas', 'motel', 'yard', 'police', 'clinic', 'houses', 'junk', 'park', 'camp'],
  forest: ['mill', 'camp', 'cabin', 'police', 'ruins', 'quarry', 'farm', 'checkpoint', 'houses', 'yard'],
  desert: ['gas', 'motel', 'junk', 'quarry', 'ruins', 'checkpoint', 'base', 'camp', 'yard', 'police'],
  islands: ['resort', 'harbor', 'lighthouse', 'houses', 'camp', 'gas', 'clinic', 'ruins', 'park', 'yard'],
  snow: ['base', 'checkpoint', 'mill', 'cabin', 'ruins', 'yard', 'clinic', 'gas', 'camp', 'quarry'],
  city: ['tower', 'houses', 'yard', 'police', 'clinic', 'shopblock', 'motel', 'junk', 'park', 'ruins'],
};
const SCENE_NAME = { farm: '农场', gas: '加油站', motel: '汽车旅馆', yard: '货场', police: '警哨', clinic: '诊所', camp: '营地', junk: '废车场', mill: '伐木场', checkpoint: '检查站', ruins: '废墟', houses: '住宅区', tower: '高楼', park: '公园', quarry: '采石场', base: '军营', shopblock: '商业街', cabin: '小屋', harbor: '码头', resort: '度假屋', lighthouse: '灯塔' };
// slots in the ring: four along the top and bottom, three down each side (the scene sits somewhere inside its slot)
function outskirtsSlots() {
  const O = MOFF, E = MOFF + MW0, S = [];
  for (const x of [4, 64, 124, 184]) { S.push({ x0: x, y0: 3, x1: x + 52, y1: O - 3, side: 3 }); S.push({ x0: x, y0: E + 3, x1: x + 52, y1: MH - 3, side: 1 }); }
  for (const y of [O + 4, O + 58, O + 112]) { S.push({ x0: 3, y0: y, x1: O - 3, y1: y + 46, side: 2 }); S.push({ x0: E + 3, y0: y, x1: MW - 3, y1: y + 46, side: 0 }); }
  return S;
}
function outskirtsFor(id, ER) {
  const M = MAPS[id], list = SCENES[id] || SCENES.town; let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = mulberry(h ^ 0x5eed), slots = outskirtsSlots(), river = M.river ? (y => M.river.c(y - MOFF) + MOFF) : null;
  for (let k = slots.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [slots[k], slots[j]] = [slots[j], slots[k]]; }
  const order = list.slice(); for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
  const out = { lots: [], isles: [], hills: [], cars: [], crates: [], placed: [] };
  let n = 0;
  for (const sl of slots) {
    if (out.placed.length >= 12) break; const key = order[n % order.length], T = SC[key]; n++;
    const fw = sl.x1 - sl.x0 - T.w, fh = sl.y1 - sl.y0 - T.h; if (fw < 0 || fh < 0) continue;
    let x0 = sl.x0 + Math.floor(r() * (fw + 1)), y0 = sl.y0 + Math.floor(r() * (fh + 1));
    if (ER) { // keep off the roads running out to the map edge (try a few spots in the slot)
      const band = [ER.r, ER.b, ER.l, ER.t][sl.side], clash = (x, y) => [...band].some(c => sl.side % 2 ? c >= x - 3 && c <= x + T.w + 2 : c >= y - 3 && c <= y + T.h + 2);
      let t = 0; while (clash(x0, y0) && t++ < 40) { x0 = sl.x0 + Math.floor(r() * (fw + 1)); y0 = sl.y0 + Math.floor(r() * (fh + 1)); }
      /* (still clashing: place it anyway; the edge road stops at the scene, see widen) */
    }
    if (river) { let hit = false; for (let y = y0 - 2; y <= y0 + T.h + 2; y++) { const c = river(y); if (c > x0 - 6 && c < x0 + T.w + 3) hit = true; } if (hit) { const alt = x0 + (river(y0) < x0 + T.w / 2 ? 8 : -8); if (alt >= sl.x0 && alt + T.w <= sl.x1) x0 = alt; else continue; } }
    const pl = { key, x0, y0, x1: x0 + T.w - 1, y1: y0 + T.h - 1, side: sl.side, seed: Math.floor(r() * 1e9) };
    out.placed.push(pl);
    for (const l of T.lots) out.lots.push([l[0] + x0, l[1] + y0, l[2] + x0, l[3] + y0, l[4], l[5]]);
    out.isles.push([x0 + T.w / 2, y0 + T.h / 2, Math.max(T.w, T.h) * 0.72]);
  }
  // a few low hills out in the open, away from the scenes
  for (let k = 0; k < 5; k++) { const x = Math.floor(r() * MW), y = Math.floor(r() * MH); if (x > MOFF - 4 && x < MOFF + MW0 + 4 && y > MOFF - 4 && y < MOFF + MW0 + 4) continue; if (out.placed.some(p => x > p.x0 - 10 && x < p.x1 + 10 && y > p.y0 - 10 && y < p.y1 + 10)) continue; out.hills.push([x, y, 4 + r() * 4, r() < 0.5]); }
  for (let k = 0; k < 14; k++) { const x = Math.floor(r() * MW), y = Math.floor(r() * MH); if (x < MOFF || x >= MOFF + MW0 || y < MOFF || y >= MOFF + MW0) out.crates.push([x, y]); }
  // a road from each scene in to the nearest road (a bridge where it crosses water)
  out.roads = K => {
    for (const p of out.placed) {
      const cx = Math.floor((p.x0 + p.x1) / 2), cy = Math.floor((p.y0 + p.y1) / 2), [dx, dy] = [[-1, 0], [0, -1], [1, 0], [0, 1]][p.side];
      let x = p.side === 0 ? p.x0 - 1 : p.side === 2 ? p.x1 + 1 : cx, y = p.side === 1 ? p.y0 - 1 : p.side === 3 ? p.y1 + 1 : cy;
      for (let k = 0; k < 90 && inMap(x, y); k++) { if (k > 1 && TOWN_HOUSES.some(([a, b, c, d]) => x + Math.abs(dy) >= a - 1 && x <= c + 1 && y + Math.abs(dx) >= b - 1 && y <= d + 1)) break; /* never through a building */ const hit = K.roadCells.has(K.col(x, y)) || K.roadCells.has(K.col(x + Math.abs(dy), y + Math.abs(dx))); K.road(x, y); K.road(x + Math.abs(dy), y + Math.abs(dx)); if (hit && k > 1) break; x += dx; y += dy; }
    }
  };
  out.props = K => {
    for (const p of out.placed) {
      const T = SC[p.key], rr = mulberry(p.seed), X = p.x0, Y = p.y0;
      const nearRoad = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inMap(x + dx, y + dy) && K.tt[K.col(x + dx, y + dy)] === TT.road) return true; return false; };
      const KA = (x, y, id, d) => { if (id === 22 && nearRoad(x, y)) return; K.at(x, y, id, d); }; // no trees right by a road
      const P = { r: rr, at: (x, y, id, d) => KA(x + X, y + Y, id, d), lot: (a, b, c, d, t) => K.lot(a + X, b + Y, c + X, d + Y, t),
        ring: (a, b, c, d, id, gap) => { for (let x = a; x <= c; x++) for (const y of [b, d]) if (!gap || (x - a) % gap) KA(x + X, y + Y, id); for (let y = b + 1; y < d; y++) for (const x of [a, c]) if (!gap || (y - b) % gap) KA(x + X, y + Y, id); },
        scatter: (id, n, a, b, c, d) => { for (let k = 0; k < n; k++) KA(a + X + Math.floor(rr() * (c - a + 1)), b + Y + Math.floor(rr() * (d - b + 1)), id); } };
      T.props(P);
    }
  };
  return out;
}
// the outskirts scene a cell is in (for labels), or null
function sceneAt(x, y) { const X = MAPDEF && MAPDEF.outskirts; if (!X) return null; for (const p of X.placed) if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1) return p; return null; }
