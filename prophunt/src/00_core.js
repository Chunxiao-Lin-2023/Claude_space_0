'use strict';
/* ================= core: utils, rng, balance ================= */
const QS = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem('prophunt.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('prophunt.' + k, JSON.stringify(v)); } catch (e) { } }
};
let G = null;          // shared round state (host authoritative; items are NOT in G, both sides rebuild them from G.seed)
let MAP = null;        // generated house for G.seed
let ME = 0;            // my player index
let NETROLE = null;    // 'solo' | 'host' | 'guest'
const STATE = { dgKey: [], puffs: [], tz: 1, tpan: [0, 0], mode: 'title', hover: null, sel: null, pend: null, ghostR: 0, form: null, t: 0, fx: [], ripples: [], pops: [], banner: null };

function mkRng(seed) { let s = seed | 0; return () => { let t = (s = (s + 0x6D2B79F5) | 0); t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let simR = mkRng(Date.now() | 0);           // host-only randomness (AI, whistle offset)
const rnd = () => simR(), rr = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];

/* ---------- balance (all tunables in one place) ---------- */
const BAL = {
  hideT: 30,          // realtime: seconds the hider gets while the seeker counts
  hideTSolo: 4,       // solo: the computer hides instantly
  seekT: 180,         // realtime: seek phase length (the last finalT seconds are the final phase)
  knockStart: 3,      // realtime: knock charges at the start of the seek phase
  knockMax: 5,        // realtime: charges cap
  knockRegen: 15,     // realtime: +1 charge every N seconds (wrong knocks only cost a charge, no loss)
  finalT: 20,         // realtime: final phase: hider makes a sound automatically ...
  finalWhistle: 5,    // ... every N seconds,
  finalKnocks: 3,     // ... and the seeker gets exactly this many knocks; all wrong = hider wins
  tauntCut: 15, tauntCD: 12,   // taunt: shortens the clock (never past the start of the final phase), cooldown
  reach: 2.3,         // seeker knock reach (m, to the object's footprint)
  copyReach: 2.2,     // hider can copy furniture within this distance
  knockCD: 0.7,
  spdSeek: 3.6, spdHide: 3.4, spdProp: 1.5,
  nearHint: 2.5,      // realtime: wrong knock this close to the hider gives a "something is near" hint
  whistleFuzz: 2.2,   // whistle ripple centre is offset up to this far from the hider
  turnWrong: 6,       // turn mode: wrong knocks allowed
  turnMove: 3,        // turn mode: hider may move / copy within this distance per turn
  placeT: 60, hideTurnT: 30,
  whistleTurns: 3,    // turn mode: every Nth seek turn the hider's room is revealed
  bands: [2.5, 5, 8]  // turn mode hint distances: 烫 / 热 / 温 / 冷
};
const BAND = [{ n: '烫', c: '#ff3b2f' }, { n: '热', c: '#ff9a2f' }, { n: '温', c: '#f2d34a' }, { n: '冷', c: '#5fb6ff' }];
const bandOf = d => d < BAL.bands[0] ? 0 : d < BAL.bands[1] ? 1 : d < BAL.bands[2] ? 2 : 3;
