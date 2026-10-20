/* ================= floor 1 · 一楼（门厅、长廊、祈祷室） ================= */
FLOORS[0] = {
  key: 'f1', name: '一楼', title: '一楼 · 门厅', sub: '雨夜，大门在身后锁死了', wallH: 3.0, power: 0, outside: 'ground', ghost: 'random',
  rooms: [
    { id: 'cons', name: '温室', r: [0, 0, 8, 8], floor: 'tile', wall: 'conserv', light: false },
    { id: 'music', name: '琴房', r: [8, 0, 16, 8], floor: 'wood', wall: 'green', light: true },
    { id: 'study', name: '书房', r: [16, 0, 24, 8], floor: 'wood', wall: 'red', light: true },
    { id: 'chapel', name: '祈祷室', r: [24, 0, 34, 8], floor: 'stone', wall: 'stone', light: false },
    { id: 'gallery', name: '长廊', r: [0, 8, 34, 11], floor: 'wood2', wall: 'damask', light: true },
    { id: 'parlor', name: '客厅', r: [0, 11, 12, 19], floor: 'wood', wall: 'damask2', light: true },
    { id: 'foyer', name: '门厅', r: [12, 11, 22, 26], floor: 'marble', wall: 'panel', light: true },
    { id: 'dining', name: '餐厅', r: [22, 11, 34, 19], floor: 'wood2', wall: 'red', light: true },
    { id: 'nursery', name: '儿童房', r: [0, 19, 7, 26], floor: 'wood', wall: 'nursery', light: true },
    { id: 'util', name: '杂物间', r: [7, 19, 12, 26], floor: 'concrete', wall: 'plaster', light: true },
    { id: 'kitchen', name: '厨房', r: [22, 19, 34, 26], floor: 'tile2', wall: 'tilewall', light: true },
  ],
  /* doors: dir 'h' = on the z = at line, spanning x a..b ; 'v' = on the x = at line, spanning z a..b */
  doors: [
    { id: 'consD', kind: 'shutter', dir: 'h', at: 8, a: 3, b: 4.5, locked: true, lockWhy: '电动卷帘门，没有电打不开' },
    { id: 'musicD', kind: 'door', dir: 'h', at: 8, a: 11, b: 12.5 },
    { id: 'studyD', kind: 'rune', dir: 'h', at: 8, a: 19.5, b: 21, locked: true, lockWhy: '门上刻着四个符文转盘' },
    { id: 'chapelD', kind: 'double', dir: 'h', at: 8, a: 28, b: 30, locked: true, lockWhy: '沉重的铁门锁死了，似乎和两根拉杆有关' },
    { id: 'parlorG', kind: 'door', dir: 'h', at: 11, a: 5, b: 6.5 },
    { id: 'foyerArch', kind: 'arch', dir: 'h', at: 11, a: 15, b: 19 },
    { id: 'diningG', kind: 'door', dir: 'h', at: 11, a: 27, b: 28.5 },
    { id: 'parlorF', kind: 'door', dir: 'v', at: 12, a: 14, b: 15.5 },
    { id: 'diningF', kind: 'door', dir: 'v', at: 22, a: 14, b: 15.5 },
    { id: 'nurseryD', kind: 'door', dir: 'h', at: 19, a: 3, b: 4.5 },
    { id: 'shelfD', kind: 'shelf', dir: 'h', at: 19, a: 9, b: 10.5, locked: true },
    { id: 'kitchenD', kind: 'door', dir: 'h', at: 19, a: 26, b: 27.5 },
    { id: 'kitchenF', kind: 'door', dir: 'v', at: 22, a: 22, b: 23.5 },
    { id: 'front', kind: 'front', dir: 'h', at: 26, a: 16, b: 18, locked: true, lockWhy: '大门从外面被锁死了。只能往上走。' },
  ],
  /* exterior windows (spans on the outer wall) */
  windows: [
    ['h', 0, 0.8, 2.6], ['h', 0, 3.2, 4.8], ['h', 0, 5.4, 7.2], ['v', 0, 0.8, 2.6], ['v', 0, 3.2, 4.8], ['v', 0, 5.4, 7.2], // conservatory glass
    ['h', 0, 9.8, 11.4], ['h', 0, 12.6, 14.2],          // music
    ['h', 0, 17.6, 19.2], ['h', 0, 20.8, 22.4],         // study
    ['h', 0, 25.8, 27.6, 'stained'], ['h', 0, 30.4, 32.2, 'stained'], // chapel
    ['v', 0, 13, 14.6], ['v', 0, 15.8, 17.4],           // parlor west
    ['v', 0, 21, 22.6],                                  // nursery west
    ['h', 26, 2, 3.6], ['h', 26, 4.6, 6.2],             // nursery south
    ['h', 26, 13.2, 14.8], ['h', 26, 19.2, 20.8],       // foyer south (beside the front door)
    ['h', 26, 25, 26.6], ['h', 26, 29, 30.6],           // kitchen south
    ['v', 34, 21, 22.6],                                 // kitchen east
    ['v', 34, 13, 14.6], ['v', 34, 15.8, 17.4],         // dining east
    ['v', 0, 9, 10.2], ['v', 34, 9, 10.2],              // gallery ends
  ],

  /* [kind, x, z, r, opts] — opts.room auto-filled */
  furn: [
    // ---- conservatory
    ['planterBench', 4, 3.4, 0], ['potTree', 1.0, 1.0, 0.3], ['potTree', 7.0, 1.0, 1.2], ['potTree', 1.0, 6.9, 2.0],
    ['potPlant', 2.6, 0.55, 0], ['potPlant', 5.4, 0.55, 0.8], ['potPlant', 0.55, 4.0, 0.2], ['wickerChair', 5.5, 5.7, -2.3], ['wickerChair', 7.1, 6.5, -1.8],
    ['roundTable', 6.4, 6.2, 0, { small: 1 }], ['wateringCan', 2.2, 5.6, 0.7], ['rug', 4, 6.5, 0, { w: 3, d: 2, pat: 'woven' }],
    // ---- music room
    ['grandPiano', 11.4, 3.4, 0.35], ['pianoBench', 11.0, 5.0, 0.35], ['gramophone', 14.9, 1.1, -0.6], ['musicStand', 9.6, 5.6, 0.6], ['cello', 9.0, 2.0, 0.9],
    ['bookshelfS', 15.75, 4.2, -HP], ['armchair', 14.4, 6.5, -2.5], ['sideTable', 15.4, 6.9, 0], ['chevalMirror', 9.0, 6.9, 0.9, { mirror: 1 }], ['chair', 13.7, 1.0, 0.2],
    ['rug', 12, 4.2, 0, { w: 5, d: 4.2, pat: 'persian2' }],
    // ---- study
    ['desk', 20, 2.5, 0], ['chair', 20, 1.55, 0, { office: 1 }], ['bookshelf', 16.25, 2.0, HP], ['bookshelf', 16.25, 4.6, HP], ['bookshelf', 23.75, 2.0, -HP], ['bookshelf', 23.75, 4.6, -HP],
    ['globe', 17.5, 6.8, 0.4], ['armchair', 22.6, 6.6, -2.4], ['sideTable', 21.6, 7.3, 0], ['rug', 20, 4.5, 0, { w: 4.4, d: 3.4, pat: 'persian' }],
    // ---- chapel
    ['altar', 29, 1.4, 0], ['candleStand', 27.2, 1.4, 0], ['candleStand', 30.8, 1.4, 0], ['statue', 24.9, 0.9, 0.5], ['statue', 33.1, 0.9, -0.5],
    ['pew', 26.6, 3.8, PI], ['pew', 31.4, 3.8, PI], ['pew', 26.6, 5.2, PI], ['pew', 31.4, 5.2, PI], ['pew', 26.6, 6.6, PI], ['pew', 31.4, 6.6, PI],
    ['rug', 29, 4.8, 0, { w: 1.4, d: 6.4, pat: 'runnerRed' }],
    // ---- gallery
    ['wardrobe', 8.6, 8.42, 0, { hide: 1 }], ['wardrobe', 24.8, 8.42, 0, { hide: 1 }], ['consoleTable', 10.2, 10.68, PI], ['consoleTable', 23.2, 10.68, PI],
    ['pedestal', 33.2, 10.4, 0], ['pedestal', 1.2, 10.5, 0], ['fern', 14.3, 10.55, 0], ['fern', 19.7, 10.55, 0],
    ['rug', 17, 9.5, 0, { w: 31, d: 1.3, pat: 'runner' }],
    // ---- parlor
    ['fireplace', 6.5, 18.66, PI], ['bookshelf', 1.75, 18.74, PI], ['bookshelfS', 11.25, 18.74, PI], ['sofa', 6.5, 15.2, 0], ['armchair', 4.3, 16.9, HP + 0.35], ['armchair', 8.7, 16.9, -HP - 0.35],
    ['coffeeTable', 6.5, 16.6, 0], ['sideTable', 0.5, 11.6, 0, { lamp: 1 }], ['roundTable', 10.2, 12.6, 0], ['chair', 9.4, 12.6, HP], ['chair', 11.0, 12.6, -HP],
    ['wardrobe', 11.66, 17.4, -HP, { hide: 1 }], ['rug', 6.5, 16.3, 0, { w: 5, d: 3.6, pat: 'persian' }],
    // ---- foyer
    ['stairs', 13.5, 20, 0], ['grandClock', 21.7, 12.6, -HP], ['centerTable', 17.6, 18.6, 0], ['coatRack', 21.3, 25.3, 0], ['umbrella', 20.7, 25.6, 0], ['bench', 19.3, 25.65, PI],
    ['consoleTable', 21.7, 20.2, -HP], ['wardrobe', 13.4, 11.42, 0, { hide: 1 }], ['fern', 21.4, 11.6, 0], ['fern', 15.4, 25.5, 0],
    ['rug', 17.8, 19.5, 0, { w: 5, d: 7, pat: 'persian2' }],
    // ---- dining
    ['diningTable', 28.5, 15, 0], ['chinaCabinet', 24.6, 11.37, 0], ['chinaCabinet', 31.6, 11.37, 0], ['sideboard', 30.4, 18.63, PI],
    ['rug', 28.5, 15, 0, { w: 7.4, d: 3.4, pat: 'persian' }],
    // ---- nursery
    ['bed', 1.0, 24.6, 0], ['crib', 6.15, 20.5, -HP], ['rockingHorse', 4.2, 23.5, 0.6], ['toyChest', 5.6, 25.62, PI], ['blocks', 2.9, 22.0, 0.3],
    ['smallWardrobe', 6.66, 23.4, -HP, { hide: 1 }], ['sideTable', 0.4, 22.8, 0, { lamp: 1 }], ['rug', 3.4, 23, 0, { w: 3.2, d: 3.2, pat: 'round' }],
    // ---- utility
    ['boiler', 7.75, 25.2, 0], ['workbench', 7.5, 22.4, HP], ['metalShelf', 11.65, 25.0, -HP], ['crate', 7.6, 20.0, 0.2], ['barrel', 8.4, 19.7, 0], ['bucket', 11.0, 20.0, 0], ['crate', 11.1, 23.7, -0.3],
    // ---- kitchen
    ['counter', 27.75, 25.62, PI], ['sink', 29.8, 25.62, PI], ['counter', 31.3, 25.62, PI], ['stove', 33.1, 25.4, PI], ['counter', 33.62, 22.0, -HP], ['counter', 33.62, 20.25, -HP],
    ['icebox', 22.45, 20.0, HP], ['jarShelf', 24.2, 19.28, 0], ['jarShelf', 31.0, 19.28, 0], ['kitchenTable', 28, 22.4, 0], ['stool', 27.4, 23.3, 0], ['stool', 28.6, 21.5, 0.4],
    ['barrel', 23.0, 25.4, 0], ['crate', 23.9, 25.5, 0.4],
    ...[26.6, 27.9, 29.2, 30.5].flatMap(x => [['chair', x, 13.75, 0, { dining: 1 }], ['chair', x, 16.25, PI, { dining: 1 }]]),
    ['chair', 25.3, 15, HP, { dining: 1 }], ['chair', 31.7, 15, -HP, { dining: 1 }],
  ],

  /* wall-mounted things: [kind, x, z, r, y, opts] (r = facing direction like furniture) */
  wall: [
    ['mantelMirror', 6.5, 18.9, PI, 1.85, { mirror: 1 }], ['wallMirror', 21.9, 17.2, -HP, 1.55, { mirror: 1 }],
    ['lever', 2.2, 11.12, 0, 1.2, { lever: 0 }], ['lever', 32.6, 18.88, PI, 1.2, { lever: 1 }],
    ['fuseBox', 11.9, 22.6, -HP, 1.45, {}], ['runePanel', 21.45, 8.12, 0, 1.35, {}],
    ['dollShelf', 0.12, 20.1, HP, 1.6, {}], ['potRack', 28, 22.4, 0, 2.3, {}],
  ],
  /* paintings */
  paint: [
    [6.5, 8.1, 0], [13.8, 8.1, 0], [17.6, 8.1, 0], [23.6, 8.1, 0], [26.6, 8.1, 0], [31.6, 8.1, 0],
    [2.4, 10.9, PI], [12.5, 10.9, PI], [21.6, 10.9, PI], [31.0, 10.9, PI],
    [12.1, 21, HP, 1.4], [9.6, 11.1, 0], [28.5, 11.1, 0, 1.3], [33.9, 15, -HP], [20.0, 0.1, 0, 0.9], [0.1, 18, HP, 0.8],
  ],
  /* light fixtures: [kind, x, z, y, room, powered] */
  lights: [
    ['chandelier', 12, 4.2, 2.7], ['chandelier', 20, 4.5, 2.7], ['chandelier', 6.5, 15.5, 2.7], ['chandelierBig', 17.6, 18, 2.8], ['chandelier', 28.5, 15, 2.7],
    ['pendant', 28, 22.4, 2.7], ['bulb', 9.5, 22.5, 2.75], ['pendant', 3.5, 22.6, 2.7],
    ['sconce', 2.0, 8.12, 1.9], ['sconce', 9.9, 8.12, 1.9], ['sconce', 15.7, 8.12, 1.9], ['sconce', 22.5, 8.12, 1.9], ['sconce', 27.4, 8.12, 1.9], ['sconce', 33.0, 8.12, 1.9],
    ['candles', 29, 1.4, 1.15, 0, 0], ['candleS', 27.2, 1.4, 1.55, 0, 0], ['candleS', 30.8, 1.4, 1.55, 0, 0], ['fire', 6.5, 18.55, 0.45, 0, 0],
  ],
  /* spots an item can be placed on: id → [x, z, y, gate] */
  slots: {
    cons: [4.6, 3.35, 0.93, 'power'], study: [20.6, 2.55, 0.82, 'rune'], util: [7.5, 22.0, 0.92, 'shelf'],
    music: [10.8, 3.0, 1.03], nursery: [5.6, 25.62, 0.57], kitchen: [28.3, 22.5, 0.8], dining: [30.9, 18.63, 0.97],
    parlor: [6.6, 16.6, 0.47], gallery: [10.2, 10.68, 0.87], foyer: [17.6, 18.9, 0.8],
  },


};
Object.assign(FLOORS[0], {
  start: [[16.4, 23.6], [18.6, 23.6]], startA: -HP,
  haunts: ['music', 'study', 'parlor', 'dining', 'nursery', 'kitchen', 'cons'], evExclude: ['util'],
  codeRooms: ['music', 'parlor', 'dining', 'nursery', 'kitchen', 'gallery', 'foyer'],
  /* items: [kind, slot] — `right` is the item the ghost fears, `others` the three wrong ones (shuffled) */
  planItems: (right, others) => { const gated = shuffle(['cons', 'study']), open = shuffle(['music', 'nursery', 'kitchen', 'dining', 'parlor', 'gallery', 'foyer']); return [[right, gated[0]], [others[0], gated[1]], [others[1], 'util'], [others[2], open[0]], ['fuse', open[1]]]; },
  inter: [
    { k: 'shelf', door: 'shelfD', x: 9.75, z: 18.25, role: 'L' },
    { k: 'altar', x: 29, z: 2.45, role: 'S', needFlag: 'chapel' },
    { k: 'stairs', x: 13.5, z: 24.75, role: '*', to: 1, label: '登上二楼' },
    { k: 'front', x: 17, z: 25.4, role: '*' },
  ],
  gateAt: { x: 13.5, z: 24.15 },
  ritualEntry: [29, 9.6],
  leverDoor: 'chapelD', leverFlag: 'chapel', leverMsg: '远处传来铁门开启的轰鸣声——祈祷室打开了。', leverWhere: '客厅和餐厅',
  fuseDoor: 'consD', fuseMsg: '电灯一盏盏亮了起来。温室的卷帘门升起了。',
  runeDoor: 'studyD', runeFlag: 'study', runeMsg: '符文锁“咔哒”一声转开了，书房的门开了。',
  exitHint: '灵封碎了——回到门厅的楼梯',
  objectives(W) {
    const n = Object.keys(W.evFound).length;
    return [
      { t: '收集证据，确认怨灵种类（' + Math.min(n, 2) + '/2）', done: n >= 2 },
      { t: '找到它惧怕的遗物', done: rightItemHeld(W) || !W.f.seal },
      { t: '同时拉下客厅和餐厅的两根拉杆，打开祈祷室', done: !!W.f.chapel },
      { t: '在祭坛举行驱灵仪式（灵视者主持，持灯者守护）', done: !W.f.seal },
      { t: '一起登上门厅的楼梯', done: W.phase !== 'play' },
    ];
  },
  hints(W) {
    const h = [];
    if (!W.f.study) h.push('书房的门上有符文锁。密码写在某面墙上，只有灵视者能看见；只有持灯者能转动转盘。');
    if (!W.f.power) h.push(W.f.shelf ? '杂物间里有保险丝盒，缺一根保险丝。恢复电力能打开温室，房间亮起来也不那么可怕。' : '温室的卷帘门需要电。客厅里有个书架后面在漏风——灵视者看得见。');
    if (!W.f.chapel) h.push('祈祷室的铁门由两根拉杆控制：一根在客厅，一根在餐厅，要同时拉下。');
    return h;
  },
});
