/* 剧本杀 · 核心：工具、状态、存档、难度 */
const SCRIPTS = {};
const QS = new URLSearchParams(location.search);
const HUB = /\/jubensha\/(index\.html)?$/.test(location.pathname);
const ARTIFACT = !!window.__ARTIFACT__;
const LS = 'jbs-';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
function lsGet(k, d) { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { } }
function lsDel(k) { try { localStorage.removeItem(LS + k); } catch (e) { } }
/* 可复现的随机数（测试要确定） */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

const OPT = Object.assign({ anim: true, sound: true, autoAI: true, typing: true }, lsGet('opt', {}));
function saveOpt() { lsSet('opt', OPT); }

let G = null;          /* 共享状态（联机时由房主同步） */
let ME = { seat: 0 };  /* 本机：座位号；角色从 G.seats 里查 */
const S = () => SCRIPTS[G.sid];
const myRole = () => G && G.seats ? G.seats[ME.seat] : null;
const isHuman = r => G && G.seats && G.seats.includes(r);
const roleName = r => { const sc = G ? S() : SCRIPTS.renchiren; return r === 'zhao' ? sc.victim : r === 'deduce' ? '推论' : (sc.roles[r] || {}).name || r; };
const PHASES = [
  { id: 'read', name: '读本' },
  { id: 'intro', name: '自我介绍' },
  { id: 'r1', name: '第一轮 · 现场勘查' },
  { id: 'd1', name: '第一轮 · 讨论' },
  { id: 'r2', name: '第二轮 · 搜身搜屋' },
  { id: 'd2', name: '第二轮 · 讨论' },
  { id: 'final', name: '最终陈述' },
  { id: 'answer', name: '答卷与指认' },
  { id: 'reveal', name: '真相' }
];
const phaseIdx = id => PHASES.findIndex(p => p.id === id);
/* 难度：标准 = 第一版的数值 */
const DIFF = {
  easy: { name: '简单', desc: 'AI 多说话、多推理；提示不扣分；你有 7 点行动点。', budget: { d1: 10, d2: 16 }, ap: 7, aiAp: 2, hintCost: 0, rebut: false, frame: false, status: true },
  std: { name: '标准', desc: 'AI 凶手会反驳推论；用一次提示扣 3 分；6 点行动点。', budget: { d1: 8, d2: 12 }, ap: 6, aiAp: 2, hintCost: 3, rebut: true, frame: false, status: true },
  hard: { name: '困难', desc: 'AI 话少、凶手还会嫁祸；提示扣 6 分；5 点行动点；不显示嫌疑条。', budget: { d1: 6, d2: 8 }, ap: 5, aiAp: 2, hintCost: 6, rebut: true, frame: true, status: false }
};
const dif = g => DIFF[(g || G).diff] || DIFF.std;

function newGame(sid, mode, seats, diff) {
  const sc = SCRIPTS[sid];
  const g = {
    v: 2, sid, mode, diff: diff || 'std', gid: Math.random().toString(36).slice(2, 8), seats: seats.slice(), phase: 'read',
    pub: [], own: {}, taken: {}, ap: {}, aiAp: {}, brk: {}, log: [], used: {}, contraUsed: {}, contraAdd: {}, cut: {},
    evade: {}, evadeT: {}, prompts: [], ready: {}, answers: {}, votes: {}, verdict: null, confess: {}, aiN: { d1: 0, d2: 0 }, idleI: 0, acts: 0,
    asked: {}, lastAns: {}, saidV: {}, hints: {}, hintText: {}, wrong: {}, introStyle: {}, finalSaid: {}, status: {}, again: {},
    t0: Date.now(), pt0: Date.now(), seed: (Date.now() & 0xffff) || 7, nid: 1
  };
  for (const r of sc.suspects.concat(['det'])) { g.own[r] = []; g.brk[r] = {}; g.evade[r] = 0; g.evadeT[r] = {}; }
  return g;
}
function save() { if (!G || NET.role === 'guest') return; if (NET.role === 'host') G.room = NET.code; lsSet('save-' + G.sid, G); }
function loadSave(sid) { const g = lsGet('save-' + sid, null); return g && g.v === 2 ? g : null; }
