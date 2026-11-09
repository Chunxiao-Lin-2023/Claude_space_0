/* ================= native pixel humans (in-world sprites) =================
   Drawn straight at art-pixel resolution, the way pixel artists draw: chibi proportions (big 15-px heads),
   3-tone hue-shifted shading lit from the upper left, coloured (sel-out) outlines per body part, hand-tuned
   hair silhouettes and 2-px anime eyes. Shares its skeleton/pose maths with the vector rig (12_chibi.js),
   which is still used for portraits and the large 立绘. Walk cycles: WALKF frames with a 1-px passing bob,
   foot lift in front/back views and swinging arms, so a moving character never just slides. */
function chibiPose(P, A, view) {
  const B = BUILD[P.build || 'kid'], s = B.head, w = A.walk || 0, ph = A.ph || 0, sw = Math.sin(ph), cw = Math.cos(ph);
  const legL = B.leg; let hipY = -legL;
  const P_ = A.pose; if (P_ === 'sit' || P_ === 'cross') hipY = -legL * 0.42; else if (P_ === 'kneel') hipY = -legL * 0.6;
  const chestY = hipY - B.torso, headY = chestY - B.neck - 90 * s;
  const act = A.act, k = act ? act.k01 : 0, up = act ? sstep(0, 0.35, k) * (1 - sstep(0.6, 1, k)) : 0;
  let lean = P.hunch || 0, armL = { sh: 0.12 + sw * 0.55 * w, el: 0.3 }, armR = { sh: 0.12 - sw * 0.55 * w, el: 0.3 }, legLa = sw * 0.55 * w, legRa = -sw * 0.55 * w, jumpY = 0;
  if (view !== 'side') { armL.sh = 0.2 + Math.max(0, sw) * 0.35 * w; armR.sh = 0.2 + Math.max(0, -sw) * 0.35 * w; armL.el = 0.25 + Math.max(0, sw) * 0.9 * w; armR.el = 0.25 + Math.max(0, -sw) * 0.9 * w; }
  if (P_ === 'train') { const q = Math.sin((A.t || 0) * 3); armL.sh = 1.2 + q * 0.3; armR.sh = 1.2 - q * 0.3; armL.el = armR.el = 1.4; }
  if (P_ === 'pray') { armL.sh = armR.sh = view === 'side' ? 1.0 : 0.55; armL.el = armR.el = 1.7; }
  if (P_ === 'carry' || P_ === 'lift') { armL.sh = armR.sh = view === 'side' ? 3.0 : 2.75; armL.el = armR.el = 0.3; }
  if (P_ === 'arms') { armL.sh = armR.sh = 0.5; armL.el = armR.el = 1.9; }
  if (P_ === 'drink') { armR.sh = view === 'side' ? 1.6 : 1.3; armR.el = 1.9; }
  if (P_ === 'wave') { armR.sh = 2.7 + Math.sin((A.t || 0) * 10) * 0.25; armR.el = 0.5; }
  if (P_ === 'point') { armR.sh = view === 'side' ? 1.6 : 1.4; armR.el = 0; }
  if (act) switch (act.k) {
    case 'punch': if (view === 'side') { armR.sh = lerp(-0.4, 1.55, up); armR.el = lerp(1.6, 0, up); lean += 0.1 * up; } else { armR.sh = 0.2 + 1.5 * up; armR.el = 0.1; } break;
    case 'kick': legRa = view === 'side' ? 1.4 * up : 0; if (view !== 'side') jumpY = -20 * up; lean -= 0.12 * up; break;
    case 'cast': armR.sh = view === 'side' ? 1.5 * up : 1.3 * up; armR.el = 0.1; armL.sh = 0.6 * up; break;
    case 'cast2': armL.sh = armR.sh = 2.6 * up; armL.el = armR.el = 0.4; break;
    case 'throw': armR.sh = view === 'side' ? (k < 0.45 ? lerp(-0.2, -2.6, sstep(0, 0.45, k)) : lerp(-2.6, 1.3, sstep(0.45, 0.65, k))) : 2.4 * up; break;
    case 'lift': armL.sh = armR.sh = (view === 'side' ? 3.0 : 2.75) * up; armL.el = armR.el = 0.3; jumpY = 8 * Math.sin(k * PI); break;
    case 'slam': armL.sh = armR.sh = k < 0.5 ? 3.0 * sstep(0, 0.5, k) : lerp(3.0, view === 'side' ? 1.2 : 0.6, sstep(0.5, 0.65, k)); break;
    case 'hit': lean -= 0.25 * up; armL.sh = armR.sh = 0.7 * up; break;
    case 'cheer': armL.sh = armR.sh = 2.6 * up; jumpY = -Math.abs(Math.sin(k * TAU * 2)) * 24; break;
    case 'stab': armR.sh = view === 'side' ? lerp(0.4, 1.5, up) : 1.4 * up; armR.el = lerp(1.2, 0, up); break;
    case 'swing': armR.sh = view === 'side' ? (k < 0.4 ? lerp(0, 2.6, sstep(0, 0.4, k)) : lerp(2.6, 0.4, sstep(0.4, 0.7, k))) : 2.2 * up; break;
    case 'shoot': armL.sh = view === 'side' ? 1.55 : 1.4; armL.el = 0; armR.sh = view === 'side' ? 1.5 : 1.3; armR.el = k < 0.7 ? 1.9 : 0.2; break;
    case 'stomp': legLa = view === 'side' ? 0.9 * up : 0; jumpY = -10 * up; break;
  }
  const tilt = act && act.k === 'nod' ? Math.sin(k * TAU * 2) : act && act.k === 'shake' ? Math.sin(k * TAU * 3) : 0;
  return { B, s, w, sw, cw, hipY, chestY, headY, armL, armR, legLa, legRa, lean, jumpY, P_, act, k, up, tilt, legL };
}
/* 3-tone palettes */
function tri(c, o = {}) { const R = ramp(c, o); return { d: R[0], s: R[1], b: R[2], l: R[3], h: R[4], R }; }
function hairTones(P) { const c = P.hairC || '#1a1b28', hl = P.hairHl || mix(c, '#9aa4d8', 0.42); return { d: toRGB(mix(c, '#000', 0.45)), s: toRGB(mix(c, '#000', 0.2)), b: toRGB(c), l: toRGB(mix(c, hl, 0.55)), h: toRGB(hl) }; }
const PXSPR = { k: 0.34 };
function pxHuman(P, A, view, bw, bh, axf, ayf, hpx) {
  const Q = chibiPose(P, A, view), B = Q.B, s = Q.s, u = hpx / chibiHeight(P), X = new PX(bw, bh);
  const walking = Q.w > 0.5, bob = walking && Math.abs(Q.sw) < 0.75 ? 1 : 0;
  const ox = Math.round(bw * axf), oy = Math.round(bh * ayf) + Math.round(Q.jumpY * u) - bob;
  const brY = A.breath ? Q.hipY - 6 : -1e9, sx = x => ox + x * u, sy = y => oy + y * u - (y < brY ? 1 : 0), side = view === 'side', back = view === 'back';
  const SK = tri(P.skin || '#fde8dc', { soft: true }), HT = hairTones(P), TOP = tri(P.top || '#efe4cc'), LEG = tri(P.legC || P.skin || '#fde8dc'), BOOT = tri(P.boot || '#8a6040'), KILT = tri(P.kilt || '#b6844f');
  const hipY = Q.hipY, chestY = Q.chestY, P_ = Q.P_, k = PXSPR.k;
  const R1 = v => Math.max(1, v * u); // limb radius in px
  const capT = (L, x0, y0, x1, y1, r0, r1, T, o = {}) => L.cap(sx(x0), sy(y0), sx(x1), sy(y1), R1(r0), R1(r1), T.R, Object.assign({ min: 1, max: 3 }, o));
  const polyT = (L, pts, T, cx, hw) => { const pp = pts.map(([x, y]) => [sx(x), sy(y)]), c = sx(cx); L.poly(pp, T.R, { flat: 2 }); L.poly(pp, T.R, { flat: 1, clip: x => x + 0.5 >= c + hw * u * 0.42 }); L.poly(pp, T.R, { flat: 3, clip: x => x + 0.5 <= c - hw * u * 0.6 }); };
  const part = fn => X.part(fn, { k });
  /* ---------------- head (drawn in px around its centre) ---------------- */
  const headC = () => [sx(side ? 8 * s : 0) + (side ? Math.round(Q.lean * 3) : 0), Math.round(sy(Q.headY + 6 * s)) + (Q.tilt > 0.5 ? 1 : 0)];
  function drawHead(L) {
    const [cx, cy] = headC(), H = P.hair || 'short', F = P.face || {}, kid = P.build === 'kid' || P.build === 'child', mood = A.blink ? (A.mood === 'happy' ? 'happy' : 'closed') : (A.mood || 'open');
    const set = (x, y, c) => L.put(Math.round(cx + x), Math.round(cy + y), c);
    const rx = 6.6, ry = 6.7, jaw = (y) => y > 1.5 ? 1 - 0.32 * ((y - 1.5) / 5.2) ** 2 : 1;
    const inSkull = (x, y) => { const yy = y - 0.4; return (x / (rx * jaw(yy))) ** 2 + (yy / ry) ** 2 <= 1; };
    const bald = H === 'bald';
    // --- hair silhouette functions (head-local px, y down) ---
    const vol = H === 'wild' ? 8.6 : H === 'kid' || H === 'spiky' ? 7.7 : 7.4;
    const cap = (x, y) => (x / vol) ** 2 + ((y + 0.9) / (vol * 0.98)) ** 2 <= 1 && y < 1.6;
    const spikes = (n, hgt) => (x, y) => { const yy = y + 0.9, a = Math.atan2(yy, x); if (a > -0.12 * PI || a < -0.88 * PI) return false; const t = (a + 0.88 * PI) / (0.76 * PI) * n, f = t - Math.floor(t); return Math.hypot(x, yy / 0.98) <= vol + hgt * (1 - Math.abs(f - 0.5) * 2); };
    let front, sideMask, backMask, behind = null, bangLine;
    if (side) {
      // facing right: hair over the back and crown, a fringe falling over the brow
      const fr = H === 'topknot' || bald ? -9 : H === 'short' ? -3.6 : H === 'bun' ? -3.2 : -2.6;
      sideMask = (x, y) => cap(x, y) && (x < -0.6 + y * 0.35 || y < fr + (x > 4 ? (x - 4) * 0.9 : 0) || (H === 'long' || H === 'longtie' || H === 'wild' || H === 'kid') && x < 1.2 && y < 5);
    }
    bangLine = x => { // front fringe bottom edge
      if (H === 'topknot' || bald) return -4.6; if (H === 'short') return -2.6 + (Math.round(x) % 3 === 0 ? 0.8 : 0);
      if (H === 'bun') return -2.2 + (Math.abs(x) < 1 ? -1.2 : 0);
      const j = [0.6, 1.8, 0.4, 2.2, 0.9, 1.6, 0.2]; return -2.4 + j[(Math.round(x) + 14) % 7] * (H === 'kid' ? 1.15 : 0.8);
    };
    const sideburn = H === 'kid' || H === 'long' || H === 'longtie' || H === 'wild' ? 4.5 : H === 'spiky' ? 1.5 : H === 'bun' ? 2 : 0;
    front = (x, y) => cap(x, y) && (y < bangLine(x) || (Math.abs(x) > 5.0 && y < sideburn));
    backMask = (x, y) => (x / vol) ** 2 + ((y + 0.9) / (vol * 0.98)) ** 2 <= 1 && y < 1.6 + [1.4, 2.4, 0.4][(Math.round(x) + 30) % 3] * (Math.abs(x) < vol - 1.5 ? 1 : 0) && !(y > 3.4 && Math.abs(x) < 3 && !(H === 'long' || H === 'longtie' || H === 'wild' || H === 'kid'));
    const extra = []; // hair blobs beyond the cap: [x, y, rx, ry]
    if (H === 'topknot') extra.push(side ? [-1.4, -8.6, 2.4, 2.1] : [0, -8.8, 2.5, 2.1]);
    if (H === 'bun') extra.push(side ? [-5.4, -4.6, 2.6, 2.5] : back ? [0, -5.4, 2.8, 2.6] : [0, -8.0, 2.4, 1.8]);
    if (H === 'kid') extra.push(side ? [-1, -8.6, 0.6, 2.2] : [1.2, -8.8, 0.6, 2.2]); // ahoge
    const spk = H === 'spiky' ? spikes(7, 2.6) : H === 'kid' ? spikes(6, 2.2) : H === 'wild' ? spikes(8, 1.4) : H === 'short' ? spikes(9, 0.9) : null;
    const isHair = (x, y) => { if (bald) return false; const m = side ? sideMask : back ? backMask : front; if (m(x, y)) return true; if (spk && spk(x, y) && (side ? x < 3 : true)) return true; for (const [ex, ey, erx, ery] of extra) if (((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2 <= 1) return true; if (H === 'wild' && !side && Math.abs(x) > 4.6 && y > -3 && y < 6 - ((Math.round(x) + 9) % 3) * 1.4 && Math.abs(x) < 8.4 - Math.max(0, y) * 0.3) return true; return false; };
    // skin
    const prof = (x, y) => { // facing-right profile: brow, nose, lips, chin
      if (!side) return inSkull(x, y); const yy = y - 0.4; if ((x / (rx * jaw(yy))) ** 2 + (yy / ry) ** 2 <= 1) return true; if (x > 0 && x < 7.6 && y > 0.6 && y < 2.8 && x < 6.4 + (y > 1.4 && y < 2.4 ? 1.2 : 0.4)) return true; return false; };
    for (let y = -10; y <= 8; y++) for (let x = -9; x <= 9; x++) { if (!prof(x, y)) continue; let c = SK.b; if (side ? x < -3.5 : x > 3.6) c = SK.s; if (y > 4.6) c = SK.s; if (!side && x < -3.8 && y < 1) c = SK.l; set(x, y, c); }
    // ears
    if (!back && !side) { set(-7, 1, SK.b); set(-7, 2, SK.s); set(7, 1, SK.s); set(7, 2, SK.s); }
    if (side) { set(-1, 1, SK.s); set(-1, 2, SK.s); set(-2, 1, SK.b); set(-2, 2, SK.s); }
    // face
    if (!back) {
      const ex = side ? [3.5] : [-2.7, 2.7], eyc = kid ? 0.6 : 1.0, big = kid || (F.eh || 30) >= 28;
      const ir = toRGB(F.iris ? F.iris[1] || F.iris[0] : '#4a2a1a'), lash = [34, 22, 30], white = [252, 250, 244];
      for (const e of ex) { const x0 = Math.round(e - (side ? 0 : 0.5)), y0 = Math.round(eyc);
        if (mood === 'closed' || mood === 'happy') { if (mood === 'happy') { set(x0, y0 + 1, lash); set(x0 + 1, y0, lash); if (!side) set(x0 + 2, y0 + 1, lash); else set(x0 - 1, y0 + 1, lash); } else { set(x0, y0 + 1, lash); set(x0 + 1, y0 + 1, lash); } continue; }
        if (big) { set(x0, y0 - 1, lash); set(x0 + (side ? 0 : 1), y0 - 1, lash); set(x0, y0, side ? lash : ir); set(x0 + (side ? 0 : 1), y0, side ? lash : lash); set(x0, y0 + 1, ir); if (!side) set(x0 + 1, y0 + 1, ir); set(x0, y0, side ? ir : white); }
        else { set(x0, y0, lash); set(x0, y0 + 1, ir); if (!side) set(x0 + 1, y0, lash); }
        if (mood === 'angry') { set(x0 - (side ? 0 : 1), y0 - 2, lash); set(x0 + 1, y0 - 1, lash); }
      }
      if (!kid && !side && (H === 'topknot' || bald || H === 'short')) for (const e of ex) { const bc = toRGB(F.browC || '#3a2a24'); set(Math.round(e) - 1, Math.round(eyc) - 2, bc); set(Math.round(e), Math.round(eyc) - 2, bc); }
      if (kid && (F.blush ?? 0.2) > 0.15) { const bl = toRGB(mix(P.skin || '#fde8dc', '#ff7a8a', 0.4)); if (side) set(4, 3, bl); else { set(-4, 3, bl); set(4, 3, bl); } }
      const mc = toRGB(mix(P.skin || '#fde8dc', '#802830', 0.55)), my = kid ? 4 : 4.4; if (A.talk || mood === 'angry') { if (side) { set(5, my, mc); set(5, my + 1, mc); } else { set(0, my, mc); set(1, my, mc); set(0, my + 1, mc); } } else if (side) set(5, my, mc); else { set(0, my, mc); if (mood === 'happy') set(1, my, mc); }
      if (F.stubble) for (let x = -3; x <= 3; x++) if ((x & 1) === 0) set(side ? x + 2 : x, 5, SK.d);
      if (F.beard) { const bd = tri(F.beard); for (let y = 3; y <= 9; y++) for (let x = -4; x <= 4; x++) { const hw = 3.6 - Math.max(0, y - 5) * 0.75; if (side ? (x + 2 > 5 || x + 2 < 1 || Math.abs(x) > hw) : Math.abs(x) > hw) continue; if (y === 3 && Math.abs(x) < 1) continue; set(side ? x + 3 : x, y, x > 1 ? bd.s : bd.b); } }
    }
    // hair over the skull
    // hair shading: clumps fanning from the crown (from the whorl in back view), a dark parting line between clumps,
    // the lit edge of each clump towards the light (upper left), and a broken shine band across the crown
    const NCL = H === 'spiky' ? 7 : H === 'kid' ? 6 : H === 'wild' ? 8 : H === 'short' ? 9 : 7;
    const hairCol = (x, y) => {
      const lx = side ? x + 1 : x, yy = y + 0.9, r = Math.hypot(lx, yy / 0.98);
      if (back) { const a = Math.atan2(y + 5.5, x - 1), f = ((a / TAU * 11) % 1 + 1) % 1, rw = Math.hypot(x - 1, y + 5.5);
        if (y > 2.5) return HT.s; if (rw < 1.2) return HT.s;
        if (f < 0.12 && rw > 2) return HT.s; let c = x > 3.5 ? HT.s : HT.b;
        if (f > 0.18 && f < 0.5 && y < -1 && x < 3) c = HT.l; if (rw > 2.6 && rw < 4.0 && x < 2.5 && y < -4 && f > 0.16 && f < 0.62) c = HT.h; return c; }
      if (y > 2) return HT.s;
      if (!side && y >= bangLine(x) - 1.1 && y < bangLine(x) && Math.abs(x) < 5) return HT.d; // under-fringe shadow
      let f; if (yy < -0.4 && r > 2.2) { const a = Math.atan2(yy, lx); f = (((a + 0.88 * PI) / (0.76 * PI) * NCL) % 1 + 1) % 1; } else f = (((x + 14.5) / 2.6) % 1 + 1) % 1;
      if (f < 0.12 && r > vol * 0.45) return HT.s;
      let c = (side ? x < -4 : x > 4) ? HT.s : HT.b; if (f > 0.16 && f < 0.48 && (side ? x > -5 : x < 4.5)) c = c === HT.s ? HT.b : HT.l;
      const sb = vol * 0.62; if (r > sb - 0.8 && r < sb + 0.8 && lx < 2.5 && yy < -1 && f > 0.15 && f < 0.7) c = lx < -1 ? HT.h : HT.l;
      return c; };
    for (let y = -13; y <= 12; y++) for (let x = -10; x <= 10; x++) { if (!isHair(x, y)) continue; set(x, y, hairCol(x, y)); }
    if (H === 'wild') { const bd = toRGB('#8a2a1a'); for (let x = -7; x <= 7; x++) if (!side || x < 5) set(x, -3, bd); }
    if (H === 'longtie' || H === 'bun') { const tc = toRGB(HAIRS[H].tie || '#c8a040'); if (side) set(-4, H === 'bun' ? -5 : 0, tc); else if (back) set(0, H === 'bun' ? -5 : 2, tc); }
  }
  // long hair hanging behind the body
  const longBack = (L, over) => { const H = P.hair; if (!(H === 'long' || H === 'longtie' || H === 'wild' || H === 'kid')) return; const [cx, cy] = headC(); const len = H === 'long' ? 15 : H === 'longtie' ? 14 : H === 'wild' ? 11 : 6;
    for (let y = 2; y <= len; y++) { const t = (y - 2) / Math.max(1, len - 2); let x0, x1; if (side) { x0 = -6 - t * 1.6; x1 = -2 - t * 1.5; if (H === 'longtie') { x0 = -5 - t * 3; x1 = -3 - t * 2.4; } } else { const hw = (H === 'longtie' ? 2.2 - t * 1.0 : 6.4 + (H === 'wild' ? 1.5 : 0) - t * 1.4); x0 = -hw; x1 = hw; if (!over) { x0 = Math.min(x0, -5); x1 = Math.max(x1, 5); } }
      if (!over && !side && !back && H !== 'wild' && H !== 'long') continue;
      for (let x = Math.round(x0); x <= Math.round(x1); x++) { const jag = y === len && (x & 1); if (jag) continue; L.put(Math.round(cx + x), Math.round(cy + y), x > (x0 + x1) / 2 + 1 ? HT.s : (y < 4 ? HT.l : HT.b)); } } };
  /* ---------------- body ---------------- */
  const shW = B.shoulder, hipW = B.hip, ww = B.waist * B.belly * (side ? 0.8 : 1), tw = side ? shW * 0.6 : shW * 0.9, robe = !!P.robe;
  const rb = robe ? -16 : hipY + 6, kiltBot = hipY + (P.kiltL ?? 58) * s * 1.1;
  const torsoPts = side ? [[-tw, chestY + 4], [-tw * 1.0, chestY + B.torso * 0.45], [-ww, hipY - 12], [-ww * (robe ? 1.3 : 1.05), rb], [ww * (robe ? 1.45 : 1.1), rb], [ww * 1.15, hipY - 14], [tw * 1.15, chestY + B.torso * 0.4], [tw * 0.9, chestY]]
    : [[-tw, chestY + 2], [-tw * 0.96, chestY + B.torso * 0.4], [-ww, hipY - 14], [-ww * (robe ? 1.4 : 1.06), rb], [ww * (robe ? 1.4 : 1.06), rb], [ww, hipY - 14], [tw * 0.96, chestY + B.torso * 0.4], [tw, chestY + 2]];
  const SIDEFEET = [];
  const torso = L => { if (robe && side && SIDEFEET.length) { const lo = Math.min(...SIDEFEET) - B.legR * 1.2, hi = Math.max(...SIDEFEET) + B.legR * 1.6; torsoPts[3] = [clamp(lo, -ww * 1.75, -ww * 1.3), rb]; torsoPts[4] = [clamp(hi, ww * 1.45, ww * 1.9), rb]; }
    polyT(L, torsoPts, TOP, 0, tw);
    const clipT = (() => { const pp = torsoPts.map(([x, y]) => [sx(x), sy(y)]); return (x, y) => { let inside = false; for (let i = 0, j = pp.length - 1; i < pp.length; j = i++) { const [ax, ay] = pp[i], [bx, by] = pp[j]; if ((ay > y + 0.5) !== (by > y + 0.5) && x + 0.5 < ax + (y + 0.5 - ay) / (by - ay) * (bx - ax)) inside = !inside; } return inside; }; })();
    if (P.vest && !back) { const vx = side ? tw * 0.55 : 0, vw = side ? tw * 0.6 : tw * 0.36; L.poly([[sx(vx - vw), sy(chestY)], [sx(vx + vw), sy(chestY)], [sx(vx + vw * 0.3), sy(hipY - 14)], [sx(vx - vw * 0.3), sy(hipY - 14)]], SK.R, { flat: 2, clip: clipT }); }
    if (robe && !back && !side) { const tc = toRGB(P.trim || mix(P.top || '#888', '#000', 0.4)); L.line(sx(-tw * 0.4), sy(chestY + 2), sx(ww * 0.35), sy(hipY - 6), tc); L.line(sx(ww * 0.35), sy(hipY - 6), sx(ww * 0.35), sy(rb), tc); L.line(sx(tw * 0.35), sy(chestY + 2), sx(0), sy(chestY + 40), tc); }
    if (robe && side) { const tc = toRGB(P.trim || mix(P.top || '#888', '#000', 0.4)); L.line(sx(tw * 0.9), sy(chestY + 2), sx(ww * 1.1), sy(hipY - 4), tc); }
    if (!P.vest && !robe && !back && !side) { const nx = Math.round(sx(0)), ny = Math.round(sy(chestY + 3)); for (let i = 0; i < 4; i++) for (let dx = -2 + Math.ceil(i / 2); dx <= 2 - Math.ceil(i / 2); dx++) L.put(nx + dx, ny + i, i < 2 ? SK.s : SK.b); L.put(nx - 3, ny, TOP.l); L.put(nx + 3, ny, TOP.s);
      L.line(sx(-tw * 0.62), sy(chestY + B.torso * 0.5), sx(-ww * 0.45), sy(hipY - 17), TOP.s); L.line(sx(tw * 0.55), sy(chestY + B.torso * 0.42), sx(ww * 0.5), sy(hipY - 17), TOP.d); }
    if (!P.vest && !robe && side) L.line(sx(tw * 0.2), sy(chestY + B.torso * 0.45), sx(-ww * 0.2), sy(hipY - 17), TOP.s);
    if (!robe) { const yb = Math.round(sy(chestY + 2)); for (let x = Math.round(sx(-tw * 0.8)); x <= Math.round(sx(-tw * 0.2)); x++) if (clipT(x, yb)) L.put(x, yb, TOP.h); }
    if (robe && !side) { const yh = Math.round(sy(rb)) - 2; for (let x = Math.round(sx(-ww * 1.3)); x <= Math.round(sx(ww * 1.3)); x++) if (clipT(x, yh)) L.put(x, yh, x < sx(0) ? TOP.s : TOP.d); for (const fx of [-0.5, 0.45]) L.line(sx(ww * fx), sy(hipY), sx(ww * fx * 1.4), sy(rb) - 3, TOP.s); }
    const band = (col, y0, y1) => { const T = tri(col); L.poly([[sx(-ww * 1.12), sy(y0)], [sx(ww * 1.12), sy(y0)], [sx(ww * 1.14), sy(y1)], [sx(-ww * 1.14), sy(y1)]], T.R, { flat: 2 }); L.poly([[sx(-ww * 1.12), sy(y0)], [sx(ww * 1.12), sy(y0)], [sx(ww * 1.14), sy(y1)], [sx(-ww * 1.14), sy(y1)]], T.R, { flat: 1, clip: x => x + 0.5 > sx(ww * 0.4) }); return T; };
    if (P.sash) { const T = band(P.sash, hipY - 22, hipY - 4); if (!back) { const kx = side ? -ww * 0.9 : ww * 0.45; for (let i = 0; i < 6; i++) L.put(Math.round(sx(kx)) + (i > 3 ? 1 : 0), Math.round(sy(hipY - 4)) + i, i % 2 ? T.s : T.b); } }
    else if (P.belt !== false && !robe) { const T = band(P.belt || '#6a4428', hipY - 16, hipY - 2); if (!back && !side) { const gold = toRGB('#f0c860'); L.put(Math.round(sx(0)), Math.round(sy(hipY - 9)), gold); L.put(Math.round(sx(0)) - 1, Math.round(sy(hipY - 9)), gold); } }
    if (P.fur) { const T = tri(P.fur), y0 = Math.round(sy(chestY - 4)), x0 = Math.round(sx(-tw * 0.98)), x1 = Math.round(sx(tw * (side ? 1.1 : 0.98))); for (let x = x0; x <= x1; x++) { const d = 1 + ((x * 7) % 3 === 0 ? 1 : 0) + (back ? 0 : 1); for (let y = 0; y <= d; y++) L.put(x, y0 + y, y === 0 ? T.l : y === d ? T.s : T.b); } }
    if (P.necklace && !back && !side) { const wh = toRGB('#f4eedc'); for (let i = -2; i <= 2; i++) L.put(Math.round(sx(0)) + i * 2, Math.round(sy(chestY + 16)) + Math.round(Math.abs(i) * -0.5) + 2, wh); }
  };
  const lower = L => { if (robe || P.pants) return; const kw = hipW * 1.05, kb = hipW * (side ? 1.2 : 1.32); const pts = [[-kw, hipY - 10], [kw, hipY - 10], [kb, kiltBot]]; const n = side ? 4 : 6; for (let i = 1; i <= n; i++) { const x = lerp(kb, -kb, i / n); pts.push([x + kb / n, kiltBot + (i % 2 ? 9 : 2)], [x, kiltBot]); } polyT(L, pts, KILT, 0, kb);
    for (let i = 1; i < n; i++) { const t = lerp(-0.8, 0.8, i / n), x0 = sx(kw * t), x1 = sx(kb * t), y0 = sy(hipY - 2), y1 = sy(kiltBot) - 1; L.line(x0, y0, x1, y1, i % 2 ? KILT.s : KILT.d); }
    const yh = Math.round(sy(hipY - 9)); for (let x = Math.round(sx(-kw * 0.9)); x <= Math.round(sx(kw * 0.9)); x++) if (back || side) L.put(x, yh, KILT.l); };
  const boot = (L, fx, fy, fw, dir) => { const x = Math.round(sx(fx)), y = Math.round(sy(fy)), w = Math.max(2, Math.round(fw * u)); for (let j = -1; j <= 0; j++) for (let i = -Math.floor(w / 2); i < Math.ceil(w / 2) + (dir ? 1 : 0); i++) L.put(x + i + (dir > 0 && j === 0 ? 0 : 0), y + j, j < 0 ? BOOT.b : BOOT.s); if (dir) L.put(x + Math.ceil(w / 2) + 1, y, BOOT.s); };
  const legsFront = L => { for (const sd of [-1, 1]) { const lift = (Q.w > 0.5 ? Math.max(0, sd < 0 ? Q.sw : -Q.sw) : 0) * 2.2 / u; let x0 = sd * hipW * 0.42, x1 = sd * hipW * 0.46, y1 = -6 - lift; if (P_ === 'sit' || P_ === 'cross') { x1 = sd * hipW * 1.4; y1 = hipY + 34; } if (P_ === 'kneel') { y1 = -6; x1 = sd * hipW * 0.7; }
      const T = P.pants || P.legC ? LEG : SK; if (!robe) capT(L, x0, hipY, x1, y1, B.legR, B.legR * 0.85, T);
      if (P.wraps) { const wr = tri(P.wraps); for (let i = 1; i <= 2; i++) { const yy = Math.round(lerp(sy(hipY), sy(y1), 0.62 + i * 0.12)); for (let dx = -1; dx <= 1; dx++) L.put(Math.round(sx(x1)) + dx, yy, wr.b); } }
      boot(L, x1, y1 + 4, B.legR * 2.3, 0); } };
  const legSide = (L, a, far) => { if (robe) a *= 0.5; const x0 = 4, y0 = hipY, L1 = Q.legL * 0.52, L2 = Q.legL * 0.5; let kx = x0 + Math.sin(a) * L1, ky = y0 + Math.cos(a) * L1, knee = Math.max(0, -Math.sin(a + 0.3)) * 0.9 * Q.w; if (P_ === 'sit' || P_ === 'cross' || P_ === 'kneel') { kx = x0 + L1 * 0.95; ky = y0 + 6; knee = -1.5; } const fx = kx + Math.sin(a - knee) * L2, fy = Math.min(-6, ky + Math.cos(a - knee) * L2);
    SIDEFEET.push(fx); const T0 = P.pants || P.legC ? LEG : SK, T = far ? { R: [T0.d, T0.d, T0.s, T0.s, T0.b] } : T0; if (!robe) { capT(L, x0, y0, kx, ky, B.legR, B.legR * 0.9, T); capT(L, kx, ky, fx, fy, B.legR * 0.9, B.legR * 0.8, T); }
    if (P.wraps && !far) { const wr = tri(P.wraps); for (let i = 0; i < 2; i++) { const t = 0.55 + i * 0.2; L.put(Math.round(lerp(sx(kx), sx(fx), t)), Math.round(lerp(sy(ky), sy(fy), t)), wr.b); L.put(Math.round(lerp(sx(kx), sx(fx), t)) + 1, Math.round(lerp(sy(ky), sy(fy), t)), wr.b); } }
    const bx = Math.round(sx(fx)), by = Math.round(sy(fy)) + 2, bc = far ? BOOT.s : BOOT.b; for (let i = -1; i <= 2; i++) L.put(bx + i, by, i === 2 ? BOOT.s : bc); L.put(bx - 1, by - 1, bc); L.put(bx, by - 1, bc); L.put(bx + 1, by - 1, BOOT.s); };
  const armFront = (L, sd, a) => { const x0 = sd * shW * 0.82, y0 = chestY + 12, L1 = B.arm * 0.5, L2 = B.arm * 0.47, a1 = sd * a.sh, ex = x0 + Math.sin(a1) * L1, ey = y0 + Math.cos(a1) * L1, a2 = a1 - sd * a.el, hx = ex + Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2, sl = P.sleeve;
    capT(L, x0, y0, ex, ey, B.armR * 1.05, B.armR * 0.9, sl ? TOP : SK); capT(L, ex, ey, hx, hy, B.armR * 0.9, B.armR * 0.8, sl === 'long' ? TOP : SK);
    if (P.puff !== false && !sl) capT(L, x0, y0 - 4, lerp(x0, ex, 0.4), lerp(y0, ey, 0.4), B.armR * 1.35, B.armR * 1.2, TOP);
    if (P.bracer) capT(L, lerp(ex, hx, 0.45), lerp(ey, hy, 0.45), lerp(ex, hx, 0.85), lerp(ey, hy, 0.85), B.armR * 0.98, B.armR * 0.9, tri(P.bracer));
    L.ell(sx(hx), sy(hy) + 0.5, R1(B.armR * 1.15), R1(B.armR * 1.15), SK.R, { min: 1, max: 3 });
    if (P.bracelet && sd > 0) { const wh = toRGB('#fbf6e8'); L.put(Math.round(sx(lerp(ex, hx, 0.8))) - 1, Math.round(sy(lerp(ey, hy, 0.8))), wh); L.put(Math.round(sx(lerp(ex, hx, 0.8))) + 1, Math.round(sy(lerp(ey, hy, 0.8))), wh); } };
  const armSide = (L, a, el, far) => { const x0 = 0, y0 = chestY + 14, L1 = B.arm * 0.5, L2 = B.arm * 0.47, EX = x0 + Math.sin(a) * L1, EY = y0 + Math.cos(a) * L1, a2 = a + el, HX = EX + Math.sin(a2) * L2, HY = EY + Math.cos(a2) * L2, sl = P.sleeve;
    const dk = T => far ? { R: [T.d, T.d, T.s, T.s, T.b] } : T;
    capT(L, x0, y0, EX, EY, B.armR * 1.05, B.armR * 0.9, dk(sl ? TOP : SK)); capT(L, EX, EY, HX, HY, B.armR * 0.9, B.armR * 0.8, dk(sl === 'long' ? TOP : SK));
    if (P.puff !== false && !sl) capT(L, x0, y0 - 4, lerp(x0, EX, 0.42), lerp(y0, EY, 0.42), B.armR * 1.35, B.armR * 1.2, dk(TOP));
    if (P.bracer) capT(L, lerp(EX, HX, 0.45), lerp(EY, HY, 0.45), lerp(EX, HX, 0.85), lerp(EY, HY, 0.85), B.armR, B.armR * 0.9, dk(tri(P.bracer)));
    L.ell(sx(HX), sy(HY), R1(B.armR * 1.15), R1(B.armR * 1.15), far ? [SK.d, SK.d, SK.s, SK.s, SK.b] : SK.R, { min: 1, max: 3 }); };
  const weapon = (L, behind) => { const wk = P.weapon; if (!wk) return; const W = tri(WCOL[wk] || '#555'); const [cx, cy] = [sx(side ? -tw * 0.5 : behind ? tw * 0.25 : -tw * 0.4), sy(chestY + B.torso * 0.5)], dir = side ? -1 : behind ? -1 : 1;
    const len = wk === 'greatsword' ? 26 : wk === 'spear' || wk === 'redspear' ? 30 : wk === 'bow' ? 22 : 16, a = side ? -0.55 : 0.6 * dir, dx = Math.sin(a), dy = -Math.cos(a);
    for (let i = -len / 2; i <= len / 2; i++) { const x = Math.round(cx + dx * i), y = Math.round(cy + dy * i), tip = i > len / 2 - 4; if (wk === 'greatsword') { if (i < -len / 2 + 6) { L.put(x, y, toRGB('#4a2c1a')); continue; } L.put(x, y, W.b); L.put(x + 1, y, W.l); L.put(x - 1, y, W.s); } else if (wk === 'bow') { const bend = Math.round(Math.cos(i / len * PI) * 3); L.put(x + bend, y, W.b); } else { L.put(x, y, tip && wk !== 'club' ? toRGB('#b8b8c0') : W.b); if (wk === 'club' && i > len / 2 - 5) { L.put(x + 1, y, W.l); L.put(x - 1, y, W.s); } } } };
  /* ---------------- assemble ---------------- */
  if (side) {
    part(L => weapon(L, true));
    part(L => armSide(L, -Q.armL.sh * 0.9 - 0.05, -Q.armL.el, true));
    part(L => { legSide(L, Q.legLa, true); });
    part(L => { legSide(L, Q.legRa, false); lower(L); });
    part(L => { const dy = Math.round(Q.lean * 4); torso(L); capT(L, 6 * s, chestY + 4, 10 * s, Q.headY + 76 * s, 9 * s + B.neck * 0.4, 9 * s + B.neck * 0.38, { R: [SK.d, SK.s, SK.s, SK.b, SK.b] }); });
    if (P.hair === 'long' || P.hair === 'longtie' || P.hair === 'wild') part(L => longBack(L, false));
    part(drawHead);
    part(L => armSide(L, Q.armR.sh * 0.9 + 0.05, Q.armR.el, false));
  } else {
    if (!back) part(L => longBack(L, false));
    if (!back) part(L => weapon(L, false));
    part(legsFront);
    if (back) { part(L => armFront(L, -1, Q.armL)); part(L => armFront(L, 1, Q.armR)); }
    part(L => { lower(L); torso(L); });
    if (!back) { part(L => capT(L, 0, chestY + 4, 0, Q.headY + 80 * s, 9 * s + B.neck * 0.4, 9 * s + B.neck * 0.4, { R: [SK.d, SK.s, SK.s, SK.s, SK.b] })); part(L => armFront(L, -1, Q.armL)); part(L => armFront(L, 1, Q.armR)); }
    part(drawHead);
    if (back) { part(L => longBack(L, true)); part(L => weapon(L, true)); }
  }
  return X;
}
/* lying / fallen: rotate the upright sprite a quarter turn onto the ground */
function pxRotate(src, cw) { const D = new PX(src.h, src.w); for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (!src.d[i + 3]) continue; const nx = cw ? src.h - 1 - y : y, ny = cw ? x : src.w - 1 - x; D.put(nx, ny, [src.d[i], src.d[i + 1], src.d[i + 2]], src.d[i + 3]); } return D; }
