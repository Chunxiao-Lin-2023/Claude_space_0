/* 剧本杀 · 核心：工具、状态、存档 */
const SCRIPTS = {};
const QS = new URLSearchParams(location.search);
const HUB = /\/jubensha\/(index\.html)?$/.test(location.pathname);
const ARTIFACT = !!window.__ARTIFACT__;
const LS = 'jbs-';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const para = s => esc(s).split(/\n\n+/).map(p => '<p>' + p.replace(/\n/g, '<br>').replace(/【([^】]+)】/g, '<b class="hd">【$1】</b>') + '</p>').join('');
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
const roleName = r => r === 'zhao' ? S().victim : r === 'deduce' ? '推论' : (S().roles[r] || {}).name || r;
const PHASES = [
  { id: 'read', name: '读本', hint: '读完自己的剧本，记下时间线。' },
  { id: 'intro', name: '自我介绍', hint: '每个人先说说自己是谁。' },
  { id: 'r1', name: '第一轮 · 现场勘查', hint: '点平面图上的位置查看，线索全部公开。' },
  { id: 'd1', name: '第一轮 · 讨论', hint: '向任何人提问，或者出示线索。' },
  { id: 'r2', name: '第二轮 · 搜身搜屋', hint: '每查一条花 1 点行动点，不能搜自己。' },
  { id: 'd2', name: '第二轮 · 讨论', hint: '把证词和线索对起来，逼出隐瞒的人。' },
  { id: 'answer', name: '答卷与指认', hint: '答完八道题，第一题就是你的指认。' },
  { id: 'reveal', name: '真相', hint: '' }
];
const phaseIdx = id => PHASES.findIndex(p => p.id === id);
const AI_BUDGET = { d1: 8, d2: 12 };
const AP = { human: 6, ai: 2 };

function newGame(sid, mode, seats) {
  const sc = SCRIPTS[sid];
  const g = {
    v: 1, sid, mode, seats: seats.slice(), phase: 'read', pub: [], own: {}, taken: {}, ap: {}, brk: {}, log: [], used: {}, contraUsed: {}, contraAdd: {},
    evade: {}, evadeT: {}, prompts: [], ready: {}, answers: {}, votes: {}, verdict: null, confess: {}, aiN: { d1: 0, d2: 0 }, idleI: 0, acts: 0, seen: {},
    t0: Date.now(), pt0: Date.now(), seed: (Date.now() & 0xffff) || 7, nid: 1, asked: {}
  };
  for (const r of sc.suspects.concat(['det'])) { g.own[r] = []; g.brk[r] = {}; g.evade[r] = 0; g.evadeT[r] = {}; }
  return g;
}
function save() { if (!G || NET.role === 'guest') return; lsSet('save-' + G.sid, G); }
function loadSave(sid) { const g = lsGet('save-' + sid, null); return g && g.v === 1 ? g : null; }
