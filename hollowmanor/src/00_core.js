'use strict';
/* ================= core utils ================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const d2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
const dist = (ax, az, bx, bz) => Math.sqrt(d2(ax, az, bx, bz));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const smooth = t => t * t * (3 - 2 * t);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RNG = mulberry32(12345);
const rnd = () => RNG();
const rr = (a, b) => a + RNG() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = a => a[Math.floor(RNG() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const QS = new URLSearchParams(location.search);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || QS.get('touch') === '1';
const LS = { get(k, d) { try { const v = localStorage.getItem('hollowmanor.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('hollowmanor.' + k, JSON.stringify(v)); } catch (e) { } } };
const SET = Object.assign({ vol: 0.7, quality: 'high', shake: true, grain: true, name: '' }, LS.get('settings', {}));
const saveSet = () => LS.set('settings', SET);
let NETROLE = null; // 'host' | 'guest' | 'solo' (test only)
const HUB = /\/hollowmanor\/(index\.html)?$/.test(location.pathname);

/* ================= balance (all tunables in one place) ================= */
const BAL = {
  R: 0.28,                 // player collision radius
  walk: 2.5, run: 4.3, crawl: 0.75,
  stamMax: 5, stamRegen: 0.8,
  // flashlight
  beamRange: 11, beamHalf: 0.36,
  boostCost: 0.34, battRegen: 0.045, boostT: 0.35, stunT: 2.6, boostRange: 8.5,
  // fear (0..100)
  fearSep: 1.1, sepDist: 7.5, fearNear: -1.6, nearDist: 4,
  fearGhost: 4.5, ghostFearR: 6, fearHunt: 1.6, fearDark: 0.35, fearLit: -0.9, fearEvent: 9,
  // ghost
  gRoam: 1.25, gHunt: 3.15, gHuntSlow: 1.55, catchR: 0.75,
  huntCD: [52, 80], huntLen: [22, 30], warnT: 3.2, firstHunt: 95,
  loseSight: 4.5, hearRun: 9, hearWalk: 2.2,
  eventCD: [7, 16],
  stunsToBreak: 2,
  // downed / revive
  downT: 45, reviveT: 3,
  // interactions
  reach: 1.55,
  shelfT: 2.2, fuseT: 4, ritualT: 7, valveT: 3.5, boltT: 1.2, unbindT: 2.6, smashT: 3.0, finalT: 15, finalGuard: 5.5, lampR: 3.4, lampSlow: 0.55, leverT: 0.6, leverHold: 3.2, pickT: 0.45, dialT: 0.25,
  // ritual
  ritualHuntT: 9,
};
/* per-floor overrides live in FLOORS[i].bal; B(k) reads the current floor's value */
const B = k => (typeof MAP !== 'undefined' && MAP.F && MAP.F.bal && MAP.F.bal[k] != null) ? MAP.F.bal[k] : BAL[k];

/* ================= roles ================= */
const ROLES = {
  L: { k: 'L', name: '持灯者', who: '阿岩', color: '#ffcf6b', desc: '手电筒照亮真实世界。强光能让怨灵僵直；负责机关、保险丝、推动重物，并在仪式时守护灵视者。', skills: ['手电：照出霜痕与镜中影', '强光（右键 / F）：僵直怨灵，耗电', '机关：符文锁、保险丝、推书架'] },
  S: { k: 'S', name: '灵视者', who: '小雾', color: '#8fd3ff', desc: '看得见另一侧的世界：怨灵的位置（隔墙也能看到）、灵痕手印、灵球、隐藏的符文与暗门。负责解读线索并主持驱灵仪式。', skills: ['灵视：看见怨灵、灵痕与灵球', '读符文：只有你能看见密码', '仪式：在祭坛献上正确的遗物'] },
};

/* ================= evidence & ghost types ================= */
const EVID = {
  prints: { name: '灵痕手印', who: 'S', icon: '✋', desc: '墙上、门上泛着幽光的手印，只有灵视者看得见。' },
  orbs: { name: '灵球', who: 'S', icon: '◌', desc: '在房间里缓缓漂浮的光点，只有灵视者看得见。' },
  frost: { name: '霜痕', who: 'L', icon: '❄', desc: '地板和家具上的冰霜，只在手电光下显形。' },
  mirror: { name: '镜中影', who: 'L', icon: '◐', desc: '用手电照镜子，镜中会出现不属于这里的身影。' },
};
const GHOSTS = {
  bride: { name: '泣嫁', ev: ['prints', 'mirror'], item: 'ring', hue: 0x9fd8ff, desc: '未能出嫁的新娘。猎杀前会传来哭声。', quirk: 'wail' },
  child: { name: '顽童', ev: ['orbs', 'frost'], item: 'doll', hue: 0xbfffd8, desc: '在走廊里奔跑的孩子。喜欢乱扔东西，会咯咯地笑。', quirk: 'giggle' },
  keeper: { name: '守钟人', ev: ['prints', 'frost'], item: 'watch', hue: 0xffe6a8, desc: '老宅的管家。落地钟敲响时，它会开始猎杀。', quirk: 'clock' },
  faceless: { name: '无面者', ev: ['orbs', 'mirror'], item: 'salt', hue: 0xd8c8ff, desc: '没有脸的影子。脚步声几乎听不见。', quirk: 'silent' },
};
const ITEMS = {
  ring: { name: '旧婚戒', icon: '💍', desc: '内圈刻着一个名字，已经发黑。' },
  doll: { name: '布娃娃', icon: '🧸', desc: '缝补过很多次的布娃娃，少了一颗纽扣眼睛。' },
  watch: { name: '怀表', icon: '⏱', desc: '停在三点十七分的怀表。' },
  salt: { name: '圣盐', icon: '🧂', desc: '一小罐祝圣过的盐。' },
  fuse: { name: '保险丝', icon: '🔌', desc: '老式陶瓷保险丝，还能用。' },
  brass: { name: '黄铜钥匙', icon: '🗝', desc: '沉在浴缸底的钥匙，钥匙柄上刻着一朵玫瑰。' },
};
const RITUAL_ITEMS = ['ring', 'doll', 'watch', 'salt'];
/* the final floor's ghost: the lady of the house */
const BOSS = { name: '宅主 · 温夫人', ev: [], item: null, hue: 0xc8b0ff, desc: '这座宅子的女主人。所有怨灵都被她困在这里。她不怕任何遗物——只能毁掉她的镇物，再在法阵里念出她的名字。', quirk: 'boss' };
const GT = k => k === 'boss' ? BOSS : GHOSTS[k];
const ANCHORS = {
  hair: { name: '红绳缠发', desc: '一缕用红绳缠了七圈的长发' },
  nail: { name: '棺钉人偶', desc: '钉着一根棺材钉的草人' },
  shard: { name: '镜片牌位', desc: '嵌着碎镜片的小牌位' },
};
const GLYPHS = ['☾', '✶', '♆', '☥', '⚚', '◬'];

/* quick chat */
const QUICK = [
  { k: 'come', t: '过来！', c: '#8fd3ff' },
  { k: 'danger', t: '危险！快躲！', c: '#ff6b6b' },
  { k: 'wait', t: '等等我', c: '#ffd36b' },
  { k: 'found', t: '找到了！', c: '#9dff9d' },
];
