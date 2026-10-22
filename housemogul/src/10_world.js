/* ================= world: map layout, properties, valuation ================= */
const N = 21;
const T_GRASS = 0, T_ROAD = 1, T_WATER = 2, T_PLAZA = 3, T_PATH = 4;
const XR = [[0, 3], [5, 8], [10, 13], [15, 20]], YR = [[3, 6], [8, 11], [13, 16], [18, 20]];
const BLOCKS_DEF = [
  [0, 0, 'river', '滨江大道'], [1, 0, 'river', '望江路'], [2, 0, 'river', '观澜路'], [3, 0, 'river', '江湾路'],
  [0, 1, 'old', '梧桐巷'], [1, 1, 'old', '槐花街'], [2, 1, 'tech', '创新大道'], [3, 1, 'tech', '云谷路'],
  [0, 2, 'old', '鼓楼街'], [1, 2, 'school', '学府路'], [2, 2, 'school', '书院街'],
  [0, 3, 'sub', '柳岸村'], [1, 3, 'sub', '桃园路'], [2, 3, 'sub', '麦田路']
];
const ti = (x, y) => y * N + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

function genWorld() {
  const tiles = new Array(N * N).fill(T_GRASS), tdist = new Array(N * N).fill(-1);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let t = T_GRASS;
    if (y <= 1) t = T_WATER;
    else if (y === 2 || y === 7 || y === 12) t = T_ROAD;
    else if (y === 17 && x <= 13) t = T_ROAD;
    else if ((x === 4 || x === 9) && y >= 2) t = T_ROAD;
    else if (x === 14 && y >= 2) t = T_ROAD;
    tiles[ti(x, y)] = t;
  }
  const blocks = [], props = [], deco = [], used = new Set();
  const occ = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add(ti(x + i, y + j)); };
  const streetNo = {};
  const addProp = (kind, b, x, y, cond) => {
    const K = KINDS[kind]; occ(x, y, K.w, K.h);
    streetNo[b.st] = (streetNo[b.st] || 0) + 1 + (kind === 'mansion' ? 0 : ri(0, 1));
    const p = {
      id: props.length, kind, d: b.d, x, y, w: K.w, h: K.h, st: b.st, num: kind === 'mansion' ? 1 : streetNo[b.st], b: blocks.indexOf(b),
      q: kind === 'mansion' ? 1 : clamp(1 + gauss() * 0.06, 0.86, 1.14),
      cond: cond != null ? cond : wpick(b.d === DI.old || b.d === DI.sub ? [{ v: 0, w: 5 }, { v: 1, w: 4 }, { v: 2, w: 1 }] : [{ v: 0, w: 2 }, { v: 1, w: 5 }, { v: 2, w: 3 }]).v,
      bonus: 0, owner: -1, loan: 0, paid: 0, boughtM: -1, reno: 0, renoTo: 0, list: null, offer: 0, insp: [], hist: [], cool: 0
    };
    props.push(p); return p;
  };
  const addDeco = (k, x, y, w, h, extra) => { occ(x, y, w, h); deco.push(Object.assign({ k, x, y, w, h }, extra || {})); };
  for (const [xi, yi, dk, st] of BLOCKS_DEF) {
    const [x0, x1] = XR[xi], [y0, y1] = YR[yi];
    const b = { x0, y0, x1, y1, d: DI[dk], st }; blocks.push(b);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tdist[ti(x, y)] = b.d;
    const W = x1 - x0 + 1;
    if (dk === 'river') {
      const spots = []; for (let oy = 0; oy < 4; oy += 2) for (let ox = 0; ox + 1 < W; ox += 2) spots.push([x0 + ox, y0 + oy]);
      const decoAt = W > 4 ? 5 : [2, 1, 3][xi];
      spots.forEach(([x, y], k) => { if (k === decoAt) addDeco(['park', 'plaza', 'pond', 'park'][xi], x, y, 2, 2, { nm: ['滨江公园', '滨江广场', '观澜湖', '江湾绿地'][xi] }); else addProp('riverflat', b, x, y); });
    } else if (dk === 'old') {
      const mask = ['1101', '1111', '0110', '1101'];
      for (let oy = 0; oy < 4; oy++) for (let ox = 0; ox < 4; ox++) if (mask[(oy + xi + yi) % 4][ox] === '1') addProp(rnd() < 0.6 ? 'bungalow' : 'walkup', b, x0 + ox, y0 + oy);
    } else if (dk === 'tech') {
      if (W === 4) { addProp('techflat', b, x0, y0); addProp('techflat', b, x0 + 2, y0); addDeco('mall', x0, y0 + 2, 4, 2, { nm: '星光商场' }); }
      else { addProp('techflat', b, x0, y0); addProp('techflat', b, x0 + 2, y0); addDeco('office', x0 + 4, y0, 2, 2, { nm: '云谷大厦' }); addDeco('office', x0, y0 + 2, 2, 2, { nm: '创新中心', lo: 1 }); addProp('techflat', b, x0 + 2, y0 + 2); addProp('techflat', b, x0 + 4, y0 + 2); }
    } else if (dk === 'school') {
      if (xi === 1) { addDeco('school', x0, y0, 2, 4, { nm: '实验小学' }); for (let oy = 0; oy < 4; oy++) for (let ox = 2; ox < 4; ox++) if (!(ox === 3 && oy === 1)) addProp('schoolflat', b, x0 + ox, y0 + oy); }
      else { addProp('house', b, x0, y0); addProp('house', b, x0 + 2, y0); for (let ox = 0; ox < 4; ox++) if (ox !== 2) addProp('schoolflat', b, x0 + ox, y0 + 3); }
    } else if (dk === 'sub') {
      const H = y1 - y0 + 1;
      if (xi === 2) addDeco('factory', x0 + 2, y0, 2, 2, { nm: '化工厂' });
      const cells = []; for (let oy = 0; oy < H; oy++) for (let ox = 0; ox < 4; ox++) if (!used.has(ti(x0 + ox, y0 + oy))) cells.push([x0 + ox, y0 + oy]);
      shuffle(cells).slice(0, xi === 2 ? 5 : 6).sort((a, b) => a[1] - b[1] || a[0] - b[0]).forEach(([x, y]) => addProp(rnd() < 0.55 ? 'townhouse' : 'bungalow', b, x, y));
    }
  }
  // the hill
  const hb = { x0: 15, y0: 13, x1: 20, y1: 20, d: DI.hill, st: '半山道' }; blocks.push(hb);
  for (let y = 13; y <= 20; y++) for (let x = 15; x <= 20; x++) tdist[ti(x, y)] = DI.hill;
  for (const [x, y] of [[15, 13], [19, 13], [15, 15], [19, 15], [15, 18]]) addProp('villa', hb, x, y, wpick([{ v: 1, w: 3 }, { v: 2, w: 2 }]).v);
  const man = addProp('mansion', hb, 17, 17, 1);
  for (let y = 13; y <= 16; y++) tiles[ti(17, y)] = T_PATH;
  // plaza tiles under river plaza / malls
  for (const d of deco) if (d.k === 'plaza' || d.k === 'mall' || d.k === 'office') for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) tiles[ti(d.x + i, d.y + j)] = T_PLAZA;
  return { tiles, tdist, blocks, props, deco, mansion: man.id };
}

/* ---------- valuation ---------- */
function val(p) { const K = KINDS[p.kind], D = G.d[p.d]; return (p.kind === 'mansion' ? G.manBase || K.base : K.base) * D.idx * p.q * COND[p.cond].m * (1 + p.bonus); }
const mansionP = () => G.props[G.mansion];
const mansionPrice = () => mansionP().list ? mansionP().list.ask : val(mansionP());
function propName(p) { return p.kind === 'mansion' ? '半山顶 · 终极豪宅' : p.st + ' ' + p.num + ' 号'; }
const ownedBy = i => G.props.filter(p => p.owner === i);
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
function estOf(p) { return p.list && OP('insp') ? val(p) * p.list.est : val(p); }   // the agent's (noisy) estimate
const knows = (p, i) => p.insp.includes(i);
function heat() { // smoothed market temperature from last 3 months of district moves
  let s = 0, n = 0; for (const d of G.d) { const h = d.hist, k = h.length; if (k > 3) { s += Math.log(h[k - 1] / h[k - 4]); n++; } }
  return n ? s / n : 0;
}
