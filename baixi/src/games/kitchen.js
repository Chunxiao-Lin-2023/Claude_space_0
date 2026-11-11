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
  0: {name: '新手厨房', rec: ['soup'], plates: 2, pat: 140, gap: 20, grace: 30, stars: [40, 100, 160], time: 150, tut: true, spawn: [[4, 4], [8, 4]],
    hz: '教学关：跟着金色箭头，做出第一碗青菜汤！',
    map: ['#####PP######', '#...........#', 'V...........H', '#...........#', 'C...........L', '#...........#', 'X...........D', '#...........K', '####E########']},
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
const READY = TEST ? .6 : 2.6;
const CHOP_T = TEST ? .45 : 1.5, WASH_T = TEST ? .4 : 1.3, EXT_T = TEST ? .4 : 1, RET_T = TEST ? 2 : 6;
const cookT = r => TEST ? 2.4 : REC[r].t;
const PAL = ['#c23a2b', '#2f7f9a'];
const DASH_T = .18, DASH_CD = .5, DASH_BUF = .16, FLY_V = 9, FLY_T = .55, FLOOR_MAX = 6;
/* feel: walk speed (tiles/s) and exponential approach rates (1/s) for speeding up, braking and reversing (Overcooked-like snappy start, short stop) */
const SP = 4.4, ACC = 24, DEC = 40, TURN = 42, WET = 4.5;
const REACH = .85, CONE = .74, IBUF = .15, CATCH_R = .62, AIM_COS = .9;
const JOY_DZ = .16, JOY_SAT = .8, JOY_POW = 1.25, JOY_SNAP = .19;
/* throw arc (visual height in tiles): leaves the hands at H0, apex FLY_APEX, touches the floor exactly at FLY_T */
const FLY_H0 = .02, FLY_APEX = .55;
const FLY_VZ = (() => { const a = (FLY_APEX - FLY_H0) * 2, T = FLY_T, A = T * T / (2 * a); return (T + Math.sqrt(T * T + 4 * A * FLY_H0)) / (2 * A); })(), FLY_G = FLY_VZ * FLY_VZ / (2 * (FLY_APEX - FLY_H0));
const flyH = t => Math.max(0, FLY_H0 + FLY_VZ * t - FLY_G * t * t / 2);
const A_KEYS = [['KeyE', 'Space', 'KeyJ'], ['Period', 'Enter', 'NumpadEnter', 'Numpad0']], U_KEYS = [['KeyQ', 'KeyF', 'ShiftLeft', 'KeyK'], ['Slash', 'ShiftRight', 'NumpadDecimal']];
const D_KEYS = [['KeyR', 'KeyC', 'KeyL'], ['Comma', 'Numpad1']];
const CMDS = [['', '自由'], ['prep', '备料'], ['wash', '洗碗'], ['serve', '上菜']];

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
  kind: 'realtime', seats: 2, coop: true, noFirst: true, seatNames: ['红围裙', '蓝围裙'], seatColors: PAL, snapHz: 30, inputHz: 60,
  options: [{key: 'lv', label: '关卡', choices: [[0, '教学 · 新手厨房'], [1, '一 · 茶馆后厨'], [2, '二 · 点心铺'], [3, '三 · 年夜大席']], def: 1},
    {key: 'assist', label: '难度', choices: [[0, '标准'], [1, '宽松（订单更耐等、不会起火）']], def: 0}],
  howto: ['<b>移动</b>：WASD / 方向键，或触屏左侧摇杆。脚下虚线框 = 你正对着的台子，框上的小字告诉你按键会做什么。',
    '<b>拿/放</b>：空格 / E（触屏「拿/放」）。<b>使用</b>：按住 Q / Shift 切菜、洗碗、灭火；手里拿着食材时轻按「使用」= <b>扔出去</b>，队友空手就能接住；大致朝着队友或锅扔会自动对准（虚线弧提示）。',
    '<b>冲刺</b>：R / C（触屏「冲刺」）向前冲一小段。同屏双人右边：方向键 + <b>.</b> 拿放 + <b>/</b> 使用 + <b>,</b> 冲刺。',
    '上方订单票写着菜名、原料和用哪口锅；手里的菜对得上的订单会发金光。第一次玩建议先选「教学」关卡。',
    '人机模式可用「伙伴」按钮指挥电脑：备料 / 洗碗 / 上菜 / 自由；卡住时点 💡 会用箭头指出下一步。'],
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
<p><b>扔食材：</b>手里拿着食材时轻按「使用」把它扔向面前，能直接扔进锅里、扔到空柜台上或扔给空手的队友；落在地上的食材走过去按「拿/放」捡起。大致朝着空手的队友或要这样食材的锅扔，会自动对准（地上有虚线弧提示）。<b>冲刺</b>可以快速穿过厨房。</p>
<p><b>宽松模式：</b>订单等待时间 ×1.5，做好的菜放多久都不会起火，适合新手和小朋友。</p>
<p><b>关卡：</b>教学 · 新手厨房（只做青菜汤，有箭头指引）；一 · 茶馆后厨（三道菜）；二 · 点心铺（厨房被长案隔开，可以隔案递食材）；三 · 年夜大席（五道菜、火候更急、地上有水渍会打滑）。</p>
<p><b>操作：</b>任何柜台都能放一样东西。<br>键盘单人：WASD / 方向键移动，<b>空格 / E</b> 拿起·放下，<b>Q / Shift</b> 使用（切菜、洗碗、灭火，需按住；拿着食材时 = 扔），<b>R / C</b> 冲刺。<br>同屏双人：左边 WASD + <b>E</b> 拿放 + <b>Q</b> 使用 + <b>R</b> 冲刺；右边 方向键 + <b>.</b> 拿放 + <b>/</b> 使用 + <b>,</b> 冲刺。<br>触屏：左侧摇杆移动，右侧「拿/放」「使用」「冲刺」按钮（按钮上的字会随当前能做的动作变化）；同屏双人时两人各用自己那半边的摇杆和按钮。</p>`,
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
    const assist = +ctx.opts.assist === 1;
    const pat = TEST ? 45 : Math.round(LV.pat * (assist ? 1.5 : 1)), gap = TEST ? 7 : LV.gap, grace = TEST ? 9 : LV.grace;
    const LV_TIME = TEST ? 34 : (LV.time || 180);
    const stars = TEST ? [20, 60, 120] : LV.stars;
    const st = {lv, ph: 'ready', t: READY, left: LV_TIME, coins: 0, served: 0, failed: 0, orders: [], oid: 0, nextO: 1.2, P: [], it: {}, stn: {}, rack: LV.plates, dret: 0, sink: {n: 0, p: 0}, pend: [], ev: [], evId: 0, over: false, star: 0, fly: [], fl: []};
    for (const i of tilesOf('E')) st.it[i] = {k: 'e'};
    for (const i of tilesOf('TWP')) st.stn[i] = {c: [], s: 0, p: 0, r: null, e: 0};
    LV.spawn.forEach(([c, r], k) => st.P.push({x: c + .5, y: r + .5, vx: 0, vy: 0, fx: 0, fy: 1, h: null, mv: 0, act: '', i: k, ds: 0, dcd: 0, dq: 0, tg: -1, ib: 0}));
    const hatch = tilesOf('H')[0], rackT = tilesOf('L')[0], dretT = tilesOf('D')[0], sinkT = tilesOf('K')[0];
    const lastA = [0, 0], lastU = [false, false], lastD = [0, 0], goodIn = [null, null];

    /* ================= simulation (host) ================= */
    const fx = (k, o) => { st.ev.push(Object.assign({k, id: ++st.evId}, o || {})); if (st.ev.length > 12) st.ev.shift(); };
    const tileOf = p => Math.floor(p.y) * GW + Math.floor(p.x);
    const faceV = p => { const l = Math.hypot(p.fx, p.fy) || 1; return [p.fx / l, p.fy / l]; };
    /* the station you face: nearest solid tile within reach inside a ~60° cone (forgiving at tile edges and diagonals),
       small bonus for tiles where the button would actually do something, hysteresis against flicker */
    function pickFront(p, prev) {
      const [ux, uy] = faceV(p), c0 = Math.floor(p.x), r0 = Math.floor(p.y);
      let best = -1, bs = Infinity;
      for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
        if ((c === c0 && r === r0) || c < 0 || r < 0 || c >= GW || r >= GH || !solidT(c, r)) continue;
        const dist = Math.hypot(BX.clamp(p.x, c, c + 1) - p.x, BX.clamp(p.y, r, r + 1) - p.y);
        if (dist > REACH) continue;
        const cx = c + .5 - p.x, cy = r + .5 - p.y, cos = (cx * ux + cy * uy) / (Math.hypot(cx, cy) || 1);
        if (cos < CONE) continue;
        const i = r * GW + c; let sc = dist + (1 - cos) * 1.2;
        if (useful(p.h, i)) sc -= .3;
        if (i === prev) sc -= .1;
        if (sc < bs) { bs = sc; best = i; }
      }
      return best;
    }
    const front = p => p.tg != null && p.tg >= -1 ? p.tg : pickFront(p, -1);
    function collide(p) {
      let hit = 0;
      for (let pass = 0; pass < 2; pass++) {
        const c0 = Math.floor(p.x), r0 = Math.floor(p.y);
        for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
          if (!solidT(c, r)) continue;
          const cx = BX.clamp(p.x, c, c + 1), cy = BX.clamp(p.y, r, r + 1), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
          if (d < PR) {
            if (d > 1e-6) { p.x = cx + dx / d * PR; p.y = cy + dy / d * PR; const vn = p.vx * dx / d + p.vy * dy / d; if (vn < 0) { p.vx -= vn * dx / d; p.vy -= vn * dy / d; hit = Math.max(hit, -vn); } }
            else { p.y = r - PR; }
          }
        }
      }
      p.x = BX.clamp(p.x, PR, GW - PR); p.y = BX.clamp(p.y, PR, GH - PR);
      return hit;
    }
    /* corner assist: pushing straight along an axis but clipping a counter corner (or blocked with an opening just beside you)
       → slide sideways into the gap instead of sticking (forward speed is converted into sideways speed) */
    function cornerAssist(p, mx, my, dt, spd) {
      const ax = Math.abs(mx), ay = Math.abs(my); let alongX, s;
      if (ax > ay * 2) { alongX = true; s = Math.sign(mx); } else if (ay > ax * 2) { alongX = false; s = Math.sign(my); } else return;
      const u = alongX ? p.x : p.y, w = alongX ? p.y : p.x, cu = Math.floor(u), cw = Math.floor(w);
      if ((s > 0 ? cu + 1 - u : u - cu) > PR + .12) return;
      const sol = (a, b) => alongX ? solidT(a, b) : solidT(b, a), ahead = cu + s, fw = w - cw;
      let tgt = null;
      if (!sol(ahead, cw)) { if ((fw < PR && sol(ahead, cw - 1)) || (fw > 1 - PR && sol(ahead, cw + 1))) tgt = cw + .5; }
      else if (fw < .4 && !sol(ahead, cw - 1) && !sol(cu, cw - 1)) tgt = cw - .5;
      else if (fw > .6 && !sol(ahead, cw + 1) && !sol(cu, cw + 1)) tgt = cw + 1.5;
      if (tgt == null) return;
      const m = spd * dt, d = BX.clamp(tgt - w, -m, m);
      if (alongX) p.y += d; else p.x += d;
    }
    function startDash(p) { p.ds = DASH_T; p.dcd = DASH_CD; p.dq = 0; const [dx, dy] = faceV(p); p.vx = dx * SP * 3; p.vy = dy * SP * 3; }
    /* one 60 Hz movement tick for a chef (host simulation and the guest's local prediction share this) */
    function moveP(p, inp, dt, live, dEdge) {
      let mx = +inp.mx || 0, my = +inp.my || 0; const l0 = Math.hypot(mx, my); if (l0 > 1) { mx /= l0; my /= l0; }
      const ml = Math.min(1, l0);
      if (ml > .2) { p.fx = Math.round(mx / ml * 100) / 100; p.fy = Math.round(my / ml * 100) / 100; }
      p.dcd = Math.max(0, (p.dcd || 0) - dt); p.dq = Math.max(0, (p.dq || 0) - dt);
      if (live && (dEdge || p.dq > 0)) { if (p.dcd <= 0) { startDash(p); if (p === st.P[p.i]) fx('dash', {s: p.i}); } else if (dEdge && p.dcd < DASH_BUF) p.dq = DASH_BUF; }
      const wet = MAP[tileOf(p)] === '~';
      if (p.ds > 0) {   // dash: instant burst along the facing, easing from 3× to 1.25× walk speed
        p.ds = Math.max(0, p.ds - dt);
        const [dx, dy] = faceV(p), v = SP * (1.25 + 1.75 * p.ds / DASH_T);
        p.vx = dx * v; p.vy = dy * v;
        cornerAssist(p, dx, dy, dt, v);
      } else {
        const tx = mx * SP, ty = my * SP;
        const rate = wet ? WET : ml < .05 ? DEC : (p.vx * tx + p.vy * ty < 0 ? TURN : ACC);
        const k = 1 - Math.exp(-rate * dt);
        p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k;
        if (ml > .05) cornerAssist(p, mx, my, dt, SP * ml);
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const hit = collide(p);
      if (p.ds > 0 && hit > SP * 1.2) { p.ds = 0; if (live && p === st.P[p.i]) fx('bonk', {s: p.i, v: Math.round(hit)}); }
      p.mv = Math.hypot(p.vx, p.vy) > .5 ? 1 : 0;
    }
    function accepts(i, t) {
      const s = st.stn[i]; if (!s || s.s !== 0) return false;
      const tp = STN[typ(i)], nc = s.c.concat([t]);
      return LV.rec.some(r => REC[r].st === tp && subMulti(nc, REC[r].ing));
    }
    function completeRec(i) { const s = st.stn[i], tp = STN[typ(i)]; return LV.rec.find(r => REC[r].st === tp && s.c.length === REC[r].ing.length && subMulti(s.c, REC[r].ing)) || null; }
    function floorNear(p) {
      const [dx, dy] = faceV(p), qx = p.x + dx * .55, qy = p.y + dy * .55;
      let best = -1, bd = .62;
      st.fl.forEach((o, j) => { const d = Math.min(Math.hypot(o.x - qx, o.y - qy), Math.hypot(o.x - p.x, o.y - p.y) + .1); if (d < bd) { bd = d; best = j; } });
      return best;
    }
    function interact(k) {
      const p = st.P[k];
      if (!p.h) { const j = floorNear(p); if (j >= 0) { p.h = st.fl[j].it; st.fl.splice(j, 1); fx('pick', {s: k}); return; } }
      const f = front(p); if (f < 0) return false;
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
    /* ---- throwing ingredients (Overcooked 2 style) ---- */
    /* gentle aim assist (Overcooked 2 style): within ~25° of the facing, snap the throw onto a team-mate with free hands
       or a pot that wants this ingredient, if nothing solid is in between */
    function clearPath(x0, y0, x1, y1, tile) {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / .15);
      for (let j = 1; j <= n; j++) { const x = x0 + (x1 - x0) * j / n, y = y0 + (y1 - y0) * j / n, c = Math.floor(x), r = Math.floor(y); if (r * GW + c === tile) return true; if (solidT(c, r)) return false; }
      return true;
    }
    function throwAim(p, k) {
      const [dx, dy] = faceV(p), H = p.h; let best = null, bc = AIM_COS;
      const tryT = (tx, ty, kind, tile) => {
        const vx = tx - p.x, vy = ty - p.y, d = Math.hypot(vx, vy); if (d < .7 || d > FLY_V * FLY_T * .95) return;
        const cos = (vx * dx + vy * dy) / d; if (cos > bc && clearPath(p.x, p.y, tx, ty, tile)) { bc = cos; best = {dx: vx / d, dy: vy / d, kind, tile, x: tx, y: ty}; }
      };
      st.P.forEach((q, j) => { if (j !== k && !q.h) tryT(q.x, q.y, 'mate', -1); });
      if (H && H.k === 'i' && prepared(H)) for (const i in st.stn) if (accepts(+i, H.t)) tryT(+i % GW + .5, Math.floor(+i / GW) + .5, 'pot', +i);
      return best || {dx, dy, kind: ''};
    }
    function throwIt(k) {
      const p = st.P[k], a = throwAim(p, k);
      if (a.kind) { p.fx = Math.round(a.dx * 100) / 100; p.fy = Math.round(a.dy * 100) / 100; }
      st.fly.push({x: p.x + a.dx * .3, y: p.y + a.dy * .3, vx: a.dx * FLY_V, vy: a.dy * FLY_V, it: p.h, by: k, t: 0});
      p.h = null; fx('throw', {s: k});
    }
    function landOn(i, it) {
      const ch = typ(i);
      if (STN[ch]) { const s = st.stn[i]; if (prepared(it) && accepts(i, it.t)) { s.c.push(it.t); const r = completeRec(i); if (r) { s.r = r; s.s = 1; s.p = 0; } fx('drop', {i}); return true; } return false; }
      if (ch === 'X') { fx('trash', {i}); return true; }
      if (CRATE[ch]) { if (it.t === CRATE[ch] && !it.c) { fx('place', {i}); return true; } return false; }
      if ((ch === '#' || ch === 'C' || ch === 'E') && !st.it[i]) { st.it[i] = it; fx('place', {i}); return true; }
      return false;
    }
    function toFloor(o, x, y) { st.fl.push({x: BX.clamp(x, .35, GW - .35), y: BX.clamp(y, .35, GH - .35), it: o.it}); if (st.fl.length > FLOOR_MAX) st.fl.shift(); fx('flop'); }
    function stepFly(dt) {
      for (let j = st.fly.length - 1; j >= 0; j--) {
        const o = st.fly[j]; let done = false;
        for (let n = 0; n < 3 && !done; n++) {
          const px = o.x, py = o.y; o.x += o.vx * dt / 3; o.y += o.vy * dt / 3;
          // a partner with free hands catches it
          for (let q = 0; q < st.P.length; q++) { const P = st.P[q]; if (P.h || (q === o.by && o.t < .3)) continue; if (Math.hypot(P.x - o.x, P.y - o.y) < CATCH_R) { P.h = o.it; fx('catch', {s: q}); done = true; break; } }
          if (done) break;
          const c = Math.floor(o.x), r = Math.floor(o.y);
          if (solidT(c, r)) { const i = c >= 0 && r >= 0 && c < GW && r < GH ? r * GW + c : -1; if (!(i >= 0 && landOn(i, o.it))) toFloor(o, px, py); done = true; }
        }
        o.t += dt;
        if (!done && o.t >= FLY_T) { toFloor(o, o.x, o.y); done = true; }
        if (done) st.fly.splice(j, 1);
      }
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
        let inp = inputs[k] || {};
        // unreliable channel: ignore an out-of-order (older) guest input packet
        if (inp.sq != null) { const gi = goodIn[k]; if (gi && gi.sq != null && inp.sq < gi.sq) inp = gi; else goodIn[k] = inp; if (inp.sq !== p.sq) { p.sq = inp.sq; p.sn = 0; } p.sn = (p.sn || 0) + 1; }
        p.px = p.x; p.py = p.y;
        const dc = inp.d | 0, dEdge = dc !== lastD[k]; lastD[k] = dc;
        moveP(p, inp, dt, st.ph === 'play', dEdge);
        p.tg = pickFront(p, p.tg);
        const a = inp.a | 0;
        if (a !== lastA[k]) { lastA[k] = a; if (st.ph === 'play') { p.ib = interact(k) === false ? IBUF : 0; } }
        else if (p.ib > 0) { p.ib = Math.max(0, p.ib - dt); if (st.ph === 'play' && (p.tg >= 0 || (!p.h && floorNear(p) >= 0))) { p.ib = 0; interact(k); } }   // pressed a moment too early: do it when the station comes into reach
        const u = !!inp.u, uEdge = u && !lastU[k]; lastU[k] = u;
        if (uEdge && st.ph === 'play' && p.h && p.h.k === 'i') { throwIt(k); p.act = ''; }
        else if (u && st.ph === 'play') use(k, dt); else p.act = '';
      });
      stepFly(dt);
      if (st.ph === 'ready') { st.t -= dt; if (st.t <= 0) { st.ph = 'play'; fx('go'); } return; }
      st.left -= dt;
      for (const i in st.stn) {
        const s = st.stn[i];
        if (s.s === 1) { s.p += dt / cookT(s.r); if (s.p >= 1) { s.s = 2; s.p = 0; fx('ding', {i: +i}); } }
        else if (s.s === 2) { s.p = assist ? Math.min(.4, s.p + dt / grace) : s.p + dt / grace; if (s.p >= 1) { s.s = 3; s.p = 0; s.c = []; s.r = null; s.e = 0; fx('fire', {i: +i}); } }
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
    let aiCmd = '';   // player's order to the AI partner (ai mode): '' free · prep · wash · serve
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
    function decide(k, guide) {
      const p = st.P[k], H = p.h, m = aiM[k], B = bfs(p);
      const cmd = guide || !ctx.isBot(k) ? '' : (aiCmd || (LV.tut && !BX.bot ? 'tut' : '')), noFetch = cmd === 'wash' || cmd === 'serve' || cmd === 'tut', noPlate = cmd === 'prep' || cmd === 'tut';
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
      if (cmd === 'wash' && (st.sink.n > 0 || st.dret > 0)) return st.sink.n > 0 ? G(sinkT, 'u', 'dish') : G(dretT, 'a', 'dish');
      const done = Object.keys(st.stn).map(Number).filter(i => st.stn[i].s === 2);
      const soon = Object.keys(st.stn).map(Number).filter(i => st.stn[i].s === 1 && st.stn[i].p > .45);
      const plateHolders = st.P.filter((q, j) => j !== k && q.h && q.h.k === 'p' && !q.h.x && !q.h.d).length + otherJob(k, 'plate');
      if (!noPlate && (done.length + soon.length) > plateHolders) {
        if (st.rack > 0) return G(rackT, 'a', 'plate');
        if (st.sink.n > 0) return G(sinkT, 'u', 'plate');
        if (st.dret > 0) return G(dretT, 'a', 'plate');
        const loose = Object.keys(st.it).map(Number).filter(i => st.it[i].k === 'p' && !st.it[i].x && !st.it[i].d);
        if (loose.length) return G(nearest(B, loose), 'a', 'plate');
      }
      // dishes lying on counters → serve
      const dishes = Object.keys(st.it).map(Number).filter(i => st.it[i].k === 'p' && st.it[i].d && ordersWant(st.it[i].d));
      if (dishes.length && !noPlate) return G(nearest(B, dishes, i => otherGoal(k, i)), 'a', 'serve');
      if (noFetch) { if ((st.sink.n > 0 || st.dret > 0) && st.rack < 4) return st.sink.n > 0 ? G(sinkT, 'u', 'dish') : G(dretT, 'a', 'dish'); return null; }
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
      if (!noPlate && st.rack === 0 && (st.sink.n > 0 || st.dret > 0) && !otherJob(k, 'dish')) return st.sink.n > 0 ? G(sinkT, 'u', 'dish') : G(dretT, 'a', 'dish');
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
      if (!noPlate && (st.sink.n > 0 || st.dret > 0) && st.rack < 3 && !otherJob(k, 'dish')) return st.sink.n > 0 ? G(sinkT, 'u', 'dish') : G(dretT, 'a', 'dish');
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
        const tkH = BX.clamp(w * .34, 120, 150), extra = 66;
        const availH = h - ch - top - tkH - 10, ts = Math.min((w - 12) / GW, (availH - extra) / GH);
        L.ts = ts; L.ox = (w - ts * GW) / 2; L.oy = top + tkH + 6 + Math.max(0, (availH - extra - ts * GH) / 2);
        L.below = {x: w / 2, y: L.oy + ts * GH + ts * .3 + 4, w: w - 12};
        if (!two) L.cmd = {x: 6, y: L.below.y + 26, w: w - 12, cols: 5};
        L.tk = {x: 6, y: top + 4, w: w - 12 - 72, h: tkH - 8, rows: 2}; L.pill = {x: w - 72, y: top + 4, w: 66, h: tkH - 8, vert: true};
        if (touch) {
          const mk = (y0, slot) => ({slot, zone: {x: 0, y: y0, w: w * .55, h: ch}, bx: w * .24, by: y0 + ch / 2, R: Math.min(56, ch * .34),
            A: {x: w * .84, y: y0 + ch * .4, r: Math.min(40, ch * .25)}, U: {x: w * .62, y: y0 + ch * .6, r: Math.min(33, ch * .21)},
            Dh: {x: w * .91, y: y0 + ch * .84, r: Math.min(23, ch * .14)}});
          L.ctrls.push(mk(h - ch, 0)); if (two) L.ctrls.push(mk(0, 1));
        } else L.hint = {x: w / 2, y: h - 15};
      } else {
        const side = touch ? BX.clamp(w * .19, 120, 230) : 0;
        const tkH = BX.clamp(h * .2, 66, 104), hint = touch ? 0 : 26;
        const aw = w - side * 2 - 8, ah = h - tkH - hint - 8, ts = Math.min(aw / GW, ah / GH);
        L.ts = ts; L.ox = side + (w - side * 2 - ts * GW) / 2; L.oy = tkH + 4 + (ah - ts * GH) / 2;
        if (touch) { L.tk = {x: side + 4, y: 4, w: w - side * 2 - 8, h: tkH - 8}; L.pill = {x: 6, y: 6, w: side - 12, h: 40, split: w - side + 6}; if (!two) L.cmd = {x: 6, y: 72, w: side - 12, cols: 2}; }
        else { L.tk = {x: L.ox, y: 4, w: Math.max(200, ts * GW - 170), h: tkH - 8}; L.pill = {x: L.ox + ts * GW - 160, y: 6, w: 160, h: tkH - 12}; if (L.ox > 120) L.cmd = {x: Math.max(6, L.ox - 118), y: L.oy + 8, w: 104, cols: 1}; }
        if (touch) {
          const R = Math.min(60, side * .33);
          if (!two) {
            L.ctrls.push({slot: 0, zone: {x: 0, y: 50, w: side + (w - 2 * side) * .15, h: h - 50}, bx: side / 2, by: h - R - 22, R,
              A: {x: w - side * .38, y: h - 70, r: Math.min(44, side * .25)}, U: {x: w - side * .74, y: h - 44, r: Math.min(36, side * .2)},
              Dh: {x: w - side * .3, y: h - 70 - Math.min(44, side * .25) - 36, r: Math.min(25, side * .15)}});
          } else {
            for (const slot of [0, 1]) {
              const x0 = slot ? w - side : 0;
              L.ctrls.push({slot, zone: {x: x0, y: h * .55, w: side, h: h * .45}, bx: x0 + side / 2, by: h - R - 16, R: Math.min(R, h * .14),
                A: {x: x0 + side * (slot ? .3 : .7), y: h * .34, r: Math.min(36, side * .21)}, U: {x: x0 + side * (slot ? .72 : .28), y: h * .42, r: Math.min(30, side * .18)},
                Dh: {x: x0 + side * (slot ? .3 : .7), y: h * .34 + Math.min(36, side * .21) + 26, r: Math.min(21, side * .13)}});
            }
          }
        } else L.hint = {x: w / 2, y: h - 13};
      }
      return L;
    }
    /* ---------- input ---------- */
    const aCount = [0, 0], dCount = [0, 0], joy = [{x: 0, y: 0}, {x: 0, y: 0}], joyRaw = [{x: 0, y: 0}, {x: 0, y: 0}], ptrs = new Map(), press = [0, 0, 0, 0, 0, 0];
    /* stick shaping: radial dead zone, full speed at 80 % throw (no need to reach the rim), gentle curve for fine moves,
       and a ±11° snap to the four axes so walking along a counter stays straight */
    function shapeJoy(dx, dy) {
      const m = Math.min(1, Math.hypot(dx, dy)); if (m < JOY_DZ) return {x: 0, y: 0};
      const mm = Math.pow(Math.min(1, (m - JOY_DZ) / (JOY_SAT - JOY_DZ)), JOY_POW);
      let a = Math.atan2(dy, dx); const q = Math.round(a / (Math.PI / 2)) * (Math.PI / 2); if (Math.abs(a - q) < JOY_SNAP) a = q;
      return {x: Math.cos(a) * mm, y: Math.sin(a) * mm};
    }
    const localPop = slot => { const s2 = ctx.mySeats[slot]; if (s2 != null && !ctx.isHost) pop[s2] = Math.max(pop[s2], .45); };
    function hitCtrl(pt) {
      const L = layout();
      for (const f of [1, 1.3]) for (const c of L.ctrls) for (const [b, type] of [[c.Dh, 'D'], [c.A, 'A'], [c.U, 'U']]) {
        if (b && Math.hypot(pt.x - b.x, pt.y - b.y) < b.r * f) return {type, slot: c.slot};
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
      if (hit.type === 'A') { aCount[hit.slot]++; press[hit.slot * 2] = 1; localPop(hit.slot); }
      if (hit.type === 'U') press[hit.slot * 2 + 1] = 1;
      if (hit.type === 'D') { dCount[hit.slot]++; press[4 + hit.slot] = 1; }
      if (hit.type === 'J') { joy[hit.slot] = {x: 0, y: 0}; joyRaw[hit.slot] = {x: 0, y: 0}; }
    });
    ctx.on(cv.cv, 'pointermove', e => {
      const t = ptrs.get(e.pointerId); if (!t || t.type !== 'J') return;
      const pt = cv.pos(e); t.x = pt.x; t.y = pt.y;
      let dx = (pt.x - t.ox) / t.R, dy = (pt.y - t.oy) / t.R; const l = Math.hypot(dx, dy);
      if (l > 1) { t.ox = pt.x - dx / l * t.R; t.oy = pt.y - dy / l * t.R; dx /= l; dy /= l; }   // floating base follows the thumb
      joyRaw[t.slot] = {x: dx, y: dy}; joy[t.slot] = shapeJoy(dx, dy);
    });
    const up = e => { const t = ptrs.get(e.pointerId); if (t && t.type === 'J') { joy[t.slot] = {x: 0, y: 0}; joyRaw[t.slot] = {x: 0, y: 0}; } ptrs.delete(e.pointerId); };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    const K = (a, b, c, d) => { const k = ctx.keys; return {x: (k.has(d) ? 1 : 0) - (k.has(c) ? 1 : 0), y: (k.has(b) ? 1 : 0) - (k.has(a) ? 1 : 0)}; };
    function input(seat, slot, nLocal, peek) {
      const wasd = K('KeyW', 'KeyS', 'KeyA', 'KeyD'), arr = K('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
      const kk = nLocal >= 2 ? (slot ? arr : wasd) : {x: wasd.x || arr.x, y: wasd.y || arr.y};
      const sl = nLocal >= 2 ? slot : 0;
      let mx = kk.x, my = kk.y; if (!mx && !my) { mx = joy[sl].x; my = joy[sl].y; }
      const uk = nLocal >= 2 ? U_KEYS[slot] : U_KEYS[0].concat(U_KEYS[1]);
      let u = uk.some(c => ctx.keys.has(c));
      for (const t of ptrs.values()) if (t.type === 'U' && t.slot === sl) u = true;
      const o = {mx: Math.round(mx * 100) / 100, my: Math.round(my * 100) / 100, a: aCount[sl], u, d: dCount[sl]};
      if (!ctx.isHost && !peek) { o.sq = ++sentSeq; lastSent = o; sqTick.set(o.sq, predTick); if (sqTick.size > 240) sqTick.delete(sqTick.keys().next().value); }
      return o;
    }
    function key(e) {
      if (e.repeat) return;
      const n = ctx.mySeats.length;
      if (n >= 2) { for (const s of [0, 1]) { if (A_KEYS[s].includes(e.code)) aCount[s]++; if (D_KEYS[s].includes(e.code)) dCount[s]++; } }
      else { if (A_KEYS[0].includes(e.code) || A_KEYS[1].includes(e.code)) { aCount[0]++; localPop(0); } if (D_KEYS[0].includes(e.code) || D_KEYS[1].includes(e.code)) dCount[0]++; }
    }
    /* ---------- online guest: move my own chef locally (prediction) and reconcile with the host's snapshots ---------- */
    let sentSeq = 0, lastSent = null, predTick = 0, pred = null, predAcc = 0, predLastD = 0, snapT = 0;
    const sqTick = new Map(), predHist = [], visOff = {x: 0, y: 0};
    const predOn = () => ctx.online && !ctx.isHost && ctx.mySeats.length === 1 && !st.over;
    function predStep(dt) {
      const me = ctx.me, hp = st.P[me]; if (!hp) return;
      if (!pred) { pred = {x: hp.x, y: hp.y, vx: hp.vx || 0, vy: hp.vy || 0, fx: hp.fx, fy: hp.fy, ds: 0, dcd: 0, dq: 0, i: me, h: hp.h, tg: -1, mv: 0}; predLastD = lastSent ? lastSent.d | 0 : 0; }
      pred.h = hp.h;
      predAcc += dt; let n = 0;
      while (predAcc >= 1 / 60 && n < 4) {
        predAcc -= 1 / 60; n++;
        pred.px = pred.x; pred.py = pred.y;
        const inp = input(me, 0, 1, true), dc = inp.d | 0, dEdge = dc !== predLastD; predLastD = dc;   // freshest local input (the host gets the same one on the next send)
        const wasDash = pred.ds;
        moveP(pred, inp, 1 / 60, st.ph === 'play', dEdge);
        if (!wasDash && pred.ds > 0) { ctx.sfx('swish'); predDashFx = 1; }
        predTick++; predHist.push([predTick, pred.x, pred.y]); if (predHist.length > 120) predHist.shift();
      }
      if (n >= 4) predAcc = 0;
      pred.tg = pickFront(pred, pred.tg);
    }
    let predDashFx = 0;
    function reconcile() {
      const hp = st.P[ctx.me]; if (!pred || !hp) return;
      const t0 = hp.sq != null ? sqTick.get(hp.sq) : null;
      let h = null;
      if (t0 != null) { const tk = t0 + (hp.sn || 0); h = tk >= predTick ? [predTick, pred.x, pred.y] : predHist.find(q => q[0] === tk); }
      const ex = h ? hp.x - h[1] : hp.x - pred.x, ey = h ? hp.y - h[2] : hp.y - pred.y, e = Math.hypot(ex, ey);
      if (!h && e < .6) return;                    // no matching input yet (e.g. AI stood in during a reconnect): only fix big errors
      const k = e > 1.2 || !h ? 1 : e > .05 ? .4 : 0; if (!k) return;
      pred.x += ex * k; pred.y += ey * k; pred.px += ex * k; pred.py += ey * k;
      if (e < 1.2) { visOff.x -= ex * k; visOff.y -= ey * k; } else { visOff.x = visOff.y = 0; pred.vx = hp.vx || 0; pred.vy = hp.vy || 0; }
      for (const q of predHist) { q[1] += ex * k; q[2] += ey * k; }
    }

    /* ================= action preview, guide arrow, partner commands ================= */
    /* what 拿/放 (a) and 使用 (u) would do at tile f while holding H */
    function labelsAt(H, f) {
      let a = '', u = '';
      const ch = f >= 0 ? typ(f) : '.';
      if (f >= 0) {
        if (CRATE[ch]) a = !H ? '拿' + ING[CRATE[ch]].n : H.k === 'i' && H.t === CRATE[ch] && !H.c ? '放回' : '';
        else if (STN[ch]) { const s2 = st.stn[f]; if (H && H.k === 'i' && prepared(H) && accepts(f, H.t)) a = '下锅'; else if (H && H.k === 'p' && !H.x && !H.d && s2.s === 2) a = '装盘'; }
        else if (ch === 'L') a = !H && st.rack > 0 ? '拿盘子' : H && H.k === 'p' && !H.x && !H.d ? '放回' : '';
        else if (ch === 'H') a = H && H.k === 'p' && H.d ? '上菜' : '';
        else if (ch === 'D') a = !H && st.dret > 0 ? '拿脏盘' : '';
        else if (ch === 'K') a = H && H.k === 'p' && H.x ? '放进水槽' : '';
        else if (ch === 'X') a = H && (H.k === 'i' || (H.k === 'p' && H.d)) ? '倒掉' : '';
        else if (ch === '#' || ch === 'C' || ch === 'E') { const it = st.it[f]; if (H && !it) a = ch === 'C' && H.k !== 'i' ? '' : '放下'; else if (!H && it) a = '拿起'; else if (H && it && H.k === 'p' && !H.x && !H.d && it.k === 'p' && it.d) a = '装盘'; }
      }
      if (H && H.k === 'e') u = '灭火'; else if (H && H.k === 'i') u = '扔出';
      else if (!H && ch === 'C') { const it = st.it[f]; if (it && it.k === 'i' && ING[it.t].chop && !it.c) u = '切菜'; }
      else if (!H && ch === 'K' && st.sink.n > 0) u = '洗碗';
      return {a, u};
    }
    function useful(H, f) {
      const l = labelsAt(H, f);
      return !!l.a || l.u === '切菜' || l.u === '洗碗' || (l.u === '灭火' && st.stn[f] && st.stn[f].s === 3);
    }
    function preview(k, p) {
      p = p || st.P[k]; const H = p.h, f = front(p), l = labelsAt(H, f);
      let aim = null;
      if (!H && floorNear(p) >= 0) l.a = '捡起';
      if (H && H.k === 'i') { aim = throwAim(p, k); if (aim.kind === 'mate') l.u = '扔给队友'; else if (aim.kind === 'pot') l.u = '扔进锅'; }
      return {a: l.a, u: l.u, f, aim};
    }
    function guideText(k, g) {
      const p = st.P[k], H = p.h, ch = typ(g.i), act = g.act, it = st.it[g.i];
      if (CRATE[ch]) return `去「${ING[CRATE[ch]].ch}」箱拿${ING[CRATE[ch]].n}`;
      if (!H && it && it.k === 'e') return '着火了！快拿灭火器';
      if (ch === 'C') return act === 'u' ? '按住「使用」把食材切好' : H ? '把食材放到砧板上' : '拿起切好的' + (it && it.k === 'i' ? ING[it.t].prep : '食材');
      if (STN[ch]) {
        const nm = STN_NAME[STN[ch]];
        if (act === 'u') return '对着着火的锅按住「使用」灭火！';
        if (act === 'w') return `拿好盘子，等${nm}里的菜做好`;
        if (H && H.k === 'p') return `对着${nm}按「拿/放」装盘`;
        if (H && H.k === 'i') return `把${ING[H.t].prep}放进${nm}`;
      }
      if (ch === 'L') return H ? '把空盘子放回盘架' : '去盘架拿一个干净盘子';
      if (ch === 'H') return '把菜送到「出菜」窗口';
      if (ch === 'D') return '去回收口拿脏盘子';
      if (ch === 'K') return act === 'u' ? '按住「使用」洗碗' : '把脏盘子放进水槽';
      if (ch === 'X') return '这个用不上了，倒进垃圾桶';
      if (H && H.k === 'e') return '把灭火器放回去';
      if (H) return '先放在空柜台上';
      return '拿起柜台上的' + (it && it.k === 'p' ? '菜' : '东西');
    }
    const guideSeats = () => BX.bot ? [] : ctx.mySeats.filter(s2 => !ctx.isBot(s2));
    let guides = [], guideCalcT = 0, guideUntil = 0;
    function calcGuides() {
      guides = [];
      if (st.ph !== 'play' || st.over) return;
      for (const k of guideSeats()) {
        let g = null; try { g = decide(k, true); } catch (e) { g = null; }
        if (g && g.i >= 0) guides.push({k, i: g.i, txt: guideText(k, g)});
        else guides.push({k, i: -1, txt: st.orders.length ? '手上的活都安排好了，看看订单' : '等客人点单…'});
      }
    }
    const guideOn = () => LV.tut || tAll < guideUntil;
    let cmdBox = null, cmdKey = '';
    if (ctx.mode === 'ai' && !BX.bot && ctx.mySeats.length === 1 && !LV.tut) {
      cmdBox = BX.h('div', {style: 'position:absolute;display:grid;gap:5px;align-items:center'});
      cmdBox.append(BX.h('div', {text: '伙伴', style: 'color:#f3e2c0;font-size:13px;font-weight:700;text-align:center;opacity:.85'}));
      for (const [c, n] of CMDS) {
        const b = BX.h('button', {class: 'bx-btn ghost', text: n, style: 'min-height:40px;padding:2px 4px;font-size:14px;border-radius:10px', on: {click: () => {
          aiCmd = c; ctx.sfx('click'); ctx.toast(c ? '伙伴：好，我专心' + n + '！' : '伙伴：我自己看着办～'); syncCmd();
        }}});
        b.dataset.c = c; cmdBox.append(b);
      }
      ctx.ui('kc-cmd').append(cmdBox);
    }
    function syncCmd() { if (cmdBox) for (const b of cmdBox.querySelectorAll('button')) b.className = 'bx-btn ' + (b.dataset.c === aiCmd ? 'jade' : 'ghost'); }
    syncCmd();
    function placeCmd(L) {
      if (!cmdBox) return;
      const c = L.cmd, key = c ? [c.x, c.y, c.w, c.cols].map(Math.round).join() : 'none';
      if (key === cmdKey) return; cmdKey = key;
      if (!c) { cmdBox.style.display = 'none'; return; }
      Object.assign(cmdBox.style, {display: 'grid', left: c.x + 'px', top: c.y + 'px', width: c.w + 'px', gridTemplateColumns: `repeat(${c.cols},1fr)`});
      cmdBox.firstChild.style.gridColumn = c.cols === 2 ? 'span 2' : '';
    }

    /* ================= effects / audio (local) ================= */
    let seenEv = 0, chopSnd = 0, sprSnd = 0, tAll = 0;
    const parts = [], floats = [], tkSeen = new Map(), tkGone = [], pop = [0, 0], disp = st.P.map(p => ({x: p.x, y: p.y, ph: 0, fx: p.fx, fy: p.fy}));
    let lastL = null, banner = null; const prevs = [null, null];
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
          case 'fail': ctx.sfx('buzz'); ctx.buzz(25); tkGone.push({id: e.o, t: 0, ok: false}); if (L) floats.push({x: L.tk.x + 40, y: L.tk.y + L.tk.h, t: 0, s: '-10', col: '#ff7b6b'}); break;
          case 'ding': ctx.sfx('bell'); if (at) burst(at[0], at[1] - 10, 8, '#fff6c0', 70, .6, 'star'); break;
          case 'fire': ctx.sfx('boom'); ctx.toast('着火了！快拿灭火器！'); ctx.buzz(40); break;
          case 'throw': ctx.sfx('whoosh'); break;
          case 'catch': ctx.sfx('pop'); if (L) { const p = st.P[e.s]; burst(L.ox + p.x * L.ts, L.oy + (p.y - .4) * L.ts, 8, '#ffe08a', 70, .5, 'star'); } break;
          case 'flop': ctx.sfx('hit'); break;
          case 'bonk': ctx.sfx('hit'); pop[e.s] = .8; if (ctx.isLocal(e.s)) ctx.buzz(Math.min(25, 6 + e.v * 1.5)); if (L) { const p = st.P[e.s]; burst(L.ox + p.x * L.ts, L.oy + (p.y - .1) * L.ts, 6, 'rgba(255,240,210,.9)', 70, .35, 'star'); } break;
          case 'dash': if (predOn() && e.s === ctx.me) break; ctx.sfx('swish'); if (L) { const p = st.P[e.s]; burst(L.ox + p.x * L.ts, L.oy + (p.y + .2) * L.ts, 7, 'rgba(230,210,170,.8)', 50, .45); } break;
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
      ctx.status(`${lv ? '第' + lv + '关' : '教学'} · ${LV.name}　⏱ ${m}:${String(s).padStart(2, '0')}　金币 ${st.coins}　${'★'.repeat(sr)}${'☆'.repeat(3 - sr)}` + (sr < 3 ? `（下一星差 ${stars[sr] - st.coins}）` : ''));
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
    function drawTicket(g, o, x, y, w, h, k, gone, glow) {
      const r = REC[o.r], frac = BX.clamp(o.p / o.pm, 0, 1);
      g.save();
      const shake = frac < .25 && !gone ? Math.sin(tAll * 30) * 1.5 : 0;
      g.translate(x + w / 2 + shake, y + h / 2); g.scale(k, k); g.translate(-w / 2, -h / 2);
      if (glow) { g.shadowColor = '#ffd34d'; g.shadowBlur = 14; g.fillStyle = '#ffd34d'; D.rr(g, -3, -3, w + 6, h + 6, 8); g.fill(); }
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
      g.fillStyle = '#fffaf0'; D.rr(g, 0, 0, w, h, 6); g.fill(); g.shadowColor = 'transparent';
      if (w > h * 1.55) {   // wide ticket (landscape phones): dish on the left, name + recipe on the right
        const hb = h * .3;
        g.fillStyle = frac < .25 ? '#c23a2b' : '#8a2a20'; D.rr(g, 0, 0, w, hb, 6); g.fill(); g.fillRect(0, hb * .5, w, hb * .5);
        D.text(g, r.n, w / 2, hb / 2 + 1, {size: Math.min(hb * .78, w * .2), color: '#fff3e0', weight: 800});
        const ds = Math.min(h - hb - 8, w * .36); drawPlate(g, 4 + ds / 2, hb + 2 + ds / 2, ds * 1.12, false); drawDish(g, 4 + ds / 2, hb + 2 + ds * .48, ds, o.r);
        const n = r.ing.length, x0 = ds + 8, is = Math.min(h - hb - 10, (w - x0 - 4) / (n + 1)), rowY = hb + (h - hb - 6) / 2 + 1;
        for (let j = 0; j < n; j++) drawIng(g, x0 + is * (j + .5), rowY, is * 1.35, r.ing[j], ING[r.ing[j]].chop);
        seal(g, x0 + is * (n + .5), rowY, is * .78, STN_CH[r.st], '#3f7f6b');
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(4, h - 5, w - 8, 3.5);
        g.fillStyle = frac > .5 ? '#3f9a4a' : frac > .25 ? '#e0a020' : '#d0533f'; g.fillRect(4, h - 5, (w - 8) * frac, 3.5);
        g.restore(); return;
      }
      g.fillStyle = frac < .25 ? '#c23a2b' : '#8a2a20'; D.rr(g, 0, 0, w, h * .2, 6); g.fill(); g.fillRect(0, h * .1, w, h * .1);
      D.text(g, r.n, w / 2, h * .1, {size: Math.min(h * .15, w * .17), color: '#fff3e0', weight: 800});
      const ds = Math.min(h * .4, w * .5); drawPlate(g, w / 2, h * .2 + ds * .5, ds * 1.15, false); drawDish(g, w / 2, h * .2 + ds * .48, ds, o.r);
      const n = r.ing.length, is = Math.min(h * .27, (w - 8) / (n + 1.3)), rowY = h * .78 - is * .1;
      let ix = w / 2 - (n * is + is * .8) / 2 + is / 2;
      g.fillStyle = 'rgba(200,160,100,.18)'; D.rr(g, 3, rowY - is * .55, w - 6, is * 1.1, 4); g.fill();
      for (const t of r.ing) { drawIng(g, ix, rowY, is * 1.45, t, ING[t].chop); ix += is; }
      seal(g, ix - is * .05, rowY, is * .72, STN_CH[r.st], '#3f7f6b');
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
        const kx = bx + joyRaw[c.slot].x * c.R * .9, ky = by + joyRaw[c.slot].y * c.R * .9;
        D.disc(g, kx, ky, c.R * .42, col, {ring: 'rgba(255,255,255,.5)'});
        const seat = ctx.mySeats[c.slot], pv = (seat != null && prevs[seat]) || {};
        const uHold = pv.u === '切菜' || pv.u === '洗碗' || pv.u === '灭火';
        const btns = [[c.A, pv.a || '拿/放', '', 0, pv.a ? 1 : .8], [c.U, pv.u || '使用', pv.u ? (uHold ? '按住' : '') : '按住', 1, pv.u ? 1 : .8]];
        if (c.Dh) btns.push([c.Dh, '冲刺', '', 2, seat != null && st.P[seat] && st.P[seat].dcd > 0 ? .45 : .9]);
        for (const [b, lab, sub, i, al] of btns) {
          const held = [...ptrs.values()].some(t => t.slot === c.slot && t.type === ['A', 'U', 'D'][i]);
          const pr = (i === 2 ? press[4 + c.slot] : press[c.slot * 2 + i]) || held ? 1 : 0;
          g.globalAlpha = al;
          D.disc(g, b.x, b.y + pr * 2, b.r, i === 1 ? '#3f7f6b' : i === 2 ? '#8a6a3c' : col, {ring: 'rgba(255,255,255,.55)'});
          const fs = b.r * (lab.length > 3 ? .34 : lab.length > 2 ? .4 : .46);
          D.text(g, lab, b.x, b.y + pr * 2 - (sub ? b.r * .12 : 0), {size: fs, color: '#fff', weight: 800, shadow: true});
          if (sub) D.text(g, sub, b.x, b.y + pr * 2 + b.r * .36, {size: b.r * .26, color: 'rgba(255,255,255,.8)'});
          g.globalAlpha = 1;
        }
        if (L.ctrls.length > 1) D.text(g, ctx.name(ctx.mySeats[c.slot]), c.bx, c.by - c.R - 12, {size: 12, color: 'rgba(255,240,210,.8)'});
      }
      press.fill(0);
    }

    /* the position/state used to DRAW chef k: host → interpolated between 60 Hz steps; guest → own chef predicted, partner extrapolated */
    const viewS = [{}, {}];
    function viewP(k) { return viewS[k].p || st.P[k]; }
    function updView(dt) {
      const ex = 1 - Math.exp(-22 * dt);
      st.P.forEach((p, k) => {
        const d = disp[k]; let x, y, vp = p;
        if (ctx.isHost) { const a = ctx.alpha; x = BX.lerp(p.px != null ? p.px : p.x, p.x, a); y = BX.lerp(p.py != null ? p.py : p.y, p.y, a); }
        else if (predOn() && k === ctx.me && pred) { const a = BX.clamp(predAcc * 60, 0, 1); x = BX.lerp(pred.px, pred.x, a) + visOff.x; y = BX.lerp(pred.py, pred.y, a) + visOff.y; vp = pred; }
        else { const lag = Math.min(.12, tAll - snapT), tx = p.x + (p.vx || 0) * lag, ty = p.y + (p.vy || 0) * lag; x = d.x + (tx - d.x) * ex; y = d.y + (ty - d.y) * ex; if (Math.hypot(tx - x, ty - y) > 2) { x = tx; y = ty; } }
        d.x = x; d.y = y; viewS[k].p = vp;
      });
      const dec = Math.exp(-12 * dt); visOff.x *= dec; visOff.y *= dec;
    }
    function draw(dt) {
      tAll += dt;
      if (predOn()) predStep(dt); else pred = null;
      updView(dt);
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
          if (s.s === 0 && s.c.length) {   // what is already inside (Overcooked-style icon bubble)
            const n = s.c.length, bw = ts * (.36 * n + .14), bx = cx - bw / 2, by = y - ts * .5;
            g.fillStyle = 'rgba(255,250,240,.95)'; D.rr(g, bx, by, bw, ts * .42, ts * .12); g.fill(); g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 1; g.stroke();
            s.c.forEach((t, j) => drawIng(g, bx + ts * (.25 + .36 * j), by + ts * .21, ts * .5, t, true));
          }
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
      const tags = [];
      st.P.forEach((p0, k) => {
        if (!ctx.isLocal(k)) return;
        const p = viewP(k), pv = preview(k, p); prevs[k] = pv;
        // truthful throw preview: dotted arc onto the assisted target (team-mate / pot)
        if (pv.aim && pv.aim.kind && !BX.bot) {
          const a = pv.aim, x0 = L.ox + p.x * ts, y0 = L.oy + p.y * ts, x1 = L.ox + a.x * ts, y1 = L.oy + a.y * ts, dd = Math.hypot(a.x - p.x, a.y - p.y), T = dd / FLY_V;
          g.fillStyle = D.alpha(PAL[k], .75);
          for (let j = 1; j < 9; j++) { const q = j / 9, ph = (q + tAll * .8) % 1, x = x0 + (x1 - x0) * ph, y = y0 + (y1 - y0) * ph - flyH(ph * T) * ts; D.circle(g, x, y, Math.max(1.5, ts * .045)); g.fill(); }
          g.strokeStyle = D.alpha(PAL[k], .8); g.lineWidth = 2; g.beginPath(); g.ellipse(x1, y1 + ts * .1, ts * .28, ts * .12, 0, 0, 7); g.stroke();
        }
        const f = front(p); if (f < 0 || MAP[f] === '.' || MAP[f] === '~') return;
        const x = L.ox + (f % GW) * ts, y = L.oy + Math.floor(f / GW) * ts, act = pv.a || pv.u;
        g.fillStyle = D.alpha(PAL[k], act ? .16 : .06); D.rr(g, x + 2, y + 2, ts - 4, ts * .8 - 2, ts * .12); g.fill();
        g.strokeStyle = D.alpha(PAL[k], (act ? .7 : .4) + .25 * Math.sin(tAll * 6)); g.lineWidth = Math.max(2, ts * (act ? .07 : .045)); g.setLineDash([ts * .15, ts * .1]); D.rr(g, x + 2, y + 2, ts - 4, ts * .8 - 2, ts * .12); g.stroke(); g.setLineDash([]);
        if (act && ctx.pref('hints') && !BX.bot) tags.push({x: x + ts / 2, y: y + ts * .86, s: [pv.a, pv.u].filter(Boolean).join(' · '), col: PAL[k]});
      });
      // things lying on the floor
      for (const o of st.fl) { const x = L.ox + o.x * ts, y = L.oy + o.y * ts; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + ts * .14, ts * .24, ts * .08, 0, 0, 7); g.fill(); drawItem(g, x, y, ts * .62, o.it); }
      // chefs (sorted by depth)
      const order = st.P.map((p, k) => k).sort((a, b) => st.P[a].y - st.P[b].y);
      for (const k of order) {
        const p = st.P[k], d = disp[k], vp = viewP(k);
        // smooth facing (the held item swings round instead of popping side to side)
        { const kf = 1 - Math.exp(-28 * dt); d.fx += (vp.fx - d.fx) * kf; d.fy += (vp.fy - d.fy) * kf; const fl = Math.hypot(d.fx, d.fy); if (fl < .3) { d.fx = vp.fx; d.fy = vp.fy; } }
        d.ph += dt * (vp.mv ? 14 : 3);
        pop[k] = Math.max(0, pop[k] - dt * 5); d.st = Math.max(0, (d.st || 0) - dt * 6);
        const dashing = vp.ds > 0;
        if (dashing && !d.wasDash) d.st = 1;
        d.wasDash = dashing;
        if (dashing || (d.trail && d.trail.length)) { d.trail = d.trail || []; if (dashing) d.trail.push([d.x, d.y, tAll]); while (d.trail.length && (tAll - d.trail[0][2] > .14 || d.trail.length > 6)) d.trail.shift(); }
        if (d.trail) d.trail.forEach(([tx, ty, tt], j) => { if (j % 2) return; g.globalAlpha = .22 * (1 - (tAll - tt) / .14); drawChef(g, L.ox + tx * ts, L.oy + (ty + .28) * ts, ts * 1.05, PAL[k], d.fx, d.fy, d.ph, true, -.25, null, ''); g.globalAlpha = 1; });
        const sx = L.ox + d.x * ts, sy = L.oy + (d.y + .28) * ts;
        drawChef(g, sx, sy, ts * 1.05, PAL[k], d.fx, d.fy, d.ph, !!vp.mv, pop[k] - d.st * .35 + (p.act === 'chop' ? Math.abs(Math.sin(tAll * 18)) * .4 : 0), p.h, String(k + 1));
        if (p.act === 'ext') {
          const ax = Math.abs(p.fx) >= Math.abs(p.fy), dx = ax ? Math.sign(p.fx) : 0, dy = ax ? 0 : Math.sign(p.fy);
          for (let n = 0; n < 2; n++) parts.push({x: sx + dx * ts * .3, y: sy - ts * .3 + dy * ts * .2, vx: dx * ts * 3 + (Math.random() - .5) * ts, vy: dy * ts * 3 + (Math.random() - .5) * ts, life: .35, max: .35, col: '#f4f8ff', kind: 'dot', r: ts * .08});
          if ((sprSnd -= dt) <= 0) { sprSnd = .3; ctx.sfx('swish'); }
        }
        if (dashing && Math.random() < .7) parts.push({x: sx + (Math.random() - .5) * ts * .3, y: sy - ts * .05, vx: -vp.fx * ts * 2, vy: -vp.fy * ts * 2 - 10, life: .35, max: .35, col: 'rgba(240,225,190,.75)', kind: 'steam', r: ts * .08});
        if (p.act === 'chop') { if ((chopSnd -= dt) <= 0) { chopSnd = .18; ctx.sfx('tick'); const f = front(p); if (f >= 0) { const [fx0, fy0] = tilePx(f, L); burst(fx0, fy0, 2, '#b7e07a', 50, .35); } } }
        if (p.act === 'wash' && Math.random() < dt * 12) { const [fx0, fy0] = tilePx(sinkT, L); parts.push({x: fx0 + (Math.random() - .5) * ts * .5, y: fy0, vx: (Math.random() - .5) * 30, vy: -40 - Math.random() * 30, life: .6, max: .6, col: 'rgba(220,240,255,.9)', kind: 'bub', r: ts * .06}); }
      }
      for (const o of st.fly) {
        // host: back-interpolate inside the 60 Hz step; guest: extrapolate from the last snapshot
        const lag = ctx.isHost ? (ctx.alpha - 1) / 60 : Math.min(.1, tAll - snapT), ot = BX.clamp((o.t || 0) + lag, 0, FLY_T);
        const ox = o.x + (o.vx || 0) * lag, oy = o.y + (o.vy || 0) * lag, k = ot / FLY_T, lift = flyH(ot) * ts;
        const x = L.ox + ox * ts, y = L.oy + oy * ts;
        // fast-object trail
        g.strokeStyle = 'rgba(255,245,220,.35)'; g.lineWidth = ts * .1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - lift); g.lineTo(x - (o.vx || 0) * ts * .045, y - flyH(Math.max(0, ot - .045)) * ts - (o.vy || 0) * ts * .045); g.stroke();
        g.fillStyle = `rgba(0,0,0,${.12 + .1 * k})`; g.beginPath(); g.ellipse(x, y + ts * (.14 + .14 * (1 - k)), ts * (.13 + .05 * k), ts * (.045 + .015 * k), 0, 0, 7); g.fill();
        g.save(); g.translate(x, y - lift); g.rotate(ot * 14); drawItem(g, 0, 0, ts * .62, o.it); g.restore();
      }
      for (const t of tags) {
        const fs = Math.max(11, Math.min(15, ts * .3)); g.font = `800 ${fs}px ${BX.F ? BX.F.sans || 'sans-serif' : 'sans-serif'}`;
        const tw2 = g.measureText(t.s).width + 12;
        g.fillStyle = 'rgba(30,18,8,.82)'; D.rr(g, t.x - tw2 / 2, t.y, tw2, fs + 6, 6); g.fill(); g.strokeStyle = D.alpha(t.col, .9); g.lineWidth = 1.5; g.stroke();
        D.text(g, t.s, t.x, t.y + fs / 2 + 3, {size: fs, color: '#fff3e0', weight: 800});
      }
      // guide arrow (tutorial level / 💡)
      if ((guideCalcT -= dt) <= 0) { guideCalcT = .25; if (guideOn()) calcGuides(); else guides = []; }
      if (guideOn()) for (const gd of guides) {
        if (gd.i < 0) continue;
        const x = L.ox + (gd.i % GW + .5) * ts, y = L.oy + Math.floor(gd.i / GW) * ts, b = Math.abs(Math.sin(tAll * 4)) * ts * .18;
        g.strokeStyle = `rgba(255,211,77,${.6 + .3 * Math.sin(tAll * 6)})`; g.lineWidth = Math.max(2.5, ts * .08); D.rr(g, x - ts * .48, y + 1, ts * .96, ts * .8, ts * .14); g.stroke();
        g.fillStyle = '#ffd34d'; g.strokeStyle = '#5a2a10'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y - ts * .08 - b); g.lineTo(x - ts * .26, y - ts * .42 - b); g.lineTo(x - ts * .1, y - ts * .42 - b); g.lineTo(x - ts * .1, y - ts * .7 - b); g.lineTo(x + ts * .1, y - ts * .7 - b); g.lineTo(x + ts * .1, y - ts * .42 - b); g.lineTo(x + ts * .26, y - ts * .42 - b); g.closePath(); g.fill(); g.stroke();
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
      const tk = L.tk, rows = tk.rows || 1, n = 4 / rows, tw = Math.min(170, (tk.w - 6 * (n - 1)) / n), th = (tk.h - 6 * (rows - 1)) / rows;
      const tkX = j => tk.x + (j % n) * (tw + 6), tkY = j => tk.y + Math.floor(j / n) * (th + 6);
      const now = tAll;
      const held = new Set(); st.P.forEach((p, k) => { if (ctx.isLocal(k) && p.h && p.h.k === 'p' && p.h.d) held.add(p.h.d); });
      const glowId = {}; for (const r of held) { let b = null; for (const o of st.orders) if (o.r === r && (!b || o.p < b.p)) b = o; if (b) glowId[b.id] = 1; }
      st.orders.forEach((o, j) => {
        if (!tkSeen.has(o.id)) tkSeen.set(o.id, now);
        const age = now - tkSeen.get(o.id), k = age < .45 ? BX.ease.back(Math.min(1, age / .45)) : 1;
        const bounce = age < .9 ? Math.sin(age * 14) * (1 - age / .9) * 4 : 0;
        if (j < 4) drawTicket(g, o, tkX(j), tkY(j) + bounce, tw, th, Math.max(.01, k), null, glowId[o.id]);
      });
      for (let j = tkGone.length - 1; j >= 0; j--) {
        const t = tkGone[j]; t.t += dt; if (t.t > .7) { tkGone.splice(j, 1); continue; }
        const idx = st.orders.length + tkGone.length - 1 - j;
        if (idx < 4) { g.globalAlpha = 1 - t.t / .7; drawTicketGhost(g, tkX(idx), tkY(idx) - t.t * 40, tw, th, t.ok); g.globalAlpha = 1; }
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
        D.text(g, two ? '左：WASD 移动 · E 拿放 · Q 使用 · R 冲刺　　右：方向键 · . 拿放 · / 使用 · , 冲刺' : 'WASD / 方向键 移动 · 空格 / E 拿放 · 按住 Q 切菜/洗碗/灭火（拿着食材时轻按 = 扔） · R 冲刺', L.hint.x, L.hint.y, {size: 13, color: 'rgba(243,226,192,.75)', maxW: cv.w - 20});
      }
      // guide text
      if (guideOn() && guides.length && st.ph === 'play') {
        const gd = guides[0], txt = (guides.length > 1 ? '' : (LV.tut ? '教学 · ' : '💡 ')) + guides.map(q => (guides.length > 1 ? ctx.name(q.k) + '：' : '') + q.txt).join('　');
        const fs = Math.max(13, Math.min(17, ts * .42));
        const bx = L.below ? L.below.x : L.ox + GW * ts / 2, by = L.below ? L.below.y : L.oy + GH * ts - fs * .2;
        g.font = `800 ${fs}px sans-serif`; const tw2 = Math.min(cv.w - 12, g.measureText(txt).width + 24);
        g.fillStyle = 'rgba(30,18,8,.86)'; D.rr(g, bx - tw2 / 2, by - fs * .9, tw2, fs * 1.8, fs * .5); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 1.5; g.stroke();
        D.text(g, txt, bx, by, {size: fs, color: '#ffe08a', weight: 800, maxW: tw2 - 12}); void gd;
      }
      if (L.touch) drawCtrls(g, L);
      placeCmd(L);
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
        D.text(g, starStr + (sr < 3 ? ` 差${stars[sr] - st.coins}` : ''), P.split + P.w / 2, P.y + P.h + 14, {size: 15, color: '#ffd34d', maxW: P.w});
      } else {
        const hh = Math.min(34, (P.h - 4) / 2);
        pill(P.x, P.y, P.w * .5 - 3, hh, 't', tstr, low ? '#ff8a7a' : null);
        pill(P.x + P.w * .5 + 3, P.y, P.w * .5 - 3, hh, 'c', String(st.coins));
        D.text(g, starStr + (sr < 3 ? `  下一星差 ${stars[sr] - st.coins}` : '  满星！'), P.x + P.w / 2, P.y + hh + 14, {size: 14, color: '#ffd34d', maxW: P.w + 20});
      }
    }

    status();
    return {
      st, input, aiInput, key,
      _feel: () => ({d: disp.map(d => [d.x, d.y]), P: st.P.map(p => [p.x, p.y]), ph: st.ph, tg: st.P.map(p => front(p)), pred: pred && [pred.x, pred.y], vo: Math.hypot(visOff.x, visOff.y)}),
      dbg: () => JSON.stringify({t: Math.round(st.left), c: st.coins, sv: st.served, f: st.failed, o: st.orders.map(o => o.r), P: st.P.map((p, k) => [p.x.toFixed(1), p.y.toFixed(1), p.h && (p.h.k + (p.h.t || p.h.d || '') + (p.h.c ? 'c' : '') + (p.h.x ? 'x' : '')), aiM[k].job, aiM[k].goal && aiM[k].goal.i]), stn: Object.values(st.stn).map(x => x.s + ':' + x.c.join('+')), rack: st.rack, sink: st.sink.n, dret: st.dret}),
      step(dt, inputs) { step(dt, inputs); },
      snapshot() {
        const r2 = v => Math.round(v * 100) / 100;
        return {lv: st.lv, ph: st.ph, t: r2(st.t), left: r2(st.left), coins: st.coins, served: st.served, failed: st.failed, orders: st.orders.map(o => ({id: o.id, r: o.r, p: r2(o.p), pm: o.pm})),
          P: st.P.map(p => ({x: r2(p.x), y: r2(p.y), vx: r2(p.vx), vy: r2(p.vy), fx: p.fx, fy: p.fy, h: p.h, mv: p.mv, act: p.act, i: p.i, ds: r2(p.ds), dcd: r2(p.dcd), tg: p.tg, sq: p.sq, sn: p.sn})),
          fly: st.fly.map(o => ({x: r2(o.x), y: r2(o.y), vx: r2(o.vx), vy: r2(o.vy), it: o.it, by: o.by, t: r2(o.t)})), fl: st.fl.map(o => ({x: r2(o.x), y: r2(o.y), it: o.it})),
          it: st.it, stn: st.stn, rack: st.rack, dret: st.dret, sink: {n: st.sink.n, p: r2(st.sink.p)}, ev: st.ev, evId: st.evId, over: st.over, star: st.star};
      },
      restore(d) { Object.assign(st, d); snapT = tAll; reconcile(); },
      hint() { if (st.ph !== 'play') { ctx.toast('开工后再来看提示'); return; } guideUntil = tAll + 8; guideCalcT = 0; calcGuides(); if (guides[0]) ctx.toast(guides[0].txt); },
      draw,
      destroy() { parts.length = 0; },
    };
  },
});
