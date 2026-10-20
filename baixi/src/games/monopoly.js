/* 地产大亨 — classic property-trading board game (40 spaces, auctions, houses, mortgages, trades). */
const D = BX.draw, C = BX.C, h = BX.h;
const GC = ['#8a5a3a', '#7cc0de', '#c9558f', '#e08a2e', '#c8352b', '#e3bd2a', '#3f8f5b', '#2f4f9a'];
const S_ = (n, g, price, rent, hc) => ({k: 'st', n, g, price, rent, hc});
const SP = [
  {k: 'go', n: '起点'},
  S_('柳巷', 0, 60, [2, 10, 30, 90, 160, 250], 50),
  {k: 'cc', n: '命运'},
  S_('竹篱街', 0, 60, [4, 20, 60, 180, 320, 450], 50),
  {k: 'tax', n: '所得税', amt: 200},
  {k: 'rr', n: '东门驿', price: 200, g: 8},
  S_('青石巷', 1, 100, [6, 30, 90, 270, 400, 550], 50),
  {k: 'ch', n: '机会'},
  S_('杏花村', 1, 100, [6, 30, 90, 270, 400, 550], 50),
  S_('桃源路', 1, 120, [8, 40, 100, 300, 450, 600], 50),
  {k: 'jail', n: '监狱'},
  S_('梧桐道', 2, 140, [10, 50, 150, 450, 625, 750], 100),
  {k: 'ut', n: '电力公司', s: '电力', price: 150, g: 9},
  S_('莲池街', 2, 140, [10, 50, 150, 450, 625, 750], 100),
  S_('兰亭路', 2, 160, [12, 60, 180, 500, 700, 900], 100),
  {k: 'rr', n: '南门驿', price: 200, g: 8},
  S_('茶马街', 3, 180, [14, 70, 200, 550, 750, 950], 100),
  {k: 'cc', n: '命运'},
  S_('锦绣坊', 3, 180, [14, 70, 200, 550, 750, 950], 100),
  S_('丝绸巷', 3, 200, [16, 80, 220, 600, 800, 1000], 100),
  {k: 'park', n: '免费停车'},
  S_('朱雀大街', 4, 220, [18, 90, 250, 700, 875, 1050], 150),
  {k: 'ch', n: '机会'},
  S_('凤鸣路', 4, 220, [18, 90, 250, 700, 875, 1050], 150),
  S_('鼓楼街', 4, 240, [20, 100, 300, 750, 925, 1100], 150),
  {k: 'rr', n: '西门驿', price: 200, g: 8},
  S_('金沙路', 5, 260, [22, 110, 330, 800, 975, 1150], 150),
  S_('琉璃坊', 5, 260, [22, 110, 330, 800, 975, 1150], 150),
  {k: 'ut', n: '自来水公司', s: '自来水', price: 150, g: 9},
  S_('银杏大道', 5, 280, [24, 120, 360, 850, 1025, 1200], 150),
  {k: 'gojail', n: '入狱'},
  S_('翡翠湖畔', 6, 300, [26, 130, 390, 900, 1100, 1275], 200),
  S_('碧云山庄', 6, 300, [26, 130, 390, 900, 1100, 1275], 200),
  {k: 'cc', n: '命运'},
  S_('玉带河', 6, 320, [28, 150, 450, 1000, 1200, 1400], 200),
  {k: 'rr', n: '北门驿', price: 200, g: 8},
  {k: 'ch', n: '机会'},
  S_('紫宸苑', 7, 350, [35, 175, 500, 1100, 1300, 1500], 200),
  {k: 'tax', n: '奢侈税', amt: 100},
  S_('龙门府', 7, 400, [50, 200, 600, 1400, 1700, 2000], 200),
];
const GROUPS = BX.range(10).map(g => BX.range(40).filter(i => SP[i].g === g && SP[i].price));
const GPRICE = GROUPS.map(L => L.reduce((a, i) => a + SP[i].price, 0));
const isProp = i => !!SP[i].price;
const UNM = i => Math.ceil(SP[i].price * 55 / 100);       // unmortgage cost (+10%)
const FEE = i => Math.ceil(SP[i].price * 5 / 100);         // 10% interest when receiving a mortgaged lot
const CHANCE = [
  {t: 'adv', to: 0, x: '策马扬鞭，直奔起点（领取 ¥200）'},
  {t: 'adv', to: 24, x: '前往鼓楼街赏花灯。途经起点可领 ¥200'},
  {t: 'adv', to: 11, x: '漫步梧桐道。途经起点可领 ¥200'},
  {t: 'advUT', x: '前往最近的公用事业。若无主可购买；若有主，重新掷骰并支付点数 10 倍'},
  {t: 'advRR', x: '搭车前往最近的驿站。若有主，支付双倍车资；若无主可购买'},
  {t: 'advRR', x: '快马加鞭赶往最近的驿站。若有主，支付双倍车资；若无主可购买'},
  {t: 'money', v: 50, x: '茶庄年终分红，领取 ¥50'},
  {t: 'free', x: '「免罪金牌」：可保留或转让，出狱时使用'},
  {t: 'back', x: '走错了路，后退三格'},
  {t: 'jail', x: '私贩茶叶被查获，直接入狱，不经过起点'},
  {t: 'repair', h: 25, ht: 100, x: '修缮祖宅：每栋房屋付 ¥25，每座酒楼付 ¥100'},
  {t: 'money', v: -15, x: '骑马闹市超速，罚银 ¥15'},
  {t: 'adv', to: 5, x: '去东门驿接远客。途经起点可领 ¥200'},
  {t: 'adv', to: 39, x: '登门拜访龙门府'},
  {t: 'each', v: -50, x: '当选茶会会长，向每位玩家支付 ¥50'},
  {t: 'money', v: 150, x: '钱庄放款到期，收回 ¥150'},
];
const CHEST = [
  {t: 'adv', to: 0, x: '吉星高照，前进至起点（领取 ¥200）'},
  {t: 'money', v: 200, x: '钱庄算错了账，退还你 ¥200'},
  {t: 'money', v: -50, x: '看郎中，付诊金 ¥50'},
  {t: 'money', v: 50, x: '卖出茶园股份，得 ¥50'},
  {t: 'free', x: '「免罪金牌」：可保留或转让，出狱时使用'},
  {t: 'jail', x: '卷入一桩官司，直接入狱，不经过起点'},
  {t: 'money', v: 100, x: '中秋礼金到账，领取 ¥100'},
  {t: 'money', v: 20, x: '官府退还多收的税银 ¥20'},
  {t: 'each', v: 10, x: '今天是你的寿辰，每位玩家送你 ¥10'},
  {t: 'money', v: 100, x: '寿险到期，领取 ¥100'},
  {t: 'money', v: -100, x: '住医馆调养，付 ¥100'},
  {t: 'money', v: -50, x: '交私塾束脩 ¥50'},
  {t: 'money', v: 25, x: '替人看风水，得酬金 ¥25'},
  {t: 'repair', h: 40, ht: 115, x: '整修街道：每栋房屋付 ¥40，每座酒楼付 ¥115'},
  {t: 'money', v: 10, x: '花灯会猜谜获二等奖，得 ¥10'},
  {t: 'money', v: 100, x: '继承远房亲戚遗产 ¥100'},
];
const FREE_ID = {ch: 7, cc: 4};
const DECKN = {ch: '机会', cc: '命运'}, DECKC = {ch: '#d9822b', cc: '#2f5d8a'};

/* ---------- board geometry (board side bs, 13 units: corners 2u) ---------- */
function tileRect(i, bs) {
  const u = bs / 13, c = 2 * u;
  if (i === 0) return {x: bs - c, y: bs - c, w: c, h: c, side: -1};
  if (i < 10) return {x: bs - c - i * u, y: bs - c, w: u, h: c, side: 0};
  if (i === 10) return {x: 0, y: bs - c, w: c, h: c, side: -1};
  if (i < 20) return {x: 0, y: bs - c - (i - 10) * u, w: c, h: u, side: 1};
  if (i === 20) return {x: 0, y: 0, w: c, h: c, side: -1};
  if (i < 30) return {x: c + (i - 21) * u, y: 0, w: u, h: c, side: 2};
  if (i === 30) return {x: bs - c, y: 0, w: c, h: c, side: -1};
  return {x: bs - c, y: c + (i - 31) * u, w: c, h: u, side: 3};
}
function stripRect(r, bs) {
  const sh = (bs / 13) * 2 * .23;
  if (r.side === 0) return {x: r.x, y: r.y, w: r.w, h: sh};
  if (r.side === 2) return {x: r.x, y: r.y + r.h - sh, w: r.w, h: sh};
  if (r.side === 1) return {x: r.x + r.w - sh, y: r.y, w: sh, h: r.h};
  return {x: r.x, y: r.y, w: sh, h: r.h};
}
function vtext(g, s, cx, y0, size, color, weight) {
  for (let k = 0; k < s.length; k++) D.text(g, s[k], cx, y0 + size * (k + .5) * 1.04, {size, color, font: 'serif', weight: weight || 700});
}
function wrap(g, text, maxW) {
  const lines = []; let cur = '';
  for (const ch of text) { if (g.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
  if (cur) lines.push(cur); return lines;
}
function pawn(g, x, y, r, color, ring) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + r * .1, y + r * .9, r * .95, r * .38, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(x - r, y, x + r, y); gr.addColorStop(0, D.shade(color, 30)); gr.addColorStop(.5, color); gr.addColorStop(1, D.shade(color, -35));
  g.fillStyle = gr; g.strokeStyle = 'rgba(255,250,235,.9)'; g.lineWidth = Math.max(1, r * .12);
  g.beginPath(); g.ellipse(x, y + r * .72, r * .85, r * .32, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - r * .55, y + r * .7); g.quadraticCurveTo(x - r * .2, y + r * .1, x - r * .25, y - r * .35); g.lineTo(x + r * .25, y - r * .35); g.quadraticCurveTo(x + r * .2, y + r * .1, x + r * .55, y + r * .7); g.closePath(); g.fill(); g.stroke();
  const hg = g.createRadialGradient(x - r * .15, y - r * .8, r * .05, x, y - r * .65, r * .45); hg.addColorStop(0, D.shade(color, 55)); hg.addColorStop(1, color);
  g.fillStyle = hg; D.circle(g, x, y - r * .65, r * .42); g.fill(); g.stroke();
  if (ring) { g.strokeStyle = '#ffd76a'; g.lineWidth = Math.max(1.5, r * .15); g.beginPath(); g.ellipse(x, y + r * .72, r * 1.15, r * .5, 0, 0, Math.PI * 2); g.stroke(); }
  g.restore();
}
function house(g, x, y, s, hotel) {
  const w = hotel ? s * 2.1 : s, col = hotel ? '#b8322a' : '#3f8f5b';
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - w / 2 + 1, y - s * .2 + 1, w, s * .7);
  g.fillStyle = col; g.fillRect(x - w / 2, y - s * .2, w, s * .7);
  g.fillStyle = D.shade(col, -30); g.beginPath(); g.moveTo(x - w / 2 - s * .12, y - s * .2); g.lineTo(x, y - s * .65); g.lineTo(x + w / 2 + s * .12, y - s * .2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .8; g.strokeRect(x - w / 2, y - s * .2, w, s * .7);
}

const CSS = `
.mo-panel{position:absolute;display:flex;flex-direction:column;gap:6px;background:linear-gradient(180deg,#f7eedb,#e9dab7);border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.45),inset 0 0 0 1px rgba(120,80,30,.3);padding:8px;color:#2b2118;font-size:14px;overflow:hidden}
.mo-pl{display:grid;grid-template-columns:1fr 1fr;gap:4px;flex:none}
.mo-chip{display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:9px;background:rgba(255,255,255,.55);font-size:13px;min-width:0;border:2px solid transparent;line-height:1.25}
.mo-chip.cur{border-color:#c8a052;background:#fff6dc;box-shadow:0 0 0 2px rgba(200,160,82,.25)}
.mo-chip.dead{opacity:.45}
.mo-chip.dead b{text-decoration:line-through}
.mo-chip i{width:12px;height:12px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7)}
.mo-chip b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.mo-chip em{font-style:normal;font-weight:800;color:#2f6b55;font-variant-numeric:tabular-nums}
.mo-chip u{text-decoration:none;font-size:11px;background:#b23a2b;color:#fff;border-radius:4px;padding:0 3px}
.mo-chip s{text-decoration:none;font-size:11px;background:#c8a052;color:#3a2410;border-radius:4px;padding:0 3px}
.mo-main{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:2px}
.mo-act{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;flex:none}
.mo-panel .bx-btn.ghost{background:#e3d3b0;color:#2b2118;box-shadow:0 3px 0 #b49c70}
.mo-act .bx-btn{flex:1 1 0;padding:8px 8px;min-width:70px;font-size:15px;white-space:nowrap}
.mo-wait{flex:1;text-align:center;color:#8c7a63;font-size:14px;padding:12px 4px}
.mo-deed{background:#fffaf0;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(60,30,10,.25);margin:2px auto 6px;max-width:290px;border:1px solid rgba(60,40,20,.25)}
.mo-deed .hd{color:#fff;text-align:center;padding:6px 6px 5px;font-family:var(--deco);font-size:21px;letter-spacing:3px;text-shadow:0 1px 2px rgba(0,0,0,.45)}
.mo-deed .hd small{display:block;font-size:11px;font-family:var(--sans);letter-spacing:1px;opacity:.9;text-shadow:none}
.mo-deed table{width:100%;border-collapse:collapse;font-size:13px;margin:4px 0}
.mo-deed td{padding:1px 12px}.mo-deed td:last-child{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.mo-deed tr.hi td{background:rgba(200,160,82,.25)}
.mo-deed .ft{font-size:12.5px;text-align:center;padding:5px 8px;color:#5e4b38;border-top:1px dashed #d8c7a0;line-height:1.5}
.mo-log{font-size:12.5px;color:#5e4b38;line-height:1.55;padding:2px 4px}
.mo-log div:first-child{color:#2b2118;font-weight:600}
.mo-h{font-weight:700;font-size:14px;margin:4px 2px 6px;display:flex;justify-content:space-between;align-items:center;gap:6px}
.mo-h small{font-weight:400;color:#8c7a63}
.mo-row{display:flex;align-items:center;gap:5px;min-height:44px;border-bottom:1px solid rgba(60,40,20,.1);padding:2px}
.mo-row .c{width:8px;align-self:stretch;border-radius:3px;flex:none;margin:4px 0}
.mo-row .n{flex:1;min-width:0;line-height:1.2}
.mo-row .n b{display:block;font-size:14px}.mo-row .n small{color:#8c7a63;font-size:11.5px}
.mo-sb{min-width:42px;height:40px;border:none;border-radius:9px;background:#e3d3b0;color:#2b2118;font-weight:700;font-size:13px;box-shadow:0 2px 0 #b49c70;padding:0 6px}
.mo-sb.g{background:#5aa08a;color:#fff;box-shadow:0 2px 0 #23503f}
.mo-sb.r{background:#d0533f;color:#fff;box-shadow:0 2px 0 #6e1d14}
.mo-sb:disabled{opacity:.35;box-shadow:none}
.mo-sb.on{background:#2b2118;color:#f3e9d2;box-shadow:none}
.mo-pcs{display:flex;flex-wrap:wrap;gap:5px;margin:2px 0 6px}
.mo-pc{min-height:40px;border:2px solid rgba(60,40,20,.2);border-radius:9px;background:#fffaf0;padding:2px 8px 2px 4px;display:flex;align-items:center;gap:5px;font-size:13px}
.mo-pc i{width:8px;height:24px;border-radius:3px}
.mo-pc.on{border-color:#b23a2b;background:#ffe7d6;font-weight:700}
.mo-step{display:flex;align-items:center;gap:4px;margin:2px 0 4px;flex-wrap:wrap}
.mo-step span{min-width:64px;text-align:center;font-weight:800;font-size:15px}
.mo-sec{background:rgba(255,255,255,.45);border-radius:10px;padding:4px 8px 6px;margin-bottom:6px}
.mo-sec > div:first-child{font-size:12.5px;color:#8c7a63;margin:2px 0 3px}
.mo-big{text-align:center;font-size:15px;margin:6px 0;line-height:1.6}
.mo-big b{color:#b23a2b;font-size:20px}
`;

BX.register({
  id: 'monopoly', title: '地产大亨', cat: 'social', order: 1, sub: '买地盖楼，收租致富',
  desc: '经典地产交易桌游：掷骰绕城一圈圈，买下街巷、驿站与公用事业，凑齐同色地段盖房建酒楼；拍卖、抵押、交易样样俱全，让对手付租付到破产。',
  kind: 'turn', seats: [2, 4], defSeats: 4, seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'], aiDelay: 380,
  options: [{key: 'end', label: '结束条件', choices: [['r30', '30 回合后按总资产'], ['classic', '经典（至只剩一人）']], def: 'r30'}],
  rules: `<p><b>目标</b>：买地、收租、盖房，让其他玩家破产。经典模式下坚持到最后的玩家获胜；「30 回合」模式在第 30 回合结束时，<b>总资产</b>（现金 + 地价（已抵押按一半）+ 房屋造价）最高者获胜。</p>
<p><b>开局</b>：每人 ¥1500，从「起点」出发。每次<b>经过或停在起点</b>领取 ¥200。</p>
<p><b>掷骰</b>：掷两颗骰子按点数前进。掷出<b>双数</b>可再掷一次；同一回合<b>连续三次双数</b>直接入狱。</p>
<p><b>无主地产</b>（22 条街巷、4 座驿站、电力公司、自来水公司）：可按标价购买；若不买，则立即由<b>所有玩家（包括你）拍卖</b>，轮流加价，出价最高者得。</p>
<p><b>租金</b>：停在别人的地产要付租。集齐同色全部街巷后，空地租金<b>翻倍</b>，并可盖房：每块地 1–4 栋房，再升级为<b>酒楼</b>，租金大涨。驿站租金按拥有数 ¥25/50/100/200；公用事业按骰点 ×4（拥有一家）或 ×10（两家）。已抵押地产不收租。</p>
<p><b>盖房</b>：必须<b>平均建造</b>（同色各块房数相差不超过 1），卖房也须平均拆；银行共 <b>32 栋房、12 座酒楼</b>，卖完即止。房屋按半价卖回银行。</p>
<p><b>抵押</b>：无建筑的地产可按半价抵押给银行；赎回需付抵押值 + 10% 利息。</p>
<p><b>机会 / 命运</b>：各 16 张卡，抽到后照做（前进、后退三格、收付款、按房屋修缮、免罪金牌、入狱、向每人付款或收款……）。用过的卡放回牌底，免罪金牌被持有期间不在牌堆中。</p>
<p><b>税</b>：所得税 ¥200，奢侈税 ¥100。<b>免费停车</b>与<b>探监</b>无事发生。</p>
<p><b>监狱</b>：踩中「入狱」、抽到入狱卡或三次双数即入狱（不经过起点、不领 ¥200）。出狱方法：回合开始付 ¥50；或使用免罪金牌；或掷骰，掷出双数即出狱并按点数前进（不再加掷）。三次都没掷出双数，须付 ¥50 后按第三次点数前进。在狱中仍可收租。</p>
<p><b>交易</b>：轮到你时可向任一玩家提议交易，可包含现金、地产（该色组上不能有建筑）与免罪金牌；对方同意即成交。收到已抵押地产须立即付 10% 利息。</p>
<p><b>破产</b>：欠款付不出时，可卖房、抵押来筹钱；仍不够则宣告破产——欠玩家的，你的现金、地产（保持抵押状态）和金牌全部归债主；欠银行的，地产收归银行重新出售。</p>
<p><b>操作</b>：右侧（竖屏时下方）面板显示按钮：掷骰、购买 / 拍卖、管理（建房 / 卖房 / 抵押 / 赎回）、交易、结束回合。点棋盘上任意格子可查看地契。键盘空格 = 掷骰 / 结束回合。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 21, base: '#8a5a32', dark: '#4a2a12'});
    const u = 15, x0 = 18, y0 = 14;
    g.fillStyle = '#f1e4c2'; g.fillRect(x0, y0, u * 11, u * 2.1); g.fillRect(x0, y0, u * 2.1, h - y0 * 2);
    const cols = [GC[4], GC[4], null, GC[5], GC[5], GC[3], null, GC[6], GC[6]];
    cols.forEach((c, k) => { g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 1; g.strokeRect(x0 + u * 2.1 + k * u, y0, u, u * 2.1); if (c) { g.fillStyle = c; g.fillRect(x0 + u * 2.1 + k * u, y0 + u * 1.55, u, u * .55); } });
    [GC[2], GC[2], null, GC[1], GC[1], null].forEach((c, k) => { g.strokeRect(x0, y0 + u * 2.1 + k * u, u * 2.1, u); if (c) { g.fillStyle = c; g.fillRect(x0 + u * 1.55, y0 + u * 2.1 + k * u, u * .55, u); } });
    D.text(g, '停', x0 + u * 1.05, y0 + u * 1.05, {size: 18, color: C.red, font: 'deco', weight: 400});
    g.fillStyle = '#eadcbc'; D.rr(g, 60, 55, 128, 82, 10); g.fill();
    D.text(g, '地产大亨', 124, 76, {size: 21, color: C.red, font: 'deco', weight: 400});
    house(g, 82, 120, 15); house(g, 100, 120, 15); house(g, 128, 122, 15, true);
    D.die(g, 152, 98, 26, 5, {rot: .3}); D.die(g, 160, 120, 22, 3, {rot: -.4});
    pawn(g, 58 + 52, 30, 9, '#c23a2b'); pawn(g, 58 + 82, 30, 9, '#2f5d8a');
  },
  create(ctx) {
    const n = ctx.n, rng = ctx.rng;
    const deckC = rng.shuffle(BX.range(16)), deckH = rng.shuffle(BX.range(16));
    const maxRound = ctx.opts.end === 'classic' ? (BX.test ? 8 : 0) : (BX.test ? 8 : 30);
    /* ===== all game state ===== */
    const st = {
      cash: Array(n).fill(1500), pos: Array(n).fill(0), alive: Array(n).fill(true), jail: Array(n).fill(-1), jc: BX.range(n).map(() => []),
      own: Array(40).fill(-1), hs: Array(40).fill(0), mort: Array(40).fill(0), bankH: 32, bankT: 12,
      cur: 0, ph: 'roll', dbl: 0, again: false, dice: [3, 4], buyP: -1, auc: null, debts: [], offer: null, prevPh: null, trades: 0,
      dC: deckC, dH: deckH, round: 1, maxRound, last: null, over: false, win: null,
    };
    /* ===== visual-only state ===== */
    const logs = [];
    const vis = st.pos.slice();
    let hop = null, rolling = false, cardShow = null, floats = [], banner = null, fxCur = null;
    const fxq = [];
    let uiMode = 'info', sel = -1, draft = null, lastLayout = '', boardCache = null, cacheKey = '';
    const name = s => s < 0 ? '银行' : ctx.name(s);
    const log = s => { logs.unshift(s); if (logs.length > 40) logs.pop(); };

    /* ===== pure-ish rules (read st) ===== */
    const ownsAll = (g, s) => GROUPS[g].every(i => st.own[i] === s);
    const grpBuilt = g => GROUPS[g].some(i => st.hs[i] > 0);
    const jcCount = s => st.jc[s].length;
    function canBuild(s, i) {
      const sp = SP[i]; if (sp.k !== 'st' || st.own[i] !== s || !ownsAll(sp.g, s)) return false;
      const L = GROUPS[sp.g]; if (L.some(j => st.mort[j])) return false;
      const h = st.hs[i]; if (h >= 5 || h !== Math.min(...L.map(j => st.hs[j]))) return false;
      if (st.cash[s] < sp.hc) return false;
      return h < 4 ? st.bankH > 0 : st.bankT > 0;
    }
    function canSell(s, i) { const sp = SP[i]; return sp.k === 'st' && st.own[i] === s && st.hs[i] > 0 && st.hs[i] === Math.max(...GROUPS[sp.g].map(j => st.hs[j])); }
    const canMort = (s, i) => isProp(i) && st.own[i] === s && !st.mort[i] && !(SP[i].k === 'st' && grpBuilt(SP[i].g));
    const canUnmort = (s, i) => isProp(i) && st.own[i] === s && !!st.mort[i] && st.cash[s] >= UNM(i);
    const tradeable = (s, i) => isProp(i) && st.own[i] === s && !(SP[i].k === 'st' && grpBuilt(SP[i].g));
    function rentOf(i, mode, diceSum) {
      const sp = SP[i], o = st.own[i];
      if (sp.k === 'st') { const h = st.hs[i]; return h ? sp.rent[h] : sp.rent[0] * (ownsAll(sp.g, o) ? 2 : 1); }
      if (sp.k === 'rr') { const k = GROUPS[8].filter(j => st.own[j] === o).length; return 25 * [1, 2, 4, 8][k - 1] * (mode === 'rr2' ? 2 : 1); }
      const k = GROUPS[9].filter(j => st.own[j] === o).length; return diceSum * (mode === 'ut10' || k === 2 ? 10 : 4);
    }
    function worth(s) {
      let w = st.cash[s];
      for (let i = 0; i < 40; i++) if (st.own[i] === s) { w += st.mort[i] ? SP[i].price / 2 : SP[i].price; if (st.hs[i]) w += st.hs[i] * SP[i].hc; }
      return w;
    }
    function liquid(s) {
      let w = st.cash[s];
      for (let i = 0; i < 40; i++) if (st.own[i] === s) { if (st.hs[i]) w += st.hs[i] * SP[i].hc / 2; if (!st.mort[i]) w += SP[i].price / 2; }
      return w;
    }
    function offerValid(o) {
      if (!o) return false;
      const f = o.from, t = o.to;
      if (!(t >= 0 && t < n) || t === f || !st.alive[t] || !st.alive[f]) return false;
      for (const k of ['gc', 'wc', 'gj', 'wj']) if (!Number.isInteger(o[k]) || o[k] < 0) return false;
      if (!Array.isArray(o.gp) || !Array.isArray(o.wp)) return false;
      if (new Set(o.gp).size !== o.gp.length || new Set(o.wp).size !== o.wp.length) return false;
      if (!o.gp.every(i => Number.isInteger(i) && i >= 0 && i < 40 && tradeable(f, i))) return false;
      if (!o.wp.every(i => Number.isInteger(i) && i >= 0 && i < 40 && tradeable(t, i))) return false;
      if (o.gj > jcCount(f) || o.wj > jcCount(t)) return false;
      if (!(o.gc + o.wc + o.gj + o.wj + o.gp.length + o.wp.length)) return false;
      const feeT = o.gp.reduce((a, i) => a + (st.mort[i] ? FEE(i) : 0), 0), feeF = o.wp.reduce((a, i) => a + (st.mort[i] ? FEE(i) : 0), 0);
      return st.cash[f] - o.gc + o.wc >= feeF && st.cash[t] - o.wc + o.gc >= feeT && o.gc <= st.cash[f] && o.wc <= st.cash[t];
    }
    function toMove() {
      if (st.over) return null;
      if (st.ph === 'auction') return st.auc.act[st.auc.k];
      if (st.ph === 'debt') return st.debts[0].from;
      if (st.ph === 'trade') return st.offer.to;
      return st.cur;
    }
    function legal(a, by) {
      if (!a || st.over || by !== toMove()) return false;
      const ph = st.ph, mine = ph === 'roll' || ph === 'post', i = a.i;
      switch (a.t) {
        case 'roll': return ph === 'roll';
        case 'bail': return ph === 'roll' && st.jail[by] >= 0 && st.cash[by] >= 50;
        case 'card': return ph === 'roll' && st.jail[by] >= 0 && jcCount(by) > 0;
        case 'buy': return ph === 'buy' && st.cash[by] >= SP[st.buyP].price;
        case 'decline': return ph === 'buy';
        case 'bid': return ph === 'auction' && Number.isInteger(a.v) && a.v > st.auc.bid && a.v <= st.cash[by];
        case 'pass': return ph === 'auction';
        case 'build': return mine && canBuild(by, i);
        case 'sell': return (mine || ph === 'debt') && canSell(by, i);
        case 'mort': return (mine || ph === 'debt') && canMort(by, i);
        case 'unmort': return mine && canUnmort(by, i);
        case 'offer': return mine && st.trades < 3 && offerValid(Object.assign({}, a, {from: by}));
        case 'accept': case 'reject': return ph === 'trade';
        case 'paydebt': return ph === 'debt' && st.cash[by] >= st.debts[0].amt;
        case 'bankrupt': return ph === 'debt';
        case 'end': return ph === 'post';
      }
      return false;
    }

    /* ===== state changes (only called from apply) ===== */
    let pumpQ = false;
    function fx(e) { if (ctx.fast || document.hidden || fxq.length > 40) return; fxq.push(e); if (!fxCur && !pumpQ) { pumpQ = true; Promise.resolve().then(() => { pumpQ = false; if (!fxCur) pump(); }); } }
    function money(s, v) { if (s >= 0) fx({k: 'money', p: s, v}); }
    function transfer(from, to, amt) {
      st.cash[from] -= amt; money(from, -amt);
      if (to >= 0 && st.alive[to]) { st.cash[to] += amt; money(to, amt); }
    }
    function pay(from, to, amt) {
      if (amt <= 0) return;
      if (st.cash[from] >= amt) transfer(from, to, amt);
      else { st.debts.push({from, to, amt}); log(name(from) + ' 现金不足，欠 ' + name(to) + ' ¥' + amt); }
    }
    function move(s, steps) {
      const from = st.pos[s], path = [];
      for (let k = 1; k <= steps; k++) path.push((from + k) % 40);
      st.pos[s] = (from + steps) % 40;
      fx({k: 'move', p: s, from, path});
      if (from + steps >= 40) { st.cash[s] += 200; money(s, 200); log(name(s) + ' 经过起点，领取 ¥200'); }
    }
    const moveTo = (s, to) => move(s, ((to - st.pos[s]) + 40) % 40 || 40);
    function goJail(s) {
      fx({k: 'jump', p: s, from: st.pos[s], to: 10}); fx({k: 'sfx', n: 'buzz'});
      st.pos[s] = 10; st.jail[s] = 0; if (s === st.cur) { st.again = false; st.dbl = 0; }
      log(name(s) + ' 被送进监狱'); fx({k: 'banner', text: name(s) + ' 入狱！'});
    }
    function land(s, mode) {
      const i = st.pos[s], sp = SP[i];
      if (sp.k === 'gojail') { goJail(s); return; }
      if (sp.k === 'tax') { log(name(s) + ' 缴纳' + sp.n + ' ¥' + sp.amt); pay(s, -1, sp.amt); return; }
      if (sp.k === 'ch' || sp.k === 'cc') { drawCard(s, sp.k); return; }
      if (!isProp(i)) return;
      const o = st.own[i];
      if (o < 0) { st.buyP = i; return; }
      if (o === s) return;
      if (st.mort[i]) { log(sp.n + ' 已抵押，免租'); return; }
      let ds = st.dice[0] + st.dice[1];
      if (sp.k === 'ut' && mode === 'ut10') { const a = 1 + rng.int(6), b = 1 + rng.int(6); st.dice = [a, b]; ds = a + b; fx({k: 'dice', d: [a, b]}); }
      const r = rentOf(i, mode, ds);
      log(name(s) + ' 在' + sp.n + '付租 ¥' + r + ' 给 ' + name(o)); fx({k: 'sfx', n: 'coin'});
      pay(s, o, r);
    }
    function drawCard(s, kind) {
      const deck = kind === 'ch' ? st.dC : st.dH, id = deck.shift(), card = (kind === 'ch' ? CHANCE : CHEST)[id];
      st.last = {d: kind, id}; fx({k: 'card', d: kind, id});
      log(name(s) + ' 抽到' + DECKN[kind] + '：' + card.x);
      if (card.t === 'free') { st.jc[s].push(kind); return; }
      deck.push(id);
      switch (card.t) {
        case 'adv': moveTo(s, card.to); land(s); break;
        case 'advRR': { const p = st.pos[s]; moveTo(s, p < 5 || p >= 35 ? 5 : p < 15 ? 15 : p < 25 ? 25 : 35); land(s, 'rr2'); break; }
        case 'advUT': { const p = st.pos[s]; moveTo(s, p < 12 || p >= 28 ? 12 : 28); land(s, 'ut10'); break; }
        case 'money': if (card.v > 0) { st.cash[s] += card.v; money(s, card.v); } else pay(s, -1, -card.v); break;
        case 'back': { const from = st.pos[s]; st.pos[s] = (from + 37) % 40; fx({k: 'move', p: s, from, path: [(from + 39) % 40, (from + 38) % 40, (from + 37) % 40]}); land(s); break; }
        case 'jail': goJail(s); break;
        case 'repair': {
          let hh = 0, ht = 0; for (let i = 0; i < 40; i++) if (st.own[i] === s) { if (st.hs[i] === 5) ht++; else hh += st.hs[i]; }
          pay(s, -1, hh * card.h + ht * card.ht); break;
        }
        case 'each':
          for (let o = 0; o < n; o++) if (o !== s && st.alive[o]) { if (card.v < 0) pay(s, o, -card.v); else pay(o, s, card.v); }
          break;
      }
    }
    function settle() {
      if (st.over) return;
      st.debts = st.debts.filter(d => st.alive[d.from]);
      while (st.debts.length && st.cash[st.debts[0].from] >= st.debts[0].amt) { const d = st.debts.shift(); transfer(d.from, d.to, d.amt); }
      if (st.debts.length) { st.ph = 'debt'; return; }
      if (!st.alive[st.cur]) { nextTurn(); return; }
      if (st.buyP >= 0) { st.ph = 'buy'; return; }
      st.ph = st.again && st.jail[st.cur] < 0 ? 'roll' : 'post';
    }
    function nextTurn() {
      let s = st.cur, k = 0;
      do { s = (s + 1) % n; } while (!st.alive[s] && ++k < n);
      if (s <= st.cur) st.round++;
      st.cur = s; st.dbl = 0; st.again = false; st.buyP = -1; st.trades = 0; st.ph = 'roll';
      if (st.maxRound && st.round > st.maxRound) endByAssets();
    }
    function bankrupt(s, to) {
      if (to >= 0 && !st.alive[to]) to = -1;
      let cash = st.cash[s];
      for (let i = 0; i < 40; i++) if (st.own[i] === s && st.hs[i]) { cash += st.hs[i] * SP[i].hc / 2; if (st.hs[i] === 5) st.bankT++; else st.bankH += st.hs[i]; st.hs[i] = 0; }
      if (to >= 0) {
        st.cash[to] += cash; if (cash > 0) money(to, cash);
        for (let i = 0; i < 40; i++) if (st.own[i] === s) st.own[i] = to;
        st.jc[to].push(...st.jc[s]);
      } else {
        for (let i = 0; i < 40; i++) if (st.own[i] === s) { st.own[i] = -1; st.mort[i] = 0; }
        for (const d of st.jc[s]) (d === 'ch' ? st.dC : st.dH).push(FREE_ID[d]);
      }
      st.jc[s] = []; st.cash[s] = 0; st.alive[s] = false; st.jail[s] = -1;
      st.debts = st.debts.filter(d => d.from !== s);
      st.debts.forEach(d => { if (d.to === s) d.to = -1; });
      log(name(s) + ' 宣告破产' + (to >= 0 ? '，资产归 ' + name(to) : '，地产收归银行'));
      fx({k: 'banner', text: name(s) + ' 破产！'}); fx({k: 'sfx', n: 'crash'});
      const left = BX.range(n).filter(i => st.alive[i]);
      if (left.length === 1) { st.over = true; st.win = left; st.ph = 'over'; ctx.end({winner: left[0], text: ctx.name(left[0]) + ' 成为最后的地产大亨！', delay: 1600}); }
    }
    function endByAssets() {
      st.over = true; st.ph = 'over';
      const alive = BX.range(n).filter(i => st.alive[i]), w = alive.map(worth), best = Math.max(...w);
      st.win = alive.filter((s, k) => w[k] === best);
      const rank = alive.map((s, k) => [s, w[k]]).sort((a, b) => b[1] - a[1]);
      log('第 ' + st.maxRound + ' 回合结束，按总资产结算');
      ctx.end({winner: st.win.length === 1 ? st.win[0] : st.win, html: '回合用尽，按总资产排名：<br>' + rank.map(([s, v], k) => `${k + 1}. ${BX.esc(ctx.name(s))}　¥${v}`).join('<br>'), delay: 1400});
    }

    function apply(a, by) {
      if (!legal(a, by)) return;
      const s = by;
      switch (a.t) {
        case 'roll': {
          const d1 = 1 + rng.int(6), d2 = 1 + rng.int(6), dbl = d1 === d2; st.dice = [d1, d2];
          fx({k: 'dice', d: [d1, d2]});
          log(name(s) + ' 掷出 ' + d1 + ' + ' + d2 + (dbl ? '（双数）' : ''));
          if (st.jail[s] >= 0) {
            st.again = false;
            if (dbl) { st.jail[s] = -1; log(name(s) + ' 掷出双数，出狱！'); move(s, d1 + d2); land(s); }
            else if (++st.jail[s] >= 3) { st.jail[s] = -1; log(name(s) + ' 三次未出双数，付 ¥50 出狱'); pay(s, -1, 50); move(s, d1 + d2); land(s); }
            else fx({k: 'banner', text: '未掷出双数，留在狱中'});
          } else {
            if (dbl) { if (++st.dbl >= 3) { fx({k: 'banner', text: '连续三次双数！'}); goJail(s); settle(); break; } st.again = true; } else st.again = false;
            move(s, d1 + d2); land(s);
          }
          settle(); break;
        }
        case 'bail': transfer(s, -1, 50); st.jail[s] = -1; log(name(s) + ' 付 ¥50 保释出狱'); fx({k: 'sfx', n: 'coin'}); break;
        case 'card': { const d = st.jc[s].shift(); (d === 'ch' ? st.dC : st.dH).push(FREE_ID[d]); st.jail[s] = -1; log(name(s) + ' 使用免罪金牌出狱'); fx({k: 'sfx', n: 'card'}); break; }
        case 'buy': { const p = st.buyP; transfer(s, -1, SP[p].price); st.own[p] = s; st.buyP = -1; log(name(s) + ' 买下' + SP[p].n + '（¥' + SP[p].price + '）'); fx({k: 'sfx', n: 'chip'}); settle(); break; }
        case 'decline': {
          const act = []; for (let k = 0; k < n; k++) { const q = (st.cur + k) % n; if (st.alive[q]) act.push(q); }
          st.auc = {p: st.buyP, bid: 0, hi: -1, act, k: 0}; st.buyP = -1; st.ph = 'auction';
          log(name(s) + ' 放弃购买，' + SP[st.auc.p].n + ' 进入拍卖'); fx({k: 'sfx', n: 'gong'}); break;
        }
        case 'bid': case 'pass': {
          const A = st.auc;
          if (a.t === 'bid') { A.bid = a.v; A.hi = s; A.k = (A.k + 1) % A.act.length; log(name(s) + ' 出价 ¥' + a.v); fx({k: 'sfx', n: 'tick'}); }
          else { A.act.splice(A.k, 1); if (A.k >= A.act.length) A.k = 0; log(name(s) + ' 退出竞拍'); }
          if (!A.act.length || (A.act.length === 1 && A.hi === A.act[0])) {
            if (A.hi >= 0) { transfer(A.hi, -1, A.bid); st.own[A.p] = A.hi; log(name(A.hi) + ' 以 ¥' + A.bid + ' 拍得' + SP[A.p].n); fx({k: 'banner', text: name(A.hi) + ' 拍得 ' + SP[A.p].n}); fx({k: 'sfx', n: 'bell'}); }
            else log(SP[A.p].n + ' 流拍');
            st.auc = null; settle();
          }
          break;
        }
        case 'build': {
          const i = a.i; st.hs[i]++; if (st.hs[i] === 5) { st.bankH += 4; st.bankT--; } else st.bankH--;
          transfer(s, -1, SP[i].hc); log(name(s) + ' 在' + SP[i].n + (st.hs[i] === 5 ? '建起酒楼' : '盖第 ' + st.hs[i] + ' 栋房')); fx({k: 'sfx', n: 'place'}); break;
        }
        case 'sell': {
          const i = a.i; let back;
          if (st.hs[i] === 5) { const k = Math.min(4, st.bankH); st.hs[i] = k; st.bankH -= k; st.bankT++; back = (5 - k) * SP[i].hc / 2; }
          else { st.hs[i]--; st.bankH++; back = SP[i].hc / 2; }
          st.cash[s] += back; money(s, back); log(name(s) + ' 拆卖' + SP[i].n + '的房屋，得 ¥' + back); fx({k: 'sfx', n: 'pop'}); break;
        }
        case 'mort': { const i = a.i; st.mort[i] = 1; st.cash[s] += SP[i].price / 2; money(s, SP[i].price / 2); log(name(s) + ' 抵押' + SP[i].n + '，得 ¥' + SP[i].price / 2); fx({k: 'sfx', n: 'pen'}); break; }
        case 'unmort': { const i = a.i; st.mort[i] = 0; transfer(s, -1, UNM(i)); log(name(s) + ' 赎回' + SP[i].n + '（¥' + UNM(i) + '）'); fx({k: 'sfx', n: 'coin'}); break; }
        case 'offer': {
          st.offer = {from: s, to: a.to, gc: a.gc, wc: a.wc, gj: a.gj, wj: a.wj, gp: a.gp.slice().sort((x, y) => x - y), wp: a.wp.slice().sort((x, y) => x - y)};
          st.prevPh = st.ph; st.ph = 'trade'; st.trades++;
          log(name(s) + ' 向 ' + name(a.to) + ' 提议交易'); fx({k: 'sfx', n: 'flip'}); break;
        }
        case 'accept': case 'reject': {
          const o = st.offer;
          if (a.t === 'accept' && offerValid(o)) {
            if (o.gc) transfer(o.from, o.to, o.gc);
            if (o.wc) transfer(o.to, o.from, o.wc);
            for (const i of o.gp) { st.own[i] = o.to; if (st.mort[i]) transfer(o.to, -1, FEE(i)); }
            for (const i of o.wp) { st.own[i] = o.from; if (st.mort[i]) transfer(o.from, -1, FEE(i)); }
            for (let k = 0; k < o.gj; k++) st.jc[o.to].push(st.jc[o.from].shift());
            for (let k = 0; k < o.wj; k++) st.jc[o.from].push(st.jc[o.to].shift());
            log(name(o.to) + ' 接受了交易'); fx({k: 'banner', text: '成交！'}); fx({k: 'sfx', n: 'bell'});
          } else { log(name(o.to) + ' 拒绝了交易'); fx({k: 'sfx', n: 'error'}); }
          st.offer = null; st.ph = st.prevPh; st.prevPh = null; break;
        }
        case 'paydebt': { const d = st.debts.shift(); transfer(d.from, d.to, d.amt); log(name(d.from) + ' 还清 ¥' + d.amt); settle(); break; }
        case 'bankrupt': {
          const d = st.debts[0]; bankrupt(s, d.to);
          if (st.over) break;
          if (s === st.cur) { st.debts = []; st.auc = null; nextTurn(); } else settle();
          break;
        }
        case 'end': nextTurn(); fx({k: 'sfx', n: 'click'}); break;
      }
      if (!ctx.fast) { if (uiMode === 'trade' && (st.ph !== 'roll' && st.ph !== 'post')) uiMode = 'info'; render(); }
    }

    /* ===== AI ===== */
    function oppRentMax(s) {
      let m = 0;
      for (let i = 0; i < 40; i++) { const o = st.own[i]; if (o >= 0 && o !== s && !st.mort[i]) m = Math.max(m, rentOf(i, '', 7)); }
      return m;
    }
    const reserve = (s, lv) => lv === 1 ? 40 : lv === 2 ? 120 : 100 + Math.min(450, oppRentMax(s) * .5);
    function valIn(s, p) {
      const g = SP[p].g, L = GROUPS[g], have = L.filter(i => i !== p && st.own[i] === s).length + 1;
      let v = SP[p].price * (1 + .3 * have / L.length);
      if (have === L.length) v += GPRICE[g] * (g < 8 ? .6 : .15);
      if (st.mort[p]) v -= UNM(p);
      return v;
    }
    function valOut(s, p) {
      const g = SP[p].g, L = GROUPS[g], have = L.filter(i => st.own[i] === s).length;
      let v = SP[p].price * (1 + .3 * have / L.length);
      if (have === L.length) v += GPRICE[g] * (g < 8 ? .6 : .15);
      if (st.mort[p]) v -= UNM(p);
      return v;
    }
    function tradeGain(o, s, lv) {
      let gain = o.gc - o.wc + 40 * (o.gj - o.wj);
      for (const p of o.gp) gain += valIn(s, p) - (st.mort[p] ? FEE(p) : 0);
      for (const p of o.wp) gain -= valOut(s, p);
      const groups = new Set(o.wp.map(p => SP[p].g));
      for (const g of groups) if (GROUPS[g].every(i => st.own[i] === o.from || o.wp.includes(i))) gain -= GPRICE[g] * (g < 8 ? [0, .25, .6, 1.1][lv] : .1);
      if (lv === 1) gain += (Math.random() - .5) * 60;
      return gain - (lv === 3 ? 25 : 0);
    }
    function aiPropose(s, lv) {
      const res = reserve(s, lv), cands = [];
      for (let g = 0; g < 8; g++) {
        const L = GROUPS[g], miss = L.filter(i => st.own[i] !== s);
        if (miss.length !== 1 || grpBuilt(g)) continue;
        const m = miss[0], o = st.own[m]; if (o < 0 || !st.alive[o]) continue;
        const X = Math.ceil((valOut(o, m) + GPRICE[g] * .62 + 10) / 10) * 10;
        if (st.cash[s] - X >= res) cands.push({t: 'offer', to: o, gc: X, wc: 0, gj: 0, wj: 0, gp: [], wp: [m]});
      }
      return cands.length ? BX.pick(cands) : null;
    }
    function aiDebt(s) {
      const d = st.debts[0]; if (st.cash[s] >= d.amt) return {t: 'paydebt'};
      const mine = BX.range(40).filter(i => st.own[i] === s);
      const morts = mine.filter(i => canMort(s, i)).sort((a, b) => (SP[a].k === 'st' && ownsAll(SP[a].g, s) ? 1 : 0) - (SP[b].k === 'st' && ownsAll(SP[b].g, s) ? 1 : 0) || SP[a].price - SP[b].price);
      const nonMono = morts.filter(i => !(SP[i].k === 'st' && ownsAll(SP[i].g, s)));
      if (nonMono.length) return {t: 'mort', i: nonMono[0]};
      const sells = mine.filter(i => canSell(s, i)).sort((a, b) => SP[a].hc - SP[b].hc);
      if (sells.length) return {t: 'sell', i: sells[0]};
      if (morts.length) return {t: 'mort', i: morts[0]};
      return {t: 'bankrupt'};
    }
    function aiManage(s, lv) {
      const res = reserve(s, lv), mine = BX.range(40).filter(i => st.own[i] === s);
      const um = mine.filter(i => st.mort[i] && UNM(i) <= st.cash[s] - res - 150);
      if (um.length) { um.sort((a, b) => (SP[b].k === 'st' && ownsAll(SP[b].g, s) ? 1 : 0) - (SP[a].k === 'st' && ownsAll(SP[a].g, s) ? 1 : 0)); return {t: 'unmort', i: um[0]}; }
      const bs = mine.filter(i => canBuild(s, i) && SP[i].hc <= st.cash[s] - res);
      if (bs.length) {
        if (lv === 1) return Math.random() < .6 ? {t: 'build', i: BX.pick(bs)} : null;
        bs.sort((a, b) => (SP[b].rent[st.hs[b] + 1] - SP[b].rent[st.hs[b]]) / SP[b].hc - (SP[a].rent[st.hs[a] + 1] - SP[a].rent[st.hs[a]]) / SP[a].hc);
        return {t: 'build', i: bs[0]};
      }
      return null;
    }
    function aiDecide(s, lv) {
      const ph = st.ph;
      if (ph === 'trade') return {t: offerValid(st.offer) && tradeGain(st.offer, s, lv) > 0 ? 'accept' : 'reject'};
      if (ph === 'debt') return aiDebt(s);
      if (ph === 'auction') {
        const A = st.auc, p = A.p, price = SP[p].price, g = SP[p].g;
        let val = price * (lv === 1 ? .7 + Math.random() * .5 : lv === 2 ? 1 : 1.05);
        const L = GROUPS[g];
        if (lv >= 2 && L.every(i => i === p || st.own[i] === s)) val += GPRICE[g] * .35;
        if (lv === 3) for (let o = 0; o < n; o++) if (o !== s && L.every(i => i === p || st.own[i] === o)) val += price * .3;
        const cap = Math.min(val, st.cash[s] - (lv === 3 ? reserve(s, lv) * .5 : 40));
        const v = A.bid + (A.bid < price * .5 ? Math.max(10, Math.round(price * .15 / 10) * 10) : 10);
        return v <= cap ? {t: 'bid', v} : {t: 'pass'};
      }
      if (ph === 'buy') {
        const p = st.buyP, price = SP[p].price, g = SP[p].g, cash = st.cash[s];
        if (cash < price) return {t: 'decline'};
        let want = cash - price >= reserve(s, lv);
        if (lv >= 2 && GROUPS[g].every(i => i === p || st.own[i] === s)) want = cash - price >= 20;
        if (lv === 3 && !want) for (let o = 0; o < n; o++) if (o !== s && GROUPS[g].every(i => i === p || st.own[i] === o)) want = cash - price >= 60;
        if (lv === 1) want = cash - price >= 30 && Math.random() < .85;
        return {t: want ? 'buy' : 'decline'};
      }
      if (s !== st.cur) return null;
      const m = aiManage(s, lv); if (m) return m;
      if (lv >= 2 && st.trades === 0 && Math.random() < (lv === 3 ? .6 : .4)) { const o = aiPropose(s, lv); if (o) return o; }
      if (ph === 'roll') {
        if (st.jail[s] >= 0) {
          let oppH = 0; for (let i = 0; i < 40; i++) if (st.own[i] >= 0 && st.own[i] !== s) oppH += st.hs[i];
          const stay = lv === 3 && oppH >= 6;
          if (!stay && jcCount(s)) return {t: 'card'};
          if (!stay && st.cash[s] >= 50 + reserve(s, lv)) return {t: 'bail'};
        }
        return {t: 'roll'};
      }
      return {t: 'end'};
    }
    function fallback(s) {
      for (const a of [{t: 'roll'}, {t: 'end'}, {t: 'decline'}, {t: 'pass'}, {t: 'reject'}, {t: 'paydebt'}, {t: 'bankrupt'}]) if (legal(a, s)) return a;
      return {t: 'end'};
    }
    const busy = () => !!fxCur || fxq.length > 0 || pumpQ;
    const waitIdle = () => BX.test ? Promise.resolve() : new Promise(res => { const t0 = performance.now(); const f = () => { if (!busy() || performance.now() - t0 > 3500) res(); else setTimeout(f, 25); }; f(); });

    /* ===== visual effects queue ===== */
    const geo = {bx: 0, by: 0, bs: 100, px: 0, py: 0, pw: 0, ph: 0, land: true};
    function tileCenter(i) { const r = tileRect(i, geo.bs); return [geo.bx + r.x + r.w / 2, geo.by + r.y + r.h / 2]; }
    function pump() {
      while (true) {
        const e = fxq.shift();
        if (!e) { fxCur = null; for (let p = 0; p < n; p++) vis[p] = st.pos[p]; render(); return; }
        fxCur = e;
        const done = () => { fxCur = null; pump(); };
        if (e.k === 'money') { const [x, y] = tileCenter(vis[e.p]); floats.push({x, y, text: (e.v > 0 ? '+¥' : '-¥') + Math.abs(e.v), color: e.v > 0 ? '#2f8a5b' : '#c0291f', t: 0}); if (e.v > 0) ctx.sfx('coin'); continue; }
        if (e.k === 'sfx') { ctx.sfx(e.n); continue; }
        if (e.k === 'banner') { banner = {text: e.text, t: 0}; continue; }
        if (e.k === 'dice') {
          rolling = true; cardShow = null; ctx.sfx('dice');
          ctx.anim(620, () => {}, () => { rolling = false; ctx.sfx('roll'); done(); }); return;
        }
        if (e.k === 'move') {
          const L = e.path.length, per = BX.clamp(1400 / L, 60, 170); let lastStep = -1;
          ctx.anim(per * L, k => {
            const f = Math.min(L - 1e-6, k * L), idx = Math.floor(f);
            if (idx !== lastStep) { lastStep = idx; ctx.sfx('tick'); if (idx > 0) vis[e.p] = e.path[idx - 1]; }
            hop = {p: e.p, a: idx === 0 ? e.from : e.path[idx - 1], b: e.path[idx], f: f - idx, h: .55};
          }, () => { hop = null; vis[e.p] = e.path[L - 1]; ctx.sfx('move'); done(); }, k => k);
          return;
        }
        if (e.k === 'jump') {
          ctx.anim(650, k => { hop = {p: e.p, a: e.from, b: e.to, f: k, h: 2.2}; }, () => { hop = null; vis[e.p] = e.to; done(); }); return;
        }
        if (e.k === 'card') {
          cardShow = {d: e.d, id: e.id, a: 0}; ctx.sfx('flip');
          ctx.anim(1500, k => { cardShow && (cardShow.a = Math.min(1, k * 6)); }, done, k => k); return;
        }
      }
    }

    /* ===== layout ===== */
    const cv = ctx.canvas();
    const ui = ctx.ui('mo-ui');
    ui.append(h('style', {text: CSS}));
    const panel = h('div', {class: 'mo-panel'}); ui.append(panel);
    function layout() {
      const W = cv.w, H = cv.h, pad = W < 500 || H < 500 ? 6 : 12;
      const land = W > H * 1.08;
      if (land) {
        const pw = BX.clamp(W - H, 270, 420);
        const bs = Math.max(120, Math.min(H - 2 * pad, W - pw - 3 * pad));
        const tot = bs + pw + pad, x0 = Math.max(pad, (W - tot) / 2);
        Object.assign(geo, {land, bs, bx: x0, by: (H - bs) / 2, px: x0 + bs + pad, py: pad, pw: Math.min(pw, W - x0 - bs - 2 * pad), ph: H - 2 * pad});
      } else {
        const bs = Math.max(120, Math.min(W - 2 * pad, H - 300));
        const tot = bs + 300 + pad, y0 = H - tot > 0 ? Math.min(pad, (H - tot) / 2) : pad;
        Object.assign(geo, {land, bs, bx: (W - bs) / 2, by: y0, px: pad, py: y0 + bs + pad, pw: W - 2 * pad, ph: H - (y0 + bs + pad) - pad});
        if (W > 600) { geo.pw = Math.min(W - 2 * pad, 640); geo.px = (W - geo.pw) / 2; }
      }
      const key = [geo.px, geo.py, geo.pw, geo.ph].map(Math.round).join(',');
      if (key !== lastLayout) {
        lastLayout = key;
        Object.assign(panel.style, {left: geo.px + 'px', top: geo.py + 'px', width: geo.pw + 'px', height: geo.ph + 'px'});
      }
    }

    /* ===== panel (DOM) ===== */
    const actor = () => { const t = toMove(); return t != null && ctx.canAct(t) ? t : -1; };
    const uiSeat = () => { const a = actor(); return a >= 0 ? a : ctx.view; };
    function doAct(a) { if (busy()) return; const s = actor(); if (s < 0) { ctx.sfx('error'); return; } if (!legal(a, s)) { ctx.sfx('error'); return; } ctx.act(a, s); }
    const btn = (label, cls, fn, dis, primary) => h('button', {class: 'bx-btn ' + (cls || ''), text: label, disabled: !!dis, 'data-primary': primary ? '1' : null, on: {click: fn}});
    const sb = (label, cls, fn, dis) => h('button', {class: 'mo-sb ' + (cls || ''), text: label, disabled: !!dis, on: {click: fn}});
    function deed(i) {
      const sp = SP[i];
      if (!isProp(i)) {
        const desc = {go: '每次经过或停在起点，领取 ¥200。', jail: '入狱者在此服刑；只是路过则为「探监」，无事发生。', park: '免费停车，歇歇脚喝杯茶。', gojail: '停在这里立即入狱，不经过起点。',
          ch: '抽一张「机会」卡并照做。', cc: '抽一张「命运」卡并照做。', tax: '缴纳 ¥' + sp.amt + ' 给银行。'}[sp.k];
        return h('div', {class: 'mo-deed'}, h('div', {class: 'hd', style: {background: sp.k === 'ch' ? DECKC.ch : sp.k === 'cc' ? DECKC.cc : '#6b4426'}, text: sp.n}), h('div', {class: 'ft', text: desc}));
      }
      const col = sp.k === 'st' ? GC[sp.g] : sp.k === 'rr' ? '#4a3a2a' : '#2f6f8a', o = st.own[i];
      const rows = [];
      if (sp.k === 'st') {
        const hcur = o >= 0 ? st.hs[i] : -1, mono = o >= 0 && ownsAll(sp.g, o);
        rows.push(['租金', sp.rent[0], hcur === 0 && !mono], ['全套无房', sp.rent[0] * 2, hcur === 0 && mono]);
        for (let k = 1; k <= 4; k++) rows.push([k + ' 栋房', sp.rent[k], hcur === k]);
        rows.push(['酒楼', sp.rent[5], hcur === 5], ['每栋房价', sp.hc], ['抵押值', sp.price / 2]);
      } else if (sp.k === 'rr') {
        const k = o >= 0 ? GROUPS[8].filter(j => st.own[j] === o).length : 0;
        [25, 50, 100, 200].forEach((v, q) => rows.push(['拥有 ' + (q + 1) + ' 座驿站', v, k === q + 1])); rows.push(['抵押值', 100]);
      } else {
        const k = o >= 0 ? GROUPS[9].filter(j => st.own[j] === o).length : 0;
        rows.push(['拥有 1 家', '骰点×4', k === 1], ['拥有 2 家', '骰点×10', k === 2], ['抵押值', 75]);
      }
      const ownerTxt = o < 0 ? '无主 · 售价 ¥' + sp.price : '地主：' + name(o) + (st.mort[i] ? '（已抵押）' : '') + (st.hs[i] ? ' · ' + (st.hs[i] === 5 ? '酒楼' : st.hs[i] + ' 栋房') : '');
      return h('div', {class: 'mo-deed'},
        h('div', {class: 'hd', style: {background: col}}, h('small', {text: sp.k === 'st' ? '地 契' : sp.k === 'rr' ? '驿 站' : '公用事业'}), sp.n),
        h('table', {}, rows.map(r => h('tr', {class: r[2] ? 'hi' : ''}, h('td', {text: r[0]}), h('td', {text: typeof r[1] === 'number' ? '¥' + r[1] : r[1]})))),
        h('div', {class: 'ft', style: o >= 0 ? {color: ctx.color(o), fontWeight: 700} : null, text: ownerTxt}));
    }
    function manageList(s, allowBuild) {
      const box = h('div', {});
      box.append(h('div', {class: 'mo-h'}, h('span', {text: (ctx.hotseat ? name(s) + '的' : '我的') + '地产'}), h('small', {text: '现金 ¥' + st.cash[s] + ' · 银行余房 ' + st.bankH + ' / 酒楼 ' + st.bankT})));
      const mine = BX.range(40).filter(i => st.own[i] === s);
      if (!mine.length) box.append(h('div', {class: 'mo-wait', text: '还没有地产'}));
      const act = actor() === s && !busy();
      for (const i of mine) {
        const sp = SP[i], col = sp.k === 'st' ? GC[sp.g] : sp.k === 'rr' ? '#4a3a2a' : '#2f6f8a';
        const info = st.mort[i] ? '已抵押 · 赎回 ¥' + UNM(i) : sp.k === 'st' ? (st.hs[i] === 5 ? '酒楼' : st.hs[i] ? st.hs[i] + ' 栋房' : (ownsAll(sp.g, s) ? '全套 · 可盖房 ¥' + sp.hc : '空地')) : (sp.k === 'rr' ? '驿站' : '公用事业');
        const row = h('div', {class: 'mo-row'}, h('i', {class: 'c', style: {background: col}}), h('div', {class: 'n', on: {click: () => { sel = i; }}}, h('b', {text: sp.n}), h('small', {text: info})));
        if (sp.k === 'st' && allowBuild) row.append(sb('建', 'g', () => doAct({t: 'build', i}), !act || !legal({t: 'build', i}, s)));
        if (sp.k === 'st') row.append(sb('拆', '', () => doAct({t: 'sell', i}), !act || !legal({t: 'sell', i}, s)));
        if (st.mort[i]) row.append(sb('赎', '', () => doAct({t: 'unmort', i}), !act || !legal({t: 'unmort', i}, s)));
        else row.append(sb('押', 'r', () => doAct({t: 'mort', i}), !act || !legal({t: 'mort', i}, s)));
        box.append(row);
      }
      return box;
    }
    function propChip(i, on, fn) {
      const sp = SP[i], col = sp.k === 'st' ? GC[sp.g] : sp.k === 'rr' ? '#4a3a2a' : '#2f6f8a';
      return h('button', {class: 'mo-pc' + (on ? ' on' : ''), on: {click: fn}}, h('i', {style: {background: col}}), sp.n + (st.mort[i] ? '(押)' : ''));
    }
    function stepper(val, max, set) {
      return h('div', {class: 'mo-step'},
        sb('-100', '', () => set(Math.max(0, val - 100)), val <= 0), sb('-10', '', () => set(Math.max(0, val - 10)), val <= 0),
        h('span', {text: '¥' + val}),
        sb('+10', '', () => set(Math.min(max, val + 10)), val >= max), sb('+100', '', () => set(Math.min(max, val + 100)), val >= max));
    }
    function offerText(o) {
      const side = (c, p, j) => { const parts = []; if (c) parts.push('¥' + c); for (const i of p) parts.push(SP[i].n + (st.mort[i] ? '(押)' : '')); if (j) parts.push('免罪金牌×' + j); return parts.length ? parts.join('、') : '（无）'; };
      return h('div', {},
        h('div', {class: 'mo-sec'}, h('div', {text: name(o.from) + ' 给出'}), h('b', {text: side(o.gc, o.gp, o.gj)})),
        h('div', {class: 'mo-sec'}, h('div', {text: name(o.to) + ' 给出'}), h('b', {text: side(o.wc, o.wp, o.wj)})));
    }
    function tradeBuilder(s) {
      const box = h('div', {});
      const others = BX.range(n).filter(o => o !== s && st.alive[o]);
      if (!draft || draft.from !== s || !others.includes(draft.to)) draft = {from: s, to: others[0], gc: 0, wc: 0, gj: 0, wj: 0, gp: [], wp: []};
      const d = draft, re = () => render();
      box.append(h('div', {class: 'mo-h'}, h('span', {text: '交易对象'})));
      box.append(h('div', {class: 'mo-pcs'}, others.map(o => h('button', {class: 'mo-pc' + (d.to === o ? ' on' : ''), on: {click: () => { draft = {from: s, to: o, gc: 0, wc: 0, gj: 0, wj: 0, gp: [], wp: []}; re(); }}}, h('i', {style: {background: ctx.color(o)}}), name(o)))));
      const sec = (title, who, key, ckey, jkey) => {
        const props = BX.range(40).filter(i => tradeable(who, i));
        const el = h('div', {class: 'mo-sec'}, h('div', {text: title + '（现金 ¥' + st.cash[who] + '）'}));
        el.append(h('div', {class: 'mo-pcs'}, props.length ? props.map(i => propChip(i, d[key].includes(i), () => { const a = d[key]; const k = a.indexOf(i); if (k >= 0) a.splice(k, 1); else a.push(i); re(); })) : h('small', {text: '没有可交易的地产', style: {color: '#8c7a63'}})));
        el.append(stepper(d[ckey], st.cash[who], v => { d[ckey] = v; re(); }));
        if (jcCount(who)) el.append(h('div', {class: 'mo-pcs'}, h('button', {class: 'mo-pc' + (d[jkey] ? ' on' : ''), on: {click: () => { d[jkey] = d[jkey] ? 0 : 1; re(); }}}, '免罪金牌')));
        return el;
      };
      box.append(sec('你给出', s, 'gp', 'gc', 'gj'), sec(name(d.to) + ' 给出', d.to, 'wp', 'wc', 'wj'));
      return box;
    }
    function playersBar() {
      return h('div', {class: 'mo-pl'}, BX.range(n).map(s => h('div', {class: 'mo-chip' + (s === toMove() && !st.over ? ' cur' : '') + (st.alive[s] ? '' : ' dead')},
        h('i', {style: {background: ctx.color(s)}}), h('b', {text: ctx.name(s)}),
        st.jail[s] >= 0 ? h('u', {text: '狱'}) : null, jcCount(s) ? h('s', {text: '牌' + (jcCount(s) > 1 ? jcCount(s) : '')}) : null,
        h('em', {text: st.alive[s] ? '¥' + st.cash[s] : '破产'}))));
    }
    function render() {
      if (!panel.isConnected) return;
      const oldMain = panel.querySelector('.mo-main'), scroll = oldMain ? oldMain.scrollTop : 0;
      panel.innerHTML = '';
      const tm = toMove(), a = actor(), B = busy(), ph = st.ph;
      const main = h('div', {class: 'mo-main'}), bar = h('div', {class: 'mo-act'});
      const mine = a >= 0 && (ph === 'roll' || ph === 'post');
      if (!mine && uiMode !== 'info' && ph !== 'debt') uiMode = 'info';
      const waitTxt = t => bar.append(h('div', {class: 'mo-wait', text: st.over ? '对局结束' : B ? '……' : '等待 ' + name(t) + ' ' + t_}));
      let t_ = {roll: '行动…', post: '行动…', buy: '决定是否购买…', auction: '出价…', debt: '筹款…', trade: '考虑交易…'}[ph] || '';
      if (ph === 'trade' && st.offer) {
        main.append(h('div', {class: 'mo-h'}, h('span', {text: name(st.offer.from) + ' → ' + name(st.offer.to) + ' 交易提议'})), offerText(st.offer));
        if (a >= 0) { bar.append(btn('接受', 'jade', () => doAct({t: 'accept'}), B || !offerValid(st.offer)), btn('拒绝', 'red', () => doAct({t: 'reject'}), B)); }
        else waitTxt(tm);
      } else if (ph === 'auction' && st.auc) {
        const A = st.auc;
        main.append(h('div', {class: 'mo-big', html: '拍卖 · <b>' + SP[A.p].n + '</b><br>当前出价 <b>¥' + A.bid + '</b>' + (A.hi >= 0 ? '（' + BX.esc(name(A.hi)) + '）' : '（尚无人出价）') + '<br><small>仍在竞拍：' + A.act.map(q => BX.esc(name(q))).join('、') + '</small>'}), deed(A.p));
        if (a >= 0) {
          for (const inc of [10, 50, 100]) bar.append(btn('+' + inc, 'jade', () => doAct({t: 'bid', v: A.bid + inc}), B || A.bid + inc > st.cash[a]));
          bar.append(btn('放弃', 'red', () => doAct({t: 'pass'}), B));
        } else waitTxt(tm);
      } else if (ph === 'debt') {
        const d = st.debts[0];
        main.append(h('div', {class: 'mo-big', html: BX.esc(name(d.from)) + ' 需向 ' + BX.esc(name(d.to)) + ' 支付 <b>¥' + d.amt + '</b><br><small>现金 ¥' + st.cash[d.from] + ' · 可变现约 ¥' + liquid(d.from) + '</small>'}));
        if (a >= 0) { main.append(manageList(a, false)); bar.append(btn('支付 ¥' + d.amt, 'jade', () => doAct({t: 'paydebt'}), B || st.cash[a] < d.amt, true), btn('宣告破产', 'red', async () => { if (await BX.confirm('确定宣告破产吗？', '破产')) doAct({t: 'bankrupt'}); }, B)); }
        else waitTxt(tm);
      } else if (uiMode === 'trade' && mine) {
        main.append(tradeBuilder(a));
        const o = Object.assign({}, draft, {t: 'offer'});
        bar.append(btn('发出提议', 'red', () => { doAct({t: 'offer', to: o.to, gc: o.gc, wc: o.wc, gj: o.gj, wj: o.wj, gp: o.gp.slice(), wp: o.wp.slice()}); uiMode = 'info'; draft = null; }, B || !legal(o, a), true), btn('取消', 'ghost', () => { uiMode = 'info'; render(); }));
      } else if (uiMode === 'manage' && mine) {
        main.append(manageList(a, true));
        bar.append(btn('返回', 'ghost', () => { uiMode = 'info'; render(); }, false, true));
      } else {
        const showI = ph === 'buy' && st.buyP >= 0 ? st.buyP : sel >= 0 ? sel : st.pos[st.alive[st.cur] ? st.cur : 0];
        main.append(deed(showI));
        main.append(h('div', {class: 'mo-log'}, logs.slice(0, 8).map(l => h('div', {text: l}))));
        if (a >= 0 && ph === 'buy') {
          const p = st.buyP;
          bar.append(btn('购买 ¥' + SP[p].price, 'jade', () => doAct({t: 'buy'}), B || st.cash[a] < SP[p].price, true), btn('不买·拍卖', 'red', () => doAct({t: 'decline'}), B));
        } else if (mine) {
          if (ph === 'roll') {
            bar.append(btn(st.jail[a] >= 0 ? '掷骰求双' : st.dbl ? '再掷一次' : '掷骰', 'red', () => doAct({t: 'roll'}), B, true));
            if (st.jail[a] >= 0) { bar.append(btn('付¥50出狱', 'jade', () => doAct({t: 'bail'}), B || st.cash[a] < 50)); if (jcCount(a)) bar.append(btn('用金牌', 'jade', () => doAct({t: 'card'}), B)); }
          } else bar.append(btn('结束回合', 'red', () => { sel = -1; doAct({t: 'end'}); }, B, true));
          bar.append(btn('管理', '', () => { uiMode = 'manage'; render(); }, B), btn('交易', '', () => { uiMode = 'trade'; draft = null; render(); }, B || st.trades >= 3));
        } else waitTxt(tm);
      }
      panel.append(playersBar(), main, bar);
      main.scrollTop = scroll;
    }

    /* ===== status / info ===== */
    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.alive[s] ? '¥' + st.cash[s] : '破产');
      if (st.over) { ctx.status(st.win ? st.win.map(name).join('、') + ' 获胜' : '对局结束'); return; }
      const tm = toMove(), you = ctx.canAct(tm), who = you ? (ctx.hotseat ? name(tm) : '你') : name(tm);
      const r = st.maxRound ? `第 ${Math.min(st.round, st.maxRound)}/${st.maxRound} 回合 · ` : `第 ${st.round} 回合 · `;
      const what = {roll: st.jail[tm] >= 0 ? '在狱中' : '掷骰', post: '可结束回合', buy: '决定购买', auction: '竞拍中', debt: '筹款还债', trade: '考虑交易'}[st.ph] || '';
      ctx.status(r + who + ' ' + what);
    }

    /* ===== input ===== */
    function tileAt(x, y) {
      const lx = x - geo.bx, ly = y - geo.by; if (lx < 0 || ly < 0 || lx > geo.bs || ly > geo.bs) return -1;
      for (let i = 0; i < 40; i++) { const r = tileRect(i, geo.bs); if (lx >= r.x && lx < r.x + r.w && ly >= r.y && ly < r.y + r.h) return i; }
      return -1;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e), i = tileAt(p.x, p.y);
      if (i >= 0) { sel = sel === i ? -1 : i; if (uiMode === 'manage') uiMode = 'info'; if (uiMode !== 'trade') { ctx.sfx('tick'); render(); } }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { cacheKey = ''; });

    /* ===== drawing ===== */
    function drawStatic(g, bs) {
      const u = bs / 13, c = 2 * u;
      D.wood(g, -u * .25, -u * .25, bs + u * .5, bs + u * .5, {base: '#7a4a26', dark: '#3a1d0c', seed: 5});
      g.fillStyle = '#f1e5c6'; g.fillRect(0, 0, bs, bs);
      // center
      const I = bs - 2 * c, gr = g.createRadialGradient(bs / 2, bs / 2, I * .1, bs / 2, bs / 2, I * .75);
      gr.addColorStop(0, '#e9f0dc'); gr.addColorStop(1, '#c9d8b6'); g.fillStyle = gr; g.fillRect(c, c, I, I);
      g.save(); g.globalAlpha = .07; g.strokeStyle = '#2f5d4a'; g.lineWidth = 1;
      for (let k = 0; k < 12; k++) { D.circle(g, bs / 2, bs / 2, I * .05 * (k + 1)); g.stroke(); }
      g.restore();
      // logo seal
      const ly = bs / 2 - I * .27;
      g.save(); g.translate(bs / 2, ly); g.rotate(-.05);
      g.fillStyle = C.red; D.rr(g, -I * .3, -I * .085, I * .6, I * .17, I * .02); g.fill();
      g.strokeStyle = '#f6d9a8'; g.lineWidth = Math.max(1, I * .006); D.rr(g, -I * .29, -I * .075, I * .58, I * .15, I * .015); g.stroke();
      D.text(g, '地产大亨', 0, I * .004, {size: I * .1, color: '#fbe9d0', font: 'deco', weight: 400});
      g.restore();
      // card decks
      const deckAt = (x, y, rot, kind) => {
        g.save(); g.translate(x, y); g.rotate(rot);
        const w = I * .24, hh = I * .145;
        g.setLineDash([u * .12, u * .1]); g.strokeStyle = 'rgba(40,60,40,.4)'; g.lineWidth = 1; D.rr(g, -w / 2 - u * .1, -hh / 2 - u * .1, w + u * .2, hh + u * .2, u * .15); g.stroke(); g.setLineDash([]);
        for (let k = 2; k >= 0; k--) {
          g.fillStyle = D.shade(DECKC[kind], -k * 8); D.rr(g, -w / 2 + k * 1.5, -hh / 2 + k * 1.5, w, hh, u * .12); g.fill();
        }
        g.strokeStyle = 'rgba(255,240,210,.8)'; g.lineWidth = 1.2; D.rr(g, -w / 2 + u * .1, -hh / 2 + u * .1, w - u * .2, hh - u * .2, u * .08); g.stroke();
        D.text(g, kind === 'ch' ? '？' : '福', -w * .28, 0, {size: hh * .5, color: '#fff5df', font: 'deco', weight: 400});
        D.text(g, DECKN[kind], w * .12, 0, {size: hh * .3, color: '#fff5df', font: 'serif', weight: 800});
        g.restore();
      };
      deckAt(c + I * .2, bs / 2 + I * .06, -.55, 'ch');
      deckAt(bs - c - I * .2, bs / 2 + I * .06, .55, 'cc');
      // tiles
      for (let i = 0; i < 40; i++) drawTile(g, i, bs, u, c);
      g.strokeStyle = 'rgba(50,30,10,.85)'; g.lineWidth = Math.max(1, u * .05); g.strokeRect(0, 0, bs, bs); g.strokeRect(c, c, I, I);
    }
    function drawTile(g, i, bs, u, c) {
      const r = tileRect(i, bs), sp = SP[i];
      g.strokeStyle = 'rgba(50,30,10,.6)'; g.lineWidth = Math.max(.6, u * .025); g.strokeRect(r.x, r.y, r.w, r.h);
      const big = u >= 40, ink = '#2b2118';
      if (r.side < 0) {
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        if (sp.k === 'go') {
          g.fillStyle = '#f6e3c0'; g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
          D.text(g, '起点', cx, cy - c * .12, {size: c * .27, color: C.red, font: 'deco', weight: 400});
          D.text(g, '领 ¥200', cx, cy + c * .14, {size: c * .13, color: ink, weight: 700});
          g.fillStyle = C.red; g.beginPath(); const ay = cy + c * .34; g.moveTo(cx - c * .32, ay); g.lineTo(cx - c * .14, ay - c * .08); g.lineTo(cx - c * .14, ay - c * .03); g.lineTo(cx + c * .32, ay - c * .03); g.lineTo(cx + c * .32, ay + c * .03); g.lineTo(cx - c * .14, ay + c * .03); g.lineTo(cx - c * .14, ay + c * .08); g.closePath(); g.fill();
        } else if (sp.k === 'jail') {
          g.fillStyle = '#e9d9b6'; g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
          const jx = r.x + c * .3, jw = c * .7;
          g.fillStyle = '#d9822b'; g.fillRect(jx, r.y, jw, jw);
          g.strokeStyle = '#3a2410'; g.lineWidth = Math.max(1, c * .025); g.strokeRect(jx, r.y, jw, jw);
          D.text(g, '监狱', jx + jw / 2, r.y + jw * .5, {size: c * .16, color: '#fff3df', font: 'deco', weight: 400, shadow: 'rgba(0,0,0,.4)'});
          g.strokeStyle = 'rgba(40,20,5,.75)'; g.lineWidth = Math.max(1, c * .02); for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(jx + jw * k / 5, r.y + jw * .12); g.lineTo(jx + jw * k / 5, r.y + jw * .9); g.stroke(); }
          D.text(g, '探 监', jx + jw / 2, r.y + c * .85, {size: c * .12, color: ink, font: 'serif', weight: 800});
        } else if (sp.k === 'park') {
          g.fillStyle = '#e4ecd6'; g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
          // tea cup
          g.fillStyle = '#3f7f6b'; g.beginPath(); g.ellipse(cx, cy - c * .02, c * .2, c * .06, 0, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.moveTo(cx - c * .2, cy - c * .02); g.quadraticCurveTo(cx - c * .18, cy + c * .17, cx, cy + c * .17); g.quadraticCurveTo(cx + c * .18, cy + c * .17, cx + c * .2, cy - c * .02); g.fill();
          g.strokeStyle = 'rgba(80,110,90,.6)'; g.lineWidth = Math.max(1, c * .02);
          for (const dx of [-.06, .04]) { g.beginPath(); g.moveTo(cx + c * dx, cy - c * .12); g.quadraticCurveTo(cx + c * (dx + .05), cy - c * .2, cx + c * dx, cy - c * .28); g.stroke(); }
          D.text(g, '免费停车', cx, r.y + c * .82, {size: c * .14, color: ink, font: 'serif', weight: 800});
        } else {
          g.fillStyle = '#ecd6c8'; g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
          D.piece(g, cx, cy - c * .06, c * .22, '捕', C.red);
          D.text(g, '入狱', cx, r.y + c * .82, {size: c * .15, color: C.red, font: 'serif', weight: 900});
        }
        return;
      }
      const vert = r.side === 0 || r.side === 2;
      const strip = sp.k === 'st' ? stripRect(r, bs) : null;
      if (strip) {
        g.fillStyle = GC[sp.g]; g.fillRect(strip.x, strip.y, strip.w, strip.h);
        g.strokeStyle = 'rgba(50,30,10,.6)'; g.strokeRect(strip.x, strip.y, strip.w, strip.h);
      }
      const label = sp.s || sp.n;
      const glyph = {rr: '驿', ut: sp.n[0] === '电' ? '电' : '水', ch: '？', cc: '福', tax: '税'}[sp.k];
      const gcol = {rr: '#4a3a2a', ut: '#2f6f8a', ch: DECKC.ch, cc: DECKC.cc, tax: '#7a4a9a'}[sp.k];
      const priceTxt = sp.price ? '¥' + sp.price : sp.k === 'tax' ? '¥' + sp.amt : '';
      if (vert) {
        const sh = strip ? strip.h : 0, top = r.side === 0 ? r.y + sh : r.y, ch = r.h - sh, cx = r.x + r.w / 2;
        if (strip) {
          const fs = Math.min(u * .4, ch * (big ? .62 : .74) / label.length);
          const y0 = r.side === 0 ? top + ch * .06 : top + (big ? ch * .3 : ch * .06);
          vtext(g, label, cx, y0, fs, ink, 700);
          if (big) D.text(g, priceTxt, cx, r.side === 0 ? r.y + r.h - u * .26 : r.y + u * .3, {size: u * .22, color: '#5e4b38', weight: 700});
        } else {
          const hasP = big && priceTxt, gr0 = u * .27;
          const room = 2 * u - gr0 * 2 - u * .2 - (hasP ? u * .42 : u * .08);
          const fs = Math.min(u * .3, room / label.length / 1.04), lh = fs * label.length * 1.04;
          let gy, ty;
          if (r.side === 0) { gy = r.y + u * .1 + gr0; ty = gy + gr0 + u * .06 + (room - lh) / 2; if (hasP) D.text(g, priceTxt, cx, r.y + r.h - u * .22, {size: u * .21, color: '#5e4b38', weight: 700}); }
          else { gy = r.y + r.h - u * .1 - gr0; ty = gy - gr0 - u * .06 - lh - (room - lh) / 2; if (hasP) D.text(g, priceTxt, cx, r.y + u * .3, {size: u * .21, color: '#5e4b38', weight: 700}); }
          g.fillStyle = gcol; D.circle(g, cx, gy, gr0); g.fill();
          D.text(g, glyph, cx, gy + u * .02, {size: gr0 * 1.2, color: '#fff5df', font: 'deco', weight: 400});
          vtext(g, label, cx, ty, fs, ink, 700);
        }
      } else {
        const sw = strip ? strip.w : 0, left = r.side === 1 ? r.x : r.x + sw, cw = r.w - sw, cy = r.y + r.h / 2;
        const cx = left + cw / 2;
        if (!strip) {
          const gx = r.side === 1 ? left + u * .4 : left + cw - u * .4;
          g.fillStyle = gcol; D.circle(g, gx, cy, u * .3); g.fill();
          D.text(g, glyph, gx, cy + u * .02, {size: u * .36, color: '#fff5df', font: 'deco', weight: 400});
          const tx = r.side === 1 ? left + u * .8 + (cw - u * .8) / 2 : left + (cw - u * .8) / 2, tw = cw - u * .9;
          const fs = Math.min(u * .34, tw * .92 / label.length);
          D.text(g, label, tx, priceTxt && big ? cy - u * .14 : cy, {size: fs, color: ink, font: 'serif', weight: 700});
          if (big && priceTxt) D.text(g, priceTxt, tx, cy + u * .24, {size: u * .21, color: '#5e4b38', weight: 700});
        } else {
          const fs = Math.min(u * .36, cw * .86 / label.length);
          D.text(g, label, cx, big ? cy - u * .14 : cy, {size: fs, color: ink, font: 'serif', weight: 700});
          if (big) D.text(g, priceTxt, cx, cy + u * .24, {size: u * .21, color: '#5e4b38', weight: 700});
        }
      }
    }
    function tokenXY(p, i, slot, cnt, bs) {
      const r = tileRect(i, bs), u = bs / 13;
      let cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      if (i === 10) { if (st.jail[p] >= 0 && !(hop && hop.p === p)) { cx = r.x + r.w * .3 + r.w * .35; cy = r.y + r.w * .35; } else { cx = r.x + r.w * .15; cy = r.y + r.h * .72; } }
      else if (r.side >= 0 && SP[i].k === 'st') { const s2 = stripRect(r, bs); if (r.side === 0) cy += s2.h / 2; else if (r.side === 2) cy -= s2.h / 2; else if (r.side === 1) cx -= s2.w / 2; else cx += s2.w / 2; }
      if (cnt > 1) { const offs = [[-.22, -.18], [.22, .18], [.22, -.18], [-.22, .18]][slot]; const vert = r.side === 0 || r.side === 2; cx += (vert ? offs[0] * .9 : offs[1] * 1.6) * u; cy += (vert ? offs[1] * 2 : offs[0]) * u; }
      return [cx, cy];
    }
    function drawDynamic(g, bs, dt) {
      const u = bs / 13, c = 2 * u, I = bs - 2 * c;
      // ownership, mortgage, houses
      for (let i = 0; i < 40; i++) {
        if (!isProp(i)) continue;
        const r = tileRect(i, bs), o = st.own[i];
        if (o >= 0) {
          g.fillStyle = D.alpha(ctx.color(o), .2); g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
          const ob = Math.max(3, c * .05); g.fillStyle = ctx.color(o);
          if (r.side === 0) g.fillRect(r.x + 1, r.y + r.h - ob, r.w - 2, ob - 1);
          else if (r.side === 2) g.fillRect(r.x + 1, r.y + 1, r.w - 2, ob - 1);
          else if (r.side === 1) g.fillRect(r.x + 1, r.y + 1, ob - 1, r.h - 2);
          else g.fillRect(r.x + r.w - ob, r.y + 1, ob - 1, r.h - 2);
        }
        if (st.mort[i]) {
          g.fillStyle = 'rgba(60,40,20,.42)'; g.fillRect(r.x, r.y, r.w, r.h);
          const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          g.save(); g.translate(cx, cy); g.rotate(-.3); g.fillStyle = 'rgba(178,58,43,.92)'; D.rr(g, -u * .3, -u * .3, u * .6, u * .6, u * .08); g.fill();
          D.text(g, '押', 0, u * .02, {size: u * .42, color: '#fff3df', font: 'serif', weight: 900}); g.restore();
        }
        const hn = st.hs[i];
        if (hn) {
          const s2 = stripRect(r, bs), vert = r.side === 0 || r.side === 2;
          const hs = Math.min(vert ? r.w / 4.4 : r.h / 4.4, (vert ? s2.h : s2.w) * .78);
          if (hn === 5) house(g, s2.x + s2.w / 2, s2.y + s2.h / 2 + hs * .1, hs * 1.15, true);
          else for (let k = 0; k < hn; k++) {
            const t = (k - (hn - 1) / 2) * hs * 1.05;
            house(g, s2.x + s2.w / 2 + (vert ? t : 0), s2.y + s2.h / 2 + (vert ? 0 : t) + hs * .1, hs * .9);
          }
        }
      }
      // highlights
      const pulse = .5 + .5 * Math.sin(performance.now() / 260);
      if (sel >= 0) { const r = tileRect(sel, bs); g.strokeStyle = '#e0a020'; g.lineWidth = Math.max(2, u * .1); g.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); }
      const focus = st.ph === 'buy' ? st.buyP : st.ph === 'auction' && st.auc ? st.auc.p : -1;
      if (focus >= 0 && !busy()) { const r = tileRect(focus, bs); g.strokeStyle = `rgba(63,160,120,${.5 + .5 * pulse})`; g.lineWidth = Math.max(2.5, u * .14); g.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); }
      // center info
      const round = st.maxRound ? `第 ${Math.min(st.round, st.maxRound)} / ${st.maxRound} 回合` : `第 ${st.round} 回合`;
      D.text(g, round, bs / 2, bs / 2 - I * .1, {size: Math.max(10, I * .045), color: '#3f5f4a', weight: 700});
      const tm = toMove();
      if (tm != null && !st.over) {
        const ty = bs / 2 + I * .04;
        D.text(g, (st.ph === 'auction' ? '竞拍：' : st.ph === 'trade' ? '交易：' : st.ph === 'debt' ? '筹款：' : '') + ctx.name(tm), bs / 2, ty, {size: Math.max(11, I * .055), color: ctx.color(tm), font: 'serif', weight: 900, stroke: 'rgba(255,255,255,.8)', strokeW: 3});
      }
      // dice
      const ds = Math.max(18, I * .13), dy = bs / 2 + I * .24;
      const faces = rolling ? [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] : st.dice;
      const tnow = performance.now() / 90;
      D.die(g, bs / 2 - ds * 1.15, dy - ds / 2 + (rolling ? Math.sin(tnow) * ds * .2 : 0), ds, faces[0], {rot: rolling ? tnow * .7 : -.12});
      D.die(g, bs / 2 + ds * .15, dy - ds / 2 + (rolling ? Math.cos(tnow) * ds * .2 : 0), ds, faces[1], {rot: rolling ? -tnow * .8 : .15});
      // tokens
      const at = {}; for (let p = 0; p < n; p++) if (st.alive[p] || vis[p] !== undefined && hop && hop.p === p) { if (!st.alive[p]) continue; (at[vis[p]] = at[vis[p]] || []).push(p); }
      const tr = Math.max(5, u * .22);
      const drawn = [];
      for (const k in at) { const L = at[k]; L.forEach((p, slot) => { if (hop && hop.p === p) return; const [x, y] = tokenXY(p, +k, slot, L.length, bs); drawn.push([y, x, p]); }); }
      drawn.sort((a, b) => a[0] - b[0]);
      for (const [y, x, p] of drawn) pawn(g, x, y, tr, ctx.color(p), p === tm && !st.over && !busy());
      if (hop) {
        const [ax, ay] = tokenXY(hop.p, hop.a, 0, 1, bs), [bx, by] = tokenXY(hop.p, hop.b, 0, 1, bs);
        const f = hop.f, x = ax + (bx - ax) * f, y = ay + (by - ay) * f - Math.sin(Math.PI * f) * u * hop.h;
        pawn(g, x, y, tr * (1 + .15 * Math.sin(Math.PI * f)), ctx.color(hop.p), true);
      }
      // card popup
      if (cardShow) {
        const card = (cardShow.d === 'ch' ? CHANCE : CHEST)[cardShow.id], a = cardShow.a;
        const w = I * .78, hh = I * .44, x = bs / 2 - w / 2, y = bs / 2 - hh / 2 + I * .02;
        g.save(); g.globalAlpha = Math.min(1, a); g.translate(bs / 2, y + hh / 2); const sc = .7 + .3 * Math.min(1, a); g.scale(sc, sc); g.translate(-bs / 2, -(y + hh / 2));
        g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = u * .5; g.shadowOffsetY = u * .15;
        g.fillStyle = '#fffaf0'; D.rr(g, x, y, w, hh, u * .25); g.fill(); g.shadowColor = 'transparent';
        g.fillStyle = DECKC[cardShow.d]; D.rr(g, x, y, w, hh * .28, u * .25); g.fill(); g.fillRect(x, y + hh * .15, w, hh * .13);
        D.text(g, DECKN[cardShow.d], bs / 2, y + hh * .14, {size: hh * .17, color: '#fff5df', font: 'deco', weight: 400});
        const fs = Math.max(10, Math.min(hh * .12, I * .05)); g.font = `700 ${fs}px ${BX.F.serif}`;
        const lines = wrap(g, card.x, w * .86);
        lines.forEach((l, k) => D.text(g, l, bs / 2, y + hh * .28 + (hh * .72 - lines.length * fs * 1.35) / 2 + fs * 1.35 * (k + .5), {size: fs, color: '#2b2118', font: 'serif', weight: 700}));
        g.strokeStyle = DECKC[cardShow.d]; g.lineWidth = 2; D.rr(g, x, y, w, hh, u * .25); g.stroke();
        g.restore();
      }
      // banner
      if (banner) {
        banner.t += dt; const k = banner.t, al = k < .2 ? k / .2 : k > 1.6 ? Math.max(0, 1 - (k - 1.6) / .4) : 1;
        if (al <= 0 && k > 1.6) banner = null; else {
          g.save(); g.globalAlpha = al; const fs = Math.max(13, I * .075), y = bs / 2 - I * .36;
          g.font = `400 ${fs}px ${BX.F.deco}`; const tw = g.measureText(banner.text).width + fs * 1.4;
          g.fillStyle = 'rgba(43,33,24,.88)'; D.rr(g, bs / 2 - tw / 2, y - fs * .8, tw, fs * 1.6, fs * .8); g.fill();
          D.text(g, banner.text, bs / 2, y, {size: fs, color: '#ffe3a0', font: 'deco', weight: 400}); g.restore();
        }
      }
    }
    function frame(dt) {
      const g = cv.g; cv.clear();
      layout();
      const {bx, by, bs} = geo, dpr = cv.dpr;
      const key = Math.round(bs) + ':' + dpr;
      if (key !== cacheKey) {
        cacheKey = key; const pad = Math.ceil(bs / 13 * .3);
        boardCache = document.createElement('canvas'); boardCache.width = Math.ceil((bs + pad * 2) * dpr); boardCache.height = boardCache.width;
        const bg = boardCache.getContext('2d'); bg.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr); drawStatic(bg, bs); boardCache.pad = pad;
      }
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
      g.drawImage(boardCache, bx - boardCache.pad, by - boardCache.pad, boardCache.width / dpr, boardCache.height / dpr); g.restore();
      g.save(); g.translate(bx, by); drawDynamic(g, bs, dt); g.restore();
      // floats (screen coords)
      for (const f of floats) {
        f.t += dt; const a = f.t < 1.2 ? 1 : Math.max(0, 1 - (f.t - 1.2) / .5);
        D.text(g, f.text, f.x, f.y - 14 - f.t * 26, {size: Math.max(13, geo.bs / 13 * .42), color: f.color, weight: 900, stroke: '#fffaf0', strokeW: 3.5, font: 'sans'});
        f.a = a;
      }
      floats = floats.filter(f => f.t < 1.7);
    }

    const inst = {
      st, toMove, valid: legal, apply,
      async aiMove(seat, level) {
        await waitIdle();
        let a = null; try { a = aiDecide(seat, level); } catch (e) { a = null; }
        if (!a || !legal(a, seat)) a = fallback(seat);
        return a;
      },
      onTurn() { status(); render(); },
      onView() { render(); },
      frame,
      resize() { lastLayout = ''; },
      key(e) {
        if (e.code === 'Space' || e.code === 'Enter') { const b = panel.querySelector('[data-primary="1"]'); if (b && !b.disabled) { b.click(); e.preventDefault(); } }
      },
    };
    log('开局：每人 ¥1500，' + (maxRound ? '共 ' + maxRound + ' 回合' : '经典模式') + '。祝生意兴隆！');
    return inst;
  },
});
