/* 二人麻将 — two-player 国标-style mahjong with 万子 + 字牌 (64 tiles, optional 8 花牌), 8 番起和. */
const D = BX.draw, C = BX.C;
const NT = 16;                                // tile types: 0..8 一~九万, 9..12 东南西北, 13..15 中发白
const NUM = '一二三四五六七八九', HON = '东南西北中发白', FLW = '梅兰竹菊春夏秋冬';
const tyOf = id => id < 64 ? id >> 2 : 16 + (id - 64);
const isHon = t => t >= 9 && t < 16, isYao = t => t === 0 || t === 8 || isHon(t);
const tName = t => t < 9 ? NUM[t] + '万' : t < 16 ? HON[t - 9] : FLW[t - 16];
const EAST = 9, WEST = 11;

/* ---------------- pure rules ---------------- */
function counts(ids) { const c = new Array(NT).fill(0); for (const id of ids) if (id < 64) c[id >> 2]++; return c; }
/* standard shanten (4 melds + pair) with k exposed melds; 7-pairs variant when k = 0 */
function shantenN(c, k) {
  let best = 8; const need = 4 - k;
  (function rec(i, m, t, p) {
    while (i < NT && !c[i]) i++;
    if (i >= NT) { const tt = m + t > need ? need - m : t; const s = 8 - 2 * k - 2 * m - tt - p; if (s < best) best = s; return; }
    if (c[i] >= 3 && m < need) { c[i] -= 3; rec(i, m + 1, t, p); c[i] += 3; }
    if (i <= 6 && c[i + 1] && c[i + 2] && m < need) { c[i]--; c[i + 1]--; c[i + 2]--; rec(i, m + 1, t, p); c[i]++; c[i + 1]++; c[i + 2]++; }
    if (!p && c[i] >= 2) { c[i] -= 2; rec(i, m, t, 1); c[i] += 2; }
    if (m + t < need) {
      if (c[i] >= 2) { c[i] -= 2; rec(i, m, t + 1, p); c[i] += 2; }
      if (i <= 7 && c[i + 1]) { c[i]--; c[i + 1]--; rec(i, m, t + 1, p); c[i]++; c[i + 1]++; }
      if (i <= 6 && c[i + 2]) { c[i]--; c[i + 2]--; rec(i, m, t + 1, p); c[i]++; c[i + 2]++; }
    }
    c[i]--; rec(i + (c[i] ? 0 : 1), m, t, p); c[i]++;
  })(0, 0, 0, 0);
  return best;
}
function shanten7(c) { let p = 0; for (let i = 0; i < NT; i++) p += c[i] >> 1; return 6 - Math.min(7, p); }
const shanten = (c, k) => k ? shantenN(c, k) : Math.min(shantenN(c, 0), shanten7(c));
function complete(c, m, p) {
  let i = 0; while (i < NT && !c[i]) i++;
  if (i >= NT) return m === 0 && p;
  if (c[i] >= 3 && m > 0) { c[i] -= 3; const r = complete(c, m - 1, p); c[i] += 3; if (r) return true; }
  if (i <= 6 && c[i + 1] && c[i + 2] && m > 0) { c[i]--; c[i + 1]--; c[i + 2]--; const r = complete(c, m - 1, p); c[i]++; c[i + 1]++; c[i + 2]++; if (r) return true; }
  if (!p && c[i] >= 2) { c[i] -= 2; const r = complete(c, m, true); c[i] += 2; if (r) return true; }
  return false;
}
const isSeven = c => { let p = 0, n = 0; for (let i = 0; i < NT; i++) { n += c[i]; p += c[i] >> 1; if (c[i] & 1) return false; } return n === 14 && p === 7; };
const isWin = (c, k) => complete(c, 4 - k, false) || (k === 0 && isSeven(c));
function waits(c, k) { const w = []; for (let t = 0; t < NT; t++) { if (c[t] >= 4) continue; c[t]++; if (isWin(c, k)) w.push(t); c[t]--; } return w; }
function decomps(c, m) {
  const out = [], cur = [];
  (function rec(p) {
    let i = 0; while (i < NT && !c[i]) i++;
    if (i >= NT) { if (cur.length === m && p >= 0) out.push({melds: cur.slice(), pair: p}); return; }
    if (c[i] >= 3 && cur.length < m) { c[i] -= 3; cur.push({k: 'pung', t: i}); rec(p); cur.pop(); c[i] += 3; }
    if (i <= 6 && c[i + 1] && c[i + 2] && cur.length < m) { c[i]--; c[i + 1]--; c[i + 2]--; cur.push({k: 'chow', t: i}); rec(p); cur.pop(); c[i]++; c[i + 1]++; c[i + 2]++; }
    if (p < 0 && c[i] >= 2) { c[i] -= 2; rec(i); c[i] += 2; }
  })(-1);
  return out;
}
/* ---------------- 番种 (国标 subset) ---------------- */
const EXCL = {
  '大四喜': ['圈风刻', '门风刻', '三风刻', '碰碰和', '幺九刻'], '大三元': ['箭刻', '双箭刻'],
  '九莲宝灯': ['清一色', '门前清', '不求人', '无字', '幺九刻', '双暗刻', '三暗刻'], '四杠': ['三杠', '双明杠', '明杠', '双暗杠', '暗杠', '单钓将', '碰碰和'],
  '小四喜': ['三风刻', '幺九刻'], '小三元': ['箭刻', '双箭刻'], '字一色': ['碰碰和', '混幺九', '全带幺', '幺九刻'],
  '四暗刻': ['门前清', '碰碰和', '三暗刻', '双暗刻', '不求人'], '一色四同顺': ['一色三节高', '一般高', '四归一', '一色三同顺', '七对'],
  '一色四节高': ['一色三同顺', '碰碰和', '一色三节高'], '一色四步高': ['一色三步高', '连六', '老少副'], '三杠': ['双明杠', '双暗杠', '明杠', '暗杠'],
  '混幺九': ['碰碰和', '幺九刻', '全带幺'], '七对': ['门前清', '不求人', '单钓将'], '清一色': ['无字'], '一色三同顺': ['一色三节高', '一般高'],
  '一色三节高': ['一色三同顺'], '清龙': ['连六', '老少副'], '大于五': ['无字'], '小于五': ['无字'], '三风刻': ['幺九刻'],
  '妙手回春': ['自摸'], '杠上开花': ['自摸'], '全求人': ['单钓将'], '双暗杠': ['暗杠', '双暗刻'], '双明杠': ['明杠'], '双箭刻': ['箭刻'],
  '不求人': ['门前清', '自摸'], '平和': ['无字'], '断幺': ['无字'], '三暗刻': ['双暗刻'],
};
function pruneFans(F) {
  F.sort((a, b) => b[1] - a[1]);
  const kept = [];
  for (const f of F) if (!kept.some(k => (EXCL[k[0]] || []).includes(f[0]))) kept.push(f);
  return kept;
}
/* w = {self, last, gang, rob, seat, round, waitsN}; exp = exposed melds [{k:'chow'|'pung'|'kong', t, open}] */
function fanOf(all, pair, w, slot, fullC) {
  const F = [], add = (n, v, k = 1) => { if (k > 0) F.push([n, v * k, k]); };
  const pungs = all.filter(m => m.k !== 'chow'), chows = all.filter(m => m.k === 'chow'), kongs = all.filter(m => m.k === 'kong');
  const anke = pungs.filter(m => m.conc).length, openN = all.filter(m => m.open).length, menqian = openN === 0;
  const windP = pungs.filter(m => m.t >= 9 && m.t <= 12), dragP = pungs.filter(m => m.t >= 13);
  let hasHon = isHon(pair), hasSuit = !isHon(pair), allYao = isYao(pair), noYao = !isYao(pair), allBig = pair >= 5 && pair < 9, allSmall = pair <= 3;
  for (const m of all) {
    const ts = m.k === 'chow' ? [m.t, m.t + 1, m.t + 2] : [m.t];
    for (const t of ts) { if (isHon(t)) hasHon = true; else hasSuit = true; if (!isYao(t)) allYao = false; else noYao = false; if (!(t >= 5 && t < 9)) allBig = false; if (!(t <= 3)) allSmall = false; }
  }
  const ck = chows.map(m => m.t).sort((a, b) => a - b), pk = pungs.filter(m => m.t < 9).map(m => m.t).sort((a, b) => a - b);
  const cnt = v => ck.filter(x => x === v).length;
  if (windP.length === 4) add('大四喜', 88);
  if (dragP.length === 3) add('大三元', 88);
  if (kongs.length === 4) add('四杠', 88);
  if (menqian && !hasHon && fullC && fullC[0] >= 3 && fullC[8] >= 3 && [1, 2, 3, 4, 5, 6, 7].every(i => fullC[i] >= 1)) add('九莲宝灯', 88);
  if (windP.length === 3 && pair >= 9 && pair <= 12) add('小四喜', 64);
  if (dragP.length === 2 && pair >= 13) add('小三元', 64);
  if (!hasSuit) add('字一色', 64);
  if (anke === 4) add('四暗刻', 64);
  const same = Math.max(0, ...ck.map(cnt));
  if (same === 4) add('一色四同顺', 48);
  const run = (arr, len, step) => arr.some(a => { for (let j = 1; j < len; j++) if (!arr.includes(a + j * step)) return false; return true; });
  if (pk.length >= 4 && run(pk, 4, 1)) add('一色四节高', 48);
  if (ck.length === 4 && (run(ck, 4, 1) || run(ck, 4, 2))) add('一色四步高', 32);
  if (kongs.length === 3) add('三杠', 32);
  if (allYao && hasHon && hasSuit && !chows.length) add('混幺九', 32);
  if (!hasHon) add('清一色', 24);
  if (same === 3) add('一色三同顺', 24);
  if (pk.length >= 3 && run(pk, 3, 1)) add('一色三节高', 24);
  if (ck.includes(0) && ck.includes(3) && ck.includes(6)) add('清龙', 16);
  if (ck.length >= 3 && (run(ck, 3, 1) || run(ck, 3, 2))) add('一色三步高', 16);
  if (anke === 3) add('三暗刻', 16);
  if (allBig && !hasHon) add('大于五', 12);
  if (allSmall && !hasHon) add('小于五', 12);
  if (windP.length === 3) add('三风刻', 12);
  if (w.self && w.last) add('妙手回春', 8);
  if (!w.self && w.last && !w.rob) add('海底捞月', 8);
  if (w.self && w.gang) add('杠上开花', 8);
  if (w.rob) add('抢杠和', 8);
  if (!chows.length) add('碰碰和', 6);
  if (hasHon && hasSuit) add('混一色', 6);
  if (openN === 4 && !w.self && slot === 'pair') add('全求人', 6);
  const ak = kongs.filter(m => !m.open).length, mk = kongs.filter(m => m.open).length;
  if (ak === 2) add('双暗杠', 6);
  if (dragP.length === 2) add('双箭刻', 6);
  if (all.every(m => m.k === 'chow' ? (m.t === 0 || m.t === 6) : isYao(m.t)) && isYao(pair)) add('全带幺', 4);
  if (menqian && w.self) add('不求人', 4);
  if (mk === 2) add('双明杠', 4);
  add('箭刻', 2, dragP.length);
  const valued = t => t === w.round || t === w.seat;
  if (pungs.some(m => m.t === w.round)) add('圈风刻', 2);
  if (pungs.some(m => m.t === w.seat)) add('门风刻', 2);
  if (menqian && !w.self) add('门前清', 2);
  if (chows.length === 4 && !isHon(pair)) add('平和', 2);
  if (fullC) { let g4 = 0; for (let t = 0; t < NT; t++) if (fullC[t] === 4 && !kongs.some(m => m.t === t)) g4++; add('四归一', 2, g4); }
  if (anke === 2) add('双暗刻', 2);
  if (ak === 1) add('暗杠', 2);
  if (noYao) add('断幺', 2);
  let ybg = 0; for (let i = 0; i < ck.length; i++) for (let j = i + 1; j < ck.length; j++) if (ck[i] === ck[j]) ybg++;
  if (same < 3) add('一般高', 1, ybg);
  let l6 = 0; for (let i = 0; i < ck.length; i++) for (let j = 0; j < ck.length; j++) if (ck[j] === ck[i] + 3) { l6 = 1; }
  add('连六', 1, l6);
  if (ck.includes(0) && ck.includes(6)) add('老少副', 1);
  add('幺九刻', 1, pungs.filter(m => isYao(m.t) && m.t < 13 && !valued(m.t)).length);
  if (mk === 1) add('明杠', 1);
  if (w.waitsN === 1) { if (slot === 'pair') add('单钓将', 1); else if (slot === 'kan') add('坎张', 1); else if (slot === 'edge') add('边张', 1); }
  if (w.self) add('自摸', 1);
  if (!hasHon) add('无字', 1);
  return pruneFans(F);
}
/* best fan for a winning hand. hc = concealed counts INCLUDING win tile; exp exposed melds */
function evalWin(hc, exp, win, w) {
  const k = exp.length; if (!isWin(hc, k)) return null;
  const full = hc.slice(); for (const m of exp) { if (m.k === 'chow') { full[m.t]++; full[m.t + 1]++; full[m.t + 2]++; } else full[m.t] += 3; }
  const pre = hc.slice(); pre[win]--; const wn = waits(pre, k).length;
  const W = Object.assign({}, w, {waitsN: wn});
  const expM = exp.map(m => ({k: m.k, t: m.t, open: !!m.open, conc: m.k !== 'chow' && !m.open}));
  let best = null;
  const consider = F => { const tot = F.reduce((a, f) => a + f[1], 0); if (!best || tot > best.total) best = {total: tot, fans: F}; };
  for (const d of decomps(hc.slice(), 4 - k)) {
    const slots = [];
    if (d.pair === win) slots.push(['pair', -1]);
    d.melds.forEach((m, i) => {
      if (m.k === 'pung' && m.t === win) slots.push(['pung', i]);
      if (m.k === 'chow' && win >= m.t && win <= m.t + 2) slots.push([win === m.t + 1 ? 'kan' : (m.t === 0 && win === 2) || (m.t === 6 && win === 6) ? 'edge' : 'side', i]);
    });
    for (const [slot, si] of slots) {
      const conc = d.melds.map((m, i) => ({k: m.k, t: m.t, open: false, conc: m.k === 'pung' && !(i === si && !w.self)}));
      consider(fanOf(expM.concat(conc), d.pair, W, slot, full));
    }
  }
  if (k === 0 && isSeven(hc)) {
    const F = [['七对', 24, 1]]; let hon = false, suit = false, yao = false, big = true, small = true;
    for (let t = 0; t < NT; t++) if (hc[t]) { if (isHon(t)) hon = true; else suit = true; if (isYao(t)) yao = true; if (!(t >= 5 && t < 9)) big = false; if (t > 3) small = false; }
    if (!suit) F.push(['字一色', 64, 1]); else if (!hon) F.push(['清一色', 24, 1]); else F.push(['混一色', 6, 1]);
    if (!hon && big) F.push(['大于五', 12, 1]); if (!hon && small) F.push(['小于五', 12, 1]);
    if (!yao) F.push(['断幺', 2, 1]);
    let g4 = 0; for (let t = 0; t < NT; t++) if (hc[t] === 4) g4++; if (g4) F.push(['四归一', 2 * g4, g4]);
    if (w.self && w.last) F.push(['妙手回春', 8, 1]); else if (w.self) F.push(['自摸', 1, 1]);
    if (!w.self && w.last) F.push(['海底捞月', 8, 1]);
    if (w.self && w.gang) F.push(['杠上开花', 8, 1]);
    if (w.rob) F.push(['抢杠和', 8, 1]);
    if (!hon) F.push(['无字', 1, 1]);
    consider(pruneFans(F));
  }
  return best;
}

/* ---------------- tile art ---------------- */
function tileFace(g, x, y, w, h, ty, o = {}) {
  const d = Math.max(2, h * .1), r = w * .14;
  g.save();
  if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = w * .12; g.shadowOffsetY = w * .06; }
  g.fillStyle = '#2f7a55'; D.rr(g, x, y + d * .2, w, h, r); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#1f5a3e'; D.rr(g, x, y + h - d * .9 + d * .2, w, d, r * .6); g.fill();
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#fffdf4'); gr.addColorStop(1, '#e8dcc0');
  g.fillStyle = gr; D.rr(g, x, y, w, h - d, r); g.fill();
  g.strokeStyle = 'rgba(120,100,60,.35)'; g.lineWidth = 1; g.stroke();
  const fh = h - d, cx = x + w / 2;
  if (ty < 9) {
    D.text(g, NUM[ty], cx, y + fh * .3, {size: w * .56, color: '#1d2a44', font: 'serif', weight: 900});
    D.text(g, '萬', cx, y + fh * .7, {size: w * .58, color: '#b8261c', font: 'serif', weight: 900});
  } else if (ty < 13) D.text(g, HON[ty - 9], cx, y + fh * .52, {size: w * .78, color: '#1d2a44', font: 'serif', weight: 900});
  else if (ty === 13) D.text(g, '中', cx, y + fh * .52, {size: w * .8, color: '#c0261c', font: 'serif', weight: 900});
  else if (ty === 14) D.text(g, '發', cx, y + fh * .52, {size: w * .76, color: '#1f7a3e', font: 'serif', weight: 900});
  else if (ty === 15) { g.strokeStyle = '#2f5d8a'; g.lineWidth = Math.max(1.5, w * .08); D.rr(g, x + w * .2, y + fh * .18, w * .6, fh * .64, w * .06); g.stroke(); g.lineWidth = Math.max(1, w * .03); D.rr(g, x + w * .28, y + fh * .26, w * .44, fh * .48, w * .04); g.stroke(); }
  else { const fi = ty - 16; D.text(g, FLW[fi], cx, y + fh * .45, {size: w * .62, color: fi < 4 ? '#1f7a3e' : '#b8261c', font: 'serif', weight: 900}); D.text(g, String(fi % 4 + 1), x + w * .8, y + fh * .82, {size: w * .26, color: '#8a6a2c', weight: 800}); }
  if (o.sel) { g.strokeStyle = o.sel === true ? '#e0a020' : o.sel; g.lineWidth = Math.max(2, w * .08); D.rr(g, x, y, w, h - d, r); g.stroke(); }
  if (o.dim) { g.fillStyle = 'rgba(40,20,0,.28)'; D.rr(g, x, y, w, h, r); g.fill(); }
  g.restore();
}
function tileBack(g, x, y, w, h, o = {}) {
  const r = w * .14, d = Math.max(2, h * .12);
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = w * .1; g.shadowOffsetY = w * .05;
  g.fillStyle = '#efe4c8'; D.rr(g, x, y + d, w, h - d, r); g.fill(); g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#3f9a6c'); gr.addColorStop(1, '#22603f');
  g.fillStyle = gr; D.rr(g, x, y, w, h - d, r); g.fill();
  if (o.flat !== true && w > 14) { g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; D.rr(g, x + w * .15, y + h * .12, w * .7, h * .6, r * .5); g.stroke(); }
  g.restore();
}

BX.register({
  id: 'mahjong', title: '二人麻将', cat: 'cards', order: 6, sub: '万子字牌，八番起和',
  desc: '两人对局的国标风味麻将：只用万子与字牌（可加花牌），吃碰杠俱全，八番起和，和牌后列出番种明细。',
  kind: 'turn', seats: 2, hidden: true, firstLabel: '坐庄', aiDelay: 480, seatColors: ['#c23a2b', '#2f5d8a'],
  options: [{key: 'flower', label: '花牌', choices: [[1, '有花（补花）'], [0, '无花']], def: 1}],
  rules: `<p><b>牌：</b>万子一万至九万各 4 张，字牌东南西北中发白各 4 张，共 64 张；选“有花”时另加梅兰竹菊春夏秋冬 8 张花牌。</p>
<p><b>开局：</b>庄家（东风位）14 张，闲家（西风位）13 张，圈风为东。摸到花牌立即亮出，并从牌墙尾部<b>补花</b>。</p>
<p><b>行牌：</b>轮流摸牌、打牌。对手打出的牌可以：<br>· <b>吃</b>：与手中两张组成顺子（二人对局中对手的牌都可吃）；<br>· <b>碰</b>：手中有两张相同牌；<br>· <b>明杠</b>：手中有三张相同牌。<br>自己摸牌后可<b>暗杠</b>（四张相同）或<b>补杠</b>（加到已碰的刻子上，对手可<b>抢杠和</b>）。杠后从牌墙尾部补一张牌。</p>
<p><b>和牌：</b>四组面子（顺子/刻子/杠）加一对将，或七个对子（七对）。自摸或和对手打出的牌均可。<b>必须达到 8 番才能和牌</b>（花牌每张 1 番，不计入起和番数）。</p>
<p><b>常用番种：</b>大四喜 88、大三元 88、九莲宝灯 88、四杠 88、小四喜 64、小三元 64、字一色 64、四暗刻 64、混幺九 32、清一色 24、七对 24、一色三同顺 24、清龙 16、三暗刻 16、三风刻 12、妙手回春 8、海底捞月 8、杠上开花 8、抢杠和 8、碰碰和 6、混一色 6、双箭刻 6、全带幺 4、不求人 4、箭刻 2、圈风刻 2、门风刻 2、门前清 2、平和 2、四归一 2、双暗刻 2、暗杠 2、断幺 2、一般高 1、连六 1、老少副 1、幺九刻 1、明杠 1、边张/坎张/单钓将 1、自摸 1、无字 1 等。番种按国标“不重复计番”原则计算，取最高组合。</p>
<p><b>荒庄：</b>牌墙摸完仍无人和牌则流局。一局定胜负。</p>
<p>操作：轮到你时点选一张牌，再点一次打出（电脑上可直接单击）；可吃碰杠和时下方会弹出按钮。</p>`,
  icon(g, w, h) {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .7); gr.addColorStop(0, '#2f7a56'); gr.addColorStop(1, '#173d2b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const tw = w * .14, th = tw * 1.38;
    [0, 1, 2].forEach((t, i) => tileFace(g, w * .08 + i * tw, h * .18, tw, th, t));
    [13, 13, 13].forEach((t, i) => tileFace(g, w * .54 + i * tw, h * .18, tw, th, t));
    tileBack(g, w * .1, h * .62, tw * .9, th * .8); tileBack(g, w * .1 + tw * .9, h * .62, tw * .9, th * .8);
    tileFace(g, w * .5, h * .58, tw * 1.25, th * 1.25, 14);
    D.text(g, '和', w * .82, h * .74, {size: h * .24, color: '#e6c57d', font: 'deco', weight: 400, shadow: true});
  },
  create(ctx) {
    const FL = ctx.opts.flower == null ? 1 : +ctx.opts.flower;
    const st = {wall: [], wp: 0, we: 0, hands: [[], []], melds: [[], []], fl: [[], []], river: [[], []], dealer: 0, turn: 0,
      ph: 'start', last: null, drawn: null, gang: false, rob: null, win: null, over: false, msg: '', nAct: 0};
    const ids = BX.range(64 + (FL ? 8 : 0)); st.wall = ctx.rng.shuffle(ids); st.we = st.wall.length;
    const wind = s => s === st.dealer ? EAST : WEST;
    const live = () => st.we - st.wp;
    const opp = s => 1 - s;
    const sortHand = s => st.hands[s].sort((a, b) => tyOf(a) - tyOf(b) || a - b);
    function takeTile(s, back) {
      for (;;) {
        if (live() <= 0) return null;
        const id = back ? st.wall[--st.we] : st.wall[st.wp++];
        if (id >= 64) { st.fl[s].push(id); back = true; ctx.sfx('pop'); continue; }
        return id;
      }
    }
    function drawFor(s, back) {
      const id = takeTile(s, back);
      if (id == null) return exhaust();
      st.hands[s].push(id); st.drawn = id; st.gang = !!back; st.turn = s; st.ph = 'discard'; st.last = null;
      ctx.sfx('card');
    }
    function exhaust() { st.ph = 'over'; st.over = true; st.msg = '荒庄流局'; status(); ctx.end({winner: -1, title: '荒庄流局', big: '和', text: '牌墙已摸完，无人和牌', delay: 1500}); }
    function deal() {
      for (let r = 0; r < 13; r++) for (const s of [st.dealer, opp(st.dealer)]) st.hands[s].push(st.wall[st.wp++]);
      st.hands[st.dealer].push(st.wall[st.wp++]);
      for (const s of [st.dealer, opp(st.dealer)]) {   // 补花
        for (let i = 0; i < st.hands[s].length; i++) {
          const id = st.hands[s][i];
          if (id >= 64) { st.fl[s].push(id); const nid = takeTile(s, true); st.hands[s][i] = nid; i--; }
        }
        sortHand(s);
      }
      st.turn = st.dealer; st.ph = 'discard'; st.drawn = null; ctx.sfx('deal');
    }
    const winCtx = (s, self, extra) => Object.assign({self, last: live() === 0, gang: self && st.gang, rob: false, seat: wind(s), round: EAST}, extra || {});
    function huEval(s, t, self, extra) {
      const c = counts(st.hands[s]); if (t != null) c[t]++;
      const r = evalWin(c, st.melds[s], self ? tyOf(st.drawn) : t, winCtx(s, self, extra));
      return r;
    }
    const huOK = r => r && r.total >= 8;
    function claims(s) {
      const L = {hu: false, peng: false, gang: false, chi: []};
      if (!st.last || st.last.by === s) return L;
      const t = tyOf(st.last.id), c = counts(st.hands[s]);
      L.hu = huOK(huEval(s, t, false));
      if (live() > 0) {
        L.peng = c[t] >= 2; L.gang = c[t] >= 3;
        if (t < 9) for (const lo of [t - 2, t - 1, t]) { if (lo < 0 || lo + 2 > 8) continue; let ok = true; for (let k = lo; k <= lo + 2; k++) if (k !== t && !c[k]) ok = false; if (ok) L.chi.push(lo); }
      }
      return L;
    }
    const anyClaim = L => L.hu || L.peng || L.gang || L.chi.length;
    function turnOpts(s) {
      const O = {zimo: false, an: [], bu: []};
      if (st.ph !== 'discard' || st.turn !== s) return O;
      if (st.drawn != null) O.zimo = huOK(huEval(s, null, true));
      if (live() > 0 && st.drawn != null && st.hands[s].length % 3 === 2) {
        const c = counts(st.hands[s]);
        for (let t = 0; t < NT; t++) { if (c[t] === 4) O.an.push(t); if (c[t] && st.melds[s].some(m => m.k === 'pung' && m.t === t)) O.bu.push(t); }
      }
      return O;
    }
    function takeFromHand(s, t, k) { const out = []; for (let i = st.hands[s].length - 1; i >= 0 && out.length < k; i--) if (tyOf(st.hands[s][i]) === t) out.push(st.hands[s].splice(i, 1)[0]); return out; }
    function declareWin(s, r, self, tile) {
      const fl = st.fl[s].length, fans = r.fans.map(f => ({n: f[0], v: f[1], k: f[2]}));
      if (fl) fans.push({n: '花牌', v: fl, k: fl});
      const total = r.total + fl;
      st.win = {s, fans, total, self, tile, from: self ? -1 : opp(s)};
      st.ph = 'over'; st.over = true; st.turn = -1;
      ctx.sfx('gong');
      const rows = fans.map(f => `<tr><td style="text-align:left;padding:2px 10px">${f.n}${f.k > 1 ? ' ×' + f.k : ''}</td><td style="text-align:right;padding:2px 10px"><b>${f.v}</b> 番</td></tr>`).join('');
      const how = self ? '自摸' : st.rob ? '抢杠和' : '点和';
      status();
      ctx.end({winner: s, delay: 2200, html: `<div style="margin-bottom:6px">${BX.esc(ctx.name(s))} ${how} <b>${tName(tile)}</b></div><table style="margin:0 auto;font-size:15px;border-collapse:collapse">${rows}<tr style="border-top:1px solid rgba(0,0,0,.2)"><td style="text-align:left;padding:4px 10px"><b>合计</b></td><td style="text-align:right;padding:4px 10px;color:#b23a2b"><b>${total}</b> 番</td></tr></table>`});
    }
    function afterDiscard(s) {
      const o = opp(s);
      if (anyClaim(claims(o))) { st.ph = 'claim'; st.turn = o; return; }
      drawFor(o, false);
    }

    /* ---------------- AI ---------------- */
    function unseen(s) {
      const c = new Array(NT).fill(4);
      const see = id => { if (id < 64) c[id >> 2]--; };
      st.hands[s].forEach(see); st.river[0].forEach(see); st.river[1].forEach(see);
      for (const p of [0, 1]) for (const m of st.melds[p]) if (m.open || p === s) m.ids.forEach(see);
      return c.map(v => Math.max(0, v));
    }
    function evalDiscard(s, c, k, level, U) {
      const sh = shanten(c, k); let uke = 0, good = 0;
      for (let t = 0; t < NT; t++) {
        if (!U[t]) continue; c[t]++;
        if (sh === 0) { if (isWin(c, k)) { uke += U[t]; if (level >= 2) { const r = evalWin(c, st.melds[s], t, winCtx(s, false)); if (huOK(r)) good += U[t] * (1 + Math.min(2, r.total / 24)); } } }
        else if (shanten(c, k) < sh) uke += U[t];
        c[t]--;
      }
      return {sh, uke, good};
    }
    function planBonus(s, c, k) {   // steer toward 8-fan shapes
      let hon = 0, honPairs = 0; for (let t = 9; t < NT; t++) { hon += c[t]; if (c[t] >= 2 && (t >= 13 || t === wind(s) || t === EAST)) honPairs++; }
      const expHon = st.melds[s].some(m => m.t >= 9);
      if (!expHon && hon <= 3 && honPairs === 0) return -hon * 1.2;   // 清一色 path: shed honors
      return honPairs * 1.5;                                           // 混一色 + 箭刻/风刻 path
    }
    function bestDiscard(s, level) {
      const hand = st.hands[s], c = counts(hand), k = st.melds[s].length, U = unseen(s);
      const types = [...new Set(hand.filter(id => id < 64).map(tyOf))];
      const sc = [];
      for (const t of types) {
        c[t]--;
        const e = evalDiscard(s, c, k, level, U);
        let v = -e.sh * 100 + e.uke * (level === 1 ? .3 : 1);
        if (level >= 2 && e.sh === 0) v += e.good * 3 - (e.good ? 0 : 60);
        if (level >= 2) v += planBonus(s, c, k);
        if (level >= 3) {   // simple defence: tiles already in the opponent's river are safe-ish; honours with 3 visible are safe
          const o = opp(s), danger = st.melds[o].length >= 2 && st.river[o].length > 4;
          if (danger && !st.river[o].some(id => tyOf(id) === t) && U[t] > 0) v -= 8 + st.melds[o].length * 4;
          if (isHon(t) && U[t] === 0) v += 1;
        }
        c[t]++;
        sc.push([t, v]);
      }
      let t = level === 1 && Math.random() < .25 ? BX.pick(types) : BX.ai.byLevel(sc, level === 1 ? 2 : 3);
      if (t == null) t = types[0];
      const pick = st.drawn != null && tyOf(st.drawn) === t ? st.drawn : hand.filter(id => tyOf(id) === t).pop();
      return {t: 'dis', id: pick, v: sc.find(x => x[0] === t)[1]};
    }
    function shAfter(s, cAdj, kAdd) {   // best shanten after a claim + one discard
      const c = counts(st.hands[s]); for (const [t, d] of cAdj) c[t] += d;
      const k = st.melds[s].length + kAdd; let best = 9;
      for (let t = 0; t < NT; t++) if (c[t]) { c[t]--; best = Math.min(best, shanten(c, k)); c[t]++; }
      return best;
    }
    function aiClaim(s, level) {
      const L = claims(s); if (L.hu) return {t: 'hu'};
      const t = tyOf(st.last.id), c = counts(st.hands[s]), k = st.melds[s].length, cur = shanten(c, k);
      const opts = [];
      if (L.gang) { const c2 = c.slice(); c2[t] -= 3; opts.push([{t: 'gang'}, shanten(c2, k + 1) - .3]); }
      if (L.peng) opts.push([{t: 'peng'}, shAfter(s, [[t, -2]], 1)]);
      for (const lo of L.chi) { const adj = []; for (let x = lo; x <= lo + 2; x++) if (x !== t) adj.push([x, -1]); opts.push([{t: 'chi', lo}, shAfter(s, adj, 1) + (level >= 2 && k === 0 && c.slice(9).some(v => v >= 2) ? .2 : 0) + .1]); }
      opts.sort((a, b) => a[1] - b[1]);
      if (!opts.length) return {t: 'pass'};
      const [a, v] = opts[0];
      if (level === 1) return Math.random() < .6 ? (a.t === 'chi' && Math.random() < .5 ? {t: 'pass'} : a) : {t: 'pass'};
      if (v < cur) {
        if (level >= 3 && a.t === 'chi' && cur <= 1 && k === 0) return {t: 'pass'};   // keep 门前清 when already close
        return a;
      }
      if (a.t === 'gang' && v <= cur) return a;
      return {t: 'pass'};
    }
    function aiTurn(s, level) {
      const O = turnOpts(s); if (O.zimo) return {t: 'zimo'};
      const c = counts(st.hands[s]), k = st.melds[s].length;
      for (const t of O.an) { const c2 = c.slice(); c2[t] -= 4; let b = 9; for (let x = 0; x < NT; x++) if (c2[x]) { c2[x]--; b = Math.min(b, shanten(c2, k + 1)); c2[x]++; } c2[t] = 0; if (b <= shanten(c, k) - (k ? 0 : 0) || level === 1) return {t: 'an', tt: t}; }
      for (const t of O.bu) { const c2 = c.slice(); c2[t]--; if (shanten(c2, k) <= shanten(c, k) || level === 1) return {t: 'bu', tt: t}; }
      const d = bestDiscard(s, level); return {t: 'dis', id: d.id};
    }
    function legalActs(s) {
      if (st.over || st.turn !== s) return null;
      return st.ph;
    }

    /* ---------------- UI ---------------- */
    const cv = ctx.canvas();
    const ui = ctx.ui();
    ui.append(h('style', {text: `.mj-bar{gap:8px}.mj-bar .bx-btn{min-width:64px;padding:10px 14px;font-size:17px}
@media (max-height:500px){.mj-bar{bottom:6px}.mj-bar .bx-btn{min-height:42px;padding:6px 12px}}`}));
    const bar = h('div', {class: 'bx-bar mj-bar'}); ui.append(bar);
    let sel = -1, hover = -1, sig = '', hitBoxes = [];
    const me = () => ctx.view;
    function refreshUI(force) {
      const s = me(), can = ctx.canAct(s);
      const key = JSON.stringify([can, st.ph, st.turn, st.nAct, s]);
      if (key === sig && !force) return; sig = key;
      bar.innerHTML = '';
      if (!can) return;
      const B = (txt, cls, a) => h('button', {class: 'bx-btn ' + (cls || ''), text: txt, on: {click: () => { ctx.sfx('click'); sel = -1; ctx.act(a, s); }}});
      if (st.ph === 'claim') {
        const L = claims(s), t = tyOf(st.last.id);
        if (L.hu) bar.append(B('和', 'red', {t: 'hu'}));
        if (L.gang) bar.append(B('杠', 'jade', {t: 'gang'}));
        if (L.peng) bar.append(B('碰', 'jade', {t: 'peng'}));
        for (const lo of L.chi) bar.append(B('吃 ' + [lo, lo + 1, lo + 2].map(x => NUM[x]).join(''), '', {t: 'chi', lo}));
        bar.append(B('过', 'ghost', {t: 'pass'}));
        void t;
      } else if (st.ph === 'rob') {
        bar.append(B('抢杠和', 'red', {t: 'hu'}), B('过', 'ghost', {t: 'pass'}));
      } else if (st.ph === 'discard') {
        const O = turnOpts(s);
        if (O.zimo) bar.append(B('自摸 和', 'red', {t: 'zimo'}));
        for (const t of O.an) bar.append(B('暗杠 ' + tName(t), 'jade', {t: 'an', tt: t}));
        for (const t of O.bu) bar.append(B('补杠 ' + tName(t), 'jade', {t: 'bu', tt: t}));
      }
    }
    function status() {
      for (const s of [0, 1]) ctx.info(s, (wind(s) === EAST ? '东·庄' : '西') + (st.fl[s].length ? ' 花' + st.fl[s].length : ''));
      const s = me(), can = ctx.canAct(s), who = ctx.hotseat ? ctx.name(s) + '：' : '';
      let m;
      if (st.win) m = ctx.name(st.win.s) + (st.win.self ? ' 自摸' : ' 和牌') + ' · ' + st.win.total + ' 番';
      else if (st.over) m = '荒庄流局';
      else if (st.ph === 'start') m = '洗牌砌墙…';
      else if (!can) m = '等待 ' + ctx.name(st.turn) + (st.ph === 'claim' ? ' 决定是否吃碰…' : ' 出牌…');
      else if (st.ph === 'claim') m = who + '对手打出 ' + tName(tyOf(st.last.id)) + '，要吗？';
      else if (st.ph === 'rob') m = who + '可以抢杠和！';
      else m = who + (BX.TOUCH.matches ? '点选一张牌，再点一次打出' : '单击一张牌打出');
      ctx.status(m + ' · 余 ' + live() + ' 张');
      refreshUI();
    }
    function tapTile(id) {
      const s = me(); if (!ctx.canAct(s) || st.ph !== 'discard') return;
      if (sel === id) { sel = -1; ctx.act({t: 'dis', id}, s); return; }
      sel = id; ctx.sfx('tick');
    }
    const hitAt = p => { for (let i = hitBoxes.length - 1; i >= 0; i--) { const b = hitBoxes[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y - b.lift && p.y <= b.y + b.h) return b.id; } return -1; };
    ctx.on(cv.cv, 'pointerdown', e => {
      const id = hitAt(cv.pos(e));
      if (id < 0) { sel = -1; return; }
      if (e.pointerType === 'mouse') { const s = me(); if (ctx.canAct(s) && st.ph === 'discard') { sel = -1; ctx.act({t: 'dis', id}, s); } }
      else tapTile(id);
    });
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = hitAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);

    /* ---------------- drawing ---------------- */
    const vis = new Map(); let wait = 0;
    function frame(dt) {
      const g = cv.g, W = cv.w, Hc = cv.h; cv.clear('#1e130a');
      const s = me(), o = opp(s), wide = W > Hc * 1.25;
      const br = bar.getBoundingClientRect(), strip = wide ? 52 : 62;
      const Ha = Hc - strip;
      // table
      D.wood(g, 0, 0, W, Hc, {base: '#3e2414', dark: '#1a0e06', seed: 4, grain: .25});
      const pad = 6; g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14;
      D.rr(g, pad, pad, W - pad * 2, Hc - pad * 2, 16); g.fillStyle = '#6b3a1c'; g.fill(); g.restore();
      D.felt(g, pad + 6, pad + 6, W - pad * 2 - 12, Hc - pad * 2 - 12, {color: '#2a6a4b', r: 12});
      // sizes
      const hn = st.hands[s].length, mt = st.melds[s].reduce((a, m) => a + m.ids.length, 0);
      const slots = wide ? hn + 1 + mt * .78 + (st.melds[s].length ? .5 : 0) : 14.6;
      const two = !wide && (W - 24) / 14.6 < 40;
      let tw = two ? Math.min((W - 24) / 7.6, Ha * .075, 56) : Math.min((W - 24) / slots, Ha * (wide ? .14 : .085), 64);
      const th = tw * 1.36;
      const ow = tw * (wide ? .72 : .78), oh = ow * 1.36;
      const rCols = wide ? 12 : 9, rw = Math.min(tw * (wide ? .78 : 1.02), (W * (wide ? .72 : .9)) / rCols), rh = rw * 1.36;
      const T = [];
      // my hand row
      const myY = Ha - th - 4, topY = two ? myY - th - 6 : myY;
      const meldW = st.melds[s].reduce((a, m) => a + m.ids.length * tw * .78 + tw * .2, 0);
      let x = wide ? (W - (hn + 1) * tw - meldW) / 2 : two ? (W - 7.4 * tw) / 2 : (W - (hn + (st.drawn != null && st.turn === s ? .4 : 0)) * tw) / 2;
      x = Math.max(12, x);
      hitBoxes = [];
      const hand = st.hands[s].slice(), drawnHere = st.drawn != null && st.turn === s && hand.includes(st.drawn) && st.ph === 'discard';
      const sorted = hand.filter(id => !(drawnHere && id === st.drawn)).sort((a, b) => tyOf(a) - tyOf(b) || a - b);
      if (drawnHere) sorted.push(st.drawn);
      const canDis = ctx.canAct(s) && st.ph === 'discard';
      if (!canDis) sel = -1;
      sorted.forEach((id, i) => {
        const isD = drawnHere && i === sorted.length - 1, row = two && i < 7 && !(isD && i < 7) ? 0 : 1, col = two ? (row ? i - 7 : i) : i;
        const gx = isD && two ? x + 6.4 * tw : x + col * tw + (isD ? tw * .4 : 0), gy = two && !row ? topY : myY;
        const lift = canDis && (id === sel || id === hover) ? th * .22 : 0;
        T.push({id, x: gx, y: gy - lift, w: tw, h: th, face: true, sel: id === sel});
        if (canDis) hitBoxes.push({id, x: gx, y: gy, w: tw, h: th, lift: th * .2});
      });
      const handEnd = x + sorted.length * tw + (drawnHere ? tw * .4 : 0);
      // my melds
      let mx = wide ? handEnd + tw * .5 : (W - meldW) / 2, my = wide ? myY + th - th * .78 : topY - th * .78 - 10;
      if (!wide && st.melds[s].length) { /* row above hand */ }
      const drawMelds = (p, sx, sy, mwid, faceAll) => {
        let cx = sx;
        for (const m of st.melds[p]) {
          m.ids.forEach((id, j) => {
            const hide = m.k === 'kong' && !m.open && (j === 0 || j === 3) && !st.over;
            T.push({id, x: cx, y: sy, w: mwid, h: mwid * 1.36, face: !hide, meld: true}); cx += mwid;
          });
          cx += mwid * .26;
        }
        return cx;
      };
      drawMelds(s, mx, my, tw * .78);
      // flowers (mine)
      const flW = Math.max(12, tw * .5);
      st.fl[s].forEach((id, i) => T.push({id, x: W - 14 - (st.fl[s].length - i) * flW, y: wide ? 14 + oh + 8 : topY - th * .78 - 10 - (st.melds[s].length ? flW * 1.5 : 0) - flW * 1.36 - 4, w: flW, h: flW * 1.36, face: true}));
      // opponent
      const oy = 16, on = st.hands[o].length, showOpp = st.over;
      const omW = st.melds[o].reduce((a, m) => a + m.ids.length * ow + ow * .26, 0);
      let ox = Math.max(12, (W - on * ow - omW - ow * .6) / 2);
      st.hands[o].slice().sort((a, b) => tyOf(a) - tyOf(b) || a - b).forEach((id, i) => T.push({id, x: ox + i * ow, y: oy, w: ow, h: oh, face: showOpp, back: !showOpp}));
      drawMelds(o, ox + on * ow + ow * .6, oy, ow);
      st.fl[o].forEach((id, i) => T.push({id, x: 14 + i * flW, y: oy + oh + 6, w: flW, h: flW * 1.36, face: true}));
      // rivers
      const topR = oy + oh + (st.fl[o].length ? flW * 1.36 + 10 : 10), botR = (wide ? myY : my) - 10 - (!wide && st.fl[s].length ? flW * 1.5 : 0);
      const midY = (topR + botR) / 2, rx0 = (W - rCols * rw) / 2;
      const rRows = p => Math.max(1, Math.ceil(st.river[p].length / rCols));
      st.river[o].forEach((id, i) => { const r = Math.floor(i / rCols), c = i % rCols; T.push({id, x: rx0 + c * rw, y: midY - 22 - (r + 1) * rh, w: rw, h: rh, face: true, last: st.last && st.last.id === id}); });
      st.river[s].forEach((id, i) => { const r = Math.floor(i / rCols), c = i % rCols; T.push({id, x: rx0 + c * rw, y: midY + 22 + r * rh, w: rw, h: rh, face: true, last: st.last && st.last.id === id}); });
      void rRows;
      // center info
      g.fillStyle = 'rgba(15,35,25,.55)'; D.rr(g, W / 2 - 92, midY - 17, 184, 34, 17); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.45)'; g.lineWidth = 1; g.stroke();
      D.text(g, '东风圈', W / 2 - 52, midY, {size: 14, color: '#e6c57d', font: 'serif', weight: 700});
      D.text(g, '余 ' + live() + ' 张', W / 2 + 40, midY, {size: 14, color: '#f3e2c0', weight: 700});
      // seat wind badges
      const badge = (txt, bx, by2, col) => { D.disc(g, bx, by2, 13, col, {shadow: true}); D.text(g, txt, bx, by2 + 1, {size: 14, color: '#fff3e3', font: 'serif', weight: 900}); };
      badge(wind(o) === EAST ? '东' : '西', W - 26, oy + oh / 2, ctx.color(o));
      badge(wind(s) === EAST ? '东' : '西', wide ? 24 : W / 2 - 110, wide ? myY + th / 2 : midY, ctx.color(s));
      // tween + draw
      const src = {x: W / 2 - tw / 2, y: midY - th / 2};
      wait = Math.max(0, wait - dt);
      for (const t of T) {
        let v = vis.get(t.id);
        if (!v) { v = {x: src.x, y: src.y, wait: ctx.fast ? 0 : wait}; wait += st.ph === 'discard' && st.river[0].length + st.river[1].length === 0 && !st.melds[0].length ? .025 : 0; vis.set(t.id, v); }
        if (v.wait > 0) { v.wait -= dt; continue; }
        const k = Math.min(1, dt * 12); v.x += (t.x - v.x) * k; v.y += (t.y - v.y) * k;
        if (t.back) tileBack(g, v.x, v.y, t.w, t.h);
        else tileFace(g, v.x, v.y, t.w, t.h, tyOf(t.id), {sel: t.sel || (t.last ? '#ffcf4a' : false), shadow: !t.meld || true, dim: st.win && st.win.from >= 0 && false});
        if (t.last && st.ph === 'claim') { g.fillStyle = '#ffcf4a'; g.beginPath(); const ax = v.x + t.w / 2, ay = v.y - 4; g.moveTo(ax, ay); g.lineTo(ax - 6, ay - 9); g.lineTo(ax + 6, ay - 9); g.closePath(); g.fill(); }
      }
      // waits hint for selected tile
      if (sel >= 0 && canDis) {
        const c = counts(st.hands[s]); c[tyOf(sel)]--; const ws = waits(c, st.melds[s].length);
        if (ws.length) { const txt = '打出后听：' + ws.map(tName).join(' '); D.text(g, txt, W / 2, topY - th * .3 - 12, {size: 13, color: '#ffe3a0', weight: 700, stroke: 'rgba(0,0,0,.6)', strokeW: 3}); }
      }
      // win banner
      if (st.win) {
        const fs = Math.min(40, W / 12);
        D.text(g, st.win.self ? '自 摸' : '和', W / 2, midY, {size: fs, color: '#ffd76a', font: 'deco', weight: 400, stroke: '#5a1a10', strokeW: 6});
        D.text(g, st.win.fans.slice(0, 4).map(f => f.n).join(' · ') + ' … ' + st.win.total + ' 番', W / 2, midY + fs * .9, {size: 14, color: '#fff3d6', weight: 700, stroke: 'rgba(0,0,0,.6)', strokeW: 3});
      } else if (st.over) D.text(g, '荒 庄', W / 2, midY, {size: Math.min(40, W / 12), color: '#f3e2c0', font: 'deco', weight: 400, stroke: '#2a190d', strokeW: 6});
      void br;
      refreshUI();
    }

    const inst = {
      st,
      toMove: () => st.over || st.ph === 'start' ? null : st.turn,
      sysMove: () => st.ph === 'start' ? {a: {t: 'deal'}, delay: 500} : null,
      valid(a, by) {
        if (st.over || st.turn !== by) return false;
        if (st.ph === 'discard') {
          if (a.t === 'dis') return st.hands[by].includes(a.id);
          const O = turnOpts(by);
          if (a.t === 'zimo') return O.zimo; if (a.t === 'an') return O.an.includes(a.tt); if (a.t === 'bu') return O.bu.includes(a.tt);
          return false;
        }
        if (st.ph === 'claim') { const L = claims(by); return a.t === 'pass' || (a.t === 'hu' && L.hu) || (a.t === 'peng' && L.peng) || (a.t === 'gang' && L.gang) || (a.t === 'chi' && L.chi.includes(a.lo)); }
        if (st.ph === 'rob') return a.t === 'pass' || a.t === 'hu';
        return false;
      },
      apply(a, by) {
        st.nAct++;
        if (a.t === 'deal') { deal(); status(); return; }
        const s = by;
        if (st.ph === 'discard') {
          if (a.t === 'dis') {
            const i = st.hands[s].indexOf(a.id); st.hands[s].splice(i, 1); sortHand(s);
            st.river[s].push(a.id); st.last = {id: a.id, by: s}; st.drawn = null; st.gang = false; ctx.sfx('place');
            afterDiscard(s);
          } else if (a.t === 'zimo') { const r = huEval(s, null, true); declareWin(s, r, true, tyOf(st.drawn)); return; }
          else if (a.t === 'an') { const idsK = takeFromHand(s, a.tt, 4); st.melds[s].push({k: 'kong', t: a.tt, open: false, ids: idsK}); ctx.sfx('hit'); sortHand(s); drawFor(s, true); }
          else if (a.t === 'bu') {
            const [id] = takeFromHand(s, a.tt, 1); sortHand(s); ctx.sfx('hit');
            const o = opp(s), r = (() => { const c = counts(st.hands[o]); c[a.tt]++; return evalWin(c, st.melds[o], a.tt, winCtx(o, false, {rob: true})); })();
            st.rob = {id, by: s, tt: a.tt}; st.drawn = null;
            if (huOK(r)) { st.ph = 'rob'; st.turn = o; }
            else { const m = st.melds[s].find(m2 => m2.k === 'pung' && m2.t === a.tt); m.k = 'kong'; m.ids.push(id); st.rob = null; drawFor(s, true); }
          }
        } else if (st.ph === 'claim') {
          const t = tyOf(st.last.id), from = st.last.by, lid = st.last.id;
          if (a.t === 'pass') { drawFor(s, false); }
          else if (a.t === 'hu') { const r = huEval(s, t, false); st.river[from].pop(); declareWin(s, r, false, t); return; }
          else {
            st.river[from].pop();
            if (a.t === 'peng') { st.melds[s].push({k: 'pung', t, open: true, ids: takeFromHand(s, t, 2).concat(lid)}); ctx.sfx('hit'); }
            else if (a.t === 'gang') { st.melds[s].push({k: 'kong', t, open: true, ids: takeFromHand(s, t, 3).concat(lid)}); ctx.sfx('hit'); }
            else { const idsC = []; for (let x2 = a.lo; x2 <= a.lo + 2; x2++) idsC.push(x2 === t ? lid : takeFromHand(s, x2, 1)[0]); st.melds[s].push({k: 'chow', t: a.lo, open: true, ids: idsC}); ctx.sfx('move'); }
            sortHand(s); st.last = null; st.turn = s;
            if (a.t === 'gang') drawFor(s, true);
            else { st.ph = 'discard'; st.drawn = null; st.gang = false; }
          }
        } else if (st.ph === 'rob') {
          const R = st.rob;
          if (a.t === 'hu') { const c = counts(st.hands[s]); c[R.tt]++; const r = evalWin(c, st.melds[s], R.tt, winCtx(s, false, {rob: true})); declareWin(s, r, false, R.tt); return; }
          const m = st.melds[R.by].find(m2 => m2.k === 'pung' && m2.t === R.tt); m.k = 'kong'; m.ids.push(R.id); st.rob = null; drawFor(R.by, true);
        }
        status();
      },
      aiMove(s, level) {
        if (st.ph === 'claim') return aiClaim(s, level);
        if (st.ph === 'rob') return {t: 'hu'};
        if (st.ph === 'discard') return aiTurn(s, level);
        return null;
      },
      onTurn: status,
      onView() { sel = -1; sig = ''; status(); },
      frame,
    };
    void legalActs;
    return inst;
  },
});
