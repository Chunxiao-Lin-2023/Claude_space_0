/* ================= real-time simulation (host / solo authoritative) =================
   step(dt) advances G.t by dt seconds. Prices move continuously, listings pop up and expire,
   buyer offers wobble, and the city builds and demolishes on its own. */
function mkPlayer(i, name, kind) {
  return { i, name, kind, cash: BAL.start, alive: true, gone: false, wh: [], aiT: 0, st: { buys: 0, sells: 0, profit: 0, best: 0, reno: 0, insp: 0, forced: 0 } };
}
function newGame(seed, names, aiOn, opt, diff) {
  G = {
    v: 2, rs: seed | 0, seed, t: 0, rate: BAL.rate0, reg: { k: 'calm', left: 50 },
    d: DISTS.map(() => ({ idx: 1, base: 1, n: 0, hist: [], pend: [] })),
    news: [], ev: [], seq: 0, sv: 0, rumors: [], over: null, pl: [], solo: names.length === 1,
    opt: Object.assign({}, PRESET.full, opt || {}), diff: DIFF[diff] ? diff : 'normal',
    histT: 0, listT: 0, cutT: 0, devT: 6, demT: 18, evT: 20, cheapT: 0, fac: 1
  };
  G.manBase = BAL.mansion[G.opt.loan ? 1 : 0] * DIFF[G.diff].man;
  Object.assign(G, genWorld());
  names.forEach((nm, i) => G.pl.push(mkPlayer(i, nm, 'human')));
  if (aiOn) G.pl.push(mkPlayer(G.pl.length, '王老板', 'ai'));
  // warm up: two minutes of market history before the game starts
  for (let k = 0; k < 120 / 0.5; k++) { marketStep(0.5, true); if (k % 4 === 3) for (const s of G.d) s.hist.push(s.idx); }
  for (const p of G.props) { const D = G.d[p.d], v = val(p); p.hist = D.hist.slice(-BAL.hist).map(x => v * x / D.idx); }
  for (let k = 0; k < BAL.listTarget; k++) { const c = listCandidates(); if (c.length) makeListing(pick(c)); }
  ensureCheap(true);
  updateOffers(0);
  for (const pl of G.pl) pl.wh.push(netWorth(pl.i));
  news('info', '开局', '你带着 ' + fmtM(BAL.start) + ' 来到这座城市。山顶豪宅现价 ' + fmtM(mansionPrice()) + '，攒够现金买下它！');
  return G;
}

/* ---------- event log (synced; each client plays new ones once) ---------- */
function ev(k, txt, pi, id, amt) { G.ev.push({ s: ++G.seq, k, txt, pi: pi == null ? -1 : pi, id: id == null ? -1 : id, amt: amt || 0, t: G.t }); if (G.ev.length > 60) G.ev.shift(); }
function news(tone, tag, txt, d) { G.news.push({ t: G.t, tone, tag, txt, d: d == null ? -1 : d }); if (G.news.length > 60) G.news.shift(); ev('news', txt, -1, -1, tone === 'good' ? 1 : tone === 'bad' ? -1 : 0); }
const bumpSV = () => { G.sv++; };

/* ---------- market (continuous) ---------- */
const OU_TH = 0.025;                     // district noise mean reversion (1/s)
function marketStep(dt, pre) {
  if ((G.reg.left -= dt) <= 0) {
    const k = G.reg.k;
    const nx = k === 'calm' ? wpick([{ v: 'bull', w: 5 }, { v: 'bear', w: 3 }, { v: 'calm', w: 2 }]).v
      : k === 'bull' ? wpick([{ v: 'calm', w: 6 }, { v: 'bear', w: 3 }, { v: 'bull', w: 1 }]).v
        : wpick([{ v: 'calm', w: 6 }, { v: 'bull', w: 4 }]).v;
    G.reg = { k: nx, left: nx === 'calm' ? rr(40, 90) : rr(60, 140) };
    if (!pre && nx !== k && OP('news')) {
      if (nx === 'bull') news('good', '楼市', pick(['楼市回暖，看房的人明显多了', '成交量放大，楼市进入上涨期', '开发商纷纷提价，楼市热起来了']));
      else if (nx === 'bear') news('bad', '楼市', pick(['楼市降温，买家都在观望', '成交量大跌，房价开始松动', '中介门店冷清，楼市进入下行期']));
      else news('info', '楼市', pick(['楼市趋于平稳', '量价平稳，市场在盘整']));
    }
  }
  const rd = (REG[G.reg.k].d - (G.rate - BAL.rate0) * 2.2) / MON;
  const sq = Math.sqrt(dt);
  G.d.forEach((s, i) => {
    const D = DISTS[i]; let shock = 0;
    s.pend = s.pend.filter(e => { if (e.after > 0) { e.after -= dt; return true; } const u = Math.min(dt, e.left); shock += e.k * u; e.left -= u; return e.left > 1e-6; });
    s.base *= Math.exp((D.mu / MON + D.beta * rd) * dt + shock);
    const sd = D.vol * 1.6;
    s.n += -OU_TH * s.n * dt + sd * Math.sqrt(2 * OU_TH) * sq * gauss();
    s.idx = s.base * Math.exp(s.n);
  });
}
// a shock of `total` (log) spread over `secs` seconds, optionally starting after `after` seconds
const shockD = (d, total, secs, after) => G.d[d].pend.push({ k: total / secs, left: secs, after: after || 0 });
const shockAll = (total, secs) => G.d.forEach((s, i) => shockD(i, total * (0.6 + 0.4 * DISTS[i].beta), secs));

/* per-house wobble (fast, small) and buyer-offer wobble */
function houseStep(dt) {
  const sq = Math.sqrt(dt), hot = clamp(heat() * 1.2, -0.045, 0.045), DO = DF().offer;
  for (const p of G.props) {
    if (p.gone) continue;
    p.j += -0.15 * p.j * dt + 0.011 * Math.sqrt(0.3) * sq * gauss();
    if (p.owner >= 0) {
      p.on += -0.13 * p.on * dt + 0.042 * Math.sqrt(0.26) * sq * gauss();
      if (p.hotT > 0) p.hotT = Math.max(0, p.hotT - dt);
      else if (rnd() < dt / 110) p.hotT = rr(5, 8);
    }
  }
  updateOffers(hot, DO);
}
function updateOffers(hot, DO) {
  if (hot == null) hot = clamp(heat() * 1.2, -0.045, 0.045);
  if (DO == null) DO = DF().offer;
  for (const p of G.props) if (p.owner >= 0 && !p.gone) p.offer = val(p) * (p.hotT > 0 ? 1.13 + p.on * 0.3 : clamp(DO + hot + p.on, 0.84, 1.12));
}

/* ---------- events (only with the news option) ---------- */
const EVENTS = [
  { w: 2.6, f() {
      if (G.rumors.some(r => r.k === 'metro')) return false;
      const d = pick([DI.sub, DI.sub, DI.old, DI.tech]), line = ri(3, 9);
      G.rumors.push({ k: 'metro', d, line, at: G.t + rr(25, 45), real: rnd() < 0.62 });
      shockD(d, 0.03, 12);
      news('rumor', '传闻', '地铁 ' + line + ' 号线可能延伸到' + DISTS[d].n + '，过一阵会有消息', d);
    } },
  { w: 2.2, f() {
      if (G.rumors.some(r => r.k === 'demo')) return false;
      const bs = G.blocks.map((b, i) => i).filter(i => G.blocks[i].d === DI.old && G.props.some(p => p.b === i && live(p) && (p.kind === 'bungalow' || p.kind === 'walkup')));
      if (!bs.length) return false;
      const b = pick(bs);
      G.rumors.push({ k: 'demo', b, at: G.t + rr(25, 50), real: rnd() < 0.5 });
      for (const p of G.props) if (p.b === b && live(p) && (p.kind === 'bungalow' || p.kind === 'walkup')) { p.bonus += 0.08; p.demo = 1; }
      news('rumor', '传闻', G.blocks[b].st + '一带的老房子可能要拆迁，补偿据说很高', DI.old);
    } },
  { w: 1.3, f() { shockD(DI.school, 0.09, 15); news('good', '学府区', pick(['省重点中学在学府区开分校', '实验小学扩招，学区房一房难求']), DI.school); } },
  { w: 1.2, f() { shockD(DI.tech, 0.13, 20); news('good', '科技新区', pick(['互联网大厂总部落户科技新区', '新能源车企在科技新区建研发中心']), DI.tech); } },
  { w: 1.1, f() { shockD(DI.tech, -0.12, 15); news('bad', '科技新区', pick(['科技公司裁员潮，园区写字楼空了一片', '明星创业公司倒闭，科技新区租房的人少了']), DI.tech); } },
  { w: 1.2, f() { if (!OP('loan') || G.rate >= BAL.rateMax - 1e-6) return false; G.rate = Math.min(BAL.rateMax, G.rate + 0.0008); shockAll(-0.03, 8); news('bad', '利率', '央行加息，房贷利率涨了'); } },
  { w: 1.2, f() { if (!OP('loan') || G.rate <= BAL.rateMin + 1e-6) return false; G.rate = Math.max(BAL.rateMin, G.rate - 0.0008); shockAll(0.03, 8); news('good', '利率', '央行降息，房贷利率降了'); } },
  { w: 0.8, f() { shockAll(-0.05, 15); if (G.reg.k === 'calm') G.reg = { k: 'bear', left: rr(50, 90) }; news('bad', '政策', '出台限购令，买房的人一下子少了'); } },
  { w: 0.8, f() { shockAll(0.05, 15); if (G.reg.k === 'calm') G.reg = { k: 'bull', left: rr(50, 90) }; news('good', '政策', '放开限购、发购房补贴，买房的人多了'); } },
  { w: 0.9, f() { shockD(DI.river, 0.08, 15); news('good', '江景区', pick(['滨江步道全线贯通，江景房更抢手了', '江边要建音乐厅，江景区身价看涨']), DI.river); } },
  { w: 0.6, f() { shockD(DI.river, -0.09, 6); shockD(DI.river, 0.05, 15, 15); news('bad', '江景区', '江水上涨，江景区几个小区地库进水', DI.river); } },
  { w: 0.8, f() {
      const fac = G.deco.find(d => d.k === 'factory');
      if (fac && rnd() < 0.4) { G.deco.splice(G.deco.indexOf(fac), 1); G.deco.push({ k: 'park', x: fac.x, y: fac.y, w: 2, h: 2, nm: '湿地公园' }); bumpSV(); shockD(DI.sub, 0.1, 15); news('good', '城郊', '化工厂搬走了，原址改建湿地公园', DI.sub); }
      else if (fac) { shockD(DI.sub, -0.08, 15); news('bad', '城郊', '城郊化工厂被曝偷排废水', DI.sub); }
      else { shockD(DI.sub, 0.06, 15); news('good', '城郊', '城郊湿地公园成了网红打卡地', DI.sub); }
    } },
  { w: 0.7, f() { shockD(DI.sub, 0.08, 15); news('good', '城郊', '城郊要建大型购物中心和医院分院', DI.sub); } },
  { w: 0.7, f() { shockD(DI.old, 0.06, 15); news('good', '老城区', '老城区改造，鼓楼一带变成步行街', DI.old); } },
  { w: 0.6, f() { shockD(DI.hill, 0.06, 15); news('info', '半山', '外地富豪扎堆半山买别墅，豪宅也跟着涨价', DI.hill); } },
  { w: 0.5, f() { shockD(DI.hill, -0.05, 15); news('info', '半山', '半山修路封山，看房的人少了，豪宅也便宜了点', DI.hill); } }
];
function resolveRumors() {
  G.rumors = G.rumors.filter(r => {
    if (r.at > G.t) return true;
    if (r.k === 'metro') {
      if (r.real) {
        shockD(r.d, 0.2, 20); news('good', '地铁', '确定了！地铁 ' + r.line + ' 号线延伸到' + DISTS[r.d].n + '，站点开工', r.d);
        const free = freeCells(r.d);
        if (free.length) { const [x, y] = pick(free); G.deco.push({ k: 'metro', x, y, w: 1, h: 1, nm: r.line + ' 号线' }); bumpSV(); }
      } else { shockD(r.d, -0.04, 6); news('bad', '辟谣', '地铁 ' + r.line + ' 号线不经过' + DISTS[r.d].n + '，之前是谣言', r.d); }
    } else if (r.k === 'demo') {
      const st = G.blocks[r.b].st, hit = G.props.filter(p => p.b === r.b && p.demo && !p.gone);
      for (const p of hit) { p.bonus = Math.max(0, p.bonus - 0.08); p.demo = 0; }
      if (r.real) {
        for (const p of hit) {
          if (p.stage) continue;
          const v = val(p);
          if (p.owner >= 0) { const pl = G.pl[p.owner], prof = v * BAL.demolish - p.paid; pl.cash += v * BAL.demolish - p.loan; pl.st.profit += prof; pl.st.best = Math.max(pl.st.best, prof); ev('demo', pl.name + ' 的 ' + propName(p) + ' 拆迁，拿到补偿 ' + fmtM(v * BAL.demolish), p.owner, p.id, prof); }
          startDemolish(p);
        }
        news('good', '拆迁', st + '拆迁了！老房按 ' + BAL.demolish + ' 倍补偿，原地要盖新楼', DI.old);
      } else news('bad', '辟谣', st + '拆迁传闻落空，附近房价回落', DI.old);
    }
    return false;
  });
}

/* ---------- listings ---------- */
const listCandidates = () => G.props.filter(p => live(p) && p.owner === -1 && !p.list && p.cool <= 0 && p.kind !== 'mansion');
function makeListing(p, cheap, fresh) {
  const r = cheap ? 0 : rnd(), H = DF().hot; let f, tag = '';
  if (fresh) { f = rnd() < 0.35 ? rr(0.84, 0.92) : rr(0.97, 1.08); tag = 'new'; }
  else if (r < H) { f = rr(0.72, 0.88); tag = 'hot'; }
  else if (r < H + 0.04) { f = rr(0.96, 1.08); tag = 'hot'; }
  else if (r < H + 0.14) f = rr(1.14, 1.3);
  else f = clamp(1.04 + gauss() * 0.065, 0.86, 1.2);
  const life = rr(BAL.listLife[0], BAL.listLife[1]);
  p.list = { ask: val(p) * f, est: clamp(1 + gauss() * BAL.estNoise, 0.84, 1.16), left: life, life, tag, cut: 0, t0: G.t };
  p.insp = [];
}
function ensureCheap(init) {
  const cheapNow = G.props.filter(p => p.list && p.kind !== 'mansion' && p.list.ask / val(p) <= 0.9).length;
  if (cheapNow >= DF().minGood) return;
  // forced bargains come from the cheaper homes, so a beginner can afford one
  const pool = listCandidates().sort((a, b) => val(a) - val(b)).slice(0, 14);
  for (let k = cheapNow; k < DF().minGood && pool.length; k++) makeListing(pool.splice(Math.floor(rnd() * pool.length), 1)[0], true);
}
function listingStep(dt) {
  for (const p of G.props) {
    if (p.cool > 0) p.cool -= dt;
    if (!p.list || p.kind === 'mansion') continue;
    if (p.owner !== -1 || p.stage) { p.list = null; continue; }
    if ((p.list.left -= dt) <= 0) { p.list = null; p.cool = rr(8, 20); continue; }
  }
  if ((G.cutT -= dt) <= 0) {
    G.cutT = BAL.cutEvery;
    for (const p of G.props) if (p.list && p.kind !== 'mansion' && G.t - p.list.t0 > 14 && rnd() < 0.4) { p.list.ask *= rr(0.93, 0.97); p.list.cut = G.t; }
  }
  const cnt = G.props.filter(p => p.list && p.kind !== 'mansion').length;
  const lam = Math.max(0, BAL.listTarget - cnt) / 9 + 0.03;          // more arrivals when the market is thin
  if (rnd() < lam * dt) { const c = listCandidates(); if (c.length) makeListing(pick(c)); }
  if ((G.cheapT -= dt) <= 0) { G.cheapT = 4; ensureCheap(); }
  const m = mansionP();
  if (m.owner === -1) { const v = val(m); m.list = { ask: v, est: 1, left: 999, life: 999, tag: 'goal', cut: 0, t0: 0 }; }
}

/* ---------- the city builds and demolishes on its own ---------- */
const BUILD_KINDS = {
  old: [['townhouse', 3], ['newflat', 2], ['walkup', 1]], sub: [['townhouse', 3], ['newflat', 1], ['bungalow', 1]],
  school: [['schoolflat', 3], ['house', 1]], tech: [['techflat', 3], ['newflat', 1]], river: [['riverflat', 3], ['newflat', 1]], hill: [['villa', 1]]
};
function occupied() {
  const u = new Set();
  for (const o of G.props) if (!o.gone) for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) u.add(ti(o.x + i, o.y + j));
  for (const o of G.deco) for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) u.add(ti(o.x + i, o.y + j));
  return u;
}
function freeCells(d) {
  const u = occupied(), out = [];
  for (const b of G.blocks) { if (d != null && b.d !== d) continue; for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (G.tiles[ti(x, y)] === T_GRASS && !u.has(ti(x, y))) out.push([x, y]); }
  return out;
}
function buildSites() {
  const out = [];
  G.blocks.forEach((b, bi) => {
    const dk = DISTS[b.d].k;
    for (const [kind, w] of BUILD_KINDS[dk]) {
      const K = KINDS[kind];
      for (let y = b.y0; y + K.h - 1 <= b.y1; y++) for (let x = b.x0; x + K.w - 1 <= b.x1; x++)
        if (lotFree(G.props, G.deco, G.tiles, b, x, y, K.w, K.h)) out.push({ b: bi, x, y, kind, w: w * (K.w > 1 ? 1.4 : 1) });
    }
  });
  return out;
}
function startBuild() {
  if (G.props.filter(p => !p.gone).length >= BAL.maxProps) return false;
  const sites = buildSites(); if (!sites.length) return false;
  const s = wpick(sites), b = G.blocks[s.b], K = KINDS[s.kind];
  G.streetNo[b.st] = (G.streetNo[b.st] || 0) + 1;
  const p = {
    id: G.props.length, kind: s.kind, d: b.d, x: s.x, y: s.y, w: K.w, h: K.h, st: b.st, num: G.streetNo[b.st], b: s.b,
    q: clamp(1.02 + gauss() * 0.04, 0.94, 1.12), cond: 2, bonus: 0, owner: -1, loan: 0, paid: 0, boughtT: -99, reno: 0, renoTo: 0,
    list: null, offer: 0, insp: [], hist: [], cool: 0, j: 0, on: 0, hotT: 0, stage: 'build', bt: 0
  };
  const D = G.d[b.d]; p.hist = D.hist.slice(-BAL.hist).map(x => K.base * x * p.q * COND[2].m);
  G.props.push(p); bumpSV();
  ev('build', b.st + '开工了一栋' + K.n, -1, p.id);
  return true;
}
function startDemolish(p) {
  Object.assign(p, { stage: 'demo', bt: 0, owner: -1, loan: 0, paid: 0, list: null, insp: [], reno: 0 });
  bumpSV(); ev('demolish', propName(p) + ' 被拆了', -1, p.id);
}
function cityStep(dt) {
  for (const p of G.props) {
    if (!p.stage) continue;
    p.bt += dt;
    if (p.stage === 'build' && p.bt >= BAL.buildT) {
      p.stage = null; G.d[p.d].base *= 1.004;                 // a new building lifts the neighbourhood a little
      makeListing(p, false, true); bumpSV();
      ev('built', propName(p) + ' 新楼盘开卖', -1, p.id);
    } else if (p.stage === 'demo' && p.bt >= BAL.demoT) { p.stage = null; p.gone = true; bumpSV(); }
  }
  if ((G.devT -= dt) <= 0) { G.devT = rr(BAL.buildEvery[0], BAL.buildEvery[1]); startBuild(); }
  if ((G.demT -= dt) <= 0) {
    G.demT = rr(BAL.demoEvery[0], BAL.demoEvery[1]);
    const old = G.props.filter(p => live(p) && p.owner === -1 && !p.list && (p.kind === 'bungalow' || (p.kind === 'walkup' && p.cond === 0) || (p.kind === 'townhouse' && p.cond === 0)));
    if (old.length && G.props.filter(p => !p.gone).length > 70) startDemolish(pick(old));
  }
}

/* ---------- player actions ---------- */
function doAct(pi, a, v) {
  if (!G || G.over) return '这局已经结束了';
  const pl = G.pl[pi]; if (!pl || !pl.alive) return '你已出局';
  const p = v && v.id != null ? G.props[v.id] : null;
  if (p && p.gone) return '这栋楼已经拆了';
  switch (a) {
    case 'inspect': {
      if (!OP('insp')) return '本局没有验房';
      if (!p || !p.list || p.owner !== -1) return '这套房没在卖';
      if (knows(p, pi)) return null;
      const c = inspCost(p); if (pl.cash < c) return '现金不够付验房费';
      pl.cash -= c; p.insp.push(pi); pl.st.insp++;
      ev('inspect', '验房完成：' + propName(p), pi, p.id); return null;
    }
    case 'buy': {
      if (!p || !p.list || p.owner !== -1 || p.stage) return '晚了一步，这套房已经卖掉了';
      const man = p.kind === 'mansion', loan = !!v.loan && !man && OP('loan'), ask = p.list.ask, cost = buyCost(ask, loan);
      if (pl.cash < cost - 1e-9) return man ? '现金不够，豪宅只能全款' : '现金不够';
      pl.cash -= cost; pl.st.buys++;
      Object.assign(p, { owner: pi, loan: loan ? ask * (1 - BAL.down) : 0, paid: ask * (1 + buyFee()), boughtT: G.t, list: null, on: -0.06, hotT: 0 });
      updateOffers();
      if (man) { G.over = { winner: pi, reason: 'mansion', t: G.t }; ev('win', pl.name + ' 买下了山顶豪宅！', -1, p.id); }
      else ev('buy', pl.name + ' 买下 ' + propName(p) + '（' + fmtM(ask) + (loan ? '，贷款' : '') + '）', pi, p.id, ask);
      bumpSV(); return null;
    }
    case 'sell': {
      if (!p || p.owner !== pi) return '这不是你的房';
      if (p.reno) return '装修中，不能卖';
      if (!canSell(p)) return '刚买的房还在过户，等几秒';
      const got = sellNet(p), prof = p.offer * (1 - sellFee()) - p.paid;
      pl.cash += got; pl.st.sells++; pl.st.profit += prof; pl.st.best = Math.max(pl.st.best, prof);
      ev('sell', pl.name + ' 卖出 ' + propName(p) + '，' + (prof >= 0 ? '赚了 ' : '亏了 ') + fmtM(Math.abs(prof)), pi, p.id, prof);
      Object.assign(p, { owner: -1, loan: 0, paid: 0, list: null, insp: [], cool: rr(10, 25), offer: 0, hotT: 0 });
      bumpSV(); return null;
    }
    case 'reno': {
      if (!OP('reno')) return '本局没有装修';
      if (!p || p.owner !== pi) return '这不是你的房';
      if (p.reno) return '已经在装修了';
      const R = renoInfo(p); if (!R) return '已经是精装了';
      if (pl.cash < R.cost) return '现金不够付装修费';
      pl.cash -= R.cost; p.reno = R.t; p.renoTo = p.cond + 1; p.paid += R.cost; pl.st.reno++;
      ev('reno', propName(p) + ' 开始装修', pi, p.id); bumpSV(); return null;
    }
    case 'repay': {
      if (!p || p.owner !== pi || p.loan <= 0) return '没有贷款';
      if (pl.cash < p.loan) return '现金不够还清贷款';
      pl.cash -= p.loan; ev('repay', propName(p) + ' 的贷款还清了', pi, p.id); p.loan = 0; bumpSV(); return null;
    }
  }
  return '未知操作';
}

/* ---------- money flow, forced sales, end ---------- */
function flowStep(dt) {
  const R = OP('rent'), L = OP('loan');
  if (!R && !L) return;
  for (const pl of G.pl) {
    if (!pl.alive) continue;
    let f = 0;
    for (const p of G.props) if (p.owner === pl.i && !p.gone) { const v = val(p); if (R) { if (!p.reno) f += v * BAL.rent; f -= v * BAL.upkeep; } f -= p.loan * G.rate; }
    pl.cash += f * dt / MON; pl.flow = f;
  }
}
function forcedSales(pl) {
  if (pl.cash >= 0 || !pl.alive) return;
  const mine = ownedBy(pl.i).sort((a, b) => (val(b) * BAL.forced - b.loan) - (val(a) * BAL.forced - a.loan));
  for (const p of mine) {
    if (pl.cash >= 0) break;
    const got = val(p) * BAL.forced - p.loan, prof = val(p) * BAL.forced - p.paid;
    pl.cash += got; pl.st.profit += prof; pl.st.forced++;
    ev('forced', '现金变成负数，银行低价卖掉了 ' + pl.name + ' 的 ' + propName(p), pl.i, p.id, prof);
    Object.assign(p, { owner: -1, loan: 0, paid: 0, list: null, insp: [], reno: 0, cool: 15, offer: 0 });
    bumpSV();
  }
  if (pl.cash < 0) {
    pl.alive = false;
    for (const p of ownedBy(pl.i)) Object.assign(p, { owner: -1, loan: 0, paid: 0, list: null, insp: [], reno: 0, cool: 10 });
    ev('bankrupt', pl.name + ' 资不抵债，破产出局了', -1); news('bad', '破产', pl.name + ' 资不抵债，破产出局'); bumpSV();
  }
}
function checkEnd() {
  if (G.over) return;
  const humans = G.pl.filter(p => p.kind === 'human');
  if (!humans.some(p => p.alive)) { const ai = G.pl.find(p => p.kind === 'ai' && p.alive); G.over = { winner: ai ? ai.i : -1, reason: 'bankrupt', t: G.t }; }
  else if (G.t >= BAL.limit) {
    let best = -1, bw = -1e18; for (const pl of G.pl) if (pl.alive && netWorth(pl.i) > bw) { bw = netWorth(pl.i); best = pl.i; }
    G.over = { winner: G.solo && G.pl.length === 1 ? -1 : best, reason: 'time', t: G.t };
  }
}

/* ---------- one tick ---------- */
const SIM_DT = 0.1;
function step(dt) {
  if (!G || G.over) return;
  G.t += dt;
  marketStep(dt, false);
  houseStep(dt);
  listingStep(dt);
  cityStep(dt);
  for (const p of G.props) if (p.reno > 0 && (p.reno -= dt) <= 0) { p.reno = 0; p.cond = p.renoTo; if (p.owner >= 0) ev('renodone', propName(p) + ' 装修好了，现在是' + COND[p.cond].n, p.owner, p.id); bumpSV(); }
  if (OP('news')) { if ((G.evT -= dt) <= 0) { G.evT = rr(18, 40); for (let k = 0; k < 4 && wpick(EVENTS).f() === false; k++); } resolveRumors(); }
  flowStep(dt);
  for (const pl of G.pl) if (pl.kind === 'ai' && pl.alive && (pl.aiT -= dt) <= 0) { pl.aiT = BAL.aiEvery * rr(0.7, 1.3); aiThink(pl); if (G.over) return; }
  for (const pl of G.pl) forcedSales(pl);
  if ((G.histT -= dt) <= 0) {
    G.histT = BAL.histDt;
    for (const s of G.d) { s.hist.push(s.idx); if (s.hist.length > 200) s.hist.shift(); }
    for (const p of G.props) if (!p.gone) { p.hist.push(val(p)); if (p.hist.length > BAL.hist) p.hist.shift(); }
    for (const pl of G.pl) pl.wh.push(pl.alive ? netWorth(pl.i) : 0);
  }
  checkEnd();
}

/* ---------- AI rival ---------- */
function aiThink(pl) {
  const i = pl.i, man = mansionP(), fullMan = mansionPrice() * (1 + buyFee());
  if (man.owner === -1 && pl.cash >= fullMan) { doAct(i, 'buy', { id: man.id, loan: false }); return; }
  const goal = netWorth(i) > fullMan * 1.06, h = heat();
  for (const p of ownedBy(i)) {
    if (!canSell(p)) continue;
    const v = val(p), g = p.offer * (1 - sellFee()) / p.paid;
    if (goal || p.hotT > 0 || g > 1.16 || (h < -0.025 && g > 1.03) || (p.loan && h < -0.05)) doAct(i, 'sell', { id: p.id });
  }
  if (goal) { if (pl.cash >= fullMan && man.owner === -1) doAct(i, 'buy', { id: man.id, loan: false }); return; }
  if (h < -0.04) return;
  const cands = G.props.filter(p => p.list && p.owner === -1 && p.kind !== 'mansion' && !p.stage)
    .map(p => ({ p, e: val(p) * (1 + gauss() * 0.045) / p.list.ask })).filter(c => c.e > 1.09).sort((a, b) => b.e - a.e);
  for (const c of cands.slice(0, 1)) {
    const ask = c.p.list.ask, loan = OP('loan') && pl.cash < ask * (1 + buyFee()) * 1.15, cost = buyCost(ask, loan);
    const reserve = (debtOf(i) + (loan ? ask * (1 - BAL.down) : 0)) * G.rate * 5 + 2;
    if (pl.cash - cost > reserve) doAct(i, 'buy', { id: c.p.id, loan });
  }
  if (OP('reno')) for (const p of ownedBy(i)) { const R = renoInfo(p); if (R && !p.reno && p.cond === 0 && pl.cash > R.cost * 3) doAct(i, 'reno', { id: p.id }); }
}
