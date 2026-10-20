/* 双人厨房 — Overcooked-style co-op cooking in a tea-house kitchen (realtime, 2 seats, host authoritative). */
const D = BX.draw, C = BX.C;
const GW = 13, GH = 9, PR = .3;
const TEST = !!BX.test;
const ING = {
  flour: {n: '面粉', ch: '面', chop: true, prep: '面皮'},
  meat: {n: '猪肉', ch: '肉', chop: true, prep: '肉馅'},
  veg: {n: '青菜', ch: '菜', chop: true, prep: '菜丁'},
  rice: {n: '大米', ch: '米', chop: false, prep: '大米'},
  shrimp: {n: '鲜虾', ch: '虾', chop: true, prep: '虾仁'},
};
const CRATE = {F: 'flour', M: 'meat', V: 'veg', R: 'rice', S: 'shrimp'};
const STN = {T: 'steam', W: 'wok', P: 'pot'};
const STN_CH = {steam: '蒸', wok: '炒', pot: '煮'}, STN_NAME = {steam: '蒸笼', wok: '炒锅', pot: '汤锅'};
const REC = {
  soup: {n: '青菜汤', st: 'pot', ing: ['veg'], t: 6, v: 20},
  fried: {n: '炒饭', st: 'wok', ing: ['rice', 'veg'], t: 7, v: 26},
  xlb: {n: '小笼包', st: 'steam', ing: ['flour', 'meat'], t: 9, v: 32},
  hargow: {n: '虾饺', st: 'steam', ing: ['flour', 'shrimp'], t: 9, v: 32},
  noodle: {n: '拉面', st: 'pot', ing: ['flour', 'meat'], t: 8, v: 30},
};
/* map legend: # counter  . floor  ~ wet floor  F/M/V/R/S crates  C chopping board  T steamer  W wok  P pot
   L plate rack  H serving hatch  D dirty-plate return  K sink  X trash  E extinguisher (counter) */
const LEVELS = {
  1: {name: '茶馆后厨', rec: ['soup', 'fried', 'xlb'], plates: 3, pat: 80, gap: 17, grace: 11, stars: [60, 140, 220], spawn: [[3, 5], [9, 5]],
    hz: '入门厨房：熟悉切菜、下锅、装盘、上菜与洗碗。',
    map: ['##VMFR#TTPW##', '#...........#', 'C...........H', '#....###....#', 'C....#C#....L', '#...........#', 'X...........D', '#...........K', '####E########']},
  2: {name: '点心铺', rec: ['soup', 'xlb', 'hargow', 'noodle'], plates: 3, pat: 75, gap: 15, grace: 9, stars: [80, 170, 260], spawn: [[3, 4], [9, 4]],
    hz: '厨房被长案隔成两半：备料在左、灶台在右，可隔着长案递食材，或绕最下面一排走。',
    map: ['##FMVS#TTPP##', '#.....#.....#', 'C.....#.....H', '#.....#.....#', 'C.....#.....L', '#.....#.....#', 'X.....#.....D', '#...........K', '#####E#######']},
  3: {name: '年夜大席', rec: ['soup', 'fried', 'xlb', 'hargow', 'noodle'], plates: 4, pat: 65, gap: 12, grace: 6, stars: [100, 200, 300], spawn: [[3, 6], [9, 6]],
    hz: '五道菜齐上、火候更急；地上有水渍，踩上去会打滑。',
    map: ['#FMVRS#TTWPP#', '#...........H', 'C..~.....~..#', '#...#C#C#...L', 'C...#####...#', '#..~.....~..#', 'X...........D', '#...........K', '######E######']},
};
const LV_TIME = TEST ? 34 : 180, READY = TEST ? .6 : 2.6;
const CHOP_T = TEST ? .45 : 1.5, WASH_T = TEST ? .4 : 1.3, EXT_T = TEST ? .4 : 1, RET_T = TEST ? 2 : 6;
const cookT = r => TEST ? 2.4 : REC[r].t;
const PAL = ['#c23a2b', '#2f7f9a'];

/* ---------- small pure helpers ---------- */
const subMulti = (a, b) => { const m = {}; for (const x of b) m[x] = (m[x] || 0) + 1; for (const x of a) { if (!m[x]) return false; m[x]--; } return true; };
const minus = (b, a) => { const r = b.slice(); for (const x of a) { const i = r.indexOf(x); if (i >= 0) r.splice(i, 1); } return r; };
const prepared = it => it && it.k === 'i' && (it.c || !ING[it.t].chop);

/* ---------- drawing: ingredients, plates, dishes ---------- */
function sack(g, x, y, s, col, tie, ch) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x - s * .26, y + s * .3); g.quadraticCurveTo(x - s * .34, y - s * .05, x - s * .14, y - s * .2);
  g.lineTo(x + s * .14, y - s * .2); g.quadraticCurveTo(x + s * .34, y - s * .05, x + s * .26, y + s * .3); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(80,50,20,.35)'; g.lineWidth = Math.max(1, s * .03); g.stroke();
  g.fillStyle = col; D.rr(g, x - s * .1, y - s * .34, s * .2, s * .16, s * .05); g.fill(); g.stroke();
  g.fillStyle = tie; g.fillRect(x - s * .13, y - s * .23, s * .26, s * .05);
  D.text(g, ch, x, y + s * .07, {size: s * .26, color: '#7a4a22', font: 'serif', weight: 900});
}
function drawIng(g, x, y, s, t, chopped) {
  g.save();
  if (t === 'flour') {
    if (!chopped) sack(g, x, y, s, '#f4ead2', '#c23a2b', '面');
    else { D.disc(g, x, y + s * .04, s * .3, '#fbf3df', {flat: true}); g.fillStyle = 'rgba(200,170,120,.35)'; D.circle(g, x, y + s * .04, s * .2); g.fill(); g.fillStyle = '#fff'; for (const [a, b] of [[-.1, -.05], [.08, .06], [.02, -.12]]) { D.circle(g, x + a * s, y + b * s, s * .025); g.fill(); } }
  } else if (t === 'meat') {
    if (!chopped) {
      g.fillStyle = '#c94a44'; g.beginPath(); g.ellipse(x, y, s * .32, s * .22, -.3, 0, 7); g.fill();
      g.strokeStyle = '#f6e3d6'; g.lineWidth = s * .06; g.beginPath(); g.ellipse(x, y, s * .26, s * .16, -.3, .4, 2.6); g.stroke();
      g.fillStyle = '#f3ead8'; D.circle(g, x + s * .26, y - s * .14, s * .07); g.fill(); D.circle(g, x + s * .33, y - s * .08, s * .06); g.fill();
    } else for (const [a, b, r] of [[-.12, .05, .12], [.1, .06, .11], [0, -.08, .12], [.14, -.1, .08], [-.15, -.1, .07]]) D.disc(g, x + a * s, y + b * s, r * s, '#e0796a', {shadow: false});
  } else if (t === 'veg') {
    if (!chopped) {
      g.fillStyle = '#e9f2cf'; g.beginPath(); g.ellipse(x, y + s * .14, s * .12, s * .16, 0, 0, 7); g.fill();
      g.fillStyle = '#3f9a4a'; for (const a of [-.55, 0, .55]) { g.save(); g.translate(x, y - s * .02); g.rotate(a); g.beginPath(); g.ellipse(0, -s * .12, s * .11, s * .2, 0, 0, 7); g.fill(); g.restore(); }
      g.strokeStyle = '#2c7436'; g.lineWidth = Math.max(1, s * .02); g.beginPath(); g.moveTo(x, y + s * .2); g.lineTo(x, y - s * .25); g.stroke();
    } else { const cs = ['#3f9a4a', '#5bb35e', '#e9f2cf', '#4caa52']; [[-.15, -.08], [.05, -.13], [.16, .02], [-.05, .08], [.08, .14], [-.18, .1]].forEach(([a, b], i) => { g.fillStyle = cs[i % 4]; D.rr(g, x + a * s - s * .06, y + b * s - s * .06, s * .12, s * .12, s * .03); g.fill(); }); }
  } else if (t === 'rice') {
    sack(g, x, y, s, '#f7f3ea', '#3f7f6b', '米');
  } else if (t === 'shrimp') {
    if (!chopped) {
      g.strokeStyle = '#ef8445'; g.lineWidth = s * .14; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, s * .17, Math.PI * .8, Math.PI * 2.15); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = s * .03; for (let k = 0; k < 4; k++) { const a = Math.PI * (1 + k * .3); g.beginPath(); g.moveTo(x + Math.cos(a) * s * .11, y + Math.sin(a) * s * .11); g.lineTo(x + Math.cos(a) * s * .23, y + Math.sin(a) * s * .23); g.stroke(); }
      g.fillStyle = '#e66a2c'; g.beginPath(); const tx = x - s * .14, ty = y + s * .1; g.moveTo(tx, ty); g.lineTo(tx - s * .14, ty + s * .1); g.lineTo(tx - s * .04, ty + s * .14); g.fill();
      g.fillStyle = '#222'; D.circle(g, x + s * .18, y + s * .02, s * .03); g.fill();
    } else for (const [a, b] of [[-.12, -.05], [.1, -.08], [0, .1], [.15, .1]]) { g.strokeStyle = '#f39a85'; g.lineWidth = s * .07; g.lineCap = 'round'; g.beginPath(); g.arc(x + a * s, y + b * s, s * .06, 0, Math.PI * 1.4); g.stroke(); }
  }
  g.restore();
}
function drawDish(g, x, y, s, r) {
  g.save();
  const bowl = (fill) => { g.fillStyle = '#fbf7ef'; g.beginPath(); g.ellipse(x, y, s * .3, s * .24, 0, 0, 7); g.fill(); g.strokeStyle = '#3b6ea8'; g.lineWidth = Math.max(1, s * .03); g.stroke(); g.fillStyle = fill; g.beginPath(); g.ellipse(x, y - s * .01, s * .23, s * .17, 0, 0, 7); g.fill(); };
  if (r === 'soup') { bowl('#8cc152'); g.fillStyle = '#3f9a4a'; g.beginPath(); g.ellipse(x - s * .05, y - s * .02, s * .1, s * .05, .5, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + s * .07, y + s * .04, s * .08, s * .04, -.4, 0, 7); g.fill(); }
  else if (r === 'noodle') {
    bowl('#e7bf7f'); g.strokeStyle = '#fff3c9'; g.lineWidth = Math.max(1, s * .03);
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x - s * .18, y + k * s * .03); g.bezierCurveTo(x - s * .05, y + k * s * .03 - s * .05, x + s * .05, y + k * s * .03 + s * .05, x + s * .18, y + k * s * .03); g.stroke(); }
    g.fillStyle = '#d9776a'; g.beginPath(); g.ellipse(x + s * .08, y - s * .06, s * .07, s * .05, .3, 0, 7); g.fill(); g.fillStyle = '#4caa52'; D.circle(g, x - s * .1, y - s * .07, s * .03); g.fill(); D.circle(g, x - s * .04, y + s * .08, s * .025); g.fill();
  } else if (r === 'fried') {
    g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(x, y, s * .26, s * .17, 0, 0, 7); g.fill(); g.fillStyle = '#f7da78'; g.beginPath(); g.ellipse(x - s * .04, y - s * .05, s * .14, s * .08, 0, 0, 7); g.fill();
    [['#4caa52', -.12, .02], ['#e76f51', .08, -.04], ['#4caa52', .13, .06], ['#f4a261', -.02, .08], ['#e76f51', -.15, -.06]].forEach(([c, a, b]) => { g.fillStyle = c; D.circle(g, x + a * s, y + b * s, s * .03); g.fill(); });
  } else if (r === 'xlb' || r === 'hargow') {
    if (r === 'xlb') { g.fillStyle = '#c99a5a'; g.beginPath(); g.ellipse(x, y + s * .03, s * .32, s * .24, 0, 0, 7); g.fill(); g.strokeStyle = '#9a6c34'; g.lineWidth = Math.max(1, s * .025); g.stroke(); }
    const pts = [[-.13, .02], [.13, .02], [0, -.1]];
    for (const [a, b] of pts) {
      const cx = x + a * s, cy = y + b * s;
      if (r === 'xlb') { D.disc(g, cx, cy, s * .11, '#fbf6ea', {shadow: false}); g.strokeStyle = 'rgba(160,130,90,.6)'; g.lineWidth = Math.max(.8, s * .015); for (let k = 0; k < 5; k++) { const an = k * 1.26; g.beginPath(); g.moveTo(cx, cy - s * .01); g.lineTo(cx + Math.cos(an) * s * .08, cy + Math.sin(an) * s * .08); g.stroke(); } }
      else { g.fillStyle = 'rgba(250,244,236,.95)'; g.beginPath(); g.ellipse(cx, cy, s * .12, s * .09, 0, Math.PI, 0); g.lineTo(cx + s * .12, cy + s * .03); g.lineTo(cx - s * .12, cy + s * .03); g.fill(); g.fillStyle = 'rgba(241,140,120,.55)'; g.beginPath(); g.ellipse(cx, cy - s * .01, s * .06, s * .04, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(180,160,140,.6)'; g.lineWidth = Math.max(.8, s * .015); g.beginPath(); g.ellipse(cx, cy, s * .12, s * .09, 0, Math.PI, 0); g.stroke(); }
    }
  }
  g.restore();
}
function drawPlate(g, x, y, s, dirty) {
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + s * .02, y + s * .05, s * .36, s * .27, 0, 0, 7); g.fill();
  g.fillStyle = dirty ? '#e8dcc4' : '#fdfbf6'; g.beginPath(); g.ellipse(x, y, s * .36, s * .27, 0, 0, 7); g.fill();
  g.strokeStyle = dirty ? '#8a7a5a' : '#3b6ea8'; g.lineWidth = Math.max(1, s * .03); g.beginPath(); g.ellipse(x, y, s * .29, s * .21, 0, 0, 7); g.stroke();
  if (dirty) { g.fillStyle = 'rgba(120,80,30,.45)'; for (const [a, b, r] of [[-.1, -.05, .06], [.12, .04, .05], [0, .1, .04]]) { D.circle(g, x + a * s, y + b * s, r * s); g.fill(); } }
}
function drawExt(g, x, y, s) {
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y + s * .28, s * .16, s * .06, 0, 0, 7); g.fill();
  const gr = g.createLinearGradient(x - s * .13, 0, x + s * .13, 0); gr.addColorStop(0, '#e2463a'); gr.addColorStop(.4, '#ff6b5c'); gr.addColorStop(1, '#a3241b');
  g.fillStyle = gr; D.rr(g, x - s * .13, y - s * .2, s * .26, s * .48, s * .1); g.fill();
  g.fillStyle = '#fbe9d0'; g.fillRect(x - s * .13, y, s * .26, s * .08);
  g.fillStyle = '#333'; g.fillRect(x - s * .05, y - s * .3, s * .1, s * .1); g.strokeStyle = '#333'; g.lineWidth = s * .05; g.beginPath(); g.moveTo(x + s * .04, y - s * .26); g.quadraticCurveTo(x + s * .25, y - s * .3, x + s * .2, y - s * .05); g.stroke();
}
function drawItem(g, x, y, s, it) {
  if (!it) return;
  if (it.k === 'i') drawIng(g, x, y, s, it.t, it.c);
  else if (it.k === 'p') { drawPlate(g, x, y, s, it.x); if (it.d) drawDish(g, x, y - s * .02, s * .85, it.d); }
  else if (it.k === 'e') drawExt(g, x, y, s);
}
function seal(g, x, y, s, ch, col) { g.fillStyle = col || '#b23a2b'; D.rr(g, x - s / 2, y - s / 2, s, s, s * .2); g.fill(); D.text(g, ch, x, y + s * .04, {size: s * .72, color: '#fff3e0', font: 'serif', weight: 900}); }
function drawFlames(g, x, y, s, t) {
  for (let k = 0; k < 5; k++) {
    const a = (k - 2) * s * .14, hgt = s * (.45 + .2 * Math.sin(t * 9 + k * 1.7));
    const gr = g.createLinearGradient(0, y, 0, y - hgt); gr.addColorStop(0, '#ff3d1f'); gr.addColorStop(.5, '#ff9a1f'); gr.addColorStop(1, 'rgba(255,230,120,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + a - s * .12, y); g.quadraticCurveTo(x + a - s * .1, y - hgt * .6, x + a + Math.sin(t * 7 + k) * s * .06, y - hgt); g.quadraticCurveTo(x + a + s * .1, y - hgt * .6, x + a + s * .12, y); g.fill();
  }
}
function drawChef(g, x, y, s, col, fx, fy, phase, moving, pop, held, num) {
  const back = fy < -.5 && Math.abs(fy) > Math.abs(fx);
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x, y, s * .3, s * .1, 0, 0, 7); g.fill();
  const bob = moving ? -Math.abs(Math.sin(phase)) * s * .07 : Math.sin(phase * .5) * s * .01;
  const sq = (moving ? Math.sin(phase * 2) * .06 : 0) + pop * .18;
  g.save(); g.translate(x, y + bob); g.scale(1 + sq, 1 - sq);
  const hx = fx * s * .26, hy = -s * .28 + fy * s * .08;
  const drawHeld = () => { if (held) { g.save(); g.translate(hx, hy); drawItem(g, 0, 0, s * .62, held); g.restore(); } };
  if (back) drawHeld();
  // body (chef coat + apron)
  g.fillStyle = '#fffaf0'; g.beginPath(); g.ellipse(0, -s * .2, s * .26, s * .24, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,50,30,.35)'; g.lineWidth = Math.max(1, s * .025); g.stroke();
  g.save(); g.beginPath(); g.ellipse(0, -s * .2, s * .26, s * .24, 0, 0, 7); g.clip(); g.fillStyle = col; g.fillRect(-s * .3, -s * .14, s * .6, s * .3); g.restore();
  // hands
  g.fillStyle = '#f6d3b0'; for (const sgn of [-1, 1]) { D.circle(g, sgn * s * .24 + fx * s * .08, -s * .22 + fy * s * .04, s * .065); g.fill(); }
  // head
  const hy0 = -s * .55;
  g.fillStyle = '#f6d3b0'; D.circle(g, 0, hy0, s * .21); g.fill(); g.strokeStyle = 'rgba(120,70,40,.35)'; g.stroke();
  if (!back) {
    const ex = fx * s * .06, ey = Math.max(0, fy) * s * .03;
    g.fillStyle = '#2b2118'; for (const sgn of [-1, 1]) { g.beginPath(); g.ellipse(ex + sgn * s * .075, hy0 + ey + s * .01, s * .025, s * .035, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(240,120,110,.45)'; for (const sgn of [-1, 1]) { D.circle(g, ex + sgn * s * .13, hy0 + ey + s * .07, s * .035); g.fill(); }
    g.strokeStyle = '#7a3a22'; g.lineWidth = Math.max(1, s * .02); g.beginPath(); g.arc(ex, hy0 + ey + s * .06, s * .03, .2, Math.PI - .2); g.stroke();
  }
  // chef hat
  g.fillStyle = '#fffdf8'; g.strokeStyle = 'rgba(80,60,40,.3)';
  D.rr(g, -s * .15, hy0 - s * .27, s * .3, s * .12, s * .03); g.fill(); g.stroke();
  for (const [a, b, r] of [[-.1, -.4, .1], [.1, -.4, .1], [0, -.45, .12]]) { D.circle(g, a * s, hy0 + (b + .02) * s, r * s); g.fill(); }
  g.fillStyle = col; g.fillRect(-s * .15, hy0 - s * .19, s * .3, s * .035);
  if (!back) drawHeld();
  g.restore();
  // seat badge
  const by = y + bob - s * 1.12;
  g.fillStyle = col; D.rr(g, x - s * .14, by - s * .1, s * .28, s * .2, s * .08); g.fill();
  g.beginPath(); g.moveTo(x - s * .05, by + s * .09); g.lineTo(x + s * .05, by + s * .09); g.lineTo(x, by + s * .15); g.fill();
  D.text(g, num, x, by + s * .005, {size: s * .15, color: '#fff', weight: 800});
}

BX.register({
  id: 'kitchen', title: '双人厨房', cat: 'coop', order: 1, sub: '切菜下锅，合作出餐',
  desc: '茶馆后厨忙翻天！两位厨师分工备料、切菜、蒸煮炒、装盘上菜和洗碗，在订单超时前把点心送出窗口。三个关卡，越来越忙。',
  kind: 'realtime', seats: 2, coop: true, noFirst: true, seatNames: ['红围裙', '蓝围裙'], seatColors: PAL,
  options: [{key: 'lv', label: '关卡', choices: [[1, '一 · 茶馆后厨'], [2, '二 · 点心铺'], [3, '三 · 年夜大席']], def: 1}],
  rules: `<p><b>目标：</b>两位厨师合作，在 <b>3 分钟</b>营业时间内按订单做菜送出窗口赚金币。达到 1 星即过关，金币越多星越多（最多 3 星）。</p>
<p><b>菜谱：</b></p>
<ul>
<li>青菜汤 = 菜丁 → 汤锅</li>
<li>炒饭 = 大米 + 菜丁 → 炒锅</li>
<li>小笼包 = 面皮 + 肉馅 → 蒸笼</li>
<li>虾饺 = 面皮 + 虾仁 → 蒸笼</li>
<li>拉面 = 面皮 + 肉馅 → 汤锅</li>
</ul>
<p><b>流程：</b>从食材箱拿食材 → 放到砧板上<b>按住「使用」切好</b>（大米不用切）→ 放进对应的锅里，凑齐后自动开始烹饪 → 拿一个<b>干净盘子</b>对着做好的锅装盘 → 送到<b>出菜窗口</b>。</p>
<p><b>订单：</b>上方的订单票会倒计时，越快送出小费越多；超时会扣 10 金币。</p>
<p><b>起火：</b>菜做好后要尽快装盘，锅边出现红色「！」说明快糊了，放太久会<b>起火</b>。拿起红色灭火器，对着着火的锅按住「使用」扑灭。</p>
<p><b>洗碗：</b>送出的菜过一会儿会在回收口变成脏盘子，把它放进水槽，按住「使用」洗干净，盘子会回到盘架。</p>
<p><b>关卡：</b>一 · 茶馆后厨（三道菜）；二 · 点心铺（厨房被长案隔开，可以隔案递食材）；三 · 年夜大席（五道菜、火候更急、地上有水渍会打滑）。</p>
<p><b>操作：</b>任何柜台都能放一样东西。<br>键盘单人：WASD / 方向键移动，<b>空格 / E</b> 拿起·放下，<b>Q / Shift</b> 使用（切菜、洗碗、灭火，需按住）。<br>同屏双人：左边 WASD + <b>E</b> 拿放 + <b>Q</b> 使用；右边 方向键 + <b>.</b> 拿放 + <b>/</b> 使用。<br>触屏：左侧摇杆移动，右侧「拿/放」「使用」按钮；同屏双人时两人各用自己那半边的摇杆和按钮。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0d7a8'); gr.addColorStop(1, '#d9b077'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = h / 5;
    for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) { g.fillStyle = 'rgba(160,100,50,.16)'; g.fillRect(x * s, y * s, s, s); }
    D.wood(g, 0, 0, w, s * 1.25, {base: '#b07a45', seed: 4}); g.fillStyle = '#6b4426'; g.fillRect(0, s * 1.25, w, s * .22);
    // steamer with steam
    g.fillStyle = '#c99a5a'; g.beginPath(); g.ellipse(w * .2, s * .62, s * .55, s * .4, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5f2c'; g.lineWidth = 2; g.stroke();
    for (const k of [-1, 0, 1]) { g.strokeStyle = 'rgba(138,95,44,.7)'; g.beginPath(); g.moveTo(w * .2 - s * .45, s * .62 + k * s * .12); g.lineTo(w * .2 + s * .45, s * .62 + k * s * .12); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.75)'; for (const [a, b, r] of [[.17, .1, .13], [.22, -.05, .1], [.26, .02, .08]]) { D.circle(g, w * a, s * b + s * .1, s * r * 1.6); g.fill(); }
    // pot
    g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(w * .5, s * .62, s * .5, s * .38, 0, 0, 7); g.fill(); g.fillStyle = '#8cc152'; g.beginPath(); g.ellipse(w * .5, s * .58, s * .38, s * .26, 0, 0, 7); g.fill();
    // ticket
    g.save(); g.translate(w * .8, s * .75); g.rotate(.12); g.fillStyle = '#fffaf0'; D.rr(g, -s * .65, -s * .55, s * 1.3, s * 1.2, 5); g.fill(); g.fillStyle = '#b23a2b'; g.fillRect(-s * .65, -s * .55, s * 1.3, s * .2); drawDish(g, 0, s * .12, s * 1.1, 'xlb'); g.restore();
    // chefs
    drawChef(g, w * .32, h * .9, s * 1.5, PAL[0], .6, .3, 1, false, 0, {k: 'p', d: 'xlb'}, '1');
    drawChef(g, w * .7, h * .92, s * 1.5, PAL[1], -.6, .3, 2, false, 0, {k: 'i', t: 'veg'}, '2');
  },
  create(ctx) {
    const lv = LEVELS[ctx.opts.lv] ? +ctx.opts.lv : 1, LV = LEVELS[lv];
    const MAP = LV.map.join('');
    const typ = i => MAP[i];
    const solidT = (c, r) => c < 0 || r < 0 || c >= GW || r >= GH || (MAP[r * GW + c] !== '.' && MAP[r * GW + c] !== '~');
    const tilesOf = chs => { const o = []; for (let i = 0; i < MAP.length; i++) if (chs.includes(MAP[i])) o.push(i); return o; };
    const pat = TEST ? 45 : LV.pat, gap = TEST ? 7 : LV.gap, grace = TEST ? 9 : LV.grace;
    const stars = TEST ? [20, 60, 120] : LV.stars;
    const st = {lv, ph: 'ready', t: READY, left: LV_TIME, coins: 0, served: 0, failed: 0, orders: [], oid: 0, nextO: 1.2, P: [], it: {}, stn: {}, rack: LV.plates, dret: 0, sink: {n: 0, p: 0}, pend: [], ev: [], evId: 0, over: false, star: 0};
    for (const i of tilesOf('E')) st.it[i] = {k: 'e'};
    for (const i of tilesOf('TWP')) st.stn[i] = {c: [], s: 0, p: 0, r: null, e: 0};
    LV.spawn.forEach(([c, r], k) => st.P.push({x: c + .5, y: r + .5, vx: 0, vy: 0, fx: 0, fy: 1, h: null, mv: 0, act: '', i: k}));
    const hatch = tilesOf('H')[0], rackT = tilesOf('L')[0], dretT = tilesOf('D')[0], sinkT = tilesOf('K')[0];
    const lastA = [0, 0];

    /* ================= simulation (host) ================= */
    const fx = (k, o) => { st.ev.push(Object.assign({k, id: ++st.evId}, o || {})); if (st.ev.length > 12) st.ev.shift(); };
    const tileOf = p => Math.floor(p.y) * GW + Math.floor(p.x);
    function front(p) {
      const ax = Math.abs(p.fx) >= Math.abs(p.fy), dx = ax ? Math.sign(p.fx) : 0, dy = ax ? 0 : Math.sign(p.fy);
      const c = Math.floor(p.x) + dx, r = Math.floor(p.y) + dy;
      return c < 0 || r < 0 || c >= GW || r >= GH ? -1 : r * GW + c;
    }
    function collide(p) {
      const c0 = Math.floor(p.x), r0 = Math.floor(p.y);
      for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (!solidT(c, r)) continue;
        const cx = BX.clamp(p.x, c, c + 1), cy = BX.clamp(p.y, r, r + 1), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
        if (d < PR) {
          if (d > 1e-6) { p.x = cx + dx / d * PR; p.y = cy + dy / d * PR; const vn = p.vx * dx / d + p.vy * dy / d; if (vn < 0) { p.vx -= vn * dx / d; p.vy -= vn * dy / d; } }
          else { p.y = r - PR; }
        }
      }
      p.x = BX.clamp(p.x, PR, GW - PR); p.y = BX.clamp(p.y, PR, GH - PR);
    }
    function moveP(p, inp, dt) {
      let mx = +inp.mx || 0, my = +inp.my || 0; const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
      const wet = MAP[tileOf(p)] === '~', sp = 4.4, acc = wet ? 4.5 : 22;
      p.vx += (mx * sp - p.vx) * Math.min(1, acc * dt); p.vy += (my * sp - p.vy) * Math.min(1, acc * dt);
      if (l > .25) { p.fx = Math.round(mx / Math.max(l, 1e-6) * 100) / 100; p.fy = Math.round(my / Math.max(l, 1e-6) * 100) / 100; }
      p.x += p.vx * dt; p.y += p.vy * dt; collide(p);
      p.mv = Math.hypot(p.vx, p.vy) > .5 ? 1 : 0;
    }
    function accepts(i, t) {
      const s = st.stn[i]; if (!s || s.s !== 0) return false;
      const tp = STN[typ(i)], nc = s.c.concat([t]);
      return LV.rec.some(r => REC[r].st === tp && subMulti(nc, REC[r].ing));
    }
    function completeRec(i) { const s = st.stn[i], tp = STN[typ(i)]; return LV.rec.find(r => REC[r].st === tp && s.c.length === REC[r].ing.length && subMulti(s.c, REC[r].ing)) || null; }
    function interact(k) {
      const p = st.P[k], f = front(p); if (f < 0) return;
      const ch = typ(f), H = p.h, at = {s: k, i: f};
      const err = () => fx('err', at);
      if (CRATE[ch]) {
        if (!H) { p.h = {k: 'i', t: CRATE[ch], c: 0}; fx('pick', at); }
        else if (H.k === 'i' && H.t === CRATE[ch] && !H.c) { p.h = null; fx('place', at); }
        else err();
        return;
      }
      if (STN[ch]) {
        const s = st.stn[f];
        if (H && H.k === 'i' && prepared(H) && accepts(f, H.t)) {
          s.c.push(H.t); p.h = null; fx('drop', at);
          const r = completeRec(f); if (r) { s.r = r; s.s = 1; s.p = 0; }
        } else if (H && H.k === 'p' && !H.x && !H.d && s.s === 2) { H.d = s.r; s.c = []; s.r = null; s.s = 0; s.p = 0; fx('plate', at); }
        else err();
        return;
      }
      if (ch === 'L') {
        if (!H && st.rack > 0) { st.rack--; p.h = {k: 'p', d: null, x: 0}; fx('pick', at); }
        else if (H && H.k === 'p' && !H.x && !H.d) { st.rack++; p.h = null; fx('place', at); }
        else err();
        return;
      }
      if (ch === 'H') {
        if (H && H.k === 'p' && H.d) {
          let best = -1; st.orders.forEach((o, j) => { if (o.r === H.d && (best < 0 || o.p < st.orders[best].p)) best = j; });
          if (best < 0) { err(); return; }
          const o = st.orders[best], tip = Math.round(10 * o.p / o.pm), gain = REC[o.r].v + tip;
          st.coins += gain; st.served++; st.orders.splice(best, 1); p.h = null; st.pend.push(RET_T);
          fx('serve', {s: k, i: f, o: o.id, g: gain});
        } else err();
        return;
      }
      if (ch === 'D') { if (!H && st.dret > 0) { st.dret--; p.h = {k: 'p', d: null, x: 1}; fx('pick', at); } else err(); return; }
      if (ch === 'K') { if (H && H.k === 'p' && H.x) { st.sink.n++; p.h = null; fx('drop', at); } else err(); return; }
      if (ch === 'X') {
        if (H && H.k === 'i') { p.h = null; fx('trash', at); }
        else if (H && H.k === 'p' && H.d) { H.d = null; fx('trash', at); }
        else err();
        return;
      }
      if (ch === '#' || ch === 'C' || ch === 'E') {
        const it = st.it[f];
        if (H && !it) { if (ch === 'C' && H.k !== 'i') { err(); return; } st.it[f] = H; p.h = null; fx('place', at); }
        else if (!H && it) { p.h = it; delete st.it[f]; fx('pick', at); }
        else if (H && it && H.k === 'p' && !H.x && !H.d && it.k === 'p' && it.d) { H.d = it.d; it.d = null; fx('plate', at); }   // move a dish onto your clean plate
        else err();
      }
    }
    function use(k, dt) {
      const p = st.P[k], f = front(p); p.act = '';
      if (p.h && p.h.k === 'e') {
        p.act = 'ext';
        const s = f >= 0 && st.stn[f];
        if (s && s.s === 3) { s.e += dt / EXT_T; if (s.e >= 1) { s.s = 0; s.c = []; s.r = null; s.p = 0; s.e = 0; fx('out', {s: k, i: f}); } }
        return;
      }
      if (f < 0 || p.h) return;
      const ch = typ(f);
      if (ch === 'C') { const it = st.it[f]; if (it && it.k === 'i' && ING[it.t].chop && !it.c) { p.act = 'chop'; it.cp = (it.cp || 0) + dt / CHOP_T; if (it.cp >= 1) { it.c = 1; delete it.cp; fx('chopped', {s: k, i: f}); } } }
      else if (ch === 'K' && st.sink.n > 0) { p.act = 'wash'; st.sink.p += dt / WASH_T; if (st.sink.p >= 1) { st.sink.p = 0; st.sink.n--; st.rack++; fx('washed', {s: k, i: f}); } }
    }
    function newOrder() {
      let r;
      if (st.oid === 0) r = LV.rec[0];
      else { const pool = LV.rec.filter(x => st.orders.filter(o => o.r === x).length < 2); r = BX.pick(pool.length ? pool : LV.rec); }
      const pm = pat + (REC[r].ing.length - 1) * 10;
      st.orders.push({id: ++st.oid, r, p: pm, pm}); fx('order');
    }
    function finishLevel() {
      st.over = true; st.ph = 'end';
      st.star = stars.filter(v => st.coins >= v).length;
      fx('end');
      if (!TEST) { const k = 'stars' + lv, old = ctx.load(k, 0); if (st.star > old) ctx.save(k, st.star); }
      const sr = '★'.repeat(st.star) + '☆'.repeat(3 - st.star);
      ctx.end({win: st.star >= 1, title: st.star >= 1 ? '打烊啦 · ' + sr : '生意冷清', text: `第${lv}关「${LV.name}」 ${sr}　金币 ${st.coins}（1 星需 ${stars[0]}）　出餐 ${st.served} 份，超时 ${st.failed} 单`, delay: 1400});
    }
    function step(dt, inputs) {
      if (st.over) return;
      st.P.forEach((p, k) => {
        const inp = inputs[k] || {};
        moveP(p, inp, dt);
        const a = inp.a | 0;
        if (a !== lastA[k]) { lastA[k] = a; if (st.ph === 'play') interact(k); }
        if (inp.u && st.ph === 'play') use(k, dt); else p.act = '';
      });
      if (st.ph === 'ready') { st.t -= dt; if (st.t <= 0) { st.ph = 'play'; fx('go'); } return; }
      st.left -= dt;
      for (const i in st.stn) {
        const s = st.stn[i];
        if (s.s === 1) { s.p += dt / cookT(s.r); if (s.p >= 1) { s.s = 2; s.p = 0; fx('ding', {i: +i}); } }
        else if (s.s === 2) { s.p += dt / grace; if (s.p >= 1) { s.s = 3; s.p = 0; s.c = []; s.r = null; s.e = 0; fx('fire', {i: +i}); } }
        else if (s.s === 3) s.e = Math.max(0, s.e - dt * .3);
      }
      for (let j = st.orders.length - 1; j >= 0; j--) {
        const o = st.orders[j]; o.p -= dt;
        if (o.p <= 0) { st.orders.splice(j, 1); st.coins = Math.max(0, st.coins - 10); st.failed++; fx('fail', {o: o.id}); }
      }
      st.nextO -= dt;
      if (!st.orders.length && st.nextO > 2) st.nextO = 2;
      if (st.nextO <= 0) { if (st.orders.length < 4) newOrder(); st.nextO = gap; }
      for (let j = st.pend.length - 1; j >= 0; j--) { st.pend[j] -= dt; if (st.pend[j] <= 0) { st.pend.splice(j, 1); st.dret++; fx('dirty'); } }
      if (st.left <= 0) { st.left = 0; finishLevel(); }
    }

    /* ================= AI partner ================= */
    const aiM = [{}, {}];
    const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function bfs(p) {
      const dist = new Array(GW * GH).fill(Infinity), prev = new Array(GW * GH).fill(-1);
      let s = tileOf(p); if (solidT(s % GW, Math.floor(s / GW))) return {dist, prev};
      dist[s] = 0; const q = [s];
      for (let h = 0; h < q.length; h++) {
        const u = q[h], c = u % GW, r = (u - c) / GW;
        for (const [dx, dy] of NB) { const nc = c + dx, nr = r + dy; if (solidT(nc, nr)) continue; const v = nr * GW + nc; if (dist[v] === Infinity) { dist[v] = dist[u] + 1; prev[v] = u; q.push(v); } }
      }
      return {dist, prev};
    }
    function approach(B, T) { let best = -1, bd = Infinity; const c = T % GW, r = (T - c) / GW; for (const [dx, dy] of NB) { const nc = c + dx, nr = r + dy; if (solidT(nc, nr)) continue; const v = nr * GW + nc; if (B.dist[v] < bd) { bd = B.dist[v]; best = v; } } return {n: best, d: bd}; }
    function nearest(B, list, skip) { let best = -1, bd = Infinity; for (const T of list) { if (skip && skip(T)) continue; const a = approach(B, T); if (a.d < bd) { bd = a.d; best = T; } } return best; }
    const otherGoal = (k, T) => st.P.some((q, j) => j !== k && ctx.isBot(j) && aiM[j].goal && aiM[j].goal.i === T);
    const otherJob = (k, job) => st.P.filter((q, j) => j !== k && ctx.isBot(j) && aiM[j].job === job).length;
    function plan() {
      /* assign each station a target recipe from outstanding orders; return per-station missing ingredients */
      const need = st.orders.slice().sort((a, b) => a.p - b.p).map(o => o.r);
      const take = r => { const j = need.indexOf(r); if (j >= 0) { need.splice(j, 1); return true; } return false; };
      for (const i in st.stn) { const s = st.stn[i]; if (s.s === 1 || s.s === 2) take(s.r); }
      for (const p of st.P) if (p.h && p.h.k === 'p' && p.h.d) take(p.h.d);
      for (const i in st.it) { const it = st.it[i]; if (it.k === 'p' && it.d) take(it.d); }
      const tgt = {};
      for (const i in st.stn) { const s = st.stn[i]; if (s.s !== 0 || !s.c.length) continue; const tp = STN[typ(+i)]; const cands = LV.rec.filter(r => REC[r].st === tp && subMulti(s.c, REC[r].ing)); const r = cands.find(x => need.includes(x)) || cands[0]; if (r) { take(r); tgt[i] = r; } }
      for (const r of need.slice()) {
        let free = null; for (const i in st.stn) { const s = st.stn[i]; if (s.s === 0 && !s.c.length && !tgt[i] && STN[typ(+i)] === REC[r].st) { free = i; break; } }
        if (free != null) { tgt[free] = r; take(r); }
      }
      const miss = {};
      for (const i in tgt) miss[i] = minus(REC[tgt[i]].ing, st.stn[i].c);
      return {tgt, miss};
    }
    function decide(k) {
      const p = st.P[k], H = p.h, m = aiM[k], B = bfs(p);
      m.job = '';
      const G = (i, act, job) => { m.job = job || ''; return i >= 0 ? {i, act} : null; };
      const fires = Object.keys(st.stn).filter(i => st.stn[i].s === 3).map(Number);
      const extAt = Object.keys(st.it).filter(i => st.it[i].k === 'e').map(Number);
      const pl = plan();
      // in-flight ingredients reduce what is still missing
      const missing = {}; for (const i in pl.miss) missing[i] = pl.miss[i].slice();
      const consume = (t, pref) => { if (pref != null && missing[pref] && missing[pref].includes(t)) { missing[pref].splice(missing[pref].indexOf(t), 1); return; } for (const i in missing) { const j = missing[i].indexOf(t); if (j >= 0) { missing[i].splice(j, 1); return; } } };
      st.P.forEach((q, j) => { if (j === k) return; if (q.h && q.h.k === 'i') consume(q.h.t, ctx.isBot(j) && aiM[j].claim ? aiM[j].claim.st : null); else if (!q.h && ctx.isBot(j) && aiM[j].claim) consume(aiM[j].claim.t, aiM[j].claim.st); });
      for (const i in st.it) { const it = st.it[i]; if (it.k === 'i') consume(it.t, null); }
      const ordersWant = r => st.orders.some(o => o.r === r);
      if (H) {
        if (H.k === 'e') {
          if (fires.length) return G(nearest(B, fires), 'u', 'fire');
          const home = tilesOf('E').filter(i => !st.it[i]); return G(nearest(B, home.length ? home : tilesOf('#').filter(i => !st.it[i])), 'a', 'ext');
        }
        if (H.k === 'p') {
          if (H.x) return G(sinkT, 'a', 'dish');
          if (H.d) return ordersWant(H.d) ? G(hatch, 'a', 'serve') : G(nearest(B, tilesOf('X')), 'a', 'serve');
          const done = Object.keys(st.stn).map(Number).filter(i => st.stn[i].s === 2);
          if (done.length) return G(nearest(B, done), 'a', 'plate');
          const cooking = Object.keys(st.stn).map(Number).filter(i => st.stn[i].s === 1);
          if (cooking.length) return G(nearest(B, cooking), 'w', 'plate');
          return G(rackT, 'a', '');
        }
        if (H.k === 'i') {
          if (!prepared(H)) {
            const boards = tilesOf('C').filter(i => !st.it[i]);
            if (boards.length) return G(nearest(B, boards, i => otherGoal(k, i)) >= 0 ? nearest(B, boards, i => otherGoal(k, i)) : nearest(B, boards), 'a', 'prep');
            return G(nearest(B, tilesOf('#').filter(i => !st.it[i])), 'a', 'park');
          }
          // prepared: claimed station → any station whose plan misses it → any accepting partial station → park
          if (m.claim && accepts(m.claim.st, H.t) && pl.miss[m.claim.st] && pl.miss[m.claim.st].includes(H.t)) return G(m.claim.st, 'a', 'fill');
          const want = Object.keys(pl.miss).map(Number).filter(i => pl.miss[i].includes(H.t) && accepts(i, H.t));
          if (want.length) return G(nearest(B, want), 'a', 'fill');
          const part = Object.keys(st.stn).map(Number).filter(i => st.stn[i].c.length && accepts(i, H.t));
          if (part.length) return G(nearest(B, part), 'a', 'fill');
          const usable = LV.rec.some(r => REC[r].ing.includes(H.t) && ordersWant(r));
          if (!usable) return G(nearest(B, tilesOf('X')), 'a', 'trash');
          return G(nearest(B, tilesOf('#').filter(i => !st.it[i])), 'a', 'park');
        }
      }
      // ---- empty hands ----
      if (fires.length && !otherJob(k, 'fire')) {
        const ex = st.P.find(q => q.h && q.h.k === 'e');
        if (!ex && extAt.length) return G(nearest(B, extAt), 'a', 'fire');
      }
      const done = Object.keys(st.stn).map(Number).filter(i => st.stn[i].s === 2);
      const soon = Object.keys(st.stn).map(Number).filter(i => st.stn[i].s === 1 && st.stn[i].p > .45);
      const plateHolders = st.P.filter((q, j) => j !== k && q.h && q.h.k === 'p' && !q.h.x && !q.h.d).length + otherJob(k, 'plate');
      if ((done.length + soon.length) > plateHolders) {
        if (st.rack > 0) return G(rackT, 'a', 'plate');
        if (st.sink.n > 0) return G(sinkT, 'u', 'plate');
        if (st.dret > 0) return G(dretT, 'a', 'plate');
        const loose = Object.keys(st.it).map(Number).filter(i => st.it[i].k === 'p' && !st.it[i].x && !st.it[i].d);
        if (loose.length) return G(nearest(B, loose), 'a', 'plate');
      }
      // dishes lying on counters → serve
      const dishes = Object.keys(st.it).map(Number).filter(i => st.it[i].k === 'p' && st.it[i].d && ordersWant(st.it[i].d));
      if (dishes.length) return G(nearest(B, dishes, i => otherGoal(k, i)), 'a', 'serve');
      // chopping boards: chop raw items, collect chopped ones
      const raw = tilesOf('C').filter(i => st.it[i] && st.it[i].k === 'i' && !prepared(st.it[i]));
      if (raw.length) { const t = nearest(B, raw); if (t >= 0) return G(t, 'u', 'prep'); }
      const chopped = tilesOf('C').filter(i => st.it[i] && prepared(st.it[i]));
      const pickable = chopped.concat(tilesOf('#').filter(i => st.it[i] && st.it[i].k === 'i' && prepared(st.it[i]) && Object.keys(pl.miss).some(s => pl.miss[s].includes(st.it[i].t) && accepts(+s, st.it[i].t))));
      if (pickable.length) { const t = nearest(B, pickable, i => otherGoal(k, i)); if (t >= 0) return G(t, 'a', 'fill'); }
      // raw items parked on counters
      const parked = tilesOf('#').filter(i => st.it[i] && st.it[i].k === 'i' && !prepared(st.it[i]));
      if (parked.length && tilesOf('C').some(i => !st.it[i])) { const t = nearest(B, parked, i => otherGoal(k, i)); if (t >= 0) return G(t, 'a', 'prep'); }
      // keep plates flowing
      if (st.rack === 0 && (st.sink.n > 0 || st.dret > 0) && !otherJob(k, 'dish')) return st.sink.n > 0 ? G(sinkT, 'u', 'dish') : G(dretT, 'a', 'dish');
      // fetch a missing ingredient (keep previous claim when still valid)
      if (m.claim && missing[m.claim.st] !== undefined && pl.miss[m.claim.st] && pl.miss[m.claim.st].includes(m.claim.t)) {
        // my claim is in-flight; make sure no one else covered it already
        if (missing[m.claim.st].includes(m.claim.t)) { const crate = nearest(B, tilesOf(Object.keys(CRATE).filter(c => CRATE[c] === m.claim.t))); m.job = 'fetch'; return {i: crate, act: 'a'}; }
      }
      m.claim = null;
      const order = Object.keys(missing).map(Number).sort((a, b) => (st.stn[b].c.length - st.stn[a].c.length));
      for (const i of order) for (const t of missing[i]) {
        const crates = tilesOf(Object.keys(CRATE).filter(c => CRATE[c] === t)); if (!crates.length) continue;
        m.claim = {st: i, t}; m.job = 'fetch'; return {i: nearest(B, crates), act: 'a'};
      }
      if ((st.sink.n > 0 || st.dret > 0) && st.rack < 3 && !otherJob(k, 'dish')) return st.sink.n > 0 ? G(sinkT, 'u', 'dish') : G(dretT, 'a', 'dish');
      return null;
    }
    function aiInput(seat) {
      const m = aiM[seat], p = st.P[seat];
      m.a = m.a || 0; m.cd = (m.cd || 0) - 1 / 60;
      const out = {mx: 0, my: 0, a: m.a, u: false};
      if (st.over) return out;
      let g = st.ph === 'play' ? decide(seat) : null;
      if (g && g.i < 0) g = null;
      if (g && p.h && p.h.k === 'i' && m.claim && g.act === 'a' && (g.i === m.claim.st)) { /* delivering claim */ }
      if (!p.h && m.job !== 'fetch' && m.claim && !(g && m.job === 'fill')) { /* keep claim only while fetching/holding */ }
      if (p.h && p.h.k === 'i' && !m.claim) { /* adopt: nothing */ }
      m.goal = g;
      const B = bfs(p);
      let T = g ? g.i : -1, dest;
      if (T < 0) { const [c, r] = LV.spawn[seat]; dest = r * GW + c; } else dest = approach(B, T).n;
      if (dest < 0) return out;
      // walk along BFS path
      const cur = tileOf(p);
      let nxt = dest;
      if (B.dist[dest] === Infinity) return out;
      while (B.prev[nxt] !== -1 && B.prev[nxt] !== cur) nxt = B.prev[nxt];
      if (cur === dest) nxt = dest;
      const tx = nxt % GW + .5, ty = Math.floor(nxt / GW) + .5, dx = tx - p.x, dy = ty - p.y, dd = Math.hypot(dx, dy);
      if (cur !== dest || dd > .3) { out.mx = dx / Math.max(dd, .3); out.my = dy / Math.max(dd, .3); if (!m.stk) m.stk = {x: p.x, y: p.y, t: 0}; return out; }
      if (T < 0) return out;
      // at the spot: face the target
      const fx2 = T % GW + .5 - p.x, fy2 = Math.floor(T / GW) + .5 - p.y, fl = Math.hypot(fx2, fy2);
      if (front(p) !== T) { out.mx = fx2 / fl * .6; out.my = fy2 / fl * .6; return out; }
      out.mx = fx2 / fl * .05; out.my = fy2 / fl * .05;
      if (g.act === 'a' && m.cd <= 0) { m.a++; m.cd = .2; out.a = m.a; if (!p.h && m.job === 'fetch') { /* claim persists while holding */ } }
      else if (g.act === 'u') out.u = true;
      return out;
    }

    /* ================= view / layout ================= */
    const cv = ctx.canvas();
    let sawTouch = false;
    const showTouch = () => sawTouch || BX.TOUCH.matches;
    const nLoc = () => Math.max(1, ctx.mySeats.length);
    function layout() {
      const w = cv.w, h = cv.h, touch = showTouch(), two = nLoc() >= 2 && touch;
      const portrait = h > w * 1.08;
      const L = {portrait, touch, ctrls: []};
      if (portrait) {
        const ch = touch ? BX.clamp(h * .2, 140, 200) : 30;
        const top = two ? ch : 0;
        const tkH = BX.clamp(w * .22, 70, 110);
        const availH = h - ch - top - tkH - 10, ts = Math.min((w - 12) / GW, availH / GH);
        L.ts = ts; L.ox = (w - ts * GW) / 2; L.oy = top + tkH + 6 + Math.max(0, (availH - ts * GH) / 2);
        L.tk = {x: 6, y: top + 4, w: w - 12 - 72, h: tkH - 8}; L.pill = {x: w - 72, y: top + 4, w: 66, h: tkH - 8, vert: true};
        if (touch) {
          const mk = (y0, slot) => ({slot, zone: {x: 0, y: y0, w: w * .55, h: ch}, bx: w * .24, by: y0 + ch / 2, R: Math.min(56, ch * .34),
            A: {x: w * .84, y: y0 + ch * .42, r: Math.min(40, ch * .25)}, U: {x: w * .62, y: y0 + ch * .6, r: Math.min(33, ch * .21)}});
          L.ctrls.push(mk(h - ch, 0)); if (two) L.ctrls.push(mk(0, 1));
        } else L.hint = {x: w / 2, y: h - 15};
      } else {
        const side = touch ? BX.clamp(w * .19, 120, 230) : 0;
        const tkH = BX.clamp(h * .17, 58, 100), hint = touch ? 0 : 26;
        const aw = w - side * 2 - 8, ah = h - tkH - hint - 8, ts = Math.min(aw / GW, ah / GH);
        L.ts = ts; L.ox = side + (w - side * 2 - ts * GW) / 2; L.oy = tkH + 4 + (ah - ts * GH) / 2;
        if (touch) { L.tk = {x: side + 4, y: 4, w: w - side * 2 - 8, h: tkH - 8}; L.pill = {x: 6, y: 6, w: side - 12, h: 40, split: w - side + 6}; }
        else { L.tk = {x: L.ox, y: 4, w: Math.max(200, ts * GW - 170), h: tkH - 8}; L.pill = {x: L.ox + ts * GW - 160, y: 6, w: 160, h: tkH - 12}; }
        if (touch) {
          const R = Math.min(60, side * .33);
          if (!two) {
            L.ctrls.push({slot: 0, zone: {x: 0, y: 50, w: side + (w - 2 * side) * .15, h: h - 50}, bx: side / 2, by: h - R - 22, R,
              A: {x: w - side * .38, y: h - 70, r: Math.min(44, side * .25)}, U: {x: w - side * .74, y: h - 44, r: Math.min(36, side * .2)}});
          } else {
            for (const slot of [0, 1]) {
              const x0 = slot ? w - side : 0;
              L.ctrls.push({slot, zone: {x: x0, y: h * .55, w: side, h: h * .45}, bx: x0 + side / 2, by: h - R - 16, R: Math.min(R, h * .14),
                A: {x: x0 + side * (slot ? .3 : .7), y: h * .34, r: Math.min(36, side * .21)}, U: {x: x0 + side * (slot ? .72 : .28), y: h * .42, r: Math.min(30, side * .18)}});
            }
          }
        } else L.hint = {x: w / 2, y: h - 13};
      }
      return L;
    }
    /* ---------- input ---------- */
    const aCount = [0, 0], joy = [{x: 0, y: 0}, {x: 0, y: 0}], ptrs = new Map(), press = [0, 0, 0, 0];
    const A_KEYS = [['KeyE', 'Space', 'KeyJ'], ['Period', 'Enter', 'NumpadEnter', 'Numpad0']], U_KEYS = [['KeyQ', 'KeyF', 'ShiftLeft', 'KeyK'], ['Slash', 'ShiftRight', 'NumpadDecimal']];
    function hitCtrl(pt) {
      const L = layout();
      for (const c of L.ctrls) {
        if (Math.hypot(pt.x - c.A.x, pt.y - c.A.y) < c.A.r * 1.3) return {type: 'A', slot: c.slot};
        if (Math.hypot(pt.x - c.U.x, pt.y - c.U.y) < c.U.r * 1.3) return {type: 'U', slot: c.slot};
      }
      for (const c of L.ctrls) { const z = c.zone; if (pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) return {type: 'J', slot: c.slot, ox: pt.x, oy: pt.y, R: c.R}; }
      return null;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') sawTouch = true;
      if (!showTouch()) return;
      const pt = cv.pos(e), hit = hitCtrl(pt); if (!hit) return;
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
      hit.x = pt.x; hit.y = pt.y; ptrs.set(e.pointerId, hit);
      if (hit.type === 'A') { aCount[hit.slot]++; press[hit.slot * 2] = 1; }
      if (hit.type === 'U') press[hit.slot * 2 + 1] = 1;
      if (hit.type === 'J') joy[hit.slot] = {x: 0, y: 0};
    });
    ctx.on(cv.cv, 'pointermove', e => {
      const t = ptrs.get(e.pointerId); if (!t || t.type !== 'J') return;
      const pt = cv.pos(e); t.x = pt.x; t.y = pt.y;
      let dx = (pt.x - t.ox) / t.R, dy = (pt.y - t.oy) / t.R; const l = Math.hypot(dx, dy);
      if (l > 1) { t.ox = pt.x - dx / l * t.R * 1; t.oy = pt.y - dy / l * t.R * 1; dx /= l; dy /= l; }
      joy[t.slot] = {x: Math.abs(dx) < .15 && Math.abs(dy) < .15 ? 0 : dx, y: Math.abs(dx) < .15 && Math.abs(dy) < .15 ? 0 : dy};
    });
    const up = e => { const t = ptrs.get(e.pointerId); if (t && t.type === 'J') joy[t.slot] = {x: 0, y: 0}; ptrs.delete(e.pointerId); };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    const K = (a, b, c, d) => { const k = ctx.keys; return {x: (k.has(d) ? 1 : 0) - (k.has(c) ? 1 : 0), y: (k.has(b) ? 1 : 0) - (k.has(a) ? 1 : 0)}; };
    function input(seat, slot, nLocal) {
      const wasd = K('KeyW', 'KeyS', 'KeyA', 'KeyD'), arr = K('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
      const kk = nLocal >= 2 ? (slot ? arr : wasd) : {x: wasd.x || arr.x, y: wasd.y || arr.y};
      const sl = nLocal >= 2 ? slot : 0;
      let mx = kk.x, my = kk.y; if (!mx && !my) { mx = joy[sl].x; my = joy[sl].y; }
      const uk = nLocal >= 2 ? U_KEYS[slot] : U_KEYS[0].concat(U_KEYS[1]);
      let u = uk.some(c => ctx.keys.has(c));
      for (const t of ptrs.values()) if (t.type === 'U' && t.slot === sl) u = true;
      return {mx: Math.round(mx * 100) / 100, my: Math.round(my * 100) / 100, a: aCount[sl], u};
    }
    function key(e) {
      if (e.repeat) return;
      const n = ctx.mySeats.length;
      if (n >= 2) { for (const s of [0, 1]) if (A_KEYS[s].includes(e.code)) aCount[s]++; }
      else if (A_KEYS[0].includes(e.code) || A_KEYS[1].includes(e.code)) aCount[0]++;
    }

    /* ================= effects / audio (local) ================= */
    let seenEv = 0, chopSnd = 0, sprSnd = 0, tAll = 0;
    const parts = [], floats = [], tkSeen = new Map(), tkGone = [], pop = [0, 0], disp = st.P.map(p => ({x: p.x, y: p.y, ph: 0}));
    let lastL = null, banner = null;
    const tilePx = (i, L) => [L.ox + (i % GW + .5) * L.ts, L.oy + (Math.floor(i / GW) + .45) * L.ts];
    function burst(x, y, n, col, sp, life, kind) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = sp * (.4 + Math.random()); parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, life: life * (.6 + Math.random() * .6), max: life, col, kind: kind || 'dot', r: 2 + Math.random() * 3}); } }
    function playEv() {
      for (const e of st.ev) {
        if (e.id <= seenEv) continue; seenEv = e.id;
        const L = lastL;
        const at = L && e.i != null ? tilePx(e.i, L) : null;
        if (e.s != null) pop[e.s] = 1;
        switch (e.k) {
          case 'pick': ctx.sfx('pop'); break;
          case 'place': ctx.sfx('place'); break;
          case 'drop': ctx.sfx('splash'); if (at) burst(at[0], at[1], 6, 'rgba(255,255,255,.8)', 60, .5); break;
          case 'plate': ctx.sfx('chip'); if (at) burst(at[0], at[1], 10, '#ffe08a', 90, .6, 'star'); break;
          case 'trash': ctx.sfx('whoosh'); break;
          case 'err': ctx.sfx('error'); break;
          case 'chopped': ctx.sfx('select'); if (at) burst(at[0], at[1], 8, '#9ed36a', 80, .5); break;
          case 'washed': ctx.sfx('splash'); if (at) burst(at[0], at[1], 10, '#bfe6ff', 80, .6, 'star'); break;
          case 'serve': ctx.sfx('coin'); setTimeout(() => ctx.sfx('bell'), 120); if (at) { burst(at[0], at[1], 16, '#ffd34d', 130, .8, 'star'); floats.push({x: at[0], y: at[1] - 10, t: 0, s: '+' + e.g, col: '#ffd34d'}); } tkGone.push({id: e.o, t: 0, ok: true}); break;
          case 'fail': ctx.sfx('buzz'); tkGone.push({id: e.o, t: 0, ok: false}); if (L) floats.push({x: L.tk.x + 40, y: L.tk.y + L.tk.h, t: 0, s: '-10', col: '#ff7b6b'}); break;
          case 'ding': ctx.sfx('bell'); if (at) burst(at[0], at[1] - 10, 8, '#fff6c0', 70, .6, 'star'); break;
          case 'fire': ctx.sfx('boom'); ctx.toast('着火了！快拿灭火器！'); break;
          case 'out': ctx.sfx('swish'); if (at) burst(at[0], at[1], 18, '#f4f4f4', 90, .9); break;
          case 'order': ctx.sfx('flip'); break;
          case 'dirty': ctx.sfx('tick'); break;
          case 'go': ctx.sfx('gong'); banner = {s: '开工！', t: 0}; break;
          case 'end': ctx.sfx('gong'); banner = {s: '打烊！', t: 0}; break;
        }
      }
    }
    let statT = 0;
    function status() {
      const m = Math.floor(Math.ceil(st.left) / 60), s = Math.ceil(st.left) % 60;
      const sr = stars.filter(v => st.coins >= v).length;
      ctx.status(`第${lv}关 · ${LV.name}　⏱ ${m}:${String(s).padStart(2, '0')}　金币 ${st.coins}　${'★'.repeat(sr)}${'☆'.repeat(3 - sr)}`);
    }
    ctx.info(0, ''); ctx.info(1, '');

    /* ---------- static background cache ---------- */
    let bg = null, bgKey = '';
    function drawStatic(g, ts, pad) {
      // frame
      D.wood(g, 0, 0, GW * ts + pad * 2, GH * ts + pad * 2, {r: pad, base: '#7a4a28', dark: '#3a1d0c', seed: 9});
      g.save(); g.translate(pad, pad);
      for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
        const ch = MAP[r * GW + c], x = c * ts, y = r * ts;
        if (ch === '.' || ch === '~') {
          g.fillStyle = (r + c) % 2 ? '#e9cfa0' : '#f2dcb2'; g.fillRect(x, y, ts, ts);
          g.strokeStyle = 'rgba(150,100,50,.12)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, ts - 1, ts - 1);
          if (ch === '~') { g.fillStyle = 'rgba(120,180,230,.55)'; g.beginPath(); g.ellipse(x + ts / 2, y + ts / 2, ts * .46, ts * .32, .3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x + ts * .38, y + ts * .4, ts * .12, ts * .05, .3, 0, 7); g.fill(); }
        }
      }
      // counters/fixtures with a front face
      for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
        const ch = MAP[r * GW + c]; if (ch === '.' || ch === '~') continue;
        const x = c * ts, y = r * ts, th = ts * .8;
        const topCol = STN[ch] ? '#5a5048' : ch === 'H' ? '#d6a446' : ch === 'K' ? '#9fb7c4' : ch === 'X' ? '#6f6a60' : '#c9955a';
        g.fillStyle = D.shade(topCol, -35); g.fillRect(x, y + th, ts, ts - th);
        g.fillStyle = topCol; g.fillRect(x, y, ts, th);
        if (topCol === '#c9955a') { g.strokeStyle = 'rgba(110,70,30,.25)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x, y + th * k / 4); g.lineTo(x + ts, y + th * k / 4 + 1); g.stroke(); } }
        g.strokeStyle = 'rgba(60,35,15,.35)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, ts - 1, ts - 1);
        const cx = x + ts / 2, cy = y + th / 2;
        if (CRATE[ch]) { g.fillStyle = '#a8723d'; D.rr(g, x + ts * .08, y + ts * .06, ts * .84, th * .9, ts * .08); g.fill(); g.strokeStyle = '#6b4426'; g.lineWidth = Math.max(1, ts * .04); g.stroke(); g.beginPath(); g.moveTo(x + ts * .1, y + ts * .08); g.lineTo(x + ts * .9, y + th * .9); g.stroke(); drawIng(g, cx, cy, ts * .8, CRATE[ch], false); }
        else if (ch === 'C') { g.fillStyle = '#e8c48a'; D.rr(g, x + ts * .1, y + ts * .1, ts * .8, th * .8, ts * .1); g.fill(); g.strokeStyle = '#a8723d'; g.lineWidth = Math.max(1, ts * .03); g.stroke(); g.fillStyle = '#9aa4ad'; g.fillRect(x + ts * .62, y + ts * .14, ts * .22, ts * .08); g.fillStyle = '#4a3020'; g.fillRect(x + ts * .78, y + ts * .14, ts * .1, ts * .08); }
        else if (STN[ch]) {
          g.fillStyle = '#2b2622'; D.circle(g, cx, cy, ts * .36); g.fill();
          g.strokeStyle = '#d9822b'; g.lineWidth = Math.max(1, ts * .03); D.circle(g, cx, cy, ts * .3); g.stroke();
          seal(g, x + ts * .16, y + ts * .14, ts * .2, STN_CH[STN[ch]], '#8a2a20');
        }
        else if (ch === 'L') { g.fillStyle = '#8a5f2c'; g.fillRect(x + ts * .1, y + th * .78, ts * .8, ts * .06); }
        else if (ch === 'H') { g.fillStyle = '#8a2a20'; D.rr(g, x + ts * .08, y + ts * .06, ts * .84, th * .86, ts * .06); g.fill(); g.fillStyle = '#f3d27a'; D.rr(g, x + ts * .16, y + ts * .14, ts * .68, th * .7, ts * .04); g.fill(); D.text(g, '出菜', cx, cy, {size: ts * .26, color: '#8a2a20', font: 'serif', weight: 900}); }
        else if (ch === 'D') { g.fillStyle = '#5e4b38'; D.rr(g, x + ts * .1, y + ts * .08, ts * .8, th * .8, ts * .06); g.fill(); D.text(g, '回收', cx, y + th * .25, {size: ts * .2, color: '#f3e2c0', font: 'serif', weight: 900}); }
        else if (ch === 'K') { g.fillStyle = '#6f8fa0'; D.rr(g, x + ts * .1, y + ts * .1, ts * .8, th * .76, ts * .12); g.fill(); g.fillStyle = '#9fd3ec'; D.rr(g, x + ts * .16, y + ts * .16, ts * .68, th * .62, ts * .1); g.fill(); g.fillStyle = '#c0c8cc'; g.fillRect(cx - ts * .04, y, ts * .08, ts * .14); }
        else if (ch === 'X') { g.fillStyle = '#3a3630'; D.circle(g, cx, cy, ts * .3); g.fill(); g.fillStyle = '#1b1814'; D.circle(g, cx, cy, ts * .22); g.fill(); D.text(g, '弃', cx, cy, {size: ts * .22, color: '#8a8070', font: 'serif', weight: 900}); }
        else if (ch === 'E') { g.strokeStyle = '#c23a2b'; g.lineWidth = Math.max(1, ts * .05); D.rr(g, x + ts * .14, y + ts * .08, ts * .72, th * .84, ts * .08); g.stroke(); }
      }
      g.restore();
    }
    function ensureBg(L) {
      const pad = Math.round(L.ts * .3), key = L.ts.toFixed(2) + '|' + cv.dpr;
      if (key !== bgKey) {
        bgKey = key; bg = document.createElement('canvas');
        const W = GW * L.ts + pad * 2, Hh = GH * L.ts + pad * 2;
        bg.width = Math.ceil(W * cv.dpr); bg.height = Math.ceil(Hh * cv.dpr);
        const g2 = bg.getContext('2d'); g2.scale(cv.dpr, cv.dpr); drawStatic(g2, L.ts, pad); bg.pad = pad; bg.W = W; bg.H = Hh;
      }
      return bg;
    }
    /* ---------- tickets ---------- */
    function drawTicket(g, o, x, y, w, h, k, gone) {
      const r = REC[o.r], frac = BX.clamp(o.p / o.pm, 0, 1);
      g.save();
      const shake = frac < .25 && !gone ? Math.sin(tAll * 30) * 1.5 : 0;
      g.translate(x + w / 2 + shake, y + h / 2); g.scale(k, k); g.translate(-w / 2, -h / 2);
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
      g.fillStyle = '#fffaf0'; D.rr(g, 0, 0, w, h, 6); g.fill(); g.shadowColor = 'transparent';
      g.fillStyle = frac < .25 ? '#c23a2b' : '#8a2a20'; D.rr(g, 0, 0, w, h * .2, 6); g.fill(); g.fillRect(0, h * .1, w, h * .1);
      D.text(g, r.n, w / 2, h * .1, {size: Math.min(h * .15, w * .17), color: '#fff3e0', weight: 800});
      const ds = Math.min(h * .48, w * .62); drawDish(g, w / 2, h * .2 + ds * .48, ds, o.r);
      const n = r.ing.length, is = Math.min(h * .2, w / (n + 1.6)), rowY = h * .82 - is * .25;
      let ix = w / 2 - (n * is + is * .9) / 2 + is / 2;
      for (const t of r.ing) { drawIng(g, ix, rowY, is * 1.15, t, ING[t].chop); ix += is; }
      seal(g, ix + is * .05, rowY, is * .8, STN_CH[r.st], '#3f7f6b');
      // patience bar
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(4, h - 6, w - 8, 4);
      g.fillStyle = frac > .5 ? '#3f9a4a' : frac > .25 ? '#e0a020' : '#d0533f'; g.fillRect(4, h - 6, (w - 8) * frac, 4);
      if (gone) { g.globalAlpha = .9; D.text(g, gone.ok ? '已上菜' : '超时', w / 2, h / 2, {size: Math.min(w * .22, h * .26), color: gone.ok ? '#2e7d32' : '#c62828', font: 'serif', weight: 900, stroke: '#fff', strokeW: 3}); }
      g.restore();
    }
    function drawCtrls(g, L) {
      for (const c of L.ctrls) {
        const col = PAL[ctx.mySeats[c.slot] != null ? ctx.mySeats[c.slot] : c.slot] || '#888';
        let jt = null; for (const t of ptrs.values()) if (t.type === 'J' && t.slot === c.slot) jt = t;
        const bx = jt ? jt.ox : c.bx, by = jt ? jt.oy : c.by;
        g.fillStyle = 'rgba(40,24,10,.28)'; D.circle(g, bx, by, c.R); g.fill(); g.strokeStyle = 'rgba(255,240,210,.45)'; g.lineWidth = 2; g.stroke();
        const kx = bx + joy[c.slot].x * c.R * .9, ky = by + joy[c.slot].y * c.R * .9;
        D.disc(g, kx, ky, c.R * .42, col, {ring: 'rgba(255,255,255,.5)'});
        for (const [b, lab, sub, i] of [[c.A, '拿/放', '', 0], [c.U, '使用', '按住', 1]]) {
          const held = [...ptrs.values()].some(t => t.slot === c.slot && t.type === (i ? 'U' : 'A'));
          const pr = press[c.slot * 2 + i] || held ? 1 : 0;
          D.disc(g, b.x, b.y + pr * 2, b.r, i ? '#3f7f6b' : col, {ring: 'rgba(255,255,255,.55)'});
          D.text(g, lab, b.x, b.y + pr * 2 - (sub ? b.r * .12 : 0), {size: b.r * .44, color: '#fff', weight: 800, shadow: true});
          if (sub) D.text(g, sub, b.x, b.y + pr * 2 + b.r * .36, {size: b.r * .26, color: 'rgba(255,255,255,.8)'});
        }
        if (L.ctrls.length > 1) D.text(g, ctx.name(ctx.mySeats[c.slot]), c.bx, c.by - c.R - 12, {size: 12, color: 'rgba(255,240,210,.8)'});
      }
      press.fill(0);
    }

    function draw(dt) {
      tAll += dt;
      const g = cv.g; cv.clear();
      const L = layout(); lastL = L;
      playEv();
      // tea-house wall background
      const gr = g.createLinearGradient(0, 0, 0, cv.h); gr.addColorStop(0, '#4a2c18'); gr.addColorStop(1, '#2a180c'); g.fillStyle = gr; g.fillRect(0, 0, cv.w, cv.h);
      g.strokeStyle = 'rgba(230,197,125,.06)'; g.lineWidth = 1; for (let x = 0; x < cv.w; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, cv.h); g.stroke(); } for (let y = 0; y < cv.h; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(cv.w, y); g.stroke(); }
      const ts = L.ts, B = ensureBg(L);
      g.drawImage(B, L.ox - B.pad, L.oy - B.pad, B.W, B.H);
      // dynamic fixtures
      for (let i = 0; i < GW * GH; i++) {
        const ch = MAP[i]; if (ch === '.' || ch === '~') continue;
        const x = L.ox + (i % GW) * ts, y = L.oy + Math.floor(i / GW) * ts, cx = x + ts / 2, cy = y + ts * .4;
        if (STN[ch]) {
          const s = st.stn[i], tp = STN[ch];
          if (tp === 'pot') { g.fillStyle = '#4a4a4e'; D.circle(g, cx, cy, ts * .3); g.fill(); g.fillStyle = '#2f2f33'; D.circle(g, cx, cy, ts * .24); g.fill(); if (s.c.length || s.s === 1 || s.s === 2) { g.fillStyle = (s.r || s.c.join()).includes('veg') || s.r === 'soup' ? '#8cc152' : '#e7bf7f'; D.circle(g, cx, cy, ts * .21); g.fill(); if (s.s === 1) for (let k = 0; k < 3; k++) { const a = tAll * 3 + k * 2.1; g.fillStyle = 'rgba(255,255,255,.6)'; D.circle(g, cx + Math.cos(a) * ts * .1, cy + Math.sin(a * 1.3) * ts * .08, ts * .03 * (1 + Math.sin(tAll * 8 + k))); g.fill(); } } g.fillStyle = '#4a4a4e'; g.fillRect(cx - ts * .42, cy - ts * .04, ts * .1, ts * .08); g.fillRect(cx + ts * .32, cy - ts * .04, ts * .1, ts * .08); }
          else if (tp === 'wok') { if (s.s === 1) drawFlames(g, cx, cy + ts * .3, ts * .5, tAll); g.fillStyle = '#1e1e20'; g.beginPath(); g.ellipse(cx, cy, ts * .32, ts * .26, 0, 0, 7); g.fill(); g.fillStyle = '#3a3a3e'; g.beginPath(); g.ellipse(cx, cy - ts * .02, ts * .25, ts * .19, 0, 0, 7); g.fill(); g.fillStyle = '#5e3a20'; g.fillRect(cx + ts * .28, cy - ts * .04, ts * .18, ts * .07); for (const t of s.c) { const o = t === 'rice' ? [-.06, 0] : [.07, .03]; g.fillStyle = t === 'rice' ? '#f7f1e0' : '#5bb35e'; g.beginPath(); g.ellipse(cx + o[0] * ts, cy + o[1] * ts, ts * .1, ts * .07, 0, 0, 7); g.fill(); } if (s.s >= 1 && s.s < 3) { const jump = s.s === 1 ? Math.abs(Math.sin(tAll * 6)) * ts * .05 : 0; g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(cx, cy - jump, ts * .16, ts * .1, 0, 0, 7); g.fill(); } }
          else { g.fillStyle = '#c99a5a'; g.beginPath(); g.ellipse(cx, cy, ts * .33, ts * .27, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5f2c'; g.lineWidth = Math.max(1, ts * .03); g.stroke(); if (s.s === 1 || s.s === 2) { g.strokeStyle = 'rgba(138,95,44,.8)'; for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(cx - ts * .28, cy + k * ts * .08); g.lineTo(cx + ts * .28, cy + k * ts * .08); g.stroke(); } } else s.c.forEach((t, k) => drawIng(g, cx + (k ? .1 : -.1) * ts, cy, ts * .45, t, true)); }
          if (s.s === 1) {
            if (Math.random() < dt * 8) parts.push({x: cx + (Math.random() - .5) * ts * .3, y: cy - ts * .1, vx: (Math.random() - .5) * 8, vy: -ts * .9, life: 1.1, max: 1.1, col: 'rgba(255,255,255,.55)', kind: 'steam', r: ts * .1});
            g.fillStyle = 'rgba(0,0,0,.5)'; D.rr(g, x + ts * .1, y - ts * .16, ts * .8, ts * .12, 3); g.fill(); g.fillStyle = '#6cc46a'; D.rr(g, x + ts * .12, y - ts * .14, ts * .76 * s.p, ts * .08, 2); g.fill();
          } else if (s.s === 2) {
            const warn = s.p > .45, fl = warn && Math.floor(tAll * 6) % 2;
            g.fillStyle = warn ? (fl ? '#ff5a3c' : '#fff3e0') : '#fffaf0'; D.circle(g, cx, y - ts * .18, ts * .3); g.fill(); g.strokeStyle = warn ? '#c23a2b' : '#3f9a4a'; g.lineWidth = Math.max(1.5, ts * .05); g.stroke();
            g.beginPath(); g.moveTo(cx - ts * .06, y + ts * .1); g.lineTo(cx, y + ts * .03); g.lineTo(cx + ts * .06, y + ts * .1); g.fillStyle = warn ? '#c23a2b' : '#3f9a4a'; g.fill();
            if (warn) D.text(g, '！', cx, y - ts * .18, {size: ts * .4, color: fl ? '#fff' : '#c23a2b', weight: 900});
            else drawDish(g, cx, y - ts * .18, ts * .55, s.r);
            if (warn && Math.random() < dt * 10) parts.push({x: cx, y: cy, vx: (Math.random() - .5) * 15, vy: -ts * .7, life: 1.2, max: 1.2, col: 'rgba(70,60,55,.5)', kind: 'steam', r: ts * .12});
          } else if (s.s === 3) {
            drawFlames(g, cx, cy + ts * .25, ts * 1.1, tAll);
            if (Math.random() < dt * 14) parts.push({x: cx + (Math.random() - .5) * ts * .4, y: cy - ts * .4, vx: (Math.random() - .5) * 12, vy: -ts * 1.1, life: 1.4, max: 1.4, col: 'rgba(50,40,35,.55)', kind: 'steam', r: ts * .16});
            if (s.e > 0) { g.fillStyle = 'rgba(0,0,0,.5)'; D.rr(g, x + ts * .1, y - ts * .16, ts * .8, ts * .12, 3); g.fill(); g.fillStyle = '#9fd3ec'; D.rr(g, x + ts * .12, y - ts * .14, ts * .76 * s.e, ts * .08, 2); g.fill(); }
          }
        } else if (ch === 'L') {
          for (let k = 0; k < Math.min(st.rack, 5); k++) drawPlate(g, cx, cy + ts * .1 - k * ts * .07, ts * .8, false);
          if (st.rack > 1) D.text(g, '×' + st.rack, x + ts * .82, y + ts * .18, {size: ts * .22, color: '#3a2410', weight: 800, stroke: '#fff', strokeW: 2});
        } else if (ch === 'D') {
          for (let k = 0; k < Math.min(st.dret, 4); k++) drawPlate(g, cx, cy + ts * .12 - k * ts * .07, ts * .7, true);
          if (st.dret > 1) D.text(g, '×' + st.dret, x + ts * .82, y + ts * .18, {size: ts * .22, color: '#fff', weight: 800, stroke: '#3a2410', strokeW: 2});
        } else if (ch === 'K') {
          for (let k = 0; k < Math.min(st.sink.n, 3); k++) drawPlate(g, cx + (k - 1) * ts * .08, cy + ts * .02, ts * .55, true);
          if (st.sink.n) { if (st.sink.p > 0) { g.fillStyle = 'rgba(0,0,0,.5)'; D.rr(g, x + ts * .1, y - ts * .16, ts * .8, ts * .12, 3); g.fill(); g.fillStyle = '#9fd3ec'; D.rr(g, x + ts * .12, y - ts * .14, ts * .76 * st.sink.p, ts * .08, 2); g.fill(); } if (st.sink.n > 1) D.text(g, '×' + st.sink.n, x + ts * .82, y + ts * .18, {size: ts * .22, color: '#fff', weight: 800, stroke: '#3a2410', strokeW: 2}); }
        }
        const it = st.it[i];
        if (it) {
          drawItem(g, cx, cy, ts * .78, it);
          if (it.cp > 0) { g.fillStyle = 'rgba(0,0,0,.5)'; D.rr(g, x + ts * .1, y - ts * .16, ts * .8, ts * .12, 3); g.fill(); g.fillStyle = '#f2c94c'; D.rr(g, x + ts * .12, y - ts * .14, ts * .76 * Math.min(1, it.cp), ts * .08, 2); g.fill(); }
        }
      }
      // facing highlight for local players
      st.P.forEach((p, k) => {
        if (!ctx.isLocal(k) || (BX.bot && !ctx.isLocal(k))) return;
        const f = front(p); if (f < 0 || MAP[f] === '.' || MAP[f] === '~') return;
        const x = L.ox + (f % GW) * ts, y = L.oy + Math.floor(f / GW) * ts;
        g.strokeStyle = D.alpha(PAL[k], .55 + .3 * Math.sin(tAll * 6)); g.lineWidth = Math.max(2, ts * .06); g.setLineDash([ts * .15, ts * .1]); D.rr(g, x + 2, y + 2, ts - 4, ts * .8 - 2, ts * .12); g.stroke(); g.setLineDash([]);
      });
      // chefs (sorted by depth)
      const order = st.P.map((p, k) => k).sort((a, b) => st.P[a].y - st.P[b].y);
      for (const k of order) {
        const p = st.P[k], d = disp[k];
        const lk = Math.min(1, dt * (ctx.isHost ? 30 : 14)); d.x += (p.x - d.x) * lk; d.y += (p.y - d.y) * lk;
        if (Math.hypot(p.x - d.x, p.y - d.y) > 2) { d.x = p.x; d.y = p.y; }
        d.ph += dt * (p.mv ? 14 : 3);
        pop[k] = Math.max(0, pop[k] - dt * 5);
        const sx = L.ox + d.x * ts, sy = L.oy + (d.y + .28) * ts;
        drawChef(g, sx, sy, ts * 1.05, PAL[k], p.fx, p.fy, d.ph, !!p.mv, pop[k] + (p.act === 'chop' ? Math.abs(Math.sin(tAll * 18)) * .4 : 0), p.h, String(k + 1));
        if (p.act === 'ext') {
          const ax = Math.abs(p.fx) >= Math.abs(p.fy), dx = ax ? Math.sign(p.fx) : 0, dy = ax ? 0 : Math.sign(p.fy);
          for (let n = 0; n < 2; n++) parts.push({x: sx + dx * ts * .3, y: sy - ts * .3 + dy * ts * .2, vx: dx * ts * 3 + (Math.random() - .5) * ts, vy: dy * ts * 3 + (Math.random() - .5) * ts, life: .35, max: .35, col: '#f4f8ff', kind: 'dot', r: ts * .08});
          if ((sprSnd -= dt) <= 0) { sprSnd = .3; ctx.sfx('swish'); }
        }
        if (p.act === 'chop') { if ((chopSnd -= dt) <= 0) { chopSnd = .18; ctx.sfx('tick'); const f = front(p); if (f >= 0) { const [fx0, fy0] = tilePx(f, L); burst(fx0, fy0, 2, '#b7e07a', 50, .35); } } }
        if (p.act === 'wash' && Math.random() < dt * 12) { const [fx0, fy0] = tilePx(sinkT, L); parts.push({x: fx0 + (Math.random() - .5) * ts * .5, y: fy0, vx: (Math.random() - .5) * 30, vy: -40 - Math.random() * 30, life: .6, max: .6, col: 'rgba(220,240,255,.9)', kind: 'bub', r: ts * .06}); }
      }
      // particles
      for (let j = parts.length - 1; j >= 0; j--) {
        const q = parts[j]; q.life -= dt; if (q.life <= 0) { parts.splice(j, 1); continue; }
        q.x += q.vx * dt; q.y += q.vy * dt; if (q.kind === 'dot' || q.kind === 'star') q.vy += 160 * dt;
        const a = q.life / q.max;
        if (q.kind === 'steam') { g.fillStyle = q.col; g.globalAlpha = a * .8; D.circle(g, q.x, q.y, q.r * (1.6 - a)); g.fill(); g.globalAlpha = 1; }
        else if (q.kind === 'star') { g.fillStyle = q.col; g.globalAlpha = a; g.save(); g.translate(q.x, q.y); g.rotate(q.life * 8); g.beginPath(); for (let n = 0; n < 8; n++) { const rr = n % 2 ? q.r * .4 : q.r * 1.4; g.lineTo(Math.cos(n * .785) * rr, Math.sin(n * .785) * rr); } g.fill(); g.restore(); g.globalAlpha = 1; }
        else if (q.kind === 'bub') { g.strokeStyle = q.col; g.globalAlpha = a; g.lineWidth = 1.2; D.circle(g, q.x, q.y, q.r); g.stroke(); g.globalAlpha = 1; }
        else { g.fillStyle = q.col; g.globalAlpha = a; D.circle(g, q.x, q.y, q.r); g.fill(); g.globalAlpha = 1; }
      }
      if (parts.length > 400) parts.splice(0, parts.length - 400);
      // tickets
      const tk = L.tk, n = 4, tw = Math.min(130, (tk.w - 6 * (n - 1)) / n), th = tk.h;
      const now = tAll;
      st.orders.forEach((o, j) => {
        if (!tkSeen.has(o.id)) tkSeen.set(o.id, now);
        const age = now - tkSeen.get(o.id), k = age < .45 ? BX.ease.back(Math.min(1, age / .45)) : 1;
        const bounce = age < .9 ? Math.sin(age * 14) * (1 - age / .9) * 4 : 0;
        drawTicket(g, o, tk.x + j * (tw + 6), tk.y + bounce, tw, th, Math.max(.01, k));
      });
      for (let j = tkGone.length - 1; j >= 0; j--) {
        const t = tkGone[j]; t.t += dt; if (t.t > .7) { tkGone.splice(j, 1); continue; }
        const idx = st.orders.length + tkGone.length - 1 - j;
        if (idx < n) { g.globalAlpha = 1 - t.t / .7; drawTicketGhost(g, tk.x + idx * (tw + 6), tk.y - t.t * 40, tw, th, t.ok); g.globalAlpha = 1; }
      }
      if (!st.orders.length && st.ph === 'play') D.text(g, '等待客人点单…', tk.x + tk.w / 2, tk.y + th / 2, {size: Math.min(18, th * .3), color: 'rgba(243,226,192,.6)', font: 'serif'});
      // timer + coins pills
      drawPills(g, L);
      // floating texts
      for (let j = floats.length - 1; j >= 0; j--) { const f = floats[j]; f.t += dt; if (f.t > 1.2) { floats.splice(j, 1); continue; } D.text(g, f.s, f.x, f.y - f.t * 40, {size: Math.max(16, ts * .55), color: f.col, weight: 900, stroke: '#3a2410', strokeW: 4}); }
      // banner
      if (st.ph === 'ready') { const n2 = Math.ceil(st.t); D.text(g, '准备 ' + Math.max(1, n2), L.ox + GW * ts / 2, L.oy + GH * ts / 2, {size: ts * 1.1, color: '#fff3e0', font: 'deco', weight: 400, stroke: '#8a2a20', strokeW: 6}); D.text(g, LV.hz, L.ox + GW * ts / 2, L.oy + GH * ts / 2 + ts * 1.1, {size: Math.max(12, ts * .36), color: '#fff3e0', stroke: '#3a2410', strokeW: 4, maxW: GW * ts - 10}); }
      if (banner) { banner.t += dt; const a = banner.t; if (a > 1.6) banner = null; else { const k = BX.ease.back(Math.min(1, a / .35)); g.save(); g.globalAlpha = Math.min(1, (1.6 - a) * 3); g.translate(L.ox + GW * ts / 2, L.oy + GH * ts / 2); g.scale(k, k); D.text(g, banner.s, 0, 0, {size: ts * 1.5, color: '#ffe08a', font: 'deco', weight: 400, stroke: '#8a2a20', strokeW: 7}); g.restore(); } }
      if (L.hint) {
        const two = ctx.mySeats.length >= 2;
        D.text(g, two ? '左：WASD 移动 · E 拿放 · Q 使用　　右：方向键 移动 · . 拿放 · / 使用' : 'WASD / 方向键 移动 · 空格 / E 拿起放下 · 按住 Q / Shift 切菜·洗碗·灭火', L.hint.x, L.hint.y, {size: 13, color: 'rgba(243,226,192,.75)', maxW: cv.w - 20});
      }
      if (L.touch) drawCtrls(g, L);
      if ((statT -= dt) <= 0) { statT = .25; status(); }
    }
    function drawTicketGhost(g, x, y, w, h, ok) {
      g.fillStyle = ok ? '#e8f5e0' : '#fbe3df'; D.rr(g, x, y, w, h, 6); g.fill();
      D.text(g, ok ? '已上菜' : '超时', x + w / 2, y + h / 2, {size: Math.min(w * .22, h * .26), color: ok ? '#2e7d32' : '#c62828', font: 'serif', weight: 900});
    }
    function drawPills(g, L) {
      const P = L.pill, m = Math.floor(Math.ceil(st.left) / 60), s = Math.ceil(st.left) % 60, tstr = `${m}:${String(s).padStart(2, '0')}`;
      const sr = stars.filter(v => st.coins >= v).length, low = st.left < 30 && st.ph === 'play';
      const pill = (x, y, w, h, icon, txt, col) => {
        g.fillStyle = 'rgba(30,18,8,.82)'; D.rr(g, x, y, w, h, h / 2); g.fill(); g.strokeStyle = 'rgba(230,197,125,.45)'; g.lineWidth = 1.5; g.stroke();
        const fs = Math.min(h * .5, w * .22);
        D.disc(g, x + h / 2, y + h / 2, h * .34, icon === 'c' ? '#e6b93d' : '#e8e0cf', {shadow: false});
        if (icon === 'c') D.text(g, '金', x + h / 2, y + h / 2 + 1, {size: h * .32, color: '#8a5a10', font: 'serif', weight: 900});
        else { g.strokeStyle = '#3a2410'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + h / 2, y + h / 2); g.lineTo(x + h / 2, y + h * .27); g.moveTo(x + h / 2, y + h / 2); g.lineTo(x + h * .66, y + h / 2); g.stroke(); }
        D.text(g, txt, x + h + (w - h) / 2 - 2, y + h / 2 + 1, {size: fs, color: col || '#fff3e0', weight: 800, maxW: w - h - 6});
      };
      const starStr = '★'.repeat(sr) + '☆'.repeat(3 - sr);
      if (P.vert) {
        const hh = Math.min(30, P.h / 3 - 3);
        pill(P.x, P.y, P.w, hh, 't', tstr, low ? '#ff8a7a' : null);
        pill(P.x, P.y + hh + 4, P.w, hh, 'c', String(st.coins));
        D.text(g, starStr, P.x + P.w / 2, P.y + hh * 2 + 8 + hh / 2, {size: hh * .6, color: '#ffd34d'});
      } else if (P.split) {
        pill(P.x, P.y, P.w, P.h, 't', tstr, low ? '#ff8a7a' : null);
        pill(P.split, P.y, P.w, P.h, 'c', String(st.coins));
        D.text(g, starStr, P.split + P.w / 2, P.y + P.h + 14, {size: 16, color: '#ffd34d'});
      } else {
        const hh = Math.min(34, (P.h - 4) / 2);
        pill(P.x, P.y, P.w * .5 - 3, hh, 't', tstr, low ? '#ff8a7a' : null);
        pill(P.x + P.w * .5 + 3, P.y, P.w * .5 - 3, hh, 'c', String(st.coins));
        D.text(g, starStr + `  1星 ${stars[0]}`, P.x + P.w / 2, P.y + hh + 14, {size: 14, color: '#ffd34d'});
      }
    }

    status();
    return {
      st, input, aiInput, key,
      dbg: () => JSON.stringify({t: Math.round(st.left), c: st.coins, sv: st.served, f: st.failed, o: st.orders.map(o => o.r), P: st.P.map((p, k) => [p.x.toFixed(1), p.y.toFixed(1), p.h && (p.h.k + (p.h.t || p.h.d || '') + (p.h.c ? 'c' : '') + (p.h.x ? 'x' : '')), aiM[k].job, aiM[k].goal && aiM[k].goal.i]), stn: Object.values(st.stn).map(x => x.s + ':' + x.c.join('+')), rack: st.rack, sink: st.sink.n, dret: st.dret}),
      step(dt, inputs) { step(dt, inputs); },
      snapshot() {
        const r2 = v => Math.round(v * 100) / 100;
        return {lv: st.lv, ph: st.ph, t: r2(st.t), left: r2(st.left), coins: st.coins, served: st.served, failed: st.failed, orders: st.orders.map(o => ({id: o.id, r: o.r, p: r2(o.p), pm: o.pm})),
          P: st.P.map(p => ({x: r2(p.x), y: r2(p.y), vx: 0, vy: 0, fx: p.fx, fy: p.fy, h: p.h, mv: p.mv, act: p.act, i: p.i})),
          it: st.it, stn: st.stn, rack: st.rack, dret: st.dret, sink: {n: st.sink.n, p: r2(st.sink.p)}, ev: st.ev, evId: st.evId, over: st.over, star: st.star};
      },
      restore(d) { Object.assign(st, d); },
      draw,
      destroy() { parts.length = 0; },
    };
  },
});
