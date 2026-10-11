/* =================== input =================== */
const INP = {keys: new Set(), mx: 0, my: 0, mouse: false, fire: false, wx: 0, wy: 0, stickL: null, stickR: null, aimT: 0, touchTile: null};
function screenToWorld(sx, sy) { return [(sx - VW / 2) / CAM.z + CAM.x, (sy - VH / 2) / CAM.z + CAM.y]; }
const KEYMAP = {KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r'};
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  audioInit();
  const c = e.code;
  if (c === 'Escape') { if (STATE === 'play') togglePause(); e.preventDefault(); return; }
  if (c === 'KeyM') { setMute(!AU.muted); return; }
  if (STATE !== 'play' || PAUSED) return;
  if (KEYMAP[c]) INP.keys.add(KEYMAP[c]);
  if (c === 'Space') { e.preventDefault(); if (!e.repeat) useDash(); }
  if (c === 'KeyQ' && !e.repeat) useSkill();
  if (c === 'KeyE' && !e.repeat) useAlt();
  if (c === 'KeyG' && !e.repeat) toggleReady();
  if (c === 'KeyR' && !e.repeat) { ME.rot = (ME.rot + 1) & 3; sfx('click'); }
  if (c === 'KeyX' && !e.repeat) trySell(INP.wx, INP.wy);
  if ((c === 'KeyZ' || c === 'KeyU') && !e.repeat) undoPlace();
  if (c === 'KeyV' && !e.repeat) toggleOverview();
  if (c === 'KeyF' && !e.repeat) toggleSpeed();
  if (c === 'KeyT' && !e.repeat) act({t: 'ping', x: Math.round(INP.wx), y: Math.round(INP.wy)});
  if (/^Digit[1-9]$/.test(c)) selectSlot(+c.slice(5) - 1);
  if (c === 'Tab') { e.preventDefault(); }
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) INP.keys.delete(KEYMAP[e.code]); });
window.addEventListener('blur', () => { INP.keys.clear(); INP.fire = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousemove', e => { INP.mx = e.clientX; INP.my = e.clientY; INP.mouse = true; });
cv.addEventListener('mousedown', e => {
  audioInit(); if (STATE !== 'play' || PAUSED || IS_TOUCH && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
  INP.mx = e.clientX; INP.my = e.clientY; INP.mouse = true;
  const [wx, wy] = screenToWorld(e.clientX, e.clientY);
  if (e.button === 0) { if (ME.slot > 0) tryPlace(wx, wy); else INP.fire = true; }
  else if (e.button === 2) { if (ME.slot > 0) { if (!trySell(wx, wy, true)) selectSlot(0); } else useAlt(); }
});
window.addEventListener('mouseup', e => { if (e.button === 0) INP.fire = false; });
cv.addEventListener('wheel', e => { if (STATE !== 'play') return; const n = hotbar().length; selectSlot(((ME.slot + (e.deltaY > 0 ? 1 : -1)) % n + n) % n); e.preventDefault(); }, {passive: false});

/* ---------- touch: floating sticks ---------- */
const TOUCH = {L: null, R: null};
function stickEl(k) { return $(k === 'L' ? 'stL' : 'stR'); }
function showStick(k, s) { const el = stickEl(k); if (!s) { el.style.display = 'none'; return; } el.style.display = 'block'; el.style.left = s.ox + 'px'; el.style.top = s.oy + 'px'; el.firstElementChild.style.transform = `translate(${s.dx}px,${s.dy}px)`; }
cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return; audioInit(); if (STATE !== 'play' || PAUSED) return;
  e.preventDefault();
  const left = e.clientX < VW * 0.45;
  if (ME && ME.slot > 0 && !left) { // trap mode: tap to choose tile
    const [wx, wy] = screenToWorld(e.clientX, e.clientY); const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (INP.touchTile && INP.touchTile[0] === tx && INP.touchTile[1] === ty) tryPlace(wx, wy); else INP.touchTile = [tx, ty];
    return;
  }
  const k = left ? 'L' : 'R'; if (TOUCH[k]) return;
  TOUCH[k] = {id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0};
  cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  showStick(k, TOUCH[k]);
}, {passive: false});
cv.addEventListener('pointermove', e => {
  for (const k of ['L', 'R']) { const s = TOUCH[k]; if (!s || s.id !== e.pointerId) continue; let dx = e.clientX - s.ox, dy = e.clientY - s.oy; const L = Math.hypot(dx, dy), M = 50; if (L > M) { dx *= M / L; dy *= M / L; } s.dx = dx; s.dy = dy; showStick(k, s); }
}, {passive: false});
function endTouch(e) { for (const k of ['L', 'R']) { const s = TOUCH[k]; if (s && s.id === e.pointerId) { TOUCH[k] = null; showStick(k, null); } } }
cv.addEventListener('pointerup', endTouch); cv.addEventListener('pointercancel', endTouch);
function bindHold(id, fn) { const el = $(id); el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); fn(); }); }
bindHold('tAlt', () => useAlt()); bindHold('tSkill', () => useSkill()); bindHold('tDash', () => useDash());
bindHold('tPlace', () => { const t = INP.touchTile || defaultTouchTile(); if (t) tryPlace(tc(t[0]), tc(t[1])); });
bindHold('tRot', () => { ME.rot = (ME.rot + 1) & 3; sfx('click'); });
bindHold('tCancel', () => selectSlot(0));
function defaultTouchTile() { if (!ME) return null; const tx = Math.floor((ME.x + Math.cos(ME.aim) * T * 1.6) / T), ty = Math.floor((ME.y + Math.sin(ME.aim) * T * 1.6) / T); return [tx, ty]; }

/* =================== hotbar / slots =================== */
function hotbar() { const out = ['weapon']; for (const k of TRAP_KEYS) if ((SAVE.traps[k] || 0) > 0) out.push(k); return out; }
function selectSlot(i) {
  const hb = hotbar(); if (i < 0 || i >= hb.length || !ME) return;
  if (i === 0 && ME.slot === 0 && SAVE.weapons[ME.hero]) { ME.wpn = ME.wpn ? 0 : 1; SAVE.wsel[ME.hero] = ME.wpn; saveGame(); act({t: 'wpn', w: ME.wpn}); toast('切换武器：' + primOf(ME).name); }
  ME.slot = i; INP.fire = false; INP.touchTile = null; sfx('click'); buildBar();
}
const curTrap = () => ME && ME.slot > 0 ? hotbar()[ME.slot] : null;

/* =================== local actions =================== */
function act(m) { // route an action to host
  if (IS_HOST) return doAction(ME, m);
  netSend(m); return '';
}
function useAlt() {
  const p = ME; if (!p || p.dead || STATE !== 'play') return; const A = HEROES[p.hero].alt;
  if (p.cdAlt > 0) return; if (p.mp < A.mp) { ftxt(p.x, p.y - 70, '法力不足', '#7fb8ff'); sfx('deny'); return; }
  const [tx, ty] = aimTarget(p, 260);
  const r = act({t: 'alt', a: +p.aim.toFixed(3), x: Math.round(tx), y: Math.round(ty)});
  if (r === 'none') { ftxt(p.x, p.y - 70, '没有目标', '#ffb0e8'); sfx('deny'); return; }
  p.cdAlt = A.cd * (p.mods ? p.mods.cdr : 1); if (!IS_HOST) p.mp -= A.mp; TUT.used = true;
  if (p.hero === 'blade' || p.hero === 'ranger') p.atk = 0.3; else if (p.hero === 'paladin') p.guard = A.dur; else p.cast = 0.5;
}
function useSkill() {
  const p = ME; if (!p || p.dead || STATE !== 'play') return; const S = HEROES[p.hero].skill;
  if (p.cdSkill > 0) return; if (p.mp < S.mp) { ftxt(p.x, p.y - 70, '法力不足', '#7fb8ff'); sfx('deny'); return; }
  const [tx, ty] = aimTarget(p, 360);
  act({t: 'skill', a: +p.aim.toFixed(3), x: Math.round(tx), y: Math.round(ty)});
  p.cdSkill = S.cd * (p.mods ? p.mods.cdr : 1); if (!IS_HOST) p.mp -= S.mp; TUT.used = true;
  if (p.hero === 'blade') { p.spin = S.dur; } else p.cast = 0.5;
}
function useDash() {
  const p = ME; if (!p || p.dead || STATE !== 'play' || p.cdDash > 0) return; const Dd = HEROES[p.hero].dash;
  let dx = p.mvx, dy = p.mvy; if (Math.hypot(dx, dy) < 0.2 || Dd.back) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); if (Dd.back) { dx = -dx; dy = -dy; } }
  const L = Math.hypot(dx, dy); dx /= L; dy /= L;
  p.cdDash = Dd.cd * (p.mods ? p.mods.cdr : 1); const ox = p.x, oy = p.y;
  let ex = ox + dx * Dd.dist, ey = oy + dy * Dd.dist;
  if (p.hero === 'sorc') { // blink
    let d = 0; while (d < Dd.dist) { const nx = ox + dx * (d + 8), ny = oy + dy * (d + 8); if (blockedAt(nx, ny, 12, solidWalk)) break; d += 8; }
    for (let k = 0; k < 4; k++) fx({k: 'ghost', u: 'sorc', fi: 0, d: dirOf(p.aim), x: ox + dx * d * k / 4, y: oy + dy * d * k / 4, life: 0.35, tint: 'rgba(120,220,255,.6)'});
    p.x = ox + dx * d; p.y = oy + dy * d; ex = p.x; ey = p.y; sfx('blink');
  } else {
    const dur = p.hero === 'paladin' ? 0.22 : 0.16;
    p.dash = dur; p.dvx = dx * Dd.dist / dur; p.dvy = dy * Dd.dist / dur; sfx('dash');
    let d = 0; while (d < Dd.dist) { if (blockedAt(ox + dx * (d + 8), oy + dy * (d + 8), 12, solidWalk)) break; d += 8; } ex = ox + dx * d; ey = oy + dy * d;
  }
  p.inv = Math.max(p.inv, 0.3);
  act({t: 'dash', x0: Math.round(ox), y0: Math.round(oy), x: Math.round(ex), y: Math.round(ey)});
}
function aimTarget(p, def) {
  if (!IS_TOUCH && INP.mouse) return [INP.wx, INP.wy];
  // touch: nearest enemy roughly along aim, else fixed distance
  let best = null, sc = 1e9;
  for (const e of viewEnemies()) { if (e.dead || e.fall || e.charm > 0) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > 460) continue; const da = Math.abs(angDiff(p.aim, Math.atan2(dy, dx))); if (da > 0.45) continue; const s = d * (1 + 2 * da); if (s < sc) { sc = s; best = e; } }
  if (best) return [best.x, best.y - 14];
  return [p.x + Math.cos(p.aim) * def, p.y + Math.sin(p.aim) * def];
}
function toggleReady() {
  if (!G || G.phase !== 'build' || !ME) return;
  const v = !ME.ready; if (!IS_HOST) ME.ready = v; act({t: 'ready', v: v ? 1 : 0}); sfx('ready');
}
function hoverTile(wx, wy) {
  const k = curTrap(); if (!k) return null;
  if (TRAPS[k].place === 'wall') { // walls are drawn raised; account for that offset
    const ty1 = Math.floor((wy + WH) / T), tx = Math.floor(wx / T);
    if (tAt(tx, ty1) === TW) return [tx, ty1];
  }
  return [Math.floor(wx / T), Math.floor(wy / T)];
}
function tryPlace(wx, wy) {
  const k = curTrap(); if (!k || !G) return;
  const t = IS_TOUCH && INP.touchTile ? INP.touchTile : hoverTile(wx, wy); if (!t) return;
  const ex = viewTraps().find(q => q.tx === t[0] && q.ty === t[1]);
  if (ex && ex.k === k) { // same trap: upgrade in place
    if (ex.lv >= 2) { toast('已满级'); sfx('deny'); return; }
    if (G.gold < upgCost(ex)) { toast('金币不足'); sfx('deny'); return; }
    const r = act({t: 'upg', tx: t[0], ty: t[1]}); if (r) { toast(r); sfx('deny'); } return;
  }
  const why = canPlace(k, t[0], t[1], ME);
  if (why) { toast(why); sfx('deny'); return; }
  const r = act({t: 'place', k, tx: t[0], ty: t[1], r: ME.rot});
  if (r) { toast(r); sfx('deny'); } else { (ME.placed = ME.placed || []).push([t[0], t[1]]); }
}
function trySell(wx, wy, quiet) {
  if (!G) return false;
  let tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  const ty1 = Math.floor((wy + WH) / T);
  const traps = viewTraps(); let tr = traps.find(q => q.tx === tx && q.ty === ty);
  if (!tr) { tr = traps.find(q => q.tx === tx && q.ty === ty1 && TRAPS[q.k].place === 'wall'); if (tr) ty = ty1; }
  if (!tr) { if (!quiet) toast('这里没有陷阱'); return false; }
  act({t: 'sell', tx, ty}); return true;
}

/* =================== local hero update =================== */
function updLocal(dt) {
  const p = ME; if (!p || !G) return;
  const H = HEROES[p.hero];
  p.at += dt; p.cast = Math.max(0, p.cast - dt); p.hurtT = Math.max(0, p.hurtT - dt);
  p.cdAlt = Math.max(0, p.cdAlt - dt); p.cdSkill = Math.max(0, p.cdSkill - dt); p.cdDash = Math.max(0, p.cdDash - dt);
  p.atk = Math.max(0, (p.atk || 0) - dt); if (!IS_HOST) { p.guard = Math.max(0, (p.guard || 0) - dt); p.spin = Math.max(0, (p.spin || 0) - dt); }
  if (p.spin > 0 && Math.random() < 0.5) swingFx(p, rnd(TAU), true);
  if (!IS_HOST) { p.inv = Math.max(0, p.inv - dt); p.mp = Math.min(p.mmp, p.mp + H.mpRegen * dt); }
  [INP.wx, INP.wy] = screenToWorld(INP.mx, INP.my);
  padPoll();
  if (p.dead || PAUSED) { p.anim = 'idle'; INP.fire = false; return; }
  // move input
  let mx = 0, my = 0;
  if (INP.keys.has('l')) mx -= 1; if (INP.keys.has('r')) mx += 1; if (INP.keys.has('u')) my -= 1; if (INP.keys.has('d')) my += 1;
  if (TOUCH.L) { mx = TOUCH.L.dx / 50; my = TOUCH.L.dy / 50; }
  if (PAD.active && (PAD.ax || PAD.ay)) { mx = PAD.ax; my = PAD.ay; }
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  p.mvx = mx; p.mvy = my;
  // aim
  let firing = INP.fire && p.slot === 0;
  if (PAD.active && (PAD.rx || PAD.ry)) { p.aim = Math.atan2(PAD.ry, PAD.rx); INP.aimT = 0.6; INP.mouse = false; }
  if (PAD.active && PAD.fire && p.slot === 0) firing = true;
  if (TOUCH.R && p.slot === 0) { const L = Math.hypot(TOUCH.R.dx, TOUCH.R.dy); if (L > 8) { p.aim = Math.atan2(TOUCH.R.dy, TOUCH.R.dx); INP.aimT = 0.6; } firing = L > 18; }
  else if (PAD.active && (PAD.rx || PAD.ry)) {}
  else if (!IS_TOUCH && INP.mouse) p.aim = Math.atan2(INP.wy - (p.y - 24), INP.wx - p.x);
  else { INP.aimT -= dt; if (INP.aimT <= 0 && ml > 0.2) p.aim = Math.atan2(my, mx); }
  // movement
  const sm = (p.cast > 0 ? 0.65 : 1) * (p.spin > 0 ? 1.3 : 1) * (p.guard > 0 ? 0.7 : 1) * (p.mods ? p.mods.spd : 1);
  let vx = mx * H.speed * sm, vy = my * H.speed * sm;
  if (p.dash > 0) { p.dash -= dt; vx = p.dvx; vy = p.dvy; if (Math.random() < 0.6) fx({k: 'ghost', u: H.atlas, fi: 0, d: dirOf(p.aim), x: p.x, y: p.y, life: 0.25, tint: 'rgba(255,200,140,.5)'}); }
  if (p.kbT > 0) { p.kbT -= dt; vx += p.kbx; vy += p.kby; }
  moveCircle(p, vx * dt, vy * dt, H.r, solidWalk);
  p.anim = ml > 0.15 || p.dash > 0 ? 'walk' : 'idle';
  // fire
  if (firing && G.phase !== 'won' && G.phase !== 'lost') {
    p.fireT -= dt;
    if (p.fireT <= 0) {
      const Pr = primOf(p); p.fireT += 1 / (Pr.rate * (p.mods ? p.mods.rate : 1));
      const a = p.aim + rnd(-0.03, 0.03); p.atk = 0.3;
      const [tx, ty] = Pr.kind === 'flask' ? aimTarget(p, 300) : [0, 0];
      act({t: 'fire', a: +a.toFixed(3), x: Math.round(tx), y: Math.round(ty), w: p.wpn || 0});
      if (Pr.kind === 'melee') { swingFx(p, a, false); sfx('swing'); }
      else if (Pr.kind === 'chain') { sfx('zap'); }
      else {
        if (!IS_HOST) { const fl = Pr.kind === 'flask', life = fl ? clamp(Math.hypot(tx - p.x, ty - p.y), 40, Pr.max) / Pr.speed : Pr.life, n = Pr.n || 1; for (let k = 0; k < n; k++) { const b = a + (n > 1 ? (k - (n - 1) / 2) * Pr.spread / (n - 1) : 0); CL.local.push({k: Pr.kind, x: p.x + Math.cos(b) * 22, y: p.y - (fl ? 0 : 26) + Math.sin(b) * 22, vx: Math.cos(b) * Pr.speed, vy: Math.sin(b) * Pr.speed, life, L: life, lob: fl ? 1 : 0, local: 1}); } }
        sfx({orb: 'orb', flask: 'throw', parrow: 'arrow'}[Pr.kind] || 'bolt');
        fx({k: 'glow', x: p.x + Math.cos(a) * 26, y: p.y - 26 + Math.sin(a) * 26, s: 14, life: 0.08, col: Pr.kind === 'orb' ? '120,220,255' : '255,210,140'});
      }
    }
  } else p.fireT = Math.max(0, p.fireT - dt);
}
function updLocalCosmetics(dt) { // guest: own predicted shots
  for (const q of CL.local) {
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (q.lob) continue;
    if (solidShot(Math.floor(q.x / T), Math.floor((q.y + 14) / T))) q.life = -1;
    for (const e of CL.enemies.values()) { if (e.dead || e.fall || e.charm > 0) continue; const D = ORCS[e.type]; if (dist2(q.x, q.y, e.rx, e.ry - (D.fly ? 40 : D.r)) < Math.pow(D.r + 8, 2)) { q.life = -1; break; } }
  }
  CL.local = CL.local.filter(q => q.life > 0);
}

/* =================== camera =================== */
function updCamera(dt) {
  if (!G || !ME) return;
  let tx = (ME.rx != null ? ME.rx : ME.x), ty = (ME.ry != null ? ME.ry : ME.y) - 20;
  const fitZ = Math.min(VW / (G.map.w * T + T), VH / (G.map.h * T + T * 2));
  if (CAM.over) { tx = G.map.w * T / 2; ty = G.map.h * T / 2; }
  CAM.z += ((CAM.over ? fitZ : CAM.baseZ || CAM.z) - CAM.z) * (1 - Math.exp(-6 * dt));
  const k = 1 - Math.exp(-8 * dt);
  CAM.x += (tx - CAM.x) * k; CAM.y += (ty - CAM.y) * k;
  const hw = VW / 2 / CAM.z, hh = VH / 2 / CAM.z, W = G.map.w * T, H = G.map.h * T;
  CAM.x = W > hw * 2 ? clamp(CAM.x, hw - T, W - hw + T) : W / 2;
  CAM.y = H > hh * 2 ? clamp(CAM.y, hh - T * 1.5, H - hh + T) : H / 2;
  if (CAM.shake > 0 && SAVE.shake === false) CAM.shake = 0;
  if (CAM.shake > 0) { CAM.shake = Math.max(0, CAM.shake - dt * 30); CAM.x += rnd(-CAM.shake, CAM.shake); CAM.y += rnd(-CAM.shake, CAM.shake); }
}

/* =================== placement ghost & aim aid =================== */
function drawGhost(g, now) {
  const k = curTrap(); if (!k || !ME || ME.dead) return;
  const D = TRAPS[k];
  // range ring (only limits placement during waves)
  if (G.phase !== 'build') { g.strokeStyle = 'rgba(243,210,122,.18)'; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); g.ellipse(ME.x, ME.y, B.placeRange, B.placeRange, 0, 0, TAU); g.stroke(); g.setLineDash([]); }
  const t = IS_TOUCH ? (INP.touchTile || defaultTouchTile()) : hoverTile(INP.wx, INP.wy); if (!t) return;
  const [tx, ty] = t; const ex = viewTraps().find(q => q.tx === tx && q.ty === ty && q.k === k);
  if (ex) { const x = tc(tx), y = tc(ty) + (D.place === 'wall' ? -WH : 0); g.strokeStyle = '#f3d27a'; g.lineWidth = 2; g.strokeRect(tx * T + 1, y - T / 2 + 1, T - 2, T - 2); const lab = ex.lv >= 2 ? '已满级' : '升级 ★' + (ex.lv + 1) + '  ' + upgCost(ex); g.font = '800 12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(lab, x + 1, y - T / 2 - 5); g.fillStyle = ex.lv >= 2 ? '#aaa' : '#9fe3ff'; g.fillText(lab, x, y - T / 2 - 6); return; }
  const why = canPlace(k, tx, ty, ME); const ok = !why || why === '金币不足';
  const x = tc(tx), y = tc(ty), wall = D.place === 'wall';
  const oy = wall ? -WH : 0;
  g.fillStyle = why ? 'rgba(224,73,62,.28)' : 'rgba(95,208,104,.25)'; g.strokeStyle = why ? '#e0493e' : '#5fd068'; g.lineWidth = 2;
  g.fillRect(tx * T, ty * T + oy, T, T); g.strokeRect(tx * T + 1, ty * T + oy + 1, T - 2, T - 2);
  let rot = ME.rot; if (wall) rot = wallFacing(tx, ty, ME.x, ME.y);
  if (ok && rot >= 0) {
    const fake = {k, tx, ty, rot, anim: 0, hp: 1, mhp: 1, id: 0, lv: 0};
    g.globalAlpha = 0.65; if (D.unit) drawGuardian(g, fake, now); else if (D.proc) drawPendulum(g, fake, now); else drawProp(g, trapFrame(fake, now), x, y + oy + (wall ? 4 : 0), wall ? 0.92 : 1); g.globalAlpha = 1;
  }
  // area previews
  g.fillStyle = 'rgba(255,220,120,.12)';
  if (k === 'brim' || k === 'frost') g.fillRect((tx - 1) * T, (ty - 1) * T, T * 3, T * 3);
  if (k === 'pendulum') { const ax = rot % 2 === 0 ? [1, 0] : [0, 1]; for (const s of [-1, 0, 1]) g.fillRect((tx + ax[0] * s) * T + 4, (ty + ax[1] * s) * T + 4, T - 8, T - 8); }
  if (k === 'gxbow') { g.beginPath(); g.ellipse(x, y, D.range * T, D.range * T, 0, 0, TAU); g.fill(); }
  if ((k === 'arrow' || k === 'grinder') && rot >= 0) {
    const [dx, dy] = DIRV[rot]; const n = k === 'arrow' ? D.range : 1;
    for (let i = 1; i <= n; i++) { const xx = tx + dx * i, yy = ty + dy * i; if (solidShot(xx, yy)) break; g.fillRect(xx * T + 4, yy * T + 4, T - 8, T - 8); }
  }
  if (D.dir) { const [dx, dy] = DIRV[rot]; g.strokeStyle = '#ffe08a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * T * 1.6, y + dy * T * 1.6); g.stroke(); g.beginPath(); g.moveTo(x + dx * T * 1.6, y + dy * T * 1.6); g.lineTo(x + dx * T * 1.25 - dy * 8, y + dy * T * 1.25 + dx * 8); g.lineTo(x + dx * T * 1.25 + dy * 8, y + dy * T * 1.25 - dx * 8); g.closePath(); g.fillStyle = '#ffe08a'; g.fill(); }
  // label
  g.font = '800 12px sans-serif'; g.textAlign = 'center';
  const label = why ? why : (D.name + '  ' + costFor(ME, k));
  g.fillStyle = '#000'; g.fillText(label, x + 1, ty * T + oy - 5); g.fillStyle = why ? '#ff9a8e' : '#f3d27a'; g.fillText(label, x, ty * T + oy - 6);
}
function drawAimAid(g) {
  if (!ME || ME.dead || ME.slot > 0) return;
  if (IS_TOUCH && TOUCH.R) { g.strokeStyle = 'rgba(255,236,190,.35)'; g.lineWidth = 2; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(ME.x, ME.y - 24); g.lineTo(ME.x + Math.cos(ME.aim) * 260, ME.y - 24 + Math.sin(ME.aim) * 260); g.stroke(); g.setLineDash([]); }
  if (!IS_TOUCH && INP.mouse) { const x = INP.wx, y = INP.wy; g.strokeStyle = 'rgba(255,240,200,.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.moveTo(x - 14, y); g.lineTo(x - 5, y); g.moveTo(x + 5, y); g.lineTo(x + 14, y); g.moveTo(x, y - 14); g.lineTo(x, y - 5); g.moveTo(x, y + 5); g.lineTo(x, y + 14); g.stroke(); }
}

/* =================== HUD =================== */
function toast(s) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = s; $('toasts').appendChild(el); setTimeout(() => el.remove(), 2400); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
let bannerT = 0;
function banner(s, sub) { const b = $('banner'); b.innerHTML = s + (sub ? '<small>' + sub + '</small>' : ''); b.style.opacity = 1; clearTimeout(bannerT); bannerT = setTimeout(() => b.style.opacity = 0, 2200); }
function trapIcon(cvs, k, s = 0.82) {
  const D = TRAPS[k], g = cvs.getContext('2d');
  if (D.unit) { g.clearRect(0, 0, cvs.width, cvs.height); const A = ATLAS.units[D.unit], im = IMG[D.unit]; if (!A || !im) return; const col = A.anims.idle[0], [x0, y0, x1, y1] = unitBox(D.unit, col, 2), bw = x1 - x0, bh = y1 - y0, kk = Math.min(cvs.width / bw, cvs.height / bh) * s; g.drawImage(im, col * A.cw + x0, 2 * A.ch + y0, bw, bh, (cvs.width - bw * kk) / 2, (cvs.height - bh * kk) / 2, bw * kk, bh * kk); return; }
  if (D.proc === 'pendulum') { g.clearRect(0, 0, cvs.width, cvs.height); const w = cvs.width, h = cvs.height; g.strokeStyle = '#8a8f99'; g.lineWidth = w * 0.04; g.beginPath(); g.moveTo(w * .5, h * .08); g.lineTo(w * .62, h * .55); g.stroke(); const gr = g.createLinearGradient(w * .4, 0, w * .85, 0); gr.addColorStop(0, '#3c4048'); gr.addColorStop(.45, '#b8bfca'); gr.addColorStop(1, '#2c2f36'); g.fillStyle = gr; g.fillRect(w * .42, h * .5, w * .42, h * .3); g.fillStyle = '#d9a84a'; g.fillRect(w * .42, h * .62, w * .42, h * .05); g.fillStyle = '#c8ced6'; g.beginPath(); g.moveTo(w * .84, h * .52); g.lineTo(w * .96, h * .65); g.lineTo(w * .84, h * .78); g.fill(); g.beginPath(); g.moveTo(w * .42, h * .52); g.lineTo(w * .3, h * .65); g.lineTo(w * .42, h * .78); g.fill(); return; }
  iconCanvas(cvs, D.spr + '_0_2', s);
}
function iconCanvas(cvs, key, s = 0.82, dy = 0) {
  const g = cvs.getContext('2d'); g.clearRect(0, 0, cvs.width, cvs.height);
  const r = ATLAS.props[key]; if (!r || !IMG.props) return;
  const k = Math.min(cvs.width / r[2], cvs.height / r[3]) * s; const w = r[2] * k, h = r[3] * k;
  g.drawImage(IMG.props, r[0], r[1], r[2], r[3], (cvs.width - w) / 2, (cvs.height - h) / 2 + dy, w, h);
}
const UBOX = {};
function unitBox(name, col, dir) { // alpha bbox of one atlas cell (cell px)
  const key = name + col + '_' + dir; if (UBOX[key]) return UBOX[key];
  const A = ATLAS.units[name], im = IMG[name]; const c = document.createElement('canvas'); c.width = A.cw; c.height = A.ch;
  const g = c.getContext('2d'); g.drawImage(im, col * A.cw, dir * A.ch, A.cw, A.ch, 0, 0, A.cw, A.ch);
  let x0 = A.cw, y0 = A.ch, x1 = 0, y1 = 0;
  try { const d = g.getImageData(0, 0, A.cw, A.ch).data; for (let y = 0; y < A.ch; y++) for (let x = 0; x < A.cw; x++) if (d[(y * A.cw + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } catch (e) { x0 = 0; y0 = 0; x1 = A.cw; y1 = A.ch; }
  return UBOX[key] = [x0, y0, x1 + 1, y1 + 1];
}
function portraitCanvas(cvs, hero, full) {
  const g = cvs.getContext('2d'); g.clearRect(0, 0, cvs.width, cvs.height);
  const nm = HEROES[hero].atlas, A = ATLAS.units[nm], im = IMG[nm]; if (!A || !im) return;
  const col = A.anims.idle[0], dir = 2, [x0, y0, x1, y1] = unitBox(nm, col, dir);
  const bw = x1 - x0, bh = y1 - y0;
  if (full) { const k = Math.min(cvs.width / bw, cvs.height / bh) * 0.96; g.drawImage(im, col * A.cw + x0, dir * A.ch + y0, bw, bh, (cvs.width - bw * k) / 2, (cvs.height - bh * k) / 2, bw * k, bh * k); }
  else { // head & shoulders: square crop centred on the head (bbox top)
    const hw = Math.min(bw, bh * 0.42), cx = col * A.cw + x0 + bw / 2 + (hero === 'sorc' ? bw * 0.08 : 0), top = dir * A.ch + y0 + (hero === 'sorc' ? bh * 0.12 : 0);
    g.drawImage(im, cx - hw / 2, top, hw, hw, 0, 0, cvs.width, cvs.height);
  }
}
function skillIcon(cvs, hero, k) {
  const g = cvs.getContext('2d'), w = cvs.width, h = cvs.height; g.clearRect(0, 0, w, h);
  const [c0, c1, gl] = (SKICON[hero] || SKICON.warmage)[k];
  const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.6); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.fillStyle = 'rgba(0,0,0,.55)'; g.lineWidth = w * 0.07; g.lineCap = 'round'; g.lineJoin = 'round';
  const c = w / 2, P_ = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * w, y * h) : g.moveTo(x * w, y * h)); };
  switch (gl) {
    case 'waves': for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(c * 0.6, c, c * (0.35 + i * 0.22), -0.7, 0.7); g.stroke(); } break;
    case 'fire': g.beginPath(); g.arc(c, c * 1.1, c * 0.38, 0, TAU); g.fill(); g.beginPath(); g.moveTo(c - c * 0.35, c); g.quadraticCurveTo(c, -c * 0.1, c + c * 0.2, c * 0.55); g.fill(); break;
    case 'heart': g.font = `900 ${w * 0.62}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', c, c * 1.08); break;
    case 'snow': for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * c * 0.75, c + Math.sin(a) * c * 0.75); g.stroke(); } break;
    case 'shield': P_([[.5, .15], [.8, .25], [.75, .6], [.5, .88], [.25, .6], [.2, .25]]); g.closePath(); g.fill(); break;
    case 'hammer': g.fillRect(w * .28, h * .18, w * .44, h * .22); g.fillRect(w * .45, h * .38, w * .1, h * .46); break;
    case 'fan': for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + i * 0.32; g.beginPath(); g.moveTo(c, h * .85); g.lineTo(c + Math.cos(a) * c * .8, h * .85 + Math.sin(a) * c * 1.2); g.stroke(); } break;
    case 'bird': P_([[.1, .45], [.35, .35], [.5, .5], [.65, .35], [.9, .45], [.62, .55], [.5, .75], [.38, .55]]); g.closePath(); g.fill(); break;
    case 'back': P_([[.75, .3], [.3, .3], [.3, .75]]); g.stroke(); P_([[.3, .3], [.75, .75]]); g.stroke(); break;
    case 'turret': g.fillRect(w * .3, h * .45, w * .4, h * .2); g.fillRect(w * .45, h * .25, w * .38, h * .12); P_([[.35, .65], [.25, .88]]); g.stroke(); P_([[.65, .65], [.75, .88]]); g.stroke(); break;
    case 'cloud': for (const [x, y, r] of [[.35, .55, .18], [.55, .45, .22], [.7, .6, .16], [.48, .65, .17]]) { g.beginPath(); g.arc(x * w, y * h, r * w, 0, TAU); g.fill(); } break;
    case 'knives': for (let i = -1; i <= 1; i++) { P_([[.2, .5 + i * .2], [.82, .5 + i * .12]]); g.stroke(); } break;
    case 'spin': g.beginPath(); g.arc(c, c, c * .55, 0.3, TAU - 0.6); g.stroke(); P_([[.82, .38], [.9, .58], [.7, .55]]); g.closePath(); g.fill(); break;
    default: P_([[.2, .7], [.75, .25]]); g.stroke(); P_([[.75, .25], [.5, .27]]); g.stroke(); P_([[.75, .25], [.73, .5]]); g.stroke();
  }
}
function buildSkills() {
  const el = $('skills'); el.innerHTML = ''; const H = HEROES[ME.hero];
  for (const [k, S] of [['alt', H.alt], ['skill', H.skill], ['dash', H.dash]]) {
    const d = document.createElement('div'); d.className = 'sk'; d.id = 'sk_' + k; d.title = S.name;
    d.innerHTML = `<canvas width="80" height="80"></canvas><div class="cd"></div><span class="k">${IS_TOUCH ? '' : S.key}</span>`;
    skillIcon(d.firstChild, ME.hero, k); el.appendChild(d);
    d.addEventListener('pointerdown', e => { e.preventDefault(); ({alt: useAlt, skill: useSkill, dash: useDash})[k](); });
  }
  for (const [id, k] of [['tAlt', 'alt'], ['tSkill', 'skill']]) $(id).firstElementChild.textContent = H[k].name;
  $('tDash').firstChild.textContent = H.dash.name;
  portraitCanvas($('portrait'), ME.hero);
}
function buildBar() {
  const el = $('bar'); el.innerHTML = '';
  hotbar().forEach((k, i) => {
    const d = document.createElement('div'); d.className = 'slot' + (ME && ME.slot === i ? ' sel' : ''); d.dataset.k = k;
    if (k === 'weapon') { d.innerHTML = `<span class="key">1</span><canvas width="88" height="80"></canvas><span class="cost" style="color:#d9cfe8">${SAVE.weapons[ME.hero] ? (ME.wpn ? '武器Ⅱ' : '武器Ⅰ') : '武器'}</span>`; portraitCanvas(d.querySelector('canvas'), ME.hero); d.title = primOf(ME).name + (SAVE.weapons[ME.hero] ? '（再按一次切换）' : ''); }
    else { const D = TRAPS[k], lv = SAVE.traps[k] || 1; d.innerHTML = `<span class="key">${IS_TOUCH ? '' : i + 1}</span><span class="slv">${'★'.repeat(lv - 1)}</span><canvas width="88" height="80"></canvas><span class="cost">${costFor(ME, k)}</span>`; trapIcon(d.querySelector('canvas'), k); d.title = D.name + '：' + D.desc; }
    d.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); selectSlot(ME.slot === i && i > 0 ? 0 : i); });
    if (G && G.allowT && k !== 'weapon' && !G.allowT.includes(k)) d.style.opacity = 0.3;
    if (G && G.mod === 'nobar' && k === 'barricade') d.style.opacity = 0.3;
    el.appendChild(d);
  });
}
let hudT = 0, lastGold = 0;
function updHud(dt) {
  hudT -= dt; if (hudT > 0 || !G || !ME) return; hudT = 0.1;
  const rf = G.rift / G.riftMax;
  $('riftBar').firstElementChild.style.width = (rf * 100) + '%'; $('riftBar').lastElementChild.textContent = `${G.rift} / ${G.riftMax}`;
  $('gold').textContent = G.gold;
  if (G.gold !== lastGold) { const d = G.gold - lastGold; if (lastGold && Math.abs(d) > 0) { $('goldD').textContent = (d > 0 ? '+' : '') + d; clearTimeout(updHud.gt); updHud.gt = setTimeout(() => $('goldD').textContent = '', 900); } lastGold = G.gold; }
  const L = LEVELS[G.li];
  $('waveTxt').textContent = G.mode === 'endless' ? `无尽 · ${L.name} · 第 ${G.wave + 1} 波` : `${G.mode === 'daily' ? '每日 · ' : ''}${L.name} · 第 ${Math.min(G.wave + 1, G.nWaves)} / ${G.nWaves} 波` + (ME && ME.lvl > 1 ? ` · Lv${ME.lvl}` : '');
  const rb = $('readyBtn');
  if (G.phase === 'build') {
    const others = P.filter(p => p && p !== ME);
    $('phaseTxt').textContent = '建造阶段 — 布置陷阱，准备好后开战' + (others.length ? (others[0].ready ? '（队友已就绪）' : '（等待队友）') : '');
    rb.style.display = ''; rb.classList.toggle('on', !!ME.ready); wavePreview(); rb.textContent = ME.ready ? '已准备 ✓' : (IS_TOUCH ? '准备开战' : '准备开战 (G)');
  } else if (G.phase === 'wave') {
    $('wavePrev').innerHTML = ''; wavePreview.key = '';
    const left = (IS_HOST ? G.enemies.filter(alive).length + G.spawnQ.length : (G.left || 0));
    $('phaseTxt').textContent = `兽人来袭！剩余 ${left}`; rb.style.display = 'none';
  } else { $('phaseTxt').textContent = G.phase === 'won' ? '胜利！' : '裂隙失守……'; rb.style.display = 'none'; }
  const H = HEROES[ME.hero];
  $('hpBar').firstElementChild.style.width = (ME.hp / ME.mhp * 100) + '%'; $('hpBar').lastElementChild.textContent = `${Math.ceil(ME.hp)} / ${ME.mhp}`;
  $('mpBar').firstElementChild.style.width = (ME.mp / ME.mmp * 100) + '%'; $('mpBar').lastElementChild.textContent = `${Math.floor(ME.mp)}`;
  for (const [k, cdk, tot, mp] of [['alt', 'cdAlt', H.alt.cd, H.alt.mp], ['skill', 'cdSkill', H.skill.cd, H.skill.mp], ['dash', 'cdDash', H.dash.cd, 0]]) {
    const el = $('sk_' + k); if (!el) continue; el.querySelector('.cd').style.height = (ME[cdk] / tot * 100) + '%'; el.classList.toggle('nomp', ME.mp < mp);
    const tb = k === 'alt' ? $('tAlt') : k === 'skill' ? $('tSkill') : $('tDash'); tb.querySelector('.cd').style.setProperty('--p', (ME[cdk] / tot * 100) + '%'); tb.style.opacity = ME.mp < mp ? 0.5 : 1;
  }
  // hotbar affordability
  for (const d of $('bar').children) { const k = d.dataset.k; if (k !== 'weapon') d.classList.toggle('poor', G.gold < costFor(ME, k)); }
  const tm = !!curTrap(); for (const id of ['tAlt', 'tSkill', 'tDash']) $(id).style.display = tm ? 'none' : ''; for (const id of ['tPlace', 'tRot', 'tCancel']) $(id).style.display = tm ? '' : 'none';
  if (tm && !TRAPS[curTrap()].dir) $('tRot').style.display = 'none';
  // ally
  const o = P.find(p => p && p !== ME); const al = $('ally');
  if (o) { al.style.display = 'block'; al.innerHTML = `<b style="color:#9fe3ff">${esc(o.name)}</b> · ${HEROES[o.hero].name}<div class="bar" style="height:8px;margin-top:4px"><i style="width:${o.hp / o.mhp * 100}%;background:#e0493e"></i></div>${o.dead ? '<span class="mut">阵亡，' + Math.ceil(o.rt || 0) + ' 秒后复活</span>' : ''}`; }
  else al.style.display = 'none';
  // tip
  $('tipLine').textContent = tm ? '左键放置（点已有同类陷阱 = 升级）· 右键出售/取消 · R 旋转 · Z 撤销 · V 全图' : 'WASD 移动 · 左键攻击 · 右键/E ' + H.alt.name + ' · Q ' + H.skill.name + ' · 空格 ' + H.dash.name + ' · 2-9 选陷阱 · V 全图 · F 加速';
  const bp = G.phase === 'build'; $('bUndo').style.display = bp && ME.placed && ME.placed.length ? '' : 'none'; $('bOver').style.display = bp ? '' : 'none'; $('bOver').textContent = CAM.over ? '回到英雄' : '全图';
  $('bReuse').style.display = bp && IS_HOST && G.wave === 0 && !G.traps.length && SAVE.layouts && SAVE.layouts[LEVELS[G.li].id] ? '' : 'none';
  $('bSpeed').style.display = NET.mode === 'online' ? 'none' : ''; $('bSpeed').textContent = TIME_SCALE + '×'; $('bSpeed').classList.toggle('on', TIME_SCALE > 1);
  const sk = IS_HOST ? (G.streak && G.time - G.streak.last < B.streakWin ? G.streak.n : 0) : (G.sk || 0); const se = $('streak'); if (sk >= 3) { se.innerHTML = '连杀 ×' + sk + '<small>' + (sk >= 5 ? '结束时 +' + sk * 4 + ' 金币' : '再 ' + (5 - sk) + ' 杀有奖励') + '</small>'; se.style.opacity = 1; } else se.style.opacity = 0;
  drawMini();
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
function drawMini() {
  const c = $('mini'), g = c.getContext('2d'), s = LAYER.ms; if (!LAYER.mini) return;
  g.clearRect(0, 0, c.width, c.height); g.drawImage(LAYER.mini, 0, 0);
  g.fillStyle = '#f3d27a'; for (const tr of viewTraps()) g.fillRect(tr.tx * s + 1, tr.ty * s + 1, s - 2, s - 2);
  g.fillStyle = '#ff4a2a'; for (const gt of G.map.gates) { g.beginPath(); g.arc(tc(gt.x) / T * s, tc(gt.y) / T * s, s * 0.9, 0, TAU); g.fill(); }
  g.fillStyle = '#56c8ff'; for (const r of G.map.rifts) { g.beginPath(); g.arc(tc(r.x) / T * s, tc(r.y) / T * s, s * 1.1, 0, TAU); g.fill(); }
  for (const e of viewEnemies()) { if (e.dead || e.fall) continue; g.fillStyle = e.charm > 0 ? '#ff7adf' : ORCS[e.type].boss ? '#ff00ff' : '#ff3030'; const r = ORCS[e.type].mass >= 4 ? 2.4 : 1.4; g.fillRect(e.x / T * s - r, e.y / T * s - r, r * 2, r * 2); }
  for (const q of PINGS) { g.strokeStyle = q.mine ? '#f3d27a' : '#9fe3ff'; g.lineWidth = 2; g.beginPath(); g.arc(q.x / T * s, q.y / T * s, 4 + (q.t * 6 % 5), 0, TAU); g.stroke(); }
  for (const p of P) if (p && !p.dead) { g.fillStyle = p === ME ? '#ffffff' : '#9fe3ff'; g.beginPath(); g.arc(p.x / T * s, p.y / T * s, 3, 0, TAU); g.fill(); }
  // view rect
  const hw = VW / 2 / CAM.z, hh = VH / 2 / CAM.z; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.strokeRect((CAM.x - hw) / T * s, (CAM.y - hh) / T * s, hw * 2 / T * s, hh * 2 / T * s);
}
$('readyBtn').addEventListener('click', () => { audioInit(); toggleReady(); });
$('bUndo').addEventListener('click', () => { audioInit(); undoPlace(); });
$('bOver').addEventListener('click', () => { audioInit(); toggleOverview(); });
$('bSpeed').addEventListener('click', () => { audioInit(); toggleSpeed(); });
$('bReuse').addEventListener('click', () => { audioInit(); reuseLayout(); });
$('bMute').addEventListener('click', () => { audioInit(); setMute(!AU.muted); });
$('bPause').addEventListener('click', () => togglePause());
$('bFull').addEventListener('click', () => { const d = document; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const r = d.documentElement; (r.requestFullscreen || r.webkitRequestFullscreen || (() => {})).call(r); } });
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('bFull').style.display = 'none';

function swingFx(p, a, spin) {
  const x = p.rx != null && p !== ME ? p.rx : p.x, y = (p.ry != null && p !== ME ? p.ry : p.y) - 22, H = HEROES[p.hero];
  const r = spin ? HEROES.blade.skill.r : (H.primary.range || 70);
  fx({k: 'slash', x, y, ang: a, arc: spin ? 0.7 : (H.primary.arc || 1), r1: r, life: spin ? 0.18 : 0.2, col: p.hero === 'paladin' ? '255,236,170' : '255,200,200'});
}

function wavePreview() {
  const W = waveDef(G.wave); const key = G.li + '|' + G.wave + '|' + G.coop + '|' + G.mode; if (wavePreview.key === key) return; wavePreview.key = key;
  if (!W) { $('wavePrev').innerHTML = ''; return; }
  const agg = new Map();
  for (const [g, type, n] of W) { const gi = Math.min(g, G.map.gates.length - 1); const k = gi + '|' + type; agg.set(k, (agg.get(k) || 0) + (G.coop && !ORCS[type].boss ? Math.round(n * B.coopCount * (G.countMul || 1)) : Math.round(n * (ORCS[type].boss ? 1 : G.countMul || 1)))); }
  $('wavePrev').innerHTML = [...agg].sort().map(([k, n]) => { const [gi, type] = k.split('|'); return `<span class="wc"><b style="color:${GATE_COL[gi % 3]}">${'ABC'[gi]}</b>${ORCS[type].name}×${n}</span>`; }).join('');
}

let TIME_SCALE = 1;
function toggleSpeed() { if (NET.mode === 'online' || STATE !== 'play') return; TIME_SCALE = TIME_SCALE === 1 ? 2 : 1; sfx('click'); toast(TIME_SCALE > 1 ? '两倍速' : '正常速度'); }
function toggleOverview() { if (STATE !== 'play') return; CAM.over = !CAM.over; sfx('click'); }
function undoPlace() {
  if (!G || G.phase !== 'build' || !ME) return;
  const st = ME.placed || [];
  while (st.length) { const [tx, ty] = st.pop(); if (viewTraps().some(q => q.tx === tx && q.ty === ty)) { act({t: 'sell', tx, ty}); return; } }
  toast('没有可以撤销的放置');
}
function reuseLayout() {
  if (!IS_HOST || !G || G.phase !== 'build') return; const L = SAVE.layouts && SAVE.layouts[LEVELS[G.li].id]; if (!L) return;
  let n = 0, skip = 0;
  for (const [k, tx, ty, rot] of L) { if (!(SAVE.traps[k] > 0)) { skip++; continue; } if (!placeTrap(ME, k, tx, ty, rot)) { n++; (ME.placed = ME.placed || []).push([tx, ty]); } else skip++; }
  toast(`已复用 ${n} 个陷阱` + (skip ? `，${skip} 个因金币或位置不足跳过` : ''));
}

/* ---------- level-up perk picker ---------- */
let perkKey = '';
function updPerkUI() {
  const el = $('perks'); const pk = ME && ME.pick && ME.pick[0];
  const key = pk ? pk.join(',') + '|' + ME.lvl : '';
  if (key === perkKey) return; perkKey = key;
  if (!pk) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = `<div class="ptitle">升级！Lv ${ME.lvl} · 选择一项强化</div>` + pk.map((id, i) => `<button class="pk" data-id="${id}"><b>${PERKS[id].name}</b><span>${PERKS[id].desc}</span>${(ME.perks && ME.perks[id]) ? `<i>已有 ${ME.perks[id]} 层</i>` : ''}</button>`).join('');
  for (const b of el.querySelectorAll('.pk')) b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); audioInit(); sfx('ready'); const id = b.dataset.id; if (IS_HOST) takePerk(ME, id); else { act({t: 'perk', id}); ME.pick.shift(); } perkKey = '#'; updPerkUI(); };
}
$('mini').addEventListener('pointerdown', e => {
  if (!G || STATE !== 'play') return; e.preventDefault(); e.stopPropagation();
  const r = $('mini').getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * G.map.w * T, y = (e.clientY - r.top) / r.height * G.map.h * T;
  act({t: 'ping', x: Math.round(x), y: Math.round(y)});
});
