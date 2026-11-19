/* ================= character sprites: 阿岩 (持灯者), 小雾 (灵视者), the ghosts, items =================
   Hero sprites are 20×32, feet on row 30. dir: 0 down (toward camera), 1 left, 2 right (mirrored left), 3 up.
   fr: 0 stand, 1 step, 2 stand (breath), 3 other step.  Extra poses: 'down' (collapsed), 'kneel' (ritual). */
const SW = 20, SH = 32, FEET = 30;
const SCACHE = new Map();
function sprite(kind, dir, fr, pose) {
  const key = kind + dir + fr + (pose || '');
  let c = SCACHE.get(key); if (c) return c;
  c = mk(SW, SH); const g = c.getContext('2d');
  if (dir === 2) { g.translate(SW, 0); g.scale(-1, 1); }
  (kind === 'L' ? drawHolder : drawSeer)(RP(g), dir === 2 ? 1 : dir, fr, pose, g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  outlinePass(c);
  SCACHE.set(key, c); return c;
}
const HC = {
  L: { skin: '#e2ab84', skinD: '#c08462', hair: '#2a1c16', hairL: '#4a3428', coat: '#e2a81e', coatD: '#b8801a', coatL: '#f4c84a', refl: '#d8e0e4', scarf: '#a02a24', scarfD: '#701a18', jeans: '#2c3a58', jeansD: '#1e2a42', boot: '#3a2418', bootL: '#5a3a24', eye: '#1a1210', plaster: '#e8c89a' },
  S: { skin: '#f0c8aa', skinD: '#d0a284', hair: '#14141e', hairL: '#2a2c44', card: '#283456', cardD: '#1c2440', blouse: '#ece6da', ribbon: '#c02a34', skirt: '#2a4a52', skirtL: '#3a6a6a', skirtD: '#1a3038', check: '#6a3a40', sock: '#e8e4dc', shoe: '#1a1416', eye: '#1a2a4a', iris: '#4a8ac8', blush: '#f09a9a' },
};
function drawHolder(R, d, fr, pose) {
  const C = HC.L, step = fr === 1 ? 1 : fr === 3 ? -1 : 0, br = fr === 2 ? 1 : 0;
  if (pose === 'down') return downPose(R, C.coat, C.coatD, C.hair, C.skin, C.jeans);
  const kneel = pose === 'kneel', hy = (kneel ? 5 : 0) + br, ty = 13 + hy;
  // ---- legs
  if (!kneel) {
    if (d === 1) {
      if (!step) { R(8, 23, 3, 6, C.jeans); R(10, 23, 2, 6, C.jeansD); R(7, 28, 5, 2, C.boot); R(7, 28, 2, 1, C.bootL); }
      else { R(7, 23, 4, 2, C.jeans); R(5, 24, 3, 5, step > 0 ? C.jeans : C.jeansD); R(11, 24, 3, 5, step > 0 ? C.jeansD : C.jeans); R(4, 28, 4, 2, C.boot); R(11, 28, 4, 2, C.boot); }
    } else {
      const l1 = step === 1 ? 1 : 0, l2 = step === -1 ? 1 : 0;
      R(6, 23, 3, 6 - l1, C.jeans); R(11, 23, 3, 6 - l2, C.jeansD); R(5, 28 - l1, 4, 2, C.boot); R(11, 28 - l2, 4, 2, C.boot); R(5, 28 - l1, 2, 1, C.bootL);
    }
  } else { R(5, 26, 10, 3, C.jeans); R(4, 28, 5, 2, C.boot); R(11, 28, 5, 2, C.boot); }
  // ---- raincoat (to the knee), reflective band, toggles
  if (d === 1) {
    R(5, ty, 9, 11, C.coat); R(11, ty, 3, 11, C.coatD); R(5, ty + 7, 9, 1, C.refl); R(4, ty + 9, 9, 2, C.coat); R(6, ty + 2, 1, 1, C.coatL);
    const ax = step === 1 ? 6 : step === -1 ? 9 : 7; R(ax, ty + 1, 3, 7, C.coatD); R(ax, ty + 6, 3, 1, C.refl); R(ax - 1, ty + 8, 3, 2, C.skin); R(ax - 4, ty + 8, 4, 2, '#1e1e22'); R(ax - 5, ty + 8, 1, 2, '#ffe69a');
  } else {
    R(4, ty, 12, 11, C.coat); R(13, ty, 3, 11, C.coatD); R(3, ty + 9, 14, 2, C.coat); R(14, ty + 9, 3, 2, C.coatD);
    R(4, ty + 7, 12, 1, C.refl); R(3, ty + 10, 14, 1, C.coatD);
    if (d === 0) { R(9, ty + 1, 1, 9, C.coatD); for (const y of [2, 4, 6]) R(8, ty + y, 3, 1, '#4a3010'); R(5, ty + 8, 3, 2, C.coatD); R(12, ty + 8, 3, 2, C.coatD); R(5, ty + 1, 1, 5, C.coatL); }
    else { R(5, ty - 1, 10, 3, C.coatD); R(6, ty, 8, 2, C.coat); } // hood bunched on the back
    const a1 = step === 1 ? 1 : 0, a2 = step === -1 ? 1 : 0;
    R(2, ty + 1 + a1, 2, 7, C.coat); R(2, ty + 6 + a1, 2, 1, C.refl); R(2, ty + 8 + a1, 2, 2, C.skin);
    R(16, ty + 1 + a2, 2, 7, C.coatD); R(16, ty + 6 + a2, 2, 1, C.refl); R(16, ty + 8 + a2, 2, 2, C.skin);
    if (d === 0) { R(1, ty + 9 + a1, 2, 4, '#1e1e22'); R(1, ty + 13 + a1, 2, 1, '#ffe69a'); } // flashlight
  }
  // ---- scarf
  if (d !== 3) { R(d === 1 ? 6 : 5, ty - 1, d === 1 ? 7 : 10, 2, C.scarf); R(d === 1 ? 11 : 12, ty - 1, 2, 2, C.scarfD); R(d === 1 ? 10 : 12, ty + 1, 2, d === 1 ? 3 : 5, C.scarf); R(d === 1 ? 10 : 12, ty + (d === 1 ? 4 : 6), 2, 1, C.scarfD); }
  else { R(5, ty - 1, 10, 2, C.scarf); R(6, ty + 1, 2, 4, C.scarfD); }
  // ---- head
  const y0 = 1 + hy;
  if (d === 0) {
    R(5, y0 + 3, 10, 8, C.skin); R(6, y0 + 11, 8, 1, C.skin); R(13, y0 + 4, 2, 7, C.skinD); R(4, y0 + 6, 1, 3, C.skin); R(15, y0 + 6, 1, 3, C.skinD);
    R(7, y0 + 7, 1, 2, C.eye); R(12, y0 + 7, 1, 2, C.eye); R(7, y0 + 7, 1, 1, '#4a3a30'); R(6, y0 + 6, 3, 1, C.hair); R(11, y0 + 6, 3, 1, C.hair);
    R(9, y0 + 10, 2, 1, '#a0624a'); R(12, y0 + 9, 2, 1, C.plaster);
    // messy hair
    R(5, y0, 10, 4, C.hair); R(4, y0 + 1, 12, 3, C.hair); R(4, y0 + 4, 1, 3, C.hair); R(15, y0 + 4, 1, 3, C.hair); R(6, y0 - 1, 3, 1, C.hair); R(10, y0 - 1, 2, 1, C.hair);
    R(5, y0 + 4, 2, 1, C.hair); R(8, y0 + 4, 3, 2, C.hair); R(12, y0 + 4, 2, 1, C.hair); R(9, y0 + 6, 1, 1, C.hair); R(7, y0 + 1, 3, 1, C.hairL); R(12, y0 + 2, 2, 1, C.hairL);
  } else if (d === 1) {
    R(5, y0 + 3, 9, 8, C.skin); R(6, y0 + 11, 6, 1, C.skin); R(4, y0 + 7, 1, 2, C.skin); R(11, y0 + 5, 3, 6, C.skinD);
    R(6, y0 + 7, 1, 2, C.eye); R(5, y0 + 6, 3, 1, C.hair); R(5, y0 + 10, 2, 1, '#a0624a'); R(8, y0 + 8, 2, 1, C.plaster);
    R(5, y0, 10, 4, C.hair); R(9, y0 + 3, 6, 5, C.hair); R(14, y0 + 2, 1, 7, C.hair); R(4, y0 + 2, 3, 3, C.hair); R(6, y0 - 1, 4, 1, C.hair); R(13, y0 - 1, 2, 2, C.hair); R(7, y0 + 1, 3, 1, C.hairL); R(11, y0 + 6, 2, 3, C.skinD); R(11, y0 + 7, 1, 1, '#c8806a');
  } else {
    R(5, y0 + 3, 10, 8, C.skinD); R(4, y0 + 6, 1, 3, C.skinD); R(15, y0 + 6, 1, 3, C.skinD);
    R(5, y0, 10, 10, C.hair); R(4, y0 + 1, 12, 8, C.hair); R(6, y0 - 1, 3, 1, C.hair); R(11, y0 - 1, 2, 1, C.hair); R(7, y0 + 9, 6, 2, C.hair); R(6, y0 + 2, 3, 1, C.hairL); R(10, y0 + 4, 3, 1, C.hairL);
  }
}
function drawSeer(R, d, fr, pose) {
  const C = HC.S, step = fr === 1 ? 1 : fr === 3 ? -1 : 0, br = fr === 2 ? 1 : 0;
  if (pose === 'down') return downPose(R, C.card, C.cardD, C.hair, C.skin, C.skirt);
  const kneel = pose === 'kneel', hy = (kneel ? 5 : 0) + br, ty = 13 + hy;
  // ---- legs: socks + mary janes
  if (!kneel) {
    if (d === 1) {
      if (!step) { R(8, 23, 3, 6, C.sock); R(7, 28, 4, 2, C.shoe); }
      else { R(5, 23, 2, 6, C.sock); R(11, 23, 2, 6, C.sock); R(4, 28, 4, 2, C.shoe); R(10, 28, 4, 2, C.shoe); }
      R(8, 22, 3, 2, C.skin);
    } else {
      const l1 = step === 1 ? 1 : 0, l2 = step === -1 ? 1 : 0;
      R(7, 22, 2, 2, C.skin); R(11, 22, 2, 2, C.skin); R(7, 24, 2, 5 - l1, C.sock); R(11, 24, 2, 5 - l2, C.sock); R(6, 28 - l1, 4, 2, C.shoe); R(11, 28 - l2, 4, 2, C.shoe); R(7, 28 - l1, 2, 1, '#3a2a30');
    }
  } else { R(5, 27, 10, 2, C.sock); R(4, 28, 4, 2, C.shoe); R(12, 28, 4, 2, C.shoe); }
  // ---- long hair behind (front/side views)
  const y0 = 1 + hy;
  if (d === 0) { R(3, y0 + 5, 2, 14, C.hair); R(15, y0 + 5, 2, 14, C.hair); }
  if (d === 1) { R(10, y0 + 5, 5, 15, C.hair); R(14, y0 + 8, 1, 10, C.hairL); }
  // ---- pleated tartan skirt
  const sy = ty + 7;
  if (d === 1) { R(5, sy, 10, 4, C.skirt); R(5, sy + 1, 10, 1, C.check); R(4, sy + 3, 12, 2, C.skirt); for (let x = 5; x < 15; x += 2) R(x, sy + 2, 1, 3, C.skirtD); }
  else { R(5, sy, 10, 3, C.skirt); R(4, sy + 2, 12, 3, C.skirt); R(4, sy + 3, 12, 1, C.check); for (let x = 5; x < 16; x += 2) R(x, sy + 1, 1, 4, C.skirtD); R(6, sy, 1, 4, C.skirtL); R(11, sy, 1, 4, C.skirtL); }
  // ---- cardigan over a white blouse with a red ribbon
  if (d === 1) { R(6, ty, 7, 8, C.card); R(10, ty, 3, 8, C.cardD); R(5, ty, 2, 5, C.blouse); R(5, ty + 1, 2, 2, C.ribbon); }
  else {
    R(5, ty, 10, 8, C.card); R(12, ty, 3, 8, C.cardD);
    if (d === 0) { R(8, ty, 4, 7, C.blouse); R(7, ty - 1, 6, 2, C.blouse); R(8, ty + 1, 4, 1, C.ribbon); R(9, ty + 2, 2, 2, C.ribbon); R(7, ty + 3, 1, 1, '#d8dcec'); R(12, ty + 3, 1, 1, '#d8dcec'); R(9, ty + 6, 2, 1, '#9fdcff'); }
    else { R(7, ty - 1, 6, 2, C.blouse); }
  }
  // arms + lantern (left hand when facing down)
  const a1 = step === 1 ? 1 : 0, a2 = step === -1 ? 1 : 0;
  if (d === 1) { const ax = step === 1 ? 6 : step === -1 ? 9 : 7; R(ax, ty + 1, 3, 6, C.cardD); R(ax, ty + 7, 3, 2, C.skin); }
  else {
    R(3, ty + 1 + a1, 2, 6, C.card); R(3, ty + 7 + a1, 2, 2, C.skin); R(15, ty + 1 + a2, 2, 6, C.cardD); R(15, ty + 7 + a2, 2, 2, C.skin);
    if (d === 0) { const lx = 16, ly = ty + 9 + a2; R(lx, ly, 3, 1, '#2a2a2e'); R(lx, ly + 1, 3, 4, '#9fe0ff'); R(lx + 1, ly + 2, 1, 2, '#e8fbff'); R(lx, ly + 5, 3, 1, '#2a2a2e'); }
  }
  // ---- head
  if (d === 0) {
    R(5, y0 + 3, 10, 8, C.skin); R(6, y0 + 11, 8, 1, C.skin); R(13, y0 + 5, 2, 6, C.skinD);
    // big eyes: dark lash line, blue iris, white glint
    R(6, y0 + 7, 3, 1, '#0a0810'); R(11, y0 + 7, 3, 1, '#0a0810'); R(6, y0 + 8, 2, 2, C.iris); R(12, y0 + 8, 2, 2, C.iris); R(8, y0 + 8, 1, 2, '#f8f4ee'); R(11, y0 + 8, 1, 2, '#f8f4ee'); R(6, y0 + 8, 1, 1, '#e8fbff'); R(12, y0 + 8, 1, 1, '#e8fbff'); R(5, y0 + 6, 1, 1, '#0a0810'); R(14, y0 + 6, 1, 1, '#0a0810');
    R(6, y0 + 10, 1, 1, C.blush); R(13, y0 + 10, 1, 1, C.blush); R(9, y0 + 11, 2, 1, '#b8606a'); R(7, y0 + 10, 1, 1, '#6a3a3a');
    // hime cut: blunt bangs, straight side locks
    R(5, y0, 10, 6, C.hair); R(4, y0 + 1, 12, 5, C.hair); R(4, y0 + 6, 2, 8, C.hair); R(14, y0 + 6, 2, 8, C.hair); R(6, y0 - 1, 8, 1, C.hair);
    R(7, y0 + 1, 4, 1, C.hairL); R(6, y0 + 2, 1, 2, C.hairL); R(13, y0 + 1, 2, 2, '#c8d0e0');
  } else if (d === 1) {
    R(5, y0 + 3, 8, 8, C.skin); R(6, y0 + 11, 5, 1, C.skin); R(4, y0 + 7, 1, 2, C.skin);
    R(5, y0 + 7, 2, 1, '#0a0810'); R(5, y0 + 8, 2, 2, C.iris); R(5, y0 + 8, 1, 1, '#e8fbff'); R(7, y0 + 10, 1, 1, C.blush); R(5, y0 + 11, 1, 1, '#b8606a');
    R(5, y0, 10, 6, C.hair); R(9, y0 + 3, 6, 9, C.hair); R(4, y0 + 1, 3, 5, C.hair); R(6, y0 - 1, 7, 1, C.hair); R(7, y0 + 1, 4, 1, C.hairL); R(11, y0 + 4, 1, 6, C.hairL);
  } else {
    R(4, y0, 12, 20, C.hair); R(5, y0 - 1, 10, 1, C.hair); R(3, y0 + 5, 1, 14, C.hair); R(16, y0 + 5, 1, 14, C.hair); R(6, y0 + 2, 2, 12, C.hairL); R(11, y0 + 3, 1, 14, C.hairL); R(5, y0 + 19, 10, 1, C.hair); R(12, y0 + 1, 2, 2, '#c8d0e0');
  }
}
function downPose(R, coat, coatD, hair, skin, legs) {
  R(2, 24, 10, 5, coat); R(2, 27, 10, 2, coatD); R(12, 25, 6, 3, legs); R(17, 25, 2, 3, '#1a1416'); R(-1, 23, 5, 5, hair); R(1, 25, 3, 3, skin); R(5, 22, 4, 2, coatD);
}

/* ---------- ghosts: semi-transparent figures, 24×38, bottom fades to mist ---------- */
const GW = 24, GH = 40;
function ghostSprite(kind, dir, fr, hunt) {
  const key = 'g' + kind + dir + fr + (hunt ? 'h' : '');
  let c = SCACHE.get(key); if (c) return c;
  c = mk(GW, GH); const g = c.getContext('2d');
  if (dir === 2) { g.translate(GW, 0); g.scale(-1, 1); }
  const R = RP(g); (GDRAW[kind] || GDRAW.veil)(R, dir === 2 ? 1 : dir, fr, hunt, g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  outlinePass(c, 200, [8, 10, 20]);
  const im = g.getImageData(0, 0, GW, GH), d = im.data, fadeFrom = kind === 'boss' ? 33 : 27;
  for (let y = fadeFrom; y < GH; y++) for (let x = 0; x < GW; x++) { const i = (y * GW + x) * 4; d[i + 3] *= clamp(1 - (y - fadeFrom) / (GH - fadeFrom), 0, 1) * (0.6 + 0.4 * hash(x, y, fr)); }
  g.putImageData(im, 0, 0);
  SCACHE.set(key, c); return c;
}
const wob = (fr, k) => Math.round(Math.sin(fr * 1.57 + k) * 1);
const GDRAW = {
  veil: (R, d, fr) => { const w = wob(fr, 0); R(6, 6, 12, 26, '#c8d8e8'); R(5, 10, 14, 22, '#b8c8dc'); R(7, 3, 10, 6, '#d8e4f0'); R(5 + w, 30, 3, 6, '#b8c8dc'); R(11, 31, 3, 5, '#b8c8dc'); R(16 - w, 30, 3, 6, '#b8c8dc'); if (d !== 3) { R(9, 9, 2, 3, '#0a0a14'); R(13, 9, 2, 3, '#0a0a14'); R(11, 14, 2, 2, '#1a1a28'); } R(14, 8, 3, 20, '#a8b8cc'); },
  bride: (R, d, fr, hunt) => {
    const w = wob(fr, 1);
    R(6, 14, 12, 18, '#e8ecf0'); R(4, 22, 16, 12, '#dce2ea'); R(3 + w, 30, 18, 6, '#d0d8e2'); R(14, 14, 4, 20, '#c8d0dc'); for (let x = 5; x < 19; x += 3) R(x, 24, 1, 10, '#c0c8d4');
    R(8, 13, 8, 4, '#e0e6ee'); R(4, 15, 2, 8, '#e8ecf0'); R(18, 15, 2, 8, '#d0d8e2'); R(4, 22, 2, 2, '#e8d8d0'); R(18, 22, 2, 2, '#e8d8d0');
    // head, long black hair, veil
    R(8, 4, 8, 9, d === 3 ? '#14141c' : '#e8e0dc'); R(7, 2, 10, 4, '#14141c'); R(6, 4, 2, 16, '#14141c'); R(16, 4, 2, 16, '#14141c'); if (d === 3) R(7, 4, 10, 14, '#14141c');
    if (d === 0) { R(9, 8, 2, hunt ? 2 : 1, hunt ? '#ff3a3a' : '#1a1a24'); R(13, 8, 2, hunt ? 2 : 1, hunt ? '#ff3a3a' : '#1a1a24'); R(10, 11, 4, 1, '#7a2a3a'); R(9, 9, 1, 3, '#5a6a8a'); R(14, 9, 1, 3, '#5a6a8a'); }
    if (d === 1) { R(8, 8, 2, 1, '#1a1a24'); R(8, 11, 2, 1, '#7a2a3a'); }
    R(5, 1, 14, 2, 'rgba(240,244,250,.9)'); R(4, 3, 2, 22, 'rgba(230,236,246,.55)'); R(18, 3, 2, 22, 'rgba(230,236,246,.55)'); R(10, 15, 4, 3, '#c8a8b0');
  },
  child: (R, d, fr, hunt) => {
    const s = fr % 2;
    R(7, 30, 3, 6 - s, '#c8d8e0'); R(14, 30, 3, 5 + s, '#c8d8e0'); R(6, 20, 12, 11, '#8aa0b8'); R(5, 26, 14, 5, '#7a90a8'); R(7, 20, 10, 2, '#e8ecf0'); R(5, 21, 2, 6, '#8aa0b8'); R(17, 21, 2, 6, '#8aa0b8'); R(4, 27, 2, 2, '#e8dcd4');
    R(17, 26, 4, 5, '#a88a6a'); R(18, 25, 2, 2, '#a88a6a'); R(18, 27, 1, 1, '#1a1a1a');
    R(7, 10, 10, 10, d === 3 ? '#3a2a20' : '#ece4dc'); R(6, 9, 12, 4, '#3a2a20'); R(6, 12, 2, 5, '#3a2a20'); R(16, 12, 2, 5, '#3a2a20'); R(7, 8, 3, 1, '#3a2a20');
    if (d === 0) { R(9, 14, 2, 2, hunt ? '#ff4a4a' : '#141418'); R(13, 14, 2, 2, hunt ? '#ff4a4a' : '#141418'); R(10, 18, 4, 1, hunt ? '#5a1a1a' : '#9a5a5a'); if (hunt) R(11, 18, 2, 2, '#1a0808'); }
    if (d === 1) { R(8, 14, 2, 2, '#141418'); R(8, 18, 2, 1, '#9a5a5a'); }
  },
  keeper: (R, d, fr, hunt) => {
    const w = wob(fr, 2);
    R(6, 14, 12, 20, '#4a4a5a'); R(5, 20, 14, 14, '#3e3e4c'); R(14, 14, 4, 20, '#34343e'); R(8, 14, 8, 6, '#d8d8d0'); R(11, 15, 2, 4, '#2a2a34');
    for (const y of [22, 25, 28]) R(11, y, 2, 1, '#c8b878'); R(4, 15, 2, 12, '#4a4a5a'); R(18, 15, 2, 12, '#3e3e4c');
    R(1 + w, 24, 4, 6, '#3a3424'); R(2 + w, 25, 2, 4, hunt ? '#ff8a4a' : '#ffd88a'); R(2 + w, 23, 2, 1, '#2a2418'); // lantern
    R(18, 27, 3, 3, '#a8984a'); R(19, 26, 1, 1, '#a8984a'); // keys
    R(8, 4, 8, 10, '#d8d4c8'); R(7, 3, 10, 3, '#e8e8e0'); R(7, 4, 1, 4, '#e8e8e0'); R(16, 4, 1, 4, '#e8e8e0');
    if (d === 0) { R(9, 8, 2, 1, hunt ? '#ff3a3a' : '#2a2a34'); R(13, 8, 2, 1, hunt ? '#ff3a3a' : '#2a2a34'); R(9, 12, 6, 2, '#e8e8e0'); R(9, 7, 6, 1, '#b8b4a8'); }
    if (d === 1) { R(8, 8, 2, 1, '#2a2a34'); R(8, 11, 4, 2, '#e8e8e0'); R(7, 9, 1, 2, '#d8d4c8'); }
  },
  faceless: (R, d, fr, hunt) => {
    const w = wob(fr, 3);
    R(7, 10, 10, 26, '#1a1a24'); R(6, 16, 12, 18, '#14141c'); R(5 + w, 30, 4, 7, '#14141c'); R(15 - w, 30, 4, 7, '#14141c');
    R(3, 12, 3, 20, '#1a1a24'); R(18, 12, 3, 20, '#1a1a24'); R(2, 30, 3, 4, '#1a1a24'); R(19, 30, 3, 4, '#1a1a24'); R(2, 33, 1, 3, '#1a1a24'); R(21, 33, 1, 3, '#1a1a24');
    R(8, 0, 8, 10, '#d8d8dc'); R(7, 2, 10, 7, '#d0d0d4'); R(8, 9, 8, 2, '#b8b8bc'); R(13, 1, 3, 8, '#b8b8c0');
    if (hunt && d !== 3) { R(9, 6, 6, 1, '#4a1a1a'); R(10, 7, 4, 1, '#2a0a0a'); }
    if (d === 3) R(8, 0, 8, 10, '#14141c');
  },
  boss: (R, d, fr, hunt) => {
    const w = wob(fr, 4);
    // tall gown, high collar, piled hair
    R(6, 14, 12, 22, '#5a4a6a'); R(3, 24, 18, 13, '#4e3e5e'); R(2 + w, 32, 20, 6, '#463656'); R(15, 14, 3, 22, '#3e2e4e'); for (let x = 4; x < 21; x += 3) R(x, 26, 1, 11, '#3a2a4a');
    R(8, 14, 8, 8, '#6a5a7a'); R(10, 15, 4, 6, '#d8c8d8'); R(11, 16, 2, 2, '#8a2a3a'); R(4, 15, 2, 12, '#5a4a6a'); R(18, 15, 2, 12, '#4e3e5e'); R(3, 26, 3, 3, '#e8dcd8'); R(18, 26, 3, 3, '#e8dcd8'); R(2, 28, 2, 4, '#e8dcd8');
    R(8, 11, 8, 4, '#e8e0e8'); R(7, 11, 1, 3, '#e8e0e8'); R(16, 11, 1, 3, '#e8e0e8');
    R(8, 3, 8, 9, d === 3 ? '#2a1a24' : '#e8dcd4'); R(7, 0, 10, 5, '#2a1a24'); R(8, -1, 8, 2, '#2a1a24'); R(6, 3, 2, 6, '#2a1a24'); R(16, 3, 2, 6, '#2a1a24'); R(11, 0, 2, 1, '#c8a84a');
    if (d === 0) { R(9, 7, 2, 1, hunt ? '#ff2a4a' : '#2a1a2a'); R(13, 7, 2, 1, hunt ? '#ff2a4a' : '#2a1a2a'); R(10, 10, 4, 1, '#8a2a3a'); R(9, 8, 1, 1, '#a898a8'); }
    if (d === 1) { R(8, 7, 2, 1, '#2a1a2a'); R(8, 10, 2, 1, '#8a2a3a'); }
    R(12, 5, 1, 1, hunt ? '#ffffff' : '#e8dcd4');
  },
};

/* ---------- small things: items, anchors, evidence ---------- */
function itemSprite(k) {
  const key = 'it' + k; let c = SCACHE.get(key); if (c) return c;
  c = mk(12, 12); const R = RP(c.getContext('2d'));
  if (k === 'ring') { R(3, 4, 6, 1, '#d8b04a'); R(3, 8, 6, 1, '#a8802a'); R(2, 5, 1, 3, '#d8b04a'); R(9, 5, 1, 3, '#a8802a'); R(5, 2, 2, 2, '#e8f4ff'); }
  else if (k === 'doll') { R(4, 1, 4, 4, '#e8d8c0'); R(3, 0, 6, 2, '#8a4a2a'); R(3, 5, 6, 5, '#a84a4a'); R(1, 5, 2, 3, '#e8d8c0'); R(9, 5, 2, 3, '#e8d8c0'); R(4, 10, 2, 2, '#e8d8c0'); R(7, 10, 2, 2, '#e8d8c0'); R(5, 2, 1, 1, '#141414'); R(6, 6, 1, 3, '#e8c84a'); }
  else if (k === 'watch') { R(3, 3, 6, 6, '#c8a84a'); R(4, 4, 4, 4, '#ece6d6'); R(5, 1, 2, 2, '#c8a84a'); R(6, 5, 1, 2, '#141414'); R(6, 6, 2, 1, '#141414'); }
  else if (k === 'salt') { R(3, 3, 6, 8, '#d8dce4'); R(3, 1, 6, 2, '#5a5e66'); R(4, 5, 4, 3, '#f4f4f8'); R(4, 4, 1, 6, '#ffffff'); }
  else if (k === 'fuse') { R(3, 2, 6, 8, '#e8e4d8'); R(4, 0, 4, 2, '#a8a8b0'); R(4, 10, 4, 2, '#a8a8b0'); R(5, 4, 2, 4, '#c87a3a'); }
  else if (k === 'brass') { R(2, 4, 4, 4, '#d8b04a'); R(3, 5, 2, 2, '#3a2a10'); R(6, 5, 5, 2, '#c8a03a'); R(9, 7, 1, 2, '#c8a03a'); R(7, 7, 1, 2, '#c8a03a'); }
  else R(3, 3, 6, 6, '#c8c8c8');
  outlinePass(c); SCACHE.set(key, c); return c;
}
function anchorSprite(k, state) {
  const key = 'an' + k + state; let c = SCACHE.get(key); if (c) return c;
  c = mk(16, 18); const R = RP(c.getContext('2d'));
  R(3, 14, 10, 3, '#3a2a1e'); R(2, 16, 12, 1, '#2a1a10');
  if (k === 'hair') { R(6, 3, 4, 11, '#141418'); R(5, 5, 1, 7, '#141418'); R(10, 6, 1, 8, '#141418'); for (let y = 4; y < 13; y += 2) R(5, y, 6, 1, '#c82a2a'); }
  else if (k === 'nail') { R(5, 4, 6, 10, '#a88a4a'); R(4, 6, 8, 2, '#a88a4a'); R(6, 2, 4, 3, '#a88a4a'); R(7, 6, 2, 1, '#2a2a2a'); R(7, 1, 2, 12, '#5a5e66'); R(6, 1, 4, 1, '#7a7e86'); }
  else { R(4, 2, 8, 12, '#2a1a14'); R(5, 3, 6, 10, '#3a2a1e'); R(6, 4, 4, 5, '#9ab8c8'); R(7, 5, 1, 3, '#e8f4ff'); R(6, 10, 4, 1, '#c8a84a'); }
  if (state === 1) for (let i = 0; i < 6; i++) R((hash(i, 1, 2) * 14) | 0, 2 + ((hash(1, i, 3) * 12) | 0), 2, 1, '#ff3a3a');
  outlinePass(c); SCACHE.set(key, c); return c;
}

/* ---------- jump-scare faces (32×32), one per ghost ---------- */
function faceSprite(kind) {
  const key = 'face' + kind; let c = SCACHE.get(key); if (c) return c;
  c = mk(32, 32); const R = RP(c.getContext('2d'));
  const skin = kind === 'faceless' ? '#d8d8dc' : kind === 'keeper' ? '#d0ccc0' : kind === 'boss' ? '#e8dcd4' : '#e4dcd8';
  const hair = kind === 'keeper' ? '#e8e8e0' : kind === 'child' ? '#3a2a20' : kind === 'boss' ? '#2a1a24' : '#0e0e14';
  R(0, 0, 32, 32, '#000000');
  R(6, 3, 20, 27, skin); R(4, 7, 24, 20, skin); R(8, 29, 16, 3, shade(skin, -0.2));
  R(3, 0, 26, 8, hair); R(2, 4, 5, 28, hair); R(25, 4, 5, 28, hair);
  if (kind === 'faceless') { R(8, 12, 16, 1, shade(skin, -0.15)); R(10, 20, 12, 2, '#3a0a0a'); R(12, 22, 8, 3, '#120404'); }
  else {
    const eye = kind === 'child' ? 3 : 4;
    R(9, 12, 5, eye, '#ffffff'); R(18, 12, 5, eye, '#ffffff'); R(11, 13, 2, 2, '#0a0a0a'); R(20, 13, 2, 2, '#0a0a0a');
    R(9, 11, 5, 1, '#1a0a0a'); R(18, 11, 5, 1, '#1a0a0a');
    if (kind === 'bride') { R(10, 16, 1, 9, '#5a1a2a'); R(21, 16, 1, 8, '#5a1a2a'); R(12, 23, 8, 4, '#2a0608'); R(13, 23, 6, 1, '#d8d0c8'); }
    if (kind === 'child') { R(10, 22, 12, 3, '#1a0404'); for (let x = 11; x < 21; x += 2) R(x, 22, 1, 1, '#e8e0d8'); R(9, 21, 1, 1, '#1a0404'); R(22, 21, 1, 1, '#1a0404'); }
    if (kind === 'keeper') { R(8, 20, 16, 7, '#e8e8e0'); R(12, 22, 8, 3, '#1a0a0a'); R(8, 9, 6, 1, '#7a766c'); R(18, 9, 6, 1, '#7a766c'); }
    if (kind === 'boss') { R(12, 23, 8, 2, '#6a0a1a'); R(11, 22, 1, 1, '#6a0a1a'); R(20, 22, 1, 1, '#6a0a1a'); R(11, 13, 2, 2, '#ff1a3a'); R(20, 13, 2, 2, '#ff1a3a'); R(14, 2, 4, 2, '#c8a84a'); }
    if (kind === 'veil') { R(4, 0, 24, 32, 'rgba(220,228,240,.55)'); R(12, 22, 8, 4, '#120404'); }
  }
  SCACHE.set(key, c); return c;
}
