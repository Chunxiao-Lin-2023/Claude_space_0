/* 像素小剧场：探索画面上方和对话画面上方的像素场景。人物都是 51_pix 的生成器拼出来的通用小人，不照任何改编作品的形象画。
   剧本里用 “^指令” 走位和打灯（见 RULES 14）：
   ^in 名字 [格]   走进来（鬼怪是淡入）      ^out 名字        离开
   ^to 名字 格      走到第几格（0–19）        ^turn 名字 L|R|F|B
   ^down 名字       倒下                      ^up 名字         站起来
   ^fx dark|candle 格|rain|red|tv|flash|shake|clear  灯光和特效（可叠加，clear 清空）
   ^prop 名 精灵 格x 格y [json]  放一个道具     ^del 名           拿走
   ^stage 场景      换背景（不换地点）        ^wait 毫秒 */
const SW = 320, SH = 112, FEET = 90;
const P_ = (o) => Object.assign({ skin: '#f0c8a0' }, o);
const PPL = {
  雨衣女孩: P_({ child: 1, hair: '#1a1416', hs: 'bob', top: '#e8c020', dress: 1, hat: 'hood', hatC: '#e8c020', ghost: 1 }), 戴口罩的护士: P_({ skin: '#d8d0cc', hair: '#2a2420', hs: 'bun', top: '#e0e0d8', dress: 1, hat: 'veil', hatC: '#e8e8e0', ghost: 1 }), 湿透的男人: P_({ skin: '#c8ccd0', hair: '#141618', hs: 'messy', top: '#3a4a5a', bottom: '#2a3038', ghost: 1 }),
  红影: P_({ sil: '#7a0808', hs: 'long', dress: 1, top: '#900', ghost: 1 }), 黑影: P_({ sil: '#2a2630', hs: 'messy', tall: 1.3, ghost: 1 }), 镜鬼: P_({ sil: '#7a8090', hs: 'long', ghost: 1 }),
  小男孩: P_({ child: 1, skin: '#e6e0dc', hair: '#1a1416', hs: 'short', top: '#5a6a7a', bottom: '#3a4048', ghost: 1 }), 小女孩: P_({ child: 1, skin: '#e6e0dc', hair: '#1a1416', hs: 'bob', top: '#c88a9a', dress: 1, ghost: 1 }),
  学生: P_({ skin: '#ddd6d0', hair: '#141214', hs: 'short', top: '#2e3e5e', top2: '#e8e8e8', bottom: '#2e3e5e', ghost: 1 }), 学生乙: P_({ skin: '#ddd6d0', hair: '#141214', hs: 'bob', top: '#2e3e5e', top2: '#e8e8e8', skirt: 1, bottom: '#2e3e5e', ghost: 1 }), 学生丙: P_({ skin: '#ddd6d0', hair: '#1c1a18', hs: 'messy', top: '#2e3e5e', top2: '#e8e8e8', bottom: '#2e3e5e', ghost: 1 }),
  舞蹈室的女孩: P_({ skin: '#e2dad6', hair: '#141214', hs: 'bun', top: '#e8d8dc', dress: 1, ghost: 1 }),
  瘦长怪物: P_({ skin: '#cfc8c0', hair: '#141214', hs: 'long', cover: 1, robe: 1, top: '#d8d4c8', tall: 2.1, ghost: 1 }), 瘦长怪物乙: P_({ skin: '#cfc8c0', hair: '#141214', hs: 'long', cover: 1, robe: 1, top: '#ccc8bc', tall: 1.9, ghost: 1 }), 独眼的瘦长怪物: P_({ skin: '#cfc8c0', hair: '#141214', hs: 'long', cover: 1, redEye: 1, robe: 1, top: '#c8c0b0', tall: 2.2, ghost: 1 }),
  独臂: P_({ skin: '#d8c0a8', hair: '#2a2420', hs: 'short', top: '#9ab0c0', bottom: '#9ab0c0' }), 老人: P_({ skin: '#d8c0a8', hair: '#c8c8c4', hs: 'short', top: '#9ab0c0', bottom: '#9ab0c0' }),
  陈歌: P_({ hair: '#1c1a1e', hs: 'short', top: '#2d333d', top2: '#d8dadc', bottom: '#26262c', shoes: '#141414' }),
  徐婉: P_({ hair: '#3a2420', hs: 'bob', top: '#e8e4e0', top2: '#c84040', skirt: 1, bottom: '#e8e4e0' }), 徐叔: P_({ hair: '#8a8a88', hs: 'short', top: '#4a5a3e', bottom: '#2e3428' }),
  鹤山: P_({ hair: '#201a18', hs: 'short', top: '#3a5a8a', bottom: '#2a3048' }), 高汝雪: P_({ hair: '#141218', hs: 'long', top: '#eeeeea', dress: 1, hat: 'straw', hatC: '#e8dcc0' }),
  房东: P_({ hair: '#2a2420', hs: 'messy', top: '#8a8a80', bottom: '#3a3a34' }), 王琦: P_({ skin: '#e2c2a2', hair: '#2a2420', hs: 'messy', top: '#5a4a3a', bottom: '#3a3530' }),
  纹身男: P_({ hair: '#141414', hs: 'short', top: '#1e1e22', bottom: '#2e3448' }), 女人: P_({ hair: '#2a1a14', hs: 'long', top: '#8a3a5a', skirt: 1, bottom: '#3a2a30' }), 胖子: P_({ hair: '#2a2420', hs: 'short', top: '#7a7a6a', bottom: '#3a3a40' }),
  李队: P_({ hair: '#1c1a18', hs: 'short', top: '#2f3e5a', bottom: '#232c3e', hat: 'cap', hatC: '#22304a' }), 颜队长: P_({ hair: '#2a2420', hs: 'short', top: '#2a3a52', bottom: '#202838' }), 警察: P_({ hair: '#1c1a18', hs: 'short', top: '#2f3e5a', bottom: '#232c3e', hat: 'cap', hatC: '#22304a' }), 年轻警察: P_({ hair: '#1c1a18', hs: 'short', top: '#2f3e5a', bottom: '#232c3e' }),
  张鹏: P_({ hair: '#141414', hs: 'short', top: '#6a2420', bottom: '#2a2a30' }), 小小: P_({ child: 1, hair: '#1a1416', hs: 'bob', top: '#d88aa0', dress: 1, ghost: 1 }),
  张雅: P_({ skin: '#e8e0dc', hair: '#0a0808', hs: 'long', cover: 1, redEye: 1, top: '#9a1010', dress: 1, ghost: 1 }), 范郁: P_({ child: 1, hair: '#1a1614', hs: 'short', top: '#c8a43a', bottom: '#3a4a6a' }),
  范郁的姑姑: P_({ hair: '#2a2018', hs: 'bun', top: '#6a6a70', bottom: '#3a3a40' }), 姑姑: P_({ hair: '#2a2018', hs: 'bun', top: '#6a6a70', bottom: '#3a3a40' }), 高医生: P_({ hair: '#7a7a78', hs: 'short', top: '#e8e8e4', coat: 1, bottom: '#3a3a40' }), 手机里的声音: null,
  门楠: P_({ hair: '#2a2826', hs: 'messy', top: '#4a6a8a', bottom: '#2a3040' }), 刘刀: P_({ hair: '#141414', hs: 'short', top: '#222226', coat: 1, bottom: '#222226' }), 王海龙: P_({ hair: '#1a1414', hs: 'short', top: '#a83030', bottom: '#2a2a34' }), 王文龙: P_({ hair: '#1a1414', hs: 'short', top: '#3a7a5a', bottom: '#2a2a34' }),
  许童: P_({ hair: '#2a2420', hs: 'messy', top: '#9ab0c0', bottom: '#9ab0c0' }), 男孩: P_({ child: 1, skin: '#ece4e0', hair: '#141214', hs: 'short', top: '#a01818', bottom: '#7a1010', ghost: 1 }), 老院长: P_({ skin: '#e0d8d4', hair: '#c8c8c4', hs: 'short', top: '#8a1414', robe: 1, ghost: 1 }),
  女护士: P_({ skin: '#d8d0cc', hair: '#2a2420', hs: 'bun', top: '#d8d8d0', dress: 1, hat: 'veil', hatC: '#e8e8e0', ghost: 1 }), 司机大叔: P_({ hair: '#3a3430', hs: 'short', top: '#5a6a5a', bottom: '#2a2a30', hat: 'cap', hatC: '#3a4a3a' }), 司机: P_({ hair: '#3a3430', hs: 'short', top: '#5a6a5a', bottom: '#2a2a30', hat: 'cap', hatC: '#3a4a3a' }),
  费友亮: P_({ hair: '#141414', hs: 'short', top: '#1a1a1a', bottom: '#2a2a30' }), 朱佳宁: P_({ hair: '#2a1a14', hs: 'short', top: '#7a6a3a', bottom: '#2a2a30' }), 中年人: P_({ hair: '#3a3430', hs: 'short', top: '#3a3a44', coat: 1, bottom: '#2a2a30' }),
  罗董: P_({ hair: '#9a9a96', hs: 'short', top: '#2a2a36', coat: 1, bottom: '#22222a' }), 老板娘: P_({ hair: '#3a2a20', hs: 'bun', top: '#c87a4a', apron: '#e8e0d0', bottom: '#3a3a40' }), 老爷子: P_({ hair: '#d8d8d4', hs: 'bald', top: '#6a6a60', bottom: '#4a4a44' }),
  大叔: P_({ hair: '#3a3430', hs: 'short', top: '#6a5a4a', bottom: '#3a3a40' }), 年轻人: P_({ hair: '#1a1614', hs: 'messy', top: '#4a4a5a', bottom: '#2a2a34' }), 畸形脸: P_({ skin: '#d8c0a8', hair: '#2a2420', hs: 'messy', top: '#9ab0c0', bottom: '#9ab0c0' }),
  罗若雨: P_({ child: 1, hair: '#1a1416', hs: 'twin', top: '#e8e4c8', dress: 1, ghost: 1 })
};
const VIS_TOPS = ['#3a6a8a', '#8a4a3a', '#5a7a3a', '#7a5a8a', '#a07a3a', '#3a3a3a', '#c8c0a8'];
function pplOf(name) { if (name in PPL) return PPL[name]; let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return P_({ hair: ['#1a1614', '#3a2a20', '#141414'][h % 3], hs: ['short', 'long', 'bob', 'messy'][h % 4], top: VIS_TOPS[h % VIS_TOPS.length], bottom: ['#2a3048', '#3a3a40', '#4a3a2a'][h % 3], skirt: h % 5 === 1 }); }
/* 自定义小道具（百物语里没有的） */
Object.assign(SPR, {
  cage(g, e, t, R) { R(0, 2, 30, 13, 'rgba(0,0,0,.35)'); for (let i = 0; i < 8; i++) R(i * 4, 2, 1, 13, '#7a8084'); R(0, 2, 30, 1, '#8a9094'); R(0, 14, 30, 1, '#5a6064'); },
  wheelchair(g, e, t, R) { R(3, 4, 9, 2, '#555'); R(3, -4, 2, 9, '#555'); R(2, 6, 10, 9, 'rgba(0,0,0,0)'); R(1, 8, 2, 7, '#333'); R(9, 10, 5, 5, '#333'); R(10, 11, 3, 3, '#777'); },
  paperman(g, e, t, R) { R(4, 4, 8, 10, '#ece6d6'); R(5, -2, 6, 6, '#f2ecdc'); R(6, 0, 1, 1, '#111'); R(9, 0, 1, 1, '#111'); R(6, 2, 4, 1, '#c03030'); R(5, 1, 1, 1, '#e88'); R(10, 1, 1, 1, '#e88'); R(4, 13, 8, 1, '#c8c0b0'); },
  coffin(g, e, t, R) { box(R, 0, 2, 32, 12, '#6a0e0e'); R(2, 4, 28, 2, '#8a1818'); R(13, 6, 6, 6, '#eee6d6'); R(14, 7, 4, 1, '#a01818'); R(15, 7, 1, 4, '#a01818'); },
  mannequin(g, e, t, R) { R(6, -6, 4, 4, '#cfc8bc'); R(5, -2, 6, 9, '#bdb6aa'); R(7, 7, 2, 7, '#8a8478'); R(4, 13, 8, 2, '#5a554c'); },
  wellhole(g, e, t, R) { box(R, 0, 4, 16, 11, '#5a5754'); R(2, 6, 12, 6, '#050506'); },
  ticket(g, e, t, R) { box(R, 0, -4, 32, 18, '#4a2a1a'); R(2, -2, 28, 6, '#0a0a0c'); R(4, -1, 6, 3, '#a01818'); R(0, 6, 32, 2, '#6a3a22'); },
  redsign(g, e, t, R) { R(0, 0, 64, 9, '#5a0a0a'); R(1, 1, 62, 7, e.lit ? '#a81818' : '#6a1010'); for (let i = 0; i < 3; i++) R(10 + i * 18, 3, 8, 3, e.lit ? '#ffcfb0' : '#c88a7a'); },
  ferris(g, e, t, R) { const c = e.col || '#3a4a52'; for (let a = 0; a < 24; a++) { const r = 26, x = 28 + Math.cos(a / 24 * 6.283) * r, y = 28 + Math.sin(a / 24 * 6.283) * r; R(x, y, 2, 2, c); } for (let a = 0; a < 8; a++) { const x = 28 + Math.cos(a / 8 * 6.283) * 26, y = 28 + Math.sin(a / 8 * 6.283) * 26; R(x - 2, y, 5, 4, a === 3 && e.dark ? '#000' : (e.lit && a % 2 ? '#d8a840' : '#6a3a3a')); } R(27, 28, 3, 34, c); }
});
/* 场景：wall 墙面风格 / floor 地面瓦片 / out 室外（back 远景）/ props [精灵, 格x, 格y, 参数] / tiles [瓦片, 格x, 格y]（树、灌木） */
const STAGES = {
  park: { out: 1, floor: 'sidewalk', back: 'park', props: [['streetlamp', 2, 4], ['bench', 13, 4], ['vending', 17, 3], ['sign', 8, 4, { col: '#6a2a2a' }]] },
  house: { out: 1, floor: 'asphalt', back: 'house', props: [['streetlamp', 1, 4], ['rail', 3, 4], ['rail', 4, 4], ['rail', 15, 4], ['rail', 16, 4], ['poster', 6, 3, { col: '#8a2a2a' }]] },
  shop: { wall: 'plain', floor: 'tile', props: [['shelf', 2, 3], ['shelf', 3, 3], ['shelf', 4, 3], ['fridge', 7, 3], ['vending', 8, 3, { col: '#3a6aa8' }], ['counter', 14, 4], ['counter', 15, 4], ['wallclock', 12, 1]] },
  office: { wall: 'school', floor: 'linoleum', props: [['bookshelf', 2, 3], ['cabinet', 4, 3], ['desk', 12, 4], ['chair', 12, 5], ['poster', 8, 1, { col: '#c8b88a' }], ['wallclock', 15, 1], ['plant', 17, 3]] },
  hall: { wall: 'concrete', floor: 'darkwood', props: [['door', 3, 2], ['door', 15, 2, { col: '#3a1a1a' }], ['mannequin', 9, 3], ['mannequin', 11, 3], ['anatomy', 18, 3], ['lantern', 7, 1, { off: 0 }], ['footprints', 13, 5]] },
  room: { wall: 'plain', floor: 'wood', props: [['window', 9, 1], ['bed', 14, 3], ['table', 3, 4], ['lamp', 5, 3], ['door', 1, 2]] },
  ctrl: { wall: 'metal', floor: 'concrete', props: [['tv', 4, 2, { power: 1 }], ['tv', 6, 2, { power: 1 }], ['tv', 8, 2, { power: 'static' }], ['tv', 10, 2, { power: 1 }], ['desk', 5, 3], ['desk', 7, 3], ['desk', 9, 3], ['chair', 7, 4], ['switch', 14, 1]] },
  prop: { wall: 'brick', floor: 'concrete', props: [['shelf', 2, 3], ['shelf', 3, 3], ['shelf', 15, 3], ['shelf', 16, 3], ['anatomy', 6, 3], ['mannequin', 12, 3], ['crate', 8, 5], ['box', 10, 5], ['doll', 9, 5]] },
  wc: { wall: 'tile', floor: 'tile', props: [['mirror', 5, 2], ['sink', 5, 3], ['stall', 12, 3], ['stall', 14, 3], ['stall', 16, 3, { red: 1 }], ['puddle', 8, 5]] },
  wedding: { wall: 'red', floor: 'darkwood', props: [['coffin', 8, 3], ['candles', 7, 3], ['candles', 10, 3], ['lantern', 3, 1], ['lantern', 15, 1], ['paperman', 4, 4], ['paperman', 5, 4], ['paperman', 13, 4], ['paperman', 14, 4], ['scroll', 9, 1]] },
  attic: { wall: 'wood', floor: 'darkwood', props: [['crate', 2, 3], ['barrel', 3, 3], ['box', 5, 4], ['sack', 15, 4], ['closet', 17, 3], ['crate', 10, 5], ['mannequin', 13, 3], ['stain', 7, 5]] },
  parking: { wall: 'concrete', floor: 'asphalt', props: [['pole', 4, 3], ['pole', 12, 3], ['stairsdown', 17, 4], ['roadline', 0, 0], ['car', 7, 5]] },
  woods: { out: 1, floor: 'grass', back: 'woods', tiles: [['tree', 0, 3], ['tree', 1, 4], ['pine', 18, 3], ['tree', 19, 4], ['bushes', 15, 6], ['tree', 3, 6]] },
  apt: { out: 1, floor: 'dirt', back: 'apt', tiles: [['tree', 0, 3], ['pine', 19, 3], ['bushes', 18, 5]], props: [['sign', 4, 4, { col: '#5a5a50' }], ['paper', 5, 3]] },
  corridor: { wall: 'concrete', floor: 'linoleum', props: [['door', 2, 2], ['door', 6, 2], ['door', 13, 2], ['door', 17, 2], ['wallclock', 10, 1]] },
  burnt: { wall: 'brick', floor: 'concrete', props: [['stain', 3, 4], ['stain', 12, 5], ['box', 6, 4], ['crate', 15, 3], ['doll', 9, 5, { col: '#c8b8a0' }], ['doll', 10, 5, { col: '#b8a890' }], ['curtain', 17, 1], ['door', 2, 2, { open: 1 }]] },
  hut: { wall: 'wood', floor: 'dirt', props: [['bed', 14, 3, { col: '#4a3a3a' }], ['box', 3, 4], ['crate', 5, 3], ['lantern', 9, 1], ['rope', 11, 5], ['window', 7, 1]] },
  school: { out: 1, floor: 'concrete', back: 'school', props: [['sign', 3, 4, { col: '#4a5a48' }], ['streetlamp', 16, 4, { off: 1 }]] },
  field: { out: 1, floor: 'grass', back: 'field', tiles: [['bushes', 2, 6], ['reeds', 17, 5], ['reeds', 18, 6]] },
  dance: { wall: 'plain', floor: 'lightwood', props: [['mirror', 4, 2], ['mirror', 6, 2], ['mirror', 8, 2], ['mirror', 10, 2], ['mirror', 12, 2], ['mirror', 14, 2], ['chair', 8, 4, { col: '#2a2a2a' }], ['chair', 10, 4, { col: '#2a2a2a' }], ['chair', 12, 4, { col: '#2a2a2a' }]] },
  toilet: { wall: 'tile', floor: 'tile', props: [['stall', 3, 3], ['stall', 5, 3], ['stall', 7, 3], ['stall', 9, 3], ['stall', 11, 3, { num: 1 }], ['stall', 13, 3], ['handprint', 16, 2]] },
  classroom: { wall: 'school', floor: 'wood', props: [['blackboard', 9, 1, { text: 1 }], ['schooldesk', 3, 4], ['schooldesk', 5, 4], ['schooldesk', 7, 4], ['schooldesk', 11, 4], ['schooldesk', 13, 4], ['schooldesk', 15, 4], ['schooldesk', 5, 6], ['schooldesk', 13, 6]] },
  dorm: { wall: 'plain', floor: 'wood', props: [['bed', 1, 3], ['bed', 17, 3], ['chair', 7, 4], ['chair', 9, 4], ['chair', 11, 4], ['chair', 13, 4], ['paper', 9, 5], ['window', 9, 1]] },
  wardhall: { wall: 'school', floor: 'linoleum', props: [['door', 2, 2, { locked: 1 }], ['door', 7, 2, { locked: 1 }], ['door', 12, 2, { locked: 1 }], ['door', 17, 2, { locked: 1 }], ['linen', 15, 3], ['stain', 9, 5], ['futon', 4, 5]] },
  laundry: { wall: 'tile', floor: 'concrete', props: [['cage', 6, 4], ['cage', 11, 3], ['cage', 14, 5], ['linen', 1, 3], ['towel', 3, 2]] },
  doorhall: { wall: 'tile', floor: 'linoleum', props: [['door', 3, 2, { locked: 1 }], ['door', 9, 2, { col: '#6a0a0a' }], ['door', 15, 2, { col: '#3a3a40', locked: 1 }], ['handprint', 10, 1], ['stain', 9, 4], ['footprints', 11, 5]] },
  inside: { wall: 'red', floor: 'redfloor', props: [['door', 3, 2, { col: '#3a0606' }], ['door', 9, 2, { col: '#3a0606' }], ['door', 15, 2, { col: '#3a0606' }], ['bed', 17, 4, { col: '#5a0a0a' }]], red: 1 },
  ward: { out: 1, floor: 'dirt', back: 'ward', tiles: [['fence', 0, 3], ['fence', 1, 3], ['fence', 18, 3], ['fence', 19, 3]] }
};
const STAGE_PLACE = { hh_rest: 'room', pa_208: 'room', xc_office: 'office', my_office: 'office', kf_dean: 'office', kf_b3_4: 'wardhall', hm_303: 'room', hm_3f: 'corridor', my_teach: 'corridor', pa_1f: 'corridor', pa_2f: 'corridor', my_hill: 'woods', pa_road: 'woods', my_road: 'woods' };
const STG = { remote: new Set(), sc: [], ex: [], fx: {}, key: '', props: {}, t: 0, flash: 0, shake: 0, cache: new Map() };
function stageKey() { return STG.over || STAGE_PLACE[C.loc] || PLACES[C.loc].art; }
/* 远景（室外天空下面那一条） */
function stageBack(g, kind, night) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }; const win = (x, y, lit) => R(x, y, 3, 3, lit ? (lit === 2 ? '#a81818' : '#d8b04a') : (night ? '#05070a' : '#3a4448'));
  const bld = (x, y, w, h, c, cols, rows, lits) => { R(x, y, w, h, c); R(x - 1, y - 2, w + 2, 2, '#121618'); let n = 0; for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) win(x + 4 + i * ((w - 8) / cols), y + 4 + r * ((h - 6) / rows), night && lits ? lits[n++] : 0); };
  if (kind === 'park') { SPR.ferris(g, { col: night ? '#1c2a30' : '#5a6a70', lit: night, dark: night }, 0, (x, y, w, h, c) => R(30 + x, -12 + y, w, h, c)); R(200, 26, 60, 22, night ? '#141c20' : '#8a6a5a'); R(196, 22, 68, 5, night ? '#1c2428' : '#a07060'); for (let i = 0; i < 6; i++) R(204 + i * 10, 30, 2, 18, night ? '#2a343a' : '#6a5040'); }
  else if (kind === 'house') { bld(96, 4, 128, 44, night ? '#11171a' : '#5e625e', 7, 2, [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0]); SPR.redsign(g, { lit: night }, 0, (x, y, w, h, c) => R(128 + x, 26 + y, w, h, c)); R(150, 36, 20, 12, '#030405'); R(150, 36, 20, 4, night ? '#2a0606' : '#4a1616'); }
  else if (kind === 'apt') { bld(110, 6, 100, 42, night ? '#12181b' : '#5e6262', 6, 3, [1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0]); R(155, 36, 10, 12, '#020303'); }
  else if (kind === 'school') { bld(40, 6, 240, 42, night ? '#0f1518' : '#6a6c66', 12, 3, []); R(156, 36, 10, 12, '#020303'); }
  else if (kind === 'ward') { bld(20, 18, 70, 30, night ? '#10171a' : '#74786f', 4, 2, []); bld(230, 18, 70, 30, night ? '#10171a' : '#74786f', 4, 2, []); bld(120, 4, 80, 44, night ? '#0a0f12' : '#5e625b', 5, 3, [0, 0, 0, 0, 0, 0, 0, 2]); }
  else if (kind === 'field') { bld(220, 16, 60, 32, night ? '#0e1417' : '#62665f', 3, 3, []); }
  if (kind === 'woods' || kind === 'field' || kind === 'apt' || kind === 'ward') for (let i = 0; i < 22; i++) { const x = i * 15 + (hash(i, 3) * 8) | 0, h = 14 + hash(i, 7) * 18; g.fillStyle = night ? '#060a0a' : '#2c3a2c'; g.beginPath(); g.moveTo(x - 9, 48); g.lineTo(x, 48 - h); g.lineTo(x + 9, 48); g.fill(); } }
function stageBg(key, night) { const ck = key + (night ? 'N' : 'D'); let c = STG.cache.get(ck); if (c) return c; const S = STAGES[key] || STAGES.corridor; c = mk(SW, SH); const g = c.getContext('2d');
  const at = (ox, oy) => (x, y, w, h, col) => { if (!col || w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(ox + Math.floor(x), oy + Math.floor(y), Math.ceil(w), Math.ceil(h)); };
  const ws = WALLSTYLE[S.wall] || WALLSTYLE.plain;
  for (let X = 0; X < 20; X++) for (let Y = 0; Y < 7; Y++) { const R = at(X * 16, Y * 16);
    if (S.out && Y < 3) continue; if (!S.out && Y < 3) { paintWall(R, X, Y, Y > 0, ws, (a, b) => b < 3); continue; }
    (TILE[S.floor] || TILE.concrete).paint(R, X, Y, {}); }
  if (S.out) { const gr = g.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, night ? '#04070c' : '#7f8e94'); gr.addColorStop(1, night ? '#111a22' : '#c6c2b0'); g.fillStyle = gr; g.fillRect(0, 0, SW, 48);
    if (night) { for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,' + (.2 + hash(i, 9) * .5) + ')'; g.fillRect((hash(i, 1) * SW) | 0, (hash(i, 2) * 30) | 0, 1, 1); } g.fillStyle = '#d8dde2'; g.fillRect(270, 8, 7, 7); g.fillStyle = '#04070c'; g.fillRect(273, 7, 6, 6); }
    stageBack(g, S.back, night); }
  for (const t of S.tiles || []) TILE[t[0]].paint(at(t[1] * 16, t[2] * 16), t[1], t[2], {});
  for (const p of S.props || []) if (p[0] === 'roadline') for (let x = 0; x < 20; x++) TILE.roadline.paint(at(x * 16, 6 * 16), x, 6); else if (SPR[p[0]]) SPR[p[0]](g, Object.assign({ x: p[1], y: p[2] }, p[3] || {}), 0, at(p[1] * 16, p[2] * 16));
  if (S.grime) stGrime(g, S.grime, key); if (S.paint) S.paint(g, night, at);
  STG.cache.set(ck, c); return c; }
/* —— 演员 —— */
function stActor(name, x, o) { return Object.assign({ name, P: pplOf(name), x, tx: x, dir: 0, fr: 0, ft: 0, alpha: 1, ta: 1, talk: 0, down: 0, ghost: !!(pplOf(name) || {}).ghost }, o || {}); }
function stFind(name) { return STG.sc.find(a => a.name === name); }
const SLOTS_X = [176, 216, 256, 136, 288];
function stFreeX() { for (const x of SLOTS_X) if (!STG.sc.some(a => Math.abs(a.tx - x) < 20)) return x; return 200 + rint(-20, 20); }
function stEnter(name, x, quick) { if (!pplOf(name)) return null; let a = stFind(name); if (a) { if (x != null) a.tx = x; a.ta = 1; return a; } if (STG.sc.length >= 6) { const old = STG.sc.find(b => b.name !== '陈歌' && !b.talk); if (old) STG.sc.splice(STG.sc.indexOf(old), 1); }
  const tx = x != null ? x : stFreeX(); const ghost = (pplOf(name) || {}).ghost; a = stActor(name, ghost || quick || !SET.motion ? tx : stEdge(tx), { tx, alpha: ghost ? 0 : 1, ta: 1 }); STG.sc.push(a); return a; }
/* 从镜头边缘走进来，不让人对着空台子说话 */
function stEdge(tx) { const L = STG.cam == null ? 56 : STG.cam, R = L + 208; return tx > (L + R) / 2 ? Math.min(SW + 12, R + 10) : Math.max(-12, L - 10); }
/* 剪影：红影、黑影只画轮廓 */
const ST_TINT = new Map();
function stTint(spr, col) { if (!col) return spr; let m = ST_TINT.get(col); if (!m) ST_TINT.set(col, m = new WeakMap()); let c = m.get(spr); if (c) return c; c = mk(spr.width, spr.height); const g = c.getContext('2d'); g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); m.set(spr, c); return c; }
/* 白猫（第四、五章跟着陈歌） */
SPR.cage = function (g, e, t, R) { const c = '#6e6e74'; R(-1, -14, 18, 2, c); R(-1, 14, 18, 2, c); for (let i = 0; i < 6; i++) R(-1 + i * 3.4, -12, 1, 26, c); };
SPR.cat = function (g, e, t, R) { const w = '#eeeae4', b = Math.floor(t * 2) % 7 === 0; R(3, 9, 9, 5, w); R(10, 6, 5, 5, w); R(10, 5, 1, 2, w); R(14, 5, 1, 2, w); R(2, 7, 1, 4, w); R(1, 6, 2, 1, w); R(4, 14, 1, 1, '#b8b2aa'); R(10, 14, 1, 1, '#b8b2aa'); if (!b) { R(11, 8, 1, 1, '#4a8ad8'); R(13, 8, 1, 1, '#d8b830'); } };
/* —— 恐怖演出 —— */
/* 手电接触不良：按时间算出一段一段的“灭”（同一时刻所有画面一致） */
function stFlickOff() { if (!STG.fx.flicker) return false; const t = STG.t, k = Math.floor(t * 3.2), h = hash(k, 77); return h < .32 ? (t * 3.2 - k) < .55 + h : h > .9; }
/* 贴脸：某个人突然出现在镜头正前方，放大，一闪而过（关掉惊吓画面时只闪红光+心跳） */
function stScare(name) { if (window.__dbg && (__dbg.auto || __dbg.instant)) return; if (!SET.scare || !SET.motion) { scareFlash(); return; } STG.jump = { P: pplOf(name), name, t: .75 }; STG.flash = 1; STG.shake = .5; sfx('stinger'); }
/* 黑暗里的环境声，和“有东西离你很近”时的心跳 */
function stAmbient(dt, list) { if (!STATE.scene || !(STG.fx.dark || STG.fx.red)) { STG.amb = 4; return; } STG.amb = (STG.amb || 6) - dt; const hero = list.find(a => a.name === '陈歌');
  const near = hero && list.some(a => a !== hero && a.ghost && a.alpha > .3 && Math.abs(a.x - hero.x) < 44); if (near) { STG.hb = (STG.hb || 0) - dt; if (STG.hb <= 0) { STG.hb = 1.1; sfx('heart'); } }
  if (STG.amb <= 0) { STG.amb = 7 + Math.random() * 8; sfx(['drip', 'whisper', 'steps', 'creak', 'breath', 'wind'][Math.floor(Math.random() * 6)]); } }
/* —— 镜子：小剧场里的镜子真的照出东西 ——
   ^mirror 格 [big]  在墙上挂一面镜子（big = 落地镜）
   ^mirror follow / lag（慢半拍）/ stare（不跟着动，直勾勾看着）/ smile（咧嘴、眼睛发红）/ close（贴到镜面上越来越大）
   ^mirror empty（照不出你）/ other 名字（你身后多一个人）/ hand（镜子里拍出手印）/ crack（裂开）/ out（从镜子里伸出手）/ off */
function stMirror(p) { const k = p[1]; if (!k) return; if (/^\d+$/.test(k)) { STG.mir = { x: Math.round(+k * 16 + 8), big: p[2] === 'big', mode: 'follow', hist: [], crack: 0, ct: 0, hands: [], out: 0, close: 1, seed: Math.floor(Math.random() * 999) }; return; } const M = STG.mir; if (!M) return;
  if (k === 'off') { STG.mir = null; return; } if (k === 'crack') { M.ct = 1; sfx('crack'); return; } if (k === 'hand') { M.hands.push([Math.random(), Math.random() * .7]); sfx('knock'); return; } if (k === 'out') { M.outT = 1; sfx('scrape'); return; }
  if (k === 'other') { M.other = p[2] ? pplOf(p[2]) : null; return; } if (k === 'close') M.close = 1; if (k === 'stare' || k === 'smile' || k === 'close') { const h = STG.sc.find(a => a.name === '陈歌'); M.fx = h ? h.x : M.x; } M.mode = k; }
function stMirrorGeo(M) { return M.big ? { x0: M.x - 26, y0: 14, w: 52, h: 74 } : { x0: M.x - 15, y0: 16, w: 30, h: 46 }; }
function stMirrorDraw(g, list, hero) { const M = STG.mir; if (!M) return; const G = stMirrorGeo(M), t = STG.t;
  g.fillStyle = '#4a3418'; g.fillRect(G.x0 - 3, G.y0 - 3, G.w + 6, G.h + 6); g.fillStyle = '#6e5026'; g.fillRect(G.x0 - 2, G.y0 - 2, G.w + 4, G.h + 4);
  const gr = g.createLinearGradient(G.x0, G.y0, G.x0 + G.w, G.y0 + G.h); gr.addColorStop(0, '#2a3640'); gr.addColorStop(1, '#10161b'); g.fillStyle = gr; g.fillRect(G.x0, G.y0, G.w, G.h);
  g.save(); g.beginPath(); g.rect(G.x0, G.y0, G.w, G.h); g.clip();
  if (STG.fx.candle) { const cx = G.x0 + G.w / 2 + (STG.fx.candle - M.x) * .5; const fl = Math.sin(t * 17) > .2 ? 1 : 0; g.fillStyle = 'rgba(255,190,90,.18)'; g.beginPath(); g.arc(cx, G.y0 + G.h * .78, 9 + fl, 0, 7); g.fill(); g.fillStyle = '#ffd27a'; g.fillRect(Math.round(cx), Math.round(G.y0 + G.h * .74) - fl, 1, 2 + fl); }
  /* 倒影的位置：正常跟着你；lag 用 0.8 秒前的位置；stare/smile/close 停在原地 */
  const hx = hero ? hero.x : M.x; let rx = hx; if (M.mode === 'lag') { const old = M.hist.find(h => h[0] >= t - .8) || M.hist[0]; rx = old ? old[1] : hx; } else if (['stare', 'smile', 'close'].includes(M.mode)) rx = M.fx;
  const sc = M.big ? 1.35 : 1.15, base = M.mode === 'close' ? Math.min(3.2, M.close) : 1, s = sc * base, w = Math.round(16 * s), h = Math.round(24 * s);
  const px = Math.round(G.x0 + G.w / 2 + (rx - M.x) * .6 - w / 2), py = Math.round(G.y0 + (M.big ? 10 : 5) - (base - 1) * 7 * s);
  if (M.other) { const os = s * 1.08, ow = Math.round(16 * os), oh = Math.round(24 * os); g.globalAlpha = .95; g.drawImage(stTint(personSprite(M.other, 0, 0), M.other.sil ? '#9aa2b0' : null), px + Math.round(w * .3), py - Math.round(2 * s), ow, oh); g.globalAlpha = 1; }
  if (M.mode !== 'empty' && hero) { const P = hero.P, spr = personSprite(P, 0, 0); g.globalAlpha = .82; g.drawImage(spr, px, py, w, h); g.globalAlpha = 1;
    if (M.mode === 'smile' || M.mode === 'close') { const u = s, fx = px, fy = py; g.fillStyle = '#e01818'; g.fillRect(Math.round(fx + 5 * u), Math.round(fy + 7.5 * u), Math.max(1, Math.round(u)), Math.max(1, Math.round(u))); g.fillRect(Math.round(fx + 10 * u), Math.round(fy + 7.5 * u), Math.max(1, Math.round(u)), Math.max(1, Math.round(u)));
      g.fillStyle = '#0a0404'; g.fillRect(Math.round(fx + 4.5 * u), Math.round(fy + 10.5 * u), Math.round(7 * u), Math.max(1, Math.round(1.2 * u))); g.fillRect(Math.round(fx + 4 * u), Math.round(fy + 9.6 * u), Math.max(1, Math.round(u)), Math.max(1, Math.round(u))); g.fillRect(Math.round(fx + 11 * u), Math.round(fy + 9.6 * u), Math.max(1, Math.round(u)), Math.max(1, Math.round(u)));
      g.fillStyle = '#8a0c0c'; g.fillRect(Math.round(fx + 5.5 * u), Math.round(fy + 11.6 * u), Math.round(5 * u), Math.max(1, Math.round(.6 * u))); } }
  for (const hd of M.hands) { const hx2 = G.x0 + 3 + hd[0] * (G.w - 9), hy = G.y0 + 3 + hd[1] * (G.h - 12); g.fillStyle = 'rgba(200,190,180,.55)'; g.fillRect(hx2, hy + 3, 4, 4); for (let i = 0; i < 4; i++) g.fillRect(hx2 + i, hy + (i === 0 || i === 3 ? 1 : 0), 1, 3); g.fillStyle = 'rgba(120,10,10,.5)'; g.fillRect(hx2 + 1, hy + 7, 1, 3); }
  /* 裂纹：从一点往外裂，seed 固定，裂到哪画到哪 */
  if (M.ct) { M.crack = Math.min(1, M.crack + .04); const R = srng(M.seed), cx = G.x0 + G.w * (.35 + R() * .3), cy = G.y0 + G.h * (.3 + R() * .3); g.strokeStyle = 'rgba(215,225,235,.85)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { let x = cx, y = cy, a = i / 9 * 6.28 + R() * .5; g.beginPath(); g.moveTo(x, y); const L = (6 + R() * 18) * M.crack * (M.big ? 1.8 : 1); for (let k = 0; k < 4; k++) { a += (R() - .5) * .9; x += Math.cos(a) * L / 4; y += Math.sin(a) * L / 4; g.lineTo(Math.round(x) + .5, Math.round(y) + .5); } g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(G.x0 + 3, G.y0, 2, G.h); if (STG.fx.dark && !STG.fx.candle) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(G.x0, G.y0, G.w, G.h); } g.restore();
  /* 从镜子里伸出来的手：苍白，越伸越长，伸向陈歌 */
  if (M.outT) { M.out = Math.min(1, M.out + .03); const sx = G.x0 + G.w / 2, sy = G.y0 + G.h * .55, ex = hero ? hero.x : sx, ey = FEET - 17, L = M.out; g.strokeStyle = '#cfc8be'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (ex - sx) * L, sy + (ey - sy) * L); g.stroke(); g.fillStyle = '#cfc8be'; const hx3 = sx + (ex - sx) * L, hy3 = sy + (ey - sy) * L; g.fillRect(Math.round(hx3) - 2, Math.round(hy3) - 2, 5, 4); for (let i = 0; i < 4; i++) g.fillRect(Math.round(hx3) - 2 + i, Math.round(hy3) + 2, 1, 3); } }
function stageSceneStart() { STG.rec = null; STG.recStack = []; STG.zoom = null; STG.bloodT0 = 0; STG.handT0 = 0; STG.mir = null; STATE.musOv = null; stageIdle(); STG.jump = null; STG.glitch = 0; STG.remote = new Set(); STG.cam = null; STG.over = ''; STG.fx = {}; STG.props = {}; STG.sc = [stActor('陈歌', 96)]; const s = STG.ex.filter(a => a.name !== '陈歌'); for (const a of s) STG.sc.push(stActor(a.name, a.x)); STG.lastKey = stageKey(); }
function stageIdle() { if (!C) return; const ns = npcsHere().slice(0, 3); STG.ex = [stActor('陈歌', 120)]; ns.forEach((k, i) => STG.ex.push(stActor(NPCS[k].name, 196 + i * 36, { dir: 1 }))); }
/* 换了地点或 ^stage：立刻换景（清掉别人、效果、道具），免得下一帧把刚加上的东西又清掉 */
function stSync() { if (!STATE.scene || !C) return; const k = stageKey(); if (k !== STG.lastKey) { STG.lastKey = k; STG.sc = STG.sc.filter(a => a.name === '陈歌'); STG.fx = {}; STG.props = {}; STG.mir = null; } }
function stageSpeak(o) { if (!STATE.scene) return; stSync(); let who = o.kind === 'ph' ? '陈歌' : o.who; for (const a of STG.sc) { a.talk = 0; a.phone = 0; } if (!who) return; const remote = STG.remote.has(who) || who === '手机里的声音'; if (remote) who = '陈歌'; const a = who === '陈歌' || STG.rec ? stFind(who) : stEnter(who); if (!a) return; a.talk = 1; a.phone = o.kind === 'ph' || remote;
  const hero = stFind('陈歌'); if (hero && a !== hero) { a.face = hero.x < a.tx ? 1 : 2; hero.face = hero.x < a.tx ? 2 : 1; } }
function stageCmd(s) { const p = s.trim().split(/\s+/), c = p[0], n = p[1]; if (c !== 'stage') stSync(); const T = v => v == null || v === '' ? null : Math.round(+v * 16 + 8);
  if (c === 'in' || c === 'at') STG.remote.delete(n);
  if (c === 'in') stEnter(n, T(p[2])); else if (c === 'at') { const a = stEnter(n, T(p[2]), 1); if (a) a.x = a.tx; } else if (c === 'out') { const a = stFind(n); if (a) { if (a.ghost || !SET.motion || STG.rec) a.ta = 0; else a.tx = a.x > 160 ? SW + 20 : -20; a.leaving = 1; } }
  else if (c === 'to') { const a = stFind(n) || stEnter(n); if (a) a.tx = T(p[2]); } else if (c === 'turn') { const a = stFind(n); if (a) a.face = { L: 1, R: 2, F: 0, B: 3 }[p[2]] ?? 0; }
  else if (c === 'down' || c === 'up') { const a = stFind(n); if (a) a.down = c === 'down' ? 1 : 0; }
  else if (c === 'fx') { if (n === 'clear') STG.fx = {}; else if (n === 'flash') STG.flash = 1; else if (n === 'shake') STG.shake = .4; else if (n === 'candle') { if (p[2] === 'off') delete STG.fx.candle; else STG.fx.candle = T(p[2] || 9); } else if (n === 'light') { delete STG.fx.dark; delete STG.fx.flicker; } else if (n === 'steady') delete STG.fx.flicker; else if (n === 'glitch') { STG.glitch = .7; if (p[2] === 'on') STG.fx.glitch = 1; else if (p[2] === 'off') delete STG.fx.glitch; sfx('static'); } else if (p[2] === 'off') delete STG.fx[n]; else STG.fx[n] = 1; }
  else if (c === 'scare') stScare(n);
  else if (c === 'creep') { const a = stFind(n) || stEnter(n, T(p[2]), 1); if (a) { a.tx = T(p[2]); a.creep = 1; } }
  else if (c === 'sfx') sfx(n);
  else if (c === 'mirror') stMirror(p);
  else if (c === 'recall') stRecallCmd(p);
  else if (c === 'zoom') { STG.zoom = n === 'off' ? null : { n, k: +(p[2] || 2), z: STG.zoom ? STG.zoom.z : 1 }; }
  else if (c === 'mus') { STATE.musOv = n === 'off' ? '' : n; musicMode(STATE.musOv); }
  else if (c === 'prop') { let o = {}; try { o = p[5] ? JSON.parse(p.slice(5).join(' ')) : {}; } catch (e) {} STG.props[n] = [p[2], +p[3], +p[4], o]; } else if (c === 'del') delete STG.props[n];
  else if (c === 'stage') { STG.over = n === 'clear' ? '' : n; stSync(); } else if (c === 'call') { STG.remote.add(n); const a = stFind(n); if (a) STG.sc.splice(STG.sc.indexOf(a), 1); } else if (c === 'hang') STG.remote.delete(n); }
/* —— 每帧 —— */
function stageTick(dt, list) { STG.t += dt; if (STG.mir) { const h = list.find(a => a.name === '陈歌'); if (h) { STG.mir.hist.push([STG.t, h.x]); if (STG.mir.hist.length > 60) STG.mir.hist.shift(); } if (STG.mir.mode === 'close') STG.mir.close = Math.min(3.2, STG.mir.close + dt * .5); } stAmbient(dt, list); const off = stFlickOff(); if (STG.jump && (STG.jump.t -= dt) <= 0) STG.jump = null; STG.glitch = Math.max(0, (STG.glitch || 0) - dt); if (STG.fx.glitch && Math.random() < dt * .4) STG.glitch = .25;
  for (const a of list) { if (a.creep) { if (!off) continue; a.x += Math.sign(a.tx - a.x) * Math.min(Math.abs(a.tx - a.x), 260 * dt); if (Math.abs(a.tx - a.x) < .5) a.creep = 0; a.dir = 0; continue; }
    const d = a.tx - a.x, sp = (Math.abs(d) > 40 ? 96 : 64) * dt; if (Math.abs(d) > .5) { a.x += Math.sign(d) * Math.min(Math.abs(d), sp); a.ft += dt; a.fr = [0, 1, 0, 3][Math.floor(a.ft / .13) % 4]; a.dir = d < 0 ? 1 : 2; a.moving = 1; } else { a.x = a.tx; a.fr = 0; a.moving = 0; a.dir = a.face != null ? a.face : 0; }
    a.alpha += (a.ta - a.alpha) * Math.min(1, dt * 4); }
  for (let i = list.length - 1; i >= 0; i--) { const a = list[i]; if (a.leaving && (a.alpha < .03 || a.x < -16 || a.x > SW + 16)) list.splice(i, 1); }
  STG.flash = Math.max(0, STG.flash - dt * 2.5); STG.shake = Math.max(0, STG.shake - dt); }
function stageDraw(cv, list, scene) { const full = cv.width < SW ? (STG.full || (STG.full = mk(SW, SH))) : cv; const g = full.getContext('2d'), night = isNight(), key = stageKey(), vx = full !== cv ? (STG.cam || 0) : 0, vw = full !== cv ? cv.width : SW, rec = scene && STG.rec; g.imageSmoothingEnabled = false; if (key !== STG.lastKey && scene) { STG.lastKey = key; STG.sc = STG.sc.filter(a => a.name === '陈歌'); STG.fx = {}; STG.props = {}; } g.save();
  if (STG.shake > 0) g.translate(Math.round((Math.random() - .5) * 6), Math.round((Math.random() - .5) * 4));
  g.drawImage(stageBg(key, night), 0, 0);
  const drawProp = p => { if (SPR[p[0]]) SPR[p[0]](g, Object.assign({ x: p[1], y: p[2] }, p[3]), STG.t, (x, y, w, h, c) => { if (!c) return; g.fillStyle = c; g.fillRect(p[1] * 16 + Math.floor(x), p[2] * 16 + Math.floor(y), Math.ceil(w), Math.ceil(h)); }); };
  for (const id in STG.props) if (!STG.props[id][3].front) drawProp(STG.props[id]);
  const hero = list.find(a => a.name === '陈歌');
  for (const a of list.slice().sort((p, q) => p.down - q.down)) { if (!a.P || a.alpha < .02) continue; const flick = a.ghost && STG.fx.dark ? (Math.sin(STG.t * 13 + a.x) > .6 ? .4 : 1) : 1; g.globalAlpha = clamp(a.alpha * flick, 0, 1);
    if (ghIs(a.name)) { ghDraw(g, a, 'body'); if (a.talk && !a.down) { const G = GH[GHOST_OF[a.name][0]]; g.fillStyle = '#c02020'; g.fillRect(Math.round(a.x) - 2, FEET - G.h - 6, 4, 3); } continue; }
    const spr = stTint(personSprite(a.P, a.dir, a.fr), a.P.sil), th = Math.round(24 * (a.P.tall || 1)), bob = a.talk && Math.floor(STG.t * 4) % 2 ? -1 : 0, x = Math.round(a.x - 8), y = FEET - th + bob + (a.moving && a.fr ? -1 : 0);
    if (a.down) { g.save(); g.translate(x + 20, FEET - 2); g.rotate(-Math.PI / 2); g.drawImage(spr, -8, -16); g.restore(); } else g.drawImage(spr, x, y, 16, th);
    if (a.phone) { g.fillStyle = '#e02a22'; g.fillRect(x + 11, y + 13, 2, 3); }
    if (a.talk && !a.down) { g.fillStyle = a.phone ? '#e02a22' : '#f2eee2'; g.fillRect(x + 6, y - 6, 4, 3); g.fillRect(x + 7, y - 3, 2, 1); } }
  g.globalAlpha = 1; for (const id in STG.props) if (STG.props[id][3].front) drawProp(STG.props[id]);
  g.globalAlpha = 1;
  /* 灯光：夜里非乐园的地方，或者剧本关了灯，只剩陈歌的手电 */
  const S = STAGES[key] || {}, flickOff = stFlickOff(), dark = rec ? (flickOff ? .985 : STG.fx.dark ? .88 : 0) : flickOff ? .985 : STG.fx.dark ? .93 : night ? (PLACES[C.loc].town ? (PLACES[C.loc].area === 'park' && PLACES[C.loc].art !== 'house' && PLACES[C.loc].art !== 'park' ? .5 : .32) : .76) : 0;
  if (dark) { const L = STG.lit || (STG.lit = mk(SW, SH)), lg = L.getContext('2d'); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, SW, SH); lg.fillStyle = 'rgba(2,3,6,' + dark + ')'; lg.fillRect(0, 0, SW, SH); lg.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => { const gr = lg.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.fillRect(x - r, y - r, r * 2, r * 2); };
    if (!flickOff && rec) hole(vx + vw / 2, FEET - 22, vw * .42, .8); else if (!flickOff && (hero && !PLACES[C.loc].town || STG.fx.dark)) { const hx = hero ? hero.x : 96, dirR = hero && hero.dir !== 1; hole(hx + (dirR ? 26 : -26), FEET - 14, STG.fx.dark ? 40 : 58, 1); hole(hx, FEET - 12, 18, .8); }
    /* 黑暗里的其他人：留一圈很淡的轮廓光，说话的人亮一点（不然站在门口说话的人整个看不见） */
    if (!flickOff) for (const a of list) if (a !== hero && a.alpha > .1 && !a.leaving) hole(a.x, FEET - 12, a.talk ? 20 : 15, a.talk ? .8 : .45);
    if (STG.fx.candle) { const fl = .85 + Math.sin(STG.t * 17) * .08; hole(STG.fx.candle, FEET - 16, 34 * fl, 1); }
    if (STG.fx.tv) hole(150, 60, 50, .7); g.drawImage(L, 0, 0); }
  stGhostGlow(g, list, dark, flickOff); stFxOver(g, list, dark);
  if (STG.fx.candle) { g.fillStyle = '#e8e2cc'; g.fillRect(STG.fx.candle - 1, FEET - 8, 3, 7); g.fillStyle = Math.sin(STG.t * 21) > 0 ? '#ffd27a' : '#ffb34a'; g.fillRect(STG.fx.candle - 1, FEET - 11, 3, 3); }
  if (STG.fx.rain || (night && PLACES[C.loc].area === 'muyang' && S.out)) { g.fillStyle = 'rgba(180,200,220,.35)'; for (let i = 0; i < 60; i++) { const x = (hash(i, 1) * SW + STG.t * 40) % SW, y = (hash(i, 2) * SH + STG.t * 260 * (.7 + hash(i, 3) * .5)) % SH; g.fillRect(x | 0, y | 0, 1, 5); } }
  if (STG.fx.red || S.red) { g.fillStyle = 'rgba(140,0,0,.22)'; g.fillRect(0, 0, SW, SH); }
  if (STG.glitch > 0) { const T = STG.gl || (STG.gl = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(g.canvas, 0, 0); for (let i = 0; i < 7; i++) { const y = Math.floor(Math.random() * SH), hh = 2 + Math.floor(Math.random() * 9), dx = Math.round((Math.random() - .5) * 26); g.drawImage(T, 0, y, SW, hh, dx, y, SW, hh); } g.fillStyle = 'rgba(255,0,40,.08)'; g.fillRect(0, Math.floor(Math.random() * SH), SW, 2); }
  /* 镜子画在黑暗上面：它反着烛光，是这一片黑里唯一看得清的东西 */
  if (scene && STG.mir) { g.globalAlpha = 1; stMirrorDraw(g, list, hero); }
  if (STG.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + STG.flash * .8 + ')'; g.fillRect(0, 0, SW, SH); }
  /* 贴脸：只画头部特写，越来越近 */
  if (STG.jump) { const jx = full !== cv ? (STG.cam || 0) + cv.width / 2 : SW / 2, k = 6.2 + (.75 - STG.jump.t) * 2.4, w = Math.round(16 * k), h = Math.round(13 * k); g.globalAlpha = 1; const bg = g.createRadialGradient(jx, SH / 2, 10, jx, SH / 2, 150); bg.addColorStop(0, '#7a1a16'); bg.addColorStop(1, '#0a0202'); g.fillStyle = bg; g.fillRect(0, 0, SW, SH); if (GHOST_OF[STG.jump.name]) { const G = GH[GHOST_OF[STG.jump.name][0]], T = STG.jt || (STG.jt = mk(32, 64)), tg = T.getContext('2d'); tg.clearRect(0, 0, 32, 64); ghDraw(tg, { name: STG.jump.name, x: G.w / 2, dir: 0, feet: G.h - 2 }, 'body'); const hh = Math.min(18, G.h * .42), kk = k * 13 / hh; g.drawImage(T, 0, 0, G.w, hh, Math.round(jx - G.w * kk / 2 + (Math.random() - .5) * 5), Math.round(SH / 2 - hh * kk * .55), Math.round(G.w * kk), Math.round(hh * kk)); }
    else g.drawImage(personSprite(STG.jump.P, 0, 0), 0, 0, 16, 13, Math.round(jx - w / 2 + (Math.random() - .5) * 5), Math.round(SH / 2 - h * .52 + (Math.random() - .5) * 3), w, h); }
  g.restore(); stZoom(full, g); if (rec) stRecallDraw(g, vx, vw);
  if (full !== cv) { /* 镜头：对着说话的人和陈歌的中间，慢慢跟过去 */ const vis = list.filter(a => a.alpha > .3 && a.x > -10 && a.x < SW + 10), tk = vis.filter(a => a.talk || a.name === '陈歌'), ax = vis.map(a => a.tx); /* 所有人放得下就都拍进去，放不下才只拍说话的人和陈歌 */ const xs = ax.length && Math.max(...ax) - Math.min(...ax) <= cv.width - 28 ? ax : (tk.length ? tk : vis).map(a => a.tx); const mid = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : SW / 2;
    const want = clamp((STG.zoom ? STG.zoomX : mid) - cv.width / 2, 0, SW - cv.width); STG.cam = STG.cam == null ? want : STG.cam + (want - STG.cam) * .12; const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(full, Math.round(STG.cam), 0, cv.width, SH, 0, 0, cv.width, SH); } }
let stLast = 0;
function stageLoop(ts) { requestAnimationFrame(stageLoop); if (!C || document.hidden) return; if (ts - stLast < 33) return; const dt = Math.min(.1, (ts - stLast) / 1000); stLast = ts;
  const m = curMode(); if (m === 'bt') return; const scene = m === 'dlg', cv = $(scene ? '#stg' : '#bnr'); if (!cv || !cv.offsetParent) return; const list = scene && STATE.scene ? STG.sc : STG.ex; recBody(); if (!SET.motion) for (const a of list) a.x = a.tx; stageTick(dt, list); stageDraw(cv, list, scene && STATE.scene); }
requestAnimationFrame(stageLoop);
