/* ================= per-frame pixel render: depth-sorted scene, darkness and lights, spirit layer, post effects ================= */
const VIS = { hunt: 0, fear: 0, nextBolt: 12, seenGhost: 0, anim: [0, 0], beat: 0 };
function holderOf(W) { return W.p.find(p => p.role === 'L'); }
function seerOf(W) { return W.p.find(p => p.role === 'S'); }
/* how strongly the holder's flashlight lights a world point (0..1) */
function beamFactor(W, x, y, z, needFace) {
  const h = holderOf(W); if (!h || h.hide >= 0 || h.down) return 0;
  const hx = h.x + Math.cos(h.aim) * 0.35, hz = h.z + Math.sin(h.aim) * 0.35, d = dist(hx, hz, x, z);
  const boost = h.boostT > 0 ? 1 : 0, range = BAL.beamRange * (h.batt > 0.02 ? 1 : 0.45);
  if (d > range) return 0;
  const ang = Math.abs(angDiff(h.aim, Math.atan2(z - hz, x - hx)));
  const half = BAL.beamHalf * (boost ? 1.25 : 1) + (d < 1 ? 0.5 : 0);
  if (ang > half) return 0;
  if (!los(hx, hz, x - Math.cos(h.aim) * 0.15, z - Math.sin(h.aim) * 0.15, W)) return 0;
  if (needFace && Math.cos(needFace - (h.aim + PI)) < 0.15) return 0;
  return clamp((1 - ang / half) * 1.6, 0, 1) * clamp(1.2 - d / range, 0, 1) * (h.batt > 0.02 ? 1 : 0.5);
}
/* ray through the wall grid; returns the distance to the first blocking edge (and whether it was an east-west wall hit from the south) */
function castRay(W, x0, z0, a, maxD) {
  const CS = MAP.CS, dx = Math.cos(a), dz = Math.sin(a), st = 0.08;
  let ci = Math.floor(x0 / CS), cj = Math.floor(z0 / CS);
  for (let s = st; s <= maxD; s += st) {
    const x = x0 + dx * s, z = z0 + dz * s, ni = Math.floor(x / CS), nj = Math.floor(z / CS);
    if (ni !== ci) { if (ni < 0 || ni > MAP.GW || crossV(Math.max(ci, ni), cj, W)) return [s, 0]; ci = ni; }
    if (nj !== cj) { if (nj < 0 || nj > MAP.GH || crossH(ci, Math.max(cj, nj), W)) return [s, nj < cj ? 1 : 0]; cj = nj; }
  }
  return [maxD, 0];
}
const dirOf = a => { const c = Math.cos(a), s = Math.sin(a); return Math.abs(c) > Math.abs(s) * 1.1 ? (c > 0 ? 2 : 1) : (s > 0 ? 0 : 3); };
const ghostForm = W => W.setup ? (W.setup.gtype === 'boss' || Object.keys(W.evFound || {}).length >= 2 ? W.setup.gtype : 'veil') : 'veil';
function charOf() { return null; } // (3D-era test hook; kept so old probes don't throw)
/* world point → internal buffer pixel */
const wx = (x) => x * PX - R3.cam.x, wy = (z, y = 0) => z * PX - y * PX * VS - R3.cam.y;
function renderFrame(W, meIdx, dt) {
  const t = performance.now() / 1000, g = R3.bg, VW = R3.VW, VH = R3.VH, me = W.p[meIdx];
  const local = !!STATE.local && !W.menu, view = W.menu ? 'both' : local ? 'both' : me.role;
  const seer = seerOf(W), hold = holderOf(W);
  R3.seerView = view === 'S' || view === 'both';
  // ---- camera
  let tx, tz;
  if (local) { tx = (W.p[0].x + W.p[1].x) / 2; tz = (W.p[0].z + W.p[1].z) / 2; }
  else { tx = me.x; tz = me.z; } // locked on the player: no look-ahead, no slide after stopping
  if (W.menu) { tx = W.p[0].x - 1; tz = W.p[0].z - 2.5; }
  if (STAGE.sc && STAGE.cam === 'gate' && MAP.F.gateAt) { tx = MAP.F.gateAt.x; tz = MAP.F.gateAt.z - 1; } else if (STAGE.sc && STAGE.cam === 'boss' && G0(W)) { tx = W.g.x; tz = W.g.z; }
  // follow exactly; only glide when the target jumps (floor change, scene camera, menu)
  const jump = dist(R3.camT.x, R3.camT.z, tx, tz);
  if (jump > 1.5 || R3.camGlide) { R3.camGlide = jump > 0.05; const k = Math.min(1, dt * 10); R3.camT.x = lerp(R3.camT.x, tx, k); R3.camT.z = lerp(R3.camT.z, tz, k); if (jump < 0.05) { R3.camT.x = tx; R3.camT.z = tz; R3.camGlide = false; } }
  else { R3.camT.x = tx; R3.camT.z = tz; }
  if (window.__dbg && window.__dbg.cam) { R3.camT.x = window.__dbg.cam[0]; R3.camT.z = window.__dbg.cam[1]; }
  let shx = 0, shy = 0; if (R3.shake > 0) { if (SET.shake !== false) { shx = Math.round((Math.random() - 0.5) * R3.shake * 6); shy = Math.round((Math.random() - 0.5) * R3.shake * 6); } R3.shake = Math.max(0, R3.shake - dt * 2.5); }
  R3.cam.x = Math.round(R3.camT.x * PX) - (VW >> 1) + shx; R3.cam.y = Math.round(R3.camT.z * PX) - (VH >> 1) - 14 + shy;
  const cx = R3.cam.x, cy = R3.cam.y;
  // ---- lightning
  VIS.nextBolt -= dt; if (VIS.nextBolt <= 0) { VIS.nextBolt = rrLocal(18, 42); R3.flash = 1; R3.flash2 = rrLocal(0.2, 0.45); setTimeout(() => sfx('thunder'), rrLocal(300, 1600)); }
  if (R3.flash > 0) R3.flash = Math.max(0, R3.flash - dt * 2.6);
  const fk = R3.flash > 0 ? (R3.flash > 0.8 || (R3.flash > 0.3 && R3.flash < R3.flash2) ? R3.flash : R3.flash * 0.2) : 0; R3.flashK = fk;
  const G = W.g, hunting = G && (G.st === 'hunt' || G.st === 'ritual');
  VIS.hunt = lerp(VIS.hunt, hunting ? 1 : 0, Math.min(1, dt * 3)); R3.huntK = VIS.hunt;
  // ---- floor
  g.fillStyle = '#020203'; g.fillRect(0, 0, VW, VH);
  g.drawImage(R3.floorC, cx + R3.M * PX, cy + R3.M * PX, VW, VH, 0, 0, VW, VH);
  // floor decals: frost (holder's beam), the ritual circle glow, hatch light
  if (R3.setup) for (const e of R3.setup.ev || []) if (e.k === 'frost') { const b = beamFactor(W, e.x, 0.1, e.z); if (b > 0.02 || (local && b > 0)) { g.globalAlpha = Math.min(1, b * 1.4); drawFrost(g, wx(e.x), wy(e.z, e.y || 0), e); g.globalAlpha = 1; } }
  // ---- depth-sorted scene
  const dyn = [];
  W.p.forEach((p, i) => { if (p.hide < 0) dyn.push({ t: 'hero', p, i, key: p.z }); });
  const gAlpha = G ? ghostAlphaFor(W, view, me, seer) : 0;
  if (G && gAlpha.pre > 0.01) dyn.push({ t: 'ghost', key: G.z, a: gAlpha.pre });
  if (R3.setup) {
    (R3.setup.items || []).forEach((it, i) => { const st = W.items && W.items[i]; if (st && !st.taken && (!st.need || (W.f && W.f[st.need]))) dyn.push({ t: 'item', it, key: it.z + 0.02 }); });
    (R3.setup.anchors || []).forEach((a, i) => { const st = W.anchors ? W.anchors[i] : 0; if (st < 2) dyn.push({ t: 'anchor', a, st, key: a.z + 0.01 }); });
  }
  for (const b of R3.bells) if (b) dyn.push({ t: 'bell', b, key: b.f.z + 0.03 });
  for (const m of R3.manq) dyn.push({ t: 'manq', m, key: m.f.z + 0.03 });
  const all = R3.drawables.concat(dyn).sort((a, b) => a.key - b.key);
  // which wall pieces hide someone standing behind them (fade them)
  const watchers = W.p.filter(p => p.hide < 0 && (local || p.id === meIdx || W.menu));
  const fadeOf = p => { if (p.t !== 'h' || p.low) return 1; for (const q of watchers) if (q.z < p.z && q.z > p.z - 2.1 && q.x > p.x0 - 1.1 && q.x < p.x1 + 1.1) return 0.32; return 1; };
  const me1 = me;
  for (const o of all) {
    switch (o.t) {
      case 'h': case 'v': drawPiece(g, o, W, cx, cy, fadeOf(o)); break;
      case 'prop': { const sx = Math.round(o.f.x * PX + o.b.ox - cx), sy = Math.round(o.f.z * PX + o.b.oy - o.y * PX * VS - cy); if (sx > VW || sy > VH || sx + o.b.c.width < 0 || sy + o.b.c.height < 0) break; g.drawImage(o.b.c, sx, sy); propOverlay(g, o, W, sx, sy, t); break; }
      case 'rail': drawRail(g, o, cx, cy); break;
      case 'decor': drawDecor(g, o, W, cx, cy, t); break;
      case 'paint': drawPainting(g, o, cx, cy, t, me1); break;
      case 'fix': drawFixture(g, o, W, cx, cy, t); break;
      case 'gate': drawGate(g, o, W, t, false); break;
      case 'hero': drawHero(g, o.p, o.i, W, t, dt); break;
      case 'ghost': drawGhost(g, W, o.a, t, hunting); break;
      case 'item': { const s = itemSprite(o.it.k), bob = Math.round(Math.sin(t * 2 + o.it.x) * 1); g.drawImage(s, Math.round(wx(o.it.x) - 6), Math.round(wy(o.it.z, o.it.y || 0) - 10 + bob)); break; }
      case 'anchor': { const vis = o.st === 1 || R3.seerView || beamFactor(W, o.a.x, 0.4, o.a.z) > 0.15; if (vis) g.drawImage(anchorSprite(o.a.k, o.st === 0 && R3.seerView ? 1 : 0), Math.round(wx(o.a.x) - 8), Math.round(wy(o.a.z) - 17)); break; }
      case 'bell': { const b = o.b; b.sw *= Math.pow(0.04, dt); const X = Math.round(wx(b.f.x)), Y = Math.round(wy(b.f.z, b.f.h - 0.2)), s = Math.round(Math.sin(t * 18) * 2 * b.sw); g.fillStyle = PAL.brass; g.fillRect(X - 3 + s, Y - 2, 6, 5); g.fillRect(X - 4 + s, Y + 2, 8, 2); g.fillStyle = PAL.brassL; g.fillRect(X - 2 + s, Y - 1, 1, 3); break; }
      case 'manq': { const m = o.m, lit = beamFactor(W, m.f.x, 1.5, m.f.z) > 0.05, X = Math.round(wx(m.f.x)), Y = Math.round(wy(m.f.z, 1.62)); if (!lit && dist(me.x, me.z, m.f.x, m.f.z) < 9) m.a = Math.atan2(me.z - m.f.z, me.x - m.f.x); g.fillStyle = '#c8b8a0'; g.fillRect(X - 3, Y - 4, 6, 6); const d = dirOf(m.a); if (d !== 3) { g.fillStyle = '#5a4a40'; const ox = d === 1 ? -2 : d === 2 ? 1 : 0; g.fillRect(X - 2 + ox, Y - 2, 1, 1); g.fillRect(X + 1 + ox, Y - 2, 1, 1); } break; }
    }
  }
  // mirrors: in the flashlight, a figure stands in the glass that isn't in the room
  if (W.setup && GT(W.setup.gtype).ev.includes('mirror')) for (const mr of MAP.mirrors) { const b = beamFactor(W, mr.x, 1.2, mr.z, mr.r); if (b < 0.08) continue; const s = ghostSprite(ghostForm(W) === 'veil' ? 'faceless' : ghostForm(W), 0, Math.floor(t * 2) % 4, false), X = Math.round(wx(mr.x)), Y = Math.round(wy(mr.z, mr.y)); g.save(); g.globalAlpha = Math.min(1, b * 1.6) * (0.75 + Math.sin(t * 9) * 0.1); g.beginPath(); g.rect(X - 7, Y - 11, 14, 20); g.clip(); g.drawImage(tintedCache(s, '#0a0c14'), X - 12, Y - 12, 24, 40); g.restore(); }
  // dust motes (catch the light)
  if (SET.quality !== 'low') { g.fillStyle = 'rgba(220,210,190,.35)'; } for (const d of SET.quality === 'low' ? [] : R3.dust) { const X = Math.round(wx(d.x + Math.sin(t * 0.2 + d.ph) * 0.4)), Y = Math.round(wy(d.z, d.y + Math.sin(t * 0.3 + d.ph) * 0.2)); if (X >= 0 && Y >= 0 && X < VW && Y < VH) g.fillRect(X, Y, 1, 1); }
  // rain outside
  if (MAP.F.outside) { g.fillStyle = 'rgba(140,160,200,.35)'; for (let i = 0; i < 90; i++) { const X = (hash(i, 1, 1) * VW + t * 40) % VW | 0, Y = ((hash(i, 2, 2) * VH + t * 420) % VH) | 0, wxp = (X + cx) / PX, wzp = (Y + cy) / PX; if (roomAt(wxp, wzp) < 0) g.fillRect(X, Y, 1, 4); } }
  // see-through silhouettes of the people we care about (behind walls)
  for (const p of watchers) { const s = heroSprite(p, W, t); g.globalAlpha = 0.28; g.drawImage(s.c, Math.round(wx(p.x) - SW / 2), Math.round(wy(p.z) - FEET)); g.globalAlpha = 1; }
  // ---- darkness + lights
  drawLighting(W, view, me, t, fk, local);
  // ---- things that glow over the dark: the seer's spirit layer, ghost (for the seer), seals, item glints
  g.globalCompositeOperation = 'lighter';
  const spiritOK = (x, z) => view === 'S' ? dist(x, z, seer.x, seer.z) < 14 : view === 'both' ? dist(x, z, seer.x, seer.z) < 7 && los(seer.x, seer.z, x, z, W) : false;
  if (R3.setup && seer && !seer.down) drawSpirit(g, W, t, spiritOK);
  for (const o of R3.drawables) if (o.t === 'gate') drawGate(g, o, W, t, true);
  if (R3.setup) (R3.setup.items || []).forEach((it, i) => { const st = W.items && W.items[i]; if (!st || st.taken || (st.need && !(W.f && W.f[st.need]))) return; const k = (t * 1.3 + i) % 3; if (k < 0.25) { const X = Math.round(wx(it.x)), Y = Math.round(wy(it.z, it.y || 0) - 6); g.fillStyle = 'rgba(255,240,180,.8)'; g.fillRect(X, Y - 2, 1, 5); g.fillRect(X - 2, Y, 5, 1); } });
  if (hold && hold.hide < 0 && !hold.down) { const X = Math.round(wx(hold.x + Math.cos(hold.aim) * 0.32)), Y = Math.round(wy(hold.z + Math.sin(hold.aim) * 0.32, 0.95)); g.fillStyle = hold.batt > 0.02 ? 'rgba(255,240,180,.9)' : 'rgba(255,200,120,.4)'; g.fillRect(X - 1, Y - 1, 2, 2); }
  if (seer && seer.hide < 0) { const X = Math.round(wx(seer.x + 0.3)), Y = Math.round(wy(seer.z + 0.05, 0.62)), fl = 0.6 + Math.sin(t * 9) * 0.1; const gr = g.createRadialGradient(X, Y, 0, X, Y, 9); gr.addColorStop(0, `rgba(120,200,255,${0.45 * fl})`); gr.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = gr; g.fillRect(X - 9, Y - 9, 18, 18); }
  g.globalCompositeOperation = 'source-over';
  if (G && gAlpha.post > 0.01) drawGhost(g, W, gAlpha.post, t, hunting, gAlpha.xray);
  if (G && hunting && view === 'L' && gAlpha.pre < 0.05 && dist(G.x, G.z, me.x, me.z) < 6) { // breathing in the dark: two pale eyes
    const X = Math.round(wx(G.x)), Y = Math.round(wy(G.z, 1.5)); if (Math.sin(t * 2.7) > -0.2) { g.fillStyle = 'rgba(220,230,255,.75)'; g.fillRect(X - 3, Y, 2, 1); g.fillRect(X + 2, Y, 2, 1); }
  }
  // ---- post: fear, hunt, hiding, downed, grain, flash
  postFX(g, W, me, view, t, dt, fk);
  STAGE.W = W; drawStage(g, t, dt);
  // ---- blit
  const ctx = R3.ctx; ctx.imageSmoothingEnabled = false; ctx.drawImage(R3.buf, 0, 0, VW * R3.SC, VH * R3.SC);
}
const G0 = W => W && W.g && W.g.st !== 'gone';
const rrLocal = (a, b) => a + Math.random() * (b - a);
function ghostAlphaFor(W, view, me, seer) {
  const G = W.g; if (!G || G.st === 'gone') return { pre: 0, post: 0 };
  let lit = beamFactor(W, G.x, 1.2, G.z) > 0.05 ? 0.85 : 0, man = G.man || 0, see = 0, xray = false;
  if ((view === 'S' || view === 'both') && seer && !seer.down) { const d = dist(G.x, G.z, seer.x, seer.z); if (d < (view === 'S' ? 18 : 9)) { const v = los(seer.x, seer.z, G.x, G.z, W); see = v ? 0.85 : view === 'S' ? 0.5 : 0; xray = !v; } }
  const fade = G.fade == null ? 1 : G.fade;
  const pre = Math.max(lit, man) * fade, post = Math.max(see, man * 0.7) * fade;
  if (pre > 0.3 && view !== 'S') VIS.seenGhost = performance.now() / 1000;
  return { pre, post: post > pre ? post : 0, xray };
}
/* ---------- heroes ---------- */
function heroSprite(p, W, t) {
  const moving = (p.spd || 0) > 0.15, dir = dirOf(p.role === 'L' ? p.aim : (moving ? p.a : p.aim));
  const ph = VIS.anim[p.id] || 0, fr = moving ? [1, 0, 3, 0][Math.floor(ph * 4) % 4] : (Math.floor(t * 1.1 + p.id) % 2 ? 2 : 0);
  const kneel = W.rit && W.rit.by === p.id;
  return { c: sprite(p.role, p.down ? 0 : dir, p.down ? 0 : fr, p.down ? 'down' : kneel ? 'kneel' : ''), dir };
}
function drawHero(g, p, i, W, t, dt) {
  VIS.anim[i] = (VIS.anim[i] || 0) + dt * (p.spd || 0) * 0.62;
  const X = Math.round(p.x * PX) - R3.cam.x, Y = Math.round(p.z * PX) - R3.cam.y;
  g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.ellipse(X, Y, 7, 2.5, 0, 0, TAU); g.fill();
  const s = heroSprite(p, W, t);
  g.drawImage(s.c, X - SW / 2, Y - FEET);
  if (p.down) { const k = (t * 2) % 1; g.fillStyle = `rgba(255,90,90,${0.5 - k * 0.5})`; g.fillRect(X - 1, Y - 12 - k * 6, 2, 2); }
}
/* ---------- ghost ---------- */
function drawGhost(g, W, a, t, hunting, xray) {
  const G = W.g, form = ghostForm(W), dir = dirOf(G.a || 0), fr = Math.floor(t * (hunting ? 7 : 3)) % 4;
  const s = ghostSprite(form, dir, fr, hunting), X = Math.round(wx(G.x) + (hunting ? (Math.random() - 0.5) * 2 : 0)), Y = Math.round(wy(G.z) + Math.sin(t * 1.3) * 1.5);
  g.globalAlpha = clamp(a, 0, 1) * 0.55; const gr = g.createRadialGradient(X, Y - 18, 2, X, Y - 18, 20); gr.addColorStop(0, hunting ? 'rgba(200,220,255,.5)' : 'rgba(150,210,255,.4)'); gr.addColorStop(1, 'rgba(150,210,255,0)'); g.fillStyle = gr; g.fillRect(X - 20, Y - 38, 40, 40);
  g.globalAlpha = clamp(a, 0, 1) * (0.82 + Math.sin(t * 5) * 0.08);
  g.drawImage(xray ? tintedCache(s, '#7fd8ff') : s, X - GW / 2, Y - GH + 2);
  g.globalAlpha = 1;
}
const TINTC = new Map(); function tintedCache(c, col) { let m = TINTC.get(c); if (!m) TINTC.set(c, m = {}); return m[col] || (m[col] = tinted(c, col, 0.85)); }
/* ---------- floor-level and spirit things ---------- */
function drawFrost(g, X, Y, e) { const R = RP(g, Math.round(X), Math.round(Y)); for (let i = 0; i < 26; i++) { const a = hash(i, e.x * 10 | 0, 1) * TAU, r = hash(e.z * 10 | 0, i, 2) * 12; R(Math.cos(a) * r, Math.sin(a) * r * 0.6, 2, 1, i % 3 ? 'rgba(220,240,255,.85)' : 'rgba(170,210,240,.7)'); } R(-6, -1, 12, 1, 'rgba(230,245,255,.5)'); }
function drawSpirit(g, W, t, ok) {
  const st = R3.setup;
  for (const e of st.ev || []) {
    if (!ok(e.x, e.z)) continue;
    const X = Math.round(wx(e.x)), Y = Math.round(wy(e.z, e.y || 0));
    if (e.k === 'prints') { const R = RP(g, X, Y), a = 0.5 + Math.sin(t * 2 + e.x) * 0.2; g.globalAlpha = a; R(-2, -3, 4, 5, '#7fe6ff'); for (let f = 0; f < 4; f++) R(-2 + f, -6 - (f === 1 || f === 2 ? 1 : 0), 1, 3, '#7fe6ff'); R(2, -2, 2, 1, '#7fe6ff'); R(-6, 1, 3, 4, '#5fc6df'); g.globalAlpha = 1; }
    if (e.k === 'orbs') for (let k = 0; k < 3; k++) { const ox = Math.sin(t * 0.5 + k * 2.1) * 8, oy = Math.sin(t * 0.8 + k * 3.3) * 5 - 8, r = 2 + (k % 2); const gr = g.createRadialGradient(X + ox, Y + oy, 0, X + ox, Y + oy, r * 3); gr.addColorStop(0, 'rgba(180,240,255,.9)'); gr.addColorStop(1, 'rgba(180,240,255,0)'); g.fillStyle = gr; g.fillRect(X + ox - r * 3, Y + oy - r * 3, r * 6, r * 6); }
  }
  if (st.codeSpot && ok(st.codeSpot.x, st.codeSpot.z)) { const c = st.codeSpot, X = Math.round(wx(c.x)), Y = Math.round(wy(c.z, (c.y || 1.4) + 0.25)); g.fillStyle = 'rgba(150,240,255,.85)'; g.font = '8px serif'; g.textAlign = 'center'; g.fillText(st.code.map(i => GLYPHS[i]).join(''), X, Y); g.fillRect(X - 14, Y + 2, 28, 1); g.textAlign = 'left'; }
  const shelf = MAP.doors.find(x => x.kind === 'shelf'); if (shelf && W.doors[shelf.idx].open < 0.5 && ok(shelf.cx, shelf.cz)) for (let k = 0; k < 6; k++) { const ph = (t * 0.35 + k / 6) % 1, X = Math.round(wx(shelf.cx + Math.sin(ph * 9 + k) * 0.4)), Y = Math.round(wy(shelf.cz + 0.3, 0.2 + ph * 2)); g.fillStyle = `rgba(160,210,255,${0.5 * (1 - ph)})`; g.fillRect(X, Y, 1, 3); }
  if (st.bells && W.f && !W.f.bells) st.bells.forEach((bi, order) => { const b = MAP.furn.find(f => f.o.bell === bi); if (!b || !ok(b.x, b.z)) return; const X = Math.round(wx(b.x)), Y = Math.round(wy(b.z, 1.75) + Math.sin(t * 2 + order) * 1); g.fillStyle = order < (W.bellN || 0) ? 'rgba(150,240,255,.25)' : 'rgba(150,240,255,.95)'; g.font = 'bold 9px serif'; g.textAlign = 'center'; g.fillText(String(order + 1), X, Y); g.textAlign = 'left'; });
  for (const it of st.items || []) if (it.need === 'drained' && W.f && !W.f.drained && ok(it.x, it.z)) { const X = Math.round(wx(it.x)), Y = Math.round(wy(it.z, 0.6)), a = 0.5 + Math.sin(t * 3) * 0.3; g.fillStyle = `rgba(255,233,160,${a})`; g.fillRect(X - 1, Y - 1, 3, 3); }
  // the mirror figure (holder's evidence) shows for everybody in the beam
}
/* stair seal across the gate */
function drawGate(g, o, W, t, glow) {
  const X = Math.round(wx(o.at.x)), Y = Math.round(wy(o.at.z)), seal = W.f ? W.f.seal : 1;
  if (!glow) { g.fillStyle = '#121010'; for (let k = -24; k <= 24; k += 4) { g.fillRect(X + k, Y - 30, 1, 30); g.fillRect(X + k - 1, Y - 32, 3, 2); } g.fillRect(X - 25, Y - 20, 50, 1); g.fillRect(X - 25, Y - 8, 50, 1); if (!seal) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(X - 25, Y - 30, 50, 30); } return; }
  if (!seal) return;
  const a = 0.55 + Math.sin(t * 2) * 0.15; g.save(); g.translate(X, Y - 16); g.rotate(t * 0.2); g.strokeStyle = `rgba(176,138,255,${a})`; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.stroke(); g.beginPath(); for (let i = 0; i <= 6; i++) { const an = i * TAU * 2 / 6 + 0.5; g[i ? 'lineTo' : 'moveTo'](Math.cos(an) * 12, Math.sin(an) * 12); } g.stroke(); g.restore();
  g.fillStyle = `rgba(176,138,255,${a * 0.5})`; g.fillRect(X - 25, Y - 14, 50, 1); g.fillRect(X - 25, Y - 22, 50, 1);
}
/* props with moving parts or state drawn on top of the cached sprite */
function propOverlay(g, o, W, sx, sy, t) {
  const f = o.f, b = o.b;
  if (f.k === 'tub') { const drained = W.f && W.f.drained, X = sx + 4, Y = sy + 3, w = b.c.width - 8, h = Math.round(b.HD * 2 * PX) - 6; if (!drained) { g.fillStyle = 'rgba(60,70,50,.92)'; g.fillRect(X, Y, w, h); g.fillStyle = 'rgba(120,130,100,.5)'; g.fillRect(X + 2 + Math.round(Math.sin(t) * 2), Y + 2, w - 6, 1); } }
  if (f.o.hide) { const h = MAP.hides.find(q => q.f === f.id); if (h && W.hideA) { const ta = W.now - (W.hideA[h.id] ?? -9); if (ta < 0.9) { const k = Math.sin(clamp(ta / 0.9, 0, 1) * PI); g.fillStyle = '#0a0606'; g.fillRect(sx + Math.round(b.c.width / 2) - 1, sy + Math.round(b.HD * 2 * PX) + 2, Math.round(3 + k * 6), b.c.height - Math.round(b.HD * 2 * PX) - 4); } if (W.occ && W.occ[h.id] >= 0 && R3.seerView) { g.fillStyle = 'rgba(140,220,255,.6)'; g.fillRect(sx + Math.round(b.c.width / 2) - 1, sy + b.c.height - 14, 2, 2); } } }
  if (f.k === 'ritualCircle' && W.f) { const on = W.f.sanctum && W.f.seal, pr = W.rit && W.rit.item === 'final' ? W.rit.p : (W.finP || 0); if (on || W.finP) { const X = sx + b.c.width / 2, Y = sy + (b.c.height) / 2; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,80,90,${0.25 + pr * 0.6 + Math.sin(t * 4) * 0.08})`; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, b.c.width / 2 - 3, -HP, -HP + TAU * Math.max(0.02, pr)); g.stroke(); g.restore(); } }
  if (f.k === 'roofHatch' && W.f && !W.f.seal) { const X = sx + b.c.width / 2, Y = sy; g.fillStyle = 'rgba(170,190,230,.25)'; g.fillRect(X - 10, Y - 6, 20, b.c.height + 6); }
  if (f.k === 'grandClock') { const X = sx + Math.round(b.c.width / 2), Y = sy + b.c.height - Math.round(b.Hm * PX * VS * 0.45); g.fillStyle = PAL.brassL; g.fillRect(X + Math.round(Math.sin(t * PI) * 2) - 1, Y, 2, 2); }
}
/* ---------- darkness: cut holes for lights, the flashlight cone, the lantern ---------- */
function drawLighting(W, view, me, t, fk, local) {
  const dg = R3.dg, VW = R3.VW, VH = R3.VH, amb = (MAP.F && MAP.F.ambient) || 1;
  const base = view === 'S' ? 0.24 : view === 'both' ? 0.12 : 0.07;
  let A = 1 - base * amb; if (W.menu) A = 0.62; A *= 1 - fk * 0.55; if (window.__dbgLight) A = 0.1;
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, VW, VH);
  dg.fillStyle = view === 'S' ? `rgba(4,8,18,${A})` : `rgba(3,3,6,${A})`; dg.fillRect(0, 0, VW, VH);
  dg.globalCompositeOperation = 'destination-out';
  const gl = R3.gg; gl.clearRect(0, 0, VW, VH); gl.globalCompositeOperation = 'lighter';
  const hole = (x, y, r, a, clip) => { if (x + r < 0 || y + r < 0 || x - r > VW || y - r > VH) return; if (clip) { dg.save(); dg.beginPath(); dg.rect(clip[0], clip[1], clip[2], clip[3]); dg.clip(); } const gr = dg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(x - r, y - r, r * 2, r * 2); if (clip) dg.restore(); };
  const tint = (x, y, r, col, a) => { if (x + r < 0 || y + r < 0 || x - r > VW || y - r > VH) return; const gr = gl.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); gl.fillStyle = gr; gl.fillRect(x - r, y - r, r * 2, r * 2); };
  const roomClip = ri => { if (ri < 0) return null; const r = MAP.rooms[ri].r; return [wx(r[0]) - 2, wy(r[1]) - R3.FH - 2, (r[2] - r[0]) * PX + 4, (r[3] - r[1]) * PX + R3.FH + 4]; };
  // room lights
  let eflick = 1; if (W.flick > 0 && Math.random() < W.flick * 0.5) eflick = 0.15 + Math.random() * 0.4;
  for (const l of MAP.lights) {
    if (!lightOn(l, W)) continue;
    const elec = !['candles', 'candleS', 'fire', 'oilLamp'].includes(l.k), k = l.k;
    const rad = (k === 'chandelierBig' ? 6.5 : k === 'chandelier' ? 5 : k === 'sconce' ? 2.6 : k === 'pendant' ? 3.8 : k === 'bulb' ? 3.4 : k === 'oilLamp' ? (B('lampR') || 3.4) + 0.6 : k === 'fire' ? 4 : 2.2) * PX;
    const fl = elec ? eflick * (0.97 + Math.sin(t * 50 + l.i) * 0.02) : 0.85 + Math.sin(t * 9 + l.i) * 0.08 + Math.sin(t * 23 + l.i * 2) * 0.05;
    const X = wx(l.x), Y = wy(l.z, Math.min(l.y, 1.2) * 0.4);
    hole(X, Y, rad, 0.9 * fl, roomClip(l.room));
    tint(X, Y, rad * 0.8, elec ? '255,210,150' : k === 'oilLamp' ? '255,190,110' : '255,170,90', 0.22 * fl);
  }
  // people always see a little around themselves
  for (const p of W.p) { if (p.hide >= 0) continue; const X = wx(p.x), Y = wy(p.z, 0.6); hole(X, Y, (p.role === 'S' ? 2.8 : 1.5) * PX, p.role === 'S' ? 0.75 : 0.45); if (p.role === 'S') tint(X, Y, 2.6 * PX, '110,180,255', 0.12); }
  // the flashlight cone (ray-cast against the walls)
  const h = holderOf(W);
  if (h && h.hide < 0 && !h.down) {
    let flick = 1; if (W.flick > 0 && Math.random() < W.flick * 0.35) flick = Math.random() * 0.3; const weak = h.batt <= 0.02; if (weak) flick *= 0.35 + Math.random() * 0.15;
    const boost = h.boostT > 0, half = BAL.beamHalf * (boost ? 1.25 : 1) * 1.1, range = BAL.beamRange * (weak ? 0.45 : 1) * (boost ? 1 : 0.85);
    const ox = h.x + Math.cos(h.aim) * 0.3, oz = h.z + Math.sin(h.aim) * 0.3, n = SET.quality === 'low' ? 16 : 28, pts = [];
    for (let i = 0; i <= n; i++) { const a = h.aim - half + (i / n) * half * 2, [d, wall] = castRay(W, ox, oz, a, range); const x = ox + Math.cos(a) * d, z = oz + Math.sin(a) * d; pts.push([wx(x), wy(z) - (wall ? R3.FH * 0.85 * clamp(1.4 - d / range, 0, 1) : 0)]); }
    const X0 = wx(ox), Y0 = wy(oz, 0.5), R = range * PX;
    for (const [tg, isDark] of [[dg, 1], [gl, 0]]) {
      tg.save(); tg.beginPath(); tg.moveTo(X0, Y0); for (const p of pts) tg.lineTo(p[0], p[1]); tg.closePath(); tg.clip();
      const gr = tg.createRadialGradient(X0, Y0, 0, X0, Y0, R);
      if (isDark) { const a = (boost ? 1 : 0.92) * flick; gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.6, `rgba(0,0,0,${a * 0.85})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
      else { const a = (boost ? 0.45 : 0.16) * flick; gr.addColorStop(0, `rgba(255,236,190,${a})`); gr.addColorStop(1, 'rgba(255,236,190,0)'); }
      tg.fillStyle = gr; tg.fillRect(X0 - R, Y0 - R, R * 2, R * 2); tg.restore();
    }
  }
  // the ghost's own cold light when it manifests; lit windows in a lightning flash; the open roof hatch
  const G = W.g; if (G && (G.man || 0) > 0.05) { hole(wx(G.x), wy(G.z, 1), 2.4 * PX, 0.6 * G.man); tint(wx(G.x), wy(G.z, 1), 2.4 * PX, '150,200,255', 0.25 * G.man); }
  if (MAP.F.outside === 'ground' || fk > 0.1) for (const w of MAP.windows) { if (w.dir !== 'h') continue; const X = wx((w.a + w.b) / 2), Y = wy(w.at + 0.6); hole(X, Y, (1.2 + fk * 3) * PX, 0.25 + fk * 0.6, roomClip(w.room)); }
  if (W.f && !W.f.seal) { const hf = MAP.furn.find(f => f.k === 'roofHatch'); if (hf) { hole(wx(hf.x), wy(hf.z), 3 * PX, 0.7); tint(wx(hf.x), wy(hf.z), 3 * PX, '170,190,230', 0.2); } }
  // the dawn: after the boss is banished the house slowly lightens
  if (W.phase === 'won') { dg.globalCompositeOperation = 'destination-out'; dg.fillStyle = 'rgba(0,0,0,.5)'; dg.fillRect(0, 0, VW, VH); }
  R3.bg.drawImage(R3.dark, 0, 0);
  R3.bg.globalCompositeOperation = 'lighter'; R3.bg.drawImage(R3.glow, 0, 0); R3.bg.globalCompositeOperation = 'source-over';
}
/* ---------- post effects ---------- */
function postFX(g, W, me, view, t, dt, fk) {
  const VW = R3.VW, VH = R3.VH, local = view === 'both' && !W.menu;
  const fearP = local ? Math.max(W.p[0].fear, W.p[1].fear) : me.fear;
  VIS.fear = lerp(VIS.fear, fearP / 100, Math.min(1, dt * 2));
  // spirit sight: cold tint
  if (view === 'S') { g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(70,110,170,.35)'; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
  // hunt: red edge pulse + scanline tearing
  if (VIS.hunt > 0.05) {
    if (Math.random() < VIS.hunt * 0.25) { const y = (Math.random() * VH) | 0, h = 2 + ((Math.random() * 8) | 0), off = Math.round((Math.random() - 0.5) * 6 * VIS.hunt); g.drawImage(R3.buf, 0, y, VW, h, off, y, VW, h); }
    g.fillStyle = `rgba(120,0,10,${0.08 * VIS.hunt * (0.6 + Math.sin(t * 6) * 0.4)})`; g.fillRect(0, 0, VW, VH);
  }
  // fear vignette and heartbeat
  const bpm = 60 + fearP * 0.8 + VIS.hunt * 40, ph = (t * bpm / 60) % 1, beat = fearP > 50 || VIS.hunt > 0.5 ? Math.max(0, 1 - ph * 5) * clamp((fearP - 40) / 60 + VIS.hunt * 0.5, 0, 1) : 0;
  const vr = Math.max(VW, VH) * (0.75 - VIS.fear * 0.18), gr = g.createRadialGradient(VW / 2, VH / 2, vr * 0.35, VW / 2, VH / 2, vr);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(${Math.round(40 * beat)},0,${view === 'S' ? 12 : 0},${0.55 + VIS.fear * 0.35})`); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  // hiding: through the wardrobe slats
  if (!local && me.hide >= 0) { g.fillStyle = 'rgba(0,0,0,.85)'; for (let y = 0; y < VH; y += 8) g.fillRect(0, y, VW, 5); }
  // downed: drained colour, red rim
  if (!local && me.down) { g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.85)'; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(90,0,0,.25)'; g.fillRect(0, 0, VW, VH); }
  // film grain
  if (SET.grain) { g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 60; i++) g.fillRect((Math.random() * VW) | 0, (Math.random() * VH) | 0, 1, 1); g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 60; i++) g.fillRect((Math.random() * VW) | 0, (Math.random() * VH) | 0, 1, 1); }
  if (fk > 0) { g.fillStyle = `rgba(200,215,255,${fk * 0.22})`; g.fillRect(0, 0, VW, VH); }
}
/* world → CSS screen pixels (for DOM overlays) */
function toScreen(x, y, z) { const k = R3.SC / R3.DPR, sx = (x * PX - y * 0 - R3.cam.x) * k, sy = (z * PX - y * 1.5 * PX * VS - R3.cam.y) * k; return { x: sx, y: sy, on: sx > -20 && sy > -20 && sx < innerWidth + 20 && sy < innerHeight + 20 }; }
