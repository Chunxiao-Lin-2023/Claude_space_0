/* ================= scenes: house, school, restaurant, hospital, wild, sea =================
   rooms: integer-grid rectangles. ws = wall style on this room's boundary (inner), wso = style toward the outside.
   doors: v:1 = gap in a vertical wall x=c (from y=a to b); v:0 = gap in a horizontal wall y=c (from x=a to b).
   gen: per room either a function or a recipe list (see recipe() in 15_map.js). keep: rectangles kept empty. */
const HOUSE_GEN = {
  kitchen(room, X) {
    const ib = inner(room); let x = X.R() < .5 ? .1 : .9;
    const seq = ['fridge', 'counter', 'stove', 'counter', 'sink', 'counter', 'counter'].slice(0, X.ri(5, 7));
    if (X.R() < .5) seq.reverse();
    for (const k of seq) { const [w, d] = footWD(k, 0); if (tryPut(X, room, k, 0, x + w / 2, ib[1] + d / 2, -.001)) x += w; }
    if (X.R() < .6) { const c1 = tryPut(X, room, 'counter', 2, 3.1, 3.6, .7); if (c1) { tryPut(X, room, 'counter', 2, 3.9, 3.6, -.001); times(X, 2, 3, i => tryPut(X, room, 'stool', 0, 2.9 + i * .65, 4.35, .05)); } }
    else diningSet(X, room, 3.4, 3.8, 4);
    times(X, 1, 2, () => wallPut(X, room, 'trash', { sides: [1, 2, 3] }));
    if (X.R() < .6) wallPut(X, room, 'plant', { corner: 1 });
    times(X, 0, 2, () => freePut(X, room, 'box'));
    if (X.R() < .5) wallPut(X, room, 'cabinet', { sides: [3, 2] });
    times(X, 0, 2, () => freePut(X, room, 'stool', { m: .3 }));
  },
  dining(room, X) {
    diningSet(X, room, X.rf(9.4, 10.6), X.rf(3.0, 3.8), X.ri(4, 6));
    times(X, 1, 2, () => wallPut(X, room, X.ch(['dresser', 'cabinet', 'shelf'])));
    times(X, 1, 3, () => wallPut(X, room, 'plant', { corner: 1 }));
    if (X.R() < .6) wallPut(X, room, 'clock');
    if (X.R() < .5) wallPut(X, room, 'lamp', { corner: 1 });
    if (X.R() < .4) wallPut(X, room, 'radiator', { sides: [0] });
  },
  bed(room, X) {
    bedSet(X, room);
    times(X, 1, 2, () => wallPut(X, room, 'wardrobe', { sides: [1, 2, 3] }));
    if (X.R() < .7) wallPut(X, room, 'dresser', { sides: [1, 2, 3] });
    times(X, 0, 1, () => wallPut(X, room, 'plant', { corner: 1 }));
    times(X, 0, 2, () => X.R() < .5 ? wallPut(X, room, 'suitcase') : freePut(X, room, 'suitcase'));
    if (X.R() < .6) wallPut(X, room, 'basket');
    if (X.R() < .5) wallPut(X, room, 'armchair', { corner: 1 });
    if (X.R() < .5) wallPut(X, room, 'lamp', { corner: 1 });
    times(X, 0, 2, () => freePut(X, room, 'box'));
  },
  bath(room, X) {
    wallPut(X, room, 'tub', { sides: [0, 1], corner: 1 });
    wallPut(X, room, 'toilet', { sides: [1, 3, 0] });
    times(X, 1, 2, () => wallPut(X, room, 'sink', { m: .03 }));
    wallPut(X, room, 'washer');
    times(X, 1, 2, () => wallPut(X, room, 'basket'));
    wallPut(X, room, 'trash');
    if (X.R() < .6) wallPut(X, room, 'cabinet');
    if (X.R() < .5) wallPut(X, room, 'plant', { corner: 1 });
  },
  living(room, X) {
    sofaSet(X, room);
    times(X, 2, 3, () => wallPut(X, room, 'plant', { corner: 1 }));
    times(X, 1, 2, () => wallPut(X, room, 'lamp', { corner: 1 }));
    times(X, 0, 2, () => wallPut(X, room, 'shelf'));
    if (X.R() < .5) freePut(X, room, 'beanbag');
    if (X.R() < .4) wallPut(X, room, 'piano');
    if (X.R() < .5) wallPut(X, room, 'clock');
    times(X, 0, 1, () => freePut(X, room, 'armchair'));
    times(X, 0, 2, () => freePut(X, room, 'box'));
  },
  hall(room, X) {
    const pool = ['shoes', 'coat', 'umb', 'plant', 'plant', 'box', 'clock', 'cabinet', 'coat', 'box', 'radiator'];
    times(X, 5, 7, () => wallPut(X, room, X.ch(pool), { sides: [1, 3], m: .08 }));
  },
  study(room, X) {
    deskSet(X, room); if (X.R() < .5) deskSet(X, room);
    times(X, 2, 4, () => wallPut(X, room, 'shelf', { m: .02 }));
    if (X.R() < .7) wallPut(X, room, 'armchair', { corner: 1 });
    wallPut(X, room, 'lamp', { corner: 1 });
    times(X, 1, 3, () => X.R() < .5 ? freePut(X, room, 'box') : wallPut(X, room, 'box'));
    times(X, 1, 2, () => wallPut(X, room, 'plant', { corner: 1 }));
    if (X.R() < .4) freePut(X, room, 'rug', { m: .1 });
    if (X.R() < .5) wallPut(X, room, 'cabinet');
    if (X.R() < .4) wallPut(X, room, 'clock');
  },
  kids(room, X) {
    bedSet(X, room, 'kbed');
    wallPut(X, room, 'toychest');
    times(X, 1, 2, () => freePut(X, room, 'beanbag'));
    times(X, 1, 3, () => freePut(X, room, 'ball', { m: .3 }));
    times(X, 0, 2, () => freePut(X, room, 'box'));
    if (X.R() < .6) deskSet(X, room, 'chair');
    if (X.R() < .6) wallPut(X, room, 'shelf');
    if (X.R() < .5) wallPut(X, room, 'plant', { corner: 1 });
    if (X.R() < .5) freePut(X, room, 'rug', { m: .1 });
    if (X.R() < .5) wallPut(X, room, 'basket');
  },
  garden(room, X) {
    times(X, 4, 7, () => wallPut(X, room, 'fpot', { sides: [0], m: .15 }));
    times(X, 5, 8, () => wallPut(X, room, 'bush', { sides: [1, 2, 3], m: .2 }));
    times(X, 1, 3, () => freePut(X, room, 'bush', { m: .6 }));
    times(X, 1, 2, () => freePut(X, room, 'bench', { r: X.ch([0, 2]), m: .6 }));
    times(X, 1, 2, () => wallPut(X, room, 'bin', { sides: [0], m: .05 }));
    times(X, 0, 2, () => freePut(X, room, 'barrel', { m: .5 }));
    if (X.R() < .6) freePut(X, room, 'ball', { m: .4 });
    times(X, 0, 2, () => wallPut(X, room, 'plant', { sides: [0], m: .1 }));
  }
};

SCENES.house = {
  n: '温馨小家', icon: '🏠', w: 24, h: 22, bg: '#6f8f5c', seek: [11.5, 20.7], hide: [11.5, 11.7], keep: [[10.3, 16, 12.7, 22]], seekT: 180,
  rooms: [
    { id: 'kitchen', n: '厨房', r: [0, 0, 7, 7], fl: 'tile', fc: ['#e8e4dc', '#d6d0c4'] },
    { id: 'dining', n: '餐厅', r: [7, 0, 13, 7], fl: 'wood', fc: ['#c99e6e', '#b88d5e'] },
    { id: 'bed', n: '主卧', r: [13, 0, 20, 7], fl: 'carpet', fc: ['#b9b3c9', '#ada6be'] },
    { id: 'bath', n: '浴室', r: [20, 0, 24, 7], fl: 'tile', fc: ['#cfe3ea', '#b9d3dc'] },
    { id: 'living', n: '客厅', r: [0, 7, 10, 16], fl: 'wood', fc: ['#d4ad7c', '#c39c6b'] },
    { id: 'hall', n: '走廊', r: [10, 7, 13, 16], fl: 'wood', fc: ['#b98d5e', '#a87d50'] },
    { id: 'study', n: '书房', r: [13, 7, 19, 16], fl: 'wood', fc: ['#a8825c', '#98734e'] },
    { id: 'kids', n: '儿童房', r: [19, 7, 24, 16], fl: 'carpet', fc: ['#bfd9b4', '#b2cea6'] },
    { id: 'garden', n: '花园', r: [0, 16, 24, 22], fl: 'grass', fc: ['#8cc06a', '#82b660'], out: 1, wso: 'fence', path: [10.6, 16, 12.4, 22] }
  ],
  doors: [
    { v: 1, c: 7, a: 2.6, b: 4.0 }, { v: 0, c: 7, a: 2.0, b: 3.4 }, { v: 0, c: 7, a: 10.8, b: 12.2 }, { v: 1, c: 10, a: 11, b: 12.4 },
    { v: 1, c: 13, a: 9.0, b: 10.4 }, { v: 1, c: 13, a: 4.6, b: 6.0 }, { v: 1, c: 20, a: 2.4, b: 3.8 }, { v: 1, c: 19, a: 12, b: 13.4 },
    { v: 0, c: 7, a: 21, b: 22.4 }, { v: 0, c: 7, a: 15.2, b: 16.6 }, { v: 0, c: 16, a: 10.8, b: 12.2 }, { v: 0, c: 16, a: 3.4, b: 5.4 }
  ],
  gen: HOUSE_GEN
};

/* ---------- school ---------- */
function classroom(X, room) {
  const ib = inner(room), cx = (ib[0] + ib[2]) / 2;
  tryPut(X, room, 'board', 0, cx, ib[1] + .07, .02);
  tryPut(X, room, 'tdesk', 0, cx + X.rf(-1, 1), ib[1] + 1.25, .1);
  grid(X, room, 'sdesk', 0, room.r[0] + 1.3, 3.0 + room.r[1], 2.0, 1.25, 4, 3, .02, d => around(X, room, d, [['schair', 0, .5, 2]]));
}
SCENES.school = {
  n: '放学后的学校', icon: '🏫', w: 30, h: 24, bg: '#7a8a6a', seek: [19, 22.6], hide: [15, 9.5], keep: [[17.5, 21, 20.5, 24]], seekT: 200,
  wallc: ['#f2ead8', '#8a7a62', '#9ab4c8', '#e8dfca'],
  rooms: [
    { id: 'c1', n: '一班教室', r: [0, 0, 9, 8], fl: 'wood', fc: ['#d6b68a', '#c4a477'] },
    { id: 'c2', n: '二班教室', r: [9, 0, 18, 8], fl: 'wood', fc: ['#d0ae80', '#bf9d70'] },
    { id: 'music', n: '音乐室', r: [18, 0, 24, 8], fl: 'carpet', fc: ['#b8605a', '#a8544e'] },
    { id: 'lab', n: '实验室', r: [24, 0, 30, 8], fl: 'tile', fc: ['#eef2f4', '#d8dee2'] },
    { id: 'hall', n: '走廊', r: [0, 8, 30, 11], fl: 'lino', fc: ['#c9d6dc', '#b8c6cc'] },
    { id: 'lib', n: '图书馆', r: [0, 11, 8, 18], fl: 'carpet', fc: ['#7aa88a', '#6e9a7e'] },
    { id: 'office', n: '老师办公室', r: [8, 11, 13, 18], fl: 'wood', fc: ['#b8916a', '#a8825c'] },
    { id: 'gym', n: '体育馆', r: [13, 11, 24, 18], fl: 'gym', fc: ['#e3c088', '#d4b07a'] },
    { id: 'canteen', n: '食堂', r: [24, 11, 30, 18], fl: 'tile', fc: ['#f0e6cc', '#e0d4b6'] },
    { id: 'yard', n: '操场', r: [0, 18, 30, 24], fl: 'grass', fc: ['#8cc06a', '#82b660'], out: 1, wso: 'fence', path: [18, 18, 20, 24] }
  ],
  doors: [
    { v: 0, c: 8, a: 2.5, b: 3.9 }, { v: 0, c: 8, a: 6, b: 7.4 }, { v: 0, c: 8, a: 12.5, b: 13.9 }, { v: 0, c: 8, a: 20.3, b: 21.7 }, { v: 0, c: 8, a: 26.3, b: 27.7 },
    { v: 0, c: 11, a: 3, b: 4.4 }, { v: 0, c: 11, a: 9.8, b: 11.2 }, { v: 0, c: 11, a: 16, b: 17.8 }, { v: 0, c: 11, a: 26.3, b: 27.7 },
    { v: 0, c: 18, a: 5, b: 6.4 }, { v: 0, c: 18, a: 18, b: 20 }, { v: 0, c: 18, a: 26.5, b: 27.9 },
    { v: 1, c: 8, a: 14, b: 15.4 }, { v: 1, c: 24, a: 14, b: 15.4 }, { v: 1, c: 13, a: 15.8, b: 17.2 }
  ],
  gen: {
    c1: [['fn', classroom], ['w', 'locker', 1, 2, { sides: [2, 3] }], ['c', 'plant', 1, 2], ['w', 'trash', 1, 1], ['w', ['globe', 'shelf'], 0, 1], ['f', ['bball', 'box'], 0, 1]],
    c2: [['fn', classroom], ['w', 'locker', 1, 2, { sides: [2, 1] }], ['c', 'plant', 1, 2], ['w', 'trash', 1, 1], ['w', ['globe', 'shelf'], 0, 1], ['f', ['bball', 'box'], 0, 1]],
    music: [['w', 'piano', 1, 1, { sides: [0, 3] }], ['f', 'drum', 1, 3, { m: .3 }], ['f', 'mstand', 2, 4, { m: .3 }], ['f', 'schair', 2, 4, { m: .25 }], ['w', ['shelf', 'cabinet'], 1, 2], ['c', 'plant', 0, 1]],
    lab: [['fn', (X, room) => grid(X, room, 'labbench', 0, 25.6, 3.0, 2.8, 2.1, 2, 2, .05, b => around(X, room, b, [['stool', -.35, .7, 0], ['stool', .35, .7, 0]]))], ['w', 'sink', 1, 2, { sides: [1, 3] }], ['w', ['cabinet', 'medshelf'], 1, 2], ['w', 'trash', 1, 1], ['f', 'box', 0, 1]],
    hall: [['w', 'locker', 4, 7, { sides: [0, 2], m: .05 }], ['c', 'plant', 2, 3], ['w', 'trash', 1, 2, { sides: [0, 2] }], ['w', 'water', 1, 1, { sides: [0, 2] }], ['w', 'bench', 1, 2, { sides: [0, 2] }]],
    lib: [['w', 'shelf', 5, 8, { m: .02 }], ['fn', (X, room) => { const t = freePut(X, room, 'rtable', { m: 1.1 }); if (t) around(X, room, t, [['chair', 0, -.85, 0], ['chair', 0, .85, 2], ['chair', -.85, 0, 3], ['chair', .85, 0, 1]]); }], ['f', 'beanbag', 0, 2], ['w', 'globe', 0, 1], ['c', 'plant', 1, 2], ['f', 'box', 0, 1]],
    office: [['fn', (X, room) => { deskSet(X, room); deskSet(X, room); }], ['w', 'shelf', 1, 2], ['w', 'copier', 1, 1], ['w', 'water', 0, 1], ['c', 'plant', 1, 1], ['w', 'cabinet', 0, 1], ['f', 'box', 0, 2]],
    gym: [['w', 'hoop', 1, 1, { sides: [3] }], ['w', 'hoop', 1, 1, { sides: [1] }], ['f', 'mat', 2, 3, { m: .4 }], ['f', 'vault', 1, 2, { m: .5 }], ['f', 'cone', 3, 6, { m: .3 }], ['f', 'bball', 2, 4, { m: .3 }], ['w', 'ballcart', 1, 1], ['w', 'bench', 1, 2, { sides: [0, 2] }]],
    canteen: [['fn', (X, room) => { for (const y of [13.6, 15.9]) { const t = tryPut(X, room, 'ltable', 0, 27, y, .5); if (t) around(X, room, t, [['stool', -.55, -.66, 0], ['stool', .55, -.66, 0], ['stool', -.55, .66, 0], ['stool', .55, .66, 0]]); } }], ['w', 'vending', 1, 2, { sides: [1, 0] }], ['w', 'counter', 1, 2], ['w', 'trash', 1, 2], ['c', 'plant', 0, 1]],
    yard: [['f', 'tree', 3, 5, { m: .8 }], ['w', 'bush', 3, 6, { sides: [1, 2, 3], m: .2 }], ['f', 'bench', 1, 3, { r: 2, m: .6 }], ['f', 'cone', 2, 4, { m: .4 }], ['f', 'bball', 1, 2, { m: .4 }], ['w', 'bin', 1, 2, { sides: [0] }], ['w', 'fpot', 2, 4, { sides: [0] }]]
  }
};

/* ---------- restaurant ---------- */
function roundSet(X, room, near) {
  const t = near ? tryPut(X, room, 'rtable', 0, near[0], near[1], 1.1) : freePut(X, room, 'rtable', { m: 1.1 });
  if (t) around(X, room, t, [['chair', 0, -.88, 0], ['chair', 0, .88, 2], ['chair', -.88, 0, 3], ['chair', .88, 0, 1]]);
  return t;
}
SCENES.restaurant = {
  n: '饭店后厨', icon: '🍳', w: 28, h: 22, bg: '#5a4a40', seek: [8, 21], hide: [19.5, 7.6], keep: [[6, 19.6, 10, 22]], seekT: 200,
  wallc: ['#f3e6d0', '#7a3a2a', '#b85a3a', '#ead6b6'],
  rooms: [
    { id: 'kitchen', n: '后厨', r: [0, 0, 12, 9], fl: 'checker', fc: ['#f2f0ea', '#3a3d44'] },
    { id: 'dish', n: '洗碗间', r: [12, 0, 17, 9], fl: 'tile', fc: ['#dfe8ea', '#c8d4d8'] },
    { id: 'cold', n: '冷库', r: [17, 0, 22, 6], fl: 'tile', fc: ['#d4e4ee', '#bcd0de'], ws: 'steel' },
    { id: 'aisle', n: '员工通道', r: [17, 6, 22, 9], fl: 'concrete', fc: ['#b8b4ac', '#a8a49c'] },
    { id: 'store', n: '仓库', r: [22, 0, 28, 9], fl: 'concrete', fc: ['#b0aaa0', '#a09a90'] },
    { id: 'hall', n: '大堂', r: [0, 9, 18, 22], fl: 'wood', fc: ['#b8784a', '#a86a3e'] },
    { id: 'vip1', n: '包间·梅', r: [18, 9, 28, 15], fl: 'carpet', fc: ['#a84a4a', '#984040'] },
    { id: 'vip2', n: '包间·兰', r: [18, 15, 28, 22], fl: 'carpet', fc: ['#4a6a9a', '#40608c'] }
  ],
  doors: [
    { v: 1, c: 12, a: 4, b: 5.4 }, { v: 0, c: 9, a: 3, b: 4.6 }, { v: 0, c: 9, a: 8, b: 9.6 }, { v: 0, c: 9, a: 14, b: 15.4 },
    { v: 0, c: 6, a: 19, b: 20.4 }, { v: 1, c: 17, a: 7.1, b: 8.5 }, { v: 1, c: 22, a: 7.1, b: 8.5 }, { v: 0, c: 9, a: 19.6, b: 21 },
    { v: 1, c: 18, a: 11.5, b: 13.1 }, { v: 1, c: 18, a: 18, b: 19.6 }, { v: 0, c: 15, a: 24, b: 25.4 }
  ],
  gen: {
    kitchen: [['fn', (X, room) => {
      const ib = inner(room); let x = X.R() < .5 ? .1 : .9;
      const seq = ['counter', 'stove', 'stove', 'counter', 'sink', 'counter', 'stove', 'counter', 'counter', 'stove', 'counter', 'counter'].slice(0, X.ri(9, 12));
      for (const k of seq) { const [w, d] = footWD(k, 0); if (tryPut(X, room, k, 0, x + w / 2, ib[1] + d / 2, -.001)) x += w; }
      for (let i = 0; i < X.ri(3, 5); i++) { tryPut(X, room, 'counter', 0, 3.6 + i * .8, 4.3, -.001); tryPut(X, room, 'counter', 2, 3.6 + i * .8, 4.92, -.001); }
    }], ['w', 'rack', 1, 2, { sides: [3, 1] }], ['f', 'pot', 2, 3, { m: .4 }], ['w', 'sfridge', 1, 1, { sides: [3, 1] }], ['w', 'trash', 1, 2], ['f', ['crate', 'sack'], 1, 3, { m: .35 }]],
    dish: [['w', 'sink', 2, 3, { m: .02 }], ['w', 'dishrack', 2, 3], ['f', 'mop', 1, 2, { m: .35 }], ['w', ['trash', 'basket'], 1, 2], ['w', 'rack', 0, 1]],
    cold: [['w', 'sfridge', 2, 3, { m: .03 }], ['f', 'crate', 2, 3, { m: .3 }], ['w', ['sack', 'box', 'barrel'], 2, 3]],
    aisle: [['w', ['box', 'mop', 'rack'], 1, 2, { sides: [0, 2] }]],
    store: [['w', 'rack', 1, 2], ['f', 'sack', 2, 4, { m: .3 }], ['f', 'crate', 2, 3, { m: .3 }], ['w', 'barrel', 1, 3], ['w', 'box', 2, 4], ['w', 'winerack', 0, 1]],
    hall: [['fn', (X, room) => { for (const [x, y] of [[3.5, 12.5], [8.5, 12.5], [13.5, 12.5], [3.5, 17], [13.5, 17], [8.5, 16.5]]) if (X.R() < .85) roundSet(X, room, [x + X.rf(-.5, .5), y + X.rf(-.4, .4)]); }],
      ['w', 'cashier', 1, 1, { sides: [3] }], ['w', 'aqua', 1, 2, { sides: [0, 1, 3] }], ['c', 'plant', 3, 5], ['w', 'vase', 1, 3], ['w', 'pscreen', 0, 2], ['w', 'winerack', 0, 1]],
    vip1: [['fn', (X, room) => roundSet(X, room, [23, 12])], ['w', 'pscreen', 0, 1], ['w', 'vase', 1, 2], ['c', 'plant', 1, 2], ['w', ['cabinet', 'winerack', 'tv'], 1, 2], ['w', 'aqua', 0, 1]],
    vip2: [['fn', (X, room) => roundSet(X, room, [23, 18.5])], ['w', 'pscreen', 0, 1], ['w', 'vase', 1, 2], ['c', 'plant', 1, 2], ['w', ['cabinet', 'winerack', 'tv'], 1, 2], ['w', 'sofa', 0, 1]]
  }
};

/* ---------- hospital ---------- */
function ward(X, room) {
  const ib = inner(room), n = X.ri(3, 3);
  for (let i = 0; i < n; i++) { const b = tryPut(X, room, 'hbed', 0, room.r[0] + 1.2 + i * 2.6, ib[1] + 1.1, .05); if (b) around(X, room, b, [[X.ch(['ivstand', 'monitor', 'nstand']), .85, -.65, 0]], .02); }
}
SCENES.hospital = {
  n: '夜班医院', icon: '🏥', w: 30, h: 22, bg: '#5a6a72', seek: [13.5, 21], hide: [15, 9.5], keep: [[11.5, 19.6, 15.5, 22]], seekT: 200,
  wallc: ['#e8f2ee', '#6a8a84', '#a8cfc4', '#dcebe6'],
  rooms: [
    { id: 'w1', n: '一号病房', r: [0, 0, 8, 8], fl: 'lino', fc: ['#e6eef0', '#d4e0e4'] },
    { id: 'w2', n: '二号病房', r: [8, 0, 16, 8], fl: 'lino', fc: ['#e6eef0', '#d4e0e4'] },
    { id: 'or', n: '手术室', r: [16, 0, 24, 8], fl: 'tile', fc: ['#bfe0d8', '#a8d0c6'] },
    { id: 'pharm', n: '药房', r: [24, 0, 30, 8], fl: 'lino', fc: ['#eef0e6', '#dcdfd2'] },
    { id: 'hall', n: '走廊', r: [0, 8, 30, 11], fl: 'lino', fc: ['#cfe0e6', '#bdd0d8'] },
    { id: 'clinic', n: '诊室', r: [0, 11, 7, 17], fl: 'lino', fc: ['#e6eef0', '#d4e0e4'] },
    { id: 'lobby', n: '候诊大厅', r: [7, 11, 20, 22], fl: 'lino', fc: ['#e2e8ec', '#cfd8de'] },
    { id: 'lab', n: '化验室', r: [20, 11, 25, 17], fl: 'tile', fc: ['#eef2f4', '#d8dee2'] },
    { id: 'wc', n: '洗手间', r: [25, 11, 30, 17], fl: 'tile', fc: ['#cfe3ea', '#b9d3dc'] },
    { id: 'garden', n: '康复花园', r: [0, 17, 7, 22], fl: 'grass', fc: ['#8cc06a', '#82b660'], out: 1, wso: 'hedge' },
    { id: 'store', n: '储藏室', r: [20, 17, 30, 22], fl: 'concrete', fc: ['#b8b4ac', '#a8a49c'] }
  ],
  doors: [
    { v: 0, c: 8, a: 3, b: 4.6 }, { v: 0, c: 8, a: 11, b: 12.6 }, { v: 0, c: 8, a: 19, b: 21 }, { v: 0, c: 8, a: 26, b: 27.4 },
    { v: 0, c: 11, a: 2.5, b: 4 }, { v: 0, c: 11, a: 9, b: 11 }, { v: 0, c: 11, a: 15, b: 17 }, { v: 0, c: 11, a: 21.5, b: 23 }, { v: 0, c: 11, a: 26.5, b: 28 },
    { v: 0, c: 17, a: 2, b: 3.5 }, { v: 0, c: 17, a: 21, b: 22.4 }, { v: 1, c: 7, a: 18.5, b: 20 }, { v: 1, c: 20, a: 19, b: 20.4 }
  ],
  gen: {
    w1: [['fn', ward], ['w', 'pscreen', 0, 1, { sides: [2] }], ['f', 'wchair', 0, 1], ['c', 'plant', 1, 1], ['w', 'trash', 1, 1, { sides: [2, 1, 3] }], ['w', 'chair', 1, 2, { sides: [2, 1, 3] }]],
    w2: [['fn', ward], ['w', 'pscreen', 0, 1, { sides: [2] }], ['f', 'wchair', 0, 1], ['c', 'plant', 1, 1], ['w', 'trash', 1, 1, { sides: [2, 1, 3] }], ['w', 'chair', 1, 2, { sides: [2, 1, 3] }]],
    or: [['fn', (X, room) => { const t = tryPut(X, room, 'optable', 0, 20, 3.8, .7); if (t) around(X, room, t, [['oplamp', -.95, -.5, 0], ['monitor', .95, -.6, 0], ['cart', .95, .7, 0]], .05); }], ['f', 'ivstand', 1, 2, { m: .3 }], ['w', 'oxygen', 1, 2], ['w', 'sink', 1, 1], ['w', 'cabinet', 1, 2], ['f', 'cart', 0, 1]],
    pharm: [['w', 'medshelf', 3, 5, { m: .02 }], ['w', 'counter', 1, 2], ['f', 'box', 2, 3, { m: .3 }], ['f', 'cart', 0, 1], ['w', 'trash', 1, 1]],
    hall: [['w', 'wseat', 3, 5, { sides: [0, 2], m: .1 }], ['c', 'plant', 2, 3], ['w', 'water', 1, 1, { sides: [0, 2] }], ['w', 'wchair', 1, 2, { sides: [0, 2] }], ['w', 'gurney', 0, 1, { sides: [0, 2] }], ['w', 'trash', 1, 2, { sides: [0, 2] }]],
    clinic: [['fn', (X, room) => deskSet(X, room)], ['w', 'exbed', 1, 1], ['w', 'pscreen', 0, 1], ['w', ['cabinet', 'medshelf'], 1, 2], ['w', 'chair', 1, 1], ['c', 'plant', 0, 1], ['w', 'trash', 1, 1]],
    lobby: [['w', 'reception', 1, 1, { sides: [0] }], ['fn', (X, room) => grid(X, room, 'wseat', 2, 10.2, 15.2, 2.6, 2.0, 3, 2, .05)], ['c', 'plant', 3, 4], ['w', 'vending', 1, 2, { sides: [1, 3] }], ['w', 'water', 1, 1], ['w', 'wchair', 1, 2], ['w', 'tv', 1, 1, { sides: [1, 3] }], ['w', 'trash', 1, 2]],
    lab: [['w', 'labbench', 1, 2], ['w', 'monitor', 1, 1], ['w', ['cabinet', 'medshelf'], 1, 2], ['f', 'ochair', 1, 2, { m: .3 }], ['w', 'trash', 1, 1]],
    wc: [['w', 'toilet', 2, 3, { sides: [0, 1], m: .2 }], ['w', 'sink', 1, 2], ['w', ['trash', 'mop'], 1, 2], ['w', 'basket', 0, 1]],
    garden: [['w', 'bush', 2, 4, { sides: [3, 2], m: .2 }], ['f', 'tree', 1, 2, { m: .7 }], ['f', 'bench', 1, 1, { r: 0, m: .5 }], ['w', 'fpot', 2, 3], ['f', 'wchair', 0, 1]],
    store: [['f', 'box', 3, 5, { m: .3 }], ['w', ['hbed', 'gurney'], 1, 1], ['w', 'wchair', 1, 2], ['f', 'cart', 1, 2, { m: .3 }], ['w', 'oxygen', 1, 2], ['w', ['cabinet', 'medshelf'], 1, 2]]
  }
};

/* ---------- wild ---------- */
SCENES.wild = {
  n: '林间营地', icon: '🌲', w: 32, h: 24, bg: '#34502c', seek: [17, 22.8], hide: [13, 14.6], keep: [[15.5, 21.4, 18.5, 24], [12, 13.8, 14, 15.4]], seekT: 210,
  inner: 'hedge', outer: 'hedge',
  rooms: [
    { id: 'nw', n: '西边树林', r: [0, 0, 10, 8], fl: 'forest', fc: ['#5a8a46', '#4a7a3a'], out: 1 },
    { id: 'n', n: '北边树林', r: [10, 0, 20, 8], fl: 'forest', fc: ['#5e8e48', '#4e7e3c'], out: 1 },
    { id: 'cave', n: '山洞', r: [20, 0, 32, 8], fl: 'cave', fc: ['#6e6a66', '#5a5652'], ws: 'rock', wso: 'rock', inset: .55 },
    { id: 'river', n: '小河边', r: [0, 8, 10, 16], fl: 'grass', fc: ['#7ab060', '#6ea456'], out: 1, water: [0, 8, 2.6, 16] },
    { id: 'camp', n: '营地', r: [10, 8, 20, 16], fl: 'dirt', fc: ['#b89a6a', '#a68a5c'], out: 1 },
    { id: 'cabin', n: '小木屋', r: [20, 8, 27, 16], fl: 'wood', fc: ['#b88a5a', '#a87a4c'], ws: 'log', wso: 'log' },
    { id: 'shed', n: '柴房', r: [27, 8, 32, 16], fl: 'wood', fc: ['#a07a4e', '#906c42'], ws: 'log', wso: 'log' },
    { id: 'flowers', n: '花田', r: [0, 16, 12, 24], fl: 'grass', fc: ['#8cc06a', '#82b660'], out: 1 },
    { id: 'lake', n: '湖边', r: [12, 16, 22, 24], fl: 'sand', fc: ['#e2cf9a', '#d4c08a'], out: 1, water: [12, 16, 22, 17.6] },
    { id: 'orchard', n: '果园', r: [22, 16, 32, 24], fl: 'grass', fc: ['#86b864', '#7aac58'], out: 1 }
  ],
  doors: [
    { v: 0, c: 8, a: 14, b: 15.8 }, { v: 0, c: 8, a: 4, b: 5.8 }, { v: 0, c: 8, a: 23.5, b: 24.9 }, { v: 0, c: 8, a: 29, b: 30.4 },
    { v: 1, c: 10, a: 3, b: 4.8 }, { v: 1, c: 10, a: 11, b: 12.8 }, { v: 1, c: 20, a: 3, b: 5 }, { v: 1, c: 20, a: 11.5, b: 12.9 }, { v: 1, c: 27, a: 10, b: 11.4 },
    { v: 0, c: 16, a: 4, b: 5.8 }, { v: 0, c: 16, a: 15, b: 16.8 }, { v: 0, c: 16, a: 23.5, b: 24.9 }, { v: 0, c: 16, a: 29, b: 30.4 },
    { v: 1, c: 12, a: 19, b: 20.8 }, { v: 1, c: 22, a: 19, b: 20.8 }
  ],
  gen: {
    nw: [['f', 'pine', 4, 6, { m: .5 }], ['f', 'tree', 1, 3, { m: .6 }], ['f', 'stump', 1, 2], ['f', 'log', 1, 2, { m: .4 }], ['f', 'mushroom', 1, 3, { m: .3 }], ['w', 'bush', 2, 4, { m: .2 }], ['f', 'rock', 1, 2]],
    n: [['f', 'pine', 3, 5, { m: .5 }], ['f', 'tree', 2, 3, { m: .6 }], ['f', 'stump', 1, 2], ['f', 'mushroom', 1, 2, { m: .3 }], ['w', 'bush', 2, 4, { m: .2 }], ['f', ['rock', 'flower'], 1, 3]],
    cave: [['f', 'boulder', 2, 4, { m: .5 }], ['f', 'rock', 3, 5, { m: .35 }], ['f', 'mushroom', 1, 3, { m: .3 }], ['w', 'barrel', 1, 2], ['w', 'crate', 1, 2], ['f', 'chest', 0, 1]],
    river: [['f', 'reed', 3, 5, { m: .2 }], ['f', 'rock', 3, 5, { m: .35 }], ['f', 'log', 1, 2, { m: .4 }], ['f', 'stump', 0, 1], ['f', 'boulder', 0, 1], ['f', ['cooler', 'backpack'], 0, 2]],
    camp: [['fn', (X, room) => { const f = tryPut(X, room, 'campfire', 0, 15.2, 11.6, .1); if (f) around(X, room, f, [['log', 0, -1.15, 0], ['log', 0, 1.15, 0], ['cchair', -1.2, 0, 1]], .05); }],
      ['w', 'tent', 2, 3, { sides: [0, 1, 3], m: .3 }], ['f', 'cchair', 1, 2, { m: .4 }], ['f', 'cooler', 1, 2, { m: .35 }], ['f', 'backpack', 1, 2, { m: .3 }], ['w', ['woodpile', 'barrel'], 0, 1]],
    cabin: [['w', 'bed', 1, 1, { sides: [0, 1] }], ['fn', (X, room) => { const t = freePut(X, room, 'dtable', { r: 1, m: .8 }); if (t) around(X, room, t, [['chair', 0, -.74, 0], ['chair', 0, .74, 2]]); }], ['w', 'stove2', 1, 1], ['w', 'shelf', 1, 1], ['w', ['barrel', 'crate', 'backpack'], 1, 2], ['f', 'rug', 0, 1, { m: .1 }]],
    shed: [['w', 'woodpile', 2, 3], ['w', 'barrel', 1, 2], ['f', 'crate', 1, 3, { m: .3 }], ['w', ['sack', 'box'], 1, 2]],
    flowers: [['f', 'flower', 6, 9, { m: .25 }], ['w', 'bush', 2, 3, { sides: [2, 3], m: .2 }], ['f', 'tree', 1, 2, { m: .6 }], ['f', ['stump', 'rock'], 1, 2], ['f', 'bench', 0, 1, { m: .5 }], ['w', 'fpot', 1, 3, { sides: [0] }]],
    lake: [['f', 'reed', 3, 5, { m: .25 }], ['f', 'rock', 2, 4, { m: .35 }], ['f', 'log', 1, 2, { m: .4 }], ['f', 'boulder', 0, 1], ['f', ['cchair', 'cooler', 'backpack'], 1, 2, { m: .4 }]],
    orchard: [['fn', (X, room) => { X.vv['orchardtree'] = 2; grid(X, room, 'tree', 0, 24, 18.2, 2.6, 2.6, 4, 2, .3); }], ['f', 'crate', 2, 3, { m: .35 }], ['f', 'sack', 1, 2, { m: .3 }], ['w', 'barrel', 0, 1], ['w', 'bush', 1, 2, { m: .2 }], ['f', 'flower', 1, 2]]
  }
};

/* ---------- sea ---------- */
SCENES.sea = {
  n: '海底探险', icon: '🌊', w: 32, h: 24, bg: '#0f3a5a', water: 1, speed: .85, seek: [16, 22.8], hide: [14, 12], keep: [[14.5, 21.4, 17.5, 24], [13, 11.2, 15, 12.8]], seekT: 210,
  inner: 'reef', outer: 'reef', rockc: ['#5c6a70', '#738288', '#4a565c'],
  rooms: [
    { id: 'coral', n: '珊瑚园', r: [0, 0, 10, 8], fl: 'seabed', fc: ['#e6d0b0', '#d4bc9a'], inset: .55 },
    { id: 'kelp', n: '海带林', r: [10, 0, 22, 8], fl: 'seabed', fc: ['#c8bc96', '#b8ac86'], inset: .55 },
    { id: 'wreck', n: '沉船', r: [22, 0, 32, 10], fl: 'deck', fc: ['#8a6a48', '#6e5236'], ws: 'hull', wso: 'hull' },
    { id: 'cave', n: '岩洞', r: [0, 8, 10, 16], fl: 'cave', fc: ['#5a6066', '#4a5056'], ws: 'rock', inset: .55 },
    { id: 'plain', n: '白沙地', r: [10, 8, 22, 16], fl: 'seabed', fc: ['#f0e2c0', '#e0d0ac'], inset: .55 },
    { id: 'ruin', n: '海底遗迹', r: [22, 10, 32, 18], fl: 'stone', fc: ['#c8c0a8', '#b0a890'], ws: 'ruin', wso: 'ruin' },
    { id: 'bay', n: '贝壳湾', r: [0, 16, 10, 24], fl: 'seabed', fc: ['#ecd8b8', '#dcc6a4'], inset: .55 },
    { id: 'trench', n: '深海沟', r: [10, 16, 22, 24], fl: 'seabed', fc: ['#a8a088', '#989078'], inset: .55 },
    { id: 'jelly', n: '水母区', r: [22, 18, 32, 24], fl: 'seabed', fc: ['#c0c8c0', '#b0b8b0'], inset: .55 }
  ],
  doors: [
    { v: 0, c: 8, a: 4, b: 5.8 }, { v: 0, c: 8, a: 15, b: 16.8 }, { v: 1, c: 10, a: 3, b: 4.8 }, { v: 1, c: 10, a: 11, b: 12.8 },
    { v: 1, c: 22, a: 3, b: 4.6 }, { v: 1, c: 22, a: 12, b: 13.6 }, { v: 0, c: 10, a: 26, b: 27.6 },
    { v: 0, c: 16, a: 4, b: 5.8 }, { v: 0, c: 16, a: 15, b: 16.8 }, { v: 1, c: 10, a: 19, b: 20.8 }, { v: 1, c: 22, a: 20, b: 21.8 }, { v: 0, c: 18, a: 27, b: 28.6 }
  ],
  gen: {
    coral: [['f', 'coral', 4, 6, { m: .35 }], ['f', 'brain', 2, 3, { m: .35 }], ['w', 'seafan', 2, 3, { m: .2 }], ['f', 'anemone', 2, 3, { m: .3 }], ['f', ['shell', 'starfish'], 1, 3, { m: .3 }], ['f', 'rock', 1, 2]],
    kelp: [['f', 'kelp', 8, 12, { m: .3 }], ['f', 'rock', 2, 3, { m: .35 }], ['f', 'urchin', 1, 3, { m: .3 }], ['f', 'shell', 0, 1]],
    wreck: [['w', 'barrel', 2, 4], ['f', 'crate', 2, 3, { m: .35 }], ['f', 'chest', 1, 2, { m: .4 }], ['w', 'cannon', 2, 3, { sides: [0, 1] }], ['w', 'helm', 1, 1], ['w', 'anchor', 0, 1], ['w', 'box', 0, 1]],
    cave: [['f', 'boulder', 2, 3, { m: .5 }], ['f', 'rock', 3, 4, { m: .35 }], ['f', 'urchin', 2, 3, { m: .3 }], ['f', 'clam', 1, 2, { m: .4 }], ['f', 'anemone', 1, 2, { m: .3 }], ['f', 'chest', 0, 1]],
    plain: [['f', 'rock', 2, 3, { m: .4 }], ['f', 'starfish', 2, 4, { m: .3 }], ['f', 'shell', 2, 3, { m: .3 }], ['f', 'brain', 1, 2, { m: .4 }], ['f', 'coral', 1, 2, { m: .4 }], ['f', 'anchor', 0, 1, { m: .5 }], ['f', 'amphora', 0, 2, { m: .3 }]],
    ruin: [['f', 'pillar', 3, 5, { m: .5 }], ['w', 'pillar', 1, 2], ['w', 'amphora', 2, 4], ['f', 'amphora', 1, 2, { m: .3 }], ['f', 'chest', 0, 1], ['f', 'rock', 1, 2]],
    bay: [['f', 'shell', 3, 5, { m: .3 }], ['f', 'starfish', 2, 4, { m: .3 }], ['f', 'clam', 1, 2, { m: .4 }], ['f', 'rock', 2, 3, { m: .35 }], ['f', ['coral', 'anemone'], 2, 3, { m: .35 }]],
    trench: [['f', 'rock', 2, 4, { m: .4 }], ['f', 'boulder', 1, 2, { m: .5 }], ['f', 'urchin', 2, 3, { m: .3 }], ['f', 'kelp', 2, 4, { m: .3 }], ['f', 'anemone', 1, 2, { m: .3 }], ['f', 'jelly', 0, 1, { m: .4 }]],
    jelly: [['f', 'jelly', 4, 6, { m: .4 }], ['f', ['coral', 'anemone'], 2, 3, { m: .35 }], ['f', 'rock', 1, 2], ['f', 'kelp', 1, 2, { m: .3 }]]
  }
};
const SCENE_IDS = ['house', 'school', 'restaurant', 'hospital', 'wild', 'sea'];
