/* ================= combat: stats, damage, skills, projectiles, telegraphs, FX ================= */
const PROJ = [], TELE = [], FXL = [];
function lvStats(lv, kind) {
  const k = kind === 'partner' ? { hp: 0.82, atk: 0.8, def: 0.9 } : { hp: 1, atk: 1, def: 1 };
  return { hpMax: Math.round((130 + BAL.hpPerLv * (lv - 1)) * k.hp), atk: Math.round((12 + BAL.atkPerLv * (lv - 1)) * k.atk), def: Math.round((2 + BAL.defPerLv * (lv - 1)) * k.def), mpMax: 80 + lv * 4 };
}
function applyStats(e) { const s = lvStats(e.lv, e.type); const f = e.hp / (e.hpMax || 1); Object.assign(e, s); e.hp = Math.max(1, Math.round(e.hpMax * clamp(f, 0, 1))); e.mp = Math.min(e.mp, e.mpMax); }
function isFoe(a, b) { return a.team !== b.team && a.team !== 2 && b.team !== 2 && b.alive && !b.invuln; }
function buffVal(e, k) { let v = 0; for (const b of e.buffs) if (b[k]) v += b[k]; return v; }
function hasBuff(e, id) { return e.buffs.some(b => b.id === id); }
function addBuff(e, b) { e.buffs = e.buffs.filter(x => x.id !== b.id); e.buffs.push(Object.assign({ t: b.d }, b)); }
/* ---------- damage ---------- */
function hurt(src, tgt, mul, o = {}) {
  if (!tgt.alive || tgt.invuln || (tgt.iframe || 0) > 0) return 0;
  if (NETROLE === 'guest') { if (src && src === W.P[1]) netSendCtl({ t: 'hit', id: tgt.id, mul, kb: o.kb || 0, sk: o.sk }); return 0; }
  if (tgt.R) tgt.flashT = 0.12;
  const atk = (src ? src.atk * (1 + buffVal(src, 'atkK')) : 10) * mul;
  let d = atk * rr(0.9, 1.1) * (100 / (100 + tgt.def * 6)) * (1 - buffVal(tgt, 'dr'));
  if (o.flat) d = o.flat;
  const crit = !o.flat && rnd() < BAL.critBase + buffVal(src || {}, 'crit'); if (crit) d *= BAL.critMul;
  d = Math.max(1, Math.round(d));
  // shields absorb first
  for (const b of tgt.buffs) if (b.shield > 0 && d > 0) { const a = Math.min(b.shield, d); b.shield -= a; d -= a; if (b.shield <= 0) b.t = 0; floatText(tgt, '吸收', '#9ae8ff', 0.8); }
  tgt.hp -= d; tgt.lastHit = W.t; if (src) { src.lastHit = W.t; tgt.lastAtk = src; }
  if (tgt.type === 'mob' && src) { tgt.threat = tgt.threat || new Map(); tgt.threat.set(src.id, (tgt.threat.get(src.id) || 0) + d * (src.threatK || 1)); if (!tgt.ai.tgt) tgt.ai.tgt = src; }
  if (d > 0) floatText(tgt, (crit ? '暴击 ' : '') + d, tgt.team === 0 ? '#ff6a5a' : crit ? '#ffd24a' : '#ffffff', crit ? 1.35 : 1);
  if (o.kb && !tgt.heavy && !tgt.boss) { const a = Math.atan2(tgt.x - (o.fx ?? src.x), tgt.z - (o.fz ?? src.z)); tgt.kbx = Math.sin(a) * o.kb; tgt.kbz = Math.cos(a) * o.kb; if (o.up) { tgt.vy = o.up; tgt.onGround = false; } }
  if (tgt.R && (!tgt.A.act || tgt.A.act.k === 'hit') && !tgt.boss && rnd() < 0.7) act(tgt.A, 'hit', 0.3);
  hitSpark(tgt.x, tgt.y + tgt.h * 0.6, tgt.z, o.col || (crit ? 0xffd24a : 0xfff0d0), crit ? 18 : 10);
  sfx(o.snd || (tgt.team === 0 ? 'hurt' : 'hit'), { k: Math.min(1, d / (tgt.hpMax * 0.2)) });
  if (tgt === W.P[W.me]) { shake(0.12 + Math.min(0.3, d / tgt.hpMax)); flashHurt(); }
  const th = buffVal(tgt, 'thorns'); if (th && src && src.alive && src !== tgt && edist(src, tgt) < 4 && !o.thorn) hurt(tgt, src, th, { thorn: true, col: 0x5ae8c8 });
  if (tgt.hp <= 0) kill(tgt, src);
  if (tgt.onHurt) tgt.onHurt(d, src);
  return d;
}
function heal(tgt, amt, src) { if (!tgt.alive) return; const a = Math.min(Math.round(amt), tgt.hpMax - tgt.hp); tgt.hp += a; if (a > 0) floatText(tgt, '+' + a, '#6aff8a', 1); }
function kill(e, src) {
  e.hp = 0;
  if (e.type === 'player' || e.type === 'partner') { if (e.noDown) { e.hp = 1; return; } e.alive = false; e.downed = true; e.downT = BAL.downedT; e.A.pose = 'down'; e.A.act = null; if (e.R.kind !== 'human') e.A.pose = 'dead'; say(`${e.name} 倒下了！${e.type === 'player' ? '' : ''}`, '#ff8a7a'); sfx('down'); return; }
  e.alive = false; e.deadT = 0; e.A.act = null;
  if (e.onDeath) e.onDeath(src);
  if (e.type === 'mob') { const xp = e.xp || 0; if (xp) gainXP(xp, e); dropLoot(e); STORY.onKill(e); sfx('die'); }
}
/* ---------- melee arc / circle ---------- */
function meleeArc(e, range, arc, mul, o = {}) { let n = 0; const [fx0, fz0] = fwd(e); for (const t of W.ents) { if (!isFoe(e, t)) continue; const dx = t.x - e.x, dz = t.z - e.z, d = Math.hypot(dx, dz) - t.r; if (d > range) continue; if (Math.abs(t.y - e.y) > Math.max(2.5, t.h)) continue; const dot = (dx * fx0 + dz * fz0) / (Math.hypot(dx, dz) || 1); if (dot < Math.cos(arc / 2) && d > 0.3) continue; hurt(e, t, mul, o); n++; if (o.max && n >= o.max) break; } return n; }
function aoeAt(src, x, z, r, mul, o = {}) { let n = 0; for (const t of W.ents) { if (!src ? (t.team !== (o.team ?? 1) && t.alive) : !isFoe(src, t)) continue; if (d2(t.x, t.z, x, z) > (r + t.r) ** 2) continue; if (o.yMax != null && Math.abs(t.y - (o.y ?? t.y)) > o.yMax) continue; hurt(src, t, mul, Object.assign({ fx: x, fz: z }, o)); n++; } return n; }
/* ---------- projectiles ---------- */
function shoot(o) { const p = Object.assign({ life: 2, r: 0.4, pierce: 0, hit: new Set(), grav: 0, spin: 0 }, o); if (p.mesh) { R3.scene.add(p.mesh); p.mesh.position.set(p.x, p.y, p.z); } PROJ.push(p); return p; }
function updateProj(dt) {
  for (let i = PROJ.length - 1; i >= 0; i--) {
    const p = PROJ[i]; p.life -= dt;
    if (p.homing && p.homing.alive) { const t = p.homing, dx = t.x - p.x, dy = t.y + t.h * 0.5 - p.y, dz = t.z - p.z, L = Math.hypot(dx, dy, dz) || 1, sp = Math.hypot(p.vx, p.vy, p.vz); const k = Math.min(1, dt * (p.turn || 4)); p.vx = lerp(p.vx, dx / L * sp, k); p.vy = lerp(p.vy, dy / L * sp, k); p.vz = lerp(p.vz, dz / L * sp, k); }
    p.vy -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.mesh) { p.mesh.position.set(p.x, p.y, p.z); if (p.face !== false) p.mesh.rotation.y = Math.atan2(p.vx, p.vz); if (p.spin) { p.mesh.rotation.z += p.spin * dt; p.mesh.spinA = p.mesh.rotation.z; } if (p.grow) p.mesh.scale.multiplyScalar(1 + p.grow * dt); }
    if (p.trail && Math.random() < 0.8) emit(p.x + rr(-0.15, 0.15), p.y, p.z + rr(-0.15, 0.15), rr(-0.4, 0.4), rr(-0.2, 0.4), rr(-0.4, 0.4), p.trail, rr(0.25, 0.5), 0.35);
    let dead = p.life <= 0;
    const gh = terrH(p.x, p.z); if (p.y < gh + 0.05 && !p.noGround) { dead = true; if (p.onGround) p.onGround(p); }
    if (!dead) for (const t of W.ents) {
      if (p.hit.has(t.id)) continue; if (p.owner ? !isFoe(p.owner, t) : (t.team === p.team || !t.alive)) continue;
      const dy = (t.y + t.h * 0.5) - p.y; if (d2(t.x, t.z, p.x, p.z) < (p.r + t.r) ** 2 && Math.abs(dy) < t.h * 0.6 + p.r) {
        p.hit.add(t.id); if (p.onHit) p.onHit(p, t); else hurt(p.owner, t, p.mul || 1, { kb: p.kb || 0, col: p.col, sk: p.sk });
        if (p.pierce-- <= 0) { dead = true; break; }
      }
    }
    if (dead) { if (p.onEnd) p.onEnd(p); if (p.mesh) { p.mesh.removeFromParent(); } PROJ.splice(i, 1); }
  }
}
/* ---------- ground telegraphs (painted on the ground layer) ---------- */
function tele(o) { const T = Object.assign({ t: 0, d: 1, col: 0xff3a2a }, o); TELE.push(T); return T; }
function telePath(T, K) { const p = new Path2D(); const [sx, sy] = w2s(T.x, T.z);
  if (T.shape === 'circle') p.arc(sx, sy, T.r * K, 0, TAU);
  else if (T.shape === 'ring') { p.arc(sx, sy, T.r * K, 0, TAU); p.arc(sx, sy, T.r0 * K, 0, TAU, true); }
  else if (T.shape === 'cone') { const a = scrAng(T.ang); p.moveTo(sx, sy); p.arc(sx, sy, T.r * K, a - T.arc / 2, a + T.arc / 2); p.closePath(); }
  else if (T.shape === 'line') { const a = scrAng(T.ang), c = Math.cos(a), s = Math.sin(a), w = T.w / 2 * K, L = T.len * K; p.moveTo(sx - s * w, sy + c * w); p.lineTo(sx + c * L - s * w, sy + s * L + c * w); p.lineTo(sx + c * L + s * w, sy + s * L - c * w); p.lineTo(sx + s * w, sy - c * w); p.closePath(); }
  return p; }
function drawTele(g) {
  const K = k();
  for (const T of TELE) { const kk = clamp(T.t / T.d, 0, 1), c = rgbOf(hex(T.col)), p = telePath(T, K), [sx, sy] = w2s(T.x, T.z);
    g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.16 + 0.06 * Math.sin(T.t * 18)})`; g.fill(p, 'evenodd');
    g.save(); g.clip(p, 'evenodd'); g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.32)`;
    if (T.shape === 'line') { const a = scrAng(T.ang); g.translate(sx, sy); g.rotate(a); g.fillRect(0, -T.w * K, T.len * K * kk, T.w * 2 * K); }
    else { g.beginPath(); g.arc(sx, sy, (T.r || 1) * K * kk, 0, TAU); g.fill(); }
    g.restore(); g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.85)`; g.lineWidth = 2; g.stroke(p); }
}
function inTele(T, e) {
  const dx = e.x - T.x, dz = e.z - T.z, d = Math.hypot(dx, dz);
  if (T.shape === 'circle') return d < T.r + e.r;
  if (T.shape === 'ring') return d < T.r + e.r && d > T.r0 - e.r;
  if (T.shape === 'cone') return d < T.r + e.r && Math.abs(angDiff(T.ang, Math.atan2(dx, dz))) < T.arc / 2 + 0.1;
  if (T.shape === 'line') { const lx = dx * Math.cos(T.ang) - dz * Math.sin(T.ang), lz = dx * Math.sin(T.ang) + dz * Math.cos(T.ang); return lz > -e.r && lz < T.len + e.r && Math.abs(lx) < T.w / 2 + e.r; }
  return false;
}
function updateTele(dt) {
  for (let i = TELE.length - 1; i >= 0; i--) {
    const T = TELE[i]; T.t += dt;
    if (T.t >= T.d) { if (T.onFire) T.onFire(T); if (T.mul != null) for (const e of W.ents) { if (!e.alive || e.team === T.team || e.team === 2) continue; if (inTele(T, e)) hurt(T.src, e, T.mul, { kb: T.kb, up: T.up, fx: T.x, fz: T.z, col: T.col }); }
      TELE.splice(i, 1); }
  }
}
function clearCombat() { for (const p of PROJ) p.mesh && p.mesh.removeFromParent(); PROJ.length = 0; TELE.length = 0; for (const f of FXL) f.m && f.m.removeFromParent(); FXL.length = 0; PART.n = 0; }

/* ================= particles (2D sprites; additive glows, or plain for dust) ================= */
const PART = { cap: 2400, n: 0, a: [] };
const _colCache = new Map();
function colStr(c) { if (typeof c === 'string') return c; let s = _colCache.get(c); if (!s) { const r = rgbOf(hex(c)); s = r; _colCache.set(c, s); } return s; }
function initParticles() { for (let i = 0; i < PART.cap; i++) PART.a.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, c: null, life: 0, max: 1, size: 0.3, grav: 0, g0: 0, add: true }); }
function emit(x, y, z, vx, vy, vz, col, life, size, grav = 0, add = true) {
  if (PART.n >= PART.cap) return; const p = PART.a[PART.n++]; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.c = colStr(col); p.life = life; p.max = life; p.size = size; p.grav = grav; p.g0 = TER.h ? terrH(x, z) : 0; p.add = add;
}
function updateParticles(dt) {
  const A = PART.a; for (let i = 0; i < PART.n; i++) { const p = A[i]; p.life -= dt; if (p.life <= 0) { PART.n--; A[i] = A[PART.n]; A[PART.n] = p; i--; continue; } p.vy -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < p.g0 && p.grav > 0) { p.y = p.g0; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; } }
}
function drawParticles(g) {
  const K = k(), A = PART.a; if (!PART.n) return;
  g.save(); for (let pass = 0; pass < 2; pass++) { g.globalCompositeOperation = pass ? 'lighter' : 'source-over';
    for (let i = 0; i < PART.n; i++) { const p = A[i]; if (p.add !== !!pass) continue; const [sx, sy] = w2s(p.x, p.z, p.y - p.g0); if (sx < -40 || sy < -40 || sx > V.W + 40 || sy > V.H + 40) continue; const f = p.life / p.max, r = Math.max(1, p.size * K * (pass ? 0.3 : 0.45 * (0.6 + (1 - f) * 0.8))), c = p.c;
      if (pass) { g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, f * 1.6) * 0.55})`; g.beginPath(); g.arc(sx, sy, r * 1.6, 0, TAU); g.fill(); g.fillStyle = `rgba(255,255,255,${Math.min(1, f * 1.6) * 0.75})`; g.beginPath(); g.arc(sx, sy, r * 0.5, 0, TAU); g.fill(); }
      else { g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${f * 0.55})`; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill(); } } }
  g.restore();
}
function hitSpark(x, y, z, col, n = 10) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, b = rr(-0.5, 1), s = rr(3, 8); emit(x, y, z, Math.cos(a) * s, b * s, Math.sin(a) * s * 0.6, col, rr(0.2, 0.45), rr(0.12, 0.28), 12); } FXL.push({ t: 0, life: 0.18, x, y, z, draw: (g, f, kk) => { const [sx, sy] = w2s(f.x, f.z, f.y - terrH(f.x, f.z)), K = k(); g.save(); g.globalCompositeOperation = 'lighter'; g.translate(sx, sy); g.rotate(f.x * 7); const c = colStr(col); g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${1 - kk})`; const r = (0.4 + kk * 0.6) * K; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr2 = i % 2 ? r * 0.25 : r; g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } g.closePath(); g.fill(); g.restore(); } }); }
function puff(x, y, z, col, n = 4, size = 0.5) { for (let i = 0; i < n; i++) emit(x + rr(-0.2, 0.2), y + rr(-0.2, 0.2), z + rr(-0.2, 0.2), rr(-0.5, 0.5), rr(0, 1), rr(-0.5, 0.5), col, rr(0.4, 0.8), size * rr(0.7, 1.3), -1); }
function dust(x, y, z, n = 8) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = rr(1, 3); emit(x, y + 0.1, z, Math.cos(a) * s, rr(0.3, 1.2), Math.sin(a) * s * 0.6, 0xb8a888, rr(0.5, 0.9), rr(0.6, 1.1), 1.5, false); } }
function burst(x, y, z, col, n = 30, sp = 6, size = 0.4) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, b = rnd() * PI - HP, s = rr(0.4, 1) * sp; emit(x, y, z, Math.cos(a) * Math.cos(b) * s, Math.sin(b) * s, Math.sin(a) * Math.cos(b) * s * 0.6, col, rr(0.4, 0.9), size * rr(0.6, 1.4), 2); } }
/* ---------- timed effects: either a scene object (m) or a direct painter (draw) ---------- */
function fx(m, life, upd) { R3.scene.add(m); const f = { m, t: 0, life, upd }; FXL.push(f); return f; }
function fxDraw(life, o) { const f = Object.assign({ t: 0, life }, o); FXL.push(f); return f; }
function updateFX(dt) { for (let i = FXL.length - 1; i >= 0; i--) { const f = FXL[i]; f.t += dt; const kk = f.t / f.life; if (f.upd) f.upd(f, Math.min(1, kk), dt); if (kk >= 1) { if (f.m) f.m.removeFromParent(); FXL.splice(i, 1); } } }
function queueFX() { for (const f of FXL) { if (!f.draw) continue; const kk = Math.min(1, f.t / f.life); queue(f.zq ?? f.z ?? 0, g => f.draw(g, f, kk), f.layer ?? 2); } }
function ringFX(x, y, z, col, r0, r1, life = 0.5, w = 0.25) { return fxDraw(life, { x, z, layer: 0, draw: (g, f, kk) => { const [sx, sy] = w2s(x, z), K = k(), r = lerp(r0, r1, smooth(kk)) * K, c = colStr(col); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.9 * (1 - kk)})`; g.lineWidth = Math.max(2, w * K * (1 - kk * 0.5)); g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.stroke(); g.lineWidth = Math.max(1, w * K * 0.3); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - kk)})`; g.stroke(); g.restore(); } }); }
function pillarFX(x, y, z, col, h = 8, life = 1.2, r = 0.8) { return fxDraw(life, { x, z, zq: z + 0.01, layer: 1, draw: (g, f, kk) => { const [sx, sy] = w2s(x, z), K = k(), c = colStr(col), a = Math.sin(kk * PI), rw = r * K * (1 + kk * 0.5), H = h * K; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, sy, 0, sy - H); gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.6 * a})`); gr.addColorStop(0.7, `rgba(${c[0]},${c[1]},${c[2]},${0.25 * a})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); g.fillStyle = gr; g.fillRect(sx - rw, sy - H, rw * 2, H); g.fillStyle = `rgba(255,255,255,${0.35 * a})`; g.fillRect(sx - rw * 0.3, sy - H * 0.8, rw * 0.6, H * 0.8); g.beginPath(); g.ellipse(sx, sy, rw * 1.3, rw * 0.5, 0, 0, TAU); g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.4 * a})`; g.fill(); g.restore(); } }); }
/* ================= XP / levels (party share one level, as the user asked: grow together) ================= */
const PARTY = { lv: 1, xp: 0, sp: 0, skills: {}, items: {}, gold: 0, form: 'rongling', pname: '', flags: {}, kills: {} };
function gainXP(n, src) {
  if (NETROLE === 'guest') return;
  PARTY.xp += Math.round(n); floatXP(n);
  let need = BAL.xpCurve(PARTY.lv);
  while (PARTY.xp >= need && PARTY.lv < (W.zone?.lvCap || 99)) { PARTY.xp -= need; PARTY.lv++; PARTY.sp++; need = BAL.xpCurve(PARTY.lv); levelUp(); }
  if (PARTY.lv >= (W.zone?.lvCap || 99)) PARTY.xp = Math.min(PARTY.xp, need - 1);
  hudDirty();
}
function levelUp() {
  for (const p of W.P) if (p) { p.lv = PARTY.lv; applyStats(p); p.hp = p.hpMax; p.mp = p.mpMax; pillarFX(p.x, p.y, p.z, 0xffd86a, 10, 1.6, 1.2); burst(p.x, p.y + 1, p.z, 0xffe08a, 40, 6, 0.5); }
  sfx('levelup'); banner(`境界提升 · ${PARTY.lv} 级`, '气血、力量与符力都增强了'); say(`【系统】队伍升到了 ${PARTY.lv} 级，获得 1 点宝术点（按 K 打开宝术）。`, '#ffd86a');
  netEv({ k: 'lv', lv: PARTY.lv });
  STORY.onLevel && STORY.onLevel(PARTY.lv);
}
/* ---------- loot ---------- */
const ITEMS = {
  meat: { name: '兽肉', icon: '🍖', desc: '烤一烤能恢复气血。', use: e => { heal(e, e.hpMax * 0.35); }, stack: 99 },
  milk: { name: '百兽奶', icon: '🥛', desc: '火虎乳、月犀奶、龙角象汁……混在一起的百兽奶最好吃。恢复大量气血与符力。小不点坚持说自己“在喝水”。', use: e => { heal(e, e.hpMax * 0.6); e.mp = Math.min(e.mpMax, e.mp + 40); }, stack: 20 },
  berry: { name: '红浆果', icon: '🍒', desc: '晶莹的红浆果，像一颗颗红玛瑙。林虎叔最常给小不点摘。恢复少量气血。', use: e => heal(e, e.hpMax * 0.2), stack: 99 },
  yaosan: { name: '药散', icon: '🧪', desc: '药浴剩下的药液熬成的药散，是补药也是疗伤药，狩猎时带着救命。', use: e => { heal(e, e.hpMax * 0.5); addBuff(e, { id: 'yaosan', d: 8, dr: 0.15, name: '药力' }); }, stack: 20 },
  hide: { name: '兽皮', icon: '🟫', desc: '猛兽的皮，可以交给村里的大婶们。', stack: 99 },
  fang: { name: '兽牙', icon: '🦷', desc: '打磨后能串成手串。', stack: 99 },
  bone: { name: '兽骨', icon: '🦴', desc: '族长熬药要用到的骨头。', stack: 99 },
  blood: { name: '凶兽真血', icon: '🩸', desc: '有灵性的猎物身上提炼的血精，一头猛兽最后只得一滴。为五岁洗礼积攒。', stack: 99 },
  scale: { name: '青鳞', icon: '💠', desc: '婴儿巴掌大的青色鳞片，锋利如刀。', stack: 99 },
  arrow: { name: '铁箭', icon: '🏹', desc: '狈村的一米三长铁箭。', stack: 99 },
  herb: { name: '药草', icon: '🌿', desc: '山林里的药草。', stack: 99 },
  egg: { name: '青鳞鹰卵', icon: '🥚', desc: '水盆大、碧玉般带斑纹的蛋，蛋壳上有破碎的符文。', stack: 3 },
};
function addItem(id, n = 1, quiet) { PARTY.items[id] = (PARTY.items[id] || 0) + n; if (!quiet) { const it = ITEMS[id]; say(`获得 ${it ? it.icon + it.name : id} ×${n}`, '#c8e0ff'); } hudDirty(); STORY.onItem && STORY.onItem(id); netEv({ k: 'items', items: PARTY.items }); }
function hasItem(id, n = 1) { return (PARTY.items[id] || 0) >= n; }
function takeItem(id, n = 1) { if (!hasItem(id, n)) return false; PARTY.items[id] -= n; if (!PARTY.items[id]) delete PARTY.items[id]; hudDirty(); netEv({ k: 'items', items: PARTY.items }); return true; }
function useItem(id) { const it = ITEMS[id], me = W.P[W.me]; if (!it || !it.use || !hasItem(id) || !me || !me.alive) return; if ((me.cds.item || 0) > 0) { toast('物品冷却中'); return; } if (NETROLE === 'guest') { netSendCtl({ t: 'use', id }); return; } takeItem(id); it.use(me); me.cds.item = 3; sfx('drink'); if (me.R.kind === 'human') { me.A.pose = 'drink'; setTimeout(() => { if (me.A.pose === 'drink') me.A.pose = null; }, 900); } }
function dropLoot(e) {
  if (!e.loot) return; const got = [];
  for (const L of e.loot) { if (rnd() < (L.p ?? 1)) { const n = L.n ? ri(L.n[0], L.n[1]) : 1; got.push([L.id, n]); } }
  if (got.length) { const bag = { x: e.x, y: e.y, z: e.z, items: got, t: 0 }; LOOTS.push(bag); bag.mesh = lootMesh(); bag.mesh.position.set(e.x, groundH(e.x, e.z), e.z); R3.scene.add(bag.mesh); }
}
const LOOTS = [];
function updateLoot(dt) {
  for (let i = LOOTS.length - 1; i >= 0; i--) { const L = LOOTS[i]; L.t += dt; 
    for (const p of W.P) { if (!p || !p.alive) continue; if (d2(p.x, p.z, L.x, L.z) < BAL.lootR ** 2 || L.t > 30) { for (const [id, n] of L.items) addItem(id, n); sfx('loot'); L.mesh.removeFromParent(); LOOTS.splice(i, 1); break; } } }
}
