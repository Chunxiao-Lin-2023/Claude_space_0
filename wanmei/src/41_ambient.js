/* ================= ambient wildlife: rabbits that bolt into their warrens, crows that land and scatter,
   butterflies over the meadows by day and fireflies at night. Cheap, local, purely visual. ================= */
const CRIT = { list: [], spr: new Map(), crowT: 4, lamps: [] };
function critSprite(kind, f, flip) {
  const key = kind + f + (flip < 0 ? 'L' : 'R'); let S = CRIT.spr.get(key); if (S) return S;
  const k = 4, W = 22, H = 20, ax = 11, ay = 17, hi = cnv(W * k, H * k), g = hi.getContext('2d'); g.translate(ax * k, ay * k); g.scale(k * flip, k); LW = 0.32;
  const ink = (p, w = 1) => { g.strokeStyle = '#1a1210'; g.lineWidth = 0.45 * w; g.lineJoin = 'round'; g.stroke(p); };
  if (kind === 'rabbit') { // brown with long ears, a white puff tail; sit / hop
    const hop = f === 1, by = hop ? -4.2 : -3.4;
    const tail = ellP(hop ? -6 : -5, by + 0.2, 1.5, 1.4); g.fillStyle = '#f4efe4'; g.fill(tail); ink(tail);
    if (hop) { const lg = smoothP([[-3, by + 1.5], [-7.5, by + 3.4], [-6.5, by + 4], [-2, by + 2.6]], true, 0.3); g.fillStyle = '#8a6440'; g.fill(lg); ink(lg); }
    const body = ellP(-1, by, hop ? 5 : 4.3, hop ? 2.7 : 3.4); g.fillStyle = '#a77c52'; g.fill(body); g.save(); g.clip(body); g.fillStyle = '#e8d8bc'; g.beginPath(); g.ellipse(0.5, by + 2.6, 3.2, 1.6, 0, 0, TAU); g.fill(); g.restore(); ink(body);
    if (!hop) { const ft = ellP(1.2, -0.7, 2.2, 0.8); g.fillStyle = '#8a6440'; g.fill(ft); ink(ft); }
    else { const fl = smoothP([[2.5, by + 1.6], [5.5, by + 3.6], [4.6, by + 4.2], [1.8, by + 2.6]], true, 0.3); g.fillStyle = '#8a6440'; g.fill(fl); ink(fl); }
    const hx = hop ? 4.6 : 3.4, hy = hop ? by - 1.6 : by - 3; for (const [dx, a, c] of [[-0.9, -0.5, '#8a6440'], [0.4, -0.25, '#a77c52']]) { g.save(); g.translate(hx + dx, hy - 1.4); g.rotate(a + (hop ? -0.5 : 0)); const e = ellP(0, -3, 0.9, 3.1); g.fillStyle = c; g.fill(e); ink(e); g.fillStyle = '#e8a0a0'; g.beginPath(); g.ellipse(0, -3, 0.35, 2, 0, 0, TAU); g.fill(); g.restore(); }
    const hd = ellP(hx, hy, 2.6, 2.3); g.fillStyle = '#a77c52'; g.fill(hd); ink(hd); g.fillStyle = '#120c0a'; g.fillRect(hx + 0.8, hy - 1, 1, 1.1); g.fillStyle = '#e88a8a'; g.fillRect(hx + 2.1, hy + 0.2, 0.6, 0.6);
  } else if (kind === 'crow') { // black bird: stand / peck / flap up / flap down
    const fly = f >= 2, by = fly ? -9 : -4;
    if (!fly) { g.strokeStyle = '#1a1210'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-0.5, by + 2.5); g.lineTo(-0.8, 0); g.moveTo(0.8, by + 2.5); g.lineTo(1, 0); g.stroke(); }
    const tl = smoothP([[-3, by - 0.4], [-7, by + 1.2], [-6.6, by + 2.2], [-2.6, by + 1.2]], true, 0.3); g.fillStyle = '#2a2632'; g.fill(tl); ink(tl);
    const body = ellP(0, by, 3.6, 2.4); g.fillStyle = '#2e2a38'; g.fill(body); ink(body);
    if (fly) { const up = f === 2; const w = smoothP(up ? [[-1.5, by - 1], [-3.5, by - 7], [1.5, by - 6], [1.5, by - 1]] : [[-1.5, by + 0.5], [-4, by + 6], [1.5, by + 5], [1.5, by + 0.5]], true, 0.35); g.fillStyle = '#3a3646'; g.fill(w); ink(w); }
    else { const w = smoothP([[-2.4, by - 1], [1.8, by - 1.2], [1.2, by + 1], [-3.6, by + 1.2]], true, 0.4); g.fillStyle = '#3a3646'; g.fill(w); ink(w, 0.8); }
    const peck = f === 1, hx = peck ? 3.8 : 3.2, hy = peck ? by + 1.6 : by - 1.8; const hd = ellP(hx, hy, 1.8, 1.6); g.fillStyle = '#2e2a38'; g.fill(hd); ink(hd); const bk = smoothP([[hx + 1.4, hy - 0.5], [hx + 3.6, hy + (peck ? 1.4 : 0.2)], [hx + 1.4, hy + 0.6]], true, 0.1); g.fillStyle = '#5a5060'; g.fill(bk); ink(bk, 0.7); g.fillStyle = '#e8e0d0'; g.fillRect(hx + 0.4, hy - 0.8, 0.9, 0.9);
  }
  const px = pixelize(hi, k, { colors: 10, aT: 0.4 }); S = { cv: px.canvas(), ax, ay }; CRIT.spr.set(key, S); return S;
}
function critNear(x, z, r) { for (const p of W.P) if (p && p.alive !== false && d2(x, z, p.x, p.z) < r * r) return p; return null; }
function openAt(x, z) { return typeof forestDens === 'function' ? 1 - forestDens(x, z) : 0.5; }
function spawnCrit(c) { c.t = c.t || 0; c.y = c.y || 0; c.flip = c.flip || 1; c.f = 0; CRIT.list.push(c); return c; }
function updateCrits(dt) {
  if (!W.P || !W.P[0] || !TER.h) return; const day = LCUR.dark < 0.25, cx = V.cx, cz = V.cz, view = 34;
  // rabbits live in warrens near the camera
  if (typeof RABBIT_HOLES !== 'undefined') for (const h of RABBIT_HOLES) {
    const near = d2(h.x, h.z, cx, cz) < (view + 10) ** 2; h.cool = Math.max(0, (h.cool || 0) - dt);
    if (near && !h.out && h.cool <= 0 && day && !critNear(h.x, h.z, 10)) { h.out = 1 + (hash2(h.x | 0, h.z | 0) < 0.5 ? 1 : 0); for (let i = 0; i < h.out; i++) spawnCrit({ k: 'rabbit', x: h.x, z: h.z + 0.2, hole: h, st: 'graze', wait: rr(0.5, 2), tx: h.x, tz: h.z }); }
  }
  // crows drift in from the edge of the screen and land in the open
  CRIT.crowT -= dt; if (day && CRIT.crowT <= 0) { CRIT.crowT = rr(10, 18); const n = CRIT.list.filter(c => c.k === 'crow').length; if (n < 3) { for (let t = 0; t < 8; t++) { const x = cx + rr(-14, 14), z = cz + rr(-8, 8); if (openAt(x, z) > 0.6 && pathAt(x, z) < 0.5 && waterAt(x, z) < terrH(x, z) - 0.5 && !critNear(x, z, 9) && !liftAt(x, z)) { const m = 1 + (Math.random() * 3 | 0); for (let i = 0; i < m; i++) { const lx = x + rr(-1.5, 1.5), lz = z + rr(-1, 1), sx = lx + (Math.random() < 0.5 ? -22 : 22); spawnCrit({ k: 'crow', x: sx, z: lz - 6, y: 9, st: 'in', tx: lx, tz: lz, flip: sx < lx ? 1 : -1, wait: rr(1, 3) }); } break; } } } }
  // butterflies by day, fireflies by night
  const nb = CRIT.list.filter(c => c.k === 'fly').length; if (day && nb < 5) { const x = cx + rr(-16, 16), z = cz + rr(-9, 9); if (openAt(x, z) > 0.5 && !liftAt(x, z)) spawnCrit({ k: 'fly', x, z, y: rr(0.6, 1.4), hx: x, hz: z, col: ['#ffe060', '#ffffff', '#ff9ab8', '#a0c8ff', '#ffb040'][Math.random() * 5 | 0], ph: Math.random() * 10 }); }
  const nf = CRIT.list.filter(c => c.k === 'glow').length; if (!day && nf < 16) { const x = cx + rr(-17, 17), z = cz + rr(-10, 10); if (!liftAt(x, z)) spawnCrit({ k: 'glow', x, z, y: rr(0.4, 2), hx: x, hz: z, ph: Math.random() * 10 }); }
  for (let i = CRIT.list.length - 1; i >= 0; i--) {
    const c = CRIT.list[i]; c.t += dt; let gone = false;
    if (c.k === 'rabbit') {
      const thr = critNear(c.x, c.z, 6.5); if (thr && c.st !== 'flee') { c.st = 'flee'; c.tx = c.hole.x; c.tz = c.hole.z; }
      const spd = c.st === 'flee' ? 7.5 : 2.2;
      if (c.st === 'graze') { c.wait -= dt; if (c.wait <= 0) { c.st = 'hop'; const a = Math.random() * TAU, r = rr(1, 5.5); c.tx = c.hole.x + Math.cos(a) * r; c.tz = c.hole.z + Math.sin(a) * r * 0.8; } c.f = Math.floor(c.t * 2) % 7 === 0 ? 0 : 0; c.y = 0; }
      if (c.st === 'hop' || c.st === 'flee') { const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz), st = Math.min(d, spd * dt); if (d > 0.05) { c.x += dx / d * st; c.z += dz / d * st; if (Math.abs(dx) > 0.05) c.flip = dx > 0 ? 1 : -1; } const hp = (c.t * (c.st === 'flee' ? 5 : 3)) % 1; c.y = Math.sin(hp * PI) * (c.st === 'flee' ? 0.5 : 0.3); c.f = hp < 0.85 ? 1 : 0;
        if (d < 0.1) { if (c.st === 'flee') { gone = true; c.hole.out--; if (c.hole.out <= 0) { c.hole.out = 0; c.hole.cool = rr(8, 14); } } else { c.st = 'graze'; c.wait = rr(1.5, 4.5); c.f = 0; c.y = 0; } } }
      if (d2(c.x, c.z, cx, cz) > (view + 16) ** 2) { gone = true; c.hole.out = 0; }
    } else if (c.k === 'crow') {
      if (c.st === 'in') { const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz), st = Math.min(d, 9 * dt); if (d > 0.05) { c.x += dx / d * st; c.z += dz / d * st; } c.y = Math.max(0, c.y - dt * 5 * Math.min(1, 9 / Math.max(d, 1))); c.f = 2 + (Math.floor(c.t * 8) % 2); if (d < 0.1 && c.y < 0.05) { c.st = 'ground'; c.y = 0; } }
      else if (c.st === 'ground') { c.wait -= dt; c.f = Math.floor(c.t * 1.6) % 3 === 0 ? 1 : 0; if (c.wait <= 0) { c.wait = rr(1, 3); const a = Math.random() * TAU; c.tx = c.x + Math.cos(a) * 0.6; c.tz = c.z + Math.sin(a) * 0.4; c.flip = Math.cos(a) > 0 ? 1 : -1; } const dx = c.tx - c.x, dz = c.tz - c.z; c.x += dx * Math.min(1, dt * 3); c.z += dz * Math.min(1, dt * 3);
        const thr = critNear(c.x, c.z, 7); if (thr) { c.st = 'off'; const a = Math.atan2(c.z - thr.z, c.x - thr.x) + rr(-0.4, 0.4); c.vx = Math.cos(a) * 10; c.vz = Math.sin(a) * 6; c.flip = c.vx > 0 ? 1 : -1; for (const o of CRIT.list) if (o.k === 'crow' && o.st === 'ground' && d2(o.x, o.z, c.x, c.z) < 16) { o.st = 'off'; o.vx = c.vx * rr(0.8, 1.2); o.vz = c.vz * rr(0.8, 1.2); o.flip = c.flip; } } }
      else if (c.st === 'off') { c.x += c.vx * dt; c.z += c.vz * dt; c.y += dt * 4; c.f = 2 + (Math.floor(c.t * 10) % 2); if (c.y > 16) gone = true; }
      if (d2(c.x, c.z, cx, cz) > (view + 30) ** 2) gone = true;
    } else if (c.k === 'fly') { c.x = c.hx + Math.sin(c.t * 0.7 + c.ph) * 3 + Math.sin(c.t * 2.3) * 0.4; c.z = c.hz + Math.cos(c.t * 0.5 + c.ph) * 2; c.y = 0.9 + Math.sin(c.t * 3.1 + c.ph) * 0.35; if (!day || d2(c.x, c.z, cx, cz) > (view + 6) ** 2) gone = true; if (critNear(c.x, c.z, 1.6)) { c.hx += (c.x - W.P[0].x) * dt * 2; c.hz += (c.z - W.P[0].z) * dt * 2; } }
    else if (c.k === 'glow') { c.x = c.hx + Math.sin(c.t * 0.4 + c.ph) * 2.5; c.z = c.hz + Math.cos(c.t * 0.33 + c.ph) * 1.8; c.y = 1 + Math.sin(c.t * 0.9 + c.ph) * 0.6; if (day || d2(c.x, c.z, cx, cz) > (view + 6) ** 2) gone = true; }
    if (gone) CRIT.list.splice(i, 1);
  }
}
function queueCrits() {
  CRIT.lamps.length = 0;
  for (const c of CRIT.list) {
    if (!onScreen(c.x, c.z, 3)) continue;
    if (c.k === 'rabbit' || c.k === 'crow') { const S = critSprite(c.k, c.f, c.flip); if (c.y < 3) queue(c.z, g => { const [sx, sy] = w2s(c.x, c.z); pxShadow(g, sx, sy, c.k === 'crow' ? 3 : 4, 1); }, 0); queue(c.y > 2 ? c.z + 50 : zKey(c.x, c.z), g => { const [sx, sy] = w2s(c.x, c.z, c.y); g.drawImage(S.cv, sx - S.ax, sy - S.ay); }, c.y > 2 ? 2 : 1); }
    else if (c.k === 'fly') queue(zKey(c.x, c.z), g => { const [sx, sy] = w2s(c.x, c.z, c.y), open = Math.floor(W.t * 9 + c.ph) % 2; g.fillStyle = '#1a1210'; g.fillRect(sx, sy, 1, 2); g.fillStyle = c.col; if (open) { g.fillRect(sx - 2, sy - 1, 2, 2); g.fillRect(sx + 1, sy - 1, 2, 2); } else { g.fillRect(sx - 1, sy - 2, 1, 2); g.fillRect(sx + 1, sy - 2, 1, 2); } }, 1);
    else if (c.k === 'glow') { const b = 0.5 + 0.5 * Math.sin(W.t * 2.4 + c.ph * 3); if (b < 0.25) continue; queue(c.z + 40, g => { const [sx, sy] = w2s(c.x, c.z, c.y); g.fillStyle = `rgba(230,255,140,${0.6 + b * 0.4})`; g.fillRect(sx, sy, 1, 1); if (b > 0.7) { g.fillStyle = 'rgba(200,255,120,0.35)'; g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); } }, 2); CRIT.lamps.push({ x: c.x, z: c.z, r: 1.6, col: 'rgba(190,255,120,A)', k: 0.5 * b }); }
  }
}
