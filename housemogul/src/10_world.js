/* ================= world: map layout, properties, valuation ================= */
const N = 25;
const T_GRASS = 0, T_ROAD = 1, T_WATER = 2, T_PLAZA = 3, T_PATH = 4;
/* 5-tile blocks between roads (y = 2, 8, 14, 20; x = 5, 11, 17). Every house keeps a one-tile yard
   around it (no two houses touch, not even diagonally), so each one is easy to tap. */
const XR = [[0, 4], [6, 10], [12, 16], [18, 24]], YR = [[3, 7], [9, 13], [15, 19], [21, 24]];
const BLOCKS_DEF = [
  [0, 0, 'river', '滨江大道'], [1, 0, 'river', '望江路'], [2, 0, 'river', '观澜路'], [3, 0, 'river', '江湾路'],
  [0, 1, 'old', '梧桐巷'], [1, 1, 'old', '槐花街'], [2, 1, 'tech', '创新大道'], [3, 1, 'tech', '云谷路'],
  [0, 2, 'old', '鼓楼街'], [1, 2, 'school', '学府路'], [2, 2, 'school', '书院街'],
  [0, 3, 'sub', '柳岸村'], [1, 3, 'sub', '桃园路'], [2, 3, 'sub', '麦田路']
];
const ti = (x, y) => y * N + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const MANSION_XY = [20, 21];
// can a w×h house stand at (x, y) inside block b? tiles must be free grass and no other house may touch it
function lotFree(props, deco, tiles, b, x, y, w, h) {
  if (x < b.x0 || y < b.y0 || x + w - 1 > b.x1 || y + h - 1 > b.y1) return false;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (tiles[ti(x + i, y + j)] !== T_GRASS) return false;
  for (const o of deco) if (x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y) return false;
  for (const o of props) if (!o.gone && x - 1 < o.x + o.w && x + w + 1 > o.x && y - 1 < o.y + o.h && y + h + 1 > o.y) return false;
  return true;
}

function genWorld() {
  const tiles = new Array(N * N).fill(T_GRASS), tdist = new Array(N * N).fill(-1);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let t = T_GRASS;
    if (y <= 1) t = T_WATER;
    else if (y === 2 || y === 8 || y === 14) t = T_ROAD;
    else if (y === 20 && x <= 16) t = T_ROAD;
    else if ((x === 5 || x === 11 || x === 17) && y >= 2) t = T_ROAD;
    tiles[ti(x, y)] = t;
  }
  const blocks = [], props = [], deco = [];
  const streetNo = {};
  const addProp = (kind, b, x, y, cond) => {
    const K = KINDS[kind];
    if (!lotFree(props, deco, tiles, b, x, y, K.w, K.h)) return null;
    streetNo[b.st] = (streetNo[b.st] || 0) + 1 + (kind === 'mansion' ? 0 : ri(0, 1));
    const p = {
      id: props.length, kind, d: b.d, x, y, w: K.w, h: K.h, st: b.st, num: kind === 'mansion' ? 1 : streetNo[b.st], b: blocks.indexOf(b),
      q: kind === 'mansion' ? 1 : clamp(1 + gauss() * 0.06, 0.86, 1.14),
      cond: cond != null ? cond : wpick(b.d === DI.old || b.d === DI.sub ? [{ v: 0, w: 5 }, { v: 1, w: 4 }, { v: 2, w: 1 }] : [{ v: 0, w: 2 }, { v: 1, w: 5 }, { v: 2, w: 3 }]).v,
      bonus: 0, owner: -1, loan: 0, paid: 0, boughtT: -99, reno: 0, renoTo: 0, list: null, offer: 0, insp: [], hist: [], cool: 0, j: 0, on: 0, hotT: 0, stage: null, bt: 0
    };
    props.push(p); return p;
  };
  const addDeco = (k, x, y, w, h, extra) => deco.push(Object.assign({ k, x, y, w, h }, extra || {}));
  // place up to n houses of size sz on a stride lattice inside block b, leaving `skip` lots empty for future builds
  const fill = (b, sz, n, kindFn) => {
    const st = sz + 1, lots = [];
    for (let y = b.y0; y + sz - 1 <= b.y1; y += st) for (let x = b.x0; x + sz - 1 <= b.x1; x += st) lots.push([x, y]);
    let k = 0; for (const [x, y] of shuffle(lots)) { if (k >= n) break; if (addProp(kindFn(), b, x, y)) k++; }
  };
  for (const [xi, yi, dk, st] of BLOCKS_DEF) {
    const [x0, x1] = XR[xi], [y0, y1] = YR[yi];
    const b = { x0, y0, x1, y1, d: DI[dk], st }; blocks.push(b);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tdist[ti(x, y)] = b.d;
    if (dk === 'river') {
      if (xi === 1) addDeco('plaza', x0 + 3, y0 + 3, 2, 2, { nm: '滨江广场' });
      if (xi === 3) addDeco('pond', x0 + 3, y0, 2, 2, { nm: '观澜湖' });
      if (xi === 0) addDeco('park', x0, y0 + 3, 2, 2, { nm: '滨江公园' });
      fill(b, 2, 3, () => 'riverflat');
    } else if (dk === 'old') {
      fill(b, 1, 7, () => rnd() < 0.6 ? 'bungalow' : 'walkup');
    } else if (dk === 'tech') {
      if (xi === 2) addDeco('mall', x0, y0 + 3, 4, 2, { nm: '星光商场' });
      else { addDeco('office', x0 + 3, y0, 2, 2, { nm: '云谷大厦' }); addDeco('office', x0 + 5, y0 + 3, 2, 2, { nm: '创新中心', lo: 1 }); }
      fill(b, 2, 3, () => 'techflat');
    } else if (dk === 'school') {
      if (xi === 1) { addDeco('school', x0, y0, 2, 5, { nm: '实验小学' }); fill(b, 1, 5, () => 'schoolflat'); }
      else { addProp('house', b, x0, y0); fill(b, 1, 4, () => 'schoolflat'); }
    } else if (dk === 'sub') {
      if (xi === 2) addDeco('factory', x0 + 2, y0, 2, 2, { nm: '化工厂' });
      fill(b, 1, xi === 2 ? 4 : 5, () => rnd() < 0.55 ? 'townhouse' : 'bungalow');
    }
  }
  // the hill: villas around a path up to the mansion
  const hb = { x0: 18, y0: 15, x1: 24, y1: 24, d: DI.hill, st: '半山道' }; blocks.push(hb);
  for (let y = 15; y <= 24; y++) for (let x = 18; x <= 24; x++) tdist[ti(x, y)] = DI.hill;
  for (let y = 15; y <= 20; y++) tiles[ti(MANSION_XY[0] + 1, y)] = T_PATH;
  const man = addProp('mansion', hb, MANSION_XY[0], MANSION_XY[1], 1);
  for (const [x, y] of [[18, 15], [23, 15], [18, 18]]) addProp('villa', hb, x, y, wpick([{ v: 1, w: 3 }, { v: 2, w: 2 }]).v);
  for (const d of deco) if (d.k === 'plaza' || d.k === 'mall' || d.k === 'office') for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) tiles[ti(d.x + i, d.y + j)] = T_PLAZA;
  return { tiles, tdist, blocks, props, deco, mansion: man.id, streetNo };
}

/* ---------- valuation ---------- */
function val(p) { const K = KINDS[p.kind], D = G.d[p.d]; return (p.kind === 'mansion' ? G.manBase || K.base : K.base) * D.idx * p.q * COND[p.cond].m * (1 + p.bonus) * (1 + (p.j || 0)); }
const live = p => !p.gone && !p.stage;   // standing house (not under construction / being demolished / removed)
const canSell = p => !p.reno && G.t - p.boughtT >= BAL.hold;
const mansionP = () => G.props[G.mansion];
const mansionPrice = () => mansionP().list ? mansionP().list.ask : val(mansionP());
function propName(p) { return p.kind === 'mansion' ? '半山顶 · 终极豪宅' : p.st + ' ' + p.num + ' 号'; }
const ownedBy = i => G.props.filter(p => p.owner === i && !p.gone);
function equity(i) { let s = 0; for (const p of G.props) if (p.owner === i) s += val(p) - p.loan; return s; }
function debtOf(i) { let s = 0; for (const p of G.props) if (p.owner === i) s += p.loan; return s; }
const netWorth = i => G.pl[i].cash + equity(i);
function monthlyFlow(i) {
  let rent = 0, up = 0, int = 0; const R = OP('rent');
  for (const p of G.props) if (p.owner === i) { const v = val(p); if (R) { if (!p.reno) rent += v * BAL.rent; up += v * BAL.upkeep; } int += p.loan * G.rate; }
  return { rent, up, int, net: rent - up - int };
}
const inspCost = p => Math.max(BAL.inspect[0], (p.list ? p.list.ask : val(p)) * BAL.inspect[1]);
const buyFee = () => OP('fee') ? BAL.buyFee : 0, sellFee = () => OP('fee') ? BAL.sellFee : 0;
const buyCost = (ask, loan) => loan ? ask * BAL.down + ask * buyFee() : ask * (1 + buyFee());
const sellNet = p => p.offer * (1 - sellFee()) - p.loan;
function renoInfo(p) { if (p.cond >= 2) return null; const R = RENO[p.cond], v = val(p); return { cost: v * R.c, t: R.t, gain: v * (COND[p.cond + 1].m / COND[p.cond].m - 1) }; }
function refVal(p, pi) { return !OP('insp') || knows(p, pi) ? val(p) : estOf(p); }
function dealOf(p, pi) {
  const r = p.list.ask / refVal(p, pi);
  return r <= 0.87 ? { k: 'great', n: '超值', r } : r <= 0.955 ? { k: 'good', n: '划算', r } : r <= 1.06 ? { k: 'fair', n: '正常', r } : { k: 'high', n: '偏贵', r };
}
function sellAdvice(p) {
  if (p.reno) return { k: 'wait', n: '装修中', r: 0 };
  if (!canSell(p)) return { k: 'wait', n: '过户中…', r: p.offer * (1 - sellFee()) / p.paid - 1 };
  const r = p.offer * (1 - sellFee()) / p.paid - 1, q = p.offer / val(p);
  if (r >= 0 && q >= 1.06) return { k: 'sell', n: '出价很高，快卖', r };
  if (r >= 0.08) return { k: 'sell', n: '已经赚了，可以卖', r };
  if (r >= 0) return { k: 'ok', n: '小赚，可以再等等', r };
  return { k: 'wait', n: '现在卖会亏，再等等', r };
}
function estOf(p) { return p.list && OP('insp') ? val(p) * p.list.est : val(p); }   // the agent's (noisy) estimate
const knows = (p, i) => p.insp.includes(i);
function heat() { // market temperature: average district move over the last 30 s
  let s = 0, n = 0; for (const d of G.d) { const h = d.hist, k = h.length; if (k > 15) { s += Math.log(h[k - 1] / h[k - 16]); n++; } }
  return n ? s / n : 0;
}
