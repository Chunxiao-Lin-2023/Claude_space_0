/* ================= 十夜怪谈 · 精灵：人物生成器、瓦片、道具 ================= */
function shade(hex, k) {   // k>0 变亮，k<0 变暗
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => clamp(Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)), 0, 255);
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
const OUTLINE = [18, 12, 16];
function outlinePass(c, alpha = 255) {
  const g = c.getContext('2d'), W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), d = im.data, src = new Uint8ClampedArray(d);
  for (let y = 0; y < H; y++)for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (src[i + 3] > 0) continue;
    const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && src[(yy * W + xx) * 4 + 3] > 40;
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) { d[i] = OUTLINE[0]; d[i + 1] = OUTLINE[1]; d[i + 2] = OUTLINE[2]; d[i + 3] = alpha; }
  }
  g.putImageData(im, 0, 0);
}

/* ---------------- 人物生成器 16×24，脚底在 y=22 ----------------
 参数 P：skin hair hs(short|long|bob|bun|twin|bald|queue|messy) top top2 bottom shoes
   skirt dress robe noFeet child ghost cover(头发盖脸) redEye mask eye mouth
   hat(qing|cap|straw|veil|scarf|hood) hatC  coat(长外套) apron  extra(g,d,fr,G)  key(有 extra 时必填) */
const PCACHE = new Map();
function personSprite(P, dir, fr) {
  const key = (P.key || JSON.stringify(P)) + '|' + dir + '|' + fr;
  let c = PCACHE.get(key); if (c) return c;
  c = mk(16, 24); const g = c.getContext('2d');
  if (dir === 2) { g.translate(16, 0); g.scale(-1, 1); }
  drawPerson(g, P, dir === 2 ? 1 : dir, fr);
  g.setTransform(1, 0, 0, 1, 0, 0);
  outlinePass(c, P.ghost ? 210 : 255);
  if (P.ghost) {   // 下半身淡出
    const im = g.getImageData(0, 0, 16, 24), d = im.data;
    for (let y = 13; y < 24; y++) for (let x = 0; x < 16; x++) { const i = (y * 16 + x) * 4; d[i + 3] = d[i + 3] * clamp((23 - y) / 10, 0, 1); }
    g.putImageData(im, 0, 0);
  }
  PCACHE.set(key, c); return c;
}
function drawPerson(g, P, d, fr) {
  const R = (x, y, w, h, col) => { if (!col || w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(x, y, w, h); };
  const ch = !!P.child, hT = ch ? 7 : 2, tT = hT + 8, tB = ch ? 18 : 16, lT = tB + 1, lB = 21, L = lB - lT + 1;
  const G = { hT, tT, tB, lT, lB };
  const step = fr === 1 ? 1 : fr === 3 ? -1 : 0;
  const skin = P.skin || '#f0c8a0', hair = P.hair || '#2b2020', top = P.top || '#55607a', top2 = P.top2 || shade(top, -.25);
  const bot = P.bottom || '#33384a', shoe = P.shoes || '#1b1b1b', eye = P.eye || '#1a1214';
  const dk = shade(top, -.22), bdk = shade(bot, -.25);
  const lowerEnd = P.robe || P.ghost ? 21 : P.dress ? Math.min(21, tB + 4) : P.coat ? tB + 3 : P.skirt ? tB + 2 : 0;
  const armL = tB - tT - 1;
  const legs = !(P.ghost || (P.robe && P.noFeet));
  if (d === 0 || d === 3) {
    /* ---- 正面 / 背面 ---- */
    if (legs) {
      const lift1 = step === 1 ? 1 : 0, lift2 = step === -1 ? 1 : 0;
      if (!P.robe) { R(5, lT, 2, L - lift1, bot); R(9, lT, 2, L - lift2, bdk); }
      if (!P.noFeet) { R(5, 22 - lift1, 2, 1, shoe); R(9, 22 - lift2, 2, 1, shoe); }
    }
    if (d === 3 && (P.hs === 'long' || P.cover)) R(3, hT + 2, 10, tT - hT + 4, hair);
    if (lowerEnd) { R(4, tB - 1, 8, 1, top); R(3, tB, 10, lowerEnd - tB + 1, P.robe || P.ghost ? top : (P.dress || P.coat ? top : bot)); R(11, tB, 2, lowerEnd - tB + 1, P.robe || P.dress || P.coat || P.ghost ? dk : bdk); }
    R(4, tT, 8, tB - tT + 1, top); R(10, tT + 1, 2, tB - tT, dk);
    if (d === 0) { R(6, tT, 4, 1, top2); if (P.apron) R(5, tT + 2, 6, lowerEnd ? lowerEnd - tT - 2 : tB - tT - 1, P.apron); }
    if (P.coat && d === 0) { R(7, tT + 1, 1, lowerEnd - tT - 1, dk); }
    const a1 = step === 1 ? 1 : 0, a2 = step === -1 ? 1 : 0;
    R(3, tT + 1 + a1, 1, armL - 1, top); R(3, tT + armL + a1, 1, 1, skin);
    R(12, tT + 1 + a2, 1, armL - 1, dk); R(12, tT + armL + a2, 1, 1, skin);
    // 头
    R(4, hT, 8, 7, skin); R(5, hT + 7, 6, 1, skin); R(10, hT + 1, 1, 6, shade(skin, -.08));
    const hs = P.hs || 'short';
    if (d === 0) {
      if (P.cover) {
        R(3, hT, 10, 3, hair); R(4, hT + 3, 8, 5, hair); R(3, hT + 3, 1, tT - hT + 2, hair); R(12, hT + 3, 1, tT - hT + 2, hair);
        R(5, hT + 8, 1, 2, hair); R(8, hT + 8, 2, 3, hair); R(10, hT + 8, 1, 1, hair);
        R(8, hT + 5, 1, 1, P.redEye ? '#ff3a3a' : '#e8e8e8');
        if (P.redEye) R(7, hT + 6, 1, 1, '#3a0d0d');
      } else {
        R(6, hT + 4, 1, 2, eye); R(9, hT + 4, 1, 2, eye);
        if (P.redEye) { R(6, hT + 4, 1, 1, '#ff3030'); R(9, hT + 4, 1, 1, '#ff3030'); }
        if (P.mouth) R(7, hT + 6, 2, 1, P.mouth);
        if (P.blush) { R(5, hT + 6, 1, 1, P.blush); R(10, hT + 6, 1, 1, P.blush); }
        if (hs === 'short' || hs === 'bun' || hs === 'twin' || hs === 'messy') { R(4, hT, 8, 3, hair); R(3, hT + 1, 1, 3, hair); R(12, hT + 1, 1, 3, hair); R(4, hT + 3, 1, 1, hair); R(11, hT + 3, 1, 1, hair); if (hs === 'messy') { R(5, hT - 1, 2, 1, hair); R(9, hT - 1, 1, 1, hair); R(7, hT + 3, 2, 1, hair); } }
        if (hs === 'long') { R(4, hT, 8, 3, hair); R(3, hT + 1, 1, tT - hT + 3, hair); R(12, hT + 1, 1, tT - hT + 3, hair); R(4, hT + 3, 1, 4, hair); R(11, hT + 3, 1, 4, hair); }
        if (hs === 'bob') { R(3, hT, 10, 4, hair); R(3, hT + 4, 2, 4, hair); R(11, hT + 4, 2, 4, hair); }
        if (hs === 'bun') R(6, hT - 2, 4, 2, hair);
        if (hs === 'twin') { R(1, hT + 2, 2, 6, hair); R(13, hT + 2, 2, 6, hair); }
        if (hs === 'bald') R(4, hT, 8, 1, shade(skin, -.12));
        if (hs === 'queue') { R(4, hT, 8, 2, shade(skin, -.15)); R(4, hT + 2, 8, 1, hair); }
        if (P.mask) { R(4, hT + 5, 8, 3, '#ecebe4'); R(4, hT + 7, 8, 1, '#cfcdc4'); R(3, hT + 5, 1, 1, '#d8d8d0'); R(12, hT + 5, 1, 1, '#d8d8d0'); }
        if (P.slit) { R(4, hT + 6, 8, 1, '#5a0c10'); R(3, hT + 5, 1, 1, '#5a0c10'); R(12, hT + 5, 1, 1, '#5a0c10'); }
      }
    } else {
      if (hs === 'bald') R(4, hT, 8, 2, shade(skin, -.12));
      else if (hs === 'queue') { R(4, hT, 8, 2, shade(skin, -.15)); R(4, hT + 2, 8, 5, hair); R(7, hT + 7, 2, tB - hT - 4, hair); }
      else if (hs === 'bob') R(3, hT, 10, 8, hair);
      else { R(4, hT, 8, 6, hair); R(3, hT + 1, 1, 4, hair); R(12, hT + 1, 1, 4, hair); }
      if (hs === 'long' || P.cover) R(4, hT, 8, 8, hair);
      if (hs === 'bun') R(6, hT - 2, 4, 2, hair);
      if (hs === 'twin') { R(1, hT + 2, 2, 6, hair); R(13, hT + 2, 2, 6, hair); }
    }
  } else {
    /* ---- 侧面（朝左；朝右由镜像得到） ---- */
    if (legs) {
      if (step === 0) { if (!P.robe) { R(6, lT, 2, L, bot); R(8, lT, 2, L, bdk); } if (!P.noFeet) { R(5, 22, 3, 1, shoe); R(8, 22, 2, 1, shoe); } }
      else {
        const fc = step === 1 ? bot : bdk, bc = step === 1 ? bdk : bot;
        if (!P.robe) { R(6, lT, 4, 1, bot); R(4, lT + 1, 2, L - 1, fc); R(9, lT + 1, 2, L - 1, bc); }
        if (!P.noFeet) { R(3, 22, 3, 1, shoe); R(9, 22, 3, 1, shoe); }
      }
    }
    if (P.hs === 'long' || P.cover) R(8, hT + 3, 4, tT - hT + 3, hair);
    if (lowerEnd) { R(4, tB - 1, 8, 1, top); R(4, tB, 8, lowerEnd - tB + 1, P.robe || P.dress || P.coat || P.ghost ? top : bot); R(10, tB, 2, lowerEnd - tB + 1, dk); }
    R(5, tT, 6, tB - tT + 1, top); R(9, tT, 2, tB - tT + 1, dk);
    if (P.apron) R(4, tT + 2, 2, (lowerEnd || tB) - tT - 2, P.apron);
    const ax = step === 1 ? 6 : step === -1 ? 8 : 7;
    R(ax, tT + 1, 2, armL - 1, dk); R(ax, tT + armL, 2, 1, skin);
    R(5, hT, 6, 7, skin); R(6, hT + 7, 4, 1, skin); R(4, hT + 4, 1, 1, skin);
    const hs = P.hs || 'short';
    if (P.cover) { R(4, hT, 8, 3, hair); R(4, hT + 3, 3, 6, hair); R(7, hT + 3, 5, 5, hair); R(5, hT + 5, 1, 1, P.redEye ? '#ff3a3a' : '#ddd'); }
    else {
      R(6, hT + 4, 1, 2, eye); if (P.redEye) R(6, hT + 4, 1, 1, '#ff3030');
      if (P.mouth) R(5, hT + 6, 1, 1, P.mouth);
      if (hs === 'bald') R(5, hT, 6, 1, shade(skin, -.12));
      else if (hs === 'queue') { R(5, hT, 6, 2, shade(skin, -.15)); R(8, hT + 2, 3, 5, hair); R(10, hT + 6, 2, tB - hT - 4, hair); }
      else {
        R(5, hT, 6, 3, hair); R(9, hT + 3, 2, 3, hair); R(11, hT + 1, 1, 5, hair);
        if (hs === 'messy') R(6, hT - 1, 3, 1, hair);
        if (hs === 'long') { R(5, hT + 3, 1, 2, hair); R(9, hT + 3, 3, 7, hair); }
        if (hs === 'bob') { R(4, hT, 8, 3, hair); R(8, hT + 3, 4, 5, hair); R(5, hT + 3, 1, 3, hair); }
        if (hs === 'bun') R(9, hT - 1, 3, 3, hair);
        if (hs === 'twin') R(11, hT + 2, 3, 6, hair);
      }
      if (P.mask) { R(3, hT + 5, 5, 3, '#ecebe4'); R(8, hT + 5, 2, 1, '#d8d8d0'); }
      if (P.slit) R(3, hT + 6, 7, 1, '#5a0c10');
    }
  }
  // 帽子
  const hc = P.hatC;
  if (P.hat === 'qing') { R(3, hT - 1, 10, 3, hc || '#2a2420'); R(4, hT - 2, 8, 1, shade(hc || '#2a2420', .15)); R(7, hT - 3, 2, 1, '#c03030'); }
  if (P.hat === 'cap') { R(4, hT - 1, 8, 3, hc || '#2b3d6b'); if (d === 0) R(4, hT + 2, 8, 1, shade(hc || '#2b3d6b', -.3)); if (d === 1) R(2, hT + 1, 3, 1, shade(hc || '#2b3d6b', -.3)); }
  if (P.hat === 'straw') { R(1, hT + 1, 14, 1, hc || '#c9a35a'); R(4, hT - 1, 8, 2, shade(hc || '#c9a35a', .15)); }
  if (P.hat === 'veil') { const v = hc || '#e8e4dc'; R(3, hT - 1, 10, 2, v); R(2, hT, 2, tT - hT + 5, v); R(12, hT, 2, tT - hT + 5, v); if (d === 3) R(3, hT, 10, tT - hT + 4, v); }
  if (P.hat === 'scarf') { const v = hc || '#5a3a3a'; R(3, hT - 1, 10, 3, v); R(3, hT + 2, 1, 6, v); R(12, hT + 2, 1, 6, v); if (d === 3) R(4, hT, 8, 8, v); }
  if (P.hat === 'hood') { const v = hc || '#3a3a44'; R(3, hT - 1, 10, 3, v); R(3, hT + 2, 1, 6, v); R(12, hT + 2, 1, 6, v); if (d === 3) R(3, hT, 10, 9, v); }
  if (P.extra) P.extra(g, d, fr, G, R);
}

/* ---------------- 瓦片 ---------------- */
const TILE = {};
function defTile(name, solid, paint) { TILE[name] = { solid, paint }; }
function speck(R, base, cols, X, Y, n, s = 0) { R(0, 0, 16, 16, base); for (let i = 0; i < n; i++) { const h = hash(X * 31 + i, Y * 17 + i, s); R((h * 16) | 0, (hash(X, Y, i + s * 7 + 3) * 16) | 0, 1, 1, cols[i % cols.length]); } }
defTile('void', true, (R) => R(0, 0, 16, 16, '#050507'));
defTile('black', false, (R) => R(0, 0, 16, 16, '#09090c'));
defTile('wood', false, (R, X, Y, m) => {
  const base = (m && m.woodC) || '#6b4a2f';
  for (let r = 0; r < 4; r++) { const h = hash(X, Y * 4 + r, 1); R(0, r * 4, 16, 4, shade(base, (h - .5) * .18)); R(0, r * 4 + 3, 16, 1, shade(base, -.3)); R(((h * 997) | 0) % 16, r * 4, 1, 3, shade(base, -.3)); }
});
defTile('darkwood', false, (R, X, Y) => TILE.wood.paint(R, X, Y, { woodC: '#3d2a1c' }));
defTile('lightwood', false, (R, X, Y) => TILE.wood.paint(R, X, Y, { woodC: '#9b7a4e' }));
defTile('tile', false, (R, X, Y, m) => {
  const a = (m && m.tileC) || '#cfcabb', gr = shade(a, -.22);
  R(0, 0, 16, 16, a); R(0, 0, 16, 1, gr); R(0, 8, 16, 1, gr); R(0, 0, 1, 16, gr); R(8, 0, 1, 16, gr);
  if (hash(X, Y, 5) < .25) R(((hash(X, Y, 6) * 12) | 0) + 2, ((hash(X, Y, 7) * 12) | 0) + 2, 2, 1, shade(a, -.12));
});
defTile('greentile', false, (R, X, Y) => TILE.tile.paint(R, X, Y, { tileC: '#8fa597' }));
defTile('checker', false, (R, X, Y) => { for (let i = 0; i < 2; i++)for (let j = 0; j < 2; j++) R(i * 8, j * 8, 8, 8, (i + j + X + Y) % 2 ? '#202024' : '#c9c5ba'); });
defTile('carpet', false, (R, X, Y, m) => speck(R, (m && m.carpetC) || '#5a2730', [shade((m && m.carpetC) || '#5a2730', .12), shade((m && m.carpetC) || '#5a2730', -.2)], X, Y, 14, 2));
defTile('rug', false, (R, X, Y, m) => { const c = (m && m.rugC) || '#7a3a2a'; R(0, 0, 16, 16, c); R(1, 1, 14, 14, shade(c, .12)); R(3, 3, 10, 10, c); R(7, 7, 2, 2, '#c9a35a'); });
defTile('tatami', false, (R, X, Y) => { R(0, 0, 16, 16, '#a9a36e'); for (let y = 1; y < 16; y += 2) R(0, y, 16, 1, '#b8b27c'); if (Y % 2 === 0) R(0, 0, 16, 1, '#3a4a2a'); if (X % 2 === 0) R(0, 0, 1, 16, '#3a4a2a'); });
defTile('concrete', false, (R, X, Y) => { speck(R, '#6d6d70', ['#7a7a7d', '#5e5e61', '#666669'], X, Y, 16, 3); if (hash(X, Y, 9) < .12) { R(3, 6, 4, 1, '#4c4c50'); R(7, 7, 3, 1, '#4c4c50'); } });
defTile('linoleum', false, (R, X, Y) => { speck(R, '#7f8a78', ['#8a9583', '#74806e'], X, Y, 10, 4); R(0, 15, 16, 1, '#6f7a68'); });
defTile('grass', false, (R, X, Y, m) => { const b = (m && m.grassC) || '#2c4428'; speck(R, b, [shade(b, .15), shade(b, -.18), shade(b, .25)], X, Y, 22, 5); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 40 + i); R((h * 14) | 0, (hash(Y, X, 50 + i) * 13) | 0, 1, 2, shade(b, .3)); } });
defTile('dirt', false, (R, X, Y) => speck(R, '#4d3c2b', ['#5b4835', '#3f3123', '#57442f'], X, Y, 18, 6));
defTile('mud', false, (R, X, Y) => speck(R, '#33291f', ['#3d3226', '#2a2119'], X, Y, 14, 7));
defTile('sand', false, (R, X, Y) => speck(R, '#8c7a58', ['#9a8763', '#7d6c4d'], X, Y, 16, 8));
defTile('asphalt', false, (R, X, Y) => speck(R, '#2a2a2e', ['#333338', '#232327', '#38383d'], X, Y, 18, 9));
defTile('roadline', false, (R, X, Y) => { TILE.asphalt.paint(R, X, Y); if (X % 2 === 0) R(2, 7, 12, 2, '#b39a3a'); });
defTile('roadlinev', false, (R, X, Y) => { TILE.asphalt.paint(R, X, Y); if (Y % 2 === 0) R(7, 2, 2, 12, '#b39a3a'); });
defTile('crosswalk', false, (R, X, Y) => { TILE.asphalt.paint(R, X, Y); R(0, 2, 16, 4, '#9c9c98'); R(0, 10, 16, 4, '#9c9c98'); });
defTile('sidewalk', false, (R, X, Y) => { R(0, 0, 16, 16, '#7f7f7b'); R(0, 0, 16, 1, '#6a6a66'); R(0, 0, 1, 16, '#6a6a66'); R(8, 0, 1, 16, '#73736f'); if (hash(X, Y, 11) < .2) R(4, 9, 3, 1, '#6f6f6b'); });
defTile('stone', false, (R, X, Y) => { R(0, 0, 16, 16, '#4c4944'); const o = Y % 2 ? 4 : 0; for (let i = -1; i < 3; i++) R(o + i * 8 + 1, 1, 6, 6, shade('#66625a', (hash(X, Y, i) - .5) * .2)); for (let i = -1; i < 3; i++) R(((o + 4) % 8) + i * 8 + 1, 9, 6, 6, shade('#66625a', (hash(X, Y, i + 9) - .5) * .2)); });
defTile('marble', false, (R, X, Y) => { R(0, 0, 16, 16, '#c8c3b8'); R(0, 15, 16, 1, '#a8a398'); R(15, 0, 1, 16, '#a8a398'); const h = hash(X, Y, 12); R((h * 10) | 0, 3, 5, 1, '#b3ad9f'); R(((h * 10) | 0) + 4, 4, 3, 1, '#b3ad9f'); });
defTile('metal', false, (R, X, Y) => { R(0, 0, 16, 16, '#565a61'); for (let i = 0; i < 16; i += 4) for (let j = 0; j < 16; j += 4) R(i + ((j / 4) % 2) * 2, j + 1, 1, 2, '#6c7078'); });
defTile('busfloor', false, (R) => { R(0, 0, 16, 16, '#3a3833'); for (let y = 1; y < 16; y += 3) R(0, y, 16, 1, '#45433d'); });
defTile('redfloor', false, (R, X, Y) => speck(R, '#2e0d0f', ['#3b1215', '#240a0b'], X, Y, 10, 13));
defTile('water', true, (R, X, Y) => { R(0, 0, 16, 16, '#1b3149'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 20 + i); R((h * 12) | 0, (hash(X, Y, 30 + i) * 14) | 0, 4, 1, '#2b4a68'); } });
defTile('shallow', false, (R, X, Y) => { R(0, 0, 16, 16, '#2a4a5a'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 60 + i); R((h * 12) | 0, (hash(X, Y, 70 + i) * 14) | 0, 3, 1, '#3d6476'); } });
defTile('tree', true, (R, X, Y, m) => { TILE.grass.paint(R, X, Y, m); const c = (m && m.treeC) || '#1d3320'; R(1, 2, 14, 12, c); R(2, 1, 12, 14, c); R(3, 3, 6, 4, shade(c, .2)); R(4, 4, 3, 2, shade(c, .35)); R(9, 10, 4, 3, shade(c, -.3)); R(6, 13, 4, 3, '#2a1c12'); });
defTile('pine', true, (R, X, Y, m) => { TILE.grass.paint(R, X, Y, m); const c = '#15281a'; for (let i = 0; i < 7; i++) R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? c : shade(c, .15)); R(7, 14, 2, 2, '#2a1c12'); });
defTile('hedge', true, (R, X, Y) => { R(0, 0, 16, 16, '#203a20'); for (let i = 0; i < 10; i++) R((hash(X, Y, i) * 14) | 0, (hash(Y, X, i) * 14) | 0, 3, 2, i % 2 ? '#2b4d2a' : '#162b16'); R(0, 13, 16, 3, '#132413'); });
defTile('reeds', true, (R, X, Y) => { R(0, 0, 16, 16, '#22362e'); for (let i = 0; i < 7; i++) { const x = (hash(X, Y, i) * 15) | 0; R(x, 2 + (i % 3), 1, 13, i % 2 ? '#6b7a45' : '#56653a'); R(x, 1 + (i % 3), 1, 2, '#8a6a3a'); } });
defTile('fence', true, (R, X, Y, m) => { TILE[(m && m.fenceBase) || 'grass'].paint(R, X, Y, m); R(0, 6, 16, 2, '#5a4430'); R(0, 11, 16, 2, '#5a4430'); R(2, 3, 2, 12, '#6e5438'); R(11, 3, 2, 12, '#6e5438'); });
defTile('rail', true, (R, X, Y) => { TILE.asphalt.paint(R, X, Y); R(0, 7, 16, 3, '#8d9196'); R(0, 7, 16, 1, '#b4b8bd'); R(3, 9, 2, 6, '#6b6f74'); R(11, 9, 2, 6, '#6b6f74'); });
defTile('rock', true, (R, X, Y, m) => { TILE.grass.paint(R, X, Y, m); R(2, 5, 12, 9, '#4f4d4a'); R(3, 4, 9, 2, '#5f5d59'); R(4, 6, 4, 2, '#706d68'); R(2, 12, 12, 2, '#3a3836'); });
defTile('counterT', true, (R) => { R(0, 0, 16, 16, '#7a6a55'); R(0, 0, 16, 3, '#9a8a72'); R(0, 13, 16, 3, '#4a3f33'); });
defTile('bushes', true, (R, X, Y, m) => { TILE.grass.paint(R, X, Y, m); R(1, 5, 14, 10, '#23402a'); R(3, 4, 5, 3, '#2f5236'); R(8, 6, 5, 3, '#2f5236'); R(1, 13, 14, 2, '#142619'); });

/* 墙：下方不是墙 → 画墙面；否则画墙顶 */
const WALLSTYLE = {
  paper: { top: '#1b1820', face: '#5b4b5e', trim: '#2c2230', pat: 'paper' },
  plain: { top: '#1a1a1e', face: '#6d6a62', trim: '#3a3732', pat: 'plain' },
  brick: { top: '#1d1615', face: '#6a3a30', trim: '#3a201b', pat: 'brick' },
  wood: { top: '#1a140f', face: '#5e4430', trim: '#30221a', pat: 'wood' },
  tile: { top: '#18191b', face: '#b8b6a8', trim: '#6c6a60', pat: 'tile' },
  school: { top: '#1a1b1c', face: '#a49c86', trim: '#4f5a48', pat: 'plain' },
  concrete: { top: '#151517', face: '#5c5d60', trim: '#38393c', pat: 'concrete' },
  stone: { top: '#141412', face: '#55524b', trim: '#302e2a', pat: 'stone' },
  shoji: { top: '#1c1712', face: '#d9d2bc', trim: '#4a3a28', pat: 'shoji' },
  red: { top: '#120405', face: '#4a1316', trim: '#250809', pat: 'plain' },
  bus: { top: '#1a1d22', face: '#2f4f5f', trim: '#1c2a33', pat: 'busw' },
  mud: { top: '#1a1510', face: '#6b5a42', trim: '#3a2f22', pat: 'plain' },
  metal: { top: '#16181b', face: '#70757d', trim: '#40444a', pat: 'metal' }
};
function paintWall(R, X, Y, face, st, isWall) {
  if (!face) {
    R(0, 0, 16, 16, st.top);
    const e = shade(st.top, .18);
    if (!isWall(X - 1, Y)) R(0, 0, 1, 16, e); if (!isWall(X + 1, Y)) R(15, 0, 1, 16, e); if (!isWall(X, Y - 1)) R(0, 0, 16, 1, e);
    return;
  }
  const f = st.face; R(0, 0, 16, 16, f);
  switch (st.pat) {
    case 'paper': for (let x = 2; x < 16; x += 5) R(x, 0, 1, 13, shade(f, -.1)); for (let x = 4; x < 16; x += 5) R(x, 4 + (X % 2) * 4, 1, 1, shade(f, .15)); break;
    case 'brick': for (let r = 0; r < 4; r++) { R(0, r * 4 + 3, 16, 1, shade(f, -.3)); const o = (r + Y) % 2 ? 0 : 4; R(o, r * 4, 1, 3, shade(f, -.3)); R(o + 8, r * 4, 1, 3, shade(f, -.3)); } break;
    case 'wood': for (let x = 0; x < 16; x += 4) R(x, 0, 1, 14, shade(f, -.25)); break;
    case 'tile': R(0, 4, 16, 1, shade(f, -.15)); R(0, 9, 16, 1, shade(f, -.15)); R(5, 0, 1, 14, shade(f, -.15)); R(11, 0, 1, 14, shade(f, -.15)); break;
    case 'concrete': if (hash(X, Y, 3) < .3) R(4, 5, 5, 1, shade(f, -.2)); R(0, 7, 16, 1, shade(f, -.06)); break;
    case 'stone': for (let r = 0; r < 3; r++) { R(0, r * 5 + 4, 16, 1, shade(f, -.3)); R((r * 6 + X * 3) % 16, r * 5, 1, 4, shade(f, -.3)); } break;
    case 'shoji': R(0, 0, 16, 14, '#d9d2bc'); for (let x = 0; x < 16; x += 5) R(x, 0, 1, 14, '#5a4630'); R(0, 4, 16, 1, '#5a4630'); R(0, 9, 16, 1, '#5a4630'); break;
    case 'busw': R(0, 0, 16, 3, '#2f4f5f'); R(1, 3, 14, 8, '#0d1a24'); R(2, 4, 4, 2, '#24425a'); R(0, 11, 16, 3, '#2f4f5f'); break;
    case 'metal': for (let x = 3; x < 16; x += 6) R(x, 0, 1, 14, shade(f, -.2)); R(0, 2, 16, 1, shade(f, .12)); break;
  }
  R(0, 0, 16, 1, shade(f, -.35));
  R(0, 14, 16, 2, st.trim);
}

/* ---------------- 道具/家具精灵 ----------------
 SPR[name](g, e, t, R)：原点在实体所在瓦片左上角，可画到瓦片外（向上）。
 R(x,y,w,h,col) 是带当前偏移的 fillRect。 */
const SPR = {};
const box = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
Object.assign(SPR, {
  bed(g, e, t, R) { const c = e.col || '#7a5a8a'; box(R, 1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6'); R(2, 10, 12, 19, c); R(2, 10, 12, 2, shade(c, .2)); R(2, 27, 12, 2, shade(c, -.25)); },
  bedL(g, e, t, R) { const c = e.col || '#7a5a8a'; box(R, -2, 1, 34, 14, '#5a3c26'); R(0, 3, 6, 10, '#e6e2d6'); R(8, 2, 22, 12, c); R(8, 2, 2, 12, shade(c, .2)); },
  futon(g, e, t, R) { const c = e.col || '#3f5a7a'; R(1, 1, 14, 30, '#d8d2c2'); R(2, 2, 12, 6, '#eeeae0'); R(1, 9, 14, 22, c); R(1, 9, 14, 2, shade(c, .2)); },
  table(g, e, t, R) { const c = e.col || '#6b4a30'; R(1, 12, 2, 4, shade(c, -.4)); R(13, 12, 2, 4, shade(c, -.4)); box(R, 0, 2, 16, 11, c); R(1, 3, 14, 2, shade(c, .15)); },
  table2(g, e, t, R) { const c = e.col || '#6b4a30'; R(1, 12, 2, 4, shade(c, -.4)); R(29, 12, 2, 4, shade(c, -.4)); box(R, 0, 1, 32, 12, c); R(1, 2, 30, 2, shade(c, .15)); },
  lowtable(g, e, t, R) { const c = e.col || '#4a3020'; box(R, 0, 5, 32, 9, c); R(1, 6, 30, 2, shade(c, .15)); R(2, 13, 2, 2, '#2a1a10'); R(28, 13, 2, 2, '#2a1a10'); },
  chair(g, e, t, R) { const c = e.col || '#5a3a24'; R(3, -2, 10, 9, shade(c, -.45)); R(4, -1, 8, 7, c); box(R, 3, 6, 10, 5, shade(c, .1)); R(4, 11, 2, 4, shade(c, -.4)); R(10, 11, 2, 4, shade(c, -.4)); },
  sofa(g, e, t, R) { const c = e.col || '#5a3030'; box(R, 0, -2, 32, 10, shade(c, -.1)); box(R, 0, 6, 32, 9, c); box(R, 0, 2, 4, 12, shade(c, -.15)); box(R, 28, 2, 4, 12, shade(c, -.15)); },
  armchair(g, e, t, R) { const c = e.col || '#5a3030'; box(R, 1, -3, 14, 10, shade(c, -.1)); box(R, 1, 5, 14, 9, c); box(R, 0, 2, 3, 11, shade(c, -.15)); box(R, 13, 2, 3, 11, shade(c, -.15)); },
  desk(g, e, t, R) { const c = e.col || '#5d4632'; box(R, 0, 1, 16, 13, c); R(1, 2, 14, 2, shade(c, .18)); R(9, 6, 6, 6, shade(c, -.15)); R(11, 8, 2, 1, '#c9a35a'); },
  schooldesk(g, e, t, R) { R(2, 10, 1, 6, '#555'); R(13, 10, 1, 6, '#555'); box(R, 1, 3, 14, 8, '#b08a5a'); R(2, 4, 12, 1, '#c9a170'); R(4, -2, 8, 5, '#6a6a6a'); R(5, -1, 6, 3, '#8a7050'); },
  bookshelf(g, e, t, R) { box(R, 0, -10, 16, 25, '#4a3020'); for (let s = 0; s < 3; s++) { R(1, -9 + s * 8, 14, 1, '#2a1a10'); for (let b = 0; b < 6; b++) R(2 + b * 2, -8 + s * 8, 2, 6 - (b % 3 === 0 ? 1 : 0), ['#7a2a2a', '#2a4a6a', '#5a6a2a', '#6a5a2a', '#4a2a5a', '#8a7a5a'][(b + s * 2) % 6]); } },
  wardrobe(g, e, t, R) { const c = e.col || '#4a3020'; box(R, 0, -12, 16, 27, c); R(7, -11, 2, 25, shade(c, -.4)); R(5, 0, 1, 3, '#c9a35a'); R(10, 0, 1, 3, '#c9a35a'); if (e.open) { R(1, -11, 14, 25, '#0a0606'); } },
  closet(g, e, t, R) { box(R, 0, -12, 16, 27, '#c9bfa5'); R(7, -11, 2, 25, '#8a7f66'); R(5, 0, 1, 3, '#555'); R(10, 0, 1, 3, '#555'); if (e.open) R(1, -11, 14, 25, '#0b0909'); },
  mirror(g, e, t, R) {   // 挂在墙面上（实体放在墙瓦片）
    box(R, 3, -1, 10, 14, e.frame || '#8a6a2a');
    const glass = e.covered ? null : '#93a5b5';
    if (e.covered) { R(2, -2, 12, 17, e.covered === true ? '#d8d4ca' : e.covered); R(3, 12, 10, 3, shade(e.covered === true ? '#d8d4ca' : e.covered, -.15)); return; }
    R(4, 0, 8, 12, '#4b5c6b'); R(5, 1, 2, 6, glass); R(8, 2, 1, 4, '#7a8d9e');
    if (e.cracked) { R(6, 3, 1, 1, '#ddd'); R(7, 4, 1, 1, '#ddd'); R(8, 5, 1, 2, '#ddd'); R(5, 5, 1, 1, '#ddd'); R(9, 3, 1, 1, '#ddd'); }
    if (e.blood) { R(5, 1, 1, 6, '#7a0c0c'); R(9, 2, 1, 8, '#7a0c0c'); R(7, 1, 1, 3, '#7a0c0c'); }
    if (e.face) { const f = e.face; R(6, 2, 4, 6, f === 'red' ? '#a43030' : '#d5d0c8'); R(5, 1, 6, 3, '#151010'); R(5, 4, 1, 6, '#151010'); R(10, 4, 1, 6, '#151010'); R(7, 4, 1, 1, '#111'); R(9, 4, 1, 1, '#111'); if (f === 'red') { R(7, 4, 1, 1, '#ff3030'); R(9, 4, 1, 1, '#ff3030'); } }
  },
  vanity(g, e, t, R) { box(R, 1, -10, 14, 12, '#8a6a2a'); R(3, -8, 10, 8, e.covered ? '#d8d4ca' : '#4b5c6b'); if (!e.covered) R(4, -7, 2, 5, '#93a5b5'); box(R, 0, 2, 16, 12, '#6b4a30'); R(7, 6, 2, 1, '#c9a35a'); },
  sink(g, e, t, R) { box(R, 2, 2, 12, 10, '#d8d6cf'); R(4, 4, 8, 5, '#9aa3a8'); R(7, 0, 2, 4, '#a0a4a8'); R(5, 12, 6, 4, '#c8c6bf'); },
  toilet(g, e, t, R) { box(R, 4, -2, 8, 6, '#e0ded8'); box(R, 3, 4, 10, 10, '#e0ded8'); R(5, 6, 6, 6, e.water || '#9fb3bb'); },
  squat(g, e, t, R) { box(R, 4, 2, 8, 12, '#e0ded8'); R(6, 4, 4, 8, '#5f7277'); },
  stall(g, e, t, R) {   // 隔间门（正面），站在门前调查
    const c = e.col || '#7b8a7a';
    box(R, 0, -10, 16, 24, c); R(1, -9, 14, 2, shade(c, .15));
    if (e.open) { R(2, -8, 12, 21, '#0d0f0e'); R(5, 4, 6, 7, '#cfcdc6'); } else { R(12, 1, 2, 2, '#c9c9c9'); R(1, 13, 14, 1, shade(c, -.4)); }
    if (e.num) { R(6, -7, 4, 4, '#e8e4d8'); }
    if (e.red) R(2, 13, 12, 2, '#a01818');
  },
  bathtub(g, e, t, R) { box(R, 0, 1, 32, 14, '#e2e0d8'); R(2, 3, 28, 10, e.full ? '#7f9fae' : '#bfc3c2'); if (e.full) R(4, 5, 8, 1, '#a9c3cd'); R(27, 0, 3, 3, '#999'); },
  door(g, e, t, R) {   // 墙面上的门
    const c = e.col || '#5a3a22';
    if (e.open) { R(2, -2, 12, 16, '#08070a'); R(2, -2, 2, 16, shade(c, -.2)); return; }
    box(R, 2, -2, 12, 16, c); R(4, 0, 8, 5, shade(c, .1)); R(4, 7, 8, 5, shade(c, .1)); R(11, 6, 2, 2, '#c9a35a');
    if (e.locked) R(11, 8, 2, 1, '#8a8a8a');
  },
  sliding(g, e, t, R) { if (e.open) { R(1, -2, 14, 16, '#0a0806'); return; } R(0, -2, 16, 16, '#5a4630'); R(1, -1, 7, 14, '#d9d2bc'); R(8, -1, 7, 14, '#d9d2bc'); R(4, -1, 1, 14, '#5a4630'); R(11, -1, 1, 14, '#5a4630'); R(1, 5, 14, 1, '#5a4630'); },
  window(g, e, t, R) { box(R, 2, 1, 12, 10, '#4a3a2a'); R(3, 2, 10, 8, e.lit ? '#d9c27a' : '#0e1726'); R(7, 2, 1, 8, '#4a3a2a'); R(3, 5, 10, 1, '#4a3a2a'); if (!e.lit) { R(10, 3, 2, 1, '#c8d0e0'); } if (e.face) { R(4, 6, 3, 4, '#d5d0c8'); R(4, 6, 3, 1, '#151010'); } },
  curtain(g, e, t, R) { R(1, 0, 14, 13, '#2b1c26'); R(1, 0, 14, 1, '#4a3a2a'); for (let x = 2; x < 15; x += 3) R(x, 1, 1, 12, '#3a2633'); },
  clock(g, e, t, R) { box(R, 2, -14, 12, 29, '#4a2e18'); R(4, -12, 8, 8, '#d9d2b5'); R(7, -10, 1, 3, '#111'); R(8, -8, 2, 1, '#111'); R(6, -2, 4, 12, '#2a1a0c'); const s = Math.sin(t * 3.14) * 2; R(8 + s, 0, 1, 7, '#c9a35a'); R(7 + s, 6, 3, 3, '#c9a35a'); },
  wallclock(g, e, t, R) { R(4, 1, 8, 8, '#2a2420'); R(5, 2, 6, 6, '#d8d2c0'); R(7, 3, 1, 3, '#111'); R(8, 5, 2, 1, '#111'); },
  tv(g, e, t, R) {
    box(R, 0, 0, 16, 13, '#2a2a2a'); const on = e.on;
    if (on === 'static') { for (let y = 2; y < 11; y++) for (let x = 2; x < 12; x++) R(x, y, 1, 1, hash(x, y, (t * 30) | 0) < .5 ? '#ddd' : '#555'); }
    else if (on) { R(2, 2, 10, 9, '#4a6a8a'); R(3, 3, 4, 2, '#8ab'); } else R(2, 2, 10, 9, '#151a1c');
    R(13, 3, 2, 1, '#888'); R(13, 6, 2, 1, '#888'); R(4, 13, 8, 3, '#333');
  },
  fridge(g, e, t, R) { box(R, 1, -10, 14, 25, '#d6d4cb'); R(2, -3, 12, 1, '#a8a69d'); R(12, -8, 1, 4, '#888'); R(12, 0, 1, 6, '#888'); },
  stove(g, e, t, R) { box(R, 0, 1, 16, 14, '#bdbab2'); R(2, 3, 4, 3, '#333'); R(10, 3, 4, 3, '#333'); R(3, 9, 10, 4, '#555'); },
  counter(g, e, t, R) { box(R, 0, 1, 16, 14, e.col || '#8a7a62'); R(1, 2, 14, 2, shade(e.col || '#8a7a62', .2)); R(3, 7, 10, 1, shade(e.col || '#8a7a62', -.3)); R(7, 9, 2, 1, '#c9a35a'); },
  cabinet(g, e, t, R) { box(R, 0, -2, 16, 16, e.col || '#5a4030'); R(7, -1, 2, 14, shade(e.col || '#5a4030', -.4)); R(5, 4, 1, 2, '#c9a35a'); R(10, 4, 1, 2, '#c9a35a'); },
  dresser(g, e, t, R) { box(R, 0, 0, 16, 15, e.col || '#5a4030'); for (let i = 0; i < 3; i++) { R(1, 1 + i * 4, 14, 1, shade(e.col || '#5a4030', -.4)); R(7, 3 + i * 4, 2, 1, '#c9a35a'); } },
  shelf(g, e, t, R) { box(R, 0, -4, 16, 18, '#6a5038'); R(1, 3, 14, 1, '#3a2818'); for (let i = 0; i < 4; i++) R(2 + i * 3, -2, 2, 4, ['#a33', '#3a6', '#cc9', '#56a'][i]); for (let i = 0; i < 3; i++) R(2 + i * 4, 6, 3, 6, ['#8a6', '#a85', '#679'][i]); },
  lamp(g, e, t, R) { R(7, -2, 2, 16, '#333'); R(4, 13, 8, 2, '#333'); R(3, -8, 10, 7, e.off ? '#6a5a3a' : '#e8d08a'); R(4, -7, 8, 1, e.off ? '#7a6a4a' : '#fff0b0'); },
  candle(g, e, t, R) {
    R(6, 7, 4, 7, '#e8e2cc'); R(6, 7, 1, 7, '#f6f0dc'); R(5, 13, 6, 2, '#8a7a5a');
    if (!e.off) { const f = Math.sin(t * 17 + e.x) > 0 ? 0 : 1; R(7, 3 + f, 2, 4 - f, '#ffcf5a'); R(7, 5, 2, 2, '#fff2b0'); R(8, 2 + f, 1, 1, '#ff8a2a'); } else R(7, 6, 2, 1, '#333');
  },
  candles(g, e, t, R) { for (let i = 0; i < 3; i++) { const x = 2 + i * 5, h = 4 + (i % 2) * 3; R(x, 14 - h, 3, h, '#e8e2cc'); if (!e.off) { const f = Math.sin(t * 15 + i * 2) > 0 ? 1 : 0; R(x + 1, 11 - h + f, 1, 3 - f, '#ffcf5a'); } } },
  plant(g, e, t, R) { R(5, 9, 6, 6, '#8a4a2a'); R(4, 8, 8, 2, '#a05a32'); R(3, 1, 10, 8, '#2f5a2f'); R(5, -2, 6, 4, '#3a6a3a'); R(6, 2, 2, 2, '#4a7a4a'); },
  deadplant(g, e, t, R) { R(5, 9, 6, 6, '#6a3a22'); R(4, 8, 8, 2, '#7a4428'); R(7, 1, 1, 8, '#4a3a22'); R(5, 3, 2, 1, '#4a3a22'); R(8, 2, 3, 1, '#4a3a22'); },
  box(g, e, t, R) { box(R, 1, 3, 14, 12, '#9a7a4a'); R(1, 6, 14, 1, '#7a5a32'); R(7, 3, 2, 12, '#c9b48a'); },
  crate(g, e, t, R) { box(R, 0, 1, 16, 14, '#6a5032'); R(1, 7, 14, 1, '#4a3420'); R(1, 2, 1, 12, '#4a3420'); R(14, 2, 1, 12, '#4a3420'); },
  barrel(g, e, t, R) { box(R, 2, 0, 12, 15, '#6a4a2a'); R(2, 3, 12, 1, '#3a3a3a'); R(2, 11, 12, 1, '#3a3a3a'); },
  sack(g, e, t, R) { box(R, 3, 3, 10, 12, '#bca878'); R(5, 2, 6, 2, '#a89060'); },
  note(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(4, 6, 8, 7, '#e8e0c8'); R(5, 8, 6, 1, '#8a8070'); R(5, 10, 4, 1, '#8a8070'); if (!e.read) R(7, 1 + b, 2, 2, '#ffe680'); },
  paper(g, e, t, R) { R(4, 6, 8, 7, '#e8e0c8'); R(5, 8, 6, 1, '#8a8070'); R(5, 10, 4, 1, '#8a8070'); },
  newspaper(g, e, t, R) { R(2, 6, 12, 8, '#d6d0be'); R(3, 7, 10, 2, '#555'); R(3, 10, 4, 3, '#888'); R(8, 10, 5, 1, '#888'); R(8, 12, 5, 1, '#888'); },
  book(g, e, t, R) { R(4, 7, 8, 6, e.col || '#6a2a2a'); R(5, 8, 6, 1, '#c9a35a'); R(11, 7, 1, 6, '#e8e0c8'); },
  key(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(5, 8 + b, 4, 4, '#d9b84a'); R(6, 9 + b, 2, 2, '#7a5a1a'); R(9, 9 + b, 4, 2, '#d9b84a'); R(11, 11 + b, 1, 1, '#d9b84a'); },
  item(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(6, 7 + b, 4, 4, '#ffe680'); R(7, 6 + b, 2, 6, '#fff6c0'); R(5, 8 + b, 6, 2, '#fff6c0'); },
  sparkle(g, e, t, R) { const b = (Math.sin(t * 5 + e.x) + 1) / 2; if (b > .3) { R(7, 6, 2, 2, '#fff6c0'); R(7, 4, 2, 6, 'rgba(255,240,180,.6)'); R(5, 6, 6, 2, 'rgba(255,240,180,.6)'); } },
  phone(g, e, t, R) { R(3, 6, 10, 7, '#2a2a2a'); R(4, 4, 8, 3, '#1a1a1a'); R(5, 8, 6, 3, '#555'); },
  payphone(g, e, t, R) { box(R, 2, -8, 12, 22, '#2a6a3a'); R(4, -6, 8, 6, '#bbb'); R(5, 2, 6, 6, '#222'); },
  piano(g, e, t, R) { box(R, 0, -6, 32, 20, '#1a1414'); R(2, 4, 28, 4, '#eeeae0'); for (let i = 0; i < 9; i++) R(3 + i * 3, 4, 1, 2, '#111'); R(2, -4, 28, 2, '#2a2222'); },
  painting(g, e, t, R) { box(R, 2, 1, 12, 11, '#8a6a2a'); R(3, 2, 10, 9, e.col || '#3a4a3a'); R(6, 3, 4, 5, '#c8b8a0'); R(6, 3, 4, 2, '#2a2020'); if (e.eyes) { R(7, 5, 1, 1, '#ff3030'); R(9, 5, 1, 1, '#ff3030'); } },
  portrait(g, e, t, R) { box(R, 2, 0, 12, 13, '#3a2a1a'); R(3, 1, 10, 11, '#2a2a2a'); R(5, 3, 6, 7, '#c8b8a0'); R(5, 2, 6, 2, '#1a1414'); R(6, 5, 1, 1, e.eyes ? '#ff3030' : '#222'); R(9, 5, 1, 1, e.eyes ? '#ff3030' : '#222'); },
  poster(g, e, t, R) { R(3, 1, 10, 12, e.col || '#c8b88a'); R(4, 3, 8, 2, '#7a3a2a'); R(4, 7, 8, 1, '#555'); R(4, 9, 6, 1, '#555'); },
  blackboard(g, e, t, R) { box(R, -8, 0, 32, 13, '#4a3a22'); R(-7, 1, 30, 11, '#1f3a2a'); if (e.text) { R(-4, 4, 10, 1, '#cfd8cc'); R(-4, 7, 16, 1, '#cfd8cc'); R(10, 4, 6, 1, '#cfd8cc'); } },
  locker(g, e, t, R) { box(R, 0, -10, 16, 25, '#5a6a7a'); R(7, -9, 1, 23, '#3a4a5a'); for (let i = 0; i < 3; i++) R(2, -7 + i * 2, 4, 1, '#3a4a5a'); for (let i = 0; i < 3; i++) R(9, -7 + i * 2, 4, 1, '#3a4a5a'); },
  getabako(g, e, t, R) { box(R, 0, -8, 16, 23, '#7a6040'); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) box(R, 1 + c * 7, -7 + r * 5, 7, 5, '#a08058'); },
  vending(g, e, t, R) { box(R, 0, -12, 16, 27, e.col || '#a83030'); R(2, -10, 12, 10, '#d8e4ea'); for (let i = 0; i < 4; i++) R(3 + i * 3, -8, 2, 6, ['#3a6', '#c93', '#36a', '#a3a'][i]); R(3, 3, 10, 3, '#222'); R(11, -1, 2, 2, '#ff6'); },
  streetlamp(g, e, t, R) { R(7, -26, 2, 41, '#3a3d42'); R(4, 13, 8, 2, '#2a2d32'); R(3, -28, 10, 3, '#3a3d42'); R(4, -25, 8, 2, e.off ? '#555' : (Math.random() < (e.flicker ? .08 : 0) ? '#555' : '#ffeaa0')); },
  sign(g, e, t, R) { R(7, -2, 2, 16, '#555'); box(R, 1, -10, 14, 9, e.col || '#2a5a8a'); R(3, -7, 10, 1, '#eee'); R(3, -4, 7, 1, '#eee'); },
  busstop(g, e, t, R) { R(7, -14, 2, 28, '#666'); R(2, -22, 12, 10, '#e8e4d0'); R(3, -21, 10, 3, '#b33'); R(3, -16, 10, 1, '#333'); R(3, -14, 7, 1, '#333'); },
  bench(g, e, t, R) { R(1, 9, 2, 6, '#333'); R(29, 9, 2, 6, '#333'); box(R, 0, 4, 32, 6, '#7a5a3a'); R(0, 1, 32, 3, '#6a4a2a'); },
  busseat(g, e, t, R) { box(R, 1, 0, 14, 7, e.col || '#2c4c7c'); box(R, 1, 6, 14, 8, shade(e.col || '#2c4c7c', .1)); },
  pole(g, e, t, R) { R(7, -16, 2, 32, '#c9c9c9'); R(7, -16, 1, 32, '#eee'); },
  car(g, e, t, R) {   // 横向停放 2×1
    const c = e.col || '#7a1f22';
    R(1, 13, 30, 2, 'rgba(0,0,0,.4)'); box(R, 0, 2, 32, 12, c); R(8, 3, 14, 10, shade(c, -.15)); R(10, 4, 4, 8, '#1a2a3a'); R(16, 4, 5, 8, '#1a2a3a'); R(30, 4, 2, 3, '#ffeeaa'); R(30, 9, 2, 3, '#ffeeaa'); R(0, 4, 1, 3, '#a01010'); R(0, 9, 1, 3, '#a01010');
  },
  gravestone(g, e, t, R) { R(3, 1, 10, 13, '#6a6a68'); R(4, 0, 8, 2, '#6a6a68'); R(4, 2, 8, 11, '#7d7d7a'); R(6, 4, 4, 1, '#4a4a48'); R(6, 7, 4, 1, '#4a4a48'); R(2, 13, 12, 2, '#3a3a38'); if (e.coat) { R(2, 4, 12, 9, '#3a3a5a'); R(3, 5, 4, 7, '#4a4a6a'); } if (e.flowers) { R(4, 13, 2, 2, '#e8a030'); R(9, 13, 2, 2, '#e85030'); } },
  cross(g, e, t, R) { R(7, -6, 2, 20, '#5a5a58'); R(3, -2, 10, 2, '#5a5a58'); R(5, 13, 6, 2, '#3a3a38'); },
  well(g, e, t, R) { box(R, 0, 2, 16, 13, '#5a5754'); R(2, 4, 12, 8, '#0a0a0c'); R(1, -10, 2, 14, '#4a3420'); R(13, -10, 2, 14, '#4a3420'); R(0, -12, 16, 3, '#3a2818'); },
  lantern(g, e, t, R) { R(7, -6, 2, 4, '#333'); box(R, 4, -2, 8, 10, e.off ? '#6a4a3a' : '#e8a050'); R(4, 1, 8, 1, '#a04020'); R(4, 5, 8, 1, '#a04020'); },
  stonelantern(g, e, t, R) { R(5, 8, 6, 7, '#6a6a66'); R(3, 1, 10, 3, '#7a7a76'); R(5, 4, 6, 4, '#555'); R(6, 5, 4, 2, e.off ? '#333' : '#ffcf7a'); R(4, -1, 8, 2, '#7a7a76'); },
  torii(g, e, t, R) { R(2, -20, 3, 35, '#a8301e'); R(27, -20, 3, 35, '#a8301e'); R(-2, -24, 36, 3, '#2a1a14'); R(0, -21, 32, 2, '#a8301e'); R(0, -15, 32, 2, '#a8301e'); },
  shrine(g, e, t, R) { R(-4, -10, 40, 4, '#3a2a20'); box(R, 0, -6, 32, 20, '#6a4a30'); R(10, 0, 12, 14, '#2a1a10'); R(14, -4, 4, 3, '#c9a35a'); },
  ofrenda(g, e, t, R) { box(R, 0, -2, 32, 16, '#6a3a5a'); R(0, -2, 32, 2, '#e85a8a'); R(2, -8, 28, 6, '#8a4a6a'); for (let i = 0; i < 6; i++) R(3 + i * 5, -7, 2, 3, ['#e8a030', '#fff'][i % 2]); R(12, 2, 8, 8, '#d8d0c0'); R(13, 3, 6, 5, '#5a4a3a'); for (let i = 0; i < 3; i++) { R(4 + i * 10, 10, 2, 3, '#e8e2cc'); const f = Math.sin(t * 13 + i) > 0 ? 1 : 0; R(4 + i * 10, 8 + f, 2, 2 - f, '#ffcf5a'); } },
  marigold(g, e, t, R) { R(7, 8, 1, 6, '#3a6a2a'); R(5, 5, 5, 4, '#e88a20'); R(6, 6, 3, 2, '#f8b040'); },
  boat(g, e, t, R) { R(0, 4, 32, 9, '#4a3220'); R(2, 5, 28, 6, '#2a1c12'); R(4, 7, 24, 1, '#5a4230'); },
  dock(g, e, t, R) { R(0, 0, 16, 16, '#5a4430'); for (let y = 3; y < 16; y += 4) R(0, y, 16, 1, '#3a2a1e'); },
  fireplace(g, e, t, R) { box(R, -2, -10, 36, 25, '#5a4a44'); R(6, -2, 20, 16, '#120a08'); for (let i = 0; i < 5; i++) { const h = 3 + ((Math.sin(t * 9 + i * 1.7) + 1) * 3) | 0; R(8 + i * 3, 13 - h, 3, h, i % 2 ? '#ff8a2a' : '#ffcf5a'); } R(-2, -12, 36, 3, '#3a2a24'); },
  chess(g, e, t, R) { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R(3 + i * 2.5, 3 + j * 2.5, 2.5, 2.5, (i + j) % 2 ? '#222' : '#ddd'); R(5, 1, 1, 3, '#eee'); R(10, 2, 1, 3, '#111'); },
  statue(g, e, t, R) { R(3, 10, 10, 5, '#5a5a58'); R(5, -6, 6, 16, '#7a7a76'); R(6, -10, 4, 5, '#8a8a86'); },
  anatomy(g, e, t, R) { R(7, 12, 2, 3, '#555'); R(4, 14, 8, 1, '#555'); R(5, -2, 6, 14, '#d8c0a0'); R(8, -2, 3, 14, '#b05050'); R(6, -8, 4, 6, '#d8c0a0'); R(8, -8, 2, 6, '#b05050'); R(7, -6, 1, 1, e.eyes ? '#ff3030' : '#222'); },
  doll(g, e, t, R) { const c = e.col || '#d8c8b0'; R(5, 3, 6, 6, c); R(4, 2, 2, 2, c); R(10, 2, 2, 2, c); R(6, 5, 1, 1, '#111'); R(9, 5, 1, 1, '#111'); R(4, 9, 8, 6, c); R(3, 10, 2, 3, c); R(11, 10, 2, 3, c); if (e.thread) { R(7, 9, 1, 6, '#c01818'); R(6, 11, 3, 1, '#c01818'); } if (e.knife) { R(9, 8, 1, 4, '#ccc'); R(9, 12, 1, 2, '#4a3020'); } },
  knife(g, e, t, R) { R(5, 9, 6, 1, '#d8d8d8'); R(5, 8, 5, 1, '#eee'); R(11, 8, 3, 3, '#4a3020'); },
  scissors(g, e, t, R) { R(5, 5, 1, 7, '#ccc'); R(9, 5, 1, 7, '#ccc'); R(4, 12, 3, 3, '#a33'); R(8, 12, 3, 3, '#a33'); },
  cup(g, e, t, R) { R(5, 7, 6, 7, '#e8e8e8'); R(6, 8, 4, 2, e.full ? '#9fc3d3' : '#ccc'); R(11, 9, 2, 3, '#e8e8e8'); },
  salt(g, e, t, R) { R(5, 4, 6, 10, '#e8e8e8'); R(5, 4, 6, 2, '#3a6aa8'); R(6, 8, 4, 2, '#3a6aa8'); },
  rice(g, e, t, R) { box(R, 3, 3, 10, 11, '#e8e2cc'); R(4, 6, 8, 3, '#a33'); },
  thread(g, e, t, R) { R(5, 6, 6, 7, '#c01818'); R(5, 5, 6, 1, '#8a6a4a'); R(5, 13, 6, 1, '#8a6a4a'); },
  paw(g, e, t, R) { R(5, 6, 6, 4, '#4a3a2a'); R(4, 9, 2, 4, '#4a3a2a'); R(7, 10, 1, 4, '#4a3a2a'); R(10, 9, 2, 4, '#4a3a2a'); R(10, 4, 2, 3, '#3a2a1a'); },
  candy(g, e, t, R) { R(5, 6, 6, 6, '#d8a030'); R(6, 7, 2, 2, '#f8d070'); R(7, 12, 2, 3, '#e8e2cc'); },
  coin(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(6, 7 + b, 4, 4, '#c9a35a'); R(7, 8 + b, 2, 2, '#8a6a2a'); },
  flashlight(g, e, t, R) { R(4, 8, 7, 3, '#333'); R(10, 7, 3, 5, '#555'); R(12, 8, 1, 3, '#ffeaa0'); },
  match(g, e, t, R) { box(R, 4, 7, 8, 5, '#a83030'); R(5, 8, 6, 3, '#c8b88a'); },
  towel(g, e, t, R) { R(3, 2, 10, 12, e.col || '#e8e2d6'); R(3, 12, 10, 2, shade(e.col || '#e8e2d6', -.15)); },
  rope(g, e, t, R) { R(4, 6, 8, 8, '#a08a5a'); R(6, 8, 4, 4, '#3a3020'); },
  photo(g, e, t, R) { R(4, 5, 8, 9, '#e8e4d8'); R(5, 6, 6, 5, '#6a6a7a'); R(7, 7, 2, 3, '#ccc'); },
  shoes(g, e, t, R) { R(3, 10, 4, 3, e.col || '#a01818'); R(9, 11, 4, 3, e.col || '#a01818'); R(5, 9, 1, 2, e.col || '#a01818'); R(11, 10, 1, 2, e.col || '#a01818'); },
  footprints(g, e, t, R) { const c = e.col || 'rgba(120,10,10,.7)'; R(3, 3, 3, 4, c); R(10, 9, 3, 4, c); },
  stain(g, e, t, R) { const c = e.col || 'rgba(90,10,10,.75)'; R(3, 6, 10, 5, c); R(5, 4, 5, 9, c); R(12, 9, 2, 2, c); },
  puddle(g, e, t, R) { R(2, 6, 12, 6, 'rgba(110,140,160,.45)'); R(4, 7, 4, 1, 'rgba(200,220,235,.5)'); },
  handprint(g, e, t, R) { const c = e.col || 'rgba(140,10,10,.8)'; R(5, 5, 6, 5, c); for (let i = 0; i < 4; i++) R(5 + i * 1.6, 1 + (i === 0 || i === 3 ? 1 : 0), 1, 4, c); R(11, 6, 2, 1, c); },
  elevdoor(g, e, t, R) {   // 电梯门（墙面），open=0..1
    const o = e.open || 0; R(0, -4, 16, 18, '#3a3d42'); R(1, -3, 14, 17, '#0a0a0c');
    const w = Math.round(7 * (1 - o)); R(1, -3, w, 17, '#8d939b'); R(15 - w, -3, w, 17, '#8d939b'); if (w) { R(1, -3, 1, 17, '#a8aeb6'); R(15 - w, -3, 1, 17, '#a8aeb6'); }
    R(5, -7, 6, 3, '#111'); R(6, -6, 4, 1, e.lit ? '#ff6a3a' : '#552');
  },
  elevpanel(g, e, t, R) { box(R, 4, 0, 8, 12, '#9aa0a8'); for (let i = 0; i < 5; i++) { R(6, 2 + i * 2, 1, 1, '#333'); R(9, 2 + i * 2, 1, 1, '#333'); } },
  cushion(g, e, t, R) { box(R, 2, 4, 12, 10, e.col || '#8a3a3a'); },
  altar(g, e, t, R) { box(R, 0, 0, 32, 14, '#5a2a1a'); R(2, 2, 28, 2, '#8a4a2a'); R(13, -8, 6, 10, '#2a1a10'); R(14, -7, 4, 6, '#c9a35a'); },
  incense(g, e, t, R) { R(5, 10, 6, 5, '#7a5a3a'); R(7, 3, 1, 7, '#8a3a2a'); R(9, 4, 1, 6, '#8a3a2a'); R(7, 1 + Math.sin(t * 2) * 1, 1, 2, 'rgba(220,220,220,.5)'); },
  scroll(g, e, t, R) { R(3, 0, 10, 14, '#e8dcc0'); R(2, 0, 12, 1, '#5a3a22'); R(2, 13, 12, 1, '#5a3a22'); R(6, 3, 4, 1, '#222'); R(5, 5, 6, 1, '#222'); R(6, 8, 4, 1, '#222'); },
  brush(g, e, t, R) { R(3, 9, 9, 1, '#6a4a2a'); R(12, 8, 2, 3, '#111'); },
  skin(g, e, t, R) { R(0, 2, 32, 12, 'rgba(232,206,178,.95)'); R(4, 4, 6, 4, '#d0b090'); R(12, 3, 18, 2, '#2a1a14'); R(2, 6, 2, 5, '#2a1a14'); },
  whisk(g, e, t, R) { R(7, 2, 2, 6, '#6a4a2a'); for (let i = 0; i < 5; i++) R(5 + i, 8, 1, 7, '#e8e4d8'); },
  basket(g, e, t, R) { box(R, 2, 6, 12, 9, '#a07a40'); R(4, 2, 8, 1, '#a07a40'); R(3, 3, 1, 4, '#a07a40'); R(12, 3, 1, 4, '#a07a40'); },
  stall2(g, e, t, R) { R(-2, -14, 36, 5, e.col || '#8a2a2a'); for (let i = 0; i < 6; i++) R(-2 + i * 6, -9, 3, 2, shade(e.col || '#8a2a2a', .2)); R(0, -9, 2, 23, '#4a3420'); R(30, -9, 2, 23, '#4a3420'); box(R, 0, 2, 32, 12, '#6a4a30'); },
  cart(g, e, t, R) { box(R, 0, 1, 32, 10, '#6a4a2a'); R(3, 9, 6, 6, '#3a2a1a'); R(23, 9, 6, 6, '#3a2a1a'); },
  stairsdown(g, e, t, R) { for (let i = 0; i < 4; i++) R(0, i * 4, 16, 4, shade('#5a4030', -i * .2)); for (let i = 0; i < 4; i++) R(0, i * 4 + 3, 16, 1, '#1a1008'); },
  stairsup(g, e, t, R) { for (let i = 0; i < 4; i++) R(0, i * 4, 16, 4, shade('#6a4a34', -(3 - i) * .15)); for (let i = 0; i < 4; i++) R(0, i * 4, 16, 1, shade('#8a6a4a', -(3 - i) * .1)); },
  rail(g, e, t, R) { R(0, 2, 16, 2, '#4a3020'); R(2, 4, 1, 10, '#4a3020'); R(8, 4, 1, 10, '#4a3020'); R(14, 4, 1, 10, '#4a3020'); },
  switch(g, e, t, R) { R(6, 4, 4, 6, '#d8d4c8'); R(7, e.off ? 7 : 5, 2, 2, '#888'); },
  linen(g, e, t, R) { box(R, 0, -10, 16, 25, '#d8d0bc'); R(7, -9, 2, 23, '#a89e88'); if (e.open) { R(1, -9, 14, 23, '#2a2420'); R(2, -6, 12, 3, '#e8e2d6'); R(2, -1, 12, 3, '#c8d8e8'); R(2, 4, 12, 3, '#e8d8d8'); } else { R(5, 0, 1, 3, '#888'); R(10, 0, 1, 3, '#888'); } },
  invisible() { }
});
