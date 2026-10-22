/* ================= simulation (host authoritative) ================= */
function mkPlayer(i, name, kind) {
  return { i, name, kind, cash: BAL.start, alive: true, ready: false, gone: false, wh: [], flow: null, st: { buys: 0, sells: 0, profit: 0, best: 0, reno: 0, insp: 0, forced: 0 } };
}
function newGame(seed, names, aiOn, opt, diff) {
  G = {
    v: 1, rs: seed | 0, seed, month: 0, rate: BAL.rate0, reg: { k: 'calm', left: 6 },
    d: DISTS.map(() => ({ idx: 1, base: 1, n: 0, hist: [], pend: [] })),
    news: [], ev: [], seq: 0, rumors: [], over: null, pl: [], solo: names.length === 1,
    opt: Object.assign({}, PRESET.full, opt || {}), diff: DIFF[diff] ? diff : 'normal'
  };
  G.manBase = BAL.mansion[G.opt.loan ? 1 : 0] * DIFF[G.diff].man;
  Object.assign(G, genWorld());
  names.forEach((nm, i) => G.pl.push(mkPlayer(i, nm, 'human')));
  if (aiOn) G.pl.push(mkPlayer(G.pl.length, '王老板', 'ai'));
  for (let k = 0; k < 24; k++) marketStep(true);
  for (const p of G.props) { const D = G.d[p.d], v = val(p); p.hist = D.hist.slice(-BAL.hist).map(x => v * x / D.idx); }
  refreshListings(true);
  for (const pl of G.pl) pl.wh.push(netWorth(pl.i));
  news('info', '开局', '你带着 ' + fmtM(BAL.start) + ' 来到这座城市。半山顶的终极豪宅挂牌 ' + fmtM(mansionPrice()) + '，全款买下它！');
  news('info', '行情', '楼市目前' + REG[G.reg.k].n + (OP('loan') ? '，房贷月利率 ' + (G.rate * 100).toFixed(2) + '%' : ''));
  return G;
}

/* ---------- event log (synced; each client plays new ones once) ---------- */
function ev(k, txt, pi, id, amt) { G.ev.push({ s: ++G.seq, k, txt, pi: pi == null ? -1 : pi, id: id == null ? -1 : id, amt: amt || 0, m: G.month }); if (G.ev.length > 60) G.ev.shift(); }
function news(tone, tag, txt, d) { G.news.push({ m: G.month, tone, tag, txt, d: d == null ? -1 : d }); if (G.news.length > 80) G.news.shift(); ev('news', txt, -1, -1, tone === 'good' ? 1 : tone === 'bad' ? -1 : 0); }

/* ---------- market ---------- */
function marketStep(pre) {
  if (--G.reg.left <= 0) {
    const k = G.reg.k;
    const nx = k === 'calm' ? wpick([{ v: 'bull', w: 5 }, { v: 'bear', w: 3 }, { v: 'calm', w: 2 }]).v
      : k === 'bull' ? wpick([{ v: 'calm', w: 6 }, { v: 'bear', w: 3 }, { v: 'bull', w: 1 }]).v
        : wpick([{ v: 'calm', w: 6 }, { v: 'bull', w: 4 }]).v;
    G.reg = { k: nx, left: nx === 'calm' ? ri(4, 10) : ri(7, 16) };
    if (!pre && nx !== k && OP('news')) {
      if (nx === 'bull') news('good', '楼市', pick(['楼市回暖，看房的人明显多了', '成交量连续放大，楼市进入上涨周期', '开发商纷纷提价，楼市热起来了']));
      else if (nx === 'bear') news('bad', '楼市', pick(['楼市降温，买家观望情绪浓厚', '成交量大跌，房价开始松动', '中介门店冷清，楼市进入下行周期']));
      else news('info', '楼市', pick(['楼市趋于平稳，涨跌都不大', '量价平稳，市场进入盘整期']));
    }
  }
  const rd = REG[G.reg.k].d - (G.rate - BAL.rate0) * 2.2;
  G.d.forEach((s, i) => {
    const D = DISTS[i]; let shock = 0;
    s.pend = s.pend.filter(e => { if (e.after > 0) { e.after--; return true; } shock += e.k; return --e.m > 0; });
    s.base *= Math.exp(D.mu + D.beta * rd + shock);
    s.n = 0.78 * s.n + D.vol * gauss();
    s.idx = s.base * Math.exp(s.n);
    s.hist.push(s.idx); if (s.hist.length > 200) s.hist.shift();
  });
}
const shockD = (d, total, months, after) => G.d[d].pend.push({ k: total / months, m: months, after: after || 0 });
const shockAll = (total, months) => G.d.forEach((s, i) => shockD(i, total * (0.6 + 0.4 * DISTS[i].beta), months));

const EVENTS = [
  { w: 2.6, f() { // metro rumor
      if (G.rumors.some(r => r.k === 'metro')) return false;
      const d = pick([DI.sub, DI.sub, DI.old, DI.tech]), line = ri(3, 9);
      G.rumors.push({ k: 'metro', d, line, at: G.month + ri(2, 4), real: rnd() < 0.62 });
      shockD(d, 0.03, 2);
      news('rumor', '传闻', '地铁 ' + line + ' 号线可能延伸到' + DISTS[d].n + '，几个月内会有消息', d);
    } },
  { w: 2.2, f() { // demolition rumor
      if (G.rumors.some(r => r.k === 'demo')) return false;
      const bs = G.blocks.map((b, i) => i).filter(i => G.blocks[i].d === DI.old && G.props.some(p => p.b === i && (p.kind === 'bungalow' || p.kind === 'walkup')));
      if (!bs.length) return false;
      const b = pick(bs), real = rnd() < 0.5;
      G.rumors.push({ k: 'demo', b, at: G.month + ri(2, 5), real });
      for (const p of G.props) if (p.b === b && (p.kind === 'bungalow' || p.kind === 'walkup')) { p.bonus += 0.08; p.demo = 1; }
      news('rumor', '传闻', G.blocks[b].st + '一带的老房子可能要拆迁，补偿据说很高', DI.old);
    } },
  { w: 1.3, f() { shockD(DI.school, 0.09, 2); news('good', '学府区', pick(['省重点中学在学府区开分校', '实验小学扩招，学区房一房难求']), DI.school); } },
  { w: 1.2, f() { shockD(DI.tech, 0.13, 3); news('good', '科技新区', pick(['互联网大厂总部落户科技新区', '新能源车企在科技新区建研发中心，数千人入职']), DI.tech); } },
  { w: 1.1, f() { shockD(DI.tech, -0.12, 2); news('bad', '科技新区', pick(['科技公司裁员潮，园区写字楼空置率上升', '明星创业公司倒闭，科技新区租房的人少了']), DI.tech); } },
  { w: 1.2, f() { if (!OP('loan') || G.rate >= BAL.rateMax - 1e-6) return false; G.rate = Math.min(BAL.rateMax, G.rate + 0.0008); shockAll(-0.03, 1); news('bad', '利率', '央行加息，房贷月利率升到 ' + (G.rate * 100).toFixed(2) + '%'); } },
  { w: 1.2, f() { if (!OP('loan') || G.rate <= BAL.rateMin + 1e-6) return false; G.rate = Math.max(BAL.rateMin, G.rate - 0.0008); shockAll(0.03, 1); news('good', '利率', '央行降息，房贷月利率降到 ' + (G.rate * 100).toFixed(2) + '%'); } },
  { w: 0.8, f() { shockAll(-0.05, 2); if (G.reg.k === 'calm') G.reg = { k: 'bear', left: ri(6, 12) }; news('bad', '政策', '出台限购令，二套房首付提高，市场观望'); } },
  { w: 0.8, f() { shockAll(0.05, 2); if (G.reg.k === 'calm') G.reg = { k: 'bull', left: ri(6, 12) }; news('good', '政策', '放开限购，购房补贴落地，买房的人多了'); } },
  { w: 0.9, f() { shockD(DI.river, 0.08, 2); news('good', '江景区', pick(['滨江步道全线贯通，江景房更抢手了', '江边要建音乐厅，江景区身价看涨']), DI.river); } },
  { w: 0.6, f() { shockD(DI.river, -0.09, 1); shockD(DI.river, 0.05, 2, 2); news('bad', '江景区', '江水上涨，江景区几个小区地库进水', DI.river); } },
  { w: 0.8, f() {
      const fac = G.deco.find(d => d.k === 'factory');
      if (fac && rnd() < 0.4) { G.deco.splice(G.deco.indexOf(fac), 1); G.deco.push({ k: 'park', x: fac.x, y: fac.y, w: 2, h: 2, nm: '湿地公园' }); shockD(DI.sub, 0.1, 2); news('good', '城郊', '化工厂整体搬迁，原址改建湿地公园', DI.sub); }
      else if (fac) { shockD(DI.sub, -0.08, 2); news('bad', '城郊', '城郊化工厂被曝偷排废水', DI.sub); }
      else { shockD(DI.sub, 0.06, 2); news('good', '城郊', '城郊湿地公园成了网红打卡地', DI.sub); }
    } },
  { w: 0.7, f() { shockD(DI.sub, 0.08, 2); news('good', '城郊', '城郊要建大型购物中心和三甲医院分院', DI.sub); } },
  { w: 0.7, f() { shockD(DI.old, 0.06, 2); news('good', '老城区', '老城区改造，鼓楼一带变成步行街', DI.old); } },
  { w: 0.6, f() { shockD(DI.hill, 0.06, 2); news('info', '半山', '外地富豪扎堆半山买别墅，豪宅也跟着涨价', DI.hill); } },
  { w: 0.5, f() { shockD(DI.hill, -0.05, 2); news('info', '半山', '半山别墅区修路封山半年，看房的人少了', DI.hill); } },
  { w: 1.6, f() { news('info', '城事', pick(['本月城市新增常住人口三千人', '房产中介开始流行直播带看', '物业费调价听证会召开', '城市马拉松从江边跑到半山脚下', '一家网红奶茶店在老城区排起长队', '统计局：上月二手房成交与前月持平'])); } }
];
function monthEvents() {
  if (!OP('news')) return;
  const n = rnd() < 0.25 ? 2 : rnd() < 0.85 ? 1 : 0;
  for (let k = 0, tries = 0; k < n && tries < 10; tries++) if (wpick(EVENTS).f() !== false) k++;
}
function resolveRumors() {
  G.rumors = G.rumors.filter(r => {
    if (r.at > G.month) return true;
    if (r.k === 'metro') {
      if (r.real) {
        shockD(r.d, 0.2, 3); news('good', '地铁', '确定了！地铁 ' + r.line + ' 号线延伸到' + DISTS[r.d].n + '，站点开工', r.d);
        const b = G.blocks.findIndex(b => b.d === r.d); const free = [];
        G.blocks.forEach(bb => { if (bb.d !== r.d) return; for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) if (G.tiles[ti(x, y)] === T_GRASS && !G.props.some(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) && !G.deco.some(d => x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h)) free.push([x, y]); });
        if (free.length) { const [x, y] = pick(free); G.deco.push({ k: 'metro', x, y, w: 1, h: 1, nm: r.line + ' 号线' }); }
      } else { shockD(r.d, -0.04, 1); news('bad', '辟谣', '地铁 ' + r.line + ' 号线不经过' + DISTS[r.d].n + '，之前是谣言', r.d); }
    } else if (r.k === 'demo') {
      const st = G.blocks[r.b].st;
      const hit = G.props.filter(p => p.b === r.b && p.demo);
      for (const p of hit) { p.bonus = Math.max(0, p.bonus - 0.08); p.demo = 0; }
      if (r.real) {
        for (const p of hit) {
          const v = val(p);
          if (p.owner >= 0) { const pl = G.pl[p.owner], got = v * BAL.demolish - p.loan, prof = v * BAL.demolish - p.paid; pl.cash += got; pl.st.profit += prof; pl.st.best = Math.max(pl.st.best, prof); ev('demo', pl.name + ' 的 ' + propName(p) + ' 拆迁，拿到补偿 ' + fmtM(v * BAL.demolish), p.owner, p.id, prof); }
          Object.assign(p, { kind: 'newflat', cond: 2, owner: -1, loan: 0, paid: 0, list: null, insp: [], reno: 0, cool: ri(2, 4), bonus: 0 });
          p.hist = p.hist.map(x => x * KINDS.newflat.base * COND[2].m / (KINDS.bungalow.base * 0.9));
        }
        news('good', '拆迁', st + '拆迁方案公布：老房按评估价 ' + BAL.demolish + ' 倍补偿，原地建回迁新楼', DI.old);
      } else news('bad', '辟谣', st + '拆迁传闻落空，附近房价回落', DI.old);
    }
    return false;
  });
}

/* ---------- listings & offers ---------- */
function makeListing(p, cheap) {
  const r = cheap ? 0 : rnd(), H = DF().hot; let f, tag = '';
  if (r < H) { f = rr(0.72, 0.88); tag = 'hot'; }
  else if (r < H + 0.04) { f = rr(0.96, 1.08); tag = 'hot'; }      // 喊急售但不便宜
  else if (r < 0.27) f = rr(1.14, 1.3);
  else f = clamp(1.04 + gauss() * 0.065, 0.86, 1.2);
  const v = val(p);
  p.list = { ask: v * f, f, est: clamp(1 + gauss() * BAL.estNoise, 0.84, 1.16), left: ri(2, 5), age: 0, tag, cut: false, m0: G.month };
  p.insp = [];
}
function refreshListings(init) {
  for (const p of G.props) {
    if (p.kind === 'mansion') continue;
    if (p.cool > 0) p.cool--;
    if (p.list && !init) {
      if (p.owner !== -1) { p.list = null; continue; }
      p.list.age++; p.list.left--;
      if (p.list.left <= 0) { p.list = null; p.cool = ri(1, 3); continue; }
      const v = val(p), cut = p.list.age >= 2 && rnd() < 0.45 ? rr(0.93, 0.98) : 1;
      p.list.f = Math.max(0.62, p.list.f * cut); p.list.ask = v * p.list.f; p.list.cut = cut < 1;
    }
  }
  const cnt = G.props.filter(p => p.list && p.kind !== 'mansion').length;
  const want = init ? 10 : Math.max(2, ri(BAL.listTarget[0], BAL.listTarget[1]) - cnt);
  const cand = shuffle(G.props.filter(p => p.owner === -1 && !p.list && !p.cool && p.kind !== 'mansion'));
  let k = 0;
  for (; k < want && k < cand.length; k++) makeListing(cand[k]);
  const cheapNow = () => G.props.filter(p => p.list && p.kind !== 'mansion' && p.list.f <= 0.9).length;
  for (let tries = 0; cheapNow() < DF().minGood && k < cand.length && tries < 6; tries++, k++) makeListing(cand[k], true);
  const m = mansionP();
  if (m.owner === -1) { const v = val(m); m.list = { ask: v, f: 1, est: 1, left: 99, age: 0, tag: 'goal', cut: false, m0: 0 }; }
}
function refreshOffers() {
  const h = clamp(heat() * 1.4, -0.045, 0.045);
  for (const p of G.props) if (p.owner >= 0) {
    const v = val(p);
    if (rnd() < 0.07) { p.offer = v * rr(1.09, 1.2); p.offerHot = true; }
    else { p.offer = v * clamp(DF().offer + h + gauss() * 0.042, 0.84, 1.12); p.offerHot = false; }
  }
}

/* ---------- player actions ---------- */
function doAct(pi, a, v) {
  if (!G || G.over) return '本局已结束';
  const pl = G.pl[pi]; if (!pl || !pl.alive) return '你已出局';
  const p = v && v.id != null ? G.props[v.id] : null;
  switch (a) {
    case 'ready': pl.ready = !!v.on; return null;
    case 'inspect': {
      if (!OP('insp')) return '本局没有验房';
      if (!p || !p.list || p.owner !== -1) return '这套房没在挂牌';
      if (knows(p, pi)) return null;
      const c = inspCost(p); if (pl.cash < c) return '现金不够付验房费';
      pl.cash -= c; p.insp.push(pi); pl.st.insp++;
      ev('inspect', '验房完成：' + propName(p), pi, p.id); return null;
    }
    case 'buy': {
      if (!p || !p.list || p.owner !== -1) return '这套房已经被别人买走了';
      const man = p.kind === 'mansion', loan = !!v.loan && !man && OP('loan'), ask = p.list.ask, cost = buyCost(ask, loan);
      if (pl.cash < cost - 1e-9) return man ? '现金不够，豪宅只能全款' : '现金不够';
      pl.cash -= cost; pl.st.buys++;
      Object.assign(p, { owner: pi, loan: loan ? ask * (1 - BAL.down) : 0, paid: ask * (1 + buyFee()), boughtM: G.month, list: null, offer: val(p) * rr(0.86, 0.94), offerHot: false });
      if (man) { G.over = { winner: pi, reason: 'mansion', m: G.month }; ev('win', pl.name + ' 全款买下了终极豪宅！', -1, p.id); }
      else ev('buy', pl.name + ' 买下 ' + propName(p) + '（' + fmtM(ask) + (loan ? '，按揭' : '') + '）', pi, p.id, ask);
      return null;
    }
    case 'sell': {
      if (!p || p.owner !== pi) return '这不是你的房';
      if (p.reno) return '装修中，不能卖';
      if (p.boughtM === G.month) return '刚买的房要办过户，下个月才能卖';
      const got = sellNet(p), prof = p.offer * (1 - sellFee()) - p.paid;
      pl.cash += got; pl.st.sells++; pl.st.profit += prof; pl.st.best = Math.max(pl.st.best, prof);
      ev('sell', pl.name + ' 卖出 ' + propName(p) + '，' + (prof >= 0 ? '赚了 ' : '亏了 ') + fmtM(Math.abs(prof)), pi, p.id, prof);
      Object.assign(p, { owner: -1, loan: 0, paid: 0, list: null, insp: [], cool: ri(2, 4), offer: 0 });
      return null;
    }
    case 'reno': {
      if (!OP('reno')) return '本局没有装修';
      if (!p || p.owner !== pi) return '这不是你的房';
      if (p.reno) return '已经在装修了';
      const R = renoInfo(p); if (!R) return '已经是精装了';
      if (pl.cash < R.cost) return '现金不够付装修费';
      pl.cash -= R.cost; p.reno = R.t; p.renoTo = p.cond + 1; p.paid += R.cost; pl.st.reno++;
      ev('reno', propName(p) + ' 开始装修（' + R.t + ' 个月）', pi, p.id); return null;
    }
    case 'repay': {
      if (!p || p.owner !== pi || p.loan <= 0) return '没有贷款';
      if (pl.cash < p.loan) return '现金不够还清贷款';
      pl.cash -= p.loan; ev('repay', propName(p) + ' 的贷款已还清', pi, p.id); p.loan = 0; return null;
    }
  }
  return '未知操作';
}

/* ---------- month end ---------- */
function forcedSales(pl) {
  if (pl.cash >= 0) return;
  const mine = ownedBy(pl.i).sort((a, b) => (val(b) * BAL.forced - b.loan) - (val(a) * BAL.forced - a.loan));
  for (const p of mine) {
    if (pl.cash >= 0) break;
    const got = val(p) * BAL.forced - p.loan, prof = val(p) * BAL.forced - p.paid;
    if (got <= 0 && pl.cash + got < pl.cash) continue;
    pl.cash += got; pl.st.profit += prof; pl.st.forced++;
    ev('forced', '现金为负，银行强制卖掉了 ' + pl.name + ' 的 ' + propName(p) + '（' + fmtM(val(p) * BAL.forced) + '）', pl.i, p.id, prof);
    Object.assign(p, { owner: -1, loan: 0, paid: 0, list: null, insp: [], reno: 0, cool: ri(2, 4), offer: 0 });
  }
  if (pl.cash < 0) {
    pl.alive = false;
    for (const p of ownedBy(pl.i)) Object.assign(p, { owner: -1, loan: 0, paid: 0, list: null, insp: [], reno: 0, cool: 2 });
    ev('bankrupt', pl.name + ' 资不抵债，破产出局了', -1);
    news('bad', '破产', pl.name + ' 资不抵债，破产出局');
  }
}
function endMonth() {
  if (!G || G.over) return;
  for (const pl of G.pl) if (pl.kind === 'ai' && pl.alive) { aiTurn(pl); if (G.over) return; }
  for (const pl of G.pl) { if (!pl.alive) continue; const f = monthlyFlow(pl.i); pl.cash += f.net; pl.flow = f; }
  for (const p of G.props) if (p.reno > 0 && --p.reno === 0) { p.cond = p.renoTo; if (p.owner >= 0) ev('renodone', propName(p) + ' 装修完成，现在是' + COND[p.cond].n, p.owner, p.id); }
  G.month++;
  marketStep(false); monthEvents(); resolveRumors();
  for (const p of G.props) { p.hist.push(val(p)); if (p.hist.length > BAL.hist) p.hist.shift(); }
  refreshListings(false); refreshOffers();
  for (const pl of G.pl) if (pl.alive) forcedSales(pl);
  for (const pl of G.pl) { pl.wh.push(pl.alive ? netWorth(pl.i) : 0); pl.ready = false; }
  const humans = G.pl.filter(p => p.kind === 'human');
  if (!humans.some(p => p.alive)) { const ai = G.pl.find(p => p.kind === 'ai' && p.alive); G.over = { winner: ai ? ai.i : -1, reason: 'bankrupt', m: G.month }; }
  else if (G.month >= BAL.maxMonth) {
    let best = -1, bw = -1e18; for (const pl of G.pl) if (pl.alive && netWorth(pl.i) > bw) { bw = netWorth(pl.i); best = pl.i; }
    G.over = { winner: G.solo && G.pl.length === 1 ? -1 : best, reason: 'time', m: G.month };
  }
  ev('month', monthLabel(G.month), -1);
}
const humansReady = () => G.pl.every(p => p.kind !== 'human' || !p.alive || p.gone || p.ready);

/* ---------- AI rival ---------- */
function aiTurn(pl) {
  const i = pl.i, man = mansionP(), mp = man.list ? man.list.ask : val(man);
  const fullMan = mp * (1 + buyFee());
  if (pl.cash >= fullMan) { doAct(i, 'buy', { id: man.id, loan: false }); return; }
  const goal = netWorth(i) > fullMan * 1.06, h = heat();
  for (const p of ownedBy(i)) {
    if (p.reno) continue;
    const v = val(p), g = p.offer * (1 - sellFee()) / p.paid;
    if (goal || p.offer > v * 1.06 || g > 1.2 || (h < -0.025 && g > 1.03) || (p.loan && h < -0.05)) doAct(i, 'sell', { id: p.id });
  }
  if (goal) { if (pl.cash >= fullMan) doAct(i, 'buy', { id: man.id, loan: false }); return; }
  if (h < -0.04) return;
  const cands = G.props.filter(p => p.list && p.owner === -1 && p.kind !== 'mansion')
    .map(p => ({ p, e: val(p) * (1 + gauss() * 0.045) / p.list.ask })).filter(c => c.e > 1.08).sort((a, b) => b.e - a.e);
  let n = 0;
  for (const c of cands) {
    if (n >= 2) break;
    const ask = c.p.list.ask, loan = OP('loan') && pl.cash < ask * (1 + buyFee()) * 1.15, cost = buyCost(ask, loan);
    const reserve = (debtOf(i) + (loan ? ask * (1 - BAL.down) : 0)) * G.rate * 5 + 2;
    if (pl.cash - cost > reserve) { doAct(i, 'buy', { id: c.p.id, loan }); n++; }
  }
  if (OP('reno')) for (const p of ownedBy(i)) { const R = renoInfo(p); if (R && !p.reno && p.cond === 0 && pl.cash > R.cost * 3) doAct(i, 'reno', { id: p.id }); }
}
