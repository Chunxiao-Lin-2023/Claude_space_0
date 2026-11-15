/* ===== 大鬼屋地图生成（RULES 36）=====
   每个场景一份蓝图：路线房间（游客依次走）+ 侧室（游客不进，能躲、能埋伏）。生成器把 6×4 个区块（每块 10×10）
   按一条蛇形路线分给各个房间：一个房间占 1–3 块，相邻块打通成 L / T 形，块内边缘随机内缩、切角，所以不方正。
   区块之间的厚墙里是员工通道（stw：游客眼里是墙，陈歌和员工能走），员工位是通道在房间墙上开的暗口（boo hole）。
   每个房间有主题摆设和一个「剧情点」（第一次有游客进来时触发：look 盯着某样东西 / dark 灯灭 / story 一句不对劲的话）。
   固定种子：同一个场景每次生成都一样。 */
const HGEN = { nx: 6, ny: 4, S: 11 };
/* 房间：n 名字，fl 地面，k 占几块，d 摆设 [精灵, 个数, 选项]，w 墙上挂的，h 柜子，b 剧情点，dk 黑屋 */
const HBP = {
  mh: { n: '冥婚', wall: 'red', fl: 'darkwood', dark: .8, tileOpts: { carpetC: '#5a1414', rugC: '#7a1a1a' }, seed: 11, hide: 'wardrobe', sp: '正堂', task: '婚房',
    route: [
      { n: '前院', fl: 'stone', k: 2, d: [['lantern', 2], ['well', 1], ['stonelantern', 2], ['deadplant', 3], ['crate', 1]], b: ['look', 'well', '井里……是不是有人在唱戏？'] },
      { n: '迎亲堂', fl: 'darkwood', k: 2, d: [['chair', 4], ['table', 2], ['candles', 2], ['cushion', 2]], w: [['portrait', 2], ['scroll', 1]], b: ['story', '墙上的喜字是倒着贴的。'] },
      { n: '正堂', fl: 'darkwood', k: 3, d: [['altar', 1], ['candles', 3], ['incense', 2], ['chair', 4], ['cushion', 3]], w: [['portrait', 3]], b: ['look', 'altar', '供桌上摆的……是两副碗筷？'] },
      { n: '绣房', fl: 'wood', k: 1, d: [['table', 1], ['basket', 2], ['linen', 2], ['scissors', 1], ['chair', 1], ['candle', 1]], b: ['story', '红线一圈一圈缠在剪刀上。'] },
      { n: '灵堂', fl: 'stone', k: 2, dk: 1, d: [['hcoffin', 1], ['candles', 2], ['paperman', 2], ['incense', 2], ['photo', 1]], b: ['dark', '蜡烛一下子全灭了。'] },
      { n: '柴房', fl: 'dirt', k: 1, d: [['crate', 3], ['sack', 2], ['barrel', 2], ['rope', 1]], b: ['look', 'rope', '房梁上那根绳子……自己在晃。'] },
      { n: '婚房', fl: 'redfloor', k: 2, d: [['bed', 1, { h: 2, col: '#9a1010' }], ['vanity', 1], ['doll', 2], ['candle', 2], ['dresser', 1]], w: [['mirror', 1], ['window', 1]], b: ['story', '被子底下鼓着一个人形。'] },
      { n: '祠堂', fl: 'darkwood', k: 2, d: [['shrine', 1], ['candles', 2], ['statue', 2], ['incense', 1]], w: [['scroll', 2]], b: ['look', 'shrine', '最新的那块牌位上……写的是谁？'] },
      { n: '后院', fl: 'stone', k: 2, d: [['gravestone', 3], ['deadplant', 3], ['lantern', 2], ['well', 1]], b: ['story', '院墙外有吹唢呐的声音，越来越近。'] }],
    side: [{ n: '喜轿间', fl: 'darkwood', d: [['cart', 1], ['box', 2], ['lantern', 1]] }, { n: '厨房', fl: 'tile', d: [['stove', 1], ['table', 1], ['barrel', 1], ['basket', 1]] }, { n: '账房', fl: 'wood', d: [['desk', 1], ['bookshelf', 2], ['book', 1], ['candle', 1]] }] },
  ws: { n: '午夜逃杀', wall: 'plain', fl: 'wood', dark: .86, wallC: { top: '#3a3a36', face: '#7a7a70' }, seed: 23, hide: 'closet', sp: '走廊', task: '203',
    route: [
      { n: '楼道口', fl: 'concrete', k: 1, d: [['shoes', 2], ['lamp', 1], ['box', 1]], w: [['poster', 2]], b: ['look', 'poster', '寻人启事上的照片……是我们几个？'] },
      { n: '101', fl: 'wood', k: 2, d: [['bed', 1, { h: 2, col: '#5a5a6a' }], ['table', 1], ['tv', 1], ['fridge', 1], ['chair', 1]], b: ['look', 'tv', '电视自己开了，满屏雪花。'] },
      { n: '走廊', fl: 'linoleum', k: 3, dk: 1, d: [['lamp', 2], ['shoes', 2]], w: [['clock', 1]], b: ['dark', '声控灯啪地灭了。'] },
      { n: '102 浴室', fl: 'greentile', k: 1, d: [['bathtub', 1, { w: 2 }], ['sink', 1], ['toilet', 1], ['towel', 1]], b: ['story', '浴缸里的水……还是温的。'] },
      { n: '房东的屋', fl: 'darkwood', k: 2, d: [['desk', 1], ['cabinet', 2], ['photo', 1], ['key', 1], ['chair', 1], ['lamp', 1]], w: [['clock', 1]], b: ['look', 'cabinet', '柜门缝里夹着一缕长头发。'] },
      { n: '104 儿童房', fl: 'carpet', k: 1, d: [['doll', 3], ['bed', 1, { h: 2, col: '#7a5a8a' }], ['box', 1]], b: ['story', '墙上用蜡笔画了五个人，第五个没有脸。'] },
      { n: '水房', fl: 'tile', k: 1, d: [['sink', 2], ['bucket', 2]], b: ['look', 'sink', '水龙头里流出来的……是头发。'] },
      { n: '203', fl: 'wood', k: 2, d: [['bed', 1, { h: 2, col: '#5a2a2a' }], ['dresser', 1], ['scissors', 1], ['candle', 1], ['chair', 1]], w: [['window', 1]], b: ['story', '窗户从里面钉死了。钉子是新的。'] },
      { n: '天台', fl: 'concrete', k: 2, d: [['box', 2], ['crate', 2], ['streetlamp', 1]], b: ['look', 'streetlamp', '天台边上站着一个人，背对着你们。'] }],
    side: [{ n: '配电间', fl: 'concrete', d: [['switch', 1], ['box', 2], ['crate', 1]] }, { n: '储物间', fl: 'wood', d: [['box', 3], ['crate', 1], ['bucket', 1]] }, { n: '管理员室', fl: 'linoleum', d: [['desk', 1], ['tv', 1], ['chair', 1], ['lamp', 1]] }] },
  zombie: { n: '僵尸复活夜', wall: 'concrete', fl: 'tile', dark: .78, seed: 37, hide: 'locker', sp: '货架区', task: '冷库',
    route: [
      { n: '入口', fl: 'tile', k: 1, d: [['cart', 2], ['vending', 1], ['lamp', 1]], b: ['story', '自动门在身后关上了，再也没开。'] },
      { n: '收银台', fl: 'tile', k: 2, d: [['counter', 3], ['vending', 1], ['cart', 1], ['box', 1]], b: ['look', 'counter', '收银机自己在打小票，哗哗地往外吐。'] },
      { n: '货架区', fl: 'tile', k: 3, d: [['shelf', 12], ['cart', 1], ['box', 2]], b: ['look', 'shelf', '货架后面……有东西在嚼。'] },
      { n: '生鲜区', fl: 'greentile', k: 2, d: [['fridge', 5], ['counter', 1], ['sack', 1]], b: ['story', '冰柜里的肉在动。'] },
      { n: '冷库', fl: 'metal', k: 2, dk: 1, d: [['fridge', 3], ['crate', 2], ['barrel', 1]], b: ['dark', '冷库的灯闪了两下，灭了。'] },
      { n: '监控室', fl: 'linoleum', k: 1, d: [['tv', 2], ['desk', 1], ['chair', 1], ['lamp', 1]], b: ['look', 'tv', '监控画面里，你们身后多了一排人。'] },
      { n: '仓库', fl: 'concrete', k: 2, d: [['crate', 5], ['barrel', 2], ['sack', 2]], b: ['story', '箱子上印着：实验样本，严禁开启。'] },
      { n: '员工间', fl: 'linoleum', k: 1, d: [['table', 1], ['chair', 2], ['tv', 1]], b: ['look', 'table', '桌上的盒饭还冒着热气。'] },
      { n: '后巷', fl: 'asphalt', k: 2, d: [['streetlamp', 2], ['barrel', 2], ['crate', 1]], b: ['story', '巷子尽头的铁门在被人拍。'] }],
    side: [{ n: '卸货区', fl: 'concrete', d: [['crate', 3], ['cart', 1]] }, { n: '更衣室', fl: 'linoleum', d: [['locker', 3], ['bench', 1]] }, { n: '锅炉房', fl: 'metal', d: [['barrel', 2], ['box', 1]] }] },
  room: { n: '三个人的房间', wall: 'paper', fl: 'wood', dark: .84, wallC: { top: '#3a3430', face: '#8a7a6a' }, seed: 41, hide: 'wardrobe', sp: '客厅', task: '主卧',
    route: [
      { n: '玄关', fl: 'tile', k: 1, d: [['shoes', 3], ['lamp', 1]], w: [['mirror', 1]], b: ['look', 'mirror', '玄关镜子里……三个人？我们明明两个。'] },
      { n: '客厅', fl: 'wood', k: 3, d: [['sofa', 2], ['lowtable', 1], ['tv', 1], ['lamp', 2], ['plant', 1]], w: [['famphoto', 1], ['clock', 1]], b: ['look', 'tv', '电视里放的是这间客厅，沙发上坐着一个人。'] },
      { n: '餐厅', fl: 'wood', k: 1, d: [['table', 1], ['chair', 3], ['candle', 1]], b: ['story', '桌上摆着三副碗筷，有一碗吃了一半。'] },
      { n: '厨房', fl: 'tile', k: 1, d: [['stove', 1], ['fridge', 1], ['sink', 1], ['knife', 1]], b: ['look', 'fridge', '冰箱门开着一条缝，里面亮着。'] },
      { n: '儿童房', fl: 'carpet', k: 2, d: [['bed', 1, { h: 2, col: '#7a6a9a' }], ['doll', 3], ['box', 1], ['lamp', 1]], b: ['story', '床底下有个小孩在数：一、二、三……'] },
      { n: '书房', fl: 'darkwood', k: 1, dk: 1, d: [['desk', 1], ['bookshelf', 2], ['chair', 1]], b: ['dark', '台灯自己关了。'] },
      { n: '主卧', fl: 'carpet', k: 2, d: [['bed', 1, { h: 2 }], ['wardrobe', 1], ['dresser', 1], ['lamp', 1]], w: [['famphoto', 1]], b: ['look', 'famphoto', '全家福里的人……一个一个转过了头。'] },
      { n: '卫生间', fl: 'greentile', k: 1, d: [['bathtub', 1, { w: 2 }], ['toilet', 1], ['sink', 1]], w: [['mirror', 1]], b: ['story', '镜子上的雾里写着：别回头。'] },
      { n: '阳台', fl: 'concrete', k: 2, d: [['plant', 3], ['box', 1], ['lamp', 1]], b: ['look', 'plant', '晾衣杆上挂着一件湿透的雨衣。'] }],
    side: [{ n: '储物间', fl: 'wood', d: [['box', 3], ['crate', 1]] }, { n: '保姆房', fl: 'wood', d: [['bed', 1, { h: 2 }], ['chair', 1], ['candle', 1]] }, { n: '杂物间', fl: 'concrete', d: [['box', 2], ['bucket', 1]] }] },
  my: { n: '暮阳中学', wall: 'school', fl: 'wood', dark: .85, seed: 53, hide: 'locker', sp: '走廊', task: '最后一间教室',
    route: [
      { n: '校门', fl: 'concrete', k: 1, d: [['streetlamp', 1], ['sign', 1]], b: ['story', '传达室的窗户里，有人在看你们。'] },
      { n: '走廊', fl: 'linoleum', k: 3, d: [['lamp', 2], ['bench', 1]], w: [['poster', 3]], b: ['look', 'poster', '光荣榜最后一张照片……是空的。'] },
      { n: '教室一', fl: 'wood', k: 2, d: [['schooldesk', 8], ['blackboard', 1]], b: ['look', 'blackboard', '黑板上写着：今天值日的是你。'] },
      { n: '音乐教室', fl: 'wood', k: 1, d: [['piano', 1], ['chair', 3]], b: ['story', '钢琴自己按下了一个音。'] },
      { n: '美术室', fl: 'wood', k: 2, d: [['painting', 3], ['table', 2], ['brush', 1], ['statue', 1]], b: ['look', 'statue', '石膏像的眼睛……刚才是闭着的。'] },
      { n: '厕所', fl: 'greentile', k: 1, dk: 1, d: [['stall', 3], ['sink', 1]], b: ['dark', '第五个隔间的门，慢慢开了。'] },
      { n: '教室二', fl: 'wood', k: 2, d: [['schooldesk', 8], ['blackboard', 1], ['hdolls', 1]], b: ['story', '每张课桌上都坐着一个人偶。'] },
      { n: '最后一间教室', fl: 'darkwood', k: 2, d: [['schooldesk', 6], ['blackboard', 1], ['candle', 2]], b: ['look', 'blackboard', '点名册摊在讲台上，最后一个名字还没干。'] },
      { n: '楼梯间', fl: 'concrete', k: 1, d: [['stairsdown', 1], ['lamp', 1]], b: ['story', '楼梯一共十三级。下楼时数出了十四级。'] }],
    side: [{ n: '办公室', fl: 'darkwood', d: [['desk', 2], ['chair', 2], ['bookshelf', 1]] }, { n: '器材室', fl: 'concrete', d: [['box', 3], ['crate', 1]] }, { n: '广播室', fl: 'linoleum', d: [['desk', 1], ['hspeaker', 1], ['chair', 1]] }] },
  ward: { n: '第三病栋', wall: 'tile', fl: 'linoleum', dark: .88, seed: 67, hide: 'closet', sp: '走廊', task: '院长办公室',
    route: [
      { n: '大厅', fl: 'marble', k: 2, d: [['bench', 3], ['plant', 2], ['wheelchair', 1], ['lamp', 1]], b: ['story', '挂号窗口的灯亮着，里面没有人。'] },
      { n: '挂号处', fl: 'tile', k: 1, d: [['counter', 2], ['cabinet', 1], ['phone', 1]], b: ['look', 'phone', '挂号处的电话响了。'] },
      { n: '走廊', fl: 'linoleum', k: 3, d: [['wheelchair', 1], ['bed', 1, { h: 2 }], ['lamp', 2]], b: ['look', 'wheelchair', '轮椅自己往这边滑了半米。'] },
      { n: '病房A', fl: 'linoleum', k: 2, d: [['bed', 3, { h: 2 }], ['cabinet', 1], ['candle', 1]], b: ['story', '三张床，被子都铺好了，像在等人。'] },
      { n: '手术室', fl: 'greentile', k: 2, dk: 1, d: [['bed', 1, { h: 2 }], ['cabinet', 2], ['bucket', 1], ['lamp', 1]], b: ['dark', '无影灯闪了一下，灭了。'] },
      { n: '药房', fl: 'tile', k: 1, d: [['shelf', 3], ['counter', 1], ['box', 1]], b: ['look', 'shelf', '药瓶上的标签全是同一个名字。'] },
      { n: '停尸间', fl: 'metal', k: 2, d: [['bed', 2, { h: 2 }], ['fridge', 3], ['linen', 1]], b: ['story', '有一个冷柜的门，是从里面推开的。'] },
      { n: '院长办公室', fl: 'darkwood', k: 2, d: [['desk', 1], ['bookshelf', 2], ['chair', 1], ['lamp', 1]], w: [['portrait', 1]], b: ['look', 'portrait', '院长的画像在笑。'] },
      { n: '后楼梯', fl: 'concrete', k: 1, d: [['stairsup', 1], ['lamp', 1]], b: ['story', '楼上传来推床的声音。'] }],
    side: [{ n: '病房B', fl: 'linoleum', d: [['bed', 2, { h: 2 }], ['cabinet', 1]] }, { n: '护士站', fl: 'tile', d: [['counter', 1], ['chair', 1], ['lamp', 1]] }, { n: '洗衣房', fl: 'tile', d: [['linen', 2], ['bucket', 2]] }] }
};
const HGEN_LIGHT = new Set(['candle', 'candles', 'lantern', 'lamp', 'streetlamp', 'stonelantern']);
function hmRng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hmGen(id) { const BP = HBP[id]; for (let tr = 0; tr < 40; tr++) { const D = hmGenTry(id, BP, BP.seed * 101 + tr * 7919); if (D) return D; } return null; }
function hmGenTry(id, BP, seed) { const R = hmRng(seed), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), { nx, ny, S } = HGEN, W = nx * S + 1, H = ny * S + 1, N = W * H;
  const I = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  /* 1. 蛇形走一遍区块 */ const need = BP.route.reduce((s, r) => s + (r.k || 1), 0); if (need > nx * ny - 1) return null;
  const edge = (i, j) => i === 0 || j === 0 || i === nx - 1 || j === ny - 1; let walk = null;
  const dfs = (path, used) => { if (path.length === need) { const [i, j] = path[path.length - 1]; return edge(i, j) ? path.slice() : null; } const [i, j] = path[path.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => [i + d[0], j + d[1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < nx && b < ny && !used.has(a + ',' + b)).sort(() => R() - .5);
    for (const q of nb) { used.add(q[0] + ',' + q[1]); path.push(q); const r = dfs(path, used); if (r) return r; path.pop(); used.delete(q[0] + ',' + q[1]); if (++dfsN > 4000) return null; } return null; };
  let dfsN = 0; const s0 = [ri(1, nx - 2), ny - 1]; walk = dfs([s0], new Set([s0[0] + ',' + s0[1]])); if (!walk) return null;
  /* 2. 区块 → 房间；块内地面随机内缩 */ const blocks = {}, rooms = []; let wi = 0;
  BP.route.forEach((r, k) => { const room = { bp: r, n: r.n, blocks: [], route: 1, idx: k }; for (let q = 0; q < (r.k || 1); q++) { const [i, j] = walk[wi++]; const b = { i, j, room }; blocks[i + ',' + j] = b; room.blocks.push(b); } room.wb = room.blocks.slice(); rooms.push(room); });
  const t = new Array(N).fill('wall'), stw = new Uint8Array(N), sec = new Uint8Array(N), rid = new Int16Array(N).fill(-1);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (x % S === 0 || y % S === 0) { stw[I(x, y)] = 1; t[I(x, y)] = 'concrete'; }
  /* 剩下的区块：最多 3 间侧室，其余并进相邻的房间（房间更大、更不规则） */ const side = [], left = []; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (!blocks[i + ',' + j]) left.push([i, j]);
  left.sort(() => R() - .5); const ext = [];
  for (const [i, j] of left) { if (side.length < Math.min(3, BP.side.length)) { const bp = BP.side[side.length]; const room = { bp, n: bp.n, blocks: [], route: 0 }; const b = { i, j, room }; blocks[i + ',' + j] = b; room.blocks.push(b); side.push(room); rooms.push(room); } else ext.push([i, j]); }
  for (let guard = 0; ext.length && guard < 20; guard++) for (let q = ext.length - 1; q >= 0; q--) { const [i, j] = ext[q]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => blocks[(i + d[0]) + ',' + (j + d[1])]).filter(Boolean).sort((a, b) => b.room.route - a.room.route || R() - .5)[0]; if (!nb) continue; const b = { i, j, room: nb.room, ext: nb }; blocks[i + ',' + j] = b; nb.room.blocks.push(b); ext.splice(q, 1); }
  if (ext.length) return null;
  rooms.forEach((rm, k) => rm.k = k);
  for (const key in blocks) { const b = blocks[key], ox = b.i * S + 1, oy = b.j * S + 1, j = () => R() < .45 ? 0 : R() < .7 ? 1 : 2; b.x0 = ox + 1 + j(); b.x1 = ox + 8 - j(); b.y0 = oy + 1 + j(); b.y1 = oy + 8 - j();
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { t[I(x, y)] = b.room.bp.fl || BP.fl; rid[I(x, y)] = b.room.k; }
    /* 切一个角，房间不方正 */ if (R() < .55 && b.x1 - b.x0 >= 5 && b.y1 - b.y0 >= 5) { const cw = ri(2, 3), ch = ri(2, 3), cx = R() < .5 ? b.x0 : b.x1 - cw + 1, cy = R() < .5 ? b.y0 : b.y1 - ch + 1; b.cut = [cx, cy, cw, ch]; for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) { t[I(x, y)] = 'wall'; rid[I(x, y)] = -1; } } }
  const carve = (x, y, rm) => { t[I(x, y)] = rm.bp.fl || BP.fl; stw[I(x, y)] = 0; rid[I(x, y)] = rm.k; };
  /* 两块之间开口：同一个房间整段打通（重叠部分），不同房间开一扇门 */
  const open = (A, B, door, rm) => { const hz = A.j === B.j, [a, b] = hz ? (A.i < B.i ? [A, B] : [B, A]) : (A.j < B.j ? [A, B] : [B, A]);
    const fl = (q, x, y) => t[I(x, y)] !== 'wall' && rid[I(x, y)] === q.room.k;
    if (hz) { const lo = Math.max(a.y0, b.y0), hi = Math.min(a.y1, b.y1); if (hi - lo < (door ? 0 : 2)) return false; let ys; if (door) { const c = []; for (let y = lo; y <= hi; y++) if (fl(a, a.x1, y) && fl(b, b.x0, y)) c.push(y); if (!c.length) return false; ys = [c[Math.floor(R() * c.length)]]; } else { const c = []; for (let y = lo; y <= hi; y++) if (fl(a, a.x1, y) && fl(b, b.x0, y)) c.push(y); if (c.length < 2) return false; ys = c; }
      for (const y of ys) for (let x = a.x1 + 1; x < b.x0; x++) carve(x, y, rm || a.room); return { x: a.x1 + 1, y: ys[0], x2: b.x0 - 1, hz: 1 }; }
    const lo = Math.max(a.x0, b.x0), hi = Math.min(a.x1, b.x1); const c = []; for (let x = lo; x <= hi; x++) if (fl(a, x, a.y1) && fl(b, x, b.y0)) c.push(x); if (door ? !c.length : c.length < 2) return false; const xs = door ? [c[Math.floor(R() * c.length)]] : c;
    for (const x of xs) for (let y = a.y1 + 1; y < b.y0; y++) carve(x, y, rm || a.room); return { x: xs[0], y: a.y1 + 1, y2: b.y0 - 1, hz: 0 }; };
  for (const rm of rooms) for (let q = 1; q < rm.blocks.length; q++) { const B = rm.blocks[q], A = B.ext || rm.blocks[q - 1]; if (!open(A, B, false)) return null; }
  const doors = []; for (let k = 1; k < BP.route.length; k++) { const A = rooms[k - 1].wb[rooms[k - 1].wb.length - 1], B = rooms[k].wb[0]; const d = open(A, B, true, rooms[k]); if (!d) return null; doors.push(d); }
  for (const rm of side) { const b = rm.blocks[0]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => blocks[(b.i + d[0]) + ',' + (b.j + d[1])]).filter(Boolean).sort(() => R() - .5); let ok = false; for (const q of nb) { if (open(b, q, true, rm)) { ok = true; break; } } if (!ok) return null; }
  /* 3. 入口、出口 */ const fb = rooms[0].wb[0], lb = rooms[BP.route.length - 1].wb.slice(-1)[0];
  const cx0 = (() => { const c = []; for (let x = fb.x0; x <= fb.x1; x++) if (rid[I(x, fb.y1)] === 0) c.push(x); return c[Math.floor(c.length / 2)]; })(); for (let y = fb.y1 + 1; y < H; y++) carve(cx0, y, rooms[0]); const enter = [cx0, H - 1];
  const lr = rooms[BP.route.length - 1]; let exit = null; { const opts = []; if (lb.j === 0) opts.push('u'); if (lb.j === ny - 1) opts.push('d'); if (lb.i === 0) opts.push('l'); if (lb.i === nx - 1) opts.push('r'); const o = opts[Math.floor(R() * opts.length)];
    if (o === 'u' || o === 'd') { const c = []; for (let x = lb.x0; x <= lb.x1; x++) if (rid[I(x, o === 'u' ? lb.y0 : lb.y1)] === lr.k) c.push(x); const x = c[Math.floor(c.length / 2)]; if (o === 'u') { for (let y = lb.y0 - 1; y >= 0; y--) carve(x, y, lr); exit = [x, 0]; } else { for (let y = lb.y1 + 1; y < H; y++) carve(x, y, lr); exit = [x, H - 1]; } }
    else { const c = []; for (let y = lb.y0; y <= lb.y1; y++) if (rid[I(o === 'l' ? lb.x0 : lb.x1, y)] === lr.k) c.push(y); const y = c[Math.floor(c.length / 2)]; if (o === 'l') { for (let x = lb.x0 - 1; x >= 0; x--) carve(x, y, lr); exit = [0, y]; } else { for (let x = lb.x1 + 1; x < W; x++) carve(x, y, lr); exit = [W - 1, y]; } } }
  if (!exit || (exit[0] === enter[0] && exit[1] === enter[1])) return null;
  /* 4. 房间矩形（同名多块）与路线点 */ const rlist = []; for (const rm of rooms) for (const b of rm.blocks) rlist.push({ n: rm.n, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
  const solidV = i => t[i] === 'wall' || stw[i] || sec[i]; const occ = new Uint8Array(N);
  const centre = rm => { const b = rm.blocks[Math.floor(rm.blocks.length / 2)]; let best = null, bd = 1e9; const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2; for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { if (rid[I(x, y)] !== rm.k) continue; const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = [x, y]; } } return best; };
  const route = rooms.filter(r => r.route).map(centre);
  const bfs = (from, to) => { const prev = new Int32Array(N).fill(-2), q = [I(from[0], from[1])]; prev[q[0]] = -1; for (let qi = 0; qi < q.length; qi++) { const c = q[qi]; if (c === I(to[0], to[1])) break; const x = c % W, y = (c / W) | 0; for (const [dx, dy] of HD) { const xx = x + dx, yy = y + dy; if (!inb(xx, yy)) continue; const k = I(xx, yy); if (prev[k] !== -2 || solidV(k) || occ[k]) continue; prev[k] = c; q.push(k); } } const out = []; let c = I(to[0], to[1]); if (prev[c] === -2) return null; while (c !== -1) { out.push(c); c = prev[c]; } return out.reverse(); };
  const pts = [enter, ...route, exit], path = []; for (let k = 1; k < pts.length; k++) { const p = bfs(pts[k - 1], pts[k]); if (!p) return null; path.push(...(k > 1 ? p.slice(1) : p)); }
  const resv = new Uint8Array(N); for (const c of path) resv[c] = 1; for (const c of path) { const x = c % W, y = (c / W) | 0; for (const [dx, dy] of HD) if (inb(x + dx, y + dy)) resv[I(x + dx, y + dy)] = resv[I(x + dx, y + dy)] || 2; }
  /* 门口两边别堵 */ for (let i = 0; i < N; i++) if (!solidV(i) && rid[i] >= 0) { const x = i % W, y = (i / W) | 0; let walls = 0; for (const [dx, dy] of HD) if (inb(x + dx, y + dy) && solidV(I(x + dx, y + dy))) walls++; if (walls >= 2 && (solidV(I(x - 1, y)) && solidV(I(x + 1, y)) || solidV(I(x, y - 1)) && solidV(I(x, y + 1)))) { resv[i] = 1; for (const [dx, dy] of HD) if (inb(x + dx, y + dy)) resv[I(x + dx, y + dy)] = resv[I(x + dx, y + dy)] || 2; } }
  /* 5. 员工暗口：房间边上一格，向外笔直穿过墙能碰到员工通道（≤3 格墙） */ const staff = [], fronts = [];
  const tryNiche = (rm, nearPath) => { const cand = []; for (const b of rm.blocks) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { if (rid[I(x, y)] !== rm.k || resv[I(x, y)] === 1) continue;
      for (const [dx, dy] of HD) { let xx = x + dx, yy = y + dy, n = 0, cells = []; while (inb(xx, yy) && t[I(xx, yy)] === 'wall' && !stw[I(xx, yy)] && n < 4) { cells.push(I(xx, yy)); xx += dx; yy += dy; n++; } if (!n || n > 3 || !inb(xx, yy) || !stw[I(xx, yy)]) continue;
        const pd = Math.min(...path.filter((_, q) => q % 2 === 0).map(c => Math.hypot(c % W - x, ((c / W) | 0) - y))); if (nearPath && (pd < 1.5 || pd > 4.5)) continue; if (staff.some(s => Math.hypot(s[0] - x, s[1] - y) < 4)) continue; cand.push({ x, y, cells, pd, home: [x + dx, y + dy] }); } }
    if (!cand.length) return false; cand.sort((a, b) => Math.abs(a.pd - 2.5) - Math.abs(b.pd - 2.5)); const c = cand[Math.floor(R() * Math.min(3, cand.length))]; for (const i of c.cells) { t[i] = rm.bp.fl || BP.fl; sec[i] = 1; } staff.push(c.home); fronts.push([c.x, c.y]); occ[I(c.x, c.y)] = 1; return true; };
  for (const rm of rooms.filter(r => r.route)) tryNiche(rm, true); if (staff.length < 6) return null;
  /* 6. 摆设（贴墙优先，不踩路线，不压门口） */ const deco = [], hides = [];
  const free = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { if (!inb(xx, yy)) return false; const i = I(xx, yy); if (solidV(i) || occ[i] || resv[i] || rid[i] < 0) return false; } return true; };
  const nearWall = (x, y) => HD.some(([dx, dy]) => inb(x + dx, y + dy) && solidV(I(x + dx, y + dy)));
  const cells = rm => { const c = []; for (const b of rm.blocks) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (rid[I(x, y)] === rm.k) c.push([x, y]); return c; };
  const put = (rm, spr, o, edgeFirst) => { const w = (o && o.w) || 1, h = (o && o.h) || 1, cs = cells(rm).filter(([x, y]) => free(x, y, w, h)); if (!cs.length) return null; const ed = cs.filter(([x, y]) => nearWall(x, y)), pool = edgeFirst && ed.length ? ed : cs; const [x, y] = pool[Math.floor(R() * pool.length)]; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) occ[I(xx, yy)] = 1; return [x, y]; };
  const beats = [], flatO = new Uint8Array(N);
  for (const rm of rooms) { const bp = rm.bp; let lit = 0;
    const mul = Math.max(1, Math.round(rm.blocks.length / (bp.k || 1) * .8)); for (const [spr, n0, o] of bp.d || []) for (let q = 0, n = n0 * (o && o.h ? 1 : mul); q < n; q++) { const p = put(rm, spr, o, spr !== 'schooldesk' && spr !== 'shelf' && spr !== 'bench'); if (!p) break; deco.push([spr, p[0], p[1], o ? Object.assign({}, o) : undefined]); if (HGEN_LIGHT.has(spr)) lit++; }
    for (const [spr, n] of bp.w || []) for (let q = 0; q < n; q++) { const c = []; for (const b of rm.blocks) for (let x = b.x0; x <= b.x1; x++) { const y = b.y0; if (rid[I(x, y)] === rm.k && t[I(x, y - 1)] === 'wall' && !stw[I(x, y - 1)] && !sec[I(x, y - 1)] && !deco.some(d => d[3] && d[3].wall && d[1] === x && d[2] === y - 1)) c.push([x, y - 1]); } if (!c.length) break; const p = c[Math.floor(R() * c.length)]; deco.push([spr, p[0], p[1], { wall: 1 }]); }
    if (!lit && !bp.dk) { const p = put(rm, 'candle', null, true); if (p) deco.push(['candle', p[0], p[1]]); }
    const nh = rm.blocks.length >= 2 ? 2 : 1; for (let q = 0; q < nh; q++) { const p = put(rm, bp.h || BP.hide, null, true); if (p) hides.push([bp.h || BP.hide, p[0], p[1]]); }
    /* 地上的脏东西（扁平，不挡路） */ const fl = cells(rm).filter(([x, y]) => !occ[I(x, y)] && resv[I(x, y)] !== 1 && !flatO[I(x, y)]); for (let q = 0; q < Math.min(4, fl.length / 12); q++) { const k = Math.floor(R() * fl.length), [x, y] = fl[k]; fl.splice(k, 1); flatO[I(x, y)] = 1; deco.push([['stain', 'footprints', 'paper', 'handprint', 'puddle'][Math.floor(R() * 5)], x, y]); }
    if (bp.b) { const at = bp.b[0] === 'look' ? deco.find(d => d[0] === bp.b[1] && rid[I(d[1], d[2] + (d[3] && d[3].wall ? 1 : 0))] === rm.k) : null; beats.push({ room: rm.n, k: bp.b[0], say: bp.b[bp.b.length - 1], at: at ? [at[1], at[2] + (at[3] && at[3].wall ? 1 : 0)] : null }); } }
  { const hid = new Set(hides.map(h => I(h[1], h[2]))), seen = new Uint8Array(N), q = [I(fronts[0][0], fronts[0][1])]; seen[q[0]] = 1; const walk = i => !(t[i] === 'wall' && !stw[i] && !sec[i]) && (!occ[i] || hid.has(i) || fronts.some(f => I(f[0], f[1]) === i));
    for (let qi = 0; qi < q.length; qi++) { const c = q[qi]; if (hid.has(c)) continue; const x = c % W, y = (c / W) | 0; for (const [dx, dy] of HD) { const xx = x + dx, yy = y + dy; if (!inb(xx, yy)) continue; const k = I(xx, yy); if (seen[k] || !walk(k)) continue; seen[k] = 1; q.push(k); } }
    for (let k = hides.length - 1; k >= 0; k--) if (!seen[I(hides[k][1], hides[k][2])]) { occ[I(hides[k][1], hides[k][2])] = 0; hides.splice(k, 1); } }
  /* 7. 机关位：沿路线每个房间 1–2 个，彼此隔开 */ const slots = []; let last = -99; path.forEach((c, q) => { const x = c % W, y = (c / W) | 0; if (q - last < 9 || q < 4 || q > path.length - 4 || rid[c] < 0 || occ[c]) return; const rm = rooms[rid[c]]; if (slots.filter(s => s[2] === rm.k).length >= 2) return; slots.push([x, y, rm.k]); last = q; });
  const spRoom = rooms.find(r => r.n === BP.sp); let sp = null; if (spRoom) { const c = path.filter(c => rid[c] === spRoom.k && !slots.some(s => s[0] === c % W && s[1] === ((c / W) | 0))); if (c.length) { const k = c[Math.floor(c.length / 2)]; sp = [k % W, (k / W) | 0]; } }
  /* 8. 陈歌起点：第二个房间的员工暗口前 */ const start = fronts[Math.min(1, fronts.length - 1)].slice();
  const taskR = rooms.find(r => r.n === BP.task); const ti = taskR ? rooms.filter(r => r.route).indexOf(taskR) + 1 : null;
  return { n: BP.n, w: W, h: H, wall: BP.wall, fl: BP.fl, dark: BP.dark, tileOpts: BP.tileOpts, wallC: BP.wallC, gen: 1, grid: t, stw, secs: Array.from(sec.keys()).filter(i => sec[i]), rlist, enter, exit, route, slots: slots.map(s => [s[0], s[1]]), sp, staff, fronts, hides, deco, start, beats, taskIdx: ti, darkRooms: rooms.filter(r => r.bp.dk).map(r => r.n), pathLen: path.length };
}
/* 换成大地图；原来的小地图留给「被追」用（_c） */
for (const id in HBP) { if (HMAPS[id]) HMAPS[id + '_c'] = HMAPS[id]; const D = hmGen(id); if (D) { if (HMAPS[id + '_c'] && HMAPS[id + '_c'].chase) D.chase = null; HMAPS[id] = D; } }
