/* =================== hero kits: shared host logic =================== */
const PK = ['bolt', 'orb', 'fireball', 'arrow', 'tarrow', 'parrow', 'flask', 'shell', 'knife'];
const PRED_KINDS = new Set(['bolt', 'orb', 'parrow', 'flask']); // guest predicts these locally
const costFor = (p, k) => Math.round(TRAPS[k].cost * (p && p.hero === 'ranger' ? 0.85 : 1));
function spawnProj(o) { const q = Object.assign({id: G.nid++, team: 'p', r: 6, pierce: 0, hit: []}, o); q.L = q.life; G.projs.push(q); return q; }

function heroFire(p, m) {
  const H = HEROES[p.hero], a = +m.a || 0, mul = heroDmgMul(p);
  if (m.w != null) p.wpn = m.w ? 1 : 0; const Pr = primOf(p);
  p.atk = 0.3;
  if (Pr.kind === 'melee') { meleeSwing(p, a, Pr, mul); return; }
  if (Pr.kind === 'chain') { chainFire(p, a, Pr, mul); return; }
  const ox = Math.cos(a) * 22, oy = Math.sin(a) * 22 - 26;
  if (Pr.kind === 'flask') {
    const d = clamp(Math.hypot(+m.x - p.x, +m.y - p.y), 40, Pr.max);
    spawnProj({k: 'flask', x: p.x + ox, y: p.y + oy + 26, vx: Math.cos(a) * Pr.speed, vy: Math.sin(a) * Pr.speed, life: d / Pr.speed, dmg: Pr.dmg * mul, own: p.i, r: Pr.r, lob: 1, pred: 1, burn: Pr.burn || 0});
  } else { const n = Pr.n || 1; for (let k = 0; k < n; k++) { const b = a + (n > 1 ? (k - (n - 1) / 2) * Pr.spread / (n - 1) : 0); spawnProj({k: Pr.kind, x: p.x + Math.cos(b) * 22, y: p.y - 26 + Math.sin(b) * 22, vx: Math.cos(b) * Pr.speed, vy: Math.sin(b) * Pr.speed, life: Pr.life, dmg: Pr.dmg * mul, own: p.i, r: Pr.kind === 'orb' ? 8 : 6, pierce: Pr.pierce || 0, pred: 1}); } }
  if (p.i !== MEI) ev('pfire', {p: p.i});
}
function meleeSwing(p, a, Pr, mul) {
  p.cmb = ((p.cmb || 0) % (Pr.combo || 1)) + 1; const fin = !!Pr.combo && p.cmb === Pr.combo;
  const dmg = Pr.dmg * mul * (fin ? 2 : 1), push = fin ? 300 : (Pr.push || 60);
  let hit = 0;
  for (const e of G.enemies) {
    if (!alive(e) || e.charm > 0) continue; const D = ORCS[e.type];
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > Pr.range + D.r) continue; if (d > 20 && Math.abs(angDiff(a, Math.atan2(dy, dx))) > Pr.arc) continue;
    hurtEnemy(e, dmg, {p: p.i}); if (alive(e)) pushImpulse(e, dx / (d || 1), dy / (d || 1), push); hit++;
  }
  ev('swing', {p: p.i, a: +a.toFixed(2), c: fin ? 1 : 0, h: hit ? 1 : 0});
}
function heroAlt(p, m) {
  const H = HEROES[p.hero], A = H.alt, a = +m.a || 0, mul = heroDmgMul(p);
  switch (p.hero) {
    case 'paladin':
      p.guard = A.dur;
      for (const e of G.enemies) if (alive(e) && !ORCS[e.type].boss && e.charm <= 0 && dist2(e.x, e.y, p.x, p.y) < A.taunt * A.taunt) e.taunt = {i: p.i, t: A.dur};
      ev('guard', {p: p.i, x: Math.round(p.x), y: Math.round(p.y)}); return '';
    case 'ranger':
      for (let k = 0; k < A.n; k++) { const b = a + (k - (A.n - 1) / 2) * A.spread / (A.n - 1); spawnProj({k: 'parrow', x: p.x + Math.cos(b) * 20, y: p.y - 26 + Math.sin(b) * 20, vx: Math.cos(b) * 1000, vy: Math.sin(b) * 1000, life: 0.55, dmg: A.dmg * mul, own: p.i, pierce: 1}); }
      ev('volley', {p: p.i, x: Math.round(p.x), y: Math.round(p.y)}); return '';
    case 'alch': {
      const mine = G.turrets.filter(t => t.own === p.i); if (mine.length >= A.max) { mine[0].t = 0; }
      let tx = p.x + Math.cos(a) * 36, ty = p.y + Math.sin(a) * 36; if (blockedAt(tx, ty, 14, solidWalk)) { tx = p.x; ty = p.y; }
      G.turrets.push({id: G.nid++, own: p.i, x: tx, y: ty, t: A.dur, cd: 0.4, dir: dirOf(a), mul});
      ev('turret', {x: Math.round(tx), y: Math.round(ty)}); return ''; }
    case 'blade':
      for (let k = 0; k < A.n; k++) { const b = a + (k - 1) * 0.14; spawnProj({k: 'knife', x: p.x + Math.cos(b) * 18, y: p.y - 24 + Math.sin(b) * 18, vx: Math.cos(b) * A.speed, vy: Math.sin(b) * A.speed, life: 0.6, dmg: A.dmg * mul, own: p.i, pierce: A.pierce}); }
      ev('knives', {p: p.i, x: Math.round(p.x), y: Math.round(p.y)}); return '';
  }
  return 'none';
}
function heroSkill(p, m) {
  const H = HEROES[p.hero], S = H.skill, a = +m.a || 0, mul = heroDmgMul(p);
  switch (p.hero) {
    case 'paladin': {
      const cx = p.x + Math.cos(a) * 40, cy = p.y + Math.sin(a) * 40;
      ev('judg', {x: Math.round(cx), y: Math.round(cy)}); FXT.stop = Math.max(FXT.stop, 0.05);
      for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const d = Math.hypot(e.x - cx, e.y - cy); if (d > S.r + ORCS[e.type].r) continue; hurtEnemy(e, S.dmg * mul, {p: p.i}); if (alive(e)) { e.stun = Math.max(e.stun, S.stun * (ORCS[e.type].boss ? 0.4 : 1)); e.act = null; } }
      return ''; }
    case 'ranger':
      G.pets = G.pets.filter(f => f.own !== p.i);
      G.pets.push({id: G.nid++, own: p.i, x: p.x, y: p.y - 60, t: S.dur, cd: 0, a: 0, tgt: -1, dps: S.dps * mul});
      ev('falcon', {p: p.i, x: Math.round(p.x), y: Math.round(p.y)}); return '';
    case 'alch': {
      const d = clamp(Math.hypot(+m.x - p.x, +m.y - p.y), 0, 360), tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d;
      G.zones.push({id: G.nid++, k: 'fog', x: tx, y: ty, r: S.r, t: S.dur, T: S.dur, own: p.i, heal: S.heal, dps: S.dps * mul});
      ev('fog', {x: Math.round(tx), y: Math.round(ty)}); return ''; }
    case 'blade':
      p.spin = S.dur; p.spinT = 0;
      ev('storm', {p: p.i}); return '';
  }
  return 'none';
}
function heroDash(p, m) {
  const H = HEROES[p.hero], Dd = H.dash, mul = heroDmgMul(p);
  p.inv = Math.max(p.inv, 0.3);
  const x0 = +m.x0 || p.x, y0 = +m.y0 || p.y, x1 = +m.x || p.x, y1 = +m.y || p.y;
  if (Dd.dmg) { // paladin charge / blade shadow step: hit along the segment
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const rx = e.x - x0, ry = e.y - y0, along = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux); if (along < -20 || along > L + 20 || lat > 34 + ORCS[e.type].r) continue; hurtEnemy(e, Dd.dmg * mul, {p: p.i}); if (alive(e) && p.hero === 'paladin') { const sgn = (rx * uy - ry * ux) > 0 ? 1 : -1; pushImpulse(e, uy * sgn * 0.7 + ux * 0.7, -ux * sgn * 0.7 + uy * 0.7, 360); } }
  }
  if (p.hero === 'alch') G.zones.push({id: G.nid++, k: 'smoke', x: x0, y: y0, r: 90, t: 3, T: 3, own: p.i, slow: Dd.slow});
  ev('dash', {p: p.i, x: Math.round(x1), y: Math.round(y1), x0: Math.round(x0), y0: Math.round(y0), h: p.hero});
  return '';
}
/* ---------- turrets, falcons, zones, auras (host tick) ---------- */
function updHeroStuff(dt) {
  for (const z of G.zones) {
    z.t -= dt;
    for (const e of G.enemies) { if (!alive(e) || e.charm > 0 || dist2(e.x, e.y, z.x, z.y) > z.r * z.r) continue; if (z.k === 'smoke') e.slowF = Math.min(e.slowF, 1 - z.slow); else if (!ORCS[e.type].fly || z.k === 'fog') hurtEnemy(e, z.dps * dt, {p: z.own}, true); }
    if (z.k === 'fog') for (const p of P) if (p && !p.dead && dist2(p.x, p.y, z.x, z.y) < z.r * z.r) p.hp = Math.min(p.mhp, p.hp + p.mhp * z.heal * dt);
  }
  G.zones = G.zones.filter(z => z.t > 0);
  for (const tu of G.turrets) {
    tu.t -= dt; tu.cd -= dt; const A = HEROES.alch.alt;
    if (tu.cd > 0) continue;
    let best = null, bd = A.range * A.range;
    for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const d = dist2(e.x, e.y, tu.x, tu.y); if (d < bd && los(tu.x, tu.y - 20, e.x, e.y - 14)) { bd = d; best = e; } }
    if (best) { const D = ORCS[best.type], ey = best.y - (D.fly ? 40 : D.r); const a = Math.atan2(ey - (tu.y - 30), best.x - tu.x); tu.dir = dirOf(a); tu.cd = 1 / A.rate;
      spawnProj({k: 'shell', x: tu.x + Math.cos(a) * 24, y: tu.y - 30 + Math.sin(a) * 24, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, life: 0.6, dmg: A.dmg * (tu.mul || 1), own: tu.own, r: 5}); ev('tshot', {x: Math.round(tu.x), y: Math.round(tu.y)}); }
  }
  for (const tu of G.turrets) if (tu.t <= 0) ev('poof', {x: Math.round(tu.x), y: Math.round(tu.y - 20)});
  G.turrets = G.turrets.filter(t => t.t > 0);
  for (const f of G.pets) {
    f.t -= dt; f.cd -= dt; const o = P[f.own];
    let tgt = enemyById(f.tgt); if (!tgt || !alive(tgt) || tgt.charm > 0) tgt = null;
    if (!tgt && o) { let bd = 420 * 420; for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const d = dist2(e.x, e.y, o.x, o.y) * (ORCS[e.type].fly ? 0.4 : 1); if (d < bd) { bd = d; tgt = e; } } f.tgt = tgt ? tgt.id : -1; }
    let tx, ty;
    if (tgt) { tx = tgt.x; ty = tgt.y - 50; } else if (o) { f.a += dt * 2.2; tx = o.x + Math.cos(f.a) * 60; ty = o.y - 70 + Math.sin(f.a) * 25; } else { tx = f.x; ty = f.y; }
    const dx = tx - f.x, dy = ty - f.y, L = Math.hypot(dx, dy); const sp = Math.min(L, 460 * dt); if (L > 0.1) { f.x += dx / L * sp; f.y += dy / L * sp; f.dir = Math.atan2(dy, dx); }
    if (tgt && L < 26 && f.cd <= 0) { f.cd = 0.45; hurtEnemy(tgt, f.dps * 0.45, {p: f.own}); }
  }
  G.pets = G.pets.filter(f => f.t > 0);
}
function updPlayerKit(p, dt) { // host: per-player timers for guard / storm / aura
  p.guard = Math.max(0, (p.guard || 0) - dt); p.atk = Math.max(0, (p.atk || 0) - dt);
  if (p.spin > 0) {
    p.spin -= dt; p.spinT = (p.spinT || 0) - dt; const S = HEROES.blade.skill;
    if (p.spinT <= 0) { p.spinT += S.tick; let n = 0; for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; if (dist2(e.x, e.y, p.x, p.y) < Math.pow(S.r + ORCS[e.type].r, 2)) { hurtEnemy(e, S.dmg * heroDmgMul(p), {p: p.i}); n++; } } }
  }
  if (p.hero === 'paladin' && !p.dead) for (const q of P) if (q && q !== p && !q.dead && dist2(q.x, q.y, p.x, p.y) < 200 * 200) q.hp = Math.min(q.mhp, q.hp + q.mhp * 0.02 * dt);
}

/* ---------- drawing for kit objects ---------- */
function drawZone(g, z, now) {
  const k = z.T ? clamp(z.t / z.T, 0, 1) : 1, fade = Math.min(1, k * 4, (1 - k) * 8 + 0.2);
  g.save(); g.globalAlpha = 0.55 * fade;
  const gr = g.createRadialGradient(z.x, z.y, z.r * 0.1, z.x, z.y, z.r);
  if (z.k === 'fog') { gr.addColorStop(0, 'rgba(140,255,120,.55)'); gr.addColorStop(0.7, 'rgba(70,200,90,.3)'); gr.addColorStop(1, 'rgba(40,160,60,0)'); }
  else { gr.addColorStop(0, 'rgba(170,170,180,.7)'); gr.addColorStop(1, 'rgba(120,120,130,0)'); }
  g.fillStyle = gr; g.beginPath(); g.ellipse(z.x, z.y, z.r, z.r * 0.72, 0, 0, TAU); g.fill();
  g.globalAlpha = 0.35 * fade;
  for (let i = 0; i < 5; i++) { const a = now * 0.6 + i * 1.26 + z.id, rr = z.r * (0.35 + 0.12 * Math.sin(now + i)); g.fillStyle = z.k === 'fog' ? '#9dff8a' : '#c8c8d2'; g.beginPath(); g.arc(z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr * 0.7, z.r * 0.28, 0, TAU); g.fill(); }
  g.restore();
  if (z.k === 'fog' && Math.random() < 0.3) fx({k: 'p', x: z.x + rnd(-z.r, z.r) * 0.7, y: z.y + rnd(-z.r, z.r) * 0.5, vy: -40, life: 0.8, col: '#b6ff9a', s: 2.4});
}
function drawTurret(g, tu, now) {
  shadow(g, tu.x, tu.y, 16, 0.35);
  drawProp(g, 'turret_0_' + (tu.dir || 2), tu.x, tu.y + 4, 0.75);
  if (tu.t < 3 && Math.floor(now * 8) % 2) { g.globalAlpha = 0.4; g.fillStyle = '#fff'; g.beginPath(); g.arc(tu.x, tu.y - 30, 6, 0, TAU); g.fill(); g.globalAlpha = 1; }
}
function drawFalcon(g, f, now) {
  const fl = Math.sin(now * 18 + f.id) * 0.7;
  shadow(g, f.x, f.y + 60, 8, 0.2);
  g.save(); g.translate(f.x, f.y); g.rotate((f.dir || 0) + Math.PI / 2);
  g.fillStyle = '#7a5a3a'; g.strokeStyle = '#2a1a10'; g.lineWidth = 1;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(s * 14, -10 - fl * 6, s * 22, 2 + fl * 4); g.quadraticCurveTo(s * 12, 2, 0, 6); g.fill(); g.stroke(); }
  g.fillStyle = '#5a3d24'; g.beginPath(); g.ellipse(0, 2, 4.5, 10, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(0, -8, 4, 0, TAU); g.fill(); g.fillStyle = '#f2b23a'; g.beginPath(); g.moveTo(-1.5, -12); g.lineTo(1.5, -12); g.lineTo(0, -15.5); g.fill();
  g.fillStyle = '#5a3d24'; g.beginPath(); g.moveTo(-4, 11); g.lineTo(4, 11); g.lineTo(0, 17); g.fill();
  g.restore();
}

/* ---------- skill icon glyphs per hero ---------- */
const SKICON = {
  warmage: {alt: ['#fff1c8', '#c08a2a', 'waves'], skill: ['#ffd06a', '#c2300e', 'fire'], dash: ['#f0e0c0', '#6b4d2e', 'dash']},
  sorc: {alt: ['#ffc4f0', '#a0207a', 'heart'], skill: ['#dff8ff', '#2a7ac0', 'snow'], dash: ['#c8f6ff', '#3a3aa0', 'dash']},
  paladin: {alt: ['#d8e6ff', '#2a58b8', 'shield'], skill: ['#fff3c0', '#c89a2a', 'hammer'], dash: ['#e6eef8', '#4a5a78', 'dash']},
  ranger: {alt: ['#e6ffd6', '#3f7a3a', 'fan'], skill: ['#f2e2c4', '#7a5a3a', 'bird'], dash: ['#dff0d6', '#2f4f2c', 'back']},
  alch: {alt: ['#ffe2b0', '#b8642e', 'turret'], skill: ['#d6ffcc', '#2f9a3a', 'cloud'], dash: ['#e0e0e6', '#5a5a66', 'dash']},
  blade: {alt: ['#ffe0e0', '#a52a2a', 'knives'], skill: ['#fff0f0', '#7a161b', 'spin'], dash: ['#f0e6f0', '#3a2a3a', 'dash']},
};
