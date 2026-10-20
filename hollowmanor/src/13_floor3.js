/* ================= floor 3 · 阁楼（宅主） =================
   No identification here: the lady of the house always shows herself. Three anchors (镇物) hold her to the house —
   the seer unbinds each one (only she can see the binding), then the holder smashes it. Each one breaks her temper.
   With all three gone the sealed room opens: the seer chants her name inside the circle while the holder guards.
   Oil lamps (holder lights them) slow her down; she blows them out. Then out through the roof hatch. */
FLOORS[2] = {
  key: 'f3', name: '阁楼', title: '阁楼 · 宅主', sub: '她一直在这里等着', wallH: 2.5, ambient: 0.75, power: 0, outside: 'roof', ghost: 'boss',
  bal: { firstHunt: 46, huntCD: [32, 50], gHunt: 3.3, gRoam: 1.5, stunsToBreak: 3, huntLen: [20, 28] },
  chimneys: [[3, 27.4], [31, -1.4]],
  rooms: [
    { id: 'storeW', name: '西储物间', r: [0, 0, 11, 10], floor: 'attic', wall: 'attic', light: false },
    { id: 'sanctum', name: '封闭的房间', r: [11, 0, 23, 10], floor: 'attic', wall: 'damask2', light: false },
    { id: 'storeE', name: '东储物间', r: [23, 0, 34, 10], floor: 'attic', wall: 'attic', light: false },
    { id: 'corr', name: '阁楼走廊', r: [0, 10, 34, 14], floor: 'attic', wall: 'attic', light: false },
    { id: 'toys', name: '旧玩具间', r: [0, 14, 10, 26], floor: 'attic', wall: 'nursery', light: false },
    { id: 'top', name: '楼梯口', r: [10, 14, 24, 26], floor: 'attic', wall: 'attic', light: false },
    { id: 'tank', name: '水箱间', r: [24, 14, 34, 20], floor: 'concrete', wall: 'plaster', light: false },
    { id: 'maid', name: '女佣阁楼', r: [24, 20, 34, 26], floor: 'attic', wall: 'attic', light: false },
  ],
  doors: [
    { id: 'sanctumD', kind: 'seal', dir: 'h', at: 10, a: 16.2, b: 17.8, locked: true, lockWhy: '门上缠满了铁链和符纸。三件镇物不除，这扇门打不开。' },
    { id: 'storeWD', kind: 'attic', dir: 'h', at: 10, a: 5, b: 6.2 },
    { id: 'storeED', kind: 'attic', dir: 'h', at: 10, a: 28, b: 29.2 },
    { id: 'toysD', kind: 'attic', dir: 'h', at: 14, a: 4, b: 5.2 },
    { id: 'topArch', kind: 'arch', dir: 'h', at: 14, a: 15, b: 18 },
    { id: 'tankD', kind: 'attic', dir: 'h', at: 14, a: 26.4, b: 27.6 },
    { id: 'tankTop', kind: 'attic', dir: 'v', at: 24, a: 15.6, b: 16.8 },
    { id: 'maidD', kind: 'attic', dir: 'v', at: 24, a: 23.5, b: 24.7 },
    { id: 'toysTop', kind: 'attic', dir: 'v', at: 10, a: 21, b: 22.2 },
    { id: 'maidTank', kind: 'attic', dir: 'h', at: 20, a: 31, b: 32.2 },
  ],
  windows: [['h', 0, 2, 3.2], ['h', 0, 31, 32.2], ['v', 0, 18, 19.2], ['v', 34, 17, 18.2], ['v', 34, 22, 23.2], ['h', 26, 12, 13.2], ['h', 26, 15.5, 16.7], ['h', 26, 3, 4.2], ['h', 26, 29, 30.2]],
  furn: [
    // ---- west storeroom
    ['post', 3.6, 5, 0], ['post', 8.0, 5, 0], ['crateStack', 1.5, 1.4, 0.2], ['sheeted', 4.5, 1.3, 0.1, { w: 1.6, d: 0.9, h: 1.0 }], ['sheeted', 9.6, 7.6, -0.3, { w: 1.1, d: 1.0, h: 1.4 }],
    ['trunk', 1.0, 6.2, HP], ['portraitStack', 9.6, 1.0, -0.4], ['rockingChair', 6.0, 7.4, 2.6], ['birdcage', 1.0, 9.2, 0], ['smallWardrobe', 10.62, 3.6, -HP, { hide: 1 }], ['crate', 6.3, 2.6, 0.4],
    // ---- sanctum (sealed room)
    ['ritualCircle', 17, 5.0, 0], ['statue', 11.8, 0.9, 0.6], ['statue', 22.2, 0.9, -0.6], ['roofHatch', 13.2, 1.3, 0], ['candleCluster', 12.0, 8.9, 0], ['candleCluster', 22.0, 8.9, 0],
    ['candleStand', 14.6, 1.0, 0], ['candleStand', 19.4, 1.0, 0], ['sheeted', 21.8, 6.6, 0.2, { w: 1.2, d: 0.7, h: 1.6 }],
    // ---- east storeroom
    ['post', 26.4, 5, 0], ['post', 31.0, 5, 0], ['sheeted', 25.2, 1.6, 0.2, { w: 1.6, d: 1.4, h: 1.05 }], ['mannequin', 28.4, 2.0, 0.4], ['pram', 32.4, 2.6, -0.5], ['cot', 32.6, 7.6, HP],
    ['crateStack', 24.2, 8.4, 0.1], ['trunk', 29.0, 8.6, 0.2], ['wardrobe', 33.6, 5.0, -HP, { hide: 1 }], ['canvasStack', 28.2, 0.35, 0],
    // ---- corridor
    ['post', 8.6, 12, 0], ['post', 22.6, 12, 0], ['wardrobe', 11.0, 13.69, PI, { hide: 1 }], ['wardrobe', 31.5, 13.69, PI, { hide: 1 }], ['trunk', 2.0, 13.6, PI], ['crate', 20.2, 10.5, 0.3],
    // ---- old toy room
    ['pram', 3.0, 16.8, 0.4], ['rockingHorse', 6.2, 15.6, -0.5], ['dollhouse', 0.62, 21.0, HP], ['crib', 8.4, 24.6, 0], ['toyChest', 5.0, 25.6, PI], ['blocks', 4.6, 21.6, 0.5],
    ['smallWardrobe', 0.42, 24.4, HP, { hide: 1 }], ['sheeted', 8.6, 17.2, 0.4, { w: 1.0, d: 0.8, h: 0.9 }], ['rug', 5, 21, 0, { w: 3, d: 3, pat: 'round' }],
    // ---- top of the stairs
    ['stairwell', 20.6, 20.5, 0], ['post', 13.4, 18.2, 0], ['post', 13.4, 23.2, 0], ['sheeted', 11.0, 15.2, 0.1, { w: 1.2, d: 0.8, h: 1.2 }], ['crateStack', 11.2, 25.0, 0.2], ['cot', 16.4, 25.0, HP], ['trunk', 23.4, 25.6, PI],
    // ---- water tank room
    ['waterTank', 30.0, 16.8, 0], ['bucket', 25.0, 19.4, 0], ['crate', 33.2, 19.2, 0.3], ['barrel', 25.0, 14.6, 0], ['metalShelf', 33.62, 15.2, -HP],
    // ---- maid's garret
    ['cot', 25.0, 22.4, 0], ['cot', 33.2, 25.0, HP], ['washbasin', 28.0, 20.35, 0], ['smallTable', 29.6, 24.6, 0], ['chair', 28.7, 24.6, HP], ['smallWardrobe', 33.62, 21.8, -HP, { hide: 1 }], ['sheeted', 26.8, 25.2, 0, { w: 1.0, d: 0.7, h: 0.8 }],
  ],
  wall: [],
  paint: [[17, 0.1, 0, 1.6, 'lady'], [2.5, 13.9, PI, 0.8], [27.0, 13.9, PI, 0.8], [0.1, 16.2, HP, 0.8], [33.9, 24.8, -HP, 0.7]],
  /* [kind, x, z, y, r, powered] — oil lamps are lit by the holder */
  lights: [
    ['oilLamp', 6.0, 11.4, 2.25, 0, 0], ['oilLamp', 16.5, 11.4, 2.25, 0, 0], ['oilLamp', 28.0, 11.4, 2.25, 0, 0],
    ['oilLamp', 16.0, 18.0, 2.25, 0, 0], ['oilLamp', 16.0, 23.0, 2.25, 0, 0], ['oilLamp', 5.6, 4.0, 2.25, 0, 0], ['oilLamp', 28.6, 4.4, 2.25, 0, 0],
    ['oilLamp', 4.2, 19.2, 2.25, 0, 0], ['oilLamp', 27.0, 17.2, 2.25, 0, 0], ['oilLamp', 29.0, 22.6, 2.25, 0, 0], ['oilLamp', 13.4, 6.6, 2.25, 0, 0], ['oilLamp', 20.6, 6.6, 2.25, 0, 0],
    ['candles', 17, 5.0, 0.4, 0, 0], ['candleS', 14.6, 1.0, 1.55, 0, 0], ['candleS', 19.4, 1.0, 1.55, 0, 0],
  ],
  slots: {},
  start: [[20.0, 15.4], [21.3, 15.4]], startA: -HP,
  haunts: ['storeW', 'storeE', 'toys', 'tank', 'maid', 'corr'], evExclude: [],
  anchorRooms: ['storeW', 'storeE', 'toys', 'tank', 'maid'],
  inter: [
    { k: 'circle', x: 17, z: 5.0, role: 'S' },
    { k: 'hatch', x: 13.2, z: 2.35, role: '*' },
  ],
  sanctumDoor: 'sanctumD',
  ritualEntry: [17, 10.9],
  exitHint: '她走了——从封闭房间里的天窗爬出去',
  objectives(W) {
    const n = W.anchors.filter(v => v === 2).length;
    return [
      { t: '毁掉三件镇物：灵视者解开灵缚，持灯者砸碎（' + n + '/3）', done: n >= 3 },
      { t: '进入封闭的房间', done: !!W.f.sanctum },
      { t: '在法阵中念出她的名字（' + Math.round((W.rit && W.rit.item === 'final' ? W.rit.p : W.finP) * 100) + '%）——持灯者守在旁边', done: !W.f.seal },
      { t: '一起从天窗爬上屋顶', done: W.phase !== 'play' },
    ];
  },
  hints(W) {
    const h = [];
    h.push('镇物身上的灵缚只有灵视者看得见；持灯者用手电照过去，能隐约看见一点光。');
    h.push('每砸碎一件镇物，她就会暴怒、立刻开始猎杀。先点亮附近的油灯——灯光会拖慢她。');
    h.push('油灯会被她吹灭，只有持灯者能重新点亮。');
    if (W.f.sanctum) h.push('念诵被打断不会前功尽弃，法阵会记住进度。持灯者离法阵太远，法阵就不会亮。');
    return h;
  },
};
