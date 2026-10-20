/* ===================== drawing helpers (Canvas 2D) ===================== */
BX.C = {
  ink: '#2b2118', ink2: '#5e4b38', paper: '#f3e9d2', paper2: '#eadcbc', paper3: '#dcc9a0',
  red: '#b23a2b', red2: '#d0533f', jade: '#3f7f6b', jade2: '#5aa08a', gold: '#c8a052', gold2: '#e6c57d',
  wood: '#c9955a', wood2: '#a8723d', wood3: '#6b4426', dark: '#2a190d', felt: '#2f6b4f', felt2: '#245a42',
  blue: '#2f5d8a', sky: '#7fb3d5', purple: '#6c4a8a', orange: '#d9822b', white: '#fffaf0', black: '#1b1510',
  seat: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b', '#7a4a9a', '#3a9aa0'],   // default seat colors
};
BX.F = {
  serif: '"Noto Serif SC","Songti SC","STSong","SimSun",serif',
  deco: '"ZCOOL XiaoWei","Noto Serif SC","Songti SC",serif',
  sans: '-apple-system,"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei",sans-serif',
  mono: 'ui-monospace,Menlo,Consolas,monospace',
};
BX.draw = (function () {
  const D = {};
  D.rr = (g, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  D.circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
  /* text(g, str, x, y, {size, color, font('serif'|'sans'|'deco'|css), weight, align, base, stroke, strokeW, shadow, maxW}) */
  D.text = (g, s, x, y, o = {}) => {
    const fam = BX.F[o.font || 'sans'] || o.font;
    g.font = `${o.italic ? 'italic ' : ''}${o.weight || 600} ${o.size || 16}px ${fam}`;
    g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
    if (o.shadow) { g.save(); g.shadowColor = o.shadow === true ? 'rgba(0,0,0,.45)' : o.shadow; g.shadowBlur = o.blur || 4; g.shadowOffsetY = o.dy != null ? o.dy : 1; }
    if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.strokeW || 3; g.strokeStyle = o.stroke; g.strokeText(s, x, y, o.maxW); }
    g.fillStyle = o.color || BX.C.ink; g.fillText(s, x, y, o.maxW);
    if (o.shadow) g.restore();
  };
  /* deterministic wood grain rectangle */
  D.wood = (g, x, y, w, h, o = {}) => {
    const base = o.base || BX.C.wood, dark = o.dark || BX.C.wood2, seed = o.seed || 7;
    g.save(); if (o.r) { D.rr(g, x, y, w, h, o.r); g.clip(); }
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, base); gr.addColorStop(.5, shade(base, 8)); gr.addColorStop(1, shade(base, -10));
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    const r = BX.rng(seed); g.globalAlpha = o.grain != null ? o.grain : .18; g.strokeStyle = dark; g.lineWidth = 1;
    const n = Math.max(6, Math.round((o.vertical ? w : h) / 7));
    for (let i = 0; i < n; i++) {
      g.beginPath(); const off = r() * (o.vertical ? w : h), amp = 2 + r() * 5, fr = .004 + r() * .01, ph = r() * 6;
      if (o.vertical) { for (let t = 0; t <= h; t += 8) { const xx = x + off + Math.sin(t * fr + ph) * amp; t ? g.lineTo(xx, y + t) : g.moveTo(xx, y); } }
      else { for (let t = 0; t <= w; t += 8) { const yy = y + off + Math.sin(t * fr + ph) * amp; t ? g.lineTo(x + t, yy) : g.moveTo(x, yy); } }
      g.lineWidth = .5 + r() * 1.6; g.stroke();
    }
    g.restore();
  };
  D.paper = (g, x, y, w, h, o = {}) => {
    g.save(); if (o.r) { D.rr(g, x, y, w, h, o.r); g.clip(); }
    const gr = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .2, x + w / 2, y + h / 2, Math.max(w, h) * .75);
    gr.addColorStop(0, o.color || BX.C.paper); gr.addColorStop(1, shade(o.color || BX.C.paper, -10));
    g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
  };
  D.felt = (g, x, y, w, h, o = {}) => {
    const c = o.color || BX.C.felt; const gr = g.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, Math.max(w, h) * .7);
    gr.addColorStop(0, shade(c, 12)); gr.addColorStop(1, shade(c, -18)); g.fillStyle = gr;
    if (o.r) { D.rr(g, x, y, w, h, o.r); g.fill(); } else g.fillRect(x, y, w, h);
  };
  /* shaded disc (go stone / checker / ball). color css; o.flat, o.ring, o.shadow */
  D.disc = (g, x, y, r, color, o = {}) => {
    if (o.shadow !== false) { g.save(); g.fillStyle = 'rgba(0,0,0,.28)'; D.circle(g, x + r * .1, y + r * .16, r); g.fill(); g.restore(); }
    const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    gr.addColorStop(0, shade(color, o.flat ? 8 : 38)); gr.addColorStop(.55, color); gr.addColorStop(1, shade(color, -28));
    g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
    if (o.ring) { g.lineWidth = Math.max(1, r * .1); g.strokeStyle = o.ring; D.circle(g, x, y, r * .78); g.stroke(); }
  };
  D.stone = (g, x, y, r, white) => D.disc(g, x, y, r, white ? '#ece8df' : '#1c1a18', {});
  /* round wooden piece with a character (中国象棋 style) */
  D.piece = (g, x, y, r, ch, color, o = {}) => {
    g.save();
    g.fillStyle = 'rgba(0,0,0,.35)'; D.circle(g, x + r * .06, y + r * .14, r); g.fill();
    const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
    gr.addColorStop(0, o.face2 || '#fbe8c4'); gr.addColorStop(1, o.face || '#d9b27a');
    g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
    g.lineWidth = r * .07; g.strokeStyle = shade(o.face || '#d9b27a', -35); g.stroke();
    g.lineWidth = r * .06; g.strokeStyle = color; D.circle(g, x, y, r * .8); g.stroke();
    D.text(g, ch, x, y + r * .04, {size: r * 1.05, color, font: 'serif', weight: 900});
    if (o.sel) { g.lineWidth = r * .12; g.strokeStyle = o.sel === true ? '#ffd76a' : o.sel; D.circle(g, x, y, r * 1.08); g.stroke(); }
    g.restore();
  };
  /* playing card. card = {r:1..13 (1=A), s:0..3 (♠♥♣♦)} or {joker:'big'|'small'} or null(back). */
  const SUIT = ['♠', '♥', '♣', '♦'], RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  D.SUIT = SUIT; D.RANK = RANK;
  D.suitColor = s => (s === 1 || s === 3) ? '#c0291f' : '#1d1a17';
  D.card = (g, x, y, w, h, card, o = {}) => {
    const r = Math.max(3, w * .09);
    g.save();
    if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = w * .08; g.shadowOffsetY = w * .03; }
    D.rr(g, x, y, w, h, r);
    if (!card) { // back
      g.fillStyle = o.backColor || '#8a2a20'; g.fill(); g.shadowColor = 'transparent';
      g.lineWidth = w * .045; g.strokeStyle = '#f3e2c0'; D.rr(g, x + w * .08, y + w * .08, w - w * .16, h - w * .16, r * .6); g.stroke();
      g.save(); D.rr(g, x + w * .12, y + w * .12, w - w * .24, h - w * .24, r * .4); g.clip();
      g.strokeStyle = 'rgba(243,226,192,.35)'; g.lineWidth = Math.max(1, w * .02);
      for (let i = -h; i < w + h; i += w * .12) { g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + h, y + h); g.stroke(); g.beginPath(); g.moveTo(x + i + h, y); g.lineTo(x + i, y + h); g.stroke(); }
      g.restore();
      D.text(g, o.backText || '戏', x + w / 2, y + h / 2, {size: w * .38, color: '#f3e2c0', font: 'deco', weight: 400});
      g.restore(); return;
    }
    g.fillStyle = o.face || '#fffaf0'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke();
    if (card.joker) {
      const col = card.joker === 'big' ? '#c0291f' : '#1d1a17';
      const fs = w * .2; const lbl = 'JOKER';
      for (let i = 0; i < 5; i++) D.text(g, lbl[i], x + w * .13, y + h * .13 + i * fs * .95, {size: fs * .85, color: col, weight: 800});
      D.text(g, card.joker === 'big' ? '大' : '小', x + w * .58, y + h * .42, {size: w * .45, color: col, font: 'serif', weight: 900});
      D.text(g, '王', x + w * .58, y + h * .7, {size: w * .45, color: col, font: 'serif', weight: 900});
    } else {
      const col = D.suitColor(card.s), rk = RANK[card.r], su = SUIT[card.s];
      const fs = w * (rk === '10' ? .26 : .3);
      D.text(g, rk, x + w * .16, y + h * .12, {size: fs, color: col, weight: 800, font: 'sans'});
      D.text(g, su, x + w * .16, y + h * .12 + fs * .95, {size: w * .22, color: col});
      if (!o.mini) {
        g.save(); g.translate(x + w, y + h); g.rotate(Math.PI);
        D.text(g, rk, w * .16, h * .12, {size: fs, color: col, weight: 800}); D.text(g, su, w * .16, h * .12 + fs * .95, {size: w * .22, color: col});
        g.restore();
        if (card.r > 10) {
          g.fillStyle = card.s % 2 ? 'rgba(192,41,31,.08)' : 'rgba(29,26,23,.07)'; D.rr(g, x + w * .26, y + h * .2, w * .48, h * .6, w * .06); g.fill();
          g.strokeStyle = col; g.lineWidth = 1; g.stroke();
          D.text(g, ['', '', '', '', '', '', '', '', '', '', '', '侍', '后', '王'][card.r], x + w / 2, y + h * .44, {size: w * .38, color: col, font: 'serif', weight: 900});
          D.text(g, su, x + w / 2, y + h * .66, {size: w * .24, color: col});
        } else D.text(g, su, x + w * .56, y + h * .56, {size: w * (card.r === 1 ? .62 : .44), color: col});
      }
    }
    if (o.sel) { g.lineWidth = Math.max(2, w * .05); g.strokeStyle = o.sel === true ? '#e0a020' : o.sel; D.rr(g, x - 1, y - 1, w + 2, h + 2, r); g.stroke(); }
    if (o.dim) { g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, x, y, w, h, r); g.fill(); }
    g.restore();
  };
  /* die face 1..6 */
  const PIPS = {1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.27, .27], [.5, .5], [.73, .73]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.27, .27], [.73, .27], [.5, .5], [.27, .73], [.73, .73]], 6: [[.27, .25], [.73, .25], [.27, .5], [.73, .5], [.27, .75], [.73, .75]]};
  D.die = (g, x, y, s, v, o = {}) => {
    g.save(); g.translate(x + s / 2, y + s / 2); if (o.rot) g.rotate(o.rot); g.translate(-s / 2, -s / 2);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = s * .12; g.shadowOffsetY = s * .06;
    D.rr(g, 0, 0, s, s, s * .18); const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, o.color || '#fffaf0'); gr.addColorStop(1, shade(o.color || '#fffaf0', -14)); g.fillStyle = gr; g.fill();
    g.shadowColor = 'transparent'; if (o.sel) { g.lineWidth = s * .08; g.strokeStyle = o.sel === true ? '#e0a020' : o.sel; g.stroke(); }
    const pc = o.pip || ((v === 1 || v === 4) && !o.color ? '#c0291f' : '#1d1a17');
    for (const [px, py] of PIPS[v] || []) { g.fillStyle = pc; D.circle(g, px * s, py * s, s * (v === 1 ? .12 : .085)); g.fill(); }
    g.restore();
  };
  /* simple lobby-icon helper: colored background + big glyph(s) */
  D.iconBase = (g, w, h, c1, c2) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2 || shade(c1, -25)); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  D.glyphIcon = (g, w, h, ch, c1, c2, fg = '#fbe9d0') => { D.iconBase(g, w, h, c1, c2); D.text(g, ch, w / 2, h / 2 + h * .03, {size: h * .55, color: fg, font: 'deco', weight: 400, shadow: 'rgba(0,0,0,.3)'}); };
  /* grid lines helper */
  D.grid = (g, x, y, cols, rows, cell, color, lw = 1) => { g.strokeStyle = color; g.lineWidth = lw; g.beginPath(); for (let i = 0; i <= cols; i++) { g.moveTo(x + i * cell, y); g.lineTo(x + i * cell, y + rows * cell); } for (let j = 0; j <= rows; j++) { g.moveTo(x, y + j * cell); g.lineTo(x + cols * cell, y + j * cell); } g.stroke(); };
  /* glow marker for legal-move hints */
  D.hint = (g, x, y, r, color = 'rgba(63,160,120,.55)') => { g.fillStyle = color; D.circle(g, x, y, r); g.fill(); };
  /* color shade: pct -100..100 */
  function shade(c, p) {
    let r, gg, b; if (c[0] === '#') { let s = c.slice(1); if (s.length === 3) s = s.split('').map(q => q + q).join(''); r = parseInt(s.slice(0, 2), 16); gg = parseInt(s.slice(2, 4), 16); b = parseInt(s.slice(4, 6), 16); } else return c;
    const f = p / 100; const m = v => Math.round(BX.clamp(f >= 0 ? v + (255 - v) * f : v * (1 + f), 0, 255));
    return '#' + [m(r), m(gg), m(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  D.shade = shade;
  D.alpha = (c, a) => { if (c[0] !== '#') return c; let s = c.slice(1); if (s.length === 3) s = s.split('').map(q => q + q).join(''); return `rgba(${parseInt(s.slice(0, 2), 16)},${parseInt(s.slice(2, 4), 16)},${parseInt(s.slice(4, 6), 16)},${a})`; };
  return D;
})();
