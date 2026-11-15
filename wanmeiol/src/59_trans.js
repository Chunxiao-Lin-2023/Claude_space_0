/* ================= 换地方的过场（RULES / OPTIMIZATIONS「过场」） =================
   点出口：黑幕淡入 → 地名浮出 → 在黑幕下换地方 → 淡出，约 1 秒。
   跨区域（石村 → 大荒 …）：远山一层层往后退，配一句路上的话，约 2.2 秒。
   自动寻路 / 地图点选：一张卡走完全程，小字随途经的地方变；跨区域那段换成远山。
   玉符传送：一圈光晕。
   点一下黑幕就跳过；设置里关掉动画就照旧瞬间到。联机时房主的过场会同步给队友。 */
const PTR_MS = { walk: [260, 440, 340], road: [380, 1300, 480], tp: [300, 900, 420], step: 430 };
const PTR_ROAD = {
  shicun: ['炊烟越来越近，能听见孩子们在村口喊。', '山路走熟了，脚自己就认得回家的方向。'],
  dahuang: ['山风里有兽吼，一声比一声远。', '古木遮天，太阳只漏下来几点。'],
  xushen: ['眼前一黑一亮，神魂轻得像一片羽毛。'],
  butian: ['云海翻上山门，钟声一下一下落进雾里。'],
  baiduan: ['断崖一座接一座，像被谁一刀刀劈开。'],
  shiguo: ['官道宽了，车马多了，城墙在天边露出一线。'],
  huoguo: ['空气烫起来，地面的石头都是红的。'],
  yiyu: ['天色变了，连风的味道都不一样。'],
  xianyu: ['仙光落在肩上，凉凉的，像露水。'],
  diluo: ['四周的光阴很乱，走一步，像过了一年。'],
  jiehai: ['脚下是看不见底的海，浪声从很远的地方传来。'],
  sanqian: ['界碑一块接一块，路的尽头是新的天地。'],
  xiangu: ['古地封了太久，连尘土都带着灵气。'],
  diguan: ['关墙高得看不见顶，墙上全是旧伤。'],
  jiutian: ['九天之上，风大得站不稳。'],
  baizu: ['边陲荒凉，走半天也碰不见一个人。'],
  shangjie: ['上界的天更高，灵气浓得像水。'] };
let ptrBusy = false, ptrSkip = false;
const ptrOn = () => animOn() && !(window.__dbg && !__dbg.trans);
const ptrK = () => ptrSkip ? 0 : SET.fast ? 0.55 : 1;
const ptrWait = (ms, stop) => new Promise(r => { const t0 = now(), tick = () => (ptrSkip || now() - t0 >= ms * ptrK() || (stop && stop())) ? r() : setTimeout(tick, 30); tick(); });
const ptrHalt = () => !ptrFree(); /* 剧情一开场就收幕，不挡对话 */
function ptrEl() { let e = $('ptr'); if (e) return e;
  e = el('div', ''); e.id = 'ptr'; e.innerHTML = '<div class="pt-hill"><i class="h3"></i><i class="h2"></i><i class="h1"></i></div><div class="pt-ring"></div><div class="pt-box"><div class="pt-t"></div><div class="pt-s"></div><div class="pt-n"></div></div>';
  e.onclick = () => { if (NETROLE !== 'guest') ptrSkip = true; }; document.body.appendChild(e); return e; }
/* 三个原子操作：open / set / close —— 房主每做一步就广播给队友 */
function ptrApply(a, o) { const e = ptrEl();
  if (a === 'close') { e.classList.add('out'); e.classList.remove('show'); setTimeout(() => { if (e.classList.contains('out')) e.className = ''; }, 360); return; }
  if (a === 'open') { e.className = 'on'; void e.offsetWidth; e.classList.add('in'); }
  if (o.kind) { e.classList.remove('k-walk', 'k-road', 'k-tp'); e.classList.add('k-' + o.kind); }
  if (o.tone) e.style.setProperty('--t0', o.tone[0]), e.style.setProperty('--t1', o.tone[1]), e.style.setProperty('--t2', o.tone[2]);
  if (o.t != null) e.querySelector('.pt-t').textContent = o.t; if (o.s != null) e.querySelector('.pt-s').textContent = o.s; if (o.n != null) e.querySelector('.pt-n').textContent = o.n;
  if (o.show) e.classList.add('show'); else if (o.show === false) e.classList.remove('show'); }
function ptrDo(a, o = {}) { ptrApply(a, o); if (NETROLE === 'host' && typeof netBroadcast === 'function') try { netBroadcast({ t: 'ptr', a, o }); } catch (e) { } }
function ptrInfo(to, kind) { const P = PLACES[to], A = AREAS[P.area] || AREAS.shicun;
  return { kind, tone: A.tone, t: P.name, s: A.name + (P.lv ? ` · ${P.lv[0]}-${P.lv[1]} 层` : '') + (isNight() ? ' · 夜' : ''), n: kind === 'road' ? pick(PTR_ROAD[P.area] || PTR_ROAD.dahuang) : kind === 'tp' ? '玉符一亮，眼前的景物像水面一样晃了晃。' : '' }; }
const ptrMove = (to, silent) => { go(to, silent); if (NETROLE === 'host' && typeof netSync === 'function') netSync(); }; /* 联机：每走一步都同步给队友 */
const ptrFree = () => !(STATE.battle || STATE.scene || STATE.dungeon || STATE.busy);
/* 一步：出口按钮 / 传送 */
async function ptrGo(to, kind) {
  if (ptrBusy || !PLACES[to] || !placeOpen(to)) return; if (!ptrOn() || !ptrFree()) return go(to);
  if (!kind) kind = PLACES[to].area !== PLACES[C.loc].area ? 'road' : 'walk'; const [a, b, c] = PTR_MS[kind];
  ptrBusy = true; ptrSkip = false; const o = ptrInfo(to, kind);
  try { ptrDo('open', { kind: o.kind, tone: o.tone, t: '', s: '', n: '' }); sfx(kind === 'tp' ? 'magic' : 'step'); await ptrWait(a);
    ptrMove(to); ptrDo('set', Object.assign(o, { show: true })); await ptrWait(b, ptrHalt); ptrDo('close'); await ptrWait(c); }
  finally { ptrBusy = false; ptrSkip = false; } }
function goT(to) { if (ptrBusy) return; if (!exitsOfHas(to)) return go(to); return ptrGo(to); }
const exitsOfHas = to => Object.values(exitsOf(C.loc)).includes(to);
/* 自动寻路：一张卡走完全程 */
{ const _aw = autoWalk; autoWalk = async function (to) {
  if (!ptrOn() || ptrBusy || !ptrFree() || !C || to === C.loc) return _aw(to); const path = route(C.loc, to); if (!path) { toast('那里还去不了'); return; }
  const id = walking = uid(); ptrBusy = true; ptrSkip = false; const D = PLACES[to], DA = AREAS[D.area] || AREAS.shicun;
  try { ptrDo('open', { kind: 'walk', tone: DA.tone, t: '前往 · ' + D.name, s: DA.name, n: '', show: true }); sfx('step'); await ptrWait(PTR_MS.walk[0]);
    for (let i = 1; i < path.length; i++) { const P = PLACES[path[i]], A = AREAS[P.area] || AREAS.shicun, cross = P.area !== PLACES[C.loc].area, last = i === path.length - 1;
      if (cross) { ptrDo('set', { kind: 'road', tone: A.tone, t: A.name, s: '前往 · ' + D.name, n: pick(PTR_ROAD[P.area] || PTR_ROAD.dahuang) }); sfx('step'); }
      else ptrDo('set', { kind: 'walk', tone: A.tone, t: last ? D.name : '前往 · ' + D.name, s: last ? ptrInfo(to, 'walk').s : '途经 · ' + P.name, n: '' });
      await ptrWait(cross ? PTR_MS.road[1] : PTR_MS.step); if (walking !== id || !ptrFree()) break; ptrMove(path[i], !last); if (!last) sfx('step'); }
    if (walking === id && C.loc === to) await ptrWait(PTR_MS.walk[1], ptrHalt); }
  finally { if (walking === id) walking = null; ptrDo('close'); ptrBusy = false; ptrSkip = false; } }; }
