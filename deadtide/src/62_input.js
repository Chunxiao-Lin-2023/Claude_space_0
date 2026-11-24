/* ================= input: keyboard + mouse, touch sticks & buttons, camera controls ================= */
const INP = { keys: {}, mx: 0, my: 0, mL: false, mR: false, mouseT: 0, touch: false, lastTouch: 0,
  move: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, tAim: { id: null, x: 0, y: 0 }, aim: { id: null, ox: 0, oy: 0, x: 0, y: 0, a: 0, t: 0, btn: false }, tp: {}, pinch: null, useHeld: false, bldT: 0, bldLast: '', paint: null, aimT: 0 };
const KD = k => !!INP.keys[k];
const inGame = () => STATE.mode === 'play' && W && !W.over;
const panelOpen = () => !$('bigmap').classList.contains('hidden') || !$('craft').classList.contains('hidden') || !$('kit').classList.contains('hidden') || !$('pause').classList.contains('hidden') || !$('help').classList.contains('hidden');
function act(a, v) {
  if (a === 'wpn' && W && W.p[ME] && W.p[ME].owned[v] && v !== W.p[ME].wpn && WPN[v].tag && !W.demo) { const n = (UI.wtip = UI.wtip || {})[v] = (UI.wtip[v] || 0) + 1; if (n <= 3) toast(WPN[v].name + ' · ' + WPN[v].tag); } // what each gun is for (first few times)
  const me = W && W.p[ME]; if (!me) return;
  if (a === 'wpn' && (me.down || !me.owned[v])) return;
  if (a === 'wpn' && v !== me.wpn) UI.prevW = me.wpn;                        // Z / the weapon menu can flip back to it
  if (NETROLE === 'guest') {
    netSendCtl({ t: 'act', a, v });
    if (a === 'wpn') { me.wpn = v; me.wpnLock = performance.now() + 700; sfx('swap'); }
    if (a === 'mode') me.build = !!v;
    if (a === 'reload' && me.mag[me.wpn] < magCap(me.wpn)) { sfx('reload'); me.reloadVis = WPN[me.wpn].reload; }
  } else doAct(me, a, v);
}
function toggleBuild(v) {
  const me = W.p[ME]; if (me.down || me.dead) return;
  UI.lastG = -1; const on = v == null ? !me.build : v; if (on && me.ride) { act('ride'); me.ride = false; } me.build = on; if (!on) me.demo = false; else me.sdir = screenUpDir();
  act('mode', on ? 1 : 0); uiBuildBar(); UI.keysK = ''; uiKeys(me); sfx('click');
}
function selBlock(id) { const me = W.p[ME]; me.sel = id; me.demo = false; uiBuildBar(); sfx('click'); }
function rotStairs() { const me = W.p[ME]; me.sdir = (me.sdir + 1) & 3; uiBuildBar(); sfx('click'); }
// (round 22) items: pick a slot (entering item mode); the same slot again switches to its next material / variant
function selItem(n) {
  const me = W.p[ME], g = ITEMS[n]; if (!g || me.down || me.dead) return;
  if (!me.build) toggleBuild(true);
  const cur = !me.demo && itemOf(me.sel) === g && UI.lastG === n, open = g.ids.filter(id => hasBP(id)), list = open.length ? open : g.ids, G = UI.gsel = UI.gsel || {};
  const id = cur && list.length > 1 ? list[(list.indexOf(me.sel) + 1) % list.length] : list.includes(G[g.k]) ? G[g.k] : list[0];
  G[g.k] = id; selBlock(id); UI.lastG = n; if (cur && list.length > 1) toast(g.name + '：' + B[id].name + ' · ' + costText(B[id].cost));
}
// (round 22) quick weapons: up to 4 picked in the 装备 panel (SET.quick), topped up with whatever else you own
function quickList(me) {
  const q = (SET.quick || []).filter((k, j, a) => k >= 0 && k < NW && me.owned[k] && a.indexOf(k) === j).slice(0, 4);
  for (let k = 0; k < NW && q.length < 4; k++) if (me.owned[k] && !q.includes(k)) q.push(k);
  return q;
}
function quickWpn(n) { const me = W.p[ME], q = quickList(me); if (q[n] == null) return; if (me.build) toggleBuild(false); act('wpn', q[n]); }
function nextQuick(d) { const me = W.p[ME], q = quickList(me); if (q.length < 2) return; let j = q.indexOf(me.wpn); j = j < 0 ? 0 : (j + d + q.length) % q.length; if (me.build) toggleBuild(false); act('wpn', q[j]); }
function swapLast() { const me = W.p[ME]; if (UI.prevW != null && me.owned[UI.prevW] && UI.prevW !== me.wpn) { if (me.build) toggleBuild(false); act('wpn', UI.prevW); } else nextQuick(1); }
// vehicles: T gets on your default one; Shift+T / a long press on 载具 picks another you own (and gets on it)
function rideKey(pick) {
  const me = W.p[ME], own = [1, 2, 3, 4, 5, 6].filter(v => (me.vehs || 0) >> v & 1);
  // (round 26) next to a teammate who is riding: their back seat comes first (T on PC, 载具 on touch); say so when their vehicle has none
  if (!me.ride && !(me.pass >= 0) && !pick) {
    if (pillionFor(me)) { act('ride'); return; }
    const near = W.p.find(d => d !== me && d.ride && !d.gone && Math.hypot(d.x - me.x, d.y - me.y) < 2.6);
    if (near && !vehSeats(near)) toast(near.name + ' 骑的' + VEH[near.veh].name + '没有后座（摩托车、装甲车才能带人）');
  }
  if (pick && own.length) { const j = own.indexOf(me.veh), v = own[(j + 1) % own.length]; act('ride', v); toast('载具：' + VEH[v].name + ' · ' + VEH[v].tag); return; }
  if (own.length || me.pass >= 0 || pillionFor(me)) act('ride'); else toast('还没有载具：在「商店 → 载具」里造（没解锁的要先用蓝图解锁），或者走到队友的摩托 / 装甲车边按 T 坐后座');
}
function cycleWpn(d) { const me = W.p[ME]; let w = me.wpn; for (let k = 0; k < NW; k++) { w = (w + d + NW) % NW; if (me.owned[w]) break; } if (w !== me.wpn) act('wpn', w); }
// (round 24) pick the grenade type (touch: the ring over the grenade key; PC: 5–8, Shift+G, or the wheel while holding G)
function setGren(t) { const me = W.p[ME]; if (!GREN[t]) return; me.gt = t; SET.gt = t; toast(GREN[t].name + ' ×' + gCount(me, t) + ' · ' + GREN[t].tag); sfx('swap'); }
function cycleGren(d) { const me = W.p[ME]; let t = me.gt || 0; for (let k = 0; k < 4; k++) { t = (t + d + 4) % 4; if (gCount(me, t) > 0) break; } setGren(t); }
// (round 23) the melee slot: knife or riot shield
function switchMelee(v) {
  const me = W.p[ME]; if (!me.shield) return; /* (round 36f) the knife is the only melee weapon now */
  const m = v != null ? v : me.melee === 1 ? 0 : 1; act('melee', m); me.melee = m; UI.meleeT = performance.now() + 600; toast(m ? '近战：防暴盾 · 推开前面一片丧尸、晕 1 秒，正面挨打少受一半' : '近战：刀 · 冲上去砍一只，背后砍双倍'); sfx('swap');
}
function doBash() {
  const me = W.p[ME]; if ((me.knCD || 0) > performance.now()) return;
  me.knCD = performance.now() + BAL.bashCD * 1000;
  let f = Math.hypot(me.inp.mx, me.inp.my) > 0.3 && INP.touch ? Math.atan2(me.inp.my, me.inp.mx) : me.aim;
  if (INP.touch) { let bd = BAL.bashR + 0.8; for (const z of W.zs) { if (z.hp <= 0 || z.hidden || Math.abs(z.z - me.z) > 0.9) continue; const d = Math.hypot(z.x - me.x, z.y - me.y); if (d < bd) { bd = d; f = Math.atan2(z.y - me.y, z.x - me.x); } } } // on touch: turn to the nearest one
  me.aim = f; INP.aimT = 0.3; me.knT = 0.3; act('knife', { a: +f.toFixed(3) });
}
// knife: find the zombie, turn to it, lunge into reach and slash; the host settles the damage
// (round 34b) vehicle ⇄ mech (1 s); the host says why not if it can't
function doXform(v) { const me = W.p[ME]; if (!me || !me.ride || me.down) return; if (me.mtr > 0) return; act('xform', v); sfx('swap'); }
// (round 37) X / the transform key: tap = one step on (vehicle → mech → beast when the 进化 meter is full; a beast turns back into the mech); hold in mech / beast = straight back to the vehicle
let XH = null;
function xPress() { const me = W.p[ME]; if (!me || !me.ride) return; if (me.mform !== 1) { doXform(); return; } if (XH) return;
  XH = { done: false }; XH.tm = setTimeout(() => { if (XH && !XH.done) { XH.done = true; doXform('veh'); } }, 450); }
function xRelease() { if (!XH) return; clearTimeout(XH.tm); if (!XH.done) doXform(); XH = null; }
function doKnife() {
  const me = W.p[ME]; if (!me || me.dead || me.down || me.build || me.ride || me.pass >= 0 || me.medT > 0 || me.jmp || (me.knCD || 0) > performance.now()) return;
  if (me.melee === 1 && me.shield) return doBash();
  me.knCD = performance.now() + BAL.knifeCD * 1000;
  const mv = Math.hypot(me.inp.mx, me.inp.my) > 0.3 && INP.touch ? Math.atan2(me.inp.my, me.inp.mx) : me.aim;
  const z = knifeTarget(me, mv);
  if (z) {
    const dx = z.x - me.x, dy = z.y - me.y, d = Math.hypot(dx, dy) || 1, go = clamp(d - (me.r + z.r + 0.12), 0, BAL.knifeLunge);
    me.aim = Math.atan2(dy, dx); me.aimPt = { x: z.x, y: z.y, z: z.z + z.h * 0.6, zb: z }; INP.aimT = 0.3;
    if (go > 0.05) me.dash = { t: 0, T: 0.06 + go * 0.07, dx: dx / d * go, dy: dy / d * go };
  }
  me.knT = 0.28; me.knZ = z; act('knife', z ? z.id : -1);
}
// jump: vault what's in front (or leap a gap), else a little hop. Direction = where you're walking, else where you aim
function doJump() {
  const me = W.p[ME]; if (!me || me.dead || me.down) return;
  let ax = me.inp.mx, ay = me.inp.my; if (Math.hypot(ax, ay) < 0.3) { ax = Math.cos(me.aim); ay = Math.sin(me.aim); }
  const dx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, dy = dx ? 0 : Math.sign(ay);
  startJump(me, dx, dy, true);
}
// camera controls (shared by keys and the HUD buttons)
function camRot(d) { CAM.rot = (CAM.rot + d + 4) % 4; sfx('click'); }
function camZoom(f) { CAM.zoom = clamp(CAM.zoom * f, 4, 22); SET.zoom = CAM.zoom; saveSet(); }
function viewStep(d) { if (!W) return; const me = W.p[ME]; if (VIEW.auto) { const base = me.build ? me.L : (cutBox() ? LCUT.L : topBuiltL()); VIEW.auto = false; VIEW.L = base; } VIEW.L = clamp(VIEW.L + d, 0, ML - 2); uiView(); sfx('click'); }
function topBuiltL() { let t = 0; for (let i = 0; i < NC; i++) if ((W.slab[i] && B[W.slab[i]].cost) || (W.blk[i] && B[W.blk[i]].cost)) t = Math.max(t, cl_(i)); return Math.min(ML - 2, t + 1); }
function viewAuto() { VIEW.auto = true; uiView(); sfx('click'); }
// default stairs direction: up the screen
function screenUpDir() { const [fx, fy] = camFwd(); let best = 0, bd = -2; DIRS.forEach(([dx, dy], k) => { const d = dx * fx + dy * fy; if (d > bd) { bd = d; best = k; } }); return best; }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  audioInit();
  if (k === 'Escape' && typeof bigMapOpen === 'function' && bigMapOpen()) { toggleBigMap(false); e.preventDefault(); return; }
  if ((k === 'Tab' || (k === 'm' && !e.ctrlKey && !e.metaKey)) && STATE.mode === 'play') { toggleBigMap(); e.preventDefault(); return; } // M or Tab: big map
  if (k === 'Escape') { if (PLAN || PREV) { cancelPlan(); e.preventDefault(); return; } if (STATE.mode === 'play') togglePause(); e.preventDefault(); return; }
  if (!INP.keys[k]) onKeyPress(k);
  INP.keys[k] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'PageUp', 'PageDown', 'Home'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; if (k === 'g' && INP.nadeAim && INP.nadeAim.pc) nadeRelease(); if (k === 'x') xRelease(); });
addEventListener('blur', () => { INP.keys = {}; INP.mL = INP.mR = false; });
function onKeyPress(k) {
  if (STATE.mode !== 'play' || !W) { if (k === 'Enter' && STATE.mode === 'title') $('soloBtn').click(); return; }
  if (k === 'q') return camRot(-1);
  if (k === 'e') return camRot(1);
  if (k === '=' || k === '+') return camZoom(0.85);
  if (k === '-') return camZoom(1 / 0.85);
  if (k === 'PageUp') return viewStep(1);
  if (k === 'PageDown') return viewStep(-1);
  if (k === 'Home') return viewAuto();
  if (k === 'h' && !$('help').classList.contains('hidden')) { closeHelp(); return; }
  if (panelOpen()) { if (k === 'f' || k === 'c') closeCraft(); if (k === 'i') closeKit(); return; }
  if (W.over) return;
  const me = W.p[ME];
  if (k === 'b') return toggleBuild();
  if (me.build) {
    const n = '123456789'.indexOf(k); if (n >= 0 && ITEMS[n]) return selItem(n);
    if (k === 'x') { me.demo = !me.demo; uiBuildBar(); return; }
    if (k === 'r') return selItem(ITEMS.indexOf(itemOf(me.sel)));
    if (k === 'z') return swapLast();
    if ((k === 'Enter' || k === ' ') && PLAN) return confirmPlan();
  } else { const n = '1234'.indexOf(k); if (n >= 0) return quickWpn(n); const gk = '5678'.indexOf(k); if (gk >= 0) return setGren(gk); if (k === 'r') return act('reload'); if (k === 'z') return swapLast(); }
  if (k === 'i') return openKit();
  if (k === 'x' && me.ride) { xPress(); return; } // (round 34b) driving: X = transform; (round 37) tap / hold
  if (k === 'x' && !me.build) return switchMelee();
  if (k === 'v') return doKnife();
  if (k === 'g') { if (KD('Shift') && !inMech(me)) return cycleGren(1); if ((gCount(me, me.gt || 0) > 0 || inMech(me)) && !me.down) INP.nadeAim = { pc: 1 }; else toast('没有' + GREN[me.gt || 0].name + '了：按 5–8 换别的手雷'); return; } // hold G: the landing ring follows the cursor; let go to throw
  if (k === 'h') return act('med');
  if (k === 'n') return toggleReady();
  if (k === 'c') return openCraft();
  if (k === 't') return rideKey(KD('Shift'));
  if (k === 'f' && (me.ride || me.pass >= 0) && !(me.ride && VEH[me.veh] && VEH[me.veh].search && useTarget(me))) { act('ride'); return; } // the cargo trike searches from the seat
  if (k === 'f') { if (nearBench(me) && !useTarget(me)) return openCraft(); if (INP.useLatch) INP.useLatch = null; else INP.useReq = true; }
}
function toggleReady() { const me = W.p[ME]; if (W.phase !== 'day') return; act('ready', me.ready ? 0 : 1); if (NETROLE === 'guest') me.ready = !me.ready; sfx('ready'); }
// mouse
CV.addEventListener('mousemove', e => { INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now(); });
CV.addEventListener('mousedown', e => {
  audioInit(); INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now();
  if (performance.now() - INP.lastTouch < 800) return;
  if (e.button === 0) { INP.mL = true; INP.clickT = performance.now(); INP.clickMag = null; } if (e.button === 2) INP.mR = true; INP.bldLast = '';
}); // (round 27b) a click is remembered until its shot goes out: a quick tap (trackpad, fast click) used to go down and up between two frames and fire nothing
addEventListener('mouseup', e => { if (e.button === 0) INP.mL = false; if (e.button === 2) INP.mR = false; });
CV.addEventListener('contextmenu', e => e.preventDefault());
CV.addEventListener('wheel', e => { if (STATE.mode !== 'play') return; e.preventDefault(); if (INP.nadeAim && INP.nadeAim.pc) { const n = Date.now(); if (n - (UI.whT || 0) > 120) { UI.whT = n; cycleGren(e.deltaY > 0 ? 1 : -1); } return; } camZoom(e.deltaY > 0 ? 1.1 : 1 / 1.1); }, { passive: false }); // holding G: the wheel picks the grenade

/* ---------- touch ---------- */
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { setTouch(true); INP.lastTouch = performance.now(); } }, true);
const stickL = document.getElementById('stickL'), stickR = document.getElementById('stickR');
function setTouch(on) { if (INP.touch === on) return; INP.touch = on; document.body.classList.toggle('touch', on); }
if (TOUCHY) setTouch(true); // phones / tablets start with the touch layout, before the first tap
function stickDraw(el, s, R) {
  if (s.id == null) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden'); el.style.left = s.ox + 'px'; el.style.top = s.oy + 'px'; if (R) el.style.setProperty('--R', R + 'px');
  const k = el.firstElementChild, m = Math.hypot(s.x, s.y), f = m > 1 ? 1 / m : 1;
  k.style.transform = `translate(${s.x * f * R}px,${s.y * f * R}px)`;
}
// where the move stick may appear: left part of the screen, below the top HUD cards
function moveZone(x, y) { return x < VW * (VH > VW ? 0.6 : 0.45) && y > Math.min(VH * 0.3, 150); }
let UIR = { t: -1, r: [] };
function nearUI(x, y) {
  const now = performance.now();
  if (now - UIR.t > 250) { UIR.t = now; UIR.r = [...document.querySelectorAll('#tctl button, #tFire, #hud button, #bbar, #viewBox')].map(el => el.getBoundingClientRect()).filter(r => r.width && r.height); }
  const m = 26; return UIR.r.some(r => x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m);
}
const STICK_R = () => Math.min(Math.min(VW, VH) >= 760 ? 80 : 64, Math.max(44, Math.min(VW, VH) * 0.09));
CV.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  audioInit(); e.preventDefault();
  if (!inGame()) return;
  const me = W.p[ME], now = performance.now();
  INP.tp[e.pointerId] = { x: e.clientX, y: e.clientY, t: now };
  // two fingers landing together on the map = pinch to zoom
  const others = Object.keys(INP.tp).filter(k => +k !== e.pointerId);
  if (!me.build && others.length === 1 && !INP.pinch) {
    const o = INP.tp[others[0]];
    if (now - o.t < 350 && Math.hypot(o.x - (o.x0 == null ? o.x : o.x0), o.y - (o.y0 == null ? o.y : o.y0)) < 24) {
      for (const s of [INP.move, INP.aim]) if (s.id === +others[0] && !s.btn) { s.id = null; s.x = s.y = 0; }
      if (INP.tAim.id === +others[0]) INP.tAim.id = null;
      stickDraw(stickL, INP.move); if (!INP.aim.btn) stickDraw(stickR, INP.aim);
      INP.pinch = { a: +others[0], b: e.pointerId, d0: Math.max(30, Math.hypot(o.x - e.clientX, o.y - e.clientY)), z0: CAM.zoom };
      try { CV.setPointerCapture(e.pointerId); } catch (_) { } return;
    }
  }
  if (INP.pinch) return;
  INP.tp[e.pointerId].x0 = e.clientX; INP.tp[e.pointerId].y0 = e.clientY;
  // a near-miss on a button must not pop a joystick or place a block
  if (nearUI(e.clientX, e.clientY)) { delete INP.tp[e.pointerId]; return; }
  if (moveZone(e.clientX, e.clientY) && INP.move.id == null) { const R = STICK_R(), m = R * 0.6; Object.assign(INP.move, { id: e.pointerId, ox: clamp(e.clientX, m, VW - m), oy: clamp(e.clientY, m, VH - m), x: 0, y: 0, t0: performance.now(), far: false, sx: e.clientX, sy: e.clientY }); INP.move.x = (e.clientX - INP.move.ox) / R; INP.move.y = (e.clientY - INP.move.oy) / R; stickDraw(stickL, INP.move, R); }
  else if (me.build) { INP.paint = e.pointerId; touchBuild(e.clientX, e.clientY, true); }
  else if (INP.tAim.id == null && e.clientX > VW * (VH > VW ? 0.4 : 0.3)) Object.assign(INP.tAim, { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: e.timeStamp, far: false }); // touch the map: aim / mark a zombie
  else return;
  try { CV.setPointerCapture(e.pointerId); } catch (_) { }
}, { passive: false });
CV.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch') return; e.preventDefault();
  const tp = INP.tp[e.pointerId]; if (tp) { tp.x = e.clientX; tp.y = e.clientY; }
  const P = INP.pinch;
  if (P && (e.pointerId === P.a || e.pointerId === P.b)) { const A = INP.tp[P.a], Bq = INP.tp[P.b]; if (A && Bq) { CAM.zoom = clamp(P.z0 * P.d0 / Math.max(20, Math.hypot(A.x - Bq.x, A.y - Bq.y)), 4, 22); SET.zoom = CAM.zoom; } return; }
  const R = STICK_R();
  for (const s of [INP.move, INP.aim]) if (s.id === e.pointerId) {
    let dx = e.clientX - s.ox, dy = e.clientY - s.oy; const dd = Math.hypot(dx, dy);
    // floating move stick: the base follows the thumb once it is dragged past the ring, so it never runs out of travel
    if (s === INP.move && dd > R * 1.15) { const k = (dd - R * 1.15) / dd; s.ox += dx * k; s.oy += dy * k; dx = e.clientX - s.ox; dy = e.clientY - s.oy; }
    s.x = dx / R; s.y = dy / R; if (Math.hypot(e.clientX - (s.sx == null ? s.ox : s.sx), e.clientY - (s.sy == null ? s.oy : s.sy)) > 14) s.far = true; stickDraw(s === INP.move ? stickL : stickR, s, R);
  }
  if (INP.aim.id === e.pointerId && Math.hypot(INP.aim.x, INP.aim.y) > 0.25) INP.aim.t = performance.now();
  if (INP.paint === e.pointerId && inGame() && W.p[ME].build) touchBuild(e.clientX, e.clientY, false);
  if (INP.tAim.id === e.pointerId) { INP.tAim.x = e.clientX; INP.tAim.y = e.clientY; if (Math.hypot(e.clientX - INP.tAim.sx, e.clientY - INP.tAim.sy) > 14) INP.tAim.far = true; }
}, { passive: false });
function endPtr(e) {
  if (e.pointerType !== 'touch') return;
  delete INP.tp[e.pointerId];
  if (INP.pinch && (e.pointerId === INP.pinch.a || e.pointerId === INP.pinch.b)) { INP.pinch = null; saveSet(); return; }
  if (INP.paint === e.pointerId) finishPaint();
  if (INP.move.id === e.pointerId && !INP.move.far && performance.now() - INP.move.t0 < 350 && inGame() && W.p[ME].build) { touchBuild(INP.move.ox, INP.move.oy, true); finishPaint(); }
  if (INP.move.id === e.pointerId) { INP.move.id = null; INP.move.x = INP.move.y = 0; stickDraw(stickL, INP.move); }
  if (INP.tAim.id === e.pointerId) {
    // lifting the finger off the map leaves a zombie MARKED, so the same thumb can then press fire:
    // a quick tap marks the zombie under / near it (tap empty ground to clear); after aiming, the zombie you were on stays marked
    INP.tAim.id = null; INP.aim.t = performance.now();
    if (inGame()) { const me = W.p[ME], tap = !INP.tAim.far && e.timeStamp - INP.tAim.t0 < 350;
      // tap a zombie once = select it (blue ring); tap the SAME zombie again = shoot it, and keep shooting until it drops (red ring);
      // tap another zombie = select that one instead; tap empty ground = stop and clear
      const m = INP.mark, onMark = tap && zAlive(m) && (() => { const q = w2s(m.x, m.y, m.z + m.h * 0.55); return Math.hypot(q[0] - e.clientX, q[1] - e.clientY) < 60; })();
      const z = onMark ? m : tap ? aimPick(e.clientX, e.clientY, 64).zb : me.aimPt && me.aimPt.zb;
      if (zAlive(z)) { if (tap && z === m) INP.atk = true; else { INP.mark = z; INP.atk = false; } INP.markT = performance.now(); } else if (tap) { INP.mark = null; INP.atk = false;
        if (inMech(me) && mechRanged(mechOf(me))) { const pt = aimPick(e.clientX, e.clientY, 0); if (pt) INP.gtap = { pt: { x: pt.x, y: pt.y, z: pt.z }, t: performance.now() }; } } } // (round 36j) 工蜂 / 苍隼 / 重炮: tap the ground = throw / fire right there
  }
  if (INP.aim.id === e.pointerId && !INP.aim.btn) { INP.aim.id = null; INP.aim.x = INP.aim.y = 0; INP.aim.t = performance.now(); stickDraw(stickR, INP.aim); }
}
/* fire stick: hold to shoot (auto-aims at the nearest zombie), drag to choose the direction */
// is the marked zombie still worth shooting at? (alive, about on your floor, in reach and in sight)
function markOK(me) {
  const z = INP.mark; if (!zAlive(z) || z.hidden || me.build || me.dead || me.down || Math.abs(z.L - me.L) > 1) return false;
  const d = Math.hypot(z.x - me.x, z.y - me.y); if (d > Math.max(10, (WPN[me.wpn] || WPN[0]).range + 4)) return false;
  const sh = shoulder(me); return d < 1.6 || los(sh[0], sh[1], sh[2], z.x, z.y, z.z + z.h * 0.62, LEAN);
}
const FIRE = document.getElementById('tFire');
function fireKnob() { const k = FIRE.firstElementChild, R = FIRE.clientWidth * 0.36, m = Math.hypot(INP.aim.x, INP.aim.y), f = m > 1 ? 1 / m : 1; k.style.transform = INP.aim.id != null && INP.aim.btn ? `translate(${INP.aim.x * f * R}px,${INP.aim.y * f * R}px)` : ''; }
FIRE.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation(); audioInit(); if (!inGame()) return;
  if (INP.aim.id != null && !INP.aim.btn) { INP.aim.id = null; stickDraw(stickR, INP.aim); }
  const r = FIRE.getBoundingClientRect();
  Object.assign(INP.aim, { id: e.pointerId, ox: r.left + r.width / 2, oy: r.top + r.height / 2, x: 0, y: 0, btn: true, t0: performance.now(), far0: false, fireOn: false });
  INP.aimT = 0; W.p[ME].aimPt = null; FIRE.classList.add('on'); fireKnob();
  try { FIRE.setPointerCapture(e.pointerId); } catch (_) { }
});
FIRE.addEventListener('pointermove', e => {
  if (INP.aim.id !== e.pointerId || !INP.aim.btn) return; e.preventDefault();
  const R = FIRE.clientWidth * 0.5; INP.aim.x = (e.clientX - INP.aim.ox) / R; INP.aim.y = (e.clientY - INP.aim.oy) / R;
  if (!INP.aim.fireOn && Math.hypot(e.clientX - INP.aim.ox, e.clientY - INP.aim.oy) > 14) INP.aim.far0 = true; // dragged before the long press: picking a target
  if (Math.hypot(INP.aim.x, INP.aim.y) > 0.3) INP.aim.t = performance.now(); fireKnob();
});
function fireEnd(e) {
  if (INP.aim.id !== e.pointerId || !INP.aim.btn) return;
  const A = INP.aim, now = performance.now();
  if (!A.fireOn && inGame()) {
    if (!A.far0 && now - A.t0 < 300) INP.tapT = 0.14;                                                       // quick tap: one shot
    else if (A.far0) { const z = W.p[ME].aimPt && W.p[ME].aimPt.zb; if (zAlive(z)) { INP.mark = z; INP.atk = false; INP.markT = now; } } // a drag picks the target; hold the button to shoot it
  }
  Object.assign(INP.aim, { id: null, x: 0, y: 0, btn: false, t: performance.now() }); FIRE.classList.remove('on'); fireKnob(); }
FIRE.addEventListener('pointerup', fireEnd); FIRE.addEventListener('pointercancel', fireEnd);
CV.addEventListener('pointerup', endPtr); CV.addEventListener('pointercancel', endPtr);
/* ---------- build targeting: the surface under the cursor / finger decides the cell (no layer switching) ---------- */
// point at the top of a wall -> stack on it; at a wall's side -> build next to it; at a floor -> build on it.
// Floors also try the ceiling above what you point at, and your own level (balconies out over the edge).
function pickBuild(sx, sy, me, demo) {
  const { o, d } = screenRay(sx, sy), maxL = Math.min(ML - 1, viewL(), LCUT ? LCUT.L : ML - 1);
  const top = (maxL + 1) * FH + 0.01; let t0 = 0; if (o[2] > top && d[2] < 0) t0 = (o[2] - top) / -d[2];
  const h = rayWorld(o[0] + d[0] * t0, o[1] + d[1] * t0, o[2] + d[2] * t0, d[0], d[1], d[2], 300, { maxL, any: true, hide: lcHide });
  if (h.x == null || !inMap(h.x, h.y)) return null;
  let surf = null, front;
  if (h.slab) { surf = { x: h.x, y: h.y, L: h.l, slab: 1 }; front = { x: h.x, y: h.y, L: h.l }; }
  else if (h.l < 0) front = { x: h.x, y: h.y, L: 0 };
  else {
    surf = { x: h.x, y: h.y, L: h.l };
    const b = W.blk[h.i];
    if (b === 23) front = { x: h.x, y: h.y, L: h.l };
    else if (h.face === 0) front = { x: h.x - (d[0] > 0 ? 1 : -1), y: h.y, L: h.l };
    else if (h.face === 1) front = { x: h.x, y: h.y - (d[1] > 0 ? 1 : -1), L: h.l };
    else front = { x: h.x, y: h.y, L: h.l + 1 };
  }
  if (demo) {
    if (!surf) return null;
    const i = ci(surf.x, surf.y, surf.L), b = surf.slab ? W.slab[i] : W.blk[i];
    return b && B[b].cost ? { x: surf.x, y: surf.y, L: surf.L, ok: true } : null;
  }
  const slab = !!B[me.sel].slab, cands = [];
  if (surf && !!surf.slab === slab) {
    const i = ci(surf.x, surf.y, surf.L), cur = slab ? W.slab[i] : W.blk[i];
    if (cur && B[cur].cost && (slab ? W.shp[i] : W.bhp[i]) < B[cur].hp * 0.98) cands.push({ x: surf.x, y: surf.y, L: surf.L });
  }
  cands.push(front);
  if (slab) { cands.push(buildPick(sx, sy, front.L + 1), buildPick(sx, sy, me.L), buildPick(sx, sy, me.L + 1)); }
  else if (front.L < me.L) cands.push(buildPick(sx, sy, me.L));
  for (const c of cands) if (c && inMap(c.x, c.y) && c.L >= 0 && c.L < ML && !buildWhy(me, c.x, c.y, c.L)) return Object.assign(c, { ok: true, why: '' });
  // (round 25) gear items snap to the nearest free tile around where you point (1–2 tiles), so a bush, a crate or a slope in the way doesn't stop you
  if (B[me.sel].any && !slab) {
    const hx = o[0] + d[0] * ((o[2] - front.L * FH) / -d[2] || 0), hy = o[1] + d[1] * ((o[2] - front.L * FH) / -d[2] || 0), best = [];
    for (let r = 1; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = front.x + dx, y = front.y + dy; if (!inMap(x, y)) continue;
      for (const L of [front.L, gAt(x, y)]) if (L >= 0 && L < ML && !buildWhy(me, x, y, L)) { best.push({ x, y, L, d: Math.hypot(x + 0.5 - hx, y + 0.5 - hy) }); break; } }
    if (best.length) { best.sort((a, b) => a.d - b.d); const c = best[0]; return { x: c.x, y: c.y, L: c.L, ok: true, why: '', snap: 1 }; }
  }
  return Object.assign(front, { ok: false, why: buildWhy(me, front.x, front.y, front.L) });
}
/* ---------- build plan: click / tap / drag makes a preview; confirm with the ✓ bar, Enter, or a second tap on it ---------- */
let PLAN = null, PREV = null;   // PREV: being drawn right now; PLAN: waiting for confirmation
function planHas(P, c) { return P && c && P.cells.some(q => q.x === c.x && q.y === c.y && q.L === c.L); }
function cancelPlan() { PLAN = null; PREV = null; INP.bA = null; uiPlan(); }
function confirmPlan() {
  const me = W.p[ME]; if (!PLAN || !me) return;
  PLAN.cells.forEach((c, k) => buildAt(me, c.x, c.y, c.L, PLAN.demo, k > 0));
  if (!PLAN.demo) me._swingT = 0.3; sfx(PLAN.demo ? 'demo' : 'click');
  PLAN = null; uiPlan();
}
function prevAdd(c, demo) {
  if (!PREV) PREV = { cells: [], demo, id: W.p[ME].sel, d: W.p[ME].sdir };
  if (!planHas(PREV, c) && PREV.cells.length < 40) PREV.cells.push({ x: c.x, y: c.y, L: c.L });
}
function finishPaint() {
  INP.paint = null;
  if (!SET.bconf || !PREV) { PREV = null; return; }
  const me = W.p[ME];
  // keep only what can actually be built / demolished
  PREV.cells = PREV.cells.filter(c => PREV.demo ? true : !buildWhy(me, c.x, c.y, c.L));
  PLAN = PREV.cells.length ? PREV : null; if (!PLAN && PREV.cells.length === 0 && BUILD_HOVER && BUILD_HOVER.why) { toast(BUILD_HOVER.why, '#ff8a7a'); sfx('deny'); }
  PREV = null; uiPlan();
}
function planCost() {
  if (!PLAN) return ''; const me = W.p[ME];
  if (PLAN.demo) return '拆掉 ' + PLAN.cells.length + ' 个';
  const B0 = B[PLAN.id], c = {}; for (const k in B0.cost) c[k] = B0.cost[k] * PLAN.cells.length;
  return '建 ' + PLAN.cells.length + ' 个' + B0.name + ' · ' + costText(c) + (affordable(W.res, c) ? '' : ' · 材料不够');
}
// one painting step (mouse held / finger down). Dragging builds a straight row on the first cell's floor.
function paintBuild(sx, sy, start, demo) {
  const me = W.p[ME]; if (!me || !me.build) return;
  if (start) {
    // tapping the waiting plan again confirms it; tapping elsewhere starts a new one
    if (PLAN) { const c = PLAN.demo ? pickBuild(sx, sy, me, true) : pickBuild(sx, sy, me, false); const q = c && buildPick(sx, sy, PLAN.cells[0].L); if (planHas(PLAN, c) || planHas(PLAN, q)) { confirmPlan(); INP.noPaint = true; return; } PLAN = null; uiPlan(); }
    INP.noPaint = false; PREV = null;
  }
  if (INP.noPaint) return;
  if (start) { INP.bA = null; INP.bAxis = null; INP.bPrev = null; INP.bldLast = ''; }
  if (!demo && INP.bA) {
    const A = INP.bA, q = buildPick(sx, sy, A.L); if (!q) return;
    if (!INP.bAxis && (q.x !== A.x || q.y !== A.y)) INP.bAxis = Math.abs(q.x - A.x) >= Math.abs(q.y - A.y) ? 'x' : 'y';
    const c = INP.bAxis === 'x' ? { x: q.x, y: A.y, L: A.L } : INP.bAxis === 'y' ? { x: A.x, y: q.y, L: A.L } : { x: A.x, y: A.y, L: A.L };
    const P = INP.bPrev || A, n = Math.abs(c.x - P.x) + Math.abs(c.y - P.y), sx_ = Math.sign(c.x - P.x), sy_ = Math.sign(c.y - P.y);
    for (let k = 1; k <= n; k++) { if (SET.bconf) prevAdd({ x: P.x + sx_ * k, y: P.y + sy_ * k, L: A.L }, false); else buildAt(me, P.x + sx_ * k, P.y + sy_ * k, A.L, false, true); }
    INP.bPrev = c;
    const why = buildWhy(me, c.x, c.y, c.L); BUILD_HOVER = Object.assign(c, { ok: !why, why, t: 1 });
    return;
  }
  const c = pickBuild(sx, sy, me, demo); if (!c) { BUILD_HOVER = null; return; }
  BUILD_HOVER = Object.assign(c, { t: 1 });
  const key = c.x + ',' + c.y + ',' + c.L; if (INP.bldLast === key) return; INP.bldLast = key;
  if (SET.bconf) prevAdd(c, demo); else buildAt(me, c.x, c.y, c.L, demo);
  if (!demo) { INP.bA = { x: c.x, y: c.y, L: c.L }; INP.bPrev = INP.bA; }
}
function touchBuild(sx, sy, start) { paintBuild(sx, sy, start, W.p[ME].demo); }
function buildWhy(me, x, y, L) {
  const i = inMap(x, y) && L >= 0 && L < ML ? ci(x, y, L) : -1;
  if (B[me.sel].stairs && i >= 0 && !W.blk[i]) me.sdir = ladderDir(x, y, L, me.sdir); // ladders turn to face the wall they hang on
  const slab = B[me.sel].slab, cur = i < 0 ? 0 : slab ? W.slab[i] : W.blk[i];
  if (cur && B[cur].cost) { // repair (only if damaged)
    if ((slab ? W.shp[i] : W.bhp[i]) >= B[cur].hp * 0.98) return slab ? '这里已经有楼板了' : '这里已经有东西了';
    return !inReach(me, x, y, L) ? '太远了' : '';
  }
  return canPlace(x, y, L, me.sel, me.sdir) || (!inReach(me, x, y, L) ? '太远了' : '') || (!affordable(W.res, B[me.sel].cost) ? '材料不足' : '');
}
function buildAt(me, x, y, L, demo, quiet) {
  if (!inMap(x, y) || L < 0 || L >= ML) return;
  if (demo) { const i = ci(x, y, L); if ((W.blk[i] && B[W.blk[i]].cost) || (W.slab[i] && B[W.slab[i]].cost)) act('demo', { x, y, l: L }); return; }
  const why = buildWhy(me, x, y, L);
  if (why) { if (!quiet && thr('denyL', 0.3)) { toast(why, '#ff8a7a'); sfx('deny'); } return; }
  act('build', { x, y, l: L, b: me.sel, d: me.sdir }); me._swingT = 0.3;
}
function bindBtn(id, down, up) {
  const el = document.getElementById(id); if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); el.classList.add('on'); down && down(); try { el.setPointerCapture(e.pointerId); } catch (_) { } });
  const end = () => { el.classList.remove('on'); up && up(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
bindBtn('tReload', () => inGame() && (W.p[ME].build ? rotStairs() : act('reload')));
// (round 22) the weapon key on the fire ring: tap = next quick weapon; drag (or hold) = a fan of every gun you own — slide onto one and let go
const WK = document.getElementById('tWpn');
function wpickItems(me) {
  const q = quickList(me), out = q.concat(WPN.map((w, k) => k).filter(k => me.owned[k] && !q.includes(k))).map(k => ({ k, t: WPN[k].sn || WPN[k].name, s: WPN[k].inf ? '∞' : String(me.mag[k] + me.ammo[k]), sel: k === me.wpn, q: q.includes(k) }));
  const w = WPN[me.wpn]; if (me.mag[me.wpn] < magCap(me.wpn) && (w.inf || me.ammo[me.wpn] > 0)) out.push({ k: 'rl', t: '换弹', s: '' });
  out.push({ k: 'kit', t: '装备', s: '' }); return out;
}
// (round 24) grenade types for the same kind of ring over the grenade key
function gpickItems(me) { return GREN.map((g, t) => ({ k: 'g' + t, t: g.sn, s: String(gCount(me, t)), sel: t === (me.gt || 0), q: gCount(me, t) > 0 })); }
function toggleWpick(force, kind) {
  const el = $('wpick'), open = force != null ? force : el.classList.contains('hidden'), g = kind === 'g', key = g ? document.getElementById('tNade') : WK;
  el.classList.toggle('hidden', !open); WK.classList.remove('on'); document.getElementById('tNade').classList.remove('on'); if (open) key.classList.add('on'); if (!open) { UI.wpHi = null; return; }
  // (round 23b) a small ring just above the key: short names, the one you're on at the bottom (nearest the thumb), 装备 in the middle (guns only)
  const me = W.p[ME], all = g ? gpickItems(me) : wpickItems(me), kit = all.find(it => it.k === 'kit'), items = all.filter(it => it.k !== 'kit'), wr = key.getBoundingClientRect();
  const big = VW >= 760 && VH >= 760, cs = big ? 56 : 48, n = items.length, R = Math.max(cs * 0.95, n * (cs + 6) / (2 * Math.PI)), kx = wr.left + wr.width / 2, kr = wr.width / 2;
  const cx = clamp(kx - 8, R + cs / 2 + 4, VW - R - cs / 2 - 4), cy = Math.max(R + cs / 2 + 4, wr.top - 6 - R - cs / 2);
  el.innerHTML = ''; UI.wpOpts = [];
  const put = (it, x, y, size, cls) => {
    const b = document.createElement('button'); b.className = 'wo' + (it.sel ? ' sel' : '') + (it.q ? ' q' : '') + (typeof it.k === 'string' ? ' x' : '') + (cls || '');
    b.innerHTML = '<b>' + it.t + '</b>' + (it.s ? '<span>' + it.s + '</span>' : ''); b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.width = b.style.height = size + 'px'; b.style.margin = (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px';
    b.addEventListener('pointerup', e => { e.stopPropagation(); e.preventDefault(); wpickDo(it.k); });
    el.appendChild(b); UI.wpOpts.push({ b, x, y, k: it.k, w: size, h: size });
  };
  const j0 = Math.max(0, items.findIndex(it => it.sel));
  items.forEach((it, j) => { const a = Math.PI / 2 + ((j - j0 + n) % n) / n * Math.PI * 2; put(it, cx + Math.cos(a) * R, cy + Math.sin(a) * R, cs); });
  if (kit) put(kit, cx, cy, Math.round(cs * 0.82), ' mid');
}
function wpickDo(k) { toggleWpick(false); if (!inGame()) return; sfx('click'); if (/^g\d$/.test(k)) setGren(+k[1]); else if (k === 'rl') act('reload'); else if (k === 'kit') openKit(); else if (k === 'melee') switchMelee(); else { const me = W.p[ME]; if (me.build) toggleBuild(false); act('wpn', k); } }
function wpickHover(x, y) { let best = null, bd = 1e9; for (const o of UI.wpOpts || []) { if (Math.abs(o.x - x) > o.w / 2 + 3 || Math.abs(o.y - y) > o.h / 2 + 3) continue; const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } } for (const o of UI.wpOpts || []) o.b.classList.toggle('hi', o === best); UI.wpHi = best; }
WK.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation(); audioInit(); if (!inGame()) return;
  const was = !$('wpick').classList.contains('hidden'); if (was) { toggleWpick(false); return; }
  UI.wk = { id: e.pointerId, x: e.clientX, y: e.clientY, open: false, tm: setTimeout(() => { if (UI.wk && !UI.wk.open) { UI.wk.open = true; toggleWpick(true); } }, 380) };
  WK.classList.add('on'); try { WK.setPointerCapture(e.pointerId); } catch (_) { }
});
WK.addEventListener('pointermove', e => {
  const k = UI.wk; if (!k || k.id !== e.pointerId) return; e.preventDefault();
  if (!k.open && Math.hypot(e.clientX - k.x, e.clientY - k.y) > 16) { k.open = true; toggleWpick(true); }
  if (k.open) wpickHover(e.clientX, e.clientY);
});
function wkEnd(e) {
  const k = UI.wk; if (!k || k.id !== e.pointerId) return; clearTimeout(k.tm); UI.wk = null;
  if (!k.open) { WK.classList.remove('on'); if (inGame()) nextQuick(1); return; }                              // a tap: next quick weapon
  if (UI.wpHi) wpickDo(UI.wpHi.k);                                                                           // slid onto one and let go
  else if (Math.hypot(e.clientX - k.x, e.clientY - k.y) > 16) toggleWpick(false);                            // dragged off into nothing: cancel
  // held without moving: the fan stays open, tap a gun
}
WK.addEventListener('pointerup', wkEnd); WK.addEventListener('pointercancel', wkEnd);
document.addEventListener('pointerdown', e => { const el = $('wpick'), nk = document.getElementById('tNade'); if (el && !el.classList.contains('hidden') && !el.contains(e.target) && e.target !== WK && !WK.contains(e.target) && e.target !== nk && !nk.contains(e.target)) toggleWpick(false); }, true);
// vehicle key: tap = on / off your default; hold = pick another vehicle you own
(() => {
  const el = document.getElementById('tRide'); let st = null;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); if (!inGame()) return; el.classList.add('on'); st = { t: setTimeout(() => { st.long = true; rideKey(true); }, 450) }; });
  const end = () => { el.classList.remove('on'); if (!st) return; clearTimeout(st.t); if (!st.long && inGame()) rideKey(false); st = null; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
bindBtn('tLUp', () => viewStep(1)); bindBtn('tLDn', () => viewStep(-1));
bindBtn('vToggle', () => { document.body.classList.toggle('vopen'); $('vToggle').classList.toggle('on', document.body.classList.contains('vopen')); sfx('click'); });
bindBtn('tShove', () => { if (!inGame()) return; if (W.p[ME].ride) return xPress(); INP.knHeld = true; doKnife(); }, () => { INP.knHeld = false; xRelease(); }); // (round 34b) driving: this key is 变形
// (round 23b) swipe off the melee key (any direction) = swap knife <-> shield
(() => {
  const el = document.getElementById('tShove'); let st = null;
  el.addEventListener('pointerdown', e => { st = { id: e.pointerId, x: e.clientX, y: e.clientY, done: false }; try { el.setPointerCapture(e.pointerId); } catch (_) { } });
  el.addEventListener('pointermove', e => { if (!st || st.id !== e.pointerId || st.done || !inGame()) return; if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 26 && W.p[ME].shield) { st.done = true; INP.knHeld = false; switchMelee(); } });
  const end = e => { if (st && st.id === e.pointerId) st = null; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
bindBtn('bcOk', () => confirmPlan()); bindBtn('bcNo', () => cancelPlan());
// (round 23) grenade key: tap = throw at the biggest bunch in range; drag = put the landing ring where you want (drag back to the middle to cancel)
(() => {
  const el = document.getElementById('tNade');
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); if (!inGame()) return; const me = W.p[ME];
    if (!$('wpick').classList.contains('hidden')) { toggleWpick(false); return; }
    const r = el.getBoundingClientRect(); UI.gk = { id: e.pointerId, x: e.clientX, y: e.clientY, ring: false, tm: setTimeout(() => { const k = UI.gk; if (k && !k.ring && !(INP.nadeAim && INP.nadeAim.drag)) { k.ring = true; INP.nadeAim = null; INP.nadePt = null; toggleWpick(true, 'g'); } }, 380) };
    if ((gCount(me, me.gt || 0) > 0 || inMech(me)) && !me.down) INP.nadeAim = { id: e.pointerId, ox: r.left + r.width / 2, oy: r.top + r.height / 2, dx: 0, dy: 0, drag: false, t: me.gt || 0 };
    el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (_) { } });
  el.addEventListener('pointermove', e => { const k = UI.gk; if (k && k.id === e.pointerId && k.ring) { e.preventDefault(); wpickHover(e.clientX, e.clientY); return; }
    const A = INP.nadeAim; if (!A || A.id !== e.pointerId) return; e.preventDefault(); A.dx = e.clientX - A.ox; A.dy = e.clientY - A.oy; if (Math.hypot(A.dx, A.dy) > 16) A.drag = true; });
  const end = e => {
    const k = UI.gk; if (k && k.id === e.pointerId) { clearTimeout(k.tm); UI.gk = null; if (k.ring) { el.classList.remove('on'); if (UI.wpHi) wpickDo(UI.wpHi.k); else if (Math.hypot(e.clientX - k.x, e.clientY - k.y) > 16) toggleWpick(false); return; } }
    el.classList.remove('on'); const A = INP.nadeAim; const me = W.p[ME];
    if (!A || A.id !== e.pointerId) { if (inGame()) toast('没有' + GREN[me.gt || 0].name + '了：按住手雷键换别的，或去商店 → 道具'); return; }
    if (A.drag && Math.hypot(A.dx, A.dy) < 16) { INP.nadeAim = null; INP.nadePt = null; toast('取消扔手雷'); return; } nadeRelease(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', e => { INP.nadeAim = null; INP.nadePt = null; if (UI.gk) clearTimeout(UI.gk.tm); UI.gk = null; el.classList.remove('on'); });
})();
// where the grenade would land right now (null = nothing worth it)
function nadeAimPt(me) {
  const A = INP.nadeAim; if (!A) return null; const R = BAL.nadeRange;
  if (A.pc) { const pt = me.aimPt; if (!pt) return null; const d = Math.hypot(pt.x - me.x, pt.y - me.y), k = d > R ? R / d : 1; return { x: me.x + (pt.x - me.x) * k, y: me.y + (pt.y - me.y) * k, z: k < 1 ? null : pt.z }; }
  if (A.drag) { const [fx, fy] = camFwd(), [rx, ry] = camRight(), len = Math.hypot(A.dx, A.dy), t = clamp((len - 16) / 90, 0, 1), dist = 2 + t * (R - 2), ux = A.dx / len, uy = A.dy / len;
    const wx = rx * ux - fx * uy, wy = ry * ux - fy * uy, wl = Math.hypot(wx, wy) || 1; return { x: me.x + wx / wl * dist, y: me.y + wy / wl * dist, z: null }; }
  return nadeAuto(me);
}
// the auto pick: the spot (on a zombie in range and in sight) that catches the most of them, not too close to you
function nadeAuto(me) {
  const zs = W.zs.filter(z => z.hp > 0 && !z.hidden && !z.sleep && zSeen(z) && Math.abs(z.z - me.z) < 3 && Math.hypot(z.x - me.x, z.y - me.y) < BAL.nadeRange && Math.hypot(z.x - me.x, z.y - me.y) > 2.6 && los(me.x, me.y, me.z + 1.2, z.x, z.y, z.z + 0.8, 0));
  let best = null, bs = 0;
  for (const c of zs) { let s = 0; for (const z of zs) { const d = Math.hypot(z.x - c.x, z.y - c.y); if (d < BAL.nadeR) s += 1 - d / BAL.nadeR * 0.5; } if (s > bs) { bs = s; best = c; } }
  return best ? { x: best.x, y: best.y, z: best.z, n: bs } : null;
}
function nadeRelease() {
  const me = W.p[ME], pt = inGame() ? nadeAimPt(me) : null; INP.nadeAim = null; INP.nadePt = null; if (!inGame() || me.down) return;
  const t = me.gt || 0; if (gCount(me, t) <= 0 && !inMech(me)) return; // (round 34) in a mech this is the skill
  if (pt) act('nade', { x: +pt.x.toFixed(2), y: +pt.y.toFixed(2), z: pt.z != null ? +pt.z.toFixed(2) : null, t }); else act('nade', { t });
}
bindBtn('tMed', () => { if (!inGame()) return; const me = W.p[ME]; if (me.meds <= 0) toast('没有医疗包了（搜补给、或商店 → 道具）'); else if (!me.down && me.hp >= me.maxHp) toast('血是满的'); else act('med'); });
// the context key on the fire ring: search / revive / gather when there's something, get off when riding, otherwise heal with a medkit
bindBtn('tUse', () => { if (!inGame()) return; const me = W.p[ME], ut = useTarget(me); if (ut && !(me.ride && !(VEH[me.veh] && VEH[me.veh].search))) { if (INP.useLatch) INP.useLatch = null; else INP.useReq = true; } else if (me.ride || me.pass >= 0) act('ride'); else toast('附近没有能交互的东西'); }); // (round 23c) the medkit is its own key (left of this one), so this never uses it
bindBtn('tBuild', () => inGame() && toggleBuild());
bindBtn('tHelp', () => { document.body.classList.toggle('guide'); sfx('click'); });
document.addEventListener('pointerdown', e => { if (document.body.classList.contains('guide') && e.target.id !== 'tHelp') document.body.classList.remove('guide'); }, true);
bindBtn('tCraft', () => inGame() && openCraft());
bindBtn('vZin', () => camZoom(0.8)); bindBtn('vZout', () => camZoom(1.25));
bindBtn('vRl', () => camRot(-1)); bindBtn('vRr', () => camRot(1));
bindBtn('vUp', () => viewStep(1)); bindBtn('vDn', () => viewStep(-1)); bindBtn('vAuto', () => viewAuto());

/* ---------- per-frame: fold devices into the local player's input ---------- */
// touch auto-aim: best zombie in range and in sight; `any` = whole circle (fire button held), else a ~22° cone along the drag.
// Close zombies (< 2.5) win, and the current target is kept unless another is clearly better, so the aim doesn't flicker.
const zAlive = z => z && z.hp > 0 && W.zs.includes(z);
function touchAutoAim(me, dirx, diry, any, cur) {
  const [sx, sy, sz] = shoulder(me); let best = null, bs = 1e9, cs = 1e9;
  const AS = assistLv(), wi = me.down ? 0 : me.wpn, range = WPN[wi].range * AS.range, a0 = Math.atan2(diry, dirx), vl = viewL();
  if (!AS.range) return { x: sx + dirx * 6, y: sy + diry * 6, z: sz, auto: 1 };
  for (const z of W.zs) {
    if (z.hp <= 0 || z.L > vl || lcHide(Math.floor(z.x), Math.floor(z.y), z.L)) continue;
    const dx = z.x - sx, dy = z.y - sy, d = Math.hypot(dx, dy); if (d > range || d < 0.2) continue;
    const da = Math.abs(angDiff(a0, Math.atan2(dy, dx))); if (!any && da > 0.38) continue;
    const score = (any ? d + da * 1.5 : d + da * 12) - (d < 2.5 ? 2.5 : 0);
    if ((score < bs || z === cur) && los(sx, sy, sz, z.x, z.y, z.z + z.h * 0.6, LEAN)) { if (z === cur) cs = score; if (score < bs) { bs = score; best = z; } }
  }
  if (cur && cs < 1e9 && cs <= bs * 1.35 + 0.6) best = cur;
  if (best) return { x: best.x, y: best.y, z: best.z + best.h * 0.6, zb: best, auto: 1 }; /* (round 36k) auto: picked by the touch auto-aim, not by hand — a mech's ranged shot then uses the smart aim */
  return { x: sx + dirx * 6, y: sy + diry * 6, z: sz, auto: 1 };
}
// keep the aim point glued to a locked zombie between re-picks
function trackAim(me) { const z = me.aimPt && me.aimPt.zb; if (!z) return; if (!zAlive(z)) { INP.aimT = 0; return; } me.aimPt.x = z.x; me.aimPt.y = z.y; me.aimPt.z = z.z + z.h * 0.6; }
// desktop reticle: its circle is the weapon's real spread at that distance; red = on a zombie, yellow = headshot, dashed = out of range
const FINGER_UP = 64; // the finger aims at a point this far above itself, so it never hides the target
function drawReticle(me, pt, show, px0, py0) {
  const el = $('reticle'); if (!el) return;
  document.body.classList.toggle('aiming', !!show); el.classList.toggle('hidden', !show); if (!show) return;
  if (!pt) { el.classList.add('hidden'); return; }
  const wi = me.down ? 0 : me.wpn, w = WPN[wi], [sx, sy, sz] = shoulder(me), dist = Math.hypot(pt.x - sx, pt.y - sy, pt.z - sz);
  const sp = w.spread * (me.down ? 1.6 : 1) * (1 + (w.bloom ? me.bloom || 0 : 0)), half = VH > VW ? clamp(CAM.zoom, 4, 22) * 1.25 : clamp(CAM.zoom, 4, 22);
  const px = clamp(2 * Math.tan(sp) * Math.min(dist, w.range) * VH / (2 * half), 12, 170);
  const c = el.children[0]; c.style.width = c.style.height = px + 'px';
  el.style.transform = `translate(${px0 != null ? px0 : INP.mx}px,${py0 != null ? py0 : INP.my}px)`;
  const rl = me.reloadT > 0 ? 1 - me.reloadT / WPN[me.reloadW != null ? me.reloadW : wi].reload : me.reloadVis > 0 ? 1 - me.reloadVis / w.reload : 0;
  el.children[1].style.display = rl > 0 ? '' : 'none'; el.children[1].style.setProperty('--p', (rl * 100).toFixed(0) + '%');
  const lock = !!pt.zb, head = lock && pt.head && !w.flame && !w.gl;
  el.classList.toggle('lock', lock && !head); el.classList.toggle('head', head); el.classList.toggle('far', Math.hypot(pt.x - sx, pt.y - sy) > w.range);
  $('rtTag').textContent = rl > 0 ? '换弹' : me.mag[wi] === 0 ? '没子弹 R' : head ? '爆头' : (INP.touch && px0 != null ? '按射击开火' : '');
}
function readInput(dt) {
  const me = W.p[ME], I = me.inp, blocked = panelOpen() || W.over || STATE.paused;
  const [fx, fy] = camFwd(), [rx, ry] = camRight();
  INP.nadePt = INP.nadeAim && !blocked ? nadeAimPt(me) : null;                              // (round 23) grenade landing ring
  let sx = 0, sy = 0;
  if (!blocked) {
    sx = (KD('d') || KD('ArrowRight') ? 1 : 0) - (KD('a') || KD('ArrowLeft') ? 1 : 0);
    sy = (KD('w') || KD('ArrowUp') ? 1 : 0) - (KD('s') || KD('ArrowDown') ? 1 : 0);
    const mv = INP.move.id != null ? INP.move : null;
    const mm = mv ? Math.hypot(mv.x, mv.y) : 0;
    if (mm > 0.12) { const m = Math.min(1, (mm - 0.12) / 0.55), a = Math.atan2(-mv.y, mv.x); sx = Math.cos(a) * m; sy = Math.sin(a) * m; }
  }
  I.mx = rx * sx + fx * sy; I.my = ry * sx + fy * sy;
  // touch: snap to the grid axes when close, so walking along a wall or through a doorway stays straight
  if (INP.move.id != null && (I.mx || I.my)) {
    const m = Math.hypot(I.mx, I.my), a = Math.atan2(I.my, I.mx), q = Math.round(a / (Math.PI / 2)) * Math.PI / 2;
    if (Math.abs(a - q) < 0.2) { I.mx = Math.cos(q) * m; I.my = Math.sin(q) * m; }
  }
  // one tap starts a search / chop / revive and it carries on by itself; walking away or finishing ends it
  const ut = W.p[ME] && !blocked ? useTarget(W.p[ME]) : null, uk = ut ? ut.k + ':' + ut.i : '';
  if (INP.useReq) { INP.useLatch = uk || null; INP.useReq = false; }
  if (INP.useLatch && (INP.useLatch !== uk || Math.hypot(I.mx, I.my) > 0.3 || W.p[ME].down)) INP.useLatch = null;
  I.use = !blocked && (KD('f') || INP.useHeld || INP.useLatch) ? 1 : 0;
  const usingMouse = !INP.touch || (performance.now() - INP.mouseT < 1500 && performance.now() - INP.lastTouch > 1500);
  if (usingMouse) {
    if (INP.touch && performance.now() - INP.mouseT < 300) setTouch(false);
    const pt = DBG && DBG.aimAt ? DBG.aimAt() : aimPick(INP.mx, INP.my);
    me.aimPt = pt; me.aim = Math.atan2(pt.y - me.y, pt.x - me.x);
    drawReticle(me, pt, !blocked && !me.build && !me.dead);
    CAM.lookX = lerp(CAM.lookX || 0, clamp((pt.x - me.x) * 0.18, -3, 3), Math.min(1, dt * 3)); CAM.lookY = lerp(CAM.lookY || 0, clamp((pt.y - me.y) * 0.18, -3, 3), Math.min(1, dt * 3));
    const mg = me.mag[me.down ? 0 : me.wpn]; if (INP.clickT && INP.clickMag == null) INP.clickMag = mg;
    if (INP.clickT && (performance.now() - INP.clickT > 400 || mg !== INP.clickMag)) INP.clickT = 0; /* the buffered click is spent once the magazine count changes (shot or reload) */
    I.fire = !blocked && (INP.mL || INP.clickT) && !me.build ? 1 : 0;
    if (me.build && !blocked) {
      const down = INP.mL || INP.mR, demo = INP.mR || me.demo;
      if (down) paintBuild(INP.mx, INP.my, !INP.bDown, demo);
      else { if (INP.bDown) finishPaint(); const c = pickBuild(INP.mx, INP.my, me, me.demo); BUILD_HOVER = c; }
      INP.bDown = down;
    } else { BUILD_HOVER = null; INP.bDown = false; if (!me.build && (PLAN || PREV)) cancelPlan(); }
  } else {
    const A = INP.aim, held = A.id != null, active = held && Math.hypot(A.x, A.y) > 0.3, fing = INP.tAim.id != null && !me.build;
    if (held && A.btn && !A.fireOn && !A.far0 && performance.now() - A.t0 > 300) A.fireOn = true;            // long press: keep firing, dragging now steers
    INP.tapT = Math.max(0, (INP.tapT || 0) - dt); const tap = INP.tapT > 0, burst = held && A.btn && A.fireOn;
    const mk = !fing && !active && markOK(me) ? INP.mark : null; if (!mk && INP.mark && !markOK(me)) { INP.mark = null; INP.atk = false; }
    const fpy = INP.tAim.y - FINGER_UP;
    if (fing) { const pt = aimPick(INP.tAim.x, fpy, assistLv().mag ? 50 : 0); me.aimPt = pt; me.aim = Math.atan2(pt.y - me.y, pt.x - me.x); }
    else if (active) {
      const a = Math.atan2(-A.y, A.x), wx = rx * Math.cos(a) + fx * Math.sin(a), wy = ry * Math.cos(a) + fy * Math.sin(a);
      trackAim(me); INP.aimT -= dt; if (INP.aimT <= 0 || !me.aimPt) { INP.aimT = 0.1; me.aimPt = touchAutoAim(me, wx, wy, false, me.aimPt && me.aimPt.zb); }
      me.aim = Math.atan2(me.aimPt.y - me.y, me.aimPt.x - me.x);
    } else if (mk) {
      // a marked zombie: face it, and the fire button shoots it (picked by hand, so no lock-on delay and normal spread)
      me.aimPt = { x: mk.x, y: mk.y, z: mk.z + mk.h * 0.62, zb: mk }; me.aim = Math.atan2(mk.y - me.y, mk.x - me.x);
    } else if ((held && A.btn) || tap) {
      // just holding the fire button (or a quick tap): lock on to the nearest zombie, otherwise shoot where you face
      trackAim(me); INP.aimT -= dt; if (INP.aimT <= 0 || !me.aimPt) { INP.aimT = 0.12; const f = Math.hypot(I.mx, I.my) > 0.2 ? [I.mx, I.my] : [Math.cos(me.aim), Math.sin(me.aim)]; me.aimPt = touchAutoAim(me, f[0], f[1], true, me.aimPt && me.aimPt.zb); }
      me.aim = Math.atan2(me.aimPt.y - me.y, me.aimPt.x - me.x);
    } else if (performance.now() - A.t > 600 && Math.hypot(I.mx, I.my) > 0.2) { me.aim = Math.atan2(I.my, I.mx); me.aimPt = null; }
    const gt = INP.gtap && performance.now() - INP.gtap.t < 250 ? INP.gtap.pt : null; if (gt) { me.aimPt = gt; me.aim = Math.atan2(gt.y - me.y, gt.x - me.x); }
    drawReticle(me, me.aimPt, fing && !blocked && !me.build && !me.dead, INP.tAim.x, fpy);
    // auto-aim (fire button without a finger on the map): a new target takes a moment to lock on, and the shots are looser
    const auto = !fing && !mk && (active || (held && A.btn) || tap), AS = assistLv(), lz = auto && me.aimPt && me.aimPt.zb;
    if (lz !== INP.lockZ) { INP.lockZ = lz || null; INP.lockT = 0; } else INP.lockT = (INP.lockT || 0) + dt;
    INP.lockAcq = lz && AS.acq ? Math.min(1, INP.lockT / AS.acq) : 1;
    I.auto = auto && lz ? AS.spread : 0;
    I.fire = !blocked && ((fing && held && A.btn) || (mk && (burst || tap || INP.atk)) || (auto && (tap || (burst && INP.lockAcq >= 1))) || gt) && !me.build ? 1 : 0; if (gt && I.fire) INP.gtap = null;
    INP.markShow = mk; INP.atkShow = mk && INP.atk;
    CAM.lookX = lerp(CAM.lookX || 0, Math.cos(me.aim) * 1.5, Math.min(1, dt * 2)); CAM.lookY = lerp(CAM.lookY || 0, Math.sin(me.aim) * 1.5, Math.min(1, dt * 2));
    if (!me.build || !BUILD_HOVER || !BUILD_HOVER.t) BUILD_HOVER = me.build ? BUILD_HOVER : null;
  }
  if (blocked) I.fire = 0;
  if (!blocked && !me.build && (KD('v') || INP.knHeld || (usingMouse && INP.mR))) doKnife(); // right mouse button / V / the 刀 button; hold to keep slashing
  if (me.knT > 0 && zAlive(me.knZ)) me.aim = Math.atan2(me.knZ.y - me.y, me.knZ.x - me.x); // face what you're cutting
  INP.lockShow = !blocked && !me.build && !me.dead && me.aimPt && zAlive(me.aimPt.zb) && (usingMouse || I.fire || INP.tAim.id != null || INP.aim.id != null || (INP.markShow && me.aimPt.zb === INP.markShow)) ? me.aimPt : null;
  if (usingMouse) { I.auto = 0; INP.lockAcq = 1; }
}
