/* ================= floor 2 · 二楼（卧房层） =================
   Puzzles: drain the bathtub (holder) → brass key → master bedroom (ritual at the vanity);
   ring the five playroom bells in the order only the seer can read → painter's studio;
   the dressing room is bolted from inside — only the seer can slip through the spirit crack in the guest room wall. */
FLOORS[1] = {
  key: 'f2', name: '二楼', title: '二楼 · 卧房', sub: '楼下的灵封在身后合上了', wallH: 3.0, power: 1, outside: 'roof', ghost: 'random',
  bal: { firstHunt: 80, huntCD: [44, 68] },
  chimneys: [[6, -1.6], [30, 27.6]],
  rooms: [
    { id: 'master', name: '主卧', r: [0, 0, 10, 8], floor: 'wood', wall: 'damask2', light: true },
    { id: 'bath', name: '浴室', r: [10, 0, 16, 8], floor: 'tile3', wall: 'tilewall', light: true },
    { id: 'studio', name: '画室', r: [16, 0, 25, 8], floor: 'wood2', wall: 'studio', light: false },
    { id: 'library', name: '书库', r: [25, 0, 34, 8], floor: 'wood', wall: 'panel', light: true },
    { id: 'hall', name: '走廊', r: [0, 8, 34, 11], floor: 'wood2', wall: 'damask', light: true },
    { id: 'guest', name: '客房', r: [0, 11, 9, 19], floor: 'wood', wall: 'green', light: true },
    { id: 'closet', name: '衣帽间', r: [9, 11, 12, 19], floor: 'wood', wall: 'red', light: false },
    { id: 'landing', name: '楼梯厅', r: [12, 11, 22, 26], floor: 'wood2', wall: 'panel', light: true },
    { id: 'play', name: '游戏室', r: [22, 11, 34, 19], floor: 'wood', wall: 'nursery', light: true },
    { id: 'sewing', name: '缝纫间', r: [0, 19, 12, 26], floor: 'wood', wall: 'damask', light: false },
    { id: 'serv', name: '佣人房', r: [22, 19, 34, 26], floor: 'wood', wall: 'plaster', light: true },
  ],
  doors: [
    { id: 'masterD', kind: 'door', dir: 'h', at: 8, a: 4, b: 5.5, locked: true, key: 'brass', lockWhy: '主卧的门锁着。锁孔是黄铜的，边上刻着一朵玫瑰。', openMsg: '黄铜钥匙转动了——主卧的门开了。' },
    { id: 'bathD', kind: 'door', dir: 'h', at: 8, a: 12.3, b: 13.8 },
    { id: 'studioD', kind: 'door', dir: 'h', at: 8, a: 19.6, b: 21.1, locked: true, lockWhy: '画室的门锁着。门把上缠着一串褪了色的小铃铛……' },
    { id: 'libD', kind: 'door', dir: 'h', at: 8, a: 28.6, b: 30.1 },
    { id: 'guestD', kind: 'door', dir: 'h', at: 11, a: 4, b: 5.5 },
    { id: 'closetD', kind: 'door', dir: 'h', at: 11, a: 10, b: 11.3, locked: true, lockWhy: '门从里面闩上了。' },
    { id: 'crack', kind: 'crack', dir: 'v', at: 9, a: 15.2, b: 16.4 },
    { id: 'landArch', kind: 'arch', dir: 'h', at: 11, a: 15.6, b: 19 },
    { id: 'playG', kind: 'door', dir: 'h', at: 11, a: 27.5, b: 29 },
    { id: 'playL', kind: 'door', dir: 'v', at: 22, a: 12.8, b: 14.3 },
    { id: 'sewingG', kind: 'door', dir: 'h', at: 19, a: 3.5, b: 5 },
    { id: 'sewingL', kind: 'door', dir: 'v', at: 12, a: 24.4, b: 25.8 },
    { id: 'servL', kind: 'door', dir: 'v', at: 22, a: 24.4, b: 25.8 },
    { id: 'servP', kind: 'door', dir: 'h', at: 19, a: 30, b: 31.5 },
  ],
  windows: [
    ['h', 0, 7.6, 9.0], ['h', 0, 13.8, 15.2], ['h', 0, 17, 18.8], ['h', 0, 22, 23.8],
    ['v', 34, 4.6, 6.2], ['v', 0, 3.2, 4.6], ['v', 0, 9, 10.2], ['v', 0, 12, 13.4], ['v', 0, 20.2, 21.8],
    ['h', 26, 4, 5.6], ['h', 26, 7, 8.6], ['h', 26, 15.2, 16.8], ['h', 26, 24.6, 26.0], ['h', 26, 30, 31.5],
    ['v', 34, 9, 10.2], ['v', 34, 15, 16.5], ['v', 34, 20.5, 22],
  ],
  furn: [
    // ---- master bedroom
    ['canopyBed', 3.0, 1.65, 0], ['sideTable', 1.4, 0.45, 0, { lamp: 1 }], ['sideTable', 4.6, 0.45, 0, { lamp: 1 }], ['vanity', 9.62, 3.6, -HP, { mirror: 1, mw: 0.66, mh: 0.86, my: 1.3, mz: -0.22 }],
    ['wardrobe', 0.42, 6.3, HP, { hide: 1 }], ['dresser', 6.4, 0.32, 0], ['armchair', 7.4, 6.5, -2.6], ['sideTable', 8.4, 7.4, 0],
    ['rug', 4.6, 4.9, 0, { w: 5, d: 3.4, pat: 'persian' }],
    // ---- bath
    ['tub', 12.25, 1.0, 0], ['washbasin', 15.65, 2.2, -HP], ['toilet', 15.6, 5.4, -HP], ['towelRack', 10.45, 5.2, HP], ['rug', 13, 4.6, 0, { w: 1.6, d: 1, pat: 'woven' }],
    // ---- studio (painter's room)
    ['easel', 17.8, 3.2, 0.5, { seed: 1 }], ['easel', 21.0, 2.4, -0.2, { seed: 2 }], ['easel', 23.3, 4.1, -0.7, { seed: 5, cover: 1 }],
    ['sheeted', 23.5, 6.9, 0.2, { w: 1.4, d: 0.8, h: 0.95 }], ['sheeted', 17.3, 6.8, -0.3, { w: 1.0, d: 0.9, h: 1.3 }], ['kitchenTable', 20.5, 5.4, 0], ['candleCluster', 21.0, 5.65, 0, { y: 0.81 }],
    ['canvasStack', 16.45, 1.4, HP], ['pedestal', 24.4, 0.9, 0], ['stool', 19.4, 4.4, 0],
    // ---- library
    ['bookshelf', 25.9, 0.25, 0], ['bookshelf', 27.6, 0.25, 0], ['bookshelf', 31.1, 0.25, 0], ['bookshelf', 32.8, 0.25, 0],
    ['bookshelf', 27.0, 3.9, 0], ['bookshelf', 27.0, 4.33, PI], ['bookshelf', 31.8, 3.9, 0], ['bookshelf', 31.8, 4.33, PI],
    ['libraryLadder', 29.4, 0.55, 0], ['desk', 32.6, 6.6, -HP], ['chair', 31.65, 6.6, HP, { office: 1 }], ['armchair', 25.8, 6.8, 2.4], ['globe', 25.6, 2.3, 0.3], ['rug', 29.4, 2.3, 0, { w: 3, d: 2.4, pat: 'persian2' }],
    // ---- hall
    ['wardrobe', 8.2, 8.42, 0, { hide: 1 }], ['wardrobe', 24.6, 8.42, 0, { hide: 1 }], ['consoleTable', 7.0, 10.68, PI], ['consoleTable', 31.6, 10.68, PI],
    ['pedestal', 0.6, 9.5, 0], ['pedestal', 33.4, 9.5, 0], ['fern', 14.6, 10.55, 0], ['fern', 20.0, 10.55, 0], ['rug', 17, 9.5, 0, { w: 31, d: 1.3, pat: 'runner' }],
    // ---- guest room
    ['bed', 0.62, 16.0, 0], ['sideTable', 0.4, 14.5, 0, { lamp: 1 }], ['chevalMirror', 6.2, 12.0, 0.5, { mirror: 1 }], ['trunk', 7.2, 18.6, PI], ['smallWardrobe', 8.62, 12.9, -HP, { hide: 1 }],
    ['chair', 3.0, 12.2, 0.3], ['rug', 4.2, 15.4, 0, { w: 3.6, d: 2.8, pat: 'persian2' }],
    // ---- dressing room (bolted)
    ['clothesRail', 9.42, 13.0, HP], ['clothesRail', 11.58, 17.1, -HP], ['hatbox', 11.55, 12.0, 0], ['stool', 10.4, 18.3, 0], ['chevalMirror', 9.5, 18.4, 0.6, { mirror: 1 }],
    // ---- landing
    ['stairwell', 13.5, 20, 0], ['stairs', 20.6, 20.5, 0], ['grandClock', 21.7, 11.6, -HP], ['fern', 12.5, 11.6, 0], ['rug', 17.05, 19.8, 0, { w: 3.2, d: 5.2, pat: 'persian2' }],
    // ---- playroom: five bells
    ['bellStand', 24.6, 16.9, PI, { bell: 0 }], ['bellStand', 26.6, 17.9, PI, { bell: 1 }], ['bellStand', 28.6, 18.25, PI, { bell: 2 }], ['bellStand', 30.9, 17.6, PI, { bell: 3 }], ['bellStand', 32.7, 16.6, PI, { bell: 4 }],
    ['dollhouse', 33.35, 12.6, -HP], ['rockingHorse', 23.6, 12.4, 0.4], ['toyChest', 24.9, 11.3, 0], ['blocks', 26.5, 14.2, 0.4], ['roundTable', 31.0, 14.3, 0, { small: 1 }],
    ['chair', 30.2, 14.3, HP], ['chair', 31.8, 14.3, -HP], ['rug', 28.6, 15.2, 0, { w: 3.4, d: 3.4, pat: 'round' }],
    // ---- sewing room (mannequins)
    ['mannequin', 3.4, 21.6, 0.3], ['mannequin', 5.6, 23.6, -0.4], ['mannequin', 8.6, 21.2, 0.8], ['sewingTable', 2.2, 25.6, PI], ['chair', 2.2, 24.7, PI],
    ['metalShelf', 11.65, 21.6, -HP], ['smallWardrobe', 0.42, 23.2, HP, { hide: 1 }], ['hatbox', 8.4, 25.5, 0], ['rug', 5.6, 22.8, 0, { w: 3, d: 2, pat: 'woven' }],
    // ---- servants' room
    ['bunk', 22.62, 22.1, 0], ['washbasin', 25.6, 19.35, 0], ['trunk', 27.6, 25.62, PI], ['metalShelf', 33.62, 23.2, -HP], ['chair', 29.2, 22.4, 0.5], ['smallTable', 30.2, 22.6, 0], ['bucket', 24.2, 25.4, 0], ['crate', 33.2, 25.3, 0.3],
    ['smallWardrobe', 26.6, 22.4, 0, { hide: 1 }],
  ],
  wall: [
    ['valve', 10.12, 1.25, HP, 0.85, {}], ['bolt', 10.65, 11.12, 0, 1.15, { door: 'closetD' }], ['wallMirror', 15.88, 2.2, -HP, 1.65, { mirror: 1 }],
  ],
  paint: [
    [20.4, 0.1, 0, 1.45, 'lady'],
    [7.0, 8.1, 0], [17.6, 8.1, 0], [26.8, 8.1, 0], [2.5, 10.9, PI], [8.5, 10.9, PI], [13.5, 10.9, PI], [21.0, 10.9, PI], [25.5, 10.9, PI], [31.5, 10.9, PI],
    [6.8, 7.9, PI], [4.5, 11.1, 0, 0.9], [0.1, 15.9, HP, 0.8], [21.9, 16.5, -HP, 1.1], [12.1, 14.0, HP], [33.9, 23.3, -HP, 0.8],
  ],
  lights: [
    ['chandelier', 4.6, 4.6, 2.7], ['pendant', 13, 4.2, 2.7], ['chandelier', 29.4, 2.4, 2.7], ['pendant', 4.4, 15.2, 2.7], ['chandelierBig', 17.05, 14.5, 2.8], ['chandelier', 28.4, 15, 2.7], ['bulb', 28.5, 22.6, 2.75],
    ['sconce', 2.0, 8.12, 1.9, 0], ['sconce', 9.4, 8.12, 1.9, 0], ['sconce', 15.6, 8.12, 1.9, 0], ['sconce', 24.4, 8.12, 1.9, 0], ['sconce', 32.0, 8.12, 1.9, 0],
    ['candles', 20.5, 5.4, 0.82, 0, 0],
  ],
  /* slot: [x, z, y, note, needFlag] */
  slots: {
    tub: [12.25, 1.0, 0.2, 'valve', 'drained'], studio: [20.3, 5.5, 0.82], closet: [10.4, 18.3, 0.62],
    library: [32.6, 6.2, 0.82], guest: [7.2, 18.6, 0.62], hall: [7.0, 10.68, 0.87], sewing: [2.5, 25.6, 0.8], serv: [27.6, 25.62, 0.62], play: [24.9, 11.3, 0.57],
  },
  start: [[13.0, 15.0], [14.3, 15.2]], startA: -HP,
  haunts: ['guest', 'sewing', 'library', 'play', 'serv', 'bath', 'studio', 'master'], evExclude: ['closet'],
  planItems: (right, others) => { const gated = shuffle(['closet', 'studio']), open = shuffle(['library', 'guest', 'hall', 'sewing', 'serv', 'play']); return [[right, gated[0]], [others[0], gated[1]], [others[1], open[0]], [others[2], open[1]], ['brass', 'tub']]; },
  inter: [
    { k: 'altar', x: 8.85, z: 3.6, role: 'S', label: '梳妆台' },
    { k: 'stairs', x: 20.6, z: 25.3, role: '*', to: 2, label: '登上阁楼' },
  ],
  gateAt: { x: 20.6, z: 24.65 },
  ritualEntry: [4.75, 8.9],
  bellDoor: 'studioD', bellMsg: '五声铃响叠在一起，久久不散……走廊那头传来“咔哒”一声——画室的门开了。',
  exitHint: '灵封碎了——去楼梯厅，登上阁楼',
  objectives(W) {
    const n = Object.keys(W.evFound).length, master = !W.doors[doorIdx('masterD')].locked;
    return [
      { t: '收集证据，确认怨灵种类（' + Math.min(n, 2) + '/2）', done: n >= 2 },
      { t: '找到它惧怕的遗物', done: rightItemHeld(W) || !W.f.seal },
      { t: '打开锁着的主卧', done: master },
      { t: '在主卧的梳妆台前举行仪式', done: !W.f.seal },
      { t: '一起登上通往阁楼的楼梯', done: W.phase !== 'play' },
    ];
  },
  hints(W) {
    const h = [];
    if (!W.f.drained) h.push('浴缸里的水又黑又浑。灵视者能看见水底有东西在发光；持灯者可以拧开浴缸边的放水阀（会发出很大的声音）。');
    if (!W.f.bells) h.push('画室的门和游戏室的五个铜铃有关。摇铃的顺序只有灵视者看得见——铃铛上方漂着数字。只有持灯者能摇铃，摇错要从头再来。');
    if (W.doors[doorIdx('closetD')].locked) h.push('衣帽间的门从里面闩上了。客房东墙上有一道裂缝——灵视者能从那里穿过去。');
    h.push('缝纫间里的人台……别背对着它们。');
    return h;
  },
};
