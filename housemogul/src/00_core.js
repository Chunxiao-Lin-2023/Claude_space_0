'use strict';
/* ================= core: utils, rng, data tables ================= */
const QS = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const LS = {
  get(k, d) { try { const v = localStorage.getItem('housemogul.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('housemogul.' + k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem('housemogul.' + k); } catch (e) { } }
};
let G = null;          // shared game state (host authoritative, sent whole to guest)
let ME = 0;            // my player index
let NETROLE = null;    // 'solo' | 'host' | 'guest'
const STATE = { mode: 'title', sel: -1, tab: 'list', hover: -1, lastSeq: 0, sheet: false };

/* seeded rng: state lives in G.rs so the host's sim is reproducible from a save */
function rnd() { let t = (G.rs = (G.rs + 0x6D2B79F5) | 0); t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rr = (a, b) => a + (b - a) * rnd(), ri = (a, b) => Math.floor(rr(a, b + 1)), pick = a => a[Math.floor(rnd() * a.length)];
function gauss() { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }
function wpick(list) { let s = 0; for (const e of list) s += e.w; let r = rnd() * s; for (const e of list) { r -= e.w; if (r <= 0) return e; } return list[list.length - 1]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };

/* money is in 万元 */
function fmtM(v, sign) {
  const s = v < 0 ? '-' : sign && v > 0 ? '+' : ''; v = Math.abs(v);
  return s + '¥' + (v >= 10000 ? (v / 10000).toFixed(2) + '亿' : v >= 100 ? Math.round(v) + '万' : v >= 10 ? v.toFixed(1) + '万' : v.toFixed(2) + '万');
}
const pct = (v, d = 1) => (v >= 0 ? '+' : '') + (v * 100).toFixed(d) + '%';
const udc = v => v > 0.0005 ? 'up' : v < -0.0005 ? 'down' : '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- balance ---------- */
const BAL = {
  start: 80,            // starting cash
  maxMonth: 120,        // game ends after this many months
  buyFee: 0.02, sellFee: 0.03,
  down: 0.3,            // mortgage down payment
  rate0: 0.0045, rateMin: 0.0025, rateMax: 0.0080,   // monthly interest
  rent: 0.0034, upkeep: 0.0009,                       // per month, fraction of value
  inspect: [0.3, 0.004],                              // min cost, fraction of ask
  listTarget: [9, 13],
  mansion: [900, 1400],                               // mansion base price without / with mortgages
  forced: 0.85,                                       // forced sale price / value
  estNoise: 0.075,                                    // agent estimate sd
  demolish: 1.8,                                      // demolition compensation / value
  hist: 36
};
const KINDS = {
  bungalow: { n: '老平房', base: 42, w: 1, h: 1, fl: 1, roof: 'hip', col: '#d9b38a', rc: '#9a4a36' },
  walkup: { n: '老公房', base: 66, w: 1, h: 1, fl: 4, roof: 'flat', col: '#c9b6a2', rc: '#8a7d70' },
  townhouse: { n: '联排小楼', base: 98, w: 1, h: 1, fl: 2, roof: 'gable', col: '#e6d2b3', rc: '#7c3f30' },
  schoolflat: { n: '学区房', base: 112, w: 1, h: 1, fl: 5, roof: 'flat', col: '#e2cfb3', rc: '#9b8a76' },
  newflat: { n: '回迁新楼', base: 150, w: 1, h: 1, fl: 7, roof: 'flat', col: '#e8e3d6', rc: '#a9a395' },
  techflat: { n: '科技园公寓', base: 175, w: 2, h: 2, fl: 9, roof: 'flat', col: '#b9c7d4', rc: '#7d8a99', glass: 1 },
  riverflat: { n: '江景大平层', base: 255, w: 2, h: 2, fl: 11, roof: 'flat', col: '#c7dbe8', rc: '#86a0b4', glass: 1 },
  house: { n: '独栋洋房', base: 380, w: 2, h: 2, fl: 2, roof: 'hip', col: '#f0dfc2', rc: '#a5503a' },
  villa: { n: '半山别墅', base: 620, w: 2, h: 2, fl: 2, roof: 'hip', col: '#f7efe0', rc: '#3f5168' },
  mansion: { n: '终极豪宅', base: 900, w: 3, h: 3, fl: 3, roof: 'hip', col: '#fbf5e8', rc: '#2c3a50' }
};
const DISTS = [
  { k: 'old', n: '老城区', mu: 0.0006, vol: 0.020, beta: 0.8, grass: [126, 160, 88], col: '#e0a35a', hint: '房子便宜，涨得慢，可能拆迁' },
  { k: 'river', n: '江景区', mu: 0.0024, vol: 0.026, beta: 1.15, grass: [112, 166, 104], col: '#58a6d6', hint: '大平层，跟着楼市大起大落' },
  { k: 'school', n: '学府区', mu: 0.0034, vol: 0.016, beta: 0.65, grass: [128, 170, 92], col: '#e6c84f', hint: '学区房，稳步上涨' },
  { k: 'tech', n: '科技新区', mu: 0.0038, vol: 0.036, beta: 1.45, grass: [110, 152, 102], col: '#8e7fe6', hint: '涨得最快，跌得也最狠' },
  { k: 'sub', n: '城郊', mu: -0.0004, vol: 0.028, beta: 1.0, grass: [146, 172, 86], col: '#78c25a', hint: '最便宜，靠地铁和规划翻身' },
  { k: 'hill', n: '半山', mu: 0.0016, vol: 0.012, beta: 0.55, grass: [92, 146, 78], col: '#d77b9c', hint: '别墅区，终极豪宅在这里' }
];
const DI = Object.fromEntries(DISTS.map((d, i) => [d.k, i]));
const COND = [{ n: '破旧', m: 0.82 }, { n: '普通', m: 1 }, { n: '精装', m: 1.14 }];
const RENO = [{ c: 0.11, t: 1 }, { c: 0.095, t: 2 }];   // cost as fraction of current value, months
const QUAL = q => q < 0.93 ? ['有隐患', 'warn'] : q < 0.98 ? ['一般', ''] : q < 1.04 ? ['良好', ''] : ['很好', 'good'];
const PCOL = ['#ff9a3c', '#34d1bf', '#b48cff'];
const REG = { bull: { n: '牛市', d: 0.011 }, calm: { n: '平稳', d: 0.0015 }, bear: { n: '熊市', d: -0.0095 } };
const YEAR0 = 2026;
/* optional mechanics: 'pure' turns them all off */
const OPTS = [
  { k: 'loan', n: '按揭贷款', d: '首付 30% 加杠杆，付利息，现金为负会被强制卖房' },
  { k: 'rent', n: '房租与物业费', d: '持有的房每月收租、交物业费' },
  { k: 'reno', n: '装修', d: '花钱把破旧房装成普通、精装，提升房价' },
  { k: 'insp', n: '估价误差与验房', d: '中介估价有误差，花钱验房看真实价值' },
  { k: 'news', n: '新闻与传闻', d: '地铁、拆迁、加息等事件，传闻不一定成真' },
  { k: 'fee', n: '交易手续费', d: '买入 2%、卖出 3%' }
];
const PRESET = { pure: { loan: 0, rent: 0, reno: 0, insp: 0, news: 0, fee: 0 }, full: { loan: 1, rent: 1, reno: 1, insp: 1, news: 1, fee: 1 } };
const OP = k => !G || !G.opt || !!G.opt[k];
const monthLabel = m => '第 ' + (Math.floor(m / 12) + 1) + ' 年 ' + (m % 12 + 1) + ' 月';
