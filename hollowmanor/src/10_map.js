/* ================= floor layout, grid, collision, line of sight, pathfinding =================
   World: x → east, z → south, y up. 1 unit = 1 m. Grid cell = 0.5 m.
   Furniture "front" faces +z at r = 0; r rotates around y (r = π/2 → faces east). */
const PI = Math.PI, HP = PI / 2;
const MAP = {
  W: 34, H: 26, CS: 0.5, GW: 68, GH: 52, WALL_H: 3.0, WT: 0.2,
  rooms: [], cell: null, vE: null, hE: null, vD: null, hD: null,
  segs: [], doors: [], windows: [], furn: [], boxes: [], inter: [], lights: [], slots: {}, hides: [], mirrors: [], wallDecor: [],
};
const ROOMDEF = [
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
];
/* doors: dir 'h' = on the z = at line, spanning x a..b ; 'v' = on the x = at line, spanning z a..b */
const DOORDEF = [
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
];
/* exterior windows (spans on the outer wall) */
const WINDEF = [
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
];

/* furniture definitions: footprint w (x) × d (z) at r = 0, height h; col = solid; tall = blocks view (cutaway) */
const FDEF = {
  bookshelf: { w: 1.5, d: 0.42, h: 2.3, col: 1 }, bookshelfS: { w: 1.1, d: 0.42, h: 2.0, col: 1 },
  wardrobe: { w: 1.2, d: 0.62, h: 2.15, col: 1 }, smallWardrobe: { w: 1.0, d: 0.55, h: 1.8, col: 1 },
  sofa: { w: 2.2, d: 0.9, h: 0.95, col: 1 }, armchair: { w: 0.9, d: 0.85, h: 1.05, col: 1 },
  coffeeTable: { w: 1.2, d: 0.6, h: 0.45, col: 1 }, sideTable: { w: 0.5, d: 0.5, h: 0.65, col: 1 }, roundTable: { w: 0.9, d: 0.9, h: 0.75, col: 1 },
  fireplace: { w: 2.0, d: 0.6, h: 1.35, col: 1 }, grandPiano: { w: 1.5, d: 2.0, h: 1.0, col: 1 }, pianoBench: { w: 0.8, d: 0.38, h: 0.5, col: 1 },
  gramophone: { w: 0.55, d: 0.55, h: 1.25, col: 1 }, musicStand: { w: 0.5, d: 0.4, h: 1.3, col: 0 }, cello: { w: 0.5, d: 0.4, h: 1.3, col: 1 },
  desk: { w: 1.8, d: 0.9, h: 0.8, col: 1 }, chair: { w: 0.5, d: 0.5, h: 1.0, col: 1 }, globe: { w: 0.6, d: 0.6, h: 1.1, col: 1 },
  bed: { w: 0.95, d: 1.9, h: 0.9, col: 1 }, crib: { w: 0.7, d: 1.2, h: 1.0, col: 1 }, rockingHorse: { w: 0.4, d: 1.0, h: 0.8, col: 1 },
  toyChest: { w: 0.9, d: 0.5, h: 0.55, col: 1 }, blocks: { w: 0.8, d: 0.8, h: 0.2, col: 0 },
  diningTable: { w: 5.2, d: 1.4, h: 0.78, col: 1 }, chinaCabinet: { w: 1.6, d: 0.5, h: 2.2, col: 1 }, sideboard: { w: 2.2, d: 0.55, h: 0.95, col: 1 },
  counter: { w: 1.5, d: 0.65, h: 0.92, col: 1 }, sink: { w: 1.5, d: 0.65, h: 0.92, col: 1 }, stove: { w: 1.3, d: 0.75, h: 1.0, col: 1 },
  icebox: { w: 0.8, d: 0.7, h: 1.7, col: 1 }, jarShelf: { w: 1.6, d: 0.35, h: 2.0, col: 1 }, kitchenTable: { w: 1.6, d: 1.0, h: 0.78, col: 1 },
  stool: { w: 0.4, d: 0.4, h: 0.6, col: 1 }, barrel: { w: 0.6, d: 0.6, h: 0.95, col: 1 }, crate: { w: 0.7, d: 0.7, h: 0.6, col: 1 },
  boiler: { w: 1.1, d: 1.1, h: 2.2, col: 1 }, workbench: { w: 1.6, d: 0.7, h: 0.9, col: 1 }, metalShelf: { w: 1.4, d: 0.45, h: 2.0, col: 1 }, bucket: { w: 0.4, d: 0.4, h: 0.5, col: 0 },
  altar: { w: 2.2, d: 0.9, h: 1.05, col: 1 }, pew: { w: 2.6, d: 0.6, h: 1.0, col: 1 }, candleStand: { w: 0.4, d: 0.4, h: 1.5, col: 1 }, statue: { w: 0.7, d: 0.7, h: 2.1, col: 1 },
  grandClock: { w: 0.6, d: 0.45, h: 2.3, col: 1 }, centerTable: { w: 1.4, d: 1.4, h: 0.78, col: 1 }, coatRack: { w: 0.5, d: 0.5, h: 1.8, col: 1 },
  bench: { w: 1.4, d: 0.45, h: 0.5, col: 1 }, consoleTable: { w: 1.4, d: 0.42, h: 0.85, col: 1 }, fern: { w: 0.6, d: 0.6, h: 1.2, col: 1 },
  potTree: { w: 0.9, d: 0.9, h: 2.4, col: 1 }, potPlant: { w: 0.5, d: 0.5, h: 0.9, col: 1 }, planterBench: { w: 3.2, d: 0.8, h: 0.9, col: 1 },
  wickerChair: { w: 0.8, d: 0.8, h: 1.1, col: 1 }, pedestal: { w: 0.45, d: 0.45, h: 1.6, col: 1 }, chevalMirror: { w: 0.8, d: 0.45, h: 1.9, col: 1 },
  rug: { w: 1, d: 1, h: 0.01, col: 0 }, stairs: { w: 2.6, d: 8, h: 3, col: 1 }, umbrella: { w: 0.35, d: 0.35, h: 0.8, col: 1 }, wateringCan: { w: 0.4, d: 0.3, h: 0.3, col: 0 },
};
/* [kind, x, z, r, opts] — opts.room auto-filled */
const FURN = [
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
];
/* chairs around the dining table */
for (const x of [26.6, 27.9, 29.2, 30.5]) { FURN.push(['chair', x, 13.75, 0, { dining: 1 }]); FURN.push(['chair', x, 16.25, PI, { dining: 1 }]); }
FURN.push(['chair', 25.3, 15, HP, { dining: 1 }], ['chair', 31.7, 15, -HP, { dining: 1 }]);

/* wall-mounted things: [kind, x, z, r, y, opts] (r = facing direction like furniture) */
const WALLDEF = [
  ['mantelMirror', 6.5, 18.9, PI, 1.85, { mirror: 1 }], ['wallMirror', 21.9, 17.2, -HP, 1.55, { mirror: 1 }],
  ['lever', 2.2, 11.12, 0, 1.2, { lever: 0 }], ['lever', 32.6, 18.88, PI, 1.2, { lever: 1 }],
  ['fuseBox', 11.9, 22.6, -HP, 1.45, {}], ['runePanel', 21.45, 8.12, 0, 1.35, {}],
  ['dollShelf', 0.12, 20.1, HP, 1.6, {}], ['potRack', 28, 22.4, 0, 2.3, {}],
];
/* paintings */
const PAINTDEF = [
  [6.5, 8.1, 0], [13.8, 8.1, 0], [17.6, 8.1, 0], [23.6, 8.1, 0], [26.6, 8.1, 0], [31.6, 8.1, 0],
  [2.4, 10.9, PI], [12.5, 10.9, PI], [21.6, 10.9, PI], [31.0, 10.9, PI],
  [12.1, 21, HP, 1.4], [9.6, 11.1, 0], [28.5, 11.1, 0, 1.3], [33.9, 15, -HP], [20.0, 0.1, 0, 0.9], [0.1, 18, HP, 0.8],
];
/* light fixtures: [kind, x, z, y, room, powered] */
const LIGHTDEF = [
  ['chandelier', 12, 4.2, 2.7], ['chandelier', 20, 4.5, 2.7], ['chandelier', 6.5, 15.5, 2.7], ['chandelierBig', 17.6, 18, 2.8], ['chandelier', 28.5, 15, 2.7],
  ['pendant', 28, 22.4, 2.7], ['bulb', 9.5, 22.5, 2.75], ['pendant', 3.5, 22.6, 2.7],
  ['sconce', 2.0, 8.12, 1.9], ['sconce', 9.9, 8.12, 1.9], ['sconce', 15.7, 8.12, 1.9], ['sconce', 22.5, 8.12, 1.9], ['sconce', 27.4, 8.12, 1.9], ['sconce', 33.0, 8.12, 1.9],
  ['candles', 29, 1.4, 1.15, 0, 0], ['candleS', 27.2, 1.4, 1.55, 0, 0], ['candleS', 30.8, 1.4, 1.55, 0, 0], ['fire', 6.5, 18.55, 0.45, 0, 0],
];
/* spots an item can be placed on: id → [x, z, y, gate] */
const SLOTS = {
  cons: [4.6, 3.35, 0.93, 'power'], study: [20.6, 2.55, 0.82, 'rune'], util: [7.5, 22.0, 0.92, 'shelf'],
  music: [10.8, 3.0, 1.03], nursery: [5.6, 25.62, 0.57], kitchen: [28.3, 22.5, 0.8], dining: [30.9, 18.63, 0.97],
  parlor: [6.6, 16.6, 0.47], gallery: [10.2, 10.68, 0.87], foyer: [17.6, 18.9, 0.8],
};

/* ---------- build ---------- */
const cellIdx = (i, j) => i + j * MAP.GW;
function roomAtCell(i, j) { return i < 0 || j < 0 || i >= MAP.GW || j >= MAP.GH ? -1 : MAP.cell[cellIdx(i, j)]; }
function roomAt(x, z) { return roomAtCell(Math.floor(x / MAP.CS), Math.floor(z / MAP.CS)); }
const vIdx = (i, j) => i + j * (MAP.GW + 1);   // vertical edge at x = i*CS, row j
const hIdx = (i, j) => i + j * MAP.GW;         // horizontal edge at z = j*CS, column i
function buildMap() {
  const { GW, GH, CS } = MAP;
  MAP.rooms = ROOMDEF.map((r, i) => Object.assign({ idx: i, cx: (r.r[0] + r.r[2]) / 2, cz: (r.r[1] + r.r[3]) / 2 }, r));
  MAP.cell = new Int8Array(GW * GH).fill(-1);
  for (const r of MAP.rooms) for (let j = r.r[1] / CS; j < r.r[3] / CS; j++) for (let i = r.r[0] / CS; i < r.r[2] / CS; i++) MAP.cell[cellIdx(i, j)] = r.idx;
  MAP.vE = new Uint8Array((GW + 1) * GH); MAP.hE = new Uint8Array(GW * (GH + 1)); MAP.vD = new Int16Array((GW + 1) * GH).fill(-1); MAP.hD = new Int16Array(GW * (GH + 1)).fill(-1);
  for (let j = 0; j < GH; j++) for (let i = 0; i <= GW; i++) if (roomAtCell(i - 1, j) !== roomAtCell(i, j)) MAP.vE[vIdx(i, j)] = 1;
  for (let j = 0; j <= GH; j++) for (let i = 0; i < GW; i++) if (roomAtCell(i, j - 1) !== roomAtCell(i, j)) MAP.hE[hIdx(i, j)] = 1;
  // doors
  MAP.doors = DOORDEF.map((d, id) => {
    const o = Object.assign({ idx: id, open: d.kind === 'arch' ? 1 : 0, tgt: d.kind === 'arch' ? 1 : 0, locked: !!d.locked, w: d.b - d.a }, d);
    const at = Math.round(d.at / CS);
    for (let k = Math.round(d.a / CS); k < Math.round(d.b / CS); k++) {
      if (d.dir === 'h') { MAP.hE[hIdx(k, at)] = 3; MAP.hD[hIdx(k, at)] = id; } else { MAP.vE[vIdx(at, k)] = 3; MAP.vD[vIdx(at, k)] = id; }
    }
    if (d.dir === 'h') { o.cx = (d.a + d.b) / 2; o.cz = d.at; } else { o.cx = d.at; o.cz = (d.a + d.b) / 2; }
    // rooms on both sides
    o.rA = d.dir === 'h' ? roomAt(o.cx, o.cz - 0.25) : roomAt(o.cx - 0.25, o.cz);
    o.rB = d.dir === 'h' ? roomAt(o.cx, o.cz + 0.25) : roomAt(o.cx + 0.25, o.cz);
    return o;
  });
  // windows
  MAP.windows = WINDEF.map(([dir, at, a, b, kind]) => {
    const L = Math.round(at / CS);
    for (let k = Math.round(a / CS); k < Math.round(b / CS); k++) { if (dir === 'h') MAP.hE[hIdx(k, L)] = 2; else MAP.vE[vIdx(L, k)] = 2; }
    return { dir, at, a, b, kind: kind || 'normal', room: dir === 'h' ? roomAt((a + b) / 2, at === 0 ? 0.25 : at - 0.25) : roomAt(at === 0 ? 0.25 : at - 0.25, (a + b) / 2) };
  });
  // merged wall segments (code 1 only; windows and doors are rendered separately)
  MAP.segs = [];
  for (let j = 0; j <= GH; j++) { let s = -1; for (let i = 0; i <= GW; i++) { const c = i < GW ? MAP.hE[hIdx(i, j)] : 0; if (c === 1 && s < 0) s = i; if (c !== 1 && s >= 0) { MAP.segs.push({ dir: 'h', at: j * CS, a: s * CS, b: i * CS, ext: j === 0 || j === GH }); s = -1; } } }
  for (let i = 0; i <= GW; i++) { let s = -1; for (let j = 0; j <= GH; j++) { const c = j < GH ? MAP.vE[vIdx(i, j)] : 0; if (c === 1 && s < 0) s = j; if (c !== 1 && s >= 0) { MAP.segs.push({ dir: 'v', at: i * CS, a: s * CS, b: j * CS, ext: i === 0 || i === GW }); s = -1; } } }
  // collision boxes: walls + windows
  MAP.boxes = []; const T = MAP.WT / 2;
  const addSegBox = (dir, at, a, b, tag) => MAP.boxes.push(dir === 'h' ? { x0: a - (a === 0 ? T : 0), x1: b + (b === MAP.W ? T : 0), z0: at - T, z1: at + T, tag } : { x0: at - T, x1: at + T, z0: a, z1: b, tag });
  for (const s of MAP.segs) addSegBox(s.dir, s.at, s.a, s.b, 'wall');
  for (const w of MAP.windows) addSegBox(w.dir, w.at, w.a, w.b, 'win');
  // furniture
  MAP.furn = []; MAP.hides = []; MAP.mirrors = []; MAP.inter = [];
  FURN.forEach(([k, x, z, r, o], i) => {
    const def = FDEF[k]; if (!def) throw new Error('furn ' + k);
    const opts = Object.assign({}, o || {}); let w = opts.w || def.w, d = opts.d || def.d;
    const c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
    const shrink = (c > 0.02 && s > 0.02) ? 0.82 : 1;
    const hw = (w * c + d * s) / 2 * shrink, hd = (w * s + d * c) / 2 * shrink;
    const f = { id: i, k, x, z, r, o: opts, room: roomAt(x, z), w, d, h: def.h, hw, hd };
    MAP.furn.push(f);
    if (def.col) MAP.boxes.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, tag: k, f: i });
    if (opts.hide) { const hid = MAP.hides.length; MAP.hides.push({ id: hid, f: i, x, z, r, fx: x + Math.sin(r) * (d / 2 + 0.45), fz: z + Math.cos(r) * (d / 2 + 0.45) }); }
    if (opts.mirror) MAP.mirrors.push({ x, z, r, y: 1.15, room: f.room, kind: k, mw: 0.62, mh: 1.4 });
  });
  MAP.wallDecor = WALLDEF.map(([k, x, z, r, y, o]) => ({ k, x, z, r, y, o: o || {}, room: roomAt(x + Math.sin(r) * 0.3, z + Math.cos(r) * 0.3) }));
  for (const w of MAP.wallDecor) if (w.o.mirror) MAP.mirrors.push({ x: w.x, z: w.z, r: w.r, y: w.y, room: w.room, kind: w.k, mw: w.k === 'mantelMirror' ? 1.1 : 0.8, mh: w.k === 'mantelMirror' ? 0.8 : 1.1 });
  MAP.lights = LIGHTDEF.map(([k, x, z, y, a, p]) => ({ k, x, z, y, room: roomAt(x, z), powered: p !== 0, always: p === 0 }));
  MAP.slots = SLOTS;
  // spatial hash of boxes (2 m buckets)
  MAP.bk = new Map();
  MAP.boxes.forEach((b, bi) => { for (let gx = Math.floor(b.x0 / 2); gx <= Math.floor(b.x1 / 2); gx++) for (let gz = Math.floor(b.z0 / 2); gz <= Math.floor(b.z1 / 2); gz++) { const key = gx * 1000 + gz; if (!MAP.bk.has(key)) MAP.bk.set(key, []); MAP.bk.get(key).push(bi); } });
  buildInteractables();
}
/* door blocker box (closed / locked doors) */
function doorBox(d) { const T = 0.12; return d.dir === 'h' ? { x0: d.a, x1: d.b, z0: d.at - T, z1: d.at + T } : { x0: d.at - T, x1: d.at + T, z0: d.a, z1: d.b }; }
const doorSolid = (W, d) => d.kind !== 'arch' && (W.doors[d.idx].open < 0.55);

/* ---------- collision: circle vs boxes ---------- */
function pushOut(x, z, r, b) {
  const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1); let dx = x - cx, dz = z - cz; const dd = dx * dx + dz * dz;
  if (dd >= r * r) return null;
  if (dd > 1e-9) { const L = Math.sqrt(dd), k = (r - L) / L; return [dx * k, dz * k]; }
  // center inside box: push along smallest axis
  const l = x - b.x0 + r, rt = b.x1 - x + r, t = z - b.z0 + r, bt = b.z1 - z + r, m = Math.min(l, rt, t, bt);
  return m === l ? [-l, 0] : m === rt ? [rt, 0] : m === t ? [0, -t] : [0, bt];
}
/* moves (x,z) by (dx,dz) with collision; W = world state (doors). onDoor(d) called when bumping a closed unlocked door */
function moveCircle(x, z, dx, dz, r, W, onDoor) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12));
  for (let s = 0; s < steps; s++) {
    x += dx / steps; z += dz / steps;
    for (let it = 0; it < 3; it++) {
      let moved = false;
      const near = new Set();
      for (let gx = Math.floor((x - r) / 2); gx <= Math.floor((x + r) / 2); gx++) for (let gz = Math.floor((z - r) / 2); gz <= Math.floor((z + r) / 2); gz++) { const l = MAP.bk.get(gx * 1000 + gz); if (l) for (const bi of l) near.add(bi); }
      for (const bi of near) { const p = pushOut(x, z, r, MAP.boxes[bi]); if (p) { x += p[0]; z += p[1]; moved = true; } }
      for (const d of MAP.doors) {
        if (!doorSolid(W, d)) continue;
        if (Math.abs(x - d.cx) > d.w / 2 + 1 || Math.abs(z - d.cz) > d.w / 2 + 1) continue;
        const p = pushOut(x, z, r, doorBox(d)); if (p) { x += p[0]; z += p[1]; moved = true; if (onDoor) onDoor(d); }
      }
      if (!moved) break;
    }
  }
  return [clamp(x, 0.2, MAP.W - 0.2), clamp(z, 0.2, MAP.H - 0.2)];
}

/* ---------- line of sight across grid edges ---------- */
function edgeBlock(code, did, W, ghost) {
  if (code === 0) return false;
  if (code === 3) { const d = MAP.doors[did]; if (ghost) return false; return doorSolid(W, d); }
  return true;
}
function crossV(i, j, W, g) { return edgeBlock(MAP.vE[vIdx(i, j)], MAP.vD[vIdx(i, j)], W, g); }
function crossH(i, j, W, g) { return edgeBlock(MAP.hE[hIdx(i, j)], MAP.hD[hIdx(i, j)], W, g); }
function los(x0, z0, x1, z1, W, ghost) {
  const CS = MAP.CS, L = dist(x0, z0, x1, z1), n = Math.max(1, Math.ceil(L / 0.1));
  let ci = Math.floor(x0 / CS), cj = Math.floor(z0 / CS);
  for (let s = 1; s <= n; s++) {
    const x = x0 + (x1 - x0) * s / n, z = z0 + (z1 - z0) * s / n, ni = Math.floor(x / CS), nj = Math.floor(z / CS);
    if (ni !== ci) { if (crossV(Math.max(ci, ni), cj, W, ghost)) return false; ci = ni; }
    if (nj !== cj) { if (crossH(ci, Math.max(cj, nj), W, ghost)) return false; cj = nj; }
  }
  return true;
}
/* ---------- A* on the cell grid (ghost: passes doors, not walls) ---------- */
function pathFind(x0, z0, x1, z1) {
  const { GW, GH, CS } = MAP, s = cellIdx(clamp(Math.floor(x0 / CS), 0, GW - 1), clamp(Math.floor(z0 / CS), 0, GH - 1)), t = cellIdx(clamp(Math.floor(x1 / CS), 0, GW - 1), clamp(Math.floor(z1 / CS), 0, GH - 1));
  if (s === t) return [[x1, z1]];
  const g = new Float32Array(GW * GH).fill(1e9), from = new Int32Array(GW * GH).fill(-1), open = [s], inO = new Uint8Array(GW * GH), done = new Uint8Array(GW * GH);
  const tx = t % GW, tz = (t / GW) | 0, h = c => Math.abs(c % GW - tx) + Math.abs(((c / GW) | 0) - tz);
  g[s] = 0; inO[s] = 1; const f = new Float32Array(GW * GH).fill(1e9); f[s] = h(s);
  let it = 0;
  while (open.length && it++ < 6000) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
    const c = open[bi]; open[bi] = open[open.length - 1]; open.pop(); inO[c] = 0;
    if (c === t) break; done[c] = 1;
    const i = c % GW, j = (c / GW) | 0;
    const nb = [];
    if (i > 0 && MAP.vE[vIdx(i, j)] % 3 === 0 && MAP.cell[c - 1] >= 0) nb.push(c - 1);
    if (i < GW - 1 && MAP.vE[vIdx(i + 1, j)] % 3 === 0 && MAP.cell[c + 1] >= 0) nb.push(c + 1);
    if (j > 0 && MAP.hE[hIdx(i, j)] % 3 === 0 && MAP.cell[c - GW] >= 0) nb.push(c - GW);
    if (j < GH - 1 && MAP.hE[hIdx(i, j + 1)] % 3 === 0 && MAP.cell[c + GW] >= 0) nb.push(c + GW);
    for (const n of nb) { if (done[n]) continue; const ng = g[c] + 1; if (ng < g[n]) { g[n] = ng; from[n] = c; f[n] = ng + h(n); if (!inO[n]) { inO[n] = 1; open.push(n); } } }
  }
  if (from[t] < 0) return null;
  const cells = []; for (let c = t; c !== s && c >= 0; c = from[c]) cells.push(c); cells.reverse();
  const pts = cells.map(c => [(c % GW + 0.5) * CS, (((c / GW) | 0) + 0.5) * CS]); pts[pts.length - 1] = [x1, z1];
  // string pulling (ghost LOS)
  const out = []; let ax = x0, az = z0, k = 0;
  while (k < pts.length) { let far = k; for (let m = Math.min(pts.length - 1, k + 14); m > k; m--) if (los(ax, az, pts[m][0], pts[m][1], null, true)) { far = m; break; } out.push(pts[far]); ax = pts[far][0]; az = pts[far][1]; k = far + 1; }
  return out;
}
/* random free floor point inside a room (not inside furniture) */
function randomFloorIn(room, margin = 0.6, tries = 40) {
  const r = MAP.rooms[room].r;
  for (let t = 0; t < tries; t++) {
    const x = rr(r[0] + margin, r[2] - margin), z = rr(r[1] + margin, r[3] - margin);
    if (MAP.boxes.some(b => x > b.x0 - 0.3 && x < b.x1 + 0.3 && z > b.z0 - 0.3 && z < b.z1 + 0.3)) continue;
    return [x, z];
  }
  return [MAP.rooms[room].cx, MAP.rooms[room].cz];
}
/* random point on an interior wall face of a room (for handprints / rune writing): returns {x,z,r,y} */
function randomWallSpot(room, avoid = []) {
  const R = MAP.rooms[room].r, sides = shuffle([0, 1, 2, 3]);
  for (let t = 0; t < 40; t++) {
    const side = sides[t % 4], o = 0.11;
    let x, z, r;
    if (side === 0) { x = rr(R[0] + 0.8, R[2] - 0.8); z = R[1] + o; r = 0; }
    else if (side === 1) { x = rr(R[0] + 0.8, R[2] - 0.8); z = R[3] - o; r = PI; }
    else if (side === 2) { x = R[0] + o; z = rr(R[1] + 0.8, R[3] - 0.8); r = HP; }
    else { x = R[2] - o; z = rr(R[1] + 0.8, R[3] - 0.8); r = -HP; }
    // must be a solid wall there (not a door/window), and not hidden behind tall furniture
    const CS = MAP.CS;
    const code = side < 2 ? MAP.hE[hIdx(Math.floor(x / CS), Math.round((side === 0 ? R[1] : R[3]) / CS))] : MAP.vE[vIdx(Math.round((side === 2 ? R[0] : R[2]) / CS), Math.floor(z / CS))];
    if (code !== 1) continue;
    const nx = x + Math.sin(r) * 0.5, nz = z + Math.cos(r) * 0.5;
    if (MAP.boxes.some(b => b.tag !== 'wall' && b.tag !== 'win' && nx > b.x0 - 0.5 && nx < b.x1 + 0.5 && nz > b.z0 - 0.5 && nz < b.z1 + 0.5)) continue;
    if (avoid.some(a => dist(a.x, a.z, x, z) < 1.4)) continue;
    // also keep away from wall decorations / paintings
    if (PAINTDEF.some(p => dist(p[0], p[1], x, z) < 1.0) || MAP.wallDecor.some(w => dist(w.x, w.z, x, z) < 1.0) || MAP.lights.some(l => l.k === 'sconce' && dist(l.x, l.z, x, z) < 0.8)) continue;
    return { x, z, r, y: rr(0.9, 1.55) };
  }
  return null;
}

/* ---------- interactables ---------- */
function buildInteractables() {
  const I = MAP.inter = [];
  const add = o => { o.id = I.length; I.push(o); return o; };
  for (const h of MAP.hides) add({ k: 'hide', hid: h.id, x: h.fx, z: h.fz, role: '*', prompt: '躲进柜子' });
  MAP.wallDecor.forEach(w => {
    const fx = w.x + Math.sin(w.r) * 0.55, fz = w.z + Math.cos(w.r) * 0.55;
    if (w.k === 'lever') add({ k: 'lever', lv: w.o.lever, x: fx, z: fz, role: '*', prompt: '拉下拉杆' });
    if (w.k === 'fuseBox') add({ k: 'fuse', x: fx, z: fz, role: 'L', prompt: '装上保险丝', hold: BAL.fuseT });
    if (w.k === 'runePanel') add({ k: 'rune', x: fx, z: fz, role: 'L', prompt: '转动符文转盘' });
  });
  const sh = MAP.doors.find(d => d.kind === 'shelf');
  add({ k: 'shelf', x: sh.cx, z: sh.cz - 0.75, role: 'L', prompt: '推开书架', hold: BAL.shelfT });
  add({ k: 'altar', x: 29, z: 2.45, role: 'S', prompt: '主持驱灵仪式', hold: BAL.ritualT });
  add({ k: 'stairs', x: 13.5, z: 24.75, role: '*', prompt: '登上楼梯' });
  const fr = MAP.doors.find(d => d.kind === 'front');
  add({ k: 'front', x: fr.cx, z: fr.cz - 0.6, role: '*', prompt: '推推大门' });
  for (const d of MAP.doors) if (d.locked && d.kind !== 'shelf' && d.kind !== 'front') add({ k: 'locked', door: d.idx, x: d.cx + (d.dir === 'v' ? 0 : 0), z: d.cz + (d.dir === 'h' ? 0.55 : 0), role: '*', prompt: '查看' });
}
