/* ================= the house: rooms, doors, walls, random furnishing ================= */
const ROOMS = [
  { id: 'kitchen', n: '厨房', r: [0, 0, 7, 7], fl: 'tile', fc: ['#e8e4dc', '#d6d0c4'] },
  { id: 'dining', n: '餐厅', r: [7, 0, 13, 7], fl: 'wood', fc: ['#c99e6e', '#b88d5e'] },
  { id: 'bed', n: '主卧', r: [13, 0, 20, 7], fl: 'carpet', fc: ['#b9b3c9', '#ada6be'] },
  { id: 'bath', n: '浴室', r: [20, 0, 24, 7], fl: 'tile', fc: ['#cfe3ea', '#b9d3dc'] },
  { id: 'living', n: '客厅', r: [0, 7, 10, 16], fl: 'wood', fc: ['#d4ad7c', '#c39c6b'] },
  { id: 'hall', n: '走廊', r: [10, 7, 13, 16], fl: 'wood', fc: ['#b98d5e', '#a87d50'] },
  { id: 'study', n: '书房', r: [13, 7, 19, 16], fl: 'wood', fc: ['#a8825c', '#98734e'] },
  { id: 'kids', n: '儿童房', r: [19, 7, 24, 16], fl: 'carpet', fc: ['#bfd9b4', '#b2cea6'] },
  { id: 'garden', n: '花园', r: [0, 16, 24, 22], fl: 'grass', fc: ['#8cc06a', '#82b660'], out: 1 }
];
ROOMS.forEach((r, i) => r.i = i);
// v:1 = gap in a vertical wall x=c, v:0 = gap in a horizontal wall y=c; gap runs a..b
const DOORS = [
  { v: 1, c: 7, a: 2.6, b: 4.0 }, { v: 0, c: 7, a: 2.0, b: 3.4 }, { v: 0, c: 7, a: 10.8, b: 12.2 }, { v: 1, c: 10, a: 11, b: 12.4 },
  { v: 1, c: 13, a: 9.0, b: 10.4 }, { v: 1, c: 13, a: 4.6, b: 6.0 }, { v: 1, c: 20, a: 2.4, b: 3.8 }, { v: 1, c: 19, a: 12, b: 13.4 },
  { v: 0, c: 7, a: 21, b: 22.4 }, { v: 0, c: 7, a: 15.2, b: 16.6 }, { v: 0, c: 16, a: 10.8, b: 12.2 }, { v: 0, c: 16, a: 3.4, b: 5.4 }
];
const HOUSE = { w: 24, h: 22 }, WALL_T = 0.16;
const SPAWN_SEEK = [11.5, 20.7], SPAWN_HIDE = [11.5, 11.7];
const DOORZ = DOORS.map(d => d.v ? [d.c - 1.1, d.a - .1, d.c + 1.1, d.b + .1] : [d.a - .1, d.c - 1.1, d.b + .1, d.c + 1.1]);
const GARDEN_PATH = [10.3, 16, 12.7, 22];
const ovl = (a, b, m) => { m = m || 0; return a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m; };
const inner = room => [room.r[0] + WALL_T / 2, room.r[1] + WALL_T / 2, room.r[2] - WALL_T / 2, room.r[3] - WALL_T / 2];
function fpOf(k, r, x, y) { const [w, d] = footWD(k, r); return [x - w / 2, y - d / 2, x + w / 2, y + d / 2]; }
function roomAt(x, y, pad) { pad = pad || 0; for (const r of ROOMS) if (x >= r.r[0] - pad && x <= r.r[2] + pad && y >= r.r[1] - pad && y <= r.r[3] + pad) return r; return null; }
function roomsNear(x, y, pad) { const out = []; for (const r of ROOMS) if (x >= r.r[0] - pad && x <= r.r[2] + pad && y >= r.r[1] - pad && y <= r.r[3] + pad) out.push(r.i); return out; }

/* ---------- walls (built once) ---------- */
const WALLS = (() => {
  const lines = [  // [horizontal?, c, a, b, height, fence]
    [1, 0, 0, 24, 2.4], [1, 7, 0, 24, .5], [1, 16, 0, 24, .5], [1, 22, 0, 24, .7, 1],
    [0, 0, 0, 16, 2.4], [0, 24, 0, 16, .5], [0, 7, 0, 7, .5], [0, 13, 0, 7, .5], [0, 20, 0, 7, .5],
    [0, 10, 7, 16, .5], [0, 13, 7, 16, .5], [0, 19, 7, 16, .5], [0, 0, 16, 22, .7, 1], [0, 24, 16, 22, .7, 1]
  ];
  const out = [];
  for (const [hz, c, a, b, h, fence] of lines) {
    let spans = [[a, b]];
    for (const d of DOORS) if ((d.v === 0) === !!hz && d.c === c) spans = spans.flatMap(([s, e]) => d.b <= s || d.a >= e ? [[s, e]] : [[s, d.a], [d.b, e]].filter(q => q[1] - q[0] > .01));
    for (const [s, e] of spans) {
      const n = Math.max(1, Math.round(e - s));
      for (let i = 0; i < n; i++) {
        let s0 = s + (e - s) * i / n, s1 = s + (e - s) * (i + 1) / n;
        const t = fence ? .06 : WALL_T / 2;
        if (i === 0 && s === a) s0 -= t; if (i === n - 1 && e === b) s1 += t;
        const fp = hz ? [s0, c - t, s1, c + t] : [c - t, s0, c + t, s1];
        const w = { wall: 1, fence: !!fence, h, fp, tall: h > 1 };
        const box = (x0, y0, x1, y1, z0, z1, col) => ({ pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, c: col });
        if (fence) {
          const [x0, y0, x1, y1] = fp, px = hz ? [x0, y0, x0 + .09, y1] : [x0, y0, x1, y0 + .09];
          w.pr = [box(px[0], px[1], px[2], px[3], 0, .74, '#f4efe4'), box(x0, y0 + (hz ? .015 : 0), x1, y1 - (hz ? .015 : 0), .52, .6, '#e8e1d2'), box(x0, y0 + (hz ? .015 : 0), x1, y1 - (hz ? .015 : 0), .24, .32, '#e8e1d2')];
        } else {
          const col = h > 1 ? '#e2d6c0' : '#efe6d6';
          w.pr = [box(fp[0], fp[1], fp[2], fp[3], 0, h, col), box(fp[0] - .005, fp[1] - .005, fp[2] + .005, fp[3] + .005, h, h + .03, '#9c8a72')];
          if (h > 1) w.pr.splice(1, 0, box(fp[0], fp[1], fp[2], fp[3] + .004, 0, .9, '#c9b28e'));
        }
        out.push(w);
      }
    }
  }
  return out;
})();

/* ---------- random furnishing (deterministic from the seed; no trig here) ---------- */
function genMap(seed) {
  const R = mkRng(seed ^ 0x5bd1e995), M = { seed, items: [] };
  const X = { R, M, vv: {}, ri: (a, b) => a + Math.floor(R() * (b - a + 1)), rf: (a, b) => a + R() * (b - a), ch: a => a[Math.floor(R() * a.length)] };
  for (const room of ROOMS) GEN[room.id](room, X);
  M.items.forEach((it, i) => { it.id = i; it.pr = prismsFor(it.k, it.v, it.r, it.x, it.y); it.flat = !!T[it.k].flat; it.room = roomAt(it.x, it.y).i; it.wob = 0; it.mark = -1; });
  return M;
}
const snap = v => Math.round(v * 20) / 20;
const offR = (r, lx, ly) => { const [co, si] = ROT4[r & 3]; return [lx * co - ly * si, lx * si + ly * co]; };
function vOf(X, room, k) { const key = room.id + k; if (X.vv[key] == null) X.vv[key] = Math.floor(X.R() * T[k].vars.length); return X.vv[key]; }
function canPut(X, room, k, r, x, y, m) {
  const f = fpOf(k, r, x, y), ib = inner(room), e = .035, flat = !!T[k].flat;
  if (f[0] < ib[0] - e || f[1] < ib[1] - e || f[2] > ib[2] + e || f[3] > ib[3] + e) return false;
  for (const z of DOORZ) if (ovl(f, z)) return false;
  if (room.id === 'garden' && ovl(f, GARDEN_PATH)) return false;
  for (const it of X.M.items) { const fl2 = !!T[it.k].flat; if (flat !== fl2) continue; if (ovl(f, it.fp, m)) return false; }
  return true;
}
function put(X, room, k, r, x, y, v) { const it = { k, v: v == null ? vOf(X, room, k) : v, r: r & 3, x: snap(x), y: snap(y) }; it.fp = fpOf(k, it.r, it.x, it.y); X.M.items.push(it); return it; }
function tryPut(X, room, k, r, x, y, m) { x = snap(x); y = snap(y); return canPut(X, room, k, r, x, y, m == null ? .04 : m) ? put(X, room, k, r, x, y) : null; }
// side: 0=N 1=E 2=S 3=W ; the piece's back goes against that wall
function wallPut(X, room, k, o) {
  o = o || {}; const ib = inner(room), sides = o.sides || [0, 1, 2, 3], gap = o.gap || 0;
  for (let t = 0; t < (o.tries || 40); t++) {
    const s = X.ch(sides), r = s, [w, d] = footWD(k, r);
    let x, y;
    const along = (lo, hi, sz) => o.corner ? (X.R() < .5 ? lo + sz / 2 : hi - sz / 2) : X.rf(lo + sz / 2, hi - sz / 2);
    if (s === 0) { y = ib[1] + d / 2 + gap; x = along(ib[0], ib[2], w); }
    else if (s === 2) { y = ib[3] - d / 2 - gap; x = along(ib[0], ib[2], w); }
    else if (s === 1) { x = ib[2] - w / 2 - gap; y = along(ib[1], ib[3], d); }
    else { x = ib[0] + w / 2 + gap; y = along(ib[1], ib[3], d); }
    const it = tryPut(X, room, k, r, x, y, o.m == null ? .05 : o.m); if (it) return it;
  }
  return null;
}
function freePut(X, room, k, o) {
  o = o || {}; const ib = inner(room);
  for (let t = 0; t < (o.tries || 40); t++) {
    const r = o.r != null ? o.r : X.ri(0, 3); let x, y;
    if (o.near) { x = o.near[0] + X.rf(-o.near[2], o.near[2]); y = o.near[1] + X.rf(-o.near[2], o.near[2]); }
    else { x = X.rf(ib[0] + .4, ib[2] - .4); y = X.rf(ib[1] + .4, ib[3] - .4); }
    const it = tryPut(X, room, k, r, x, y, o.m == null ? .45 : o.m); if (it) return it;
  }
  return null;
}
const times = (X, a, b, f) => { const n = X.ri(a, b); for (let i = 0; i < n; i++) f(i); };
// a piece plus things arranged around it in its local frame: [k, lx, ly, dr]  (dr = rotation relative to the anchor)
function around(X, room, anchor, list, m) { for (const [k, lx, ly, dr] of list) { const [ox, oy] = offR(anchor.r, lx, ly); tryPut(X, room, k, (anchor.r + dr) & 3, anchor.x + ox, anchor.y + oy, m == null ? .02 : m); } }
function diningSet(X, room, cx, cy, chairs) {
  const r = X.ri(0, 1), t = tryPut(X, room, 'dtable', r, cx, cy, .9) || freePut(X, room, 'dtable', { r, m: .9 });
  if (!t) return;
  const L = [['chair', -.4, -.74, 0], ['chair', .4, -.74, 0], ['chair', -.4, .74, 2], ['chair', .4, .74, 2]];
  if (chairs > 4) L.push(['chair', -1.08, 0, 3]); if (chairs > 5) L.push(['chair', 1.08, 0, 1]);
  around(X, room, t, L);
}
function sofaSet(X, room) {
  const s = X.ri(0, 3), sofa = wallPut(X, room, 'sofa', { sides: [s], m: .3 }) || wallPut(X, room, 'sofa', { m: .3 }); if (!sofa) return;
  around(X, room, sofa, [['ctable', 0, 1.05, 0], ['rug', 0, 1.15, 0]], .05);
  if (X.R() < .8) around(X, room, sofa, [['armchair', -1.55, 1.1, 1]], .1);
  if (X.R() < .5) around(X, room, sofa, [['armchair', 1.55, 1.1, 3]], .1);
  wallPut(X, room, 'tv', { sides: [(sofa.r + 2) & 3], m: .2 });
}
function deskSet(X, room, ck) { const d = wallPut(X, room, 'desk', { m: .5 }); if (d) around(X, room, d, [[ck || 'ochair', -.15, .62, 2]], .02); return d; }
function bedSet(X, room, k) {
  const b = wallPut(X, room, k || 'bed', { sides: k ? [0, 1, 2, 3] : [0], m: .3 }); if (!b) return;
  const [w, d] = [T[b.k].w, T[b.k].d];
  if (!k) around(X, room, b, [['nstand', -(w / 2 + .27), -d / 2 + .2, 0], ['nstand', w / 2 + .27, -d / 2 + .2, 0]]);
  if (X.R() < .5) around(X, room, b, [['rug', 0, d / 2 + .3, 0]], .05);
}
const GEN = {
  kitchen(room, X) {
    const ib = inner(room); let x = X.R() < .5 ? .1 : .9;
    const seq = ['fridge', 'counter', 'stove', 'counter', 'sink', 'counter', 'counter'].slice(0, X.ri(5, 7));
    if (X.R() < .5) seq.reverse();
    for (const k of seq) { const [w, d] = footWD(k, 0); if (tryPut(X, room, k, 0, x + w / 2, ib[1] + d / 2, -.001)) x += w; }
    if (X.R() < .6) { const c1 = tryPut(X, room, 'counter', 2, 3.1, 3.6, .7); if (c1) { tryPut(X, room, 'counter', 2, 3.9, 3.6, -.001); times(X, 2, 3, i => tryPut(X, room, 'stool', 0, 2.9 + i * .65, 4.35, .05)); } }
    else diningSet(X, room, 3.4, 3.8, 4);
    times(X, 1, 2, () => wallPut(X, room, 'trash', { sides: [1, 2, 3] }));
    if (X.R() < .6) wallPut(X, room, 'plant', { corner: 1 });
    times(X, 0, 2, () => freePut(X, room, 'box'));
    if (X.R() < .5) wallPut(X, room, 'cabinet', { sides: [3, 2] });
    times(X, 0, 2, () => freePut(X, room, 'stool', { m: .3 }));
  },
  dining(room, X) {
    diningSet(X, room, X.rf(9.4, 10.6), X.rf(3.0, 3.8), X.ri(4, 6));
    times(X, 1, 2, () => wallPut(X, room, X.ch(['dresser', 'cabinet', 'shelf'])));
    times(X, 1, 3, () => wallPut(X, room, 'plant', { corner: 1 }));
    if (X.R() < .6) wallPut(X, room, 'clock');
    if (X.R() < .5) wallPut(X, room, 'lamp', { corner: 1 });
    if (X.R() < .4) wallPut(X, room, 'radiator', { sides: [0] });
  },
  bed(room, X) {
    bedSet(X, room);
    times(X, 1, 2, () => wallPut(X, room, 'wardrobe', { sides: [1, 2, 3] }));
    if (X.R() < .7) wallPut(X, room, 'dresser', { sides: [1, 2, 3] });
    times(X, 0, 1, () => wallPut(X, room, 'plant', { corner: 1 }));
    times(X, 0, 2, () => X.R() < .5 ? wallPut(X, room, 'suitcase') : freePut(X, room, 'suitcase'));
    if (X.R() < .6) wallPut(X, room, 'basket');
    if (X.R() < .5) wallPut(X, room, 'armchair', { corner: 1 });
    if (X.R() < .5) wallPut(X, room, 'lamp', { corner: 1 });
    times(X, 0, 2, () => freePut(X, room, 'box'));
  },
  bath(room, X) {
    wallPut(X, room, 'tub', { sides: [0, 1], corner: 1 });
    wallPut(X, room, 'toilet', { sides: [1, 3, 0] });
    times(X, 1, 2, () => wallPut(X, room, 'sink', { m: .03 }));
    wallPut(X, room, 'washer');
    times(X, 1, 2, () => wallPut(X, room, 'basket'));
    wallPut(X, room, 'trash');
    if (X.R() < .6) wallPut(X, room, 'cabinet');
    if (X.R() < .5) wallPut(X, room, 'plant', { corner: 1 });
  },
  living(room, X) {
    sofaSet(X, room);
    times(X, 2, 3, () => wallPut(X, room, 'plant', { corner: 1 }));
    times(X, 1, 2, () => wallPut(X, room, 'lamp', { corner: 1 }));
    times(X, 0, 2, () => wallPut(X, room, 'shelf'));
    if (X.R() < .5) freePut(X, room, 'beanbag');
    if (X.R() < .4) wallPut(X, room, 'piano');
    if (X.R() < .5) wallPut(X, room, 'clock');
    times(X, 0, 1, () => freePut(X, room, 'armchair'));
    times(X, 0, 2, () => freePut(X, room, 'box'));
  },
  hall(room, X) {
    const pool = ['shoes', 'coat', 'umb', 'plant', 'plant', 'box', 'clock', 'cabinet', 'coat', 'box', 'radiator'];
    times(X, 5, 7, () => wallPut(X, room, X.ch(pool), { sides: [1, 3], m: .08 }));
  },
  study(room, X) {
    deskSet(X, room); if (X.R() < .5) deskSet(X, room);
    times(X, 2, 4, () => wallPut(X, room, 'shelf', { m: .02 }));
    if (X.R() < .7) wallPut(X, room, 'armchair', { corner: 1 });
    wallPut(X, room, 'lamp', { corner: 1 });
    times(X, 1, 3, () => X.R() < .5 ? freePut(X, room, 'box') : wallPut(X, room, 'box'));
    times(X, 1, 2, () => wallPut(X, room, 'plant', { corner: 1 }));
    if (X.R() < .4) freePut(X, room, 'rug', { m: .1 });
    if (X.R() < .5) wallPut(X, room, 'cabinet');
    if (X.R() < .4) wallPut(X, room, 'clock');
  },
  kids(room, X) {
    bedSet(X, room, 'kbed');
    wallPut(X, room, 'toychest');
    times(X, 1, 2, () => freePut(X, room, 'beanbag'));
    times(X, 1, 3, () => freePut(X, room, 'ball', { m: .3 }));
    times(X, 0, 2, () => freePut(X, room, 'box'));
    if (X.R() < .6) deskSet(X, room, 'chair');
    if (X.R() < .6) wallPut(X, room, 'shelf');
    if (X.R() < .5) wallPut(X, room, 'plant', { corner: 1 });
    if (X.R() < .5) freePut(X, room, 'rug', { m: .1 });
    if (X.R() < .5) wallPut(X, room, 'basket');
  },
  garden(room, X) {
    times(X, 4, 7, () => wallPut(X, room, 'fpot', { sides: [0], m: .15 }));
    times(X, 5, 8, () => wallPut(X, room, 'bush', { sides: [1, 2, 3], m: .2 }));
    times(X, 1, 3, () => freePut(X, room, 'bush', { m: .6 }));
    times(X, 1, 2, () => freePut(X, room, 'bench', { r: X.ch([0, 2]), m: .6 }));
    times(X, 1, 2, () => wallPut(X, room, 'bin', { sides: [0], m: .05 }));
    times(X, 0, 2, () => freePut(X, room, 'barrel', { m: .5 }));
    if (X.R() < .6) freePut(X, room, 'ball', { m: .4 });
    times(X, 0, 2, () => wallPut(X, room, 'plant', { sides: [0], m: .1 }));
  }
};
