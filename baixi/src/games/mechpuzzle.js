/* 双影机关 — co-op two-character grid puzzle (realtime, 2 seats, host authoritative). */
const D = BX.draw, C = BX.C;
const TEST = !!BX.test;
const MOVE_T = TEST ? .09 : .16;
/* feel: hold-to-repeat starts after HOLD_DELAY (a slightly long tap is still ONE step); a crate push takes PUSH_K× longer (weight);
   up to QMAX taps are buffered while a step is still playing (Baba Is You style) */
const HOLD_DELAY = TEST ? .12 : .22, PUSH_K = 1.35, QMAX = 2, BUMP_T = .15;
const CH = [{n: '阿木', col: '#b5652e', col2: '#7a3f18', ab: '力气大，能推动木箱'}, {n: '小灵', col: '#2f9aa0', col2: '#1d6468', ab: '身子轻，能走裂地、钻窄缝'}];
const DIRS = {U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0]};
const PCOL = {a: '#d0533f', b: '#e0a020', c: '#3f8fd0'};
/* Legend: # wall  . floor  ~ pit (a pushed crate fills it)  x cracked floor (小灵 only)  = narrow gap (小灵 only)
   a/b/c pressure plates → A/B/C doors (open while any same-colour plate is pressed by someone or a crate)
   k gold key → K gold lock   j jade key → J jade lock   (keys are shared; a lock opens for good once someone walks in with a key)
   L lever (stand on it and press 使用) toggles all bridges:  _ bridge starts retracted   + bridge starts extended
   o crate (only 阿木 can push)   1 阿木   2 小灵   M 阿木's exit   N 小灵's exit */
const LEVELS = [
  {n: '双门', h: '踩住压力板，同色的门才会打开。两人轮流为对方守门吧！', m: [
    '###########',
    '#1...#...M#',
    '#....A....#',
    '#.b..#..a.#',
    '#....B....#',
    '#2...#...N#',
    '###########']},
  {n: '裂地', h: '布满裂纹的地面只有身轻的小灵能走，阿木一踩就会塌。', m: [
    '############',
    '#1.......A.#',
    '#.########.#',
    '#2xxxx.a.#M#',
    '#.########.#',
    '#.......x.N#',
    '############']},
  {n: '木箱', h: '阿木能推动木箱。把木箱推到压力板上，门就会一直开着。', m: [
    '###########',
    '#1....#..M#',
    '#..o..A...#',
    '#.....#...#',
    '#..a..#...#',
    '#2....#..N#',
    '###########']},
  {n: '窄缝', h: '墙上的窄缝只有小灵钻得过去。', m: [
    '############',
    '#1...#....M#',
    '#....B.....#',
    '#....#######',
    '#2...=..b.N#',
    '############']},
  {n: '填坑', h: '把木箱推进深坑，就能把坑填平。', m: [
    '############',
    '#1.....#..M#',
    '#..o...~...#',
    '#......#...#',
    '#2.....#.a.#',
    '###A########',
    '###...N#####',
    '############']},
  {n: '机关桥', h: '站在拉杆上按「使用」，所有吊桥会一起升降。桥上有人时拉杆拉不动。', m: [
    '#############',
    '#1....#....M#',
    '#..L..+.....#',
    '#.....#######',
    '#.....__..N.#',
    '#2....#.....#',
    '#############']},
  {n: '钥匙', h: '钥匙两人共用，带着钥匙走进同色的锁门就能打开它。', m: [
    '############',
    '#1....K...M#',
    '#.....######',
    '#..a..xxxk.#',
    '#.....######',
    '#2....A...N#',
    '############']},
  {n: '接力', h: '先让一人过去，再从另一边把门打开。', m: [
    '#############',
    '#1..#..b..#M#',
    '#.o.A.....B.#',
    '#...#.....#.#',
    '#.a.#xxxxx###',
    '#2..#.....=N#',
    '#############']},
  {n: '箱桥', h: '木箱可以压住压力板，也可以填坑——想清楚每只箱子的用处。', m: [
    '##############',
    '#1......######',
    '#..o..o.~.B.M#',
    '#.a..b..####N#',
    '####A#########',
    '#2...........#',
    '##############']},
  {n: '吊桥谜阵', h: '吊桥一升一降，有人得留在后面拉杆。', m: [
    '##############',
    '#1....#...B.M#',
    '#..L..+...####',
    '#.....########',
    '#.....__xx.b.#',
    '#2....####.N##',
    '##############']},
  {n: '金玉双锁', h: '金钥匙和玉钥匙分别藏在两人才去得到的地方。', m: [
    '##############',
    '#1...#..j#..M#',
    '#.o..K...J...#',
    '#....#####.###',
    '#.a..#xxk#...#',
    '#2...=...A..N#',
    '##############']},
  {n: '机关大院', h: '最后一关：压力板、木箱、吊桥、钥匙全都用上！', m: [
    '##############',
    '#2.x.a.#.k...#',
    '#..#####xx####',
    '#..=..B._..MN#',
    '##########K###',
    '#1.o...A.~.L.#',
    '#..b.o.#######',
    '#......#######',
    '##############']},
];
/* joint solutions found by an offline BFS (upper case = 阿木, lower case = 小灵, X/x = use lever) */
const SOL = [
  'RDDurrrrURRrurrRRURRRrdd',
  'RRRRRRRrrrrrrRRDDllllllddrrrrrrrrr',
  'RRDDURRRRURRuuurrrrrrrrddd',
  'RRRDrrrrrrrRRURRRRrr',
  'RDRRRRRRRDDrrdUUURdrrr',
  'RRDXurrrrrrrXRRRRURRRRrr',
  'RRDDurrrurrrrrllllddrUURRRRRRRrrrr',
  'RDDURRRRRRRuuurrrrurrRRUrrddddrr',
  'RRDLDrrruRRURRRUuurrrrDrRrRrRrRdR',
  'RRDXurrrrrrrXRRRRURRrrrRRRd',
  'RDDURRrrrrrurrRRURRDRRURRdrrrr',
  'RRRRrrrrRDLLURRRRRRRXLlllddrrrrrruurUddrrUrR',
];

/* ---------------- pure rules (shared by host sim, AI and the offline solver) ---------------- */
function parse(def) {
  const m = def.m, h = m.length, w = Math.max(...m.map(r => r.length));
  const L = {w, h, t: [], plates: {a: [], b: [], c: []}, bridges: [], keys: [], locks: []};
  const S = {p: [0, 0], cr: [], fl: [], lv: 0, k: {k: 0, j: 0}, got: [], op: []};
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    let ch = m[r][c] || '#'; const i = r * w + c;
    if (ch === ' ') ch = '#';
    if (ch === '1') { S.p[0] = i; ch = '.'; }
    else if (ch === '2') { S.p[1] = i; ch = '.'; }
    else if (ch === 'o') { S.cr.push(i); ch = '.'; }
    if ('abc'.includes(ch)) L.plates[ch].push(i);
    if (ch === '_' || ch === '+') L.bridges.push(i);
    if (ch === 'k' || ch === 'j') L.keys.push(i);
    if (ch === 'K' || ch === 'J') L.locks.push(i);
    L.t.push(ch);
  }
  return {L, S};
}
const cloneS = S => ({p: S.p.slice(), cr: S.cr.slice(), fl: S.fl.slice(), lv: S.lv, k: {k: S.k.k, j: S.k.j}, got: S.got.slice(), op: S.op.slice()});
const charAt = (S, i) => S.p[0] === i ? 0 : S.p[1] === i ? 1 : -1;
const occ = (S, i) => S.p[0] === i || S.p[1] === i || S.cr.includes(i);
const pressed = (L, S, col) => L.plates[col].some(i => occ(S, i));
const doorOpen = (L, S, i) => pressed(L, S, L.t[i].toLowerCase()) || occ(S, i);
const bridgeOn = (L, S, i) => (L.t[i] === '_') === (S.lv === 1);
function walkable(L, S, who, i) {
  const t = L.t[i];
  switch (t) {
    case '#': return false;
    case '~': return S.fl.includes(i);
    case 'x': case '=': return who === 1;
    case 'A': case 'B': case 'C': return doorOpen(L, S, i);
    case 'K': case 'J': return S.op.includes(i) || S.k[t.toLowerCase()] > 0;
    case '_': case '+': return bridgeOn(L, S, i);
    default: return true;
  }
}
function crateCan(L, S, i) {
  const t = L.t[i];
  if (occ(S, i)) return false;
  if ('#xL=kjMN'.includes(t)) return t === 'k' || t === 'j' ? S.got.includes(i) : false;
  if (t === '~') return S.fl.includes(i) ? true : 'fill';
  if ('ABC'.includes(t)) return doorOpen(L, S, i);
  if (t === 'K' || t === 'J') return S.op.includes(i);
  if (t === '_' || t === '+') return bridgeOn(L, S, i);
  return true;
}
function nb(L, i, d) { const c = i % L.w + DIRS[d][0], r = Math.floor(i / L.w) + DIRS[d][1]; return c < 0 || r < 0 || c >= L.w || r >= L.h ? -1 : r * L.w + c; }
/* returns {S, push, fill, key, lock} or null */
function tryMove(L, S, who, d) {
  const n = nb(L, S.p[who], d); if (n < 0) return null;
  if (charAt(S, n) >= 0) return null;
  const N = cloneS(S); let push = false, fill = false;
  const ci = S.cr.indexOf(n);
  if (ci >= 0) {
    if (who !== 0) return null;
    const b = nb(L, n, d); if (b < 0) return null;
    const ok = crateCan(L, S, b); if (!ok) return null;
    N.cr.splice(ci, 1); push = true;
    if (ok === 'fill') { N.fl.push(b); fill = true; } else N.cr.push(b);
    N.cr.sort((x, y) => x - y);
    N.p[who] = n;
    if (!walkable(L, N, who, n)) return null;
  } else {
    if (!walkable(L, S, who, n)) return null;
    N.p[who] = n;
  }
  const t = L.t[n]; let key = false, lock = false;
  if ((t === 'k' || t === 'j') && !N.got.includes(n)) { N.got.push(n); N.k[t]++; key = true; }
  if ((t === 'K' || t === 'J') && !N.op.includes(n)) { N.op.push(n); N.k[t.toLowerCase()]--; lock = true; }
  return {S: N, push, fill, key, lock, from: S.p[who], to: n, crFrom: push ? n : -1, crTo: push ? nb(L, n, d) : -1};
}
function tryAct(L, S, who) {
  if (L.t[S.p[who]] !== 'L' || !L.bridges.length) return null;
  if (L.bridges.some(i => occ(S, i))) return 'stuck';
  const N = cloneS(S); N.lv ^= 1; return {S: N};
}
const isWin = (L, S) => L.t[S.p[0]] === 'M' && L.t[S.p[1]] === 'N';
function skey(S) { return S.p.join(',') + '|' + S.cr.join(',') + '|' + S.fl.join(',') + '|' + S.lv + '|' + S.got.join(',') + '|' + S.op.join(','); }
function solve(def, limit = 3e6) {
  const {L, S} = parse(def);
  const seen = new Map([[skey(S), null]]); const q = [S], keyq = [skey(S)];
  for (let h = 0; h < q.length && h < limit; h++) {
    const s = q[h], ks = keyq[h];
    if (isWin(L, s)) { let out = '', k = ks; while (seen.get(k)) { const [pk, mv] = seen.get(k); out = mv + out; k = pk; } return {sol: out, n: q.length}; }
    for (const who of [0, 1]) {
      const opts = Object.keys(DIRS).map(d => [d, tryMove(L, s, who, d)]); const a = tryAct(L, s, who); if (a && a !== 'stuck') opts.push(['X', a]);
      for (const [d, r] of opts) {
        if (!r) continue; const k2 = skey(r.S); if (seen.has(k2)) continue;
        seen.set(k2, [ks, who ? d.toLowerCase() : d]); q.push(r.S); keyq.push(k2);
      }
    }
  }
  return {sol: null, n: q.length};
}

/* ---------------- drawing ---------------- */
function drawHero(g, x, y, s, who, face, ph, moving, sq, win) {
  const c = CH[who];
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y + s * .02, s * (who ? .22 : .3), s * .08, 0, 0, 7); g.fill();
  const hop = moving ? Math.abs(Math.sin(ph)) * s * .1 : (win ? Math.abs(Math.sin(ph * 2)) * s * .12 : 0);
  const fl = who === 1 ? Math.sin(ph * .7) * s * .03 - s * .04 : 0;
  g.save(); g.translate(x, y - hop + fl); g.scale(1 + sq, 1 - sq);
  const fx = face === 'L' ? -1 : face === 'R' ? 1 : 0, back = face === 'U';
  if (who === 0) {
    // 阿木: sturdy, brown jacket, headband with 木
    g.fillStyle = c.col2; D.rr(g, -s * .3, -s * .5, s * .6, s * .5, s * .16); g.fill();
    g.fillStyle = c.col; D.rr(g, -s * .27, -s * .48, s * .54, s * .44, s * .14); g.fill();
    g.fillStyle = '#e9c27a'; g.fillRect(-s * .27, -s * .22, s * .54, s * .06);
    g.fillStyle = '#f2c79e'; for (const sg of [-1, 1]) { D.circle(g, sg * s * .32, -s * .25, s * .08); g.fill(); }
    g.fillStyle = '#f2c79e'; D.circle(g, 0, -s * .7, s * .25); g.fill();
    g.fillStyle = '#2b1a10'; g.beginPath(); g.arc(0, -s * .74, s * .26, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    if (back) { g.fillStyle = '#2b1a10'; D.circle(g, 0, -s * .72, s * .24); g.fill(); }
    g.fillStyle = '#c23a2b'; g.fillRect(-s * .26, -s * .84, s * .52, s * .08);
    if (!back) {
      D.text(g, '木', fx * s * .05, -s * .8, {size: s * .1, color: '#fff3e0', weight: 900});
      g.fillStyle = '#2b1a10'; for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(fx * s * .06 + sg * s * .09, -s * .67, s * .03, s * .04, 0, 0, 7); g.fill(); }
      g.strokeStyle = '#2b1a10'; g.lineWidth = Math.max(1, s * .025); for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(fx * s * .06 + sg * s * .14, -s * .75); g.lineTo(fx * s * .06 + sg * s * .05, -s * .73); g.stroke(); }
      g.strokeStyle = '#7a3a22'; g.beginPath(); g.arc(fx * s * .06, -s * .59, s * (win ? .06 : .04), .2, Math.PI - .2); g.stroke();
    }
  } else {
    // 小灵: small, teal robe, twin buns, ribbon
    const rb = Math.sin(ph * .8) * s * .06;
    g.strokeStyle = '#e66a8a'; g.lineWidth = Math.max(1, s * .04); g.beginPath(); g.moveTo(-s * .1, -s * .3); g.quadraticCurveTo(-s * .35, -s * .2 + rb, -s * .42, -s * .05 - rb); g.stroke(); g.beginPath(); g.moveTo(s * .1, -s * .3); g.quadraticCurveTo(s * .35, -s * .2 - rb, s * .42, -s * .05 + rb); g.stroke();
    g.fillStyle = c.col2; g.beginPath(); g.moveTo(-s * .2, 0); g.lineTo(-s * .12, -s * .38); g.lineTo(s * .12, -s * .38); g.lineTo(s * .2, 0); g.closePath(); g.fill();
    g.fillStyle = c.col; g.beginPath(); g.moveTo(-s * .17, -s * .02); g.lineTo(-s * .1, -s * .36); g.lineTo(s * .1, -s * .36); g.lineTo(s * .17, -s * .02); g.closePath(); g.fill();
    g.fillStyle = '#fbe9d0'; g.fillRect(-s * .1, -s * .24, s * .2, s * .04);
    g.fillStyle = '#f6d6b8'; D.circle(g, 0, -s * .52, s * .19); g.fill();
    g.fillStyle = '#1e1a22'; for (const sg of [-1, 1]) { D.circle(g, sg * s * .16, -s * .68, s * .08); g.fill(); }
    g.beginPath(); g.arc(0, -s * .56, s * .2, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    if (back) { D.circle(g, 0, -s * .54, s * .18); g.fill(); }
    g.fillStyle = '#e66a8a'; for (const sg of [-1, 1]) { D.circle(g, sg * s * .2, -s * .63, s * .03); g.fill(); }
    if (!back) {
      g.fillStyle = '#1e1a22'; for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(fx * s * .05 + sg * s * .07, -s * .5, s * .025, s * .035, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(240,110,120,.5)'; for (const sg of [-1, 1]) { D.circle(g, fx * s * .05 + sg * s * .12, -s * .45, s * .03); g.fill(); }
      g.strokeStyle = '#7a3a22'; g.lineWidth = Math.max(1, s * .02); g.beginPath(); g.arc(fx * s * .05, -s * .44, s * (win ? .045 : .03), .2, Math.PI - .2); g.stroke();
    }
  }
  g.restore();
}
function drawCrate(g, x, y, s, sink) {
  g.save(); if (sink) { g.globalAlpha = 1 - sink; g.translate(0, sink * s * .2); }
  g.fillStyle = 'rgba(0,0,0,.25)'; D.rr(g, x - s * .4, y - s * .3, s * .84, s * .78, s * .08); g.fill();
  g.fillStyle = '#7a4a22'; D.rr(g, x - s * .42, y - s * .48, s * .84, s * .84, s * .08); g.fill();
  g.fillStyle = '#c9893f'; D.rr(g, x - s * .36, y - s * .42, s * .72, s * .72, s * .05); g.fill();
  g.strokeStyle = '#7a4a22'; g.lineWidth = s * .08; g.beginPath(); g.moveTo(x - s * .33, y - s * .39); g.lineTo(x + s * .33, y + s * .27); g.stroke();
  g.fillStyle = '#e0a860'; g.fillRect(x - s * .36, y - s * .42, s * .72, s * .06);
  g.restore();
}
function drawKey(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.rotate(-.5);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(s * .05, s * .3, s * .25, s * .07, .5, 0, 7); g.fill();
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = s * .09;
  D.circle(g, -s * .15, 0, s * .14); g.stroke();
  g.beginPath(); g.moveTo(-s * .01, 0); g.lineTo(s * .32, 0); g.stroke();
  g.fillRect(s * .18, 0, s * .06, s * .13); g.fillRect(s * .27, 0, s * .06, s * .1);
  g.fillStyle = 'rgba(255,255,255,.6)'; D.circle(g, -s * .2, -s * .05, s * .03); g.fill();
  g.restore();
}
const KCOL = {k: '#e6b93d', j: '#4fb08a'};

BX.register({
  id: 'mechpuzzle', title: '双影机关', cat: 'coop', order: 2, sub: '两人各显神通闯机关',
  desc: '力气大的阿木和身子轻的小灵结伴闯进机关大宅。踩压力板、推木箱、拉吊桥、找钥匙，十二道机关需要两人默契配合才能通过。',
  kind: 'realtime', seats: 2, coop: true, noFirst: true, seatNames: ['阿木', '小灵'], seatColors: [CH[0].col, CH[1].col], snapHz: 30, inputHz: 60,
  options: [{key: 'role', label: '我扮演', choices: [[0, '阿木（推箱）'], [1, '小灵（轻身）']], def: 0, modes: ['ai']}],
  howto: ['<b>移动</b>：WASD / 方向键或摇杆，轻按走一格、按住连续走，走动中可以提前按下一步；也可以直接<b>点地图上的格子</b>，角色会沿虚线自己走过去。',
    '<b>阿木</b>能推木箱；<b>小灵</b>能走裂地、钻窄缝。走不过去时角色头上会说明原因。',
    '<b>使用</b>（空格 / E）拉拉杆。<b>↶</b> 撤销一步（Z），<b>↺</b> 重来本关（R），<b>☰</b> 选关。',
    '人机模式点 <b>⇄</b>（Tab）随时换成另一个角色，电脑接管另一个；卡住了点 💡，地图上会用脚印标出接下来几步。',
    '手机竖屏地图太宽时镜头会跟着你走，点 <b>🔍</b> 切换全图。'],
  rules: `<p><b>目标：</b>阿木和小灵要<b>同时</b>站到各自的出口上（阿木→棕色「木」字门，小灵→青色「灵」字门）才算过关。共 <b>12 关</b>，过关后自动进入下一关，已解锁的关卡可以在「选关」里随时挑选。</p>
<p><b>两人的本领：</b></p>
<ul><li><b>阿木</b>力气大，能<b>推动木箱</b>（一次只能推一只，箱子前面要有空位）。但他太重，不能走<b>裂地</b>，也钻不过<b>窄缝</b>。</li>
<li><b>小灵</b>身子轻，能走<b>裂地</b>、钻<b>窄缝</b>，但推不动木箱。</li></ul>
<p><b>机关：</b></p>
<ul><li><b>压力板</b>：有人或木箱压着时，同颜色的门打开；离开后门关上（门里站着人时不会关）。</li>
<li><b>深坑</b>：谁也过不去，但把木箱推进去就能填平。</li>
<li><b>拉杆与吊桥</b>：站在拉杆上按「使用」，所有吊桥一起升降。桥上有人或箱子时拉不动。</li>
<li><b>钥匙与锁门</b>：金钥匙开金锁，玉钥匙开玉锁。钥匙两人共用，带着钥匙走进锁门即可永久打开。</li></ul>
<p>走错了可以点 <b>↶ 撤销</b>退回一步，卡死了就点 <b>↺ 重来本关</b>；💡 提示会在地图上标出接下来的几步。</p>
<p><b>操作：</b>点击/轻触地图格子可自动走过去。键盘单人：WASD / 方向键移动，空格 / E 使用拉杆，Z 撤销，R 重来，Tab 换人（人机模式）。同屏双人：左边 WASD + <b>E</b>，右边 方向键 + <b>.</b>（或 Enter）。触屏：摇杆移动，「使用」按钮拉杆；同屏双人时两人各用自己那半边。</p>
<p>人机模式可以选择自己扮演谁（也可以随时点 ⇄ 换人），电脑伙伴会按自己的计划行动，需要你帮忙时会在原地等你。</p>`,
  icon(g, w, h) {
    const s = h / 4.2;
    g.fillStyle = '#3a2a22'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { g.fillStyle = (r + c) % 2 ? '#d8c4a0' : '#cdb790'; g.fillRect(c * s, r * s, s, s); }
    g.fillStyle = '#6b4a36'; g.fillRect(0, 0, w, s * .55); g.fillStyle = '#8a6448'; g.fillRect(0, s * .4, w, s * .15);
    // door + plate
    g.fillStyle = '#7a2a20'; g.fillRect(w * .47, s * .55, s * .9, s * 2.2); g.strokeStyle = '#e6c57d'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(w * .47, s * .55 + k * s * .55); g.lineTo(w * .47 + s * .9, s * .55 + k * s * .55); g.stroke(); }
    g.fillStyle = '#d0533f'; g.beginPath(); g.ellipse(w * .2, h * .78, s * .5, s * .3, 0, 0, 7); g.fill(); g.fillStyle = '#ff8a6a'; g.beginPath(); g.ellipse(w * .2, h * .76, s * .36, s * .2, 0, 0, 7); g.fill();
    drawCrate(g, w * .83, h * .72, s * .9);
    drawHero(g, w * .3, h * .7, s * 1.5, 0, 'R', 0, false, 0, true);
    drawHero(g, w * .68, h * .62, s * 1.3, 1, 'L', 1, false, 0, true);
    drawKey(g, w * .88, h * .3, s * .9, KCOL.k);
  },
  create(ctx) {
    const chOf = seat => seat ^ st.role;          // character index controlled by a seat
    const seatOf = ch => ch ^ st.role;
    let unlocked = TEST ? 1 : ctx.load('unlocked', 1);
    const startLv = TEST ? 0 : BX.clamp(ctx.load('cur', 0), 0, LEVELS.length - 1);
    const st = {lv: startLv, S: null, ph: 'play', t: 0, gen: 0, face: ['D', 'D'], cd: [0, 0], cleared: 0, moves: 0, ev: [], evId: 0, over: false, unl: unlocked, role: ctx.mode === 'ai' ? (+ctx.opts.role || 0) : 0, ga: [0, 0], gl: [-1, -1]};
    let L = null;
    const hist = [];   // host-only undo stack
    function load(lv) {
      st.lv = lv; const P = parse(LEVELS[lv]); L = P.L; st.S = P.S; st.ph = 'intro'; st.t = TEST ? .3 : 1.4; st.gen++; st.face = ['D', 'D']; st.cd = [0, 0]; st.moves = 0;
      hist.length = 0; aiReset(); clearQ();
    }
    const fx = (k, o) => { st.ev.push(Object.assign({k, id: ++st.evId}, o || {})); if (st.ev.length > 14) st.ev.shift(); };

    /* ---------------- AI: follow the stored joint solution ---------------- */
    const ai = [{ptr: 0, gen: -1}, {ptr: 0, gen: -1}];
    let plan = null, planGen = 0;
    function buildPlan(LL, S, moves) {
      const mv = [], pos = [], keys = [];
      for (const {who, d} of moves) {
        pos.push(S.p.slice()); keys.push(skey(S));
        mv.push({who, d, sens: d === 'X' || LL.t[S.p[who]].match(/[abc]/) != null});
        const r = d === 'X' ? tryAct(LL, S, who) : tryMove(LL, S, who, d);
        if (r && r !== 'stuck') { if (r.push && [r.crFrom].some(i => 'abc'.includes(LL.t[i]))) mv[mv.length - 1].sens = true; S = r.S; }
      }
      keys.push(skey(S));
      return {mv, pos, keys};
    }
    function aiReset() {
      ai.forEach(a => { a.ptr = 0; a.gen = st.gen; a.wait = 0; a.div = 0; });
      const sol = SOL[st.lv] || ''; const P = parse(LEVELS[st.lv]);
      planGen++; plan = buildPlan(P.L, P.S, [...sol].map(chr => ({who: chr === chr.toLowerCase() ? 1 : 0, d: chr.toUpperCase()})));
      visited[0] = new Set([st.S.p[0]]); visited[1] = new Set([st.S.p[1]]);
    }
    /* the AI got off the plan (player swapped, undid, or took another route): re-plan from here */
    function aiReplan() {
      const mv = planFromHere(120); if (!mv || !mv.length) return false;
      planGen++; plan = buildPlan(L, st.S, mv); ai.forEach(a => { a.ptr = 0; a.div = 0; });
      visited[0] = new Set([st.S.p[0]]); visited[1] = new Set([st.S.p[1]]);
      return true;
    }
    const visited = [new Set(), new Set()];
    /* after undo / swap: put both AI pointers on the plan step that matches the current state */
    function aiSync() {
      if (!plan) return; const j = plan.keys.indexOf(skey(st.S));
      if (j >= 0) ai.forEach(a => { a.ptr = j; }); else if (TEST || !aiReplan()) ai.forEach(a => { a.ptr = Math.min(a.ptr, plan.mv.length); });
    }
    /* moves from the current state to the goal: the stored plan when we are on it, else a short BFS back onto it */
    function planFromHere(budgetMs = 650) {
      if (!plan) return null;
      const k0 = skey(st.S), j0 = plan.keys.indexOf(k0);
      if (j0 >= 0) return plan.mv.slice(j0).map(m => ({who: m.who, d: m.d}));
      const tgt = new Map(plan.keys.map((k, i) => [k, i]));
      const seen = new Map([[k0, null]]), q = [st.S], kq = [k0], t0 = performance.now();
      for (let h = 0; h < q.length; h++) {
        if ((h & 255) === 0 && performance.now() - t0 > budgetMs) break;
        const S = q[h], ks = kq[h];
        const hit = isWin(L, S) ? plan.keys.length - 1 : (h ? (tgt.has(ks) ? tgt.get(ks) : -1) : -1);
        if (hit >= 0 || isWin(L, S)) {
          const path = []; let k = ks; while (seen.get(k)) { const [pk, mv] = seen.get(k); path.unshift(mv); k = pk; }
          return isWin(L, S) ? path : path.concat(plan.mv.slice(hit).map(m => ({who: m.who, d: m.d})));
        }
        for (const who of [0, 1]) {
          const opts = Object.keys(DIRS).map(d => [d, tryMove(L, S, who, d)]); const a = tryAct(L, S, who); if (a && a !== 'stuck') opts.push(['X', a]);
          for (const [d, r] of opts) { if (!r) continue; const k2 = skey(r.S); if (seen.has(k2)) continue; seen.set(k2, [ks, {who, d}]); q.push(r.S); kq.push(k2); }
        }
      }
      return null;
    }
    const nextOwn = (ch, from) => { for (let i = from; i < plan.mv.length; i++) if (plan.mv[i].who === ch) return i; return Infinity; };
    function aiInput(seat) {
      const ch = chOf(seat), a = ai[seat];
      a.uc = a.uc || 0; a.waiting = false;
      if (st.ph !== 'play' || !plan || a.gen !== st.gen) return {uc: a.uc};
      const i = nextOwn(ch, a.ptr);
      if (i === Infinity) { a.div = (a.div || 0) + 1 / 60; if (a.div > 1.2 && !TEST && !isWin(L, st.S)) { a.div = 0; if (!aiReplan()) a.div = -6; } return {uc: a.uc}; }
      const m = plan.mv[i], other = 1 - ch, oSeat = seatOf(other);
      // the planned position must match; otherwise something diverged — wait a moment, then re-plan
      if (plan.pos[i][ch] !== st.S.p[ch]) { a.div = (a.div || 0) + 1 / 60; if (a.div > 1.2 && !TEST) { a.div = 0; if (!aiReplan()) a.div = -6; } return {uc: a.uc}; }
      a.div = 0;
      if (ctx.isBot(oSeat)) {
        if (nextOwn(other, ai[oSeat].ptr) < i) return {uc: a.uc};
      } else if (m.sens) {
        // human partner: only leave a plate / pull a lever after the partner got where the plan expects
        const want = plan.pos[i][other];
        if (!visited[other].has(want) && st.S.p[other] !== want) {
          a.waiting = true; a.wt = (a.wt || 0) + 1 / 60;
          if (a.wt > 3 && !TEST) { a.wt = 0; if (plan.keys.indexOf(skey(st.S)) < 0 && !aiReplan()) a.wt = -6; }
          return {uc: a.uc};
        }
        a.wt = 0;
      }
      if (m.d === 'X') { if (a.ucFor !== i + '/' + planGen) { a.ucFor = i + '/' + planGen; a.uc++; } return {q: i, pg: planGen, uc: a.uc}; }
      return {d: m.d, q: i, pg: planGen, uc: a.uc};
    }

    /* ---------------- host simulation ---------------- */
    const lastU = [0, 0], lastCmd = [{r: 0, s: 0, z: 0, w: 0}, {r: 0, s: 0, z: 0, w: 0}];
    /* per-seat host input state: buffered taps, hold-to-repeat timer, tap-to-walk goal */
    const HQ = [[], []], lastTap = [0, 0], holdD = ['', ''], holdT = [0, 0], holdBump = [false, false], lastGn = [0, 0];
    function clearQ() { for (let k = 0; k < 2; k++) { HQ[k].length = 0; holdT[k] = 0; } st.gl = [-1, -1]; }
    /* next step towards a tapped cell (plain walking BFS; a final push into an adjacent crate is allowed) → {d} | {why} */
    function walkTo(ch, cell) {
      const S = st.S, from = S.p[ch];
      if (from === cell) return {done: 1};
      const prev = new Map([[from, null]]), q = [from];
      for (let h = 0; h < q.length && !prev.has(cell); h++) {
        const u = q[h];
        for (const d of Object.keys(DIRS)) {
          const n = nb(L, u, d); if (n < 0 || prev.has(n)) continue;
          if (charAt(S, n) >= 0 || S.cr.includes(n) || !walkable(L, S, ch, n)) continue;
          prev.set(n, [u, d]); q.push(n);
        }
      }
      if (prev.has(cell)) { let c = cell; while (prev.get(c) && prev.get(c)[0] !== from) c = prev.get(c)[0]; return {d: prev.get(c)[1], last: prev.get(cell)[0] === from}; }
      for (const d of Object.keys(DIRS)) if (nb(L, from, d) === cell) return tryMove(L, S, ch, d) ? {d, last: 1} : {why: bumpWhy(S, ch, d) || 'far'};
      return {why: 'far'};
    }
    function bumpWhy(S, who, d) {
      const n = nb(L, S.p[who], d); if (n < 0) return '';
      if (charAt(S, n) >= 0) return 'mate';
      if (S.cr.includes(n)) return who === 1 ? 'heavy' : 'crate';
      const t = L.t[n];
      if (t === '~' && !S.fl.includes(n)) return 'pit';
      if (t === 'x' && who === 0) return 'crack';
      if (t === '=' && who === 0) return 'gap';
      if ('ABC'.includes(t)) return 'door' + t.toLowerCase();
      if ((t === 'K' || t === 'J') && !S.op.includes(n)) return 'lock' + t.toLowerCase();
      if ((t === '_' || t === '+') && !bridgeOn(L, S, n)) return 'bridge';
      return '';
    }
    function step(dt, inputs) {
      if (st.over) return;
      // commands (restart / level select) from any local or remote seat
      for (let si = 0; si < inputs.length; si++) {
        const inp = inputs[si], lc = lastCmd[si]; if (!inp || !lc) continue;
        if (inp.rc != null && inp.rc > lc.r) { lc.r = inp.rc; if (st.ph !== 'clear') { fx('reset'); load(st.lv); } }
        if (inp.zc != null && inp.zc > lc.z) { lc.z = inp.zc; clearQ(); if (st.ph === 'play') { if (hist.length) { const h = hist.pop(); st.S = h.S; st.face = h.face; st.moves = Math.max(0, st.moves - 1); st.cd = [0, 0]; fx('undo'); aiSync(); } else fx('noundo'); } }
        if (inp.wc != null && inp.wc > lc.w) { lc.w = inp.wc; clearQ(); if (ctx.mode === 'ai' && st.ph !== 'done') { st.role ^= 1; aiSync(); fx('swap', {c: chOf(si)}); } }
        if (inp.sc != null && inp.sc > lc.s) { lc.s = inp.sc; if (inp.sl >= 0 && inp.sl < Math.max(st.unl, 1) + 0 && inp.sl < LEVELS.length) { fx('reset'); load(inp.sl); } }
      }
      if (st.ph === 'intro') { st.t -= dt; if (st.t <= 0) st.ph = 'play'; }
      if (st.ph === 'clear') {
        st.t -= dt;
        if (st.t <= 0) {
          if (st.lv + 1 >= LEVELS.length || (TEST && st.cleared >= 2)) {
            st.over = true; st.ph = 'done';
            ctx.end({win: true, title: st.lv + 1 >= LEVELS.length ? '机关大宅全部破解！' : '合作成功', text: TEST ? `连过 ${st.cleared} 关` : '十二道机关全部通过，默契满分！', delay: 600});
          } else load(st.lv + 1);
        }
        return;
      }
      for (let seat = 0; seat < 2; seat++) {   // taps / goals arriving outside play are consumed (not replayed later)
        const inp = inputs[seat] || {};
        if (inp.tp) for (const [n, d] of inp.tp) if (n > lastTap[seat]) { lastTap[seat] = n; if (st.ph === 'play' && DIRS[d]) { if (HQ[seat].length >= QMAX) HQ[seat].pop(); HQ[seat].push(d); st.gl[chOf(seat)] = -1; } }
        if (inp.gn != null && inp.gn !== lastGn[seat]) { lastGn[seat] = inp.gn; st.ga[seat] = inp.gn; if (st.ph === 'play') { st.gl[chOf(seat)] = inp.gc >= 0 ? inp.gc : -1; if (inp.gc >= 0) HQ[seat].length = 0; } }
      }
      if (st.ph !== 'play') return;
      for (let seat = 0; seat < 2; seat++) {
        const inp = inputs[seat] || {}, ch = chOf(seat);
        st.cd[ch] = Math.max(0, st.cd[ch] - dt);
        const hd = DIRS[inp.d] && inp.q == null ? inp.d : '';
        if (hd !== holdD[seat]) { holdD[seat] = hd; holdT[seat] = 0; holdBump[seat] = false; } else if (hd) holdT[seat] += dt;
        const u = inp.uc != null ? inp.uc : 0;
        if (u !== lastU[seat]) {
          lastU[seat] = u;
          const r = tryAct(L, st.S, ch);
          if (r === 'stuck') fx('stuck', {c: ch});
          else if (r) { hist.push({S: cloneS(st.S), face: st.face.slice()}); if (hist.length > 300) hist.shift(); st.S = r.S; fx('lever', {c: ch}); if (inp.q != null && inp.pg === planGen) ai[seat].ptr = inp.q + 1; }
          else if (inp.q == null) fx('nolever', {c: ch});
        }
        if (st.cd[ch] > 0) continue;
        // which step now: AI plan step → buffered tap → tap-to-walk goal → held key/stick (after the repeat delay)
        let d = '', src = '', cont = 0;
        if (inp.q != null) { d = DIRS[inp.d] ? inp.d : ''; src = 'ai'; cont = 1; }
        else if (HQ[seat].length) { d = HQ[seat].shift(); src = 'tap'; cont = HQ[seat].length || (hd === d && holdT[seat] >= HOLD_DELAY - MOVE_T) ? 1 : 0; }
        else if (st.gl[ch] >= 0) { const w = walkTo(ch, st.gl[ch]); if (w.d) { d = w.d; src = 'goal'; cont = w.last ? 0 : 1; if (w.last) st.gl[ch] = -1; } else { if (w.why) fx('bump', {c: ch, w: w.why, n: -1}); st.gl[ch] = -1; } }
        else if (hd && holdT[seat] >= HOLD_DELAY) { d = hd; src = 'hold'; cont = 1; }
        if (!d) continue;
        st.face[ch] = d;
        const r = tryMove(L, st.S, ch, d);
        if (r) {
          hist.push({S: cloneS(st.S), face: st.face.slice()}); if (hist.length > 300) hist.shift();
          const dur = MOVE_T * (r.push ? PUSH_K : 1);
          st.S = r.S; st.cd[ch] = dur; st.moves++; visited[ch].add(r.to); holdBump[seat] = false;
          fx('mv', {c: ch, f: r.from, t: r.to, p: r.push ? 1 : 0, n: cont});
          if (r.push) fx(r.fill ? 'fill' : 'push', {c: ch, f: r.crFrom, t: r.crTo});
          if (r.key) fx('key', {c: ch, t: r.to}); if (r.lock) fx('lock', {t: r.to});
          if (inp.q != null && inp.pg === planGen) ai[seat].ptr = inp.q + 1;
        } else {
          st.cd[ch] = MOVE_T * .5;
          if (src === 'goal') st.gl[ch] = -1;
          // one bump per key press (holding against a wall doesn't spam sound / bubbles)
          if (src !== 'ai' && !(src === 'hold' && holdBump[seat])) fx('bump', {c: ch, w: bumpWhy(st.S, ch, d), i: nb(L, st.S.p[ch], d), d});
          if (src === 'hold' || (src === 'tap' && hd === d)) holdBump[seat] = true;
        }
      }
      if (isWin(L, st.S)) {
        st.ph = 'clear'; st.t = TEST ? .8 : 2.2; st.cleared++; fx('win');
        if (st.lv + 2 > st.unl) st.unl = Math.min(LEVELS.length, st.lv + 2);
        if (!TEST && ctx.isHost) { ctx.save('unlocked', Math.max(ctx.load('unlocked', 1), st.unl)); ctx.save('cur', Math.min(LEVELS.length - 1, st.lv + 1)); }
        if (!TEST && !BX.bot) { const b = ctx.best('mv' + st.lv, st.moves, 'min'); st.best = b.best; st.newBest = b.isNew && b.old != null; }
      }
    }

    /* ---------------- layout & input ---------------- */
    const cv = ctx.canvas();
    let sawTouch = false, camX = null, fullView = false;
    const showTouch = () => sawTouch || BX.TOUCH.matches;
    const nLoc = () => Math.max(1, ctx.mySeats.length);
    function layout() {
      const w = cv.w, h = cv.h, touch = showTouch(), two = nLoc() >= 2;
      const portrait = h > w * 1.08, narrow = w < 640;
      const R = {touch, portrait, narrow, ctrls: [], follow: false, canZoom: false};
      const head = narrow ? 84 : 54;
      R.head = {y: 0, h: head};
      if (portrait) {
        const cb = touch ? BX.clamp(h * .24, 150, 210) : 34, legend = 40;
        const ah = h - head - cb - 8 - legend;
        let ts = Math.min((w - 24) / L.w, ah / (L.h + .7));
        const want = Math.min(44, ah / (L.h + .7));
        if (ts < 34 && want > ts * 1.15) { R.canZoom = true; if (!fullView) { ts = want; R.follow = true; } }
        const mw = ts * L.w;
        R.ts = ts; R.oy = head + (ah - ts * L.h) / 2;
        if (R.follow) { const cx = camX == null ? L.w / 2 : camX; R.ox = BX.clamp(w / 2 - cx * ts, w - 10 - mw, 10); } else R.ox = (w - mw) / 2;
        R.legend = {y: R.oy + ts * L.h + ts * .35 + 22};
        if (touch) {
          const y0 = h - cb;
          if (!two) R.ctrls.push({slot: 0, zone: {x: 0, y: y0 - 20, w: w * .62, h: cb + 20}, bx: w * .26, by: y0 + cb * .5, J: Math.min(58, cb * .32), U: {x: w * .8, y: y0 + cb * .5, r: Math.min(42, cb * .22)}});
          else for (const sl of [0, 1]) { const x0 = sl ? w / 2 : 0; R.ctrls.push({slot: sl, zone: {x: x0, y: y0 - 10, w: w / 2, h: cb + 10}, bx: x0 + w * .17, by: y0 + cb * .55, J: Math.min(48, w * .12), U: {x: x0 + w * .39, y: y0 + cb * .3, r: Math.min(26, w * .07)}}); }
        } else R.hint = h - 16;
      } else {
        const side = touch ? BX.clamp(w * .2, 120, 220) : 0, hint = touch ? 0 : 26;
        const aw = w - side * 2 - 8, ah = h - head - hint - 6, ts = Math.min(aw / (L.w + .7), ah / (L.h + .7));
        R.ts = ts; R.ox = side + (w - side * 2 - ts * L.w) / 2; R.oy = head + (ah - ts * L.h) / 2;
        if (touch) {
          const J = Math.min(62, side * .36, h * .17);
          if (!two) {
            R.ctrls.push({slot: 0, zone: {x: 0, y: head, w: side + 30, h: h - head}, bx: side / 2, by: h - J - 24, J, U: {x: w - side / 2, y: h - J - 24, r: Math.min(44, side * .26)}});
          } else for (const sl of [0, 1]) { const x0 = sl ? w - side : 0; R.ctrls.push({slot: sl, zone: {x: x0, y: head, w: side, h: h - head}, bx: x0 + side / 2, by: h - J - 20, J, U: {x: x0 + side / 2, y: h - J * 2 - 70, r: Math.min(34, side * .22)}}); }
        } else R.hint = h - 14;
      }
      return R;
    }
    const joy = [{x: 0, y: 0}, {x: 0, y: 0}], joyD = ['', ''], uCount = [0, 0], ptrs = new Map();
    const cmd = {rc: 0, sc: 0, sl: -1, zc: 0, wc: 0};
    let goal = null, goalN = 0;   // tap-to-move target {cell, ch, n} (walked by the host, so it also works for an online guest)
    const setGoal = gl => { goal = gl; goalN++; if (gl) gl.n = goalN; };
    /* every direction press is a numbered tap → never lost, even if it is shorter than a frame or arrives mid-step */
    const taps = [[], []]; let tapN = 0;
    const leans = [null, null];
    function addTap(sl, d) {
      taps[sl].push([++tapN, d]); if (taps[sl].length > 4) taps[sl].shift();
      if (goal) setGoal(null);
      const seat = ctx.mySeats[sl]; if (seat == null) return;
      const ch = chOf(seat); leans[ch] = {d, t: 0};      // same-frame response: lean + face that way (host confirms the step)
      if (!ctx.isHost) st.face[ch] = d;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') sawTouch = true;
      const pt = cv.pos(e), R = layout();
      if (selOpen) { closeSel(); return; }
      if (R.touch) {
        for (const c of R.ctrls) if (Math.hypot(pt.x - c.U.x, pt.y - c.U.y) < c.U.r * 1.35) { uCount[c.slot]++; ptrs.set(e.pointerId, {type: 'U', slot: c.slot, t: 0}); return; }
        for (const c of R.ctrls) { const z = c.zone; if (pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) { try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {} ptrs.set(e.pointerId, {type: 'J', slot: c.slot, ox: pt.x, oy: pt.y, R: c.J}); joy[c.slot] = {x: 0, y: 0}; joyD[c.slot] = ''; if (goal) setGoal(null); return; } }
      }
      // tap / click a cell: walk there
      if (ctx.mySeats.length !== 1 || st.ph !== 'play') return;
      const c = Math.floor((pt.x - R.ox) / R.ts), r = Math.floor((pt.y - R.oy) / R.ts);
      if (c < 0 || r < 0 || c >= L.w || r >= L.h) return;
      const ch = chOf(ctx.mySeats[0]), cell = r * L.w + c;
      if (cell === st.S.p[ch]) { setGoal(null); return; }
      setGoal({cell, ch, t: tAll}); ctx.sfx('tick');
    });
    ctx.on(cv.cv, 'pointermove', e => {
      const t = ptrs.get(e.pointerId); if (!t || t.type !== 'J') return;
      const pt = cv.pos(e); let dx = (pt.x - t.ox) / t.R, dy = (pt.y - t.oy) / t.R; const l = Math.hypot(dx, dy);
      if (l > 1.1) { t.ox = pt.x - dx / l * t.R * 1.1; t.oy = pt.y - dy / l * t.R * 1.1; dx = dx / l * 1.1; dy = dy / l * 1.1; }
      joy[t.slot] = {x: dx, y: dy};
      // 4-way stick with hysteresis: engage at 32 % throw, release below 22 %, switch axis only when the new one clearly dominates
      const cur = joyD[t.slot], ax = Math.abs(dx), ay = Math.abs(dy);
      let nd = cur;
      if (l < (cur ? .22 : .32)) nd = '';
      else { const want = ax > ay ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'); if (!cur || (want !== cur && (('LR'.includes(want) ? ax > ay * 1.3 : ay > ax * 1.3) || ('LR'.includes(want) === 'LR'.includes(cur))))) nd = want; }
      if (nd !== cur) { joyD[t.slot] = nd; if (nd) addTap(t.slot, nd); }
    });
    const up = e => { const t = ptrs.get(e.pointerId); if (t && t.type === 'J') { joy[t.slot] = {x: 0, y: 0}; joyD[t.slot] = ''; } ptrs.delete(e.pointerId); };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    const keyDir = (u, r, d, l) => { const k = ctx.keys; const order = [[u, 'U'], [d, 'D'], [l, 'L'], [r, 'R']]; let best = null; for (const [c, dd] of order) if (k.has(c)) { best = dd; if (lastKey === c) return dd; } return best; };
    let lastKey = '';
    function input(seat, slot, nLocal) {
      const sl = nLocal >= 2 ? slot : 0;
      let d = nLocal >= 2 ? (slot ? keyDir('ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft') : keyDir('KeyW', 'KeyD', 'KeyS', 'KeyA'))
        : (keyDir('KeyW', 'KeyD', 'KeyS', 'KeyA') || keyDir('ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'));
      if (!d) d = joyD[sl];
      const o = {d: d || '', uc: uCount[sl], tp: taps[sl].slice()};
      if (nLocal === 1) { o.gc = goal ? goal.cell : -1; o.gn = goalN; }
      if (sl === 0) { o.rc = cmd.rc; o.sc = cmd.sc; o.sl = cmd.sl; o.zc = cmd.zc; o.wc = cmd.wc; }
      return o;
    }
    const KD = {KeyW: 'U', KeyA: 'L', KeyS: 'D', KeyD: 'R', ArrowUp: 'U', ArrowLeft: 'L', ArrowDown: 'D', ArrowRight: 'R'};
    function key(e) {
      if (/^(Key[WASD]|Arrow)/.test(e.code)) lastKey = e.code;
      if (e.code === 'Tab' && canSwap()) { e.preventDefault(); if (!e.repeat) doSwap(); return; }
      if (e.repeat) return;
      if (KD[e.code] && !e.ctrlKey && !e.metaKey) addTap(ctx.mySeats.length >= 2 && e.code.startsWith('Arrow') ? 1 : 0, KD[e.code]);
      const two = ctx.mySeats.length >= 2;
      if (two) { if (e.code === 'KeyE' || e.code === 'Space') uCount[0]++; if (e.code === 'Period' || e.code === 'Enter' || e.code === 'NumpadEnter') uCount[1]++; }
      else if (['KeyE', 'Space', 'Enter', 'Period'].includes(e.code)) uCount[0]++;
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) doRestart();
      if ((e.code === 'KeyZ' && !e.shiftKey) || e.code === 'Backspace') { e.preventDefault(); doUndo(); }
    }
    /* ---------- DOM buttons: undo, restart, level select, swap, zoom ---------- */
    const ui = ctx.ui('mp-ui');
    const canSwap = () => ctx.mode === 'ai' && ctx.mySeats.length === 1;
    const bar = BX.h('div', {style: 'position:absolute;top:6px;right:6px;display:flex;gap:5px;align-items:center'});
    const mkB = (ic, tx, title, fn, cls) => { const b = BX.h('button', {class: 'bx-btn ' + (cls || 'ghost'), title, style: 'min-height:40px;min-width:42px;padding:4px 9px;font-size:15px;background-color:rgba(30,18,8,.55)', on: {click: e => { e.stopPropagation(); fn(); }}}); b._ic = ic; b._tx = tx; b.textContent = ic + ' ' + tx; return b; };
    const bUndo = mkB('↶', '撤销', '撤销一步（Z）', () => doUndo());
    const bRe = mkB('↺', '重来', '重来本关（R）', () => doRestart());
    const bSel = mkB('☰', '选关', '选关', () => openSel());
    const bSwap = mkB('⇄', '换人', '换成另一个角色（Tab）', () => doSwap());
    const bZoom = mkB('🔍', '全图', '全图 / 跟随镜头', () => { fullView = !fullView; ctx.sfx('click'); });
    bar.append(bZoom, bSwap, bUndo, bRe, bSel); ui.append(bar);
    if (!canSwap()) bSwap.style.display = 'none';
    let barKey = '';
    function syncBar(R) {
      const k = R.narrow + '|' + R.canZoom + '|' + fullView;
      if (k === barKey) return; barKey = k;
      for (const b of [bUndo, bRe, bSel, bSwap, bZoom]) b.textContent = R.narrow ? b._ic : b._ic + ' ' + b._tx;
      bZoom.style.display = R.canZoom ? '' : 'none'; bZoom.textContent = R.narrow ? (fullView ? '🎯' : '🔍') : (fullView ? '🎯 跟随' : '🔍 全图');
    }
    function doRestart() { cmd.rc++; setGoal(null); hintM = null; ctx.sfx('whoosh'); }
    function doUndo() { cmd.zc++; setGoal(null); ctx.sfx('click'); }
    function doSwap() { if (!canSwap()) return; cmd.wc++; setGoal(null); ctx.sfx('select'); }
    let selOpen = null;
    function openSel() {
      if (selOpen) { selOpen.remove(); selOpen = null; return; }
      const unl = Math.max(st.unl || 1, TEST ? 1 : ctx.load('unlocked', 1));
      const grid = BX.h('div', {style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px'},
        LEVELS.map((lvd, i) => { const bm = TEST ? null : BX.store.get('g.mechpuzzle.best.mv' + i, null); return BX.h('button', {class: 'bx-btn ' + (i === st.lv ? 'red' : i < unl ? '' : 'ghost'), disabled: i >= unl, style: 'min-height:58px;padding:4px;font-size:13px;line-height:1.25',
          html: `<b style="font-size:17px">${i + 1}</b>${bm != null ? ' ✓' : ''}<br>${i < unl ? lvd.n : '🔒'}${bm != null ? `<br><span style="font-size:11px;opacity:.8">最佳 ${bm} 步</span>` : ''}`, on: {click: () => { cmd.sl = i; cmd.sc++; ctx.sfx('click'); hintM = null; closeSel(); }}}); }));
      selOpen = BX.h('div', {class: 'bx-panel', style: 'position:absolute;left:50%;top:56px;transform:translateX(-50%);width:min(380px,94%);z-index:5'},
        BX.h('div', {style: 'display:flex;justify-content:space-between;align-items:center'}, BX.h('b', {text: '选择关卡', style: 'font-size:16px'}), BX.h('button', {class: 'bx-btn ghost', text: '✕', style: 'min-height:40px;padding:4px 14px', on: {click: () => closeSel()}})),
        grid, ctx.online && !ctx.isHost ? BX.h('div', {style: 'font-size:12px;opacity:.75;margin-top:6px', text: '（按房主的解锁进度）'}) : null);
      ui.append(selOpen);
    }
    function closeSel() { if (selOpen) { selOpen.remove(); selOpen = null; } }

    /* ---------------- hint: footprints of the next steps ---------------- */
    let hintM = null;
    const DNAME = {U: '上', D: '下', L: '左', R: '右'};
    function makeHint(quiet) {
      if (st.ph !== 'play') { if (!quiet) ctx.toast('稍等，关卡开始后再看提示'); return; }
      const mv = planFromHere(quiet ? 150 : 650);
      if (!mv) { if (!quiet) ctx.toast('这样好像走不通了，试试 ↶ 撤销或 ↺ 重来本关'); else hintM = null; return; }
      const t0 = quiet && hintM ? hintM.t : tAll;
      let S = st.S; const segs = [], keys = [];
      for (const m of mv.slice(0, 10)) {
        const r = m.d === 'X' ? tryAct(L, S, m.who) : tryMove(L, S, m.who, m.d);
        if (!r || r === 'stuck') break;
        segs.push({who: m.who, d: m.d, f: S.p[m.who], t: r.S.p[m.who]}); S = r.S; keys.push(skey(S));
      }
      hintM = {segs, keys, start: skey(st.S), t: t0, re: 0};
      if (quiet) return;
      const groups = []; for (const s2 of segs) { const g0 = groups[groups.length - 1]; if (g0 && g0.who === s2.who && g0.d === s2.d) g0.n++; else groups.push({who: s2.who, d: s2.d, n: 1}); }
      const txt = groups.slice(0, 3).map(q => CH[q.who].n + (q.d === 'X' ? '拉拉杆' : '向' + DNAME[q.d] + (q.n > 1 ? q.n + '步' : '一步'))).join('，再');
      ctx.toast('下一步：' + txt);
    }
    function trackHint() {
      if (!hintM) return;
      const k = skey(st.S); if (k === hintM.start) return;
      if (tAll - hintM.t > 30) { hintM = null; return; }
      const j = hintM.keys.indexOf(k);
      if (j < 0) { if (tAll - hintM.re > .4) { hintM.re = tAll; const re = hintM.re; makeHint(true); if (hintM) hintM.re = re; } return; }   // partner moved out of order: re-plan quietly
      hintM.segs = hintM.segs.slice(j + 1); hintM.keys = hintM.keys.slice(j + 1); hintM.start = k;
      if (!hintM.segs.length) hintM = null;
    }

    /* ---------------- effects ---------------- */
    let seenEv = 0, tAll = 0, lastGen = -1, banner = null;
    const bubbles = [null, null], links = [], waitT = [0, 0];
    const WHY = {mate: '让一让～', heavy: '我推不动木箱，要阿木来推', crate: '箱子那头被挡住了', pit: '是深坑！推只木箱进去填平', crack: '裂地太脆，我太重会踩塌', gap: '窄缝太小，我钻不过去',
      doora: '门关着：要有人踩住红色压力板', doorb: '门关着：要有人踩住黄色压力板', doorc: '门关着：要有人踩住蓝色压力板', lockk: '要金钥匙才能打开', lockj: '要玉钥匙才能打开',
      bridge: '吊桥收着，先去拉一下拉杆', far: '走不到那里', nolever: '这里没有拉杆'};
    function bubble(ch, w) { const s2 = WHY[w]; if (!s2) return; if (bubbles[ch] && bubbles[ch].s === s2 && bubbles[ch].t < 1.2) { bubbles[ch].t = Math.min(bubbles[ch].t, .3); return; } bubbles[ch] = {s: s2, t: 0}; }
    const anim = [{f: -1, t: -1, k: 1, ph: 0, sq: 0, dur: MOVE_T, e: 0, n: 0, end: -9}, {f: -1, t: -1, k: 1, ph: 0, sq: 0, dur: MOVE_T, e: 0, n: 0, end: -9}], crAnim = [], parts = [], bumps = [null, null], bumpCells = [];
    /* step easing: an isolated step snaps out fast (ease-out); steps that chain into each other glide (eased start, linear middle, eased stop) */
    const easeStep = (a, k) => a.e === 4 ? k * k * (3 - 2 * k) : a.e === 0 ? 1 - Math.pow(1 - k, 3) : a.e === 1 ? .5 * k + .5 * k * k * (2 - k) : a.e === 2 ? 1 - (1 - k) * (1 - k) * (1 + k) : k;
    const lastP = [-1, -1];
    let lastR = null; const drawnH = [[0, 0], [0, 0]];
    const cellXY = (i, R) => [R.ox + (i % L.w + .5) * R.ts, R.oy + (Math.floor(i / L.w) + .5) * R.ts];
    function burst(x, y, n, col, sp, life, kind) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = sp * (.3 + Math.random()); parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, life: life * (.6 + Math.random() * .5), max: life, col, kind: kind || 'dot', r: 2 + Math.random() * 3}); } }
    function playEv() {
      for (const e of st.ev) {
        if (e.id <= seenEv) continue; seenEv = e.id;
        const R = lastR;
        switch (e.k) {
          case 'mv': {
            const a = anim[e.c], chained = a.n && (a.k < 1 || tAll - a.end < .07);
            a.f = e.f; a.t = e.t; a.k = 0; a.dur = MOVE_T * (e.p ? PUSH_K : 1);
            a.e = e.p ? 4 : chained ? (e.n ? 3 : 2) : (e.n ? 1 : 0); a.n = e.p ? 0 : e.n; a.push = e.p;
            if (!chained) a.sq = e.p ? -.08 : .12;
            leans[e.c] = null; bumps[e.c] = null; ctx.sfx('tick'); break;
          }
          case 'push': crAnim.push({f: e.f, t: e.t, k: -.08, d: MOVE_T * PUSH_K}); ctx.sfx('move'); if (R) { const [x, y] = cellXY(e.f, R); burst(x, y + R.ts * .35, 5, 'rgba(200,170,120,.8)', 40, .4); } break;
          case 'fill': crAnim.push({f: e.f, t: e.t, k: 0, fill: 1}); ctx.sfx('splash'); if (R) { const [x, y] = cellXY(e.t, R); burst(x, y, 14, '#a8723d', 90, .6); } break;
          case 'key': ctx.sfx('coin'); if (R) { const [x, y] = cellXY(e.t, R); burst(x, y, 14, '#ffe08a', 110, .7, 'star'); } break;
          case 'lock': ctx.sfx('gong'); if (R) { const [x, y] = cellXY(e.t, R); burst(x, y, 16, '#ffe08a', 120, .8, 'star'); } break;
          case 'lever': ctx.sfx('roll'); anim[e.c].sq = .2; break;
          case 'stuck': ctx.sfx('error'); ctx.toast('桥上有东西，拉杆拉不动'); break;
          case 'nolever': bubble(e.c, 'nolever'); break;
          case 'bump': ctx.sfx('hit'); anim[e.c].sq = -.1; if (e.d) { bumps[e.c] = {d: e.d, t: 0}; if (e.i >= 0) bumpCells.push({i: e.i, t: 0}); } if (e.w) bubble(e.c, e.w); if (e.w && e.w !== 'mate' && ctx.mySeats.includes(seatOf(e.c))) ctx.buzz(15); break;
          case 'undo': ctx.sfx('whoosh'); anim.forEach((a, ch) => { if (lastP[ch] >= 0 && lastP[ch] !== st.S.p[ch]) { a.f = lastP[ch]; a.t = st.S.p[ch]; a.k = 0; a.dur = .11; a.e = 0; a.n = 0; } else { a.f = -1; a.k = 1; } }); crAnim.length = 0; break;
          case 'noundo': ctx.toast('已经退回到本关开头了'); break;
          case 'swap': ctx.sfx('select'); chipInfo(); if (ctx.mySeats.length === 1) ctx.toast('现在你是' + CH[chOf(ctx.mySeats[0])].n + '：' + CH[chOf(ctx.mySeats[0])].ab); break;
          case 'win': ctx.sfx('win'); ctx.buzz(30); hintM = null; if (goal) setGoal(null); banner = {s: '过关！', t: 0}; if (st.newBest) ctx.toast(`新纪录：${st.moves} 步！`); if (R) for (const i of st.S.p) { const [x, y] = cellXY(i, R); burst(x, y, 24, '#ffd34d', 150, 1, 'star'); } break;
          case 'reset': ctx.sfx('whoosh'); break;
        }
      }
    }
    const plateWas = {};
    function status() {
      const lvd = LEVELS[st.lv];
      ctx.status(`第 ${st.lv + 1}/${LEVELS.length} 关「${lvd.n}」` + (st.ph === 'clear' ? ' · 过关！' : ` · ${st.moves} 步`));
    }
    const chipInfo = () => { for (let s = 0; s < 2; s++) ctx.info(s, ctx.name(s) === CH[chOf(s)].n ? '' : CH[chOf(s)].n); };

    /* ---------------- rendering ---------------- */
    let bg = null, bgKey = '';
    function drawStatic(g, R) {
      const ts = R.ts, pad = ts * .35;
      D.wood(g, 0, 0, L.w * ts + pad * 2, L.h * ts + pad * 2, {r: pad, base: '#5a3a26', dark: '#2a160a', seed: 5});
      g.save(); g.translate(pad, pad);
      for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) {
        const t = L.t[r * L.w + c], x = c * ts, y = r * ts;
        if (t === '#') continue;
        g.fillStyle = (r + c) % 2 ? '#d9c6a2' : '#cfba92'; g.fillRect(x, y, ts, ts);
        g.strokeStyle = 'rgba(110,80,40,.18)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, ts - 1, ts - 1);
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + ts * .1, y + ts * .1, ts * .3, ts * .05);
        if (t === 'x') {
          g.fillStyle = '#bfa77e'; g.fillRect(x, y, ts, ts);
          g.strokeStyle = '#6b5030'; g.lineWidth = Math.max(1, ts * .035); g.lineCap = 'round';
          const R2 = BX.rng(r * 31 + c * 7);
          for (let k = 0; k < 3; k++) { g.beginPath(); let px = x + ts * (.2 + R2() * .6), py = y + ts * (.2 + R2() * .6); g.moveTo(px, py); for (let s2 = 0; s2 < 3; s2++) { px += (R2() - .5) * ts * .45; py += (R2() - .5) * ts * .45; g.lineTo(BX.clamp(px, x + 2, x + ts - 2), BX.clamp(py, y + 2, y + ts - 2)); } g.stroke(); }
        }
        if (t === '~' || t === '_' || t === '+') {
          const gr = g.createLinearGradient(0, y, 0, y + ts); gr.addColorStop(0, '#0d0906'); gr.addColorStop(1, '#2a1c12'); g.fillStyle = gr; g.fillRect(x + 1, y + 1, ts - 2, ts - 2);
          g.fillStyle = '#5a4230'; g.fillRect(x + 1, y + 1, ts - 2, ts * .14);
          if (t === '~') { g.fillStyle = 'rgba(60,110,140,.35)'; g.beginPath(); g.ellipse(x + ts / 2, y + ts * .72, ts * .32, ts * .08, 0, 0, 7); g.fill(); }
        }
        if ('abc'.includes(t)) {
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + ts / 2, y + ts * .56, ts * .38, ts * .3, 0, 0, 7); g.fill();
          g.fillStyle = '#8a6a3c'; g.beginPath(); g.ellipse(x + ts / 2, y + ts * .5, ts * .38, ts * .3, 0, 0, 7); g.fill();
        }
        if (t === 'M' || t === 'N') {
          const who = t === 'M' ? 0 : 1, col = CH[who].col;
          g.fillStyle = D.alpha(col, .25); g.fillRect(x + 2, y + 2, ts - 4, ts - 4);
          g.strokeStyle = col; g.lineWidth = Math.max(2, ts * .07); D.rr(g, x + ts * .1, y + ts * .1, ts * .8, ts * .8, ts * .12); g.stroke();
          g.fillStyle = col; D.rr(g, x + ts * .3, y + ts * .3, ts * .4, ts * .4, ts * .08); g.fill();
          D.text(g, who ? '灵' : '木', x + ts / 2, y + ts / 2 + 1, {size: ts * .3, color: '#fff8ea', font: 'serif', weight: 900});
        }
      }
      // walls (with top face); narrow gaps drawn as wall with a little arch
      for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) {
        const t = L.t[r * L.w + c], x = c * ts, y = r * ts;
        if (t !== '#' && t !== '=') continue;
        const below = r + 1 < L.h ? L.t[(r + 1) * L.w + c] : '#';
        g.fillStyle = '#6b4a36'; g.fillRect(x, y, ts, ts);
        if (below !== '#') { g.fillStyle = '#4a3020'; g.fillRect(x, y + ts * .72, ts, ts * .28); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + ts, ts, ts * .12); }
        g.fillStyle = '#86624a'; g.fillRect(x + 1, y + 1, ts - 2, (below !== '#' ? ts * .72 : ts) - 2);
        g.strokeStyle = 'rgba(40,20,10,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y + ts * .36); g.lineTo(x + ts, y + ts * .36); g.moveTo(x + ts * ((r % 2) ? .3 : .7), y); g.lineTo(x + ts * ((r % 2) ? .3 : .7), y + ts * .36); g.stroke();
        if (t === '=') {
          g.fillStyle = '#d9c6a2'; g.beginPath(); g.moveTo(x + ts * .28, y + ts); g.lineTo(x + ts * .28, y + ts * .55); g.arc(x + ts / 2, y + ts * .55, ts * .22, Math.PI, 0); g.lineTo(x + ts * .72, y + ts); g.fill();
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + ts / 2, y + ts * .55, ts * .22, Math.PI, 0); g.fill();
          g.strokeStyle = CH[1].col; g.lineWidth = Math.max(1.5, ts * .04); g.beginPath(); g.arc(x + ts / 2, y + ts * .55, ts * .26, Math.PI, 0); g.stroke();
          g.fillStyle = '#d9c6a2'; g.fillRect(x, y + ts * .9, ts, ts * .1);
        }
      }
      g.restore(); return pad;
    }
    function ensureBg(R) {
      const key = R.ts.toFixed(2) + '|' + cv.dpr + '|' + st.lv + '|' + st.gen;
      if (key !== bgKey) {
        bgKey = key; bg = document.createElement('canvas'); const pad = R.ts * .35;
        const W = L.w * R.ts + pad * 2, H = L.h * R.ts + pad * 2; bg.width = Math.ceil(W * cv.dpr); bg.height = Math.ceil(H * cv.dpr);
        const g2 = bg.getContext('2d'); g2.scale(cv.dpr, cv.dpr); drawStatic(g2, R); bg.pad = pad; bg.W = W; bg.H = H;
      }
      return bg;
    }
    function drawDynamic(g, R) {
      const ts = R.ts, S = st.S;
      for (let i = 0; i < L.t.length; i++) {
        const t = L.t[i]; if (t === '#' || t === '.' || t === 'x' || t === '=' || t === 'M' || t === 'N') continue;
        const x = R.ox + (i % L.w) * ts, y = R.oy + Math.floor(i / L.w) * ts, cx = x + ts / 2, cy = y + ts / 2;
        if ('abc'.includes(t)) {
          const on = occ(S, i), col = PCOL[t];
          if (plateWas[i] !== on) { if (plateWas[i] !== undefined) { ctx.sfx(on ? 'click' : 'tick'); if (on) links.push({p: i, c: t, t: 0}); } plateWas[i] = on; }
          g.fillStyle = on ? D.shade(col, -20) : col; g.beginPath(); g.ellipse(cx, cy + (on ? ts * .04 : 0), ts * .32, ts * .24, 0, 0, 7); g.fill();
          g.fillStyle = on ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(cx - ts * .06, cy - ts * .05, ts * .14, ts * .07, 0, 0, 7); g.fill();
          if (on) { g.strokeStyle = D.alpha(col, .5 + .4 * Math.sin(tAll * 6)); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, ts * .42, ts * .33, 0, 0, 7); g.stroke(); }
        } else if ('ABC'.includes(t)) {
          const open = doorOpen(L, S, i), col = PCOL[t.toLowerCase()];
          const k = (anim.door = anim.door || {}); k[i] = BX.lerp(k[i] == null ? (open ? 1 : 0) : k[i], open ? 1 : 0, .25);
          const o = k[i];
          g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y, ts, ts * .2);
          const vertical = (L.t[i - 1] === '#' || L.t[i + 1] === '#') && !(L.t[i - L.w] === '#' && L.t[i + L.w] === '#') ? false : true;
          g.save();
          if (vertical) { const hh = ts * (1 - o * .82); g.fillStyle = '#7a2a20'; g.fillRect(x + ts * .1, y, ts * .8, hh); g.strokeStyle = col; g.lineWidth = Math.max(1.5, ts * .06); g.strokeRect(x + ts * .1, y, ts * .8, hh); g.strokeStyle = 'rgba(230,197,125,.7)'; g.lineWidth = 1; for (let s2 = 1; s2 < 4; s2++) { if (hh > ts * s2 / 4) { g.beginPath(); g.moveTo(x + ts * .1, y + ts * s2 / 4); g.lineTo(x + ts * .9, y + ts * s2 / 4); g.stroke(); } } }
          else { const ww = ts * (1 - o * .82); g.fillStyle = '#7a2a20'; g.fillRect(x, y + ts * .1, ww, ts * .8); g.strokeStyle = col; g.lineWidth = Math.max(1.5, ts * .06); g.strokeRect(x, y + ts * .1, ww, ts * .8); g.strokeStyle = 'rgba(230,197,125,.7)'; g.lineWidth = 1; for (let s2 = 1; s2 < 4; s2++) { if (ww > ts * s2 / 4) { g.beginPath(); g.moveTo(x + ts * s2 / 4, y + ts * .1); g.lineTo(x + ts * s2 / 4, y + ts * .9); g.stroke(); } } }
          if (o < .5) { g.fillStyle = col; D.circle(g, cx, cy, ts * .1); g.fill(); g.strokeStyle = '#fff3e0'; g.lineWidth = 1; g.stroke(); }
          g.restore();
        } else if (t === '~') {
          if (S.fl.includes(i)) { g.fillStyle = '#9a6a38'; g.fillRect(x + 1, y + 1, ts - 2, ts - 2); g.strokeStyle = '#6b4426'; g.lineWidth = Math.max(1, ts * .05); g.beginPath(); g.moveTo(x + 2, y + 2); g.lineTo(x + ts - 2, y + ts - 2); g.moveTo(x + ts - 2, y + 2); g.lineTo(x + 2, y + ts - 2); g.stroke(); g.strokeRect(x + 2, y + 2, ts - 4, ts - 4); }
        } else if (t === '_' || t === '+') {
          const on = bridgeOn(L, S, i); const k = (anim.br = anim.br || {}); k[i] = BX.lerp(k[i] == null ? (on ? 1 : 0) : k[i], on ? 1 : 0, .18);
          const o = k[i]; if (o > .02) {
            g.save(); g.translate(cx, cy); g.scale(1, o);
            g.fillStyle = '#a8723d'; g.fillRect(-ts / 2 + 1, -ts / 2 + 2, ts - 2, ts - 4);
            g.strokeStyle = '#6b4426'; g.lineWidth = Math.max(1, ts * .04); for (let s2 = 0; s2 < 4; s2++) { const yy = -ts / 2 + 2 + (ts - 4) * s2 / 4; g.beginPath(); g.moveTo(-ts / 2 + 1, yy); g.lineTo(ts / 2 - 1, yy); g.stroke(); }
            g.fillStyle = '#5a3a20'; g.fillRect(-ts / 2 + 1, -ts / 2 + 2, ts * .08, ts - 4); g.fillRect(ts / 2 - 1 - ts * .08, -ts / 2 + 2, ts * .08, ts - 4);
            g.restore();
          }
        } else if (t === 'L') {
          g.fillStyle = '#5a5048'; D.rr(g, cx - ts * .3, cy + ts * .05, ts * .6, ts * .25, ts * .06); g.fill();
          const ang = S.lv ? .7 : -.7, k = (anim.lev = anim.lev == null ? ang : BX.lerp(anim.lev, ang, .2));
          g.save(); g.translate(cx, cy + ts * .15); g.rotate(k); g.strokeStyle = '#3a3028'; g.lineWidth = ts * .08; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -ts * .38); g.stroke();
          D.disc(g, 0, -ts * .4, ts * .1, S.lv ? '#3f9a4a' : '#d0533f', {shadow: false}); g.restore();
        } else if (t === 'k' || t === 'j') {
          if (!S.got.includes(i)) { const b = Math.sin(tAll * 3 + i) * ts * .05; g.fillStyle = D.alpha(KCOL[t], .25 + .15 * Math.sin(tAll * 4)); D.circle(g, cx, cy, ts * .36); g.fill(); drawKey(g, cx, cy + b, ts * .8, KCOL[t]); }
        } else if (t === 'K' || t === 'J') {
          const open = S.op.includes(i), col = KCOL[t.toLowerCase()];
          if (!open) {
            g.fillStyle = '#5a3a26'; g.fillRect(x + 1, y + 1, ts - 2, ts - 2); g.strokeStyle = col; g.lineWidth = Math.max(2, ts * .07); g.strokeRect(x + ts * .08, y + ts * .08, ts * .84, ts * .84);
            g.fillStyle = col; D.rr(g, cx - ts * .16, cy - ts * .05, ts * .32, ts * .26, ts * .05); g.fill(); g.strokeStyle = col; g.lineWidth = ts * .06; g.beginPath(); g.arc(cx, cy - ts * .06, ts * .1, Math.PI, 0); g.stroke();
            g.fillStyle = '#3a2410'; D.circle(g, cx, cy + ts * .07, ts * .04); g.fill();
          } else { g.strokeStyle = D.alpha(col, .5); g.lineWidth = 2; g.strokeRect(x + ts * .1, y + ts * .1, ts * .8, ts * .8); }
        }
      }
    }
    function drawCtrls(g, R) {
      for (const c of R.ctrls) {
        const seat = ctx.mySeats[c.slot] != null ? ctx.mySeats[c.slot] : c.slot, col = CH[chOf(seat)].col;
        let jt = null; for (const t of ptrs.values()) if (t.type === 'J' && t.slot === c.slot) jt = t;
        const bx = jt ? jt.ox : c.bx, by = jt ? jt.oy : c.by;
        g.fillStyle = 'rgba(30,18,8,.35)'; D.circle(g, bx, by, c.J); g.fill(); g.strokeStyle = 'rgba(255,240,210,.45)'; g.lineWidth = 2; g.stroke();
        g.fillStyle = 'rgba(255,240,210,.35)'; for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { g.save(); g.translate(bx + dx * c.J * .72, by + dy * c.J * .72); g.rotate(Math.atan2(dy, dx)); g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -6); g.lineTo(-4, 6); g.fill(); g.restore(); }
        const j = joy[c.slot]; D.disc(g, bx + j.x * c.J * .55, by + j.y * c.J * .55, c.J * .4, col, {ring: 'rgba(255,255,255,.5)'});
        const held = [...ptrs.values()].some(t => t.type === 'U' && t.slot === c.slot);
        D.disc(g, c.U.x, c.U.y + (held ? 2 : 0), c.U.r, '#3f7f6b', {ring: 'rgba(255,255,255,.55)'});
        D.text(g, '使用', c.U.x, c.U.y + (held ? 2 : 0), {size: c.U.r * .46, color: '#fff', weight: 800, shadow: true});
        if (R.ctrls.length > 1) D.text(g, CH[chOf(seat)].n, bx, by - c.J - 12, {size: 13, color: 'rgba(255,240,210,.85)', weight: 700});
      }
    }
    /* drawn hero position: eased step tween + bump nudge (into the blocker and back) + lean on a fresh press */
    function heroXY(ch, R) {
      R = R || lastR; const a = anim[ch], S = st.S; let [x, y] = cellXY(S.p[ch], R);
      if (a.k < 1 && a.t === S.p[ch] && a.f >= 0) { const [fx0, fy0] = cellXY(a.f, R), k = easeStep(a, a.k); x = BX.lerp(fx0, x, k); y = BX.lerp(fy0, y, k); }
      const b = bumps[ch]; if (b && DIRS[b.d]) { const o = Math.sin(Math.PI * Math.min(1, b.t / BUMP_T)) * R.ts * .13; x += DIRS[b.d][0] * o; y += DIRS[b.d][1] * o; }
      const ln = leans[ch]; if (ln && a.k >= 1 && DIRS[ln.d]) { const o = Math.sin(Math.PI * Math.min(1, ln.t / .12)) * R.ts * .06; x += DIRS[ln.d][0] * o; y += DIRS[ln.d][1] * o; }
      return [x, y];
    }
    /* the remaining walking path to the tapped cell (same BFS the host walks) */
    function goalPath(ch, cell) {
      const S = st.S, from = S.p[ch], prev = new Map([[from, -1]]), q = [from];
      for (let h = 0; h < q.length && !prev.has(cell); h++) { const u = q[h]; for (const d of Object.keys(DIRS)) { const n = nb(L, u, d); if (n < 0 || prev.has(n) || charAt(S, n) >= 0 || S.cr.includes(n) || !walkable(L, S, ch, n)) continue; prev.set(n, u); q.push(n); } }
      if (!prev.has(cell)) return null;
      const path = []; for (let c = cell; c !== from && c >= 0; c = prev.get(c)) path.unshift(c); return path;
    }
    function draw(dt) {
      tAll += dt;
      for (const ch of [0, 1]) { if (bumps[ch] && (bumps[ch].t += dt) > BUMP_T) bumps[ch] = null; if (leans[ch] && (leans[ch].t += dt) > .12) leans[ch] = null; }
      if (goal) { const me = ctx.mySeats[0]; if (st.S && (st.S.p[goal.ch] === goal.cell || (me != null && st.ga && st.ga[me] >= goal.n && st.gl[goal.ch] !== goal.cell && tAll - goal.t > .1))) goal = null; }
      const g = cv.g; cv.clear();
      if (lastGen !== st.gen) { lastGen = st.gen; const P = parse(LEVELS[st.lv]); L = P.L; anim.forEach(a => { a.f = -1; a.k = 1; }); crAnim.length = 0; anim.door = {}; anim.br = {}; anim.lev = null; for (const k in plateWas) delete plateWas[k]; chipInfo(); camX = null; hintM = null; if (goal) setGoal(null); bubbles[0] = bubbles[1] = null; links.length = 0; }
      {  // camera target: my character (or both) — used when a wide map is shown zoomed on a portrait phone
        const chs = ctx.mySeats.length === 1 && !BX.bot ? [chOf(ctx.mySeats[0])] : [0, 1];
        const tx = chs.reduce((acc, ch) => acc + (lastR ? (heroXY(ch) [0] - lastR.ox) / lastR.ts : st.S.p[ch] % L.w + .5), 0) / chs.length;
        camX = camX == null ? tx : camX + (tx - camX) * Math.min(1, dt * 5);
      }
      const R = layout(); lastR = R;
      playEv(); trackHint(); syncBar(R);
      const gr = g.createLinearGradient(0, 0, 0, cv.h); gr.addColorStop(0, '#2e2018'); gr.addColorStop(1, '#1a110c'); g.fillStyle = gr; g.fillRect(0, 0, cv.w, cv.h);
      g.fillStyle = 'rgba(230,197,125,.05)'; for (let x = 0; x < cv.w; x += 40) for (let y = 0; y < cv.h; y += 40) { g.beginPath(); g.arc(x + ((y / 40) % 2) * 20, y, 6, 0, 7); g.fill(); }
      const B = ensureBg(R); g.drawImage(B, R.ox - B.pad, R.oy - B.pad, B.W, B.H);
      drawDynamic(g, R);
      const ts = R.ts, S = st.S;
      // plate → door links (who opens what)
      for (let j = links.length - 1; j >= 0; j--) {
        const k = links[j]; k.t += dt; if (k.t > 1.4) { links.splice(j, 1); continue; }
        const [px, py] = cellXY(k.p, R); g.save(); g.globalAlpha = Math.min(1, (1.4 - k.t) * 2); g.strokeStyle = PCOL[k.c]; g.lineWidth = Math.max(2, ts * .07); g.setLineDash([ts * .18, ts * .12]); g.lineDashOffset = -k.t * 60;
        L.t.forEach((t, i) => { if (t === k.c.toUpperCase()) { const [dx, dy] = cellXY(i, R); g.beginPath(); g.moveTo(px, py); g.lineTo(dx, dy); g.stroke(); } });
        g.restore();
      }
      // tap-to-move target
      if (goal) {
        const [x, y] = cellXY(goal.cell, R), age = tAll - goal.t, pk = age < .2 ? 1 + (1 - age / .2) * .5 : 1, k = Math.sin(tAll * 8) * .06, col = CH[goal.ch].col;
        const path = goalPath(goal.ch, goal.cell);
        if (path) { g.fillStyle = D.alpha(col, .7); path.forEach((c, j) => { if (c === goal.cell) return; const [px, py] = cellXY(c, R), on = Math.min(1, Math.max(0, age * 12 - j * .6)); if (on > 0) { D.circle(g, px, py + ts * .1, ts * .07 * on); g.fill(); } }); }
        g.strokeStyle = D.alpha(col, .85); g.lineWidth = Math.max(2, ts * .06); g.beginPath(); g.ellipse(x, y + ts * .1, ts * (.32 + k) * pk, ts * (.2 + k * .6) * pk, 0, 0, 7); g.stroke();
      }
      for (let j = bumpCells.length - 1; j >= 0; j--) { const b = bumpCells[j]; b.t += dt; if (b.t > .35) { bumpCells.splice(j, 1); continue; } const x = R.ox + (b.i % L.w) * ts, y = R.oy + Math.floor(b.i / L.w) * ts; g.strokeStyle = `rgba(208,83,63,${.8 * (1 - b.t / .35)})`; g.lineWidth = Math.max(2, ts * .06); D.rr(g, x + 3, y + 3, ts - 6, ts - 6, ts * .12); g.stroke(); }
      // hint footprints
      if (hintM) hintM.segs.forEach((sg, j) => {
        const [fx0, fy0] = cellXY(sg.f, R), [tx, ty] = cellXY(sg.t, R), col = CH[sg.who].col, pulse = .65 + .35 * Math.sin(tAll * 5 - j * .6);
        g.globalAlpha = Math.max(.35, 1 - j * .07) * pulse;
        if (sg.d === 'X') { D.disc(g, fx0, fy0 - ts * .32, ts * .2, '#ffd34d', {shadow: false}); D.text(g, '拉', fx0, fy0 - ts * .31, {size: ts * .22, color: '#5a2a10', weight: 900}); }
        else {
          const ang = Math.atan2(ty - fy0, tx - fx0), mx0 = (fx0 + tx) / 2, my0 = (fy0 + ty) / 2;
          g.save(); g.translate(mx0, my0); g.fillStyle = 'rgba(255,240,200,.55)'; D.circle(g, 0, 0, ts * .24); g.fill(); g.rotate(ang); g.fillStyle = col; g.strokeStyle = '#fff3e0'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(ts * .24, 0); g.lineTo(-ts * .12, -ts * .19); g.lineTo(-ts * .04, 0); g.lineTo(-ts * .12, ts * .19); g.closePath(); g.fill(); g.stroke(); g.restore();
          if (j < 9) D.text(g, String(j + 1), mx0, my0 - ts * .22, {size: Math.max(10, ts * .2), color: '#fff3e0', weight: 800, stroke: col, strokeW: 3});
        }
        g.globalAlpha = 1;
      });
      // crates (animate pushes)
      for (let j = crAnim.length - 1; j >= 0; j--) {
        const a = crAnim[j]; a.k += dt / ((a.d || MOVE_T) * (a.fill ? 1.6 : 1));
        if (a.k >= 1) { crAnim.splice(j, 1); if (!a.fill) { try { BX.sfx.noise(.09, .16, 'lowpass', 260, 120, 1); } catch (er) {} const [x, y] = cellXY(a.t, R); burst(x, y + ts * .35, 4, 'rgba(200,170,120,.7)', 30, .35); } }
      }
      for (const i of S.cr) {
        const a = crAnim.find(q => q.t === i && !q.fill); let [x, y] = cellXY(i, R), sq = 0;
        // heavy crate: starts a beat after the push, eases in and out, a little squash on the stop
        if (a) { const [fx0, fy0] = cellXY(a.f, R), kk = BX.clamp(a.k, 0, 1), k = kk * kk * (3 - 2 * kk); x = BX.lerp(fx0, x, k); y = BX.lerp(fy0, y, k); sq = kk > .8 ? Math.sin((kk - .8) / .2 * Math.PI) * .05 : 0; }
        if (sq) { g.save(); g.translate(x, y + ts * .36); g.scale(1 + sq, 1 - sq); g.translate(-x, -(y + ts * .36)); drawCrate(g, x, y, ts * .92); g.restore(); } else drawCrate(g, x, y, ts * .92);
      }
      for (const a of crAnim) if (a.fill) { const [fx0, fy0] = cellXY(a.f, R), [tx, ty] = cellXY(a.t, R), k = BX.clamp(a.k, 0, 1); const kk = Math.min(1, k * 2); drawCrate(g, BX.lerp(fx0, tx, kk), BX.lerp(fy0, ty, kk), ts * .92 * (1 - Math.max(0, k - .5) * .6), Math.max(0, k - .5) * 2); }
      // heroes, depth sorted
      const order = [0, 1].sort((a, b) => S.p[a] - S.p[b]);
      for (const ch of order) {
        const a = anim[ch]; const was = a.k; a.k = Math.min(1, a.k + dt / (a.dur || MOVE_T)); if (was < 1 && a.k >= 1) a.end = tAll; a.ph += dt * (a.k < 1 ? 16 : 4); a.sq *= Math.pow(.02, dt);
        let [x, y] = heroXY(ch);
        lastP[ch] = S.p[ch];
        const win = st.ph === 'clear'; drawnH[ch] = [x, y];
        const mine = ctx.mySeats.includes(seatOf(ch)) && !BX.bot;
        if (mine) { g.strokeStyle = D.alpha(CH[ch].col, .6); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + ts * .3, ts * .36, ts * .13, 0, 0, 7); g.stroke(); }
        drawHero(g, x, y + ts * .32, ts * (ch ? .95 : 1.05), ch, st.face[ch], a.ph, a.k < 1, a.sq + (a.k < 1 ? Math.sin(a.k * Math.PI) * (a.push ? -.06 : .08) : 0), win);
        if (L.t[S.p[ch]] === 'L' && st.ph === 'play') { const bob = Math.sin(tAll * 5) * 2; g.fillStyle = 'rgba(30,18,8,.8)'; D.rr(g, x - ts * .5, y - ts * 1.25 + bob, ts, ts * .34, ts * .1); g.fill(); D.text(g, '可拉杆', x, y - ts * 1.08 + bob, {size: ts * .2, color: '#ffe08a', weight: 800}); }
      }
      // keys held indicator
      const kx = R.ox + 4; let kk = 0;
      for (const kt of ['k', 'j']) for (let n = 0; n < S.k[kt]; n++) { drawKey(g, kx + 18 + kk * 30, R.oy - 14, 22, KCOL[kt]); kk++; }
      // particles
      for (let j = parts.length - 1; j >= 0; j--) {
        const q = parts[j]; q.life -= dt; if (q.life <= 0) { parts.splice(j, 1); continue; }
        q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; const a = q.life / q.max;
        g.globalAlpha = a; g.fillStyle = q.col;
        if (q.kind === 'star') { g.save(); g.translate(q.x, q.y); g.rotate(q.life * 9); g.beginPath(); for (let n = 0; n < 10; n++) { const rr = n % 2 ? q.r * .45 : q.r * 1.5; g.lineTo(Math.cos(n * .628) * rr, Math.sin(n * .628) * rr); } g.fill(); g.restore(); }
        else { D.circle(g, q.x, q.y, q.r); g.fill(); }
        g.globalAlpha = 1;
      }
      // speech bubbles: blocked-move reasons, start-of-level abilities, at-exit, AI waiting for you
      const say = (ch, txt, col, k = 1) => {
        const [x, y] = heroXY(ch), fs = BX.clamp(ts * .3, 12, 15); g.font = `700 ${fs}px sans-serif`;
        const w2 = Math.min(cv.w - 8, g.measureText(txt).width + 16), bx = BX.clamp(x - w2 / 2, 4, cv.w - w2 - 4), by = y - ts * (ch ? 1.25 : 1.4) - fs * 1.6;
        g.globalAlpha = k; g.fillStyle = 'rgba(30,18,8,.9)'; D.rr(g, bx, by, w2, fs * 1.6, fs * .5); g.fill(); g.strokeStyle = col || CH[ch].col; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = 'rgba(30,18,8,.9)'; g.beginPath(); g.moveTo(x - 5, by + fs * 1.6 - .5); g.lineTo(x + 5, by + fs * 1.6 - .5); g.lineTo(x, by + fs * 1.6 + 6); g.fill();
        D.text(g, txt, bx + w2 / 2, by + fs * .82, {size: fs, color: '#fff3e0', weight: 700, maxW: w2 - 10}); g.globalAlpha = 1;
      };
      for (const ch of [0, 1]) {
        const sd = seatOf(ch); waitT[ch] = ctx.isBot(sd) && ai[sd] && ai[sd].waiting && st.ph === 'play' ? waitT[ch] + dt : 0;
        const b = bubbles[ch]; if (b) { b.t += dt; if (b.t > 2) bubbles[ch] = null; }
        if (st.ph !== 'play' || BX.bot) continue;
        if (bubbles[ch]) say(ch, bubbles[ch].s, '#d0533f', Math.min(1, (2 - bubbles[ch].t) * 3));
        else if (st.moves === 0) { const mine = ctx.mySeats.length === 1 && chOf(ctx.mySeats[0]) === ch; say(ch, (mine ? '我是' : '') + CH[ch].n + '·' + (ch ? '能走裂地、钻窄缝' : '能推木箱')); }
        else if (L.t[S.p[ch]] === (ch ? 'N' : 'M')) say(ch, '✓ 到出口了', '#3f9a4a');
        else if (waitT[ch] > 2.5) say(ch, '我在等你～不知道怎么走就点 💡', '#e0a020');
      }
      // off-screen partner arrows (zoomed camera)
      if (R.follow) for (const ch of [0, 1]) {
        const [x, y] = heroXY(ch); if (x > 6 && x < cv.w - 6) continue;
        const left = x <= 6, ax = left ? 16 : cv.w - 16, b = Math.sin(tAll * 5) * 3;
        g.fillStyle = CH[ch].col; g.strokeStyle = '#fff3e0'; g.lineWidth = 2; g.beginPath();
        if (left) { g.moveTo(ax - 10 + b, y); g.lineTo(ax + 6 + b, y - 11); g.lineTo(ax + 6 + b, y + 11); } else { g.moveTo(ax + 10 - b, y); g.lineTo(ax - 6 - b, y - 11); g.lineTo(ax - 6 - b, y + 11); }
        g.closePath(); g.fill(); g.stroke();
        D.text(g, CH[ch].n, left ? ax + 22 : ax - 22, y, {size: 12, color: '#fff3e0', weight: 700, stroke: '#1a110c', strokeW: 3});
      }
      // ability legend under the map (portrait)
      if (R.legend && !BX.bot) {
        const lw = (cv.w - 24) / 2;
        [['阿木', '能推木箱 · 怕裂地/窄缝', CH[0].col], ['小灵', '能走裂地、钻窄缝 · 推不动箱', CH[1].col]].forEach(([n, t, col], j) => {
          const x = 8 + j * (lw + 8), y = R.legend.y;
          g.fillStyle = 'rgba(30,18,8,.6)'; D.rr(g, x, y - 15, lw, 30, 9); g.fill(); g.strokeStyle = D.alpha(col, .7); g.lineWidth = 1.5; g.stroke();
          g.fillStyle = col; D.circle(g, x + 13, y, 6); g.fill();
          D.text(g, n, x + 24, y, {size: 13, color: '#ffe08a', weight: 800, align: 'left'});
          D.text(g, t, x + 54, y, {size: 11, color: 'rgba(243,226,192,.9)', align: 'left', maxW: lw - 60});
        });
      }
      // header: level name + hint
      const lvd = LEVELS[st.lv], hx = 12, narrow = cv.w < 640, barW = bar.offsetWidth || 0;
      D.text(g, `第${st.lv + 1}关 · ${lvd.n}`, hx, narrow ? 24 : 17, {size: narrow ? 18 : 17, color: '#ffe08a', font: 'deco', weight: 400, align: 'left', maxW: cv.w - barW - 24});
      D.text(g, lvd.h, hx, narrow ? 66 : 39, {size: narrow ? 12.5 : 13.5, color: 'rgba(243,226,192,.9)', align: 'left', maxW: narrow ? cv.w - 20 : cv.w - barW - 30});
      // phases
      const mx = R.ox + L.w * ts / 2, my = R.oy + L.h * ts / 2;
      if (st.ph === 'intro') { const k = BX.clamp(1 - st.t / 1.4, 0, 1); g.globalAlpha = Math.min(1, st.t * 3); D.text(g, `第${st.lv + 1}关`, mx, my - ts * .4, {size: ts * 1.1, color: '#fff3e0', font: 'deco', weight: 400, stroke: '#5a2a18', strokeW: 6}); D.text(g, lvd.n, mx, my + ts * .6, {size: ts * .7, color: '#ffe08a', font: 'deco', weight: 400, stroke: '#5a2a18', strokeW: 5}); g.globalAlpha = 1; void k; }
      if (banner) { banner.t += dt; if (banner.t > 2) banner = null; else { const k = BX.ease.back(Math.min(1, banner.t / .35)); g.save(); g.translate(mx, my); g.scale(k, k); D.text(g, banner.s, 0, 0, {size: ts * 1.4, color: '#ffe08a', font: 'deco', weight: 400, stroke: '#8a2a20', strokeW: 7}); g.restore(); } }
      if (R.hint) {
        const two = ctx.mySeats.length >= 2;
        D.text(g, two ? '左：WASD 移动 · E 使用　　右：方向键 移动 · . 使用　　Z 撤销 · R 重来' : 'WASD / 方向键 移动 · 点格子自动走 · 空格 / E 拉杆 · Z 撤销 · R 重来' + (canSwap() ? ' · Tab 换人' : ''), cv.w / 2, R.hint, {size: 13, color: 'rgba(243,226,192,.7)', maxW: cv.w - 20});
      }
      if (R.touch) drawCtrls(g, R);
      status();
    }

    load(st.lv);
    chipInfo();
    return {
      st, input, aiInput, key, step,
      hint() { makeHint(); },
      snapshot() { return {lv: st.lv, S: st.S, ph: st.ph, t: Math.round(st.t * 100) / 100, gen: st.gen, face: st.face, cleared: st.cleared, moves: st.moves, ev: st.ev, evId: st.evId, over: st.over, unl: st.unl, role: st.role, ga: st.ga, gl: st.gl}; },
      restore(d) { Object.assign(st, d); if (!L || L.__lv !== st.lv) { L = parse(LEVELS[st.lv]).L; L.__lv = st.lv; } },
      draw,
      _feel: () => ({goal: goal && goal.cell, h: drawnH.map(a => a.slice()), p: st.S.p.slice(), moves: st.moves, ph: st.ph, ts: lastR && lastR.ts, ox: lastR && lastR.ox, oy: lastR && lastR.oy, w: L.w}),
      _dbg: () => ({lv: st.lv, ph: st.ph, p: st.S.p, ptr: ai.map(a => a.ptr), n: plan && plan.mv.length, cleared: st.cleared, onPlan: plan && plan.keys.indexOf(skey(st.S)), next: plan && ai.map((a, s2) => { const i = nextOwn(chOf(s2), a.ptr); return i === Infinity ? null : [i, plan.mv[i], plan.pos[i]]; }), ai: ai.map(a => [a.waiting, a.wt, a.div])}),
    };
  },
  _mp: {LEVELS, SOL, parse, tryMove, tryAct, isWin, solve},
});
